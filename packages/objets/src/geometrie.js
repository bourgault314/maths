// Noyau géométrique maths&go — version 1, STATUT BROUILLON.
//
// Le calcul pur, sans une ligne de SVG : points, vecteurs, angles,
// secteurs angulaires, constructeurs de figures et axes de symétrie.
// C'est la « fabrique géométrique » : une figure n'est jamais dessinée
// à l'œil, elle est CALCULÉE, et chaque propriété est testée.
//
// Règle capitale (héritée du bug d'arc du triangle v1) : le secteur
// d'un angle est déterminé par les mathématiques (atan2, normalisation,
// point intérieur), jamais par une heuristique de distance. L'arc d'un
// angle intérieur reste dans la figure sous N'IMPORTE QUELLE rotation.
//
// Convention de repère : coordonnées mathématiques, y vers le HAUT.
// (Le dessinateur de figures inverse y au moment du rendu, comme le
// fait déjà l'objet triangle.)

export const VERSION_GEOMETRIE = 1;

export const RAD = Math.PI / 180;
const TAU = 2 * Math.PI;

// ---------------------------------------------------------------------------
// Vecteurs et mesures élémentaires
// ---------------------------------------------------------------------------

/** Ramène un angle en radians dans [0, 2π[. */
export function normaliserAngle(a) {
  const r = a % TAU;
  return r < 0 ? r + TAU : r;
}

/** Distance entre deux points [x, y]. */
export function distance(p, q) {
  return Math.hypot(q[0] - p[0], q[1] - p[1]);
}

/** Milieu de deux points. */
export function milieu(p, q) {
  return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
}

/** Argument (angle polaire) du vecteur allant de `p` vers `q`. */
export function argument(p, q) {
  return Math.atan2(q[1] - p[1], q[0] - p[0]);
}

/**
 * Aire signée d'un polygone (formule du lacet). Positive quand les
 * sommets tournent dans le sens direct (anti-horaire en repère
 * mathématique).
 */
export function aireSignee(sommets) {
  let somme = 0;
  for (let i = 0; i < sommets.length; i++) {
    const [x1, y1] = sommets[i];
    const [x2, y2] = sommets[(i + 1) % sommets.length];
    somme += x1 * y2 - x2 * y1;
  }
  return somme / 2;
}

/** Aire (toujours positive) d'un polygone simple. */
export function aire(sommets) {
  return Math.abs(aireSignee(sommets));
}

/** Périmètre d'un polygone. */
export function perimetre(sommets) {
  return sommets.reduce(
    (s, p, i) => s + distance(p, sommets[(i + 1) % sommets.length]),
    0,
  );
}

/** Isobarycentre des sommets. */
export function centroide(sommets) {
  return [
    sommets.reduce((s, p) => s + p[0], 0) / sommets.length,
    sommets.reduce((s, p) => s + p[1], 0) / sommets.length,
  ];
}

/**
 * Le point `p` est-il à l'intérieur du polygone ? (lancer de rayon)
 * Les points exactement sur le bord ne sont pas garantis.
 */
export function estDansPolygone(p, sommets) {
  let interieur = false;
  const [x, y] = p;
  for (let i = 0, j = sommets.length - 1; i < sommets.length; j = i++) {
    const [xi, yi] = sommets[i];
    const [xj, yj] = sommets[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      interieur = !interieur;
    }
  }
  return interieur;
}

/** Distance du point `p` au segment [a, b]. */
export function distancePointSegment(p, a, b) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const long2 = dx * dx + dy * dy;
  if (long2 === 0) return distance(p, a);
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / long2),
  );
  return distance(p, [a[0] + t * dx, a[1] + t * dy]);
}

/**
 * Intersection de deux segments [p1, p2] et [q1, q2].
 * @returns {[number, number] | null} le point, ou null si pas d'intersection
 */
