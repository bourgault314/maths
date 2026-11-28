// Défi calcul, lots 3 et 3b : les écrans au navigateur (scénario d'un
// module du 30/10, décisions « rythme et mémoire » du 31/10).
//
// Hors CI : ni « npm run verifier » ni « node --test » ne lancent ce fichier.
//   npm install --no-save playwright
//   node tests/defi-calcul-ecrans.cjs
//   DEFI_CALCUL_CAPTURES=/chemin/du/dossier node tests/defi-calcul-ecrans.cjs   (dépose les captures)
//   CHROMIUM_EXECUTABLE_PATH=/chemin/chrome node tests/defi-calcul-ecrans.cjs   (un Chromium précis)
//   DEFI_CALCUL_SEULEMENT=premier-jour node tests/defi-calcul-ecrans.cjs
//   DEFI_CALCUL_TAILLE=1366 …   (une seule taille : 1366, 1440, 390x844 ou 390x664)
//
// Lot K1 « la carte » (25/11/2026) : le test en escalier, les compétences
// rouges et la mise de côté n'existent plus (remplacés par « Je tente » et
// l'étoile qui part, joués dans defi-calcul-lot-K1-ecrans.cjs) ; les scénarios
// « rouges » et « de-cote » sont retirés. « premier-jour » devient : « Je
// tente » raté, puis J'apprends du même calcul, en une étape (inchangé).
//
// Ce qui est joué (avant K1) :
//   premier-jour  l'accueil ; le test en escalier (monter, 3e calcul, ✗ sans
//                 la bonne réponse, arrêt) ; J'apprends du niveau raté TOUT
//                 DE SUITE, en une étape (lot 2 : on te montre ; perles 2
//                 justes → droite 2 justes → J'écris une fois → rien ; une
//                 erreur ramène la droite, deux les perles ; réussi à 5
//                 justes de suite) ; « ✓ Réussi ! » et À retenir ;
//   rouges        deux compétences ratées dans Mes calculs du jour : deux
//                 « Je m'entraîne encore » (droite d'abord, fini à 3 justes de
//                 suite), puis la nouveauté ;
//   de-cote       le 3e échec de suite : « mise de côté », la phrase, la
//                 nouveauté quand même.
//
// L'élève : un faux serveur de suivi RÉPOND, le bandeau « Suivi par ton
// professeur » est affiché, et c'est avec lui — et avec le fil de la
// séance — que le cadre doit tenir. Quatre tailles : 1366 × 768 en fenêtre,
// 1440 × 900 en plein écran, 390 × 844, et 390 × 664 (la hauteur visible
// d'un iPhone dans Safari). Le jour est fixé par l'horloge du navigateur.

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
  {nom: "390x844", largeur: 390, hauteur: 844, telephone: true},
  // Audit téléphone du 31/10 : la hauteur VISIBLE d'un iPhone dans Safari
  // (barre d'adresse en bas), avec le bandeau de suivi — 390 × 844 n'est
  // que la taille de l'écran.
  {nom: "390x664", largeur: 390, hauteur: 664, telephone: true}
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
      ecrit: carte ? carte.classList.contains("ecrit") || carte.classList.contains("ecrit-fini") : false,
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
      // Ce qu'écrit le fil (ronds et nom), sans la rangée de 44 px qu'il prend quand la
      // flèche monte sur sa ligne (en-tête commun, planche 16 du 31/10/2026).
      filTexte: (() => {
        const fil = document.getElementById("fil-seance");
        const boites = fil && !fil.hidden ? [...fil.children].map(e => e.getBoundingClientRect()).filter(r => r.width) : [];
        return boites.length ? Math.max(...boites.map(r => r.bottom)) - Math.min(...boites.map(r => r.top)) : 0;
      })(),
      flecheSurLeFil: document.body.classList.contains("ligne-sous-titre") && document.body.classList.contains("challenge-playing"),
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
    assert.match(m.repere, /^Suivi · Léa · 4e B · Se déconnecter$/, `${ou} : la ligne de suivi (en-tête commun, 31/10/2026)`);
    // Comme dans Défi tables : pas de logo en haut pour l'élève à code,
    // « Se déconnecter » dans la ligne, la barre DANS le cadre (en-tête commun).
    assert.equal(m.logo, null, `${ou} : pas de logo dans la barre de l'élève`);
    assert.ok(m.sortie && m.sortie.gauche >= m.bandeau.gauche && m.sortie.droite <= m.bandeau.droite + 1 && m.sortie.haut >= m.bandeau.haut - 1 && m.sortie.bas <= m.bandeau.bas + 1,
      `${ou} : « Se déconnecter » est dans le bandeau`);
    assert.ok(m.cadre && m.barre.haut >= m.cadre.haut && m.barre.bas <= m.cadre.bas, `${ou} : la barre du haut est dans le cadre blanc`);
  }
  // Le français de ce qui est affiché : une espace insécable devant : ? !
  // (après un mot ou un nombre : « + ? » est un calcul, pas une phrase).
  m.lignes.forEach(ligne => assert.doesNotMatch(ligne, /[\p{L}\d»)] [:?!]/u, `${ou} : « ${ligne} » (espace insécable devant : ? !)`));
  // Le fil de la séance est au-dessus de la barre, celui des trois temps ne le touche pas.
  if (m.filSeance && m.status) assert.ok(m.filSeance.bas <= m.status.haut + 1, `${ou} : le fil de la séance passe sur la barre`);
  // Au téléphone, le fil tient sur une ligne. Pour l'élève à code, la flèche monte sur la
  // ligne du fil (planche 16 du 31/10/2026, choix de Gwenaël) : un nom long passe alors
  // sous les ronds, comme un long titre d'écran — deux lignes au plus.
  if (taille.telephone && m.filSeance && m.filCoupable) {
    const plafond = m.flecheSurLeFil ? 56 : 30;
    assert.ok(m.filTexte <= plafond, `${ou} : au téléphone, le fil de la séance tient sur ${m.flecheSurLeFil ? "deux lignes" : "une ligne"} (${Math.round(m.filTexte)} px)`);
  }
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
    // « J'écris » (lot « relier ») : le dessin au-dessus des étapes, partout.
    if (taille.telephone || m.ecrit) assert.ok(m.aide.bas <= m.expression.haut + 1, `${ou} : l'aide est au-dessus du calcul`);
    else assert.ok(m.aide.haut >= m.expression.bas - 1 && m.aide.bas <= m.pave.haut + 1, `${ou} : l'aide est entre le calcul et le pavé`);
  }
  // Le rekenrek ne passe jamais sur le pavé ni sur le bouton du bas (iPhone, 31/10).
  for (const [nomBoite, b] of [["le pavé", m.pave], ["le bouton du bas", m.valider]]) {
    if (m.boulier && b) assert.ok(m.boulier.bas <= b.haut + 1 || m.boulier.haut >= b.bas - 1, `${ou} : le boulier passe sur ${nomBoite}`);
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


// ------------------------------------------------------------------ gestes

const entrainement = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.entrainement());
const escalier = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.escalier());
const genre = page => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.genre());
const suiteVisible = page => page.isVisible("#result-suite button.primary, #result-suite button");

