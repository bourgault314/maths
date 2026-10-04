/* SPLAT! — le Système (mode D), lot M4-1 « le générateur » (01/10/2026).
   Les nouveaux types du plan du monde 4 (monde-4-audit-et-plan.md, § 2, 3 et 8) :
     1b  COEF, ecart=1   le grand plateau a une seule tache de plus
     1c  COEF, ecart=2   plusieurs taches de plus : on partage
     1e  ESCALIER        trois plateaux emboîtés (2 A ; 2 A + bB ; 2 A + bB + cC)
     2b  DOUBLE, fois=3  le petit plateau recopié 3 fois
     2c  DOUBLE, indice=12   le petit plateau 1 + 2 recopié 2 fois
     2d  DOUBLE, sens=INDICE c'est le petit plateau recopié qui dépasse
     ordre=MELANGE       les plateaux dessinés dans le désordre
   Pour chaque type, quelques milliers de cartes : solution unique, entière, valeurs toutes
   différentes et ≥ 2, 7 taches au plus, totaux dans les bornes, plan refait calcul par calcul,
   jamais « Erreur ». Puis : réglages éteints = mêmes cartes, ordre mélangé tiré après tout le
   reste, 7 taches dans les tables de place, grille et dessin des plateaux, adresses. */
import assert from "node:assert/strict";
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
const CONSTANTES_SYS = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS", "SYS_COULEURS_PLURIEL", "SYS_PLAGES"]
  .map((nom) => ligne(`const ${nom} = `)).join("\n");
const FONCTIONS_SYS = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure",
  "sysAssemblerCarte", "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan", "sysLireGestes"].map(fn).join("\n");
