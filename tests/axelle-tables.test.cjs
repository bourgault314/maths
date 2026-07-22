const test = require("node:test");
const assert = require("node:assert/strict");
const {generateQuestions} = require("../axelle/daily/tables.js");

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

test("le défi crée 25 calculs valides et variés", () => {
  const questions = generateQuestions(seeded(20260722));
  assert.equal(questions.length, 25);
  assert.deepEqual(Object.fromEntries(["direct", "right", "left", "word"].map(type => [type, questions.filter(question => question.type === type).length])), {direct: 12, right: 5, left: 4, word: 4});
  assert.equal(new Set(questions.map(question => question.prompt)).size, 25);
  for (const question of questions) {
    assert.ok(question.first >= 2 && question.first <= 9);
    assert.ok(question.second >= 2 && question.second <= 10);
    if (question.type === "direct") assert.equal(question.answer, question.first * question.second);
    if (question.type === "right" || question.type === "word") assert.equal(question.answer, question.second);
    if (question.type === "left") assert.equal(question.answer, question.first);
  }
});

test("la génération est contrôlable et change avec une autre graine", () => {
  const first = generateQuestions(seeded(17)).map(question => question.prompt);
  assert.deepEqual(first, generateQuestions(seeded(17)).map(question => question.prompt));
  assert.notDeepEqual(first, generateQuestions(seeded(18)).map(question => question.prompt));
});
