// La progression de référence de Défi calcul : une progression COMPLÈTE telle
// que defi_calcul_mon_parcours.js la produit, dans son format (version 13
// depuis le lot K1b « les bases en trois classes », 26/11/2026 : six étages,
// neuf étoiles de plus) — les 74 modules,
// toutes les étoiles dans une boîte (1 à 7), toutes les causes, la séance et
// son plan, les dates. Elle sert de garde-fou entre l'appli et le serveur
// (lot 2b) : le serveur ne garde que ce qu'il connaît (lib/progression.php),
// et ce fichier doit ressortir identique de son filtre. Si l'appli gagne un
// champ, la référence change (tests/defi-calcul-mon-parcours.test.mjs le
// vérifie).
//
// Usage :
//   node scripts/generer-parcours-reference-defi-calcul.mjs            (affiche la référence)
//   node scripts/generer-parcours-reference-defi-calcul.mjs --ecrire   (écrit
//       _serveur/tests/parcours-reference-defi-calcul.json)

import {createRequire} from "node:module";
import {writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

// Les clés que le serveur déclare pour « defi-calcul » (lib/applis.php), en
// plus des 74 codes de module et des numéros de cause. Version 12 : par
// étoile `b`, `e`, `a`, `x`, `r`, `q`, `pe`, `d`, `s`, `ar`, `g` ; la séance
// `jour`, `etape`, `n`, `i`, `g`, `p`, `j`, `parts` ; le journal et ses onze
// listes ; `ceintures`, `paliers`, `quarts`.
// Correctif K1 (26/11/2026) : `prenom` n'en est plus — le prénom d'un
// visiteur sans code reste sur l'appareil, le paquet envoyé ne le porte pas
// et le serveur ne le garderait pas ; `parts` (ce que chaque onglet a fait
// dans la séance ouverte) s'ajoute.
export const CLES_DECLAREES = Object.freeze(["version", "epoque", "modules", "vu", "b", "e", "a", "x", "r", "q", "pe", "d", "s", "ar", "g", "c",
  "seance", "jour", "etape", "n", "i", "p", "j", "parts", "seances", "journal", "calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes", "numero",
  "seuls", "seulsJustes", "tests", "testsRates", "jours", "ceintures", "paliers", "quarts"]);

// Le jour de la relecture : fixe, pour que la référence ne dépende pas de
// l'horloge du poste (toutes ses dates sont avant lui).
const JOUR = "2026-11-25";

// `entier` : toutes les étoiles des 74 modules dans une boîte.
// `pire` : le pire cas pour la TAILLE — aucune étoile tenue, mais toutes
// gagnées un jour, solides un jour, perdues trois fois, « à voir en classe »
// avec leur jour de retour, deux « Je tente » ratés et leur jour, le
// compteur au plus haut : quatre dates par étoile et les plus grands nombres.
export function parcoursComplet({causes = 8, entier = false, pire = false} = {}) {
  const p = PARCOURS.creerParcours();
  p.epoque = 3;
  // Le prénom reste sur l'appareil : le paquet envoyé au serveur le vide.
  p.prenom = "";
  PARCOURS.CODES.forEach((id, index) => {
    const k = PARCOURS.NIVEAUX[id];
    const jour = `2026-10-${String(1 + (index % 28)).padStart(2, "0")}`;
    const boites = Array.from({length: k}, (_, i) => 1 + ((index + i) % PARCOURS.SEUILS.revision.boites));
    p.modules[id] = pire ? {
      vu: jour,
      b: Array.from({length: k}, () => 0),
      e: Array.from({length: k}, () => "2026-11-20"),
      a: Array.from({length: k}, () => 1),
      x: Array.from({length: k}, () => 0),
      r: Array.from({length: k}, () => PARCOURS.SEUILS.tente.essais),
      q: Array.from({length: k}, () => "2026-11-19"),
      pe: Array.from({length: k}, () => PARCOURS.SEUILS.retour.perdues),
      d: Array.from({length: k}, () => "2026-09-15"),
      s: Array.from({length: k}, () => "2026-09-29"),
      ar: Array.from({length: k}, () => 29),
      g: Array.from({length: k}, () => PARCOURS.SEUILS.compteur),
      c: Object.fromEntries(Array.from({length: causes}, (_, c) => [String(c + 1), PARCOURS.SEUILS.compteur]))
    } : {
      vu: jour,
      b: boites,
      e: boites.map(boite => PARCOURS.echeanceDeBoite(boite, jour)),
      a: Array.from({length: k}, (_, i) => (index + i) % 2),
      // Le 2e calcul qui attend (2), un retour raté (1), les deux (3).
      x: Array.from({length: k}, (_, i) => (index + i) % 4),
      // Rien de tenté ni d'arrêté sur une étoile tenue.
      r: Array.from({length: k}, () => 0),
      q: Array.from({length: k}, () => null),
      pe: Array.from({length: k}, (_, i) => (index + i) % 4),
      // Les deux dates de chaque étoile (le pire cas : toutes posées).
      d: Array.from({length: k}, () => "2026-09-15"),
      s: Array.from({length: k}, () => "2026-09-29"),
      ar: Array.from({length: k}, () => 0),
      g: Array.from({length: k}, (_, i) => (i ? 1 + index + i : PARCOURS.SEUILS.compteur)),
      c: Object.fromEntries(Array.from({length: causes}, (_, c) => [String(c + 1), PARCOURS.SEUILS.compteur]))
    };
  });
  // Le dernier module n'est qu'à moitié tenu : une étoile sans boîte n'a pas
  // d'échéance (null), et le serveur doit la rendre telle quelle.
  if (!entier && !pire) {
    const dernier = p.modules[PARCOURS.CODES[PARCOURS.CODES.length - 1]];
    dernier.b = dernier.b.map((boite, i) => (i === 0 ? boite : 0));
    // Le niveau 2 : J'apprends arrêté 3 fois (« à voir en classe », repris
    // sans aide : 3 × 3 + 2), il revient le 2026-11-04 (son échéance), deux
    // « Je tente » ratés, le dernier le 2026-10-27 ; le niveau 3 : arrêté une
    // fois au dessin (3 × 1 + 1), sans échéance, perdu une fois (il garde le
    // jour où il a été gagné), un « Je tente » raté.
    dernier.ar = dernier.b.map((_, i) => (i === 1 ? 11 : i === 2 ? 4 : 0));
    dernier.e = dernier.e.map((jour, i) => (i === 0 ? jour : i === 1 ? "2026-11-04" : null));
    dernier.r = dernier.b.map((_, i) => (i === 1 ? 2 : i === 2 ? 1 : 0));
    dernier.q = dernier.b.map((_, i) => (i === 1 ? "2026-10-27" : i === 2 ? "2026-10-28" : null));
    dernier.x = dernier.b.map((_, i) => (i === 0 ? 2 : 0));
    dernier.d = dernier.b.map((_, i) => (i === 1 ? null : "2026-09-15"));
    dernier.s = dernier.b.map((_, i) => (i === 0 ? "2026-09-29" : null));
  }
  // La séance ouverte : son identité, son compteur, son plan à cinq nombres
  // (15 minutes, un paquet obligé de 10 étoiles, 3 étapes de la carte), et ce
  // qu'elle a fait (dix nombres, les plus grands) ; le journal des 60 séances
  // (onze listes, les plus grands nombres : le pire cas pour la taille).
  // Ses parts (correctif K1) : huit onglets, onze nombres chacun (la source,
  // puis ses dix comptes), les plus grands — `j` en est la somme, bornée.
  const plein = [999, 999, 999, 999, 5400, 99, 999, 999, 999, 999];
  p.seance = {jour: "2026-10-28", etape: 2, n: 60, i: 9999, g: 9999, p: [1, 15, 1, 10, 3], j: plein,
    parts: [].concat(...Array.from({length: 8}, (_, i) => [9992 + i, ...plein]))};
  p.seances = Array.from({length: PARCOURS.SEUILS.seance.garder}, (_, i) => PARCOURS.ajouterJours("2026-09-01", Math.floor(i / 2)));
  const garder = PARCOURS.SEUILS.seance.garder;
  p.journal = {calculs: Array(garder).fill(999), justes: Array(garder).fill(999), nouveautes: Array(garder).fill(99),
    prouvees: Array(garder).fill(999), rouges: Array(garder).fill(999), minutes: Array(garder).fill(90),
    // Le numéro de chaque séance (les plus grands, le pire cas).
    numero: Array.from({length: garder}, (_, i) => 999999 - i),
    seuls: Array(garder).fill(999), seulsJustes: Array(garder).fill(999), tests: Array(garder).fill(999), testsRates: Array(garder).fill(999)};
  // Lot K1b : six étages. Trois ceintures gagnées, trois pas encore (une
  // date, puis null : le serveur doit garder les null à leur place) ; trois
  // tests de ceinture joués, pas à la suite ; un remplissage gardé.
  p.ceintures = ["2026-10-02", "2026-10-08", "2026-10-20", null, null, null];
  p.paliers = ["2026-10-01", null, "2026-10-19", "2026-10-21", null, null];
  p.quarts = [0, 0, 0, 1, 2, 3];
  // Une séance dont rien n'est connu : -1 partout, gardé par le filtre.
  Object.keys(p.journal).forEach(champ => { p.journal[champ][0] = -1; });
  p.jours = Array.from({length: PARCOURS.SEUILS.jours.garder}, (_, i) => PARCOURS.ajouterJours("2026-10-15", i));
  return PARCOURS.normaliserParcours(p, {aujourdhui: JOUR});
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
