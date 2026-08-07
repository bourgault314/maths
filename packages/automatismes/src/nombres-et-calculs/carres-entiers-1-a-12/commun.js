// Fondations locales de NC-02 — carrés des entiers de 0 à 12.
//
// Ce module ne contient aucune banque de questions. Il centralise seulement
// les invariants mathématiques, le classement DNB et la validation des
// paramètres partagés par les six générateurs écrits pour maths&go.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_VALEUR_EXACTE,
  TYPE_REPONSE_ENTIER_NATUREL,
} from "../../../../contrats/src/question-v2.js?v=17";

export const NOTION_CARRES_ENTIERS = "carres-entiers-1-a-12";
export const CIBLE_CARRES_ENTIERS = "dnb-2026-08";
export const BASES_CARRES_ENTIERS = Object.freeze(
  Array.from({ length: 13 }, (_, index) => index),
);
export const VALEURS_CARRES_ENTIERS = Object.freeze(
  BASES_CARRES_ENTIERS.map((base) => base * base),
);

const ENSEMBLE_VALEURS_CARRES = new Set(VALEURS_CARRES_ENTIERS);

export function calculerCarre(base) {
  if (!BASES_CARRES_ENTIERS.includes(base)) {
    throw new RangeError("calculerCarre : entier de 0 à 12 requis");
  }
  return base * base;
}

export function estValeurCarreeDe0A12(valeur) {
  return Number.isSafeInteger(valeur) && ENSEMBLE_VALEURS_CARRES.has(valeur);
}

export function retrouverBaseCarree(valeur) {
  const index = VALEURS_CARRES_ENTIERS.indexOf(valeur);
  return index === -1 ? null : BASES_CARRES_ENTIERS[index];
}

export function exigerAleatoireCarres(aleatoire, nom) {
  if (
    typeof aleatoire !== "object" ||
    aleatoire === null ||
    typeof aleatoire.entier !== "function" ||
    typeof aleatoire.choix !== "function" ||
    typeof aleatoire.melange !== "function"
  ) {
    throw new TypeError(`${nom} : générateur aléatoire seedé requis`);
  }
}

/**
 * Valide un objet de paramètres JSON pur et ses seules clés autorisées.
 * Chaque règle reçoit la valeur et doit retourner vrai si elle est admise.
 */
export function exigerParametresCarres(parametres, regles, nom) {
  if (
    typeof parametres !== "object" ||
    parametres === null ||
    Array.isArray(parametres) ||
    Object.getPrototypeOf(parametres) !== Object.prototype ||
    !estDonneePure(parametres)
  ) {
    throw new TypeError(`${nom} : paramètres sous forme d'objet simple requis`);
  }
  for (const cle of Reflect.ownKeys(parametres)) {
    if (typeof cle !== "string" || !Object.hasOwn(regles, cle)) {
      throw new TypeError(`${nom} : paramètre inconnu « ${String(cle)} »`);
    }
    if (!regles[cle](parametres[cle])) {
      throw new RangeError(`${nom} : valeur invalide pour « ${cle} »`);
    }
  }
}

export function valeurParametreOuTirage(
  aleatoire,
  parametres,
  cle,
  valeurs,
) {
  return Object.hasOwn(parametres, cle)
    ? parametres[cle]
    : aleatoire.choix(valeurs);
}

export function blocPuissance(id, base) {
  return { id, type: "puissance", base, exposant: 2 };
}

export function classementCarres(famille, complements = []) {
  return {
    domaine: "nombres-et-calculs",
    notion: NOTION_CARRES_ENTIERS,
    famille,
    cible: CIBLE_CARRES_ENTIERS,
    complements: [...complements],
  };
}

export function reponseEntier(attendu, minimum = 0, maximum = 200) {
  if (
    !Number.isSafeInteger(attendu) ||
    !Number.isSafeInteger(minimum) ||
    !Number.isSafeInteger(maximum) ||
    minimum < 0 ||
    attendu < minimum ||
    attendu > maximum
  ) {
    throw new RangeError("reponseEntier : réponse entière hors des bornes");
  }
  return {
    type: TYPE_REPONSE_ENTIER_NATUREL,
    comparaison: COMPARAISON_VALEUR_EXACTE,
    attendu,
    minimum,
    maximum,
  };
}

export function creerGabaritCarres({ id, version, titre }) {
  return Object.freeze({
    schema: SCHEMA_GABARIT_QUESTION,
    id,
    version,
    titre,
    generateur: Object.freeze({ nom: id, version }),
    parametres: Object.freeze({}),
  });
}
