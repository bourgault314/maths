// Inconnues en barres — moteur (sans DOM) : contextes, génération, textes et déroulé.
// Le moteur décrit chaque écran en données ; app.mjs se contente de dessiner.
// Principe des « parts » : un schéma ne dessine JAMAIS une barre à la largeur de sa
// valeur. Une part = un petit objet ; un grand objet = exactement k parts (A = kB) ;
// un écart se dessine avec une largeur fixe de convention (D_RATIO part).

export const MAX_PARTS = 12;
export const D_RATIO = 0.6;
export const FAMILIES = ["fois", "partielle", "ecart"];
export const STEP_NAMES = ["Comprendre", "Données", "Remplacer", "Partager", "Réponse"];

// ---------------------------------------------------------------- contextes
// Chaque contexte a une paire d'objets par famille, avec des plages réalistes.
const OBJ = {
  ananas: { emoji: "🍍", sing: "ananas", plur: "ananas", det: "un" },
  orange: { emoji: "🍊", sing: "orange", plur: "oranges", det: "une" },
  poire: { emoji: "🍐", sing: "poire", plur: "poires", det: "une" },
  pomme: { emoji: "🍎", sing: "pomme", plur: "pommes", det: "une" },
  mangue: { emoji: "🥭", sing: "mangue", plur: "mangues", det: "une" },
  citron: { emoji: "🍋", sing: "citron", plur: "citrons", det: "un" },
  livre: { emoji: "📕", sing: "livre", plur: "livres", det: "un" },
  cahier: { emoji: "📓", sing: "cahier", plur: "cahiers", det: "un" },
  crayon: { emoji: "✏️", sing: "crayon", plur: "crayons", det: "un" },
  etoile: { emoji: "⭐", sing: "étoile", plur: "étoiles", det: "une" },
  jeton: { emoji: "🔵", sing: "jeton bleu", plur: "jetons bleus", det: "un" },
};

export const CONTEXTS = {
  fruits: {
    label: "Fruits et masses (g)", unit: "g", grandeur: "masse",
    un: "pèse", plur: "pèsent",
    fois: { A: "ananas", B: "orange", B_range: [150, 250, 10], A_range: [300, 1000] },
    ecart: { A: "poire", B: "pomme", B_range: [120, 200, 10], d_range: [20, 60, 10] },
    partielle: { A: "mangue", B: "citron", A_range: [250, 450, 10], B_range: [80, 150, 10] },
  },
  fournitures: {
    label: "Fournitures et prix (€)", unit: "€", grandeur: "prix",
    un: "coûte", plur: "coûtent",
    fois: { A: "livre", B: "cahier", B_range: [2, 5, 1], A_range: [4, 20] },
    ecart: { A: "cahier", B: "crayon", B_range: [1, 3, 1], d_range: [1, 3, 1] },
    partielle: { A: "livre", B: "crayon", A_range: [6, 15, 1], B_range: [1, 3, 1] },
  },
  jetons: {
    label: "Jeu et points", unit: "points", grandeur: "points",
    un: "vaut", plur: "valent",
    fois: { A: "etoile", B: "jeton", B_range: [5, 25, 1], A_range: [10, 100] },
    ecart: { A: "etoile", B: "jeton", B_range: [8, 30, 1], d_range: [3, 15, 1] },
    partielle: { A: "etoile", B: "jeton", A_range: [20, 60, 1], B_range: [5, 30, 1] },
  },
};

// Nombres à ne jamais tirer (sous-entendus).
export function isForbiddenNumber(n) {
  const s = String(Math.abs(n));
  return s.includes("69") || n === 88 || n === 666 || n === 1488 || n === 420;
}

// ---------------------------------------------------------------- hasard
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const rangeVals = ([a, b, s]) => { const out = []; for (let v = a; v <= b; v += s) out.push(v); return out; };

// ---------------------------------------------------------------- génération
// settings : { family, k: "2"|"3"|"4"|"mix", variety: "guided"|"simple"|"rich", context }
export function generate(settings, seed) {
  const rng = makeRng(seed);
  for (let attempt = 0; attempt < 400; attempt++) {
    const p = tryGenerate(settings, rng);
    if (p && checkProblem(p).length === 0) { p.seed = seed; return p; }
  }
  throw new Error("Aucun problème valide trouvé pour ces réglages");
}

function counts(family, variety, k, rng) {
  if (family === "fois") {
    if (variety === "guided") return [1, k];
    if (variety === "simple") return [1, pick(rng, [1, 2, 3, 4, 5].filter((x) => k + x <= 9))];
    const c = [];
    for (let m = 1; m <= 2; m++) for (let n = 1; n <= 5; n++) { const P = m * k + n; if (P >= 4 && P <= MAX_PARTS) c.push([m, n]); }
    return pick(rng, c);
  }
  // écart : m grands objets et n petits
  if (variety === "guided") return [1, 1];
  if (variety === "simple") return [1, pick(rng, [2, 3, 4])];
  return [pick(rng, [2, 3]), pick(rng, [1, 2, 3, 4])];
}

