import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

// Le moteur commun des Coffres magiques (solo + duo) : table des règles par niveau et par
// opération, familles de faits, garantie de 1 ou 2 paires, difficulté de recherche.
const require = createRequire(import.meta.url);
const engine = require("../assets/js/coffres-moteur.js");
const MODES = engine.OPERATIONS;
const LEVELS = [1, 2, 3];
const SAMPLE = 500;

// Compteur de solutions écrit indépendamment du moteur : les 24 paires voisines recomptées.
function countSolutions(mode, target, values) {
  let count = 0;
  for (let first = 0; first < 16; first += 1) {
    for (const second of [first + 1, first + 4]) {
      if (second >= 16 || (second === first + 1 && Math.floor(first / 4) !== Math.floor(second / 4))) continue;
      const high = Math.max(values[first], values[second]);
      const low = Math.min(values[first], values[second]);
      const result = mode === "sum" ? high + low : mode === "difference" ? high - low : mode === "product" ? high * low : high % low === 0 ? high / low : NaN;
      if (result === target) count += 1;
    }
  }
  return count;
}

function touching(first, second) {
  return first.some(a => second.some(b => a === b || engine.adjacent(a, b)));
}

// Ce que chaque règle promet, niveau par niveau (la table de la notice).
const RULES = {
  1: {
    sum: ([high, low]) => low >= 2 && high <= 9,
    difference: ([high, low]) => high >= 5 && high <= 18 && low >= 2 && low <= 9 && high - low >= 2 && high - low <= 9,
    product: ([high, low]) => low >= 2 && high <= 10,
    quotient: ([dividend, divisor]) => divisor >= 2 && divisor <= 9 && dividend / divisor >= 2 && dividend / divisor <= 9 && dividend > 12
  },
  2: {
    sum: ([high, low]) => high >= 10 && high <= 89 && low >= 2 && low <= 9,
    difference: ([high, low]) => high >= 20 && high <= 99 && low >= 2 && low <= 9 && high - low > 2,
    product: ([high, low]) => high >= 11 && high <= 20 && low >= 2 && low <= 10,
    quotient: ([dividend, divisor]) => divisor >= 2 && divisor <= 10 && dividend / divisor >= 11 && dividend / divisor <= 20
  },
  3: {
    sum: ([high, low]) => low >= 10 && high <= 89,
    difference: ([high, low]) => low >= 10 && high <= 99 && high - low >= 10,
    product: ([high, low]) => high >= 12 && high <= 49 && low >= 3 && low <= 9 && high * low <= 300,
    quotient: ([dividend, divisor]) => divisor >= 3 && divisor <= 9 && dividend / divisor >= 12 && dividend / divisor <= 49 && dividend <= 300
  }
};

// Plage des cases du plateau (solution et fond confondus) : les calculs restent ceux du niveau.
const CELL_RANGE = {
  1: { sum: [2, 9], difference: [2, 18], product: [2, 10], quotient: [2, 81] },
  2: { sum: [2, 89], difference: [2, 99], product: [2, 20], quotient: [2, 200] },
  3: { sum: [10, 89], difference: [10, 99], product: [3, 49], quotient: [3, 300] }
};

const CARRY = {
  2: { sum: ([high, low]) => high % 10 + low >= 10, difference: ([high, low]) => high % 10 < low },
  3: { sum: ([high, low]) => high % 10 + low % 10 >= 10, difference: ([high, low]) => high % 10 < low % 10 }
};

test("chaque paire admise respecte la règle de son niveau, et chaque règle a ses exemples", () => {
  for (const level of LEVELS) for (const mode of MODES) {
    const pairs = engine.solutionPairs(mode, level);
    assert.ok(pairs.length >= 36, `${mode} niveau ${level} : ${pairs.length} paires seulement`);
    for (const entry of pairs) {
      assert.ok(RULES[level][mode](entry.pair), `${mode} niveau ${level} : ${entry.pair.join(" et ")} hors règle`);
      assert.ok(Number.isInteger(engine.calculate(mode, entry.pair[0], entry.pair[1])));
    }
  }
  const has = (mode, level, first, second) => engine.solutionPairs(mode, level).some(entry => entry.pair[0] === first && entry.pair[1] === second);
  assert.ok(has("difference", 1, 15, 7) && has("difference", 1, 18, 9), "15 − 7 et 18 − 9 doivent exister au niveau 1");
  assert.ok(!has("difference", 1, 4, 2) && !has("difference", 1, 12, 1), "le niveau 1 ne descend pas sous 5 − 2 et n’a pas de 1");
  assert.ok(has("product", 1, 10, 7), "la table de 10 fait partie du niveau 1");
  assert.ok(!has("quotient", 1, 6, 3) && !has("quotient", 1, 12, 2) && has("quotient", 1, 56, 7), "jamais deux nombres ≤ 12 au niveau 1");
  assert.ok(has("sum", 2, 28, 7) && !has("sum", 2, 27, 18), "le niveau 2 additionne un nombre à deux chiffres et un petit");
  assert.ok(has("difference", 2, 52, 7) && !has("difference", 2, 31, 29), "écart jamais ≤ 2 au niveau 2");
  assert.ok(has("product", 2, 14, 6) && !has("product", 2, 9, 7) && !has("product", 2, 25, 4), "produit niveau 2 : (11 à 20) × (2 à 10) strictement");
  assert.ok(has("quotient", 2, 84, 6) && has("quotient", 2, 90, 5) && !has("quotient", 2, 56, 7), "quotient niveau 2 : diviseur 2 à 10, quotient 11 à 20");
  assert.ok(has("sum", 3, 46, 37) && has("difference", 3, 73, 46) && !has("difference", 3, 60, 54), "niveau 3 : deux nombres à deux chiffres, écart ≥ 10");
  assert.ok(has("product", 3, 24, 7) && !has("product", 3, 41, 2) && !has("product", 3, 49, 7), "produit niveau 3 : ≤ 300, jamais le facteur 2");
  assert.ok(has("quotient", 3, 168, 7) && has("quotient", 3, 288, 6) && !has("quotient", 3, 82, 2) && !has("quotient", 3, 56, 7), "quotient niveau 3 : diviseur 3 à 9, quotient 12 à 49");
});

