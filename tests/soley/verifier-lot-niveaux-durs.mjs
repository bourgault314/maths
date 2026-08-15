// Preuve du lot « des niveaux qui résistent » (15/08/2026) : la refonte de
// difficulté ne touche QUE les 11 niveaux annoncés, et rien de ce qui fait la
// mémoire des joueurs ne bouge.
//   - 69 niveaux, mêmes noms, MÊME ORDRE : la clé de sauvegarde est `monde:nom`,
//     donc aucune progression d'élève n'est perdue ;
//   - CALC, COURS, WORLDS, FRW strictement intactes ;
//   - 11 niveaux redessinés (7 canne + 4 lagon), 58 intacts à l'octet ;
//   - fruits 145 → 142 : déplacés sur des cases exigeantes, pas multipliés.
//
//   node tests/soley/verifier-lot-niveaux-durs.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : 0c276e3b (dernier main avant le lot). Outil de
// migration : il documente CE lot ; toute évolution ultérieure de levels.js le
// fera échouer légitimement (d'où : pas *.test.mjs).
//
// Il APPARIE PAR NOM, jamais par index — leçon du lot canne, où l'insertion de
// 8 niveaux en position 9 avait fait crier au loup l'outil du lot précédent, qui
// comparait `avant.LV[k]` à `apres.LV[k]`. Et il est écrit HORS du lot qu'il
// juge : un patch prouvé par ses propres outils ne prouve rien.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "0c276e3b";
const CHEMIN = "outils/club_maths/soley/js/levels.js";

const charger = (source) => {
  const ctx = vm.createContext({});
  vm.runInContext(source, ctx);
  // Les tableaux d'un autre realm échouent deepStrictEqual : on sort du JSON.
  return JSON.parse(vm.runInContext("JSON.stringify({LV, CALC, WORLDS, FRW, COURS})", ctx));
};
const avant = charger(execFileSync("git", ["show", `${REF}:${CHEMIN}`],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 }));
const apres = charger(readFileSync(resolve(racine, CHEMIN), "utf8").replace(/\r\n/g, "\n"));

let echecs = 0;
const verif = (ok, message) => {
  console.log(`${ok ? "OK " : "ÉCHEC"} ${message}`);
  if (!ok) echecs++;
};
const j = JSON.stringify;
const cle = (l) => `${l.w}:${l.name}`;

// Les 11 niveaux que le lot s'autorise à redessiner (RAPPORT-ESSAI-NIVEAUX-DURS.md
// §4, SPEC-MONDE-CANNE.md §8). « Le letchi difficile » et « Le tour du lagon » n'y
// sont PAS : décisions explicites de les laisser tels quels.
const REDESSINES = [
  "canne:Premier coup de sabre",
  "canne:La part perdue devient le trésor",
  "canne:La croisée des rayons",
  "canne:Le tour du champ",
  "canne:Le grand tri",
  "canne:La chambre close",
  "canne:Les deux chemins du sixième",
  "lagon:Zigzag dans les roches",
  "lagon:La part perdue",
  "lagon:La moitié de la moitié",
  "lagon:Quarts en croix",
];

// 1. L'inventaire : rien n'apparaît, rien ne disparaît, rien ne se déplace.
verif(avant.LV.length === 69 && apres.LV.length === 69,
  `69 niveaux avant et après (vu ${avant.LV.length} → ${apres.LV.length})`);
const clesAvant = avant.LV.map(cle);
const clesApres = apres.LV.map(cle);
verif(j(clesAvant) === j(clesApres),
  "les 69 clés monde:nom sont les mêmes, dans le même ordre (sauvegardes intactes)");

const parCle = new Map(avant.LV.map((l) => [cle(l), l]));
const apresParCle = new Map(apres.LV.map((l) => [cle(l), l]));

// 2. Les tables annexes ne sont pas du ressort d'un lot de difficulté.
for (const table of ["CALC", "COURS", "WORLDS", "FRW"]) {
  verif(j(avant[table]) === j(apres[table]), `${table} strictement intacte`);
}

// 3. Exactement les 11 niveaux annoncés bougent — ni plus, ni moins.
const modifies = clesAvant.filter((k) => j(parCle.get(k)) !== j(apresParCle.get(k)));
const horsListe = modifies.filter((k) => !REDESSINES.includes(k));
const oublies = REDESSINES.filter((k) => !modifies.includes(k));
verif(horsListe.length === 0,
  `aucun niveau modifié hors de la liste du lot${horsListe.length ? " : " + horsListe.join(" · ") : ""}`);
verif(oublies.length === 0,
  `les 11 niveaux annoncés sont bien redessinés${oublies.length ? " (manquent : " + oublies.join(" · ") + ")" : ""}`);
verif(clesAvant.length - modifies.length === 58,
  `58 niveaux intacts à l'octet (vu ${clesAvant.length - modifies.length})`);

