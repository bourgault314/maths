// Figures usuelles maths&go — version 1, STATUT BROUILLON.
//
// Chaque figure du collège est un PRÉRÉGLAGE : une fonction qui rend la
// description complète (sommets calculés + codages pédagogiques par
// défaut) que `dessinerFigure` sait dessiner. On peut ensuite tout
// surcharger : visibilité, mesures, couleurs, rotation…
//
// Le registre FIGURES_USUELLES trie tout par catégorie (Triangles,
// Quadrilatères, Polygones, Cercle et disque) : c'est lui que la page
// Atelier parcourt pour construire ses menus — une figure ajoutée ici
// apparaît là-bas sans une ligne de plus.

import {
  sommetsCarre,
  sommetsCerfVolant,
  sommetsLosange,
  sommetsParallelogramme,
  sommetsPolygone,
  sommetsPolygoneRegulier,
  sommetsQuadrilatere,
  sommetsRectangle,
  sommetsTrapeze,
  sommetsTrapezeIsocele,
  sommetsTrapezeRectangle,
  sommetsTriangle,
} from "./geometrie.js";

export const VERSION_FIGURES_USUELLES = 1;

const nomsCotes = (nom) =>
  nom.split("").map((l, i) => l + nom[(i + 1) % nom.length]);

// ---------------------------------------------------------------------------
// Quadrilatères
// ---------------------------------------------------------------------------

/** Carré codé : quatre côtés égaux, quatre angles droits. */
export function decrireCarre({ cote = 4, nom = "ABCD", coder = true } = {}) {
  return {
    sommets: sommetsCarre({ cote }),
    nom,
    legende: `carré ${nom} de côté ${cote}`,
    codages: coder
      ? [
          { type: "egalite", cotes: nomsCotes(nom), traits: 1 },
          { type: "angleDroit", sommets: nom.split("") },
        ]
      : [],
  };
}

/** Rectangle codé : côtés opposés égaux (1 et 2 traits), quatre angles droits. */
export function decrireRectangle({
  largeur = 6,
  hauteur = 4,
  nom = "ABCD",
  coder = true,
} = {}) {
  const [ab, bc, cd, da] = nomsCotes(nom);
  return {
    sommets: sommetsRectangle({ largeur, hauteur }),
    nom,
    legende: `rectangle ${nom}`,
    codages: coder
      ? [
          { type: "egalite", cotes: [ab, cd], traits: 1 },
          { type: "egalite", cotes: [bc, da], traits: 2 },
          { type: "angleDroit", sommets: nom.split("") },
        ]
      : [],
  };
}

/** Losange codé : quatre côtés égaux. */
export function decrireLosange({
  cote = 4,
  angleDeg = 65,
  diagonales = null,
  nom = "ABCD",
  coder = true,
} = {}) {
  return {
    sommets: sommetsLosange({ cote, angleDeg, diagonales }),
    nom,
    legende: `losange ${nom}`,
    codages: coder ? [{ type: "egalite", cotes: nomsCotes(nom), traits: 1 }] : [],
  };
}

/** Parallélogramme codé : côtés opposés parallèles et égaux. */
export function decrireParallelogramme({
  base = 6,
  cote = 3.5,
  angleDeg = 65,
  nom = "ABCD",
  coder = true,
} = {}) {
  const [ab, bc, cd, da] = nomsCotes(nom);
  return {
    sommets: sommetsParallelogramme({ base, cote, angleDeg }),
    nom,
    legende: `parallélogramme ${nom}`,
    codages: coder
      ? [
          { type: "egalite", cotes: [ab, cd], traits: 1 },
          { type: "egalite", cotes: [bc, da], traits: 2 },
          { type: "paralleles", cotes: [ab, cd], fleches: 1 },
          { type: "paralleles", cotes: [bc, da], fleches: 2 },
        ]
      : [],
  };
}

/** Trapèze : les deux bases parallèles sont codées. */
export function decrireTrapeze({
  grandeBase = 7,
  petiteBase = 4,
  hauteur = 3,
  decalage = 1,
  nom = "ABCD",
  coder = true,
} = {}) {
  const [ab, , cd] = nomsCotes(nom);
  return {
    sommets: sommetsTrapeze({ grandeBase, petiteBase, hauteur, decalage }),
    nom,
    legende: `trapèze ${nom}`,
    codages: coder ? [{ type: "paralleles", cotes: [ab, cd], fleches: 1 }] : [],
  };
}

