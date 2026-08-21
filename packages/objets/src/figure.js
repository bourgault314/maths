// Dessinateur de figures maths&go — version 1, STATUT BROUILLON.
//
// Une figure n'est pas un dessin : c'est une DESCRIPTION (sommets,
// éléments visibles, codages, styles) que ce module transforme en SVG
// autonome. Tout élément est désigné par son nom mathématique
// (« AB », « A », diagonale « AC »), jamais par une coordonnée.
//
// Conventions visuelles relevées dans les outils du site (AngleBarre) :
// lettres de sommets avec halo blanc, arcs d'angles en polyligne dense
// (jamais une commande d'arc SVG ambiguë), marque d'angle droit carrée,
// valeurs d'angles posées sur la bissectrice intérieure. Les secteurs
// sont calculés par le noyau géométrique : l'arc est du bon côté sous
// N'IMPORTE QUELLE rotation — c'est testé.
//
// Thème par défaut : « noir » (tout encre, prêt à imprimer). Le thème
// « couleur » reprend la palette AngleBarre (contour bleu, arcs de
// triangles bleu/orange/vert, angle droit rouge). Chaque élément reste
// colorable individuellement par-dessus le thème.

import { COULEURS_BARRES } from "../../charte/src/charte.js?v=44";
import {
  RAD,
  angleInterieurPolygone,
  argument,
  axesSymetrie,
  centroide,
  distance,
  distancePointSegment,
  intersectionSegments,
  milieu,
  piedPerpendiculaire,
  pointsArc,
  pointsRemarquablesTriangle,
  secteurAngulaire,
  transformer,
} from "./geometrie.js";

export const VERSION_FIGURE = 1;

const ENCRE = COULEURS_BARRES.encre; // #0f172a
const CONTOUR_COULEUR = "#1d4ed8"; // AngleBarre .triangleShape
const ANGLE_DROIT_COULEUR = "#ef4444"; // AngleBarre .rightAngleMark
export const COULEURS_ROLES = [
  COULEURS_BARRES.hachureCalcul, // bleu #3b82f6
  COULEURS_BARRES.hachureSuppression, // orange #f97316
  COULEURS_BARRES.hachureAjout, // vert #16a34a
];
const POLICE = `'Segoe UI', system-ui, sans-serif`;
const INSECABLE = "\u00A0"; // espace ins\u00E9cable entre valeur et unit\u00E9 (\u00A718)

// ---------------------------------------------------------------------------
// Formatage français (cahier des charges §18)
// ---------------------------------------------------------------------------

/** « 4,5 » — virgule française, au plus `decimales` chiffres, zéros inutiles retirés. */
export function formaterNombre(valeur, decimales = 2) {
  const arrondi = Number(valeur.toFixed(decimales));
  return String(arrondi).replace(".", ",");
}

/** « 4,5 cm » — espace insécable avant l'unité (rien si pas d'unité). */
export function formaterLongueur(valeur, unite = "") {
  const u = String(unite).trim();
  return u ? `${formaterNombre(valeur)}${INSECABLE}${u}` : formaterNombre(valeur);
}

/** « 38,5° » — pas d'espace avant le degré, arrondi au dixième. */
export function formaterAngle(valeurDeg) {
  return `${formaterNombre(valeurDeg, 1)}°`;
}

