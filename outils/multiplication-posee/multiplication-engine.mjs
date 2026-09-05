export const MAX_INTEGER_DIGITS = 8;
export const MAX_DECIMAL_DIGITS = 6;
export const MAX_FACTOR_DIGITS = 9;
export const MAX_MULTIPLIER_DIGITS = 5;
export const MAX_INPUT_CHARACTERS = MAX_INTEGER_DIGITS + MAX_DECIMAL_DIGITS + 1;

const INTEGER_PLACES = [
  ["unité", "unités"],
  ["dizaine", "dizaines"],
  ["centaine", "centaines"],
  ["millier", "milliers"],
  ["dizaine de milliers", "dizaines de milliers"],
  ["centaine de milliers", "centaines de milliers"],
  ["million", "millions"],
  ["dizaine de millions", "dizaines de millions"],
  ["centaine de millions", "centaines de millions"],
  ["milliard", "milliards"],
  ["dizaine de milliards", "dizaines de milliards"],
  ["centaine de milliards", "centaines de milliards"]
];

const INTEGER_MARKERS = ["u", "d", "c", "um", "dm", "cm", "uM", "dM", "cM", "uMd", "dMd", "cMd"];

export class MultiplicationInputError extends RangeError {
  constructor(message, code = "invalid", inputIndex = null) {
    super(message);
    this.name = "MultiplicationInputError";
    this.code = code;
    this.inputIndex = inputIndex;
  }
}

function normalizeDigits(value) {
  return value.replace(/^0+(?=\d)/, "");
}

export function parseFactorInput(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source) {
    throw new MultiplicationInputError("Saisissez un nombre.", "empty");
  }
  if (!/^\d+(?:[.,]\d+)?$/.test(source)) {
    throw new MultiplicationInputError(
      "Utilisez uniquement des chiffres, avec une virgule ou un point si nécessaire.",
      "format"
    );
  }
  if (source.length > MAX_INPUT_CHARACTERS) {
    throw new MultiplicationInputError(
      `Le nombre est limité à ${MAX_INPUT_CHARACTERS} caractères.`,
      "input-too-long"
    );
  }

  const separatorIndex = source.search(/[.,]/);
  const rawInteger = separatorIndex === -1 ? source : source.slice(0, separatorIndex);
  const fraction = separatorIndex === -1 ? "" : source.slice(separatorIndex + 1);
  const integer = normalizeDigits(rawInteger);

  if (integer.length > MAX_INTEGER_DIGITS) {
    throw new MultiplicationInputError(
      `La partie entière est limitée à ${MAX_INTEGER_DIGITS} chiffres.`,
      "integer-too-long"
    );
  }
  if (fraction.length > MAX_DECIMAL_DIGITS) {
    throw new MultiplicationInputError(
      `La partie décimale est limitée à ${MAX_DECIMAL_DIGITS} chiffres.`,
      "fraction-too-long"
    );
  }

  const integerDigits = normalizeDigits(`${integer}${fraction}`);
  if (integerDigits.length > MAX_FACTOR_DIGITS) {
    throw new MultiplicationInputError(
      `Le calcul sans virgule est limité à ${MAX_FACTOR_DIGITS} chiffres par facteur.`,
      "factor-too-long"
    );
  }

  return {
    source,
    integer,
    fraction,
    hasSeparator: separatorIndex !== -1,
    decimalPlaces: fraction.length,
    display: fraction ? `${integer},${fraction}` : integer,
    integerDigits
  };
}

export function placeValueName(exponent, quantity = 2) {
  const names = INTEGER_PLACES[exponent];
  if (!names) return `rang 10^${exponent}`;
  return names[quantity === 1 ? 0 : 1];
}

export function placeValueMarker(exponent) {
  return INTEGER_MARKERS[exponent] || `10^${exponent}`;
}

export function multiplyDigitStrings(left, right) {
  const a = normalizeDigits(String(left));
  const b = normalizeDigits(String(right));
  if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) {
    throw new TypeError("La multiplication exacte attend deux chaînes de chiffres.");
  }
  if (a === "0" || b === "0") return "0";

  const result = Array(a.length + b.length).fill(0);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      const position = i + j + 1;
      const total = (Number(a[i]) * Number(b[j])) + result[position];
      result[position] = total % 10;
      result[position - 1] += Math.floor(total / 10);
    }
  }
  for (let index = result.length - 1; index > 0; index -= 1) {
    if (result[index] < 10) continue;
    result[index - 1] += Math.floor(result[index] / 10);
    result[index] %= 10;
  }
  return normalizeDigits(result.join(""));
}

