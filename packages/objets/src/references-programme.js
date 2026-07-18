/*
 * Références au programme officiel pour chaque objet de l'Atelier.
 *
 * Métadonnées du §10 de la matrice (docs/reference-matrice-automatismes/) :
 * un objet a un DOMAINE maths&go, un ou des NIVEAUX D'APPRENTISSAGE, et les
 * AUTOMATISMES officiels qu'il entraîne — qui ne sont pas toujours au niveau
 * d'apprentissage (Pythagore : appris en 4e, automatisme en 3e).
 *
 * CLASSEMENT PROPOSÉ PAR CLAUDE, À VALIDER PAR GWENAËL (comme les deux
 * fichiers de correspondance du même dossier docs).
 *
 * `automatismes` : identifiants de la matrice (voir programme-automatismes.js).
 * `formes` : ce que l'objet sait être aujourd'hui (manipulation, figure,
 * rédaction…), au sens du §10 (cours, manipulation, entraînement,
 * automatisme, jeu-recherche).
 * `note` : précisions, notamment quand le BO ne classe PAS la notion en
 * automatisme (absences explicites).
 */

import { automatisme } from "./programme-automatismes.js";

export const REFERENCES_PROGRAMME = {
  jetons: {
    titre: "Jetons de nombres relatifs",
    domaine: 1,
    niveauxApprentissage: ["5e"],
    automatismes: ["4-01", "4-02"],
    formes: ["manipulation"],
    note: "Les sommes et différences de relatifs deviennent des automatismes en 4e.",
  },
  equabarre: {
    titre: "ÉquaBarre — schéma en barres et rédaction",
    domaine: 2,
    niveauxApprentissage: ["5e", "4e"],
    automatismes: ["4-17", "4-21", "3-10"],
    formes: ["manipulation", "entraînement"],
    note: "Le schéma en barres est un modèle pré-algébrique introduit dès le cycle 3.",
  },
  splat: {
    titre: "Splat",
    domaine: 1,
    niveauxApprentissage: ["CM1", "CM2", "6e"],
    automatismes: ["CM1-02", "CM2-02"],
    formes: ["manipulation", "jeu-recherche"],
    note: "Entraîne les faits numériques du cours moyen ; aucun automatisme cycle 4 étiqueté.",
  },
  equasplat: {
    titre: "ÉquaSplat — deux plateaux",
    domaine: 2,
    niveauxApprentissage: ["5e", "4e"],
    automatismes: ["4-17", "3-10"],
    formes: ["manipulation"],
    note: "Même cible que ÉquaBarre, en représentation par plateaux.",
  },
  pourcentages: {
    titre: "Barre de pourcentage",
    domaine: 3,
    niveauxApprentissage: ["5e", "4e", "3e"],
    automatismes: ["5-18", "4-39", "4-40", "3-35", "3-37"],
    formes: ["figure", "entraînement"],
    note: "Couvre les repères (1 %, 10 %, 50 %…) et les évolutions.",
  },
  primitives: {
    titre: "Primitives géométriques (point, segment, droite, angle…)",
    domaine: 4,
    niveauxApprentissage: ["6e"],
    automatismes: ["6-26", "6-29"],
    formes: ["figure"],
    note: "Lexique et codages de base, automatisés dès la 6e.",
  },
  configurationsAngles: {
    titre: "Configurations d'angles",
    domaine: 4,
    niveauxApprentissage: ["5e"],
    automatismes: ["5-33", "5-34", "5-35", "5-36", "5-38"],
    formes: ["figure", "entraînement"],
    note: "Alternes-internes et correspondants restent des objectifs de 5e, pas des automatismes.",
  },
  thales: {
    titre: "Thalès",
    domaine: 4,
    niveauxApprentissage: ["3e"],
    automatismes: [],
    formes: ["figure", "entraînement"],
    note: "Absence explicite : Thalès n'apparaît dans aucune rubrique « Automatismes » du BO.",
  },
  figuresUsuelles: {
    titre: "Figures usuelles (triangles, quadrilatères, cercles…)",
    domaine: 4,
    niveauxApprentissage: ["6e", "5e", "4e"],
    automatismes: ["6-27", "6-28", "5-37", "5-39", "5-40", "5-41", "4-33", "4-34", "4-35"],
    formes: ["figure"],
    note: "Reconnaissance et codage des figures ; les constructions restent des objectifs.",
  },
  solides: {
    titre: "Solides en perspective cavalière",
    domaine: 4,
    niveauxApprentissage: ["6e", "5e", "4e", "3e"],
    automatismes: ["6-30", "5-29", "5-30", "4-27", "4-29", "3-21", "3-23", "3-24"],
    formes: ["figure"],
    note: "Vues et empilements de cubes (5-27, 5-28) : à rattacher quand l'objet existera.",
  },
};

/* Le labo présente des séries dont les noms ne recouvrent pas exactement les
 * clés ci-dessus (les figures usuelles y sont éclatées par catégorie). Cette
 * table fait le pont : nom de série du labo → clé de référence. */
const SERIE_VERS_REFERENCE = {
  Jetons: "jetons",
  "ÉquaBarre": "equabarre",
  Splat: "splat",
  "ÉquaSplat": "equasplat",
  Pourcentages: "pourcentages",
  Primitives: "primitives",
  Angles: "configurationsAngles",
  "Thalès": "thales",
  Solides: "solides",
};

/** La référence programme d'une série du labo (les catégories de figures
 * usuelles retombent toutes sur `figuresUsuelles`), ou null. */
export function referenceDeSerie(nomSerie) {
  const cle = SERIE_VERS_REFERENCE[nomSerie];
  if (cle) return { cle, ...REFERENCES_PROGRAMME[cle] };
  return { cle: "figuresUsuelles", ...REFERENCES_PROGRAMME.figuresUsuelles };
}

/** Les entrées complètes de la matrice pour une clé d'objet (ex. « jetons »). */
export function automatismesDeLObjet(cle) {
  const reference = REFERENCES_PROGRAMME[cle];
  if (!reference) return [];
  return reference.automatismes.map((id) => automatisme(id)).filter(Boolean);
}

/** Les niveaux où le BO étiquette l'objet « Automatismes », dans l'ordre
 * scolaire (ex. jetons → ["4e"] alors qu'il s'apprend en 5e). */
export function niveauxAutomatisation(cle) {
  const ordre = ["CM1", "CM2", "6e", "5e", "4e", "3e"];
  const niveaux = new Set(automatismesDeLObjet(cle).map((a) => a.niveau));
  return ordre.filter((n) => niveaux.has(n));
}
