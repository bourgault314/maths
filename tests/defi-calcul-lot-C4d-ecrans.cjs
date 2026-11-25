// Défi calcul, lot C4d « le CM2 et la 6e » (25/11/2026, choix de Gwenaël
// par questions, planches 1 à 6) : la VRAIE page, au navigateur, élève
// connecté (faux serveur de suivi), aux 5 formats.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-C4d-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-C4d-ecrans.cjs
// Safari : NAVIGATEUR=webkit node tests/defi-calcul-lot-C4d-ecrans.cjs
//
//   dessins   « Avec le dessin » : les fractions du CM2 et de la 6e (les
//             flèches de 8/21 + 3/7, les blocs de 2 × 6/5, 27/9 et des
//             nombres mixtes, 4 × 5/8 inchangé), le tableau de 5,107 = 5 +
//             □/10 + …, la bande cassée de 5,6 − 1,19, les doubles et
//             moitiés comptés en dixièmes, en centièmes, 10 + 10 en deux
//             barres ; le cadre tient ;
//   lecons    On te montre de « Fractions égales : diviser » (les flèches
//             ÷ 6) et de « Moitiés : dixièmes » (le tableau) ; J'écris de
//             « Entre eux » (3 lignes, « × ? »), « En décimal » (finit par
//             7/2 = □), « Avec une retenue » (7 + 6), « Au-delà de 20 » (les
//             flèches) ; À retenir de « Moitiés : dixièmes » ;
//   exemple   l'exemple résolu de « on casse un dixième » (son annonce, sa
//             phrase).

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

const espacesT = t => String(t).replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();
const dessinVu = page => page.evaluate(() => { const s = document.querySelector("#aide > svg"); return s && !document.getElementById("aide").hidden ? {classe: s.getAttribute("class") || "", aria: s.getAttribute("aria-label") || "", textes: [...s.querySelectorAll("text")].map(t => t.textContent.trim())} : null; });
const annonceVue = page => page.evaluate(() => { const a = document.querySelector("#annonce"); return a && !a.hidden ? a.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim() : ""; });
const carteTient = page => page.evaluate(() => { const c = document.getElementById("question-card"); return c.scrollHeight - c.clientHeight; });
const lignesTexte = page => page.evaluate(() => [...document.querySelectorAll("#expression .lg > span")].map(l => l.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim()));

