// Charte graphique maths&go — version 1, STATUT BROUILLON.
//
// Réponse au problème n°1 du site historique : « rien n'est régulier,
// les espacements sont moches, rien n'est cohérent ». Ici vit LA valeur
// officielle de chaque rôle ; les objets visuels (jetons, schémas en
// barres, équations, rédactions…) doivent consommer ces données et
// n'ont pas le droit d'inventer une couleur ou un espacement.
//
// Provenance : valeurs extraites des feuilles de style réelles du site
// le 18/07/2026. Quand plusieurs valeurs coexistaient pour le même rôle
// (2 turquoises, 2 oranges, 3 gris !), la valeur la plus utilisée a été
// retenue et les variantes relevées sont notées en commentaire.
// Gwenaël tranche : rien n'est définitif avant sa validation.

export const VERSION_CHARTE = 1;
export const STATUT_CHARTE = "brouillon"; // → "valide" après validation Gwenaël

export const COULEURS = {
  // Identité
  bleu: "#063f86",        // --blue / --mg-blue (3 emplois, valeur dominante)
  bleuFonce: "#052f67",   // variante relevée : #07336b (consentement)
  turquoise: "#08b9b2",   // --mg-turquoise ; variante relevée : #08aaa5
  orange: "#f58220",      // variante relevée : #ff880c
  encre: "#10294a",       // --ink, texte principal
  texteAttenue: "#637287",// variantes relevées : #5c6c82, #536176

  // Fonds
  page: "#f6f8fb",
  papier: "#ffffff",
  fondDoux: "#f5f9fc",    // --mg-soft
  ligne: "#dce5ef",       // filets, bordures discrètes

  // États pédagogiques (issus des outils existants)
  reussite: "#18a85b",
  erreur: "#e03434",
  attention: "#ff8a00",

  // Jetons de nombres relatifs — habillage « fiches et questions »
  // (aplat, contour noir, texte noir : PDF vert_rouge_contour_noir et
  // composant relative-tokens d'Automatismes)
  jetonAplatPositif: "#2e9e5b",
  jetonAplatNegatif: "#d9584b",
  jetonContour: "#111111",

  // Jetons — habillage « plateau de manipulation » (dégradé, texte
  // blanc : outils nombres_relatifs_somme_difference*)
  jetonPositif: "#16a34a",
  jetonPositifClair: "#4ade80",
  jetonPositifBord: "#14532d",
  jetonNegatif: "#dc2626",
  jetonNegatifClair: "#f87171",
  jetonNegatifBord: "#7f1d1d",
  jetonNeutralise: "#9ca3af",
  jetonNeutraliseBord: "#6b7280",
};

// Palette des outils « schémas en barres » (ÉquaBarre, PythaBarre,
// AngleBarre, Problèmes en barres) — relevée à l'identique dans les
// outils existants le 18/07/2026. C'est LE langage visuel des barres
// maths&go : tableau à filets gris-ardoise, cases blanches, inconnue
// bleu pâle, hachures d'état, conclusion en rouge.
export const COULEURS_BARRES = {
  encre: "#0f172a",          // texte des valeurs, --ink des outils
  attenue: "#64748b",        // étapes passées, textes secondaires
  filet: "#0f172a",          // traits du tableau (opacité 0.36 appliquée au rendu)
  nombreFond: "#ffffff",     // case nombre (dégradé vers #f8fafc)
  nombreFondBas: "#f8fafc",
  inconnueFond: "#dbeafe",   // case inconnue (dégradé vers #eff6ff)
  inconnueFondBas: "#eff6ff",
  inconnueTexte: "#1d4ed8",  // la lettre 𝑥 italique
  splat: "#050505",          // la tache Splat
  resultatFond: "#dcfce7",   // case résultat (dégradé vers #f0fdf4)
  resultatFondBas: "#f0fdf4",
  conclusion: "#dc2626",     // valeur résolue, conclusion
  hachureSuppression: "#f97316", // hachures oranges (sélection suppression)
  hachureAjout: "#16a34a",       // hachures vertes (sélection regroupement)
  hachureCalcul: "#3b82f6",      // hachures bleues (à calculer)
  supprimeFond: "#e5e7eb",       // case enlevée (hachures grises, opacité réduite)
  // Rôles sémantiques fixes (PythaBarre/AngleBarre : mêmes couleurs sur
  // la barre, la figure et l'équation)
  roleVert: "#22c55e",
  roleVertTexte: "#166534",
  roleBleu: "#3b82f6",
  roleBleuTexte: "#1d4ed8",
  roleOrange: "#f97316",
  roleOrangeTexte: "#9a3412",
};

// Palette OFFICIELLE des pourcentages — celle du générateur de Gwenaël
// (outils/pourcentages_exerciceur.html) et de ses gabarits imprimés
// (outils/_gabarits_pourcentages.tex, couleurs « Mathnipulez »). Une
// couleur par famille de découpage : c'est elle qui fait le lien entre
// l'écran, la fiche papier et le gabarit plastifié en classe.
// Les teintes divergentes d'auto/ (fraction-percent-bar) sont appelées
// à disparaître au profit de celles-ci.
export const COULEURS_POURCENTAGES = {
  c100: "#eb6464", // 100 % — rouge
  c50: "#ffe664", // 50 % (2 parts) — jaune
  c25: "#96dc96", // 25 % (4 parts) — vert
  c20: "#96c8eb", // 20 % (5 parts) — bleu
  c10: "#fab464", // 10 % (10 parts) — orange
  c5: "#ffa078", // 5 % (20 parts) — saumon
  c1: "#d2aaff", // 1 % (100 parts) — violet
  encre: "#1f2a44", // texte et traits (le --text de l'exerciceur)
  accent: "#3f7cff", // accolades de résultat (--accent)
  reste: "#10b981", // accolade « Reste » des diminutions (--success)
  hachureFond: "#e2e8f0", // part retirée : fond des hachures
  hachureTrait: "#ff4d6d", // part retirée : trait des hachures
};

