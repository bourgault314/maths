"""Tri des graines des livrets « Je fais le schéma en barres » (Petit SPLAT!, monde 1).

Pourquoi ce script (28/09/2026) : à l'impression du livret Monde 1, Gwenaël a trouvé des
cartes en double (8 et 4 taches aux fiches 4 et 5) et des divisions qui reviennent sans
arrêt (4 ÷ 2 six fois dans le livret, 15 ÷ 5 deux fois côte à côte). Les graines du
26/09 avaient été triées fiche par fiche, jamais sur le livret entier.

Les cartes d'une fiche viennent de SA graine : l'outil (outils/splat_tache_barre.html)
tire les valeurs ET la place des jetons dans une seule suite de hasard, et la place des
jetons passe par le canvas (isPointInPath). On ne peut donc rejouer une série exacte que
dans un vrai navigateur : ce script ouvre l'outil dans Chromium et appelle createItem()
comme le fait startGen(), puis applique « sansjetons » avec son hasard à part.

Règles (toutes vérifiées) — celles du 26/09 :
  · pas de carte sous le plancher du niveau (4, 21, 51) ; aucun 69 ;
  · (28/09) livret Monde 1 jusqu'à 30 jetons, au plus 12 jetons posés par carte ;
  · pas deux cartes identiques sur la fiche ; au plus une carte où chaque tache ne cache
    qu'un jeton ;
  · fiche 1 : des jetons posés sur les 9 cartes, l'exemple a au moins 2 posés et 3 cachés ;
  · fiche 2 : l'exemple sans jetons, des deux schémas donnés l'un a des jetons, l'autre pas,
    les 3 cartes guidées cachent au moins 2 jetons par tache ;
  · exactement 3 cartes sans jetons aux fiches 2 et 3, 2 aux fiches 4 à 6 ;
  · fiches 3 et 4 : des cartes à 2, 3 et 4 taches ; fiches 5 et 6 : au moins 4 nombres de
    taches différents ;
et celles du 28/09 (choix de Gwenaël par question à choix), sur le LIVRET ENTIER :
  · aucune carte identique dans tout le livret (même total, mêmes jetons posés, mêmes taches) ;
  · une même division (jetons cachés ÷ nombre de taches) au plus 2 fois dans le livret,
    et jamais deux fois sur la même fiche.

Usage :
  python3 tri_graines_dessin.py --verifier            # rejoue les graines de render.py
  python3 tri_graines_dessin.py --verifier dessin     # un seul niveau
Dépendance : playwright (chromium). Le serveur local sert la racine du dépôt.
"""
import asyncio, functools, http.server, json, socketserver, sys, threading
from collections import Counter
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent
sys.path.insert(0, str(ICI))

NIVEAUX = ("dessin", "dessin_avance", "dessin_expert")   # cibles : 30, 50, 100 (render.py)
POSES_MAX = {"dessin": 12, "dessin_avance": 20, "dessin_expert": 20}   # jetons posés à compter
PLANCHER = {"dessin": 4, "dessin_avance": 21, "dessin_expert": 51}
TACHES = {1: "1", 2: "2", 3: "mix4", 4: "mix4", 5: "mix", 6: "mix"}
SANS_JETONS = {1: 0, 2: 3, 3: 3, 4: 2, 5: 2, 6: 2}

# Une série de 9 cartes, exactement comme startGen() : createItem() neuf fois, puis
# « sansjetons » choisit ses cartes par un hasard À PART (graine + « |sansjetons »).
JS_SERIE = """([graine, cible, taches, sj]) => {
  currentRand = mulberry32(hashSeed(graine));
  const st = [];
  for (let i = 0; i < 9; i++) st.push(createItem('find_hidden', cible, taches));
  if (sj > 0) {
    const r2 = mulberry32(hashSeed(graine + '|sansjetons'));
    const choix = st.map((c, i) => i).filter(i => st[i].visible > 0);
    for (let k = 0; k < sj && choix.length; k++) {
      const j = Math.floor(r2() * choix.length);
      retirerJetonsSiBesoin(st[choix[j]], true);
      choix.splice(j, 1);
    }
  }
  return st.map(c => [c.total, c.numSplats, c.visible, c.hiddenPerSplat]);
}"""


