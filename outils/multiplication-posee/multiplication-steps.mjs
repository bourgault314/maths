import { placeValueName } from "./multiplication-engine.mjs";

function formatInteger(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function decimalCountSentence(factor, position) {
  const count = factor.decimalPlaces;
  return `${factor.display} comporte ${count} chiffre${count > 1 ? "s" : ""} après la virgule dans le ${position} facteur.`;
}

function multiplicationCalculation(operation) {
  const parts = [`${operation.multiplicandDigit} × ${operation.multiplierDigit}`];
  if (operation.carryIn > 0) parts.push(String(operation.carryIn));
  return parts.join(" + ");
}

function additionCalculation(operation) {
  const parts = operation.addendDigits.map(String);
  if (operation.carryIn > 0) parts.push(String(operation.carryIn));
  return parts.join(" + ");
}

export function makeSteps(multiplication) {
  const steps = [];

  if (multiplication.isDecimal) {
    steps.push({
      kind: "decimal-observe",
      title: "J’observe",
      sentence: `${multiplication.displayFactors[0]} × ${multiplication.displayFactors[1]}`,
      detail: "Au moins un facteur comporte une virgule : je prépare sa place dans le produit."
    });
    steps.push({
      kind: "decimal-count-first",
      title: "Je compte",
      sentence: decimalCountSentence(multiplication.factors[0], "premier"),
      decimalCountIndex: 0
    });
    steps.push({
      kind: "decimal-count-second",
      title: "Je compte",
      sentence: decimalCountSentence(multiplication.factors[1], "second"),
      decimalCountIndex: 1
    });
    steps.push({
      kind: "decimal-count-total",
      title: "J’additionne",
      sentence: `${multiplication.decimalPlacesByFactor[0]} + ${multiplication.decimalPlacesByFactor[1]} = ${multiplication.totalDecimalPlaces}.`,
      detail: `Le produit devra comporter ${multiplication.totalDecimalPlaces} chiffre${multiplication.totalDecimalPlaces > 1 ? "s" : ""} après la virgule.`
    });
    steps.push({
      kind: "integerize",
      title: "Je prépare le calcul",
      sentence: `Je retire provisoirement les virgules : ${multiplication.integerFactors[0]} × ${multiplication.integerFactors[1]}.`,
      detail: "Je calcule maintenant comme avec des nombres entiers."
    });
  } else {
    steps.push({
      kind: "pose-first",
      title: "Je pose",
      sentence: `J’écris le premier facteur : ${multiplication.displayFactors[0]}.`
    });
    steps.push({
      kind: "pose-second",
      title: "Je pose",
      sentence: `J’écris le second facteur : ${multiplication.displayFactors[1]}.`
    });
  }

  steps.push({
    kind: "align",
    title: "J’aligne",
    sentence: "J’aligne les chiffres à droite, en plaçant les unités sous les unités.",
    detail: multiplication.isDecimal
      ? "En multiplication, je n’aligne pas les virgules : elles sont provisoirement retirées."
      : "Les chiffres de même rang sont dans la même colonne."
  });
  steps.push({
    kind: "setup",
    title: "Je prépare la pose",
    sentence: "Je place le signe × devant le second facteur et je trace le premier trait."
  });

  multiplication.partials.forEach((partial, partialIndex) => {
    const rank = placeValueName(partial.shift, 2);
    steps.push({
      kind: "select-multiplier",
      title: partialIndex === 0 ? "Je commence" : "Je poursuis",
      sentence: partialIndex === 0
        ? `Je commence par ${partial.multiplierDigit}, le chiffre des ${rank} du second facteur.`
        : `Je passe à ${partial.multiplierDigit}, le chiffre des ${rank} du second facteur.`,
      detail: `Je vais multiplier chaque chiffre du premier facteur par ${partial.multiplierDigit}.`,
      partialIndex
    });

    if (partial.shift > 0) {
      const zeros = "0".repeat(partial.shift);
      steps.push({
        kind: "shift",
        title: "Je décale",
        sentence: `Ce nouveau produit partiel commence au rang des ${rank}.`,
        detail: `Je réserve ${partial.shift} rang${partial.shift > 1 ? "s" : ""} à droite en écrivant ${zeros}.`,
        partialIndex
      });
    }

    partial.operations.forEach((operation, opIndex) => {
      const calculation = multiplicationCalculation(operation);
      steps.push({
        kind: "multiply-ask",
        title: "Je multiplie",
        sentence: `${calculation} = ?`,
        detail: operation.carryIn > 0
          ? `J’ajoute la retenue ${operation.carryIn} au produit.`
          : "Je n’anticipe pas les chiffres suivants.",
        partialIndex,
        opIndex
      });
      steps.push({
        kind: "multiply-calculate",
        title: "Je calcule",
        sentence: `${calculation} = ${operation.total}.`,
        partialIndex,
        opIndex
      });

      let detail = "";
      if (operation.carryOut > 0 && operation.isLastDigit) {
        detail = `Il reste une retenue de ${operation.carryOut} à placer à gauche.`;
      } else if (operation.carryOut > 0) {
        detail = `La retenue ${operation.carryOut} sera ajoutée au calcul suivant.`;
      }
      steps.push({
        kind: "partial-write",
        title: "J’écris",
        sentence: operation.carryOut > 0
          ? `J’écris ${operation.resultDigit} et je retiens ${operation.carryOut}.`
          : `J’écris ${operation.resultDigit} dans le produit partiel.`,
        detail,
        partialIndex,
        opIndex
      });

      if (operation.isLastDigit && operation.carryOut > 0) {
        steps.push({
          kind: "partial-final-carry",
          title: "J’écris la retenue",
          sentence: `J’écris la dernière retenue ${operation.carryOut} à gauche du produit partiel.`,
          partialIndex,
          opIndex
        });
      }
    });

    steps.push({
      kind: "partial-complete",
      title: "J’obtiens un produit partiel",
      sentence: partial.shift === 0
        ? `${multiplication.integerFactors[0]} × ${partial.multiplierDigit} = ${formatInteger(partial.coreProduct)}.`
        : `${multiplication.integerFactors[0]} × ${partial.multiplierDigit} = ${formatInteger(partial.coreProduct)}, puis le décalage donne ${formatInteger(partial.shiftedProduct)}.`,
      detail: partial.shift === 0
        ? "Le premier produit partiel est terminé."
        : partial.shift === 1
          ? "Le rang réservé à droite matérialise le changement de rang."
          : `Les ${partial.shift} rangs réservés à droite matérialisent le changement de rang.`,
      partialIndex
    });
  });

  if (multiplication.partials.length === 1) {
    steps.push({
      kind: "single-partial-result",
      title: "Je termine le calcul entier",
      sentence: `Il n’y a qu’un produit partiel : le calcul entier donne ${formatInteger(multiplication.rawProduct)}.`,
      detail: "Aucune addition de produits partiels n’est nécessaire."
    });
  } else {
    steps.push({
      kind: "addition-setup",
      title: "J’additionne",
      sentence: "Tous les produits partiels sont terminés : je les additionne.",
      detail: "Je trace le second trait et je commence par la colonne de droite."
    });

    multiplication.additionOperations.forEach((operation, additionIndex) => {
      const calculation = additionCalculation(operation);
      steps.push({
        kind: "addition-ask",
        title: "J’additionne la colonne",
        sentence: `${calculation} = ?`,
        detail: `Je calcule la colonne des ${placeValueName(operation.exponent, 2)}.`,
        additionIndex
      });
      steps.push({
        kind: "addition-calculate",
        title: "Je calcule",
        sentence: `${calculation} = ${operation.total}.`,
        additionIndex
      });
      steps.push({
        kind: "addition-write",
        title: "J’écris",
        sentence: operation.carryOut > 0
          ? `J’écris ${operation.resultDigit} et je retiens ${operation.carryOut}.`
          : `J’écris ${operation.resultDigit} au rang des ${placeValueName(operation.exponent, 2)}.`,
        detail: operation.carryOut > 0
          ? `La retenue ${operation.carryOut} sera ajoutée à la colonne suivante.`
          : "",
        additionIndex
      });
    });

    steps.push({
      kind: "integer-product",
      title: "J’obtiens le produit entier",
      sentence: `Le calcul sans virgule donne ${formatInteger(multiplication.rawProduct)}.`
    });
  }

  if (multiplication.isDecimal) {
    steps.push({
      kind: "decimal-count-result",
      title: "Je replace la virgule",
      sentence: `Je compte ${multiplication.totalDecimalPlaces} chiffre${multiplication.totalDecimalPlaces > 1 ? "s" : ""} depuis la droite dans ${formatInteger(multiplication.rawProduct)}.`,
      detail: "La virgule se place avant le dernier groupe compté."
    });
    steps.push({
      kind: "decimal-place",
      title: "Je place la virgule",
      sentence: `J’obtiens ${multiplication.placedProductDisplay}.`,
      detail: "J’ajoute un zéro devant la virgule si le produit est inférieur à 1."
    });
    steps.push({
      kind: "decimal-normalize",
      title: "J’écris le produit",
      sentence: multiplication.placedProductDisplay === multiplication.resultDisplay
        ? `${multiplication.resultDisplay} est déjà écrit correctement.`
        : `${multiplication.placedProductDisplay} = ${multiplication.resultDisplay}.`,
      detail: multiplication.placedProductDisplay === multiplication.resultDisplay
        ? "Aucun zéro final inutile n’est à retirer."
        : "Je retire les zéros finaux inutiles de la partie décimale."
    });
  }

  steps.push({
    kind: "vocabulary",
    title: "Je retiens le vocabulaire",
    sentence: `${multiplication.displayFactors[0]} × ${multiplication.displayFactors[1]} = ${multiplication.resultDisplay}.`,
    detail: "facteur × facteur = produit"
  });

  return steps;
}

function isPartialRevealStep(step) {
  return step.kind === "partial-write";
}

function multiplicationCarries(multiplication, steps, currentStepIndex) {
  return multiplication.partials.flatMap((partial, partialIndex) => (
    partial.operations
      .map((operation, opIndex) => ({ operation, opIndex }))
      .filter(({ operation }) => operation.carryOut > 0)
      .map(({ operation, opIndex }) => {
        const sourceStepIndex = steps.findIndex((step) => (
          step.kind === "partial-write"
          && step.partialIndex === partialIndex
          && step.opIndex === opIndex
        ));
        const consumeStepIndex = operation.isLastDigit
          ? steps.findIndex((step) => (
              step.kind === "partial-final-carry"
              && step.partialIndex === partialIndex
              && step.opIndex === opIndex
            ))
          : steps.findIndex((step) => (
              step.kind === "partial-write"
              && step.partialIndex === partialIndex
              && step.opIndex === opIndex + 1
            ));
        const visible = currentStepIndex >= sourceStepIndex;
        let status = "hidden";
        if (visible) {
          if (currentStepIndex === sourceStepIndex) status = "fresh";
          else if (currentStepIndex < consumeStepIndex) status = "active";
          else status = "used";
        }
        return {
          partialIndex,
          opIndex,
          value: operation.carryOut,
          targetLayoutIndex: operation.carryTargetLayoutIndex,
          visible,
          status
        };
      })
  ));
}

function additionCarries(multiplication, steps, currentStepIndex) {
  return multiplication.additionOperations
    .map((operation, additionIndex) => ({ operation, additionIndex }))
    .filter(({ operation }) => operation.carryOut > 0)
    .map(({ operation, additionIndex }) => {
      const sourceStepIndex = steps.findIndex((step) => (
        step.kind === "addition-write" && step.additionIndex === additionIndex
      ));
      const consumeStepIndex = steps.findIndex((step) => (
        step.kind === "addition-write" && step.additionIndex === additionIndex + 1
      ));
      const visible = currentStepIndex >= sourceStepIndex;
      let status = "hidden";
      if (visible) {
        if (currentStepIndex === sourceStepIndex) status = "fresh";
        else if (consumeStepIndex !== -1 && currentStepIndex < consumeStepIndex) status = "active";
        else status = "used";
      }
      return {
        additionIndex,
        value: operation.carryOut,
        targetLayoutIndex: operation.targetCarryLayoutIndex,
        visible,
        status
      };
    });
}

export function getMultiplicationDisplayState(multiplication, steps, currentStepIndex) {
  if (!Number.isInteger(currentStepIndex) || currentStepIndex < 0 || currentStepIndex >= steps.length) {
    throw new RangeError("Étape de multiplication inconnue.");
  }

  const currentStep = steps[currentStepIndex];
  const partialVisible = multiplication.partials.map(() => Array(multiplication.layoutColumnCount).fill(false));
  const resultVisible = Array(multiplication.layoutColumnCount).fill(false);
  const decimalCountsVisible = [false, false, false];
  let showGrid = !multiplication.isDecimal;
  let showFirstFactor = false;
  let showSecondFactor = false;
  let showSign = false;
  let showFirstRule = false;
  let showSecondRule = false;
  let resultText = "";

  for (let index = 0; index <= currentStepIndex; index += 1) {
    const step = steps[index];
    if (step.kind === "decimal-count-first") decimalCountsVisible[0] = true;
    if (step.kind === "decimal-count-second") decimalCountsVisible[1] = true;
    if (step.kind === "decimal-count-total") decimalCountsVisible[2] = true;
    if (step.kind === "integerize") {
      showGrid = true;
      showFirstFactor = true;
      showSecondFactor = true;
    }
    if (step.kind === "pose-first") {
      showGrid = true;
      showFirstFactor = true;
    }
    if (step.kind === "pose-second") showSecondFactor = true;
    if (step.kind === "align") {
      showGrid = true;
      showFirstFactor = true;
      showSecondFactor = true;
    }
    if (step.kind === "setup") {
      showSign = true;
      showFirstRule = true;
    }
    if (step.kind === "shift") {
      for (const layoutIndex of multiplication.partials[step.partialIndex].shiftLayoutIndices) {
        partialVisible[step.partialIndex][layoutIndex] = true;
      }
    }
    if (isPartialRevealStep(step)) {
      const partial = multiplication.partials[step.partialIndex];
      const operation = partial.operations[step.opIndex];
      partialVisible[step.partialIndex][operation.resultLayoutIndex] = true;
    }
    if (step.kind === "partial-final-carry") {
      const partial = multiplication.partials[step.partialIndex];
      const operation = partial.operations[step.opIndex];
      partialVisible[step.partialIndex][operation.carryTargetLayoutIndex] = true;
    }
    if (step.kind === "partial-complete") {
      multiplication.partials[step.partialIndex].cells.forEach((value, layoutIndex) => {
        if (value !== null) partialVisible[step.partialIndex][layoutIndex] = true;
      });
    }
    if (step.kind === "addition-setup") showSecondRule = true;
    if (step.kind === "addition-write") {
      const operation = multiplication.additionOperations[step.additionIndex];
      resultVisible[operation.layoutIndex] = true;
    }
    if (["single-partial-result", "integer-product", "decimal-count-result"].includes(step.kind)) {
      showSecondRule = true;
      multiplication.productCells.forEach((value, layoutIndex) => {
        if (value !== null) resultVisible[layoutIndex] = true;
      });
    }
    if (step.kind === "decimal-place") {
      showSecondRule = true;
      resultText = multiplication.placedProductDisplay;
    }
    if (["decimal-normalize", "vocabulary"].includes(step.kind)) {
      showSecondRule = true;
      resultText = multiplication.isDecimal ? multiplication.resultDisplay : "";
      if (!multiplication.isDecimal) {
        multiplication.productCells.forEach((value, layoutIndex) => {
          if (value !== null) resultVisible[layoutIndex] = true;
        });
      }
    }
  }

  const partial = currentStep.partialIndex === undefined
    ? null
    : multiplication.partials[currentStep.partialIndex];
  const partialOperation = partial && currentStep.opIndex !== undefined
    ? partial.operations[currentStep.opIndex]
    : null;
  const additionOperation = currentStep.additionIndex === undefined
    ? null
    : multiplication.additionOperations[currentStep.additionIndex];

  return {
    step: currentStep,
    showGrid,
    showFirstFactor,
    showSecondFactor,
    showSign,
    showFirstRule,
    showSecondRule,
    showPlusSign: showSecondRule && multiplication.partials.length > 1,
    showDecimalPreparation: multiplication.isDecimal,
    compactDecimalPreparation: showGrid,
    showOriginalExpression: multiplication.isDecimal && !showGrid,
    decimalCountsVisible,
    partialVisible,
    resultVisible,
    resultText,
    multiplicationCarries: multiplicationCarries(multiplication, steps, currentStepIndex),
    additionCarries: additionCarries(multiplication, steps, currentStepIndex),
    activePartialIndex: currentStep.partialIndex ?? null,
    activeMultiplierDigitIndex: partial?.multiplierDigitIndex ?? null,
    activeMultiplicandDigitIndex: partialOperation?.digitIndex ?? null,
    activePartialTarget: partialOperation?.resultLayoutIndex ?? null,
    activeAdditionTarget: additionOperation?.layoutIndex ?? null,
    alignmentActive: currentStep.kind === "align",
    showVocabulary: currentStep.kind === "vocabulary"
  };
}
