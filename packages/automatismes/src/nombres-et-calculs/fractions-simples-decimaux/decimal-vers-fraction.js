// NC-04 — passer d'une écriture décimale à une fraction simple. La plupart
// des questions imposent le dénominateur ; les productions libres acceptent
// toute fraction équivalente, réduite ou non.

import {
  SCHEMA_QUESTION_INSTANCE_V2,
} from "../../../../contrats/src/question-v2.js?v=37";
import { fractionsEgales } from "../../../../objets/src/fractions-decimaux.js?v=37";
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
  reponseChoixUnique,
  reponseFractionEquivalente,
  reponseNumerateurImpose,
} from "./commun.js?v=37";
import {
  NUMERATEURS_CENTIEMES,
  NUMERATEURS_DIXIEMES,
  NUMERATEURS_MILLIEMES,
} from "./fraction-vers-decimal.js?v=37";

export const NOM_GENERATEUR_DECIMAL_VERS_FRACTION =
  "nombres-et-calculs.fractions-simples-decimaux.decimal-vers-fraction";
export const VERSION_GENERATEUR_DECIMAL_VERS_FRACTION = 4;

export const GABARIT_DECIMAL_VERS_FRACTION = creerGabaritFractions({
  id: NOM_GENERATEUR_DECIMAL_VERS_FRACTION,
  version: VERSION_GENERATEUR_DECIMAL_VERS_FRACTION,
  titre: "Fractions simples et décimaux — décimal vers fraction",
});

export const FORMES_DECIMAL_VERS_FRACTION = Object.freeze([
  "denominateur-impose",
  "fraction-libre",
]);

export const CIBLES_FRACTION_LIBRE_DEMIS_QUARTS = Object.freeze([
  Object.freeze({ numerateur: 1, denominateur: 4 }),
  Object.freeze({ numerateur: 1, denominateur: 2 }),
  Object.freeze({ numerateur: 3, denominateur: 4 }),
  Object.freeze({ numerateur: 5, denominateur: 4 }),
  Object.freeze({ numerateur: 3, denominateur: 2 }),
  Object.freeze({ numerateur: 7, denominateur: 4 }),
  Object.freeze({ numerateur: 5, denominateur: 2 }),
  Object.freeze({ numerateur: 7, denominateur: 2 }),
  Object.freeze({ numerateur: 11, denominateur: 4 }),
]);

export const CIBLES_FRACTION_LIBRE_DECIMALES = Object.freeze([
  ...[1, 3, 7, 9, 12, 15, 21, 25, 32, 39, 42].map((numerateur) =>
    Object.freeze({ numerateur, denominateur: 10 })),
  ...[1, 3, 7, 12, 25, 47, 75, 103, 125, 147, 205, 225, 247].map(
    (numerateur) => Object.freeze({ numerateur, denominateur: 100 }),
  ),
]);

export const CIBLES_FRACTION_LIBRE = Object.freeze([
  ...CIBLES_FRACTION_LIBRE_DEMIS_QUARTS,
  ...CIBLES_FRACTION_LIBRE_DECIMALES,
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
    if (
      fractionsEgales(n, d, numerateur, denominateur)
      || candidats.some((candidat) => candidat.libelle === libelle)
    ) return;
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
      ? [2, 4, 10, 100]
      : Object.keys(NUMERATEURS_PAR_DENOMINATEUR).map(Number),
    denominateursParDefaut: forme === "fraction-libre"
      ? [2, 4, 10, 100]
      : DENOMINATEURS_ORDINAIRES,
    numerateursParDenominateur: NUMERATEURS_PAR_DENOMINATEUR,
    nom: "decimal-vers-fraction",
  });
  const { numerateur, denominateur } = fraction;
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
    // Le lecteur est l'unique source du pas-à-pas et de la correction. Les
    // diagnostics propres à chaque distracteur restent attachés au QCM.
    ...(qcm ? { correction: qcm.diagnostics } : {}),
  };
}

export const GENERATEUR_DECIMAL_VERS_FRACTION = Object.freeze({
  nom: NOM_GENERATEUR_DECIMAL_VERS_FRACTION,
  version: VERSION_GENERATEUR_DECIMAL_VERS_FRACTION,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionDecimalVersFraction,
});
