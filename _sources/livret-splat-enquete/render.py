#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Régénère les deux livrets de l'Enquête (8 pages chacun) à partir du site lui-même : « SPLAT! Enquête »
(monde 3, fiches 10 à 14) et « SPLAT! Grande enquête » (monde 4, fiches 15 à 19) — un livret par
monde depuis le lot E5 (23/09/2026).

    python3 render.py                    (les QUATRE livrets, élève et corrections)
    python3 render.py additif            (un seul livret : additif | multiplicatif
                                          | additif_defi | multiplicatif_defi | rebondit)
    python3 render.py --qr               (en refabriquant d'abord les QR codes)
    python3 render.py --eleve            (seulement les livrets de l'élève)
    python3 render.py --correction       (seulement les livrets de correction)

Produit, à la racine du dépôt, pour chaque livret :
    outils/livret_splat_enquete_additif.pdf            8 pages A4, ordre de lecture
    outils/livret_splat_enquete_additif_a_plier.pdf    4 pages A3 paysage, imposées
et ses deux livrets corrigés (pour la classe comme pour la maison), mêmes 8 pages, même pliage, mêmes cartes
à la même place :
    outils/livret_splat_enquete_additif_correction.pdf          inconnue « ? »
    outils/livret_splat_enquete_additif_correction_lettre.pdf   inconnue en lettre
    (et chacun son …_a_plier.pdf) ; idem pour « multiplicatif ».
Et, depuis le 23/09/2026, les deux livrets « Le défi » (mêmes fiches, mêmes titres, totaux de
50 à 100) : outils/livret_splat_enquete_additif_defi.pdf, …_multiplicatif_defi.pdf, et leurs
corrigés, sur le même modèle.
Et, depuis le 25/09/2026, le 3e livret du monde 3, « SPLAT! L'enquête rebondit » (fiches 20 à 24 :
taches répétées, puis sans total) : outils/livret_splat_enquete_rebondit.pdf et ses deux corrigés.

LES PAGES. Couverture, un exemple résolu, les cinq fiches du livret (4 cartes par page),
le dos. Une fiche = une étape de la carte des mondes = une étoile (fiches 10 à 19) ; le QR
d'une fiche ouvre sa série en ligne : les mêmes 4 cartes, avec l'étoile de l'étape.

LES FICHES ne sont PAS redessinées ici : elles sont rendues par l'outil du site
(outils/splat.html, réglage « 4 par page » du monde 3) avec les graines de la carte des
mondes (outils/splat_univers.html, ENQ_FICHES), et le QR est ajouté dans le bandeau juste
avant l'impression. L'EXEMPLE RÉSOLU non plus : la carte et ses cinq schémas sont ceux du
bouton « Voir le schéma » de l'outil (schéma vide, rempli, regroupé, ordonné, résolution),
au profil d'impression de la correction, sur une carte qui n'est PAS dans le livret ; les
légendes sont écrites À PARTIR DE LA CARTE rendue (elles ne peuvent pas mentir sur ses
nombres).

LIVRETS DE CORRECTION : la correction imprimée de l'outil (print=correction), 4 par page,
chaque carte à la même place que sur la fiche de l'élève ; en lettre, les mêmes graines
avec unknown=letter (les nombres ne bougent pas, vérifié carte par carte au rendu). La
couverture reçoit le bandeau « Correction » et la ligne « Livret corrigé » (jamais « professeur » :
le corrigé peut être donné aux élèves, 23/09/2026), la boîte du QR dit « Je rejoue ces cartes
en ligne » ; l'exemple résolu et le dos ne changent pas.

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

# Les dix fiches, telles que définies dans outils/splat_univers.html (ENQ_FICHES) : les
# graines du lot E0. Si une graine change là-bas, la reporter ici ET dans la page courte
# splat/enquete/livret/index.html, puis relancer avec --qr (un test épingle les trois).
ENQ_COMMUN = "&cards=4&unknown=question"
NOTE = "Reformule l’indice avant de dessiner ton schéma."
F10 = "mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=30&seed=339"
F11 = "mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=0&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=30&seed=1071"
F12 = "mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=15&totalMax=50&seed=918"
F13 = "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=290"
F14 = "mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=950"
F15 = "mode=C&splats=2&clues=SENTENCE&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=40&seed=1372"
F16 = "mode=C&splats=2&clues=SENTENCE&mul=0&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=40&seed=1343"
F17 = "mode=C&splats=2&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=15&totalMax=50&seed=405"
F18 = "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=1313"
F19 = "mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&seed=537"

def fiche(n, t, q, resume, note=False, code=None):
    """code : ce que porte le QR de la fiche (« 12 », ou « 12d » pour le livret Le défi)."""
    return dict(n=n, t=t, q=q, resume=resume, note=note, code=code or str(n))

# Les fiches de chaque livret : n = numéro de fiche = numéro d'étape de la carte des mondes.
FICHES_ADD = [
    fiche(10, "De plus que", F10, "Deux taches, un indice&nbsp;: de plus."),
    fiche(11, "De moins que", F11, "Le même jeu, à l'envers.", note=True),
    fiche(12, "Plus ou moins", F12, "L'indice change à chaque carte."),
    fiche(13, "Trois taches en chaîne", F13, "Deux indices qui s'enchaînent."),
    fiche(14, "Le défi additif", F14, "Trois taches, et des jetons visibles."),
]
FICHES_MUL = [
    fiche(15, "Fois plus", F15, "L'indice multiplie."),
    fiche(16, "Fois moins", F16, "L'indice partage.", note=True),
    fiche(17, "Les quatre opérations", F17, "Plus, moins, fois, divisé."),
    fiche(18, "Trois taches, 4 opérations", F18, "Trois taches en chaîne."),
    fiche(19, "Le grand défi", F19, "Trois taches, jetons visibles, tout mélangé."),
]

# Le 3e livret du monde 3, « SPLAT! L'enquête rebondit » (25/09/2026) : les fiches 20 à 24 du lot
# « fiches 20-34 » (24/09/2026, graines validées sur planches), EXACTEMENT les adresses de
# splat-enquete-fiches-20-24-adresses.md — des taches de même couleur (20, 21), des enquêtes sans
# total (22, 23 : un rapport et un écart sur la même paire de taches), puis les deux mélangés
# (24 : « Sans total » et « Taches répétées » cochées ensemble, lot E-melange). La fiche 23 porte
# la consigne « Reformule » (note=). Préfixe R (et non F) : les fiches 10 à 19 restent seules
# épinglées sur la carte des mondes (ENQ_FICHES) ; 20 à 24 y entrent au lot « six mondes ».
R20 = "mode=C&splats=2&repeat=3&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=172"
R21 = "mode=C&splats=2&repeat=3&clues=SENTENCE&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&seed=34"
R22 = "mode=C&splats=2&noTotal=1&clues=SENTENCE&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=3"
R23 = "mode=C&splats=2&noTotal=1&clues=SENTENCE&mul=0&div=1&add=0&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=9"
R24 = "mode=C&splats=3&structure=MIX&repeat=3&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=30&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&noTotal=1&seed=2187"
FICHES_REB = [
    fiche(20, "Des taches répétées", R20, "Même couleur, même nombre."),
    fiche(21, "Répétées, fois plus ou moins", R21, "L'indice multiplie ou partage."),
    fiche(22, "Sans total", R22, "Deux indices, et pas de total."),
    fiche(23, "Sans total, à retourner", R23, "Deux indices à retourner.", note=True),
    fiche(24, "Le défi qui rebondit", R24, "Tout mélangé, et des jetons visibles."),
]

# ---------------------------------------------------------------------------
# LES LIVRETS « LE DÉFI » (23/09/2026) — le même monde, des cartes plus dures, comme « Le défi »
# du monde 2 et les niveaux Avancé / Expert du monde 1 : MÊMES fiches (10 à 14, 15 à 19), mêmes
# titres, mêmes sortes de cartes, mêmes consignes, et des TOTAUX DE 50 À 100. Chaque fiche garde
# son étape (parcours=enqN) : réussir la série plus dure allume la même étoile (décision déjà
# prise pour les mondes 1 et 2). Les réglages ne changent que là où il le faut :
#   · totalMin=50&totalMax=100 partout ;
#   · deltaMax=30 (deux taches) ou 25 (trois taches) : des écarts petits et grands, jamais multiples de 5 ;
#   · fiches 14 et 19 : visibleMin=2&visibleMax=3 — deux ou trois paquets de jetons visibles à
#     additionner avant de retirer ;
#   · les indices « fois » restent × 2, × 3, × 4 (le générateur n'en connaît pas d'autres).
# Les graines ne sont PAS tirées au hasard : elles sont choisies (script de tri hors dépôt, qui
# rejoue exactement generate() dans l'outil) pour que CHAQUE carte passe les règles du défi :
#   1. aucun nombre à sous-entendu (69, 88, 96), ni affiché, ni dans les calculs de la correction,
#      ni dans ce que l'élève calcule en chemin (jetons cachés = total − paquets visibles, deux
#      paquets ensemble, deux taches ensemble) — un premier tri laissait passer 80 − 11 = 69 ;
#   2. jamais deux taches de même valeur ;
#   3. la valeur de « ? » (la tache de référence) : 6 au moins, jamais un multiple de 5 — la
#      division finale ne se devine pas ;
#   4. les écarts « de plus / de moins » : 4 au moins, jamais un multiple de 5 ;
#   5. un schéma qui se dessine à la main : 10 « ? » au plus, 8 au plus dans une barre ;
#   6. paquets visibles (14 et 19) : 2 ou 3, différents, sans paquet de 1, 8 jetons au moins,
#      et jamais un paquet qui vaut autant qu'une tache (il soufflerait la réponse) ;
#   7. sur une fiche : 4 totaux différents, étalés (le plus grand ≥ 80, le plus petit ≤ 70),
#      jamais deux fois la même paire de couleurs, tache de référence de 3 couleurs au moins,
#      les types de la fiche tous présents (12 : « de plus » ET « de moins » ; 14 et 19 : chaîne
#      ET pivot ; 15, 16 : × 2, × 3 et × 4 ; 17 : les quatre opérations ; 18, 19 : les quatre
#      opérations sur la fiche ; un « de moins » ou « fois moins » à reformuler sur 12 à 14,
#      17 à 19 ; un écart de 15 au moins sur les fiches qui en ont) ;
#   8. aucune carte des livrets de la classe, des exemples ni d'une autre fiche du défi (total et
#      valeurs, quel que soit l'ordre des taches), et aucun total répété dans un livret.
# Si une graine change : la reporter dans la page courte (ENQ_DEFI), relancer avec --qr, et
# relire cartes.json (un test relit les règles 2, 3, 7 et 8 sur les cartes rendues).
D10 = "mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&seed=21941"
D11 = "mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=0&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&seed=80891"
D12 = "mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&seed=83103"
D13 = "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=25&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&seed=41720"
D14 = "mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=25&visibleMin=2&visibleMax=3&totalMin=50&totalMax=100&seed=743151"
D15 = "mode=C&splats=2&clues=SENTENCE&mul=1&div=0&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&seed=36483"
D16 = "mode=C&splats=2&clues=SENTENCE&mul=0&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&seed=98074"
D17 = "mode=C&splats=2&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&seed=44420"
D18 = "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=25&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&seed=59204"
D19 = "mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=25&visibleMin=2&visibleMax=3&totalMin=50&totalMax=100&seed=429473"

FICHES_ADD_DEFI = [
    fiche(10, "De plus que", D10, "Deux taches, un indice&nbsp;: de plus.", code="10d"),
    fiche(11, "De moins que", D11, "Le même jeu, à l'envers.", note=True, code="11d"),
    fiche(12, "Plus ou moins", D12, "L'indice change à chaque carte.", code="12d"),
    fiche(13, "Trois taches en chaîne", D13, "Deux indices qui s'enchaînent.", code="13d"),
    fiche(14, "Le défi additif", D14, "Trois taches, et des paquets visibles.", code="14d"),
]
FICHES_MUL_DEFI = [
    fiche(15, "Fois plus", D15, "L'indice multiplie.", code="15d"),
    fiche(16, "Fois moins", D16, "L'indice partage.", note=True, code="16d"),
    fiche(17, "Les quatre opérations", D17, "Plus, moins, fois, divisé.", code="17d"),
    fiche(18, "Trois taches, 4 opérations", D18, "Trois taches en chaîne.", code="18d"),
    fiche(19, "Le grand défi", D19, "Trois taches, paquets visibles, tout mélangé.", code="19d"),
]

# Les séries infinies du dos : pas de graine, huit cartes nouvelles à chaque ouverture, en
# mode élève sans étape (rien n'est enregistré, l'élève s'entraîne). Leurs QR passent par
# la page courte (?s=1…6) : une adresse de 45 caractères au lieu de 200, donc un QR aux
# modules deux fois plus gros, qui se lit encore photocopié — et une série qu'on pourra
# retoucher sans réimprimer un seul livret. Les réglages sont ceux des fiches, sans graine.
SERIES = {
    1: "mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=30",
    2: "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    3: "mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60",
    4: "mode=C&splats=2&clues=SENTENCE&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=10&totalMax=40",
    5: "mode=C&splats=2&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=15&totalMax=50",
    6: "mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60",
    # les livrets « Le défi » (23/09/2026) : les réglages de leurs fiches, sans graine
    7: "mode=C&splats=2&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100",
    8: "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=25&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100",
    9: "mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=0&div=0&add=1&sub=1&deltaMax=25&visibleMin=2&visibleMax=3&totalMin=50&totalMax=100",
    10: "mode=C&splats=2&clues=SENTENCE&mul=1&div=1&add=0&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100",
    11: "mode=C&splats=2&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100",
    12: "mode=C&splats=3&structure=MIX&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=25&visibleMin=2&visibleMax=3&totalMin=50&totalMax=100",
    # « L'enquête rebondit » (25/09/2026) : les réglages de ses fiches, sans graine, les quatre
    # opérations. La page courte les servira au lot « six mondes » (?s=13 à 15).
    13: "mode=C&splats=2&repeat=3&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60",
    14: "mode=C&splats=2&noTotal=1&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60",
    15: "mode=C&splats=3&structure=MIX&repeat=3&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=30&visibleMin=1&visibleMax=3&totalMin=20&totalMax=60&noTotal=1",
}
SERIE_CARTES = 8

# L'exemple (couverture et page 2) : une carte à deux taches qui n'est PAS dans le livret,
# choisie le 22/09/2026 — la même paire de taches (noire, bleue) dans les deux livrets :
# « 4 jetons de plus » (8 et 12, total 20), puis « 3 fois plus » (6 et 18, total 24).
# Aucun nombre à sous-entendu. Réglages : ceux de la première fiche du livret, une carte.
# ATTENTION : « 3 fois plus, 5 et 15, total 20 » (graine 83, premier choix) est la carte 3
# de la fiche 15, mot pour mot — render.py compare maintenant total et valeurs, sans
# tenir compte de l'ordre des taches, et refuse un exemple qui serait une carte du livret.
# 23/09/2026, remarque de Claire : avec deux taches, le schéma regroupé et le schéma ordonné
# sont forcément identiques (les « ? » sont déjà d'un côté, le nombre de l'autre) — l'étape 4
# n'apprenait rien. Les exemples ont donc TROIS taches en chaîne, la noire en référence :
#   livret 1 (graine 4642) : bleue = noire + 4, orange = bleue + 3 → 5, 9, 12, total 26 ;
#     regroupé ? ? 4 ? 7, ordonné ? ? ? 4 7 ;
#   livret 2 (graine 128029, lot E5) : bleue = noire + 2, orange = 3 × bleue → 5, 7, 21,
#     total 33 ; regroupé ? ? 2 ? ? ? 6, ordonné ? ? ? ? ? 2 6. ATTENTION : la graine 2340 du
#     lot E4 (bleue = noire + 2, orange = 2 × bleue → 7, 9, 18, total 34) était la carte 4
#     de la fiche 18 aux couleurs près (violette = rouge + 2, noire = 2 × violette) : écartée
#     le 23/09 au soir. Au livret 2, la chaîne COMMENCE par « de
#     plus » : avec « fois plus » d'abord, le seul nombre resterait au bout et l'étape 4
#     redeviendrait identique à la 3.
# Anciens exemples à deux taches : graines 116 et 402 (et 83, la carte 3 de la fiche 15).
EX_ADD = "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=0&div=0&add=1&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=15&totalMax=40&cards=1&unknown=question&seed=4642"
EX_MUL = "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=1&div=0&add=1&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=15&totalMax=40&cards=1&unknown=question&seed=128029"
# Les exemples des livrets « Le défi » (23/09/2026) : la même chaîne noire → bleue → orange, la
# noire en référence, au calibre du défi (total de 50 à 100) ; ni une carte des quatre livrets,
# ni l'exemple d'un autre livret.
#   Monde 3, Le défi (graine 49641) : bleue = noire + 13, orange = bleue + 22 → 12, 25, 47,
#     total 84 ; 13 + 35 = 48, 84 − 48 = 36, 36 ÷ 3 = 12.
#   Monde 4, Le défi (graine 211206) : bleue = noire + 7, orange = 2 × bleue → 13, 20, 40,
#     total 73 ; 7 + 14 = 21, 73 − 21 = 52, 52 ÷ 4 = 13.
EXD_ADD = "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=0&div=0&add=1&sub=0&deltaMax=25&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&cards=1&unknown=question&seed=49641"
EXD_MUL = "mode=C&splats=3&structure=CHAIN&clues=SENTENCE&mul=1&div=0&add=1&sub=0&deltaMax=25&visibleMin=0&visibleMax=0&totalMin=50&totalMax=100&cards=1&unknown=question&seed=211206"

# L'exemple de « L'enquête rebondit » (25/09/2026) : une carte à TROIS taches dont une couleur
# répétée, hors des fiches 20 à 24 — la noire en référence (une tache), deux bleues « 7 jetons
# de plus » (graine 82 : 8, 15, 15, total 38). La couleur répétée est la PLUS GRANDE : son écart
# revient deux fois, le schéma regroupé ? ? 7 ? 7 se range en ? ? ? 7 7 et l'étape 4 apprend
# quelque chose (avec la noire répétée, regroupé et ordonné seraient identiques, la remarque de
# Claire du 23/09 sur les exemples à deux taches) ; textes_exemple refuse ce cas.
EX_REB = "mode=C&splats=2&repeat=2&clues=SENTENCE&mul=0&div=0&add=1&sub=0&deltaMax=10&visibleMin=0&visibleMax=0&totalMin=15&totalMax=45&cards=1&unknown=question&seed=82"

# La page « exemple résolu » : 2e page du livret (lue avant la fiche 10).
PLACE_EXEMPLE = 2

LIVRETS = {
    "additif": dict(
        sortie="livret_splat_enquete_additif",
        fiches=FICHES_ADD,
        exemple=dict(query=EX_ADD, op="ADD"),
        couv=dict(sur="Mon livret · Monde 3", titre="Enquête",
                  accroche="Un indice relie les taches…<br>à toi de mener l'enquête&nbsp;!"),
        dos=dict(
            series=[("Deux taches", "De plus ou de moins, comme les fiches&nbsp;10 à&nbsp;12.", 1),
                    ("Trois taches", "En chaîne, comme la fiche&nbsp;13.", 2),
                    ("Le défi additif", "Avec des jetons visibles, comme la fiche&nbsp;14.", 3)],
            suite="Continue avec le monde&nbsp;4, <b>SPLAT! Grande enquête</b>&nbsp;: fois plus, fois moins, et les quatre opérations&nbsp;!",
            mini=["?"], ecart="4",
            reformule="En haut du schéma, la <b>tache de référence</b>&nbsp;: la plus petite. Quand l'indice dit <q>de moins que</q>, retourne-le&nbsp;: <q>la noire a 4 jetons de moins que la bleue</q>, c'est <q>la bleue a 4 jetons de plus que la noire</q>."),
    ),
    "multiplicatif": dict(
        sortie="livret_splat_enquete_multiplicatif",
        fiches=FICHES_MUL,
        exemple=dict(query=EX_MUL, op="MUL"),
        couv=dict(sur="Mon livret · Monde 4", titre="Grande enquête",
                  accroche="Fois plus, fois moins…<br>et les quatre opérations&nbsp;!"),
        dos=dict(
            series=[("Fois plus, fois moins", "Deux taches, comme les fiches&nbsp;15 et&nbsp;16.", 4),
                    ("Les quatre opérations", "Deux taches, comme la fiche&nbsp;17.", 5),
                    ("Le grand défi", "Trois taches et des jetons visibles, comme la fiche&nbsp;19.", 6)],
            suite="Va voir le monde&nbsp;5, <b>SPLAT! Équations</b>, pour résoudre sans schéma en barres&nbsp;!",
            mini=["?", "?", "?"], ecart=None,
            reformule="En haut du schéma, la <b>tache de référence</b>&nbsp;: la plus petite. Quand l'indice dit <q>fois moins</q>, retourne-le&nbsp;: <q>la noire a 3 fois moins de jetons que la bleue</q>, c'est <q>la bleue a 3 fois plus de jetons que la noire</q>."),
    ),
}
# Les livrets « Le défi » (23/09/2026) : les MÊMES pages que le livret de la classe du même monde
# (même couverture, même exemple résolu pas à pas, même dos), au calibre du défi : sur-titre
# « Mon livret · Monde 3 · Le défi », accroche « … et des totaux jusqu'à 100 ! », l'exemple
# EXD_*, les séries 7 à 12 au dos, le QR de chaque fiche vers ?f=10d … 19d.
def _defi(nom, sortie, fiches, exemple, sur, accroche, series):
    base = LIVRETS[nom]
    return dict(sortie=sortie, fiches=fiches, exemple=exemple,
                couv=dict(base["couv"], sur=sur, accroche=accroche),
                dos=dict(base["dos"], series=series))

LIVRETS["additif_defi"] = _defi(
    "additif", "livret_splat_enquete_additif_defi", FICHES_ADD_DEFI, dict(query=EXD_ADD, op="ADD"),
    "Mon livret · Monde 3 · Le défi", "Un indice relie les taches…<br>et des totaux jusqu'à 100&nbsp;!",
    [("Deux taches", "De plus ou de moins, comme les fiches&nbsp;10 à&nbsp;12.", 7),
     ("Trois taches", "En chaîne, comme la fiche&nbsp;13.", 8),
     ("Le défi additif", "Avec des paquets visibles, comme la fiche&nbsp;14.", 9)])
LIVRETS["multiplicatif_defi"] = _defi(
    "multiplicatif", "livret_splat_enquete_multiplicatif_defi", FICHES_MUL_DEFI, dict(query=EXD_MUL, op="MUL"),
    "Mon livret · Monde 4 · Le défi", "Fois plus, fois moins…<br>et des totaux jusqu'à 100&nbsp;!",
    [("Fois plus, fois moins", "Deux taches, comme les fiches&nbsp;15 et&nbsp;16.", 10),
     ("Les quatre opérations", "Deux taches, comme la fiche&nbsp;17.", 11),
     ("Le grand défi", "Trois taches et des paquets visibles, comme la fiche&nbsp;19.", 12)])
# Le 3e livret du monde 3 (25/09/2026), même fabrication que les deux premiers : couverture,
# exemple résolu, fiches 20 à 24, dos. Le monde 3 est en trois parties depuis le 24/09 (lot « six
# mondes ») : « Partie 3 » au sur-titre. Au dos, la suite est le monde 4, SPLAT! Système.
LIVRETS["rebondit"] = dict(
    sortie="livret_splat_enquete_rebondit",
    fiches=FICHES_REB,
    exemple=dict(query=EX_REB, op="REPET"),
    couv=dict(sur="Mon livret · Monde 3 · Partie 3", titre="L'enquête rebondit",
              accroche="Des taches de même couleur…<br>puis des enquêtes sans total&nbsp;!"),
    dos=dict(
        series=[("Taches répétées", "Même couleur, même nombre, comme les fiches&nbsp;20 et&nbsp;21.", 13),
                ("Sans total", "Deux indices, pas de total, comme les fiches&nbsp;22 et&nbsp;23.", 14),
                ("Le défi qui rebondit", "Tout mélangé, comme la fiche&nbsp;24.", 15)],
        suite="Continue avec le monde&nbsp;4, <b>SPLAT! Système</b>&nbsp;: plusieurs plateaux, un total pour chacun… compare-les&nbsp;!",
        mini=["?", "?", "?"], ecart=None,
        taches="Chaque tache a sa couleur, écrite dessus. Les taches de <b>même couleur</b> cachent <b>le même nombre de jetons</b>&nbsp;; deux couleurs, jamais le même&nbsp;: c'est l'<b>indice</b> qui les relie.",
        reformule="<b>Sans total</b>, deux indices parlent des mêmes taches&nbsp;: <q>la bleue a 3 fois plus de jetons que la noire</q> et <q>la bleue a 18 jetons de plus que la noire</q>. Les deux barres de la bleue sont égales&nbsp;: les deux «&nbsp;?&nbsp;» en plus valent 18, chaque «&nbsp;?&nbsp;» vaut 9."),
)

def lien_fiche(n):
    """Le QR d'une fiche : la page courte ?f=N, qui ouvre EXACTEMENT le lien « Le jeu
    de l'élève » de l'étape N sur la carte des mondes (les mêmes cartes, l'étoile de
    l'étape, la même empreinte de reprise). Pour le livret Le défi, ?f=Nd : les cartes
    du défi, et la MÊME étoile (parcours=enqN)."""
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
  const sc = mk(); renderCardIntoSvg(sc, card, 'statement');
  const fond = sc.querySelector('rect'); if (fond && fond.getAttribute('width') === '1600') fond.remove();
  const carte = sc.innerHTML; sc.remove();
  const prof = getRelationCorrectionPrintProfile(card);
  const q = getNumberedDisplayVarChar(card) === '?';
  const dessins = [g => drawRelationSituationSchema(g, card, {filled:false, ...prof}),
                   g => drawRelationSituationSchema(g, card, {filled:true, ...prof}),
                   g => drawRelationGroupedSchema(g, card, {...prof, hideGroupedEquation:q}),
                   g => drawRelationOrderedSchema(g, card, {solved:false, ...prof}),
                   g => drawRelationOrderedSchema(g, card, {solved:true, ...prof})];
  const etapes = dessins.map(d => {
    const sv = mk(); const g = document.createElementNS(NS, 'g'); sv.appendChild(g); d(g);
    const b = g.querySelector('#btnEquabarSolve'); if (b) b.remove();
    const bb = g.getBBox(); const r = {svg: sv.innerHTML, h: Math.ceil(bb.y + bb.height - 612) + 8}; sv.remove(); return r;
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
  return {carte: carteRes, etapes, total: card.total, visibles: card.visible, valeurs: rel.hiddenValues, ref: rel.refIndex,
          mots: rel.hiddenValues.map((_, i) => mot(i)), indices: card._inv.indices,
          relations: rel.relations, eq: rel.equation, structure: rel.structure,
          cle: [card.total, JSON.stringify(rel.hiddenValues.slice().sort((a, b) => a - b))]};
}"""

JS_COUV = """(d) => {
  const set = (sel, svg, vb) => { const e = document.querySelector(sel); if (!e) return false; e.innerHTML = svg; if (vb) e.setAttribute('viewBox', vb); return true; };
  if (!set('svg.ex-carte', d.carte)) return 'pas de place pour la carte';
  if (!set('svg.ex-vide', d.vide, d.vbVide)) return 'pas de place pour le schéma vide';
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
  const et = document.querySelectorAll('.etapes .et');
  if (et.length !== 5) return et.length + ' étapes au lieu de 5';
  et.forEach((li, i) => {
    const s = li.querySelector('svg.dessin'); s.innerHTML = d.etapes[i].svg;
    s.setAttribute('viewBox', '50 612 1500 ' + d.etapes[i].h);
    li.querySelector('.leg').innerHTML = d.legendes[i];
  });
  const f = document.querySelector('.fin'); if (!f) return 'pas de conclusion'; f.innerHTML = d.fin;
  return 'ok';
}"""

JS_DOS = """(d) => {
  const box = document.querySelector('.niveaux');
  if (!box) return 'pas de bloc niveaux';
  box.innerHTML = d.niveaux.map(n =>
     '<div class="niv"><img src="' + n[2] + '" alt=""><span class="n">' + n[0] +
     '</span><span class="d">' + n[1] + '</span></div>').join('');
  const u = document.querySelector('.suite img'); if (u) u.setAttribute('src', d.univers);
  const s = document.querySelector('.suite p.t'); if (!s) return 'pas de texte « suite »'; s.innerHTML = d.suite;
  const r = document.querySelector('.lex .pr'); if (!r) return 'pas de ligne « référence »'; r.innerHTML = d.reformule;
  // « L'enquête rebondit » (25/09/2026) : la ligne des deux taches parle des taches de même couleur
  if (d.taches) {
    const t = document.querySelectorAll('.lex li')[1]; const sp = t && t.querySelectorAll(':scope > span')[1];
    if (!sp) return 'pas de ligne « taches »'; sp.innerHTML = d.taches;
  }
  const m = document.querySelectorAll('.mini-sch .r')[1]; if (!m) return 'pas de mini-schéma';
  m.innerHTML = '<em>bleue</em>' + d.mini.map(t => '<span class="q">' + t + '</span>').join('') + (d.ecart ? '<span class="v">' + d.ecart + '</span>' : '');
  // le mini-schéma est un vrai schéma en barres : chaque « ? » a exactement la largeur de la
  // case de la tache de référence, les cases d'une barre se touchent, et rien ne déborde
  const qs = [...document.querySelectorAll('.mini-sch .q')].map(e => e.getBoundingClientRect());
  if (qs.length !== 1 + d.mini.length) return 'mini-schéma : ' + qs.length + ' cases « ? »';
  if (qs.some(b => Math.abs(b.width - qs[0].width) > 0.3)) return 'mini-schéma : les cases « ? » n’ont pas toutes la même largeur';
  if (Math.abs(qs[1].left - qs[0].left) > 0.3) return 'mini-schéma : les deux barres ne partent pas du même bord';
  const cases = [...m.querySelectorAll('span')].map(e => e.getBoundingClientRect());
  // le bloc « Pour se souvenir » est agrandi d'un coup (zoom, lot 2 de la relecture du monde 1) :
  // les mesures sont faites dans l'espace agrandi, le chevauchement de 1,3 px des bordures aussi
  const Z = parseFloat(getComputedStyle(document.querySelector('.lex ul')).zoom) || 1;
  for (let i = 1; i < cases.length; i++)
    if (Math.abs(cases[i].left - (cases[i - 1].right - 1.3 * Z)) > 0.3 * Z) return 'mini-schéma : des cases de la barre ne se touchent pas';
  const ic = m.closest('.ic').getBoundingClientRect();
  if (cases[cases.length - 1].right > ic.right + 0.3) return 'mini-schéma : il déborde de sa colonne';
  // (« Mes fiches — je colorie l'étoile » a quitté le dos : relecture du monde 1, lot 2, 25/09/2026)
  return 'ok';
}"""

MOTS = {1: "une", 2: "deux", 3: "trois", 4: "quatre", 5: "cinq", 6: "six"}

def textes_exemple(ex, op):
    """Les textes de la couverture et de la page 2, écrits à partir de la carte que l'outil
    vient de dessiner : ils ne peuvent pas mentir sur les nombres de l'exemple.
    L'exemple est une CHAÎNE de trois taches partant de la tache de référence (23/09/2026) :
    chaque tache s'écrit « a × ? + b » par rapport à la référence, comme la barre de l'outil."""
    if op == "REPET":
        return textes_exemple_repet(ex)
    n = len(ex["valeurs"])
    if ex["visibles"] or n != 3 or len(ex["relations"]) != 2:
        raise SystemExit("l'exemple doit être une carte à trois taches, sans jeton visible")
    T, v, mots, ref = ex["total"], ex["valeurs"], ex["mots"], ex["ref"]
    # l'ordre de la chaîne : référence → t1 → t2
    ordre, rels = [ref], []
    while len(ordre) < n:
        r = [r for r in ex["relations"] if r["source"] == ordre[-1] and r["target"] not in ordre]
        if len(r) != 1:
            raise SystemExit("l'exemple doit être une chaîne qui part de la tache de référence")
        rels.append(r[0]); ordre.append(r[0]["target"])
    ops = [r["op"] for r in rels]
    if op == "ADD" and ops != ["ADD", "ADD"]:
        raise SystemExit(f"livret additif : deux indices « de plus », pas {ops}")
    if op == "MUL" and ops != ["ADD", "MUL"]:
        raise SystemExit(f"livret multiplicatif : « de plus » puis « fois plus », pas {ops}")
    # chaque tache = a × ? + b
    ab = {ref: (1, 0)}
    for r in rels:
        a0, b0 = ab[r["source"]]
        ab[r["target"]] = (a0, b0 + r["k"]) if r["op"] == "ADD" else (r["k"] * a0, r["k"] * b0)
    x = v[ref]
    for i, (a_, b_) in ab.items():
        assert v[i] == a_ * x + b_, (i, v[i], a_, b_, x)
    assert T == sum(v)
    A = sum(a_ for a_, _ in ab.values())
    nombres = [ab[i][1] for i in ordre if ab[i][1]]          # dans l'ordre des barres
    B = sum(nombres)
    t = {i: f"la tache {mots[i]}" for i in ordre}
    court = {i: (f"l'{mots[i]}" if mots[i][0] in "aeiouo" else f"la {mots[i]}") for i in ordre}
    q = "«&nbsp;?&nbsp;»"
    def nq(k): return f"{MOTS.get(k, k)} {q}" if k > 1 else f"un {q}"
    r0, t1, t2 = ordre
    (k1, k2) = rels[0]["k"], rels[1]["k"]
    phrase_t1 = f"{court[t1].capitalize()}&nbsp;: un {q} et {k1} de plus."
    if rels[1]["op"] == "ADD":
        phrase_t2 = (f"{court[t2].capitalize()}&nbsp;: {k2} de plus que {court[t1]}, donc un {q} et "
                     f"{k1}&nbsp;+&nbsp;{k2}&nbsp;=&nbsp;{ab[t2][1]}.")
        calc_t2 = f"{v[t1]} + {k2} = <b>{v[t2]}</b>"
    else:
        phrase_t2 = (f"{court[t2].capitalize()}&nbsp;: {MOTS.get(k2, k2)} fois {court[t1]}, donc "
                     f"{nq(ab[t2][0])} et {k2}&nbsp;×&nbsp;{k1}&nbsp;=&nbsp;{ab[t2][1]}.")
        calc_t2 = f"{k2} × {v[t1]} = <b>{v[t2]}</b>"
    somme = " et ".join([", ".join(str(b_) for b_ in nombres[:-1]), str(nombres[-1])]) if len(nombres) > 1 else str(nombres[0])
    plus = "&nbsp;+&nbsp;".join(str(b_) for b_ in nombres)
    vide = f"Une barre par tache. En haut, la <b>tache de référence</b>&nbsp;: la plus petite, ici {t[r0]}."
    rempli = f"La barre de {t[r0]}&nbsp;: un {q}. {phrase_t1} {phrase_t2} En tout&nbsp;: {T}."
    regroupe = f"Toutes les parties sur une seule barre&nbsp;: {nq(A)}, {somme} font {T}."
    ordonne = f"Je range les {q} d'un côté et les nombres connus de l'autre&nbsp;: on peut écrire l'équation."
    # une opération ne se coupe jamais en fin de ligne (« 28 / ÷ 4 » le 23/09)
    resous = (f"{plus}&nbsp;=&nbsp;{B}, puis {T}&nbsp;−&nbsp;{B}&nbsp;=&nbsp;{T - B} et "
              f"{T - B}&nbsp;÷&nbsp;{A}&nbsp;=&nbsp;{x}. Chaque {q} vaut {x}.")
    fin = (f"{t[r0].capitalize()} cache <b>{x}</b> jetons, {court[t1]} {x} + {k1} = <b>{v[t1]}</b>, "
           f"{court[t2]} {calc_t2}. Je vérifie&nbsp;: {v[r0]} + {v[t1]} + {v[t2]} = {T}.")
    indices = "<br>".join(f"<q>{i}</q>" for i in ex["indices"])
    intro = (f"Sur cette carte, il y a {T} jetons au total, tous cachés sous trois taches&nbsp;: "
             f"{t[r0]}, {t[t1]} et {t[t2]}. Deux indices les relient."
             "\n      <span>Pour mener l'enquête, on commence par un <b>schéma en barres</b>&nbsp;: une "
             f"barre par tache, et en haut la <b>tache de référence</b>, la plus petite — ici {t[r0]}. Ce "
             "que cache chaque tache, on l'écrira «&nbsp;<b>?</b>&nbsp;». La page&nbsp;2 mène cette "
             "enquête pas à pas, jusqu'à la réponse.</span>")
    enquete = (f"<p><b>Le total</b>&nbsp;: {T} jetons, tous cachés sous trois taches.</p>"
               f"<p><b>Les indices</b>&nbsp;: {indices}</p>"
               "<p class=\"but\">Mon enquête&nbsp;: trouver ce que cache chaque tache.</p>")
    return dict(intro=intro, enquete=enquete, legendes=[vide, rempli, regroupe, ordonne, resous], fin=fin)


def textes_exemple_repet(ex):
    """« L'enquête rebondit » (25/09/2026) : trois taches, deux couleurs, la tache de référence
    seule et l'autre couleur deux fois, un indice « de plus ». Écrits à partir de la carte rendue.
    La couleur répétée est la plus grande : sinon le schéma regroupé serait déjà rangé et
    l'étape 4 n'apprendrait rien (remarque de Claire du 23/09 sur les exemples à deux taches)."""
    v, mots, ref, T = ex["valeurs"], ex["mots"], ex["ref"], ex["total"]
    if ex["visibles"] or len(v) != 3 or len(ex["relations"]) != 1:
        raise SystemExit("l'exemple de « L'enquête rebondit » : trois taches, un indice, sans jeton visible")
    r = ex["relations"][0]
    autres = [i for i in range(3) if i != ref]
    if r["op"] != "ADD" or r["source"] != ref or mots[autres[0]] != mots[autres[1]] or mots[ref] == mots[autres[0]]:
        raise SystemExit("l'exemple de « L'enquête rebondit » : la référence seule, l'autre couleur deux fois, « de plus »")
    x, k, o = v[ref], r["k"], mots[autres[0]]
    assert all(v[i] == x + k for i in autres) and T == 3 * x + 2 * k
    q = "«&nbsp;?&nbsp;»"
    rr, oo = mots[ref], o
    oos = oo if oo == "orange" else oo + "s"            # « orange » est invariable
    vide = f"Une barre par tache&nbsp;: trois barres. En haut, la <b>tache de référence</b>&nbsp;: la plus petite, ici la tache {rr}."
    rempli = (f"La barre de la tache {rr}&nbsp;: un {q}. Chaque tache {oo}&nbsp;: un {q} et {k} de plus — "
              f"les deux {oos} cachent le même nombre. En tout&nbsp;: {T}.")
    regroupe = f"Toutes les parties sur une seule barre&nbsp;: trois {q}, {k} et {k} font {T}."
    ordonne = f"Je range les {q} d'un côté et les nombres connus de l'autre&nbsp;: on peut écrire l'équation."
    resous = (f"{k}&nbsp;+&nbsp;{k}&nbsp;=&nbsp;{2 * k}, puis {T}&nbsp;−&nbsp;{2 * k}&nbsp;=&nbsp;{T - 2 * k} et "
              f"{T - 2 * k}&nbsp;÷&nbsp;3&nbsp;=&nbsp;{x}. Chaque {q} vaut {x}.")
    fin = (f"La tache {rr} cache <b>{x}</b> jetons, chaque tache {oo} {x} + {k} = <b>{x + k}</b>. "
           f"Je vérifie&nbsp;: {x} + {x + k} + {x + k} = {T}.")
    indices = "<br>".join(f"<q>{i}</q>" for i in ex["indices"])
    intro = (f"Sur cette carte, il y a {T} jetons au total, tous cachés sous trois taches&nbsp;: "
             f"une tache {rr} et deux taches {oos}. Les taches de même couleur cachent le même nombre de jetons&nbsp;; "
             "un indice relie les deux couleurs."
             "\n      <span>Pour mener l'enquête, on commence par un <b>schéma en barres</b>&nbsp;: une "
             f"barre par tache, et en haut la <b>tache de référence</b>, la plus petite — ici la tache {rr}. Ce "
             "que cache chaque tache, on l'écrira «&nbsp;<b>?</b>&nbsp;». La page&nbsp;2 mène cette "
             "enquête pas à pas, jusqu'à la réponse.</span>")
    enquete = (f"<p><b>Le total</b>&nbsp;: {T} jetons, tous cachés sous trois taches.</p>"
               "<p><b>La règle</b>&nbsp;: les taches de même couleur cachent le même nombre de jetons.</p>"
               f"<p><b>L'indice</b>&nbsp;: {indices}</p>"
               "<p class=\"but\">Mon enquête&nbsp;: trouver ce que cache chaque tache.</p>")
    return dict(intro=intro, enquete=enquete, legendes=[vide, rempli, regroupe, ordonne, resous], fin=fin)


def fabrique_qr():
    """(Re)fabrique tous les QR codes. À relancer si une graine ou une série change."""
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
            titre = f"Fiche {f['n']} — {f['t']}"
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

        et = ex["etapes"]
        couv = dict(carte=ex["carte"], vide=et[0]["svg"], vbVide=f"50 612 1500 {et[0]['h']}",
                    sur=niv["couv"]["sur"], titre=niv["couv"]["titre"], accroche=niv["couv"]["accroche"], intro=textes["intro"],
                    sommaire=[[f["n"], f["t"], f["resume"]] for f in niv["fiches"]],
                    prof=dict(PROF, dit=corr["dit"]) if corr else None)
        await pdf_html(f"{base}{BASE_WEB}/couverture.html", tmp / "couverture.pdf", JS_COUV, couv,
                       css=[CSS_PROF if corr else None])
        await pdf_html(f"{base}{BASE_WEB}/exemple.html", tmp / "exemple.pdf", JS_PAGE_EXEMPLE,
                       dict(carte=ex["carte"], etapes=et, enquete=textes["enquete"],
                            legendes=textes["legendes"], fin=textes["fin"]))
        for i, f in enumerate(niv["fiches"]):
            await pdf_fiche(f, tmp / f"fiche{i}.pdf")
        d = niv["dos"]
        dos = dict(niveaux=[[nom, desc, f"{qrweb}/serie-{s}.png"] for nom, desc, s in d["series"]],
                   univers=f"{qrweb}/univers.png", suite=d["suite"], reformule=d["reformule"],
                   mini=d["mini"], ecart=d["ecart"], taches=d.get("taches"))
        await pdf_html(f"{base}{BASE_WEB}/dos.html", tmp / "dos.pdf", JS_DOS, dos)
        await nav.close()
    return ex["cle"], cles

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
FAMILLE_10_19 = ("additif", "multiplicatif", "additif_defi", "multiplicatif_defi")

def ecrire_cartes(nom, cle_ex, reference):
    """cartes.json : pour chaque livret, l'exemple et les 20 cartes des fiches, en « total +
    valeurs triées » (la même clé que le contrôle ci-dessus)."""
    tout = json.loads(CARTES_JSON.read_text(encoding="utf-8")) if CARTES_JSON.exists() else {}
    tout[nom] = {"exemple": [cle_ex[0], json.loads(cle_ex[1])],
                 "fiches": {t: [[c[0], json.loads(c[1])] for c in v] for t, v in reference.items()}}
    # une carte par ligne : le fichier se relit à l'œil
    j = lambda x: json.dumps(x, ensure_ascii=False, separators=(", ", ": "))
    lignes = ["{"]
    for i, (n, c) in enumerate(sorted(tout.items())):
        lignes.append(f' {j(n)}: {{"exemple": {j(c["exemple"])}, "fiches": {{')
        fs = list(c["fiches"].items())
        for k, (t, v) in enumerate(fs):
            lignes.append(f'  {j(t)}: {j(v)}' + ("," if k < len(fs) - 1 else ""))
        lignes.append(" }}" + ("," if i < len(tout) - 1 else ""))
    lignes.append("}")
    CARTES_JSON.write_text("\n".join(lignes) + "\n", encoding="utf-8")

def controle_global():
    """Depuis les livrets « Le défi » (23/09/2026), sur les QUATRE livrets de cartes.json :
    aucun exemple n'est une carte d'un livret ni l'exemple d'un autre ; une carte du défi ne
    revient nulle part (ni dans le livret de la classe, ni dans une autre fiche du défi : total et
    valeurs, quel que soit l'ordre des taches) — un élève qui passe au défi ne retrouve aucune
    carte déjà faite ; et dans un livret du défi, jamais deux fois le même total.
    (Les livrets de la classe ont, eux, deux paires de cartes « à l'envers » voulues par le lot E0 :
    27 = 9 + 18 aux fiches 10 et 11, 12 = 4 + 8 aux fiches 15 et 16 — même nombres, indice retourné.)"""
    tout = json.loads(CARTES_JSON.read_text(encoding="utf-8"))
    cle = lambda c: (c[0], tuple(sorted(c[1])))
    ou = {}
    for nom, c in tout.items():
        for titre, cartes in c["fiches"].items():
            for k in cartes:
                ou.setdefault(cle(k), []).append((nom, titre))
    for k, lieux in ou.items():
        # (25/09/2026) la règle vaut entre les livrets des fiches 10 à 19 et leurs défis : les fiches
        # 20 à 24 de « L'enquête rebondit » ont leurs graines figées depuis le 24/09, et leurs cartes
        # sans total tirent dans 36 paires de valeurs — la fiche 22 a les nombres 13 et 39 d'une
        # carte « fois moins » du défi de la fiche 16 (total 52) : même paire, autre problème
        # (pas de total, deux indices), on la laisse.
        lieux = [(nom, t) for nom, t in lieux if nom in FAMILLE_10_19]
        if len(lieux) > 1 and any(nom.endswith("_defi") for nom, _ in lieux):
            raise SystemExit(f"une carte du défi revient : {k} dans {lieux}")
    for nom, c in tout.items():
        if cle(c["exemple"]) in ou:
            raise SystemExit(f"l'exemple du livret « {nom} » est une carte : {ou[cle(c['exemple'])]}")
        if nom.endswith("_defi"):
            totaux = [k[0] for cartes in c["fiches"].values() for k in cartes]
            if len(set(totaux)) != len(totaux):
                raise SystemExit(f"livret « {nom} » : un total revient")
    exs = [cle(c["exemple"]) for c in tout.values()]
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
    srv = serveur()
    try:
        exemples = {}
        for nom in demandes:
            niv = LIVRETS[nom]
            print(f"— livret « {nom} »")
            reference = None
            for corr in versions:
                sortie = niv["sortie"] + (corr["suffixe"] if corr else "")
                with tempfile.TemporaryDirectory() as d:
                    tmp = Path(d)
                    cle_ex, cles = asyncio.run(rendre(niv, tmp, corr))
                    assemble(niv, tmp, sortie)
                # les cartes ne bougent pas d'une version à l'autre (« ? », correction, lettre)
                vues = {t.replace(" — Correction", ""): v for t, v in cles.items()}
                if reference is None:
                    reference = vues
                elif vues != reference:
                    raise SystemExit(f"{sortie} : les cartes diffèrent du livret de l'élève")
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
            ecrire_cartes(nom, cle_ex, reference)
        controle_global()
    finally:
        srv.shutdown()

if __name__ == "__main__":
    main()