// Joue un outil à manipuler (perles ou glisse-nombres) : `m` = sa fiche
// ({outil, depart, gestes} ou {outil: "glisse", decalage}).
async function manipuler(page, m) {
  if (m.outil === "perles") {
    // Les rangées comme le rekenrek les tient : on pousse dans la rangée
    // entamée (sinon la première vide), on retire de la rangée entamée
    // (sinon la dernière pleine : 50 − 6, 42 − 2 − 6, modules lot 1).
    const etats = Array.from({length: 10}, (_, r) => Math.max(0, Math.min(10, m.depart - r * 10)));
    for (const geste of m.gestes) {
      const entamee = etats.findIndex(v => v > 0 && v < 10);
      if (geste > 0) {
        const rangee = entamee >= 0 ? entamee : etats.findIndex(v => v === 0);
        await glisser(page, rangee, etats[rangee] + geste - 1, true);
        etats[rangee] += geste;
      } else {
        const rangee = entamee >= 0 ? entamee : etats.map(v => v > 0).lastIndexOf(true);
        await glisser(page, rangee, etats[rangee] + geste, false);
        etats[rangee] += geste;
      }
    }
    assert.equal((await perles(page)).fini, true, "le rekenrek est fini");
  } else {
    await page.focus(".place-value-drag-bar");
    for (let i = 0; i < Math.abs(m.decalage); i += 1) await page.keyboard.press(m.decalage > 0 ? "ArrowLeft" : "ArrowRight");
    await page.waitForTimeout(400);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
  }
}

const manipulationDuCalcul = page => page.evaluate(() => {
  const c = window.__MATHSGO_DEFI_CALCUL_TEST__.calcul();
  const m = window.MATHSGO_DEFI_CALCUL_CORE.manipulationDe(c);
  return m ? {outil: m.outil, depart: m.depart, gestes: m.gestes, decalage: m.decalage} : null;
});