function tryGenerate(settings, rng) {
  const ctxKey = settings.context in CONTEXTS ? settings.context : "fruits";
  const ctx = CONTEXTS[ctxKey];
  const family = FAMILIES.includes(settings.family) ? settings.family : "fois";
  const pair = ctx[family];
  const base = { family, context: ctxKey, unit: ctx.unit, A: OBJ[pair.A], B: OBJ[pair.B] };

  if (family === "fois") {
    const k = settings.k === "mix" || !settings.k ? pick(rng, [2, 3, 4]) : Number(settings.k);
    const [m, n] = counts("fois", settings.variety || "guided", k, rng);
    const bValue = pick(rng, rangeVals(pair.B_range));
    const aValue = k * bValue;
    if (aValue < pair.A_range[0] || aValue > pair.A_range[1]) return null;
    const parts = m * k + n;
    return { ...base, k, m, n, parts, aValue, bValue, total: m * aValue + n * bValue,
      canInverse: n % k === 0 };
  }
  if (family === "ecart") {
    const [m, n] = counts("ecart", settings.variety || "guided", 0, rng);
    const bValue = pick(rng, rangeVals(pair.B_range));
    const d = pick(rng, rangeVals(pair.d_range));
    if (d > bValue) return null; // l'écart dessiné plus court qu'une part reste honnête
    const aValue = bValue + d;
    const total = m * aValue + n * bValue;
    return { ...base, m, n, d, aValue, bValue, total, parts: m + n,
      totalD: m * d, reduced: total - m * d };
  }
  // partielle : r A valent U ; a A et b B valent T
  const r = pick(rng, [2, 3]);
  const a = pick(rng, [2, 3, 4]);
  const b = pick(rng, [2, 3]);
  const aValue = pick(rng, rangeVals(pair.A_range));
  const bValue = pick(rng, rangeVals(pair.B_range));
  if (aValue === bValue) return null;
  const known = r * aValue;
  const partA = a * aValue;
  const rest = b * bValue;
  return { ...base, r, m: a, n: b, aValue, bValue, known, partA, rest, total: partA + rest, parts: a + b };
}

// Toutes les valeurs numériques qui apparaissent à l'écran pour ce problème.
export function shownNumbers(p) {
  const nums = [p.aValue, p.bValue, p.total, p.m, p.n];
  if (p.family === "fois") nums.push(p.k, p.parts, p.m * p.aValue, p.n * p.bValue, p.parts * p.bValue);
  if (p.family === "fois" && p.canInverse) nums.push(p.m + p.n / p.k);
  if (p.family === "ecart") nums.push(p.d, p.totalD, p.reduced, p.parts, p.m * p.aValue, p.n * p.bValue);
  if (p.family === "partielle") nums.push(p.r, p.known, p.partA, p.rest);
  return nums;
}

// Contrôle complet d'un problème : renvoie la liste des défauts (vide si tout va bien).
export function checkProblem(p) {
  const errs = [];
  const ctx = CONTEXTS[p.context][p.family];
  const isInt = (x) => Number.isInteger(x) && x > 0;
  for (const x of shownNumbers(p)) {
    if (!isInt(x)) errs.push("valeur non entière ou non positive : " + x);
    if (isForbiddenNumber(x)) errs.push("nombre interdit : " + x);
  }
  if (p.family === "fois") {
    if (p.aValue !== p.k * p.bValue) errs.push("relation A = kB fausse");
    if (p.m * p.aValue + p.n * p.bValue !== p.total) errs.push("situation fausse");
    if (p.parts !== p.m * p.k + p.n) errs.push("nombre de parts faux");
    if (p.parts * p.bValue !== p.total) errs.push("partage faux");
    if (p.parts > MAX_PARTS) errs.push("trop de parts");
    if (p.canInverse !== (p.n % p.k === 0)) errs.push("sens inverse mal détecté");
    if (p.canInverse) {
      const big = p.m + p.n / p.k;
      if (big * p.aValue !== p.total) errs.push("partage inverse faux");
    }
    if (p.aValue < ctx.A_range[0] || p.aValue > ctx.A_range[1]) errs.push("valeur de A irréaliste");
  }
  if (p.family === "ecart") {
    if (p.aValue !== p.bValue + p.d) errs.push("relation A = B + d fausse");
    if (p.m * p.aValue + p.n * p.bValue !== p.total) errs.push("situation fausse");
    if (p.total - p.m * p.d !== p.reduced) errs.push("retrait des écarts faux");
    if (p.reduced !== p.parts * p.bValue) errs.push("partage faux");
    if (p.d > p.bValue) errs.push("écart plus grand qu'une part");
  }
  if (p.family === "partielle") {
    if (p.r * p.aValue !== p.known) errs.push("donnée partielle fausse");
    if (p.partA + p.rest !== p.total) errs.push("situation fausse");
    if (p.total - p.partA !== p.rest) errs.push("retrait faux");
    if (p.rest !== p.n * p.bValue) errs.push("partage faux");
  }
  const [lo, hi] = ctx.B_range;
  if (p.bValue < lo || p.bValue > hi) errs.push("valeur de B irréaliste");
  return errs;
}

// ---------------------------------------------------------------- français
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export function fmt(n) {
  const s = String(n);
  return n >= 1000 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f") : s;
}
export const q = (p, n) => fmt(n) + "\u00a0" + p.unit; // quantité avec unité, jamais coupée
const one = (o) => o.det + " " + o.sing;
const np = (o, c) => (c === 1 ? one(o) : c + " " + o.plur);
const du = (o) => "d’" + one(o);
const qu = (o) => "qu’" + one(o);

