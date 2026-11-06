import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Tuiles algébriques — expressions (lot du 06/11/2026, retours de Gwenaël).
const page = readFileSync(new URL("../outils/tuiles_algebriques/tuiles_algebriques.html", import.meta.url), "utf8");

test("Vert rouge est le premier choix de couleurs et celui du départ", () => {
  const select = page.match(/<select id="color-mode-select"[\s\S]*?<\/select>/)[0];
  const options = [...select.matchAll(/<option value="([^"]+)"( selected)?/g)];
  assert.equal(options[0][1], "sign");
  assert.equal(options[0][2], " selected");
  assert.equal(options.filter((o) => o[2]).length, 1);
  assert.match(page, /this\.colorMode = 'sign';/);
  assert.match(page, /select\.value \|\| 'sign'/);
});

test("la tuile 0 cache les écritures dessous et garde un bord gris", () => {
  // La couleur des tuiles est posée en style en ligne : sans !important, elle gagnait.
  const regle = page.match(/\.token\.is-zero \{[^}]*\}/)[0];
  assert.match(regle, /color: transparent !important/);
  assert.match(regle, /border: 2px solid #6b7280 !important/);
});

test("le bouton + sépare vraiment les groupes dans l'équation", () => {
  assert.match(page, /tokensToSeparatedLatex\(tokens, splitPacks = false\)/);
  assert.match(page, /cur\.packId===t\.packId/);
  assert.match(page, /let content = this\.tokensToSeparatedLatex\(toks, true\);/);
  assert.match(page, /plusStep: true, implicit: false/);
});

test("après la parenthèse fermée, les tuiles suivantes vont après elle", () => {
  const fermer = page.match(/closeParenthesis\(\) \{[\s\S]*?\n            \}/)[0];
  assert.match(fermer, /plusStep: true, implicit: true/);
  assert.match(fermer, /this\.currentStepIndex = this\.steps\.length - 1;/);
});

test("Tout recommencer s'annule et rend la main", () => {
  const reset = page.match(/resetBoard\(keepEquationMode = false\) \{[\s\S]*?\n            \}/)[0];
  assert.match(reset, /^resetBoard\(keepEquationMode = false\) \{\s*this\.saveState\(\);/);
  assert.match(reset, /this\.setTool\('hand'\);/);
});

test("la corbeille est dans le même groupe que la main et le stylo", () => {
  const groupe = page.match(/<!-- OUTILS : [\s\S]*?id="tile-trash-zone"/)[0];
  assert.match(groupe, /id="tool-hand"/);
  assert.match(groupe, /id="tool-pen"/);
});
