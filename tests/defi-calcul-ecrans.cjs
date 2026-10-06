// Défi calcul, lot 2a : les écrans au navigateur (document de l'étape 5a, § 12).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   npm install --no-save playwright
//   node tests/defi-calcul-ecrans.cjs
//   DEFI_CALCUL_CAPTURES=/chemin/du/dossier node tests/defi-calcul-ecrans.cjs   (dépose les captures)
//   CHROMIUM_EXECUTABLE_PATH=/chemin/chrome node tests/defi-calcul-ecrans.cjs   (un Chromium précis)
//   DEFI_CALCUL_SEULEMENT=seance node tests/defi-calcul-ecrans.cjs   (seance | su | prof | aides | niveaux | suivi)
//   DEFI_CALCUL_NIVEAUX=D2-1,A5-3 …   (avec « niveaux » : seulement ces niveaux-là)
//   DEFI_CALCUL_TAILLE=1366 …   (une seule taille : 1366, 1440 ou 390)
//
// L'élève : un faux serveur de suivi RÉPOND (la recette du lot 2b de Défi
// tables), le bandeau « Suivi par ton professeur » est affiché, et c'est avec
// lui — et avec le fil de la séance — que le cadre doit tenir. Le
// professeur : « ?prof=1 », sans code ni bandeau. Trois tailles : 1366 × 768
// en fenêtre, 1440 × 900 en plein écran, 390 × 844. Le jour est fixé par
// l'horloge du navigateur : la séance se rejoue de jour en jour.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {chromium} = require("playwright");

const RACINE = path.resolve(__dirname, "..");
const PAGE = "/outils/calcul_mental/defi_calcul_modules.html?test";
const CAPTURES = process.env.DEFI_CALCUL_CAPTURES || "";
const SEULEMENT = process.env.DEFI_CALCUL_SEULEMENT || "";
const CODE = "7K3M9P";
const JOUR = "2026-10-12";
const TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon"};

const TOUTES_LES_TAILLES = [
  {nom: "1366x768", largeur: 1366, hauteur: 768},
  {nom: "1440x900-plein-ecran", largeur: 1440, hauteur: 900, plein: true},
  {nom: "390x844", largeur: 390, hauteur: 844, telephone: true}
];
// DEFI_CALCUL_TAILLE=1366 : une seule taille (les sabotages s'en servent).
const TAILLES = TOUTES_LES_TAILLES.filter(taille => taille.nom.startsWith(process.env.DEFI_CALCUL_TAILLE || ""));

const P = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_mon_parcours.js"));
const plus = (jour, n) => P.ajouterJours(jour, n);

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

// Une page ouverte sur l'appli.
//   suivi    "repond" (le serveur connaît l'appli), "refuse" (400 « Application
//            inconnue », l'état d'avant le lot 2b), ou null (pas de code) ;
//   prof     le mode professeur (« ?prof=1 », sans code) ;
//   parcours la progression que le serveur rend à l'ouverture ;
//   jour     le jour que le navigateur croit vivre.
async function ouvrir(navigateur, base, taille, {suivi = "repond", prof = false, parcours = null, jour = JOUR, requete = ""} = {}) {
  if (prof) suivi = null;
  const contexte = await navigateur.newContext({
    viewport: {width: taille.largeur, height: taille.hauteur}, deviceScaleFactor: 1, hasTouch: Boolean(taille.telephone),
    timezoneId: "Indian/Reunion"
  });
  const page = await contexte.newPage();
  // L'horloge du navigateur part de ce jour-là, 10 h, et avance normalement.
  await page.clock.install({time: new Date(`${jour}T10:00:00+04:00`)});
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
  const serveur = {revision: parcours ? 1 : 0, parcours, envois: [], lectures: 0};
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
  await page.goto(base + PAGE + (prof ? "&prof=1" : "") + requete);
  await page.waitForTimeout(500);
  if (taille.plein) {
    await page.click("[data-fullscreen-toggle]");
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.body.classList.contains("fullscreen-active")), true, "plein écran actif");
  }
  return {page, contexte, erreurs, serveur, prof, base};
}

// Le lendemain (ou n jours plus tard) : l'élève rouvre l'appli. Un onglet
// neuf, le jour voulu ; sa progression revient par le serveur.
async function rouvrir(navigateur, session, taille, jour) {
  await session.page.waitForTimeout(1000);
  assert.deepEqual(session.erreurs, [], `aucune erreur de console avant le ${jour}`);
  const garde = session.serveur.parcours;
  await session.contexte.close();
  return ouvrir(navigateur, session.base, taille, {parcours: garde, jour});
}

const calcul = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.calcul());
const parcours = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.parcours());
const etape = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.etape());
const perles = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.perles());
const texte = (page, selecteur) => page.evaluate(s => (document.querySelector(s)?.textContent || "").replace(/[  ]/g, " ").trim(), selecteur);
const avancerHorloge = (page, ms) => page.evaluate(d => { window.__decalage += d; }, ms);

// Tape un nombre : au pavé (la virgule est au-dessus), ou au clavier.
async function taper(page, nombre, {clavier = false} = {}) {
  for (const signe of String(nombre).replace(".", ",")) {
    if (clavier) await page.keyboard.press(signe);
    else await page.click(`#play [data-key="${signe}"]`);
  }
}

const textes = (page, selecteur) => page.locator(selecteur).allTextContents().then(liste => liste.map(t => t.replace(/[\u00a0\u202f]/g, " ").trim()));

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
async function controler(session, taille, nom, {jeu = false, pave = false, image = false, bandeau = !session.prof, capture = true} = {}) {
  const {page, erreurs} = session;
  // La capture d'abord : un écran qui ne passe pas se regarde. (Un bilan
  // fêté arrive en fondu : on attend qu'il soit là.)
  if (CAPTURES && capture && await page.locator("#result.is-fete").isVisible()) await page.waitForTimeout(600);
  if (CAPTURES && capture) await page.screenshot({path: path.join(CAPTURES, `${taille.nom}-${nom}.png`)});
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
      trace: boite(".dc-trace"),
      logo: boite(".topbar > .brand"), sortie: boite("#suivi-repere .sortie"), bandeau: boite("#suivi-repere"), barre: boite(".topbar"),
      // Le calcul tient dans sa boîte (une ligne, rien de coupé).
      calculDeborde: (() => {
        const expression = document.getElementById("expression");
        if (!expression || !expression.checkVisibility()) return 0;
        const morceau = document.createRange();
        morceau.selectNodeContents(expression);
        return Math.round(morceau.getBoundingClientRect().width - expression.getBoundingClientRect().width);
      })(),
      // Ce qui se lit à l'écran, ligne par ligne.
      lignes: document.querySelector(".panel").innerText.split("\n").map(ligne => ligne.trim()).filter(Boolean),
      pilule: !document.getElementById("prof-pilule").hidden,
      filSeance: boite("#fil-seance"), status: boite("#play .status"), filTemps: boite("#seance-fil"),
      // Le fil d'une étape d'un niveau (« Je m'entraîne : … ») : son nom se coupe au téléphone.
      filCoupable: Boolean(document.querySelector("#fil-seance .quoi")),
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
    // Comme dans Défi tables : pas de logo en haut pour l'élève à code,
    // « Se déconnecter » dans le bandeau, une seule barre fine.
    assert.equal(m.logo, null, `${ou} : pas de logo dans la barre de l'élève`);
    assert.ok(m.sortie && m.sortie.gauche >= m.bandeau.gauche && m.sortie.droite <= m.bandeau.droite + 1 && m.sortie.haut >= m.bandeau.haut - 1 && m.sortie.bas <= m.bandeau.bas + 1,
      `${ou} : « Se déconnecter » est dans le bandeau`);
    assert.ok(m.barre.bas - m.barre.haut <= 72 * (Number(m.echelle) || 1), `${ou} : la barre du haut est fine (${Math.round(m.barre.bas - m.barre.haut)} px)`);
  }
  // Le français de ce qui est affiché : une espace insécable devant : ? !
  // (après un mot ou un nombre : « + ? » est un calcul, pas une phrase).
  m.lignes.forEach(ligne => assert.doesNotMatch(ligne, /[\p{L}\d»)] [:?!]/u, `${ou} : « ${ligne} » (espace insécable devant : ? !)`));
  // Le fil de la séance est au-dessus de la barre, celui des trois temps ne le touche pas.
  if (m.filSeance && m.status) assert.ok(m.filSeance.bas <= m.status.haut + 1, `${ou} : le fil de la séance passe sur la barre`);
  if (taille.telephone && m.filSeance && m.filCoupable) assert.ok(m.filSeance.bas - m.filSeance.haut <= 30, `${ou} : au téléphone, le fil de la séance tient sur une ligne (${Math.round(m.filSeance.bas - m.filSeance.haut)} px)`);
  if (m.filSeance && m.filTemps) assert.ok(m.filSeance.bas <= m.filTemps.haut + 1, `${ou} : les deux fils se chevauchent`);
  if (m.trace && m.valider) assert.ok(m.trace.bas <= m.valider.haut + .5, `${ou} : la ligne du calcul passe sous le bouton du bas (${Math.round(m.trace.bas - m.valider.haut)} px)`);
  assert.ok(m.largeurPage <= m.largeur, `${ou} : aucun défilement horizontal (${m.largeurPage} > ${m.largeur})`);
  assert.ok(m.calculDeborde <= 0, `${ou} : le calcul sort de sa boîte (${m.calculDeborde} px)`);
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
    // 2 px : la place est mesurée en pixels entiers, puis le cadre est agrandi (plein écran).
    assert.ok(m.boulier.haut >= m.scene.haut - 2 && m.boulier.bas <= m.scene.bas + 2, `${ou} : le boulier tient dans sa place (boulier ${Math.round(m.boulier.haut)}–${Math.round(m.boulier.bas)}, place ${Math.round(m.scene.haut)}–${Math.round(m.scene.bas)})`);
    assert.ok(m.boulier.gauche >= 0 && m.boulier.droite <= m.largeur, `${ou} : le boulier tient dans la largeur`);
  }
  return m;
}

