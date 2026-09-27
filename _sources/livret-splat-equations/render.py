#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère les deux livrets « SPLAT! Équations » (monde 5, 8 pages chacun) à partir du site.

    python3 render.py                 (les DEUX livrets, élève et corrigé : 8 PDF)
    python3 render.py schema          (une seule famille : schema | equation)
    python3 render.py --eleve         (seulement les livrets de l'élève)
    python3 render.py --correction    (seulement les livrets corrigés)
    python3 render.py --qr            (en refabriquant d'abord les QR codes)

Produit, à la racine du dépôt :
    outils/livret_splat_equations_schema.pdf          8 pages A4, ordre de lecture
    outils/livret_splat_equations_schema_a_plier.pdf  4 pages A3 paysage, imposées
    outils/livret_splat_equations_equation.pdf        (idem, famille « équation »)
    outils/livret_splat_equations_equation_a_plier.pdf
    outils/livret_splat_equations_schema_correction.pdf       le corrigé par le schéma en barres
    outils/livret_splat_equations_schema_correction_a_plier.pdf
    outils/livret_splat_equations_equation_correction.pdf     le corrigé par l'équation
    outils/livret_splat_equations_equation_correction_a_plier.pdf
    outils/livret_splat_equations_equation_defi.pdf              le livret « Le défi » (lot Q5)
    outils/livret_splat_equations_equation_defi_a_plier.pdf
    outils/livret_splat_equations_equation_defi_correction.pdf   son corrigé, par l'équation
    outils/livret_splat_equations_equation_defi_correction_a_plier.pdf

    python3 render.py defi            (seulement le livret « Le défi » et son corrigé)

LE LIVRET « LE DÉFI » (lot Q5, 25/09/2026) — la famille « équation » seulement : les mêmes
trois fiches 35, 36, 37, avec des paquets numérotés partout (2 ou 3 par côté), des totaux de 50
à 100 et jusqu'à six taches. Chaque fiche est bâtie en trois séries de 4 cartes enchaînées par
« suite » (voir FICHES_DEFI). Son QR de fiche ouvre ÉquaSplat sur ces 12 équations exactes, sous
la même étoile que la fiche du livret de base (page courte ?f=35d, 36d, 37d) ; son corrigé est
la correction courte « l'équation » de l'outil, comme celui du livret équation.

LES DEUX LIVRETS CORRIGÉS (lot Q4, 24/09/2026) — une correction par livret : l'outil imprime
lui-même les fiches corrigées avec ses deux « corrections courtes » 6/page
(print=correction-schema pour le livret schéma, print=correction-equation pour le livret
équation) : même bandeau, même cadre de consigne, chaque carte à la même place que sur la
fiche de l'élève, les taches dévoilées, et à côté (schéma) ou dessous (équation) la partie
de la correction de l'outil. Mêmes 8 pages, même pliage. La couverture porte le bandeau
rouge sombre « Correction » et « Livret corrigé — … » à la place de Nom / Classe (textes
« pour tous », comme les autres mondes : il ne dit « professeur » nulle part) ; la boîte
du QR dit « Je rejoue ces cartes en ligne » ; le pied des fiches finit par « · correction ».

DEUX LIVRETS, LES MÊMES 36 CARTES (décision du 23/09/2026) :
  - « schema »   : plateaux l'un au-dessus de l'autre (vue Schéma de l'outil), plateau à
                   gauche de la case, la place à droite : l'élève dessine le schéma en barres ;
  - « equation » : plateaux côte à côte (vue Équation), plateau à 80 % de la case, la
                   place dessous : l'élève écrit l'équation.
(Le mot « tableau » n'est pas employé : « schéma en barres » partout, demande de Claire.)

Les trois fiches (35, 36, 37) ne sont PAS redessinées ici : elles sont imprimées par l'outil du
site (outils/splat_equations.html, réglage « Énoncé seul, 6/page » du lot Q1) avec les réglages
et les graines de la carte des mondes (outils/splat_univers.html, EQ5_*). Le QR est posé dans
le bandeau juste avant l'impression. Couverture et dos sont les deux HTML de ce dossier ;
l'exemple de la couverture est dessiné par l'outil lui-même, sur une carte qui n'est dans
aucune fiche.

CONTRÔLES FAITS À CHAQUE RENDU (le script s'arrête sinon) :
  - chaque fiche = 12 cartes sur 2 pages de 6 ;
  - ses cartes sont EXACTEMENT celles du jeu en ligne de la carte des mondes (la série « j »,
    relue dans splat_univers.html) : le QR rejoue les mêmes équations ;
  - les deux livrets ont les mêmes 36 cartes ;
  - l'exemple de couverture n'est aucune de ces 36 cartes.

Dépendances : playwright (chromium complet, pas le headless shell), pikepdf, qrcode[pil],
la police FreeSerif (apt install fonts-freefont-ttf) pour la lettre de l'exemple. qpdf si disponible.
"""
import asyncio, base64, http.server, socketserver, threading, functools, sys, json, re
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-splat-equations"
PORT = 8124
SITE = "https://mathsgo.re"
COURTE = "/splat/equations/livret/"             # la page courte des QR

# Les réglages des trois fiches, tels que définis dans outils/splat_univers.html (EQ5_S1…S3,
# EQ5_PAQUETS, EQ5_DEUX_COTES, lot Q2). Si une graine change là-bas, la reporter ici ET dans
# splat/equations/livret/index.html, puis relancer. Un test épingle les trois fichiers.
EQ5_S1 = "mode=EQUNITSTEP&form=X_PLUS_B_EQ_C&cards=4&seed=355&unknown=letter"
EQ5_S2 = "mode=EQUNITSTEP&form=AX_EQ_C&tasksMax=3&cards=4&seed=814&unknown=letter"
EQ5_S3 = "mode=EQUNITSTEP&form=ONE_SIDE&tasksMax=3&cards=4&seed=793&unknown=letter"
# Relecture du monde 5 (27/09/2026) : huit marches, une seule nouveauté à la fois, tout mélangé
# à la fin ; dans chaque marche, la tache finit à gauche sur la moitié des cartes, à droite sur
# l'autre moitié. Fiche 36 : 2 ou 3 taches (3 + 3 cartes), puis 4 à 6 taches (3 + 3). Fiche 37 :
# jetons d'un seul côté (4), jetons des deux côtés (4), le grand mélange (4).
EQ5_PAQUETS = "mode=EQSTEP&form=ONE_SIDE&tasksMax=3&visibleMin=1&visibleMax=3&cards=3&seed=304&unknown=letter"
EQ5_PAQUETS_SUITE = ["mode=EQSTEP&form=ONE_SIDE&tasksMax=3&visibleMin=1&visibleMax=3&cards=3&seed=4471&unknown=letter",
                     "mode=EQSTEP&form=ONE_SIDE&tasksMax=6&visibleMin=1&visibleMax=3&cards=3&seed=3795&unknown=letter",
                     "mode=EQSTEP&form=ONE_SIDE&tasksMax=6&visibleMin=1&visibleMax=3&cards=3&seed=79133&unknown=letter"]
EQ5_DEUX_COTES = "mode=EQSTEP&form=BOTH&tasksMax=5&visibleMin=0&visibleMax=2&cards=4&seed=2117&unknown=letter"
EQ5_DEUX_COTES_SUITE = ["mode=EQSTEP&form=BOTH&tasksMax=5&visibleMin=1&visibleMax=2&cards=4&seed=295&unknown=letter",
                        "mode=EQSTEP&form=MIX&tasksMax=6&visibleMin=1&visibleMax=2&cards=4&seed=29197&unknown=letter"]

FICHES = [
    dict(n=35, t="Premières équations",       parties=[EQ5_S1, EQ5_S2, EQ5_S3], parcours="m3e1",
         resume="Les jetons un par un."),
    dict(n=36, t="Des paquets de jetons",     parties=[EQ5_PAQUETS, *EQ5_PAQUETS_SUITE], parcours="m3e2",
         resume="Les jetons arrivent en paquets."),
    dict(n=37, t="Des taches des deux côtés", parties=[EQ5_DEUX_COTES, *EQ5_DEUX_COTES_SUITE], parcours="m3e4",
         resume="Des deux côtés, puis tout mélangé."),
]

# ------------------------------------------------------------------ le livret « Le défi » (lot Q5)
# Décisions du 25/09/2026 (liste annotée LISTE-annotee-Q5-36-equations-defi.md, validée telle
# quelle) : paquets numérotés partout, 2 ou 3 paquets de chaque côté, totaux de 50 à 100 ; la
# fiche 35 garde les taches d'un seul côté, de 2 à 4 ; la 36 aussi, de 4 à 6 ; la 37 met des
# taches des deux côtés. Même étoile que la fiche du livret de base.
#
# POURQUOI TROIS SÉRIES DE 4 CARTES PAR FICHE (comme le défi du monde 2) : l'outil des Équations
# n'a qu'un maximum de taches, et une carte sur 10 à 15 seulement passe les règles du défi —
# solution de 6 à 30 et jamais multiple de 5 ; paquets de 5 à 79, jamais ronds, jamais deux
# égaux du même côté ; au moins 20 dans les paquets du côté des taches (fiches 35-36) ; au moins
# deux taches à partager une fois les plus petites retirées (fiche 37) ; aucun nombre à
# sous-entendu, calculs compris. Les graines ci-dessous ont été retenues parmi plus de 300
# millions de séries de 4 (voir le README) ; 36 équations toutes différentes, chaque lettre au
# plus deux fois par fiche, jamais deux fois de suite. NE PAS en changer une sans refaire le tri,
# la page courte (splat/equations/livret/, ?f=35d…) et les PDF.
def defi(form, taches_max, graine):
    return (f"mode=EQSTEP&form={form}&tasksMax={taches_max}&visibleMin=2&visibleMax=3"
            f"&totalMin=50&totalMax=100&cards=4&seed={graine}&unknown=letter")

FICHES_DEFI = [
    dict(n=35, t="De deux à quatre taches", qr="35d", parcours="m3e1",
         resume="Deux taches, puis trois, puis jusqu'à quatre.",
         parties=[defi("ONE_SIDE", 2, 893381), defi("ONE_SIDE", 3, 653158), defi("ONE_SIDE", 4, 18888627)]),
    dict(n=36, t="Jusqu'à six taches", qr="36d", parcours="m3e2",
         resume="De quatre à six taches.",
         parties=[defi("ONE_SIDE", 6, 52841384), defi("ONE_SIDE", 6, 7120342), defi("ONE_SIDE", 6, 13521466)]),
    dict(n=37, t="Le grand défi : des deux côtés", qr="37d", parcours="m3e4",
         resume="Des taches des deux côtés.",
         parties=[defi("BOTH", 4, 13183993), defi("BOTH", 6, 907210), defi("BOTH", 6, 32560684)]),
]

# ------------------------------------------------------------------ le dos : « Encore des cartes ! »
# Décision du 24/09/2026 : trois séries, une par fiche, de SIX équations tirées au hasard et
# jouées dans le jeu de l'élève d'ÉquaSplat (la barre « Équation 1 / 6 », les pastilles) —
# sans parcours : aucune étoile, rien d'enregistré ; un nouveau scan = six nouvelles équations.
# Le QR ouvre la page courte ?s=N, qui envoie vers l'outil avec « jouer=1 » : l'outil tire la
# série (réglages de la fiche, sans graine) et l'ouvre aussitôt dans ÉquaSplat.
# « Un par un » mélange les trois formes de la fiche 35 : 2 + 2 + 2 (paramètre « suite »).
SERIE_CARTES = 6

def sans_graine(q, cartes):
    q = re.sub(r"&seed=\d+", "", q)
    return re.sub(r"cards=\d+", f"cards={cartes}", q)

SERIES = {
    "1": [sans_graine(EQ5_S1, 2), sans_graine(EQ5_S2, 2), sans_graine(EQ5_S3, 2)],
    # (27/09/2026) comme les fiches : 3 cartes à 2-3 taches + 3 à 4-6 taches ; puis 2 + 2 + 2
    # pour les deux côtés (jetons d'un côté, des deux côtés, le mélange)
    "2": [sans_graine(EQ5_PAQUETS, 3), sans_graine(EQ5_PAQUETS_SUITE[1], 3)],
    "3": [sans_graine(EQ5_DEUX_COTES, 2)] + [sans_graine(q, 2) for q in EQ5_DEUX_COTES_SUITE],
    # le dos du livret « Le défi » (décision du 25/09/2026) : deux séries seulement, et des QR de
    # 32 mm comme le défi du monde 2 — six équations au hasard aux réglages du défi, d'un seul côté
    # (jusqu'à 6 taches), puis des deux côtés
    "d1": [sans_graine(defi("ONE_SIDE", 6, 0), SERIE_CARTES)],
    "d2": [sans_graine(defi("BOTH", 6, 0), SERIE_CARTES)],
}
DOS = [("Un par un",      "Les jetons un par un, comme la fiche&nbsp;35.",  "1"),
       ("Des paquets",    "Les jetons en paquets, comme la fiche&nbsp;36.", "2"),
       ("Des deux côtés", "Des taches des deux côtés, puis tout mélangé, comme la fiche&nbsp;37.", "3")]
DOS_DEFI = [("D'un seul côté", "Des paquets et jusqu'à six taches, des totaux de 50 à 100, comme les fiches&nbsp;35 et&nbsp;36.", "d1"),
            ("Des deux côtés", "Des taches des deux côtés, des totaux de 50 à 100, comme la fiche&nbsp;37.", "d2")]
# Le dos du défi : deux séries au lieu de trois, donc deux cases plus larges et des QR de 36 mm
# (30 mm à trois ; 32 et 26 mm avant le lot 2 de la relecture du monde 1, 25/09/2026, qui a
# retiré « Mes fiches » du dos pour agrandir les QR). Injecté pour ce seul livret : le dos des
# deux livrets de base ne bouge pas.
CSS_DOS_DEFI = """
.niveaux{gap:6mm}
.niv{padding:3.5mm 4mm 3mm;gap:2mm}
.niv img{width:36mm;height:36mm}
"""

def cible_serie(s):
    """Ce que la page courte ouvre pour ?s=N (elle fait le même calcul, un test les compare)."""
    p = SERIES[s]
    return ("/outils/splat_equations.html?" + p[0] + "&jouer=1"
            + ("&suite=" + ";".join(quote(x, safe="") for x in p[1:]) if len(p) > 1 else ""))

def lien_fiche(n):   # n = 35, 36, 37, ou « 35d »… pour le défi
    """Le QR d'une fiche : la page courte, qui renvoie vers le lien EXACT « Le jeu de l'élève »
    de la carte des mondes (ÉquaSplat, parcours=m3eN : la même étoile). La série y est écrite en
    entier dans l'adresse (plus de 2 000 caractères) : un QR direct ne se lirait plus à 17 mm."""
    return f"{SITE}{COURTE}?f={n}"

def lien_serie(s):
    return f"{SITE}{COURTE}?s={s}"

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"

# ------------------------------------------------------------------ l'exemple de couverture
# Une carte « paquets, taches d'un seul côté » qui n'est dans AUCUNE fiche (render.py le
# vérifie) : 3𝑛 + 12 = 27, 𝑛 = 5 — trois taches et deux paquets (7 et 5) d'un côté, deux
# paquets (10 et 17) de l'autre : les trois gestes de la fiche 36 (regrouper, enlever,
# partager) sur une seule carte. Graine 79, choisie le 24/09/2026 : aucun nombre à
# sous-entendu, pas de paquet « 1 », une solution qui n'est ni 1 ni 2.
EXEMPLE = "mode=EQSTEP&form=ONE_SIDE&cards=1&seed=79&unknown=letter"
# L'exemple du livret « Le défi » (choisi sur planche le 25/09/2026, « B ») : 4𝑎 + 38 = 86, 𝑎 = 12 —
# quatre taches et deux paquets (11 et 27) d'un côté, deux paquets (71 et 15) de l'autre. Il n'est
# dans aucune fiche des deux livrets (render.py le vérifie).
EXEMPLE_DEFI = "mode=EQSTEP&form=ONE_SIDE&tasksMax=4&visibleMin=2&visibleMax=2&totalMin=50&totalMax=100&cards=1&seed=250&unknown=letter"

# ------------------------------------------------------------------ les icônes du dos
# Les flèches de l'équation, dessinées comme celles de la correction imprimée de l'outil : un arc
# de chaque côté, du haut vers le bas, le geste écrit à l'extérieur, en brun (#b45309).
FLECHES = ('<svg width="116" height="46" viewBox="0 0 116 46" aria-hidden="true">'
           '<g fill="none" stroke="#b45309" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'
           '<path d="M42 5 Q32 23 42 41"/><path d="M36.5 38 L42 41 L42.6 35"/>'
           '<path d="M74 5 Q84 23 74 41"/><path d="M73.4 35 L74 41 L79.5 38"/></g>'
           '<g fill="#b45309" font-family="Poppins, sans-serif" font-weight="700" font-size="13">'
           '<text x="31" y="28" text-anchor="end">– 12</text><text x="85" y="28">– 12</text></g>'
           '<text x="58" y="28" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="700" '
           'font-size="15" fill="#0f172a">=</text></svg>')
# Les petits schémas en barres du dos, DESSINÉS À L'ÉCHELLE (relecture du 27/09/2026 : « la case
# des 𝑛 doit avoir la même largeur que la case du 15, et le 𝑛 tout seul la même largeur qu'un 𝑛 du
# dessus ») : une seule échelle pour les trois dessins (le total c occupe toute la largeur), chaque
# case a la largeur de sa valeur — 𝑥 𝑥 𝑥 font exactement « 15 », et la tache seule du dernier
# dessin fait la largeur d'une tache du premier. Les trois dessins sont calés à gauche, au même
# endroit, comme les étapes d'un même schéma. Tracés en SVG (coordonnées exactes, pas de bordures
# CSS qui décalent d'un pixel).
MINI_L, MINI_H = 104.0, 22.0                       # 27,5 mm × 5,8 mm par ligne, avant le zoom de la liste
def mini_sch(lignes, total, cle):
    """lignes : [[(texte, largeur en unités, genre)]] ; genre : "t" tache, "n" nombre, "h" enlevé."""
    k = (MINI_L - 2) / total
    hs = f"h{cle}"
    out = [f'<svg class="mini-sch" width="{MINI_L:.0f}" height="{len(lignes) * MINI_H + 2:.0f}" '
           f'viewBox="0 0 {MINI_L:.0f} {len(lignes) * MINI_H + 2:.0f}" aria-hidden="true">'
           f'<defs><pattern id="{hs}" patternUnits="userSpaceOnUse" width="3.2" height="3.2" patternTransform="rotate(45)">'
           '<line x1="0" y1="0" x2="0" y2="3.2" stroke="#94a3b8" stroke-width="1.3"/></pattern></defs>']
    for i, cases in enumerate(lignes):
        x, y = 1.0, 1.0 + i * MINI_H
        for texte, u, genre in cases:
            w = u * k
            fond = {"t": "#e2e8f0", "n": "#fff", "h": f"url(#{hs})"}[genre]
            out.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{MINI_H:.2f}" fill="{fond}" '
                       'stroke="#0f172a" stroke-width="1.4"/>')
            police = ('font-family="x-arrondi, Times New Roman, serif" font-size="12"' if genre == "t"
                      else 'font-family="Poppins, sans-serif" font-weight="700" font-size="12"')
            couleur = "#475569" if genre == "h" else "#0f172a"
            out.append(f'<text x="{x + w / 2:.2f}" y="{y + MINI_H / 2:.2f}" text-anchor="middle" dominant-baseline="central" '
                       f'{police} fill="{couleur}">{texte}</text>')
            x += w
    out.append("</svg>")
    return "".join(out)

def mini_schemas(a, b, c, x):
    """Les trois dessins de « Pour se souvenir » pour a·𝑥 + b = c (𝑥 = x) : on enlève b des deux
    barres ; la tache seule ; le schéma de départ (dernière ligne, « à toi »)."""
    taches = [("𝑥", x, "t")] * a
    enleve = mini_sch([taches + [(str(b), b, "h")], [(str(c - b), c - b, "n"), (str(b), b, "h")]], c, "e")
    fin = mini_sch([[("𝑥", x, "t")], [(str(x), x, "n")]], c, "f")
    depart = mini_sch([taches + [(str(b), b, "n")], [(str(c), c, "n")]], c, "d")
    return enleve, fin, depart

MINI_SCH_ENLEVE, MINI_SCH_FIN, MINI_SCH = mini_schemas(3, 12, 27, 5)

# ------------------------------------------------------------------ les deux livrets
VUES = {
    "schema": dict(
        sortie="livret_splat_equations_schema",
        vue="schema",
        sur="Mon livret · Monde 5 · Le schéma en barres",
        accroche="Deux plateaux, la même quantité…<br>et le schéma en barres pour trouver la tache&nbsp;!",
        lg_corr="Le schéma en barres",
        cotes="en haut et en bas",
        atoi_couv="Sur les fiches, la place à droite de chaque carte est pour toi&nbsp;: <b>dessine le schéma "
                  "en barres</b>, puis trouve ce que cache la tache.",
        # « Pour se souvenir » (décision du 24/09/2026 : une règle juste et générale — la même
        # opération des deux côtés, et le but). Icônes : les dessins de la correction de l'outil,
        # ici le schéma en barres (la part enlevée hachurée, pas de flèche).
        souvenir=[
            (MINI_SCH_ENLEVE, "On peut faire <b>la même opération sur les deux plateaux</b>, ajouter, enlever "
                              "ou partager&nbsp;: il reste toujours la même quantité en haut et en bas."),
            (MINI_SCH_FIN, "<b>Le but</b>&nbsp;: garder une seule tache sur un plateau. L'autre plateau dit ce "
                           "qu'elle cache."),
            (MINI_SCH, "<b>À droite de chaque carte, c'est à toi</b>&nbsp;: dessine le schéma en barres, puis "
                       "trouve ce que cache la tache — comme l'exemple de la couverture."),
        ],
        # la carte (plateaux l'un sur l'autre) est haute : fenêtre étroite, le schéma à côté
        css_couv=".carte.corr{flex:1 1 0}.carte:first-child{flex:0 0 58mm}",
        fiches=FICHES, exemple=EXEMPLE, dessins=(3, 12, 27, 5), dos=DOS,
    ),
    "equation": dict(
        sortie="livret_splat_equations_equation",
        vue="equation",
        sur="Mon livret · Monde 5 · L'équation",
        accroche="Deux plateaux, la même quantité…<br>et l'équation pour trouver la tache&nbsp;!",
        lg_corr="L'équation",
        cotes="à gauche et à droite",
        atoi_couv="Sur les fiches, la place sous chaque carte est pour toi&nbsp;: <b>écris l'équation</b>, "
                  "puis résous-la pour trouver ce que cache la tache.",
        souvenir=[
            (FLECHES, "On peut faire <b>la même opération des deux côtés</b>, ajouter, enlever ou "
                      "partager&nbsp;: il reste toujours la même quantité à gauche et à droite."),
            ('<span class="mini-eq">𝑥 = 5</span>', "<b>Le but</b>&nbsp;: garder une seule tache d'un côté. "
                                                   "L'autre côté dit ce qu'elle cache."),
            ('<span class="mini-eq">3𝑥 + 12 = 27</span>', "<b>Sous chaque carte, c'est à toi</b>&nbsp;: écris "
                                                          "l'équation, puis résous-la — comme l'exemple de la couverture."),
        ],
        # (27/09/2026) l'équation plus grande : sa fenêtre passe de 66 à 76 mm
        css_couv=".carte.corr{flex:0 0 76mm}",
        fiches=FICHES, exemple=EXEMPLE, dessins=(3, 12, 27, 5), dos=DOS,
    ),
}
# Le livret « Le défi » (lot Q5) : la famille « équation », ses fiches, son exemple, son dos. Les
# petits dessins de « Pour se souvenir » sont ceux du livret équation, écrits avec les nombres de
# l'exemple du défi (4𝑥 + 38 = 86 ; la lettre est remplacée ensuite par celle de l'exemple, 𝑎).
def _dessins(txt, a, b, c, x):
    return (txt.replace("– 12", f"– {b}").replace("𝑥 = 5", f"𝑥 = {x}")
               .replace("3𝑥 + 12 = 27", f"{a}𝑥 + {b} = {c}"))
VUES["defi"] = dict(VUES["equation"],
    sortie="livret_splat_equations_equation_defi",
    sur="Mon livret · Monde 5 · Le défi · L'équation",
    accroche="Des paquets, des taches…<br>et des totaux jusqu'à 100&nbsp;!",
    souvenir=[(_dessins(ic, 4, 38, 86, 12), txt) for ic, txt in VUES["equation"]["souvenir"]],
    fiches=FICHES_DEFI, exemple=EXEMPLE_DEFI, dessins=(4, 38, 86, 12), dos=DOS_DEFI,
    css_dos=CSS_DOS_DEFI,
)
# « Le défi » en schéma en barres (relecture du 27/09/2026 : « chacun possède un défi ») : les mêmes
# 36 cartes que le défi « équation », dans la vue du livret schéma ; les petits schémas du dos sont
# redessinés à l'échelle avec les nombres de l'exemple du défi (4𝑥 + 38 = 86, 𝑥 = 12).
_ENL_D, _FIN_D, _DEP_D = mini_schemas(4, 38, 86, 12)
VUES["defi_schema"] = dict(VUES["schema"],
    sortie="livret_splat_equations_schema_defi",
    sur="Mon livret · Monde 5 · Le défi · Le schéma",
    accroche="Des paquets, des taches…<br>et des totaux jusqu'à 100&nbsp;!",
    souvenir=[(ic, txt) for ic, (_, txt) in zip((_ENL_D, _FIN_D, _DEP_D), VUES["schema"]["souvenir"])],
    fiches=FICHES_DEFI, exemple=EXEMPLE_DEFI, dessins=(4, 38, 86, 12), dos=DOS_DEFI,
    css_dos=CSS_DOS_DEFI,
)

# ------------------------------------------------------------------ les livrets corrigés
# Une correction par livret (décision du 23/09/2026) : le corrigé du livret « schéma » est la
# correction courte « le schéma en barres » de l'outil, celui du livret « équation » la
# correction courte « l'équation » (choix sur planches du 24/09 : taches dévoilées, schémas
# seuls à droite du plateau, lettre seulement — pas de version « ? » au monde 5).
CORRECTIONS = {
    "schema":   dict(suffixe="_correction", imprime="correction-schema",   dit="par le schéma en barres"),
    "equation": dict(suffixe="_correction", imprime="correction-equation", dit="par l'équation"),
    "defi":     dict(suffixe="_correction", imprime="correction-equation", dit="par l'équation"),
    "defi_schema": dict(suffixe="_correction", imprime="correction-schema", dit="par le schéma en barres"),
}
# La couverture du livret corrigé : le bandeau rouge sombre « Correction » et « Livret
# corrigé — … » à la place de Nom, prénom / Classe (mêmes textes et mêmes mesures que les
# mondes 1 à 4 ; le bandeau de 14 mm est repris sur la hauteur du cadre d'identité, qui
# devient une seule ligne : le sommaire et le pied ne bougent pas).
PROF = dict(bandeau="Correction", ligne="Livret corrigé")
CSS_PROF = """
.bandeau-prof{flex:0 0 14mm;box-sizing:border-box;padding-top:4mm;display:flex;align-items:center;justify-content:center;
  background:#b91c1c;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.ident .champ.prof{flex:1;padding:1.2mm 4mm;text-align:center;line-height:1.2}
.ident .champ.prof span{font-size:17px;color:#115e59}
.ident .champ.prof small{font-size:12.5px;font-weight:700;color:#475569;margin-left:2.5mm}
.ident .champ.prof small::before{content:"— "}
"""

# ------------------------------------------------------------------ la page de l'outil
# Le QR prend place dans le bandeau de chaque fiche, dans une boîte blanche, pour ne rien
# prendre à la place réservée à l'élève, TOUT À DROITE : les logos sont retirés au rendu
# (relecture du 27/09/2026, comme les mondes 2 et 6).
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
# le titre du corrigé (« Fiche 35 — Premières équations — Correction ») peut prendre trois lignes
CSS_TITRE_CORR = ".printArea .print-page-subtitle{-webkit-line-clamp:3}"

# Le texte du corrigé est plus court que celui de l'élève : la boîte du QR prend la largeur
# du texte de l'élève (mesuré sur une boîte témoin hors champ), pour que le titre de la
# fiche se coupe au même endroit sur les deux livrets (même recette que le monde 2).
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

# Plus aucun logo sur les pages-fiches du livret (checklist de la relecture du monde 1, reprise au
# monde 5 le 27/09/2026) : retiré AU RENDU ; l'outil garde le sien quand on imprime depuis le site.
JS_SANS_LOGO = """() => {
  const l = document.querySelectorAll('.printArea .print-page-logos');
  if (l.length !== 2) return l.length + ' bloc(s) de logos, attendu : 2';
  l.forEach(e => e.remove());
  return 'ok';
}"""

# Le pied des fiches : /splat ouvre la collection SPLAT du catalogue (livrets, univers…),
# comme les livrets des mondes 1 à 4.
PIED_LIVRET = "mathsgo.re/splat · CC BY-NC-SA 4.0"
PIED_CORRECTION = PIED_LIVRET + " · correction"
JS_PIED = """(texte) => {
  const f = document.querySelectorAll('.printArea .print-page-footer');
  if (!f.length) return 'pas de pied de page';
  f.forEach(e => { e.textContent = texte; });
  return 'ok';
}"""

# Une fiche tient sur DEUX pages : la seconde devient « Fiche N bis — … » (décision du 20/09/2026
# pour tous les livrets : une fiche = deux pages, l'élève sait de quelle feuille il parle).
JS_BIS = """(titre) => {
  const st = document.querySelectorAll('.printArea .sheet .print-page-subtitle');
  if (st.length !== 2) return st.length + ' pages imprimées au lieu de 2';
  st[1].textContent = titre;
  return 'ok';
}"""

# Un titre trop long pour une ligne (la boîte du QR prend de la place) se coupe APRÈS le tiret
# — « Fiche 37 — » / « Des taches des deux côtés » —, jamais au milieu du titre (même règle que
# les livrets de l'Enquête). Sur le corrigé, l'outil ajoute « — Correction » : on coupe d'abord
# avant ce dernier tiret (« Fiche 35 — Premières équations » / « Correction »), puis, s'il le
# faut, à chaque tiret (trois lignes, chacune entière) ; en dernier recours la police
# rétrécit, par pas de 5 %, jusqu'à 80 %. Le livret de l'élève garde sa règle d'avant, à
# l'identique.
JS_TITRE = """() => {
  const st = document.querySelectorAll('.printArea .print-page-subtitle');
  if (!st.length) return 'pas de titre';
  st.forEach(e => {
    const t = e.textContent, i = t.indexOf(' — '), parts = t.split(' — ');
    e.style.whiteSpace = 'nowrap';
    const bloc = e.parentElement;
    const trop = bloc.scrollWidth > bloc.clientWidth + 1;
    e.style.whiteSpace = '';
    if (!trop || parts.length < 2) return;
    const f0 = parseFloat(getComputedStyle(e).fontSize);
    if (parts.length === 2) {
      e.textContent = ''; e.append(t.slice(0, i) + ' —'); e.appendChild(document.createElement('br')); e.append(t.slice(i + 3));
      // encore trop long pour deux lignes : la police rétrécit, par pas de 5 %, jusqu'à 80 %
      for (let k = 1; k <= 4 && e.scrollHeight > e.clientHeight + 1; k++) e.style.fontSize = (f0 * (1 - 0.05 * k)) + 'px';
      return;
    }
    // le corrigé (« Fiche 35 — Premières équations — Correction ») : lignes entières
    e.style.whiteSpace = 'nowrap';
    const deborde = () => e.scrollHeight > e.clientHeight + 1 || bloc.scrollWidth > bloc.clientWidth + 1;
    const ecrire = (lignes) => { e.textContent = ''; lignes.forEach((l, k) => { if (k) e.appendChild(document.createElement('br')); e.append(l); }); };
    const essais = [[parts.slice(0, -1).join(' — ') + ' —', parts[parts.length - 1]], parts.map((p, k) => k < parts.length - 1 ? p + ' —' : p)];
    // (livret « Le défi », lot Q5) un titre à deux-points trop long, « Le grand défi : des deux côtés » :
    // on coupe aussi après les deux-points — les titres des livrets de base n'en ont pas, rien ne change pour eux
    const k2 = parts.findIndex(p => p.includes(' : '));
    if (k2 > 0) {
      const [av, ap] = [parts[k2].slice(0, parts[k2].indexOf(' : ')), parts[k2].slice(parts[k2].indexOf(' : ') + 3)];
      essais.push([parts.slice(0, k2).join(' — ') + ' — ' + av + ' :', ap + (k2 < parts.length - 1 ? ' —' : ''), ...parts.slice(k2 + 1).map((p, k) => k2 + 1 + k < parts.length - 1 ? p + ' —' : p)]);
    }
    for (const lignes of essais) { ecrire(lignes); if (!deborde()) return; }
    for (let k = 1; k <= 4 && deborde(); k++) e.style.fontSize = (f0 * (1 - 0.05 * k)) + 'px';
  });
  const coupe = [...st].filter(e => e.scrollHeight > e.clientHeight + 1 || e.parentElement.scrollWidth > e.parentElement.clientWidth + 1).map(e => e.textContent);
  return coupe.length ? 'titre coupé : ' + coupe.join(' | ') : 'ok';
}"""

# Le nom de l'outil dans le bandeau des fiches : « Splat! » et, dessous, « Équations » (décision du
# 24/09/2026). Sur une seule ligne, « Splat! Équations » (17 pt) ne laissait que 3 cm au titre de la
# fiche une fois la boîte du QR posée : « Des taches des deux côtés » ne tenait pas sur deux lignes.
TITRE_BANDEAU = "Splat!<small>Équations</small>"
CSS_TITRE_OUTIL = (".printArea .print-page-title{line-height:1.02 !important}"
                   ".printArea .print-page-title small{display:block;font-size:.62em;letter-spacing:.2px}")
JS_TITRE_OUTIL = """(t) => {
  const e = document.querySelectorAll('.printArea .print-page-title');
  if (!e.length) return 'pas de nom d\\'outil dans le bandeau';
  e.forEach(x => { x.innerHTML = t; });
  return 'ok';
}"""

# La feuille imprimée par l'outil et ses cartes, écrites comme le jeu de l'élève les porte
# (carteDuJeuEquaSplat, la conversion de l'outil) : c'est ce qu'on compare au jeu en ligne.
JS_FICHE = """() => ({
  cartes: cards.map(carteDuJeuEquaSplat),
  feuilles: document.querySelectorAll('.printArea .sheet').length,
  parPage: getPrintCardsPerPage(),
  vides: document.querySelectorAll('.printArea .pCard.empty').length
})"""

# L'exemple de couverture, dessiné par l'outil en deux fenêtres :
#  1. « La carte » : les plateaux de la fiche (même vue que le livret), taches TRANSPARENTES —
#     le dernier état de la résolution pas à pas de l'outil (« je vérifie »), sans texte ;
#  2. la résolution : la correction imprimée du mode « Équation » de l'outil (plateau, schémas en
#     barres, équation fléchée), dont on ne garde que les schémas (livret schéma) ou l'équation
#     (livret équation). Aucun dessin n'est inventé ici : on choisit la fenêtre.
JS_EXEMPLE = """(vue) => {
  const NS = 'http://www.w3.org/2000/svg';
  const c = cards[0];
  const tEl = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const union = (els) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    els.forEach(e => { const b = e.getBBox(); if (!b.width && !b.height) return;
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); });
    return [x0, y0, x1, y1];
  };
  const vb = ([x0, y0, x1, y1], m) => [x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m].map(v => Math.round(v)).join(' ');
  // 1. la carte, taches transparentes
  const s1 = tEl('svg', {viewBox: '0 0 1600 1200'}); document.body.appendChild(s1);
  ensureHatchDefs(s1);
  const etats = getEquationStepStates(c._eq, getCardVarChar(c), {includeVerify: true});
  const g = tEl('g');
  renderCardEquationStepPrintScene(g, c, etats.length, {layoutMode: vue, showIntroText: false, showAid: false, useTokens: false});
  s1.appendChild(g);
  /* (relecture du 27/09/2026) les taches transparentes de l'exemple, plus grosses : seule la tache
     grossit, autour du centre du jeton qu'elle cache (×1,35 en vue « équation », ×1,3 en vue
     « schéma », où les plateaux sont plus serrés) ; le jeton caché garde la taille des jetons
     visibles. Les taches ne se touchent pas (vérifié ci-dessous). */
  const kVoulu = vue === 'schema' ? 1.3 : 1.35;
  const caches = Array.from(g.querySelectorAll('circle')).filter(ci => /rgba\\(0,\\s*0,\\s*0,\\s*0?\\.055\\)/.test(ci.getAttribute('fill') || ''));
  const chemins = Array.from(g.querySelectorAll('path'));
  const taches = [];
  caches.forEach(ci => {
    const cx = +ci.getAttribute('cx'), cy = +ci.getAttribute('cy');
    const p = chemins.find(pa => { const b = pa.getBBox(); return cx > b.x && cx < b.x + b.width && cy > b.y && cy < b.y + b.height && b.width < 260; });
    if (p) { const b = p.getBBox(); taches.push({p, cx, cy, r: Math.max(b.width, b.height) / 2}); }
  });
  if (taches.length !== caches.length || !taches.length) return {erreur: 'taches de l\\'exemple : ' + taches.length + ' trouvées sur ' + caches.length};
  // le plus gros agrandissement qui laisse un petit jour entre deux taches (jamais au-delà de kVoulu)
  let k = kVoulu;
  for (let i = 0; i < taches.length; i++) for (let j = i + 1; j < taches.length; j++) {
    const a = taches[i], b = taches[j];
    k = Math.min(k, 0.96 * Math.hypot(a.cx - b.cx, a.cy - b.cy) / (a.r + b.r));
  }
  k = Math.max(1, k);
  taches.forEach(({p, cx, cy}) => {
    const enveloppe = tEl('g', {transform: `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`});
    p.parentNode.insertBefore(enveloppe, p);
    enveloppe.appendChild(p);
  });
  const vb1 = vb(union([g]), 16);
  // 2. la correction du mode Équation, sur la même carte
  const s2 = tEl('svg', {viewBox: '0 0 1600 2200'}); document.body.appendChild(s2);
  renderCardIntoSvg(s2, Object.assign({}, c, {family: 'EQ'}), 'correction');
  const gEq = s2.querySelector('#eqPrintSteps');
  if (!gEq) return {erreur: 'pas de correction #eqPrintSteps'};
  // les schémas en barres sont des cases (rect) ; l'équation fléchée vient SOUS le dernier schéma
  const tous = Array.from(gEq.querySelectorAll('rect, line, text, path'));
  const bas = Math.max(...Array.from(gEq.querySelectorAll('rect')).map(e => { const b = e.getBBox(); return b.y + b.height; }));
  const schemas = tous.filter(e => { const b = e.getBBox(); return b.y + b.height <= bas + 2; });
  const equation = tous.filter(e => e.getBBox().y >= bas - 2);
  if (!schemas.length || !equation.length) return {erreur: 'schémas ou équation introuvables'};
  const garde = vue === 'schema' ? schemas : equation;
  let boite = union(garde);
  /* (relecture du 27/09/2026) « les schémas sont trop collés » : on écarte les trois schémas de
     l'exemple (un blanc de 110 unités entre deux schémas au lieu de 32), sans toucher à leurs
     largeurs, qui restent à l'échelle (celles de l'outil). */
  if (vue === 'schema') {
    const bb = e => e.getBBox();
    const ordonnes = garde.slice().sort((a, b) => bb(a).y - bb(b).y);
    const groupes = [];
    let bas = -Infinity;
    ordonnes.forEach(e => { const b = bb(e); if (b.y > bas + 4) groupes.push([]); groupes[groupes.length - 1].push(e); bas = Math.max(bas, b.y + b.height); });
    if (groupes.length !== 3) return {erreur: 'exemple : ' + groupes.length + ' schémas au lieu de 3'};
    const ECART = 78;
    groupes.forEach((gr, i) => { if (!i) return; const w = tEl('g', {transform: `translate(0 ${ECART * i})`});
      gr[0].parentNode.insertBefore(w, gr[0]); gr.forEach(e => w.appendChild(e)); });
    boite = [boite[0], boite[1], boite[2], boite[3] + ECART * (groupes.length - 1)];
  }
  const vb2 = vb(boite, vue === 'schema' ? 18 : 22);
  // la fenêtre n'a pas les proportions du morceau gardé : on retire le reste du dessin, sinon il
  // apparaîtrait au-dessus ou au-dessous (plateau, autres schémas, équation)
  tous.filter(e => !garde.includes(e)).forEach(e => e.remove());
  Array.from(s2.children).filter(e => e !== gEq && e.tagName !== 'defs').forEach(e => e.remove());
  const eq = c._eq;
  const r = {svg1: s1.innerHTML, vb1, svg2: s2.innerHTML, vb2, variable: c.varChar, x: eq.x,
             gauche: {taches: eq.left.tasks, paquets: eq.left.visible.slice()},
             droite: {taches: eq.right.tasks, paquets: eq.right.visible.slice()},
             carte: carteDuJeuEquaSplat(c)};
  s1.remove(); s2.remove();
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
  if (!txt('.lg-corr', d.lg_corr)) return 'pas de légende de la résolution';
  if (!txt('.atoi-txt', d.atoi)) return 'pas de consigne des fiches';
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
  const li = document.querySelectorAll('.lex li');
  if (li.length !== 4) return 'Pour se souvenir : ' + li.length + ' lignes';
  d.souvenir.forEach(([ic, txt], i) => {
    li[i + 1].querySelector('.ic').innerHTML = ic;
    li[i + 1].querySelectorAll(':scope > span')[1].innerHTML = txt;
  });
  // (« Mes fiches — je colorie l'étoile » a quitté le dos : relecture du monde 1, lot 2, 25/09/2026)
  return 'ok';
}"""

# La lettre de l'exemple est un caractère mathématique (𝑛, U+1D45B…) : sur la machine de rendu,
# on nomme sa police (FreeSerif, le 𝑥 arrondi d'un Times italique), pour ce seul bloc de
# caractères — comme les corrigés en lettre de l'Enquête. Tout le reste garde sa police.
X_SOURCES = 'local("FreeSerif"), local("LatinModernMath-Regular")'
CSS_X = (
    '@font-face{font-family:"x-arrondi";src:' + X_SOURCES + ';unicode-range:U+1D400-1D7FF;size-adjust:120%}\n'
    '@font-face{font-family:"x-arrondi";font-style:italic;src:' + X_SOURCES + ';unicode-range:U+1D400-1D7FF;size-adjust:120%}\n'
    'svg text[font-family*="Times"]{font-family:"x-arrondi","Times New Roman",Times,serif !important}\n'
)

MOTS = {1: "une", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six"}

def decrit(cote):
    """« trois taches et deux paquets de 7 et 5 jetons »"""
    morceaux = []
    t, p = cote["taches"], cote["paquets"]
    if t:
        morceaux.append("une tache" if t == 1 else f"{MOTS[t]} taches")
    if p:
        if len(p) == 1:
            morceaux.append(f"un paquet de {p[0]} jetons")
        else:
            morceaux.append(f"{MOTS[len(p)]} paquets de " + ", ".join(map(str, p[:-1])) + f" et {p[-1]} jetons")
    return " et ".join(morceaux)

def textes_exemple(ex, v):
    """Le texte « Comment ça marche ? », écrit à partir de la carte que l'outil vient de
    dessiner : il ne peut donc pas mentir sur les nombres de l'exemple."""
    g, d, x = ex["gauche"], ex["droite"], ex["x"]
    if d["taches"] or not g["taches"]:
        raise SystemExit("l'exemple doit avoir ses taches d'un seul côté (à gauche / en haut)")
    haut, bas = ("En haut", "en bas") if v["vue"] == "schema" else ("À gauche", "à droite")
    sg, sd, n = sum(g["paquets"]), sum(d["paquets"]), g["taches"]
    if (sd - sg) != n * x:
        raise SystemExit("l'exemple ne tombe pas juste")
    let = f'<span class="x">{ex["variable"]}</span>'          # le caractère de l'appli (𝑛), arrondi
    nb = "&nbsp;"        # un calcul ne se coupe pas en fin de ligne
    regroupe = [f"{(nb + '+' + nb).join(map(str, c['paquets']))}{nb}={nb}{sum(c['paquets'])}" for c in (g, d) if len(c["paquets"]) > 1]
    gestes = ((f"on <b>regroupe</b> les paquets ({', '.join(regroupe)}), " if regroupe else "")
              + f"on <b>enlève</b> {sg} des deux {'plateaux' if v['vue'] == 'schema' else 'côtés'} "
              + f"({sd}{nb}–{nb}{sg}{nb}={nb}{sd - sg}), "
              + f"puis on <b>partage</b> en {n} ({sd - sg}{nb}÷{nb}{n}{nb}={nb}{x}).")
    if v["vue"] == "schema":
        outil = "Le <b>schéma en barres</b> met les deux plateaux l'un sous l'autre&nbsp;: "
    else:
        outil = (f"L'<b>équation</b> s'écrit {n}{let}{nb}+{nb}{sg}{nb}={nb}{sd}&nbsp;: ")
    return (f"Sur cette carte, il y a la même quantité de jetons {v['cotes']}. {haut}, {decrit(g)}&nbsp;; "
            f"{bas}, {decrit(d)}."
            "\n      <span>Chaque tache cache le même nombre de jetons&nbsp;: c'est l'<b>inconnue</b>, la lettre "
            f"{let}. Ici, les taches sont transparentes&nbsp;: on voit les {x} jetons que chacune cache. "
            + outil + gestes + "</span>")

# ------------------------------------------------------------------ le jeu en ligne, relu
def series_du_jeu():
    """Les séries « Le jeu de l'élève » du monde 5, relues dans la carte des mondes : { m3eN : [cartes] }."""
    univers = (RACINE / "outils" / "splat_univers.html").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r'p:"(m3e\d)",id:"[^"]+",[\s\S]*?j:"([^"]+)"', univers):
        b64 = m.group(2).split("#data=")[1]
        b64 += "=" * (-len(b64) % 4)
        out[m.group(1)] = json.loads(base64.urlsafe_b64decode(b64).decode("utf-8"))["serie"]
    return out

def series_du_defi():
    """Les séries du livret « Le défi », relues dans la page courte des QR (?f=35d, 36d, 37d) :
    { "35d" : [cartes] }. Elles ne sont pas sur la carte des mondes."""
    courte = (RACINE / "splat" / "equations" / "livret" / "index.html").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r'"(\d+d)": "(/outils/equasplat\.html\?eleve=1&parcours=(m3e\d)#data=([^"]+))"', courte):
        b64 = m.group(4) + "=" * (-len(m.group(4)) % 4)
        d = json.loads(base64.urlsafe_b64decode(b64).decode("utf-8"))
        if d.get("parcours") != m.group(3):
            raise SystemExit(f"page courte, ?f={m.group(1)} : l'étoile de l'adresse et celle de la série diffèrent")
        out[m.group(1)] = d["serie"]
    return out

def cle(carte):
    """Une équation, sans tenir compte du côté : pour comparer l'exemple aux cartes."""
    cote = lambda r: (sum(1 for t in r if t == "x"), sum(t for t in r if t != "x"))
    return tuple(sorted([cote(carte["left"]), cote(carte["right"])]))

# ------------------------------------------------------------------ rendu
def fabrique_qr():
    """(Re)fabrique les QR codes. À relancer si une adresse change."""
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    dossier = ICI / "qr"
    dossier.mkdir(parents=True, exist_ok=True)
    def ecrire(url, nom):
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(url); q.make(fit=True)
        q.make_image(fill_color="black", back_color="white").save(dossier / nom)
    for f in FICHES + FICHES_DEFI:
        q = f.get("qr", f["n"])
        ecrire(lien_fiche(q), f"fiche{q}.png")
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

def adresse_fiche(f, vue, imprime="statement"):
    """L'adresse du lien « Fiche » de la carte des mondes (eq5Adresse), sans « imprimer » ;
    pour un livret corrigé, la correction courte de l'outil à la place de l'énoncé."""
    v = "&view=" + vue
    p = f["parties"]
    suite = ("&suite=" + ";".join(quote(x + v, safe="") for x in p[1:])) if len(p) > 1 else ""
    return (f"/outils/splat_equations.html?{p[0]}{v}{suite}&print={imprime}&layout=6"
            f"&title={quote('Fiche ' + str(f['n']) + ' — ' + f['t'], safe='')}")

async def pages(v, tmp, jeu, corr=None):
    """corr : None pour le livret de l'élève, sinon l'entrée de CORRECTIONS de la famille."""
    from playwright.async_api import async_playwright
    base = f"http://127.0.0.1:{PORT}"
    qrweb = f"{BASE_WEB}/qr"
    cartes_livret = {}
    async with async_playwright() as p:
        # Le vrai Chromium (channel="chromium"), pas le « headless shell » : celui-ci espace les
        # lettres d'environ 5 % (vu le 19/09/2026 sur les couvertures du monde 2).
        nav = await p.chromium.launch(channel="chromium")

        async def page_outil(url):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.add_init_script("window.print = () => {};")
            await pg.goto(base + url, wait_until="networkidle")
            await pg.wait_for_timeout(800)
            return pg

        # --- l'exemple de couverture, dessiné par l'outil
        pg = await page_outil(f"/outils/splat_equations.html?{v['exemple']}&view={v['vue']}")
        ex = await pg.evaluate(JS_EXEMPLE, v["vue"])
        await pg.close()
        if ex.get("erreur"):
            raise SystemExit("exemple : " + ex["erreur"])

        # --- les trois fiches
        for f in v["fiches"]:
            titre = f"Fiche {f['n']} — {f['t']}"
            pg = await page_outil(adresse_fiche(f, v["vue"], corr["imprime"] if corr else "statement") + "&imprimer=1")
            etat = await pg.evaluate(JS_FICHE)
            if etat["parPage"] != 6 or etat["feuilles"] != 2 or etat["vides"] != 0 or len(etat["cartes"]) != 12:
                raise SystemExit(f"{titre} : {etat['parPage']}/page, {etat['feuilles']} feuilles, "
                                 f"{len(etat['cartes'])} cartes, {etat['vides']} cases vides")
            # le livret de base : la série de la carte des mondes ; le défi : celle de la page courte
            en_ligne = f.get("qr", f["parcours"])
            if etat["cartes"] != jeu[en_ligne]:
                raise SystemExit(f"{titre} : les cartes ne sont pas celles du jeu en ligne ({en_ligne})")
            cartes_livret[f.get("qr", str(f["n"]))] = etat["cartes"]
            # le corrigé : l'outil écrit lui-même « … — Correction » dans le titre de la fiche
            r = await pg.evaluate(JS_BIS, f"Fiche {f['n']} bis — {f['t']}" + (" — Correction" if corr else ""))
            if r != "ok":
                raise SystemExit(f"{titre}, page « bis » : {r}")
            await pg.add_style_tag(content=CSS_QR + CSS_TITRE_OUTIL + (CSS_TITRE_CORR if corr else ""))
            r = await pg.evaluate(JS_TITRE_OUTIL, TITRE_BANDEAU)
            if r != "ok":
                raise SystemExit(f"{titre}, bandeau : {r}")
            r = await pg.evaluate(JS_QR, [f"{qrweb}/fiche{f.get('qr', f['n'])}.png"] + ([QR_PROF, QR_ELEVE] if corr else [QR_ELEVE, None]))
            if r != "ok":
                raise SystemExit(f"{titre}, QR : {r}")
            r = await pg.evaluate(JS_SANS_LOGO)
            if r != "ok":
                raise SystemExit(f"{titre}, logos : {r}")
            # la mesure du titre se fait à la largeur imprimée (A4 moins les 2 × 8 mm de l'outil)
            await pg.set_viewport_size({"width": 733, "height": 1062})
            await pg.emulate_media(media="print")
            r = await pg.evaluate(JS_TITRE)
            if r != "ok":
                raise SystemExit(f"{titre}, titre : {r}")
            r = await pg.evaluate(JS_PIED, PIED_CORRECTION if corr else PIED_LIVRET)
            if r != "ok":
                raise SystemExit(f"{titre}, pied : {r}")
            await pg.wait_for_timeout(600)
            # marges : celles de la feuille de l'outil (@page 8 mm), comme un professeur qui imprime
            await pg.pdf(path=str(tmp / f"fiche{f.get('qr', f['n'])}.pdf"), format="A4", print_background=True,
                         prefer_css_page_size=True)
            await pg.close()
            print(f"   {titre} : 12 cartes, 2 pages, celles du jeu en ligne")

        # l'exemple n'est aucune carte des livrets — ni de celui-ci, ni des autres (cartes.json)
        toutes = {cle(c) for l in cartes_livret.values() for c in l} | cles_connues()
        if cle(ex["carte"]) in toutes:
            raise SystemExit("l'exemple de couverture est une carte du livret")

        async def pdf_html(page, sortie, js, donnees, css=None):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(f"{base}{BASE_WEB}/{page}", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            await pg.add_style_tag(content=CSS_X + (css or ""))
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
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        # Les flèches de la correction de l'outil écrivent « − 12 » (U+2212) ; dans la couverture,
        # ce texte prend la police Poppins, dont le « − » est plus court qu'un tiret : on écrit le
        # tiret « – », comme partout dans le livret (relevé par Code sur la PR #828). Livret
        # seulement : l'outil n'est pas touché.
        svg2 = ex["svg2"].replace(">− ", ">– ")
        couv = dict(svg1=ex["svg1"], vb1=ex["vb1"], svg2=svg2, vb2=ex["vb2"],
                    sur=v["sur"], accroche=v["accroche"], intro=textes_exemple(ex, v),
                    lg_corr=v["lg_corr"], atoi=v["atoi_couv"],
                    sommaire=[[f["n"], f["t"], f["resume"]] for f in v["fiches"]],
                    prof=dict(PROF, dit=corr["dit"]) if corr else None)
        await pdf_html("couverture.html", tmp / "p1.pdf", JS_COUV, couv, v["css_couv"])
        # les rappels du dos écrivent la lettre de l'exemple de couverture (𝑛), et sa valeur :
        # « comme l'exemple de la couverture » doit se lire avec les mêmes signes.
        # (Le moins de ces textes est le tiret « – » de Poppins, voir commun.css.)
        # (les petits dessins sont écrits pour 3𝑥 + 12 = 27, 𝑥 = 5 — pour 4𝑥 + 38 = 86, 𝑥 = 12 au
        # livret « Le défi » : v["dessins"] ; on vérifie que c'est bien l'exemple)
        if (ex["gauche"]["taches"], sum(ex["gauche"]["paquets"]), sum(ex["droite"]["paquets"]), ex["x"]) != v["dessins"]:
            raise SystemExit("l'exemple a changé : refaire les petits dessins du dos (MINI_SCH…, « 3𝑥 + 12 = 27 », v[\"dessins\"])")
        souvenir = [(ic.replace("𝑥", ex["variable"]), txt) for ic, txt in v["souvenir"]]
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/serie-{s}.png"] for nom, desc, s in v["dos"]],
                   univers=f"{qrweb}/univers.png", souvenir=souvenir)
        await pdf_html("dos.html", tmp / "p8.pdf", JS_DOS, dos, v.get("css_dos"))
        await nav.close()
    return ex, cartes_livret

def assemble(sortie, tmp, fiches):
    """Les 8 pages, puis les 2 feuilles A3 imposées (8|1 · 2|7 · 6|3 · 4|5).
    pikepdf et add_overlay (chaque page en Form XObject) : les dégradés suivent."""
    import pikepdf
    A4W, A4H = 595.276, 841.890
    src, pages_ = [], []
    for nom in ["p1.pdf"] + [f"fiche{f.get('qr', f['n'])}.pdf" for f in fiches] + ["p8.pdf"]:
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
    for g, d in [(8, 1), (2, 7), (6, 3), (4, 5)]:   # imposition d'un cahier de 8 pages
        feuille = a3.add_blank_page(page_size=(2 * A4W, A4H))
        for idx, tx in ((g, 0.0), (d, A4W)):
            pikepdf.Page(feuille).add_overlay(pages_[idx - 1], pikepdf.Rectangle(tx, 0, tx + A4W, A4H))
    a3.save(str(RACINE / "outils" / f"{sortie}_a_plier.pdf"))
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
    demandes = [a for a in sys.argv[1:] if not a.startswith("-")] or list(VUES)
    inconnu = [a for a in demandes if a not in VUES]
    if inconnu:
        raise SystemExit(f"livret inconnu : {', '.join(inconnu)} (au choix : {', '.join(VUES)})")
    if "--eleve" in sys.argv and "--correction" in sys.argv:
        raise SystemExit("--eleve et --correction s'excluent (sans option : les deux)")
    versions = [False, True]                       # le livret de l'élève, puis son corrigé
    if "--eleve" in sys.argv:
        versions = [False]
    if "--correction" in sys.argv:
        versions = [True]
    if "--qr" in sys.argv:
        fabrique_qr(); print("QR codes régénérés.")
    jeu = series_du_jeu()
    if sorted(jeu) != sorted(f["parcours"] for f in FICHES):
        raise SystemExit(f"séries du jeu relues dans la carte des mondes : {sorted(jeu)}")
    defi_en_ligne = series_du_defi()
    if sorted(defi_en_ligne) != sorted(f["qr"] for f in FICHES_DEFI):
        raise SystemExit(f"séries du défi relues dans la page courte : {sorted(defi_en_ligne)}")
    jeu.update(defi_en_ligne)
    srv = serveur()
    rendus = {}
    try:
        for nom in demandes:
            for corrige in versions:
                v = VUES[nom]
                corr = CORRECTIONS[nom] if corrige else None
                sortie = v["sortie"] + (corr["suffixe"] if corr else "")
                print(f"— livret « {nom} »" + (" corrigé" if corr else ""))
                with tempfile.TemporaryDirectory() as d:
                    tmp = Path(d)
                    ex, cartes = asyncio.run(pages(v, tmp, jeu, corr))
                    assemble(sortie, tmp, v["fiches"])
                for suffixe in ("", "_a_plier"):
                    compresse(RACINE / "outils" / f"{sortie}{suffixe}.pdf")
                groupe = "defi" if nom.startswith("defi") else "base"
                rendus.setdefault(groupe, {})[sortie] = dict(exemple=ex["carte"], fiches={str(n): c for n, c in cartes.items()})
                print(f"   Fait : outils/{sortie}.pdf et outils/{sortie}_a_plier.pdf")
    finally:
        srv.shutdown()
    # dans un même groupe, tous les livrets rendus ont exactement les mêmes cartes (seule la vue, ou
    # la correction, change) : les deux livrets de base et leurs corrigés ; le défi et son corrigé
    for groupe, r in rendus.items():
        if len({json.dumps(x, sort_keys=True) for x in r.values()}) > 1:
            raise SystemExit("les livrets n'ont pas tous les mêmes cartes" + (" (défi)" if groupe == "defi" else ""))
    # cartes.json : les 36 cartes et l'exemple de chaque groupe, tels que rendus — relus par le test du
    # dépôt ; un groupe qui n'a pas été rendu cette fois garde ce que le fichier disait déjà
    if rendus:
        ecrire_cartes({g: next(iter(r.values())) for g, r in rendus.items()})

def lire_cartes():
    f = ICI / "cartes.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}

def cles_connues():
    """Les équations de toutes les fiches déjà rendues (les deux groupes), pour l'exemple."""
    d = lire_cartes()
    fiches = list(d.get("fiches", {}).values()) + list(d.get("defi", {}).get("fiches", {}).values())
    return {cle(c) for l in fiches for c in l}

def ecrire_cartes(nouveau):
    d = lire_cartes()
    base = nouveau.get("base") or {"exemple": d.get("exemple"), "fiches": d.get("fiches", {})}
    defi_ = nouveau.get("defi") or d.get("defi")
    un = lambda c: json.dumps(c, ensure_ascii=False)          # une carte par ligne
    def bloc(r, ind):
        lignes = [f'{ind}"exemple": {un(r["exemple"])},', f'{ind}"fiches": {{']
        for i, (n, cartes) in enumerate(r["fiches"].items()):
            lignes.append(f'{ind} "{n}": [')
            lignes += [f'{ind}  {un(c)}' + ("," if k < len(cartes) - 1 else "") for k, c in enumerate(cartes)]
            lignes.append(f'{ind} ]' + ("," if i < len(r["fiches"]) - 1 else ""))
        lignes.append(f'{ind}}}')
        return lignes
    lignes = ['{'] + bloc(base, " ")
    if defi_:
        lignes[-1] += ","
        lignes += [' "defi": {'] + bloc(defi_, "  ") + [' }']
    lignes.append('}')
    (ICI / "cartes.json").write_text("\n".join(lignes) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
