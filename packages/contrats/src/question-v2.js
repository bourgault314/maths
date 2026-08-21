// Contrat « question instanciée » — version 2.
//
// Cette version couvre les choix simples ou multiples, les saisies entières,
// les décimaux signés et les fractions équivalentes. Les énoncés peuvent
// porter des rationnels ou une puissance structurée, sans accepter de HTML
// produit par les générateurs.

import { estDonneePure, estIdentifiantValide } from "./gabarit.js";

export const SCHEMA_QUESTION_INSTANCE_V2 = "mathsgo.question-instance/2";
export const TYPE_REPONSE_SELECTION_MULTIPLE = "selection-multiple";
export const TYPE_REPONSE_CHOIX_UNIQUE = "choix-unique";
export const TYPE_REPONSE_ENTIER_NATUREL = "entier-naturel";
export const TYPE_REPONSE_DEUX_ENTIERS = "deux-entiers";
export const TYPE_REPONSE_NOMBRE_DECIMAL = "nombre-decimal";
export const TYPE_REPONSE_FRACTION_EQUIVALENTE = "fraction-equivalente";
export const COMPARAISON_ENSEMBLE_EXACT = "ensemble-exact";
export const COMPARAISON_CHOIX_EXACT = "choix-exact";
export const COMPARAISON_VALEUR_EXACTE = "valeur-exacte";
export const COMPARAISON_VALEURS_EXACTES = "valeurs-exactes";
export const COMPARAISON_VALEUR_RATIONNELLE_EXACTE =
  "valeur-rationnelle-exacte";
const DENOMINATEURS_DECIMAUX_RENDUS = new Set([1, 2, 4, 5, 10, 100, 1000]);
export const TYPES_BLOC_V2 = Object.freeze([
  "texte",
  "entier",
  "rationnel",
  "puissance",
  "solide",
  "droite-graduee",
]);
export const TYPES_OUTIL_AIDE_V2 = Object.freeze([
  "observer-unites",
  "composer-somme-chiffres",
  "tourner-solide",
]);

