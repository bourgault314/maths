// Objet officiel « triangle aux vraies mesures » — version 1, BROUILLON.
//
// Écrit entièrement par maths&go (pas de code repris) : les sommets
// sont calculés par la loi des sinus / loi des cosinus, donc les
// angles dessinés sont EXACTEMENT les angles demandés — c'est testé
// au millième de degré. Fini les triangles faux.
//
// Conventions visuelles relevées dans AngleBarre (l'outil du site) :
// contour bleu #1d4ed8 épais, arcs d'angles colorés bleu/orange/vert
// (rôles fixes, les mêmes que les barres), marque d'angle droit rouge,
// lettres de sommets bleues avec halo blanc (lisibles sur tout fond).

import { COULEURS_BARRES } from "../../charte/src/charte.js";
import { distancePointSegment, secteurAngulaire } from "./geometrie.js";

export const VERSION_TRIANGLE = 1;

export const COULEURS_ANGLES = [
  COULEURS_BARRES.hachureCalcul, // 1er sommet : bleu #3b82f6
  COULEURS_BARRES.hachureSuppression, // 2e : orange #f97316
  COULEURS_BARRES.hachureAjout, // 3e : vert #16a34a
];
const CONTOUR = "#1d4ed8";
const ANGLE_DROIT = "#ef4444";
const ENCRE = COULEURS_BARRES.encre;

const RAD = Math.PI / 180;

/**
 * Calcule les sommets d'un triangle (repère mathématique, y vers le
 * haut, non mis à l'échelle) à partir de ses angles OU de ses côtés.
 *
 * @param {object} donnees
 * @param {[number, number, number]} [donnees.angles] — angles aux trois
 *   sommets, en degrés ; leur somme doit faire 180
 * @param {[number, number, number]} [donnees.cotes] — longueurs des
 *   côtés opposés aux trois sommets (a, b, c)
 * @returns {[[number, number], [number, number], [number, number]]}
 */
export function calculerSommets({ angles, cotes } = {}) {
  let a, b, c; // longueurs des côtés opposés aux sommets 1, 2, 3
  if (angles) {
    if (angles.length !== 3 || angles.some((x) => !(x > 0))) {
      throw new RangeError("triangle : trois angles strictement positifs attendus");
    }
    const somme = angles[0] + angles[1] + angles[2];
    if (Math.abs(somme - 180) > 1e-9) {
      throw new RangeError(`triangle : la somme des angles doit faire 180° (ici ${somme}°)`);
    }
    // loi des sinus, avec un périmètre arbitraire (l'échelle est refaite au rendu)
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
    throw new RangeError("triangle : donner soit trois angles, soit trois côtés");
  }

  // Sommet 2 à l'origine, sommet 3 sur l'axe des x (côté a = [2,3]),
  // sommet 1 au-dessus. Loi des cosinus pour l'angle au sommet 2.
  const cosAngle2 = (a * a + c * c - b * b) / (2 * a * c);
  const angle2 = Math.acos(Math.min(1, Math.max(-1, cosAngle2)));
  return [
    [c * Math.cos(angle2), c * Math.sin(angle2)],
    [0, 0],
    [a, 0],
  ];
}

/** Angle intérieur (en degrés) au sommet `i` d'un triangle de sommets donnés. */
export function angleAuSommet(sommets, i) {
  const [v, p, q] = [sommets[i], sommets[(i + 1) % 3], sommets[(i + 2) % 3]];
  const u1 = [p[0] - v[0], p[1] - v[1]];
  const u2 = [q[0] - v[0], q[1] - v[1]];
  const cosinus =
    (u1[0] * u2[0] + u1[1] * u2[1]) /
    (Math.hypot(...u1) * Math.hypot(...u2));
  return Math.acos(Math.min(1, Math.max(-1, cosinus))) / RAD;
}