export function statementParts(p) {
  const ctx = CONTEXTS[p.context];
  const Q = questionText(p);
  if (p.family === "fois") return [
    { t: cap(one(p.A)), c: "A" }, { t: " " + ctx.un + " autant que " }, { t: np(p.B, p.k), c: "rel" }, { t: ". " },
    { t: cap(np(p.A, p.m)), c: "A" }, { t: " et " }, { t: np(p.B, p.n), c: "B" }, { t: " " + ctx.plur + " " },
    { t: q(p, p.total), c: "T" }, { t: ". " }, { t: Q, c: "Q" },
  ];
  if (p.family === "ecart") return [
    { t: cap(one(p.A)), c: "A" }, { t: " " + ctx.un + " " }, { t: q(p, p.d) + " de plus", c: "rel" }, { t: " " + qu(p.B) + ". " },
    { t: cap(np(p.A, p.m)), c: "A" }, { t: " et " }, { t: np(p.B, p.n), c: "B" }, { t: " " + ctx.plur + " " },
    { t: q(p, p.total), c: "T" }, { t: ". " }, { t: Q, c: "Q" },
  ];
  return [
    { t: cap(np(p.A, p.m)), c: "A" }, { t: " et " }, { t: np(p.B, p.n), c: "B" }, { t: " " + ctx.plur + " " },
    { t: q(p, p.total), c: "T" }, { t: ". " },
    { t: cap(np(p.A, p.r)), c: "rel" }, { t: " " + ctx.plur + " " }, { t: q(p, p.known), c: "T" }, { t: ". " },
    { t: Q, c: "Q" },
  ];
}
export const statementText = (p) => statementParts(p).map((x) => x.t).join("");

export function questionText(p) {
  const g = CONTEXTS[p.context].grandeur;
  if (g === "masse") return "Quelle est la masse " + du(p.B) + " ?";
  if (g === "prix") return "Quel est le prix " + du(p.B) + " ?";
  return "Combien de points vaut " + one(p.B) + " ?";
}
function grandeurDe(p, o) {
  const g = CONTEXTS[p.context].grandeur;
  if (g === "masse") return "la masse " + du(o);
  if (g === "prix") return "le prix " + du(o);
  return "la valeur " + du(o);
}
export function answerSentence(p, o, v) {
  return cap(one(o)) + " " + CONTEXTS[p.context].un + " " + q(p, v) + ".";
}

// ---------------------------------------------------------------- schémas
// Un schéma = colonnes (en parts) + cellules {row, x, w, kind, emoji, text, hl}.
// kind : A (grand objet), B (petit objet), D (écart), T (total), V (valeur d'une part), E (vide).
// Les crochets (brackets) rappellent sous une rangée d'où viennent les parts.
function schema(label, rows, cols, cells, extra = {}) { return { label, rows, cols, cells, ...extra }; }
const cellA = (p, x, w, o = {}) => ({ x, w, kind: "A", emoji: p.A.emoji, ...o });
const cellB = (p, x, o = {}) => ({ x, w: 1, kind: "B", emoji: p.B.emoji, ...o });
const cellD = (p, x, o = {}) => ({ x, w: D_RATIO, kind: "D", text: q(p, p.d), ...o });
const top = (x, w, text, o = {}) => ({ row: 0, x, w, kind: "T", text, ...o });
const bot = (c) => ({ row: 1, ...c });
const emptied = (s, label) => ({ ...s, label, cells: s.cells.map((c) => ({ row: c.row, x: c.x, w: c.w, kind: "E" })), brackets: [] });

// ---------------------------------------------------------------- écritures
const rep = (s, n, sep = " + ") => Array.from({ length: n }, () => s).join(sep);
const coef = (c, L) => (c === 1 ? L : c + L);
const sum = (arr) => arr.filter(Boolean).join(" + ");

// Ligne d'égalité : [gauche, droite] (alignées sur « = » par l'affichage).
const eq = (l, r) => [l, r];

// ---------------------------------------------------------------- déroulé
// plan(p, opts) -> étapes ; chaque étape = liste de « temps » ; chaque temps décrit
// ce qui est à l'écran : consigne + rangées de blocs.
// opts : { sens: "AtoB"|"BtoA" }
export function plan(p, opts = {}) {
  if (p.family === "fois") return planFois(p, opts.sens === "BtoA" && p.canInverse ? "BtoA" : "AtoB");
  if (p.family === "ecart") return planEcart(p);
  return planPartielle(p);
}

function aides(p, answers) {
  return { type: "aides", cards: answers.map(([qq, a]) => ({ q: qq, a })) };
}
function comprendre(p, cards) {
  return [0, 1, 2, 3].map((open) => ({ instruction: "", rows: [[{ ...aides(p, cards), open }]] }));
}
function block(s, extra = {}) { return { type: "schema", schema: s, ...extra }; }

function answerStep(p, verifRows, checks) {
  const cards = { type: "answer", lines: [
    { emoji: p.B.emoji, text: answerSentence(p, p.B, p.bValue) },
    { emoji: p.A.emoji, text: answerSentence(p, p.A, p.aValue) },
  ] };
  return [
    { instruction: "", rows: [[cards]] },
    { instruction: "On vérifie : on remet les valeurs trouvées dans l’énoncé.", rows: [[cards], ...verifRows, [{ type: "checks", lines: checks }]] },
  ];
}

