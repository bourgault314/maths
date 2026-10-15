# -*- coding: utf-8 -*-
"""Cherche, pour chaque problème du livret 2, la graine de l'outil (outils/splat.html) qui tire
EXACTEMENT ses nombres — le générateur rejoué dans Chromium, comme pour le livret 1.
MATHS_RACINE=/home/claude/maths python3 cherche_graines.py [codes…]"""
import asyncio, functools, http.server, json, os, socketserver, sys, threading
from pathlib import Path
RACINE = Path(os.environ.get("MATHS_RACINE", "/home/claude/maths"))
PORT = int(os.environ.get("PORT", "8132"))
C = "mode=C&clues=SENTENCE&visibleMin=0&visibleMax=0&cards=1"
D = "&visibleMin=0&visibleMax=0&cards=1"

# code : (famille, adresse, attendu)
#   C : vals = valeurs cachées triées (avec répétitions), total, vis = jetons visibles, indices = regex à trouver dans l'ordre
#   N : vals (par tache), total, vis = somme des visibles
#   D : values = {couleur: valeur} par ordre des couleurs A,B,C ; totaux = totaux des plateaux dans l'ordre de l'outil
SPECS = {
 "6.1": ("C", C + "&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=0&sub=1&deltaMax=12&totalMin=90&totalMax=90",
         dict(vals=[24, 30, 36], total=90, indices=[r"12 jetons de moins", r"6 jetons de moins"])),
 "6.2": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=75&totalMax=75",
         dict(vals=[15, 24, 36], total=75, indices=[r"9 jetons de plus", r"12 jetons de plus"])),
 "6.3": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=13&totalMin=94&totalMax=94",
         dict(vals=[20, 33, 41], total=94, indices=[r"13 jetons de plus", r"8 jetons de moins"])),
 "6.4": ("C", C + "&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=18&totalMin=150&totalMax=150",
         dict(vals=[42, 48, 60], total=150, indices=[r"18 jetons de plus", r"12 jetons de moins"])),
 "7.1": ("C", C + "&splats=2&mul=0&div=1&add=0&sub=0&deltaMax=10&vocab=1&totalMin=36&totalMax=36",
         dict(vals=[12, 24], total=36, indices=[r"moiti"])),
 "7.2": ("C", C + "&splats=3&structure=REF&ordre=DESSIN&mul=1&div=1&add=0&sub=0&deltaMax=12&totalMin=40&totalMax=40",
         dict(vals=[5, 15, 20], total=40, indices=[r"3 fois plus", r"4 fois moins"])),
 "7.3": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=0&add=0&sub=0&deltaMax=12&totalMin=63&totalMax=63",
         dict(vals=[7, 14, 42], total=63, indices=[r"2 fois plus", r"3 fois plus"])),
 "7.4": ("C", C + "&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=0&add=1&sub=0&deltaMax=12&totalMin=65&totalMax=65",
         dict(vals=[11, 18, 36], total=65, indices=[r"7 jetons de plus", r"2 fois plus"])),
 "8.1": ("C", C + "&splats=2&compose=1&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=35&totalMax=35",
         dict(vals=[10, 25], total=35, indices=[r"5 jetons de plus que le double"])),
 "8.2": ("C", C + "&splats=2&compose=1&mul=0&div=0&add=0&sub=1&deltaMax=12&totalMin=92&totalMax=92",
         dict(vals=[24, 68], total=92, indices=[r"4 jetons de moins que le triple"])),
 "8.3": ("C", C + "&splats=3&structure=HASARD&reunies=1&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=72&totalMax=72",
         dict(vals=[15, 21, 36], total=72, indices=[r"6 jetons de plus", r"réunies"])),
 "8.4": ("C", "mode=C&clues=SENTENCE&visibleMin=1&visibleMax=1&cards=1&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=20&totalMax=20",
         dict(vals=[7, 9], total=20, vis=[4], indices=[r"2 jetons de plus"])),
 "9.1": ("N", "mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=3&tasksMax=3&visibleMin=2&visibleMax=2&totalMin=23&totalMax=23&cards=1",
         dict(vals=[6, 6, 6], total=23, vis=5)),
 "9.2": ("N", "mode=N&equation=AX_PLUS_C_EQ_B&tasksMin=5&tasksMax=5&visibleMin=2&visibleMax=2&totalMin=86&totalMax=86&cards=1",
         dict(vals=[16] * 5, total=86, vis=6)),
 "9.3": ("C", C + "&splats=2&repeat=3&mul=0&div=0&add=0&sub=1&deltaMax=10&totalMin=44&totalMax=60",
         dict(vals=[7, 7, 10, 10, 10], total=44, indices=[r"3 jetons de moins"])),
 "9.4": ("C", C + "&splats=2&repeat=3&mul=0&div=1&add=0&sub=0&deltaMax=10&totalMin=350&totalMax=500",
         dict(vals=[50, 50, 50, 100, 100], total=350, indices=[r"2 fois moins"])),
 "10.1": ("D", "mode=D&geste=COEF&ecart=1&totalMin=27&totalMax=27" + D, dict(values=[9, 3], totaux=[27, 24])),
 "10.2": ("D", "mode=D&geste=EMBOITE1&totalMin=54&totalMax=54" + D, dict(values=[18, 15, 21], totaux=[54, 33, 36])),
 "10.3": ("D", "mode=D&geste=ESCALIER&totalMin=25&totalMax=25" + D, dict(values=[7, 3, 4], totaux=[25, 17, 14])),
 "10.4": ("D", "mode=D&geste=TROIS&totalMin=15&totalMax=15" + D, dict(values=[4, 5, 6], totaux=[None, 9, 11, 10])),
 # la page 2 : l'exemple « je complète » (deux « de plus », la plus grande en sujet)
 "Ex": ("C", C + "&splats=3&structure=COMPLETE&ordre=DESSIN&mul=0&div=0&add=1&sub=0&deltaMax=12&totalMin=64&totalMax=64",
        dict(vals=[18, 21, 25], total=64, indices=[r"7 jetons de plus", r"4 jetons de plus"])),
}

