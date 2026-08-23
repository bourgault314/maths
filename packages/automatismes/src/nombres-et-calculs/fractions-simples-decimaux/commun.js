// Fondations locales de la catégorie visible « Fractions simples et
// décimaux ». NC-03 et NC-04 partagent le même lecteur et la même cible DNB,
// mais gardent deux identifiants de micro-notion pour le suivi des deux sens.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js?v=54";
import {
  COMPARAISON_CHOIX_EXACT,
  COMPARAISON_VALEUR_EXACTE,
  COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
} from "../../../../contrats/src/question-v2.js?v=54";
import {
  IDENTITES_AUTOMATISMES,
  creerClassementAutomatisme,
} from "../../identifiants.js?v=54";

export const NOTION_FRACTION_VERS_DECIMAL =
  IDENTITES_AUTOMATISMES.FRACTION_VERS_DECIMAL.microNotion;
export const NOTION_DECIMAL_VERS_FRACTION =
  IDENTITES_AUTOMATISMES.DECIMAL_VERS_FRACTION.microNotion;
// Alias historique conservé pour les imports documentaires et les anciens
// liens. Les séries visibles utilisent la notion précise NC03 ou NC04.
export const NOTION_FRACTIONS_SIMPLES_DECIMAUX =
  IDENTITES_AUTOMATISMES.FRACTION_VERS_DECIMAL.module;
export const MICRO_NOTION_NC03 =
  IDENTITES_AUTOMATISMES.FRACTION_VERS_DECIMAL.microNotion;
export const MICRO_NOTION_NC04 =
  IDENTITES_AUTOMATISMES.DECIMAL_VERS_FRACTION.microNotion;
export const CIBLE_FRACTIONS_SIMPLES_DECIMAUX =
  IDENTITES_AUTOMATISMES.FRACTION_VERS_DECIMAL.cible;
export const PRESENTATIONS_FRACTIONS_DECIMAUX = Object.freeze([
  "abstraite",
  "qcm-diagnostique",
]);

export const DENOMINATEURS_AUTORISES = Object.freeze([
  1,
  2,
  4,
  10,
  100,
  1000,
]);
export const NUMERATEURS_DEMIS = Object.freeze(
  Array.from({ length: 7 }, (_, index) => index + 1),
);
export const NUMERATEURS_QUARTS = Object.freeze(
  Array.from({ length: 12 }, (_, index) => index + 1),
);

const BORNES_NUMERATEURS = Object.freeze({
  1: Object.freeze([2, 12]),
  2: Object.freeze([1, 7]),
  4: Object.freeze([1, 12]),
  10: Object.freeze([1, 49]),
  100: Object.freeze([1, 250]),
  1000: Object.freeze([1, 999]),
});

export function estFractionDuDomaine(numerateur, denominateur) {
  if (!Number.isSafeInteger(numerateur) || !DENOMINATEURS_AUTORISES.includes(denominateur)) {
    return false;
  }
  const [minimum, maximum] = BORNES_NUMERATEURS[denominateur];
  if (numerateur < minimum || numerateur > maximum) return false;
  // Un multiple de 10 sur 1000 serait une écriture de centièmes déguisée.
  return denominateur !== 1000 || numerateur % 10 !== 0;
}

export function exigerAleatoireFractions(aleatoire, nom) {
  if (
    typeof aleatoire !== "object" ||
    aleatoire === null ||
    typeof aleatoire.entier !== "function" ||
    typeof aleatoire.choix !== "function" ||
    typeof aleatoire.melange !== "function"
  ) {
    throw new TypeError(`${nom} : générateur aléatoire seedé requis`);
  }
}

export function exigerParametresFractions(parametres, regles, nom) {
  if (
    typeof parametres !== "object" ||
    parametres === null ||
    Array.isArray(parametres) ||
    Object.getPrototypeOf(parametres) !== Object.prototype ||
    !estDonneePure(parametres)
  ) {
    throw new TypeError(`${nom} : paramètres sous forme d'objet simple requis`);
  }
  for (const cle of Reflect.ownKeys(parametres)) {
    if (typeof cle !== "string" || !Object.hasOwn(regles, cle)) {
      throw new TypeError(`${nom} : paramètre inconnu « ${String(cle)} »`);
    }
    if (!regles[cle](parametres[cle])) {
      throw new RangeError(`${nom} : valeur invalide pour « ${cle} »`);
    }
  }
}

export function rationnel(numerateur, denominateur) {
  if (
    !Number.isSafeInteger(numerateur) ||
    numerateur < 0 ||
    !Number.isSafeInteger(denominateur) ||
    denominateur <= 0
  ) {
    throw new RangeError("rationnel : numérateur naturel et dénominateur positif requis");
  }
  return { numerateur, denominateur };
}