// ---- famille « fois » : A vaut k fois B
function planFois(p, sens) {
  const { k, m, n, parts, total, aValue, bValue } = p;
  const A = p.A.emoji, B = p.B.emoji, u = p.unit;
  const relation = schema("Relation", 2, k, [bot(cellA(p, 0, k, { row: 0 })), ...Array.from({ length: k }, (_, i) => bot(cellB(p, i)))]);
  const sitCells = (hlA, hlGroups) => {
    const cells = [top(0, parts, q(p, total))];
    for (let j = 0; j < m; j++) cells.push(bot(cellA(p, j * k, k, { hl: hlA })));
    for (let i = 0; i < n; i++) cells.push(bot(cellB(p, m * k + i)));
    return cells;
  };
  const inverseGroups = [];
  if (sens === "BtoA") for (let g = 0; g < n / k; g++) inverseGroups.push({ x: m * k + g * k, w: k });
  const situation = schema("Situation", 2, parts, sitCells(false));
  const situationHL = schema("Situation", 2, parts, sitCells(sens === "AtoB"), { hlGroups: sens === "BtoA" ? inverseGroups : [] });

  const relPic = [eq(A, rep(B, k))];
  const relLet = [eq("A", coef(k, "B"))];
  const sitPic = [eq(sum([rep(A, m), rep(B, n)]), q(p, total))];
  const sitLet = [eq(sum([coef(m, "A"), coef(n, "B")]), fmt(total))];

  const steps = [];
  steps.push(comprendre(p, [
    ["Que cherche-t-on ?", cap(grandeurDe(p, p.B)) + " " + B],
    ["Que sait-on déjà ?", cap(one(p.A)) + " " + A + " peut être " + (p.A.det === "une" ? "remplacée" : "remplacé") + " par " + np(p.B, k) + " " + B + "."],
    ["Quelle idée utiliser ?", sens === "AtoB" ? "Remplacer, puis partager la quantité totale." : "Regrouper les " + p.B.plur + " par " + k + " pour les remplacer, puis partager la quantité totale."],
  ]));
  const dataRow = (rel, sit) => [block(rel, { pic: relPic, let: relLet }), { type: "and" }, block(sit, { pic: sitPic, let: sitLet })];
  steps.push([
    { instruction: "Complète les schémas : que met-on dans chaque case ?", rows: [[block(emptied(relation, "Relation")), { type: "and" }, block(emptied(situation, "Situation"))]] },
    { instruction: "", rows: [dataRow(relation, situation)] },
  ]);

  if (sens === "AtoB") {
    const brackets = Array.from({ length: m }, (_, j) => ({ x: j * k, w: k, text: A }));
    const replaced = schema("Après le remplacement", 2, parts, [top(0, parts, q(p, total)), ...Array.from({ length: parts }, (_, i) => bot(cellB(p, i)))], { brackets });
    const repPic = [eq(sum([...Array.from({ length: m }, () => "(" + rep(B, k) + ")"), rep(B, n)]), q(p, total)), eq(rep(B, parts), q(p, total))];
    const repLet = [eq(sum([...Array.from({ length: m }, () => coef(k, "B")), coef(n, "B")]), fmt(total)), eq(coef(parts, "B"), fmt(total))];
    const instr = "On remplace chaque " + A + " par " + k + " " + B + ".";
    steps.push([
      { instruction: instr, rows: [dataRow(relation, situationHL)] },
      { instruction: instr, rows: [dataRow(relation, situationHL), [block(replaced, { pic: repPic, let: repLet })]] },
    ]);
    const shared = schema("On partage en " + parts + " parts égales", 2, parts, [...Array.from({ length: parts }, (_, i) => ({ row: 0, x: i, w: 1, kind: "V", text: q(p, bValue) })), ...Array.from({ length: parts }, (_, i) => bot(cellB(p, i)))]);
    const relVal = schema("Relation", 2, k, [{ row: 0, x: 0, w: k, kind: "A", emoji: A, text: q(p, aValue) }, ...Array.from({ length: k }, (_, i) => bot(cellB(p, i, { text: q(p, bValue) })))]);
    steps.push([
      { instruction: "On partage " + q(p, total) + " en " + parts + " parts égales.", rows: [[block(schema("Après le remplacement", 2, parts, replaced.cells, { brackets }))]] },
      { instruction: "On partage " + q(p, total) + " en " + parts + " parts égales.", rows: [[block(shared, { calc: q(p, total) + " ÷ " + parts + " = " + q(p, bValue),
        pic: [eq(rep(B, parts), q(p, total)), eq(B, q(p, total) + " ÷ " + parts), eq(B, q(p, bValue))],
        let: [eq(coef(parts, "B"), fmt(total)), eq("B", fmt(total) + " ÷ " + parts), eq("B", fmt(bValue))] })]] },
      { instruction: "On utilise la relation pour trouver " + grandeurDe(p, p.A) + " " + A + ".", rows: [[block(shared, { calc: q(p, total) + " ÷ " + parts + " = " + q(p, bValue) })], [block(relVal, { calc: k + " × " + q(p, bValue) + " = " + q(p, aValue),
        pic: [eq(A, rep(B, k)), eq(A, k + " × " + q(p, bValue)), eq(A, q(p, aValue))],
        let: [eq("A", coef(k, "B")), eq("A", k + " × " + fmt(bValue)), eq("A", fmt(aValue))] })]] },
    ]);
  } else {
    const big = m + n / k;
    const replaced = schema("Après le remplacement", 2, parts, [top(0, parts, q(p, total)), ...Array.from({ length: big }, (_, j) => bot(cellA(p, j * k, k)))]);
    const groups = n / k;
    const repPic = [eq(sum([rep(A, m), ...Array.from({ length: groups }, () => "(" + rep(B, k) + ")")]), q(p, total)), eq(rep(A, big), q(p, total))];
    const repLet = [eq(sum([coef(m, "A"), ...Array.from({ length: groups }, () => coef(k, "B"))]), fmt(total)), eq(coef(big, "A"), fmt(total))];
    const instr = groups === 1 ? "On remplace les " + k + " " + B + " par " + (p.A.det === "une" ? "une " : "un ") + A + "." : "On remplace chaque groupe de " + k + " " + B + " par " + (p.A.det === "une" ? "une " : "un ") + A + ".";
    steps.push([
      { instruction: instr, rows: [dataRow(relation, situationHL)] },
      { instruction: instr, rows: [dataRow(relation, situationHL), [block(replaced, { pic: repPic, let: repLet })]] },
    ]);
    const shared = schema("On partage en " + big + " parts égales", 2, parts, [...Array.from({ length: big }, (_, j) => ({ row: 0, x: j * k, w: k, kind: "V", text: q(p, aValue) })), ...Array.from({ length: big }, (_, j) => bot(cellA(p, j * k, k)))]);
    const relSplit = schema("On partage " + (p.A.det === "une" ? "une " : "un ") + A + " en " + k + " parts égales", 2, k, [...Array.from({ length: k }, (_, i) => ({ row: 0, x: i, w: 1, kind: "V", text: q(p, bValue) })), ...Array.from({ length: k }, (_, i) => bot(cellB(p, i)))]);
    steps.push([
      { instruction: "On partage " + q(p, total) + " en " + big + " parts égales.", rows: [[block(replaced)]] },
      { instruction: "On partage " + q(p, total) + " en " + big + " parts égales.", rows: [[block(shared, { calc: q(p, total) + " ÷ " + big + " = " + q(p, aValue),
        pic: [eq(rep(A, big), q(p, total)), eq(A, q(p, total) + " ÷ " + big), eq(A, q(p, aValue))],
        let: [eq(coef(big, "A"), fmt(total)), eq("A", fmt(total) + " ÷ " + big), eq("A", fmt(aValue))] })]] },
      { instruction: "On utilise la relation : on partage " + q(p, aValue) + " en " + k + " parts égales.", rows: [[block(shared, { calc: q(p, total) + " ÷ " + big + " = " + q(p, aValue) })], [block(relSplit, { calc: q(p, aValue) + " ÷ " + k + " = " + q(p, bValue),
        pic: [eq(rep(B, k), q(p, aValue)), eq(B, q(p, aValue) + " ÷ " + k), eq(B, q(p, bValue))],
        let: [eq(coef(k, "B"), fmt(aValue)), eq("B", fmt(aValue) + " ÷ " + k), eq("B", fmt(bValue))] })]] },
    ]);
  }

  const relV = schema("Relation", 2, k, [{ row: 0, x: 0, w: k, kind: "A", emoji: A, text: q(p, aValue) }, ...Array.from({ length: k }, (_, i) => bot(cellB(p, i, { text: q(p, bValue) })))]);
  const sitV = schema("Situation", 2, parts, [top(0, parts, q(p, total)), ...Array.from({ length: m }, (_, j) => bot(cellA(p, j * k, k, { text: q(p, aValue) }))), ...Array.from({ length: n }, (_, i) => bot(cellB(p, m * k + i, { text: q(p, bValue) })))]);
  const ctx = CONTEXTS[p.context];
  steps.push(answerStep(p, [[block(relV), { type: "and" }, block(sitV)]], [
    { s: cap(one(p.A)) + " " + ctx.un + " autant que " + np(p.B, k) + ".", c: k + " × " + q(p, bValue) + " = " + q(p, aValue) },
    { s: cap(np(p.A, m)) + " et " + np(p.B, n) + " " + ctx.plur + " " + q(p, total) + ".", c: (m === 1 ? q(p, aValue) : m + " × " + q(p, aValue)) + " + " + (n === 1 ? q(p, bValue) : n + " × " + q(p, bValue)) + " = " + q(p, m * aValue) + " + " + q(p, n * bValue) + " = " + q(p, total) },
  ]));
  return steps;
}

