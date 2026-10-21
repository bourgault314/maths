#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Les histoires de SPLAT! — livret 2 (niveau 2, H6 à H10 ; 8 pages A4, à plier en A3), et ses trois corrigés.

Vingt problèmes rédigés (problemes.py, écrits le 15/10/2026 d'après le § 7 de la progression) ; chacun CACHE une carte
de l'outil outils/splat.html (graines.py : l'adresse et la graine qui tirent exactement ses
nombres). Les corrigés sont dessinés PAR L'OUTIL, sur la carte cachée, avec un habillage posé au
rendu (habit.js, habillage.py) : les noms de l'histoire à la place des couleurs des taches, ses
phrases à la place de « la tache … cache … jetons », une seule teinte (le vert du livret). L'outil
n'est pas modifié. Les deux problèmes du dos (« Le défi ! ») n'ont pas de carte : leurs schémas
sont faits des mêmes briques (corrige.js, __defi).

    python3 render.py                 le livret de l'élève et ses deux corrigés
    python3 render.py --eleve         seulement le livret de l'élève
    python3 render.py --correction    seulement les deux corrigés

Le dépôt du site (pour l'outil, les polices, les logos) : la variable MATHS_RACINE, sinon les deux
dossiers au-dessus de celui-ci (quand ce dossier sera _sources/livret-splat-histoires/).
Les PDF : dans HISTOIRES_SORTIE, sinon dans le dossier « pdf » à côté de ce script.

Les PDF se rendent sous Linux, avec le vrai Chromium (channel="chromium") : comme tous les livrets
SPLAT!, l'écriture des cartes est DejaVu Sans (Segoe UI sous Windows changerait les largeurs).
Dépendances : playwright 1.56.0 (+ chromium), pikepdf ; qpdf s'il est là.
"""
import asyncio, functools, html, http.server, json, os, socketserver, sys, tempfile, threading
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = Path(os.environ.get("MATHS_RACINE") or ICI.parent.parent).resolve()
SORTIE = Path(os.environ.get("HISTOIRES_SORTIE") or ICI / "pdf").resolve()
PORT = int(os.environ.get("PORT", "8131"))
BASE = "/_histoires"                    # ce dossier, servi à côté du dépôt
sys.path.insert(0, str(ICI))
from problemes import EXEMPLE, FICHES, DEFI     # noqa: E402
from graines import CARTES                      # noqa: E402
from habillage import H                         # noqa: E402

# ------------------------------------------------------------------------------------------
# Ce que décide le livret (07-08/10/2026, questions à choix de Gwenaël)
TITRE = "Les histoires de SPLAT!"
SUR = "Mon livret · Partie 2"
ACCROCHE = "Mais où est la tache&nbsp;?"   # seule, sans phrase dessous (Gwenaël, 08/10/2026)
NOM_FICHIER = "Les-histoires-de-SPLAT-livret-2"
TEINTE = ["#15803d", "rgba(21,128,61,0.16)"]     # le vert du livret (barres du corrigé : une seule teinte)
PIED = "mathsgo.re/splat · CC BY-NC-SA 4.0"
# Les fiches s'appellent H1 à H5 (H pour Histoires, 08/10/2026) : Petit SPLAT! a déjà ses fiches 1 à 6 ;
# le livret 2 continuera à H6.
NUMERO = "H"
MONDES = {"6": "Comme le monde 3<br>SPLAT! Enquête", "7": "Comme le monde 3<br>SPLAT! Enquête",
          "8": "Comme le monde 3<br>SPLAT! Enquête, 2e tour", "9": "Comme les mondes 5 et 3<br>Équations · Enquête", "10": "Comme le monde 4<br>SPLAT! Système"}
RESUMES = {"6": "Trois quantités : laquelle sert de référence ?", "7": "Le double, la moitié ; des rapports en chaîne.",
           "8": "« 5 de plus que le double », deux réunies…", "9": "Des paquets à regrouper, puis à retourner.", "10": "Trois articles, trois achats, trois paires."}
# Fiche H5 (Système) : l'outil met toujours le grand achat en premier ; les énoncés de 5.1, 5.3 et
# 5.4 donnent le petit d'abord. Choisi par Gwenaël le 08/10/2026 sur planche
# (planche-fiche5-ordre.png) : « Les deux achats » dans l'ORDRE DE L'ÉNONCÉ — l'élève retrouve son
# propre dessin. Seul ce premier schéma change (et « 36 + 34 » devient « 34 + 36 »).
INVERSER = {"10.1"}
CORRECTIONS = [dict(suffixe="-corrige", lettre=False, dit="inconnue «&nbsp;?&nbsp;»"),
               dict(suffixe="-corrige-lettre", lettre=True, dit="inconnue en lettre"),
               # (08/10/2026, choisi par Gwenaël sur planche) sans schéma : ① l'inconnue, ② l'équation, ③ je résous
               dict(suffixe="-corrige-equations", lettre=True, equation=True, dit="en équations")]

# La page 2 : les légendes des dessins du pas à pas (par titre de l'outil, habillé)
LEGENDES_EX = {
    "Schéma de comparaison": "Une barre pour chacun. Les deux indices parlent de Lila&nbsp;: c'est elle la référence, la plus grande.",
    "Schéma regroupé": "Je complète Noa et Tom jusqu'à Lila, puis je mets les trois barres bout à bout&nbsp;: 64 + 7 + 4 = 75.",
    "Je complète": "Je complète Noa et Tom jusqu'à Lila&nbsp;: 7 et 4 coquillages en plus, en haut et en bas.",
    "Je partage": "Je trouve les coquillages de Lila.",
    "Je trouve les autres": "Noa, c'est Lila moins 7&nbsp;; Tom, c'est Lila moins 4.",
}
# (21/10/2026, lot B, décision de Gwenaël après l'audit du 21/10) « Je vérifie » de la page 2 : le total ET chaque
# indice, comme les corrigés des fiches depuis le lot A ; la première ligne est celle de l'outil (contrôlé au rendu)
VERIFS_EXEMPLE = ["18 + 21 + 25 = 64", "25 − 18 = 7", "25 − 21 = 4"]
def ligne_vraie(t):
    """« 18 + 21 + 25 = 64 », « 18 = 2 × 9 » : chaque membre vaut le même nombre."""
    e = t.replace("✓", "").replace("−", "-").replace("×", "*").replace("÷", "/").strip()
    v = [eval(m, {}, {}) for m in e.split("=")]
    return len(v) > 1 and all(abs(x - v[0]) < 1e-9 for x in v)
assert all(ligne_vraie(t) for t in VERIFS_EXEMPLE), VERIFS_EXEMPLE

# Le dos : les deux problèmes « avant / après » et leurs schémas (mêmes briques que l'outil)
# « ? » (𝑥 en lettre) ne désigne qu'UNE quantité, celle qu'on cherche (le défi 1 : l'argent du matin) ;
# les autres quantités sont écrites avec leur nom (« à midi », « Nina », « Paul »). Remarque de Gwenaël
# du 08/10/2026 : au défi 2, 𝑥 valait 25, 33 et 17 dans le même corrigé.
DEFI_SCHEMAS = {
    "D3": dict(etapes=[
        dict(titre="Mardi matin : ce qu'il restait après l'arrosage, et les 25 L de l'orage",
             barres=[dict(parts=[dict(v=22, t="reste", cache=True), dict(v=25)], calcul="après l'arrosage : 47 − 25 = 22", sous=["", "l'orage"])]),
        dict(titre="Lundi matin : ce qu'il restait, et ce qu'Hugo a puisé",
             barres=[dict(parts=[dict(v=22), dict(v=16, t="?", cache=True)], calcul="? = 38 − 22 = 16", sous=["il restait", "puisé"])]),
    ], habit=dict(noms={16: "puisé"}, reponse="Hugo a puisé {puisé} L d'eau.", verifs=["38 − 16 + 25 = 47 ✓"])),
    "D4": dict(etapes=[
        dict(titre="Le matin, puis le soir : ce qu'il reste, la dépense, et le don (2 fois la dépense)",
             barres=[dict(parts=[dict(v=27, t="reste", cache=True), dict(v=9, t="?", cache=True)], calcul="le matin : 36 €", sous=["ce qu'il reste", "dépensé"]),
                     dict(parts=[dict(v=27, t="reste", cache=True), dict(v=9, t="?", cache=True), dict(v=9, t="?", cache=True)], calcul="le soir : 45 €", sous=["ce qu'il reste", "le don", ""])]),
        dict(titre="Du matin au soir, il y a une dépense de plus",
             barres=[dict(parts=[dict(v=36), dict(v=9, t="?", cache=True)], calcul="? = 45 − 36 = 9", sous=["le matin", "une dépense"])]),
        dict(titre="Le don : 2 fois la dépense",
             barres=[dict(totalTexte="don", parts=[dict(v=9), dict(v=9)], calcul="don : 2 × 9 = 18")]),
    ], habit=dict(noms={9: "dépensé", 18: "reçu"}, reponse="Lina a dépensé {dépensé} €, sa grand-mère lui a donné {reçu} €.",
                  verifs=["36 − 9 + 18 = 45 ✓", "18 = 2 × 9 ✓"])),
}

# Les défis du dos, en équations (corrigé « en équations ») : écrits ici, vérifiés au rendu
DEFI_EQUATIONS = {
    "D3": dict(blocs=[["Je choisis l’inconnue", ["𝑥 : l’eau puisée par Hugo, en L"]],
                      ["J’écris l’équation", ["38 − 𝑥 + 25 = 47"]],
                      ["Je résous", ["63 − 𝑥 = 47", "𝑥 = 63 − 47 = 16"]]],
               habit=dict(noms={16: "puisé"}, reponse="Hugo a puisé {puisé} L d'eau.", verifs=["38 − 16 + 25 = 47 ✓"]),
               x=16, controle=lambda x: 38 - x + 25 == 47),
    "D4": dict(blocs=[["Je choisis l’inconnue", ["𝑥 : ce que Lina a dépensé, en €", "Le don : 2 × 𝑥"]],
                      ["J’écris l’équation", ["36 − 𝑥 + 2 × 𝑥 = 45"]],
                      ["Je résous", ["36 + 𝑥 = 45", "𝑥 = 45 − 36 = 9", "Le don : 2 × 9 = 18"]]],
               habit=dict(noms={9: "dépensé", 18: "reçu"}, reponse="Lina a dépensé {dépensé} €, sa grand-mère lui a donné {reçu} €.",
                          verifs=["36 − 9 + 18 = 45 ✓", "18 = 2 × 9 ✓"]),
               x=9, controle=lambda x: 36 - x + 2 * x == 45),
}
for _c, _d in DEFI_EQUATIONS.items():
    assert _d["controle"](_d["x"]), _c
# (lot B, 21/10/2026) « Je vérifie » des défis : chaque ligne est vraie (le total et le double du défi 2)
for _c, _d in list(DEFI_SCHEMAS.items()) + list(DEFI_EQUATIONS.items()):
    assert all(ligne_vraie(t) for t in _d["habit"].get("verifs", [])), (_c, _d["habit"].get("verifs"))

# « On cherche le tout » (17/10/2026) et les défis du dos : une page de l'outil pour dessiner (aucune carte n'est tirée)
CARTE_TOUT = CARTES["6.1"][1]

# (17/10/2026) Les corrigés serrés : « Je vérifie » vérifie aussi chaque indice, et quelques énoncés ont
# grandi d'une ligne. SERRE : les blancs entre ①, ② et ③ tombent à 0 (corrigés de l'Enquête). PLANCHER : la
# plus petite écriture du dessin, en unités de l'outil, pour qu'elle fasse au moins 4,5 pt sur le papier à
# l'échelle de sa carte (lue dans rapport-mise-en-page.json) — le contrôle du rendu (4,5 pt) reste juge.
SERRE = {"9.3"}
PLANCHER = {"10.3": dict(schema=35, equations=38)}     # l’escalier : 4,2 pt avant (petits calculs), 4,4 pt en équations
def serrage(code, quoi):
    return dict(serre=code in SERRE, plancher=PLANCHER.get(code, {}).get(quoi))

# ------------------------------------------------------------------------------------------
def serveur():
    class Gestion(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
        def translate_path(self, path):
            p = path.split("?", 1)[0].split("#", 1)[0]
            if p.startswith(BASE + "/"):
                return str(ICI / p[len(BASE) + 1:])
            return str(RACINE / p.lstrip("/"))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Gestion, directory=str(RACINE)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def nb(s):
    """Le texte d'un énoncé : échappé, espaces insécables devant : ; ? ! et les unités."""
    s = html.escape(s, quote=False)
    for a in [" ?", " :", " ;", " !", " €", " kg", " cL", " L ", " L.", " min", " ans", " cm", " m²", " m ", " m.", " points"]:
        s = s.replace(a, "&nbsp;" + a[1:])
    return s.replace("-t-", "‑t‑").replace("a-t-elle", "a‑t‑elle").replace("a-t-il", "a‑t‑il")

def probleme(code):
    if code == "Ex":
        return EXEMPLE
    for f in FICHES:
        for p in f[3]:
            if p["code"] == code:
                return p
    for p in DEFI:
        if p["code"] == code:
            return p
    raise KeyError(code)

def habit_js(code):
    h = dict(H[code])
    h["noms"] = {str(k): v for k, v in h["noms"].items()}
    h["teinte"] = TEINTE
    return h

# ------------------------------------------------------------------------------------------
# 1. Ce que l'outil dessine
async def dessins_outil(nav, lettres, equations=False):
    """Pour chaque problème, le corrigé « ? » (et en lettre si demandé) ; l'exemple de la page 2 ;
    les deux défis du dos."""
    pg = await nav.new_page(viewport={"width": 1200, "height": 900})
    js = (ICI / "habit.js").read_text(encoding="utf-8") + "\n;0"
    js2 = (ICI / "corrige.js").read_text(encoding="utf-8") + "\n;0\n" + (ICI.parent / "tout.js").read_text(encoding="utf-8") + "\n;0"

    async def ouvrir(q, lettre):
        await pg.goto(f"http://127.0.0.1:{PORT}/outils/splat.html?{q}&unknown={'letter' if lettre else 'question'}", wait_until="networkidle")
        await pg.wait_for_timeout(250)
        await pg.evaluate(js); await pg.evaluate(js2)

    async def valeurs(fam, graine):
        return await pg.evaluate("""([fam, g]) => { const rng = makeRng(String(g));
            const c = fam === 'C' ? genInvestigate(rng) : fam === 'N' ? genNumbered(rng) : genSystem(rng);
            return { v:(c._rel ? c._rel.hiddenValues : c.hidden).map(Number), total:c.total, visible:c.visible.map(Number) }; }""", [fam, graine])

    corr = {False: {}, True: {}, "eq": {}}
    for f in FICHES:
        for p in f[3]:
            code = p["code"]
            if "tout" in H[code]:
                await dessins_tout(pg, ouvrir, code, lettres, equations, corr)
                continue
            fam, q, graine = CARTES[code]
            for lettre in ([False, True] if lettres else [False]):
                await ouvrir(q, lettre)
                c = await valeurs(fam, graine)
                controle_carte(code, fam, c)
                spec = dict(famille=fam, graine=graine, lettre=lettre, habit=habit_js(code), inverser=code in INVERSER,
                            valeurs=sorted(c["v"]), **serrage(code, "schema"))
                r = await pg.evaluate("(s) => window.__corrige(s)", spec)
                if r.get("erreur"):
                    raise SystemExit(f"{code} : {r['erreur']}")
                if r["reste"]:
                    raise SystemExit(f"{code} : mots de l'outil restés dans le dessin : {r['reste']}")
                r["famille"] = fam
                corr[lettre][code] = r
            if equations:
                # le corrigé en équations : la page de l'outil est déjà en lettre (dernier tour)
                c = await valeurs(fam, graine)
                r = await pg.evaluate("(s) => window.__equation(s)", dict(famille=fam, graine=graine, valeurs=sorted(c["v"]),
                                      habit=habit_js(code), inverser=code in INVERSER, **serrage(code, "equations")))
                if r.get("erreur"):
                    raise SystemExit(f"{code} (équations) : {r['erreur']}")
                if r["reste"]:
                    raise SystemExit(f"{code} (équations) : mots de l'outil restés : {r['reste']}")
                if r["controles"] < 2:
                    raise SystemExit(f"{code} (équations) : trop peu de lignes contrôlées ({r['controles']})")
                r["famille"] = "E"
                corr["eq"][code] = r
    # l'exemple (couverture et page 2)
    fam, q, graine = CARTES["Ex"]
    await ouvrir(q.replace("&cards=1", "") + f"&cards=1&seed={graine}", False)
    c = await valeurs(fam, graine)
    controle_carte("Ex", fam, c)
    ex = await pg.evaluate("(s) => window.__exemple(s)", dict(graine=graine, valeurs=sorted(c["v"]), habit=habit_js("Ex")))
    if ex.get("erreur"):
        raise SystemExit(f"exemple : {ex['erreur']}")
    # les deux défis du dos
    defis = {False: {}, True: {}, "eq": {}}
    if equations:
        for code, d in DEFI_EQUATIONS.items():
            hab = dict(d["habit"], noms={str(k): v for k, v in d["habit"]["noms"].items()}, teinte=TEINTE)
            r = await pg.evaluate("(s) => window.__equation(s)", dict(famille="X", blocs=d["blocs"], habit=hab, x=d["x"]))
            if r.get("erreur"):
                raise SystemExit(f"{code} (équations) : {r['erreur']}")
            if r["controles"] < 2:
                raise SystemExit(f"{code} (équations) : trop peu de lignes contrôlées ({r['controles']})")
            r["famille"] = "E"
            defis["eq"][code] = r
        n = sum(r["controles"] for r in list(corr["eq"].values()) + list(defis["eq"].values()))
        print(f"équations : {n} lignes vérifiées avec les valeurs des cartes, toutes vraies")
    for lettre in ([False, True] if lettres else [False]):
        await ouvrir(CARTE_TOUT, lettre)
        for code, d in DEFI_SCHEMAS.items():
            spec = json.loads(json.dumps(d))
            if lettre:   # l'inconnue en lettre, comme les autres corrigés
                for e in spec["etapes"]:
                    for b in e["barres"]:
                        if b.get("totalTexte") == "?": b["totalTexte"] = "𝑥"
                        b["calcul"] = b["calcul"].replace("?", "𝑥")
                        for pp in b["parts"]:
                            if pp.get("t") == "?": pp["t"] = "𝑥"
            spec["teinte"] = TEINTE
            r = await pg.evaluate("(s) => window.__defi(s)", spec)
            if r.get("erreur"):
                raise SystemExit(f"{code} : {r['erreur']}")
            r["famille"] = "X"
            defis[lettre][code] = r
    await pg.close()
    return corr, ex, defis

async def dessins_tout(pg, ouvrir, code, lettres, equations, corr):
    """« On cherche le tout » (17/10/2026) : pas de carte. Le corrigé est dessiné par les fonctions de
    l'Enquête sur le modèle de habillage.py (../tout.js) ; en équations, les blocs écrits dans habillage.py,
    vérifiés comme ceux des défis du dos."""
    t = H[code]["tout"]
    hab = dict(H[code], noms={str(k): v for k, v in H[code]["noms"].items()}, teinte=TEINTE)
    hab.pop("tout")
    for lettre in ([False, True] if lettres else [False]):
        await ouvrir(CARTE_TOUT, lettre)
        spec = {k: t[k] for k in ("titre1", "rows", "ligne", "calculs")}
        r = await pg.evaluate("(s) => window.__tout(s)", dict(spec, habit=hab, teinte=TEINTE, lettre=lettre))
        if r.get("erreur"):
            raise SystemExit(f"{code} : {r['erreur']}")
        if r["reste"]:
            raise SystemExit(f"{code} : mots de l'outil restés dans le dessin : {r['reste']}")
        r["famille"] = "C"
        corr[lettre][code] = r
    if equations:
        await ouvrir(CARTE_TOUT, True)
        r = await pg.evaluate("(s) => window.__equation(s)", dict(famille="X", blocs=t["equation"], habit=hab, x=t["x"]))
        if r.get("erreur"):
            raise SystemExit(f"{code} (équations) : {r['erreur']}")
        if r["controles"] < 2:
            raise SystemExit(f"{code} (équations) : trop peu de lignes contrôlées ({r['controles']})")
        r["famille"] = "E"
        corr["eq"][code] = r

def controle_carte(code, fam, c):
    """La carte cachée a EXACTEMENT les nombres de l'énoncé (problemes.py, ses contrôles)."""
    p = probleme(code)
    vals = sorted(p["vals"].values())
    if fam == "C":
        attendu = sorted(set(vals))
        if sorted(set(c["v"])) != attendu:
            raise SystemExit(f"{code} : la carte cache {sorted(set(c['v']))}, l'énoncé {attendu}")
    elif fam == "N":
        if sorted(set(c["v"])) != sorted(set(vals)):
            raise SystemExit(f"{code} : la carte cache {c['v']}, l'énoncé {vals}")
    else:
        if sorted(set(c["v"])) != sorted(set(vals)):
            raise SystemExit(f"{code} : la carte cache {sorted(set(c['v']))}, l'énoncé {vals}")
    if len(set(c["v"])) != len(H[code]["noms"]) and fam != "N":
        raise SystemExit(f"{code} : {len(set(c['v']))} valeurs pour {len(H[code]['noms'])} noms")

# ------------------------------------------------------------------------------------------
# 2. Les pages
TACHE = ("M 96.4 55 C 98.7 57.2 102 60.1 102.8 62.6 C 103.7 65.1 102.7 67.9 101.4 70.1 C 100 72.2 97 73.8 94.9 75.3 C 92.7 76.9 90.7 78.2 88.5 79.3 "
         "C 86.3 80.4 84.1 81.4 81.9 81.9 C 79.6 82.4 76.9 81.9 75 82.5 C 73.1 83.2 71.8 83.6 70.6 85.6 C 69.4 87.6 69.1 91.5 67.8 94.4 C 66.5 97.2 64.7 101.3 62.6 102.8 "
         "C 60.4 104.4 57.4 104.4 55 103.8 C 52.6 103.2 50.1 100.8 48 99.2 C 45.9 97.6 43.9 96.1 42.2 94.4 C 40.5 92.7 38.9 90.9 37.7 88.9 C 36.5 86.9 36.2 84.1 35 82.5 "
         "C 33.8 80.9 33 79.8 30.7 79.3 C 28.5 78.8 24.7 79.7 21.5 79.3 C 18.4 79 14 78.5 11.8 77 C 9.7 75.4 8.8 72.6 8.6 70.1 C 8.5 67.6 10 64.5 10.8 62 C 11.6 59.5 12.5 57.2 13.6 55 "
         "C 14.7 52.8 15.9 50.8 17.4 49 C 18.9 47.3 21.5 46.1 22.6 44.5 C 23.8 42.9 24.6 41.7 24.4 39.4 C 24.2 37.1 22.1 33.8 21.5 30.7 C 20.9 27.6 19.9 23.3 20.7 20.7 "
         "C 21.6 18.2 24 16.5 26.3 15.6 C 28.7 14.6 32 15.1 34.7 15.1 C 37.3 15.1 39.8 15.2 42.2 15.6 C 44.6 16 46.9 16.5 49 17.4 C 51.2 18.3 53.1 20.4 55 21 "
         "C 56.9 21.6 58.2 22 60.4 21.1 C 62.5 20.2 65 17.2 67.8 15.6 C 70.6 14.1 74.3 11.8 77 11.8 C 79.6 11.8 82.1 13.6 83.7 15.6 C 85.3 17.5 85.8 20.8 86.7 23.3 "
         "C 87.5 25.9 88.1 28.3 88.5 30.7 C 88.9 33.1 89.1 35.4 88.9 37.7 C 88.7 40 87.4 42.5 87.4 44.5 C 87.4 46.5 87.4 47.9 88.9 49.6 C 90.4 51.4 94.1 52.8 96.4 55 Z")
DEFS = f'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><path id="tacheBadge" d="{TACHE}"/></defs></svg>'
CRAYON = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l3.5-.8L19 7.7 16.3 5 3.8 17.5 3 21z" fill="#15803d"/>'
          '<path d="M14.8 6.5l2.7 2.7" stroke="#fff" stroke-width="1.4"/></svg>')

