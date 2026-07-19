// Petits calculs testables de l'interface ÉquaSplat.

export const SEUIL_GLISSEMENT_PX = 7;

/**
 * Distingue un appui d'un glissement en coordonnées d'écran.
 * Le seuil reste donc identique quelle que soit l'échelle du SVG.
 */
export function depasseSeuilGlissement(departX, departY, arriveeX, arriveeY) {
  return Math.hypot(arriveeX - departX, arriveeY - departY) > SEUIL_GLISSEMENT_PX;
}
