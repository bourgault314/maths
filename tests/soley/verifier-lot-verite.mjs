// Preuve du lot VÉRITÉ « quatre niveaux cessent de mentir » (17/08/2026).
//
// Trois mensonges mesurés, trois réparations — et pas un renommage (les clés de
// sauvegarde `monde:nom` sont sacrées) :
//
//   1. « Recoller les morceaux » (forêt 1) promettait la lentille pour GAGNER.
//      Faux : une case 1/1 sous un soleil 1 ne la force jamais (règle §5.16),
//      196 victoires en 3 pièces sans elle. MAIS — mesuré ici dans l'espace
//      éclairé COMPLET — sans lentille, AUCUNE victoire ne ramasse les deux
//      goyaviers. La promesse était vraie une couche plus haut : la consigne
//      la déplace sur les fruits. Seule la phrase change, le plateau est intact.
//
//   2. « L'addition du marché » (marché 5) annonçait une addition que rien
//      n'obligeait : la rangée du soleil était libre jusqu'à la case 100 %
//      (R = 42, prof 2 — et le ×3 « piège » offrait 1/3 × 3 = 1). Cible
//      redessinée au solveur : un mur et deux passes 2/3 coupent le plateau.
//      Sans lentille, sans ×2 ou sans ÷3 : AUCUNE victoire, espaces épuisés
//      sans débordement. R = 4 250, Rtout = 113 886 — la couche ☀☀☀ flambe,
//      le ×3 tricheur sort de la boîte, solMin entre (premier hors lagon/canne).
//
//   3. « Le tour du lagon » et « La part perdue » (lagon 4-5) glissaient un ÷3
//      piège AVANT la découverte du tiers qui promet « Regarde la nouvelle
//      couleur ! » — et la consigne de « La part perdue » jure que « le prisme,
//      lui, coupe toujours en deux ». Les pièges deviennent des ÷2 d'orientation
//      trompeuse (R : 518→371, 1 907→1 091 — la résistance survit). La règle
//      passe en test PERMANENT dans tests/soley-public.test.mjs.
//
//   node tests/soley/verifier-lot-verite.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : 02f56216 (dernier main avant le lot — le lot H #409 et ses
// deux renommages sont DEDANS ; comparer à 590fc7b8 verrait 6 niveaux bouger, pas 4).
// Outil de migration daté, hors *.test.mjs, pas en CI. Les PR de ce dépôt sont
// fusionnées en SQUASH : la référence est un commit de `main`, jamais de branche.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "02f56216";
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
const TOUCHES = new Set(["lagon:Le tour du lagon", "lagon:La part perdue",
  "foret:Recoller les morceaux", "marche:L'addition du marché"]);

/* ---------- 1. Le périmètre : 4 niveaux, rien d'autre ---------- */
verif(avant.LV.length === 71 && apres.LV.length === 71, "71 niveaux avant, 71 après",
  `${avant.LV.length} → ${apres.LV.length}`);
verif(j(apres.LV.map(cle)) === j(avant.LV.map(cle)),
  "les 71 clés de sauvegarde sont les mêmes, dans le même ordre (aucun renommage)");
const parCle = new Map(avant.LV.map((l) => [cle(l), l]));
const bouges = apres.LV.filter((l) => j(parCle.get(cle(l))) !== j(l)).map(cle);
verif(bouges.length === 4 && bouges.every((k) => TOUCHES.has(k)),
  "SEULS les 4 niveaux du lot changent", bouges.join(", "));
for (const bloc of ["CALC", "WORLDS", "FRW", "COURS"])
  verif(j(avant[bloc]) === j(apres[bloc]), `${bloc} intact à l'octet`);

/* ---------- 2. Recoller les morceaux : la phrase, et la preuve de la phrase ---------- */
const recA = parCle.get("foret:Recoller les morceaux");
const recB = apres.LV.find((l) => cle(l) === "foret:Recoller les morceaux");
verif(j({ ...recA, sub: 0 }) === j({ ...recB, sub: 0 }),
  "Recoller : SEULE la consigne change (plateau, boîte, sol intacts à l'octet)");
verif(/goyaviers/.test(recB.sub) && /lentille : elle additionne deux rayons/.test(recB.sub),
  "la nouvelle consigne nomme les goyaviers et enseigne toujours la lentille");
verif(/Pour gagner, contourne/.test(recB.sub),
  "elle dit la vérité : gagner, c'est contourner");

const ctx = createGameContext();
const mesure = (nomNiveau, sansType, budget) => JSON.parse(vm.runInContext(`(() => {
  const l = LV.find(x => x.name === ${j(nomNiveau)});
  const v = { ...l, tools: l.tools.filter(t => t.t !== ${j(sansType)}), sol: [], name: l.name + " [sans ${sansType}]" };
  delete v.solMin;
  LV.push(v);
  const e = SOLVEUR.mesurer(LV.length - 1, { budget: ${budget}, libre: false }).eclaire;
  LV.pop();
  return JSON.stringify({ G: e.G, Gtout: e.Gtout, E: e.E, debord: e.debord });
})()`, ctx));

