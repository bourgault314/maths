import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import {
  MAX_DECIMAL_DIGITS,
  MAX_INPUT_CHARACTERS,
  MAX_INTEGER_DIGITS,
  SubtractionInputError,
  makeDisplayMetrics,
  makeSubtraction,
  parseDecimalInput,
  placeValueName
} from "../outils/soustraction-posee/soustraction-engine.mjs";
import {
  getSubtractionDisplayState,
  makeSteps
} from "../outils/soustraction-posee/soustraction-steps.mjs";
import { buildSubtractionAriaLabel } from "../outils/soustraction-posee/soustraction-view.mjs";

const root = new URL("../", import.meta.url);
const readText = (path) => readFileSync(new URL(path, root), "utf8");
const interfaceHtml = readText("outils/soustraction-posee/soustraction-posee.html");
const interfaceCss = readText("outils/soustraction-posee/soustraction-posee.css");
const interfaceJs = readText("outils/soustraction-posee/soustraction-posee.js");
const engineSource = readText("outils/soustraction-posee/soustraction-engine.mjs");
const thumbnailSvg = readText("assets/img/thumbnails/numeration/soustraction-posee.svg");
const catalogueSource = readText("assets/js/catalogue-refonte-data.js");

function catalogue() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(catalogueSource, context);
  return context.window.MATHSGO_CATALOGUE;
}

test("734 − 212 se calcule sans échange", () => {
  const subtraction = makeSubtraction("734", "212");
  assert.equal(subtraction.resultDisplay, "522");
  assert.deepEqual(subtraction.displayTerms, ["734", "212"]);
  assert.ok(subtraction.operations.every(({ needsExchange }) => !needsExchange));
  assert.deepEqual(
    subtraction.operations.map(({ exponent, minuendDigit, subtrahendDigit, resultDigit }) => ({
      exponent,
      minuendDigit,
      subtrahendDigit,
      resultDigit
    })),
    [
      { exponent: 0, minuendDigit: 4, subtrahendDigit: 2, resultDigit: 2 },
      { exponent: 1, minuendDigit: 3, subtrahendDigit: 1, resultDigit: 2 },
      { exponent: 2, minuendDigit: 7, subtrahendDigit: 2, resultDigit: 5 }
    ]
  );
});

test("584 − 279 diminue réellement le rang donneur", () => {
  const subtraction = makeSubtraction("584", "279");
  const units = subtraction.operations[0];
  assert.equal(subtraction.resultDisplay, "305");
  assert.equal(units.needsExchange, true);
  assert.equal(units.exchangeHops.length, 1);
  assert.deepEqual(
    units.exchangeHops[0],
    {
      hopIndex: 0,
      sourceIndex: 1,
      targetIndex: 2,
      sourceExponent: 1,
      targetExponent: 0,
      sourceBefore: 8,
      sourceAfter: 7,
      targetBefore: 4,
      targetAfter: 14,
      beforeDigits: [5, 8, 4],
      afterDigits: [5, 7, 14]
    }
  );

  const steps = makeSteps(subtraction);
  const cannot = steps.find(({ kind }) => kind === "cannot");
  const exchange = steps.find(({ kind }) => kind === "exchange");
  assert.equal(cannot.sentence, "Dans la colonne des unités, je ne peux pas enlever 9 unités à 4 unités.");
  assert.equal(exchange.sentence, "J’échange 1 dizaine contre 10 unités.");
  assert.equal(exchange.detail, "Il reste 7 dizaines et j’obtiens 14 unités.");
  assert.equal(exchange.memo, "1 dizaine = 10 unités");
});

