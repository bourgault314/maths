/* SPLAT! Enquête et Système — mode élève sur ordinateur (lot G3, remarque de Claude Code sur la
   PR #874) : contrôle au NAVIGATEUR, hors CI (il lui faut playwright).
     node scripts/serve-static.mjs &            (ou tout serveur du dépôt)
     MATHSGO_URL=http://127.0.0.1:4173 node tests/splat-enquete-eleve-boutons-regression.cjs
   Une fois la carte validée, les boutons (« Voir le schéma », « Étape suivante », « Carte
   suivante ») ne bougent plus d'un appui à l'autre, jusqu'à la dernière étape, et la page ne
   défile pas. Avant ce lot, ils descendaient au premier appui (31 px à 1280 × 720, 128 à
   1440 × 900, 225 à 1920 × 1080). */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE = (process.env.MATHSGO_URL ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const ADRESSES = {
  "10 de plus que": "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=51",
  "13 une référence": "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=1184",
  "21d répétées trois couleurs": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&repeat=3&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=80&seed=10273",
  "22 sans total": "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=3",
  "24d unité commune": "mode=C&clues=SENTENCE&splats=3&structure=UNITE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=90&seed=3572",
  "Système": "mode=D&seed=12",
};
const haut = () => Math.round(document.querySelector("#elevePanel .eleveActions").getBoundingClientRect().top + scrollY);

(async () => {
  const navigateur = await chromium.launch();
  let controles = 0;
  for(const fenetre of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]){
    const page = await navigateur.newPage({ viewport: fenetre });
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(String(e)));
    for(const [nom, requete] of Object.entries(ADRESSES)){
      await page.goto(`${BASE}/outils/splat.html?${requete}&cards=1&unknown=question&eleve=1`);
      await page.waitForSelector("#eleveValider");
      await page.evaluate(() => {
        document.querySelectorAll("#elevePanel .eleveCase[data-attendu]").forEach((c) => {
          const i = c.querySelector("input");
          if(i){ i.value = c.getAttribute("data-attendu"); i.dispatchEvent(new Event("input", { bubbles: true })); }
        });
        document.getElementById("eleveValider").click();
      });
      await page.waitForSelector("#eleveSchema");
      const depart = await page.evaluate(haut);
      let appuis = 0;
      while(await page.$("#eleveSchema")){
        await page.click("#eleveSchema");
        appuis++;
        const h = await page.evaluate(haut);
        assert.equal(h, depart, `${nom}, ${fenetre.width} × ${fenetre.height}, appui ${appuis} : les boutons ont bougé (${depart} → ${h})`);
        assert.equal(await page.evaluate(() => scrollY), 0, `${nom} : la page a défilé`);
        controles++;
      }
      assert.ok(appuis >= 2, `${nom} : ${appuis} appuis`);
    }
    assert.deepEqual(erreurs, [], "erreurs JavaScript");
    await page.close();
  }
  await navigateur.close();
  console.log(`mode élève, ordinateur : ${controles} appuis contrôlés, les boutons ne bougent plus.`);
})().catch((e) => { console.error(e); process.exit(1); });
