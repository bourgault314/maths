// Défi tables — lot « Mes calculs du jour sans Passer » (21/11/2026).
// Décision de Gwenaël (après discussion) : le bouton « Passer » disparaît de
// « Mes calculs du jour » seulement — des tables déjà passées, sans chrono :
// l'élève a le temps de chercher ; s'il ne trouve pas, sa réponse est une
// erreur, il voit la correction et le calcul revient demain. Il reste dans
// les entraînements (« je ne sais pas » de l'élève qui apprend), le test,
// Mon mélange, les étoiles (un chrono) et les évaluations en classe (le
// professeur y voit « pas de réponse »). La course des records et
// J'apprends restent sans « Passer », comme avant.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

// renderLearnSequence jouée pour de vrai, avec une carte de question qui
// garde ses classes : « no-skip » posée = « Passer » caché (la règle CSS
// `.question.no-skip #skip { display: none; }`).
function carteApres(configuration) {
  const classes = new Set();
  const carte = {classList: {toggle(nom, oui) { if (oui) classes.add(nom); else classes.delete(nom); }}};
  const zone = {hidden: false};
  const elements = {"question-card": carte, "learn-sequence": zone};
  const $ = id => elements[id];
  const state = {configuration, questions: [], index: 0};
  const activitePerles = () => false;
  const renderLearnSequence = new Function("$", "state", "activitePerles", `${source("renderLearnSequence")}; return renderLearnSequence;`)($, state, activitePerles);
  renderLearnSequence();
  return classes;
}

test("Mes calculs du jour : plus de « Passer »", () => {
  const cfg = {mode: "revision", revisionTable: null, tables: [], learnActivity: null, questionTypes: [], mesCalculs: true};
  assert.ok(carteApres(cfg).has("no-skip"));
});

test("ailleurs, « Passer » reste : entraînement, test, Mon mélange, étoile, révision d'une table", () => {
  const cas = {
    "entraînement": {mode: "train", tables: [7], learnActivity: null, questionTypes: ["direct"]},
    "test d'une table": {mode: "validation", tables: [7], duration: 90},
    "Mon mélange": {mode: "validation", tables: [2, 3, 4], duration: 90},
    "étoile": {mode: "validation", tables: [2, 3, 4, 5, 6, 7, 8, 9], duration: 120},
    "révision d'une table": {mode: "revision", revisionTable: 7, tables: [], learnActivity: null, questionTypes: [], mesCalculs: false}
  };
  for (const [nom, cfg] of Object.entries(cas)) assert.ok(!carteApres(cfg).has("no-skip"), `${nom} garde « Passer »`);
});

test("inchangés : la course des records sans « Passer »", () => {
  assert.ok(carteApres({mode: "validation", tables: [2, 3, 4, 5, 6, 7, 8, 9], course: "records"}).has("no-skip"));
});

test("sans « Passer », « Valider » prend toute la largeur et le message dit « Tape ta réponse. »", () => {
  assert.match(html, /\.question\.no-skip #skip \{ display: none; \}/);
  assert.match(html, /\.question\.no-skip \.actions \{ grid-template-columns: 1fr; \}/);
  assert.match(source("showAnswerError"), /const passer = !\$\("question-card"\)\.classList\.contains\("no-skip"\)/);
  assert.match(source("showAnswerError"), /"Tape ta réponse\."/);
});