def doc(titre, corps, css_page=""):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{titre}</title>'
            f'<link rel="stylesheet" href="{BASE}/commun.css"><style>{css_page}</style></head><body>{DEFS}{corps}</body></html>')

VAGUES = {   # les bords en coulure des bandeaux, ceux des livrets de l'Enquête (même dessin)
    88: ("M0,0 H210 V68 C206,76 202,83 196,81 C190,79 188,69 180,69 C172,69 170,75 163,74 C156,73 154,67 145,68 C136,69 133,85 122,82 "
         "C111,79 110,68 100,69 C92,70 90,76 82,75 C74,74 72,67 62,68 C53,69 51,81 41,79 C33,77 31,68 22,69 C14,70 8,74 0,70 Z",
         '<ellipse cx="127.5" cy="85.6" rx="2.1" ry="1.7" fill="url(#{id})" transform="rotate(90 127.5 85.6)"/>'
         '<ellipse cx="45" cy="83.2" rx="1.5" ry="1.2" fill="url(#{id})" transform="rotate(90 45 83.2)"/>'
         '<ellipse cx="197" cy="85.3" rx="1.2" ry="1" fill="url(#{id})" transform="rotate(90 197 85.3)"/>'),
    34: ("M0,0 H210 V25 C203,31 199,33 191,32 C183,31 180,26 172,27 C163,28 159,33 150,32 C141,31 138,26 129,27 C120,28 116,33 107,32 "
         "C98,31 95,26 86,27 C77,28 73,33 64,32 C55,31 52,26 43,27 C34,28 30,33 21,32 C13,31 7,29 0,27 Z", ""),
    48: ("M0,0 H210 V30 C203,38 199,43 191,42 C183,41 180,33 172,34 C163,35 159,44 150,43 C141,42 138,33 129,34 C120,35 116,44 107,43 "
         "C98,42 95,33 86,34 C77,35 73,44 64,43 C55,42 52,33 43,34 C34,35 30,44 21,43 C13,42 7,37 0,32 Z", ""),
}
def bandeau_vague(h, _base, id_):
    """Le bandeau de titre, bord inférieur en coulure, au vert du livret."""
    d, extra = VAGUES[h]
    return (f'<svg class="fond" viewBox="0 0 210 {h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="{id_}" x1="0" y1="0" x2="1" y2="0">'
            f'<stop offset="0" stop-color="#15803d"/><stop offset=".45" stop-color="#3a9d5d"/><stop offset="1" stop-color="#e4f4e9"/></linearGradient></defs>'
            f'<path fill="url(#{id_})" d="{d}"/>{extra.replace("{id}", id_)}</svg>')

