// Défi calcul, modules lot 2 recalé sur « relier » (01/11/2026) : les écrans
// au navigateur, élève connecté (un faux serveur de suivi répond, le bandeau
// « Suivi » est affiché).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   npm install --no-save playwright
//   node tests/defi-calcul-modules-lot-2-ecrans.cjs
//
// Ce qui est vérifié :
//   retenir   « À retenir » des 55 niveaux construits (44 avant les modules lot 3) tient entier dans
//             l'écran, sans défiler : 390 × 664 (la hauteur visible d'un
//             iPhone), 390 × 844, 1366 × 768 (vu par Code sur la PR #1083 :
//             57 px pour M1-3, 112 px pour D2-1 à 390 × 664) ;
//   virgule   D2-1 au téléphone, J'écris fini juste : la touche « , »
//             s'efface avec le pavé (elle restait grisée sous « Bravo ! ») ;
//   relier    J'écris des 5 modules du lot 2 : le dessin au-dessus des
//             étapes, qui se remplit à chaque égalité juste, sans défiler.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const CORE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js"));
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};
const SEULEMENT = process.env.DEFI_CALCUL_SEULEMENT || "";

function servir() {
  const serveur = http.createServer((requete, reponse) => {
    const chemin = decodeURIComponent(new URL(requete.url, "http://x").pathname);
    const fichier = path.join(RACINE, chemin);
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier) || fs.statSync(fichier).isDirectory()) {
      reponse.writeHead(404);
      reponse.end();
      return;
    }
    reponse.writeHead(200, {"Content-Type": TYPES[path.extname(fichier)] || "application/octet-stream"});
    fs.createReadStream(fichier).pipe(reponse);
  });
  return new Promise(resolve => serveur.listen(0, "127.0.0.1", () => resolve(serveur)));
}

async function ouvrir(navigateur, base, [largeur, hauteur]) {
  const contexte = await navigateur.newContext({viewport: {width: largeur, height: hauteur}, hasTouch: largeur < 700, timezoneId: "Indian/Reunion"});
  const page = await contexte.newPage();
  await page.clock.install({time: new Date("2026-10-12T10:00:00+04:00")});
  const erreurs = [];
  page.on("console", message => { if (message.type() === "error") erreurs.push(message.text()); });
  page.on("pageerror", erreur => erreurs.push(`erreur de page : ${erreur.message}`));
  await page.addInitScript(() => { try { window.sessionStorage.setItem("mathsgo-suivi-code", "7K3M9P"); } catch (_) {} });
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const rendre = donnees => route.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(donnees)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre({ok: true, prenom: "Léa", classe: "4e B"});
    if (corps.lire) return rendre({ok: true, existe: false, revision: 0});
    return rendre({ok: true, revision: 1});
  });
  await page.goto(`${base}/outils/calcul_mental/defi_calcul_modules.html?test`);
  await page.waitForTimeout(600);
  assert.ok(await page.isVisible("#suivi-repere"), "le bandeau de suivi est affiché");
  return {page, contexte, erreurs};
}

const defile = page => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

async function taper(page, nombre) {
  for (const signe of CORE.formaterNombre(nombre).replace(/\s/g, "")) await page.click(`#play [data-key="${signe}"]`);
}

// J'apprends jusqu'à J'écris : le boulier (ou le glisse-nombres) est sauté
// par « Suivant » une fois fini ; Je représente reçoit la bonne réponse.
async function jusquaEcris(page, cle) {
  const [id, n] = cle.split("-");
  await page.evaluate(([i, k]) => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre(i, k), [id, Number(n)]);
  await page.waitForTimeout(300);
  const apprends = CORE.niveauDe(cle).niveau.apprends;
  // Les niveaux choisis n'ont pas de boulier : le geste se teste dans
  // defi-calcul-ecrans.cjs.
  if (apprends.manipule) return false;
  // Lot 7-0 : « Je représente » à étapes sur la droite à plusieurs sauts (la
  // première case, puis le résultat ; l'écran reste, puis « Suivant »).
  if (apprends.represente.etapes) {
    for (const etape of apprends.represente.etapes) { await taper(page, etape.reponse); await page.click("#validate"); await page.waitForTimeout(300); }
    await page.click("#validate");
    await page.waitForFunction(() => /J’écris/.test(document.getElementById("seance-fil").textContent), null, {timeout: 8000});
  } else {
    await taper(page, apprends.represente.reponse);
    await page.click("#validate");
  }
  await page.waitForSelector("#question-card.ecrit", {timeout: 8000});
  await page.waitForTimeout(300);
  return true;
}

