// Défi calcul, lot 7b « Les décimaux (2) » (15/11/2026) : la VRAIE page,
// au navigateur, élève connecté (faux serveur de suivi), aux 5 formats
// (390 × 664, 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-7b-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-7b-ecrans.cjs
//
//   montrer   « On te montre » des 8 niveaux : D8, « Je représente » à
//             étapes sur le schéma (les deux morceaux, puis le tout) ; D9, le
//             glisse-nombres avec la virgule (au 3e refus, la colonne
//             brille, l'élève refait le geste) ; M13, la barre coupée en
//             deux, puis encore — la réponse n'est jamais sur le dessin ;
//   dessin    « Avec le dessin » : la réponse n'est pas écrite ;
//   écrire    J'écris de la leçon : « Valider » se voit, rien ne bouge
//             pendant la frappe, le dessin reste à sa place ;
//   retenir   À retenir (et la carte de D8-1) tient dans le cadre à
//             l'ordinateur ;
//   annonce   la moitié annoncée avec son dessin (D8-2), 8,10 et 0,10 ;
//   parcours  Mon parcours d'un élève au CM2.

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
const FORMATS = [[390, 664], [390, 844], [1366, 657], [1366, 768], [1920, 1080]];
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".webp": "image/webp"};


// Lot K1 « la carte » (25/11/2026) : Mon parcours et le test de module sont
// partis. Leurs cas deviennent : la carte d'un élève arrivé à l'étage, où
// les étoiles du lot sont là (leur nom, lu par le lecteur d'écran), et le
// cadre tient. La progression est jouée par le vrai moteur (version 12).
const P12K1 = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const CARTE_K1 = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js")).carte();
function parcoursJusqua(etage, jour = "2026-11-25") {
  const six = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
  let p = P12K1.creerParcours();
  for (let e = 1; e < etage; e += 1) {
    const dedans = P12K1.carteEleve(p, CARTE_K1, {aujourdhui: jour}).etages.find(x => x.etage === e).lignes.flatMap(l => l.etoiles.map(x => x.cle));
    for (const k of CARTE_K1.ordre.filter(c => dedans.includes(c))) {
      const [m, n] = k.split("-");
      const r = P12K1.appliquerTentative(p, {module: m, niveau: Number(n), reponses: six}, {aujourdhui: P12K1.ajouterJours(jour, -40), carte: CARTE_K1});
      if (!r.refuse) p = r.parcours;
    }
  }
  return p;
}
const etoilesSurLaCarte = page => page.evaluate(() => [...document.querySelectorAll("#carte-lignes .ck-case")].map(b => (b.getAttribute("aria-label") || "").replace(/[\u00a0\u202f]/g, " ")));

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
  const brut = {version: P.VERSION, modules: {}, ceintures, jours: ["2026-11-12", "2026-11-13"], seances: ["2026-11-12", "2026-11-13"]};
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



