// Recette seedée de la catégorie visible « Un nombre, plusieurs écritures ».
// Les six familles sont équilibrées aux jalons 5, 10, 15 et 20. La série
// standard de dix contient 100 %, au moins une valeur supérieure à 1 et les
// deux sens pourcentage ↔ décimal.

import {
  creerGenerateur,
  validerGraine,
} from "../../../../moteur-exercices/src/aleatoire.js?v=51";
import {
  definirPaquetPondere,
  ordonnerEnLimitantRepetitions,
  tirerProfilsPonderes,
} from "../../../../moteur-exercices/src/paquets-ponderes.js?v=51";
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
} from "./questions.js?v=51";

export const VERSION_PLAN_SERIE_ECRITURES_MULTIPLES = 3;

export const QUOTAS_JALONS_ECRITURES_MULTIPLES = Object.freeze({
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

export const PAQUET_PROFILS_ECRITURES_MULTIPLES = definirPaquetPondere({
  id: "nc05-profils",
  profils: [
    {
      id: "pourcentage-fraction-centiemes",
      quota: 3,
      categorie: "principale",
      famille: FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
      variante: "pourcentage-vers-fraction-centiemes",
    },
    {
      id: "pourcentage-vers-decimal",
      quota: 2,
      categorie: "principale",
      famille: FAMILLE_POURCENTAGE_DECIMAL,
      variante: "pourcentage-vers-decimal",
    },
    {
      id: "decimal-vers-pourcentage",
      quota: 2,
      categorie: "principale",
      famille: FAMILLE_POURCENTAGE_DECIMAL,
      variante: "decimal-vers-pourcentage",
    },
    ...[5, 4, 10, 2].map((denominateur) => ({
      id: `fraction-repere-${denominateur}`,
      quota: 1,
      categorie: "principale",
      famille: FAMILLE_FRACTION_REPERE_POURCENTAGE,
      variante: "fraction-vers-pourcentage",
      denominateur,
    })),
    ...[
      "chaine-vers-pourcentage",
      "chaine-vers-decimal",
      "chaine-vers-fraction",
    ].map((variante) => ({
      id: variante,
      quota: 1,
      categorie: "secondaire",
      famille: FAMILLE_CHAINE_EGALITES,
      variante,
    })),
    {
      id: "unite-vers-entier",
      quota: 1,
      categorie: "secondaire",
      famille: FAMILLE_UNITE_DEPASSEMENT,
      variante: "unite-vers-entier",
    },
    {
      id: "mixte-vers-pourcentage",
      quota: 2,
      categorie: "secondaire",
      famille: FAMILLE_UNITE_DEPASSEMENT,
      variante: "mixte-vers-pourcentage",
    },
    {
      id: "pourcentage-vers-mixte",
      quota: 1,
      categorie: "secondaire",
      famille: FAMILLE_UNITE_DEPASSEMENT,
      variante: "pourcentage-vers-mixte",
    },
    {
      id: "reconnaissance-choix-unique",
      quota: 1,
      categorie: "secondaire",
      famille: FAMILLE_RECONNAITRE_EQUIVALENCES,
      variante: "choix-unique",
    },
    {
      id: "reconnaissance-selection-multiple",
      quota: 1,
      categorie: "rare",
      famille: FAMILLE_RECONNAITRE_EQUIVALENCES,
      variante: "selection-multiple",
    },
  ],
});

export const PAQUET_PRESENTATIONS_ECRITURES_MULTIPLES = definirPaquetPondere({
  id: "nc05-presentations",
  profils: [
    { id: PRESENTATION_ABSTRAITE_ECRITURES, quota: 17, categorie: "principale" },
    { id: PRESENTATION_VISUELLE_ECRITURES, quota: 3, categorie: "secondaire" },
  ],
});

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

export function repartirFamillesEcrituresMultiples(nombreQuestions, graine = "repartition") {
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
  for (const profil of tirerProfilsPonderes({
    paquet: PAQUET_PROFILS_ECRITURES_MULTIPLES,
    graine,
    nombreElements: nombreQuestions,
  })) {
    compte[profil.famille] += 1;
  }
  return Object.freeze(compte);
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
    const denominateur = element.denominateur ?? DENOMINATEURS_REPERES_PROGRESSIFS[
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

export function planifierSerieEcrituresMultiples({
  graine,
  nombreQuestions = 10,
}) {
  exigerConfiguration(graine, nombreQuestions);
  const occurrences = new Map(ORDRE_FAMILLES.map((famille) => [famille, 0]));
  const profils = tirerProfilsPonderes({
    paquet: PAQUET_PROFILS_ECRITURES_MULTIPLES,
    graine: `nc05-profils-v${VERSION_PLAN_SERIE_ECRITURES_MULTIPLES}:${graine}`,
    nombreElements: nombreQuestions,
  });
  const ordonnes = ordonnerEnLimitantRepetitions({
    elements: profils,
    graine: `nc05-ordre-v${VERSION_PLAN_SERIE_ECRITURES_MULTIPLES}:${graine}`,
    cle: ({ famille }) => famille,
  });
  const elements = ordonnes.map((profil) => {
    const { famille } = profil;
    const occurrence = occurrences.get(famille);
    occurrences.set(famille, occurrence + 1);
    return {
      famille,
      occurrence,
      variante: profil.variante,
      ...(profil.denominateur === undefined ? {} : { denominateur: profil.denominateur }),
    };
  });
  const aleatoire = creerGenerateur(
    `ecritures-multiples-valeurs-v${VERSION_PLAN_SERIE_ECRITURES_MULTIPLES}:${graine}:${nombreQuestions}`,
  );
  affecterValeursDistinctes(elements, aleatoire);
  const presentations = ordonnerEnLimitantRepetitions({
    elements: tirerProfilsPonderes({
      paquet: PAQUET_PRESENTATIONS_ECRITURES_MULTIPLES,
      graine: `nc05-presentations-v${VERSION_PLAN_SERIE_ECRITURES_MULTIPLES}:${graine}`,
      nombreElements: nombreQuestions,
    }),
    graine: `nc05-ordre-presentations-v${VERSION_PLAN_SERIE_ECRITURES_MULTIPLES}:${graine}`,
    cle: ({ id }) => id,
    maximumConsecutif: 5,
  });
  return elements.map(
    (element, position) => ({
      ...element,
      position,
      presentation: presentations[position].id,
      gabarit: GABARIT_ECRITURES_MULTIPLES,
      parametres: {
        famille: element.famille,
        pourcentage: element.pourcentage,
        variante: element.variante,
        presentation: presentations[position].id,
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
