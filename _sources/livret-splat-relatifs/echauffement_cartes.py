#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Le livret d'échauffement du monde 6 (E1, E2, E3 — lot 1 « outil + carte + suivi », 14/10/2026) :
les 36 cartes, TIRÉES PAR L'OUTIL.

    python3 echauffement_cartes.py

Lit fiches-echauffement.json (les réglages et les graines choisis carte par carte, liste annotée
de la conception), ouvre chaque fiche dans outils/splat_equations.html (une partie par carte,
« cards=1 », enchaînées par « suite », comme le lien « Projeter » de la carte des mondes), et
relève pour chaque carte :
  - l'équation telle que l'outil l'écrit (première ligne de la correction courte « l'équation »)
    et sa solution — elles doivent être celles de fiches-echauffement.json, sinon on s'arrête ;
  - la carte du jeu de l'élève (carteDuJeuEquaSplat, la conversion des fiches 38 à 43).

Écrit cartes-echauffement.json ({E1: [12 cartes], …}) et imprime les trois liens « j » de la carte
des mondes (REL_ECHAUF, outils/splat_univers.html) : ÉquaSplat, parcours m4ech1 … m4ech3, la série
compactée dans #data= exactement comme pour les fiches 38 à 43.
tests/splat-relatifs-echauffement.test.mjs compare les trois fichiers.
"""
import base64
import functools
import http.server
import json
import pathlib
import socketserver
import sys
import threading
from urllib.parse import quote

ICI = pathlib.Path(__file__).resolve().parent
RACINE = ICI.parent.parent
PORT = 8763
SUFFIXE = "&cards=1&seed={graine}&unknown=letter"


def parties(fiches, code):
    f = fiches["fiches"][code]
    return [fiches["reglages"][c["reglage"]] + SUFFIXE.format(graine=c["graine"]) for c in f["cartes"]]


def adresse(p):
    v = "&view=equation"
    return f"/outils/splat_equations.html?{p[0]}{v}&suite=" + ";".join(quote(x + v, safe="") for x in p[1:])


def b64url(objet):
    texte = json.dumps(objet, ensure_ascii=False, separators=(",", ":"))
    return base64.urlsafe_b64encode(texte.encode("utf-8")).decode("ascii").rstrip("=")


def serveur():
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    h = functools.partial(Silencieux, directory=str(RACINE))
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


JS_CARTES = """() => ({
  n: cards.length,
  eqs: cards.map(c => eqSignedSixCorrectionLinesOps(c._eq, getCardVarChar(c)).lines[0]),
  x: cards.map(c => Number(c._eq.x)),
  cartes: cards.map(carteDuJeuEquaSplat)
})"""


def main():
    from playwright.sync_api import sync_playwright
    fiches = json.loads((ICI / "fiches-echauffement.json").read_text(encoding="utf-8"))
    srv = serveur()
    sortie, liens, erreurs = {}, {}, []
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch()
            for code, f in fiches["fiches"].items():
                pg = nav.new_page(viewport={"width": 1280, "height": 900})
                pg.goto(f"http://127.0.0.1:{PORT}" + adresse(parties(fiches, code)), wait_until="networkidle")
                pg.wait_for_function("() => typeof cards !== 'undefined' && cards.length === 12", timeout=15000)
                r = pg.evaluate(JS_CARTES)
                pg.close()
                for k, (carte, eq, x) in enumerate(zip(f["cartes"], r["eqs"], r["x"])):
                    if eq != carte["equation"] or x != carte["x"]:
                        erreurs.append(f"{code} carte {k + 1} : l'outil écrit « {eq} » (𝑥 = {x}), "
                                       f"la liste dit « {carte['equation']} » (𝑥 = {carte['x']})")
                sortie[code] = r["cartes"]
                liens[f["parcours"]] = (f"/outils/equasplat.html?eleve=1&parcours={f['parcours']}#data="
                                        + b64url({"source": "univers_splat", "parcours": f["parcours"], "serie": r["cartes"]}))
            nav.close()
    finally:
        srv.shutdown()
    if erreurs:
        print("\n".join(erreurs))
        sys.exit(1)
    with open(ICI / "cartes-echauffement.json", "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(sortie, ensure_ascii=False, indent=1) + "\n")
    print("cartes-echauffement.json écrit : 36 cartes, équations et solutions conformes à la liste.")
    for parcours, lien in liens.items():
        print(f'{parcours}\t{lien}')


if __name__ == "__main__":
    main()
