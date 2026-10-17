// Lot E1 « les évaluations en classe » de Défi tables (15/10/2026, décisions
// de Gwenaël) — le générateur « mix d'évaluation » de defi_tables_core.js.
//
// Ce que ce fichier tient :
//  - le tirage est DÉTERMINISTE : même réglage + mêmes graines → même série ;
//    c'est ce qui permet au serveur de ne connaître ni les questions ni la
//    correction (il distribue des graines, Ma classe refait le tirage) ;
//  - les trois tirages : « memes » (mêmes calculs pour tous, ordre et
//    écritures par élève), « identique » (tout pareil), « differents » ;
//  - un calcul imposé sort exactement une fois, un calcul exclu jamais ;
//    jamais deux fois la même question ; les tables à parts égales ;
//  - le réglage est une liste fermée (bornes partagées avec lib/evaluation.php) ;
//  - la correction : note sur 20 au demi-point, une question = un point, le
//    temps ne compte pas ; faux et sans réponse valent 0 mais se distinguent ;
//  - la copie du moteur servie par suivi.mathsgo.re est identique.
//
// Sabotages attendus (chacun rend ce fichier rouge) :
//  a) aleatoireDeGraine qui rend Math.random (plus de déterminisme)
//  b) rngFormes tiré de la graine de séance en « memes » (plus d'ordre par élève)
//  c) rngCalculs tiré de la graine élève en « memes » (plus les mêmes calculs)
//  d) oublier les imposés dans « interdits » (un imposé peut sortir deux fois)
//  e) ne plus filtrer les exclus dans le secours (un exclu revient)
//  f) noteSur20 arrondie à l'entier
//  g) une borne de BORNES_EVALUATION différente de lib/evaluation.php
//  h) la copie prof/defi_tables_core.js qui diffère de l'original

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const require = createRequire(import.meta.url);
const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const C = require("../outils/calcul_mental/defi_tables_core.js");

const REGLAGE = {tables: [2, 3, 4, 5, 6, 7, 8, 9], types: ["direct", "missing", "division"], n: 20,
  chrono: "question", secondes: 8, tirage: "memes", exclus: ["2-1", "2-10"], imposes: ["7-8", "6-9"]};
const prompts = questions => questions.map(q => q.prompt);
const calculs = questions => questions.map(q => q.factKey).sort().join(",");

test("même réglage, mêmes graines : même série, octet pour octet", () => {
  const a = C.genererEvaluationDeClasse(REGLAGE, {seance: 123456, eleve: 42});
  const b = C.genererEvaluationDeClasse(REGLAGE, {seance: 123456, eleve: 42});
  assert.deepEqual(a, b);
  assert.equal(a.length, 20);
  assert.deepEqual(a.map(q => q.numero), Array.from({length: 20}, (_, i) => i + 1), "numérotées de 1 à n");
  for (const q of a) assert.equal(q.answer, C.tableQuestion(q.type, q.first, q.second).answer, "la réponse est celle de l'énoncé");
  // Une graine différente change la série.
  const c = C.genererEvaluationDeClasse(REGLAGE, {seance: 123457, eleve: 42});
  assert.notDeepEqual(prompts(a), prompts(c));
});

test("aleatoireDeGraine : mulberry32, déterministe, dans [0, 1[", () => {
  const r1 = C.aleatoireDeGraine(7);
  const r2 = C.aleatoireDeGraine(7);
  const suite = Array.from({length: 5}, () => r1());
  assert.deepEqual(suite, Array.from({length: 5}, () => r2()));
  assert.ok(suite.every(x => x >= 0 && x < 1));
  assert.notEqual(C.aleatoireDeGraine(8)(), suite[0]);
  // La graine est lue comme un entier 32 bits non signé : 2^32 + 7 = 7.
  assert.equal(C.aleatoireDeGraine(4294967303)(), suite[0]);
});

test("« memes » : les mêmes calculs pour tous, l'ordre et les écritures propres à chaque élève", () => {
  const seance = 987654;
  const eleves = [1, 2, 3, 4, 5].map(eleve => C.genererEvaluationDeClasse(REGLAGE, {seance, eleve}));
  const reference = calculs(eleves[0]);
  for (const serie of eleves) assert.equal(calculs(serie), reference, "le multi-ensemble des calculs est le même");
  const ordres = new Set(eleves.map(serie => prompts(serie).join("|")));
  assert.ok(ordres.size >= 4, `l'ordre change d'un élève à l'autre (${ordres.size} ordres distincts sur 5)`);
});

