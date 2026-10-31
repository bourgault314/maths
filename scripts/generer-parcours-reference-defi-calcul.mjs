// La progression de référence de Défi calcul : une progression COMPLÈTE telle
// que defi_calcul_mon_parcours.js la produit, dans son format définitif
// (lot 2a, version 2 au lot 3) — les 74 modules, toutes les compétences dans
// une boîte, toutes les causes, la séance et son plan, les dates. Elle sert
// de garde-fou entre l'appli et le serveur (lot 2b) : le serveur ne garde que
// ce qu'il connaît (lib/progression.php), et ce fichier doit ressortir
// identique de son filtre. Si l'appli gagne un champ, la référence change
// (tests/defi-calcul-mon-parcours.test.mjs le vérifie).
//
// Usage :
//   node scripts/generer-parcours-reference-defi-calcul.mjs            (affiche la référence)
//   node scripts/generer-parcours-reference-defi-calcul.mjs --ecrire   (lot 2b : écrit
//       _serveur/tests/parcours-reference-defi-calcul.json)

import {createRequire} from "node:module";
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

// Les clés que le serveur devra déclarer pour « defi-calcul » (document de
// l'étape 5a, § 9, plus `p` : le plan de la séance, et `t` : entraînée avec
// l'aide le jour `vu`, lot 3 ; `test` a disparu au lot 3), en plus des 74
// codes de module et des numéros de cause.
export const CLES_DECLAREES = Object.freeze(["version", "epoque", "prenom", "modules", "vu", "ok", "b", "e", "a", "f", "x", "t", "c",
  "seance", "jour", "etape", "n", "p", "seances", "jours"]);

// `entier` : toutes les compétences des 74 modules dans une boîte (le pire
// cas pour la taille).
export function parcoursComplet({causes = 8, entier = false} = {}) {
  const p = PARCOURS.creerParcours();
  p.epoque = 3;
  // Le prénom reste sur l'appareil : le paquet envoyé au serveur le vide.
  p.prenom = "";
  PARCOURS.CODES.forEach((id, index) => {
    const k = PARCOURS.NIVEAUX[id];
    const jour = `2026-10-${String(1 + (index % 28)).padStart(2, "0")}`;
    const boites = Array.from({length: k}, (_, i) => 1 + ((index + i) % PARCOURS.SEUILS.revision.boites));
    p.modules[id] = {
      vu: jour,
      ok: jour,
      b: boites,
      e: boites.map(boite => PARCOURS.echeanceDeBoite(boite, jour)),
      a: Array.from({length: k}, () => 1),
      f: Array.from({length: k}, () => PARCOURS.SEUILS.compteur),
      x: Array.from({length: k}, (_, i) => (index + i) % 3),
      t: Array.from({length: k}, (_, i) => (index + i) % 2),
      c: Object.fromEntries(Array.from({length: causes}, (_, c) => [String(c + 1), PARCOURS.SEUILS.compteur]))
    };
  });
  // Le dernier module n'est qu'à moitié entré : une compétence sans boîte n'a
  // pas d'échéance (null), et le serveur doit la rendre telle quelle.
  if (!entier) {
    const dernier = p.modules[PARCOURS.CODES[PARCOURS.CODES.length - 1]];
    dernier.ok = null;
    dernier.b = dernier.b.map((boite, i) => (i === 0 ? boite : 0));
  }
  p.seance = {jour: "2026-10-28", etape: 2, n: 60, p: [1, 0, PARCOURS.rangDe("A5", 2) + 1, 4, 2]};
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
