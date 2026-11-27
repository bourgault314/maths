// Défi calcul, lot « accueil » (07/11/2026, choix de Gwenaël par questions à
// choix) : l'accueil de l'élève en une colonne, comme Défi tables.
// Lot K1 « la carte » (25/11/2026) : Mon module, la pastille des soirs et
// Mon parcours sont partis ; l'accueil dit la ceinture de l'étage, le but du
// jour et « Commencer » ; « La carte » ouvre l'écran de la carte. Ce qui ne
// valait que pour l'ancien accueil est retiré (liste dans la notice du lot
// K1) ; la carte est testée dans defi-calcul-lot-K1-page.test.mjs.
//   - Mon module et Ma séance du jour ; la pastille « N soirs cette semaine »
//     dans la tête de Mon module (rien sans soir, rien en mode professeur) ;
//   - la porte « Mon parcours » (le compte et « +N cette semaine ») ouvre un
//     écran à part : les paliers, la liste du palier (deux colonnes),
//     « ↑ cette semaine » sous un module qui a avancé ;
//   - l'étape du test dit « Tu connais déjà ce module ? » ;
//   - le professeur voit la même page, avec ses liens ;
//   - « Comment ça marche ? » (et, pour le visiteur sans code, « Effacer mon
//     historique » et « Mode professeur ») sur une ligne ;
//     la question s'ouvre à la place de la porte et de la ligne.
// Au navigateur : tests/defi-calcul-accueil-ecrans.cjs (hors CI).

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const PAGE = await lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = await lire("../outils/calcul_mental/defi_calcul.css");

function corps(source, nom) {
  const debut = source.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, `function ${nom}`);
  let profondeur = 0;
  for (let i = source.indexOf("{", debut); i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}" && --profondeur === 0) return source.slice(debut, i + 1);
  }
  throw new Error(nom);
}

test("une seule colonne : plus de deux cartes côte à côte ni de liste sur l'accueil", () => {
  const intro = PAGE.slice(PAGE.indexOf('<div id="intro"'), PAGE.indexOf('<div id="ecran-carte"'));
  assert.match(intro, /<div id="intro" class="intro">\s*<div class="acc">/);
  assert.ok(!/dc-a\b|dc-large|class="gauche"|acc-semaine|acc-effacer-zone/.test(PAGE), "les restes de l'accueil à deux colonnes sont partis");
  assert.ok(!/\.acc\.dc-a|\.dc-large|\.acc-effacer-zone/.test(CSS));
  assert.ok(!intro.includes('id="acc-parcours"'), "la liste n'est plus sur l'accueil");
  // L'ordre (lot K1, planche K0-1) : la ceinture, son compte, le but du
  // jour, « Commencer », puis la ligne des liens.
  const i = id => intro.indexOf(`id="${id}"`);
  const ordre = ["acc-ceinture", "acc-compte", "acc-but", "acc-commencer", "acc-bas"].map(i);
  assert.ok(ordre.every(x => x > 0), "les cinq morceaux sont là");
  assert.deepEqual(ordre, ordre.slice().sort((a, b) => a - b));
  ["acc-module-titre", "acc-seance", "acc-soirs"].forEach(id => assert.ok(!PAGE.includes(`id="${id}"`), `${id} est parti`));
});

test("« La carte » ouvre un écran à part (lot K1 : il remplace Mon parcours)", () => {
  assert.match(PAGE, /<button id="acc-porte" type="button">La carte<\/button>/);
  assert.match(PAGE, /\$\("acc-porte"\)\.addEventListener\("click", \(\) => ouvrirCarte\(\)\);/);
  assert.match(corps(PAGE, "ouvrirCarte"), /state\.etage = etage;\s*\n\s*show\("ecran-carte"\);/);
  assert.match(PAGE, /const ECRANS = Object\.freeze\(\["intro", "ecran-carte", "play", "result", "notice"\]\);/);
  assert.match(PAGE, /\$\("carte-back"\)\.addEventListener\("click", versAccueil\);/);
  ["ecran-parcours", "renderSemaine", "renderParcoursPaliers", "ouvrirParcours", "carteDeSeance", "acc-changer", "module-changer"]
    .forEach(mot => assert.ok(!PAGE.includes(mot), `${mot} est parti`));
});

test("le cadre : centré et à la hauteur de l'écran sur l'ordinateur ; caché tant que le serveur n'a pas répondu", () => {
  assert.match(CSS, /body:not\(\.ecran-interne\):not\(\.challenge-playing\) \.panel > #intro \{ width: 100%; margin: auto; padding-top: 14px; \}/);
  // (Lot K1b, passe 3 : Mon parcours est parti au lot K1, sa règle « sur-parcours » aussi.)
  assert.match(CSS, /body:not\(\.ecran-interne\):not\(\.challenge-playing\):not\(\.fullscreen-active\) \.shell,\n  body\.sur-notice:not\(\.fullscreen-active\) \.shell \{ box-sizing: border-box; min-height: calc\(100svh \/ var\(--echelle, 1\)\); \}/);
  assert.ok(!/sur-parcours/.test(CSS), "plus aucune règle de Mon parcours");
  assert.match(CSS, /body\.accueil-en-attente \.shell \{ visibility: hidden; \}/);
  assert.match(corps(PAGE, "renderAccueil"), /document\.body\.classList\.toggle\("accueil-en-attente", suiviAttendu && !\$\("intro"\)\.hidden\);/);
  assert.match(PAGE, /defi_calcul\.css\?v=20261127-1/);
});

test("la question « Effacer » s'ouvre dans la même case que « La carte » et les liens", () => {
  assert.match(PAGE, /<div id="acc-pied" class="acc-pied">\s*<div class="acc-pied-normal">/);
  assert.match(CSS, /\.acc-pied > \* \{ grid-area: 1 \/ 1; min-width: 0; \}/);
  assert.match(CSS, /\.acc-pied\.avec-effacer > \.acc-confirm\[hidden\] \{ display: block !important; visibility: hidden; \}/);
  // Lot K1 : la ligne dit « 10 minutes · La carte · Comment ça marche ? ».
  assert.match(PAGE, /<span id="acc-minutes" class="ck-minutes">10&nbsp;minutes<\/span>\s*<button id="acc-porte" type="button">La carte<\/button>\s*<button id="acc-notice-bouton" type="button">Comment ça marche&nbsp;\?<\/button>/);
});

test("« Mode professeur » : pour le visiteur sans code seulement, sur la ligne du bas", () => {
  assert.match(PAGE, /<a id="acc-prof" class="lien-prof" href="\?prof=1" hidden>Mode professeur<\/a>/);
  const bas = PAGE.slice(PAGE.indexOf('<div id="acc-bas"'), PAGE.indexOf('id="acc-confirm"'));
  assert.ok(bas.includes('id="acc-prof"'), "sur la ligne des liens");
  assert.match(corps(PAGE, "renderAccueil"), /\$\("acc-prof"\)\.hidden = !peutEffacer\(\);/);
  // L'élève à code n'entre jamais en mode professeur, même par l'adresse.
  assert.match(PAGE, /const MODE_PROF = !eleveDansOnglet && \(REQUETE\.get\("prof"\) === "1" \|\| cleProfDansOnglet\(\)\);/);
});
