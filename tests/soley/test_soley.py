#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Batterie de tests Solèy — SOLEY.md §5.

Exécute les 7 contrôles obligatoires sur la version déployée (par défaut)
ou sur une copie locale du dépôt (--root <dossier-du-depot>).

  python tests/soley/test_soley.py                     # version déployée mathsgo.re
  python tests/soley/test_soley.py --root .            # copie locale (serveur intégré)
  python tests/soley/test_soley.py --url https://…     # autre URL

Prérequis : pip install playwright && python -m playwright install chromium
Sortie : un PASS/FAIL par section, code retour 0 si tout est vert.
"""

import argparse
import http.server
import json
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

URL_DEPLOYEE = "https://mathsgo.re/outils/club_maths/soley.html"
CHEMIN_PAGE = "/outils/club_maths/soley.html"
CS = 100  # taille d'une case dans le viewBox du plateau (constante du jeu)

# Choix cookies « refusé » posé AVANT le chargement : pas de bannière, pas de mesure.
INIT_CONSENTEMENT = (
    "try{localStorage.setItem('mathsgo:consentement:v1',"
    "JSON.stringify({value:'denied',version:1,updatedAt:Date.now()}));}catch(e){}"
)


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


# ---------------------------------------------------------------------------
# T1 — cohérence des données de chaque niveau (bornes, chevauchements, outils)
# ---------------------------------------------------------------------------
JS_COHERENCE = """
() => {
  const fails = [];
  const LV = window.SOLEY.LV;
  const TYPES = new Set(['b','s2','s3','m','x2','x3']);
  const dirOk = d => Number.isInteger(d) && d >= 0 && d <= 3;
  const frOk = f => Array.isArray(f) && f.length === 2 &&
    Number.isInteger(f[0]) && Number.isInteger(f[1]) && f[0] >= 0 && f[1] >= 1;
  if (LV.length !== 60) fails.push(`LV.length=${LV.length} au lieu de 60`);
  const cles = new Set();
  LV.forEach((L, i) => {
    const nom = `${i}:${L.name}`;
    const dans = (x, y) => Number.isInteger(x) && Number.isInteger(y) &&
      x >= 0 && y >= 0 && x < L.cols && y < L.rows;
    if (!(L.cols >= 4 && L.rows >= 3)) fails.push(`${nom}: grille ${L.cols}x${L.rows}`);
    const cle = L.w + ':' + L.name;
    if (cles.has(cle)) fails.push(`${nom}: clé de sauvegarde en double (${cle})`);
    cles.add(cle);
    const occ = new Map();
    const pose = (x, y, quoi) => {
      if (!dans(x, y)) fails.push(`${nom}: ${quoi} hors grille (${x},${y})`);
      const k = x + ',' + y;
      if (occ.has(k)) fails.push(`${nom}: ${quoi} chevauche ${occ.get(k)} en (${x},${y})`);
      occ.set(k, quoi);
    };
    (L.suns || []).forEach(s => { pose(s.x, s.y, 'soleil');
      if (!dirOk(s.dir)) fails.push(`${nom}: direction de soleil ${s.dir}`);
      if (s.val !== undefined && !frOk(s.val)) fails.push(`${nom}: val de soleil invalide`); });
    (L.targets || []).forEach(t => { pose(t.x, t.y, 'case créole');
      if (!frOk(t.need) || t.need[0] < 1) fails.push(`${nom}: need invalide`); });
    (L.rocks || []).forEach(r => pose(r[0], r[1], 'roche'));
    (L.fruits || []).forEach(f => pose(f[0], f[1], 'fruit'));
    (L.gates || []).forEach(g => { pose(g.x, g.y, 'passe');
      if (!frOk(g.max) || g.max[0] < 1) fails.push(`${nom}: max de passe invalide`); });
    (L.fixed || []).forEach(fx => { pose(fx[1], fx[2], 'pièce scellée');
      if (!fx[0] || !TYPES.has(fx[0].t)) fails.push(`${nom}: pièce scellée invalide`); });
    if (!L.suns || !L.suns.length) fails.push(`${nom}: aucun soleil`);
    if (!L.targets || !L.targets.length) fails.push(`${nom}: aucune case créole`);
    (L.tools || []).forEach((t, j) => {
      if (!t || !TYPES.has(t.t)) { fails.push(`${nom}: outil ${j} de type inconnu`); return; }
      const dirs = [];
      if ('in' in t) dirs.push(t.in);
      if ('out' in t) dirs.push(t.out);
      if (t.outs) dirs.push(...t.outs);
      if (t.ins) dirs.push(...t.ins);
      if (!dirs.every(dirOk)) fails.push(`${nom}: outil ${j} directions invalides`);
    });
    if (!Array.isArray(L.sol) || !L.sol.length) { fails.push(`${nom}: sol absent`); return; }
    const solCases = new Set(), solOutils = new Set();
    L.sol.forEach(([ti, x, y]) => {
      if (!L.tools[ti]) fails.push(`${nom}: sol référence l'outil ${ti} inexistant`);
      if (solOutils.has(ti)) fails.push(`${nom}: sol réutilise l'outil ${ti}`);
      solOutils.add(ti);
      if (!dans(x, y)) fails.push(`${nom}: sol hors grille (${x},${y})`);
      const k = x + ',' + y;
      if (solCases.has(k)) fails.push(`${nom}: sol pose deux pièces en (${x},${y})`);
      solCases.add(k);
      if (occ.has(k)) fails.push(`${nom}: sol pose sur ${occ.get(k)} en (${x},${y})`);
    });
  });
  return fails;
}
"""

# ---------------------------------------------------------------------------
# T2 + T3 — les 60 solutions de référence gagnent et ramassent tous les fruits
# ---------------------------------------------------------------------------
JS_SOLUTIONS = """
() => {
  const S = window.SOLEY;
  const resultats = [];
  for (let i = 0; i < S.LV.length; i++) {
    const r = S.solve(i);
    const sim = S.simulate();
    resultats.push({
      nom: S.LV[i].w + ':' + S.LV[i].name,
      gagne: !!r.win,
      fruitsPris: sim.fruits.size,
      fruitsTotal: S.LV[i].fruits.length,
    });
  }
  S.openLevel(0); // purge les minuteries de la dernière célébration
  return resultats;
}
"""

# ---------------------------------------------------------------------------
# T4 — une passe étroite bloque un rayon trop épais (« Les demi-tunnels »)
# ---------------------------------------------------------------------------
JS_PASSE = """
() => {
  const S = window.SOLEY;
  const i = S.LV.findIndex(l => l.name === 'Les demi-tunnels');
  if (i < 0) return { erreur: 'niveau « Les demi-tunnels » introuvable' };
  const L = S.LV[i];
  S.openLevel(i);
  // Contournement : le rayon ENTIER envoyé dans la galerie malgré les passes.
  S.state.placed = {
    '2,4': { def: L.tools[2], ti: 2 },
    '2,6': { def: L.tools[3], ti: 3 },
    '8,6': { def: L.tools[4], ti: 4 },
    '8,4': { def: L.tools[1], ti: 1 },
  };
  const contour = S.simulate();
  const gates = L.gates.map(g => [g.x, g.y]);
  // Le rayon 1/1 doit être tronqué une demi-case avant une passe.
  const tronque = contour.segs.some(sg =>
    sg.val[0] === 1 && sg.val[1] === 1 &&
    gates.some(([gx, gy]) => Math.abs(sg.x2 - gx) + Math.abs(sg.y2 - gy) === 0.5));
  // Solution de référence : les demi-rayons passent, la maison reçoit 1.
  S.state.placed = {};
  L.sol.forEach(([ti, x, y]) => { S.state.placed[x + ',' + y] = { def: L.tools[ti], ti }; });
  const voulu = S.simulate();
  const demiPasse = voulu.segs.some(sg =>
    sg.val[0] === 1 && sg.val[1] === 2 &&
    gates.some(([gx, gy]) => sg.y1 === gy && sg.y2 === gy &&
      Math.min(sg.x1, sg.x2) < gx && Math.max(sg.x1, sg.x2) > gx));
  S.openLevel(0);
  return { contourGagne: contour.win, tronque, vouluGagne: voulu.win, demiPasse };
}
"""

# ---------------------------------------------------------------------------
# T5 — écrans réellement masqués (display calculé, piège #id vs .classe)
# ---------------------------------------------------------------------------
JS_ECRANS = """
() => {
  const aff = id => getComputedStyle(document.getElementById(id)).display;
  return { home: aff('home'), lvscreen: aff('lvscreen'), play: aff('play') };
}
"""


def principal():
    ap = argparse.ArgumentParser(description="Batterie Solèy (SOLEY.md §5)")
    ap.add_argument("--url", default=URL_DEPLOYEE, help="URL de la page à tester")
    ap.add_argument("--root", default=None,
                    help="racine du dépôt : sert la copie locale au lieu de l'URL")
    ap.add_argument("--headed", action="store_true", help="navigateur visible")
    args = ap.parse_args()

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    httpd = None
    url = args.url
    if args.root:
        racine = Path(args.root).resolve()
        if not (racine / CHEMIN_PAGE.lstrip("/")).exists():
            print(f"ERREUR : {racine} ne contient pas {CHEMIN_PAGE}")
            return 2
        httpd, base = demarrer_serveur_local(racine)
        url = base + CHEMIN_PAGE
    print(f"Cible : {url}\n")

    echecs = []
    erreurs_js = []
    erreurs_console = []

    def section(titre, ok, detail=""):
        etat = "PASS" if ok else "FAIL"
        print(f"[{etat}] {titre}" + (f" — {detail}" if detail else ""))
        if not ok:
            echecs.append(titre)

    with sync_playwright() as p:
        navig = p.chromium.launch(headless=not args.headed)

        def nouvelle_page(largeur, hauteur):
            ctx = navig.new_context(viewport={"width": largeur, "height": hauteur},
                                    locale="fr-FR")
            ctx.add_init_script(INIT_CONSENTEMENT)
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: erreurs_js.append(str(e)))
            pg.on("console",
                  lambda m: erreurs_console.append(m.text) if m.type == "error" else None)
            pg.set_default_timeout(15000)
            return ctx, pg

        # ============ passe 1 : portrait/bureau — T1 à T5 ============
        ctx1, page = nouvelle_page(1280, 800)
        page.goto(url, wait_until="load")
        page.wait_for_function("() => window.SOLEY && window.SOLEY.LV")

        # T1 — cohérence des données
        fails = page.evaluate(JS_COHERENCE)
        nb = page.evaluate("() => window.SOLEY.LV.length")
        section("T1 cohérence des données des niveaux", not fails,
                f"{nb} niveaux vérifiés" if not fails else " ; ".join(fails[:8]))

        # T5a — au chargement, seul l'accueil est affiché
        aff = page.evaluate(JS_ECRANS)
        section("T5 écrans (accueil) : #play et #lvscreen masqués",
                aff["home"] != "none" and aff["play"] == "none" and aff["lvscreen"] == "none",
                f"home={aff['home']}, lvscreen={aff['lvscreen']}, play={aff['play']}")

        # T5b — navigation réelle au clic : monde puis niveau
        page.click(".wrow[data-w='lagon']")
        aff = page.evaluate(JS_ECRANS)
        section("T5 écrans (liste des niveaux)",
                aff["lvscreen"] != "none" and aff["home"] == "none" and aff["play"] == "none",
                f"home={aff['home']}, lvscreen={aff['lvscreen']}, play={aff['play']}")
        page.click(".lvcard[data-i='0']")
        aff = page.evaluate(JS_ECRANS)
        section("T5 écrans (niveau ouvert) : #play visible, le reste masqué",
                aff["play"] == "flex" and aff["home"] == "none" and aff["lvscreen"] == "none",
                f"home={aff['home']}, lvscreen={aff['lvscreen']}, play={aff['play']}")

        # T2 + T3 — les 60 solutions gagnent, tous les fruits sont ramassés
        res = page.evaluate(JS_SOLUTIONS)
        perdants = [r["nom"] for r in res if not r["gagne"]]
        section("T2 solve(i) gagne pour les 60 niveaux", not perdants,
                f"{len(res)} solutions jouées" if not perdants else "perdants : " + ", ".join(perdants))
        sans_fruit = [r["nom"] for r in res if r["fruitsPris"] != r["fruitsTotal"]]
        total_fruits = sum(r["fruitsTotal"] for r in res)
        section("T3 tous les fruits ramassés par les solutions", not sans_fruit,
                f"{total_fruits} fruits" if not sans_fruit else "incomplets : " + ", ".join(sans_fruit))

        # T4 — passe étroite
        passe = page.evaluate(JS_PASSE)
        if "erreur" in passe:
            section("T4 la passe bloque un rayon trop épais", False, passe["erreur"])
        else:
            section("T4 la passe bloque un rayon trop épais",
                    (not passe["contourGagne"]) and passe["tronque"],
                    f"contournement perdant={not passe['contourGagne']}, rayon tronqué à la passe={passe['tronque']}")
            section("T4 les demi-rayons traversent la passe (contrôle positif)",
                    passe["vouluGagne"] and passe["demiPasse"], "")
        ctx1.close()

        # ============ passe 2 : téléphone en PAYSAGE — T6 ============
        ctx2, page = nouvelle_page(844, 390)
        page.goto(url, wait_until="load")
        page.wait_for_function("() => window.SOLEY && window.SOLEY.LV")
        page.click(".wrow[data-w='lagon']")
        page.click(".lvcard[data-i='0']")
        page.wait_for_function("() => getComputedStyle(document.getElementById('play')).display === 'flex'")

        # T6a — zéro défilement de page
        defil = page.evaluate("""() => {
          const d = document.documentElement;
          return { sw: d.scrollWidth, cw: d.clientWidth, sh: d.scrollHeight, ch: d.clientHeight };
        }""")
        section("T6 paysage : zéro défilement de page",
                defil["sw"] <= defil["cw"] + 1 and defil["sh"] <= defil["ch"] + 1,
                f"{defil['sw']}x{defil['sh']} dans {defil['cw']}x{defil['ch']}")

        # T6b — plateau à gauche, commandes à droite
        cotes = page.evaluate("""() => {
          const b = document.getElementById('boardbox').getBoundingClientRect();
          const r = document.getElementById('playright').getBoundingClientRect();
          return { plateauDroit: b.right, colonneGauche: r.left };
        }""")
        section("T6 paysage : plateau à gauche de la colonne de commandes",
                cotes["colonneGauche"] >= cotes["plateauDroit"] - 2,
                f"bord plateau={cotes['plateauDroit']:.0f}, colonne={cotes['colonneGauche']:.0f}")

        # T6c — clic précis sur une case (letterbox pris en compte), même règle que le jeu
        page.click(".chip[data-i='0']")
        cible = page.evaluate(f"""() => {{
          const L = window.SOLEY.LV[0];
          const r = document.getElementById('board').getBoundingClientRect();
          const W = L.cols * {CS}, H = L.rows * {CS};
          const sc = Math.min(r.width / W, r.height / H);
          const ox = r.left + (r.width - W * sc) / 2, oy = r.top + (r.height - H * sc) / 2;
          const [ti, x, y] = L.sol[0];
          return {{ px: ox + (x + 0.5) * sc * {CS}, py: oy + (y + 0.5) * sc * {CS}, x, y }};
        }}""")
        page.mouse.click(cible["px"], cible["py"])
        pose = page.evaluate(f"() => window.SOLEY.state.placed['{cible['x']},{cible['y']}']?.ti")
        section("T6 paysage : le clic pose la pièce dans la bonne case", pose == 0,
                f"case ({cible['x']},{cible['y']})")

        # T6d — la victoire de bout en bout : cinématique puis fenêtre « Lévé ! »
        try:
            page.wait_for_selector("#winov.show", timeout=12000)
            fin = True
        except Exception:
            fin = False
        section("T6 victoire réelle au clic : cinématique puis fenêtre de fin", fin, "")

        # Bonus — sauvegarde locale par clé stable monde:nom + étoiles de la victoire
        sauv = page.evaluate("""() => {
          try { return JSON.parse(localStorage.getItem('soley-save-v5')); } catch (e) { return null; }
        }""")
        section("Bonus sauvegarde : clé « lagon:Premier rayon » enregistrée",
                bool(sauv and sauv.get("done", {}).get("lagon:Premier rayon")), "")
        et = page.evaluate("() => ({ e: window.SOLEY.etoiles(0), stars: document.getElementById('winstars').textContent })")
        pieces = (sauv or {}).get("pieces", {}).get("lagon:Premier rayon")
        section("Bonus étoiles : victoire à 1 pièce = ★★★ (pièces enregistrées)",
                pieces == 1 and et["e"] == 3 and et["stars"] == "★★★",
                f"pieces={pieces}, etoiles={et['e']}, affiché={et['stars']}")
        ctx2.close()

        # ============ passe 3 : progression verrouillée — T8 (portrait téléphone) ============
        ctx3, page = nouvelle_page(390, 844)
        page.goto(url, wait_until="load")
        page.wait_for_function("() => window.SOLEY && window.SOLEY.LV")

        # T8a — seuils de déblocage : ⌈5/8 des niveaux du monde précédent⌉
        seuils = page.evaluate("() => window.SOLEY.LV.length === 60 && [0,1,2,3,4,5,6,7].map(i => window.SOLEY.seuilMonde(i))")
        section("T8 seuils de déblocage ⌈5/8⌉ par monde", seuils == [0, 5, 6, 5, 5, 5, 4, 5],
                f"{seuils}")

        # T8b — sauvegarde vierge : seul Le lagon est ouvert
        verrous = page.evaluate("""() => [...document.querySelectorAll('.wrow')]
          .map(b => b.dataset.w + (b.classList.contains('locked') ? ':fermé' : ':ouvert'))""")
        section("T8 accueil neuf : lagon ouvert, les 7 autres mondes fermés",
                verrous == ["lagon:ouvert", "foret:fermé", "volcan:fermé", "pitons:fermé",
                            "soleils:fermé", "marche:fermé", "tunnels:fermé", "mafate:fermé"],
                ", ".join(verrous))

        # T8c — cliquer un monde fermé ne quitte pas l'accueil, la condition est lisible
        # (force : aria-disabled rend le bouton « non actionnable » pour Playwright,
        #  mais un vrai doigt peut le toucher — c'est ce geste qu'on teste)
        page.click(".wrow[data-w='foret']", force=True)
        aff = page.evaluate(JS_ECRANS)
        cond = page.evaluate("() => document.querySelector(\".wrow[data-w='foret'] .wcond\")?.textContent || ''")
        section("T8 monde fermé : clic sans effet + condition affichée",
                aff["home"] != "none" and aff["lvscreen"] == "none" and "Réussis 5 niveaux" in cond,
                cond.strip())

        # T8d — zéro défilement horizontal sur l'accueil téléphone
        defil = page.evaluate("() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })")
        section("T8 accueil téléphone : zéro défilement horizontal",
                defil["sw"] <= defil["cw"] + 1, f"{defil['sw']} dans {defil['cw']}")
        ctx3.close()

        # ============ passe 4 : sauvegarde amorcée + mode classe ============
        GRAINE = ("try{localStorage.setItem('soley-save-v5',JSON.stringify({"
                  "done:{'lagon:Premier rayon':true,'lagon:Zigzag dans les roches':true,"
                  "'lagon:Moitié-moitié':true,'lagon:La part perdue':true,'lagon:Partage en tiers':true},"
                  "fruits:{'lagon:Zigzag dans les roches':1},"
                  "pieces:{'lagon:Zigzag dans les roches':2}}));}catch(e){}")
        ctx4 = navig.new_context(viewport={"width": 390, "height": 844}, locale="fr-FR")
        ctx4.add_init_script(INIT_CONSENTEMENT)
        ctx4.add_init_script(GRAINE)
        pg4 = ctx4.new_page()
        pg4.on("pageerror", lambda e: erreurs_js.append(str(e)))
        pg4.on("console", lambda m: erreurs_console.append(m.text) if m.type == "error" else None)
        pg4.set_default_timeout(15000)
        pg4.goto(url, wait_until="load")
        pg4.wait_for_function("() => window.SOLEY && window.SOLEY.LV")
        etat = pg4.evaluate("""() => ({
          foret: !document.querySelector(".wrow[data-w='foret']").classList.contains('locked'),
          volcan: document.querySelector(".wrow[data-w='volcan']").classList.contains('locked'),
        })""")
        section("T8 après 5 réussites au lagon : forêt ouverte, volcan encore fermé",
                etat["foret"] and etat["volcan"], "")
        pg4.click(".wrow[data-w='lagon']")
        cartes = pg4.evaluate("""() => ({
          zigzag: document.querySelector(".lvcard[data-i='1'] .st").textContent,
          premier: document.querySelector(".lvcard[data-i='0'] .st").textContent,
        })""")
        section("T8 étoiles sur les cartes : ★★★ (fruits + maîtrise) et ★★☆ (sans défi)",
                cartes["zigzag"].startswith("★★★") and cartes["premier"].startswith("★★☆"),
                f"zigzag={cartes['zigzag']!r}, premier={cartes['premier']!r}")
        ctx4.close()

        # T8e — mode classe : tout est ouvert, badge visible
        sep = "&" if "?" in url else "?"
        ctx5, page = nouvelle_page(390, 844)
        page.goto(url + sep + "classe", wait_until="load")
        page.wait_for_function("() => window.SOLEY && window.SOLEY.LV")
        classe = page.evaluate("""() => ({
          verrouilles: document.querySelectorAll('.wrow.locked').length,
          badge: !!document.querySelector('.classebadge'),
          mafate: !!document.querySelector(".wrow[data-w='mafate']"),
        })""")
        section("T8 mode classe (?classe) : tous les mondes ouverts + badge",
                classe["verrouilles"] == 0 and classe["badge"] and classe["mafate"], "")
        ctx5.close()
        navig.close()

    if httpd:
        httpd.shutdown()

    # T7 — zéro erreur JavaScript sur l'ensemble des deux passes
    ok_js = not erreurs_js and not erreurs_console
    detail = ""
    if erreurs_js:
        detail += "exceptions : " + " | ".join(erreurs_js[:5])
    if erreurs_console:
        detail += (" ; " if detail else "") + "console : " + " | ".join(erreurs_console[:5])
    print(f"[{'PASS' if ok_js else 'FAIL'}] T7 zéro erreur JavaScript" + (f" — {detail}" if detail else ""))
    if not ok_js:
        echecs.append("T7")

    print()
    if echecs:
        print(f"ÉCHEC : {len(echecs)} section(s) en défaut → " + " ; ".join(echecs))
        return 1
    print("TOUT EST VERT — batterie complète réussie.")
    return 0


if __name__ == "__main__":
    sys.exit(principal())
