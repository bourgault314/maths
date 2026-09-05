import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import {
  makeDisplayMetrics,
  makeMultiplication,
  MAX_DECIMAL_DIGITS,
  MAX_FACTOR_DIGITS,
  MAX_INPUT_CHARACTERS,
  MAX_INTEGER_DIGITS,
  MAX_MULTIPLIER_DIGITS,
  MultiplicationInputError,
  multiplyDigitStrings,
  parseFactorInput,
  placeValueMarker,
  placeValueName
} from "../outils/multiplication-posee/multiplication-engine.mjs";
import {
  getMultiplicationDisplayState,
  makeSteps
} from "../outils/multiplication-posee/multiplication-steps.mjs";
import {
  buildMultiplicationAriaLabel,
  partialRowMarker
} from "../outils/multiplication-posee/multiplication-view.mjs";

const root = new URL("../", import.meta.url);
const readText = (path) => readFileSync(new URL(path, root), "utf8");
const interfaceHtml = readText("outils/multiplication-posee/multiplication-posee.html");
const interfaceCss = readText("outils/multiplication-posee/multiplication-posee.css");
const interfaceJs = readText("outils/multiplication-posee/multiplication-posee.js");
const entryHtml = readText("outils/multiplication-posee/index.html");
const thumbnailSvg = readText("assets/img/thumbnails/numeration/multiplication-posee.svg");
const catalogueSource = readText("assets/js/catalogue-refonte-data.js");

function catalogue() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(catalogueSource, context);
  return context.window.MATHSGO_CATALOGUE;
}

test("327 × 46 produit deux produits partiels correctement décalés", () => {
  const multiplication = makeMultiplication(["327", "46"]);
  assert.equal(multiplication.rawProduct, "15042");
  assert.equal(multiplication.resultDisplay, "15042");
  assert.deepEqual(multiplication.displayFactors, ["327", "46"]);
  assert.deepEqual(
    multiplication.partials.map(({ multiplierDigit, shift, coreProduct, shiftedProduct, cells }) => ({
      multiplierDigit,
      shift,
      coreProduct,
      shiftedProduct,
      cells
    })),
    [
      { multiplierDigit: 6, shift: 0, coreProduct: "1962", shiftedProduct: "1962", cells: [null, "1", "9", "6", "2"] },
      { multiplierDigit: 4, shift: 1, coreProduct: "1308", shiftedProduct: "13080", cells: ["1", "3", "0", "8", "0"] }
    ]
  );
  assert.deepEqual(
    multiplication.additionOperations.map(({ addendDigits, carryIn, total, resultDigit, carryOut }) => ({
      addendDigits,
      carryIn,
      total,
      resultDigit,
      carryOut
    })),
    [
      { addendDigits: [2, 0], carryIn: 0, total: 2, resultDigit: 2, carryOut: 0 },
      { addendDigits: [6, 8], carryIn: 0, total: 14, resultDigit: 4, carryOut: 1 },
      { addendDigits: [9, 0], carryIn: 1, total: 10, resultDigit: 0, carryOut: 1 },
      { addendDigits: [1, 3], carryIn: 1, total: 5, resultDigit: 5, carryOut: 0 },
      { addendDigits: [0, 1], carryIn: 0, total: 1, resultDigit: 1, carryOut: 0 }
    ]
  );
});

test("chaque chiffre du multiplicateur crée sa ligne, y compris zéro", () => {
  const multiplication = makeMultiplication(["1005", "101"]);
  assert.equal(multiplication.resultDisplay, "101505");
  assert.deepEqual(
    multiplication.partials.map(({ multiplierDigit, shift, coreProduct, shiftedProduct }) => ({
      multiplierDigit,
      shift,
      coreProduct,
      shiftedProduct
    })),
    [
      { multiplierDigit: 1, shift: 0, coreProduct: "1005", shiftedProduct: "1005" },
      { multiplierDigit: 0, shift: 1, coreProduct: "0", shiftedProduct: "0" },
      { multiplierDigit: 1, shift: 2, coreProduct: "1005", shiftedProduct: "100500" }
    ]
  );
  assert.equal(multiplication.partials[1].shiftedWritten, "00000");
  assert.deepEqual(multiplication.partials[2].shiftLayoutIndices, [4, 5]);
});