export function intersectionSegments(p1, p2, q1, q2) {
  const d1 = [p2[0] - p1[0], p2[1] - p1[1]];
  const d2 = [q2[0] - q1[0], q2[1] - q1[1]];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-12) return null; // parallèles ou confondus
  const t = ((q1[0] - p1[0]) * d2[1] - (q1[1] - p1[1]) * d2[0]) / den;
  const u = ((q1[0] - p1[0]) * d1[1] - (q1[1] - p1[1]) * d1[0]) / den;
  if (t < -1e-12 || t > 1 + 1e-12 || u < -1e-12 || u > 1 + 1e-12) return null;
  return [p1[0] + t * d1[0], p1[1] + t * d1[1]];
}

/**
 * Intersection de deux DROITES (infinies) portées par [p1, p2] et [q1, q2].
 * @returns {[number, number] | null} null si les droites sont parallèles
 */
export function intersectionDroites(p1, p2, q1, q2) {
  const d1 = [p2[0] - p1[0], p2[1] - p1[1]];
  const d2 = [q2[0] - q1[0], q2[1] - q1[1]];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(den) < 1e-12) return null;
  const t = ((q1[0] - p1[0]) * d2[1] - (q1[1] - p1[1]) * d2[0]) / den;
  return [p1[0] + t * d1[0], p1[1] + t * d1[1]];
}

/**
 * Pied de la perpendiculaire abaissée de `p` sur la DROITE (AB) —
 * la projection orthogonale, même en dehors du segment [AB].
 */
export function piedPerpendiculaire(p, a, b) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const long2 = dx * dx + dy * dy;
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / long2;
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Deux segments (donnés par leurs extrémités) sont-ils parallèles ? */
export function sontParalleles(p1, p2, q1, q2, tolerance = 1e-9) {
  const c =
    (p2[0] - p1[0]) * (q2[1] - q1[1]) - (p2[1] - p1[1]) * (q2[0] - q1[0]);
  return Math.abs(c) <= tolerance * distance(p1, p2) * distance(q1, q2);
}

/** Deux segments sont-ils perpendiculaires ? */
export function sontPerpendiculaires(p1, p2, q1, q2, tolerance = 1e-9) {
  const s =
    (p2[0] - p1[0]) * (q2[0] - q1[0]) + (p2[1] - p1[1]) * (q2[1] - q1[1]);
  return Math.abs(s) <= tolerance * distance(p1, p2) * distance(q1, q2);
}

// ---------------------------------------------------------------------------
// Secteurs angulaires — LE point délicat, résolu une fois pour toutes
// ---------------------------------------------------------------------------

/**
 * Secteur angulaire au sommet `sommet`, délimité par les directions
 * vers `versA` et `versB`.
 *
 * Sans `pointInterieur` : le secteur le plus petit (angle non rentrant),
 * comme le fait AngleBarre. Avec `pointInterieur` : LE secteur qui
 * contient la direction de ce point — c'est ainsi qu'un angle intérieur
 * de polygone (même rentrant, > 180°) est toujours du bon côté.
 *
 * @returns {{ depart: number, delta: number }} l'arc est balayé de
 *   `depart` à `depart + delta` (radians, delta > 0, sens direct).
 */
export function secteurAngulaire(sommet, versA, versB, pointInterieur = null) {
  const a1 = argument(sommet, versA);
  const a2 = argument(sommet, versB);
  const delta12 = normaliserAngle(a2 - a1);
  if (pointInterieur === null) {
    return delta12 <= Math.PI
      ? { depart: a1, delta: delta12 }
      : { depart: a2, delta: TAU - delta12 };
  }
  const ai = normaliserAngle(argument(sommet, pointInterieur) - a1);
  return ai <= delta12
    ? { depart: a1, delta: delta12 }
    : { depart: a2, delta: TAU - delta12 };
}

/**
 * Angle intérieur du polygone au sommet d'indice `i` : son secteur
 * (pour dessiner l'arc du bon côté) et sa mesure en degrés.
 *
 * Méthode du cahier des charges : deux secteurs candidats, un point
 * test posé sur la bissectrice de chacun tout près du sommet, et le
 * test « est dans le polygone » tranche. Fonctionne pour les polygones
 * convexes ET concaves (angle rentrant), dans les deux orientations.
 */
