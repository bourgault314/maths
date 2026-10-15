# -*- coding: utf-8 -*-
"""Les histoires de SPLAT!, livret 2 — la carte cachée de chaque problème : l'adresse de l'outil
(outils/splat.html) et la graine qui tire EXACTEMENT les nombres de l'énoncé (cherchées le
15/10/2026 sur main 717107c, #987, par cherche_graines.py : le générateur rejoué dans Chromium).
Contrôle : genInvestigate / genNumbered / genSystem(makeRng(String(graine))) après chargement de
l'adresse ; valeurs, total et indices comparés à problemes.py.
H9 (9.1, 9.2) : la carte cachée est une carte du monde 2 (3 et 5 taches, deux paquets de jetons) ;
le dessin du corrigé est le schéma du monde 2, l'équation s'écrit dans l'ordre de l'énoncé puis
regroupée (habillage.py, clé equation). D3 et D4 (le dos) n'ont pas de carte : schémas dessinés à part."""
C = "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1"
D = "&visibleMin=0&visibleMax=0&cards=1"
CARTES = {
 # page 2 : l'exemple « je complète » (deux « de plus », la plus grande en sujet) — 64, 25 / 18 / 21
 "Ex":  ("C", C + "&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=64&totalMax=64", 28),
 # fiche H6 : qui sert de référence ?
 "6.1": ("C", C + "&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=0&sub=1&deltaMax=12&totalMin=90&totalMax=90", 37),
 "6.2": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=75&totalMax=75", 1),
 "6.3": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=13&totalMin=94&totalMax=94", 15),
 "6.4": ("C", C + "&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=18&totalMin=150&totalMax=150", 81),
 # fiche H7 : les rapports
 "7.1": ("C", C + "&splats=2&mul=0&div=1&add=0&sub=0&deltaMax=10&vocab=1&totalMin=36&totalMax=36", 3),
 "7.2": ("C", C + "&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&totalMin=40&totalMax=40", 13),
 "7.3": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=0&add=0&sub=0&deltaMax=12&totalMin=63&totalMax=63", 1),
 "7.4": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=0&add=1&sub=0&deltaMax=12&totalMin=65&totalMax=65", 12),
 # fiche H8 : les indices qui se cachent
 "8.1": ("C", C + "&splats=2&compose=1&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=35&totalMax=35", 3),
 "8.2": ("C", C + "&splats=2&compose=1&mul=0&div=0&add=0&sub=1&deltaMax=12&totalMin=92&totalMax=92", 2),
 "8.3": ("C", C + "&splats=3&structure=HASARD&reunies=1&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=72&totalMax=72", 11),
 "8.4": ("C", "mode=C&clues=SENTENCE&visibleMin=1&visibleMax=1&cards=1&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=20&totalMax=20", 14),
 # fiche H9 : des paquets (monde 2, mode N), puis l'Enquête retournée (taches répétées)
 "9.1": ("N", "mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=3&tasksMax=3&visibleMin=2&visibleMax=2&totalMin=23&totalMax=23&cards=1", 9),
 "9.2": ("N", "mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=5&tasksMax=5&visibleMin=2&visibleMax=2&totalMin=86&totalMax=86&cards=1", 1),
 "9.3": ("C", C + "&splats=2&repeat=3&mul=0&div=0&add=0&sub=1&deltaMax=10&totalMin=44&totalMax=60", 152),
 "9.4": ("C", C + "&splats=2&repeat=3&mul=0&div=1&add=0&sub=0&deltaMax=10&totalMin=350&totalMax=500", 43),
 # fiche H10 : Système (mode D)
 "10.1": ("D", "mode=D&geste=COEF&ecart=1&totalMin=27&totalMax=27" + D, 9),
 "10.2": ("D", "mode=D&geste=EMBOITE1&totalMin=54&totalMax=54" + D, 16),
 "10.3": ("D", "mode=D&geste=ESCALIER&totalMin=25&totalMax=25" + D, 120),
 "10.4": ("D", "mode=D&geste=TROIS&totalMin=15&totalMax=15" + D, 7),
}
