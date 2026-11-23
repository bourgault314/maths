// Défi calcul, lot C3 « les exemples résolus, les leçons qui montent »
// (22/11/2026, planche validée par Gwenaël) : la VRAIE page, au navigateur,
// élève connecté (faux serveur de suivi), aux 5 formats (390 × 664,
// 390 × 844, 1366 × 657, 1366 × 768, 1920 × 1080).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-C3-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-C3-ecrans.cjs
// Safari : NAVIGATEUR=webkit node tests/defi-calcul-lot-C3-ecrans.cjs
//
//   exemples  une écriture jamais montrée, dans 12 niveaux (nombres,
//             fractions, décimaux, égalités, parenthèses, la phrase la plus
//             longue) : l'écran « Un exemple » (la réponse en vert, le
//             dessin, la phrase de méthode, « À toi → » ; le pavé et « Je ne
//             sais pas » gardent leur place, invisibles ; rien n'est noté),
//             puis « À toi » (« À toi : … », le même cadre, la même échelle) ;
//   serie     une vraie série jouée : un exemple par écriture, jamais deux
//             de suite, rien ne compte ;
//   jour      Mes calculs du jour : l'exemple au premier retour d'une
//             compétence entrée par le test, pas après J'apprends ; « À
//             toi » compte (c'est le retour) ;
//   lecons    les leçons changées (On te montre, À retenir).

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


