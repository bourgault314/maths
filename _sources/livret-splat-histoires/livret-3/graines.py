# -*- coding: utf-8 -*-
"""Les histoires de SPLAT!, livret 3 — la carte cachée de chaque problème : l'adresse de l'outil et la
graine qui tire EXACTEMENT les nombres de l'énoncé (cherchées le 15/10/2026 sur main e3251de, #990, par
cherche_graines.py : le générateur rejoué dans Chromium).
  C, D : outils/splat.html — genInvestigate / genSystem(makeRng(String(graine)))
  B    : outils/splat_equations.html (la balance, monde 5 fiche 37) — genEquationStep(makeRng(String(graine))) ;
         4e élément : les deux côtés dans l'ordre de l'énoncé, 𝑥, et « inverser » quand le 1er côté de
         l'énoncé est à droite sur la carte (11.2).
D5 et D6 (le dos) et 13.2 (« on cherche le tout », 17/10/2026) n'ont pas de carte : schémas dessinés à part.
RECOPIE (21/10/2026, lot B) : 14.1 et 14.2 gardent leur carte (mêmes plateaux, mêmes nombres) mais se corrigent avec le
plan « je recopie » de l'outil (corrige.js, __carteRecopie) ; le nombre : le rang, sur la carte, du plateau recopié."""
CARTES = {
 "ExB": ("B", "mode=EQSTEP&form=BOTH&cards=1&tasksMax=3&visibleMin=1&visibleMax=1&totalMin=28&totalMax=28", 2, dict(cotes=[[3, [4]], [1, [20]]], x=8, inverser=False)),
 "11.1": ("B", "mode=EQSTEP&form=BOTH&cards=1&tasksMax=5&visibleMin=0&visibleMax=1&totalMin=125&totalMax=125", 182, dict(cotes=[[5, []], [3, [50]]], x=25, inverser=False)),
 "11.2": ("B", "mode=EQSTEP&form=BOTH&cards=1&tasksMax=5&visibleMin=1&visibleMax=1&totalMin=38&totalMax=38", 41, dict(cotes=[[3, [20]], [5, [8]]], x=6, inverser=True)),
 "11.3": ("B", "mode=EQSTEP&form=BOTH&cards=1&tasksMax=4&visibleMin=1&visibleMax=1&totalMin=47&totalMax=47", 64, dict(cotes=[[4, [7]], [2, [27]]], x=10, inverser=False)),
 "11.4": ("B", "mode=EQSTEP&form=BOTH&cards=1&tasksMax=5&visibleMin=1&visibleMax=2&totalMin=57&totalMax=57", 14818, dict(cotes=[[5, [12]], [3, [14, 16]]], x=9, inverser=False)),
 "12.1": ("C", "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1&splats=3&structure=REF&ordre=DESSIN&mul=0&div=1&add=0&sub=0&deltaMax=12&totalMin=72&totalMax=72", 2),
 "12.2": ("C", "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&totalMin=27&totalMax=27", 5),
 "12.3": ("C", "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1&splats=3&structure=REF&ordre=DESSIN&mul=0&div=1&add=0&sub=1&deltaMax=12&totalMin=49&totalMax=49", 14),
 "12.4": ("C", "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1&splats=3&structure=COMPLETE&ordre=DESSIN&mul=1&div=0&add=0&sub=1&deltaMax=12&totalMin=45&totalMax=45", 14),
 "ExU": ("C", "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1&splats=3&structure=UNITE&mul=1&div=0&add=0&sub=0&deltaMax=15&totalMin=55&totalMax=55", 2),
 # 13.1 (17/10/2026) : un « fois plus » et un « fois moins » (div=1) — graine cherchée sur main acc576b (#1007)
 "13.1": ("C", "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1&splats=3&structure=UNITE&mul=1&div=1&add=0&sub=0&deltaMax=15&totalMin=110&totalMax=110", 3),
 # 13.2 (17/10/2026) : « on cherche le tout », pas de carte (le total y est toujours donné) — habillage.py, clé « tout »
 "13.3": ("C", "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1&splats=3&structure=CHAINE&ordre=DESORDRE&mul=0&div=0&add=0&sub=1&deltaMax=12&totalMin=35&totalMax=35", 34),
 "13.4": ("C", "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1&splats=3&structure=CHAINE&ordre=DESORDRE&mul=1&div=1&add=0&sub=0&deltaMax=12&totalMin=54&totalMax=54", 2),
 "14.1": ("D", "mode=D&geste=DOUBLE&fois=2&sens=INDICE&indice=12&totalMin=32&totalMax=32&visibleMin=0&visibleMax=0&cards=1", 2),
 "14.2": ("D", "mode=D&geste=MIROIR&forme=13&totalMin=35&totalMax=35&visibleMin=0&visibleMax=0&cards=1", 4),
 "14.3": ("D", "mode=D&geste=RECOPIE&fois=2&totalMin=46&totalMax=90&visibleMin=0&visibleMax=0&cards=1", 723),
 "14.4": ("D", "mode=D&geste=RECOPIE&fois=3&totalMin=49&totalMax=110&visibleMin=0&visibleMax=0&cards=1", 543),
 "ExG": ("D", "mode=D&geste=ETAGES&sous=COEF&ecart=2&grand=112&totalMin=52&totalMax=75&visibleMin=0&visibleMax=0&cards=1", 319),
 "15.1": ("D", "mode=D&geste=ETAGES&sous=COEF&ecart=2&grand=211&totalMin=33&totalMax=33&visibleMin=0&visibleMax=0&cards=1", 6),
 "15.2": ("D", "mode=D&geste=ETAGES&sous=MIROIR&grand=112&totalMin=65&totalMax=125&visibleMin=0&visibleMax=0&cards=1", 4754),
 "15.3": ("D", "mode=D&geste=ETAGES&sous=RECOPIE&fois=2&grand=112&totalMin=53&totalMax=100&visibleMin=0&visibleMax=0&cards=1", 935),
 "15.4": ("D", "mode=D&geste=EMBOITE1&ordre=MELANGE&visibleMin=1&visibleMax=1&cards=1&totalMin=24&totalMax=24", 9),
}
# 14.1 : l’achat de 19 € (2e plateau de la carte) recopié 2 fois ; 14.2 : la pesée de 35 kg (1er plateau) recopiée 3 fois
RECOPIE = {"14.1": 1, "14.2": 0}