// Lot C3 : avant la première apparition d'une écriture jamais montrée,
// l'écran « Un exemple » (le calcul fait, « À toi → ») ne compte pas : on le
// passe, et le calcul « À toi » qui suit est celui qu'on joue.
async function passerExemple(page) {
  const ex = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.exempleAffiche());
  if (!ex || !ex.exemple) return false;
  assert.equal(ex.bouton, "À toi\u00a0→", "l'exemple n'a qu'un bouton : « À toi → »");
  await valider(page);
  await page.waitForTimeout(500);
  return true;
}

// Un calcul d'entraînement : on passe l'exemple s'il y en a un, on manipule
// si l'outil est à manipuler, puis on répond juste (ou faux). Attend la suite.
async function repondreEntrainement(page, juste, {apresGeste = null} = {}) {
  await passerExemple(page);
  const avant = await entrainement(page);
  if (avant.outil === "manip") {
    await manipuler(page, await manipulationDuCalcul(page));
    // Le geste fait, le pavé arrive sous les perles.
    if (apresGeste) await apresGeste();
  }
  const c = await calcul(page);
  // Lot 7-0 : « Avec le dessin » à étapes — d'abord l'arrivée du premier saut.
  const premiere = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.caseDuDessin());
  if (premiere) {
    await taper(page, premiere.reponse, {clavier: true});
    await valider(page, {clavier: true});
    await page.waitForTimeout(250);
  }
  await taper(page, juste ? c.reponse : await fausse(page), {clavier: true});
  await valider(page, {clavier: true});
  await page.waitForTimeout(juste ? 1000 : 800);
  if (!juste) { await valider(page, {clavier: true}); await page.waitForTimeout(350); }
  return avant;
}

