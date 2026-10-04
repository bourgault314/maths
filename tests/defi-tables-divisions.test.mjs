// Lot « divisions » de Défi tables (04/10/2026, décisions de Gwenaël).
//
// Les divisions entrent dans la séance d'une table, à la place d'une partie
// des nombres manquants (même question, autre écriture : 56 ÷ 7 = ?, c'est
// 7 × ? = 56) :
//   - marche 6 « Nombres manquants et divisions » : 5 + 5 ;
//   - marche 7 « Résultats, nombres manquants et divisions » : 6 + 2 + 2 ;
//   - validation, mélange, « Comme la validation » : 14 + 3 + 3 (au lieu de 14 + 6) ;
//   - hors d'Expert, une seule forme (56 ÷ 7 = ?), dans les deux sens ;
//   - une division compte pour son calcul (56 ÷ 7 = case 7 × 8) ;
//   - une division ratée se corrige avec sa multiplication :
//     « Bonne réponse : 4, car 7 × 4 = 28. »
//
// Sabotages attendus (chacun rend ce fichier rouge) :
//   - remettre la validation à 14 + 6 ;
//   - laisser les trois formes de division dans le parcours ;
//   - ne diviser que par la table (un seul sens) ;
//   - reconnaître encore l'ancien « nombres manquants » seul comme l'entraînement du parcours ;
//   - oublier « car 7 × 4 = 28 » dans la correction d'une division.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const core = require("../outils/calcul_mental/defi_tables_core.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const N = " ";

const compter = questions => ["direct", "missing", "division"].map(categorie => questions.filter(question => question.category === categorie).length);
const generer = config => core.generateQuestions(core.normalizeConfiguration(config));

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }\n", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

test("les séries du parcours : 5 + 5, 6 + 2 + 2, 14 + 3 + 3 — à chaque tirage", () => {
  const acquises = P.normaliserParcours({tables: {2: {acquise: "2026-10-01"}, 5: {acquise: "2026-10-01"}, 10: {acquise: "2026-10-01"}}});
  for (let tirage = 0; tirage < 60; tirage += 1) {
    assert.deepEqual(compter(generer(P.configEntraine(7, "desordre"))), [10, 0, 0], "marche 5 : que des résultats");
    assert.deepEqual(compter(generer(P.configEntraine(7, "trous"))), [0, 5, 5], "marche 6");
    assert.deepEqual(compter(generer(P.configEntraine(7, "mixte"))), [6, 2, 2], "marche 7");
    assert.deepEqual(compter(generer(P.configValidation(7))), [14, 3, 3], "la validation");
    assert.deepEqual(compter(generer(P.configValidation(7, 120))), [14, 3, 3], "« Comme la validation, en 2 min »");
    assert.deepEqual(compter(generer(P.configMelange(acquises))), [14, 3, 3], "le mélange");
  }
});

test("hors d'Expert, une seule forme de division, dans les deux sens ; Expert garde ses trois formes", () => {
  const sens = {parTable: 0, parAutre: 0};
  for (let tirage = 0; tirage < 40; tirage += 1) {
    for (const config of [P.configEntraine(7, "trous"), P.configEntraine(7, "mixte"), P.configValidation(7)]) {
      generer(config).filter(question => question.category === "division").forEach(question => {
        assert.equal(question.type, "division-quotient");
        assert.equal(question.prompt, `${question.product} ÷ ${question.first} = ?`);
        assert.equal(question.answer, question.second);
        assert.ok(question.first === 7 || question.second === 7, "une division de SA table");
        if (question.first === 7 && question.second !== 7) sens.parTable += 1;
        if (question.second === 7 && question.first !== 7) sens.parAutre += 1;
      });
    }
  }
  assert.ok(sens.parTable > 0 && sens.parAutre > 0, "56 ÷ 7 = ? et 56 ÷ 8 = ?");
  assert.ok(Math.abs(sens.parTable - sens.parAutre) < (sens.parTable + sens.parAutre) / 3, "à parts à peu près égales");
  const formesExpert = new Set();
  for (let tirage = 0; tirage < 10; tirage += 1) generer(P.configEtoile(1)).forEach(question => formesExpert.add(question.type));
  assert.ok(["division-quotient", "division-dividend", "division-divisor"].every(forme => formesExpert.has(forme)), "Expert : les trois formes");
  const libres = new Set();
  for (let tirage = 0; tirage < 10; tirage += 1) generer({mode: "custom", tables: [7], total: 20, questionTypes: ["division"]}).forEach(question => libres.add(question.type));
  assert.equal(libres.size, 3, "les réglages libres ne changent pas");
});

