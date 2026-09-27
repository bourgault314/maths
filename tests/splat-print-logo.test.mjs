import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const canonicalLogo = "/assets/img/logos/mathsgo/logo-print.png?v=20260820-1";
const canonicalIremLogo = "/assets/img/logos/irem/logo-print.png?v=20260820-1";
const pages = {
  classique: await readFile(new URL("../outils/splat.html", import.meta.url), "utf8"),
  equations: await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8"),
  petit: await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8"),
};

test("les trois impressions Splat utilisent la version actuelle du logo canonique", () => {
  for(const [name, html] of Object.entries(pages)){
    assert.ok(html.includes(canonicalLogo), `${name} doit utiliser ${canonicalLogo}`);
    // SPLAT! Équations (mondes 5 et 6) : maths&go seul, plus de logo IREMI (relecture du monde 5, 27/09/2026)
    if(name === "equations") assert.ok(!html.includes(canonicalIremLogo), "splat_equations n'appelle plus le logo IREMI");
    else assert.ok(html.includes(canonicalIremLogo), `${name} doit utiliser ${canonicalIremLogo}`);
  }
});

test("Splat classique n'embarque plus l'ancien logo", () => {
  assert.match(pages.classique, /mathsLogo\.src = MATHSGO_PRINT_LOGO_URL/);
  assert.match(pages.classique, /iremLogo\.src = IREM_PRINT_LOGO_URL/);
  assert.doesNotMatch(pages.classique, /MATHSGO_LOGO_DATA_URI/);
});

test("Splat equations : le seul logo maths&go dans le bandeau, et l'impression attend son chargement", () => {
  assert.match(pages.equations, /mathsLogo\.src = MATHSGO_PRINT_LOGO_URL/);
  assert.doesNotMatch(pages.equations, /iremLogo|IREM_PRINT_LOGO_URL/);
  assert.match(pages.equations, /waitForPrintAssets\(printArea\)\.then/);
  assert.doesNotMatch(pages.equations, /print-brand-(?:m|copy|name|tagline|logo)/);
});

test("Petit Splat n'embarque plus ses anciennes copies du logo", () => {
  assert.match(pages.petit, /src="\$\{PRINT_MATHS_GO_LOGO_SRC\}"/);
  assert.match(pages.petit, /src="\$\{PRINT_IREM_LOGO_SRC\}"/);
  assert.doesNotMatch(pages.petit, /const MATHS_GO_LOGO_SRC/);
  assert.doesNotMatch(pages.petit, /PRINT_MATHS_GO_LOGO_SRC = "data:image/);
  assert.doesNotMatch(pages.petit, /PRINT_IREM_LOGO_SRC = "data:image/);
});