/** Neutralise tout HTML dans un texte destiné au SVG. */
export function echapper(texte) {
  return String(texte)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const px = (n) => (Math.round(n * 100) / 100).toString();

// ---------------------------------------------------------------------------
// Petites briques SVG
// ---------------------------------------------------------------------------

function ligne(p, q, { couleur, epaisseur = 3, pointilles = false }) {
  const dash = pointilles
    ? ` stroke-dasharray="${pointilles === "mixte" ? "12 5 3 5" : "8 6"}"`
    : "";
  return `<line x1="${px(p[0])}" y1="${px(p[1])}" x2="${px(q[0])}" y2="${px(q[1])}" stroke="${couleur}" stroke-width="${epaisseur}" stroke-linecap="round"${dash}/>`;
}

function polyligne(points, { couleur, epaisseur = 3, ferme = false }) {
  const balise = ferme ? "polygon" : "polyline";
  return `<${balise} points="${points.map((p) => `${px(p[0])},${px(p[1])}`).join(" ")}" fill="none" stroke="${couleur}" stroke-width="${epaisseur}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** La petite croix maths&go d'un point (orientée ×). */
function croix(p, { couleur, taille = 6, epaisseur = 2.5 }) {
  const t = taille / Math.SQRT2;
  return (
    ligne([p[0] - t, p[1] - t], [p[0] + t, p[1] + t], { couleur, epaisseur }) +
    ligne([p[0] - t, p[1] + t], [p[0] + t, p[1] - t], { couleur, epaisseur })
  );
}

/**
 * La marque d'un point SUR un segment : une petite graduation
 * perpendiculaire au segment (convention de Gwenaël — jamais une croix).
 */
function graduation(m, angleSegment, { couleur, taille = 7, epaisseur = 3 }) {
  const perpendiculaire = angleSegment + Math.PI / 2;
  return ligne(
    [m[0] + Math.cos(perpendiculaire) * taille, m[1] + Math.sin(perpendiculaire) * taille],
    [m[0] - Math.cos(perpendiculaire) * taille, m[1] - Math.sin(perpendiculaire) * taille],
    { couleur, epaisseur },
  );
}

function texte(contenu, [x, y], { couleur, taille = 16, graisse = 700, halo = 5 }) {
  return `<text x="${px(x)}" y="${px(y)}" font-family="${POLICE}" font-size="${taille}" font-weight="${graisse}" fill="${couleur}" text-anchor="middle" dominant-baseline="central" stroke="#ffffff" stroke-width="${halo}" paint-order="stroke" stroke-linejoin="round">${contenu}</text>`;
}

// ---------------------------------------------------------------------------
// Le contrat — description → SVG
// ---------------------------------------------------------------------------

/**
 * Dessine une figure polygonale décrite par son contrat.
 *
 * @param {object} description
 * @param {Array<[number,number]>} description.sommets — coordonnées
 *   mathématiques (y vers le haut), en unités réelles (cm par défaut)
 * @param {string} [description.nom] — une lettre majuscule par sommet (« ABCD »)
 * @param {object} [description.transform] — rotationDeg, miroirX, miroirY
 * @param {object} [description.visible] — éléments affichés :
 *   figure, sommets (croix), noms, angles (true ou lettres), mesuresAngles,
 *   mesuresCotes (true ou « AB »), diagonales (true ou « AC »), centre,
 *   axes, milieux (« AB »)
 * @param {object} [description.valeursCotes] — mesure imposée par côté
 * @param {object} [description.textesCotes] — texte imposé (« ? », « x »…)
 * @param {object} [description.textesAngles]
 * @param {string} [description.unite]
 * @param {Array<object>} [description.codages] — voir les types :
 *   egalite {cotes, traits}, paralleles {cotes, fleches},
 *   angleDroit {sommets}, anglesEgaux {sommets, arcs}, milieu {cote, traits}
 * @param {object} [description.styles] — theme « noir » | « couleur »,
 *   figure {couleur, epaisseur, pointilles, remplissage, opaciteRemplissage},
 *   cotes/sommets/angles/diagonales : réglages par élément
 * @param {object} [description.sortie] — taille (largeur px), marge
 * @param {string} [description.legende] — pour l'aria-label
 * @returns {string} balise <svg> autonome
 */
export function dessinerFigure(description = {}) {
  const {
    sommets: sommetsMaths,
    nom = null,
    transform = {},
    visible: visibleOptions = {},
    valeursCotes = {},
    textesCotes = {},
    textesAngles = {},
    unite = "cm",
    codages = [],
    styles = {},
    sortie = {},
    legende = null,
  } = description;

  if (!Array.isArray(sommetsMaths) || sommetsMaths.length < 3) {
    throw new RangeError("figure : au moins trois sommets attendus");
  }
  const n = sommetsMaths.length;
  const lettres = nom ?? "ABCDEFGHIJKL".slice(0, n);
  if (!/^[A-Z]+$/.test(lettres) || lettres.length !== n || new Set(lettres).size !== n) {
    throw new RangeError(
      `figure : le nom doit donner une lettre majuscule distincte par sommet (ici « ${lettres} » pour ${n} sommets)`,
    );
  }

  const visible = {
    figure: true,
    sommets: false,
    noms: true,
    angles: false,
    mesuresAngles: false,
    mesuresCotes: false,
    diagonales: false,
    mesuresDiagonales: false,
    centre: false,
    axes: false,
    milieux: false,
    // triangle seulement : droites et points remarquables
    hauteurs: false,
    medianes: false,
    mediatrices: false,
    bissectrices: false,
    cercleInscrit: false,
    cercleCirconscrit: false,
    centresRemarquables: false, // true ou liste parmi « G », « H », « O », « I »
    segmentDesMilieux: false,
    // quadrilatères et polygones
    hauteur: null, // { de: « C », vers: « AB », mesure: true }
    rayons: false,
    apotheme: false, // true ou nom d'un côté (« AB »)
    triangulation: false, // lettre du sommet d'où partent les diagonales
    ...visibleOptions,
  };
  const placements = description.placements ?? {};

  const theme = styles.theme ?? "noir";
  const enCouleur = theme === "couleur";
  const styleFigure = {
    couleur: enCouleur ? CONTOUR_COULEUR : ENCRE,
    epaisseur: 4,
    pointilles: false,
    remplissage: "none",
    opaciteRemplissage: 1,
    ...styles.figure,
  };

  // --- géométrie : transformation puis passage en coordonnées écran ---
  const marge = sortie.marge ?? 46;
  const taille = sortie.taille ?? 360;
  const transformes = transformer(sommetsMaths, transform);
  const xs = transformes.map((p) => p[0]);
  const ys = transformes.map((p) => p[1]);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const largeurMaths = Math.max(maxX - minX, 1e-9);
  const hauteurMaths = Math.max(maxY - minY, 1e-9);
  const echelle = (taille - 2 * marge) / Math.max(largeurMaths, hauteurMaths);
  // repère SVG : y vers le bas → on inverse y (les textes, eux, ne
  // seront jamais retournés : ils sont posés après coup, à l'horizontale)
  const points = transformes.map((p) => [
    marge + (p[0] - minX) * echelle,
    marge + (maxY - p[1]) * echelle,
  ]);
  const largeurTotale = 2 * marge + largeurMaths * echelle;
  const hauteurTotale = 2 * marge + hauteurMaths * echelle;
  const centre = centroide(points);

  // --- adressage sémantique ---
  const indexDe = (lettre) => {
    const i = lettres.indexOf(lettre);
    if (i === -1) {
      throw new RangeError(`figure : le sommet « ${lettre} » n'existe pas dans « ${lettres} »`);
    }
    return i;
  };
  const segmentDe = (nomSegment) => {
    if (!/^[A-Z]{2}$/.test(nomSegment)) {
      throw new RangeError(`figure : « ${nomSegment} » n'est pas un nom de segment (deux lettres)`);
    }
    return [points[indexDe(nomSegment[0])], points[indexDe(nomSegment[1])]];
  };
  const estCote = (nomSegment) => {
    const [i, j] = [indexDe(nomSegment[0]), indexDe(nomSegment[1])];
    return (i + 1) % n === j || (j + 1) % n === i;
  };
  const listeOuTout = (valeur, tout) =>
    valeur === true ? tout : Array.isArray(valeur) ? valeur : [];

  const tousCotes = lettres.split("").map((l, i) => l + lettres[(i + 1) % n]);
  const toutesDiagonales =
    n === 4 ? [lettres[0] + lettres[2], lettres[1] + lettres[3]] : [];

  const morceaux = [];

  // marque d'angle droit générique : petit carré construit sur les deux
  // vecteurs unitaires issus de `v`
  const marquePerpendiculaire = (v, dir1, dir2, cote, couleur, epaisseur = 3) => {
    const p1 = [v[0] + Math.cos(dir1) * cote, v[1] + Math.sin(dir1) * cote];
    const p3 = [v[0] + Math.cos(dir2) * cote, v[1] + Math.sin(dir2) * cote];
    const p2 = [p1[0] + Math.cos(dir2) * cote, p1[1] + Math.sin(dir2) * cote];
    return polyligne([p1, p2, p3], { couleur, epaisseur });
  };

  // --- remplissage (sous tout le reste) ---
  if (styleFigure.remplissage !== "none") {
    morceaux.push(
      `<polygon points="${points.map((p) => `${px(p[0])},${px(p[1])}`).join(" ")}" fill="${styleFigure.remplissage}" fill-opacity="${styleFigure.opaciteRemplissage}" stroke="none"/>`,
    );
  }

  // --- régions découpées par les diagonales (quadrilatères) ---
  if (styles.regions && n === 4) {
    const croisement = intersectionSegments(points[0], points[2], points[1], points[3]);
    if (croisement) {
      for (const [cote, remplissage] of Object.entries(styles.regions)) {
        const [p, q] = segmentDe(cote);
        morceaux.push(
          `<polygon points="${[p, q, croisement].map((s) => `${px(s[0])},${px(s[1])}`).join(" ")}" fill="${remplissage}" fill-opacity="0.55" stroke="none"/>`,
        );
      }
    }
  }

  // --- axes de symétrie (trait mixte, prolongés au-delà de la figure) ---
  if (visible.axes) {
    const rayonFigure = Math.max(...points.map((p) => distance(p, centre)));
    for (const [a, b] of axesSymetrie(points)) {
      const angle = argument(a, b);
      const c = milieu(a, b);
      const portee = rayonFigure + Math.min(marge - 6, 28);
      const p1 = [c[0] - Math.cos(angle) * portee, c[1] - Math.sin(angle) * portee];
      const p2 = [c[0] + Math.cos(angle) * portee, c[1] + Math.sin(angle) * portee];
      morceaux.push(
        ligne(p1, p2, {
          couleur: styles.axes?.couleur ?? (enCouleur ? COULEURS_BARRES.attenue : ENCRE),
          epaisseur: 2,
          pointilles: "mixte",
        }),
      );
    }
  }

  // --- diagonales ---
  const diagonalesVisibles = listeOuTout(visible.diagonales, toutesDiagonales);
  for (const d of diagonalesVisibles) {
    const [p, q] = segmentDe(d);
    const style = {
      couleur: styleFigure.couleur,
      epaisseur: 2.5,
      pointilles: false,
      ...styles.diagonales?.[d],
    };
    morceaux.push(ligne(p, q, style));
  }

  // --- rayons, apothème et triangulation (polygones) ---
  if (visible.rayons) {
    for (const lettre of listeOuTout(visible.rayons, lettres.split(""))) {
      morceaux.push(
        ligne(centre, points[indexDe(lettre)], {
          couleur: styles.rayons?.couleur ?? styleFigure.couleur,
          epaisseur: 2,
          pointilles: styles.rayons?.pointilles ?? false,
        }),
      );
    }
  }
  if (visible.apotheme) {
    const coteApotheme = visible.apotheme === true ? tousCotes[0] : visible.apotheme;
    const [p, q] = segmentDe(coteApotheme);
    const pied = milieu(p, q);
    morceaux.push(
      ligne(centre, pied, {
        couleur: styles.apotheme?.couleur ?? styleFigure.couleur,
        epaisseur: 2,
        pointilles: true,
      }),
    );
    morceaux.push(
      marquePerpendiculaire(
        pied,
        argument(pied, centre),
        argument(pied, p),
        9,
        styles.apotheme?.couleur ?? styleFigure.couleur,
        2.5,
      ),
    );
  }
  if (visible.triangulation) {
    const i = indexDe(visible.triangulation === true ? lettres[0] : visible.triangulation);
    for (let j = 0; j < n; j++) {
      if (j === i || (j + 1) % n === i || (i + 1) % n === j) continue;
      morceaux.push(
        ligne(points[i], points[j], {
          couleur: styles.triangulation?.couleur ?? styleFigure.couleur,
          epaisseur: 2,
          pointilles: true,
        }),
      );
    }
  }

  // --- centre (intersection des diagonales d'un quadrilatère) ---
  let pointCentre = null;
  if (visible.centre) {
    pointCentre =
      n === 4
        ? intersectionSegments(points[0], points[2], points[1], points[3])
        : centre;
    if (pointCentre) {
      const couleurCentre = styles.centre?.couleur ?? styleFigure.couleur;
      morceaux.push(croix(pointCentre, { couleur: couleurCentre }));
      const nomCentre = visible.nomCentre ?? "O";
      if (nomCentre) {
        morceaux.push(
          texte(echapper(nomCentre), [pointCentre[0] + 16, pointCentre[1] - 12], {
            couleur: couleurCentre,
            taille: 17,
          }),
        );
      }
    }
  }

  // --- hauteur générique : perpendiculaire abaissée d'un sommet sur un côté ---
  if (visible.hauteur) {
    const { de, vers, mesure = false } = visible.hauteur;
    const sommetH = points[indexDe(de)];
    const [p, q] = segmentDe(vers);
    const pied = piedPerpendiculaire(sommetH, p, q);
    const couleurH = styles.hauteur?.couleur ?? (enCouleur ? COULEURS_BARRES.attenue : ENCRE);
    // si le pied tombe hors du côté, prolonger le côté en pointillé fin
    const t =
      ((pied[0] - p[0]) * (q[0] - p[0]) + (pied[1] - p[1]) * (q[1] - p[1])) /
      Math.max(distance(p, q) ** 2, 1e-12);
    if (t < 0) morceaux.push(ligne(p, pied, { couleur: couleurH, epaisseur: 1.5, pointilles: true }));
    if (t > 1) morceaux.push(ligne(q, pied, { couleur: couleurH, epaisseur: 1.5, pointilles: true }));
    morceaux.push(ligne(sommetH, pied, { couleur: couleurH, epaisseur: 2.5, pointilles: true }));
    morceaux.push(
      marquePerpendiculaire(pied, argument(pied, sommetH), t < 0.5 ? argument(p, q) : argument(q, p), 9, couleurH, 2.5),
    );
    if (mesure) {
      const m = milieu(sommetH, pied);
      const perpendiculaire = argument(sommetH, pied) + Math.PI / 2;
      morceaux.push(
        texte(
          echapper(formaterLongueur(distance(sommetH, pied) / echelle, unite)),
          [m[0] + Math.cos(perpendiculaire) * 17, m[1] + Math.sin(perpendiculaire) * 17],
          { couleur: couleurH, taille: 14, halo: 4 },
        ),
      );
    }
  }

  // --- droites et points remarquables (triangles) ---
  const besoinRemarquables =
    visible.hauteurs || visible.medianes || visible.mediatrices ||
    visible.bissectrices || visible.cercleInscrit || visible.cercleCirconscrit ||
    visible.centresRemarquables || visible.segmentDesMilieux;
  if (besoinRemarquables) {
    if (n !== 3) {
      throw new RangeError("figure : les droites remarquables ne concernent que les triangles");
    }
    const R = pointsRemarquablesTriangle(points);
    const rayonFigure = Math.max(...points.map((p) => distance(p, centre)));
    const couleurDe = (type) =>
      styles[type]?.couleur ?? (enCouleur ? COULEURS_BARRES.attenue : ENCRE);

    for (const lettre of listeOuTout(visible.hauteurs, lettres.split(""))) {
      const i = indexDe(lettre);
      const pied = R.piedsHauteurs[i];
      const [p, q] = [points[(i + 1) % 3], points[(i + 2) % 3]];
      const couleurH = couleurDe("hauteurs");
      const t =
        ((pied[0] - p[0]) * (q[0] - p[0]) + (pied[1] - p[1]) * (q[1] - p[1])) /
        Math.max(distance(p, q) ** 2, 1e-12);
      if (t < 0) morceaux.push(ligne(p, pied, { couleur: couleurH, epaisseur: 1.5, pointilles: true }));
      if (t > 1) morceaux.push(ligne(q, pied, { couleur: couleurH, epaisseur: 1.5, pointilles: true }));
      morceaux.push(ligne(points[i], pied, { couleur: couleurH, epaisseur: 2.5, pointilles: true }));
      morceaux.push(
        marquePerpendiculaire(pied, argument(pied, points[i]), t < 0.5 ? argument(p, q) : argument(q, p), 9, couleurH, 2.5),
      );
    }

    for (const lettre of listeOuTout(visible.medianes, lettres.split(""))) {
      const i = indexDe(lettre);
      morceaux.push(
        ligne(points[i], R.milieux[i], { couleur: couleurDe("medianes"), epaisseur: 2.5, pointilles: true }),
      );
      morceaux.push(
        graduation(R.milieux[i], argument(points[(i + 1) % 3], points[(i + 2) % 3]), {
          couleur: couleurDe("medianes"),
        }),
      );
    }

    for (const lettre of listeOuTout(visible.mediatrices, lettres.split(""))) {
      const i = indexDe(lettre);
      const m = R.milieux[i];
      const [p, q] = [points[(i + 1) % 3], points[(i + 2) % 3]];
      const perpendiculaire = argument(p, q) + Math.PI / 2;
      const portee = rayonFigure * 0.95;
      const couleurM = couleurDe("mediatrices");
      morceaux.push(
        ligne(
          [m[0] - Math.cos(perpendiculaire) * portee, m[1] - Math.sin(perpendiculaire) * portee],
          [m[0] + Math.cos(perpendiculaire) * portee, m[1] + Math.sin(perpendiculaire) * portee],
          { couleur: couleurM, epaisseur: 2, pointilles: "mixte" },
        ),
      );
      morceaux.push(marquePerpendiculaire(m, perpendiculaire, argument(m, q), 8, couleurM, 2.5));
    }

    for (const lettre of listeOuTout(visible.bissectrices, lettres.split(""))) {
      const i = indexDe(lettre);
      morceaux.push(
        ligne(points[i], R.piedsBissectrices[i], {
          couleur: couleurDe("bissectrices"),
          epaisseur: 2.5,
          pointilles: true,
        }),
      );
    }

    if (visible.segmentDesMilieux) {
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3;
        morceaux.push(
          ligne(R.milieux[i], R.milieux[j], { couleur: couleurDe("segmentDesMilieux"), epaisseur: 2.5 }),
        );
        morceaux.push(
          graduation(R.milieux[i], argument(points[(i + 1) % 3], points[(i + 2) % 3]), {
            couleur: couleurDe("segmentDesMilieux"),
          }),
        );
      }
    }

    const cercleRemarquable = (centreC, rayonC, type) =>
      `<circle cx="${px(centreC[0])}" cy="${px(centreC[1])}" r="${px(rayonC)}" fill="none" stroke="${couleurDe(type)}" stroke-width="2.5"/>`;
    if (visible.cercleInscrit) {
      morceaux.push(cercleRemarquable(R.centreInscrit, R.rayonInscrit, "cercleInscrit"));
    }
    if (visible.cercleCirconscrit) {
      morceaux.push(cercleRemarquable(R.centreCirconscrit, R.rayonCirconscrit, "cercleCirconscrit"));
    }

    const centres = { G: R.centreGravite, H: R.orthocentre, O: R.centreCirconscrit, I: R.centreInscrit };
    for (const cle of listeOuTout(visible.centresRemarquables, ["G", "H", "O", "I"])) {
      const position = centres[cle];
      if (!position) {
        throw new RangeError(`figure : centre remarquable inconnu « ${cle} » (G, H, O ou I)`);
      }
      morceaux.push(croix(position, { couleur: couleurDe("centresRemarquables") }));
      morceaux.push(
        texte(cle, [position[0] + 13, position[1] - 11], {
          couleur: couleurDe("centresRemarquables"),
          taille: 15,
          halo: 4,
        }),
      );
    }
  }

  // --- angles : arcs (polyligne dense) + marque d'angle droit ---
  const secteurs = points.map((_, i) => angleInterieurPolygone(points, i));
  const rayonArc = (i) => {
    const v = points[i];
    const voisins = [points[(i + 1) % n], points[(i - 1 + n) % n]];
    // plafonné aussi par la distance aux côtés NON adjacents : dans une
    // figure très aplatie, l'arc ne doit jamais transpercer un côté
    let gardeFou = Infinity;
    for (let j = 0; j < n; j++) {
      if (j === i || (j + 1) % n === i) continue;
      gardeFou = Math.min(
        gardeFou,
        distancePointSegment(v, points[j], points[(j + 1) % n]) * 0.75,
      );
    }
    return Math.min(30, gardeFou, ...voisins.map((q) => distance(v, q) * 0.32));
  };
  const couleurAngle = (i) => {
    const perso = styles.angles?.[lettres[i]]?.couleur;
    if (perso) return perso;
    if (enCouleur && n === 3) return COULEURS_ROLES[i]; // convention AngleBarre
    return enCouleur ? CONTOUR_COULEUR : ENCRE;
  };
  const marqueAngleDroit = (i, couleur) => {
    const v = points[i];
    const dir1 = argument(v, points[(i + 1) % n]);
    const dir2 = argument(v, points[(i - 1 + n) % n]);
    return marquePerpendiculaire(v, dir1, dir2, rayonArc(i) * 0.7, couleur, 3.5);
  };

  const anglesVisibles = listeOuTout(visible.angles, lettres.split(""));
  for (const lettre of anglesVisibles) {
    const i = indexDe(lettre);
    const { depart, delta, mesureDeg } = secteurs[i];
    const couleur = enCouleur && Math.abs(mesureDeg - 90) < 1e-6
      ? styles.angles?.[lettre]?.couleur ?? ANGLE_DROIT_COULEUR
      : couleurAngle(i);
    if (Math.abs(mesureDeg - 90) < 1e-6) {
      morceaux.push(marqueAngleDroit(i, couleur));
    } else {
      morceaux.push(
        polyligne(pointsArc(points[i], rayonArc(i), depart, delta), {
          couleur,
          epaisseur: 4,
        }),
      );
    }
  }

  // --- codages d'angles égaux (arcs concentriques, SOUS le contour) ---
  const groupesEgaux = codages.filter((c) => c.type === "anglesEgaux");
  groupesEgaux.forEach((codage, groupe) => {
    const arcs = codage.arcs ?? groupe + 1;
    const couleur =
      codage.couleur ?? (enCouleur ? COULEURS_ROLES[groupe % 3] : ENCRE);
    for (const lettre of codage.sommets) {
      const i = indexDe(lettre);
      const { depart, delta } = secteurs[i];
      const base = rayonArc(i);
      for (let k = 0; k < arcs; k++) {
        morceaux.push(
          polyligne(pointsArc(points[i], base - 5 * k, depart, delta), {
            couleur,
            epaisseur: 3,
          }),
        );
      }
    }
  });

  // --- marques d'angle droit codées (elles aussi sous le contour) ---
  for (const codage of codages.filter((c) => c.type === "angleDroit")) {
    for (const lettre of codage.sommets) {
      morceaux.push(
        marqueAngleDroit(
          indexDe(lettre),
          codage.couleur ?? (enCouleur ? ANGLE_DROIT_COULEUR : ENCRE),
        ),
      );
    }
  }

  // --- le contour, côté par côté (style individuel possible) ---
  // Dessiné APRÈS les arcs et marques d'angles : quand un arc arrive
  // sur un côté, c'est le trait de la figure qui domine (retour de
  // Gwenaël sur la photo du 55° : le vert ne doit jamais recouvrir le
  // bleu du triangle).
  if (visible.figure) {
    tousCotes.forEach((c) => {
      const [p, q] = segmentDe(c);
      const style = {
        couleur: styleFigure.couleur,
        epaisseur: styleFigure.epaisseur,
        pointilles: styleFigure.pointilles,
        ...(styles.cotes?.[c] ?? styles.cotes?.[c[1] + c[0]]),
      };
      morceaux.push(ligne(p, q, style));
    });
  }

  // --- mesures d'angles, posées sur la bissectrice intérieure ---
  const mesuresAnglesVisibles = listeOuTout(visible.mesuresAngles, lettres.split(""));
  for (const lettre of mesuresAnglesVisibles) {
    const i = indexDe(lettre);
    const { depart, delta, mesureDeg } = secteurs[i];
    if (Math.abs(mesureDeg - 90) < 1e-6 && !(lettre in textesAngles)) continue;
    const bissectrice = depart + delta / 2;
    // plafonnée : sur une petite figure, l'étiquette ne dépasse jamais
    // 60 % du chemin vers le centre (photo de Gwenaël : collisions)
    const r = Math.min(rayonArc(i) + 19, distance(points[i], centre) * 0.6);
    const position = [
      points[i][0] + Math.cos(bissectrice) * r,
      points[i][1] + Math.sin(bissectrice) * r,
    ];
    const contenu = lettre in textesAngles
      ? echapper(textesAngles[lettre])
      : formaterAngle(mesureDeg);
    const impose = placements.angles?.[lettre];
    morceaux.push(
      texte(
        contenu,
        impose ? [points[i][0] + impose[0], points[i][1] + impose[1]] : position,
        { couleur: couleurAngle(i), taille: 15, halo: 4 },
      ),
    );
  }

  for (const codage of codages) {
    const couleurCodage =
      codage.couleur ?? (enCouleur ? CONTOUR_COULEUR : ENCRE);
    if (codage.type === "egalite" || codage.type === "milieu") {
      // petits traits perpendiculaires, centrés — sur des côtés entiers,
      // des diagonales, ou les deux moitiés d'un côté (codage milieu)
      const traits = codage.traits ?? 1;
      const segments =
        codage.type === "milieu"
          ? (() => {
              const [p, q] = segmentDe(codage.cote);
              const m = milieu(p, q);
              return [[p, m], [m, q]];
            })()
          : codage.cotes.map((c) => segmentDe(c));
      for (const [p, q] of segments) {
        const angle = argument(p, q);
        const m = milieu(p, q);
        const perpendiculaire = angle + Math.PI / 2;
        if (codage.motif === "rond") {
          // le petit cercle, autre codage d'égalité du collège
          morceaux.push(
            `<circle cx="${px(m[0])}" cy="${px(m[1])}" r="5" fill="none" stroke="${couleurCodage}" stroke-width="2.5"/>`,
          );
          continue;
        }
        for (let k = 0; k < traits; k++) {
          const d = (k - (traits - 1) / 2) * 6;
          const c = [m[0] + Math.cos(angle) * d, m[1] + Math.sin(angle) * d];
          morceaux.push(
            ligne(
              [c[0] + Math.cos(perpendiculaire) * 7, c[1] + Math.sin(perpendiculaire) * 7],
              [c[0] - Math.cos(perpendiculaire) * 7, c[1] - Math.sin(perpendiculaire) * 7],
              { couleur: couleurCodage, epaisseur: 3 },
            ),
          );
        }
      }
      if (codage.type === "milieu") {
        const [p, q] = segmentDe(codage.cote);
        morceaux.push(graduation(milieu(p, q), argument(p, q), { couleur: couleurCodage }));
      }
    } else if (codage.type === "paralleles") {
      // chevrons alignés sur chaque côté, à 38 % pour laisser le milieu
      // aux traits d'égalité
      const fleches = codage.fleches ?? 1;
      for (const c of codage.cotes) {
        const [p, q] = segmentDe(c);
        const angle = argument(p, q);
        const base = [
          p[0] + (q[0] - p[0]) * 0.38,
          p[1] + (q[1] - p[1]) * 0.38,
        ];
        for (let k = 0; k < fleches; k++) {
          const d = k * 9;
          const pointe = [base[0] + Math.cos(angle) * d, base[1] + Math.sin(angle) * d];
          for (const signe of [1, -1]) {
            const branche = angle + Math.PI + (signe * Math.PI) / 4.5;
            morceaux.push(
              ligne(
                pointe,
                [pointe[0] + Math.cos(branche) * 9, pointe[1] + Math.sin(branche) * 9],
                { couleur: couleurCodage, epaisseur: 3 },
              ),
            );
          }
        }
      }
    } else if (codage.type !== "anglesEgaux" && codage.type !== "angleDroit") {
      // anglesEgaux et angleDroit sont déjà dessinés, sous le contour
      throw new RangeError(`figure : codage inconnu « ${codage.type} »`);
    }
  }

  // --- milieux visibles (croix seule) ---
  for (const c of listeOuTout(visible.milieux, tousCotes)) {
    const [p, q] = segmentDe(c);
    morceaux.push(graduation(milieu(p, q), argument(p, q), { couleur: styleFigure.couleur }));
  }

  // --- mesures des côtés, posées sur la normale extérieure ---
  const mesuresCotesVisibles = listeOuTout(visible.mesuresCotes, tousCotes);
  for (const c of mesuresCotesVisibles) {
    const [p, q] = segmentDe(c);
    const m = milieu(p, q);
    const versExterieur = argument(centre, m);
    const cle = c in textesCotes || c in valeursCotes ? c : c[1] + c[0];
    const contenu =
      cle in textesCotes
        ? echapper(textesCotes[cle])
        : echapper(
            formaterLongueur(
              cle in valeursCotes ? valeursCotes[cle] : distance(p, q) / echelle,
              unite,
            ),
          );
    const impose = placements.cotes?.[c] ?? placements.cotes?.[c[1] + c[0]];
    const position = impose
      ? [m[0] + impose[0], m[1] + impose[1]]
      : [m[0] + Math.cos(versExterieur) * 14, m[1] + Math.sin(versExterieur) * 14];
    morceaux.push(
      texte(contenu, position, {
        couleur: styles.cotes?.[c]?.couleur ?? ENCRE,
        taille: 15,
        halo: 4,
      }),
    );
  }

  // --- mesures des diagonales ---
  for (const d of listeOuTout(visible.mesuresDiagonales, toutesDiagonales)) {
    const [p, q] = segmentDe(d);
    const m = milieu(p, q);
    const perpendiculaire = argument(p, q) + Math.PI / 2;
    const cle = d in textesCotes || d in valeursCotes ? d : d[1] + d[0];
    const contenu =
      cle in textesCotes
        ? echapper(textesCotes[cle])
        : echapper(
            formaterLongueur(
              cle in valeursCotes ? valeursCotes[cle] : distance(p, q) / echelle,
              unite,
            ),
          );
    const impose = placements.cotes?.[d] ?? placements.cotes?.[d[1] + d[0]];
    morceaux.push(
      texte(
        contenu,
        impose
          ? [m[0] + impose[0], m[1] + impose[1]]
          : [m[0] + Math.cos(perpendiculaire) * 16, m[1] + Math.sin(perpendiculaire) * 16],
        { couleur: styles.diagonales?.[d]?.couleur ?? ENCRE, taille: 14, halo: 4 },
      ),
    );
  }

  // --- croix des sommets ---
  for (const lettre of listeOuTout(visible.sommets, lettres.split(""))) {
    const i = indexDe(lettre);
    morceaux.push(
      croix(points[i], {
        couleur: styles.sommets?.[lettre]?.couleur ?? styleFigure.couleur,
      }),
    );
  }

  // --- noms des sommets, sur la bissectrice extérieure (convention AngleBarre) ---
  if (visible.noms) {
    for (let i = 0; i < n; i++) {
      const { depart, delta } = secteurs[i];
      const bissectriceExterieure = depart + delta / 2 + Math.PI;
      const impose = placements.noms?.[lettres[i]];
      const position = impose
        ? [points[i][0] + impose[0], points[i][1] + impose[1]]
        : [
            points[i][0] + Math.cos(bissectriceExterieure) * 20,
            points[i][1] + Math.sin(bissectriceExterieure) * 20,
          ];
      morceaux.push(
        texte(lettres[i], position, {
          couleur:
            styles.sommets?.[lettres[i]]?.couleur ??
            (enCouleur ? CONTOUR_COULEUR : ENCRE),
          taille: 20,
          graisse: 700,
          halo: 6,
        }),
      );
    }
  }

  const ariaLabel = echapper(
    legende ??
      `${{ 3: "triangle", 4: "quadrilatère", 5: "pentagone", 6: "hexagone" }[n] ?? `polygone à ${n} côtés`} ${lettres}`,
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px(largeurTotale)} ${px(hauteurTotale)}" width="${px(taille)}" height="${px((taille * hauteurTotale) / largeurTotale)}" role="img" aria-label="${ariaLabel}">` +
    morceaux.join("") +
    "</svg>"
  );
}

