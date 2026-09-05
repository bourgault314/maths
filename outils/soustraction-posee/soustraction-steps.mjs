import { placeValueName } from "./soustraction-engine.mjs";

function quantity(value, exponent) {
  return `${value} ${placeValueName(exponent, value)}`;
}

function exchangeSentence(hop) {
  const source = quantity(1, hop.sourceExponent);
  const target = quantity(10, hop.targetExponent);
  if (hop.hopIndex === 0) return `J’échange ${source} contre ${target}.`;
  return `Parmi ces ${quantity(hop.sourceBefore, hop.sourceExponent)}, j’échange ${source} contre ${target}.`;
}

function exchangeDetail(hop) {
  return `Il reste ${quantity(hop.sourceAfter, hop.sourceExponent)} et j’obtiens ${quantity(hop.targetAfter, hop.targetExponent)}.`;
}

export function makeSteps(subtraction) {
  const initialDigits = [...subtraction.originalMinuendDigits];
  const steps = [{
    kind: "pose",
    title: "Je pose",
    sentence: subtraction.decimalPlaces > 0
      ? "J’aligne les unités et les chiffres de même rang. Les virgules sont l’une sous l’autre."
      : "J’aligne les unités et les chiffres de même rang.",
    detail: "Je place le signe − et je trace le trait du résultat.",
    minuendDigits: initialDigits
  }];

  subtraction.operations.forEach((operation) => {
    const rank = placeValueName(operation.exponent, 2);

    if (operation.needsExchange) {
      steps.push({
        kind: "cannot",
        title: "Je regarde",
        sentence: `Dans la colonne des ${rank}, je ne peux pas enlever ${quantity(operation.subtrahendDigit, operation.exponent)} à ${quantity(operation.minuendBefore, operation.exponent)}.`,
        detail: "Je cherche une unité disponible dans un rang supérieur.",
        opIndex: operation.processingIndex,
        minuendDigits: [...operation.startDigits]
      });

      operation.exchangeHops.forEach((hop) => {
        steps.push({
          kind: "exchange",
          title: "J’échange",
          sentence: exchangeSentence(hop),
          detail: exchangeDetail(hop),
          memo: `${quantity(1, hop.sourceExponent)} = ${quantity(10, hop.targetExponent)}`,
          opIndex: operation.processingIndex,
          exchangeHopIndex: hop.hopIndex,
          activeLayoutIndices: [hop.sourceIndex, hop.targetIndex],
          minuendDigits: [...hop.afterDigits]
        });
      });
    }

    steps.push({
      kind: "calculate",
      title: "Je calcule",
      sentence: `${quantity(operation.minuendDigit, operation.exponent)} − ${quantity(operation.subtrahendDigit, operation.exponent)} = ${quantity(operation.resultDigit, operation.exponent)}.`,
      detail: `Je calcule la colonne des ${rank}.`,
      opIndex: operation.processingIndex,
      minuendDigits: [...operation.finalDigits]
    });
    steps.push({
      kind: "write",
      title: "J’écris",
      sentence: `J’écris ${operation.resultDigit} au rang des ${rank}.`,
      opIndex: operation.processingIndex,
      minuendDigits: [...operation.finalDigits]
    });
  });

  steps.push({
    kind: "verify",
    title: "Je vérifie",
    sentence: `${subtraction.displayTerms[0]} − ${subtraction.displayTerms[1]} = ${subtraction.resultDisplay}.`,
    detail: `${subtraction.resultDisplay} + ${subtraction.displayTerms[1]} = ${subtraction.displayTerms[0]}.`,
    minuendDigits: subtraction.operations.length
      ? [...subtraction.operations.at(-1).finalDigits]
      : initialDigits
  });

  return steps;
}

export function getSubtractionDisplayState(subtraction, steps, currentStepIndex) {
  if (!Number.isInteger(currentStepIndex) || currentStepIndex < 0 || currentStepIndex >= steps.length) {
    throw new RangeError("Étape de soustraction inconnue.");
  }

  const step = steps[currentStepIndex];
  const resultVisible = Array(subtraction.layoutColumnCount).fill(false);
  for (let index = 0; index <= currentStepIndex; index += 1) {
    const visited = steps[index];
    if (visited.kind === "write") {
      resultVisible[subtraction.operations[visited.opIndex].layoutIndex] = true;
    }
    if (visited.kind === "verify") resultVisible.fill(true);
  }

  const minuendDigits = [...(step.minuendDigits || subtraction.originalMinuendDigits)];
  const transformedIndices = minuendDigits
    .map((value, index) => value !== subtraction.originalMinuendDigits[index] ? index : -1)
    .filter((index) => index >= 0);
  let activeLayoutIndices = [];
  let activeArea = null;
  if (step.kind === "exchange") {
    activeLayoutIndices = [...step.activeLayoutIndices];
    activeArea = "exchange";
  } else if (["cannot", "calculate"].includes(step.kind)) {
    activeLayoutIndices = [subtraction.operations[step.opIndex].layoutIndex];
    activeArea = "terms";
  } else if (step.kind === "write") {
    activeLayoutIndices = [subtraction.operations[step.opIndex].layoutIndex];
    activeArea = "result";
  }

  const resultCommaVisible = subtraction.decimalPlaces > 0 && (
    step.kind === "verify"
    || resultVisible.some((visible, layoutIndex) => (
      visible && subtraction.places[layoutIndex].exponent < 0
    ))
  );

  return {
    step,
    resultVisible,
    resultCommaVisible,
    minuendDigits,
    transformedIndices,
    activeLayoutIndices,
    activeArea,
    showVocabulary: step.kind === "verify",
    memo: step.memo || ""
  };
}
