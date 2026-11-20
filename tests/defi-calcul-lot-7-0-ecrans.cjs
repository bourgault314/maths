// Défi calcul, lot 7-0 « Retouches du moule » (14/11/2026) : la VRAIE page,
// au navigateur, élève connecté (faux serveur de suivi), au téléphone
// (390 × 664 et 390 × 844) et à l'ordinateur (1366 × 768).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-7-0-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-7-0-ecrans.cjs
//
//   dessin     « Avec le dessin » à étapes (A10-2, A2-5, A8-1) : la première
//              case (l'arrivée du premier saut, ou le premier saut d'un
//              trou), puis le résultat ; un faux rougit, deux faux donnent
//              la case ; le dessin se remplit sans changer de place ;
//   montrer    « On te montre » à étapes sur la droite (A10-3) ;
//   jamais     au 3e geste refusé, l'outil montre le geste (perles,
//   bloqué     glisse-nombres, jetons, bandes) ; l'élève le refait, la
//              lumière s'éteint, le geste est pris ;
//   palier     le test d'un élève aux bases s'arrête au palier 1 (A2 : 3
//              marches, « Le niveau 4 viendra plus tard ») ; les bases
//              finies, les marches 4 et 5 d'A2 ont leur test.

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
const JOUR = "2026-11-16";
const SORTIE = process.env.SORTIE ? path.resolve(process.env.SORTIE) : null;
const FORMATS = [[390, 664], [390, 844], [1366, 768]];
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

// Tout ce qui vient avant `jusqua` dans l'ordre du parcours est entré (boîte
// 4, revient dans 9 jours : pas de calculs du jour aujourd'hui).
function parcoursAvant(arret, ceintures = [null, null, null, null]) {
  // (Lot F4 : les tests de palier déjà joués — l'élève avance module par module.)
  const brut = {version: P.VERSION, modules: {}, ceintures, paliers: ["2026-11-01", "2026-11-01", "2026-11-01", "2026-11-01"], jours: ["2026-11-12", "2026-11-13"], seances: ["2026-11-12", "2026-11-13"]};
  for (const c of P.parcoursConstruit(CARTE)) {
    if (arret(c)) break;
    const k = P.NIVEAUX[c.module];
    const m = brut.modules[c.module] || (brut.modules[c.module] = {vu: "2026-11-13", b: Array(k).fill(0), e: Array(k).fill(null), d: Array(k).fill(null), s: Array(k).fill(null), a: Array(k).fill(0), f: Array(k).fill(0)});
    m.b[c.niveau - 1] = 4;
    m.e[c.niveau - 1] = "2026-11-25";
    m.d[c.niveau - 1] = "2026-11-01";
    m.s[c.niveau - 1] = "2026-11-10";
    m.a[c.niveau - 1] = 1;
  }
  return P.normaliserParcours(brut);
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
const boiteDessin = page => page.evaluate(() => { const b = document.querySelector("#aide > svg").getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)].join(","); });
// La place d'un élément (rien ne doit bouger quand l'outil montre le geste).
// (Lot 7a, constat de Code sur la PR #1213 : sous Safari, la bande descend
// de 0,04 px quand elle brille, et l'arrondi au pixel faisait échouer la
// comparaison ; on compare à 1 px près, invisible à l'œil.)
const place = (page, sel) => page.evaluate(q => { const b = document.querySelector(q).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);
const memePlace = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= 1);
const lignes = page => page.evaluate(() => [...document.querySelectorAll("#expression .lg > span")].map(l => ({classe: l.className, texte: l.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim()})));
const dessin = page => appel(page, "dessin");

