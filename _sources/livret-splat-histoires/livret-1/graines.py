# -*- coding: utf-8 -*-
"""SPLAT! en histoires, livret 1 — la carte cachée de chaque problème : l'adresse de l'outil
(outils/splat.html) et la graine qui tire EXACTEMENT les nombres de l'énoncé (cherchées le
07/10/2026 sur main f96e42d, avec le « ? » des cases appliqué — il ne change pas le
tirage). Contrôle : genInvestigate / genNumbered / genSystem(makeRng(String(graine))) après
chargement de l'adresse ; valeurs, total et indices comparés à problemes.py.
D1 et D2 (le dos) n'ont pas de carte : schémas dessinés à part."""
C = "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1"
D = "&visibleMin=0&visibleMax=0&totalMin=5&totalMax=60&cards=1"
CARTES = {
 # page 2 : la carte de l'exemple de la page 2 du livret 1 de l'Enquête (EX_ADD2) — 26, 9 et 17, « 8 de plus »
 "Ex":  ("C", "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&cards=1", 32),
 # fiche 1 : Classique (mode N)
 "1.1": ("N", "mode=N&equation=X_PLUS_A_EQ_B&tasksMin=1&tasksMax=1&visibleMin=1&visibleMax=1&totalMin=57&totalMax=57&cards=1", 34),
 "1.2": ("N", "mode=N&equation=X_PLUS_A_EQ_B&tasksMin=1&tasksMax=1&visibleMin=2&visibleMax=2&totalMin=150&totalMax=150&cards=1", 10936),
 "1.3": ("N", "mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=2&tasksMax=2&visibleMin=1&visibleMax=1&totalMin=31&totalMax=31&cards=1", 35),
 "1.4": ("N", "mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=6&tasksMax=6&visibleMin=1&visibleMax=1&totalMin=77&totalMax=77&cards=1", 1),
 # fiche 2 : Enquête, écarts
 "2.1": ("C", C + "&splats=2&mul=0&div=0&add=1&sub=1&deltaMax=5&totalMin=47&totalMax=47", 7),
 "2.2": ("C", C + "&splats=2&mul=0&div=0&add=1&sub=1&deltaMax=18&totalMin=44&totalMax=44", 13),
 "2.3": ("C", C + "&splats=3&mul=0&div=0&add=1&sub=1&deltaMax=12&totalMin=120&totalMax=120", 343),
 "2.4": ("C", C + "&splats=3&mul=0&div=0&add=1&sub=1&deltaMax=7&totalMin=80&totalMax=80", 46),
 # fiche 3 : Enquête, rapports
 "3.1": ("C", C + "&splats=2&mul=1&div=1&add=0&sub=0&deltaMax=10&totalMin=48&totalMax=48", 3),
 "3.2": ("C", C + "&splats=2&mul=1&div=1&add=0&sub=0&deltaMax=10&totalMin=45&totalMax=45", 3),
 "3.3": ("C", C + "&splats=3&mul=1&div=1&add=0&sub=0&deltaMax=10&totalMin=120&totalMax=120", 53),
 "3.4": ("C", C + "&splats=3&mul=1&div=1&add=1&sub=1&deltaMax=10&totalMin=38&totalMax=38", 283),
 # fiche 4 : Enquête, taches répétées puis sans total
 "4.1": ("C", C + "&splats=2&repeat=3&mul=0&div=0&add=1&sub=1&deltaMax=10&totalMin=46&totalMax=46", 18),
 "4.2": ("C", C + "&splats=2&repeat=3&mul=1&div=1&add=0&sub=0&deltaMax=10&totalMin=35&totalMax=35", 3),
 "4.3": ("C", "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&cards=1", 16),
 "4.4": ("C", "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=0&div=1&add=0&sub=1&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&cards=1", 28),
 # fiche 5 : Système (mode D) — 5.2 et 5.3 aux nombres du 07/10 au soir (plus petite valeur ≥ 3)
 "5.1": ("D", "mode=D&geste=PARTIELLE" + D, 337),
 "5.2": ("D", "mode=D&geste=COEF" + D, 291),
 "5.3": ("D", "mode=D&geste=DOUBLE" + D, 346),
 "5.4": ("D", "mode=D&geste=MIROIR" + D, 27),
}
