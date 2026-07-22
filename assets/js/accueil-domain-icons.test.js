const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sharedRenderer = require("./domain-icon-renderer.js");
const icons = require("./accueil-domain-icons.js");

test("l'expérience de l'accueil conserve exactement 60 lancers", () => {
  const draws = [0, 0.18, 0.35, 0.52, 0.69, 0.9];
  let index = 0;
  const experiment = icons.simulateDieThrows(60, () => draws[index++ % draws.length]);
  assert.deepEqual(experiment.counts, [10, 10, 10, 10, 10, 10]);
  assert.equal(experiment.lastValue, 6);
  assert.equal(experiment.counts.reduce((sum, count) => sum + count, 0), 60);
});

test("le dé et les six bâtons utilisent la même expérience", () => {
  const markup = '<svg><g fill="#9d174d" data-mathsgo-die-face=""><circle/></g><g data-mathsgo-die-chart=""><path/></g></svg>';
  const experiment = { throwCount: 60, counts: [8, 9, 10, 11, 12, 10], lastValue: 4 };
  const rendered = icons.renderProbabilityIcon(markup, experiment);
  assert.match(rendered, /data-mathsgo-die-face="4"/);
  assert.match(rendered, /data-mathsgo-die-chart="8-9-10-11-12-10"/);
  assert.match(rendered, /stroke="#08aaa5"/);
  assert.equal((rendered.match(/stroke="#be3e68"/g) || []).length, 6);
});

test("le Splat partagé est bleu sans modifier le dessin de repli", () => {
  const markup = '<svg><path fill="#8b5cf6" stroke="#5b21b6"/><text>x</text></svg>';
  const rendered = icons.renderIcon("splat", { library: { splat: markup }, renderer: sharedRenderer });
  assert.match(rendered, /fill="#0b67b2" stroke="#063f86"/);
  assert.match(markup, /fill="#8b5cf6" stroke="#5b21b6"/);
});

test("l’accueil délègue le vase et la géométrie à leurs moteurs séparés", () => {
  const date = new Date(2026, 0, 4, 12);
  global.MATHSGO_DAILY_VASES = {
    render: (_markup, value) => `<svg data-vase-date="${value.toISOString()}"></svg>`
  };
  global.MATHSGO_DAILY_ROSETTES = {
    render: (_markup, value) => `<svg data-rosette-date="${value.toISOString()}"></svg>`
  };
  const library = {
    "equal-volume-vase": "<svg>vase statique</svg>",
    seigaiha: "<svg>vagues statiques</svg>"
  };

  assert.match(icons.renderIcon("equal-volume-vase", { library, date, renderer: sharedRenderer }), /data-vase-date=/);
  assert.match(icons.renderIcon("seigaiha", { library, date, renderer: sharedRenderer }), /data-rosette-date=/);

  delete global.MATHSGO_DAILY_VASES;
  delete global.MATHSGO_DAILY_ROSETTES;
});

test("les vagues restent disponibles si le moteur des rosaces ne se charge pas", () => {
  const waves = "<svg data-static-waves></svg>";
  assert.equal(icons.renderIcon("seigaiha", { library: { seigaiha: waves }, renderer: sharedRenderer }), waves);
});

test("l’accueil place la rosace avant les données sans déplacer Automatismes", () => {
  const homepage = fs.readFileSync(path.join(__dirname, "..", "..", "index.html"), "utf8");
  const names = Array.from(homepage.matchAll(/data-home-icon="([^"]+)"/g), (match) => match[1]);
  assert.deepEqual(names, [
    "automatismes",
    "factor-tree",
    "splat",
    "equal-volume-vase",
    "seigaiha",
    "probability-statistics",
    "koch",
    "strategy"
  ]);
});

test("l’accueil et le catalogue chargent le même moteur quotidien", () => {
  const homepage = fs.readFileSync(path.join(__dirname, "..", "..", "index.html"), "utf8");
  const catalogue = fs.readFileSync(path.join(__dirname, "..", "..", "outils", "index.html"), "utf8");
  assert.match(homepage, /daily-rosettes\.js[^]*domain-icon-renderer\.js[^]*accueil-domain-icons\.js/);
  assert.match(catalogue, /daily-rosettes\.js[^]*domain-icon-renderer\.js[^]*catalogue-refonte\.js/);
});

test("la palette partagée harmonise l'arbre et le flocon", () => {
  const librarySource = fs.readFileSync(path.join(__dirname, "mathsgo-icon-library.js"), "utf8");
  assert.match(librarySource, /fill="#0b67b2" stroke="#063f86"[^\n]*fill="#be3e68" stroke="#9d174d"/);
  assert.match(librarySource, /fill="#eaf5ff" stroke="#0b67b2"/);
  assert.match(librarySource, /splat:.*fill="#8b5cf6" stroke="#5b21b6"/);
});

test("le montage remplit les huit emplacements", () => {
  const slots = Array.from({ length: 8 }, (_, index) => ({
    dataset: { homeIcon: index === 0 ? "automatismes" : "seigaiha" },
    innerHTML: ""
  }));
  global.MATHSGO_ICON_LIBRARY = { automatismes: "<svg>auto</svg>", seigaiha: "<svg>geo</svg>" };
  const mounted = icons.mount({ querySelectorAll: () => slots });
  assert.equal(mounted, 8);
  assert.ok(slots.every((slot) => slot.innerHTML.startsWith("<svg>")));
});
