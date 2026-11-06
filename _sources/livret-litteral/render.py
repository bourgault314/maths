#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère les deux versions du livret « Calcul littéral » (31 pages A4) depuis livret_litteral.html.

    python3 _sources/livret-litteral/render.py            (les deux versions)
    python3 _sources/livret-litteral/render.py vert-rouge (une seule : vert-rouge | blanc-gris)

Produit :
    outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf   tuiles vertes et rouges (couleurs de l'appli)
    outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf   tuiles blanches et grises (photocopie)

Il faut Playwright et son Chromium : pip install playwright && playwright install chromium.
Le VRAI Chromium est lancé (channel="chromium") et non le « headless shell », qui espace le texte
autrement (leçon du livret Petit SPLAT!, 19/09/2026).

Le dépôt est servi par un petit serveur local le temps du rendu : la page charge les polices
(Poppins, SplatLettres) et le logo depuis assets/, comme sur le site.

CONTRÔLES (le script s'arrête sinon, sans écrire de PDF) :
  - verifier_calculs.py refait tous les calculs du livret (tuiles, grilles, exemples corrigés) ;
  - les polices Poppins et SplatLettres sont chargées (pas de police de secours) ;
  - 31 pages, et rien ne dépasse du cadre d'une page ni ne descend sur le pied ;
  - aucune écriture mathématique ne garde un tiret « - » ou une lettre droite « x ».
"""
import functools
import http.server
import socketserver
import subprocess
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[1]
SORTIE = RACINE / "outils" / "tuiles_algebriques"
VERSIONS = {"vert-rouge": "livret_litteral_vert_rouge.pdf", "blanc-gris": "livret_litteral_blanc_gris.pdf"}
PAGES = 31
BROUILLON = False  # True : écrit le PDF même si un contrôle de mise en page échoue (pour regarder)

CONTROLE = r"""
() => {
  const pb = [];
  const pages = [...document.querySelectorAll('section.page')];
  pages.forEach((p, i) => {
    const r = p.getBoundingClientRect();
    const pied = p.querySelector('.pied').getBoundingClientRect();
    p.querySelectorAll('*').forEach(el => {
      if (el.closest('.pied')) return;
      const b = el.getBoundingClientRect();
      if (!b.width && !b.height) return;
      if (b.right > r.right - 22 || b.left < r.left + 22 || b.bottom > pied.top - 2) {
        pb.push(`page ${i + 1} : <${el.tagName.toLowerCase()} class="${el.className}"> déborde (${Math.round(b.left - r.left)},${Math.round(b.bottom - r.top)})`);
      }
    });
    p.querySelectorAll('.carte, .boites > div, td, th').forEach(el => {
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
        pb.push(`page ${i + 1} : contenu trop grand dans <${el.tagName.toLowerCase()} class="${el.className}">`);
    });
  });
  document.querySelectorAll('.tiles, .tete h1, .sec span').forEach(el => {
    if (/[-x]/.test(el.textContent.replace(/[A-Za-zÀ-ÿ’']+(?:-[A-Za-zÀ-ÿ’']+)+|[A-Za-zÀ-ÿ’']{3,}/g, ''))) pb.push('écriture non convertie : ' + el.textContent.slice(0, 40));
  });
  return {pages: pages.length, pb: [...new Set(pb)].slice(0, 40)};
}
"""


def servir():
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Silencieux, directory=str(RACINE))
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def main(choix):
    calculs = subprocess.run([sys.executable, str(ICI / "verifier_calculs.py")], capture_output=True, text=True)
    print(calculs.stdout.strip())
    if calculs.returncode:
        sys.exit("calculs faux : PDF non écrits")
    srv = servir()
    port = srv.server_address[1]
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch(channel="chromium")
            for theme in choix:
                page = nav.new_page()
                page.goto(f"http://127.0.0.1:{port}/_sources/livret-litteral/livret_litteral.html?theme={theme}")
                page.wait_for_selector("html[data-pret='1']")
                page.evaluate("document.fonts.ready")
                polices = page.evaluate("""() => [document.fonts.check('700 12px Poppins'), document.fonts.check('12px Poppins'),
                                               document.fonts.check('12px SplatLettres', '\\u{1D465}')]""")
                faces = page.evaluate("() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight)")
                if not all(polices) or not any("SplatLettres" in f for f in faces) or not any("Poppins" in f for f in faces):
                    sys.exit(f"[{theme}] polices non chargées : {polices} {faces}")
                page.emulate_media(media="print")
                res = page.evaluate(CONTROLE)
                if res["pages"] != PAGES:
                    sys.exit(f"[{theme}] {res['pages']} pages au lieu de {PAGES}")
                if res["pb"] and BROUILLON:
                    print(f"[{theme}] BROUILLON, mise en page :\n  " + "\n  ".join(res["pb"]))
                elif res["pb"]:
                    sys.exit(f"[{theme}] mise en page :\n  " + "\n  ".join(res["pb"]))
                out = SORTIE / VERSIONS[theme]
                page.pdf(path=str(out), format="A4", print_background=True, prefer_css_page_size=True)
                page.close()
                print("écrit :", out.relative_to(RACINE))
            nav.close()
    finally:
        srv.shutdown()


if __name__ == "__main__":
    BROUILLON = "--brouillon" in sys.argv
    args = [a for a in sys.argv[1:] if a in VERSIONS]
    main(args or list(VERSIONS))
