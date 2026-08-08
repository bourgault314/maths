// Planification commune des séries qui mélangent plusieurs automatismes.
//
// Chaque notion conserve sa propre recette et l'ordre de sa sous-série. Ce
// module répartit seulement le nombre total de questions, puis intercale les
// files obtenues de façon déterministe et sans juxtaposer deux notions égales.

import { creerGenerateur } from "../../packages/moteur-exercices/src/aleatoire.js";

export const VERSION_PLAN_SERIE_MULTINOTIONS = 1;

function exigerSelection(notions, nombreQuestions, graine) {
  if (!Array.isArray(notions) || notions.length === 0) {
    throw new RangeError("serie multi-notions : au moins une notion est requise");
  }
  if (notions.some((notion) => typeof notion !== "string" || notion === "")) {
    throw new TypeError("serie multi-notions : identifiants de notions requis");
  }
  if (new Set(notions).size !== notions.length) {
    throw new RangeError("serie multi-notions : doublons de notions interdits");
  }
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 100) {
    throw new RangeError("serie multi-notions : nombre de questions entre 1 et 100 requis");
  }
  if (notions.length > nombreQuestions) {
    throw new RangeError("serie multi-notions : chaque notion doit recevoir au moins une question");
  }
  if (typeof graine !== "string" && !Number.isInteger(graine)) {
    throw new TypeError("serie multi-notions : graine texte ou entière requise");
  }
}

export function repartirQuestionsEntreNotions({ notions, nombreQuestions, graine }) {
  exigerSelection(notions, nombreQuestions, graine);
  const minimum = Math.floor(nombreQuestions / notions.length);
  const reste = nombreQuestions % notions.length;
  const aleatoire = creerGenerateur(
    `multi-repartition-v${VERSION_PLAN_SERIE_MULTINOTIONS}:${graine}:${notions.join("|")}:${nombreQuestions}`,
  );
  const bonus = new Set(aleatoire.melange(notions).slice(0, reste));
  return notions.map((notion) => Object.freeze({
    notion,
    nombreQuestions: minimum + (bonus.has(notion) ? 1 : 0),
  }));
}

function resteArrangeable(compte, precedent) {
  const total = [...compte.values()].reduce((somme, nombre) => somme + nombre, 0);
  return [...compte.entries()].every(([notion, nombre]) =>
    nombre <= (notion === precedent ? Math.floor(total / 2) : Math.ceil(total / 2)),
  );
}

export function ordonnerNotionsDansSerie({ repartition, graine }) {
  const notions = repartition.map(({ notion }) => notion);
  const nombreQuestions = repartition.reduce(
    (total, element) => total + element.nombreQuestions,
    0,
  );
  exigerSelection(notions, nombreQuestions, graine);
  if (repartition.some(({ nombreQuestions: nombre }) => !Number.isInteger(nombre) || nombre < 1)) {
    throw new RangeError("serie multi-notions : répartition positive entière requise");
  }
  if (repartition.length === 1) {
    return Array.from(
      { length: repartition[0].nombreQuestions },
      () => repartition[0].notion,
    );
  }

  const aleatoire = creerGenerateur(
    `multi-ordre-v${VERSION_PLAN_SERIE_MULTINOTIONS}:${graine}:${notions.join("|")}:${nombreQuestions}`,
  );
  const compte = new Map(
    repartition.map(({ notion, nombreQuestions: nombre }) => [notion, nombre]),
  );
  const resultat = [];

  while (resultat.length < nombreQuestions) {
    const precedent = resultat.at(-1);
    const candidates = aleatoire.melange(
      [...compte.entries()]
        .filter(([, nombre]) => nombre > 0)
        .map(([notion]) => notion),
    ).filter((notion) => notion !== precedent);
    const choisie = candidates.find((notion) => {
      compte.set(notion, compte.get(notion) - 1);
      const possible = resteArrangeable(compte, notion);
      compte.set(notion, compte.get(notion) + 1);
      return possible;
    });
    if (!choisie) {
      throw new Error("serie multi-notions : ordre sans répétition voisine impossible");
    }
    compte.set(choisie, compte.get(choisie) - 1);
    resultat.push(choisie);
  }
  return resultat;
}

function genererSousSerie({ definition, registre, graine, nombreQuestions }) {
  const maximum = definition.nombreQuestionsMaximum ?? 100;
  if (!Number.isInteger(maximum) || maximum < 1 || nombreQuestions > maximum) {
    throw new RangeError(
      `serie multi-notions : ${definition.id} accepte au plus ${maximum} questions`,
    );
  }
  const questions = definition.creerSerie
    ? definition.creerSerie({ registre, graine, nombreQuestions })
    : Array.from(
        { length: nombreQuestions },
        (_, index) => registre.instancier(definition.gabarit, `${graine}:${index + 1}`),
      );
  if (!Array.isArray(questions) || questions.length !== nombreQuestions) {
    throw new Error(`serie multi-notions : ${definition.id} n'a pas produit ${nombreQuestions} questions`);
  }
  for (const question of questions) {
    if (question?.classement?.notion !== definition.id) {
      throw new Error(`serie multi-notions : question étrangère dans ${definition.id}`);
    }
  }
  return questions;
}

export function genererSerieMultinotions({
  definitions,
  registre,
  graine,
  nombreQuestions,
}) {
  if (!Array.isArray(definitions) || definitions.some((definition) => !definition?.id)) {
    throw new TypeError("serie multi-notions : définitions de notions requises");
  }
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError("serie multi-notions : registre de générateurs requis");
  }
  const notions = definitions.map(({ id }) => id);
  exigerSelection(notions, nombreQuestions, graine);

  // Une série ciblée garde strictement sa graine historique et son ordre.
  if (definitions.length === 1) {
    return genererSousSerie({
      definition: definitions[0],
      registre,
      graine,
      nombreQuestions,
    });
  }

  const repartition = repartirQuestionsEntreNotions({
    notions,
    nombreQuestions,
    graine,
  });
  const files = new Map();
  for (const { notion, nombreQuestions: quota } of repartition) {
    const definition = definitions.find(({ id }) => id === notion);
    const sousGraine = `${graine}:multi-v${VERSION_PLAN_SERIE_MULTINOTIONS}:${notion}:${quota}`;
    files.set(notion, genererSousSerie({
      definition,
      registre,
      graine: sousGraine,
      nombreQuestions: quota,
    }));
  }

  const positions = new Map(notions.map((notion) => [notion, 0]));
  const ordre = ordonnerNotionsDansSerie({ repartition, graine });
  const questions = ordre.map((notion) => {
    const index = positions.get(notion);
    positions.set(notion, index + 1);
    return files.get(notion)[index];
  });
  if (new Set(questions.map(({ id }) => id)).size !== questions.length) {
    throw new Error("serie multi-notions : identifiants de questions dupliqués");
  }
  return questions;
}
