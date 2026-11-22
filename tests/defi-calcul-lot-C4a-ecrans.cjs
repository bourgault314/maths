// Défi calcul, lot C4a « compter en dizaines, additionner deux nombres »
// (22/11/2026, planches 0 à 13 validées par Gwenaël) : la VRAIE page, au
// navigateur, élève connecté (faux serveur de suivi), aux 5 formats.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-C4a-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-C4a-ecrans.cjs
// Safari : NAVIGATEUR=webkit node tests/defi-calcul-lot-C4a-ecrans.cjs
//
//   dessins   « Avec le dessin » dans les 13 niveaux du lot : le tableau des
//             rangs (le chiffre qui change, casser une centaine, compter en
//             dizaines), la droite à deux sauts et son repère ; la première
//             ligne, puis le calcul ; le cadre tient ;
//   lecons    On te montre et J'écris des leçons changées ;
//   directe   le résultat tapé à la première case : juste, la case du milieu
//             écrite sans vert, rien en vert dans le tableau.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-23";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 664], [390, 844], [1366, 657], [1366, 768], [1920, 1080]];
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

async function ouvrir(nav, base, {largeur, hauteur, parcours = null}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"});
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

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(80); };
const appel = (page, nom, ...args) => page.evaluate(([n, a]) => window.__MATHSGO_DEFI_CALCUL_TEST__[n](...a), [nom, args]);
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);
async function taper(page, nombre) {
  for (const c of String(nombre).replace(".", ",")) await page.click(`#play [data-key="${c}"]`);
  await page.click("#validate");
  await pause(page, 300);
}
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.screenshot({path: path.join(SORTIE, `${nom}.png`)});
}
// Pas de défilement de côté, rien ne sort ; à l'ordinateur, le cadre entier.
async function tient(page, largeur, hauteur) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pas de défilement de côté");
  if (largeur > 620) {
    const bas = await page.evaluate(() => document.querySelector(".panel:not([hidden])").getBoundingClientRect().bottom);
    assert.ok(bas <= hauteur + .5, `le cadre tient entier (${Math.round(bas)} / ${hauteur})`);
  }
}

