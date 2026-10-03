// Défi calcul, lot 1a : les écrans au navigateur (fiche technique § 9, point 6).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   npm install --no-save playwright
//   node tests/defi-calcul-ecrans.cjs
//   DEFI_CALCUL_CAPTURES=/chemin/du/dossier node tests/defi-calcul-ecrans.cjs   (dépose les captures)
//   CHROMIUM_EXECUTABLE_PATH=/chemin/chrome node tests/defi-calcul-ecrans.cjs   (un Chromium précis)
//
// Un faux serveur de suivi RÉPOND (la recette du lot 2b de Défi tables) : le
// bandeau « Suivi par ton professeur » est donc affiché, et c'est avec lui
// que le cadre doit tenir. Trois tailles : 1366 × 768 en fenêtre, 1440 × 900
// en plein écran, 390 × 844.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const CAPTURES = process.env.DEFI_CALCUL_CAPTURES || "";
const CODE = "7K3M9P";
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};

const TAILLES = [
  {nom: "1366x768", largeur: 1366, hauteur: 768},
  {nom: "1440x900-plein-ecran", largeur: 1440, hauteur: 900, plein: true},
  {nom: "390x844", largeur: 390, hauteur: 844, telephone: true}
];

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

// Une page ouverte sur l'appli. `suivi` : "repond" (le serveur connaît
// l'appli), "refuse" (400 « Application inconnue », l'état d'avant le lot 2),
// ou null (pas de code).
async function ouvrir(navigateur, base, taille, {suivi = "repond"} = {}) {
  const contexte = await navigateur.newContext({
    viewport: {width: taille.largeur, height: taille.hauteur}, deviceScaleFactor: 1, hasTouch: Boolean(taille.telephone)
  });
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("console", message => { if (message.type() === "error") erreurs.push(message.text()); });
  page.on("pageerror", erreur => erreurs.push(`erreur de page : ${erreur.message}`));
  await page.addInitScript(code => {
    if (code) { try { window.sessionStorage.setItem("mathsgo-suivi-code", code); } catch (_) {} }
    // Une horloge qu'on peut avancer : le temps d'un calcul se mesure avec
    // performance.now().
    window.__decalage = 0;
    const vrai = performance.now.bind(performance);
    performance.now = () => vrai() + window.__decalage;
  }, suivi ? CODE : "");
  const serveur = {revision: 0, parcours: null, envois: [], lectures: 0};
  await page.route("https://suivi.mathsgo.re/**", async route => {
    const corps = JSON.parse(route.request().postData() || "{}");
    const entetes = {"access-control-allow-origin": "*"};
    const rendre = (statut, donnees) => route.fulfill({status: statut, contentType: "application/json", headers: entetes, body: JSON.stringify(donnees)});
    if (route.request().url().endsWith("/api/eleve.php")) return rendre(200, {ok: true, prenom: "Léa", classe: "4e B"});
    if (suivi === "refuse") return rendre(400, {ok: false, erreur: "Application inconnue."});
    if (corps.lire) {
      serveur.lectures += 1;
      return rendre(200, serveur.parcours ? {ok: true, existe: true, parcours: serveur.parcours, revision: serveur.revision} : {ok: true, existe: false, revision: 0});
    }
    serveur.revision += 1;
    serveur.parcours = corps.parcours;
    serveur.envois.push(corps);
    return rendre(200, {ok: true, revision: serveur.revision});
  });
  await page.goto(base + PAGE);
  await page.waitForTimeout(500);
  if (taille.plein) {
    await page.click("[data-fullscreen-toggle]");
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.body.classList.contains("fullscreen-active")), true, "plein écran actif");
  }
  return {page, contexte, erreurs, serveur};
}

const calcul = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
const parcours = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours());
const perles = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.perles());
const texte = (page, selecteur) => page.evaluate(s => (document.querySelector(s)?.textContent || "").replace(/[  ]/g, " ").trim(), selecteur);
const avancerHorloge = (page, ms) => page.evaluate(d => { window.__decalage += d; }, ms);

async function taper(page, nombre, {clavier = false} = {}) {
  for (const chiffre of String(nombre)) {
    if (clavier) await page.keyboard.press(chiffre);
    else await page.click(`.keypad [data-key="${chiffre}"]`);
  }
}

async function valider(page, {clavier = false} = {}) {
  if (clavier) await page.keyboard.press("Enter");
  else await page.click("#validate");
}

