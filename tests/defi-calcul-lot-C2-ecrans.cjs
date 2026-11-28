// Défi calcul, lot C2 « doubles et moitiés, l'ordre des bases » (21/11/2026) :
// la VRAIE page, au navigateur, élève connecté (faux serveur de suivi), aux
// 5 formats (390 × 664, 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-C2-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-C2-ecrans.cjs
//
//   lecons    les 11 niveaux touchés (M1 en six niveaux, D8 en cinq, F3-3
//             au CM2) : « On te montre » à étapes jusqu'au bout, J'écris
//             (un calcul tiré), À retenir, et la carte des niveaux « par
//             cœur » ; rien ne bouge pendant la frappe, « Valider » se voit,
//             le cadre tient entier à l'ordinateur ;
//   parcours  Mon parcours d'un élève aux bases : « Doubles et moitiés »,
//             les bases à 44 compétences ; le cadre tient.

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
const boiteDessin = page => page.evaluate(() => { const b = document.querySelector("#aide > svg").getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)].join(","); });
// La place d'un élément (rien ne doit bouger quand l'outil montre le geste).
// (Lot 7a, constat de Code sur la PR #1213 : sous Safari, la bande descend
// de 0,04 px quand elle brille, et l'arrondi au pixel faisait échouer la
// comparaison ; on compare à 1 px près, invisible à l'œil.)
const place = (page, sel) => page.evaluate(q => { const b = document.querySelector(q).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }, sel);
const memePlace = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= 1);
const lignes = page => page.evaluate(() => [...document.querySelectorAll("#expression .lg > span")].map(l => ({classe: l.className, texte: l.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim()})));
const dessin = page => appel(page, "dessin");



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

const NIVEAUX = [["M1", 1], ["M1", 2], ["M1", 3], ["M1", 4], ["M1", 5], ["M1", 6], ["D8", 2], ["D8", 3], ["D8", 4], ["D8", 5], ["F3", 3]];
const PAR_COEUR = {"M1-1": /Sous chaque nombre, son double/, "M1-2": /Sous chaque nombre, sa moitié/, "M1-5": /Sous chaque nombre, son double/, "M1-6": /Sous chaque nombre, sa moitié/};

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
    await cas(`${f} : On te montre, J'écris, À retenir et la carte des 11 niveaux (M1, D8, F3-3)`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of NIVEAUX) {
        const cle = `${id}-${n}`;
        const lecon = CORE.niveauDe(cle).niveau.apprends;
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 500);
        assert.match(await texte(s.page, "#seance-fil"), /On te montre$/, cle);
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-${cle}-montre`);
        if (lecon.represente.etapes && !lecon.manipule) {
          // Le schéma en barres à étapes : chaque morceau, puis le tout.
          await etapes(s.page, lecon.represente.etapes, cle);
          assert.match(await texte(s.page, "#answer-feedback"), /Bravo/, cle);
          await photo(s.page, `${f}-${cle}-montre-fini`);
          await tient(s.page, largeur, hauteur);
        }
        await appel(s.page, "ecrire", id, n, 7);
        await pause(s.page, 500);
        assert.ok(await s.page.evaluate(() => { const p = document.querySelector(".panel:not([hidden])").getBoundingClientRect(); const v = document.querySelector("#validate").getBoundingClientRect(); return v.bottom <= p.bottom + .5 && v.bottom <= innerHeight + .5; }), `${cle} : « Valider » se voit`);
        const ecris = await appel(s.page, "ecrisEnCours");
        // Une moitié s'écrit sur une moitié, un double sur un double.
        const derniere = ecris[ecris.length - 1].texte.replace(/[\u202f\u00a0]/g, " ");
        if (id !== "F3") assert.equal(/moitié|÷ 2/.test(derniere), /moitié|÷ 2/.test(lecon.represente.texte.replace(/[\u202f\u00a0]/g, " ")), `${cle} : ${derniere}`);
        await etapes(s.page, ecris, cle);
        await photo(s.page, `${f}-${cle}-ecris`);
        await tient(s.page, largeur, hauteur);
        await appel(s.page, "retenir", id, n, "");
        await pause(s.page, 400);
        await photo(s.page, `${f}-${cle}-retenir`);
        if (largeur > 620) await tient(s.page, largeur, hauteur);
        if (PAR_COEUR[cle]) {
          await appel(s.page, "retenir", id, n, "", true);
          await pause(s.page, 400);
          await photo(s.page, `${f}-${cle}-carte`);
          if (largeur > 620) await tient(s.page, largeur, hauteur);
          assert.match(await texte(s.page, "#result"), PAR_COEUR[cle], cle);
        }
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    // (Lot K1 : Mon parcours remplacé par la carte — la ligne « Doubles et
    // moitiés » aux bases, la ceinture jaune à 44 étoiles.)
    await cas(`${f} : la carte d'un élève aux bases — la ligne « Doubles et moitiés », 44 étoiles`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      // (Lot « l'accueil, c'est la carte » : on arrive sur la carte.)
      await pause(s.page, 800);
      assert.match(await texte(s.page, "#carte-porteur"), /Ceinture jaune.*sur 44/);
      const lignes = await s.page.evaluate(() => [...document.querySelectorAll("#carte-lignes .ck-ligne h3")].map(h => h.firstChild.textContent.replace(/[\u00a0\u202f]/g, " ").trim()));
      assert.ok(lignes.includes("Doubles et moitiés"), lignes.join(" | "));
      await photo(s.page, `${f}-carte`);
      await tient(s.page, largeur, hauteur);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
