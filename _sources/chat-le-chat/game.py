#!/usr/bin/env python3
"""Chat, c'est toi le chat ! — modèle du jeu + solveur.

Grille : 2 rangées x 3 colonnes de zones circulaires. Tous les joueurs regardent
vers le "haut" (rangée 0 = rangée avant). 4 joueurs, 2 zones vides.

Carte d'un joueur : contraintes sur les 4 voisins orthogonaux :
  'P' = un chat (quelqu'un est là)
  'X' = chat barré (personne : zone vide OU hors grille)
  absent = aucune information
"""
from itertools import permutations

ROWS, COLS = 2, 3
DIRS = {"front": (-1, 0), "back": (1, 0), "left": (0, -1), "right": (0, 1)}

# ---------------------------------------------------------------- transcription
# sol : grille [rangée avant, rangée arrière], 0 = zone vide, n = joueur n
SERIES = {
    1: {
        "cards": {
            1: {"front": "P"},
            2: {"back": "P"},
            3: {"right": "P", "back": "X"},
            4: {"left": "P", "back": "X"},
        },
        "sol": [[3, 2, 0], [0, 1, 4]],
    },
    2: {
        "cards": {
            1: {"right": "P", "back": "X"},
            2: {"back": "P"},
            3: {"front": "P", "left": "X", "right": "P"},
            4: {"front": "X", "left": "P", "back": "X"},
        },
        "sol": [[1, 2, 0], [0, 3, 4]],
    },
    3: {  # cartes manquantes (photo à venir) — solution seule
        "cards": None,
        "sol": [[2, 0, 4], [3, 1, 0]],
    },
    4: {
        "cards": {
            1: {"front": "P", "left": "P", "right": "X", "back": "X"},
            2: {"front": "P", "left": "X", "right": "P", "back": "X"},
            3: {"front": "X", "left": "P", "right": "X", "back": "P"},
            4: {"front": "X", "left": "X", "right": "P", "back": "P"},
        },
        # feuille manuscrite : [[0,3,4],[0,2,1]] "ou" [[3,4,0],[2,1,0]]
        "sol": [[0, 3, 4], [0, 2, 1]],
        "sol_alt": [[0, 4, 3], [0, 2, 1]],  # hypothèse : 3/4 inversés sur la feuille
    },
    5: {
        "cards": {
            1: {"front": "P", "left": "X", "right": "X", "back": "X"},
            2: {"front": "P", "left": "X", "right": "X", "back": "X"},
            3: {"front": "X", "left": "X", "right": "X", "back": "P"},
            4: {"front": "X", "left": "X", "right": "X", "back": "P"},
        },
        "sol": [[4, 0, 3], [1, 0, 2]],
    },
    6: {
        "cards": {
            1: {"right": "P", "back": "X"},
            2: {"back": "P"},
            3: {"front": "P", "left": "X"},
            4: {"front": "X", "left": "P", "back": "X"},
        },
        "sol": [[2, 0, 0], [3, 1, 4]],
    },
    7: {
        "cards": {
            1: {"front": "P", "right": "X"},
            2: {"right": "P", "back": "X"},
            3: {"left": "P", "back": "X"},
            4: {"left": "P"},
        },
        "sol": [[2, 4, 3], [0, 1, 0]],
    },
    8: {  # cartes manquantes (photo à venir) — solution seule (lecture incertaine r1c2)
        "cards": None,
        "sol": [[4, 0, 0], [1, 2, 3]],
    },
    9: {
        "cards": {
            1: {"front": "X", "left": "X", "right": "X", "back": "X"},
            2: {"back": "P"},
            3: {"front": "P", "right": "P"},
            4: {"right": "X"},
        },
        "sol": [[2, 0, 1], [3, 4, 0]],
    },
    10: {
        "cards": {
            1: {"front": "X", "left": "X", "right": "P", "back": "P"},
            2: {"front": "X", "left": "X", "right": "P", "back": "X"},
            3: {"front": "X", "left": "P", "right": "X", "back": "X"},
            4: {"front": "P", "left": "P", "right": "X", "back": "X"},
        },
        "sol": [[0, 1, 3], [2, 4, 0]],
    },
}


def check(placement, cards):
    """placement : dict joueur -> (r, c). Vérifie toutes les cartes."""
    occupied = set(placement.values())
    for player, cons in cards.items():
        r, c = placement[player]
        for d, want in cons.items():
            dr, dc = DIRS[d]
            nr, nc = r + dr, c + dc
            inside = 0 <= nr < ROWS and 0 <= nc < COLS
            somebody = inside and (nr, nc) in occupied
            if want == "P" and not somebody:
                return False
            if want == "X" and somebody:
                return False
    return True


def solve(cards):
    cells = [(r, c) for r in range(ROWS) for c in range(COLS)]
    sols = []
    for perm in permutations(cells, 4):
        placement = dict(zip([1, 2, 3, 4], perm))
        if check(placement, cards):
            sols.append(placement)
    return sols


def grid_of(placement):
    g = [[0] * COLS for _ in range(ROWS)]
    for p, (r, c) in placement.items():
        g[r][c] = p
    return g


def placement_of(grid):
    return {grid[r][c]: (r, c) for r in range(ROWS) for c in range(COLS) if grid[r][c]}


def fmt(g):
    return " / ".join(" ".join(str(x) if x else "." for x in row) for row in g)


if __name__ == "__main__":
    for num, s in SERIES.items():
        if s["cards"] is None:
            print(f"Série {num:>2} : cartes manquantes — solution feuille : {fmt(s['sol'])}")
            continue
        sols = solve(s["cards"])
        sheet_ok = check(placement_of(s["sol"]), s["cards"])
        line = f"Série {num:>2} : {len(sols):>2} solution(s) ; feuille [{fmt(s['sol'])}] {'OK' if sheet_ok else 'INVALIDE'}"
        if "sol_alt" in s:
            alt_ok = check(placement_of(s["sol_alt"]), s["cards"])
            line += f" ; alt [{fmt(s['sol_alt'])}] {'OK' if alt_ok else 'INVALIDE'}"
        print(line)
        for p in sols:
            print("      ", fmt(grid_of(p)))