// ---------------------------------------------------------------------------
// Cercle et disque
// ---------------------------------------------------------------------------

/**
 * Dessine un cercle (ou un disque) et ses éléments : centre, points
 * nommés sur le cercle, rayon, diamètre, mesures.
 *
 * Règles du cahier des charges : le diamètre passe EXACTEMENT par le
 * centre, tout rayon affiché a EXACTEMENT la longueur du rayon.
 *
 * @param {object} description
 * @param {number} description.rayon — en unités réelles (cm par défaut)
 * @param {string} [description.nomCentre]
 * @param {Array<{nom: string, angleDeg: number}>} [description.points]
 * @param {object} [description.visible] — centre, disque,
 *   rayonVersDeg (angle en degrés ou nom d'un point), diametreVersDeg,
 *   mesureRayon, mesureDiametre
 * @param {object} [description.styles] — theme, cercle {couleur,
 *   epaisseur, pointilles}, disque {remplissage, opacite}, rayon/diametre
 * @param {object} [description.sortie] — taille
 * @returns {string} balise <svg> autonome
 */
export function dessinerCercle(description = {}) {
  const {
    rayon,
    unite = "cm",
    nomCentre = "O",
    points: pointsNommes = [],
    visible: visibleOptions = {},
    styles = {},
    sortie = {},
    legende = null,
  } = description;
  if (!(rayon > 0) || !Number.isFinite(rayon)) {
    throw new RangeError("cercle : le rayon doit être un nombre strictement positif");
  }
  const visible = {
    cercle: true, // le cercle complet (false : n'afficher que des arcs)
    centre: true,
    disque: false,
    rayonVersDeg: null,
    rayonsVersDeg: [], // plusieurs rayons à la fois
    diametreVersDeg: null,
    mesureRayon: false,
    mesureDiametre: false,
    cordes: [], // [{ de, a, pointilles?, mesure? }] — de/a : degrés ou nom de point
    arcs: [], // [{ deDeg, aDeg }] — parcourus dans le sens trigonométrique
    secteur: null, // { deDeg, aDeg } — secteur angulaire au centre, colorié
    tangente: null, // { en } — degrés ou nom de point ; perpendiculaire au rayon
    ...visibleOptions,
  };
  const enCouleur = (styles.theme ?? "noir") === "couleur";
  const couleurCercle = styles.cercle?.couleur ?? (enCouleur ? CONTOUR_COULEUR : ENCRE);

  const taille = sortie.taille ?? 320;
  const marge = sortie.marge ?? 42;
  const rayonPx = taille / 2 - marge;
  const echelle = rayonPx / rayon;
  const c = [taille / 2, taille / 2];

  const degresDe = (valeur) => {
    if (typeof valeur === "number") return valeur;
    const point = pointsNommes.find((p) => p.nom === valeur);
    if (!point) {
      throw new RangeError(`cercle : le point « ${valeur} » n'est pas défini`);
    }
    return point.angleDeg;
  };
  // angles mathématiques (sens trigonométrique) → angles écran (y en bas)
  const angleDe = (valeur) => -degresDe(valeur) * RAD;
  // balayage écran couvrant le secteur trigonométrique [deDeg, aDeg]
  const normaliserDelta = (aDeg, deDeg) => {
    const brut = (((degresDe(aDeg) - degresDe(deDeg)) % 360) + 360) % 360;
    return (brut === 0 ? 360 : brut) * RAD;
  };
  const surCercle = (angleEcran) => [
    c[0] + Math.cos(angleEcran) * rayonPx,
    c[1] + Math.sin(angleEcran) * rayonPx,
  ];

  const morceaux = [];
  if (visible.disque) {
    morceaux.push(
      `<circle cx="${px(c[0])}" cy="${px(c[1])}" r="${px(rayonPx)}" fill="${styles.disque?.remplissage ?? (enCouleur ? "#dbeafe" : "#e2e8f0")}" fill-opacity="${styles.disque?.opacite ?? 0.8}" stroke="none"/>`,
    );
  }
  // secteur angulaire colorié (sous les traits)
  if (visible.secteur) {
    const depart = angleDe(visible.secteur.aDeg);
    const delta = normaliserDelta(visible.secteur.aDeg, visible.secteur.deDeg);
    const pointsSecteur = [c, ...pointsArc(c, rayonPx, depart, delta)];
    morceaux.push(
      `<polygon points="${pointsSecteur.map((p) => `${px(p[0])},${px(p[1])}`).join(" ")}" fill="${styles.secteur?.remplissage ?? (enCouleur ? "#dbeafe" : "#e2e8f0")}" fill-opacity="${styles.secteur?.opacite ?? 0.8}" stroke="none"/>`,
    );
  }

  if (visible.cercle) {
    const dashCercle = styles.cercle?.pointilles ? ` stroke-dasharray="8 6"` : "";
    morceaux.push(
      `<circle cx="${px(c[0])}" cy="${px(c[1])}" r="${px(rayonPx)}" fill="none" stroke="${couleurCercle}" stroke-width="${styles.cercle?.epaisseur ?? 4}"${dashCercle}/>`,
    );
  }

  // arcs de cercle (parcourus dans le sens trigonométrique de deDeg à aDeg)
  for (const arc of visible.arcs) {
    morceaux.push(
      polyligne(pointsArc(c, rayonPx, angleDe(arc.aDeg), normaliserDelta(arc.aDeg, arc.deDeg)), {
        couleur: arc.couleur ?? couleurCercle,
        epaisseur: arc.epaisseur ?? 4,
      }),
    );
  }

  // cordes : segments entre deux points du cercle
  for (const corde of visible.cordes) {
    const p1 = surCercle(angleDe(corde.de));
    const p2 = surCercle(angleDe(corde.a));
    morceaux.push(
      ligne(p1, p2, {
        couleur: corde.couleur ?? couleurCercle,
        epaisseur: 3,
        pointilles: corde.pointilles ?? false,
      }),
    );
    if (corde.mesure) {
      const m = milieu(p1, p2);
      const perpendiculaire = argument(p1, p2) + Math.PI / 2;
      morceaux.push(
        texte(
          echapper(formaterLongueur(distance(p1, p2) / echelle, unite)),
          [m[0] + Math.cos(perpendiculaire) * 15, m[1] + Math.sin(perpendiculaire) * 15],
          { couleur: corde.couleur ?? ENCRE, taille: 14, halo: 4 },
        ),
      );
    }
  }

  // tangente : perpendiculaire au rayon au point de tangence — par
  // CONSTRUCTION, jamais à l'œil (règle du cahier des charges)
  if (visible.tangente) {
    const angle = angleDe(visible.tangente.en);
    const contact = surCercle(angle);
    const direction = angle + Math.PI / 2;
    const portee = visible.tangente.longueur
      ? (visible.tangente.longueur * echelle) / 2
      : rayonPx * 0.85;
    const couleurT = styles.tangente?.couleur ?? couleurCercle;
    morceaux.push(
      ligne(
        [contact[0] - Math.cos(direction) * portee, contact[1] - Math.sin(direction) * portee],
        [contact[0] + Math.cos(direction) * portee, contact[1] + Math.sin(direction) * portee],
        { couleur: couleurT, epaisseur: 3 },
      ),
    );
    // rayon jusqu'au point de tangence + marque d'angle droit
    morceaux.push(ligne(c, contact, { couleur: couleurT, epaisseur: 2.5, pointilles: true }));
    morceaux.push(
      polyligne(
        (() => {
          const s = 9;
          const p1 = [contact[0] + Math.cos(angle + Math.PI) * s, contact[1] + Math.sin(angle + Math.PI) * s];
          const p3 = [contact[0] + Math.cos(direction) * s, contact[1] + Math.sin(direction) * s];
          const p2 = [p1[0] + Math.cos(direction) * s, p1[1] + Math.sin(direction) * s];
          return [p1, p2, p3];
        })(),
        { couleur: couleurT, epaisseur: 2.5 },
      ),
    );
  }

  if (visible.diametreVersDeg !== null) {
    const angle = angleDe(visible.diametreVersDeg);
    const p1 = surCercle(angle);
    const p2 = surCercle(angle + Math.PI);
    const style = {
      couleur: styles.diametre?.couleur ?? couleurCercle,
      epaisseur: 3,
      pointilles: styles.diametre?.pointilles ?? false,
    };
    morceaux.push(ligne(p1, p2, style));
    if (visible.mesureDiametre) {
      const perpendiculaire = angle + Math.PI / 2;
      const position = [
        c[0] + Math.cos(perpendiculaire) * 18,
        c[1] + Math.sin(perpendiculaire) * 18,
      ];
      morceaux.push(
        texte(echapper(formaterLongueur(2 * rayon, unite)), position, {
          couleur: style.couleur,
          taille: 15,
          halo: 4,
        }),
      );
    }
  }

  const tousRayons = [
    ...(visible.rayonVersDeg !== null ? [visible.rayonVersDeg] : []),
    ...visible.rayonsVersDeg,
  ];
  tousRayons.forEach((vers, rang) => {
    const angle = angleDe(vers);
    const extremite = surCercle(angle);
    const style = {
      couleur: styles.rayon?.couleur ?? couleurCercle,
      epaisseur: 3,
      pointilles: styles.rayon?.pointilles ?? false,
    };
    morceaux.push(ligne(c, extremite, style));
    if (visible.mesureRayon && rang === 0) {
      const m = milieu(c, extremite);
      const perpendiculaire = angle - Math.PI / 2;
      morceaux.push(
        texte(
          echapper(formaterLongueur(rayon, unite)),
          [m[0] + Math.cos(perpendiculaire) * 16, m[1] + Math.sin(perpendiculaire) * 16],
          { couleur: style.couleur, taille: 15, halo: 4 },
        ),
      );
    }
  });

  for (const point of pointsNommes) {
    const p = surCercle(-point.angleDeg * RAD);
    morceaux.push(croix(p, { couleur: couleurCercle }));
    const dehors = argument(c, p);
    morceaux.push(
      texte(echapper(point.nom), [p[0] + Math.cos(dehors) * 18, p[1] + Math.sin(dehors) * 18], {
        couleur: enCouleur ? CONTOUR_COULEUR : ENCRE,
        taille: 18,
        halo: 6,
      }),
    );
  }

  if (visible.centre) {
    morceaux.push(croix(c, { couleur: styles.centre?.couleur ?? couleurCercle }));
    if (nomCentre) {
      morceaux.push(
        texte(echapper(nomCentre), [c[0] + 14, c[1] - 13], {
          couleur: enCouleur ? CONTOUR_COULEUR : ENCRE,
          taille: 17,
          halo: 5,
        }),
      );
    }
  }

  const ariaLabel = echapper(
    legende ?? `cercle de centre ${nomCentre} et de rayon ${formaterLongueur(rayon, unite)}`,
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px(taille)} ${px(taille)}" width="${px(taille)}" height="${px(taille)}" role="img" aria-label="${ariaLabel}">` +
    morceaux.join("") +
    "</svg>"
  );
}

