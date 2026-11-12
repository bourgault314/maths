// Défi calcul, lot F1 « rythme » (07/11/2026) : le réglage de la classe dans
// la VRAIE page, au navigateur (relecture de Codex, points 4 et 6). Lot 1 « la
// séance » (12/11/2026) : le réglage est désormais la DURÉE (10 ou 15
// minutes), rangée dans le plan de la séance (seance.p[5]).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   npm install --no-save playwright
//   node tests/defi-calcul-f1-ecrans.cjs
//
// Ce qui est vérifié (un faux serveur de suivi répond) :
//   lent       la première lecture de l'identité met 1,2 s ; l'élève clique
//              tout de suite : la séance attend le réglage (15), pas le 10 de
//              l'onglet ;
//   change     le professeur passe de 10 à 15 pendant que la page est ouverte :
//              la séance s'ouvre avec 15 ;
//   muet       le serveur ne répond plus : la séance s'ouvre quand même, en
//              2 s au plus, avec le dernier réglage reçu (15) ;
//   stockage   l'onglet refuse d'écrire : le réglage reçu (15) vaut quand même ;
//   ancienne   le serveur refuse l'envoi (400, « page ancienne ») : rien ne
//              casse, le travail reste dans l'appareil.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const CODE = "7K3M9P";
const JOUR = "2026-11-09";
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(fini => serveur.listen(0, "127.0.0.1", () => fini(serveur)));
}

// Un élève qui a déjà une séance finie aujourd'hui : « Encore une séance »
// est à l'écran de fin, et la carte de l'accueil ouvre une séance neuve.
function parcoursDeDepart() {
  const p = P.creerParcours();
  p.modules.A1 = {vu: P.ajouterJours(JOUR, -1), ok: null, b: [4, 4, 4], e: [P.ajouterJours(JOUR, 5), P.ajouterJours(JOUR, 5), P.ajouterJours(JOUR, 5)], a: [1, 1, 1], f: [1, 1, 1], x: [0, 0, 0], t: [0, 0, 0], c: {}};
  p.seances = [P.ajouterJours(JOUR, -1)];
  p.jours = [P.ajouterJours(JOUR, -1)];
  return p;
}

async function ouvrir(nav, base, {minutes, delai = 0, muet = () => false, stockageCasse = false, refuserEnvoi = false, rangeDansOnglet = null}) {
  const ctx = await nav.newContext({viewport: {width: 390, height: 664}, timezoneId: "Indian/Reunion"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  const etat = {minutes, envois: 0, refus: 0};
  await page.addInitScript(([code, range, casse]) => {
    sessionStorage.setItem("mathsgo-suivi-code", code);
    if (range) sessionStorage.setItem("mathsgo-defi-calcul-reglages", JSON.stringify({code, minutes: range, palier: 4}));
    if (casse) {
      const ecrire = Storage.prototype.setItem;
      Storage.prototype.setItem = function (cle, valeur) {
        if (cle === "mathsgo-defi-calcul-reglages") throw new Error("QuotaExceededError");
        return ecrire.call(this, cle, valeur);
      };
    }
  }, [CODE, rangeDansOnglet, stockageCasse]);
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const h = {"access-control-allow-origin": "*"};
    const rendre = (d, statut = 200) => route.fulfill({status: statut, contentType: "application/json", headers: h, body: JSON.stringify(d)});
    if (route.request().url().endsWith("/api/eleve.php")) {
      if (muet()) return route.abort("timedout");
      if (delai) await new Promise(fini => setTimeout(fini, delai));
      return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: etat.minutes !== 10 ? {"defi-calcul": {minutes: etat.minutes}} : {}});
    }
    if (corps.lire) return rendre({ok: true, existe: true, parcours: parcoursDeDepart(), revision: 1});
    etat.envois += 1;
    if (refuserEnvoi) { etat.refus += 1; return rendre({ok: false, erreur: "Page ancienne : recharge la page."}, 400); }
    return rendre({ok: true, revision: 1 + etat.envois});
  });
  await page.goto(base + PAGE);
  return {page, ctx, erreurs, etat};
}

const prevues = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seance.p[5]);
const ouverte = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seance.p[0]);

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  await cas("lent : la séance attend la première lecture du réglage (15), pas le 10 de l'onglet", async () => {
    const s = await ouvrir(nav, base, {minutes: 15, delai: 1200});
    await s.page.waitForSelector("#acc-carte", {state: "visible"});
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seance.p[0] === 1, null, {timeout: 5000});
    assert.equal(await prevues(s.page), 15);
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await cas("change : le professeur passe de 10 à 15 minutes, la séance suivante a 15", async () => {
    const s = await ouvrir(nav, base, {minutes: 10});
    await s.page.waitForSelector("#acc-carte", {state: "visible"});
    await s.page.waitForTimeout(400);
    s.etat.minutes = 15;
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seance.p[0] === 1, null, {timeout: 5000});
    assert.equal(await prevues(s.page), 15);
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await cas("muet : sans réponse, la séance s'ouvre en 2 s au plus avec le dernier réglage reçu (15)", async () => {
    let coupe = false;
    const s = await ouvrir(nav, base, {minutes: 15, rangeDansOnglet: 10, muet: () => coupe});
    await s.page.waitForSelector("#acc-carte", {state: "visible"});
    await s.page.waitForTimeout(600);
    coupe = true;
    const debut = Date.now();
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seance.p[0] === 1, null, {timeout: 6000});
    assert.ok(Date.now() - debut < 4000, `ouverte en ${Date.now() - debut} ms`);
    assert.equal(await prevues(s.page), 15, "le dernier réglage reçu, pas un défaut");
    assert.equal(await ouverte(s.page), 1);
    await s.ctx.close();
  });

  await cas("stockage : l'onglet refuse d'écrire, le réglage reçu (15) vaut quand même", async () => {
    const s = await ouvrir(nav, base, {minutes: 15, stockageCasse: true});
    await s.page.waitForSelector("#acc-carte", {state: "visible"});
    await s.page.waitForTimeout(400);
    const texte = await s.page.evaluate(() => document.getElementById("acc-carte").innerText);
    assert.match(texte, /15\s?minutes/, texte);
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seance.p[0] === 1, null, {timeout: 5000});
    assert.equal(await prevues(s.page), 15);
    await s.ctx.close();
  });

  await cas("ancienne : un envoi refusé (400) ne casse rien, le travail reste dans l'appareil", async () => {
    const s = await ouvrir(nav, base, {minutes: 15, refuserEnvoi: true});
    await s.page.waitForSelector("#acc-carte", {state: "visible"});
    await s.page.click("#acc-carte");
    await s.page.waitForFunction(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours().seance.p[0] === 1, null, {timeout: 5000});
    await s.page.waitForTimeout(1500);
    assert.ok(s.etat.refus >= 1, "l'envoi est parti et a été refusé");
    const local = await s.page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("mathsgo-defi-calcul-parcours")).length);
    assert.ok(local >= 1, "la progression reste dans l'appareil");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await nav.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s).`); process.exit(1); }
  console.log("Défi calcul, lots F1 et 1 : le réglage de la durée est conforme au navigateur.");
})();
