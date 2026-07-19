// Contrat minimal de séance — version 1.
//
// La séance décrit la sélection et l'avancement communs au mode interactif et
// au diaporama. Le score se calcule depuis les traces ; aucune identité, durée,
// donnée d'écran ou configuration de clavier n'entre dans ce contrat.

import { estDonneePure, estIdentifiantValide } from "./gabarit.js";

export const SCHEMA_SEANCE = "mathsgo.seance/1";
export const CONTEXTES_SEANCE = Object.freeze([
  "parcours-dnb",
  "entrainement-personnalise",
]);
export const MODES_SEANCE = Object.freeze(["interactif", "diaporama"]);
export const POLITIQUES_AIDE = Object.freeze([
  "ouverte",
  "disponible",
  "indisponible",
]);
export const PHASES_SEANCE = Object.freeze(["prete", "en-cours", "terminee"]);

const FORMAT_ID_INSTANCE = /^[a-z0-9][a-z0-9._:@-]{0,199}$/;
const MAX_GRAINE_NUMERIQUE = 0xffffffff;

function validerClesConnues(objet, clesPermises, nom, erreurs) {
  for (const cle of Object.keys(objet)) {
    if (!clesPermises.includes(cle)) {
      erreurs.push(`${nom}.${cle} : propriété inconnue`);
    }
  }
}

function estIdInstanceValide(id) {
  return typeof id === "string" && FORMAT_ID_INSTANCE.test(id);
}

function estGraineValide(graine) {
  return (
    typeof graine === "string" ||
    (Number.isInteger(graine) &&
      graine >= 0 &&
      graine <= MAX_GRAINE_NUMERIQUE)
  );
}

/**
 * Valide une séance et les invariants propres à sa phase.
 * @param {unknown} seance
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerSeance(seance) {
  const erreurs = [];
  if (typeof seance !== "object" || seance === null) {
    return { valide: false, erreurs: ["seance : objet attendu"] };
  }
  if (!estDonneePure(seance)) {
    return { valide: false, erreurs: ["seance : données JSON pures uniquement"] };
  }
  const s = /** @type {Record<string, any>} */ (seance);
  validerClesConnues(
    s,
    [
      "schema",
      "id",
      "contexte",
      "selection",
      "mode",
      "nombreQuestions",
      "aide",
      "graine",
      "etat",
    ],
    "seance",
    erreurs,
  );

  if (s.schema !== SCHEMA_SEANCE) {
    erreurs.push(`schema : « ${SCHEMA_SEANCE} » attendu`);
  }
  if (!estIdInstanceValide(s.id)) {
    erreurs.push("id : identifiant de séance en minuscules requis");
  }
  if (!CONTEXTES_SEANCE.includes(s.contexte)) {
    erreurs.push(`contexte : valeur inconnue « ${s.contexte} »`);
  }
  if (!MODES_SEANCE.includes(s.mode)) {
    erreurs.push(`mode : valeur inconnue « ${s.mode} »`);
  }
  if (!POLITIQUES_AIDE.includes(s.aide)) {
    erreurs.push(`aide : valeur inconnue « ${s.aide} »`);
  }
  if (!estGraineValide(s.graine)) {
    erreurs.push("graine : texte ou entier non signé sur 32 bits requis");
  }
  if (
    !Number.isInteger(s.nombreQuestions) ||
    s.nombreQuestions < 1 ||
    s.nombreQuestions > 100
  ) {
    erreurs.push("nombreQuestions : entier compris entre 1 et 100 requis");
  }
  if (!Array.isArray(s.selection) || s.selection.length === 0) {
    erreurs.push("selection : au moins une notion est requise");
  } else {
    if (s.selection.some((notion) => !estIdentifiantValide(notion))) {
      erreurs.push("selection : identifiants de notions en minuscules requis");
    }
    if (new Set(s.selection).size !== s.selection.length) {
      erreurs.push("selection : doublons interdits");
    }
  }

  if (typeof s.etat !== "object" || s.etat === null) {
    erreurs.push("etat : objet attendu");
    return { valide: false, erreurs };
  }
  validerClesConnues(
    s.etat,
    ["phase", "questions", "indexQuestion"],
    "etat",
    erreurs,
  );
  if (!PHASES_SEANCE.includes(s.etat.phase)) {
    erreurs.push(`etat.phase : valeur inconnue « ${s.etat.phase} »`);
  }
  if (!Array.isArray(s.etat.questions)) {
    erreurs.push("etat.questions : liste attendue");
    return { valide: false, erreurs };
  }
  if (s.etat.questions.some((id) => !estIdInstanceValide(id))) {
    erreurs.push("etat.questions : identifiants de questions invalides");
  }
  if (new Set(s.etat.questions).size !== s.etat.questions.length) {
    erreurs.push("etat.questions : doublons interdits");
  }

  if (s.etat.phase === "prete") {
    if (s.etat.questions.length !== 0 || s.etat.indexQuestion !== null) {
      erreurs.push(
        "etat : une séance prête ne possède ni question instanciée ni index courant",
      );
    }
  }
  if (s.etat.phase === "en-cours") {
    if (s.etat.questions.length !== s.nombreQuestions) {
      erreurs.push(
        "etat.questions : la séance en cours doit contenir toutes ses questions",
      );
    }
    if (
      !Number.isInteger(s.etat.indexQuestion) ||
      s.etat.indexQuestion < 0 ||
      s.etat.indexQuestion >= s.etat.questions.length
    ) {
      erreurs.push("etat.indexQuestion : index de question courante invalide");
    }
  }
  if (s.etat.phase === "terminee") {
    if (s.etat.questions.length !== s.nombreQuestions) {
      erreurs.push(
        "etat.questions : la séance terminée doit conserver toutes ses questions",
      );
    }
    if (s.etat.indexQuestion !== s.etat.questions.length) {
      erreurs.push(
        "etat.indexQuestion : après la dernière question, l'index vaut le total",
      );
    }
  }

  return { valide: erreurs.length === 0, erreurs };
}