test("« identique » : tout le monde la même série ; « differents » : des calculs différents", () => {
  const identique = {...REGLAGE, tirage: "identique"};
  const a = C.genererEvaluationDeClasse(identique, {seance: 5, eleve: 1});
  const b = C.genererEvaluationDeClasse(identique, {seance: 5, eleve: 999999});
  assert.deepEqual(prompts(a), prompts(b));
  const differents = {...REGLAGE, tirage: "differents"};
  const d1 = C.genererEvaluationDeClasse(differents, {seance: 5, eleve: 1});
  const d2 = C.genererEvaluationDeClasse(differents, {seance: 5, eleve: 2});
  assert.notEqual(calculs(d1), calculs(d2));
  // En « differents », la graine de séance ne compte plus.
  const d3 = C.genererEvaluationDeClasse(differents, {seance: 6, eleve: 1});
  assert.deepEqual(prompts(d1), prompts(d3));
});

test("un imposé sort une fois, un exclu jamais, jamais deux fois la même question (200 séries)", () => {
  for (let eleve = 1; eleve <= 200; eleve += 1) {
    const serie = C.genererEvaluationDeClasse(REGLAGE, {seance: 31, eleve});
    assert.equal(serie.filter(q => q.factKey === "7-8").length, 1, "7 × 8 imposé");
    assert.equal(serie.filter(q => q.factKey === "6-9").length, 1, "6 × 9 imposé");
    assert.equal(serie.filter(q => ["1-2", "2-10"].includes(q.factKey)).length, 0, "les exclus ne sortent pas");
    assert.equal(new Set(prompts(serie)).size, 20, "jamais deux fois la même question");
    assert.equal(new Set(serie.map(q => q.factKey)).size, 20, "20 calculs tous différents sur 8 tables");
    for (const q of serie) assert.ok(REGLAGE.tables.includes(q.first) || REGLAGE.tables.includes(q.second), "chaque calcul vient d'une table choisie");
  }
});

test("les tables à parts égales, et les trois familles de questions à parts égales", () => {
  const serie = C.genererEvaluationDeClasse({...REGLAGE, tables: [3, 4, 5, 6], n: 20, exclus: [], imposes: []}, {seance: 1, eleve: 1});
  const parTable = {};
  for (const q of serie) parTable[q.focusTable] = (parTable[q.focusTable] || 0) + 1;
  assert.deepEqual(parTable, {3: 5, 4: 5, 5: 5, 6: 5});
  const parFamille = {};
  for (const q of serie) parFamille[q.category] = (parFamille[q.category] || 0) + 1;
  assert.deepEqual(Object.values(parFamille).sort(), [6, 7, 7]);
  // Un seul type : toutes les questions de ce type, avec ses écritures.
  const divisions = C.genererEvaluationDeClasse({tables: [7], types: ["division"], n: 10, chrono: "sans", tirage: "memes"}, {seance: 1, eleve: 1});
  assert.ok(divisions.every(q => q.category === "division"));
  assert.ok(divisions.some(q => q.type === "division-quotient") && divisions.some(q => q.type === "division-divisor"), "plusieurs écritures");
  const trous = C.genererEvaluationDeClasse({tables: [6, 7], types: ["missing"], n: 10, chrono: "global", secondes: 120, tirage: "memes"}, {seance: 1, eleve: 1});
  assert.ok(trous.every(q => q.category === "missing"));
  assert.ok(new Set(trous.map(q => q.type)).size >= 3, "les écritures du nombre manquant varient");
});

test("une seule table, plus de questions que de calculs : un calcul revient, jamais un exclu", () => {
  const serie = C.genererEvaluationDeClasse({tables: [7], types: ["direct"], n: 20, chrono: "sans", tirage: "memes", exclus: ["7-1", "7-10", "7-7"]}, {seance: 9, eleve: 9});
  assert.equal(serie.length, 20);
  assert.ok(serie.every(q => !["1-7", "7-10", "7-7"].includes(q.factKey)), "aucun exclu");
  assert.ok(serie.every(q => q.first === 7 || q.second === 7));
  assert.equal(new Set(prompts(serie)).size >= 14, true, "les produits reviennent dans l'autre sens avant de se répéter");
});

