/*
 * Suivi d'origine de chaque module de maths&go.
 *
 * Décision du 18 juillet 2026 (voir docs/provenance-et-independance.md) :
 * la banque DocTools / DNB d'Éric Hakenholz ne sert plus que d'INVENTAIRE
 * des notions. Plus aucune formulation, banque JSON, `formula_code`,
 * distracteur, SVG ou générateur d'origine ne doit être conservé.
 *
 * Ce fichier dit, pour chaque module, D'OÙ IL VIENT. Il ne supprime rien et
 * ne change rien au rendu : c'est une carte, pas une démolition.
 *
 * STATUTS
 *   original_mathsgo : entièrement indépendant — conçu pour maths&go, ou porté
 *                      depuis les propres outils de Gwenaël (outils/).
 *   reconstruit      : inspiré d'une notion de l'inventaire, mais code, énoncé
 *                      et visuel écrits à neuf.
 *   herite_doctools  : contient encore de la matière d'origine — à remplacer.
 *   a_auditer        : pas encore examiné — ne rien conclure.
 *
 * `source` dit sur quoi le module s'appuie réellement (un fichier de outils/,
 * une fiche de Gwenaël, une notion du programme). `note` sert à l'audit.
 */

export const STATUTS = Object.freeze([
  "original_mathsgo",
  "reconstruit",
  "herite_doctools",
  "a_auditer",
]);

/* Les objets de la fondation V2 — packages/objets/src/*.js */
export const PROVENANCE_OBJETS = {
  "barres.js": {
    statut: "original_mathsgo",
    source: "outils/equabarre.html — langage barres relevé à l'écran (docs/langage-barres.md)",
  },
  "equation-barres.js": {
    statut: "original_mathsgo",
    source: "outils/equabarre.html",
  },
  "equabarre-logique.js": {
    statut: "original_mathsgo",
    source: "outils/equabarre.html — flux de manipulation lus ligne à ligne",
  },
  "equasplat-logique.js": {
    statut: "original_mathsgo",
    source: "outils/equasplat.html et outils/splat_equations.html",
  },
  "plateaux-splat.js": {
    statut: "original_mathsgo",
    source: "outils/equasplat.html",
  },
  "splat.js": {
    statut: "original_mathsgo",
    source: "concept de Steve Wyborney (crédité) ; silhouette portée depuis les outils de Gwenaël",
    note: "Le concept Splat est crédité à son auteur ; le dessin et le code sont maths&go.",
  },
  "jetons.js": {
    statut: "reconstruit",
    source: "outils/ — trois habillages relevés dans ses propres codes",
    aRemplacer: [
      "Les deux aplats #2e9e5b / #d9584b viennent de auto/scripts/shared/visuals/numbers/relative-tokens.js (absents de outils/) : à remplacer par des teintes de la charte.",
    ],
  },
  "redaction.js": { statut: "original_mathsgo", source: "gabarits de rédaction de Gwenaël" },
  "fleche.js": { statut: "original_mathsgo", source: "outils/equabarre.html (operationArrowSvg)" },
  "verification.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "clavier.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "expressions.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },

  "geometrie.js": { statut: "original_mathsgo", source: "écrit pour maths&go (calcul pur)" },
  "figure.js": { statut: "original_mathsgo", source: "écrit pour maths&go (fabrique déclarative)" },
  "figures-usuelles.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "solides.js": { statut: "original_mathsgo", source: "écrit pour maths&go (modèle 3D maison)" },
  "triangle.js": { statut: "reconstruit", source: "prototype, redessiné à neuf" },
  "configurations-angles.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "thales.js": {
    statut: "reconstruit",
    source: "fiche Thalès de Gwenaël ; construction par homothétie écrite à neuf",
    aRemplacer: [
      "Les 3 couleurs de COULEURS_THALES (#ff9114, #11468c, #1daeae) sont identiques à celles de auto/scripts/shared/visuals/geometry/thales-configuration.js (absentes de outils/) : à remplacer par des teintes de la charte.",
    ],
  },

  "pourcentages.js": {
    statut: "original_mathsgo",
    source: "outils/pourcentages_exerciceur.html — portage de SON générateur",
    note: "Audit du 18/07 : énoncés, contextes et bornes de tirage retrouvés mot pour mot dans son outil, et absents de auto/.",
  },
  "barre-pourcentage.js": {
    statut: "original_mathsgo",
    source: "gabarits LaTeX de Gwenaël (_gabarits_pourcentages.tex)",
    note: "Audit du 18/07 : les mentions de auto/ dans les commentaires ne sont que des références de besoin ; aucune couleur ni donnée copiée.",
  },

  "pythagore-logique.js": {
    statut: "original_mathsgo",
    source: "outils/pythabarre.html — lu ligne à ligne",
  },
  "pythagore.js": {
    statut: "a_auditer",
    source: "outils/pythabarre.html + studio/components/pythagore/visuals.js",
    note: "Dépend de PYTHAGORE_COLORS, dont l'origine est la seule question ouverte de l'audit (voir PROVENANCE_STUDIO).",
  },
};