test("le tirage produit exactement 1 ou 2 paires voisines gagnantes, jamais plus, recomptées indépendamment", () => {
  for (const level of LEVELS) for (const mode of MODES) {
    for (let attempt = 0; attempt < SAMPLE; attempt += 1) {
      const wantTwo = attempt % 2 === 0;
      const board = engine.generateBoard(mode, level, wantTwo);
      const counted = countSolutions(mode, board.target, board.values);
      const label = `${mode} niveau ${level} (${board.values.join(" ")}, cible ${board.target})`;
      assert.equal(counted, wantTwo ? 2 : 1, `${label} : ${counted} paire(s) au lieu de ${wantTwo ? 2 : 1}`);
      assert.equal(board.solutions, counted, `${label} : le moteur annonce ${board.solutions}`);
      const found = engine.boardSolutions(mode, board.target, board.values);
      if (found.length === 2) assert.ok(!touching(found[0], found[1]), `${label} : les deux paires se touchent`);
      assert.ok(RULES[level][mode](board.pair), `${label} : la paire solution ${board.pair.join(" et ")} sort de la règle`);
      const [minimum, maximum] = CELL_RANGE[level][mode];
      for (const value of board.values) {
        assert.ok(Number.isInteger(value) && value >= minimum && value <= maximum, `${label} : la case ${value} sort de ${minimum} à ${maximum}`);
      }
    }
  }
});

test("la retenue est imposée deux fois sur trois aux niveaux 2 et 3, et le niveau 1 sert sa table entière", () => {
  const draws = 3000;
  for (const level of [2, 3]) for (const mode of ["sum", "difference"]) {
    let carries = 0;
    for (let attempt = 0; attempt < draws; attempt += 1) {
      const drawn = engine.drawPair(mode, level);
      assert.equal(drawn.carry, CARRY[level][mode](drawn.pair));
      if (drawn.carry) carries += 1;
    }
    const rate = carries / draws;
    assert.ok(rate > 0.61 && rate < 0.72, `${mode} niveau ${level} : ${(rate * 100).toFixed(0)} % de retenues au lieu de 2 sur 3`);
  }
  const seen = new Set();
  for (let attempt = 0; attempt < 6000; attempt += 1) seen.add(engine.drawPair("sum", 1).pair.join("+"));
  assert.equal(seen.size, engine.solutionPairs("sum", 1).length, "toutes les additions de la table sortent au niveau 1");
  for (const mode of ["product", "quotient"]) for (const level of LEVELS) assert.equal(engine.drawPair(mode, level).carry, null);
});

test("les familles de faits existent là où le niveau le permet et sont servies sur demande", () => {
  const expected = {
    1: { sum: ["complement10", "double"], difference: ["complement10", "half"], product: ["times10", "double"], quotient: ["half"] },
    2: { sum: ["complementTen"], difference: ["complementTen"], product: ["times10", "double"], quotient: ["divide10", "half"] },
    3: { sum: ["complement100", "double"], difference: ["half"], product: [], quotient: [] }
  };
  for (const level of LEVELS) for (const mode of MODES) {
    assert.deepEqual(engine.levelRules(level)[mode].families.sort(), expected[level][mode].sort(), `${mode} niveau ${level}`);
    assert.equal(engine.hasFamily(mode, level), expected[level][mode].length > 0);
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const board = engine.generateBoard(mode, level, attempt % 3 === 0, { family: true });
      if (expected[level][mode].length) assert.ok(board.family, `${mode} niveau ${level} : ${board.pair.join(" ")} n’est pas une famille`);
      else assert.equal(board.family, null);
    }
  }
  const sample = (mode, level, family) => {
    const pairs = new Set();
    for (let attempt = 0; attempt < 400; attempt += 1) {
      const drawn = engine.drawPair(mode, level, { family: true });
      if (drawn.family === family) pairs.add(drawn.pair.join(" "));
    }
    return pairs;
  };
  assert.ok(sample("sum", 1, "complement10").has("8 2") && sample("sum", 1, "double").has("7 7"));
  assert.ok(sample("sum", 3, "complement100").has("63 37"));
  assert.ok(sample("product", 1, "times10").has("10 6") && sample("quotient", 1, "half").has("18 2"));
  assert.ok(sample("quotient", 2, "divide10").has("130 10"));
  assert.ok(engine.familyLabel("complementTen") === "complément à la dizaine" && engine.familyLabel("half") === "moitié");
});

