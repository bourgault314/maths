// Défi calcul, lot 4 « les ceintures » (14/11/2026, planches validées par
// Gwenaël) : la VRAIE page, au navigateur, avec un faux serveur de suivi.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install --no-save playwright
//   node tests/defi-calcul-lot-4-ceintures-ecrans.cjs
//
// Ce qui est vérifié (téléphone 390 × 844 et 390 × 664, ordinateur 1366 × 657) :
//   ceinture   le dernier calcul du jour qui rend le palier 1 solide : à la
//              fin de l'étape, l'écran « Ceinture jaune ! » (le fil de la
//              séance au-dessus), le cadre entier, rien qui déborde ; puis
//              « Continuer » mène au bilan de Mes calculs du jour ; la
//              progression enregistrée porte la ceinture ; l'accueil la dit ;
//   deux       les bases et le CM1 finis le même jour : la jaune, puis
//              l'orange, puis le bilan ;
//   réglage    l'appli réglée jusqu'aux bases : « Tu as fini tout ce que ton
//              professeur a ouvert. » ;
//   barrette   la 3e barrette : une ligne dans le bilan, pas d'écran ;
//   parcours   les onglets ont leur ceinture et comptent ce qui est construit ;
//              la ligne de ceinture de chaque palier ; d'un palier à l'autre,
//              rien ne bouge.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const CODE = "7K3M9P";
const JOUR = "2026-11-13";
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp"};

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

const COMPETENCES = P.parcoursConstruit(CARTE).map(c => Object.assign(c, {palier: P.palierDe(CARTE, c.module, c.niveau)}));
const duPalier = n => COMPETENCES.filter(c => c.palier === n);

// `regle(c, rang dans le palier)` → {b, e, s} pour chaque compétence construite.
function parcoursOu(regle, ceintures = [null, null, null, null]) {
  const brut = {version: P.VERSION, modules: {}, ceintures, jours: ["2026-11-10", "2026-11-11", "2026-11-12"], seances: ["2026-11-10", "2026-11-11", "2026-11-12"]};
  const rangs = {};
  COMPETENCES.forEach(c => {
    rangs[c.palier] = (rangs[c.palier] || 0) + 1;
    const k = P.NIVEAUX[c.module];
    const m = brut.modules[c.module] || (brut.modules[c.module] = {vu: "2026-11-12", b: Array(k).fill(0), e: Array(k).fill(null), d: Array(k).fill(null), s: Array(k).fill(null), a: Array(k).fill(0)});
    const r = regle(c, rangs[c.palier]);
    if (!r || !r.b) return;
    m.b[c.niveau - 1] = r.b;
    m.e[c.niveau - 1] = r.e || "2026-11-20";
    m.d[c.niveau - 1] = "2026-10-20";
    m.s[c.niveau - 1] = r.s === undefined ? (r.b >= 4 ? "2026-10-28" : null) : r.s;
    m.a[c.niveau - 1] = 1;
  });
  Object.values(brut.modules).forEach(m => { if (m.b.every(b => b >= 4)) m.ok = "2026-11-01"; });
  return P.normaliserParcours(brut);
}

const DERNIER_1 = duPalier(1).length;
// Léa : tout le palier 1 solide sauf le dernier, en boîte 3, qui revient aujourd'hui.
const LEA = () => parcoursOu((c, r) => (c.palier === 1 ? (r === DERNIER_1 ? {b: 3, e: JOUR, s: null} : {b: 4}) : c.palier === 2 && r <= 3 ? {b: 2} : null));
// Léo : les bases ET le CM1 solides, sauf le dernier des bases.
const LEO = () => parcoursOu((c, r) => (c.palier === 1 ? (r === DERNIER_1 ? {b: 3, e: JOUR, s: null} : {b: 4}) : c.palier === 2 ? {b: 4} : null));
// Inès : la jaune ; au CM1, 21 solides un jour sur 29, le 22e revient aujourd'hui.
const TOTAL_2 = duPalier(2).length;
const AVANT_BARRETTE = Math.ceil(TOTAL_2 * 3 / 4) - 1;
const INES = () => parcoursOu((c, r) => (c.palier === 1 ? {b: 5} : c.palier === 2 && r <= AVANT_BARRETTE ? {b: 4} : c.palier === 2 && r === AVANT_BARRETTE + 1 ? {b: 3, e: JOUR, s: null} : null),
  ["2026-11-02", null, null, null]);
