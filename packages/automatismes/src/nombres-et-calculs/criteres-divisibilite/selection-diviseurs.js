// NC-01/F2 — sélectionner tous les diviseurs proposés.
//
// Contenu et formulations : fiche pédagogique NC-01 et document
// contenu-nc-01-cours-et-f2.md, validés par Gwenaël le 19 juillet 2026.
// Génération écrite à neuf pour maths&go : aucun énoncé, paramètre, nombre,
// distracteur ou algorithme n'est repris de l'ancienne banque.

import { SCHEMA_GABARIT_QUESTION } from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_ENSEMBLE_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "../../../../contrats/src/question-v2.js?v=10";

export const NOM_GENERATEUR_SELECTION_DIVISEURS =
  "nombres-et-calculs.criteres-divisibilite.selection-diviseurs";
export const VERSION_GENERATEUR_SELECTION_DIVISEURS = 1;

const DIVISEURS_PROPOSES = Object.freeze([2, 3, 5, 9, 10]);

const CLASSES_UNITES = Object.freeze([
  Object.freeze([1, 3, 7, 9]),
  Object.freeze([2, 4, 6, 8]),
  Object.freeze([5]),
  Object.freeze([0]),
]);

const CLASSES_SOMME = Object.freeze([
  "hors-multiple-3",
  "multiple-3-hors-9",
  "multiple-9",
]);

const CHOIX_REPONSE = Object.freeze([
  Object.freeze({ id: "2", libelle: "2" }),
  Object.freeze({ id: "3", libelle: "3" }),
  Object.freeze({ id: "5", libelle: "5" }),
  Object.freeze({ id: "9", libelle: "9" }),
  Object.freeze({ id: "10", libelle: "10" }),
  Object.freeze({ id: "aucun", libelle: "Aucun", exclusif: true }),
]);

export const GABARIT_SELECTION_DIVISEURS = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_SELECTION_DIVISEURS,
  version: 1,
  titre: "Critères de divisibilité — tous les diviseurs proposés",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_SELECTION_DIVISEURS,
    version: VERSION_GENERATEUR_SELECTION_DIVISEURS,
  }),
  parametres: Object.freeze({}),
});

function exigerContexte(aleatoire, parametres) {
  if (
    typeof aleatoire !== "object" ||
    aleatoire === null ||
    typeof aleatoire.entier !== "function" ||
    typeof aleatoire.choix !== "function"
  ) {
    throw new TypeError(
      "selection-diviseurs : générateur aléatoire seedé requis",
    );
  }
  if (
    typeof parametres !== "object" ||
    parametres === null ||
    Array.isArray(parametres) ||
    Object.keys(parametres).length !== 0
  ) {
    throw new TypeError(
      "selection-diviseurs : aucun paramètre de contenu n'est autorisé en version 1",
    );
  }
}

function chiffresDe(nombre) {
  return String(nombre).split("").map(Number);
}

export function calculerSommeChiffres(nombre) {
  if (!Number.isSafeInteger(nombre) || nombre < 10) {
    throw new RangeError(
      "calculerSommeChiffres : entier positif d'au moins deux chiffres requis",
    );
  }
  return chiffresDe(nombre).reduce((somme, chiffre) => somme + chiffre, 0);
}

export function calculerDiviseursProposes(nombre) {
  if (!Number.isSafeInteger(nombre) || nombre < 10) {
    throw new RangeError(
      "calculerDiviseursProposes : entier positif d'au moins deux chiffres requis",
    );
  }
  const diviseurs = DIVISEURS_PROPOSES.filter(
    (diviseur) => nombre % diviseur === 0,
  ).map(String);
  return diviseurs.length === 0 ? ["aucun"] : diviseurs;
}

function sommeCorrespond(classe, somme) {
  if (classe === "multiple-9") return somme % 9 === 0;
  if (classe === "multiple-3-hors-9") {
    return somme % 3 === 0 && somme % 9 !== 0;
  }
  return somme % 3 !== 0;
}

/**
 * Construit un nombre de 2 à 4 chiffres dans l'une des douze combinaisons
 * possibles : quatre classes d'unités × trois classes de somme des chiffres.
 * Le premier chiffre est choisi parmi toutes les valeurs qui réalisent la
 * classe demandée ; aucun rejet aléatoire ni liste de nombres n'est utilisé.
 */
function tirerNombre(aleatoire) {
  const chiffresUnites = aleatoire.choix(CLASSES_UNITES);
  const classeSomme = aleatoire.choix(CLASSES_SOMME);
  const longueur = aleatoire.entier(2, 4);
  const unite = aleatoire.choix(chiffresUnites);
  const intermediaires = Array.from(
    { length: longueur - 2 },
    () => aleatoire.entier(0, 9),
  );
  const sommeSansPremier =
    unite + intermediaires.reduce((somme, chiffre) => somme + chiffre, 0);
  const premiersPossibles = Array.from({ length: 9 }, (_, index) => index + 1)
    .filter((premier) => sommeCorrespond(classeSomme, sommeSansPremier + premier));
  const premier = aleatoire.choix(premiersPossibles);
  return Number([premier, ...intermediaires, unite].join(""));
}

