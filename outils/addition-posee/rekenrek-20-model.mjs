export const REKENREK_ROW_SIZE = 10;
export const REKENREK_ROW_COUNT = 2;
export const REKENREK_CAPACITY = REKENREK_ROW_SIZE * REKENREK_ROW_COUNT;

function integerBetween(value, minimum, maximum, label) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} doit être un entier compris entre ${minimum} et ${maximum}.`);
  }
  return value;
}

export function splitRekenrekValue(value) {
  const safeValue = integerBetween(value, 0, REKENREK_CAPACITY, "Le nombre de billes");
  return [
    Math.min(REKENREK_ROW_SIZE, safeValue),
    Math.max(0, safeValue - REKENREK_ROW_SIZE)
  ];
}

export function rekenrekValue(rows) {
  if (!Array.isArray(rows) || rows.length !== REKENREK_ROW_COUNT) {
    throw new TypeError("Le Rekenrek 20 utilise exactement deux rangées.");
  }
  return rows.reduce((sum, count, index) => (
    sum + integerBetween(count, 0, REKENREK_ROW_SIZE, `La rangée ${index + 1}`)
  ), 0);
}

export function moveRekenrekBead(rows, rowIndex, beadIndex) {
  integerBetween(rowIndex, 0, REKENREK_ROW_COUNT - 1, "Le numéro de rangée");
  integerBetween(beadIndex, 0, REKENREK_ROW_SIZE - 1, "Le numéro de bille");
  rekenrekValue(rows);
  const nextRows = [...rows];
  nextRows[rowIndex] = beadIndex < nextRows[rowIndex] ? beadIndex : beadIndex + 1;
  return nextRows;
}

export function makeRekenrekCalculation(operation) {
  if (!operation || !Array.isArray(operation.addendDigits) || operation.addendDigits.length < 2) {
    throw new TypeError("Une colonne d’addition est nécessaire pour préparer le Rekenrek.");
  }
  const addendDigits = operation.addendDigits.map((digit, index) => (
    integerBetween(digit, 0, 9, `Le chiffre ${index + 1}`)
  ));
  const carry = integerBetween(operation.carryIn ?? 0, 0, 9, "La retenue");
  const parts = [...addendDigits, ...(carry > 0 ? [carry] : [])];
  const total = parts.reduce((sum, value) => sum + value, 0);
  if (total > REKENREK_CAPACITY) {
    throw new RangeError("Ce calcul dépasse la capacité du Rekenrek 20.");
  }
  return {
    parts,
    start: addendDigits[0],
    additions: [...addendDigits.slice(1), ...(carry > 0 ? [carry] : [])],
    carry,
    total,
    rows: splitRekenrekValue(addendDigits[0])
  };
}