export function angleInterieurPolygone(sommets, i) {
  const n = sommets.length;
  const v = sommets[i];
  const precedent = sommets[(i - 1 + n) % n];
  const suivant = sommets[(i + 1) % n];
  const a1 = argument(v, suivant);
  const a2 = argument(v, precedent);
  const delta12 = normaliserAngle(a2 - a1);
  const candidats = [
    { depart: a1, delta: delta12 },
    { depart: a2, delta: TAU - delta12 },
  ];
  const epsilon = Math.min(distance(v, precedent), distance(v, suivant)) / 1000;
  for (const secteur of candidats) {
    const bissectrice = secteur.depart + secteur.delta / 2;
    const test = [
      v[0] + Math.cos(bissectrice) * epsilon,
      v[1] + Math.sin(bissectrice) * epsilon,
    ];
    if (estDansPolygone(test, sommets)) {
      return { ...secteur, mesureDeg: secteur.delta / RAD };
    }
  }
  // Polygone dégénéré (plat) : on rend le petit secteur, sans se tromper de mesure.
  const petit = delta12 <= Math.PI ? candidats[0] : candidats[1];
  return { ...petit, mesureDeg: petit.delta / RAD };
}

/**
 * Points d'une polyligne épousant l'arc de cercle (convention
 * AngleBarre : l'arc est une polyligne dense, jamais une commande SVG
 * ambiguë). `delta` > 0, balayage dans le sens direct depuis `depart`.
 */
export function pointsArc(centre, rayon, depart, delta, pas = null) {
  const etapes = Math.max(12, Math.ceil((pas ?? delta / RAD / 4)));
  const points = [];
  for (let k = 0; k <= etapes; k++) {
    const angle = depart + (delta * k) / etapes;
    points.push([
      centre[0] + Math.cos(angle) * rayon,
      centre[1] + Math.sin(angle) * rayon,
    ]);
  }
  return points;
}

// ---------------------------------------------------------------------------
// Transformations
// ---------------------------------------------------------------------------

/**
 * Applique aux points : miroirs, rotation (en degrés, autour de
 * `centre` — par défaut l'isobarycentre), échelle puis translation.
 * La figure n'est JAMAIS déformée : uniquement des isométries et une
 * homothétie uniforme.
 */
export function transformer(points, options = {}) {
  const {
    rotationDeg = 0,
    miroirX = false,
    miroirY = false,
    echelle = 1,
    translation = [0, 0],
    centre = null,
  } = options;
  if (!(echelle > 0)) {
    throw new RangeError("transformer : l'échelle doit être strictement positive");
  }
  const c = centre ?? centroide(points);
  const cos = Math.cos(rotationDeg * RAD);
  const sin = Math.sin(rotationDeg * RAD);
  return points.map(([x, y]) => {
    let dx = x - c[0];
    let dy = y - c[1];
    if (miroirX) dx = -dx;
    if (miroirY) dy = -dy;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return [
      c[0] + rx * echelle + translation[0],
      c[1] + ry * echelle + translation[1],
    ];
  });
}

// ---------------------------------------------------------------------------
// Axes et centre de symétrie — détectés par le calcul, jamais déclarés
// ---------------------------------------------------------------------------

function reflechir(point, a, b) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const long2 = dx * dx + dy * dy;
  const t = ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / long2;
  const projete = [a[0] + t * dx, a[1] + t * dy];
  return [2 * projete[0] - point[0], 2 * projete[1] - point[1]];
}

function memesSommets(reflechis, sommets, tolerance) {
  const restants = sommets.map((s) => s);
  for (const r of reflechis) {
    const k = restants.findIndex((s) => distance(s, r) <= tolerance);
    if (k === -1) return false;
    restants.splice(k, 1);
  }
  return true;
}

/**
 * Tous les axes de symétrie d'un polygone, détectés géométriquement :
 * les 2n candidats (sommet↔sommet ou milieu↔milieu opposés dans la
 * suite cyclique) sont testés par réflexion effective des sommets.
 *
 * @returns {Array<[[number,number],[number,number]]>} chaque axe est
 *   donné par deux points qui le portent.
 */
