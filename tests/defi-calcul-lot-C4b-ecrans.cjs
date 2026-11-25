// Défi calcul, lot C4b « les petits calculs des bases » (25/11/2026, choix
// de Gwenaël par questions, planches 1 à 6) : la VRAIE page, au navigateur,
// élève connecté (faux serveur de suivi), aux 5 formats.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-C4b-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-C4b-ecrans.cjs
// Safari : NAVIGATEUR=webkit node tests/defi-calcul-lot-C4b-ecrans.cjs
//
//   dessins   « Avec le dessin » dans les 9 niveaux du lot : le tableau du
//             chiffre qui change (32 + 4), pile sur la dizaine (36 + 4), la
//             dizaine cassée en dizaines (50 − 6, 730 − 4, 600 − 4), le
//             complément à la dizaine (74 + □ = 80), les deux barres (2 + 4,
//             0 + 7, 9 − 4), les trous et les passages à 2 sauts (7 + □ = 12,
//             523 − 7) ; la première ligne, puis le calcul ; l'annonce
//             « Nouveau » ; le cadre tient ;
//   lecons    On te montre, J'écris des leçons changées, le Je représente
//             des fractions (une addition) ;
//   directe   le résultat tapé à la première case : juste. (Pas 74 + □ = 80 :
//             sa première ligne, 4 + □ = 10, a la même réponse.)

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-25";
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
  // [module, niveau, calcul, dessin (« tableau », « barres », « droite »), première ligne (null : une seule), début de la description, annonce]
  ["A1", 1, "2 + 4 = □", "barres", null, "Deux barres de la même longueur : un nombre à trouver en haut ; dessous, 2 et 4.", ""],
  ["A1", 1, "0 + 7 = □", "barres", null, "Deux barres de la même longueur : un nombre à trouver en haut ; dessous, 7.", ""],
  ["A1", 3, "9 − 4 = □", "barres", null, "Deux barres de la même longueur : 9 en haut ; dessous, 4 et un nombre à trouver.", ""],
  ["A1", 3, "7 + □ = 12", "droite", "7 + = 10", "Droite : on part de 7.", ""],
  ["A10", 1, "32 + 4 = □", "tableau", "2 + 4 =", "Tableau, en unités. 32 : 3 dizaines, 2 unités.", ""],
  ["A10", 1, "36 + 4 = □", "tableau", "6 + 4 =", "Tableau, en unités. 36 : 3 dizaines, 6 unités.", "Nouveau : j’arrive pile sur la dizaine : 10 unités font 1 dizaine."],
  ["A11", 1, "157 − 5 = □", "tableau", "7 − 5 =", "Tableau, en unités. 157 :", ""],
  ["A2", 1, "74 + □ = 80", "tableau", "4 + = 10", "Tableau, en unités. 74 : 7 dizaines, 4 unités. + ? :", ""],
  ["A2", 1, "95 + □ = 100", "tableau", "5 + = 10", "Tableau, en unités. 95 :", ""],
  ["A11", 2, "50 − 6 = □", "tableau", "10 − 6 =", "Tableau, en dizaines. 50 : 5 dizaines, 0 unité. 4 dizaines, 10 unités.", "Nouveau : on part d’une dizaine entière : je casse une dizaine."],
  ["A11", 2, "730 − 4 = □", "tableau", "10 − 4 =", "Tableau, en dizaines. 730 : 73 dizaines, 0 unité. 72 dizaines, 10 unités.", "Nouveau : on part d’une dizaine entière : je casse une dizaine."],
  ["A11", 3, "600 − 4 = □", "tableau", "10 − 4 =", "Tableau, en dizaines. 600 : 60 dizaines, 0 unité. 59 dizaines, 10 unités.", "Nouveau : on part d’une centaine ronde : je casse une dizaine."],
  ["A11", 2, "523 − 7 = □", "droite", "523 − 3 =", "Droite : on part de 523.", ""]
];
const LECONS = [["A10", 1], ["A11", 1], ["A2", 1]];
const ECRIS = [["A10", 1, "254 + 3 = 250 + 4 + 3", "Tableau, en unités."], ["A11", 1, "486 − 3 = 480 + 6 − 3", "Tableau, en unités."], ["A2", 1, "Dans 433, le chiffre des unités est 3.", "Tableau, en unités."]];
const espacesT = t => String(t).replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();
const lignesTexte = page => page.evaluate(() => [...document.querySelectorAll("#expression .lg > span")].map(l => l.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim()));
const dessinVu = page => page.evaluate(() => { const s = document.querySelector("#aide > svg"); return s && !document.getElementById("aide").hidden ? {classe: s.getAttribute("class") || "", aria: s.getAttribute("aria-label") || ""} : null; });
const annonceVue = page => page.evaluate(() => { const a = document.querySelector("#annonce"); return a && !a.hidden ? a.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim() : ""; });
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
      for (const [id, n, calcul, sorte, premiere, aria, annonce] of DESSINS) {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        assert.ok(await appel(s.page, "poser", id, n, calcul, "image"), `${id}-${n} ${calcul} posé`);
        await pause(s.page, 600);
        const vu = await dessinVu(s.page);
        assert.ok(vu, `${calcul} : un dessin`);
        assert.equal(vu.classe, sorte === "tableau" ? "dc-rang" : "", `${calcul} : le dessin`);
        assert.ok(espacesT(vu.aria).startsWith(espacesT(aria)), `${calcul} : « ${vu.aria} »`);
        if (sorte === "tableau") assert.doesNotMatch(vu.aria, /moins|plus|Droite/, `${calcul} : plus de droite`);
        const lignes = await lignesTexte(s.page);
        if (premiere === null) assert.equal(lignes.length, 0, `${calcul} : pas de dessin à étapes`);
        else {
          assert.equal(lignes.length, 2, `${calcul} : deux lignes`);
          assert.ok(lignes[0].replace(/\s/g, "").startsWith(premiere.replace(/\s/g, "")), `${calcul} : « ${lignes[0]} »`);
        }
        assert.equal(await annonceVue(s.page), annonce, `${calcul} : l'annonce`);
        await tient(s.page, largeur, hauteur);
        if (largeur > 620) assert.ok(await carteTient(s.page) <= 1, `${calcul} : le cadre ne déborde pas`);
        await photo(s.page, `${f}-dessin-${id}-${n}-${calcul.replace(/[^0-9]+/g, "_")}`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
    });

    await cas(`${f} : les leçons changées — On te montre, J'écris, Je représente des fractions`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of LECONS) {
        assert.ok(await appel(s.page, "montrer", id, n), `${id}-${n} : On te montre`);
        await pause(s.page, 500);
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-montre-${id}-${n}`);
      }
      for (const [id, n, consigne, aria] of ECRIS) {
        await appel(s.page, "ecrire", id, n, "lecon");
        await pause(s.page, 500);
        await tient(s.page, largeur, hauteur);
        assert.equal(espacesT(await texte(s.page, "#aide .consigne")), consigne, `${id}-${n} : la ligne de J'écris`);
        assert.ok(espacesT((await dessinVu(s.page)).aria).startsWith(aria), `${id}-${n} : le tableau dans J'écris`);
        assert.equal((await lignesTexte(s.page)).length, 2, `${id}-${n} : deux lignes`);
        await photo(s.page, `${f}-ecris-${id}-${n}`);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
      // Le Je représente des fractions (la leçon entière) : une addition.
      for (const [id, n, calcul] of [["F8", 1, "5/8 + 2/8"], ["F9", 1, "3/4 + 1/8"]]) {
        const t = await ouvrir(nav, base, {largeur, hauteur});
        assert.ok(await appel(t.page, "apprendre", id, n));
        await pause(t.page, 500);
        const cle = `${id}-${n}`;
        const attendu = CORE.niveauDe(cle).niveau.apprends.represente;
        assert.equal(espacesT(attendu.texte).replace(" = □/8", ""), calcul, `${cle} : Je représente`);
        await tient(t.page, largeur, hauteur);
        await photo(t.page, `${f}-apprendre-${cle}`);
        assert.deepEqual(t.erreurs, []);
        await t.ctx.close();
      }
    });

    await cas(`${f} : le résultat tapé à la première case est juste`, async () => {
      for (const [id, n, calcul, reponse, milieu] of [["A10", 1, "32 + 4 = □", 36, "6"], ["A11", 2, "50 − 6 = □", 44, "4"]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        assert.ok(await appel(s.page, "poser", id, n, calcul, "image"));
        await pause(s.page, 600);
        for (const c of String(reponse)) await s.page.click(`#play [data-key="${c}"]`);
        await s.page.click("#validate");
        await s.page.clock.runFor(150);
        await s.page.waitForTimeout(100);
        assert.equal(await texte(s.page, "#question-count"), "Calcul 1", "pas encore passé au suivant");
        assert.match(await texte(s.page, "#answer-feedback"), /^Bravo/);
        const cases = await s.page.evaluate(() => [...document.querySelectorAll("#expression .lg .inline-answer")].map(b => b.textContent.replace(/\s/g, "")));
        assert.deepEqual(cases, [milieu, String(reponse)], `${calcul} : les deux cases écrites`);
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
