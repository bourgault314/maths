export function formatRemainder(remainder, decimalPlaces) {
  if (decimalPlaces === 0) return String(remainder);
  const scale = 10 ** decimalPlaces;
  const whole = Math.floor(remainder / scale);
  const fraction = String(remainder % scale).padStart(decimalPlaces, "0").replace(/0+$/, "");
  return fraction ? `${whole},${fraction}` : String(whole);
}

function anticipationFor(data) {
  const integerQuotient = Math.floor(data.dividend / data.divisor);
  if (integerQuotient === 0) {
    return {
      digitCount: 1,
      rangeSentence: `0 ≤ ${data.dividend} < ${data.divisor}`,
      rangeExpression: `Le dividende est plus petit que le diviseur.`,
      quotientSentence: data.mode === "integer"
        ? `0 ≤ ${data.dividend} ÷ ${data.divisor} < 1`
        : `0 ≤ ${data.dividend} ÷ ${data.divisor} < 1`,
      quotientExpression: data.mode === "integer"
        ? `Le quotient entier est 0.`
        : `La partie entière du quotient est 0.`,
      estimate: null
    };
  }

  const digitCount = String(integerQuotient).length;
  const lowerQuotient = 10 ** (digitCount - 1);
  const upperQuotient = 10 ** digitCount;
  const lowerProduct = data.divisor * lowerQuotient;
  const upperProduct = data.divisor * upperQuotient;
  const exactQuotient = data.dividend / data.divisor;
  const estimateMagnitude = 10 ** Math.floor(Math.log10(exactQuotient));
  const estimatedQuotient = Math.max(1, Math.round(exactQuotient / estimateMagnitude) * estimateMagnitude);
  const friendlyDividend = estimatedQuotient * data.divisor;
  const label = data.mode === "integer" ? "Le quotient" : "La partie entière du quotient";
  const estimate = friendlyDividend !== data.dividend
    ? {
        calculation: `${friendlyDividend} ÷ ${data.divisor} = ${estimatedQuotient}`,
        explanation: `${friendlyDividend} est proche de ${data.dividend} : ${label.toLowerCase()} sera proche de ${estimatedQuotient}.`
      }
    : null;

  return {
    digitCount,
    rangeSentence: `${lowerProduct} ≤ ${data.dividend} < ${upperProduct}`,
    rangeExpression: `${data.divisor} × ${lowerQuotient} = ${lowerProduct} et ${data.divisor} × ${upperQuotient} = ${upperProduct}`,
    quotientSentence: `${lowerQuotient} ≤ ${data.dividend} ÷ ${data.divisor} < ${upperQuotient}`,
    quotientExpression: `${label} aura ${digitCount} chiffre${digitCount > 1 ? "s" : ""}.`,
    estimate
  };
}

const INTEGER_PLACES = [
  ["unité", "unités"],
  ["dizaine", "dizaines"],
  ["centaine", "centaines"],
  ["millier", "milliers"],
  ["dizaine de milliers", "dizaines de milliers"],
  ["centaine de milliers", "centaines de milliers"],
  ["million", "millions"],
  ["dizaine de millions", "dizaines de millions"]
];
const DECIMAL_PLACES = [
  ["dixième", "dixièmes"],
  ["centième", "centièmes"],
  ["millième", "millièmes"],
  ["dix-millième", "dix-millièmes"],
  ["cent-millième", "cent-millièmes"],
  ["millionième", "millionièmes"]
];

const INTEGER_PLACE_MARKERS = ["u", "d", "c", "um", "dm", "cm", "uM", "dM"];
const DECIMAL_PLACE_MARKERS = ["d", "c", "m", "dm", "cm", "mi"];

export function placeValueName(data, endColumn, quantity = 2) {
  const rank = data.integerLength - 1 - endColumn;
  const names = rank >= 0 ? INTEGER_PLACES[rank] : DECIMAL_PLACES[-rank - 1];
  if (!names) return quantity === 1 ? "unité de numération" : "unités de numération";
  return names[quantity === 1 ? 0 : 1];
}

export function placeValueMarker(data, endColumn) {
  const rank = data.integerLength - 1 - endColumn;
  return rank >= 0
    ? INTEGER_PLACE_MARKERS[rank] || "…"
    : DECIMAL_PLACE_MARKERS[-rank - 1] || "…";
}

function afterDe(place) {
  return /^[aeiouyàâäéèêëîïôöùûü]/i.test(place) ? `d’${place}` : `de ${place}`;
}

