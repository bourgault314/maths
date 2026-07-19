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

test("les deux cartes partagent exactement le même cadre sur ordinateur", () => {
  assert.match(alignmentCss, /--mathsgo-entry-card-height:\s*770px/);
  assert.match(alignmentCss, /--mathsgo-entry-card-height:\s*679px/);
  assert.match(
    alignmentCss,
    /--mathsgo-entry-top:\s*max\(16px, calc\(\(100dvh - var\(--mathsgo-entry-card-height\)\) \/ 2\)\)/
  );
  assert.match(
    homeCss,
    /@media \(min-width: 921px\) \{[\s\S]*?\.hero-card\s*\{[\s\S]*?height:\s*var\(--mathsgo-entry-card-height\)/
  );
  assert.match(
    catalogueCss,
    /@media \(min-width: 921px\) \{[\s\S]*?body:not\(\.catalogue-is-deep\) \.site-shell\s*\{\s*height:\s*var\(--mathsgo-entry-card-height\)/
  );
});

test("l'alignement ne redimensionne ni le logo, ni la scène, ni le bouton", () => {
  const alignmentRule = homeCss.match(
    /@media \(min-width: 921px\) \{[\s\S]*?\n\}/
  );
  assert.ok(alignmentRule);
  assert.doesNotMatch(alignmentRule[0], /brand-logo|maths-scene|btn-start/);
});

test("la redistribution remonte le contenu et descend les crédits", () => {
  assert.match(homeCss, /padding-top:\s*38px/);
  assert.match(homeCss, /padding-bottom:\s*24px/);
  assert.match(homeCss, /\.hero-card > footer\s*\{\s*margin-top:\s*auto/);
  assert.match(
    homeCss,
    /@media \(min-width: 921px\) and \(max-height: 820px\) \{[\s\S]*?padding-top:\s*20px;[\s\S]*?padding-bottom:\s*18px/
  );
});

test("l'accueil mobile remplit la hauteur sûre sans changer sa grille", () => {
  const mobileRule = homeCss.slice(
    homeCss.indexOf("@media (max-width: 600px)"),
    homeCss.indexOf("@media (prefers-reduced-motion: reduce)")
  );

  assert.match(mobileRule, /min-height:\s*100svh/);
  assert.match(
    mobileRule,
    /min-height:\s*calc\(100svh - var\(--mathsgo-entry-top\) - 12px\)/
  );
  assert.doesNotMatch(mobileRule, /550px|100dvh/);
  assert.match(mobileRule, /aspect-ratio:\s*560\s*\/\s*230/);
  assert.match(mobileRule, /\.scene-item\s*\{\s*transform:\s*scale\(1\.1\)/);
  assert.match(homeCss, /grid-template-columns:\s*repeat\(4,/);
});
