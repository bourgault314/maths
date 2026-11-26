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

test("la carte : la ligne de suivi se range sous « ← Accueil · La carte », comme sous « ← Comment ça marche ? »", () => {
  const liste = PAGE.match(/const TETES_ECRAN = \[([^\]]*)\];/);
  assert.ok(liste, "TETES_ECRAN");
  assert.match(liste[1], /"#notice > \.settings-toolbar"/);
  // (Lot K1 : la carte remplace Mon parcours.)
  assert.match(liste[1], /"#ecran-carte > \.settings-toolbar"/);
  // Le titre de la carte est bien dans une barre « settings-toolbar » enfant directe de l'écran.
  assert.match(PAGE, /<div id="ecran-carte" class="ck-ecran" hidden>\s*<div class="settings-toolbar">/);
});

test("« Comment ça marche ? » : à l'ordinateur, le cadre prend la hauteur de l'écran (plus 650 px fixes)", () => {
  assert.match(PAGE, /document\.body\.classList\.toggle\("sur-notice", name === "notice"\);/);
  assert.match(CSS, /body\.sur-notice:not\(\.fullscreen-active\) \.shell \{ box-sizing: border-box; min-height: calc\(100svh \/ var\(--echelle, 1\)\); \}/);
  // (Lot K1b, passe 3 : « sur-parcours » est parti avec Mon parcours.)
  assert.match(CSS, /\n  body\.sur-notice \.shell > \.panel \{ flex: 1 1 auto; min-height: 0; \}/);
});

test("le calcul reçoit le focus (lecteurs d'écran) sans trait noir autour", () => {
  assert.match(PAGE, /\$\("expression"\)\.focus\?\.\(\{preventScroll: true\}\);/);
  assert.match(CSS, /\n\.expression:focus \{ outline: none; \}/);
  assert.match(PAGE, /<div id="expression" class="expression" tabindex="-1" role="status"/);
});

test("le bilan de Mes calculs du jour au téléphone : parti au lot K1 (« Séance terminée »), ses règles aussi", () => {
  // (Lot K1b, passe 3 : le ménage de la feuille. L'ancien bilan « .mouv » n'est plus dessiné
  // depuis le lot K1 ; ses règles, téléphone compris, sont retirées.)
  assert.ok(!/\.mouv\b/.test(CSS), "plus de règle .mouv");
  assert.ok(!/class="mouv"|"mouv"/.test(PAGE), "et la page ne l'écrit pas");
});

test("la feuille a changé : son adresse aussi (cache)", () => {
  assert.match(PAGE, /defi_calcul\.css\?v=20261126-2/);
});
