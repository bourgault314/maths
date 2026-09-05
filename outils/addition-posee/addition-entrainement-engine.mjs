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
      sentence: addition.decimalPlaces > 0
        ? "Place les deux termes dans la grille en alignant les virgules."
        : "Place les deux termes en mettant les unités sous les unités.",
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
    detail: operation.carryOut > 0
      ? "Complète le calcul, puis écris le chiffre de la somme et la retenue."
      : "Complète le calcul, puis écris le chiffre de la somme.",
    memo: operation.carryOut > 0
      ? `10 ${placeValueName(operation.exponent, 10)} = 1 ${placeValueName(operation.exponent + 1, 1)}`
      : "",
    opIndex: operation.processingIndex,
    expected: {
      total: operation.total,
      result: operation.resultDigit,
      ...(operation.carryOut > 0 ? { carry: operation.carryOut } : {})
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
    return Object.hasOwn(task.expected, "carry")
      ? ["total", "result", "carry"]
      : ["total", "result"];
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
    if (addition.decimalPlaces > 0) {
      const needsPadding = addition.terms[termIndex].fraction.length < addition.decimalPlaces;
      return strong
        ? `Pour le ${label}, recopie ${value} autour de la virgule déjà placée.`
        : needsPadding
          ? `Dans le ${label}, aligne la virgule puis complète les rangs décimaux manquants avec 0.`
          : `Dans le ${label}, place le chiffre des unités juste à gauche de la virgule.`;
    }
    return strong
      ? `Pour le ${label}, recopie ${value} en terminant dans la colonne u.`
      : `Dans le ${label}, commence par placer le chiffre des unités dans la colonne u.`;
  }
  if (task.kind === "column") {
    const operation = addition.operations[task.opIndex];
    const parts = calculationParts(operation);
    const rank = placeValueName(operation.exponent, 2);
    if (field === "total") {
      return strong
        ? `${parts.join(" + ")} = ${operation.total}.`
        : `Additionne tous les chiffres de la colonne des ${rank}, sans oublier la retenue.`;
    }
    if (field === "result") {
      return strong
        ? `Dans ${operation.total}, le chiffre à écrire au rang des ${rank} est ${operation.resultDigit}.`
        : `Quel est le chiffre des unités dans ${operation.total} ?`;
    }
    const nextRank = placeValueName(operation.exponent + 1, operation.carryOut);
    const nextRankPlural = placeValueName(operation.exponent + 1, 2);
    return strong
      ? `Dans ${operation.total}, je retiens ${operation.carryOut} ${nextRank}.`
      : `Combien de ${nextRankPlural} peux-tu échanger dans ${operation.total} ${rank} ?`;
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
