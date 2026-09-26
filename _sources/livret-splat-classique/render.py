#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère le livret « SPLAT! classique » (monde 2, 8 pages) à partir du site lui-même.

    python3 render.py                 (les DEUX livrets, élève et correction)
    python3 render.py defi            (un seul niveau : normal | defi)
    python3 render.py --qr defi       (en refabriquant d'abord ses QR codes)
    python3 render.py --correction    (seulement les quatre livrets corrigés)
    python3 render.py --eleve         (seulement le livret de l'élève)

Produit, à la racine du dépôt :
    outils/livret_splat_classique.pdf         8 pages A4, ordre de lecture   (Monde 2)
    outils/livret_splat_classique_a_plier.pdf 4 pages A3 paysage, imposées
et les quatre livrets corrigés (lot K2, 20/09/2026 ; « pour tous » depuis le 23/09/2026), mêmes 8 pages,
même pliage, mêmes cartes à la même place :
    outils/livret_splat_classique_correction_equation.pdf         l'équation, inconnue « ? »
    outils/livret_splat_classique_correction_equation_lettre.pdf  l'équation, inconnue en lettre
    outils/livret_splat_classique_correction_schema.pdf           le schéma en barres, « ? »
    outils/livret_splat_classique_correction_schema_lettre.pdf    le schéma en barres, en lettre
    (et chacun son …_a_plier.pdf)

Les 3 fiches (7, 8, 9) ne sont PAS redessinées ici : elles sont rendues par l'outil du
site (outils/splat.html, réglage « Énoncé seul, 6/page » du lot B) avec les graines de la
carte des mondes (outils/splat_univers.html, MONDES[1]). La fiche 7 réunit les trois
activités de Claire (4 + 4 + 4 cartes) sur deux pages pleines ; les fiches 8 et 9 ont
12 cartes elles aussi (décision du 19/09/2026 : 6 + 6, pas de page à moitié vide), exactement comme la
série en ligne les enchaîne (paramètre « suite »). Le QR code est ajouté dans le bandeau
de chaque page juste avant l'impression. Couverture et dos sont les deux HTML de ce
dossier ; l'exemple de la couverture (carte, schéma en barres et équation) est dessiné par
l'outil lui-même, en mode correction, sur une carte qui n'est PAS dans le livret.

LIVRETS DE CORRECTION (lot K2, 20/09/2026) — l'outil imprime lui-même les fiches de
correction avec ses deux « corrections courtes » 6/page (print=correction-equation ou
correction-schema) : même bandeau, même cadre de consigne, chaque carte à la même place que
sur la fiche de l'élève ; sous le plateau, l'équation résolue et ses flèches, ou les schémas
en barres et leurs calculs. En lettre (unknown=letter), chaque carte a sa lettre (celle que
l'outil tire avec la carte) ; les cartes à jetons de la fiche 7 (mode A) n'en ont pas dans
l'outil : le livret leur en donne une, dans l'ordre x, a, b, c, m, n, t…, sans rien tirer
(les nombres ne bougent pas). La couverture reçoit le bandeau « Correction » (comme le
livret corrigé Petit SPLAT!, lot K1) et dit de quelle correction il s'agit ; la boîte du QR
dit « Je rejoue ces cartes en ligne » (le même QR) ; le dos ne change pas. Le corrigé peut
être donné aux élèves (Claire, 23/09/2026) : il ne dit « professeur » nulle part.

LIVRET « LE DÉFI » (lot D, 21/09/2026) — le même monde, des cartes plus dures : totaux 50 à
100, 2 ou 3 paquets numérotés non ronds, 2 à 6 taches, quotient non évident. Chaque fiche est
bâtie comme la fiche 7, trois séries de 4 cartes enchaînées par « suite » — le générateur ne
sort pas douze cartes à ce calibre d'une seule graine (voir le README). Il produit :
    outils/livret_splat_classique_defi.pdf         (et …_a_plier, et ses quatre corrections)

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
    dict(n=8, t="Avec des paquets de jetons",      parties=[E8],               parcours="m2e4", pages=2),
    dict(n=9, t="Le défi",                         parties=[E9],               parcours="m2e5", pages=2),
]

# --------------------------------------------------------------------- LOT D (21/09/2026)
# Le livret « Le défi » : les mêmes trois étapes du monde 2, en plus dur. Réglages décidés
# par Gwenaël le 20/09 : totaux 50 à 100, 2 ou 3 paquets visibles (il faut ADDITIONNER avant
# de soustraire), valeurs de paquets non rondes, quotient final non évident, 2 à 6 taches,
# paquets numérotés seulement (les jetons comptés un par un restent l'entrée du monde).
#
# POURQUOI TROIS SÉRIES DE 4 CARTES PAR FICHE, et non une graine unique : mesuré le
# 21/09/2026 sur 300 000 tirages par réglage, une carte sur sept seulement respecte toutes
# ces règles à la fois ; douze d'affilée, c'est une graine sur plusieurs millions. Une fiche
# est donc bâtie comme la fiche 7 du livret normal — trois séries mises bout à bout par le
# paramètre « suite ». Les graines ci-dessous ont été retenues automatiquement : voir le
# README, § « Le choix des graines du livret Le défi ». NE PAS en changer une sans refaire
# le tri (les 36 cartes sont toutes différentes, et leurs 36 équations aussi).
def _defi(t1, t2, graine):
    return ("mode=N&equation=AX_PLUS_C_EQ_B"
            f"&tasksMin={t1}&tasksMax={t2}&visibleMin=2&visibleMax=3"
            f"&totalMin=50&totalMax=100&cards=4&seed={graine}&unknown=question")

FICHES_DEFI = [
    dict(n=7, t="Des paquets, et plusieurs taches", qr="7d", parcours="m2e1", pages=2,
         resume="Deux taches, puis trois, puis quatre.",
         parties=[_defi(2, 2, 211017), _defi(3, 3, 116475), _defi(4, 4, 231266)]),
    dict(n=8, t="Encore plus de taches",            qr="8d", parcours="m2e4", pages=2,
         resume="Quatre taches, puis cinq, puis six.",
         parties=[_defi(4, 4, 204080), _defi(5, 5, 241600), _defi(6, 6,  87925)]),
    dict(n=9, t="Le grand défi",                    qr="9d", parcours="m2e5", pages=2,
         resume="De 2 à 6 taches, tout mélangé.",
         parties=[_defi(2, 6,  51887), _defi(2, 6, 142961), _defi(2, 6, 227216)]),
]

def serie_url(query):
    """Une série de 12 cartes tirées au hasard (pas de graine), jouée en mode élève sans
    étape : rien n'est enregistré, l'élève s'entraîne."""
    return f"{SITE}{SC}?{query}&cards=12&unknown=question&eleve=1"

# La couverture du livret « Le défi » (lot D) : l'exemple y montre les TROIS gestes, donc une
# équation de trois lignes sous un schéma en barres de trois étages. La fenêtre de droite passe
# de 55 à 68 mm de haut ; mesuré le 21/09/2026, le pied et la dernière ligne du sommaire
# sortaient de la feuille de 12 mm. Ce style, injecté pour ce seul niveau, les fait rentrer
# (pied à 287 mm, comme sur le livret normal) sans toucher d'un pixel à la couverture du
# livret normal. Toute retouche de ces valeurs se revérifie sur le PDF, pas à l'œil.
CSS_DEFI = """
.expl{padding:5mm 6mm 4.5mm}
.expl .intro{font-size:14.5px;margin:3mm 0 3mm}
.expl .intro span{font-size:12px}
.expl .atoi{margin:3.5mm 0 0;font-size:12.5px}
.carte.corr{flex:0 0 70mm}
.ident .champ{padding:3.5mm 4mm 9mm}
.som ol{margin-top:2.5mm;gap:3mm 6mm}
.som li{font-size:12.5px}
.som li em{font-size:10.5px}
"""

# Le dos du livret « Le défi » : deux séries au lieu de quatre, donc deux cases plus larges
# et des QR de 36 mm (30 mm à quatre ; 32 et 21 mm avant le lot 2 de la relecture du monde 1,
# 25/09/2026, qui a retiré « Mes fiches » du dos pour agrandir les QR). Injecté pour ce seul
# niveau — le dos du livret normal ne bouge pas.
CSS_DOS_DEFI = """
.niveaux{gap:6mm}
.niv{padding:3.5mm 4mm 3mm;gap:2mm}
.niv img{width:36mm;height:36mm}
"""

def serie_defi(t1, t2, tmin=50, tmax=100):
    """Une série sans graine, aux réglages du livret « Le défi » : l'élève s'entraîne."""
    return serie_url("mode=N&equation=AX_PLUS_C_EQ_B"
                     f"&tasksMin={t1}&tasksMax={t2}&visibleMin=2&visibleMax=3"
                     f"&totalMin={tmin}&totalMax={tmax}")

NIVEAUX = {
    # --------------------------------------------------------------- Monde 2
    "normal": dict(
        sortie="livret_splat_classique",
        qr="qr",
        fiches=FICHES,
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
    # ------------------------------------------------- Monde 2 · Le défi (lot D, 21/09/2026)
    "defi": dict(
        sortie="livret_splat_classique_defi",
        qr="qr/defi",
        fiches=FICHES_DEFI,
        # L'exemple de couverture : trois taches, deux paquets, 17 + 18 = 35, 77 − 35 = 42,
        # 42 ÷ 3 = 14 — les trois gestes du livret sur une seule carte (graine 168, choisie le
        # 21/09/2026 ; la graine 47 donnait un total de 69, écarté par Gwenaël). Ce n'est PAS
        # une carte du livret, et aucune carte du livret ne fait 77 avec trois taches. Dans le
        # mode paquets, la tache
        # transparente ÉCRIT le nombre caché (un jeton numéroté) : rien à compter, la leçon
        # du lot K1-bis (« valeur cachée petite ») ne vaut qu'au monde 1.
        exemple=dict(query="mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=3&tasksMax=3"
                           "&visibleMin=2&visibleMax=2&totalMin=50&totalMax=90"
                           "&cards=1&seed=168&unknown=question",
                     vb_carte="100 10 1400 940", vb_corr="140 1010 1180 1145"),
        couv=dict(sur="Mon livret · Monde 2 · Le défi",
                  accroche="Des paquets, des taches…<br>et des totaux jusqu'à 100&nbsp;!",
                  css=CSS_DEFI),
        # DEUX séries seulement, et des QR deux fois plus gros (décision du 21/09/2026).
        # « 2 taches / 4 taches / 6 taches » était le même exercice avec un bouton tourné :
        # ça ne valait pas trois QR, et à quatre par rangée l'adresse de 173 caractères tombe
        # à 0,37 mm par module — court pour un téléphone, pire photocopié. À deux, le QR passe
        # à 32 mm, soit 0,56 mm par module (mesuré sur le PDF).
        # Les deux séries sont LE MÊME JEU que le livret — de 2 à 6 taches, des paquets
        # numérotés — et ne diffèrent que par la tranche des totaux (décision du 21/09/2026).
        # La plus large d'abord, la plus dure ensuite : les quatre dos des deux familles de
        # livrets rangent déjà leurs séries de la plus facile à la plus dure.
        dos=[("Les deux livrets réunis", "De 2 à 6 taches, des totaux de 20 à 100&nbsp;: celles du livret normal et celles-ci, mélangées.",
              serie_defi(2, 6, 20, 100), "serie-1.png"),
             ("Comme ce livret",        "De 2 à 6 taches, des totaux de 50 à 100&nbsp;: le calibre des fiches.",
              serie_defi(2, 6, 50, 100), "serie-2.png")],
        css_dos=CSS_DOS_DEFI,
    ),
}

def lien_jeu(f):
    """Le QR d'une fiche ouvre EXACTEMENT les mêmes cartes en ligne, avec l'étoile de la
    carte des mondes (parcours=m2eN). L'adresse complète de la fiche 7 fait plus de 500
    caractères (les trois activités mises bout à bout) : un QR de cette taille ne se lit
    plus à 17 mm. On passe donc par la page courte splat/classique/livret/?f=N, qui
    renvoie vers l'adresse complète (la même que la carte des mondes, donc la même
    empreinte de reprise)."""
    return f"{SITE}{SC}livret/?f={f.get('qr', f['n'])}"

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

# Ce que dit la boîte du QR : sur les livrets corrigés, même boîte, même QR, même place,
# autre texte (comme le livret corrigé Petit SPLAT!, décision du 20/09/2026). Depuis le
# 23/09/2026 le corrigé est « pour tous » : « Je rejoue ces cartes en ligne », comme l'Enquête.
QR_ELEVE = "J'ai terminé<br>ma fiche,<em>je rejoue en ligne</em>"
QR_PROF = "Je rejoue<br>ces cartes<em>en ligne</em>"

# Sur le livret corrigé, la boîte garde EXACTEMENT la largeur de celle de l'élève
# (23/09/2026) : son texte « Je rejoue / ces cartes / en ligne » est plus étroit, et une
# boîte plus étroite faisait passer la consigne (monde 1, fiches 4 à 6) ou le titre du
# bandeau (monde 2) à la ligne ailleurs que sur la fiche de l'élève. JS_QR pose donc
# d'abord le texte de l'élève (le gabarit), mesure sa largeur, puis écrit le texte du
# corrigé avec cette largeur minimale (aligné à droite, contre le QR, comme l'élève).
JS_QR = """([qr, lib, gabarit]) => {
  const heads = document.querySelectorAll('.printArea .print-page-header');
  if (!heads.length) return 'pas de bandeau imprimé';
  // la zone d'impression est cachée à l'écran : la largeur du texte de l'élève se mesure
  // sur une boîte témoin posée dans la page, hors champ, puis retirée
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
PIED_CORRECTION = PIED_LIVRET + " · correction"

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

# Une fiche du monde 2 tient sur DEUX pages : la première garde « Fiche N — … », la
# seconde devient « Fiche N bis — … », pour qu'un élève sache de quelle feuille il parle.
# Le titre est le sous-titre du bandeau, posé par l'outil depuis le paramètre « title ».
JS_BIS = """(titre) => {
  const st = document.querySelectorAll('.printArea .sheet .print-page-subtitle');
  if (st.length < 2) return 'une seule page imprimée';
  st[1].textContent = titre;
  return 'ok';
}"""

# ---------------------------------------------------------------------------
# LES QUATRE LIVRETS DE CORRECTION (lot K2) : { équation, schéma } × { « ? », lettre }.
CORRECTIONS = [
    dict(suffixe="_correction_equation",        imprime="correction-equation", lettre=False,
         dit="par l'équation · inconnue «&nbsp;?&nbsp;»"),
    dict(suffixe="_correction_equation_lettre", imprime="correction-equation", lettre=True,
         dit="par l'équation · inconnue en lettre"),
    dict(suffixe="_correction_schema",          imprime="correction-schema",   lettre=False,
         dit="par le schéma en barres · inconnue «&nbsp;?&nbsp;»"),
    dict(suffixe="_correction_schema_lettre",   imprime="correction-schema",   lettre=True,
         dit="par le schéma en barres · inconnue en lettre"),
]

# En lettre, les cartes à jetons (mode A, fiche 7) n'ont pas de lettre dans l'outil : on
# leur en donne une, dans l'ordre de la liste de l'outil, sans rien tirer (décision du
# 20/09/2026, « une lettre par carte, livret seulement »), puis on réimprime la feuille.
JS_LETTRES = """() => {
  let n = 0;
  cards.forEach((c, i) => {
    if (!(typeof c.varChar === 'string' && c.varChar.trim())) { c.varChar = variableChars[i % variableChars.length]; n++; }
  });
  printSheet();
  return n;
}"""

# La couverture du livret corrigé : le bandeau rouge sombre « Correction » et « Livret
# corrigé » du livret corrigé Petit SPLAT! (lot K1), avec, sur la même ligne, la correction
# dont il s'agit (décision du 20/09/2026 ; textes « pour tous » du 23/09/2026 — plus de
# « professeur », et « Livret corrigé — par l'équation … », sans répéter « corrigé »).
# La couverture du monde 2 est pleine :
# le bandeau de 14 mm est repris sur la hauteur du cadre « Nom, prénom / Classe », qui
# devient une seule ligne ; le sommaire et le pied restent exactement à leur place.
PROF = dict(bandeau="Correction", ligne="Livret corrigé")
CSS_PROF = """
.bandeau-prof{flex:0 0 14mm;box-sizing:border-box;padding-top:4mm;display:flex;align-items:center;justify-content:center;
  background:#b91c1c;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.ident .champ.prof{flex:1;padding:1.2mm 4mm;text-align:center;line-height:1.2}
.ident .champ.prof span{font-size:17px;color:#063b7a}
.ident .champ.prof small{font-size:12.5px;font-weight:700;color:#475569;margin-left:2.5mm}
.ident .champ.prof small::before{content:"— "}
"""

# L'exemple de couverture : la correction (carte + schéma en barres + équation) de la carte 1 de
# l'adresse NIVEAUX[…]["exemple"], dessinée par renderCardIntoSvg, en deux fenêtres.
JS_EXEMPLE = """() => {
  const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sv.setAttribute('viewBox', '0 0 1600 2200');
  renderCardIntoSvg(sv, cards[0], 'correction');
  const fond = sv.querySelector('rect');
  if (fond && fond.getAttribute('width') === '1600') fond.remove();
  const c = cards[0];
  return {svg: sv.innerHTML, total: c.total, visibles: c.visible, cachees: c.hidden,
          taches: c._num.tasks, parTache: c._num.H};
}"""

JS_COUV = """(d) => {
  const a = document.querySelector('svg.ex-carte'), b = document.querySelector('svg.ex-corr');
  if (!a || !b) return 'pas de place pour l\\'exemple';
  a.innerHTML = d.svg; b.innerHTML = d.svg;
  if (d.vbCarte) a.setAttribute('viewBox', d.vbCarte);
  if (d.vbCorr) b.setAttribute('viewBox', d.vbCorr);
  if (d.sur){ const e = document.querySelector('.tete .sur'); if(!e) return 'pas de sur-titre'; e.textContent = d.sur; }
  if (d.accroche){ const e = document.querySelector('.tete .accroche'); if(!e) return 'pas d\\'accroche'; e.innerHTML = d.accroche; }
  if (d.intro){ const e = document.querySelector('.expl .intro'); if(!e) return 'pas de texte d\\'exemple'; e.innerHTML = d.intro; }
  if (d.sommaire){
    const li = document.querySelectorAll('.som ol li');
    if (li.length !== d.sommaire.length) return 'sommaire : ' + li.length + ' lignes';
    d.sommaire.forEach((t, i) => {
      li[i].querySelector('.badge b').textContent = t[0];
      li[i].querySelectorAll('span')[1].innerHTML = t[1] + '<em>' + t[2] + '</em>';
    });
  }
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
  if (u) u.setAttribute('src', d.univers);
  // (« Mes fiches — je colorie l'étoile » a quitté le dos : relecture du monde 1, lot 2, 25/09/2026)
  return 'ok';
}"""

MOTS = {1: "une", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six"}

def texte_exemple(ex):
    """Le texte « Comment ça marche ? » de la couverture, écrit à partir de la carte que
    l'outil vient de dessiner : il ne peut donc pas mentir sur les nombres de l'exemple."""
    v = list(ex["visibles"])
    n, t, x = ex["taches"], ex["total"], ex["parTache"]
    c = sum(v)
    paquets = " et ".join(str(k) for k in v[:-1]) + f" et {v[-1]}" if len(v) > 2 else f"{v[0]} et {v[1]}"
    taches = (f"la tache cache un paquet de jetons" if n == 1 else
              f"les {MOTS[n]} taches cachent chacune le même nombre de jetons")
    somme = " + ".join(str(k) for k in v)
    return (f"Sur cette carte, il y a {t} jetons au total&nbsp;: il y a {MOTS[len(v)]} paquets "
            f"visibles, qui contiennent {paquets} jetons&nbsp;; {taches}."
            "\n      <span>On a représenté la situation de deux manières&nbsp;: avec un "
            "<b>schéma en barres</b>, et avec une <b>équation</b>. Il faut trouver le nombre de "
            "jetons derrière une tache, on l'a symbolisé par un «&nbsp;<b>?</b>&nbsp;». Ici, les "
            f"taches sont transparentes&nbsp;: on voit les {x} jetons que chacune cache. "
            f"Trois gestes&nbsp;: on <b>additionne</b> les paquets ({somme} = {c}), on "
            f"<b>soustrait</b> ({t} − {c} = {t - c}), puis on <b>divise</b> "
            f"({t - c} ÷ {n} = {x}).</span>")


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
    for f in niv["fiches"]:
        ecrire(lien_jeu(f), f"fiche{f.get('qr', f['n'])}.png")
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

async def pages(niv, tmp, corr=None):
    """corr : None pour le livret de l'élève, sinon un élément de CORRECTIONS."""
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
            if couv is not None and couv.get("css"):
                await pg.add_style_tag(content=couv["css"])
            if couv is not None and couv.get("prof"):
                await pg.add_style_tag(content=CSS_PROF)
            if couv is not None:
                r = await pg.evaluate(JS_COUV, couv)
                if r != "ok":
                    raise SystemExit(f"couverture : {r}")
            if dos is not None:
                if dos.get("css"):
                    await pg.add_style_tag(content=dos["css"])
                r = await pg.evaluate(JS_DOS, dos)
                if r != "ok":
                    raise SystemExit(f"dos : {r}")
            await pg.wait_for_timeout(400)
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        async def pdf_fiche(f, sortie):
            titre = quote(f"Fiche {f['n']} — {f['t']}")
            # livret de correction : l'outil imprime lui-même sa correction courte 6/page ;
            # en lettre, les mêmes graines avec unknown=letter (les nombres ne changent pas)
            parties = f["parties"]
            if corr and corr["lettre"]:
                parties = [q.replace("unknown=question", "unknown=letter") for q in parties]
            imprime = corr["imprime"] if corr else "statement"
            pg = await page_outil(f"{parties[0]}&print={imprime}&layout=6&title={titre}")
            etat = await pg.evaluate(JS_FICHE, parties[1:])
            if corr and corr["lettre"]:
                await pg.evaluate(JS_LETTRES)
            if f["pages"] > 1:
                r = await pg.evaluate(JS_BIS, f"Fiche {f['n']} bis — {f['t']}")
                if r != "ok":
                    raise SystemExit(f"fiche {f['n']}, titre « bis » : {r}")
                if corr:
                    await pg.evaluate(JS_BIS, f"Fiche {f['n']} bis — {f['t']} — Correction")
            if etat["parPage"] != 6:
                raise SystemExit(f"fiche {f['n']} : {etat['parPage']} cartes par page au lieu de 6")
            if etat["feuilles"] != f["pages"]:
                raise SystemExit(f"fiche {f['n']} : {etat['feuilles']} feuilles au lieu de {f['pages']}")
            await pg.add_style_tag(content=CSS_QR)
            r = await pg.evaluate(JS_QR, [f"{qrweb}/fiche{f.get('qr', f['n'])}.png"] + ([QR_PROF, QR_ELEVE] if corr else [QR_ELEVE, None]))
            if r != "ok":
                raise SystemExit(f"fiche {f['n']}, QR : {r}")
            r = await pg.evaluate(JS_PIED, PIED_CORRECTION if corr else PIED_LIVRET)
            if r != "ok":
                raise SystemExit(f"fiche {f['n']}, pied : {r}")
            await pg.wait_for_timeout(600)
            # marges : celles de la feuille de l'outil (@page 8 mm), comme un professeur
            # qui clique sur Imprimer
            await pg.pdf(path=str(sortie), format="A4", print_background=True, prefer_css_page_size=True)
            await pg.close()
            print(f"   fiche {f['n']} : {etat['cartes']} cartes sur {etat['feuilles']} pages")

        couv = dict(exemple, prof=dict(PROF, dit=corr["dit"]) if corr else None,
                    vbCarte=niv["exemple"].get("vb_carte"), vbCorr=niv["exemple"].get("vb_corr"))
        if niv.get("couv"):
            # Les textes qui parlent de l'exemple sont ÉCRITS À PARTIR DE LA CARTE rendue :
            # ils ne peuvent pas se décaler si la graine de l'exemple change un jour.
            v = exemple["visibles"]
            couv.update(
                sur=niv["couv"]["sur"],
                accroche=niv["couv"]["accroche"],
                intro=texte_exemple(exemple),
                sommaire=[[f["n"], f["t"], f["resume"]] for f in niv["fiches"]],
                css=niv["couv"].get("css"),
            )
        await pdf_html(f"{base}{BASE_WEB}/couverture.html", tmp / "p1.pdf", couv=couv)
        for f in niv["fiches"]:
            await pdf_fiche(f, tmp / f"fiche{f['n']}.pdf")
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/{img}"] for nom, desc, _, img in niv["dos"]],
                   univers=f"{qrweb}/univers.png",
                   css=niv.get("css_dos"))
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
    for f in niv["fiches"]:
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
    # Sans option, on refait le livret de l'élève ET ses quatre livrets de correction : ils
    # restent ainsi toujours rendus avec les mêmes graines et la même version de l'outil.
    if "--eleve" in sys.argv and "--correction" in sys.argv:
        raise SystemExit("--eleve et --correction s'excluent (sans option : tous)")
    versions = [None] + CORRECTIONS
    if "--eleve" in sys.argv:
        versions = [None]
    if "--correction" in sys.argv:
        versions = CORRECTIONS
    srv = serveur()
    try:
        for nom in demandes:
            niv = NIVEAUX[nom]
            print(f"— livret « {nom} »")
            if "--qr" in sys.argv:
                fabrique_qr(niv); print("   QR codes régénérés.")
            for corr in versions:
                cible = dict(niv, sortie=niv["sortie"] + corr["suffixe"]) if corr else niv
                with tempfile.TemporaryDirectory() as d:
                    tmp = Path(d)
                    asyncio.run(pages(niv, tmp, corr))
                    assemble(cible, tmp)
                for suffixe in ("", "_a_plier"):
                    compresse(RACINE / "outils" / f"{cible['sortie']}{suffixe}.pdf")
                print(f"   Fait : outils/{cible['sortie']}.pdf et outils/{cible['sortie']}_a_plier.pdf")
    finally:
        srv.shutdown()

if __name__ == "__main__":
    main()
