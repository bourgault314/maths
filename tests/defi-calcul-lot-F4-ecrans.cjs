// Défi calcul, lot F4 « Personne ne reste bloqué » (18/11/2026) : la VRAIE
// page, au navigateur, élève connecté (faux serveur de suivi), aux 5 formats
// (390 × 664, 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-F4-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-F4-ecrans.cjs
// Planches « avant » (sur une copie de main) : AVANT=<copie de main> — rien
// n'est vérifié, seules les photos sont prises.
//
//   test-rate    le test raté d'un module : plus de croix rouge, « Ce niveau,
//                on l'apprend ensemble » ;
//   palier       le test de palier d'un élève neuf : 12 calculs, tout juste →
//                la ceinture jaune, puis « Tu connais déjà les bases ! » ; deux
//                faux → « On regarde module par module » ;
//   arrete       J'apprends arrêté (25 calculs) : « On continue demain », le
//                chemin (le dessin ✓, sans aide → demain), le compteur « 4
//                justes sur 5 » ; au 3e arrêt, « à voir en classe » ;
//   reprise      le lendemain : J'apprends reprend sans aide, « On reprend là
//                où tu en étais. », le premier calcul avec son dessin.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = process.env.AVANT ? path.resolve(process.env.AVANT) : path.resolve(__dirname, "..");
const AVANT = Boolean(process.env.AVANT);
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-23";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 664], [390, 844], [1366, 657], [1366, 768], [1920, 1080]];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp"};
const PALIERS_JOUES = ["2026-11-01", "2026-11-01", "2026-11-01", "2026-11-01"];

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

// Tout ce qui vient avant M6-1 dans l'ordre du parcours est entré (boîte 4,
// revient dans 9 jours : pas de calculs du jour). `m6` : la ligne de M6.
function parcoursAvantM6(m6 = null) {
  const brut = {version: P.VERSION, modules: {}, jours: ["2026-11-19", "2026-11-20"], seances: ["2026-11-19", "2026-11-20"], paliers: PALIERS_JOUES};
  for (const c of P.parcoursConstruit(CARTE)) {
    if (c.module === "M6" && c.niveau === 1) break;
    const k = P.NIVEAUX[c.module];
    const m = brut.modules[c.module] || (brut.modules[c.module] = {vu: "2026-11-20", b: Array(k).fill(0), e: Array(k).fill(null), d: Array(k).fill(null), s: Array(k).fill(null), a: Array(k).fill(0), f: Array(k).fill(0)});
    m.b[c.niveau - 1] = 4;
    m.e[c.niveau - 1] = "2026-12-02";
    m.d[c.niveau - 1] = "2026-11-01";
    m.s[c.niveau - 1] = "2026-11-10";
    m.a[c.niveau - 1] = 1;
    m.f[c.niveau - 1] = 1;
  }
  if (m6) brut.modules.M6 = Object.assign({vu: "2026-11-20", b: [0, 0], e: [null, null], a: [0, 0], f: [1, 0]}, m6);
  return P.normaliserParcours(brut);
}

async function ouvrir(nav, base, {largeur, hauteur, parcours = null}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR", reducedMotion: "reduce"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), "7K3M9P");
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const h = {"access-control-allow-origin": "*"};
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: h, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
    if (corps.lire) return rendre({ok: true, existe: Boolean(parcours), parcours, revision: 1});
    return rendre({ok: true, revision: 2});
  });
  await page.goto(base + PAGE);
  for (let i = 0; i < 40; i += 1) { await page.clock.runFor(100); await page.waitForTimeout(25); }
  return {page, ctx, erreurs};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(60); };
const appel = (page, nom, ...args) => page.evaluate(([n, a]) => window.__MATHSGO_DEFI_CALCUL_TEST__[n](...a), [nom, args]);
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);
const visible = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return Boolean(e) && !e.hidden && e.getBoundingClientRect().height > 0; }, s);
async function cliquerTouches(page, nombre) {
  for (const c of CORE.formaterNombre(nombre)) {
    if (!c.trim() || c === " " || c === " ") continue;
    await page.click(`#play [data-key="${c}"]`);
  }
}
// Une réponse juste ou fausse au calcul à l'écran ; « Suivant » après une
// correction (on attend qu'elle soit lue).
async function repondre(page, juste) {
  const c = await appel(page, "calcul");
  await cliquerTouches(page, juste ? c.reponse : c.reponse + 1);
  await page.click("#validate");
  await pause(page, 400);
  if (!juste && !(await appel(page, "escalier")) && (await appel(page, "genre")) !== "palier") {
    await pause(page, 4000);
    await page.click("#validate");
  }
  await pause(page, 1600);
}
// J'écris : les étapes, justes.
async function ecrire(page) {
  const etapes = await appel(page, "ecrisEnCours");
  for (const etape of etapes) {
    await cliquerTouches(page, etape.reponse);
    await page.click("#validate");
    await pause(page, 700);
  }
  for (let i = 0; i < 6 && (await appel(page, "ecrisEnCours")); i += 1) { await page.click("#validate"); await pause(page, 700); }
}
async function commencer(page) {
  await page.click("#acc-seance .carte-seance");
  await pause(page, 2500);
}
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.screenshot({path: path.join(SORTIE, `${nom}.png`)});
}
async function tient(page, largeur, hauteur) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pas de défilement de côté");
  if (largeur > 620) {
    const bas = await page.evaluate(() => document.querySelector(".panel:not([hidden])").getBoundingClientRect().bottom);
    assert.ok(bas <= hauteur + .5, `le cadre tient entier (${Math.round(bas)} / ${hauteur})`);
  }
}
const verifier = AVANT ? async () => {} : async fn => fn();
const resultat = page => visible(page, "#result");

