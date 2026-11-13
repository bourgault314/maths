// Lot EN4 — « rien ne bouge » : une seule page pour les trois niveaux, cadre de taille fixe sur ordinateur (la question
// défile dedans), barre des boutons collée en bas sur téléphone, barre de fraction aussi longue que le plus long nombre.
// Les mesures à l'écran (390 et 1440, toutes les questions) sont faites par la recette du lot ; ici on garde les règles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");

test("la question vit dans q-corps, les boutons en dehors (dans le cadre)", () => {
  const carte = html.match(/<article id="q-carte" class="q-carte">([\s\S]*?)<\/article>/)[1];
  const corps = carte.match(/<div id="q-corps" class="q-corps">([\s\S]*?)<\/div>\s*<div class="actions">/);
  assert.ok(corps, "q-corps puis la barre des boutons");
  for (const id of ["q-num", "q-enonce", "q-figure", "q-apres", "q-choix"]) assert.ok(corps[1].includes(`id="${id}"`), id);
  assert.ok(!corps[1].includes('id="valider"'));
  assert.match(js, /\$\("#q-corps"\)\.scrollTop = 0;/);
});

test("ordinateur : même hauteur de cadre pour toutes les questions, la question défile dedans", () => {
  const ordi = html.match(/@media\(min-width:621px\)\{([\s\S]*?)\n    \}/)[1];
  assert.match(ordi, /\.q-carte\{height:clamp\(380px,calc\(100vh - 236px\),680px\);height:clamp\(380px,calc\(100dvh - 236px\),680px\)\}/);
  assert.match(ordi, /\.q-corps\{flex:1 1 auto;min-height:0;overflow-y:auto/);
});

test("téléphone : barre des boutons collée en bas, place gardée sous la page, question d'arrêt par-dessus", () => {
  const tel = html.match(/@media\(max-width:620px\)\{([\s\S]*?)\n    \}/)[1];
  assert.match(tel, /\.actions\{position:fixed;z-index:10;left:0;right:0;bottom:0;/);
  assert.match(tel, /\.en-passation \.shell\{padding-bottom:calc\(96px \+ env\(safe-area-inset-bottom\)\)\}/);
  assert.match(html, /\.confirmation\{position:fixed;/);
});

test("fraction : les deux nombres prennent la largeur du plus long (la barre couvre 4/100 en entier)", () => {
  assert.match(html, /\.frac\{display:inline-flex;flex-direction:column;align-items:stretch;/);
  assert.match(html, /\.frac>span\{display:block;white-space:nowrap\}/);
  assert.match(html, /\.frac>span:first-child\{[^}]*border-bottom:2px solid currentColor/);
  // et le « ? » ne part pas seul à la ligne après une fraction
  assert.match(js, /<span class="insecable">\$1\$2<\/span>/);
});
