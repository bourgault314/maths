// NC-01/F1 — appliquer un critère de divisibilité précis.
//
// Contenu validé dans la fiche pédagogique NC-01 le 19 juillet 2026.
// Génération écrite à neuf pour maths&go : aucune donnée de l'ancienne banque
// n'est utilisée.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_CHOIX_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
} from "../../../../contrats/src/question-v2.js?v=30";
import {
  IDENTITES_AUTOMATISMES,
  creerClassementAutomatisme,
} from "../../identifiants.js?v=30";

export const NOM_GENERATEUR_CRITERE_PRECIS =
  "nombres-et-calculs.criteres-divisibilite.critere-precis";
export const VERSION_GENERATEUR_CRITERE_PRECIS = 3;

export const DIVISEURS_CRITERES_NC01 = Object.freeze([2, 3, 5, 9, 10]);

const VERDICTS = Object.freeze(["oui", "non"]);
const PARAMETRES_AUTORISES = new Set(["diviseur", "verdict"]);
const CHOIX_REPONSE = Object.freeze([
  Object.freeze({ id: "oui", libelle: "Oui" }),
  Object.freeze({ id: "non", libelle: "Non" }),
]);

export const GABARIT_CRITERE_PRECIS = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_CRITERE_PRECIS,
  version: 3,
  titre: "Critères de divisibilité — critère précis",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_CRITERE_PRECIS,
    version: VERSION_GENERATEUR_CRITERE_PRECIS,
  }),
  parametres: Object.freeze({}),
});

function exigerAleatoire(aleatoire) {
  if (
    typeof aleatoire !== "object" ||
    aleatoire === null ||
    typeof aleatoire.entier !== "function" ||
    typeof aleatoire.choix !== "function"
  ) {
    throw new TypeError("critere-precis : générateur aléatoire seedé requis");
  }
}

function exigerParametres(parametres) {
  if (
    typeof parametres !== "object" ||
    parametres === null ||
    Array.isArray(parametres) ||
    Object.getPrototypeOf(parametres) !== Object.prototype ||
    !estDonneePure(parametres)
  ) {
    throw new TypeError("critere-precis : paramètres sous forme d'objet simple requis");
  }

  const inconnus = Reflect.ownKeys(parametres).filter(
    (cle) => typeof cle !== "string" || !PARAMETRES_AUTORISES.has(cle),
  );
  if (inconnus.length > 0) {
    throw new TypeError(
      `critere-precis : paramètre inconnu « ${String(inconnus[0])} »`,
    );
  }
  if (
    Object.hasOwn(parametres, "diviseur") &&
    !DIVISEURS_CRITERES_NC01.includes(parametres.diviseur)
  ) {
    throw new RangeError(
      "critere-precis : diviseur attendu parmi 2, 3, 5, 9 et 10",
    );
  }
  if (
    Object.hasOwn(parametres, "verdict") &&
    !VERDICTS.includes(parametres.verdict)
  ) {
    throw new RangeError("critere-precis : verdict « oui » ou « non » attendu");
  }
}

export function estDivisibleParCritere(nombre, diviseur) {
  if (!Number.isSafeInteger(nombre) || nombre < 10) {
    throw new RangeError(
      "estDivisibleParCritere : entier positif d'au moins deux chiffres requis",
    );
  }
  if (!DIVISEURS_CRITERES_NC01.includes(diviseur)) {
    throw new RangeError(
      "estDivisibleParCritere : diviseur attendu parmi 2, 3, 5, 9 et 10",
    );
  }
  return nombre % diviseur === 0;
}

function compterNonMultiples(minimum, maximum, diviseur) {
  const total = maximum - minimum + 1;
  const multiples =
    Math.floor(maximum / diviseur) - Math.floor((minimum - 1) / diviseur);
  return total - multiples;
}

/**
 * Tire uniformément un entier de 2 à 4 chiffres qui respecte le verdict.
 * Le rang d'un non-multiple est converti par recherche dichotomique : aucun
 * rejet aléatoire ne peut donc modifier imprévisiblement le plan d'une série.
 */
export function tirerNombreSelonDivisibilite(
  aleatoire,
  diviseur,
  doitEtreDivisible,
) {
  if (
    typeof aleatoire !== "object" ||
    aleatoire === null ||
    typeof aleatoire.entier !== "function"
  ) {
    throw new TypeError(
      "tirerNombreSelonDivisibilite : générateur aléatoire seedé requis",
    );
  }
  if (!DIVISEURS_CRITERES_NC01.includes(diviseur)) {
    throw new RangeError(
      "tirerNombreSelonDivisibilite : diviseur attendu parmi 2, 3, 5, 9 et 10",
    );
  }
  if (typeof doitEtreDivisible !== "boolean") {
    throw new TypeError(
      "tirerNombreSelonDivisibilite : verdict booléen requis",
    );
  }

  const longueur = aleatoire.entier(2, 4);
  const minimum = 10 ** (longueur - 1);
  const maximum = 10 ** longueur - 1;

  if (doitEtreDivisible) {
    const premierQuotient = Math.ceil(minimum / diviseur);
    const dernierQuotient = Math.floor(maximum / diviseur);
    return aleatoire.entier(premierQuotient, dernierQuotient) * diviseur;
  }

  const rang = aleatoire.entier(
    0,
    compterNonMultiples(minimum, maximum, diviseur) - 1,
  );
  let bas = minimum;
  let haut = maximum;
  while (bas < haut) {
    const milieu = Math.floor((bas + haut) / 2);
    const nonMultiplesJusquIci = compterNonMultiples(
      minimum,
      milieu,
      diviseur,
    );
    if (nonMultiplesJusquIci > rang) haut = milieu;
    else bas = milieu + 1;
  }
  return bas;
}

