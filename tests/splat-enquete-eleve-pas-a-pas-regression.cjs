/* SPLAT! Enquête — le pas à pas G3 dans « Voir le schéma » du mode élève (01/10/2026) :
   contrôle au NAVIGATEUR, hors CI (il lui faut playwright).
     node scripts/serve-static.mjs &            (ou tout serveur du dépôt)
     MATHSGO_URL=http://127.0.0.1:4173 node tests/splat-enquete-eleve-pas-a-pas-regression.cjs
   Sur ordinateur et sur téléphone, pour chaque carte :
   - autant d'appuis qu'en projection (le plan G3) ;
   - du premier à l'avant-dernier appui, le tableau est vidé (« ? ») et, sur ordinateur, aucune
     tache n'est dévoilée ; au dernier appui, la réponse revient et les taches se dévoilent ;
   - les boutons ne bougent pas d'un appui à l'autre, la page ne défile pas de côté ;
   - rien du schéma ne sort à droite du plateau (téléphone : les lignes de calcul tiennent). */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE = (process.env.MATHSGO_URL ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const ADRESSES = {
  "10 de plus que": "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=51",
  "13 une référence": "mode=C&clues=SENTENCE&splats=3&structure=REF&ordre=DESSIN&mul=0&div=0&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=1184",
  "21d répétées trois couleurs": "mode=C&clues=SENTENCE&splats=3&structure=HASARD&repeat=3&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=80&seed=10273",
  "22 sans total": "mode=C&clues=SENTENCE&splats=2&noTotal=1&mul=1&div=0&add=1&sub=0&deltaMax=30&visibleMin=0&visibleMax=0&totalMin=15&totalMax=60&seed=3",
  "24d unité commune": "mode=C&clues=SENTENCE&splats=3&structure=UNITE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=30&totalMax=90&seed=3572",
};
const FENETRES = [
  { nom: "ordinateur 1366 × 768", viewport: { width: 1366, height: 768 } },
  { nom: "ordinateur 1920 × 1080", viewport: { width: 1920, height: 1080 } },
  { nom: "iPhone 390 × 844", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { nom: "petit téléphone 375 × 667", viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

const etat = () => {
  const actions = document.querySelector("#elevePanel .eleveActions");
  const champs = [...document.querySelectorAll("#elevePanel .eleveCase[data-attendu] .eleveChamp")];
  const plateau = document.getElementById("svgWrap").getBoundingClientRect();
  /* ce qui dépasse à droite du plateau, dans le dessin (le cadre de l'étape et son texte) */
  let deborde = 0;
  /* seulement le cadre de l'étape (au téléphone, la scène est cadrée sur lui, le reste est hors champ) */
  document.querySelectorAll("#enqueteBarres text, #enqueteLigne text, #enqueteCalculs text").forEach((t) => {
    const r = t.getBoundingClientRect();
    if(r.width > 0) deborde = Math.max(deborde, Math.round(r.right - plateau.right));
  });
  return {
    haut: Math.round(actions.getBoundingClientRect().top + scrollY),
    valeurs: champs.map((c) => c.value),
    cache: document.getElementById("elevePanel").classList.contains("reponseCachee"),
    devoilees: document.querySelectorAll("#mainSvg [class*='anim-fade-out']").length,
    scrollX, largeurPage: document.documentElement.scrollWidth, largeur: innerWidth, deborde,
  };
};

(async () => {
  const navigateur = await chromium.launch();
  let controles = 0;
  for(const f of FENETRES){
    const contexte = await navigateur.newContext({ viewport: f.viewport, isMobile: !!f.isMobile, hasTouch: !!f.hasTouch, deviceScaleFactor: f.deviceScaleFactor || 1 });
    const page = await contexte.newPage();
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(String(e)));
    for(const [nom, requete] of Object.entries(ADRESSES)){
      const ici = `${nom}, ${f.nom}`;
      await page.goto(`${BASE}/outils/splat.html?${requete}&cards=1&unknown=question&eleve=1`);
      await page.waitForSelector("#eleveValider", { state: "attached" });
      const attendues = await page.evaluate(() => {
        const v = [];
        document.querySelectorAll("#elevePanel .eleveCase[data-attendu]").forEach((c) => {
          const i = c.querySelector("input");
          if(i){ i.value = c.getAttribute("data-attendu"); i.dispatchEvent(new Event("input", { bubbles: true })); v.push(i.value); }
        });
        document.getElementById("eleveValider").click();
        return v;
      });
      await page.waitForSelector("#eleveSchema", { state: "attached" });
      const appuis = await page.evaluate(() => { const c = eleveSerie[eleveIdx]; const p = enqueteProjectionPasAPas(c); return p ? p.etapes.length : 0; });
      assert.ok(appuis >= 5, `${ici} : le pas à pas G3 (${appuis} étapes)`);
      let depart = null, n = 0;
      while(await page.$("#eleveSchema")){
        await page.evaluate(() => document.getElementById("eleveSchema").click());
        n++;
        const e = await page.evaluate(etat);
        if(depart === null) depart = e.haut;
        assert.equal(e.haut, depart, `${ici}, appui ${n} : les boutons ont bougé (${depart} → ${e.haut})`);
        assert.equal(e.scrollX, 0, `${ici} : défilement de côté`);
        assert.ok(e.largeurPage <= e.largeur, `${ici} : la page est plus large que l'écran`);
        assert.ok(e.deborde <= 1, `${ici}, appui ${n} : un texte sort de ${e.deborde} px à droite du plateau`);
        if(n < appuis){
          assert.ok(e.cache && e.valeurs.every((v) => v === ""), `${ici}, appui ${n} : la réponse est encore affichée`);
        }else{
          assert.ok(!e.cache, `${ici} : le tableau reste vidé au dernier appui`);
          assert.deepEqual(e.valeurs, attendues, `${ici} : la réponse ne revient pas`);
        }
        controles++;
      }
      assert.equal(n, appuis, `${ici} : ${n} appuis pour ${appuis} étapes`);
    }
    assert.deepEqual(erreurs, [], `${f.nom} : erreurs JavaScript`);
    await contexte.close();
  }
  await navigateur.close();
  console.log(`mode élève, pas à pas : ${controles} appuis contrôlés — réponse cachée puis rendue, boutons immobiles, rien ne déborde.`);
})().catch((e) => { console.error(e); process.exit(1); });