test("les multiplications par zéro, par un et avec des longueurs différentes restent exactes", () => {
  const cases = [
    [["0", "873"], "0"],
    [["98765", "1"], "98765"],
    [["7", "1234"], "8638"],
    [["999", "999"], "998001"],
    [["12345678", "99999"], "1234555454322"]
  ];
  for (const [values, expected] of cases) {
    assert.equal(makeMultiplication(values).rawProduct, expected, values.join(" × "));
  }
  assert.equal(multiplyDigitStrings("123456789", "987654321"), "121932631112635269");
});

test("les décimaux avec point ou virgule sont multipliés sans flottants", () => {
  const cases = [
    [["12.7", "3,4"], "43,18"],
    [["3,05", "0,4"], "1,22"],
    [["2,5", "4"], "10"],
    [["0,25", "0,8"], "0,2"],
    [["0,02", "0,03"], "0,0006"],
    [["2,00", "4,0"], "8"]
  ];
  for (const [values, expected] of cases) {
    assert.equal(makeMultiplication(values).resultDisplay, expected, values.join(" × "));
  }

  const multiplication = makeMultiplication(["3,05", "0,4"]);
  assert.deepEqual(multiplication.decimalPlacesByFactor, [2, 1]);
  assert.equal(multiplication.totalDecimalPlaces, 3);
  assert.equal(multiplication.rawProduct, "1220");
  assert.equal(multiplication.placedProductDisplay, "1,220");
  assert.equal(multiplication.resultDisplay, "1,22");
});

test("la saisie conserve les zéros utiles et normalise l’affichage avec une virgule", () => {
  assert.deepEqual(parseFactorInput("00012.700"), {
    source: "00012.700",
    integer: "12",
    fraction: "700",
    hasSeparator: true,
    decimalPlaces: 3,
    display: "12,700",
    integerDigits: "12700"
  });
  assert.equal(parseFactorInput("000,00").display, "0,00");
});

test("les saisies invalides et les limites pédagogiques sont explicites", () => {
  for (const value of ["", "-1", "1e3", "1,2.3", "1 000", ".5", "12,"]) {
    assert.throws(() => makeMultiplication([value, "1"]), MultiplicationInputError);
  }
  assert.throws(
    () => makeMultiplication(["1".repeat(MAX_INTEGER_DIGITS + 1), "1"]),
    ({ code, inputIndex }) => code === "integer-too-long" && inputIndex === 0
  );
  assert.throws(
    () => makeMultiplication(["1", `0,${"1".repeat(MAX_DECIMAL_DIGITS + 1)}`]),
    ({ code, inputIndex }) => code === "fraction-too-long" && inputIndex === 1
  );
  assert.throws(
    () => makeMultiplication(["12345678,90", "1"]),
    ({ code, inputIndex }) => code === "factor-too-long" && inputIndex === 0
  );
  assert.throws(
    () => makeMultiplication(["1", "9".repeat(MAX_MULTIPLIER_DIGITS + 1)]),
    ({ code, inputIndex }) => code === "multiplier-too-long" && inputIndex === 1
  );
  assert.throws(
    () => makeMultiplication(["0".repeat(MAX_INPUT_CHARACTERS + 1), "1"]),
    ({ code }) => code === "input-too-long"
  );
});