// Glisse la perle `index` de la rangée `rangee` : vers la gauche (pousser)
// ou vers la droite (retirer). Le groupe entier suit, comme au doigt.
async function glisser(page, rangee, index, pousser) {
  const g = await page.evaluate(([r, i]) => {
    const perle = document.querySelectorAll(".perles-rangee")[r].querySelectorAll(".perle")[i].getBoundingClientRect();
    const cadre = document.querySelector(".perles-interieur").getBoundingClientRect();
    return {x: perle.left + perle.width / 2, y: perle.top + perle.height / 2, gauche: cadre.left, droite: cadre.right};
  }, [rangee, index]);
  await page.mouse.move(g.x, g.y);
  await page.mouse.down();
  const cible = pousser ? g.gauche - 20 : g.droite + 20;
  for (let pas = 1; pas <= 6; pas += 1) await page.mouse.move(g.x + (cible - g.x) * pas / 6, g.y);
  await page.mouse.up();
  await page.waitForTimeout(260);
}

// Ce qui doit être vrai sur chaque écran, et la capture.
async function controler(session, taille, nom, {jeu = false, pave = false, image = false, bandeau = true} = {}) {
  const {page, erreurs} = session;
  const m = await page.evaluate(() => {
    const boite = selecteur => {
      const element = document.querySelector(selecteur);
      if (!element || !element.checkVisibility()) return null;
      const r = element.getBoundingClientRect();
      return {haut: r.top, bas: r.bottom, gauche: r.left, droite: r.right};
    };
    const carte = document.getElementById("question-card");
    return {
      hauteur: window.innerHeight, largeur: window.innerWidth,
      largeurPage: document.documentElement.scrollWidth, defilement: window.scrollY,
      cadre: boite(".panel"), carte: carte ? [carte.scrollHeight, carte.clientHeight] : null,
      pave: boite(".keypad"), valider: boite("#validate"), aide: boite("#aide"), expression: boite("#expression"),
      boulier: boite(".perles-cadre"), scene: boite(".perles-scene"),
      repere: (document.getElementById("suivi-repere").textContent || "").trim(),
      repereVisible: !document.getElementById("suivi-repere").hidden,
      echelle: getComputedStyle(document.documentElement).getPropertyValue("--echelle")
    };
  });
  const ou = `${taille.nom} · ${nom}`;
  assert.deepEqual(erreurs, [], `${ou} : aucune erreur de console`);
  if (bandeau) {
    assert.equal(m.repereVisible, true, `${ou} : le bandeau de suivi est affiché`);
    assert.match(m.repere, /^Suivi par ton professeur · Léa · 4e B/, `${ou} : le bandeau`);
  }
  assert.ok(m.largeurPage <= m.largeur, `${ou} : aucun défilement horizontal (${m.largeurPage} > ${m.largeur})`);
  if (!taille.telephone) {
    // Sur ordinateur, le cadre blanc tient entier dans l'écran.
    assert.ok(m.cadre.bas <= m.hauteur + .5, `${ou} : le bas du cadre (${Math.round(m.cadre.bas)}) dépasse la fenêtre (${m.hauteur})`);
    assert.ok(m.cadre.haut >= 0, `${ou} : le haut du cadre est dans la fenêtre`);
  }
  if (jeu) {
    assert.ok(m.carte[0] <= m.carte[1] + 1, `${ou} : le cadre du jeu ne défile pas (${m.carte[0]} > ${m.carte[1]})`);
    assert.equal(m.defilement, 0, `${ou} : la page n'a pas défilé`);
    assert.ok(m.valider && m.valider.bas <= m.hauteur + .5 && m.valider.haut >= 0, `${ou} : le bouton du bas est visible sans faire défiler`);
  }
  if (pave) assert.ok(m.pave && m.pave.haut >= 0 && m.pave.bas <= m.hauteur, `${ou} : le pavé est visible sans faire défiler`);
  if (image) {
    assert.ok(m.aide, `${ou} : l'image est affichée`);
    // Téléphone : l'aide au-dessus du calcul. Ordinateur : entre le calcul et le pavé.
    if (taille.telephone) assert.ok(m.aide.bas <= m.expression.haut + 1, `${ou} : l'aide est au-dessus du calcul`);
    else assert.ok(m.aide.haut >= m.expression.bas - 1 && m.aide.bas <= m.pave.haut + 1, `${ou} : l'aide est entre le calcul et le pavé`);
  }
  if (m.boulier) {
    assert.ok(m.boulier.haut >= m.scene.haut - 1 && m.boulier.bas <= m.scene.bas + 1, `${ou} : le boulier tient dans sa place`);
    assert.ok(m.boulier.gauche >= 0 && m.boulier.droite <= m.largeur, `${ou} : le boulier tient dans la largeur`);
  }
  if (CAPTURES) await page.screenshot({path: path.join(CAPTURES, `${taille.nom}-${nom}.png`)});
  return m;
}

