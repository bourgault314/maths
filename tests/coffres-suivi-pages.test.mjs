// Lot « Coffres magiques sur le suivi » (21/10/2026) : l'appli solo sous un
// code. Ces tests EXÉCUTENT l'amorce du <head>, l'habillage
// (assets/js/coffres-suivi.js) et les fonctions de démarrage de l'élève telles
// qu'elles sont écrites dans la page, dans un faux onglet
// (tests/coffres-suivi-monde.mjs) ; et ils épinglent ce que la page promet :
// les scripts chargés, l'en-tête du modèle commun, les textes validés par
// Gwenaël (maquettes 04 à 10), et « sans code, rien ne change ».

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {PARCOURS, PAGE, SOURCE_SUIVI, fauxStockage, fauxServeur, fauxTemps, tic, A, partieSix, parcoursAvecTresors, fauxOnglet, source, lire} from "./coffres-suivi-monde.mjs";

const LEA = {prenom: "Léa", classe: "CM1"};

// ------------------------------------------------------------------ l'amorce

const AMORCE = [...PAGE.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])[0];

function amorcer(hash, search = "", codeOnglet = "") {
  const remplacees = [];
  const ecouteurs = {};
  const fenetre = {
    location: {hash, pathname: "/outils/calcul_mental/coffres_magiques_solo.html", search, rechargee: 0, reload() { this.rechargee += 1; }},
    history: {replaceState(_e, _t, url) { remplacees.push(url); }},
    addEventListener(type, fn) { ecouteurs[type] = fn; },
    document: {documentElement: {className: "js"}},
    sessionStorage: fauxStockage(codeOnglet ? {"mathsgo-suivi-code": codeOnglet} : {})
  };
  new Function("window", AMORCE)(fenetre);
  return {entree: fenetre.MATHSGO_ENTREE, remplacees, fenetre, ecouteurs, classes: fenetre.document.documentElement.className.split(" ")};
}

test("l'amorce du <head> est en JavaScript ancien, avant tout autre script, et ne nomme pas le code", () => {
  const tete = PAGE.slice(0, PAGE.indexOf("</head>"));
  const premierScriptCharge = PAGE.search(/<script\b[^>]*\bsrc=/);
  assert.ok(tete.indexOf(AMORCE) > 0 && premierScriptCharge > 0 && PAGE.indexOf(AMORCE) < premierScriptCharge, "l'amorce passe avant les scripts chargés");
  const code = AMORCE.replace(/\/\/[^\n]*/g, "");
  assert.doesNotMatch(code, /\b(const|let)\b|=>|URLSearchParams|\?\./, "ES5 : il faut qu'elle tourne partout");
  assert.doesNotThrow(() => new vm.Script(AMORCE));
});

test("#b=… sort de l'adresse avant tout, devient l'entrée de la page, et l'en-tête de l'élève est posé dès le <head>", () => {
  const a = amorcer("#b=0123456789abcdef0123456789abcdef");
  assert.equal(a.entree.billet, "0123456789abcdef0123456789abcdef");
  assert.deepEqual(a.remplacees, ["/outils/calcul_mental/coffres_magiques_solo.html"], "plus rien dans le fragment");
  assert.ok(a.classes.includes("suivi-eleve") && a.classes.includes("suivi-attente"), "l'en-tête de l'élève, et l'attente, sans clignotement");
  const sans = amorcer("");
  assert.equal(sans.entree.billet, "");
  assert.deepEqual(sans.classes, ["js"], "sans code : rien ne change");
  const onglet = amorcer("", "?mode=solo", A);
  assert.ok(onglet.classes.includes("suivi-eleve"), "un code déjà dans l'onglet (F5) : l'en-tête de l'élève");
  assert.deepEqual(onglet.remplacees, [], "l'adresse ne bouge pas");
});

test("un code tapé dans l'adresse n'ouvre rien, il est seulement effacé ; un #b= sur une page ouverte recharge", () => {
  const a = amorcer("#code=" + A);
  assert.equal(a.entree.billet, "");
  assert.deepEqual(a.remplacees, ["/outils/calcul_mental/coffres_magiques_solo.html"]);
  assert.deepEqual(a.classes, ["js"]);
  const b = amorcer("");
  b.fenetre.location.hash = "#b=abc";
  b.ecouteurs.hashchange();
  assert.equal(b.fenetre.location.rechargee, 1);
});

