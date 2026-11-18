// Défi calcul, lot 7d « Les derniers modules » (18/11/2026) : la VRAIE page, au
// navigateur, élève connecté (faux serveur de suivi), aux 5 formats
// (390 × 664, 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-7d-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-7d-ecrans.cjs
//
//   montrer   « On te montre » des 8 niveaux : le dessin, la réponse à
//             écrire (jamais sur le dessin), « Valider » se voit ;
//   écrire    J'écris de la leçon : rien ne bouge pendant la frappe, le
//             dessin reste à sa place ;
//   retenir   À retenir tient dans le cadre à l'ordinateur, sans défiler ;
//   poser     le reste nul, le nombre de parts (la barre pas coupée), quatre
//             nombres, chaque schéma de « Remonter un calcul », × 19, × 98 ;
//   parcours  Mon parcours d'un élève au CM1, au CM2 et en 6e : plus de
//             « Bientôt », la liste commence sur une ligne entière (0 px).

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
const JOUR = "2026-11-18";
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



const NIVEAUX = [["M11", 1], ["M11", 2], ["A9", 1], ["A9", 2], ["C4", 1], ["C4", 2], ["M9", 1], ["M9", 2]];
const boite = (page, sel) => page.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);
const textesDessin = page => page.evaluate(() => [...document.querySelectorAll("#aide svg text")].map(t => t.textContent.replace(/[\u202f\u00a0]/g, " ").trim()));
const sp = t => String(t).replace(/[\u202f\u00a0]/g, " ");
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
const valideSeVoit = page => page.evaluate(() => { const p = document.querySelector(".panel:not([hidden])").getBoundingClientRect(); const v = document.querySelector("#validate").getBoundingClientRect(); return v.bottom <= p.bottom + .5 && v.bottom <= innerHeight + .5; });
// Mon parcours : l'écart entre le haut de la liste et le haut de sa première
// ligne visible (0 px : la liste commence sur une ligne entière).
const ecartListe = page => page.evaluate(() => {
  const liste = document.querySelector("#parcours-modules");
  if (!liste) return null;
  const haut = liste.getBoundingClientRect().top;
  const ligne = [...liste.children].find(l => l.getBoundingClientRect().bottom > haut + 1);
  return ligne ? Math.round(ligne.getBoundingClientRect().top - haut) : null;
});

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
    await cas(`${f} : On te montre, J'écris et À retenir des 8 niveaux (M11, A9, C4, M9)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of NIVEAUX) {
        const cle = `${id}-${n}`;
        const lecon = CORE.niveauDe(cle).niveau.apprends;
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 500);
        assert.match(await texte(s.page, "#seance-fil"), /On te montre$/, cle);
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-${cle}-montre`);
        const r = sp(CORE.formaterNombre(lecon.represente.reponse));
        assert.ok(!(await textesDessin(s.page)).some(t => t === r || t.endsWith(`= ${r}`)), `${cle} : la réponse n'est pas sur le dessin`);
        assert.ok(await valideSeVoit(s.page), `${cle} : « Valider » se voit`);
        await etapes(s.page, [{reponse: lecon.represente.reponse}], cle);
        assert.match(await texte(s.page, "#answer-feedback"), /Bravo/, cle);
        await tient(s.page, largeur, hauteur);

        await appel(s.page, "ecrire", id, n, "lecon");
        await pause(s.page, 500);
        assert.ok(await valideSeVoit(s.page), `${cle} : « Valider » se voit (J'écris)`);
        await photo(s.page, `${f}-${cle}-ecris`);
        await etapes(s.page, await appel(s.page, "ecrisEnCours"), cle);
        await photo(s.page, `${f}-${cle}-ecris-fini`);
        await tient(s.page, largeur, hauteur);

        await appel(s.page, "retenir", id, n, "");
        await pause(s.page, 400);
        await photo(s.page, `${f}-${cle}-retenir`);
        if (largeur > 620) await tient(s.page, largeur, hauteur);
        assert.equal(await s.page.evaluate(() => { const r = document.querySelector("#result"); return r.scrollHeight <= r.clientHeight + 1; }), true, `${cle} : À retenir ne défile pas`);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : Avec le dessin — reste nul, nombre de parts, quatre nombres, les schémas de C4, × 19, × 98`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      const poses = [["M11", 1, "20 = 4 × 5 + □", "reste-nul"], ["M11", 2, "51 = □ × 8 + 3", "parts"], ["A9", 1, "18 + 25 + 82 + 35 = □", "quatre"], ["A9", 2, "1,8 + 4,5 + 0,5 + 0,2 = □", "quatre-dec"],
        ["C4", 1, "3 × (2 + □) = 27", "fois-par"], ["C4", 1, "18 = 10 + (□ ÷ 5)", "plus-div"], ["C4", 2, "(4 × □) − 3 = 23", "decimal"], ["M9", 1, "6 × 19 = □", "x19"], ["M9", 2, "12 × 98 = □", "x98"]];
      for (const [id, n, t, nom] of poses) {
        assert.ok(await appel(s.page, "poser", id, n, t.replace(/□/g, CORE.CASE), "image"), `${t} : posé`);
        await pause(s.page, 500);
        const calcul = await appel(s.page, "calcul");
        const r = sp(CORE.formaterNombre(calcul.reponse));
        assert.ok(!(await textesDessin(s.page)).some(x => x === r || x.endsWith(`= ${r}`)), `${t} : la réponse n'est pas sur le dessin`);
        if (nom === "parts") assert.ok((await textesDessin(s.page)).includes("des parts de 8"), `${t} : la barre n'est pas coupée`);
        assert.ok(await valideSeVoit(s.page), `${t} : « Valider » se voit`);
        await photo(s.page, `${f}-pose-${nom}`);
        await tient(s.page, largeur, hauteur);
        await etapes(s.page, [{reponse: calcul.reponse}], t);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : Mon parcours au CM1 (M11), au CM2 (A9, C4) et en 6e (M9) — plus de « Bientôt », la liste commence sur une ligne entière`, async () => {
      for (const [arret, ceintures, nom, palier, module] of [
        [c => c.module === "M11" && c.niveau === 1, ["2026-11-01", null, null, null], "cm1", /Palier 2/, /Quotient et reste/],
        [c => c.module === "A9" && c.niveau === 1, ["2026-11-01", "2026-11-05", null, null], "cm2", /Palier 3/, /Regrouper pour calculer/],
        [c => c.module === "M9" && c.niveau === 1, ["2026-11-01", "2026-11-05", "2026-11-10", null], "6e", /Palier 4/, /Distributivité/]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur, parcours: parcoursAvant(arret, ceintures)});
        await s.page.click("#acc-porte");
        await pause(s.page, 800);
        const t = await texte(s.page, "#acc-parcours");
        assert.match(t, palier, nom);
        assert.match(t, module, nom);
        assert.doesNotMatch(await texte(s.page, "#ecran-parcours"), /Bientôt/i, `${nom} : plus de « Bientôt »`);
        const ecart = await ecartListe(s.page);
        assert.ok(ecart !== null && Math.abs(ecart) <= 1, `${nom} : la liste commence sur une ligne entière (${ecart} px)`);
        await photo(s.page, `${f}-mon-parcours-${nom}`);
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