# La largeur minimale d'un dessin de corrigé (unités de l'outil) : l'Enquête et le Système
# remplissent la carte (1 560) ; le schéma du monde 2 et les défis du dos, plus simples et plus
# étroits, sont dessinés 35 % plus grand — sans cette borne, un dessin étroit grossirait sans fin.
LARGEUR_DESSIN = {"C": 1560, "D": 1560, "N": 1150, "X": 1150, "E": 1560}
def svg_vb(r):
    x, y, w, h = r["bb"]
    w = max(w, LARGEUR_DESSIN[r["famille"]])
    return f'<svg viewBox="{x:.0f} {y:.0f} {w:.0f} {h:.0f}" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg">{r["svg"]}</svg>'

def page_couverture(ex, corr=None):
    e = EXEMPLE
    som = "".join(f'<li><span class="badge"><svg viewBox="2 5 106 105"><use href="#tacheBadge"/></svg><b>{NUMERO}{f[0]}</b></span>'
                  f'<span>{nb(f[1])}<em>{RESUMES[f[0]]}</em></span></li>' for f in FICHES)
    ident = ('<section class="ident"><div class="champ"><span>Nom, prénom</span></div><div class="champ classe"><span>Classe</span></div></section>'
             if not corr else f'<section class="ident"><div class="champ prof"><span>Livret corrigé</span><small>{corr["dit"]}</small></div></section>')
    bandeau = '<div class="bandeau-prof">Correction</div>' if corr else ""
    # Une page d'histoire, et devant elle une tache noire : « mais où est la tache ? ». Le « ? » est
    # centré sur le centre de gravité de la tache (54,8 ; 54,8 dans son repère, mesuré pour la
    # couverture de l'Enquête), en dominant-baseline central.
    hero = ('<svg class="hero" viewBox="0 0 140 130" role="img" aria-label="Une page d’histoire et une tache">'
            '<g transform="rotate(-7 46 64)"><rect x="10" y="16" width="72" height="92" rx="5" fill="#fff" stroke="#14532d" stroke-width="2.6"/>'
            '<g stroke="#14532d" stroke-width="3" stroke-linecap="round"><line x1="20" y1="34" x2="70" y2="34"/><line x1="20" y1="46" x2="66" y2="46"/>'
            '<line x1="20" y1="58" x2="70" y2="58"/><line x1="20" y1="70" x2="52" y2="70"/></g>'
            '<g stroke="#9fd3ae" stroke-width="3" stroke-linecap="round"><line x1="20" y1="86" x2="46" y2="86"/><line x1="20" y1="96" x2="38" y2="96"/></g></g>'
            '<g transform="translate(62,44) scale(0.62) rotate(12 54.8 54.8)"><use href="#tacheBadge" fill="#111"/></g>'
            '<text x="96" y="78" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="Poppins, sans-serif" font-size="24" font-weight="700">?</text>'
            '<g transform="translate(88,0)"><line x1="33" y1="33" x2="47" y2="47" stroke="#14532d" stroke-width="7" stroke-linecap="round"/>'
            '<circle cx="20" cy="20" r="16" fill="rgba(255,255,255,0.55)" stroke="#14532d" stroke-width="4.5"/>'
            '<path d="M11 15 a10 10 0 0 1 8 -7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g></svg>')
    corps = f'''{bandeau}
<header class="tete">{bandeau_vague(88, 68, "deg")}
  <div class="bloc"><div class="sur">{SUR}</div><h1>Les histoires<span>de SPLAT!</span></h1>
  <p class="accroche">{ACCROCHE}</p></div>
  {hero}
</header>
<div class="corps">
  <section class="expl chk">
    <span class="chip">Comment ça marche&nbsp;?</span>
    <div class="haut">
      <div class="histoire"><div class="lg">L'histoire</div><p>{nb(e["texte"])}</p><p class="q">{nb(e["question"])}</p></div>
      <div class="carte"><div class="lg">Son modèle dans SPLAT!</div>
        <svg class="ex-carte" viewBox="100 10 1460 830" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="La carte SPLAT! de l'histoire">{ex["carte"]}</svg></div>
    </div>
    <p class="intro"><b>Les {ex["total"]} coquillages sont les jetons&nbsp;; Lila, Noa et Tom sont les trois taches.</b>
      <span>Chaque histoire du livret se résout comme une carte SPLAT!&nbsp;: avec un schéma en barres, ou avec une équation. La page&nbsp;2 résout celle-ci pas à pas.</span></p>
    <p class="atoi">{CRAYON}<span><b>À toi&nbsp;!</b> Sous chaque problème, la place est pour toi&nbsp;: <b>dessine un schéma en barres ou écris une équation</b>, puis réponds par une phrase.</span></p>
  </section>
  {ident}
  <section class="som"><span class="chip">Dans ce livret</span><ol>{som}</ol></section>
</div>
<footer class="pied">{PIED}</footer>'''
    return doc(TITRE + " — couverture", corps, CSS_COUV)

