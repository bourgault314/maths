#!/usr/bin/env python3
"""Vérification exhaustive du livret : données, promesses de niveaux, HTML généré."""
import json
import re
import sys
from pathlib import Path

from game import SERIES, solve, check, grid_of, placement_of, ROWS, COLS

HERE = Path(__file__).resolve().parent
series = json.loads((HERE / "series20.json").read_text(encoding="utf-8"))
errors, warnings = [], []

def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)

def solution_set(cards):
    normalized = {int(player): constraints for player, constraints in cards.items()}
    return {tuple(map(tuple, grid_of(placement))) for placement in solve(normalized)}

def every_card_needed(cards):
    base = solution_set(cards)
    return all(
        solution_set({other: constraints for other, constraints in cards.items() if other != player}) != base
        for player in cards
    )

def every_clue_needed(cards):
    base = solution_set(cards)
    for player, constraints in cards.items():
        for direction in constraints:
            reduced = {other: dict(values) for other, values in cards.items()}
            del reduced[player][direction]
            if solution_set(reduced) == base:
                return False
    return True

# ---------------------------------------------------------------- 1. données
assert len(series) == 20, "il faut 20 séries"
for s in series:
    n, lvl, cards, sol = s["num"], s["level"], s["cards"], s["sol"]
    players = sorted(cards.keys())
    if players != ["1", "2", "3", "4"]:
        err(f"série {n} : joueurs {players}")
    # grille : 4 joueurs placés, 2 cases vides
    flat = [v for row in sol for v in row]
    if sorted(v for v in flat if v) != [1, 2, 3, 4] or len(flat) != 6:
        err(f"série {n} : grille solution invalide {sol}")
    # cartes : 1 à 4 infos, valeurs P/X, directions valides
    for p, c in cards.items():
        if not (1 <= len(c) <= 4):
            err(f"série {n} carte {p} : {len(c)} infos")
        for d, v in c.items():
            if d not in ("front", "back", "left", "right") or v not in ("P", "X"):
                err(f"série {n} carte {p} : contrainte {d}={v}")
    # la solution cible satisfait toutes les cartes
    cc = {int(p): c for p, c in cards.items()}
    if not check(placement_of(sol), cc):
        err(f"série {n} : la solution imprimée ne satisfait PAS les cartes !")
    # recompte des placements valides
    sols = solve(cc)
    if len(sols) != s["n_sols"]:
        err(f"série {n} : n_sols annoncé {s['n_sols']} mais recompté {len(sols)}")
    if len(sols) == 0:
        err(f"série {n} : INJOUABLE (aucun placement)")
    # cartes identiques ?
    sigs = [tuple(sorted(c.items())) for c in cards.values()]
    if len(set(sigs)) < 4:
        if "(ancienne série 5)" in s["note"]:
            pass  # série symétrique voulue (ex-série 5 : cartes jumelles + flèches)
        else:
            err(f"série {n} : cartes identiques non prévues")

# ---------------------------------------------------------------- 2. promesses de niveau
for s in series:
    n, lvl, cards = s["num"], s["level"], s["cards"]
    infos = sum(len(c) for c in cards.values())
    if lvl == 1:
        pos = sum(1 for c in cards.values() for v in c.values() if v == "P")
        if pos * 2 < infos:
            warn(f"série {n} (niv 1) : moins de la moitié d'indices positifs")
        if any(len(c) > 3 for c in cards.values()):
            err(f"série {n} (niv 1) : une carte a plus de 3 infos")
    if lvl == 2 and any(len(c) != 4 for c in cards.values()):
        err(f"série {n} (niv 2) : toutes les cartes doivent avoir 4 infos")
    if lvl == 3:
        if s["n_sols"] > 2:
            err(f"série {n} (niv 3) : {s['n_sols']} placements (> 2)")
        if any(len(c) > 3 for c in cards.values()):
            err(f"série {n} (niv 3) : une carte a plus de 3 infos")
    if lvl == 4 and s["n_sols"] != 1:
        err(f"série {n} (niv 4) : placement non unique")
    if s["note"] == "nouvelle série maths&go" and lvl in (3, 4) and not every_card_needed(cards):
        err(f"série {n} : une carte peut être retirée sans changer les placements")
    if s["note"] == "nouvelle série maths&go" and lvl == 4 and not every_clue_needed(cards):
        err(f"série {n} : un indice peut être retiré sans changer le placement")

# ---------------------------------------------------------------- 3. doublons entre séries
TRANSFORMS = (
    {"front": "front", "back": "back", "left": "left", "right": "right"},
    {"front": "front", "back": "back", "left": "right", "right": "left"},
    {"front": "back", "back": "front", "left": "left", "right": "right"},
    {"front": "back", "back": "front", "left": "right", "right": "left"},
)

def canon(cards):
    variants = []
    for transform in TRANSFORMS:
        variants.append(tuple(sorted(
            tuple(sorted((transform[direction], value) for direction, value in card.items()))
            for card in cards.values()
        )))
    return min(variants)

