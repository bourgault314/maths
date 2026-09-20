#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère les livrets « Petit SPLAT! » (8 pages) à partir du site lui-même.

    python3 render.py                 (les trois livrets)
    python3 render.py avance          (un seul)
    python3 render.py --qr expert     (en refabriquant d'abord ses QR codes)

Produit, à la racine du dépôt :
    outils/livret_petit_splat.pdf             8 pages A4, ordre de lecture   (Monde 1, jusqu'à 20)
    outils/livret_petit_splat_a_plier.pdf     4 pages A3 paysage, imposées
    outils/livret_petit_splat_avance.pdf      idem, niveau Avancé (21 à 50)
    outils/livret_petit_splat_avance_a_plier.pdf
    outils/livret_petit_splat_expert.pdf      idem, niveau Expert (51 à 100)
    outils/livret_petit_splat_expert_a_plier.pdf

Les 6 fiches ne sont PAS redessinées ici : elles sont rendues par l'outil du site
(outils/splat_tache_barre.html, mode support=print) avec des graines fixes. Le QR
code est injecté dans le bandeau de consigne juste avant l'impression. Couverture
et dos sont les deux HTML de ce dossier ; pour les niveaux Avancé et Expert, leurs
textes variables et l'exemple de couverture sont injectés au rendu (voir NIVEAUX).

CHOIX DES GRAINES (17/09/2026) — ne pas en changer sans refaire le tri.
Les graines de Monde 1 sont celles de la progression de Claire. Celles des niveaux
Avancé et Expert ont été retenues automatiquement parmi des dizaines de milliers de
tirages, en gardant seulement les fiches qui respectent TOUTES ces règles :
  · aucune carte sous le plancher du niveau (21 pour Avancé, 51 pour Expert) —
    chaque livret ouvre une tranche neuve, on ne refait jamais le niveau d'en dessous ;
  · sur une carte « dessine », entre 1 et 15 jetons à dessiner (jamais 0, jamais 20) ;
  · au plus 2 cartes sans aucun jeton visible ;
  · pas deux cartes identiques (même total, mêmes visibles, même nombre de taches) ;
  · au plus une carte où chaque tache ne cache qu'un seul jeton ;
  · sur les fiches 5 et 6, au moins 4 tailles de groupes différentes (de 2 à 6 taches).

Dépendances : playwright (chromium), pikepdf, qrcode[pil]. qpdf si disponible.
"""
import asyncio, http.server, socketserver, threading, functools, os, sys, json
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-petit-splat"
PORT = 8123
SITE = "https://mathsgo.re"

# Les 6 étapes du monde 1, telles que définies dans outils/splat_univers.html (MONDES[0]).
# splats / exercise ne changent jamais d'un niveau à l'autre : c'est la MÊME progression,
# seule la cible (et donc la graine) change.
FICHES = [
    dict(n=1, t="Complète le schéma",  splats="1",   ex="find_hidden"),
    dict(n=2, t="Dessine les jetons",  splats="1",   ex="construct"),
    dict(n=3, t="Mélange !",           splats="1",   ex="mix"),
    dict(n=4, t="Deux taches",         splats="2",   ex="find_hidden"),
    dict(n=5, t="Plein de taches !",   splats="mix", ex="find_hidden"),
    dict(n=6, t="Dessine en expert",   splats="mix", ex="construct"),
]

def niveau_url(target, splats, exercise="mix"):
    return f"{SITE}/splat/petit/?support=eleve&problem=classic&target={target}&splats={splats}&exercise={exercise}"

NIVEAUX = {
    # --------------------------------------------------------------- Monde 1
    "normal": dict(
        target=20,
        sortie="livret_petit_splat",
        qr="qr",
        graines={1:"441132", 2:"929356", 3:"302672", 4:"514457", 5:"727304", 6:"514457"},
        sur=None, accroche=None, exemple=None,      # couverture d'origine, on n'y touche pas
        dos=[("Facile", "Une seule tache, comme les fiches 1 à 3.",   niveau_url(20, "1"),   "niveau-facile.png"),
             ("Normal", "De 2 à 6 taches, comme les fiches 4 à 6.",   niveau_url(20, "mix"), "niveau-normal.png"),
             ("Avancé", "De 2 à 6 taches, jusqu'à 50 jetons.",        niveau_url(50, "mix"), "niveau-avance.png"),
             ("Expert", "De 2 à 6 taches, jusqu'à 100 jetons&nbsp;!", niveau_url(100,"mix"), "niveau-expert.png")],
    ),
    # --------------------------------------------------------------- 21 à 50
    "avance": dict(
        target=50,
        sortie="livret_petit_splat_avance",
        qr="qr/avance",
        graines={1:"510115", 2:"715819", 3:"716087", 4:"109324", 5:"868655", 6:"849499"},
        sur="Mon livret · Monde 1 · Avancé",
        accroche="Le tout, les parties…<br>et jusqu'à 50 jetons&nbsp;!",
        exemple=dict(splats="2", vis=(10, 14), hp=(14, 16), total=42),
        dos=[("Une tache",        "Une seule tache, jusqu'à 50 jetons — comme les fiches 1 à 3.", niveau_url(50, "1"),   "niveau-1.png"),
             ("Plein de taches",  "De 2 à 6 taches, jusqu'à 50 jetons — comme les fiches 4 à 6.", niveau_url(50, "mix"), "niveau-2.png"),
             ("Expert · 1 tache", "Une seule tache, jusqu'à 100 jetons.",                         niveau_url(100,"1"),   "niveau-3.png"),
             ("Expert · 2 à 6 taches", "De 2 à 6 taches, jusqu'à 100 jetons&nbsp;!",                   niveau_url(100,"mix"), "niveau-4.png")],
    ),
    # -------------------------------------------------------------- 51 à 100
    "expert": dict(
        target=100,
        sortie="livret_petit_splat_expert",
        qr="qr/expert",
        graines={1:"892863", 2:"662792", 3:"520986", 4:"948274", 5:"830408", 6:"354581"},
        sur="Mon livret · Monde 1 · Expert",
        accroche="Le tout, les parties…<br>et jusqu'à 100 jetons&nbsp;!",
        exemple=dict(splats="2", vis=(10, 14), hp=(30, 36), total=76),
        dos=[("Une tache",         "Une seule tache, jusqu'à 100 jetons — comme les fiches 1 à 3.", niveau_url(100,"1"),   "niveau-1.png"),
             ("Plein de taches",   "De 2 à 6 taches, jusqu'à 100 jetons — comme les fiches 4 à 6.", niveau_url(100,"mix"), "niveau-2.png"),
             ("Réviser · 1 tache", "Une seule tache, jusqu'à 50 jetons.",                           niveau_url(50, "1"),   "niveau-3.png"),
             ("Réviser · 2 à 6 taches", "De 2 à 6 taches, jusqu'à 50 jetons.",                           niveau_url(50, "mix"), "niveau-4.png")],
    ),
}

def lien_jeu(niv, f):
    """Le QR d'une fiche ouvre EXACTEMENT les mêmes 12 cartes en ligne.
    parcours=m1eN est gardé pour les trois livrets : valider une fiche plus dure
    gagne l'étoile du monde 1 (décision du 17/09/2026)."""
    n = niv["graines"][f["n"]]
    return (f"{SITE}/splat/petit/?support=eleve&problem=classic&target={niv['target']}"
            f"&splats={f['splats']}&exercise={f['ex']}&seed={n}&parcours=m1e{f['n']}")

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"

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
  box.innerHTML='<div class="lib">J\\'ai terminé<br>ma fiche,<em>je rejoue en ligne</em></div><img src="'+qr+'" alt="">';
  ins.appendChild(box);
  return 'ok';
}"""

# ---------------------------------------------------------------------------
# L'exemple expliqué de la couverture est DESSINÉ PAR L'OUTIL LUI-MÊME : on tire
# des cartes jusqu'à en trouver une au profil demandé, puis on récupère son SVG
# (getSplatSvg avec les jetons cachés). L'exemple d'un livret ressemble donc
# exactement aux cartes de ses fiches — plusieurs taches comprises.
# Le pied des 6 fiches est écrit par l'outil ("mathsgo.re/splat/petit"), qui est la
# bonne adresse pour une fiche imprimée depuis le générateur — mais pas pour un livret :
# /splat/petit ouvre le générateur, alors que /splat ouvre la collection SPLAT du
# catalogue, où se trouvent les livrets, l'univers et tous les autres Splat. On repointe
# donc le pied des 8 pages du livret vers /splat (décision du 18/09/2026).
PIED_LIVRET = "mathsgo.re/splat · CC BY-NC-SA 4.0"

JS_PIED = """(texte) => {
  const f = document.querySelector('.activity-footer');
  if (!f) return 'pas de pied de page';
  f.innerText = texte;
  return 'ok';
}"""

JS_EXEMPLE = """([target, splatMode, visMin, visMax, hpMin, hpMax, totMin]) => {
  for (let essai = 0; essai < 8000; essai++) {
    currentRand = mulberry32(hashSeed('exemple-' + target + '-' + essai));
    const c = createItem('find_hidden', target, splatMode);
    if (c.visible < visMin || c.visible > visMax) continue;
    if (c.hiddenPerSplat < hpMin || c.hiddenPerSplat > hpMax) continue;
    if (c.total < totMin) continue;
    return {svg: getSplatSvg(c, true, false, true), total: c.total,
            visible: c.visible, n: c.numSplats, hp: c.hiddenPerSplat};
  }
  return null;
}"""

JS_COUV = """(d) => {
  const set = (sel, html) => { const e = document.querySelector(sel); if (e) e.innerHTML = html; };
  if (d.sur) set('.tete .sur', d.sur);
  if (d.accroche) set('.tete .accroche', d.accroche);
  if (!d.ex) return 'ok';
  const e = d.ex;
  const mot = e.n > 1 ? ('les ' + e.n + ' taches en cachent une partie')
                      : ('la tache en cache une partie');
  set('.expl .intro',
      'Au total, il y a ' + e.total + ' jetons&nbsp;: ' + mot + '.' +
      '<span>Ici les taches sont transparentes&nbsp;: on voit les jetons cachés. ' +
      (e.n > 1 ? 'Chaque tache en cache le <b>même nombre</b>. ' : '') +
      'Le schéma en barres met tout ça en ordre.</span>');
  set('.carte .tot', e.total);
  const carte = document.querySelector('.carte');
  const vieux = carte.querySelector('svg'); if (vieux) vieux.remove();
  carte.insertAdjacentHTML('beforeend', e.svg);
  // les jetons cachés sont serrés sous la tache : on les affine pour qu'ils
  // restent comptables sur la couverture (les positions, elles, ne bougent pas).
  carte.querySelectorAll('circle').forEach(c => {
      c.setAttribute('r', (parseFloat(c.getAttribute('r')) * 0.68).toFixed(2));
      c.setAttribute('stroke-width', '0.8');
  });
  carte.querySelectorAll('.splat-path').forEach(p => {
      p.setAttribute('fill', '#111827'); p.setAttribute('opacity', '0.16');
      p.setAttribute('stroke', '#334155'); p.setAttribute('stroke-width', '1.6');
      p.setAttribute('stroke-opacity', '2.6');
      p.removeAttribute('filter');
  });
  set('.sch .barre-h', e.total);
  const flexV = Math.max(e.visible, e.total * 0.05, 1);
  const flexH = Math.max(e.hp, e.total * 0.05, 1);
  const mini = '<svg class="mini" viewBox="40 10 220 180" aria-hidden="true"><path d="M130,50 Q170,20 200,60 Q230,80 210,130 Q180,170 130,160 Q80,150 70,100 Q80,40 130,50 Z" fill="#111827"/></svg>';
  let bas = '<div class="vis" style="flex:' + flexV + '">' + e.visible + '</div>';
  /* la mini-tache va dans CHAQUE case cachée : une case = une tache */
  for (let i = 0; i < e.n; i++)
      bas += '<div class="cac" style="flex:' + flexH + '">' + mini + e.hp + '</div>';
  set('.sch .barre-b', bas);
  set('.sch .pieds',
      '<span class="a" style="flex:' + flexV + '">les jetons <b>visibles</b></span>' +
      '<span class="b" style="flex:' + (flexH * e.n) + '">les jetons <b>cachés</b>' +
      (e.n > 1 ? ' (' + e.n + ' fois ' + e.hp + ')' : '') + '</span>');
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
        ecrire(lien_jeu(niv, f), f"fiche{f['n']}.png")
    ecrire(LIEN_UNIVERS, "univers.png")
    for _, _, url, nom in niv["dos"]:
        ecrire(url, nom)

def serveur():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RACINE))
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

        exemple = None
        if niv["exemple"]:
            e = niv["exemple"]
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(f"{base}/outils/splat_tache_barre.html?support=print", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            exemple = await pg.evaluate(JS_EXEMPLE, [niv["target"], e["splats"],
                                                     e["vis"][0], e["vis"][1],
                                                     e["hp"][0], e["hp"][1], e["total"]])
            await pg.close()
            if not exemple:
                raise SystemExit("aucune carte d'exemple ne correspond au profil demandé")
            print(f"   exemple de couverture : {exemple['total']} = {exemple['visible']}"
                  f" + {exemple['n']} x {exemple['hp']}")

        async def pdf(url, sortie, injecter=None, couv=None, dos=None):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(url, wait_until="networkidle")
            await pg.wait_for_timeout(1200)
            if injecter:
                await pg.add_style_tag(content=CSS_QR)
                r = await pg.evaluate(JS_QR, injecter)
                if r != "ok":
                    raise SystemExit(f"injection du QR impossible sur {url} : {r}")
                r = await pg.evaluate(JS_PIED, PIED_LIVRET)
                if r != "ok":
                    raise SystemExit(f"pied de page : {r}")
                await pg.wait_for_timeout(400)
            if couv is not None:
                r = await pg.evaluate(JS_COUV, couv)
                if r != "ok":
                    raise SystemExit(f"couverture : {r}")
                await pg.wait_for_timeout(400)
            if dos is not None:
                r = await pg.evaluate(JS_DOS, dos)
                if r != "ok":
                    raise SystemExit(f"dos : {r}")
                await pg.wait_for_timeout(400)
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        couv = dict(sur=niv["sur"], accroche=niv["accroche"], ex=exemple)
        await pdf(f"{base}{BASE_WEB}/couverture.html", tmp / "p1.pdf", couv=couv)
        for f in FICHES:
            url = (f"{base}/outils/splat_tache_barre.html?support=print&problem=classic"
                   f"&target={niv['target']}&splats={f['splats']}&exercise={f['ex']}"
                   f"&seed={niv['graines'][f['n']]}"
                   f"&title=" + quote(f"Fiche {f['n']} — {f['t']}"))
            await pdf(url, tmp / f"p{f['n']+1}.pdf", injecter=f"{qrweb}/fiche{f['n']}.png")
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/{img}"] for nom, desc, _, img in niv["dos"]],
                   univers=f"{qrweb}/univers.png")
        await pdf(f"{base}{BASE_WEB}/dos.html", tmp / "p8.pdf", dos=dos)
        await nav.close()

def assemble(niv, tmp):
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
            print(f"— livret « {nom} » (cible {niv['target']})")
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