test("le déroulé sépare question, calcul, écriture, retenue, décalage et addition", () => {
  const multiplication = makeMultiplication(["327", "46"]);
  const steps = makeSteps(multiplication);
  assert.equal(steps[0].kind, "pose-first");
  assert.equal(steps[1].kind, "pose-second");
  assert.deepEqual(steps.slice(5, 8).map(({ kind }) => kind), [
    "multiply-ask",
    "multiply-calculate",
    "partial-write"
  ]);
  assert.equal(steps[5].sentence, "7 × 6 = ?");
  assert.equal(steps[6].sentence, "7 × 6 = 42.");
  assert.equal(steps[7].sentence, "J’écris 2 et je retiens 4.");
  assert.equal(steps.find(({ kind }) => kind === "shift")?.detail, "Je réserve 1 rang à droite en écrivant 0.");
  assert.ok(steps.some(({ kind }) => kind === "addition-ask"));
  assert.ok(steps.some(({ kind }) => kind === "addition-calculate"));
  assert.ok(steps.some(({ kind }) => kind === "addition-write"));
  assert.equal(steps.at(-1).detail, "facteur × facteur = produit");
});

test("les futurs chiffres restent cachés et les retenues restent rattachées au produit partiel", () => {
  const multiplication = makeMultiplication(["327", "46"]);
  const steps = makeSteps(multiplication);
  const indexOf = (kind, partialIndex = 0, opIndex = undefined) => steps.findIndex((step) => (
    step.kind === kind
    && step.partialIndex === partialIndex
    && (opIndex === undefined || step.opIndex === opIndex)
  ));
  const firstQuestion = getMultiplicationDisplayState(multiplication, steps, indexOf("multiply-ask", 0, 0));
  const firstWrite = getMultiplicationDisplayState(multiplication, steps, indexOf("partial-write", 0, 0));
  const secondQuestion = getMultiplicationDisplayState(multiplication, steps, indexOf("multiply-ask", 0, 1));
  const secondWrite = getMultiplicationDisplayState(multiplication, steps, indexOf("partial-write", 0, 1));
  const shift = getMultiplicationDisplayState(multiplication, steps, indexOf("shift", 1));

  assert.deepEqual(firstQuestion.partialVisible[0], [false, false, false, false, false]);
  assert.deepEqual(firstWrite.partialVisible[0], [false, false, false, false, true]);
  assert.equal(firstWrite.multiplicationCarries.find(({ partialIndex, opIndex }) => partialIndex === 0 && opIndex === 0)?.status, "fresh");
  assert.equal(secondQuestion.multiplicationCarries.find(({ partialIndex, opIndex }) => partialIndex === 0 && opIndex === 0)?.status, "active");
  assert.equal(secondWrite.multiplicationCarries.find(({ partialIndex, opIndex }) => partialIndex === 0 && opIndex === 0)?.status, "used");
  assert.equal(secondWrite.multiplicationCarries.find(({ partialIndex, opIndex }) => partialIndex === 0 && opIndex === 1)?.status, "fresh");
  assert.deepEqual(shift.partialVisible[1], [false, false, false, false, true]);
  assert.deepEqual(shift.resultVisible, [false, false, false, false, false]);
});

test("l’addition des produits partiels ne révèle le résultat qu’une colonne à la fois", () => {
  const multiplication = makeMultiplication(["327", "46"]);
  const steps = makeSteps(multiplication);
  const setupIndex = steps.findIndex(({ kind }) => kind === "addition-setup");
  const firstWriteIndex = steps.findIndex(({ kind, additionIndex }) => kind === "addition-write" && additionIndex === 0);
  const secondWriteIndex = steps.findIndex(({ kind, additionIndex }) => kind === "addition-write" && additionIndex === 1);
  const setup = getMultiplicationDisplayState(multiplication, steps, setupIndex);
  const firstWrite = getMultiplicationDisplayState(multiplication, steps, firstWriteIndex);
  const secondWrite = getMultiplicationDisplayState(multiplication, steps, secondWriteIndex);

  assert.equal(setup.showSecondRule, true);
  assert.deepEqual(setup.resultVisible, [false, false, false, false, false]);
  assert.deepEqual(firstWrite.resultVisible, [false, false, false, false, true]);
  assert.deepEqual(secondWrite.resultVisible, [false, false, false, true, true]);
  assert.equal(secondWrite.additionCarries[0].status, "fresh");
});

