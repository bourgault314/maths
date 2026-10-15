# Audit « données reçues » (15/10/2026), volet 2 du chantier sécurité des pages :
# une page qui relit la MÉMOIRE DE L'APPAREIL (localStorage) et en écrit un
# morceau dans son HTML ne doit jamais l'écrire tel quel. Ce script joue le
# scénario sur une copie du site servie en local (python3 -m http.server 8765 à
# la racine du dépôt) : il écrit dans la mémoire ce qu'un programme piégé y
# mettrait, ouvre la page, fait le geste de l'élève, et compte combien de fois
# le programme piège a tourné. Avant le lot : il tourne ; après : 0 partout.
#
#   pip install playwright==1.56.0      (le Chromium complet : channel="chromium")
#   python3 _sources/liens-pieges/preuve-donnees-recues.py
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"
PIEGE = '<img src=x onerror="window.__pirate=(window.__pirate||0)+1">'


def memoire(cles, onglet=None):
    """Le script d'amorçage : la mémoire telle qu'un pirate l'aurait laissée
    (localStorage = l'appareil ; onglet = sessionStorage, valeurs texte)."""
    lignes = [f"localStorage.setItem({json.dumps(k)}, {json.dumps(json.dumps(v))});" for k, v in cles.items()]
    lignes += [f"sessionStorage.setItem({json.dumps(k)}, {json.dumps(v)});" for k, v in (onglet or {}).items()]
    return "try{" + "".join(lignes) + "}catch(e){}"


def axelle(page):
    # Jour 4, français : la question 6 (index 5) est « remets dans l'ordre » ;
    # toutes les réponses sont « déjà données », la 6e avec le piège.
    page.goto(BASE + "/axelle/j4/", wait_until="load")
    page.click("[data-subject=fr]")
    page.click("#start-quiz")
    for _ in range(5):
        page.click("#next-question")
        page.wait_for_timeout(150)
    page.wait_for_timeout(800)


def soley(page):
    page.goto(BASE + "/outils/club_maths/soley.html", wait_until="load")
    page.wait_for_timeout(800)


def soley_v1(page):
    page.goto(BASE + "/outils/club_maths/soley-v1.html", wait_until="load")
    page.wait_for_timeout(800)


def bandes(page):
    page.goto(BASE + "/outils/fractions/bandes_fractions.html", wait_until="load")
    page.wait_for_timeout(500)
    page.click("#btn-session")
    page.select_option("#scene-list", "piège")
    page.click("#btn-scene-load")
    page.wait_for_timeout(800)


def disques(page):
    page.goto(BASE + "/outils/fractions/disques_fractions.html", wait_until="load")
    page.wait_for_timeout(500)
    page.click("#btn-session")
    page.select_option("#session-select", "piège")
    page.click("#btn-session-load")
    page.wait_for_timeout(800)


def atelier(page):
    page.goto(BASE + "/outils/club_maths/soley-atelier.html", wait_until="load")
    page.wait_for_timeout(500)
    page.click("#atbrouillons")
    page.wait_for_timeout(800)


# Témoins (source 1, les réponses du serveur) : un onglet qui tient un code, et
# un faux serveur de suivi qui répond un prénom et une classe piégés. Le prénom
# doit s'afficher en TEXTE (« <img… » lisible dans le repère), jamais tourner.
CODE = "A2B3C4"
IDENTITE = {"mathsgo-suivi-code": CODE}


def faux_serveur(route):
    chemin = route.request.url.split("suivi.mathsgo.re", 1)[1]
    if chemin.startswith("/api/eleve.php"):
        corps = {"ok": True, "prenom": PIEGE, "classe": "6e " + PIEGE, "reglages": {"splat": {"mondes": None}}}
    elif chemin.startswith("/api/parcours.php"):
        corps = {"ok": True, "existe": False, "revision": 0}
    else:
        corps = {"ok": False}
    route.fulfill(status=200, content_type="application/json", body=json.dumps(corps))


