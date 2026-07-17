// Objet officiel « schéma en barres » — version 1, STATUT BROUILLON.
//
// LE schéma en barres maths&go : celui des problèmes (partie-tout,
// comparaison, groupes égaux), d'ÉquaBarre, des aides et des fiches.
// Un seul objet, des options — plus jamais dix dessins aux détails
// différents.
//
// Modèle de données (données pures, dans l'esprit des contrats) :
//   barres    : liste d'étages, chacun { etiquette?, segments: [...] }
//   segment   : { valeur, etiquette?, role? }
//     - valeur   : longueur relative (nombre > 0) — les largeurs sont
//                  proportionnelles, comme dans le modèle de Singapour
//     - etiquette: texte affiché dans la case (souvent la valeur, ou rien)
//     - role     : "connu" (bleu) | "second" (turquoise) | "accent"
//                  (orange) | "inconnu" (case blanche en pointillés,
//                  pensée pour le « ? » de la progression officielle)
//   accolades : [{ barre, de, a, position: "haut"|"bas", etiquette }]
//               — accolade couvrant les segments de..a (inclus) d'un
//               étage, avec son étiquette (le tout, l'écart…)
//
// Rendu : SVG pur, déterministe, couleurs de la charte uniquement.
// Cycle 2 → collège : mêmes barres, seules les valeurs changent.

import { COULEURS, TYPOGRAPHIE } from "../../charte/src/charte.js";

export const VERSION_BARRES = 1;
export const ROLES_SEGMENT = ["connu", "second", "accent", "inconnu"];

const HAUTEUR_BARRE = 44;
const INTER_BARRE = 12;
const HAUTEUR_ACCOLADE = 16;
const HAUTEUR_ETIQUETTE = 24;
const MARGE = 4;

function stylePour(role) {
  switch (role) {
    case "second":
      return { fond: COULEURS.turquoise, texte: "#ffffff", bord: COULEURS.bleuFonce, pointille: false };
    case "accent":
      return { fond: COULEURS.orange, texte: "#ffffff", bord: COULEURS.bleuFonce, pointille: false };
    case "inconnu":
      return { fond: COULEURS.papier, texte: COULEURS.encre, bord: COULEURS.bleu, pointille: true };
    default:
      return { fond: COULEURS.bleu, texte: "#ffffff", bord: COULEURS.bleuFonce, pointille: false };
  }
}

function cheminAccolade(x1, x2, y, position) {
  // Accolade horizontale de x1 à x2, pointe au milieu, ouverte vers la
  // barre ; « haut » = au-dessus (pointe vers le haut), « bas » = dessous.
  const sens = position === "haut" ? -1 : 1;
  const h = HAUTEUR_ACCOLADE * sens;
  const milieu = (x1 + x2) / 2;
  const c = Math.min(10, (x2 - x1) / 4);
  return [
    `M ${x1} ${y}`,
    `C ${x1} ${y + h / 2} ${x1 + c} ${y + h / 2} ${x1 + c} ${y + h / 2}`,
    `L ${milieu - c} ${y + h / 2}`,
    `C ${milieu} ${y + h / 2} ${milieu} ${y + h} ${milieu} ${y + h}`,
    `C ${milieu} ${y + h} ${milieu} ${y + h / 2} ${milieu + c} ${y + h / 2}`,
    `L ${x2 - c} ${y + h / 2}`,
    `C ${x2} ${y + h / 2} ${x2} ${y} ${x2} ${y}`,
  ].join(" ");
}

/**
 * Dessine un schéma en barres.
 *
 * @param {object} options
 * @param {Array<{etiquette?: string, segments: Array<{valeur: number, etiquette?: string, role?: string}>}>} options.barres
 * @param {Array<{barre: number, de: number, a: number, position: "haut" | "bas", etiquette: string}>} [options.accolades]
 * @param {number} [options.largeur] — largeur utile du dessin en pixels
 * @returns {string} balise <svg> autonome
 */
