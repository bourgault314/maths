/* SPLAT! Enquête — le pas à pas G3 dans « Voir le schéma » du mode élève (01/10/2026) :
   contrôle au NAVIGATEUR, hors CI (il lui faut playwright).
     node scripts/serve-static.mjs &            (ou tout serveur du dépôt)
     MATHSGO_URL=http://127.0.0.1:4173 node tests/splat-enquete-eleve-pas-a-pas-regression.cjs
   Sur ordinateur et sur téléphone, pour chaque carte :
   - autant d'appuis qu'en projection (le plan G3) ;
   - du premier à l'avant-dernier appui, le tableau est vidé (« ? ») et, sur ordinateur, aucune
     tache n'est dévoilée ; au dernier appui, la réponse revient et les taches se dévoilent ;
   - les boutons ne bougent pas d'un appui à l'autre, la page ne défile pas de côté ;
   - rien du schéma ne sort à droite du plateau (téléphone : les lignes de calcul tiennent) ;
   - 03/10/2026 : sur ordinateur, la même échelle à tous les appuis ; « ◀ » visible dès la 2e étape,
     il ramène une étape en arrière (réponse recachée, boutons à leur place) ;
   - 05/10/2026 : à la 3e erreur, la réponse s'écrit dans les cases, la carte devient rouge, le
     Valider s'efface ; « Voir la correction » ouvre ensuite la 1re étape ;
   - téléphone (02/10/2026) : à chaque appui, le petit plateau est dans le bandeau, sous les phrases,
     aucun trait du schéma ne touche le cadre de l'étape,
     à gauche du TOTAL sans le toucher, avec toutes les taches de la carte ; rien sur ordinateur. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE = (process.env.MATHSGO_URL ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const ADRESSES = {
  /* 31 = 20 + 11 : les barres prennent toute la largeur, la case vide du total mordait sur le cadre au téléphone */
  "10 barres pleine largeur": "mode=C&clues=SENTENCE&splats=2&mul=0&div=0&add=1&sub=0&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=50&seed=17",
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
  /* le petit plateau du bandeau (téléphone) */
  const petit = document.getElementById("eleveRappelPlateau");
  const boite = (n) => { const r = n.getBoundingClientRect(); return { g: r.left, d: r.right, h: r.top, b: r.bottom, l: r.width }; };
  const total = document.querySelector("#eleveRappel .eleveRappelTotal");
  const phrases = document.querySelector("#eleveRappel .eleveRappelIndices");
  return {
    petit: petit ? { ...boite(petit), taches: petit.querySelectorAll("path").length, ids: petit.querySelectorAll("[id]").length } : null,
    total: total ? boite(total) : null, phrasesBas: phrases ? phrases.getBoundingClientRect().bottom : null,
    /* de combien un trait du schéma sort du cadre de l'étape, à droite (la case vide du total) */
    horsCadre: (() => {
      const cadre = document.querySelector("#enqueteBarres, #enqueteLigne, #enqueteCalculs");
      const bord = cadre && cadre.querySelector("rect");
      if(!bord) return 0;
      const limite = bord.getBoundingClientRect().right;
      let d = -1e9;
      cadre.querySelectorAll("rect, path, text").forEach((n) => { if(n !== bord){ const r = n.getBoundingClientRect(); if(r.width > 0) d = Math.max(d, r.right - limite); } });
      return Math.round(d);
    })(),
    tachesCarte: (() => { const c = eleveSerie[eleveIdx]; return c && Array.isArray(c.hidden) ? c.hidden.length : 0; })(),
    haut: Math.round(actions.getBoundingClientRect().top + scrollY),
    valeurs: champs.map((c) => c.value),
    cache: document.getElementById("elevePanel").classList.contains("reponseCachee"),
    devoilees: document.querySelectorAll("#mainSvg [class*='anim-fade-out']").length,
    scrollX, largeurPage: document.documentElement.scrollWidth, largeur: innerWidth, deborde,
    /* ordinateur (03/10/2026) : l'échelle du cadre de l'étape, la même à tous les appuis */
    echelle: (() => {
      const d = ENQ_PROJ_IDS.map((id) => document.getElementById(id)).find(Boolean);
      const m = d && (d.getAttribute("transform") || "").match(/scale\(([\d.]+)\)/);
      return m ? Number(m[1]) : null;
    })(),
    /* « ◀ » : [présent, visible] */
    precedent: (() => { const p = document.getElementById("eleveSchemaPrec"); return p ? [true, getComputedStyle(p).visibility === "visible"] : [false, false]; })(),
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
      let depart = null, n = 0, echelle = null;
      while(await page.$("#eleveSchema")){
        await page.evaluate(() => document.getElementById("eleveSchema").click());
        n++;
        const e = await page.evaluate(etat);
        if(depart === null) depart = e.haut;
        assert.equal(e.haut, depart, `${ici}, appui ${n} : les boutons ont bougé (${depart} → ${e.haut})`);
        assert.equal(e.scrollX, 0, `${ici} : défilement de côté`);
        assert.ok(e.largeurPage <= e.largeur, `${ici} : la page est plus large que l'écran`);
        assert.ok(e.deborde <= 1, `${ici}, appui ${n} : un texte sort de ${e.deborde} px à droite du plateau`);
        assert.deepEqual(e.precedent, [true, n >= 2], `${ici}, appui ${n} : « ◀ » (présent, visible dès la 2e étape)`);
        if(!f.isMobile && e.echelle !== null){
          if(echelle === null) echelle = e.echelle;
          assert.equal(e.echelle, echelle, `${ici}, appui ${n} : l'échelle du schéma a changé (${echelle} → ${e.echelle})`);
        }
        if(n < appuis){
          assert.ok(e.cache && e.valeurs.every((v) => v === ""), `${ici}, appui ${n} : la réponse est encore affichée`);
        }else{
          assert.ok(!e.cache, `${ici} : le tableau reste vidé au dernier appui`);
          assert.deepEqual(e.valeurs, attendues, `${ici} : la réponse ne revient pas`);
        }
        if(f.isMobile){
          assert.ok(e.petit, `${ici}, appui ${n} : pas de petit plateau dans le bandeau`);
          assert.ok(e.petit.l >= 60 && e.petit.g >= 0 && e.total.d <= e.largeur, `${ici}, appui ${n} : le petit plateau ou le TOTAL sort de l'écran`);
          assert.ok(e.total.g - e.petit.d >= 8, `${ici}, appui ${n} : le TOTAL est collé au plateau (${Math.round(e.total.g - e.petit.d)} px)`);
          assert.ok(e.petit.h >= e.phrasesBas - 1, `${ici}, appui ${n} : le petit plateau n'est pas sous les phrases`);
          assert.ok(e.petit.taches >= e.tachesCarte, `${ici}, appui ${n} : ${e.petit.taches} tache(s) dans le petit plateau pour ${e.tachesCarte}`);
          assert.ok(e.horsCadre < 0, `${ici}, appui ${n} : un trait du schéma touche ou dépasse le cadre (${e.horsCadre} px)`);
          assert.equal(e.petit.ids, 0, `${ici} : le petit plateau porte des identifiants en double`);
        }else{
          assert.equal(e.petit, null, `${ici} : un petit plateau sur ordinateur`);
        }
        controles++;
      }
      assert.equal(n, appuis, `${ici} : ${n} appuis pour ${appuis} étapes`);
      /* « ◀ » depuis la dernière étape : la réponse est recachée, « Étape suivante » revient à sa place */
      await page.evaluate(() => document.getElementById("eleveSchemaPrec").click());
      const r = await page.evaluate(etat);
      assert.equal(await page.evaluate(() => eleveSchemaEtape), appuis - 1, `${ici} : ◀ ne ramène pas à l'avant-dernière étape`);
      assert.ok(r.cache && r.valeurs.every((v) => v === ""), `${ici} : après ◀, la réponse est encore affichée`);
      assert.ok(await page.$("#eleveSchema"), `${ici} : après ◀, « Étape suivante » ne revient pas`);
      assert.equal(r.haut, depart, `${ici} : après ◀, les boutons ont bougé`);
      if(!f.isMobile && r.echelle !== null) assert.equal(r.echelle, echelle, `${ici} : après ◀, l'échelle a changé`);
      await page.evaluate(() => document.getElementById("eleveSchema").click());
      const fin = await page.evaluate(etat);
      assert.ok(!fin.cache && fin.valeurs.every((v, i) => v === attendues[i]), `${ici} : la réponse ne revient pas après ◀ puis ▶`);
      /* trois erreurs (05/10/2026) : la réponse s'écrit, la carte est rouge, plus de Valider ;
         « Voir la correction » ouvre ensuite la 1re étape */
      await page.goto(`${BASE}/outils/splat.html?${requete}&cards=1&unknown=question&eleve=1`);
      await page.waitForSelector("#eleveValider", { state: "attached" });
      for(let k = 0; k < 3; k++) await page.evaluate(() => {
        document.querySelectorAll("#elevePanel .eleveCase[data-attendu]").forEach((c) => {
          const i = c.querySelector("input");
          if(i && !i.readOnly){ i.value = String(Number(c.getAttribute("data-attendu")) + 1); i.dispatchEvent(new Event("input", { bubbles: true })); }
        });
        document.getElementById("eleveValider").click();
      });
      const trois = await page.evaluate(() => ({
        msg: document.getElementById("eleveMsg").textContent,
        valider: document.getElementById("eleveValider").hidden,
        voir: !!document.getElementById("eleveVoir"),
        correction: (document.getElementById("eleveSchema") || {}).textContent || null,
        rouge: eleveResultats[eleveIdx],
        valeurs: [...document.querySelectorAll("#elevePanel .eleveCase[data-attendu] .eleveChamp")].map((i) => i.value),
        attendues: [...document.querySelectorAll("#elevePanel .eleveCase[data-attendu] .eleveChamp")].map((i) => i.closest(".eleveCase").getAttribute("data-attendu"))
      }));
      assert.equal(trois.msg, "Voil\u00e0 la r\u00e9ponse. Tu rejoueras cette carte \u00e0 la fin.", `${ici} : message de la 3e erreur`);
      assert.deepEqual([trois.valider, trois.voir, trois.correction, trois.rouge], [true, false, "Voir la correction", "ko"], `${ici} : 3e erreur`);
      assert.deepEqual(trois.valeurs, trois.attendues, `${ici} : la réponse n'est pas dans les cases`);
      await page.evaluate(() => document.getElementById("eleveSchema").click());
      const c1 = await page.evaluate(() => ({ etape: eleveSchemaEtape, rouge: eleveResultats[eleveIdx], suivante: !!document.getElementById("eleveSchema") }));
      assert.deepEqual(c1, { etape: 1, rouge: "ko", suivante: true }, `${ici} : « Voir la correction » n'ouvre pas la 1re étape`);
    }
    assert.deepEqual(erreurs, [], `${f.nom} : erreurs JavaScript`);
    await contexte.close();
  }
  await navigateur.close();
  console.log(`mode élève, pas à pas : ${controles} appuis contrôlés — réponse cachée puis rendue, boutons immobiles, rien ne déborde.`);
})().catch((e) => { console.error(e); process.exit(1); });
