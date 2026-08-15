// GM-13 à GM-15 — calcul mental de volumes (anciens codes PG-22 à PG-24).
// Contenu validé dans la fiche pédagogique du 19 juillet 2026.

import { SCHEMA_GABARIT_QUESTION } from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_CHOIX_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
} from "../../../../contrats/src/question-v2.js?v=29";
import {
  IDENTITES_AUTOMATISMES,
  creerClassementAutomatisme,
} from "../../identifiants.js?v=29";

const VERSION = 1;
const VUES = Object.freeze([
  Object.freeze({ lacetDeg: -36, tangageDeg: 18 }),
  Object.freeze({ lacetDeg: -24, tangageDeg: 15 }),
  Object.freeze({ lacetDeg: 28, tangageDeg: 17 }),
]);

function gabarit(id, titre) {
  return Object.freeze({
    schema: SCHEMA_GABARIT_QUESTION,
    id,
    version: VERSION,
    titre,
    generateur: Object.freeze({ nom: id, version: VERSION }),
    parametres: Object.freeze({}),
  });
}

export const NOM_GENERATEUR_VOLUME_CUBE_PAVE = "grandeurs-et-mesures.volumes.cube-pave";
export const NOM_GENERATEUR_VOLUME_PRISME = "grandeurs-et-mesures.volumes.prisme";
export const NOM_GENERATEUR_VOLUME_CYLINDRE = "grandeurs-et-mesures.volumes.cylindre";

export const GABARIT_VOLUME_CUBE_PAVE = gabarit(
  NOM_GENERATEUR_VOLUME_CUBE_PAVE,
  "Calculer le volume d'un cube ou d'un pavé droit",
);
export const GABARIT_VOLUME_PRISME = gabarit(
  NOM_GENERATEUR_VOLUME_PRISME,
  "Calculer le volume d'un prisme droit",
);
export const GABARIT_VOLUME_CYLINDRE = gabarit(
  NOM_GENERATEUR_VOLUME_CYLINDRE,
  "Calculer le volume d'un cylindre",
);

const CUBES = Object.freeze([2, 3, 4, 5, 6]);
const PAVES = Object.freeze([
  Object.freeze([4, 3, 2]),
  Object.freeze([5, 4, 3]),
  Object.freeze([7, 3, 2]),
  Object.freeze([8, 5, 2]),
  Object.freeze([6, 4, 3]),
]);
const PRISMES = Object.freeze([
  Object.freeze({ aireBase: 6, hauteur: 4, variante: "triangle" }),
  Object.freeze({ aireBase: 8, hauteur: 5, variante: "pentagone" }),
  Object.freeze({ aireBase: 12, hauteur: 3, variante: "triangle" }),
  Object.freeze({ aireBase: 15, hauteur: 4, variante: "pentagone" }),
  Object.freeze({ aireBase: 18, hauteur: 5, variante: "triangle" }),
]);
const CYLINDRES = Object.freeze([
  Object.freeze({ rayon: 2, hauteur: 5 }),
  Object.freeze({ rayon: 3, hauteur: 4 }),
  Object.freeze({ rayon: 3, hauteur: 5 }),
  Object.freeze({ rayon: 4, hauteur: 2 }),
  Object.freeze({ rayon: 5, hauteur: 2 }),
]);

function exigerContexte(aleatoire, parametres, nom) {
  if (!aleatoire || typeof aleatoire.choix !== "function" || typeof aleatoire.melange !== "function") {
    throw new TypeError(`${nom} : générateur seedé requis`);
  }
  if (!parametres || Array.isArray(parametres) || Object.keys(parametres).length !== 0) {
    throw new TypeError(`${nom} : aucun paramètre autorisé en version 1`);
  }
}