// Palette historique du plateau de bandes de fractions de Gwenaël
// (`outils/fractions/bandes_fractions.html`). Elle ne remplace pas la
// couleur générique de `fractions.js` : les deux objets n'ont pas le même
// rôle. Ici, une couleur stable désigne le DÉNOMINATEUR du matériel que
// l'élève assemble ; dans `fractions.js`, le jaune désigne seulement les
// parts sélectionnées dans un tout déjà encadré.
//
// Le plateau possède également des couleurs `border` par dénominateur, mais
// elles ne dessinent pas les pièces visibles : leur contour réel est noir.
// Les composants réutilisables doivent donc consommer `trait`, pas recopier
// ces anciennes valeurs de configuration inutilisées.
export const COULEURS_BANDES_FRACTIONS = Object.freeze({
  unite: "#fff7e6",
  d2: "#facc15",
  d3: "#e9d5ff",
  d4: "#84cc16",
  d5: "#0ea5e9",
  d6: "#f97316",
  d8: "#f472b6",
  d10: "#b91c1c",
  d12: "#7dd3fc",
  encre: "#111827",
  trait: "#000000",
  guide: "#063f86",
});

/** Couleur historique d'une pièce `1 / denominateur`. */
export function couleurBandeFraction(denominateur) {
  return COULEURS_BANDES_FRACTIONS[`d${denominateur}`] ?? null;
}

// Palette et géométrie sémantique du plateau de numération décimale
// (`outils/plateaux_manipulation/numeration_decimale.html`). Le composant
// visuel garde les proportions 10 × 10, 10 × 1 et 1 × 1 ; ces couleurs font
// le lien avec le matériel physique et les captures de Claire.
export const COULEURS_NUMERATION_DECIMALE = Object.freeze({
  unite: "#ef4444",
  dixieme: "#22c55e",
  centieme: "#facc15",
  encre: "#111827",
  trait: "#000000",
});

/** La couleur de famille d'un découpage en `parts` parts égales. */
export function couleurFamillePourcentage(parts) {
  const familles = {
    1: COULEURS_POURCENTAGES.c100,
    2: COULEURS_POURCENTAGES.c50,
    4: COULEURS_POURCENTAGES.c25,
    5: COULEURS_POURCENTAGES.c20,
    10: COULEURS_POURCENTAGES.c10,
    20: COULEURS_POURCENTAGES.c5,
    100: COULEURS_POURCENTAGES.c1,
  };
  return familles[parts] ?? COULEURS_POURCENTAGES.c10;
}

// La palette de Pythagore — schéma en barres, moulin et pièces de Périgal.
// Elle vient des outils de Gwenaël (PythaBarre, Moulin de Pythagore) ;
// certaines de ces teintes figurent aussi dans auto/, ce qui est normal :
// même auteur (question tranchée par Gwenaël le 18/07/2026, voir
// packages/objets/src/provenance.js).
// Elle est déclarée ICI parce que la charte est la source unique des
// couleurs : les objets ne vont plus la chercher dans une page du studio.
// Objet gelé, comme il l'était à son emplacement précédent : les rendus
// existants s'appuient sur des valeurs qui ne bougent pas.
export const COULEURS_PYTHAGORE = Object.freeze({
  hypFill: "#e2f5e8", // hypoténuse au carré — fond
  hypStroke: "#24994d", // hypoténuse au carré — trait
  hypText: "#187a3c", // hypoténuse au carré — texte
  leg1Fill: "#dceeff", // premier côté de l'angle droit — fond
  leg1Stroke: "#0879d0", // premier côté — trait
  leg1Text: "#0879d0", // premier côté — texte
  leg2Fill: "#fff0d8", // second côté de l'angle droit — fond
  leg2Stroke: "#e89516", // second côté — trait
  leg2Text: "#b76e00", // second côté — texte
  outline: "#172033", // contours de la figure
  blue: "#169de8", // pièces de Périgal
  green: "#13ad13",
  gray: "#969696",
  magenta: "#d90072",
  yellow: "#ffd071",
});

export const TYPOGRAPHIE = {
  // Fredoka domine largement les outils (17 pages) : c'est la voix
  // visuelle maths&go pour les titres et les nombres manipulés.
  titres: '"Fredoka", "Segoe UI", system-ui, sans-serif',
  texte: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  manuscrite: '"Caveat", cursive', // annotations « à la main » (2 pages)
  mathematiques: "Georgia, 'Times New Roman', serif", // rendu LaTeX à part
};

// Grille d'espacement : base 4 px, multiples réguliers UNIQUEMENT.
// C'est la règle qui supprime les « espaces moches » : tout objet
// n'utilise que ces crans, jamais une valeur libre.
export const ESPACEMENTS = {
  base: 4,
  crans: [4, 8, 12, 16, 24, 32, 48, 64],
};

export const RAYONS = {
  petit: 8,
  moyen: 12,
  grand: 20,
  rond: 9999, // jetons, pastilles
};

/**
 * Luminance relative d'une couleur hexadécimale (WCAG).
 * @param {string} hex
 */
export function luminance(hex) {
  const canal = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * canal((n >> 16) & 255) +
    0.7152 * canal((n >> 8) & 255) +
    0.0722 * canal(n & 255)
  );
}

/**
 * Rapport de contraste WCAG entre deux couleurs hexadécimales.
 * ≥ 4,5 requis pour du texte courant lisible.
 * @param {string} a @param {string} b
 */
export function contraste(a, b) {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}