// ---------------------------------------------------------------------------
// Primitives autonomes — point, segment, droite, demi-droite, angle
// ---------------------------------------------------------------------------

const enveloppeSvg = (largeur, hauteur, ariaLabel, contenu) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px(largeur)} ${px(hauteur)}" width="${px(largeur)}" height="${px(hauteur)}" role="img" aria-label="${echapper(ariaLabel)}">${contenu}</svg>`;

/** Pointe de flèche (deux branches) au point `p`, dans la direction `angle`. */
function fleche(p, angle, { couleur, epaisseur = 3, taille = 11 }) {
  let d = "";
  for (const signe of [1, -1]) {
    const branche = angle + Math.PI + (signe * Math.PI) / 5;
    d += ligne(p, [p[0] + Math.cos(branche) * taille, p[1] + Math.sin(branche) * taille], {
      couleur,
      epaisseur,
    });
  }
  return d;
}

/** Prolonge la droite passant par `c` de direction `angle` jusqu'au cadre. */
export function clipDroiteAuCadre(c, angle, largeur, hauteur, marge) {
  const d = [Math.cos(angle), Math.sin(angle)];
  let tMin = -Infinity;
  let tMax = Infinity;
  // fenêtre [marge, largeur - marge] × [marge, hauteur - marge]
  for (const [origine, direction, mini, maxi] of [
    [c[0], d[0], marge, largeur - marge],
    [c[1], d[1], marge, hauteur - marge],
  ]) {
    if (Math.abs(direction) < 1e-12) continue; // parallèle à cette paire de bords
    const t1 = (mini - origine) / direction;
    const t2 = (maxi - origine) / direction;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  }
  return [
    [c[0] + d[0] * tMin, c[1] + d[1] * tMin],
    [c[0] + d[0] * tMax, c[1] + d[1] * tMax],
  ];
}

