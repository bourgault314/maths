import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { makeDivision } from "../outils/division-posee/division-engine.mjs";
import {
  checkTrainingAnswer,
  firstTrainingError,
  hintForTask,
  makeTrainingTasks,
  taskRevealsTable,
  trainingErrors
} from "../outils/division-posee/division-entrainement-engine.mjs";
import { loweringArrowGeometry } from "../outils/division-posee/division-view.mjs";

const html = readFileSync(new URL("../outils/division-posee/division-posee-interactive.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../outils/division-posee/division-posee-interactive.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/division-posee/division-posee-interactive.js", import.meta.url), "utf8");
const entryPage = readFileSync(new URL("../outils/division-posee/index.html", import.meta.url), "utf8");

test("l’entraînement valide un bloc mathématique complet à chaque étape", () => {
  const division = makeDivision(584, 7, "integer", 2);
  const tasks = makeTrainingTasks(division);
  assert.deepEqual(tasks.map(({ kind }) => kind), ["anticipation", "anticipation", "stage", "stage", "verify", "finish"]);
  assert.deepEqual(tasks[0].expected, { decision: "no" });
  assert.deepEqual(tasks[1].expected, { decision: "yes" });
  assert.equal(tasks[1].successSentence, "Oui. Le quotient commence au rang des dizaines : il aura 2 chiffres.");
  assert.deepEqual(tasks[2].expected, { quotient: 8, product: 56, remainder: 2 });
  assert.deepEqual(tasks[3].expected, { quotient: 3, product: 21, remainder: 3 });
  assert.equal(checkTrainingAnswer(tasks[2], { quotient: "8", product: "56", remainder: "2" }), true);
  assert.equal(checkTrainingAnswer(tasks[2], { quotient: "7", product: "49", remainder: "9" }), false);
});

test("la première erreur est signalée dans l’ordre causal", () => {
  const stage = makeTrainingTasks(makeDivision(584, 7, "integer", 2)).find(({ kind }) => kind === "stage");
  assert.deepEqual(trainingErrors(stage, { quotient: 7, product: 49, remainder: 9 }), ["quotient", "product", "remainder"]);
  assert.equal(firstTrainingError(stage, { quotient: 7, product: 49, remainder: 9 }), "quotient");
  assert.equal(firstTrainingError(stage, { quotient: 8, product: 49, remainder: 9 }), "product");
  assert.equal(firstTrainingError(stage, { quotient: 8, product: 56, remainder: 9 }), "remainder");
  assert.equal(firstTrainingError(stage, { quotient: 8, product: 56, remainder: 2 }), null);
});

test("les indices deviennent précis sans révéler toute la division d’un coup", () => {
  const division = makeDivision(584, 7, "integer", 2);
  const tasks = makeTrainingTasks(division);
  const anticipation = tasks[0];
  const stage = tasks.find(({ kind }) => kind === "stage");
  assert.match(hintForTask(division, anticipation, "decision", 0), /Compare 5 centaines aux 7 parts/);
  assert.equal(hintForTask(division, anticipation, "decision", 1), "5 est plus petit que 7 : chaque part ne peut pas recevoir 1 centaine.");
  assert.match(hintForTask(division, stage, "quotient", 0), /plus grand produit/);
  assert.match(hintForTask(division, stage, "quotient", 1), /8 × 7 = 56/);
  assert.equal(taskRevealsTable(stage, "quotient"), true);
  assert.equal(taskRevealsTable(stage, "product"), true);
  assert.equal(taskRevealsTable(stage, "remainder"), false);
});

test("l’anticipation fonctionne avec un diviseur à deux chiffres", () => {
  const division = makeDivision(584, 21, "integer", 2);
  const tasks = makeTrainingTasks(division);
  assert.equal(tasks[0].sentence, "Je partage 5 centaines en 21 parts égales.");
  assert.equal(tasks[0].detail, "Chaque part peut-elle recevoir au moins 1 centaine ?");
  assert.deepEqual(tasks[0].expected, { decision: "no" });
  assert.equal(tasks[0].successSentence, "Non. J’échange 5 centaines contre 50 dizaines. Avec 8 dizaines, j’obtiens 58 dizaines.");
  assert.equal(tasks[1].sentence, "Je partage 58 dizaines en 21 parts égales.");
  assert.equal(tasks[1].detail, "Chaque part peut-elle recevoir au moins 1 dizaine ?");
  assert.deepEqual(tasks[1].expected, { decision: "yes" });
  const stage = tasks.find(({ kind }) => kind === "stage");
  assert.equal(stage.sentence, "Pour trouver le chiffre des dizaines du quotient, je cherche : dans 58, combien de fois 21 ?");
  assert.equal(stage.detail, "Je partage 58 dizaines en 21 parts égales.");
  assert.deepEqual(stage.expected, { quotient: 2, product: 42, remainder: 16 });
});

test("le vocabulaire de numération suit les étages de la division", () => {
  const tasks = makeTrainingTasks(makeDivision(5849, 7, "integer", 2));
  const stages = tasks.filter(({ kind }) => kind === "stage");
  assert.equal(stages[0].sentence, "Pour trouver le chiffre des centaines du quotient, je cherche : dans 58, combien de fois 7 ?");
  assert.equal(stages[0].detail, "Je partage 58 centaines en 7 parts égales.");
  assert.equal(stages[1].sentence, "Pour trouver le chiffre des dizaines du quotient, je cherche : dans 24, combien de fois 7 ?");
  assert.equal(stages[1].detail, "Je partage 24 dizaines en 7 parts égales.");
  assert.equal(stages[2].sentence, "Pour trouver le chiffre des unités du quotient, je cherche : dans 39, combien de fois 7 ?");
  assert.equal(stages[2].detail, "Je partage 39 unités en 7 parts égales.");
});

