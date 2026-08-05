// NC-01/F3 — sélectionner plusieurs nombres divisibles par un critère donné.
//
// Contenu validé dans la fiche pédagogique NC-01 le 19 juillet 2026.
// La grille contient toujours six nombres distincts. Zéro à quatre nombres
// sont corrects, sans que ce nombre soit révélé à l'élève ; « Aucun » permet
// de répondre explicitement lorsque les six tests sont négatifs.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_ENSEMBLE_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "../../../../contrats/src/question-v2.js?v=9";
import {
  DIVISEURS_CRITERES_NC01,
  construireCorrectionCritere,
  tirerNombreSelonDivisibilite,
} from "./critere-precis.js?v=9";

export const NOM_GENERATEUR_SELECTION_NOMBRES =
  "nombres-et-calculs.criteres-divisibilite.selection-nombres";
export const VERSION_GENERATEUR_SELECTION_NOMBRES = 2;

const PARAMETRES_AUTORISES = new Set(["diviseur"]);

export const GABARIT_SELECTION_NOMBRES = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_SELECTION_NOMBRES,
  version: 2,
  titre: "Critères de divisibilité — sélectionner plusieurs nombres",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_SELECTION_NOMBRES,
    version: VERSION_GENERATEUR_SELECTION_NOMBRES,
  }),
  parametres: Object.freeze({}),
});

function exigerAleatoire(aleatoire) {
  if (
    typeof aleatoire !== "object" ||
    aleatoire === null ||
    typeof aleatoire.entier !== "function" ||
    typeof aleatoire.choix !== "function" ||
    typeof aleatoire.melange !== "function"
  ) {
    throw new TypeError("selection-nombres : générateur aléatoire seedé requis");
  }
}

function exigerParametres(parametres) {
  if (
    typeof parametres !== "object" ||
    parametres === null ||
    Array.isArray(parametres) ||
    Object.getPrototypeOf(parametres) !== Object.prototype ||
    !estDonneePure(parametres)
  ) {
    throw new TypeError(
      "selection-nombres : paramètres sous forme d'objet simple requis",
    );
  }

  const inconnus = Reflect.ownKeys(parametres).filter(
    (cle) => typeof cle !== "string" || !PARAMETRES_AUTORISES.has(cle),
  );
  if (inconnus.length > 0) {
    throw new TypeError(
      `selection-nombres : paramètre inconnu « ${String(inconnus[0])} »`,
    );
  }
  if (
    Object.hasOwn(parametres, "diviseur") &&
    !DIVISEURS_CRITERES_NC01.includes(parametres.diviseur)
  ) {
    throw new RangeError(
      "selection-nombres : diviseur attendu parmi 2, 3, 5, 9 et 10",
    );
  }
}

function tirerNombresDistincts(aleatoire, diviseur, profils) {
  const dejaTires = new Set();
  return profils.map((divisible) => {
    for (let tentative = 0; tentative < 100; tentative++) {
      const nombre = tirerNombreSelonDivisibilite(
        aleatoire,
        diviseur,
        divisible,
      );
      if (!dejaTires.has(nombre)) {
        dejaTires.add(nombre);
        return { nombre, divisible };
      }
    }
    throw new Error(
      "selection-nombres : impossible de produire six nombres distincts",
    );
  });
}

function construireAide(diviseur) {
  if ([2, 5, 10].includes(diviseur)) {
    return {
      blocs: [
        {
          id: "aide-unites",
          type: "texte",
          contenu:
            "Pour chaque nombre, observe uniquement le chiffre des unités.",
        },
        {
          id: "aide-un-par-un",
          type: "texte",
          contenu:
            `Applique le critère de divisibilité par ${diviseur}, ` +
            "un nombre après l'autre.",
        },
        {
          id: "aide-plusieurs",
          type: "texte",
          contenu: "Vérifie les six nombres avant de conclure.",
        },
      ],
      outils: [],
    };
  }
  return {
    blocs: [
      {
        id: "aide-somme",
        type: "texte",
        contenu: "Pour chaque nombre, additionne tous ses chiffres.",
      },
      {
        id: "aide-multiples",
        type: "texte",
        contenu: `Compare chaque somme aux multiples de ${diviseur}.`,
      },
      {
        id: "aide-plusieurs",
        type: "texte",
      contenu: "Vérifie les six nombres avant de conclure.",
      },
    ],
    outils: [],
  };
}

export function genererQuestionSelectionNombres({ aleatoire, parametres }) {
  exigerAleatoire(aleatoire);
  exigerParametres(parametres);

  const diviseur = Object.hasOwn(parametres, "diviseur")
    ? parametres.diviseur
    : aleatoire.choix(DIVISEURS_CRITERES_NC01);
  const nombreDeBonnesReponses = aleatoire.choix([0, 1, 2, 3, 4]);
  const profils = [
    ...Array.from({ length: nombreDeBonnesReponses }, () => true),
    ...Array.from({ length: 6 - nombreDeBonnesReponses }, () => false),
  ];
  const nombres = aleatoire.melange(
    tirerNombresDistincts(aleatoire, diviseur, profils),
  );
  const choix = [
    ...nombres.map(({ nombre }) => ({
      id: `nombre-${nombre}`,
      libelle: String(nombre),
    })),
    { id: "aucun", libelle: "Aucun", exclusif: true },
  ];
  const nombresAttendus = nombres
    .filter(({ divisible }) => divisible)
    .map(({ nombre }) => `nombre-${nombre}`);
  const attendus = nombresAttendus.length === 0 ? ["aucun"] : nombresAttendus;

  return {
    classement: {
      domaine: "nombres-et-calculs",
      notion: "criteres-divisibilite",
      famille: "selection-nombres",
      cible: "dnb-2026-09",
      complements: diviseur === 10 ? ["critere-divisibilite-10"] : [],
    },
    enonce: [
      {
        id: "consigne",
        type: "texte",
        contenu: `Sélectionne tous les nombres divisibles par ${diviseur}.`,
      },
    ],
    reponse: {
      type: TYPE_REPONSE_SELECTION_MULTIPLE,
      comparaison: COMPARAISON_ENSEMBLE_EXACT,
      choix,
      attendus,
    },
    aide: construireAide(diviseur),
    correction: nombres.map(({ nombre }, index) => ({
      id: `correction-${index + 1}`,
      type: "texte",
      contenu: construireCorrectionCritere(nombre, diviseur),
    })),
  };
}

export const GENERATEUR_SELECTION_NOMBRES = Object.freeze({
  nom: NOM_GENERATEUR_SELECTION_NOMBRES,
  version: VERSION_GENERATEUR_SELECTION_NOMBRES,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionSelectionNombres,
});