const FORMES_SOLIDES_DNB = new Set([
  "cube",
  "pave",
  "prisme",
  "cylindre",
  "pyramide",
  "cone",
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
    [
      "domaine",
      "notion",
      "microNotion",
      "famille",
      "cible",
      "complements",
    ],
    "classement",
    erreurs,
  );
  for (const champ of ["domaine", "notion", "famille", "cible"]) {
    if (!estIdentifiantValide(classement[champ])) {
      erreurs.push(`classement.${champ} : identifiant en minuscules requis`);
    }
  }
  if (
    classement.microNotion !== undefined &&
    !estIdentifiantValide(classement.microNotion)
  ) {
    erreurs.push("classement.microNotion : identifiant en minuscules requis");
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
    const cles = bloc.type === "entier"
      ? ["id", "type", "valeur"]
      : bloc.type === "rationnel"
        ? ["id", "type", "numerateur", "denominateur", "ecriture"]
      : bloc.type === "puissance"
        ? ["id", "type", "base", "exposant"]
      : bloc.type === "solide"
        ? ["id", "type", "forme", "variante", "vue", "mesures"]
      : bloc.type === "droite-graduee"
        ? ["id", "type", "depart", "pas", "nombreIntervalles", "etiquettes", "point"]
        : ["id", "type", "contenu"];
    validerClesConnues(bloc, cles, chemin, erreurs);
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
      (!Number.isSafeInteger(bloc.valeur) || bloc.valeur < 0)
    ) {
      erreurs.push(`${chemin}.valeur : entier naturel requis`);
    }
    if (bloc.type === "rationnel") {
      if (!Number.isSafeInteger(bloc.numerateur)) {
        erreurs.push(`${chemin}.numerateur : entier sûr requis`);
      }
      if (!Number.isSafeInteger(bloc.denominateur) || bloc.denominateur <= 0) {
        erreurs.push(
          `${chemin}.denominateur : entier naturel strictement positif requis`,
        );
      }
      if (bloc.ecriture !== "fraction" && bloc.ecriture !== "decimal") {
        erreurs.push(`${chemin}.ecriture : « fraction » ou « decimal » requis`);
      } else if (
        bloc.ecriture === "decimal"
        && Number.isSafeInteger(bloc.denominateur)
        && !DENOMINATEURS_DECIMAUX_RENDUS.has(bloc.denominateur)
      ) {
        erreurs.push(
          `${chemin}.denominateur : dénominateur décimal rendu requis`,
        );
      }
    }
    if (bloc.type === "droite-graduee") {
      const validerRationnel = (valeur, nom, { positif = false } = {}) => {
        if (typeof valeur !== "object" || valeur === null || Array.isArray(valeur)) {
          erreurs.push(`${nom} : rationnel attendu`);
          return;
        }
        validerClesConnues(valeur, ["numerateur", "denominateur"], nom, erreurs);
        if (!Number.isSafeInteger(valeur.numerateur) || (positif && valeur.numerateur <= 0)) {
          erreurs.push(`${nom}.numerateur : entier${positif ? " strictement positif" : " sûr"} requis`);
        }
        if (!Number.isSafeInteger(valeur.denominateur) || valeur.denominateur <= 0) {
          erreurs.push(`${nom}.denominateur : entier strictement positif requis`);
        }
      };
      validerRationnel(bloc.depart, `${chemin}.depart`);
      validerRationnel(bloc.pas, `${chemin}.pas`, { positif: true });
      if (!Number.isInteger(bloc.nombreIntervalles) || bloc.nombreIntervalles < 4 || bloc.nombreIntervalles > 12) {
        erreurs.push(`${chemin}.nombreIntervalles : entier entre 4 et 12 requis`);
      }
      if (!Array.isArray(bloc.etiquettes) || bloc.etiquettes.length < 2) {
        erreurs.push(`${chemin}.etiquettes : au moins deux indices requis`);
      } else if (bloc.etiquettes.some((indice) => !Number.isInteger(indice) || indice < 0 || indice > bloc.nombreIntervalles)) {
        erreurs.push(`${chemin}.etiquettes : indices de graduations valides requis`);
      }
      if (bloc.point !== undefined) {
        if (typeof bloc.point !== "object" || bloc.point === null || Array.isArray(bloc.point)) {
          erreurs.push(`${chemin}.point : objet attendu`);
        } else {
          validerClesConnues(bloc.point, ["nom", "indice"], `${chemin}.point`, erreurs);
          if (typeof bloc.point.nom !== "string" || !/^[A-Z]$/.test(bloc.point.nom)) {
            erreurs.push(`${chemin}.point.nom : lettre majuscule requise`);
          }
          if (!Number.isInteger(bloc.point.indice) || bloc.point.indice < 0 || bloc.point.indice > bloc.nombreIntervalles) {
            erreurs.push(`${chemin}.point.indice : graduation visible requise`);
          }
        }
      }
    }
    if (bloc.type === "puissance") {
      if (!Number.isSafeInteger(bloc.base) || bloc.base < 0) {
        erreurs.push(`${chemin}.base : entier naturel requis`);
      }
      if (!Number.isSafeInteger(bloc.exposant) || bloc.exposant <= 0) {
        erreurs.push(`${chemin}.exposant : entier naturel strictement positif requis`);
      }
    }
    if (bloc.type === "solide") {
      if (!FORMES_SOLIDES_DNB.has(bloc.forme)) {
        erreurs.push(`${chemin}.forme : solide DNB inconnu`);
      }
      if (bloc.variante !== undefined && !estIdentifiantValide(bloc.variante)) {
        erreurs.push(`${chemin}.variante : identifiant en minuscules requis`);
      }
      const vue = bloc.vue;
      if (typeof vue !== "object" || vue === null || Array.isArray(vue)) {
        erreurs.push(`${chemin}.vue : objet attendu`);
      } else {
        validerClesConnues(vue, ["lacetDeg", "tangageDeg"], `${chemin}.vue`, erreurs);
        if (!Number.isFinite(vue.lacetDeg) || vue.lacetDeg < -180 || vue.lacetDeg > 180) {
          erreurs.push(`${chemin}.vue.lacetDeg : angle entre -180 et 180 requis`);
        }
        if (!Number.isFinite(vue.tangageDeg) || vue.tangageDeg < -60 || vue.tangageDeg > 60) {
          erreurs.push(`${chemin}.vue.tangageDeg : angle entre -60 et 60 requis`);
        }
      }
      if (bloc.mesures !== undefined) {
        const mesures = bloc.mesures;
        if (typeof mesures !== "object" || mesures === null || Array.isArray(mesures)) {
          erreurs.push(`${chemin}.mesures : objet attendu`);
        } else {
          const clesMesures = ["arete", "longueur", "largeur", "hauteur", "aireBase", "rayon", "unite", "pi"];
          validerClesConnues(mesures, clesMesures, `${chemin}.mesures`, erreurs);
          for (const [cle, valeur] of Object.entries(mesures)) {
            if (["unite", "pi"].includes(cle)) continue;
            if (!Number.isFinite(valeur) || valeur <= 0) {
              erreurs.push(`${chemin}.mesures.${cle} : nombre strictement positif requis`);
            }
          }
          if (mesures.unite !== "cm") {
            erreurs.push(`${chemin}.mesures.unite : « cm » requis dans cette version`);
          }
          if (mesures.pi !== undefined && mesures.pi !== "exact" && mesures.pi !== 3) {
            erreurs.push(`${chemin}.mesures.pi : « exact » ou 3 requis`);
          }
          const attenduesParForme = {
            cube: ["arete"],
            pave: ["longueur", "largeur", "hauteur"],
            prisme: ["aireBase", "hauteur"],
            cylindre: ["rayon", "hauteur", "pi"],
          };
          const attendues = attenduesParForme[bloc.forme];
          if (attendues) {
            for (const cle of attendues) {
              if (!(cle in mesures)) erreurs.push(`${chemin}.mesures.${cle} : mesure requise`);
            }
            const permises = new Set([...attendues, "unite"]);
            for (const cle of Object.keys(mesures)) {
              if (!permises.has(cle)) erreurs.push(`${chemin}.mesures.${cle} : mesure incompatible avec ${bloc.forme}`);
            }
          }
        }
      }
    }
  });
  return blocsParId;
}