/**
 * Le point maths&go : une petite croix, jamais un disque. La croix est
 * exactement centrée sur les coordonnées ; une zone tactile invisible,
 * plus large, entoure la croix.
 */
export function dessinerPoint({
  nom = "A",
  afficherCroix = true,
  afficherNom = true,
  couleur = ENCRE,
  couleurNom = null,
  taille = 6,
  epaisseur = 2.5,
  positionNom = [15, -13],
  zoneTactile = 22,
  sortie = {},
} = {}) {
  const boite = sortie.taille ?? 64;
  const c = [boite / 2, boite / 2];
  let contenu = `<circle cx="${px(c[0])}" cy="${px(c[1])}" r="${px(zoneTactile)}" fill="rgba(0,0,0,0)" stroke="none"/>`;
  if (afficherCroix) contenu += croix(c, { couleur, taille, epaisseur });
  if (afficherNom && nom) {
    contenu += texte(echapper(nom), [c[0] + positionNom[0], c[1] + positionNom[1]], {
      couleur: couleurNom ?? couleur,
      taille: 17,
    });
  }
  return enveloppeSvg(boite, boite, `point ${nom}`, contenu);
}

/**
 * Segment [AB] : mesure (valeur réelle, texte imposé « ? », « x »…),
 * codage d'égalité, milieu, pointillés, flèches de cotation, rotation.
 */
