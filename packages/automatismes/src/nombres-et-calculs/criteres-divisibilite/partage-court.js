// NC-01/F6 — donner du sens à la divisibilité par un partage très court.
//
// Contenu et limites : fiche pédagogique NC-01 validée par Gwenaël le
// 19 juillet 2026. Les situations restent volontairement brèves : la lecture
// ne doit jamais devenir la difficulté principale.

import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
} from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_CHOIX_EXACT,
  COMPARAISON_VALEUR_EXACTE,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
  TYPE_REPONSE_ENTIER_NATUREL,
} from "../../../../contrats/src/question-v2.js?v=43";
import {
  IDENTITES_AUTOMATISMES,
  creerClassementAutomatisme,
} from "../../identifiants.js?v=43";
import { formulationCritereDivisibilite } from "./critere-precis.js?v=43";

export const NOM_GENERATEUR_PARTAGE_COURT =
  "nombres-et-calculs.criteres-divisibilite.partage-court";
export const VERSION_GENERATEUR_PARTAGE_COURT = 5;

export const SOUS_FORME_OUI_NON = "oui-non";
export const SOUS_FORME_RETRAIT_MINIMAL = "retrait-minimal";

const SOUS_FORMES = Object.freeze([
  SOUS_FORME_OUI_NON,
  SOUS_FORME_RETRAIT_MINIMAL,
]);
const DIVISEURS = Object.freeze([2, 3, 5, 9, 10]);
const VERDICTS = Object.freeze(["oui", "non"]);

const CONTEXTES = Object.freeze([
  Object.freeze({ objet: "bonbon", objets: "bonbons", contenants: "sachets" }),
  Object.freeze({ objet: "jeton", objets: "jetons", contenants: "boîtes" }),
  Object.freeze({ objet: "carte", objets: "cartes", contenants: "pochettes" }),
  Object.freeze({ objet: "perle", objets: "perles", contenants: "sachets" }),
]);

const CHOIX_OUI_NON = Object.freeze([
  Object.freeze({ id: "oui", libelle: "Oui" }),
  Object.freeze({ id: "non", libelle: "Non" }),
]);

export const GABARIT_PARTAGE_COURT = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_PARTAGE_COURT,
  version: 5,
  titre: "Critères de divisibilité — situation de partage",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_PARTAGE_COURT,
    version: VERSION_GENERATEUR_PARTAGE_COURT,
  }),
  parametres: Object.freeze({}),
});

function exigerContexte(aleatoire, parametres) {
  if (
    typeof aleatoire !== "object"
    || aleatoire === null
    || typeof aleatoire.entier !== "function"
    || typeof aleatoire.choix !== "function"
  ) {
    throw new TypeError("partage-court : générateur aléatoire seedé requis");
  }
  if (
    typeof parametres !== "object"
    || parametres === null
    || Array.isArray(parametres)
    || Object.getPrototypeOf(parametres) !== Object.prototype
    || !estDonneePure(parametres)
  ) {
    throw new TypeError(
      "partage-court : paramètres sous forme d'objet simple requis",
    );
  }

  const clesPermises = new Set(["sousForme", "diviseur", "verdict"]);
  const inconnues = Reflect.ownKeys(parametres).filter(
    (cle) => typeof cle !== "string" || !clesPermises.has(cle),
  );
  if (inconnues.length > 0) {
    throw new TypeError(
      `partage-court : paramètre inconnu « ${inconnues[0]} »`,
    );
  }
  if (
    parametres.sousForme !== undefined
    && !SOUS_FORMES.includes(parametres.sousForme)
  ) {
    throw new RangeError(
      "partage-court : sousForme doit être oui-non ou retrait-minimal",
    );
  }
  if (
    parametres.diviseur !== undefined
    && !DIVISEURS.includes(parametres.diviseur)
  ) {
    throw new RangeError(
      "partage-court : diviseur doit être 2, 3, 5, 9 ou 10",
    );
  }
  if (
    parametres.verdict !== undefined
    && !VERDICTS.includes(parametres.verdict)
  ) {
    throw new RangeError(
      "partage-court : verdict doit être « oui » ou « non »",
    );
  }
  if (
    parametres.sousForme !== undefined
    && parametres.sousForme !== SOUS_FORME_OUI_NON
    && parametres.verdict !== undefined
  ) {
    throw new TypeError(
      "partage-court : verdict est réservé à la sous-forme oui-non",
    );
  }
}

