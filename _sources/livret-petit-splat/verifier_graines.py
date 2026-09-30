#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Contrôle des graines des livrets Petit SPLAT! d'origine (« Je complète le schéma »).

Pourquoi ce script (30/09/2026) : les graines des trois livrets (Monde 1, Avancé, Expert)
ont été retriées sur le livret entier avec les règles fixées par Gwenaël le 28/09 (1 à 8)
et le 29/09 (9) — voir CHOIX DES GRAINES dans render.py. Ce script rejoue les 18 fiches
et vérifie que ces règles tiennent toujours : après une évolution de l'outil
(outils/splat_tache_barre.html) ou un changement de graine, on le relance.

Les cartes d'une fiche viennent de SA graine, et la place des jetons passe par le canvas :
on ne peut rejouer une série exacte que dans un vrai navigateur. Le script ouvre donc, dans
Chromium, la fiche IMPRIMÉE exactement comme render.py (énoncé puis corrigé,
correction=1&rv=0, avec les réglages de la fiche) et la lit comme un élève.

Ce qu'il vérifie :
  · règle 8, sur la fiche imprimée : chaque carte n'a qu'UNE réponse possible avec ce qui
    est dessiné — carte « complète » : le total, les jetons dessinés, les taches ; carte
    « dessine » : le total, la case blanche si elle existe, le nombre écrit, le nombre de
    cases grises — et c'est celle du corrigé ; les jetons ne se chevauchent pas, aucun n'est
    mordu par une tache ou par la pastille du total, ni coupé par le bord ; au corrigé,
    exactement les jetons posés ;
  · règles 1 à 7 et 9 sur le livret entier (liste dans render.py) ;
  · la liste des 12 cartes de chaque étape du monde 1 dans outils/splat_univers.html (eqs)
    est celle que le jeu donne, et ses adresses portent les graines du livret Monde 1 ;
  · les QR des fiches (qr/, qr/avance/, qr/expert/) sont à jour : chaque PNG est, pixel pour
    pixel, le QR de l'adresse que render.py fabrique aujourd'hui (sinon : render.py --qr).

Usage :
  python3 verifier_graines.py                 # les trois livrets
  python3 verifier_graines.py avance          # un seul
