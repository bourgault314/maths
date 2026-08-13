// NC-01/F5 — trouver un chiffre manquant.
//
// Le générateur calcule toujours les dix remplacements possibles avant de
// choisir une formulation. Les formulations, les valeurs et l'algorithme sont
// écrits à neuf pour maths&go à partir de la fiche pédagogique NC-01 validée.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_ENSEMBLE_EXACT,
  COMPARAISON_VALEUR_EXACTE,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "../../../../contrats/src/question-v2.js?v=27";
import {
  IDENTITES_AUTOMATISMES,
  creerClassementAutomatisme,
} from "../../identifiants.js?v=27";
import { formulationCritereDivisibilite } from "./critere-precis.js?v=27";

export const NOM_GENERATEUR_CHIFFRE_MANQUANT =
  "nombres-et-calculs.criteres-divisibilite.chiffre-manquant";
export const VERSION_GENERATEUR_CHIFFRE_MANQUANT = 3;

export const GABARIT_CHIFFRE_MANQUANT = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_CHIFFRE_MANQUANT,
  version: 3,
  titre: "Critères de divisibilité — chiffre manquant",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_CHIFFRE_MANQUANT,
    version: VERSION_GENERATEUR_CHIFFRE_MANQUANT,
  }),
  parametres: Object.freeze({}),
});

const CHIFFRE_MANQUANT = "□";
const CRITERES = Object.freeze([2, 3, 5, 9, 10]);
const SOUS_FORMES = Object.freeze([
  "unique",
  "toutes-solutions",
  "plus-petit",
]);
const CHOIX_CHIFFRES = Object.freeze(
  Array.from({ length: 10 }, (_, chiffre) =>
    Object.freeze({ id: String(chiffre), libelle: String(chiffre) }),
  ),
);

function exigerMotif(motif) {
  if (typeof motif !== "string") {
    throw new TypeError("chiffre-manquant : motif texte requis");
  }
  const caracteres = [...motif];
  if (
    caracteres.length < 2 ||
    caracteres.length > 4 ||
    caracteres.filter((caractere) => caractere === CHIFFRE_MANQUANT).length !== 1 ||
    caracteres[0] === CHIFFRE_MANQUANT ||
    caracteres[0] === "0" ||
    caracteres.some(
      (caractere) =>
        caractere !== CHIFFRE_MANQUANT && !/^[0-9]$/.test(caractere),
    )
  ) {
    throw new RangeError(
      "chiffre-manquant : motif de 2 à 4 chiffres, sans zéro initial, avec un seul □ requis",
    );
  }
}

function exigerCritere(critere) {
  if (!CRITERES.includes(critere)) {
    throw new RangeError("chiffre-manquant : critère 2, 3, 5, 9 ou 10 requis");
  }
}

export function calculerSolutionsChiffreManquant(motif, critere) {
  exigerMotif(motif);
  exigerCritere(critere);
  const solutions = [];
  for (let chiffre = 0; chiffre <= 9; chiffre++) {
    const nombre = Number(motif.replace(CHIFFRE_MANQUANT, String(chiffre)));
    if (nombre % critere === 0) solutions.push(chiffre);
  }
  return solutions;
}

function formesCompatibles(critere) {
  if (critere === 3) return ["toutes-solutions", "plus-petit"];
  if (critere === 9 || critere === 10) return ["unique", "toutes-solutions"];
  return ["toutes-solutions"];
}

function criteresCompatibles(sousForme) {
  if (sousForme === "unique") return [9, 10];
  if (sousForme === "plus-petit") return [3];
  return CRITERES;
}

function exigerContexte(aleatoire, parametres) {
  if (
    typeof aleatoire !== "object" ||
    aleatoire === null ||
    typeof aleatoire.entier !== "function" ||
    typeof aleatoire.choix !== "function"
  ) {
    throw new TypeError("chiffre-manquant : générateur aléatoire seedé requis");
  }
  if (
    typeof parametres !== "object" ||
    parametres === null ||
    Array.isArray(parametres) ||
    Object.getPrototypeOf(parametres) !== Object.prototype ||
    !estDonneePure(parametres)
  ) {
    throw new TypeError("chiffre-manquant : paramètres sous forme d'objet requis");
  }
  const clesInconnues = Reflect.ownKeys(parametres).filter(
    (cle) => typeof cle !== "string" || !["sousForme", "critere"].includes(cle),
  );
  if (clesInconnues.length > 0) {
    throw new TypeError(
      `chiffre-manquant : paramètre inconnu « ${String(clesInconnues[0])} »`,
    );
  }
  if (
    parametres.sousForme !== undefined &&
    !SOUS_FORMES.includes(parametres.sousForme)
  ) {
    throw new TypeError(
      "chiffre-manquant : sousForme « unique », « toutes-solutions » ou « plus-petit » requise",
    );
  }
  if (parametres.critere !== undefined) exigerCritere(parametres.critere);
  if (
    parametres.sousForme !== undefined &&
    parametres.critere !== undefined &&
    !criteresCompatibles(parametres.sousForme).includes(parametres.critere)
  ) {
    throw new RangeError(
      `chiffre-manquant : la sous-forme « ${parametres.sousForme} » ` +
      `n'est pas compatible avec le critère par ${parametres.critere}`,
    );
  }
}

