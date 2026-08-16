// Solides maths&go — version 1, STATUT BROUILLON.
//
// Un solide n'est pas un dessin : c'est un MODÈLE (sommets 3D, faces
// orientées, rôles) ou une définition ANALYTIQUE (rayon, hauteur, axe
// pour les solides de révolution). Le rendu projette ce modèle vers le
// SVG et RECALCULE à chaque orientation quelles arêtes sont cachées :
// il n'existe nulle part une liste figée de pointillés (cahier des
// charges §13 — c'est testé sous des centaines d'orientations).
//
// Repère du modèle : x vers la droite, y vers la profondeur (loin de
// l'observateur), z vers le haut. Deux projections :
// — « cavaliere » : la face avant sans déformation, fuyantes à angle
//   et coefficient réglables (défauts du collège : 45°, 0,5) ;
// — « orthographique » : rotation libre (lacet/tangage) puis projection
//   orthogonale — c'est la vue manipulable et les vues de face/dessus/….
// Les deux sorties (fiche statique, vue tournée au doigt) partagent CE
// modèle unique (§13.3).

import { COULEURS_BARRES } from "../../charte/src/charte.js?v=35";
import { briquesSvg, echapper, formaterLongueur } from "./figure.js?v=35";

export const VERSION_SOLIDES = 1;

const { ligne, texte, px, enveloppeSvg } = briquesSvg;

const ENCRE = COULEURS_BARRES.encre; // #0f172a
const CONTOUR_COULEUR = "#1d4ed8"; // même bleu que les figures planes
const BASE_COULEUR = COULEURS_BARRES.hachureAjout; // vert #16a34a
const ATTENUE = COULEURS_BARRES.attenue;
const RAD = Math.PI / 180;
const EPSILON = 1e-9;
const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWX";

// ---------------------------------------------------------------------------
// Petite algèbre 3D
// ---------------------------------------------------------------------------

const ajouter = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const soustraire = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const multiplier = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
const produitScalaire = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const produitVectoriel = (p, q) => [
  p[1] * q[2] - p[2] * q[1],
  p[2] * q[0] - p[0] * q[2],
  p[0] * q[1] - p[1] * q[0],
];
const norme = (p) => Math.hypot(p[0], p[1], p[2]);
const normaliser = (p) => multiplier(p, 1 / (norme(p) || 1));

function nombrePositif(valeur, nom) {
  if (!Number.isFinite(valeur) || valeur <= 0) {
    throw new RangeError(`Solide : ${nom} doit être un nombre strictement positif`);
  }
  return valeur;
}

function entierCotes(n) {
  if (!Number.isInteger(n) || n < 3 || n > 12) {
    throw new RangeError("Solide : le nombre de côtés de la base doit être un entier entre 3 et 12");
  }
  return n;
}

// ---------------------------------------------------------------------------
// Constructeurs de polyèdres — sommets + faces ; les arêtes se DÉDUISENT
// des faces (jamais de liste d'arêtes indépendante à maintenir).
// Les faces sont réorientées automatiquement vers l'extérieur.
// ---------------------------------------------------------------------------

function polygoneRegulier(n, rayon, z) {
  // un côté face à l'observateur : sommets décalés d'un demi-secteur
  const sommets = [];
  for (let i = 0; i < n; i++) {
    const angle = (-90 + (i + 0.5) * (360 / n)) * RAD;
    sommets.push([Math.cos(angle) * rayon, Math.sin(angle) * rayon, z]);
  }
  return sommets;
}

function orienterFaces(sommets, faces) {
  // normale de Newell, retournée si elle pointe vers l'intérieur du solide
  const centre = sommets
    .reduce((acc, p) => ajouter(acc, p), [0, 0, 0])
    .map((c) => c / sommets.length);
  return faces.map((face) => {
    const points = face.sommets.map((i) => sommets[i]);
    let normale = [0, 0, 0];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const q = points[(i + 1) % points.length];
      normale = ajouter(normale, produitVectoriel(p, q));
    }
    const centreFace = points
      .reduce((acc, p) => ajouter(acc, p), [0, 0, 0])
      .map((c) => c / points.length);
    const versExterieur = produitScalaire(normale, soustraire(centreFace, centre)) >= 0;
    return versExterieur ? face : { ...face, sommets: [...face.sommets].reverse() };
  });
}

/** Les arêtes d'un polyèdre : paires de sommets + indices des 2 faces adjacentes. */
export function aretesDe(solide) {
  const parCle = new Map();
  solide.faces.forEach((face, indiceFace) => {
    const n = face.sommets.length;
    for (let i = 0; i < n; i++) {
      const a = face.sommets[i];
      const b = face.sommets[(i + 1) % n];
      const cle = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!parCle.has(cle)) parCle.set(cle, { sommets: [Math.min(a, b), Math.max(a, b)], faces: [] });
      parCle.get(cle).faces.push(indiceFace);
    }
  });
  return [...parCle.values()];
}

function polyedre(type, sommets, faces, roles = {}) {
  return {
    nature: "polyedre",
    type,
    sommets,
    faces: orienterFaces(sommets, faces),
    noms: sommets.map((_, i) => LETTRES[i] ?? `P${i}`),
    roles,
  };
}

/** Pavé droit centré sur l'origine — base ABCD dessous, EFGH dessus. */
export function creerPave({ longueur = 5, largeur = 3, hauteur = 2.5 } = {}) {
  const L = nombrePositif(longueur, "la longueur") / 2;
  const l = nombrePositif(largeur, "la largeur") / 2;
  const h = nombrePositif(hauteur, "la hauteur") / 2;
  const sommets = [
    [-L, -l, -h], [L, -l, -h], [L, l, -h], [-L, l, -h],
    [-L, -l, h], [L, -l, h], [L, l, h], [-L, l, h],
  ];
  const faces = [
    { sommets: [0, 1, 2, 3], role: "base" },
    { sommets: [4, 5, 6, 7], role: "base" },
    { sommets: [0, 1, 5, 4], role: "laterale" },
    { sommets: [1, 2, 6, 5], role: "laterale" },
    { sommets: [2, 3, 7, 6], role: "laterale" },
    { sommets: [3, 0, 4, 7], role: "laterale" },
  ];
  return polyedre("pave", sommets, faces, { dimensions: { longueur: L * 2, largeur: l * 2, hauteur: h * 2 } });
}

export function creerCube({ arete = 4 } = {}) {
  nombrePositif(arete, "l'arête");
  const cube = creerPave({ longueur: arete, largeur: arete, hauteur: arete });
  return { ...cube, type: "cube", roles: { dimensions: { arete } } };
}

// --- Bases de prisme -------------------------------------------------------
// Le programme dit « prisme droit » ; les bases triangulaire, trapézoïdale,
// parallélogramme… sont des variantes de CETTE famille (cahier §1.2). Chaque
// base est un polygone plan CONVEXE, décrit dans le plan xy puis recentré.
// La convexité n'est pas un caprice : c'est elle qui rend valide la règle
// « une arête est visible si l'une de ses faces l'est » (§6.2).