export function axesSymetrie(sommets) {
  const n = sommets.length;
  const suite = []; // sommets et milieux alternés : 2n points cycliques
  for (let i = 0; i < n; i++) {
    suite.push(sommets[i]);
    suite.push(milieu(sommets[i], sommets[(i + 1) % n]));
  }
  const diametreFigure = Math.max(
    ...sommets.map((p) => Math.max(...sommets.map((q) => distance(p, q)))),
  );
  const tolerance = diametreFigure * 1e-7;
  const axes = [];
  for (let i = 0; i < n; i++) {
    const a = suite[i];
    const b = suite[i + n];
    if (distance(a, b) <= tolerance) continue;
    const reflechis = sommets.map((s) => reflechir(s, a, b));
    if (memesSommets(reflechis, sommets, tolerance)) {
      axes.push([a, b]);
    }
  }
  return axes;
}

/**
 * Centre de symétrie du polygone (ou null) : l'isobarycentre est testé
 * par symétrie centrale effective de tous les sommets.
 */
export function centreSymetrie(sommets) {
  const c = centroide(sommets);
  const diametreFigure = Math.max(
    ...sommets.map((p) => Math.max(...sommets.map((q) => distance(p, q)))),
  );
  const symetriques = sommets.map((s) => [2 * c[0] - s[0], 2 * c[1] - s[1]]);
  return memesSommets(symetriques, sommets, diametreFigure * 1e-7) ? c : null;
}

// ---------------------------------------------------------------------------
// Constructeurs — les figures du collège, par leurs contraintes
// ---------------------------------------------------------------------------

function exigerPositif(valeur, nom, figure) {
  if (!(valeur > 0) || !Number.isFinite(valeur)) {
    throw new RangeError(`${figure} : ${nom} doit être un nombre strictement positif`);
  }
}

/** Carré de côté donné. Sommets A, B, C, D dans le sens direct, A en bas à gauche. */
export function sommetsCarre({ cote = 4 } = {}) {
  exigerPositif(cote, "le côté", "carré");
  return [[0, 0], [cote, 0], [cote, cote], [0, cote]];
}

/** Rectangle largeur × hauteur. */
export function sommetsRectangle({ largeur = 6, hauteur = 4 } = {}) {
  exigerPositif(largeur, "la largeur", "rectangle");
  exigerPositif(hauteur, "la hauteur", "rectangle");
  return [[0, 0], [largeur, 0], [largeur, hauteur], [0, hauteur]];
}

/**
 * Parallélogramme par sa base, son côté oblique et l'angle en A
 * (en degrés, strictement entre 0 et 180).
 */
export function sommetsParallelogramme({ base = 6, cote = 3.5, angleDeg = 65 } = {}) {
  exigerPositif(base, "la base", "parallélogramme");
  exigerPositif(cote, "le côté", "parallélogramme");
  if (!(angleDeg > 0 && angleDeg < 180)) {
    throw new RangeError("parallélogramme : l'angle doit être entre 0° et 180° exclus");
  }
  const d = [cote * Math.cos(angleDeg * RAD), cote * Math.sin(angleDeg * RAD)];
  return [[0, 0], [base, 0], [base + d[0], d[1]], [d[0], d[1]]];
}

/**
 * Losange : soit par côté et angle en A, soit par ses deux diagonales
 * (`diagonales: [d1, d2]`, portées par les axes, croisement au centre).
 */
export function sommetsLosange({ cote = 4, angleDeg = 65, diagonales = null } = {}) {
  if (diagonales) {
    const [d1, d2] = diagonales;
    exigerPositif(d1, "la première diagonale", "losange");
    exigerPositif(d2, "la seconde diagonale", "losange");
    return [[-d1 / 2, 0], [0, -d2 / 2], [d1 / 2, 0], [0, d2 / 2]];
  }
  return sommetsParallelogramme({ base: cote, cote, angleDeg });
}

/**
 * Trapèze de bases parallèles horizontales. `decalage` est l'abscisse
 * du pied de la petite base (par défaut : centré → trapèze isocèle).
 * Convention maths&go : « au moins une paire de côtés parallèles »
 * (les parallélogrammes sont des trapèzes).
 */
