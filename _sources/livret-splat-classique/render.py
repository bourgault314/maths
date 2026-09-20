#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère le livret « SPLAT! classique » (monde 2, 8 pages) à partir du site lui-même.

    python3 render.py                 (tous les livrets — un seul aujourd'hui)
    python3 render.py normal          (un seul)
    python3 render.py --qr normal     (en refabriquant d'abord ses QR codes)

Produit, à la racine du dépôt :
    outils/livret_splat_classique.pdf         8 pages A4, ordre de lecture   (Monde 2)
    outils/livret_splat_classique_a_plier.pdf 4 pages A3 paysage, imposées

Les 3 fiches (7, 8, 9) ne sont PAS redessinées ici : elles sont rendues par l'outil du
site (outils/splat.html, réglage « Énoncé seul, 6/page » du lot B) avec les graines de la
carte des mondes (outils/splat_univers.html, MONDES[1]). La fiche 7 réunit les trois
activités de Claire (4 + 4 + 4 cartes) sur deux pages pleines ; les fiches 8 et 9 ont
12 cartes elles aussi (décision du 19/09/2026 : 6 + 6, pas de page à moitié vide), exactement comme la
série en ligne les enchaîne (paramètre « suite »). Le QR code est ajouté dans le bandeau
de chaque page juste avant l'impression. Couverture et dos sont les deux HTML de ce
dossier ; l'exemple de la couverture (carte, tableau et équation) est dessiné par
l'outil lui-même, en mode correction, sur une carte qui n'est PAS dans le livret.

Le même script pourra rendre des niveaux supplémentaires (lot D : Avancé, Expert) :
un niveau de plus dans NIVEAUX, avec ses propres graines et ses QR.

Dépendances : playwright (chromium), pikepdf, qrcode[pil]. qpdf si disponible.
"""
import asyncio, http.server, socketserver, threading, functools, os, sys, json
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-splat-classique"
PORT = 8123
SITE = "https://mathsgo.re"
SC = "/splat/classique/"                        # la même adresse courte que la carte des mondes

# Les trois activités de Claire (étape 7) et les deux étapes à paquets (8 et 9), telles
# que définies dans outils/splat_univers.html (constantes M2A1..M2A3, MONDES[1]). Si une
# graine change là-bas, la reporter ici ET dans splat/classique/livret/index.html (le
# QR passe par cette page courte), puis relancer avec --qr.
M2A1 = "mode=U&equation=X_PLUS_A_EQ_B&tasksMin=1&tasksMax=1&visibleMax=15&hiddenMax=10&totalMin=1&totalMax=25&cards=4&seed=974&unknown=question"
M2A2 = "mode=U&equation=AX_EQ_B&tasksMin=2&tasksMax=5&hiddenMax=10&totalMin=5&totalMax=25&cards=4&seed=477&unknown=question"
M2A3 = "mode=U&equation=AX_PLUS_C_EQ_B&tasksMin=2&tasksMax=5&visibleMax=15&hiddenMax=10&totalMin=5&totalMax=25&cards=4&seed=478&unknown=question"
E8   = "mode=N&equation=X_PLUS_A_EQ_B&cards=12&seed=347&unknown=question"
E9   = "mode=N&equation=AX_PLUS_C_EQ_B&tasksMax=5&cards=12&seed=18&unknown=question"

FICHES = [
    dict(n=7, t="Le même jeu, un nouveau plateau", parties=[M2A1, M2A2, M2A3], parcours="m2e1", pages=2),
    dict(n=8, t="Les paquets de jetons",           parties=[E8],               parcours="m2e4", pages=2),
    dict(n=9, t="Paquets : le défi",               parties=[E9],               parcours="m2e5", pages=2),
]

def serie_url(query):
    """Une série de 12 cartes tirées au hasard (pas de graine), jouée en mode élève sans
    étape : rien n'est enregistré, l'élève s'entraîne."""
    return f"{SITE}{SC}?{query}&cards=12&unknown=question&eleve=1"

NIVEAUX = {
    # --------------------------------------------------------------- Monde 2
    "normal": dict(
        sortie="livret_splat_classique",
        qr="qr",
        # l'exemple de couverture : une carte à paquets qui n'est pas dans le livret
        # (mode N, une tache, deux paquets visibles) — choisie le 19/09/2026
        exemple=dict(query="mode=N&equation=X_PLUS_A_EQ_B&cards=1&seed=5264&unknown=question"),
        # « Une tache » : total minimum 10 > visibles maximum 9, pour que la tache cache
        # toujours au moins un jeton — en mode élève l'outil écarte les cartes où la tache ne
        # cache rien (8 % des tirages avec les réglages de l'activité 1), et la série n'avait
        # pas toujours ses 12 cartes (vu par Code le 19/09/2026 ; totaux 10 à 19, comme les
        # cartes de l'activité 1 : 5, 11, 13, 15).
        dos=[("Une tache",         "Comme l'activité 1 de la fiche&nbsp;7.",              serie_url("mode=U&equation=X_PLUS_A_EQ_B&tasksMin=1&tasksMax=1&visibleMax=9&hiddenMax=10&totalMin=10&totalMax=25"), "serie-1.png"),
             ("Plusieurs taches",  "Des taches et des jetons, comme l'activité 3 de la fiche&nbsp;7.",  serie_url("mode=U&equation=AX_PLUS_C_EQ_B&tasksMin=2&tasksMax=5&visibleMax=15&hiddenMax=10&totalMin=5&totalMax=25"), "serie-2.png"),
             ("Des paquets",       "Une tache et des paquets, comme la fiche&nbsp;8.",   serie_url("mode=N&equation=X_PLUS_A_EQ_B"), "serie-3.png"),
             ("Paquets et taches", "Le grand mélange, comme la fiche&nbsp;9.",           serie_url("mode=N&equation=AX_PLUS_C_EQ_B&tasksMax=5"), "serie-4.png")],
    ),
}

def lien_jeu(f):
    """Le QR d'une fiche ouvre EXACTEMENT les mêmes cartes en ligne, avec l'étoile de la
    carte des mondes (parcours=m2eN). L'adresse complète de la fiche 7 fait plus de 500
    caractères (les trois activités mises bout à bout) : un QR de cette taille ne se lit
    plus à 17 mm. On passe donc par la page courte splat/classique/livret/?f=N, qui
    renvoie vers l'adresse complète (la même que la carte des mondes, donc la même
    empreinte de reprise)."""
    return f"{SITE}{SC}livret/?f={f['n']}"

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"

# Le QR prend place dans le bandeau bleu de chaque page, dans une boîte blanche, pour ne
# rien prendre à la place réservée sous chaque carte (le bandeau passe de 16 à 21 mm).
CSS_QR = """
.printArea .print-page-header{flex-basis:21mm !important}
.printArea .print-page-title-block{flex:1 1 auto;min-width:0;align-items:center}
.printArea .print-page-subtitle{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.12}
.qr-livret{display:flex;align-items:center;gap:2.5mm;background:#fff;border-radius:2mm;padding:1mm 1.5mm 1mm 2.5mm;margin-left:auto;margin-right:2mm;flex:0 0 auto}
.qr-livret img{width:17mm;height:17mm;display:block}
.qr-livret .lib{text-align:right;font-size:11px;font-weight:900;color:#0f172a;line-height:1.2;white-space:nowrap}
.qr-livret .lib em{display:block;font-style:normal;font-weight:400;font-size:10px;color:#475569;margin-top:0.5mm}
"""

JS_QR = """(qr) => {
  const heads = document.querySelectorAll('.printArea .print-page-header');
  if (!heads.length) return 'pas de bandeau imprimé';
  heads.forEach(h => {
    const box = document.createElement('div'); box.className = 'qr-livret';
    box.innerHTML = '<div class="lib">Fiche finie ?<em>je rejoue en ligne</em></div><img src="' + qr + '" alt="">';
    const logos = h.querySelector('.print-page-logos');
    h.insertBefore(box, logos || null);
  });
  return 'ok';
}"""

# Le pied des fiches est écrit par l'outil ("mathsgo.re/splat/classique"), qui est la bonne
# adresse pour une fiche imprimée depuis le générateur — mais pas pour un livret : /splat
# ouvre la collection SPLAT du catalogue, où se trouvent les livrets, l'univers et tous
# les autres Splat (même décision que le livret du monde 1, 18/09/2026).
PIED_LIVRET = "mathsgo.re/splat · CC BY-NC-SA 4.0"

JS_PIED = """(texte) => {
  const f = document.querySelectorAll('.printArea .print-page-footer');
  if (!f.length) return 'pas de pied de page';
  f.forEach(e => { e.textContent = texte; });
  return 'ok';
}"""

# Une fiche = les cartes de ses parties mises bout à bout (comme genererSerieComposee le
# fait pour la série élève), puis la feuille imprimée telle que l'outil la fabrique.
JS_FICHE = """(parties) => {
  const toutes = cards.slice();
  for (const partie of parties) {
    appliquerConfiguration(new URLSearchParams(partie));
    generate();
    for (const c of cards) toutes.push(c);
  }
  cards = toutes;
  printSheet();
  return {cartes: cards.length, feuilles: document.querySelectorAll('.printArea .sheet').length,
          parPage: getPrintCardsPerPage()};
}"""

# L'exemple de couverture : la correction (carte + tableau + équation) de la carte 1 de
# l'adresse NIVEAUX[…]["exemple"], dessinée par renderCardIntoSvg, en deux fenêtres.
JS_EXEMPLE = """() => {
  const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sv.setAttribute('viewBox', '0 0 1600 2200');
  renderCardIntoSvg(sv, cards[0], 'correction');
  const fond = sv.querySelector('rect');
  if (fond && fond.getAttribute('width') === '1600') fond.remove();
  const c = cards[0];
  return {svg: sv.innerHTML, total: c.total, visibles: c.visible, cachees: c.hidden};
}"""

JS_COUV = """(d) => {
  const a = document.querySelector('svg.ex-carte'), b = document.querySelector('svg.ex-corr');
  if (!a || !b) return 'pas de place pour l\\'exemple';
  a.innerHTML = d.svg; b.innerHTML = d.svg;
  return 'ok';
}"""

JS_DOS = """(d) => {
  const box = document.querySelector('.niveaux');
  if (!box) return 'pas de bloc niveaux';
  box.innerHTML = d.niveaux.map(n =>
     '<div class="niv"><img src="' + n[2] + '" alt=""><span class="n">' + n[0] +
     '</span><span class="d">' + n[1] + '</span></div>').join('');
  const u = document.querySelector('.suite img');
  if (u) u.setAttribute('src', d.univers);
  return 'ok';
}"""

def fabrique_qr(niv):
    """(Re)fabrique les QR codes du niveau. À relancer si une graine change."""
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    dossier = ICI / niv["qr"]
    dossier.mkdir(parents=True, exist_ok=True)
    def ecrire(url, nom):
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(url); q.make(fit=True)
        q.make_image(fill_color="black", back_color="white").save(dossier / nom)
    for f in FICHES:
        ecrire(lien_jeu(f), f"fiche{f['n']}.png")
    ecrire(LIEN_UNIVERS, "univers.png")
    for _, _, url, nom in niv["dos"]:
        ecrire(url, nom)

def serveur():
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    h = functools.partial(Silencieux, directory=str(RACINE))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def pages(niv, tmp):
    from playwright.async_api import async_playwright
    base = f"http://127.0.0.1:{PORT}"
    qrweb = f"{BASE_WEB}/{niv['qr']}"
    async with async_playwright() as p:
        # Le vrai Chromium (channel="chromium") et non le « headless shell » : celui-ci
        # espace les lettres d'environ 5 % (vu le 19/09/2026 sur les couvertures), le
        # navigateur complet rend le texte comme Chrome sur un poste de travail.
        nav = await p.chromium.launch(channel="chromium")

        async def page_outil(query):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(f"{base}/outils/splat.html?{query}", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            return pg

        # --- l'exemple de la couverture, dessiné par l'outil
        pg = await page_outil(niv["exemple"]["query"])
        exemple = await pg.evaluate(JS_EXEMPLE)
        await pg.close()
        print(f"   exemple de couverture : total {exemple['total']}, visibles {exemple['visibles']},"
              f" cachés {exemple['cachees']}")

        async def pdf_html(url, sortie, couv=None, dos=None):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(url, wait_until="networkidle")
            await pg.wait_for_timeout(1200)
            if couv is not None:
                r = await pg.evaluate(JS_COUV, couv)
                if r != "ok":
                    raise SystemExit(f"couverture : {r}")
            if dos is not None:
                r = await pg.evaluate(JS_DOS, dos)
                if r != "ok":
                    raise SystemExit(f"dos : {r}")
            await pg.wait_for_timeout(400)
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        async def pdf_fiche(f, sortie):
            titre = quote(f"Fiche {f['n']} — {f['t']}")
            pg = await page_outil(f"{f['parties'][0]}&print=statement&layout=6&title={titre}")
            etat = await pg.evaluate(JS_FICHE, f["parties"][1:])
            if etat["parPage"] != 6:
                raise SystemExit(f"fiche {f['n']} : {etat['parPage']} cartes par page au lieu de 6")
            if etat["feuilles"] != f["pages"]:
                raise SystemExit(f"fiche {f['n']} : {etat['feuilles']} feuilles au lieu de {f['pages']}")
            await pg.add_style_tag(content=CSS_QR)
            r = await pg.evaluate(JS_QR, f"{qrweb}/fiche{f['n']}.png")
            if r != "ok":
                raise SystemExit(f"fiche {f['n']}, QR : {r}")
            r = await pg.evaluate(JS_PIED, PIED_LIVRET)
            if r != "ok":
                raise SystemExit(f"fiche {f['n']}, pied : {r}")
            await pg.wait_for_timeout(600)
            # marges : celles de la feuille de l'outil (@page 8 mm), comme un professeur
            # qui clique sur Imprimer
            await pg.pdf(path=str(sortie), format="A4", print_background=True, prefer_css_page_size=True)
            await pg.close()
            print(f"   fiche {f['n']} : {etat['cartes']} cartes sur {etat['feuilles']} pages")

        await pdf_html(f"{base}{BASE_WEB}/couverture.html", tmp / "p1.pdf", couv=exemple)
        for f in FICHES:
            await pdf_fiche(f, tmp / f"fiche{f['n']}.pdf")
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/{img}"] for nom, desc, _, img in niv["dos"]],
                   univers=f"{qrweb}/univers.png")
        await pdf_html(f"{base}{BASE_WEB}/dos.html", tmp / "p8.pdf", dos=dos)
        await nav.close()

def assemble(niv, tmp):
    """Assemble les 8 pages, puis impose les 2 feuilles A3.

    IMPORTANT : on passe par pikepdf et `add_overlay`, qui place chaque page comme un
    Form XObject. Avec une simple translation de contenu (pypdf merge_transformed_page),
    les DÉGRADÉS ne suivent pas (bug vu sur le livret du monde 1 le 17/09/2026).
    """
    import pikepdf
    A4W, A4H = 595.276, 841.890

    src = [pikepdf.open(str(tmp / "p1.pdf"))]
    pages = [src[0].pages[0]]
    for f in FICHES:
        d = pikepdf.open(str(tmp / f"fiche{f['n']}.pdf"))
        src.append(d)
        if len(d.pages) != f["pages"]:
            raise SystemExit(f"fiche {f['n']} : le PDF fait {len(d.pages)} pages au lieu de {f['pages']}")
        pages.extend(d.pages)
    src.append(pikepdf.open(str(tmp / "p8.pdf")))
    pages.append(src[-1].pages[0])
    if len(pages) != 8:
        raise SystemExit(f"{len(pages)} pages au lieu de 8")

    livret = pikepdf.Pdf.new()
    for p in pages:
        page = livret.add_blank_page(page_size=(A4W, A4H))
        pikepdf.Page(page).add_overlay(p, pikepdf.Rectangle(0, 0, A4W, A4H))
    livret.save(str(RACINE / "outils" / f"{niv['sortie']}.pdf"))

    a3 = pikepdf.Pdf.new()
    for g, d in [(8, 1), (2, 7), (6, 3), (4, 5)]:   # imposition d'un cahier de 8 pages
        feuille = a3.add_blank_page(page_size=(2 * A4W, A4H))
        for idx, tx in ((g, 0.0), (d, A4W)):
            pikepdf.Page(feuille).add_overlay(pages[idx - 1],
                                              pikepdf.Rectangle(tx, 0, tx + A4W, A4H))
    a3.save(str(RACINE / "outils" / f"{niv['sortie']}_a_plier.pdf"))
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
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    demandes = args or list(NIVEAUX)
    inconnu = [a for a in demandes if a not in NIVEAUX]
    if inconnu:
        raise SystemExit(f"niveau inconnu : {', '.join(inconnu)} (au choix : {', '.join(NIVEAUX)})")
    srv = serveur()
    try:
        for nom in demandes:
            niv = NIVEAUX[nom]
            print(f"— livret « {nom} »")
            if "--qr" in sys.argv:
                fabrique_qr(niv); print("   QR codes régénérés.")
            with tempfile.TemporaryDirectory() as d:
                tmp = Path(d)
                asyncio.run(pages(niv, tmp))
                assemble(niv, tmp)
            for suffixe in ("", "_a_plier"):
                compresse(RACINE / "outils" / f"{niv['sortie']}{suffixe}.pdf")
            print(f"   Fait : outils/{niv['sortie']}.pdf et outils/{niv['sortie']}_a_plier.pdf")
    finally:
        srv.shutdown()

if __name__ == "__main__":
    main()
