import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getOperationDisplayState,
  makeDisplayMetrics,
  makeDivision,
  makeSteps
} from "../outils/division-posee/division-engine.mjs";

const interfaceHtml = readFileSync(new URL("../outils/division-posee/division-posee.html", import.meta.url), "utf8");
const interfaceCss = readFileSync(new URL("../outils/division-posee/division-posee.css", import.meta.url), "utf8");
const interfaceJs = readFileSync(new URL("../outils/division-posee/division-posee.js", import.meta.url), "utf8");

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

test("la multiplication, la soustraction et l'abaissement ont chacun leur étape", () => {
  const division = makeDivision(584, 7, "integer", 2);
  const steps = makeSteps(division);
  assert.deepEqual(
    steps.map(({ kind }) => kind),
    ["predict", "choose", "multiply", "subtract", "bring", "choose", "multiply", "subtract", "finish"]
  );
  assert.equal(steps.filter(({ kind }) => kind === "bring").length, 1);
  assert.equal(steps.filter(({ kind }) => kind === "multiply").length, 2);
  assert.equal(steps.filter(({ kind }) => kind === "subtract").length, 2);
  assert.equal(steps.at(-1).kind, "finish");

  const firstMultiply = steps.find(({ kind, opIndex }) => kind === "multiply" && opIndex === 0);
  const firstSubtract = steps.find(({ kind, opIndex }) => kind === "subtract" && opIndex === 0);
  const firstBring = steps.find(({ kind, opIndex }) => kind === "bring" && opIndex === 0);
  assert.deepEqual(getOperationDisplayState(division, 0, firstMultiply), {
    quotient: true,
    product: true,
    subtraction: false,
    result: null
  });
  assert.deepEqual(getOperationDisplayState(division, 0, firstSubtract), {
    quotient: true,
    product: true,
    subtraction: true,
    result: "remainder"
  });
  assert.equal(getOperationDisplayState(division, 0, firstBring).result, "next");
});

test("l'anticipation explique l'encadrement et propose un calcul simple", () => {
  const [anticipation] = makeSteps(makeDivision(584, 7, "integer", 2));
  assert.equal(anticipation.sentence, "Le quotient entier aura 2 chiffres.");
  assert.match(anticipation.detail, /7 × 10 = 70/);
  assert.match(anticipation.detail, /7 × 100 = 700/);
  assert.match(anticipation.detail, /le quotient est entre 10 et 100/);
  assert.match(anticipation.detail, /560 ÷ 7 = 80, donc 584 ÷ 7 ≈ 80/);
});

test("l'affichage réserve toutes les lignes et s'adapte aux longues divisions", () => {
  const shortMetrics = makeDisplayMetrics(makeDivision(584, 7, "integer", 2));
  const longMetrics = makeDisplayMetrics(makeDivision(12345678, 7, "decimal", 6));
  assert.deepEqual(shortMetrics, {
    rowCount: 5,
    rowHeight: 50,
    digitSize: 36,
    columnWidth: 48,
    quotientSize: 35
  });
  assert.ok(longMetrics.rowCount > shortMetrics.rowCount);
  assert.ok(longMetrics.rowHeight < shortMetrics.rowHeight);
  assert.ok(longMetrics.rowCount * longMetrics.rowHeight <= 410);
  assert.ok(longMetrics.digitSize >= 13);
});

test("l'anticipation indique clairement un quotient inférieur à un", () => {
  const [anticipation] = makeSteps(makeDivision(3, 7, "integer", 2));
  assert.equal(anticipation.sentence, "Le quotient entier est 0.");
  assert.match(anticipation.detail, /inférieur à 1/);
});

test("l'interface conserve les repères visuels demandés", () => {
  assert.match(interfaceHtml, /href="\/outils\/\?domain=nombres-calculs&amp;notion=numeration"/);
  assert.match(interfaceHtml, /id="decimal-field" hidden/);
  assert.match(interfaceCss, /\.decimal-field\[hidden\][^{]*\{[^}]*display:\s*none/);
  assert.match(interfaceCss, /\.table-card\s*\{[^}]*height:\s*100%/);
  assert.match(interfaceCss, /\.digit-row\s*\{[^}]*height:\s*var\(--row-height/);
  assert.match(interfaceCss, /\.subtraction-rule\s*\{/);
  assert.match(interfaceCss, /\.lower-arrow\s*\{[^}]*z-index:\s*3[^}]*height:\s*calc\(var\(--row-height, 50px\) \* 1\.16\)/);
  assert.match(interfaceJs, /decimalPlaces\.disabled = mode !== "decimal"/);
  assert.match(interfaceJs, /work\.append\(digitRow\(operation\.product/);
  assert.match(interfaceJs, /work\.append\(digitRow\(resultValue/);
});

test("les entrées invalides sont refusées", () => {
  assert.throws(() => makeDivision(12, 0), RangeError);
  assert.throws(() => makeDivision(-1, 4), RangeError);
  assert.throws(() => makeDivision(12.5, 4), RangeError);
});