JS_TIRE = """([fam, g]) => { const rng = makeRng(String(g));
  const c = fam === 'C' ? genInvestigate(rng) : fam === 'N' ? genNumbered(rng) : genSystem(rng);
  if(fam === 'D') return { values: c._sys.colors.map(k => c._sys.values[k]), totaux: c._sys.boards.map(b => b.total), total: c.total,
     geste: c._sys.geste, counts: c._sys.boards.map(b => b.counts), vis: c.visible.map(Number) };
  const v = (c._rel ? c._rel.hiddenValues : c.hidden).map(Number);
  return { vals: v.slice().sort((a,b)=>a-b), total: c.total, vis: c.visible.map(Number),
     indices: c._inv ? c._inv.indices.map(i => typeof i === 'string' ? i : JSON.stringify(i)) : [],
     colorMap: c._rel ? c._rel.colorMap : (c._colorMap || null), brut: c._rel ? c._rel.hiddenValues : null }; }"""

JS_CHERCHE = """([fam, g0, n, att]) => {
  const ok = c => {
    if(fam === 'D'){
      if(JSON.stringify(c.values) !== JSON.stringify(att.values)) return false;
      if(JSON.stringify(c.totaux) !== JSON.stringify(att.totaux)) return false;
      return true;
    }
    if(JSON.stringify(c.vals) !== JSON.stringify(att.vals)) return false;
    if(c.total !== att.total) return false;
    if(fam === 'N'){ return c.vis.reduce((a,b)=>a+b,0) === att.vis; }
    if(att.vis && JSON.stringify(c.vis.slice().sort((a,b)=>a-b)) !== JSON.stringify(att.vis)) return false;
    if(!att.vis && c.vis.length) return false;
    if(att.indices){
      const s = c.indices.join(' || ');
      let pos = 0;
      for(const re of att.indices){ const m = s.slice(pos).search(new RegExp(re)); if(m < 0) return false; pos += m + 1; }
    }
    return true;
  };
  const tire = g => { const rng = makeRng(String(g));
    const c = fam === 'C' ? genInvestigate(rng) : fam === 'N' ? genNumbered(rng) : genSystem(rng);
    if(fam === 'D') return { values: c._sys.colors.map(k => c._sys.values[k]), totaux: c._sys.boards.map(b => b.total) };
    const v = (c._rel ? c._rel.hiddenValues : c.hidden).map(Number);
    return { vals: v.slice().sort((a,b)=>a-b), total: c.total, vis: c.visible.map(Number), indices: c._inv ? c._inv.indices.map(i => typeof i === 'string' ? i : JSON.stringify(i)) : [] }; };
  for(let g = g0; g < g0 + n; g++){ try{ if(ok(tire(g))) return g; }catch(e){} }
  return null; }"""

def serveur():
    class Gestion(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k): pass
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Gestion, directory=str(RACINE)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def main(codes):
    from playwright.async_api import async_playwright
    out = {}
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")
        pg = await nav.new_page(viewport={"width": 1200, "height": 900})
        for code in codes:
            fam, q, att = SPECS[code]
            await pg.goto(f"http://127.0.0.1:{PORT}/outils/splat.html?{q}&unknown=question", wait_until="networkidle")
            await pg.wait_for_timeout(200)
            ex = await pg.evaluate(JS_TIRE, [fam, 1])
            print(code, "exemple graine 1 :", json.dumps(ex, ensure_ascii=False)[:300])
            g, pas, trouve = 1, 20000, None
            while g < 3_000_000:
                r = await pg.evaluate(JS_CHERCHE, [fam, g, pas, att])
                if r is not None:
                    trouve = r; break
                g += pas
            if trouve is None:
                print(code, "AUCUNE graine"); continue
            c = await pg.evaluate(JS_TIRE, [fam, trouve])
            print(code, "→ graine", trouve, json.dumps(c, ensure_ascii=False))
            out[code] = (fam, q, trouve, c)
        await nav.close()
    Path(os.environ.get("GRAINES_SORTIE", "graines-trouvees.json")).write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")

if __name__ == "__main__":
    srv = serveur()
    try:
        asyncio.run(main([a for a in sys.argv[1:]] or list(SPECS)))
    finally:
        srv.shutdown()