const DESSINS = [
  // [module, niveau, calcul, classe du dessin, début de la description, ce qui doit être écrit, ce qui ne doit pas l'être]
  ["F9", 3, "8/21 + 3/7 = □/21", "", "3 septièmes égale combien de vingt et unièmes : fois 3 en haut et en bas.", ["× 3"], ["9", "17"]],
  ["F9", 3, "(3 + 1/2) + (2 + 1/4) = 5 + □/4", "dc-fractions", "Schéma en barres posé sur la droite graduée. Graduations : 0, 1, 2, 3, 4, 5, 6. Les premières unités sont des blocs pleins : 4 quarts chacune.", ["4"], []],
  ["F11", 1, "2 × 6/5 = □/5", "dc-fractions", "Schéma en barres posé sur la droite graduée. Graduations : 0, 1, 2, 3. La première unité est un bloc plein : 5 cinquièmes.", ["5"], ["12"]],
  ["F11", 1, "4 × 5/8 = □/8", "dc-fractions", "Schéma en barres posé sur la droite graduée. Graduations : 0, 1, 2, 3. Des parts sont en bleu.", [], ["20"]],
  ["F11", 2, "27/9 = □", "dc-fractions", "Schéma en barres posé sur la droite graduée. Graduations : 0, 1, 2, ?. Les premières unités sont des blocs pleins : 9 neuvièmes chacune.", ["9"], ["3"]],
  ["D1", 3, "5,107 = 5 + □/10 + 7/1 000", "dc-numeration", "Tableau de numération. 5 : 5 aux unités ; + combien de dixièmes : à écrire ;", ["?"], []],
  ["D7", 3, "5,6 − 1,19 = □", "dc-carre-op", "Un carré de 100", [], []],
  ["D8", 2, "double de 13,6 = □", "dc-rang", "Tableau, en dixièmes. 13,6 : 136 dixièmes. + 13,6 : 136 dixièmes. Les dixièmes à trouver.", ["136", "?"], ["272", "27,2"]],
  ["D8", 3, "moitié de 13,6 = □", "dc-rang", "Tableau, en dixièmes. 13,6 : 136 dixièmes. ÷ 2. Les dixièmes à trouver.", ["136", "?"], ["68", "6,8"]],
  ["D8", 4, "2 × 4,35 = □", "dc-rang", "Tableau, en centièmes. 4,35 : 435 centièmes. × 2. Les centièmes à trouver.", ["435"], ["870", "8,7"]],
  ["D8", 5, "moitié de 8,10 = □", "dc-rang", "Tableau, en centièmes. 8,10 : 810 centièmes. ÷ 2. Les centièmes à trouver.", ["810"], ["405", "4,05"]],
  ["A1", 2, "10 + 10 = □", "", "Deux barres de la même longueur : un nombre à trouver en haut ; dessous, 10 et 10.", ["10", "?"], ["20"]],
];

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
      for (const [id, n, calcul, classe, aria, ecrits, interdits] of DESSINS) {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        assert.ok(await appel(s.page, "poser", id, n, calcul, "image"), `${id}-${n} ${calcul} posé`);
        await pause(s.page, 600);
        const vu = await dessinVu(s.page);
        assert.ok(vu, `${calcul} : un dessin`);
        assert.ok(vu.classe.includes(classe), `${calcul} : le dessin (${vu.classe})`);
        assert.ok(espacesT(vu.aria).startsWith(espacesT(aria)), `${calcul} : « ${vu.aria} »`);
        const textes = vu.textes.map(espacesT);
        ecrits.forEach(t => assert.ok(textes.includes(t), `${calcul} : « ${t} » écrit (${textes.join(" | ")})`));
        interdits.forEach(t => assert.ok(!textes.includes(t), `${calcul} : « ${t} » ne doit pas être écrit`));
        if (id === "D7") {
          assert.match(vu.aria, /Une bande est cassée en 10 petits carrés/);
          assert.equal(await s.page.evaluate(() => document.querySelectorAll("#aide svg rect[stroke-dasharray]").length), 1, "la bande cassée entourée");
        }
        if (id === "D8") assert.ok((await lignesTexte(s.page))[0].replace(/\s/g, "").match(/^\d+[+×÷]/), `${calcul} : la première ligne compte dans le rang`);
        await tient(s.page, largeur, hauteur);
        if (largeur > 620) assert.ok(await carteTient(s.page) <= 1, `${calcul} : le cadre ne déborde pas`);
        await photo(s.page, `${f}-dessin-${id}-${n}-${calcul.replace(/[^0-9]+/g, "_")}`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
    });

    await cas(`${f} : les leçons changées — fractions égales, moitiés, entre eux, en décimal, retenue, au-delà de 20`, async () => {
      for (const [id, n, attendu] of [["F6", 3, /18 vingt-quatrièmes égale combien de quarts : divisé par 6 en haut et en bas/], ["D8", 3, /Tableau, en dixièmes\. 13,6 : 136 dixièmes/]]) {
        const s = await ouvrir(nav, base, {largeur, hauteur});
        assert.ok(await appel(s.page, "montrer", id, n));
        await pause(s.page, 600);
        assert.match(espacesT((await dessinVu(s.page)).aria), attendu, `${id}-${n} : On te montre`);
        await tient(s.page, largeur, hauteur);
        await photo(s.page, `${f}-montre-${id}-${n}`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
      const s = await ouvrir(nav, base, {largeur, hauteur});
      for (const [id, n, ligne, nombre] of [["M3", 3, "3 × 8 =", 3], ["F1", 2, "1/2 =", 3], ["D4", 3, "7 + 6 =", 2], ["F9", 3, "5/6 =", 2]]) {
        assert.ok(await appel(s.page, "ecrire", id, n, "lecon"));
        await pause(s.page, 500);
        await tient(s.page, largeur, hauteur);
        const etapes = await appel(s.page, "ecrisEnCours");
        assert.ok(espacesT(etapes[0].texte).replace(/\s/g, "").startsWith(ligne.replace(/\s/g, "")), `${id}-${n} : la première ligne « ${etapes[0].texte} »`);
        assert.equal(etapes.length, nombre, `${id}-${n} : ${nombre} lignes`);
        if (id === "M3") assert.ok((await dessinVu(s.page)).textes.map(espacesT).includes("× ?"), "M3-3 : la flèche dit « × ? »");
        if (id === "F9") assert.match((await dessinVu(s.page)).aria, /fois 4 en haut et en bas/);
        await photo(s.page, `${f}-ecris-${id}-${n}`);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
      const t = await ouvrir(nav, base, {largeur, hauteur});
      assert.ok(await appel(t.page, "retenir", "D8", 3));
      await pause(t.page, 500);
      assert.match(espacesT(await texte(t.page, "#result")), /Je compte en dixièmes\./, "D8-3 : À retenir");
      await tient(t.page, largeur, hauteur);
      await photo(t.page, `${f}-retenir-D8-3`);
      assert.deepEqual(t.erreurs, []);
      await t.ctx.close();
    });

    await cas(`${f} : l'exemple résolu de « on casse un dixième »`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      const ex = await appel(s.page, "aToi", "D7", 3, "5,6 − 1,19 = □");
      assert.ok(ex && ex.texte, "un exemple");
      assert.match(espacesT(ex.methode), /^Pas assez de centièmes : je casse un dixième\./);
      await pause(s.page, 500);
      assert.equal(await annonceVue(s.page), "Nouveau : pas assez de centièmes : je casse un dixième.");
      await tient(s.page, largeur, hauteur);
      await photo(s.page, `${f}-exemple-D7-3`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