test("les zéros du quotient et le cas dividende inférieur au diviseur sont conservés", () => {
  const zeroTasks = makeTrainingTasks(makeDivision(1005, 5, "integer", 2));
  assert.deepEqual(zeroTasks.filter(({ kind }) => kind === "stage").map(({ expected }) => expected.quotient), [2, 0, 1]);
  const smallTasks = makeTrainingTasks(makeDivision(3, 7, "integer", 2));
  assert.deepEqual(smallTasks[0].expected, { decision: "no" });
  assert.equal(smallTasks[0].successSentence, "Non. Le quotient entier est 0.");
  assert.deepEqual(smallTasks[1].expected, { quotient: 0, product: 0, remainder: 3 });
  assert.ok(!smallTasks.some(({ kind }) => kind === "estimate"));
});

test("l’interface propose validation par bloc, table facultative et adaptation mobile", () => {
  assert.match(html, /division-posee-interactive\.css\?v=8/);
  assert.match(html, /division-posee-interactive\.js\?v=10/);
  assert.match(html, /id="rank-guides" type="checkbox"/);
  assert.match(html, /id="table-bracket"[^>]*hidden/);
  assert.match(html, /id="validate"[^>]*>Vérifier l’étape/);
  assert.match(html, /id="help"[^>]*>Un indice/);
  assert.match(html, /id="table-toggle"[^>]*>Voir la table/);
  assert.match(js, /firstTrainingError\(task, answer\)/);
  assert.match(js, /completed\.set\(task\.id, answer\)/);
  assert.match(js, /task\.kind === "anticipation" \? 1200 : 480/);
  assert.match(js, /division-engine\.mjs\?v=11/);
  assert.match(js, /division-view\.mjs\?v=3/);
  assert.match(js, /renderMultiplicationTable\(/);
  assert.match(js, /compactToggle:\s*true/);
  assert.match(js, /multiplicationBracket\(division, task\.opIndex\)/);
  assert.match(js, /mathsgo-division-rank-guides/);
  assert.match(js, /createQuotientSlot\(\{/);
  assert.match(js, /window\.innerWidth <= 780/);
  assert.match(js, /window\.addEventListener\("resize"/);
  assert.match(js, /scheduleLoweringArrow\(root\)/);
  assert.match(js, /button\.dataset\.decision = value/);
  assert.match(css, /\.anticipation-choice\.is-selected/);
  assert.doesNotMatch(js, /rowHeight \* \(1\.02 \+ \(2 \* index\)\)/);
  assert.match(css, /\.practice-stage[^}]*overflow:\s*hidden/);
  assert.match(css, /@media \(min-width: 1280px\)[\s\S]*\.practice-instruction[^}]*grid-column:\s*1[^}]*grid-row:\s*1 \/ 4/);
  assert.match(css, /@media \(max-width: 930px\)/);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /\.practice-table:not\(\.is-open\) \.practice-multiples/);
  assert.match(css, /grid-template-columns:\s*minmax\(58px, 1fr\) auto/);
});

test("les réponses sont saisies chiffre par chiffre dans leur colonne", () => {
  assert.match(js, /function appendGridInputs\(/);
  assert.match(js, /holder\.style\.gridColumn = String\(start \+ offset \+ 1\)/);
  assert.match(js, /input\.dataset\.digitIndex/);
  assert.match(js, /function makeRelationDigitGroup\(/);
  assert.match(js, /function setDigitDraft\(/);
  assert.match(js, /document\.addEventListener\("paste"/);
  assert.match(css, /--practice-cell-size:\s*min\(38px, calc\(var\(--column-width/);
  assert.match(css, /\.operation-answer[^}]*width:\s*var\(--practice-cell-size\)[^}]*height:\s*var\(--practice-cell-size\)/);
  assert.match(css, /\.practice-quotient \.quotient-slot\.is-empty \.quotient-slot-value[^}]*border:\s*2px dashed/);
  assert.match(css, /\.relation-digit-group[^}]*grid-template-columns:\s*repeat\(var\(--digit-count\)/);
});

test("la flèche relie réellement le chiffre source au chiffre abaissé", () => {
  assert.deepEqual(
    loweringArrowGeometry(
      { left: 520, width: 40, bottom: 170 },
      { top: 545 },
      { left: 100, top: 80 }
    ),
    { left: 440, top: 95, height: 363 }
  );
  assert.equal(
    loweringArrowGeometry(
      { left: 520, width: 40, bottom: 560 },
      { top: 545 },
      { left: 100, top: 80 }
    ),
    null
  );
});

test("la page d’entrée sépare comprendre, s’entraîner et imprimer", () => {
  assert.match(entryPage, /catalogue-refonte\.css\?v=breadcrumb-align-20260829-1/);
  assert.match(entryPage, /operation-entry\.css\?v=1/);
  assert.match(entryPage, /<body class="catalogue-is-deep operation-entry">/);
  assert.match(entryPage, /class="site-shell"/);
  assert.match(entryPage, /class="catalogue-breadcrumb"/);
  assert.match(entryPage, /class="main-panel catalogue-deep-view"/);
  assert.match(entryPage, />Calculs posés<\/a>/);
  assert.doesNotMatch(entryPage, /collection/i);
  assert.match(entryPage, /Comprendre et projeter/);
  assert.match(entryPage, /S’entraîner/);
  assert.match(entryPage, /Imprimer et plastifier/);
  assert.match(entryPage, /href="division-posee-interactive\.html"/);
});
