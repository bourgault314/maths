import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import {
  AdditionInputError,
  MAX_DECIMAL_DIGITS,
  MAX_INPUT_CHARACTERS,
  MAX_INTEGER_DIGITS,
  makeAddition,
  makeDisplayMetrics,
  parseDecimalInput,
  placeValueName
} from "../outils/addition-posee/addition-engine.mjs";
import {
  getAdditionDisplayState,
  makeSteps
} from "../outils/addition-posee/addition-steps.mjs";
import { buildAdditionAriaLabel } from "../outils/addition-posee/addition-view.mjs";

const interfaceHtml = readFileSync(new URL("../outils/addition-posee/addition-posee.html", import.meta.url), "utf8");
const interfaceCss = readFileSync(new URL("../outils/addition-posee/addition-posee.css", import.meta.url), "utf8");
const interfaceJs = readFileSync(new URL("../outils/addition-posee/addition-posee.js", import.meta.url), "utf8");
const thumbnailSvg = readFileSync(new URL("../assets/img/thumbnails/numeration/addition-posee.svg", import.meta.url), "utf8");
const catalogueSource = readFileSync(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8");

function catalogue() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(catalogueSource, context);
  return context.window.MATHSGO_CATALOGUE;
}

test("584 + 279 produit les colonnes et les retenues attendues", () => {
  const addition = makeAddition(["584", "279"]);
  assert.equal(addition.resultDisplay, "863");
  assert.deepEqual(addition.displayTerms, ["584", "279"]);
  assert.deepEqual(
    addition.operations.map(({ exponent, addendDigits, carryIn, total, resultDigit, carryOut }) => ({
      exponent,
      addendDigits,
      carryIn,
      total,
      resultDigit,
      carryOut
    })),
    [
      { exponent: 0, addendDigits: [4, 9], carryIn: 0, total: 13, resultDigit: 3, carryOut: 1 },
      { exponent: 1, addendDigits: [8, 7], carryIn: 1, total: 16, resultDigit: 6, carryOut: 1 },
      { exponent: 2, addendDigits: [5, 2], carryIn: 1, total: 8, resultDigit: 8, carryOut: 0 }
    ]
  );
});

test("chaque colonne sépare question, calcul et écriture ou échange", () => {
  const addition = makeAddition(["584", "279"]);
  const steps = makeSteps(addition);
  assert.deepEqual(
    steps.map(({ kind }) => kind),
    ["pose", "search", "calculate", "exchange", "search", "calculate", "exchange", "search", "calculate", "write", "verify"]
  );
  assert.equal(steps[1].sentence, "4 unités + 9 unités = ?");
  assert.equal(steps[2].sentence, "4 + 9 = 13.");
  assert.equal(steps[3].sentence, "13 unités = 1 dizaine et 3 unités.");
  assert.equal(steps[3].detail, "J’écris 3 au rang des unités et je retiens 1 dizaine.");
  assert.equal(steps[4].sentence, "8 dizaines + 7 dizaines + 1 dizaine retenue = ?");
  assert.equal(steps.at(-1).sentence, "584 + 279 = 863.");
});

test("les futurs chiffres restent cachés et les retenues deviennent consommées", () => {
  const addition = makeAddition(["584", "279"]);
  const steps = makeSteps(addition);
  const pose = getAdditionDisplayState(addition, steps, 0);
  const firstQuestion = getAdditionDisplayState(addition, steps, 1);
  const firstExchange = getAdditionDisplayState(addition, steps, 3);
  const tensQuestion = getAdditionDisplayState(addition, steps, 4);
  const tensExchange = getAdditionDisplayState(addition, steps, 6);

  assert.deepEqual(pose.resultVisible, [false, false, false]);
  assert.deepEqual(firstQuestion.resultVisible, [false, false, false]);
  assert.deepEqual(firstExchange.resultVisible, [false, false, true]);
  assert.equal(firstExchange.carries[0].status, "fresh");
  assert.equal(tensQuestion.carries[0].status, "active");
  assert.equal(tensExchange.carries[0].status, "used");
  assert.equal(tensExchange.carries[1].status, "fresh");
});

test("999 + 1 réserve une étape distincte à la retenue finale", () => {
  const addition = makeAddition(["999", "1"]);
  const steps = makeSteps(addition);
  assert.equal(addition.resultDisplay, "1000");
  assert.equal(addition.hasFinalCarry, true);
  assert.equal(addition.layoutIntegerPlaces, 4);
  assert.equal(steps.at(-2).kind, "final-carry");
  assert.equal(steps.at(-2).sentence, "La retenue devient le chiffre des milliers.");

  const before = getAdditionDisplayState(addition, steps, steps.length - 3);
  const finalCarry = getAdditionDisplayState(addition, steps, steps.length - 2);
  const verified = getAdditionDisplayState(addition, steps, steps.length - 1);
  assert.equal(before.resultVisible[0], false);
  assert.equal(finalCarry.resultVisible[0], true);
  assert.equal(finalCarry.carries.at(-1).status, "active");
  assert.equal(verified.carries.at(-1).status, "used");
});

