// Le parcours de référence de Coffres magiques : un parcours COMPLET tel que
// assets/js/coffres-parcours.js l'ENVOIE au serveur (pourServeur) — les trois
// niveaux commencés (trésors et trésors parfaits), les quatre opérations
// touchées (clés gagnées, aides, solutions montrées, erreurs), le jour du
// dernier trésor, et une partie en cours à 6 clés sur 10. Il sert de garde-fou
// entre l'appli et le serveur : le serveur ne garde que ce qu'il connaît
// (lib/progression.php), et ce fichier doit ressortir identique de son filtre
// (test PHP du lot, _serveur/tests/lancer.php). Si le moteur gagne un champ, ce
// fichier change (tests/coffres-parcours.test.mjs le vérifie), et le test PHP
// casse tant que lib/applis.php n'est pas complété.
//
// Le parcours est construit PAR LE MOTEUR (commencerPartie, noterCle, noterTresor…),
// pas écrit à la main : ce qui est ici est exactement ce qu'un élève produit.
//
// Usage : node scripts/generer-parcours-reference-coffres.mjs
//   (réécrit _serveur/tests/parcours-reference-coffres.json)

import {createRequire} from "node:module";
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const PARCOURS = require("../assets/js/coffres-parcours.js");

// Un trésor : dix clés sur la série donnée, avec ce qui s'y passe.
function tresor(p, niveau, ops, serie, jour, incidents) {
  p = PARCOURS.commencerPartie(p, {niveau, ops, serie, familles: serie.map((_, i) => i === 1 || i === 6)}, jour);
  serie.forEach((operation, index) => {
    const incident = incidents && incidents[index];
    if (incident === "aide") p = PARCOURS.noterAide(p, operation, jour);
    if (incident === "solution") { p = PARCOURS.noterAide(p, operation, jour); p = PARCOURS.noterSolution(p, operation, jour); }
    if (incident === "erreur") p = PARCOURS.noterErreur(p, operation, jour);
    p = PARCOURS.noterCle(p, operation, jour);
  });
  return PARCOURS.noterTresor(p, jour);
}

export function parcoursComplet() {
  let p = PARCOURS.creer();
  p.epoque = 2;
  const quatre = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];
  // Niveau 1 : cinq trésors, trois parfaits.
  p = tresor(p, 1, [1, 2, 3, 4], quatre, "2026-10-12", {});
  p = tresor(p, 1, [1, 2, 3, 4], quatre, "2026-10-13", {3: "erreur"});
  p = tresor(p, 1, [1, 2, 3, 4], quatre, "2026-10-14", {});
  p = tresor(p, 1, [1, 2, 3, 4], quatre, "2026-10-15", {0: "aide"});
  p = tresor(p, 1, [1, 2, 3, 4], quatre, "2026-10-16", {7: "solution", 8: "erreur"});
  // Niveau 2 : deux trésors, un parfait (additions et multiplications).
  const deux = ["sum", "product", "sum", "product", "sum", "product", "sum", "product", "sum", "product"];
  p = tresor(p, 2, [1, 3], deux, "2026-10-19", {});
  p = tresor(p, 2, [1, 3], deux, "2026-10-20", {1: "erreur", 5: "aide"});
  // Niveau 3 : un trésor, pas parfait (divisions seules).
  const div = quatre.map(() => "quotient");
  p = tresor(p, 3, [4], div, "2026-10-21", {2: "solution"});
  // La partie en cours : niveau 2, addition et multiplication, 6 clés sur 10,
  // une erreur dedans (elle n'est plus parfaite).
  p = PARCOURS.commencerPartie(p, {niveau: 2, ops: [1, 3], serie: deux, familles: deux.map((_, i) => i === 4 || i === 9)}, "2026-10-21");
  deux.slice(0, 6).forEach((operation, index) => {
    if (index === 2) p = PARCOURS.noterErreur(p, operation, "2026-10-21");
    p = PARCOURS.noterCle(p, operation, "2026-10-21");
  });
  // Lot S1 « les journaux » : le journal s'est rempli tout seul, un jour par
  // jour joué ; un vieux jour venu d'une copie abîmée (des valeurs pas
  // connues, -1) s'y ajoute par la fusion.
  p = PARCOURS.fusionner(p, {version: PARCOURS.VERSION, epoque: 2, niveaux: {}, operations: {}, jours: ["2026-10-09"],
    journal: {tresors: [1], parfaits: [-1], aides: [-1], solutions: [0]}, depuis: "2026-10-09"});
  return PARCOURS.pourServeur(p);
}

export const CHEMIN = new URL("../_serveur/tests/parcours-reference-coffres.json", import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(CHEMIN, JSON.stringify(parcoursComplet(), null, 2) + "\n");
  console.log("_serveur/tests/parcours-reference-coffres.json régénéré.");
}
