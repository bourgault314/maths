# -*- coding: utf-8 -*-
"""Cherche, pour chaque problème du livret 3, la graine de l'outil qui tire EXACTEMENT ses nombres —
le générateur rejoué dans Chromium, comme pour les livrets 1 et 2.
  C (Enquête) et D (Système) : outils/splat.html, genInvestigate / genSystem(makeRng(String(graine)))
  B (la balance, monde 5 fiche 37) : outils/splat_equations.html, genEquationStep(makeRng(String(graine)))
MATHS_RACINE=/home/claude/maths python3 cherche_graines.py [codes…]"""
import asyncio, functools, http.server, json, os, socketserver, sys, threading
from pathlib import Path
RACINE = Path(os.environ.get("MATHS_RACINE", "/home/claude/maths"))
PORT = int(os.environ.get("PORT", "8132"))
C = "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1"
D = "&visibleMin=0&visibleMax=0&cards=1"
B = "mode=EQSTEP&form=BOTH&cards=1"

# code : (famille, adresse, attendu)
#   C : vals = valeurs cachées triées, total, indices = regex à trouver dans l'ordre
#   D : values = valeurs par ordre des couleurs A, B, C ; totaux = totaux des plateaux dans l'ordre de l'outil ; vis = jetons visibles du grand
#   B : cotes = [[taches, paquets triés], [taches, paquets triés]] dans l'ordre de l'énoncé, x ; exact = pas de retournement
SPECS = {
 # la page 2 et la couverture : la balance
 "ExB": ("B", B + "&tasksMax=3&visibleMin=1&visibleMax=1&totalMin=28&totalMax=28", dict(cotes=[[3, [4]], [1, [20]]], x=8, exact=True)),
 # fiche H11 : la balance
 "11.1": ("B", B + "&tasksMax=5&visibleMin=0&visibleMax=1&totalMin=125&totalMax=125", dict(cotes=[[5, []], [3, [50]]], x=25)),
 "11.2": ("B", B + "&tasksMax=5&visibleMin=1&visibleMax=1&totalMin=38&totalMax=38", dict(cotes=[[3, [20]], [5, [8]]], x=6)),
 "11.3": ("B", B + "&tasksMax=4&visibleMin=1&visibleMax=1&totalMin=47&totalMax=47", dict(cotes=[[4, [7]], [2, [27]]], x=10)),
 "11.4": ("B", B + "&tasksMax=5&visibleMin=1&visibleMax=2&totalMin=57&totalMax=57", dict(cotes=[[5, [12]], [3, [14, 16]]], x=9)),
 # fiche H12 : les rapports, niveau 3
 "12.1": ("C", C + "&splats=3&structure=REF&ordre=DESSIN&mul=0&div=1&add=0&sub=0&deltaMax=12&totalMin=72&totalMax=72",
          dict(vals=[12, 24, 36], total=72, indices=[r"3 fois moins", r"2 fois moins"])),
 "12.2": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&totalMin=27&totalMax=27",
          dict(vals=[3, 6, 18], total=27, indices=[r"2 fois plus", r"3 fois moins"])),
 "12.3": ("C", C + "&splats=3&structure=REF&ordre=DESSIN&mul=0&div=1&add=0&sub=1&deltaMax=12&totalMin=49&totalMax=49",
          dict(vals=[9, 13, 27], total=49, indices=[r"3 fois moins", r"4 jetons de moins"])),
 "12.4": ("C", C + "&splats=3&structure=COMPLETE&ordre=DESSIN&mul=1&div=0&add=0&sub=1&deltaMax=12&totalMin=45&totalMax=45",
          dict(vals=[7, 17, 21], total=45, indices=[r"3 fois plus", r"4 jetons de moins"])),
 # fiche H13 : les petites parts et le désordre (et la page 5)
 "ExU": ("C", C + "&splats=3&structure=UNITE&mul=1&div=0&add=0&sub=0&deltaMax=15&totalMin=55&totalMax=55",
          dict(vals=[10, 15, 30], total=55, indices=[r"2 fois plus", r"3 fois plus"])),
 "13.1": ("C", C + "&splats=3&structure=UNITE&mul=1&div=0&add=0&sub=0&deltaMax=15&totalMin=110&totalMax=110",
          dict(vals=[20, 30, 60], total=110, indices=[r"2 fois plus", r"3 fois plus"])),
 "13.2": ("C", C + "&splats=3&structure=UNITE&mul=1&div=1&add=0&sub=0&deltaMax=15&totalMin=57&totalMax=57",
          dict(vals=[9, 12, 36], total=57, indices=[r"3 fois plus", r"4 fois moins"])),
 "13.3": ("C", C + "&splats=3&structure=CHAINE&ordre=DESORDRE&mul=0&div=0&add=0&sub=1&deltaMax=12&totalMin=35&totalMax=35",
          dict(vals=[8, 11, 16], total=35, indices=[r"5 jetons de moins", r"3 jetons de moins"])),
 "13.4": ("C", C + "&splats=3&structure=CHAINE&ordre=DESORDRE&mul=1&div=1&add=0&sub=0&deltaMax=12&totalMin=54&totalMax=54",
          dict(vals=[6, 12, 36], total=54, indices=[r"3 fois plus", r"2 fois moins"])),
 # fiche H14 : je recopie (Système)
 "14.1": ("D", "mode=D&geste=DOUBLE&fois=2&sens=INDICE&indice=12&totalMin=32&totalMax=32" + D, dict(values=[7, 6], totaux=[32, 19])),
 "14.2": ("D", "mode=D&geste=MIROIR&forme=13&totalMin=35&totalMax=35" + D, dict(values=[5, 10], totaux=[35, 25])),
 "14.3": ("D", "mode=D&geste=RECOPIE&fois=2&totalMin=46&totalMax=90" + D, dict(values=[18, 7], totaux=[46, 43])),
 "14.4": ("D", "mode=D&geste=RECOPIE&fois=3&totalMin=49&totalMax=110" + D, dict(values=[22, 9], totaux=[49, 84])),
 # fiche H15 : deux gestes à la suite (et la page 9)
 "ExG": ("D", "mode=D&geste=ETAGES&sous=COEF&ecart=2&grand=112&totalMin=52&totalMax=75" + D, dict(values=[10, 12, 15], totaux=[52, 46, 22])),
 "15.1": ("D", "mode=D&geste=ETAGES&sous=COEF&ecart=2&grand=211&totalMin=33&totalMax=33" + D, dict(values=[8, 5, 12], totaux=[33, 31, 21])),
 "15.2": ("D", "mode=D&geste=ETAGES&sous=MIROIR&grand=112&totalMin=65&totalMax=125" + D, dict(values=[10, 25, 15], totaux=[65, 60, 45])),
 "15.3": ("D", "mode=D&geste=ETAGES&sous=RECOPIE&fois=2&grand=112&totalMin=53&totalMax=100" + D, dict(values=[20, 7, 13], totaux=[53, 41, 47])),
 "15.4": ("D", "mode=D&geste=EMBOITE1&ordre=MELANGE&visibleMin=1&visibleMax=1&cards=1&totalMin=24&totalMax=24", dict(values=[10, 7, 5], totaux=[24, 17, 12], vis=[2])),
}