const DESSINS = [
  ["A3", 1, "432 + 40 = □", "dc-rang", "3 + 4 = "], ["A3", 2, "400 − 20 = □", "dc-rang", "100 − 20 = "],
  ["A3", 2, "854 + 90 = □", "dc-rang", "85 + 9 = "], ["A3", 3, "6 979 + 30 = □", "dc-rang", "697 + 3 = "],
  ["A3", 4, "73 295 − 70 = □", "dc-rang", "9 − 7 = "], ["M1", 5, "double de 800 = □", "dc-rang", "8 + 8 = "],
  ["M1", 5, "2 × 600 = □", "dc-rang", "2 × 6 = "], ["M12", 1, "3 × □ = 120", "dc-rang", "3 × = 12"],
  ["A2", 2, "70 + □ = 100", "dc-rang", "7 + = 10"], ["A2", 2, "□ + 30 = 100", "dc-rang", "+ 3 = 10"],
  ["A2", 4, "□ + 700 = 1 000", "dc-rang", "+ 7 = 10"], ["A2", 4, "□ + 550 = 1 000", "", "550 + = 600"],
  ["A4", 2, "57 + 29 = □", "", "57 + 20 = "], ["A7", 2, "61 − 28 = □", "", "61 − 20 = "],
  ["A4", 3, "79 + 52 = □", "", "79 + 50 = "], ["A7", 3, "602 − 84 = □", "", "602 − 80 = "]
];
const LECONS = [["A3", 2], ["A3", 3], ["A3", 4], ["M12", 1], ["A4", 3], ["A7", 3]];
const ECRIS = [["A3", 1, "Dans 234, le chiffre des dizaines est 3."], ["A3", 2, "768, c’est 76 dizaines et 8 unités."], ["M12", 1, "350, c’est 35 dizaines."], ["A2", 2, "20, c’est 2 dizaines ; 100, c’est 10 dizaines."]];
const lignesTexte = page => page.evaluate(() => [...document.querySelectorAll("#expression .lg > span")].map(l => l.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim()));
const classeDessin = page => page.evaluate(() => { const s = document.querySelector("#aide > svg"); return s && !document.getElementById("aide").hidden ? s.getAttribute("class") || "" : null; });
const carteTient = page => page.evaluate(() => { const c = document.getElementById("question-card"); return c.scrollHeight - c.clientHeight; });

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = process.env.NAVIGATEUR === "webkit" ? await playwright.webkit.launch() : await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;
    await cas(`${f} : « Avec le dessin » dans les niveaux du lot (${DESSINS.length} calculs)`, async () => {
      for (const [id, n, calcul, classe, premiere] of DESSINS) {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        assert.ok(await appel(s.page, "poser", id, n, calcul, "image"), `${id}-${n} ${calcul} posé`);
        await pause(s.page, 600);
        assert.equal(await classeDessin(s.page), classe, `${calcul} : le dessin`);
        const lignes = await lignesTexte(s.page);
        assert.equal(lignes.length, 2, `${calcul} : deux lignes`);
        assert.ok(lignes[0].replace(/\s/g, "").startsWith(premiere.replace(/\s/g, "")), `${calcul} : « ${lignes[0]} »`);
        await tient(s.page, largeur, hauteur);
        if (largeur > 620) assert.ok(await carteTient(s.page) <= 1, `${calcul} : le cadre ne déborde pas`);
        await photo(s.page, `${f}-dessin-${id}-${n}-${calcul.replace(/[^0-9]+/g, "_")}`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
    });

    await cas(`${f} : les leçons changées — On te montre, J'écris`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of LECONS) {
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 500);
        await tient(s.page, largeur, hauteur);
        assert.equal((await lignesTexte(s.page)).length, 2, `${id}-${n} : On te montre à étapes`);
        await photo(s.page, `${f}-montre-${id}-${n}`);
      }
      for (const [id, n, consigne] of ECRIS) {
        await appel(s.page, "ecrire", id, n, "lecon");
        await pause(s.page, 500);
        await tient(s.page, largeur, hauteur);
        assert.equal(await texte(s.page, "#aide .consigne"), consigne, `${id}-${n} : la ligne de J'écris`);
        await photo(s.page, `${f}-ecris-${id}-${n}`);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : le résultat tapé à la première case est juste`, async () => {
      for (const [id, n, calcul, reponse, milieu] of [["A3", 2, "854 + 90 = □", 944, "94"], ["A4", 2, "57 + 29 = □", 86, "77"], ["A2", 2, "70 + □ = 100", 30, "3"]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        assert.ok(await appel(s.page, "poser", id, n, calcul, "image"));
        await pause(s.page, 600);
        for (const c of String(reponse)) await s.page.click(`#play [data-key="${c}"]`);
        await s.page.click("#validate");
        await s.page.clock.runFor(150);
        await s.page.waitForTimeout(100);
        assert.equal(await texte(s.page, "#question-count"), "Calcul 1", "pas encore passé au suivant");
        assert.match(await texte(s.page, "#answer-feedback"), /^Bravo/);
        const cases = await s.page.evaluate(() => [...document.querySelectorAll("#expression .lg .inline-answer")].map(b => [b.className.replace("inline-answer ", ""), b.textContent.replace(/\s/g, "")]));
        assert.deepEqual(cases, [["is-corrected", milieu], ["is-correct", String(reponse)]], `${calcul} : la case du milieu sans vert`);
        const verts = await s.page.evaluate(() => [...document.querySelectorAll("#aide svg rect")].filter(r => r.getAttribute("stroke") === "#147447").length);
        assert.ok(verts <= 1, `${calcul} : rien d'autre en vert que l'arrivée (${verts})`);
        await photo(s.page, `${f}-directe-${id}-${n}`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
