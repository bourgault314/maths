#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Batterie du lot « L'atelier Solèy » — SPEC-ATELIER-NIVEAUX.md §10.

Complète la batterie du jeu (test_soley.py) sans la modifier : elle vérifie le
concepteur de niveaux, page cachée soley-atelier.html.

  python tests/soley/test_atelier.py --root .          # copie locale (serveur intégré)
  python tests/soley/test_atelier.py                   # version déployée mathsgo.re

Prérequis : pip install playwright && python -m playwright install chromium
Sortie : un PASS/FAIL par contrôle, code retour 0 si tout est vert.

Le contrôle A8 est le garde-fou central du lot : une fausse progression est
semée dans « soley-save-v5 » AVANT le chargement, on gagne réellement dans
l'atelier, et la clé doit être identique à l'octet après la victoire.
"""

import argparse
import http.server
import json
import socketserver
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

URL_DEPLOYEE = "https://mathsgo.re/outils/club_maths/soley-atelier.html"
CHEMIN_PAGE = "/outils/club_maths/soley-atelier.html"
CS = 100  # taille d'une case dans le viewBox du plateau (constante du jeu)
RACINE = Path(__file__).resolve().parents[2]

INIT_CONSENTEMENT = (
    "try{localStorage.setItem('mathsgo:consentement:v1',"
    "JSON.stringify({value:'denied',version:1,updatedAt:Date.now()}));}catch(e){}"
)

# Fausse progression semée avant le chargement : c'est elle qui doit survivre
# intacte à une victoire dans l'atelier.
SAVE_TEMOIN = json.dumps(
    {"done": {"lagon:Premier rayon": True}, "fruits": {"lagon:Zigzag dans les roches": 1},
     "pieces": {"lagon:Premier rayon": 1}, "cours": {"demi": True}},
    ensure_ascii=False, separators=(",", ":"),
)

# Semé AVANT le rideau de la page : on garde aussi une référence à la méthode
# native de lecture, sinon le rideau nous répondrait « null » à nous aussi.
INIT_SAVE = (
    "window.__lireBrut = Storage.prototype.getItem.bind(localStorage);"
    "try{localStorage.setItem('soley-save-v5', " + json.dumps(SAVE_TEMOIN) + ");}catch(e){}"
    "try{localStorage.removeItem('soley-atelier-v1');}catch(e){}"
)

# Le niveau d'essai : un prisme coupe en deux, deux chemins remontent, une
# LENTILLE les additionne. Il contient donc les deux familles de pièces dont
# l'écriture diffère (outs pluriel / ins pluriel), et un fruit qui n'est PAS sur
# le chemin gagnant minimal — de quoi éprouver sol ET solMin.
# La roche (4,2) barre le trajet direct du soleil vers la case : sans elle, le
# niveau serait gagné plateau vide et ne se laisserait pas jouer (contrôle A5b).
NIVEAU_ESSAI = {
    "w": "foret", "name": "Essai de l'atelier",
    "sub": "Deux moitiés à recoller : la lentille les additionne.",
    "cols": 9, "rows": 6,
    "suns": [{"x": 0, "y": 2, "dir": 1}],
    "targets": [{"x": 7, "y": 2, "need": [1, 1]}],
    "rocks": [[7, 0], [0, 5], [4, 2]],
    "fruits": [[3, 0]],
    "gates": [], "fixed": [],
    "tools": [{"t": "s2", "in": 1, "outs": [0, 2]}, {"t": "b", "in": 0, "out": 1},
              {"t": "b", "in": 2, "out": 1}, {"t": "b", "in": 1, "out": 2},
              {"t": "b", "in": 1, "out": 0}, {"t": "m", "ins": [2, 0], "out": 1},
              {"t": "b", "in": 3, "out": 0}],
}
# Variante A : passe par la rangée 0 et ramasse le fruit → solution de référence.
SOL_A = [[0, 2, 2], [1, 2, 0], [2, 2, 4], [3, 5, 0], [4, 5, 4], [5, 5, 2]]
# Variante B : passe par la rangée 1, laisse le fruit → solution minimale.
SOL_B = [[0, 2, 2], [1, 2, 1], [2, 2, 4], [3, 5, 1], [4, 5, 4], [5, 5, 2]]


def demarrer_serveur_local(racine: Path):
    """Sert la racine du dépôt en HTTP local (les chemins absolus /assets/… fonctionnent)."""

    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(racine), **kwargs)

        def log_message(self, *args):
            pass

    httpd = socketserver.TCPServer(("127.0.0.1", 0), Silencieux)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{httpd.server_address[1]}"


def poser_piece(page, ti, x, y):
    """Geste réel de l'élève : toucher la pièce dans la boîte, puis la case."""
    page.click(f"#toolbox .chip[data-i='{ti}']")
    cible = page.evaluate(
        """(args) => {
          const L = window.SOLEY.LV[window.ATELIER.ATIDX];
          const r = document.getElementById('board').getBoundingClientRect();
          const W = L.cols * args.cs, H = L.rows * args.cs;
          const sc = Math.min(r.width / W, r.height / H);
          const ox = r.left + (r.width - W * sc) / 2, oy = r.top + (r.height - H * sc) / 2;
          return { px: ox + (args.x + 0.5) * sc * args.cs, py: oy + (args.y + 0.5) * sc * args.cs };
        }""",
        {"cs": CS, "x": x, "y": y},
    )
    page.mouse.click(cible["px"], cible["py"])