export function sommetsTrapeze({
  grandeBase = 7,
  petiteBase = 4,
  hauteur = 3,
  decalage = null,
} = {}) {
  exigerPositif(grandeBase, "la grande base", "trapèze");
  exigerPositif(petiteBase, "la petite base", "trapèze");
  exigerPositif(hauteur, "la hauteur", "trapèze");
  const d = decalage ?? (grandeBase - petiteBase) / 2;
  return [[0, 0], [grandeBase, 0], [d + petiteBase, hauteur], [d, hauteur]];
}

/** Trapèze rectangle (angles droits en A et D). */
export function sommetsTrapezeRectangle(options = {}) {
  return sommetsTrapeze({ ...options, decalage: 0 });
}

/** Trapèze isocèle (petite base centrée). */
export function sommetsTrapezeIsocele(options = {}) {
  return sommetsTrapeze({ ...options, decalage: null });
}

/**
 * Cerf-volant : diagonale principale verticale (axe de symétrie),
 * diagonale secondaire perpendiculaire la croisant à `position`
 * (fraction de la principale depuis le bas, dans ]0, 1[).
 */
export function sommetsCerfVolant({
  diagonalePrincipale = 6,
  diagonaleSecondaire = 4,
  position = 0.35,
} = {}) {
  exigerPositif(diagonalePrincipale, "la diagonale principale", "cerf-volant");
  exigerPositif(diagonaleSecondaire, "la diagonale secondaire", "cerf-volant");
  if (!(position > 0 && position < 1)) {
    throw new RangeError("cerf-volant : la position du croisement doit être entre 0 et 1 exclus");
  }
  const y = diagonalePrincipale * position;
  return [
    [0, 0],
    [diagonaleSecondaire / 2, y],
    [0, diagonalePrincipale],
    [-diagonaleSecondaire / 2, y],
  ];
}

/**
 * Quadrilatère quelconque par ses quatre sommets. Refuse les figures
 * croisées (côtés opposés qui se coupent) : le cahier des charges les
 * réserve comme distracteurs explicites, jamais par accident.
 */
export function sommetsQuadrilatere({ points } = {}) {
  if (!points || points.length !== 4) {
    throw new RangeError("quadrilatère : quatre sommets attendus");
  }
  const croise01 = intersectionSegments(points[0], points[1], points[2], points[3]);
  const croise12 = intersectionSegments(points[1], points[2], points[3], points[0]);
  if (croise01 || croise12) {
    throw new RangeError(
      "quadrilatère : figure croisée (deux côtés opposés se coupent) — donner les sommets dans l'ordre du tour",
    );
  }
  return points.map((p) => [p[0], p[1]]);
}

/**
 * Polygone quelconque par sa liste de sommets, dans l'ordre du tour.
 * Refuse les polygones croisés (deux côtés non voisins qui se coupent)
 * et les polygones dégénérés (aire quasi nulle) : une figure presque
 * plate est illisible et cache presque toujours une erreur de données.
 */
export function sommetsPolygone({ points } = {}) {
  if (!Array.isArray(points) || points.length < 3) {
    throw new RangeError("polygone : au moins trois sommets attendus");
  }
  const n = points.length;
  // le croisement d'abord : un « nœud papillon » a une aire signée
  // quasi nulle, il recevrait sinon le mauvais message
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue; // côtés voisins
      if (
        intersectionSegments(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])
      ) {
        throw new RangeError(
          "polygone : figure croisée (deux côtés non voisins se coupent) — donner les sommets dans l'ordre du tour",
        );
      }
    }
  }
  const diametreFigure = Math.max(
    ...points.map((p) => Math.max(...points.map((q) => distance(p, q)))),
  );
  if (!(diametreFigure > 0) || aire(points) < diametreFigure * diametreFigure * 1e-6) {
    throw new RangeError("polygone : figure dégénérée (aire quasi nulle)");
  }
  return points.map((p) => [p[0], p[1]]);
}

/**
 * Polygone régulier à n côtés, « posé » sur un côté horizontal en bas.
 * @param {object} options
 * @param {number} options.nbCotes
 * @param {number} [options.cote] — longueur du côté (prioritaire)
 * @param {number} [options.rayon] — rayon du cercle circonscrit
 */
