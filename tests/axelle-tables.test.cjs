const test = require("node:test");
const assert = require("node:assert/strict");
const {generateTables, generateCalculations, buildCorrections} = require("../axelle/defis/logic.js");

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

test("le défi tables crée 25 égalités exactes dans les quatre formats", () => {
  const questions = generateTables(seeded(20260722));
  assert.equal(questions.length, 25);
  assert.deepEqual(Object.fromEntries(["direct","right","left","reverse"].map(type => [type, questions.filter(q => q.type === type).length])), {direct:13,right:4,left:4,reverse:4});
  assert.equal(new Set(questions.map(question => question.prompt)).size, 25);
  for (const question of questions) {
    assert.match(question.prompt, /=/);
    assert.doesNotMatch(question.prompt, /combien|fois combien/i);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 1 && question.answer <= 100);
  }
  assert.ok(questions.some(question => /^\d+ = \d+ × \?$/.test(question.prompt)), "le format 35 = 5 × ? manque");
});

test("le défi calcul crée 30 calculs variés et valides", () => {
  const questions = generateCalculations(seeded(91));
  assert.equal(questions.length, 30);
  assert.equal(new Set(questions.map(question => question.prompt)).size, 30);
  assert.ok(questions.some(question => question.type === "complement"));
  assert.ok(questions.some(question => question.type === "multiply"));
  assert.ok(questions.some(question => question.type.startsWith("subtract")));
  for (const question of questions) assert.ok(Number.isInteger(question.answer) && question.answer >= 0, question.prompt);
});

test("les deux générations sont reproductibles avec une graine", () => {
  assert.deepEqual(generateTables(seeded(17)), generateTables(seeded(17)));
  assert.notDeepEqual(generateTables(seeded(17)), generateTables(seeded(18)));
  assert.deepEqual(generateCalculations(seeded(41)), generateCalculations(seeded(41)));
});

test("le bilan ne reprend que les erreurs avec la réponse donnée et la correction", () => {
  const questions = [
    {prompt:"3 × 4 = ?",answer:12},
    {prompt:"35 = 5 × ?",answer:7},
    {prompt:"9 × ? = 54",answer:6},
    {prompt:"8 × 8 = ?",answer:64}
  ];
  const responses = [
    {value:11,correct:false,skipped:false},
    {value:7,correct:true,skipped:false},
    {value:null,correct:false,skipped:true}
  ];
  assert.deepEqual(buildCorrections(questions,responses), [
    {number:1,prompt:"3 × 4 = ?",given:"11",expected:"12"},
    {number:3,prompt:"9 × ? = 54",given:"Pas de réponse",expected:"6"}
  ]);
});
