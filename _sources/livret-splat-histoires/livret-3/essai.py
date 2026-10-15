# essai d'un corrigé : python3 essai.py 12.1 14.2 …  (sert à voir les erreurs d'habillage avant le rendu complet)
import asyncio, json, sys, os
os.environ.setdefault("MATHS_RACINE", "/home/claude/maths")
codes = [a for a in sys.argv[1:] if not a.startswith("-")]
import render as R
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        nav = await p.chromium.launch(channel="chromium")
        o = R.Outil(nav); await o.demarrer()
        for code in codes:
            fam, q, graine = R.CARTES[code][:3]
            for lettre in (False, True):
                if fam == "B":
                    r = await o.balance(code, lettre)
                    print(("  [lettre] " if lettre else f"== {code}\n  [?] ") + " | ".join(r["textes"])[:1500])
                    continue
                await o.ouvrir(q, lettre)
                c = await o.valeurs(fam, graine)
                if not lettre:
                    t = await o.pg.evaluate("([fam, g]) => { const c = genSystem(makeRng(String(g))); return c._sys.plan.map(e => e.titre + (e.lignes ? ' : ' + e.lignes.join(' / ') : '')); }", [fam, graine]) if fam == "D" else None
                    print(f"== {code} : valeurs {sorted(c['v'])}, total {c['total']}, visibles {c['visible']}", ("plan : " + " | ".join(t)) if t else "")
                    R.controle_carte(code, fam, c)
                spec = dict(famille=fam, graine=graine, lettre=lettre, habit=R.habit_js(code), valeurs=sorted(c["v"]), **R.spec_ordre(code))
                r = await o.pg.evaluate("(s) => window.__corrige(s)", spec)
                if r.get("erreur"): print("  ERREUR corrigé", "lettre" if lettre else "?", ":", r["erreur"]); continue
                if r["reste"]: print("  RESTE", r["reste"])
                print(("  [lettre] " if lettre else "  [?] ") + " | ".join(r["textes"])[:1500])
            if fam == "B":
                await o.ouvrir(R.CARTES["12.1"][1], True)
                hab = R.habit_js(code)
                r = await o.pg.evaluate("(s) => window.__equation(s)", dict(famille="X", blocs=R.balance_blocs(code), habit=hab, x=R.CARTES[code][3]["x"]))
            else:
                await o.ouvrir(q, True)
                c = await o.valeurs(fam, graine)
                r = await o.pg.evaluate("(s) => window.__equation(s)", dict(famille=fam, graine=graine, valeurs=sorted(c["v"]), habit=R.habit_js(code), **R.spec_ordre(code)))
            if r.get("erreur"): print("  ERREUR équations :", r["erreur"]); continue
            if r["reste"]: print("  RESTE éq", r["reste"])
            print("  [éq] ", r["controles"], "contrôles |", " | ".join(r["textes"])[:1500])
        await nav.close()
srv = R.serveur()
try: asyncio.run(main())
finally: srv.shutdown()