// Le texte d'un bouton est au milieu du bouton, en largeur et en hauteur.
async function centre(page, selecteur, ou) {
  const ecart = await page.evaluate(s => {
    const bouton = document.querySelector(s);
    const morceau = document.createRange();
    morceau.selectNodeContents(bouton);
    const t = morceau.getBoundingClientRect();
    const b = bouton.getBoundingClientRect();
    return [Math.abs(t.left + t.right - b.left - b.right) / 2, Math.abs(t.top + t.bottom - b.top - b.bottom) / 2, b.width];
  }, selecteur);
  assert.ok(ecart[0] <= 1.5 && ecart[1] <= 1.5, `${ou} : le texte n'est pas au milieu du bouton (${ecart[0]} px en largeur, ${ecart[1]} px en hauteur)`);
  return ecart[2];
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

// ------------------------------------------------------------------ J'apprends
//
// Joue « J'apprends » d'un niveau, quel qu'il soit, d'après sa fiche : le
// geste du rekenrek ou du glisse-nombres, puis les deux réponses. `ecran`
// est appelé à chaque temps (pour contrôler et capturer).
async function jouerApprends(page, cle, ecran = async () => {}) {
  const apprends = await page.evaluate(c => {
    const a = window.MATHSGO_DEFI_CALCUL_CORE.niveauDe(c).niveau.apprends;
    return {manipule: a.manipule ? {outil: a.manipule.outil, depart: a.manipule.depart, gestes: a.manipule.gestes, decalage: a.manipule.decalage} : null,
      represente: a.represente.reponse, ecris: a.ecris.reponse};
  }, cle);
  if (apprends.manipule && apprends.manipule.outil === "perles") {
    await ecran("manipule", {jeu: true});
    let total = apprends.manipule.depart;
    const entamee = Math.floor(total / 10);
    for (const geste of apprends.manipule.gestes) {
      if (geste > 0) {
        // Finir la rangée entamée, ou pousser la première rangée vide en entier.
        const rangee = total % 10 === 0 || geste === 10 ? Math.ceil(total / 10) : Math.floor(total / 10);
        await glisser(page, rangee, 9, true);
        total += geste;
      } else {
        await glisser(page, entamee, apprends.manipule.depart % 10 + geste, false);
        total += geste;
      }
    }
    assert.equal((await perles(page)).fini, true, `${cle} : le rekenrek est fini`);
    await ecran("manipule-fini", {jeu: true});
    await valider(page);
    await page.waitForTimeout(350);
  } else if (apprends.manipule) {
    await ecran("manipule", {jeu: true});
    await page.focus(".place-value-drag-bar");
    const pas = apprends.manipule.decalage;
    for (let i = 0; i < Math.abs(pas); i += 1) await page.keyboard.press(pas > 0 ? "ArrowLeft" : "ArrowRight");
    await page.waitForTimeout(400);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    assert.equal((await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.glisse())).fini, true, `${cle} : le glisse-nombres est fini`);
    await ecran("manipule-fini", {jeu: true});
    await valider(page);
    await page.waitForTimeout(350);
  }
  await ecran("represente", {jeu: true, pave: true, image: true});
  await taper(page, apprends.represente, {clavier: true});
  await valider(page, {clavier: true});
  await page.waitForTimeout(1100);
  await ecran("ecris", {jeu: true, pave: true});
  await taper(page, apprends.ecris, {clavier: true});
  await valider(page, {clavier: true});
  await page.waitForTimeout(1100);
}

// Une réponse fausse que la fiche ne reconnaît PAS (aucune cause comptée) ;
// ou, avec `cause`, la réponse fausse qui porte cette cause (null s'il n'y
// en a pas pour ce calcul).
const fausse = (page, cause = 0) => page.evaluate(voulue => {
  const CORE = window.MATHSGO_DEFI_CALCUL_CORE;
  const c = window.__MATHSGO_DEFI_CALCUL_TEST__.calcul();
  const d = c.donnees;
  const essais = voulue
    ? [110 - d.a, c.reponse * 10, c.reponse / 10, c.reponse + 10, c.reponse - 10, d.n, d.cible, d.m]
    : [c.reponse + 7, c.reponse + 3, c.reponse + 5, c.reponse + 13];
  const valeurs = essais.filter(v => typeof v === "number" && Number.isFinite(v) && v >= 0).map(v => CORE.exact(v));
  const trouve = valeurs.find(v => {
    const diagnostic = CORE.diagnostiquer(c, v);
    return !CORE.memeNombre(v, c.reponse) && (voulue ? diagnostic && diagnostic.c === voulue : !diagnostic);
  });
  return trouve === undefined ? null : trouve;
}, cause);

