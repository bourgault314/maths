import {
  anticipationPrompt,
  makeAnticipationChecks,
  placeValueName,
  quotientDigitPrompt
} from "./division-engine.mjs";

function integerValue(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : null;
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

export function makeTrainingTasks(division) {
  if (division.mode !== "integer") throw new RangeError("L’entraînement porte sur la division euclidienne.");
  const checks = makeAnticipationChecks(division);
  const digitCount = String(Math.floor(division.dividend / division.divisor)).length;
  const tasks = checks.map((check, index) => {
    const next = checks[index + 1];
    const isLast = index === checks.length - 1;
    const prompt = anticipationPrompt(division, check);
    const nextDigit = next ? next.partial - (check.partial * 10) : null;
    return {
      id: `anticipation-${index}`,
      kind: "anticipation",
      title: "J’anticipe",
      sentence: prompt.sentence,
      detail: prompt.detail,
      expected: { decision: check.canShare ? "yes" : "no" },
      check,
      successTitle: isLast ? "J’en déduis" : "Je poursuis",
      successSentence: check.canShare
        ? `Oui. Le quotient commence au rang des ${check.rankPlace} : il aura ${digitCount} chiffre${digitCount > 1 ? "s" : ""}.`
        : next
          ? `Non. J’échange ${check.partial} ${check.placeForQuantity} contre ${check.partial * 10} ${next.rankPlace}. Avec ${nextDigit} ${placeValueName(division, next.endColumn, nextDigit)}, j’obtiens ${next.partial} ${next.placeForQuantity}.`
          : "Non. Le quotient entier est 0."
    };
  });

  division.operations.forEach((operation, opIndex) => {
    const prompt = quotientDigitPrompt(division, operation);
    tasks.push({
      id: `stage-${opIndex}`,
      kind: "stage",
      title: "Je pose",
      sentence: prompt.sentence,
      detail: prompt.detail,
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
    ? ["decision"]
    : task.kind === "stage"
      ? ["quotient", "product", "remainder"]
      : ["quotient", "remainder"];
  return fields.filter((field) => {
    if (field === "decision") return String(answer?.[field] || "") !== task.expected[field];
    return integerValue(answer?.[field]) !== task.expected[field];
  });
}

export function firstTrainingError(task, answer) {
  return trainingErrors(task, answer)[0] || null;
}

export function checkTrainingAnswer(task, answer) {
  return trainingErrors(task, answer).length === 0;
}

export function hintForTask(division, task, field, level = 0) {
  const strong = level > 0;
  if (task.kind === "anticipation" && field === "decision") {
    const { partial, placeForQuantity, placeSingular, canShare } = task.check;
    return strong
      ? canShare
        ? `${partial} est au moins égal à ${division.divisor} : chaque part peut recevoir 1 ${placeSingular}.`
        : `${partial} est plus petit que ${division.divisor} : chaque part ne peut pas recevoir 1 ${placeSingular}.`
      : `Compare ${partial} ${placeForQuantity} aux ${division.divisor} parts.`;
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
