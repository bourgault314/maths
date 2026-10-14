/* SPLAT! — le Système (mode D), lot M4-5 « le générateur du monde 4 » (14/10/2026).
   Conception des deux livrets du monde 4 (planches A à E, validées le 14/10) :
     3a+   MIROIR, forme=13      1 + 3 et 3 + 1 : après le partage, il reste 2 taches à partager
     3c·k  RECOPIE, fois=2|3|4|MIX   aucun plateau ne tient dans l'autre : je recopie le premier
                                     k fois, j'y retrouve le second, je retire
     4e·t  ETAGES, sous=, grand=  deux gestes à la suite : les deux petits plateaux (un système à
                                  deux couleurs, résolu par son geste t), puis le grand
   et la correction de sysFormesDouble : le petit plateau recopié ne dépasse qu'avec 2 fois.
   Pour chaque geste nouveau, des milliers de cartes : solution unique, plan refait nombre par
   nombre, titres de la planche E, plages, 7 taches au plus, barre recopiée de 12 cases au plus.
   Puis : réglages éteints = mêmes cartes, même corrigé (les fiches du 14/10) ; adresses ; panneau. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function ligne(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}

const PALETTE = html.slice(html.indexOf("const INVESTIGATE_COLOR_PALETTE = ["), html.indexOf("];", html.indexOf("const INVESTIGATE_COLOR_PALETTE = [")) + 2);
const CONSTANTES_SYS = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_SOUS_GESTES", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS",
  "SYS_COULEURS_PLURIEL", "SYS_PLAGES"].map((nom) => ligne(`const ${nom} = `)).join("\n");
const FONCTIONS_SYS = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure", "sysAssemblerCarte", "sysTypeCarte",
  "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan", "sysLireGestes"].map(fn).join("\n");

const sys = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  ${fn("parseInvestigatePalette")}
  ${fn("buildInvestigateColorMap")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${CONSTANTES_SYS}
  ${FONCTIONS_SYS}
  return {
    SYS_GESTES, SYS_SOUS_GESTES, SYS_PLAGES, SYS_MAX_TACHES,
    normaliser: sysNormaliserReglages,
    formes: (geste, r) => sysFormes(geste, sysNormaliserReglages(r)),
    formesDouble: sysFormesDouble,
    plan: sysPlan, planS3: sysPlanS3, type: sysTypeCarte, assembler: sysAssemblerCarte,
    carte: (graine, reglages) => genSystemCarte(mulberry32(graine), reglages),
    serie(graine, n, reglages){
      const rng = mulberry32(graine);
      const out = [];
      for(let i = 0; i < n; i++) out.push(genSystemCarte(rng, reglages));
      return out;
    }
  };
`)();

const sousEntendu = (n) => ["69", "88", "420", "666", "1488"].some((x) => String(n).includes(x));
function graines(n, depart = 1){
  const out = [];
  for(let s = depart; out.length < n; s++) if(!sousEntendu(s)) out.push(s);
  return out;
}
const tirer = (reglages, nGraines, parGraine = 10) => graines(nGraines).flatMap((g) => sys.serie(g, parGraine, reglages));
const compte = (b, k) => b.counts[k] || 0;
const taches = (b) => Object.values(b.counts).reduce((a, x) => a + x, 0);
const forme = (c) => c._sys.boards.map((b) => c._sys.colors.map((k) => compte(b, k)).join("+")).join(" | ");
const REGLAGES = [{ totalMin: 20, totalMax: 60 }, { totalMin: 50, totalMax: 100 }];

/* rang d'une matrice (élimination de Gauss, petites valeurs entières) */
function rang(m){
  const a = m.map((r) => r.slice());
  let r = 0;
  for(let c = 0; c < (a[0] || []).length && r < a.length; c++){
    const p = a.findIndex((row, i) => i >= r && Math.abs(row[c]) > 1e-12);
    if(p < 0) continue;
    [a[r], a[p]] = [a[p], a[r]];
    for(let i = 0; i < a.length; i++) if(i !== r){
      const f = a[i][c] / a[r][c];
      for(let j = c; j < a[i].length; j++) a[i][j] -= f * a[r][j];
    }
    r++;
  }
  return r;
}
function evaluer(calcul){
  let m;
  if((m = calcul.match(/^(\d+) ÷ (\d+)$/))){ assert.equal(Number(m[1]) % Number(m[2]), 0, `division non exacte « ${calcul} »`); return Number(m[1]) / Number(m[2]); }
  if((m = calcul.match(/^(\d+) × (\d+)$/))) return Number(m[1]) * Number(m[2]);
  if(/^\d+( − \d+)+$/.test(calcul)){ const n = calcul.split(" − ").map(Number); return n.slice(1).reduce((s, x) => s - x, n[0]); }
  if(/^\d+( \+ \d+)+$/.test(calcul)) return calcul.split(" + ").map(Number).reduce((s, x) => s + x, 0);
  assert.fail(`calcul illisible « ${calcul} »`);
}
const cases = (b) => b.cells.reduce((n, c) => n + (c.kind === "block" ? c.covers : 1), 0);

