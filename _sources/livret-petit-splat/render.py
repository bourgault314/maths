#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère le livret « Petit SPLAT! » (8 pages) à partir du site lui-même.

    python3 render.py            (depuis _sources/livret-petit-splat/)

Produit, à la racine du dépôt :
    outils/livret_petit_splat.pdf       8 pages A4, dans l'ordre de lecture
    outils/livret_petit_splat_a3.pdf    4 pages A3 paysage, déjà imposées (2 feuilles)

Les 6 fiches ne sont PAS redessinées ici : elles sont rendues par l'outil du site
(outils/splat_tache_barre.html, mode support=print) avec les graines exactes du
monde 1 de l'univers SPLAT!. Le QR code est injecté dans le bandeau de consigne
juste avant l'impression. Couverture et dos sont les deux HTML de ce dossier.

Dépendances : playwright (chromium), pikepdf, qrcode[pil].
"""
import asyncio, http.server, socketserver, threading, functools, os, sys
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-petit-splat"
PORT = 8123
SITE = "https://mathsgo.re"

# Les 6 étapes du monde 1, telles que définies dans outils/splat_univers.html (MONDES[0]).
FICHES = [
    dict(n=1, t="Complète le schéma",  seed="441132", splats="1",   ex="find_hidden"),
    dict(n=2, t="Dessine les jetons",  seed="929356", splats="1",   ex="construct"),
    dict(n=3, t="Mélange !",           seed="302672", splats="1",   ex="mix"),
    dict(n=4, t="Deux taches",         seed="514457", splats="2",   ex="find_hidden"),
    dict(n=5, t="Plein de taches !",   seed="727304", splats="mix", ex="find_hidden"),
    dict(n=6, t="Dessine en expert",   seed="514457", splats="mix", ex="construct"),
]

def lien_jeu(f):
    return (f"{SITE}/splat/petit/?support=eleve&problem=classic&target=20"
            f"&splats={f['splats']}&exercise={f['ex']}&seed={f['seed']}&parcours=m1e{f['n']}")

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"
# Quatre niveaux pour « Encore des cartes ! », calés sur la progression du livret :
#   facile = 1 tache · normal = 2 à 6 taches · avance = jusqu'à 50 · expert = jusqu'à 100
NIVEAUX = {
    "facile": f"{SITE}/splat/petit/?support=eleve&problem=classic&target=20&splats=1&exercise=mix",
    "normal": f"{SITE}/splat/petit/?support=eleve&problem=classic&target=20&splats=mix&exercise=mix",
    "avance": f"{SITE}/splat/petit/?support=eleve&problem=classic&target=50&splats=mix&exercise=mix",
    "expert": f"{SITE}/splat/petit/?support=eleve&problem=classic&target=100&splats=mix&exercise=mix",
}

CSS_QR = """
.activity-instruction{display:flex !important;align-items:center;gap:5mm}
.qr-livret{margin-left:auto;display:flex;align-items:center;gap:3mm;flex:0 0 auto}
.qr-livret img{width:20mm;height:20mm;display:block}
.qr-livret .lib{text-align:right;font-size:11.5px;font-weight:900;color:#0f172a;line-height:1.25;white-space:nowrap}
.qr-livret .lib em{display:block;font-style:normal;font-weight:400;font-size:10.5px;color:#475569;margin-top:0.6mm}
"""

JS_QR = """(qr) => {
  const ins=document.querySelector('.activity-instruction');
  if(!ins) return 'pas de bandeau de consigne';
  const txt=document.createElement('div'); txt.className='txt';
  while(ins.firstChild) txt.appendChild(ins.firstChild);
  ins.appendChild(txt);
  const box=document.createElement('div'); box.className='qr-livret';
  box.innerHTML='<div class="lib">Fiche finie ?<em>je rejoue en ligne</em></div><img src="'+qr+'" alt="">';
  ins.appendChild(box);
  return 'ok';
}"""

def fabrique_qr():
    """(Re)fabrique les QR codes dans qr/. À relancer si une graine change."""
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    (ICI / "qr").mkdir(exist_ok=True)
    def ecrire(url, nom):
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(url); q.make(fit=True)
        q.make_image(fill_color="black", back_color="white").save(ICI / "qr" / nom)
    for f in FICHES:
        ecrire(lien_jeu(f), f"fiche{f['n']}.png")
    ecrire(LIEN_UNIVERS, "univers.png")
    for nom, url in NIVEAUX.items():
        ecrire(url, f"niveau-{nom}.png")

def serveur():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RACINE))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def pages(tmp):
    from playwright.async_api import async_playwright
    base = f"http://127.0.0.1:{PORT}"
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        async def pdf(url, sortie, injecter=None):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(url, wait_until="networkidle")
            await pg.wait_for_timeout(1200)
            if injecter:
                await pg.add_style_tag(content=CSS_QR)
                r = await pg.evaluate(JS_QR, injecter)
                if r != "ok":
                    raise SystemExit(f"injection du QR impossible sur {url} : {r}")
                await pg.wait_for_timeout(400)
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        await pdf(f"{base}{BASE_WEB}/couverture.html", tmp / "p1.pdf")
        for f in FICHES:
            url = (f"{base}/outils/splat_tache_barre.html?support=print&problem=classic&target=20"
                   f"&splats={f['splats']}&exercise={f['ex']}&seed={f['seed']}"
                   f"&title=" + quote(f"Fiche {f['n']} — {f['t']}"))
            await pdf(url, tmp / f"p{f['n']+1}.pdf", injecter=f"{BASE_WEB}/qr/fiche{f['n']}.png")
        await pdf(f"{base}{BASE_WEB}/dos.html", tmp / "p8.pdf")
        await nav.close()

def assemble(tmp):
    """Assemble les 8 pages, puis impose les 2 feuilles A3.

    IMPORTANT : on passe par pikepdf et `add_overlay`, qui place chaque page
    comme un Form XObject. Avec une simple translation de contenu (pypdf
    merge_transformed_page), les DÉGRADÉS ne suivent pas : un motif PDF est
    ancré à l'espace par défaut de la feuille, pas au contenu déplacé — la
    page de droite se retrouvait alors peinte avec la fin du dégradé (bandeau
    crème au lieu d'orange). Bug vu sur le livret A3 le 17/09/2026.
    """
    import pikepdf
    A4W, A4H = 595.276, 841.890

    src = [pikepdf.open(str(tmp / f"p{i}.pdf")) for i in range(1, 9)]
    pages = [s.pages[0] for s in src]

    livret = pikepdf.Pdf.new()
    for p in pages:
        page = livret.add_blank_page(page_size=(A4W, A4H))
        pikepdf.Page(page).add_overlay(p, pikepdf.Rectangle(0, 0, A4W, A4H))
    livret.save(str(RACINE / "outils" / "livret_petit_splat.pdf"))

    a3 = pikepdf.Pdf.new()
    for g, d in [(8, 1), (2, 7), (6, 3), (4, 5)]:   # imposition d'un cahier de 8 pages
        feuille = a3.add_blank_page(page_size=(2 * A4W, A4H))
        for idx, tx in ((g, 0.0), (d, A4W)):
            pikepdf.Page(feuille).add_overlay(pages[idx - 1],
                                              pikepdf.Rectangle(tx, 0, tx + A4W, A4H))
    a3.save(str(RACINE / "outils" / "livret_petit_splat_a3.pdf"))
    for s in src:
        s.close()


def compresse(chemin):
    """qpdf, s'il est installé, divise le poids par deux (objets et flux recompressés)."""
    import shutil, subprocess
    if not shutil.which("qpdf"):
        return
    tmp = chemin.with_suffix(".qpdf.pdf")
    r = subprocess.run(["qpdf", "--object-streams=generate", "--compress-streams=y",
                        "--recompress-flate", "--compression-level=9", str(chemin), str(tmp)])
    if r.returncode in (0, 3) and tmp.exists():
        tmp.replace(chemin)


def main():
    import tempfile
    if "--qr" in sys.argv:
        fabrique_qr(); print("QR codes régénérés.")
    srv = serveur()
    try:
        with tempfile.TemporaryDirectory() as d:
            tmp = Path(d)
            asyncio.run(pages(tmp))
            assemble(tmp)
            for nom in ("livret_petit_splat.pdf", "livret_petit_splat_a3.pdf"):
                compresse(RACINE / "outils" / nom)
    finally:
        srv.shutdown()
    print("Fait : outils/livret_petit_splat.pdf (8 pages A4) et outils/livret_petit_splat_a3.pdf (4 pages A3).")

if __name__ == "__main__":
    main()
