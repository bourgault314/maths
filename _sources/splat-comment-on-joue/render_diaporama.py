#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fabrique le diaporama « Comment on joue à SPLAT! » à télécharger (PDF), à partir de
diaporama.html : le diaporama d'introduction tel qu'il était en ligne du 26/08 au 10/10/2026
(outils/splat_intro.html avant la PR #961, qui l'a remplacé par le film animé).

    python3 render_diaporama.py

Produit, à la racine du dépôt :
    outils/splat_comment_on_joue_diaporama.pdf   10 pages 4:3, s'ouvre en plein écran, fondu entre les pages

La page n'est pas redessinée : chaque diapo est imprimée telle qu'elle s'affichait.
Seules différences, propres au papier (11/10/2026) :
  - la diapo « SPLAT ! » donne deux pages : le mot, puis la tache tombée (à l'écran, elle tombait
    toute seule après 1,4 s) ;
  - le bouton « Je joue ▶ » de la dernière diapo mène à l'univers SPLAT! en ligne ;
  - sous chaque diapo, la ligne de crédit de la page, complétée : les images de Steve Wyborney
    ne sont pas sous la licence du site (décision de Gwenaël, 11/10/2026).

Prérequis : pip install --break-system-packages playwright==1.56.0 pypdf
(la recette « vrai Chromium » des livrets : channel="chromium", pas le headless shell).
"""
import functools
import http.server
import pathlib
import threading

from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject, FloatObject, NameObject

ICI = pathlib.Path(__file__).resolve().parent
RACINE = ICI.parent.parent
SORTIE = RACINE / "outils" / "splat_comment_on_joue_diaporama.pdf"
LARGEUR, HAUTEUR_DIAPO, HAUTEUR_PIED = 1600, 1200, 56

CREDIT = (
    'Jeu SPLAT! créé par <a href="https://stevewyborney.com">Steve Wyborney</a> — '
    "images extraites de ses diaporamas, hors licence du site · "
    "adaptation en français : mathsgo.re · CC BY-NC-SA 4.0"
)

CSS_PAPIER = f"""
  *{{animation:none!important;transition:none!important}}
  /* police fixée pour que le rendu ne dépende pas de la machine : Inter, la plus proche de ce que montrait
     l'écran (Segoe UI). DejaVu Sans, celle des livrets, est trop large pour les bulles (« vois-/tu ? » coupé). */
  html,body,.cadre,.splat text{{font-family:"Inter","Segoe UI",system-ui,sans-serif!important}}
  html,body{{height:auto!important;background:#fff!important;padding:0!important;margin:0!important;display:block!important}}
  body>.cadre,.barre,body>.credit{{display:none!important}}
  .feuille{{width:{LARGEUR}px;height:{HAUTEUR_DIAPO + HAUTEUR_PIED}px;break-after:page;overflow:hidden;background:#fff}}
  .feuille:last-child{{break-after:auto}}
  .feuille .cadre{{display:block!important;width:{LARGEUR}px!important;height:{HAUTEUR_DIAPO}px;aspect-ratio:auto!important;border-radius:0!important;box-shadow:none!important}}
  .feuille .pied{{height:{HAUTEUR_PIED}px;line-height:{HAUTEUR_PIED - 1}px;text-align:center;white-space:nowrap;font-size:17px;color:#64748b;border-top:1px solid #e2e8f0}}
  .feuille .pied a{{color:#1e40af;text-decoration:none}}
  /* le mot « SPLAT ! » garde l'inclinaison de la fin de son animation */
  .feuille .splat{{transform:rotate(-6deg)}}
  @page{{size:{LARGEUR}px {HAUTEUR_DIAPO + HAUTEUR_PIED}px;margin:0}}
"""

# Une feuille par diapo ; la diapo à tache qui tombe (classe .chute) en donne deux.
JS_FEUILLES = """(credit) => {
  const cadre = document.getElementById('cadre');
  const diapos = [...cadre.querySelectorAll('.diapo')];
  const etats = [];
  diapos.forEach((d, k) => {
    if (d.querySelector('.chute')) { etats.push([k, false]); etats.push([k, true]); }
    else etats.push([k, false]);
  });
  for (const [k, tombe] of etats) {
    const feuille = document.createElement('div'); feuille.className = 'feuille';
    const copie = cadre.cloneNode(true); copie.removeAttribute('id');
    copie.querySelectorAll('.diapo').forEach((d, j) => {
      d.classList.toggle('active', j === k); d.classList.toggle('tombe', j === k && tombe);
      if (j !== k) d.remove();
    });
    const jouer = copie.querySelector('a.jouer');
    if (jouer) { jouer.removeAttribute('id'); jouer.href = 'https://mathsgo.re/outils/splat_univers.html'; }
    const pied = document.createElement('div'); pied.className = 'pied'; pied.innerHTML = credit;
    feuille.append(copie, pied); document.body.append(feuille);
  }
  return etats.length;
}"""


def servir():
    gestion = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RACINE))
    serveur = http.server.ThreadingHTTPServer(("127.0.0.1", 0), gestion)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    return serveur


def main():
    serveur = servir()
    adresse = f"http://127.0.0.1:{serveur.server_address[1]}/_sources/splat-comment-on-joue/diaporama.html"
    brut = ICI / "_brut.pdf"
    with sync_playwright() as p:
        nav = p.chromium.launch(channel="chromium")
        page = nav.new_page(viewport={"width": LARGEUR, "height": HAUTEUR_DIAPO + HAUTEUR_PIED})
        page.goto(adresse, wait_until="networkidle")
        page.evaluate("document.fonts.ready")
        n = page.evaluate(JS_FEUILLES, CREDIT)
        page.add_style_tag(content=CSS_PAPIER)
        page.wait_for_timeout(300)
        page.pdf(path=str(brut), width=f"{LARGEUR}px", height=f"{HAUTEUR_DIAPO + HAUTEUR_PIED}px",
                 print_background=True, margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        nav.close()
    serveur.shutdown()

    # Plein écran à l'ouverture et fondu entre les pages (comme le PDF donné à Claire le 27/08/2026).
    lecteur = PdfReader(str(brut))
    assert len(lecteur.pages) == n, f"{len(lecteur.pages)} pages imprimées pour {n} feuilles"
    ecrivain = PdfWriter()
    for feuille in lecteur.pages:
        feuille[NameObject("/Trans")] = DictionaryObject({
            NameObject("/S"): NameObject("/Fade"), NameObject("/D"): FloatObject(0.3)})
        ecrivain.add_page(feuille)
    ecrivain._root_object[NameObject("/PageMode")] = NameObject("/FullScreen")
    ecrivain.add_metadata({"/Title": "Comment on joue à SPLAT! — diaporama", "/Author": "mathsgo.re"})
    ecrivain.compress_identical_objects(remove_identicals=True, remove_orphans=True)
    with open(SORTIE, "wb") as f:
        ecrivain.write(f)
    brut.unlink()
    print(f"{SORTIE.relative_to(RACINE)} : {n} pages, {SORTIE.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
