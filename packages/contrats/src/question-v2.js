// Contrat « question instanciée » — version 2.
//
// Cette version naît pour le premier besoin pédagogique réel de V2 :
// NC-01/F2, où l'élève sélectionne tous les diviseurs proposés. Elle ne
// modifie pas la version 1 et ne préfigure pas les futurs contrats de saisie
// numérique, de fraction ou de manipulation.

import { estDonneePure, estIdentifiantValide } from "./gabarit.js";

export const SCHEMA_QUESTION_INSTANCE_V2 = "mathsgo.question-instance/2";
export const TYPE_REPONSE_SELECTION_MULTIPLE = "selection-multiple";
export const COMPARAISON_ENSEMBLE_EXACT = "ensemble-exact";
export const TYPES_BLOC_V2 = Object.freeze(["texte", "entier"]);
export const TYPES_OUTIL_AIDE_V2 = Object.freeze([
  "observer-unites",
  "composer-somme-chiffres",
]);

const FORMAT_ID_INSTANCE = /^[a-z0-9][a-z0-9._:@-]{0,199}$/;

const estTexteNonVide = (valeur) =>
  typeof valeur === "string" && valeur.trim().length > 0;

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

function validerClassement(classement, erreurs) {
  if (typeof classement !== "object" || classement === null) {
    erreurs.push("classement : objet attendu");
    return;
  }
  validerClesConnues(
    classement,
    ["domaine", "notion", "famille", "cible", "complements"],
    "classement",
    erreurs,
  );
  for (const champ of ["domaine", "notion", "famille", "cible"]) {
    if (!estIdentifiantValide(classement[champ])) {
      erreurs.push(`classement.${champ} : identifiant en minuscules requis`);
    }
  }
  if (!Array.isArray(classement.complements)) {
    erreurs.push("classement.complements : liste attendue");
  } else {
    const invalides = classement.complements.some(
      (complement) => !estIdentifiantValide(complement),
    );
    if (invalides) {
      erreurs.push("classement.complements : identifiants en minuscules requis");
    }
    if (new Set(classement.complements).size !== classement.complements.length) {
      erreurs.push("classement.complements : doublons interdits");
    }
  }
}

function validerBlocs(blocs, nom, erreurs, { auMoinsUn = false } = {}) {
  if (!Array.isArray(blocs)) {
    erreurs.push(`${nom} : liste de blocs attendue`);
    return new Map();
  }
  if (auMoinsUn && blocs.length === 0) {
    erreurs.push(`${nom} : au moins un bloc est requis`);
  }

  const blocsParId = new Map();
  blocs.forEach((bloc, index) => {
    const chemin = `${nom}[${index}]`;
    if (typeof bloc !== "object" || bloc === null) {
      erreurs.push(`${chemin} : bloc attendu`);
      return;
    }
    validerClesConnues(
      bloc,
      bloc.type === "entier"
        ? ["id", "type", "valeur"]
        : ["id", "type", "contenu"],
      chemin,
      erreurs,
    );
    if (!estIdentifiantValide(bloc.id)) {
      erreurs.push(`${chemin}.id : identifiant en minuscules requis`);
    } else if (blocsParId.has(bloc.id)) {
      erreurs.push(`${nom} : identifiant de bloc dupliqué « ${bloc.id} »`);
    } else {
      blocsParId.set(bloc.id, bloc);
    }

    if (!TYPES_BLOC_V2.includes(bloc.type)) {
      erreurs.push(`${chemin}.type : type inconnu « ${bloc.type} »`);
      return;
    }
    if (bloc.type === "texte" && !estTexteNonVide(bloc.contenu)) {
      erreurs.push(`${chemin}.contenu : texte non vide requis`);
    }
    if (
      bloc.type === "entier" &&
      (!Number.isSafeInteger(bloc.valeur) || bloc.valeur <= 0)
    ) {
      erreurs.push(`${chemin}.valeur : entier naturel strictement positif requis`);
    }
  });
  return blocsParId;
}

