# Audit « données reçues » (15/10/2026) : le contrôle d'usage, à jouer APRÈS
# preuve-donnees-recues.py. Les mêmes pages, avec une mémoire d'appareil
# NORMALE : ce que l'élève a vraiment enregistré doit revenir tel quel.
#
#   python3 -m http.server 8765   (à la racine du dépôt)
#   python3 _sources/liens-pieges/controle-donnees-recues.py
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"


def memoire(cles):
    return "try{" + "".join(f"localStorage.setItem({json.dumps(k)}, {json.dumps(json.dumps(v))});" for k, v in cles.items()) + "}catch(e){}"


def axelle(page):
    page.goto(BASE + "/axelle/j4/", wait_until="load")
    page.click("[data-subject=fr]")
    page.click("#start-quiz")
    for _ in range(5):
        page.click("#next-question")
        page.wait_for_timeout(120)
    page.wait_for_timeout(400)
    places = page.eval_on_selector_all(".placed-token", "els => els.map(e => e.textContent)")
    return f"étiquettes replacées : {places}"


def soley(page):
    page.goto(BASE + "/outils/club_maths/soley.html", wait_until="load")
    page.wait_for_timeout(600)
    return "accueil : " + page.inner_text("#hometot").replace("\n", " · ")


def bandes(page):
    page.goto(BASE + "/outils/fractions/bandes_fractions.html", wait_until="load")
    page.wait_for_timeout(400)
    page.click("#btn-session")
    page.select_option("#scene-list", "Séance test")
    page.click("#btn-scene-load")
    page.wait_for_timeout(600)
    n = page.evaluate("document.querySelectorAll('.strip[data-id]').length")
    dens = page.eval_on_selector_all(".strip .den", "els => [...new Set(els.map(e => e.textContent))]")
    return f"pièces montées : {n}, dénominateurs affichés : {dens}"


def disques(page):
    page.goto(BASE + "/outils/fractions/disques_fractions.html", wait_until="load")
    page.wait_for_timeout(400)
    page.click("#btn-session")
    page.select_option("#session-select", "Séance test")
    page.click("#btn-session-load")
    page.wait_for_timeout(600)
    n = page.evaluate("document.querySelectorAll('.strip[data-id]').length")
    return f"disques montés : {n}"


def atelier(page):
    page.goto(BASE + "/outils/club_maths/soley-atelier.html", wait_until="load")
    page.wait_for_timeout(400)
    page.click("#atbrouillons")
    page.wait_for_timeout(400)
    return "brouillons listés : " + page.eval_on_selector_all(".atliste .nom", "els => els.map(e => e.textContent)").__repr__()


REPONSES = {"answers": {str(i): {"correct": True, "value": ["Elle dépose les graines.", "Elle arrose."]} for i in range(20)}}
SCENE = {"version": 2, "nextId": 3, "topZ": 202, "selectedId": None, "pan": {"x": 0, "y": 0}, "scale": 1, "labelMode": "numeric",
         "tokens": [{"id": 1, "denom": 4, "kind": "piece", "side": "front", "x": 120, "y": 120, "z": 5, "hidden": False, "labelMode": "numeric"},
                    {"id": 2, "denom": 1, "kind": "band", "side": "front", "x": 120, "y": 240, "z": 6, "hidden": False, "labelMode": "numeric"}]}
SEANCE = {"meta": {"name": "Séance test", "updatedAt": "2026-10-15T00:00:00Z"},
          "data": {"version": 2, "app": "disques_fractions", "labelMode": "frac", "soundEnabled": False, "pan": {"x": 0, "y": 0}, "scale": 1, "nextId": 3,
                   "tokens": [{"id": 1, "z": 1, "denom": 3, "kind": "piece", "side": "front", "x": 120, "y": 120, "rot": 0, "slot": None, "hideLabel": False},
                              {"id": 2, "z": 2, "denom": 1, "kind": "disk", "side": "front", "x": 320, "y": 120, "rot": 0, "slot": None, "hideLabel": False}]}}
BROUILLON = {"v": 1, "courant": "brtest1", "liste": [{"id": "brtest1", "nom": "Mon essai", "maj": "2026-10-15T00:00:00.000Z", "origine": None,
                                                     "niveau": {"w": "lagon", "name": "Mon essai", "cols": 9, "rows": 6, "suns": [{"x": 0, "y": 0, "dir": 1}],
                                                                "targets": [{"x": 4, "y": 2, "need": [1, 2], "disp": "0,5"}], "rocks": [[2, 2]], "fruits": [], "gates": [], "fixed": [], "tools": [], "sol": []}}]}

CIBLES = [
    ("Axelle J4, réponse « dans l'ordre » enregistrée", {"axelle-j4-fr-progress": REPONSES}, axelle),
    ("Solèy, 1 fruit sur « Premier rayon »", {"soley-save-v5": {"done": {"lagon:Premier rayon": True}, "fruits": {"lagon:Premier rayon": 1}, "pieces": {"lagon:Premier rayon": 2}}}, soley),
    ("Bandes de fractions, scène de 2 pièces", {"fractionstrips_scenes_v1": {"Séance test": SCENE}}, bandes),
    ("Disques de fractions, séance de 2 disques", {"fraction_disks_sessions_v1": {"Séance test": SEANCE}}, disques),
    ("Atelier Solèy, un brouillon normal", {"soley-atelier-v1": BROUILLON}, atelier),
]

if __name__ == "__main__":
    with sync_playwright() as p:
        navigateur = p.chromium.launch(channel="chromium")
        for nom, cles, geste in CIBLES:
            contexte = navigateur.new_context()
            contexte.add_init_script(memoire(cles))
            page = contexte.new_page()
            erreurs = []
            page.on("pageerror", lambda e: erreurs.append(str(e)))
            print(f"{nom:48s} -> {geste(page)}" + (f"  [erreurs de page : {erreurs}]" if erreurs else ""))
            contexte.close()
        navigateur.close()
