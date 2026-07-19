const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const homeHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const homeCss = fs.readFileSync(path.join(__dirname, "accueil.css"), "utf8");
const alignmentCss = fs.readFileSync(path.join(__dirname, "entry-alignment.css"), "utf8");
const catalogueCss = fs.readFileSync(path.join(__dirname, "catalogue-refonte.css"), "utf8");

test("le pied de page de l'accueil reste à l'intérieur de la carte", () => {
  assert.match(
    homeHtml,
    /<section class="hero-card"[\s\S]*<footer>[\s\S]*<\/footer>\s*<\/section>/
  );
});

test("les deux écrans d'entrée partagent les trois hauteurs de référence", () => {
  assert.match(alignmentCss, /--mathsgo-entry-frame-height:\s*803px/);
  assert.match(alignmentCss, /--mathsgo-entry-frame-height:\s*679px/);
  assert.match(alignmentCss, /--mathsgo-entry-frame-height:\s*930px/);
  assert.match(homeCss, /height:\s*var\(--mathsgo-entry-frame-height\)/);
  assert.match(catalogueCss, /min-height:\s*var\(--mathsgo-entry-frame-height\)/);
});

test("le pied de page intégré ne réintroduit pas de marge extérieure sur téléphone", () => {
  assert.match(homeCss, /footer\s*\{[\s\S]*?margin-top:\s*0;/);
});
