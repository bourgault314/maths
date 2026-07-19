const test = require("node:test");
const assert = require("node:assert/strict");

const fractal = require("../assets/js/daily-strategy-fractal.js");

test("les cinq générations contiennent 1, 3, 9, 27 et 81 triangles", () => {
  [1, 3, 9, 27, 81].forEach((count, level) => {
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
  const levels = Array.from({ length: 9 }, (_, offset) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    return fractal.selectionForDate(date).level;
  });
  const startIndex = fractal.selectionForDate(start).index;
  const expected = Array.from({ length: 9 }, (_, offset) => {
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
  assert.match(group, /stroke="#052f67"/);
  assert.deepEqual(
    [...group.matchAll(/fill="([^"]+)"/g)].map((match) => match[1]),
    ["#f58220", "#08aaa5", "#0b67b2", "#0b67b2", "#f9bf3b", "#08aaa5", "#f9bf3b", "#f58220", "#0b67b2"]
  );
});

test("la dernière génération garde ses 81 triangles colorés et un trait fin", () => {
  const group = fractal.groupForLevel(4, 4);
  assert.equal((group.match(/<path /g) || []).length, 81);
  assert.match(group, /stroke-width="0\.22"/);
  assert.deepEqual(
    new Set([...group.matchAll(/fill="([^"]+)"/g)].map((match) => match[1])),
    new Set(["#f58220", "#08aaa5", "#0b67b2", "#f9bf3b"])
  );
});

test("le rendu ne remplace que la génération marquée", () => {
  const source = `<svg viewBox="0 0 48 36"><g stroke="#052f67" stroke-width=".75" stroke-linejoin="round" data-mathsgo-strategy-fractal=""><path d="ancien"/></g><circle cx="1" cy="1" r="1"/></svg>`;
  [0, 1, 2, 3, 4].forEach((level) => {
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
  assert.throws(() => fractal.trianglesForLevel(5), RangeError);
});