/* Une carte d'un geste nouveau : le modèle, puis le plan dessiné refait nombre par nombre. */
function verifierCarte(carte, reglages){
  const o = sys.normaliser(reglages);
  const s = carte._sys;
  const C = s.colors, v = s.values;
  assert.equal(carte.family, "D");
  assert.ok(!s.secours, "jamais de carte de secours");
  const vals = C.map((k) => v[k]);
  assert.ok(vals.every((x) => Number.isInteger(x) && x >= 3), `valeurs ${vals}`);
  assert.equal(new Set(vals).size, vals.length, `deux couleurs de même valeur : ${vals}`);
  s.boards.forEach((b, i) => {
    assert.ok(taches(b) >= 1 && taches(b) <= 7, `plateau ${i} : ${taches(b)} taches`);
    assert.ok(Object.values(b.counts).every((n) => n <= 5), "5 taches au plus d'une même couleur");
    assert.ok(!b.visible || b.visible.length === 0, "jamais de jeton visible");
    assert.equal(C.reduce((a, k) => a + compte(b, k) * v[k], 0), b.total, `plateau ${i} : total faux`);
    assert.ok(b.total <= o.totalMax, `plateau ${i} : ${b.total} > ${o.totalMax}`);
  });
  assert.ok(s.boards[0].total >= o.totalMin, `total ${s.boards[0].total}`);
  assert.equal(rang(s.boards.map((b) => C.map((k) => compte(b, k)))), C.length, "pas une solution unique");
  // la carte telle que la page la lit : le premier plateau
  const attendu = C.flatMap((k) => Array(compte(s.boards[0], k)).fill(k));
  assert.deepEqual(carte._colorMap, attendu);
  assert.deepEqual(carte.hidden, attendu.map((k) => v[k]));
  assert.equal(carte.total, s.boards[0].total);
  assert.equal(carte._inv.indices.length, s.boards.length - 1);
  // le plan : chaque barre juste, chaque calcul juste, une couleur montrée après avoir été trouvée
  const plan = s.plan;
  const totaux = s.boards.map((b) => b.total);
  const tops = [], trouvees = new Set();
  plan.forEach((e, n) => {
    assert.equal(e.titre === "Je vérifie", n === plan.length - 1, "« Je vérifie » en dernier, et seulement là");
    if(e.role === "verification") return;
    for(const b of e.barres){
      assert.ok(cases(b) <= 12, `« ${e.titre} » : ${cases(b)} cases`);
      const somme = b.cells.reduce((a, c) => a + (c.kind === "unknown" ? v[c.color] : c.value), 0);
      assert.equal(somme, Number(b.top), `« ${e.titre} » : la barre ${b.top} ≠ ${somme}`);
      if(b.calcul) assert.equal(evaluer(b.calcul), Number(b.top), `« ${b.calcul} » ≠ ${b.top}`);
      assert.ok(b.coupes.every((k, i) => k > 0 && k < b.cells.length && (i === 0 || k > b.coupes[i - 1])));
      for(const c of b.cells){
        if(c.kind === "known"){ assert.equal(c.value, v[c.color]); assert.ok(trouvees.has(c.color), `${c.color} montrée avant d'être trouvée`); }
        if(c.kind === "block") assert.ok(totaux.includes(c.value) || tops.includes(c.value), `bloc ${c.value}`);
        assert.notEqual(c.kind, "visible");
      }
      if(b.cells.length === 1 && b.cells[0].kind === "unknown"){ assert.equal(Number(b.top), v[b.cells[0].color]); trouvees.add(b.cells[0].color); }
      tops.push(Number(b.top));
    }
  });
  assert.equal(trouvees.size, C.length, "le plan ne trouve pas toutes les couleurs");
  const verif = plan[plan.length - 1];
  assert.equal(verif.lignes.length, s.boards.length, "un calcul par plateau");
  for(const l of verif.lignes){
    const m = l.match(/^(.+) = (\d+) ✓$/);
    assert.ok(m, l);
    assert.equal(m[1].split(" + ").reduce((a, t) => { const p = t.match(/^(\d+) × (\d+)$/); return a + (p ? p[1] * p[2] : Number(t)); }, 0), Number(m[2]), l);
  }
  assert.deepEqual(verif.reponses, C.map((k) => ({ color: k, value: v[k] })));
  // aucun nombre à sous-entendu, ni dans la carte ni dans le plan dessiné (le filtre le lit)
  assert.ok(!(JSON.stringify(carte).match(/\d+/g) || []).some(sousEntendu), "nombre à sous-entendu");
  return s;
}

// --- Je recopie, puis je retire --------------------------------------------------------

test("Je recopie : les formes — le premier plateau recopié k fois contient le second, aucun ne tient dans l'autre", () => {
  const f = (fois) => sys.formes("RECOPIE", { fois });
  assert.deepEqual(f(2), [[1, 3, 2, 1], [1, 3, 2, 2], [1, 4, 2, 1], [1, 4, 2, 2], [1, 4, 2, 3], [2, 2, 4, 1], [2, 3, 4, 1], [2, 3, 4, 2]]);
  assert.deepEqual(f(3), [[1, 2, 3, 1], [1, 3, 3, 2]]);
  assert.deepEqual(f(4), [[1, 2, 4, 1]]);
  assert.deepEqual(f("MIX"), f(2).concat(f(3)), "au hasard : 2 ou 3 fois");
  assert.deepEqual(f(undefined), f(2), "par défaut : 2 fois");
  assert.deepEqual(f(7), f(2));
  for(const fois of [2, 3, 4]) for(const [a1, b1, a2, b2] of f(fois)){
    assert.equal(a2, fois * a1);
    assert.ok(b2 >= 1 && b2 < b1, "le second plateau a plus de A, moins de B : aucun ne tient dans l'autre");
    assert.ok(a1 + b1 <= 5 && a2 + b2 <= 7 && Math.max(a1, b1, a2, b2) <= 5);
    assert.ok(fois * (a1 + b1) <= 12, "la barre recopiée : 12 cases au plus");
    assert.notEqual(a2 * a1, b2 * b1, "pas un miroir (le second plateau n'est pas le premier retourné)");
  }
  // les formes de la conception (planches A, B, C) sont là
  for(const [fois, x] of [[2, [1, 3, 2, 1]], [2, [1, 3, 2, 2]], [2, [1, 4, 2, 1]], [2, [1, 4, 2, 3]], [2, [2, 3, 4, 1]], [2, [2, 2, 4, 1]], [3, [1, 2, 3, 1]], [3, [1, 3, 3, 2]], [4, [1, 2, 4, 1]]]){
    assert.ok(f(fois).some((y) => JSON.stringify(y) === JSON.stringify(x)), `${fois} fois : ${x}`);
  }
});