function centrerBase(points) {
  const n = points.length;
  const cx = points.reduce((s, p) => s + p[0], 0) / n;
  const cy = points.reduce((s, p) => s + p[1], 0) / n;
  return points.map(([x, y]) => [x - cx, y - cy]);
}

/** Refuse une base dégénérée ou non convexe, avec un message lisible. */
export function verifierBaseConvexe(points, nom = "la base") {
  if (!Array.isArray(points) || points.length < 3) {
    throw new RangeError(`Solide : ${nom} doit avoir au moins 3 sommets`);
  }
  const n = points.length;
  for (const p of points) {
    if (!Array.isArray(p) || p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
      throw new RangeError(`Solide : ${nom} doit être une liste de points [x, y] finis`);
    }
  }
  let signe = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const c = points[(i + 2) % n];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-9) {
      throw new RangeError(`Solide : ${nom} a deux sommets confondus`);
    }
    const croix = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(croix) < 1e-9) continue; // trois points alignés : toléré
    const s = Math.sign(croix);
    if (signe === 0) signe = s;
    else if (s !== signe) throw new RangeError(`Solide : ${nom} doit être convexe`);
  }
  if (signe === 0) throw new RangeError(`Solide : ${nom} est aplatie (sommets alignés)`);
  // sens direct, pour que les faces latérales suivent l'ordre des côtés
  return signe > 0 ? points : [...points].reverse();
}

/**
 * Les bases prêtes à l'emploi. Chacune rend une liste de points [x, y]
 * recentrée ; toutes les longueurs sont celles du modèle, jamais celles
 * du dessin (§6.6 piège 45).
 */
export const BASES_PRISME = {
  reguliere: ({ cotes = 5, cote = 3 } = {}) => {
    const n = entierCotes(cotes);
    nombrePositif(cote, "le côté de la base");
    const rayon = cote / (2 * Math.sin(Math.PI / n));
    return polygoneRegulier(n, rayon, 0).map(([x, y]) => [x, y]);
  },
  // « cote » désigne toujours le côté porté par l'horizontale (la base du
  // polygone) ; le mot « base » est réservé au CHOIX de la base du prisme.
  "triangle-quelconque": ({ cote = 5, hauteurTriangle = 3.4, decalage = 1.6 } = {}) => {
    nombrePositif(cote, "la base du triangle");
    nombrePositif(hauteurTriangle, "la hauteur du triangle");
    return centrerBase([[0, 0], [cote, 0], [decalage, hauteurTriangle]]);
  },
  "triangle-rectangle": ({ cote1 = 4, cote2 = 3 } = {}) => {
    nombrePositif(cote1, "le premier côté de l'angle droit");
    nombrePositif(cote2, "le second côté de l'angle droit");
    return centrerBase([[0, 0], [cote1, 0], [0, cote2]]);
  },
  "triangle-isocele": ({ cote = 4, hauteurTriangle = 3.5 } = {}) => {
    nombrePositif(cote, "la base du triangle");
    nombrePositif(hauteurTriangle, "la hauteur du triangle");
    return centrerBase([[0, 0], [cote, 0], [cote / 2, hauteurTriangle]]);
  },
  "triangle-equilateral": ({ cote = 4 } = {}) => {
    nombrePositif(cote, "le côté du triangle");
    return centrerBase([[0, 0], [cote, 0], [cote / 2, (cote * Math.sqrt(3)) / 2]]);
  },
  parallelogramme: ({ cote = 5, petitCote = 3, angleDeg = 62 } = {}) => {
    nombrePositif(cote, "la base du parallélogramme");
    nombrePositif(petitCote, "le côté du parallélogramme");
    if (!(angleDeg > 10 && angleDeg < 170)) {
      throw new RangeError("Solide : l'angle du parallélogramme doit rester lisible (10° à 170°)");
    }
    const dx = petitCote * Math.cos(angleDeg * RAD);
    const dy = petitCote * Math.sin(angleDeg * RAD);
    return centrerBase([[0, 0], [cote, 0], [cote + dx, dy], [dx, dy]]);
  },
  // « hauteurTrapeze » : la hauteur du POLYGONE de base, à ne pas confondre
  // avec la hauteur du prisme — le cahier demande de les distinguer (§5.2).
  trapeze: ({ grandeBase = 6, petiteBase = 3, hauteurTrapeze = 3, decalage = 1.6 } = {}) => {
    nombrePositif(grandeBase, "la grande base du trapèze");
    nombrePositif(petiteBase, "la petite base du trapèze");
    nombrePositif(hauteurTrapeze, "la hauteur du trapèze");
    return centrerBase([
      [0, 0],
      [grandeBase, 0],
      [decalage + petiteBase, hauteurTrapeze],
      [decalage, hauteurTrapeze],
    ]);
  },
  "trapeze-rectangle": ({ grandeBase = 6, petiteBase = 3.5, hauteurTrapeze = 3 } = {}) =>
    BASES_PRISME.trapeze({ grandeBase, petiteBase, hauteurTrapeze, decalage: 0 }),
  "trapeze-isocele": ({ grandeBase = 6, petiteBase = 3, hauteurTrapeze = 3 } = {}) =>
    BASES_PRISME.trapeze({
      grandeBase,
      petiteBase,
      hauteurTrapeze,
      decalage: (grandeBase - petiteBase) / 2,
    }),
};

/** Prisme droit sur une base quelconque : deux bases congruentes et parallèles. */
export function creerPrismeSurBase({ base, hauteur = 4, type = "prisme", dimensions = {} } = {}) {
  const polygone = verifierBaseConvexe(base, "la base du prisme");
  const h = nombrePositif(hauteur, "la hauteur") / 2;
  const n = polygone.length;
  const bas = polygone.map(([x, y]) => [x, y, -h]);
  const haut = polygone.map(([x, y]) => [x, y, h]);
  const sommets = [...bas, ...haut];
  const faces = [
    { sommets: bas.map((_, i) => i), role: "base" },
    { sommets: haut.map((_, i) => n + i), role: "base" },
    // l'ordre suit le cycle des côtés de la base (§6.3 piège 18)
    ...bas.map((_, i) => ({
      sommets: [i, (i + 1) % n, n + ((i + 1) % n), n + i],
      role: "laterale",
    })),
  ];
  return polyedre(type, sommets, faces, { dimensions: { ...dimensions, hauteur: h * 2 } });
}

/**
 * Prisme droit debout. Sans `base`, la base est le polygone régulier
 * historique (`cotes`, `cote`) ; sinon c'est l'une des BASES_PRISME, ou
 * directement une liste de points [x, y].
 */
