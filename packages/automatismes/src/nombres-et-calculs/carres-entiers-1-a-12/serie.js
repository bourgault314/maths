// Plan de série NC-02 — quotas validés, alternance des familles et couverture
// des treize bases. Même graine + même longueur redonne le même plan et les
// mêmes questions.

import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import {
  GABARIT_CALCUL_COURT_CARRE,
  BASES_CALCUL_COURT,
  OPERATIONS_CALCUL_COURT,
} from "./calcul-court.js?v=25";
import {
  BASES_ENCADREMENT_CARRE,
  FORMULATIONS_CALCUL_DIRECT,
  FORMULATIONS_CALCUL_DIRECT_QCM,
  GABARIT_CALCUL_DIRECT_CARRE,
} from "./calcul-direct.js?v=25";
import {
  BASES_CARRE_QUADRILLE,
  FORMES_CARRE_QUADRILLE,
  GABARIT_CARRE_QUADRILLE,
} from "./carre-quadrille.js?v=25";
import {
  BASES_CARRES_ENTIERS,
} from "./commun.js?v=25";
import {
  FORMULATIONS_RECONNAITRE_CARRES,
  GABARIT_RECONNAITRE_CARRES,
} from "./reconnaitre-carres.js?v=25";
import {
  FORMES_RETROUVER_ENTIER,
  GABARIT_RETROUVER_ENTIER_CARRE,
} from "./retrouver-entier.js?v=25";
import {
  BASES_SENS_NOTATION,
  GABARIT_SENS_NOTATION_CARRE,
} from "./sens-notation.js?v=25";

export const VERSION_PLAN_SERIE_NC02 = 2;

export const FAMILLES_NC02 = Object.freeze({
  F1: "calcul-direct",
  F2: "retrouver-entier",
  F3: "sens-notation",
  F4: "reconnaitre-carres",
  F5: "carre-quadrille",
  F6: "calcul-court",
});

export const QUOTAS_SERIES_NC02 = Object.freeze({
  5: Object.freeze([2, 1, 1, 1, 0, 0]),
  10: Object.freeze([4, 2, 1, 1, 1, 1]),
  15: Object.freeze([6, 4, 1, 1, 1, 2]),
  20: Object.freeze([8, 5, 1, 2, 2, 2]),
});

// Les longueurs intermédiaires servent uniquement lorsqu'une séance mélange
// plusieurs notions. Les quatre jalons validés ci-dessus conservent exactement
// leurs quotas et leur génération historiques.
const RECETTE_PROGRESSIVE_NC02 = Object.freeze([
  FAMILLES_NC02.F1,
  FAMILLES_NC02.F2,
  FAMILLES_NC02.F3,
  FAMILLES_NC02.F1,
  FAMILLES_NC02.F4,
  FAMILLES_NC02.F2,
  FAMILLES_NC02.F5,
  FAMILLES_NC02.F6,
  FAMILLES_NC02.F1,
  FAMILLES_NC02.F1,
  FAMILLES_NC02.F2,
  FAMILLES_NC02.F6,
  FAMILLES_NC02.F1,
  FAMILLES_NC02.F2,
  FAMILLES_NC02.F1,
  FAMILLES_NC02.F4,
  FAMILLES_NC02.F1,
  FAMILLES_NC02.F5,
  FAMILLES_NC02.F2,
  FAMILLES_NC02.F1,
]);

const ORDRE_FAMILLES = Object.freeze(Object.values(FAMILLES_NC02));
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

function recettePour(nombreQuestions) {
  if (Object.hasOwn(QUOTAS_SERIES_NC02, nombreQuestions)) {
    return QUOTAS_SERIES_NC02[nombreQuestions].flatMap((nombre, index) =>
      Array.from({ length: nombre }, () => ORDRE_FAMILLES[index]));
  }
  return RECETTE_PROGRESSIVE_NC02.slice(0, nombreQuestions);
}

function resteArrangeable(compte, precedent) {
  const total = [...compte.values()].reduce((somme, nombre) => somme + nombre, 0);
  return [...compte.entries()].every(([famille, nombre]) =>
    nombre <= (famille === precedent ? Math.floor(total / 2) : Math.ceil(total / 2)),
  );
}

function melangerFamilles(aleatoire, familles) {
  const compte = new Map();
  familles.forEach((famille) => {
    compte.set(famille, (compte.get(famille) ?? 0) + 1);
  });
  const resultat = [];
  while (resultat.length < familles.length) {
    const precedent = resultat.at(-1);
    const candidates = aleatoire.melange(
      [...compte.entries()]
        .filter(([, nombre]) => nombre > 0)
        .map(([famille]) => famille),
    ).filter((famille) =>
      famille !== precedent &&
      (
        resultat.length > 0 ||
        [FAMILLES_NC02.F1, FAMILLES_NC02.F2].includes(famille)
      ));
    const choisie = candidates.find((famille) => {
      compte.set(famille, compte.get(famille) - 1);
      const possible = resteArrangeable(compte, famille);
      compte.set(famille, compte.get(famille) + 1);
      return possible;
    });
    if (!choisie) {
      throw new Error(
        "serie NC-02 : impossible d'ordonner les familles sans répétition voisine",
      );
    }
    compte.set(choisie, compte.get(choisie) - 1);
    resultat.push(choisie);
  }
  return resultat;
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
      throw new Error("serie NC-02 : aucune base compatible avec l'encadrement");
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

function parametrerFamilles(aleatoire, familles) {
  const descripteurs = familles.map((famille) => ({ famille, parametres: {} }));

  const directs = descripteurs.filter(({ famille }) => famille === FAMILLES_NC02.F1);
  formulationsDirectes(aleatoire, directs.length)
    .forEach((formulation, index) => {
      directs[index].parametres.formulation = formulation;
    });

  const inverses = descripteurs.filter(({ famille }) => famille === FAMILLES_NC02.F2);
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
    descripteur.parametres.nombreCarres = nombresCarres[index];
    descripteur.parametres.formulation = formulationsReconnaissance[index];
  });

  const quadrillages = descripteurs.filter(({ famille }) => famille === FAMILLES_NC02.F5);
  const basesQuadrillage = valeursCycliques(
    aleatoire,
    BASES_CARRE_QUADRILLE,
    quadrillages.length,
  );
  valeursCycliques(aleatoire, FORMES_CARRE_QUADRILLE, quadrillages.length)
    .forEach((forme, index) => {
      quadrillages[index].parametres.forme = forme;
      quadrillages[index].parametres.base = basesQuadrillage[index];
    });

  const calculsCourts = descripteurs.filter(({ famille }) => famille === FAMILLES_NC02.F6);
  valeursCycliques(aleatoire, OPERATIONS_CALCUL_COURT, calculsCourts.length)
    .forEach((operation, index) => {
      calculsCourts[index].parametres.operation = operation;
      calculsCourts[index].parametres.base = aleatoire.choix(BASES_CALCUL_COURT);
    });

  return descripteurs;
}

export function planifierSerieNC02({ graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  const aleatoire = creerGenerateur(
    `nc02-plan-v${VERSION_PLAN_SERIE_NC02}:${graine}:${nombreQuestions}`,
  );
  const familles = melangerFamilles(aleatoire, recettePour(nombreQuestions));
  return parametrerFamilles(aleatoire, familles).map((descripteur, index) => ({
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
