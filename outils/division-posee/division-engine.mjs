export function formatRemainder(remainder, decimalPlaces) {
  if (decimalPlaces === 0) return String(remainder);
  const scale = 10 ** decimalPlaces;
  const whole = Math.floor(remainder / scale);
  const fraction = String(remainder % scale).padStart(decimalPlaces, "0").replace(/0+$/, "");
  return fraction ? `${whole},${fraction}` : String(whole);
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
  const integerQuotient = Math.floor(data.dividend / data.divisor);
  const digitCount = String(integerQuotient).length;
  const steps = [{
    kind: "predict",
    title: "J’anticipe",
    sentence: data.mode === "integer"
      ? `Le quotient entier aura ${digitCount} chiffre${digitCount > 1 ? "s" : ""}.`
      : `La partie entière du quotient aura ${digitCount} chiffre${digitCount > 1 ? "s" : ""}.`
  }];

  data.operations.forEach((operation, opIndex) => {
    steps.push({
      kind: "choose",
      title: "Je cherche",
      sentence: `Dans ${operation.partial}, combien de fois ${data.divisor} ? ${operation.quotientDigit} fois.`,
      opIndex
    });
    steps.push({
      kind: "subtract",
      title: "Je soustrais",
      sentence: `${operation.quotientDigit} × ${data.divisor} = ${operation.product}, puis ${operation.partial} − ${operation.product} = ${operation.remainder}.`,
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