// (Lot C2 : D8 en cinq niveaux, les doubles puis les moitiés.)
const NIVEAUX = [["D8", 1], ["D8", 2], ["D8", 3], ["D8", 4], ["D8", 5], ["D9", 1], ["D9", 2], ["M13", 1], ["M13", 2], ["M13", 3]];
const boite = (page, sel) => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);
const textesDessin = page => page.evaluate(() => [...document.querySelectorAll("#aide svg text")].map(t => t.textContent.replace(/[\u202f\u00a0]/g, " ").trim()));
// Taper une suite d'étapes : rien ne bouge pendant la frappe ; le dessin reste à sa place.
async function etapes(page, liste, cle) {
  for (const [k, etape] of liste.entries()) {
    const expression = await boite(page, "#expression");
    const dessinAvant = await boite(page, "#aide > svg");
    for (const c of CORE.formaterNombre(etape.reponse)) {
      if (!c.trim() || c === "\u202f") continue;
      await page.click(`#play [data-key="${c}"]`);
      assert.ok(memePlace(await boite(page, "#expression"), expression), `${cle} : rien ne bouge pendant la frappe`);
    }
    await page.click("#validate");
    await pause(page, 600);
    if (dessinAvant && k < liste.length - 1) assert.ok(memePlace((await boite(page, "#aide > svg")).slice(0, 3), dessinAvant.slice(0, 3)), `${cle} : le dessin ne bouge pas`);
  }
}
async function attendreQue(page, lire, essais = 40) {
  for (let i = 0; i < essais; i += 1) { const v = await lire(); if (v) return v; await pause(page, 100); }
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
    await cas(`${f} : On te montre, Avec le dessin, J'écris et À retenir des 8 niveaux (D8, D9, M13)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of NIVEAUX) {
        const cle = `${id}-${n}`;
        const lecon = CORE.niveauDe(cle).niveau.apprends;
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 500);
        assert.match(await texte(s.page, "#seance-fil"), /On te montre$/, cle);
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-${cle}-montre`);
        if (id === "D9") {
          // Le glisse-nombres avec la virgule ; au 3e glissement refusé, la colonne brille, l'élève refait le geste.
          const tableau = await boite(s.page, ".place-value-tool");
          for (let i = 0; i < 3; i += 1) {
            await s.page.focus(".place-value-drag-bar");
            await s.page.keyboard.press("ArrowRight");
            await s.page.keyboard.press("Enter");
            await pause(s.page, 1900);
          }
          await s.page.evaluate(() => document.activeElement.blur());
          const montre = await attendreQue(s.page, async () => { const m = await appel(s.page, "montre"); return m && m.montre ? m : null; });
          assert.ok(montre && montre.brillent >= 1, `${cle} : au 3e refus, la colonne brille`);
          assert.ok(memePlace(await boite(s.page, ".place-value-tool"), tableau), `${cle} : le tableau ne bouge pas`);
          await s.page.click("[data-place-value-source]");
          await s.page.click(".place-value-head.dc-montre");
          await pause(s.page, 600);
          assert.equal((await appel(s.page, "glisse")).fini, true, `${cle} : le geste refait est pris`);
          assert.match(await texte(s.page, "#aide .dc-trace"), new RegExp(CORE.formaterNombre(lecon.manipule.depart * 10 ** lecon.manipule.decalage).replace(/[\u202f\u00a0]/g, " ").replace(",", "\\,")), `${cle} : la trace écrit × 10 (× 100)`);
        } else if (lecon.represente.etapes) {
          // D8 : « Je représente » à étapes (les deux morceaux, puis le tout).
          assert.equal(await appel(s.page, "dessin") !== null, true);
          await etapes(s.page, lecon.represente.etapes, cle);
          assert.match(await texte(s.page, "#answer-feedback"), /Bravo/, cle);
        } else {
          // M13 : le dessin, la réponse à écrire ; rien sur le dessin ne la dit.
          const r = CORE.formaterNombre(lecon.represente.reponse).replace(/[\u202f\u00a0]/g, " ");
          assert.ok(!(await textesDessin(s.page)).includes(r), `${cle} : la réponse n'est pas sur le dessin`);
          await etapes(s.page, [{reponse: lecon.represente.reponse}], cle);
          assert.match(await texte(s.page, "#answer-feedback"), /Bravo/, cle);
        }
        await photo(s.page, `${f}-${cle}-montre-fini`);
        await tient(s.page, largeur, hauteur);

        assert.equal(await appel(s.page, "nouveaute", id, n, "", "image"), true);
        await pause(s.page, 500);
        assert.match(await texte(s.page, "#seance-fil"), /Avec le dessin$/, cle);
        const calcul = await appel(s.page, "calcul");
        assert.ok(!(await textesDessin(s.page)).some(t => t === CORE.formaterNombre(calcul.reponse).replace(/[\u202f\u00a0]/g, " ") || t.endsWith(`= ${CORE.formaterNombre(calcul.reponse).replace(/[\u202f\u00a0]/g, " ")}`)), `${cle} : ${calcul.texte} — la réponse n'est pas sur le dessin`);
        await photo(s.page, `${f}-${cle}-dessin`);
        await tient(s.page, largeur, hauteur);

        await appel(s.page, "ecrire", id, n, "lecon");
        await pause(s.page, 500);
        // « Valider » se voit en entier.
        assert.ok(await s.page.evaluate(() => { const p = document.querySelector(".panel:not([hidden])").getBoundingClientRect(); const v = document.querySelector("#validate").getBoundingClientRect(); return v.bottom <= p.bottom + .5 && v.bottom <= innerHeight + .5; }), `${cle} : « Valider » se voit`);
        await etapes(s.page, await appel(s.page, "ecrisEnCours"), cle);
        await photo(s.page, `${f}-${cle}-ecris`);
        await tient(s.page, largeur, hauteur);

        await appel(s.page, "retenir", id, n, "");
        await pause(s.page, 400);
        await photo(s.page, `${f}-${cle}-retenir`);
        if (largeur > 620) await tient(s.page, largeur, hauteur);
        if (cle === "D8-1") {
          await appel(s.page, "retenir", id, n, "", true);
          await pause(s.page, 400);
          await photo(s.page, `${f}-${cle}-carte`);
          if (largeur > 620) await tient(s.page, largeur, hauteur);
          assert.match(await texte(s.page, "#result"), /Sous chaque nombre, sa moitié/);
        }
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    // (Lot C2 : la moitié a ses niveaux, D8-3 et D8-5 ; ce qui reste annoncé,
    // ce sont les centièmes de 8,10.)
    await cas(`${f} : 8,10 et ses centièmes, annoncés avec leur dessin (D8-5)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      assert.equal(await appel(s.page, "nouveaute", "D8", 5, "centièmes", "image"), true);
      await pause(s.page, 500);
      assert.match(await texte(s.page, "#annonce"), /Nouveau : 0,\d0, c’est \d+ centièmes : leur moitié, c’est \d+ centièmes\./);
      await photo(s.page, `${f}-D8-5-annonce`);
      await tient(s.page, largeur, hauteur);
      assert.equal(await appel(s.page, "poser", "D8", 5, "moitié de 8,10 = □", "image"), true);
      await pause(s.page, 500);
      // (Lot C4d : compté en centièmes — 8,10 = 810 centièmes, le tableau.)
      assert.deepEqual((await textesDessin(s.page)).filter(t => t.includes(",")).slice(0, 2), ["8,10"]);
      assert.ok((await textesDessin(s.page)).includes("810"), "810 centièmes");
      await photo(s.page, `${f}-D8-5-810`);
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : la carte (lot K1) — un élève au CM2 : les décimaux du lot 7b`, async () => {
      for (const [nom, etage, motifs] of [
        ["cm2", 3, [/^Doubles : dixièmes/, /^Décimal × 5/, /^÷ 4/]]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursJusqua(etage)});
        await s.page.click("#acc-porte");
        await pause(s.page, 800);
        assert.equal(await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.carte().courant), etage, `${nom} : l'étage ${etage}`);
        const vues = await etoilesSurLaCarte(s.page);
        motifs.forEach(m => assert.ok(vues.some(v => m.test(v)), `${nom} : ${m} sur la carte (${vues.length} étoiles)`));
        await photo(s.page, `${f}-carte-${nom}`);
        await tient(s.page, largeur, hauteur);
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
