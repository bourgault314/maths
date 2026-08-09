#!/usr/bin/env python3
"""Construit les 20 séries : originales reclassées + reconstruction (3) + nouvelles.

Niveaux :
  1 Découverte      : 1-2 infos par carte, surtout des chats « pleins »
  2 Cartes complètes: les 4 voisins sur chaque carte
  3 Cartes partielles: 2-3 infos par carte, au plus 2 placements justes
  4 Expertes        : le moins d'infos possible, placement unique
"""
import json
import random
from pathlib import Path

from game import SERIES, solve, check, placement_of, grid_of, ROWS, COLS, DIRS

HERE = Path(__file__).resolve().parent
SERIES_FILE = HERE / "series20.json"

random.seed(31459)

def full_constraints(grid):
    """Toutes les contraintes vraies (4 directions) pour chaque joueur."""
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

def subset_cards(full, keep):
    """keep: dict p -> liste de directions à garder."""
    # Parcourir DIRS garantit un JSON identique malgré l'ordre aléatoire des set.
    return {p: {d: full[p][d] for d in DIRS if d in keep[p]} for p in full}

def n_infos(cards):
    return sum(len(c) for c in cards.values())

def distinct_cards(cards):
    sigs = [tuple(sorted(c.items())) for c in cards.values()]
    return len(set(sigs)) == len(sigs)

def every_card_needed(cards):
    """Vrai si retirer n'importe quelle carte change l'ensemble des placements."""
    base = {tuple(map(tuple, grid_of(p))) for p in solve(cards)}
    for player in cards:
        test = {p: c for p, c in cards.items() if p != player}
        if {tuple(map(tuple, grid_of(p))) for p in solve(test)} == base:
            return False
    return True

# ------------------------------------------------------------------ recherche
def make_level1(grid, tries=400):
    """1-2 infos/carte, ≥ moitié de 'P', jouable (la solution cible est valide)."""
    full = full_constraints(grid)
    best = None
    for _ in range(tries):
        keep = {}
        for p in full:
            k = random.choice([1, 1, 2])
            dirs = list(full[p])
            random.shuffle(dirs)
            # privilégier les chats pleins (positifs)
            dirs.sort(key=lambda d: 0 if full[p][d] == "P" else 1)
            keep[p] = dirs[:k]
        cards = subset_cards(full, keep)
        if not distinct_cards(cards):
            continue
        pos = sum(1 for p in cards for d in cards[p] if cards[p][d] == "P")
        if pos < n_infos(cards) * 0.5 or pos < 3:
            continue
        sols = solve(cards)
        if not (2 <= len(sols) <= 8):
            continue
        score = (len(sols), -pos)
        if best is None or score < best[0]:
            best = (score, cards, len(sols))
    return best and (best[1], best[2])

def make_level3(grid, tries=800, need_all=False):
    """2-3 infos/carte, ≤ 2 placements ; éventuellement 4 cartes indispensables."""
    full = full_constraints(grid)
    best = None
    for _ in range(tries):
        keep = {p: random.sample(list(full[p]), random.choice([2, 2, 3])) for p in full}
        cards = subset_cards(full, keep)
        if not distinct_cards(cards):
            continue
        sols = solve(cards)
        if not (1 <= len(sols) <= 2):
            continue
        if need_all and not every_card_needed(cards):
            continue
        score = (n_infos(cards), len(sols) * -1)  # peu d'infos, 2 placements ok
        if best is None or score < best[0]:
            best = (score, cards, len(sols))
    return best and (best[1], best[2])

def make_level4(grid, restarts=300):
    """Retire des contraintes tant que la solution reste unique. Minimise les infos."""
    full = full_constraints(grid)
    if len(solve(full)) != 1:
        return None
    best = None
    items = [(p, d) for p in full for d in full[p]]
    for _ in range(restarts):
        keep = {p: set(full[p]) for p in full}
        order = items[:]
        random.shuffle(order)
        for p, d in order:
            if len(keep[p]) <= 1:
                continue  # chaque carte garde au moins une info
            keep[p].discard(d)
            cards = subset_cards(full, {q: list(v) for q, v in keep.items()})
            if len(solve(cards)) != 1:
                keep[p].add(d)
        cards = subset_cards(full, {q: list(v) for q, v in keep.items()})
        if not distinct_cards(cards) or not every_card_needed(cards):
            continue
        score = n_infos(cards)
        if best is None or score < best[0]:
            best = (score, cards)
    return best and (best[1], 1)

