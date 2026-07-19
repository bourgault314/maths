const test = require("node:test");
const assert = require("node:assert/strict");

const dailySplat = require("./daily-splat-letter.js");

const BASE_MARKUP = '<svg><path d="M0 0"/><text x="12.4" y="14.2" text-anchor="middle" fill="#fff" font-family="Times New Roman, Times, serif" font-size="10" font-weight="700" font-style="italic">x</text></svg>';

test("les sept lettres suivent les jours de lundi à dimanche", () => {
  const letters = Array.from({ length: 7 }, (_, index) =>
    dailySplat.letterForDate(new Date(2026, 6, 20 + index))
  );
  assert.deepEqual(letters, ["x", "a", "b", "n", "y", "t", "k"]);
});

test("le lundi suivant recommence par x", () => {
  assert.equal(dailySplat.letterForDate(new Date(2026, 6, 27)), "x");
});

test("le rendu ne change que la lettre du Splat", () => {
  const thursday = dailySplat.render(BASE_MARKUP, new Date(2026, 6, 23));
  assert.match(thursday, /data-mathsgo-splat-letter="n">n<\/text>/);
  assert.match(thursday, /<path d="M0 0"\/>/);
});

test("une date invalide est refusée", () => {
  assert.throws(() => dailySplat.letterForDate("pas une date"), /Date du Splat invalide/);
});
