#!/usr/bin/env python3
"""Banque de séries pour « Chat, c'est toi le chat ! — le jeu en ligne ».

Regroupe les 20 séries du livret + les 12 défis de la version projection,
classe le tout en 4 niveaux, puis complète chaque niveau à 12 séries avec de
nouvelles séries générées et vérifiées par le solveur.

Règles :
- dédoublonnage sous les 4 symétries de la grille (identité, miroir G/D,
  miroir devant/derrière, rotation 180°) + renumérotation des joueurs ;
- nouvelles séries : cartes toutes distinctes, ≤ 2 placements justes
  (placement unique + cartes toutes indispensables au niveau 4) ;
- chaque série embarque TOUTES ses solutions (vérifiées par solveur).
"""
import json
import random
import sys
from itertools import permutations
from pathlib import Path

SRC = Path(__file__).resolve().parent
sys.path.insert(0, str(SRC))
from game import solve, check, placement_of, grid_of, ROWS, COLS, DIRS  # noqa: E402

random.seed(271828)

# ----------------------------------------------------------- canonicalisation
MIRROR_LR = {"left": "right", "right": "left", "front": "front", "back": "back"}
MIRROR_FB = {"front": "back", "back": "front", "left": "left", "right": "right"}
ROT_180 = {"front": "back", "back": "front", "left": "right", "right": "left"}
SYMS = [None, MIRROR_LR, MIRROR_FB, ROT_180]


def transform(cards, mapping):
    if mapping is None:
        return cards
    return {p: {mapping[d]: v for d, v in c.items()} for p, c in cards.items()}


def signature(cards):
    """Signature indépendante de la numérotation des joueurs et des symétries."""
    best = None
    for sym in SYMS:
        t = transform(cards, sym)
        sig = tuple(sorted(tuple(sorted(c.items())) for c in t.values()))
        if best is None or sig < best:
            best = sig
    return best


def n_infos(cards):
    return sum(len(c) for c in cards.values())


def n_pos(cards):
    return sum(v == "P" for c in cards.values() for v in c.values())


def distinct_cards(cards):
    sigs = [tuple(sorted(c.items())) for c in cards.values()]
    return len(set(sigs)) == len(sigs)


def every_card_needed(cards):
    base = {tuple(map(tuple, grid_of(p))) for p in solve(cards)}
    for player in cards:
        test = {p: c for p, c in cards.items() if p != player}
        if {tuple(map(tuple, grid_of(p))) for p in solve(test)} == base:
            return False
    return True


def full_constraints(grid):
    occ = {(r, c) for r in range(ROWS) for c in range(COLS) if grid[r][c]}
    cons = {}
    for r in range(ROWS):
        for c in range(COLS):
            p = grid[r][c]
            if not p:
                continue
            d = {}
            for name, (dr, dc) in DIRS.items():
                nr, nc = r + dr, c + dc
                inside = 0 <= nr < ROWS and 0 <= nc < COLS
                d[name] = "P" if (inside and (nr, nc) in occ) else "X"
            cons[p] = d
    return cons


def all_sol_grids(cards):
    return [grid_of(p) for p in solve(cards)]


# ------------------------------------------------------------------- existant
livret = json.loads((SRC / "series20.json").read_text())
proj = json.loads((SRC / "projection_cases.json").read_text())

bank = []            # dicts finaux
seen = set()         # signatures


def norm_cards(cards):
    """clés str '1'..'4', directions dans l'ordre front/left/right/back."""
    order = ["front", "left", "right", "back"]
    return {str(p): {d: cards[p][d] for d in order if d in cards[p]}
            for p in sorted(int(k) for k in cards)}


def add(cards, level, origin, sid):
    cards = {int(p): dict(c) for p, c in cards.items()}
    sols = all_sol_grids(cards)
    assert sols, f"{sid} : aucune solution !"
    sig = signature(cards)
    if sig in seen:
        return False
    seen.add(sig)
    bank.append({
        "id": sid,
        "level": level,
        "origin": origin,
        "cards": norm_cards(cards),
        "sols": sols,
        "n_sols": len(sols),
        "infos": n_infos(cards),
        "pos": n_pos(cards),
    })
    return True


# 1) les 20 séries du livret, niveaux conservés
for s in livret:
    cards = {int(p): dict(c) for p, c in s["cards"].items()}
    ok = add(cards, s["level"], f"livret série {s['num']}", f"L{s['num']:02d}")
    assert ok, f"doublon inattendu dans le livret : série {s['num']}"

# 2) les 12 défis projection : niveau selon la structure des cartes
def classify(cards):
    infos = [len(c) for c in cards.values()]
    ns = len(solve(cards))
    total = sum(infos)
    if all(i == 4 for i in infos):
        return 2
    if ns == 1 and total <= 8:
        return 4
    if max(infos) <= 2 and n_pos(cards) >= total * 0.5:
        return 1
    return 3


proj_report = []
for case in proj["cases"]:
    cards = {int(p): dict(c) for p, c in case["cards"].items()}
    lvl = classify(cards)
    ok = add(cards, lvl, f"défi projection {case['id']}", f"P{case['id'][-2:]}")
    proj_report.append((case["id"], case["difficulty"], lvl, len(solve(cards)),
                        n_infos(cards), "ajouté" if ok else "DOUBLON (écarté)"))

print("Défis projection → niveaux :")
for row in proj_report:
    print("  %s  étape %d → niveau %d  (%d sols, %d infos)  %s" % row)

from collections import Counter
count = Counter(s["level"] for s in bank)
print("\nAprès reprise de l'existant :", dict(sorted(count.items())))

# ------------------------------------------------------------------ nouvelles
TARGET = 12