function choisirConfiguration(aleatoire, parametres) {
  if (parametres.sousForme !== undefined && parametres.critere !== undefined) {
    return {
      sousForme: parametres.sousForme,
      critere: parametres.critere,
    };
  }
  if (parametres.sousForme !== undefined) {
    return {
      sousForme: parametres.sousForme,
      critere: aleatoire.choix(criteresCompatibles(parametres.sousForme)),
    };
  }
  if (parametres.critere !== undefined) {
    return {
      sousForme: aleatoire.choix(formesCompatibles(parametres.critere)),
      critere: parametres.critere,
    };
  }
  const sousForme = aleatoire.choix(SOUS_FORMES);
  return {
    sousForme,
    critere: aleatoire.choix(criteresCompatibles(sousForme)),
  };
}

function motifDepuisNombre(nombre, position) {
  const chiffres = String(nombre).split("");
  chiffres[position] = CHIFFRE_MANQUANT;
  return chiffres.join("");
}

function trouverMotif(aleatoire, critere, sousForme) {
  const longueurs =
    critere === 10 && sousForme !== "unique" ? [3, 4] : [2, 3, 4];
  const longueur = aleatoire.choix(longueurs);
  const minimum = 10 ** (longueur - 1);
  const maximum = 10 ** longueur - 1;
  const total = maximum - minimum + 1;
  const depart = aleatoire.entier(minimum, maximum);
  const positions = Array.from({ length: longueur - 1 }, (_, index) => index + 1);
  const debutPosition = aleatoire.entier(0, positions.length - 1);

  for (let decalage = 0; decalage < total; decalage++) {
    const nombre = minimum + ((depart - minimum + decalage) % total);
    const chiffres = String(nombre);
    for (let index = 0; index < positions.length; index++) {
      const position = positions[(debutPosition + index) % positions.length];
      // Un même motif serait sinon rencontré dix fois, une fois par chiffre
      // provisoire placé sous le carré. Cette forme canonique évite ce biais.
      if (chiffres[position] !== "0") continue;
      const motif = motifDepuisNombre(nombre, position);
      const solutions = calculerSolutionsChiffreManquant(motif, critere);
      const convient =
        sousForme === "unique"
          ? solutions.length === 1
          : solutions.length >= 2;
      if (convient) return { motif, solutions };
    }
  }
  throw new Error(
    `chiffre-manquant : aucun motif pour ${sousForme} et le critère ${critere}`,
  );
}

function consignePour(sousForme, critere) {
  if (sousForme === "unique") {
    return (
      `Trouve le chiffre qui peut remplacer ${CHIFFRE_MANQUANT} pour que le nombre soit ` +
      `divisible par ${critere}.`
    );
  }
  if (sousForme === "plus-petit") {
    return (
      `Trouve le plus petit chiffre qui peut remplacer ${CHIFFRE_MANQUANT} pour que le nombre ` +
      `soit divisible par ${critere}.`
    );
  }
  return (
    `Sélectionne tous les chiffres qui peuvent remplacer ${CHIFFRE_MANQUANT} pour que le ` +
    `nombre soit divisible par ${critere}.`
  );
}

function reponsePour(sousForme, solutions) {
  if (sousForme === "toutes-solutions") {
    return {
      type: TYPE_REPONSE_SELECTION_MULTIPLE,
      comparaison: COMPARAISON_ENSEMBLE_EXACT,
      choix: CHOIX_CHIFFRES.map((choix) => ({ ...choix })),
      attendus: solutions.map(String),
    };
  }
  return {
    type: TYPE_REPONSE_ENTIER_NATUREL,
    comparaison: COMPARAISON_VALEUR_EXACTE,
    attendu: sousForme === "unique" ? solutions[0] : Math.min(...solutions),
    minimum: 0,
    maximum: 9,
  };
}