export function creerPrisme({ base, cotes = 5, cote = 3, hauteur = 4, ...parametresBase } = {}) {
  if (base === undefined || base === "reguliere") {
    const n = entierCotes(cotes);
    nombrePositif(cote, "le côté de la base");
    return creerPrismeSurBase({
      base: BASES_PRISME.reguliere({ cotes: n, cote }),
      hauteur,
      dimensions: { cotes: n, cote },
    });
  }
  if (Array.isArray(base)) {
    return creerPrismeSurBase({ base, hauteur, dimensions: { cotes: base.length } });
  }
  const fabrique = BASES_PRISME[base];
  if (!fabrique) {
    throw new RangeError(`Solide : base de prisme inconnue « ${base} » (voir BASES_PRISME)`);
  }
  const polygone = fabrique(parametresBase);
  return creerPrismeSurBase({
    base: polygone,
    hauteur,
    dimensions: { cotes: polygone.length, ...parametresBase },
  });
}

/**
 * Pyramide : une base polygonale, un sommet principal S, des faces
 * latérales toutes triangulaires (§6.3 piège 19).
 *
 * `sommetDecale: [dx, dy]` déplace S dans le plan horizontal : la pyramide
 * n'est alors PLUS régulière. C'est voulu — le cahier des charges exige de
 * pouvoir montrer une pyramide à base carrée non régulière, sinon l'image
 * fabrique une fausse définition (§1.3 et §6.3 piège 21). La hauteur reste
 * la perpendiculaire au plan de base : son pied H se déplace avec S.
 */
export function creerPyramide({
  cotes = 4,
  cote = 3.5,
  hauteur = 4,
  longueur,
  largeur,
  base: baseDemandee,
  sommetDecale = [0, 0],
  ...parametresBase
} = {}) {
  const h = nombrePositif(hauteur, "la hauteur") / 2;
  let polygone;
  let dimensions;
  let baseReguliere;
  if (baseDemandee !== undefined) {
    const points = Array.isArray(baseDemandee)
      ? baseDemandee
      : (BASES_PRISME[baseDemandee] ?? (() => {
          throw new RangeError(`Solide : base de pyramide inconnue « ${baseDemandee} » (voir BASES_PRISME)`);
        }))(parametresBase);
    polygone = verifierBaseConvexe(points, "la base de la pyramide");
    dimensions = { cotes: polygone.length, ...parametresBase, hauteur: h * 2 };
    baseReguliere = baseDemandee === "reguliere" || baseDemandee === "triangle-equilateral";
  } else if (longueur !== undefined || largeur !== undefined) {
    const L = nombrePositif(longueur ?? 4, "la longueur") / 2;
    const l = nombrePositif(largeur ?? 2.5, "la largeur") / 2;
    polygone = verifierBaseConvexe([[-L, -l], [L, -l], [L, l], [-L, l]], "la base de la pyramide");
    dimensions = { longueur: L * 2, largeur: l * 2, hauteur: h * 2 };
    baseReguliere = Math.abs(L - l) < 1e-9; // un carré est régulier, pas un rectangle
  } else {
    const n = entierCotes(cotes);
    nombrePositif(cote, "le côté de la base");
    polygone = verifierBaseConvexe(BASES_PRISME.reguliere({ cotes: n, cote }), "la base de la pyramide");
    dimensions = { cotes: n, cote, hauteur: h * 2 };
    baseReguliere = true;
  }

  const [dx, dy] = sommetDecale;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    throw new RangeError("Solide : sommetDecale attend deux nombres finis [dx, dy]");
  }
  const n = polygone.length;
  const base = polygone.map(([x, y]) => [x, y, -h]);
  const apex = [dx, dy, h];
  const sommets = [...base, apex];
  const faces = [
    { sommets: base.map((_, i) => i), role: "base" },
    ...base.map((_, i) => ({ sommets: [i, (i + 1) % n, n], role: "laterale" })),
  ];
  const centre = Math.hypot(dx, dy) < 1e-9;
  const solide = polyedre("pyramide", sommets, faces, {
    dimensions,
    sommetPrincipal: n,
    // le pied de la hauteur est l'aplomb de S, pas le centre de la base
    piedHauteur: [dx, dy, -h],
    reguliere: baseReguliere && centre,
  });
  solide.noms[n] = "S";
  return solide;
}

/** Tétraèdre régulier (pyramide dont TOUTES les arêtes sont égales). */
export function creerTetraedre({ arete = 4 } = {}) {
  const a = nombrePositif(arete, "l'arête");
  const hauteur = a * Math.sqrt(2 / 3);
  const solide = creerPyramide({ cotes: 3, cote: a, hauteur });
  return { ...solide, type: "tetraedre", roles: { ...solide.roles, dimensions: { arete: a, hauteur } } };
}

// ---------------------------------------------------------------------------
// Solides de révolution — définis analytiquement (§14.2), jamais imités
// par un polyèdre grossier.
// ---------------------------------------------------------------------------

export function creerCylindre({ rayon = 2, hauteur = 4 } = {}) {
  return {
    nature: "revolution",
    forme: "cylindre",
    type: "cylindre",
    rayon: nombrePositif(rayon, "le rayon"),
    hauteur: nombrePositif(hauteur, "la hauteur"),
  };
}

export function creerCone({ rayon = 2, hauteur = 4 } = {}) {
  return {
    nature: "revolution",
    forme: "cone",
    type: "cone",
    rayon: nombrePositif(rayon, "le rayon"),
    hauteur: nombrePositif(hauteur, "la hauteur"),
  };
}

export function creerSphere({ rayon = 2.5 } = {}) {
  return { nature: "revolution", forme: "sphere", type: "sphere", rayon: nombrePositif(rayon, "le rayon") };
}

/** La boule = l'intérieur ; même contour que la sphère, rendu « plein ». */
export function creerBoule({ rayon = 2.5 } = {}) {
  return { ...creerSphere({ rayon }), type: "boule", pleine: true };
}

export function creerDemiSphere({ rayon = 2.5 } = {}) {
  return { nature: "revolution", forme: "demi-sphere", type: "demi-sphere", rayon: nombrePositif(rayon, "le rayon") };
}

// ---------------------------------------------------------------------------
// Vue : rotation du modèle puis projection.
// ---------------------------------------------------------------------------

export const VUES_SOLIDES = {
  "trois-quarts": { lacetDeg: -28, tangageDeg: 16 },
  face: { lacetDeg: 0, tangageDeg: 0 },
  dessus: { lacetDeg: 0, tangageDeg: 90 },
  dessous: { lacetDeg: 0, tangageDeg: -90 },
  droite: { lacetDeg: 90, tangageDeg: 0 },
  gauche: { lacetDeg: -90, tangageDeg: 0 },
};

/**
 * Fabrique la vue : `tourner` (modèle → espace vue), `projeter`
 * (espace vue → écran, y SVG vers le bas) et `D`, la direction de
 * projection (ce qui s'éloigne de l'observateur). Une face est visible
 * si sa normale extérieure fait face à l'observateur : normale · D < 0.
 */
