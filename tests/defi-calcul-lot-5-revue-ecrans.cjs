// Défi calcul, lot 5 « Revue avant ouverture » (14/11/2026) : la VRAIE page,
// au navigateur, avec un faux serveur de suivi, aux cinq formats de la revue.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-5-revue-ecrans.cjs
// Safari : MOTEUR=webkit node tests/defi-calcul-lot-5-revue-ecrans.cjs
// Captures (pour comparer Chrome et Safari écran par écran) :
//   SORTIE=<dossier> node tests/defi-calcul-lot-5-revue-ecrans.cjs
//
// Ce qui est vérifié, élève connecté par code ET visiteur, à 390 × 664,
// 390 × 844, 1366 × 657, 1366 × 768 et 1920 × 1080 :
//   écrans     l'accueil, Mon parcours (les 4 paliers), « Comment ça
//              marche ? » : pas de défilement de côté, rien qui sort de
//              l'écran, le cadre entier à l'ordinateur ;
//   titre      le titre du palier tient sur une ligne, la liste ne bouge pas
//              d'un palier à l'autre ; « Palier 2 · Le CM1 »… ;
//   en-tête    pour l'élève à code, la ligne de suivi SOUS « ← Mon
//              parcours » et sous « ← Comment ça marche ? » ;
//   bilan      Mes calculs du jour : au téléphone, ce qui arrive à une
//              compétence est sous son nom ; à l'ordinateur, à côté ;
//   clavier    réponses tapées au clavier de l'ordinateur : le calcul a le
//              focus, sans trait autour.

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
const CODE = "7K3M9P";
const JOUR = "2026-11-13";
const MOTEUR = process.env.MOTEUR === "webkit" ? "webkit" : "chromium";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = [[390, 664], [390, 844], [1366, 657], [1366, 768], [1920, 1080]];
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
// Noah : la jaune, le CM1 en route. Maya : 6 compétences des bases reviennent aujourd'hui.
const NOAH = () => parcoursOu((c, r) => (c.palier === 1 ? {b: 5} : c.palier === 2 && r <= 13 ? {b: 4} : c.palier === 2 && r <= 18 ? {b: 2} : null), ["2026-11-06", null, null, null]);
const MAYA = () => parcoursOu((c, r) => (c.palier === 1 && r <= 6 ? {b: 2, e: JOUR, s: null} : c.palier === 1 && r <= 20 ? {b: 3, s: null} : null));

async function ouvrir(nav, base, {largeur, hauteur, parcours, connecte = true}) {
  const options = {viewport: {width: largeur, height: hauteur}, deviceScaleFactor: 1, hasTouch: largeur <= 620, timezoneId: "Indian/Reunion", locale: "fr-FR"};
  if (MOTEUR === "chromium") options.isMobile = largeur <= 620;
  const ctx = await nav.newContext(options);
  const page = await ctx.newPage();
  await page.clock.install({time: new Date(`${JOUR}T17:00:00+04:00`)});
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(e.message));
  page.on("console", m => { if (m.type() === "error") erreurs.push(m.text()); });
  if (connecte) {
    await page.addInitScript(code => sessionStorage.setItem("mathsgo-suivi-code", code), CODE);
    await page.route("https://suivi.mathsgo.re/**", async route => {
      const corps = JSON.parse(route.request().postData() || "{}");
      const h = {"access-control-allow-origin": "*"};
      const rendre = d => route.fulfill({status: 200, contentType: "application/json", headers: h, body: JSON.stringify(d)});
      if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "405", applis: [], reglages: {}});
      if (corps.lire) return rendre({ok: true, existe: true, parcours, revision: 1});
      return rendre({ok: true, revision: 2});
    });
  } else {
    await page.addInitScript(p => localStorage.setItem("mathsgo-defi-calcul-parcours", p), JSON.stringify(parcours));
  }
  await page.goto(base + PAGE);
  for (let i = 0; i < 40; i += 1) { await page.clock.runFor(100); await page.waitForTimeout(25); }
  return {page, ctx, erreurs};
}

const pause = async (page, ms = 400) => { await page.clock.runFor(ms); await page.waitForTimeout(100); };
const texte = (page, s) => page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, s);
const boite = (page, s) => page.evaluate(sel => { const b = document.querySelector(sel).getBoundingClientRect(); return {haut: b.top, bas: b.bottom, gauche: b.left, droite: b.right}; }, s);
async function photo(page, nom) {
  if (!SORTIE) return;
  fs.mkdirSync(SORTIE, {recursive: true});
  await page.screenshot({path: path.join(SORTIE, `${MOTEUR}-${nom}.png`), fullPage: true});
}