// Une série d'entraînement : `justes` bonnes réponses, puis des fausses (qui
// reviennent une fois chacune, hors score).
async function jouerEntrainement(page, justes, {total = 10} = {}) {
  for (let rang = 0; rang < total; rang += 1) {
    const c = await calcul(page);
    await taper(page, rang < justes ? c.reponse : await fausse(page), {clavier: true});
    await valider(page, {clavier: true});
    await page.waitForTimeout(rang < justes ? 900 : 800);
    if (rang >= justes) { await valider(page, {clavier: true}); await page.waitForTimeout(120); }
  }
  // Les calculs ratés reviennent : on les réussit.
  for (let rang = justes; rang < total; rang += 1) {
    const c = await calcul(page);
    await taper(page, c.reponse, {clavier: true});
    await valider(page, {clavier: true});
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(250);
}

// ------------------------------------------------------------------ la séance guidée
//
// Léa, quatre jours de suite : le test, J'apprends, l'entraînement raté puis
// réussi, deux ratés, Mes calculs du jour, la reprise, le rattrapage.
async function seanceGuidee(navigateur, base, taille) {
  let session = await ouvrir(navigateur, base, taille);
  let {page} = session;
  const ecran = (nom, options) => controler(session, taille, nom, options);
  const carte = () => textes(page, "#acc-carte .tete > span, #acc-carte .programme > span");
  const boutons = () => textes(page, "#result-suite button");
  const lendemain = async jour => { session = await rouvrir(navigateur, session, taille, jour); page = session.page; };

  // ---- jour 1 : l'accueil d'un élève qui commence.
  await ecran("01-accueil-jour-1");
  assert.equal(await texte(page, "#acc-module-titre"), "Compléments à 10, 100, 1 000");
  assert.equal(await texte(page, "#parcours-compte"), "0 module su sur 42");
  // Plus de menus : ni liens, ni modules cliquables, ni écran de module.
  assert.equal(await page.locator("#acc-liens").isVisible(), false, "pas de liens sous la carte");
  assert.equal(await page.locator("#acc-changer").isVisible(), false, "pas de « Changer de module »");
  assert.equal(await page.locator("#prof-pilule").isVisible(), false);
  assert.equal(await page.locator("#parcours-modules button").count(), 0, "les lignes du parcours ne sont pas des boutons");
  assert.equal(await page.locator("#parcours-modules .dc-mod").count(), 10, "le palier 1 : dix modules");
  assert.equal(await page.locator("#parcours-modules .dc-mod.bientot").count(), 7);
  assert.equal(await page.locator("#parcours-modules .dc-comp i").count(), 31, "un carré par compétence du palier 1");
  assert.deepEqual(await textes(page, ".dc-legende > span"), ["à apprendre", "en route", "su", "à revoir"]);
  assert.deepEqual(await page.locator("#acc-niv .cases b").evaluateAll(cases => cases.map(b => b.className)), ["ici", "", "", ""]);
  assert.equal(await page.locator("#acc-semaine").isVisible(), false, "aucune séance cette semaine : rien d'affiché");
  // La carte : le test, puis « Une chose nouvelle ».
  assert.deepEqual(await carte(), ["Ma séance du jour2 étapes · environ 8 min", "Commencer →",
    "1Tu connais déjà ? Compléments à 10, 100, 1 0003 calculs par niveau, sans aide", "2Une chose nouvelleselon ton test"]);
  // « Commencer → » : sur toute la largeur de la carte, son texte au milieu.
  const largeurs = [await centre(page, "#acc-carte .go", `${taille.nom} · « Commencer »`), await page.locator("#acc-carte .programme").evaluate(e => e.getBoundingClientRect().width)];
  assert.ok(Math.abs(largeurs[0] - largeurs[1]) <= 1, `${taille.nom} : « Commencer » fait la largeur de la carte (${largeurs})`);
  await page.click('.dc-mod[data-module="A2"]');
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#intro").isVisible(), true, "toucher un module ne mène nulle part");
  if (!taille.telephone) {
    const colonnes = await page.evaluate(() => [document.querySelector(".gauche").getBoundingClientRect().right, document.querySelector(".dc-parcours").getBoundingClientRect().left]);
    assert.ok(colonnes[0] <= colonnes[1], `${taille.nom} : deux colonnes`);
  }
  // Le palier le plus chargé (14 modules) tient lui aussi.
  await page.click("#parcours-paliers button:nth-child(2)");
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#parcours-modules .dc-mod").count(), 14);
  await ecran("02-accueil-palier-2");
  await page.click("#parcours-paliers button:nth-child(1)");

  // ---- « Tu connais déjà ? » : 12 calculs, sans aide, sans retour.
  await page.click("#acc-carte");
  await page.waitForTimeout(350);
  assert.deepEqual(await etape(page), {type: "test", module: "A2", numero: 1, total: 2});
  assert.equal(await texte(page, "#fil-seance"), "Ma séance12Tu connais déjà ? Compléments à 10, 100, 1 000");
  assert.equal(await texte(page, "#question-count"), "1 / 12");
  assert.equal(await texte(page, "#time"), "À ton rythme");
  assert.equal(await texte(page, "#game-menu"), "Accueil", "le retour s'appelle « Accueil »");
  assert.equal(await page.locator("#skip").isVisible(), true, "« Passer » est autorisé");
  await ecran("03-test", {jeu: true, pave: true});
  // Niveaux 1 et 2 : tout juste. Niveau 3 : 2 sur 3. Niveau 4 : passés.
  let ratesNiveau3 = 0;
  for (let rang = 0; rang < 12; rang += 1) {
    const c = await calcul(page);
    if (c.niveau === 4) { await page.click("#skip"); await page.waitForTimeout(60); continue; }
    const faux = c.niveau === 3 && ratesNiveau3 === 0;
    if (faux) ratesNiveau3 += 1;
    await taper(page, faux ? c.reponse + 1 : c.reponse, {clavier: !taille.telephone});
    await valider(page, {clavier: !taille.telephone});
    await page.waitForTimeout(60);
    if (rang < 11) assert.equal(await texte(page, "#answer-feedback"), "", "aucun retour après un calcul du test");
  }
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#result-title"), "2 niveaux sur 4 déjà connus !");
  assert.equal(await texte(page, "#result-score"), "8 justes sur 12 · Compléments à 10, 100, 1 000");
  assert.deepEqual(await textes(page, "#result-suite .bilan-niveaux > span"), [
    "✓Compléments à 103 sur 3 · en route, dans 3 jours", "✓Compléments à 100 : dizaines3 sur 3 · en route, dans 3 jours",
    "✗Compléments à 1002 sur 3 · à apprendre", "✗Compléments à 1 0000 sur 3 · à apprendre"]);
  // Sur chaque ligne, le nom du niveau et son détail ne se chevauchent pas.
  const chevauchements = await page.locator("#result-suite .bilan-niveaux > span").evaluateAll(lignes => lignes.filter(ligne => {
    const [nom, detail] = [ligne.children[1].getBoundingClientRect(), ligne.children[2].getBoundingClientRect()];
    return nom.right > detail.left + 1 && nom.bottom > detail.top + 1 && detail.bottom > nom.top + 1;
  }).length);
  assert.equal(chevauchements, 0, `${taille.nom} : dans le bilan du test, le détail passe sur le nom du niveau`);
  if (taille.telephone) {
    const dessous = await page.locator("#result-suite .bilan-niveaux > span").evaluateAll(lignes => lignes.every(ligne =>
      ligne.children[2].getBoundingClientRect().top >= ligne.children[1].getBoundingClientRect().bottom - 1));
    assert.equal(dessous, true, "au téléphone, le détail du bilan du test est sous le nom du niveau");
  }
  assert.deepEqual(await boutons(), ["Étape 2 : j’apprends Compléments à 100 →", "Arrêter la séance"]);
  assert.equal(await texte(page, "#result-fil"), "Ma séance123");
  assert.equal(await page.locator("#corrections").isVisible(), false, "le test ne montre pas ses erreurs");
  let etat = await parcours(page);
  assert.deepEqual(etat.modules.A2.b, [3, 3, 0, 0]);
  assert.deepEqual(etat.modules.A2.e, [plus(JOUR, 3), plus(JOUR, 3), null, null]);
  assert.equal(etat.test, 2);
  await ecran("04-bilan-test");

  // ---- J'apprends, dans la séance : le fil de la séance au-dessus, celui des trois temps dessous.
  await page.click("#result-suite .primary");
  await page.waitForTimeout(400);
  assert.equal(await texte(page, "#fil-seance"), "Ma séance123J’apprends : Compléments à 100");
  assert.equal(await page.locator("#seance-fil").innerText().then(t => t.replace(/\s+/g, "")), "123Jemanipule", "dans la séance, « J'apprends » n'est écrit qu'une fois");
  await jouerApprends(page, "A2-3", (nom, options) => ecran(`05-apprends-${nom}`, options));
  assert.equal(await texte(page, "#retenir-phrase"), "Pour aller à 100, je vais d’abord à la dizaine, puis à 100.");
  // « À retenir » : la suite, revoir l'exemple, et le troisième bouton, discret.
  assert.deepEqual(await boutons(), ["Étape 3 : je m’entraîne →", "Revoir l’exemple", "Arrêter la séance"]);
  assert.equal(await page.locator("#result-suite > button.arreter").count(), 1, "le troisième bouton est un lien discret");
  assert.deepEqual((await parcours(page)).modules.A2.a, [0, 0, 1, 0]);
  await ecran("06-a-retenir");
  // « Revoir l'exemple » ne compte pas une étape de plus.
  await page.click("#result-suite .secondary");
  await page.waitForTimeout(300);
  assert.equal(await page.locator(".perles-cadre").count(), 1, "l'exemple se rejoue");
  await jouerApprends(page, "A2-3");
  assert.equal((await parcours(page)).seance.etape, 2, "l'exemple revu jusqu'au bout : toujours 2 étapes faites");
  assert.deepEqual(await boutons(), ["Étape 3 : je m’entraîne →", "Revoir l’exemple", "Arrêter la séance"]);
  await page.click("#result-suite .arreter");
  await page.waitForTimeout(250);
  assert.equal((await parcours(page)).seance.etape, 2);

  // ---- arrêtée au milieu : la carte propose de reprendre, même après un rechargement.
  assert.deepEqual(await carte(), ["Ma séance du jourétape 3 sur 3", "Reprendre →", "3Je m’entraîne : Compléments à 10010 calculs"]);
  assert.deepEqual(await page.locator("#acc-niv .cases b").evaluateAll(cases => cases.map(b => b.className)), ["b", "b", "ici", ""]);
  assert.equal(await texte(page, "#acc-niv .txt"), "Niveau 3 sur 4à 100 : tous les nombres");
  await ecran("07-accueil-reprendre");
  await page.waitForTimeout(900);
  await page.goto(base + PAGE);
  await page.waitForTimeout(500);
  if (taille.plein) { await page.click("[data-fullscreen-toggle]"); await page.waitForTimeout(300); }
  assert.deepEqual(await carte(), ["Ma séance du jourétape 3 sur 3", "Reprendre →", "3Je m’entraîne : Compléments à 10010 calculs"]);
  await page.click("#acc-carte");
  await page.waitForTimeout(350);
  assert.deepEqual(await etape(page), {type: "entraine", module: "A2", niveau: 3, numero: 3, total: 3});
  assert.equal(await texte(page, "#fil-seance"), "Ma séance123Je m’entraîne : Compléments à 100");
  await ecran("08-entraine", {jeu: true, pave: true});

  // ---- entraînement raté (5 sur 10) : un second, tout de suite.
  // Une erreur connue d'abord : la phrase et l'image, avec le fil et le bandeau.
  // (« chaque chiffre complété à 10 » : 37 + ? = 100 → 73. Un calcul où elle
  // n'existe pas reçoit la bonne réponse, on prend le suivant.)
  let c = await calcul(page);
  let connue = await fausse(page, 1);
  while (connue === null) { await taper(page, c.reponse, {clavier: true}); await valider(page, {clavier: true}); await page.waitForTimeout(950); c = await calcul(page); connue = await fausse(page, 1); }
  const dejaJustes = Number((await texte(page, "#question-count")).split(" / ")[0]) - 1;
  assert.ok(dejaJustes <= 4, "une erreur connue dans les premiers calculs");
  await taper(page, connue);
  await valider(page);
  await page.waitForTimeout(300);
  assert.match(await texte(page, "#answer-feedback"), /c’est trop\. Va d’abord à \d+, puis à 100\.$/);
  await ecran("09-entraine-erreur-connue", {jeu: true, pave: true, image: true});
  await page.waitForTimeout(700);
  await valider(page);
  await page.waitForTimeout(150);
  // 4 autres erreurs, puis des justes jusqu'à 10 ; les ratés reviennent.
  for (let rang = dejaJustes + 1; rang < 10; rang += 1) {
    c = await calcul(page);
    const faux = rang - dejaJustes <= 4;
    await taper(page, faux ? await fausse(page) : c.reponse, {clavier: true});
    await valider(page, {clavier: true});
    await page.waitForTimeout(faux ? 800 : 900);
    if (faux) { await valider(page, {clavier: true}); await page.waitForTimeout(120); }
  }
  for (let rang = 0; rang < 5; rang += 1) {
    assert.match(await texte(page, "#question-count"), /il revient/);
    c = await calcul(page);
    await taper(page, c.reponse, {clavier: true});
    await valider(page, {clavier: true});
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(250);
  assert.equal(await texte(page, "#result-title"), "Pas encore");
  assert.equal(await texte(page, "#result-score"), "5 sur 10 — il en faut 8");
  assert.deepEqual(await boutons(), ["Étape 4 : je m’entraîne encore →", "Arrêter la séance"]);
  assert.equal(await texte(page, "#corrections h2"), "Mes 5 erreurs");
  assert.equal(await texte(page, "#result-fil"), "Ma séance1234");
  etat = await parcours(page);
  assert.deepEqual(etat.modules.A2.b, [3, 3, 0, 0], "raté : rien n'entre, rien ne descend");
  assert.deepEqual(etat.modules.A2.c, {1: 1}, "la cause de l'erreur connue est comptée");
  assert.equal(etat.test, 0);
  await ecran("10-entrainement-rate");

  // ---- le second, réussi : la séance est faite.
  await page.click("#result-suite .primary");
  await page.waitForTimeout(350);
  assert.equal(await texte(page, "#fil-seance"), "Ma séance1234Je m’entraîne encore : Compléments à 100");
  await jouerEntrainement(page, 9);
  assert.equal(await texte(page, "#result-title"), "Séance du jour faite");
  assert.deepEqual(await textes(page, "#result-suite .cadre .mouv > span"), [
    "Je m’entraîne : Compléments à 1005 sur 10", "Je m’entraîne encore : Compléments à 1009 sur 10 · en route"],
    "les étapes jouées depuis la reprise, avec leur score");
  assert.equal(await texte(page, "#result-suite .cadre:nth-of-type(2) p"), "Demain : Compléments à 1 000, et 3 calculs qui reviennent.");
  assert.equal(await texte(page, "#result-suite .semaine"), "1 fois cette semaine");
  assert.deepEqual(await boutons(), ["Accueil", "Encore une séance"]);
  // Les deux boutons ont la même hauteur (l'ombre du bouton bleu comprise).
  const hauteurs = await page.locator("#result-suite .boutons button").evaluateAll(l => l.map(b => Math.round(b.getBoundingClientRect().height + (parseFloat(getComputedStyle(b).boxShadow.split("px")[1]) || 0))));
  if (!taille.telephone) assert.equal(hauteurs[0], hauteurs[1], `« Accueil » et « Encore une séance » n'ont pas la même hauteur (${hauteurs})`);
  assert.equal(await texte(page, "#result-fil"), "Ma séance1234");
  assert.equal(await page.locator("#result-fil li.ok").count(), 4);
  assert.equal(await texte(page, "#corrections h2"), "Mon erreur");
  etat = await parcours(page);
  assert.deepEqual(etat.modules.A2.b, [3, 3, 2, 0]);
  assert.equal(etat.modules.A2.e[2], plus(JOUR, 1), "elle revient demain");
  assert.deepEqual(etat.seances, [JOUR]);
  assert.deepEqual(etat.seance, {jour: JOUR, etape: 0, n: 1, p: [0, 0, 0, 0, 0]});
  await ecran("11-seance-faite");

  // ---- l'accueil après la séance : « Encore une séance ».
  await page.click("#result-suite .boutons .primary");
  await page.waitForTimeout(250);
  assert.deepEqual(await carte(), ["Séance du jour faite ✓2 étapes · environ 6 min", "Encore une séance →",
    "1J’apprends : Compléments à 1 0002 temps", "2Je m’entraîne : Compléments à 1 00010 calculs"]);
  assert.equal(await texte(page, "#acc-semaine"), "1 fois cette semaine");
  assert.deepEqual(await page.locator('.dc-mod[data-module="A2"] .dc-comp i').evaluateAll(l => l.map(i => i.className)), ["b", "b", "b", ""]);
  await ecran("12-accueil-seance-faite");

  // ---- encore une séance : A2 niveau 4, raté deux fois. La séance s'arrête.
  await page.click("#acc-carte");
  await page.waitForTimeout(350);
  assert.equal(await page.locator("#seance-fil li").count(), 2, "à 1 000 : pas de manipulation, deux temps");
  assert.equal(await page.locator(".perles-cadre").count(), 0);
  await jouerApprends(page, "A2-4");
  await page.click("#result-suite .primary");
  await page.waitForTimeout(300);
  await jouerEntrainement(page, 3);
  assert.deepEqual(await boutons(), ["Étape 3 : je m’entraîne encore →", "Arrêter la séance"]);
  await page.click("#result-suite .primary");
  await page.waitForTimeout(300);
  await jouerEntrainement(page, 6);
  assert.equal(await texte(page, "#result-title"), "Pas encore");
  assert.equal(await texte(page, "#result-score"), "Demain, on reprend avec la droite.");
  assert.deepEqual(await boutons(), ["Accueil"], "pas de « Encore une séance » après deux ratés");
  assert.equal(await texte(page, "#result-suite .semaine"), "2 fois cette semaine");
  etat = await parcours(page);
  assert.deepEqual(etat.modules.A2.a, [0, 0, 1, 0], "« J'apprends » est à refaire");
  assert.deepEqual(etat.modules.A2.b, [3, 3, 2, 0]);
  assert.deepEqual(etat.seances, [JOUR, JOUR]);
  await ecran("13-deux-rates");
  await page.click("#result-suite .boutons .primary");
  await page.waitForTimeout(250);
  // Plus rien à jouer aujourd'hui : « À demain ! », sans bouton.
  assert.deepEqual(await carte(), ["Séance du jour faite ✓À demain !"]);
  assert.equal(await page.locator("button#acc-carte").count(), 0);
  await ecran("14-accueil-a-demain");

  // ---- jour 2 : Mes calculs du jour, un calcul par compétence.
  const jour2 = plus(JOUR, 1);
  await lendemain(jour2);
  assert.deepEqual(await carte(), ["Ma séance du jour3 étapes · environ 8 min", "Commencer →",
    "1Mes calculs du jour3 calculs · ça compte", "2J’apprends : Compléments à 1 0002 temps", "3Je m’entraîne : Compléments à 1 00010 calculs"]);
  await ecran("15-accueil-jour-2");
  await page.click("#acc-carte");
  await page.waitForTimeout(350);
  assert.deepEqual(await etape(page), {type: "jour", calculs: 3, entretien: true, numero: 1, total: 3});
  assert.equal(await texte(page, "#fil-seance"), "Ma séance123Mes calculs du jour");
  assert.equal(await page.locator("#time").isVisible(), false, "pas de pastille : le temps compte sans être montré");
  assert.doesNotMatch(await page.evaluate(() => document.getElementById("play").innerText), /Compléments/, "aucun nom de module ni de niveau pendant les calculs");
  await ecran("16-calculs-du-jour", {jeu: true, pave: true});
  // « Compléments à 100 » (dû) : juste, il monte. « Compléments à 10 » (pas
  // dû) : faux, il redescend quand même. L'autre : juste, rien ne bouge.
  for (let rang = 0; rang < 3; rang += 1) {
    c = await calcul(page);
    const faux = c.niveau === 1;
    await taper(page, faux ? c.reponse + 1 : c.reponse);
    await valider(page);
    await page.waitForTimeout(faux ? 800 : 950);
    if (faux) {
      assert.match(await texte(page, "#answer-feedback"), /Bonne réponse|d’abord|oubli|chiffre|trop/, "la correction est montrée");
      await valider(page);
      await page.waitForTimeout(150);
    }
  }
  assert.match(await texte(page, "#question-count"), /^3 \/ 3 · il revient$/);
  c = await calcul(page);
  await taper(page, c.reponse);
  await valider(page);
  await page.waitForTimeout(1200);
  assert.equal(await texte(page, "#result-title"), "Mes calculs du jour");
  assert.equal(await texte(page, "#result-score"), "2 sur 3");
  // Le bilan NOMME ce qui a bougé : en vert ce qui monte, en rouge ce qui redescend.
  assert.deepEqual(await page.locator("#result-suite .mouv > span").evaluateAll(l => l.map(s => [s.className, s.textContent.replace(/[  ]/g, " ")])), [
    ["monte", "Compléments à 100→ boîte 3, revient dans 3 jours"], ["descend", "Compléments à 10→ boîte 2, revient demain"]],
    "ce qui monte d'abord, ce qui redescend ensuite");
  assert.deepEqual(await boutons(), ["Étape 2 : j’apprends Compléments à 1 000 →", "Arrêter la séance"]);
  assert.equal(await texte(page, "#corrections h2"), "Mon erreur");
  etat = await parcours(page);
  assert.deepEqual(etat.modules.A2.b, [2, 3, 3, 0]);
  assert.deepEqual(etat.modules.A2.x, [1, 0, 0, 0]);
  assert.deepEqual(etat.modules.A2.e.slice(0, 3), [plus(jour2, 1), plus(JOUR, 3), plus(jour2, 3)]);
  await ecran("17-bilan-calculs-du-jour");
  // « Arrêter la séance » : les calculs du jour restent faits.
  await page.click("#result-suite .arreter");
  await page.waitForTimeout(250);
  assert.equal((await carte())[0], "Ma séance du jourétape 2 sur 3");

  // ---- jour 3 : « Compléments à 10 » raté une seconde fois de suite → rouge.
  const jour3 = plus(JOUR, 2);
  await lendemain(jour3);
  assert.equal((await carte())[2], "1Mes calculs du jour3 calculs · ça compte", "la séance de la veille, pas finie, est oubliée");
  await page.click("#acc-carte");
  await page.waitForTimeout(350);
  for (let rang = 0; rang < 3; rang += 1) {
    c = await calcul(page);
    const faux = c.niveau === 1;
    await taper(page, faux ? c.reponse + 1 : c.reponse);
    await valider(page);
    await page.waitForTimeout(faux ? 800 : 950);
    if (faux) { await valider(page); await page.waitForTimeout(150); }
  }
  c = await calcul(page);
  await taper(page, c.reponse);
  await valider(page);
  await page.waitForTimeout(1200);
  assert.deepEqual(await textes(page, "#result-suite .mouv > span.descend"), ["Compléments à 10→ à revoir, revient demain"]);
  etat = await parcours(page);
  assert.deepEqual([etat.modules.A2.b[0], etat.modules.A2.x[0]], [1, 2]);
  assert.equal((await textes(page, "#result-suite button"))[0], "Étape 2 : j’apprends Compléments à 1 000 →", "le rattrapage attend la séance suivante");
  await page.click("#result-suite .arreter");

  // ---- jour 4 : la séance de la planche 1 — calculs du jour, rattrapage, J'apprends, Je m'entraîne.
  const jour4 = plus(JOUR, 3);
  await lendemain(jour4);
  assert.deepEqual(await carte(), ["Ma séance du jour4 étapes · environ 10 min", "Commencer →",
    "1Mes calculs du jour3 calculs · ça compte", "2Je m’entraîne encore : Compléments à 1010 calculs, avec les aides",
    "3J’apprends : Compléments à 1 0002 temps", "4Je m’entraîne : Compléments à 1 00010 calculs"]);
  assert.deepEqual(await page.locator("#acc-niv .cases b").evaluateAll(cases => cases.map(b => b.className)), ["r", "b", "b", "ici"]);
  assert.deepEqual(await page.locator('.dc-mod[data-module="A2"] .dc-comp i').evaluateAll(l => l.map(i => i.className)), ["r", "b", "b", ""]);
  await ecran("18-accueil-jour-4-rattrapage");
  // (L'horloge des durées a pris 20 s d'avance : le temps d'un calcul se
  // compte de son affichage à « Valider », pas depuis l'ouverture de la page.)
  await avancerHorloge(page, 20000);
  await page.click("#acc-carte");
  await page.waitForTimeout(350);
  // Un fait juste mais lent (plus de 5 s) : sa boîte reste, il revient demain.
  for (let rang = 0; rang < 3; rang += 1) {
    c = await calcul(page);
    if (c.niveau === 2) await avancerHorloge(page, 6000);
    await taper(page, c.reponse);
    await valider(page);
    await page.waitForTimeout(950);
  }
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#result-score"), "3 sur 3");
  assert.deepEqual(await textes(page, "#result-suite .mouv > span"), ["Compléments à 10→ boîte 2, revient demain"], "le fait lent n'est pas monté : il n'est pas dans la liste");
  etat = await parcours(page);
  assert.deepEqual(etat.modules.A2.b, [2, 3, 3, 0]);
  assert.equal(etat.modules.A2.e[1], plus(jour4, 1));
  assert.deepEqual(await boutons(), ["Étape 2 : je m’entraîne encore →", "Arrêter la séance"]);
  await ecran("19-bilan-avant-rattrapage");
  await page.click("#result-suite .primary");
  await page.waitForTimeout(350);
  assert.deepEqual(await etape(page), {type: "rattrape", module: "A2", niveau: 1, numero: 2, total: 4});
  assert.equal(await texte(page, "#fil-seance"), "Ma séance1234Je m’entraîne encore : Compléments à 10");
  await jouerEntrainement(page, 10);
  assert.equal(await texte(page, "#result-title"), "Entraînement réussi !");
  assert.deepEqual(await boutons(), ["Étape 3 : j’apprends Compléments à 1 000 →", "Arrêter la séance"]);
  etat = await parcours(page);
  assert.deepEqual([etat.modules.A2.b[0], etat.modules.A2.x[0]], [2, 0], "le rattrapage ne bouge pas la boîte, il remet les échecs à 0");
  await page.click("#result-suite .primary");
  await page.waitForTimeout(350);
  await jouerApprends(page, "A2-4");
  assert.deepEqual(await boutons(), ["Étape 4 : je m’entraîne →", "Revoir l’exemple", "Arrêter la séance"]);
  await page.click("#result-suite .primary");
  await page.waitForTimeout(300);
  await jouerEntrainement(page, 8);
  assert.equal(await texte(page, "#result-title"), "Séance du jour faite");
  assert.deepEqual(await textes(page, "#result-suite .cadre .mouv > span"), [
    "Mes calculs du jour3 sur 3", "Je m’entraîne encore : Compléments à 1010 sur 10", "J’apprends : Compléments à 1 000✓", "Je m’entraîne : Compléments à 1 0008 sur 10 · en route"]);
  assert.match(await texte(page, "#result-suite .cadre:nth-of-type(2) p"), /^Demain : × 10, × 100, × 1 000, et 4 calculs qui reviennent\.$/);
  assert.equal(await texte(page, "#result-suite .semaine"), "3 fois cette semaine");
  etat = await parcours(page);
  assert.deepEqual(etat.modules.A2.b, [2, 3, 3, 2]);
  assert.equal(etat.test, 2, "A2 est entré avec un accroc : pas de test au module suivant");
  await ecran("20-seance-faite-4-etapes");
  await page.click("#result-suite .boutons .primary");
  await page.waitForTimeout(250);
  assert.equal(await texte(page, "#acc-module-titre"), "× 10, × 100, × 1 000", "Mon module : le module de la première compétence grise");
  assert.equal((await carte())[2], "1J’apprends : × 10, × 100, × 1 0003 temps");

  // Le suivi : la progression est partie sous son nom, dans le format définitif, sans prénom.
  await page.waitForTimeout(900);
  const serveur = session.serveur;
  assert.ok(serveur.lectures >= 1 && serveur.envois.length >= 1, "le faux serveur a reçu une lecture et des envois");
  const dernier = serveur.envois[serveur.envois.length - 1];
  assert.equal(dernier.appli, "defi-calcul");
  assert.equal(dernier.code, CODE);
  assert.equal(dernier.parcours.prenom, "");
  assert.ok(Number.isInteger(dernier.base_revision));
  assert.deepEqual(Object.keys(dernier.parcours), ["version", "epoque", "prenom", "test", "modules", "seance", "seances", "jours"]);
  assert.deepEqual(Object.keys(dernier.parcours.modules.A2), ["vu", "ok", "b", "e", "a", "f", "x", "c"]);
  assert.deepEqual(dernier.parcours.modules.A2.b, [2, 3, 3, 2]);
  assert.deepEqual(session.erreurs, []);

  // Un autre appareil, le même jour, au milieu d'une séance : elle se reprend là où elle en était.
  await page.click("#acc-carte");
  await page.waitForTimeout(350);
  await jouerApprends(page, "M2-1");
  await page.click("#result-suite .arreter");
  await page.waitForTimeout(1000);
  await session.contexte.close();
  const ailleurs = await ouvrir(navigateur, base, taille, {parcours: serveur.parcours, jour: jour4});
  assert.deepEqual(await textes(ailleurs.page, "#acc-carte .tete > span, #acc-carte .programme > span"),
    ["Ma séance du jourétape 2 sur 2", "Reprendre →", "2Je m’entraîne : × 10, × 100, × 1 00010 calculs"]);
  await controler(ailleurs, taille, "21-autre-appareil-reprendre");
  assert.deepEqual(ailleurs.erreurs, []);
  await ailleurs.contexte.close();
}

// Une progression où des compétences sont dans des boîtes : {"A5-1": [boîte, échéance, échecs]}.
function progression(boites, extra = {}) {
  const p = P.creerParcours();
  Object.entries(boites).forEach(([cle, [boite, echeance, echecs = 0]]) => {
    const [id, n] = cle.split("-");
    const ligne = p.modules[id] || P.normaliserParcours({modules: {[id]: {}}}).modules[id];
    ligne.b[n - 1] = boite;
    ligne.e[n - 1] = echeance;
    ligne.x[n - 1] = echecs;
    ligne.a[n - 1] = 1;
    ligne.f[n - 1] = 1;
    ligne.vu = "2026-10-01";
    p.modules[id] = ligne;
  });
  return P.normaliserParcours(Object.assign(p, extra));
}

const TOUTES = ["A2-1", "A2-2", "A2-3", "A2-4", "M2-1", "M2-2", "A5-1", "A5-2", "A5-3", "A5-4", "D2-1", "D2-2", "D2-3", "D2-4"];

// « Module su ! », « Tout est en route ! », et la touche « , » dans Mes calculs du jour (1366 × 768).
async function moduleSuEtToutEnRoute(navigateur, base, taille) {
  // Les 14 compétences sont dans les boîtes ; M2 n'a plus qu'une compétence à passer au vert.
  const boites = Object.fromEntries(TOUTES.map((cle, i) => [cle, [cle.startsWith("A2") ? 4 : 3, i < 8 ? JOUR : plus(JOUR, 2 + i)]]));
  boites["M2-1"] = [4, plus(JOUR, 5)];
  boites["M2-2"] = [3, JOUR];
  boites["A5-2"] = [1, plus(JOUR, -1)];
  boites["D2-1"] = [3, JOUR];
  boites["D2-3"] = [2, JOUR];
  const depart = progression(boites, {seances: [plus(JOUR, -3), plus(JOUR, -4)]});
  depart.modules.A2.ok = "2026-10-05";
  const session = await ouvrir(navigateur, base, taille, {parcours: depart});
  const {page} = session;
  assert.equal(await texte(page, "#acc-module-titre"), "Défi calcul", "tout est entré : plus de « Mon module »");
  assert.deepEqual(await textes(page, "#acc-carte .tete > span, #acc-carte .programme > span"),
    ["Ma séance du jourTout est en route ! 10 calculs aujourd’hui.", "Commencer →", "1Mes calculs du jour10 calculs · ça compte"]);
  assert.equal(await texte(page, "#parcours-compte"), "1 module su sur 42");
  assert.equal(await page.locator('.dc-mod.su[data-module="A2"]').count(), 1);
  assert.equal(await texte(page, '.dc-mod[data-module="A2"] .st'), "✓");
  assert.equal(await page.locator('.dc-mod.encours[data-module="A5"] .dc-comp i.r').count(), 1, "une compétence rouge dans A5");
  await controler(session, taille, "22-accueil-tout-en-route");
  await page.click("#acc-carte");
  await page.waitForTimeout(350);
  // Dix calculs, de quatre modules : la touche « , » seulement sur un calcul de D2.
  const modules = new Set();
  let avecVirgule = 0;
  for (let rang = 0; rang < 10; rang += 1) {
    const c = await calcul(page);
    modules.add(c.module);
    const visible = await page.locator("#touches").isVisible();
    assert.equal(visible, c.module === "D2", `la touche « , » sur un calcul de ${c.module}`);
    if (visible) {
      avecVirgule += 1;
      if (avecVirgule === 1) await controler(session, taille, "23-calculs-du-jour-virgule", {jeu: true, pave: true});
    } else {
      // Au clavier non plus, la virgule ne s'écrit pas.
      await page.keyboard.press(",");
      assert.equal(await texte(page, "#inline-answer"), "");
    }
    await taper(page, c.reponse, {clavier: true});
    await valider(page, {clavier: true});
    await page.waitForTimeout(950);
  }
  await page.waitForTimeout(300);
  assert.ok(modules.size >= 3, "les calculs viennent de plusieurs modules");
  assert.ok(avecVirgule >= 1, "au moins un calcul à décimales");
  // Fin de la séance : « Module su ! » et ce qui a bougé.
  assert.equal(await texte(page, "#result-title"), "Séance du jour faite");
  assert.deepEqual(await textes(page, "#result-suite .cadre p"), ["Module su ! × 10, × 100, × 1 000", "Demain : 10 calculs qui reviennent."]);
  const mouvements = await textes(page, "#result-suite .mouv > span.monte");
  assert.ok(mouvements.includes("× 10, × 100 : trous, divisions→ vert, revient dans 7 jours"), mouvements.join(" | "));
  assert.ok(mouvements.includes("+ 19, 29, 39→ boîte 2, revient demain"), mouvements.join(" | "));
  const etat = await parcours(page);
  assert.equal(etat.modules.M2.ok, JOUR);
  assert.deepEqual(await textes(page, "#result-suite button"), ["Accueil"], "plus rien de dû : pas de seconde séance");
  await controler(session, taille, "24-module-su");
  await page.click("#result-suite .boutons .primary");
  await page.waitForTimeout(250);
  assert.equal(await texte(page, "#parcours-compte"), "2 modules sus sur 42");
  assert.deepEqual(session.erreurs, []);
  await session.contexte.close();
}

// Chaque niveau construit, dans la séance, avec le bandeau et les deux fils :
// les trois temps, la phrase-bilan, l'entraînement et sa correction tiennent
// dans le cadre.
async function tousLesNiveauxEnSeance(navigateur, base, taille) {
  const voulus = (process.env.DEFI_CALCUL_NIVEAUX || "").split(",").filter(Boolean);
  for (const cle of TOUTES.filter(c => !voulus.length || voulus.includes(c))) {
    const [id, n] = cle.split("-");
    // Tout ce qui précède est entré et ne revient pas aujourd'hui ; une séance a déjà fini (pas de calculs du jour).
    const avant = Object.fromEntries(TOUTES.slice(0, TOUTES.indexOf(cle)).map(c => [c, [5, plus(JOUR, 10)]]));
    const depart = progression(avant, {test: 0, seances: [JOUR], seance: {jour: JOUR, etape: 0, n: 1, p: [0, 0, 0, 0, 0]}});
    // Le module a déjà été testé : la séance va droit à « J'apprends ».
    depart.modules[id] = depart.modules[id] || P.normaliserParcours({modules: {[id]: {}}}).modules[id];
    depart.modules[id].f[n - 1] = 1;
    depart.modules[id].vu = "2026-10-01";
    const session = await ouvrir(navigateur, base, taille, {parcours: depart});
    const {page} = session;
    const ecran = (nom, options) => controler(session, taille, `n-${cle}-${nom}`, options);
    assert.match(await texte(page, "#acc-carte"), /^Séance du jour faite ✓2 étapes · environ 6 minEncore une séance →1J’apprends/, cle);
    await page.click("#acc-carte");
    await page.waitForTimeout(400);
    assert.deepEqual(await etape(page), {type: "apprends", module: id, niveau: Number(n), numero: 1, total: 2});
    await jouerApprends(page, cle, ecran);
    await ecran("retenir");
    await page.click("#result-suite .primary");
    await page.waitForTimeout(300);
    await ecran("entraine", {jeu: true, pave: true});
    // Une erreur connue, si la fiche en reconnaît une sur l'un des premiers calculs.
    for (let rang = 0; rang < 6; rang += 1) {
      const faux = await page.evaluate(() => {
        const CORE = window.MATHSGO_DEFI_CALCUL_CORE;
        const c = window.__MATHSGO_DEFI_CALCUL_TEST__.calcul();
        const d = c.donnees;
        const essais = [c.reponse * 10, c.reponse / 10, c.reponse + 10, c.reponse + 1, c.reponse + 2, d.n, d.m, 110 - d.a, c.reponse + 100, c.reponse * 100, c.reponse / 100];
        // Arrondi comme le fait l'appli (0,30000000000000004 → 0,3) : c'est ce nombre-là qui sera tapé.
        return essais.filter(v => typeof v === "number" && Number.isFinite(v) && v >= 0).map(v => CORE.exact(v))
          .find(v => String(v).length <= 8 && CORE.diagnostiquer(c, v)) ?? null;
      });
      const c = await calcul(page);
      if (faux === null) { await taper(page, c.reponse, {clavier: true}); await valider(page, {clavier: true}); await page.waitForTimeout(950); continue; }
      await taper(page, faux, {clavier: true});
      await valider(page, {clavier: true});
      await page.waitForTimeout(350);
      assert.equal(await page.locator("#aide svg").count(), 1, `${cle} : l'image de l'erreur connue`);
      await ecran("erreur-connue", {jeu: true, pave: true, image: true});
      break;
    }
    assert.deepEqual(session.erreurs, [], cle);
    await session.contexte.close();
  }
}

// ------------------------------------------------------------------ le mode professeur

async function modeProfesseur(navigateur, base, taille) {
  const session = await ouvrir(navigateur, base, taille, {prof: true});
  const {page} = session;
  const ecran = (nom, options) => controler(session, taille, nom, options);
  const boutons = () => textes(page, "#result-suite button");

  // L'accueil : la pilule, pas de bandeau, et les menus que l'élève n'a plus.
  assert.equal(await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.prof()), true);
  assert.equal(await page.locator("#prof-pilule").isVisible(), true, "la pilule est là dès l'ouverture");
  assert.equal(await texte(page, "#prof-pilule"), "Mode professeur· tous les menus, rien n’est enregistré ·Quitter");
  assert.equal(await page.locator("#suivi-repere").isVisible(), false, "pas de bandeau de suivi");
  assert.deepEqual(await textes(page, "#acc-droite button:visible, #acc-liens button:visible"), ["Changer de module", "Tu connais déjà ? (le test)", "Choisir une activité"]);
  assert.equal(await page.locator("#parcours-modules button.dc-mod").count(), 3, "les modules construits du palier 1 s'ouvrent");
  assert.equal(await page.locator("#parcours-modules div.dc-mod.bientot").count(), 7);
  assert.equal(await page.locator("#acc-carte").count(), 1, "la séance aussi se montre en classe");
  // Le palier le plus chargé (14 modules), ici avec le logo et la pilule :
  // c'est l'accueil le plus haut.
  await page.click("#parcours-paliers button:nth-child(2)");
  await page.waitForTimeout(150);
  assert.equal(await page.locator("#parcours-modules .dc-mod").count(), 14);
  await ecran("p00-accueil-palier-2");
  await page.click("#parcours-paliers button:nth-child(1)");
  await page.waitForTimeout(150);
  await ecran("p1-accueil-prof");

  // L'écran d'un module : les niveaux, J'apprends, Je m'entraîne, le test.
  await page.click('.dc-mod[data-module="A5"]');
  await page.waitForTimeout(200);
  assert.equal(await texte(page, "#module-titre"), "Ajouter 9, 19, 29…");
  assert.equal(await page.locator("#prof-pilule").isVisible(), true, "la pilule reste sur l'écran du module");
  assert.deepEqual(await page.locator("#module-niveaux button strong").allTextContents(), ["+ 9", "+ 19, 29, 39", "+ 8, 18, 28, 38", "+ 48, 49… 98, 99"]);
  assert.deepEqual(await textes(page, "#module-etapes .etape strong"), ["J’apprends", "Je m’entraîne", "Tu connais déjà ? (le test du module)"]);
  assert.deepEqual(await textes(page, "#module-etapes .etape small"), ["avec les perles et la droite", "10 calculs, sans chrono", "3 calculs par niveau, sans aide"]);
  await ecran("p2-module-prof");

  // J'apprends, temps 1 : le rekenrek. 47 perles poussées.
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(400);
  assert.equal(await page.locator("#fil-seance").isVisible(), false, "hors séance : pas de fil de séance");
  assert.equal(await page.locator("#prof-pilule").isVisible(), false, "pendant une activité, la pilule s'efface");
  assert.equal(await texte(page, "#game-menu"), "Mon module");
  assert.equal(await texte(page, "#seance-fil"), "J’apprends123Je manipule");
  assert.deepEqual(await perles(page), {etape: 0, total: 47, fini: false});
  await ecran("p3-apprends-1-rekenrek", {jeu: true});
  // Une perle à la fois : refusé, rien ne bouge.
  await glisser(page, 5, 0, true);
  assert.equal(await texte(page, ".perles-consigne"), "Pas assez de perles !");
  assert.deepEqual(await perles(page), {etape: 0, total: 47, fini: false}, "une perle seule est refusée");
  // Finir la rangée entamée n'est pas « pousser 10 perles ».
  await glisser(page, 4, 9, true);
  assert.deepEqual(await perles(page), {etape: 0, total: 47, fini: false});
  assert.match(await texte(page, ".perles-consigne"), /^Pousse 10 perles/, "refusé sans phrase : la consigne reste");
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
  await ecran("p4-apprends-1-rekenrek-fini", {jeu: true});

  // Temps 2 : la droite à sauts. Une erreur ne donne pas la réponse.
  await valider(page);
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends✓23Je représente");
  assert.equal(await texte(page, "#aide .consigne"), "+ 9, c’est + 10 puis − 1.");
  await ecran("p5-apprends-2-droite", {jeu: true, pave: true, image: true});
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
  await ecran("p6-apprends-3-ecris", {jeu: true, pave: true});
  await valider(page);
  assert.equal(await texte(page, "#answer-feedback"), "Tape une réponse.");
  await taper(page, 55);
  await valider(page);
  await page.waitForTimeout(250);
  assert.equal(await page.locator("#aide svg").count(), 1, "l'erreur ramène l'image");
  await ecran("p7-apprends-3-erreur", {jeu: true, pave: true});
  await taper(page, 56);
  await valider(page);
  await page.waitForTimeout(1100);

  // La phrase-bilan : trois sorties, la troisième discrète.
  assert.equal(await texte(page, "#retenir-phrase"), "+ 9, c’est + 10 puis − 1.");
  assert.equal(await texte(page, "#result-retenir .cahier"), "Je recopie cette phrase dans mon cahier.");
  assert.deepEqual(await boutons(), ["Je m’entraîne →", "Revoir l’exemple", "Accueil"]);
  assert.equal(await page.locator("#result-suite > button.arreter").count(), 1);
  await ecran("p8-a-retenir");

  // Je m'entraîne : une erreur connue (le retour oublié), une erreur inconnue.
  await page.click("#result-suite .primary");
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#time"), "À ton rythme");
  let c = await calcul(page);
  await ecran("p9-entraine", {jeu: true, pave: true});
  const lireEchelle = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--echelle").trim());
  const echelleAvant = await lireEchelle();
  const oubli = c.donnees.n + 10;
  await taper(page, oubli);
  await valider(page);
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#answer-feedback"), `${c.donnees.n + 10}, c’est ${c.donnees.n} + 10. Il reste à enlever 1.`);
  assert.equal(await page.locator('#aide svg path[stroke-width="5.5"]').count(), 1, "le pas oublié est en gras");
  assert.equal(await texte(page, "#validate"), "Suivant");
  await ecran("p10-entraine-erreur-connue", {jeu: true, pave: true, image: true});
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
  await ecran("p11-entraine-erreur-inconnue", {jeu: true, pave: true});
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
  assert.equal(await texte(page, "#result-suite .cadre p"), "+ 9 revient demain.");
  assert.equal(await texte(page, "#corrections h2"), "Mes 2 erreurs");
  assert.deepEqual(await boutons(), ["Mon module", "Accueil"], "plus de « Je valide », pour personne");
  assert.deepEqual(Object.values((await parcours(page)).modules.A5.c), [1], "une erreur refaite sur le calcul qui revient n'est pas recomptée");
  await ecran("p12-bilan-entrainement");

  // Le test du module, libre : le troisième bouton de l'écran du module.
  await page.click("#result-suite .primary");
  await page.waitForTimeout(250);
  assert.equal(await page.locator("#module").isVisible(), true);
  await page.click("#module-niveaux button:nth-child(3)");
  assert.equal(await page.locator("#module-niveaux button.ici strong").textContent(), "+ 8, 18, 28, 38");
  await page.click("#module-etapes .etape:nth-child(3)");
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#question-count"), "1 / 12");
  await ecran("p13-test-du-module", {jeu: true, pave: true});
  await jouerSerie(page, 12, calculCourant => calculCourant.reponse, {clavier: !taille.telephone});
  assert.equal(await texte(page, "#result-title"), "Tu connais déjà Ajouter 9, 19, 29… !");
  assert.equal(await texte(page, "#result-score"), "12 justes sur 12");
  assert.equal(await page.locator("#result-suite .bilan-niveaux .oui").count(), 4);
  assert.deepEqual(await boutons(), ["Mon module", "Accueil"]);
  await ecran("p14-bilan-test-prof");
  await page.click("#result-suite .secondary");
  await page.waitForTimeout(250);
  assert.equal(await page.locator("#intro").isVisible(), true);
  await page.click("#acc-notice-bouton");
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#notice .notice p").count(), 5);
  await ecran("p15-comment-ca-marche");
  await page.click("#notice-back");

  // « Choisir une activité » ouvre le module courant ; « le test » lance son test.
  await page.click("#acc-choisir");
  await page.waitForTimeout(200);
  assert.equal(await texte(page, "#module-titre"), "Compléments à 10, 100, 1 000");
  await page.click("#module-changer");
  await page.waitForTimeout(200);
  await page.click("#acc-test");
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.genre()), "test");
  assert.equal(await page.locator("#fil-seance").isVisible(), false);
  await page.click("#game-menu");
  await page.waitForTimeout(200);
  // La séance se joue aussi, pour la montrer : avec ce qui vient d'être joué
  // (en mémoire), elle commence par les calculs du jour.
  await page.click("#acc-carte");
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#fil-seance"), "Ma séance123Mes calculs du jour");
  await page.click("#game-menu");
  await page.waitForTimeout(300);

  // RIEN n'est enregistré, RIEN n'est envoyé.
  await page.waitForTimeout(900);
  const traces = await page.evaluate(() => ({durable: Object.keys(window.localStorage), onglet: Object.keys(window.sessionStorage).sort()}));
  assert.deepEqual(traces.durable, [], "rien dans le stockage de l'appareil");
  assert.ok(traces.onglet.includes("mathsgo-defi-calcul-prof"), "la clé est gardée dans l'onglet");
  assert.equal(traces.onglet.includes("mathsgo-suivi-code"), false);
  assert.deepEqual([session.serveur.lectures, session.serveur.envois.length], [0, 0], "aucun échange avec le serveur de suivi");
  // Sans « ?prof=1 » dans l'adresse, l'onglet reste en mode professeur — et repart d'une progression vide.
  await page.goto(base + PAGE);
  await page.waitForTimeout(400);
  assert.equal(await page.locator("#prof-pilule").isVisible(), true);
  assert.deepEqual((await parcours(page)).modules, {}, "la progression jouée n'a pas été gardée");
  // « ?prof=1&module=A2&niveau=3 » : le lien « ouvrir en classe » ouvre un niveau.
  await page.goto(base + PAGE + "&prof=1&module=A2&niveau=3");
  await page.waitForTimeout(400);
  assert.equal(await page.locator("#module").isVisible(), true);
  assert.equal(await texte(page, "#module-titre"), "Compléments à 10, 100, 1 000");
  assert.equal(await texte(page, "#module-niveaux button.ici strong"), "à 100 : tous les nombres");
  await ecran("p16-ouvrir-en-classe");
  // Un module pas construit, ou inconnu : l'accueil, sans erreur.
  await page.goto(base + PAGE + "&prof=1&module=A1&niveau=1");
  await page.waitForTimeout(300);
  assert.equal(await page.locator("#intro").isVisible(), true);
  // « Quitter » : la clé s'en va, la page redevient celle de l'élève.
  await page.click("#prof-quitter");
  await page.waitForTimeout(600);
  assert.equal(new URL(page.url()).search, "");
  assert.equal(await page.locator("#prof-pilule").isVisible(), false);
  assert.equal(await page.locator("#acc-liens").isVisible(), false);
  assert.equal(await page.locator("#parcours-modules button").count(), 0);
  assert.equal(await page.evaluate(() => window.sessionStorage.getItem("mathsgo-defi-calcul-prof")), null);
  assert.deepEqual(session.erreurs, []);
  await session.contexte.close();

  // Avec un code d'élève dans l'onglet, la clé est ignorée : l'élève reste suivi.
  const eleve = await ouvrir(navigateur, base, taille, {requete: "&prof=1"});
  assert.equal(await eleve.page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.prof()), false);
  assert.equal(await eleve.page.locator("#suivi-repere").isVisible(), true);
  assert.equal(await eleve.page.locator("#prof-pilule").isVisible(), false);
  assert.equal(await eleve.page.locator("#prof-refus").isVisible(), true, "le message « déconnecte-toi d’abord » se voit");
  assert.equal(await texte(eleve.page, "#prof-refus"), "Mode professeur· déconnecte-toi d’abord");
  assert.equal(await eleve.page.locator("#acc-liens").isVisible(), false);
  assert.equal(await eleve.page.locator("#parcours-modules button").count(), 0);
  assert.equal(await eleve.page.evaluate(() => window.sessionStorage.getItem("mathsgo-defi-calcul-prof")), null, "la clé n'est pas gardée");
  await controler(eleve, taille, "p17-prof-refuse-avec-un-code");
  // Sans la clé, le message n'est pas là.
  await eleve.page.goto(base + PAGE);
  await eleve.page.waitForTimeout(400);
  assert.equal(await eleve.page.locator("#prof-refus").isVisible(), false);
  assert.deepEqual(eleve.erreurs, []);
  await eleve.contexte.close();
}