function choisirSousForme(aleatoire, parametres) {
  if (parametres.sousForme !== undefined) return parametres.sousForme;
  if (parametres.verdict !== undefined) return SOUS_FORME_OUI_NON;
  if (parametres.diviseur !== undefined) {
    return aleatoire.choix([
      SOUS_FORME_OUI_NON,
      SOUS_FORME_RETRAIT_MINIMAL,
    ]);
  }
  return aleatoire.choix(SOUS_FORMES);
}

function bornesPourLongueur(longueur) {
  return {
    minimum: 10 ** (longueur - 1),
    maximum: 10 ** longueur - 1,
  };
}

function tirerTotalAvecVerdict(aleatoire, diviseur, divisible) {
  const longueur = aleatoire.entier(2, 4);
  const { minimum, maximum } = bornesPourLongueur(longueur);
  const reste = divisible ? 0 : aleatoire.entier(1, diviseur - 1);
  const quotientMinimum = Math.ceil((minimum - reste) / diviseur);
  const quotientMaximum = Math.floor((maximum - reste) / diviseur);
  const quotient = aleatoire.entier(quotientMinimum, quotientMaximum);
  return quotient * diviseur + reste;
}

function chiffresDe(nombre) {
  return String(nombre).split("").map(Number);
}

function sommeDesChiffres(nombre) {
  return chiffresDe(nombre).reduce((somme, chiffre) => somme + chiffre, 0);
}

export function calculerRetraitMinimal(total, diviseur) {
  if (!Number.isSafeInteger(total) || total < 10 || total > 9999) {
    throw new RangeError(
      "calculerRetraitMinimal : entier de 2 à 4 chiffres requis",
    );
  }
  if (!DIVISEURS.includes(diviseur)) {
    throw new RangeError(
      "calculerRetraitMinimal : diviseur doit être 2, 3, 5, 9 ou 10",
    );
  }
  return total % diviseur;
}

function indicationCritere(diviseur) {
  const action = diviseur === 3 || diviseur === 9
    ? "Additionne tous les chiffres."
    : "Observe le chiffre des unités.";
  return `${action} ${formulationCritereDivisibilite(diviseur)}`;
}

function outilPourCritere(diviseur) {
  return diviseur === 3 || diviseur === 9
    ? { type: "composer-somme-chiffres", source: "total" }
    : { type: "observer-unites", source: "total" };
}

function diagnosticCritere(nombre, diviseur) {
  const divisible = nombre % diviseur === 0;
  if (diviseur === 2) {
    const unite = nombre % 10;
    return `Le chiffre des unités de ${nombre} est ${unite}. ${unite} ${divisible ? "est" : "n'est pas"} pair : le critère par 2 ${divisible ? "est" : "n'est pas"} vérifié.`;
  }
  if (diviseur === 5) {
    const unite = nombre % 10;
    return `Le chiffre des unités de ${nombre} est ${unite}. Il ${divisible ? "est" : "n'est pas"} égal à 0 ou 5 : le critère par 5 ${divisible ? "est" : "n'est pas"} vérifié.`;
  }
  if (diviseur === 10) {
    const unite = nombre % 10;
    return `Le chiffre des unités de ${nombre} est ${unite}. Il ${divisible ? "est" : "n'est pas"} égal à 0 : le critère par 10 ${divisible ? "est" : "n'est pas"} vérifié.`;
  }
  const chiffres = chiffresDe(nombre);
  const somme = sommeDesChiffres(nombre);
  return `La somme des chiffres de ${nombre} est ${chiffres.join(" + ")} = ${somme}. ${somme} ${divisible ? "est" : "n'est pas"} un multiple de ${diviseur} : le critère par ${diviseur} ${divisible ? "est" : "n'est pas"} vérifié.`;
}

function classement(diviseur) {
  return creerClassementAutomatisme(
    IDENTITES_AUTOMATISMES.CRITERES_DIVISIBILITE,
    "partage-court",
    diviseur === 10 || diviseur === undefined
      ? ["critere-divisibilite-10"]
      : [],
  );
}

function blocsEnonce({ sousForme, total, diviseur, contexte }) {
  const fin = sousForme === SOUS_FORME_OUI_NON
    ? `${contexte.contenants} identiques, sans reste. Est-ce possible ?`
    : `${contexte.contenants} identiques. Quel est le plus petit nombre de ${contexte.objets} à retirer pour qu'il n'en reste pas une fois la répartition effectuée ?`;
  return [
    { id: "debut-situation", type: "texte", contenu: "On a" },
    { id: "total", type: "entier", valeur: total },
    {
      id: "milieu-situation",
      type: "texte",
      contenu: `${contexte.objets} à répartir équitablement dans`,
    },
    { id: "diviseur", type: "entier", valeur: diviseur },
    { id: "fin-situation", type: "texte", contenu: fin },
  ];
}

