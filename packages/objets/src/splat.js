// Objet officiel « tache Splat » — version 1, STATUT BROUILLON.
//
// LA tache maths&go, portée VERBATIM depuis les outils existants
// (outils/splat.html l.2010, outils/equabarre.html l.3390 — mêmes
// constantes) : 40 points sur un cercle, 5 lobes sinusoïdaux
// k = 0,90 + 0,16·sin(5a) + 0,04·sin(10a), lissage Catmull-Rom →
// Bézier cubique (tension 1/6). La silhouette est déterministe et
// identique à celle de tous vos outils, au chiffre près.
//
// Le concept pédagogique du Splat vient de Steve Wyborney
// (stevewyborney.com) ; cette implémentation et ses usages (plateaux,
// équations, relations) sont ceux de maths&go.

export const VERSION_SPLAT = 1;

// Couleurs relevées dans outils/splat.html (modes C/D et palette étendue)
export const COULEURS_SPLAT = {
  noir: "#141414",       // rgb(20,20,20), tache « classique »
  encre: "#050505",      // variante ÉquaBarre
  violet: "#9d4edd",
  orange: "#f97316",
  bleu: "#2563eb",
  vert: "#16a34a",
  rouge: "#dc2626",
};

/**
 * Le chemin SVG de la tache — port exact de blobPath(cx, cy, r).
 * Déterministe : mêmes arguments, même chemin, même silhouette que
 * dans tous les outils historiques.
 * @param {number} cx @param {number} cy @param {number} r
 * @returns {string} attribut « d » d'un <path>
 */
export function cheminTache(cx, cy, r) {
  const n = 40;
  const lobes = 5;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const k = 0.9 + 0.16 * Math.sin(lobes * a) + 0.04 * Math.sin(2 * lobes * a);
    const rr = r * k;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const cr2bz = (p0, p1, p2, p3) => {
    const t = 1 / 6;
    return [
      p1[0] + (p2[0] - p0[0]) * t,
      p1[1] + (p2[1] - p0[1]) * t,
      p2[0] - (p3[0] - p1[0]) * t,
      p2[1] - (p3[1] - p1[1]) * t,
      p2[0],
      p2[1],
    ];
  };
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const [c1x, c1y, c2x, c2y, x, y] = cr2bz(p0, p1, p2, p3);
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`;
  }
  return d + " Z";
}

/**
 * Dessine une tache Splat autonome.
 * @param {object} [options]
 * @param {number} [options.taille] — côté du rendu en pixels
 * @param {keyof typeof COULEURS_SPLAT} [options.couleur]
 * @param {boolean} [options.revelee] — tache translucide (contenu visible)
 * @returns {string} balise <svg> autonome
 */
export function dessinerTache({ taille = 120, couleur = "noir", revelee = false } = {}) {
  if (!(couleur in COULEURS_SPLAT)) {
    throw new RangeError(`dessinerTache : couleur inconnue « ${couleur} »`);
  }
  const d = cheminTache(60, 60, 44);
  const remplissage = COULEURS_SPLAT[couleur];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${taille}" height="${taille}" role="img" aria-label="tache Splat${revelee ? " révélée" : ""}">` +
    `<path d="${d}" fill="${remplissage}" fill-opacity="${revelee ? 0.22 : 1}" stroke="#000000" stroke-opacity="0.18" stroke-width="2"/>` +
    `</svg>`
  );
}
