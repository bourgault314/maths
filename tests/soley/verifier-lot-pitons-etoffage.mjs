// Preuve du lot PITONS-1 « le monde s'étoffe avant de déménager » (17/08/2026).
//
// Le monde des pitons était le plus plat du jeu (médiane R = 100, 6 fruits cadeaux
// sur 7 niveaux — mesure du 17/08). Ce lot l'étoffe SANS le déménager :
//   - « Le sentier des écritures » entre (R = 289 : les passes refusent la moitié
//     plausible, la part écartée file au fruit puis meurt) ;
//   - « La crête des passes » entre (R = 513 : sans ÷3 aucune victoire ; l'endroit
//     de la coupe décide du fruit) ;
//   - les fruits du « Col des comparaisons » (grand tour nord) et d'« Égal ou
//     pas ? » (branche est, roche (7,4) ouverte) se méritent, un ananas facile
//     GARDÉ sur chacun ;
//   - « Le tamis » ferme le monde (position seule, clé intacte) ;
//   - RÈGLE DE GWENAEL (17/08) : un cours ne montre QUE ce que SON niveau affiche.
//     Le cours `equivalence` (niveau 1) se resserre sur 1/2 = 2/4, et le cours
//     `ecritures` entre sur « Trois écritures » avec 3/6 et 2/8 — les écritures
//     que ce niveau affiche. Le test permanent des bandes couvre le nouveau cours.
//
//   node tests/soley/verifier-lot-pitons-etoffage.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : origin/main — ce vérificateur est fait pour tourner JUSTE
// avant l'ouverture de la PR, quand origin/main est encore l'état d'avant le lot
// (le lot vérité fusionné compris). Plus tard dans l'histoire, passer le SHA du
// main d'avant le lot. Outil daté, hors *.test.mjs, pas en CI. Les PR de ce dépôt
// sont fusionnées en SQUASH : la référence est un commit de `main`, jamais de branche.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "origin/main";
const CHEMIN = "outils/club_maths/soley/js/levels.js";

const charger = (source) => {
  const ctx = vm.createContext({});
  vm.runInContext(source, ctx);
  return JSON.parse(vm.runInContext("JSON.stringify({LV, CALC, WORLDS, FRW, COURS})", ctx));
};
const gitShow = (c) => execFileSync("git", ["show", `${REF}:${c}`],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 });
const avant = charger(gitShow(CHEMIN));
const apres = charger(readFileSync(resolve(racine, CHEMIN), "utf8").replace(/\r\n/g, "\n"));

let echecs = 0;
const verif = (ok, m, d = "") => { console.log(`${ok ? "OK " : "ÉCHEC"} ${m}${d ? ` — ${d}` : ""}`); if (!ok) echecs++; };
const j = JSON.stringify;
const cle = (l) => `${l.w}:${l.name}`;
const NEUFS = ["pitons:Le sentier des écritures", "pitons:La crête des passes"];
const RETOUCHES = new Set(["pitons:Le col des comparaisons", "pitons:Égal ou pas ?"]);

/* ---------- 1. Le périmètre ---------- */
verif(avant.LV.length === 71 && apres.LV.length === 73, "71 niveaux avant, 73 après",
  `${avant.LV.length} → ${apres.LV.length}`);
const clesAvant = avant.LV.map(cle), clesApres = apres.LV.map(cle);
verif(NEUFS.every((k) => !clesAvant.includes(k) && clesApres.includes(k)),
  "les deux niveaux neufs entrent, et ils n'existaient pas");
verif(j(clesApres.filter((k) => !NEUFS.includes(k) && !k.startsWith("pitons:")))
  === j(clesAvant.filter((k) => !k.startsWith("pitons:"))),
  "hors pitons, les clés de sauvegarde sont identiques, dans le même ordre");
verif(j([...clesApres].sort()) === j([...clesAvant, ...NEUFS].sort()),
  "aucune clé existante ne disparaît ni ne change (zéro renommage)");
verif(j(apres.LV.filter((l) => l.w === "pitons").map((l) => l.name)) === j([
  "C'est pareil !", "Trois écritures", "La passe étroite", "Quel rayon passe ?",
  "Le sentier des écritures", "Le col des comparaisons", "La crête des passes",
  "Égal ou pas ?", "Le tamis"]),
  "l'ordre des pitons est le nouvel escalier (5·10·100·43·289·368·513·3979·30188)");

const parCle = new Map(avant.LV.map((l) => [cle(l), l]));
const bouges = apres.LV.filter((l) => !NEUFS.includes(cle(l)) && j(parCle.get(cle(l))) !== j(l)).map(cle);
verif(bouges.length === 3 && bouges.every((k) => RETOUCHES.has(k) || k === "pitons:Trois écritures"),
  "SEULS le col, « Égal ou pas ? » et « Trois écritures » changent (Le tamis ne bouge que de position)",
  bouges.join(", "));
const te = apres.LV.find((l) => cle(l) === "pitons:Trois écritures");
const teSans = { ...te }; delete teSans.cours;
verif(j(parCle.get("pitons:Trois écritures")) === j(teSans) && te.cours === "ecritures",
  "« Trois écritures » ne gagne que son champ cours:'ecritures', tout le reste à l'octet");
for (const bloc of ["WORLDS", "FRW"])
  verif(j(avant[bloc]) === j(apres[bloc]), `${bloc} intact à l'octet (le déménagement est le lot SUIVANT)`);