export function creerVue({
  projection = "cavaliere",
  angleDeg = 45,
  coefficient = 0.5,
  lacetDeg = 0,
  tangageDeg = 0,
} = {}) {
  if (projection !== "cavaliere" && projection !== "orthographique") {
    throw new RangeError("Solide : projection « cavaliere » ou « orthographique »");
  }
  const psi = lacetDeg * RAD;
  const phi = tangageDeg * RAD;
  const cosPsi = Math.cos(psi);
  const sinPsi = Math.sin(psi);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const tourner = ([x, y, z]) => {
    const x1 = x * cosPsi - y * sinPsi;
    const y1 = x * sinPsi + y * cosPsi;
    return [x1, y1 * cosPhi - z * sinPhi, y1 * sinPhi + z * cosPhi];
  };
  const detourner = ([x, y, z]) => {
    // rotation inverse (pour exprimer D dans le repère du modèle)
    const y1 = y * cosPhi + z * sinPhi;
    const z1 = -y * sinPhi + z * cosPhi;
    return [x * cosPsi + y1 * sinPsi, -x * sinPsi + y1 * cosPsi, z1];
  };
  const oblique = projection === "cavaliere";
  const kx = oblique ? coefficient * Math.cos(angleDeg * RAD) : 0;
  const kz = oblique ? coefficient * Math.sin(angleDeg * RAD) : 0;
  const projeter = ([x, y, z]) => [x + kx * y, -(z + kz * y), y];
  const D = [-kx, 1, -kz];
  return { tourner, detourner, projeter, D };
}

// ---------------------------------------------------------------------------
// Visibilité — recalculée à chaque appel, pour l'orientation demandée.
// ---------------------------------------------------------------------------

function normaleFace(points) {
  let normale = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    normale = ajouter(normale, produitVectoriel(points[i], points[(i + 1) % points.length]));
  }
  return normale;
}

/**
 * Pour une orientation donnée : quelles faces regardent l'observateur,
 * quelles arêtes sont cachées. C'est LE cœur anti-liste-figée.
 */
export function calculerVisibilite(solide, options = {}) {
  if (solide.nature !== "polyedre") {
    throw new TypeError("calculerVisibilite : réservé aux polyèdres");
  }
  const vue = creerVue(options);
  const tournes = solide.sommets.map(vue.tourner);
  const facesVisibles = solide.faces.map((face) => {
    const normale = normaleFace(face.sommets.map((i) => tournes[i]));
    return produitScalaire(normale, vue.D) < -EPSILON;
  });
  const aretes = aretesDe(solide).map((arete) => ({
    ...arete,
    visible: arete.faces.some((f) => facesVisibles[f]),
  }));
  return { facesVisibles, aretes };
}

// ---------------------------------------------------------------------------
// Rendu SVG
// ---------------------------------------------------------------------------

function cadre(pointsEcran, taille, marge) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pointsEcran) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const largeurMonde = Math.max(maxX - minX, EPSILON);
  const hauteurMonde = Math.max(maxY - minY, EPSILON);
  const echelle = (taille - 2 * marge) / Math.max(largeurMonde, hauteurMonde);
  const largeur = largeurMonde * echelle + 2 * marge;
  const hauteur = hauteurMonde * echelle + 2 * marge;
  const placer = ([x, y]) => [marge + (x - minX) * echelle, marge + (y - minY) * echelle];
  return { placer, largeur, hauteur, echelle };
}

function cheminFerme(points, { couleur, epaisseur = 3, pointilles = false, remplissage = "none", opacite = 1 }) {
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${px(x)} ${px(y)}`).join(" ") + " Z";
  const dash = pointilles ? ` stroke-dasharray="8 6"` : "";
  return `<path d="${d}" fill="${remplissage}" fill-opacity="${opacite}" stroke="${couleur}" stroke-width="${epaisseur}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
}

function cheminOuvert(points, { couleur, epaisseur = 3, pointilles = false }) {
  if (points.length < 2) return "";
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${px(x)} ${px(y)}`).join(" ");
  const dash = pointilles ? ` stroke-dasharray="8 6"` : "";
  return `<path d="${d}" fill="none" stroke="${couleur}" stroke-width="${epaisseur}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
}

/** Découpe un cercle échantillonné en arcs selon un prédicat de visibilité. */
function arcsSelon(pointsEtVisibilite) {
  const arcs = { visibles: [], caches: [] };
  let courant = null;
  let etat = null;
  const pousser = () => {
    if (courant && courant.length > 1) arcs[etat ? "visibles" : "caches"].push(courant);
  };
  for (const { ecran, visible } of pointsEtVisibilite) {
    if (etat === null || visible !== etat) {
      pousser();
      courant = courant ? [courant[courant.length - 1], ecran] : [ecran];
      etat = visible;
    } else {
      courant.push(ecran);
    }
  }
  pousser();
  return arcs;
}

function traitsDe(theme) {
  const enCouleur = theme === "couleur";
  return {
    visible: enCouleur ? CONTOUR_COULEUR : ENCRE,
    cache: enCouleur ? ATTENUE : ENCRE,
    secondaire: enCouleur ? ATTENUE : ENCRE,
  };
}

/**
 * Dessine un solide (polyèdre ou révolution) en SVG autonome.
 *
 * @param {object} solide — sorti d'un constructeur creer…
 * @param {object} [options]
 *   projection « cavaliere » | « orthographique », angleDeg, coefficient,
 *   lacetDeg, tangageDeg — l'orientation ;
 *   taille (px, défaut 360), marge (défaut 30) ;
 *   theme « noir » | « couleur » ;
 *   noms (sommets nommés), base (mise en valeur), hauteur (segment + angle
 *   droit), mesures (dimensions écrites), unite (« cm » par défaut) ;
 *   cachees « pointilles » | « masquees » — le sort des arêtes cachées.
 * @returns {string} balise <svg>
 */
export function dessinerSolide(solide, options = {}) {
  const {
    taille = 360,
    marge = 30,
    theme = "noir",
    noms = false,
    base = false,
    hauteur = false,
    mesures = false,
    unite = "cm",
    cachees = "pointilles",
  } = options;
  if (cachees !== "pointilles" && cachees !== "masquees") {
    throw new RangeError("Solide : cachees « pointilles » ou « masquees »");
  }
  const rendu = solide.nature === "polyedre"
    ? dessinerPolyedre(solide, options, { taille, marge, theme, noms, base, hauteur, mesures, unite, cachees })
    : dessinerRevolution(solide, options, { taille, marge, theme, base, hauteur, mesures, unite, cachees, noms });
  return rendu;
}

