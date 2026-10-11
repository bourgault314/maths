#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fabrique la vidéo « Comment on joue à SPLAT! » à télécharger (MP4), à partir du film animé
du site (outils/splat_intro.html, film d'introduction).

    python3 render_video.py

Produit, à la racine du dépôt :
    outils/splat_comment_on_joue.mp4     1920 × 1080, 30 images/s, H.264, sans son

Le film n'est pas filmé à l'écran : tout son dessin est une fonction du temps
(FILMS.intro.render(t)), donc chaque image est calculée pour son instant exact, puis
photographiée et passée à ffmpeg. Le résultat est net et identique d'une fabrication à l'autre.

Aux trois questions du film (« Combien de jetons vois-tu ? »…), le film en ligne s'arrête et
attend qu'on relance ; la vidéo, elle, garde la question affichée PAUSE_QUESTION secondes
(3 s, décision de Gwenaël du 11/10/2026) : pour laisser chercher plus longtemps, on met pause.

Prérequis : pip install --break-system-packages playwright==1.56.0 ; ffmpeg dans le PATH.
"""
import functools
import http.server
import pathlib
import subprocess
import threading

from playwright.sync_api import sync_playwright

ICI = pathlib.Path(__file__).resolve().parent
RACINE = ICI.parent.parent
SORTIE = RACINE / "outils" / "splat_comment_on_joue.mp4"
IPS = 30                  # images par seconde
PAUSE_QUESTION = 3.0      # secondes d'arrêt sur chacune des trois questions
PAUSE_FIN = 2.0           # l'écran « À toi de jouer » reste un peu à la fin
ECHELLE = 1.2             # scène 1600 × 900 → vidéo 1920 × 1080

# Seule la scène compte : ni bouton ▶, ni bulle « À toi de chercher », ni ligne du bas, ni coins arrondis.
CSS_VIDEO = """
  .page{padding:0!important;display:block!important}
  .player{max-width:none!important;gap:0!important}
  .stage{width:1600px!important;height:900px!important;min-width:0!important;border-radius:0!important;box-shadow:none!important}
  .bigplay,.pill,.pied{display:none!important}
"""


def servir():
    gestion = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RACINE))
    serveur = http.server.ThreadingHTTPServer(("127.0.0.1", 0), gestion)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    return serveur


def instants(duree, arrets):
    """La liste des instants du film à photographier, une par image de la vidéo."""
    liste, k, arrets = [], 0, sorted(arrets)
    while True:
        t = k / IPS
        if t > duree:
            break
        while arrets and t >= arrets[0]:
            liste += [arrets[0]] * round(PAUSE_QUESTION * IPS)
            arrets.pop(0)
        liste.append(t)
        k += 1
    liste += [duree] * round(PAUSE_FIN * IPS)
    return liste


def main():
    serveur = servir()
    adresse = f"http://127.0.0.1:{serveur.server_address[1]}/outils/splat_intro.html"
    with sync_playwright() as p:
        nav = p.chromium.launch(channel="chromium")
        page = nav.new_page(viewport={"width": 1600, "height": 900}, device_scale_factor=ECHELLE)
        page.goto(adresse, wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        page.add_style_tag(content=CSS_VIDEO)
        # « ↺ Revoir le film » de l'écran de fin est un lien du lecteur : dans une vidéo, il ne mène nulle part.
        page.evaluate("""() => document.querySelectorAll('#svg text').forEach(e => {
          if (e.textContent.includes('Revoir le film')) e.setAttribute('visibility', 'hidden'); })""")
        page.wait_for_timeout(300)
        duree, arrets = page.evaluate("[FILMS.intro.duration, (FILMS.intro.stops || []).map(s => s.t)]")
        liste = instants(duree, arrets)
        boite = page.locator("#svg").bounding_box()
        cadre = {"x": boite["x"], "y": boite["y"], "width": 1600, "height": 900}
        ffmpeg = subprocess.Popen([
            "ffmpeg", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(IPS), "-i", "-",
            "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-tune", "animation",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-metadata", "title=Comment on joue à SPLAT! — mathsgo.re",
            str(SORTIE)], stdin=subprocess.PIPE)
        precedent, image = None, None
        for t in liste:
            if t != precedent:  # une image qui se répète (pause) n'est photographiée qu'une fois
                page.evaluate("t => FILMS.intro.render(t)", t)
                image = page.screenshot(clip=cadre, type="png")
                precedent = t
            ffmpeg.stdin.write(image)
        ffmpeg.stdin.close()
        assert ffmpeg.wait() == 0, "ffmpeg a échoué"
        nav.close()
    serveur.shutdown()
    print(f"{SORTIE.relative_to(RACINE)} : {len(liste) / IPS:.1f} s, {len(liste)} images, "
          f"{SORTIE.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
