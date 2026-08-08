// Contrat minimal de trace de réponse — version 1.
//
// La trace enregistre ce que l'élève a validé, pas la bonne réponse. Elle ne
// contient aucune identité, durée, donnée d'écran ou information de serveur.
// Cette version couvre les choix, les entiers, les décimaux positifs et les
// fractions équivalentes.

import { estDonneePure, estIdentifiantValide } from "./gabarit.js";
import {
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "./question-v2.js?v=21";

export const SCHEMA_TRACE_REPONSE = "mathsgo.trace-reponse/1";

const FORMAT_ID_INSTANCE = /^[a-z0-9][a-z0-9._:@-]{0,199}$/;
const FORMAT_DECIMAL_POSITIF = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;

function decomposerSaisieDecimale(saisie) {
  if (typeof saisie !== "string") return null;
  const compacte = saisie.replace(/\s/gu, "").replace(",", ".");
  if (!FORMAT_DECIMAL_POSITIF.test(compacte)) return null;
  const [partieEntiere = "0", partieDecimale = ""] = compacte.split(".");
  if (partieDecimale.replace(/0+$/, "").length > 3) return null;
  const chiffres = `${partieEntiere || "0"}${partieDecimale}`;
  return { chiffres, nombreDecimales: partieDecimale.length };
}

function valeurCorrespondSaisieDecimale(decomposition, valeur) {
  const { chiffres, nombreDecimales } = decomposition;
  const numerateurSaisi = BigInt(chiffres);
  const denominateurSaisi = 10n ** BigInt(nombreDecimales);
  return (
    numerateurSaisi * BigInt(valeur.denominateur)
    === BigInt(valeur.numerateur) * denominateurSaisi
  );
}

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
      "microNotion",
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
  if (t.microNotion !== undefined && !estIdentifiantValide(t.microNotion)) {
    erreurs.push("microNotion : identifiant en minuscules requis");
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
    const typeDecimal = t.reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL;
    const typeFraction =
      t.reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE;
    validerClesConnues(
      t.reponse,
      typeEntier
        ? ["type", "valeur"]
        : typeDeuxEntiers || typeFraction
          ? ["type", "valeurs"]
          : typeDecimal
            ? ["type", "saisie", "valeur"]
          : ["type", "choix"],
      "reponse",
      erreurs,
    );
    if (
      !typeChoix &&
      !typeEntier &&
      !typeDeuxEntiers &&
      !typeDecimal &&
      !typeFraction
    ) {
      erreurs.push(
        `reponse.type : « ${TYPE_REPONSE_SELECTION_MULTIPLE} », « ${TYPE_REPONSE_CHOIX_UNIQUE} », « ${TYPE_REPONSE_ENTIER_NATUREL} », « ${TYPE_REPONSE_DEUX_ENTIERS} », « ${TYPE_REPONSE_NOMBRE_DECIMAL} » ou « ${TYPE_REPONSE_FRACTION_EQUIVALENTE} » attendu`,
      );
    }
    if (typeEntier) {
      if (!Number.isSafeInteger(t.reponse.valeur) || t.reponse.valeur < 0) {
        erreurs.push("reponse.valeur : entier naturel requis");
      }
    } else if (typeDeuxEntiers || typeFraction) {
      if (!Array.isArray(t.reponse.valeurs) || t.reponse.valeurs.length !== 2) {
        erreurs.push("reponse.valeurs : exactement deux entiers sont requis");
      } else if (
        t.reponse.valeurs.some(
          (valeur) => !Number.isSafeInteger(valeur) || valeur < 0,
        )
      ) {
        erreurs.push("reponse.valeurs : deux entiers naturels requis");
      } else if (typeFraction && t.reponse.valeurs[1] === 0) {
        erreurs.push(
          "reponse.valeurs[1] : dénominateur strictement positif requis",
        );
      }
    } else if (typeDecimal) {
      const decomposition = decomposerSaisieDecimale(t.reponse.saisie);
      const saisieValide = decomposition !== null;
      if (!saisieValide) {
        erreurs.push("reponse.saisie : nombre décimal positif requis");
      }
      const valeur = t.reponse.valeur;
      let valeurValide = true;
      if (
        typeof valeur !== "object" ||
        valeur === null ||
        Array.isArray(valeur)
      ) {
        valeurValide = false;
        erreurs.push("reponse.valeur : rationnel normalisé attendu");
      } else {
        validerClesConnues(
          valeur,
          ["numerateur", "denominateur"],
          "reponse.valeur",
          erreurs,
        );
        if (!Number.isSafeInteger(valeur.numerateur) || valeur.numerateur < 0) {
          valeurValide = false;
          erreurs.push("reponse.valeur.numerateur : entier naturel requis");
        }
        if (!Number.isSafeInteger(valeur.denominateur) || valeur.denominateur <= 0) {
          valeurValide = false;
          erreurs.push(
            "reponse.valeur.denominateur : entier strictement positif requis",
          );
        }
      }
      if (
        saisieValide
        && valeurValide
        && !valeurCorrespondSaisieDecimale(decomposition, valeur)
      ) {
        erreurs.push(
          "reponse.valeur : valeur rationnelle incohérente avec la saisie",
        );
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