function makePartialDraft(multiplicand, multiplierDigit, shift) {
  const operations = [];
  const writtenDigits = Array(multiplicand.length).fill("0");
  let carry = 0;

  for (let digitIndex = multiplicand.length - 1; digitIndex >= 0; digitIndex -= 1) {
    const multiplicandDigit = Number(multiplicand[digitIndex]);
    const carryIn = carry;
    const total = (multiplicandDigit * multiplierDigit) + carryIn;
    const resultDigit = total % 10;
    const carryOut = Math.floor(total / 10);
    writtenDigits[digitIndex] = String(resultDigit);
    operations.push({
      processingIndex: operations.length,
      digitIndex,
      multiplicandDigit,
      multiplierDigit,
      carryIn,
      total,
      resultDigit,
      carryOut,
      isLastDigit: digitIndex === 0
    });
    carry = carryOut;
  }

  const finalCarry = carry;
  const coreWritten = `${finalCarry || ""}${writtenDigits.join("")}`;
  const coreProduct = normalizeDigits(coreWritten);
  const shiftedWritten = `${coreWritten}${"0".repeat(shift)}`;
  const shiftedProduct = normalizeDigits(`${coreProduct}${"0".repeat(shift)}`);

  return {
    shift,
    multiplierDigit,
    operations,
    finalCarry,
    coreWritten,
    coreProduct,
    shiftedWritten,
    shiftedProduct
  };
}

function leftPadCells(value, length) {
  return [...Array(Math.max(0, length - value.length)).fill(null), ...value];
}

function exactDecimalDisplay(integerProduct, decimalPlaces, trim = true) {
  if (decimalPlaces === 0) return integerProduct;
  const padded = integerProduct.padStart(decimalPlaces + 1, "0");
  const integer = normalizeDigits(padded.slice(0, -decimalPlaces));
  const rawFraction = padded.slice(-decimalPlaces);
  const fraction = trim ? rawFraction.replace(/0+$/, "") : rawFraction;
  return fraction ? `${integer},${fraction}` : integer;
}

function makeAdditionOperations(partials, productCells, columnCount) {
  const operations = [];
  let carry = 0;
  const firstProductColumn = productCells.findIndex((value) => value !== null);

  for (let layoutIndex = columnCount - 1; layoutIndex >= firstProductColumn; layoutIndex -= 1) {
    const addendDigits = partials.map(({ cells }) => Number(cells[layoutIndex] ?? 0));
    const carryIn = carry;
    const total = addendDigits.reduce((sum, digit) => sum + digit, carryIn);
    const resultDigit = total % 10;
    const carryOut = Math.floor(total / 10);
    if (String(resultDigit) !== productCells[layoutIndex]) {
      throw new Error("Les produits partiels ne reconstruisent pas le produit exact.");
    }
    operations.push({
      processingIndex: operations.length,
      layoutIndex,
      exponent: columnCount - layoutIndex - 1,
      addendDigits,
      carryIn,
      total,
      resultDigit,
      carryOut,
      targetCarryLayoutIndex: carryOut > 0 ? layoutIndex - 1 : null
    });
    carry = carryOut;
  }

  if (carry !== 0) {
    throw new Error("Une retenue finale manque dans la largeur calculée du produit.");
  }
  return operations;
}

