import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getOperationDisplayState,
  makeAnticipationChecks,
  makeDisplayMetrics,
  makeDivision,
  makeSteps,
  multiplicationBracket,
  placeValueMarker,
  placeValueName
} from "../outils/division-posee/division-engine.mjs";

const interfaceHtml = readFileSync(new URL("../outils/division-posee/division-posee.html", import.meta.url), "utf8");
const interfaceCss = readFileSync(new URL("../outils/division-posee/division-posee.css", import.meta.url), "utf8");
const interfaceJs = readFileSync(new URL("../outils/division-posee/division-posee.js", import.meta.url), "utf8");
const viewJs = readFileSync(new URL("../outils/division-posee/division-view.mjs", import.meta.url), "utf8");
const gabaritGenerator = readFileSync(new URL("../outils/division-posee/_generer_gabarits.py", import.meta.url), "utf8");

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
    ["anticipation-question", "anticipation-answer", "anticipation-question", "anticipation-result", "estimate", "ask", "choose", "multiply", "subtract-ask", "subtract", "bring", "ask", "choose", "multiply", "subtract-ask", "subtract", "finish"]
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

test("l'anticipation cherche le premier rang partageable avant l'estimation", () => {
  const division = makeDivision(584, 7, "integer", 2);
  assert.deepEqual(makeAnticipationChecks(division).map(({ endColumn, partial, canShare }) => ({ endColumn, partial, canShare })), [
    { endColumn: 0, partial: 5, canShare: false },
    { endColumn: 1, partial: 58, canShare: true }
  ]);
  const [firstQuestion, firstAnswer, secondQuestion, result, estimate] = makeSteps(division);
  assert.equal(firstQuestion.kind, "anticipation-question");
  assert.equal(firstQuestion.sentence, "Je partage 5 centaines en 7 parts égales.");
  assert.equal(firstQuestion.detail, "Chaque part peut-elle recevoir au moins 1 centaine ?");
  assert.equal(firstQuestion.anticipationEndColumn, 0);
  assert.equal(firstAnswer.sentence, "Non. J’échange 5 centaines contre 50 dizaines.");
  assert.equal(firstAnswer.detail, "Avec 8 dizaines, j’obtiens 58 dizaines.");
  assert.equal(secondQuestion.sentence, "Je partage 58 dizaines en 7 parts égales.");
  assert.equal(secondQuestion.detail, "Chaque part peut-elle recevoir au moins 1 dizaine ?");
  assert.equal(secondQuestion.anticipationEndColumn, 1);
  assert.equal(result.kind, "anticipation-result");
  assert.equal(result.sentence, "Oui. Le quotient commence au rang des dizaines.");
  assert.equal(result.detail, "Il aura 2 chiffres.");
  assert.equal(result.quotientDigitCount, 2);
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
  assert.equal(question.sentence, "Pour trouver le chiffre des dizaines du quotient, je cherche : dans 58, combien de fois 21 ?");
  assert.equal(question.detail, "Je partage 58 dizaines en 21 parts égales.");
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

test("la navigation mobile aligne précédente et suivante puis centre tout afficher", () => {
  assert.match(interfaceHtml, /division-posee\.css\?v=11/);
  assert.match(interfaceCss, /@media \(max-width: 780px\)[\s\S]*\.step-controls #previous \{ grid-column: 1; grid-row: 1; \}/);
  assert.match(interfaceCss, /@media \(max-width: 780px\)[\s\S]*\.step-controls #next \{ grid-column: 2; grid-row: 1; \}/);
  assert.match(interfaceCss, /@media \(max-width: 780px\)[\s\S]*\.step-controls #show-all \{ grid-column: 1 \/ -1; grid-row: 2; justify-self: center; \}/);
  assert.match(interfaceCss, /padding-bottom: max\(18px, env\(safe-area-inset-bottom\)\)/);
});

test("le vocabulaire suit la valeur de position à chaque échange", () => {
  const division = makeDivision(5849, 7, "integer", 2);
  const steps = makeSteps(division);
  assert.equal(placeValueName(division, 1), "centaines");
  assert.equal(steps.find(({ kind }) => kind === "ask").sentence, "Pour trouver le chiffre des centaines du quotient, je cherche : dans 58, combien de fois 7 ?");
  assert.equal(steps.find(({ kind }) => kind === "ask").detail, "Je partage 58 centaines en 7 parts égales.");
  assert.equal(steps.find(({ kind }) => kind === "bring").sentence, "2 centaines = 20 dizaines.");
  assert.equal(steps.find(({ kind }) => kind === "bring").detail, "J’abaisse 4 dizaines : j’obtiens 24 dizaines.");
  assert.ok(steps.some(({ sentence }) => sentence === "Pour trouver le chiffre des unités du quotient, je cherche : dans 39, combien de fois 7 ?"));
});

test("la poursuite décimale introduit le dixième au dividende avant la virgule au quotient", () => {
  const division = makeDivision(5849, 7, "decimal", 2);
  const steps = makeSteps(division);
  const decimal = steps.find(({ kind }) => kind === "decimal");
  const decimalBringSteps = steps.filter(({ kind, opIndex }) => kind === "bring" && division.operations[opIndex].nextEndColumn >= division.integerLength);
  assert.ok(steps.indexOf(decimalBringSteps[0]) < steps.indexOf(decimal));
  assert.equal(decimal.sentence, "Le dividende comporte maintenant des dixièmes.");
  assert.equal(decimal.detail, "J’écris la virgule et je réserve la place des dixièmes au quotient.");
  assert.deepEqual(decimalBringSteps.map(({ sentence }) => sentence), [
    "4 unités = 40 dixièmes.",
    "5 dixièmes = 50 centièmes."
  ]);
  const decimalQuestions = steps.filter(({ kind, opIndex }) => kind === "ask" && division.operations[opIndex].endColumn >= division.integerLength);
  assert.deepEqual(decimalQuestions.map(({ sentence }) => sentence), [
    "Pour trouver le chiffre des dixièmes du quotient, je cherche : dans 40, combien de fois 7 ?",
    "Pour trouver le chiffre des centièmes du quotient, je cherche : dans 50, combien de fois 7 ?"
  ]);
  assert.deepEqual(decimalQuestions.map(({ detail }) => detail), [
    "Je partage 40 dixièmes en 7 parts égales.",
    "Je partage 50 centièmes en 7 parts égales."
  ]);
  assert.ok(decimalBringSteps.every((step, index) => steps.indexOf(step) < steps.indexOf(decimalQuestions[index])));
  assert.ok(decimalBringSteps.every(({ detail }) => detail.startsWith("Je fais apparaître un 0")));
  assert.ok(decimalBringSteps.every(({ detail }) => detail.includes("dans le dividende")));
  assert.equal(getOperationDisplayState(division, decimal.opIndex, decimal).result, "next");
});

test("les repères abrégés suivent les rangs entiers et décimaux", () => {
  const division = makeDivision(5849, 7, "decimal", 3);
  assert.deepEqual(
    division.digits.map((_, column) => placeValueMarker(division, column)),
    ["um", "c", "d", "u", "d", "c", "m"]
  );
});

test("la table peut encadrer le dividende partiel entre deux produits", () => {
  const division = makeDivision(534, 7, "integer", 2);
  assert.deepEqual(multiplicationBracket(division, 0), {
    target: 53,
    lowerMultiplier: 7,
    lowerProduct: 49,
    upperMultiplier: 8,
    upperProduct: 56
  });
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
  const projectionMetrics = makeDisplayMetrics(makeDivision(584, 7, "integer", 2), {
    rowBudget: 430,
    columnBudget: 680,
    quotientBudget: 300,
    maxRowHeight: 60,
    maxColumnWidth: 58,
    maxDigitSize: 43,
    maxQuotientSize: 43
  });
  assert.ok(projectionMetrics.digitSize > shortMetrics.digitSize);
  assert.ok(projectionMetrics.columnWidth > shortMetrics.columnWidth);
});

test("l'anticipation indique clairement un quotient inférieur à un", () => {
  const [question, result] = makeSteps(makeDivision(3, 7, "integer", 2));
  assert.equal(question.sentence, "Je partage 3 unités en 7 parts égales.");
  assert.equal(question.detail, "Chaque part peut-elle recevoir au moins 1 unité ?");
  assert.equal(result.sentence, "Non : je n’ai que 3 unités.");
  assert.equal(result.detail, "Le quotient entier est 0.");
});

test("l'interface conserve les repères visuels demandés", () => {
  assert.match(interfaceHtml, /division-posee\.js\?v=15/);
  assert.match(interfaceHtml, /class="back-link" href="\.\/">← Division posée<\/a>/);
  assert.match(interfaceHtml, /id="decimal-field" hidden/);
  assert.match(interfaceHtml, /id="rank-guides" type="checkbox"/);
  assert.match(interfaceHtml, /id="projection-recap"[^>]*hidden/);
  assert.match(interfaceHtml, /id="table-bracket"[^>]*hidden/);
  assert.match(interfaceHtml, /id="table-toggle"[^>]*aria-label="Masquer la table"[^>]*aria-expanded="true"[^>]*>Masquer/);
  assert.match(interfaceCss, /\.decimal-field\[hidden\][^{]*\{[^}]*display:\s*none/);
  assert.match(interfaceCss, /\.table-card\s*\{[^}]*height:\s*100%/);
  assert.match(interfaceCss, /grid-template-rows:\s*repeat\(10,/);
  assert.match(interfaceCss, /--stage-min-height:\s*clamp\(380px,\s*calc\(100svh - 477px\),\s*535px\)/);
  assert.match(interfaceCss, /\.board-card\s*\{[^}]*grid-template-rows:\s*116px/);
  assert.match(interfaceCss, /\.digit-row\s*\{[^}]*height:\s*var\(--row-height/);
  assert.match(interfaceCss, /\.subtraction-rule\s*\{/);
  assert.match(interfaceCss, /\.lower-arrow\s*\{[^}]*position:\s*absolute[^}]*z-index:\s*6/);
  assert.doesNotMatch(interfaceCss, /\.lower-arrow\s*\{[^}]*top:\s*92%/);
  assert.match(interfaceCss, /\.quotient-slot\.is-empty \.quotient-slot-value::after/);
  assert.match(interfaceCss, /\.quotient-slot\s*\{[^}]*grid-template-rows:\s*minmax\(0, 1fr\)/);
  assert.match(interfaceCss, /\.long-division\.has-rank-guides \.quotient-slot\s*\{[^}]*grid-template-rows:\s*\.38em 1\.05em/);
  assert.match(interfaceCss, /\.multiple\.is-upper-bound \.multiple-equation\s*\{/);
  assert.match(interfaceCss, /\.table-target-badge\s*\{/);
  assert.match(interfaceCss, /\.multiple\.is-target-after \.table-target-badge/);
  assert.match(interfaceCss, /@media \(min-width: 1280px\)[\s\S]*\.instruction[^}]*grid-column:\s*1[^}]*grid-row:\s*1 \/ 3/);
  assert.match(interfaceCss, /\.rank-marker\s*\{/);
  assert.match(interfaceCss, /body\.is-projection \.controls-card|body\.is-projection/);
  assert.doesNotMatch(interfaceCss, /\.relation-sign\s*\{[^}]*display:\s*none/);
  assert.match(interfaceJs, /decimalPlaces\.disabled = mode !== "decimal"/);
  assert.match(interfaceJs, /const visibleEnd = operationEnd/);
  assert.match(interfaceJs, /isUnrevealedDecimal/);
  assert.match(interfaceJs, /\["ask", "choose"\]/);
  assert.match(interfaceJs, /quotientWriting\(step\)/);
  assert.match(interfaceJs, /division-engine\.mjs\?v=11/);
  assert.match(interfaceJs, /division-view\.mjs\?v=3/);
  assert.match(interfaceJs, /renderMultiplicationTable\(/);
  assert.match(interfaceJs, /const showIntegerSlots = !\["anticipation-question", "anticipation-answer"\]\.includes\(step\.kind\)/);
  assert.match(interfaceJs, /mathsgo-division-rank-guides/);
  assert.match(interfaceJs, /step\.kind === "choose"[^?]*\? multiplicationBracket/s);
  assert.match(interfaceJs, /syncProjectionMode/);
  assert.match(interfaceJs, /button\.textContent = "⛶"/);
  assert.match(interfaceJs, /document\.exitFullscreen/);
  assert.match(interfaceJs, /fullscreenchange/);
  assert.match(interfaceJs, /work\.append\(digitRow\(operation\.product/);
  assert.match(interfaceJs, /work\.append\(digitRow\(resultValue/);
  assert.match(interfaceJs, /scheduleLoweringArrow\(root\)/);
  assert.match(viewJs, /bracketLine\.hidden = true/);
  assert.match(viewJs, /multiples\.classList\.add\("has-target-marker"\)/);
  assert.doesNotMatch(gabaritGenerator, /BLUE_SOFT if multiplier != 0 else ORANGE_SOFT/);
});

test("les entrées invalides sont refusées", () => {
  assert.throws(() => makeDivision(12, 0), RangeError);
  assert.throws(() => makeDivision(-1, 4), RangeError);
  assert.throws(() => makeDivision(12.5, 4), RangeError);
});
