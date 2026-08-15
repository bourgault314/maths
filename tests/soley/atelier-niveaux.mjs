/* Atelier de conception — on dessine le CHAMP, le solveur dit s'il résiste.
 *
 * Compagnon de solveur-etalon.mjs. On lui donne des niveaux candidats (JSON),
 * il les injecte dans le vrai moteur, cherche lui-même les plans gagnants
 * (le gourmand qui ramasse tout → `sol`, le plus court qui ne ramasse pas tout
 * → `solMin`) et publie les mesures. Aucune solution n'est dessinée à la main :
 * c'est le point 5 du diagnostic (« les solutions ont été dessinées d'abord,
 * les obstacles posés autour — la solution se lisait d'un coup d'œil »).
 *
 * Format d'un candidat (JSON). Les outils s'écrivent en tableaux :
 *   ["s2",1,0,2] ["b",2,1] ["s3",1,0,1,2] ["mg",2,0,1]
 * Le plateau se dessine en CARTE ASCII — on voit le champ, c'est tout l'intérêt :
 *   "carte": ["..#..#..", "S.#....1", ...]
 *   "legende": { "#":{"t":"roche"}, "S":{"t":"soleil","dir":1},
 *                "1":{"t":"cible","need":[1,4],"porte":3},
 *                "a":{"t":"fruit","val":[1,2]}, "b":{"t":"fruit"} }
 * ('.' = case libre). À défaut de carte, les listes cols/rows/suns/targets/
 * rocks/fruits sont acceptées telles quelles.
 *
 * Usage : node tests/soley/atelier-niveaux.mjs candidats.json [--budget 800000]
 */
import fs from "node:fs";
import vm from "node:vm";
import { createGameContext, ligne } from "./solveur-etalon.mjs";

const args = process.argv.slice(2);
const fichier = args.find((a) => !a.startsWith("--"));
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const budget = +(flag("--budget") || 400000);

const candidats = JSON.parse(fs.readFileSync(fichier, "utf8"));
const ctx = createGameContext();

/* carte ASCII → listes du moteur */
function deCarte(c) {
  if (!c.carte) return c;
  const L = { ...c, rows: c.carte.length, cols: c.carte[0].length,
    suns: [], targets: [], rocks: [], fruits: [] };
  c.carte.forEach((ligne, y) => {
    if (ligne.length !== L.cols) throw new Error(`${c.name} : ligne ${y} de longueur ${ligne.length}, attendu ${L.cols}`);
    [...ligne].forEach((ch, x) => {
      if (ch === ".") return;
      if (ch === "X") { L.rocks.push([x, y]); return; }   /* canne figée (gabarits) */
      const d = c.legende?.[ch];
      if (!d) throw new Error(`${c.name} : caractère « ${ch} » sans légende`);
      if (d.t === "roche") L.rocks.push([x, y]);
      else if (d.t === "soleil") L.suns.push(d.val ? { x, y, dir: d.dir, val: d.val } : { x, y, dir: d.dir });
      else if (d.t === "cible") L.targets.push(d.porte === undefined ? { x, y, need: d.need } : { x, y, need: d.need, porte: d.porte });
      else if (d.t === "fruit") L.fruits.push(d.val ? [x, y, d.val] : [x, y]);
      else throw new Error(`${c.name} : type inconnu « ${d.t} »`);
    });
  });
  return L;
}

const OUTIL = { b: "b", s2: "s2", s3: "s3", mg: "mg", x2: "x2", x3: "x3" };
const outilJS = (t) => `${OUTIL[t[0]]}(${t.slice(1).join(",")})`;

function injecter(c) {
  const src = `(() => { LV.push({
    w:${JSON.stringify(c.w)}, name:${JSON.stringify(c.name)}, sub:${JSON.stringify(c.sub || "")},
    cols:${c.cols}, rows:${c.rows},
    suns:${JSON.stringify(c.suns)}, targets:${JSON.stringify(c.targets)},
    rocks:${JSON.stringify(c.rocks)}, fruits:${JSON.stringify(c.fruits)},
    tools:[${c.tools.map(outilJS).join(",")}], sol:[] }); return LV.length-1; })()`;
  return vm.runInContext(src, ctx);
}

const fmt = (p) => p ? "[" + p.map(([t, x, y]) => `[${t},${x},${y}]`).join(",") + "]" : "—";
const DIR = ["N", "E", "S", "O"];
const nomOutil = (t) => t[0] === "b" ? `miroir ${DIR[t[1]]}→${DIR[t[2]]}`
  : t[0] === "s2" ? `÷2 ${DIR[t[1]]}→${t.slice(2).map(d => DIR[d]).join("+")}`
  : t[0] === "s3" ? `÷3 ${DIR[t[1]]}→${t.slice(2).map(d => DIR[d]).join("+")}`
  : t.join(" ");

/* le plan trouvé, posé sur la carte : on VOIT où les pièces tombent */
function dessiner(c, plan) {
  if (!plan) return "";
  const g = c.carte ? c.carte.map((l) => [...l]) : null;
  if (!g) return "";
  plan.forEach(([ti, x, y], n) => { g[y][x] = String.fromCharCode(97 + n).toUpperCase(); });
  return "\n" + g.map((l) => "    " + l.join("")).join("\n") +
    "\n" + plan.map(([ti, x, y], n) => `    ${String.fromCharCode(65 + n)} = ${nomOutil(c.tools[ti])} en (${x},${y})`).join("\n");
}

const resultats = [];
for (const brut of candidats) {
  const c = deCarte(brut);
  const i = injecter(c);
  const m = vm.runInContext(`SOLVEUR.mesurer(${i}, ${JSON.stringify({ budget })})`, ctx);
  const e = m.eclaire;
  m.par = e.sol ? e.sol.length : null;
  m.surplus = e.sol ? c.tools.length - e.sol.length : null;
  m.def = c;
  console.log(ligne(m));
  console.log(`  sol    = ${fmt(e.sol)}` + dessiner(brut, e.sol));
  console.log(`  solMin = ${fmt(e.solMin)}`);
  console.log(`  boîte  : ${c.tools.map((t, n) => n + ":" + nomOutil(t)).join(" · ")}`);
  if (!e.sol) console.log("  !! AUCUN plan gagnant qui ramasse TOUS les fruits");
  if (!e.solMin) console.log("  !! aucun plan gagnant qui LAISSE un fruit (contrôle P2 en échec)");
  resultats.push({ nom: c.name, m });
}
if (args.includes("--json")) fs.writeFileSync("/tmp/atelier.json", JSON.stringify(resultats, null, 1));