// Les écritures montrées en exemple (le calcul « À toi » donné par son texte).
const CAS = [
  ["M1", 1, "double de □ = 18"],
  ["A3", 1, "571 − 30 = □"],
  ["F8", 1, "9/10 − 4/10 = □/10"],
  ["F9", 3, "(1 + 1/2) + (2 + 1/4) = 3 + □/4"],
  ["D4", 1, "3,28 − 0,1 = □"],
  ["D8", 5, "moitié de 8,10 = □"],
  ["C3", 1, "4 469 − □ = 4 369"],
  ["C3", 1, "□ − 30 = 4 469"],
  ["C1", 1, "35 − (17 − 9) = □"],
  ["M11", 1, "23 = □ × 4 + 3"],
  ["C4", 1, "15 + (□ ÷ 6) = 22"],
  // (La phrase la plus longue : quatre sauts jusqu'à un millier.)
  ["A2", 5, "2 000 − 1 853 = □"],
  // (Correctif : les « À toi » qui débordaient à 1366 × 657 et 1366 × 768 —
  // un dessin à étapes sous la pastille ; Code : « moitié de 8,10 » sous
  // Windows, « 3,28 − 0,1 » dans WebKit.)
  ["A3", 2, "532 − 60 = □"],
  // (C4a : les nombres en 5 vont dans « Compléments à 100 » ; ici, le tableau
  // des dizaines à étape.)
  ["A2", 2, "100 − 30 = □"],
  ["A2", 3, "100 − 55 = □"],
  // (Un « À toi » sans dessin après un exemple qui en a un : la place du
  // dessin reste, le pavé ne monte pas.)
  ["M10", 1, "2 × 197 × 5 = 197 × □"]
];
const LECONS = [["M1", 1], ["M1", 3], ["M8", 2], ["F6", 1], ["C4", 2], ["F11", 2]];
const reponses = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.entrainement() ? window.__MATHSGO_DEFI_CALCUL_TEST__.entrainement().joues : null);
const echelle = page => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--echelle").trim());
const visibilite = (page, sel) => page.evaluate(q => getComputedStyle(document.querySelector(q)).visibility, sel);

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  // (NAVIGATEUR=webkit : la passe Safari.)
  const nav = process.env.NAVIGATEUR === "webkit" ? await playwright.webkit.launch() : await playwright.chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echecs = 0;
  const cas = async (nom, fn) => {
    try { await fn(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  for (const [largeur, hauteur] of FORMATS) {
    const f = `${largeur}x${hauteur}`;
    await cas(`${f} : l'exemple résolu, puis « À toi », dans ${CAS.length} niveaux`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n, aToi] of CAS) {
        const cle = `${id}-${n}`;
        const pose = await appel(s.page, "aToi", id, n, aToi);
        assert.ok(pose && pose.texte, `${cle} ${aToi} : un exemple`);
        await pause(s.page, 500);
        const ex = await appel(s.page, "exempleAffiche");
        assert.equal(ex.exemple, true, cle);
        assert.equal(ex.compte, "Un exemple", cle);
        assert.equal(ex.bouton.replace(/[\u00a0]/g, " "), "À toi →", cle);
        assert.match(ex.annonce, /^Nouveau/, cle);
        assert.equal(ex.reponses, 1, `${cle} : l'exemple n'est pas noté`);
        assert.equal(await s.page.evaluate(() => document.getElementById("answer-feedback").className), "dc-bulle dc-methode", cle);
        // (Une fraction s'écrit en deux étages : on compare les phrases sans fraction.)
        if (!pose.methode.includes("/")) assert.equal((await texte(s.page, "#answer-feedback")).replace(/\s/g, " "), pose.methode.replace(/[\u00a0\u202f\s]/g, " "), cle);
        else assert.ok((await texte(s.page, "#answer-feedback")).length > 20, cle);
        // (Téléphone bas, ou petit écran d'ordinateur qui débordait à
        // l'échelle la plus petite : le pavé laisse sa place.)
        const bas = (largeur <= 620 && hauteur < 760) || await s.page.evaluate(() => document.getElementById("question-card").classList.contains("sans-pave"));
        if (bas) assert.equal(await s.page.evaluate(() => getComputedStyle(document.querySelector("#play .keypad")).display), "none", `${cle} : téléphone bas, le pavé laisse sa place au dessin`);
        else assert.equal(await visibilite(s.page, "#play .keypad"), "hidden", `${cle} : le pavé, invisible`);
        // Le dessin se lit (56 px de haut au moins, comme au téléphone), dans
        // l'exemple comme dans « À toi » (plus bas).
        assert.ok(await s.page.evaluate(() => document.querySelector("#aide > svg").getBoundingClientRect().height >= 56), `${cle} : le dessin se lit`);
        assert.equal(await visibilite(s.page, "#skip"), "hidden", `${cle} : « Je ne sais pas », invisible`);
        assert.ok(await s.page.evaluate(() => !document.getElementById("aide").hidden && Boolean(document.querySelector("#aide > svg"))), `${cle} : le dessin révélé`);
        assert.ok(await s.page.evaluate(() => [...document.querySelectorAll("#expression .inline-answer")].every(c => c.classList.contains("is-correct"))), `${cle} : la réponse en vert`);
        const bouton = await boite(s.page, "#validate");
        const z = await echelle(s.page);
        await photo(s.page, `${f}-${cle}-${CAS.findIndex(c => c[2] === aToi)}-1-exemple`);
        await tient(s.page, largeur, hauteur);
        // Rien ne déborde du cadre — l'exemple jamais plus que « À toi »,
        // « À toi » jamais plus que le même calcul sans exemple (plus bas).
        const debordeExemple = await s.page.evaluate(() => { const c = document.getElementById("question-card"); return c.scrollHeight - c.clientHeight; });
        await s.page.click("#validate");
        await pause(s.page, 500);
        await photo(s.page, `${f}-${cle}-${CAS.findIndex(c => c[2] === aToi)}-2-a-toi`);
        const suite = await appel(s.page, "exempleAffiche");
        assert.equal(suite.exemple, false, cle);
        assert.equal(suite.aToi, true, cle);
        assert.equal(suite.texte.replace(/[\u00a0\u202f]/g, " "), aToi, cle);
        assert.match(suite.annonce, /^À toi/, cle);
        assert.equal(suite.annonce.replace(/^À toi/, ""), ex.annonce.replace(/^Nouveau/, ""), `${cle} : la même annonce`);
        assert.equal(suite.reponses, 1, `${cle} : toujours rien de noté`);
        assert.equal(await visibilite(s.page, "#play .keypad"), "visible", cle);
        assert.ok(await s.page.evaluate(() => { const g = document.querySelector("#aide > svg"); return !g || document.getElementById("aide").hidden || g.getBoundingClientRect().height >= 55.5; }), `${cle} : le dessin de « À toi » se lit`);
        const debordeAToi = await s.page.evaluate(() => { const c = document.getElementById("question-card"); return c.scrollHeight - c.clientHeight; });
        assert.ok(debordeExemple <= Math.max(1, debordeAToi), `${cle} : l'exemple déborde (${debordeExemple} px, « À toi » ${debordeAToi} px)`);
        // Le bouton ne bouge pas entre l'exemple et « À toi » (au téléphone
        // comme à l'ordinateur, même quand le pavé a laissé sa place).
        { const b2 = await boite(s.page, "#validate"); assert.ok(Math.abs(b2[1] - bouton[1]) <= 3 + Math.max(0, debordeAToi) && Math.abs(b2[3] - bouton[3]) <= 1, `${cle} : le bouton à la même hauteur (${bouton.map(Math.round)} → ${b2.map(Math.round)})`); }
        if (largeur > 620) assert.equal(await echelle(s.page), z, `${cle} : la même échelle`);
        await tient(s.page, largeur, hauteur);
        // « À toi » tient dans le cadre (à la plus petite échelle, c'est le
        // dessin qui rapetisse, jamais le calcul ni le pavé) — ou, au pire,
        // ne déborde pas plus que le même calcul posé sans son exemple.
        if (largeur > 620) {
          assert.equal(await appel(s.page, "poser", id, n, aToi), true, `${cle} : posé sans exemple`);
          await pause(s.page, 500);
          const sansExemple = await s.page.evaluate(() => { const c = document.getElementById("question-card"); return c.scrollHeight - c.clientHeight; });
          assert.ok(debordeAToi <= Math.max(1, sansExemple + 1), `${cle} : « À toi » déborde de ${debordeAToi} px (sans l'exemple : ${sansExemple} px)`);
          if (sansExemple > 1) console.log(`note    ${f} ${cle} : déborde déjà sans l'exemple (${sansExemple} px)`);
        }
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : une vraie série — un exemple par écriture, jamais deux de suite, rien ne compte`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      // « Égalités à trou simples », repris sans aide (J'écris déjà fait) :
      // quatre écritures que la leçon ne montre pas.
      await appel(s.page, "reprendre", "C3", 1, 2);
      await pause(s.page, 400);
      const vus = [];
      let avant = false;
      for (let i = 0; i < 24; i += 1) {
        const e = await appel(s.page, "exempleAffiche");
        if (!e || await appel(s.page, "genre") !== "apprends") break;
        if (e.exemple) {
          assert.ok(!avant, "jamais deux exemples de suite");
          const calcul = await appel(s.page, "calcul");
          const forme = await s.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul().forme);
          assert.ok(!vus.includes(forme), `un exemple par écriture : ${calcul.texte}`);
          vus.push(forme);
          const joues = e.reponses;
          await s.page.click("#validate");
          await pause(s.page, 400);
          assert.equal((await appel(s.page, "exempleAffiche")).reponses, joues, "l'exemple ne compte pas");
          avant = true;
          continue;
        }
        avant = false;
        const calcul = await appel(s.page, "calcul");
        if (await appel(s.page, "caseDuDessin")) break;
        await taper(s.page, calcul.reponse);
        await pause(s.page, 1500);
        if (await s.page.evaluate(() => !document.getElementById("play").hidden && document.getElementById("validate").style.visibility !== "hidden" && /Suivant/.test(document.getElementById("validate").textContent))) {
          await s.page.click("#validate");
          await pause(s.page, 400);
        }
        if (await s.page.evaluate(() => document.getElementById("play").hidden)) break;
      }
      assert.ok(vus.length >= 3, `au moins trois écritures montrées (${vus.join(", ")})`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : Mes calculs du jour — l'exemple au premier retour après le test, pas après J'apprends`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      const test = await appel(s.page, "jour", "C3", 1, "4 469 − □ = 4 369", "test");
      assert.deepEqual(test, {exemple: true, sansLecon: true});
      await pause(s.page, 400);
      const ex = await appel(s.page, "exempleAffiche");
      assert.equal(ex.compte, "Un exemple");
      assert.match(ex.annonce, /^Nouveau/);
      await tient(s.page, largeur, hauteur);
      await photo(s.page, `${f}-jour-1-exemple`);
      await s.page.click("#validate");
      await pause(s.page, 400);
      const suite = await appel(s.page, "exempleAffiche");
      assert.equal(suite.aToi, true);
      assert.match(suite.annonce, /^À toi/);
      assert.equal(suite.reponses, 0);
      await photo(s.page, `${f}-jour-2-a-toi`);
      await taper(s.page, 100);
      // « À toi » est le retour du jour : il compte (la compétence monte).
      const p = await appel(s.page, "parcours");
      assert.equal(p.modules.C3.b[0], 4, "le retour est noté");
      await tient(s.page, largeur, hauteur);
      const apprends = await appel(s.page, "jour", "C3", 1, "4 469 − □ = 4 369", "apprends");
      assert.deepEqual(apprends, {exemple: false, sansLecon: false});
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });

    await cas(`${f} : les leçons changées — On te montre, À retenir`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n] of LECONS) {
        const cle = `${id}-${n}`;
        await appel(s.page, "montrer", id, n);
        await pause(s.page, 500);
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-lecon-${cle}-montre`);
        await appel(s.page, "retenir", id, n, "");
        await pause(s.page, 400);
        if (largeur > 620) await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-lecon-${cle}-retenir`);
      }
      assert.match(await texte(s.page, "#result"), /La fraction, c’est une division : 6\/3 = 6 ÷ 3 = 2|6 ÷ 3/);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
