// La progression de référence de Défi calcul : une progression COMPLÈTE telle
// que defi_calcul_mon_parcours.js la produit, dans son format définitif
// (lot 2a, version 2 au lot 3) — les 74 modules, toutes les compétences dans
// une boîte (1 à 7 depuis le lot F1), toutes les causes, la séance et son plan, les dates. Elle sert
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
// l'aide le jour `vu`, lot 3 ; `test` a disparu au lot 3 ; `d`, `s`, `j`,
// `journal` et ses six listes au lot G1, `numero` au correctif du lot S1),
// en plus des 74 codes de module et
// des numéros de cause.
// Lot 1 « la séance » (12/11/2026) : `l`, le « lent » de chaque compétence.
export const CLES_DECLAREES = Object.freeze(["version", "epoque", "prenom", "modules", "vu", "ok", "b", "e", "a", "f", "x", "t", "l", "d", "s", "c",
  "seance", "jour", "etape", "n", "p", "j", "seances", "journal", "calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes", "jours", "numero",
  // Lot 4 « les ceintures » (14/11/2026) : les ceintures gagnées.
  "ceintures"]);

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
      l: Array.from({length: k}, (_, i) => (index + i + 1) % 2),
      // Lot G1 : les deux dates de chaque compétence (le pire cas : toutes
      // posées).
      d: Array.from({length: k}, () => "2026-09-15"),
      s: Array.from({length: k}, () => "2026-09-29"),
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
  // Lot F1 : le plan a sept nombres (8 tests, 3 nouveautés prévues, 2 réussies).
  // Lot G1 : ce que la séance ouverte a fait (j, six nombres depuis le
  // correctif : les nouveautés en 6e), et le journal des 60
  // séances (les plus grands nombres, le pire cas pour la taille ; une
  // séance d'avant G1 en -1).
  // Lot 1 « la séance » : le plan a onze nombres (12 tests, 15 minutes, 3
  // apprentissages commencés, un 2e calcul en attente avec ce qu'il rendra).
  p.seance = {jour: "2026-10-28", etape: 2, n: 60, p: [1, 1, PARCOURS.rangDe("A5", 2) + 1, 12, 0, 15, 3, PARCOURS.rangDe("A5", 1) + 1, 4, 2, 1], j: [999, 999, 999, 999, 5400, 99]};
  p.seances = Array.from({length: PARCOURS.SEUILS.seance.garder}, (_, i) => PARCOURS.ajouterJours("2026-09-01", Math.floor(i / 2)));
  const garder = PARCOURS.SEUILS.seance.garder;
  p.journal = {calculs: Array(garder).fill(999), justes: Array(garder).fill(999), nouveautes: Array(garder).fill(99),
    prouvees: Array(garder).fill(999), rouges: Array(garder).fill(999), minutes: Array(garder).fill(90),
    // Correctif S1 : le numéro de chaque séance (les plus grands, le pire cas).
    numero: Array.from({length: garder}, (_, i) => 999999 - i)};
  // Lot 4 : deux ceintures gagnées, deux pas encore (une date, puis null :
  // le serveur doit garder les null à leur place).
  p.ceintures = ["2026-10-02", "2026-10-20", null, null];
  Object.keys(p.journal).forEach(champ => { p.journal[champ][0] = -1; });
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