// ---- famille « écart » : A vaut B plus d
function planEcart(p) {
  const { m, n, d, total, aValue, bValue, parts } = p;
  const A = p.A.emoji, B = p.B.emoji, dr = D_RATIO, W = 1 + dr;
  const ctx = CONTEXTS[p.context];
  const relation = schema("Relation", 2, W, [{ row: 0, x: 0, w: W, kind: "A", emoji: A }, bot(cellB(p, 0)), bot(cellD(p, 1))]);
  const sitCols = m * W + n;
  const sitCells = (hl, withValues = false) => [top(0, sitCols, q(p, total)),
    ...Array.from({ length: m }, (_, j) => bot(cellA(p, j * W, W, { hl, text: withValues ? q(p, aValue) : undefined }))),
    ...Array.from({ length: n }, (_, i) => bot(cellB(p, m * W + i, { text: withValues ? q(p, bValue) : undefined })))];
  const situation = schema("Situation", 2, sitCols, sitCells(false));
  const situationHL = schema("Situation", 2, sitCols, sitCells(true));
  const relPic = [eq(A, B + " + " + q(p, d))];
  const relLet = [eq("A", "B + " + fmt(d))];
  const sitPic = [eq(sum([rep(A, m), rep(B, n)]), q(p, total))];
  const sitLet = [eq(sum([coef(m, "A"), coef(n, "B")]), fmt(total))];
  const dataRow = (rel, sit) => [block(rel, { pic: relPic, let: relLet }), { type: "and" }, block(sit, { pic: sitPic, let: sitLet })];
  const steps = [];
  steps.push(comprendre(p, [
    ["Que cherche-t-on ?", cap(grandeurDe(p, p.B)) + " " + B],
    ["Que sait-on déjà ?", cap(one(p.A)) + " " + A + " peut être " + (p.A.det === "une" ? "remplacée" : "remplacé") + " par " + one(p.B) + " " + B + " et " + q(p, d) + "."],
    ["Quelle idée utiliser ?", "Remplacer, retirer " + (m === 1 ? "l’écart" : "les écarts") + ", puis partager."],
  ]));
  steps.push([
    { instruction: "Complète les schémas : que met-on dans chaque case ?", rows: [[block(emptied(relation, "Relation")), { type: "and" }, block(emptied(situation, "Situation"))]] },
    { instruction: "", rows: [dataRow(relation, situation)] },
  ]);
  // remplacement
  const repCells = [top(0, sitCols, q(p, total))];
  const brackets = [];
  for (let j = 0; j < m; j++) { repCells.push(bot(cellB(p, j * W)), bot(cellD(p, j * W + 1))); brackets.push({ x: j * W, w: W, text: A }); }
  for (let i = 0; i < n; i++) repCells.push(bot(cellB(p, m * W + i)));
  const replaced = schema("Après le remplacement", 2, sitCols, repCells, { brackets });
  const groupedCells = (hlD) => [top(0, sitCols, q(p, total)), ...Array.from({ length: parts }, (_, i) => bot(cellB(p, i))), ...Array.from({ length: m }, (_, j) => bot(cellD(p, parts + j * dr, { hl: hlD })))];
  const grouped = schema("On regroupe", 2, sitCols, groupedCells(false));
  const groupedHL = schema("On regroupe", 2, sitCols, groupedCells(true));
  const dSum = m === 1 ? q(p, d) : rep(q(p, d), m);
  const repPic = [eq(sum([...Array.from({ length: m }, () => "(" + B + " + " + q(p, d) + ")"), rep(B, n)]), q(p, total))];
  const repLet = [eq(sum([...Array.from({ length: m }, () => "(B + " + fmt(d) + ")"), coef(n, "B")]), fmt(total))];
  const grpPic = [eq(rep(B, parts) + " + " + dSum, q(p, total))];
  const grpLet = [eq(coef(parts, "B") + " + " + (m === 1 ? fmt(d) : m + " × " + fmt(d)), fmt(total))];
  const instr = "On remplace chaque " + A + " par " + B + " et " + q(p, d) + ".";
  steps.push([
    { instruction: instr, rows: [dataRow(relation, situationHL)] },
    { instruction: instr, rows: [dataRow(relation, situationHL), [block(replaced, { pic: repPic, let: repLet })]] },
    { instruction: "On regroupe les " + B + " d’un côté et " + (m === 1 ? "l’écart" : "les écarts") + " de l’autre.", rows: [[block(replaced, { pic: repPic, let: repLet })], [block(grouped, { pic: grpPic, let: grpLet })]] },
  ]);
  // retirer, partager
  const retire = m === 1 ? "On retire l’écart : " : "On retire les écarts : ";
  const reducedS = schema("Sans " + (m === 1 ? "l’écart" : "les écarts"), 2, sitCols, [top(0, parts, q(p, p.reduced)), ...Array.from({ length: parts }, (_, i) => bot(cellB(p, i)))]);
  const retCalc = q(p, total) + " − " + q(p, p.totalD) + " = " + q(p, p.reduced);
  const shared = schema("On partage en " + parts + " parts égales", 2, sitCols, [...Array.from({ length: parts }, (_, i) => ({ row: 0, x: i, w: 1, kind: "V", text: q(p, bValue) })), ...Array.from({ length: parts }, (_, i) => bot(cellB(p, i)))]);
  const relVal = schema("Relation", 2, W, [{ row: 0, x: 0, w: W, kind: "A", emoji: A, text: q(p, aValue) }, bot(cellB(p, 0, { text: q(p, bValue) })), bot(cellD(p, 1))]);
  steps.push([
    { instruction: retire + retCalc + ".", rows: [[block(groupedHL, { pic: grpPic, let: grpLet })], [block(reducedS, { calc: retCalc,
      pic: [eq(rep(B, parts), q(p, total) + " − " + q(p, p.totalD)), eq(rep(B, parts), q(p, p.reduced))],
      let: [eq(coef(parts, "B"), fmt(total) + " − " + fmt(p.totalD)), eq(coef(parts, "B"), fmt(p.reduced))] })]] },
    { instruction: "On partage " + q(p, p.reduced) + " en " + parts + " parts égales.", rows: [[block(reducedS, { calc: retCalc })], [block(shared, { calc: q(p, p.reduced) + " ÷ " + parts + " = " + q(p, bValue),
      pic: [eq(B, q(p, p.reduced) + " ÷ " + parts), eq(B, q(p, bValue))],
      let: [eq("B", fmt(p.reduced) + " ÷ " + parts), eq("B", fmt(bValue))] })]] },
    { instruction: "On utilise la relation pour trouver " + grandeurDe(p, p.A) + " " + A + ".", rows: [[block(shared, { calc: q(p, p.reduced) + " ÷ " + parts + " = " + q(p, bValue) })], [block(relVal, { calc: q(p, bValue) + " + " + q(p, d) + " = " + q(p, aValue),
      pic: [eq(A, B + " + " + q(p, d)), eq(A, q(p, bValue) + " + " + q(p, d)), eq(A, q(p, aValue))],
      let: [eq("A", "B + " + fmt(d)), eq("A", fmt(bValue) + " + " + fmt(d)), eq("A", fmt(aValue))] })]] },
  ]);
  const sitV = schema("Situation", 2, sitCols, sitCells(false, true));
  steps.push(answerStep(p, [[block(relVal), { type: "and" }, block(sitV)]], [
    { s: cap(one(p.A)) + " " + ctx.un + " " + q(p, d) + " de plus " + qu(p.B) + ".", c: q(p, bValue) + " + " + q(p, d) + " = " + q(p, aValue) },
    { s: cap(np(p.A, m)) + " et " + np(p.B, n) + " " + ctx.plur + " " + q(p, total) + ".", c: (m === 1 ? q(p, aValue) : m + " × " + q(p, aValue)) + " + " + (n === 1 ? q(p, bValue) : n + " × " + q(p, bValue)) + " = " + q(p, m * aValue) + " + " + q(p, n * bValue) + " = " + q(p, total) },
  ]));
  return steps;
}