export function dessinerSegment({
  nom = "AB",
  longueur = 5,
  unite = "cm",
  rotationDeg = 0,
  afficherExtremites = true,
  afficherNoms = true,
  mesure = false,
  texteMesure = null,
  positionMesure = "dessus", // « dessus » | « dessous »
  codage = 0, // traits d'égalité
  milieuVisible = false,
  nomMilieu = "",
  couleur = ENCRE,
  epaisseur = 4,
  pointilles = false,
  fleches = false, // double flèche de cotation
  sortie = {},
} = {}) {
  if (!/^[A-Z]{2}$/.test(nom)) {
    throw new RangeError("segment : nom de deux lettres majuscules attendu (ex. AB)");
  }
  if (!(longueur > 0) || !Number.isFinite(longueur)) {
    throw new RangeError("segment : la longueur doit être un nombre strictement positif");
  }
  const boite = sortie.taille ?? 320;
  const marge = 44;
  const c = [boite / 2, boite / 2];
  const angle = -rotationDeg * RAD;
  const demi = (boite / 2 - marge);
  const p1 = [c[0] - Math.cos(angle) * demi, c[1] - Math.sin(angle) * demi];
  const p2 = [c[0] + Math.cos(angle) * demi, c[1] + Math.sin(angle) * demi];
  let contenu = ligne(p1, p2, { couleur, epaisseur, pointilles });
  if (fleches) {
    contenu += fleche(p1, angle + Math.PI, { couleur, epaisseur: 3 });
    contenu += fleche(p2, angle, { couleur, epaisseur: 3 });
  }
  if (afficherExtremites) {
    contenu += croix(p1, { couleur }) + croix(p2, { couleur });
  }
  const perpendiculaireHaut =
    Math.sin(angle - Math.PI / 2) <= Math.sin(angle + Math.PI / 2)
      ? angle - Math.PI / 2
      : angle + Math.PI / 2; // celui qui monte à l'écran
  if (afficherNoms) {
    contenu += texte(nom[0], [p1[0] - Math.cos(angle) * 17, p1[1] - Math.sin(angle) * 17], {
      couleur,
      taille: 18,
    });
    contenu += texte(nom[1], [p2[0] + Math.cos(angle) * 17, p2[1] + Math.sin(angle) * 17], {
      couleur,
      taille: 18,
    });
  }
  if (codage > 0) {
    const m = milieu(p1, p2);
    const perpendiculaire = angle + Math.PI / 2;
    for (let k = 0; k < codage; k++) {
      const d = (k - (codage - 1) / 2) * 6;
      const centreTrait = [m[0] + Math.cos(angle) * d, m[1] + Math.sin(angle) * d];
      contenu += ligne(
        [centreTrait[0] + Math.cos(perpendiculaire) * 7, centreTrait[1] + Math.sin(perpendiculaire) * 7],
        [centreTrait[0] - Math.cos(perpendiculaire) * 7, centreTrait[1] - Math.sin(perpendiculaire) * 7],
        { couleur, epaisseur: 3 },
      );
    }
  }
  if (milieuVisible) {
    const m = milieu(p1, p2);
    contenu += graduation(m, angle, { couleur });
    if (nomMilieu) {
      contenu += texte(echapper(nomMilieu), [
        m[0] + Math.cos(perpendiculaireHaut) * -18,
        m[1] + Math.sin(perpendiculaireHaut) * -18,
      ], { couleur, taille: 16 });
    }
  }
  if (mesure || texteMesure !== null) {
    const m = milieu(p1, p2);
    const direction =
      positionMesure === "dessous" ? perpendiculaireHaut + Math.PI : perpendiculaireHaut;
    const contenuMesure =
      texteMesure !== null ? echapper(texteMesure) : echapper(formaterLongueur(longueur, unite));
    contenu += texte(contenuMesure, [
      m[0] + Math.cos(direction) * 19,
      m[1] + Math.sin(direction) * 19,
    ], { couleur: ENCRE, taille: 15, halo: 4 });
  }
  return enveloppeSvg(boite, boite, `segment ${nom}`, contenu);
}

