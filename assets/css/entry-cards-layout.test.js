const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const homeHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const homeCss = fs.readFileSync(path.join(__dirname, "accueil.css"), "utf8");
const catalogueCss = fs.readFileSync(path.join(__dirname, "catalogue-refonte.css"), "utf8");
const alignmentCss = fs.readFileSync(path.join(__dirname, "entry-alignment.css"), "utf8");

test("les crédits de l'accueil sont placés dans la carte", () => {
  assert.match(
    homeHtml,
    /<section class="hero-card"[\s\S]*<footer>[\s\S]*<\/footer>\s*<\/section>/
  );
});

test("les deux cartes partagent une hauteur minimale sur les écrans assez hauts", () => {
  assert.match(alignmentCss, /--mathsgo-entry-card-height:\s*771px/);
  assert.match(homeCss, /min-height:\s*var\(--mathsgo-entry-card-height\)/);
  assert.match(catalogueCss, /min-height:\s*var\(--mathsgo-entry-card-height\)/);
});

test("l'alignement ne redimensionne ni le logo, ni la scène, ni le bouton", () => {
  const alignmentRule = homeCss.match(
    /@media \(min-width: 921px\) and \(max-width: 1599px\) and \(min-height: 821px\) \{[\s\S]*?\n\}/
  );
  assert.ok(alignmentRule);
  assert.doesNotMatch(alignmentRule[0], /brand-logo|maths-scene|btn-start/);
  assert.doesNotMatch(alignmentRule[0], /\n\s*height:\s*var\(--mathsgo-entry-card-height\)/);
});
