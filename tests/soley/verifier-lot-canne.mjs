// Preuve du lot « refonte des niveaux » (août 2026) : les 61 niveaux en ligne
// restent joués À L'IDENTIQUE, hors retouches autorisées par SPEC-MONDE-CANNE.md :
//   - 8 niveaux NOUVEAUX (monde « canne » inséré entre lagon et forêt) ;
//   - 5 niveaux du lagon retouchés (Zigzag, La part perdue, La moitié de la
//     moitié, Quarts en croix, Le tour du lagon) : SEULS fruits/tools/sol
//     changent (+ champ solMin additif) — noms, grilles, cibles, roches,
//     consignes, hint : intacts à l'octet ;
//   - champ solMin additif sur les niveaux couverts par le contrôle P2 ;
//   - WORLDS gagne l'entrée canne, FRW l'entrée canne:'letchi', rien d'autre.
//
//   node tests/soley/verifier-lot-canne.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : ae8a4657 (dernier main avant le lot). Outil de
// migration : il documente CE lot ; toute évolution ultérieure de levels.js le
// fera échouer légitimement (d'où : pas *.test.mjs).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "ae8a4657";
const CHEMIN = "outils/club_maths/soley/js/levels.js";

const charger = (source) => {
  const ctx = vm.createContext({});
  vm.runInContext(source, ctx);
  return vm.runInContext("({LV, CALC, WORLDS, FRW, COURS})", ctx);
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

// 1. 61 → 69 : le monde canne (8 niveaux) inséré d'un bloc entre lagon et forêt ;
//    aucun niveau historique déplacé, renommé ni supprimé.
verif(avant.LV.length === 61 && apres.LV.length === 69, "69 niveaux (61 + les 8 de la canne)");
const canne = apres.LV.filter(l => l.w === "canne");
verif(canne.length === 8 && apres.LV.findIndex(l => l.w === "canne") === 9
  && apres.LV.slice(9, 17).every(l => l.w === "canne"),
  "les 8 niveaux de la canne forment le bloc 9-16, juste après le lagon");
const restants = apres.LV.filter(l => l.w !== "canne");
verif(j(avant.LV.map(l => l.w + ":" + l.name)) === j(restants.map(l => l.w + ":" + l.name)),
  "les 61 clés de sauvegarde historiques sont inchangées, dans le même ordre");

// 2. Lagon : les 5 retouches ne touchent QUE fruits/tools/sol (+ solMin additif).
const RETOUCHES = new Set(["Zigzag dans les roches", "La part perdue",
  "La moitié de la moitié", "Quarts en croix", "Le tour du lagon"]);
const sansChamps = (l) => {
  const { fruits, tools, sol, solMin, solB, ...reste } = l;
  return reste;
};
avant.LV.forEach((vieux, i) => {
  const neuf = restants[i];
  if (RETOUCHES.has(vieux.name) && vieux.w === "lagon") {
    verif(j(sansChamps(vieux)) === j(sansChamps(neuf)),
      `${vieux.name} : hors fruits/tools/sol, intact à l'octet`);
    verif(vieux.fruits.length === neuf.fruits.length,
      `${vieux.name} : même nombre de fruits (déplacés, pas ajoutés)`);
  } else {
    verif(j(vieux) === j(neuf), `${vieux.name} : intact à l'octet`);
  }
});

// 3. Le contrôle P2 est couvert : 13 solMin (5 lagon retouchés + 8 canne).
verif(apres.LV.filter(l => l.solMin).length === 13, "13 niveaux portent un solMin");

// 4. WORLDS/FRW : seule l'entrée canne s'ajoute ; CALC et COURS inchangés.
verif(apres.WORLDS.length === avant.WORLDS.length + 1
  && apres.WORLDS[1].id === "canne"
  && j(avant.WORLDS) === j(apres.WORLDS.filter(w => w.id !== "canne")),
  "WORLDS : la canne insérée en 2e position, les 8 mondes historiques intacts");
verif(apres.FRW.canne === "letchi"
  && j(avant.FRW) === j(Object.fromEntries(Object.entries(apres.FRW).filter(([k]) => k !== "canne"))),
  "FRW : entrée canne ajoutée, le reste intact");
verif(j(avant.CALC) === j(apres.CALC), "table CALC inchangée");
verif(j(avant.COURS) === j(apres.COURS), "table COURS inchangée");

console.log(echecs
  ? `\n${echecs} vérification(s) en échec.`
  : "\nPreuve faite : les 61 niveaux en ligne restent intacts, la canne s'ajoute, le lagon n'échange que ses boîtes, fruits et solutions.");
if (echecs) process.exit(1);
