// Plan de série commun à la catégorie visible « Fractions simples et
// décimaux ». NC-03 et NC-04 restent deux files internes, équilibrées puis
// intercalées. Une série de vingt comporte exactement dix questions dans
// chaque sens, une production libre et au plus un item de millièmes.

import {
  creerGenerateur,
  validerGraine,
} from "../../../../moteur-exercices/src/aleatoire.js?v=21";
import {
  GABARIT_DECIMAL_VERS_FRACTION,
  CIBLES_FRACTION_LIBRE,
} from "./decimal-vers-fraction.js?v=21";
import {
  GABARIT_FRACTION_VERS_DECIMAL,
  NUMERATEURS_CENTIEMES,
  NUMERATEURS_DENOMINATEUR_UN,
  NUMERATEURS_DIXIEMES,
  NUMERATEURS_MILLIEMES,
} from "./fraction-vers-decimal.js?v=21";
import {
  MICRO_NOTION_NC03,
  MICRO_NOTION_NC04,
  NUMERATEURS_DEMIS,
  NUMERATEURS_QUARTS,
} from "./commun.js?v=21";

export const VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX = 2;

const RECETTE_NC03 = Object.freeze([
  2,
  10,
  4,
  100,
  2,
  1,
  4,
  10,
  100,
  100,
]);

const RECETTE_NC04 = Object.freeze([
  2,
  10,
  4,
  100,
  2,
  4,
  10,
  100,
  100,
  4,
]);

const NUMERATEURS_PAR_DENOMINATEUR = Object.freeze({
  1: NUMERATEURS_DENOMINATEUR_UN,
  2: NUMERATEURS_DEMIS,
  4: NUMERATEURS_QUARTS,
  10: NUMERATEURS_DIXIEMES,
  100: NUMERATEURS_CENTIEMES,
  1000: NUMERATEURS_MILLIEMES,
});

function exigerConfiguration(graine, nombreQuestions) {
  validerGraine(graine);
  if (
    !Number.isInteger(nombreQuestions) ||
    nombreQuestions < 1 ||
    nombreQuestions > 20
  ) {
    throw new RangeError(
      "serie fractions-decimaux : longueur attendue entre 1 et 20",
    );
  }
}

export function repartirMicroNotionsFractionsDecimaux({
  graine,
  nombreQuestions,
}) {
  exigerConfiguration(graine, nombreQuestions);
  const minimum = Math.floor(nombreQuestions / 2);
  const resultat = {
    [MICRO_NOTION_NC03]: minimum,
    [MICRO_NOTION_NC04]: minimum,
  };
  if (nombreQuestions % 2 === 1) {
    const aleatoire = creerGenerateur(
      `fractions-decimaux-repartition-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}:${nombreQuestions}`,
    );
    resultat[aleatoire.choix([MICRO_NOTION_NC03, MICRO_NOTION_NC04])] += 1;
  }
  return Object.freeze(resultat);
}

function pgcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

function cleValeur(numerateur, denominateur) {
  const diviseur = pgcd(numerateur, denominateur);
  return `${numerateur / diviseur}/${denominateur / diviseur}`;
}

function creerFile(microNotion, nombre) {
  const recette = microNotion === MICRO_NOTION_NC03
    ? RECETTE_NC03
    : RECETTE_NC04;
  return recette.slice(0, nombre).map((denominateur) => ({
    microNotion,
    denominateur,
    forme: microNotion === MICRO_NOTION_NC04
      ? "denominateur-impose"
      : undefined,
  }));
}

function marquerCasStructurels(files, aleatoire, nombreQuestions) {
  // À partir de dix questions, chaque sens rencontre au moins une fraction
  // simple propre et une fraction impropre non entière. NC-04 comporte aussi
  // un entier caché. Les positions et les valeurs restent seedées et variées.
  if (nombreQuestions < 10) return;
  for (const microNotion of [MICRO_NOTION_NC03, MICRO_NOTION_NC04]) {
    const simples = aleatoire.melange(
      files.get(microNotion).filter((element) =>
        element.forme !== "fraction-libre"
        && [2, 4].includes(element.denominateur)),
    );
    const quarts = aleatoire.melange(
      simples.filter((element) => element.denominateur === 4),
    );
    if (simples.length < 2 || quarts.length < 1) {
      throw new Error(
        `serie fractions-decimaux : cas simples insuffisants pour ${microNotion}`,
      );
    }
    const propre = quarts[0];
    propre.classeValeur = "inferieur-un";
    const restants = aleatoire.melange(
      simples.filter((element) => element !== propre),
    );
    restants[0].classeValeur = "superieur-un-non-entier";
    if (microNotion === MICRO_NOTION_NC04) {
      if (restants.length < 2) {
        throw new Error(
          "serie fractions-decimaux : entier caché NC-04 impossible",
        );
      }
      restants[1].classeValeur = "entier";
    }
  }
}

