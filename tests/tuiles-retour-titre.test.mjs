import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Générateur de tuiles (23/10/2026) : la flèche retour se pose à gauche du titre
// « Tuiles algébriques », sur sa ligne — et non plus dans l'en-tête de l'aperçu A4,
// où elle se retrouvait en bas du premier écran sur téléphone.
const page = readFileSync(new URL("../outils/tuiles_algebriques/generateur_tuiles.html", import.meta.url), "utf8");

test("le retour du générateur de tuiles vise le titre du panneau", () => {
  assert.match(page, /<body[^>]*data-mathsgo-parent-place="\.brand-text h1"/);
  assert.match(page, /data-mathsgo-parent-href="\/outils\/index\.html\?domain=algebre&amp;collection=tuiles-algebriques"/);
});

test("la flèche et le titre tiennent sur une seule ligne centrée, sans marge ajoutée", () => {
  assert.match(page, /\.brand-text\{align-self:stretch\}/);
  assert.match(page, /\.brand-text \.mathsgo-back-row\{justify-content:center\}/);
  assert.match(page, /\.brand \.brand-text a\.mathsgo-back\[data-mathsgo-place\]\{margin:0;align-self:center\}/);
});