test("la méthode décimale compte d’abord les chiffres puis replace la virgule à la fin", () => {
  const multiplication = makeMultiplication(["3,05", "0,4"]);
  const steps = makeSteps(multiplication);
  assert.deepEqual(steps.slice(0, 5).map(({ kind }) => kind), [
    "decimal-observe",
    "decimal-count-first",
    "decimal-count-second",
    "decimal-count-total",
    "integerize"
  ]);
  const initial = getMultiplicationDisplayState(multiplication, steps, 0);
  const total = getMultiplicationDisplayState(multiplication, steps, 3);
  const integerized = getMultiplicationDisplayState(multiplication, steps, 4);
  const placedIndex = steps.findIndex(({ kind }) => kind === "decimal-place");
  const normalizedIndex = steps.findIndex(({ kind }) => kind === "decimal-normalize");
  assert.equal(initial.showGrid, false);
  assert.deepEqual(initial.decimalCountsVisible, [false, false, false]);
  assert.deepEqual(total.decimalCountsVisible, [true, true, true]);
  assert.equal(integerized.showGrid, true);
  assert.equal(integerized.showFirstFactor, true);
  assert.equal(getMultiplicationDisplayState(multiplication, steps, placedIndex).resultText, "1,220");
  assert.equal(getMultiplicationDisplayState(multiplication, steps, normalizedIndex).resultText, "1,22");
});

test("les repères et les dimensions suivent le calcul", () => {
  assert.equal(placeValueName(0, 2), "unités");
  assert.equal(placeValueName(4, 2), "dizaines de milliers");
  assert.equal(placeValueMarker(0), "u");
  assert.equal(placeValueMarker(12), "10^12");
  const shortMetrics = makeDisplayMetrics(makeMultiplication(["327", "46"]));
  const longMetrics = makeDisplayMetrics(makeMultiplication(["12345678", "99999"]), {
    columnBudget: 300,
    rowBudget: 320
  });
  const projectionMetrics = makeDisplayMetrics(makeMultiplication(["327", "46"]), {
    columnBudget: 1000,
    rowBudget: 600,
    maxColumnWidth: 100,
    maxRowHeight: 86,
    maxDigitSize: 68
  });
  assert.equal(shortMetrics.visibleRows, 7);
  assert.equal(longMetrics.visibleRows, 10);
  assert.ok(longMetrics.columnWidth <= shortMetrics.columnWidth);
  assert.ok(projectionMetrics.digitSize > shortMetrics.digitSize);
});

test("le signe plus remplace le libellé de la dernière ligne au début de l’addition", () => {
  const multiplication = makeMultiplication(["327", "46"]);
  assert.deepEqual(
    partialRowMarker(multiplication.partials[1], 1, multiplication.partials.length, false),
    { className: "partial-label", text: "× 4" }
  );
  assert.deepEqual(
    partialRowMarker(multiplication.partials[1], 1, multiplication.partials.length, true),
    { className: "addition-sign", text: "+" }
  );
});

