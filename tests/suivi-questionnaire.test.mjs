import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(join(racine, chemin), "utf8");
const require = createRequire(import.meta.url);
const QZ = require(join(racine, "_serveur/public/prof/questionnaire.js"));

// Séance en direct, lot 2 « questionnaire au tableau » (15/10/2026).
//
// Le questionnaire est un fichier JSON chez le professeur, ouvert dans l'écran
// du tableau et lu par _serveur/public/prof/questionnaire.js — LE CONTRAT sur
// lequel Défi tables (lot 3) et Automatismes se brancheront (décrit pour un
// humain dans _serveur/QUESTIONNAIRE.md). Ce fichier éprouve ce lecteur, et
// garde ce qui se vérifie en lisant la page du tableau : le questionnaire ne
// part jamais au serveur, la bonne réponse seulement avec « Dévoiler », les
// formules sans « trust », l'aperçu jamais pendant une séance.
//
// Sabotages attendus (chacun rend un test rouge) :
//  n) accepter une image par adresse http(s) dans lireImage()
//  o) passer « trust: true » à KaTeX dans la page du tableau
//  p) envoyer l'énoncé avec « direct.question »
//  q) ouvrir l'aperçu pendant une séance (retirer « || direct »)
//  r) modifier un octet de la copie de KaTeX servie par le suivi

const page = lire("_serveur/public/prof/direct.php");
const script = page.slice(page.indexOf(">", page.indexOf("<script nonce=")) + 1, page.lastIndexOf("</script>"));
const lib = lire("_serveur/public/lib/direct.php");

function fichier(questionnaire) {
  return JSON.stringify(Object.assign({format: "mathsgo-questionnaire", version: 1, titre: "Essai"}, questionnaire), null, 2);
}
const IMAGE_SVG = "data:image/svg+xml;base64," + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>').toString("base64");

test("un questionnaire complet se lit, et se remet au propre", () => {
  const lu = QZ.lire(fichier({
    chrono: 30,
    questions: [
      {enonce: "Combien vaut $\\frac{3}{4}+\\frac{1}{8}$ ?", choix: ["$\\frac{4}{12}$", "$\\frac{7}{8}$", "$\\frac{4}{8}$", "$1$"], bonne: "b"},
      {enonce: "Quelle aire ?", image: IMAGE_SVG, choix: ["11 cm²", "24 cm²"], bonne: "B", chrono: null, id: "aire-01"},
      {enonce: "", image: IMAGE_SVG, choix: [{image: IMAGE_SVG}, {image: IMAGE_SVG, texte: "carré"}, "rien"], chrono: 45},
    ],
  }));
  assert.equal(lu.ok, true, JSON.stringify(lu.erreurs));
  const q = lu.questionnaire;
  assert.equal(q.titre, "Essai");
  assert.equal(q.questions.length, 3);
  assert.deepEqual(q.questions.map((x) => x.numero), [1, 2, 3]);
  assert.equal(q.questions[0].bonne, "B", "la lettre est remise en majuscule");
  assert.deepEqual(q.questions.map((x) => x.chrono), [30, null, 45], "chrono : celui du questionnaire, sauf si la question dit autre chose (null = aucun)");
  assert.equal(q.questions[1].id, "aire-01");
  assert.equal(q.questions[2].bonne, null, "une question sans bonne réponse : un sondage");
  assert.deepEqual(q.questions[2].choix[1], {texte: "carré", image: IMAGE_SVG}, "une réponse peut être une figure, avec ou sans texte");
  assert.deepEqual(q.questions[0].choix[3], {texte: "$1$", image: null});
});

test("sans chrono nulle part, aucune question n'en a (le réglage par défaut)", () => {
  const lu = QZ.lire(fichier({questions: [{enonce: "a", choix: ["x", "y"]}]}));
  assert.equal(lu.questionnaire.questions[0].chrono, null);
  assert.equal(lu.questionnaire.chrono, null);
});

test("le Bloc-notes de Windows peut ajouter une marque au début : elle ne gêne pas", () => {
  assert.equal(QZ.lire("\uFEFF" + fichier({questions: [{enonce: "a", choix: ["x", "y"]}]})).ok, true);
});