function dessinerPolyedre(solide, optionsVue, reglages) {
  const { taille, marge, theme, noms, base, hauteur, mesures, unite, cachees } = reglages;
  const vue = creerVue(optionsVue);
  const { facesVisibles, aretes } = calculerVisibilite(solide, optionsVue);
  const ecrans = solide.sommets.map((p) => vue.projeter(vue.tourner(p)));
  const { placer, largeur, hauteur: hauteurSvg } = cadre(ecrans, taille, marge);
  const places = ecrans.map(placer);
  const couleurs = traitsDe(theme);

  let fond = "";
  let traitsCaches = "";
  let traitsVisibles = "";
  let habillage = "";

  if (base) {
    for (let f = 0; f < solide.faces.length; f++) {
      if (solide.faces[f].role !== "base") continue;
      fond += cheminFerme(solide.faces[f].sommets.map((i) => places[i]), {
        couleur: BASE_COULEUR,
        epaisseur: facesVisibles[f] ? 3.5 : 2.5,
        pointilles: !facesVisibles[f],
        remplissage: facesVisibles[f] ? BASE_COULEUR : "none",
        opacite: 0.14,
      });
    }
  }

  for (const arete of aretes) {
    const [a, b] = arete.sommets;
    const longueurEcran = Math.hypot(places[a][0] - places[b][0], places[a][1] - places[b][1]);
    if (longueurEcran < 0.5) continue; // arête vue par la tranche
    if (arete.visible) {
      traitsVisibles += ligne(places[a], places[b], { couleur: couleurs.visible, epaisseur: 3 });
    } else if (cachees === "pointilles") {
      traitsCaches += ligne(places[a], places[b], { couleur: couleurs.cache, epaisseur: 2.5, pointilles: true });
    }
  }

  if (hauteur && solide.roles.sommetPrincipal !== undefined) {
    // Pyramide : la hauteur est la PERPENDICULAIRE au plan de base (§6.3
    // piège 20). Son pied est l'aplomb de S — qui ne tombe au centre de la
    // base que si la pyramide est régulière.
    const faceBase = solide.faces.find((f) => f.role === "base");
    const centreBase = solide.roles.piedHauteur ?? faceBase.sommets
      .reduce((acc, i) => ajouter(acc, solide.sommets[i]), [0, 0, 0])
      .map((c) => c / faceBase.sommets.length);
    const pied = placer(vue.projeter(vue.tourner(centreBase)));
    const sommet = places[solide.roles.sommetPrincipal];
    habillage += ligne(pied, sommet, { couleur: couleurs.secondaire, epaisseur: 2.5, pointilles: "mixte" });
    habillage += marqueAngleDroit(centreBase, solide, vue, placer, couleurs.secondaire);
    if (mesures) {
      habillage += texte(echapper(formaterLongueur(solide.roles.dimensions.hauteur, unite)), [
        (pied[0] + sommet[0]) / 2 + 16,
        (pied[1] + sommet[1]) / 2,
      ], { couleur: couleurs.secondaire, taille: 15 });
    }
  }

  if (noms) {
    const centre = places
      .reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0])
      .map((c) => c / places.length);
    solide.noms.forEach((nom, i) => {
      const direction = [places[i][0] - centre[0], places[i][1] - centre[1]];
      const d = Math.hypot(...direction) || 1;
      habillage += texte(echapper(nom), [
        places[i][0] + (direction[0] / d) * 15,
        places[i][1] + (direction[1] / d) * 15,
      ], { couleur: ENCRE, taille: 16 });
    });
  }

  if (mesures && solide.roles.dimensions && solide.roles.sommetPrincipal === undefined) {
    habillage += mesuresPolyedre(solide, places, aretes, couleurs.secondaire, unite);
  }

  return enveloppeSvg(largeur, hauteurSvg, `solide : ${solide.type}`, fond + traitsCaches + traitsVisibles + habillage);
}

function marqueAngleDroit(centreBase, solide, vue, placer, couleur) {
  // petit carré au pied de la hauteur, posé dans le plan de la base
  const faceBase = solide.faces.find((f) => f.role === "base");
  const versSommet = normaliser(soustraire(solide.sommets[solide.roles.sommetPrincipal], centreBase));
  const versBord = normaliser(soustraire(solide.sommets[faceBase.sommets[0]], centreBase));
  const c = 0.4;
  const coins = [
    centreBase,
    ajouter(centreBase, multiplier(versBord, c)),
    ajouter(centreBase, ajouter(multiplier(versBord, c), multiplier(versSommet, c))),
    ajouter(centreBase, multiplier(versSommet, c)),
  ].map((p) => placer(vue.projeter(vue.tourner(p))));
  return cheminFerme(coins, { couleur, epaisseur: 2 }).replace('fill="none"', 'fill="none" data-role="angle-droit"');
}

function mesuresPolyedre(solide, places, aretes, couleur, unite) {
  // une mesure par dimension, posée sur une arête visible représentative
  const d = solide.roles.dimensions;
  const etiquettes = [];
  const etiqueter = (arete, valeur) => {
    const [a, b] = arete.sommets;
    const milieuX = (places[a][0] + places[b][0]) / 2;
    const milieuY = (places[a][1] + places[b][1]) / 2;
    etiquettes.push(texte(echapper(formaterLongueur(valeur, unite)), [milieuX, milieuY + 14], {
      couleur,
      taille: 14,
    }));
  };
  const visibles = aretes.filter((arete) => arete.visible);
  const longueurModele = (arete) =>
    norme(soustraire(solide.sommets[arete.sommets[1]], solide.sommets[arete.sommets[0]]));
  const dejaFait = new Set();
  for (const arete of visibles) {
    const valeur = Number(longueurModele(arete).toFixed(6));
    for (const [nom, attendu] of Object.entries(d)) {
      if (nom === "cotes" || dejaFait.has(nom)) continue;
      if (Math.abs(valeur - attendu) < 1e-6) {
        etiqueter(arete, attendu);
        dejaFait.add(nom);
        break;
      }
    }
  }
  return etiquettes.join("");
}

// ---------------------------------------------------------------------------
// Solides de révolution : le MODÈLE reste analytique (rayon, hauteur, axe) ;
// seul le TRACÉ échantillonne les cercles (pas de 3°, déterministe).
// ---------------------------------------------------------------------------

const PAS_CERCLE = 3; // degrés

function pointsCercle(centre, rayon, u, v) {
  const points = [];
  for (let t = 0; t < 360; t += PAS_CERCLE) {
    const c = Math.cos(t * RAD);
    const s = Math.sin(t * RAD);
    points.push({
      t,
      modele: ajouter(centre, ajouter(multiplier(u, rayon * c), multiplier(v, rayon * s))),
      radial: ajouter(multiplier(u, c), multiplier(v, s)),
    });
  }
  return points;
}

