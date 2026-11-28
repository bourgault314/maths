// Défi calcul, lot F4 « Personne ne reste bloqué » (18/11/2026, choix de
// Gwenaël après l'audit des six profils) : J'apprends ne se rate plus (il
// s'arrête sur « On continue demain » et reprend où il en était), 5 justes
// sur les 6 derniers, plus de séance qui finit sur un test raté, le test de
// palier, et « à voir en classe » au 3e arrêt sur le même niveau. Le format
// passe en version 10 (`ar`, `paliers` ; recalé le 20/11 après le lot 6
// « programmes 2 », qui avait pris la 9) : la check-list du modèle commun
// (deux appareils hors ligne, vieille copie, donnée abîmée, fusion dans les
// deux sens).

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

const J = "2026-11-23";
const plus = (n, jour = J) => P.ajouterJours(jour, n);
const opts = (jour = J, seance = true) => ({aujourdhui: jour, carte: CARTE, seance});
const types = (p, jour = J) => P.fileSeance(p, CARTE, {aujourdhui: jour}).etapes.map(e => e.type);
const premiere = (p, jour = J) => P.fileSeance(p, CARTE, {aujourdhui: jour}).etapes[0];
const ouvrir = (p, jour = J) => P.ouvrirSeance(p, CARTE, {aujourdhui: jour});
const reussie = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
// Arrêté sans aide : 25 calculs, un faux sur trois.
const arretee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const duPalier = palier => P.parcoursConstruit(CARTE).filter(c => P.palierDe(CARTE, c.module, c.niveau) === palier);
// Le test de palier déjà joué (pour suivre le parcours module par module).
const sansTestDePalier = p => Object.assign(p, {paliers: [plus(-30), plus(-30), plus(-30), plus(-30)]});
const apprendre = (p, module, niveau, reponses, jour = J) => P.appliquerSerie(p, {module, niveau, genre: "apprends", reponses}, opts(jour));

// ------------------------------------------------------------ le test de palier

// ------------------------------------------------- J'apprends ne se rate plus

// ------------------------------------------- une séance ne finit pas sur un test raté

// ---------------------------------------------------------- les données (v10)

test("lot 6-0 : une ceinture gagnée cette semaine est dans « À féliciter » (le jour le plus récent de la semaine), la page prof l'écrit", async () => {
  // (Lot K1b : six ceintures à gagner — la 1re est la blanche-jaune (le CP), la 2e la jaune (le CE1).)
  const p = Object.assign(P.creerParcours(), {ceintures: [plus(-10), plus(1), null, null, null, null]});
  assert.deepEqual(P.resumeSuivi(p, {aujourdhui: plus(2)}).feliciter, [{type: "ceinture", ceinture: 2}], "la jaune (cette semaine), pas la blanche-jaune (la semaine d'avant)");
  assert.deepEqual(P.resumeSuivi(p, {aujourdhui: plus(0)}).feliciter, [], "pas avant le jour où elle est gagnée");
  const prof = await lire("../_serveur/public/prof/index.php");
  assert.match(prof, /const NOMS_CEINTURES = \["ceinture blanche-jaune", "ceinture jaune", "ceinture jaune-orange", "ceinture orange", "ceinture verte", "ceinture bleue"\];/);
  // (Lot K1b, choix de Gwenaël le 26/11 : la classe entre parenthèses, « ceinture blanche-jaune (CP) gagnée ».)
  assert.match(prof, /\$\{NOMS_CEINTURES\[x\.ceinture - 1\]\} \(\$\{CLASSES_CEINTURES\[x\.ceinture - 1\]\}\) gagnée/);
  // La page prof dit « J'apprends arrêté 3 fois » d'un niveau jamais appris
  // (lot K2 : l'étoile « à voir en classe » lue par etoileDe, suiteCalcul).
  assert.match(prof, /if \(e\.etat === "classe"\) \{\s*if \(e\.arrets >= 3\) \{/);
  assert.match(prof, /`J’apprends arrêté 3 fois : à voir en classe · /);
});
