// NC-03 — passer d'une fraction simple ou décimale à son écriture décimale.

import {
  SCHEMA_QUESTION_INSTANCE_V2,
} from "../../../../contrats/src/question-v2.js?v=49";
import {
  MICRO_NOTION_NC03,
  PRESENTATIONS_FRACTIONS_DECIMAUX,
  NUMERATEURS_DEMIS,
  NUMERATEURS_QUARTS,
  blocRationnel,
  choisirFractionDuDomaine,
  classementFractions,
  creerGabaritFractions,
  exigerAleatoireFractions,
  exigerParametresFractions,
  familleSelonDenominateur,
  reponseChoixUnique,
  reponseNombreDecimal,
} from "./commun.js?v=49";
import {
  analyserEcritureDecimalePositive,
  formaterFractionEnDecimal,
  fractionsEgales,
} from "../../../../objets/src/fractions-decimaux.js?v=49";

export const NOM_GENERATEUR_FRACTION_VERS_DECIMAL =
  "nombres-et-calculs.fractions-simples-decimaux.fraction-vers-decimal";
export const VERSION_GENERATEUR_FRACTION_VERS_DECIMAL = 4;

export const GABARIT_FRACTION_VERS_DECIMAL = creerGabaritFractions({
  id: NOM_GENERATEUR_FRACTION_VERS_DECIMAL,
  version: VERSION_GENERATEUR_FRACTION_VERS_DECIMAL,
  titre: "Fractions simples et décimaux — fraction vers décimal",
});

export const NUMERATEURS_DIXIEMES = Object.freeze(
  Array.from({ length: 49 }, (_, index) => index + 1),
);
export const NUMERATEURS_CENTIEMES = Object.freeze(
  Array.from({ length: 250 }, (_, index) => index + 1),
);
export const NUMERATEURS_MILLIEMES = Object.freeze(
  Array.from({ length: 999 }, (_, index) => index + 1)
    .filter((numerateur) => numerateur % 10 !== 0),
);
export const NUMERATEURS_DENOMINATEUR_UN = Object.freeze(
  Array.from({ length: 11 }, (_, index) => index + 2),
);

const NUMERATEURS_PAR_DENOMINATEUR = Object.freeze({
  1: NUMERATEURS_DENOMINATEUR_UN,
  2: NUMERATEURS_DEMIS,
  4: NUMERATEURS_QUARTS,
  10: NUMERATEURS_DIXIEMES,
  100: NUMERATEURS_CENTIEMES,
  1000: NUMERATEURS_MILLIEMES,
});

const DENOMINATEURS_ORDINAIRES = Object.freeze([1, 2, 4, 10, 100]);
const REGLES_PARAMETRES = Object.freeze({
  numerateur: (valeur) => Number.isSafeInteger(valeur) && valeur >= 1,
  denominateur: (valeur) => Object.hasOwn(NUMERATEURS_PAR_DENOMINATEUR, valeur),
  presentation: (valeur) => PRESENTATIONS_FRACTIONS_DECIMAUX.includes(valeur),
});