Sortie : 0 si tout est bon, 1 sinon. Dépendances : playwright (chromium), qrcode[pil].
"""
import asyncio, functools, http.server, io, json, re, socketserver, sys, threading
from collections import Counter, defaultdict
from pathlib import Path

ICI = Path(__file__).resolve().parent
RACINE = ICI.parent.parent
sys.path.insert(0, str(ICI))
import render  # noqa: E402  (les graines, les fiches, les adresses des QR)

NIVEAUX = ("normal", "avance", "expert")
DESSINE = (2, 3, 6)          # fiches où l'élève dessine des jetons
COMPLETE = (1, 3, 4, 5)      # fiches où l'élève complète le schéma
# Règle 2 : la fiche 4 du Monde 1 a 12 cartes à deux taches pour 10 divisions possibles
# jusqu'à 20 (2, 4, …, 20 jetons cachés) : deux répétitions sont inévitables, tolérées.
REPETITIONS_TOLEREES = {("normal", 4): 2}

# ------------------------------------------------------------ lecture de la fiche imprimée
LIRE = r"""() => {
  const pages = [...document.getElementById('mainArea').children];
  const lirePage = (pg) => [...pg.querySelectorAll('.cell')].map(cell => {
    const svg = cell.querySelector('.part-splat svg');
    const badge = cell.querySelector('.total-badge');
    const circles = svg ? [...svg.querySelectorAll('circle')] : [];
    const paths = svg ? [...svg.querySelectorAll('path.splat-path')] : [];
    const vb = svg.viewBox.baseVal;
    let chev = 0, mordu = 0, pastille = 0, dehors = 0;
    const br = badge.getBoundingClientRect();
    const pts = circles.map(c => [c.cx.baseVal.value, c.cy.baseVal.value, c.r.baseVal.value]);
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d < pts[i][2] + pts[j][2]) chev++;
    }
    circles.forEach((c, i) => {
      const [x, y, r] = pts[i];
      if (x - r < vb.x || y - r < vb.y || x + r > vb.x + vb.width || y + r > vb.y + vb.height) dehors++;
      const m = c.getScreenCTM();
      let touche = false;
      for (const p of paths) {
        const inv = p.getScreenCTM().inverse().multiply(m);
        for (let k = 0; k <= 16 && !touche; k++) {
          const a = k * Math.PI / 8, rr = k === 16 ? 0 : r;
          const q = new DOMPoint(x + rr * Math.cos(a), y + rr * Math.sin(a)).matrixTransform(inv);
          const sp = svg.createSVGPoint(); sp.x = q.x; sp.y = q.y;
          if (p.isPointInFill(sp)) touche = true;
        }
        if (touche) break;
      }
      if (touche) mordu++;
      const cr = c.getBoundingClientRect();
      if (badge.textContent.trim() !== '' && cr.right > br.left && cr.left < br.right && cr.bottom > br.top && cr.top < br.bottom) pastille++;
    });
    const top = cell.querySelector('.row-top');
    const boxes = [...cell.querySelectorAll('.row-bottom .part-box')];
    const blanches = boxes.filter(b => b.style.background.includes('white') || b.style.background.includes('255, 255, 255'));
    const grises = boxes.filter(b => !blanches.includes(b));
    return { badge: badge.textContent.trim(), ronds: circles.length, taches: paths.length,
             haut: top ? top.textContent.trim() : null,
             blanches: blanches.map(b => b.textContent.trim()), grises: grises.map(b => b.textContent.trim()),
             chev, mordu, pastille, dehors };
  });
  return pages.map(lirePage);
}"""

# Les cartes telles que l'outil les a tirées : [total, taches, posés, par tache, mode, indice]
ETAT = r"""() => state.map(c => [c.total, c.numSplats, c.visible, c.hiddenPerSplat, c.mode[0], c.clueGiven[0]])"""


def entier(s):
    try:
        return int(s)
    except (TypeError, ValueError):
        return None


def solutions(e, mode):
    """Toutes les réponses (posés, par tache) compatibles avec la carte imprimée de l'élève."""
    sols = []
    if mode == "f":      # complète : total, jetons dessinés, taches
        T, v, n = entier(e["badge"]), e["ronds"], e["taches"]
        if T is None or n == 0:
            return []
        for h in range(1, T + 1):
            if v + n * h == T:
                sols.append((v, h))
    else:                # dessine : le schéma
        T = entier(e["haut"]); n = len(e["grises"])
        if T is None or n == 0 or e["taches"] != n:
            return []
        blanche = len(e["blanches"]) > 0
        vdonne = entier(e["blanches"][0]) if blanche else None
        hdonne = [entier(x) for x in e["grises"] if x != ""]
        for v in range(0, T + 1):
            if blanche and v == 0:
                continue
            if not blanche and v > 0:
                continue
            if vdonne is not None and v != vdonne:
                continue
            for h in range(1, T + 1):
                if v + n * h != T:
                    continue
                if hdonne and any(x != h for x in hdonne):
                    continue
                sols.append((v, h))
    return sols


