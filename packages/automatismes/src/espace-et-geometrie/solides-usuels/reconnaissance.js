// GE-12/F1 — reconnaître les six solides usuels du DNB.
//
// Contenu, limites, aide et correction : fiche GE-12 validée par Gwenaël le
// 19 juillet 2026. Génération et formulations écrites à neuf pour maths&go.

import { SCHEMA_GABARIT_QUESTION } from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_CHOIX_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_CHOIX_UNIQUE,
} from "../../../../contrats/src/question-v2.js?v=51";
import {
  IDENTITES_AUTOMATISMES,
  creerClassementAutomatisme,
} from "../../identifiants.js?v=51";

export const NOM_GENERATEUR_RECONNAISSANCE_SOLIDES =
  "espace-et-geometrie.solides-usuels.reconnaissance";
export const VERSION_GENERATEUR_RECONNAISSANCE_SOLIDES = 2;

export const GABARIT_RECONNAISSANCE_SOLIDES = Object.freeze({
  schema: SCHEMA_GABARIT_QUESTION,
  id: NOM_GENERATEUR_RECONNAISSANCE_SOLIDES,
  version: VERSION_GENERATEUR_RECONNAISSANCE_SOLIDES,
  titre: "Reconnaître les six solides usuels",
  generateur: Object.freeze({
    nom: NOM_GENERATEUR_RECONNAISSANCE_SOLIDES,
    version: VERSION_GENERATEUR_RECONNAISSANCE_SOLIDES,
  }),
  parametres: Object.freeze({}),
});

const SOLIDES = Object.freeze({
  cube: Object.freeze({
    libelle: "un cube",
    indice: "Observe ses faces : elles sont toutes carrées.",
    propriete: "Ses six faces sont des carrés.",
    confusions: Object.freeze(["cylindre", "pyramide", "cone"]),
    variantes: Object.freeze(["standard"]),
  }),
  pave: Object.freeze({
    libelle: "un pavé droit",
    indice: "Observe ses faces planes et sa forme de boîte rectangulaire.",
    propriete: "Il possède six faces rectangulaires et aucune surface courbe.",
    confusions: Object.freeze(["cube", "cylindre", "pyramide"]),
    variantes: Object.freeze(["allonge", "haut"]),
  }),
  prisme: Object.freeze({
    libelle: "un prisme droit",
    indice: "Cherche deux faces identiques placées aux deux extrémités.",
    propriete: "Il possède deux bases polygonales identiques et parallèles.",
    confusions: Object.freeze(["pyramide", "cylindre", "cone"]),
    variantes: Object.freeze(["triangle", "pentagone"]),
  }),
  cylindre: Object.freeze({
    libelle: "un cylindre",
    indice: "Observe sa surface courbe et ses deux extrémités rondes.",
    propriete: "Il possède deux disques parallèles et une surface courbe.",
    confusions: Object.freeze(["cone", "prisme", "pave"]),
    variantes: Object.freeze(["standard", "bas"]),
  }),
  pyramide: Object.freeze({
    libelle: "une pyramide",
    indice: "Observe ses faces triangulaires : elles se rejoignent en un sommet.",
    propriete: "Ses faces latérales triangulaires se rejoignent en un sommet.",
    confusions: Object.freeze(["prisme", "cone", "cylindre"]),
    variantes: Object.freeze(["carree", "triangulaire"]),
  }),
  cone: Object.freeze({
    libelle: "un cône",
    indice: "Observe sa base ronde et sa surface courbe qui se termine en pointe.",
    propriete: "Il possède un disque et une surface courbe qui rejoint un sommet.",
    confusions: Object.freeze(["cylindre", "pyramide", "prisme"]),
    variantes: Object.freeze(["standard", "large"]),
  }),
});

export const COURS_SOLIDES_USUELS = Object.freeze(
  Object.entries(SOLIDES).map(([forme, definition]) => Object.freeze({
    id: forme,
    nom: definition.libelle,
    phrase: definition.propriete,
    forme,
    variante: definition.variantes[0],
  })),
);