// 4. Les trois intouchables, nommément (décisions du 15/08).
for (const k of ["canne:Le letchi difficile", "lagon:Le tour du lagon", "lagon:Premier rayon"]) {
  verif(j(parCle.get(k)) === j(apresParCle.get(k)), `« ${k} » intact à l'octet`);
}

// 5. Un lot de difficulté ne touche pas au texte des cibles ni aux notions :
//    on liste les champs qui bougent, et on refuse tout champ inattendu.
const AUTORISES = new Set([
  "cols", "rows", "suns", "targets", "rocks", "fruits", "tools",
  "sol", "solMin", "solB", "sub", "hint",
]);
const champsVus = new Set();
for (const k of modifies) {
  const a = parCle.get(k), b = apresParCle.get(k);
  for (const c of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (j(a[c]) !== j(b[c])) champsVus.add(c);
  }
}
const inattendus = [...champsVus].filter((c) => !AUTORISES.has(c));
verif(inattendus.length === 0,
  `aucun champ inattendu modifié${inattendus.length ? " : " + inattendus.join(", ") : ""} ` +
  `(vus : ${[...champsVus].sort().join(", ")})`);
verif(!champsVus.has("name") && !champsVus.has("w") && !champsVus.has("dec"),
  "ni name, ni w, ni dec : aucun renommage, aucun déménagement, aucune découverte créée");

// 6. Les fruits ont été DÉPLACÉS, pas multipliés.
const fruits = (M) => M.LV.reduce((s, l) => s + (l.fruits ? l.fruits.length : 0), 0);
verif(fruits(avant) === 145 && fruits(apres) === 142,
  `fruits 145 → 142 (vu ${fruits(avant)} → ${fruits(apres)})`);
verif(apres.LV.every((l) => (l.fruits || []).length <= (parCle.get(cle(l)).fruits || []).length + 1),
  "aucun niveau ne gagne plus d'un fruit");

// 7. Le contrat de la refonte : tout niveau redessiné porte un solMin, qui est un
//    AUTRE plan que sa solution de référence et ne coûte jamais plus cher.
//    Attention : « plus court » serait trop exigeant — SPEC-MONDE-CANNE.md §7 tient
//    le solMin À NOMBRE DE PIÈCES ÉGAL (gagner par le CHOIX, pas par l'économie)
//    pour « la variante la plus fine du fruit mérité ». Les 4 niveaux du lagon
//    retouchés sont dans ce cas. Que le fruit ne s'y ramasse pas, c'est le contrôle
//    P2 de la batterie qui le prouve, pas cet outil.
for (const k of REDESSINES) {
  const b = apresParCle.get(k);
  const ok = Array.isArray(b.solMin) && b.solMin.length > 0
    && b.solMin.length <= b.sol.length && j(b.solMin) !== j(b.sol);
  verif(ok, `« ${k} » : solMin (${b.solMin ? b.solMin.length : "absent"}) ≠ sol (${b.sol.length}), ` +
    `et pas plus cher`);
}

// 8. Le seuil de rejet du lot : plus aucun niveau redessiné ne se gagne en 1 ou 2
//    pièces — c'était le défaut mesuré (7 des 8 niveaux de la canne). Le rapport
//    écrit deux fois « 3 pièces ou moins rejeté », mais cinq des onze niveaux qu'il
//    livre sont à 3 : la règle réellement appliquée est « 2 ou moins ». C'est celle
//    qu'on contrôle ici, et celle qui est gravée dans SOLEY.md §6.
const prof = (l) => (l.solMin || l.sol).length;
console.log("\nprofondeur du plan minimal, par niveau redessiné :");
for (const k of REDESSINES) {
  console.log(`   ${prof(parCle.get(k))} → ${prof(apresParCle.get(k))}   ${k}`);
}
const courts = REDESSINES.filter((k) => prof(apresParCle.get(k)) < 3);
verif(courts.length === 0,
  `aucun niveau redessiné ne se gagne en moins de 3 pièces${courts.length ? " : " + courts.join(" · ") : ""}`);
// Deux niveaux PERDENT de la profondeur, exprès : c'étaient des couloirs, où la
// longueur tenait lieu de recherche (« La chambre close » 9 poses dictées, λ = 2,9).
const baisse = REDESSINES.filter((k) => prof(apresParCle.get(k)) < prof(parCle.get(k)));
verif(baisse.length === 2 && baisse.every((k) => k === "canne:Le tour du champ" || k === "canne:La chambre close"),
  `les deux seules baisses de profondeur sont les couloirs assumés (vu : ${baisse.join(" · ") || "aucune"})`);

console.log(`\n${echecs === 0 ? "TOUT VERT — le lot ne touche que ce qu'il annonce." : `${echecs} ÉCHEC(S)`}`);
process.exit(echecs === 0 ? 0 : 1);
