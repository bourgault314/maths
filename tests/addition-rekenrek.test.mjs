import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  REKENREK_CAPACITY,
  makeRekenrekCalculation,
  moveRekenrekBead,
  rekenrekValue,
  splitRekenrekValue
} from "../outils/addition-posee/rekenrek-20-model.mjs";

const helperSource = readFileSync(new URL("../outils/addition-posee/rekenrek-20.js", import.meta.url), "utf8");
const helperCss = readFileSync(new URL("../outils/addition-posee/rekenrek-20.css", import.meta.url), "utf8");
const teacherSource = readFileSync(new URL("../outils/addition-posee/addition-posee.js", import.meta.url), "utf8");
const studentSource = readFileSync(new URL("../outils/addition-posee/addition-posee-interactive.js", import.meta.url), "utf8");

test("le Rekenrek 20 répartit exactement les nombres sur deux rangées", () => {
  assert.equal(REKENREK_CAPACITY, 20);
  assert.deepEqual(splitRekenrekValue(0), [0, 0]);
  assert.deepEqual(splitRekenrekValue(8), [8, 0]);
  assert.deepEqual(splitRekenrekValue(10), [10, 0]);
  assert.deepEqual(splitRekenrekValue(16), [10, 6]);
  assert.deepEqual(splitRekenrekValue(20), [10, 10]);
  assert.equal(rekenrekValue([10, 6]), 16);
  assert.throws(() => splitRekenrekValue(21), RangeError);
  assert.throws(() => rekenrekValue([10]), TypeError);
});

test("l’aide reprend les chiffres et la retenue de la colonne du moteur", () => {
  assert.deepEqual(
    makeRekenrekCalculation({ addendDigits: [4, 9], carryIn: 0 }),
    { parts: [4, 9], start: 4, additions: [9], carry: 0, total: 13, rows: [4, 0] }
  );
  assert.deepEqual(
    makeRekenrekCalculation({ addendDigits: [8, 7], carryIn: 1 }),
    { parts: [8, 7, 1], start: 8, additions: [7, 1], carry: 1, total: 16, rows: [8, 0] }
  );
  assert.equal(makeRekenrekCalculation({ addendDigits: [9, 9], carryIn: 1 }).total, 19);
});

test("un clic déplace le groupe de billes comme dans le Rekenrek existant", () => {
  assert.deepEqual(moveRekenrekBead([4, 0], 0, 6), [7, 0]);
  assert.deepEqual(moveRekenrekBead([7, 0], 0, 4), [4, 0]);
  assert.deepEqual(moveRekenrekBead([10, 0], 1, 5), [10, 6]);
});

test("les deux additions utilisent la même aide, sans réponse ni score", () => {
  assert.match(teacherSource, /createRekenrek20Help/);
  assert.match(studentSource, /createRekenrek20Help/);
  assert.match(helperSource, /dialog\.showModal\(\)/);
  assert.match(helperSource, /Retour à l’addition/);
  assert.match(helperSource, /Le rang reste celui indiqué dans l’addition posée/);
  assert.doesNotMatch(helperSource, /calculation\.total|score|Vérifier/);
  assert.match(helperCss, /\.rekenrek-bead\.is-red/);
  assert.match(helperCss, /\.rekenrek-bead\.is-white/);
  assert.match(helperCss, /@media \(max-width: 520px\)/);
  assert.match(helperCss, /@media \(prefers-reduced-motion: reduce\)/);
});
