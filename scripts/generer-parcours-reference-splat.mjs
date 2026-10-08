// Le parcours de référence de SPLAT! : un parcours COMPLET tel que
// assets/js/splat-parcours.js l'ENVOIE au serveur (pourServeur) — les 51
// parcours de la liste fermée (37 étapes + 14 Bonus : la numérotation de la
// carte saute de 28 à 35), tous faits sauf un en
// cours, des réponses vues, des étapes rejouées, des dates. Il sert de
// garde-fou entre l'appli et le serveur : le serveur ne garde que ce qu'il
// connaît (lib/progression.php), et ce fichier doit ressortir identique de son
// filtre (test PHP du lot 3, _serveur/tests/lancer.php). Si le moteur gagne un
// champ, ce fichier change (tests/splat-parcours.test.mjs le vérifie), et le
// test PHP casse tant que lib/applis.php n'est pas complété.
//
// Le parcours est construit PAR LE MOTEUR (enregistrerEnCours, enregistrerSerie,
// fusionner), pas écrit à la main : ce qui est ici est exactement ce qu'un
// élève produit.
//
// Usage : node scripts/generer-parcours-reference-splat.mjs
//   (réécrit _serveur/tests/parcours-reference-splat.json)

import {createRequire} from "node:module";
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const PARCOURS = require("../assets/js/splat-parcours.js");

// Le parcours en cours de la référence : celui de l'exemple de la conception (D2).
export const EN_COURS = "enq14";

export function parcoursComplet() {
  let p = PARCOURS.creer();
  p.epoque = 2;
  PARCOURS.PARCOURS_VALIDES.forEach((id, index) => {
    const cartes = 4 + (index % 9);
    const jour = `2026-09-${String(1 + (index % 28)).padStart(2, "0")}`;
    if (id === EN_COURS) {
      // Une série en cours : carte 3 atteinte, deux réussies du premier coup,
      // une réponse montrée ; le détail (sig, res) reste local, il ne sort pas.
      p = PARCOURS.enregistrerEnCours(p, id, {idx: 3, etoiles: 2, vues: 1, cartes, sig: "graine=7|n=4", res: [true, true, "ko"]}, "2026-10-07");
      return;
    }
    // Une première série médiocre une étape sur quatre (elle sera remplacée :
    // « la meilleure série gagne », mais « essais » la compte).
    if (index % 4 === 0) {
      p = PARCOURS.enregistrerSerie(p, id, {fait: true, etoiles: cartes - 3, cartes, vues: 2}, jour);
    }
    // La bonne série : tout du premier coup, ou presque ; une réponse montrée
    // une étape sur cinq (« réussie avec aide »).
    p = PARCOURS.enregistrerSerie(p, id, {fait: true, etoiles: cartes - (index % 3), cartes, vues: index % 5 === 0 ? 1 : 0},
      index % 4 === 0 ? `2026-09-${String(2 + (index % 28)).padStart(2, "0")}` : jour);
  });
  return PARCOURS.pourServeur(p);
}

export const CHEMIN = new URL("../_serveur/tests/parcours-reference-splat.json", import.meta.url);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(CHEMIN, JSON.stringify(parcoursComplet(), null, 2) + "\n");
  console.log("_serveur/tests/parcours-reference-splat.json régénéré.");
}
