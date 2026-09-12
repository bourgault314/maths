import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

// Depuis le lot « moteur », le duo tire ses plateaux dans le moteur partagé avec le solo.
const require = createRequire(import.meta.url);
const engine = require("../assets/js/coffres-moteur.js");
const html = await readFile(new URL("../outils/club_maths/coffres_magiques.html", import.meta.url), "utf8");
const script = [...html.matchAll(/<script(?![^>]+\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].at(-1)?.[1] || "";

function extractFunction(name) {
  const start = script.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Fonction ${name} introuvable`);
  const bodyStart = script.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = bodyStart; index < script.length; index += 1) {
    const character = script[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}" && --depth === 0) return script.slice(start, index + 1);
  }
  throw new Error(`Fin de la fonction ${name} introuvable`);
}

let seed = 90210;
const seededMath = Object.create(Math);
seededMath.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const context = vm.createContext({ Math: seededMath, engine });
vm.runInContext(`
  const { calculate, neighborPairs, randomInteger, shuffle } = engine;
  let selectedOperations = engine.OPERATIONS.slice();
  let selectedLevel = 1;
  let mode = "sum";
  let challengeNumber = 0;
  let operationCycle = [];
  let values = [], target = 0, locked = false, solutionCount = 1;
  const challengeLabels = { sum: "somme", difference: "différence", product: "produit", quotient: "quotient" };
  const challengeNode = {};
  const clearRuneStates = () => {}, renderBoard = () => {};
  ${extractFunction("operation")}
  ${extractFunction("nextBalancedMode")}
  ${extractFunction("makeChallenge")}
  globalThis.duelCore = {
    calculate,
    operationFor(nextMode, first, second) { mode = nextMode; return operation(first, second); },
    challenge(level, operation) {
      selectedLevel = level;
      selectedOperations = [operation];
      challengeNumber = 0;
      operationCycle = [];
      makeChallenge();
      return { values: values.slice(), target, mode, solutions: solutionCount, neighbors: neighborPairs() };
    },
    balancedSequence(length = 8, operations = engine.OPERATIONS) {
      selectedOperations = operations;
      operationCycle = [];
      const sequence = [];
      for (challengeNumber = 1; challengeNumber <= length; challengeNumber += 1) sequence.push(nextBalancedMode());
      return sequence;
    }
  };
`, context);

const core = context.duelCore;

test("la différence ne dépend pas de l’ordre des deux runes", () => {
  assert.equal(core.calculate("difference", 13, 5), 8);
  assert.equal(core.calculate("difference", 5, 13), 8);
});

test("le quotient divise le plus grand nombre par le plus petit et refuse une division non exacte", () => {
  assert.equal(core.operationFor("quotient", 24, 6), 4);
  assert.equal(core.operationFor("quotient", 6, 24), 4);
  assert.ok(Number.isNaN(core.operationFor("quotient", 12, 5)));
});

test("chaque paire construite vient de la table des règles du moteur partagé", () => {
  for (const level of [1, 2, 3]) for (const mode of engine.OPERATIONS) {
    const admitted = new Set(engine.solutionPairs(mode, level).map(entry => entry.pair.join(" ")));
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const drawn = engine.drawPair(mode, level);
      assert.ok(admitted.has(drawn.pair.join(" ")), `${mode} niveau ${level} : ${drawn.pair.join(" et ")}`);
      if (mode === "quotient") assert.equal(drawn.pair[0] % drawn.pair[1], 0);
    }
  }
  const has = (mode, level, first, second) => engine.solutionPairs(mode, level).some(entry => entry.pair[0] === first && entry.pair[1] === second);
  assert.ok(has("difference", 1, 18, 9) && !has("difference", 1, 12, 1));
  assert.ok(has("product", 2, 14, 6) && !has("product", 2, 9, 7));
  assert.ok(has("quotient", 3, 168, 7) && !has("quotient", 3, 82, 2));
});

test("un bloc de huit défis sert chaque opération une fois à chacun", () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const sequence = Array.from(core.balancedSequence());
    for (let index = 0; index < sequence.length; index += 2) assert.equal(sequence[index], sequence[index + 1]);
    assert.deepEqual([...new Set(sequence.filter((_, index) => index % 2 === 0))].sort(), ["difference", "product", "quotient", "sum"]);
    assert.deepEqual([...new Set(sequence.filter((_, index) => index % 2 === 1))].sort(), ["difference", "product", "quotient", "sum"]);
  }
});

test("chaque plateau Duo respecte le niveau choisi et possède exactement 1 ou 2 paires voisines gagnantes", () => {
  const seen = { 1: 0, 2: 0 };
  for (const level of [1, 2, 3]) {
    for (const operation of ["sum", "difference", "product", "quotient"]) {
      for (let attempt = 0; attempt < 150; attempt += 1) {
        const board = core.challenge(level, operation);
        assert.equal(board.mode, operation);
        assert.equal(board.values.length, 16);
        assert.ok(board.values.every(value => Number.isInteger(value) && value >= 2));
        const found = Array.from(board.neighbors).filter(([first, second]) => core.operationFor(operation, board.values[first], board.values[second]) === board.target).length;
        assert.ok(found === 1 || found === 2, `${operation} niveau ${level} : ${found} paires gagnantes`);
        assert.equal(board.solutions, found);
        seen[found] += 1;
      }
    }
  }
  assert.ok(seen[2] > 300 && seen[1] > 900, `répartition suspecte des paires (${seen[1]} simples, ${seen[2]} doubles)`);
});


test("un choix d’opérations limité reste équilibré entre les deux joueurs", () => {
  for (const operations of [["sum"], ["difference", "quotient"], ["sum", "product", "quotient"]]) {
    const sequence = Array.from(core.balancedSequence(operations.length * 4, operations));
    assert.ok(sequence.every(operation => operations.includes(operation)));
    for (let start = 0; start < sequence.length; start += operations.length * 2) {
      const block = sequence.slice(start, start + operations.length * 2);
      for (let player = 0; player < 2; player += 1) {
        assert.deepEqual(block.filter((_, index) => index % 2 === player).sort(), [...operations].sort());
      }
    }
  }
});