for(const fois of [2, 3, 4, "MIX"]) for(const r of REGLAGES){
  test(`Je recopie, ${fois} fois, totaux ${r.totalMin}-${r.totalMax} : cartes justes, plan de la planche E`, () => {
    const reglages = { geste: "RECOPIE", fois, visMin: 0, visMax: 3, ...r };
    const cartes = tirer(reglages, 120);
    const vus = new Set();
    const f = r.totalMax > 60 ? r.totalMax / 60 : 1;
    const plage = sys.SYS_PLAGES.RECOPIE;
    for(const c of cartes){
      const s = verifierCarte(c, reglages);
      assert.equal(s.geste, "RECOPIE");
      const [A, B] = s.colors, [P, Q] = s.boards;
      const k = compte(Q, A) / compte(P, A);
      if(fois !== "MIX") assert.equal(k, fois);
      else assert.ok([2, 3].includes(k));
      vus.add(k);
      assert.equal(sys.type(c), `3c·${k}`);
      for(const x of s.colors) assert.ok(s.values[x] >= Math.round(plage.vMin * f) && s.values[x] <= Math.round(plage.vMax * f), `valeur ${s.values[x]}`);
      assert.ok(Q.total >= Math.round(plage.sousMin * f), `second plateau ${Q.total}`);
      // le plan : les titres exacts (planche E), les plateaux nommés par leur total
      const a = compte(P, A), rB = k * compte(P, B) - compte(Q, B);
      const titres = ["Les deux plateaux", `Je recopie ${k} fois le plateau ${P.total}`, `Je retrouve le plateau ${Q.total} dedans`, "Je retire"]
        .concat(rB > 1 ? ["Je partage"] : [], ["Je remplace", "Je retire"], a > 1 ? ["Je partage"] : [], ["Je vérifie"]);
      assert.deepEqual(s.plan.map((e) => e.titre), titres);
      const recopie = s.plan[1].barres[0];
      assert.equal(recopie.calcul, `${k} × ${P.total}`);
      assert.equal(recopie.cells.length, k * taches(P));
      assert.equal(recopie.coupes.length, k - 1, "k paquets");
      const retrouve = s.plan[2].barres[0];
      assert.deepEqual(retrouve.cells[0], { kind: "block", value: Q.total, covers: taches(Q) });
      assert.equal(retrouve.cells.length, 1 + rB);
      assert.ok(retrouve.cells.slice(1).every((x) => x.kind === "unknown" && x.color === B));
    }
    if(fois === "MIX") assert.deepEqual([...vus].sort(), [2, 3], "au hasard : les deux sortent");
    // 4 fois : une seule forme (1 + 2 et 4 + 1), moins de cartes possibles
    assert.ok(new Set(cartes.map((c) => JSON.stringify([c._sys.colors, c._sys.boards]))).size > cartes.length * (fois === 4 ? 0.3 : 0.6), "cartes trop répétées");
  });
}

test("Je recopie : la carte de la planche A (cas 3) — 1 noire + 3 bleues = 25 ; 2 noires + 1 bleue = 20", () => {
  const sit = { geste: "RECOPIE", colors: ["black", "blue"], values: { black: 7, blue: 6 }, boards: [
    { counts: { black: 1, blue: 3 }, total: 25, visible: [] }, { counts: { black: 2, blue: 1 }, total: 20 }] };
  const resume = sys.plan(sit).map((e) => [e.titre, e.barres.map((b) => `${b.top}${b.calcul ? ` (${b.calcul})` : ""} : ${b.cells.map((c) => (c.kind === "block" ? `[${c.value}]` : c.kind === "known" ? `${c.color}=${c.value}` : c.color)).join(" ")}`)]);
  assert.deepEqual(resume, [
    ["Les deux plateaux", ["25 : black blue blue blue", "20 : black black blue"]],
    ["Je recopie 2 fois le plateau 25", ["50 (2 × 25) : black blue blue blue black blue blue blue"]],
    ["Je retrouve le plateau 20 dedans", ["50 : [20] blue blue blue blue blue"]],
    ["Je retire", ["30 (50 − 20) : blue blue blue blue blue"]],
    ["Je partage", ["6 (30 ÷ 5) : blue"]],
    ["Je remplace", ["25 : black blue=6 blue=6 blue=6"]],
    ["Je retire", ["7 (25 − 6 − 6 − 6) : black"]],
    ["Je vérifie", []]
  ]);
  assert.deepEqual(sys.plan(sit)[1].barres[0].coupes, [4]);
  assert.deepEqual(sys.plan(sit).at(-1).lignes, ["7 + 3 × 6 = 25 ✓", "2 × 7 + 6 = 20 ✓"]);
});

// --- Deux gestes à la suite ------------------------------------------------------------