/**
 * Dessine un triangle aux vraies mesures.
 *
 * @param {object} options
 * @param {string} [options.nom] — les trois lettres des sommets (« ABC »)
 * @param {[number,number,number]} [options.angles] — en degrés (somme 180)
 * @param {[number,number,number]} [options.cotes] — longueurs (a, b, c),
 *   côtés opposés aux sommets
 * @param {boolean} [options.afficherAngles] — arcs et valeurs d'angles
 * @param {boolean} [options.afficherCotes] — longueurs sur les côtés
 * @param {string} [options.unite] — unité des côtés (« cm »)
 * @param {number} [options.taille] — largeur du rendu en pixels
 * @returns {string} balise <svg> autonome
 */
export function dessinerTriangle({
  nom = "ABC",
  angles,
  cotes,
  afficherAngles = true,
  afficherCotes = false,
  unite = "cm",
  taille = 360,
} = {}) {
  if (!/^[A-Z]{3}$/.test(nom)) {
    throw new RangeError("triangle : nom de trois lettres majuscules attendu (ex. ABC)");
  }
  const sommets = calculerSommets({ angles, cotes });
  const anglesReels = [0, 1, 2].map((i) => angleAuSommet(sommets, i));

  // Mise à l'échelle dans un cadre avec marge pour les lettres.
  const MARGE = 46;
  const largeurUtile = 100; // unités internes, l'échelle finale vient de `taille`
  const xs = sommets.map((s) => s[0]);
  const ys = sommets.map((s) => s[1]);
  const boiteL = Math.max(...xs) - Math.min(...xs);
  const boiteH = Math.max(...ys) - Math.min(...ys);
  const echelle = (largeurUtile * 3) / Math.max(boiteL, boiteH);
  // Repère SVG : y vers le bas → on inverse y.
  const points = sommets.map((s) => [
    MARGE + (s[0] - Math.min(...xs)) * echelle,
    MARGE + (Math.max(...ys) - s[1]) * echelle,
  ]);
  const largeurTotale = MARGE * 2 + boiteL * echelle;
  const hauteurTotale = MARGE * 2 + boiteH * echelle;

  const centre = [
    (points[0][0] + points[1][0] + points[2][0]) / 3,
    (points[0][1] + points[1][1] + points[2][1]) / 3,
  ];

  // Ordre de dessin (retour de Gwenaël) : le fond blanc, PUIS les arcs
  // d'angles, PUIS le trait bleu du triangle — quand un arc arrive sur
  // un côté, c'est toujours le trait de la figure qui domine. Les
  // textes viennent en dernier.
  const morceaux = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeurTotale} ${hauteurTotale}" width="${taille}" height="${(taille * hauteurTotale) / largeurTotale}" role="img" aria-label="triangle ${nom}, angles ${anglesReels.map((x) => Math.round(x * 10) / 10 + "°").join(", ")}">`,
    `<polygon points="${points.map((p) => p.join(",")).join(" ")}" fill="rgba(255,255,255,0.9)" stroke="none"/>`,
  ];
  const arcs = [];
  const textes = [];

  points.forEach((v, i) => {
    const p = points[(i + 1) % 3];
    const q = points[(i + 2) % 3];
    const dir1 = Math.atan2(p[1] - v[1], p[0] - v[0]);
    const dir2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
    // le rayon est aussi plafonné par la distance au côté opposé :
    // dans un triangle très aplati, l'arc ne doit jamais transpercer
    // la figure
    const rayon = Math.min(
      30,
      Math.hypot(p[0] - v[0], p[1] - v[1]) * 0.3,
      Math.hypot(q[0] - v[0], q[1] - v[1]) * 0.3,
      distancePointSegment(v, p, q) * 0.75,
    );
    // bissectrice intérieure (vers le centre du triangle)
    const versCentre = Math.atan2(centre[1] - v[1], centre[0] - v[0]);

    if (afficherAngles) {
      if (Math.abs(anglesReels[i] - 90) < 1e-6) {
        // marque d'angle droit : petit carré le long des deux côtés
        const cote = rayon * 0.7;
        const p1 = [v[0] + Math.cos(dir1) * cote, v[1] + Math.sin(dir1) * cote];
        const p3 = [v[0] + Math.cos(dir2) * cote, v[1] + Math.sin(dir2) * cote];
        const p2 = [p1[0] + Math.cos(dir2) * cote, p1[1] + Math.sin(dir2) * cote];
        arcs.push(
          `<polyline points="${p1.join(",")} ${p2.join(",")} ${p3.join(",")}" fill="none" stroke="${ANGLE_DROIT}" stroke-width="3.5" stroke-linejoin="round"/>`,
        );
      } else {
        // arc d'angle : le secteur intérieur est CALCULÉ par le noyau
        // géométrique (le centre du triangle sert de point intérieur),
        // plus aucune heuristique — l'arc est du bon côté quelle que
        // soit l'orientation du triangle.
        const { depart, delta } = secteurAngulaire(v, p, q, centre);
        const a1 = [v[0] + Math.cos(depart) * rayon, v[1] + Math.sin(depart) * rayon];
        const a2 = [
          v[0] + Math.cos(depart + delta) * rayon,
          v[1] + Math.sin(depart + delta) * rayon,
        ];
        // en repère écran (y vers le bas), balayer dans le sens des
        // angles croissants correspond à sweep = 1 ; delta < π pour un
        // angle de triangle, donc jamais de grand arc
        arcs.push(
          `<path d="M ${a1.join(" ")} A ${rayon} ${rayon} 0 0 1 ${a2.join(" ")}" fill="none" stroke="${COULEURS_ANGLES[i]}" stroke-width="4" stroke-linecap="round"/>`,
        );
        // valeur de l'angle, posée sur la bissectrice du secteur
        // réellement dessiné
        const bissectrice = depart + delta / 2;
        const texteAngle = `${String(Math.round(anglesReels[i] * 10) / 10).replace(".", ",")}°`;
        const tx = v[0] + Math.cos(bissectrice) * (rayon + 18);
        const ty = v[1] + Math.sin(bissectrice) * (rayon + 18);
        textes.push(
          `<text x="${tx}" y="${ty}" font-family="'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="700" fill="${COULEURS_ANGLES[i]}" text-anchor="middle" dominant-baseline="central" stroke="#ffffff" stroke-width="4" paint-order="stroke">${texteAngle}</text>`,
        );
      }
    }

    // lettre du sommet, à l'opposé du centre, halo blanc (convention AngleBarre)
    const lx = v[0] - Math.cos(versCentre) * 22;
    const ly = v[1] - Math.sin(versCentre) * 22;
    textes.push(
      `<text x="${lx}" y="${ly}" font-family="'Segoe UI', system-ui, sans-serif" font-size="22" font-weight="700" fill="${CONTOUR}" text-anchor="middle" dominant-baseline="central" stroke="#ffffff" stroke-width="6" paint-order="stroke">${nom[i]}</text>`,
    );
  });

  morceaux.push(...arcs);
  morceaux.push(
    `<polygon points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${CONTOUR}" stroke-width="4" stroke-linejoin="round"/>`,
  );
  morceaux.push(...textes);

  if (afficherCotes && cotes) {
    [0, 1, 2].forEach((i) => {
      const p = points[(i + 1) % 3];
      const q = points[(i + 2) % 3];
      const mx = (p[0] + q[0]) / 2;
      const my = (p[1] + q[1]) / 2;
      const versExterieur = Math.atan2(my - centre[1], mx - centre[0]);
      const uniteSure = String(unite).replace(/[&<>"']/g, "");
      const etiquette = `${String(cotes[i]).replace(".", ",")}${uniteSure ? " " + uniteSure : ""}`;
      morceaux.push(
        `<text x="${mx + Math.cos(versExterieur) * 20}" y="${my + Math.sin(versExterieur) * 20}" font-family="'Segoe UI', system-ui, sans-serif" font-size="16" font-weight="700" fill="${ENCRE}" text-anchor="middle" dominant-baseline="central" stroke="#ffffff" stroke-width="5" paint-order="stroke">${etiquette}</text>`,
      );
    });
  }

  morceaux.push("</svg>");
  return morceaux.join("");
}
