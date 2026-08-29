import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";

const require = createRequire(import.meta.url);
const core = require("../outils/calcul_mental/defi_tables_core.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function seededRandom(seed = 123456789) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

test("les cinq parcours gardent les réglages pédagogiques décidés", () => {
  assert.deepEqual(core.PRESETS.learn, {
    total: 10,
    duration: null,
    questionTypes: ["direct"],
    selection: "single",
    order: "ordered"
  });
  assert.deepEqual(core.PRESETS.train, {
    total: 20,
    duration: null,
    questionTypes: ["direct"],
    selection: "multiple",
    order: "random"
  });
  assert.deepEqual(core.PRESETS.test, {
    total: 25,
    duration: 60,
    questionTypes: ["direct"],
    selection: "multiple",
    order: "random"
  });
  assert.deepEqual(core.PRESETS.evaluation, {
    total: 25,
    duration: 60,
    questionTypes: ["evaluation"],
    selection: "automatic",
    order: "random"
  });
});

test("J’apprends travaille une seule table dans l’ordre ou le désordre", () => {
  const ordered = core.generateQuestions({mode: "learn", tables: [9], order: "ordered"}, seededRandom());
  const random = core.generateQuestions({mode: "learn", tables: [9], order: "random"}, seededRandom());

  assert.equal(ordered.length, 10);
  assert.deepEqual(ordered.map(question => question.multiplier), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(ordered.every(question => question.type === "direct" && question.focusTable === 9));
  assert.deepEqual(random.map(question => question.multiplier).toSorted((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.notDeepEqual(random.map(question => question.multiplier), ordered.map(question => question.multiplier));
  assert.throws(() => core.generateQuestions({mode: "learn", tables: [7, 9]}), /exactement une table/);
});

test("Je m’entraîne propose 20 produits directs sans limite de temps", () => {
  const configuration = core.normalizeConfiguration({mode: "train", tables: [6, 7]});
  const questions = core.generateQuestions(configuration, seededRandom());

  assert.equal(configuration.duration, null);
  assert.equal(questions.length, 20);
  assert.ok(questions.every(question => question.type === "direct"));
  assert.deepEqual(new Set(questions.map(question => question.focusTable)), new Set([6, 7]));
  assert.equal(questions.filter(question => question.focusTable === 6).length, 10);
  assert.equal(questions.filter(question => question.focusTable === 7).length, 10);
});

test("Je me teste garde 25 produits directs en une minute", () => {
  const configuration = core.normalizeConfiguration({
    mode: "test",
    tables: [3, 4, 8],
    total: 10,
    duration: null,
    questionTypes: ["division"]
  });
  const questions = core.generateQuestions(configuration, seededRandom());

  assert.equal(configuration.total, 25);
  assert.equal(configuration.duration, 60);
  assert.deepEqual(configuration.questionTypes, ["direct"]);
  assert.equal(questions.length, 25);
  assert.ok(questions.every(question => question.type === "direct"));
});

test("Je règle moi-même permet de mélanger produits, trous et divisions", () => {
  const configuration = core.normalizeConfiguration({
    mode: "custom",
    tables: [4, 6],
    questionTypes: ["direct", "missing", "division"],
    total: 25,
    duration: 120
  });
  const questions = core.generateQuestions(configuration, seededRandom());
  const categories = new Set(questions.map(question => question.type === "division" ? "division" : question.type === "direct" ? "direct" : "missing"));

  assert.equal(configuration.total, 25);
  assert.equal(configuration.duration, 120);
  assert.deepEqual(categories, new Set(["direct", "missing", "division"]));
  assert.ok(questions.filter(question => question.type === "division").every(question => question.prompt.includes("÷")));
});

test("le parcours CM1 conserve son mélange spécifique", () => {
  const questions = core.generateQuestions({mode: "evaluation"}, seededRandom());

  assert.equal(questions.length, 25);
  assert.equal(questions.filter(question => question.type !== "direct").length, 6);
  assert.ok(questions.every(question => question.type === "direct" || ["right", "left"].includes(question.type)));
});

test("l’accueil distingue trois choix principaux et deux réglages complémentaires", () => {
  assert.equal((html.match(/class="mode-card"/g) || []).length, 3);
  assert.match(html, /data-mode="learn"[\s\S]*J’apprends une table/);
  assert.match(html, /data-mode="train"[\s\S]*Je m’entraîne/);
  assert.match(html, /data-mode="test"[\s\S]*Je me teste/);
  assert.match(html, /data-mode="evaluation"[\s\S]*Comme l’évaluation CM1/);
  assert.match(html, /data-mode="custom"[\s\S]*Je règle moi-même/);
  assert.match(html, /data-question-type="division"[\s\S]*Division/);
  assert.match(html, /À ton rythme/);
});
