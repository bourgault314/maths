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
  });
  p.melange = {tables: [...PARCOURS.TABLES], aJour: true, aRefaireAvec: null, dernier: "2026-09-20"};
  p.expert = {niveau: 3, dernier: "2026-09-21", champion: "2026-09-22"};
  PARCOURS.FAITS.forEach((cle, index) => {
    p.calculs[cle] = {cases: index % 4, vu: "2026-09-23", erreur: index % 2 ? "2026-09-22" : null, gagne: index % 3 ? "2026-09-23" : null};
  });
  return PARCOURS.normaliserParcours(p);
}

export const CHEMIN = new URL("../_serveur/tests/parcours-reference.json", import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(CHEMIN, JSON.stringify(parcoursComplet(), null, 2) + "\n");
  console.log("_serveur/tests/parcours-reference.json régénéré.");
}
