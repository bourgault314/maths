import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { makeAddition } from "../outils/addition-posee/addition-engine.mjs";
import {
  checkTrainingAnswer,
  firstTrainingError,
  hintForTask,
  makeTrainingTasks,
  trainingErrors,
  trainingFields
} from "../outils/addition-posee/addition-entrainement-engine.mjs";

const html = readFileSync(new URL("../outils/addition-posee/addition-posee-interactive.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../outils/addition-posee/addition-posee-interactive.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/addition-posee/addition-posee-interactive.js", import.meta.url), "utf8");

test("l’entraînement reprend exactement les colonnes du moteur partagé", () => {
  const addition = makeAddition(["584", "279"]);
  const tasks = makeTrainingTasks(addition);
  assert.deepEqual(tasks.map(({ kind }) => kind), ["column", "column", "column", "verify", "finish"]);
  assert.deepEqual(tasks[0].expected, { total: 13, result: 3, carry: 1 });
  assert.deepEqual(tasks[1].expected, { total: 16, result: 6, carry: 1 });
  assert.deepEqual(tasks[2].expected, { total: 8, result: 8 });
  assert.equal(tasks[0].opIndex, addition.operations[0].processingIndex);
  assert.equal(tasks[0].sentence, "4 unités + 9 unités = ?");
  assert.equal(tasks[1].sentence, "8 dizaines + 7 dizaines + 1 dizaine retenue = ?");
  assert.equal(tasks.at(-2).expected.sum, addition.resultCells.join(""));
});

test("le placement des termes est une première étape réellement facultative", () => {
  const addition = makeAddition(["584", "279"]);
  const standardTasks = makeTrainingTasks(addition);
  const placementTasks = makeTrainingTasks(addition, { includePlacement: true });
  const placement = placementTasks[0];

  assert.equal(standardTasks[0].kind, "column");
  assert.equal(placement.kind, "placement");
  assert.equal(placement.title, "Je pose");
  assert.deepEqual(trainingFields(placement), ["term0", "term1"]);
  assert.deepEqual(placement.expected, {
    term0: ["5", "8", "4"],
    term1: ["2", "7", "9"]
  });
  assert.deepEqual(trainingErrors(placement, {
    term0: ["5", "8", "4"],
    term1: ["", "2", "7"]
  }), ["term1"]);
  assert.equal(checkTrainingAnswer(placement, placement.expected), true);
  assert.deepEqual(placementTasks.slice(1).map(({ kind }) => kind), standardTasks.map(({ kind }) => kind));
});

test("le placement partage les colonnes, les zéros utiles et la virgule du moteur", () => {
  const decimal = makeAddition(["12,7", "3,45"]);
  const decimalPlacement = makeTrainingTasks(decimal, { includePlacement: true })[0];
  assert.deepEqual(decimalPlacement.expected, {
    term0: ["1", "2", "7", "0"],
    term1: ["", "3", "4", "5"]
  });
  assert.match(decimalPlacement.sentence, /alignant les virgules/);
  assert.match(hintForTask(decimal, decimalPlacement, "term0", 0), /rangs décimaux manquants avec 0/);
  assert.match(hintForTask(decimal, decimalPlacement, "term1", 0), /juste à gauche de la virgule/);

  const finalCarry = makeAddition(["999", "1"]);
  const carryPlacement = makeTrainingTasks(finalCarry, { includePlacement: true })[0];
  assert.equal(finalCarry.extraIntegerPlaces, 1);
  assert.deepEqual(carryPlacement.expected, {
    term0: ["", "9", "9", "9"],
    term1: ["", "", "", "1"]
  });
});

test("une colonne sans retenue et les zéros se valident sans ambiguïté", () => {
  const noCarry = makeTrainingTasks(makeAddition(["123", "456"])).filter(({ kind }) => kind === "column");
  assert.deepEqual(noCarry.map(({ expected }) => expected), [
    { total: 9, result: 9 },
    { total: 7, result: 7 },
    { total: 5, result: 5 }
  ]);
  const withZeros = makeTrainingTasks(makeAddition(["1005", "97"])).filter(({ kind }) => kind === "column");
  assert.deepEqual(withZeros.map(({ expected }) => expected), [
    { total: 12, result: 2, carry: 1 },
    { total: 10, result: 0, carry: 1 },
    { total: 1, result: 1 },
    { total: 1, result: 1 }
  ]);
  assert.equal(checkTrainingAnswer(withZeros[1], { total: "10", result: "0", carry: "1" }), true);
});

test("les retenues successives et la retenue finale ont chacune leur emplacement", () => {
  const addition = makeAddition(["999", "1"]);
  const tasks = makeTrainingTasks(addition);
  const columns = tasks.filter(({ kind }) => kind === "column");
  assert.deepEqual(columns.map(({ expected }) => expected), [
    { total: 10, result: 0, carry: 1 },
    { total: 10, result: 0, carry: 1 },
    { total: 10, result: 0, carry: 1 }
  ]);
  const finalCarry = tasks.find(({ kind }) => kind === "final-carry");
  assert.deepEqual(finalCarry.resultLayoutIndices, [0]);
  assert.deepEqual(finalCarry.expected, { result: 1 });
  assert.equal(finalCarry.sentence, "Recopie la retenue au rang des milliers.");
});

