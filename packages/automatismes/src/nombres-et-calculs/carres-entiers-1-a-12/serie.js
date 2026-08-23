// Plan de série NC-02 — quotas validés, alternance des familles et couverture
// des treize bases. Même graine + même longueur redonne le même plan et les
// mêmes questions.

import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import {
  definirPaquetPondere,
  ordonnerEnLimitantRepetitions,
  tirerProfilsPonderes,
} from "../../../../moteur-exercices/src/paquets-ponderes.js?v=53";
import {
  GABARIT_CALCUL_COURT_CARRE,
  BASES_CALCUL_COURT,
  OPERATIONS_CALCUL_COURT,
} from "./calcul-court.js?v=53";
import {
  BASES_ENCADREMENT_CARRE,
  FORMULATIONS_CALCUL_DIRECT,
  FORMULATIONS_CALCUL_DIRECT_QCM,
  GABARIT_CALCUL_DIRECT_CARRE,
} from "./calcul-direct.js?v=53";
import {
  BASES_CARRE_QUADRILLE,
  FORMES_CARRE_QUADRILLE,
  GABARIT_CARRE_QUADRILLE,
} from "./carre-quadrille.js?v=53";
import {
  BASES_CARRES_ENTIERS,
} from "./commun.js?v=53";
import {
  FORMULATIONS_RECONNAITRE_CARRES,
  GABARIT_RECONNAITRE_CARRES,
} from "./reconnaitre-carres.js?v=53";
import {
  FORMES_RETROUVER_ENTIER,
  GABARIT_RETROUVER_ENTIER_CARRE,
} from "./retrouver-entier.js?v=53";
import {
  BASES_SENS_NOTATION,
  GABARIT_SENS_NOTATION_CARRE,
} from "./sens-notation.js?v=53";

export const VERSION_PLAN_SERIE_NC02 = 3;

export const FAMILLES_NC02 = Object.freeze({
  F1: "calcul-direct",
  F2: "retrouver-entier",
  F3: "sens-notation",
  F4: "reconnaitre-carres",
  F5: "carre-quadrille",
  F6: "calcul-court",
});

const ORDRE_FAMILLES = Object.freeze(Object.values(FAMILLES_NC02));
export const QUOTAS_SERIES_NC02 = Object.freeze({
  20: Object.freeze([8, 5, 1, 2, 2, 2]),
});

export const PAQUET_FAMILLES_NC02 = definirPaquetPondere({
  id: "nc02-familles",
  profils: [
    { id: "f1-calculer", quota: 3, categorie: "principale", famille: FAMILLES_NC02.F1, formulation: "calculer" },
    { id: "f1-carre-de", quota: 2, categorie: "principale", famille: FAMILLES_NC02.F1, formulation: "carre-de" },
    { id: "f1-completer", quota: 1, categorie: "secondaire", famille: FAMILLES_NC02.F1, formulation: "completer" },
    { id: "f1-choisir-resultat", quota: 1, categorie: "rare", famille: FAMILLES_NC02.F1, formulation: "choisir-resultat" },
    { id: "f1-encadrer-resultat", quota: 1, categorie: "rare", famille: FAMILLES_NC02.F1, formulation: "encadrer-resultat" },
    { id: "f2-question-verbale", quota: 2, categorie: "principale", famille: FAMILLES_NC02.F2, forme: "question-verbale" },
    { id: "f2-produit-facteurs-egaux", quota: 2, categorie: "secondaire", famille: FAMILLES_NC02.F2, forme: "produit-facteurs-egaux" },
    { id: "f2-egalite-carre", quota: 1, categorie: "secondaire", famille: FAMILLES_NC02.F2, forme: "egalite-carre" },
    { id: "f3-sens-notation", quota: 1, categorie: "rare", famille: FAMILLES_NC02.F3 },
    { id: "f4-nombres-carres", quota: 1, categorie: "secondaire", famille: FAMILLES_NC02.F4, formulation: "nombres-carres", nombreCarres: 1 },
    { id: "f4-carres-parfaits", quota: 1, categorie: "secondaire", famille: FAMILLES_NC02.F4, formulation: "carres-parfaits", nombreCarres: 2 },
    { id: "f5-trouver-aire", quota: 1, categorie: "secondaire", famille: FAMILLES_NC02.F5, forme: "trouver-aire" },
    { id: "f5-trouver-cote", quota: 1, categorie: "secondaire", famille: FAMILLES_NC02.F5, forme: "trouver-cote" },
    { id: "f6-addition", quota: 1, categorie: "secondaire", famille: FAMILLES_NC02.F6, operation: "addition" },
    { id: "f6-soustraction", quota: 1, categorie: "secondaire", famille: FAMILLES_NC02.F6, operation: "soustraction" },
  ],
});
const GABARITS = Object.freeze({
  [FAMILLES_NC02.F1]: GABARIT_CALCUL_DIRECT_CARRE,
  [FAMILLES_NC02.F2]: GABARIT_RETROUVER_ENTIER_CARRE,
  [FAMILLES_NC02.F3]: GABARIT_SENS_NOTATION_CARRE,
  [FAMILLES_NC02.F4]: GABARIT_RECONNAITRE_CARRES,
  [FAMILLES_NC02.F5]: GABARIT_CARRE_QUADRILLE,
  [FAMILLES_NC02.F6]: GABARIT_CALCUL_COURT_CARRE,
});

