// Preuve du lot CUEILLETTE « le cours qui célèbre le geste accompli » (18/08/2026).
//
// Décision de Gwenael : la première addition ne se FORCE pas, elle s'HONORE.
// Sur « Recoller les morceaux », gagner reste libre (contourner suffit) — mais les
// deux goyaviers exigent la lentille (mesuré au lot vérité : Gtout = 0 sans elle,
// espace complet). Quand l'élève les cueille, il vient d'additionner de lui-même :
// le cours « Recoller deux moitiés » apparaît À CE MOMENT-LÀ.
//
// Ce que ce script prouve :
//   - le périmètre : levels.js (le champ + le cours), engine.js (le déclencheur),
//     ui.js (le bouton « Revoir » gardé par le mérite), tests — rien d'autre ;
//   - « Recoller les morceaux » : SEUL le champ coursFruits s'ajoute, tout le
//     reste à l'octet ; le cours `moities` existe, scène somme 1/2 + 1/2 ;
//   - la mécanique de fond n'a pas bougé : sans lentille on gagne toujours (196
//     façons) et on ne cueille toujours pas les deux goyaviers (Gtout = 0) ;
//   - le déclencheur exige la cueillette COMPLÈTE (motif du source, gardé aussi
//     en test permanent) ; T16 de la batterie navigateur montre le panneau.
//
//   node tests/soley/verifier-lot-cueillette.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : HEAD~1 (le lot arrive juste après pitons-2 sur la même
// branche). Après les fusions SQUASH, passer le SHA de main d'avant le lot.
// Outil daté, hors *.test.mjs, pas en CI.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "HEAD~1";
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

/* ---------- 1. Le périmètre des données ---------- */
verif(j(avant.LV.map(cle)) === j(apres.LV.map(cle)),
  "les 73 clés de sauvegarde sont identiques, dans le même ordre (rien ne bouge)");
const parCle = new Map(avant.LV.map((l) => [cle(l), l]));
const bouges = apres.LV.filter((l) => j(parCle.get(cle(l))) !== j(l)).map(cle);
verif(j(bouges) === j(["foret:Recoller les morceaux"]),
  "SEUL « Recoller les morceaux » change", bouges.join(", "));
const rec = apres.LV.find((l) => cle(l) === "foret:Recoller les morceaux");
const recSans = { ...rec }; delete recSans.coursFruits;
verif(j(parCle.get("foret:Recoller les morceaux")) === j(recSans) && rec.coursFruits === "moities",
  "il ne gagne que son champ coursFruits:'moities', tout le reste à l'octet");
for (const bloc of ["CALC", "WORLDS", "FRW"])
  verif(j(avant[bloc]) === j(apres[bloc]), `${bloc} intact à l'octet`);
const cAv = Object.keys(avant.COURS), cAp = Object.keys(apres.COURS);
verif(j(cAp) === j([...cAv, "moities"]) && cAv.every((k) => j(avant.COURS[k]) === j(apres.COURS[k])),
  "COURS : `moities` entre en dernier, les autres intacts à l'octet");
const m = apres.COURS.moities;
verif(m.titre === "Recoller deux moitiés" && j(m.scene) === j({ somme: [[1, 2], [1, 2]], unite: true })
  && m.carte && m.carte.eq === "1/2 + 1/2 = 1",
  "le cours dit le geste : scène somme 1/2 + 1/2, la bande de l'ENTIER au-dessus (retour de Gwenael)");

/* ---------- 2. La mécanique de fond n'a pas bougé ---------- */
const ctx = createGameContext();
const mesure = JSON.parse(vm.runInContext(`(() => {
  const l = LV.find(x => x.name === "Recoller les morceaux");
  const v = { ...l, tools: l.tools.filter(t => t.t !== 'm'), sol: [], name: l.name + " [sans m]" };
  delete v.solMin; delete v.coursFruits;
  LV.push(v);
  const e = SOLVEUR.mesurer(LV.length - 1, { budget: 400000, libre: false }).eclaire;
  LV.pop();
  return JSON.stringify({ G: e.G, Gtout: e.Gtout, E: e.E, debord: e.debord });
})()`, ctx));
verif(mesure.G > 0 && mesure.Gtout === 0 && !mesure.debord,
  "sans lentille : gagner reste libre, les deux goyaviers restent inaccessibles (espace complet)",
  `G = ${mesure.G}, Gtout = ${mesure.Gtout}, E = ${mesure.E}`);
const sol = JSON.parse(vm.runInContext(`(() => {
  const i = LV.findIndex(x => x.name === "Recoller les morceaux");
  cur = i; state.placed = {};
  for (const [ti, x, y] of LV[i].sol) state.placed[x + "," + y] = { def: LV[i].tools[ti], ti };
  const r = simulate();
  return JSON.stringify({ win: r.win, fruits: r.fruits.size });
})()`, ctx));
verif(sol.win && sol.fruits === 2, "la sol de référence gagne et cueille les 2 goyaviers (elle déclenchera le cours)",
  `win=${sol.win}, fruits=${sol.fruits}`);

/* ---------- 3. Le déclencheur et sa garde ---------- */
const engine = readFileSync(resolve(racine, "outils/club_maths/soley/js/engine.js"), "utf8");
const ui = readFileSync(resolve(racine, "outils/club_maths/soley/js/ui.js"), "utf8");
verif(/L\.coursFruits&&L\.fruits\.length&&sim\.fruits\.size>=L\.fruits\.length/.test(engine),
  "engine : le cours ne se déclenche qu'à la cueillette COMPLÈTE");
verif(/coursFruits&&\(save\.cours\[/.test(ui),
  "ui : « Revoir le cours » ne l'offre qu'une fois mérité");
const html1 = readFileSync(resolve(racine, "outils/club_maths/soley.html"), "utf8");
const html2 = readFileSync(resolve(racine, "outils/club_maths/soley-atelier.html"), "utf8");
verif(html1.includes("courssur") && html2.includes("courssur"),
  "le panneau du cours existe dans les DEUX pages qui chargent le module (règle §6)");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT VERT");
process.exit(echecs ? 1 : 0);
