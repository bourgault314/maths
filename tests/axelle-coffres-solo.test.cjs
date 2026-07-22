const test = require("node:test");
const assert = require("node:assert/strict");
const {adjacent, calculate, expression} = require("../axelle/jeux/coffres-solo/app.js");

test("les quatre mots du Coffres solo ont le bon sens mathématique", () => {
  assert.equal(calculate("sum", 8, 5), 13);
  assert.equal(calculate("difference", 5, 13), 8);
  assert.equal(calculate("product", 4, 6), 24);
  assert.equal(calculate("quotient", 6, 24), 4);
  assert.equal(expression("difference", 5, 13), "13 − 5 = 8");
  assert.equal(expression("quotient", 6, 24), "24 ÷ 6 = 4");
});

test("deux cases doivent partager un côté", () => {
  assert.equal(adjacent(0, 1), true);
  assert.equal(adjacent(0, 4), true);
  assert.equal(adjacent(3, 4), false);
  assert.equal(adjacent(0, 5), false);
});