/*
 * Le studio — pages et composants hors packages/.
 *
 * Le cas de studio/automatismes/ est particulier et parfaitement assumé :
 * c'est la PASSERELLE construite pour tester le nouveau menu avec le moteur
 * actuel. Elle se déclare elle-même copie fidèle de auto/ (encodage MG1,
 * liste des 43 modules, identifiants dnb_*). Elle est donc héritée PAR
 * CONSTRUCTION et disparaîtra d'elle-même le jour où le moteur sera migré.
 * Ce n'est pas une dette à réparer : c'est un échafaudage.
 */
export const PROVENANCE_STUDIO = {
  "studio/atelier/": {
    statut: "original_mathsgo",
    source: "écrit pour maths&go ; ne consomme que packages/",
    note: "Seule sortie vers auto/ : un lien de navigation vers la bibliothèque de visuels.",
  },
  "studio/automatismes/": {
    statut: "herite_doctools",
    source: "copie fidèle et déclarée de auto/ (passerelle de test)",
    note: "Échafaudage temporaire : tombe avec auto/ à la migration du moteur. Ne pas reconstruire.",
  },
  "studio/components/pythagore/visuals.js": {
    statut: "a_auditer",
    source: "revendique PythaBarre / Moulin de Pythagore",
    aRemplacer: [
      "Les 6 teintes de PYTHAGORE_COLORS figurent à l'identique dans auto/scripts/03-slideshow.js (coursePythagorasVisual), avec la même sémantique, et sont absentes de outils/ aujourd'hui.",
    ],
    note: "QUESTION POUR GWENAËL : ces couleurs viennent-elles d'une version de PythaBarre antérieure à celle du dépôt ? Si oui, rien à faire. Sinon, les remplacer par la charte — les géométries du moulin, elles, n'ont aucun équivalent dans auto/ et sont bien à nous.",
  },
};

/*
 * Les 43 modules de l'application Automatismes — auto/scripts/modules/.
 *
 * Classement établi par l'audit du 18 juillet 2026, sur trois signaux
 * VÉRIFIABLES dans le code (l'historique git de auto/ est aplati, « Add files
 * via upload » : git blame ne peut rien dater ici) :
 *   - le champ `source` déclaré par le module lui-même ;
 *   - la présence de `formula_code` (le mini-langage d'origine) ;
 *   - le taux d'énoncés vidés (`statement: ""`), signe d'une réécriture
 *     déportée vers auto/scripts/shared/pedagogy/.
 *
 * RIEN N'EST SUPPRIMÉ ICI. Ces modules restent en ligne et rendent service
 * aux élèves jusqu'à ce que leur remplaçant indépendant soit prêt et validé.
 */
const HERITE = { statut: "herite_doctools", source: "banque DocTools / DNB" };

/* Déjà purgés : énoncés réécrits, aucun formula_code. Contrôle d'indépendance. */
const RECONSTRUITS = {
  dnb_02b: "source « mathsgo », 12 énoncés sur 12 réécrits",
  dnb_03b: "source « mathsgo », 6 sur 6 réécrits",
  dnb_10: "source « moteur_mathsgo_reduction_v2 »",
  dnb_13: "12 sur 12 réécrits — étiquette `source` obsolète à corriger dans auto/",
  dnb_22: "18 sur 18 réécrits — étiquette `source` obsolète à corriger dans auto/",
  dnb_24b: "source « mathsgo_pythagoras_builder »",
  dnb_26: "12 sur 12 réécrits — étiquette `source` obsolète à corriger dans auto/",
  dnb_26b: "source « mathsgo »",
  dnb_38: "source « mathsgo_relative_tokens »",
  dnb_39: "source « mathsgo_decimal_relatives » — filiation interne dnb_02_q2 à vérifier",
};

