const test = require("node:test");
const assert = require("node:assert/strict");

const dailyMetronome = require("./daily-metronome.js");

const BASE_MARKUP = '<svg><g data-mathsgo-metronome-needle="" transform="rotate(0 32 14.75)"><path d="M32 14.75V45"/><circle cx="32" cy="45"/></g><rect data-mathsgo-metronome-pivot="" x="28.5" y="12" width="7" height="5.5"/></svg>';

test("les sept angles suivent la semaine de droite à gauche", () => {
  const angles = Array.from({ length: 7 }, (_, index) =>
    dailyMetronome.angleForDate(new Date(2026, 6, 20 + index, 12))
  );
  assert.deepEqual(angles, [-18, -12, -6, 0, 6, 12, 18]);
});

test("seule l’aiguille reçoit la rotation autour du pivot supérieur", () => {
  const sunday = dailyMetronome.render(BASE_MARKUP, new Date(2026, 6, 26, 12));
  assert.match(sunday, /data-mathsgo-metronome-needle="18" transform="rotate\(18 32 14\.75\)"/);
  assert.match(sunday, /<rect data-mathsgo-metronome-pivot="" x="28\.5" y="12"/);
  assert.doesNotMatch(sunday, /<rect[^>]+transform=/);
});

test("le même rendu remplace la bibliothèque et les emplacements dédiés", () => {
  global.MATHSGO_ICON_LIBRARY = { automatismes: BASE_MARKUP, autre: "inchangée" };
  assert.equal(dailyMetronome.applyToLibrary(new Date(2026, 6, 20, 12)), true);

  const slots = [{ innerHTML: "" }, { innerHTML: "" }];
  const root = { querySelectorAll: () => slots };
  assert.equal(dailyMetronome.mount(root, new Date(2026, 6, 20, 12)), 2);
  assert.equal(slots[0].innerHTML, slots[1].innerHTML);
  assert.match(slots[0].innerHTML, /data-mathsgo-metronome-needle="-18"/);
  assert.equal(global.MATHSGO_ICON_LIBRARY.autre, "inchangée");
  delete global.MATHSGO_ICON_LIBRARY;
});

test("une date invalide est refusée", () => {
  assert.throws(() => dailyMetronome.angleForDate("pas une date"), /Date du métronome invalide/);
});
