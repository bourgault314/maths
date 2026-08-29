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
    duration: 120,
    questionTypes: ["direct"],
    selection: "multiple",
    order: "random",
    testLevel: 1
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

test("Je deviens expert propose trois niveaux et une à trois minutes", () => {
  const level1 = core.normalizeConfiguration({
    mode: "test",
    tables: [3, 4, 8],
    total: 10,
    duration: null,
    questionTypes: ["division"],
    testLevel: 1
  });
  const level2 = core.normalizeConfiguration({mode: "test", tables: [3, 4, 8], duration: 60, testLevel: 2});
  const level3 = core.normalizeConfiguration({mode: "test", tables: [3, 4, 8], duration: 180, testLevel: 3});
  const questions1 = core.generateQuestions(level1, seededRandom());
  const questions2 = core.generateQuestions(level2, seededRandom());
  const questions3 = core.generateQuestions(level3, seededRandom());

  assert.equal(level1.total, 25);
  assert.equal(level1.duration, 120);
  assert.deepEqual(level1.questionTypes, ["direct"]);
  assert.equal(questions1.length, 25);
  assert.ok(questions1.every(question => question.category === "direct"));

  assert.equal(level2.duration, 60);
  assert.deepEqual(new Set(questions2.map(question => question.category)), new Set(["direct", "missing"]));

  assert.equal(level3.duration, 180);
  assert.deepEqual(new Set(questions3.map(question => question.category)), new Set(["direct", "missing", "division"]));
  assert.deepEqual(
    new Set(questions3.filter(question => question.category === "division").map(question => question.type)),
    new Set(["division-quotient", "division-dividend", "division-divisor"])
  );
  assert.ok(questions3.some(question => /^\? ÷ \d+ = \d+$/.test(question.prompt)));
  assert.ok(questions3.some(question => /^\d+ ÷ \? = \d+$/.test(question.prompt)));
  assert.ok(questions3.some(question => /^\d+ ÷ \d+ = \?$/.test(question.prompt)));
});

test("Réglages permet de mélanger produits, trous et divisions", () => {
  const configuration = core.normalizeConfiguration({
    mode: "custom",
    tables: [4, 6],
    questionTypes: ["direct", "missing", "division"],
    total: 25,
    duration: 120
  });
  const questions = core.generateQuestions(configuration, seededRandom());
  const categories = new Set(questions.map(question => question.category));

  assert.equal(configuration.total, 25);
  assert.equal(configuration.duration, 120);
  assert.deepEqual(categories, new Set(["direct", "missing", "division"]));
  assert.ok(questions.filter(question => question.category === "division").every(question => question.prompt.includes("÷")));
});

test("le parcours CM1 conserve son mélange spécifique", () => {
  const questions = core.generateQuestions({mode: "evaluation"}, seededRandom());

  assert.equal(questions.length, 25);
  assert.equal(questions.filter(question => question.type !== "direct").length, 6);
  assert.ok(questions.every(question => question.type === "direct" || ["right", "left"].includes(question.type)));
});

test("l’accueil compact distingue quatre choix principaux et l’évaluation CM1", () => {
  assert.equal((html.match(/class="mode-card"/g) || []).length, 4);
  assert.match(html, /data-mode="learn"[\s\S]*J’apprends/);
  assert.match(html, /data-mode="train"[\s\S]*Je m’entraîne/);
  assert.match(html, /data-mode="test"[\s\S]*Je deviens expert/);
  assert.match(html, /data-mode="evaluation"[\s\S]*Comme l’évaluation CM1/);
  assert.match(html, /data-mode="custom"[\s\S]*Réglages[\s\S]*Je choisis tout/);
  assert.match(html, /data-question-type="division"[\s\S]*Division/);
  assert.match(html, /data-test-level="1"[\s\S]*Niveau 1/);
  assert.match(html, /data-test-level="2"[\s\S]*Niveau 2/);
  assert.match(html, /data-test-level="3"[\s\S]*Niveau 3/);
  assert.match(html, /data-duration="180"[\s\S]*3 min/);
  assert.match(html, /data-duration="120"[\s\S]*2 min/);
  assert.match(html, /data-duration="60"[\s\S]*1 min/);
  assert.doesNotMatch(html, /Choisis ton objectif\. L’application prépare le reste pour toi/);
  assert.doesNotMatch(html, /Tu verras ses dix produits/);
});

test("la réponse s’affiche dans le calcul sans déplacer le clavier", () => {
  assert.match(html, /className = "inline-answer"/);
  assert.match(html, /replaceChildren\(document\.createTextNode\(before\), slot/);
  assert.doesNotMatch(html, /id="answer"/);
  assert.match(html, /\.answer-feedback \{[\s\S]*min-height:/);
  assert.match(html, /@media \(max-width: 620px\)[\s\S]*\.fullscreen-toggle \{ display: none; \}/);
});
