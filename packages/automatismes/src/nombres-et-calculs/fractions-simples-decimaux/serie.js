// Plan de série commun à la catégorie visible « Fractions simples et
// décimaux ». NC-03 et NC-04 restent deux files internes, équilibrées puis
// intercalées. Les représentations restent dans le cours, l'aide et la
// correction : les questions sont uniquement des productions ou des QCM
// diagnostiques. Les productions libres commencent dès une série de cinq.

import {
  creerGenerateur,
  validerGraine,
} from "../../../../moteur-exercices/src/aleatoire.js?v=44";
import {
  GABARIT_DECIMAL_VERS_FRACTION,
  CIBLES_FRACTION_LIBRE,
  CIBLES_FRACTION_LIBRE_DECIMALES,
  CIBLES_FRACTION_LIBRE_DEMIS_QUARTS,
} from "./decimal-vers-fraction.js?v=45";
import {
  GABARIT_FRACTION_VERS_DECIMAL,
  NUMERATEURS_CENTIEMES,
  NUMERATEURS_DENOMINATEUR_UN,
  NUMERATEURS_DIXIEMES,
  NUMERATEURS_MILLIEMES,
} from "./fraction-vers-decimal.js?v=44";
import {
  MICRO_NOTION_NC03,
  MICRO_NOTION_NC04,
  NUMERATEURS_DEMIS,
  NUMERATEURS_QUARTS,
} from "./commun.js?v=45";

export const VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX = 4;
export const VERSION_PLANS_SERIES_NC03_NC04 = 1;

export const QUOTAS_SERIES_FRACTIONS_DECIMAUX = Object.freeze({
  5: Object.freeze({ qcm: 1, productionsLibres: 1, milliemes: 0 }),
  10: Object.freeze({ qcm: 2, productionsLibres: 1, milliemes: 0 }),
  15: Object.freeze({ qcm: 3, productionsLibres: 2, milliemes: 1 }),
  20: Object.freeze({ qcm: 4, productionsLibres: 2, milliemes: 1 }),
});

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
  4,
  100,
  2,
  10,
  2,
  4,
  10,
  100,
  100,
  4,
]);

const RECETTE_NC03_ISOLEE = Object.freeze([
  2, 4, 10, 100, 2,
  4, 10, 100, 1, 2,
  4, 10, 100, 2, 4,
  10, 100, 1, 100, 100,
]);

const RECETTE_NC04_ISOLEE = Object.freeze([
  2, 4, 10, 100, 4,
  2, 10, 100, 4, 2,
  10, 100, 4, 2, 10,
  100, 4, 2, 100, 10,
]);

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

function quotaProductionsLibres(nombreQuestions) {
  if (nombreQuestions >= 15) return 2;
  return nombreQuestions >= 5 ? 1 : 0;
}

function reserverProductionsLibres(files, aleatoire, nombreQuestions) {
  const quota = quotaProductionsLibres(nombreQuestions);
  if (quota === 0) return;
  const fileNC04 = files.get(MICRO_NOTION_NC04);
  if (fileNC04.length < quota) {
    throw new Error(
      "serie fractions-decimaux : places insuffisantes pour les fractions libres",
    );
  }
  const categories = quota === 2
    ? ["demis-quarts", "decimales"]
    : [aleatoire.choix(["demis-quarts", "decimales"])];
  const tous = [...files.values()].flat();
  const compter = (elements) => elements.reduce((comptes, element) => {
    comptes.set(element.denominateur, (comptes.get(element.denominateur) ?? 0) + 1);
    return comptes;
  }, new Map());
  const comptesGlobaux = compter(tous);
  const comptesNC04 = compter(fileNC04);
  categories.forEach((categorieLibre) => {
    const positions = fileNC04.map((element, position) => ({ element, position }));
    const doublonsNC04 = aleatoire.melange(positions.filter(({ element }) =>
      element.forme !== "fraction-libre"
      && (comptesNC04.get(element.denominateur) ?? 0) > 1));
    const doublonsGlobaux = aleatoire.melange(positions.filter(({ element }) =>
      element.forme !== "fraction-libre"
      && (comptesGlobaux.get(element.denominateur) ?? 0) > 1));
    const choisi = doublonsNC04[0] ?? doublonsGlobaux[0];
    if (!choisi) {
      throw new Error(
        "serie fractions-decimaux : aucune famille répétée à remplacer par une fraction libre",
      );
    }
    const { element, position } = choisi;
    comptesGlobaux.set(
      element.denominateur,
      comptesGlobaux.get(element.denominateur) - 1,
    );
    comptesNC04.set(
      element.denominateur,
      comptesNC04.get(element.denominateur) - 1,
    );
    fileNC04[position] = {
      microNotion: MICRO_NOTION_NC04,
      forme: "fraction-libre",
      categorieLibre,
    };
  });
}