# ------------------------------------------------------------------ configs
def G(s):  # "230/314" -> grille
    a, b = s.split("/")
    return [[int(x) for x in a], [int(x) for x in b]]

ORIG = {n: SERIES[n] for n in SERIES}

# grilles cibles pour les nouvelles séries (variété de motifs et d'étiquettes)
NEW_GRIDS = {
    "n1a": G("140/230"),   # bloc gauche
    "n1b": G("021/403"),   # zigzag inversé
    "n2b": G("412/030"),   # forme en T, cartes complètes
    "n3d": G("020/431"),   # T inversé, 4 cartes indispensables
    "n3b": G("130/402"),
    "n3c": G("041/320"),
    "n4a": G("102/340"),
    "n4b": G("013/240"),
    "n4c": G("310/024"),
    "n4e": G("300/241"),   # forme en L, 5 indices indispensables
    "r3":  G("204/310"),   # solution de la feuille pour l'ancienne série 3
}

# Cartes retenues après l'audit pédagogique. Les conserver explicitement évite
# qu'une autre version de Python choisisse une variante aléatoire équivalente.
# Les fonctions make_level* restent disponibles pour concevoir de futures
# séries, mais la publication est entièrement reproductible.
NEW_CARDS = {
    "n1a": {
        1: {"right": "P", "back": "P"},
        4: {"back": "P", "left": "P"},
        2: {"right": "P", "front": "P"},
        3: {"left": "P", "front": "P"},
    },
    "n1b": {
        2: {"right": "P", "back": "X"},
        1: {"left": "P", "back": "P"},
        4: {"back": "X", "right": "X"},
        3: {"front": "P", "right": "X"},
    },
    "n3d": {
        2: {"right": "X", "back": "P"},
        4: {"front": "X", "right": "P"},
        3: {"left": "P", "right": "P"},
        1: {"right": "X", "left": "P"},
    },
    "n3b": {
        1: {"left": "X", "back": "P"},
        3: {"left": "P", "front": "X"},
        4: {"front": "P", "left": "X"},
        2: {"front": "X", "left": "X"},
    },
    "n3c": {
        4: {"right": "P", "left": "X"},
        1: {"back": "X", "front": "X"},
        3: {"left": "X", "back": "X"},
        2: {"back": "X", "front": "P"},
    },
    "n4a": {
        1: {"back": "P"},
        2: {"right": "X", "front": "X", "left": "X"},
        3: {"right": "P"},
        4: {"front": "X"},
    },
    "n4b": {
        1: {"back": "P", "right": "P"},
        3: {"right": "X", "front": "X"},
        2: {"front": "X"},
        4: {"left": "P"},
    },
    "n4c": {
        3: {"right": "P", "front": "X"},
        1: {"back": "P", "left": "P"},
        2: {"right": "P"},
        4: {"front": "X"},
    },
    "n4e": {
        3: {"right": "X"},
        2: {"front": "P"},
        4: {"right": "P", "left": "P"},
        1: {"left": "P"},
    },
}

def curated(key):
    cards = NEW_CARDS[key]
    assert check(placement_of(NEW_GRIDS[key]), cards), f"{key} : grille cible invalide"
    return cards, len(solve(cards))