const recSansM = mesure("Recoller les morceaux", "m", 400000);
verif(recSansM.G > 0 && !recSansM.debord,
  "sans lentille, gagner reste possible (la consigne ne l'interdit pas)", `G = ${recSansM.G}`);
verif(recSansM.Gtout === 0 && !recSansM.debord,
  "sans lentille, AUCUNE victoire ne ramasse les deux goyaviers (espace complet)",
  `Gtout = ${recSansM.Gtout}, E = ${recSansM.E}`);

/* ---------- 3. L'addition du marché : l'addition est enfin obligatoire ---------- */
const addB = apres.LV.find((l) => cle(l) === "marche:L'addition du marché");
verif(j(addB.targets.map((t) => t.disp)) === j(["100 %", "1/3"]),
  "les deux étiquettes de cibles sont conservées (100 % et 1/3)");
verif((addB.gates || []).length === 2 && addB.gates.every((g) => j(g.max) === j([2, 3])),
  "deux passes, toutes deux à 2/3 maximum");
verif(!addB.tools.some((t) => t.t === "x3"),
  "le ×3 tricheur (1/3 × 3 = 1 sans addition) est sorti de la boîte");
verif(addB.fruits.length === 3, "toujours 3 mangues", `${addB.fruits.length}`);
verif(Array.isArray(addB.solMin) && addB.solMin.length === 5,
  "solMin présente : gagner sans tout ramasser, en 5 pièces");

const rejoue = (nomNiveau, plan) => JSON.parse(vm.runInContext(`(() => {
  const i = LV.findIndex(x => x.name === ${j(nomNiveau)});
  cur = i; state.placed = {};
  for (const [ti, x, y] of LV[i].${plan}) state.placed[x + "," + y] = { def: LV[i].tools[ti], ti };
  const r = simulate();
  return JSON.stringify({ win: r.win, fruits: r.fruits.size });
})()`, ctx));
const addSol = rejoue("L'addition du marché", "sol");
const addMin = rejoue("L'addition du marché", "solMin");
verif(addSol.win && addSol.fruits === 3, "la sol de référence gagne et ramasse les 3 mangues",
  `win=${addSol.win}, fruits=${addSol.fruits}`);
verif(addMin.win && addMin.fruits < 3, "la solMin gagne SANS tout ramasser",
  `win=${addMin.win}, fruits=${addMin.fruits}`);

const nu = JSON.parse(vm.runInContext(`(() => {
  const i = LV.findIndex(x => x.name === "L'addition du marché");
  cur = i; state.placed = {};
  const r = simulate();
  return JSON.stringify({ win: r.win });
})()`, ctx));
verif(!nu.win, "le rayon du soleil, seul, ne gagne plus (l'ancien plateau se gagnait presque ainsi)");

for (const [type, nomFr] of [["m", "lentille"], ["x2", "loupe ×2"], ["s3", "prisme ÷3"]]) {
  const f = mesure("L'addition du marché", type, 800000);
  verif(f.G === 0 && !f.debord,
    `sans ${nomFr} : AUCUNE victoire, espace épuisé sans débordement`, `E = ${f.E}`);
}

/* ---------- 4. Le lagon : la couleur neuve redevient neuve ---------- */
for (const nom of ["Le tour du lagon", "La part perdue"]) {
  const av = parCle.get(`lagon:${nom}`), ap = apres.LV.find((l) => cle(l) === `lagon:${nom}`);
  verif(j({ ...av, tools: 0 }) === j({ ...ap, tools: 0 }),
    `${nom} : SEULE la boîte change (plateau, consignes, sol intacts à l'octet)`);
  verif(av.tools.some((t) => t.t === "s3") && !ap.tools.some((t) => t.t === "s3"),
    `${nom} : le ÷3 piège est sorti de la boîte`);
  verif(av.tools.length === ap.tools.length,
    `${nom} : la boîte garde sa taille (un ÷2 remplace le ÷3)`);
  const sol = rejoue(nom, "sol"), min = rejoue(nom, "solMin");
  verif(sol.win && min.win, `${nom} : sol et solMin gagnent toujours`,
    `sol=${sol.win}, solMin=${min.win}`);
}
const iTiers = apres.LV.findIndex((l) => l.dec === "tiers");
verif(apres.LV.slice(0, iTiers).every((l) => !l.tools.some((t) => t.t === "s3")),
  "plus aucun ÷3 en boîte avant la découverte du tiers");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT VERT");
process.exit(echecs ? 1 : 0);
