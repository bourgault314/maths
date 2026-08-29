import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";

const require = createRequire(import.meta.url);
const core = require("../outils/calcul_mental/defi_tables_core.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const revisionPdf = await readFile(new URL("../outils/calcul_mental/fiche_tables_multiplication.pdf", import.meta.url));
const editableSource = await readFile(new URL("../_sources/defi-tables/fiche_tables_multiplication.docx", import.meta.url));

function seededRandom(seed = 123456789) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

test("les cinq parcours gardent les réglages pédagogiques décidés", () => {
  assert.deepEqual(core.PRESETS.learn, {
    total: 11,
    duration: null,
    questionTypes: ["direct"],
    selection: "single",
    order: "ordered",
    learnActivity: "construct"
  });
  assert.deepEqual(core.PRESETS.train, {
    total: 10,
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

test("J’apprends laisse choisir le bâton, l’ordre ou le désordre", () => {
  const construct = core.generateQuestions({mode: "learn", tables: [9], learnActivity: "construct"}, seededRandom());
  const gaps = core.generateQuestions({mode: "learn", tables: [9], learnActivity: "gaps"}, seededRandom());
  const ordered = core.generateQuestions({mode: "learn", tables: [9], learnActivity: "ordered"}, seededRandom());
  const random = core.generateQuestions({mode: "learn", tables: [9], learnActivity: "random"}, seededRandom());

  assert.equal(core.normalizeConfiguration({mode: "learn", tables: [9]}).learnActivity, "construct");
  assert.deepEqual(construct.map(question => question.multiplier), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(construct.every(question => question.learnActivity === "construct"));
  assert.equal(gaps.length, 8);
  assert.deepEqual(gaps.map(question => question.multiplier).toSorted((a, b) => a - b), [1, 2, 3, 4, 6, 7, 8, 9]);
  assert.equal(core.normalizeConfiguration({mode: "learn", tables: [9], learnActivity: "gaps"}).total, 8);
  assert.equal(ordered.length, 11);
  assert.deepEqual(ordered.map(question => question.multiplier), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(ordered.every(question => question.type === "direct" && question.focusTable === 9));
  assert.deepEqual(random.map(question => question.multiplier).toSorted((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.notDeepEqual(random.map(question => question.multiplier), ordered.map(question => question.multiplier));
  assert.ok(random.every(question => question.learnActivity === "random"));
  assert.throws(() => core.generateQuestions({mode: "learn", tables: [7, 9]}), /exactement une table/);
});

test("Je m’entraîne propose 10 ou 20 produits directs sans limite de temps", () => {
  const shortConfiguration = core.normalizeConfiguration({mode: "train", tables: [6, 7]});
  const longConfiguration = core.normalizeConfiguration({mode: "train", tables: [6, 7], total: 20});
  const shortQuestions = core.generateQuestions(shortConfiguration, seededRandom());
  const longQuestions = core.generateQuestions(longConfiguration, seededRandom());

  assert.equal(shortConfiguration.duration, null);
  assert.equal(shortQuestions.length, 10);
  assert.equal(longQuestions.length, 20);
  assert.ok(longQuestions.every(question => question.type === "direct"));
  assert.deepEqual(new Set(longQuestions.map(question => question.focusTable)), new Set([6, 7]));
  assert.equal(longQuestions.filter(question => question.focusTable === 6).length, 10);
  assert.equal(longQuestions.filter(question => question.focusTable === 7).length, 10);
  assert.ok(longQuestions.every(question => question.multiplier >= 1));
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
  assert.ok(questions.every(question => question.first >= 1 && question.second >= 1));
});

test("l’accueil compact distingue quatre choix principaux et l’évaluation CM1", () => {
  assert.equal((html.match(/class="mode-card"/g) || []).length, 4);
  assert.match(html, /data-mode="learn"[\s\S]*J’apprends/);
  assert.match(html, /data-mode="train"[\s\S]*Je m’entraîne/);
  assert.match(html, /data-mode="test"[\s\S]*Je deviens expert/);
  assert.match(html, /data-mode="evaluation"[\s\S]*Comme l’évaluation CM1/);
  assert.match(html, /data-mode="custom"[\s\S]*Réglages[\s\S]*Je choisis tout/);
  assert.match(html, /href="\.\/fiche_tables_multiplication\.pdf"[^>]*download>↓ Télécharger la fiche de révision/);
  assert.match(html, /data-question-type="division"[\s\S]*Division/);
  assert.match(html, /data-test-level="1"[\s\S]*Niveau 1/);
  assert.match(html, /data-test-level="2"[\s\S]*Niveau 2/);
  assert.match(html, /data-test-level="3"[\s\S]*Niveau 3/);
  assert.match(html, /data-duration="180"[\s\S]*3 min/);
  assert.match(html, /data-duration="120"[\s\S]*2 min/);
  assert.match(html, /data-duration="60"[\s\S]*1 min/);
  assert.match(html, /data-mode="train"[\s\S]*10 ou 20 questions/);
  assert.match(html, /count-settings[\s\S]*data-total="10"[\s\S]*data-total="20"/);
  assert.match(html, /data-learn-activity="construct"[\s\S]*Je construis le bâton/);
  assert.match(html, /class="type-button is-selected"[^>]*data-learn-activity="construct"/);
  assert.match(html, /data-learn-activity="gaps"[\s\S]*Je complète un bâton à trous/);
  assert.match(html, /data-learn-activity="ordered"[\s\S]*Je réponds dans l’ordre/);
  assert.match(html, /data-learn-activity="random"[\s\S]*Je réponds dans le désordre/);
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

test("J’apprends démarre directement et les autres parcours gardent leur confirmation", () => {
  assert.match(html, /id="launch-summary"/);
  assert.match(html, /id="launch-start"[\s\S]*C’est parti/);
  assert.match(html, /\$\("launch-start"\)\.addEventListener\("click", beginRound\)/);
  assert.doesNotMatch(html, /setTimeout\(beginRound/);
  assert.match(html, /if \(config\.mode === "learn"\) \{[\s\S]*beginRound\(\);[\s\S]*return;/);
  assert.match(html, /de ×0 à ×10/);
  assert.match(html, /niveau \$\{config\.testLevel\} · 25 questions/);
});

test("J’apprends remplit un bâton dans les deux ordres et Je m’entraîne corrige immédiatement", () => {
  assert.match(html, /class="keypad"[\s\S]*class="actions"[\s\S]*id="learn-sequence"/);
  assert.match(html, /question-card"\)\.classList\.toggle\("show-learn-sequence", visible\)/);
  assert.match(html, /\.question\.show-learn-sequence \.actions \{ margin-bottom: 0; \}/);
  assert.match(html, /function createNumberStick/);
  assert.match(html, /grid-template-columns: repeat\(11/);
  assert.match(html, /multiplierLabel\.textContent = `×\$\{multiplier\}`/);
  assert.match(html, /multiplierLabel\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(html, /cell\.append\(multiplierLabel, value\)/);
  assert.match(html, /const visible = state\.configuration\?\.mode === "learn"/);
  assert.match(html, /state\.revealedLearnResults\.add\(question\.multiplier\)/);
  assert.match(html, /config\.learnActivity === "gaps" \? \[0, 5, 10\] : \[\]/);
  assert.match(html, /draftMultiplier: stickOnly \? question\?\.multiplier : null/);
  assert.match(html, /activeMultiplier: stickOnly \? question\?\.multiplier : null/);
  assert.match(html, /if \(stickOnly\) \$\("answer-feedback"\)\.before\(zone\)/);
  assert.match(html, /else \$\("expression"\)\.before\(zone\)/);
  assert.match(html, /question\?\.multiplier === 0 \? "Commence à 0\." : `Ajoute \$\{table\}\.\`/);
  assert.match(html, /if \(correct\) \{[\s\S]*\$\("validate"\)\.style\.visibility = "hidden";[\s\S]*scheduleAutoAdvance\(\);/);
  assert.match(html, /\$\("validate"\)\.style\.visibility = "";[\s\S]*setAnswerControlsEnabled\(true\)/);
  assert.match(html, /\}, 800\);/);
  assert.match(html, /\.question\.stick-trace \.learn-sequence \{ margin: 0 0 8px; \}/);
  assert.match(html, /\.question\.stick-trace \.number-stick-cell \{[\s\S]*min-height: 42px;[\s\S]*grid-template-rows: 14px minmax\(28px, 1fr\);/);
  assert.match(html, /\.question\.stick-trace \.number-stick-value \{[\s\S]*min-height: 28px;[\s\S]*font-size: clamp\(\.66rem, 2\.2vw, \.9rem\);/);
  assert.match(html, /\.challenge-playing \.number-stick-cell \{ min-height: 54px; grid-template-rows: 16px minmax\(38px, 1fr\); \}/);
  assert.match(html, /\.challenge-playing \.number-stick-value \{ min-height: 38px; font-size: clamp\(\.68rem, 3vw, \.9rem\); \}/);
  assert.doesNotMatch(html, /results\.join\(" → "\)/);
  assert.match(html, /state\.configuration\.mode === "train"\) \{[\s\S]*showAnswerFeedback/);
  assert.match(html, /textContent = enabled \? "Valider" : "Suivant"/);
  assert.match(html, /completeReview = state\.configuration\.mode === "test"/);
  assert.match(html, /Bilan de tes réponses/);
  assert.match(html, /defi_tables_core\.js\?v=20260829-6/);
});

test("le numéro de question est séparé du calcul dans le bilan", () => {
  assert.match(html, /number\.textContent = `Question \$\{entry\.number\}`/);
  assert.match(html, /expression\.textContent = entry\.prompt/);
  assert.match(html, /item\.append\(questionLine, answers\)/);
  assert.doesNotMatch(html, /expression\.textContent = `\$\{entry\.number\}\. /);
});

test("les détails mobiles restent alignés et les titres programmatiquement ciblés n’affichent pas de cadre", () => {
  assert.match(html, /h1\[tabindex="-1"\]:focus \{ outline: none; \}/);
  assert.match(html, /\.time-options\.is-timed-only \{ grid-template-columns: repeat\(3/);
  assert.match(html, /classList\.toggle\("is-timed-only", configuration\.mode === "test"\)/);
});

test("la fiche PDF est publique mais sa source modifiable n’est pas proposée aux élèves", () => {
  assert.equal(revisionPdf.subarray(0, 4).toString(), "%PDF");
  assert.equal(editableSource.subarray(0, 2).toString(), "PK");
  assert.match(html, /href="\.\/fiche_tables_multiplication\.pdf"[^>]*download/);
  assert.doesNotMatch(html, /fiche_tables_multiplication\.docx/);
});
