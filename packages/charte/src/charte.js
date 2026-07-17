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

  // Jetons de nombres relatifs (convention écran observée dans les
  // plateaux ; à confirmer par Gwenaël)
  jetonPositif: "#16a34a",
  jetonPositifClair: "#4ade80",
  jetonPositifBord: "#14532d",
  jetonNegatif: "#dc2626",
  jetonNegatifClair: "#f87171",
  jetonNegatifBord: "#7f1d1d",
  jetonNeutralise: "#9ca3af",
  jetonNeutraliseBord: "#6b7280",
};

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