// Répond à toute une série ; `reponse(calcul, rang)` rend ce qu'on tape.
async function jouerSerie(page, total, reponse, {avant = null, clavier = false, attente = 60} = {}) {
  for (let rang = 0; rang < total; rang += 1) {
    const c = await calcul(page);
    if (avant) await avant(c, rang);
    await taper(page, reponse(c, rang), {clavier});
    await valider(page, {clavier});
    await page.waitForTimeout(attente);
  }
  await page.waitForTimeout(250);
}

// A5 niveau 1 de bout en bout, à une taille : les écrans du lot, contrôlés et capturés.
async function parcoursDesEcrans(navigateur, base, taille) {
  const session = await ouvrir(navigateur, base, taille);
  const {page} = session;
  const ecran = (nom, options) => controler(session, taille, nom, options);

  const accueil = await ecran("01-accueil");
  assert.equal(await texte(page, "#acc-module-titre"), "Compléments à 10, 100, 1 000");
  assert.equal(await texte(page, "#parcours-compte"), "0 module validé sur 42");
  assert.equal(await page.locator("#parcours-paliers button").count(), 4, "quatre pastilles de palier");
  assert.equal(await page.locator("#parcours-modules .dc-mod").count(), 10, "le palier 1 : dix modules");
  assert.equal(await page.locator("#parcours-modules .dc-mod.bientot:disabled").count(), 8, "huit modules « bientôt », fermés");
  assert.match(await texte(page, "#acc-carte"), /Ma séance du jour3 étapes · environ 10 min/);
  if (!taille.telephone) {
    // Deux colonnes : le parcours à droite de Mon module.
    const colonnes = await page.evaluate(() => [document.querySelector(".gauche").getBoundingClientRect().right, document.querySelector(".dc-parcours").getBoundingClientRect().left]);
    assert.ok(colonnes[0] <= colonnes[1], `${taille.nom} : deux colonnes`);
  }
  if (taille.plein) assert.ok(Number(accueil.echelle) > 1, "plein écran : le cadre est agrandi");

  // Le palier le plus chargé (14 modules) tient lui aussi.
  await page.click("#parcours-paliers button:nth-child(2)");
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#parcours-modules .dc-mod").count(), 14);
  await ecran("02-accueil-palier-2");
  await page.click("#parcours-paliers button:nth-child(1)");

  await page.click('.dc-mod[data-module="A5"]');
  await page.waitForTimeout(200);
  assert.equal(await texte(page, "#module-titre"), "Ajouter 9, 19, 29…");
  assert.deepEqual(await page.locator("#module-niveaux button strong").allTextContents(), ["+ 9", "+ 19, 29, 39", "+ 8, 18, 28, 38", "+ 48, 49… 98, 99"]);
  assert.deepEqual(await page.locator("#module-etapes .etape strong").allTextContents().then(l => l.map(t => t.replace(/ /g, " "))),
    ["J’apprends", "Je m’entraîne", "Je valide le niveau 1"]);
  await ecran("03-module-niveaux");

  // J'apprends, temps 1 : le rekenrek. 47 perles poussées.
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(400);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends123Je manipule");
  assert.deepEqual(await perles(page), {etape: 0, total: 47, fini: false});
  await ecran("04-apprends-1-rekenrek", {jeu: true});
  // Une perle à la fois : refusé, rien ne bouge.
  await glisser(page, 5, 0, true);
  assert.equal(await texte(page, ".perles-consigne"), "Pas assez de perles !");
  assert.deepEqual(await perles(page), {etape: 0, total: 47, fini: false}, "une perle seule est refusée");
  // Finir la rangée entamée n'est pas « pousser 10 perles ».
  await glisser(page, 4, 9, true);
  assert.deepEqual(await perles(page), {etape: 0, total: 47, fini: false});
  assert.match(await texte(page, ".perles-consigne"), /^Pousse 10 perles/, "refusé sans phrase : la consigne reste");
  if (CAPTURES) await page.screenshot({path: path.join(CAPTURES, `${taille.nom}-05-apprends-1-geste-refuse.png`)});
  // La rangée entière d'un coup : acceptée.
  await glisser(page, 5, 9, true);
  assert.deepEqual(await perles(page), {etape: 1, total: 57, fini: false}, "la rangée entière d'un coup est acceptée");
  assert.equal(await texte(page, ".dc-trace"), "47 + 10 = 5757 − 1 = …");
  // Retirer 2 perles : trop. Puis 1 : c'est fini.
  await glisser(page, 4, 5, false);
  assert.equal(await texte(page, ".perles-consigne"), "Trop de perles !");
  await glisser(page, 4, 6, false);
  assert.deepEqual(await perles(page), {etape: 2, total: 56, fini: true});
  assert.equal(await texte(page, ".dc-trace"), "47 + 10 = 5757 − 1 = 56");
  await ecran("06-apprends-1-rekenrek-fini", {jeu: true});

  // Temps 2 : la droite à sauts. Une erreur ne donne pas la réponse.
  await valider(page);
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends✓23Je représente");
  assert.equal(await texte(page, "#aide .consigne"), "+ 9, c’est + 10 puis − 1.");
  await ecran("07-apprends-2-droite", {jeu: true, pave: true, image: true});
  await taper(page, 57);
  await valider(page);
  await page.waitForTimeout(150);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends✓23Je représente", "une erreur ne fait pas avancer");
  assert.equal(await page.locator("#inline-answer.is-invalid").count(), 1);
  assert.doesNotMatch(await page.evaluate(() => document.getElementById("aide").textContent + document.querySelector("#aide svg").getAttribute("aria-label") + document.getElementById("answer-feedback").textContent), /56/, "la réponse n'est jamais donnée");
  await taper(page, 56);
  await valider(page);
  await page.waitForTimeout(1100);

  // Temps 3 : j'écris. Une erreur ramène l'image avec la consigne.
  assert.equal(await texte(page, "#seance-fil"), "J’apprends✓✓3J’écris");
  assert.equal(await texte(page, "#expression"), "47 + 9= 47 + 10 − 1= 57 − 1=");
  await ecran("08-apprends-3-ecris", {jeu: true, pave: true});
  await valider(page);
  assert.equal(await texte(page, "#answer-feedback"), "Tape une réponse.");
  await taper(page, 55);
  await valider(page);
  await page.waitForTimeout(250);
  assert.equal(await page.locator("#aide svg").count(), 1, "l'erreur ramène l'image");
  await controler(session, taille, "09-apprends-3-erreur", {jeu: true, pave: true});
  await taper(page, 56);
  await valider(page);
  await page.waitForTimeout(1100);

  // La phrase-bilan, sur un écran à elle.
  assert.equal(await texte(page, "#retenir-phrase"), "+ 9, c’est + 10 puis − 1.");
  assert.equal(await texte(page, "#result-retenir .cahier"), "Je recopie cette phrase dans mon cahier.");
  assert.deepEqual(await page.locator("#result-suite button").allTextContents().then(l => l.map(t => t.replace(/ /g, " "))), ["Je m’entraîne →", "Revoir l’exemple"]);
  assert.deepEqual((await parcours(page)).modules.A5.a, [1, 0, 0, 0]);
  await ecran("10-phrase-bilan");

  // Je m'entraîne : une erreur connue (le retour oublié), une erreur inconnue.
  await page.click("#result-suite .primary");
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#time"), "À ton rythme");
  let c = await calcul(page);
  await ecran("11-entraine", {jeu: true, pave: true});
  const lireEchelle = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--echelle").trim());
  const echelleAvant = await lireEchelle();
  const oubli = c.donnees.n + 10;
  await taper(page, oubli);
  await valider(page);
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#answer-feedback"), `${c.donnees.n + 10}, c’est ${c.donnees.n} + 10. Il reste à enlever 1.`);
  assert.equal(await page.locator('#aide svg path[stroke-width="5.5"]').count(), 1, "le pas oublié est en gras");
  assert.equal(await texte(page, "#validate"), "Suivant");
  await ecran("12-entraine-erreur-connue", {jeu: true, pave: true, image: true});
  await page.waitForTimeout(700);
  await valider(page);
  await page.waitForTimeout(150);
  assert.equal(await lireEchelle(), echelleAvant, "l'image partie, le cadre reprend sa taille");
  c = await calcul(page);
  await taper(page, 5);
  await valider(page);
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#answer-feedback"), `Ta réponse : 5. Bonne réponse : ${c.reponse}.`);
  assert.equal(await page.locator("#aide svg").count(), 0, "une erreur inconnue : le retour de Défi tables, sans image");
  await ecran("13-entraine-erreur-inconnue", {jeu: true, pave: true});
  await page.waitForTimeout(700);
  await valider(page);
  // Les 8 autres, justes ; puis les deux ratés reviennent, une fois chacun.
  for (let rang = 0; rang < 10; rang += 1) {
    c = await calcul(page);
    if (rang === 8) {
      // Le calcul qui revient, raté de la même façon : la cause n'est comptée qu'une fois.
      assert.match(await texte(page, "#question-count"), /il revient/);
      await taper(page, oubli);
      await valider(page);
      await page.waitForTimeout(1000);
      await valider(page);
      await page.waitForTimeout(150);
      continue;
    }
    await taper(page, c.reponse);
    await valider(page);
    await page.waitForTimeout(950);
  }
  assert.equal(await texte(page, "#result-title"), "Entraînement réussi !");
  assert.equal(await texte(page, "#result-score"), "8 sur 10");
  assert.equal(await texte(page, "#corrections h2"), "Mes 2 erreurs");
  assert.deepEqual(Object.values((await parcours(page)).modules.A5.c), [1], "une erreur refaite sur le calcul qui revient n'est pas recomptée");
  await ecran("14-bilan-entrainement");

  // Je valide : pas de retour après chaque calcul, « Passer » autorisé.
  await page.click("#result-suite .primary");
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#time"), "Validation");
  assert.equal(await page.locator("#skip").isVisible(), true);
  await ecran("15-valide", {jeu: true, pave: true});
  await jouerSerie(page, 10, (calculCourant, rang) => (rang === 4 ? calculCourant.reponse + 3 : calculCourant.reponse), {clavier: !taille.telephone});
  assert.equal(await texte(page, "#result-title"), "Niveau 1 validé !");
  assert.equal(await texte(page, "#result-score"), "9 sur 10");
  assert.equal(await texte(page, "#corrections h2"), "Mon erreur");
  assert.match(await texte(page, "#result-suite .cadre"), /Ensuite : niveau 2, \+ 19, 29, 39\./);
  const etat = await parcours(page);
  assert.deepEqual(etat.modules.A5.v, [1, 0, 0, 0]);
  assert.equal(etat.modules.A5.nv, 2);
  assert.equal(etat.modules.A5.c["1"], 1, "l'erreur connue de l'entraînement est comptée");
  assert.equal(etat.mod, "A5");
  await ecran("16-bilan-niveau-valide");

  // « Niveau 2 → » : l'écran du module, sur le niveau suivant.
  await page.click("#result-suite .primary");
  await page.waitForTimeout(250);
  assert.equal(await page.locator("#module-niveaux button.ok").count(), 1);
  assert.equal(await texte(page, "#module-niveaux button.ici strong"), "+ 19, 29, 39");
  await ecran("17-module-niveau-2");
  await page.click("#module-changer");
  await page.waitForTimeout(250);
  assert.equal(await texte(page, "#acc-module-titre"), "Ajouter 9, 19, 29…");
  assert.equal(await texte(page, '.dc-mod[data-module="A5"] .tag'), "niveau 2 sur 4");
  await ecran("18-accueil-apres");
  await page.click("#acc-notice-bouton");
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#notice .notice p").count(), 5);
  if (CAPTURES) await page.screenshot({path: path.join(CAPTURES, `${taille.nom}-19-comment-ca-marche.png`)});

  // Le suivi : l'appli a envoyé la progression, sous son nom, sans prénom.
  await page.waitForTimeout(900);
  const {serveur} = session;
  assert.ok(serveur.lectures >= 1 && serveur.envois.length >= 1, "le faux serveur a reçu une lecture et des envois");
  const dernier = serveur.envois[serveur.envois.length - 1];
  assert.equal(dernier.appli, "defi-calcul");
  assert.equal(dernier.code, CODE);
  assert.equal(dernier.parcours.prenom, "");
  assert.ok(Number.isInteger(dernier.base_revision));
  assert.deepEqual(dernier.parcours.modules.A5.v, [1, 0, 0, 0]);
  assert.deepEqual(session.erreurs, []);
  await session.contexte.close();
}