function dessinerRevolution(solide, optionsVue, reglages) {
  const { taille, marge, theme, base, hauteur, mesures, unite, cachees, noms } = reglages;
  const vue = creerVue(optionsVue);
  const couleurs = traitsDe(theme);
  const r = solide.rayon;
  const h = solide.hauteur ?? 0;
  const u = [1, 0, 0];
  const v = [0, 1, 0];
  const axe = [0, 0, 1];

  // tout passe par : tourner → projeter → placer (après calcul du cadre)
  const projeterModele = (p) => vue.projeter(vue.tourner(p));
  const Dmodele = vue.detourner(vue.D); // direction de projection exprimée côté modèle

  // candidats pour le cadre : les cercles caractéristiques + pôles
  const candidats = [];
  const cercles = [];
  if (solide.forme === "cylindre") {
    cercles.push({ centre: [0, 0, -h / 2], role: "base" }, { centre: [0, 0, h / 2], role: "haut" });
  } else if (solide.forme === "cone") {
    cercles.push({ centre: [0, 0, -h / 2], role: "base" });
    candidats.push(projeterModele([0, 0, h / 2]));
  } else {
    // sphère, boule, demi-sphère : le contour apparent (grand cercle ⊥ D)
    candidats.push(projeterModele([0, 0, 0]));
  }
  for (const cercle of cercles) {
    for (const point of pointsCercle(cercle.centre, r, u, v)) {
      candidats.push(projeterModele(point.modele));
    }
  }
  if (solide.forme === "sphere" || solide.forme === "demi-sphere") {
    for (const point of pointsSilhouetteSphere(r, Dmodele, solide.forme === "demi-sphere")) {
      candidats.push(projeterModele(point));
    }
    for (const point of pointsCercle([0, 0, 0], r, u, v)) {
      candidats.push(projeterModele(point.modele));
    }
  }
  const { placer, largeur, hauteur: hauteurSvg } = cadre(candidats, taille, marge);
  const poser = (p) => placer(projeterModele(p));

  let dessin = "";
  const dessinerArcs = (points, testeVisible) => {
    const suite = points.map((point) => ({
      ecran: poser(point.modele),
      visible: testeVisible(point),
    }));
    suite.push(suite[0]); // referme le cercle
    const arcs = arcsSelon(suite);
    let sortie = "";
    if (cachees === "pointilles") {
      for (const arc of arcs.caches) {
        sortie += cheminOuvert(arc, { couleur: couleurs.cache, epaisseur: 2.5, pointilles: true });
      }
    }
    for (const arc of arcs.visibles) {
      sortie += cheminOuvert(arc, { couleur: couleurs.visible, epaisseur: 3 });
    }
    return sortie;
  };

  if (solide.forme === "cylindre" || solide.forme === "cone") {
    dessin += dessinerCylindreOuCone(solide, { vue, poser, couleurs, cachees, dessinerArcs, base, Dmodele, u, v, axe });
  } else {
    dessin += dessinerSphereOuDemi(solide, { poser, couleurs, cachees, dessinerArcs, base, Dmodele, u, v });
  }

  // habillage commun : hauteur (axe), rayon mesuré, noms des centres
  const centreBas = solide.forme === "sphere" || solide.forme === "boule" ? [0, 0, 0]
    : solide.forme === "demi-sphere" ? [0, 0, 0]
    : [0, 0, -h / 2];
  if (hauteur && (solide.forme === "cylindre" || solide.forme === "cone")) {
    const hautPoint = solide.forme === "cone" ? [0, 0, h / 2] : [0, 0, h / 2];
    dessin += ligne(poser(centreBas), poser(hautPoint), {
      couleur: couleurs.secondaire,
      epaisseur: 2.5,
      pointilles: "mixte",
    });
    if (mesures) {
      const a = poser(centreBas);
      const b = poser(hautPoint);
      dessin += texte(echapper(formaterLongueur(h, unite)), [(a[0] + b[0]) / 2 + 18, (a[1] + b[1]) / 2], {
        couleur: couleurs.secondaire,
        taille: 15,
      });
    }
  }
  if (mesures) {
    // rayon : segment du centre de la base vers l'avant
    const bord = ajouter(centreBas, multiplier([0, -1, 0], r));
    dessin += ligne(poser(centreBas), poser(bord), { couleur: couleurs.secondaire, epaisseur: 2.5 });
    const a = poser(centreBas);
    const b = poser(bord);
    dessin += texte(echapper(formaterLongueur(r, unite)), [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 12], {
      couleur: couleurs.secondaire,
      taille: 15,
    });
  }
  if (noms) {
    dessin += texte("O", [poser(centreBas)[0] - 12, poser(centreBas)[1] - 8], { couleur: ENCRE, taille: 16 });
    if (solide.forme === "cone") {
      dessin += texte("S", [poser([0, 0, h / 2])[0], poser([0, 0, h / 2])[1] - 14], { couleur: ENCRE, taille: 16 });
    }
  }

  return enveloppeSvg(largeur, hauteurSvg, `solide : ${solide.type}`, dessin);
}

function dessinerCylindreOuCone(solide, contexte) {
  const { poser, couleurs, cachees, dessinerArcs, base, Dmodele, u, v } = contexte;
  const r = solide.rayon;
  const h = solide.hauteur;
  const estCone = solide.forme === "cone";
  let dessin = "";

  // silhouette : où la normale latérale est ⊥ à la direction de projection
  const uD = produitScalaire(u, Dmodele);
  const vD = produitScalaire(v, Dmodele);
  const aD = produitScalaire([0, 0, 1], Dmodele);
  let tangentes = [];
  if (estCone) {
    // normale latérale ∝ h·(u cos t + v sin t) + r·axe
    const A = h * uD;
    const B = h * vD;
    const C = -r * aD;
    const amplitude = Math.hypot(A, B);
    if (amplitude > Math.abs(C) + EPSILON) {
      const phase = Math.atan2(B, A);
      const ecart = Math.acos(C / amplitude);
      tangentes = [phase + ecart, phase - ecart];
    }
  } else {
    // normale latérale ∝ u cos t + v sin t
    tangentes = [Math.atan2(-uD, vD), Math.atan2(-uD, vD) + Math.PI];
  }
  const pointBase = (t) => [Math.cos(t) * r, Math.sin(t) * r, -h / 2];
  const sommet = estCone ? [0, 0, h / 2] : null;
  for (const t of tangentes) {
    const bas = pointBase(t);
    const haut = estCone ? sommet : [bas[0], bas[1], h / 2];
    const a = poser(bas);
    const b = poser(haut);
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5) continue; // vue dans l'axe
    dessin += ligne(a, b, { couleur: couleurs.visible, epaisseur: 3 });
  }

  // normale latérale en un point du cercle (sert au partage visible/caché)
  const normaleLaterale = (point) => (estCone
    ? ajouter(multiplier(point.radial, h), multiplier([0, 0, 1], r))
    : point.radial);
  const faceVersObservateur = (normale) => produitScalaire(normale, Dmodele) < -EPSILON;

  const cerclesDessines = estCone
    ? [{ centre: [0, 0, -h / 2], normaleCap: [0, 0, -1], role: "base" }]
    : [
        { centre: [0, 0, -h / 2], normaleCap: [0, 0, -1], role: "base" },
        { centre: [0, 0, h / 2], normaleCap: [0, 0, 1], role: "haut" },
      ];
  for (const cercle of cerclesDessines) {
    const points = pointsCercle(cercle.centre, r, u, v);
    const capVisible = faceVersObservateur(cercle.normaleCap);
    dessin += dessinerArcs(points, (point) => capVisible || faceVersObservateur(normaleLaterale(point)));
    if (base && cercle.role === "base") {
      const contour = points.map((point) => poser(point.modele));
      dessin += cheminFerme(contour, {
        couleur: BASE_COULEUR,
        epaisseur: 0.001,
        remplissage: BASE_COULEUR,
        opacite: 0.14,
      });
    }
  }
  void cachees;
  return dessin;
}