def defauts_impression(cartes, eleve, corrige):
    """Règle 8, carte par carte."""
    d = []
    for k, (c, e, co) in enumerate(zip(cartes, eleve, corrige), 1):
        T, n, v, h, m, _ = c
        s = solutions(e, m)
        pb = []
        if len(s) != 1:
            pb.append(f"{len(s)} réponses possibles")
        elif s[0] != (v, h):
            pb.append(f"réponse lue {s[0]} ≠ ({v}, {h})")
        if e["chev"]: pb.append(f"{e['chev']} jetons se chevauchent")
        if e["mordu"]: pb.append(f"{e['mordu']} jeton(s) mordu(s) par une tache")
        if e["pastille"]: pb.append(f"{e['pastille']} jeton(s) sous la pastille du total")
        if e["dehors"]: pb.append(f"{e['dehors']} jeton(s) coupé(s) par le bord")
        if co["ronds"] != v: pb.append(f"corrigé : {co['ronds']} jetons dessinés au lieu de {v}")
        if co["chev"]: pb.append(f"corrigé : {co['chev']} jetons se chevauchent")
        if pb:
            d.append(f"carte {k} ({lib(c)}) : " + ", ".join(pb))
    if len(cartes) != 12 or len(eleve) != 12 or len(corrige) != 12:
        d.append(f"{len(cartes)} cartes tirées, {len(eleve)} lues à l'énoncé, {len(corrige)} au corrigé (12 attendues)")
    return d


# ------------------------------------------------------------------ règles du livret entier
def lib(c):
    T, n, v, h, m = c[:5]
    s = f"{T} = " + (f"{v} + " if v else "") + (f"{n}×{h}" if n > 1 else f"{h}")
    return ("✏️ " if m == "c" else "") + s


def defauts_livret(L, F):
    """L : 'normal' | 'avance' | 'expert' ; F : {fiche: [12 cartes]} -> [défauts]."""
    r = []
    # 1. cartes identiques dans le livret (le mode compte : compléter ≠ dessiner)
    ids = defaultdict(list)
    for f, cs in F.items():
        for c in cs:
            ids[(c[4], c[0], c[1], c[2])].append(f)
    for k, v in ids.items():
        if len(v) > 1:
            r.append(f"1. carte identique : {k[1]} jetons, {k[2]} tache(s), {k[3]} posés (fiches {', '.join(map(str, v))})")
    # 1. cartes « à l'envers » sur une fiche
    for f, cs in F.items():
        for c in cs:
            if c[1] > 1 and c[1] < c[3] and any(d[0] == c[0] and d[2] == c[2] and d[1] == c[3] and d[3] == c[1] for d in cs):
                r.append(f"1. fiche {f} : {lib(c)} et son envers")
        une = defaultdict(set)
        for c in cs:
            if c[1] == 1:
                une[(c[0], min(c[2], c[3]))].add(c[2])
        for k, v in une.items():
            if len(v) > 1:
                r.append(f"1. fiche {f} : {k[0]} = {k[1]} + {k[0] - k[1]} et {k[0] - k[1]} + {k[1]}")
    # 2. divisions (jetons cachés ÷ taches)
    tout = Counter()
    for f, cs in F.items():
        d = Counter((c[1] * c[3], c[1]) for c in cs if c[1] >= 2)
        tout.update(d)
        rep = sum(v - 1 for v in d.values() if v > 1)
        if rep > REPETITIONS_TOLEREES.get((L, f), 0):
            r.append(f"2. fiche {f} : " + ", ".join(f"{k[0]} ÷ {k[1]} ({v} fois)" for k, v in d.items() if v > 1))
    for k, v in tout.items():
        if v > 2:
            r.append(f"2. {k[0]} ÷ {k[1]} : {v} fois dans le livret")
    # 3. fiches « dessine » : 1 ou 2 cartes « rien à dessiner »
    for f in DESSINE:
        z = sum(c[4] == "c" and c[2] == 0 for c in F.get(f, []))
        if f in F and not 1 <= z <= 2:
            r.append(f"3. fiche {f} : {z} carte(s) « rien à dessiner » (1 ou 2)")
    # 4. fiches « complète » : 1 ou 2 cartes « tout est caché », une à plusieurs taches en 4 et 5
    for f in COMPLETE:
        if f not in F:
            continue
        z = [c for c in F[f] if c[4] == "f" and c[2] == 0]
        if not 1 <= len(z) <= 2:
            r.append(f"4. fiche {f} : {len(z)} carte(s) « tout est caché » (1 ou 2)")
        elif f in (4, 5) and not any(c[1] >= 2 for c in z):
            r.append(f"4. fiche {f} : aucune carte « tout est caché » à plusieurs taches")
    # 5. au plus une réponse 1 par fiche, jamais de total 1
    for f, cs in F.items():
        k = sum(c[3] == 1 for c in cs)
        if k > 1:
            r.append(f"5. fiche {f} : {k} réponses 1")
        r += [f"5. fiche {f} : carte {lib(c)}" for c in cs if c[0] == 1]
    # 6. tranches
    for f, cs in F.items():
        if L in ("avance", "expert"):
            r += [f"6. fiche {f} : {lib(c)} (20 ou moins)" for c in cs if c[0] <= 20]
        if L == "expert":
            k = sum(c[0] > 50 for c in cs)
            if k < 9:
                r.append(f"6. fiche {f} : {k} cartes sur 12 au-dessus de 50 (au moins 9)")
    # 7. au plus 15 jetons à dessiner
    for f, cs in F.items():
        r += [f"7. fiche {f} : {lib(c)} ({c[2]} jetons à dessiner)" for c in cs if c[4] == "c" and c[2] > 15]
    # 9. une même réponse au plus 3 fois sur une fiche, jamais sur 3 cartes de suite
    for f, cs in F.items():
        h = [c[3] for c in cs]
        r += [f"9. fiche {f} : réponse {v} ({k} fois)" for v, k in Counter(h).items() if k > 3]
        r += [f"9. fiche {f} : réponse {h[i]}, cartes {i + 1} à {i + 3}"
              for i in range(len(h) - 2) if h[i] == h[i + 1] == h[i + 2]]
    return r