// Les règles de validation, jouées au navigateur (1366 × 768).
async function reglesDeValidation(navigateur, base) {
  const taille = TAILLES[0];
  const session = await ouvrir(navigateur, base, taille);
  const {page} = session;
  const lancerValidation = async (module, niveau) => {
    await page.goto(base + PAGE);
    await page.waitForTimeout(400);
    await page.click(`.dc-mod[data-module="${module}"]`);
    await page.click(`#module-niveaux button:nth-child(${niveau})`);
    await page.click("#module-etapes .etape:nth-child(3)");
    await page.waitForTimeout(250);
  };

  // Procédure : 7 justes sur 10 — pas encore.
  await lancerValidation("A5", 2);
  await jouerSerie(page, 10, (c, rang) => (rang < 3 ? c.reponse + 1 : c.reponse));
  assert.equal(await texte(page, "#result-title"), "Pas encore");
  assert.equal(await texte(page, "#result-score"), "7 sur 10 — il en faut 8");
  assert.equal(await texte(page, "#result-suite .primary"), "Je m’entraîne");
  assert.equal(await texte(page, "#corrections h2"), "Mes 3 erreurs");
  assert.deepEqual((await parcours(page)).modules.A5.v, [0, 0, 0, 0]);
  await controler(session, taille, "20-validation-ratee");

  // Procédure : 10 justes, mais 3 au-delà de 30 s — 7 comptés, pas encore.
  await lancerValidation("A5", 2);
  await jouerSerie(page, 10, c => c.reponse, {avant: async (c, rang) => { if (rang < 3) await avancerHorloge(page, 30500); }});
  assert.equal(await texte(page, "#result-title"), "Pas encore");
  assert.equal(await texte(page, "#result-score"), "7 sur 10 — il en faut 8");
  assert.equal(await texte(page, "#corrections h2.lent"), "Juste, mais trop long");
  assert.equal(await page.locator("#corrections .correction-list.lent li").count(), 3);
  assert.doesNotMatch(await texte(page, "#corrections"), /\d s\b/, "aucun temps affiché");
  await controler(session, taille, "21-juste-mais-trop-long");

  // Procédure : 10 justes dont 2 trop longs, et un « Passer » — 7 comptés ; puis 8.
  await lancerValidation("A5", 2);
  await jouerSerie(page, 9, c => c.reponse, {avant: async (c, rang) => { if (rang < 2) await avancerHorloge(page, 31000); }});
  await page.click("#skip");
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#result-title"), "Pas encore", "« Passer » compte faux");
  assert.match(await texte(page, "#corrections"), /Pas de réponse/);
  await lancerValidation("A5", 2);
  await jouerSerie(page, 10, c => c.reponse, {avant: async (c, rang) => { if (rang < 2) await avancerHorloge(page, 31000); }});
  assert.equal(await texte(page, "#result-title"), "Niveau 2 validé !");
  assert.equal(await texte(page, "#result-score"), "8 sur 10");
  assert.equal(await page.locator("#corrections .correction-list.lent li").count(), 2);
  assert.deepEqual((await parcours(page)).modules.A5.v, [0, 1, 0, 0]);

  // Fait (A2 niveau 1) : 12 justes mais 5 s par calcul — trop lentement.
  await lancerValidation("A2", 1);
  assert.match(await texte(page, "#question-count"), /^1 \/ 12/);
  await jouerSerie(page, 12, c => c.reponse, {avant: () => avancerHorloge(page, 5000)});
  assert.equal(await texte(page, "#result-title"), "Pas encore");
  assert.equal(await texte(page, "#result-score"), "12 sur 12 ✓ mais trop lentement. Entraîne-toi encore.");
  assert.deepEqual((await parcours(page)).modules.A2.v, [0, 0, 0, 0]);
  await controler(session, taille, "22-trop-lentement");
  // … puis sans traîner : validé.
  await lancerValidation("A2", 1);
  await jouerSerie(page, 12, (c, rang) => (rang < 2 ? c.reponse + 1 : c.reponse));
  assert.equal(await texte(page, "#result-title"), "Niveau 1 validé !");
  assert.equal(await texte(page, "#result-score"), "10 sur 12");
  assert.deepEqual((await parcours(page)).modules.A2.v, [1, 0, 0, 0]);

  // Le dernier niveau seul ne valide pas le module : il faut tous les niveaux.
  await lancerValidation("A5", 4);
  await jouerSerie(page, 10, c => c.reponse);
  assert.equal(await texte(page, "#result-title"), "Niveau 4 validé !");
  assert.match(await texte(page, "#result-suite .cadre p"), /^Ensuite : niveau 1, \+ 9\.$/);
  assert.equal((await parcours(page)).modules.A5.ok, null);
  await lancerValidation("A5", 1);
  await jouerSerie(page, 10, c => c.reponse);
  assert.match(await texte(page, "#result-suite .cadre p"), /^Ensuite : niveau 3, /);
  await lancerValidation("A5", 3);
  await jouerSerie(page, 10, c => c.reponse);
  assert.equal(await texte(page, "#result-title"), "Niveau 3 validé !");
  assert.match(await texte(page, "#result-suite .cadre p"), /^Module validé ! Ensuite : Compléments à 10, 100, 1 000\.$/);
  await controler(session, taille, "23-module-valide");
  await page.click("#result-suite .primary");
  await page.waitForTimeout(250);
  assert.equal(await texte(page, "#parcours-compte"), "1 module validé sur 42");
  assert.equal(await page.locator('.dc-mod.valide[data-module="A5"]').count(), 1);
  assert.equal(await texte(page, "#acc-module-titre"), "Compléments à 10, 100, 1 000", "le module suivant devient Mon module");
  // Lot 1a : la carte ne montre que les étapes jouables, sans « Mes calculs du jour ».
  assert.match(await texte(page, "#acc-carte .programme"), /^1J’apprends/);
  assert.doesNotMatch(await texte(page, "#acc-carte"), /Mes calculs du jour/);
  // Un niveau rejoué dans un module validé : pas de « Ensuite ».
  await lancerValidation("A5", 4);
  await jouerSerie(page, 10, c => c.reponse);
  assert.equal(await texte(page, "#result-title"), "Niveau 4 validé !");
  assert.equal(await page.locator("#result-suite .cadre").count(), 0);
  await page.click("#result-suite .primary");
  await page.waitForTimeout(250);

  // A2 niveau 4 : pas de manipulation, « J'apprends » commence à « Je représente ».
  await page.click('.dc-mod[data-module="A2"]');
  await page.click("#module-niveaux button:nth-child(4)");
  assert.equal(await texte(page, "#module-etapes .etape:nth-child(1) small"), "avec la droite");
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends12Je représente");
  assert.equal(await page.locator(".perles-cadre").count(), 0);
  await controler(session, taille, "24-a2-niveau-4-droite", {jeu: true, pave: true, image: true});
  // Le bouton Retour du navigateur ramène à l'écran du module, sans quitter l'appli.
  await page.goBack();
  await page.waitForTimeout(300);
  assert.equal(await page.locator("#module").isVisible(), true, "Retour : l'écran du module");
  assert.match(page.url(), /defi_calcul_modules\.html/);
  await page.goBack();
  await page.waitForTimeout(300);
  assert.equal(await page.locator("#intro").isVisible(), true, "Retour : l'accueil");

  // A2 niveau 3 : le rekenrek en deux gestes (finir la rangée, puis les rangées entières).
  await page.click('.dc-mod[data-module="A2"]');
  await page.click("#module-niveaux button:nth-child(3)");
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(400);
  await glisser(page, 4, 9, true);
  assert.equal(await texte(page, ".perles-consigne"), "Finis la rangée d’abord !");
  await glisser(page, 3, 9, true);
  assert.equal(await texte(page, ".dc-trace"), "37 + 3 = 4040 + … = 100");
  for (let rangee = 4; rangee <= 9; rangee += 1) await glisser(page, rangee, 9, true);
  assert.deepEqual(await perles(page), {etape: 7, total: 100, fini: true});
  await controler(session, taille, "25-a2-niveau-3-rekenrek", {jeu: true});
  await valider(page);
  await page.waitForTimeout(300);
  await taper(page, 63);
  await valider(page);
  await page.waitForTimeout(1100);
  assert.equal(await texte(page, "#expression"), "37 + 3 = 4040 + 60 = 1003 + 60 =");
  // Une erreur connue d'A2 à l'entraînement : chaque chiffre complété à 10.
  await page.click("#game-menu");
  await page.click("#module-etapes .etape:nth-child(2)");
  await page.waitForTimeout(300);
  let c = await calcul(page);
  // De 91 à 99 il n'y a pas de dizaine à passer : on répond juste et on prend le calcul suivant.
  while (c.donnees.a > 90) {
    await taper(page, c.reponse);
    await valider(page);
    await page.waitForTimeout(950);
    c = await calcul(page);
  }
  await taper(page, 110 - c.donnees.a);
  await valider(page);
  await page.waitForTimeout(300);
  assert.match(await texte(page, "#answer-feedback"), /c’est trop\. Va d’abord à \d+, puis à 100\.$/);
  await controler(session, taille, "26-a2-erreur-connue", {jeu: true, pave: true, image: true});
  assert.deepEqual(session.erreurs, []);
  await session.contexte.close();
}