export function makeDisplayMetrics(data, options = {}) {
  const {
    rowBudget = 330,
    columnBudget = 520,
    quotientBudget = 210,
    maxRowHeight = 50,
    maxColumnWidth = 48,
    maxDigitSize = 36,
    maxQuotientSize = 35
  } = options;
  const rowCount = 1 + data.operations.length * 2;
  const rowHeight = Math.min(maxRowHeight, Math.max(14, Math.floor(rowBudget / rowCount)));
  const digitSize = Math.min(maxDigitSize, Math.max(13, Math.floor(rowHeight * 0.72)));
  const columnWidth = Math.min(maxColumnWidth, Math.max(22, Math.floor(columnBudget / data.digits.length)));
  const quotientSize = Math.min(maxQuotientSize, Math.max(14, Math.floor(quotientBudget / Math.max(4, data.quotient.length))));
  return { rowCount, rowHeight, digitSize, columnWidth, quotientSize };
}

export function getOperationDisplayState(data, index, step) {
  const hidden = { quotient: false, product: false, subtraction: false, result: null };
  const operation = data.operations[index];
  const completed = {
    quotient: true,
    product: true,
    subtraction: true,
    result: operation.nextPartial === undefined ? "remainder" : "next"
  };
  if (step.kind === "finish") return completed;
  if (step.opIndex === undefined || index > step.opIndex) return hidden;
  if (index < step.opIndex) return completed;
  if (step.kind === "ask") return hidden;
  if (step.kind === "choose") return { ...hidden, quotient: true };
  if (step.kind === "multiply") return { ...hidden, quotient: true, product: true };
  if (step.kind === "subtract-ask") {
    return { quotient: true, product: true, subtraction: true, result: null };
  }
  if (step.kind === "subtract") {
    return { quotient: true, product: true, subtraction: true, result: "remainder" };
  }
  if (step.kind === "decimal") {
    return completed;
  }
  if (step.kind === "bring") return completed;
  return hidden;
}

export function makeDivision(dividend, divisor, mode = "integer", requestedDecimals = 2) {
  if (!Number.isInteger(dividend) || dividend < 0) throw new RangeError("Le dividende doit être un entier positif ou nul.");
  if (!Number.isInteger(divisor) || divisor < 1) throw new RangeError("Le diviseur doit être un entier strictement positif.");
  if (!['integer', 'decimal'].includes(mode)) throw new RangeError("Mode de division inconnu.");
  if (!Number.isInteger(requestedDecimals) || requestedDecimals < 1 || requestedDecimals > 6) {
    throw new RangeError("Le nombre de décimales doit être compris entre 1 et 6.");
  }

  const integerDigits = String(dividend).split("").map(Number);
  const stream = [...integerDigits];
  let prefix = 0;
  let column = -1;
  while (column < integerDigits.length - 1) {
    column += 1;
    prefix = prefix * 10 + stream[column];
    if (prefix >= divisor || column === integerDigits.length - 1) break;
  }

  const operations = [];
  let partial = prefix;
  let decimalsUsed = 0;
  while (true) {
    const quotientDigit = Math.floor(partial / divisor);
    const product = quotientDigit * divisor;
    const remainder = partial - product;
    const operation = {
      partial,
      endColumn: column,
      quotientDigit,
      product,
      remainder,
      isDecimalDigit: column >= integerDigits.length
    };

    const hasIntegerDigit = column < integerDigits.length - 1;
    const canAddDecimal = mode === "decimal" && remainder !== 0 && decimalsUsed < requestedDecimals;
    if (hasIntegerDigit || canAddDecimal) {
      column += 1;
      if (column >= stream.length) stream.push(0);
      if (column >= integerDigits.length) decimalsUsed += 1;
      operation.nextDigit = stream[column];
      operation.nextPartial = remainder * 10 + operation.nextDigit;
      operation.nextEndColumn = column;
    }
    operations.push(operation);
    if (operation.nextPartial === undefined) break;
    partial = operation.nextPartial;
  }

  let quotient = "";
  let commaPlaced = false;
  for (const operation of operations) {
    if (operation.isDecimalDigit && !commaPlaced) {
      quotient += ",";
      commaPlaced = true;
    }
    quotient += operation.quotientDigit;
  }
  const finalRemainder = operations.at(-1).remainder;
  return {
    dividend,
    divisor,
    mode,
    integerLength: integerDigits.length,
    digits: stream,
    operations,
    decimalPlacesUsed: decimalsUsed,
    quotient,
    remainder: finalRemainder,
    scaledRemainder: formatRemainder(finalRemainder, decimalsUsed)
  };
}

