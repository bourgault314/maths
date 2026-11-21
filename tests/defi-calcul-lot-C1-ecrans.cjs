// Défi calcul, lot C1 « l'ordre des calculs » (21/11/2026) : la VRAIE page,
// au navigateur, élève connecté (faux serveur de suivi), aux 5 formats
// (390 × 664, 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-C1-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-C1-ecrans.cjs
// Planches « avant » (sur une copie de main) : AVANT=<copie de main> — rien
// n'est vérifié, seules les photos et les suites de calculs sont prises.
//
//   montee   J'apprends de « Doubles et moitiés en découpant » et
//            d'« ajouter 19, 29, 39 », repris au dessin, tout juste : les
//            calculs de chaque écriture ne redescendent jamais dans les 9
//            premiers, le cadre tient entier à chaque calcul ;
//   cran     la même série avec une erreur au 6e calcul : le calcul suivant
//            est de la même écriture et plus facile, puis la série reprend
//            (on remonte) ; le cadre tient.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const playwright = require("playwright");

const RACINE = process.env.AVANT ? path.resolve(process.env.AVANT) : path.resolve(__dirname, "..");
const AVANT = Boolean(process.env.AVANT);
const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
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

// Une série J'apprends reprise au dessin (`depart` 1), jouée jusqu'au
// bout : juste partout, sauf au calcul `rate` (1 = le premier). Rend les
// calculs vus, dans l'ordre, avec leur outil ; la photo du calcul qui suit
// l'erreur.
async function jouer(page, f, id, n, {rate = 0, nom = ""} = {}) {
  await appel(page, "reprendre", id, n, 1);
  await pause(page, 600);
  const vus = [];
  for (let tour = 0; tour < 40 && !(await resultat(page)); tour += 1) {
    if (await appel(page, "ecrisEnCours")) { await ecrire(page); continue; }
    const e = await appel(page, "entrainement");
    if (!e) break;
    const c = await appel(page, "calcul");
    vus.push({texte: c.texte.replace(/[  ]/g, " "), forme: c.forme, d: CORE.difficulte(c), outil: e.outil});
    await verifier(async () => tient(page, ...f.split("x").map(Number)));
    if (rate && vus.length === rate + 1) await photo(page, `${f}-${nom}-apres-erreur`);
    if (rate && vus.length === rate) await photo(page, `${f}-${nom}-erreur`);
    // « Avec le dessin » à étapes : la case du milieu d'abord (juste).
    for (let k = 0; k < 4; k += 1) {
      const etape = await appel(page, "caseDuDessin");
      if (!etape) break;
      await cliquerTouches(page, etape.reponse);
      await page.click("#validate");
      await pause(page, 500);
    }
    const joues = e.joues;
    await repondre(page, vus.length !== rate);
    // (Un calcul ne compte qu'une fois : on attend que sa réponse soit prise.)
    for (let k = 0; k < 6; k += 1) { const apres = await appel(page, "entrainement"); if (!apres || apres.joues > joues || await resultat(page) || await appel(page, "ecrisEnCours")) break; await pause(page, 600); }
  }
  return vus;
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };
  const suites = {};
  const NIVEAUX = [["M1", 3, "decoupant"], ["A5", 2, "ajouter-19"]];
  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;
    for (const [id, n, nom] of NIVEAUX) {
      await cas(`${f} : ${CORE.nomCompetence(id, n)} — tout juste, chaque écriture monte dans les 9 premiers`, async () => {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        const vus = await jouer(s.page, f, id, n);
        suites[`${f} ${nom} juste`] = vus.map(v => v.texte);
        await verifier(async () => {
          assert.ok(vus.length >= 7, `${vus.length} calculs`);
          const formes = [...new Set(vus.slice(0, 9).map(v => v.forme))];
          formes.forEach(forme => {
            const ds = vus.slice(0, 9).filter(v => v.forme === forme).map(v => v.d);
            assert.deepEqual(ds, [...ds].sort((a, b) => a - b), `${forme} : ${vus.slice(0, 9).map(v => v.texte).join(" · ")}`);
          });
          assert.deepEqual(s.erreurs, []);
        });
        await s.ctx.close();
      });
      await cas(`${f} : ${CORE.nomCompetence(id, n)} — une erreur au 6e calcul : un cran plus facile, puis on remonte`, async () => {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        const vus = await jouer(s.page, f, id, n, {rate: 6, nom});
        suites[`${f} ${nom} erreur au 6e`] = vus.map(v => v.texte);
        await verifier(async () => {
          const [rate, suivant] = [vus[5], vus[6]];
          assert.equal(suivant.forme, rate.forme, `${rate.texte} puis ${suivant.texte} : la même écriture`);
          assert.ok(suivant.d < rate.d, `${rate.texte} puis ${suivant.texte} : plus facile`);
          assert.ok(vus.slice(7).some(v => v.forme === rate.forme && v.d >= rate.d), `on remonte : ${vus.map(v => v.texte).join(" · ")}`);
          assert.deepEqual(s.erreurs, []);
        });
        await s.ctx.close();
      });
    }
  }
  if (SORTIE) fs.writeFileSync(path.join(SORTIE, "suites.json"), JSON.stringify(suites, null, 1));
  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est vert");
  process.exit(echecs ? 1 : 0);
})();