function reserverMillieme(files, aleatoire, nombreQuestions) {
  if (nombreQuestions < 15) return;
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

function marquerClasse(
  elements,
  aleatoire,
  classeValeur,
  contexte,
  denominateurs = [2, 4, 10, 100],
) {
  const predicat = (element) => element.forme !== "fraction-libre"
    && denominateurs.includes(element.denominateur)
    // Un demi propre ne possède qu'une seule valeur (1/2). En forcer un dans
    // chaque sens rendrait les deux valeurs rationnelles identiques.
    && (classeValeur !== "inferieur-un" || element.denominateur !== 2);
  const candidats = aleatoire.melange(
    elements.filter((element) => element.classeValeur === undefined && predicat(element)),
  );
  if (candidats.length === 0) {
    throw new Error(
      `serie fractions-decimaux : cas ${classeValeur} impossible ${contexte}`,
    );
  }
  candidats[0].classeValeur = classeValeur;
}

function marquerPropreEtImpropre(
  elements,
  aleatoire,
  contexte,
  denominateurs,
) {
  // Dans une série courte, les fractions décimales peuvent porter ces deux
  // classes : le seul quart disponible n'est donc plus condamné à rester
  // inférieur à 1. À partir de 15 questions, l'appelant resserre ces repères
  // sur les demis et les quarts, dont plusieurs exemplaires sont disponibles.
  marquerClasse(elements, aleatoire, "inferieur-un", contexte, denominateurs);
  marquerClasse(
    elements,
    aleatoire,
    "superieur-un-non-entier",
    contexte,
    denominateurs,
  );
}

function marquerCasStructurels(files, aleatoire, nombreQuestions) {
  if (nombreQuestions < 5) return;
  if (nombreQuestions < 10) {
    marquerPropreEtImpropre(
      [...files.values()].flat(),
      aleatoire,
      "dans la série courte",
      [2, 4, 10, 100],
    );
    return;
  }
  for (const microNotion of [MICRO_NOTION_NC03, MICRO_NOTION_NC04]) {
    marquerPropreEtImpropre(
      files.get(microNotion),
      aleatoire,
      `pour ${microNotion}`,
      nombreQuestions < 15 ? [2, 4, 10, 100] : [2, 4],
    );
  }
  if (nombreQuestions >= 20) {
    // NC-03 possède déjà un cas /1 dans cette longueur. Le forcer en plus à
    // cacher un entier dans /2, /4, /10 ou /100 rendrait certaines banques de
    // vingt incompatibles avec l'invariant des vingt valeurs distinctes.
    marquerClasse(
      files.get(MICRO_NOTION_NC04),
      aleatoire,
      "entier",
      `pour ${MICRO_NOTION_NC04}`,
    );
  } else {
    marquerClasse(
      [...files.values()].flat(),
      aleatoire,
      "entier",
      "dans la série",
    );
  }
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
  const cibles = element.forme === "fraction-libre"
    ? element.categorieLibre === "demis-quarts"
      ? CIBLES_FRACTION_LIBRE_DEMIS_QUARTS
      : element.categorieLibre === "decimales"
        ? CIBLES_FRACTION_LIBRE_DECIMALES
        : CIBLES_FRACTION_LIBRE
    : NUMERATEURS_PAR_DENOMINATEUR[element.denominateur].map(
      (numerateur) => ({ numerateur, denominateur: element.denominateur }),
    );
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
  const priorites = aleatoire.melange(
    elements.map((_, index) => index),
  );
  const utilises = Array(elements.length).fill(false);
  const ordreIndices = [];
  const impasses = new Set();

  const estQcm = (element) => element.presentation === "qcm-diagnostique";
  const estLibre = (element) => element.forme === "fraction-libre";

  function longueurRunTerminal(propriete, valeur) {
    let longueur = 0;
    for (let index = ordreIndices.length - 1; index >= 0 && longueur < 2; index -= 1) {
      if (elements[ordreIndices[index]][propriete] !== valeur) break;
      longueur += 1;
    }
    return longueur;
  }

  function resteFaisable() {
    const restants = priorites.filter((index) => !utilises[index]);
    const dernier = ordreIndices.length > 0
      ? elements[ordreIndices.at(-1)]
      : null;
    for (const predicat of [estQcm, estLibre]) {
      const marques = restants.filter((index) => predicat(elements[index])).length;
      const nonMarques = restants.length - marques;
      if (marques > nonMarques + Number(!dernier || !predicat(dernier))) {
        return false;
      }
    }

    const proprietes = new Set(elements.map((element) => element.microNotion)).size > 1
      ? ["microNotion", "denominateur"]
      : ["denominateur"];
    for (const propriete of proprietes) {
      const valeurs = new Set(restants.map((index) => elements[index][propriete]));
      for (const valeur of valeurs) {
        const memes = restants.filter(
          (index) => elements[index][propriete] === valeur,
        ).length;
        const autres = restants.length - memes;
        const runTerminal = longueurRunTerminal(propriete, valeur);
        if (memes > 2 * (autres + 1) - runTerminal) return false;
      }
    }
    return true;
  }

  function estCompatible(index) {
    const candidat = elements[index];
    const dernier = ordreIndices.length > 0
      ? elements[ordreIndices.at(-1)]
      : null;
    const avantDernier = ordreIndices.length > 1
      ? elements[ordreIndices.at(-2)]
      : null;
    if (dernier && estQcm(dernier) && estQcm(candidat)) return false;
    if (dernier && estLibre(dernier) && estLibre(candidat)) return false;
    if (
      new Set(elements.map((element) => element.microNotion)).size > 1
      &&
      avantDernier
      && dernier.microNotion === candidat.microNotion
      && avantDernier.microNotion === candidat.microNotion
    ) return false;
    return !(
      avantDernier
      && dernier.denominateur === candidat.denominateur
      && avantDernier.denominateur === candidat.denominateur
    );
  }

  function placer(masque = 0) {
    if (ordreIndices.length === elements.length) return true;
    const avantDernier = ordreIndices.at(-2) ?? -1;
    const dernier = ordreIndices.at(-1) ?? -1;
    const cleImpasses = `${masque}:${avantDernier}:${dernier}`;
    if (impasses.has(cleImpasses)) return false;

    const signaturesEssayees = new Set();
    for (const index of priorites) {
      if (utilises[index] || !estCompatible(index)) continue;
      const element = elements[index];
      const signature = [
        element.microNotion,
        estQcm(element),
        estLibre(element),
        element.denominateur,
      ].join(":");
      if (signaturesEssayees.has(signature)) continue;
      signaturesEssayees.add(signature);

      utilises[index] = true;
      ordreIndices.push(index);
      if (resteFaisable() && placer(masque | (1 << index))) return true;
      ordreIndices.pop();
      utilises[index] = false;
    }
    impasses.add(cleImpasses);
    return false;
  }

  if (!placer()) {
    const signature = elements.map((element) => [
      element.microNotion,
      element.presentation,
      element.forme ?? "denominateur-impose",
      element.denominateur,
    ].join(":")).join("|");
    throw new Error(
      `serie fractions-decimaux : ordre contraint impossible (${signature})`,
    );
  }
  return ordreIndices.map((index) => elements[index]);
}

function repartitionPresentations(nombreQuestions) {
  const qcm = nombreQuestions >= 5
    ? Math.max(1, Math.round(nombreQuestions * 0.2))
    : 0;
  return {
    "qcm-diagnostique": qcm,
    abstraite: nombreQuestions - qcm,
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

  const aleatoire = creerGenerateur(
    `fractions-decimaux-plan-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}:${nombreQuestions}`,
  );
  reserverProductionsLibres(files, aleatoire, nombreQuestions);
  reserverMillieme(files, aleatoire, nombreQuestions);
  marquerCasStructurels(files, aleatoire, nombreQuestions);
  parametrerNumerateurs(files, aleatoire);
  melangerFiles(files, aleatoire);
  attribuerPresentations(files, aleatoire, nombreQuestions);
  const aleatoireOrdre = creerGenerateur(
    `fractions-decimaux-ordre-contraint-v${VERSION_PLAN_SERIE_FRACTIONS_DECIMAUX}:${graine}:${nombreQuestions}`,
  );
  const ordre = ordonnerElements([...files.values()].flat(), aleatoireOrdre);
  return ordre.map((element, position) => {
    const { microNotion } = element;
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

function recetteIsoleePour(microNotion) {
  return microNotion === MICRO_NOTION_NC03
    ? RECETTE_NC03_ISOLEE
    : RECETTE_NC04_ISOLEE;
}

function reserverProductionsLibresNC04(file, aleatoire, nombreQuestions) {
  const quota = nombreQuestions >= 15 ? 2 : nombreQuestions >= 10 ? 1 : 0;
  if (quota === 0) return;
  const categories = quota === 2
    ? ["demis-quarts", "decimales"]
    : [aleatoire.choix(["demis-quarts", "decimales"])];
  categories.forEach((categorieLibre) => {
    const comptes = file.reduce((resultat, element) => {
      resultat.set(element.denominateur, (resultat.get(element.denominateur) ?? 0) + 1);
      return resultat;
    }, new Map());
    const candidats = aleatoire.melange(file
      .map((element, position) => ({ element, position }))
      .filter(({ element }) => element.forme !== "fraction-libre"
        && (comptes.get(element.denominateur) ?? 0) > 1));
    if (candidats.length === 0) {
      throw new Error("serie NC04 : aucune famille répétée à remplacer");
    }
    file[candidats[0].position] = {
      microNotion: MICRO_NOTION_NC04,
      forme: "fraction-libre",
      categorieLibre,
    };
  });
}

function reserverMilliemeIsole(file, nombreQuestions) {
  if (nombreQuestions < 15) return;
  const index = file.findLastIndex((element) =>
    element.forme !== "fraction-libre" && element.denominateur === 100);
  if (index < 0) throw new Error("serie fractions-decimaux : place de millième absente");
  file[index] = { ...file[index], denominateur: 1000 };
}

function marquerCasStructurelsIsoles(file, aleatoire, nombreQuestions) {
  if (nombreQuestions < 5) return;
  marquerPropreEtImpropre(
    file,
    aleatoire,
    "dans la série isolée",
    nombreQuestions < 15 ? [2, 4, 10, 100] : [2, 4],
  );
  if (nombreQuestions >= 10) {
    marquerClasse(file, aleatoire, "entier", "dans la série isolée");
  }
}

function planifierSerieIsolee({ microNotion, graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  const recette = recetteIsoleePour(microNotion);
  const file = recette.slice(0, nombreQuestions).map((denominateur) => ({
    microNotion,
    denominateur,
    forme: microNotion === MICRO_NOTION_NC04 ? "denominateur-impose" : undefined,
  }));
  const aleatoire = creerGenerateur(
    `${microNotion}-plan-v${VERSION_PLANS_SERIES_NC03_NC04}:${graine}:${nombreQuestions}`,
  );
  if (microNotion === MICRO_NOTION_NC04) {
    reserverProductionsLibresNC04(file, aleatoire, nombreQuestions);
  }
  reserverMilliemeIsole(file, nombreQuestions);
  marquerCasStructurelsIsoles(file, aleatoire, nombreQuestions);
  const files = new Map([[microNotion, file]]);
  parametrerNumerateurs(files, aleatoire);
  attribuerPresentations(files, aleatoire, nombreQuestions);
  const ordre = ordonnerElements(file, creerGenerateur(
    `${microNotion}-ordre-v${VERSION_PLANS_SERIES_NC03_NC04}:${graine}:${nombreQuestions}`,
  ));
  return ordre.map((element, position) => ({
    ...element,
    position,
    gabarit: gabaritPour(microNotion),
    parametres: {
      numerateur: element.numerateur,
      denominateur: element.denominateur,
      presentation: element.presentation,
      ...(element.forme === undefined ? {} : { forme: element.forme }),
    },
  }));
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
