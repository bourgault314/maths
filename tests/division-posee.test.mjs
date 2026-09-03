import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getOperationDisplayState,
  makeDisplayMetrics,
  makeDivision,
  makeSteps,
  placeValueName
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
    ["bound", "digits", "estimate", "ask", "choose", "multiply", "subtract-ask", "subtract", "bring", "ask", "choose", "multiply", "subtract-ask", "subtract", "finish"]
  );
  assert.equal(steps.filter(({ kind }) => kind === "bring").length, 1);
  assert.equal(steps.filter(({ kind }) => kind === "multiply").length, 2);
  assert.equal(steps.filter(({ kind }) => kind === "subtract").length, 2);
  assert.equal(steps.filter(({ kind }) => kind === "subtract-ask").length, 2);
  assert.equal(steps.at(-1).kind, "finish");

  const firstMultiply = steps.find(({ kind, opIndex }) => kind === "multiply" && opIndex === 0);
  const firstSubtractQuestion = steps.find(({ kind, opIndex }) => kind === "subtract-ask" && opIndex === 0);
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
  assert.deepEqual(getOperationDisplayState(division, 0, firstSubtractQuestion), {
    quotient: true,
    product: true,
    subtraction: true,
    result: null
  });
  assert.equal(firstSubtractQuestion.sentence, "58 − 56 = ?");
  assert.equal(getOperationDisplayState(division, 0, firstBring).result, "next");
});

test("l'anticipation sépare l'encadrement exact de l'estimation", () => {
  const [bound, digits, estimate] = makeSteps(makeDivision(584, 7, "integer", 2));
  assert.equal(bound.kind, "bound");
  assert.equal(bound.sentence, "70 ≤ 584 < 700");
  assert.equal(bound.detail, "7 × 10 = 70 et 7 × 100 = 700");
  assert.equal(bound.quotientDigitCount, undefined);
  assert.equal(digits.kind, "digits");
  assert.equal(digits.sentence, "10 ≤ 584 ÷ 7 < 100");
  assert.equal(digits.detail, "Le quotient aura 2 chiffres.");
  assert.equal(digits.quotientDigitCount, 2);
  assert.equal(estimate.kind, "estimate");
  assert.equal(estimate.sentence, "560 ÷ 7 = 80");
  assert.match(estimate.detail, /560 est proche de 584/);
  assert.match(estimate.detail, /proche de 80/);
});

test("la question précède la révélation du chiffre", () => {
  const division = makeDivision(584, 21, "integer", 2);
  const steps = makeSteps(division);
  const question = steps.find(({ kind }) => kind === "ask");
  const choice = steps.find(({ kind }) => kind === "choose");
  assert.equal(question.sentence, "58 dizaines ÷ 21 : combien de dizaines au quotient ?");
  assert.equal(question.detail, undefined);
  assert.deepEqual(getOperationDisplayState(division, 0, question), {
    quotient: false,
    product: false,
    subtraction: false,
    result: null
  });
  assert.equal(choice.sentence, "J’écris 2 au rang des dizaines.");
  assert.equal(choice.detail, "2 × 21 = 42, et 3 × 21 = 63 serait trop grand.");
  assert.equal(getOperationDisplayState(division, 0, choice).quotient, true);
});

test("le vocabulaire suit la valeur de position à chaque échange", () => {
  const division = makeDivision(5849, 7, "integer", 2);
  const steps = makeSteps(division);
  assert.equal(placeValueName(division, 1), "centaines");
  assert.equal(steps.find(({ kind }) => kind === "ask").sentence, "58 centaines ÷ 7 : combien de centaines au quotient ?");
  assert.equal(steps.find(({ kind }) => kind === "bring").sentence, "2 centaines = 20 dizaines.");
  assert.equal(steps.find(({ kind }) => kind === "bring").detail, "J’abaisse 4 dizaines : j’obtiens 24 dizaines.");
  assert.ok(steps.some(({ sentence }) => sentence === "39 unités ÷ 7 : combien d’unités au quotient ?"));
});

test("la poursuite décimale introduit la virgule puis les zéros un par un", () => {
  const division = makeDivision(5849, 7, "decimal", 2);
  const steps = makeSteps(division);
  const decimal = steps.find(({ kind }) => kind === "decimal");
  const decimalBringSteps = steps.filter(({ kind, opIndex }) => kind === "bring" && division.operations[opIndex].nextEndColumn >= division.integerLength);
  assert.equal(decimal.sentence, "Il reste 4 unités.");
  assert.equal(decimal.detail, "J’écris la virgule au quotient pour continuer.");
  assert.deepEqual(decimalBringSteps.map(({ sentence }) => sentence), [
    "4 unités = 40 dixièmes.",
    "5 dixièmes = 50 centièmes."
  ]);
  assert.ok(decimalBringSteps.every(({ detail }) => detail.startsWith("Je fais apparaître un 0")));
});

