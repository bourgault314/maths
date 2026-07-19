const test = require("node:test");
const assert = require("node:assert/strict");

const fractal = require("../assets/js/daily-strategy-fractal.js");

test("les quatre générations contiennent 1, 3, 9 et 27 triangles", () => {
  [1, 3, 9, 27].forEach((count, level) => {
    const triangles = fractal.trianglesForLevel(level);
    assert.equal(triangles.length, count);
    triangles.flatMap((triangle) => triangle.points).forEach((point) => {
      assert.ok(Number.isFinite(point.x));
      assert.ok(Number.isFinite(point.y));
      assert.ok(point.x >= 4 && point.x <= 44);
      assert.ok(point.y >= 2 && point.y <= 34);
    });
  });
});

test("le cycle quotidien grandit puis redescend sans saut", () => {
  const start = new Date(2026, 0, 1);
  const levels = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    return fractal.selectionForDate(date).level;
  });
  const startIndex = fractal.selectionForDate(start).index;
  const expected = Array.from({ length: 7 }, (_, offset) => {
    return fractal.levels[(startIndex + offset) % fractal.levels.length];
  });
  assert.deepEqual(levels, expected);
  levels.slice(1).forEach((level, index) => {
    assert.equal(Math.abs(level - levels[index]), 1);
  });
});

test("la génération actuelle conserve ses neuf couleurs", () => {
  const group = fractal.groupForLevel(2, 2);
  assert.equal((group.match(/<path /g) || []).length, 9);
  assert.deepEqual(
    [...group.matchAll(/fill="([^"]+)"/g)].map((match) => match[1]),
    ["#f97316", "#06b6d4", "#6366f1", "#6366f1", "#facc15", "#06b6d4", "#facc15", "#f97316", "#6366f1"]
  );
});

test("le rendu ne remplace que la génération marquée", () => {
  const source = `<svg viewBox="0 0 48 36"><g stroke="#312e81" stroke-width=".75" stroke-linejoin="round" data-mathsgo-strategy-fractal=""><path d="ancien"/></g><circle cx="1" cy="1" r="1"/></svg>`;
  [0, 1, 2, 3].forEach((level) => {
    const day = fractal.levels.indexOf(level);
    const rendered = fractal.render(source, new Date(1970, 0, 1 + day));
    assert.match(rendered, /viewBox="0 0 48 36"/);
    assert.match(rendered, /<circle cx="1" cy="1" r="1"\/>/);
    assert.doesNotMatch(rendered, /ancien/);
  });
});

test("les dates et générations invalides sont refusées", () => {
  assert.throws(() => fractal.selectionForDate("pas une date"), TypeError);
  assert.throws(() => fractal.trianglesForLevel(-1), RangeError);
  assert.throws(() => fractal.trianglesForLevel(4), RangeError);
});
