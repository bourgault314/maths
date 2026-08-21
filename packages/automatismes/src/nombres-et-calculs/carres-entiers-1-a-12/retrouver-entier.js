// NC-02/F2 — retrouver l'entier de 0 à 12 à partir de son carré.

import {
  COMPARAISON_VALEURS_EXACTES,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_DEUX_ENTIERS,
} from "../../../../contrats/src/question-v2.js?v=44";
import {
  BASES_CARRES_ENTIERS,
  blocPuissance,
  calculerCarre,
  classementCarres,
  creerGabaritCarres,
  exigerAleatoireCarres,
  exigerParametresCarres,
  reponseEntier,
  valeurParametreOuTirage,
} from "./commun.js?v=44";

export const NOM_GENERATEUR_RETROUVER_ENTIER_CARRE =
  "nombres-et-calculs.carres-entiers-1-a-12.retrouver-entier";
export const VERSION_GENERATEUR_RETROUVER_ENTIER_CARRE = 3;

// La borne du lecteur décrit ici une capacité de saisie, pas l'ensemble des
// réponses justes. Elle autorise notamment 80 et la recopie erronée du carré
// affiché (jusqu'à 144), qui doivent être validées puis comptées fausses.
export const MAXIMUM_SAISIE_RETROUVER_ENTIER_CARRE = 144;

export const FORMES_RETROUVER_ENTIER = Object.freeze([
  "question-verbale",
  "egalite-carre",
  "produit-facteurs-egaux",
]);

export const GABARIT_RETROUVER_ENTIER_CARRE = creerGabaritCarres({
  id: NOM_GENERATEUR_RETROUVER_ENTIER_CARRE,
  version: VERSION_GENERATEUR_RETROUVER_ENTIER_CARRE,
  titre: "Carrés de 0 à 12 — retrouver l'entier",
});

const REGLES_PARAMETRES = Object.freeze({
  base: (valeur) => BASES_CARRES_ENTIERS.includes(valeur),
  forme: (valeur) => FORMES_RETROUVER_ENTIER.includes(valeur),
});

function construireEnonce(carre, forme) {
  if (forme === "question-verbale") {
    return [
      {
        id: "consigne-question-verbale",
        type: "texte",
        contenu: "Quel entier naturel a pour carré",
      },
      { id: "carre-cible", type: "entier", valeur: carre },
      { id: "ponctuation-question-verbale", type: "texte", contenu: "?" },
    ];
  }
  if (forme === "egalite-carre") {
    return [
      {
        id: "consigne-egalite-carre",
        type: "texte",
        contenu: "Complète l'égalité avec un entier naturel.",
      },
      { id: "egalite-carre-cible", type: "entier", valeur: carre },
    ];
  }
  return [
    {
      id: "consigne-produit-facteurs-egaux",
      type: "texte",
      contenu: "Complète l'égalité avec deux facteurs égaux.",
    },
    { id: "produit-facteurs-egaux-cible", type: "entier", valeur: carre },
  ];
}

function construireReponse(base, forme) {
  if (forme !== "produit-facteurs-egaux") {
    return reponseEntier(base, 0, MAXIMUM_SAISIE_RETROUVER_ENTIER_CARRE);
  }
  return {
    type: TYPE_REPONSE_DEUX_ENTIERS,
    comparaison: COMPARAISON_VALEURS_EXACTES,
    attendus: [base, base],
    minimum: 0,
    maximum: MAXIMUM_SAISIE_RETROUVER_ENTIER_CARRE,
  };
}

export function genererQuestionRetrouverEntierCarre({ aleatoire, parametres }) {
  exigerAleatoireCarres(aleatoire, "retrouver-entier-carre");
  exigerParametresCarres(
    parametres,
    REGLES_PARAMETRES,
    "retrouver-entier-carre",
  );

  const base = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "base",
    BASES_CARRES_ENTIERS,
  );
  const forme = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "forme",
    FORMES_RETROUVER_ENTIER,
  );
  const carre = calculerCarre(base);

  return {
    classement: classementCarres("retrouver-entier", [`forme-${forme}`]),
    enonce: construireEnonce(carre, forme),
    reponse: construireReponse(base, forme),
    aide: {
      blocs: base === 0
        ? [
            {
              id: "aide-facteurs-egaux-zero",
              type: "texte",
              contenu: "Cherche deux facteurs égaux dont le produit vaut 0.",
            },
            {
              id: "aide-propriete-zero",
              type: "texte",
              contenu: "Pense à la règle de la multiplication par 0.",
            },
            {
              id: "aide-egalite-a-preparer",
              type: "texte",
              contenu: "0 = □ × □.",
            },
          ]
        : [
            {
              id: "aide-facteurs-egaux",
              type: "texte",
              contenu: `Cherche deux facteurs égaux dont le produit vaut ${carre}.`,
            },
            {
              id: "aide-carre-geometrique",
              type: "texte",
              contenu:
                "Imagine un carré contenant ce nombre de carreaux : ses côtés ont la même longueur.",
            },
            {
              id: "aide-egalite-a-preparer",
              type: "texte",
              contenu: `${carre} = □ × □.`,
            },
          ],
      outils: [],
    },
    correction: [
      {
        id: "correction-facteur-repete",
        type: "texte",
        contenu: `Le facteur ${base} est répété : ${carre} = ${base} × ${base}.`,
      },
      blocPuissance("correction-carre", base),
      {
        id: "correction-egalite",
        type: "texte",
        contenu: `Le carré de ${base} est égal à ${carre}.`,
      },
      {
        id: "correction-conclusion",
        type: "texte",
        contenu: `L'entier naturel recherché est ${base}.`,
      },
    ],
  };
}

export const GENERATEUR_RETROUVER_ENTIER_CARRE = Object.freeze({
  nom: NOM_GENERATEUR_RETROUVER_ENTIER_CARRE,
  version: VERSION_GENERATEUR_RETROUVER_ENTIER_CARRE,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionRetrouverEntierCarre,
});