# ------------------------------------------------- l'univers : graines et liste des cartes
def eq(c, marque):
    """La carte comme la liste « Les 12 cartes » de la vue prof : 3𝑥 + 2 = 11, ✏️ au mélange."""
    T, n, v, h, m = c[:5]
    s = (f"{n}𝑥" if n > 1 else "𝑥") + (f" + {v}" if v else "") + f" = {T}"
    return s + (" ✏️" if marque and m == "c" else "")


def defauts_univers(F):
    univers = (RACINE / "outils" / "splat_univers.html").read_text(encoding="utf-8")
    graines = render.NIVEAUX["normal"]["graines"]
    d = []
    for f in range(1, 7):
        i = univers.find(f'p:"m1e{f}"')
        if i < 0:
            d.append(f"étape m1e{f} introuvable dans splat_univers.html"); continue
        fin = univers.find('"}', univers.find("f:PS+", i)) + 2
        bloc = univers[i:fin]
        seeds = re.findall(r"seed=(\d+)", bloc)
        if seeds != [graines[f]] * 2:
            d.append(f"m1e{f} : graines {seeds} au lieu de {graines[f]} (adresses j: et f:)")
        if f"&parcours=m1e{f}\"" not in bloc:
            d.append(f"m1e{f} : l'adresse du jeu ne porte plus parcours=m1e{f}")
        eqs = json.loads("[" + re.search(r"eqs:\[([^\]]*)\]", bloc).group(1) + "]")
        attendu = [eq(c, f == 3) for c in F[f]]
        if eqs != attendu:
            d.append(f"m1e{f} : la liste des 12 cartes (eqs) n'est pas celle du jeu :\n"
                     f"      dans la page : {eqs}\n      dans le jeu   : {attendu}")
    return d


