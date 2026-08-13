// NC-02/F1 — calculer directement le carré d'un entier de 0 à 12.

import {
  COMPARAISON_CHOIX_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
} from "../../../../contrats/src/question-v2.js?v=26";
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
} from "./commun.js?v=26";

export const NOM_GENERATEUR_CALCUL_DIRECT_CARRE =
  "nombres-et-calculs.carres-entiers-1-a-12.calcul-direct";
export const VERSION_GENERATEUR_CALCUL_DIRECT_CARRE = 2;

export const FORMULATIONS_CALCUL_DIRECT = Object.freeze([
  "calculer",
  "carre-de",
  "completer",
  "choisir-resultat",
  "encadrer-resultat",
]);

export const FORMULATIONS_CALCUL_DIRECT_QCM = Object.freeze([
  "choisir-resultat",
  "encadrer-resultat",
]);

export const BASES_ENCADREMENT_CARRE = Object.freeze(
  BASES_CARRES_ENTIERS.filter((base) => base >= 5),
);

export const GABARIT_CALCUL_DIRECT_CARRE = creerGabaritCarres({
  id: NOM_GENERATEUR_CALCUL_DIRECT_CARRE,
  version: VERSION_GENERATEUR_CALCUL_DIRECT_CARRE,
  titre: "Carrés de 0 à 12 — calcul direct",
});

const REGLES_PARAMETRES = Object.freeze({
  base: (valeur) => BASES_CARRES_ENTIERS.includes(valeur),
  formulation: (valeur) => FORMULATIONS_CALCUL_DIRECT.includes(valeur),
});

function construireEnonce(base, formulation) {
  if (["carre-de", "choisir-resultat"].includes(formulation)) {
    return [
      {
        id: formulation === "carre-de"
          ? "consigne-carre-de"
          : "consigne-choisir-resultat",
        type: "texte",
        contenu: "Quel est le carré de",
      },
      { id: "base", type: "entier", valeur: base },
      {
        id: "ponctuation-carre-de",
        type: "texte",
        contenu: "?",
      },
    ];
  }
  if (formulation === "encadrer-resultat") {
    return [
      {
        id: "consigne-encadrer-resultat",
        type: "texte",
        contenu: "Quel encadrement est correct pour",
      },
      blocPuissance("carre", base),
      { id: "ponctuation-encadrer", type: "texte", contenu: "?" },
    ];
  }
  return [
    {
      id: formulation === "calculer" ? "consigne-calculer" : "consigne-completer",
      type: "texte",
      contenu: formulation === "calculer" ? "Calcule." : "Complète l'égalité.",
    },
    blocPuissance("carre", base),
  ];
}

function distracteursResultat(base, resultat) {
  const candidats = [
    2 * base,
    base + 2,
    (base - 1) * (base - 1),
    base,
    resultat - base,
    resultat + base,
    (base + 1) * (base + 1),
    (base + 2) * (base + 2),
    resultat - 1,
    resultat + 1,
  ];
  return [...new Set(candidats)].filter((valeur) =>
    Number.isSafeInteger(valeur) && valeur >= 0 && valeur !== resultat);
}

function bornesEncadrement(resultat) {
  if (resultat % 10 === 0) return [resultat - 10, resultat + 10];
  const borneInferieure = Math.floor(resultat / 10) * 10;
  return [borneInferieure, borneInferieure + 10];
}

function libelleEncadrement([minimum, maximum]) {
  return `Entre ${minimum} et ${maximum}`;
}

function choixResultat(aleatoire, base, resultat) {
  const distracteurs = distracteursResultat(base, resultat).slice(0, 3);
  if (distracteurs.length !== 3) {
    throw new Error("calcul-direct-carre : trois distracteurs distincts requis");
  }
  return aleatoire.melange([
    { id: "resultat-correct", libelle: String(resultat) },
    ...distracteurs.map((valeur, index) => ({
      id: `distracteur-${index + 1}`,
      libelle: String(valeur),
    })),
  ]);
}

