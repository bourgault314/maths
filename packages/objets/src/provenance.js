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
    statut: "original_mathsgo",
    source: "outils/ — trois habillages relevés dans ses propres codes",
    note: "Les aplats #2e9e5b / #d9584b viennent de auto/, non de outils/ — l'audit y avait vu un emprunt. Correction de Gwenaël (18/07) : l'application d'origine était en NOIR ET BLANC, sans aide ni visuel ; tous les visuels et toutes les couleurs de auto/ sont de lui. Ces teintes sont donc les siennes.",
  },
  "redaction.js": { statut: "original_mathsgo", source: "gabarits de rédaction de Gwenaël" },
  "fleche.js": { statut: "original_mathsgo", source: "outils/equabarre.html (operationArrowSvg)" },
  "verification.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "clavier.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "expressions.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "carre-quadrille.js": {
    statut: "original_mathsgo",
    source: "fiche NC-02 et décision D-038 approuvées par Gwenaël les 6 et 7 août 2026 ; modèle aire = côté × côté écrit pour maths&go",
    note: "Les prototypes personnels historiques auto/scripts/shared/visuals/numbers/square-area.js et Labo des régularités ont été consultés comme inventaire d'intentions pédagogiques (aire inconnue, côté inconnu, rangées et colonnes). Aucun code, SVG, coordonnée, libellé ni couleur n'a été réemployé : l'objet officiel a été redessiné et réécrit à neuf pour la fondation V2. L'extension numérique de NC-02 à 0 ne crée aucun carré quadrillé 0 × 0 ; l'objet reste utilisé de 2 à 12 dans les questions.",
  },

  "geometrie.js": { statut: "original_mathsgo", source: "écrit pour maths&go (calcul pur)" },
  "figure.js": { statut: "original_mathsgo", source: "écrit pour maths&go (fabrique déclarative)" },
  "figures-usuelles.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "solides.js": { statut: "original_mathsgo", source: "écrit pour maths&go (modèle 3D maison)" },
  "triangle.js": { statut: "reconstruit", source: "prototype, redessiné à neuf" },
  "configurations-angles.js": { statut: "original_mathsgo", source: "écrit pour maths&go" },
  "thales.js": {
    statut: "original_mathsgo",
    source: "fiche Thalès de Gwenaël ; construction par homothétie écrite à neuf",
    note: "Les 3 couleurs de COULEURS_THALES viennent du composant de auto/ — donc de Gwenaël lui-même (voir jetons.js).",
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

  "fractions.js": {
    statut: "reconstruit",
    source: "PR #8 — pack de représentations, réécrit pour la fondation V2",
    note: "Bande et grille fractionnées reprises des sections « fraction-bar » et « fraction-grid » : le geste pédagogique est conservé (écriture fractionnaire dessinée, repère de l'unité, colonnes et lignes séparées), le code est réécrit en module ESM français, coordonnées arrondies à 2 décimales et couleurs prises dans la charte.",
  },

  "droite-graduee.js": {
    statut: "reconstruit",
    source: "PR #8 — pack de représentations, réécrit pour la fondation V2",
    note: "Sections « number-line » et « double-number-line » : les réglages pédagogiques sont conservés (bornes libres y compris négatives, pas décimal, points multiples étiquetés au-dessus ou en dessous, étiquettes de graduation remplaçables une par une, masquage total des nombres, graduations imposées, garde-fou anti-surcharge, double droite nommée, pourcentages calculés à partir du seul total). Code réécrit en module ESM français, couleurs prises dans la charte, et six défauts du rendu d'origine corrigés : virgule décimale française, vrai signe moins, trait pointillé interrompu devant les nombres, correspondance marquée aussi sur la ligne du bas, coordonnées arrondies à 2 décimales, hauteur ajustée au contenu.",
  },

  "pythagore-logique.js": {
    statut: "original_mathsgo",
    source: "outils/pythabarre.html — lu ligne à ligne",
  },
  "pythagore.js": {
    statut: "original_mathsgo",
    source: "outils/pythabarre.html + studio/components/pythagore/visuals.js",
    note: "Question des couleurs tranchée par Gwenaël le 18/07 : elles sont les siennes (voir jetons.js). Depuis le 19/07 elles vivent dans packages/charte et la racine dessinée vit ici : ce fichier ne dépend plus du studio.",
  },
};