def page_exemple(ex):
    e = EXEMPLE
    if ex["verification"] != VERIFS_EXEMPLE[0]:
        raise SystemExit(f"page 2 : l'outil vérifie « {ex['verification']} », le livret « {VERIFS_EXEMPLE[0]} »")
    etapes = []
    n = len(ex["etapes"])
    for i, st in enumerate(ex["etapes"], 1):
        if st["titre"] not in LEGENDES_EX:
            raise SystemExit(f"page 2 : pas de légende pour « {st['titre']} »")
        etapes.append(f'<li class="et"><span class="num">{i}</span><div class="txt"><h3>{st["titre"]}</h3><p class="leg">{LEGENDES_EX[st["titre"]]}</p></div>'
                      f'<svg class="dessin" viewBox="50 612 1500 {st["h"]}" xmlns="http://www.w3.org/2000/svg">{st["svg"]}</svg></li>')
    rep = "".join(f'<b>{html.escape(s["t"])}</b>' if s["gras"] else html.escape(s["t"]) for s in ex["reponse"])
    etapes.append(f'<li class="et texte"><span class="num">{n + 1}</span><div class="txt duo"><div><h3>Je réponds</h3><p class="rep">{rep}</p></div>'
                  f'<div><h3>Je vérifie</h3><p class="leg">{"<br>".join(v + "&nbsp;✓" for v in VERIFS_EXEMPLE)}</p></div></div></li>')
    corps = f'''
<header class="tete">{bandeau_vague(34, 25, "deg3")}<div class="bloc"><div class="sur">Un exemple résolu</div><h1>L'histoire pas à pas</h1></div></header>
<div class="corps">
  <section class="probleme chk"><div class="lg">L'histoire</div><p>{nb(e["texte"])} <b>{nb(e["question"])}</b></p></section>
  <ol class="etapes">{"".join(etapes)}</ol>
  <p class="atoi">{CRAYON}<span><b>À toi&nbsp;!</b> Sous chaque problème des fiches, <b>dessine un schéma en barres</b> comme dans cet exemple, <b>ou écris une équation</b>, puis réponds par une phrase.</span></p>
</div>
<footer class="pied">{PIED}</footer>'''
    return doc(TITRE + " — un exemple résolu", corps, CSS_EXEMPLE)

