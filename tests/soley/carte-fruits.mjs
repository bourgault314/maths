/* Où poser les fruits ? — le fruit se mérite (idée 11), donc il ne se pose pas
 * au jugé. Ce script énumère TOUTES les configurations gagnantes d'un champ
 * (sans fruits) et relève, pour chaque case et chaque valeur de rayon, combien
 * de plans gagnants y font passer un rayon de cette valeur, et à partir de
 * quelle PROFONDEUR. Un bon fruit à valeur, c'est une case :
 *   - atteignable par au moins un plan gagnant (sinon `sol` n'existe pas) ;
 *   - rare (peu de plans y passent) et PLUS PROFONDE que le plan gagnant
 *     minimal (sinon le fruit est gratuit et la couche ☀☀ tourne à vide) ;
 *   - jamais occupée par une pièce des plans courts (sinon on casse le niveau).
 *
 * Usage : node tests/soley/carte-fruits.mjs candidats.json [--val 1/4] [--budget 300000]
 */
import fs from "node:fs";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const args = process.argv.slice(2);
const fichier = args.find((a) => !a.startsWith("--"));
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const budget = +(flag("--budget") || 300000);
const filtre = flag("--val");
const ctx = createGameContext();
const candidats = JSON.parse(fs.readFileSync(fichier, "utf8"));

for (const c of candidats) {
  const rows = c.carte.length, cols = c.carte[0].length;
  const suns = [], targets = [], rocks = [];
  c.carte.forEach((l, y) => [...l].forEach((ch, x) => {
    if (ch === ".") return;
    if (ch === "X") { rocks.push([x, y]); return; }   /* canne FIGÉE : le tailleur n'y touche jamais */
    const d = c.legende[ch];
    if (!d || d.t === "fruit") return;               /* les fruits sont ignorés ici */
    if (d.t === "roche") rocks.push([x, y]);
    else if (d.t === "soleil") suns.push(d.val ? { x, y, dir: d.dir, val: d.val } : { x, y, dir: d.dir });
    else if (d.t === "cible") targets.push(d.porte === undefined ? { x, y, need: d.need } : { x, y, need: d.need, porte: d.porte });
  }));
  const i = vm.runInContext(`(() => { LV.push({ w:'canne',name:'carto',sub:'',cols:${cols},rows:${rows},
    suns:${JSON.stringify(suns)},targets:${JSON.stringify(targets)},rocks:${JSON.stringify(rocks)},
    fruits:[],tools:[${c.tools.map((t) => `${t[0]}(${t.slice(1).join(",")})`).join(",")}],sol:[] }); return LV.length-1; })()`, ctx);
  const e = vm.runInContext(`SOLVEUR.espaceEclaire(${i}, ${budget}, true, 99, true)`, ctx);
  console.log(`\n${c.name} — E=${e.E} G=${e.G} prof=${e.prof} λ=${(e.lambda || 0).toFixed(1)}${e.debord ? " [budget atteint]" : ""}`);
  if (!e.G) { console.log("  aucun plan gagnant"); continue; }
  /* un fruit mérité = une case RARE (peu de plans gagnants y passent) et/ou
     PLUS PROFONDE que le plan gagnant minimal, et jamais occupée par une pièce */
  const rangs = e.carto.filter((r) => !filtre || r.val === filtre)
    .filter((r) => r.nb < e.G || r.prof > e.prof)
    .sort((a, b) => (a.nb - b.nb) || (b.prof - a.prof));
  const parVal = {};
  for (const r of rangs) (parVal[r.val] ||= []).push(r);
  for (const [val, liste] of Object.entries(parVal)) {
    console.log(`  rayon ${val} — cases exigeantes (case · plans qui y passent /${e.G} · profondeur mini · pièces posées là) :`);
    console.log("    " + liste.slice(0, 12).map((r) => `${r.case}·${r.nb}·p${r.prof}·${r.piece}`).join("   "));
  }
}
