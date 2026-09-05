export const MAX_INTEGER_DIGITS = 8;
export const MAX_DECIMAL_DIGITS = 6;
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
  ["centaine de millions", "centaines de millions"]
];

const DECIMAL_PLACES = [
  ["dixième", "dixièmes"],
  ["centième", "centièmes"],
  ["millième", "millièmes"],
  ["dix-millième", "dix-millièmes"],
  ["cent-millième", "cent-millièmes"],
  ["millionième", "millionièmes"]
];

const INTEGER_MARKERS = ["u", "d", "c", "um", "dm", "cm", "uM", "dM", "cM"];
const DECIMAL_MARKERS = ["d", "c", "m", "dm", "cm", "mi"];

export class AdditionInputError extends RangeError {
  constructor(message, code = "invalid", inputIndex = null) {
    super(message);
    this.name = "AdditionInputError";
    this.code = code;
    this.inputIndex = inputIndex;
  }
}

export function parseDecimalInput(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source) {
    throw new AdditionInputError("Saisissez un nombre.", "empty");
  }
  if (!/^\d+(?:[.,]\d+)?$/.test(source)) {
    throw new AdditionInputError(
      "Utilisez uniquement des chiffres, avec une virgule ou un point si nécessaire.",
      "format"
    );
  }
  if (source.length > MAX_INPUT_CHARACTERS) {
    throw new AdditionInputError(
      `Le nombre est limité à ${MAX_INPUT_CHARACTERS} caractères.`,
      "input-too-long"
    );
  }

  const separatorIndex = source.search(/[.,]/);
  const rawInteger = separatorIndex === -1 ? source : source.slice(0, separatorIndex);
  const fraction = separatorIndex === -1 ? "" : source.slice(separatorIndex + 1);
  const integer = rawInteger.replace(/^0+(?=\d)/, "");

  if (integer.length > MAX_INTEGER_DIGITS) {
    throw new AdditionInputError(
      `La partie entière est limitée à ${MAX_INTEGER_DIGITS} chiffres.`,
      "integer-too-long"
    );
  }
  if (fraction.length > MAX_DECIMAL_DIGITS) {
    throw new AdditionInputError(
      `La partie décimale est limitée à ${MAX_DECIMAL_DIGITS} chiffres.`,
      "fraction-too-long"
    );
  }

  return {
    source,
    integer,
    fraction,
    hasSeparator: separatorIndex !== -1
  };
}

export function placeValueName(exponent, quantity = 2) {
  const names = exponent >= 0 ? INTEGER_PLACES[exponent] : DECIMAL_PLACES[-exponent - 1];
  if (!names) return quantity === 1 ? "unité de numération" : "unités de numération";
  return names[quantity === 1 ? 0 : 1];
}

export function placeValueMarker(exponent) {
  return exponent >= 0
    ? INTEGER_MARKERS[exponent] || "…"
    : DECIMAL_MARKERS[-exponent - 1] || "…";
}

function formatWithScale(integer, fraction, decimalPlaces) {
  if (decimalPlaces === 0) return integer;
  return `${integer},${fraction.padEnd(decimalPlaces, "0")}`;
}

function exponentForColumn(columnIndex, integerPlaces) {
  return columnIndex < integerPlaces
    ? integerPlaces - columnIndex - 1
    : -(columnIndex - integerPlaces + 1);
}