// Un geste refusé au boulier : la première perle au repos de la rangée
// entamée, poussée seule (le geste attendu en pousse plusieurs).
async function perleSeule(page) {
  const r = await page.evaluate(() => {
    for (const rangee of document.querySelectorAll(".perles-rangee")) {
      const perles = [...rangee.querySelectorAll(".perle")];
      const t = parseFloat(perles[0].style.width);
      const poussees = perles.filter((p, i) => parseFloat(p.style.left) < (i + 3) * t).length;
      if (poussees > 0 && poussees < 10) { const b = perles[poussees].getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2, t: b.width}; }
    }
    return null;
  });
  await page.mouse.move(r.x, r.y);
  await page.mouse.down();
  await page.mouse.move(r.x - 3 * r.t, r.y, {steps: 4});
  await page.mouse.move(r.x - 12 * r.t, r.y, {steps: 6});
  await page.mouse.up();
  await pause(page, 1900);
}

// Lot 7b (constat de Code sur #1228 : la recette rougissait parfois au
// boulier en 1366 × 768, verte rejouée seule) : on attend que l'aide
// apparaisse, au lieu d'un délai fixe — au plus 4 s, sans toucher à l'appli.
async function attendreQue(page, lire, essais = 40) {
  for (let i = 0; i < essais; i += 1) {
    const valeur = await lire();
    if (valeur) return valeur;
    await pause(page, 100);
  }
  return lire();
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
    await cas(`${f} : « Avec le dessin » à étapes — l'arrivée du premier saut, puis le résultat (A10-2)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      const q = await appel(s.page, "dessinEtapes", "A10", 2, 0);
      await pause(s.page, 500);
      assert.match(await texte(s.page, "#seance-fil"), /Avec le dessin$/);
      let l = await lignes(s.page);
      assert.deepEqual(l.map(x => x.classe), ["ici", "apres"]);
      const place = await boiteDessin(s.page);
      assert.equal(await s.page.evaluate(() => [...document.querySelectorAll("#aide > svg text")].filter(t => t.textContent === "?").length), 2, "les deux arrivées sont « ? »");
      await photo(s.page, `${f}-dessin-1`);
      await tient(s.page, largeur, hauteur);
      await taper(s.page, q.etapes[0].reponse);
      l = await lignes(s.page);
      assert.deepEqual(l.map(x => x.classe), ["faite", "ici"], "la première case faite, le résultat à écrire");
      assert.equal(await boiteDessin(s.page), place, "le dessin ne bouge pas");
      assert.equal(await s.page.evaluate(() => [...document.querySelectorAll("#aide > svg text")].filter(t => t.textContent === "?").length), 1, "l'arrivée du premier saut s'écrit");
      await photo(s.page, `${f}-dessin-2`);
      await taper(s.page, q.reponse);
      assert.equal(await texte(s.page, "#answer-feedback"), "Bravo !");
      assert.equal(await boiteDessin(s.page), place, "le dessin ne bouge pas");
      await photo(s.page, `${f}-dessin-3`);
      await tient(s.page, largeur, hauteur);
      assert.equal((await appel(s.page, "entrainement")).joues, 1, "un calcul compté");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : un trou à trois sauts (A2-5) ; deux faux à la première case la donnent ; un faux au résultat, la correction`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      const q = await appel(s.page, "dessinEtapes", "A2", 5, 3);
      await pause(s.page, 500);
      assert.match(q.etapes[0].texte, /\+ □ = /, "un trou : le premier saut");
      await taper(s.page, q.etapes[0].reponse + 1);
      assert.equal(await s.page.evaluate(() => document.querySelector("#inline-answer").classList.contains("is-invalid")), true, "un faux : la case rougit");
      await taper(s.page, q.etapes[0].reponse + 2);
      const l = await lignes(s.page);
      assert.deepEqual(l.map(x => x.classe), ["faite", "ici"], "deux faux : la case est donnée, on passe au résultat");
      assert.equal(await s.page.evaluate(() => document.querySelector("#expression .lg > span.faite .inline-answer").classList.contains("is-corrected")), true, "donnée : sans vert");
      await photo(s.page, `${f}-trou-donne`);
      await taper(s.page, q.reponse + 10);
      await pause(s.page, 300);
      assert.ok((await texte(s.page, "#answer-feedback")).length > 10, "la correction se lit");
      assert.deepEqual((await lignes(s.page)).map(x => x.classe), ["faite", "revelee"], "les lignes écrivent leurs réponses");
      await photo(s.page, `${f}-trou-correction`);
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : « On te montre » sur la droite (A10-3) : à étapes, sous la consigne`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await appel(s.page, "montrer", "A10", 3);
      await pause(s.page, 500);
      assert.match(await texte(s.page, "#seance-fil"), /On te montre$/);
      assert.match(await texte(s.page, "#aide .consigne"), /Je vais à la centaine/);
      assert.deepEqual((await lignes(s.page)).map(x => x.texte.replace(/ /g, "")), ["196+4=", "196+7="]);
      await photo(s.page, `${f}-montrer-1`);
      await taper(s.page, 200);
      await taper(s.page, 203);
      assert.equal(await texte(s.page, "#answer-feedback"), "Bravo !");
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : jamais bloqué au boulier — au 3e geste refusé, les perles brillent ; l'élève refait le geste`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await appel(s.page, "montrer", "A10", 2);
      await pause(s.page, 500);
      const consigne = await texte(s.page, ".perles-consigne");
      await perleSeule(s.page);
      await perleSeule(s.page);
      assert.deepEqual(await appel(s.page, "montre"), {montre: false, brillent: 0}, "2 refus : rien ne brille encore");
      await photo(s.page, `${f}-perles-avant`);
      const boulier = await place(s.page, ".perles-cadre");
      await perleSeule(s.page);
      const montre = await attendreQue(s.page, async () => { const m = await appel(s.page, "montre"); return m.montre ? m : null; }) || {montre: false};
      assert.ok(memePlace(await place(s.page, ".perles-cadre"), boulier), "le boulier ne bouge pas quand les perles brillent");
      assert.equal(montre.montre, true);
      assert.ok(montre.brillent >= 1, "les perles à pousser brillent");
      assert.equal(await texte(s.page, ".perles-consigne"), "Pousse les perles qui brillent.");
      await photo(s.page, `${f}-perles-montre`);
      // L'élève refait le geste (au clavier : la rangée, la dernière perle qui brille).
      await s.page.focus(".perles-interieur");
      for (let i = 1; i < montre.brillent; i += 1) await s.page.keyboard.press("ArrowRight");
      await s.page.keyboard.press("Enter");
      await pause(s.page, 400);
      assert.deepEqual(await appel(s.page, "montre"), {montre: false, brillent: 0}, "le geste fait éteint la lumière");
      assert.equal((await appel(s.page, "perles")).etape, 1, "le geste est pris");
      assert.equal(await texte(s.page, ".perles-consigne"), consigne, "la consigne revient");
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : jamais bloqué — glisse-nombres (M2-1), jetons (D4-1), bandes (F2-1)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      await appel(s.page, "montrer", "M2", 1);
      await pause(s.page, 500);
      const tableau = await place(s.page, ".place-value-tool");
      for (let i = 0; i < 3; i += 1) {
        await s.page.focus(".place-value-drag-bar");
        await s.page.keyboard.press("ArrowRight");
        await s.page.keyboard.press("Enter");
        await pause(s.page, 1900);
      }
      await s.page.evaluate(() => document.activeElement.blur());
      assert.deepEqual(await appel(s.page, "montre"), {montre: true, brillent: 2}, "le chiffre des unités et sa colonne brillent");
      assert.ok(memePlace(await place(s.page, ".place-value-tool"), tableau), "le tableau ne bouge pas");
      assert.equal(await texte(s.page, ".glisse-consigne"), "Glisse vers la colonne qui brille.");
      await photo(s.page, `${f}-glisse-montre`);
      await s.page.click("[data-place-value-source]");
      await s.page.click(".place-value-head.dc-montre");
      await pause(s.page, 500);
      assert.equal((await appel(s.page, "glisse")).fini, true, "le geste refait est pris");
      assert.equal((await appel(s.page, "montre")).brillent, 0);

      await appel(s.page, "montrer", "D4", 1);
      await pause(s.page, 500);
      const jetons = await place(s.page, ".dc-jetons-tableau, .dc-reserve");
      for (let i = 0; i < 3; i += 1) { await s.page.click(".dc-jetons-col >> nth=0"); await pause(s.page, 1900); }
      assert.deepEqual(await appel(s.page, "montre"), {montre: true, brillent: 1}, "le jeton à toucher brille");
      assert.ok(memePlace(await place(s.page, ".dc-jetons-tableau, .dc-reserve"), jetons), "les jetons ne bougent pas");
      await photo(s.page, `${f}-jetons-montre`);
      await s.page.click(".dc-pion-reserve.dc-montre");
      await pause(s.page, 400);
      assert.equal((await appel(s.page, "jetons")).etape, 1);
      assert.equal((await appel(s.page, "montre")).montre, false);

      await appel(s.page, "montrer", "F2", 1);
      await pause(s.page, 500);
      const bandes = await place(s.page, ".dc-bandes-scene");
      for (let i = 0; i < 3; i += 1) {
        const b = await s.page.$eval(".dc-bandes-scene", e => { const r = e.getBoundingClientRect(); return {x: r.right - 6, y: r.top + 6}; });
        await s.page.mouse.click(b.x, b.y);
        await pause(s.page, 1900);
      }
      assert.deepEqual(await appel(s.page, "montre"), {montre: true, brillent: 1}, "la bande à poser brille");
      assert.ok(memePlace(await place(s.page, ".dc-bandes-scene"), bandes), "les bandes ne bougent pas");
      await photo(s.page, `${f}-bandes-montre`);
      await s.page.click(".dc-bande-reserve[data-reserve='4']");
      await pause(s.page, 400);
      assert.equal((await appel(s.page, "bandes")).etape, 1);
      assert.equal((await appel(s.page, "montre")).montre, false);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : le test s'arrête au palier en cours (A2 : 3 marches) ; les bases finies, A2-4 et A2-5 ont leur test`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursAvant(c => c.module === "A2" && c.niveau === 1)});
      await s.page.click("#acc-carte .go");
      await pause(s.page, 800);
      assert.equal(await appel(s.page, "genre"), "test");
      const marches = await s.page.evaluate(() => document.querySelectorAll("#escalier .marche").length);
      assert.equal(marches, 3, "trois marches : les bases seulement");
      for (let i = 0; i < 20; i += 1) {
        const c = await appel(s.page, "calcul");
        if (!c || (await appel(s.page, "genre")) !== "test") break;
        await taper(s.page, c.reponse);
        await pause(s.page, 1600);
      }
      await pause(s.page, 600);
      assert.equal(await texte(s.page, "#result-title"), "Niveaux 1 à 3 : déjà sus !");
      assert.match(await texte(s.page, "#result-suite"), /plus tard/);
      await photo(s.page, `${f}-palier-bilan`);
      await tient(s.page, largeur, hauteur);
      await s.ctx.close();

      // Les bases finies : A2-4 vient, par un test (marches 4 et 5).
      const r = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursAvant(c => P.palierDe(CARTE, c.module, c.niveau) > 1, ["2026-11-10", null, null, null])});
      await r.page.click("#acc-carte .go");
      await pause(r.page, 800);
      assert.equal(await appel(r.page, "genre"), "test");
      assert.deepEqual(await r.page.evaluate(() => [...document.querySelectorAll("#escalier .marche b")].map(b => b.textContent)), ["4", "5"]);
      for (let i = 0; i < 20; i += 1) {
        const c = await appel(r.page, "calcul");
        if (!c || (await appel(r.page, "genre")) !== "test") break;
        await taper(r.page, c.reponse);
        await pause(r.page, 1600);
      }
      await pause(r.page, 600);
      assert.equal(await texte(r.page, "#result-title"), "Niveaux 4 et 5 : déjà sus !");
      assert.match(await texte(r.page, "#result-score"), /Tu connais déjà/);
      await photo(r.page, `${f}-palier-reprise`);
      assert.deepEqual([...s.erreurs, ...r.erreurs], []);
      await r.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
