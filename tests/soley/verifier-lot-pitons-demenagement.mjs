// Preuve du lot PITONS-2 « le monde déménage en position 3 » (17/08/2026).
//
// La décision du 16/08, exécutée : cinq des sept niveaux des pitons n'ont jamais
// eu besoin de la lentille — le monde passe DEVANT la forêt, et ses deux niveaux
// à lentille (« La passe étroite », « Le tamis ») rentrent chez elle. Ce que ce
// script prouve :
//   - l'ordre des mondes : lagon · canne · pitons · forêt · volcan · soleils ·
//     marché · tunnels · Mafate — et RIEN d'autre ne bouge dans WORLDS (le palier
//     des pitons passe à 6e-5e, décision de Gwenael : « la comparaison en sixième ») ;
//   - exactement DEUX clés de sauvegarde changent (pitons:→foret:), le coût
//     annoncé ; toutes les autres sont identiques ;
//   - trois contenus changent seulement : les w/sub des deux déménagés, et la
//     consigne de « Quel rayon passe ? » qui reçoit le « Nouveau : la passe ! »
//     (l'avertissement du lot H, réglé le jour du déménagement) ;
//   - aucun niveau des pitons ne contient de lentille ; la forêt va de Recoller
//     à « Deux tiers » (la somme s'APPREND) puis « La passe étroite » (elle
//     s'EXIGE — doctrine du 18/08 : on ne force jamais une addition avant de
//     l'avoir apprise) et finit sur « Le tamis », son plus dur ;
//   - les seuils suivent : [0, 7, 6, 5, 7, 5, 5, 4, 5].
//
//   node tests/soley/verifier-lot-pitons-demenagement.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : HEAD~1 — ce lot arrive juste après le lot pitons-1, sur
// la même branche. Après les fusions (SQUASH), passer le SHA de main d'avant le
// lot. Outil daté, hors *.test.mjs, pas en CI.
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
const DEMENAGES = ["La passe étroite", "Le tamis"];

/* ---------- 1. WORLDS : l'ordre change, rien d'autre ---------- */
verif(j(apres.WORLDS.map((w) => w.id)) === j(
  ["lagon", "canne", "pitons", "foret", "volcan", "soleils", "marche", "tunnels", "mafate"]),
  "l'ordre des mondes : les pitons en position 3");
const wAvant = new Map(avant.WORLDS.map((w) => [w.id, w]));
const wBouges = apres.WORLDS.filter((w) => j(wAvant.get(w.id)) !== j(w)).map((w) => w.id);
verif(j(wBouges) === j(["pitons"]) &&
  j({ ...wAvant.get("pitons"), pal: 0 }) === j({ ...apres.WORLDS.find((w) => w.id === "pitons"), pal: 0 }) &&
  apres.WORLDS.find((w) => w.id === "pitons").pal === "6e-5e",
  "dans WORLDS, seul le palier des pitons change (5e-4e → 6e-5e)");
verif(j(avant.FRW) === j(apres.FRW) && j(avant.COURS) === j(apres.COURS) && j(avant.CALC) === j(apres.CALC),
  "FRW, COURS et CALC intacts à l'octet");

/* ---------- 2. Les clés : deux changent, le coût annoncé ---------- */
verif(avant.LV.length === 73 && apres.LV.length === 73, "73 niveaux avant, 73 après");
const clesAvant = new Set(avant.LV.map(cle)), clesApres = new Set(apres.LV.map(cle));
const perdues = [...clesAvant].filter((k) => !clesApres.has(k));
const gagnees = [...clesApres].filter((k) => !clesAvant.has(k));
verif(j(perdues.sort()) === j(DEMENAGES.map((n) => `pitons:${n}`).sort())
  && j(gagnees.sort()) === j(DEMENAGES.map((n) => `foret:${n}`).sort()),
  "exactement DEUX clés changent : pitons:→foret: pour les deux déménagés",
  `perdues [${perdues}], gagnées [${gagnees}]`);

/* ---------- 3. Les contenus : w des déménagés, trois subs, rien d'autre ---------- */
const parNom = new Map(avant.LV.map((l) => [l.name, l]));
const diffs = apres.LV.filter((l) => j(parNom.get(l.name)) !== j(l)).map((l) => l.name);
verif(j(diffs.sort()) === j([...DEMENAGES, "Quel rayon passe ?"].sort()),
  "trois niveaux changent de contenu, et seulement eux", diffs.join(", "));
