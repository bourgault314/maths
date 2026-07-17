// Hasard reproductible du moteur d'exercices maths&go.
//
// Règle d'or : même graine + même VERSION_ALEATOIRE = exactement la même
// suite de tirages, sur tout navigateur et tout système. C'est ce qui permet
// de rejouer une série d'exercices à l'identique (code de série partagé en
// classe, correction conforme à l'énoncé, bug reproductible).
//
// Toute modification qui change les suites produites DOIT incrémenter
// VERSION_ALEATOIRE : les contenus enregistrés référencent cette version.
//
// Algorithmes : xmur3 (hachage de la graine texte) + mulberry32 (générateur),
// choisis pour être exacts en arithmétique 32 bits, donc identiques partout.

export const VERSION_ALEATOIRE = 1;

/**
 * Transforme une graine texte quelconque ("serie-6A-2026", code élève…)
 * en graine numérique 32 bits.
 * @param {string} texte
 * @returns {number} entier non signé sur 32 bits
 */
export function graineDepuisTexte(texte) {
  let h = 1779033703 ^ texte.length;
  for (let i = 0; i < texte.length; i++) {
    h = Math.imul(h ^ texte.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * Crée un générateur de hasard reproductible.
 * @param {number | string} graine — nombre 32 bits ou texte (haché en interne)
 * @returns {{
 *   reel: () => number,
 *   entier: (min: number, max: number) => number,
 *   choix: <T>(liste: readonly T[]) => T,
 *   melange: <T>(liste: readonly T[]) => T[],
 *   graine: number,
 * }}
 */
export function creerGenerateur(graine) {
  const graineNormalisee =
    typeof graine === "string" ? graineDepuisTexte(graine) : graine >>> 0;
  let etat = graineNormalisee;

  /** Tirage de base : réel dans [0 ; 1), incluant 0, excluant 1. */
  function reel() {
    etat = (etat + 1831565813) >>> 0;
    let t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Entier entre min et max, bornes incluses.
   * @param {number} min @param {number} max
   */
  function entier(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`entier(${min}, ${max}) : bornes invalides`);
    }
    return min + Math.floor(reel() * (max - min + 1));
  }

  /**
   * Un élément de la liste, au hasard.
   * @template T @param {readonly T[]} liste @returns {T}
   */
  function choix(liste) {
    if (!Array.isArray(liste) || liste.length === 0) {
      throw new RangeError("choix() : liste vide ou invalide");
    }
    return liste[entier(0, liste.length - 1)];
  }

  /**
   * Copie mélangée de la liste (Fisher-Yates) ; la liste d'origine est intacte.
   * @template T @param {readonly T[]} liste @returns {T[]}
   */
  function melange(liste) {
    const copie = [...liste];
    for (let i = copie.length - 1; i > 0; i--) {
      const j = entier(0, i);
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }

  return { reel, entier, choix, melange, graine: graineNormalisee };
}