for(const sous of ["COEF", "MIROIR", "RECOPIE", "DOUBLE", "MIX"]) for(const r of REGLAGES){
  test(`Deux gestes à la suite, petits plateaux ${sous}, totaux ${r.totalMin}-${r.totalMax} : cartes justes, plan`, () => {
    const reglages = { geste: "ETAGES", sous, visMin: 1, visMax: 3, ...r, ...(sous === "RECOPIE" ? { fois: "MIX" } : {}), ...(sous === "MIROIR" ? { forme: "MIX" } : {}) };
    const cartes = tirer(reglages, sous === "MIX" ? 100 : 50);
    const grands = new Set(), petits = new Set();
    for(const c of cartes){
      const s = verifierCarte(c, reglages);
      assert.equal(s.geste, "ETAGES");
      const [A, B, D] = s.colors, [G, P1, P2] = s.boards;
      assert.equal(s.boards.length, 3);
      if(sous !== "MIX") assert.equal(s.sous, sous);
      assert.ok(sys.SYS_SOUS_GESTES.includes(s.sous));
      petits.add(s.sous);
      const g = [compte(G, A), compte(G, B), compte(G, D)].join("");
      assert.ok(["211", "112"].includes(g), `grand plateau ${g}`);
      grands.add(g);
      for(const b of [P1, P2]) assert.equal(compte(b, D), 0, "la 3e couleur n'est que dans le grand plateau");
      assert.ok(s.boards.every((b) => Object.values(b.counts).every((n) => n <= 3)), "3 taches au plus d'une même couleur");
      // le plan : les trois plateaux, les étapes du petit système (sans sa vérification), puis le grand
      const plan = s.plan;
      const sousPlan = sys.plan({ geste: s.sous, colors: [A, B], values: { [A]: s.values[A], [B]: s.values[B] }, boards: [P1, P2] }).filter((e) => e.role !== "verification");
      assert.equal(plan[0].titre, "Les trois plateaux");
      assert.deepEqual(plan[0].barres.map((b) => Number(b.top)), [G.total, P1.total, P2.total]);
      assert.equal(plan[1].titre, "Les deux petits plateaux");
      assert.deepEqual(plan.slice(2, 1 + sousPlan.length), sousPlan.slice(1));
      const fin = plan.slice(1 + sousPlan.length).map((e) => e.titre);
      assert.deepEqual(fin, [`Je remplace dans le plateau ${G.total}`, "Je retire"].concat(compte(G, D) > 1 ? ["Je partage"] : [], ["Je vérifie"]));
      const remplace = plan[1 + sousPlan.length].barres[0];
      assert.ok(remplace.cells.every((x) => (x.color === D ? x.kind === "unknown" : x.kind === "known")));
      // 13 au plus : petits plateaux en miroir 1-3 (forme=13) et la 3e couleur en double
      assert.ok(plan.length >= 8 && plan.length <= 13, `${plan.length} étapes`);
      assert.equal(sys.type(c), "4e·" + sys.type({ _sys: { geste: s.sous, colors: [A, B], boards: [P1, P2] } }));
    }
    assert.deepEqual([...grands].sort(), ["112", "211"], "les deux grands plateaux sortent");
    if(sous === "MIX") assert.deepEqual([...petits].sort(), ["COEF", "DOUBLE", "MIROIR", "RECOPIE"], "les quatre gestes sortent");
  });
}

test("Deux gestes à la suite : grand=211 ou 112 tenu ; la carte 27d c1 de la planche E", () => {
  for(const grand of ["211", "112"]) for(const c of tirer({ geste: "ETAGES", grand, visMin: 0, visMax: 0 }, 20)){
    const [A, B, D] = c._sys.colors;
    assert.equal([A, B, D].map((k) => compte(c._sys.boards[0], k)).join(""), grand);
  }
  // 2 bleues + 1 verte + 1 orange = 54 ; 2 bleues + 3 vertes = 53 ; 2 bleues + 1 verte = 43
  const sit = { geste: "ETAGES", sous: "COEF", colors: ["blue", "green", "orange"], values: { blue: 19, green: 5, orange: 11 }, boards: [
    { counts: { blue: 2, green: 1, orange: 1 }, total: 54, visible: [] }, { counts: { blue: 2, green: 3 }, total: 53 }, { counts: { blue: 2, green: 1 }, total: 43 }] };
  const plan = sys.plan(sit);
  assert.deepEqual(plan.map((e) => e.titre), ["Les trois plateaux", "Les deux petits plateaux", "Je remplace le petit plateau par son total", "Je retire", "Je partage",
    "Je remplace", "Je retire", "Je partage", "Je remplace dans le plateau 54", "Je retire", "Je vérifie"]);
  assert.deepEqual(plan[8].barres.map((b) => b.cells.map((x) => (x.kind === "known" ? x.value : x.color))), [[19, 19, 5, "orange"]]);
  assert.deepEqual(plan[9].barres.map((b) => [b.top, b.calcul]), [["11", "54 − 19 − 19 − 5"]]);
  assert.deepEqual(plan.at(-1).lignes, ["2 × 19 + 5 + 11 = 54 ✓", "2 × 19 + 3 × 5 = 53 ✓", "2 × 19 + 5 = 43 ✓"]);
  const carte = sys.assembler(sit, plan, "BOARD", false);
  assert.equal(carte._sys.sous, "COEF");
  assert.equal(sys.type(carte), "4e·1c");
});

// --- le miroir 1-3 ----------------------------------------------------------------------

test("Miroir : forme=12|23|13|MIX ; absente, les deux formes d'avant", () => {
  const f = (forme) => sys.formes("MIROIR", { forme });
  assert.deepEqual(f(undefined), [[1, 2], [2, 3]]);
  assert.deepEqual(f(""), [[1, 2], [2, 3]]);
  assert.deepEqual(f("12"), [[1, 2]]);
  assert.deepEqual(f("23"), [[2, 3]]);
  assert.deepEqual(f("13"), [[1, 3]]);
  assert.deepEqual(f("mix"), [[1, 2], [2, 3], [1, 3]]);
  assert.deepEqual(f("autre"), [[1, 2], [2, 3]]);
});

