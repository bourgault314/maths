// Plan de série commun à la catégorie visible « Fractions simples et
// décimaux ». NC-03 et NC-04 restent deux files internes, équilibrées puis
// intercalées. Les représentations restent dans le cours, l'aide et la
// correction : les questions sont uniquement des productions ou des QCM
// diagnostiques. Les productions libres commencent dès une série de cinq.

import {
  creerGenerateur,
  validerGraine,
} from "../../../../moteur-exercices/src/aleatoire.js?v=51";
import {
  apparierProfilsCompatibles,
  definirPaquetPondere,
  tirerProfilsPonderes,
} from "../../../../moteur-exercices/src/paquets-ponderes.js?v=51";
import {
  GABARIT_DECIMAL_VERS_FRACTION,
  CIBLES_FRACTION_LIBRE,
  CIBLES_FRACTION_LIBRE_DECIMALES,
  CIBLES_FRACTION_LIBRE_DEMIS_QUARTS,
} from "./decimal-vers-fraction.js?v=51";
import {
  GABARIT_FRACTION_VERS_DECIMAL,
  NUMERATEURS_CENTIEMES,
  NUMERATEURS_DENOMINATEUR_UN,
  NUMERATEURS_DIXIEMES,
  NUMERATEURS_MILLIEMES,
} from "./fraction-vers-decimal.js?v=51";
import {
  MICRO_NOTION_NC03,
  MICRO_NOTION_NC04,
  NUMERATEURS_DEMIS,
  NUMERATEURS_QUARTS,
} from "./commun.js?v=51";

export const VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX = 5;
export const VERSION_PLANS_SERIES_NC03_NC04 = 2;

export const QUOTAS_SERIES_FRACTIONS_DECIMAUX = Object.freeze({
  20: Object.freeze({ qcm: 4, productionsLibres: 2, milliemes: 1 }),
});

export const PAQUET_MICRO_NOTIONS_FRACTIONS_DECIMAUX = definirPaquetPondere({
  id: "nc03-nc04-micro-notions",
  profils: [
    { id: MICRO_NOTION_NC03, quota: 10, categorie: "principale" },
    { id: MICRO_NOTION_NC04, quota: 10, categorie: "principale" },
  ],
});

function profilsDenominateurs(quotas) {
  return Object.entries(quotas).map(([denominateur, quota]) => ({
    id: `denominateur-${denominateur}`,
    quota,
    categorie: Number(denominateur) === 1000 ? "rare" : "principale",
    denominateur: Number(denominateur),
  }));
}

export const PAQUET_CONTENUS_FRACTIONS_DECIMAUX = definirPaquetPondere({
  id: "nc03-nc04-contenus",
  profils: [
    ...profilsDenominateurs({ 1: 1, 2: 4, 4: 4, 10: 4, 100: 4, 1000: 1 }),
    {
      id: "fraction-libre-demis-quarts",
      quota: 1,
      categorie: "rare",
      forme: "fraction-libre",
      categorieLibre: "demis-quarts",
    },
    {
      id: "fraction-libre-decimales",
      quota: 1,
      categorie: "rare",
      forme: "fraction-libre",
      categorieLibre: "decimales",
    },
  ],
});

export const PAQUET_CONTENUS_NC03 = definirPaquetPondere({
  id: "nc03-contenus",
  profils: profilsDenominateurs({ 1: 2, 2: 4, 4: 4, 10: 4, 100: 5, 1000: 1 }),
});

export const PAQUET_CONTENUS_NC04 = definirPaquetPondere({
  id: "nc04-contenus",
  profils: [
    ...profilsDenominateurs({ 2: 4, 4: 4, 10: 4, 100: 5, 1000: 1 }),
    {
      id: "fraction-libre-demis-quarts",
      quota: 1,
      categorie: "rare",
      forme: "fraction-libre",
      categorieLibre: "demis-quarts",
    },
    {
      id: "fraction-libre-decimales",
      quota: 1,
      categorie: "rare",
      forme: "fraction-libre",
      categorieLibre: "decimales",
    },
  ],
});

export const PAQUET_PRESENTATIONS_FRACTIONS_DECIMAUX = definirPaquetPondere({
  id: "nc03-nc04-presentations",
  profils: [
    { id: "abstraite", quota: 16, categorie: "principale" },
    { id: "qcm-diagnostique", quota: 4, categorie: "secondaire" },
  ],
});

