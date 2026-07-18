// Objet officiel « flèche d'opération » — version 1.
//
// LA flèche courbe d'ÉquaBarre, reprise VERBATIM de l'outil
// (outils/equabarre.html, fonction operationArrowSvg) : une courbe qui
// plonge vers l'intérieur avec une pointe pleine. C'est la flèche que
// ni GPT ni ma première version n'arrivaient à faire correctement —
// désormais elle est fixée ici, une fois pour toutes.
//
// Elle hérite sa couleur du contexte (currentColor) : orange dans une
// rédaction, autre couleur ailleurs.

export const VERSION_FLECHE = 2;

/**
 * La flèche d'opération, en fragment SVG à incruster (groupe positionné
 * par l'appelant) ou en <svg> autonome.
 *
 * @param {object} [options]
 * @param {"gauche" | "droite"} [options.cote] — la flèche gauche plonge
 *   vers la droite (l'intérieur), la droite vers la gauche
 * @param {number} [options.taille] — hauteur en pixels (autonome)
 * @param {boolean} [options.fragment] — true : renvoie les <path> seuls
 *   (dans un repère 44×44), pour incrustation dans un autre SVG
 * @returns {string}
 */
export function dessinerFlecheOperation({ cote = "gauche", taille = 22, fragment = false } = {}) {
  if (cote !== "gauche" && cote !== "droite") {
    throw new RangeError(`dessinerFlecheOperation : côté inconnu « ${cote} »`);
  }
  // v2 : courbe en quart de cercle régulier, pointe alignée sur la
  // tangente — un arrondi plus doux que celui de l'outil historique
  // (demande explicite de Gwenaël : « fais de meilleurs arrondis »).
  const chemins =
    cote === "gauche"
      ? `<path d="M8 4 C8 19 13 28 24 33" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M17.5 33.5 L26 34 L21.5 26.5 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`
      : `<path d="M36 4 C36 19 31 28 20 33" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M26.5 33.5 L18 34 L22.5 26.5 Z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`;
  if (fragment) return chemins;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="${taille * 1.25}" height="${taille}" aria-hidden="true" style="overflow:visible">` +
    chemins +
    `</svg>`
  );
}