for(const r of REGLAGES) for(const vis of [{ visMin: 0, visMax: 0 }, { visMin: 1, visMax: 3 }]){
  test(`Miroir 1-3, totaux ${r.totalMin}-${r.totalMax}, jetons ${vis.visMax} : 4 paires, 1 paire retrouvée, il reste 2 taches, je partage`, () => {
    for(const c of tirer({ geste: "MIROIR", forme: "13", ...r, ...vis }, 60)){
      const s = c._sys, [A, B] = s.colors, [P, O] = s.boards;
      assert.equal(s.geste, "MIROIR");
      assert.deepEqual([compte(P, A), compte(P, B)].sort(), [1, 3]);
      assert.equal(compte(O, A), compte(P, B));
      assert.ok(P.total >= O.total, "le plus grand total d'abord");
      assert.equal(sys.type(c), "3a+");
      const titres = s.plan.map((e) => e.titre);
      assert.deepEqual(titres, ["Les deux plateaux"].concat((P.visible || []).length ? ["Je retire"] : [],
        ["J’additionne : je range par paires", "Je partage", "Je retrouve 1 paire dans le plateau", "Je retire", "Je partage", "Je remplace", "Je retire", "Je vérifie"]));
      const i = titres.indexOf("Je retrouve 1 paire dans le plateau");
      const E = compte(P, A) === 3 ? A : B;
      assert.deepEqual(s.plan[i].barres[0].cells.slice(1), [{ kind: "unknown", color: E }, { kind: "unknown", color: E }], "il reste 2 taches");
      assert.equal(s.plan[i - 1].barres[0].calcul.split(" ÷ ")[1], "4");
      // le plan refait (même vérification que les gestes nouveaux, jetons visibles permis)
      const v = s.values;
      for(const e of s.plan) for(const b of e.barres){
        assert.equal(b.cells.reduce((a, x) => a + (x.kind === "unknown" ? v[x.color] : x.value), 0), Number(b.top), `« ${e.titre} »`);
        if(b.calcul) assert.equal(evaluer(b.calcul), Number(b.top));
      }
      assert.ok(!(JSON.stringify(c).match(/\d+/g) || []).some(sousEntendu));
    }
  });
}

test("Miroir 1-3 : la carte de la fiche 27 (planche B) — 1 verte + 3 bleues = 25 ; 3 vertes + 1 bleue = 19", () => {
  const plan = sys.plan({ geste: "MIROIR", colors: ["green", "blue"], values: { green: 4, blue: 7 }, boards: [
    { counts: { green: 1, blue: 3 }, total: 25, visible: [] }, { counts: { green: 3, blue: 1 }, total: 19 }] });
  const resume = plan.map((e) => [e.titre, e.barres.map((b) => `${b.top}${b.calcul ? ` (${b.calcul})` : ""} : ${b.cells.map((c) => (c.kind === "block" ? `[${c.value}]` : c.kind === "known" ? `${c.color}=${c.value}` : c.color)).join(" ")}`)]);
  assert.deepEqual(resume, [
    ["Les deux plateaux", ["25 : green blue blue blue", "19 : green blue green green"]],
    ["J’additionne : je range par paires", ["44 (25 + 19) : green blue green blue green blue green blue"]],
    ["Je partage", ["11 (44 ÷ 4) : green blue"]],
    ["Je retrouve 1 paire dans le plateau", ["25 : [11] blue blue"]],
    ["Je retire", ["14 (25 − 11) : blue blue"]],
    ["Je partage", ["7 (14 ÷ 2) : blue"]],
    ["Je remplace", ["11 : green blue=7"]],
    ["Je retire", ["4 (11 − 7) : green"]],
    ["Je vérifie", []]
  ]);
});

// --- la correction de sysFormesDouble ------------------------------------------------------

test("Doubler : le petit plateau recopié ne dépasse qu'avec 2 fois (3 N + V et N + V était un « je retire »)", () => {
  assert.deepEqual(sys.formesDouble(2, "12", "INDICE"), [[1, 2, 1]], "2 fois : la forme d'avant (2 N + 3 V et N + 2 V)");
  assert.deepEqual(sys.formesDouble(2, "11", "INDICE"), []);
  assert.deepEqual(sys.formesDouble(3, "11", "INDICE"), []);
  assert.deepEqual(sys.formesDouble(3, "12", "INDICE"), []);
  for(const sens of ["INDICE", "MIX"]){
    assert.equal(sys.normaliser({ fois: 3, sens }).sens, "PLATEAU");
    assert.equal(JSON.stringify(sys.serie(31, 12, { geste: "DOUBLE", fois: 3, sens })), JSON.stringify(sys.serie(31, 12, { geste: "DOUBLE", fois: 3 })));
  }
  assert.equal(sys.normaliser({ sens: "INDICE" }).sens, "INDICE");
  assert.equal(sys.normaliser({ sens: "MIX" }).sens, "MIX");
  // jamais une carte où le grand plateau est le petit plateau recopié moins de fois, plus des taches A
  for(const r of [{ fois: 3, sens: "INDICE" }, { fois: 3, sens: "MIX" }, { sens: "INDICE" }, { sens: "MIX" }]) for(const c of tirer({ geste: "DOUBLE", ...r }, 40)){
    const [P, I] = c._sys.boards, [A, B] = c._sys.colors;
    const k = compte(P, A) / compte(I, A);
    for(let j = 1; j < k; j++) assert.ok(!(compte(P, B) === j * compte(I, B)), `${forme(c)} : un « je retire » déguisé`);
  }
});

// --- le type des cartes (render.py, cartes jumelles) ------------------------------------------