function pointsSilhouetteSphere(rayon, Dmodele, demi) {
  // grand cercle ⊥ D (le contour apparent), éventuellement limité au dôme
  const d = normaliser(Dmodele);
  const quelconque = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  const e1 = normaliser(produitVectoriel(d, quelconque));
  const e2 = produitVectoriel(d, e1);
  const tous = [];
  for (let t = 0; t < 360; t += PAS_CERCLE) {
    tous.push(ajouter(
      multiplier(e1, rayon * Math.cos(t * RAD)),
      multiplier(e2, rayon * Math.sin(t * RAD)),
    ));
  }
  if (!demi) return tous;
  // dôme seulement : on fait DÉMARRER le parcours dans la zone retirée,
  // sinon le tracé relierait les deux bouts par une corde à travers le dôme
  const horsDome = (p) => p[2] < -1e-6;
  const depart = tous.findIndex(horsDome);
  if (depart === -1) return tous;
  const reordonnes = [...tous.slice(depart), ...tous.slice(0, depart)];
  return reordonnes.filter((p) => !horsDome(p));
}

function dessinerSphereOuDemi(solide, contexte) {
  const { poser, couleurs, dessinerArcs, base, Dmodele, u, v } = contexte;
  const r = solide.rayon;
  const demi = solide.forme === "demi-sphere";
  let dessin = "";

  // le contour apparent (toujours visible, par définition)
  const silhouette = pointsSilhouetteSphere(r, Dmodele, demi).map((p) => poser(p));
  if (silhouette.length > 1) {
    if (demi) dessin += cheminOuvert(silhouette, { couleur: couleurs.visible, epaisseur: 3 });
    else dessin += cheminFerme(silhouette, { couleur: couleurs.visible, epaisseur: 3, remplissage: solide.pleine ? couleurs.visible : "none", opacite: solide.pleine ? 0.08 : 1 });
  }

  // l'équateur (= le bord du disque de base pour la demi-sphère)
  const equateur = pointsCercle([0, 0, 0], r, u, v);
  const capBasVisible = demi && produitScalaire([0, 0, -1], Dmodele) < -EPSILON;
  dessin += dessinerArcs(equateur, (point) => capBasVisible || produitScalaire(point.radial, Dmodele) < -EPSILON);
  if (base && demi) {
    dessin += cheminFerme(equateur.map((point) => poser(point.modele)), {
      couleur: BASE_COULEUR,
      epaisseur: 0.001,
      remplissage: BASE_COULEUR,
      opacite: 0.14,
    });
  }
  return dessin;
}

// ---------------------------------------------------------------------------
// La banque de solides usuels — pilote l'Atelier et le labo.
// ---------------------------------------------------------------------------