test("les décimaux gardent l’alignement et les zéros fournis par le même moteur", () => {
  const mixed = makeAddition(["12,7", "3.45"]);
  const tasks = makeTrainingTasks(mixed);
  assert.deepEqual(mixed.displayTerms, ["12,70", "3,45"]);
  assert.equal(mixed.resultDisplay, "16,15");
  assert.equal(tasks[0].sentence, "0 centièmes + 5 centièmes = ?");
  assert.equal(tasks[1].memo, "10 dixièmes = 1 unité");
  assert.deepEqual(tasks.at(-2).expected, { sum: "1615" });

  const small = makeAddition(["0,09", "0,8"]);
  assert.deepEqual(small.displayTerms, ["0,09", "0,80"]);
  assert.deepEqual(makeTrainingTasks(small).at(-2).expected, { sum: "089" });

  const crossing = makeAddition(["0,8", "0,7"]);
  assert.equal(crossing.resultDisplay, "1,5");
  assert.equal(makeTrainingTasks(crossing)[0].memo, "10 dixièmes = 1 unité");
});

test("le calcul intermédiaire est facultatif mais contrôlé lorsqu’il est rempli", () => {
  const addition = makeAddition(["584", "279"]);
  const task = makeTrainingTasks(addition)[0];
  assert.deepEqual(trainingFields(task), ["total", "result", "carry"]);
  assert.deepEqual(trainingErrors(task, { total: 12, result: 2, carry: 0 }), ["total", "result", "carry"]);
  assert.equal(firstTrainingError(task, { total: 12, result: 2, carry: 0 }), "total");
  assert.equal(firstTrainingError(task, { total: "", result: 2, carry: 0 }), "result");
  assert.equal(firstTrainingError(task, { total: 13, result: 2, carry: 0 }), "result");
  assert.equal(firstTrainingError(task, { total: 13, result: 3, carry: 0 }), "carry");
  assert.equal(firstTrainingError(task, { total: "", result: "3", carry: "1" }), null);
  assert.equal(checkTrainingAnswer(task, { result: "3", carry: "1" }), true);
  assert.equal(firstTrainingError(task, { total: "13", result: "3", carry: "1" }), null);
  assert.equal(checkTrainingAnswer(task, { total: "13", result: "3", carry: "1" }), true);
});

test("les indices restent progressifs et ne révèlent qu’un champ à la fois", () => {
  const addition = makeAddition(["584", "279"]);
  const task = makeTrainingTasks(addition)[0];
  assert.match(hintForTask(addition, task, "total", 0), /Additionne tous les chiffres/);
  assert.equal(hintForTask(addition, task, "total", 1), "4 + 9 = 13.");
  assert.match(hintForTask(addition, task, "result", 0), /quel chiffre faut-il écrire ici/);
  assert.doesNotMatch(hintForTask(addition, task, "result", 0), /13/);
  assert.match(hintForTask(addition, task, "result", 1), /est 3/);
  assert.match(hintForTask(addition, task, "carry", 0), /Combien de dizaines/);
  assert.match(hintForTask(addition, task, "carry", 1), /je retiens 1 dizaine/);
});

test("toutes les étapes attendues conduisent à la réussite complète", () => {
  for (const values of [["0", "0"], ["584", "279"], ["999", "1"], ["12,7", "3,45"]]) {
    const addition = makeAddition(values);
    const tasks = makeTrainingTasks(addition, { includePlacement: true });
    for (const task of tasks.filter(({ kind }) => kind !== "finish")) {
      const answer = Object.fromEntries(
        Object.entries(task.expected).map(([field, value]) => [field, Array.isArray(value) ? [...value] : String(value)])
      );
      assert.equal(checkTrainingAnswer(task, answer), true, `${values.join(" + ")} — ${task.id}`);
    }
    assert.equal(tasks.at(-1).sentence, `${addition.displayTerms.join(" + ")} = ${addition.resultDisplay}.`);
  }
});

test("l’interface élève réutilise le moteur, reste tactile et ne contient pas de solution initiale", () => {
  assert.match(html, /addition-posee-interactive\.css\?v=3/);
  assert.match(html, /addition-posee-interactive\.js\?v=3/);
  assert.doesNotMatch(html, /data-mode="(?:integer|decimal)"/);
  assert.match(html, /id="rank-guides" type="checkbox"/);
  assert.match(html, /id="placement-mode" type="checkbox"/);
  assert.match(html, /Je place les nombres/);
  assert.match(html, /id="validate"[^>]*>Vérifier l’étape/);
  assert.match(html, /id="help"[^>]*>Un indice/);
  assert.match(html, /aria-live="polite" aria-atomic="true"/);
  assert.match(html, /fullscreen-collapse[^>]*hidden/);
  assert.doesNotMatch(html, />863</);
  assert.match(js, /addition-engine\.mjs\?v=1/);
  assert.match(js, /addition-entrainement-engine\.mjs\?v=2/);
  assert.match(js, /Total de la colonne, facultatif/);
  assert.match(js, /"prompt-optional", "facultatif"/);
  assert.match(js, /find\(\(input\) => input\.dataset\.answer !== "total"\)/);
  assert.match(js, /makeAddition\(\[firstInput\.value, secondInput\.value\]\)/);
  assert.match(js, /Math\.random\(\) < \.45 \? 1 \+ Math\.floor\(Math\.random\(\) \* 3\) : 0/);
  assert.match(js, /makeTrainingTasks\(addition, \{ includePlacement: selfPlacement \}\)/);
  assert.match(js, /completed\.set\(task\.id, answer\)/);
  assert.match(js, /document\.addEventListener\("paste"/);
  assert.match(js, /document\.exitFullscreen\(\)/);
  assert.match(js, /fullscreenchange/);
  assert.match(js, /window\.addEventListener\("resize"/);
  assert.match(css, /min-width:\s*44px/);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