// Rien qui sort de l'écran sur les côtés ; le cadre entier à l'ordinateur.
async function tient(page, largeur, hauteur) {
  const sortis = await page.evaluate(() => {
    const vw = innerWidth;
    return [...document.querySelectorAll(".panel *")].filter(el => {
      if (!el.getClientRects().length || el.closest("[hidden]")) return false;
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.right > vw + 1 || b.left < -1);
    }).map(el => el.id || el.className).slice(0, 5);
  });
  assert.deepEqual(sortis, [], "rien ne sort de l'écran");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "pas de défilement de côté");
  if (largeur > 620) assert.ok((await boite(page, ".panel")).bas <= hauteur + .5, `le cadre tient entier (${Math.round((await boite(page, ".panel")).bas)} / ${hauteur})`);
}
// Nombre de lignes d'un texte à l'écran.
const lignes = (page, s) => page.evaluate(sel => {
  const r = document.createRange();
  r.selectNodeContents(document.querySelector(sel));
  return new Set([...r.getClientRects()].filter(x => x.width > 2).map(x => Math.round(x.bottom / 4))).size;
}, s);
// La ligne de suivi est-elle juste sous la barre « ← titre » de l'écran ?
const ligneSous = (page, ecran) => page.evaluate(id => {
  const barre = document.querySelector(`#${id} > .settings-toolbar`);
  const tete = document.querySelector("header.topbar");
  return Boolean(barre && tete && barre.nextElementSibling === tete && tete.getBoundingClientRect().top >= barre.getBoundingClientRect().bottom - 1);
}, ecran);

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const nav = await playwright[MOTEUR].launch(MOTEUR === "chromium" && process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };
  console.log(`moteur : ${MOTEUR}`);

  for (const [largeur, hauteur] of FORMATS) {
    for (const connecte of [true, false]) {
      const qui = connecte ? "élève" : "visiteur";
      await cas(`${largeur}x${hauteur} ${qui} : l'accueil, Mon parcours (4 paliers), « Comment ça marche ? »`, async () => {
        const s = await ouvrir(nav, base, {largeur, hauteur, parcours: NOAH(), connecte});
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${largeur}x${hauteur}-${qui}-accueil`);
        await s.page.click("#acc-porte");
        await pause(s.page);
        if (connecte) assert.equal(await ligneSous(s.page, "ecran-parcours"), true, "la ligne de suivi sous « ← Mon parcours »");
        const titres = [];
        const releves = [];
        for (const n of [1, 2, 3, 4]) {
          await s.page.click(`#parcours-paliers button:nth-child(${n})`);
          await pause(s.page, 200);
          titres.push(await texte(s.page, "#parcours-titre"));
          assert.equal(await lignes(s.page, "#parcours-titre"), 1, `le titre du palier ${n} tient sur une ligne`);
          releves.push(JSON.stringify([(await boite(s.page, "#parcours-ceinture")).haut, (await boite(s.page, "#parcours-modules")).haut]));
          await tient(s.page, largeur, hauteur);
          await photo(s.page, `${largeur}x${hauteur}-${qui}-parcours-${n}`);
        }
        assert.deepEqual(titres, ["Palier 1 · Les bases (CP · CE1 · CE2)", "Palier 2 · Le CM1", "Palier 3 · Le CM2", "Palier 4 · Vers la 6e"]);
        assert.equal(new Set(releves).size, 1, `d'un palier à l'autre, la liste ne bouge pas : ${releves.join(" / ")}`);
        await s.page.click("#parcours-back");
        await pause(s.page);
        await s.page.click("#acc-notice-bouton");
        await pause(s.page);
        if (connecte) assert.equal(await ligneSous(s.page, "notice"), true, "la ligne de suivi sous « ← Comment ça marche ? »");
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${largeur}x${hauteur}-${qui}-notice`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      });
    }
  }

  for (const [largeur, hauteur] of [[390, 664], [390, 844], [1366, 657]]) {
    await cas(`${largeur}x${hauteur} : le bilan de Mes calculs du jour (au téléphone, ce qui arrive sous le nom)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: MAYA()});
      await s.page.click("#acc-carte .go");
      await pause(s.page, 600);
      for (let i = 0; i < 25; i += 1) {
        const c = await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
        if (!c) break;
        for (const signe of String(c.reponse).replace(".", ",")) await s.page.click(`#play [data-key="${signe}"]`);
        await s.page.click("#validate");
        await pause(s.page, 1500);
      }
      await pause(s.page, 600);
      assert.equal(await texte(s.page, "#result-title"), "Mes calculs du jour");
      const positions = await s.page.evaluate(() => [...document.querySelectorAll("#result-suite .mouv > span")].map(ligne => {
        const [nom, suite] = [...ligne.children].map(e => e.getBoundingClientRect());
        return {dessous: suite.top >= nom.bottom - 1, aCote: Math.abs(suite.top - nom.top) < 4 && suite.left >= nom.right - 1};
      }));
      assert.equal(positions.length, 6, "les 6 compétences du jour");
      if (largeur <= 620) assert.ok(positions.every(p => p.dessous), "au téléphone : sous le nom");
      else assert.ok(positions.every(p => p.aCote), "à l'ordinateur : à côté");
      await tient(s.page, largeur, hauteur);
      await photo(s.page, `${largeur}x${hauteur}-bilan-du-jour`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await cas("1366x657 : réponses tapées au clavier — le calcul a le focus, sans trait autour", async () => {
    const s = await ouvrir(nav, base, {largeur: 1366, hauteur: 657, parcours: MAYA()});
    await s.page.click("#acc-carte .go");
    await pause(s.page, 600);
    for (let i = 0; i < 2; i += 1) {
      const c = await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
      await s.page.keyboard.type(String(c.reponse).replace(".", ","));
      await s.page.keyboard.press("Enter");
      await pause(s.page, 1600);
    }
    const focus = await s.page.evaluate(() => { const a = document.activeElement; return {id: a.id, trait: getComputedStyle(a).outlineStyle}; });
    assert.deepEqual(focus, {id: "expression", trait: "none"});
    await photo(s.page, "1366x657-clavier");
    assert.deepEqual(s.erreurs, []);
    await s.ctx.close();
  });

  await nav.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s).`); process.exit(1); }
})();
