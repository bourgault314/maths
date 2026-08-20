import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const canonicalLogo = "/assets/img/logos/mathsgo/logo-print.png?v=20260820-1";
const pages = {
  classique: await readFile(new URL("../outils/splat.html", import.meta.url), "utf8"),
  equations: await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8"),
  petit: await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8"),
};

test("les trois impressions Splat utilisent la version actuelle du logo canonique", () => {
  for(const [name, html] of Object.entries(pages)){
    assert.ok(html.includes(canonicalLogo), `${name} doit utiliser ${canonicalLogo}`);
  }
});

test("Splat classique n'embarque plus l'ancien logo", () => {
  assert.match(pages.classique, /logo\.src = MATHSGO_PRINT_LOGO_URL/);
  assert.doesNotMatch(pages.classique, /MATHSGO_LOGO_DATA_URI/);
});

test("Splat equations remplace l'ancien logo recompose et attend son chargement", () => {
  assert.match(pages.equations, /class="print-brand-logo" src="\$\{MATHSGO_PRINT_LOGO_URL\}"/);
  assert.match(pages.equations, /waitForPrintAssets\(printArea\)\.then/);
  assert.doesNotMatch(pages.equations, /print-brand-(?:m|copy|name|tagline)/);
});

test("Petit Splat n'embarque plus ses anciennes copies du logo", () => {
  assert.match(pages.petit, /src="\$\{PRINT_MATHS_GO_LOGO_SRC\}"/);
  assert.doesNotMatch(pages.petit, /const MATHS_GO_LOGO_SRC/);
  assert.doesNotMatch(pages.petit, /PRINT_MATHS_GO_LOGO_SRC = "data:image/);
});
