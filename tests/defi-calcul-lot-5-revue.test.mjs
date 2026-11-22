// Défi calcul, lot 5 « Revue avant ouverture » (14/11/2026). Chaque écran de
// l'élève passé aux cinq formats (téléphone 390 × 664 et 390 × 844,
// ordinateur 1366 × 657 et 1366 × 768, projection 1920 × 1080), élève connecté
// et visiteur. Ce qui a été corrigé, gardé ici sans navigateur (la recette
// tests/defi-calcul-lot-5-revue-ecrans.cjs le vérifie à l'écran) :
//  1. Mon parcours suit la règle commune « le titre de l'écran d'abord, la
//     ligne de suivi dessous » (il avait été oublié dans TETES_ECRAN) ;
//  2. le titre d'un palier ne garde sa parenthèse que si elle apprend quelque
//     chose à l'élève (choix de Gwenaël) : une ligne partout ;
//  3. « Comment ça marche ? » prend la hauteur de l'écran à l'ordinateur
//     (650 px fixes avant : le cadre dépassait en 1366 × 657) ;
//  4. pas de trait noir (focus) autour du calcul quand l'élève tape au
//     clavier ;
//  5. le bilan de Mes calculs du jour, au téléphone : le nom de la
//     compétence sur sa ligne, ce qui lui arrive dessous.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const PAGE = lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = lire("../outils/calcul_mental/defi_calcul.css");

test("Mon parcours : la ligne de suivi se range sous « ← Mon parcours », comme sous « ← Comment ça marche ? »", () => {
  const liste = PAGE.match(/const TETES_ECRAN = \[([^\]]*)\];/);
  assert.ok(liste, "TETES_ECRAN");
  assert.match(liste[1], /"#notice > \.settings-toolbar"/);
  assert.match(liste[1], /"#ecran-parcours > \.settings-toolbar"/);
  // Le titre de Mon parcours est bien dans une barre « settings-toolbar » enfant directe de l'écran.
  assert.match(PAGE, /<div id="ecran-parcours" class="parcours-screen" hidden>\s*<div class="settings-toolbar">/);
});

test("le titre d'un palier : la parenthèse seulement quand elle apprend quelque chose (choix de Gwenaël, 14/11)", () => {
  const precision = PAGE.match(/const PRECISION_PALIER = Object\.freeze\((\{[^}]*\})\);/);
  assert.ok(precision, "PRECISION_PALIER");
  const table = Function(`return ${precision[1]};`)();
  assert.deepEqual(table, {1: "CP · CE1 · CE2"});
  const titre = n => {
    const palier = CORE.PALIERS.find(p => p.n === n);
    return `Palier ${palier.n} · ${palier.nom}${table[n] ? ` (${table[n]})` : ""}`;
  };
  assert.deepEqual([1, 2, 3, 4].map(titre),
    ["Palier 1 · Les bases (CP · CE1 · CE2)", "Palier 2 · Le CM1", "Palier 3 · Le CM2", "Palier 4 · Vers la 6e"]);
  assert.match(PAGE, /\$\("parcours-titre"\)\.textContent = soude\(`Palier \$\{palier\.n\} · \$\{palier\.nom\}\$\{precision \? ` \(\$\{precision\}\)` : ""\}`\);/);
  assert.doesNotMatch(PAGE, /\(\$\{palier\.classes\}\)`\);/, "plus de « (CM1) » répété");
});

test("« Comment ça marche ? » : à l'ordinateur, le cadre prend la hauteur de l'écran (plus 650 px fixes)", () => {
  assert.match(PAGE, /document\.body\.classList\.toggle\("sur-notice", name === "notice"\);/);
  assert.match(CSS, /body\.sur-notice:not\(\.fullscreen-active\) \.shell \{ box-sizing: border-box; min-height: calc\(100svh \/ var\(--echelle, 1\)\); \}/);
  assert.match(CSS, /body\.sur-parcours \.shell > \.panel, body\.sur-notice \.shell > \.panel \{ flex: 1 1 auto; min-height: 0; \}/);
});

test("le calcul reçoit le focus (lecteurs d'écran) sans trait noir autour", () => {
  assert.match(PAGE, /\$\("expression"\)\.focus\?\.\(\{preventScroll: true\}\);/);
  assert.match(CSS, /\n\.expression:focus \{ outline: none; \}/);
  assert.match(PAGE, /<div id="expression" class="expression" tabindex="-1" role="status"/);
});

test("le bilan de Mes calculs du jour au téléphone : le nom sur sa ligne, ce qui lui arrive dessous", () => {
  const bloc = CSS.match(/@media \(max-width: 620px\) \{\n  \.mouv \{ gap: 9px; \}\n  \.mouv > span \{ grid-template-columns: minmax\(0, 1fr\); gap: 1px; \}\n  \.mouv > span > span:last-child \{ text-align: left; font-size: \.88rem; \}\n\}/);
  assert.ok(bloc, "la règle du téléphone");
  // À l'ordinateur, rien ne change : deux colonnes.
  assert.match(CSS, /\n\.mouv > span \{ display: grid; grid-template-columns: minmax\(0, 1fr\) auto; gap: 8px; \}/);
});

test("la feuille a changé : son adresse aussi (cache)", () => {
  assert.match(PAGE, /defi_calcul\.css\?v=20261122-1/);
});