test("l'affichage réserve toutes les lignes et s'adapte aux longues divisions", () => {
  const shortMetrics = makeDisplayMetrics(makeDivision(584, 7, "integer", 2));
  const threeLevelMetrics = makeDisplayMetrics(makeDivision(5849, 7, "integer", 2));
  const longMetrics = makeDisplayMetrics(makeDivision(12345678, 7, "decimal", 6));
  assert.deepEqual(shortMetrics, {
    rowCount: 5,
    rowHeight: 50,
    digitSize: 36,
    columnWidth: 48,
    quotientSize: 35
  });
  assert.equal(threeLevelMetrics.rowHeight, 47);
  assert.ok(threeLevelMetrics.rowCount * threeLevelMetrics.rowHeight <= 330);
  assert.ok(longMetrics.rowCount > shortMetrics.rowCount);
  assert.ok(longMetrics.rowHeight < shortMetrics.rowHeight);
  assert.ok(longMetrics.rowCount * longMetrics.rowHeight <= 410);
  assert.ok(longMetrics.digitSize >= 13);
});

test("l'anticipation indique clairement un quotient inférieur à un", () => {
  const [bound, digits] = makeSteps(makeDivision(3, 7, "integer", 2));
  assert.equal(bound.sentence, "0 ≤ 3 < 7");
  assert.equal(bound.detail, "Le dividende est plus petit que le diviseur.");
  assert.equal(digits.sentence, "0 ≤ 3 ÷ 7 < 1");
  assert.equal(digits.detail, "Le quotient entier est 0.");
});

test("l'interface conserve les repères visuels demandés", () => {
  assert.match(interfaceHtml, /href="\/outils\/\?domain=nombres-calculs&amp;notion=numeration"/);
  assert.match(interfaceHtml, /id="decimal-field" hidden/);
  assert.match(interfaceCss, /\.decimal-field\[hidden\][^{]*\{[^}]*display:\s*none/);
  assert.match(interfaceCss, /\.table-card\s*\{[^}]*height:\s*100%/);
  assert.match(interfaceCss, /grid-template-rows:\s*repeat\(10,/);
  assert.match(interfaceCss, /--stage-min-height:\s*clamp\(380px,\s*calc\(100svh - 477px\),\s*535px\)/);
  assert.match(interfaceCss, /\.instruction\s*\{[^}]*height:\s*104px/);
  assert.match(interfaceCss, /\.digit-row\s*\{[^}]*height:\s*var\(--row-height/);
  assert.match(interfaceCss, /\.subtraction-rule\s*\{/);
  assert.match(interfaceCss, /\.lower-arrow\s*\{[^}]*z-index:\s*3[^}]*top:\s*92%[^}]*height:\s*calc\(var\(--row-height, 50px\) \* 1\.02\)/);
  assert.match(interfaceCss, /\.quotient-slot\.is-empty\s*\{[^}]*border-bottom/);
  assert.match(interfaceJs, /decimalPlaces\.disabled = mode !== "decimal"/);
  assert.match(interfaceJs, /const visibleEnd = operationEnd/);
  assert.match(interfaceJs, /isUnrevealedDecimal/);
  assert.match(interfaceJs, /\["ask", "choose"\]/);
  assert.match(interfaceJs, /quotientWriting\(step\)/);
  assert.match(interfaceJs, /Array\.from\(\{ length: 10 \}/);
  assert.match(interfaceJs, /const showEmptySlots = step\.kind !== "bound"/);
  assert.match(interfaceJs, /button\.textContent = "⛶"/);
  assert.match(interfaceJs, /document\.exitFullscreen/);
  assert.match(interfaceJs, /fullscreenchange/);
  assert.match(interfaceJs, /work\.append\(digitRow\(operation\.product/);
  assert.match(interfaceJs, /work\.append\(digitRow\(resultValue/);
});

test("les entrées invalides sont refusées", () => {
  assert.throws(() => makeDivision(12, 0), RangeError);
  assert.throws(() => makeDivision(-1, 4), RangeError);
  assert.throws(() => makeDivision(12.5, 4), RangeError);
});
