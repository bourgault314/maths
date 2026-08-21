// NC-02/F3 — choisir le produit qui traduit une écriture au carré.

import {
  COMPARAISON_CHOIX_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
} from "../../../../contrats/src/question-v2.js?v=42";
import {
  BASES_CARRES_ENTIERS,
  blocPuissance,
  classementCarres,
  creerGabaritCarres,
  exigerAleatoireCarres,
  exigerParametresCarres,
  valeurParametreOuTirage,
} from "./commun.js?v=42";

export const NOM_GENERATEUR_SENS_NOTATION_CARRE =
  "nombres-et-calculs.carres-entiers-1-a-12.sens-notation";
export const VERSION_GENERATEUR_SENS_NOTATION_CARRE = 2;

// Les bases 0 et 2 sont écartées ici parce que certains distracteurs seraient
// alors visuellement identiques à la bonne réponse n × n.
export const BASES_SENS_NOTATION = Object.freeze(
  BASES_CARRES_ENTIERS.filter((base) => base !== 0 && base !== 2),
);

export const GABARIT_SENS_NOTATION_CARRE = creerGabaritCarres({
  id: NOM_GENERATEUR_SENS_NOTATION_CARRE,
  version: VERSION_GENERATEUR_SENS_NOTATION_CARRE,
  titre: "Carrés de 0 à 12 — sens de la notation",
});

const REGLES_PARAMETRES = Object.freeze({
  base: (valeur) => BASES_SENS_NOTATION.includes(valeur),
});

function construireChoix(base) {
  return [
    { id: "produit-facteurs-egaux", libelle: `${base} × ${base}` },
    { id: "produit-par-deux", libelle: `${base} × 2` },
    { id: "somme-double", libelle: `${base} + ${base}` },
    { id: "somme-plus-deux", libelle: `${base} + 2` },
  ];
}

export function genererQuestionSensNotationCarre({ aleatoire, parametres }) {
  exigerAleatoireCarres(aleatoire, "sens-notation-carre");
  exigerParametresCarres(
    parametres,
    REGLES_PARAMETRES,
    "sens-notation-carre",
  );
  const base = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "base",
    BASES_SENS_NOTATION,
  );

  return {
    classement: classementCarres("sens-notation"),
    enonce: [
      {
        id: "consigne-produit",
        type: "texte",
        contenu: "Quelle écriture correspond à ce carré ?",
      },
      blocPuissance("carre", base),
    ],
    reponse: {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      comparaison: COMPARAISON_CHOIX_EXACT,
      choix: aleatoire.melange(construireChoix(base)),
      attendus: ["produit-facteurs-egaux"],
    },
    aide: {
      blocs: [
        {
          id: "aide-carre-operation",
          type: "texte",
          contenu:
            "Observe le carré : il possède autant de rangées que de colonnes. Quelle opération permet de trouver le nombre total de carreaux ?",
        },
        {
          id: "aide-definition",
          type: "texte",
          contenu:
            "« Au carré » signifie « multiplié par lui-même » : a au carré = a × a.",
        },
        {
          id: "aide-repetition",
          type: "texte",
          contenu:
            "Repère le seul produit qui répète exactement le même facteur.",
        },
      ],
      outils: [],
    },
    correction: [
      {
        id: "correction-bonne-traduction",
        type: "texte",
        contenu: `La bonne traduction est ${base} × ${base} : le facteur ${base} apparaît deux fois.`,
      },
      {
        id: "correction-produit-deux",
        type: "texte",
        contenu: `${base} × 2 signifie « multiplier ${base} par 2 », pas « multiplier ${base} par lui-même ».`,
      },
      {
        id: "correction-somme-double",
        type: "texte",
        contenu: `${base} + ${base} est une addition, pas un produit.`,
      },
      {
        id: "correction-somme-plus-deux",
        type: "texte",
        contenu: `${base} + 2 ajoute 2 au nombre ; cela ne donne pas son carré.`,
      },
    ],
  };
}

export const GENERATEUR_SENS_NOTATION_CARRE = Object.freeze({
  nom: NOM_GENERATEUR_SENS_NOTATION_CARRE,
  version: VERSION_GENERATEUR_SENS_NOTATION_CARRE,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionSensNotationCarre,
});
