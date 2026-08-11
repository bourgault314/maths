// NC-04 — passer d'une écriture décimale à une fraction simple. La plupart
// des questions imposent le dénominateur ; une seule question libre est
// réservée à la série longue et accepte toute fraction équivalente.

import {
  SCHEMA_QUESTION_INSTANCE_V2,
} from "../../../../contrats/src/question-v2.js?v=25";
import { reduireFraction } from "../../../../objets/src/fractions-decimaux.js?v=25";
import {
  MICRO_NOTION_NC04,
  NUMERATEURS_DEMIS,
  NUMERATEURS_QUARTS,
  PRESENTATIONS_FRACTIONS_DECIMAUX,
  blocRationnel,
  choisirFractionDuDomaine,
  classementFractions,
  creerGabaritFractions,
  exigerAleatoireFractions,
  exigerParametresFractions,
  familleSelonDenominateur,
  nomDuRang,
  rationnel,
  reponseChoixUnique,
  reponseFractionEquivalente,
  reponseNumerateurImpose,
} from "./commun.js?v=25";
import {
  NUMERATEURS_CENTIEMES,
  NUMERATEURS_DIXIEMES,
  NUMERATEURS_MILLIEMES,
} from "./fraction-vers-decimal.js?v=25";

export const NOM_GENERATEUR_DECIMAL_VERS_FRACTION =
  "nombres-et-calculs.fractions-simples-decimaux.decimal-vers-fraction";
export const VERSION_GENERATEUR_DECIMAL_VERS_FRACTION = 2;

export const GABARIT_DECIMAL_VERS_FRACTION = creerGabaritFractions({
  id: NOM_GENERATEUR_DECIMAL_VERS_FRACTION,
  version: VERSION_GENERATEUR_DECIMAL_VERS_FRACTION,
  titre: "Fractions simples et décimaux — décimal vers fraction",
});

export const FORMES_DECIMAL_VERS_FRACTION = Object.freeze([
  "denominateur-impose",
  "fraction-libre",
]);

export const CIBLES_FRACTION_LIBRE = Object.freeze([
  Object.freeze({ numerateur: 1, denominateur: 4 }),
  Object.freeze({ numerateur: 1, denominateur: 2 }),
  Object.freeze({ numerateur: 3, denominateur: 4 }),
  Object.freeze({ numerateur: 5, denominateur: 4 }),
  Object.freeze({ numerateur: 3, denominateur: 2 }),
  Object.freeze({ numerateur: 7, denominateur: 4 }),
  Object.freeze({ numerateur: 5, denominateur: 2 }),
  Object.freeze({ numerateur: 7, denominateur: 2 }),
]);

const NUMERATEURS_PAR_DENOMINATEUR = Object.freeze({
  2: NUMERATEURS_DEMIS,
  4: NUMERATEURS_QUARTS,
  10: NUMERATEURS_DIXIEMES,
  100: NUMERATEURS_CENTIEMES,
  1000: NUMERATEURS_MILLIEMES,
});

const DENOMINATEURS_ORDINAIRES = Object.freeze([2, 4, 10, 100]);
const REGLES_PARAMETRES = Object.freeze({
  numerateur: (valeur) => Number.isSafeInteger(valeur) && valeur >= 1,
  denominateur: (valeur) => Object.hasOwn(NUMERATEURS_PAR_DENOMINATEUR, valeur),
  forme: (valeur) => FORMES_DECIMAL_VERS_FRACTION.includes(valeur),
  presentation: (valeur) => PRESENTATIONS_FRACTIONS_DECIMAUX.includes(valeur),
});