export function choisirFractionDuDomaine({
  aleatoire,
  parametres,
  denominateurs,
  denominateursParDefaut = denominateurs,
  numerateursParDenominateur,
  nom,
}) {
  const numerateurImpose = Object.hasOwn(parametres, "numerateur");
  const denominateurImpose = Object.hasOwn(parametres, "denominateur");
  const candidats = denominateurImpose
    ? denominateurs
    : denominateursParDefaut;
  const denominateursCompatibles = numerateurImpose
    ? candidats.filter((denominateur) =>
        estFractionDuDomaine(parametres.numerateur, denominateur))
    : candidats;
  if (denominateursCompatibles.length === 0) {
    throw new RangeError(`${nom} : numérateur hors du domaine`);
  }

  const denominateur = denominateurImpose
    ? parametres.denominateur
    : aleatoire.choix(denominateursCompatibles);
  const numerateur = numerateurImpose
    ? parametres.numerateur
    : aleatoire.choix(numerateursParDenominateur[denominateur]);
  if (
    !denominateurs.includes(denominateur) ||
    !estFractionDuDomaine(numerateur, denominateur)
  ) {
    throw new RangeError(
      `${nom} : numérateur incompatible avec le dénominateur`,
    );
  }
  return rationnel(numerateur, denominateur);
}

export function blocRationnel(id, numerateur, denominateur, ecriture) {
  if (ecriture !== "fraction" && ecriture !== "decimal") {
    throw new RangeError("blocRationnel : écriture fraction ou decimal requise");
  }
  return {
    id,
    type: "rationnel",
    ...rationnel(numerateur, denominateur),
    ecriture,
  };
}

export function classementFractions(microNotion, famille, complements = []) {
  const identite = microNotion === MICRO_NOTION_NC03
    ? IDENTITES_AUTOMATISMES.FRACTION_VERS_DECIMAL
    : microNotion === MICRO_NOTION_NC04
      ? IDENTITES_AUTOMATISMES.DECIMAL_VERS_FRACTION
      : null;
  if (!identite) {
    throw new RangeError(
      "classementFractions : micro-notion fraction-vers-decimal ou decimal-vers-fraction requise",
    );
  }
  const classement = creerClassementAutomatisme(identite, famille, complements);
  return {
    ...classement,
    // La taxonomie conserve un module canonique commun, tandis que le lecteur
    // distingue les deux sens comme deux notions de séance.
    notion: microNotion,
  };
}

export function reponseNombreDecimal(numerateur, denominateur) {
  return {
    type: TYPE_REPONSE_NOMBRE_DECIMAL,
    comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
    attendu: rationnel(numerateur, denominateur),
  };
}

export function reponseFractionEquivalente(numerateur, denominateur) {
  return {
    type: TYPE_REPONSE_FRACTION_EQUIVALENTE,
    comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
    attendu: rationnel(numerateur, denominateur),
  };
}

export function reponseNumerateurImpose(attendu) {
  if (!Number.isSafeInteger(attendu) || attendu < 0 || attendu > 999) {
    throw new RangeError("reponseNumerateurImpose : entier de 0 à 999 requis");
  }
  return {
    type: TYPE_REPONSE_ENTIER_NATUREL,
    comparaison: COMPARAISON_VALEUR_EXACTE,
    attendu,
    minimum: 0,
    maximum: 999,
  };
}

export function reponseChoixUnique(choix, idAttendu) {
  if (
    !Array.isArray(choix)
    || choix.length !== 4
    || choix.some(({ id, libelle }) =>
      typeof id !== "string"
      || id === ""
      || typeof libelle !== "string"
      || libelle === "")
    || new Set(choix.map(({ id }) => id)).size !== choix.length
    || !choix.some(({ id }) => id === idAttendu)
  ) {
    throw new TypeError("reponseChoixUnique : quatre choix distincts requis");
  }
  return {
    type: TYPE_REPONSE_CHOIX_UNIQUE,
    comparaison: COMPARAISON_CHOIX_EXACT,
    choix: choix.map(({ id, libelle }) => ({ id, libelle })),
    attendus: [idAttendu],
  };
}

export function creerGabaritFractions({ id, version, titre }) {
  return Object.freeze({
    schema: SCHEMA_GABARIT_QUESTION,
    id,
    version,
    titre,
    generateur: Object.freeze({ nom: id, version }),
    parametres: Object.freeze({}),
  });
}

export function familleSelonDenominateur(prefixe, denominateur) {
  const suffixe = {
    1: "denominateur-un",
    2: "demis",
    4: "quarts",
    10: "dixiemes",
    100: "centiemes",
    1000: "milliemes",
  }[denominateur];
  if (!suffixe) {
    throw new RangeError("familleSelonDenominateur : dénominateur non pris en charge");
  }
  return `${prefixe}-${suffixe}`;
}

export function nomDuRang(denominateur) {
  const nom = {
    10: "dixièmes",
    100: "centièmes",
    1000: "millièmes",
  }[denominateur];
  if (!nom) throw new RangeError("nomDuRang : fraction décimale requise");
  return nom;
}
