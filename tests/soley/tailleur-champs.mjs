/* Tailleur de champs — recuit local sur un champ qui marche déjà.
 *
 * Le semeur tire des champs au hasard : à 40 % d'obstacles, presque aucun ne
 * laisse passer une chaîne de trois prismes. Le tailleur fait l'inverse et
 * marche : il part d'un champ MESURÉ comme jouable et retaille quelques cases
 * (cannes ajoutées ou coupées), garde la retaille si le niveau résiste mieux,
 * recommence. La solution n'est toujours dessinée par personne : c'est le
 * solveur qui la trouve, et le score qui décide.
 *
 * Score : la profondeur du plan gagnant minimal d'abord (le vrai défaut des
 * niveaux actuels : on gagne en 1 ou 2 pièces), puis R, puis λ (garde-fou
 * anti-couloir). Un champ dont G < 2 est refusé : il faut au moins deux plans
 * gagnants pour qu'un `solMin` puisse exister à côté du `sol` gourmand.
 *
 * Usage : node tests/soley/tailleur-champs.mjs base.json [--rondes 4] [--essais 8]
 */
import fs from "node:fs";
import vm from "node:vm";
import { createGameContext } from "./solveur-etalon.mjs";

const args = process.argv.slice(2);
const fichier = args.find((a) => !a.startsWith("--"));
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const rondes = +(flag("--rondes") || 4);
const essais = +(flag("--essais") || 8);
const budget = +(flag("--budget") || 400000);
const profVoulue = +(flag("--prof") || 4);
/* Gmin : au lagon, la résistance va dans la couche FRUITS (brief du 15/08). Un
   champ à 2 plans gagnants identiques au tracé près ne laisse aucune place à un
   fruit mérité : il faut de la DIVERSITÉ de plans, pas seulement peu de plans. */
const gMin = +(flag("--gmin") || 2);
/* densMin : un champ de cannes doit RESSEMBLER à un champ. « La croisée des
   rayons » mesurait très haut avec 7 % d'obstacles — un plateau vide. */
const densMin = +(flag("--densmin") || 0);

const ctx = createGameContext();
let graine = +(flag("--graine") || 12345) >>> 0;
const alea = () => { graine ^= graine << 13; graine >>>= 0; graine ^= graine >> 17; graine ^= graine << 5; graine >>>= 0; return graine / 4294967296; };

function mesurer(c) {
  const rows = c.carte.length, cols = c.carte[0].length;
  const suns = [], targets = [], rocks = [];
  c.carte.forEach((l, y) => [...l].forEach((ch, x) => {
    if (ch === ".") return;
    if (ch === "X") { rocks.push([x, y]); return; }   /* canne FIGÉE : le tailleur n'y touche jamais */
    const d = c.legende[ch];
    if (!d || d.t === "fruit") return;
    if (d.t === "roche") rocks.push([x, y]);
    else if (d.t === "soleil") suns.push(d.val ? { x, y, dir: d.dir, val: d.val } : { x, y, dir: d.dir });
    else if (d.t === "cible") targets.push(d.porte === undefined ? { x, y, need: d.need } : { x, y, need: d.need, porte: d.porte });
  }));
  const i = vm.runInContext(`(() => { LV.push({ w:'x',name:'taille',sub:'',cols:${cols},rows:${rows},
    suns:${JSON.stringify(suns)},targets:${JSON.stringify(targets)},rocks:${JSON.stringify(rocks)},
    fruits:[],tools:[${c.tools.map((t) => `${t[0]}(${t.slice(1).join(",")})`).join(",")}],sol:[] }); return LV.length-1; })()`, ctx);
  const e = vm.runInContext(`SOLVEUR.espaceEclaire(${i}, ${budget}, true, 99, false)`, ctx);
  vm.runInContext(`LV.length=${i}`, ctx);
  e.densite = Math.round(1000 * rocks.length / (rows * cols)) / 10;
  return e;
}

/* la profondeur est récompensée JUSQU'À la cible seulement : au lagon, gagner
   doit rester accessible à un 6e qui débute — un plan minimal de 6 pièces n'est
   pas une réussite, c'est un autre défaut. Au-delà de la cible, seuls R et λ
   départagent. */
const score = (e) => {
  if (!e.G || e.G < gMin || !e.prof || e.prof < Math.min(3, profVoulue)) return -Infinity;
  if (e.prof > profVoulue + 1) return -Infinity;
  if (e.densite < densMin) return -Infinity;
  return 2.2 * Math.min(e.prof, profVoulue) + Math.log10(e.Rth) + 0.25 * Math.min(e.lambda, 12);
};

const base = JSON.parse(fs.readFileSync(fichier, "utf8"))[0];
let courant = base, eCourant = mesurer(base), sCourant = score(eCourant);
console.log(`départ ${base.name} : prof=${eCourant.prof} R=${Math.round(eCourant.Rth)} λ=${(eCourant.lambda || 0).toFixed(1)} G=${eCourant.G} E=${eCourant.E} dens=${eCourant.densite}% → score ${sCourant.toFixed(2)}`);

for (let r = 0; r < rondes; r++) {
  let meilleur = null, sMeilleur = (eCourant.densite < densMin) ? -Infinity : sCourant;
  for (let n = 0; n < essais; n++) {
    const g = courant.carte.map((l) => [...l]);
    const mutables = [];
    g.forEach((l, y) => l.forEach((ch, x) => { if (ch === "." || ch === "#") mutables.push([x, y]); }));  /* jamais les "X" */
    /* tant qu'on est SOUS la densité voulue, on ne fait que PLANTER de la canne :
       un tirage symétrique ne remonte jamais six points de densité par hasard. */
    const planter = eCourant.densite < densMin;
    const k = 1 + Math.floor(alea() * 3);
    for (let m = 0; m < k; m++) {
      const libres = planter ? mutables.filter(([x, y]) => g[y][x] === ".") : mutables;
      if (!libres.length) break;
      const [x, y] = libres[Math.floor(alea() * libres.length)];
      g[y][x] = g[y][x] === "#" ? "." : "#";
    }
    const cand = { ...courant, carte: g.map((l) => l.join("")) };
    const e = mesurer(cand);
    const s = score(e);
    /* sous la densité cible, le score reste -Infinity : on classe alors sur la
       densité atteinte, à niveau toujours jouable et toujours profond. */
    const jouable = e.G >= gMin && e.prof >= Math.min(3, profVoulue) && e.prof <= profVoulue + 1;
    const cle = (e.densite >= densMin) ? s : (jouable ? -1000 + e.densite : -Infinity);
    if (cle > sMeilleur) { sMeilleur = cle; meilleur = { cand, e, s: cle }; }
  }
  if (!meilleur) { console.log(`ronde ${r + 1} : rien de mieux`); continue; }
  courant = meilleur.cand; eCourant = meilleur.e; sCourant = meilleur.s;
  console.log(`ronde ${r + 1} : prof=${eCourant.prof} R=${Math.round(eCourant.Rth)} λ=${eCourant.lambda.toFixed(1)} G=${eCourant.G} E=${eCourant.E} dens=${eCourant.densite}% → ${sCourant.toFixed(2)}`);
}
console.log("carte retenue :");
console.log(JSON.stringify(courant.carte, null, 0).replace(/","/g, '",\n  "'));
