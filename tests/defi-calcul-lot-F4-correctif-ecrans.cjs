// Défi calcul, correctif du lot F4 (21/11/2026, relecture de Codex) : la
// VRAIE page, au navigateur, au téléphone (390 × 844) et à l'ordinateur
// (1366 × 768). Chaque cas reproduit un point du rapport : il rougissait sur
// main `c68b58f`.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier
// (scripts/verifier-navigateur.mjs --appli defi-calcul, si).
//   node tests/defi-calcul-lot-F4-correctif-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-F4-correctif-ecrans.cjs
//
//   memes-regles  (3)  J'apprends de M6-1 (pas d'outil à manipuler) arrêté au
//                      temps après 4 calculs : le chemin annoncé et la reprise
//                      enregistrée disent la même chose (sans aide demain) ;
//   4e-arret      (10) au 4e arrêt, le niveau revient demain : « ton
//                      professeur va le revoir avec toi », sans « Demain, tu
//                      passes à la suite » ;
//   f9-2          (10) le 3e arrêt sur F9-2 (F9 a changé au lot 6) : la phrase
//                      entière, « Demain, tu passes à la suite. » ;
//   rappel-m4     (11) la reprise sans aide de M4-1 tombe sur « 0 × 8 » (sans
//                      dessin) : le premier calcul a quand même son dessin ;
//   d8-25         (12) D8-1 n'a que 24 calculs : J'apprends va jusqu'au 25e ;
//   page-ancienne (5)  une copie de l'appareil en version 11 : la page le
//                      dit, et ne l'écrase pas.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const CARTE = CORE.carte();
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const JOUR = "2026-11-23";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = process.env.FORMATS ? process.env.FORMATS.split(",").map(x => x.split("x").map(Number)) : [[390, 844], [1366, 768]];
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

// Un élève dont les tests de palier sont joués ; `modules` : ses lignes ;
// `seanceAuTemps` : une séance ouverte aujourd'hui dont le temps est passé
// (11 min 40 s), encore garantie (J'apprends s'arrête alors dès 4 calculs).
// (Lot K1 : une séance dont le temps est passé se ferme dès l'accueil ; elle
// part donc à 9 min 59 s, et la minute qui manque passe pendant J'apprends —
// voir `jouer(…, {uneMinute: true})`.)
// (Lot K1 : une étoile fermée ne s'apprend pas — `avant` : les étoiles de
// la carte d'avant celle-ci sont gagnées, pour qu'elle soit ouverte.)
function gagnerAvant(p, cle) {
  const six = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
  for (const k of CARTE.ordre) {
    if (k === cle) break;
    const [m, n] = k.split("-");
    if (p.modules[m] && p.modules[m].ar && p.modules[m].ar[Number(n) - 1]) continue;
    const r = P.appliquerTentative(p, {module: m, niveau: Number(n), reponses: six}, {aujourdhui: "2026-11-20", carte: CARTE});
    if (!r.refuse) p = r.parcours;
  }
  return p;
}
function eleve(modules, {seanceAuTemps = false, avant = null} = {}) {
  const brut = {version: P.VERSION, modules, jours: ["2026-11-20"], seances: ["2026-11-20"], paliers: PALIERS_JOUES};
  // (Lot K1 : le plan de la séance en version 12 — [ouverte, minutes, obligatoire, paquet, commencées].)
  if (seanceAuTemps) brut.seance = {jour: JOUR, etape: 1, n: 1, i: 4321, g: 1, p: [1, 10, 0, 0, 1], j: [0, 0, 0, 0, 599, 0, 0, 0, 0, 0]};
  const p = P.normaliserParcours(brut, {aujourdhui: JOUR});
  return avant ? gagnerAvant(p, avant) : p;
}
const ligne = (k, plus = {}) => Object.assign({vu: "2026-11-20", b: Array(k).fill(0), e: Array(k).fill(null), a: Array(k).fill(0), f: Array(k).fill(1), ar: Array(k).fill(0)}, plus);