const BANDES_BASES = Object.freeze([
  Object.freeze([0, 1, 2, 3, 4]),
  Object.freeze([5, 6, 7, 8]),
  Object.freeze([9, 10, 11, 12]),
]);

function exigerConfiguration(graine, nombreQuestions) {
  if (typeof graine !== "string" && !Number.isInteger(graine)) {
    throw new TypeError("serie NC-02 : graine texte ou entière requise");
  }
  if (
    !Number.isInteger(nombreQuestions) ||
    nombreQuestions < 1 ||
    nombreQuestions > 20
  ) {
    throw new RangeError("serie NC-02 : longueur attendue entre 1 et 20");
  }
}

function valeursCycliques(aleatoire, valeurs, nombre) {
  const resultat = [];
  while (resultat.length < nombre) resultat.push(...aleatoire.melange(valeurs));
  return resultat.slice(0, nombre);
}

function basesEquilibrees(aleatoire) {
  const bandes = aleatoire
    .melange(BANDES_BASES)
    .map((bande) => aleatoire.melange(bande));
  const resultat = [];
  const tailleMaximale = Math.max(...bandes.map((bande) => bande.length));
  for (let rang = 0; rang < tailleMaximale; rang += 1) {
    for (const bande of bandes) {
      if (bande[rang] !== undefined) resultat.push(bande[rang]);
    }
  }
  return resultat;
}

function attribuerBasesRappel(aleatoire, descripteurs) {
  const rappels = descripteurs.filter(({ famille }) =>
    [FAMILLES_NC02.F1, FAMILLES_NC02.F2].includes(famille));
  const bases = basesEquilibrees(aleatoire).slice(0, rappels.length);

  rappels.forEach((descripteur, index) => {
    descripteur.parametres.base = bases[index];
  });

  const encadrement = rappels.find(({ famille, parametres }) =>
    famille === FAMILLES_NC02.F1
    && parametres.formulation === "encadrer-resultat");
  if (encadrement && !BASES_ENCADREMENT_CARRE.includes(encadrement.parametres.base)) {
    const echange = rappels.find(({ parametres }) =>
      parametres !== encadrement.parametres
      && BASES_ENCADREMENT_CARRE.includes(parametres.base));
    if (!echange) {
      const utilisees = new Set(rappels.map(({ parametres }) => parametres.base));
      const compatible = basesEquilibrees(aleatoire).find((base) =>
        BASES_ENCADREMENT_CARRE.includes(base) && !utilisees.has(base));
      if (compatible === undefined) {
        throw new Error("serie NC-02 : aucune base compatible avec l'encadrement");
      }
      encadrement.parametres.base = compatible;
      return;
    }
    const baseTemporaire = encadrement.parametres.base;
    encadrement.parametres.base = echange.parametres.base;
    echange.parametres.base = baseTemporaire;
  }
}

function formesInverse(aleatoire, nombre) {
  const produit = "produit-facteurs-egaux";
  const autres = FORMES_RETROUVER_ENTIER.filter((forme) => forme !== produit);
  if (nombre === 1) return [aleatoire.choix(autres)];
  if (nombre === 2) return aleatoire.melange([produit, aleatoire.choix(autres)]);
  return valeursCycliques(aleatoire, FORMES_RETROUVER_ENTIER, nombre);
}

function formulationsDirectes(aleatoire, nombre) {
  const saisies = FORMULATIONS_CALCUL_DIRECT.filter(
    (formulation) => !FORMULATIONS_CALCUL_DIRECT_QCM.includes(formulation),
  );
  if (nombre === 0) return [];
  if ([1, 3].includes(nombre)) {
    return valeursCycliques(aleatoire, saisies, nombre);
  }
  if (nombre === 2) return aleatoire.melange(["calculer", "carre-de"]);
  if (nombre === 4) {
    return aleatoire.melange([
      ...saisies,
      aleatoire.choix(FORMULATIONS_CALCUL_DIRECT_QCM),
    ]);
  }
  if (nombre === 5) {
    return aleatoire.melange([
      ...valeursCycliques(aleatoire, saisies, 4),
      aleatoire.choix(FORMULATIONS_CALCUL_DIRECT_QCM),
    ]);
  }
  const coeur = nombre === 6
    ? ["calculer", "calculer", "carre-de", "completer"]
    : nombre === 8
      ? ["calculer", "calculer", "calculer", "carre-de", "carre-de", "completer"]
      : valeursCycliques(aleatoire, saisies, Math.max(0, nombre - 2));
  return aleatoire.melange([...coeur, ...FORMULATIONS_CALCUL_DIRECT_QCM]);
}