export function makeAddition(values) {
  if (!Array.isArray(values) || values.length < 2) {
    throw new TypeError("Une addition demande au moins deux termes.");
  }

  const terms = values.map((value, inputIndex) => {
    try {
      return parseDecimalInput(value);
    } catch (error) {
      if (!(error instanceof AdditionInputError)) throw error;
      throw new AdditionInputError(error.message, error.code, inputIndex);
    }
  });

  const decimalPlaces = Math.max(...terms.map(({ fraction }) => fraction.length));
  const integerPlaces = Math.max(...terms.map(({ integer }) => integer.length));
  const baseColumnCount = integerPlaces + decimalPlaces;
  const baseTermCells = terms.map(({ integer, fraction }) => [
    ...Array(integerPlaces - integer.length).fill(null),
    ...integer,
    ...fraction.padEnd(decimalPlaces, "0")
  ]);

  const baseResultCells = Array(baseColumnCount).fill("0");
  const operations = [];
  let carry = 0;

  for (let columnIndex = baseColumnCount - 1; columnIndex >= 0; columnIndex -= 1) {
    const addendDigits = baseTermCells.map((cells) => Number(cells[columnIndex] ?? 0));
    const carryIn = carry;
    const total = addendDigits.reduce((sum, digit) => sum + digit, carryIn);
    const resultDigit = total % 10;
    const carryOut = Math.floor(total / 10);
    baseResultCells[columnIndex] = String(resultDigit);
    operations.push({
      processingIndex: operations.length,
      columnIndex,
      exponent: exponentForColumn(columnIndex, integerPlaces),
      addendDigits,
      carryIn,
      total,
      resultDigit,
      carryOut
    });
    carry = carryOut;
  }

  const finalCarryDigits = carry > 0 ? String(carry).split("") : [];
  const extraIntegerPlaces = finalCarryDigits.length;
  const layoutIntegerPlaces = integerPlaces + extraIntegerPlaces;
  const layoutColumnCount = layoutIntegerPlaces + decimalPlaces;
  const termCells = baseTermCells.map((cells) => [
    ...Array(extraIntegerPlaces).fill(null),
    ...cells
  ]);
  const resultCells = [...finalCarryDigits, ...baseResultCells];
  const places = Array.from({ length: layoutColumnCount }, (_, layoutIndex) => ({
    layoutIndex,
    exponent: exponentForColumn(layoutIndex, layoutIntegerPlaces)
  }));

  operations.forEach((operation) => {
    operation.layoutIndex = extraIntegerPlaces + operation.columnIndex;
    operation.targetCarryLayoutIndex = operation.carryOut > 0
      ? operation.layoutIndex - 1
      : null;
  });

  const resultInteger = resultCells.slice(0, layoutIntegerPlaces).join("");
  const resultFraction = resultCells.slice(layoutIntegerPlaces).join("");

  return {
    terms,
    termCells,
    resultCells,
    operations,
    places,
    integerPlaces,
    decimalPlaces,
    layoutIntegerPlaces,
    layoutColumnCount,
    extraIntegerPlaces,
    finalCarryDigits,
    hasFinalCarry: finalCarryDigits.length > 0,
    displayTerms: terms.map(({ integer, fraction }) => formatWithScale(integer, fraction, decimalPlaces)),
    resultDisplay: formatWithScale(resultInteger, resultFraction, decimalPlaces)
  };
}

function clamp(minimum, value, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function makeDisplayMetrics(addition, options = {}) {
  const {
    columnBudget = 720,
    rowBudget = 390,
    minColumnWidth = 30,
    maxColumnWidth = 98,
    minRowHeight = 54,
    maxRowHeight = 104,
    maxDigitSize = 74
  } = options;
  const columnWidth = clamp(
    minColumnWidth,
    Math.floor(columnBudget / Math.max(1, addition.layoutColumnCount)),
    maxColumnWidth
  );
  const rowHeight = clamp(minRowHeight, Math.floor(rowBudget / 3.9), maxRowHeight);
  const digitSize = clamp(
    22,
    Math.min(Math.floor(columnWidth * 0.76), Math.floor(rowHeight * 0.72)),
    maxDigitSize
  );
  const signWidth = clamp(34, Math.floor(columnWidth * 0.62), 58);
  const separatorWidth = addition.decimalPlaces > 0
    ? clamp(14, Math.floor(columnWidth * 0.28), 28)
    : 0;

  return { columnWidth, rowHeight, digitSize, signWidth, separatorWidth };
}