function construireQcm(aleatoire, numerateur, denominateur) {
  const correct = `${numerateur}/${denominateur}`;
  const candidats = [];
  const ajouter = (id, n, d, diagnostic) => {
    if (!Number.isSafeInteger(n) || n < 0 || !Number.isSafeInteger(d) || d <= 0) return;
    const libelle = `${n}/${d}`;
    if (libelle === correct || candidats.some((candidat) => candidat.libelle === libelle)) return;
    candidats.push({ id, libelle, diagnostic });
  };
  ajouter(
    "fraction-inversee",
    denominateur,
    numerateur,
    "Le numérateur et le dénominateur ont été inversés.",
  );
  ajouter(
    "une-part-en-moins",
    Math.max(0, numerateur - 1),
    denominateur,
    "Il manque une part : relis la position exacte du nombre.",
  );
  ajouter(
    "une-part-en-plus",
    numerateur + 1,
    denominateur,
    "Une part a été ajoutée : recompte depuis zéro.",
  );
  ajouter(
    "mauvais-rang",
    numerateur,
    denominateur === 1000 ? 100 : denominateur * 10,
    "Le bon nombre de parts a été lu, mais pas dans le bon rang.",
  );
  const retenus = candidats.slice(0, 3);
  return {
    reponse: reponseChoixUnique(
      aleatoire.melange([
        { id: "fraction-correcte", libelle: correct },
        ...retenus.map(({ id, libelle }) => ({ id, libelle })),
      ]),
      "fraction-correcte",
    ),
    diagnostics: retenus.map(({ id, diagnostic }) => ({
      id: `diagnostic-${id}`,
      type: "texte",
      contenu: diagnostic,
    })),
  };
}

function construireAide(denominateur, forme) {
  if (forme === "fraction-libre") {
    return [
      {
        id: "aide-lire-rang-libre",
        type: "texte",
        contenu:
          "Regarde le dernier rang occupé et lis tout le nombre dans ce rang.",
      },
      {
        id: "aide-equivalences-libres",
        type: "texte",
        contenu:
          "Tu peux écrire cette fraction décimale ou une autre fraction qui repère le même nombre.",
      },
    ];
  }
  if (denominateur === 2) {
    return [
      {
        id: "aide-droite-demis",
        type: "texte",
        contenu:
          "Repère le nombre sur la droite des demis, puis compte les demis depuis zéro.",
      },
    ];
  }
  if (denominateur === 4) {
    return [
      {
        id: "aide-droite-quarts",
        type: "texte",
        contenu:
          "Repère le nombre sur la droite des quarts, puis compte les quarts depuis zéro.",
      },
    ];
  }
  const rang = nomDuRang(denominateur);
  return [
    {
      id: "aide-lire-rang",
      type: "texte",
      contenu: `Lis tout le nombre en ${rang}.`,
    },
    {
      id: "aide-echange-unites",
      type: "texte",
      contenu:
        `Dans le tableau, transforme si nécessaire les unités en ${rang}, puis compte-les toutes.`,
    },
  ];
}

function fractionReduite(numerateur, denominateur) {
  return reduireFraction(numerateur, denominateur);
}

function fractionDecimale(numerateur, denominateur) {
  if (denominateur === 2) return rationnel(numerateur * 5, 10);
  if (denominateur === 4) return rationnel(numerateur * 25, 100);
  return rationnel(numerateur, denominateur);
}

function construireCorrection(numerateur, denominateur, forme) {
  if (forme === "fraction-libre") {
    const decimale = fractionDecimale(numerateur, denominateur);
    const reduite = fractionReduite(numerateur, denominateur);
    const blocs = [
      {
        id: "correction-meme-nombre",
        type: "texte",
        contenu:
          "Ces écritures repèrent le même nombre : toutes les fractions équivalentes sont justes.",
      },
      blocRationnel(
        "correction-decimal",
        numerateur,
        denominateur,
        "decimal",
      ),
      blocRationnel(
        "correction-fraction-decimale",
        decimale.numerateur,
        decimale.denominateur,
        "fraction",
      ),
    ];
    if (
      reduite.numerateur !== decimale.numerateur ||
      reduite.denominateur !== decimale.denominateur
    ) {
      blocs.push(
        blocRationnel(
          "correction-fraction-reduite",
          reduite.numerateur,
          reduite.denominateur,
          "fraction",
        ),
      );
    }
    return blocs;
  }

  const methode = denominateur === 2
    ? "Sur la droite des demis, compte le nombre de demis depuis zéro."
    : denominateur === 4
      ? "Sur la droite des quarts, compte le nombre de quarts depuis zéro."
      : `Lis tout le nombre en ${nomDuRang(denominateur)}.`;
  return [
    { id: "correction-methode", type: "texte", contenu: methode },
    blocRationnel(
      "correction-decimal",
      numerateur,
      denominateur,
      "decimal",
    ),
    { id: "correction-egalite", type: "texte", contenu: "est égal à" },
    blocRationnel(
      "correction-fraction",
      numerateur,
      denominateur,
      "fraction",
    ),
  ];
}