export function makeMultiplication(values) {
  if (!Array.isArray(values) || values.length !== 2) {
    throw new TypeError("Une multiplication demande exactement deux facteurs.");
  }

  const factors = values.map((value, inputIndex) => {
    try {
      return parseFactorInput(value);
    } catch (error) {
      if (!(error instanceof MultiplicationInputError)) throw error;
      throw new MultiplicationInputError(error.message, error.code, inputIndex);
    }
  });

  if (factors[1].integerDigits.length > MAX_MULTIPLIER_DIGITS) {
    throw new MultiplicationInputError(
      `Le second facteur est limité à ${MAX_MULTIPLIER_DIGITS} chiffres sans la virgule, pour conserver au plus ${MAX_MULTIPLIER_DIGITS} produits partiels.`,
      "multiplier-too-long",
      1
    );
  }

  const integerFactors = factors.map(({ integerDigits }) => integerDigits);
  const [multiplicand, multiplier] = integerFactors;
  const rawProduct = multiplyDigitStrings(multiplicand, multiplier);
  const totalDecimalPlaces = factors.reduce((sum, factor) => sum + factor.decimalPlaces, 0);
  const isDecimal = factors.some(({ hasSeparator }) => hasSeparator);
  const partialDrafts = [...multiplier].reverse().map((digit, shift) => (
    makePartialDraft(multiplicand, Number(digit), shift)
  ));
  const placedProductDisplay = exactDecimalDisplay(rawProduct, totalDecimalPlaces, false);
  const resultDisplay = exactDecimalDisplay(rawProduct, totalDecimalPlaces, true);
  const placedDigitsLength = placedProductDisplay.replace(",", "").length;
  const layoutColumnCount = Math.max(
    multiplicand.length,
    multiplier.length,
    rawProduct.length,
    placedDigitsLength,
    ...partialDrafts.map(({ shiftedWritten }) => shiftedWritten.length)
  );
  const firstFactorCells = leftPadCells(multiplicand, layoutColumnCount);
  const secondFactorCells = leftPadCells(multiplier, layoutColumnCount);
  const factorLayoutStart = Math.min(
    layoutColumnCount - multiplicand.length,
    layoutColumnCount - multiplier.length
  );

  const partials = partialDrafts.map((partial, partialIndex) => {
    const cells = leftPadCells(partial.shiftedWritten, layoutColumnCount);
    const coreStart = layoutColumnCount - partial.shiftedWritten.length;
    const shiftLayoutIndices = Array.from(
      { length: partial.shift },
      (_, index) => layoutColumnCount - partial.shift + index
    );
    partial.operations.forEach((operation) => {
      operation.resultLayoutIndex = layoutColumnCount - 1 - partial.shift - operation.processingIndex;
      operation.carryTargetLayoutIndex = operation.carryOut > 0
        ? operation.resultLayoutIndex - 1
        : null;
    });
    return {
      ...partial,
      partialIndex,
      cells,
      coreStart,
      shiftLayoutIndices,
      multiplierDigitIndex: multiplier.length - partialIndex - 1
    };
  });

  const productCells = leftPadCells(rawProduct, layoutColumnCount);
  const additionOperations = makeAdditionOperations(partials, productCells, layoutColumnCount);

  return {
    factors,
    displayFactors: factors.map(({ display }) => display),
    integerFactors,
    firstFactorCells,
    secondFactorCells,
    factorLayoutStart,
    partials,
    additionOperations,
    productCells,
    rawProduct,
    placedProductDisplay,
    resultDisplay,
    totalDecimalPlaces,
    decimalPlacesByFactor: factors.map(({ decimalPlaces }) => decimalPlaces),
    isDecimal,
    layoutColumnCount
  };
}

function clamp(minimum, value, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function makeDisplayMetrics(multiplication, options = {}) {
  const {
    columnBudget = 760,
    rowBudget = 480,
    minColumnWidth = 34,
    maxColumnWidth = 82,
    minRowHeight = 42,
    maxRowHeight = 76,
    maxDigitSize = 56
  } = options;
  const visibleRows = 3 + multiplication.partials.length + 2;
  const columnWidth = clamp(
    minColumnWidth,
    Math.floor(columnBudget / Math.max(1, multiplication.layoutColumnCount)),
    maxColumnWidth
  );
  const rowHeight = clamp(
    minRowHeight,
    Math.floor((rowBudget - 28) / Math.max(1, visibleRows)),
    maxRowHeight
  );
  const digitSize = clamp(
    23,
    Math.min(Math.floor(columnWidth * 0.72), Math.floor(rowHeight * 0.66)),
    maxDigitSize
  );
  const signWidth = clamp(40, Math.floor(columnWidth * 0.72), 58);

  return { columnWidth, rowHeight, digitSize, signWidth, visibleRows };
}
