// Défi calcul, lot C4c « le CM1 » (25/11/2026, choix de Gwenaël par
// questions, planches 1 à 6) : la VRAIE page, au navigateur, élève connecté
// (faux serveur de suivi), aux 5 formats.
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   node tests/defi-calcul-lot-C4c-ecrans.cjs
// Captures : SORTIE=<dossier> node tests/defi-calcul-lot-C4c-ecrans.cjs
// Safari : NAVIGATEUR=webkit node tests/defi-calcul-lot-C4c-ecrans.cjs
//
//   dessins   « Avec le dessin » : les fractions au-delà de 12 parts (les
//             blocs « 5/5 », les flèches des seizièmes, 7/9 + 7/9 inchangé),
//             le nombre manquant de « Regrouper 2 et 5 » (sans la réponse),
//             l'écart pile sur le nombre rond (le tableau, 2 + □ = 10,
//             l'annonce) ; le cadre tient ;
//   lecons    « × 1 000, trous, divisions » : On te montre (le glisse-nombres
//             à 3 colonnes), J'écris (470 × 1 000), À retenir ; J'écris de
//             « Dixième, centième » (0,1 = 1/□ d'abord), d'« Entier et
//             reste » (les blocs), À retenir de « Compléter jusqu'à… » ;
//   exemple   l'exemple résolu d'une division ÷ 1 000 : une division ÷ 1 000.

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
  // [module, niveau, calcul, classe du dessin, début de la description, ce qui doit être écrit, ce qui ne doit pas l'être, annonce]
  ["F5", 1, "17/5 = 3 + □/5", "dc-fractions", "Schéma en barres posé sur la droite graduée. Graduations : 0, 1, 2, 3, 4. Les premières unités sont des blocs pleins : 5 cinquièmes chacune.", ["5"], [], null],
  ["F5", 2, "4 + 1/4 = □/4", "dc-fractions", "Schéma en barres posé sur la droite graduée. Graduations : 0, 1, 2, 3, 4, 5. Les premières unités sont des blocs pleins", ["4"], ["17"], null],
  ["F8", 3, "8/5 + 6/5 = □/5", "dc-fractions", "Schéma en barres posé sur la droite graduée. Graduations : 0, 1, 2, 3. La première unité est un bloc plein : 5 cinquièmes.", [], ["14"], null],
  ["F8", 3, "7/9 + 7/9 = □/9", "dc-fractions", "Schéma en barres posé sur la droite graduée. Graduations : 0, 1, 2. Des parts sont en bleu.", [], ["14"], null],
  ["F9", 2, "7/8 − 3/16 = □/16", "", "7 huitièmes égale combien de seizièmes : fois 2 en haut et en bas.", [], ["14"], null],
  ["M10", 1, "22 × 5 = □ × 10", "dc-escalier", "22 × 5 = un nombre à trouver × 2 × 5 : 22, c’est ce nombre × 2.", ["?", "22", "2 × 5 = 10"], ["11", "110"], null],
  ["M10", 1, "2 × 199 × 5 = 199 × □", "dc-escalier", "2 × 199 × 5 : 2 × 5 = un nombre à trouver", ["2 × 5 = ?"], ["10", "1 990"], null],
  ["A8", 2, "4 000 − 3 992 = □", "dc-rang", "Tableau, en unités. 3 992 : 3 milliers, 9 centaines, 9 dizaines, 2 unités. + ? : les unités à trouver.", [], ["8"], "Nouveau : j’arrive pile sur le nombre rond : je complète les unités à 10."],
  ["A8", 2, "4 000 − □ = 3 999", "dc-rang", "Tableau, en unités. 3 999 :", [], [], null]
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
      for (const [id, n, calcul, classe, aria, ecrits, interdits, annonce] of DESSINS) {
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
        if (annonce !== null) assert.equal(await annonceVue(s.page), annonce, `${calcul} : l'annonce`);
        if (id === "A8") assert.ok((await lignesTexte(s.page))[0].replace(/\s/g, "").startsWith(`${calcul.includes("3 992") ? 2 : 9}+`), `${calcul} : la première ligne`);
        await tient(s.page, largeur, hauteur);
        if (largeur > 620) assert.ok(await carteTient(s.page) <= 1, `${calcul} : le cadre ne déborde pas`);
        await photo(s.page, `${f}-dessin-${id}-${n}-${calcul.replace(/[^0-9]+/g, "_")}`);
        assert.deepEqual(s.erreurs, []);
        await s.ctx.close();
      }
    });

    await cas(`${f} : les leçons changées — × 1 000, Dixième, Entier et reste, Compléter`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      assert.ok(await appel(s.page, "montrer", "M2", 2));
      await pause(s.page, 600);
      const montre = espacesT(await texte(s.page, "#play"));
      assert.match(montre, /250 × 1 000/, "On te montre : 250 × 1 000");
      assert.match(montre, /Chaque chiffre vaut 1 000 fois plus\./);
      assert.deepEqual(await appel(s.page, "glisse"), {decalage: 0, fini: false});
      await tient(s.page, largeur, hauteur);
      await photo(s.page, `${f}-montre-M2-2`);
      for (const [id, n, consigne, ligne] of [["M2", 2, null, "470 × 1 000 ="], ["F1", 1, null, "0,1 ="], ["F5", 1, null, "3 ="]]) {
        assert.ok(await appel(s.page, "ecrire", id, n, "lecon"));
        await pause(s.page, 500);
        await tient(s.page, largeur, hauteur);
        if (consigne) assert.equal(espacesT(await texte(s.page, "#aide .consigne")).replace(/\s/g, ""), consigne.replace(/\s/g, ""), `${id}-${n} : la consigne`);
        assert.ok(espacesT(await texte(s.page, "#expression")).replace(/\s/g, "").startsWith(ligne.replace(/\s/g, "")), `${id}-${n} : la première ligne « ${await texte(s.page, "#expression")} »`);
        if (id === "F5") assert.match((await dessinVu(s.page)).aria, /Les premières unités sont des blocs pleins : 6 sixièmes chacune\./);
        await photo(s.page, `${f}-ecris-${id}-${n}`);
      }
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
      for (const [id, n, phrase] of [["M2", 2, /Quand je multiplie par 1 000, chaque chiffre prend une valeur 1 000 fois plus grande/], ["A2", 5, /puis jusqu’au nombre à atteindre/]]) {
        const t = await ouvrir(nav, base, {largeur, hauteur});
        assert.ok(await appel(t.page, "retenir", id, n));
        await pause(t.page, 500);
        assert.match(espacesT(await texte(t.page, "#result")), phrase, `${id}-${n} : À retenir`);
        await tient(t.page, largeur, hauteur);
        await photo(t.page, `${f}-retenir-${id}-${n}`);
        assert.deepEqual(t.erreurs, []);
        await t.ctx.close();
      }
    });

    await cas(`${f} : l'exemple résolu d'une division ÷ 1 000 est une division ÷ 1 000`, async () => {
      const s = await ouvrir(nav, base, {largeur, hauteur});
      const ex = await appel(s.page, "aToi", "M2", 2, "675 000 ÷ 1 000 = □");
      assert.ok(ex && ex.texte, "un exemple");
      assert.match(espacesT(ex.texte), /÷ 1 000 = □$/, ex.texte);
      assert.match(espacesT(ex.methode), /^÷ 1 000 : chaque chiffre glisse de 3 colonnes vers la droite/);
      await pause(s.page, 500);
      await tient(s.page, largeur, hauteur);
      await photo(s.page, `${f}-exemple-M2-2`);
      assert.deepEqual(s.erreurs, []);
      await s.ctx.close();
    });
  }

  await nav.close();
  serveur.close();
  console.log(echecs ? `${echecs} échec(s)` : "tout est conforme");
  process.exit(echecs ? 1 : 0);
})();