def principal():
    ap = argparse.ArgumentParser(description="Batterie du lot « L'atelier Solèy »")
    ap.add_argument("--root", help="tester une copie locale du dépôt (dossier racine)")
    ap.add_argument("--url", help="tester une autre URL")
    ap.add_argument("--headed", action="store_true", help="ouvrir le navigateur")
    args = ap.parse_args()

    httpd = None
    if args.url:
        url = args.url
    elif args.root:
        httpd, base = demarrer_serveur_local(Path(args.root).resolve())
        url = base + CHEMIN_PAGE
    else:
        url = URL_DEPLOYEE
    print(f"Cible : {url}\n")

    echecs = []
    erreurs_js, erreurs_console = [], []

    def section(titre, ok, detail=""):
        print(f"[{'PASS' if ok else 'FAIL'}] {titre}" + (f" — {detail}" if detail else ""))
        if not ok:
            echecs.append(titre)

    with sync_playwright() as p:
        navig = p.chromium.launch(headless=not args.headed)
        ctx = navig.new_context(viewport={"width": 390, "height": 844})
        ctx.add_init_script(INIT_CONSENTEMENT)
        ctx.add_init_script(INIT_SAVE)
        page = ctx.new_page()
        page.on("pageerror", lambda e: erreurs_js.append(str(e)))
        page.on("console", lambda m: erreurs_console.append(m.text) if m.type == "error" else None)
        page.goto(url, wait_until="networkidle")

        # ------------------------------------------------------------------ A1
        depart = page.evaluate("""() => ({
          atelier: typeof window.ATELIER === 'object',
          soley: typeof window.SOLEY === 'object',
          lv: window.SOLEY ? window.SOLEY.LV.length : 0,
          atidx: window.ATELIER ? window.ATELIER.ATIDX : -1,
          ecran: [...document.querySelectorAll('.screen')].filter(e => e.classList.contains('active')).map(e => e.id),
          cases: document.querySelectorAll('#atplateau .atcase').length
        })""")
        section("A1 la page charge : atelier et jeu présents, écran Atelier actif, grille 9×6",
                depart["atelier"] and depart["soley"] and depart["ecran"] == ["atelier"]
                and depart["cases"] == 54 and depart["lv"] == depart["atidx"] + 1,
                f"LV={depart['lv']}, ATIDX={depart['atidx']}, cases={depart['cases']}")

        # ----------------------------------------------------------------- A1b
        # Le dégradé du soleil : un seul identifiant `sungrad` peut gagner, et il
        # ne doit JAMAIS vivre dans un écran masqué — un serveur de peinture en
        # display:none ne peint plus, et le soleil devient plat (œil de Gwenael).
        def etat_degrade():
            return page.evaluate("""() => {
              const t = [...document.querySelectorAll('[id="sungrad"]')];
              const cache = e => { while (e && e !== document.body) {
                  if (e.nodeType === 1 && getComputedStyle(e).display === 'none') return true;
                  e = e.parentElement; } return false; };
              return { n: t.length, premierMasque: t.length ? cache(t[0]) : true };
            }""")
        deg_atelier = etat_degrade()
        page.evaluate("(n) => window.ATELIER.charger(n)", NIVEAU_ESSAI)
        page.click("#atongjouer")
        deg_jouer = etat_degrade()
        page.click("#atongatelier")
        # on rend le plateau vierge : les contrôles suivants posent leurs propres objets
        page.evaluate("""() => window.ATELIER.charger({w:'lagon',name:'',sub:'',cols:9,rows:6,
          suns:[],targets:[],rocks:[],fruits:[],gates:[],fixed:[],tools:[]})""")
        section("A1b le dégradé du soleil est défini une seule fois et jamais dans un écran masqué",
                deg_atelier["premierMasque"] is False and deg_jouer["premierMasque"] is False,
                f"écran Atelier : {deg_atelier['n']} définition(s) ; mode Jouer : {deg_jouer['n']} "
                f"(celle qui gagne est visible dans les deux cas)")

        # ------------------------------------------------------------------ A2
        # Poser chaque type d'objet par un vrai clic : palette puis case.
        poses = [("sun", 0, 2), ("target", 7, 2), ("rock", 4, 5), ("fruit", 3, 0), ("gate", 6, 2)]
        for type_obj, x, y in poses:
            page.click(f"#atpalette button[data-obj='{type_obj}']")
            page.click(f"#atplateau .atcase[data-x='{x}'][data-y='{y}']")
        pose_ok = page.evaluate(
            """(poses) => poses.every(([t, x, y]) => {
                 const o = window.ATELIER.objetEn(x, y);
                 return o && o.type === t;
               })""",
            poses,
        )
        section("A2 poser chaque type d'objet du plateau (soleil, case, roche, fruit, passe)",
                pose_ok, f"{len(poses)} objets posés au clic")

        # ------------------------------------------------------------------ A3
        # Régler : une porte, un fruit à valeur, une passe, un soleil à valeur.
        page.click("#atplateau .atcase[data-x='7'][data-y='2']")   # la case créole
        page.fill("#attneed", "1/4")
        page.click("#atfiche [data-tporte='1']")
        page.click("#atfiche #atfichefermer")

        page.click("#atplateau .atcase[data-x='3'][data-y='0']")   # le fruit
        page.fill("#atfval", "1/4")
        page.click("#atfiche #atfichefermer")

        page.click("#atplateau .atcase[data-x='6'][data-y='2']")   # la passe
        page.fill("#atgmax", "1/3")
        page.click("#atfiche #atfichefermer")

        page.click("#atplateau .atcase[data-x='0'][data-y='2']")   # le soleil
        page.fill("#atsunval", "2")
        page.click("#atfiche [data-sdir='2']")
        page.click("#atfiche #atfichefermer")

        reglages = page.evaluate("""() => {
          const n = window.ATELIER.niveau();
          return { need: JSON.stringify(n.targets[0].need), porte: n.targets[0].porte,
                   fruit: JSON.stringify(n.fruits[0][2]), passe: JSON.stringify(n.gates[0].max),
                   soleil: JSON.stringify(n.suns[0].val), dir: n.suns[0].dir };
        }""")
        section("A3 régler une porte, un fruit à valeur, une passe, un soleil à valeur",
                reglages["need"] == "[1,4]" and reglages["porte"] == 1
                and reglages["fruit"] == "[1,4]" and reglages["passe"] == "[1,3]"
                and reglages["soleil"] == "[2,1]" and reglages["dir"] == 2,
                f"porte={reglages['porte']}, fruit={reglages['fruit']}, "
                f"passe={reglages['passe']}, soleil={reglages['soleil']} dir={reglages['dir']}")

        # ------------------------------------------------------------------ A4
        # La grille refuse de rétrécir sous un objet posé (le soleil est en 0,2 ;
        # la roche en 4,5 déborderait dès qu'on passe sous 6 rangées).
        avant = page.evaluate("() => window.ATELIER.niveau().rows")
        page.click("#atrowmoins")
        apres = page.evaluate("""() => ({ rows: window.ATELIER.niveau().rows,
          avert: document.getElementById('atavertgrille').textContent })""")
        section("A4 rétrécir la grille sous un objet posé : refusé, et l'atelier dit lequel",
                apres["rows"] == avant and "Impossible" in apres["avert"],
                apres["avert"][:90])

        # ------------------------------------------------------------------ A4b
        # LE RAYON PENDANT LA CONSTRUCTION. Sans lui, on règle des fractions à
        # l'aveugle : c'est le retour de Gwenael après son premier essai.
        rayons = page.evaluate("""() => {
          window.ATELIER.charger({w:'lagon',name:'',sub:'',cols:9,rows:6,
            suns:[{x:0,y:2,dir:1}], targets:[{x:7,y:2,need:[1,1]}],
            rocks:[], fruits:[[3,2]], gates:[], fixed:[], tools:[]});
          const sansObstacle = {
            rayons: document.querySelectorAll('#atplateau .beam').length,
            etat: document.getElementById('atetat').textContent };
          // une roche au milieu : le rayon doit s'arrêter dessus
          window.ATELIER.poser('rock', 4, 2);
          const avecObstacle = {
            rayons: document.querySelectorAll('#atplateau .beam').length,
            etat: document.getElementById('atetat').textContent,
            // longueur du trait : il ne va plus jusqu'à la case
            bout: (() => { const l = document.querySelector('#atplateau .beam');
                           return l ? Math.round(+l.getAttribute('x2')) : -1; })() };
          return { sansObstacle, avecObstacle };
        }""")
        section("A4b le rayon du soleil se dessine PENDANT la construction",
                rayons["sansObstacle"]["rayons"] >= 1,
                f"{rayons['sansObstacle']['rayons']} rayon(s), "
                f"fruit sur le trajet : {'oui' if '1/1' in rayons['sansObstacle']['etat'] else 'non'}")
        section("A4b une roche posée arrête le rayon, et l'atelier dit ce que la case reçoit",
                rayons["avecObstacle"]["bout"] < 700
                and "n’a pas encore de rayon" in rayons["avecObstacle"]["etat"],
                f"le trait s'arrête à x={rayons['avecObstacle']['bout']} (la case est en x=750)")

        # ------------------------------------------------------------------ A4c
        # Un objet resté « en main » ne doit plus avaler les clics en silence :
        # c'est ce qui donnait l'impression que rien n'était réglable.
        main = page.evaluate("""() => {
          const clic = el => el.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
          clic(document.querySelector("#atpalette button[data-obj='rock']"));
          const annonce = document.getElementById('atalerte').textContent;
          const r = document.getElementById('atalerte').getBoundingClientRect();
          clic(document.querySelector("#atplateau .atcase[data-x='7'][data-y='2']"));
          return { annonce, visible: r.top >= 0 && r.bottom <= innerHeight,
                   fiche: document.getElementById('atfiche').classList.contains('show'),
                   titre: document.getElementById('atfichetitre').textContent,
                   apres: document.getElementById('atalerte').textContent };
        }""")
        section("A4c l'objet « en main » s'annonce en haut de l'écran, là où on regarde",
                "en main" in main["annonce"] and main["visible"], main["annonce"][:70])
        section("A4c toucher un objet en tenant quelque chose ouvre quand même sa fiche",
                main["fiche"] and main["titre"] == "Case créole",
                main["apres"][:70])
        page.evaluate("() => document.getElementById('atfichefermer').click()")

        # ----------------------------------------------------------------- A5b
        # Un niveau gagné plateau vide ne se laisse pas jouer : le jeu lancerait
        # la célébration à l'ouverture et le plateau ne répondrait plus aux clics.
        trivial = dict(NIVEAU_ESSAI, rocks=[[7, 0], [0, 5]])   # sans la roche qui barre
        refus = page.evaluate("""(n) => {
          window.ATELIER.charger(n);
          const ok = window.ATELIER.jouer();
          const a = document.getElementById('atalerte');
          const r = a.getBoundingClientRect();
          return { ok, msg: a.textContent, visible: r.top >= 0 && r.bottom <= innerHeight };
        }""", trivial)
        section("A5b l'atelier refuse de jouer un niveau déjà gagné sans aucune pièce, "
                "et le dit LÀ OÙ ON LE VOIT",
                refus["ok"] is False and "sans poser aucune pièce" in refus["msg"]
                and refus["visible"],
                refus["msg"][:95])

        # ------------------------------------------------------------------ A5
        # Le niveau d'essai, joué et GAGNÉ dans le vrai moteur.
        page.evaluate("(n) => window.ATELIER.charger(n)", NIVEAU_ESSAI)
        page.click("#atongjouer")
        ecran = page.evaluate("""() => [...document.querySelectorAll('.screen')]
          .filter(e => e.classList.contains('active')).map(e => e.id)""")
        for ti, x, y in SOL_A:
            poser_piece(page, ti, x, y)
        page.wait_for_selector("#winov.show", state="visible", timeout=40000)
        gagne = page.evaluate("""() => {
          const sim = window.SOLEY.simulate();
          return { win: sim.win, fruits: sim.fruits.size,
                   bilan: document.getElementById('atwinbilan').textContent,
                   bandeau: document.getElementById('atwin').offsetParent !== null,
                   soleilsCaches: document.getElementById('winstars').offsetParent === null,
                   suivantCache: document.getElementById('nextbtn').offsetParent === null };
        }""")
        section("A5 le niveau construit se joue dans le vrai moteur et se GAGNE au clic",
                ecran == ["play"] and gagne["win"] and gagne["fruits"] == 1,
                f"écran={ecran}, fruits={gagne['fruits']}/1")
        section("A5 le bandeau d'atelier remplace la fenêtre des petits soleils",
                gagne["bandeau"] and gagne["soleilsCaches"] and gagne["suivantCache"],
                gagne["bilan"])

        # ------------------------------------------------------------------ A6
        page.click("#atwinsol")
        sol = page.evaluate("() => JSON.stringify(window.ATELIER.niveau().sol)")
        # Le geste du concepteur : rejouer autrement pour trouver la solution minimale.
        page.click("#atwinrejouer")
        vide = page.evaluate("() => Object.keys(window.SOLEY.state.placed).length")
        section("A6 « essayer une autre solution » rend le plateau vide sans quitter le jeu",
                vide == 0, f"{vide} pièce(s) restante(s)")
        for ti, x, y in SOL_B:
            poser_piece(page, ti, x, y)
        page.wait_for_selector("#winov.show", state="visible", timeout=40000)
        sansFruit = page.evaluate("""() => ({
          fruits: window.SOLEY.simulate().fruits.size,
          solRefuse: document.getElementById('atwinsol').disabled,
          texte: document.getElementById('atwinsol').textContent })""")
        page.click("#atwinsolmin")
        solmin = page.evaluate("() => JSON.stringify(window.ATELIER.niveau().solMin)")
        section("A6 « solution de référence » enregistrée (elle exige tous les fruits)",
                json.loads(sol) == SOL_A, f"{len(json.loads(sol))} pièces")
        section("A6 une victoire sans tous les fruits REFUSE la solution de référence",
                sansFruit["solRefuse"] and sansFruit["fruits"] == 0, sansFruit["texte"])
        section("A6 « solution minimale » enregistrée (elle prouve que le fruit se mérite)",
                json.loads(solmin) == SOL_B, f"{len(json.loads(solmin))} pièces")

        # ------------------------------------------------------------------ A7
        page.click("#atwinretour")
        page.click("#atexporter")
        export = page.evaluate("""() => ({ bloc: window.ATELIER.bloc(),
          msg: document.getElementById('atmsg').textContent })""")
        bloc = export["bloc"]
        section("A7 l'export produit le bloc au style maison, avec le constructeur mg de la lentille",
                bloc.strip().startswith("{w:'foret'") and "mg(2,0,1)" in bloc
                and "s2(1,0,2)" in bloc and "solMin:" in bloc,
                bloc.splitlines()[-1][:70])

        # ------------------------------------------------------------------ A8
        # LE garde-fou : la sauvegarde du jeu, après une victoire réelle.
        save = page.evaluate("() => window.__lireBrut('soley-save-v5')")
        section("A8 GARDE-FOU : « soley-save-v5 » identique à l'octet après une victoire",
                save == SAVE_TEMOIN,
                "clé intacte" if save == SAVE_TEMOIN else f"MODIFIÉE : {save}")
        lecture = page.evaluate("() => localStorage.getItem('soley-save-v5')")
        section("A8 l'atelier ne LIT pas non plus la sauvegarde du jeu",
                lecture is None, "getItem renvoie null malgré une clé bien présente")

        # ------------------------------------------------------------------ A9
        brouillon = page.evaluate("""() => {
          const d = JSON.parse(localStorage.getItem('soley-atelier-v1') || 'null');
          return d && d.liste && d.liste.length
            ? { n: d.liste.length, nom: d.liste[d.liste.length-1].nom,
                sol: !!(d.liste[d.liste.length-1].niveau.sol||[]).length } : null;
        }""")
        section("A9 le brouillon s'enregistre tout seul dans sa propre clé",
                bool(brouillon) and brouillon["sol"],
                f"{brouillon['n']} brouillon(s), « {brouillon['nom'] }»" if brouillon else "aucun")

        # ----------------------------------------------------------------- A10
        # LE contrôle qui répond à « est-ce que je pourrais refaire tous mes
        # niveaux avec ça ? » : les 69 niveaux du jeu sont chargés dans
        # l'atelier, réexportés sans rien toucher, et comparés champ par champ.
        # Un objet ou un réglage que l'atelier ne saurait pas exprimer ressort
        # ici comme un écart. (C'est ainsi qu'a été trouvé le champ `solB`.)
        aller = page.evaluate("""() => {
          const CHAMPS = ['w','name','sub','hint','dec','cols','rows','suns','targets',
                          'rocks','fruits','gates','fixed','tools','sol','solMin','solB'];
          const rates = [];
          let n = 0;
          for (let i = 0; i < window.SOLEY.LV.length; i++) {
            if (i === window.ATELIER.ATIDX) continue;
            n++;
            const original = JSON.parse(JSON.stringify(window.SOLEY.LV[i]));
            window.ATELIER.chargerDuJeu(i);
            window.ATELIER.exporter();
            const bloc = window.ATELIER.bloc();
            let relu = null;
            try {
              relu = new Function('b','s2','s3','mg','x2','x3',
                '"use strict";return (' + bloc.trim().replace(/,$/, '') + ');')(b,s2,s3,mg,x2,x3);
            } catch (e) { rates.push(original.name + ' : bloc illisible (' + e.message + ')'); continue; }
            const ecarts = CHAMPS.filter(c =>
              JSON.stringify(original[c] === undefined ? null : original[c]) !==
              JSON.stringify(relu[c] === undefined ? null : relu[c]));
            if (ecarts.length) rates.push(original.name + ' : ' + ecarts.join(', '));
          }
          return { n, rates, origine: window.ATELIER.origine(),
                   msg: document.getElementById('atmsg').textContent };
        }""")
        section(f"A10 les {aller['n']} niveaux du jeu ressortent de l'atelier IDENTIQUES "
                "(rien de ce qui existe n'est inexprimable)",
                aller["rates"] == [],
                f"{aller['n']}/{aller['n']} sans écart sur les 17 champs"
                if aller["rates"] == [] else " ; ".join(aller["rates"][:3]))
        section("A10 un niveau du jeu réexporté est signalé comme une RETOUCHE "
                "(le bloc remplacera l'entrée existante)",
                bool(aller["origine"]) and "Retouche" in aller["msg"],
                aller["msg"][:80])

        # ----------------------------------------------------------------- A11
        # Import : le bloc produit se relit dans l'atelier.
        retour = page.evaluate("""(bloc) => {
          document.getElementById('attexte').value = bloc;
          const ok = window.ATELIER.importer();
          const n = window.ATELIER.niveau();
          return { ok, nom: n.name, pieces: n.tools.length, lentille: n.tools.some(t => t.t === 'm') };
        }""", bloc)
        section("A11 le bloc exporté se réimporte dans l'atelier",
                retour["ok"] and retour["nom"] == "Essai de l'atelier"
                and retour["pieces"] == 7 and retour["lentille"],
                f"« {retour['nom']} », {retour['pieces']} pièces, lentille relue")

        # ----------------------------------------------------------------- A14
        # La mise en page ORDINATEUR : deux colonnes, le plateau et la palette
        # côte à côte (on choisit puis on pose sans défiler), et l'écran Jouer
        # qui rend à la barre d'onglets la hauteur qu'elle prend.
        pc = navig.new_context(viewport={"width": 1280, "height": 800})
        pc.add_init_script(INIT_CONSENTEMENT)
        pc.add_init_script(INIT_SAVE)
        ppc = pc.new_page()
        ppc.on("pageerror", lambda e: erreurs_js.append(str(e)))
        ppc.goto(url, wait_until="networkidle")
        ppc.evaluate("(n) => window.ATELIER.charger(n)", NIVEAU_ESSAI)
        ppc.wait_for_timeout(200)
        mise = ppc.evaluate("""() => {
          const r = s => { const b = document.querySelector(s).getBoundingClientRect();
                           return {g:Math.round(b.left), d:Math.round(b.right),
                                   h:Math.round(b.top), b:Math.round(b.bottom)}; };
          const plateau = r('#atplateaubox'), palette = r('#atpalette');
          return {
            cote_a_cote: palette.g >= plateau.d - 2,
            palette_visible: palette.h >= 0 && palette.b <= innerHeight,
            plateau_visible: plateau.h >= 0 && plateau.b <= innerHeight,
            largeur_plateau: plateau.d - plateau.g,
            conseil_telephone: getComputedStyle(document.getElementById('atconseil')).display,
            objets_sur_une_ligne: new Set([...document.querySelectorAll('#atpalette button')]
              .map(b => Math.round(b.getBoundingClientRect().top))).size,
            defilement_page: document.documentElement.scrollHeight > innerHeight
          };
        }""")
        section("A14 ordinateur : le plateau et la palette côte à côte, tous deux visibles "
                "sans défiler",
                mise["cote_a_cote"] and mise["palette_visible"] and mise["plateau_visible"]
                and not mise["defilement_page"],
                f"plateau {mise['largeur_plateau']} px de large, "
                f"palette à droite, page sans défilement")
        section("A14 ordinateur : les cinq objets du décor tiennent sur une ligne, "
                "et le conseil « tourne ton téléphone » disparaît",
                mise["objets_sur_une_ligne"] == 1 and mise["conseil_telephone"] == "none",
                f"{mise['objets_sur_une_ligne']} ligne(s) d'objets")

        ppc.evaluate("() => window.ATELIER.jouer()")
        ppc.wait_for_timeout(300)
        jeu = ppc.evaluate("""() => {
          const b = document.getElementById('boardbox').getBoundingClientRect();
          return { coupe: b.bottom > innerHeight + 1, bas: Math.round(b.bottom),
                   fenetre: innerHeight,
                   defilement: document.documentElement.scrollHeight > innerHeight };
        }""")
        section("A14 ordinateur : en mode Jouer, le plateau n'est plus coupé par le bas",
                (not jeu["coupe"]) and (not jeu["defilement"]),
                f"bas du plateau à {jeu['bas']} px pour une fenêtre de {jeu['fenetre']} px")
        pc.close()

        navig.close()

    if httpd:
        httpd.shutdown()

    # ----------------------------------------------------------------- A12
    # Rejouage du bloc exporté dans le vrai moteur, côté node.
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(bloc)
        chemin_bloc = f.name
    rejeu = subprocess.run(
        ["node", str(RACINE / "tests/soley/rejouer-bloc.mjs"), chemin_bloc],
        capture_output=True, text=True, encoding="utf-8", cwd=str(RACINE),
    )
    for ligne in (rejeu.stdout or "").strip().splitlines():
        print("      " + ligne)
    section("A12 le bloc exporté se rejoue dans le vrai moteur (node) : sol et solMin gagnent",
            rejeu.returncode == 0, (rejeu.stderr or "").strip()[:120])

    ok_js = not erreurs_js and not erreurs_console
    detail = ""
    if erreurs_js:
        detail += "exceptions : " + " | ".join(erreurs_js[:5])
    if erreurs_console:
        detail += (" ; " if detail else "") + "console : " + " | ".join(erreurs_console[:5])
    print(f"[{'PASS' if ok_js else 'FAIL'}] A13 zéro erreur JavaScript" + (f" — {detail}" if detail else ""))
    if not ok_js:
        echecs.append("A13")

    print()
    if echecs:
        print(f"ÉCHEC : {len(echecs)} contrôle(s) en défaut → " + " ; ".join(echecs))
        return 1
    print("TOUT EST VERT — batterie de l'atelier réussie.")
    return 0


if __name__ == "__main__":
    sys.exit(principal())