// Sans code, et avec un serveur qui ne connaît pas encore l'appli (avant le lot 2).
async function etatsDuSuivi(navigateur, base) {
  const taille = TAILLES[0];
  const sans = await ouvrir(navigateur, base, taille, {suivi: null});
  assert.equal(await sans.page.locator("#suivi-repere").isHidden(), true, "sans code : pas de bandeau");
  assert.equal(await texte(sans.page, "#lien-retour"), "Calcul mental");
  await controler(sans, taille, "27-sans-code", {bandeau: false});
  await sans.page.click("#acc-carte");
  await sans.page.waitForTimeout(300);
  assert.equal(await texte(sans.page, "#seance-fil"), "J’apprends123Je manipule", "« Commencer » lance l'étape de Mon module");
  assert.deepEqual(sans.erreurs, []);
  await sans.contexte.close();

  const refuse = await ouvrir(navigateur, base, taille, {suivi: "refuse"});
  await refuse.page.waitForTimeout(300);
  assert.equal(await refuse.page.locator("#suivi-repere").isVisible(), true);
  assert.match(await texte(refuse.page, "#suivi-repere"), /travail gardé ici, pas encore envoyé/);
  // L'appli marche quand même, et garde le travail sur l'appareil.
  await refuse.page.click("#acc-valide");
  await refuse.page.waitForTimeout(250);
  await jouerSerie(refuse.page, 12, c => c.reponse);
  assert.equal(await texte(refuse.page, "#result-title"), "Niveau 1 validé !");
  await refuse.page.waitForTimeout(900);
  assert.match(await texte(refuse.page, "#suivi-repere"), /impossible d’envoyer ce travail/);
  const cles = await refuse.page.evaluate(() => Object.keys(window.localStorage));
  assert.ok(cles.some(cle => /^mathsgo-defi-calcul-parcours:[0-9a-f]{16}$/.test(cle)), "la case de l'élève, sous l'empreinte de son code");
  assert.ok(cles.every(cle => !cle.includes("7K3M9P")), "aucune clé ne porte le code");
  assert.deepEqual(refuse.erreurs.filter(erreur => !/400/.test(erreur)), []);
  await refuse.contexte.close();
}

(async () => {
  if (CAPTURES) fs.mkdirSync(CAPTURES, {recursive: true});
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH
    ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH}
    : {channel: "chromium"});
  let echec = null;
  try {
    for (const taille of TAILLES) {
      await parcoursDesEcrans(navigateur, base, taille);
      console.log(`ok — les écrans à ${taille.nom}`);
    }
    await reglesDeValidation(navigateur, base);
    console.log("ok — les règles de validation, le rekenrek d'A2, le retour du navigateur");
    await etatsDuSuivi(navigateur, base);
    console.log("ok — sans code, et avec un serveur qui ne connaît pas encore l'appli");
  } catch (erreur) {
    echec = erreur;
  }
  await navigateur.close();
  serveur.close();
  if (echec) {
    console.error(`ÉCHEC — ${echec.message}`);
    process.exit(1);
  }
  console.log(CAPTURES ? `Captures déposées dans ${CAPTURES}` : "Défi calcul : les écrans du lot 1a sont conformes.");
})();
