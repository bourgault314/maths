// Preuve du lot C « le lagon ne finit plus en marche arrière » (16/08/2026).
//
// L'IDÉE : « La moitié du quart » fermait le lagon en R = 75 juste après un niveau
// qui en demandait 5 534 — le monde finissait 74 fois plus facilement qu'il ne
// montait. Verdict de Gwenael : « beaucoup trop facile par rapport à tout ce qu'il y
// a pu avoir avant, c'est vraiment bidon ». Même défaut que « Le tour du lagon »,
// déplacé pour cette raison le 15/08.
//
// CE QUE CE FICHIER PROUVE
//   - UN SEUL niveau change dans tout le jeu ; les 69 autres sont intacts à l'OCTET,
//     appariés PAR NOM et jamais par index (leçon du lot canne) ;
//   - COURS, CALC, WORLDS et FRW sont strictement intacts : ce lot ne touche qu'un
//     champ, pas un mot de cours ni un compteur public ;
//   - le niveau reste ce qu'il était : même clé de sauvegarde, toujours la découverte
//     `recouper`, toujours 1/4 · 1/8 · 1/8, toujours une boîte sans ÷3 ;
//   - IL EST DEVENU DIFFICILE, et c'est mesuré dans le vrai moteur, pas déclaré :
//     R passe de 75 à plus de 1 000, la profondeur de 3 à 4 ;
//   - LE FRUIT SE MÉRITE : Rtout > 2×R — il n'est PAS posé sur le chemin gagnant
//     (c'est exactement le défaut « Rtout ≤ R » que la spec range au lot C) ;
//     `solMin` gagne SANS le ramasser, `sol` le ramasse ;
//   - LE MONDE NE FINIT PLUS EN MARCHE ARRIÈRE : le dernier niveau du lagon n'est
//     plus une chute par rapport à celui qui le précède ;
//   - la règle de la notion tient : INGAGNABLE sans ÷2.
//
//   node tests/soley/verifier-lot-moitie-du-quart.mjs [ref-git-d-avant-le-lot]
//
// Référence par défaut : e2c8cbce (le lot B TEL QU'IL EST SUR MAIN). Les PR de ce dépôt
// sont fusionnées en SQUASH : le commit de la branche disparaît de l'historique, et une
// référence prise sur la branche cesse d'être résolvable dès qu'on la supprime. Un
// vérificateur daté doit donc toujours pointer un commit de `main`. Outil de migration,
// comme ses aînés : toute évolution ultérieure de levels.js le fera échouer
// légitimement — d'où le nom hors *.test.mjs, il n'est pas en CI.
//
// NOTE : `verifier-lot-recouper.mjs` (lot A) devient une ARCHIVE. Il affirmait « aucun
// fruit, aucun solMin » pour ce niveau, ce que le présent lot renverse par décision de
// Gwenael. C'est le fonctionnement prévu des vérificateurs datés (SOLEY.md §6, dec. 9).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REF = process.argv[2] || "e2c8cbce";
const CHEMIN = "outils/club_maths/soley/js/levels.js";
const BUDGET = 1600000;
const CIBLE = "lagon:La moitié du quart";

const charger = (source) => {
  const ctx = vm.createContext({});
  vm.runInContext(source, ctx);
  return JSON.parse(vm.runInContext("JSON.stringify({LV, CALC, WORLDS, FRW, COURS})", ctx));
};
const gitShow = (chemin) => execFileSync("git", ["show", `${REF}:${chemin}`],
  { cwd: racine, encoding: "utf8", maxBuffer: 1 << 24 });
const avant = charger(gitShow(CHEMIN));
const apres = charger(readFileSync(resolve(racine, CHEMIN), "utf8").replace(/\r\n/g, "\n"));

let echecs = 0;
const verif = (ok, message, detail = "") => {
  console.log(`${ok ? "OK " : "ÉCHEC"} ${message}${detail ? ` — ${detail}` : ""}`);
  if (!ok) echecs++;
};
const j = JSON.stringify;
const cle = (l) => `${l.w}:${l.name}`;

/* ---------- 1. Un seul niveau change ---------- */
verif(avant.LV.length === 70 && apres.LV.length === 70, "70 niveaux avant comme après",
  `${avant.LV.length} → ${apres.LV.length}`);
verif(j(avant.LV.map(cle)) === j(apres.LV.map(cle)),
  "les 70 clés de sauvegarde sont les mêmes, dans le même ordre : aucune progression perdue");
const parNom = new Map(avant.LV.map((l) => [cle(l), l]));
const bouges = apres.LV.filter((l) => j(parNom.get(cle(l))) !== j(l)).map(cle);
verif(j(bouges) === j([CIBLE]), "UN SEUL niveau change dans tout le jeu", bouges.join(", ") || "aucun");

/* ---------- 2. Rien d'autre ne bouge ---------- */
verif(j(avant.COURS) === j(apres.COURS), "COURS strictement intact : pas un mot de cours ne change");
verif(j(avant.CALC) === j(apres.CALC), "CALC strictement intact");
verif(j(avant.WORLDS) === j(apres.WORLDS), "WORLDS strictement intacte");
verif(j(avant.FRW) === j(apres.FRW), "FRW strictement intacte");
const compter = (d) => d.LV.reduce((a, l) => ((a[l.w] = (a[l.w] || 0) + 1), a), {});
verif(j(compter(avant)) === j(compter(apres)),
  "les neuf mondes gardent exactement leur compte de niveaux : aucun compteur public à régénérer");

