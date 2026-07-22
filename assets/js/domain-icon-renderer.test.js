const test = require("node:test");
const assert = require("node:assert/strict");

const renderer = require("./domain-icon-renderer.js");

test("le Splat quotidien partagé reste bleu sur toutes les pages", () => {
  const source = '<svg><path fill="#8b5cf6" stroke="#5b21b6"/><text data-mathsgo-splat-letter="">b</text></svg>';
  global.MATHSGO_DAILY_SPLAT_LETTER = {
    render: (markup) => markup.replace(">b</text>", ">x</text>")
  };
  const result = renderer.renderIcon("splat", { library: { splat: source } });
  assert.match(result, /fill="#0b67b2" stroke="#063f86"/);
  assert.match(result, />x<\/text>/);
  assert.match(source, /fill="#8b5cf6" stroke="#5b21b6"/);
  delete global.MATHSGO_DAILY_SPLAT_LETTER;
});

test("le vase et la rosace reçoivent exactement la même date", () => {
  const date = new Date(2026, 6, 22, 12);
  global.MATHSGO_DAILY_VASES = { render: (_markup, value) => `<svg data-day="${value.getDate()}" data-kind="vase"/>` };
  global.MATHSGO_DAILY_ROSETTES = { render: (_markup, value) => `<svg data-day="${value.getDate()}" data-kind="rosace"/>` };
  const library = { "equal-volume-vase": "<svg/>", seigaiha: "<svg/>" };
  assert.match(renderer.renderIcon("equal-volume-vase", { library, date }), /data-day="22" data-kind="vase"/);
  assert.match(renderer.renderIcon("seigaiha", { library, date }), /data-day="22" data-kind="rosace"/);
  delete global.MATHSGO_DAILY_VASES;
  delete global.MATHSGO_DAILY_ROSETTES;
});

test("les dessins statiques restent les solutions de repli", () => {
  const waves = "<svg data-static-waves></svg>";
  assert.equal(renderer.renderIcon("seigaiha", { library: { seigaiha: waves } }), waves);
});
