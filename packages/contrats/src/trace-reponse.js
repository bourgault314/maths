// Contrat de trace de réponse — versions 1, 2 et 3.
//
// La trace enregistre ce que l'élève a validé, pas la bonne réponse. Elle ne
// contient aucune identité, durée, donnée d'écran ou information de serveur.
// La version 2 ajoute le classement canonique et les versions du contenu afin
// qu'un futur export reste interprétable sans la question complète. La version
// 1 reste lisible telle qu'elle a été publiée ; elle n'est jamais réécrite.
// La version 3 distingue une réponse fournie d'une omission volontaire.

import { estDonneePure, estIdentifiantValide } from "./gabarit.js";
import {
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_DEUX_ENTIERS,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "./question-v2.js?v=34";

export const SCHEMA_TRACE_REPONSE_V1 = "mathsgo.trace-reponse/1";
export const SCHEMA_TRACE_REPONSE_V2 = "mathsgo.trace-reponse/2";
export const SCHEMA_TRACE_REPONSE = "mathsgo.trace-reponse/3";
export const REFERENTIEL_COMPETENCES = "mathsgo.taxonomie-competences/1";

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

function validerListeIdentifiants(liste, nom, erreurs, { nonVide = false } = {}) {
  if (!Array.isArray(liste)) {
    erreurs.push(`${nom} : liste attendue`);
    return;
  }
  if (nonVide && liste.length === 0) {
    erreurs.push(`${nom} : liste non vide requise`);
  }
  if (liste.some((identifiant) => !estIdentifiantValide(identifiant))) {
    erreurs.push(`${nom} : identifiants en minuscules requis`);
  }
  if (new Set(liste).size !== liste.length) {
    erreurs.push(`${nom} : doublons interdits`);
  }
}

function validerClassementV2(classement, erreurs) {
  if (typeof classement !== "object" || classement === null) {
    erreurs.push("classement : objet attendu");
    return;
  }
  validerClesConnues(
    classement,
    [
      "referentiel",
      "domaine",
      "module",
      "microNotion",
      "famille",
      "cibles",
      "complements",
    ],
    "classement",
    erreurs,
  );
  if (classement.referentiel !== REFERENTIEL_COMPETENCES) {
    erreurs.push(
      `classement.referentiel : « ${REFERENTIEL_COMPETENCES} » attendu`,
    );
  }
  for (const champ of ["domaine", "module", "microNotion", "famille"]) {
    if (!estIdentifiantValide(classement[champ])) {
      erreurs.push(`classement.${champ} : identifiant en minuscules requis`);
    }
  }
  validerListeIdentifiants(classement.cibles, "classement.cibles", erreurs, {
    nonVide: true,
  });
  validerListeIdentifiants(
    classement.complements,
    "classement.complements",
    erreurs,
  );
}

function validerContenuV2(contenu, erreurs) {
  if (typeof contenu !== "object" || contenu === null) {
    erreurs.push("contenu : objet attendu");
    return;
  }
  validerClesConnues(
    contenu,
    ["gabarit", "generateur", "aleatoire"],
    "contenu",
    erreurs,
  );
  for (const champ of ["gabarit", "generateur"]) {
    const valeur = contenu[champ];
    if (typeof valeur !== "object" || valeur === null) {
      erreurs.push(`contenu.${champ} : objet attendu`);
      continue;
    }
    validerClesConnues(valeur, ["id", "version"], `contenu.${champ}`, erreurs);
    if (!estIdentifiantValide(valeur.id)) {
      erreurs.push(`contenu.${champ}.id : identifiant en minuscules requis`);
    }
    if (!Number.isInteger(valeur.version) || valeur.version < 1) {
      erreurs.push(`contenu.${champ}.version : entier supérieur ou égal à 1 requis`);
    }
  }
  const aleatoire = contenu.aleatoire;
  if (typeof aleatoire !== "object" || aleatoire === null) {
    erreurs.push("contenu.aleatoire : objet attendu");
    return;
  }
  validerClesConnues(
    aleatoire,
    ["graine", "version"],
    "contenu.aleatoire",
    erreurs,
  );
  if (typeof aleatoire.graine !== "string") {
    erreurs.push("contenu.aleatoire.graine : texte requis");
  }
  if (!Number.isInteger(aleatoire.version) || aleatoire.version < 1) {
    erreurs.push("contenu.aleatoire.version : entier supérieur ou égal à 1 requis");
  }
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
  const version1 = t.schema === SCHEMA_TRACE_REPONSE_V1;
  const version2 = t.schema === SCHEMA_TRACE_REPONSE_V2;
  const version3 = t.schema === SCHEMA_TRACE_REPONSE;
  validerClesConnues(
    t,
    version1
      ? [
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
      ]
      : [
        "schema",
        "id",
        "seance",
        "question",
        "classement",
        "contenu",
        "indexQuestion",
        "validation",
        "reponse",
        "juste",
        "aideConsultee",
      ],
    "trace",
    erreurs,
  );

  if (!version1 && !version2 && !version3) {
    erreurs.push(
      `schema : « ${SCHEMA_TRACE_REPONSE_V1} », « ${SCHEMA_TRACE_REPONSE_V2} » ou « ${SCHEMA_TRACE_REPONSE} » attendu`,
    );
  }
  for (const champ of ["id", "seance", "question"]) {
    if (!estIdInstanceValide(t[champ])) {
      erreurs.push(`${champ} : identifiant d'instance en minuscules requis`);
    }
  }
  if (version1) {
    if (t.microNotion !== undefined && !estIdentifiantValide(t.microNotion)) {
      erreurs.push("microNotion : identifiant en minuscules requis");
    }
  } else if (version2 || version3) {
    validerClassementV2(t.classement, erreurs);
    validerContenuV2(t.contenu, erreurs);
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
    const statutFourni = !version3 || t.reponse.statut === "fournie";
    const statutOmis = version3 && t.reponse.statut === "omise";
    if (version3 && !statutFourni && !statutOmis) {
      erreurs.push("reponse.statut : « fournie » ou « omise » attendu");
    }
    validerClesConnues(
      t.reponse,
      statutOmis
        ? ["type", "statut"]
        : typeEntier
          ? ["type", ...(version3 ? ["statut"] : []), "valeur"]
          : typeDeuxEntiers || typeFraction
            ? ["type", ...(version3 ? ["statut"] : []), "valeurs"]
            : typeDecimal
              ? ["type", ...(version3 ? ["statut"] : []), "saisie", "valeur"]
            : ["type", ...(version3 ? ["statut"] : []), "choix"],
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
    if (statutOmis) {
      if (t.juste !== false) {
        erreurs.push("juste : une réponse omise ne peut pas être juste");
      }
    } else if (typeEntier) {
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