// J'apprends en une étape (lot 2, 12/11/2026, planches validées) : ① on te
// montre — le premier temps de la leçon, sur son exemple (ici, au téléphone
// et à l'ordinateur : les perles) ; ② des calculs qui changent avec les
// perles, 2 justes ; ③ avec la droite, 2 justes ; ④ J'écris de la leçon, une
// fois (les étapes, le dessin qui se remplit) ; ⑤ sans aide (une erreur : la
// droite revient ; deux : les perles), 5 justes de suite ; ⑥ « ✓ Réussi ! »
// et À retenir sur le même écran.
const moment = page => page.evaluate(() => {
  const f = document.getElementById("seance-fil");
  return f.hidden ? "" : (f.querySelector("b") || f).textContent.trim();
});
async function jouerApprendsEnUneEtape(page, cle, ecran) {
  const a = await page.evaluate(c => {
    const x = window.MATHSGO_DEFI_CALCUL_CORE.niveauDe(c).niveau.apprends;
    return {
      manipule: x.manipule ? {outil: x.manipule.outil, depart: x.manipule.depart, gestes: x.manipule.gestes, decalage: x.manipule.decalage, texte: x.manipule.texte} : null,
      represente: {reponse: x.represente.reponse, texte: x.represente.texte},
      ecris: {etapes: (x.ecris.etapes || []).map(e => e.reponse), reponse: x.ecris.reponse, texte: x.ecris.texte,
        derniere: x.ecris.etapes.length ? x.ecris.etapes[x.ecris.etapes.length - 1].texte : ""}
    };
  }, cle);
  // ① On te montre. Lot « relier » : le boulier reporte chaque geste sur une
  // droite au-dessus — rien avant le geste, un saut par geste après.
  const sautsDuBoulier = () => page.evaluate(() => document.querySelectorAll(".perles-droite path[marker-end]").length);
  assert.equal(await moment(page), "On te montre", `${cle} : ① on te montre`);
  await ecran("apprends-montre", {jeu: true});
  if (a.manipule.outil === "perles") assert.equal(await sautsDuBoulier(), 0, `${cle} : la droite du boulier attend le premier geste`);
  await manipuler(page, a.manipule);
  if (a.manipule.outil === "perles") assert.equal(await sautsDuBoulier(), a.manipule.gestes.length, `${cle} : un saut par geste sur la droite du boulier`);
  await valider(page);
  await page.waitForTimeout(400);
  // ② et ③ : des calculs qui changent, jamais ceux de la leçon.
  assert.equal(await genre(page), "apprends");
  const outils = [];
  const vus = [];
  await ecran("apprends-perles", {jeu: true});
  assert.equal(await moment(page), "Avec les perles");
  for (let i = 0; i < 4; i += 1) {
    if (i === 2) assert.equal(await moment(page), "Avec le dessin");
    // Au téléphone, le geste fait, le pavé arrive sous les perles (le bug
    // vu sur iPhone le 31/10 : le boulier restait grand, sur le pavé).
    const apresGeste = i === 1 && ecran.telephone ? () => ecran("apprends-perles-apres-geste", {jeu: true, pave: true}) : null;
    vus.push((await calcul(page)).texte);
    outils.push((await repondreEntrainement(page, true, {apresGeste})).outil);
  }
  assert.deepEqual(outils, ["manip", "manip", "image", "image"], "perles 2 justes, puis la droite 2 justes");
  assert.ok(!vus.includes(a.represente.texte) && !vus.includes(a.ecris.texte), `${cle} : jamais un calcul de la leçon`);
  // ④ J'écris, une fois : ses étapes (lot 3c : sur un calcul tiré), le dessin qui se remplit.
  assert.equal(await entrainement(page), null, `${cle} : J'écris n'est pas un calcul de la série`);
  assert.equal(await moment(page), "J’écris");
  await ecran("apprends-ecris", {jeu: true, pave: true, image: true});
  const dessin = () => page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.dessin());
  const dessins = [await dessin()];
  assert.ok(dessins[0], `${cle} : J'écris montre son dessin`);
  assert.ok(await page.evaluate(() => document.getElementById("aide").getBoundingClientRect().bottom <= document.getElementById("expression").getBoundingClientRect().top + 1),
    `${cle} : le dessin est au-dessus des étapes`);
  // Lot 3c : J'écris tire son calcul (de la sorte de la leçon) — on lit
  // ses étapes à l'écran ; ce n'est pas celui de la leçon.
  const enCours = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.ecrisEnCours());
  assert.ok(enCours && enCours.length, `${cle} : J'écris a ses étapes`);
  assert.notEqual(enCours[enCours.length - 1].texte, a.ecris.derniere, `${cle} : J'écris tire un autre calcul que la leçon`);
  const reponses = enCours.map(etape => etape.reponse);
  for (const r of reponses) {
    await taper(page, r, {clavier: true});
    await valider(page, {clavier: true});
    await page.waitForTimeout(250);
    dessins.push(await dessin());
  }
  assert.notEqual(dessins[dessins.length - 1], dessins[0], `${cle} : le dessin s'est rempli`);
  await ecran("apprends-ecris-fini", {image: true});
  await page.waitForTimeout(1200);
  assert.equal(await texte(page, "#validate"), "Suivant", `${cle} : J'écris fini, « Suivant »`);
  assert.equal(await page.isVisible("#question-card.ecrit-fini"), true, `${cle} : J'écris fini reste à l'écran`);
  await valider(page);
  await page.waitForTimeout(600);
  // ⑤ Sans aide (lot C3 : « 9 + □ = 12 », jamais montré par la leçon, arrive
  // ici ; son exemple passe d'abord, puis « À toi »).
  await passerExemple(page);
  assert.equal((await entrainement(page)).outil, "aucun", "puis plus rien");
  assert.equal(await moment(page), "Sans aide");
  await ecran("apprends-sans-aide", {jeu: true, pave: true});
  // Une erreur : la droite revient ; deux de suite : les perles.
  await repondreEntrainement(page, false);
  assert.equal((await entrainement(page)).outil, "image");
  await repondreEntrainement(page, false);
  assert.equal((await entrainement(page)).outil, "manip");
  await ecran("apprends-perles-apres-erreurs", {jeu: true});
  await repondreEntrainement(page, true);
  assert.equal((await entrainement(page)).outil, "image", "après ces perles-là, un juste : la droite");
  await repondreEntrainement(page, true);
  assert.notEqual(await moment(page), "J’écris", "J'écris ne revient pas");
  // 5 justes de suite sans outil (et toutes les sortes vues).
  for (let i = 0; i < 25 && await genre(page) === "apprends" && await entrainement(page); i += 1) await repondreEntrainement(page, true);
  await page.waitForTimeout(800);
}

async function boutonSuite(page) {
  return (await page.locator("#result-suite button").first().textContent()).replace(/[  ]/g, " ").trim();
}
async function cliquerSuite(page) {
  await page.locator("#result-suite button").first().click();
  await page.waitForTimeout(700);
}

