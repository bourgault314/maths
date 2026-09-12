import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

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
const context = vm.createContext({ Math: seededMath });
vm.runInContext(`
  const SIZE = 4;
  const OPERATION_MODES = ["sum", "difference", "product", "quotient"];
  let selectedOperations = OPERATION_MODES.slice();
  let selectedLevel = 1;
  let mode = "sum";
  let challengeNumber = 0;
  let operationCycle = [];
  let values = [], target = 0, locked = false;
  const challengeLabels = { sum: "somme", difference: "différence", product: "produit", quotient: "quotient" };
  const challengeNode = {};
  const clearRuneStates = () => {}, renderBoard = () => {};
  ${extractFunction("randomInteger")}
  ${extractFunction("shuffle")}
  ${extractFunction("row")}
  ${extractFunction("column")}
  ${extractFunction("neighborPairs")}
  ${extractFunction("calculate")}
  ${extractFunction("operation")}
  ${extractFunction("levelRules")}
  ${extractFunction("pairFor")}
  ${extractFunction("nextBalancedMode")}
  ${extractFunction("makeChallenge")}
  globalThis.duelCore = {
    calculate,
    operationFor(nextMode, first, second) { mode = nextMode; return operation(first, second); },
    pairFor,
    challenge(level, operation) {
      selectedLevel = level;
      selectedOperations = [operation];
      challengeNumber = 0;
      operationCycle = [];
      makeChallenge();
      return { values: values.slice(), target, mode, neighbors: neighborPairs() };
    },
    balancedSequence(length = 8, operations = OPERATION_MODES) {
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

test("chaque paire construite respecte les bornes et garantit le calcul demandé", () => {
  for (const mode of ["sum", "difference", "product", "quotient"]) {
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const [first, second] = core.pairFor(mode);
      const high = Math.max(first, second);
      const low = Math.min(first, second);
      assert.ok(first > 0 && second > 0, `${mode}: valeurs positives`);
      if (mode === "difference") {
        assert.ok(high <= 12 && high - low >= 2 && high - low <= 8, `${high} − ${low}`);
      }
      if (mode === "quotient") {
        assert.equal(high % low, 0, `${high} ÷ ${low}`);
        assert.ok(high / low >= 2 && high / low <= 6, `${high} ÷ ${low}`);
      }
    }
  }
});

test("un bloc de huit défis sert chaque opération une fois à chacun", () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const sequence = Array.from(core.balancedSequence());
    for (let index = 0; index < sequence.length; index += 2) assert.equal(sequence[index], sequence[index + 1]);
    assert.deepEqual([...new Set(sequence.filter((_, index) => index % 2 === 0))].sort(), ["difference", "product", "quotient", "sum"]);
    assert.deepEqual([...new Set(sequence.filter((_, index) => index % 2 === 1))].sort(), ["difference", "product", "quotient", "sum"]);
  }
});

test("le niveau 2 du Duo utilise des calculs plus grands et des divisions exactes", () => {
  for (const mode of ["sum", "difference", "product", "quotient"]) {
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const [first, second] = core.pairFor(mode, 2);
      const high = Math.max(first, second), low = Math.min(first, second);
      if (mode === "sum") assert.ok(low >= 6 && high <= 20);
      if (mode === "difference") assert.ok(high >= 10 && high <= 20 && low >= 1 && high - low >= 3);
      if (mode === "product") assert.ok(high >= 11 && high <= 20 && low >= 3 && low <= 15);
      if (mode === "quotient") {
        assert.ok(low >= 6 && low <= 20);
        assert.equal(high % low, 0);
        assert.ok(high / low >= 2 && high / low <= 9);
      }
      assert.ok(Number.isInteger(core.calculate(mode, first, second)));
    }
  }
});

test("chaque plateau Duo respecte le niveau choisi et possède une solution voisine", () => {
  for (const level of [1, 2]) {
    const fillMax = level === 1 ? 12 : 20;
    for (const operation of ["sum", "difference", "product", "quotient"]) {
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const board = core.challenge(level, operation);
        assert.equal(board.mode, operation);
        assert.equal(board.values.length, 16);
        assert.ok(board.values.every(value => Number.isInteger(value) && value > 0));
        assert.ok(board.values.filter(value => value > fillMax).length <= (operation === "quotient" ? 1 : 0));
        assert.ok(board.neighbors.some(([first, second]) => core.operationFor(operation, board.values[first], board.values[second]) === board.target));
      }
    }
  }
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