/**
 * Droite (AB) ou (d) : prolongée proprement jusqu'au cadre, y compris
 * verticale ; deux points nommés facultatifs.
 */
export function dessinerDroite({
  nom = "(d)",
  rotationDeg = 20,
  afficherPoints = false,
  nomsPoints = "AB",
  couleur = ENCRE,
  epaisseur = 3.5,
  pointilles = false,
  sortie = {},
} = {}) {
  const largeur = sortie.taille ?? 320;
  const hauteur = sortie.hauteur ?? Math.round(largeur * 0.68);
  const marge = 20;
  const c = [largeur / 2, hauteur / 2];
  const angle = -rotationDeg * RAD;
  const [p1, p2] = clipDroiteAuCadre(c, angle, largeur, hauteur, marge);
  let contenu = ligne(p1, p2, { couleur, epaisseur, pointilles });
  if (afficherPoints) {
    for (const [signe, lettre] of [[-1, nomsPoints[0]], [1, nomsPoints[1]]]) {
      const p = [c[0] + Math.cos(angle) * 55 * signe, c[1] + Math.sin(angle) * 55 * signe];
      contenu += croix(p, { couleur });
      contenu += texte(lettre, [
        p[0] + Math.cos(angle + Math.PI / 2) * -18,
        p[1] + Math.sin(angle + Math.PI / 2) * -18,
      ], { couleur, taille: 18 });
    }
  }
  if (nom) {
    const versNom = [
      p2[0] * 0.82 + p1[0] * 0.18,
      p2[1] * 0.82 + p1[1] * 0.18,
    ];
    contenu += texte(echapper(nom), [
      versNom[0] + Math.cos(angle + Math.PI / 2) * 18,
      versNom[1] + Math.sin(angle + Math.PI / 2) * 18,
    ], { couleur, taille: 17 });
  }
  return enveloppeSvg(largeur, hauteur, `droite ${nom}`, contenu);
}