test("la série de dix clés réserve au moins deux familles quand les opérations le permettent", () => {
  const series = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];
  for (const level of LEVELS) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const plan = engine.planFamilies(series, level);
      assert.equal(plan.length, 10);
      assert.equal(plan.filter(Boolean).length, 2, `niveau ${level} : ${plan.filter(Boolean).length} familles planifiées`);
      plan.forEach((flag, index) => { if (flag) assert.ok(engine.hasFamily(series[index], level)); });
    }
  }
  assert.equal(engine.planFamilies(Array(10).fill("product"), 3).filter(Boolean).length, 0, "niveau 3 produit seul : aucune famille possible");
  assert.equal(engine.planFamilies(["product", "quotient", "product", "quotient"], 1).filter(Boolean).length, 2);
});

test("un calcul raté peut être rejoué : même cible, même opération, nouveau plateau", () => {
  for (const level of LEVELS) for (const mode of MODES) {
    const targets = [...new Set(engine.solutionPairs(mode, level).map(entry => engine.calculate(mode, entry.pair[0], entry.pair[1])))];
    for (const target of targets) {
      for (const wantTwo of [false, true]) {
        const board = engine.generateBoard(mode, level, wantTwo, { target });
        assert.equal(board.target, target, `${mode} niveau ${level} : cible ${board.target} au lieu de ${target}`);
        assert.equal(countSolutions(mode, target, board.values), wantTwo && engine.matchingPairs(mode, target, level).length ? 2 : 1);
      }
    }
  }
});

test("la difficulté de recherche est réglée : voisins trompeurs et divisions exactes", () => {
  // near : paires voisines non gagnantes à ≤ 10 % du but (au moins ±1) ; exact : divisions qui tombent juste.
  // Objectifs de la notice : 3 à 5 voisins trompeurs (somme, différence, quotient), 8 à 10 divisions exactes.
  // Les produits proches sont rares par nature (entre 50 et 62, seuls 54 et 60 sont des produits des tables) :
  // on en garantit au moins 2 en moyenne sans fabriquer de faux presque-justes.
  for (const level of LEVELS) for (const mode of MODES) {
    let near = 0;
    let exact = 0;
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const board = engine.generateBoard(mode, level, attempt % 3 === 0);
      const metrics = engine.searchMetrics(mode, board.target, board.values);
      near += metrics.near;
      exact += metrics.exact;
    }
    near /= 1000;
    exact /= 1000;
    const label = `${mode} niveau ${level}`;
    if (mode === "product") assert.ok(near >= 2, `${label} : ${near.toFixed(2)} voisin trompeur par plateau (au moins 2 attendus)`);
    else assert.ok(near >= 3 && near <= 5, `${label} : ${near.toFixed(2)} voisins trompeurs par plateau (3 à 5 attendus)`);
    if (mode === "quotient") assert.ok(exact >= 8 && exact <= 10, `${label} : ${exact.toFixed(2)} divisions exactes par plateau (8 à 10 attendues)`);
  }
  assert.deepEqual(engine.searchMetrics("sum", 11, [5, 6, 4, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]), { near: 2, exact: 3 });
  assert.deepEqual(engine.searchMetrics("quotient", 4, [8, 2, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]), { near: 0, exact: 1 });
});

test("le tirage reste déterministe et valide quand Math.random est figé (scénarios de test)", () => {
  const nativeRandom = Math.random;
  try {
    for (const fixed of [0, .1, .13, .2, .5, .9, .999]) {
      Math.random = () => fixed;
      for (const level of LEVELS) for (const mode of MODES) {
        const board = engine.generateBoard(mode, level, true);
        assert.equal(countSolutions(mode, board.target, board.values), 2, `${mode} niveau ${level} avec Math.random = ${fixed} : ${board.solutions} paires`);
        assert.equal(engine.generateBoard(mode, level, false).solutions, 1);
      }
    }
  } finally {
    Math.random = nativeRandom;
  }
});

test("le chronomètre du duo et le niveau sont normalisés", () => {
  assert.deepEqual([1, 2, 3, "2", "9", undefined].map(engine.turnDuration), [20_000, 30_000, 45_000, 30_000, 20_000, 20_000]);
  assert.deepEqual(["1", "2", "3", "0", "x"].map(engine.normalizeLevel), [1, 2, 3, 1, 1]);
  assert.deepEqual(engine.levelRules(1).quotient.targets, [2, 9]);
  assert.deepEqual(engine.levelRules(2).quotient.targets, [11, 20]);
  assert.deepEqual(engine.levelRules(3).quotient.targets, [12, 49]);
  assert.deepEqual(engine.levelRules(3).product.targets, [36, 297]);
  assert.deepEqual(engine.levelRules(1).difference.targets, [2, 9]);
});