def page_fiche(fiche, svgs=None, iremi=False):
    num, titre, reprend, probs = fiche
    cartes = []
    for k, p in enumerate(probs, 1):
        corps = (f'<div class="enonce"><div class="numero">Problème {k}</div><div class="tx">{nb(p["texte"])}</div>'
                 f'<div class="q">{nb(p["question"])}</div></div>')
        corps += f'<div class="corr-svg">{svg_vb(svgs[p["code"]])}</div>' if svgs else '<div class="place"></div>'
        cartes.append(f'<div class="carte{" corr" if svgs else ""}" data-code="{p["code"]}">{corps}</div>')
    logo = '<img class="iremi" src="/assets/img/logos/irem/logo-print.png" alt="IREMI La Réunion">' if iremi else ""
    corr = " — Correction" if svgs else ""
    corps = f'''<div class="page"><div class="tete-fiche"><div class="g"><span class="sp">SPLAT!</span>
  <span class="ti" data-tete="Fiche {NUMERO}{num} —" data-suite="{nb(titre)}{corr}">Fiche {NUMERO}{num} — {nb(titre)}{corr}</span></div>
  <div class="d"><div class="mo">{MONDES[num]}</div>{logo}</div></div>
<div class="consigne"><b>Pour chaque problème&nbsp;:</b> dessine un schéma en barres ou écris une équation, puis réponds par une phrase.</div>
<div class="grille">{"".join(cartes)}</div><div class="pied-fiche">{PIED}{" · correction" if svgs else ""}</div></div>'''
    return doc(f"{TITRE} — fiche {NUMERO}{num}", corps, CSS_FICHE)

def page_dos(defis=None):
    cartes = []
    for k, p in enumerate(DEFI, 1):
        corps = (f'<div class="enonce"><div class="numero">Défi {k}</div><div class="tx">{nb(p["texte"])}</div>'
                 f'<div class="q">{nb(p["question"])}</div></div>')
        corps += f'<div class="corr-svg">{svg_vb(defis[p["code"]])}</div>' if defis else '<div class="place"></div>'
        cartes.append(f'<div class="carte{" corr" if defis else ""}" data-code="{p["code"]}">{corps}</div>')
    corps = f'''
<header class="tete">{bandeau_vague(48, 30, "deg2")}<div class="bloc"><div class="sur">Le livret est fini&nbsp;?</div><h1>Le défi&nbsp;!</h1></div></header>
<div class="corps">
  <p class="intro-dos">Deux histoires d'un autre genre&nbsp;: cette fois, il faut <b>remonter le temps</b>. Un schéma en barres, ou une équation, t'aide encore.</p>
  <div class="grille-dos">{"".join(cartes)}</div>
  <div class="credits">
    <div class="txt">
    Jeu <b>SPLAT!</b> créé par <span class="steve">Steve Wyborney</span> (stevewyborney.com) — merci Steve&nbsp;!<br>
    Livret <b>{TITRE}</b> de maths&amp;go, avec l'IREMI de La Réunion.<br>
    Libre d'être imprimé, partagé et adapté — sans usage commercial, et sous la même licence.
    </div>
    <div class="droite">
      <div class="logos-bas"><img class="irem" src="/assets/img/logos/irem/logo-print.png" alt="IREMI La Réunion"><img class="mg" src="/assets/img/logos/mathsgo/logo-print.png" alt="maths&amp;go"></div>
      <div class="ua"><img src="/assets/img/logos/ua-debre/icone.svg" alt=""><span>Unité apprenante<br>Michel Debré</span></div>
    </div>
  </div>
</div>
<footer class="pied">{PIED}</footer>'''
    return doc(TITRE + " — dos", corps, CSS_DOS)

