# essai d'un corrigé : python3 essai.py 6.1 10.2 …  (sert à voir les erreurs d'habillage avant le rendu complet)
import asyncio, json, sys, os
os.environ.setdefault("MATHS_RACINE", "/home/claude/maths")
sys.argv_codes = [a for a in sys.argv[1:] if not a.startswith("-")]
import render as R
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")
        pg = await nav.new_page(viewport={"width": 1200, "height": 900})
        js = (R.ICI / "habit.js").read_text(encoding="utf-8") + "\n;0"; js2 = (R.ICI / "corrige.js").read_text(encoding="utf-8") + "\n;0"
        for code in sys.argv_codes:
            fam, q, graine = R.CARTES[code]
            for lettre in (False, True):
                await pg.goto(f"http://127.0.0.1:{R.PORT}/outils/splat.html?{q}&unknown={'letter' if lettre else 'question'}", wait_until="networkidle")
                await pg.wait_for_timeout(250); await pg.evaluate(js); await pg.evaluate(js2)
                c = await pg.evaluate("""([fam, g]) => { const rng = makeRng(String(g));
                    const c = fam === 'C' ? genInvestigate(rng) : fam === 'N' ? genNumbered(rng) : genSystem(rng);
                    return { v:(c._rel ? c._rel.hiddenValues : c.hidden).map(Number), total:c.total, visible:c.visible.map(Number),
                             titres: c._sys ? c._sys.plan.map(e => e.titre) : null }; }""", [fam, graine])
                if not lettre:
                    print(f"== {code} : valeurs {sorted(c['v'])}, total {c['total']}, visibles {c['visible']}", ("titres du plan : " + " | ".join(c["titres"])) if c["titres"] else "")
                    R.controle_carte(code, fam, c)
                spec = dict(famille=fam, graine=graine, lettre=lettre, habit=R.habit_js(code), inverser=code in R.INVERSER, valeurs=sorted(c["v"]))
                r = await pg.evaluate("(s) => window.__corrige(s)", spec)
                if r.get("erreur"): print("  ERREUR corrigé", "lettre" if lettre else "?", ":", r["erreur"]); continue
                if r["reste"]: print("  RESTE", r["reste"])
                print(("  [lettre] " if lettre else "  [?] ") + " | ".join(r["textes"])[:1500])
                if lettre:
                    r = await pg.evaluate("(s) => window.__equation(s)", dict(famille=fam, graine=graine, valeurs=sorted(c["v"]), habit=R.habit_js(code), inverser=code in R.INVERSER))
                    if r.get("erreur"): print("  ERREUR équations :", r["erreur"]); continue
                    if r["reste"]: print("  RESTE éq", r["reste"])
                    print("  [éq] ", r["controles"], "contrôles |", " | ".join(r["textes"])[:1500])
        await nav.close()
srv = R.serveur()
try: asyncio.run(main())
finally: srv.shutdown()
