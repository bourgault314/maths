#!/usr/bin/env python3
"""Construit les 20 séries : originales reclassées + reconstructions (3, 8) + nouvelles.

Niveaux :
  1 Découverte      : 1-2 infos par carte, surtout des chats « pleins »
  2 Cartes complètes: les 4 voisins sur chaque carte
  3 Cartes partielles: 2-3 infos par carte, au plus 2 placements justes
  4 Expertes        : le moins d'infos possible, placement unique
"""
import json
import random
from itertools import combinations, permutations
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

def make_level3(grid, tries=800):
    """2-3 infos/carte, ≤ 2 placements."""
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
        if not distinct_cards(cards):
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
    "n2a": G("310/042"),   # colonnes écartées
    "n3a": G("204/013"),   # coins + centre bas
    "n3b": G("130/402"),
    "n3c": G("041/320"),
    "n4a": G("102/340"),
    "n4b": G("013/240"),
    "n4c": G("310/024"),
    "n4d": G("230/104"),
    "r3":  G("204/310"),   # solution de la feuille pour l'ancienne série 3
    "r8":  G("400/123"),   # solution de la feuille pour l'ancienne série 8
}

def build():
    lineup = []  # (niveau, note_origine, cards, sol_grid, n_sols)

    # ---- Niveau 1 : découverte
    lineup.append((1, "série 1 d'origine", ORIG[1]["cards"], ORIG[1]["sol"], len(solve(ORIG[1]["cards"]))))
    lineup.append((1, "série 6 d'origine", ORIG[6]["cards"], ORIG[6]["sol"], len(solve(ORIG[6]["cards"]))))
    lineup.append((1, "série 7 d'origine", ORIG[7]["cards"], ORIG[7]["sol"], len(solve(ORIG[7]["cards"]))))
    for key in ("n1a", "n1b"):
        cards, ns = make_level1(NEW_GRIDS[key])
        lineup.append((1, "nouvelle", cards, NEW_GRIDS[key], ns))

    # ---- Niveau 2 : cartes complètes
    r3 = full_constraints(NEW_GRIDS["r3"])
    lineup.append((2, "série 3 d'origine, reconstituée", r3, NEW_GRIDS["r3"], len(solve(r3))))
    lineup.append((2, "série 4 d'origine", ORIG[4]["cards"], ORIG[4]["sol_alt"], len(solve(ORIG[4]["cards"]))))
    lineup.append((2, "série 5 d'origine", ORIG[5]["cards"], ORIG[5]["sol"], len(solve(ORIG[5]["cards"]))))
    n2a = full_constraints(NEW_GRIDS["n2a"])
    lineup.append((2, "nouvelle", n2a, NEW_GRIDS["n2a"], len(solve(n2a))))
    lineup.append((2, "série 10 d'origine (inventée par toi)", ORIG[10]["cards"], ORIG[10]["sol"], 1))

    # ---- Niveau 3 : cartes partielles
    lineup.append((3, "série 2 d'origine", ORIG[2]["cards"], ORIG[2]["sol"], len(solve(ORIG[2]["cards"]))))
    cards, ns = make_level3(NEW_GRIDS["r8"])
    lineup.append((3, "série 8 d'origine, reconstituée", cards, NEW_GRIDS["r8"], ns))
    for key in ("n3a", "n3b", "n3c"):
        cards, ns = make_level3(NEW_GRIDS[key])
        lineup.append((3, "nouvelle", cards, NEW_GRIDS[key], ns))

    # ---- Niveau 4 : expertes
    lineup.append((4, "série 9 d'origine (inventée par toi)", ORIG[9]["cards"], ORIG[9]["sol"], 1))
    for key in ("n4a", "n4b", "n4c", "n4d"):
        res = make_level4(NEW_GRIDS[key])
        if res is None:
            print(f"!! {key} : pas de solution unique en infos complètes, config à changer")
            continue
        cards, ns = res
        lineup.append((4, "nouvelle", cards, NEW_GRIDS[key], ns))

    # tri intra-niveau : de la plus bavarde à la plus muette
    final = []
    for lvl in (1, 2, 3, 4):
        group = [x for x in lineup if x[0] == lvl]
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