export function sommetsPolygoneRegulier({ nbCotes, cote = null, rayon = null } = {}) {
  if (!Number.isInteger(nbCotes) || nbCotes < 3) {
    throw new RangeError("polygone régulier : au moins 3 côtés entiers attendus");
  }
  let r = rayon;
  if (cote !== null) {
    exigerPositif(cote, "le côté", "polygone régulier");
    r = cote / (2 * Math.sin(Math.PI / nbCotes));
  } else {
    r = r ?? 3;
    exigerPositif(r, "le rayon", "polygone régulier");
  }
  const sommets = [];
  for (let k = 0; k < nbCotes; k++) {
    const angle = -Math.PI / 2 + Math.PI / nbCotes + (k * TAU) / nbCotes;
    sommets.push([r * Math.cos(angle), r * Math.sin(angle)]);
  }
  return sommets;
}

/**
 * Triangle par ses contraintes — le même moteur exact que l'objet
 * triangle v1 (loi des sinus / loi des cosinus), enrichi des familles
 * et de tous les constructeurs du collège.
 *
 * @param {object} donnees
 * @param {[number,number,number]} [donnees.angles] — somme 180
 * @param {[number,number,number]} [donnees.cotes] — inégalité triangulaire
 * @param {Array<[number,number]>} [donnees.points] — trois points non alignés
 * @param {object} [donnees.deuxCotesEtAngle] — { cotes: [c1, c2], angleDeg } :
 *   l'angle compris, au premier sommet
 * @param {object} [donnees.unCoteEtDeuxAngles] — { cote, anglesDeg: [α, β] } :
 *   le côté AB et les angles en A et en B
 * @param {object} [donnees.hypotenuseEtCathete] — { hypotenuse, cathete } :
 *   triangle rectangle au premier sommet
 * @param {string} [donnees.famille] — « equilateral », « isocele »,
 *   « rectangle », « rectangle-isocele »
 * @param {number} [donnees.sommet] — pour rectangle/isocèle : indice
 *   (0, 1 ou 2) du sommet particulier (angle droit ou sommet principal)
 * @param {number} [donnees.cote] — équilatéral / rectangle isocèle
 * @param {[number,number]} [donnees.cathetes] — triangle rectangle
 * @param {number} [donnees.base] et [donnees.sommetDeg] — isocèle
 */
