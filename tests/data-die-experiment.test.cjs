const assert = require("node:assert/strict");
const test = require("node:test");

global.window = {};
require("../assets/js/catalogue-refonte.js");
const { renderDieChart, simulateDieThrows } = global.window.MATHSGO_DIE_EXPERIMENT;

test("le diagramme compte exactement 60 lancers dans six classes", () => {
  let index = 0;
  const experiment = simulateDieThrows(60, () => ((index++ % 6) + 0.5) / 6);

  assert.deepEqual(experiment.counts, [10, 10, 10, 10, 10, 10]);
  assert.equal(experiment.counts.reduce((sum, count) => sum + count, 0), 60);
  assert.equal(experiment.lastValue, 6);
});

test("la face affichée est bien celle du dernier lancer", () => {
  const draws = [0, 0.2, 0.99];
  const experiment = simulateDieThrows(3, () => draws.shift());

  assert.deepEqual(experiment.counts, [1, 1, 0, 0, 0, 1]);
  assert.equal(experiment.lastValue, 6);
});

test("une source de hasard invalide est refusée", () => {
  assert.throws(() => simulateDieThrows(0), RangeError);
  assert.throws(() => simulateDieThrows(1, () => 1), RangeError);
  assert.throws(() => simulateDieThrows(1, null), TypeError);
});

test("le SVG produit six bâtons séparés sans étiquettes", () => {
  let index = 0;
  const experiment = simulateDieThrows(60, () => ((index++ % 6) + 0.5) / 6);
  const markup = renderDieChart(experiment);

  assert.equal((markup.match(/<line /g) || []).length, 6);
  assert.doesNotMatch(markup, /<text/);
  assert.doesNotMatch(markup, /<rect/);
});
