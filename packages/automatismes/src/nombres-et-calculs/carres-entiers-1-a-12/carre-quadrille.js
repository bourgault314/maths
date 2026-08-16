// NC-02/F5 — relier côté, rangées, colonnes et nombre de carreaux.
//
// Les blocs entiers portent les seules métadonnées nécessaires au lecteur :
// leur identifiant indique si le visuel reçoit un côté ou une aire. Le SVG
// reste un objet de rendu indépendant et n'est pas construit ici.

import {
  SCHEMA_QUESTION_INSTANCE_V2,
} from "../../../../contrats/src/question-v2.js?v=37";
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
} from "./commun.js?v=37";

export const NOM_GENERATEUR_CARRE_QUADRILLE =
  "nombres-et-calculs.carres-entiers-1-a-12.carre-quadrille";
export const VERSION_GENERATEUR_CARRE_QUADRILLE = 2;

export const FORMES_CARRE_QUADRILLE = Object.freeze([
  "trouver-aire",
  "trouver-cote",
]);

// Un carré 1 × 1 n'aide pas à voir la structure multiplicative. Le fait 1²
// reste pleinement travaillé dans les familles directe et inverse.
export const BASES_CARRE_QUADRILLE = Object.freeze(
  BASES_CARRES_ENTIERS.filter((base) => base >= 2),
);

export const GABARIT_CARRE_QUADRILLE = creerGabaritCarres({
  id: NOM_GENERATEUR_CARRE_QUADRILLE,
  version: VERSION_GENERATEUR_CARRE_QUADRILLE,
  titre: "Carrés de 0 à 12 — carré quadrillé",
});

const REGLES_PARAMETRES = Object.freeze({
  base: (valeur) => BASES_CARRE_QUADRILLE.includes(valeur),
  forme: (valeur) => FORMES_CARRE_QUADRILLE.includes(valeur),
});

function construireEnonce(base, aire, forme) {
  const carreaux = base === 1 ? "carreau" : "carreaux";
  if (forme === "trouver-cote") {
    return [
      {
        id: "consigne-trouver-cote",
        type: "texte",
        contenu: "Ce carré contient",
      },
      { id: "carre-quadrille-aire", type: "entier", valeur: aire },
      {
        id: "question-trouver-cote",
        type: "texte",
        contenu: "carreaux en tout. Combien y en a-t-il sur chaque côté ?",
      },
    ];
  }
  return [
    {
      id: "consigne-trouver-aire",
      type: "texte",
      contenu: "Ce carré a",
    },
    { id: "carre-quadrille-cote", type: "entier", valeur: base },
    {
      id: "question-trouver-aire",
      type: "texte",
      contenu: `${carreaux} sur chaque côté. Combien en contient-il en tout ?`,
    },
  ];
}

export function genererQuestionCarreQuadrille({ aleatoire, parametres }) {
  exigerAleatoireCarres(aleatoire, "carre-quadrille");
  exigerParametresCarres(
    parametres,
    REGLES_PARAMETRES,
    "carre-quadrille",
  );
  const base = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "base",
    BASES_CARRE_QUADRILLE,
  );
  const forme = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "forme",
    FORMES_CARRE_QUADRILLE,
  );
  const aire = calculerCarre(base);
  const motAire = aire === 1 ? "carreau" : "carreaux";
  const motRangee = base === 1 ? "rangée" : "rangées";
  const motColonne = base === 1 ? "colonne" : "colonnes";

  return {
    classement: classementCarres("carre-quadrille", [
      forme === "trouver-cote"
        ? "visuel-carre-aire-connue"
        : "visuel-carre-quadrille",
      forme,
    ]),
    enonce: construireEnonce(base, aire, forme),
    // Une mauvaise réponse plausible comme 80, ou la recopie de l'aire
    // affichée, doit pouvoir être saisie puis comptée fausse dans les deux
    // sens. La borne 144 est une capacité de saisie, pas un indice.
    reponse: reponseEntier(
      forme === "trouver-cote" ? base : aire,
      1,
      144,
    ),
    aide: {
      blocs: forme === "trouver-cote"
        ? [
            {
              id: "aide-cotes-egaux",
              type: "texte",
              contenu:
                `Le carré contient ${aire} ${motAire} en tout et ses côtés ont la même longueur.`,
            },
            {
              id: "aide-produit-inverse",
              type: "texte",
              contenu:
                `Cherche le même nombre de rangées et de colonnes dont le produit vaut ${aire}.`,
            },
            {
              id: "aide-verifier-cote",
              type: "texte",
              contenu:
                "Vérifie le nombre trouvé en le multipliant par lui-même.",
            },
          ]
        : [
            {
              id: "aide-rangees",
              type: "texte",
              contenu: `Repère les ${base} rangées du carré : chacune contient ${base} carreaux.`,
            },
            {
              id: "aide-produit",
              type: "texte",
              contenu: `Il y a ${base} ${motRangee} de ${base} ${motAire}. Écris ${base} × ${base}.`,
            },
            {
              id: "aide-calculer-aire",
              type: "texte",
              contenu:
                "Calcule ce produit sans compter tous les carreaux un par un.",
            },
          ],
      outils: [],
    },
    correction: [
      {
        id: "correction-rangees-colonnes",
        type: "texte",
        contenu: `Le carré a ${base} ${motRangee} de ${base} ${motAire}, donc aussi ${base} ${motColonne}.`,
      },
      {
        id: "correction-produit",
        type: "texte",
        contenu: `${base} × ${base} = ${aire}.`,
      },
      blocPuissance("correction-carre", base),
      {
        id: "correction-conclusion",
        type: "texte",
        contenu: forme === "trouver-cote"
          ? `Chaque côté compte ${base} ${motAire}.`
          : `Le carré contient ${aire} ${motAire} en tout.`,
      },
    ],
  };
}

export const GENERATEUR_CARRE_QUADRILLE = Object.freeze({
  nom: NOM_GENERATEUR_CARRE_QUADRILLE,
  version: VERSION_GENERATEUR_CARRE_QUADRILLE,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionCarreQuadrille,
});