JS_TIRE = """([fam, g]) => { const rng = makeRng(String(g));
  if(fam === 'B'){ const c = genEquationStep(rng), e = c._eq;
    return { x:e.x, total:e.total, gauche:[e.left.tasks, e.left.visible.map(Number)], droite:[e.right.tasks, e.right.visible.map(Number)] }; }
  const c = fam === 'C' ? genInvestigate(rng) : genSystem(rng);
  if(fam === 'D') return { values: c._sys.colors.map(k => c._sys.values[k]), totaux: c._sys.boards.map(b => b.total), total: c.total,
     geste: c._sys.geste, type: sysTypeCarte(c), counts: c._sys.boards.map(b => b.counts), vis: c.visible.map(Number) };
  const v = c._rel.hiddenValues.map(Number);
  return { vals: v.slice().sort((a,b)=>a-b), total: c.total, vis: c.visible.map(Number),
     indices: c._inv.indices.map(i => typeof i === 'string' ? i : JSON.stringify(i)) }; }"""

JS_CHERCHE = """([fam, g0, n, att]) => {
  const tri = a => a.slice().sort((x, y) => x - y);
  const memeCote = (c, a) => c[0] === a[0] && JSON.stringify(tri(c[1])) === JSON.stringify(tri(a[1]));
  const ok = g => {
    const rng = makeRng(String(g));
    if(fam === 'B'){
      const e = genEquationStep(rng)._eq;
      if(e.x !== att.x) return false;
      const G = [e.left.tasks, e.left.visible.map(Number)], D = [e.right.tasks, e.right.visible.map(Number)];
      if(memeCote(G, att.cotes[0]) && memeCote(D, att.cotes[1])) return true;
      return !att.exact && memeCote(D, att.cotes[0]) && memeCote(G, att.cotes[1]);
    }
    const c = fam === 'C' ? genInvestigate(rng) : genSystem(rng);
    if(fam === 'D'){
      if(JSON.stringify(c._sys.colors.map(k => c._sys.values[k])) !== JSON.stringify(att.values)) return false;
      if(JSON.stringify(c._sys.boards.map(b => b.total)) !== JSON.stringify(att.totaux)) return false;
      if(JSON.stringify(c.visible.map(Number)) !== JSON.stringify(att.vis || [])) return false;
      return true;
    }
    if(JSON.stringify(tri(c._rel.hiddenValues.map(Number))) !== JSON.stringify(att.vals)) return false;
    if(c.total !== att.total || c.visible.length) return false;
    const s = c._inv.indices.map(i => typeof i === 'string' ? i : JSON.stringify(i)).join(' || ');
    let pos = 0;
    for(const re of att.indices){ const m = s.slice(pos).search(new RegExp(re)); if(m < 0) return false; pos += m + 1; }
    return true;
  };
  for(let g = g0; g < g0 + n; g++){ try{ if(ok(g)) return g; }catch(e){} }
  return null; }"""

