// Plan de série NC-01 — paquet pédagogique commun et paramètres locaux.

import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import {
  definirPaquetPondere,
  ordonnerEnLimitantRepetitions,
  tirerProfilsPonderes,
} from "../../../../moteur-exercices/src/paquets-ponderes.js?v=54";
import { GABARIT_CHIFFRE_MANQUANT } from "./chiffre-manquant.js?v=54";
import { GABARIT_CRITERE_PRECIS } from "./critere-precis.js?v=54";
import { GABARIT_PARTAGE_COURT } from "./partage-court.js?v=54";
import { GABARIT_SELECTION_DIVISEURS } from "./selection-diviseurs.js?v=54";
import { GABARIT_SELECTION_NOMBRES } from "./selection-nombres.js?v=54";

export const VERSION_PLAN_SERIE_NC01 = 7;

export const FAMILLES_NC01 = Object.freeze({
  F1: "critere-precis",
  F2: "selection-diviseurs",
  F3: "selection-nombres",
  F5: "chiffre-manquant",
  F6: "partage-court",
});

const DIVISEURS = Object.freeze([2, 3, 5, 9, 10]);
export const PAQUET_FAMILLES_NC01 = definirPaquetPondere({
  id: "nc01-familles",
  profils: [
    { id: FAMILLES_NC01.F1, quota: 4, categorie: "principale" },
    { id: FAMILLES_NC01.F2, quota: 5, categorie: "principale" },
    { id: FAMILLES_NC01.F3, quota: 4, categorie: "secondaire" },
    { id: FAMILLES_NC01.F5, quota: 3, categorie: "rare" },
    { id: FAMILLES_NC01.F6, quota: 4, categorie: "secondaire" },
  ],
});

const GABARITS = Object.freeze({
  [FAMILLES_NC01.F1]: GABARIT_CRITERE_PRECIS,
  [FAMILLES_NC01.F2]: GABARIT_SELECTION_DIVISEURS,
  [FAMILLES_NC01.F3]: GABARIT_SELECTION_NOMBRES,
  [FAMILLES_NC01.F5]: GABARIT_CHIFFRE_MANQUANT,
  [FAMILLES_NC01.F6]: GABARIT_PARTAGE_COURT,
});

function exigerConfiguration(graine, nombreQuestions) {
  if (typeof graine !== "string" && !Number.isInteger(graine)) {
    throw new TypeError("serie NC-01 : graine texte ou entière requise");
  }
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 100) {
    throw new RangeError("serie NC-01 : nombre de questions entre 1 et 100 requis");
  }
}

function valeursCycliques(aleatoire, valeurs, nombre) {
  const resultat = [];
  while (resultat.length < nombre) resultat.push(...aleatoire.melange(valeurs));
  return resultat.slice(0, nombre);
}

function attribuerCriteres(aleatoire, descripteurs) {
  const cibles = descripteurs.filter(({ famille }) => [
    FAMILLES_NC01.F1,
    FAMILLES_NC01.F3,
    FAMILLES_NC01.F5,
  ].includes(famille));
  const criteresDisponibles = valeursCycliques(aleatoire, DIVISEURS, cibles.length);
  const attribuer = (descripteur, critere) => {
    const cle = descripteur.famille === FAMILLES_NC01.F5 ? "critere" : "diviseur";
    descripteur.parametres[cle] = critere;
  };
  const contraints = cibles.filter(({ famille, parametres }) =>
    famille === FAMILLES_NC01.F5 &&
    ["unique", "plus-petit"].includes(parametres.sousForme));

  for (const descripteur of contraints) {
    const compatibles = descripteur.parametres.sousForme === "unique" ? [9, 10] : [3];
    const index = criteresDisponibles.findIndex((critere) => compatibles.includes(critere));
    const critere = index === -1
      ? aleatoire.choix(compatibles)
      : criteresDisponibles.splice(index, 1)[0];
    attribuer(descripteur, critere);
  }

  cibles
    .filter((descripteur) => !contraints.includes(descripteur))
    .forEach((descripteur) => attribuer(descripteur, criteresDisponibles.shift()));
}

function parametrerFamilles(aleatoire, familles) {
  const descripteurs = familles.map((famille) => ({ famille, parametres: {} }));

  const f1 = descripteurs.filter(({ famille }) => famille === FAMILLES_NC01.F1);
  valeursCycliques(aleatoire, ["oui", "non"], f1.length)
    .forEach((verdict, index) => { f1[index].parametres.verdict = verdict; });

  const f5 = descripteurs.filter(({ famille }) => famille === FAMILLES_NC01.F5);
  valeursCycliques(aleatoire, ["unique", "toutes-solutions", "plus-petit"], f5.length)
    .forEach((sousForme, index) => { f5[index].parametres.sousForme = sousForme; });

  const f6 = descripteurs.filter(({ famille }) => famille === FAMILLES_NC01.F6);
  const sousFormesPartage = valeursCycliques(
    aleatoire,
    ["oui-non", "retrait-minimal"],
    f6.length,
  );
  sousFormesPartage.forEach((sousForme, index) => {
      f6[index].parametres.sousForme = sousForme;
      f6[index].parametres.diviseur = aleatoire.choix(DIVISEURS);
      if (sousForme === "oui-non") {
        f6[index].parametres.verdict = aleatoire.choix(["oui", "non"]);
      }
  });

  attribuerCriteres(aleatoire, descripteurs);
  return descripteurs;
}

export function planifierSerieNC01({ graine, nombreQuestions = 10 }) {
  exigerConfiguration(graine, nombreQuestions);
  const aleatoire = creerGenerateur(
    `nc01-parametres-v${VERSION_PLAN_SERIE_NC01}:${graine}:${nombreQuestions}`,
  );
  const tirages = tirerProfilsPonderes({
    paquet: PAQUET_FAMILLES_NC01,
    graine: `nc01-familles-v${VERSION_PLAN_SERIE_NC01}:${graine}`,
    nombreElements: nombreQuestions,
  });
  const familles = ordonnerEnLimitantRepetitions({
    elements: tirages,
    graine: `nc01-ordre-v${VERSION_PLAN_SERIE_NC01}:${graine}`,
    cle: ({ id }) => id,
  }).map(({ id }) => id);
  return parametrerFamilles(aleatoire, familles).map((descripteur, index) => ({
    ...descripteur,
    position: index,
    gabarit: GABARITS[descripteur.famille],
  }));
}

export function signatureVisibleQuestion(question) {
  const choix = question.reponse.choix?.map(({ libelle }) => libelle) ?? [];
  return JSON.stringify({
    famille: question.classement.famille,
    enonce: question.enonce,
    choix,
  });
}

function gabaritAvecParametres(gabarit, parametres) {
  return {
    ...gabarit,
    parametres: { ...parametres },
  };
}

export function genererSerieNC01({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError("serie NC-01 : registre de générateurs requis");
  }
  const plan = planifierSerieNC01({ graine, nombreQuestions });
  const signatures = new Set();
  return plan.map((element, index) => {
    for (let essai = 0; essai < 20; essai += 1) {
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
    throw new Error(`serie NC-01 : doublon visible persistant à la position ${index + 1}`);
  });
}