function chiffresDe(nombre) {
  return String(nombre).split("").map(Number);
}

function listeUnites(diviseur) {
  if (diviseur === 2) return "0, 2, 4, 6 ou 8";
  if (diviseur === 5) return "0 ou 5";
  return "0";
}

export function formulationCritereDivisibilite(diviseur) {
  if (!DIVISEURS_CRITERES_NC01.includes(diviseur)) {
    throw new RangeError(
      "formulationCritereDivisibilite : diviseur attendu parmi 2, 3, 5, 9 et 10",
    );
  }
  if ([2, 5, 10].includes(diviseur)) {
    return `Le chiffre des unités doit être ${listeUnites(diviseur)}.`;
  }
  return `La somme de tous les chiffres doit être un multiple de ${diviseur}.`;
}

/** Produit l'explication complète d'un nombre pour un critère donné. */
export function construireCorrectionCritere(nombre, diviseur) {
  const divisible = estDivisibleParCritere(nombre, diviseur);
  const conclusion = divisible
    ? `${nombre} est divisible par ${diviseur}.`
    : `${nombre} n'est pas divisible par ${diviseur}.`;

  if ([2, 5, 10].includes(diviseur)) {
    const unite = nombre % 10;
    const respect = divisible ? "respecte" : "ne respecte pas";
    return (
      `${nombre} : son chiffre des unités est ${unite}. ` +
      `Pour être divisible par ${diviseur}, ce chiffre doit être ${listeUnites(diviseur)}. ` +
      `Le chiffre ${unite} ${respect} ce critère. Donc ${conclusion}`
    );
  }

  const chiffres = chiffresDe(nombre);
  const somme = chiffres.reduce((total, chiffre) => total + chiffre, 0);
  const statut = somme % diviseur === 0 ? "est" : "n'est pas";
  return (
    `${nombre} : la somme de ses chiffres est ${chiffres.join(" + ")} = ${somme}. ` +
    `${somme} ${statut} un multiple de ${diviseur}. Donc ${conclusion}`
  );
}

function construireAide(diviseur) {
  if ([2, 5, 10].includes(diviseur)) {
    return {
      blocs: [
        {
          id: "aide-unites",
          type: "texte",
          contenu: "Observe le chiffre des unités.",
        },
        {
          id: "aide-critere",
          type: "texte",
          contenu: formulationCritereDivisibilite(diviseur),
        },
      ],
      outils: [{ type: "observer-unites", source: "nombre" }],
    };
  }
  return {
    blocs: [
      {
        id: "aide-somme",
        type: "texte",
        contenu: "Additionne tous les chiffres.",
      },
      {
        id: "aide-multiple",
        type: "texte",
        contenu: formulationCritereDivisibilite(diviseur),
      },
    ],
    outils: [{ type: "composer-somme-chiffres", source: "nombre" }],
  };
}

export function genererQuestionCriterePrecis({ aleatoire, parametres }) {
  exigerAleatoire(aleatoire);
  exigerParametres(parametres);

  const diviseur = Object.hasOwn(parametres, "diviseur")
    ? parametres.diviseur
    : aleatoire.choix(DIVISEURS_CRITERES_NC01);
  const verdict = Object.hasOwn(parametres, "verdict")
    ? parametres.verdict
    : aleatoire.choix(VERDICTS);
  const nombre = tirerNombreSelonDivisibilite(
    aleatoire,
    diviseur,
    verdict === "oui",
  );

  return {
    classement: creerClassementAutomatisme(
      IDENTITES_AUTOMATISMES.CRITERES_DIVISIBILITE,
      "critere-precis",
      diviseur === 10 ? ["critere-divisibilite-10"] : [],
    ),
    enonce: [
      {
        id: "consigne",
        type: "texte",
        contenu: `Ce nombre est-il divisible par ${diviseur} ?`,
      },
      { id: "nombre", type: "entier", valeur: nombre },
    ],
    reponse: {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      comparaison: COMPARAISON_CHOIX_EXACT,
      choix: CHOIX_REPONSE.map((choix) => ({ ...choix })),
      attendus: [verdict],
    },
    aide: construireAide(diviseur),
    correction: [
      {
        id: "correction-critere",
        type: "texte",
        contenu: construireCorrectionCritere(nombre, diviseur),
      },
      {
        id: "correction-reponse",
        type: "texte",
        contenu: `La bonne réponse est « ${verdict === "oui" ? "Oui" : "Non"} ».`,
      },
    ],
  };
}

export const GENERATEUR_CRITERE_PRECIS = Object.freeze({
  nom: NOM_GENERATEUR_CRITERE_PRECIS,
  version: VERSION_GENERATEUR_CRITERE_PRECIS,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionCriterePrecis,
});
