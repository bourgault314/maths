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

const context = vm.createContext({});
vm.runInContext(`
  const OPERATION_MODES = ["sum", "difference", "product", "quotient"];
  let mode = "sum";
  let challengeNumber = 0;
  let operationCycle = [];
  ${extractFunction("randomInteger")}
  ${extractFunction("shuffle")}
  ${extractFunction("calculate")}
  ${extractFunction("operation")}
  ${extractFunction("pairFor")}
  ${extractFunction("nextBalancedMode")}
  globalThis.duelCore = {
    calculate,
    operationFor(nextMode, first, second) { mode = nextMode; return operation(first, second); },
    pairFor,
    balancedSequence(length = 8) {
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
