// Recette seedée de la catégorie visible « Un nombre, plusieurs écritures ».
// Les six familles sont équilibrées aux jalons 5, 10, 15 et 20. La série
// standard de dix contient 100 %, au moins une valeur supérieure à 1 et les
// deux sens pourcentage ↔ décimal.

import {
  creerGenerateur,
  validerGraine,
} from "../../../../moteur-exercices/src/aleatoire.js?v=44";
import {
  DENOMINATEURS_REPERES_NC05,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  FAMILLE_UNITE_DEPASSEMENT,
  GABARIT_ECRITURES_MULTIPLES,
  PRESENTATION_ABSTRAITE_ECRITURES,
  PRESENTATION_VISUELLE_ECRITURES,
} from "./questions.js?v=44";

export const VERSION_PLAN_SERIE_ECRITURES_MULTIPLES = 2;

const RECETTE_FAMILLES = Object.freeze([
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
]);

export const QUOTAS_JALONS_ECRITURES_MULTIPLES = Object.freeze({
  5: Object.freeze([1, 1, 1, 1, 1, 0]),
  10: Object.freeze([2, 2, 2, 1, 2, 1]),
  15: Object.freeze([2, 3, 3, 2, 3, 2]),
  20: Object.freeze([3, 4, 4, 3, 4, 2]),
});

const ORDRE_FAMILLES = Object.freeze([
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
]);

const POURCENTAGES_GENERAUX = Object.freeze([
  7, 12, 18, 24, 30, 35, 40, 45, 55, 60, 65, 70, 75, 80, 85, 90,
  95, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 160, 175,
  180, 190, 200, 225, 250,
]);
const PETITS_POURCENTAGES = Object.freeze([7, 5, 8, 9]);
const POURCENTAGES_REPERES = Object.freeze([
  10, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100, 110, 120, 125,
  130, 140, 150, 160, 175, 180, 190, 200, 225, 250,
]);
const POURCENTAGES_RECONNAISSANCE = Object.freeze(
  POURCENTAGES_REPERES.filter((pourcentage) => pourcentage % 100 !== 0),
);
const POURCENTAGES_MIXTES = Object.freeze([
  120, 125, 140, 150, 160, 175, 180, 225, 240, 250,
]);
const DENOMINATEURS_REPERES_PROGRESSIFS = Object.freeze([5, 4, 10, 2]);

function exigerConfiguration(graine, nombreQuestions) {
  validerGraine(graine);
  if (
    !Number.isInteger(nombreQuestions)
    || nombreQuestions < 1
    || nombreQuestions > 20
  ) {
    throw new RangeError(
      "serie ecritures-multiples-nombre : longueur attendue entre 1 et 20",
    );
  }
}

export function repartirFamillesEcrituresMultiples(nombreQuestions) {
  if (
    !Number.isInteger(nombreQuestions)
    || nombreQuestions < 1
    || nombreQuestions > 20
  ) {
    throw new RangeError(
      "repartition ecritures-multiples-nombre : longueur attendue entre 1 et 20",
    );
  }
  const compte = Object.fromEntries(
    ORDRE_FAMILLES.map((famille) => [famille, 0]),
  );
  for (const famille of RECETTE_FAMILLES.slice(0, nombreQuestions)) {
    compte[famille] += 1;
  }
  return Object.freeze(compte);
}

function variantePour(element, aleatoire, nombreQuestions, debutsAlternances) {
  if (element.famille === FAMILLE_POURCENTAGE_FRACTION_CENTIEMES) {
    return "pourcentage-vers-fraction-centiemes";
  }
  if (element.famille === FAMILLE_POURCENTAGE_DECIMAL) {
    const variantes = [
      "pourcentage-vers-decimal",
      "decimal-vers-pourcentage",
    ];
    return variantes[(element.occurrence + debutsAlternances.decimal) % 2];
  }
  if (element.famille === FAMILLE_FRACTION_REPERE_POURCENTAGE) {
    return "fraction-vers-pourcentage";
  }
  if (element.famille === FAMILLE_CHAINE_EGALITES) {
    return debutsAlternances.chaines[
      element.occurrence % debutsAlternances.chaines.length
    ];
  }
  if (element.famille === FAMILLE_UNITE_DEPASSEMENT) {
    if (nombreQuestions >= 10 && element.occurrence === 0) {
      return "unite-vers-entier";
    }
    const decalage = nombreQuestions >= 10
      ? element.occurrence - 1
      : element.occurrence;
    return [
      "mixte-vers-pourcentage",
      "pourcentage-vers-mixte",
    ][decalage % 2];
  }
  return nombreQuestions === 20 && element.occurrence === 1
    ? "selection-multiple"
    : "choix-unique";
}

function couplesCompatibles(pourcentages, { mixte = false } = {}) {
  const couples = [];
  for (const pourcentage of pourcentages) {
    for (const denominateur of DENOMINATEURS_REPERES_NC05) {
      const reste = mixte ? pourcentage % 100 : pourcentage;
      if (
        (!mixte || pourcentage > 100)
        && reste > 0
        && (reste * denominateur) % 100 === 0
      ) {
        couples.push({ pourcentage, denominateur });
      }
    }
  }
  return couples;
}

const COUPLES_REPERES = Object.freeze(
  couplesCompatibles(POURCENTAGES_REPERES).map(Object.freeze),
);
const COUPLES_MIXTES = Object.freeze(
  couplesCompatibles(POURCENTAGES_MIXTES, { mixte: true }).map(Object.freeze),
);