test("le réglage est une liste fermée, remise au propre, avec un mot clair quand il ne va pas", () => {
  const ok = C.verifierReglageEvaluation({...REGLAGE, tables: [9, 2, 2, "7"], exclus: ["1-2", "2-1"], tirage: "n'importe quoi"});
  assert.deepEqual(ok.reglage, {tables: [2, 7, 9], types: ["direct", "missing", "division"], n: 20, chrono: "question", secondes: 8,
    tirage: "memes", exclus: ["1-2"], imposes: ["7-8", "6-9"]}, "tables triées sans doublon, exclus sans doublon, tirage par défaut");
  assert.equal(C.verifierReglageEvaluation({...REGLAGE, tables: []}).erreur, "Choisis au moins une table.");
  assert.equal(C.verifierReglageEvaluation({...REGLAGE, types: ["texte"]}).erreur, "Choisis au moins un type de question.");
  assert.match(C.verifierReglageEvaluation({...REGLAGE, n: 4}).erreur, /5 à 50/);
  assert.match(C.verifierReglageEvaluation({...REGLAGE, n: 51}).erreur, /5 à 50/);
  assert.match(C.verifierReglageEvaluation({...REGLAGE, n: "20"}).erreur, /5 à 50/, "un texte n'est pas un nombre");
  assert.match(C.verifierReglageEvaluation({...REGLAGE, secondes: 2}).erreur, /3 à 60 secondes/);
  assert.match(C.verifierReglageEvaluation({...REGLAGE, chrono: "global", secondes: 10}).erreur, /0\.5 à 30 minutes/);
  assert.equal(C.verifierReglageEvaluation({...REGLAGE, chrono: "sans", secondes: 99}).reglage.secondes, null, "sans chrono : pas de secondes");
  assert.match(C.verifierReglageEvaluation({...REGLAGE, imposes: ["7-8", "6-9", "2-1"]}).erreur, /exclu et imposé/);
  assert.match(C.verifierReglageEvaluation({...REGLAGE, imposes: ["3-3", "1-1"]}).erreur, /pas dans les tables choisies/);
  assert.match(C.verifierReglageEvaluation({...REGLAGE, exclus: ["7×8"]}).erreur, /pas dans les tables choisies/);
  assert.match(C.verifierReglageEvaluation({...REGLAGE, n: 5, imposes: ["7-8", "6-9", "3-3", "4-4", "5-5", "2-2"]}).erreur, /trop/);
  assert.match(C.verifierReglageEvaluation({tables: [7], types: ["direct"], n: 5, chrono: "sans", exclus: C.calculsDisponiblesEvaluation([7])}).erreur, /Tous les calculs sont exclus/);
  assert.equal(C.normaliserReglageEvaluation(null), null);
  assert.throws(() => C.genererEvaluationDeClasse({tables: []}, {seance: 1, eleve: 1}), /invalide/);
});

test("les calculs disponibles : chaque calcul une fois, table par table, ×1 à ×10", () => {
  assert.deepEqual(C.calculsDisponiblesEvaluation([2, 3]), ["1-2", "2-2", "2-3", "2-4", "2-5", "2-6", "2-7", "2-8", "2-9", "2-10",
    "1-3", "3-3", "3-4", "3-5", "3-6", "3-7", "3-8", "3-9", "3-10"]);
  assert.equal(C.calculsDisponiblesEvaluation([2, 3, 4, 5, 6, 7, 8, 9, 10, 1]).length, 55);
  assert.deepEqual(C.calculsDisponiblesEvaluation([]), []);
});

test("la correction : un point par question, note sur 20 au demi-point, faux et sans réponse distingués", () => {
  const questions = C.genererEvaluationDeClasse(REGLAGE, {seance: 1, eleve: 1});
  const reponses = {};
  questions.forEach((q, i) => {
    if (i < 15) reponses[String(q.numero)] = `${q.answer}|${10 + i}`;        // 15 justes
    else if (i < 17) reponses[String(q.numero)] = `${q.answer + 1}|50`;      // 2 fausses
    else if (i < 19) reponses[String(q.numero)] = "|80";                     // 2 sans réponse
    // la 20e n'est jamais atteinte
  });
  const copie = C.corrigerEvaluationDeClasse(questions, reponses);
  assert.equal(copie.score, 15);
  assert.equal(copie.total, 20);
  assert.equal(copie.repondues, 19);
  assert.equal(copie.note, 15);
  assert.equal(copie.dixiemes, 15 * 10 + (0 + 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14) + 100 + 160);
  assert.equal(copie.rates.length, 5);
  assert.deepEqual(copie.rates.map(r => [r.donnee === null, r.atteinte]), [[false, true], [false, true], [true, true], [true, true], [true, false]]);
  assert.equal(copie.rates[0].donnee, questions[15].answer + 1);
  assert.equal(copie.rates[0].prompt, questions[15].prompt);
  // Une réponse mal formée vaut « sans réponse », le temps 0.
  assert.deepEqual(C.lireReponseEvaluation("abc|x"), {valeur: null, dixiemes: 0});
  assert.deepEqual(C.lireReponseEvaluation("56|43"), {valeur: 56, dixiemes: 43});
  assert.deepEqual(C.lireReponseEvaluation(null), {valeur: null, dixiemes: 0});
  assert.deepEqual(C.corrigerEvaluationDeClasse(questions, null).score, 0);
});