// Mode professeur (1366 × 768) : A2 sans manipulation, le rekenrek d'A2, le retour du navigateur.
async function rekenrekA2EtRetour(navigateur, base) {
  const taille = TOUTES_LES_TAILLES[0];
  const session = await ouvrir(navigateur, base, taille, {prof: true});
  const {page} = session;
  // A2 niveau 4 : pas de manipulation, « J'apprends » commence à « Je représente ».
  await page.click('.dc-mod[data-module="A2"]');
  await page.click("#module-niveaux button:nth-child(4)");
  assert.equal(await texte(page, "#module-etapes .etape:nth-child(1) small"), "avec la droite");
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(300);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends12Je représente");
  assert.equal(await page.locator(".perles-cadre").count(), 0);
  await controler(session, taille, "p20-a2-niveau-4-droite", {jeu: true, pave: true, image: true});
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
  await controler(session, taille, "p21-a2-niveau-3-rekenrek", {jeu: true});
  await valider(page);
  await page.waitForTimeout(300);
  await taper(page, 63);
  await valider(page);
  await page.waitForTimeout(1100);
  assert.equal(await texte(page, "#expression"), "37 + 3 = 4040 + 60 = 1003 + 60 =");
  // M2 niveau 1, entraînement : 38 × 10 rendu tel quel → « tu n'as pas multiplié ».
  await page.click("#game-menu");
  await page.click("#module-changer");
  await page.click('.dc-mod[data-module="M2"]');
  await page.click("#module-etapes .etape:nth-child(2)");
  await page.waitForTimeout(300);
  for (let rang = 0; rang < 10; rang += 1) {
    const c = await calcul(page);
    if (c.donnees.p === 10 && c.forme.startsWith("produit")) {
      await taper(page, c.donnees.n);
      await valider(page);
      await page.waitForTimeout(300);
      assert.equal(await texte(page, "#answer-feedback"), `${c.donnees.n} = ${c.donnees.n} : tu n’as pas multiplié. Chaque chiffre doit valoir 10 fois plus : ${c.donnees.n} → ${c.reponse.toLocaleString("fr-FR").replace(/\s/g, " ")}.`);
      await controler(session, taille, "p22-m2-pas-multiplie", {jeu: true, pave: true, image: true});
      break;
    }
    await taper(page, c.reponse);
    await valider(page);
    await page.waitForTimeout(950);
    assert.ok(rang < 9, "aucun produit par 10 dans la série");
  }
  // En pleine séance, le retour du navigateur ramène à l'accueil et la séance se reprend.
  await page.click("#game-menu");
  await page.click("#module-changer");
  await page.click("#acc-carte");
  await page.waitForTimeout(300);
  await page.goBack();
  await page.waitForTimeout(300);
  assert.equal(await page.locator("#intro").isVisible(), true);
  assert.deepEqual(session.erreurs, []);
  await session.contexte.close();
}