seen = {}
for s in series:
    k = canon(s["cards"])
    if k in seen:
        err(f"séries {seen[k]} et {s['num']} : jeux de cartes équivalents par symétrie")
    seen[k] = s["num"]

# ---------------------------------------------------------------- 4. fidélité aux originales
MAPPING = {1: 2, 2: 11, 4: 9, 5: 10, 6: 5, 7: 3, 8: 12, 9: 16, 10: 8}  # ancienne -> livret
by_num = {s["num"]: s for s in series}
for old, new in MAPPING.items():
    orig = {str(p): c for p, c in SERIES[old]["cards"].items()}
    if by_num[new]["cards"] != orig:
        err(f"ancienne série {old} ≠ série {new} du livret")
# La seule série reconstruite conserve la solution de la feuille manuscrite.
if by_num[6]["sol"] != SERIES[3]["sol"]:
    err("série 6 : solution ≠ feuille manuscrite (ancienne 3)")

# ---------------------------------------------------------------- 5. HTML généré conforme
html = (HERE / "out" / "livret.html").read_text(encoding="utf-8")
if "<title>Chat, c'est toi le chat ! - maths&amp;go</title>" not in html:
    err("titre HTML absent ou incorrect")
if '<div class="origin">' in html:
    err("bloc de provenance interne visible dans le livret")
for internal_note in ("inventée par toi", "d'origine", "reconstituée"):
    if internal_note in html:
        err(f"note interne visible dans le livret : {internal_note}")
if "autre(s)" in html or "placement(s)" in html or "juste(s)" in html:
    err("singulier/pluriel non résolu dans les solutions")
for required_text in (
    "GS-CP, adaptable en MS avec accompagnement",
    "cerceaux ou cercles tracés au sol",
    "cercle vide, ou pas de cercle",
    "une seule solution suffit",
    "chacun lit sa carte à voix haute",
):
    if required_text not in html:
        err(f"consigne absente du livret : {required_text}")
pages = html.split('<section class="page">')[1:]
if len(pages) != 23:
    err(f"{len(pages)} pages au lieu de 23")
POS2DIR = {"top": "front", "bottom": "back", "left": "left", "right": "right"}
serie_pages = [p for p in pages if re.search(r"<h2>Série (\d+)</h2>", p)]
if len(serie_pages) != 20:
    err(f"{len(serie_pages)} pages de séries au lieu de 20")
for page in serie_pages:
    num = int(re.search(r"<h2>Série (\d+)</h2>", page).group(1))
    found = {}
    for m in re.finditer(r'<div class="card ">(.*?)(?=<div class="card ">|\s*<div class="cutnote")', page, re.S):
        body = m.group(1)
        cardnum = re.search(r'class="cardnum">(?:<svg.*?</svg>)?(\d+)\.(\d+)<', body, re.S)
        p = cardnum.group(2)
        cons = {}
        for sm in re.finditer(r'<div class="slot (top|left|right|bottom)">(.*?)</svg>', body, re.S):
            pos, svg = sm.group(1), sm.group(2)
            cons[POS2DIR[pos]] = "X" if "<line" in svg else "P"
        found[p] = cons
    expected = by_num[num]["cards"]
    if found != expected:
        err(f"page série {num} : HTML ≠ données ({found} vs {expected})")
# Toutes les grilles valides, et seulement elles, doivent figurer dans le HTML.
displayed = {}
for encoded, raw_num in re.findall(
    r'<div class="solgrid" data-grid="([0-4]{3}/[0-4]{3})" data-series="(\d+)">',
    html,
):
    grid = [[int(value) for value in row] for row in encoded.split("/")]
    displayed.setdefault(int(raw_num), []).append(grid)
if set(displayed) != set(by_num):
    err(f"solutions HTML : séries présentes {sorted(displayed)}")
for num, s in by_num.items():
    shown = displayed.get(num, [])
    expected = solution_set(s["cards"])
    shown_set = {tuple(map(tuple, grid)) for grid in shown}
    if shown_set != expected or len(shown) != len(expected):
        err(f"solutions HTML série {num} : {len(shown)} grilles affichées, {len(expected)} attendues")
    if shown and shown[0] != s["sol"]:
        err(f"solutions HTML série {num} : la grille principale n'est pas affichée en premier")
# chaque carte porte le M dans la pastille et l'adresse en bas ; pas d'autre logo
for page in serie_pages:
    if page.count("mbadge") != 4:
        err("page de cartes : M manquant dans une pastille")
    if page.count('class="cardurl">mathsgo.re<') != 4:
        err("page de cartes : adresse mathsgo.re manquante sur une carte")
    if "mmark" in page or "base64" in page:
        err("logo de pied de page présent sur une page de cartes")

# ---------------------------------------------------------------- bilan
print(f"{len(errors)} erreur(s), {len(warnings)} avertissement(s)")
for e in errors: print("  ERREUR :", e)
for w in warnings: print("  attention :", w)
sys.exit(1 if errors else 0)