test("noteSur20 : proportionnelle, arrondie au demi-point, le temps ne compte pas", () => {
  assert.equal(C.noteSur20(20, 20), 20);
  assert.equal(C.noteSur20(17, 20), 17);
  assert.equal(C.noteSur20(13, 15), 17.5);   // 17,33 → 17,5
  assert.equal(C.noteSur20(7, 30), 4.5);     // 4,67 → 4,5
  assert.equal(C.noteSur20(1, 25), 1);       // 0,8 → 1
  assert.equal(C.noteSur20(0, 20), 0);
  assert.equal(C.noteSur20(3, 0), 0);
});

test("la description d'un modèle : courte, et la même partout", () => {
  assert.equal(C.descriptionEvaluation(REGLAGE),
    "Tables de 2 à 9 · produits, nombres manquants, divisions · 20 questions · 8 s par question · mêmes calculs, ordre différent · 7 × 8 et 6 × 9 imposés · 1 × 2 et 2 × 10 exclus");
  assert.equal(C.descriptionEvaluation({tables: [6, 7, 8], types: ["direct"], n: 15, chrono: "sans", tirage: "differents"}),
    "Tables de 6 à 8 · produits · 15 questions · sans chrono · tous différents");
  assert.equal(C.descriptionEvaluation({tables: [2, 5], types: ["division"], n: 10, chrono: "global", secondes: 180, tirage: "identique"}),
    "Tables de 2 et 5 · divisions · 10 questions · 3 min en tout · identique pour tous");
  assert.equal(C.descriptionEvaluation({tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], types: ["direct"], n: 10, chrono: "global", secondes: 90, tirage: "memes"}),
    "Tables de 2 à 10 · produits · 10 questions · 1 min 30 en tout · mêmes calculs, ordre différent");
  assert.equal(C.descriptionEvaluation({}), "");
});

test("les bornes du moteur sont celles du serveur (lib/evaluation.php)", () => {
  const php = readFileSync(join(racine, "_serveur/public/lib/evaluation.php"), "utf8");
  const [qMin, qMax] = C.BORNES_EVALUATION.questions;
  const [sMin, sMax] = C.BORNES_EVALUATION.secondesParQuestion;
  const [gMin, gMax] = C.BORNES_EVALUATION.secondesEnTout;
  assert.match(php, new RegExp(`const EVALUATION_QUESTIONS_MIN = ${qMin};`));
  assert.match(php, new RegExp(`const EVALUATION_QUESTIONS_MAX = ${qMax};`));
  assert.match(php, new RegExp(`const EVALUATION_SECONDES_QUESTION = \\[${sMin}, ${sMax}\\];`));
  assert.match(php, new RegExp(`const EVALUATION_SECONDES_GLOBAL = \\[${gMin}, ${gMax}\\];`));
  assert.match(php, new RegExp(`const EVALUATION_NOM_MAX = ${C.BORNES_EVALUATION.nom};`));
  assert.match(php, /const TYPES_EVALUATION = \['direct', 'missing', 'division'\];/);
  assert.match(php, /const TIRAGES_EVALUATION = \['memes', 'identique', 'differents'\];/);
  assert.match(php, /const CHRONOS_EVALUATION = \['question', 'global', 'sans'\];/);
});

test("le moteur servi par suivi.mathsgo.re est la copie exacte de celui de l'appli", () => {
  const original = readFileSync(join(racine, "outils/calcul_mental/defi_tables_core.js"));
  const copie = readFileSync(join(racine, "_serveur/public/prof/defi_tables_core.js"));
  assert.ok(original.equals(copie), "cp outils/calcul_mental/defi_tables_core.js _serveur/public/prof/ et ajoute-le au dossier à déposer");
});

test("l'appli charge le moteur avec une version bumpée pour ce lot", () => {
  const html = readFileSync(join(racine, "outils/calcul_mental/defi_tables.html"), "utf8");
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/, "le ?v= de core.js doit suivre le lot (cache)");
});