// J'apprends de M6-1, repris au dessin (après) ou posé au dessin (avant),
// joué jusqu'à 25 calculs : 2 justes au dessin, J'écris, 4 justes sans aide
// (le compteur), puis un faux sur deux.
async function apprendreJusquaLArret(page, f, nom, compteur) {
  if (AVANT) {
    const texteCalcul = CORE.genererSerie("M6-1", {graine: 1, genre: "entraine", total: 25})[0].texte;
    await appel(page, "poser", "M6", 1, texteCalcul, "image");
  } else await appel(page, "reprendre", "M6", 1, 1);
  await pause(page, 600);
  let joues = 0;
  let sansAide = 0;
  let vu = false;
  let vuQuatre = false;
  for (let tour = 0; tour < 60 && !(await resultat(page)); tour += 1) {
    if (await appel(page, "ecrisEnCours")) { await ecrire(page); continue; }
    const e = await appel(page, "entrainement");
    if (!e) break;
    let juste = true;
    if (e.outil === "aucun") {
      sansAide += 1;
      if (!vu && compteur && /· 4 justes (sur 5|de suite)$/.test(await texte(page, "#question-count"))) { vu = true; await photo(page, `${f}-compteur`); }
      // 4 justes sans aide (le compteur), puis toujours faux sans aide
      // (juste avec le dessin qui revient) : jamais 5 sur 6.
      juste = !vuQuatre && e.justesDeSuite < 4 && sansAide < 8;
      if (e.justesDeSuite >= 4) vuQuatre = true;
    }
    await repondre(page, juste);
    joues += 1;
  }
  await pause(page, 800);
  if (compteur) await verifier(async () => assert.ok(vu, "le compteur « 4 justes sur 5 » s'est vu"));
  return joues;
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;

    await cas(`${f} : test raté — pas de croix rouge, « Ce niveau, on l'apprend ensemble »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: AVANT ? null : P.normaliserParcours({version: P.VERSION, paliers: PALIERS_JOUES})});
      await commencer(s.page);
      await verifier(async () => assert.equal(await appel(s.page, "genre"), "test"));
      await repondre(s.page, false);
      await repondre(s.page, false);
      await pause(s.page, 1500);
      await photo(s.page, `${f}-test-rate`);
      await verifier(async () => {
        assert.match(await texte(s.page, "#result-title"), /^Ce niveau, on l’apprend ensemble$/);
        assert.equal(await s.page.evaluate(() => document.querySelector("#result").classList.contains("is-rate")), false, "pas d'écran rouge");
        assert.equal(await s.page.evaluate(() => [...document.querySelectorAll(".bilan-niveaux i")].some(i => i.textContent === "✗")), false, "pas de croix");
        assert.match(await texte(s.page, "#result-suite"), /Étape 2 : j’apprends/, "la suite : J'apprends");
        await tient(s.page, largeur, hauteur);
      });
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : test de palier — tout juste, la ceinture jaune puis « Tu connais déjà les bases ! »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await commencer(s.page);
      await photo(s.page, `${f}-palier-question`);
      if (AVANT) { await s.ctx.close(); return; }
      assert.equal(await appel(s.page, "genre"), "palier");
      assert.match(await texte(s.page, "#question-count"), /^Calcul 1 sur 12$/);
      assert.match(await texte(s.page, "#fil-seance"), /Tu connais déjà \? Les bases/);
      await tient(s.page, largeur, hauteur);
      for (let i = 0; i < 12; i += 1) await repondre(s.page, i !== 4);
      await pause(s.page, 1500);
      await photo(s.page, `${f}-palier-ceinture`);
      assert.equal(await visible(s.page, "#result-ceinture"), true, "la ceinture d'abord");
      await s.page.click("#result .primary");
      await pause(s.page, 2500);
      await photo(s.page, `${f}-palier-reussi`);
      assert.match(await texte(s.page, "#result-title"), /^Tu connais déjà les bases !$/);
      assert.match(await texte(s.page, "#result-score"), /^Les bases : 41 niveaux d’un coup$/, "41 depuis le lot 6 « programmes 2 » (F9-1 au CE2)");
      await tient(s.page, largeur, hauteur);
      const p = await appel(s.page, "parcours");
      assert.equal(p.paliers[0], JOUR);
      assert.equal(p.ceintures[0], JOUR);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    if (!AVANT) await cas(`${f} : test de palier — deux faux, « On regarde module par module », rien de rouge`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await commencer(s.page);
      await repondre(s.page, false);
      await repondre(s.page, false);
      await pause(s.page, 1500);
      await photo(s.page, `${f}-palier-rate`);
      assert.match(await texte(s.page, "#result-title"), /^On regarde module par module$/);
      assert.equal(await s.page.evaluate(() => document.querySelector("#result").classList.contains("is-rate")), false);
      assert.match(await texte(s.page, "#result-suite"), /Étape 2 : tu connais déjà \?/);
      await tient(s.page, largeur, hauteur);
      assert.deepEqual((await appel(s.page, "parcours")).paliers, [JOUR, null, null, null]);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : J'apprends arrêté — « On continue demain », le chemin, « 4 justes sur 5 »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursAvantM6()});
      const joues = await apprendreJusquaLArret(s.page, f, "arrete", true);
      await photo(s.page, `${f}-arrete`);
      await verifier(async () => {
        assert.equal(joues, 25, "25 calculs (sans compter J'écris)");
        assert.match(await texte(s.page, "#result-title"), /^On continue demain$/);
        assert.match(await texte(s.page, "#result-suite"), /Aujourd’hui, tu as avancé :.*✓ ?Avec le dessin ?fait.*→ ?Sans aide ?demain/);
        assert.doesNotMatch(await texte(s.page, "#result-suite"), /professeur/);
        // Le petit signe (choix de Gwenaël) : les jours de la semaine, lundi coché.
        assert.deepEqual(await s.page.evaluate(() => [...document.querySelectorAll(".jours-semaine i")].map(i => `${i.className}:${i.textContent}`)),
          ["fait:✓", ":M", ":M", ":J", ":V"]);
        assert.equal(await s.page.evaluate(() => document.querySelectorAll("#corrections li").length), 0, "pas de liste d'erreurs (choix de Gwenaël)");
        await tient(s.page, largeur, hauteur);
        const p = await appel(s.page, "parcours");
        assert.equal(p.modules.M6.ar[0], 5, "un arrêt, sans aide");
      });
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    if (!AVANT) await cas(`${f} : au 3e arrêt — « Ce niveau, ton professeur va le revoir avec toi »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursAvantM6({ar: [7, 0]})});
      await apprendreJusquaLArret(s.page, f, "a-voir", false);
      await photo(s.page, `${f}-a-voir`);
      assert.match(await texte(s.page, "#result-suite"), /Ce niveau, ton professeur va le revoir avec toi\. Demain, tu passes à la suite\./);
      await tient(s.page, largeur, hauteur);
      const p = await appel(s.page, "parcours");
      assert.equal(p.modules.M6.e[0], "2026-11-30", "il revient dans 7 jours");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : le lendemain — J'apprends reprend sans aide, avec le dessin pour se rappeler`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursAvantM6(AVANT ? {} : {ar: [5, 0]})});
      await commencer(s.page);
      await photo(s.page, `${f}-reprise`);
      await verifier(async () => {
        assert.equal(await appel(s.page, "genre"), "apprends");
        assert.match(await texte(s.page, "#annonce"), /^On reprend là où tu en étais\.$/);
        assert.ok(await appel(s.page, "dessin"), "le premier calcul : le dessin pour se rappeler");
        assert.equal((await appel(s.page, "entrainement")).outil, "aucun", "sans aide (le dessin n'est qu'un rappel)");
        await tient(s.page, largeur, hauteur);
        await repondre(s.page, true);
        assert.equal(await appel(s.page, "dessin"), null, "puis sans aide, sans dessin");
        assert.match(await texte(s.page, "#question-count"), /^Calcul 2$/, "le rappel juste ne compte pas dans les justes");
      });
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }
  await nav.close();
  serveur.close();
  if (echecs) { console.log(`\n${echecs} échec(s)`); process.exit(1); }
  console.log("\nTout est conforme.");
})();