function reserverCasLongs(files, graine, nombreQuestions) {
  if (nombreQuestions !== 20) return;
  const fileNC04 = files.get(MICRO_NOTION_NC04);
  fileNC04[fileNC04.length - 1] = {
    microNotion: MICRO_NOTION_NC04,
    forme: "fraction-libre",
  };

  const aleatoire = creerGenerateur(
    `fractions-decimaux-millieme-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}`,
  );
  const microMillieme = aleatoire.choix([
    MICRO_NOTION_NC03,
    MICRO_NOTION_NC04,
  ]);
  const file = files.get(microMillieme);
  const index = file.findLastIndex((element) =>
    element.forme !== "fraction-libre" && element.denominateur === 100);
  if (index < 0) {
    throw new Error(
      "serie fractions-decimaux : aucune place disponible pour les millièmes",
    );
  }
  file[index] = { ...file[index], denominateur: 1000 };
}

function parametrerNumerateurs(files, aleatoire) {
  const utilises = new Set();
  const aAffecter = aleatoire.melange([...files.values()].flat())
    .map((element) => ({
      element,
      candidats: element.forme === "fraction-libre"
        ? aleatoire.melange(CIBLES_FRACTION_LIBRE)
        : aleatoire.melange(
          NUMERATEURS_PAR_DENOMINATEUR[element.denominateur].map(
            (numerateur) => ({ numerateur, denominateur: element.denominateur }),
          ).filter((candidat) => {
            if (element.classeValeur === "inferieur-un") {
              return candidat.numerateur < candidat.denominateur;
            }
            if (element.classeValeur === "superieur-un-non-entier") {
              return candidat.numerateur > candidat.denominateur
                && candidat.numerateur % candidat.denominateur !== 0;
            }
            if (element.classeValeur === "entier") {
              return candidat.numerateur % candidat.denominateur === 0;
            }
            return true;
          }),
        ),
    }))
    .sort((a, b) => a.candidats.length - b.candidats.length);

  function affecter(index) {
    if (index === aAffecter.length) return true;
    const { element, candidats } = aAffecter[index];
    for (const candidat of candidats) {
      const cle = cleValeur(candidat.numerateur, candidat.denominateur);
      if (utilises.has(cle)) continue;
      utilises.add(cle);
      element.numerateur = candidat.numerateur;
      element.denominateur = candidat.denominateur;
      if (affecter(index + 1)) return true;
      utilises.delete(cle);
      delete element.numerateur;
      if (element.forme === "fraction-libre") delete element.denominateur;
    }
    return false;
  }

  if (!affecter(0)) {
    throw new Error("serie fractions-decimaux : valeurs distinctes insuffisantes");
  }
}

function ordonnerMicroNotions(aleatoire, repartition) {
  const restants = new Map(Object.entries(repartition));
  const ordre = [];
  const total = Object.values(repartition).reduce((somme, nombre) => somme + nombre, 0);

  function placer() {
    if (ordre.length === total) return true;
    const candidats = aleatoire.melange(
      [...restants.entries()]
        .filter(([, nombre]) => nombre > 0)
        .map(([microNotion]) => microNotion),
    );
    for (const microNotion of candidats) {
      const deuxDerniersIdentiques = ordre.length >= 2
        && ordre.at(-1) === microNotion
        && ordre.at(-2) === microNotion;
      if (deuxDerniersIdentiques) continue;
      restants.set(microNotion, restants.get(microNotion) - 1);
      ordre.push(microNotion);
      if (placer()) return true;
      ordre.pop();
      restants.set(microNotion, restants.get(microNotion) + 1);
    }
    return false;
  }

  if (!placer()) {
    throw new Error("serie fractions-decimaux : ordre varié impossible");
  }
  return ordre;
}

function repartitionPresentations(nombreQuestions) {
  const qcm = Math.max(nombreQuestions >= 5 ? 1 : 0, Math.round(nombreQuestions * 0.2));
  const doubles = Math.max(nombreQuestions >= 8 ? 1 : 0, Math.round(nombreQuestions * 0.1));
  return {
    "qcm-diagnostique": qcm,
    "double-droite": doubles,
    abstraite: nombreQuestions - qcm - doubles,
  };
}