# ------------------------------------------------------------------------------------------
# Les feuilles de style propres à chaque page (commun.css : polices, couleurs, pied)
CSS_COUV = """
.bandeau-prof{flex:0 0 14mm;box-sizing:border-box;padding-top:4mm;display:flex;align-items:center;justify-content:center;
  background:#b91c1c;color:#fff;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.tete{position:relative;height:84mm;flex:0 0 auto}
.tete .fond{position:absolute;inset:0;width:210mm;height:84mm;display:block}
.tete .bloc{position:absolute;left:12mm;top:12mm;width:120mm}
.tete .sur{font-size:13px;font-weight:700;color:#e4f4e9;text-transform:uppercase;letter-spacing:3px}
.tete h1{margin:1.5mm 0 0;font-size:34px;line-height:1.02;font-weight:700;color:#fff;letter-spacing:-0.5px}
.tete h1 span{display:block;font-size:58px;letter-spacing:-2.5px;margin-top:0.5mm}
.tete .accroche{margin:4mm 0 0;font-size:22px;font-weight:700;color:#fff;line-height:1.2}
.tete .accroche2{margin:1.2mm 0 0;font-size:13.5px;font-weight:700;color:#fff;line-height:1.3}
.tete .hero{position:absolute;right:12mm;top:8mm;width:62mm;height:58mm}
.corps{padding:0 14mm 3mm;justify-content:space-between}
.expl{border:1.4px solid #cbd5e1;border-radius:8px;padding:4mm 6mm 4mm;margin-top:1mm}
.expl .haut{display:flex;gap:5mm;align-items:stretch;margin-top:3mm}
.lg{font-size:11.5px;font-weight:700;color:#334155;text-align:center;margin-bottom:1mm}
.histoire{flex:1 1 0;border:1.6px solid #14532d;border-radius:6px;padding:2mm 3.5mm;background:#fff;display:flex;flex-direction:column;justify-content:center}
.histoire p{margin:0;font-size:13.5px;line-height:1.4}
.histoire .q{font-weight:700;margin-top:1.5mm}
.histoire .lg{text-align:left}
.carte{flex:0 0 88mm;border:1.6px solid #0f172a;border-radius:4px;padding:1.5mm 2mm 2mm;background:#fff;display:flex;flex-direction:column}
.carte svg{width:100%;height:auto;display:block;margin:auto 0}
.expl .intro{margin:3.5mm 0 0;font-size:14px;color:#14532d;line-height:1.35}
.expl .intro span{display:block;font-weight:400;color:#475569;font-size:12.5px;margin-top:1.5mm}
.expl .atoi{margin:3mm 0 0;font-size:13px;font-weight:700;color:#0f172a;line-height:1.35;background:#e4f4e9;border:1px solid #9fd3ae;border-radius:6px;padding:2.2mm 3.5mm;display:flex;align-items:center;gap:3mm}
.expl .atoi svg{flex:0 0 auto;width:7mm;height:7mm}
.expl .atoi b{color:#14532d}
.ident{display:flex;gap:6mm}
.ident .champ{flex:1;border:1.4px solid #5b6574;border-radius:6px;padding:2.2mm 4mm 11.8mm}
.ident .champ span{font-size:12.5px;font-weight:700;color:#334155}
.ident .champ.classe{flex:0 0 52mm}
.ident .champ.prof{flex:1;padding:1.2mm 4mm;text-align:center;line-height:1.2}
.ident .champ.prof span{font-size:17px;color:#14532d}
.ident .champ.prof small{font-size:12.5px;font-weight:700;color:#475569;margin-left:2.5mm}
.ident .champ.prof small::before{content:"— "}
.som ol{list-style:none;margin:2.5mm 0 0;padding:0;display:grid;grid-template-columns:repeat(5,1fr);gap:3mm 4mm}
.som li{display:flex;flex-direction:column;align-items:flex-start;gap:1.2mm;font-size:12.5px;font-weight:700;color:#0f172a;line-height:1.2}
.som li em{display:block;font-style:normal;font-weight:400;color:#475569;font-size:10.5px;line-height:1.28;margin-top:0.8mm}
.som .badge{position:relative;flex:0 0 10mm;width:10mm;height:10mm}
.som .badge svg{position:absolute;inset:0;width:10mm;height:10mm;fill:#14532d}
.som .badge b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11.5px;letter-spacing:-0.3px}
"""
CSS_EXEMPLE = """
.tete{position:relative;height:34mm;flex:0 0 auto}
.tete .fond{position:absolute;inset:0;width:210mm;height:34mm;display:block}
.tete .bloc{position:absolute;left:14mm;top:6.5mm}
.tete .sur{font-size:12px;font-weight:700;color:#e4f4e9;text-transform:uppercase;letter-spacing:2.6px}
.tete h1{margin:1mm 0 0;font-size:30px;line-height:1;font-weight:700;color:#fff;letter-spacing:-1px}
.corps{padding:0 14mm 3mm;justify-content:flex-start;gap:5mm}
.probleme{border:1.6px solid #14532d;border-radius:6px;padding:2.5mm 4mm;background:#fff;margin-top:1mm}
.probleme .lg{font-size:11.5px;font-weight:700;color:#334155;margin-bottom:0.8mm}
.probleme p{margin:0;font-size:13.5px;line-height:1.4}
.etapes{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;row-gap:3mm}
.et{display:grid;grid-template-columns:9.5mm 47mm 1fr;align-items:center;column-gap:3mm}
.et.texte{grid-template-columns:9.5mm 1fr;background:#e4f4e9;border:1px solid #9fd3ae;border-radius:6px;padding:1.6mm 3mm 1.6mm 1.6mm}
.et.texte .duo{display:flex;gap:7mm;align-items:flex-start}
.et.texte .duo>div:first-child{flex:0 1 auto}
.et.texte .duo>div:last-child{flex:none}
.et.texte .duo .leg{white-space:nowrap;margin-top:1.2mm;font-size:12px}
.et.texte .rep{margin:0.5mm 0 0;padding:0.5mm 2.5mm;background:#fff;border:1.2px solid #0f172a;border-radius:4px;font-size:12px;color:#0f172a;line-height:1.3}
.et .num{box-sizing:border-box;width:7.5mm;height:7.5mm;border:0.6mm solid #14532d;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:#14532d;font-size:13px;font-weight:800;justify-self:center}
.et h3{margin:0;font-size:12.5px;font-weight:700;color:#14532d;line-height:1.2}
.et .leg{margin:0.8mm 0 0;font-size:11px;line-height:1.3;color:#334155}
.et .leg:empty{display:none}
.et .dessin{width:100%;height:auto;display:block}
.atoi{margin:0;font-size:13px;font-weight:700;color:#0f172a;line-height:1.35;background:#fff;border:1.4px solid #15803d;border-radius:6px;padding:2.4mm 3.5mm;display:flex;align-items:center;gap:3mm}
.atoi svg{flex:0 0 auto;width:7mm;height:7mm}
.atoi b{color:#14532d}
"""
CSS_FICHE = """
body{display:block}
.page{width:210mm;height:297mm;padding:8mm 9mm 5mm;display:flex;flex-direction:column;overflow:hidden}
.tete-fiche{flex:0 0 auto;min-height:16mm;display:flex;align-items:center;justify-content:space-between;gap:4mm;padding:2mm 4mm;margin-bottom:2mm;
  background:linear-gradient(90deg,#15803d 0%,#3a9d5d 45%,#e4f4e9 100%)}
.tete-fiche .g{display:flex;align-items:center;gap:4mm;line-height:1.12;min-width:0}
.tete-fiche .sp{font-size:17pt;font-weight:700;color:#fff;white-space:nowrap}
.tete-fiche .ti{font-size:11pt;font-weight:700;color:#fff;white-space:nowrap}
.tete-fiche .d{display:flex;align-items:center;gap:3mm;flex:0 0 auto}
.tete-fiche .mo{font-size:8.5pt;font-weight:700;color:#14532d;text-align:right;line-height:1.25;white-space:nowrap}
.tete-fiche .iremi{height:11mm;display:block}
.consigne{flex:0 0 auto;margin-bottom:2mm;padding:1.8mm 3mm;border:1px solid #667085;border-radius:2mm;font-size:9.5pt;line-height:1.16}
.grille{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr) minmax(0,1fr);gap:5mm}
.carte{border:1.5px solid #334155;border-radius:6mm;padding:3.5mm 4mm 3mm;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.numero{align-self:flex-start;font-size:8.5pt;font-weight:700;color:#fff;background:#15803d;border-radius:99px;padding:0.4mm 2.6mm;margin-bottom:1.6mm}
.tx{font-size:10.5pt;line-height:1.38}
.q{font-size:10.5pt;line-height:1.38;font-weight:700;margin-top:1.2mm}
.enonce{flex:0 0 auto}
.place{flex:1 1 auto}
.corr-svg{flex:1 1 auto;min-height:0;margin-top:2mm;border-top:1px dashed #94a3b8;padding-top:1.5mm}
.corr-svg svg{width:100%;height:100%;display:block}
.corr .tx,.corr .q{font-size:9pt;line-height:1.3}
.pied-fiche{flex:0 0 auto;text-align:center;font-size:10px;font-weight:700;color:#64748b;padding-top:2.5mm}
"""
CSS_DOS = """
.tete{position:relative;height:48mm;flex:0 0 auto}
.tete .fond{position:absolute;inset:0;width:210mm;height:48mm;display:block}
.tete .bloc{position:absolute;left:14mm;top:8mm}
.tete .sur{font-size:12.5px;font-weight:700;color:#e4f4e9;text-transform:uppercase;letter-spacing:2.6px}
.tete h1{margin:1.5mm 0 0;font-size:44px;line-height:1;font-weight:700;color:#fff;letter-spacing:-1.5px}
.corps{padding:0 14mm;justify-content:flex-start;gap:4mm}
.intro-dos{margin:0;font-size:13px;color:#334155}
.intro-dos b{color:#14532d}
.grille-dos{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:5mm}
.carte{border:1.5px solid #334155;border-radius:6mm;padding:3.5mm 4mm 3mm;display:flex;flex-direction:column;min-height:0;overflow:hidden}
.numero{align-self:flex-start;font-size:8.5pt;font-weight:700;color:#fff;background:#15803d;border-radius:99px;padding:0.4mm 2.6mm;margin-bottom:1.6mm}
.tx{font-size:10.5pt;line-height:1.38}
.q{font-size:10.5pt;line-height:1.38;font-weight:700;margin-top:1.2mm}
.enonce{flex:0 0 auto}
.place{flex:1 1 auto}
.corr-svg{flex:1 1 auto;min-height:0;margin-top:2mm;border-top:1px dashed #94a3b8;padding-top:1.5mm}
.corr-svg svg{width:100%;height:100%;display:block}
.corr .tx,.corr .q{font-size:9pt;line-height:1.3}
.credits{display:flex;align-items:center;gap:5mm;text-align:left;font-size:10.5px;line-height:1.55;color:#475569;border-top:1px solid #e2e8f0;padding-top:3mm;padding-bottom:3mm}
.credits .txt{flex:1;font-size:10px;white-space:nowrap}
.credits .droite{display:flex;flex-direction:column;align-items:center;gap:2.2mm;flex:0 0 auto}
.credits .logos-bas{display:flex;align-items:center;gap:3mm}
.credits .logos-bas img.irem{height:11mm;display:block}
.credits .logos-bas img.mg{height:9.5mm;display:block}
.credits .ua{display:flex;align-items:center;gap:1.8mm;color:#0d7477;font-weight:700;font-size:10.5px;line-height:1.1}
.credits .ua img{width:8mm;height:8mm;display:block}
.credits b{color:#0f172a}
.credits .steve{color:#14532d;font-weight:700}
"""

