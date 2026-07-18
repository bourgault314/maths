// Flux de graines séparés (cahier des charges V2 §8.2).
//
// LE PROBLÈME QUE CE FICHIER RÉSOUT
//
// Si tout le moteur puise dans une seule suite de tirages, l'ordre des
// appels devient une dépendance cachée. Ajouter une notion dans la
// catégorie « Fractions » décale alors toute la suite, et une série de
// « Pourcentages » partagée la semaine dernière ne redonne plus les mêmes
// questions. Le code de série devient un mensonge.
//
// LA SOLUTION
//
// Chaque usage tire dans SON flux, dérivé de la graine de série par un
// hachage nommé. Les flux sont indépendants : ce qui se passe dans l'un
// n'a aucun effet sur les autres.
//
// Mieux : la graine d'une question ne dépend PAS de son rang de tirage
// mais de son identité (gabarit + rang dans la série). Deux séries qui
// partagent un gabarit à la même position posent donc exactement la même
// question, ce qui rend les mises au point beaucoup plus simples.

import { graineDepuisTexte } from "./aleatoire.js";

/** Toute modification du dérivateur DOIT incrémenter ce numéro. */
export const VERSION_GRAINES = 1;

/**
 * Les flux, nommés une fois pour toutes. Ajouter un flux est sans danger ;
 * en renommer un change toutes les séries et impose une nouvelle version.
 */
export const FLUX = Object.freeze({
  NOTIONS: "notions",
  GABARITS: "gabarits",
  VALEURS: "valeurs",
  MELANGE: "melange",
});

const FLUX_CONNUS = new Set(Object.values(FLUX));

/**
 * Dérive une graine nommée à partir de la graine de série.
 *
 * @param {number} graineSerie — entier 32 bits
 * @param {string} flux — une valeur de FLUX
 * @param {string} [contexte] — précision (identifiant de gabarit, rang…)
 * @returns {number} entier 32 bits
 */
export function derive(graineSerie, flux, contexte = "") {
  if (!Number.isInteger(graineSerie) || graineSerie < 0 || graineSerie > 0xffffffff) {
    throw new RangeError(`derive : graine 32 bits attendue, reçu ${graineSerie}`);
  }
  if (!FLUX_CONNUS.has(flux)) {
    throw new RangeError(`derive : flux inconnu « ${flux} »`);
  }
  // Le séparateur « | » ne peut pas apparaître dans un identifiant
  // (minuscules, chiffres, tirets) : deux contextes différents ne peuvent
  // donc pas produire la même chaîne par accident.
  return graineDepuisTexte(`mathsgo/${VERSION_GRAINES}|${graineSerie}|${flux}|${contexte}`);
}

/**
 * La graine de tirage des VALEURS d'une question.
 *
 * Elle dépend du gabarit et du rang de la question dans la série — jamais
 * de l'ordre dans lequel le moteur a travaillé.
 *
 * @param {number} graineSerie @param {string} gabaritId @param {number} rang
 */
export function graineDeQuestion(graineSerie, gabaritId, rang) {
  if (typeof gabaritId !== "string" || gabaritId.length === 0) {
    throw new RangeError("graineDeQuestion : identifiant de gabarit requis");
  }
  if (!Number.isInteger(rang) || rang < 0) {
    throw new RangeError(`graineDeQuestion : rang entier ≥ 0 attendu, reçu ${rang}`);
  }
  return derive(graineSerie, FLUX.VALEURS, `${gabaritId}#${rang}`);
}

/**
 * La graine d'un essai de rattrapage, quand un tirage a été refusé (§8.6).
 * Chaque essai a sa propre graine : la boucle reste déterministe.
 *
 * @param {number} graineQuestion @param {number} essai
 */
export function graineDEssai(graineQuestion, essai) {
  if (!Number.isInteger(essai) || essai < 0) {
    throw new RangeError(`graineDEssai : essai entier ≥ 0 attendu, reçu ${essai}`);
  }
  if (essai === 0) return graineQuestion;
  return graineDepuisTexte(`essai|${graineQuestion}|${essai}`);
}