test("1000 − 1 explique les échanges successifs à travers les zéros", () => {
  const subtraction = makeSubtraction("1000", "1");
  const units = subtraction.operations[0];
  assert.equal(subtraction.resultDisplay, "999");
  assert.deepEqual(subtraction.resultCells, [null, "9", "9", "9"]);
  assert.deepEqual(
    units.exchangeHops.map(({ afterDigits }) => afterDigits),
    [
      [0, 10, 0, 0],
      [0, 9, 10, 0],
      [0, 9, 9, 10]
    ]
  );

  const steps = makeSteps(subtraction);
  const exchangeSteps = steps.filter(({ kind }) => kind === "exchange");
  assert.deepEqual(exchangeSteps.map(({ sentence }) => ({ sentence })), [
    { sentence: "J’échange 1 millier contre 10 centaines." },
    { sentence: "Parmi ces 10 centaines, j’échange 1 centaine contre 10 dizaines." },
    { sentence: "Parmi ces 10 dizaines, j’échange 1 dizaine contre 10 unités." }
  ]);
  assert.deepEqual(exchangeSteps.at(-1).minuendDigits, [0, 9, 9, 10]);
});

test("6002 − 378 traverse deux zéros sans changer de méthode", () => {
  const subtraction = makeSubtraction("6002", "378");
  assert.equal(subtraction.resultDisplay, "5624");
  assert.equal(subtraction.operations[0].exchangeHops.length, 3);
  assert.deepEqual(subtraction.operations[0].finalDigits, [5, 9, 9, 12]);
  assert.ok(subtraction.operations.slice(1).every(({ needsExchange }) => !needsExchange));
});

test("12,3 − 4,75 ajoute visuellement le zéro manquant", () => {
  const subtraction = makeSubtraction("12,3", "4,75");
  assert.deepEqual(subtraction.displayTerms, ["12,30", "4,75"]);
  assert.deepEqual(subtraction.termCells[0], ["1", "2", "3", "0"]);
  assert.equal(subtraction.resultDisplay, "7,55");
  assert.equal(subtraction.decimalPlaces, 2);
  assert.equal(makeSteps(subtraction)[0].sentence, "J’aligne les unités et les chiffres de même rang. Les virgules sont l’une sous l’autre.");
});

test("8 − 3,27 et 5,00 − 2,68 restent exacts sans flottants", () => {
  const mixed = makeSubtraction("8", "3,27");
  assert.deepEqual(mixed.displayTerms, ["8,00", "3,27"]);
  assert.equal(mixed.resultDisplay, "4,73");
  assert.equal(mixed.operations[0].exchangeHops.length, 2);

  const writtenZeros = makeSubtraction("5.00", "2,68");
  assert.deepEqual(writtenZeros.displayTerms, ["5,00", "2,68"]);
  assert.equal(writtenZeros.resultDisplay, "2,32");
  assert.doesNotMatch(engineSource, /parseFloat|toFixed|Math\.round/);
});

test("10,03 − 4,75 gère un échange de la partie entière vers les décimales", () => {
  const subtraction = makeSubtraction("10,03", "4,75");
  assert.equal(subtraction.resultDisplay, "5,28");
  assert.deepEqual(
    subtraction.operations[0].exchangeHops.map(({ sourceExponent, targetExponent }) => ({
      sourceExponent,
      targetExponent
    })),
    [
      { sourceExponent: 1, targetExponent: 0 },
      { sourceExponent: 0, targetExponent: -1 },
      { sourceExponent: -1, targetExponent: -2 }
    ]
  );
});

test("deux termes égaux et zéro donnent une différence nulle", () => {
  assert.equal(makeSubtraction("584", "584").resultDisplay, "0");
  assert.deepEqual(makeSubtraction("584", "584").resultCells, [null, null, "0"]);
  assert.equal(makeSubtraction("0", "0").resultDisplay, "0");
  assert.equal(makeSubtraction("5,00", "5").resultDisplay, "0,00");
});

test("un second terme supérieur est refusé sans inversion", () => {
  assert.throws(
    () => makeSubtraction("279", "584"),
    ({ code, inputIndex, message }) => (
      code === "negative-result"
      && inputIndex === 1
      && message === "Pour cette version, le premier terme doit être supérieur ou égal au second terme."
    )
  );
});

