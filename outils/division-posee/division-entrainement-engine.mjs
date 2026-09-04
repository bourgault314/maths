import { placeValueName } from "./division-engine.mjs";

function plural(value, singular, pluralForm = `${singular}s`) {
  return Number(value) === 1 ? singular : pluralForm;
}

function integerValue(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

export function trainingBounds(division) {
  const integerQuotient = Math.floor(division.dividend / division.divisor);
  if (integerQuotient === 0) {
    return {
      lower: 0,
      upper: division.divisor,
      lowerQuotient: 0,
      upperQuotient: 1,
      digitCount: 1
    };
  }
  const digitCount = String(integerQuotient).length;
  const lowerQuotient = 10 ** (digitCount - 1);
  const upperQuotient = 10 ** digitCount;
  return {
    lower: division.divisor * lowerQuotient,
    upper: division.divisor * upperQuotient,
    lowerQuotient,
    upperQuotient,
    digitCount
  };
}

export function makeTrainingTasks(division) {
  if (division.mode !== "integer") throw new RangeError("L’entraînement porte sur la division euclidienne.");
  const bounds = trainingBounds(division);
  const tasks = [{
    id: "anticipation",
    kind: "anticipation",
    title: "J’anticipe",
    sentence: "Complète l’encadrement, puis le nombre de chiffres du quotient.",
    expected: {
      lower: bounds.lower,
      upper: bounds.upper,
      digitCount: bounds.digitCount
    },
    bounds
  }];

  division.operations.forEach((operation, opIndex) => {
    const place = placeValueName(division, operation.endColumn, operation.partial);
    tasks.push({
      id: `stage-${opIndex}`,
      kind: "stage",
      title: "Je pose",
      sentence: `Dans ${operation.partial} ${place}, combien de fois ${division.divisor} ?`,
      detail: "Complète le quotient, le produit, puis le reste.",
      expected: {
        quotient: operation.quotientDigit,
        product: operation.product,
        remainder: operation.remainder
      },
      opIndex
    });
  });

  tasks.push({
    id: "verify",
    kind: "verify",
    title: "Je vérifie",
    sentence: "Complète la relation.",
    detail: "Dividende = quotient × diviseur + reste",
    expected: { quotient: Number(division.quotient), remainder: division.remainder }
  }, {
    id: "finish",
    kind: "finish",
    title: "Division réussie",
    sentence: `${division.dividend} = ${division.quotient} × ${division.divisor} + ${division.remainder}`,
    detail: `${division.dividend} ÷ ${division.divisor} a pour quotient ${division.quotient} et pour reste ${division.remainder}.`,
    expected: null
  });

  return tasks;
}

export function trainingErrors(task, answer) {
  if (task.kind === "finish") return [];
  const fields = task.kind === "anticipation"
    ? ["lower", "upper", "digitCount"]
    : task.kind === "stage"
      ? ["quotient", "product", "remainder"]
      : ["quotient", "remainder"];
  return fields.filter((field) => integerValue(answer?.[field]) !== task.expected[field]);
}

export function firstTrainingError(task, answer) {
  return trainingErrors(task, answer)[0] || null;
}

export function checkTrainingAnswer(task, answer) {
  return trainingErrors(task, answer).length === 0;
}

export function hintForTask(division, task, field, level = 0) {
  const strong = level > 0;
  if (task.kind === "anticipation" && ["lower", "upper"].includes(field)) {
    return strong
      ? `${division.divisor} × ${task.bounds.lowerQuotient} = ${task.bounds.lower} et ${division.divisor} × ${task.bounds.upperQuotient} = ${task.bounds.upper}.`
      : `Cherche deux produits de ${division.divisor} par 10, 100, 1 000… qui encadrent ${division.dividend}.`;
  }
  if (task.kind === "anticipation" && field === "digitCount") {
    return strong
      ? `${task.bounds.lowerQuotient} ≤ ${division.dividend} ÷ ${division.divisor} < ${task.bounds.upperQuotient} : le quotient possède ${task.bounds.digitCount} ${plural(task.bounds.digitCount, "chiffre")}.`
      : `Transforme l’encadrement : entre quelles puissances de 10 se trouve ${division.dividend} ÷ ${division.divisor} ?`;
  }
  if (task.kind === "stage") {
    const operation = division.operations[task.opIndex];
    if (field === "quotient") {
      return strong
        ? `${operation.quotientDigit} × ${division.divisor} = ${operation.product}, mais ${operation.quotientDigit + 1} × ${division.divisor} = ${(operation.quotientDigit + 1) * division.divisor} est trop grand.`
        : `Dans la table de ${division.divisor}, cherche le plus grand produit qui ne dépasse pas ${operation.partial}.`;
    }
    if (field === "product") {
      return strong
        ? `${operation.quotientDigit} × ${division.divisor} = ${operation.product}.`
        : `Multiplie le chiffre du quotient par ${division.divisor}.`;
    }
    return strong
      ? `${operation.partial} − ${operation.product} = ${operation.remainder}.`
      : `À partir de ${operation.product}, combien faut-il ajouter pour atteindre ${operation.partial} ?`;
  }
  if (task.kind === "verify") {
    return strong
      ? `Le quotient est ${division.quotient} et le reste est ${division.remainder}.`
      : "Relis la case orange du quotient et le dernier reste violet.";
  }
  return "";
}

export function taskRevealsTable(task, field) {
  return task.kind === "stage" && ["quotient", "product"].includes(field);
}