function parametrerFamilles(aleatoire, profils) {
  const descripteurs = profils.map((profil) => {
    const parametres = {};
    for (const cle of ["formulation", "forme", "nombreCarres", "operation"]) {
      if (profil[cle] !== undefined) parametres[cle] = profil[cle];
    }
    return { famille: profil.famille, parametres };
  });

  const directs = descripteurs.filter(({ famille, parametres }) =>
    famille === FAMILLES_NC02.F1 && parametres.formulation === undefined);
  formulationsDirectes(aleatoire, directs.length)
    .forEach((formulation, index) => {
      directs[index].parametres.formulation = formulation;
    });

  const inverses = descripteurs.filter(({ famille, parametres }) =>
    famille === FAMILLES_NC02.F2 && parametres.forme === undefined);
  formesInverse(aleatoire, inverses.length).forEach((forme, index) => {
    inverses[index].parametres.forme = forme;
  });

  attribuerBasesRappel(aleatoire, descripteurs);

  const notation = descripteurs.find(({ famille }) => famille === FAMILLES_NC02.F3);
  if (notation) notation.parametres.base = aleatoire.choix(BASES_SENS_NOTATION);

  const reconnaissances = descripteurs.filter(
    ({ famille }) => famille === FAMILLES_NC02.F4,
  );
  const nombresCarres = reconnaissances.length === 1
    ? [aleatoire.entier(1, 2)]
    : aleatoire.melange([1, 2]);
  const formulationsReconnaissance = valeursCycliques(
    aleatoire,
    FORMULATIONS_RECONNAITRE_CARRES,
    reconnaissances.length,
  );
  reconnaissances.forEach((descripteur, index) => {
    if (descripteur.parametres.nombreCarres === undefined) {
      descripteur.parametres.nombreCarres = nombresCarres[index];
    }
    if (descripteur.parametres.formulation === undefined) {
      descripteur.parametres.formulation = formulationsReconnaissance[index];
    }
  });

  const quadrillages = descripteurs.filter(({ famille }) => famille === FAMILLES_NC02.F5);
  const basesQuadrillage = valeursCycliques(
    aleatoire,
    BASES_CARRE_QUADRILLE,
    quadrillages.length,
  );
  valeursCycliques(aleatoire, FORMES_CARRE_QUADRILLE, quadrillages.length)
    .forEach((forme, index) => {
      if (quadrillages[index].parametres.forme === undefined) {
        quadrillages[index].parametres.forme = forme;
      }
      quadrillages[index].parametres.base = basesQuadrillage[index];
    });

  const calculsCourts = descripteurs.filter(({ famille }) => famille === FAMILLES_NC02.F6);
  valeursCycliques(aleatoire, OPERATIONS_CALCUL_COURT, calculsCourts.length)
    .forEach((operation, index) => {
      if (calculsCourts[index].parametres.operation === undefined) {
        calculsCourts[index].parametres.operation = operation;
      }
      calculsCourts[index].parametres.base = aleatoire.choix(BASES_CALCUL_COURT);
    });

  return descripteurs;
}

export function planifierSerieNC02({ graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  const aleatoire = creerGenerateur(
    `nc02-parametres-v${VERSION_PLAN_SERIE_NC02}:${graine}:${nombreQuestions}`,
  );
  const tirages = tirerProfilsPonderes({
    paquet: PAQUET_FAMILLES_NC02,
    graine: `nc02-familles-v${VERSION_PLAN_SERIE_NC02}:${graine}`,
    nombreElements: nombreQuestions,
  });
  const profils = ordonnerEnLimitantRepetitions({
    elements: tirages,
    graine: `nc02-ordre-v${VERSION_PLAN_SERIE_NC02}:${graine}`,
    cle: ({ famille }) => famille,
  });
  return parametrerFamilles(aleatoire, profils).map((descripteur, index) => ({
    ...descripteur,
    position: index,
    gabarit: GABARITS[descripteur.famille],
  }));
}

export function signatureVisibleQuestion(question) {
  return JSON.stringify({
    famille: question.classement.famille,
    enonce: question.enonce,
    choix: question.reponse.choix?.map(({ libelle }) => libelle) ?? [],
  });
}

function gabaritAvecParametres(gabarit, parametres) {
  return { ...gabarit, parametres: { ...parametres } };
}

export function genererSerieNC02({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError("serie NC-02 : registre de générateurs requis");
  }
  const plan = planifierSerieNC02({ graine, nombreQuestions });
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
    throw new Error(`serie NC-02 : doublon visible persistant à la position ${index + 1}`);
  });
}
