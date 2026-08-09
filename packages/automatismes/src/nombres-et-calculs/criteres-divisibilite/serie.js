// Plan de série NC-01 — mélange les cinq familles retenues.
//
// La logique reste volontairement locale à NC-01 : les quotas, alternances et
// critères n'ont pas vocation à devenir un moteur générique pour les futures
// notions. Même graine + même longueur = même plan et mêmes questions.

import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import { GABARIT_CHIFFRE_MANQUANT } from "./chiffre-manquant.js?v=22";
import { GABARIT_CRITERE_PRECIS } from "./critere-precis.js?v=22";
import { GABARIT_PARTAGE_COURT } from "./partage-court.js?v=22";
import { GABARIT_SELECTION_DIVISEURS } from "./selection-diviseurs.js?v=22";
import { GABARIT_SELECTION_NOMBRES } from "./selection-nombres.js?v=22";

export const VERSION_PLAN_SERIE_NC01 = 6;

export const FAMILLES_NC01 = Object.freeze({
  F1: "critere-precis",
  F2: "selection-diviseurs",
  F3: "selection-nombres",
  F5: "chiffre-manquant",
  F6: "partage-court",
});

const DIVISEURS = Object.freeze([2, 3, 5, 9, 10]);
// Les cinq premières positions donnent la révision courte validée : une F1,
// deux F2, une F3 et une situation de partage. Chaque bloc de cinq suivant
// ajoute ensuite une occurrence de chaque famille. Les séries 5, 10, 15 et 20
// portent donc exactement les quotas décidés, sans cas « Aucun » imposé.
const RECETTE_INITIALE = Object.freeze([
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F3,
  FAMILLES_NC01.F6,
  FAMILLES_NC01.F2,
]);

const COMPLEMENT_CINQ = Object.freeze([
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F3,
  FAMILLES_NC01.F5,
  FAMILLES_NC01.F6,
]);

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

function recettePour(nombreQuestions) {
  const initiale = RECETTE_INITIALE.slice(
    0,
    Math.min(nombreQuestions, RECETTE_INITIALE.length),
  );
  const restant = nombreQuestions - initiale.length;
  const cyclesComplets = Math.floor(restant / COMPLEMENT_CINQ.length);
  const reste = restant % COMPLEMENT_CINQ.length;
  return [
    ...initiale,
    ...Array.from({ length: cyclesComplets }, () => COMPLEMENT_CINQ).flat(),
    ...COMPLEMENT_CINQ.slice(0, reste),
  ];
}

function resteArrangeable(compte, precedent) {
  const total = [...compte.values()].reduce((somme, nombre) => somme + nombre, 0);
  return [...compte.entries()].every(([famille, nombre]) =>
    nombre <= (famille === precedent ? Math.floor(total / 2) : Math.ceil(total / 2)),
  );
}

function melangerFamilles(aleatoire, familles) {
  const compte = new Map();
  for (const famille of familles) compte.set(famille, (compte.get(famille) ?? 0) + 1);
  const resultat = [];

  while (resultat.length < familles.length) {
    const precedent = resultat.at(-1);
    const candidates = aleatoire.melange(
      [...compte.entries()]
        .filter(([, nombre]) => nombre > 0)
        .map(([famille]) => famille),
    ).filter((famille) =>
      famille !== precedent &&
      (resultat.length > 0 || familles.length === 1 || [FAMILLES_NC01.F1, FAMILLES_NC01.F2].includes(famille)),
    );
    const choisie = candidates.find((famille) => {
      compte.set(famille, compte.get(famille) - 1);
      const possible = resteArrangeable(compte, famille);
      compte.set(famille, compte.get(famille) + 1);
      return possible;
    });
    if (!choisie) {
      throw new Error("serie NC-01 : impossible d'ordonner les familles sans répétition voisine");
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
    if (index === -1) {
      throw new Error(
        `serie NC-01 : aucun critère compatible avec ${descripteur.parametres.sousForme}`,
      );
    }
    attribuer(descripteur, criteresDisponibles.splice(index, 1)[0]);
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
  const sousFormesPartage = f6.length === 1
    ? ["oui-non"]
    : valeursCycliques(aleatoire, ["oui-non", "retrait-minimal"], f6.length);
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
    `nc01-plan-v${VERSION_PLAN_SERIE_NC01}:${graine}:${nombreQuestions}`,
  );
  const familles = melangerFamilles(aleatoire, recettePour(nombreQuestions));
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