(async () => {
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  const NIVEAUX = CORE.MODULES.filter(fiche => fiche.construit).flatMap(fiche => fiche.niveaux.map(niveau => `${fiche.id}-${niveau.n}`));
  assert.equal(NIVEAUX.length, 95); // lot « couverture » : A2-5 en plus, A8-3 et F5-3 réunis
  let echecs = 0;
  const essai = async (nom, corps) => {
    if (SEULEMENT && !nom.startsWith(SEULEMENT)) return;
    try { await corps(); console.log(`ok      ${nom}`); } catch (e) { echecs += 1; console.log(`ÉCHEC   ${nom} : ${e.message}`); }
  };

  for (const taille of [[390, 664], [390, 844], [1366, 768]]) {
    await essai(`retenir ${taille.join("x")} : les 95 « À retenir » tiennent sans défiler`, async () => {
      const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille);
      const trop = [];
      for (const cle of NIVEAUX) {
        const [id, n] = cle.split("-");
        assert.equal(await page.evaluate(([i, k]) => window.__MATHSGO_DEFI_CALCUL_TEST__.retenir(i, k), [id, Number(n)]), true, cle);
        await page.waitForTimeout(60);
        assert.ok(await page.isVisible("#result-retenir"), `${cle} : À retenir est affiché`);
        const d = await defile(page);
        if (d > 1) trop.push(`${cle} (${d} px)`);
        // La phrase reste lisible : jamais sous 15 px.
        const taillePolice = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById("retenir-phrase")).fontSize));
        // Lot 2 : une seule exception, A1-2 au plus petit téléphone (390 × 664) —
        // la table d'addition, la règle et la deuxième façon de voir ; à
        // reprendre au lot 3 « Les leçons ».
        // Lot 3a : M1-2 aussi (sa carte a tous les doubles que l'appli
        // demande) ; les deux sont à reprendre au lot 3b (À retenir des
        // niveaux « par cœur »).
        const minimum = ["A1-2", "M1-2"].includes(cle) && taille[1] < 700 ? 12 : 15;
        assert.ok(taillePolice >= minimum, `${cle} : la phrase fait ${taillePolice} px`);
      }
      assert.deepEqual(trop, [], `l'écran défile : ${trop.join(", ")}`);
      assert.deepEqual(erreurs, []);
      await contexte.close();
    });
  }

  await essai("virgule 390x664 : J'écris de D2-1 fini juste, la touche « , » s'efface avec le pavé", async () => {
    const {page, contexte, erreurs} = await ouvrir(navigateur, base, [390, 664]);
    await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.apprendre("D2", 1));
    await page.waitForTimeout(300);
    // Le glisse-nombres : au clavier, puis « Suivant ».
    const m = CORE.niveauDe("D2-1").niveau.apprends.manipule;
    await page.focus(".place-value-drag-bar");
    for (let i = 0; i < Math.abs(m.decalage); i += 1) await page.keyboard.press(m.decalage > 0 ? "ArrowLeft" : "ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    await page.click("#validate");
    await page.waitForTimeout(400);
    const apprends = CORE.niveauDe("D2-1").niveau.apprends;
    await taper(page, apprends.represente.reponse);
    await page.click("#validate");
    await page.waitForSelector("#question-card.ecrit", {timeout: 8000});
    assert.ok(await page.isVisible("#touches"), "pendant J'écris, la touche « , » est là");
    for (const etape of apprends.ecris.etapes) {
      await taper(page, etape.reponse);
      await page.click("#validate");
      await page.waitForTimeout(350);
    }
    assert.ok(await page.isVisible("#question-card.ecrit-fini"), "J'écris est fini");
    assert.equal(await page.isVisible(".keypad"), false, "le pavé s'efface");
    assert.equal(await page.isVisible("#touches"), false, "la touche « , » s'efface avec lui");
    assert.deepEqual(erreurs, []);
    await contexte.close();
  });

  for (const taille of [[390, 664], [1366, 768]]) {
    await essai(`relier ${taille.join("x")} : J'écris des modules A2, A3, A4, A6, A7, A8 remplit son dessin`, async () => {
      const {page, contexte, erreurs} = await ouvrir(navigateur, base, taille);
      // Un niveau sans boulier par module (J'écris s'atteint par Je représente).
      // (Lot « couverture » : A8-3 est réuni dans A8-2 ; A2-5, la droite à trois sauts.)
      for (const cle of ["A3-2", "A4-3", "A6-4", "A7-3", "A8-2", "A2-5"]) {
        assert.equal(await jusquaEcris(page, cle), true, cle);
        const etapes = CORE.niveauDe(cle).niveau.apprends.ecris.etapes;
        const lus = [await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.dessin())];
        assert.ok(lus[0], `${cle} : le dessin est là avant la 1re étape`);
        // Au-dessus des étapes.
        const ordre = await page.evaluate(() => document.querySelector("#aide > svg").getBoundingClientRect().bottom <= document.getElementById("expression").getBoundingClientRect().top + 1);
        assert.ok(ordre, `${cle} : le dessin est au-dessus des étapes`);
        for (const etape of etapes) {
          await taper(page, etape.reponse);
          await page.click("#validate");
          await page.waitForTimeout(300);
          lus.push(await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.dessin()));
          assert.ok(await defile(page) <= 1, `${cle} : l'écran défile`);
        }
        for (let k = 1; k < lus.length - 1; k += 1) assert.notEqual(lus[k], lus[k - 1], `${cle} : l'étape ${k} ajoute son morceau`);
        await page.waitForTimeout(1600);
      }
      assert.deepEqual(erreurs, []);
      await contexte.close();
    });
  }

  await navigateur.close();
  serveur.close();
  if (echecs) { console.log(`${echecs} échec(s)`); process.exit(1); }
})().catch(erreur => { console.error(erreur); process.exit(1); });