const cAv = Object.keys(avant.COURS), cAp = Object.keys(apres.COURS);
verif(j(cAp) === j([...cAv.slice(0, cAv.indexOf("comparaison")), "ecritures", ...cAv.slice(cAv.indexOf("comparaison"))])
  && cAv.filter((k) => k !== "equivalence").every((k) => j(avant.COURS[k]) === j(apres.COURS[k])),
  "COURS : `ecritures` entre avant `comparaison`, seule `equivalence` change (resserrée)");
verif(j(apres.COURS.equivalence.scene.parts.map((p) => p.f[1])) === j([2, 4])
  && j(apres.COURS.ecritures.scene.parts.map((p) => p.f[1])) === j([2, 6, 4, 8]),
  "le cours du 1 ne montre que 1/2 et 2/4 ; celui du 2 montre 3/6 et 2/8 (règle de Gwenael)");
const calcAvant = Object.keys(avant.CALC), calcApres = Object.keys(apres.CALC);
verif(calcApres.length === calcAvant.length + 2
  && calcAvant.every((k) => j(avant.CALC[k]) === j(apres.CALC[k]))
  && apres.CALC["Le sentier des écritures"] && apres.CALC["La crête des passes"],
  "CALC : les 53 cartes existantes intactes, les 2 nouvelles entrent");

/* ---------- 2. Les retouches gardent la victoire et libèrent les fruits ---------- */
const ctx = createGameContext();
const rejoue = (nomNiveau, plan) => JSON.parse(vm.runInContext(`(() => {
  const i = LV.findIndex(x => x.name === ${j(nomNiveau)});
  cur = i; state.placed = {};
  for (const [ti, x, y] of LV[i].${plan}) state.placed[x + "," + y] = { def: LV[i].tools[ti], ti };
  const r = simulate();
  return JSON.stringify({ win: r.win, fruits: r.fruits.size });
})()`, ctx));

const attendus = [
  ["Le sentier des écritures", 1], ["La crête des passes", 2],
  ["Le col des comparaisons", 3], ["Égal ou pas ?", 2]];
for (const [nom, nf] of attendus) {
  const sol = rejoue(nom, "sol"), min = rejoue(nom, "solMin");
  verif(sol.win && sol.fruits === nf, `${nom} : la sol gagne et ramasse ${nf}/${nf} fruits`,
    `win=${sol.win}, fruits=${sol.fruits}`);
  verif(min.win && min.fruits < nf, `${nom} : la solMin gagne SANS tout ramasser`,
    `win=${min.win}, fruits=${min.fruits}`);
}
const colA = parCle.get("pitons:Le col des comparaisons");
const colB = apres.LV.find((l) => cle(l) === "pitons:Le col des comparaisons");
verif(j(colA.targets) === j(colB.targets) && j(colA.gates) === j(colB.gates)
  && j(colA.rocks) === j(colB.rocks) && colB.fruits.length === 3
  && j(colB.fruits.slice(1)) === j([[4, 4], [2, 5]]),
  "le col : cibles, passes, roches intacts ; 2 ananas faciles gardés, celui du haut part au grand tour");
const eopA = parCle.get("pitons:Égal ou pas ?");
const eopB = apres.LV.find((l) => cle(l) === "pitons:Égal ou pas ?");
verif(j(eopA.targets) === j(eopB.targets) && j(eopA.gates) === j(eopB.gates)
  && eopA.rocks.length === 6 && eopB.rocks.length === 5
  && !eopB.rocks.some(([x, y]) => x === 7 && y === 4) && eopB.fruits.length === 2,
  "« Égal ou pas ? » : cibles et passes intactes, la roche (7,4) s'ouvre pour la branche est");

/* ---------- 3. Les mesures qui fondent le lot ---------- */
const mesure = (nomNiveau, sansType) => JSON.parse(vm.runInContext(`(() => {
  const l = LV.find(x => x.name === ${j(nomNiveau)});
  const v = { ...l, tools: l.tools.filter(t => t.t !== ${j(sansType)}), sol: [], name: l.name + " [sans ${sansType}]" };
  delete v.solMin;
  LV.push(v);
  const e = SOLVEUR.mesurer(LV.length - 1, { budget: 400000, libre: false }).eclaire;
  LV.pop();
  return JSON.stringify({ G: e.G, E: e.E, debord: e.debord });
})()`, ctx));
const creteSans = mesure("La crête des passes", "s3");
verif(creteSans.G === 0 && !creteSans.debord,
  "la crête sans ÷3 : AUCUNE victoire, espace épuisé — la notion est forcée", `E = ${creteSans.E}`);
const nu = JSON.parse(vm.runInContext(`(() => {
  const out = {};
  for (const nom of ["Le sentier des écritures", "La crête des passes"]) {
    cur = LV.findIndex(x => x.name === nom); state.placed = {};
    out[nom] = simulate().win;
  }
  return JSON.stringify(out);
})()`, ctx));
verif(Object.values(nu).every((w) => w === false),
  "aucun des deux niveaux neufs ne se gagne sans poser de pièce");

/* ---------- 4. Les seuils suivent le compte ---------- */
const seuils = JSON.parse(vm.runInContext(
  "JSON.stringify(WORLDS.map((w,i)=>seuilMonde(i)))", ctx));
verif(j(seuils) === j([0, 7, 6, 5, 5, 6, 5, 4, 5]),
  "seuils recalculés : les soleils s'ouvrent à 6 réussites des pitons (⌈5×9/8⌉)", j(seuils));

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT VERT");
process.exit(echecs ? 1 : 0);