test("l’interface est professorale, responsive, projetable et sans version élève", () => {
  assert.match(interfaceHtml, /<h1 id="page-title">Multiplication posée<\/h1>/);
  assert.match(interfaceHtml, /Outil de classe/);
  assert.match(interfaceHtml, /href="\.\/">← Multiplication posée<\/a>/);
  assert.match(interfaceHtml, /id="first-factor"[^>]*inputmode="decimal"/);
  assert.match(interfaceHtml, /id="second-factor"[^>]*inputmode="decimal"/);
  assert.doesNotMatch(interfaceHtml, /gabarit-multiplication|id="pdf-link"/);
  assert.match(interfaceHtml, /id="rank-guides" type="checkbox"/);
  assert.match(interfaceHtml, /class="instruction" aria-live="polite" aria-atomic="true"/);
  assert.match(interfaceHtml, /id="projection-recap"[^>]*hidden/);
  assert.match(interfaceHtml, /fullscreen-collapse[^>]*hidden/);
  assert.match(interfaceHtml, /Gwenaël Bourgault/);
  assert.match(interfaceHtml, /Sans cookie ni traceur/);
  assert.doesNotMatch(interfaceHtml, /data-mode="(?:integer|decimal)"/);
  assert.doesNotMatch(interfaceHtml, /Vérifier l’étape|score|indice|version élève/i);

  assert.match(interfaceCss, /\.carry-chip\.is-used[^}]*text-decoration:\s*line-through/);
  assert.match(interfaceCss, /@media \(min-width: 1280px\)/);
  assert.match(interfaceCss, /@media \(max-width: 780px\)/);
  assert.match(interfaceCss, /@media \(max-width: 520px\)/);
  assert.match(interfaceCss, /@media \(max-height: 560px\) and \(orientation: landscape\)/);
  assert.match(interfaceCss, /padding-bottom:\s*max\(18px, env\(safe-area-inset-bottom\)\)/);
  assert.match(interfaceCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(interfaceJs, /document\.exitFullscreen\(\)/);
  assert.match(interfaceJs, /fullscreenchange/);
  assert.match(interfaceJs, /keepActiveColumnVisible/);
  assert.match(interfaceJs, /multiplication-engine\.mjs\?v=1/);
  assert.match(interfaceJs, /multiplication-steps\.mjs\?v=1/);
  assert.match(interfaceJs, /multiplication-view\.mjs\?v=2/);
  assert.match(interfaceHtml, /multiplication-posee\.js\?v=2/);
  assert.doesNotMatch(interfaceJs, /gabaritForValues|syncGabaritLink/);
});

test("l’étiquette accessible décrit seulement l’état courant", () => {
  const multiplication = makeMultiplication(["3,05", "0,4"]);
  const steps = makeSteps(multiplication);
  assert.match(buildMultiplicationAriaLabel(multiplication, steps[0]), /virgule est encore à préparer/);
  assert.equal(
    buildMultiplicationAriaLabel(multiplication, steps.at(-1)),
    "3,05 fois 0,4 égale 1,22. Multiplication entièrement complétée."
  );
});

test("la page d’entrée expose seulement le pas-à-pas à comprendre et projeter", () => {
  assert.match(entryHtml, /<h1 id="page-title" tabindex="-1">Multiplication posée<\/h1>/);
  assert.match(entryHtml, /Comprendre et projeter/);
  assert.match(entryHtml, /href="multiplication-posee\.html"/);
  assert.doesNotMatch(entryHtml, /S’entraîner|interactive|collection|Imprimer et plastifier|gabarit-multiplication/i);
});

test("la miniature de l’application est accessible, fidèle et au format 640 × 400", () => {
  assert.match(thumbnailSvg, /viewBox="0 0 640 400"/);
  assert.match(thumbnailSvg, /role="img" aria-labelledby="title desc"/);
  assert.match(thumbnailSvg, /<title id="title">Multiplication posée pas à pas<\/title>/);
  assert.match(thumbnailSvg, /<desc id="desc">[^<]*produits partiels/i);
});

test("l’application seule est rangée sous l’entrée Multiplication posée", () => {
  const data = catalogue();
  const path = "outils/multiplication-posee/multiplication-posee.html";
  const resource = data.resources.find((candidate) => candidate.path === path);
  const classification = data.resourceClassifications[path];
  assert.equal(resource?.status, "published");
  assert.deepEqual(Array.from(resource?.notions || []), ["calculs-poses"]);
  assert.deepEqual(Array.from(resource?.uses || []), ["manipuler", "projeter"]);
  assert.deepEqual(Array.from(classification?.collections || []), ["multiplication-posee"]);
  assert.equal(classification?.primaryNotion, "calculs-poses");
  assert.equal(classification?.primaryGroup, "manipuler");
  assert.deepEqual(
    Array.from(
      data.resources
        .filter(({ path: candidate }) => candidate.startsWith("outils/multiplication-posee/"))
        .map(({ path: candidate }) => candidate)
    ),
    [path]
  );
});