export function sommetsTriangle(donnees = {}) {
  const { famille, sommet = null } = donnees;
  // Fait tourner l'ordre des sommets pour que le sommet particulier
  // (canoniquement à l'indice `canonique`) porte la lettre demandée.
  const placerSommet = (liste, canonique) => {
    if (sommet === null) return liste;
    if (![0, 1, 2].includes(sommet)) {
      throw new RangeError("triangle : `sommet` doit valoir 0, 1 ou 2");
    }
    const decalage = (sommet - canonique + 3) % 3;
    return liste.map((_, k) => liste[(k - decalage + 3) % 3]);
  };
  if (famille === "equilateral") {
    const c = donnees.cote ?? 4;
    exigerPositif(c, "le côté", "triangle équilatéral");
    return sommetsTriangle({ cotes: [c, c, c] });
  }
  if (famille === "rectangle") {
    const [a, b] = donnees.cathetes ?? [4, 3];
    exigerPositif(a, "la première cathète", "triangle rectangle");
    exigerPositif(b, "la seconde cathète", "triangle rectangle");
    // angle droit canoniquement au premier sommet, cathètes sur les axes
    return placerSommet([[0, 0], [a, 0], [0, b]], 0);
  }
  if (famille === "rectangle-isocele") {
    const c = donnees.cote ?? 4;
    exigerPositif(c, "la cathète", "triangle rectangle isocèle");
    return placerSommet([[0, 0], [c, 0], [0, c]], 0);
  }
  if (famille === "isocele") {
    const sommetDeg = donnees.sommetDeg ?? 40;
    if (!(sommetDeg > 0 && sommetDeg < 180)) {
      throw new RangeError("triangle isocèle : l'angle au sommet doit être entre 0° et 180° exclus");
    }
    const base = donnees.base ?? 4;
    exigerPositif(base, "la base", "triangle isocèle");
    const angleBase = (180 - sommetDeg) / 2;
    const hauteur = (base / 2) * Math.tan(angleBase * RAD);
    // base AB horizontale, sommet principal canoniquement en C
    return placerSommet([[0, 0], [base, 0], [base / 2, hauteur]], 2);
  }
  if (donnees.points) {
    if (donnees.points.length !== 3) {
      throw new RangeError("triangle : trois points attendus");
    }
    const copie = donnees.points.map((p) => [p[0], p[1]]);
    const diametreFigure = Math.max(
      ...copie.map((p) => Math.max(...copie.map((q) => distance(p, q)))),
    );
    if (!(diametreFigure > 0) || aire(copie) < diametreFigure * diametreFigure * 1e-9) {
      throw new RangeError("triangle : les trois points sont alignés");
    }
    return copie;
  }
  if (donnees.deuxCotesEtAngle) {
    const { cotes: [c1, c2] = [], angleDeg } = donnees.deuxCotesEtAngle;
    exigerPositif(c1, "le premier côté", "triangle (deux côtés et l'angle compris)");
    exigerPositif(c2, "le second côté", "triangle (deux côtés et l'angle compris)");
    if (!(angleDeg > 0 && angleDeg < 180)) {
      throw new RangeError("triangle : l'angle compris doit être entre 0° et 180° exclus");
    }
    return [
      [0, 0],
      [c1, 0],
      [c2 * Math.cos(angleDeg * RAD), c2 * Math.sin(angleDeg * RAD)],
    ];
  }
  if (donnees.unCoteEtDeuxAngles) {
    const { cote, anglesDeg: [alpha, beta] = [] } = donnees.unCoteEtDeuxAngles;
    exigerPositif(cote, "le côté", "triangle (un côté et deux angles)");
    if (!(alpha > 0) || !(beta > 0) || alpha + beta >= 180) {
      throw new RangeError(
        "triangle : les deux angles doivent être positifs et de somme inférieure à 180°",
      );
    }
    // AB horizontal, angle α en A, angle β en B : C est l'intersection
    // des deux rayons — la construction du compas et du rapporteur
    const a = [0, 0];
    const b = [cote, 0];
    const c = intersectionDroites(
      a,
      [Math.cos(alpha * RAD), Math.sin(alpha * RAD)],
      b,
      [cote + Math.cos((180 - beta) * RAD), Math.sin((180 - beta) * RAD)],
    );
    return [a, b, c];
  }
  if (donnees.hypotenuseEtCathete) {
    const { hypotenuse, cathete } = donnees.hypotenuseEtCathete;
    exigerPositif(hypotenuse, "l'hypoténuse", "triangle rectangle");
    exigerPositif(cathete, "la cathète", "triangle rectangle");
    if (cathete >= hypotenuse) {
      throw new RangeError(
        "triangle rectangle : l'hypoténuse doit être plus longue que la cathète",
      );
    }
    const autre = Math.sqrt(hypotenuse * hypotenuse - cathete * cathete);
    return [[0, 0], [cathete, 0], [0, autre]];
  }
  const { angles, cotes } = donnees;
  let a, b, c; // longueurs des côtés opposés aux sommets 1, 2, 3
  if (angles) {
    if (angles.length !== 3 || angles.some((x) => !(x > 0))) {
      throw new RangeError("triangle : trois angles strictement positifs attendus");
    }
    const somme = angles[0] + angles[1] + angles[2];
    if (Math.abs(somme - 180) > 1e-9) {
      throw new RangeError(`triangle : la somme des angles doit faire 180° (ici ${somme}°)`);
    }
    a = Math.sin(angles[0] * RAD);
    b = Math.sin(angles[1] * RAD);
    c = Math.sin(angles[2] * RAD);
  } else if (cotes) {
    if (cotes.length !== 3 || cotes.some((x) => !(x > 0))) {
      throw new RangeError("triangle : trois côtés strictement positifs attendus");
    }
    [a, b, c] = cotes;
    if (a + b <= c || a + c <= b || b + c <= a) {
      throw new RangeError("triangle : inégalité triangulaire non respectée (ce triangle n'existe pas)");
    }
  } else {
    throw new RangeError(
      "triangle : donner trois angles, trois côtés, trois points, deux côtés et l'angle compris, un côté et deux angles, hypoténuse et cathète, ou une famille",
    );
  }
  const cosAngle2 = (a * a + c * c - b * b) / (2 * a * c);
  const angle2 = Math.acos(Math.min(1, Math.max(-1, cosAngle2)));
  // sommet 1 en haut, sommet 2 à l'origine, sommet 3 sur l'axe des x
  return [
    [c * Math.cos(angle2), c * Math.sin(angle2)],
    [0, 0],
    [a, 0],
  ];
}