// Noah : la jaune ; au CM1, 13 solides, 2 de plus solides un jour, 3 en route.
const NOAH = () => parcoursOu((c, r) => (c.palier === 1 ? {b: 5} : c.palier === 2 && r <= 13 ? {b: 4} : c.palier === 2 && r <= 15 ? {b: 3, s: "2026-11-09"} : c.palier === 2 && r <= 18 ? {b: 2} : null),
  ["2026-11-06", null, null, null]);

async function ouvrir(nav, base, {largeur = 1366, hauteur = 657, parcours, reglages = {}}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, timezoneId: "Indian/Reunion"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  const envoyes = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), CODE);
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const h = {"access-control-allow-origin": "*"};
    const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: h, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages});
    if (corps.lire) return rendre({ok: true, existe: true, parcours, revision: 1});
    if (corps.parcours) envoyes.push(corps.parcours);
    return rendre({ok: true, revision: 2});
  });
  await page.goto(base + PAGE);
  for (let i = 0; i < 40; i += 1) { await page.clock.runFor(100); await page.waitForTimeout(40); }
  return {page, ctx, erreurs, envoyes};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(120); };
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e && !e.hidden ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);
const visible = (page, s) => page.isVisible(s);
const boite = (page, s) => page.evaluate(sel => { const b = document.querySelector(sel).getBoundingClientRect(); return {haut: b.top, bas: b.bottom, gauche: b.left, droite: b.right}; }, s);

async function taper(page, nombre) {
  for (const signe of String(nombre).replace(".", ",")) await page.click(`#play [data-key="${signe}"]`);
}

// « Commencer », puis Mes calculs du jour : toutes les réponses justes.
async function calculsDuJour(page) {
  await page.click("#acc-carte .go");
  await pause(page, 600);
  for (let i = 0; i < 25; i += 1) {
    const c = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
    if (!c) break;
    await taper(page, c.reponse);
    await page.click("#validate");
    await pause(page, 1500);
  }
  await pause(page, 600);
}