// ------------------------------------------------------------------ premier jour
//
// Lot K1 : Léa a gagné les deux premières étoiles ce matin (elles reviennent
// demain) ; « Commencer » la met sur « Je tente : Différences et trous
// jusqu'à 20 », qu'elle rate (deux faux) ; elle l'apprend tout de suite.
async function premierJour(navigateur, base, taille) {
  const jour = "2026-11-02";
  const CARTE = require(path.join(RACINE, "outils/calcul_mental/defi_calcul_core.js")).carte();
  const six = Array.from({length: 6}, () => ({juste: true, ms: 2000}));
  const depart = ["A1-1", "A1-2"].reduce((q, cle) => P.appliquerTentative(q, {module: "A1", niveau: Number(cle.slice(3)), reponses: six}, {aujourdhui: jour, carte: CARTE}).parcours, P.creerParcours());
  const session = await ouvrir(navigateur, base, taille, {jour, parcours: depart});
  const {page} = session;
  const ecran = (nom, options) => controler(session, taille, `jour1-${nom}`, options);
  await ecran("accueil");
  assert.match(await texte(page, "#acc-but-texte"), /Différences et trous jusqu’à 20/, "le but du jour");
  await page.click("#carte-continuer");
  await page.waitForTimeout(600);
  assert.equal(await genre(page), "tente");
  // Deux faux : ✗ sans la bonne réponse, puis l'arrêt.
  let c = await calcul(page);
  const sansReponse = (await texte(page, "#expression")).replace(/\s/g, "");
  await taper(page, c.reponse + 1); await valider(page); await page.waitForTimeout(250);
  assert.equal(await texte(page, "#answer-feedback"), "✗ Pas juste", "« Je tente » : un faux, ✗, sans la bonne réponse");
  // La case garde la réponse tapée (fausse) — la bonne n'est écrite nulle part.
  assert.equal(await texte(page, "#inline-answer"), String(c.reponse + 1), "la case garde la réponse tapée");
  assert.equal((await texte(page, "#expression")).replace(/\s/g, "").length, sansReponse.length + String(c.reponse + 1).length, "rien d'autre n'est écrit dans le calcul");
  await ecran("tente-faux", {jeu: true});
  await page.waitForTimeout(1200);
  c = await calcul(page); await taper(page, c.reponse + 1); await valider(page); await page.waitForTimeout(1500);
  assert.match(await texte(page, "#result-suite"), /^Ce calcul, on l’apprend ensemble\. ?Différences et trous jusqu’à 20/);
  assert.equal(await boutonSuite(page), "J’apprends");
  await ecran("tente-rate");
  await cliquerSuite(page);
  const ecranApprends = (nom, options) => ecran(nom, options);
  ecranApprends.telephone = taille.telephone;
  await jouerApprendsEnUneEtape(page, "A1-3", ecranApprends);
  // ⑥ Réussi : « ✓ Réussi ! » et À retenir sur le même écran (planche 3) ;
  // l'étoile est gagnée (lot K1).
  assert.equal(await texte(page, "#retenir-reussi"), "✓ Réussi ! Différences et trous jusqu’à 20 revient demain.");
  assert.equal(await page.isVisible("#result-retenir"), true);
  assert.equal(await page.isVisible("#result-verdict"), false, "plus d'écran « Entraînement réussi ! »");
  assert.equal(await texte(page, "#retenir-cahier"), "Je recopie cela dans mon cahier.", "À retenir, avec son schéma");
  assert.equal(await page.locator("#retenir-image > svg").count(), 1, "le schéma du calcul montré");
  assert.equal(await page.locator("#retenir-image .dc-coeur").count(), 0, "pas de carte : A1-3 est une procédure");
  assert.match(await boutonSuite(page), /^Continuer ?Ensuite : /, "la séance continue (l'horloge de la page est arrêtée)");
  await ecran("apprends-retenir");
  const e = await page.evaluate(() => window.__MATHSGO_DEFI_CALCUL_TEST__.carte().etages[0].lignes.flatMap(l => l.etoiles).find(x => x.cle === "A1-3"));
  assert.equal(e.etat, "gagnee", "J'apprends réussi : l'étoile est gagnée");
  await page.waitForTimeout(800);
  assert.deepEqual(session.erreurs, []);
  await session.contexte.close();
}

// (Lot K1 : « rouges » et « de-cote » retirés — voir l'en-tête.)

// ------------------------------------------------------------------ lancement
const voulu = nom => !SEULEMENT || SEULEMENT.split(",").includes(nom);

(async () => {
  if (CAPTURES) fs.mkdirSync(CAPTURES, {recursive: true});
  const serveur = await servir();
  const base = `http://127.0.0.1:${serveur.address().port}`;
  const navigateur = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {});
  let echec = null;
  try {
    for (const taille of TAILLES) {
      if (voulu("premier-jour")) { await premierJour(navigateur, base, taille); console.log(`ok — premier jour (« Je tente » raté, J'apprends en une étape tout de suite) à ${taille.nom}`); }
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
  console.log(CAPTURES ? `Captures déposées dans ${CAPTURES}` : "Défi calcul : les écrans des lots 3 et 3b sont conformes.");
})();