test("une division compte pour son calcul : 56 ÷ 7 monte la case 7 × 8", () => {
  const question = core.tableQuestion("division-quotient", 7, 8);
  assert.equal(question.prompt, "56 ÷ 7 = ?");
  assert.equal(question.factKey, "7-8");
  const apres = P.appliquerReponse(P.creerParcours(), question.factKey, {correcte: true, date: "2026-10-05"});
  assert.equal(apres.fait.cle, "7-8");
  assert.equal(apres.parcours.calculs["7-8"].boite, 2);
});

test("le moteur reconnaît les nouveaux entraînements, et plus les anciens", () => {
  const p = P.creerParcours();
  assert.deepEqual(P.classerSerie(p, P.configEntraine(7, "trous")), {type: "entraine", table: 7, entrainement: "trous"});
  assert.deepEqual(P.classerSerie(p, P.configEntraine(7, "mixte")), {type: "entraine", table: 7, entrainement: "mixte"});
  assert.equal(P.classerSerie(p, {mode: "train", tables: [7], total: 10, questionTypes: ["missing"]}), null, "l'ancien « nombres manquants » seul ne compte plus");
  assert.equal(P.classerSerie(p, {mode: "train", tables: [7], total: 10, questionTypes: ["direct", "missing"]}), null);
  assert.equal(P.VERSION, 3, "rien ne change dans ce qui est enregistré");
  assert.deepEqual(P.MARCHES.map(marche => marche.nom).slice(4), ["Dans le désordre", "Nombres manquants et divisions", "Résultats, nombres manquants et divisions", "Je valide ma table"]);
  assert.deepEqual(P.MARCHES.map(marche => marche.cle).slice(4, 7), ["desordre", "trous", "mixte"], "les clés ne changent pas");
});

test("la page : mêmes types que le moteur, mêmes noms partout, la fiche et la notice le disent", () => {
  const types = new Function(`${html.match(/const TRAIN_TYPES = \{[^}]*\};/)[0]} return TRAIN_TYPES;`)();
  for (const [cle, liste] of Object.entries(types)) assert.deepEqual(P.configEntraine(7, cle).questionTypes, liste, cle);
  assert.match(html, /const NOMS_ENTRAINEMENTS = Object\.freeze\(\{desordre: "dans le désordre", trous: "nombres manquants et divisions", mixte: "résultats, nombres manquants et divisions"\}\);/);
  assert.match(html, /<p><b>Acquise ✓<\/b> : 20 questions \(résultats, nombres manquants et divisions\) en 1 min 30, 2 erreurs au plus\.<\/p>/);
  assert.match(html, /dans le désordre, les nombres manquants et les divisions… jusqu’à/);
  assert.match(html, /suite\.textContent = `Étape \$\{seance\.faites\.length \+ 1\}\\u00a0: \$\{prochaine\.nom\}\\u00a0→`;/, "entre deux étapes, la flèche ne part pas seule à la ligne");
  assert.equal(core.configurationLabel(core.normalizeConfiguration(P.configEntraine(7, "trous"))), "Je m’entraîne · Table de 7 · nombres manquants et divisions · 10 questions · sans chrono");
});

test("une division ratée se corrige avec sa multiplication ; le reste ne change pas", () => {
  const feedback = {className: "", textContent: ""};
  const montrer = new Function("$", "state", "renderInlineAnswer", "setAnswerControlsEnabled", `${source("showAnswerFeedback")}; return showAnswerFeedback;`)(
    id => (id === "answer-feedback" ? feedback : {focus() {}}),
    {casesMontrees: new Set(), configuration: {learnActivity: "ordered"}},
    () => {}, () => {});
  montrer(core.tableQuestion("division-quotient", 7, 4), false, 6);
  assert.equal(feedback.textContent, `Ta réponse${N}: 6. Bonne réponse${N}: 4, car 7${N}×${N}4${N}=${N}28.`);
  montrer(core.tableQuestion("division-quotient", 4, 7), false, null, true);
  assert.equal(feedback.textContent, `Pas de réponse. Bonne réponse${N}: 7, car 4${N}×${N}7${N}=${N}28. Le calcul reviendra.`);
  montrer(core.tableQuestion("right", 7, 4), false, 6);
  assert.equal(feedback.textContent, `Ta réponse${N}: 6. Bonne réponse${N}: 4.`, "un nombre manquant : comme avant");
  montrer(core.tableQuestion("direct", 7, 4), false, 27);
  assert.equal(feedback.textContent, `Ta réponse${N}: 27. Bonne réponse${N}: 28.`);
});