// Glisse la bande du glisse-nombres de `colonnes` colonnes vers la gauche
// (négatif : vers la droite), au doigt ou à la souris, puis la lâche.
async function glisserBande(page, colonnes) {
  const g = await page.evaluate(() => {
    const barre = document.querySelector(".place-value-drag-bar").getBoundingClientRect();
    const grille = document.querySelector(".place-value-grid");
    const n = Number(getComputedStyle(grille).getPropertyValue("--colonnes"));
    return {x: barre.left + barre.width / 2, y: barre.top + barre.height / 2, pas: grille.getBoundingClientRect().width / n};
  });
  await page.mouse.move(g.x, g.y);
  await page.mouse.down();
  for (let pas = 1; pas <= 8; pas += 1) await page.mouse.move(g.x - colonnes * g.pas * pas / 8, g.y);
  await page.mouse.up();
  await page.waitForTimeout(450);
}
const glisse = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.glisse());
const arrets = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.arrets());
const annonce = (page, selecteur = ".dc-annonce") => page.evaluate(s => (document.querySelector(s)?.textContent || "").replace(/[  ]/g, " "), selecteur);
// Les chiffres que la bande montre, dans l'ordre (les cases vides sautées).
const bande = page => page.evaluate(() => [...document.querySelectorAll(".place-value-strip-digit")].map(c => c.textContent).join(""));