test("sysTypeCarte : les codes d'avant à l'identique, les codes nouveaux", () => {
  /* le typeSys de render.py jusqu'au lot M4-5, recopié tel quel */
  const avant = (c) => {
    const S = c._sys, b = S.boards, n = (B, k) => B.counts[k] || 0, [A, Bk] = S.colors;
    if(S.geste === "PARTIELLE") return "1a";
    if(S.geste === "COEF") return n(b[0], Bk) - n(b[1], Bk) === 1 ? "1b" : "1c";
    if(S.geste === "EMBOITE1") return "1d";
    if(S.geste === "ESCALIER") return "1e";
    if(S.geste === "MIROIR") return "3a";
    if(S.geste === "TROIS") return "3b";
    if(S.geste === "DOUBLE"){
      const k = n(b[0], A) / n(b[1], A);
      if(n(b[0], Bk) < k * n(b[1], Bk)) return k === 2 ? "2d" : "2b-";
      return k === 3 ? "2b" : (n(b[1], Bk) === 2 ? "2c" : "2a");
    }
    return "?";
  };
  const anciens = { geste: "MIX", gestes: ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS", "ESCALIER"], sens: "MIX" };
  for(const r of [anciens, { ...anciens, fois: 3, indice: "12" }, { ...anciens, visMin: 1, visMax: 3, ordre: "MELANGE" }]){
    for(const c of tirer(r, 60)) assert.equal(sys.type(c), avant(c));
  }
  const vus = new Set();
  for(const r of [{ geste: "RECOPIE", fois: "MIX" }, { geste: "RECOPIE", fois: 4 }, { geste: "ETAGES", fois: "MIX", forme: "MIX", sens: "MIX" }, { geste: "MIROIR", forme: "13" }]){
    for(const c of tirer(r, 40)) vus.add(sys.type(c));
  }
  for(const t of ["3c·2", "3c·3", "3c·4", "3a+", "4e·1b", "4e·1c", "4e·3a", "4e·3a+", "4e·3c·2", "4e·3c·3", "4e·2a", "4e·2d"]) assert.ok(vus.has(t), `${t} jamais vu`);
  assert.ok([...vus].every((t) => /^(3c·[234]|3a\+|4e·(1b|1c|3a\+?|3c·[23]|2a|2d))$/.test(t)), [...vus].join(", "));
  // render.py lit le type dans l'outil
  return readFile(new URL("../_sources/livret-splat-systeme/render.py", import.meta.url), "utf8").then((py) => {
    assert.match(py, /JS_TYPE = r"""const typeSys = c => sysTypeCarte\(c\);"""/);
  });
});

// --- réglages éteints : rien ne bouge -------------------------------------------------------

test("réglages éteints : les fiches et les séries du monde 4 (14/10) ont les mêmes cartes et le même corrigé", () => {
  /* les adresses de render.py au 14/10/2026 (fiches 25-28d, exemples, défi, séries du dos) ;
     l'empreinte (valeurs, plateaux, ordre, total, taches, ET le plan dessiné), calculée sur main
     d86a02f avant le lot */
  const T = "&totalMin=20&totalMax=60", V0 = "&visibleMin=0&visibleMax=0";
  const Q = [
    "mode=D&geste=MIX&gestes=PARTIELLE,COEF" + V0 + T + "&seed=24", "mode=D&geste=EMBOITE1" + V0 + T + "&seed=22",
    "mode=D&geste=DOUBLE&sens=MIX" + V0 + T + "&seed=222", "mode=D&geste=MIX&gestes=MIROIR,TROIS" + V0 + T + "&seed=53",
    "mode=D&geste=ESCALIER" + V0 + T + "&seed=3046", "mode=D&geste=DOUBLE&fois=3" + V0 + T + "&seed=1",
    "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR&visibleMin=1&visibleMax=3" + T + "&seed=1373",
    "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR,TROIS&indice=12&ordre=MELANGE" + V0 + T + "&seed=5673",
    "mode=D&geste=COEF&ecart=2" + V0 + T + "&seed=82", "mode=D&geste=COEF&ecart=2" + V0 + T + "&seed=5",
    "mode=D&geste=ESCALIER" + V0 + T + "&seed=180", "mode=D&geste=ESCALIER" + V0 + T + "&seed=6",
    "mode=D&geste=MIX&gestes=COEF,DOUBLE" + V0 + T + "&seed=187",
    "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF" + V0 + T, "mode=D&geste=MIX&gestes=DOUBLE,MIROIR,TROIS&sens=MIX" + V0 + T,
    "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR,TROIS&sens=MIX" + V0 + T, "mode=D&geste=ESCALIER" + V0 + T,
    "mode=D&geste=DOUBLE&fois=3" + V0 + T,
    "mode=D&geste=MIX&gestes=EMBOITE1,PARTIELLE,COEF,DOUBLE,MIROIR,TROIS,ESCALIER&sens=MIX&ordre=MELANGE&visibleMin=1&visibleMax=3" + T
  ];
  const NOMS = [["geste", "geste"], ["coefMax", "coefMax"], ["ecart", "ecart"], ["fois", "fois"], ["indice", "indice"], ["sens", "sens"], ["ordre", "ordre"],
    ["visibleMin", "visMin"], ["visibleMax", "visMax"], ["totalMin", "totalMin"], ["totalMax", "totalMax"]];
  const h = createHash("sha256");
  let n = 0;
  for(const q of Q){
    const p = new URLSearchParams(q), r = {};
    for(const [a, b] of NOMS) if(p.has(a)) r[b] = p.get(a);
    if(p.has("gestes")) r.gestes = p.get("gestes").split(",");
    for(const g of p.has("seed") ? [Number(p.get("seed"))] : [1, 2, 3, 4, 5, 6, 7, 8]) for(const c of sys.serie(g, 8, r)){
      const s = c._sys;
      h.update(JSON.stringify([s.geste, s.colors, s.values, s.boards, s.ordre || null, !!s.secours, c.total, c.hidden, c.visible, s.plan]));
      n++;
    }
  }
  assert.equal(n, 488);
  assert.equal(h.digest("hex"), "a2f23a48f4ac8af95ce6682d75831c5190a8561bb506e3d78e5885195e0f69e8");
});

test("réglages éteints : les gestes nouveaux ne sont dans aucun mélange par défaut ; la normalisation se relit à l'identique", () => {
  assert.deepEqual(sys.SYS_GESTES.slice(-2), ["RECOPIE", "ETAGES"], "ajoutés à la fin : l'ordre des gestes d'avant ne bouge pas");
  assert.ok(!sys.normaliser({}).gestes.includes("RECOPIE") && !sys.normaliser({}).gestes.includes("ETAGES"));
  const o = sys.normaliser({});
  assert.deepEqual([o.foisRecopie, o.forme, o.grand, o.sous], [2, "", "", "MIX"]);
  // genSystem normalise, puis genSystemCarte normalise encore : rien ne doit se perdre
  for(const r of [{ geste: "RECOPIE", fois: 4 }, { geste: "RECOPIE", fois: "MIX" }, { geste: "RECOPIE", fois: "3" }, { geste: "ETAGES", sous: "recopie", grand: "112", fois: "mix" },
    { geste: "MIROIR", forme: "13" }, { geste: "DOUBLE", fois: 3, sens: "INDICE", indice: "12" }, { geste: "DOUBLE", sens: "MIX" }, { ecart: "2+", ordre: "melange" }]){
    const a = sys.normaliser(r);
    assert.deepEqual(sys.normaliser(a), a, JSON.stringify(r));
    assert.equal(JSON.stringify(sys.serie(9, 6, a)), JSON.stringify(sys.serie(9, 6, r)), JSON.stringify(r));
  }
  assert.equal(sys.normaliser({ fois: 4 }).foisRecopie, 4);
  assert.equal(sys.normaliser({ fois: 4 }).fois, 2, "Doubler lit 4 fois comme 2 fois");
  assert.equal(sys.normaliser({ fois: "mix" }).foisRecopie, "MIX");
  assert.equal(sys.normaliser({ sous: "AUTRE" }).sous, "MIX");
  assert.equal(sys.normaliser({ grand: "121" }).grand, "");
});

test("jamais de carte « Erreur » : bornes impossibles → carte sûre ; combinaison impossible des petits plateaux → carte sûre", () => {
  for(const geste of ["RECOPIE", "ETAGES"]){
    for(const c of sys.serie(51, 3, { geste, totalMin: 1, totalMax: 3 })){ assert.equal(c._sys.secours, true); assert.equal(c._sys.geste, "EMBOITE1"); }
    // de grands totaux : le deuxième passage les atteint
    for(const c of sys.serie(52, 10, { geste, totalMin: 200, totalMax: 300 })){
      assert.ok(!c._sys.secours, `${geste} : 200-300 doit rester possible`);
      assert.equal(c._sys.geste, geste);
      assert.ok(c._sys.boards.every((b) => b.total <= 300));
    }
  }
  // petits plateaux « Doubler » 3 fois : 3 N + 4 V, une rangée de 4 — impossible en 3 taches par couleur
  const c = sys.carte(5, { geste: "ETAGES", sous: "DOUBLE", fois: 3 });
  assert.equal(c._sys.secours, true);
});

// --- le panneau et les adresses ---------------------------------------------------------

test("le panneau : les deux gestes nouveaux (noms courts), Recopier 4 fois / au hasard, Miroir, Grand plateau, Petits plateaux", () => {
  const panneau = html.slice(html.indexOf('<div id="systemSettings"'), html.indexOf("<!-- Réglages d'affichage"));
  assert.match(panneau, /<option value="RECOPIE">Je recopie, puis je retire<\/option>\s*<option value="ETAGES">Deux gestes à la suite<\/option>\s*<option value="MIX">Mélange<\/option>/);
  assert.match(panneau, /id="sysMixRECOPIE">/);
  assert.match(panneau, /id="sysMixETAGES">/);
  assert.match(panneau, /<select id="sysFois"[^>]*>\s*<option value="2" selected>2 fois<\/option>\s*<option value="3">3 fois<\/option>\s*<option value="4">4 fois<\/option>\s*<option value="MIX">2 ou 3 fois, au hasard<\/option>/);
  assert.match(panneau, /<select id="sysForme"[^>]*>\s*<option value="" selected>1-2 ou 2-3<\/option>\s*<option value="12">1-2<\/option>\s*<option value="23">2-3<\/option>\s*<option value="13">1-3<\/option>\s*<option value="MIX">1-2, 2-3 ou 1-3<\/option>/);
  assert.match(panneau, /<select id="sysGrand"[^>]*>\s*<option value="" selected>2 \+ 1 \+ 1 ou 1 \+ 1 \+ 2<\/option>\s*<option value="211">2 \+ 1 \+ 1<\/option>\s*<option value="112">1 \+ 1 \+ 2<\/option>/);
  assert.match(panneau, /<select id="sysSous"[^>]*>\s*<option value="MIX" selected>Au hasard<\/option>\s*<option value="COEF">Je retire<\/option>\s*<option value="MIROIR">J’additionne \(miroir\)<\/option>\s*<option value="RECOPIE">Je recopie, puis je retire<\/option>\s*<option value="DOUBLE">Doubler<\/option>/);
  for(const id of ["sysFormeRow", "sysGrandRow", "sysSousRow"]) assert.match(panneau, new RegExp(`id="${id}" style="display:none`));
  assert.match(html, /const sharedNames = \[[^\]]*"forme", "grand", "sous"/);
  assert.match(fn("lireReglagesSysteme"), /forme: sysFormeEl \? sysFormeEl\.value : "",\s*grand: sysGrandEl \? sysGrandEl\.value : "",\s*sous: sysSousEl \? sysSousEl\.value : "MIX"/);
});

test("adresses : forme, grand, sous, fois=4|MIX — écrits seulement quand le geste les lit et qu'ils sont allumés, relus à l'identique", () => {
  const liste = (value, options) => ({ value, tagName: "SELECT", options: options.map((v) => ({ value: v, disabled: false })) });
  const page = (geste, coches = ["EMBOITE1", "PARTIELLE", "COEF", "TROIS"]) => ({
    sysGesteEl: liste(geste, ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS", "ESCALIER", "RECOPIE", "ETAGES", "MIX"]),
    sysEcartEl: liste("", ["", "1", "2"]), sysFoisEl: liste("2", ["2", "3", "4", "MIX"]), sysIndiceEl: liste("11", ["11", "12"]),
    sysSensEl: liste("PLATEAU", ["PLATEAU", "INDICE", "MIX"]), sysOrdreEl: liste("", ["", "MELANGE"]),
    sysFormeEl: liste("", ["", "12", "23", "13", "MIX"]), sysGrandEl: liste("", ["", "211", "112"]), sysSousEl: liste("MIX", ["MIX", "COEF", "MIROIR", "RECOPIE", "DOUBLE"]),
    sysPasAPasEl: { checked: true },
    document: { getElementById: (id) => (id.startsWith("sysMix") ? { checked: coches.includes(id.slice(6)) } : null) }
  });
  const monter = (els) => new Function(...Object.keys(els), `
    ${CONSTANTES_SYS}
    ${fn("sysLireGestesMix")}
    ${fn("sysGestesLus")}
    ${fn("sysLireReglagesM4")}
    ${fn("sysEcrireReglagesM4")}
    return { lire: sysLireReglagesM4, ecrire: sysEcrireReglagesM4, lus: sysGestesLus };`)(...Object.values(els));
  const ecrire = (els) => { const p = new URLSearchParams(); monter(els).ecrire(p); return p.toString(); };
  // éteints : rien n'est écrit
  for(const g of ["RECOPIE", "ETAGES", "MIROIR", "DOUBLE", "MIX"]) assert.equal(ecrire(page(g)), "", g);
  // Je recopie : fois=3, 4 ou MIX
  for(const f of ["3", "4", "MIX"]){ const a = page("RECOPIE"); a.sysFoisEl.value = f; assert.equal(ecrire(a), `fois=${f}`); }
  // Doubler seul : 4 et MIX ne s'écrivent pas (Doubler les lit comme 2 fois)
  for(const f of ["4", "MIX"]){ const a = page("DOUBLE"); a.sysFoisEl.value = f; assert.equal(ecrire(a), ""); }
  // Miroir : forme ; un autre geste ne l'écrit pas
  { const a = page("MIROIR"); a.sysFormeEl.value = "13"; assert.equal(ecrire(a), "forme=13"); }
  { const a = page("COEF"); a.sysFormeEl.value = "13"; a.sysGrandEl.value = "211"; a.sysSousEl.value = "COEF"; assert.equal(ecrire(a), ""); }
  // Deux gestes à la suite : grand, sous, et les réglages du geste de ses petits plateaux
  { const a = page("ETAGES"); a.sysGrandEl.value = "112"; a.sysSousEl.value = "RECOPIE"; a.sysFoisEl.value = "MIX"; a.sysFormeEl.value = "13"; a.sysEcartEl.value = "1";
    assert.equal(ecrire(a), "fois=MIX&grand=112&sous=RECOPIE", "petits plateaux Je recopie : ni forme ni écart");
    assert.deepEqual(monter(a).lus(), { coef: false, double: false, recopie: true, miroir: false, etages: true }); }
  { const a = page("ETAGES"); a.sysFormeEl.value = "13"; a.sysEcartEl.value = "1"; a.sysFoisEl.value = "3"; a.sysSensEl.value = "INDICE";
    assert.equal(ecrire(a), "ecart=1&fois=3&sens=INDICE&forme=13", "au hasard : les réglages des quatre gestes");
    assert.deepEqual(monter(a).lus(), { coef: true, double: true, recopie: true, miroir: true, etages: true }); }
  // Mélange : seulement les gestes cochés
  { const a = page("MIX", ["COEF", "RECOPIE"]); a.sysFoisEl.value = "4"; a.sysFormeEl.value = "13"; assert.equal(ecrire(a), "fois=4"); }
  // relecture : une page neuve retrouve les mêmes réglages ; absents = remis à zéro
  const b = page("ETAGES");
  monter(b).lire(new URLSearchParams("fois=mix&forme=13&grand=112&sous=recopie"));
  assert.deepEqual([b.sysFoisEl.value, b.sysFormeEl.value, b.sysGrandEl.value, b.sysSousEl.value], ["MIX", "13", "112", "RECOPIE"]);
  monter(b).lire(new URLSearchParams("mode=D&geste=ETAGES"));
  assert.deepEqual([b.sysFoisEl.value, b.sysFormeEl.value, b.sysGrandEl.value, b.sysSousEl.value], ["2", "", "", "MIX"]);
  monter(b).lire(new URLSearchParams("fois=9&forme=31&grand=222&sous=TROIS"));
  assert.deepEqual([b.sysFoisEl.value, b.sysFormeEl.value, b.sysGrandEl.value, b.sysSousEl.value], ["2", "", "", "MIX"]);
  // le panneau montre les réglages lus
  assert.match(fn("sysAfficherReglagesM4"), /montrer\("sysFoisRow", double \|\| recopie\);/);
  assert.match(fn("sysAfficherReglagesM4"), /if\(o\.value === "4" \|\| o\.value === "MIX"\) o\.hidden = !recopie;/);
  assert.match(fn("sysAfficherReglagesM4"), /montrer\("sysFormeRow", miroir\);/);
  assert.match(fn("sysAfficherReglagesM4"), /\["sysGrandRow", "sysSousRow"\]\.forEach\(id => montrer\(id, etages\)\);/);
});

test("le filtre des nombres à sous-entendu lit le plan dessiné des gestes nouveaux (et le plan d'avant des autres)", () => {
  const plan = fn("sysPlanS3");
  assert.match(plan, /if\(sit\.geste === "RECOPIE" \|\| sit\.geste === "ETAGES"\) return sysPlan\(sit\);/);
  const sit = { geste: "RECOPIE", colors: ["black", "blue"], values: { black: 7, blue: 6 }, boards: [{ counts: { black: 1, blue: 3 }, total: 25, visible: [] }, { counts: { black: 2, blue: 1 }, total: 20 }] };
  assert.deepEqual(sys.planS3(sit), sys.plan(sit));
  const m13 = { geste: "MIROIR", colors: ["green", "blue"], values: { green: 4, blue: 7 }, boards: [{ counts: { green: 1, blue: 3 }, total: 25, visible: [] }, { counts: { green: 3, blue: 1 }, total: 19 }] };
  assert.deepEqual(sys.planS3(m13), sys.plan(m13));
  const m12 = { geste: "MIROIR", colors: ["green", "blue"], values: { green: 4, blue: 7 }, boards: [{ counts: { green: 1, blue: 2 }, total: 18, visible: [] }, { counts: { green: 2, blue: 1 }, total: 15 }] };
  assert.ok(sys.planS3(m12)[0].calculs, "le miroir d'avant garde son plan d'avant");
});