function choixNumeriques(aleatoire, resultat, distracteurs, format = (n) => `${n} cm³`) {
  const valeurs = [...new Set([resultat, ...distracteurs])].slice(0, 4);
  if (valeurs.length !== 4) throw new Error("volumes : quatre résultats distincts requis");
  return aleatoire.melange(valeurs.map((valeur) => ({
    id: `v-${valeur}`,
    libelle: format(valeur),
  })));
}

function questionCommune({ identite, consigne, solide, choix, resultat, aide, correction }) {
  return {
    classement: creerClassementAutomatisme(identite, "calcul-volume"),
    enonce: [
      { id: "consigne", type: "texte", contenu: consigne },
      { id: "solide", type: "solide", ...solide },
    ],
    reponse: {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      comparaison: COMPARAISON_CHOIX_EXACT,
      choix,
      attendus: [`v-${resultat}`],
    },
    aide: {
      blocs: aide.map((contenu, index) => ({ id: `aide-${index + 1}`, type: "texte", contenu })),
      outils: [{ type: "tourner-solide", source: "solide" }],
    },
    correction: correction.map((contenu, index) => ({ id: `etape-${index + 1}`, type: "texte", contenu })),
  };
}

export function genererQuestionVolumeCubePave({ aleatoire, parametres }) {
  exigerContexte(aleatoire, parametres, "volume-cube-pave");
  const estCube = aleatoire.choix([true, false]);
  const vue = { ...aleatoire.choix(VUES) };
  if (estCube) {
    const arete = aleatoire.choix(CUBES);
    const resultat = arete ** 3;
    const choix = choixNumeriques(aleatoire, resultat, [
      arete ** 2,
      arete * 6,
      arete ** 2 + 1,
      resultat + arete,
      resultat - arete,
    ]);
    return questionCommune({
      identite: IDENTITES_AUTOMATISMES.VOLUME_CUBE_PAVE,
      consigne: "Quel est le volume de ce cube ?",
      solide: { forme: "cube", variante: "standard", vue, mesures: { arete, unite: "cm" } },
      choix,
      resultat,
      aide: [
        "Pour un cube : V = côté × côté × côté.",
        `Remplace chaque « côté » par ${arete} cm.`,
        "Effectue les deux multiplications, puis écris l'unité cube.",
      ],
      correction: [
        "V = côté × côté × côté.",
        `V = ${arete} × ${arete} × ${arete}.`,
        `V = ${resultat} cm³.`,
        `Le volume du cube est ${resultat} cm³.`,
      ],
    });
  }

  const [longueur, largeur, hauteur] = aleatoire.choix(PAVES);
  const resultat = longueur * largeur * hauteur;
  const choix = choixNumeriques(aleatoire, resultat, [
    longueur + largeur + hauteur,
    longueur * largeur,
    longueur * largeur + hauteur,
  ]);
  return questionCommune({
    identite: IDENTITES_AUTOMATISMES.VOLUME_CUBE_PAVE,
    consigne: "Quel est le volume de ce pavé droit ?",
    solide: {
      forme: "pave",
      variante: longueur >= 7 ? "allonge" : "haut",
      vue,
      mesures: { longueur, largeur, hauteur, unite: "cm" },
    },
    choix,
    resultat,
    aide: [
      "Pour un pavé droit : V = longueur × largeur × hauteur.",
      `Remplace par ${longueur} × ${largeur} × ${hauteur}.`,
      "Commence par le produit qui te paraît le plus simple.",
    ],
    correction: [
      "V = longueur × largeur × hauteur.",
      `V = ${longueur} × ${largeur} × ${hauteur}.`,
      `V = ${resultat} cm³.`,
      `Le volume du pavé droit est ${resultat} cm³.`,
    ],
  });
}