export const PAQUET_CLASSES_VALEURS_FRACTIONS_DECIMAUX = definirPaquetPondere({
  id: "nc03-nc04-classes-valeurs",
  profils: [
    { id: "ordinaire", quota: 15, categorie: "principale", classeValeur: null },
    { id: "inferieur-un", quota: 2, categorie: "secondaire", classeValeur: "inferieur-un" },
    { id: "superieur-un", quota: 2, categorie: "secondaire", classeValeur: "superieur-un-non-entier" },
    { id: "entier", quota: 1, categorie: "rare", classeValeur: "entier" },
  ],
});

export const PAQUET_CLASSES_VALEURS_FRACTIONS_ISOLEES = definirPaquetPondere({
  id: "nc03-nc04-classes-valeurs-isolees",
  profils: [
    { id: "ordinaire", quota: 17, categorie: "principale", classeValeur: null },
    { id: "inferieur-un", quota: 1, categorie: "secondaire", classeValeur: "inferieur-un" },
    { id: "superieur-un", quota: 1, categorie: "secondaire", classeValeur: "superieur-un-non-entier" },
    { id: "entier", quota: 1, categorie: "rare", classeValeur: "entier" },
  ],
});

const NUMERATEURS_PAR_DENOMINATEUR = Object.freeze({
  1: NUMERATEURS_DENOMINATEUR_UN,
  2: NUMERATEURS_DEMIS,
  4: NUMERATEURS_QUARTS,
  10: NUMERATEURS_DIXIEMES,
  100: NUMERATEURS_CENTIEMES,
  1000: NUMERATEURS_MILLIEMES,
});