# Contrôles de mise en page, faits dans la page avant l'impression
# L'escalier (10.3) : sept étapes dans un quart de page ; ses calculs font 4,3 pt au lieu de 4,5 (seule exception, 15/10/2026)
ECRITURE_MIN = {}      # (17/10/2026) plus d’exception : 10.3 écrit à 4,5 pt au moins (PLANCHER)
JS_VERIFIE = r"""(genre) => {
  const minPar = """ + json.dumps(ECRITURE_MIN) + r""";
  const mm = px => +(px / 3.7795).toFixed(1);
  const pb = [];
  // un titre de fiche trop long : coupé après le tiret (« Fiche 4 — » / la suite), jamais au milieu
  document.querySelectorAll('.tete-fiche .ti').forEach(e => {
    const g = e.parentElement;
    if(g.scrollWidth > g.clientWidth + 1){
      e.innerHTML = e.dataset.tete + '<br>' + e.dataset.suite;
      e.style.whiteSpace = 'normal';
      if(g.scrollWidth > g.clientWidth + 1) pb.push('titre trop long : ' + e.textContent);
    }
  });
  const infos = [];
  document.querySelectorAll('.carte[data-code]').forEach(c => {
    const k = c.getBoundingClientRect(), en = c.querySelector('.enonce').getBoundingClientRect();
    const i = { code:c.dataset.code, carte:[mm(k.width), mm(k.height)], enonce:mm(en.height), place:mm(k.bottom - en.bottom) };
    const sv = c.querySelector('.corr-svg svg');
    if(sv){
      const vb = sv.viewBox.baseVal, r = sv.getBoundingClientRect();
      const s = Math.min(r.width / vb.width, r.height / vb.height);
      // la plus petite écriture du dessin, en points
      const ts = [...sv.querySelectorAll('text')].map(t => [parseFloat(t.getAttribute('font-size') || getComputedStyle(t).fontSize), t.textContent]).filter(x => Number.isFinite(x[0]) && x[1].trim());
      const petit = ts.reduce((a, b) => b[0] < a[0] ? b : a);
      i.echelle = +(s * 100).toFixed(1);
      i.ecritureMin = +(petit[0] * s * 0.75).toFixed(1); i.plusPetit = petit[1];
      i.calculs = +(Math.max(...ts.map(x => x[0])) * s * 0.75).toFixed(1);
      i.dessinH = mm(vb.height * s); i.libre = mm(r.height - vb.height * s);
      if(i.ecritureMin < (minPar[c.dataset.code] || 4.5)) pb.push(c.dataset.code + ' : écriture de ' + i.ecritureMin + ' pt');
    }
    infos.push(i);
  });
  // rien ne déborde de la page, ni des blocs marqués
  document.querySelectorAll('.chk, .carte, .credits').forEach(e => { if(e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflow !== 'visible') pb.push('déborde : ' + (e.className)); });
  const page = document.querySelector('.page') || document.body;
  const bas = Math.max(...[...page.querySelectorAll('*')].filter(e => e.closest('svg') === null || e.tagName === 'svg').map(e => e.getBoundingClientRect().bottom));
  if(bas > 1123 + 1) pb.push('la page déborde de ' + mm(bas - 1123) + ' mm');
  const pied = document.querySelector('.pied, .pied-fiche');
  if(pied){ const autres = [...document.querySelectorAll('.corps > *, .grille')].map(e => e.getBoundingClientRect().bottom); if(Math.max(...autres) > pied.getBoundingClientRect().top + 1) pb.push('le pied est recouvert'); }
  return { pb, infos };
}"""