def random_grid():
    cells = [(r, c) for r in range(ROWS) for c in range(COLS)]
    random.shuffle(cells)
    grid = [[0] * COLS for _ in range(ROWS)]
    for player, (r, c) in zip((1, 2, 3, 4), cells[:4]):
        grid[r][c] = player
    return grid


def subset(full, keep):
    return {p: {d: full[p][d] for d in DIRS if d in keep[p]} for p in full}


def try_level1(grid):
    """1-2 infos/carte, majorité de chats pleins, 2-3 placements."""
    full = full_constraints(grid)
    for _ in range(300):
        keep = {}
        for p in full:
            k = random.choice([1, 1, 2, 2])
            dirs = sorted(full[p], key=lambda d: (full[p][d] != "P", random.random()))
            keep[p] = dirs[:k]
        cards = subset(full, keep)
        if not distinct_cards(cards):
            continue
        if n_pos(cards) < n_infos(cards) * 0.6 or n_pos(cards) < 4:
            continue
        ns = len(solve(cards))
        if 2 <= ns <= 3:
            return cards
    return None


def try_level2(grid):
    """cartes très bavardes : 3-4 infos par carte (≥ 2 cartes complètes).

    Les cartes 100 % complètes ne dépendent que de la forme des 4 cercles
    occupés : à symétrie près il n'en existe qu'une poignée, déjà toutes dans
    le livret. On garde donc l'esprit (beaucoup d'infos, redondance) en
    autorisant 3 infos sur certaines cartes.
    """
    full = full_constraints(grid)
    for _ in range(300):
        n_full = random.choice([2, 2, 3])
        players = list(full)
        random.shuffle(players)
        keep = {}
        for rank, p in enumerate(players):
            if rank < n_full:
                keep[p] = list(full[p])
            else:
                keep[p] = random.sample(list(full[p]), 3)
        cards = subset(full, keep)
        if not distinct_cards(cards):
            continue
        ns = len(solve(cards))
        if 1 <= ns <= 2:
            return cards
    return None


def try_level3(grid):
    """2-3 infos/carte, 1-2 placements."""
    full = full_constraints(grid)
    best = None
    for _ in range(400):
        keep = {p: random.sample(list(full[p]), random.choice([2, 2, 3])) for p in full}
        cards = subset(full, keep)
        if not distinct_cards(cards):
            continue
        ns = len(solve(cards))
        if not 1 <= ns <= 2:
            continue
        score = (n_infos(cards), -ns)
        if best is None or score < best[0]:
            best = (score, cards)
    return best and best[1]


def try_level4(grid):
    """placement unique, le moins d'infos possible, cartes indispensables."""
    full = full_constraints(grid)
    if len(solve(full)) != 1:
        return None
    best = None
    items = [(p, d) for p in full for d in full[p]]
    for _ in range(120):
        keep = {p: set(full[p]) for p in full}
        order = items[:]
        random.shuffle(order)
        for p, d in order:
            if len(keep[p]) <= 1:
                continue
            keep[p].discard(d)
            cards = subset(full, {q: sorted(v) for q, v in keep.items()})
            if len(solve(cards)) != 1:
                keep[p].add(d)
        cards = subset(full, {q: sorted(v) for q, v in keep.items()})
        if not distinct_cards(cards) or not every_card_needed(cards):
            continue
        score = n_infos(cards)
        if best is None or score < best[0]:
            best = (score, cards)
    return best and best[1]


MAKers = {1: try_level1, 2: try_level2, 3: try_level3, 4: try_level4}

for level in (1, 2, 3, 4):
    idx = 0
    guard = 0
    while sum(1 for s in bank if s["level"] == level) < TARGET:
        guard += 1
        assert guard < 4000, f"niveau {level} : génération bloquée"
        cards = MAKers[level](random_grid())
        if cards is None:
            continue
        idx += 1
        add(cards, level, "nouvelle série maths&go (jeu en ligne)", f"N{level}{chr(96 + idx)}")

count = Counter(s["level"] for s in bank)
print("Banque finale :", dict(sorted(count.items())), "— total", len(bank))

# ------------------------------------------------------------- ordre et audit
def order_key(s):
    # dans chaque niveau : du plus guidé au plus dépouillé
    if s["level"] == 1:
        return (s["infos"] - s["pos"], -s["pos"], s["n_sols"])
    return (-s["infos"], s["n_sols"], s["id"])


bank.sort(key=lambda s: (s["level"], order_key(s)))
for i, s in enumerate(bank, 1):
    s["num"] = i

# audit final : chaque solution stockée vérifie les 4 cartes ; solveur recompté
for s in bank:
    cards = {int(p): dict(c) for p, c in s["cards"].items()}
    sols = solve(cards)
    assert len(sols) == s["n_sols"] == len(s["sols"])
    stored = {tuple(map(tuple, g)) for g in s["sols"]}
    found = {tuple(map(tuple, grid_of(p))) for p in sols}
    assert stored == found, s["id"]
    for g in s["sols"]:
        assert check(placement_of(g), cards), s["id"]
    if s["origin"].startswith("nouvelle"):
        assert distinct_cards(cards), f"{s['id']} : cartes identiques"
    elif not distinct_cards(cards):
        print(f"  note : {s['id']} ({s['origin']}) a des cartes jumelles (fidèle au jeu papier)")

out = [{"num": s["num"], "level": s["level"], "origin": s["origin"],
        "cards": s["cards"], "sols": s["sols"], "n_sols": s["n_sols"]}
       for s in bank]
(SRC / "bank48.json").write_text(
    json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print("bank48.json écrit —", len(out), "séries, audit 0 erreur")
print("n_sols par niveau :")
for level in (1, 2, 3, 4):
    print("  niveau", level, sorted(s["n_sols"] for s in bank if s["level"] == level))