// Mode professeur : l'écran d'un module, sur un niveau.
async function ouvrirNiveau(page, module, niveau, palier = 1) {
  if (await page.locator("#play").isVisible()) await page.click("#game-menu");
  if (await page.locator("#result").isVisible()) await page.goBack();
  await page.waitForTimeout(150);
  if (await page.locator("#module").isVisible()) await page.click("#module-changer");
  await page.waitForTimeout(150);
  await page.click(`#parcours-paliers button:nth-child(${palier})`);
  await page.click(`.dc-mod[data-module="${module}"]`);
  await page.click(`#module-niveaux button:nth-child(${niveau})`);
  await page.waitForTimeout(150);
}

// M2 et D2 (lot 1b) : le glisse-nombres, le tableau à flèches, la virgule —
// depuis l'écran du module, donc en mode professeur.
async function glisseEtTableau(navigateur, base, taille) {
  const session = await ouvrir(navigateur, base, taille, {prof: true});
  const {page} = session;
  const ecran = (nom, options) => controler(session, taille, nom, options);

  // M2 : l'écran du module.
  await ouvrirNiveau(page, "M2", 1);
  assert.equal(await texte(page, "#module-titre"), "× 10, × 100, × 1 000");
  assert.deepEqual(await page.locator("#module-niveaux button strong").allTextContents(), ["produits", "nombres en 0, trous, divisions"]);
  assert.equal(await texte(page, "#module-etapes .etape:nth-child(1) small"), "avec le glisse-nombres et le tableau");
  await ecran("30-m2-module");

  // J'apprends, temps 1 : le glisse-nombres, 27 dans la bande.
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(400);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends123Je manipule");
  assert.deepEqual(await glisse(page), {decalage: 0, fini: false});
  assert.equal(await texte(page, ".glisse-consigne"), "Chaque chiffre vaut 100 fois plus.");
  assert.equal(await page.locator(".place-value-head").count(), 6, "M2 : 6 colonnes");
  assert.equal(await page.locator(".place-value-comma").count(), 0, "pas de virgule chez les entiers");
  assert.equal(await page.locator(".keypad").isVisible(), false, "pas de pavé pour glisser");
  await ecran("31-m2-glisse", {jeu: true});
  // Une colonne seulement : refusé, avec la phrase de la fiche, lue à voix haute.
  await glisserBande(page, 1);
  assert.equal(await texte(page, ".glisse-consigne"), "Chaque chiffre doit valoir 100 fois plus : 2 colonnes.");
  assert.deepEqual(await glisse(page), {decalage: 0, fini: false}, "la bande revient à sa place");
  assert.deepEqual(await arrets(page), [{decalage: 1, accepte: false}], "l'événement « decalage »");
  await page.waitForTimeout(100);
  assert.equal(await annonce(page), "Chaque chiffre doit valoir 100 fois plus : 2 colonnes.", "le refus est lu");
  if (CAPTURES) await page.screenshot({path: path.join(CAPTURES, `${taille.nom}-32-m2-glisse-refuse.png`)});
  // Au clavier : ← ← puis Entrée.
  await page.focus(".place-value-drag-bar");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(400);
  assert.deepEqual(await glisse(page), {decalage: 2, fini: false}, "les flèches font glisser sans lâcher");
  assert.equal(await page.getAttribute(".place-value-drag-bar", "aria-valuetext"), "2 colonnes vers la gauche");
  assert.equal(await bande(page), "27", "aucun zéro posé à la place de l'élève");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  assert.deepEqual(await glisse(page), {decalage: 2, fini: true}, "Entrée lâche la bande");
  assert.equal(await texte(page, ".dc-trace"), "27 × 100 = 2 700");
  // La pastille : son texte au milieu, en hauteur comme en largeur.
  const centrage = await page.evaluate(() => {
    const pastille = document.querySelector(".dc-trace b");
    const morceau = document.createRange();
    morceau.selectNodeContents(pastille);
    const t = morceau.getBoundingClientRect();
    const b = pastille.getBoundingClientRect();
    return [Math.abs(t.left + t.right - b.left - b.right) / 2, Math.abs(t.top + t.bottom - b.top - b.bottom) / 2];
  });
  assert.ok(centrage[0] <= 1.5 && centrage[1] <= 1.5, `« 27 × 100 = 2 700 » n'est pas centré dans sa pastille (${centrage})`);
  assert.equal(await page.locator("#validate").isVisible(), true, "« Suivant » apparaît");
  await ecran("33-m2-glisse-fini", {jeu: true});

  // Temps 2 : le tableau à flèches. Les zéros à écrire sont des « ? ».
  await page.keyboard.press("Enter");
  await page.waitForTimeout(350);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends✓23Je représente");
  assert.equal(await page.locator("#aide svg.dc-tableau").count(), 1);
  assert.equal(await texte(page, "#aide .consigne"), "Chaque chiffre vaut 100 fois plus.");
  assert.equal(await page.locator("#touches").isVisible(), false, "M2 : pas de virgule");
  assert.doesNotMatch(await page.getAttribute("#aide svg", "aria-label"), /2 700/, "le lecteur d'écran ne dit pas la réponse");
  await ecran("34-m2-tableau", {jeu: true, pave: true, image: true});
  await taper(page, 2700, {clavier: true});
  await valider(page, {clavier: true});
  await page.waitForTimeout(1100);
  // Temps 3 : j'écris (la ligne corrigée de la fiche).
  assert.equal(await texte(page, "#expression"), "27 × 100= 2 milliers et 7 centaines= 2 000 + 700=");
  await ecran("35-m2-ecris", {jeu: true, pave: true});
  await taper(page, 2700);
  await valider(page);
  await page.waitForTimeout(1100);
  assert.equal(await texte(page, "#retenir-phrase"), "Quand je multiplie par 100, chaque chiffre prend une valeur 100 fois plus grande.");
  assert.equal(await page.locator("#retenir-image svg.dc-tableau").count(), 1);
  await ecran("36-m2-phrase-bilan");

  // Je m'entraîne : un rang de trop, l'image du tableau.
  await page.click("#result-suite .primary");
  await page.waitForTimeout(300);
  let c = await calcul(page);
  await taper(page, c.reponse * 10);
  await valider(page);
  await page.waitForTimeout(300);
  assert.match(await texte(page, "#answer-feedback"), new RegExp(`, c’est .* × ${(c.donnees.p * 10).toLocaleString("fr-FR").replace(/\s/g, " ")}\\. Pour × `));
  assert.equal(await page.locator("#aide svg.dc-tableau").count(), 1, "l'image : le tableau à flèches");
  await ecran("37-m2-erreur-connue", {jeu: true, pave: true, image: true});

  // M2 niveau 2 : 480 ÷ 10, la bande glisse vers la droite.
  await ouvrirNiveau(page, "M2", 2);
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(400);
  await glisserBande(page, 1);
  assert.equal(await texte(page, ".glisse-consigne"), "Chaque chiffre doit valoir 10 fois moins : 1 colonne.", "vers la gauche : refusé");
  await glisserBande(page, -1);
  assert.deepEqual(await glisse(page), {decalage: -1, fini: true});
  assert.equal(await bande(page), "48", "le zéro sort du tableau des entiers");
  await valider(page);
  await page.waitForTimeout(350);
  await ecran("38-m2-division-tableau", {jeu: true, pave: true, image: true});

  // D2 niveau 3 : 3,6 × 100, la virgule, la case des unités vide.
  await ouvrirNiveau(page, "D2", 3, 3);
  assert.equal(await texte(page, "#module-titre"), "× 10, × 100, × 1 000 avec virgule");
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(400);
  assert.equal(await page.locator(".place-value-head").count(), 7, "D2 : des milliers aux millièmes");
  assert.equal(await page.evaluate(() => document.getElementById("expression").style.fontSize), "", "la taille réduite d'un calcul précédent ne reste pas");
  assert.equal(await page.locator(".place-value-comma").count(), 2, "la virgule fixe, dans les deux rangées");
  const virgule = () => page.evaluate(() => [...document.querySelectorAll(".place-value-comma")].map(v => Math.round(v.getBoundingClientRect().left)));
  const avant = await virgule();
  await glisserBande(page, 2);
  assert.deepEqual(await glisse(page), {decalage: 2, fini: true});
  assert.deepEqual(await virgule(), avant, "la virgule ne bouge pas");
  assert.equal(await bande(page), "36", "la case des unités reste vide : c'est le zéro à écrire");
  assert.equal(await texte(page, ".dc-trace"), "3,6 × 100 = 360");
  const chevauche = await page.evaluate(() => {
    const trace = document.querySelector(".dc-trace").getBoundingClientRect();
    const suivant = document.getElementById("validate").getBoundingClientRect();
    const tableau = document.querySelector(".place-value-tool").getBoundingClientRect();
    const calcul = document.getElementById("expression").getBoundingClientRect();
    return {trace: trace.bottom - suivant.top, calcul: calcul.bottom - tableau.top};
  });
  assert.ok(chevauche.trace <= 0, `la ligne du calcul passe sous « Suivant » (${chevauche.trace} px)`);
  assert.ok(chevauche.calcul <= 0, `le glisse-nombres monte sur le calcul (${chevauche.calcul} px)`);
  await ecran("39-d2-glisse-zero", {jeu: true});
  await valider(page);
  await page.waitForTimeout(350);
  assert.equal(await page.locator("#touches").isVisible(), true, "D2 : la touche « , »");
  assert.equal(await page.locator("#aide svg text", {hasText: "?"}).count(), 1, "un « ? » : le zéro à écrire");
  await ecran("40-d2-tableau", {jeu: true, pave: true, image: true});

  // D2 niveau 4 : la puissance cherchée. Un glissement faux, sans phrase.
  await ouvrirNiveau(page, "D2", 4, 3);
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(400);
  await glisserBande(page, 2);
  assert.equal(await texte(page, ".glisse-consigne"), "Glisse jusqu’à lire 1 200.", "refusé sans phrase : la consigne reste");
  assert.equal(await page.locator(".glisse-consigne.est-refus").count(), 1, "elle tremble");
  await page.waitForTimeout(100);
  assert.equal(await annonce(page), "Glisse jusqu’à lire 1 200.", "le lecteur d'écran relit la consigne");
  await glisserBande(page, 3);
  assert.equal(await texte(page, ".dc-trace"), "1,2 × 1 000 = 1 200");
  await valider(page);
  await page.waitForTimeout(350);
  assert.match(await page.locator("#aide svg").innerHTML(), />× \?</);
  assert.equal(await texte(page, "#aide .consigne"), "Je compte les colonnes.");
  await taper(page, 1000);
  await valider(page);
  await page.waitForTimeout(1100);
  assert.equal(await texte(page, "#expression"), "1,2 → 1 2003 colonnes1 200 = 1,2 ×");
  await ecran("41-d2-ecris", {jeu: true, pave: true});

  // D2 niveau 1, entraînement : la virgule au pavé et au clavier, une seule.
  await ouvrirNiveau(page, "D2", 1, 3);
  await page.click("#module-etapes .etape:nth-child(2)");
  await page.waitForTimeout(300);
  c = await calcul(page);
  const ecrit = String(c.reponse).replace(".", ",");
  for (const signe of ecrit) await page.click(`#play [data-key="${signe}"]`);
  if (ecrit.includes(",")) {
    await page.click('#play [data-key=","]');
    assert.equal(await texte(page, "#inline-answer"), ecrit, "une seule virgule");
  }
  await ecran("42-d2-virgule", {jeu: true, pave: true});
  await valider(page);
  await page.waitForTimeout(950);
  // « Le nombre n'a pas changé » : tapé avec un zéro de trop, au clavier.
  c = await calcul(page);
  const recopie = `${String(c.donnees.n).replace(".", ",")}0`;
  for (const signe of recopie) await page.keyboard.press(signe === "," ? "," : signe);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  assert.equal((await texte(page, "#answer-feedback")).split(" : ")[0], `${recopie} = ${String(c.donnees.n).replace(".", ",")}`);
  assert.equal(await page.locator("#aide svg.dc-tableau").count(), 1);
  await ecran("43-d2-erreur-connue", {jeu: true, pave: true, image: true});

  assert.deepEqual(session.erreurs, []);
  await session.contexte.close();
}