/*
 * Les fichiers de production de toute la fondation V2.
 *
 * PROVENANCE_OBJETS reste l'inventaire détaillé des objets visuels. Cette vue
 * ajoute leur chemin complet et déclare les autres paquets surveillés par le
 * garde-fou V2. Le validateur compare cette liste au disque : un nouveau
 * fichier non déclaré, comme une déclaration devenue fantôme, fait échouer la
 * CI. Les tests suivent la provenance du fichier qu'ils vérifient et ne sont
 * donc pas répétés ici.
 */
export const PROVENANCE_FONDATION_V2 = Object.freeze({
  ...Object.fromEntries(
    Object.entries(PROVENANCE_OBJETS).map(([nom, origine]) => [
      `packages/objets/src/${nom}`,
      origine,
    ]),
  ),

  "automatismes-v2/app.js": {
    statut: "original_mathsgo",
    source: "parcours complets NC-01 et NC-02, décisions de disposition des 3, 6 et 7 août 2026",
  },
  "automatismes-v2/package.json": {
    statut: "original_mathsgo",
    source: "configuration du lecteur écrite pour Automatismes maths&go V2",
  },
  "automatismes-v2/src/etat-lecteur.js": {
    statut: "original_mathsgo",
    source: "contrats de séance et de trace validés pour Automatismes maths&go V2",
  },
  "automatismes-v2/src/registre-lecteur.js": {
    statut: "original_mathsgo",
    source: "architecture générique du lecteur décidée après l’audit maths&go du 20 juillet 2026",
  },

  "packages/objets/src/programme-automatismes.js": {
    statut: "original_mathsgo",
    source: "programmes officiels des cycles 3 et 4, structurés pour maths&go",
  },
  "packages/objets/src/references-programme.js": {
    statut: "original_mathsgo",
    source: "références des programmes officiels, structurées pour maths&go",
  },
  "packages/objets/src/provenance.js": {
    statut: "original_mathsgo",
    source: "doctrine de provenance décidée pour maths&go le 18 juillet 2026",
  },

  "packages/charte/src/charte.js": {
    statut: "original_mathsgo",
    source: "charte graphique de Gwenaël, structurée en données",
  },

  "packages/contrats/src/gabarit.js": {
    statut: "original_mathsgo",
    source: "contrat générique écrit pour Automatismes maths&go V2",
  },
  "packages/contrats/src/question-v2.js": {
    statut: "original_mathsgo",
    source: "spécification validée de la question V2 maths&go",
  },
  "packages/contrats/src/question.js": {
    statut: "original_mathsgo",
    source: "contrat générique écrit pour Automatismes maths&go V2",
  },
  "packages/contrats/src/seance.js": {
    statut: "original_mathsgo",
    source: "spécification validée de la séance V2 maths&go",
  },
  "packages/contrats/src/trace-reponse.js": {
    statut: "original_mathsgo",
    source: "spécification validée de la trace de réponse V2 maths&go",
  },

  "packages/moteur-exercices/src/aleatoire.js": {
    statut: "original_mathsgo",
    source: "générateur pseudo-aléatoire seedé écrit pour maths&go",
  },
  "packages/moteur-exercices/src/generation.js": {
    statut: "original_mathsgo",
    source: "registre de génération écrit pour Automatismes maths&go V2",
  },

  "packages/automatismes/src/registre.js": {
    statut: "original_mathsgo",
    source: "registre des notions NC-01 et NC-02 écrit pour Automatismes maths&go V2",
  },
  "packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js": {
    statut: "original_mathsgo",
    source: "fiche NC-01 et contenu F2 validés par Gwenaël le 19 juillet 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/critere-precis.js": {
    statut: "original_mathsgo",
    source: "fiche NC-01/F1 validée par Gwenaël le 19 juillet 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-nombres.js": {
    statut: "original_mathsgo",
    source: "fiche NC-01/F3 validée par Gwenaël le 19 juillet 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/chiffre-manquant.js": {
    statut: "original_mathsgo",
    source: "fiche NC-01/F5 validée par Gwenaël le 19 juillet 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/partage-court.js": {
    statut: "original_mathsgo",
    source: "fiche NC-01/F6 validée par Gwenaël le 19 juillet 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/serie.js": {
    statut: "original_mathsgo",
    source: "recette de série complète NC-01 décidée avec Gwenaël le 3 août 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/commun.js": {
    statut: "original_mathsgo",
    source: "invariants mathématiques de 0 à 12 et fiche NC-02 révisée approuvée par Gwenaël les 6 et 7 août 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/calcul-direct.js": {
    statut: "original_mathsgo",
    source: "famille F1 et distracteurs diagnostiques de la fiche NC-02 approuvés les 6 et 7 août 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/retrouver-entier.js": {
    statut: "original_mathsgo",
    source: "famille F2 de 0 à 12 et deux champs indépendants approuvés les 6 et 7 août 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/sens-notation.js": {
    statut: "original_mathsgo",
    source: "famille F3 de la fiche NC-02 approuvée par Gwenaël les 6 et 7 août 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/reconnaitre-carres.js": {
    statut: "original_mathsgo",
    source: "famille F4 et vocabulaire carrés parfaits approuvés les 6 et 7 août 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/carre-quadrille.js": {
    statut: "original_mathsgo",
    source: "famille F5 de 2 à 12, sans dessin 0 × 0, approuvée les 6 et 7 août 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/calcul-court.js": {
    statut: "original_mathsgo",
    source: "famille F6 et rédaction des calculs approuvées les 6 et 7 août 2026",
  },
  "packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/serie.js": {
    statut: "original_mathsgo",
    source: "quotas et couverture déterministe des treize bases NC-02 approuvés les 6 et 7 août 2026",
  },
  "packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js": {
    statut: "original_mathsgo",
    source: "fiche GE-12 validée par Gwenaël le 19 juillet 2026",
  },
  "packages/automatismes/src/grandeurs-et-mesures/volumes/calcul-volumes.js": {
    statut: "original_mathsgo",
    source: "fiche PG-22 à PG-24 validée par Gwenaël le 19 juillet 2026",
  },
});

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
    statut: "original_mathsgo",
    source: "PythaBarre / Moulin de Pythagore",
    note: "Sept de ces teintes figurent aussi dans auto/scripts/03-slideshow.js : c'est le même auteur, Gwenaël (relevé du 19/07). Depuis cette date le fichier ne garde que les géométries du moulin et réexporte la palette de la charte et la racine des objets.",
  },
};

/*
 * CORRECTION DE GWENAËL, 18 juillet 2026 — à lire avant toute conclusion.
 *
 * L'audit avait cherché les couleurs de nos objets dans `outils/` ; ne les y
 * trouvant pas, il en a déduit un emprunt à `auto/`. Le raisonnement était
 * faux, parce qu'il ignorait qui avait écrit `auto/`.
 *
 * L'application d'origine était en NOIR ET BLANC : des questions, rien
 * d'autre. Aucun visuel, aucune aide, aucune couleur. Tout ce qui est visuel
 * dans `auto/` — les couleurs, les schémas, la bibliothèque de 27 composants,
 * le système d'aide, le diaporama, l'interface mobile — a été ajouté par
 * Gwenaël. En volume comme en valeur pédagogique, la majeure partie de
 * l'application actuelle est son travail.
 *
 * Conséquence directe : la fondation V2 ne contient AUCUN emprunt. Les cinq
 * « emprunts de couleurs » relevés le 18/07 étaient ses propres couleurs,
 * reprises d'un de ses fichiers vers un autre.
 *
 * Ce qui reste réellement en cause se réduit à ce qui vient de l'archive
 * d'origine : les énoncés, les valeurs, les distracteurs et les
 * `formula_code` — voir DETTE_PRIORITAIRE. La preuve définitive viendra de
 * la comparaison avec le fichier d'origine publié (doctools.org), qui dira
 * ligne par ligne ce qui est de lui et ce qui ne l'est pas.
 */

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
    PROVENANCE_FONDATION_V2[nom] ??
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