test("les entiers de longueurs différentes et les zéros sont exacts", () => {
  assert.equal(makeAddition(["1005", "97"]).resultDisplay, "1102");
  assert.equal(makeAddition(["7", "1234"]).resultDisplay, "1241");
  assert.equal(makeAddition(["789", "678"]).resultDisplay, "1467");
  assert.equal(makeAddition(["0", "0"]).resultDisplay, "0");
});

test("les décimaux sont alignés et calculés sans nombre flottant", () => {
  const mixed = makeAddition(["12,7", "3.45"]);
  assert.deepEqual(mixed.displayTerms, ["12,70", "3,45"]);
  assert.equal(mixed.resultDisplay, "16,15");
  assert.deepEqual(makeAddition(["0,09", "0,8"]).displayTerms, ["0,09", "0,80"]);
  assert.equal(makeAddition(["0,09", "0,8"]).resultDisplay, "0,89");
  assert.equal(makeAddition(["0,1", "0,2"]).resultDisplay, "0,3");
});

test("une retenue peut franchir la virgule avec un échange explicite", () => {
  const addition = makeAddition(["0,8", "0,7"]);
  const steps = makeSteps(addition);
  const exchange = steps.find(({ kind, opIndex }) => (
    kind === "exchange" && addition.operations[opIndex].exponent === -1
  ));
  assert.equal(addition.resultDisplay, "1,5");
  assert.equal(exchange.sentence, "15 dixièmes = 1 unité et 5 dixièmes.");
  assert.equal(exchange.detail, "J’écris 5 au rang des dixièmes et je retiens 1 unité.");
  assert.equal(exchange.memo, "10 dixièmes = 1 unité");
});

test("les zéros saisis sont acceptés et les zéros décimaux utiles sont conservés", () => {
  const addition = makeAddition(["00012,700", "03,45"]);
  assert.deepEqual(addition.displayTerms, ["12,700", "3,450"]);
  assert.equal(addition.resultDisplay, "16,150");
  assert.deepEqual(parseDecimalInput("000,00"), {
    source: "000,00",
    integer: "0",
    fraction: "00",
    hasSeparator: true
  });
});

test("les valeurs maximales restent exactes et dimensionnables", () => {
  const maximum = `${"9".repeat(MAX_INTEGER_DIGITS)},${"9".repeat(MAX_DECIMAL_DIGITS)}`;
  const addition = makeAddition([maximum, maximum]);
  assert.equal(addition.resultDisplay, "199999999,999998");
  assert.equal(addition.layoutColumnCount, 15);

  const shortMetrics = makeDisplayMetrics(makeAddition(["584", "279"]));
  const longMetrics = makeDisplayMetrics(addition, { columnBudget: 280, rowBudget: 260 });
  const projectionMetrics = makeDisplayMetrics(makeAddition(["584", "279"]), {
    columnBudget: 960,
    rowBudget: 520,
    maxColumnWidth: 122,
    maxRowHeight: 132,
    maxDigitSize: 92
  });
  assert.equal(longMetrics.columnWidth, 30);
  assert.ok(longMetrics.digitSize >= 22);
  assert.ok(projectionMetrics.digitSize > shortMetrics.digitSize);
});

test("les saisies invalides sont refusées avec une origine identifiable", () => {
  for (const value of ["", "-1", "1e3", "1,2.3", "1 000", ".5", "12,"]) {
    assert.throws(() => makeAddition([value, "1"]), AdditionInputError);
  }
  assert.throws(
    () => makeAddition([`${"1".repeat(MAX_INTEGER_DIGITS + 1)}`, "1"]),
    ({ code, inputIndex }) => code === "integer-too-long" && inputIndex === 0
  );
  assert.throws(
    () => makeAddition(["1", `0,${"1".repeat(MAX_DECIMAL_DIGITS + 1)}`]),
    ({ code, inputIndex }) => code === "fraction-too-long" && inputIndex === 1
  );
  assert.throws(
    () => makeAddition(["0".repeat(MAX_INPUT_CHARACTERS + 1), "1"]),
    ({ code }) => code === "input-too-long"
  );
});

test("le vocabulaire de rang couvre les bornes autorisées", () => {
  assert.equal(placeValueName(8, 2), "centaines de millions");
  assert.equal(placeValueName(-6, 1), "millionième");
});