function aidePour(critere, sousForme) {
  const blocs = critere === 3 || critere === 9
    ? [
        {
          id: "observer-somme",
          type: "texte",
          contenu: "Additionne d'abord tous les chiffres déjà écrits.",
        },
        {
          id: "rappeler-critere",
          type: "texte",
          contenu: formulationCritereDivisibilite(critere),
        },
        {
          id: "tester-somme",
          type: "texte",
          contenu: "Cherche quels chiffres permettraient de respecter ce critère.",
        },
      ]
    : [
        {
          id: "observer-unites",
          type: "texte",
          contenu: "Observe uniquement le chiffre des unités.",
        },
        {
          id: "rappeler-critere",
          type: "texte",
          contenu: formulationCritereDivisibilite(critere),
        },
      ];

  if (sousForme === "toutes-solutions") {
    blocs.push({
      id: "verifier-tous",
      type: "texte",
      contenu: "Vérifie les chiffres de 0 à 9 : plusieurs réponses sont peut-être possibles.",
    });
  }
  if (sousForme === "plus-petit") {
    blocs.push({
      id: "partir-zero",
      type: "texte",
      contenu: "Teste les chiffres dans l'ordre en commençant par 0.",
    });
  }
  return { blocs, outils: [] };
}

function enumerationFrancaise(nombres) {
  const textes = nombres.map(String);
  if (textes.length === 1) return textes[0];
  return `${textes.slice(0, -1).join(", ")} et ${textes.at(-1)}`;
}

function correctionSomme(motif, critere, solutions) {
  const chiffresFixes = [...motif]
    .filter((caractere) => caractere !== CHIFFRE_MANQUANT)
    .map(Number);
  const sommeFixe = chiffresFixes.reduce((somme, chiffre) => somme + chiffre, 0);
  const calculs = solutions.map(
    (chiffre) => `${sommeFixe} + ${chiffre} = ${sommeFixe + chiffre}`,
  );
  return [
    {
      id: "somme-fixe",
      type: "texte",
      contenu:
        `La somme des chiffres déjà écrits est ${chiffresFixes.join(" + ")} = ${sommeFixe}.`,
    },
    {
      id: "sommes-valides",
      type: "texte",
      contenu:
        `Les sommes multiples de ${critere} sont obtenues avec : ${calculs.join(" ; ")}.`,
    },
  ];
}

function correctionUnites(motif, critere, solutions) {
  const unite = motif.at(-1);
  if (unite === CHIFFRE_MANQUANT) {
    return [
      {
        id: "unite-a-completer",
        type: "texte",
        contenu:
          `Le carré est à la place des unités. On applique donc directement le critère par ${critere}.`,
      },
    ];
  }
  return [
    {
      id: "unite-fixe",
      type: "texte",
      contenu:
        `Le chiffre des unités reste ${unite}, quel que soit le chiffre placé dans le carré. ` +
        `Tous les chiffres ${enumerationFrancaise(solutions)} conviennent donc.`,
    },
  ];
}

function correctionPour(motif, critere, sousForme, solutions) {
  const detail = critere === 3 || critere === 9
    ? correctionSomme(motif, critere, solutions)
    : correctionUnites(motif, critere, solutions);
  const conclusion = solutions.length === 1
    ? `Le seul chiffre possible est ${solutions[0]}.`
    : `Tous les chiffres possibles sont ${enumerationFrancaise(solutions)}.`;
  const blocs = [
    ...detail,
    { id: "toutes-solutions", type: "texte", contenu: conclusion },
  ];
  if (sousForme === "plus-petit") {
    blocs.push({
      id: "plus-petit",
      type: "texte",
      contenu: `Le plus petit de ces chiffres est ${Math.min(...solutions)}.`,
    });
  }
  return blocs;
}

export function genererQuestionChiffreManquant({ aleatoire, parametres }) {
  exigerContexte(aleatoire, parametres);
  const { sousForme, critere } = choisirConfiguration(aleatoire, parametres);
  const { motif, solutions } = trouverMotif(aleatoire, critere, sousForme);

  return {
    classement: creerClassementAutomatisme(
      IDENTITES_AUTOMATISMES.CRITERES_DIVISIBILITE,
      "chiffre-manquant",
      critere === 10 ? ["critere-divisibilite-10"] : [],
    ),
    enonce: [
      { id: "consigne", type: "texte", contenu: consignePour(sousForme, critere) },
      { id: "nombre-a-completer", type: "texte", contenu: motif },
    ],
    reponse: reponsePour(sousForme, solutions),
    aide: aidePour(critere, sousForme),
    correction: correctionPour(motif, critere, sousForme, solutions),
  };
}

export const GENERATEUR_CHIFFRE_MANQUANT = Object.freeze({
  nom: NOM_GENERATEUR_CHIFFRE_MANQUANT,
  version: VERSION_GENERATEUR_CHIFFRE_MANQUANT,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionChiffreManquant,
});