/**
 * Demi-droite [AB) : une origine (croix), un point de passage facultatif,
 * une seule extrémité infinie portant la flèche.
 */
export function dessinerDemiDroite({
  nom = "[AB)",
  nomsPoints = "AB",
  rotationDeg = 20,
  afficherPoints = true,
  couleur = ENCRE,
  epaisseur = 3.5,
  pointilles = false,
  sortie = {},
} = {}) {
  const largeur = sortie.taille ?? 320;
  const hauteur = sortie.hauteur ?? Math.round(largeur * 0.68);
  const marge = 22;
  const angle = -rotationDeg * RAD;
  // origine posée au tiers du cadre, à l'opposé de la direction
  const c = [largeur / 2, hauteur / 2];
  const origine = [c[0] - Math.cos(angle) * largeur * 0.24, c[1] - Math.sin(angle) * largeur * 0.24];
  const [, bout] = clipDroiteAuCadre(origine, angle, largeur, hauteur, marge);
  let contenu = ligne(origine, bout, { couleur, epaisseur, pointilles });
  contenu += fleche(bout, angle, { couleur, epaisseur: 3 });
  contenu += croix(origine, { couleur });
  if (afficherPoints) {
    const passage = [origine[0] + Math.cos(angle) * 70, origine[1] + Math.sin(angle) * 70];
    contenu += croix(passage, { couleur });
    contenu += texte(nomsPoints[1], [
      passage[0] + Math.cos(angle + Math.PI / 2) * -18,
      passage[1] + Math.sin(angle + Math.PI / 2) * -18,
    ], { couleur, taille: 18 });
  }
  contenu += texte(nomsPoints[0], [
    origine[0] + Math.cos(angle + Math.PI / 2) * -18,
    origine[1] + Math.sin(angle + Math.PI / 2) * -18,
  ], { couleur, taille: 18 });
  return enveloppeSvg(largeur, hauteur, `demi-droite ${nom}`, contenu);
}

/**
 * La primitive angle : deux demi-droites, un secteur choisi SANS
 * heuristique (aigu, droit, obtus, plat, rentrant), arcs de codage,
 * secteur colorié, mesure ou texte imposé.
 */
export function dessinerAngle({
  mesureDeg = 50,
  nom = "ABC", // le sommet est la lettre centrale
  orientationDeg = 10, // direction du premier côté
  afficherArc = true,
  afficherMesure = true,
  texte: texteImpose = null,
  afficherNoms = false,
  arcs = 1,
  secteur = false,
  oriente = false, // petite flèche au bout de l'arc (angle orienté)
  rayon = 34,
  couleur = null,
  epaisseur = 4,
  sortie = {},
} = {}) {
  if (!(mesureDeg > 0 && mesureDeg < 360)) {
    throw new RangeError("angle : la mesure doit être entre 0° et 360° exclus");
  }
  const boite = sortie.taille ?? 250;
  const marge = 34;
  const teinte = couleur ?? ENCRE;
  const sommet = [boite / 2, boite / 2];
  const longueurCote = boite / 2 - marge;
  // en repère écran, le sens trigonométrique est le sens des angles
  // décroissants : on balaye de -(orientation + mesure) vers -orientation
  const depart = -(orientationDeg + mesureDeg) * RAD;
  const delta = mesureDeg * RAD;
  const dir1 = -orientationDeg * RAD;
  const dir2 = -(orientationDeg + mesureDeg) * RAD;
  const bout1 = [sommet[0] + Math.cos(dir1) * longueurCote, sommet[1] + Math.sin(dir1) * longueurCote];
  const bout2 = [sommet[0] + Math.cos(dir2) * longueurCote, sommet[1] + Math.sin(dir2) * longueurCote];
  let contenu = "";
  if (secteur) {
    const pointsSecteur = [sommet, ...pointsArc(sommet, longueurCote, depart, delta)];
    contenu += `<polygon points="${pointsSecteur.map((p) => `${px(p[0])},${px(p[1])}`).join(" ")}" fill="${typeof secteur === "string" ? secteur : "#e2e8f0"}" fill-opacity="0.75" stroke="none"/>`;
  }
  const estDroit = Math.abs(mesureDeg - 90) < 1e-9;
  if (afficherArc) {
    if (estDroit) {
      const cote = rayon * 0.7;
      const p1 = [sommet[0] + Math.cos(dir1) * cote, sommet[1] + Math.sin(dir1) * cote];
      const p3 = [sommet[0] + Math.cos(dir2) * cote, sommet[1] + Math.sin(dir2) * cote];
      const p2 = [p1[0] + Math.cos(dir2) * cote, p1[1] + Math.sin(dir2) * cote];
      contenu += polyligne([p1, p2, p3], { couleur: teinte, epaisseur: 3.5 });
    } else {
      for (let k = 0; k < arcs; k++) {
        contenu += polyligne(pointsArc(sommet, rayon - 5 * k, depart, delta), {
          couleur: teinte,
          epaisseur,
        });
      }
      if (oriente) {
        // l'arc est balayé de `depart` vers `depart + delta` : la flèche
        // du sens (trigonométrique) se pose au point d'angle écran `depart`
        const pointe = [sommet[0] + Math.cos(depart) * rayon, sommet[1] + Math.sin(depart) * rayon];
        contenu += fleche(pointe, depart - Math.PI / 2, { couleur: teinte, epaisseur: 3, taille: 9 });
      }
    }
  }
  // les deux côtés de l'angle par-dessus l'arc : le trait domine toujours
  contenu += ligne(sommet, bout1, { couleur: teinte, epaisseur: 3.5 });
  contenu += ligne(sommet, bout2, { couleur: teinte, epaisseur: 3.5 });
  if ((afficherMesure || texteImpose !== null) && !(estDroit && texteImpose === null)) {
    const bissectrice = depart + delta / 2;
    const contenuMesure =
      texteImpose !== null ? echapper(texteImpose) : formaterAngle(mesureDeg);
    contenu += texte(contenuMesure, [
      sommet[0] + Math.cos(bissectrice) * (rayon + 20),
      sommet[1] + Math.sin(bissectrice) * (rayon + 20),
    ], { couleur: teinte, taille: 15, halo: 4 });
  }
  if (afficherNoms && /^[A-Z]{3}$/.test(nom)) {
    contenu += texte(nom[0], [bout1[0] + Math.cos(dir1) * 15, bout1[1] + Math.sin(dir1) * 15], { couleur: teinte, taille: 17 });
    const bissectriceExterieure = depart + delta / 2 + Math.PI;
    contenu += texte(nom[1], [
      sommet[0] + Math.cos(bissectriceExterieure) * 18,
      sommet[1] + Math.sin(bissectriceExterieure) * 18,
    ], { couleur: teinte, taille: 17 });
    contenu += texte(nom[2], [bout2[0] + Math.cos(dir2) * 15, bout2[1] + Math.sin(dir2) * 15], { couleur: teinte, taille: 17 });
  }
  return enveloppeSvg(
    boite,
    boite,
    `angle ${nom} de ${formaterAngle(mesureDeg)}`,
    contenu,
  );
}

// Petites briques SVG partagées avec les modules de configurations
// (droites, angles, scènes) — même trait, même halo, même croix partout.
export const briquesSvg = { ligne, polyligne, croix, texte, px, enveloppeSvg, fleche };