/* ---------- 3. Le niveau reste ce qu'il était ---------- */
const A = parNom.get(CIBLE), N = apres.LV.find((l) => cle(l) === CIBLE);
verif(N.dec === "recouper" && !!apres.COURS.recouper, "toujours la découverte `recouper`");
verif(apres.LV[apres.LV.findIndex((l) => l.w === "canne") - 1].name === "La moitié du quart",
  "il ferme toujours le lagon : dernier niveau avant les champs de canne");
const besoins = (l) => l.targets.map((t) => t.need.join("/")).sort().join(" ");
verif(besoins(A) === besoins(N), "les mêmes trois cases qu'avant : un quart et deux huitièmes",
  besoins(N));
verif(N.tools.every((t) => t.t === "s2" || t.t === "b"),
  "la boîte n'a toujours QUE des ÷2 et des miroirs : aucun ÷3 ne peut raccourcir la chaîne",
  N.tools.map((t) => t.t).join(" "));
verif(N.targets.filter((t) => j(t.need) === j([1, 8])).length === 2, "deux cases demandent un huitième");

/* ---------- 4. Il est devenu difficile — et c'est la boîte qui a le moins changé ---------- */
verif(N.cols * N.rows > A.cols * A.rows, "le champ s'est agrandi",
  `${A.cols}×${A.rows} → ${N.cols}×${N.rows}`);
verif(N.tools.length > A.tools.length, "la boîte a gagné du surplus : le tri fait partie du travail",
  `${A.tools.length} → ${N.tools.length}`);
verif(N.fruits.length === 1, "un fruit, un seul", `${N.fruits.length}`);
verif(!!N.solMin && N.solMin.length < N.sol.length,
  "`solMin` existe et est plus court que `sol` : gagner coûte moins que tout ramasser",
  `${N.solMin?.length} < ${N.sol.length}`);

/* ---------- 5. Mesuré dans le VRAI moteur ---------- */
const ctx = createGameContext();
const idx = (nom) => vm.runInContext(`LV.findIndex(l=>l.w==='lagon'&&l.name===${j(nom)})`, ctx);
const i = idx("La moitié du quart");
verif(i >= 0, "le niveau est chargé par le moteur du jeu");
const e = vm.runInContext(`SOLVEUR.espaceEclaire(${i}, ${BUDGET}, true, 99, false)`, ctx);
verif(e.prof === 4, "profondeur 4 : la chaîne de trois coupes, PLUS un virage à négocier",
  `prof=${e.prof}`);
verif(e.Rth > 1000, "R dépasse 1 000 : le niveau ne tombe plus en une poignée d'essais",
  `Rth=${Math.round(e.Rth)}`);
verif(e.Rth < 5534, "R reste sous celui du niveau qui le précède : une découverte se gagne",
  `Rth=${Math.round(e.Rth)} < 5534`);
/* LE contrôle du lot : le fruit n'est pas posé sur le chemin gagnant. */
verif(e.RthTout > 2 * e.Rth,
  "LE FRUIT SE MÉRITE : tout ramasser coûte plus du DOUBLE de gagner",
  `Rtout=${Math.round(e.RthTout)} vs R=${Math.round(e.Rth)} (×${(e.RthTout / e.Rth).toFixed(1)})`);
verif(e.profTout > e.prof, "ramasser le fruit demande une pièce de plus que gagner",
  `profTout=${e.profTout} > prof=${e.prof}`);
verif(e.lambda >= 4 && e.lambda <= 9,
  "λ reste dans la fourchette d'un vrai tâtonnement : ni couloir forcé, ni brouillard",
  `λ=${(e.lambda || 0).toFixed(1)}`);

/* le monde ne finit plus en marche arrière */
const avantDernier = vm.runInContext(`SOLVEUR.espaceEclaire(${idx("Le tiers de la moitié")}, ${BUDGET}, true, 99, false)`, ctx);
verif(e.Rth > avantDernier.Rth / 6,
  "LE LAGON NE FINIT PLUS EN MARCHE ARRIÈRE : la chute au dernier niveau n'est plus un facteur 74",
  `${Math.round(avantDernier.Rth)} → ${Math.round(e.Rth)} (facteur ${(avantDernier.Rth / e.Rth).toFixed(1)})`);

/* la règle de la notion */
const sansS2 = vm.runInContext(`(() => {
  const L = LV[${i}], garde = L.tools;
  L.tools = garde.filter(t => t.t !== 's2');
  const r = SOLVEUR.espaceEclaire(${i}, 400000, true, 99, false);
  L.tools = garde;
  return r.G;
})()`, ctx);
verif(sansS2 === 0, "INGAGNABLE sans ÷2 : le niveau force encore la notion qu'il enseigne",
  `${sansS2} victoire(s)`);

/* sol ramasse tout, solMin gagne sans le fruit — rejoué dans le moteur */
const rejeu = (plan) => vm.runInContext(`(() => {
  cur = ${i}; state.placed = {};
  for (const [ti,x,y] of ${j(plan)}) state.placed[x+","+y] = { def: LV[${i}].tools[ti], ti };
  const s = simulate();
  return { win: s.win, fruits: s.fruits.size };
})()`, ctx);
const rSol = rejeu(N.sol), rMin = rejeu(N.solMin);
verif(rSol.win && rSol.fruits === N.fruits.length, "`sol` gagne ET ramasse le fruit",
  `win=${rSol.win} fruits=${rSol.fruits}/${N.fruits.length}`);
verif(rMin.win && rMin.fruits < N.fruits.length, "`solMin` gagne SANS le fruit : la couche ☀☀ existe",
  `win=${rMin.win} fruits=${rMin.fruits}/${N.fruits.length}`);

console.log(`\n${echecs ? `${echecs} ÉCHEC(S)` : "TOUT VERT"} — référence ${REF}`);
process.exit(echecs ? 1 : 0);
