# Écrit tests/flash-anzan-gestes-reference.json : des calculs tirés au hasard
# (graine fixe) et, pour chacun, les gestes que le modèle soroban.py y voit.
# Le test tests/flash-anzan-etapes.test.mjs vérifie que le moteur de l'appli
# (gestes() de flash_anzan_core.js) rend exactement la même chose : c'est la
# preuve que le modèle du barème a été porté sans erreur.
#   python3 _sources/anzan-bareme/generer_reference.py
import json, os, random, sys
ici = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ici)
from soroban import gestes

r = random.Random(20261122)
lignes = []
for k in range(600):
    largeur = r.choice((1, 1, 1, 2, 2, 3, 3, 4, 6))
    combien = r.choice((2, 2, 3, 3, 4, 5, 7, 10, 15))
    avec_moins = k % 3 != 0
    termes = []
    for i in range(combien):
        v = r.randint(10 ** (largeur - 1), 10 ** largeur - 1)
        termes.append(-v if (i > 0 and avec_moins and r.random() < 0.4) else v)
    g = gestes(termes)
    lignes.append({"t": termes, "g": None if g is None else ["".join(f"{code}{p} " for code, p in ev).strip() for ev in g[1]],
                   "s": None if g is None else g[0]})
sortie = os.path.join(ici, "..", "..", "tests", "flash-anzan-gestes-reference.json")
with open(sortie, "w", encoding="utf-8", newline="\n") as f:
    f.write("[\n" + ",\n".join(json.dumps(l, separators=(",", ":")) for l in lignes) + "\n]\n")
print(len(lignes), "calculs,", sum(1 for l in lignes if l["g"] is None), "refusés (total sous zéro)")
