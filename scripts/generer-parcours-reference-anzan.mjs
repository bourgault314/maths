// Le parcours de référence d'Anzan : un parcours COMPLET tel que
// outils/calcul_mental/flash_anzan_parcours.js l'ENVOIE au serveur
// (pourServeur) — les réglages de l'élève (le mode choisi, ceux du Flash et
// de la Colonne) et une douzaine de séances sur plusieurs jours, Flash et
// Colonne, dont une arrêtée en route (moins de calculs faits que prévus). Il
// sert de garde-fou entre l'appli et le serveur : le serveur ne garde que ce
// qu'il connaît (lib/progression.php), et ce fichier doit ressortir identique
// de son filtre (test PHP du lot, _serveur/tests/lancer.php). Si le moteur
// gagne un champ, ce fichier change (tests/flash-anzan-parcours.test.mjs le
// vérifie), et le test PHP casse tant que lib/applis.php n'est pas complété.
//
// Le parcours est construit PAR LE MOTEUR (sauverReglages, noterSeance), pas
// écrit à la main : ce qui est ici est exactement ce qu'une élève produit.
//
// Usage : node scripts/generer-parcours-reference-anzan.mjs
//   (réécrit _serveur/tests/parcours-reference-anzan.json)

import {createRequire} from "node:module";
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/flash_anzan_parcours.js");

const FLASH = {operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, temps: 8, calculs: 10, son: "bip"};
const COLONNE = {operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, limite: 20, calculs: 10};

// Une séance jouée : notée calcul après calcul, comme la page le fait.
function seance(p, jour, mode, reglages, faits, score) {
  let numero = null;
  for (let i = 1; i <= faits; i += 1) {
    const r = PARCOURS.noterSeance(p, {mode, reglages, faits: i, score: Math.min(score, i)}, numero, jour);
    p = r.parcours;
    numero = r.numero;
  }
  return p;
}

export function parcoursComplet() {
  let p = PARCOURS.creer();
  p.epoque = 2;
  p = PARCOURS.sauverReglages(p, {mode: "colonne", flash: FLASH, colonne: COLONNE});
  p = seance(p, "2026-10-13", "flash", {...FLASH, chiffresMin: 1, chiffresMax: 1, nombres: 6, temps: 15}, 10, 10);
  p = seance(p, "2026-10-14", "flash", {...FLASH, chiffresMin: 1, chiffresMax: 1, temps: 10}, 10, 10);
  p = seance(p, "2026-10-15", "colonne", {...COLONNE, chiffresMin: 2, chiffresMax: 2, nombres: 10, limite: 0}, 10, 9);
  p = seance(p, "2026-10-17", "flash", {...FLASH, chiffresMin: 1, chiffresMax: 2, nombres: 8, temps: 12, calculs: 5}, 5, 5);
  p = seance(p, "2026-10-18", "flash", {...FLASH, chiffresMin: 1, chiffresMax: 2, nombres: 8, temps: 10}, 10, 10);
  p = seance(p, "2026-10-19", "colonne", {...COLONNE, nombres: 10, calculs: 20}, 20, 17);
  // La séance arrêtée en route : 7 calculs faits sur 10 prévus, 6 justes.
  p = seance(p, "2026-10-20", "flash", {...FLASH, chiffresMin: 2, chiffresMax: 2, temps: 10}, 7, 6);
  p = seance(p, "2026-10-21", "flash", {...FLASH, chiffresMin: 2, chiffresMax: 2, temps: 10}, 10, 9);
  p = seance(p, "2026-10-21", "colonne", COLONNE, 10, 10);
  p = seance(p, "2026-10-22", "flash", FLASH, 10, 8);
  return PARCOURS.pourServeur(p);
}

export const CHEMIN = new URL("../_serveur/tests/parcours-reference-anzan.json", import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(CHEMIN, JSON.stringify(parcoursComplet(), null, 2) + "\n");
  console.log("_serveur/tests/parcours-reference-anzan.json régénéré.");
}