const DESSIN = ["SYS_ZONE_ECRAN", "SYS_ZONE_IMPRIME", "SYS_ZONE_IMPRIME_6", "SYS_ZONE_ECRAN_CORRECTION", "SYS_ZONE_IMPRIME_CORRECTION", "SYS_ZONE_TEL_CORRECTION", "SYS_TACHE"]
  .map((nom) => ligne(`const ${nom} = `)).join("\n")
  + ["sysRayonJeton", "sysGrille", "sysColonnesVisibles", "sysRayonMax", "sysDispositionPlateaux"].map(fn).join("\n");

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
  ${DESSIN}
  return {
    SYS_GESTES, SYS_MAX_TACHES, SYS_PLAGES,
    zones: { ECRAN: SYS_ZONE_ECRAN, IMPRIME: SYS_ZONE_IMPRIME, IMPRIME_6: SYS_ZONE_IMPRIME_6,
      ECRAN_CORRECTION: SYS_ZONE_ECRAN_CORRECTION, IMPRIME_CORRECTION: SYS_ZONE_IMPRIME_CORRECTION, TEL_CORRECTION: SYS_ZONE_TEL_CORRECTION },
    TACHE: SYS_TACHE,
    mot: (k) => investigateColorWord(investigateColorByKey(k)),
    initiale: (k) => investigateColorInitial(investigateColorByKey(k)),
    pluriel: (k) => SYS_COULEURS_PLURIEL[k],
    normaliser: sysNormaliserReglages,
    formes: (geste, r) => sysFormes(geste, sysNormaliserReglages(r)),
    /* le plan de S3, que le générateur filtre toujours (lot M4-2) */
    plan: sysPlanS3,
    grille: sysGrille,
    disposition: sysDispositionPlateaux,
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
const tirer = (reglages, nGraines = 250, parGraine = 10) => graines(nGraines).flatMap((g) => sys.serie(g, parGraine, reglages));
const forme = (carte) => carte._sys.boards.map((b) => carte._sys.colors.map((k) => b.counts[k] || 0).join("+")).join(" | ");

// --- vérification d'une carte (calculs du plan refaits) -------------------------------
function lexique(carte){
  const lex = new Map();
  for(const k of carte._sys.colors){
    const v = carte._sys.values[k];
    lex.set(sys.mot(k), v);
    lex.set(sys.pluriel(k), v);
    lex.set(sys.initiale(k), v);
  }
  return lex;
}
function evaluer(expr, lex){
  const jetons = expr.match(/\d+|[A-Za-zÀ-ÖØ-öø-ÿ’]+|[×÷+−()]/g) || [];
  assert.equal(jetons.join(""), expr.replace(/\s+/g, ""), `caractère inattendu dans « ${expr} »`);
  let i = 0;
  const facteur = () => {
    const t = jetons[i++];
    if(t === "("){ const x = somme(); assert.equal(jetons[i++], ")"); return x; }
    if(/^\d+$/.test(t)) return Number(t);
    assert.ok(lex.has(t), `mot inconnu « ${t} » dans « ${expr} »`);
    return lex.get(t);
  };
  const produit = () => {
    let x = facteur();
    for(;;){
      const t = jetons[i];
      if(t === "×"){ i++; x *= facteur(); }
      else if(t === "÷"){ i++; const d = facteur(); assert.equal(x % d, 0, `division non exacte dans « ${expr} »`); x /= d; }
      else if(t !== undefined && t !== "+" && t !== "−" && t !== ")"){ x *= facteur(); }
      else return x;
    }
  };
  const somme = () => {
    let x = produit();
    while(jetons[i] === "+" || jetons[i] === "−"){ const op = jetons[i++]; const y = produit(); x = op === "+" ? x + y : x - y; }
    return x;
  };
  const r = somme();
  assert.equal(i, jetons.length, `fin inattendue dans « ${expr} »`);
  return r;
}
function verifierLigne(texte, lex){
  const l = texte.replace(/\s*✓$/, "");
  if(/:$/.test(l)) return;
  const parts = l.split(" = ");
  assert.ok(parts.length >= 2, `pas d'égalité dans « ${texte} »`);
  const valeurs = parts.map((p) => evaluer(p, lex));
  assert.ok(valeurs.every((x) => x === valeurs[0]), `ligne fausse : « ${texte} » (${valeurs.join(" / ")})`);
}
function valeurCase(c, carte){
  if(c.kind === "unknown" || c.kind === "known") return carte._sys.values[c.color];
  if(c.kind === "visible") return c.value;
  if(c.kind === "rest") return c.covers.reduce((s, x) => s + valeurCase(x, carte), 0);
  throw new Error(`case inconnue ${c.kind}`);
}
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
function verifierCarte(carte, reglages){
  const o = sys.normaliser(reglages);
  const s = carte._sys;
  const C = s.colors;
  const vals = C.map((k) => s.values[k]);
  assert.ok(vals.every((x) => Number.isInteger(x) && x >= 2), `valeurs ${vals}`);
  assert.equal(new Set(vals).size, vals.length, `deux couleurs de même valeur : ${vals}`);
  s.boards.forEach((b, i) => {
    const taches = Object.values(b.counts).reduce((a, x) => a + x, 0);
    assert.ok(taches >= 1 && taches <= 7, `plateau ${i} : ${taches} taches`);
    assert.ok(Object.keys(b.counts).every((k) => C.includes(k) && b.counts[k] >= 1));
    if(i > 0) assert.ok(!b.visible || b.visible.length === 0, "visibles hors du plateau principal");
    if(b.total !== null){
      const somme = C.reduce((a, k) => a + (b.counts[k] || 0) * s.values[k], 0) + (b.visible || []).reduce((a, x) => a + x, 0);
      assert.equal(somme, b.total, `plateau ${i} : total faux`);
    }
  });
  const lignes = s.boards.filter((b) => b.total !== null).map((b) => C.map((k) => b.counts[k] || 0));
  assert.equal(rang(lignes), C.length, "la carte n'a pas une solution unique");
  // la carte telle que la page la lit
  const P = s.boards[0];
  const attendu = C.flatMap((k) => Array(P.counts[k] || 0).fill(k));
  assert.deepEqual(carte._colorMap, attendu);
  assert.deepEqual(carte.hidden, attendu.map((k) => s.values[k]));
  assert.equal(carte._num.tasks, carte.hidden.length);
  if(P.total !== null) assert.equal(carte.total, P.total);
  assert.equal(carte._inv.indices.length, s.boards.length - 1);
  // le plan de S3, que le générateur filtre (le plan dessiné du lot M4-2 a son propre test)
  const json = JSON.stringify(Object.assign({}, carte, { _sys: Object.assign({}, carte._sys, { plan: sys.plan(carte._sys) }) }));
  assert.ok(!(json.match(/\d+/g) || []).some(sousEntendu), "nombre à sous-entendu");
  assert.doesNotMatch(json, /Erreur/);
  // le plan de S3 (filtré par le générateur) : chaque calcul juste, en mots et en lettres ;
  // chaque barre juste. Le plan dessiné (lot M4-2) a son propre test.
  const lex = lexique(carte);
  const etablies = new Set();
  const planS3 = sys.plan(s);
  planS3.forEach((etape, n) => {
    assert.ok(etape.titre && etape.role, `étape ${n} sans titre`);
    assert.equal(etape.calculs.length, etape.lettres.length);
    for(const l of etape.calculs.concat(etape.lettres)) verifierLigne(l, lex);
    for(const barre of etape.barres){
      assert.ok(barre.span >= 1 && barre.span <= barre.cells.length);
      const haut = Number(barre.top.match(/(\d+)$/)[1]);
      assert.equal(barre.cells.slice(0, barre.span).reduce((a, c) => a + valeurCase(c, carte), 0), haut, `étape ${n} : barre « ${barre.top} »`);
      for(const c of barre.cells) if(c.kind === "known") assert.ok(etablies.has(c.color), `étape ${n} : ${c.color} montrée avant d'être trouvée`);
    }
    if(etape.role !== "verification") for(const l of etape.calculs){
      for(const k of C){
        const m = l.match(new RegExp(`^${sys.mot(k)} = (?:.* = )?(\\d+)$`));
        if(m){ assert.equal(Number(m[1]), s.values[k]); etablies.add(k); }
      }
    }
  });
  assert.equal(etablies.size, C.length, "le plan ne trouve pas toutes les couleurs");
  const verif = planS3[planS3.length - 1];
  assert.equal(verif.role, "verification");
  assert.equal(verif.calculs.length, s.boards.filter((b) => b.total !== null).length);
  // réglages
  if(!s.secours){
    assert.ok(carte.total >= o.totalMin && carte.total <= o.totalMax, `total ${carte.total}`);
    if(s.geste !== "TROIS") assert.ok(carte.visible.length >= o.visMin && carte.visible.length <= o.visMax);
  }
  return s;
}

/* Les types nouveaux, avec et sans jetons visibles. */
const TYPES = {
  "1b": { geste: "COEF", ecart: "1" },
  "1c": { geste: "COEF", ecart: "2" },
  "1e": { geste: "ESCALIER" },
  "2b": { geste: "DOUBLE", fois: 3 },
  "2c": { geste: "DOUBLE", indice: "12" },
  "2d": { geste: "DOUBLE", sens: "INDICE" }
};
const CARTES = {};
for(const [type, r] of Object.entries(TYPES)){
  CARTES[type] = tirer({ ...r, visMin: 0, visMax: 0 }).concat(tirer({ ...r, visMin: 1, visMax: 3 }, 100));
}

for(const [type, r] of Object.entries(TYPES)){
  test(`${type} (${JSON.stringify(r)}) : 3 500 cartes justes — solution unique, valeurs, 7 taches au plus, plan refait`, () => {
    const cartes = CARTES[type];
    assert.equal(cartes.length, 3500);
    const plage = sys.SYS_PLAGES[r.geste];
    for(const [i, carte] of cartes.entries()){
      const reglages = { ...r, visMin: i < 2500 ? 0 : 1, visMax: i < 2500 ? 0 : 3 };
      const s = verifierCarte(carte, reglages);
      assert.equal(s.geste, r.geste);
      assert.ok(!s.secours, "jamais de carte de secours aux réglages des fiches");
      for(const k of s.colors) assert.ok(s.values[k] >= plage.vMin && s.values[k] <= plage.vMax, `valeur ${s.values[k]} hors plage`);
      for(const b of s.boards.slice(1)) assert.ok(b.total >= plage.sousMin && b.total <= plage.sousMax, `sous-total ${b.total} hors plage`);
    }
    assert.ok(new Set(cartes.map((c) => JSON.stringify([c._sys.colors, c._sys.boards]))).size > cartes.length / 2, "cartes trop répétées");
  });
}

test("les formes de chaque type nouveau (plan § 2 et décisions du 01/10)", () => {
  const vues = (type) => [...new Set(CARTES[type].map(forme))].sort();
  // 1b : une tache de plus ; 1c : au moins deux de plus (coefMax 3 par défaut)
  for(const c of CARTES["1b"]){ const [P, I] = c._sys.boards; const Y = c._sys.colors[1]; assert.equal(P.counts[Y] - I.counts[Y], 1); }
  for(const c of CARTES["1c"]){ const [P, I] = c._sys.boards; const Y = c._sys.colors[1]; assert.ok(P.counts[Y] - I.counts[Y] >= 2); }
  assert.deepEqual(vues("1b"), ["1+2 | 1+1", "1+3 | 1+2", "2+2 | 2+1", "2+3 | 2+2", "3+2 | 3+1", "3+3 | 3+2"]);
  assert.deepEqual(vues("1c"), ["1+3 | 1+1", "2+3 | 2+1", "3+3 | 3+1"]);
  // 1e : 2 A ; 2 A + bB ; 2 A + bB + cC (le plus petit plateau a toujours 2 taches, 01/10)
  assert.deepEqual(vues("1e"), ["2+1+1 | 2+1+0 | 2+0+0", "2+1+2 | 2+1+0 | 2+0+0", "2+2+1 | 2+2+0 | 2+0+0", "2+2+2 | 2+2+0 | 2+0+0"]);
  // 2b : 3 N + 4 V et N + V ; 2c : 2 N + 5 V et N + 2 V ; 2d : 2 N + 3 V et N + 2 V
  assert.deepEqual(vues("2b"), ["3+4 | 1+1"]);
  assert.deepEqual(vues("2c"), ["2+5 | 1+2"]);
  assert.deepEqual(vues("2d"), ["2+3 | 1+2"]);
  for(const c of CARTES["2d"]){
    const [P, I] = c._sys.boards;
    assert.ok(P.total > I.total, "le grand plateau reste le premier");
    assert.ok(2 * I.total > P.total - (P.visible || []).reduce((a, x) => a + x, 0), "le petit plateau doublé dépasse");
  }
  // les autres combinaisons de DOUBLE (7 taches au plus)
  const d = (r) => sys.formes("DOUBLE", r);
  assert.deepEqual(d({}), [[1, 1, 1], [1, 1, 2]], "par défaut : les deux formes d'avant (2 + 3 et 2 + 4)");
  assert.deepEqual(d({ fois: 3, sens: "INDICE" }), [[1, 1, 2]], "3 fois, sens INDICE : 3 N + V et N + V");
  // une combinaison impossible prend l'autre indice, sans carte « Erreur »
  assert.equal(sys.normaliser({ fois: 3, indice: "12" }).indice, "11");
  assert.equal(sys.normaliser({ sens: "INDICE" }).indice, "12");
  assert.equal(sys.normaliser({ fois: 3, indice: "12", sens: "INDICE" }).indice, "11");
  for(const r of [{ fois: 3, indice: "12" }, { fois: 3, sens: "INDICE" }, { fois: 3, indice: "12", sens: "INDICE" }]){
    for(const c of tirer({ geste: "DOUBLE", ...r }, 30)) verifierCarte(c, { geste: "DOUBLE", ...r });
  }
  // sens INDICE : jamais « le grand plateau = l'indice recopié une fois de moins + des taches A »
  for(const c of tirer({ geste: "DOUBLE", fois: 3, sens: "INDICE" }, 30)){
    const [P, I] = c._sys.boards; const [, B] = c._sys.colors;
    assert.notEqual(3 * I.counts[B] - P.counts[B], I.counts[B]);
  }
});

test("plans des cartes-types du plan (planches 3 et 4) : titres et calculs", () => {
  const n = "black", vi = "purple", o = "orange", r = "red";
  // 1e : 2 N = 12 ; 2 N + V = 19 ; 2 N + V + 2 O = 35
  const e = sys.plan({ geste: "ESCALIER", colors: [n, vi, o], values: { black: 6, purple: 7, orange: 8 }, boards: [
    { counts: { black: 2, purple: 1, orange: 2 }, total: 35, visible: [] }, { counts: { black: 2, purple: 1 }, total: 19 }, { counts: { black: 2 }, total: 12 }] });
  assert.deepEqual(e.map((x) => x.titre), ["Le plateau entier", "L’indice : une partie du plateau", "Ce qui reste : les orange, on partage",
    "Le plus petit plateau : une partie de l’indice", "Vérification"]);
  assert.deepEqual(e.map((x) => x.calculs), [["2 noires + 1 violette + 2 orange = 35"], ["ce qui reste :", "35 − 19 = 16"], ["2 orange = 16", "orange = 16 ÷ 2 = 8"],
    ["ce qui reste :", "19 − 12 = 7", "violette = 7", "2 noires = 12", "noire = 12 ÷ 2 = 6"], ["2 × 6 + 7 + 2 × 8 = 12 + 7 + 16 = 35 ✓", "2 × 6 + 7 = 19 ✓", "2 × 6 = 12 ✓"]]);
  // 1b : N + 3 R = 21 ; N + 2 R = 16
  const b = sys.plan({ geste: "COEF", colors: [n, r], values: { black: 6, red: 5 }, boards: [
    { counts: { black: 1, red: 3 }, total: 21, visible: [] }, { counts: { black: 1, red: 2 }, total: 16 }] });
  assert.deepEqual(b[2].calculs, ["rouge = 5"]);
  assert.equal(b[2].titre, "Ce qui reste : une tache rouge");
  // 2b : N + V = 9 ; 3 N + 4 V = 31
  const t = sys.plan({ geste: "DOUBLE", colors: [n, vi], values: { black: 5, purple: 4 }, boards: [
    { counts: { black: 3, purple: 4 }, total: 31, visible: [] }, { counts: { black: 1, purple: 1 }, total: 9 }] });
  assert.deepEqual(t.map((x) => x.titre), ["Le plateau entier", "L’indice, puis l’indice triplé", "On compare au plateau : ce qui reste", "Dans l’indice : on retire la violette", "Vérification"]);
  assert.deepEqual(t[1].calculs, ["1 noire + 1 violette = 9", "on triple :", "3 noires + 3 violettes = 27"]);
  assert.equal(t[1].barres[1].top, "9 + 9 + 9 = 27");
  assert.deepEqual(t[2].calculs, ["ce qui reste :", "31 − 27 = 4", "violette = 4"]);
  // 2c : N + 2 V = 10 ; 2 N + 5 V = 23
  const c = sys.plan({ geste: "DOUBLE", colors: [n, vi], values: { black: 4, purple: 3 }, boards: [
    { counts: { black: 2, purple: 5 }, total: 23, visible: [] }, { counts: { black: 1, purple: 2 }, total: 10 }] });
  assert.deepEqual(c[1].calculs, ["1 noire + 2 violettes = 10", "on double :", "2 noires + 4 violettes = 20"]);
  assert.deepEqual(c[3].calculs, ["noire = 10 − 3 − 3", "noire = 4"]);
  // 2d : N + 2 V = 14 ; 2 N + 3 V = 23 — c'est le petit plateau doublé qui dépasse
  const d = sys.plan({ geste: "DOUBLE", colors: [n, vi], values: { black: 4, purple: 5 }, boards: [
    { counts: { black: 2, purple: 3 }, total: 23, visible: [] }, { counts: { black: 1, purple: 2 }, total: 14 }] });
  assert.equal(d[2].titre, "L’indice doublé dépasse le plateau : ce qu’il a en plus");
  assert.deepEqual(d[2].calculs, ["ce qu’il a en plus :", "28 − 23 = 5", "violette = 5"]);
  assert.deepEqual(d[2].lettres, ["ce qu’il a en plus :", "28 − 23 = 5", "Vi = 5"]);
  // 2d avec deux jetons visibles (3 et 4) : le plateau sans les jetons, d'abord
  const dv = sys.plan({ geste: "DOUBLE", colors: [n, vi], values: { black: 4, purple: 5 }, boards: [
    { counts: { black: 2, purple: 3 }, total: 30, visible: [3, 4] }, { counts: { black: 1, purple: 2 }, total: 14 }] });
  assert.deepEqual(dv[2].calculs, ["le plateau sans les jetons visibles :", "30 − 7 = 23", "ce qu’il a en plus :", "28 − 23 = 5", "violette = 5"]);
});

test("réglages éteints : mêmes formes et mêmes cartes qu'avant le lot (valeurs par défaut écrites ou absentes)", () => {
  assert.deepEqual(sys.normaliser({}).ecart, "");
  assert.equal(sys.normaliser({ ecart: "2+" }).ecart, "2", "« ecart=2+ » se lit comme « 2 »");
  assert.equal(sys.normaliser({ ordre: "melange" }).ordre, "MELANGE");
  for(const geste of ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS"]){
    for(const coefMax of [1, 2, 3, 4]){
      const avant = JSON.stringify(sys.serie(77, 40, { geste, coefMax }));
      assert.equal(JSON.stringify(sys.serie(77, 40, { geste, coefMax, ecart: "", fois: 2, indice: "11", sens: "PLATEAU", ordre: "" })), avant, `${geste}, coefMax ${coefMax}`);
    }
  }
  // COEF sans écart : toujours 6 taches au plus (les formes d'avant), même à coefMax 4
  assert.ok(tirer({ geste: "COEF", coefMax: 4, totalMax: 90 }, 60).every((c) => c._sys.boards.every((b) => Object.values(b.counts).reduce((a, x) => a + x, 0) <= 6)));
  // avec un écart et coefMax 4, 7 taches deviennent possibles
  const sept = tirer({ geste: "COEF", coefMax: 4, ecart: "1", totalMax: 90 }, 80);
  sept.forEach((c) => verifierCarte(c, { geste: "COEF", coefMax: 4, ecart: "1", totalMax: 90 }));
  assert.ok(sept.some((c) => Object.values(c._sys.boards[0].counts).reduce((a, x) => a + x, 0) === 7));
  // ecart=2 avec coefMax 1 ou 2 : on garde 3 taches pour pouvoir partager
  for(const c of tirer({ geste: "COEF", coefMax: 1, ecart: "2" }, 20)){
    const [P, I] = c._sys.boards; const Y = c._sys.colors[1];
    assert.ok(P.counts[Y] - I.counts[Y] >= 2);
  }
});

test("ordre=MELANGE : tiré après tout le reste — la carte ne change pas, seul l'ordre des plateaux", () => {
  const vus = new Set();
  for(const geste of ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS", "ESCALIER"]){
    for(const g of graines(150)){
      const sans = sys.carte(g, { geste });
      const avec = sys.carte(g, { geste, ordre: "MELANGE" });
      const { ordre, ...reste } = avec._sys;
      assert.deepEqual({ ...avec, _sys: reste }, sans, `${geste}, graine ${g} : la carte a changé`);
      assert.deepEqual([...ordre].sort(), sans._sys.boards.map((_, i) => i));
      vus.add(`${sans._sys.boards.length}:${ordre.join("")}`);
      assert.equal(sans._sys.ordre, undefined, "éteint : pas d'ordre");
    }
  }
  // toutes les permutations sortent (2 plateaux : 2 ; 3 : 6 ; 4 : 24)
  assert.equal([...vus].filter((x) => x.startsWith("2:")).length, 2);
  assert.equal([...vus].filter((x) => x.startsWith("3:")).length, 6);
  assert.equal([...vus].filter((x) => x.startsWith("4:")).length, 24);
  // le dessin suit l'ordre : le plateau i est à la place ordre.indexOf(i)
  const g = graines(50).find((x) => sys.carte(x, { geste: "ESCALIER", ordre: "MELANGE" })._sys.ordre.join("") === "201");
  const c = sys.carte(g, { geste: "ESCALIER", ordre: "MELANGE" });
  const d0 = sys.disposition(sys.carte(g, { geste: "ESCALIER" }), sys.zones.IMPRIME);
  const d1 = sys.disposition(c, sys.zones.IMPRIME);
  c._sys.ordre.forEach((i, place) => {
    assert.equal(d1.plateaux[i].x, d0.plateaux[place].x);
    assert.equal(d1.plateaux[i].y, d0.plateaux[place].y);
  });
  assert.notEqual(d1.plateaux[0].x + "," + d1.plateaux[0].y, d0.plateaux[0].x + "," + d0.plateaux[0].y, "le plateau principal a changé de place");
});

test("MIX : Escalier se coche comme les autres gestes, absent du mélange par défaut", () => {
  const compte = (cartes) => cartes.reduce((m, c) => (m[c._sys.geste] = (m[c._sys.geste] || 0) + 1, m), {});
  assert.ok(!Object.keys(compte(sys.serie(11, 600, { geste: "MIX" }))).includes("ESCALIER"));
  const r = { geste: "MIX", gestes: ["ESCALIER", "COEF", "DOUBLE"], ecart: "1", fois: 3, visMin: 0, visMax: 2 };
  const cartes = sys.serie(12, 900, r);
  assert.deepEqual(Object.keys(compte(cartes)).sort(), ["COEF", "DOUBLE", "ESCALIER"]);
  cartes.forEach((c) => verifierCarte(c, r));
});

test("7 taches : la table de place (plateau unique, Phrases et Symboles) en a 7, dans le plateau, sans se toucher", () => {
  const tables = new Function(`
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    ${fn("getTrayConfig")}
    ${fn("getNumberedSplatsLegacy")}
    ${fn("getNumberedSplats")}
    return { getTrayConfig, getNumberedSplatsLegacy, getNumberedSplats };`)();
  const plateau = tables.getTrayConfig("D");
  const t = tables.getNumberedSplats(7, "D");
  assert.equal(t.length, 7);
  assert.deepEqual(t, tables.getNumberedSplatsLegacy(7, "D"));
  for(const s of t) assert.ok(s.cy - 0.94 * s.r >= plateau.y && s.cy + 1.08 * s.r <= plateau.y + plateau.h && s.cx - 1.06 * s.r >= plateau.x && s.cx + 1.06 * s.r <= plateau.x + plateau.w);
  for(const a of t) for(const b of t) if(a !== b){
    const dx = Math.abs(a.cx - b.cx), dy = Math.abs(a.cy - b.cy);
    assert.ok(dx >= 2.12 * a.r + 20 || dy >= 2.02 * a.r + 20, "deux taches se touchent");
  }
  // les tables de 1 à 6 taches ne bougent pas
  assert.match(fn("getNumberedSplatsLegacy"), /6:\[\{cx:540, cy:420\},\{cx:820, cy:420\},\{cx:1100, cy:420\},\{cx:540, cy:680\},\{cx:820, cy:680\},\{cx:1100, cy:680\}\]/);
});

/* Le dessin des plateaux (décidé le 01/10 : une rangée par couleur, même à 5 taches) : dans
   chaque zone (écran, impression 4 et 6 par page, corrections, téléphone), aucune tache ne
   touche une autre ni le bord de son plateau, et les jetons visibles restent dans le plateau. */
test("dessin : 5 taches d'une couleur sur une rangée ; rien ne se touche, dans toutes les zones", () => {
  const T = sys.TACHE;
  const cartes = Object.values(CARTES).flatMap((l) => l.filter((_, i) => i % 25 === 0))
    .concat(tirer({ geste: "ESCALIER", ordre: "MELANGE", visMin: 1, visMax: 3 }, 20, 2));
  const c2 = CARTES["2c"][0];
  const g = sys.grille(c2);
  assert.equal(g.colonnes, 5, "2 N + 5 V : cinq colonnes");
  assert.equal(g.lignes, 2, "une rangée par couleur");
  for(const carte of cartes){
    for(const [nom, Z] of Object.entries(sys.zones)){
      const d = sys.disposition(carte, Z);
      for(const P of d.plateaux){
        for(const s of P.taches){
          assert.ok(s.cx - T.gauche * s.r >= P.x + 2 && s.cx + T.droite * s.r <= P.x + P.w - 2, `${nom} : une tache sort du plateau (côtés)`);
          assert.ok(s.cy - T.haut * s.r >= P.y + 2 && s.cy + T.bas * s.r <= P.y + P.h - 2, `${nom} : une tache sort du plateau (haut, bas)`);
        }
        for(const a of P.taches) for(const b of P.taches) if(a !== b){
          const dx = Math.abs(a.cx - b.cx), dy = Math.abs(a.cy - b.cy);
          assert.ok(dx >= (T.gauche + T.droite) * a.r || dy >= (T.haut + T.bas) * a.r, `${nom} : deux taches se touchent`);
        }
        for(const j of P.jetons){
          assert.ok(j.cx - j.r >= P.x && j.cx + j.r <= P.x + P.w && j.cy - j.r >= P.y && j.cy + j.r <= P.y + P.h, `${nom} : un jeton sort du plateau`);
          for(const s of P.taches) assert.ok(Math.abs(j.cx - s.cx) >= j.r + T.droite * s.r, `${nom} : un jeton touche une tache`);
        }
      }
      // deux plateaux ne se chevauchent pas
      for(const A of d.plateaux) for(const B of d.plateaux) if(A !== B){
        assert.ok(A.x + A.w <= B.x || B.x + B.w <= A.x || A.y + A.h <= B.y || B.y + B.h <= A.y, `${nom} : deux plateaux se chevauchent`);
      }
    }
  }
});

/* Le panneau et les adresses. */
test("le panneau : Escalier, Écart, Recopier, Petit plateau, Qui dépasse, Plateaux ; éteints par défaut", () => {
  const panneau = html.slice(html.indexOf('<div id="systemSettings"'), html.indexOf("<!-- Réglages d'affichage"));
  assert.match(panneau, /<option value="ESCALIER">Escalier<\/option>\s*<option value="MIX">/);
  assert.match(panneau, /id="sysMixESCALIER">/);
  assert.match(panneau, /<select id="sysEcart"[^>]*>\s*<option value="" selected>Les deux<\/option>\s*<option value="1">1 tache de plus<\/option>\s*<option value="2">Plusieurs : on partage<\/option>/);
  assert.match(panneau, /<select id="sysFois"[^>]*>\s*<option value="2" selected>2 fois<\/option>\s*<option value="3">3 fois<\/option>/);
  assert.match(panneau, /<select id="sysIndice"[^>]*>\s*<option value="11" selected>1 \+ 1<\/option>\s*<option value="12">1 \+ 2<\/option>/);
  assert.match(panneau, /<select id="sysSens"[^>]*>\s*<option value="PLATEAU" selected>Le grand plateau<\/option>\s*<option value="INDICE">Le petit recopié<\/option>/);
  assert.match(panneau, /<select id="sysOrdre"[^>]*>\s*<option value="" selected>Du plus grand au plus petit<\/option>\s*<option value="MELANGE">Mélangés<\/option>/);
  for(const nom of ["ecart", "fois", "indice", "sens", "ordre"]) assert.ok(html.includes(`"${nom}"`) && /const sharedNames = \[[^\]]*"ecart", "fois", "indice", "sens"/.test(html));
  assert.match(fn("lireReglagesSysteme"), /ecart: sysEcartEl \? sysEcartEl\.value : ""/);
});

test("adresses : les réglages nouveaux, écrits seulement quand ils sont allumés, relus à l'identique", () => {
  const liste = (value, options) => ({ value, tagName: "SELECT", options: options.map((v) => ({ value: v, disabled: false })) });
  const page = (geste, coches = ["EMBOITE1", "PARTIELLE", "COEF", "TROIS"]) => ({
    sysGesteEl: liste(geste, ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS", "ESCALIER", "MIX"]),
    sysEcartEl: liste("", ["", "1", "2"]), sysFoisEl: liste("2", ["2", "3"]), sysIndiceEl: liste("11", ["11", "12"]),
    sysSensEl: liste("PLATEAU", ["PLATEAU", "INDICE"]), sysOrdreEl: liste("", ["", "MELANGE"]),
    sysPasAPasEl: { checked: true }, // lot M4-2 : coché par défaut, rien n'est écrit
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
  // éteints : rien n'est écrit (les adresses d'avant ne changent pas)
  for(const g of ["EMBOITE1", "COEF", "DOUBLE", "MIX", "ESCALIER"]) assert.equal(ecrire(page(g)), "");
  // allumés : écrits quand le geste les lit (Mélange : quand il est coché) ; « ordre » toujours
  const a = page("MIX", ["COEF", "DOUBLE"]);
  a.sysEcartEl.value = "2"; a.sysFoisEl.value = "3"; a.sysIndiceEl.value = "12"; a.sysSensEl.value = "INDICE"; a.sysOrdreEl.value = "MELANGE";
  assert.equal(ecrire(a), "ecart=2&fois=3&indice=12&sens=INDICE&ordre=MELANGE");
  const e = page("ESCALIER");
  e.sysEcartEl.value = "1"; e.sysFoisEl.value = "3"; e.sysOrdreEl.value = "MELANGE";
  assert.equal(ecrire(e), "ordre=MELANGE", "Escalier : ni écart ni fois");
  const c = page("COEF");
  c.sysEcartEl.value = "1"; c.sysFoisEl.value = "3";
  assert.equal(ecrire(c), "ecart=1");
  // Mélange sans Doubler coché (le mélange par défaut) : ni fois, ni indice, ni sens ; et
  // les menus de Doubler restent cachés (sysGestesLus)
  const m = page("MIX");
  m.sysEcartEl.value = "1"; m.sysFoisEl.value = "3"; m.sysIndiceEl.value = "12"; m.sysSensEl.value = "INDICE";
  assert.equal(ecrire(m), "ecart=1");
  assert.deepEqual(monter(m).lus(), { coef: true, double: false });
  assert.deepEqual(monter(page("MIX", ["EMBOITE1", "TROIS"])).lus(), { coef: false, double: false });
  assert.deepEqual(monter(page("DOUBLE")).lus(), { coef: false, double: true });
  assert.match(fn("sysAfficherReglagesM4"), /const \{ coef, double \} = sysGestesLus\(\);/);
  // relecture : une page neuve retrouve les mêmes réglages ; absents = remis à zéro
  const b = page("MIX", ["COEF", "DOUBLE"]);
  b.sysEcartEl.value = "1"; b.sysOrdreEl.value = "MELANGE";
  monter(b).lire(new URLSearchParams("ecart=2%2B&fois=3&indice=12&sens=indice&ordre=melange"));
  assert.deepEqual([b.sysEcartEl.value, b.sysFoisEl.value, b.sysIndiceEl.value, b.sysSensEl.value, b.sysOrdreEl.value], ["2", "3", "12", "INDICE", "MELANGE"]);
  assert.equal(ecrire(b), ecrire(a));
  monter(b).lire(new URLSearchParams("mode=D&geste=COEF"));
  assert.deepEqual([b.sysEcartEl.value, b.sysFoisEl.value, b.sysIndiceEl.value, b.sysSensEl.value, b.sysOrdreEl.value], ["", "2", "11", "PLATEAU", ""]);
  monter(b).lire(new URLSearchParams("ecart=9&fois=7&indice=33&sens=AUTRE&ordre=x"));
  assert.deepEqual([b.sysEcartEl.value, b.sysFoisEl.value, b.sysIndiceEl.value, b.sysSensEl.value, b.sysOrdreEl.value], ["", "2", "11", "PLATEAU", ""]);
  // la page les branche : lus après « gestes », écrits après « gestes », pour le mode D seulement
  assert.match(fn("appliquerConfiguration"), /if\(act === "D"\) sysLireReglagesM4\(params\);/);
  assert.match(fn("buildShareUrl"), /if\(act === "D"\) sysEcrireReglagesM4\(params\);/);
});

/* Lot M4-4 (04/10/2026) : « sens=MIX » (« Les deux, au hasard ») — la fiche 27 « Je double » mêle
   les deux sens de Doubler : chaque carte tire le sien (le grand plateau dépasse, ou le petit
   recopié dépasse). Les adresses d'avant (sens absent, PLATEAU ou INDICE) ne changent pas. */
test("lot M4-4 : sens=MIX — chaque carte de Doubler tire son sens, les deux sortent, rien d'autre ne change", () => {
  assert.equal(sys.normaliser({ geste: "DOUBLE", sens: "MIX" }).sens, "MIX");
  assert.equal(sys.normaliser({ geste: "DOUBLE", sens: "mix" }).sens, "MIX");
  assert.equal(sys.normaliser({ geste: "DOUBLE", sens: "AUTRE" }).sens, "PLATEAU");
  const depasse = (c, fois) => {
    const [P, I] = c._sys.boards;
    return fois * I.total > P.total - (P.visible || []).reduce((a, x) => a + x, 0);
  };
  for(const fois of [2, 3]){
    const r = { geste: "DOUBLE", sens: "MIX", ...(fois === 3 ? { fois: 3 } : {}) };
    const cartes = tirer(r, 60);
    cartes.forEach((c) => verifierCarte(c, r));
    const n = cartes.filter((c) => depasse(c, fois)).length;
    assert.ok(n > 0.2 * cartes.length && n < 0.8 * cartes.length, `${fois} fois : les deux sens sortent (${n} / ${cartes.length})`);
    // déterministe : la même graine, les mêmes cartes
    assert.equal(JSON.stringify(sys.serie(222, 4, r)), JSON.stringify(sys.serie(222, 4, r)));
  }
  // un seul sens demandé : il est tenu, carte par carte
  assert.ok(tirer({ geste: "DOUBLE", sens: "INDICE" }, 30).every((c) => depasse(c, 2)));
  assert.ok(tirer({ geste: "DOUBLE" }, 30).every((c) => !depasse(c, 2)));
  // le menu et l'adresse
  const panneau = html.slice(html.indexOf('<div id="systemSettings"'), html.indexOf("<!-- Réglages d'affichage"));
  assert.match(panneau, /<select id="sysSens"[^>]*>\s*<option value="PLATEAU" selected>Le grand plateau<\/option>\s*<option value="INDICE">Le petit recopié<\/option>\s*<option value="MIX">Les deux, au hasard<\/option>/);
  assert.match(fn("sysEcrireReglagesM4"), /\(sysSensEl\.value === "INDICE" \|\| sysSensEl\.value === "MIX"\)\) params\.set\("sens", sysSensEl\.value\);/);
});
