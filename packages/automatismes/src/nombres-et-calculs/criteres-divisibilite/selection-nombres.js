// NC-01/F3 — sélectionner plusieurs nombres divisibles par un critère donné.
//
// Contenu validé dans la fiche pédagogique NC-01 le 19 juillet 2026.
// La grille contient toujours quatre nombres distincts. Zéro à quatre nombres
// sont corrects, sans que ce nombre soit révélé à l'élève ; « Aucun » permet
// de répondre explicitement lorsque les quatre tests sont négatifs.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_ENSEMBLE_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "../../../../contrats/src/question-v2.js?v=26";
import {
  IDENTITES_AUTOMATISMES,
  creerClassementAutomatisme,
} from "../../identifiants.js?v=26";
import {
  DIVISEURS_CRITERES_NC01,
  construireCorrectionCritere,
  formulationCritereDivisibilite,
  tirerNombreSelonDivisibilite,
} from "./critere-precis.js?v=26";

export const NOM_GENERATEUR_SELECTION_NOMBRES =
  "nombres-et-calculs.criteres-divisibilite.selection-nombres";
export const VERSION_GENERATEUR_SELECTION_NOMBRES = 5;

const PARAMETRES_AUTORISES = new Set(["diviseur"]);

export const GABARIT_SELECTION_NOMBRES = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_SELECTION_NOMBRES,
  version: 5,
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

function estPiegeTerminaison(nombre, diviseur) {
  return [3, 9].includes(diviseur)
    && nombre % 10 === diviseur
    && nombre % diviseur !== 0;
}

function tirerPiegeTerminaison(aleatoire, diviseur) {
  const longueur = aleatoire.entier(2, 4);
  const minimumPrefixe = 10 ** (longueur - 2);
  const maximumPrefixe = 10 ** (longueur - 1) - 1;
  for (let tentative = 0; tentative < 100; tentative++) {
    const prefixe = aleatoire.entier(minimumPrefixe, maximumPrefixe);
    if (prefixe % diviseur !== 0) return prefixe * 10 + diviseur;
  }
  throw new Error(
    "selection-nombres : impossible de produire un piège de terminaison",
  );
}

function tirerNombresDistincts(aleatoire, diviseur, profils, indexPiege) {
  const dejaTires = new Set();
  return profils.map((divisible, index) => {
    for (let tentative = 0; tentative < 100; tentative++) {
      const nombre = index === indexPiege
        ? tirerPiegeTerminaison(aleatoire, diviseur)
        : tirerNombreSelonDivisibilite(aleatoire, diviseur, divisible);
      if (!divisible && index !== indexPiege && estPiegeTerminaison(nombre, diviseur)) {
        continue;
      }
      if (!dejaTires.has(nombre)) {
        dejaTires.add(nombre);
        return { nombre, divisible };
      }
    }
    throw new Error(
      "selection-nombres : impossible de produire quatre nombres distincts",
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
          id: "aide-critere",
          type: "texte",
          contenu: formulationCritereDivisibilite(diviseur),
        },
        {
          id: "aide-un-par-un",
          type: "texte",
          contenu: "Applique ce critère à un nombre après l'autre.",
        },
        {
          id: "aide-plusieurs",
          type: "texte",
          contenu: "Vérifie les quatre nombres avant de conclure.",
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
        id: "aide-critere",
        type: "texte",
        contenu: formulationCritereDivisibilite(diviseur),
      },
      {
        id: "aide-multiples",
        type: "texte",
        contenu: "Compare chaque somme à ce critère.",
      },
      {
        id: "aide-plusieurs",
        type: "texte",
      contenu: "Vérifie les quatre nombres avant de conclure.",
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
    ...Array.from({ length: 4 - nombreDeBonnesReponses }, () => false),
  ];
  const premierIndexFaux = profils.indexOf(false);
  const indexPiege = [3, 9].includes(diviseur)
    && premierIndexFaux !== -1
    && aleatoire.entier(1, 4) === 1
    ? premierIndexFaux
    : -1;
  const nombres = aleatoire.melange(
    tirerNombresDistincts(aleatoire, diviseur, profils, indexPiege),
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
    classement: creerClassementAutomatisme(
      IDENTITES_AUTOMATISMES.CRITERES_DIVISIBILITE,
      "selection-nombres",
      diviseur === 10 ? ["critere-divisibilite-10"] : [],
    ),
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
