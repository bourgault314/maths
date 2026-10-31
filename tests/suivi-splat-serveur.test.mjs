// Lot « splat-suivi-3 » (07/10/2026) : le serveur de suivi apprend SPLAT!.
//
// Le filtre du serveur (lib/progression.php) ne garde que les clés et les
// parcours que lib/applis.php déclare pour « splat », et retire le reste EN
// SILENCE. Si la déclaration et le moteur (assets/js/splat-parcours.js)
// divergent, une étape réussie disparaîtrait du serveur sans que personne ne
// le voie. Ce fichier compare donc le TEXTE de lib/applis.php à ce que le
// moteur exporte — jamais à une liste recopiée à la main ici. (Le test PHP de
// _serveur/tests/lancer.php, lui, fait passer le parcours de référence par le
// vrai filtre.)

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const PARCOURS = require("../assets/js/splat-parcours.js");
const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const catalogue = lire("_serveur/public/lib/applis.php");

// L'entrée « splat » du catalogue, telle qu'elle est écrite.
function entreeSplat() {
  const debut = catalogue.indexOf("    'splat' => [\n");
  assert.ok(debut > 0, "lib/applis.php doit déclarer l'appli « splat »");
  const fin = catalogue.indexOf("\n    ],\n", debut);
  return catalogue.slice(debut, fin);
}
const listePhp = (texte, cle) => {
  const m = texte.match(new RegExp(`'${cle}' => \\[([^\\]]*)\\],`));
  assert.ok(m, `« ${cle} » doit être une liste PHP sur une ligne`);
  return [...m[1].matchAll(/'([^']*)'/g)].map(x => x[1]);
};

test("le motif des parcours de « splat » est exactement celui que rend motifPhp() du moteur", () => {
  const motifs = listePhp(entreeSplat(), "motifs");
  assert.deepEqual(motifs, [PARCOURS.motifPhp()],
    "la carte a changé : recopier PARCOURS.motifPhp() dans 'motifs' de « splat » (lib/applis.php)");
  const regex = new RegExp(motifs[0].slice(1, -1));
  assert.equal(PARCOURS.PARCOURS_VALIDES.length, 54, "40 étapes (l'échauffement É1-É3 compris, 14/10/2026) + 14 Bonus");
  PARCOURS.PARCOURS_VALIDES.forEach(id => assert.ok(regex.test(id), id));
  ["ech1", "ech2", "ech3"].forEach(id => assert.ok(regex.test(id), `${id} : l'échauffement du monde 6`));
  ["m9e9", "splat-equations", "enq10d", "prenom", "1", "3-7", "ech", "ech0", "ech4", "ech9", "ech1d", "m4ech1"].forEach(id => assert.equal(regex.test(id), false, id));
});

test("les clés de « splat » sont exactement CLES_SERVEUR du moteur ; ni mots, ni texte", () => {
  const entree = entreeSplat();
  assert.deepEqual(listePhp(entree, "cles"), [...PARCOURS.CLES_SERVEUR]);
  assert.deepEqual(listePhp(entree, "mots"), [], "aucun mot : le parcours SPLAT! n'a que des nombres, des booléens et des dates");
  assert.match(entree, /'compteur' => 'etapes',/, "« Revenir à… » compte les étapes");
  assert.match(entree, /'disponible' => true,/);
  assert.match(entree, /'url' => 'https:\/\/mathsgo\.re\/outils\/splat_univers\.html',/, "l'élève arrive sur la carte des mondes");
  assert.match(entree, /'ancre' => null,/);
  assert.match(entree, /'nom' => 'SPLAT!',/);
});

test("« splat » remplace « splat-equations », à la même place du catalogue", () => {
  const cles = [...catalogue.matchAll(/^\s{4}'([a-z0-9-]+)' => \[$/gm)].map(m => m[1]);
  // Coffres magiques juste après Défi tables (lot « Coffres magiques sur le suivi », 21/10/2026),
  // puis Anzan (lot « Qui voit quoi », lot 4a, 23/10/2026).
  assert.deepEqual(cles, ["defi-tables", "coffres", "flash-anzan", "defi-calcul", "automatismes", "splat", "soley"]);
  for (const chemin of ["_serveur/public/lib/applis.php", "_serveur/public/api/parcours.php", "_serveur/public/api/prof.php"]) {
    assert.doesNotMatch(lire(chemin).replace(/\/\/[^\n]*/g, ""), /'splat-equations'/, `${chemin} : plus de « splat-equations » dans le code`);
  }
});

test("l'API élève accepte « splat », et le professeur peut le proposer à une classe", () => {
  assert.match(lire("_serveur/public/api/parcours.php"), /const APPLIS_CONNUES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat'\];/,
    "sans « splat » ici, le premier envoi du site répondrait « 400 Application inconnue »");
  assert.match(lire("_serveur/public/api/prof.php"), /const APPLIS_PROPOSABLES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat'\];/,
    "« Ma classe » et « Activités de la classe » (lot 4) passent par cette liste");
});

test("le moteur SPLAT! écrit sous « splat », la clé que le serveur connaît", () => {
  assert.equal(PARCOURS.APPLI, "splat");
});