function questionOuiNon({ total, diviseur, contexte }) {
  const divisible = total % diviseur === 0;
  return {
    classement: classement(diviseur),
    enonce: blocsEnonce({
      sousForme: SOUS_FORME_OUI_NON,
      total,
      diviseur,
      contexte,
    }),
    reponse: {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      comparaison: COMPARAISON_CHOIX_EXACT,
      choix: CHOIX_OUI_NON.map((choix) => ({ ...choix })),
      attendus: [divisible ? "oui" : "non"],
    },
    aide: {
      blocs: [
        {
          id: "choisir-critere",
          type: "texte",
          contenu: indicationCritere(diviseur),
        },
        {
          id: "relier-partage",
          type: "texte",
          contenu: "Demande-toi ensuite si ce critère permet un partage sans reste.",
        },
      ],
      outils: [outilPourCritere(diviseur)],
    },
    correction: [
      {
        id: "verification-critere",
        type: "texte",
        contenu: diagnosticCritere(total, diviseur),
      },
      {
        id: "conclusion-partage",
        type: "texte",
        contenu: divisible
          ? `Le partage dans ${diviseur} ${contexte.contenants} est donc possible sans reste.`
          : `Le partage dans ${diviseur} ${contexte.contenants} est donc impossible sans reste.`,
      },
    ],
  };
}

function questionRetraitMinimal({ total, diviseur, contexte }) {
  const retrait = calculerRetraitMinimal(total, diviseur);
  if (retrait === 0) {
    throw new Error(
      "partage-court : un retrait minimal doit partir d'un partage impossible",
    );
  }
  const nouveauTotal = total - retrait;
  return {
    classement: classement(diviseur),
    enonce: blocsEnonce({
      sousForme: SOUS_FORME_RETRAIT_MINIMAL,
      total,
      diviseur,
      contexte,
    }),
    reponse: {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      comparaison: COMPARAISON_VALEUR_EXACTE,
      attendu: retrait,
      minimum: 0,
      maximum: 9,
    },
    aide: {
      blocs: [
        {
          id: "partir-du-plus-petit",
          type: "texte",
          contenu: "Commence par le plus petit retrait possible et augmente seulement si nécessaire.",
        },
        {
          id: "appliquer-critere",
          type: "texte",
          contenu: indicationCritere(diviseur),
        },
      ],
      outils: [outilPourCritere(diviseur)],
    },
    correction: [
      {
        id: "multiple-precedent",
        type: "texte",
        contenu: `Avec le critère par ${diviseur}, le multiple juste avant ${total} est ${nouveauTotal}.`,
      },
      {
        id: "calcul-retrait",
        type: "texte",
        contenu: `${total} − ${nouveauTotal} = ${retrait}.`,
      },
      {
        id: "conclusion-retrait",
        type: "texte",
        contenu: `${nouveauTotal} se partage sans reste. Il faut donc retirer ${retrait} ${retrait === 1 ? contexte.objet : contexte.objets}.`,
      },
    ],
  };
}

export function genererQuestionPartageCourt({ aleatoire, parametres }) {
  exigerContexte(aleatoire, parametres);
  const sousForme = choisirSousForme(aleatoire, parametres);
  const contexte = aleatoire.choix(CONTEXTES);

  const diviseur = parametres.diviseur ?? aleatoire.choix(DIVISEURS);
  if (sousForme === SOUS_FORME_RETRAIT_MINIMAL) {
    return questionRetraitMinimal({
      total: tirerTotalAvecVerdict(aleatoire, diviseur, false),
      diviseur,
      contexte,
    });
  }

  const verdict = parametres.verdict ?? aleatoire.choix(VERDICTS);
  return questionOuiNon({
    total: tirerTotalAvecVerdict(aleatoire, diviseur, verdict === "oui"),
    diviseur,
    contexte,
  });
}

export const GENERATEUR_PARTAGE_COURT = Object.freeze({
  nom: NOM_GENERATEUR_PARTAGE_COURT,
  version: VERSION_GENERATEUR_PARTAGE_COURT,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionPartageCourt,
});