export function genererQuestionVolumePrisme({ aleatoire, parametres }) {
  exigerContexte(aleatoire, parametres, "volume-prisme");
  const donnees = aleatoire.choix(PRISMES);
  const { aireBase, hauteur, variante } = donnees;
  const resultat = aireBase * hauteur;
  const choix = choixNumeriques(aleatoire, resultat, [aireBase + hauteur, aireBase * 2, resultat + aireBase]);
  return questionCommune({
    identite: IDENTITES_AUTOMATISMES.VOLUME_PRISME_DROIT,
    consigne: "Quel est le volume de ce prisme droit ?",
    solide: {
      forme: "prisme",
      variante,
      vue: { ...aleatoire.choix(VUES) },
      mesures: { aireBase, hauteur, unite: "cm" },
    },
    choix,
    resultat,
    aide: [
      "Pour un prisme droit : V = aire de la base × hauteur.",
      `Ici, remplace par ${aireBase} × ${hauteur}.`,
      "Il reste une multiplication à effectuer.",
    ],
    correction: [
      "V = aire de la base × hauteur.",
      `V = ${aireBase} × ${hauteur}.`,
      `V = ${resultat} cm³.`,
      `Le volume du prisme droit est ${resultat} cm³.`,
    ],
  });
}

export function genererQuestionVolumeCylindre({ aleatoire, parametres }) {
  exigerContexte(aleatoire, parametres, "volume-cylindre");
  const { rayon, hauteur } = aleatoire.choix(CYLINDRES);
  const exact = aleatoire.choix([true, false]);
  const coefficient = rayon * rayon * hauteur;
  const resultat = exact ? `${coefficient}pi` : coefficient * 3;
  const distracteurs = exact
    ? [`${rayon * hauteur}pi`, `${rayon * rayon + hauteur}pi`, `${coefficient + hauteur}pi`]
    : [rayon * hauteur * 3, (rayon * rayon + hauteur) * 3, resultat + hauteur * 3];
  const format = exact
    ? (valeur) => `${String(valeur).replace("pi", "π")} cm³`
    : (valeur) => `environ ${valeur} cm³`;
  const choix = choixNumeriques(aleatoire, resultat, distracteurs, format);
  const consigne = exact
    ? "Quel est le volume exact de ce cylindre ?"
    : "Avec π ≈ 3, quel volume obtient-on environ pour ce cylindre ?";
  return questionCommune({
    identite: IDENTITES_AUTOMATISMES.VOLUME_CYLINDRE,
    consigne,
    solide: {
      forme: "cylindre",
      variante: hauteur <= 2 ? "bas" : "standard",
      vue: { ...aleatoire.choix(VUES) },
      mesures: { rayon, hauteur, unite: "cm", pi: exact ? "exact" : 3 },
    },
    choix,
    resultat,
    aide: [
      "Pour un cylindre : V = π × rayon × rayon × hauteur.",
      `Ici, remplace par ${exact ? "π" : "3"} × ${rayon} × ${rayon} × ${hauteur}.`,
      "Commence par calculer rayon × rayon.",
    ],
    correction: exact
      ? [
          "V = π × rayon × rayon × hauteur.",
          `V = π × ${rayon} × ${rayon} × ${hauteur}.`,
          `V = ${coefficient}π cm³.`,
          `Le volume exact du cylindre est ${coefficient}π cm³.`,
        ]
      : [
          "V = π × rayon × rayon × hauteur, avec π ≈ 3.",
          `V ≈ 3 × ${rayon} × ${rayon} × ${hauteur}.`,
          `V ≈ ${resultat} cm³.`,
          `Le volume du cylindre est environ ${resultat} cm³.`,
        ],
  });
}

function generateur(nom, generer) {
  return Object.freeze({ nom, version: VERSION, schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2, generer });
}

export const GENERATEUR_VOLUME_CUBE_PAVE = generateur(NOM_GENERATEUR_VOLUME_CUBE_PAVE, genererQuestionVolumeCubePave);
export const GENERATEUR_VOLUME_PRISME = generateur(NOM_GENERATEUR_VOLUME_PRISME, genererQuestionVolumePrisme);
export const GENERATEUR_VOLUME_CYLINDRE = generateur(NOM_GENERATEUR_VOLUME_CYLINDRE, genererQuestionVolumeCylindre);