export function multiplicationBracket(data, operationIndex) {
  const operation = data.operations[operationIndex];
  if (!operation) return null;
  const lowerMultiplier = operation.quotientDigit;
  const upperMultiplier = lowerMultiplier + 1;
  return {
    target: operation.partial,
    lowerMultiplier,
    lowerProduct: lowerMultiplier * data.divisor,
    upperMultiplier,
    upperProduct: upperMultiplier * data.divisor
  };
}

export function makeSteps(data) {
  const anticipation = anticipationFor(data);
  const steps = [{
    kind: "bound",
    title: "J’encadre",
    sentence: anticipation.rangeSentence,
    detail: anticipation.rangeExpression
  }, {
    kind: "digits",
    title: "J’en déduis",
    sentence: anticipation.quotientSentence,
    detail: anticipation.quotientExpression,
    quotientDigitCount: anticipation.digitCount
  }];

  if (anticipation.estimate) {
    steps.push({
      kind: "estimate",
      title: "J’estime",
      sentence: anticipation.estimate.calculation,
      detail: anticipation.estimate.explanation,
      quotientDigitCount: anticipation.digitCount
    });
  }

  data.operations.forEach((operation, opIndex) => {
    const place = placeValueName(data, operation.endColumn);
    steps.push({
      kind: "ask",
      title: "Je cherche",
      sentence: `${operation.partial} ${place} ÷ ${data.divisor} : combien ${afterDe(place)} au quotient ?`,
      opIndex
    });
    steps.push({
      kind: "choose",
      title: "Je choisis",
      sentence: `J’écris ${operation.quotientDigit} au rang des ${place}.`,
      detail: `${operation.quotientDigit} × ${data.divisor} = ${operation.product}, et ${operation.quotientDigit + 1} × ${data.divisor} = ${(operation.quotientDigit + 1) * data.divisor} serait trop grand.`,
      opIndex
    });
    steps.push({
      kind: "multiply",
      title: "Je multiplie",
      sentence: `${operation.quotientDigit} × ${data.divisor} = ${operation.product}.`,
      detail: `Je pose ${operation.product} ${place} sous ${operation.partial} ${place}.`,
      opIndex
    });
    steps.push({
      kind: "subtract-ask",
      title: "Je soustrais",
      sentence: `${operation.partial} − ${operation.product} = ?`,
      detail: "Quel est le reste ?",
      opIndex
    });
    steps.push({
      kind: "subtract",
      title: "Je trouve le reste",
      sentence: `${operation.partial} − ${operation.product} = ${operation.remainder}.`,
      detail: `Il reste ${operation.remainder} ${placeValueName(data, operation.endColumn, operation.remainder)}.`,
      opIndex
    });
    if (operation.nextDigit !== undefined) {
      const decimalStart = operation.nextEndColumn === data.integerLength;
      const generatedDecimal = operation.nextEndColumn >= data.integerLength;
      const nextPlace = placeValueName(data, operation.nextEndColumn);
      if (decimalStart) {
        steps.push({
          kind: "bring",
          title: "J’échange",
          sentence: `${operation.remainder} ${placeValueName(data, operation.endColumn, operation.remainder)} = ${operation.remainder * 10} ${nextPlace}.`,
          detail: `Je fais apparaître un 0 au rang des ${nextPlace} dans le dividende : j’obtiens ${operation.nextPartial} ${nextPlace}.`,
          opIndex
        });
        steps.push({
          kind: "decimal",
          title: "Je prépare le quotient",
          sentence: `Le dividende comporte maintenant des ${nextPlace}.`,
          detail: `J’écris la virgule et je réserve la place des ${nextPlace} au quotient.`,
          opIndex
        });
      } else {
        steps.push({
          kind: "bring",
          title: generatedDecimal ? "J’échange" : "J’échange et j’abaisse",
          sentence: `${operation.remainder} ${placeValueName(data, operation.endColumn, operation.remainder)} = ${operation.remainder * 10} ${nextPlace}.`,
          detail: generatedDecimal
            ? `Je fais apparaître un 0 au rang des ${nextPlace} dans le dividende : j’obtiens ${operation.nextPartial} ${nextPlace}.`
            : `J’abaisse ${operation.nextDigit} ${placeValueName(data, operation.nextEndColumn, operation.nextDigit)} : j’obtiens ${operation.nextPartial} ${nextPlace}.`,
          opIndex
        });
      }
    }
  });

  steps.push({
    kind: "finish",
    title: "Je vérifie",
    sentence: `${data.dividend} = ${data.quotient} × ${data.divisor} + ${data.scaledRemainder}.`
  });
  return steps;
}
