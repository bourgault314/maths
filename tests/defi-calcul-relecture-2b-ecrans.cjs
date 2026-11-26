// Défi calcul, relecture 2b (11/11/2026) : l'affichage, au navigateur,
// élève connecté (un faux serveur de suivi répond).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   npm install --no-save playwright
//   node tests/defi-calcul-relecture-2b-ecrans.cjs
//
// Ce qui est vérifié :
//   case      les niveaux sans outil à manipuler, au téléphone (tous) et sur
//             ordinateur (un sur trois) :
//             taper la réponse ne fait pas bouger le calcul d'un pixel ;
//   bulle     « Bravo ! » : la bulle entoure son texte, au milieu de sa
//             place ; après un faux, « Suivant » prend toute la ligne ;
//   nouveau   M4-2 : la première division a son image (le rectangle de
//             points) même sans outil, et la bulle « Nouveau » est collée
//             au calcul au téléphone ;
//   tableau   plein écran 1 920 × 1 080 : le cadre remplit la hauteur, le
//             boulier fait plus de 600 px ; rien ne déborde ;
//   bande     M4-2 au téléphone : la bande de la table sur deux lignes ;
//             au petit iPhone, le rectangle de points de J'écris ne double
//             pas à la fin.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};
const CONSTRUITS = CORE.MODULES.filter(fiche => fiche.construit).flatMap(fiche => fiche.niveaux.map(n => `${fiche.id}-${n.n}`));

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const fichier = path.join(RACINE, decodeURIComponent(new URL(requete.url, "http://x").pathname));
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) { reponse.writeHead(404); reponse.end(); return; }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(resolve => serveur.listen(0, "127.0.0.1", () => resolve(serveur)));
}

async function ouvrir(navigateur, base, [largeur, hauteur], requete = "") {
  const contexte = await navigateur.newContext({viewport: {width: largeur, height: hauteur}, hasTouch: largeur < 700, timezoneId: "Indian/Reunion"});
  const page = await contexte.newPage();
  await page.clock.install({time: new Date("2026-11-05T10:00:00+04:00")});
  await page.addInitScript(() => { let s = 42; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; });
  const erreurs = [];
  page.on("pageerror", erreur => erreurs.push(`erreur de page : ${erreur.message}`));
  if (!requete.includes("prof=1")) await page.addInitScript(() => { try { window.sessionStorage.setItem("mathsgo-suivi-code", "7K3M9P"); } catch (_) {} });
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const rendre = donnees => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(donnees)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "4e B"});
    if (corps.lire) return rendre({ok: true, existe: false, revision: 0});
    return rendre({ok: true, revision: 1});
  });
  await page.goto(`${base}/outils/calcul_mental/defi_calcul_modules.html?test${requete}`);
  await page.waitForTimeout(600);
  return {page, contexte, erreurs};
}
const T = (page, quoi) => page.evaluate(q => window.__MATHSGO_DEFI_CALCUL_TEST__[q](), quoi);
const position = page => page.evaluate(() => {
  const morceau = document.createRange();
  morceau.selectNodeContents(document.getElementById("expression"));
  const b = morceau.getBoundingClientRect();
  return [+b.left.toFixed(2), +b.top.toFixed(2)];
});
async function taper(page, nombre) {
  for (const signe of CORE.formaterNombre(nombre).replace(/\s/g, "")) await page.keyboard.press(signe);
  await page.waitForTimeout(60);
}
async function entrainement(navigateur, base, taille, cle) {
  const [id, n] = cle.split("-");
  const o = await ouvrir(navigateur, base, taille, `&prof=1&module=${id}&niveau=${n}`);
  // (Lot K1 : l'adresse ouvre la carte sur le panneau de l'étoile.)
  await o.page.locator("#panneau-corps button", {hasText: "Je m’entraîne encore"}).first().click();
  await o.page.waitForTimeout(600);
  return o;
}