function choixEncadrement(aleatoire, base, resultat) {
  const correct = bornesEncadrement(resultat);
  const valeursErreurs = [
    2 * base,
    (base - 1) * (base - 1),
    base * (base - 1),
    base * 10,
    base + 2,
  ];
  const autres = valeursErreurs
    .map(bornesEncadrement)
    .filter(([minimum, maximum]) =>
      minimum >= 0 && (resultat < minimum || resultat > maximum));
  const uniques = [...new Map(autres.map((bornes) => [bornes.join(":"), bornes])).values()];
  const distracteurs = uniques.slice(0, 3);
  if (distracteurs.length !== 3) {
    throw new Error("calcul-direct-carre : trois encadrements distracteurs requis");
  }
  return {
    bornes: correct,
    choix: aleatoire.melange([
      { id: "encadrement-correct", libelle: libelleEncadrement(correct) },
      ...distracteurs.map((bornes, index) => ({
        id: `encadrement-distracteur-${index + 1}`,
        libelle: libelleEncadrement(bornes),
      })),
    ]),
  };
}

function construireReponse(aleatoire, base, resultat, formulation) {
  if (formulation === "choisir-resultat") {
    return {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      comparaison: COMPARAISON_CHOIX_EXACT,
      choix: choixResultat(aleatoire, base, resultat),
      attendus: ["resultat-correct"],
    };
  }
  if (formulation === "encadrer-resultat") {
    const { choix } = choixEncadrement(aleatoire, base, resultat);
    return {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      comparaison: COMPARAISON_CHOIX_EXACT,
      choix,
      attendus: ["encadrement-correct"],
    };
  }
  return reponseEntier(resultat, 0, 144);
}

export function genererQuestionCalculDirectCarre({ aleatoire, parametres }) {
  exigerAleatoireCarres(aleatoire, "calcul-direct-carre");
  exigerParametresCarres(
    parametres,
    REGLES_PARAMETRES,
    "calcul-direct-carre",
  );

  const formulationsPossibles = Object.hasOwn(parametres, "base")
    && !BASES_ENCADREMENT_CARRE.includes(parametres.base)
    ? FORMULATIONS_CALCUL_DIRECT.filter((forme) => forme !== "encadrer-resultat")
    : FORMULATIONS_CALCUL_DIRECT;
  const formulation = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "formulation",
    formulationsPossibles,
  );
  const basesPossibles = formulation === "encadrer-resultat"
    ? BASES_ENCADREMENT_CARRE
    : BASES_CARRES_ENTIERS;
  const base = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "base",
    basesPossibles,
  );
  if (formulation === "encadrer-resultat" && !BASES_ENCADREMENT_CARRE.includes(base)) {
    throw new RangeError("calcul-direct-carre : l'encadrement exige une base de 5 à 12");
  }
  const resultat = calculerCarre(base);
  const bornes = formulation === "encadrer-resultat"
    ? bornesEncadrement(resultat)
    : null;

  return {
    classement: classementCarres("calcul-direct", [`forme-${formulation}`]),
    enonce: construireEnonce(base, formulation),
    reponse: construireReponse(aleatoire, base, resultat, formulation),
    aide: {
      blocs: base === 0
        ? [
            {
              id: "aide-sens-zero",
              type: "texte",
              contenu: "Le petit 2 signifie que 0 apparaît deux fois comme facteur.",
            },
            blocPuissance("aide-carre", base),
            {
              id: "aide-produit-zero",
              type: "texte",
              contenu: "Écris 0 × 0, puis utilise la règle de la multiplication par 0.",
            },
          ]
        : [
            {
              id: "aide-representation",
              type: "texte",
              contenu:
                `Observe le carré : il a ${base} rangées et ${base} colonnes de même longueur.`,
            },
            {
              id: "aide-sens",
              type: "texte",
              contenu:
                "Le petit 2 signifie que le même nombre apparaît deux fois comme facteur.",
            },
            blocPuissance("aide-carre", base),
            {
              id: "aide-produit",
              type: "texte",
              contenu: `Écris le produit ${base} × ${base}, puis calcule-le.`,
            },
          ],
      outils: [],
    },
    correction: [
      {
        id: "correction-lecture",
        type: "texte",
        contenu: `${base} au carré signifie ${base} multiplié par lui-même.`,
      },
      blocPuissance("correction-carre", base),
      {
        id: "correction-produit",
        type: "texte",
        contenu: `${base} × ${base} = ${resultat}.`,
      },
      {
        id: "correction-conclusion",
        type: "texte",
        contenu: bornes
          ? `${resultat} est compris entre ${bornes[0]} et ${bornes[1]}.`
          : `Le carré de ${base} est ${resultat}.`,
      },
    ],
  };
}

export const GENERATEUR_CALCUL_DIRECT_CARRE = Object.freeze({
  nom: NOM_GENERATEUR_CALCUL_DIRECT_CARRE,
  version: VERSION_GENERATEUR_CALCUL_DIRECT_CARRE,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionCalculDirectCarre,
});
