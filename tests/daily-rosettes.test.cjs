const test = require("node:test");
const assert = require("node:assert/strict");

const dailyRosettes = require("../assets/js/daily-rosettes.js");

test("les sept rosaces couvrent les ordres 3 à 9 sans doublon", () => {
  assert.equal(dailyRosettes.patterns.length, 7);
  assert.deepEqual(dailyRosettes.patterns.map(({ order }) => order), [3, 4, 5, 6, 7, 8, 9]);
  assert.equal(new Set(dailyRosettes.patterns.map(({ id }) => id)).size, 7);
});

test("chaque rosace contient le bon nombre de centres de construction", () => {
  dailyRosettes.patterns.forEach((pattern) => {
    const svg = dailyRosettes.renderPattern(pattern);
    assert.match(svg, new RegExp(`data-mathsgo-rosette-order="${pattern.order}"`));
    assert.match(svg, new RegExp(`data-mathsgo-rosette-id="${pattern.id}"`));
    assert.equal((svg.match(/data-mathsgo-rosette-point=/g) || []).length, pattern.order);
    assert.equal((svg.match(/data-mathsgo-rosette-petal="primary"/g) || []).length, pattern.order);
    assert.equal((svg.match(/data-mathsgo-rosette-petal="secondary"/g) || []).length, pattern.order);
    assert.equal(svg.includes("NaN"), false);
    assert.equal(svg.includes("Infinity"), false);
  });
});

test("un nouvel ordre apparaît chaque jour puis le cycle de sept jours recommence", () => {
  const selections = Array.from({ length: 8 }, (_, offset) => {
    return dailyRosettes.selectionForDate(new Date(2026, 0, 1 + offset, 12));
  });
  assert.equal(new Set(selections.slice(0, 7).map(({ index }) => index)).size, 7);
  assert.equal(selections[7].index, selections[0].index);
  assert.throws(() => dailyRosettes.selectionForDate("pas une date"), /Date quotidienne invalide/);
});
