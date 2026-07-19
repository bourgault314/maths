const test = require("node:test");
const assert = require("node:assert/strict");

const dailyKoch = require("./daily-koch-insect.js");

const BASE_MARKUP = '<svg><polyline points="12,35 17.33,35 20,39.62 22.67,35" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(22.5 35)" stroke="#166534" stroke-width=".9" stroke-linecap="round"><ellipse cx="0" cy="0" rx="4.8" ry="3.2" fill="#22c55e"/><path d="M-2-2.6-4.5-5M-2 2.6-4.5 5M2-2.6 3.5-5M2 2.6 3.5 5" fill="none"/><circle cx="5" cy="0" r="2.1" fill="#facc15"/><circle cx="5.6" cy="-.6" r=".45" fill="#312e81" stroke="none"/></g></svg>';

test("la progression suit les sept jours de lundi à dimanche", () => {
  assert.equal(dailyKoch.weekdayStage(new Date(2026, 6, 20)), 1);
  assert.equal(dailyKoch.weekdayStage(new Date(2026, 6, 25)), 6);
  assert.equal(dailyKoch.weekdayStage(new Date(2026, 6, 26)), 7);
  assert.equal(dailyKoch.weekdayStage(new Date(2026, 6, 27)), 1);
});

test("les portions grandissent et le dimanche ferme le flocon", () => {
  let previousPoints = 0;
  for (let stage = 1; stage <= 7; stage += 1) {
    const state = dailyKoch.stateForStage(stage);
    assert.ok(state.path.length > previousPoints);
    previousPoints = state.path.length;
  }
  assert.deepEqual(dailyKoch.stateForStage(7).position, [12, 35]);
});

test("le rendu place et oriente l'insecte au bout du tracé", () => {
  const monday = dailyKoch.render(BASE_MARKUP, new Date(2026, 6, 20));
  const sunday = dailyKoch.render(BASE_MARKUP, new Date(2026, 6, 26));
  assert.match(monday, /data-mathsgo-koch-day="1"/);
  assert.match(monday, /data-mathsgo-koch-insect="1"/);
  assert.match(monday, /rotate\(-?\d+(?:\.\d+)?\)/);
  assert.match(sunday, /data-mathsgo-koch-day="7"/);
  assert.match(sunday, /transform="translate\(12 35\) rotate\(0\)"/);
});

test("une date invalide est refusée", () => {
  assert.throws(() => dailyKoch.weekdayStage("pas une date"), /Date du flocon invalide/);
});
