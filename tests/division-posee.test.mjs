import assert from "node:assert/strict";
import test from "node:test";
import { makeDivision, makeSteps } from "../outils/division-posee/division-engine.mjs";

test("division euclidienne exacte", () => {
  const result = makeDivision(584, 7, "integer", 2);
  assert.equal(result.quotient, "83");
  assert.equal(result.remainder, 3);
  assert.equal(result.operations.length, 2);
});

test("division euclidienne avec un zéro au quotient", () => {
  const result = makeDivision(1005, 5, "integer", 2);
  assert.equal(result.quotient, "201");
  assert.equal(result.remainder, 0);
});

test("dividende inférieur au diviseur", () => {
  const result = makeDivision(3, 7, "integer", 2);
  assert.equal(result.quotient, "0");
  assert.equal(result.remainder, 3);
});

test("quotient décimal exact", () => {
  const result = makeDivision(13, 4, "decimal", 3);
  assert.equal(result.quotient, "3,25");
  assert.equal(result.scaledRemainder, "0");
});

test("quotient décimal inférieur à un", () => {
  const result = makeDivision(1, 8, "decimal", 3);
  assert.equal(result.quotient, "0,125");
  assert.equal(result.scaledRemainder, "0");
});

test("développement décimal limité au nombre demandé", () => {
  const result = makeDivision(2, 3, "decimal", 4);
  assert.equal(result.quotient, "0,6666");
  assert.equal(result.scaledRemainder, "0,0002");
});

test("les étapes n'affichent l'abaissement que pendant l'étape dédiée", () => {
  const steps = makeSteps(makeDivision(584, 7, "integer", 2));
  assert.equal(steps.filter(({ kind }) => kind === "bring").length, 1);
  assert.equal(steps.at(-1).kind, "finish");
});

test("les entrées invalides sont refusées", () => {
  assert.throws(() => makeDivision(12, 0), RangeError);
  assert.throws(() => makeDivision(-1, 4), RangeError);
  assert.throws(() => makeDivision(12.5, 4), RangeError);
});