test("la virgule française, le point et les zéros initiaux sont normalisés", () => {
  assert.deepEqual(parseDecimalInput("00012,300"), {
    source: "00012,300",
    integer: "12",
    fraction: "300",
    hasSeparator: true
  });
  assert.deepEqual(makeSubtraction("12.30", "4.75").displayTerms, ["12,30", "4,75"]);
});

test("les saisies invalides et trop longues sont refusées avec leur origine", () => {
  for (const value of ["", "-1", "1e3", "1,2.3", "1 000", ".5", "12,"]) {
    assert.throws(() => makeSubtraction(value, "0"), SubtractionInputError);
  }
  assert.throws(
    () => makeSubtraction(`${"1".repeat(MAX_INTEGER_DIGITS + 1)}`, "0"),
    ({ code, inputIndex }) => code === "integer-too-long" && inputIndex === 0
  );
  assert.throws(
    () => makeSubtraction("1", `0,${"1".repeat(MAX_DECIMAL_DIGITS + 1)}`),
    ({ code, inputIndex }) => code === "fraction-too-long" && inputIndex === 1
  );
  assert.throws(
    () => makeSubtraction("0".repeat(MAX_INPUT_CHARACTERS + 1), "0"),
    ({ code }) => code === "input-too-long"
  );
});

test("Précédente retrouve exactement un état antérieur et Tout afficher mène à la vérification", () => {
  const subtraction = makeSubtraction("1000", "1");
  const steps = makeSteps(subtraction);
  const middleIndex = steps.findIndex(({ kind, exchangeHopIndex }) => (
    kind === "exchange" && exchangeHopIndex === 1
  ));
  const firstRead = getSubtractionDisplayState(subtraction, steps, middleIndex);
  getSubtractionDisplayState(subtraction, steps, middleIndex + 2);
  const previousRead = getSubtractionDisplayState(subtraction, steps, middleIndex);
  assert.deepEqual(previousRead, firstRead);

  const finalState = getSubtractionDisplayState(subtraction, steps, steps.length - 1);
  assert.equal(finalState.step.kind, "verify");
  assert.ok(finalState.resultVisible.every(Boolean));
  assert.equal(finalState.showVocabulary, true);
  assert.match(interfaceJs, /stepIndex = Math\.max\(0, stepIndex - 1\)/);
  assert.match(interfaceJs, /stepIndex = steps\.length - 1/);
});

test("les rangs autorisés et la grille la plus large restent lisibles", () => {
  assert.equal(placeValueName(0, 0), "unité");
  assert.equal(placeValueName(8, 2), "centaines de millions");
  assert.equal(placeValueName(-6, 1), "millionième");

  const maximum = `${"9".repeat(MAX_INTEGER_DIGITS)},${"9".repeat(MAX_DECIMAL_DIGITS)}`;
  const subtraction = makeSubtraction(maximum, "0");
  assert.equal(subtraction.resultDisplay, maximum);
  assert.equal(subtraction.layoutColumnCount, 14);
  const narrow = makeDisplayMetrics(subtraction, { columnBudget: 280, rowBudget: 260 });
  const projection = makeDisplayMetrics(makeSubtraction("584", "279"), {
    columnBudget: 960,
    rowBudget: 520,
    maxColumnWidth: 122,
    maxRowHeight: 132,
    maxDigitSize: 92
  });
  assert.equal(narrow.columnWidth, 32);
  assert.ok(projection.digitSize > narrow.digitSize);
});

test("l’étiquette accessible suit ce qui est réellement révélé", () => {
  const subtraction = makeSubtraction("12,3", "4,75");
  const steps = makeSteps(subtraction);
  assert.match(buildSubtractionAriaLabel(subtraction, steps[0]), /différence et les échanges sont encore vides/);
  assert.equal(
    buildSubtractionAriaLabel(subtraction, steps.at(-1)),
    "12,30 moins 4,75 égale 7,55. Soustraction entièrement complétée."
  );
});

