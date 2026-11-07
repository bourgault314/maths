// Le parcours de référence : un parcours COMPLET tel que defi_tables_mon_parcours.js
// le produit — toutes les tables, toutes les activités, tous les calculs, toutes
// les dates. Il sert de garde-fou entre l'appli et le serveur : le serveur ne
// garde que ce qu'il connaît (lib/progression.php), et ce fichier doit ressortir
// identique de son filtre. Si l'appli gagne un champ, ce fichier change
// (tests/defi-tables-mon-parcours.test.mjs le vérifie), et le test PHP casse tant
// que _serveur/public/lib/applis.php n'est pas complété.
//
// Usage : node scripts/generer-parcours-reference.mjs
//   (réécrit _serveur/tests/parcours-reference.json)

import {createRequire} from "node:module";
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");

export function parcoursComplet() {
  const p = PARCOURS.creerParcours();
  p.epoque = 3;
  // Le prénom reste sur l'appareil : le paquet envoyé au serveur le vide.
  p.prenom = "";
  PARCOURS.TABLES.forEach((table, index) => {
    const ligne = p.tables[table];
    PARCOURS.ACTIVITES_APPRENDS.forEach(activite => { ligne.apprends[activite] = 2; });
    PARCOURS.ENTRAINEMENTS.forEach(entrainement => { ligne.entraine[entrainement] = 2; });
    ligne.entraine.dernier = {entrainement: PARCOURS.ENTRAINEMENTS[index % PARCOURS.ENTRAINEMENTS.length], score: 9, total: 10};
    ligne.acquise = `2026-09-${String(index + 1).padStart(2, "0")}`;
    // Lot « Ma séance du jour » : les bouts de la rangée, le départ de
    // l'échelle, les deux « sans faute » du raccourci.
    ligne.bouts = PARCOURS.multiplicateursBouts(table);
    ligne.seance = {depart: 1 + (index % 6), n: index + 3, dernier: `2026-09-${String(10 + index).padStart(2, "0")}`};
    ligne.sansFaute = {desordre: 1, trous: index % 2};
  });
  p.seances = ["2026-09-21", "2026-09-22", "2026-09-22", "2026-09-23"];
  // Lot S1 « les journaux » : le journal de chaque séance (la première est
  // d'avant le lot : pas connue, -1).
  p.journal = {table: [-1, 7, 7, 0], etapes: [-1, 4, 5, 2], calculs: [-1, 10, 0, 10], justes: [-1, 9, 0, 8],
    test: [-1, 0, 2, 0]};
  // Lot M1 : une séance en cours, avec tout ce qu'elle peut porter (une
  // marche ratée refaite, une étoile tentée, des calculs à retenir).
  p.enCours = {jour: "2026-09-23", table: 7, depart: 5, echelle: false, rang: 1,
    file: [16, 26, 7, 200, 300], faites: [100, 8, 10, 0, 6, 5, 10, 1, 200, 17, 20, 4, 303, 24, 25, 2],
    erreurs: [407, 709, 1010], rate: 6, sansFaute: false, remplacee: true, reparee: false, prete: true};
  // Lot « retouches après Mon parcours » : la liste « À retenir » du jour.
  p.retenir = {jour: "2026-09-23", erreurs: [308, 709, 310]};
  // Lot « un seul système » : le mélange libre (dernier score, trophée) et le
  // jour où Mes calculs du jour a été joué.
  p.melange = {tables: [...PARCOURS.TABLES], aJour: true, aRefaireAvec: null, dernier: "2026-09-20", score: 19, reussi: 9};
  p.calculsDuJour = "2026-09-23";
  // Lot 3 : l'escalier, le rang, les jours travaillés. (L'avis de migration
  // du lot 3 a été retiré au lot 4b ; « beads » s'est ajouté aux activités.)
  p.expert = {etoiles: 5, dernier: "2026-09-21", couronne: "2026-09-22"};
  p.rang = 6;
  p.jours = ["2026-09-10", "2026-09-11", "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23"];
  // Lot mémoire : cinq boîtes et une échéance par calcul (« cases » est le
  // miroir 0-3 que l'appli écrit encore pour les appareils d'avant).
  PARCOURS.FAITS.forEach((cle, index) => {
    const boite = 1 + (index % 5);
    p.calculs[cle] = {boite, cases: Math.min(boite - 1, 3), vu: "2026-09-23", erreur: index % 2 ? "2026-09-22" : null, gagne: index % 3 ? "2026-09-23" : null, echeance: `2026-09-${String(24 + (index % 5)).padStart(2, "0")}`};
  });
  return PARCOURS.normaliserParcours(p);
}

export const CHEMIN = new URL("../_serveur/tests/parcours-reference.json", import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(CHEMIN, JSON.stringify(parcoursComplet(), null, 2) + "\n");
  console.log("_serveur/tests/parcours-reference.json régénéré.");
}
