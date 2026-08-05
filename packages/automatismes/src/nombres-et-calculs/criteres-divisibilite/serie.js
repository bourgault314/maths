// Plan de série NC-01 — mélange les six familles validées.
//
// La logique reste volontairement locale à NC-01 : les quotas, alternances et
// critères n'ont pas vocation à devenir un moteur générique pour les futures
// notions. Même graine + même longueur = même plan et mêmes questions.

import { creerGenerateur } from "../../../../moteur-exercices/src/aleatoire.js";
import { GABARIT_AFFIRMATION_DIVISIBILITE } from "./affirmation-divisibilite.js?v=9";
import { GABARIT_CHIFFRE_MANQUANT } from "./chiffre-manquant.js?v=9";
import { GABARIT_CRITERE_PRECIS } from "./critere-precis.js?v=9";
import { GABARIT_PARTAGE_COURT } from "./partage-court.js?v=9";
import { GABARIT_SELECTION_DIVISEURS } from "./selection-diviseurs.js?v=9";
import { GABARIT_SELECTION_NOMBRES } from "./selection-nombres.js?v=9";

export const VERSION_PLAN_SERIE_NC01 = 3;

export const FAMILLES_NC01 = Object.freeze({
  F1: "critere-precis",
  F2: "selection-diviseurs",
  F3: "selection-nombres",
  F4: "affirmation-divisibilite",
  F5: "chiffre-manquant",
  F6: "partage-court",
});

const DIVISEURS = Object.freeze([2, 3, 5, 9, 10]);
const RECETTE_DIX = Object.freeze([
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F3,
  FAMILLES_NC01.F4,
  FAMILLES_NC01.F5,
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F3,
  FAMILLES_NC01.F4,
  FAMILLES_NC01.F6,
]);

// Une série courte reste une révision, pas une validation exhaustive. Elle
// conserve néanmoins le sens du partage (F6), plus utile ici qu'une première
// tâche inverse sur le chiffre manquant. Dès dix questions, les six familles
// et les cinq critères sont réellement distribués.
const RECETTE_RESTE = Object.freeze([
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F3,
  FAMILLES_NC01.F4,
  FAMILLES_NC01.F6,
  FAMILLES_NC01.F5,
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F3,
]);

const COMPLEMENT_QUINZE = Object.freeze([
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F3,
  FAMILLES_NC01.F5,
  FAMILLES_NC01.F6,
]);

// À vingt questions, les trois sous-formes de F5 et les trois sous-formes de
// F6 doivent toutes apparaître. Cela approfondit la couverture sans laisser
// croire qu'une seule réussite suffit à attester une maîtrise durable.
const COMPLEMENT_VINGT = Object.freeze([
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F3,
  FAMILLES_NC01.F4,
  FAMILLES_NC01.F5,
  FAMILLES_NC01.F6,
  FAMILLES_NC01.F1,
  FAMILLES_NC01.F2,
  FAMILLES_NC01.F5,
  FAMILLES_NC01.F6,
]);

const GABARITS = Object.freeze({
  [FAMILLES_NC01.F1]: GABARIT_CRITERE_PRECIS,
  [FAMILLES_NC01.F2]: GABARIT_SELECTION_DIVISEURS,
  [FAMILLES_NC01.F3]: GABARIT_SELECTION_NOMBRES,
  [FAMILLES_NC01.F4]: GABARIT_AFFIRMATION_DIVISIBILITE,
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
  if (nombreQuestions === 20) {
    return [...RECETTE_DIX, ...COMPLEMENT_VINGT];
  }
  const cyclesComplets = Math.floor(nombreQuestions / RECETTE_DIX.length);
  const reste = nombreQuestions % RECETTE_DIX.length;
  const recette = Array.from(
    { length: cyclesComplets },
    () => RECETTE_DIX,
  ).flat();
  const complement = reste === 5 && cyclesComplets > 0
    ? COMPLEMENT_QUINZE
    : RECETTE_RESTE;
  return [...recette, ...complement.slice(0, reste)];
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
  const criteres = valeursCycliques(aleatoire, DIVISEURS, cibles.length);
  cibles.forEach((descripteur, index) => {
    const cle = descripteur.famille === FAMILLES_NC01.F5 ? "critere" : "diviseur";
    descripteur.parametres[cle] = criteres[index];
  });

  for (const chiffreManquant of cibles.filter(({ famille }) => famille === FAMILLES_NC01.F5)) {
    if (chiffreManquant.parametres.sousForme !== "unique") continue;
    if ([9, 10].includes(chiffreManquant.parametres.critere)) continue;
    const echange = cibles.find((candidat) =>
      candidat !== chiffreManquant &&
      [9, 10].includes(candidat.parametres.diviseur),
    );
    if (!echange) {
      chiffreManquant.parametres.sousForme = "plus-petit";
      continue;
    }
    const ancien = chiffreManquant.parametres.critere;
    chiffreManquant.parametres.critere = echange.parametres.diviseur;
    echange.parametres.diviseur = ancien;
  }
}

function parametrerFamilles(aleatoire, familles) {
  const descripteurs = familles.map((famille) => ({ famille, parametres: {} }));

  const f1 = descripteurs.filter(({ famille }) => famille === FAMILLES_NC01.F1);
  valeursCycliques(aleatoire, ["oui", "non"], f1.length)
    .forEach((verdict, index) => { f1[index].parametres.verdict = verdict; });

  const f4 = descripteurs.filter(({ famille }) => famille === FAMILLES_NC01.F4);
  valeursCycliques(aleatoire, ["vrai", "faux"], f4.length)
    .forEach((verdict, index) => { f4[index].parametres.verdict = verdict; });
  valeursCycliques(aleatoire, ["vrai-faux", "justification"], f4.length)
    .forEach((sousForme, index) => { f4[index].parametres.sousForme = sousForme; });

  const f5 = descripteurs.filter(({ famille }) => famille === FAMILLES_NC01.F5);
  valeursCycliques(aleatoire, ["unique", "toutes-solutions", "plus-petit"], f5.length)
    .forEach((sousForme, index) => { f5[index].parametres.sousForme = sousForme; });

  const f6 = descripteurs.filter(({ famille }) => famille === FAMILLES_NC01.F6);
  valeursCycliques(aleatoire, ["oui-non", "groupes-possibles", "retrait-minimal"], f6.length)
    .forEach((sousForme, index) => {
      f6[index].parametres.sousForme = sousForme;
      if (sousForme !== "groupes-possibles") {
        f6[index].parametres.diviseur = aleatoire.choix(DIVISEURS);
      }
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