// Le rekenrek au clavier (1366 × 768) : le même geste forcé qu'au doigt.
async function rekenrekAuClavier(navigateur, base) {
  const taille = TOUTES_LES_TAILLES[0];
  const session = await ouvrir(navigateur, base, taille, {prof: true});
  const {page} = session;
  await ouvrirNiveau(page, "A5", 1);
  await page.click("#module-etapes .etape:nth-child(1)");
  await page.waitForTimeout(400);
  await page.keyboard.press("Tab");
  // Tab jusqu'au boulier.
  for (let i = 0; i < 12 && !(await page.evaluate(() => document.activeElement?.classList.contains("perles-interieur"))); i += 1) await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains("perles-interieur")), true, "Tab mène au boulier");
  assert.equal(await page.getAttribute(".perles-interieur", "role"), "application");
  // Le curseur part de la rangée entamée (47 : la 5e, 7 perles).
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(80);
  assert.equal(await annonce(page), "Rangée 6 : aucune perle poussée. Perle 8.");
  assert.equal(await page.locator(".perles-rangee.curseur .perle.curseur").count(), 1, "le cadre bleu : la rangée et la perle");
  // 8 perles d'un coup sur la rangée vide : « Pas assez de perles ! », lu.
  await page.keyboard.press("Enter");
  await page.waitForTimeout(80);
  assert.equal(await texte(page, ".perles-consigne"), "Pas assez de perles !");
  assert.equal(await annonce(page), "Pas assez de perles !");
  assert.deepEqual(await perles(page), {etape: 0, total: 47, fini: false});
  // La 10e perle : la rangée entière.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  assert.deepEqual(await perles(page), {etape: 1, total: 57, fini: false});
  if (CAPTURES) await page.screenshot({path: path.join(CAPTURES, `${taille.nom}-44-rekenrek-clavier.png`)});
  // Retirer 1 : la rangée entamée, sa 7e perle.
  await page.keyboard.press("ArrowUp");
  for (let i = 0; i < 3; i += 1) await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  assert.deepEqual(await perles(page), {etape: 2, total: 56, fini: true});
  // Entrée, maintenant, c'est « Suivant ».
  await page.keyboard.press("Enter");
  await page.waitForTimeout(350);
  assert.equal(await texte(page, "#seance-fil"), "J’apprends✓23Je représente");
  assert.deepEqual(session.erreurs, []);
  await session.contexte.close();
}