# ------------------------------------------------------------------------- les QR codes
def defauts_qr(niv):
    import qrcode
    from qrcode.constants import ERROR_CORRECT_M
    from PIL import Image, ImageChops
    d = []
    for f in render.fiches_de(niv):
        png = ICI / niv["qr"] / f"fiche{f['n']}.png"
        q = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=12, border=2)
        q.add_data(render.lien_jeu(niv, f)); q.make(fit=True)
        tampon = io.BytesIO(); q.make_image(fill_color="black", back_color="white").save(tampon)
        attendu = Image.open(io.BytesIO(tampon.getvalue())).convert("L")
        if not png.exists():
            d.append(f"{png.relative_to(ICI)} manque"); continue
        present = Image.open(png).convert("L")
        if present.size != attendu.size or ImageChops.difference(present, attendu).getbbox():
            d.append(f"{png.relative_to(ICI)} n'est pas le QR de {render.lien_jeu(niv, f)} (relancer render.py --qr)")
    return d


# ------------------------------------------------------------------------------ rejouer
class _Discret(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):   # pas une ligne par fichier servi
        pass


def servir():
    h = functools.partial(_Discret, directory=str(RACINE))
    s = socketserver.TCPServer(("127.0.0.1", 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, s.server_address[1]


async def rejouer(niveaux, port):
    """{niveau: {fiche: (cartes, défauts d'impression)}}"""
    from playwright.async_api import async_playwright
    res = {}
    async with async_playwright() as p:
        # le vrai Chromium, comme render.py (le « headless shell » espace le texte autrement)
        nav = await p.chromium.launch(channel="chromium")
        pg = await nav.new_page(viewport={"width": 794, "height": 1123})
        await pg.emulate_media(media="print")
        for L in niveaux:
            niv = render.NIVEAUX[L]
            res[L] = {}
            for f in render.fiches_de(niv):
                url = (f"http://127.0.0.1:{port}/outils/splat_tache_barre.html?support=print&problem=classic"
                       f"&target={niv['target']}&splats={f['splats']}&exercise={f['ex']}"
                       f"&seed={niv['graines'][f['n']]}" + render.reglages(f) + "&qr=0&correction=1&rv=0")
                await pg.goto(url, wait_until="networkidle")
                await pg.wait_for_timeout(300)
                pages = await pg.evaluate(LIRE)
                cartes = await pg.evaluate(ETAT)
                if len(pages) != 2:
                    res[L][f["n"]] = (cartes, [f"{len(pages)} page(s) rendue(s) au lieu de 2 (énoncé, corrigé)"])
                    continue
                res[L][f["n"]] = (cartes, defauts_impression(cartes, pages[0], pages[1]))
        await nav.close()
    return res


def main():
    niveaux = [a for a in sys.argv[1:] if not a.startswith("-")] or list(NIVEAUX)
    inconnu = [a for a in niveaux if a not in NIVEAUX]
    if inconnu:
        raise SystemExit(f"niveau inconnu : {', '.join(inconnu)} (au choix : {', '.join(NIVEAUX)})")
    srv, port = servir()
    try:
        series = asyncio.run(rejouer(niveaux, port))
    finally:
        srv.shutdown()
    rouge = False
    for L, fiches in series.items():
        print(f"== {L} (cible {render.NIVEAUX[L]['target']})")
        for f, (cartes, d) in fiches.items():
            print(f"  fiche {f} ({render.NIVEAUX[L]['graines'][f]}) : " + " · ".join(lib(c) for c in cartes))
            for x in d:
                print(f"    ✗ 8. {x}")
            rouge |= bool(d)
        F = {f: cartes for f, (cartes, _) in fiches.items()}
        d = defauts_livret(L, F)
        if L == "normal":
            d += defauts_univers(F)
        d += defauts_qr(render.NIVEAUX[L])
        for x in d:
            print(f"    ✗ {x}")
        rouge |= bool(d)
        print("  livret : " + ("✗" if d else "ok (règles 1 à 9" + (", univers" if L == "normal" else "") + ", QR)"))
    sys.exit(1 if rouge else 0)


if __name__ == "__main__":
    main()
