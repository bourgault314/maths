/* Semeur de champs — on donne l'INTENTION, il cherche le CHAMP.
 *
 * Méthode imposée par le diagnostic (point 5) : « Conçois par CONTRAINTES : le
 * champ d'abord, les passages rares, la solution ensuite. » On ne dessine donc
 * jamais une solution. On fixe l'intention d'un niveau — grille, soleils,
 * cases, fruits, boîte, murs structurels — et le semeur tire des champs de
 * cannes au hasard dans les cases restantes, mesure chacun au solveur-étalon,
 * et ne garde que ceux qui RÉSISTENT.
 *
 * Deux tamis, dans cet ordre (le premier est cent fois moins cher) :
 *  1. rejet immédiat si une victoire existe à 3 pièces ou moins — c'est le
 *     défaut mesuré des niveaux actuels de la canne (prof 1 ou 2 : on gagne
 *     avant d'avoir cherché) ;
 *  2. mesure complète, et score qui exige de la PROFONDEUR (≥ profMin pièces),
 *     de la LARGEUR (λ, pour ne pas récompenser un couloir forcé) et un fruit
 *     qui se mérite vraiment (Rtout nettement au-dessus de R).
 *
 * Usage : node tests/soley/semeur-champs.mjs gabarit.json [--essais 150]
 */
import fs from "node:fs";
import vm from "node:vm";
import { createGameContext, ligne } from "./solveur-etalon.mjs";

const args = process.argv.slice(2);
const fichier = args.find((a) => !a.startsWith("--"));
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const essais = +(flag("--essais") || 120);
const garde = +(flag("--garde") || 3);
const graineDep = +(flag("--graine") || 1);

const G = JSON.parse(fs.readFileSync(fichier, "utf8"));
const ctx = createGameContext();

const OUTIL = (t) => `${t[0] === "mg" ? "mg" : t[0]}(${t.slice(1).join(",")})`;

/* le gabarit : carte où '#' = mur imposé, '=' = case tenue libre,
   '?' = case tirée au sort, plus la légende habituelle */
function lireGabarit(g) {
  const rows = g.carte.length, cols = g.carte[0].length;
  const dur = [], libre = [], tirage = [];
  const suns = [], targets = [], fruits = [];
  g.carte.forEach((l, y) => [...l].forEach((ch, x) => {
    if (ch === "#") dur.push([x, y]);
    else if (ch === "=") libre.push([x, y]);
    else if (ch === "?") tirage.push([x, y]);
    else {
      const d = g.legende[ch];
      if (!d) throw new Error(`caractère « ${ch} » sans légende`);
      if (d.t === "soleil") suns.push(d.val ? { x, y, dir: d.dir, val: d.val } : { x, y, dir: d.dir });
      else if (d.t === "cible") targets.push(d.porte === undefined ? { x, y, need: d.need } : { x, y, need: d.need, porte: d.porte });
      else if (d.t === "fruit") fruits.push(d.val ? [x, y, d.val] : [x, y]);
    }
  }));
  return { rows, cols, dur, libre, tirage, suns, targets, fruits };
}

const T = lireGabarit(G);
const nRoches = Math.round((G.densite ?? 0.4) * T.rows * T.cols) - T.dur.length;
let graine = graineDep >>> 0;
const alea = () => { graine ^= graine << 13; graine >>>= 0; graine ^= graine >> 17; graine ^= graine << 5; graine >>>= 0; return graine / 4294967296; };

function injecter(rocks) {
  const src = `(() => { LV.push({ w:'canne', name:'semis', sub:'',
    cols:${T.cols}, rows:${T.rows},
    suns:${JSON.stringify(T.suns)}, targets:${JSON.stringify(T.targets)},
    rocks:${JSON.stringify(rocks)}, fruits:${JSON.stringify(T.fruits)},
    tools:[${G.tools.map(OUTIL).join(",")}], sol:[] }); return LV.length-1; })()`;
  return vm.runInContext(src, ctx);
}
const retirer = (i) => vm.runInContext(`LV.length=${i}`, ctx);

const profMin = G.profMin ?? 4;
const lambdaMin = G.lambdaMin ?? 4;
const retenus = [];
let vus = 0, tropCourt = 0, insoluble = 0;

for (let n = 0; n < essais; n++) {
  const pool = T.tirage.slice();
  for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(alea() * (k + 1)); [pool[k], pool[j]] = [pool[j], pool[k]]; }
  const rocks = T.dur.concat(pool.slice(0, Math.max(0, nRoches)));
  const i = injecter(rocks);
  vus++;
  const court = vm.runInContext(`SOLVEUR.espaceEclaire(${i}, 80000, true, ${profMin - 1})`, ctx);
  if (court.G > 0) { tropCourt++; retirer(i); continue; }
  const m = vm.runInContext(`SOLVEUR.mesurer(${i}, ${JSON.stringify({ budget: G.budget || 300000 })})`, ctx);
  retirer(i);
  const e = m.eclaire;
  if (!e.sol || !e.solMin) { insoluble++; continue; }
  if (e.lambda < lambdaMin) continue;
  const score = Math.log(e.Rth) + 0.6 * Math.log((e.RthTout || 1) / e.Rth) + 0.5 * e.prof;
  retenus.push({ score, rocks, m });
}

retenus.sort((a, b) => b.score - a.score);
console.log(`\n${essais} champs tirés · ${tropCourt} gagnés en ≤ ${profMin - 1} pièces (rejet immédiat) · ${insoluble} sans plan complet · ${retenus.length} retenus`);
for (const r of retenus.slice(0, garde)) {
  const grille = Array.from({ length: T.rows }, () => Array.from({ length: T.cols }, () => "."));
  r.rocks.forEach(([x, y]) => grille[y][x] = "#");
  T.suns.forEach((s, n) => grille[s.y][s.x] = G.marqueurs?.soleils?.[n] || "S");
  T.targets.forEach((t, n) => grille[t.y][t.x] = String(n + 1));
  T.fruits.forEach((f, n) => grille[f[1]][f[0]] = "abcdefg"[n]);
  console.log(ligne(r.m) + `\n  score ${r.score.toFixed(2)}`);
  console.log(grille.map((l) => "    " + l.join("")).join("\n"));
  console.log("  rocks:" + JSON.stringify(r.rocks));
  console.log("  sol:" + JSON.stringify(r.m.eclaire.sol) + "  solMin:" + JSON.stringify(r.m.eclaire.solMin));
}