export const SOLIDES_USUELS = {
  cube: {
    titre: "Cube",
    categorie: "Polyèdres",
    parametres: [{ cle: "arete", libelle: "arête", min: 1, max: 8, pas: 0.5, defaut: 4 }],
    creer: (p = {}) => creerCube({ arete: p.arete ?? 4 }),
  },
  pave: {
    titre: "Pavé droit",
    categorie: "Polyèdres",
    parametres: [
      { cle: "longueur", libelle: "longueur", min: 1, max: 9, pas: 0.5, defaut: 5 },
      { cle: "largeur", libelle: "largeur", min: 1, max: 9, pas: 0.5, defaut: 3 },
      { cle: "hauteur", libelle: "hauteur", min: 1, max: 9, pas: 0.5, defaut: 2.5 },
    ],
    creer: (p = {}) => creerPave(p),
  },
  prisme: {
    titre: "Prisme droit",
    categorie: "Polyèdres",
    parametres: [
      { cle: "cotes", libelle: "côtés de la base", min: 3, max: 8, pas: 1, defaut: 5 },
      { cle: "cote", libelle: "côté", min: 1, max: 6, pas: 0.5, defaut: 3 },
      { cle: "hauteur", libelle: "hauteur", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) => creerPrisme(p),
  },
  "prisme-triangle-quelconque": {
    titre: "Prisme à base triangulaire quelconque",
    categorie: "Polyèdres",
    parametres: [
      { cle: "cote", libelle: "base du triangle", min: 2, max: 8, pas: 0.5, defaut: 5 },
      { cle: "hauteurTriangle", libelle: "hauteur du triangle", min: 1, max: 6, pas: 0.5, defaut: 3.4 },
      { cle: "hauteur", libelle: "hauteur du prisme", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) =>
      creerPrisme({
        base: "triangle-quelconque",
        cote: p.cote ?? 5,
        hauteurTriangle: p.hauteurTriangle ?? 3.4,
        hauteur: p.hauteur ?? 4,
      }),
  },
  "prisme-triangle-rectangle": {
    titre: "Prisme à base triangle rectangle",
    categorie: "Polyèdres",
    parametres: [
      { cle: "cote1", libelle: "premier côté de l'angle droit", min: 1, max: 8, pas: 0.5, defaut: 4 },
      { cle: "cote2", libelle: "second côté de l'angle droit", min: 1, max: 8, pas: 0.5, defaut: 3 },
      { cle: "hauteur", libelle: "hauteur du prisme", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) =>
      creerPrisme({ base: "triangle-rectangle", cote1: p.cote1 ?? 4, cote2: p.cote2 ?? 3, hauteur: p.hauteur ?? 4 }),
  },
  "prisme-triangle-isocele": {
    titre: "Prisme à base triangle isocèle",
    categorie: "Polyèdres",
    parametres: [
      { cle: "cote", libelle: "base du triangle", min: 1, max: 8, pas: 0.5, defaut: 4 },
      { cle: "hauteurTriangle", libelle: "hauteur du triangle", min: 1, max: 7, pas: 0.5, defaut: 3.5 },
      { cle: "hauteur", libelle: "hauteur du prisme", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) =>
      creerPrisme({
        base: "triangle-isocele",
        cote: p.cote ?? 4,
        hauteurTriangle: p.hauteurTriangle ?? 3.5,
        hauteur: p.hauteur ?? 4,
      }),
  },
  "prisme-triangle-equilateral": {
    titre: "Prisme à base triangle équilatéral",
    categorie: "Polyèdres",
    parametres: [
      { cle: "cote", libelle: "côté du triangle", min: 1, max: 8, pas: 0.5, defaut: 4 },
      { cle: "hauteur", libelle: "hauteur du prisme", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) => creerPrisme({ base: "triangle-equilateral", cote: p.cote ?? 4, hauteur: p.hauteur ?? 4 }),
  },
  "prisme-parallelogramme": {
    titre: "Prisme à base parallélogramme",
    categorie: "Polyèdres",
    parametres: [
      { cle: "cote", libelle: "base", min: 2, max: 8, pas: 0.5, defaut: 5 },
      { cle: "petitCote", libelle: "côté", min: 1, max: 6, pas: 0.5, defaut: 3 },
      { cle: "angleDeg", libelle: "angle", min: 25, max: 155, pas: 1, defaut: 62 },
      { cle: "hauteur", libelle: "hauteur du prisme", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) =>
      creerPrisme({
        base: "parallelogramme",
        cote: p.cote ?? 5,
        petitCote: p.petitCote ?? 3,
        angleDeg: p.angleDeg ?? 62,
        hauteur: p.hauteur ?? 4,
      }),
  },
  "prisme-trapeze-isocele": {
    titre: "Prisme à base trapèze isocèle",
    categorie: "Polyèdres",
    parametres: [
      { cle: "grandeBase", libelle: "grande base", min: 2, max: 9, pas: 0.5, defaut: 6 },
      { cle: "petiteBase", libelle: "petite base", min: 1, max: 8, pas: 0.5, defaut: 3 },
      { cle: "hauteurTrapeze", libelle: "hauteur du trapèze", min: 1, max: 6, pas: 0.5, defaut: 3 },
      { cle: "hauteur", libelle: "hauteur du prisme", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) =>
      creerPrisme({
        base: "trapeze-isocele",
        grandeBase: p.grandeBase ?? 6,
        // la petite base doit rester strictement plus courte que la grande
        petiteBase: Math.min(p.petiteBase ?? 3, (p.grandeBase ?? 6) - 0.5),
        hauteurTrapeze: p.hauteurTrapeze ?? 3,
        hauteur: p.hauteur ?? 4,
      }),
  },
  "prisme-trapeze-rectangle": {
    titre: "Prisme à base trapèze rectangle",
    categorie: "Polyèdres",
    parametres: [
      { cle: "grandeBase", libelle: "grande base", min: 2, max: 9, pas: 0.5, defaut: 6 },
      { cle: "petiteBase", libelle: "petite base", min: 1, max: 8, pas: 0.5, defaut: 3.5 },
      { cle: "hauteurTrapeze", libelle: "hauteur du trapèze", min: 1, max: 6, pas: 0.5, defaut: 3 },
      { cle: "hauteur", libelle: "hauteur du prisme", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) =>
      creerPrisme({
        base: "trapeze-rectangle",
        grandeBase: p.grandeBase ?? 6,
        petiteBase: Math.min(p.petiteBase ?? 3.5, (p.grandeBase ?? 6) - 0.5),
        hauteurTrapeze: p.hauteurTrapeze ?? 3,
        hauteur: p.hauteur ?? 4,
      }),
  },
  pyramide: {
    titre: "Pyramide",
    categorie: "Polyèdres",
    parametres: [
      { cle: "cotes", libelle: "côtés de la base", min: 3, max: 8, pas: 1, defaut: 4 },
      { cle: "cote", libelle: "côté", min: 1, max: 7, pas: 0.5, defaut: 3.5 },
      { cle: "hauteur", libelle: "hauteur", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) => creerPyramide(p),
  },
  "pyramide-non-reguliere": {
    titre: "Pyramide non régulière (sommet décentré)",
    categorie: "Polyèdres",
    parametres: [
      { cle: "cote", libelle: "côté de la base carrée", min: 1, max: 7, pas: 0.5, defaut: 3.5 },
      { cle: "hauteur", libelle: "hauteur", min: 1, max: 9, pas: 0.5, defaut: 4 },
      { cle: "decalageX", libelle: "décalage du sommet", min: -2.5, max: 2.5, pas: 0.25, defaut: 1.5 },
    ],
    creer: (p = {}) =>
      creerPyramide({
        cotes: 4,
        cote: p.cote ?? 3.5,
        hauteur: p.hauteur ?? 4,
        sommetDecale: [p.decalageX ?? 1.5, 0],
      }),
  },
  "pyramide-rectangle": {
    titre: "Pyramide à base rectangulaire",
    categorie: "Polyèdres",
    parametres: [
      { cle: "longueur", libelle: "longueur", min: 1, max: 9, pas: 0.5, defaut: 4.5 },
      { cle: "largeur", libelle: "largeur", min: 1, max: 9, pas: 0.5, defaut: 3 },
      { cle: "hauteur", libelle: "hauteur", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) => creerPyramide({ longueur: p.longueur ?? 4.5, largeur: p.largeur ?? 3, hauteur: p.hauteur ?? 4 }),
  },
  tetraedre: {
    titre: "Tétraèdre régulier",
    categorie: "Polyèdres",
    parametres: [{ cle: "arete", libelle: "arête", min: 1, max: 8, pas: 0.5, defaut: 4 }],
    creer: (p = {}) => creerTetraedre({ arete: p.arete ?? 4 }),
  },
  cylindre: {
    titre: "Cylindre de révolution",
    categorie: "Solides de révolution",
    parametres: [
      { cle: "rayon", libelle: "rayon", min: 0.5, max: 5, pas: 0.5, defaut: 2 },
      { cle: "hauteur", libelle: "hauteur", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) => creerCylindre(p),
  },
  cone: {
    titre: "Cône de révolution",
    categorie: "Solides de révolution",
    parametres: [
      { cle: "rayon", libelle: "rayon", min: 0.5, max: 5, pas: 0.5, defaut: 2 },
      { cle: "hauteur", libelle: "hauteur", min: 1, max: 9, pas: 0.5, defaut: 4 },
    ],
    creer: (p = {}) => creerCone(p),
  },
  sphere: {
    titre: "Sphère",
    categorie: "Solides de révolution",
    parametres: [{ cle: "rayon", libelle: "rayon", min: 0.5, max: 5, pas: 0.5, defaut: 2.5 }],
    creer: (p = {}) => creerSphere(p),
  },
  boule: {
    titre: "Boule",
    categorie: "Solides de révolution",
    parametres: [{ cle: "rayon", libelle: "rayon", min: 0.5, max: 5, pas: 0.5, defaut: 2.5 }],
    creer: (p = {}) => creerBoule(p),
  },
  "demi-sphere": {
    titre: "Demi-sphère",
    categorie: "Solides de révolution",
    parametres: [{ cle: "rayon", libelle: "rayon", min: 0.5, max: 5, pas: 0.5, defaut: 2.5 }],
    creer: (p = {}) => creerDemiSphere(p),
  },
};

export const CATEGORIES_SOLIDES = ["Polyèdres", "Solides de révolution"];
