import { placeValueName } from "./addition-engine.mjs";

function calculationParts(operation) {
  const parts = operation.addendDigits.map(String);
  if (operation.carryIn > 0) parts.push(String(operation.carryIn));
  return parts;
}

function searchSentence(operation) {
  const placeParts = operation.addendDigits.map((digit) => (
    `${digit} ${placeValueName(operation.exponent, digit)}`
  ));
  if (operation.carryIn > 0) {
    placeParts.push(
      `${operation.carryIn} ${placeValueName(operation.exponent, operation.carryIn)} retenue`
    );
  }
  return `${placeParts.join(" + ")} = ?`;
}

export function makeSteps(addition) {
  const steps = [{
    kind: "pose",
    title: "Je pose",
    sentence: addition.decimalPlaces > 0
      ? "J’aligne les virgules et les chiffres de même rang."
      : "J’aligne les unités et les chiffres de même rang.",
    detail: "Je place le signe + et je trace le trait du résultat."
  }];

  addition.operations.forEach((operation, opIndex) => {
    const rank = placeValueName(operation.exponent, 2);
    const nextRank = placeValueName(operation.exponent + 1, 2);
    const nextPlace = placeValueName(operation.exponent + 1, operation.carryOut);
    const parts = calculationParts(operation);

    steps.push({
      kind: "search",
      title: "Je cherche",
      sentence: searchSentence(operation),
      opIndex
    });
    steps.push({
      kind: "calculate",
      title: "Je calcule",
      sentence: `${parts.join(" + ")} = ${operation.total}.`,
      detail: `Je calcule la colonne des ${rank}.`,
      opIndex
    });

    if (operation.carryOut === 0) {
      steps.push({
        kind: "write",
        title: "J’écris",
        sentence: `J’écris ${operation.resultDigit} au rang des ${rank}.`,
        opIndex
      });
      return;
    }

    steps.push({
      kind: "exchange",
      title: "J’échange",
      sentence: `${operation.total} ${placeValueName(operation.exponent, operation.total)} = ${operation.carryOut} ${nextPlace} et ${operation.resultDigit} ${placeValueName(operation.exponent, operation.resultDigit)}.`,
      detail: `J’écris ${operation.resultDigit} au rang des ${rank} et je retiens ${operation.carryOut} ${nextPlace}.`,
      memo: `10 ${placeValueName(operation.exponent, 10)} = 1 ${placeValueName(operation.exponent + 1, 1)}`,
      nextRank,
      opIndex
    });
  });

  if (addition.hasFinalCarry) {
    const finalPlace = addition.places[0];
    const finalRank = placeValueName(finalPlace.exponent, 2);
    const carryValue = addition.finalCarryDigits.join("");
    steps.push({
      kind: "final-carry",
      title: "J’écris la retenue",
      sentence: `La retenue devient le chiffre des ${finalRank}.`,
      detail: `J’écris ${carryValue} au rang des ${finalRank}.`,
      resultLayoutIndices: addition.finalCarryDigits.map((_, index) => index)
    });
  }

  steps.push({
    kind: "verify",
    title: "Je vérifie",
    sentence: `${addition.displayTerms.join(" + ")} = ${addition.resultDisplay}.`,
    detail: "L’addition est entièrement complétée."
  });

  return steps;
}

function resultRevealStep(step) {
  return step.kind === "write" || step.kind === "exchange";
}

export function getAdditionDisplayState(addition, steps, currentStepIndex) {
  if (!Number.isInteger(currentStepIndex) || currentStepIndex < 0 || currentStepIndex >= steps.length) {
    throw new RangeError("Étape d’addition inconnue.");
  }

  const step = steps[currentStepIndex];
  const resultVisible = Array(addition.layoutColumnCount).fill(false);

  for (let index = 0; index <= currentStepIndex; index += 1) {
    const visited = steps[index];
    if (resultRevealStep(visited)) {
      const operation = addition.operations[visited.opIndex];
      resultVisible[operation.layoutIndex] = true;
    }
    if (visited.kind === "final-carry") {
      for (const layoutIndex of visited.resultLayoutIndices) resultVisible[layoutIndex] = true;
    }
    if (visited.kind === "verify") resultVisible.fill(true);
  }

  const carries = addition.operations
    .filter(({ carryOut }) => carryOut > 0)
    .map((operation) => {
      const sourceRevealStepIndex = steps.findIndex((candidate) => (
        candidate.kind === "exchange" && candidate.opIndex === operation.processingIndex
      ));
      const targetOperation = addition.operations[operation.processingIndex + 1];
      const isFinal = !targetOperation;
      const consumeStepIndex = isFinal
        ? steps.findIndex(({ kind }) => kind === "final-carry")
        : steps.findIndex((candidate) => (
            resultRevealStep(candidate) && candidate.opIndex === targetOperation.processingIndex
          ));
      const visible = currentStepIndex >= sourceRevealStepIndex;
      let status = "hidden";
      if (visible) {
        if (currentStepIndex === sourceRevealStepIndex) status = "fresh";
        else if (isFinal ? currentStepIndex <= consumeStepIndex : currentStepIndex < consumeStepIndex) status = "active";
        else status = "used";
      }
      return {
        sourceOpIndex: operation.processingIndex,
        targetLayoutIndex: operation.targetCarryLayoutIndex,
        value: operation.carryOut,
        visible,
        status,
        isFinal
      };
    });

  let activeLayoutIndex = null;
  if (step.opIndex !== undefined) {
    activeLayoutIndex = addition.operations[step.opIndex].layoutIndex;
  } else if (step.kind === "final-carry") {
    activeLayoutIndex = step.resultLayoutIndices.at(-1);
  }

  const activeArea = ["search", "calculate"].includes(step.kind)
    ? "terms"
    : ["write", "exchange", "final-carry"].includes(step.kind)
      ? "result"
      : null;
  const resultCommaVisible = addition.decimalPlaces > 0 && (
    step.kind === "verify"
    || resultVisible.some((visible, layoutIndex) => (
      visible && addition.places[layoutIndex].exponent < 0
    ))
  );

  return {
    step,
    resultVisible,
    resultCommaVisible,
    carries,
    activeLayoutIndex,
    activeArea,
    showVocabulary: step.kind === "verify",
    memo: step.memo || ""
  };
}
