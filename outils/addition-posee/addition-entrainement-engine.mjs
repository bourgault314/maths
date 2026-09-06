import { placeValueName } from "./addition-engine.mjs";

function integerValue(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

function calculationParts(operation) {
  const parts = operation.addendDigits.map(String);
  if (operation.carryIn > 0) parts.push(String(operation.carryIn));
  return parts;
}

function searchSentence(operation) {
  const parts = operation.addendDigits.map((digit) => (
    `${digit} ${placeValueName(operation.exponent, digit)}`
  ));
  if (operation.carryIn > 0) {
    parts.push(`${operation.carryIn} ${placeValueName(operation.exponent, operation.carryIn)} retenue`);
  }
  return `${parts.join(" + ")} = ?`;
}

export function makeTrainingTasks(addition, { includePlacement = false } = {}) {
  const tasks = [];
  if (includePlacement) {
    tasks.push({
      id: "placement",
      kind: "placement",
      title: "Je pose",
      sentence: "Repère les chiffres des unités et aligne-les.",
      detail: `À placer : ${addition.displayTerms.join(" + ")}.`,
      expected: {
        term0: addition.termCells[0].map((digit) => digit ?? ""),
        term1: addition.termCells[1].map((digit) => digit ?? "")
      }
    });
  }

  tasks.push(...addition.operations.map((operation) => ({
    id: `column-${operation.processingIndex}`,
    kind: "column",
    title: "Je calcule",
    sentence: searchSentence(operation),
    detail: `Écris le chiffre de la somme au rang des ${placeValueName(operation.exponent, 2)} et, si nécessaire, la retenue au rang suivant. Le calcul du haut est facultatif.`,
    memo: "",
    opIndex: operation.processingIndex,
    expected: {
      total: operation.total,
      result: operation.resultDigit,
      carry: operation.carryOut > 0 ? operation.carryOut : ""
    }
  })));

  if (addition.hasFinalCarry) {
    const carry = addition.finalCarryDigits.join("");
    const finalPlace = addition.places[0];
    tasks.push({
      id: "final-carry",
      kind: "final-carry",
      title: "J’écris la retenue",
      sentence: `Recopie la retenue au rang des ${placeValueName(finalPlace.exponent, 2)}.`,
      detail: "La retenue finale devient un chiffre de la somme.",
      expected: { result: integerValue(carry) },
      resultLayoutIndices: addition.finalCarryDigits.map((_, index) => index)
    });
  }

  tasks.push({
    id: "verify",
    kind: "verify",
    title: "Je vérifie",
    sentence: "Complète la relation.",
    detail: "premier terme + second terme = somme",
    expected: { sum: addition.resultCells.join("") }
  }, {
    id: "finish",
    kind: "finish",
    title: "Addition réussie",
    sentence: `${addition.displayTerms.join(" + ")} = ${addition.resultDisplay}.`,
    detail: "Tous les chiffres et toutes les retenues sont bien placés.",
    expected: null
  });

  return tasks;
}

export function trainingFields(task) {
  if (task.kind === "placement") return ["term0", "term1"];
  if (task.kind === "column") {
    return ["total", "result", "carry"];
  }
  if (task.kind === "final-carry") return ["result"];
  if (task.kind === "verify") return ["sum"];
  return [];
}

export function trainingErrors(task, answer) {
  if (task.kind === "placement") {
    return trainingFields(task).filter((field) => {
      const expected = task.expected[field];
      const actual = Array.isArray(answer?.[field]) ? answer[field] : [];
      return expected.some((digit, index) => String(actual[index] ?? "") !== digit);
    });
  }
  return trainingFields(task).filter((field) => {
    if (field === "total" && String(answer?.total ?? "").trim() === "") return false;
    if (field === "carry" && task.expected.carry === "") {
      return String(answer?.carry ?? "").trim() !== "";
    }
    if (field === "sum") {
      return String(answer?.sum ?? "").replace(/[.,]/g, "") !== task.expected.sum;
    }
    return integerValue(answer?.[field]) !== task.expected[field];
  });
}

export function firstTrainingError(task, answer) {
  return trainingErrors(task, answer)[0] || null;
}

export function checkTrainingAnswer(task, answer) {
  return trainingErrors(task, answer).length === 0;
}

export function hintForTask(addition, task, field, level = 0) {
  const strong = level > 0;
  if (task.kind === "placement") {
    const termIndex = field === "term1" ? 1 : 0;
    const label = termIndex === 0 ? "premier terme" : "second terme";
    const value = addition.displayTerms[termIndex];
    return strong
      ? `Pour le ${label}, place d’abord le chiffre des unités de ${value} dans la colonne u, puis recopie les autres chiffres autour.`
      : `Dans le ${label}, repère le chiffre des unités : il se place dans la colonne u.`;
  }
  if (task.kind === "column") {
    const operation = addition.operations[task.opIndex];
    const parts = calculationParts(operation);
    const rank = placeValueName(operation.exponent, 2);
    if (field === "total") {
      return strong
        ? `${parts.join(" + ")} = ${operation.total}. Tu obtiens ${operation.total} ${placeValueName(operation.exponent, operation.total)}.`
        : `Additionne les ${rank}, sans oublier la retenue éventuelle.`;
    }
    if (field === "result") {
      return strong
        ? operation.carryOut > 0
          ? `${operation.total} ${placeValueName(operation.exponent, operation.total)} = ${operation.carryOut} ${placeValueName(operation.exponent + 1, operation.carryOut)} et ${operation.resultDigit} ${placeValueName(operation.exponent, operation.resultDigit)}. Écris ${operation.resultDigit} au rang des ${rank}.`
          : `Tu obtiens ${operation.total} ${placeValueName(operation.exponent, operation.total)} : écris ${operation.resultDigit} au rang des ${rank}.`
        : `Après ton calcul, quel chiffre dois-tu écrire au rang des ${rank} ?`;
    }
    if (operation.carryOut === 0) {
      return strong
        ? "Il n’y a rien à retenir : laisse la case vide."
        : "Le total est inférieur à 10 : aucune unité du rang suivant n’est créée.";
    }
    const nextRank = placeValueName(operation.exponent + 1, operation.carryOut);
    const nextRankPlural = placeValueName(operation.exponent + 1, 2);
    return strong
      ? `${operation.total} ${placeValueName(operation.exponent, operation.total)} = ${operation.carryOut} ${nextRank} et ${operation.resultDigit} ${placeValueName(operation.exponent, operation.resultDigit)}.`
      : `Peux-tu échanger 10 ${rank} contre 1 ${placeValueName(operation.exponent + 1, 1)} ? Combien de ${nextRankPlural} retiens-tu ?`;
  }
  if (task.kind === "final-carry") {
    const carry = task.expected.result;
    return strong
      ? `Écris ${carry} dans la première case de la somme.`
      : "Regarde la dernière retenue violette : elle n’a plus de colonne à rejoindre.";
  }
  if (task.kind === "verify") {
    return strong
      ? `La somme est ${addition.resultDisplay}.`
      : "Relis les chiffres orange de gauche à droite.";
  }
  return "";
}
