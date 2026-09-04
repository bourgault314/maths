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
  trainingBounds,
  trainingErrors
} from "../outils/division-posee/division-entrainement-engine.mjs";

const html = readFileSync(new URL("../outils/division-posee/division-posee-interactive.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../outils/division-posee/division-posee-interactive.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/division-posee/division-posee-interactive.js", import.meta.url), "utf8");
const collection = readFileSync(new URL("../outils/division-posee/index.html", import.meta.url), "utf8");

test("l’entraînement valide un bloc mathématique complet à chaque étape", () => {
  const division = makeDivision(584, 7, "integer", 2);
  const tasks = makeTrainingTasks(division);
  assert.deepEqual(tasks.map(({ kind }) => kind), ["anticipation", "stage", "stage", "verify", "finish"]);
  assert.deepEqual(tasks[0].expected, { lower: 70, upper: 700, digitCount: 2 });
  assert.deepEqual(tasks[1].expected, { quotient: 8, product: 56, remainder: 2 });
  assert.deepEqual(tasks[2].expected, { quotient: 3, product: 21, remainder: 3 });
  assert.equal(checkTrainingAnswer(tasks[1], { quotient: "8", product: "56", remainder: "2" }), true);
  assert.equal(checkTrainingAnswer(tasks[1], { quotient: "7", product: "49", remainder: "9" }), false);
});

test("la première erreur est signalée dans l’ordre causal", () => {
  const stage = makeTrainingTasks(makeDivision(584, 7, "integer", 2))[1];
  assert.deepEqual(trainingErrors(stage, { quotient: 7, product: 49, remainder: 9 }), ["quotient", "product", "remainder"]);
  assert.equal(firstTrainingError(stage, { quotient: 7, product: 49, remainder: 9 }), "quotient");
  assert.equal(firstTrainingError(stage, { quotient: 8, product: 49, remainder: 9 }), "product");
  assert.equal(firstTrainingError(stage, { quotient: 8, product: 56, remainder: 9 }), "remainder");
  assert.equal(firstTrainingError(stage, { quotient: 8, product: 56, remainder: 2 }), null);
});

test("les indices deviennent précis sans révéler toute la division d’un coup", () => {
  const division = makeDivision(584, 7, "integer", 2);
  const [anticipation, stage] = makeTrainingTasks(division);
  assert.match(hintForTask(division, anticipation, "lower", 0), /produits de 7 par 10, 100/);
  assert.equal(hintForTask(division, anticipation, "lower", 1), "7 × 10 = 70 et 7 × 100 = 700.");
  assert.match(hintForTask(division, stage, "quotient", 0), /plus grand produit/);
  assert.match(hintForTask(division, stage, "quotient", 1), /8 × 7 = 56/);
  assert.equal(taskRevealsTable(stage, "quotient"), true);
  assert.equal(taskRevealsTable(stage, "product"), true);
  assert.equal(taskRevealsTable(stage, "remainder"), false);
});

test("l’anticipation fonctionne avec un diviseur à deux chiffres", () => {
  const division = makeDivision(584, 21, "integer", 2);
  assert.deepEqual(trainingBounds(division), {
    lower: 210,
    upper: 2100,
    lowerQuotient: 10,
    upperQuotient: 100,
    digitCount: 2
  });
  const tasks = makeTrainingTasks(division);
  assert.equal(tasks[1].sentence, "Dans 58 dizaines, combien de fois 21 ?");
  assert.deepEqual(tasks[1].expected, { quotient: 2, product: 42, remainder: 16 });
});

test("le vocabulaire de numération suit les étages de la division", () => {
  const tasks = makeTrainingTasks(makeDivision(5849, 7, "integer", 2));
  assert.equal(tasks[1].sentence, "Dans 58 centaines, combien de fois 7 ?");
  assert.equal(tasks[2].sentence, "Dans 24 dizaines, combien de fois 7 ?");
  assert.equal(tasks[3].sentence, "Dans 39 unités, combien de fois 7 ?");
});

test("les zéros du quotient et le cas dividende inférieur au diviseur sont conservés", () => {
  const zeroTasks = makeTrainingTasks(makeDivision(1005, 5, "integer", 2));
  assert.deepEqual(zeroTasks.filter(({ kind }) => kind === "stage").map(({ expected }) => expected.quotient), [2, 0, 1]);
  const smallTasks = makeTrainingTasks(makeDivision(3, 7, "integer", 2));
  assert.deepEqual(smallTasks[0].expected, { lower: 0, upper: 7, digitCount: 1 });
  assert.deepEqual(smallTasks[1].expected, { quotient: 0, product: 0, remainder: 3 });
  assert.ok(!smallTasks.some(({ kind }) => kind === "estimate"));
});

test("l’interface propose validation par bloc, table facultative et adaptation mobile", () => {
  assert.match(html, /division-posee-interactive\.css\?v=4/);
  assert.match(html, /division-posee-interactive\.js\?v=3/);
  assert.match(html, /id="validate"[^>]*>Vérifier l’étape/);
  assert.match(html, /id="help"[^>]*>Un indice/);
  assert.match(html, /id="table-toggle"[^>]*>Voir la table/);
  assert.match(js, /firstTrainingError\(task, answer\)/);
  assert.match(js, /completed\.set\(task\.id, answer\)/);
  assert.match(js, /task\.kind === "stage" \? 820 : 480/);
  assert.match(js, /Array\.from\(\{ length: 10 \}/);
  assert.match(js, /window\.innerWidth <= 780/);
  assert.match(js, /window\.addEventListener\("resize"/);
  assert.match(js, /digit\.append\(arrow\)/);
  assert.match(js, /arrow\.style\.height = `\$\{rowHeight \* \(1\.02 \+ \(2 \* index\)\)\}px`/);
  assert.match(css, /\.practice-lower-arrow[^}]*top:\s*calc\(100% \+ 4px\)[^}]*left:\s*50%/);
  assert.match(css, /\.practice-stage[^}]*overflow:\s*hidden/);
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
  assert.match(css, /\.practice-quotient \.quotient-slot\.is-empty[^}]*border:\s*2px dashed/);
  assert.match(css, /\.relation-digit-group[^}]*grid-template-columns:\s*repeat\(var\(--digit-count\)/);
});

test("la collection sépare comprendre, s’entraîner et imprimer", () => {
  assert.match(collection, /catalogue-refonte\.css\?v=breadcrumb-align-20260829-1/);
  assert.match(collection, /<body class="catalogue-is-deep">/);
  assert.match(collection, /class="site-shell"/);
  assert.match(collection, /class="catalogue-breadcrumb"/);
  assert.match(collection, /class="main-panel catalogue-deep-view"/);
  assert.match(collection, />Numération<\/a>/);
  assert.doesNotMatch(collection, /collection-index\.css/);
  assert.match(collection, /Comprendre &amp; projeter/);
  assert.match(collection, /S’entraîner/);
  assert.match(collection, /Imprimer &amp; plastifier/);
  assert.match(collection, /href="division-posee-interactive\.html"/);
});
