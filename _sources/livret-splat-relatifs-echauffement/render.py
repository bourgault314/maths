#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère le livret « SPLAT! Relatifs — Échauffement » (monde 6, 8 pages) et son corrigé.

    python3 render.py                 (le livret de l'élève et le corrigé : 4 PDF)
    python3 render.py --eleve         (seulement le livret de l'élève)
    python3 render.py --correction    (seulement le corrigé)
    python3 render.py --qr            (en refabriquant d'abord les QR codes)

Produit, à la racine du dépôt :
    outils/livret_splat_relatifs_echauffement.pdf                    8 pages A4, ordre de lecture
    outils/livret_splat_relatifs_echauffement_a_plier.pdf            4 pages A3 paysage, imposées
    outils/livret_splat_relatifs_echauffement_correction.pdf         le corrigé, par l'équation
    outils/livret_splat_relatifs_echauffement_correction_a_plier.pdf

L'ÉCHAUFFEMENT DU MONDE 6 (lot 3 de l'échauffement, 14/10/2026, décisions de Gwenaël) — trois
fiches AVANT la fiche 38, dans le monde 6 et dans ses étoiles, pour les élèves pas encore à l'aise
avec les négatifs ; deux plateaux, comme tout le monde 6 ; aucune tache « opposé » :
  - É1 « Des jetons verts et rouges » : 𝑥 + b = c avec des jetons 1 et −1 (une couleur par
    plateau, puis un vert et un rouge qui s'annulent) ;
  - É2 « Je partage les jetons » : a × 𝑥 = c, puis a × 𝑥 + b = c, avec des jetons 1 et −1 ;
  - É3 « Un jeton, un nombre » : les mêmes formes avec UN jeton numéroté par plateau, le pont
    vers la fiche 38.
Ces fiches portent un CODE (« É1 ») et pas de numéro : la 38 reste la 38. Leur étoile : parcours
ech1, ech2, ech3 (assets/js/splat-etapes.js, la carte des mondes, le moteur du suivi).

Ce dossier est repris de _sources/livret-splat-relatifs/ (mêmes gabarits, même machinerie) : les
fiches ne sont PAS redessinées ici, l'outil du site les imprime (outils/splat_equations.html, mode
EQPMSTEP, « Énoncé seul, 6/page », et pour le corrigé la correction courte « l'équation » 6/page :
on regroupe, puis on fait la même opération des deux côtés, comme l'outil), avec les réglages et
les graines de la carte des mondes (outils/splat_univers.html, ECH_R et ECH_F1 … ECH_F3). Chaque
fiche enchaîne ses 12 cartes par « suite » (une graine par carte). Le QR de chaque fiche passe par
la page courte : /splat/relatifs/livret/?f=E1 (la même étoile que la carte des mondes) ; au dos,
?s=e1 … e3 : six équations au hasard aux réglages d'une fiche, sans étoile.

CONTRÔLES FAITS À CHAQUE RENDU (le script s'arrête sinon) :
  - chaque fiche = 12 cartes sur 2 pages de 6 ;
  - ses cartes sont EXACTEMENT celles du jeu en ligne de la carte des mondes (la série « j ») ;
  - le livret et son corrigé ont les mêmes cartes ;
  - l'exemple de couverture n'est aucune des 36 cartes, ni aucune carte des fiches 38 à 43 ;
  - aucun 69 ni 88, ni dans les cartes ni dans l'exemple ;
  - la couverture ou le dos ne débordent pas.

Dépendances : playwright (chromium complet, pas le headless shell), pikepdf, qrcode[pil],
la police FreeSerif (apt install fonts-freefont-ttf) pour la lettre, DejaVu Sans (rendu Linux,
la police de tous les livrets SPLAT!). qpdf si disponible.
"""
import asyncio, base64, http.server, socketserver, threading, functools, sys, json, re
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-splat-relatifs-echauffement"
PORT = 8127
SITE = "https://mathsgo.re"
COURTE = "/splat/relatifs/livret/"              # la page courte des QR (celle du monde 6)

# ------------------------------------------------------------------ les trois fiches
# Les réglages et les graines de la carte des mondes (outils/splat_univers.html, ECH_R et
# ECH_F1 … ECH_F3), choisis sur la liste annotée validée par Gwenaël le 14/10/2026 : solutions des
# deux signes, jamais deux fois la même sur une page, la tache tantôt à gauche tantôt à droite,
# jamais la même lettre deux fois de suite, une seule solution nulle par fiche, aucun 69, aucune
# tache « opposé », jamais plus de 6 billes par plateau ; la première carte de chaque page est la
# plus simple. « xMax=6 » (lot 1) : avec des billes de 1, la solution ne vaudrait sinon que ±1.
# Un test les épingle contre la carte des mondes et la page courte : NE PAS changer une graine sans
# refaire le tri, la carte, la page courte et les PDF.
REGLAGES = {
    "e1": "mode=EQPMSTEP&opposites=off&beadMax=1&xMax=6&form=X_PLUS_B_EQ_C&visibleMin=1&visibleMax=6&totalMin=-6&totalMax=6",
    "e1z": "mode=EQPMSTEP&opposites=off&beadMax=1&xMax=6&form=X_PLUS_B_EQ_C&visibleMin=1&visibleMax=6&totalMin=-6&totalMax=6&zero=1",
    "e2a": "mode=EQPMSTEP&opposites=off&beadMax=1&xMax=6&form=AX_EQ_C&tasksMax=3&visibleMin=2&visibleMax=6&totalMin=-6&totalMax=6",
    "e2az": "mode=EQPMSTEP&opposites=off&beadMax=1&xMax=6&form=AX_EQ_C&tasksMax=3&visibleMin=2&visibleMax=6&totalMin=-6&totalMax=6&zero=1",
    "e2b": "mode=EQPMSTEP&opposites=off&beadMax=1&xMax=6&form=ONE_SIDE&tasksMax=3&visibleMin=1&visibleMax=6&totalMin=-6&totalMax=6",
    "e3a": "mode=EQPMSTEP&opposites=off&beadMax=5&visibleMin=1&visibleMax=1&totalMin=-9&totalMax=9&form=X_PLUS_B_EQ_C",
    "e3b": "mode=EQPMSTEP&opposites=off&beadMax=5&visibleMin=1&visibleMax=1&totalMin=-9&totalMax=9&form=AX_EQ_C&tasksMax=3",
    "e3c": "mode=EQPMSTEP&opposites=off&beadMax=5&visibleMin=1&visibleMax=1&totalMin=-9&totalMax=9&form=ONE_SIDE&tasksMax=3",
    "e3cz": "mode=EQPMSTEP&opposites=off&beadMax=5&visibleMin=1&visibleMax=1&totalMin=-9&totalMax=9&form=ONE_SIDE&tasksMax=3&zero=1",
}

def fiche(cartes):
    return [f"{REGLAGES[r]}&cards=1&seed={g}&unknown=letter" for r, g in cartes]

FICHES = [
    dict(code="É1", qr="E1", parcours="ech1", t="Des jetons verts et rouges", resume="Une couleur par plateau, puis les deux.",
         parties=fiche([("e1", 5529), ("e1", 2832), ("e1", 2479), ("e1", 62), ("e1", 4969), ("e1", 426),
                        ("e1", 2843), ("e1", 4560), ("e1", 2788), ("e1", 810), ("e1", 1229), ("e1z", 411)])),
    dict(code="É2", qr="E2", parcours="ech2", t="Je partage les jetons", resume="Je regroupe, puis je partage.",
         parties=fiche([("e2a", 2460), ("e2a", 2476), ("e2a", 690), ("e2a", 427), ("e2az", 1831), ("e2a", 1573),
                        ("e2b", 5585), ("e2b", 6823), ("e2b", 6460), ("e2b", 7305), ("e2b", 5799), ("e2b", 844)])),
    dict(code="É3", qr="E3", parcours="ech3", t="Un jeton, un nombre", resume="Un seul jeton par plateau, avec son nombre.",
         parties=fiche([("e3a", 2281), ("e3a", 2819), ("e3a", 2147), ("e3a", 1325), ("e3b", 2906), ("e3b", 1103),
                        ("e3c", 2457), ("e3c", 1513), ("e3c", 313), ("e3c", 47), ("e3cz", 1042), ("e3c", 1869)])),
]
PAR_QR = {f["qr"]: f for f in FICHES}

# ------------------------------------------------------------------ le dos : « Encore des cartes ! »
# Comme au monde 6 : une série par fiche, de SIX équations tirées au hasard aux réglages de la
# fiche (sans graine, sans solution nulle) et jouées aussitôt dans le jeu de l'élève d'ÉquaSplat
# (« jouer=1 ») — sans parcours : aucune étoile, rien d'enregistré. Une partie par sorte de cartes
# de la fiche : É1 = 6 cartes à billes ; É2 = 3 a·𝑥 = c, puis 3 a·𝑥 + b = c ; É3 = 2 + 2 + 2.
SERIE_CARTES = 6

def sans_graine(q, cartes):
    q = re.sub(r"&seed=\d+", "", q)
    return re.sub(r"cards=\d+", f"cards={cartes}", q)

def R(cle):
    return f"{REGLAGES[cle]}&cards=1&seed=0&unknown=letter"

SERIES = {
    "e1": [sans_graine(R("e1"), SERIE_CARTES)],
    "e2": [sans_graine(R("e2a"), 3), sans_graine(R("e2b"), 3)],
    "e3": [sans_graine(R("e3a"), 2), sans_graine(R("e3b"), 2), sans_graine(R("e3c"), 2)],
}

def cible_serie(s):
    """Ce que la page courte ouvre pour ?s=e1 (elle fait le même calcul, un test les compare)."""
    p = SERIES[s]
    return ("/outils/splat_equations.html?" + p[0] + "&jouer=1"
            + ("&suite=" + ";".join(quote(x, safe="") for x in p[1:]) if len(p) > 1 else ""))

def lien_fiche(qr):
    """Le QR d'une fiche : la page courte, qui renvoie vers le lien EXACT « Le jeu de l'élève »
    de la carte des mondes (ÉquaSplat, parcours=ech1 : la même étoile)."""
    return f"{SITE}{COURTE}?f={qr}"

def lien_serie(s):
    return f"{SITE}{COURTE}?s={s}"

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"

# ------------------------------------------------------------------ l'exemple de couverture
# Une carte qui n'est dans AUCUNE fiche (render.py le vérifie) : 𝑥 + 1 + 1 + 1 = −1 − 1 − 1, 𝑥 = −6 —
# trois billes vertes contre trois rouges : « ça ne s'enlève pas », et une solution négative qui
# n'est dans aucune fiche ; un seul signe par plateau (unites=1, lot 1), solution jusqu'à 9
# (xMax=9), graine 2. Choix de Gwenaël du 14/10/2026 : la graine 9 prévue d'abord donnait
# 𝑛 + 1 + 1 + 1 = −1 − 1, la carte 8 de la fiche É1 retournée (même lettre, même solution).
EXEMPLE = ("mode=EQPMSTEP&opposites=off&beadMax=1&unites=1&form=X_PLUS_B_EQ_C&visibleMin=2&visibleMax=3"
           "&xMax=9&totalMin=-6&totalMax=6&cards=1&seed=2&unknown=letter")

# ------------------------------------------------------------------ le livret
VUES = {
    "echauffement": dict(
        sortie="livret_splat_relatifs_echauffement",
        sur="Mon livret · Monde 6 · Échauffement",
        accroche="Des jetons verts et rouges, puis un seul jeton par plateau&nbsp;:<br>les premiers nombres négatifs, en douceur&nbsp;!",
        fiches=FICHES, exemple=EXEMPLE,
        dos=[("Des jetons", "Des jetons verts et rouges, comme la fiche&nbsp;É1.", "e1"),
             ("Je partage", "Des taches et des jetons, comme la fiche&nbsp;É2.", "e2"),
             ("Un jeton, un nombre", "Un jeton par plateau, comme la fiche&nbsp;É3.", "e3")],
        suite=("La suite du voyage", "Tu es prêt pour la <b>fiche&nbsp;38</b>&nbsp;: les jetons rouges arrivent, avec le <b>livret&nbsp;1</b> du monde&nbsp;6&nbsp;!"),
    ),
}

# ------------------------------------------------------------------ le corrigé
# Le corrigé est la correction courte « l'équation » de l'outil (6/page, lot R1) : les mêmes cartes
# à la même place, taches dévoilées, et sous le plateau la résolution de l'outil avec ses flèches
# (on regroupe chaque plateau, puis la même opération des deux côtés — décision de Gwenaël du
# 14/10/2026 : « comme l'outil »). Couverture : le bandeau rouge sombre « Correction » et « Livret
# corrigé — par l'équation » à la place de Nom / Classe, comme les autres livrets.
CORRECTION = dict(suffixe="_correction", imprime="correction-equation", dit="par l'équation")
PROF = dict(bandeau="Correction", ligne="Livret corrigé")
CSS_PROF = """
.bandeau-prof{flex:0 0 14mm;box-sizing:border-box;padding-top:4mm;display:flex;align-items:center;justify-content:center;
  background:#b91c1c;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.ident .champ.prof{flex:1;padding:1.2mm 4mm;text-align:center;line-height:1.2}
.ident .champ.prof span{font-size:17px;color:#4c1d95}
.ident .champ.prof small{font-size:12.5px;font-weight:700;color:#475569;margin-left:2.5mm}
.ident .champ.prof small::before{content:"— "}
"""

# ------------------------------------------------------------------ la page de l'outil
# Le QR prend place dans le bandeau de chaque fiche, tout à droite (les logos sont retirés au rendu).
CSS_QR = """
.printArea .print-page-header{flex-basis:21mm !important}
.printArea .print-page-title-block{flex:1 1 auto;min-width:0;align-items:center}
.printArea .print-page-subtitle{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.12}
.qr-livret{display:flex;align-items:center;gap:2.5mm;background:#fff;border-radius:2mm;padding:1mm 1.5mm 1mm 2.5mm;margin-left:auto;margin-right:0;flex:0 0 auto}
.qr-livret img{width:17mm;height:17mm;display:block}
.qr-livret .lib{text-align:right;font-size:11px;font-weight:900;color:#0f172a;line-height:1.2;white-space:nowrap}
.qr-livret .lib em{display:block;font-style:normal;font-weight:400;font-size:10px;color:#475569;margin-top:0.5mm}
"""
QR_ELEVE = "J'ai terminé<br>ma fiche,<em>je rejoue en ligne</em>"
QR_PROF = "Je rejoue<br>ces cartes<em>en ligne</em>"
CSS_TITRE_CORR = ".printArea .print-page-subtitle{-webkit-line-clamp:3}"

JS_QR = """([qr, lib, gabarit]) => {
  const heads = document.querySelectorAll('.printArea .print-page-header');
  if (!heads.length) return 'pas de bandeau imprimé';
  let w = 0;
  if (gabarit) {
    const t = document.createElement('div'); t.className = 'qr-livret';
    t.style.cssText = 'position:absolute;left:-9999px;top:0';
    t.innerHTML = '<div class="lib">' + gabarit + '</div>';
    document.body.appendChild(t);
    w = t.querySelector('.lib').getBoundingClientRect().width;
    t.remove();
    if (!(w > 0)) return 'largeur du texte de l\\'élève introuvable';
  }
  heads.forEach(h => {
    const box = document.createElement('div'); box.className = 'qr-livret';
    box.innerHTML = '<div class="lib">' + lib + '</div><img src="' + qr + '" alt="">';
    if (gabarit) box.querySelector('.lib').style.minWidth = w + 'px';
    h.appendChild(box);
  });
  return 'ok';
}"""

# Avant chaque pg.pdf : attendre que TOUTES les images de la page soient chargées et décodées
# (28/09/2026 : au monde 5, un rendu a imprimé une fiche sans son QR, l'image n'était pas encore
# arrivée). Une image qui ne se charge pas arrête le rendu. Même code qu'au monde 5.
JS_IMAGES = """async () => {
  const imgs = [...document.images];
  const charge = i => i.complete ? null : new Promise(r => {
    i.addEventListener('load', r, {once: true}); i.addEventListener('error', r, {once: true}); });
  const delai = new Promise(r => setTimeout(r, 20000));
  await Promise.race([Promise.all(imgs.map(charge)), delai]);
  await Promise.race([Promise.all(imgs.map(i => i.decode ? i.decode().catch(() => null) : null)), delai]);
  const ko = imgs.filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src'));
  return ko.length ? 'image non chargée : ' + ko.join(', ') : 'ok';
}"""

# Juste avant d'imprimer une fiche : chaque bandeau porte UN QR, chargé, avec la bonne adresse.
JS_QR_PRESENT = """(qr) => {
  const heads = [...document.querySelectorAll('.printArea .print-page-header')];
  if (!heads.length) return 'pas de bandeau imprimé';
  for (const [i, h] of heads.entries()) {
    const imgs = h.querySelectorAll('.qr-livret img');
    if (imgs.length !== 1) return 'bandeau ' + (i + 1) + ' : ' + imgs.length + ' QR, attendu : 1';
    const img = imgs[0];
    if (img.getAttribute('src') !== qr) return 'bandeau ' + (i + 1) + ' : QR ' + img.getAttribute('src') + ', attendu : ' + qr;
    if (!(img.complete && img.naturalWidth > 0)) return 'bandeau ' + (i + 1) + ' : le QR ne s\\'est pas chargé';
  }
  return 'ok';
}"""

# Plus aucun logo sur les pages-fiches du livret (checklist de la relecture du monde 1) : retiré
# AU RENDU, l'outil garde le sien quand un professeur imprime depuis le générateur.
JS_SANS_LOGO = """() => {
  const l = document.querySelectorAll('.printArea .print-page-logos');
  if (l.length !== 2) return l.length + ' bloc(s) de logos, attendu : 2';
  l.forEach(e => e.remove());
  return 'ok';
}"""

# Pas de « page N » : retiré de tous les livrets le 26/09/2026 au soir (relecture du monde 2) —
# le numéro de fiche du bandeau suffit.

PIED_LIVRET = "mathsgo.re/splat · CC BY-NC-SA 4.0"
PIED_CORRECTION = PIED_LIVRET + " · correction"
JS_PIED = """(texte) => {
  const f = document.querySelectorAll('.printArea .print-page-footer');
  if (!f.length) return 'pas de pied de page';
  f.forEach(e => { e.textContent = texte; });
  return 'ok';
}"""

JS_BIS = """(titre) => {
  const st = document.querySelectorAll('.printArea .sheet .print-page-subtitle');
  if (st.length !== 2) return st.length + ' pages imprimées au lieu de 2';
  st[1].textContent = titre;
  return 'ok';
}"""

# Un titre trop long se coupe APRÈS le tiret, jamais au milieu (même règle que le monde 5).
JS_TITRE = """() => {
  const st = document.querySelectorAll('.printArea .print-page-subtitle');
  if (!st.length) return 'pas de titre';
  st.forEach(e => {
    const t = e.textContent, parts = t.split(' — ');
    e.style.whiteSpace = 'nowrap';
    const bloc = e.parentElement;
    const trop = bloc.scrollWidth > bloc.clientWidth + 1;
    e.style.whiteSpace = '';
    if (!trop || parts.length < 2) return;
    const f0 = parseFloat(getComputedStyle(e).fontSize);
    e.style.whiteSpace = 'nowrap';
    const deborde = () => e.scrollHeight > e.clientHeight + 1 || bloc.scrollWidth > bloc.clientWidth + 1;
    const ecrire = (lignes) => { e.textContent = ''; lignes.forEach((l, k) => { if (k) e.appendChild(document.createElement('br')); e.append(l); }); };
    const essais = [[parts.slice(0, -1).join(' — ') + ' —', parts[parts.length - 1]], parts.map((p, k) => k < parts.length - 1 ? p + ' —' : p)];
    for (const lignes of essais) { ecrire(lignes); if (!deborde()) return; }
    for (let k = 1; k <= 4 && deborde(); k++) e.style.fontSize = (f0 * (1 - 0.05 * k)) + 'px';
  });
  const coupe = [...st].filter(e => e.scrollHeight > e.clientHeight + 1 || e.parentElement.scrollWidth > e.parentElement.clientWidth + 1).map(e => e.textContent);
  return coupe.length ? 'titre coupé : ' + coupe.join(' | ') : 'ok';
}"""

# Le nom de l'outil dans le bandeau des fiches : « SPLAT! » et, dessous, « Relatifs » (comme
# « SPLAT! / Équations » au monde 5 ; en capitales depuis le lot D, 17/10/2026).
TITRE_BANDEAU = "SPLAT!<small>Relatifs</small>"
CSS_TITRE_OUTIL = (".printArea .print-page-title{line-height:1.02 !important}"
                   ".printArea .print-page-title small{display:block;font-size:.62em;letter-spacing:.2px}")
JS_TITRE_OUTIL = """(t) => {
  const e = document.querySelectorAll('.printArea .print-page-title');
  if (!e.length) return 'pas de nom d\\'outil dans le bandeau';
  e.forEach(x => { x.innerHTML = t; });
  return 'ok';
}"""

JS_FICHE = """() => ({
  cartes: cards.map(carteDuJeuEquaSplat),
  feuilles: document.querySelectorAll('.printArea .sheet').length,
  parPage: getPrintCardsPerPage(),
  vides: document.querySelectorAll('.printArea .pCard.empty').length
})"""

# L'exemple de couverture, dessiné par l'outil : la carte de la correction courte « l'équation »
# (lot R1) — ses taches dévoilées dans une fenêtre, la résolution fléchée dans l'autre. Aucun
# dessin n'est inventé ici : on découpe deux fenêtres dans la même carte.
JS_EXEMPLE = """() => {
  const NS = 'http://www.w3.org/2000/svg';
  const c = cards[0];
  const s = document.createElementNS(NS, 'svg'); document.body.appendChild(s);
  renderEqSixCorrectionIntoSvg(s, c, 'equation');
  const carte = s.querySelector('#eqSixCorrectionCarte'), eq = s.querySelector('#eqSixCorrection');
  if (!carte || !eq) return {erreur: 'correction courte introuvable'};
  // la phrase « Même quantité… » n'est pas reprise dans la fenêtre (la couverture la dit)
  [...carte.children].filter(e => e.tagName === 'text' && /Même quantité/.test(e.textContent)).forEach(e => e.remove());
  const vb = (b, m) => [b.x - m, b.y - m, b.width + 2 * m, b.height + 2 * m].map(v => Math.round(v)).join(' ');
  const vb1 = vb(carte.getBBox(), 16), vb2 = vb(eq.getBBox(), 22);
  const e = c._eq, v = getCardVarChar(c);
  const lo = eqSignedSixCorrectionLinesOps(e, v);
  const r = {svg1: carte.outerHTML, vb1, svg2: eq.outerHTML, vb2, variable: c.varChar, x: e.x,
             gauche: {taches: e.left.tasks, opposees: (e.left.opposeFlags || []).filter(Boolean).length, jetons: e.left.visible.slice()},
             droite: {taches: e.right.tasks, opposees: (e.right.opposeFlags || []).filter(Boolean).length, jetons: e.right.visible.slice()},
             lignes: lo.lines, ops: lo.ops, carte: carteDuJeuEquaSplat(c)};
  s.remove();
  return r;
}"""

JS_COUV = """(d) => {
  const txt = (sel, html) => { const e = document.querySelector(sel); if (!e) return false; e.innerHTML = html; return true; };
  const a = document.querySelector('svg.ex-carte'), b = document.querySelector('svg.ex-corr');
  if (!a || !b) return 'pas de place pour l\\'exemple';
  a.innerHTML = d.svg1; a.setAttribute('viewBox', d.vb1);
  b.innerHTML = d.svg2; b.setAttribute('viewBox', d.vb2);
  if (!txt('.tete .sur', d.sur)) return 'pas de sur-titre';
  if (!txt('.tete .accroche', d.accroche)) return 'pas d\\'accroche';
  if (!txt('.expl .intro', d.intro)) return 'pas de texte d\\'exemple';
  if (!txt('.lg-corr', 'L\\'équation')) return 'pas de légende de la résolution';
  const li = document.querySelectorAll('.som ol li');
  if (li.length !== d.sommaire.length) return 'sommaire : ' + li.length + ' lignes';
  d.sommaire.forEach((t, i) => {
    li[i].querySelector('.badge b').textContent = t[0];
    li[i].querySelectorAll('span')[1].innerHTML = t[1] + '<em>' + t[2] + '</em>';
  });
  if (d.prof) {
    const id = document.querySelector('.ident');
    if (!id) return 'pas de ligne Nom, prénom / Classe';
    document.body.insertAdjacentHTML('afterbegin', '<div class="bandeau-prof">' + d.prof.bandeau + '</div>');
    id.innerHTML = '<div class="champ prof"><span>' + d.prof.ligne + '</span><small>' + d.prof.dit + '</small></div>';
  }
  return 'ok';
}"""

JS_DOS = """(d) => {
  const box = document.querySelector('.niveaux');
  if (!box) return 'pas de bloc niveaux';
  box.innerHTML = d.niveaux.map(n =>
     '<div class="niv"><img src="' + n[2] + '" alt=""><span class="n">' + n[0] +
     '</span><span class="d">' + n[1] + '</span></div>').join('');
  const u = document.querySelector('.suite img');
  if (!u) return 'pas de QR de la suite du voyage';
  u.setAttribute('src', d.univers);
  document.querySelector('.suite h3').innerHTML = d.suite[0];
  document.querySelector('.suite p').innerHTML = d.suite[1];
  const r4 = document.querySelector('.lex li.r4 .ic'), at = document.querySelector('.lex li.atoi .ic');
  if (!r4 || !at) return 'Pour se souvenir : lignes introuvables';
  r4.innerHTML = d.fleches; at.innerHTML = d.equation;
  return 'ok';
}"""

X_SOURCES = 'local("FreeSerif"), local("LatinModernMath-Regular")'
CSS_X = (
    '@font-face{font-family:"x-arrondi";src:' + X_SOURCES + ';unicode-range:U+1D400-1D7FF;size-adjust:120%}\n'
    '@font-face{font-family:"x-arrondi";font-style:italic;src:' + X_SOURCES + ';unicode-range:U+1D400-1D7FF;size-adjust:120%}\n'
    'svg text[font-family*="Times"]{font-family:"x-arrondi","Times New Roman",Times,serif !important}\n'
    '.nw{white-space:nowrap;font-style:normal}\n'
)

MOTS = {1: "une", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six"}
TIRET = "–"          # le moins des textes de la couverture : le tiret de Poppins (voir commun.css)
NB = "&nbsp;"

def signe(n):
    return f"{TIRET}{abs(n)}" if n < 0 else str(n)

def geste(op, lettre, premier_ajout=True):
    """« + 6 » → « on ajoute 6 sur les deux plateaux » (« puis 6 » pour un second ajout),
    « ÷ 2 » → « on partage en 2 », « ÷ (−3) » → « on divise par –3 », « × (−1) » → « on prend l'opposé »."""
    op = op.replace("−", "-")
    if op.startswith("×"):                      # « × (−1) » (30/09/2026) : −𝑥 → 𝑥
        return "on prend l'<b>opposé</b>"
    if op.startswith("÷"):
        d = op[1:].strip().strip("()")
        return f"on <b>divise</b> par {TIRET}{d[1:]}" if d.startswith("-") else f"on <b>partage</b> en {d}"
    verbe = "ajoute" if op.startswith("+") else "enlève"
    reste = op[1:].strip().replace(lettre, f'<span class="x">{lettre}</span>')
    return f"on <b>{verbe}</b> {reste} sur les deux plateaux"

def ecrit(ligne):
    """une ligne de l'outil, pour le texte : le tiret de Poppins, la lettre arrondie, insécable"""
    # le tiret d'un nombre négatif reste collé à son nombre (sinon « (– » en bout de ligne, 30/09/2026)
    out = ligne.replace("−", TIRET + "\u2060").replace(" ", NB)
    return re.sub(r"([\U0001D400-\U0001D7FF])", r'<span class="x">\1</span>', out)


def decrit(cote):
    """« une tache et trois jetons verts » ; « deux jetons rouges » ; « deux taches, un jeton
    vert et un jeton rouge » ; un jeton numéroté (fiche É3) : « un jeton –3 » (« jetons » et plus
    « billes » depuis le 23/10/2026, choix de Gwenaël)."""
    m = []
    t = cote["taches"]
    if t:
        m.append("une tache" if t == 1 else f"{MOTS[t]} taches")
    jetons = cote["jetons"]
    if jetons and all(abs(j) == 1 for j in jetons):
        verts, rouges = sum(1 for j in jetons if j > 0), sum(1 for j in jetons if j < 0)
        if verts:
            m.append(f"un jeton{NB}vert" if verts == 1 else f"{MOTS[verts]} jetons{NB}verts")
        if rouges:
            m.append(f"un jeton{NB}rouge" if rouges == 1 else f"{MOTS[rouges]} jetons{NB}rouges")
    else:
        m += [f"un jeton{NB}{signe(j)}" for j in jetons]
    return ", ".join(m[:-1]) + " et " + m[-1] if len(m) > 1 else m[0]

def textes_exemple(ex):
    """Le texte « Comment ça marche ? », écrit à partir de la carte que l'outil vient de dessiner
    et de sa résolution : il ne peut pas mentir sur ses nombres. Repris du livret 1 du monde 6, dit
    avec les jetons 1 et −1 (« trois jetons verts », pas « un jeton 1, un jeton 1 et un jeton 1 »), sans
    tache « opposé » (il n'y en a pas dans l'échauffement)."""
    g, d, x, v = ex["gauche"], ex["droite"], ex["x"], ex["variable"]
    let = f'<span class="x">{v}</span>'
    lignes, ops = ex["lignes"], ex["ops"]
    if g["opposees"] or d["opposees"]:
        raise SystemExit("exemple : une tache « opposé », il n'y en a pas dans l'échauffement")
    gestes = []
    if len(lignes) > 1 and ops and ops[0] is None:
        gestes.append("on <b>regroupe</b> chaque plateau (" + ecrit(lignes[1]) + ")")
    for o in (o for o in ops if o):
        gestes.append(geste(o, v))
    vu = False
    for k, g_ in enumerate(gestes):
        if " sur les deux plateaux" in g_:
            if vu:
                gestes[k] = g_.replace(" sur les deux plateaux", "")
            vu = True
    phrase_gestes = ", ".join(gestes[:-1]) + ", puis " + gestes[-1] if len(gestes) > 1 else gestes[0]
    une = g["taches"] + d["taches"] == 1
    inconnue = (f"La tache cache un nombre&nbsp;: c'est l'<b>inconnue</b>, la lettre {let}. "
                f"Ici, elle est transparente&nbsp;: elle cache {signe(x)}. ") if une else (
                f"Les taches cachent toutes le même nombre&nbsp;: c'est l'<b>inconnue</b>, la lettre {let}. "
                f"Ici, elles sont transparentes&nbsp;: une tache cache {signe(x)}. ")
    return (f"Sur cette carte, il y a la même quantité à gauche et à droite. À gauche, {decrit(g)}&nbsp;; "
            f"à droite, {decrit(d)}."
            "\n      <span>" + inconnue
            + f"L'<b>équation</b> s'écrit {ecrit(lignes[0])}&nbsp;: " + phrase_gestes
            + f" — {let}{NB}={NB}{signe(x)}.</span>")

# Les petits dessins du dos, avec les nombres de l'exemple de la couverture : les flèches de la
# résolution (le premier geste sur les nombres, écrit « + 6 » comme dans l'outil) et l'équation.
def dessins_dos(ex):
    ops = [o for o in ex["ops"] if o]
    op = next((o for o in ops if not o.startswith("÷") and ex["variable"] not in o), ops[0])
    lab = op.replace("−", TIRET)
    fleches = ('<svg width="116" height="46" viewBox="0 0 116 46" aria-hidden="true">'
               '<g fill="none" stroke="#b45309" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'
               '<path d="M42 5 Q32 23 42 41"/><path d="M36.5 38 L42 41 L42.6 35"/>'
               '<path d="M74 5 Q84 23 74 41"/><path d="M73.4 35 L74 41 L79.5 38"/></g>'
               '<g fill="#b45309" font-family="Poppins, sans-serif" font-weight="700" font-size="13">'
               f'<text x="31" y="28" text-anchor="end">{lab}</text><text x="85" y="28">{lab}</text></g>'
               '<text x="58" y="28" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="700" '
               'font-size="15" fill="#0f172a">=</text></svg>')
    eq = ex["lignes"][0].replace("−", TIRET)
    return fleches, f'<span class="mini-eq">{eq}</span>'

# ------------------------------------------------------------------ le jeu en ligne, relu
def series_du_jeu(prefixe):
    """Les séries « Le jeu de l'élève » relues dans la carte des mondes : { parcours : [cartes] }
    — l'échauffement (prefixe « ech ») ou les fiches 38 à 43 (« m4e »)."""
    univers = (RACINE / "outils" / "splat_univers.html").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r'p:"(' + prefixe + r'\d)",[\s\S]*?j:"([^"]+)"', univers):
        b64 = m.group(2).split("#data=")[1]
        b64 += "=" * (-len(b64) % 4)
        d = json.loads(base64.urlsafe_b64decode(b64).decode("utf-8"))
        if d.get("parcours") != m.group(1):
            raise SystemExit(f"carte des mondes, {m.group(1)} : l'étoile de l'adresse et celle de la série diffèrent")
        out[m.group(1)] = d["serie"]
    return out

def nombres(carte):
    return [abs(v) for v in [carte["x"], *carte["left"], *carte["right"]] if not isinstance(v, str)]

def cle(carte):
    """Une équation, sans tenir compte du côté ni de l'ordre des jetons."""
    cote = lambda r: (sum(1 for t in r if t == "x"), sum(1 for t in r if t == "-x"),
                      tuple(sorted(t for t in r if not isinstance(t, str))))
    return tuple(sorted([cote(carte["left"]), cote(carte["right"])]))

# ------------------------------------------------------------------ rendu
def fabrique_qr():
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    dossier = ICI / "qr"
    dossier.mkdir(parents=True, exist_ok=True)
    def ecrire(url, nom):
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(url); q.make(fit=True)
        q.make_image(fill_color="black", back_color="white").save(dossier / nom)
    for f in FICHES:
        ecrire(lien_fiche(f["qr"]), f"fiche{f['qr']}.png")
    for s in SERIES:
        ecrire(lien_serie(s), f"serie-{s}.png")
    ecrire(LIEN_UNIVERS, "univers.png")

def adresse_fiche(f, imprime="statement"):
    """L'adresse du lien « Fiche » (ou « Correction ») de la carte des mondes, sans « imprimer »."""
    v = "&view=equation"
    p = f["parties"]
    suite = ("&suite=" + ";".join(quote(x + v, safe="") for x in p[1:])) if len(p) > 1 else ""
    return (f"/outils/splat_equations.html?{p[0]}{v}{suite}&print={imprime}&layout=6"
            f"&title={quote('Fiche ' + f['code'] + ' — ' + f['t'], safe='')}")

# La grande tache du bandeau porte « 𝑥 » (pas d'opposée dans l'échauffement), centrée sur son
# encre (mesuré au PDF) : couverture.html l'écrit déjà, rien à changer au rendu.

async def pages(v, tmp, jeu, autres, corr=None):
    from playwright.async_api import async_playwright
    base = f"http://127.0.0.1:{PORT}"
    qrweb = f"{BASE_WEB}/qr"
    cartes_livret = {}
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")

        async def page_outil(url):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.add_init_script("window.print = () => {};")
            await pg.goto(base + url, wait_until="networkidle")
            await pg.wait_for_timeout(800)
            return pg

        # --- l'exemple de couverture, dessiné par l'outil, ses taches dévoilées comme dans un corrigé
        pg = await page_outil(f"/outils/splat_equations.html?{v['exemple']}&view=equation")
        ex = await pg.evaluate(JS_EXEMPLE)
        await pg.close()
        if ex.get("erreur"):
            raise SystemExit("exemple : " + ex["erreur"])

        # --- les trois fiches
        for i, f in enumerate(v["fiches"]):
            titre = f"Fiche {f['code']} — {f['t']}"
            pg = await page_outil(adresse_fiche(f, corr["imprime"] if corr else "statement") + "&imprimer=1")
            etat = await pg.evaluate(JS_FICHE)
            if etat["parPage"] != 6 or etat["feuilles"] != 2 or etat["vides"] != 0 or len(etat["cartes"]) != 12:
                raise SystemExit(f"{titre} : {etat['parPage']}/page, {etat['feuilles']} feuilles, "
                                 f"{len(etat['cartes'])} cartes, {etat['vides']} cases vides")
            if etat["cartes"] != jeu[f["parcours"]]:
                raise SystemExit(f"{titre} : les cartes ne sont pas celles du jeu en ligne ({f['parcours']})")
            cartes_livret[f["qr"]] = etat["cartes"]
            r = await pg.evaluate(JS_BIS, f"Fiche {f['code']} bis — {f['t']}" + (" — Correction" if corr else ""))
            if r != "ok":
                raise SystemExit(f"{titre}, page « bis » : {r}")
            await pg.add_style_tag(content=CSS_QR + CSS_TITRE_OUTIL + (CSS_TITRE_CORR if corr else ""))
            qr = f"{qrweb}/fiche{f['qr']}.png"
            for js, arg, quoi in ((JS_TITRE_OUTIL, TITRE_BANDEAU, "bandeau"),
                                  (JS_QR, [qr] + ([QR_PROF, QR_ELEVE] if corr else [QR_ELEVE, None]), "QR"),
                                  (JS_SANS_LOGO, None, "logos")):
                r = await (pg.evaluate(js, arg) if arg is not None else pg.evaluate(js))
                if r != "ok":
                    raise SystemExit(f"{titre}, {quoi} : {r}")
            await pg.set_viewport_size({"width": 733, "height": 1062})
            await pg.emulate_media(media="print")
            r = await pg.evaluate(JS_TITRE)
            if r != "ok":
                raise SystemExit(f"{titre}, titre : {r}")
            r = await pg.evaluate(JS_PIED, PIED_CORRECTION if corr else PIED_LIVRET)
            if r != "ok":
                raise SystemExit(f"{titre}, pied : {r}")
            await pg.wait_for_timeout(600)
            for js, arg, quoi in ((JS_IMAGES, None, "images"), (JS_QR_PRESENT, qr, "QR")):
                r = await (pg.evaluate(js, arg) if arg is not None else pg.evaluate(js))
                if r != "ok":
                    raise SystemExit(f"{titre}, {quoi} : {r}")
            await pg.pdf(path=str(tmp / f"fiche{f['qr']}.pdf"), format="A4", print_background=True,
                         prefer_css_page_size=True)
            await pg.close()
            print(f"   {titre} : 12 cartes, 2 pages, celles du jeu en ligne")

        toutes = {cle(c) for l in list(jeu.values()) + list(autres.values()) for c in l}
        if cle(ex["carte"]) in toutes:
            raise SystemExit("l'exemple de couverture est une carte du monde 6")
        if any(n in (69, 88) for n in nombres(ex["carte"])):
            raise SystemExit("l'exemple de couverture a un 69 ou un 88")

        async def pdf_html(page, sortie, js, donnees):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(f"{base}{BASE_WEB}/{page}", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            await pg.add_style_tag(content=CSS_X)
            if donnees.get("prof"):
                await pg.add_style_tag(content=CSS_PROF)
            r = await pg.evaluate(js, donnees)
            if r != "ok":
                raise SystemExit(f"{page} : {r}")
            await pg.wait_for_timeout(500)
            debord = await pg.evaluate("() => document.body.scrollHeight > document.body.clientHeight + 1")
            if debord:
                await pg.screenshot(path=str(ICI / "debord.png"), full_page=True)
                raise SystemExit(f"{page} : le contenu dépasse la page (capture : debord.png)")
            r = await pg.evaluate(JS_IMAGES)
            if r != "ok":
                raise SystemExit(f"{page} : {r}")
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        # Les flèches de la correction de l'outil écrivent « − 3 » (U+2212) : dans la couverture,
        # Poppins dessine ce signe trop court, on écrit le tiret « – » (même règle qu'au monde 6).
        svg2 = ex["svg2"].replace(">− ", ">– ")
        couv = dict(svg1=ex["svg1"], vb1=ex["vb1"], svg2=svg2, vb2=ex["vb2"],
                    sur=v["sur"], accroche=v["accroche"], intro=textes_exemple(ex),
                    sommaire=[[f["code"], f["t"], f["resume"]] for f in v["fiches"]],
                    prof=dict(PROF, dit=CORRECTION["dit"]) if corr else None)
        await pdf_html("couverture.html", tmp / "p1.pdf", JS_COUV, couv)
        fleches, equation = dessins_dos(ex)
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/serie-{s}.png"] for nom, desc, s in v["dos"]],
                   univers=f"{qrweb}/univers.png", suite=list(v["suite"]),
                   fleches=fleches, equation=equation)
        await pdf_html("dos.html", tmp / "p8.pdf", JS_DOS, dos)
        await nav.close()
    return ex, cartes_livret

def assemble(sortie, tmp, fiches):
    """Les 8 pages, puis les 4 feuilles A3 imposées (8|1 · 2|7 · 6|3 · 4|5)."""
    import pikepdf
    A4W, A4H = 595.276, 841.890
    src, pages_ = [], []
    for nom in ["p1.pdf"] + [f"fiche{f['qr']}.pdf" for f in fiches] + ["p8.pdf"]:
        d = pikepdf.open(str(tmp / nom))
        src.append(d); pages_.extend(d.pages)
    if len(pages_) != 8:
        raise SystemExit(f"{len(pages_)} pages au lieu de 8")
    livret = pikepdf.Pdf.new()
    for pg in pages_:
        page = livret.add_blank_page(page_size=(A4W, A4H))
        pikepdf.Page(page).add_overlay(pg, pikepdf.Rectangle(0, 0, A4W, A4H))
    livret.save(str(RACINE / "outils" / f"{sortie}.pdf"))
    a3 = pikepdf.Pdf.new()
    for g, d in [(8, 1), (2, 7), (6, 3), (4, 5)]:
        feuille = a3.add_blank_page(page_size=(2 * A4W, A4H))
        for idx, tx in ((g, 0.0), (d, A4W)):
            pikepdf.Page(feuille).add_overlay(pages_[idx - 1], pikepdf.Rectangle(tx, 0, tx + A4W, A4H))
    a3.save(str(RACINE / "outils" / f"{sortie}_a_plier.pdf"))
    for s in src:
        s.close()

def serveur():
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    h = functools.partial(Silencieux, directory=str(RACINE))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def compresse(chemin):
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
    versions = [False, True]
    if "--eleve" in sys.argv:
        versions = [False]
    if "--correction" in sys.argv:
        versions = [True]
    if "--qr" in sys.argv:
        fabrique_qr(); print("QR codes régénérés.")
    jeu = series_du_jeu("ech")
    if sorted(jeu) != sorted(f["parcours"] for f in FICHES):
        raise SystemExit(f"séries du jeu relues dans la carte des mondes : {sorted(jeu)}")
    autres = series_du_jeu("m4e")
    if len(autres) != 6:
        raise SystemExit(f"fiches 38 à 43 relues dans la carte des mondes : {sorted(autres)}")
    for p, cartes in jeu.items():
        if any(n in (69, 88) for c in cartes for n in nombres(c)):
            raise SystemExit(f"{p} : un 69 ou un 88")
    srv = serveur()
    v = VUES["echauffement"]
    rendus = {}
    try:
        for corrige in versions:
            corr = CORRECTION if corrige else None
            sortie = v["sortie"] + (corr["suffixe"] if corr else "")
            print("— échauffement" + (" corrigé" if corr else ""))
            with tempfile.TemporaryDirectory() as d:
                tmp = Path(d)
                ex, cartes = asyncio.run(pages(v, tmp, jeu, autres, corr))
                assemble(sortie, tmp, v["fiches"])
            for suffixe in ("", "_a_plier"):
                compresse(RACINE / "outils" / f"{sortie}{suffixe}.pdf")
            rendus[sortie] = dict(exemple=ex["carte"], fiches=cartes)
            print(f"   Fait : outils/{sortie}.pdf et outils/{sortie}_a_plier.pdf")
    finally:
        srv.shutdown()
    if len({json.dumps(x, sort_keys=True, ensure_ascii=False) for x in rendus.values()}) > 1:
        raise SystemExit("le livret et son corrigé n'ont pas les mêmes cartes")
    if rendus:
        r = next(iter(rendus.values()))
        un = lambda c: json.dumps(c, ensure_ascii=False)
        lignes = ["{", ' "echauffement": {', f'  "exemple": {un(r["exemple"])},', '  "fiches": {']
        items = list(r["fiches"].items())
        for i, (n, cartes) in enumerate(items):
            lignes.append(f'   "{n}": [')
            lignes += [f'    {un(c)}' + ("," if j < len(cartes) - 1 else "") for j, c in enumerate(cartes)]
            lignes.append('   ]' + ("," if i < len(items) - 1 else ""))
        lignes += ["  }", " }", "}"]
        (ICI / "cartes.json").write_text("\n".join(lignes) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
