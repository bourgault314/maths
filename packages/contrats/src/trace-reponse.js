// Contrat minimal de trace de réponse — version 1.
//
// La trace enregistre ce que l'élève a validé, pas la bonne réponse. Elle ne
// contient aucune identité, durée, donnée d'écran ou information de serveur.
// Cette version couvre les choix, un entier naturel et deux champs entiers.

import { estDonneePure, estIdentifiantValide } from "./gabarit.js";
import {
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "./question-v2.js?v=19";

export const SCHEMA_TRACE_REPONSE = "mathsgo.trace-reponse/1";

const FORMAT_ID_INSTANCE = /^[a-z0-9][a-z0-9._:@-]{0,199}$/;

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

/**
 * Valide une trace de réponse interactive prise en charge par le lecteur V2.
 * @param {unknown} trace
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerTraceReponse(trace) {
  const erreurs = [];
  if (typeof trace !== "object" || trace === null) {
    return { valide: false, erreurs: ["trace : objet attendu"] };
  }
  if (!estDonneePure(trace)) {
    return { valide: false, erreurs: ["trace : données JSON pures uniquement"] };
  }
  const t = /** @type {Record<string, any>} */ (trace);
  validerClesConnues(
    t,
    [
      "schema",
      "id",
      "seance",
      "question",
      "indexQuestion",
      "validation",
      "reponse",
      "juste",
      "aideConsultee",
    ],
    "trace",
    erreurs,
  );

  if (t.schema !== SCHEMA_TRACE_REPONSE) {
    erreurs.push(`schema : « ${SCHEMA_TRACE_REPONSE} » attendu`);
  }
  for (const champ of ["id", "seance", "question"]) {
    if (!estIdInstanceValide(t[champ])) {
      erreurs.push(`${champ} : identifiant d'instance en minuscules requis`);
    }
  }
  if (!Number.isInteger(t.indexQuestion) || t.indexQuestion < 0) {
    erreurs.push("indexQuestion : entier positif ou nul requis");
  }
  if (!Number.isInteger(t.validation) || t.validation < 1) {
    erreurs.push("validation : entier supérieur ou égal à 1 requis");
  }
  if (typeof t.juste !== "boolean") {
    erreurs.push("juste : booléen requis");
  }
  if (typeof t.aideConsultee !== "boolean") {
    erreurs.push("aideConsultee : booléen requis");
  }
  if (typeof t.reponse !== "object" || t.reponse === null) {
    erreurs.push("reponse : objet attendu");
  } else {
    const typeChoix = [
      TYPE_REPONSE_SELECTION_MULTIPLE,
      TYPE_REPONSE_CHOIX_UNIQUE,
    ].includes(t.reponse.type);
    const typeEntier = t.reponse.type === TYPE_REPONSE_ENTIER_NATUREL;
    const typeDeuxEntiers = t.reponse.type === TYPE_REPONSE_DEUX_ENTIERS;
    validerClesConnues(
      t.reponse,
      typeEntier
        ? ["type", "valeur"]
        : typeDeuxEntiers
          ? ["type", "valeurs"]
          : ["type", "choix"],
      "reponse",
      erreurs,
    );
    if (!typeChoix && !typeEntier && !typeDeuxEntiers) {
      erreurs.push(
        `reponse.type : « ${TYPE_REPONSE_SELECTION_MULTIPLE} », « ${TYPE_REPONSE_CHOIX_UNIQUE} », « ${TYPE_REPONSE_ENTIER_NATUREL} » ou « ${TYPE_REPONSE_DEUX_ENTIERS} » attendu`,
      );
    }
    if (typeEntier) {
      if (!Number.isSafeInteger(t.reponse.valeur) || t.reponse.valeur < 0) {
        erreurs.push("reponse.valeur : entier naturel requis");
      }
    } else if (typeDeuxEntiers) {
      if (!Array.isArray(t.reponse.valeurs) || t.reponse.valeurs.length !== 2) {
        erreurs.push("reponse.valeurs : exactement deux entiers sont requis");
      } else if (
        t.reponse.valeurs.some(
          (valeur) => !Number.isSafeInteger(valeur) || valeur < 0,
        )
      ) {
        erreurs.push("reponse.valeurs : deux entiers naturels requis");
      }
    } else if (typeChoix && (!Array.isArray(t.reponse.choix) || t.reponse.choix.length === 0)) {
      erreurs.push("reponse.choix : sélection non vide requise");
    } else if (typeChoix) {
      if (t.reponse.choix.some((id) => !estIdentifiantValide(id))) {
        erreurs.push("reponse.choix : identifiants en minuscules requis");
      }
      if (new Set(t.reponse.choix).size !== t.reponse.choix.length) {
        erreurs.push("reponse.choix : doublons interdits");
      }
      if (t.reponse.type === TYPE_REPONSE_CHOIX_UNIQUE && t.reponse.choix.length !== 1) {
        erreurs.push("reponse.choix : un seul choix requis");
      }
    }
  }

  return { valide: erreurs.length === 0, erreurs };
}