function construireQcm(aleatoire, numerateur, denominateur) {
  const correct = formaterFractionEnDecimal(numerateur, denominateur);
  const formaterApproximation = (valeur) =>
    String(Number(valeur.toFixed(3))).replace(".", ",");
  const candidats = [];
  const ajouter = (id, libelle, diagnostic) => {
    const analyse = analyserEcritureDecimalePositive(libelle);
    if (
      fractionsEgales(
        analyse.fractionReduite.numerateur,
        analyse.fractionReduite.denominateur,
        numerateur,
        denominateur,
      )
      || candidats.some((candidat) => candidat.libelle === libelle)
    ) return;
    candidats.push({ id, libelle, diagnostic });
  };
  ajouter(
    "barre-comme-virgule",
    `${numerateur},${denominateur}`,
    "La barre de fraction n’est pas une virgule : elle indique une division.",
  );
  if (numerateur < denominateur) {
    ajouter(
      "complement-a-un",
      formaterFractionEnDecimal(denominateur - numerateur, denominateur),
      "Tu as choisi ce qui manque pour atteindre 1, et non la fraction demandée.",
    );
  } else {
    const reste = numerateur % denominateur;
    if (reste > 0) {
      ajouter(
        "unites-oubliees",
        formaterFractionEnDecimal(reste, denominateur),
        "Tu as converti seulement le reste et oublié les unités entières.",
      );
    }
    ajouter(
      "reste-oublie",
      String(Math.floor(numerateur / denominateur)),
      "Tu as conservé les unités entières mais oublié la fraction restante.",
    );
  }
  ajouter(
    "rang-trop-a-droite",
    formaterApproximation(numerateur / denominateur / 10),
    "Le dernier chiffre a été placé un rang trop à droite.",
  );
  ajouter(
    "numerateur-recopie",
    String(numerateur),
    "Le numérateur a été recopié sans tenir compte du dénominateur.",
  );
  for (let ecart = 1; candidats.length < 3; ecart += 1) {
    ajouter(
      `ecart-${ecart}`,
      formaterFractionEnDecimal(numerateur + ecart * denominateur, denominateur),
      "Cette valeur n’a pas le même ordre de grandeur que la fraction.",
    );
  }
  const retenus = candidats.slice(0, 3);
  return {
    reponse: reponseChoixUnique(
      aleatoire.melange([
        { id: "decimal-correct", libelle: correct },
        ...retenus.map(({ id, libelle }) => ({ id, libelle })),
      ]),
      "decimal-correct",
    ),
    diagnostics: retenus.map(({ id, diagnostic }) => ({
      id: `diagnostic-${id}`,
      type: "texte",
      contenu: diagnostic,
    })),
  };
}

export function genererQuestionFractionVersDecimal({ aleatoire, parametres }) {
  exigerAleatoireFractions(aleatoire, "fraction-vers-decimal");
  exigerParametresFractions(
    parametres,
    REGLES_PARAMETRES,
    "fraction-vers-decimal",
  );

  const { numerateur, denominateur } = choisirFractionDuDomaine({
    aleatoire,
    parametres,
    denominateurs: Object.keys(NUMERATEURS_PAR_DENOMINATEUR).map(Number),
    denominateursParDefaut: DENOMINATEURS_ORDINAIRES,
    numerateursParDenominateur: NUMERATEURS_PAR_DENOMINATEUR,
    nom: "fraction-vers-decimal",
  });

  const famille = familleSelonDenominateur(
    "fraction-vers-decimal",
    denominateur,
  );
  const presentation = parametres.presentation ?? "abstraite";
  const qcm = presentation === "qcm-diagnostique"
    ? construireQcm(aleatoire, numerateur, denominateur)
    : null;
  return {
    classement: classementFractions(MICRO_NOTION_NC03, famille, [
      `presentation-${presentation}`,
    ]),
    enonce: [
      {
        id: "consigne",
        type: "texte",
        contenu: presentation === "qcm-diagnostique"
            ? "Quelle est l’écriture décimale de cette fraction ?"
            : "Écris cette fraction en écriture décimale.",
      },
      blocRationnel("fraction", numerateur, denominateur, "fraction"),
    ],
    reponse: qcm?.reponse ?? reponseNombreDecimal(numerateur, denominateur),
    // Le lecteur construit l'aide et la correction à partir des mêmes objets
    // visuels. Le générateur ne conserve que les diagnostics propres au QCM.
    ...(qcm ? { correction: qcm.diagnostics } : {}),
  };
}

export const GENERATEUR_FRACTION_VERS_DECIMAL = Object.freeze({
  nom: NOM_GENERATEUR_FRACTION_VERS_DECIMAL,
  version: VERSION_GENERATEUR_FRACTION_VERS_DECIMAL,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionFractionVersDecimal,
});
