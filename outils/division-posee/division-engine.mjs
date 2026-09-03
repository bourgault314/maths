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
      sentence: data.mode === "integer"
        ? "Le quotient entier est 0."
        : "La partie entière du quotient est 0.",
      detail: `${data.dividend} est plus petit que ${data.divisor} : le quotient est inférieur à 1.`
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
  const label = data.mode === "integer" ? "Le quotient entier" : "La partie entière du quotient";
  const estimate = friendlyDividend !== lowerProduct && friendlyDividend !== upperProduct
    ? ` Estimation : ${friendlyDividend} ÷ ${data.divisor} = ${estimatedQuotient}, donc ${data.dividend} ÷ ${data.divisor} ≈ ${estimatedQuotient}.`
    : "";

  return {
    digitCount,
    sentence: `${label} aura ${digitCount} chiffre${digitCount > 1 ? "s" : ""}.`,
    detail: `${data.divisor} × ${lowerQuotient} = ${lowerProduct} et ${data.divisor} × ${upperQuotient} = ${upperProduct} : le quotient est entre ${lowerQuotient} et ${upperQuotient}.${estimate}`
  };
}

export function makeDisplayMetrics(data) {
  const rowCount = 1 + data.operations.length * 2;
  const rowHeight = Math.min(50, Math.max(14, Math.floor(390 / rowCount)));
  const digitSize = Math.min(36, Math.max(13, Math.floor(rowHeight * 0.72)));
  const columnWidth = Math.min(48, Math.max(22, Math.floor(520 / data.digits.length)));
  const quotientSize = Math.min(35, Math.max(14, Math.floor(210 / Math.max(4, data.quotient.length))));
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
  if (step.kind === "choose") return { ...hidden, quotient: true };
  if (step.kind === "multiply") return { ...hidden, quotient: true, product: true };
  if (step.kind === "subtract") {
    return { quotient: true, product: true, subtraction: true, result: "remainder" };
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

export function makeSteps(data) {
  const anticipation = anticipationFor(data);
  const steps = [{
    kind: "predict",
    title: "J’anticipe",
    sentence: anticipation.sentence,
    detail: anticipation.detail
  }];

  data.operations.forEach((operation, opIndex) => {
    steps.push({
      kind: "choose",
      title: "Je cherche",
      sentence: `Dans ${operation.partial}, combien de fois ${data.divisor} ? ${operation.quotientDigit} fois.`,
      opIndex
    });
    steps.push({
      kind: "multiply",
      title: "Je multiplie",
      sentence: `${operation.quotientDigit} × ${data.divisor} = ${operation.product}. J’écris ${operation.product} sous ${operation.partial}.`,
      opIndex
    });
    steps.push({
      kind: "subtract",
      title: "Je soustrais",
      sentence: `${operation.partial} − ${operation.product} = ${operation.remainder}.`,
      opIndex
    });
    if (operation.nextDigit !== undefined) {
      const decimalStart = operation.nextEndColumn === data.integerLength;
      steps.push({
        kind: "bring",
        title: decimalStart ? "Je passe aux décimales" : "J’abaisse",
        sentence: decimalStart
          ? `J’écris la virgule et j’abaisse un 0 : j’obtiens ${operation.nextPartial}.`
          : `J’abaisse ${operation.nextDigit} : j’obtiens ${operation.nextPartial}.`,
        opIndex
      });
    }
  });

  steps.push({
    kind: "finish",
    title: "Je vérifie",
    sentence: `${data.dividend} = ${data.quotient} × ${data.divisor} + ${data.scaledRemainder}.`
  });
  return steps;
}