test("l’interface professorale adapte le gabarit et le plein écran", () => {
  assert.match(interfaceHtml, /<h1 id="page-title">Soustraction posée<\/h1>/);
  assert.match(interfaceHtml, /Outil de classe/);
  assert.match(interfaceHtml, /id="first-term"[^>]*inputmode="decimal"/);
  assert.match(interfaceHtml, /id="second-term"[^>]*inputmode="decimal"/);
  assert.match(interfaceHtml, /href="gabarit-soustraction-entiere\.pdf"[^>]*id="pdf-link"/);
  assert.match(interfaceHtml, /id="rank-guides" type="checkbox"/);
  assert.match(interfaceHtml, /id="projection-recap"[^>]*hidden/);
  assert.match(interfaceHtml, /fullscreen-collapse[^>]*hidden/);
  assert.match(interfaceHtml, /premier terme[\s\S]*?−[\s\S]*?second terme[\s\S]*?=[\s\S]*?différence/);
  assert.match(interfaceHtml, /exchange-role">échanges/);
  assert.doesNotMatch(interfaceHtml, /Vérifier l’étape|score|indice|data-mode="(?:integer|decimal)"/i);

  assert.match(interfaceJs, /document\.exitFullscreen\(\)/);
  assert.match(interfaceJs, /fullscreenchange/);
  assert.match(interfaceJs, /window\.addEventListener\("resize"/);
  assert.match(interfaceJs, /function syncGabaritLink\(\)/);
  assert.match(interfaceJs, /gabarit-soustraction-decimale\.pdf/);
  assert.match(interfaceJs, /some\(\(value\) => \/\[\.,\]\//);
  assert.match(interfaceCss, /\.term-one-cell\.is-exchanged[^}]*text-decoration:\s*line-through/);
  assert.match(interfaceCss, /\.exchange-cell\.is-fresh/);
  assert.match(interfaceCss, /@media \(min-width: 1280px\)[\s\S]*\.instruction[^}]*grid-column:\s*1/);
  assert.match(interfaceCss, /#show-all[^}]*justify-self:\s*center/);
  assert.match(interfaceCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("la miniature du pas-à-pas est accessible et mesure 640 × 400", () => {
  assert.match(thumbnailSvg, /viewBox="0 0 640 400"/);
  assert.match(thumbnailSvg, /role="img" aria-labelledby="title desc"/);
  assert.match(thumbnailSvg, /<title id="title">Soustraction posée pas à pas<\/title>/);
  assert.match(thumbnailSvg, /<desc id="desc">[^<]*échange/i);
  assert.doesNotMatch(thumbnailSvg, /Collection/i);
});

test("la soustraction et ses gabarits sont publiés dans Calculs posés", () => {
  const data = catalogue();
  const expected = [
    ["outils/soustraction-posee/soustraction-posee.html", "manipuler"],
    ["outils/soustraction-posee/gabarit-soustraction-entiere.pdf", "imprimer"],
    ["outils/soustraction-posee/gabarit-soustraction-decimale.pdf", "imprimer"]
  ];
  for (const [path, group] of expected) {
    const resource = data.resources.find((candidate) => candidate.path === path);
    const classification = data.resourceClassifications[path];
    assert.equal(resource?.status, "published", path);
    assert.equal(classification?.primaryNotion, "calculs-poses", path);
    assert.equal(classification?.primaryGroup, group, path);
    assert.deepEqual(Array.from(classification?.collections || []), ["soustraction-posee"], path);
  }
  assert.equal(
    data.resources.find(({ path }) => path.endsWith("soustraction-posee.html"))?.title,
    "Soustraction posée pas à pas"
  );
});
