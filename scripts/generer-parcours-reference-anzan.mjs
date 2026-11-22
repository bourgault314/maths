// Le parcours de référence d'Anzan : un parcours COMPLET tel que
// outils/calcul_mental/flash_anzan_parcours.js l'ENVOIE au serveur
// (pourServeur) — les réglages de l'élève (le mode choisi, ceux du Flash et
// de la Colonne) et une douzaine de séances sur plusieurs jours, Flash et
// Colonne, dont une arrêtée en route (moins de calculs faits que prévus),
// chacune sous son identifiant. Il
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

// Une séance jouée : notée calcul après calcul, comme la page le fait, sous
// l'identifiant tiré au départ (ici fixé, pour que le fichier soit reproductible).
function seance(p, id, jour, mode, reglages, faits, score) {
  for (let i = 1; i <= faits; i += 1) {
    p = PARCOURS.noterSeance(p, {id, mode, reglages, faits: i, score: Math.min(score, i)}, jour).parcours;
  }
  return p;
}

export function parcoursComplet() {
  let prochainId = 100001;
  const seance_ = (p, ...reste) => seance(p, prochainId++, ...reste);
  let p = PARCOURS.creer();
  p.epoque = 2;
  p = PARCOURS.sauverReglages(p, {mode: "colonne", flash: FLASH, colonne: COLONNE});
  p = seance_(p, "2026-10-13", "flash", {...FLASH, chiffresMin: 1, chiffresMax: 1, nombres: 6, temps: 15}, 10, 10);
  p = seance_(p, "2026-10-14", "flash", {...FLASH, chiffresMin: 1, chiffresMax: 1, temps: 10}, 10, 10);
  p = seance_(p, "2026-10-15", "colonne", {...COLONNE, chiffresMin: 2, chiffresMax: 2, nombres: 10, limite: 0}, 10, 9);
  p = seance_(p, "2026-10-17", "flash", {...FLASH, chiffresMin: 1, chiffresMax: 2, nombres: 8, temps: 12, calculs: 5}, 5, 5);
  p = seance_(p, "2026-10-18", "flash", {...FLASH, chiffresMin: 1, chiffresMax: 2, nombres: 8, temps: 10}, 10, 10);
  p = seance_(p, "2026-10-19", "colonne", {...COLONNE, nombres: 10, calculs: 20}, 20, 17);
  // La séance arrêtée en route : 7 calculs faits sur 10 prévus, 6 justes.
  p = seance_(p, "2026-10-20", "flash", {...FLASH, chiffresMin: 2, chiffresMax: 2, temps: 10}, 7, 6);
  p = seance_(p, "2026-10-21", "flash", {...FLASH, chiffresMin: 2, chiffresMax: 2, temps: 10}, 10, 9);
  p = seance_(p, "2026-10-21", "colonne", COLONNE, 10, 10);
  p = seance_(p, "2026-10-22", "flash", FLASH, 10, 8);
  // Les grades et leurs étapes (barème révisé, 22/11/2026) : le 20e kyu
  // gagné (ses deux étapes, 101 et 102), un entraînement à la 1re étape du
  // 19e kyu (5 calculs), un passage « presque », puis réussi — le serveur
  // doit garder les mots « grade » et « entrainement » et la clé
  // « etapeFlash » (le rang de la plus haute étape réussie : 3).
  const ETAPE = (numero, calculs = 10) => {
    const e = PARCOURS.etape(numero);
    return {operations: e.operations, chiffresMin: e.chiffresMin, chiffresMax: e.chiffresMax, nombres: e.nombres, calculs, etape: numero};
  };
  p = seance_(p, "2026-11-22", "grade", ETAPE(101), 10, 9);
  p = seance_(p, "2026-11-22", "grade", ETAPE(102), 10, 8);
  p = seance_(p, "2026-11-22", "entrainement", ETAPE(103, 5), 5, 4);
  p = seance_(p, "2026-11-22", "grade", ETAPE(103), 10, 6);
  p = seance_(p, "2026-11-23", "grade", ETAPE(103), 10, 7);
  // En Colonne : la 1re étape du 10e kyu (201) réussie à 8 sur 10, un
  // entraînement à la 2e (202) — le serveur doit garder « etapeColonne ».
  p = seance_(p, "2026-11-23", "grade", ETAPE(201), 10, 8);
  p = seance_(p, "2026-11-23", "entrainement", ETAPE(202, 5), 5, 5);
  return PARCOURS.pourServeur(p);
}

export const CHEMIN = new URL("../_serveur/tests/parcours-reference-anzan.json", import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(CHEMIN, JSON.stringify(parcoursComplet(), null, 2) + "\n");
  console.log("_serveur/tests/parcours-reference-anzan.json régénéré.");
}