async function ouvrir(nav, base, {largeur, hauteur, parcours = null, code = "7K3M9P", local = null}) {
  const ctx = await nav.newContext({viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, isMobile: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR", reducedMotion: "reduce"});
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  if (code) await page.addInitScript(c => sessionStorage.setItem("mathsgo-suivi-code", c), code);
  if (local) await page.addInitScript(([cle, valeur]) => { if (!sessionStorage.getItem("__pose")) { localStorage.setItem(cle, valeur); sessionStorage.setItem("__pose", "1"); } }, local);
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
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);
const visible = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return Boolean(e) && !e.hidden && e.getBoundingClientRect().height > 0; }, s);
async function cliquerTouches(page, nombre) {
  for (const c of CORE.formaterNombre(nombre)) {
    if (!c.trim() || c === " " || c === " ") continue;
    await page.click(`#play [data-key="${c}"]`);
  }
}
async function repondre(page, juste) {
  const c = await appel(page, "calcul");
  if (c.reponseEcrite) {
    // (Une fraction à deux cases : la réponse écrite, « 2/3 ».)
    for (const ch of c.reponseEcrite) await page.click(`#play [data-key="${ch}"]`);
  } else await cliquerTouches(page, juste ? c.reponse : c.reponse + 1);
  await page.click("#validate");
  await pause(page, 400);
  if (!juste) { await pause(page, 4000); await page.click("#validate"); }
  await pause(page, 1600);
}
async function ecrire(page) {
  const etapes = await appel(page, "ecrisEnCours");
  for (const etape of etapes) {
    await cliquerTouches(page, etape.reponse);
    await page.click("#validate");
    await pause(page, 700);
  }
  for (let i = 0; i < 6 && (await appel(page, "ecrisEnCours")); i += 1) { await page.click("#validate"); await pause(page, 700); }
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
const resultat = page => visible(page, "#result");
// Joue J'apprends jusqu'au bilan ; `choisir(e, n)` dit juste ou faux (e :
// l'entraînement à l'écran, n : les calculs déjà joués). Rend le nombre de
// calculs joués (J'écris à part).
async function jouer(page, choisir, {uneMinute = false} = {}) {
  let joues = 0;
  for (let tour = 0; tour < 80 && !(await resultat(page)); tour += 1) {
    if (await appel(page, "ecrisEnCours")) { await ecrire(page); continue; }
    // (Lot C3 : l'exemple résolu d'une écriture jamais montrée ne compte
    // pas : « À toi → », puis le calcul.)
    if ((await appel(page, "exempleAffiche")).exemple) { await page.click("#validate"); await pause(page, 600); continue; }
    const e = await appel(page, "entrainement");
    if (!e) break;
    await repondre(page, choisir(e, joues));
    joues += 1;
    // (Lot K1 : une minute de réflexion après le premier calcul — le temps de la séance passe.)
    if (uneMinute && joues === 1) await pause(page, 59000);
  }
  await pause(page, 800);
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

    await cas(`${f} : (3) J'apprends arrêté au temps — le chemin annoncé est la reprise enregistrée`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: eleve({M6: ligne(2, {f: [1, 0]})}, {seanceAuTemps: true, avant: "M6-1"})});
      assert.equal(await appel(s.page, "reprendre", "M6", 1, 0), true);
      await pause(s.page, 600);
      const joues = await jouer(s.page, () => true, {uneMinute: true});
      await photo(s.page, `${f}-memes-regles`);
      assert.equal(joues, 4, "arrêté au temps, dès 4 calculs");
      assert.match(await texte(s.page, "#result-title"), /^On continue demain$/);
      assert.match(await texte(s.page, "#result-suite"), /✓ ?Avec le dessin ?fait.*→ ?Sans aide ?demain/);
      const p = await appel(s.page, "parcours");
      assert.equal(P.repriseDe(p.modules.M6, 0), P.REPRISE.seul, "enregistré : sans aide, comme l'écran le dit");
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : (10) au 4e arrêt — « Ce calcul, ton professeur le reverra avec toi. », il revient demain`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: eleve({M6: ligne(2, {ar: [3 * 3 + 2, 0], e: ["2026-11-20", null], f: [1, 0]})}, {seanceAuTemps: true, avant: "M6-1"})});
      assert.equal(await appel(s.page, "reprendre", "M6", 1, 2), true);
      await pause(s.page, 600);
      await jouer(s.page, () => true, {uneMinute: true});
      await photo(s.page, `${f}-4e-arret`);
      const suite = await texte(s.page, "#result-suite");
      assert.match(suite, /Ce calcul, ton professeur le reverra avec toi\. En attendant, continue sur les autres lignes\./); // (lot K1, planche K1-2)
      assert.doesNotMatch(suite, /tu passes à la suite/, "il revient demain");
      const p = await appel(s.page, "parcours");
      assert.equal(P.arretsDe(p.modules.M6, 0), 4);
      assert.equal(P.enAttente(p.modules.M6, 0, P.ajouterJours(JOUR, 1)), false);
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : (10) le 3e arrêt sur F9-2 — « Ce calcul, ton professeur le reverra avec toi. » (lot K1)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: eleve({F9: ligne(3, {b: [4, 0, 0], e: ["2026-12-01", null, null], a: [1, 0, 0], d: ["2026-11-01", null, null], s: ["2026-11-10", null, null], ar: [0, 2 * 3 + 2, 0], f: [1, 1, 0]})}, {seanceAuTemps: true})});
      assert.equal(await appel(s.page, "reprendre", "F9", 2, 2), true);
      await pause(s.page, 600);
      await jouer(s.page, () => true, {uneMinute: true});
      await photo(s.page, `${f}-f9-2`);
      // (Lot K1 : plus de « Demain, tu passes à la suite » — l'élève choisit sur la carte.)
      assert.match(await texte(s.page, "#result-suite"), /Ce calcul, ton professeur le reverra avec toi\. En attendant, continue sur les autres lignes\./);
      const p = await appel(s.page, "parcours");
      assert.equal(p.modules.F9.e[1], "2026-11-30");
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : (11) la reprise sans aide de M4-1 commence par un calcul avec son dessin`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: eleve({M4: ligne(2, {ar: [5, 0], f: [1, 0]})})});
      // La graine qui fait tirer « 0 × 8 » (sans dessin) en premier.
      const vise = await s.page.evaluate(() => {
        const C = window.MATHSGO_DEFI_CALCUL_CORE;
        const exclure = C.niveauDe("M4-1").niveau.apprends.textes;
        let graine = 0;
        // (Lot C1 : la reprise sans aide tire sa série avec 0 calcul aidé, comme la page.)
        for (let g = 1; g < 20000 && !graine; g += 1) if (!C.aideDe(C.genererSerie("M4-1", {graine: g, genre: "entraine", total: 25, exclure, aides: 0})[0])) graine = g;
        const [now, hasard] = [Date.now, Math.random];
        Date.now = () => 0;
        Math.random = () => (graine + 0.5) / 4294967296;
        try { window.__MATHSGO_DEFI_CALCUL_TEST__.reprendre("M4", 1, 2); } finally { Date.now = now; Math.random = hasard; }
        return {graine, texte: C.genererSerie("M4-1", {graine, genre: "entraine", total: 25, exclure, aides: 0})[0].texte};
      });
      assert.ok(vise.graine, "une graine qui tire un calcul sans dessin en premier");
      await pause(s.page, 600);
      await photo(s.page, `${f}-rappel-m4`);
      assert.match(await texte(s.page, "#annonce"), /^On reprend là où tu en étais\.$/);
      assert.ok(await appel(s.page, "dessin"), `le premier calcul a son dessin (tiré : ${vise.texte}, à l'écran : ${(await appel(s.page, "calcul")).texte})`);
      assert.equal((await appel(s.page, "entrainement")).outil, "aucun", "sans aide : le dessin n'est qu'un rappel");
      await repondre(s.page, true);
      assert.match(await texte(s.page, "#question-count"), /^Calcul 2$/, "le rappel juste ne compte pas");
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : (12) D8-1 (24 calculs) — J'apprends va jusqu'au 25e`, async () => {
      // (Lot C2 : D8 a cinq niveaux.)
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: eleve({D8: ligne(5, {ar: [4, 0, 0, 0, 0], f: [1, 0, 0, 0, 0]})})});
      assert.equal(await appel(s.page, "reprendre", "D8", 1, 1), true);
      await pause(s.page, 600);
      // Sans aide : un juste, un faux (le dessin revient pour un calcul, juste) — jamais 5 sur 6.
      let seuls = 0;
      const joues = await jouer(s.page, e => { if (e.outil !== "aucun") return true; seuls += 1; return seuls % 2 === 1; });
      await photo(s.page, `${f}-d8-25`);
      assert.equal(joues, 25, "25 calculs, même si le générateur n'en a que 24 de différents");
      assert.match(await texte(s.page, "#result-title"), /^On continue demain$/);
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : (5) une copie de l'appareil plus récente (version 12 depuis le lot C2) — « Page ancienne : recharge la page. », rien n'est écrasé`, async () => {
      const v11 = JSON.stringify({version: P.VERSION + 1, epoque: 0, prenom: "", modules: {A1: {vu: "2026-11-22", b: [4, 0, 0], e: ["2026-11-30", null, null], champNeuf: [1, 2, 3]}}, paliers: ["2026-11-01", null, null, null], toutNeuf: {x: 1}});
      const s = await ouvrir(nav, base, {largeur, hauteur, code: "", local: ["mathsgo-defi-calcul-parcours", v11]});
      await photo(s.page, `${f}-page-ancienne`);
      assert.equal(await visible(s.page, "#suivi-repere"), true, "le message est à l'écran");
      assert.match(await texte(s.page, "#suivi-repere"), /Page ancienne : recharge la page\./);
      await s.page.click("#carte-continuer");
      await pause(s.page, 2500);
      if (await appel(s.page, "calcul")) await repondre(s.page, true);
      assert.equal(await s.page.evaluate(() => localStorage.getItem("mathsgo-defi-calcul-parcours")), v11, "la copie version 11 est intacte");
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }
  await nav.close();
  serveur.close();
  if (echecs) { console.log(`\n${echecs} échec(s)`); process.exit(1); }
  console.log("\nTout est conforme.");
})();
