import json, sys, urllib.parse
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"
PIEGE = '<img src=x onerror="window.__pirate=(window.__pirate||0)+1">'

def equabarre():
    charge = {"variable": PIEGE, "top": [{"type": "x"}, 3], "bottom": [8]}
    return BASE + "/outils/equabarre.html#data=" + urllib.parse.quote(json.dumps(charge))

def equasplat():
    charge = {"variable": PIEGE, "left": [{"type": "x"}, 3], "right": [8]}
    return BASE + "/outils/equasplat.html#data=" + urllib.parse.quote(json.dumps(charge))

def petit_splat():
    return BASE + "/outils/splat_tache_barre.html?problem=classic&support=print&title=" + urllib.parse.quote(PIEGE)

def splat_classique():
    return BASE + "/outils/splat.html?mode=N&cards=2&title=" + urllib.parse.quote(PIEGE) + "&note=" + urllib.parse.quote(PIEGE)

def equascribe():
    return BASE + "/outils/equascribe.html?mode=EQSTEP&cards=1&title=" + urllib.parse.quote(PIEGE)

cibles = {
    "ÉquaBarre (#data variable)": (equabarre(), None),
    "ÉquaSplat (#data variable) — avant ouverture de la fenêtre Ajouter": (equasplat(), None),
    "Petit Splat (?title=)": (petit_splat(), None),
    "Splat classique (?title= ?note=)": (splat_classique(), None),
    "ÉquaScribe (?title=)": (equascribe(), None),
}

with sync_playwright() as p:
    b = p.chromium.launch(channel="chromium")
    for nom, (url, action) in cibles.items():
        page = b.new_page()
        page.goto(url, wait_until="load")
        page.wait_for_timeout(1500)
        # Petit Splat / Splat : la fiche se dessine à la génération
        if "splat_tache_barre" in url or "splat.html" in url or "equascribe" in url:
            page.wait_for_timeout(1500)
        n = page.evaluate("window.__pirate || 0")
        print(f"{nom:70s} -> programme piège exécuté : {n} fois")
        page.close()
    b.close()