// ---------------------------------------------------------------------------
// Droites et points remarquables du triangle — tout est CALCULÉ
// ---------------------------------------------------------------------------

/**
 * Les points remarquables d'un triangle et leurs supports :
 * centre de gravité (médianes), orthocentre (hauteurs), centre du
 * cercle circonscrit (médiatrices), centre du cercle inscrit
 * (bissectrices), pieds et milieux correspondants.
 *
 * Conventions d'indices : l'élément d'indice i est celui issu du
 * sommet i (pied de SA hauteur, milieu du côté OPPOSÉ, pied de SA
 * bissectrice).
 *
 * @param {Array<[number,number]>} sommets — trois points non alignés
 */
export function pointsRemarquablesTriangle(sommets) {
  if (!Array.isArray(sommets) || sommets.length !== 3) {
    throw new RangeError("points remarquables : un triangle (trois sommets) est attendu");
  }
  const [A, B, C] = sommets;
  const surface = aire(sommets);
  const diametreFigure = Math.max(distance(A, B), distance(B, C), distance(A, C));
  if (!(diametreFigure > 0) || surface < diametreFigure * diametreFigure * 1e-9) {
    throw new RangeError("points remarquables : les trois sommets sont alignés");
  }
  const a = distance(B, C); // côté opposé à A
  const b = distance(A, C);
  const c = distance(A, B);

  // médiatrices : perpendiculaires aux côtés en leurs milieux
  const perpendiculaireEn = (m, p, q) => [m[0] - (q[1] - p[1]), m[1] + (q[0] - p[0])];
  const mAB = milieu(A, B);
  const mBC = milieu(B, C);
  const centreCirconscrit = intersectionDroites(
    mAB,
    perpendiculaireEn(mAB, A, B),
    mBC,
    perpendiculaireEn(mBC, B, C),
  );
  // relation d'Euler (vectorielle) : H = A + B + C − 2·O
  const orthocentre = [
    A[0] + B[0] + C[0] - 2 * centreCirconscrit[0],
    A[1] + B[1] + C[1] - 2 * centreCirconscrit[1],
  ];
  // centre du cercle inscrit : barycentre pondéré par les côtés opposés
  const centreInscrit = [
    (a * A[0] + b * B[0] + c * C[0]) / (a + b + c),
    (a * A[1] + b * B[1] + c * C[1]) / (a + b + c),
  ];
  // pied de la bissectrice issue de A : partage BC dans le rapport c/b
  const piedBissectrice = (i) => {
    const [v, p, q] = [sommets[i], sommets[(i + 1) % 3], sommets[(i + 2) % 3]];
    const versP = distance(v, p); // longueur du côté adjacent vers p
    const versQ = distance(v, q);
    const t = versP / (versP + versQ);
    return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
  };

  return {
    centreGravite: centroide(sommets),
    orthocentre,
    centreCirconscrit,
    rayonCirconscrit: distance(centreCirconscrit, A),
    centreInscrit,
    rayonInscrit: surface / ((a + b + c) / 2),
    piedsHauteurs: sommets.map((v, i) =>
      piedPerpendiculaire(v, sommets[(i + 1) % 3], sommets[(i + 2) % 3]),
    ),
    milieux: sommets.map((_, i) => milieu(sommets[(i + 1) % 3], sommets[(i + 2) % 3])),
    piedsBissectrices: sommets.map((_, i) => piedBissectrice(i)),
  };
}