def temoin(chemin, selecteur):
    def geste(page):
        page.route("https://suivi.mathsgo.re/**", faux_serveur)
        page.goto(BASE + chemin, wait_until="load")
        page.wait_for_timeout(1500)
        texte = page.evaluate(f"(document.querySelector({json.dumps(selecteur)}) || {{}}).textContent || ''")
        geste.texte = texte
    return geste


TEMOINS = [
    ("Témoin Défi tables (prénom piégé rendu par le serveur)", "/outils/calcul_mental/defi_tables.html", "#suivi-repere"),
    ("Témoin Défi calcul (prénom piégé rendu par le serveur)", "/outils/calcul_mental/defi_calcul_modules.html", "#suivi-repere"),
    ("Témoin carte des mondes (prénom piégé rendu par le serveur)", "/outils/splat_univers.html", "#suivi-repere"),
]

REPONSES_AXELLE = {"answers": {str(i): {"correct": False, "value": [PIEGE]} for i in range(20)}}

CIBLES = [
    ("Axelle J4 (réponse « dans l'ordre » enregistrée)", {"axelle-j4-fr-progress": REPONSES_AXELLE}, axelle),
    ("Solèy (compte de fruits de la sauvegarde)", {"soley-save-v5": {"done": {}, "fruits": {"lagon:Premier rayon": PIEGE}, "pieces": {}}}, soley),
    ("Solèy v1, page non reliée (même sauvegarde)", {"soley-save-v5": {"done": {}, "fruits": {"lagon:Premier rayon": PIEGE}}}, soley_v1),
    ("Bandes de fractions (scène enregistrée, dénominateur)", {"fractionstrips_scenes_v1": {"piège": {
        "version": 2, "tokens": [{"id": 1, "denom": PIEGE, "kind": "piece", "side": "front", "x": 120, "y": 120, "z": 5, "hidden": False, "labelMode": "numeric"}],
        "nextId": 2, "topZ": 201, "selectedId": None, "pan": {"x": 0, "y": 0}, "scale": 1, "labelMode": "numeric"}}}, bandes),
    ("Disques de fractions (séance enregistrée, dénominateur)", {"fraction_disks_sessions_v1": {"piège": {
        "meta": {"name": "piège", "updatedAt": "2026-10-15T00:00:00Z"},
        "data": {"version": 2, "app": "disques_fractions", "labelMode": "frac", "soundEnabled": False, "pan": {"x": 0, "y": 0}, "scale": 1, "nextId": 2,
                 "tokens": [{"id": 1, "z": 1, "denom": PIEGE, "kind": "piece", "side": "front", "x": 120, "y": 120, "rot": 0, "slot": None, "hideLabel": False}]}}}}, disques),
    ("Atelier Solèy, outil interne (identifiant d'un brouillon)", {"soley-atelier-v1": {"v": 1, "courant": None, "liste": [
        {"id": 'x">' + PIEGE, "nom": "Essai", "maj": "2026-10-15T00:00:00.000Z", "origine": None, "niveau": {"w": "lagon", "name": "Essai", "cols": 9, "rows": 6}}]}}, atelier),
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
            try:
                geste(page)
                n = page.evaluate("window.__pirate || 0")
            except Exception as e:  # un geste impossible compte comme « pas prouvé »
                n = f"geste impossible ({type(e).__name__})"
            print(f"{nom:62s} -> programme piège exécuté : {n} fois" + (f"  [erreurs de page : {len(erreurs)}]" if erreurs else ""))
            contexte.close()
        for nom, chemin, selecteur in TEMOINS:
            contexte = navigateur.new_context()
            contexte.add_init_script(memoire({}, IDENTITE))
            page = contexte.new_page()
            geste = temoin(chemin, selecteur)
            geste(page)
            n = page.evaluate("window.__pirate || 0")
            affiche = "<img" in geste.texte
            print(f"{nom:62s} -> programme piège exécuté : {n} fois ; le prénom s'affiche en texte : {'oui' if affiche else 'non'}")
            contexte.close()
        navigateur.close()