export function dessinerSchemaBarres({ barres, accolades = [], largeur = 480 } = {}) {
  if (!Array.isArray(barres) || barres.length === 0) {
    throw new RangeError("dessinerSchemaBarres : au moins une barre est requise");
  }
  for (const [i, barre] of barres.entries()) {
    if (!Array.isArray(barre.segments) || barre.segments.length === 0) {
      throw new RangeError(`dessinerSchemaBarres : la barre ${i} n'a aucun segment`);
    }
    for (const segment of barre.segments) {
      if (!(typeof segment.valeur === "number") || !(segment.valeur > 0)) {
        throw new RangeError(`dessinerSchemaBarres : valeur de segment invalide dans la barre ${i}`);
      }
      if (segment.role !== undefined && !ROLES_SEGMENT.includes(segment.role)) {
        throw new RangeError(`dessinerSchemaBarres : rôle inconnu « ${segment.role} »`);
      }
    }
  }
  for (const a of accolades) {
    const barre = barres[a.barre];
    if (!barre) throw new RangeError(`accolade : barre ${a.barre} inexistante`);
    if (!(Number.isInteger(a.de) && Number.isInteger(a.a) && a.de >= 0 && a.a >= a.de && a.a < barre.segments.length)) {
      throw new RangeError(`accolade : segments ${a.de}..${a.a} invalides pour la barre ${a.barre}`);
    }
    if (a.position !== "haut" && a.position !== "bas") {
      throw new RangeError(`accolade : position « ${a.position} » invalide (haut ou bas)`);
    }
  }

  const totalMax = Math.max(
    ...barres.map((b) => b.segments.reduce((s, seg) => s + seg.valeur, 0)),
  );
  const avecNoms = barres.some((b) => b.etiquette);
  const margeGauche = avecNoms ? 78 : MARGE;
  const placeAccolade = HAUTEUR_ACCOLADE + HAUTEUR_ETIQUETTE;
  const margeHaut = accolades.some((a) => a.position === "haut") ? placeAccolade + MARGE : MARGE;
  const margeBas = accolades.some((a) => a.position === "bas") ? placeAccolade + MARGE : MARGE;
  const echelle = (largeur - margeGauche - MARGE) / totalMax;
  const hauteurTotale =
    margeHaut + barres.length * HAUTEUR_BARRE + (barres.length - 1) * INTER_BARRE + margeBas;

  const yBarre = (i) => margeHaut + i * (HAUTEUR_BARRE + INTER_BARRE);
  const xSegment = (barre, index) =>
    margeGauche + barre.segments.slice(0, index).reduce((s, seg) => s + seg.valeur, 0) * echelle;

  const morceaux = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteurTotale}" width="${largeur}" height="${hauteurTotale}" role="img" aria-label="schéma en barres, ${barres.length} barre(s)">`,
  ];

  barres.forEach((barre, i) => {
    const y = yBarre(i);
    if (barre.etiquette) {
      morceaux.push(
        `<text x="${margeGauche - 10}" y="${y + HAUTEUR_BARRE / 2}" font-family='${TYPOGRAPHIE.titres}' font-size="17" fill="${COULEURS.encre}" text-anchor="end" dominant-baseline="central">${barre.etiquette}</text>`,
      );
    }
    barre.segments.forEach((segment, j) => {
      const x = xSegment(barre, j);
      const l = segment.valeur * echelle;
      const style = stylePour(segment.role ?? "connu");
      morceaux.push(
        `<rect x="${x}" y="${y}" width="${l}" height="${HAUTEUR_BARRE}" fill="${style.fond}" stroke="${style.bord}" stroke-width="2"${style.pointille ? ' stroke-dasharray="6 4"' : ""}/>`,
      );
      if (segment.etiquette) {
        morceaux.push(
          `<text x="${x + l / 2}" y="${y + HAUTEUR_BARRE / 2}" font-family='${TYPOGRAPHIE.titres}' font-size="19" font-weight="600" fill="${style.texte}" text-anchor="middle" dominant-baseline="central">${segment.etiquette}</text>`,
        );
      }
    });
  });

  for (const a of accolades) {
    const barre = barres[a.barre];
    const x1 = xSegment(barre, a.de);
    const x2 = xSegment(barre, a.a) + barre.segments[a.a].valeur * echelle;
    const y = a.position === "haut" ? yBarre(a.barre) - MARGE : yBarre(a.barre) + HAUTEUR_BARRE + MARGE;
    morceaux.push(
      `<path d="${cheminAccolade(x1, x2, y, a.position)}" fill="none" stroke="${COULEURS.encre}" stroke-width="2.5" stroke-linecap="round"/>`,
    );
    const yTexte =
      a.position === "haut" ? y - HAUTEUR_ACCOLADE - 10 : y + HAUTEUR_ACCOLADE + 12;
    morceaux.push(
      `<text x="${(x1 + x2) / 2}" y="${yTexte}" font-family='${TYPOGRAPHIE.titres}' font-size="18" font-weight="600" fill="${COULEURS.encre}" text-anchor="middle" dominant-baseline="central">${a.etiquette}</text>`,
    );
  }

  morceaux.push("</svg>");
  return morceaux.join("");
}