test("l’interface est professorale, projetable et conforme à l’identité maths&go", () => {
  assert.match(interfaceHtml, /<h1 id="page-title">Addition posée<\/h1>/);
  assert.match(interfaceHtml, /Outil de classe/);
  assert.match(interfaceHtml, /href="\.\/">← Addition posée/);
  assert.match(interfaceHtml, /id="first-term"[^>]*inputmode="decimal"/);
  assert.match(interfaceHtml, /id="second-term"[^>]*inputmode="decimal"/);
  assert.doesNotMatch(interfaceHtml, /data-mode="(?:integer|decimal)"/);
  assert.match(interfaceHtml, /href="gabarit-addition-entiere\.pdf"[^>]*id="pdf-link"/);
  assert.match(interfaceHtml, /id="rank-guides" type="checkbox"/);
  assert.match(interfaceHtml, /class="instruction" aria-live="polite" aria-atomic="true"/);
  assert.match(interfaceHtml, /id="projection-recap"[^>]*hidden/);
  assert.match(interfaceHtml, /fullscreen-collapse[^>]*hidden/);
  assert.match(interfaceHtml, /Gwenaël Bourgault/);
  assert.match(interfaceHtml, /Me contacter/);
  assert.match(interfaceHtml, /Toutes les ressources/);
  assert.match(interfaceHtml, /Mentions légales/);
  assert.match(interfaceHtml, /Confidentialité/);
  assert.match(interfaceHtml, /Licence/);
  assert.match(interfaceHtml, /Sans cookie ni traceur/);
  assert.match(interfaceHtml, /Gabarit entier/);
  assert.doesNotMatch(interfaceHtml, /Vérifier l’étape|score|indice/i);

  assert.match(interfaceCss, /\.posed-addition\.has-decimals/);
  assert.match(interfaceCss, /\.carry-cell\.is-used[^}]*text-decoration:\s*line-through/);
  assert.match(interfaceCss, /@media \(min-width: 1280px\)[\s\S]*\.instruction[^}]*grid-column:\s*1/);
  assert.match(interfaceCss, /\.instruction h2 \{[^}]*font-size:\s*clamp\(1\.42rem, 1\.8vw, 2\.08rem\)/);
  assert.match(interfaceCss, /body\.is-projection \.instruction h2 \{[^}]*font-size:\s*clamp\(1\.55rem, 1\.9vw, 2\.18rem\)/);
  assert.match(interfaceCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(interfaceJs, /document\.exitFullscreen\(\)/);
  assert.match(interfaceJs, /fullscreenchange/);
  assert.match(interfaceJs, /window\.addEventListener\("resize"/);
  assert.match(interfaceJs, /\["INPUT", "SELECT", "TEXTAREA"\]/);
  assert.match(interfaceJs, /addition-engine\.mjs\?v=1/);
  assert.match(interfaceJs, /addition-steps\.mjs\?v=1/);
  assert.match(interfaceJs, /addition-view\.mjs\?v=1/);
  assert.match(interfaceJs, /function syncGabaritLink\(\)/);
  assert.match(interfaceJs, /gabarit-addition-decimale\.pdf/);
  assert.match(interfaceJs, /some\(\(value\) => \/\[\.,\]\/.test\(value\)\)/);
});

test("l’étiquette accessible suit l’état réellement révélé", () => {
  const addition = makeAddition(["12,7", "3,45"]);
  const steps = makeSteps(addition);
  assert.match(buildAdditionAriaLabel(addition, steps[0]), /résultat et les retenues sont encore vides/);
  assert.equal(
    buildAdditionAriaLabel(addition, steps.at(-1)),
    "12,70 plus 3,45 égale 16,15. Addition entièrement complétée."
  );
});

test("la miniature est accessible, au format 640 × 400 et non rognée", () => {
  assert.match(thumbnailSvg, /viewBox="0 0 640 400"/);
  assert.match(thumbnailSvg, /role="img" aria-labelledby="title desc"/);
  assert.match(thumbnailSvg, /<title id="title">Addition posée pas à pas<\/title>/);
  assert.match(thumbnailSvg, /<desc id="desc">[^<]*retenue/i);
});

test("l’addition professeur est rangée dans l’entrée Addition posée", () => {
  const data = catalogue();
  const path = "outils/addition-posee/addition-posee.html";
  const resource = data.resources.find((candidate) => candidate.path === path);
  const classification = data.resourceClassifications[path];
  assert.ok(resource);
  assert.equal(resource.title, "Addition posée pas à pas");
  assert.deepEqual(Array.from(resource.uses), ["manipuler", "projeter"]);
  assert.deepEqual(Array.from(resource.notions), ["calculs-poses"]);
  assert.deepEqual(Array.from(classification.collections), ["addition-posee"]);
  assert.equal(classification.primaryGroup, "manipuler");
  assert.equal(classification.thumbnail, "assets/img/thumbnails/numeration/addition-posee.svg?v=2");
  assert.equal(
    resource.description,
    "Une addition d’entiers ou de décimaux expliquée colonne par colonne, avec les retenues rendues visibles."
  );
});