// ---- famille « donnée partielle » : r A valent U ; a A et b B valent T
function planPartielle(p) {
  const { r, m, n, total, known, partA, rest, aValue, bValue, parts } = p;
  const A = p.A.emoji, B = p.B.emoji;
  const ctx = CONTEXTS[p.context];
  const knownS = schema("Donnée partielle", 2, r, [top(0, r, q(p, known)), ...Array.from({ length: r }, (_, i) => bot(cellA(p, i, 1)))]);
  const sitCells = (opt = {}) => [top(0, parts, q(p, total)),
    ...Array.from({ length: m }, (_, i) => bot(cellA(p, i, 1, { hl: opt.hlA, text: opt.aVal ? q(p, aValue) : undefined }))),
    ...Array.from({ length: n }, (_, i) => bot(cellB(p, m + i, { text: opt.bVal ? q(p, bValue) : undefined })))];
  const situation = schema("Situation complète", 2, parts, sitCells());
  const knownPic = [eq(rep(A, r), q(p, known))];
  const knownLet = [eq(coef(r, "A"), fmt(known))];
  const sitPic = [eq(sum([rep(A, m), rep(B, n)]), q(p, total))];
  const sitLet = [eq(sum([coef(m, "A"), coef(n, "B")]), fmt(total))];
  const dataRow = () => [block(knownS, { pic: knownPic, let: knownLet }), { type: "and" }, block(situation, { pic: sitPic, let: sitLet })];
  const steps = [];
  steps.push(comprendre(p, [
    ["Que cherche-t-on ?", cap(grandeurDe(p, p.B)) + " " + B],
    ["Quelle donnée aide d’abord ?", cap(np(p.A, r)) + " " + ctx.plur + " " + q(p, known) + "."],
    ["Quelle idée utiliser ?", "Trouver " + grandeurDe(p, p.A) + ", la remplacer dans la situation, retirer, puis partager."],
  ]));
  steps.push([
    { instruction: "Complète les schémas : que met-on dans chaque case ?", rows: [[block(emptied(knownS, "Donnée partielle")), { type: "and" }, block(emptied(situation, "Situation complète"))]] },
    { instruction: "", rows: [dataRow()] },
  ]);
  const knownShared = schema("On partage en " + r + " parts égales", 2, r, [...Array.from({ length: r }, (_, i) => ({ row: 0, x: i, w: 1, kind: "V", text: q(p, aValue) })), ...Array.from({ length: r }, (_, i) => bot(cellA(p, i, 1)))]);
  const kCalc = q(p, known) + " ÷ " + r + " = " + q(p, aValue);
  const sitRep = schema("Situation complète", 2, parts, sitCells({ hlA: true, aVal: true }));
  const repPic = [eq(sum([m + " × " + q(p, aValue), rep(B, n)]), q(p, total)), eq(q(p, partA) + " + " + rep(B, n), q(p, total))];
  const repLet = [eq(m + " × " + fmt(aValue) + " + " + coef(n, "B"), fmt(total)), eq(fmt(partA) + " + " + coef(n, "B"), fmt(total))];
  steps.push([
    { instruction: "On partage " + q(p, known) + " en " + r + " parts égales.", rows: [[block(knownS, { pic: knownPic, let: knownLet })]] },
    { instruction: "On partage " + q(p, known) + " en " + r + " parts égales.", rows: [[block(knownShared, { calc: kCalc,
      pic: [eq(A, q(p, known) + " ÷ " + r), eq(A, q(p, aValue))], let: [eq("A", fmt(known) + " ÷ " + r), eq("A", fmt(aValue))] })]] },
    { instruction: "On remplace chaque " + A + " par " + q(p, aValue) + " dans la situation.", rows: [[block(knownShared, { calc: kCalc })], [block(sitRep, { pic: repPic, let: repLet })]] },
  ]);
  const merged = schema("Situation complète", 2, parts, [top(0, parts, q(p, total)), bot({ x: 0, w: m, kind: "V", text: q(p, partA), hl: true }), ...Array.from({ length: n }, (_, i) => bot(cellB(p, m + i)))]);
  const restS = schema("Ce qui reste", 2, parts, [top(m, n, q(p, rest)), ...Array.from({ length: n }, (_, i) => bot(cellB(p, m + i)))], { offset: m });
  const rCalc = q(p, total) + " − " + q(p, partA) + " = " + q(p, rest);
  const shared = schema("On partage en " + n + " parts égales", 2, parts, [...Array.from({ length: n }, (_, i) => ({ row: 0, x: m + i, w: 1, kind: "V", text: q(p, bValue) })), ...Array.from({ length: n }, (_, i) => bot(cellB(p, m + i)))], { offset: m });
  steps.push([
    { instruction: "On retire la partie connue : " + rCalc + ".", rows: [[block(merged, { pic: [repPic[1]], let: [repLet[1]] })], [block(restS, { calc: rCalc,
      pic: [eq(rep(B, n), q(p, total) + " − " + q(p, partA)), eq(rep(B, n), q(p, rest))], let: [eq(coef(n, "B"), fmt(total) + " − " + fmt(partA)), eq(coef(n, "B"), fmt(rest))] })]] },
    { instruction: "On partage " + q(p, rest) + " en " + n + " parts égales.", rows: [[block(restS, { calc: rCalc })], [block(shared, { calc: q(p, rest) + " ÷ " + n + " = " + q(p, bValue),
      pic: [eq(B, q(p, rest) + " ÷ " + n), eq(B, q(p, bValue))], let: [eq("B", fmt(rest) + " ÷ " + n), eq("B", fmt(bValue))] })]] },
  ]);
  const knownV = schema("Donnée partielle", 2, r, [top(0, r, q(p, known)), ...Array.from({ length: r }, (_, i) => bot(cellA(p, i, 1, { text: q(p, aValue) })))]);
  const sitV = schema("Situation complète", 2, parts, sitCells({ aVal: true, bVal: true }));
  steps.push(answerStep(p, [[block(knownV), { type: "and" }, block(sitV)]], [
    { s: cap(np(p.A, r)) + " " + ctx.plur + " " + q(p, known) + ".", c: r + " × " + q(p, aValue) + " = " + q(p, known) },
    { s: cap(np(p.A, m)) + " et " + np(p.B, n) + " " + ctx.plur + " " + q(p, total) + ".", c: m + " × " + q(p, aValue) + " + " + n + " × " + q(p, bValue) + " = " + q(p, partA) + " + " + q(p, rest) + " = " + q(p, total) },
  ]));
  return steps;
}