export function genererQuestionDecimalVersFraction({ aleatoire, parametres }) {
  exigerAleatoireFractions(aleatoire, "decimal-vers-fraction");
  exigerParametresFractions(
    parametres,
    REGLES_PARAMETRES,
    "decimal-vers-fraction",
  );

  const forme = Object.hasOwn(parametres, "forme")
    ? parametres.forme
    : "denominateur-impose";
  const presentation = parametres.presentation ?? "abstraite";
  const sansValeurImposee =
    !Object.hasOwn(parametres, "numerateur") &&
    !Object.hasOwn(parametres, "denominateur");
  const cibleLibre = forme === "fraction-libre" && sansValeurImposee
    ? aleatoire.choix(CIBLES_FRACTION_LIBRE)
    : null;
  const fraction = cibleLibre ?? choisirFractionDuDomaine({
    aleatoire,
    parametres,
    denominateurs: forme === "fraction-libre"
      ? [2, 4]
      : Object.keys(NUMERATEURS_PAR_DENOMINATEUR).map(Number),
    denominateursParDefaut: forme === "fraction-libre"
      ? [2, 4]
      : DENOMINATEURS_ORDINAIRES,
    numerateursParDenominateur: NUMERATEURS_PAR_DENOMINATEUR,
    nom: "decimal-vers-fraction",
  });
  const { numerateur, denominateur } = fraction;
  if (
    presentation === "double-droite"
    && ![2, 4].includes(denominateur)
  ) {
    throw new RangeError(
      "decimal-vers-fraction : la double droite est réservée aux demis et aux quarts",
    );
  }
  if (forme === "fraction-libre" && presentation === "qcm-diagnostique") {
    throw new RangeError(
      "decimal-vers-fraction : une fraction libre ne peut pas être présentée en QCM",
    );
  }
  const qcm = presentation === "qcm-diagnostique"
    ? construireQcm(aleatoire, numerateur, denominateur)
    : null;

  const famille = forme === "fraction-libre"
    ? "decimal-vers-fraction-libre"
    : familleSelonDenominateur("decimal-vers-fraction", denominateur);
  const enonce = [
    {
      id: "consigne",
      type: "texte",
      contenu: forme === "fraction-libre"
        ? "Écris ce nombre sous forme de fraction. Toutes les fractions égales sont acceptées."
        : presentation === "double-droite"
          ? "Complète la fraction manquante sur la double droite."
          : presentation === "qcm-diagnostique"
            ? "Quelle fraction correspond à ce nombre ?"
            : "Complète l'égalité.",
    },
    blocRationnel("nombre-decimal", numerateur, denominateur, "decimal"),
  ];
  if (forme === "denominateur-impose" && presentation !== "qcm-diagnostique") {
    enonce.push({
      id: "denominateur-impose",
      type: "entier",
      valeur: denominateur,
    });
  }

  return {
    classement: classementFractions(MICRO_NOTION_NC04, famille, [
      `forme-${forme}`,
      `presentation-${presentation}`,
    ]),
    enonce,
    reponse: qcm?.reponse ?? (forme === "fraction-libre"
      ? reponseFractionEquivalente(numerateur, denominateur)
      : reponseNumerateurImpose(numerateur)),
    aide: {
      blocs: construireAide(denominateur, forme),
      outils: [],
    },
    correction: [
      ...construireCorrection(numerateur, denominateur, forme),
      ...(qcm?.diagnostics ?? []),
    ],
  };
}

export const GENERATEUR_DECIMAL_VERS_FRACTION = Object.freeze({
  nom: NOM_GENERATEUR_DECIMAL_VERS_FRACTION,
  version: VERSION_GENERATEUR_DECIMAL_VERS_FRACTION,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionDecimalVersFraction,
});