// Sans code, et avec un serveur qui ne connaît pas encore l'appli (avant le lot 2b).
async function etatsDuSuivi(navigateur, base) {
  const taille = TOUTES_LES_TAILLES[0];
  const sans = await ouvrir(navigateur, base, taille, {suivi: null});
  assert.equal(await sans.page.locator("#suivi-repere").isHidden(), true, "sans code : pas de bandeau");
  assert.equal(await texte(sans.page, "#lien-retour"), "Calcul mental");
  assert.equal(await sans.page.locator("#acc-liens").isVisible(), false, "sans code non plus, pas de menus");
  await controler(sans, taille, "30-sans-code", {bandeau: false});
  await sans.page.click("#acc-carte");
  await sans.page.waitForTimeout(300);
  assert.equal(await texte(sans.page, "#fil-seance"), "Ma séance12Tu connais déjà ? Compléments à 10, 100, 1 000", "« Commencer » lance la séance");
  // Le travail sans code reste sur l'appareil, dans la case sans code.
  await jouerSerie(sans.page, 12, c => c.reponse, {clavier: true});
  assert.equal(await texte(sans.page, "#result-title"), "Tu connais déjà Compléments à 10, 100, 1 000 !");
  assert.deepEqual(await textes(sans.page, "#result-suite button"), ["Étape 2 : tu connais déjà ? →", "Arrêter la séance"], "test réussi : le test du module suivant");
  assert.deepEqual(await sans.page.evaluate(() => Object.keys(window.localStorage)), ["mathsgo-defi-calcul-parcours"]);
  assert.deepEqual(sans.erreurs, []);
  await sans.contexte.close();

  const refuse = await ouvrir(navigateur, base, taille, {suivi: "refuse"});
  await refuse.page.waitForTimeout(300);
  assert.equal(await refuse.page.locator("#suivi-repere").isVisible(), true);
  assert.match(await texte(refuse.page, "#suivi-repere"), /travail gardé ici, pas encore envoyé/);
  // Le refus du serveur (400) est attendu : ce n'est pas une erreur de la page.
  refuse.erreurs.length = 0;
  await controler(refuse, taille, "31-serveur-pas-encore-pret", {bandeau: false});
  // L'appli marche quand même, et garde le travail sur l'appareil.
  await refuse.page.click("#acc-carte");
  await refuse.page.waitForTimeout(250);
  await jouerSerie(refuse.page, 12, c => c.reponse, {clavier: true});
  assert.equal(await texte(refuse.page, "#result-title"), "Tu connais déjà Compléments à 10, 100, 1 000 !");
  await refuse.page.waitForTimeout(900);
  assert.match(await texte(refuse.page, "#suivi-repere"), /impossible d’envoyer ce travail/);
  const cles = await refuse.page.evaluate(() => Object.keys(window.localStorage));
  assert.ok(cles.some(cle => /^mathsgo-defi-calcul-parcours:[0-9a-f]{16}$/.test(cle)), "la case de l'élève, sous l'empreinte de son code");
  assert.ok(cles.every(cle => !cle.includes("7K3M9P")), "aucune clé ne porte le code");
  assert.deepEqual(refuse.erreurs.filter(erreur => !/400/.test(erreur)), []);
  await refuse.contexte.close();

  // Le même état au téléphone (c'est ce que voit un élève à code jusqu'au
  // lot 2b) : la phrase passe à la ligne, rien n'est coupé, le cadre tient.
  const telephone = TOUTES_LES_TAILLES.find(t => t.telephone);
  const petit = await ouvrir(navigateur, base, telephone, {suivi: "refuse"});
  await petit.page.waitForTimeout(300);
  assert.match(await texte(petit.page, "#suivi-repere"), /travail gardé ici, pas encore envoyé/);
  const coupe = await petit.page.evaluate(() => { const r = document.querySelector("#suivi-repere .repere-texte"); return r.scrollWidth - r.clientWidth; });
  assert.ok(coupe <= 0, `au téléphone, la phrase du bandeau est coupée (${coupe} px)`);
  petit.erreurs.length = 0;
  await controler(petit, telephone, "31-serveur-pas-encore-pret", {bandeau: false});
  await petit.contexte.close();
}

(async () => {
  if (CAPTURES) fs.mkdirSync(CAPTURES, {recursive: true});
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH
    ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH}
    : {channel: "chromium"});
  const voulu = partie => !SEULEMENT || SEULEMENT.split(",").includes(partie);
  let echec = null;
  try {
    for (const taille of voulu("seance") ? TAILLES : []) {
      await seanceGuidee(navigateur, base, taille);
      console.log(`ok — la séance guidée, quatre jours, à ${taille.nom}`);
    }
    if (voulu("su")) {
      for (const taille of TAILLES) await moduleSuEtToutEnRoute(navigateur, base, taille);
      console.log("ok — « Module su ! », « Tout est en route ! », la touche « , » sur les seuls calculs à décimales");
    }
    for (const taille of voulu("prof") ? TAILLES : []) {
      await modeProfesseur(navigateur, base, taille);
      console.log(`ok — le mode professeur à ${taille.nom} : tous les menus, rien d'enregistré`);
    }
    if (voulu("prof")) {
      await rekenrekA2EtRetour(navigateur, base);
      console.log("ok — mode professeur : A2 sans manipulation, le rekenrek d'A2, « tu n'as pas multiplié », le retour du navigateur");
    }
    for (const taille of voulu("aides") ? TAILLES : []) {
      await glisseEtTableau(navigateur, base, taille);
      console.log(`ok — M2 et D2 (glisse-nombres, tableau à flèches, virgule) à ${taille.nom}`);
    }
    if (voulu("aides")) {
      await rekenrekAuClavier(navigateur, base);
      console.log("ok — le rekenrek au clavier, ses refus lus");
    }
    for (const taille of voulu("niveaux") ? TAILLES : []) {
      await tousLesNiveauxEnSeance(navigateur, base, taille);
      console.log(`ok — les 14 niveaux dans la séance, avec le bandeau et les deux fils, à ${taille.nom}`);
    }
    if (voulu("suivi")) {
      await etatsDuSuivi(navigateur, base);
      console.log("ok — sans code, et avec un serveur qui ne connaît pas encore l'appli");
    }
  } catch (erreur) {
    echec = erreur;
  }
  await navigateur.close();
  serveur.close();
  if (echec) {
    console.error(`ÉCHEC — ${echec.message}`);
    if (process.env.DEFI_CALCUL_PILE) console.error(echec.stack);
    process.exit(1);
  }
  console.log(CAPTURES ? `Captures déposées dans ${CAPTURES}` : "Défi calcul : les écrans du lot 2a sont conformes.");
})();