function candidatsPour(element, aleatoire) {
  if (element.variante === "unite-vers-entier") {
    return [{ pourcentage: 100 }];
  }
  if (
    element.famille === FAMILLE_UNITE_DEPASSEMENT
    || element.variante === "selection-multiple"
  ) {
    return aleatoire.melange(COUPLES_MIXTES);
  }
  if (
    element.famille === FAMILLE_FRACTION_REPERE_POURCENTAGE
  ) {
    const denominateur = DENOMINATEURS_REPERES_PROGRESSIFS[
      element.occurrence % DENOMINATEURS_REPERES_PROGRESSIFS.length
    ];
    return aleatoire.melange(
      POURCENTAGES_REPERES
        .filter((pourcentage) =>
          pourcentage < 100
          && (pourcentage * denominateur) % 100 === 0)
        .map((pourcentage) => ({ pourcentage, denominateur })),
    );
  }
  if (element.famille === FAMILLE_CHAINE_EGALITES) {
    return aleatoire.melange(COUPLES_REPERES);
  }
  if (element.famille === FAMILLE_RECONNAITRE_EQUIVALENCES) {
    return aleatoire.melange(
      POURCENTAGES_RECONNAISSANCE.map((pourcentage) => ({ pourcentage })),
    );
  }
  const petitPourcentage = element.occurrence === 0
    && [
      FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
      FAMILLE_POURCENTAGE_DECIMAL,
    ].includes(element.famille);
  const pourcentages = petitPourcentage
    ? PETITS_POURCENTAGES
    : POURCENTAGES_GENERAUX;
  return aleatoire.melange(
    pourcentages.map((pourcentage) => ({ pourcentage })),
  );
}

function affecterValeursDistinctes(elements, aleatoire) {
  const aAffecter = elements.map((element) => ({
    element,
    candidats: candidatsPour(element, aleatoire),
  })).sort((a, b) => a.candidats.length - b.candidats.length);
  const utilises = new Set();

  function affecter(index) {
    if (index === aAffecter.length) return true;
    const { element, candidats } = aAffecter[index];
    for (const candidat of candidats) {
      if (utilises.has(candidat.pourcentage)) continue;
      utilises.add(candidat.pourcentage);
      element.pourcentage = candidat.pourcentage;
      if (candidat.denominateur !== undefined) {
        element.denominateur = candidat.denominateur;
      }
      if (affecter(index + 1)) return true;
      utilises.delete(candidat.pourcentage);
      delete element.pourcentage;
      delete element.denominateur;
    }
    return false;
  }

  if (!affecter(0)) {
    throw new Error(
      "serie ecritures-multiples-nombre : valeurs distinctes insuffisantes",
    );
  }
}

function positionsVisuelles(nombreQuestions) {
  return new Set([
    ...(nombreQuestions >= 3 ? [2] : []),
    ...(nombreQuestions >= 8 ? [7] : []),
    ...(nombreQuestions >= 20 ? [10] : []),
  ]);
}

export function planifierSerieEcrituresMultiples({
  graine,
  nombreQuestions = 10,
}) {
  exigerConfiguration(graine, nombreQuestions);
  const occurrences = new Map(ORDRE_FAMILLES.map((famille) => [famille, 0]));
  const elements = RECETTE_FAMILLES.slice(0, nombreQuestions).map((famille) => {
    const occurrence = occurrences.get(famille);
    occurrences.set(famille, occurrence + 1);
    return { famille, occurrence };
  });
  const aleatoire = creerGenerateur(
    `ecritures-multiples-plan-v${VERSION_PLAN_SERIE_ECRITURES_MULTIPLES}:${graine}:${nombreQuestions}`,
  );
  const debutsAlternances = {
    decimal: aleatoire.choix([0, 1]),
    chaines: aleatoire.melange([
      "chaine-vers-pourcentage",
      "chaine-vers-decimal",
      "chaine-vers-fraction",
    ]),
  };
  for (const element of elements) {
    element.variante = variantePour(
      element,
      aleatoire,
      nombreQuestions,
      debutsAlternances,
    );
  }
  affecterValeursDistinctes(elements, aleatoire);
  const visuelles = positionsVisuelles(nombreQuestions);
  return elements.map(
    (element, position) => ({
      ...element,
      position,
      presentation: visuelles.has(position)
        ? PRESENTATION_VISUELLE_ECRITURES
        : PRESENTATION_ABSTRAITE_ECRITURES,
      gabarit: GABARIT_ECRITURES_MULTIPLES,
      parametres: {
        famille: element.famille,
        pourcentage: element.pourcentage,
        variante: element.variante,
        presentation: visuelles.has(position)
          ? PRESENTATION_VISUELLE_ECRITURES
          : PRESENTATION_ABSTRAITE_ECRITURES,
        ...(element.denominateur === undefined
          ? {}
          : { denominateur: element.denominateur }),
      },
    }),
  );
}

function gabaritAvecParametres(parametres) {
  return {
    ...GABARIT_ECRITURES_MULTIPLES,
    parametres: { ...parametres },
  };
}

export function signatureVisibleQuestionEcrituresMultiples(question) {
  return JSON.stringify({
    famille: question.classement.famille,
    enonce: question.enonce,
    choix: question.reponse.choix ?? null,
  });
}

export function genererSerieEcrituresMultiples({
  registre,
  graine,
  nombreQuestions = 10,
}) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError(
      "serie ecritures-multiples-nombre : registre de générateurs requis",
    );
  }
  const plan = planifierSerieEcrituresMultiples({ graine, nombreQuestions });
  const questions = plan.map((element, index) =>
    registre.instancier(
      gabaritAvecParametres(element.parametres),
      `${graine}:${index + 1}`,
    ));
  const signatures = new Set(
    questions.map(signatureVisibleQuestionEcrituresMultiples),
  );
  if (signatures.size !== questions.length) {
    throw new Error(
      "serie ecritures-multiples-nombre : doublon visible inattendu",
    );
  }
  return questions;
}