def build():
    lineup = []  # (niveau, note_origine, cards, sol_grid, n_sols)

    # ---- Niveau 1 : découverte
    lineup.append((1, "reprise du jeu papier (ancienne série 1)", ORIG[1]["cards"], ORIG[1]["sol"], len(solve(ORIG[1]["cards"]))))
    lineup.append((1, "reprise du jeu papier (ancienne série 6)", ORIG[6]["cards"], ORIG[6]["sol"], len(solve(ORIG[6]["cards"]))))
    lineup.append((1, "reprise du jeu papier (ancienne série 7)", ORIG[7]["cards"], ORIG[7]["sol"], len(solve(ORIG[7]["cards"]))))
    for key in ("n1a", "n1b"):
        cards, ns = curated(key)
        lineup.append((1, "nouvelle série maths&go", cards, NEW_GRIDS[key], ns))

    # ---- Niveau 2 : cartes complètes
    r3 = full_constraints(NEW_GRIDS["r3"])
    lineup.append((2, "ancienne série 3, reconstituée d'après la feuille de solutions", r3, NEW_GRIDS["r3"], len(solve(r3))))
    lineup.append((2, "reprise du jeu papier (ancienne série 4)", ORIG[4]["cards"], ORIG[4]["sol_alt"], len(solve(ORIG[4]["cards"]))))
    lineup.append((2, "reprise du jeu papier (ancienne série 5)", ORIG[5]["cards"], ORIG[5]["sol"], len(solve(ORIG[5]["cards"]))))
    n2b = full_constraints(NEW_GRIDS["n2b"])
    lineup.append((2, "nouvelle série maths&go", n2b, NEW_GRIDS["n2b"], len(solve(n2b))))
    lineup.append((2, "reprise du jeu papier (ancienne série 10)", ORIG[10]["cards"], ORIG[10]["sol"], 1))

    # ---- Niveau 3 : cartes partielles
    lineup.append((3, "reprise du jeu papier (ancienne série 2)", ORIG[2]["cards"], ORIG[2]["sol"], len(solve(ORIG[2]["cards"]))))
    lineup.append((3, "reprise du jeu papier (ancienne série 8)", ORIG[8]["cards"], ORIG[8]["sol"], len(solve(ORIG[8]["cards"]))))
    for key in ("n3d", "n3b", "n3c"):
        cards, ns = curated(key)
        lineup.append((3, "nouvelle série maths&go", cards, NEW_GRIDS[key], ns))

    # ---- Niveau 4 : expertes
    lineup.append((4, "reprise du jeu papier (ancienne série 9)", ORIG[9]["cards"], ORIG[9]["sol"], 1))
    for key in ("n4a", "n4b", "n4c", "n4e"):
        cards, ns = curated(key)
        lineup.append((4, "nouvelle série maths&go", cards, NEW_GRIDS[key], ns))

    # Niveau 1 : introduction progressive des indices négatifs. Les autres
    # niveaux restent rangés de la carte la plus bavarde à la plus concise.
    def n_negative(cards):
        return sum(v == "X" for c in cards.values() for v in c.values())

    def n_positive(cards):
        return sum(v == "P" for c in cards.values() for v in c.values())

    final = []
    for lvl in (1, 2, 3, 4):
        group = [x for x in lineup if x[0] == lvl]
        if lvl == 1:
            group.sort(key=lambda x: (n_negative(x[2]), -n_positive(x[2]), x[4]))
        else:
            group.sort(key=lambda x: (-n_infos(x[2]), x[4]))
        final.extend(group)
    return final

if __name__ == "__main__":
    final = build()
    out = []
    print(f"{'#':>2} {'niv':>3} {'infos':>5} {'sols':>4}  origine")
    for i, (lvl, note, cards, sol, ns) in enumerate(final, 1):
        # vérifs finales
        assert check(placement_of(sol), cards), f"série {i} : solution cible invalide !"
        real = solve(cards)
        assert len(real) == ns
        assert all(len(c) >= 1 for c in cards.values())
        print(f"{i:>2} {lvl:>3} {n_infos(cards):>5} {ns:>4}  {note}")
        out.append({"num": i, "level": lvl, "note": note, "cards": cards, "sol": sol, "n_sols": ns})
    SERIES_FILE.write_text(
        json.dumps(out, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"→ {SERIES_FILE}")
