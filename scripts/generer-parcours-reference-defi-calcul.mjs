// La progression de référence de Défi calcul : une progression COMPLÈTE telle
// que defi_calcul_mon_parcours.js la produit — les 71 modules, tous les
// niveaux, toutes les causes, la boîte, la séance, les dates. Elle servira de
// garde-fou entre l'appli et le serveur au lot 2 : le serveur ne garde que ce
// qu'il connaît (lib/progression.php), et ce fichier devra ressortir
// identique de son filtre. Si l'appli gagne un champ, la référence change
// (tests/defi-calcul-mon-parcours.test.mjs le vérifie).
//
// Usage :
//   node scripts/generer-parcours-reference-defi-calcul.mjs            (affiche la référence)
//   node scripts/generer-parcours-reference-defi-calcul.mjs --ecrire   (lot 2 : écrit
//       _serveur/tests/parcours-reference-defi-calcul.json)

import {createRequire} from "node:module";
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

// Les clés que le serveur devra déclarer pour « defi-calcul » (fiche
// technique § 3.2), en plus des 71 codes de module et des numéros de cause.
export const CLES_DECLAREES = Object.freeze(["version", "epoque", "prenom", "mod", "modules", "vu", "ok", "nv", "v", "a", "t", "f",
  "b", "e", "err", "r", "c", "seance", "jour", "etape", "n", "seances", "jours"]);

export function parcoursComplet({causes = 8} = {}) {
  const p = PARCOURS.creerParcours();
  p.epoque = 3;
  // Le prénom reste sur l'appareil : le paquet envoyé au serveur le vide.
  p.prenom = "";
  p.mod = "A5";
  PARCOURS.CODES.forEach((id, index) => {
    const k = PARCOURS.NIVEAUX[id];
    const jour = `2026-10-${String(1 + (index % 28)).padStart(2, "0")}`;
    p.modules[id] = {
      vu: jour,
      ok: jour,
      nv: k,
      v: Array.from({length: k}, () => 1),
      a: Array.from({length: k}, () => 1),
      t: Array.from({length: k}, () => PARCOURS.SEUILS.compteur),
      f: Array.from({length: k}, () => PARCOURS.SEUILS.compteur),
      b: 1 + (index % PARCOURS.SEUILS.revision.boites),
      e: PARCOURS.ajouterJours(jour, 3),
      err: index % 3,
      r: index % 3 === 2,
      c: Object.fromEntries(Array.from({length: causes}, (_, c) => [String(c + 1), PARCOURS.SEUILS.compteur]))
    };
  });
  p.seance = {jour: "2026-10-28", etape: 2, n: 60};
  p.seances = Array.from({length: PARCOURS.SEUILS.seance.garder}, (_, i) => PARCOURS.ajouterJours("2026-09-01", Math.floor(i / 2)));
  p.jours = Array.from({length: PARCOURS.SEUILS.jours.garder}, (_, i) => PARCOURS.ajouterJours("2026-10-15", i));
  return PARCOURS.normaliserParcours(p);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const json = JSON.stringify(parcoursComplet(), null, 2) + "\n";
  if (process.argv.includes("--ecrire")) {
    const cible = new URL("../_serveur/tests/parcours-reference-defi-calcul.json", import.meta.url);
    writeFileSync(cible, json);
    console.log(`Référence écrite : ${fileURLToPath(cible)}`);
  } else {
    process.stdout.write(json);
  }
}