def serveur():
    class Gestion(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Gestion, directory=str(RACINE)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def page(fam):
    return "splat_equations.html" if fam == "B" else "splat.html"

async def main(codes):
    from playwright.async_api import async_playwright
    out = {}
    sortie = Path(os.environ.get("GRAINES_SORTIE", "graines-trouvees.json"))
    if sortie.exists():
        out = json.loads(sortie.read_text(encoding="utf-8"))
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")
        pg = await nav.new_page(viewport={"width": 1200, "height": 900})
        for code in codes:
            fam, q, att = SPECS[code]
            await pg.goto(f"http://127.0.0.1:{PORT}/outils/{page(fam)}?{q}&unknown=question", wait_until="networkidle")
            await pg.wait_for_timeout(200)
            g, pas, trouve = 1, 20000, None
            while g < 6_000_000:
                r = await pg.evaluate(JS_CHERCHE, [fam, g, pas, att])
                if r is not None:
                    trouve = r; break
                g += pas
            if trouve is None:
                ex = await pg.evaluate(JS_TIRE, [fam, 1])
                print(code, "AUCUNE graine ; exemple graine 1 :", json.dumps(ex, ensure_ascii=False)[:300], flush=True); continue
            c = await pg.evaluate(JS_TIRE, [fam, trouve])
            print(code, "→ graine", trouve, json.dumps(c, ensure_ascii=False), flush=True)
            out[code] = (fam, q, trouve, c)
            sortie.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        await nav.close()

if __name__ == "__main__":
    srv = serveur()
    try:
        asyncio.run(main([a for a in sys.argv[1:]] or list(SPECS)))
    finally:
        srv.shutdown()