// Les repères prescrits sont présents et légèrement favorisés dans les pools,
// sans imposer une valeur fixe à une position de la série.
const NUMERATEURS_REPERES_OFFICIELS = Object.freeze({
  1: Object.freeze([7]),
  2: Object.freeze([1, 3, 4, 5]),
  4: Object.freeze([1, 3]),
  10: Object.freeze([1]),
  100: Object.freeze([1, 100]),
  1000: Object.freeze([1]),
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
  const resultat = {
    [MICRO_NOTION_NC03]: 0,
    [MICRO_NOTION_NC04]: 0,
  };
  for (const profil of tirerProfilsPonderes({
    paquet: PAQUET_MICRO_NOTIONS_FRACTIONS_DECIMAUX,
    graine: `fractions-decimaux-repartition-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}`,
    nombreElements: nombreQuestions,
  })) {
    resultat[profil.id] += 1;
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

function estRepereOfficiel({ numerateur, denominateur }) {
  return NUMERATEURS_REPERES_OFFICIELS[denominateur]?.includes(numerateur)
    ?? false;
}

function respecterClasseValeur(candidat, classeValeur) {
  if (classeValeur === "inferieur-un") {
    return candidat.numerateur < candidat.denominateur;
  }
  if (classeValeur === "superieur-un-non-entier") {
    return candidat.numerateur > candidat.denominateur
      && candidat.numerateur % candidat.denominateur !== 0;
  }
  if (classeValeur === "entier") {
    return candidat.numerateur % candidat.denominateur === 0;
  }
  return true;
}

function candidatsPourElement(element, aleatoire) {
  const cibles = ciblesBrutesPourElement(element);
  const compatibles = cibles.filter((candidat) =>
    respecterClasseValeur(candidat, element.classeValeur));
  const reperes = aleatoire.melange(compatibles.filter(estRepereOfficiel));
  const autres = aleatoire.melange(compatibles.filter((candidat) =>
    !estRepereOfficiel(candidat)));
  // Environ une fois sur huit, un repère devient le premier candidat. Les
  // autres tirages mélangent tout le pool et conservent donc sa diversité.
  return reperes.length > 0 && aleatoire.choix([
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ])
    ? [...reperes, ...autres]
    : aleatoire.melange([...reperes, ...autres]);
}

function ciblesBrutesPourElement(element) {
  return element.forme === "fraction-libre"
    ? element.categorieLibre === "demis-quarts"
      ? CIBLES_FRACTION_LIBRE_DEMIS_QUARTS
      : element.categorieLibre === "decimales"
        ? CIBLES_FRACTION_LIBRE_DECIMALES
        : CIBLES_FRACTION_LIBRE
    : NUMERATEURS_PAR_DENOMINATEUR[element.denominateur].map(
      (numerateur) => ({ numerateur, denominateur: element.denominateur }),
    );
}

function parametrerNumerateurs(files, aleatoire) {
  const utilises = new Set();
  const aAffecter = aleatoire.melange([...files.values()].flat())
    .map((element) => ({
      element,
      candidats: candidatsPourElement(element, aleatoire),
    }))
    .sort((a, b) => a.candidats.length - b.candidats.length);
  const minimumReperesOfficiels = aAffecter.length >= 20 ? 2 : 0;
  const peutEncoreAtteindreMinimum = (index, nombreReperes) => {
    if (nombreReperes >= minimumReperesOfficiels) return true;
    let possibilites = 0;
    for (let position = index; position < aAffecter.length; position += 1) {
      if (aAffecter[position].candidats.some((candidat) =>
        estRepereOfficiel(candidat)
        && !utilises.has(cleValeur(candidat.numerateur, candidat.denominateur)))) {
        possibilites += 1;
      }
    }
    return nombreReperes + possibilites >= minimumReperesOfficiels;
  };
  const denominateursInitiaux = new Map(
    aAffecter.map(({ element }) => [element, element.denominateur]),
  );

  function affecter(index, nombreReperes = 0) {
    if (index === aAffecter.length) {
      return nombreReperes >= minimumReperesOfficiels;
    }
    const { element, candidats } = aAffecter[index];
    for (const candidat of candidats) {
      const cle = cleValeur(candidat.numerateur, candidat.denominateur);
      if (utilises.has(cle)) continue;
      const prochainNombreReperes = nombreReperes + Number(estRepereOfficiel(candidat));
      utilises.add(cle);
      element.numerateur = candidat.numerateur;
      element.denominateur = candidat.denominateur;
      if (
        peutEncoreAtteindreMinimum(index + 1, prochainNombreReperes)
        && affecter(index + 1, prochainNombreReperes)
      ) return true;
      utilises.delete(cle);
      delete element.numerateur;
      if (element.forme === "fraction-libre") {
        delete element.denominateur;
      } else {
        element.denominateur = denominateursInitiaux.get(element);
      }
    }
    return false;
  }

  if (!affecter(0)) {
    throw new Error("serie fractions-decimaux : valeurs distinctes insuffisantes");
  }
}

function ordonnerElements(elements, aleatoire) {
  const restants = aleatoire.melange(elements);
  const resultat = [];
  const estQcm = (element) => element.presentation === "qcm-diagnostique";
  const estLibre = (element) => element.forme === "fraction-libre";

  function longueurTerminale(cle, valeur) {
    let longueur = 0;
    for (let index = resultat.length - 1; index >= 0; index -= 1) {
      if (cle(resultat[index]) !== valeur) break;
      longueur += 1;
    }
    return longueur;
  }

  function penalite(candidat) {
    const dernier = resultat.at(-1);
    let valeur = 0;
    if (dernier && estQcm(dernier) && estQcm(candidat)) valeur += 100;
    if (dernier && estLibre(dernier) && estLibre(candidat)) valeur += 100;
    if (longueurTerminale((element) => element.denominateur, candidat.denominateur) >= 2) {
      valeur += 40;
    }
    if (longueurTerminale((element) => element.microNotion, candidat.microNotion) >= 2) {
      valeur += 25;
    }
    return valeur;
  }

  function urgence(candidat) {
    return restants.filter((element) =>
      element.microNotion === candidat.microNotion).length
      + restants.filter((element) =>
        element.denominateur === candidat.denominateur).length;
  }

  function categorieEspacement(element) {
    if (estQcm(element)) return "qcm";
    if (estLibre(element)) return "libre";
    return null;
  }

  function espacementEncorePossible(candidat) {
    const categorieChoisie = categorieEspacement(candidat);
    const apres = restants.filter((element) => element !== candidat);
    return ["qcm", "libre"].every((categorie) => {
      const identiques = apres.filter((element) =>
        categorieEspacement(element) === categorie).length;
      const autres = apres.length - identiques;
      return identiques <= autres + Number(categorieChoisie !== categorie);
    });
  }

  while (restants.length > 0) {
    const scores = restants.map((element, index) => ({
      element,
      index,
      penalite: penalite(element),
      urgence: urgence(element),
    }));
    const faisables = scores.filter(({ element }) => espacementEncorePossible(element));
    const vivier = faisables.length > 0 ? faisables : scores;
    const minimum = Math.min(...vivier.map(({ penalite: valeur }) => valeur));
    const candidates = vivier
      .filter(({ penalite: valeur }) => valeur === minimum)
      .sort((a, b) => b.urgence - a.urgence || a.index - b.index);
    const choisie = candidates[0];
    resultat.push(choisie.element);
    restants.splice(choisie.index, 1);
  }
  return resultat;
}

function gabaritPour(microNotion) {
  return microNotion === MICRO_NOTION_NC03
    ? GABARIT_FRACTION_VERS_DECIMAL
    : GABARIT_DECIMAL_VERS_FRACTION;
}

function tirerEtApparier({ elements, paquet, graine, estCompatible }) {
  for (let essai = 0; essai < 60; essai += 1) {
    const profils = tirerProfilsPonderes({
      paquet,
      graine: `${graine}:essai-${essai}`,
      nombreElements: elements.length,
    });
    try {
      return apparierProfilsCompatibles({
        elements,
        profils,
        graine: `${graine}:appariement-${essai}`,
        estCompatible,
      });
    } catch (erreur) {
      if (!String(erreur.message).startsWith("appariement pondéré")) throw erreur;
    }
  }
  throw new Error("serie fractions-decimaux : dimensions compatibles introuvables");
}

function creerElementDepuisProfil(microNotion, profil) {
  return {
    microNotion,
    ...(profil.denominateur === undefined
      ? {}
      : { denominateur: profil.denominateur }),
    ...(profil.forme === undefined
      ? (microNotion === MICRO_NOTION_NC04 ? { forme: "denominateur-impose" } : {})
      : { forme: profil.forme, categorieLibre: profil.categorieLibre }),
  };
}

function contenuCompatible(microNotion, profil) {
  if (profil.forme === "fraction-libre") return microNotion === MICRO_NOTION_NC04;
  if (profil.denominateur === 1) return microNotion === MICRO_NOTION_NC03;
  return true;
}

function attribuerClassesValeurs(elements, paquet, graine) {
  const profils = tirerEtApparier({
    elements,
    paquet,
    graine,
    estCompatible: (element, profil) => {
      if (profil.classeValeur === null) return true;
      if (
        profil.classeValeur === "inferieur-un"
        && element.denominateur === 2
      ) return false;
      return ciblesBrutesPourElement(element).some((candidat) =>
        respecterClasseValeur(candidat, profil.classeValeur));
    },
  });
  elements.forEach((element, index) => {
    if (profils[index].classeValeur !== null) {
      element.classeValeur = profils[index].classeValeur;
    }
  });
}

function attribuerPresentationsPonderees(elements, graine) {
  const profils = tirerEtApparier({
    elements,
    paquet: PAQUET_PRESENTATIONS_FRACTIONS_DECIMAUX,
    graine,
    estCompatible: (element, profil) =>
      profil.id !== "qcm-diagnostique" || element.forme !== "fraction-libre",
  });
  elements.forEach((element, index) => {
    element.presentation = profils[index].id;
  });
}

function finaliserPlanPondere({ elements, graine, version }) {
  const files = new Map([
    [MICRO_NOTION_NC03, elements.filter(({ microNotion }) => microNotion === MICRO_NOTION_NC03)],
    [MICRO_NOTION_NC04, elements.filter(({ microNotion }) => microNotion === MICRO_NOTION_NC04)],
  ]);
  parametrerNumerateurs(
    files,
    creerGenerateur(`fractions-decimaux-valeurs-v${version}:${graine}:${elements.length}`),
  );
  const ordre = ordonnerElements(
    elements,
    creerGenerateur(`fractions-decimaux-ordre-v${version}:${graine}:${elements.length}`),
  );
  return ordre.map((element, position) => ({
    ...element,
    position,
    gabarit: gabaritPour(element.microNotion),
    parametres: {
      numerateur: element.numerateur,
      denominateur: element.denominateur,
      presentation: element.presentation,
      ...(element.forme === undefined ? {} : { forme: element.forme }),
    },
  }));
}

export function planifierSerieFractionsDecimaux({
  graine,
  nombreQuestions = 10,
}) {
  exigerConfiguration(graine, nombreQuestions);
  const microNotions = tirerProfilsPonderes({
    paquet: PAQUET_MICRO_NOTIONS_FRACTIONS_DECIMAUX,
    graine: `fractions-decimaux-micro-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}`,
    nombreElements: nombreQuestions,
  });
  const contenus = tirerEtApparier({
    elements: microNotions,
    paquet: PAQUET_CONTENUS_FRACTIONS_DECIMAUX,
    graine: `fractions-decimaux-contenus-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}`,
    estCompatible: (microNotion, profil) => contenuCompatible(microNotion.id, profil),
  });
  const elements = microNotions.map((microNotion, index) =>
    creerElementDepuisProfil(microNotion.id, contenus[index]));
  attribuerClassesValeurs(
    elements,
    PAQUET_CLASSES_VALEURS_FRACTIONS_DECIMAUX,
    `fractions-decimaux-classes-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}`,
  );
  attribuerPresentationsPonderees(
    elements,
    `fractions-decimaux-presentations-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}`,
  );
  return finaliserPlanPondere({
    elements,
    graine,
    version: VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX,
  });
}

function planifierSerieIsolee({ microNotion, graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  const paquet = microNotion === MICRO_NOTION_NC03
    ? PAQUET_CONTENUS_NC03
    : PAQUET_CONTENUS_NC04;
  const elements = tirerProfilsPonderes({
    paquet,
    graine: `${microNotion}-contenus-v${VERSION_PLANS_SERIES_NC03_NC04}:${graine}`,
    nombreElements: nombreQuestions,
  }).map((profil) => creerElementDepuisProfil(microNotion, profil));
  attribuerClassesValeurs(
    elements,
    PAQUET_CLASSES_VALEURS_FRACTIONS_ISOLEES,
    `${microNotion}-classes-v${VERSION_PLANS_SERIES_NC03_NC04}:${graine}`,
  );
  attribuerPresentationsPonderees(
    elements,
    `${microNotion}-presentations-v${VERSION_PLANS_SERIES_NC03_NC04}:${graine}`,
  );
  return finaliserPlanPondere({
    elements,
    graine: `${microNotion}:${graine}`,
    version: VERSION_PLANS_SERIES_NC03_NC04,
  });
}

export function planifierSerieFractionVersDecimal(configuration) {
  return planifierSerieIsolee({
    ...configuration,
    microNotion: MICRO_NOTION_NC03,
  });
}

export function planifierSerieDecimalVersFraction(configuration) {
  return planifierSerieIsolee({
    ...configuration,
    microNotion: MICRO_NOTION_NC04,
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

function genererDepuisPlan({ registre, graine, plan, nom, notionProduite = null }) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError(`${nom} : registre de générateurs requis`);
  }
  const signatures = new Set();
  return plan.map((element, index) => {
    for (let essai = 0; essai < 40; essai += 1) {
      const questionInitiale = registre.instancier(
        gabaritAvecParametres(element.gabarit, element.parametres),
        `${graine}:${index + 1}:${essai}`,
      );
      const question = notionProduite === null
        ? questionInitiale
        : {
            ...questionInitiale,
            classement: {
              ...questionInitiale.classement,
              notion: notionProduite,
            },
          };
      const signature = signatureVisibleQuestion(question);
      if (!signatures.has(signature)) {
        signatures.add(signature);
        return question;
      }
    }
    throw new Error(`${nom} : doublon visible persistant à la position ${index + 1}`);
  });
}

export function genererSerieFractionVersDecimal({
  registre,
  graine,
  nombreQuestions = 10,
}) {
  return genererDepuisPlan({
    registre,
    graine,
    plan: planifierSerieFractionVersDecimal({ graine, nombreQuestions }),
    nom: "serie NC03",
    notionProduite: MICRO_NOTION_NC03,
  });
}

export function genererSerieDecimalVersFraction({
  registre,
  graine,
  nombreQuestions = 10,
}) {
  return genererDepuisPlan({
    registre,
    graine,
    plan: planifierSerieDecimalVersFraction({ graine, nombreQuestions }),
    nom: "serie NC04",
    notionProduite: MICRO_NOTION_NC04,
  });
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