// ---------------------------------------------------------------- volet prof
export function teacherLines(p, sens) {
  if (p.family === "fois") {
    const L = ["Relation : A = " + coef(p.k, "B"), "Situation : " + sum([coef(p.m, "A"), coef(p.n, "B")]) + " = " + p.total];
    if (sens === "BtoA" && p.canInverse) L.push("Après remplacement : " + coef(p.m + p.n / p.k, "A") + " = " + p.total);
    else L.push("Après remplacement : " + coef(p.parts, "B") + " = " + p.total);
    L.push(p.parts + " parts (maximum " + MAX_PARTS + ")");
    L.push(p.canInverse ? "Les deux sens de remplacement sont possibles." : "Sens inverse impossible : " + p.n + " n’est pas un multiple de " + p.k + ".");
    return L;
  }
  if (p.family === "ecart") return ["Relation : A = B + " + p.d, "Situation : " + sum([coef(p.m, "A"), coef(p.n, "B")]) + " = " + p.total,
    "Après remplacement : " + coef(p.parts, "B") + " + " + p.totalD + " = " + p.total, coef(p.parts, "B") + " = " + p.reduced,
    "L’écart est dessiné plus court qu’une part (convention) ; il est toujours inférieur à B."];
  return ["Donnée partielle : " + coef(p.r, "A") + " = " + p.known, "Situation : " + coef(p.m, "A") + " + " + coef(p.n, "B") + " = " + p.total,
    "Étapes : trouver A, remplacer, retirer la partie connue, partager."];
}

export function letterLegend(p) {
  const g = CONTEXTS[p.context].grandeur;
  const unitTxt = g === "points" ? "en points" : "en " + p.unit;
  return "A : " + grandeurDe(p, p.A) + " (" + unitTxt + ") · B : " + grandeurDe(p, p.B) + " (" + unitTxt + ")";
}
