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

export class SubtractionInputError extends RangeError {
  constructor(message, code = "invalid", inputIndex = null) {
    super(message);
    this.name = "SubtractionInputError";
    this.code = code;
    this.inputIndex = inputIndex;
  }
}

export function parseDecimalInput(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source) {
    throw new SubtractionInputError("Saisissez un nombre.", "empty");
  }
  if (!/^\d+(?:[.,]\d+)?$/.test(source)) {
    throw new SubtractionInputError(
      "Utilisez uniquement des chiffres, avec une virgule ou un point si nécessaire.",
      "format"
    );
  }
  if (source.length > MAX_INPUT_CHARACTERS) {
    throw new SubtractionInputError(
      `Le nombre est limité à ${MAX_INPUT_CHARACTERS} caractères.`,
      "input-too-long"
    );
  }

  const separatorIndex = source.search(/[.,]/);
  const rawInteger = separatorIndex === -1 ? source : source.slice(0, separatorIndex);
  const fraction = separatorIndex === -1 ? "" : source.slice(separatorIndex + 1);
  const integer = rawInteger.replace(/^0+(?=\d)/, "");

  if (integer.length > MAX_INTEGER_DIGITS) {
    throw new SubtractionInputError(
      `La partie entière est limitée à ${MAX_INTEGER_DIGITS} chiffres.`,
      "integer-too-long"
    );
  }
  if (fraction.length > MAX_DECIMAL_DIGITS) {
    throw new SubtractionInputError(
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
  const singular = quantity === 0 || quantity === 1;
  if (!names) return singular ? "unité de numération" : "unités de numération";
  return names[singular ? 0 : 1];
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

function compareDigits(firstDigits, secondDigits) {
  for (let index = 0; index < firstDigits.length; index += 1) {
    if (firstDigits[index] !== secondDigits[index]) {
      return firstDigits[index] > secondDigits[index] ? 1 : -1;
    }
  }
  return 0;
}

function visibleResultCells(resultDigits, integerPlaces) {
  const cells = resultDigits.map(String);
  for (let index = 0; index < integerPlaces - 1; index += 1) {
    if (resultDigits[index] !== 0) break;
    cells[index] = null;
  }
  return cells;
}

function normalizeArguments(firstValue, secondValue) {
  if (Array.isArray(firstValue)) {
    if (firstValue.length !== 2) {
      throw new TypeError("Une soustraction demande exactement deux termes.");
    }
    return firstValue;
  }
  return [firstValue, secondValue];
}

export function makeSubtraction(firstValue, secondValue) {
  const values = normalizeArguments(firstValue, secondValue);
  const terms = values.map((value, inputIndex) => {
    try {
      return parseDecimalInput(value);
    } catch (error) {
      if (!(error instanceof SubtractionInputError)) throw error;
      throw new SubtractionInputError(error.message, error.code, inputIndex);
    }
  });

  const decimalPlaces = Math.max(...terms.map(({ fraction }) => fraction.length));
  const integerPlaces = Math.max(...terms.map(({ integer }) => integer.length));
  const layoutColumnCount = integerPlaces + decimalPlaces;
  const termCells = terms.map(({ integer, fraction }) => [
    ...Array(integerPlaces - integer.length).fill(null),
    ...integer,
    ...fraction.padEnd(decimalPlaces, "0")
  ]);
  const originalMinuendDigits = termCells[0].map((value) => Number(value ?? 0));
  const subtrahendDigits = termCells[1].map((value) => Number(value ?? 0));

  if (compareDigits(originalMinuendDigits, subtrahendDigits) < 0) {
    throw new SubtractionInputError(
      "Pour cette version, le premier terme doit être supérieur ou égal au second terme.",
      "negative-result",
      1
    );
  }

  const workingDigits = [...originalMinuendDigits];
  const resultDigits = Array(layoutColumnCount).fill(0);
  const operations = [];

  for (let columnIndex = layoutColumnCount - 1; columnIndex >= 0; columnIndex -= 1) {
    const startDigits = [...workingDigits];
    const subtrahendDigit = subtrahendDigits[columnIndex];
    const exchangeHops = [];

    if (workingDigits[columnIndex] < subtrahendDigit) {
      let donorIndex = columnIndex - 1;
      while (donorIndex >= 0 && workingDigits[donorIndex] === 0) donorIndex -= 1;
      if (donorIndex < 0) {
        throw new Error("Échange impossible pour une soustraction pourtant positive.");
      }

      for (let sourceIndex = donorIndex; sourceIndex < columnIndex; sourceIndex += 1) {
        const targetIndex = sourceIndex + 1;
        const beforeDigits = [...workingDigits];
        const sourceBefore = workingDigits[sourceIndex];
        const targetBefore = workingDigits[targetIndex];
        workingDigits[sourceIndex] -= 1;
        workingDigits[targetIndex] += 10;
        exchangeHops.push({
          hopIndex: exchangeHops.length,
          sourceIndex,
          targetIndex,
          sourceExponent: exponentForColumn(sourceIndex, integerPlaces),
          targetExponent: exponentForColumn(targetIndex, integerPlaces),
          sourceBefore,
          sourceAfter: workingDigits[sourceIndex],
          targetBefore,
          targetAfter: workingDigits[targetIndex],
          beforeDigits,
          afterDigits: [...workingDigits]
        });
      }
    }

    const minuendDigit = workingDigits[columnIndex];
    const resultDigit = minuendDigit - subtrahendDigit;
    resultDigits[columnIndex] = resultDigit;
    operations.push({
      processingIndex: operations.length,
      columnIndex,
      layoutIndex: columnIndex,
      exponent: exponentForColumn(columnIndex, integerPlaces),
      startDigits,
      finalDigits: [...workingDigits],
      minuendBefore: startDigits[columnIndex],
      minuendDigit,
      subtrahendDigit,
      resultDigit,
      needsExchange: exchangeHops.length > 0,
      donorIndex: exchangeHops[0]?.sourceIndex ?? null,
      exchangeHops
    });
  }

  const resultInteger = resultDigits.slice(0, integerPlaces).join("").replace(/^0+(?=\d)/, "");
  const resultFraction = resultDigits.slice(integerPlaces).join("");
  const places = Array.from({ length: layoutColumnCount }, (_, layoutIndex) => ({
    layoutIndex,
    exponent: exponentForColumn(layoutIndex, integerPlaces)
  }));

  return {
    terms,
    termCells,
    originalMinuendDigits,
    subtrahendDigits,
    resultDigits,
    resultCells: visibleResultCells(resultDigits, integerPlaces),
    operations,
    places,
    integerPlaces,
    decimalPlaces,
    layoutIntegerPlaces: integerPlaces,
    layoutColumnCount,
    displayTerms: terms.map(({ integer, fraction }) => formatWithScale(integer, fraction, decimalPlaces)),
    resultDisplay: formatWithScale(resultInteger, resultFraction, decimalPlaces)
  };
}

function clamp(minimum, value, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function makeDisplayMetrics(subtraction, options = {}) {
  const {
    columnBudget = 720,
    rowBudget = 390,
    minColumnWidth = 32,
    maxColumnWidth = 98,
    minRowHeight = 54,
    maxRowHeight = 104,
    maxDigitSize = 74
  } = options;
  const columnWidth = clamp(
    minColumnWidth,
    Math.floor(columnBudget / Math.max(1, subtraction.layoutColumnCount)),
    maxColumnWidth
  );
  const rowHeight = clamp(minRowHeight, Math.floor(rowBudget / 4), maxRowHeight);
  const digitSize = clamp(
    22,
    Math.min(Math.floor(columnWidth * 0.76), Math.floor(rowHeight * 0.72)),
    maxDigitSize
  );
  const signWidth = clamp(34, Math.floor(columnWidth * 0.62), 58);
  const separatorWidth = subtraction.decimalPlaces > 0
    ? clamp(14, Math.floor(columnWidth * 0.28), 28)
    : 0;

  return { columnWidth, rowHeight, digitSize, signWidth, separatorWidth };
}