function validerReponse(reponse, erreurs) {
  if (typeof reponse !== "object" || reponse === null) {
    erreurs.push("reponse : objet attendu");
    return;
  }
  const multiple = reponse.type === TYPE_REPONSE_SELECTION_MULTIPLE;
  const unique = reponse.type === TYPE_REPONSE_CHOIX_UNIQUE;
  const entier = reponse.type === TYPE_REPONSE_ENTIER_NATUREL;
  const deuxEntiers = reponse.type === TYPE_REPONSE_DEUX_ENTIERS;
  const decimal = reponse.type === TYPE_REPONSE_NOMBRE_DECIMAL;
  const fraction = reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE;
  if (!multiple && !unique && !entier && !deuxEntiers && !decimal && !fraction) {
    erreurs.push(
      "reponse.type : sélection multiple, choix unique, entier naturel, deux entiers, nombre décimal ou fraction équivalente attendus",
    );
    return;
  }

  if (decimal || fraction) {
    validerClesConnues(
      reponse,
      ["type", "comparaison", "attendu"],
      "reponse",
      erreurs,
    );
    if (reponse.comparaison !== COMPARAISON_VALEUR_RATIONNELLE_EXACTE) {
      erreurs.push(
        `reponse.comparaison : « ${COMPARAISON_VALEUR_RATIONNELLE_EXACTE} » attendu`,
      );
    }
    const attendu = reponse.attendu;
    if (typeof attendu !== "object" || attendu === null || Array.isArray(attendu)) {
      erreurs.push("reponse.attendu : rationnel attendu");
      return;
    }
    validerClesConnues(
      attendu,
      ["numerateur", "denominateur"],
      "reponse.attendu",
      erreurs,
    );
    if (!Number.isSafeInteger(attendu.numerateur)) {
      erreurs.push("reponse.attendu.numerateur : entier sûr requis");
    }
    if (!Number.isSafeInteger(attendu.denominateur) || attendu.denominateur <= 0) {
      erreurs.push(
        "reponse.attendu.denominateur : entier naturel strictement positif requis",
      );
    } else if (
      decimal
      && !DENOMINATEURS_DECIMAUX_RENDUS.has(attendu.denominateur)
    ) {
      erreurs.push(
        "reponse.attendu.denominateur : dénominateur décimal rendu requis",
      );
    }
    return;
  }

  if (entier || deuxEntiers) {
    validerClesConnues(
      reponse,
      entier
        ? ["type", "comparaison", "attendu", "minimum", "maximum"]
        : ["type", "comparaison", "attendus", "minimum", "maximum"],
      "reponse",
      erreurs,
    );
    const comparaisonAttendue = entier
      ? COMPARAISON_VALEUR_EXACTE
      : COMPARAISON_VALEURS_EXACTES;
    if (reponse.comparaison !== comparaisonAttendue) {
      erreurs.push(
        `reponse.comparaison : « ${comparaisonAttendue} » attendu`,
      );
    }
    if (!Number.isSafeInteger(reponse.minimum) || reponse.minimum < 0) {
      erreurs.push("reponse.minimum : entier naturel requis");
    }
    if (
      !Number.isSafeInteger(reponse.maximum) ||
      reponse.maximum < reponse.minimum
    ) {
      erreurs.push(
        "reponse.maximum : entier supérieur ou égal au minimum requis",
      );
    }
    if (entier) {
      if (
        !Number.isSafeInteger(reponse.attendu) ||
        reponse.attendu < reponse.minimum ||
        reponse.attendu > reponse.maximum
      ) {
        erreurs.push("reponse.attendu : entier compris dans les bornes requis");
      }
    } else if (!Array.isArray(reponse.attendus) || reponse.attendus.length !== 2) {
      erreurs.push("reponse.attendus : exactement deux entiers sont requis");
    } else {
      reponse.attendus.forEach((attendu, index) => {
        if (
          !Number.isSafeInteger(attendu) ||
          attendu < reponse.minimum ||
          attendu > reponse.maximum
        ) {
          erreurs.push(
            `reponse.attendus[${index}] : entier compris dans les bornes requis`,
          );
        }
      });
    }
    return;
  }

  validerClesConnues(
    reponse,
    ["type", "comparaison", "choix", "attendus"],
    "reponse",
    erreurs,
  );
  const comparaisonAttendue = unique
    ? COMPARAISON_CHOIX_EXACT
    : COMPARAISON_ENSEMBLE_EXACT;
  if (reponse.comparaison !== comparaisonAttendue) {
    erreurs.push(`reponse.comparaison : « ${comparaisonAttendue} » attendu`);
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
  if (unique && reponse.attendus.length !== 1) {
    erreurs.push("reponse.attendus : un seul choix requis pour un choix unique");
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
    const sourceAttendue = outil.type === "tourner-solide" ? "solide" : "entier";
    if (source?.type !== sourceAttendue) {
      erreurs.push(`${chemin}.source : bloc ${sourceAttendue} de l'énoncé requis`);
    }
  });
}