test("un fichier abîmé : la page dit à quelle ligne", () => {
  const casse = '{\n  "format": "mathsgo-questionnaire",\n  "version": 1\n  "questions": []\n}';
  const lu = QZ.lire(casse);
  assert.equal(lu.ok, false);
  assert.match(lu.erreurs[0], /ligne [34]\b/, lu.erreurs[0]);
  assert.match(QZ.lire("pas du tout du JSON").erreurs[0], /n'est pas un questionnaire lisible/);
});

test("un autre fichier JSON, ou une version à venir, est refusé avec un mot clair", () => {
  assert.match(QZ.lire('{"questions": []}').erreurs[0], /n'est pas un questionnaire de séance en direct/);
  assert.match(QZ.lire('{"format": "mathsgo-questionnaire", "version": 2, "questions": []}').erreurs[0], /version plus récente/);
  assert.match(QZ.lire(fichier({questions: []})).erreurs[0], /aucune question/);
});

test("chaque erreur nomme la question et la réponse en cause", () => {
  const lu = QZ.lire(fichier({
    questions: [
      {enonce: "a", choix: ["x"]},
      {enonce: "b", choix: ["x", "y", "z", "t", "u", "v", "w"]},
      {enonce: "c", choix: ["x", "y"], bonne: "C"},
      {enonce: "d", choix: ["x", ""]},
      {choix: ["x", "y"]},
      {enonce: "f", choix: ["x", "y"], type: "texte"},
      {enonce: "g", choix: ["x", "y"], chrono: 4},
      {enonce: "h", choix: ["x", "y"], chrono: "30"},
      {enonce: "Combien vaut $\\frac{1}{2} ?", choix: ["x", "y"]},
      {enonce: "j", choix: ["x", 12]},
    ],
  }));
  assert.equal(lu.ok, false);
  const tout = lu.erreurs.join("\n");
  for (const attendu of [
    /Question 1 : il faut de 2 à 6 réponses/,
    /Question 2 : il faut de 2 à 6 réponses/,
    /Question 3 : la bonne réponse doit être une lettre de A à B/,
    /Question 4, réponse B : réponse vide/,
    /Question 5 : il manque l'énoncé/,
    /Question 6 : type « texte » inconnu/,
    /Question 7, chrono : le chrono est un nombre entier de secondes, de 5 à 600/,
    /Question 8, chrono : /,
    /Question 9, énoncé : une formule n'est pas fermée/,
    /Question 10, réponse B : un texte entre guillemets/,
  ]) {
    assert.match(tout, attendu);
  }
});

test("une image doit être DANS le fichier, et d'un type d'image connu", () => {
  const avec = (image) => QZ.lire(fichier({questions: [{enonce: "a", image, choix: ["x", "y"]}]}));
  assert.equal(avec(IMAGE_SVG).ok, true, "SVG");
  assert.equal(avec("data:image/png;base64,iVBORw0KGgo=").ok, true, "PNG");
  for (const refusee of [
    "https://exemple.org/figure.png",
    "http://exemple.org/figure.png",
    "//exemple.org/figure.png",
    "javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "data:image/svg+xml,<svg onload=alert(1)>",
    "figure.png",
  ]) {
    assert.equal(avec(refusee).ok, false, `${refusee} : refusée`);
  }
});

test("les identifiants : un format sûr, jamais deux fois le même", () => {
  const lu = QZ.lire(fichier({questions: [
    {enonce: "a", choix: ["x", "y"], id: "auto:dnb.fractions-03"},
    {enonce: "b", choix: ["x", "y"], id: "auto:dnb.fractions-03"},
    {enonce: "c", choix: ["x", "y"], id: "<b>"},
  ]}));
  assert.match(lu.erreurs.join("\n"), /Question 2 : l'identifiant « auto:dnb\.fractions-03 » est déjà pris/);
  assert.match(lu.erreurs.join("\n"), /Question 3 : l'identifiant ne prend que/);
});

test("une formule que KaTeX refuse est signalée, avec la question", () => {
  const lu = QZ.lire(fichier({questions: [{enonce: "Calcule $\\frac{1}{$ et $2+2$", choix: ["x", "y"]}]}),
    {verifierFormule: (source) => (source.includes("\\frac{1}{") ? "à corriger" : null)});
  assert.equal(lu.ok, false);
  assert.match(lu.erreurs[0], /Question 1, énoncé : formule illisible « \\frac\{1\}\{ » \(à corriger\)/);
});

test("trop de questions : la borne est celle du serveur", () => {
  const questions = Array.from({length: QZ.MAX_QUESTIONS + 1}, () => ({enonce: "a", choix: ["x", "y"]}));
  assert.match(QZ.lire(fichier({questions})).erreurs[0], /Trop de questions/);
  assert.equal(QZ.lire(fichier({questions: questions.slice(1)})).ok, true);
});

test("le découpage texte / formules", () => {
  assert.deepEqual(QZ.decouper("Combien vaut $1+1$ ?"), {morceaux: [{texte: "Combien vaut "}, {maths: "1+1"}, {texte: " ?"}], ferme: true});
  assert.deepEqual(QZ.decouper("Prix : 3 \\$"), {morceaux: [{texte: "Prix : 3 $"}], ferme: true}, "« \\$ » est un dollar ordinaire");
  assert.deepEqual(QZ.decouper("$a$$b$"), {morceaux: [{maths: "a"}, {maths: "b"}], ferme: true});
  assert.equal(QZ.decouper("$1+").ferme, false);
});

test("les bornes du lecteur sont celles du serveur (lib/direct.php)", () => {
  assert.match(lib, new RegExp(`const MAX_QUESTIONS_DIRECT = ${QZ.MAX_QUESTIONS};`));
  assert.match(lib, new RegExp(`const DUREE_DIRECT_MIN = ${QZ.CHRONO_MIN};`));
  assert.match(lib, new RegExp(`const DUREE_DIRECT_MAX = ${QZ.CHRONO_MAX};`));
  assert.match(lib, /const LETTRES_DIRECT = \['A', 'B', 'C', 'D', 'E', 'F'\];/);
  assert.deepEqual(QZ.LETTRES, ["A", "B", "C", "D", "E", "F"]);
});

test("le questionnaire d'exemple du dépôt se lit sans erreur", () => {
  const lu = QZ.lire(lire("_serveur/questionnaires/exemple-questionnaire.json"));
  assert.equal(lu.ok, true, JSON.stringify(lu.erreurs));
  assert.ok(lu.questionnaire.questions.some((q) => q.image), "avec une figure dans un énoncé");
  assert.ok(lu.questionnaire.questions.some((q) => q.choix.some((c) => c.image)), "et des figures en réponses");
  assert.ok(lu.questionnaire.questions.some((q) => q.bonne === null), "et un sondage");
});

test("la page du tableau : le questionnaire ne part JAMAIS au serveur", () => {
  const lancer = script.slice(script.indexOf("  function lancerQuestionDuFichier() {"), script.indexOf("  $(\"action\").addEventListener"));
  assert.ok(lancer.length > 100, "lancerQuestionDuFichier() est dans la page");
  assert.match(lancer, /const reglage = \{choix: question\.choix\.length, rang: question\.numero\};/, "le nombre de réponses, et le numéro affiché (17/10/2026)");
  assert.match(lancer, /if \(question\.chrono\) reglage\.duree = question\.chrono;/, "la durée du chrono");
  assert.match(lancer, /agir\("direct\.question", \{type: question\.type, reglage\}, /, "et rien d'autre");
  for (const appel of script.matchAll(/(?:agir|api)\(("[^"]+")[^\n]*/g)) {
    assert.doesNotMatch(appel[0], /enonce|choix\[|\.texte|\.image|qzTexte|qz\.questions/, `aucun contenu du questionnaire dans ${appel[0]}`);
  }
  for (const appel of script.matchAll(/agir\("([^"]+)"[^\n]*question\.bonne[^\n]*/g)) {
    assert.equal(appel[1], "direct.devoiler", `la bonne réponse du fichier ne part qu'avec « Dévoiler » : ${appel[0]}`);
  }
  assert.match(script, /agir\("direct\.devoiler", question && question\.bonne \? \{bonne: question\.bonne\} : \{\}\)/,
    "la bonne réponse du fichier part avec « Dévoiler », et seulement avec lui");
});

test("la page du tableau : formules sans « trust », textes par textContent, aperçu jamais pendant une séance", () => {
  assert.match(script, /const OPTIONS_KATEX = \{throwOnError: false, trust: false, strict: "ignore", maxSize: 20, maxExpand: 500\};/);
  assert.doesNotMatch(script, /trust: true/);
  assert.doesNotMatch(script, /renderToString\([^)]*\)\s*[;,]?\s*\n[^\n]*innerHTML/, "renderToString ne sert qu'à vérifier");
  assert.match(script, /function ouvrirApercu\(\) \{\s*\n\s*if \(!qz \|\| direct\) return;/, "l'aperçu montre les bonnes réponses : pas pendant une séance");
  assert.match(script, /const QZ = window\.MATHSGO_QUESTIONNAIRE \|\| null;/, "sans lecteur, la question éclair marche toujours");
});

// KaTeX est servi par suivi.mathsgo.re (la politique de contenu n'accepte aucun
// script d'un autre domaine) : c'est une COPIE de assets/vendor/katex-0.18.2,
// dont les empreintes sont tenues par tests/scripts-tiers.test.mjs. Une
// mise à jour de KaTeX se fait aux deux endroits, et se redépose par FTP.
function fichiersDe(dossier) {
  const tous = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) tous.push(...fichiersDe(chemin));
    else tous.push(chemin);
  }
  return tous;
}

test("la copie de KaTeX servie par le suivi est identique à celle du site", () => {
  const site = join(racine, "assets/vendor/katex-0.18.2");
  const suivi = join(racine, "_serveur/public/vendor/katex-0.18.2");
  const noms = (dossier) => fichiersDe(dossier).map((chemin) => relative(dossier, chemin).replace(/\\/g, "/")).sort();
  assert.deepEqual(noms(suivi), noms(site), "les mêmes fichiers");
  for (const nom of noms(site)) {
    assert.ok(readFileSync(join(site, nom)).equals(readFileSync(join(suivi, nom))), `${nom} : octet pour octet`);
  }
  assert.match(page, /<link rel="stylesheet" href="\.\.\/vendor\/katex-0\.18\.2\/katex\.min\.css\?v=<\?= htmlspecialchars\(\$versionKatexCss, ENT_QUOTES\) \?>">/);
});

// ------------------------------------------------ 17/10/2026 : l'exemple, le texte collé, le texte pour l'IA
//
// Sabotages attendus : x) l'exemple de questionnaire.js diffère de celui du dépôt ;
// y) extraire() ne retire plus ce qui entoure le questionnaire ; z) le JSON du texte pour l'IA ne se lit plus.

test("l'exemple du bouton « Essayer » est celui du dépôt, et se lit", () => {
  assert.deepEqual(JSON.parse(QZ.exemple()), JSON.parse(lire("_serveur/questionnaires/exemple-questionnaire.json")),
    "questionnaire.js et _serveur/questionnaires/ restent identiques");
  assert.equal(QZ.lire(QZ.exemple()).ok, true);
});

test("un texte collé : ce qui entoure le questionnaire est retiré, le reste est lu comme un fichier", () => {
  const propre = fichier({questions: [{enonce: "2 + 2 ?", choix: ["3", "4"], bonne: "B"}]});
  const bavard = "Voici ton questionnaire :\n```json\n" + propre + "\n```\nBonne séance !";
  assert.equal(QZ.extraire(bavard), propre);
  assert.equal(QZ.extraire("﻿  " + propre + "\n"), propre, "BOM et espaces");
  assert.deepEqual(QZ.lire(bavard), QZ.lire(propre), "lu exactement comme le fichier propre");
  assert.equal(QZ.extraire("pas d'accolade"), "pas d'accolade", "sans accolade, rien n'est inventé");
  assert.match(QZ.lire("```\nrien\n```").erreurs[0], /n'est pas un questionnaire lisible/);
});

test("le texte à donner à son IA : son exemple se lit, ses règles sont celles du lecteur", () => {
  const brut = page.match(/<textarea id="prompt-ia"[^>]*>([\s\S]*?)<\/textarea>/)[1];
  const texte = brut.replace(/&lt;/g, "<").replace(/&amp;/g, "&");
  const lu = QZ.lire(texte.slice(texte.indexOf("{"), texte.indexOf("Règles")));
  assert.equal(lu.ok, true, JSON.stringify(lu.erreurs));
  assert.match(texte, /de 2 à 6 réponses/);
  assert.match(texte, new RegExp(`de ${QZ.CHRONO_MIN} à ${QZ.CHRONO_MAX}`));
  assert.match(texte, /chaque \\ s'écrit \\\\/, "la règle des barres obliques");
  assert.match(texte, /jamais un lien vers un site/, "les images dans le fichier, jamais par adresse");
});

test("le rang : le téléphone affiche le numéro du tableau, et le serveur n'accepte qu'un entier borné", () => {
  const eleve = lire("_serveur/public/direct.php");
  assert.match(eleve, /const rang = direct\.reglage && Number\.isInteger\(direct\.reglage\.rang\) \? direct\.reglage\.rang : direct\.numero;/);
  assert.match(eleve, /\$\("titre"\)\.textContent = "Question " \+ rang;/);
  const rang = lib.slice(lib.indexOf("function rang_direct("), lib.indexOf("// Une réponse d'élève, remise au propre"));
  assert.match(rang, /if \(!is_int\(\$rang\) \|\| \$rang < 1 \|\| \$rang > MAX_QUESTIONS_DIRECT\) return null;/);
  assert.equal((lib.match(/return rang_direct\(\$brut, \$reglage\);/g) || []).length, 2, "pour les deux types");
});