function selectionnerEquilibreParMicroNotion(elements, quota, aleatoire) {
  const disponibles = new Map(
    [MICRO_NOTION_NC03, MICRO_NOTION_NC04].map((microNotion) => [
      microNotion,
      aleatoire.melange(
        elements.filter((element) => element.microNotion === microNotion),
      ),
    ]),
  );
  const comptes = new Map([
    [MICRO_NOTION_NC03, 0],
    [MICRO_NOTION_NC04, 0],
  ]);
  const selection = [];
  while (selection.length < quota) {
    const microNotionsDisponibles = [...disponibles.entries()]
      .filter(([, liste]) => liste.length > 0)
      .map(([microNotion]) => microNotion);
    if (microNotionsDisponibles.length === 0) {
      throw new Error(
        "serie fractions-decimaux : quota de présentations impossible",
      );
    }
    const minimum = Math.min(
      ...microNotionsDisponibles.map((microNotion) => comptes.get(microNotion)),
    );
    const candidats = microNotionsDisponibles.filter(
      (microNotion) => comptes.get(microNotion) === minimum,
    );
    const microNotion = aleatoire.choix(candidats);
    selection.push(disponibles.get(microNotion).pop());
    comptes.set(microNotion, comptes.get(microNotion) + 1);
  }
  return selection;
}

function attribuerPresentations(files, aleatoire, nombreQuestions) {
  const elements = [...files.values()].flat();
  const quotas = repartitionPresentations(nombreQuestions);
  elements.forEach((element) => { element.presentation = "abstraite"; });

  const eligiblesDouble = elements.filter((element) =>
    element.forme !== "fraction-libre"
    && [2, 4].includes(element.denominateur));
  selectionnerEquilibreParMicroNotion(
    eligiblesDouble,
    quotas["double-droite"],
    aleatoire,
  ).forEach((element) => { element.presentation = "double-droite"; });

  const eligiblesQcm = elements.filter((element) =>
    element.forme !== "fraction-libre"
    && element.presentation === "abstraite");
  selectionnerEquilibreParMicroNotion(
    eligiblesQcm,
    quotas["qcm-diagnostique"],
    aleatoire,
  ).forEach((element) => { element.presentation = "qcm-diagnostique"; });
}

function melangerFiles(files, aleatoire) {
  for (const [microNotion, elements] of files) {
    files.set(microNotion, aleatoire.melange(elements));
  }
}

function gabaritPour(microNotion) {
  return microNotion === MICRO_NOTION_NC03
    ? GABARIT_FRACTION_VERS_DECIMAL
    : GABARIT_DECIMAL_VERS_FRACTION;
}

export function planifierSerieFractionsDecimaux({
  graine,
  nombreQuestions = 10,
}) {
  exigerConfiguration(graine, nombreQuestions);
  const repartition = repartirMicroNotionsFractionsDecimaux({
    graine,
    nombreQuestions,
  });
  const files = new Map([
    [MICRO_NOTION_NC03, creerFile(MICRO_NOTION_NC03, repartition[MICRO_NOTION_NC03])],
    [MICRO_NOTION_NC04, creerFile(MICRO_NOTION_NC04, repartition[MICRO_NOTION_NC04])],
  ]);
  reserverCasLongs(files, graine, nombreQuestions);

  const aleatoire = creerGenerateur(
    `fractions-decimaux-plan-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}:${nombreQuestions}`,
  );
  marquerCasStructurels(files, aleatoire, nombreQuestions);
  parametrerNumerateurs(files, aleatoire);
  melangerFiles(files, aleatoire);
  attribuerPresentations(files, aleatoire, nombreQuestions);
  const ordre = ordonnerMicroNotions(aleatoire, repartition);
  const positions = new Map([
    [MICRO_NOTION_NC03, 0],
    [MICRO_NOTION_NC04, 0],
  ]);
  return ordre.map((microNotion, position) => {
    const index = positions.get(microNotion);
    positions.set(microNotion, index + 1);
    const element = files.get(microNotion)[index];
    return {
      ...element,
      position,
      gabarit: gabaritPour(microNotion),
      parametres: {
        numerateur: element.numerateur,
        denominateur: element.denominateur,
        presentation: element.presentation,
        ...(element.forme === undefined ? {} : { forme: element.forme }),
      },
    };
  });
}

export function signatureVisibleQuestion(question) {
  return JSON.stringify({
    microNotion: question.classement.microNotion,
    famille: question.classement.famille,
    enonce: question.enonce,
  });
}

function gabaritAvecParametres(gabarit, parametres) {
  return { ...gabarit, parametres: { ...parametres } };
}

export function genererSerieFractionsDecimaux({
  registre,
  graine,
  nombreQuestions = 10,
}) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError(
      "serie fractions-decimaux : registre de générateurs requis",
    );
  }
  const plan = planifierSerieFractionsDecimaux({ graine, nombreQuestions });
  const signatures = new Set();
  return plan.map((element, index) => {
    for (let essai = 0; essai < 40; essai += 1) {
      const question = registre.instancier(
        gabaritAvecParametres(element.gabarit, element.parametres),
        `${graine}:${index + 1}:${essai}`,
      );
      const signature = signatureVisibleQuestion(question);
      if (!signatures.has(signature)) {
        signatures.add(signature);
        return question;
      }
    }
    throw new Error(
      `serie fractions-decimaux : doublon visible persistant à la position ${index + 1}`,
    );
  });
}