def division(c):
    """(jetons cachés, nombre de taches) : la division que l'élève fait sur la carte."""
    return (c[1] * c[3], c[1])


def defauts_fiche(niveau, f, cartes):
    d = []
    if any(c[0] < PLANCHER[niveau] for c in cartes):
        d.append("carte sous le plancher")
    if any(c[2] > POSES_MAX[niveau] for c in cartes):
        d.append(f"plus de {POSES_MAX[niveau]} jetons posés")
    if any("69" in str(x) for c in cartes for x in (c[0], c[2], c[1] * c[3])):
        d.append("un 69")
    if len({(c[0], c[1], c[2]) for c in cartes}) < 9:
        d.append("deux cartes identiques")
    if sum(c[3] == 1 for c in cartes) > 1:
        d.append("plus d'une carte à 1 jeton par tache")
    if sum(c[2] == 0 for c in cartes) != SANS_JETONS[f]:
        d.append(f"pas exactement {SANS_JETONS[f]} cartes sans jetons")
    if f == 1 and not (cartes[0][2] >= 2 and cartes[0][3] >= 3):
        d.append("exemple de la fiche 1")
    if f == 2:
        if cartes[0][2] != 0:
            d.append("l'exemple de la fiche 2 a des jetons")
        if (cartes[1][2] == 0) == (cartes[2][2] == 0):
            d.append("schémas donnés : il faut un avec et un sans jetons")
        if any(c[3] < 2 for c in cartes[:3]):
            d.append("carte guidée à 1 jeton par tache")
    n = {c[1] for c in cartes}
    if f in (3, 4) and not {2, 3, 4} <= n:
        d.append("il manque 2, 3 ou 4 taches")
    if f in (5, 6) and len(n) < 4:
        d.append("moins de 4 nombres de taches")
    k = [division(c) for c in cartes if c[1] >= 2]
    if len(k) != len(set(k)):
        d.append("la même division deux fois sur la fiche")
    return d


def defauts_livret(fiches):
    d = []
    ids = Counter((c[0], c[1], c[2]) for cartes in fiches for c in cartes)
    for k, v in ids.items():
        if v > 1:
            d.append(f"carte {k[0]} jetons, {k[1]} tache(s), {k[2]} posés : {v} fois")
    div = Counter(division(c) for cartes in fiches for c in cartes if c[1] >= 2)
    for (h, n), v in div.items():
        if v > 2:
            d.append(f"{h} ÷ {n} : {v} fois")
    return d


def servir():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RACINE))
    h.log_message = lambda *a: None
    s = socketserver.TCPServer(("127.0.0.1", 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s.server_address[1]


async def rejouer(niveaux):
    from playwright.async_api import async_playwright
    import render
    port = servir()
    res = {}
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        pg = await nav.new_page()
        await pg.goto(f"http://127.0.0.1:{port}/outils/splat_tache_barre.html?support=print",
                      wait_until="networkidle")
        for niv in niveaux:
            graines = render.NIVEAUX[niv]["graines"]
            cible = render.NIVEAUX[niv]["target"]
            res[niv] = [await pg.evaluate(JS_SERIE, [graines[f], cible, TACHES[f], SANS_JETONS[f]])
                        for f in range(1, 7)]
        await nav.close()
    return res


def main():
    niveaux = [a for a in sys.argv[1:] if not a.startswith("--")] or list(NIVEAUX)
    series = asyncio.run(rejouer(niveaux))
    rouge = False
    for niv, fiches in series.items():
        print(f"== {niv}")
        for f, cartes in enumerate(fiches, 1):
            d = defauts_fiche(niv, f, cartes)
            rouge |= bool(d)
            txt = "  ".join(f"{c[0]}={c[1]}×{c[3]}" + (f"+{c[2]}" if c[2] else "") for c in cartes)
            print(f"  fiche {f} : {txt}" + (f"   ✗ {', '.join(d)}" if d else ""))
        d = defauts_livret(fiches)
        rouge |= bool(d)
        print("  livret : " + ("✗ " + " ; ".join(d) if d else "ok"))
    sys.exit(1 if rouge else 0)


if __name__ == "__main__":
    main()