// Lot 7-0 : « Avec le dessin » à étapes — la case d'avant le résultat
// (l'arrivée du premier saut), quand il y en a une.
async function premiereCase(page) {
  const c = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.caseDuDessin());
  if (!c) return;
  await taper(page, c.reponse);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch();
  let echecs = 0;
  const essai = async (nom, corps) => {
    try { await corps(); console.log(`ok     ${nom}`); } catch (erreur) { echecs += 1; console.log(`ÉCHEC  ${nom}\n  ${String(erreur.message || erreur).split("\n").join("\n  ")}`); }
  };

  // Les niveaux sans outil à manipuler (le pavé est là dès le premier
  // calcul) : tous au téléphone, un sur trois sur ordinateur. Les autres,
  // outils joués, le sont par le robot de la relecture 2b (joue-tout.cjs).
  const SANS_GESTE = CONSTRUITS.filter(cle => CORE.genererSerie(cle, {graine: 1}).every(c => !CORE.manipulationDe(c)));
  for (const [taille, niveaux] of [[[390, 844], SANS_GESTE], [[1366, 768], SANS_GESTE.filter((_, i) => i % 3 === 0)]]) {
    await essai(`case ${taille.join("x")} : dans ${niveaux.length} niveaux, taper la réponse ne fait pas bouger le calcul`, async () => {
      const bouge = [];
      for (const cle of niveaux) {
        const {page, contexte, erreurs} = await entrainement(navigateur, base, taille, cle);
        const calcul = await T(page, "calcul");
        const avant = await position(page);
        await taper(page, calcul.reponse);
        const apres = await position(page);
        if (Math.abs(avant[0] - apres[0]) > .5 || Math.abs(avant[1] - apres[1]) > .5) bouge.push(`${cle} ${calcul.texte} : ${avant} → ${apres}`);
        assert.deepEqual(erreurs, [], cle);
        await contexte.close();
      }
      assert.deepEqual(bouge, []);
    });
  }

  await essai("bulle 390x844 : « Bravo ! » entoure son texte au milieu de sa place ; après un faux, « Suivant » sur toute la ligne", async () => {
    const {page, contexte, erreurs} = await entrainement(navigateur, base, [390, 844], "A4-4");
    const calcul = await T(page, "calcul");
    await premiereCase(page);
    await taper(page, calcul.reponse);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250);
    const m = await page.evaluate(() => {
      const place = document.querySelector(".answer-feedback").getBoundingClientRect();
      const bulle = document.getElementById("answer-feedback").getBoundingClientRect();
      return {place: [place.top, place.height], bulle: [bulle.top, bulle.height], texte: document.getElementById("answer-feedback").textContent};
    });
    assert.match(m.texte, /Bravo/);
    assert.ok(m.bulle[1] < m.place[1] - 4, `la bulle est plus basse que sa place (${JSON.stringify(m)})`);
    assert.ok(Math.abs((m.bulle[0] + m.bulle[1] / 2) - (m.place[0] + m.place[1] / 2)) <= 1.5, `centrée (${JSON.stringify(m)})`);
    await page.waitForTimeout(1500);
    const suivant = await T(page, "calcul");
    await premiereCase(page);
    await taper(page, suivant.reponse + 1);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    const l = await page.evaluate(() => [document.getElementById("validate").getBoundingClientRect().width, document.querySelector(".actions").getBoundingClientRect().width, document.getElementById("validate").textContent]);
    assert.equal(l[2], "Suivant");
    assert.ok(Math.abs(l[0] - l[1]) <= 1, `« Suivant » sur toute la ligne (${l})`);
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await essai("nouveau 390x844 : M4-2, la première division a son image, la bulle « Nouveau » collée au calcul", async () => {
    const {page, contexte, erreurs} = await entrainement(navigateur, base, [390, 844], "M4-2");
    let vu = null;
    for (let k = 0; k < 14 && !vu; k += 1) {
      const calcul = await T(page, "calcul");
      const annonce = await page.$eval("#annonce", a => (a.hidden ? "" : a.textContent));
      // (Le crochet de test rend l'outil du suivi ; l'image se lit dans la page.)
      const outil = await page.$eval("#aide", a => (!a.hidden && a.querySelector(":scope > svg") ? "image" : "aucun"));
      if (annonce && calcul.forme !== "produit") {
        vu = {annonce, outil, ecart: await page.evaluate(() => document.getElementById("expression").getBoundingClientRect().top - document.getElementById("annonce").getBoundingClientRect().bottom)};
        break;
      }
      await taper(page, calcul.reponse);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1600);
    }
    assert.ok(vu, "une écriture nouvelle arrive");
    assert.equal(vu.outil, "image", `l'image revient (${JSON.stringify(vu)})`);
    assert.ok(vu.ecart >= 0 && vu.ecart <= 12, `la bulle est collée au calcul (${vu.ecart} px)`);
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await essai("tableau 1920x1080 plein écran : le cadre remplit la hauteur, le boulier dépasse 600 px, rien ne déborde", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [1920, 1080]);
    await page.click("[data-fullscreen-toggle]");
    await page.waitForTimeout(400);
    await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre("A5", 1));
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => {
      const carte = document.getElementById("question-card");
      return {panel: document.querySelector(".panel").getBoundingClientRect().bottom, boulier: document.querySelector(".perles-interieur").getBoundingClientRect().width,
        deborde: carte.scrollHeight - carte.clientHeight, defile: document.documentElement.scrollHeight - window.innerHeight};
    });
    assert.ok(m.panel > 1040, `le cadre descend jusqu'en bas (${m.panel})`);
    assert.ok(m.boulier > 600, `le boulier (${m.boulier} px)`);
    assert.ok(m.deborde <= 0 && m.defile <= 0, JSON.stringify(m));
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  await essai("bande : M4-2 au téléphone sur deux lignes ; au petit iPhone, le rectangle de J'écris ne double pas à la fin", async () => {
    const a = await ouvrir(navigateur, base, [390, 844]);
    await a.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre("M4", 2));
    await a.page.waitForTimeout(500);
    const h = await a.page.evaluate(() => { const s = document.querySelector("#aide > svg"); return [s.getAttribute("viewBox"), s.getBoundingClientRect().height]; });
    assert.equal(h[0], "0 0 560 284", "deux lignes");
    assert.ok(h[1] >= 150, `la bande est haute (${h[1]} px)`);
    await a.contexte.close();
    const b = await ouvrir(navigateur, base, [390, 664]);
    await b.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre("M4", 2));
    await b.page.waitForTimeout(500);
    const ap = CORE.niveauDe("M4-2").niveau.apprends;
    for (const c of CORE.formaterNombre(ap.represente.reponse)) await b.page.click(`#play [data-key="${c}"]`);
    await b.page.click("#validate");
    await b.page.waitForSelector("#question-card.ecrit", {timeout: 8000});
    const hauteur = () => b.page.evaluate(() => Math.round(document.querySelector("#aide > svg").getBoundingClientRect().height));
    const pendant = await hauteur();
    for (const etape of ap.ecris.etapes) {
      for (const c of CORE.formaterNombre(etape.reponse)) await b.page.click(`#play [data-key="${c}"]`);
      await b.page.click("#validate");
      await b.page.waitForTimeout(350);
    }
    await b.page.waitForTimeout(400);
    const fin = await hauteur();
    assert.ok(Math.abs(fin - pendant) <= 2, `le rectangle garde sa taille (${pendant} → ${fin})`);
    assert.deepEqual([...a.erreurs, ...b.erreurs], []);
    await b.contexte.close();
  });

  await navigateur.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s).`); process.exit(1); }
  console.log("Défi calcul, relecture 2b : conforme au navigateur.");
})().catch(erreur => { console.error(erreur); process.exit(1); });
