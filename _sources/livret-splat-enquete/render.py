#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère les CINQ livrets de l'Enquête (monde 3 de l'univers SPLAT!, 8 pages chacun) à partir du
site lui-même — la progression v3 du 03/10/2026 (splat-relecture\monde-3-progression-six-livrets.md) :
    trois livrets de base, pour tous, dans l'ordre :
        additif        partie 1, fiches 10 à 14   « SPLAT! Enquête »
        multiplicatif  partie 2, fiches 15 à 19   « SPLAT! Grande enquête »
        rebondit       partie 3, fiches 20 à 24   « SPLAT! L'enquête rebondit »
    et deux livrets « Deuxième tour » (plus durs, mêmes étoiles) :
        tour2_dessins  fiches 11d 12d 13d 16d 17d   « Les trois dessins »
        tour2_systeme  fiches 18d 20d 22d 19d 24d   « Vers le Système »

    python3 render.py                    (les CINQ livrets, élève et corrections)
    python3 render.py additif            (un seul livret, et ses corrections)
    python3 render.py --qr               (en refabriquant d'abord les QR codes)
    python3 render.py --eleve            (seulement les livrets de l'élève)
    python3 render.py --correction       (seulement les livrets de correction)
    python3 render.py --vignettes        (seulement les vignettes de la page des livrets, d'après les PDF)

Produit, à la racine du dépôt, pour chaque livret :
    outils/livret_splat_enquete_<nom>.pdf            8 pages A4, ordre de lecture
    outils/livret_splat_enquete_<nom>_a_plier.pdf    4 pages A3 paysage, imposées
et ses deux livrets corrigés (pour la classe comme pour la maison), mêmes 8 pages, même pliage,
mêmes cartes à la même place : …_correction.pdf (inconnue « ? ») et …_correction_lettre.pdf
(inconnue en lettre), chacun avec son …_a_plier.pdf.

LES PAGES. Couverture, un exemple résolu (le dessin de la première fiche du livret), les cinq
fiches (4 cartes par page), le dos (les séries en ligne, la suite, et deux cartes de rappel du
livret d'avant — l'exemple corrigé et sa carte jumelle à la partie 3, l'unité commune résolue au
Deuxième tour 2). Une fiche = une étape de la carte des mondes = une étoile ;
le QR d'une fiche ouvre sa série en ligne (?f=12, ou ?f=12d pour le deuxième tour : la même
étoile).

LES FICHES ne sont PAS redessinées ici : elles sont rendues par l'outil du site
(outils/splat.html, « 4 par page ») avec les adresses de la carte des mondes, et le QR est
ajouté dans le bandeau juste avant l'impression. L'EXEMPLE RÉSOLU non plus : la carte et ses
trois dessins sont ceux du bouton « Voir le schéma » de l'outil (la correction en barres des
lots G1-G2 : ① les barres, ② schéma regroupé, ③ je calcule), au profil d'impression de la
correction, sur une carte qui n'est PAS dans les livrets ; les légendes sont écrites À PARTIR
DE LA CARTE rendue (elles ne peuvent pas mentir sur ses nombres). Au dos du Deuxième tour 2,
l'unité commune résolue est dessinée de la même façon.

LIVRETS DE CORRECTION : la correction imprimée de l'outil (print=correction), 4 par page,
chaque carte à la même place que sur la fiche de l'élève ; en lettre, les mêmes graines
avec unknown=letter (les nombres ne bougent pas, vérifié carte par carte au rendu). La
couverture reçoit le bandeau « Correction » et la ligne « Livret corrigé » (jamais « professeur » :
le corrigé peut être donné aux élèves, 23/09/2026), la boîte du QR dit « Je rejoue ces cartes
en ligne » ; l'exemple résolu ne change pas, les cartes de rappel du dos sont corrigées.

Dépendances : playwright (chromium), pikepdf, qrcode[pil]. qpdf si disponible.
"""
import asyncio, http.server, socketserver, threading, functools, os, sys, json
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent                      # racine du dépôt
BASE_WEB = "/_sources/livret-splat-enquete"
PORT = 8125
SITE = "https://mathsgo.re"
SC = "/splat/classique/"                        # l'outil, à son adresse courte
COURTE = "/splat/enquete/livret/"               # la page courte des QR (?f=étape, ?s=série)

# LES VINGT-CINQ FICHES (lot « fabrication des cinq livrets », 03/10/2026 : la progression v3,
# splat-relecture\monde-3-progression-six-livrets.md, section « progression v3, CINQ livrets »).
# Trois livrets de base (fiches 10 à 24, pour tous, dans l'ordre) et deux livrets « Deuxième
# tour » (11d 12d 13d 16d 17d, puis 18d 20d 22d 19d 24d : un second tour, plus dur, qui allume
# les MÊMES étoiles). Les fiches 10d, 14d, 15d, 21d et 23d n'existent plus (le 03/10 au soir :
# cinq livrets au lieu de six). Une fiche = une étape de la carte des mondes : E10 … E24 sont
# EXACTEMENT les adresses de ENQ_FICHES (outils/splat_univers.html) et de la page courte des QR
# (splat/enquete/livret/index.html, ENQ) ; E11D … E24D celles de ENQ_TOUR2 dans la page courte.
# Un test épingle les trois listes l'une sur l'autre.
# Les graines sont TRIÉES au script (le moteur de l'outil rejoué, hors dépôt) : chaque carte a sa
# variante imposée (dessin + sens des indices), aucun nombre à sous-entendu, jamais deux taches
# égales, écarts de 2 au moins, plus petite tache ≥ 5 sur les fiches à deux taches (10, 11, 15,
# 16, 22), ≥ 4 sur 17 et 18, ≥ le sixième de la plus grande, aucun mot réduit à son initiale dans
# la correction, aucune carte en double sur les 100 cartes, les cartes de rappel du dos et les
# exemples ; aucune fiche ne reprend la carte 1 d'une autre. « modele=1 » : le schéma vide sous
# la carte 1 (fiches 12, 13, 17, 18, 22, 11d, 17d, 18d, celles qui apportent un dessin).
# Si une graine change : la reporter dans la carte des mondes ET la page courte, relancer --qr.
ENQ_COMMUN = "&cards=4&unknown=question"
NOTE = "Reformule l’indice avant de dessiner ton schéma."
E10 = "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=51"
E11 = "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=0&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=74"
E12 = "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&modele=1&seed=12287"
E13 = "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&modele=1&seed=30140"
E14 = "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=3&totalMin=20&totalMax=50&seed=6176290"
E15 = "mode=C&clues=SENTENCE&splats=2&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1&seed=1800"
E16 = "mode=C&clues=SENTENCE&splats=2&mul=0&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1&seed=871"
E17 = "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&modele=1&seed=3485"
E18 = "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&modele=1&seed=962412"
E19 = "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=3&totalMin=20&totalMax=60&seed=8562429"
E20 = "mode=C&clues=SENTENCE&splats=2&repeat=3&mul=0&div=0&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=14"
E21 = "mode=C&clues=SENTENCE&splats=2&repeat=3&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=3&totalMin=20&totalMax=60&vocab=1&seed=21800"
E22 = "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&modele=1&seed=159"
E23 = "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=0&div=1&add=0&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=9"
E24 = "mode=C&clues=SENTENCE&splats=2&repeat=3&noTotal=1&mul=1&div=1&add=1&sub=1&deltaMax=20&visibleMin=1&visibleMax=3&totalMin=30&totalMax=70&seed=30091"
E11D = "mode=C&clues=SENTENCE&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&modele=1&seed=361"
E12D = "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=646916"
E13D = "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESORDRE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=2621"
E16D = "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=8707765"
E17D = "mode=C&clues=SENTENCE&splats=3&structure=COMPLETE&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&modele=1&seed=69705"
E18D = "mode=C&clues=SENTENCE&splats=2&compose=1&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&modele=1&seed=151"
E19D = "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESORDRE&mul=1&div=1&add=1&sub=1&deltaMax=25&visibleMin=1&visibleMax=3&totalMin=60&totalMax=120&seed=1558913"
E20D = "mode=C&clues=SENTENCE&splats=3&structure=HASARD&reunies=1&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=80&seed=1169"
E22D = "mode=C&clues=SYMBOL&splats=3&structure=HASARD&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=132600"
E24D = "mode=C&clues=SENTENCE&splats=3&structure=UNITE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=90&seed=17782"

def fiche(n, t, q, resume, note=False, code=None):
    """code : ce que porte le QR de la fiche (« 12 », ou « 12d » pour un livret Deuxième tour)."""
    return dict(n=n, t=t, q=q, resume=resume, note=note, code=code or str(n))

# Les fiches de chaque livret : n = numéro de fiche = numéro d'étape de la carte des mondes ;
# le titre imprimé est « Fiche {code} — {t} ». Les titres sont ceux du document du 03/10.
FICHES_ADD = [
    fiche(10, "De plus que", E10, "Deux taches, un indice&nbsp;: de plus."),
    fiche(11, "De moins que", E11, "Le même jeu, à l'envers.", note=True),
    fiche(12, "Trois taches, une référence", E12, "Deux indices, depuis la plus petite."),
    fiche(13, "Trois taches en chaîne", E13, "La tache commune est au milieu."),
    fiche(14, "Référence ou chaîne ?", E14, "À toi de reconnaître le dessin."),
]
FICHES_MUL = [
    fiche(15, "Fois plus", E15, "L'indice multiplie&nbsp;: le double, le triple."),
    fiche(16, "Fois moins", E16, "L'indice partage&nbsp;: la moitié, le quart.", note=True),
    fiche(17, "Une référence, deux rapports", E17, "Deux rapports, depuis la plus petite."),
    fiche(18, "Chaîne, deux rapports", E18, "Fois plus, puis encore fois plus."),
    fiche(19, "Une référence, un écart et un rapport", E19, "De plus et fois plus, ensemble."),
]
FICHES_REB = [
    fiche(20, "Des taches répétées", E20, "Même couleur, même nombre."),
    fiche(21, "Répétées, fois plus ou moins", E21, "L'indice multiplie ou partage."),
    fiche(22, "Sans total", E22, "Deux indices, et pas de total."),
    fiche(23, "Sans total, à retourner", E23, "Deux indices à retourner.", note=True),
    fiche(24, "Le défi qui rebondit", E24, "Répétées ou sans total."),
]
# Deuxième tour 1 — les trois dessins ; Deuxième tour 2 — vers le Système (le grand défi, puis
# l'unité commune en dernier : c'est la dernière fiche du monde 3).
FICHES_T2_DESSINS = [
    fiche(11, "Je complète", E11D, "La tache commune est la plus grande.", code="11d"),
    fiche(12, "Référence, chaîne ou je complète ?", E12D, "À toi de reconnaître le dessin.", code="12d"),
    fiche(13, "Tout dans le désordre", E13D, "Par où commencer&nbsp;?", code="13d"),
    fiche(16, "Chaîne, un écart et un rapport", E16D, "De plus, puis fois plus.", code="16d"),
    fiche(17, "Je complète, avec un rapport", E17D, "Compléter, puis remplacer.", code="17d"),
]
FICHES_T2_SYSTEME = [
    fiche(18, "Indices composés", E18D, "«&nbsp;3 de plus que le double&nbsp;».", code="18d"),
    fiche(20, "Deux taches réunies", E20D, "Autant que deux autres réunies.", code="20d"),
    fiche(22, "Les indices en symboles", E22D, "L'indice s'écrit en symboles.", code="22d"),
    fiche(19, "Le grand défi", E19D, "Tout mélangé, grands nombres.", code="19d"),
    fiche(24, "Unité commune : les petites parts", E24D, "Je coupe en petites parts.", code="24d"),
]

# Les séries infinies du dos : pas de graine, huit cartes nouvelles à chaque ouverture, en mode
# élève sans étape (rien n'est enregistré). Leurs QR passent par la page courte (?s=N). Les
# réglages sont ceux des fiches, sans graine (ni « modele », qui ne sert qu'à l'impression).
# 1 à 15 : les anciens livrets ; 16 à 34 : les six livrets du 30/09 ; 35 et 36 : les cinq
# livrets du 03/10 (la chaîne additive, les deux rapports). La page courte les sert TOUTES, pour
# un livret déjà imprimé ; seules celles des cinq livrets sont listées ici.
SERIES = {
    16: "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50",
    17: "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50",
    19: "mode=C&clues=SENTENCE&splats=2&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&vocab=1",
    20: "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    22: "mode=C&clues=SENTENCE&splats=2&repeat=3&mul=1&div=1&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    23: "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=1&add=1&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60",
    24: "mode=C&clues=SENTENCE&splats=2&repeat=3&noTotal=1&mul=1&div=1&add=1&sub=1&deltaMax=20&visibleMin=1&visibleMax=3&totalMin=30&totalMax=70",
    25: "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    26: "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESORDRE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    28: "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    29: "mode=C&clues=SENTENCE&splats=3&structure=COMPLETE&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    30: "mode=C&clues=SENTENCE&splats=2&compose=1&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    32: "mode=C&clues=SENTENCE&splats=3&structure=HASARD&reunies=1&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=80",
    33: "mode=C&clues=SYMBOL&splats=3&structure=HASARD&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    34: "mode=C&clues=SENTENCE&splats=3&structure=UNITE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=90",
    # (03/10/2026) la chaîne additive (fiches 13 et 14) ; les deux rapports, référence ou chaîne
    # (fiches 17 et 18 : sans « de plus / de moins », « au hasard » ne tire jamais « je complète »)
    35: "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50",
    36: "mode=C&clues=SENTENCE&splats=3&structure=HASARD&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
}
SERIE_CARTES = 8

# LES EXEMPLES (couverture et page 2) : la page 2 de chaque livret montre le dessin de SA
# première fiche (décision du 30/09), sur une carte qui n'est dans aucun livret :
#   base 1 (graine 32)        : deux taches, « de plus » — noire 9, verte 17, total 26 ;
#   base 2 (graine 83)        : deux taches, « 3 fois plus » — noire 7, bleue 21, total 28 ;
#   base 3 (graine 82)        : taches répétées, une noire et deux bleues « 7 de plus » — 8, 15, 15 ;
#   2e tour 1 (graine 20)     : je complète, deux « de plus » vers la plus grande (03/10/2026 :
#                               la fiche 11d ouvre le livret) — total 21 ;
#   2e tour 2 (graine 14)     : indice composé à deux taches, « 3 de plus que le double »
#                               (03/10/2026 : la fiche 18d ouvre le livret) — total 21.
# render.py écrit les textes à partir de la carte rendue, et refuse un exemple qui serait une
# carte d'un livret (total et valeurs, quel que soit l'ordre des taches).
EX_ADD2 = "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&cards=1&unknown=question&seed=32"
EX_MUL2 = "mode=C&clues=SENTENCE&splats=2&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&cards=1&unknown=question&seed=83"
EX_REB = "mode=C&splats=2&repeat=2&clues=SENTENCE&mul=0&div=0&add=1&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=15&totalMax=45&cards=1&unknown=question&seed=82"
EX_COMPLETE = "mode=C&clues=SENTENCE&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=1&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=40&cards=1&unknown=question&seed=20"
EX_COMPOSE = "mode=C&clues=SENTENCE&splats=2&compose=1&mul=1&div=0&add=1&sub=0&deltaMax=8&visibleMin=0&visibleMax=0&totalMin=20&totalMax=40&cards=1&unknown=question&seed=14"
# L'unité commune résolue, au dos du Deuxième tour 2 (à la place des cartes de rappel) :
# « la rouge a 2 fois plus que la verte, 3 fois plus que la noire » — noire 10, verte 15, rouge 30,
# total 55 ; les petites parts : 11 parts = 55, 1 part = 5. Une carte de réglages 24d qui n'est pas dans la fiche.
EX_UNITE = "mode=C&clues=SENTENCE&splats=3&structure=UNITE&mul=1&div=0&add=0&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=60&cards=1&unknown=question&seed=59"

# LES CARTES DE RAPPEL DU DOS (décidées le 02/10, gardées le 03/10) : deux cartes du livret
# d'avant, à la place de « Pour se souvenir » — énoncé dans le livret de l'élève, correction
# dans les livrets corrigés, à la même place. Partie 1 : deux cartes du monde 2 (SPLAT!
# classique, un paquet puis deux paquets) ; Partie 3 : l'exemple sans total résolu reste, et
# une carte ; Deuxième tour 2 : l'unité commune résolue, sans carte de rappel. Graines vérifiées
# au script : aucune n'est une carte des 25 fiches ni un exemple.
R_MONDE2 = "mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=2&tasksMax=5&visibleMin=1&visibleMax=2&seed=16"
R2A = "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=0&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=7"
R2B = "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=4"
R4A = "mode=C&clues=SENTENCE&splats=2&repeat=3&mul=0&div=0&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=4"
R4B = "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=0&div=1&add=0&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=10"
def rappel(q, n=1, titre=None, corrige=False):
    """n cartes de rappel tirées d'une même adresse (les n premières cartes de la série) ;
    corrige : la carte est TOUJOURS corrigée (l'exemple corrigé de la partie 3), même dans le
    livret de l'élève ; titre : écrit au-dessus de la carte."""
    return dict(q=q, n=n, titre=titre, corrige=corrige)

# La page « exemple résolu » : 2e page du livret (lue avant la première fiche).
PLACE_EXEMPLE = 2

T2 = "Monde 3 · Deuxième tour"   # (sur-titre sans « Mon livret · » : sinon il passe sur deux lignes)
# L'exemple corrigé du dos de la partie 3 (03/10/2026, demande de Gwenaël : « un exemple corrigé »,
# à la place du texte « sans total » du 25/09) : une carte sans total que l'outil corrige, à côté de
# la carte à faire — noire 12, verte 36 : « 3 fois plus » et « 24 de plus ». Elle n'est dans aucune
# fiche et n'est aucun exemple (vérifié au script).
R3_EXEMPLE = "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=21"
# … et à côté, la MÊME sorte de carte avec d'autres nombres, à faire (demande de Gwenaël, 03/10 :
# « la même chose, avec des données différentes ») — orange 11, verte 33 : « 3 fois plus » et
# « 22 de plus ». Elle remplace la carte « écart + fois moins » de la partie 2.
R3_A_TOI = "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=4"
LIVRETS = {
    "additif": dict(
        sortie="livret_splat_enquete_additif", fiches=FICHES_ADD,
        exemple=dict(query=EX_ADD2, op="DEUX"),
        couv=dict(sur="Mon livret · Monde 3 · Partie 1", titre="Enquête",
                  accroche="Un indice relie les taches…<br>à toi de mener l'enquête&nbsp;!"),
        dos=dict(
            series=[("Deux taches", "De plus ou de moins, comme les fiches&nbsp;10 et&nbsp;11.", 16),
                    ("Une référence", "Trois taches, comme la fiche&nbsp;12.", 17),
                    ("En chaîne", "Trois taches, comme les fiches&nbsp;13 et&nbsp;14.", 35)],
            rappel=dict(dit="Deux cartes du monde&nbsp;2&nbsp;: trouve ce que cache chaque tache.", cartes=[rappel(R_MONDE2, 2)]),
            suite="Continue avec la partie&nbsp;2, <b>Grande enquête</b>&nbsp;: fois plus, fois moins&nbsp;!")),
    "multiplicatif": dict(
        sortie="livret_splat_enquete_multiplicatif", fiches=FICHES_MUL,
        exemple=dict(query=EX_MUL2, op="DEUX"),
        couv=dict(sur="Mon livret · Monde 3 · Partie 2", titre="Grande enquête",
                  accroche="Fois plus, fois moins…<br>et les deux ensemble&nbsp;!"),
        dos=dict(
            series=[("Fois plus, fois moins", "Deux taches, comme les fiches&nbsp;15 et&nbsp;16.", 19),
                    ("Deux rapports", "Trois taches, comme les fiches&nbsp;17 et&nbsp;18.", 36),
                    ("Écart et rapport", "Trois taches, comme la fiche&nbsp;19.", 20)],
            rappel=dict(dit="Deux cartes de la partie&nbsp;1&nbsp;: dessine le schéma, puis trouve ce que cache chaque tache.", cartes=[rappel(R2A), rappel(R2B)]),
            suite="Continue avec la partie&nbsp;3, <b>L'enquête rebondit</b>&nbsp;: des taches de même couleur, puis sans total&nbsp;!")),
    "rebondit": dict(
        sortie="livret_splat_enquete_rebondit", fiches=FICHES_REB,
        exemple=dict(query=EX_REB, op="REPET"),
        couv=dict(sur="Mon livret · Monde 3 · Partie 3", titre="L'enquête rebondit",
                  accroche="Des taches de même couleur…<br>puis des enquêtes sans total&nbsp;!"),
        dos=dict(
            series=[("Taches répétées", "Même couleur, même nombre, comme les fiches&nbsp;20 et&nbsp;21.", 22),
                    ("Sans total", "Deux indices, pas de total, comme les fiches&nbsp;22 et&nbsp;23.", 23),
                    ("Le défi qui rebondit", "Tout mélangé, comme la fiche&nbsp;24.", 24)],
            rappel=dict(dit="Une carte sans total corrigée, puis la même sorte de carte à résoudre.",
                        cartes=[rappel(R3_EXEMPLE, titre="Un exemple corrigé", corrige=True), rappel(R3_A_TOI, titre="À toi&nbsp;!")]),
            suite="Continue avec le monde&nbsp;4, <b>SPLAT! Système</b>&nbsp;: plusieurs plateaux, un total pour chacun… compare-les&nbsp;!")),
    # Les livrets « Deuxième tour » (03/10/2026 : deux au lieu de trois) : un second tour plus dur,
    # les MÊMES étoiles (?f=Nd → parcours=enqN).
    "tour2_dessins": dict(
        sortie="livret_splat_enquete_tour2_dessins", fiches=FICHES_T2_DESSINS,
        exemple=dict(query=EX_COMPLETE, op="COMPLETE"),
        couv=dict(sur=T2 + " · 1", titre="Les trois dessins",
                  accroche="Référence, chaîne, je complète…<br>à toi de reconnaître le dessin&nbsp;!"),
        dos=dict(
            series=[("Quel dessin&nbsp;?", "Comme les fiches&nbsp;11d et&nbsp;12d.", 25),
                    ("Dans le désordre", "Comme la fiche&nbsp;13d.", 26),
                    ("Chaîne et rapport", "Comme la fiche&nbsp;16d.", 28),
                    ("Je complète", "Avec un rapport, comme la fiche&nbsp;17d.", 29)],
            rappel=dict(dit="Deux cartes de la partie&nbsp;3&nbsp;: dessine le schéma, puis trouve ce que cache chaque tache.", cartes=[rappel(R4A), rappel(R4B)]),
            suite="Continue avec le livret <b>Vers le Système</b>&nbsp;: indices composés, symboles, unité commune&nbsp;!")),
    "tour2_systeme": dict(
        sortie="livret_splat_enquete_tour2_systeme", fiches=FICHES_T2_SYSTEME,
        exemple=dict(query=EX_COMPOSE, op="COMPOSE"),
        couv=dict(sur=T2 + " · 2", titre="Vers le Système",
                  accroche="Indices composés, symboles…<br>et l'unité commune&nbsp;!"),
        dos=dict(unite=EX_UNITE,
            series=[("Indices composés", "Comme la fiche&nbsp;18d.", 30),
                    ("Taches réunies", "Comme la fiche&nbsp;20d.", 32),
                    ("En symboles", "Comme la fiche&nbsp;22d.", 33),
                    ("Unité commune", "Les petites parts, comme la fiche&nbsp;24d.", 34)],
            suite="Continue avec le monde&nbsp;4, <b>SPLAT! Système</b>&nbsp;: plusieurs plateaux, un total pour chacun&nbsp;!")),
}

def lien_fiche(n):
    """Le QR d'une fiche : la page courte ?f=N, qui ouvre EXACTEMENT le lien « Le jeu
    de l'élève » de l'étape N sur la carte des mondes (les mêmes cartes, l'étoile de
    l'étape, la même empreinte de reprise). Pour un livret Deuxième tour, ?f=Nd : les
    cartes de la fiche Nd, et la MÊME étoile (parcours=enqN)."""
    return f"{SITE}{COURTE}?f={n}"

def lien_serie(s):
    return f"{SITE}{COURTE}?s={s}"

LIEN_UNIVERS = f"{SITE}/outils/splat_univers.html"

# Le QR prend place dans le bandeau de chaque fiche, dans une boîte blanche, pour ne rien
# prendre à la place réservée sous chaque carte (comme le livret du monde 2).
CSS_QR = """
.printArea .print-page-header{flex-basis:21mm !important}
.printArea .print-page-title-block{flex:1 1 auto;min-width:0;align-items:center}
.printArea .print-page-subtitle{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.12}
.qr-livret{display:flex;align-items:center;gap:2.5mm;background:#fff;border-radius:2mm;padding:1mm 1.5mm 1mm 2.5mm;margin-left:auto;margin-right:2mm;flex:0 0 auto}
.qr-livret img{width:17mm;height:17mm;display:block}
.qr-livret .lib{text-align:right;font-size:11px;font-weight:900;color:#0f172a;line-height:1.2;white-space:nowrap}
.qr-livret .lib em{display:block;font-style:normal;font-weight:400;font-size:10px;color:#475569;margin-top:0.5mm}
"""
# Le 𝑥 ARRONDI des corrections en lettre (23/09/2026). L'outil écrit l'inconnue avec le
# caractère mathématique « 𝑥 » (U+1D465), que la police des cartes n'a pas : chaque système le
# dessine avec une police de secours. Sur un PC Windows, c'est Cambria Math — le 𝑥 arrondi,
# celui que Gwenaël voit dans l'appli ; sur la machine qui rend les livrets, c'était une police
# sans empattement — un x droit. On nomme donc la police du 𝑥, pour ce seul caractère
# (unicode-range) : tout le reste de la page garde exactement sa police. Les deux faces
# (droite et italique) pointent vers la même lettre, déjà penchée : pas de fausse italique.
# FreeSerif (le 𝑥 d'un Times italique) a un œil plus petit que la police des cartes :
# size-adjust:120 % lui donne la hauteur du x de DejaVu Sans (mesuré : 108 px contre 109 à
# 200 px ; 90 sans réglage). Mesure faite pour FreeSerif : ne pas changer l'ordre des polices
# sans remesurer.
X_SOURCES = 'local("FreeSerif"), local("LatinModernMath-Regular")'
CSS_X = (
    '@font-face{font-family:"x-arrondi";src:' + X_SOURCES + ';unicode-range:U+1D465;size-adjust:120%}\n'
    '@font-face{font-family:"x-arrondi";font-style:italic;src:' + X_SOURCES + ';unicode-range:U+1D465;size-adjust:120%}\n'
    '*{font-family:"x-arrondi",system-ui,-apple-system,"Segoe UI",Roboto,Arial}\n'
)
JS_X = r"""async () => {
  const non = 'aucune police pour le 𝑥 arrondi (FreeSerif ou Latin Modern Math : apt install fonts-freefont-ttf)';
  try {
    const f = await document.fonts.load('italic 40px "x-arrondi"', '\u{1D465}');
    return f.length ? 'ok' : non;
  } catch (e) { return non; }
}"""

# Les cartes de rappel du dos (03/10/2026) : les dessins de l'outil, 4 par page, tels quels (les
# variables de couleur résolues, comme pour l'exemple), et la clé de chaque carte.
JS_RAPPEL = r"""(n) => {
  printSheet();
  const svgs = [...document.querySelectorAll('.printArea .pCard svg')].slice(0, n);
  if (svgs.length !== n) return {erreur: svgs.length + ' cartes au lieu de ' + n};
  const cs = getComputedStyle(document.body), inconnues = new Set();
  const resout = s => s.replace(/var\((--[\w-]+)\)/g, (m, k) => { const v = cs.getPropertyValue(k).trim(); if (!v) inconnues.add(k); return v || m; });
  const out = svgs.map(sv => { const c = sv.cloneNode(true); c.removeAttribute('style'); c.removeAttribute('width'); c.removeAttribute('height');
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); return resout(c.outerHTML); });
  if (inconnues.size) return {erreur: 'variables de couleur inconnues : ' + [...inconnues].join(', ')};
  const cache = c => (c._rel ? c._rel.hiddenValues : c.hidden).slice().sort((a, b) => a - b);
  return {svgs: out, cles: cards.slice(0, n).map(c => [c.total, JSON.stringify(cache(c))])};
}"""
# (les cartes de rappel du dos prennent la lettre de l'outil, SplatLettres, par commun.css — 𝑥 compris)

QR_ELEVE = "J'ai terminé<br>ma fiche,<em>je rejoue en ligne</em>"
QR_PROF = "Je rejoue<br>ces cartes<em>en ligne</em>"

JS_QR = """([qr, lib]) => {
  const heads = document.querySelectorAll('.printArea .print-page-header');
  if (!heads.length) return 'pas de bandeau imprimé';
  heads.forEach(h => {
    const box = document.createElement('div'); box.className = 'qr-livret';
    box.innerHTML = '<div class="lib">' + lib + '</div><img src="' + qr + '" alt="">';
    const logos = h.querySelector('.print-page-logos');
    h.insertBefore(box, logos || null);
  });
  return 'ok';
}"""

# Le pied des fiches : /splat ouvre la collection SPLAT du catalogue (livrets, univers…),
# comme les livrets des mondes 1 et 2.
PIED_LIVRET = "mathsgo.re/splat · CC BY-NC-SA 4.0"
PIED_CORRECTION = PIED_LIVRET + " · correction"
# Un titre de fiche trop long pour une ligne (la boîte du QR prend de la place dans le
# bandeau) se coupe APRÈS le tiret — « Fiche 13 — » / « Trois taches en chaîne » —, jamais
# au milieu du titre (« Trois taches en » / « chaîne ») ; sur une correction, la 1re ligne
# devient « Fiche 13 — Correction ». L'adresse de la fiche ne change pas.
JS_TITRE = """() => {
  const st = document.querySelectorAll('.printArea .print-page-subtitle');
  if (!st.length) return 'pas de titre';
  st.forEach(e => {
    const t = e.textContent, i = t.indexOf(' — ');
    e.style.whiteSpace = 'nowrap';
    const bloc = e.parentElement;              // « Splat! » + le titre : c'est lui qui déborde
    const trop = bloc.scrollWidth > bloc.clientWidth + 1;
    e.style.whiteSpace = '';
    if (trop && i > 0) {
      // sur une correction, « — Correction » monte sur la première ligne, après le numéro
      const corr = t.endsWith(' — Correction') ? ' — Correction' : '';
      const tete = t.slice(0, i) + (corr || ' —');
      // un nombre ne se sépare pas de son mot (« 4 opérations »)
      const suite = t.slice(i + 3, t.length - corr.length).replace(/(\d) /g, '$1\u00a0');
      e.textContent = ''; e.append(tete); e.appendChild(document.createElement('br')); e.append(suite);
      // encore trop long pour deux lignes : la police rétrécit, par pas de 5 %, jusqu'à 80 %
      const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.12;
      const f0 = parseFloat(getComputedStyle(e).fontSize);
      for (let k = 1; k <= 4 && e.getBoundingClientRect().height > 2.4 * lh * (1 - 0.05 * (k - 1)); k++)
        e.style.fontSize = (f0 * (1 - 0.05 * k)) + 'px';
    }
  });
  return 'ok';
}"""

# Les logos des livrets SPLAT! (décision du 25/09/2026, lot 2 de l'Enquête, 30/09 : comme les
# livrets des mondes 1 et 2) : plus AUCUN logo sur les pages-fiches (ni IREMI ni maths&go) — on
# retire les blocs .print-page-logos AU RENDU, jamais dans l'outil (une fiche imprimée depuis le
# générateur garde ses deux logos) ; la boîte du QR passe tout à droite. Ni sur la couverture ni
# en page 2 ; IREMI + maths&go une seule fois, au dos, à côté des crédits.
JS_SANS_LOGO = """() => {
  const l = document.querySelectorAll('.printArea .print-page-logos');
  if (!l.length) return 'pas de logos dans le bandeau';
  l.forEach(e => e.remove());
  return 'ok';
}"""

JS_PIED = """(texte) => {
  const f = document.querySelectorAll('.printArea .print-page-footer');
  if (!f.length) return 'pas de pied de page';
  f.forEach(e => { e.textContent = texte; });
  return 'ok';
}"""

# La feuille imprimée telle que l'outil la fabrique, et ses cartes (pour comparer « ? » et lettre).
JS_FICHE = """() => {
  printSheet();
  return {cartes: cards.map(c => [c.total, JSON.stringify(c._rel.hiddenValues.slice().sort((a, b) => a - b)), JSON.stringify(c._inv.indices)]),
          feuilles: document.querySelectorAll('.printArea .sheet').length, parPage: getPrintCardsPerPage()};
}"""

# ---------------------------------------------------------------------------
# LES LIVRETS DE CORRECTION : « ? » et lettre (décision du 21/09/2026).
CORRECTIONS = [
    dict(suffixe="_correction",        lettre=False, dit="inconnue «&nbsp;?&nbsp;»"),
    dict(suffixe="_correction_lettre", lettre=True,  dit="inconnue en lettre"),
]
# 23/09/2026 : le livret corrigé peut aussi être donné aux élèves (Claire) — il ne dit plus
# « professeur » nulle part : bandeau « Correction », ligne « Livret corrigé ».
PROF = dict(bandeau="Correction", ligne="Livret corrigé")
CSS_PROF = """
.bandeau-prof{flex:0 0 14mm;box-sizing:border-box;padding-top:4mm;display:flex;align-items:center;justify-content:center;
  background:#b91c1c;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.ident .champ.prof{flex:1;padding:1.2mm 4mm;text-align:center;line-height:1.2}
.ident .champ.prof span{font-size:17px;color:#831843}
.ident .champ.prof small{font-size:12.5px;font-weight:700;color:#475569;margin-left:2.5mm}
.ident .champ.prof small::before{content:"— "}
"""

# L'exemple : la carte (énoncé) et les cinq schémas du bouton « Voir le schéma », dessinés
# par l'outil au profil d'impression de la correction. Le bouton « Résoudre » du schéma
# ordonné (il ouvre ÉquaBarre à l'écran) n'a rien à faire sur le papier : on le retire.
JS_EXEMPLE = r"""() => {
  const NS = 'http://www.w3.org/2000/svg', card = cards[0];
  const mk = () => { const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', '0 0 1600 2200');
    sv.setAttribute('width', '1600'); sv.setAttribute('height', '2200'); document.body.appendChild(sv); return sv; };
  // plateauEntier (01/10/2026) : la carte seule garde son plateau de 28 mm — les énoncés des
  // fiches passent à 22 mm pour laisser la place d'écrire, ici il n'y a rien à écrire dessous
  const sc = mk(); renderCardIntoSvg(sc, card, 'statement', {plateauEntier: true});
  const fond = sc.querySelector('rect'); if (fond && fond.getAttribute('width') === '1600') fond.remove();
  const carte = sc.innerHTML; sc.remove();
  // la correction en barres (lots G1-G2, 29/09/2026) : ① les barres, ② schéma regroupé,
  // ③ je calcule (sans la ligne réponse : la 4e étape de la page, « Je réponds » puis
  // « Je vérifie », la remplace)
  const modele = enqueteBarresModele(card);
  if (!modele) return {erreur: "la carte de l'exemple n'a pas de correction en barres"};
  const prof = {isPrint:true, modele, sansTitre:true}; // la page a ses propres titres
  // Les schémas successifs du pas à pas de la projection (lot G3), au profil d'impression : les
  // barres, le schéma regroupé, puis un dessin par opération (je range, je regroupe, je retire,
  // je partage, je remplace) et les barres avec les nombres. Ni le schéma vide ni le dernier
  // appui (la dernière étape de la page, « Je réponds » puis « Je vérifie », est en texte).
  // Les autres taches tiennent en UN dessin, le dernier (toutes les valeurs, tous les calculs).
  let plan = null;
  try { plan = enqueteG3Etapes(card); } catch (_e) { plan = null; }
  if (!plan || !plan.etapes.length || plan.etapes[plan.etapes.length - 1].type !== 'fin') return {erreur: "la carte de l'exemple n'a pas de pas à pas (G3)"};
  const pas = plan.etapes.filter(e => e.type !== 'vide' && e.type !== 'fin');
  const trouve = pas.filter(e => e.type === 'barresValeurs' && e.egal !== false);
  const liste = pas.filter(e => !trouve.includes(e) || e === trouve[trouve.length - 1]);
  const etapes = liste.map(e => {
    let et = e, titre = e.type === 'barres' ? 'Je fais le schéma de la situation' : e.titre;
    if (trouve.includes(e) && trouve.length > 1) { et = {...e, noirDes: 0}; titre = modele.mode === 'unite' ? 'Je trouve les taches' : 'Je trouve les autres taches'; }
    const sv = mk(); const g = document.createElementNS(NS, 'g'); sv.appendChild(g);
    enqueteG3Dessiner(g, card, et, plan.modele, prof);
    const b = g.querySelector('#btnEquabarSolve'); if (b) b.remove();
    const bb = g.getBBox(); const r = {svg: sv.innerHTML, h: Math.ceil(bb.y + bb.height - 612) + 8, titre, type: e.type}; sv.remove(); return r;
  });
  // Les pastilles des schémas sont peintes avec les variables de couleur de l'outil
  // (var(--splat-orange)…), inconnues des pages du livret : sans cette résolution, la pastille
  // orange sortait NOIRE (vu le 23/09 avec le premier exemple à trois taches). On remplace
  // chaque variable par sa valeur dans l'outil ; une variable inconnue fait échouer le rendu.
  const cs = getComputedStyle(document.body);
  const inconnues = new Set();
  const resout = s => s.replace(/var\((--[\w-]+)\)/g, (m, n) => { const v = cs.getPropertyValue(n).trim(); if (!v) inconnues.add(n); return v || m; });
  etapes.forEach(e => { e.svg = resout(e.svg); });
  const carteRes = resout(carte);
  if (inconnues.size) return {erreur: 'variables de couleur inconnues : ' + [...inconnues].join(', ')};
  const rel = card._rel, mot = i => investigateColorWord(investigateColorInfo(card, i));
  // le modèle de la correction, en données, pour écrire les légendes
  const cellule = c => c.kind === 'tache' ? {tache: mot(c.de)} : {nombre: c.v, ajout: c.kind === 'ajout'};
  const barres = {mode: modele.mode, unite: mot(modele.unit), titre1: modele.titre1, reformulation: modele.reformulation,
    preLignes: modele.preLignes, accolade: modele.accolade,
    rows: modele.rows.map(r => ({tache: mot(r.i), label: r.label, cells: r.cells.map(cellule), sous: r.sous.map(x => x.label)})),
    ligne: modele.ligne ? {total: modele.ligne.total, groupes: modele.ligne.groupes.map(gr => gr.label)} : null,
    calculs: modele.calculs.map(l => l ? l.g + ' = ' + l.d : null), verification: modele.verification};
  return {carte: carteRes, etapes, total: card.total, visibles: card.visible, valeurs: rel.hiddenValues, ref: modele.unit,
          mots: rel.hiddenValues.map((_, i) => mot(i)), indices: card._inv.indices, barres,
          relations: rel.relations, eq: rel.equation, structure: rel.structure, verification: modele.verification,
          cle: [card.total, JSON.stringify(rel.hiddenValues.slice().sort((a, b) => a - b))]};
}"""

JS_COUV = """(d) => {
  const set = (sel, svg, vb) => { const e = document.querySelector(sel); if (!e) return false; e.innerHTML = svg; if (vb) e.setAttribute('viewBox', vb); return true; };
  if (!set('svg.ex-carte', d.carte)) return 'pas de place pour la carte';
  if (document.querySelector('svg.ex-vide')) return 'la couverture montre encore un schéma vide (retiré le 29/09/2026)';
  const txt = (sel, html) => { const e = document.querySelector(sel); if (!e) return false; e.innerHTML = html; return true; };
  if (!txt('.tete .sur', d.sur) || !txt('.tete h1 span', d.titre) || !txt('.tete .accroche', d.accroche) || !txt('.expl .intro', d.intro)) return 'textes de couverture';
  // le titre du monde (« Grande enquête », monde 4) tient sur UNE ligne, à gauche du dessin
  const h = document.querySelector('.tete h1 span').getBoundingClientRect(), hero = document.querySelector('.tete .hero').getBoundingClientRect();
  if (h.height > 60) return 'titre sur deux lignes : ' + d.titre;
  const mots = document.createRange(); mots.selectNodeContents(document.querySelector('.tete h1 span'));
  if (mots.getBoundingClientRect().right > hero.left - 4) return 'le titre touche le dessin : ' + d.titre;
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

JS_PAGE_EXEMPLE = """(d) => {
  const c = document.querySelector('svg.ex-carte'); if (!c) return 'pas de place pour la carte';
  c.innerHTML = d.carte;
  const e = document.querySelector('.enquete'); if (!e) return 'pas de bloc enquête'; e.innerHTML = d.enquete;
  // les dessins du pas à pas (de 4 à 7), puis « Je réponds » et « Je vérifie », en texte ;
  // jusqu'à cinq dessins : une colonne ; au-delà : deux colonnes, lues de haut en bas (la
  // moitié des étapes à gauche, le reste à droite)
  const ol = document.querySelector('.etapes'); if (!ol) return 'pas de liste des étapes';
  const n = d.etapes.length;
  if (n < 4 || n > 7) return n + ' dessins (de 4 à 7 attendus)';
  const deux = n > 5;
  if (deux) ol.classList.add('deux');
  // le numéro de l'étape dans une pastille blanche bordée (01/10/2026, question à choix de
  // Gwenaël) : la tache numérotée reste réservée aux fiches (10, 11… sur la couverture) —
  // « 5 Je retire » ne doit pas se lire « fiche 5 » ; c'est le ① ② des corrigés et de la projection
  const badge = i => '<span class="num">' + i + '</span>';
  ol.innerHTML = d.etapes.map((e, i) =>
    '<li class="et">' + badge(i + 1) + '<div class="txt"><h3>' + e.titre + '</h3><p class="leg">' + (e.legende || '') + '</p></div>' +
    '<svg class="dessin" viewBox="50 612 1500 ' + e.h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + e.titre + '">' + e.svg + '</svg></li>').join('') +
    // la dernière étape, en texte (03/10/2026) : « Je réponds » (la phrase, encadrée) puis
    // « Je vérifie », deux endroits comme à l'écran — côte à côte en une colonne, l'un sous
    // l'autre en deux colonnes (exemple.html), pour ne rien prendre aux schémas
    '<li class="et texte">' + badge(n + 1) + '<div class="txt duo"><div><h3>Je réponds</h3><p class="rep">' + d.fin.reponse + '</p></div>' +
    '<div><h3>Je vérifie</h3><p class="leg">' + d.fin.verif + '</p></div></div></li>';
  const et = [...ol.children], moitie = Math.ceil((n + 1) / 2);
  if (deux) { et[moitie].classList.add('saut'); et[moitie - 1].classList.add('avant-saut'); }
  if (document.querySelector('.fin')) return 'la conclusion est devenue la dernière étape (29/09/2026)';
  const bas = () => document.querySelector('.pied').getBoundingClientRect().top;
  const fin = () => document.querySelector('.atoi').getBoundingClientRect().bottom;
  // une colonne : si la page déborde, les dessins rétrécissent ensemble (de 4 % en 4 %, 76 % au moins)
  for (let p = 96; !deux && fin() > bas() - 12 && p >= 76; p -= 4) ol.querySelectorAll('.dessin').forEach(s => { s.style.width = p + '%'; });
  // le blanc qui reste sous « À toi ! » est réparti entre les étapes (lot 2, 30/09/2026), au
  // lieu de rester en bas de page : jusqu'à 12 mm de plus entre deux (6 mm en deux colonnes)
  const libre = bas() - fin() - 20;
  if (libre > 20) {
    if (deux) {
      const plus = Math.min(24, libre / (moitie - 1));
      et.forEach((li, i) => { if (i !== moitie - 1 && i !== n) li.style.marginBottom = 'calc(3.5mm + ' + plus + 'px)'; });
    } else {
      const g = parseFloat(getComputedStyle(ol).rowGap) || 15;
      ol.style.rowGap = Math.min(90, g + libre / n) + 'px';
    }
  }
  if (deux) {
    // les deux colonnes : chaque étape entière dans sa colonne, la moitié à gauche
    const x = et.map(li => Math.round(li.getBoundingClientRect().left));
    if (!x.every((v, i) => v === (i < moitie ? x[0] : x[moitie])) || x[moitie] <= x[0]) return 'les étapes ne sont pas rangées en deux colonnes';
  }
  if (fin() > bas() - 8) return 'la page 2 déborde sur le pied';
  return 'ok';
}"""

JS_DOS = """(d) => {
  const box = document.querySelector('.niveaux');
  if (!box) return 'pas de bloc niveaux';
  box.innerHTML = d.niveaux.map(n =>
     '<div class="niv"><img src="' + n[2] + '" alt=""><span class="n">' + n[0] +
     '</span><span class="d">' + n[1] + '</span></div>').join('');
  const qrU = document.querySelector('.suite img'); if (qrU) qrU.setAttribute('src', d.univers);
  const s = document.querySelector('.suite p.t'); if (!s) return 'pas de texte « suite »'; s.innerHTML = d.suite;
  const lex = document.querySelector('.lex'); if (!lex) return 'pas de bloc « lex »';
  if (!!d.rappel === !!d.unite) return 'le dos a des cartes de rappel OU l’unité commune résolue';
  // les crédits sont poussés par le bas du dos : la vraie limite est le bas de la page
  const deborde = () => {
    const c = document.querySelector('.credits').getBoundingClientRect();
    const pied = document.querySelector('.pied').getBoundingClientRect().bottom, page = document.documentElement.clientHeight;
    const bas = Math.max(...[...lex.children].map(e => e.getBoundingClientRect().bottom));
    return Math.max(bas - c.top + 4, pied - page);
  };
  // (03/10/2026, décidé le 02/10) les cartes de rappel du livret d'avant, à la place de « Pour se
  // souvenir » : dessinées par l'outil (4 par page), l'énoncé pour l'élève, la correction dans
  // les livrets corrigés ; à la partie 3, un exemple corrigé (toujours corrigé) à gauche de la carte.
  if (d.rappel) {
    const R = d.rappel;
    lex.className = 'lex rappel';
    document.body.classList.add('dos-serre');
    const titres = R.cartes.some(c => c.titre);
    lex.innerHTML = '<span class="chip">Pour ne pas oublier</span><p class="r-dit">' + R.dit + '</p>' +
      '<div class="r-grille">' + R.cartes.map(c => '<div class="r-bloc">' + (titres ? '<h3>' + (c.titre || '') + '</h3>' : '') +
      '<div class="r-carte">' + c.svg + '</div></div>').join('') + '</div>';
    if (lex.querySelectorAll('.r-carte svg').length !== R.cartes.length) return 'cartes de rappel : ' + lex.querySelectorAll('.r-carte svg').length + ' dessins';
    // trop haut pour la page : les cartes rétrécissent ensemble, de 3 % en 3 %, 70 % au moins
    const blocs = [...lex.querySelectorAll('.r-carte')];
    const l0 = blocs.map(e => e.getBoundingClientRect().width);
    for (let p = 97; deborde() > 0 && p >= 70; p -= 3) blocs.forEach((e, i) => { e.style.width = (l0[i] * p / 100) + 'px'; });
    if (deborde() > 0) return 'les cartes de rappel débordent : ' + Math.round(deborde()) + ' px de trop';
    const r = blocs.map(e => e.getBoundingClientRect());
    if (r.some(x => x.right > lex.getBoundingClientRect().right + 0.5 || x.left < lex.getBoundingClientRect().left - 0.5)) return 'les cartes de rappel débordent sur le côté';
    return 'ok';
  }
  // Deuxième tour 2 (03/10/2026 ; Deuxième tour 3 avant) : l'unité commune résolue — la carte et
  // les schémas successifs du pas à pas de la projection (G3) : la situation, je coupe en petites
  // parts, le schéma regroupé, je partage, les taches — en deux colonnes lues de haut en bas, la
  // carte en tête, la réponse à la fin ; le tout doit tenir au-dessus des crédits.
  const u = d.unite;
  lex.className = 'lex unite';
  document.body.classList.add('dos-unite'); // les QR un peu plus petits : la place va à l'exemple
  const N = '①②③④⑤⑥⑦⑧';
  const et = (e, i) => '<div class="u-et"><h3>' + N[i] + ' ' + e.titre + '</h3><svg viewBox="50 612 1500 ' + e.h + '" xmlns="http://www.w3.org/2000/svg">' + e.svg + '</svg></div>';
  lex.innerHTML = '<span class="chip">Un exemple résolu&nbsp;: les petites parts</span>' +
    '<div class="u-corps"><div class="u-carte"><svg viewBox="100 10 1460 830" xmlns="http://www.w3.org/2000/svg">' + u.carte + '</svg><p>' + u.indices + '</p></div>' +
    u.etapes.map(et).join('') + '<p class="u-fin"><b>' + N[u.etapes.length] + ' Je vérifie.</b> ' + u.fin + '</p></div>';
  lex.style.flexShrink = '0';
  if (deborde() > 0) return 'l’unité commune déborde : ' + Math.round(deborde()) + ' px de trop';
  return 'ok';
}"""

MOTS = {1: "une", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six"}

def _art(mot):
    return ("l'" if mot[0] in "aeiouy" else "la ") + mot

def _cases(cells, unite):
    """« une noire et 4 », « deux noires », « une noire, 4 et 3 » — les cases d'une barre, en mots."""
    n = sum(1 for c in cells if "tache" in c)
    nombres = [str(c["nombre"]) for c in cells if "nombre" in c]
    pl = unite if unite == "orange" else unite + "s"
    tete = (f"une {unite}" if n == 1 else f"{MOTS.get(n, n)} {pl}") if n else ""
    parts = ([tete] if tete else []) + nombres
    if len(parts) == 1:
        return parts[0]
    return ", ".join(parts[:-1]) + " et " + parts[-1]

def textes_exemple(ex, op):
    """Les textes de la couverture et de la page 2, écrits à partir de la carte que l'outil
    vient de dessiner et de SON modèle de correction (ex["barres"], lot G1) : ils ne peuvent
    pas mentir sur les nombres de l'exemple. Les légendes suivent les trois étapes de « Voir le
    schéma » (① les barres, ② schéma regroupé, ③ je calcule), puis la 4e étape de la page,
    « Je réponds » puis « Je vérifie » (lot G2, 29/09/2026). op : DEUX (deux taches, un
    indice — livrets de base 1 et 2), ADD / MUL (chaîne — Deuxième tour 1 et 2), REPET (taches
    répétées — base 3), REUNIES (deux taches réunies — Deuxième tour 3)."""
    if op == "REPET":
        return textes_exemple_repet(ex)
    if op == "DEUX":
        return textes_exemple_deux(ex)
    if op == "REUNIES":
        return textes_exemple_reunies(ex)
    if op == "COMPLETE":
        return textes_exemple_complete(ex)
    if op == "COMPOSE":
        return textes_exemple_compose(ex)
    n = len(ex["valeurs"])
    if ex["visibles"] or n != 3 or len(ex["relations"]) != 2:
        raise SystemExit("l'exemple doit être une carte à trois taches, sans jeton visible")
    T, v, mots, ref = ex["total"], ex["valeurs"], ex["mots"], ex["ref"]
    B = ex["barres"]
    if B["mode"] != "chaine":
        raise SystemExit(f"l'exemple doit être une chaîne (la tache commune au milieu), pas « {B['mode']} »")
    ops = [r["op"] for r in ex["relations"]]
    if op == "ADD" and ops != ["ADD", "ADD"]:
        raise SystemExit(f"livret additif : deux indices « de plus », pas {ops}")
    if op == "MUL" and ops != ["ADD", "MUL"]:
        raise SystemExit(f"livret multiplicatif : « de plus » puis « fois plus », pas {ops}")
    u = B["unite"]
    assert u == mots[ref] and T == sum(v)
    t = {m: f"la tache {m}" for m in mots}
    rows = B["rows"]                      # unité, milieu, haut
    r0, r1, r2 = rows
    rel1 = _cases(r1["cells"], u)
    # la tache du haut, écrite d'abord avec la tache du milieu (« une bleue et 3 » / « trois bleues »),
    # puis dans l'unité : c'est le remplacement
    haut = [r for r in ex["relations"] if r["target"] == mots.index(r2["tache"])][0]
    milieu_i = mots.index(r1["tache"])
    if haut["source"] != milieu_i:
        raise SystemExit("l'exemple doit être une chaîne : le 2e indice part de la tache du milieu")
    k = haut["k"]
    pl_m = r1["tache"] if r1["tache"] == "orange" else r1["tache"] + "s"
    avec_milieu = (f"une {r1['tache']} et {k}" if haut["op"] == "ADD" else f"{MOTS.get(k, k)} {pl_m}")
    # (30/09/2026, relecture de Gwenaël : ce que le schéma montre déjà — une barre par tache,
    # le mot dans chaque case, le total à droite — n'est plus écrit ; restent l'unité et les indices)
    barres = (f"Tout s'écrit avec la plus petite, {t[u]}. {_art(r1['tache']).capitalize()}&nbsp;: {rel1}. "
              f"{_art(r2['tache']).capitalize()}&nbsp;: {avec_milieu}&nbsp;; je remplace {_art(r1['tache'])}&nbsp;: {_cases(r2['cells'], u)}.")
    tous = [c for r in rows for c in r["cells"]]
    ligne = f"Les barres bout à bout sous le total&nbsp;: {_cases(tous, u)} font {T}."
    # le texte ne recopie plus les calculs (29/09/2026) : le dessin les montre
    resous = f"D'abord {t[u]}, l'unité&nbsp;; puis les autres taches à partir d'elle."
    # « Je réponds » puis « Je vérifie » : la réponse en gras, le total, puis chaque indice
    # retourné (« 5 + 10 = 15 ✓ »)
    verifs = [ex["verification"]]
    for r in ex["relations"]:
        s_, t_ = v[r["source"]], v[r["target"]]
        if r["op"] == "ADD": verifs.append(f"{s_} + {r['k']} = {t_}")
        elif r["op"] == "SUB": verifs.append(f"{t_} + {r['k']} = {s_}")
        elif r["op"] == "MUL": verifs.append(f"{r['k']} × {s_} = {t_}")
        elif r["op"] == "DIV": verifs.append(f"{r['k']} × {t_} = {s_}")
    fin = (f"{t[u].capitalize()} cache <b>{v[ref]}</b> jetons, {_art(r1['tache'])} <b>{v[milieu_i]}</b>, "
           f"{_art(r2['tache'])} <b>{v[mots.index(r2['tache'])]}</b>.|||" + "&nbsp;✓&nbsp;; ".join(verifs) + "&nbsp;✓")
    indices = "<br>".join(f"<q>{i}</q>" for i in ex["indices"])
    autres = [m for m in mots if m != u]
    intro = (f"Sur cette carte, il y a {T} jetons au total, tous cachés sous trois taches&nbsp;: "
             f"{t[u]}, {t[autres[0]]} et {t[autres[1]]}. Deux indices les relient."
             "\n      <span>Pour mener l'enquête, on dessine un <b>schéma en barres</b>&nbsp;: une "
             f"barre par tache. Ici, tout s'écrit avec {t[u]}, "
             "la plus petite. La page&nbsp;2 mène cette enquête pas à pas, jusqu'à la réponse.</span>")
    enquete = (f"<p><b>Le total</b>&nbsp;: {T} jetons, tous cachés sous trois taches.</p>"
               f"<p><b>Les indices</b>&nbsp;: {indices}</p>"
               "<p class=\"but\">Mon enquête&nbsp;: trouver ce que cache chaque tache.</p>")
    return dict(intro=intro, enquete=enquete, legendes=[barres, ligne, resous, fin])


def _verifs(ex):
    """« Je vérifie » : le total, puis chaque indice dit dans le sens positif (« 5 + 10 = 15 »)."""
    v = ex["valeurs"]
    out = [ex["verification"]]
    for r in ex["relations"]:
        s_, t_ = v[r["source"]], v[r["target"]]
        if r["op"] == "ADD": out.append(f"{s_} + {r['k']} = {t_}")
        elif r["op"] == "SUB": out.append(f"{t_} + {r['k']} = {s_}")
        elif r["op"] == "MUL": out.append(f"{r['k']} × {s_} = {t_}")
        elif r["op"] == "DIV": out.append(f"{r['k']} × {t_} = {s_}")
        elif r["op"] == "SUM": out.append(f"{s_} + {v[r['source2']]} = {t_}")
        elif r["op"] == "COMPOSE":
            out.append(f"{r['k']} × {s_} {'+' if r['d'] > 0 else '−'} {abs(r['d'])} = {t_}")
    return out


def _intro(T, n, noms, relie, u):
    return (f"Sur cette carte, il y a {T} jetons au total, tous cachés sous {MOTS[n]} taches&nbsp;: "
            f"{noms}. {relie}"
            "\n      <span>Pour mener l'enquête, on dessine un <b>schéma en barres</b>&nbsp;: une "
            f"barre par tache. Ici, tout s'écrit avec la tache {u}, "
            "la plus petite. La page&nbsp;2 mène cette enquête pas à pas, jusqu'à la réponse.</span>")


def _enquete(T, n, indices, pluriel):
    q = "<br>".join(f"<q>{i}</q>" for i in indices)
    nom = "Les indices" if pluriel else "L'indice"
    return (f"<p><b>Le total</b>&nbsp;: {T} jetons, tous cachés sous {MOTS[n]} taches.</p>"
            f"<p><b>{nom}</b>&nbsp;: {q}</p>"
            "<p class=\"but\">Mon enquête&nbsp;: trouver ce que cache chaque tache.</p>")


def textes_exemple_deux(ex):
    """Livrets de base 1 et 2 (lot 2, 30/09/2026) : deux taches, un indice « de plus » ou
    « fois plus » — le dessin des fiches 10 et 15. Écrits à partir de la carte rendue."""
    v, mots, ref, T, B = ex["valeurs"], ex["mots"], ex["ref"], ex["total"], ex["barres"]
    if ex["visibles"] or len(v) != 2 or len(ex["relations"]) != 1:
        raise SystemExit("l'exemple d'un livret de base 1 ou 2 : deux taches, un indice, sans jeton visible")
    r = ex["relations"][0]
    if r["op"] not in ("ADD", "MUL") or r["source"] != ref or B["mode"] != "reference":
        raise SystemExit("l'exemple : « de plus » ou « fois plus », depuis la plus petite tache")
    u, g = mots[ref], mots[1 - ref]
    assert B["unite"] == u and T == sum(v)
    r0, r1 = B["rows"]
    dit = f"a {r['k']} jetons de plus" if r["op"] == "ADD" else f"a {r['k']} fois plus de jetons"
    barres = (f"Tout s'écrit avec la plus petite, la tache {u}. {_art(g).capitalize()} {dit}&nbsp;: {_cases(r1['cells'], u)}.")
    tous = r0["cells"] + r1["cells"]
    ligne = f"Les barres bout à bout sous le total&nbsp;: {_cases(tous, u)} font {T}."
    resous = f"D'abord la tache {u}, l'unité&nbsp;; puis la tache {g} à partir d'elle."
    fin = (f"La tache {u} cache <b>{v[ref]}</b> jetons, la tache {g} <b>{v[1 - ref]}</b>.|||"
           + "&nbsp;✓&nbsp;; ".join(_verifs(ex)) + "&nbsp;✓")
    intro = _intro(T, 2, f"la tache {u} et la tache {g}", "Un indice les relie.", u)
    return dict(intro=intro, enquete=_enquete(T, 2, ex["indices"], False), legendes=[barres, ligne, resous, fin])


def textes_exemple_reunies(ex):
    """Livret Deuxième tour 3 (lot 2, 30/09/2026) : trois taches, un écart entre deux d'entre
    elles, et la troisième « autant que les deux autres réunies » — le dessin de la fiche 20d."""
    v, mots, ref, T, B = ex["valeurs"], ex["mots"], ex["ref"], ex["total"], ex["barres"]
    if ex["visibles"] or len(v) != 3 or len(ex["relations"]) != 2 or B["mode"] != "reunies":
        raise SystemExit("l'exemple du Deuxième tour 3 : trois taches, deux taches réunies, sans jeton visible")
    ecart = [r for r in ex["relations"] if r["op"] != "SUM"][0]
    if ecart["op"] != "ADD" or ecart["source"] != ref:
        raise SystemExit("l'exemple du Deuxième tour 3 : un indice « de plus » depuis la plus petite")
    u = B["unite"]
    r0, r1, r2 = B["rows"]
    m, g = r1["tache"], r2["tache"]
    assert u == mots[ref] and T == sum(v)
    barres = (f"Tout s'écrit avec la plus petite, la tache {u}. {_art(m).capitalize()}&nbsp;: {_cases(r1['cells'], u)}. "
              f"{_art(g).capitalize()} vaut les deux autres réunies&nbsp;: une {u}, puis {_cases(r1['cells'], u)}.")
    tous = [c for r in B["rows"] for c in r["cells"]]
    ligne = f"Les barres bout à bout sous le total&nbsp;: {_cases(tous, u)} font {T}."
    resous = f"D'abord la tache {u}, l'unité&nbsp;; puis la tache {m}, et enfin la tache {g}, les deux réunies."
    fin = (f"La tache {u} cache <b>{v[ref]}</b> jetons, la tache {m} <b>{v[mots.index(m)]}</b>, la tache {g} <b>{v[mots.index(g)]}</b>.|||"
           + "&nbsp;✓&nbsp;; ".join(_verifs(ex)) + "&nbsp;✓")
    intro = _intro(T, 3, f"la tache {u}, la tache {m} et la tache {g}", "Deux indices les relient.", u)
    return dict(intro=intro, enquete=_enquete(T, 3, ex["indices"], True), legendes=[barres, ligne, resous, fin])


def textes_exemple_complete(ex):
    """Deuxième tour 1 (03/10/2026) : trois taches, deux indices « de plus » vers la plus grande —
    le dessin de la fiche 11d, « je complète ». La tache commune est la PLUS GRANDE : chaque autre
    barre, complétée de son écart, fait une barre de la grande. Écrits à partir de la carte rendue
    et de son modèle de correction (mode « complete »)."""
    v, mots, T, B = ex["valeurs"], ex["mots"], ex["total"], ex["barres"]
    if ex["visibles"] or len(v) != 3 or len(ex["relations"]) != 2 or B["mode"] != "complete":
        raise SystemExit("l'exemple du Deuxième tour 1 : je complète, trois taches, sans jeton visible")
    if any(r["op"] != "ADD" for r in ex["relations"]) or len({r["target"] for r in ex["relations"]}) != 1:
        raise SystemExit("l'exemple du Deuxième tour 1 : deux indices « de plus » vers la même tache")
    g = B["unite"]                                   # la plus grande, la tache commune
    gi = mots.index(g)
    assert gi == ex["relations"][0]["target"] and v[gi] == max(v) and T == sum(v)
    ps = [r for r in B["rows"] if r["tache"] != g]   # les deux barres complétées
    k = {r["tache"]: [c["nombre"] for c in r["cells"] if "nombre" in c][0] for r in ps}
    a, b = ps[0]["tache"], ps[1]["tache"]
    gs = g if g == "orange" else g + "s"
    barres = (f"La tache commune est la plus grande, la tache {g}&nbsp;: je complète les deux autres. "
              f"{_art(a).capitalize()} et {k[a]} font une {g}&nbsp;; {_art(b)} et {k[b]} aussi.")
    ligne = f"Complétées, les barres font trois {gs}&nbsp;: {T} + {k[a]} + {k[b]} = {B['accolade']}."
    resous = f"D'abord la tache {g}&nbsp;; puis j'enlève ce que j'ai ajouté aux deux autres."
    ordre = sorted(range(3), key=lambda i: v[i])
    fin = ("L" + ", ".join(f"la tache {mots[i]} cache <b>{v[i]}</b> jetons" for i in ordre)[1:] + ".|||"
           + "&nbsp;✓&nbsp;; ".join(_verifs(ex)) + "&nbsp;✓")
    intro = (f"Sur cette carte, il y a {T} jetons au total, tous cachés sous trois taches&nbsp;: "
             f"la tache {mots[ordre[0]]}, la tache {mots[ordre[1]]} et la tache {g}. Deux indices les relient."
             "\n      <span>Pour mener l'enquête, on dessine un <b>schéma en barres</b>&nbsp;: une "
             f"barre par tache. Ici, les deux indices parlent de la tache {g}, "
             "la plus grande&nbsp;: on complète les deux autres. La page&nbsp;2 mène cette enquête pas à pas, jusqu'à la réponse.</span>")
    return dict(intro=intro, enquete=_enquete(T, 3, ex["indices"], True), legendes=[barres, ligne, resous, fin])


def textes_exemple_compose(ex):
    """Deuxième tour 2 (03/10/2026) : deux taches, un indice composé « 3 de plus que le double »
    — le dessin de la fiche 18d. Écrits à partir de la carte rendue."""
    v, mots, ref, T, B = ex["valeurs"], ex["mots"], ex["ref"], ex["total"], ex["barres"]
    if ex["visibles"] or len(v) != 2 or len(ex["relations"]) != 1:
        raise SystemExit("l'exemple du Deuxième tour 2 : deux taches, un indice, sans jeton visible")
    r = ex["relations"][0]
    if r["op"] != "COMPOSE" or r["d"] <= 0 or r["source"] != ref or B["mode"] != "reference":
        raise SystemExit("l'exemple du Deuxième tour 2 : « … de plus que le double », depuis la plus petite")
    u, g = mots[ref], mots[1 - ref]
    assert B["unite"] == u and T == sum(v)
    r0, r1 = B["rows"]
    mot_k = {2: "le double", 3: "le triple"}[r["k"]]
    barres = (f"Tout s'écrit avec la plus petite, la tache {u}. {_art(g).capitalize()} a {r['d']} jetons de plus que "
              f"{mot_k} de la {u}&nbsp;: {_cases(r1['cells'], u)}.")
    ligne = f"Les barres bout à bout sous le total&nbsp;: {_cases(r0['cells'] + r1['cells'], u)} font {T}."
    resous = f"D'abord la tache {u}, l'unité&nbsp;; puis la tache {g} à partir d'elle."
    fin = (f"La tache {u} cache <b>{v[ref]}</b> jetons, la tache {g} <b>{v[1 - ref]}</b>.|||"
           + "&nbsp;✓&nbsp;; ".join(_verifs(ex)) + "&nbsp;✓")
    intro = _intro(T, 2, f"la tache {u} et la tache {g}", "Un seul indice les relie, avec deux gestes&nbsp;: le double, puis de plus.", u)
    return dict(intro=intro, enquete=_enquete(T, 2, ex["indices"], False), legendes=[barres, ligne, resous, fin])


def textes_exemple_repet(ex):
    """« L'enquête rebondit » (25/09/2026) : trois taches, deux couleurs, la tache de référence
    seule et l'autre couleur deux fois, un indice « de plus ». Écrits à partir de la carte rendue
    et de son modèle de correction (lot G1)."""
    v, mots, ref, T = ex["valeurs"], ex["mots"], ex["ref"], ex["total"]
    if ex["visibles"] or len(v) != 3 or len(ex["relations"]) != 1:
        raise SystemExit("l'exemple de « L'enquête rebondit » : trois taches, un indice, sans jeton visible")
    r = ex["relations"][0]
    autres = [i for i in range(3) if i != ref]
    if r["op"] != "ADD" or r["source"] != ref or mots[autres[0]] != mots[autres[1]] or mots[ref] == mots[autres[0]]:
        raise SystemExit("l'exemple de « L'enquête rebondit » : la référence seule, l'autre couleur deux fois, « de plus »")
    x, k, o = v[ref], r["k"], mots[autres[0]]
    assert all(v[i] == x + k for i in autres) and T == 3 * x + 2 * k
    B = ex["barres"]
    rr, oo = mots[ref], o
    oos = oo if oo == "orange" else oo + "s"            # « orange » est invariable
    barres = (f"Tout s'écrit avec la plus petite, la tache {rr}. "
              f"Chaque tache {oo}&nbsp;: une {rr} et {k} — les deux {oos} cachent le même nombre.")
    ligne = f"Les barres bout à bout sous le total&nbsp;: trois {rr}s, {k} et {k} font {T}."
    resous = f"D'abord la tache {rr}, l'unité&nbsp;; puis les taches {oos} à partir d'elle."
    fin = (f"La tache {rr} cache <b>{x}</b> jetons, chaque tache {oo} <b>{x + k}</b>. "
           f"|||{ex['verification']}&nbsp;✓&nbsp;; {x} + {k} = {x + k}&nbsp;✓")
    indices = "<br>".join(f"<q>{i}</q>" for i in ex["indices"])
    intro = (f"Sur cette carte, il y a {T} jetons au total, tous cachés sous trois taches&nbsp;: "
             f"une tache {rr} et deux taches {oos}. Les taches de même couleur cachent le même nombre de jetons&nbsp;; "
             "un indice relie les deux couleurs."
             "\n      <span>Pour mener l'enquête, on dessine un <b>schéma en barres</b>&nbsp;: une "
             f"barre par tache. Ici, tout s'écrit avec la tache {rr}, "
             "la plus petite. La page&nbsp;2 mène cette enquête pas à pas, jusqu'à la réponse.</span>")
    enquete = (f"<p><b>Le total</b>&nbsp;: {T} jetons, tous cachés sous trois taches.</p>"
               "<p><b>La règle</b>&nbsp;: les taches de même couleur cachent le même nombre de jetons.</p>"
               f"<p><b>L'indice</b>&nbsp;: {indices}</p>"
               "<p class=\"but\">Mon enquête&nbsp;: trouver ce que cache chaque tache.</p>")
    return dict(intro=intro, enquete=enquete, legendes=[barres, ligne, resous, fin])


def donnees_page2(ex, textes):
    """Ce que la page 2 reçoit : la carte, l'enquête, les dessins du pas à pas (avec une légende
    pour les deux premiers : les barres, le schéma regroupé) et la dernière étape, en texte :
    la réponse et la vérification, séparées par « ||| » dans la dernière légende."""
    leg = textes["legendes"]
    etapes = [dict(e, legende=leg[i] if i < 2 else "") for i, e in enumerate(ex["etapes"])]
    reponse, verif = leg[-1].split("|||")       # « Je réponds » ||| « Je vérifie » (03/10/2026)
    return dict(carte=ex["carte"], etapes=etapes, enquete=textes["enquete"],
                fin=dict(reponse=reponse.strip(), verif=verif))

def fabrique_qr():
    """(Re)fabrique tous les QR codes. À relancer si une graine ou une série change. Les QR qui ne
    servent plus à aucun livret (fiches et séries retirées) sont effacés du dossier."""
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    dossier = ICI / "qr"
    dossier.mkdir(parents=True, exist_ok=True)
    faits = set()
    def ecrire(url, nom):
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(url); q.make(fit=True)
        q.make_image(fill_color="black", back_color="white").save(dossier / nom)
        faits.add(nom)
    for niv in LIVRETS.values():
        for f in niv["fiches"]:
            ecrire(lien_fiche(f["code"]), f"fiche{f['code']}.png")
        for _, _, s in niv["dos"]["series"]:
            ecrire(lien_serie(s), f"serie-{s}.png")
    ecrire(LIEN_UNIVERS, "univers.png")
    for vieux in dossier.glob("*.png"):
        if vieux.name not in faits:
            vieux.unlink()

def vignettes():
    """Les vignettes de la page des livrets (03/10/2026) : la page 1 de chaque livret de l'élève à
    120 dpi (993 × 1404), en PNG et en WebP plus légère, dans assets/img/thumbnails/splat/
    (livret-splat-enquete-<nom>.png/.webp). PyMuPDF s'il est là, sinon pdftoppm."""
    import shutil, subprocess, tempfile
    from PIL import Image
    dossier = RACINE / "assets" / "img" / "thumbnails" / "splat"
    for niv in LIVRETS.values():
        pdf = RACINE / "outils" / f"{niv['sortie']}.pdf"
        png = dossier / (niv["sortie"].replace("_", "-") + ".png")
        try:
            import fitz
            with fitz.open(str(pdf)) as d:
                d[0].get_pixmap(dpi=120).save(str(png))
        except ImportError:
            if not shutil.which("pdftoppm"):
                raise SystemExit("vignettes : il faut PyMuPDF (pip install pymupdf) ou pdftoppm")
            with tempfile.TemporaryDirectory() as t:
                subprocess.run(["pdftoppm", "-r", "120", "-png", "-f", "1", "-l", "1", "-singlefile", str(pdf), f"{t}/v"], check=True)
                shutil.move(f"{t}/v.png", png)
        im = Image.open(png)
        if im.size != (993, 1404):
            raise SystemExit(f"vignette {png.name} : {im.size} au lieu de 993 × 1404")
        im.convert("RGB").save(png.with_suffix(".webp"), "WEBP", quality=82, method=6)
        print(f"   vignette : {png.relative_to(RACINE)} (+ .webp)")

def serveur():
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    h = functools.partial(Silencieux, directory=str(RACINE))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def rendre(niv, tmp, corr=None):
    """corr : None pour le livret de l'élève, sinon un élément de CORRECTIONS."""
    from playwright.async_api import async_playwright
    base = f"http://127.0.0.1:{PORT}"
    qrweb = f"{BASE_WEB}/qr"
    cles = {}
    async with async_playwright() as p:
        # Le vrai Chromium (channel="chromium") et non le « headless shell » : celui-ci
        # espace les lettres d'environ 5 % (vu le 19/09/2026 sur les couvertures).
        nav = await p.chromium.launch(channel="chromium")

        async def page_outil(query):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
            await pg.goto(f"{base}/outils/splat.html?{query}", wait_until="networkidle")
            await pg.wait_for_timeout(800)
            return pg

        # --- l'exemple (couverture et page 2), dessiné par l'outil
        pg = await page_outil(niv["exemple"]["query"] + "&print=statement")
        ex = await pg.evaluate(JS_EXEMPLE)
        await pg.close()
        if "erreur" in ex:
            raise SystemExit(f"exemple du livret « {niv['sortie']} » : {ex['erreur']}")
        textes = textes_exemple(ex, niv["exemple"]["op"])
        print(f"   exemple : total {ex['total']}, {ex['mots']} = {ex['valeurs']} — {ex['indices'][0]}")

        async def pdf_html(url, sortie, js=None, donnees=None, css=()):
            pg = await nav.new_page(viewport={"width": 794, "height": 1123})
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
            await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                         margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
            await pg.close()

        async def pdf_fiche(f, sortie):
            titre = f"Fiche {f['code']} — {f['t']}"
            q = f["q"] + ENQ_COMMUN
            if corr and corr["lettre"]:
                q = q.replace("unknown=question", "unknown=letter")
            q += "&layout=4" + (f"&note={quote(NOTE)}" if f["note"] else "")
            q += f"&title={quote(titre)}&print={'correction' if corr else 'statement'}"
            pg = await page_outil(q)
            etat = await pg.evaluate(JS_FICHE)
            if etat["parPage"] != 4:
                raise SystemExit(f"{titre} : {etat['parPage']} cartes par page au lieu de 4")
            if etat["feuilles"] != 1 or len(etat["cartes"]) != 4:
                raise SystemExit(f"{titre} : {etat['feuilles']} feuilles, {len(etat['cartes'])} cartes")
            cles[titre] = etat["cartes"]
            await pg.add_style_tag(content=CSS_QR)
            if corr and corr["lettre"]:
                await pg.add_style_tag(content=CSS_X)
                r = await pg.evaluate(JS_X)
                if r != "ok":
                    raise SystemExit(f"{titre} : {r}")
            r = await pg.evaluate(JS_QR, [f"{qrweb}/fiche{f['code']}.png", QR_PROF if corr else QR_ELEVE])
            if r != "ok":
                raise SystemExit(f"{titre}, QR : {r}")
            r = await pg.evaluate(JS_SANS_LOGO)
            if r != "ok":
                raise SystemExit(f"{titre}, logos : {r}")
            # la mesure se fait à la largeur imprimée (A4 moins les 2 × 8 mm de l'outil)
            await pg.set_viewport_size({"width": 733, "height": 1062})
            await pg.emulate_media(media="print")
            r = await pg.evaluate(JS_TITRE)
            if r != "ok":
                raise SystemExit(f"{titre}, titre : {r}")
            r = await pg.evaluate(JS_PIED, PIED_CORRECTION if corr else PIED_LIVRET)
            if r != "ok":
                raise SystemExit(f"{titre}, pied : {r}")
            await pg.wait_for_timeout(600)
            # marges : celles de la feuille de l'outil (@page 8 mm), comme un professeur
            # qui clique sur Imprimer
            await pg.pdf(path=str(sortie), format="A4", print_background=True, prefer_css_page_size=True)
            await pg.close()
            print(f"   {titre}")

        couv = dict(carte=ex["carte"], sur=niv["couv"]["sur"], titre=niv["couv"]["titre"], accroche=niv["couv"]["accroche"], intro=textes["intro"],
                    sommaire=[[f["code"], f["t"], f["resume"]] for f in niv["fiches"]],
                    prof=dict(PROF, dit=corr["dit"]) if corr else None)
        await pdf_html(f"{base}{BASE_WEB}/couverture.html", tmp / "couverture.pdf", JS_COUV, couv,
                       css=[CSS_PROF if corr else None])
        await pdf_html(f"{base}{BASE_WEB}/exemple.html", tmp / "exemple.pdf", JS_PAGE_EXEMPLE,
                       donnees_page2(ex, textes))
        for i, f in enumerate(niv["fiches"]):
            await pdf_fiche(f, tmp / f"fiche{i}.pdf")
        d = niv["dos"]
        unite = None
        if d.get("unite"):
            # l'unité commune résolue (dos du Deuxième tour 3) : dessinée par l'outil, comme la page 2
            pg = await page_outil(d["unite"] + "&print=statement")
            ux = await pg.evaluate(JS_EXEMPLE)
            await pg.close()
            if "erreur" in ux or ux["barres"]["mode"] != "unite":
                raise SystemExit("l'exemple de l'unité commune n'est pas une unité commune")
            v, mots = ux["valeurs"], ux["mots"]
            ordre = sorted(range(3), key=lambda i: v[i])
            unite = dict(carte=ux["carte"], etapes=ux["etapes"], cle=ux["cle"],
                         indices=f"<b>Total&nbsp;: {ux['total']} jetons.</b><br>" + "<br>".join(f"<q>{i}</q>" for i in ux["indices"]),
                         fin="L" + ", ".join(f"la tache {mots[i]} cache <b>{v[i]}</b> jetons" for i in ordre)[1:]
                             + ".<br>" + "&nbsp;✓&nbsp;; ".join(_verifs(ux)) + "&nbsp;✓")
            AUTRES_EXEMPLES["unite commune"] = ux["cle"]
        rappel, cles_rappel = None, []
        if d.get("rappel"):
            # les cartes de rappel (03/10/2026) : la série de chaque adresse dans l'outil, 4 par page,
            # énoncé ou correction comme les fiches de CE livret (« ? » ou lettre) ; on garde les
            # dessins des n premières cases
            svgs = []
            for rp in d["rappel"]["cartes"]:
                q = rp["q"] + f"&cards={rp['n']}&layout=4&unknown=" + ("letter" if corr and corr["lettre"] else "question")
                q += f"&print={'correction' if corr or rp['corrige'] else 'statement'}"
                pg = await page_outil(q)
                r = await pg.evaluate(JS_RAPPEL, rp["n"])
                await pg.close()
                if "erreur" in r:
                    raise SystemExit(f"cartes de rappel du livret « {niv['sortie']} » : {r['erreur']}")
                svgs += [dict(svg=x, titre=rp["titre"]) for x in r["svgs"]]
                if rp["corrige"]:
                    AUTRES_EXEMPLES["exemple corrigé du dos"] = r["cles"][0]
                else:
                    cles_rappel += r["cles"]
            rappel = dict(dit=d["rappel"]["dit"], cartes=svgs)
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/serie-{s}.png"] for nom, desc, s in d["series"]], unite=unite,
                   rappel=rappel, univers=f"{qrweb}/univers.png", suite=d["suite"])
        await pdf_html(f"{base}{BASE_WEB}/dos.html", tmp / "dos.pdf", JS_DOS, dos)
        await nav.close()
    return ex["cle"], cles, cles_rappel

def ordre_des_pages(niv, tmp):
    fiches = [tmp / f"fiche{i}.pdf" for i in range(len(niv["fiches"]))]
    if len(fiches) != 5:
        raise SystemExit(f"{len(fiches)} pages de fiches au lieu de 5")
    milieu = fiches[:]
    milieu.insert(PLACE_EXEMPLE - 2, tmp / "exemple.pdf")
    return [tmp / "couverture.pdf"] + milieu + [tmp / "dos.pdf"]

def assemble(niv, tmp, sortie):
    """Assemble les 8 pages, puis impose les 2 feuilles A3.

    IMPORTANT : on passe par pikepdf et `add_overlay`, qui place chaque page comme un
    Form XObject. Avec une simple translation de contenu (pypdf merge_transformed_page),
    les DÉGRADÉS ne suivent pas (bug vu sur le livret du monde 1 le 17/09/2026).
    """
    import pikepdf
    A4W, A4H = 595.276, 841.890
    src, pages = [], []
    for f in ordre_des_pages(niv, tmp):
        d = pikepdf.open(str(f))
        if len(d.pages) != 1:
            raise SystemExit(f"{f.name} : {len(d.pages)} pages au lieu d'une")
        src.append(d); pages.append(d.pages[0])
    if len(pages) != 8:
        raise SystemExit(f"{len(pages)} pages au lieu de 8")
    livret = pikepdf.Pdf.new()
    for p in pages:
        page = livret.add_blank_page(page_size=(A4W, A4H))
        pikepdf.Page(page).add_overlay(p, pikepdf.Rectangle(0, 0, A4W, A4H))
    livret.save(str(RACINE / "outils" / f"{sortie}.pdf"))
    a3 = pikepdf.Pdf.new()
    for g, d in [(8, 1), (2, 7), (6, 3), (4, 5)]:   # imposition d'un cahier de 8 pages
        feuille = a3.add_blank_page(page_size=(2 * A4W, A4H))
        for idx, tx in ((g, 0.0), (d, A4W)):
            pikepdf.Page(feuille).add_overlay(pages[idx - 1], pikepdf.Rectangle(tx, 0, tx + A4W, A4H))
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

CARTES_JSON = ICI / "cartes.json"
# les exemples qui ne sont pas en page 2 (l'unité commune du dos du Deuxième tour 3) : rendus au
# passage, relus par controle_global
AUTRES_EXEMPLES = {}

def ecrire_cartes(nom, cle_ex, reference, rappel=()):
    """cartes.json : pour chaque livret, l'exemple, les 20 cartes des fiches et les cartes de
    rappel du dos (03/10/2026), en « total + valeurs triées » (la même clé que le contrôle
    ci-dessus)."""
    tout = json.loads(CARTES_JSON.read_text(encoding="utf-8")) if CARTES_JSON.exists() else {}
    # les livrets qui n'existent plus (« Le défi » le 30/09, les trois « Deuxième tour » le 03/10)
    # quittent le fichier
    tout = {k: v for k, v in tout.items() if k in LIVRETS}
    tout[nom] = {"exemple": [cle_ex[0], json.loads(cle_ex[1])],
                 "rappel": [[c[0], json.loads(c[1])] for c in rappel],
                 "fiches": {t: [[c[0], json.loads(c[1])] for c in v] for t, v in reference.items()}}
    # une carte par ligne : le fichier se relit à l'œil
    j = lambda x: json.dumps(x, ensure_ascii=False, separators=(", ", ": "))
    lignes = ["{"]
    for i, (n, c) in enumerate(sorted(tout.items())):
        lignes.append(f' {j(n)}: {{"exemple": {j(c["exemple"])}, "rappel": {j(c.get("rappel", []))}, "fiches": {{')
        fs = list(c["fiches"].items())
        for k, (t, v) in enumerate(fs):
            lignes.append(f'  {j(t)}: {j(v)}' + ("," if k < len(fs) - 1 else ""))
        lignes.append(" }}" + ("," if i < len(tout) - 1 else ""))
    lignes.append("}")
    CARTES_JSON.write_text("\n".join(lignes) + "\n", encoding="utf-8")

def controle_global():
    """Sur les CINQ livrets de cartes.json (03/10/2026) : aucune carte ne revient, ni dans un
    autre livret ni dans une autre fiche (total et valeurs, quel que soit l'ordre des taches) —
    un élève qui fait le deuxième tour ne retrouve aucune carte déjà faite ; dans une fiche,
    jamais deux fois le même total ; aucun exemple (page 2, unité commune du dos) ni aucune carte
    de rappel du dos n'est une carte des fiches, et deux livrets n'ont jamais le même exemple."""
    tout = json.loads(CARTES_JSON.read_text(encoding="utf-8"))
    if not set(tout) <= set(LIVRETS):
        raise SystemExit(f"cartes.json : des livrets inconnus ({sorted(set(tout) - set(LIVRETS))})")
    cle = lambda c: (c[0], tuple(sorted(c[1])))
    ou = {}
    for nom, c in tout.items():
        for titre, cartes in c["fiches"].items():
            if len({k[0] for k in cartes}) != len(cartes):
                raise SystemExit(f"{titre} : deux cartes ont le même total")
            for k in cartes:
                ou.setdefault(cle(k), []).append((nom, titre))
    for k, lieux in ou.items():
        if len(lieux) > 1:
            raise SystemExit(f"une carte revient : {k} dans {lieux}")
    for nom, c in tout.items():
        for k in c.get("rappel", []):
            if cle(k) in ou:
                raise SystemExit(f"une carte de rappel du dos ({nom}) est une carte des fiches : {k} ({ou[cle(k)]})")
    exs = [cle(c["exemple"]) for c in tout.values()] + [cle([t, json.loads(v)]) for t, v in AUTRES_EXEMPLES.values()]
    for k in exs:
        if k in ou:
            raise SystemExit(f"un exemple est une carte : {k} ({ou[k]})")
    if len(set(exs)) != len(exs):
        raise SystemExit("deux livrets ont le même exemple")

def main():
    import tempfile
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    demandes = args or list(LIVRETS)
    inconnu = [a for a in demandes if a not in LIVRETS]
    if inconnu:
        raise SystemExit(f"livret inconnu : {', '.join(inconnu)} (au choix : {', '.join(LIVRETS)})")
    if "--eleve" in sys.argv and "--correction" in sys.argv:
        raise SystemExit("--eleve et --correction s'excluent (sans option : tous)")
    versions = [None] + CORRECTIONS
    if "--eleve" in sys.argv:
        versions = [None]
    if "--correction" in sys.argv:
        versions = CORRECTIONS
    if "--qr" in sys.argv:
        fabrique_qr(); print("QR codes régénérés.")
    if "--vignettes" in sys.argv:
        vignettes(); return
    srv = serveur()
    try:
        exemples = {}
        for nom in demandes:
            niv = LIVRETS[nom]
            print(f"— livret « {nom} »")
            reference = rappel_ref = None
            for corr in versions:
                sortie = niv["sortie"] + (corr["suffixe"] if corr else "")
                with tempfile.TemporaryDirectory() as d:
                    tmp = Path(d)
                    cle_ex, cles, cles_rappel = asyncio.run(rendre(niv, tmp, corr))
                    assemble(niv, tmp, sortie)
                # les cartes ne bougent pas d'une version à l'autre (« ? », correction, lettre)
                vues = {t.replace(" — Correction", ""): v for t, v in cles.items()}
                if reference is None:
                    reference = vues
                elif vues != reference:
                    raise SystemExit(f"{sortie} : les cartes diffèrent du livret de l'élève")
                # les cartes de rappel du dos non plus (03/10/2026)
                if rappel_ref is None:
                    rappel_ref = cles_rappel
                elif cles_rappel != rappel_ref:
                    raise SystemExit(f"{sortie} : les cartes de rappel diffèrent du livret de l'élève")
                exemples[nom] = cle_ex
                for s in ("", "_a_plier"):
                    compresse(RACINE / "outils" / f"{sortie}{s}.pdf")
                print(f"   Fait : outils/{sortie}.pdf et outils/{sortie}_a_plier.pdf")
            # l'exemple n'est aucune carte du livret : ni le même total avec les mêmes valeurs,
            # quel que soit l'ordre des taches (le premier choix du livret 2 était la carte 3 de
            # la fiche 15, mot pour mot, et une comparaison qui tenait compte de l'ordre l'avait
            # laissé passer)
            if any(cle_ex == c[:2] for v in reference.values() for c in v):
                raise SystemExit(f"l'exemple du livret « {nom} » est une carte du livret")
            # lot E5 : les cartes rendues sont aussi écrites dans cartes.json, que
            # tests/livret-splat-enquete.test.mjs relit — le contrôle ne dépend plus du seul
            # fait d'avoir lancé ce script jusqu'au bout (l'exemple du livret 2 du lot E4,
            # 7, 9, 18, total 34, était la carte 4 de la fiche 18 et était passé)
            ecrire_cartes(nom, cle_ex, reference, rappel_ref or [])
        controle_global()
    finally:
        srv.shutdown()

if __name__ == "__main__":
    main()
