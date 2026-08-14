// Outil d'audit de la refonte (DIAGNOSTIC-REFONTE-NIVEAUX.md) : mesure, pour
// chacun des niveaux et dans le vrai moteur, le surplus de la boîte, les fruits
// ramassés par la solution de référence, et la gagnabilité avec une pièce de
// moins. À relancer à chaque lot de refonte pour suivre l'évolution des mesures.
//   node tests/soley/diagnostic-niveaux.mjs [--json fichier.json]
import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../../", import.meta.url);
const lire = (c) => fs.readFileSync(new URL(c, root), "utf8").replace(/\r\n/g, "\n");
const js = {
  levels: lire("outils/club_maths/soley/js/levels.js"),
  engine: lire("outils/club_maths/soley/js/engine.js"),
};
const context = vm.createContext({ localStorage: { getItem(){return null;}, setItem(){} } });
vm.runInContext(js.levels, context);
vm.runInContext(js.engine, context);

const out = vm.runInContext(`(() => {
  const rows = [];
  LV.forEach((level, index) => {
    cur = index;
    const place = (indices) => {
      state.placed = {};
      for (const k of indices) {
        const [ti,x,y] = level.sol[k];
        state.placed[x+","+y] = { def: level.tools[ti], ti };
      }
    };
    // solution complète
    place(level.sol.map((_,k)=>k));
    const full = simulate();

    // sous-ensembles : omission de 1 pièce — gagne-t-on encore ? avec combien de fruits ?
    let winsWithLess = 0, minFruitsWinning = full.fruits.size;
    for (let omit = 0; omit < level.sol.length; omit++) {
      place(level.sol.map((_,k)=>k).filter(k=>k!==omit));
      const r = simulate();
      if (r.win) { winsWithLess++; minFruitsWinning = Math.min(minFruitsWinning, r.fruits.size); }
    }

    const denoms = [...new Set(level.targets.map(t => {
      const g=(a,b)=>b?g(b,a%b):a; const k=g(t.need[0],t.need[1]); return t.need[1]/k;
    }))].sort((a,b)=>a-b);
    const pieceTypes = [...new Set(level.tools.map(t=>t.t))].sort();
    rows.push({
      i: index, w: level.w, name: level.name, dec: level.dec||null,
      grid: level.cols+"x"+level.rows,
      rocks: level.rocks.length,
      suns: level.suns.length,
      targets: level.targets.length,
      denoms,
      tools: level.tools.length, used: level.sol.length,
      surplus: level.tools.length - level.sol.length,
      pieceTypes,
      fixed: (level.fixed||[]).length, gates: (level.gates||[]).length,
      fruits: level.fruits.length,
      fruitsBySol: full.fruits.size,
      winsWithOneLess: winsWithLess,
      minFruitsWhenWinningWithLess: winsWithLess ? minFruitsWinning : null,
      win: full.win
    });
  });
  return rows;
})()`, context);

if (process.argv[2] === "--json") fs.writeFileSync(process.argv[3] || "diagnostic-niveaux.json", JSON.stringify(out, null, 1));

// Synthèse par monde
const byW = {};
for (const r of out) (byW[r.w] = byW[r.w] || []).push(r);
for (const [w, rows] of Object.entries(byW)) {
  const surplusTot = rows.reduce((s,r)=>s+r.surplus,0);
  const fruitsTot = rows.reduce((s,r)=>s+r.fruits,0);
  const freeFruit = rows.filter(r=>r.fruits>0 && (r.minFruitsWhenWinningWithLess===null || r.minFruitsWhenWinningWithLess===r.fruits)).length;
  const newD = [...new Set(rows.flatMap(r=>r.denoms))].sort((a,b)=>a-b);
  console.log(w.padEnd(8), "niv:"+rows.length, "surplus total:"+surplusTot,
    "fruits:"+fruitsTot, "denoms:"+newD.join(","),
    "grilles:"+[...new Set(rows.map(r=>r.grid))].join(" "));
}
console.log("---");
console.log("Niveaux SANS AUCUN surplus de pièces :", out.filter(r=>r.surplus===0).length, "/", out.length);
console.log("Niveaux où la solution ramasse TOUS les fruits :", out.filter(r=>r.fruits>0 && r.fruitsBySol===r.fruits).length, "/", out.filter(r=>r.fruits>0).length);
console.log("Niveaux gagnables avec 1 pièce de moins :", out.filter(r=>r.winsWithOneLess>0).map(r=>r.name).join(" | ") || "aucun");