const VUES = Object.freeze([
  Object.freeze({ lacetDeg: -38, tangageDeg: 18 }),
  Object.freeze({ lacetDeg: -24, tangageDeg: 14 }),
  Object.freeze({ lacetDeg: 24, tangageDeg: 16 }),
  Object.freeze({ lacetDeg: 38, tangageDeg: 20 }),
]);

function exigerContexte(aleatoire, parametres) {
  if (
    typeof aleatoire !== "object" || aleatoire === null
    || typeof aleatoire.choix !== "function"
    || typeof aleatoire.melange !== "function"
  ) {
    throw new TypeError("reconnaissance-solides : générateur seedé requis");
  }
  if (
    typeof parametres !== "object" || parametres === null
    || Array.isArray(parametres)
  ) {
    throw new TypeError("reconnaissance-solides : paramètres simples requis");
  }
  const cles = new Set(["forme", "variante", "vueIndex"]);
  for (const cle of Object.keys(parametres)) {
    if (!cles.has(cle)) {
      throw new TypeError(`reconnaissance-solides : paramètre inconnu « ${cle} »`);
    }
  }
  if (parametres.forme !== undefined && !Object.hasOwn(SOLIDES, parametres.forme)) {
    throw new RangeError("reconnaissance-solides : forme inconnue");
  }
  if (
    parametres.vueIndex !== undefined
    && (!Number.isInteger(parametres.vueIndex) || !VUES[parametres.vueIndex])
  ) {
    throw new RangeError("reconnaissance-solides : vue inconnue");
  }
}

export function genererQuestionReconnaissanceSolides({ aleatoire, parametres }) {
  exigerContexte(aleatoire, parametres);
  const forme = parametres.forme ?? aleatoire.choix(Object.keys(SOLIDES));
  const definition = SOLIDES[forme];
  if (
    parametres.variante !== undefined
    && !definition.variantes.includes(parametres.variante)
  ) {
    throw new RangeError("reconnaissance-solides : variante incompatible");
  }
  const variante = parametres.variante ?? aleatoire.choix(definition.variantes);
  const vue = parametres.vueIndex === undefined
    ? aleatoire.choix(VUES)
    : VUES[parametres.vueIndex];
  const choix = aleatoire.melange([forme, ...definition.confusions]).map((id) => ({
    id,
    libelle: SOLIDES[id].libelle,
  }));

  return {
    classement: creerClassementAutomatisme(
      IDENTITES_AUTOMATISMES.RECONNAITRE_SOLIDES_USUELS,
      "reconnaissance",
    ),
    enonce: [
      { id: "consigne", type: "texte", contenu: "Quel est le nom de ce solide ?" },
      { id: "solide", type: "solide", forme, variante, vue: { ...vue } },
    ],
    reponse: {
      type: TYPE_REPONSE_CHOIX_UNIQUE,
      comparaison: COMPARAISON_CHOIX_EXACT,
      choix,
      attendus: [forme],
    },
    aide: {
      blocs: [
        { id: "observer", type: "texte", contenu: definition.indice },
        { id: "changer-vue", type: "texte", contenu: "Tourne doucement le solide pour mieux l'observer." },
      ],
      outils: [{ type: "tourner-solide", source: "solide" }],
    },
    correction: [
      { id: "propriete", type: "texte", contenu: definition.propriete },
      { id: "conclusion", type: "texte", contenu: `Donc ce solide est ${definition.libelle}.` },
    ],
  };
}

export const GENERATEUR_RECONNAISSANCE_SOLIDES = Object.freeze({
  nom: NOM_GENERATEUR_RECONNAISSANCE_SOLIDES,
  version: VERSION_GENERATEUR_RECONNAISSANCE_SOLIDES,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionReconnaissanceSolides,
});