function validerReponse(reponse, erreurs) {
  if (typeof reponse !== "object" || reponse === null) {
    erreurs.push("reponse : objet attendu");
    return;
  }
  validerClesConnues(
    reponse,
    ["type", "comparaison", "choix", "attendus"],
    "reponse",
    erreurs,
  );
  if (reponse.type !== TYPE_REPONSE_SELECTION_MULTIPLE) {
    erreurs.push(
      `reponse.type : « ${TYPE_REPONSE_SELECTION_MULTIPLE} » attendu`,
    );
  }
  if (reponse.comparaison !== COMPARAISON_ENSEMBLE_EXACT) {
    erreurs.push(
      `reponse.comparaison : « ${COMPARAISON_ENSEMBLE_EXACT} » attendu`,
    );
  }
  if (!Array.isArray(reponse.choix) || reponse.choix.length < 2) {
    erreurs.push("reponse.choix : au moins deux choix sont requis");
    return;
  }

  const choixParId = new Map();
  const exclusifs = new Set();
  reponse.choix.forEach((choix, index) => {
    const chemin = `reponse.choix[${index}]`;
    if (typeof choix !== "object" || choix === null) {
      erreurs.push(`${chemin} : objet attendu`);
      return;
    }
    validerClesConnues(
      choix,
      ["id", "libelle", "exclusif"],
      chemin,
      erreurs,
    );
    if (!estIdentifiantValide(choix.id)) {
      erreurs.push(`${chemin}.id : identifiant en minuscules requis`);
    } else if (choixParId.has(choix.id)) {
      erreurs.push(`reponse.choix : identifiant dupliqué « ${choix.id} »`);
    } else {
      choixParId.set(choix.id, choix);
    }
    if (!estTexteNonVide(choix.libelle)) {
      erreurs.push(`${chemin}.libelle : texte non vide requis`);
    }
    if (choix.exclusif !== undefined && typeof choix.exclusif !== "boolean") {
      erreurs.push(`${chemin}.exclusif : booléen attendu`);
    }
    if (choix.exclusif === true && estIdentifiantValide(choix.id)) {
      exclusifs.add(choix.id);
    }
  });
  if (exclusifs.size > 1) {
    erreurs.push("reponse.choix : un seul choix exclusif est autorisé");
  }

  if (!Array.isArray(reponse.attendus) || reponse.attendus.length === 0) {
    erreurs.push("reponse.attendus : au moins un choix attendu est requis");
    return;
  }
  if (new Set(reponse.attendus).size !== reponse.attendus.length) {
    erreurs.push("reponse.attendus : doublons interdits");
  }
  for (const attendu of reponse.attendus) {
    if (!choixParId.has(attendu)) {
      erreurs.push(`reponse.attendus : choix inconnu « ${attendu} »`);
    }
  }
  const attenduExclusif = reponse.attendus.find((id) => exclusifs.has(id));
  if (attenduExclusif !== undefined && reponse.attendus.length !== 1) {
    erreurs.push(
      `reponse.attendus : le choix exclusif « ${attenduExclusif} » doit être seul`,
    );
  }
}

function validerAide(aide, blocsEnonce, erreurs) {
  if (typeof aide !== "object" || aide === null) {
    erreurs.push("aide : objet attendu");
    return;
  }
  validerClesConnues(aide, ["blocs", "outils"], "aide", erreurs);
  validerBlocs(aide.blocs, "aide.blocs", erreurs);
  if (!Array.isArray(aide.outils)) {
    erreurs.push("aide.outils : liste attendue");
    return;
  }
  const typesVus = new Set();
  aide.outils.forEach((outil, index) => {
    const chemin = `aide.outils[${index}]`;
    if (typeof outil !== "object" || outil === null) {
      erreurs.push(`${chemin} : objet attendu`);
      return;
    }
    validerClesConnues(outil, ["type", "source"], chemin, erreurs);
    if (!TYPES_OUTIL_AIDE_V2.includes(outil.type)) {
      erreurs.push(`${chemin}.type : type inconnu « ${outil.type} »`);
    } else if (typesVus.has(outil.type)) {
      erreurs.push(`aide.outils : type dupliqué « ${outil.type} »`);
    } else {
      typesVus.add(outil.type);
    }
    const source = blocsEnonce.get(outil.source);
    if (source?.type !== "entier") {
      erreurs.push(`${chemin}.source : bloc entier de l'énoncé requis`);
    }
  });
}

/**
 * Valide une question contre le contrat V2 limité à la sélection multiple.
 * @param {unknown} question
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerQuestionInstanceV2(question) {
  const erreurs = [];
  if (typeof question !== "object" || question === null) {
    return { valide: false, erreurs: ["question : objet attendu"] };
  }
  if (!estDonneePure(question)) {
    return {
      valide: false,
      erreurs: ["question : données JSON pures uniquement"],
    };
  }

  const q = /** @type {Record<string, any>} */ (question);
  validerClesConnues(
    q,
    [
      "schema",
      "id",
      "classement",
      "enonce",
      "reponse",
      "aide",
      "correction",
      "origine",
    ],
    "question",
    erreurs,
  );
  if (q.schema !== SCHEMA_QUESTION_INSTANCE_V2) {
    erreurs.push(`schema : « ${SCHEMA_QUESTION_INSTANCE_V2} » attendu`);
  }
  if (!estIdInstanceValide(q.id)) {
    erreurs.push("id : identifiant d'instance en minuscules requis");
  }
  validerClassement(q.classement, erreurs);
  const blocsEnonce = validerBlocs(q.enonce, "enonce", erreurs, {
    auMoinsUn: true,
  });
  validerReponse(q.reponse, erreurs);
  if (q.aide !== undefined) validerAide(q.aide, blocsEnonce, erreurs);
  if (q.correction !== undefined) {
    validerBlocs(q.correction, "correction", erreurs, { auMoinsUn: true });
  }
  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Compare deux sélections comme des ensembles. Une sélection dupliquée est
 * invalide, même si son ensemble mathématique semble correct.
 * @param {unknown} attendus
 * @param {unknown} recus
 */
export function estSelectionExacte(attendus, recus) {
  if (!Array.isArray(attendus) || !Array.isArray(recus)) return false;
  if (attendus.length === 0 || recus.length === 0) return false;
  if (
    new Set(attendus).size !== attendus.length ||
    new Set(recus).size !== recus.length ||
    attendus.some((id) => !estIdentifiantValide(id)) ||
    recus.some((id) => !estIdentifiantValide(id))
  ) {
    return false;
  }
  if (attendus.length !== recus.length) return false;
  const ensembleRecu = new Set(recus);
  return attendus.every((id) => ensembleRecu.has(id));
}