function phraseDivisibilite(nombre, diviseur, divisible) {
  return divisible
    ? `${nombre} est divisible par ${diviseur}.`
    : `${nombre} n'est pas divisible par ${diviseur}.`;
}

function correctionUnites(nombre) {
  const unite = nombre % 10;
  return [
    `Le chiffre des unités est ${unite}.`,
    `Pour 2, il doit être 0, 2, 4, 6 ou 8 : ${phraseDivisibilite(nombre, 2, nombre % 2 === 0)}`,
    `Pour 5, il doit être 0 ou 5 : ${phraseDivisibilite(nombre, 5, nombre % 5 === 0)}`,
    `Pour 10, il doit être 0 : ${phraseDivisibilite(nombre, 10, nombre % 10 === 0)}`,
  ].join(" ");
}

function correctionSomme(nombre) {
  const chiffres = chiffresDe(nombre);
  const somme = chiffres.reduce((total, chiffre) => total + chiffre, 0);
  const calcul = chiffres.join(" + ");
  const verdict3 = somme % 3 === 0
    ? `${somme} est un multiple de 3 : ${nombre} est divisible par 3.`
    : `${somme} n'est pas un multiple de 3 : ${nombre} n'est pas divisible par 3.`;
  const verdict9 = somme % 9 === 0
    ? `${somme} est un multiple de 9 : ${nombre} est divisible par 9.`
    : `${somme} n'est pas un multiple de 9 : ${nombre} n'est pas divisible par 9.`;
  return `La somme de tous les chiffres est ${calcul} = ${somme}. ${verdict3} ${verdict9}`;
}

function enumerationFrancaise(elements) {
  if (elements.length === 1) return elements[0];
  return `${elements.slice(0, -1).join(", ")} et ${elements.at(-1)}`;
}

function correctionConclusion(nombre, attendus) {
  if (attendus[0] === "aucun") {
    return `Conclusion : aucun des nombres proposés ne divise ${nombre}.`;
  }
  if (attendus.length === 1) {
    return `Conclusion : parmi les nombres proposés, seul ${attendus[0]} divise ${nombre}.`;
  }
  if (attendus.length === DIVISEURS_PROPOSES.length) {
    return `Conclusion : les cinq nombres proposés divisent ${nombre}.`;
  }
  return `Conclusion : ${enumerationFrancaise(attendus)} divisent ${nombre}.`;
}

export function genererQuestionSelectionDiviseurs({ aleatoire, parametres }) {
  exigerContexte(aleatoire, parametres);
  const nombre = tirerNombre(aleatoire);
  const attendus = calculerDiviseursProposes(nombre);

  return {
    classement: {
      domaine: "nombres-et-calculs",
      notion: "criteres-divisibilite",
      famille: "selection-diviseurs",
      cible: "dnb-2026-09",
      complements: ["critere-divisibilite-10"],
    },
    enonce: [
      {
        id: "consigne",
        type: "texte",
        contenu:
          "Parmi 2, 3, 5, 9 et 10, sélectionne tous les nombres qui divisent",
      },
      { id: "nombre", type: "entier", valeur: nombre },
    ],
    reponse: {
      type: TYPE_REPONSE_SELECTION_MULTIPLE,
      comparaison: COMPARAISON_ENSEMBLE_EXACT,
      choix: CHOIX_REPONSE.map((choix) => ({ ...choix })),
      attendus,
    },
    aide: {
      blocs: [
        {
          id: "aide-unites",
          type: "texte",
          contenu: "Observe le chiffre des unités.",
        },
        {
          id: "aide-somme",
          type: "texte",
          contenu: "Additionne tous les chiffres.",
        },
        {
          id: "aide-multiples",
          type: "texte",
          contenu:
            "La somme obtenue est-elle un multiple de 3 ? Et de 9 ?",
        },
        {
          id: "aide-plusieurs",
          type: "texte",
          contenu: "Plusieurs réponses sont peut-être possibles.",
        },
      ],
      outils: [
        { type: "observer-unites", source: "nombre" },
        { type: "composer-somme-chiffres", source: "nombre" },
      ],
    },
    correction: [
      {
        id: "correction-unites",
        type: "texte",
        contenu: correctionUnites(nombre),
      },
      {
        id: "correction-somme",
        type: "texte",
        contenu: correctionSomme(nombre),
      },
      {
        id: "correction-conclusion",
        type: "texte",
        contenu: correctionConclusion(nombre, attendus),
      },
    ],
  };
}

export const GENERATEUR_SELECTION_DIVISEURS = Object.freeze({
  nom: NOM_GENERATEUR_SELECTION_DIVISEURS,
  version: VERSION_GENERATEUR_SELECTION_DIVISEURS,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionSelectionDiviseurs,
});
