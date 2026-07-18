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

export const VERSION_FLECHE = 1;

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
  const chemins =
    cote === "gauche"
      ? `<path d="M9 4 C9 21 24 20 29 32" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M23 31 L31 39 L34 28 Z" fill="currentColor"/>`
      : `<path d="M35 4 C35 21 20 20 15 32" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>` +
        `<path d="M21 31 L13 39 L10 28 Z" fill="currentColor"/>`;
  if (fragment) return chemins;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="${taille * 1.25}" height="${taille}" aria-hidden="true" style="overflow:visible">` +
    chemins +
    `</svg>`
  );
}
