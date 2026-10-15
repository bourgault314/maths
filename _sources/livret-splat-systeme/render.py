#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère les deux livrets « tablette » du monde 4, SPLAT! Système (lot M4-4, 04/10/2026 ; refaits
aux lots M4-6 et M4-7, 14/10/2026, d'après la conception des deux livrets), à partir du site :
    « SPLAT! Système »            le livret 1, cycle 3, pour tous : fiches 25 à 28
    « SPLAT! Système · cycle 4 »  le livret 2 : fiches 25d à 28d (le Bonus du monde 4 sur la
                                  carte des mondes ; ses fichiers gardent leur nom « tour2 »)

    python3 render.py                    (les deux livrets, l'élève et les deux corrigés)
    python3 render.py systeme            (un seul livret : systeme | tour2)
    python3 render.py --qr               (en refabriquant d'abord les QR codes)
    python3 render.py --eleve            (seulement les livrets de l'élève)
    python3 render.py --correction       (seulement les corrigés)
    python3 render.py --vignettes        (les vignettes de la page des livrets)

LE FORMAT « TABLETTE » (décidé le 04/10/2026, lot M4-3) : TOUTES les pages sont des A4 en
LARGEUR, couverture, pages 2-3 et dos compris. Le livret à plier est fait de 3 feuilles A3 en
HAUTEUR, imprimées recto verso (retournement sur le bord COURT), pliées à l'horizontale et
agrafées sur le pli : on tourne les pages vers le haut, comme une tablette. 12 pages :
    1 couverture · 2-3 l'exemple · 4-5, 6-7, 8-9, 10-11 les quatre fiches · 12 le dos
Une fiche = 4 cartes sur la double page ouverte (2 cartes par page : l'impression 2 par page de
l'outil, page paysage, lot M4-3).

Produit, à la racine du dépôt, pour chaque livret (ex. livret_splat_systeme) :
    outils/livret_splat_systeme.pdf                      12 pages A4 paysage, ordre de lecture
                                                          (« page par page » : le logo de l'IREMI
                                                          dans le bandeau de chaque fiche)
    outils/livret_splat_systeme_a_plier.pdf              3 feuilles A3 en hauteur, recto verso
                                                          (6 pages A3), déjà imposées
et ses deux corrigés (pour tous : on peut les donner aux élèves), chacun avec son « à plier » :
    outils/livret_splat_systeme_correction.pdf           « avec les taches » (les mots des couleurs)
    outils/livret_splat_systeme_correction_lettre.pdf    en lettres (N, B…), comme l'appli
et, pour le livret 2 seulement (lot M4-8), un troisième :
    outils/livret_splat_systeme_tour2_correction_equations.pdf   en équations, étape par étape

LES FICHES ne sont PAS redessinées ici : elles sont imprimées par l'outil du site
(outils/splat.html, mode D, layout=2) avec les graines triées (lots M4-4 et M4-6), et le QR est ajouté
dans le bandeau juste avant l'impression. L'EXEMPLE non plus : la carte et les blocs de sa
correction sont ceux de l'outil (drawSysPlateaux, drawSysCorrectionBlocs), sur une carte qui
n'est PAS dans le livret ; les textes qui citent des nombres sont écrits À PARTIR DE LA CARTE
rendue (textes_exemple).

Dépendances : playwright 1.56.0 (+ chromium), pikepdf, qrcode[pil]. qpdf si disponible.
Le rendu utilise le VRAI Chromium (channel="chromium"), jamais le « headless shell » (il
espace les lettres d'environ 5 %). Les PDF du site se rendent sous Linux (DejaVu Sans), comme
tous les livrets SPLAT!.
"""
import asyncio, http.server, socketserver, threading, functools, sys, json, copy
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-splat-systeme"
PORT = 8126
SITE = "https://mathsgo.re"
COURTE = "/splat/systeme/livret/"               # la page courte des QR (?f=fiche, ?s=série)

# ---------------------------------------------------------------------------
# LES HUIT FICHES. Une fiche = un réglage + une graine ; les graines sont TRIÉES (hors dépôt :
# le vrai générateur rejoué dans Chromium, carte par carte) pour que chaque carte ait son type
# imposé, dans l'ordre de la fiche.
# LIVRET 1, cycle 3 (lot M4-6, 14/10/2026 : la conception des deux livrets du monde 4, § 3) —
# une idée par fiche, 4 cartes qui diffèrent par ce que l'élève réfléchit :
#   25 Je retire         une tache de plus (1b, une seule tache de la 1re couleur : c'est trouvé) ·
#                        le petit plateau d'une seule couleur (1a, 2 taches de l'autre couleur au
#                        moins : je partage deux fois) · je partage (1c, pas la forme de l'exemple,
#                        2 + 3 contre 2 + 1) · le petit plateau tient deux fois dans le grand (2a)
#   26 Je remplace       trois couleurs (1d) · l'escalier (1e) · trois couleurs (1d) · le double
#                        dépasse (2d : sens=INDICE, le petit plateau 1 + 2)
#   27 J'additionne      miroir 1-2 (3a) · trois paires (3b) · miroir 2-3 (3a) · miroir 1-3 (3a+,
#                        forme=MIX, lot M4-5)
#   28 À toi de choisir  deux cartes qui se ressemblent par page, pas le même geste (choix de
#                        Gwenaël du 14/10, à la place du désordre et des jetons de la conception) :
#                        p. 10, le même plateau 1 + 3 — contre 1 + 1 je retire (1c), contre 3 + 1
#                        j'additionne (miroir 1-3, 3a+) ; p. 11, le même plateau 2 + 3 — contre
#                        1 + 2 le double dépasse (2d), contre 3 + 2 j'additionne (miroir 2-3, 3a)
# LIVRET 2, cycle 4, le Bonus du monde 4 (lot M4-7, 14/10/2026 : la conception, § 4) — totaux
# 50 à 100, « Le système » sous chaque carte (systeme=1), ce que le cycle 3 n'a pas vu :
#   25d Je recopie, puis je retire   le cas 3 recopié 2 fois : le plateau à recopier à gauche
#                       (1 tache de la 1re couleur), à droite, à gauche, à droite avec 2 taches
#   26d Deux fois ou trois fois ?    3 fois, 2 fois, 3 fois (il reste 7 taches), 2 fois : l'élève
#                       choisit combien de fois recopier ; plateau à recopier à droite en 2 et 4
#   27d Deux gestes à la suite       les deux petits plateaux d'abord — je retire (4e·1c),
#                       j'additionne (4e·3a), je recopie (4e·3c·2, son corrigé à 89 % : choix de
#                       Gwenaël du 14/10, REDUITE_PERMISE), le double dépasse (4e·2d) —, puis
#                       je remplace dans le grand
#   28d À toi de choisir             trois couleurs et un jeton visible (1d), trois paires (3b),
#                       je recopie 3 fois (3c·3), deux gestes en miroir (4e·3a) — plateaux mélangés
# Et partout : totaux tous différents dans une fiche (ceux des petits plateaux compris), deux
# cartes jamais des mêmes couleurs, plus petite valeur ≥ 3 (livret 2 : ≥ 5, et tous les totaux de
# 30 à 100), jamais de carte de secours, aucune carte en double sur les deux livrets, les exemples
# et les défis (controle_global).
# Ces adresses sont AUSSI celles de la carte des mondes (SYS_FICHES, SYS_TOUR2) et de la page
# courte des QR : un test les compare. Ne jamais changer une graine sans refaire les PDF.
SYS_COMMUN = "&cards=4&unknown=question"
T = "&totalMin=20&totalMax=60"
V0 = "&visibleMin=0&visibleMax=0"
S25 = "mode=D&geste=MIX&gestes=PARTIELLE,COEF,DOUBLE" + V0 + T + "&seed=1196"
S26 = "mode=D&geste=MIX&gestes=EMBOITE1,ESCALIER,DOUBLE&sens=INDICE" + V0 + T + "&seed=29"
S27 = "mode=D&geste=MIX&gestes=MIROIR,TROIS&forme=MIX" + V0 + T + "&seed=723"
S28 = "mode=D&geste=MIX&gestes=COEF,MIROIR,DOUBLE&forme=MIX&sens=INDICE" + V0 + T + "&seed=117944"
T2 = "&totalMin=50&totalMax=100"
S25D = "mode=D&geste=RECOPIE&fois=2&ordre=MELANGE" + V0 + T2 + "&seed=70569"
S26D = "mode=D&geste=RECOPIE&fois=MIX&ordre=MELANGE" + V0 + T2 + "&seed=341052"
S27D = "mode=D&geste=ETAGES&fois=2&indice=12&sens=INDICE" + V0 + T2 + "&seed=394968"
S28D = "mode=D&geste=MIX&gestes=EMBOITE1,TROIS,RECOPIE,ETAGES&fois=3&sous=MIROIR&ordre=MELANGE&visibleMin=1&visibleMax=3" + T2 + "&seed=33590"

# Le type attendu de chaque carte (vérifié au rendu : render.py s'arrête si une graine a bougé).
TYPES = {
    "25": ["1b", "1a", "1c", "2a"], "26": ["1d", "1e", "1d", "2d"], "27": ["3a", "3b", "3a", "3a+"], "28": ["1c", "3a+", "2d", "3a"],
    "25d": ["3c·2"] * 4, "26d": ["3c·3", "3c·2", "3c·3", "3c·2"], "27d": ["4e·1c", "4e·3a", "4e·3c·2", "4e·2d"],
    "28d": ["1d", "3b", "3c·3", "4e·3a"],
}
# Livret 2 (lot M4-7) : le plateau à recopier est dessiné à droite sur les cartes 2 et 4 (ordre
# des plateaux mélangé), à gauche sur les cartes 1 et 3 — vérifié au rendu.
A_DROITE = {"25d": [False, True, False, True], "26d": [False, True, False, True]}
# Les cartes qui ont des jetons visibles (les autres n'en ont pas) — vérifié au rendu.
JETONS = {"28d": [True, False, False, False]}
# Une seule carte réduite permise, et pas en dessous de ce seuil (choix de Gwenaël du 14/10 :
# « deux gestes, je recopie » ne tient qu'à 89 % en 2 par page) : {fiche: {rang: échelle mini}}.
REDUITE_PERMISE = {"27d": {2: 0.88}}

def fiche(code, t, q, resume):
    return dict(code=code, t=t, q=q, resume=resume)

FICHES_1 = [
    fiche("25", "Je retire", S25, "Le petit plateau est dans le grand&nbsp;: retire-le."),
    fiche("26", "Je remplace", S26, "Je remplace un plateau par son total."),
    fiche("27", "J'additionne", S27, "J'additionne les plateaux, puis je partage."),
    fiche("28", "À toi de choisir", S28, "Deux cartes se ressemblent&nbsp;:<br>je choisis le geste."),
]
# Fiche 28 (lot M4-6) : les deux cartes d'une page ont le même premier plateau (même nombre de
# taches de chaque couleur, couleurs différentes) — vérifié au rendu.
JUMELLES = {"28": [(0, 1), (2, 3)]}
# Les fiches dont aucun plateau n'est à sa place habituelle (ordre=MELANGE).
DESORDRE = {"28d"}
FICHES_2 = [
    fiche("25d", "Je recopie, puis je retire", S25D, "Je recopie un plateau, j'y retrouve l'autre."),
    fiche("26d", "Deux fois ou trois fois\u00a0?", S26D, "Je choisis combien de fois recopier."),
    fiche("27d", "Deux gestes à la suite", S27D, "Les petits plateaux d'abord, puis le grand."),
    fiche("28d", "À toi de choisir", S28D, "Tous les gestes, plateaux mélangés."),
]

# Les séries infinies du dos : pas de graine, quatre cartes nouvelles à chaque ouverture (huit
# jusqu'au 08/10/2026, Enquête et Système ; « Je révise » compris), en mode
# élève sans étape (rien n'est enregistré). Leurs QR passent par la page courte (?s=7…12 ; les
# séries 1 à 6 des livrets du 25/09 restent servies pour un livret déjà imprimé).
# Lot M4-6 (14/10/2026) : les séries 7 à 9 suivent le livret 1 refait — 7 comme la fiche 25,
# 8 comme les fiches 26 et 27, 9 tous les gestes du livret ;
# 13 : la série du défi du livret 1 (je recopie un plateau, 2 ou 3 fois), son QR est au dos.
# Lot M4-7 : les séries 10 à 12 suivent le livret 2 (totaux 50 à 100) — 10 comme les fiches 25d et
# 26d, 11 comme la fiche 27d, 12 tous les gestes des deux livrets, des jetons, le désordre ;
# 14 : la série du défi du livret 2 (je recopie 4 fois ; deux gestes, le double dépasse — en
# désordre), son QR est au dos, et les deux cartes du défi en sont une graine.
SERIES = {
    7: "mode=D&geste=MIX&gestes=PARTIELLE,COEF,DOUBLE" + V0 + T,
    8: "mode=D&geste=MIX&gestes=EMBOITE1,ESCALIER,DOUBLE,MIROIR,TROIS&sens=INDICE&forme=MIX" + V0 + T,
    9: "mode=D&geste=MIX&gestes=PARTIELLE,COEF,DOUBLE,EMBOITE1,ESCALIER,MIROIR,TROIS&sens=MIX&forme=MIX" + V0 + T,
    10: "mode=D&geste=RECOPIE&fois=MIX" + V0 + T2,
    11: "mode=D&geste=ETAGES" + V0 + T2,
    12: "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR,TROIS,ESCALIER,RECOPIE,ETAGES&sens=MIX&forme=MIX&fois=MIX&ordre=MELANGE&visibleMin=1&visibleMax=3" + T2,
    13: "mode=D&geste=RECOPIE&fois=MIX" + V0 + T,
    14: "mode=D&geste=MIX&gestes=RECOPIE,ETAGES&fois=4&sous=DOUBLE&indice=12&sens=INDICE&ordre=MELANGE" + V0 + T2,
}
SERIE_CARTES = 4

# Les exemples (couverture et pages 2-3) : le geste de la première fiche du livret, une carte
# HORS des fiches, la tache noire et la tache bleue (comme les exemples de l'Enquête).
#   livret 1 (COEF, je partage, graine 82) : 2 noires + 3 bleues = 42 ; 2 noires + 1 bleue = 30
#     → 2 bleues = 12, bleue = 6 ; 2 noires = 24, noire = 12 ;
#   livret 2 (RECOPIE, je recopie 2 fois, graine 116, lot M4-7) : 1 noire + 3 bleues = 58 ;
#     2 noires + 1 bleue = 46 → 2 × 58 = 116, 116 − 46 = 70 = 5 bleues, bleue = 14 ; noire = 16.
# Et la carte « À toi ! » de la page 3 : la même forme, d'autres couleurs, d'autres nombres.
EX_1 = "mode=D&geste=COEF&ecart=2" + V0 + T + "&cards=1&unknown=question&seed=82"
ATOI_1 = "mode=D&geste=COEF&ecart=2" + V0 + T + "&cards=1&unknown=question&seed=5"
EX_2 = "mode=D&geste=RECOPIE&fois=2" + V0 + T2 + "&cards=1&unknown=question&seed=116"
ATOI_2 = "mode=D&geste=RECOPIE&fois=2" + V0 + T2 + "&cards=1&unknown=question&seed=846"

# « Le défi ! » au dos (04/10/2026, demande de Gwenaël : « des trucs qu'on n'aurait pas osé
# mettre ») : deux cartes du livret, plus difficiles — l'énoncé et sa place pour chercher dans le
# livret de l'élève, la correction à la même place dans les corrigés.
#   livret 1 (lot M4-6) : le cas 3, que le livret n'a pas montré — aucun plateau ne tient dans
#     l'autre : on en recopie un 2 fois (carte 1), puis 3 fois (carte 2), on y retrouve l'autre,
#     on retire. Les deux cartes : la série 13 (geste=RECOPIE&fois=MIX), dont le QR « D'autres
#     défis en ligne » est au dos (pas dans les corrigés) ;
#   livret 2 (lot M4-7, choix de Gwenaël du 14/10) : je recopie 4 fois, puis deux gestes « le
#     double dépasse », plateaux mélangés — une graine de la série 14, dont le QR est au dos (le
#     défi de la conception, deux gestes recopiés 3 fois, ne tient qu'à 89 %).
DEFI_1 = [dict(q=SERIES[13] + "&seed=3", n=2, types=["3c·2", "3c·3"])]
DEFI_2 = [dict(q=SERIES[14] + "&seed=21", n=2, types=["3c·4", "4e·2d"])]

LIVRETS = {
    "systeme": dict(
        sortie="livret_splat_systeme",
        fiches=FICHES_1,
        exemple=dict(query=EX_1, atoi=ATOI_1, geste="COEF"),
        couv=dict(sur="Mon livret · Monde 4", titre="Système",
                  accroche="Plusieurs plateaux…<br>compare-les pour tout trouver&nbsp;!"),
        dos=dict(
            series=[("Je retire", "Comme la fiche&nbsp;25.", 7),
                    ("Je remplace, j'additionne", "Comme les fiches&nbsp;26 et&nbsp;27.", 8),
                    ("Tout mélangé", "À toi de choisir le geste&nbsp;!", 9)],
            suite="Pour aller plus loin&nbsp;: le <b>Bonus</b> du monde&nbsp;4… ou le monde&nbsp;5, <b>SPLAT! Équations</b>.",
            defi=DEFI_1, defi_dit="Aucun plateau ne tient dans l'autre… Et si tu en recopiais un&nbsp;?",
            defi_qr=13),
    ),
    # le livret 2, cycle 4 (lot M4-7) : ses fichiers gardent le nom « tour2 » ; « systeme » : la
    # ligne « Le système » sous chaque carte (fiches, défi, pages 2 et 3)
    "tour2": dict(
        sortie="livret_splat_systeme_tour2",
        fiches=FICHES_2,
        systeme=True,
        exemple=dict(query=EX_2, atoi=ATOI_2, geste="RECOPIE"),
        couv=dict(sur="Mon livret · Monde 4 · Bonus", titre="Système · cycle&nbsp;4",
                  accroche="Aucun plateau ne tient dans l'autre&nbsp;?<br>Recopie-en un&nbsp;!",
                  consigne="Sur les fiches, la place sous chaque carte est pour toi&nbsp;: <b>écris le système, dessine le schéma</b>, puis trouve ce que cache chaque couleur — comme l'exemple des pages&nbsp;2 et&nbsp;3."),
        dos=dict(
            series=[("Je recopie", "Comme les fiches&nbsp;25d et&nbsp;26d.", 10),
                    ("Deux gestes à la suite", "Comme la fiche&nbsp;27d.", 11),
                    ("Le grand défi", "Tous les gestes, des jetons, le désordre.", 12)],
            suite="Va voir le monde&nbsp;5, <b>SPLAT! Équations</b>&nbsp;: des taches des deux côtés, et on écrit l'équation&nbsp;!",
            defi=DEFI_2, defi_dit="Recopier 4 fois… puis deux gestes, dans le désordre&nbsp;!",
            defi_qr=14),
    ),
}

def lien_fiche(code):
    return f"{SITE}{COURTE}?f={code}"

def lien_serie(s):
    return f"{SITE}{COURTE}?s={s}"

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"

# ---------------------------------------------------------------------------
# LES FICHES : le QR dans le bandeau, dans une boîte blanche (comme les autres mondes). Le
# bandeau du 2 par page (14 mm) grandit juste assez pour un QR de 14 mm.
CSS_QR = """
.printArea.print-2up .print-page-header{flex-basis:17.5mm !important}
.printArea .print-page-title-block{flex:1 1 auto;min-width:0;align-items:center}
.printArea .print-page-subtitle{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.12}
.qr-livret{display:flex;align-items:center;gap:2.5mm;background:#fff;border-radius:2mm;padding:0.8mm 1.2mm 0.8mm 2.5mm;margin-left:auto;margin-right:2mm;flex:0 0 auto}
.qr-livret img{width:14mm;height:14mm;display:block}
.qr-livret .lib{text-align:right;font-size:10.5px;font-weight:900;color:#0f172a;line-height:1.2;white-space:nowrap}
.qr-livret .lib em{display:block;font-style:normal;font-weight:400;font-size:9.5px;color:#475569;margin-top:0.4mm}
"""
QR_ELEVE = "J'ai terminé<br>ma fiche,<em>je rejoue en ligne</em>"
QR_CORR = "Je rejoue<br>ces cartes<em>en ligne</em>"

# Le QR est imprimé UNE fois par fiche, en haut de sa première page (décision du 04/10/2026) : la
# double page est une seule fiche, ses 4 cartes sont une seule série en ligne (une étoile) ; la
# page du bas garde son bandeau et son titre.
JS_QR = """([qr, lib]) => {
  const heads = document.querySelectorAll('.printArea .print-page-header');
  if (heads.length !== 2) return heads.length + ' bandeaux au lieu de 2';
  [heads[0]].forEach(h => {
    const box = document.createElement('div'); box.className = 'qr-livret';
    box.innerHTML = '<div class="lib">' + lib + '</div><img src="' + qr + '" alt="">';
    const logos = h.querySelector('.print-page-logos');
    h.insertBefore(box, logos || null);
  });
  return 'ok';
}"""

PIED_LIVRET = "mathsgo.re/splat · CC BY-NC-SA 4.0"
PIED_CORRECTION = PIED_LIVRET + " · correction"
# Un titre trop long pour une ligne se coupe APRÈS le tiret (comme les autres mondes).
JS_TITRE = r"""() => {
  const st = document.querySelectorAll('.printArea .print-page-subtitle');
  if (!st.length) return 'pas de titre';
  st.forEach(e => {
    const t = e.textContent, i = t.indexOf(' — ');
    e.style.whiteSpace = 'nowrap';
    const bloc = e.parentElement;
    const trop = bloc.scrollWidth > bloc.clientWidth + 1;
    e.style.whiteSpace = '';
    if (trop && i > 0) {
      const corr = t.endsWith(' — Correction') ? ' — Correction' : '';
      const tete = t.slice(0, i) + (corr || ' —');
      const suite = t.slice(i + 3, t.length - corr.length).replace(/(\d) /g, '$1 ');
      e.textContent = ''; e.append(tete); e.appendChild(document.createElement('br')); e.append(suite);
      const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.12;
      const f0 = parseFloat(getComputedStyle(e).fontSize);
      for (let k = 1; k <= 4 && e.getBoundingClientRect().height > 2.4 * lh * (1 - 0.05 * (k - 1)); k++)
        e.style.fontSize = (f0 * (1 - 0.05 * k)) + 'px';
    }
  });
  return 'ok';
}"""

# Les logos (décisions du 25/09 et du 04/10/2026, les mêmes qu'aux mondes 1 à 3) : aucun logo sur
# les fiches du livret à plier (JS_SANS_LOGO) ; dans le PDF page par page, l'IREMI SEUL dans le
# bandeau de chaque fiche, à droite de la boîte du QR (JS_IREMI_SEUL) — un collègue qui imprime
# une seule fiche n'a pas le dos ; maths&go est déjà au pied (mathsgo.re/splat). On retire les
# blocs AU RENDU, jamais dans l'outil (une fiche imprimée depuis le générateur garde ses deux
# logos). Chaque fiche est donc rendue deux fois, mêmes graines : seul le bandeau diffère.
JS_SANS_LOGO = """() => {
  const l = document.querySelectorAll('.printArea .print-page-logos');
  if (!l.length) return 'pas de logos dans le bandeau';
  l.forEach(e => e.remove());
  return 'ok';
}"""
JS_IREMI_SEUL = """() => {
  const l = document.querySelectorAll('.printArea .print-page-logos');
  if (!l.length) return 'pas de logos dans le bandeau';
  for (const e of l) {
    const mg = e.querySelectorAll('.print-page-logo-maths'), ir = e.querySelectorAll('.print-page-logo-irem');
    if (mg.length !== 1 || ir.length !== 1) return 'logos inattendus dans le bandeau';
    mg[0].remove();
  }
  return 'ok';
}"""

JS_PIED = """(texte) => {
  const f = document.querySelectorAll('.printArea .print-page-footer');
  if (!f.length) return 'pas de pied de page';
  f.forEach(e => { e.textContent = texte; });
  return 'ok';
}"""

# Le type d'une carte (la classification du monde 4, monde-4-audit-et-plan.md § 2), lu sur son
# modèle : c'est ce que render.py vérifie fiche par fiche (TYPES). Depuis le lot M4-5 (14/10/2026),
# la fonction vit dans l'outil (sysTypeCarte, outils/splat.html), avec les codes nouveaux : « 3a+ »
# le miroir 1-3, « 3c·2 », « 3c·3 », « 3c·4 » Je recopie (2, 3 ou 4 fois), « 4e·<type> » Deux
# gestes à la suite (le type de ses deux petits plateaux : « 4e·1c », « 4e·3c·2 »…).
JS_TYPE = r"""const typeSys = c => sysTypeCarte(c);"""

# La feuille imprimée telle que l'outil la fabrique, et ses cartes : total, valeurs de chaque
# couleur, plateaux (pour vérifier que l'élève et les deux corrigés ont les mêmes cartes).
JS_FICHE = "() => {" + JS_TYPE + r"""
  printSheet();
  return {cartes: cards.map(c => [c.total, JSON.stringify(c.hidden.slice().sort((a, b) => a - b)),
                                  JSON.stringify(c._sys.boards.map(b => [c._sys.colors.map(k => b.counts[k] || 0), b.total, b.visible || []]))]),
          types: cards.map(typeSys), secours: cards.some(c => !!c._sys.secours),
          premiers: cards.map(c => JSON.stringify(c._sys.colors.map(k => c._sys.boards[0].counts[k] || 0))),
          // l'ordre des plateaux MONTRÉS (« trois paires » ne montre pas son plateau sans total)
          ordres: cards.map(c => c._sys.ordre ? c._sys.ordre.filter(i => sysPlateauxMontres(c).includes(i)) : null),
          feuilles: document.querySelectorAll('.printArea .sheet').length, parPage: getPrintCardsPerPage(),
          ligneSysteme: document.querySelectorAll('.printArea #sysLigneSystemePrint').length,
          echelles: [...document.querySelectorAll('#sysCorrectionPrint')].map(g => g.getAttribute('data-echelle')),
          equations: [...document.querySelectorAll('#sysCorrectionPrint')].map(g => g.getAttribute('data-equations') === '1')};
}"""

# ---------------------------------------------------------------------------
# LES CORRIGÉS (pour tous) : la correction imprimée de l'outil (print=correction, 2 par page :
# l'énoncé dévoilé en haut, puis les blocs encadrés, lot M4-3), aux mêmes pages que l'élève.
CORRECTIONS = [
    # (« inconnue ? » ne veut rien dire ici : les cases portent le nom de la tache — 04/10/2026)
    dict(suffixe="_correction", lettre=False, dit="avec les taches"),
    # 25/09/2026 (demande de Gwenaël) : les mêmes corrigés « en lettres », comme l'appli les écrit
    # avec unknown=letter — l'initiale de chaque couleur (2 × N + 3 × B = 42 ; B = 12 ÷ 2 = 6).
    dict(suffixe="_correction_lettre", lettre=True, dit="en lettres"),
    # lot M4-8 (14/10/2026, idée de Gwenaël, décidé sur planches) : le livret 2 seulement, un 3e
    # corrigé « en équations » — l'outil avec corrige=equations : les équations seules, étape par
    # étape, sans les barres ni le dessin de la carte, les systèmes avec leur accolade
    # (2 × (N + 3 × B) = 2 × 58 ; (2 × N + B) + 5 × B = 116 ; 5 × B = 116 − 46 = 70)
    dict(suffixe="_correction_equations", lettre=True, equations=True, dit="en équations", livrets=("tour2",)),
]
PROF = dict(bandeau="Correction", ligne="Livret corrigé")
CSS_PROF = """
.bandeau-prof{position:absolute;top:0;left:0;right:0;height:9mm;z-index:5;display:flex;align-items:center;justify-content:center;
  background:#b91c1c;color:#fff;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.ident .champ.prof{padding:2.5mm 4mm;text-align:center;line-height:1.25}
.ident .champ.prof span{display:block;font-size:17px;color:#7c2d12}
.ident .champ.prof small{display:block;font-size:12.5px;font-weight:700;color:#475569;margin-top:1mm}
"""

# ---------------------------------------------------------------------------
# L'EXEMPLE ET LA CARTE « À TOI » : dessinés par l'outil. La carte (ses plateaux, comme sur la
# fiche, drawSysPlateaux), puis les blocs de la correction (drawSysCorrectionBlocs, le corrigé
# 2 par page) : tous ensemble (« bloc » = null) ou bloc par bloc. « vide » : le même schéma sans
# ses nombres (totaux, calculs, valeurs trouvées, réponse) — la carte « À toi ! » de la page 3.
# Les couleurs var(--…) de l'outil sont résolues (sinon une pastille sortirait noire).
JS_EXEMPLE = r"""(opts) => {
  const NS = 'http://www.w3.org/2000/svg', card = cards[0];
  if (!card || !card._sys || !Array.isArray(card._sys.plan)) return {erreur: 'pas une carte du Système'};
  const mkEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const mkText = (x, y, t, a = {}) => { const e = mkEl('text', {x, y, ...a}); e.textContent = t; return e; };
  const mk = (w, h) => { const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    sv.setAttribute('width', w); sv.setAttribute('height', h); document.body.appendChild(sv); return sv; };
  const boite = (sv, m) => { const bb = sv.getBBox(); return [Math.floor(bb.x) - m, Math.floor(bb.y) - m, Math.ceil(bb.width) + 2 * m, Math.ceil(bb.height) + 2 * m].join(' '); };
  const cs = getComputedStyle(document.body), inconnues = new Set();
  const resout = s => s.replace(/var\((--[\w-]+)\)/g, (m, n) => { const v = cs.getPropertyValue(n).trim(); if (!v) inconnues.add(n); return v || m; });
  // la carte : ses plateaux seulement (le 2 par page de l'énoncé, sans la ligne réponse)
  const sc = mk(1830, 2200);
  const dispo = drawSysPlateaux(sc, card, SYS_ZONE_IMPRIME_2P, {mkEl, mkText, isPrint: true, devoile: false});
  const carte = {svg: resout(sc.innerHTML), vb: boite(sc, 16)};
  // livret 2 (lot M4-7) : la même carte, « Le système » dessous — rempli (l'exemple, et la carte
  // « À toi » des corrigés) ou à remplir (« À toi » de l'élève) ; la couverture garde la carte seule
  let carteSys = null;
  if (opts.systeme) {
    drawSysLigneSysteme(sc, card, dispo, {mkEl, mkText}, !!opts.rempli);
    carteSys = {svg: resout(sc.innerHTML), vb: boite(sc, 16)};
  }
  sc.remove();
  // les blocs de la correction
  const ctx = {mkEl, mkText, isPrint: true, lettres: !numberedQuestionMarkMode};
  const plan = card._sys.plan;
  // « vide » : le même dessin, puis ses nombres effacés (totaux, valeurs trouvées, blocs, calculs
  // gris) — le plan n'est pas touché, la mise en page reste exactement celle du corrigé ; « Je
  // vérifie » garde ses lignes, en pointillés, et la réponse « noire = …… ».
  const vider = p => p.map(e => {
    if (e.role !== 'verification') return e;
    const x = JSON.parse(JSON.stringify(e));
    x.lignes = (x.lignes || []).map(() => '…………………………………………'); (x.reponses || []).forEach(r => { r.value = '……'; });
    return x;
  });
  const dessine = etapes => {
    const sv = mk(1740, 8000), g = mkEl('g'); sv.appendChild(g);
    const c2 = Object.assign({}, card, {_sys: Object.assign({}, card._sys, {plan: opts.vide ? vider(etapes) : etapes})});
    drawSysCorrectionBlocs(g, c2, 100, 7900, ctx);
    const trait = g.querySelector(':scope > line'); if (trait) trait.remove();   // le pointillé sous l'énoncé
    // les nombres : en noir dans les barres (totaux, valeurs trouvées, blocs), en gris à côté
    // (calculs) ; les noms des taches sont en blanc, les titres en encre (#0f172a) : ils restent
    if (opts.vide) g.querySelectorAll('text[fill="#000"], text[fill="#475569"]').forEach(t => t.remove());
    // le système écrit à côté des barres (« 1 orange + 3 noires = 53 ») : c'est à l'élève de
    // l'écrire (lot M4-7 : la ligne « Le système » de la carte « À toi ! »)
    if (opts.vide) g.querySelectorAll('text.sysSystemeEcrit').forEach(t => t.remove());
    const r = {svg: resout(sv.innerHTML), vb: boite(sv, 6), echelle: (g.querySelector('#sysCorrectionPrint') || {getAttribute: () => '?'}).getAttribute('data-echelle')};
    sv.remove(); return r;
  };
  const etapes = plan.filter(e => e.role !== 'verification'), verif = plan.find(e => e.role === 'verification');
  const blocs = sysBlocs(etapes).map(b => Object.assign(dessine(b), {roles: b.map(e => e.role), titres: b.map(e => e.titre)}));
  if (verif) blocs.push(Object.assign(dessine([verif]), {roles: ['verification'], titres: [verif.titre]}));
  const tout = dessine(plan);
  // le corrigé en équations (lot M4-8) : toutes les étapes, en une colonne, comme sur les fiches
  let eq = null;
  if (opts.equations) {
    const sv = mk(1740, 8000), g = mkEl('g'); sv.appendChild(g);
    drawSysCorrectionEquations(g, card, 0, 7900, ctx, {x: 0, xMax: 1740});
    const e = g.querySelector('#sysCorrectionPrint');
    eq = {svg: resout(sv.innerHTML), vb: boite(sv, 10), echelle: e.getAttribute('data-echelle'), colonnes: e.getAttribute('data-colonnes')};
    sv.remove();
  }
  if (inconnues.size) return {erreur: 'variables de couleur inconnues : ' + [...inconnues].join(', ')};
  const s = card._sys, mot = k => investigateColorWord(investigateColorByKey(k));
  return {carte, carteSys, tout, eq, blocs, lettre: ctx.lettres, geste: s.geste, total: card.total, visibles: card.visible,
          couleurs: s.colors.map(k => ({k, mot: mot(k), pluriel: SYS_COULEURS_PLURIEL[k], valeur: s.values[k]})),
          plateaux: s.boards.map(b => ({counts: s.colors.map(k => b.counts[k] || 0), total: b.total})),
          cle: [card.total, JSON.stringify(card.hidden.slice().sort((a, b) => a - b)),
                JSON.stringify(s.boards.map(b => [s.colors.map(k => b.counts[k] || 0), b.total, b.visible || []]))]};
}"""

# Les cartes du défi (dos) : l'énoncé 2 par page (les plateaux, la place pour chercher, la ligne
# réponse remontée), ou son corrigé (l'énoncé dévoilé et les blocs), tels que l'outil les dessine.
JS_DEFI = r"""([n, corr, haut]) => {
  printSheet();
  const svgs = [...document.querySelectorAll('.printArea .pCard svg')].slice(0, n);
  if (svgs.length !== n) return {erreur: svgs.length + ' cartes au lieu de ' + n};
  const cs = getComputedStyle(document.body), inconnues = new Set();
  const resout = s => s.replace(/var\((--[\w-]+)\)/g, (m, k) => { const v = cs.getPropertyValue(k).trim(); if (!v) inconnues.add(k); return v || m; });
  const out = svgs.map(sv => {
    const c = sv.cloneNode(true); c.removeAttribute('style'); c.removeAttribute('width'); c.removeAttribute('height');
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const vb = c.getAttribute('viewBox').split(/\s+/).map(Number);
    if (!corr) {
      // l'énoncé : la ligne réponse remonte, la carte raccourcit à « haut »
      const lr = c.querySelector('#sysLigneReponsePrint');
      if (!lr) return null;
      lr.setAttribute('transform', 'translate(0 ' + (haut - vb[3]) + ')');
      c.setAttribute('viewBox', [vb[0], vb[1], vb[2], haut].join(' '));
      const fond = c.querySelector('rect'); if (fond) fond.setAttribute('height', haut);
    } else {
      // le corrigé : jusqu'au bas du dessin (mesuré sans le fond blanc de la carte)
      document.body.appendChild(c);
      const fond0 = c.querySelector('rect'); if (fond0) fond0.setAttribute('height', 0);
      const bb = c.getBBox(); c.remove();
      const h = Math.ceil(bb.y + bb.height + 40);
      c.setAttribute('viewBox', [vb[0], vb[1], vb[2], h].join(' '));
      const fond = c.querySelector('rect'); if (fond) fond.setAttribute('height', h);
    }
    return resout(c.outerHTML);
  });
  if (out.some(x => !x)) return {erreur: 'pas de ligne réponse'};
  if (inconnues.size) return {erreur: 'variables de couleur inconnues : ' + [...inconnues].join(', ')};
  return {svgs: out, echelles: [...document.querySelectorAll('#sysCorrectionPrint')].map(g => g.getAttribute('data-echelle')),
          types: cards.slice(0, n).map(c => sysTypeCarte(c)), secours: cards.slice(0, n).some(c => !!c._sys.secours),
          cles: cards.slice(0, n).map(c => [c.total, JSON.stringify(c.hidden.slice().sort((a, b) => a - b)),
            JSON.stringify(c._sys.boards.map(b => [c._sys.colors.map(k => b.counts[k] || 0), b.total, b.visible || []]))])};
}"""

JS_COUV = """(d) => {
  const e = document.querySelector('svg.ex-carte'); if (!e) return 'pas de place pour la carte';
  e.innerHTML = d.carte; e.setAttribute('viewBox', d.vbCarte);
  const txt = (sel, html) => { const x = document.querySelector(sel); if (!x) return false; x.innerHTML = html; return true; };
  if (!txt('.tete .sur', d.sur) || !txt('.tete h1 span', d.titre) || !txt('.tete .accroche', d.accroche) || !txt('.expl .intro', d.intro)) return 'textes de couverture';
  if (d.consigne && !txt('.atoi .t', d.consigne)) return 'pas de consigne en bas de la couverture';
  const h1 = document.querySelector('.tete h1').getBoundingClientRect(), hero = document.querySelector('.tete .hero').getBoundingClientRect();
  if (h1.height > 70) return 'titre sur deux lignes : ' + d.titre;
  const mots = document.createRange(); mots.selectNodeContents(document.querySelector('.tete h1'));
  if (mots.getBoundingClientRect().right > hero.left - 4) return 'le titre touche le dessin : ' + d.titre;
  const li = document.querySelectorAll('.som ol li');
  if (li.length !== d.sommaire.length) return 'sommaire : ' + li.length + ' lignes';
  d.sommaire.forEach((t, i) => {
    const b = li[i].querySelector('.badge b'); b.textContent = t[0]; b.classList.toggle('d', String(t[0]).length > 2);
    li[i].querySelectorAll('span')[1].innerHTML = t[1] + '<em>' + t[2] + '</em>';
  });
  if (d.prof) {
    const id = document.querySelector('.ident');
    if (!id) return 'pas de ligne Nom, prénom / Classe';
    document.body.insertAdjacentHTML('afterbegin', '<div class="bandeau-prof">' + d.prof.bandeau + '</div>');
    id.innerHTML = '<div class="champ prof"><span>' + d.prof.ligne + '</span><small>' + d.prof.dit + '</small></div>';
  }
  // rien ne déborde (la page a une hauteur fixe)
  const pied = document.querySelector('.pied').getBoundingClientRect();
  for (const s of ['.expl', '.som']) {
    const r = document.querySelector(s).getBoundingClientRect();
    if (r.bottom > pied.top + 0.5) return 'la couverture déborde sur le pied (' + s + ')';
  }
  const intro = document.querySelector('.expl .intro');
  if (intro.scrollHeight > intro.clientHeight + 1) return 'le texte de « Comment ça marche ? » déborde';
  return 'ok';
}"""

# Pages 2 et 3 : la carte et son texte à gauche ; à droite soit un grand dessin (toute la
# correction, ou le schéma à compléter), soit des étapes (pastille, titre, légende, dessin).
# La colonne de la petite carte (pages 2-3) s'élargit d'au plus ELARGIR_CARTE mm dans le blanc
# laissé par le dessin de droite (lot du 08/10/2026) ; 0 la laisse à 76 mm.
ELARGIR_CARTE = 34

JS_PAGE = """(d) => {
  const txt = (sel, html) => { const x = document.querySelector(sel); if (!x) return false; x.innerHTML = html; return true; };
  if (!txt('.tete .sur', d.sur) || !txt('.tete h1', d.h1)) return 'bandeau';
  const c = document.querySelector('svg.ex-carte'); if (!c) return 'pas de place pour la carte';
  if (d.carte) { c.innerHTML = d.carte; c.setAttribute('viewBox', d.vbCarte); document.querySelector('.carte .lg').innerHTML = d.lgCarte; }
  else document.querySelector('.carte').remove();
  if (!txt('.texte', d.texte)) return 'pas de texte';
  if (!d.carte && !d.texte) document.querySelector('.gauche').remove();   // page pleine largeur
  const dr = document.querySelector('.droite');
  if (d.dessin) {
    dr.innerHTML = (d.avant || '') + '<div class="dessin"><svg class="outil" xmlns="http://www.w3.org/2000/svg" viewBox="' + d.dessin.vb + '">' + d.dessin.svg + '</svg></div>' + (d.apres || '');
  } else {
    dr.innerHTML = (d.avant || '') + '<ol class="etapes">' + d.etapes.map(et =>
      '<li class="et"><span class="badge"><svg viewBox="2 5 106 105" fill="#7c2d12"><use href="#tacheBadge"/></svg><b>' + et.n + '</b></span>' +
      '<div class="txt"><h3>' + et.h3 + '</h3><p class="leg">' + et.leg + '</p></div>' +
      '<svg class="outil" xmlns="http://www.w3.org/2000/svg" viewBox="' + et.vb + '">' + et.svg + '</svg></li>').join('') + '</ol>' + (d.apres || '');
  }
  // La petite carte grandit dans le blanc que laisse le dessin de droite (lot du 08/10/2026 : au
  // deuxième tour, ses taches faisaient 5 mm) : la colonne de gauche s'élargit d'au plus
  // d.elargir mm, tant que le dessin de droite garde exactement sa taille.
  const gauche = document.querySelector('.gauche'), dessin = document.querySelector('.droite .dessin svg');
  if (d.elargir && gauche && dessin && document.querySelector('.carte')) {
    const mm = 96 / 25.4, avant = dessin.getBoundingClientRect().width;
    const libre = document.querySelector('.droite').getBoundingClientRect().width - avant;
    const plus = Math.min(d.elargir * mm, libre - 2 * mm);
    if (plus > 2 * mm) {
      gauche.style.flex = '0 0 ' + (gauche.getBoundingClientRect().width + plus).toFixed(1) + 'px';
      if (Math.abs(dessin.getBoundingClientRect().width - avant) > 0.5) gauche.style.flex = '';
    }
  }
  const pied = document.querySelector('.pied').getBoundingClientRect();
  for (const s of ['.gauche', '.droite']) {
    if (!document.querySelector(s)) continue;
    const kids = [...document.querySelector(s).children];
    for (const k of kids) if (k.getBoundingClientRect().bottom > pied.top + 0.5) return 'la page déborde sur le pied (' + s + ')';
  }
  return 'ok';
}"""

JS_DOS = """(d) => {
  const box = document.querySelector('.niveaux');
  if (!box) return 'pas de bloc niveaux';
  box.innerHTML = d.niveaux.map(n =>
     '<div class="niv"><img src="' + n[2] + '" alt=""><div><span class="n">' + n[0] +
     '</span><span class="d">' + n[1] + '</span></div></div>').join('');
  const u = document.querySelector('.suite img'); if (u) u.setAttribute('src', d.univers);
  const s = document.querySelector('.suite p.t'); if (!s) return 'pas de texte « suite »'; s.innerHTML = d.suite;
  const df = document.querySelector('.defi'); if (!df) return 'pas de bloc défi';
  df.querySelector('.d-dit').innerHTML = d.defiDit;
  // le QR du défi (lot M4-6) : une série en ligne du même type, sans étoile ; pas dans les
  // corrigés (comme les autres QR du dos : un corrigé ne sert pas à rejouer)
  const dq = df.querySelector('.d-qr');
  if (!dq) return 'pas de place pour le QR du défi';
  if (d.defiQr && !d.corr) dq.querySelector('img').setAttribute('src', d.defiQr); else dq.remove();
  if (d.corr) df.querySelector('.chip').innerHTML = 'Le défi&nbsp;! — corrigé';
  df.querySelector('.d-cartes').innerHTML = d.defi.map(c => '<div class="d-carte">' + c + '</div>').join('');
  if (d.corr) document.body.classList.add('dos-corrige');
  // les cartes du défi tiennent dans leur bloc : sinon elles rapetissent ensemble, par pas de 3 %
  const zone = df.querySelector('.d-cartes');
  for (let k = 0; k < 15 && zone.scrollHeight > zone.clientHeight + 0.5; k++)
    zone.querySelectorAll('.d-carte').forEach(c => { c.style.width = (parseFloat(getComputedStyle(c).width) * 0.97) + 'px'; });
  if (zone.scrollHeight > zone.clientHeight + 0.5) return 'les cartes du défi débordent';
  const pied = document.querySelector('.pied').getBoundingClientRect(), cr = document.querySelector('.credits').getBoundingClientRect();
  if (cr.bottom > pied.top + 0.5) return 'le dos déborde sur le pied';
  return 'ok';
}"""

# ---------------------------------------------------------------------------
# LES TEXTES DE L'EXEMPLE, écrits à partir de la carte rendue (ils ne peuvent pas mentir sur ses
# nombres) ; les légendes disent CE QU'ON FAIT, sans nombre : les nombres sont dans les dessins.
MOTS = {1: "une", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six", 7: "sept"}

def decrit(counts, couleurs):
    """« 2 taches noires et 3 taches bleues » ; « une tache noire » pour une seule tache."""
    parts = []
    for n, c in zip(counts, couleurs):
        if n == 0:
            continue
        parts.append(f"{MOTS[n]} tache {c['mot']}" if n == 1 else f"{MOTS[n]} taches {c['pluriel']}")
    return " et ".join([", ".join(parts[:-1]), parts[-1]]) if len(parts) > 1 else parts[0]

ORDINAUX = {0: "1er", 1: "2e", 2: "3e", 3: "4e"}

LEGENDES = {
    "plateaux": ("Je dessine chaque plateau", "Une barre par plateau&nbsp;: une case par tache, le total au-dessus."),
    "remplace": ("Je remplace", "Le petit plateau est dans le grand&nbsp;: je le remplace par son total."),
    "retire": ("Je retire", "La différence des deux totaux, c'est ce qui reste."),
    "partage": ("Je partage", "Il ne reste qu'une couleur&nbsp;: je partage."),
    "verification": ("Je vérifie", "Je refais chaque total avec les nombres trouvés."),
}

def legende(bloc, i):
    """La légende d'un bloc : son premier geste (pastille ①…), sans nombre."""
    r = bloc["roles"][0]
    if r == "verification":
        return LEGENDES["verification"]
    if i > 1 and r in ("remplace",):
        return ("Je reviens à un plateau", "Je connais une couleur&nbsp;: je mets sa valeur, je trouve l'autre.")
    return LEGENDES.get(r, (bloc["titres"][0], ""))

def textes_exemple(ex, geste):
    """Les textes de la couverture et des pages 2-3, écrits à partir de la carte rendue."""
    if ex["geste"] != geste:
        raise SystemExit(f"l'exemple devait être un geste {geste}, pas {ex['geste']}")
    if ex["visibles"]:
        raise SystemExit("l'exemple : sans jeton visible")
    C = ex["couleurs"]
    pls = ex["plateaux"]
    for pl in pls:
        if pl["total"] is not None:
            assert sum(n * c["valeur"] for n, c in zip(pl["counts"], C)) == pl["total"]
    nb = {2: "deux", 3: "trois"}[len(pls)]
    intro = (f"Sur cette carte, {nb} plateaux, un total pour chacun. Une couleur cache partout le même nombre de jetons."
             f"<span>Pour trouver ce que cache chaque couleur, on <b>compare les plateaux</b>. Les pages&nbsp;2 et&nbsp;3 le font pas à pas.</span>")
    lignes = "".join(f"<p><b>{ORDINAUX[i]} plateau</b>&nbsp;: {decrit(p['counts'], C)}, total {p['total']}.</p>" for i, p in enumerate(pls))
    texte = (lignes + "<p>Une couleur cache partout le même nombre de jetons.</p>"
             "<p class=\"but\"><b>Mon enquête</b>&nbsp;: trouver ce que cache chaque couleur.</p>")
    fin = " et ".join(f"la tache {c['mot']} cache <b>{c['valeur']}</b> jetons" for c in C)
    return dict(intro=intro, texte=texte, fin=fin[0].upper() + fin[1:] + ".")

def textes_atoi(ax):
    C = ax["couleurs"]
    lignes = "".join(f"<p><b>{ORDINAUX[i]} plateau</b>&nbsp;: {decrit(p['counts'], C)}, total {p['total']}.</p>" for i, p in enumerate(ax["plateaux"]))
    return (lignes + "<p class=\"but\"><b>À toi&nbsp;!</b> La même sorte de carte, d'autres nombres&nbsp;: "
            "écris les totaux et les calculs dans le schéma, puis la réponse.</p>")


def fabrique_qr():
    """(Re)fabrique tous les QR codes. À relancer si une adresse ou une série change."""
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    dossier = ICI / "qr"
    dossier.mkdir(parents=True, exist_ok=True)
    def ecrire(url, nom):
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(url); q.make(fit=True)
        q.make_image(fill_color="black", back_color="white").save(dossier / nom)
    for niv in LIVRETS.values():
        for f in niv["fiches"]:
            ecrire(lien_fiche(f["code"]), f"fiche{f['code']}.png")
    for s in SERIES:
        ecrire(lien_serie(s), f"serie-{s}.png")
    ecrire(LIEN_UNIVERS, "univers.png")

def serveur():
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    h = functools.partial(Silencieux, directory=str(RACINE))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

# Les dimensions : A4 en largeur (px CSS à 96 dpi : 297 mm = 1123 px, 210 mm = 794 px).
A4L = {"width": 1123, "height": 794}

async def rendre(niv, tmp, corr=None, page3="atoi"):
    """corr : None pour le livret de l'élève, sinon un élément de CORRECTIONS.
    page3 : « atoi » (l'exemple résolu en page 2, la même sorte de carte à compléter en page 3)
    ou « suite » (l'exemple résolu sur les deux pages)."""
    from playwright.async_api import async_playwright
    base = f"http://127.0.0.1:{PORT}"
    qrweb = f"{BASE_WEB}/qr"
    cles = {}
    lettre = bool(corr and corr["lettre"])
    equations = bool(corr and corr.get("equations"))
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")

        async def page_outil(query, vp=None):
            pg = await nav.new_page(viewport=vp or {"width": 794, "height": 1123})
            await pg.goto(f"{base}/outils/splat.html?{query}", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            return pg

        def q_lettre(q):
            return q.replace("unknown=question", "unknown=letter") if lettre else q

        ex_conf = niv["exemple"]
        sys_ = bool(niv.get("systeme"))
        pg = await page_outil(q_lettre(ex_conf["query"]) + "&layout=2&print=statement")
        ex = await pg.evaluate(JS_EXEMPLE, {"vide": False, "systeme": sys_, "rempli": True, "equations": equations})
        await pg.close()
        if "erreur" in ex:
            raise SystemExit(f"exemple du livret « {niv['sortie']} » : {ex['erreur']}")
        pg = await page_outil(q_lettre(ex_conf["atoi"]) + "&layout=2&print=statement")
        ax = await pg.evaluate(JS_EXEMPLE, {"vide": not corr, "systeme": sys_, "rempli": bool(corr), "equations": equations})
        if not corr and ax["lettre"]:
            raise SystemExit("la carte « À toi » vide se dessine en « ? » (les lettres sont écrites en noir)")
        await pg.close()
        if "erreur" in ax:
            raise SystemExit(f"carte « À toi » du livret « {niv['sortie']} » : {ax['erreur']}")
        if [b["roles"] for b in ax["blocs"]] != [b["roles"] for b in ex["blocs"]]:
            raise SystemExit(f"« À toi » ({niv['sortie']}) : pas le même schéma que l'exemple")
        for b in ex["blocs"] + ax["blocs"] + [ex["tout"], ax["tout"]] + ([ex["eq"], ax["eq"]] if equations else []):
            if b["echelle"] not in ("1", "?"):
                raise SystemExit(f"exemple ({niv['sortie']}) : un dessin réduit ({b['echelle']})")
        textes = textes_exemple(ex, ex_conf["geste"])
        print(f"   exemple : {ex['geste']}, " + ", ".join(f"{c['mot']} {c['valeur']}" for c in ex["couleurs"]) +
              " — plateaux " + " ; ".join(str(p['total']) for p in ex["plateaux"]))

        async def pdf_html(url, sortie, js=None, donnees=None, css=()):
            pg = await nav.new_page(viewport=A4L)
            await pg.goto(url, wait_until="networkidle")
            await pg.wait_for_timeout(1200)
            for c in css:
                if c:
                    await pg.add_style_tag(content=c)
            if js:
                r = await pg.evaluate(js, donnees)
                if r != "ok":
                    raise SystemExit(f"{url} : {r}")
            await pg.wait_for_timeout(400)
            await pg.pdf(path=str(sortie), width="297mm", height="210mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        async def pdf_fiche(f, sortie, iremi=False):
            titre = f"Fiche {f['code']} — {f['t']}"
            q = q_lettre(f["q"] + SYS_COMMUN) + ("&systeme=1" if sys_ else "") + f"&layout=2&title={quote(titre)}&print={'correction' if corr else 'statement'}" + ("&corrige=equations" if equations else "")
            pg = await page_outil(q)
            etat = await pg.evaluate(JS_FICHE)
            if etat["parPage"] != 2 or etat["feuilles"] != 2 or len(etat["cartes"]) != 4:
                raise SystemExit(f"{titre} : {etat['parPage']} par page, {etat['feuilles']} feuilles, {len(etat['cartes'])} cartes")
            if etat["secours"]:
                raise SystemExit(f"{titre} : une carte de secours")
            if etat["types"] != TYPES[f["code"]]:
                raise SystemExit(f"{titre} : types {etat['types']} au lieu de {TYPES[f['code']]}")
            if f["code"] in DESORDRE and any(o is None or o == sorted(o) for o in etat["ordres"]):
                raise SystemExit(f"{titre} : un plateau est à sa place habituelle")
            for a, b in JUMELLES.get(f["code"], []):
                if etat["premiers"][a] != etat["premiers"][b]:
                    raise SystemExit(f"{titre} : les cartes {a + 1} et {b + 1} n'ont pas le même premier plateau")
            # le corrigé en équations (lot M4-8) : toutes les cartes en équations, aucune réduite
            if equations and not all(etat["equations"]):
                raise SystemExit(f"{titre} : une carte n'est pas en équations")
            permis = {} if equations else REDUITE_PERMISE.get(f["code"], {})
            for i, e in enumerate(etat["echelles"]):
                if e != "1" and not (i in permis and float(e) >= permis[i]):
                    raise SystemExit(f"{titre} : une carte réduite ({etat['echelles']})")
            for i, droite in enumerate(A_DROITE.get(f["code"], [])):
                o = etat["ordres"][i]
                if (o is not None and o[0] != 0) != droite:
                    raise SystemExit(f"{titre} : carte {i + 1}, le plateau à recopier n'est pas {'à droite' if droite else 'à gauche'}")
            for i, avec in enumerate(JETONS.get(f["code"], [])):
                if bool(json.loads(etat["cartes"][i][2])[0][2]) != avec:
                    raise SystemExit(f"{titre} : carte {i + 1}, {'pas de jeton visible' if avec else 'des jetons visibles'}")
            if sys_ and etat["ligneSysteme"] != (0 if corr else 4):
                raise SystemExit(f"{titre} : « Le système » sous {etat['ligneSysteme']} cartes")
            cles[f["code"]] = etat["cartes"]
            await pg.add_style_tag(content=CSS_QR)
            r = await pg.evaluate(JS_QR, [f"{qrweb}/fiche{f['code']}.png", QR_CORR if corr else QR_ELEVE])
            if r != "ok":
                raise SystemExit(f"{titre}, QR : {r}")
            r = await pg.evaluate(JS_IREMI_SEUL if iremi else JS_SANS_LOGO)
            if r != "ok":
                raise SystemExit(f"{titre}, logos : {r}")
            # la mesure se fait à la largeur imprimée (A4 paysage moins les 2 × 8 mm de l'outil)
            await pg.set_viewport_size({"width": 1062, "height": 733})
            await pg.emulate_media(media="print")
            r = await pg.evaluate(JS_TITRE)
            if r != "ok":
                raise SystemExit(f"{titre}, titre : {r}")
            r = await pg.evaluate(JS_PIED, PIED_CORRECTION if corr else PIED_LIVRET)
            if r != "ok":
                raise SystemExit(f"{titre}, pied : {r}")
            await pg.wait_for_timeout(600)
            # marges : celles de la feuille de l'outil (@page 8 mm), comme un professeur qui
            # clique sur Imprimer
            await pg.pdf(path=str(sortie), format="A4", landscape=True, print_background=True, prefer_css_page_size=True)
            await pg.close()
            print(f"   {titre}" + (" (avec l’IREMI)" if iremi else ""))

        # 1. la couverture
        couv = dict(carte=ex["carte"]["svg"], vbCarte=ex["carte"]["vb"],
                    sur=niv["couv"]["sur"], titre=niv["couv"]["titre"], accroche=niv["couv"]["accroche"], intro=textes["intro"],
                    consigne=niv["couv"].get("consigne"),
                    sommaire=[[f["code"], f["t"], f["resume"]] for f in niv["fiches"]],
                    prof=dict(PROF, dit=corr["dit"]) if corr else None)
        await pdf_html(f"{base}{BASE_WEB}/couverture.html", tmp / "p01.pdf", JS_COUV, couv, css=[CSS_PROF if corr else None])

        # 2-3. l'exemple
        lg = "La carte et ses plateaux"
        if page3 == "atoi":
            cx, ca = ex["carteSys"] or ex["carte"], ax["carteSys"] or ax["carte"]
            # le corrigé en équations (lot M4-8) : à droite, les équations à la place des barres
            dx, da = (ex["eq"], ax["eq"]) if equations else (ex["tout"], ax["tout"])
            p2 = dict(sur="Un exemple résolu", h1="Le système pas à pas", carte=cx["svg"], vbCarte=cx["vb"], lgCarte=lg,
                      texte=textes["texte"], dessin=dict(svg=dx["svg"], vb=dx["vb"]), elargir=ELARGIR_CARTE)
            p3 = dict(sur="À toi&nbsp;!", h1="La même sorte de carte" + (" — corrigée" if corr else ""),
                      carte=ca["svg"], vbCarte=ca["vb"], lgCarte="La carte et ses plateaux",
                      texte=textes_atoi(ax) if not corr else textes_atoi(ax).replace("écris les totaux et les calculs dans le schéma, puis la réponse",
                                                                                     "les équations, étape par étape" if equations else "le schéma rempli"),
                      dessin=dict(svg=da["svg"], vb=da["vb"]), elargir=ELARGIR_CARTE)
        else:
            bl = ex["blocs"]
            coupe = (len(bl) + 1) // 2 if len(bl) > 3 else 2
            et = lambda bs, d0: [dict(n=d0 + i + 1, h3=legende(b, d0 + i)[0], leg=legende(b, d0 + i)[1], svg=b["svg"], vb=b["vb"]) for i, b in enumerate(bs)]
            p2 = dict(sur="Un exemple résolu", h1="Le système pas à pas", carte=ex["carte"]["svg"], vbCarte=ex["carte"]["vb"], lgCarte=lg,
                      texte=textes["texte"], etapes=et(bl[:coupe], 0))
            p3 = dict(sur="Un exemple résolu (suite)", h1="Le système pas à pas", carte=None, vbCarte="",
                      texte="", etapes=et(bl[coupe:], coupe),
                      apres='<p class="atoi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l3.5-.8L19 7.7 16.3 5 3.8 17.5 3 21z" fill="#92400e"/></svg><span><b>À toi&nbsp;!</b> Sur les fiches, sous chaque carte, dessine le schéma comme dans cet exemple, puis trouve ce que cache chaque couleur.</span></p>')
        await pdf_html(f"{base}{BASE_WEB}/exemple.html", tmp / "p02.pdf", JS_PAGE, p2)
        await pdf_html(f"{base}{BASE_WEB}/exemple.html", tmp / "p03.pdf", JS_PAGE, p3)

        # 4-11. les fiches, deux fois chacune (livret à plier, page par page)
        for i, f in enumerate(niv["fiches"]):
            await pdf_fiche(f, tmp / f"fiche{i}.pdf")
            await pdf_fiche(f, tmp / f"fiche{i}_iremi.pdf", iremi=True)

        # 12. le dos
        d = niv["dos"]
        defi, cles_defi = [], []
        for dc in d["defi"]:
            q = q_lettre(dc["q"] + f"&cards={dc['n']}&unknown=question") + ("&systeme=1" if sys_ else "") + f"&layout=2&print={'correction' if corr else 'statement'}" + ("&corrige=equations" if equations else "")
            pg = await page_outil(q)
            r = await pg.evaluate(JS_DEFI, [dc["n"], bool(corr), 1450])
            await pg.close()
            if "erreur" in r:
                raise SystemExit(f"défi du livret « {niv['sortie']} » : {r['erreur']}")
            if any(e != "1" for e in r["echelles"]):
                raise SystemExit(f"défi du livret « {niv['sortie']} » : une carte réduite")
            if r["secours"] or ("types" in dc and r["types"] != dc["types"]):
                raise SystemExit(f"défi du livret « {niv['sortie']} » : types {r['types']} au lieu de {dc.get('types')}")
            defi += r["svgs"]; cles_defi += r["cles"]
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/serie-{s}.png"] for nom, desc, s in d["series"]],
                   univers=f"{qrweb}/univers.png", suite=d["suite"], defi=defi, defiDit=d["defi_dit"], corr=bool(corr),
                   defiQr=f"{qrweb}/serie-{d['defi_qr']}.png" if d.get("defi_qr") else None)
        await pdf_html(f"{base}{BASE_WEB}/dos.html", tmp / "p12.pdf", JS_DOS, dos)
        await nav.close()
    return dict(ex=ex["cle"], atoi=ax["cle"], defi=cles_defi), cles

def ordre_des_pages(niv, tmp, iremi=False):
    # iremi : les fiches avec le logo de l'IREMI (PDF page par page) ; sinon, sans (livret à plier)
    pages = [tmp / "p01.pdf", tmp / "p02.pdf", tmp / "p03.pdf"]
    for i in range(len(niv["fiches"])):
        pages.append(tmp / f"fiche{i}{'_iremi' if iremi else ''}.pdf")
    pages.append(tmp / "p12.pdf")
    return pages

# L'IMPOSITION « TABLETTE » : 12 pages A4 paysage sur 3 feuilles A3 EN HAUTEUR, recto verso.
# C'est le cahier de 12 pages d'un livret ordinaire tourné d'un quart de tour : la gauche devient
# le haut, la droite le bas. Feuille 1 (dehors) : recto 12 en haut / 1 en bas, verso 2 / 11 ;
# feuille 2 : 10 / 3, puis 4 / 9 ; feuille 3 (au milieu) : 8 / 5, puis 6 / 7. Toutes les pages
# droites dans la feuille en hauteur ; imprimé recto verso avec RETOURNEMENT SUR LE BORD COURT
# (la feuille se retourne de haut en bas, comme un calendrier), le haut du verso est derrière le
# bas du recto : page 2 derrière la couverture, etc. On plie chaque feuille en deux à
# l'horizontale (le haut passe derrière), on emboîte les trois feuilles, on agrafe sur le pli.
IMPOSITION = [(12, 1), (2, 11), (10, 3), (4, 9), (8, 5), (6, 7)]

def assemble(niv, tmp, sortie):
    """Le PDF page par page (12 pages A4 paysage) et le livret à plier (6 pages A3 en hauteur).

    IMPORTANT : on passe par pikepdf et `add_overlay`, qui place chaque page comme un Form
    XObject. Avec une simple translation de contenu (pypdf merge_transformed_page), les
    DÉGRADÉS ne suivent pas (bug vu sur le livret du monde 1 le 17/09/2026)."""
    import pikepdf
    W, H = 841.890, 595.276                      # A4 en largeur
    src = []
    def lire(chemins):
        out = []
        for f in chemins:
            d = pikepdf.open(str(f)); src.append(d)
            out.extend(d.pages)
        return out
    pages = lire(ordre_des_pages(niv, tmp))
    par_page = lire(ordre_des_pages(niv, tmp, iremi=True))
    for liste in (pages, par_page):
        if len(liste) != 12:
            raise SystemExit(f"{len(liste)} pages au lieu de 12")
        for p in liste:
            w, h = float(p.mediabox[2]) - float(p.mediabox[0]), float(p.mediabox[3]) - float(p.mediabox[1])
            if not (w > h and abs(w / h - W / H) < 0.01):
                raise SystemExit(f"{sortie} : une page n'est pas un A4 en largeur ({w:.1f} × {h:.1f})")
    livret = pikepdf.Pdf.new()
    for p in par_page:
        page = livret.add_blank_page(page_size=(W, H))
        pikepdf.Page(page).add_overlay(p, pikepdf.Rectangle(0, 0, W, H))
    livret.save(str(RACINE / "outils" / f"{sortie}.pdf"))
    a3 = pikepdf.Pdf.new()
    for haut, bas in IMPOSITION:
        feuille = a3.add_blank_page(page_size=(W, 2 * H))
        pikepdf.Page(feuille).add_overlay(pages[haut - 1], pikepdf.Rectangle(0, H, W, 2 * H))
        pikepdf.Page(feuille).add_overlay(pages[bas - 1], pikepdf.Rectangle(0, 0, W, H))
    a3.save(str(RACINE / "outils" / f"{sortie}_a_plier.pdf"))
    for s in src:
        s.close()

def compresse(chemin):
    """qpdf, s'il est installé, divise le poids par deux ; sinon pikepdf, mêmes réglages."""
    import shutil, subprocess
    if not shutil.which("qpdf"):
        import pikepdf
        pikepdf.settings.set_flate_compression_level(9)
        tmp = chemin.with_suffix(".qpdf.pdf")
        with pikepdf.open(str(chemin)) as d:
            d.save(str(tmp), object_stream_mode=pikepdf.ObjectStreamMode.generate,
                   compress_streams=True, recompress_flate=True)
        tmp.replace(chemin)
        return
    tmp = chemin.with_suffix(".qpdf.pdf")
    r = subprocess.run(["qpdf", "--object-streams=generate", "--compress-streams=y",
                        "--recompress-flate", "--compression-level=9", str(chemin), str(tmp)])
    if r.returncode in (0, 3) and tmp.exists():
        tmp.replace(chemin)

CARTES_JSON = ICI / "cartes.json"

def ecrire_cartes(nom, autres, reference):
    """cartes.json : pour chaque livret, l'exemple, la carte « À toi », les cartes du défi et les
    16 cartes des fiches — total, valeurs triées, plateaux (taches de chaque couleur, total,
    jetons visibles)."""
    tout = json.loads(CARTES_JSON.read_text(encoding="utf-8")) if CARTES_JSON.exists() else {}
    tout = {k: v for k, v in tout.items() if k in LIVRETS}
    dec = lambda c: [c[0], json.loads(c[1]), json.loads(c[2])]
    tout[nom] = {"exemple": dec(autres["ex"]), "atoi": dec(autres["atoi"]), "defi": [dec(c) for c in autres["defi"]],
                 "fiches": {t: [dec(c) for c in v] for t, v in reference.items()}}
    j = lambda x: json.dumps(x, ensure_ascii=False, separators=(", ", ": "))
    lignes = ["{"]
    for i, (n, c) in enumerate(sorted(tout.items())):
        lignes.append(f' {j(n)}: {{"exemple": {j(c["exemple"])}, "atoi": {j(c["atoi"])}, "defi": {j(c["defi"])}, "fiches": {{')
        fs = list(c["fiches"].items())
        for k, (t, v) in enumerate(fs):
            lignes.append(f'  {j(t)}: [')
            for m, carte in enumerate(v):
                lignes.append(f'   {j(carte)}' + ("," if m < len(v) - 1 else ""))
            lignes.append("  ]" + ("," if k < len(fs) - 1 else ""))
        lignes.append(" }}" + ("," if i < len(tout) - 1 else ""))
    lignes.append("}")
    CARTES_JSON.write_text("\n".join(lignes) + "\n", encoding="utf-8")

def controle_global():
    """Sur les deux livrets : aucune carte en double — fiches, exemples, cartes « À toi » et
    défis confondus (mêmes valeurs, mêmes plateaux, quelles que soient les couleurs)."""
    tout = json.loads(CARTES_JSON.read_text(encoding="utf-8"))
    cle = lambda c: json.dumps([sorted(c[1]), sorted(c[2], key=json.dumps)])
    vues = {}
    for nom, c in tout.items():
        liste = [("exemple", c["exemple"]), ("à toi", c["atoi"])] + [(f"défi {i + 1}", x) for i, x in enumerate(c["defi"])]
        liste += [(f"fiche {t}, carte {i + 1}", x) for t, v in c["fiches"].items() for i, x in enumerate(v)]
        for ou, x in liste:
            k = cle(x)
            if k in vues:
                raise SystemExit(f"carte en double : {nom}, {ou} = {vues[k]}")
            vues[k] = f"{nom}, {ou}"

def vignettes():
    """Les vignettes de la page des livrets : la couverture (page 1) à 120 dpi, PNG et WebP."""
    import subprocess, tempfile
    from PIL import Image
    for niv in LIVRETS.values():
        nom = niv["sortie"].replace("_", "-")
        with tempfile.TemporaryDirectory() as d:
            subprocess.run(["pdftoppm", "-r", "120", "-png", "-f", "1", "-l", "1", "-singlefile",
                            str(RACINE / "outils" / f"{niv['sortie']}.pdf"), f"{d}/v"], check=True)
            im = Image.open(f"{d}/v.png").convert("RGB")
            dest = RACINE / "assets" / "img" / "thumbnails" / "splat"
            im.save(dest / f"{nom}.png", optimize=True)
            im.save(dest / f"{nom}.webp", quality=82, method=6)
        print(f"   vignette : {nom}.png / .webp ({im.size[0]} × {im.size[1]})")

def main():
    import tempfile
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    demandes = args or list(LIVRETS)
    inconnu = [a for a in demandes if a not in LIVRETS]
    if inconnu:
        raise SystemExit(f"livret inconnu : {', '.join(inconnu)} (au choix : {', '.join(LIVRETS)})")
    if "--vignettes" in sys.argv:
        vignettes(); return
    if "--eleve" in sys.argv and "--correction" in sys.argv:
        raise SystemExit("--eleve et --correction s'excluent (sans option : tous)")
    page3 = "suite" if "--page3-suite" in sys.argv else "atoi"
    versions = [None] + CORRECTIONS
    if "--eleve" in sys.argv:
        versions = [None]
    if "--correction" in sys.argv:
        versions = CORRECTIONS
    if "--qr" in sys.argv:
        fabrique_qr(); print("QR codes régénérés.")
    srv = serveur()
    try:
        for nom in demandes:
            niv = LIVRETS[nom]
            print(f"— livret « {nom} »")
            reference = autres = None
            for corr in [c for c in versions if c is None or nom in c.get("livrets", LIVRETS)]:
                sortie = niv["sortie"] + (corr["suffixe"] if corr else "")
                with tempfile.TemporaryDirectory() as d:
                    tmp = Path(d)
                    au, cles = asyncio.run(rendre(niv, tmp, corr, page3))
                    assemble(niv, tmp, sortie)
                if reference is None:
                    reference, autres = cles, au
                elif cles != reference or au != autres:
                    raise SystemExit(f"{sortie} : les cartes diffèrent du livret de l'élève")
                for s in ("", "_a_plier"):
                    compresse(RACINE / "outils" / f"{sortie}{s}.pdf")
                print(f"   Fait : outils/{sortie}.pdf (12 pages) et outils/{sortie}_a_plier.pdf")
            if versions[0] is None:
                ecrire_cartes(nom, autres, reference)
        controle_global()
    finally:
        srv.shutdown()

if __name__ == "__main__":
    main()
