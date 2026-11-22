# Modèle des gestes du soroban (une tige = 4 boules de 1 + 1 boule de 5).
# On ajoute/enlève un nombre de la gauche vers la droite, comme sur le boulier.
import itertools, random, statistics
def add_digit(rods, p, d, ev, carried=False):
    while len(rods) <= p+1: rods.append(0)
    a = rods[p]
    if a + d <= 9:
        direct = not (d < 5 and a < 5 and (a % 5) + d >= 5)
        ev.append(('D' if direct else 'P', p) if not carried else (('rD' if direct else 'rP'), p))
        rods[p] = a + d
    else:
        if carried and a == 9 and d == 1:
            ev.append(('CASC', p)); rods[p] = 0
            add_digit(rods, p+1, 1, ev, True); return
        c = 10 - d
        simple = not (c < 5 and a >= 5 and (a % 5) < c)
        ev.append(('R' if simple else 'RC', p))
        rods[p] = a + d - 10
        add_digit(rods, p+1, 1, ev, True)
def sub_digit(rods, p, d, ev, borrowed=False):
    a = rods[p]
    if a >= d:
        direct = not (d < 5 and a >= 5 and (a % 5) < d)
        ev.append(('d' if direct else 'p', p) if not borrowed else (('ed' if direct else 'ep'), p))
        rods[p] = a - d
    else:
        if borrowed and a == 0 and d == 1:
            ev.append(('casc', p)); rods[p] = 9
            sub_digit(rods, p+1, 1, ev, True); return
        c = 10 - d
        simple = not (c < 5 and a < 5 and (a % 5) + c >= 5)
        ev.append(('E' if simple else 'EC', p))
        rods[p] = a + c
        sub_digit(rods, p+1, 1, ev, True)
def gestes(termes):
    """termes : liste d'entiers signés. Renvoie (total, liste par terme des événements) ou None si sous-total < 0."""
    rods = [0]*12; total = 0; out = []
    for t in termes:
        ev = []
        v = abs(t); total += t
        if total < 0: return None
        ds = [int(x) for x in str(v)]
        n = len(ds)
        for i, d in enumerate(ds):
            if d == 0: continue
            p = n - 1 - i
            (add_digit if t > 0 else sub_digit)(rods, p, d, ev)
        out.append(ev)
    return total, out
def kinds(ev): return [k for k, _ in ev]
def flat(out): return [k for ev in out for k, _ in ev]