/** Trapèze rectangle : bases parallèles + deux angles droits. */
export function decrireTrapezeRectangle({
  grandeBase = 7,
  petiteBase = 4,
  hauteur = 3,
  nom = "ABCD",
  coder = true,
} = {}) {
  const [ab, , cd] = nomsCotes(nom);
  return {
    sommets: sommetsTrapezeRectangle({ grandeBase, petiteBase, hauteur }),
    nom,
    legende: `trapèze rectangle ${nom}`,
    codages: coder
      ? [
          { type: "paralleles", cotes: [ab, cd], fleches: 1 },
          { type: "angleDroit", sommets: [nom[0], nom[3]] },
        ]
      : [],
  };
}

/** Trapèze isocèle : bases parallèles + côtés obliques égaux. */
export function decrireTrapezeIsocele({
  grandeBase = 7,
  petiteBase = 4,
  hauteur = 3,
  nom = "ABCD",
  coder = true,
} = {}) {
  const [ab, bc, cd, da] = nomsCotes(nom);
  return {
    sommets: sommetsTrapezeIsocele({ grandeBase, petiteBase, hauteur }),
    nom,
    legende: `trapèze isocèle ${nom}`,
    codages: coder
      ? [
          { type: "paralleles", cotes: [ab, cd], fleches: 1 },
          { type: "egalite", cotes: [bc, da], traits: 1 },
        ]
      : [],
  };
}

/** Cerf-volant : deux paires de côtés consécutifs égaux. */
export function decrireCerfVolant({
  diagonalePrincipale = 6,
  diagonaleSecondaire = 4,
  position = 0.35,
  nom = "ABCD",
  coder = true,
} = {}) {
  const [ab, bc, cd, da] = nomsCotes(nom);
  return {
    sommets: sommetsCerfVolant({ diagonalePrincipale, diagonaleSecondaire, position }),
    nom,
    legende: `cerf-volant ${nom}`,
    codages: coder
      ? [
          { type: "egalite", cotes: [ab, da], traits: 1 },
          { type: "egalite", cotes: [bc, cd], traits: 2 },
        ]
      : [],
  };
}

/** Quadrilatère quelconque, sans codage (refuse les figures croisées). */
export function decrireQuadrilatere({
  points = [[0, 0], [5, 0], [6, 3.5], [1.2, 4.2]],
  nom = "ABCD",
} = {}) {
  return {
    sommets: sommetsQuadrilatere({ points }),
    nom,
    legende: `quadrilatère ${nom}`,
    codages: [],
  };
}

// ---------------------------------------------------------------------------
// Triangles
// ---------------------------------------------------------------------------

/** Triangle quelconque, par trois angles (somme 180) ou trois côtés. */
export function decrireTriangle({ angles = null, cotes = null, nom = "ABC" } = {}) {
  return {
    sommets: sommetsTriangle(angles ? { angles } : cotes ? { cotes } : { angles: [50, 60, 70] }),
    nom,
    legende: `triangle ${nom}`,
    codages: [],
  };
}

/** Triangle équilatéral codé : trois côtés égaux. */
export function decrireTriangleEquilateral({ cote = 4, nom = "ABC", coder = true } = {}) {
  return {
    sommets: sommetsTriangle({ famille: "equilateral", cote }),
    nom,
    legende: `triangle équilatéral ${nom}`,
    codages: coder ? [{ type: "egalite", cotes: nomsCotes(nom).slice(0, 3), traits: 1 }] : [],
  };
}

/** Triangle isocèle codé : les deux côtés égaux. */
export function decrireTriangleIsocele({
  base = 4,
  sommetDeg = 40,
  nom = "ABC",
  coder = true,
} = {}) {
  return {
    sommets: sommetsTriangle({ famille: "isocele", base, sommetDeg }),
    nom,
    legende: `triangle isocèle ${nom} de sommet principal ${nom[2]}`,
    codages: coder
      ? [{ type: "egalite", cotes: [nom[1] + nom[2], nom[2] + nom[0]], traits: 1 }]
      : [],
  };
}

/** Triangle rectangle codé : l'angle droit marqué au premier sommet. */
export function decrireTriangleRectangle({
  cathetes = [4, 3],
  nom = "ABC",
  coder = true,
} = {}) {
  return {
    sommets: sommetsTriangle({ famille: "rectangle", cathetes }),
    nom,
    legende: `triangle ${nom} rectangle en ${nom[0]}`,
    codages: coder ? [{ type: "angleDroit", sommets: [nom[0]] }] : [],
  };
}

/** Triangle rectangle isocèle : angle droit + cathètes égales. */
export function decrireTriangleRectangleIsocele({
  cote = 4,
  nom = "ABC",
  coder = true,
} = {}) {
  return {
    sommets: sommetsTriangle({ famille: "rectangle-isocele", cote }),
    nom,
    legende: `triangle ${nom} rectangle isocèle en ${nom[0]}`,
    codages: coder
      ? [
          { type: "angleDroit", sommets: [nom[0]] },
          { type: "egalite", cotes: [nom[0] + nom[1], nom[0] + nom[2]], traits: 1 },
        ]
      : [],
  };
}