/**
 * Valide une question contre le contrat V2.
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

/**
 * Compare une saisie à l'entier naturel attendu sans conversion implicite.
 * Le lecteur convertit explicitement son afficheur avant cet appel.
 * @param {unknown} attendu
 * @param {unknown} recu
 */
export function estEntierExact(attendu, recu) {
  return (
    Number.isSafeInteger(attendu) &&
    attendu >= 0 &&
    Number.isSafeInteger(recu) &&
    recu >= 0 &&
    attendu === recu
  );
}

/**
 * Compare deux champs entiers dans leur ordre, sans conversion implicite.
 * Les deux tableaux doivent contenir exactement deux entiers naturels.
 * @param {unknown} attendus
 * @param {unknown} recus
 */
export function estDeuxEntiersExacts(attendus, recus) {
  if (!Array.isArray(attendus) || !Array.isArray(recus)) return false;
  if (attendus.length !== 2 || recus.length !== 2) return false;
  if (
    attendus.some((valeur) => !Number.isSafeInteger(valeur) || valeur < 0) ||
    recus.some((valeur) => !Number.isSafeInteger(valeur) || valeur < 0)
  ) {
    return false;
  }
  return attendus[0] === recus[0] && attendus[1] === recus[1];
}

/**
 * Compare exactement deux rationnels positifs par produit en croix.
 * Les fractions n'ont pas besoin d'être réduites.
 * @param {unknown} attendu
 * @param {unknown} recu
 */
export function estValeurRationnelleExacte(attendu, recu) {
  const rationnelValide = (valeur) =>
    typeof valeur === "object" &&
    valeur !== null &&
    Number.isSafeInteger(valeur.numerateur) &&
    valeur.numerateur >= 0 &&
    Number.isSafeInteger(valeur.denominateur) &&
    valeur.denominateur > 0;
  if (!rationnelValide(attendu) || !rationnelValide(recu)) return false;
  return (
    BigInt(attendu.numerateur) * BigInt(recu.denominateur) ===
    BigInt(recu.numerateur) * BigInt(attendu.denominateur)
  );
}
