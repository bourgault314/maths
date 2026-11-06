#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Refait TOUS les calculs écrits dans livret_litteral.html (sans rien installer) :

  - chaque collection de tuiles posée à côté d'une expression vaut bien cette expression ;
  - chaque grille dessinée avec des tuiles : tuiles du bord × tuiles du bord = tuiles de la case ;
  - chaque exemple corrigé : toutes les écritures séparées par « = » sont égales à l'énoncé ;
  - les grilles de multiplication (activité 7) et les grilles « triple distributivité » (exercices 4) ;
  - chaque grille du modèle d'aire (activité 8) a une solution (facteurs entiers ou en x) ;
  - les calculs des bilans, la substitution, l'exercice « repère l'erreur », Mali et Jayden, c = 3 ;
  - aucun exercice n'est écrit deux fois dans une même liste.

    python3 _sources/livret-litteral/verifier_calculs.py
"""
import re
import sys
from fractions import Fraction
from itertools import product
from pathlib import Path

SRC = (Path(__file__).resolve().parent / "livret_litteral.html").read_text(encoding="utf-8")
erreurs, faits = [], [0]


def ok(cond, msg):
    faits[0] += 1
    if not cond:
        erreurs.append(msg)


# ---------- polynômes en x : {degré: coefficient} ----------
def P(d):
    return {k: v for k, v in d.items() if v != 0}


def add(a, b):
    r = dict(a)
    for k, v in b.items():
        r[k] = r.get(k, 0) + v
    return P(r)


def mul(a, b):
    r = {}
    for i, u in a.items():
        for j, v in b.items():
            r[i + j] = r.get(i + j, 0) + u * v
    return P(r)


def neg(a):
    return {k: -v for k, v in a.items()}


def pw(a, n):
    r = {0: 1}
    for _ in range(n):
        r = mul(r, a)
    return r


def val(a, x):
    return sum(Fraction(v) * Fraction(x) ** k for k, v in a.items())


class Lecteur:
    """Expressions en x : + − × * ( ) ^ et produit implicite, comme on les écrit dans <m>."""

    def __init__(self, s):
        s = s.replace("−", "-").replace("×", "*").replace("²", "^2").replace("³", "^3").replace(" ", "")
        self.t = re.findall(r"\d+|[x()+\-*^]", s)
        if "".join(self.t) != s:
            raise ValueError("expression illisible : " + s)
        self.i = 0

    def voir(self):
        return self.t[self.i] if self.i < len(self.t) else None

    def prendre(self):
        self.i += 1
        return self.t[self.i - 1]

    def somme(self):
        r = {}
        signe = 1
        if self.voir() in "+-" if self.voir() else False:
            signe = -1 if self.prendre() == "-" else 1
        r = add(r, self.produit() if signe == 1 else neg(self.produit()))
        while self.voir() in ("+", "-"):
            s = self.prendre()
            t = self.produit()
            r = add(r, t if s == "+" else neg(t))
        return r

    def produit(self):
        r = self.puissance()
        while self.voir() is not None and (self.voir() == "*" or self.voir() in ("x", "(") or self.voir().isdigit()):
            if self.voir() == "*":
                self.prendre()
            if self.voir() == "-":  # 2 × (−2) écrit 2*-2
                self.prendre()
                r = mul(r, neg(self.puissance()))
            else:
                r = mul(r, self.puissance())
        return r

    def puissance(self):
        b = self.atome()
        if self.voir() == "^":
            self.prendre()
            b = pw(b, int(self.prendre()))
        return b

    def atome(self):
        t = self.prendre()
        if t == "(":
            r = self.somme()
            assert self.prendre() == ")"
            return r
        if t == "x":
            return {1: 1}
        if t.isdigit():
            return P({0: int(t)})
        if t == "-":
            return neg(self.puissance())
        raise ValueError("jeton inattendu " + t)


def E(s):
    lec = Lecteur(s)
    r = lec.somme()
    if lec.voir() is not None:
        raise ValueError("fin inattendue dans " + s)
    return r


# ---------- tuiles ----------
VALEUR = {"x2": {2: 1}, "x": {1: 1}, "xv": {1: 1}, "1": {0: 1}}


def tuile(mot):
    mot = mot.rstrip("!")
    n = mot.startswith("-")
    b = mot[1:] if n else mot
    if re.match(r"^Bv?:", b):
        v = E(b.split(":", 1)[1])
    else:
        v = VALEUR[b]
    return neg(v) if n else v


def tuiles(spec, barrees=False):
    r = {}
    for tok in spec.split():
        if tok in ("/", "|"):
            continue
        m = re.match(r"^(?:(\d+)x(\d+)|(\d+))\*(.+)$", tok)
        n, mot = (int(m.group(1)) * int(m.group(2)) if m.group(1) else int(m.group(3)), m.group(4)) if m else (1, tok)
        if mot.endswith("!") and not barrees:
            continue
        r = add(r, mul(P({0: n}), tuile(mot)))
    return r


def texte(html):
    return re.sub(r"<[^>]+>", "", html).replace("&nbsp;", " ").strip()


# ---------- 1. expression + collection de tuiles dans la même carte ----------
for m in re.finditer(r'<span class="enonce"><span class="num">(\d+)\)</span> <m>([^<]+)</m></span><div class="zone"><tl u="[\d.]+">([^<]+)</tl>', SRC):
    ok(E(m.group(2)) == tuiles(m.group(3)), f"activité 3 B {m.group(1)}) : les tuiles ne valent pas {m.group(2)}")

# tableaux de substitution : ligne d'exemple
for m in re.finditer(r'<tr class="ex"[^>]*><td[^>]*><span class="tagex">Exemple</span><m>([^<]+)</m></td><td><tl u="[\d.]+">([^<]+)</tl></td><td><m>([^<]+)</m></td><td>(?:<m>)?([^<]+)', SRC):
    expr, spec, calc, v = m.groups()
    ok(E(expr) == tuiles(spec), f"substitution : tuiles ≠ {expr}")
    table = SRC[SRC.rfind("Substitue <m>x = ", 0, m.start()):m.start()]
    x0 = int(re.search(r"x = (-?\d+)", table).group(1))
    for morceau in calc.split("="):
        ok(val(E(morceau), 0) == val(E(expr), x0), f"substitution {expr} pour x = {x0} : {morceau} faux")
    ok(val(E(expr), x0) == int(v.replace("-", "-")), f"substitution {expr} pour x = {x0} : valeur {v} fausse")

# ---------- 2. grilles de distributivité dessinées avec des tuiles ----------
for t in re.findall(r'<table class="dist"[^>]*>(.*?)</table>', SRC, re.S):
    entetes = re.findall(r"<th[^>]*>(.*?)</th>", re.search(r"<thead>(.*?)</thead>", t, re.S).group(1), re.S)[1:]
    lignes = re.findall(r"<tr>(.*?)</tr>", re.search(r"<tbody>(.*?)</tbody>", t, re.S).group(1), re.S)
    haut = [re.search(r"<tl[^>]*>([^<]+)</tl>", h) for h in entetes]
    for h, cel in zip(entetes, haut):
        lab = re.search(r'class="lab[^"]*">(.*?)</span>', h)
        if cel and lab:
            ok(E(texte(lab.group(1))) == tuiles(cel.group(1)), f"grille : étiquette {texte(lab.group(1))} ≠ ses tuiles")
    for ligne in lignes:
        g = re.search(r"<th[^>]*>(.*?)</th>", ligne, re.S).group(1)
        gt = re.search(r"<tl[^>]*>([^<]+)</tl>", g)
        lab = re.search(r'class="lab[^"]*">(.*?)</span>', g)
        if gt and lab:
            ok(E(texte(lab.group(1))) == tuiles(gt.group(1)), f"grille : étiquette {texte(lab.group(1))} ≠ ses tuiles")
        cases = re.findall(r"<td[^>]*>(.*?)</td>", ligne, re.S)
        for c, h in zip(cases, haut):
            ct = re.search(r"<tl[^>]*>([^<]+)</tl>", c)
            cv = re.search(r'class="val">(.*?)</span>', c)
            if gt and h and ct:
                ok(mul(tuiles(gt.group(1)), tuiles(h.group(1))) == tuiles(ct.group(1)),
                   f"grille : {gt.group(1)} × {h.group(1)} ≠ {ct.group(1)}")
            if gt and h and cv:
                ok(mul(tuiles(gt.group(1)), tuiles(h.group(1))) == E(texte(cv.group(1))), f"grille : case {texte(cv.group(1))} fausse")

# ---------- 3. exemples corrigés (cartes « Exemple ») ----------
for bloc in re.findall(r'<div class="carte ex">(.*?)<div class="repbox">(.*?)</div></div>', SRC, re.S):
    enonce = texte(re.search(r'<span class="enonce">(.*?)</span>\s*<div', bloc[0], re.S).group(1))
    enonce = re.sub(r"^Développer( et réduire)?\s*", "", enonce)
    rep = " ".join(texte(x) for x in re.findall(r"<m>(.*?)</m>", bloc[1]))
    for morceau in [p for p in rep.split("=") if p.strip()]:
        ok(E(morceau) == E(enonce), f"exemple {enonce} : « {morceau.strip()} » n'est pas égal")
    for t in re.findall(r'<table class="aire"[^>]*>(.*?)</table>', bloc[0], re.S):
        lig = [[texte(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)] for r in re.findall(r"<tr>(.*?)</tr>", t, re.S)]
        for r in lig[1:]:
            for h, c in zip(lig[0][1:], r[1:]):
                ok(mul(E(r[0]), E(h)) == E(c), f"exemple {enonce} : {r[0]} × {h} ≠ {c}")

# ---------- 4. activité 7 : grilles de multiplication ----------
for t in re.findall(r'<table class="mult">(.*?)</table>', SRC, re.S):
    lignes = re.findall(r"<tr[^>]*>(.*?)</tr>", t, re.S)
    entetes = [texte(h) for h in re.findall(r"<th[^>]*>(.*?)</th>", lignes[0], re.S)][1:]
    if "(" in "".join(entetes) and "a" in "".join(entetes):
        continue  # exercices 1 section E : deux lettres, rien d'écrit dedans
    f = None
    for l in lignes[1:]:
        th = re.search(r"<th[^>]*>(.*?)</th>", l, re.S)
        if th:
            f = texte(th.group(1))
        for h, c in zip(entetes, [texte(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", l, re.S)]):
            if c:
                ok(E(c) == mul(E(f), E(h)), f"activité 7 : case {c} ≠ {f} × ({h})")
                if "(" in c:
                    ok(c.replace(" ", "") == f"{f}({h})".replace(" ", ""), f"activité 7 : forme factorisée {c} mal écrite")

# ---------- 5. grilles « triple distributivité » et l'erreur à repérer ----------
erreurs_trouvees = []
for t in re.findall(r'<table class="aire tri"[^>]*>(.*?)</table>', SRC, re.S):
    lig = [[texte(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)] for r in re.findall(r"<tr>(.*?)</tr>", t, re.S)]
    for r in lig[1:]:
        for h, c in zip(lig[0][1:], r[1:]):
            if c and mul(E(r[0]), E(h)) != E(c):
                erreurs_trouvees.append(c)
ok(erreurs_trouvees == ["−24x".replace("x", "𝑥")] or erreurs_trouvees == ["-24x"] or [e.replace("−", "-") for e in erreurs_trouvees] == ["-24x"],
   f"exercices 4 : seule la case −24x (erreur voulue) doit être fausse, trouvé {erreurs_trouvees}")
ok(E("(x+1)(x-5)") == E("x^2-4x-5"), "exercices 4 E : (x+1)(x−5)")
ok(E("x^3-6x^2-4x^2-24x-5x+30") == E("x^3-10x^2-29x+30"), "exercices 4 E : le résultat faux doit suivre la case fausse")
ok(E("(x^2-4x-5)(x-6)") == E("x^3-10x^2+19x+30"), "exercices 4 E : corrigé")
ok(E("(x+2)(x+8)") == E("x^2+10x+16") and E("(x+8)(x+3)") == E("x^2+11x+24"), "Mali et Jayden")
ok(E("(x^2+10x+16)(x+3)") == E("(x+2)(x^2+11x+24)"), "Mali = Jayden")
ok(E("(x+4)(x+3)(x+2)") == E("x^3+9x^2+26x+24"), "exercices 4 E 2) : c = 3")
ok(all(E(f"(x+4)(x+{c})(x+2)") != E("x^3+9x^2+26x+24") for c in range(-20, 21) if c != 3), "exercices 4 E 2) : c unique")

# ---------- 6. activité 8 : chaque grille du modèle d'aire a une solution ----------
a8 = SRC[SRC.index('data-sur="Activité 8"'):SRC.index("BILANS")]
MONOMES = [P({k: c}) for k in (0, 1) for c in range(-60, 61) if c]
for t in re.findall(r'<table class="aire"[^>]*>(.*?)</table>', a8, re.S):
    (_, h1, h2), (f, p1, p2) = [[texte(c) for c in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)] for r in re.findall(r"<tr>(.*?)</tr>", t, re.S)]
    cand = lambda v: [E(v)] if v else MONOMES
    trouve = False
    for F in cand(f):
        for H1 in cand(h1):
            if p1 and mul(F, H1) != E(p1):
                continue
            for H2 in cand(h2):
                if not p2 or mul(F, H2) == E(p2):
                    trouve = True
                    break
            if trouve:
                break
        if trouve:
            break
    ok(trouve, f"activité 8 : grille impossible (× {h1} {h2} / {f} {p1} {p2})")
ok(E("4(1-6x)") == E("4-24x"), "activité 8 : grille corrigée 4(1 − 6x)")

# ---------- 7. listes d'exercices : pas de doublon ----------
for page in re.findall(r'<section class="page"(.*?)</section>', SRC, re.S):
    items = re.findall(r'<span class="n">(\d+)\)</span><m>([^<]+)</m>', page)
    vus = {}
    for n, e in items:
        cle = e.replace(" ", "").rstrip("=")
        ok(cle not in vus or vus[cle] == n, f"exercice écrit deux fois : {e} (n° {vus.get(cle)} et {n})")
        vus.setdefault(cle, n)

# ---------- 8. bilans, substitution, activité 3 ----------
ok(E("2x^2+x+3-x^2-3x-1") == E("x^2-2x+2"), "bilan réduire")
ok(tuiles("x2 2*-x 2*1") == E("x^2-2x+2"), "bilan réduire : tuiles restantes")
for x0, e, v in [(-2, "x", -2), (-2, "-x", 2), (-2, "x^2", 4), (-2, "-x^2", -4), (-2, "x^2-x+3", 9)]:
    ok(val(E(e), x0) == v, f"bilan substituer : {e} pour x = {x0}")
ok(E("2(x+3)") == E("2x+6"), "bilan distributivité simple")
ok(E("(2x+1)(x-2)") == E("2x*x+2x*(-2)+1*x+1*(-2)") == E("2x^2-4x+x-2") == E("2x^2-3x-2"), "bilan double distributivité")
ok(E("-4x+x") == E("-3x"), "bilan double distributivité : réduction")
ok(E("x+2-1") == E("x+2+(-1)") == E("x+1"), "bilan enlever 1")
ok(E("x+2-x") == E("x+2+(-x)") == E("2"), "bilan enlever +x")
ok(E("-x+3-(-x)") == E("-x+3+x") == E("3"), "bilan enlever −x")
ok(E("2x+3x^2+6x^2+5x") == E("9x^2+7x"), "activité 3 D : l'affirmation est bien fausse")
ok(tuiles("4*x 2*-x 4*1 -1") == E("4x-1-2x+4"), "activité 3 A schéma 1")
ok(tuiles("10*x 4*x2 7*-x") == E("10x+4x^2-7x"), "activité 3 A schéma 2")
ok(tuiles("2x3*x -x 5*1 2*-1") == E("6x-x+5-2"), "activité 3 A schéma 3")
ok(val(E("6-2x"), 3) == 0 and val(E("4x+5"), 3) == 17, "activité 2 A : les deux nouvelles expressions")
schemas = ["3*1 -x2", "3*x 3*1", "3*x", "1 -x 2*1", "x 3*1", "x 3*-1"]
ok(sorted(str(sorted(tuiles(s).items())) for s in schemas) == sorted(str(sorted(E(e).items())) for e in ["3x", "3-x", "3-x^2", "3x+3", "3+x", "x-3"]),
   "activité 1 A : chaque expression a exactement un schéma")
ok(E("2x+3x^2") != E("16x^6"), "")

if erreurs:
    print("ERREURS :\n  " + "\n  ".join(erreurs))
    sys.exit(1)
print(f"{faits[0]} vérifications, toutes justes.")