async function cadreTient(page, largeur, hauteur) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pas de défilement en largeur");
  if (largeur > 620) assert.ok((await boite(page, ".panel")).bas <= hauteur + .5, "le cadre tient entier");
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  for (const [largeur, hauteur] of [[390, 844], [390, 664], [1366, 657]]) {
    await cas(`${largeur}x${hauteur} : la ceinture jaune à la fin de Mes calculs du jour, puis le bilan`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: LEA()});
      assert.match(await texte(s.page, "#acc-porte-note"), /^Ceinture blanche · Palier/);
      await calculsDuJour(s.page);
      assert.equal(await visible(s.page, "#result-ceinture"), true, "l'écran de la ceinture");
      assert.equal(await texte(s.page, "#ceinture-titre"), "Ceinture jaune !");
      assert.equal(await texte(s.page, "#ceinture-phrase"), "Tous les calculs des bases sont solides ★");
      assert.equal(await visible(s.page, "#ceinture-fin"), false, "l'appli va plus loin : pas de « Tu as fini »");
      assert.equal(await visible(s.page, "#result-verdict"), false);
      assert.equal(await visible(s.page, "#result-fil"), true, "le fil de la séance reste en haut");
      assert.equal(await s.page.evaluate(() => document.querySelector("#ceinture-dessin svg").getAttribute("aria-label")), "Ceinture jaune");
      const bouton = await boite(s.page, "#ceinture-suite");
      assert.ok(bouton.bas <= hauteur, `« Continuer » visible sans défiler (${Math.round(bouton.bas)})`);
      await cadreTient(s.page, largeur, hauteur);
      const ranges = await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().ceintures);
      assert.deepEqual(ranges, [JOUR, null, null, null], "la progression porte la ceinture");
      await s.page.click("#ceinture-suite");
      await pause(s.page);
      assert.equal(await visible(s.page, "#result-ceinture"), false);
      assert.equal(await texte(s.page, "#result-title"), "Mes calculs du jour");
      await cadreTient(s.page, largeur, hauteur);
      await s.page.click(".seance-suite .arreter");
      await pause(s.page, 600);
      assert.match(await texte(s.page, "#acc-porte-note"), /^Ceinture jaune · Palier 2/);
      assert.ok(s.envoyes.some(p => Array.isArray(p.ceintures) && p.ceintures[0] === JOUR), "envoyée au serveur");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await cas("les bases et le CM1 finis ensemble : la jaune, puis l'orange, puis le bilan", async () => {
    const s = await ouvrir(nav, base, {largeur: 390, hauteur: 844, parcours: LEO()});
    await calculsDuJour(s.page);
    assert.equal(await texte(s.page, "#ceinture-titre"), "Ceinture jaune !");
    await s.page.click("#ceinture-suite");
    await pause(s.page);
    assert.equal(await texte(s.page, "#ceinture-titre"), "Ceinture orange !");
    assert.equal(await texte(s.page, "#ceinture-phrase"), "Tous les calculs du CM1 sont solides ★");
    await s.page.click("#ceinture-suite");
    await pause(s.page);
    assert.equal(await texte(s.page, "#result-title"), "Mes calculs du jour");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await cas("l'appli réglée jusqu'aux bases : « Tu as fini tout ce que ton professeur a ouvert. »", async () => {
    const s = await ouvrir(nav, base, {largeur: 390, hauteur: 844, parcours: LEA(), reglages: {"defi-calcul": {palier: 1}}});
    await calculsDuJour(s.page);
    assert.equal(await texte(s.page, "#ceinture-fin"), "Tu as fini tout ce que ton professeur a ouvert.");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  for (const [largeur, hauteur] of [[390, 844], [1366, 657]]) {
    await cas(`${largeur}x${hauteur} : la 3e barrette, une ligne dans le bilan (pas d'écran)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: INES()});
      await calculsDuJour(s.page);
      assert.equal(await visible(s.page, "#result-ceinture"), false);
      assert.equal(await texte(s.page, ".dc-barrette"), "Nouvelle barrette ! Ceinture jaune, 3 barrettes sur 3.");
      assert.equal(await s.page.evaluate(() => document.querySelectorAll(".dc-barrette svg path[stroke='#ffffff']").length), 3);
      await cadreTient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  for (const [largeur, hauteur] of [[390, 844], [1366, 657]]) {
    await cas(`${largeur}x${hauteur} : Mon parcours — les ceintures des onglets, ce qui est construit, la ligne de chaque palier, rien ne bouge`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: NOAH()});
      await s.page.click("#acc-porte");
      await pause(s.page);
      const onglets = await s.page.evaluate(() => [...document.querySelectorAll("#parcours-paliers button")].map(b => ({
        compte: b.querySelector("small").textContent, vide: b.querySelector("svg g").getAttribute("stroke-dasharray") !== null})));
      assert.deepEqual(onglets.map(o => o.compte), [`${duPalier(1).length}/${duPalier(1).length}`, `13/${TOTAL_2}`, `0/${duPalier(3).length}`, `0/${duPalier(4).length}`]);
      assert.deepEqual(onglets.map(o => o.vide), [false, true, true, true]);
      assert.equal(await texte(s.page, "#parcours-ceinture"), `Encore ${TOTAL_2 - 13} ★ pour la ceinture orange`);
      const releves = [];
      const lignes = [];
      for (const n of [1, 2, 3, 4, 2]) {
        await s.page.click(`#parcours-paliers button:nth-child(${n})`);
        await pause(s.page, 200);
        lignes.push(await texte(s.page, "#parcours-ceinture"));
        // Au téléphone, le titre du palier 4 (« Vers la 6e (6e et choix
        // pédagogiques) ») passe sur deux lignes, comme avant le lot : la
        // ligne de la ceinture suit le titre ; les onglets ne bougent pas.
        releves.push(JSON.stringify([await boite(s.page, "#parcours-paliers"), largeur > 620 ? await boite(s.page, ".panel") : null, largeur > 620 ? (await boite(s.page, "#parcours-ceinture")).haut : null]));
        await cadreTient(s.page, largeur, hauteur);
      }
      assert.deepEqual(lignes.slice(0, 4), ["Ceinture jaune · gagnée le 6 novembre", `Encore ${TOTAL_2 - 13} ★ pour la ceinture orange`,
        "Ceinture verte · après la ceinture orange", "Ceinture bleue · après la ceinture verte"]);
      assert.equal(new Set(releves).size, 1, `les onglets, le cadre et la ligne ne bougent pas : ${releves.join(" / ")}`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s).`); process.exit(1); }
})();