/* Entamés mais pas finis : il reste de la matière d'origine. */
const PARTIELS = {
  dnb_01: "7 énoncés sur 16 réécrits, mais 2 formula_code subsistent",
  dnb_19: "9 sur 10 réécrits, mais 10 formula_code subsistent",
  dnb_20: "aucun formula_code, 30 visuels redessinés — 35 énoncés d'origine restent",
  dnb_02: "énoncés réécrits, mais numérotation lacunaire : dérive d'une base d'origine",
  dnb_07: "étiquette maths&go trompeuse : 10 formula_code et 10 énoncés d'origine",
};

export const PROVENANCE_MODULES_AUTOMATISMES = Object.fromEntries(
  [
    "dnb_01", "dnb_02", "dnb_02b", "dnb_03", "dnb_03b", "dnb_04", "dnb_05",
    "dnb_06", "dnb_07", "dnb_08", "dnb_09", "dnb_10", "dnb_11", "dnb_12",
    "dnb_13", "dnb_14", "dnb_15", "dnb_16", "dnb_17", "dnb_18", "dnb_19",
    "dnb_20", "dnb_21", "dnb_22", "dnb_23", "dnb_24", "dnb_24b", "dnb_25",
    "dnb_26", "dnb_26b", "dnb_27", "dnb_28", "dnb_29", "dnb_30", "dnb_31",
    "dnb_32", "dnb_33", "dnb_34", "dnb_35", "dnb_36", "dnb_37", "dnb_38",
    "dnb_39",
  ].map((nom) => {
    if (nom in RECONSTRUITS) {
      return [nom, { statut: "reconstruit", source: "notion de l'inventaire", note: RECONSTRUITS[nom] }];
    }
    if (nom in PARTIELS) {
      return [nom, { ...HERITE, note: PARTIELS[nom] }];
    }
    return [nom, { ...HERITE }];
  }),
);

/*
 * Le point le plus exposé du dossier, relevé par l'audit : ce ne sont pas les
 * énoncés (déjà purgés sur 10 modules) mais les 279 `formula_code` répartis
 * dans 32 fichiers, et surtout leur INTERPRÉTEUR réimplémenté dans
 * auto/scripts/02-question-engine.js (lignes 8-26 : RD, setNB, GCD, CUT,
 * runCode). La fonction `setNB(n){ return n; }` ne fait rien : elle n'existe
 * que pour ne pas casser les chaînes héritées. C'est la trace la plus nette
 * d'une reprise non transformée, et donc le premier chantier de remplacement.
 */
export const DETTE_PRIORITAIRE = Object.freeze({
  quoi: "formula_code et son interpréteur",
  occurrences: 279,
  fichiers: 32,
  interpreteur: "auto/scripts/02-question-engine.js:8-26",
});

/* Consultation */
function toutesLesEntrees() {
  return [
    ...Object.entries(PROVENANCE_OBJETS),
    ...Object.entries(PROVENANCE_MODULES_AUTOMATISMES),
    ...Object.entries(PROVENANCE_STUDIO),
  ];
}

export function origineDe(nom) {
  return (
    PROVENANCE_OBJETS[nom] ??
    PROVENANCE_MODULES_AUTOMATISMES[nom] ??
    PROVENANCE_STUDIO[nom] ??
    null
  );
}

/* Tout ce qui reste concrètement à remplacer, tous périmètres confondus. */
export function chantiersOuverts() {
  return toutesLesEntrees()
    .filter(([, o]) => Array.isArray(o.aRemplacer) && o.aRemplacer.length > 0)
    .map(([nom, o]) => ({ nom, statut: o.statut, aRemplacer: o.aRemplacer }));
}

export function modulesParStatut(statut) {
  return toutesLesEntrees()
    .filter(([, o]) => o.statut === statut)
    .map(([nom]) => nom)
    .sort();
}

/* Bilan affichable — sert au tableau de bord et aux rapports d'avancement. */
export function bilanProvenance() {
  const bilan = Object.fromEntries(STATUTS.map((s) => [s, 0]));
  for (const statut of STATUTS) bilan[statut] = modulesParStatut(statut).length;
  return bilan;
}