// ------------------------------------------------------------------ la page

test("la page charge le moteur et l'habillage du suivi, avec une version, après le moteur des plateaux", () => {
  assert.match(PAGE, /<script src="\.\.\/\.\.\/assets\/js\/coffres-moteur\.js\?v=\d+"><\/script>\s*<!--[\s\S]*?-->\s*<script src="\.\.\/\.\.\/assets\/js\/coffres-parcours\.js\?v=\d{8}-\d+"><\/script>\s*<script src="\.\.\/\.\.\/assets\/js\/code-en-cases\.js\?v=\d{8}-\d+"><\/script>\s*<script src="\.\.\/\.\.\/assets\/js\/coffres-suivi\.js\?v=\d{8}-\d+"><\/script>/);
  assert.doesNotMatch(PAGE, /<script[^>]+src="https?:\/\//, "aucun script d'un autre domaine");
});

test("l'en-tête du modèle commun : le lien, le bloc, la pastille ; le logo, « Calcul mental » et « Réglages » cachés pour l'élève", () => {
  assert.match(PAGE, /<a class="retour-espace" id="lien-retour" href="https:\/\/suivi\.mathsgo\.re\/" aria-label="Retour à mon espace" hidden>/);
  assert.match(PAGE, /<p id="suivi-repere" class="suivi-repere" hidden><\/p>/);
  assert.match(PAGE, /<span id="suivi-pastille-slot"><\/span>/);
  assert.match(PAGE, /html\.suivi-eleve \.topbar > \.brand,\s*html\.suivi-eleve \.topbar \.back-link\[data-origin-link\],\s*html\.suivi-eleve \.mode-switch-button,\s*html\.suivi-eleve \.mode-options \{ display: none; \}/);
  // En-tête commun (31/10/2026) : hors de l'accueil, la pastille à la place de la ligne ; au
  // téléphone, le plein écran sur le jeu seulement.
  assert.match(PAGE, /html\.suivi-eleve body:not\(\.ec-dans-carte\) \.topbar \.suivi-repere \{ display: none; \}/, "la ligne : sur l'accueil seulement (dans la carte)");
  assert.match(PAGE, /html\.suivi-eleve body:not\(\.ecran-jeu\) \.topbar \.fullscreen-toggle \{ display: none; \}/, "au téléphone, Plein écran sur le jeu seulement");
  assert.doesNotMatch(PAGE, /html\.suivi-eleve #suivi-pastille-slot \{ display: none; \}/, "la pastille sur le mémo et le jeu, à toutes les tailles");
  assert.match(PAGE, /#suivi-pastille-slot:empty \{ display: none; \}/, "sans pastille, aucun écart dans la barre du visiteur");
});

// Lot 2 « pieds des applis » (24/10/2026) : « ← Mon espace » sur l'accueil de
// l'appli ; dans l'appli, « ← Niveaux » en haut à gauche du cadre blanc (mémo et
// jeu). En-tête commun (variante A, planches du 31/10/2026) : sur l'accueil, plus
// de barre au-dessus — la flèche ronde, le titre « Calcul mental / Coffres
// magiques », le plein écran rond et la ligne « ● Suivi · Léa · CM1 · Se
// déconnecter » entrent DANS la carte (placerEnTete) ; le mémo et le jeu gardent
// la pastille « ● Léa » et Plein écran. Mesuré au navigateur dans
// tests/en-tete-commun.test.mjs.
test("l'en-tête commun : sur l'accueil, la flèche, le titre, le plein écran et la ligne DANS la carte ; « ← Niveaux » dans le cadre ailleurs", () => {
  assert.match(PAGE, /<a class="retour-espace" id="lien-retour" href="https:\/\/suivi\.mathsgo\.re\/" aria-label="Retour à mon espace" hidden><svg[^>]*>[\s\S]*?<\/svg><span class="retour-espace-texte">Mon espace<\/span><\/a>/);
  assert.match(PAGE, /html\.suivi-eleve body\.accueil-appli \.retour-espace \{ display: inline-flex; \}/, "« ← Mon espace » : sur l'accueil de l'appli seulement");
  assert.match(PAGE, /html\.suivi-eleve body\.ec-dans-carte \.topbar \{ display: none; \}/, "plus de barre au-dessus de la carte");
  assert.match(PAGE, /html\.suivi-eleve body\.ec-dans-carte \.ec-haut \{ display: grid; grid-template-columns: minmax\(44px, 1fr\) auto minmax\(44px, 1fr\);\s*grid-template-areas: "g t d" "l l l";/);
  assert.match(PAGE, /<div class="ec-haut"><div class="ec-titre"><p class="eyebrow">Calcul mental<\/p><p class="ec-nom">Coffres magiques<\/p><\/div><\/div>/);
  assert.match(PAGE, /html\.suivi-eleve body\.ec-dans-carte \.mode-dialog-card #mode-title \{\s*position: absolute; width: 1px; height: 1px;/, "le titre de la carte reste lu, pas vu");
  const placer = source("placerEnTete");
  assert.match(placer, /const accueil = modeEleve\(\) && document\.body\.classList\.contains\("accueil-appli"\);/);
  assert.match(placer, /enTete\.prepend\(lienRetour\)[\s\S]*\.after\(pleinEcran\)[\s\S]*enTete\.append\(repere\)/, "les MÊMES éléments, déplacés");
  assert.match(placer, /barreHaut\.querySelector\("\.brand"\)\.after\(lienRetour\);[\s\S]*lienRetour\.after\(repere\);[\s\S]*actionsHaut\.append\(pleinEcran\);/, "et rendus à la barre ailleurs");
  // les deux boutons « ← Niveaux » : dans le cadre du jeu et dans la carte du mémo
  const boutons = PAGE.match(/<button class="retour-cadre" type="button" data-retour-choix aria-label="Retour au choix du niveau"><svg[^>]*>[\s\S]*?<\/svg><span class="retour-cadre-texte">Niveaux<\/span><\/button>/g) || [];
  assert.equal(boutons.length, 2);
  assert.match(PAGE, /<main class="solo-page">\s*<button class="retour-cadre"/);
  assert.match(PAGE, /<div class="dialog-card learn-card">\s*<button class="retour-cadre"/);
  assert.match(PAGE, /html\.suivi-eleve body\.retour-dans-cadre \.retour-cadre \{ display: inline-flex; \}/);
  // qui est où : l'accueil (le choix, ou tout quand il n'y a rien à choisir), le cadre ailleurs
  const ecran = source("majEcran");
  assert.match(ecran, /classList\.toggle\("accueil-appli", eleve && \(!choixPossible \|\| surLeChoix\)\)/);
  assert.match(ecran, /classList\.toggle\("retour-dans-cadre", choixPossible && !surLeChoix\)/);
  // Lot « le chemin des coffres » (09/11/2026) : « Tes coffres » est l'accueil de l'élève
  // connecté ; le choix du niveau s'ouvre de là, et sa flèche y ramène (seul clic
  // intercepté sur le lien) ; « ← Coffres » dans le cadre du mémo et du jeu.
  assert.match(ecran, /if \(cheminActif\(\)\) \{[\s\S]*?const accueil = !chemin\.hidden \|\| surLeChoix;\s*document\.body\.classList\.toggle\("accueil-appli", accueil\);\s*document\.body\.classList\.toggle\("retour-dans-cadre", !accueil\);/);
  assert.match(PAGE, /lienRetour\.addEventListener\("click", event => \{\s*if \(!cheminActif\(\) \|\| !chemin\.hidden \|\| modeDialog\.hidden && confirmZero\.hidden\) return;\s*event\.preventDefault\(\);/,
    "le lien n'est détourné QUE sur le choix du niveau ouvert depuis « Tes coffres »");
  assert.match(PAGE, /document\.querySelectorAll\("\[data-retour-choix\]"\)\.forEach\(bouton => \{\s*bouton\.addEventListener\("click", \(\) => \{\s*if \(cheminActif\(\)\) \{\s*dialogs\.close\(lesson, \{ restoreFocus: false \}\);\s*ouvrirChemin\(\);\s*return;\s*\}\s*if \(!modeEleve\(\) \|\| !aUnChoix\(\)\) return;/);
});

test("les textes validés par Gwenaël : le choix, le mémo, les réglages changés, la confirmation", () => {
  assert.match(PAGE, /<div id="reglages-changes-choix" class="reglages-changes" role="status" hidden><strong>Ton professeur a changé les réglages\.<\/strong>Ta partie repart à 0 clé\.<br>Tu gardes tes trésors\.<\/div>/);
  assert.match(PAGE, /<div id="reglages-changes-memo" class="reglages-changes" role="status" hidden><strong>Ton professeur a changé les réglages\.<\/strong>Ta partie repart à 0 clé\.<br>Tu gardes tes trésors\.<\/div>/);
  assert.doesNotMatch(PAGE, /restent acquis/, "« Tu gardes tes trésors. », pas « Tes trésors restent acquis. »");
  assert.match(PAGE, /<h2 id="confirm-zero-title" tabindex="-1">Repartir à zéro clé \?<\/h2>\s*<p>Tu as <strong id="confirm-zero-cles">6 clés<\/strong>\. Avec ces nouveaux réglages, tu repartiras à <strong>0 clé<\/strong>\.<\/p>\s*<p>Tu gardes tes trésors\.<\/p>/);
  assert.match(PAGE, /id="confirm-zero-garder"[^>]*>Garder ma partie<\/button>/);
  assert.match(PAGE, /id="confirm-zero-repartir"[^>]*>Repartir à 0 clé<\/button>/);
  assert.match(PAGE, /<p id="lesson-subline" class="lesson-subline"><\/p>/);
  assert.match(source("openLesson"), /`Coffres magiques · niveau \$\{level\} · \$\{PARCOURS\.nommerOperations\(selectedOperations\)\}`/);
  assert.match(source("appliquerReglagesEleve"), /document\.querySelector\("#mode-title"\)\.textContent = "Coffres magiques";/);
  assert.match(source("appliquerReglagesEleve"), /\.textContent = "Continuer";/);
  // « Trésor ouvert ! » : le lien ramène à Mon espace (choix de Gwenaël, 21/10/2026).
  assert.match(source("majLiensRetour"), /link\.href = adresseEspace\(\);[\s\S]*"Mon espace"/);
});

test("chaque geste du jeu est noté dans la case de l'élève par le moteur, jamais les calculs", () => {
  assert.match(source("resolve"), /keys \+= 1;\s*updateCounter\(\);\s*suiviEcrire\(\(P, avant\) => P\.noterCle\(avant, mode\)\);/);
  assert.match(source("resolve"), /\} else \{\s*suiviEcrire\(\(P, avant\) => P\.noterErreur\(avant, mode\)\);/);
  assert.match(source("openHelp"), /suiviEcrire\(\(P, avant\) => P\.noterAide\(avant, mode\)\);/);
  assert.match(source("showSolution"), /suiviEcrire\(\(P, avant\) => P\.noterSolution\(avant, mode\)\);/);
  assert.match(source("complete"), /suiviEcrire\(\(P, avant\) => P\.noterTresor\(avant, null, \{ niveau: gameLevel \}\)\);/);
  assert.match(source("start"), /suiviEcrire\(\(P, avant\) => P\.commencerPartie\(avant, \{ niveau: level, ops: selectedOperations, serie: modes, familles: familyPlan \}\)\);/);
  assert.match(source("suiviEcrire"), /if \(SUIVI && SUIVI\.actif\(\) && !libre\) SUIVI\.ecrire\(maj\);/, "rien sans code, rien en entraînement libre");
  assert.doesNotMatch(source("resolve"), /noterCle\(avant, mode, [^)]*values/, "jamais les nombres du plateau");
});

test("la reprise reprend la partie telle quelle (série, familles, clés) sur un plateau neuf, sans la renoter", () => {
  const s = source("start");
  assert.match(s, /if \(reprise && PARCOURS\) \{[\s\S]*level = reprise\.niveau;[\s\S]*modes = reprise\.serie\.map\(cle\);[\s\S]*familyPlan = reprise\.familles\.slice\(\);[\s\S]*keys = reprise\.cles;/);
  const brancheReprise = s.slice(s.indexOf("if (reprise && PARCOURS) {"), s.indexOf("} else {"));
  assert.doesNotMatch(brancheReprise, /suiviEcrire/, "reprendre n'écrit rien : la partie est déjà celle de la case");
  assert.match(s, /makeChallenge\(\);/, "un plateau neuf");
});

test("« ← Coffres » ramène à « Tes coffres » (élève connecté) ; sinon « ← Niveaux » au choix ; « ← Mon espace » mène à Mon espace", () => {
  assert.match(PAGE, /if \(cheminActif\(\)\) \{\s*dialogs\.close\(lesson, \{ restoreFocus: false \}\);\s*ouvrirChemin\(\);\s*return;\s*\}\s*if \(!modeEleve\(\) \|\| !aUnChoix\(\)\) return;\s*dialogs\.close\(lesson, \{ restoreFocus: false \}\);\s*openModeDialog\(\{ mandatory: !gameStarted \}\);/);
  assert.match(source("majEcran"), /texte\.textContent = cheminActif\(\) \? "Coffres" : "Niveaux";/);
  assert.equal((PAGE.match(/lienRetour\.addEventListener/g) || []).length, 1, "un seul détour du lien du haut : le choix du niveau");
});

// ------------------------------------------------- le démarrage de l'élève, exécuté

// Les fonctions de démarrage de la page, avec un faux SUIVI et de faux écrans.
function demarrage({partie = null, reglages = {niveaux: null, operations: null}, actif = true, level = 1, operations = ["sum", "difference", "product", "quotient"]} = {}) {
  const journal = [];
  const ecrits = [];
  const SUIVI = {
    actif: () => actif, attente: () => false,
    client: {entreeRefusee: null, partieEnCours: () => partie, reglagesOuverts: () => reglages},
    ecrire: maj => { ecrits.push(maj(PARCOURS, PARCOURS.commencerPartie(PARCOURS.creer(), partie || {}))); }
  };
  const code = `
    const PARCOURS = moteur, settingsCore = settings;
    let level = ${level}, selectedOperations = ${JSON.stringify(operations)}, gameStarted = false;
    const documentElement = {classList: {remove: c => journal.push("retire:" + c)}};
    const document = {documentElement};
    function majSuivi() { journal.push("majSuivi"); }
    function start(o) { journal.push("start:" + JSON.stringify(o)); }
    function openModeDialog(o) { journal.push("choix:" + JSON.stringify(o)); }
    function openLesson() { journal.push("memo"); }
    function ouvrirChemin() { journal.push("chemin"); }
    ${["cheminActif", "modeEleve", "reglagesClasse", "niveauxOuverts", "operationsOuvertes", "aUnChoix", "suiviEcrire", "ramenerAuxReglages", "demarrerEleve"].map(n => source(n)).join("\n")}
    demarrerEleve();
    return {level, selectedOperations, reglagesChanges};`;
  const etat = new Function("moteur", "settings", "SUIVI", "journal", code.replace("let level =", "let reglagesChanges = false, libre = false;\n    let level ="))(
    PARCOURS, {OPERATIONS: PARCOURS.CLES_OPERATIONS.slice()}, SUIVI, journal);
  return {journal, ecrits, etat};
}

// Lot « le chemin des coffres » (09/11/2026) : l'élève connecté arrive TOUJOURS sur
// « Tes coffres » (une partie en cours s'y reprend : « Reprendre · 6 clés sur 10 »).
test("démarrage : une partie en cours compatible est gardée ; l'élève arrive sur ses coffres", () => {
  const d = demarrage({partie: partieSix(), reglages: {niveaux: [1, 2], operations: [1, 3]}});
  assert.deepEqual(d.journal, ["retire:suivi-attente", "majSuivi", "chemin"]);
  assert.equal(d.ecrits.length, 0, "rien n'est oublié ni réécrit");
});

test("démarrage : le niveau fermé (ou une opération retirée) — la partie est abandonnée, l'élève le lira, puis ses coffres", () => {
  const d = demarrage({partie: partieSix(), reglages: {niveaux: [1, 3], operations: null}});
  assert.deepEqual(d.journal.slice(2), ["chemin"]);
  assert.equal(d.ecrits.length, 1, "la partie est oubliée dans la case");
  assert.equal("partie" in d.ecrits[0], false);
  assert.equal(d.etat.reglagesChanges, true);
  assert.equal(d.etat.level, 1, "un niveau ouvert");
  const retiree = demarrage({partie: partieSix(), reglages: {niveaux: null, operations: [1, 2]}, level: 2, operations: ["sum", "product"]});
  assert.equal(retiree.etat.reglagesChanges, true);
  assert.deepEqual(retiree.etat.selectedOperations, ["sum"], "les opérations ramenées à ce qui est ouvert");
  assert.deepEqual(retiree.journal.slice(2), ["chemin"]);
});

test("démarrage : sans partie — ses coffres, avec les réglages ramenés à ce que la classe a d'ouvert", () => {
  const choix = demarrage({reglages: {niveaux: [1, 2], operations: [1, 3]}});
  assert.deepEqual(choix.journal.slice(2), ["chemin"]);
  assert.deepEqual(choix.etat.selectedOperations, ["sum", "product"]);
  const seul = demarrage({reglages: {niveaux: [2], operations: [1]}, level: 1});
  assert.deepEqual(seul.journal.slice(2), ["chemin"], "même sans rien à choisir : ses coffres d'abord");
  assert.equal(seul.etat.level, 2, "le seul niveau ouvert, sélectionné d'office");
  assert.deepEqual(seul.etat.selectedOperations, ["sum"]);
  assert.equal(seul.etat.reglagesChanges, false);
  const unNiveau = demarrage({reglages: {niveaux: [3], operations: null}});
  assert.equal(unNiveau.etat.level, 3);
});

test("démarrage : billet refusé (personne n'est suivi) — le choix, tout ouvert, rien n'est écrit", () => {
  const d = demarrage({actif: false, partie: partieSix(), reglages: {niveaux: null, operations: null}});
  assert.deepEqual(d.journal.slice(2), ['choix:{"mandatory":true}']);
  assert.equal(d.ecrits.length, 0);
});

// ------------------------------------------------------------- l'habillage, exécuté

test("habillage : sans moteur, rien — la page joue comme avant", () => {
  const o = fauxOnglet({sansMoteur: true});
  assert.equal(o.fenetre.MathsGoCoffresSuivi.creer({}), null);
});

test("habillage : sans code, rien ne se voit ; sous un code, la ligne « Suivi · Léa · CM1 · Se déconnecter » (en-tête commun, 31/10/2026), la pastille ; plus de pied (24/10/2026)", async () => {
  const sans = fauxOnglet();
  const s = sans.fenetre.MathsGoCoffresSuivi.creer({});
  assert.equal(s.actif(), false);
  assert.equal(s.pastilleHtml(), "");
  const bloc = sans.document.createElement("p");
  s.dessinerBloc(bloc);
  assert.equal(bloc.hidden, true);
  // Plus de pied de page dans les applis (24/10/2026) : l'habillage ne sait plus en dessiner.
  assert.equal(s.dessinerPied, undefined);
  assert.equal(sans.document.documentElement.className.includes("suivi-eleve"), false);

  const serveur = fauxServeur({identite: Object.assign({reglages: {}}, LEA)});
  const avec = fauxOnglet({codeOnglet: A, identite: LEA, fetch: serveur.fetch});
  const h = avec.fenetre.MathsGoCoffresSuivi.creer({});
  assert.equal(h.actif(), true);
  await h.lancer();
  await tic(20);
  assert.ok(avec.document.documentElement.className.includes("suivi-eleve"));
  const b = avec.document.createElement("p");
  h.dessinerBloc(b);
  assert.equal(b.hidden, false);
  assert.equal(b.texte.replace(/\s+/g, " ").trim(), "Suivi · Léa · CM1 · Se déconnecter", "« Suivi par ton professeur » devient « Suivi » (le titre de la pastille garde le texte entier)");
  const sortie = b.descendants().find(n => n.tagName === "BUTTON");
  assert.equal(sortie.textContent, "Se déconnecter");
  assert.match(h.pastilleHtml(), /class="suivi-pastille" title="Suivi par ton professeur · Léa · CM1"[^>]*><i aria-hidden="true"><\/i><span class="nom">Léa<\/span>/);
  assert.ok(avec.document.head.descendants().some(n => n.id === "suivi-coffres-style"), "le style de l'habillage est posé");
  // « Se déconnecter » : ce qui restait part, l'onglet oublie le code, retour à l'espace.
  sortie.declencher("click");
  assert.deepEqual(avec.fenetre.allees, ["https://suivi.mathsgo.re/?oublier=1"]);
  assert.equal(avec.session.getItem(PARCOURS.CLE_CODE), null);
});

test("habillage : ecrire() repart de la case telle qu'elle est, et sous un code le travail part au serveur", async () => {
  const serveur = fauxServeur({identite: Object.assign({reglages: {}}, LEA)});
  const o = fauxOnglet({codeOnglet: A, identite: LEA, fetch: serveur.fetch});
  const h = o.fenetre.MathsGoCoffresSuivi.creer({});
  await h.lancer();
  await tic(20);
  h.ecrire((P, avant) => P.commencerPartie(avant, {niveau: 1, ops: [1], serie: new Array(10).fill(1)}));
  h.ecrire((P, avant) => P.noterCle(avant, "sum"));
  await tic(20);
  assert.equal(o.caseDe(A).partie.cles, 1);
  assert.equal(o.envois().length >= 1, true);
  assert.equal(serveur.etat(A).parcours.partie.cles, 1);
  assert.equal(h.ecrire(() => null), null, "un geste qui ne rend rien n'écrit rien");
});

test("habillage : le style ne colore jamais du texte en clair sur fond clair, et la mention du site est retenue pour l'élève", () => {
  assert.match(SOURCE_SUIVI, /\.suivi-pastille\{[^}]*background:#eef6f6;color:#0b5f5c;/);
  assert.match(SOURCE_SUIVI, /\.suivi-pastille\.hors-ligne\{background:#fdf0e3;color:#8a4c0a;/);
  assert.match(SOURCE_SUIVI, /\.suivi-pastille\.detache\{background:#eceff3;color:#3d4a5a;/);
  // La ligne de suivi (en-tête commun, 31/10/2026) : sans fond, grise sur le blanc du cadre (5,6:1) ;
  // orange foncé hors ligne, gris foncé quand le code ne vaut plus rien.
  assert.match(SOURCE_SUIVI, /\.suivi-repere\{[^}]*background:none;",\s*"color:#506b7d;/);
  assert.match(SOURCE_SUIVI, /\.suivi-repere\.hors-ligne\{color:#8a4c0a\}/);
  assert.match(SOURCE_SUIVI, /\.suivi-repere\.detache\{color:#3d4a5a\}/);
  assert.match(SOURCE_SUIVI, /html\.suivi-eleve \.mg-mention-slot\{display:none !important\}/);
  assert.match(SOURCE_SUIVI, /new RegExp\("\^mathsgo-coffres-\[a-z0-9-\]\+:\(\[0-9a-f\]\{" \+ P\.LONGUEUR_EMPREINTE \+ "\}\)\$"\)/, "le ménage des mémoires d'élève vise les clés de Coffres");
  assert.doesNotMatch(SOURCE_SUIVI.replace(/\/\/[^\n]*/g, ""), /MathsGoSplat/, "branché sur le moteur de Coffres, pas sur celui de SPLAT!");
});

test("confidentialite.html nomme les clés de Coffres magiques sur l'appareil", () => {
  const page = lire("confidentialite.html");
  for (const cle of ["mathsgo-coffres-parcours", "mathsgo-coffres-parcours:CODE", "mathsgo-coffres-sync:CODE", "mathsgo-coffres-sel", "mathsgo-coffres-reglages"]) {
    assert.ok(page.includes(`<code>${cle}</code>`), cle);
  }
});