// ---------------------------------------------------------------------------
// Polygones
// ---------------------------------------------------------------------------

/** Polygone régulier codé : tous les côtés égaux. */
export function decrirePolygoneRegulier({
  nbCotes = 5,
  cote = 3,
  nom = null,
  coder = true,
} = {}) {
  const lettres = nom ?? "ABCDEFGHIJKL".slice(0, nbCotes);
  return {
    sommets: sommetsPolygoneRegulier({ nbCotes, cote }),
    nom: lettres,
    legende: `polygone régulier à ${nbCotes} côtés`,
    codages: coder ? [{ type: "egalite", cotes: nomsCotes(lettres), traits: 1 }] : [],
  };
}

// ---------------------------------------------------------------------------
// Cercle et disque (descriptions pour dessinerCercle)
// ---------------------------------------------------------------------------

/** Cercle : centre visible, rayon tracé et mesuré. */
export function decrireCercleUsuel({ rayon = 3, nomCentre = "O" } = {}) {
  return {
    rayon,
    nomCentre,
    points: [{ nom: "A", angleDeg: 40 }],
    visible: { centre: true, rayonVersDeg: "A", mesureRayon: true },
    legende: `cercle de centre ${nomCentre} et de rayon ${rayon} cm`,
  };
}

/** Disque : surface colorée, diamètre tracé et mesuré. */
export function decrireDisqueUsuel({ rayon = 3, nomCentre = "O" } = {}) {
  return {
    rayon,
    nomCentre,
    visible: {
      centre: true,
      disque: true,
      diametreVersDeg: 25,
      mesureDiametre: true,
    },
    legende: `disque de centre ${nomCentre} et de rayon ${rayon} cm`,
  };
}

/** Demi-cercle : l'arc supérieur et son diamètre. */
export function decrireDemiCercle({ rayon = 3, nomCentre = "O" } = {}) {
  return {
    rayon,
    nomCentre,
    visible: {
      cercle: false,
      centre: true,
      arcs: [{ deDeg: 0, aDeg: 180 }],
      diametreVersDeg: 0,
    },
    legende: `demi-cercle de centre ${nomCentre} et de rayon ${rayon} cm`,
  };
}

/** Pentagone irrégulier d'exemple (modifiable point par point). */
export function decrirePolygoneQuelconque({
  points = [[0, 0], [4, -1], [6, 2], [3, 5], [-1, 3]],
  nom = null,
} = {}) {
  const sommets = sommetsPolygone({ points });
  return {
    sommets,
    nom: nom ?? "ABCDEFGHIJKL".slice(0, sommets.length),
    legende: `polygone quelconque à ${sommets.length} côtés`,
    codages: [],
  };
}

// ---------------------------------------------------------------------------
// Le registre — ce que l'Atelier parcourt pour construire ses menus
// ---------------------------------------------------------------------------

const nombre = (cle, libelle, defaut, min, max, pas = 0.5) => ({
  cle,
  libelle,
  type: "nombre",
  defaut,
  min,
  max,
  pas,
});