for (const n of DEMENAGES) {
  const a = parNom.get(n), b = apres.LV.find((l) => l.name === n);
  verif(j({ ...a, w: 0, sub: 0 }) === j({ ...b, w: 0, sub: 0 }),
    `${n} : plateau, boîte, sol identiques à l'octet (seuls w et la consigne bougent)`);
}
const qrpA = parNom.get("Quel rayon passe ?"), qrpB = apres.LV.find((l) => l.name === "Quel rayon passe ?");
verif(j({ ...qrpA, sub: 0 }) === j({ ...qrpB, sub: 0 }) && /^Nouveau : la passe !/.test(qrpB.sub),
  "« Quel rayon passe ? » : seule la consigne change, elle annonce la première passe du jeu");
verif(!/Nouveau/.test(apres.LV.find((l) => l.name === "La passe étroite").sub)
  && /lentille/.test(apres.LV.find((l) => l.name === "La passe étroite").sub),
  "« La passe étroite » ne dit plus « Nouveau » et annonce la lentille");

/* ---------- 4. L'ordre pédagogique tient ---------- */
verif(apres.LV.filter((l) => l.w === "pitons").every((l) =>
  !l.tools.some((t) => t.t === "m") && !(l.fixed || []).some(([p]) => p.t === "m")),
  "aucune lentille aux pitons : le monde 3 ne devance pas la forêt");
const foret = apres.LV.filter((l) => l.w === "foret").map((l) => l.name);
verif(foret[0] === "Recoller les morceaux" && foret[1] === "Deux tiers"
  && foret[2] === "La passe étroite" && foret[foret.length - 1] === "Le tamis" && foret.length === 10,
  "la forêt : Recoller → Deux tiers (la somme s'apprend) → La passe étroite (elle s'exige) … et Le tamis ferme");
const gatesAvantPitons = apres.LV.slice(0, apres.LV.findIndex((l) => l.w === "pitons"))
  .filter((l) => (l.gates || []).length).map((l) => l.name);
verif(gatesAvantPitons.length === 0,
  "aucune passe avant les pitons : « Nouveau : la passe ! » dit vrai");

/* ---------- 5. Le moteur suit : seuils et lentille obligatoire ---------- */
const ctx = createGameContext();
const seuils = JSON.parse(vm.runInContext("JSON.stringify(WORLDS.map((w,i)=>seuilMonde(i)))", ctx));
verif(j(seuils) === j([0, 7, 6, 5, 7, 5, 5, 4, 5]), "seuils recalculés sur le nouvel ordre", j(seuils));
const sansM = JSON.parse(vm.runInContext(`(() => {
  const l = LV.find(x => x.name === "La passe étroite");
  const v = { ...l, tools: l.tools.filter(t => t.t !== 'm'), sol: [], name: l.name + " [sans m]" };
  delete v.solMin;
  LV.push(v);
  const e = SOLVEUR.mesurer(LV.length - 1, { budget: 400000, libre: false }).eclaire;
  LV.pop();
  return JSON.stringify({ G: e.G, E: e.E, debord: e.debord });
})()`, ctx));
verif(sansM.G === 0 && !sansM.debord,
  "« La passe étroite » sans lentille : AUCUNE victoire (espace complet) — première obligation du jeu",
  `E = ${sansM.E}`);
const rejoue = JSON.parse(vm.runInContext(`(() => {
  const out = {};
  for (const nom of ${j(DEMENAGES)}) {
    const i = LV.findIndex(x => x.name === nom);
    cur = i; state.placed = {};
    for (const [ti, x, y] of LV[i].sol) state.placed[x + "," + y] = { def: LV[i].tools[ti], ti };
    const r = simulate();
    out[nom] = r.win && r.fruits.size === LV[i].fruits.length;
  }
  return JSON.stringify(out);
})()`, ctx));
verif(Object.values(rejoue).every(Boolean), "les sol des deux déménagés gagnent et ramassent tout, comme avant");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT VERT");
process.exit(echecs ? 1 : 0);