async def imprimer(nav, html_, sortie, rapport, nom):
    tmp = ICI / "_tmp"
    tmp.mkdir(exist_ok=True)
    f = tmp / (nom + ".html")
    f.write_text(html_, encoding="utf-8")
    pg = await nav.new_page(viewport={"width": 794, "height": 1123})
    await pg.goto(f"http://127.0.0.1:{PORT}{BASE}/_tmp/{f.name}", wait_until="networkidle")
    await pg.evaluate("document.fonts.ready")
    await pg.wait_for_timeout(500)
    r = await pg.evaluate(JS_VERIFIE, nom)
    if r["pb"]:
        raise SystemExit(f"{nom} : " + " ; ".join(r["pb"]))
    rapport[nom] = r["infos"]
    await pg.pdf(path=str(sortie), width="210mm", height="297mm", print_background=True,
                 margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
    await pg.close()

def assembler(pages, pages_iremi, nom):
    """Le PDF page par page (fiches avec l'IREMI) et le livret à plier (4 pages A3, imposées 8|1 · 2|7 · 6|3 · 4|5).
    pikepdf + add_overlay : les dégradés suivent (pypdf les perdait, livret du monde 1, 17/09/2026)."""
    import pikepdf
    A4W, A4H = 595.276, 841.890
    src = []
    def lire(liste):
        out = []
        for f in liste:
            d = pikepdf.open(str(f)); src.append(d)
            if len(d.pages) != 1:
                raise SystemExit(f"{f.name} : {len(d.pages)} pages au lieu d'une")
            out.append(d.pages[0])
        if len(out) != 8:
            raise SystemExit(f"{len(out)} pages au lieu de 8")
        return out
    pp, pl = lire(pages_iremi), lire(pages)
    livret = pikepdf.Pdf.new()
    for p in pp:
        page = livret.add_blank_page(page_size=(A4W, A4H))
        pikepdf.Page(page).add_overlay(p, pikepdf.Rectangle(0, 0, A4W, A4H))
    livret.save(str(SORTIE / f"{nom}.pdf"))
    a3 = pikepdf.Pdf.new()
    for g, d in [(8, 1), (2, 7), (6, 3), (4, 5)]:
        feuille = a3.add_blank_page(page_size=(2 * A4W, A4H))
        for idx, tx in ((g, 0.0), (d, A4W)):
            pikepdf.Page(feuille).add_overlay(pl[idx - 1], pikepdf.Rectangle(tx, 0, tx + A4W, A4H))
    a3.save(str(SORTIE / f"{nom}-a-plier.pdf"))
    for s in src:
        s.close()

POLICES = ("Poppins", "DejaVuSans", "SplatLettres")
def controle_polices(chemin):
    """Les dessins de l'outil s'écrivent en DejaVu Sans, comme tous les livrets SPLAT! (03/10/2026) :
    une machine où system-ui tombe sur une autre police (Inter, le 08/10/2026 : les mots « noire »,
    « verte » mal écrits sur les taches) fait échouer le rendu. Remède : un fonts.conf où system-ui
    et sans-serif préfèrent DejaVu Sans (voir le README)."""
    import shutil, subprocess
    if not shutil.which("pdffonts"):
        return
    sortie = subprocess.run(["pdffonts", str(chemin)], capture_output=True, text=True).stdout.splitlines()[2:]
    noms = {l.split()[0].split("+")[-1] for l in sortie if l.strip()}
    autres = sorted(n for n in noms if not n.startswith(POLICES))
    if autres:
        raise SystemExit(f"{chemin.name} : polices inattendues {autres} (system-ui doit être DejaVu Sans)")

def compresser(chemin):
    import shutil, subprocess
    if not shutil.which("qpdf"):
        return
    tmp = chemin.with_suffix(".qpdf.pdf")
    r = subprocess.run(["qpdf", "--object-streams=generate", "--compress-streams=y", "--recompress-flate",
                        "--compression-level=9", str(chemin), str(tmp)])
    if r.returncode in (0, 3) and tmp.exists():
        tmp.replace(chemin)

async def principal(versions):
    from playwright.async_api import async_playwright
    SORTIE.mkdir(parents=True, exist_ok=True)
    rapport = {}
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")
        lettres = any(v and v["lettre"] for v in versions)
        corr, ex, defis = await dessins_outil(nav, lettres, any(v and v.get("equation") for v in versions))
        print(f"exemple : {ex['indices'][0]} — {len(ex['etapes'])} dessins")
        for v in versions:
            nom = NOM_FICHIER + (v["suffixe"] if v else "")
            print(f"— {nom}")
            with tempfile.TemporaryDirectory() as d:
                d = Path(d)
                await imprimer(nav, page_couverture(ex, v), d / "1.pdf", rapport, f"{nom}-couverture")
                await imprimer(nav, page_exemple(ex), d / "2.pdf", rapport, f"{nom}-exemple")
                cle = ("eq" if v.get("equation") else v["lettre"]) if v else None
                for i, f in enumerate(FICHES):
                    svgs = corr[cle] if v else None
                    await imprimer(nav, page_fiche(f, svgs), d / f"f{i}.pdf", rapport, f"{nom}-fiche{f[0]}")
                    await imprimer(nav, page_fiche(f, svgs, iremi=True), d / f"f{i}i.pdf", rapport, f"{nom}-fiche{f[0]}-iremi")
                await imprimer(nav, page_dos(defis[cle] if v else None), d / "8.pdf", rapport, f"{nom}-dos")
                pages = [d / "1.pdf", d / "2.pdf"] + [d / f"f{i}.pdf" for i in range(5)] + [d / "8.pdf"]
                pages_i = [d / "1.pdf", d / "2.pdf"] + [d / f"f{i}i.pdf" for i in range(5)] + [d / "8.pdf"]
                assembler(pages, pages_i, nom)
            for s in ("", "-a-plier"):
                compresser(SORTIE / f"{nom}{s}.pdf")
                controle_polices(SORTIE / f"{nom}{s}.pdf")
            print(f"   {SORTIE / (nom + '.pdf')} et {nom}-a-plier.pdf")
        await nav.close()
    (SORTIE / "rapport-mise-en-page.json").write_text(json.dumps(rapport, ensure_ascii=False, indent=1), encoding="utf-8")

async def planche_equation(fiches):
    """La planche du corrigé « en équations » (08/10/2026) : les fiches demandées, et rien d'autre."""
    from playwright.async_api import async_playwright
    SORTIE.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")
        pg = await nav.new_page(viewport={"width": 1200, "height": 900})
        js = (ICI / "habit.js").read_text(encoding="utf-8") + "\n;0"
        js2 = (ICI / "corrige.js").read_text(encoding="utf-8") + "\n;0"
        pages = []
        for f in FICHES:
            if f[0] not in fiches:
                continue
            svgs = {}
            for pb in f[3]:
                code = pb["code"]
                if "tout" in H[code]:      # « on cherche le tout » : pas de carte (dessins_tout)
                    continue
                fam, q, graine = CARTES[code]
                await pg.goto(f"http://127.0.0.1:{PORT}/outils/splat.html?{q}&unknown=letter", wait_until="networkidle")
                await pg.wait_for_timeout(250)
                await pg.evaluate(js); await pg.evaluate(js2)
                v = await pg.evaluate("""([fam, g]) => { const rng = makeRng(String(g));
                    const c = fam === 'C' ? genInvestigate(rng) : fam === 'N' ? genNumbered(rng) : genSystem(rng);
                    return (c._rel ? c._rel.hiddenValues : c.hidden).map(Number).sort((a, b) => a - b); }""", [fam, graine])
                r = await pg.evaluate("(s) => window.__equation(s)", dict(famille=fam, graine=graine, valeurs=v, habit=habit_js(code), inverser=code in INVERSER))
                if r.get("erreur"):
                    raise SystemExit(f"{code} : {r['erreur']}")
                if r["reste"]:
                    raise SystemExit(f"{code} : mots de l'outil restés : {r['reste']}")
                r["famille"] = fam
                svgs[code] = r
                print(code, " | ".join(r["textes"]))
            sortie = SORTIE / f"_planche-equation-{f[0]}.pdf"
            await imprimer(nav, page_fiche(f, svgs).replace(" — Correction", " — Correction en équations"), sortie, {}, f"planche-equation-{f[0]}")
            pages.append(sortie)
        await nav.close()
    import pikepdf
    out = pikepdf.Pdf.new()
    for f in pages:
        with pikepdf.open(str(f)) as d:
            out.pages.extend(d.pages)
        f.unlink()
    out.save(str(SORTIE / "planche-corrige-equations.pdf"))
    print("   ", SORTIE / "planche-corrige-equations.pdf")

def main():
    if "--planche-equation" in sys.argv:
        srv = serveur()
        try:
            asyncio.run(planche_equation([a for a in sys.argv[1:] if not a.startswith("-")] or ["2", "5"]))
        finally:
            srv.shutdown()
        return
    versions = [None] + CORRECTIONS
    if "--eleve" in sys.argv:
        versions = [None]
    if "--correction" in sys.argv:
        versions = CORRECTIONS
    srv = serveur()
    try:
        asyncio.run(principal(versions))
    finally:
        srv.shutdown()
        tmp = ICI / "_tmp"
        if tmp.exists():
            for f in tmp.glob("*.html"):
                f.unlink()
            tmp.rmdir()

if __name__ == "__main__":
    main()