export const FIGURES_USUELLES = {
  triangleQuelconque: {
    titre: "Triangle quelconque",
    categorie: "Triangles",
    genre: "polygone",
    decrire: decrireTriangle,
    parametres: [],
  },
  triangleEquilateral: {
    titre: "Triangle équilatéral",
    categorie: "Triangles",
    genre: "polygone",
    decrire: decrireTriangleEquilateral,
    parametres: [nombre("cote", "Côté", 4, 1, 10)],
  },
  triangleIsocele: {
    titre: "Triangle isocèle",
    categorie: "Triangles",
    genre: "polygone",
    decrire: decrireTriangleIsocele,
    parametres: [
      nombre("base", "Base", 4, 1, 10),
      nombre("sommetDeg", "Angle au sommet (°)", 40, 10, 170, 1),
    ],
  },
  triangleRectangle: {
    titre: "Triangle rectangle",
    categorie: "Triangles",
    genre: "polygone",
    decrire: ({ cathete1 = 4, cathete2 = 3, ...reste } = {}) =>
      decrireTriangleRectangle({ cathetes: [cathete1, cathete2], ...reste }),
    parametres: [
      nombre("cathete1", "Premier côté de l'angle droit", 4, 1, 10),
      nombre("cathete2", "Second côté de l'angle droit", 3, 1, 10),
    ],
  },
  triangleRectangleIsocele: {
    titre: "Triangle rectangle isocèle",
    categorie: "Triangles",
    genre: "polygone",
    decrire: decrireTriangleRectangleIsocele,
    parametres: [nombre("cote", "Cathète", 4, 1, 10)],
  },
  carre: {
    titre: "Carré",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireCarre,
    parametres: [nombre("cote", "Côté", 4, 1, 10)],
  },
  rectangle: {
    titre: "Rectangle",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireRectangle,
    parametres: [
      nombre("largeur", "Longueur", 6, 1, 12),
      nombre("hauteur", "Largeur", 4, 1, 12),
    ],
  },
  losange: {
    titre: "Losange",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireLosange,
    parametres: [
      nombre("cote", "Côté", 4, 1, 10),
      nombre("angleDeg", "Angle en A (°)", 65, 15, 165, 1),
    ],
  },
  parallelogramme: {
    titre: "Parallélogramme",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireParallelogramme,
    parametres: [
      nombre("base", "Base", 6, 1, 12),
      nombre("cote", "Côté", 3.5, 1, 10),
      nombre("angleDeg", "Angle en A (°)", 65, 15, 165, 1),
    ],
  },
  trapeze: {
    titre: "Trapèze",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireTrapeze,
    parametres: [
      nombre("grandeBase", "Grande base", 7, 2, 12),
      nombre("petiteBase", "Petite base", 4, 1, 10),
      nombre("hauteur", "Hauteur", 3, 1, 8),
      nombre("decalage", "Décalage de la petite base", 1, -3, 6),
    ],
  },
  trapezeRectangle: {
    titre: "Trapèze rectangle",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireTrapezeRectangle,
    parametres: [
      nombre("grandeBase", "Grande base", 7, 2, 12),
      nombre("petiteBase", "Petite base", 4, 1, 10),
      nombre("hauteur", "Hauteur", 3, 1, 8),
    ],
  },
  trapezeIsocele: {
    titre: "Trapèze isocèle",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireTrapezeIsocele,
    parametres: [
      nombre("grandeBase", "Grande base", 7, 2, 12),
      nombre("petiteBase", "Petite base", 4, 1, 10),
      nombre("hauteur", "Hauteur", 3, 1, 8),
    ],
  },
  cerfVolant: {
    titre: "Cerf-volant",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireCerfVolant,
    parametres: [
      nombre("diagonalePrincipale", "Diagonale principale", 6, 2, 12),
      nombre("diagonaleSecondaire", "Diagonale secondaire", 4, 1, 10),
      nombre("position", "Croisement (0 à 1)", 0.35, 0.1, 0.9, 0.05),
    ],
  },
  quadrilatereQuelconque: {
    titre: "Quadrilatère quelconque",
    categorie: "Quadrilatères",
    genre: "polygone",
    decrire: decrireQuadrilatere,
    parametres: [],
  },
  polygoneQuelconque: {
    titre: "Polygone quelconque",
    categorie: "Polygones",
    genre: "polygone",
    decrire: decrirePolygoneQuelconque,
    parametres: [],
  },
  pentagone: {
    titre: "Pentagone régulier",
    categorie: "Polygones",
    genre: "polygone",
    decrire: (options = {}) => decrirePolygoneRegulier({ nbCotes: 5, ...options }),
    parametres: [nombre("cote", "Côté", 3, 1, 8)],
  },
  hexagone: {
    titre: "Hexagone régulier",
    categorie: "Polygones",
    genre: "polygone",
    decrire: (options = {}) => decrirePolygoneRegulier({ nbCotes: 6, ...options }),
    parametres: [nombre("cote", "Côté", 3, 1, 8)],
  },
  polygoneRegulier: {
    titre: "Polygone régulier à n côtés",
    categorie: "Polygones",
    genre: "polygone",
    decrire: decrirePolygoneRegulier,
    parametres: [
      { cle: "nbCotes", libelle: "Nombre de côtés", type: "nombre", defaut: 8, min: 3, max: 12, pas: 1 },
      nombre("cote", "Côté", 3, 1, 8),
    ],
  },
  cercle: {
    titre: "Cercle",
    categorie: "Cercle et disque",
    genre: "cercle",
    decrire: decrireCercleUsuel,
    parametres: [nombre("rayon", "Rayon", 3, 0.5, 8)],
  },
  disque: {
    titre: "Disque",
    categorie: "Cercle et disque",
    genre: "cercle",
    decrire: decrireDisqueUsuel,
    parametres: [nombre("rayon", "Rayon", 3, 0.5, 8)],
  },
  demiCercle: {
    titre: "Demi-cercle",
    categorie: "Cercle et disque",
    genre: "cercle",
    decrire: decrireDemiCercle,
    parametres: [nombre("rayon", "Rayon", 3, 0.5, 8)],
  },
};

/** Les catégories dans l'ordre d'affichage de l'Atelier. */
export const CATEGORIES_FIGURES = [
  "Triangles",
  "Quadrilatères",
  "Polygones",
  "Cercle et disque",
];
