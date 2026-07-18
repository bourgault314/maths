// Objet officiel « rédaction d'équation » — version 1, BROUILLON.
//
// LA fenêtre d'équation qui vit EN PARALLÈLE du tableau (à droite sur
// ordinateur, sous le tableau sur téléphone) — modèle fourni par
// Gwenaël (rédaction du Splat deux plateaux) :
//
//   - les équations empilées, alignées sur le signe « = » ;
//   - entre deux lignes, l'opération effectuée est annotée DES DEUX
//     CÔTÉS, en orange, avec une flèche ARRONDIE vers le bas, PROCHE
//     de l'équation (les flèches droites et lointaines de GPT sont
//     exactement ce qu'on ne veut pas) ;
//   - la conclusion (x = …) en vert ;
//   - une ligne de vérification en dessous.
//
// SVG pur et déterministe : plaçable où l'on veut, exportable, taille
// libre. La lettre de l'inconnue est rendue en italique serif, comme
// dans les outils.

import { COULEURS_BARRES } from "../../charte/src/charte.js";

export const VERSION_REDACTION = 1;

const ORANGE = COULEURS_BARRES.hachureSuppression; // #f97316
const VERT = COULEURS_BARRES.hachureAjout; // #16a34a
const ENCRE = COULEURS_BARRES.encre;
const ATTENUE = COULEURS_BARRES.attenue;
const POLICE = "Georgia, 'Times New Roman', serif";

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );
}

// Largeur approchée d'un texte (suffisant pour centrer et rapprocher
// les flèches ; le rendu final est du texte SVG vectoriel).
function largeurApprochee(texte, taillePolice) {
  let total = 0;
  for (const c of String(texte)) {
    total += /[0-9]/.test(c) ? 0.52 : /[a-z]/i.test(c) ? 0.5 : c === " " ? 0.3 : 0.55;
  }
  return total * taillePolice;
}

// Rend un texte mathématique : la lettre d'inconnue en italique.
function texteMathematique(texte, lettre) {
  const morceaux = String(texte)
    .split(lettre)
    .map(echapper)
    .join(`<tspan font-style="italic">${echapper(lettre)}</tspan>`);
  return morceaux;
}

// LA flèche d'opération : celle d'ÉquaBarre, verbatim (objet fleche).
import { dessinerFlecheOperation } from "./fleche.js";

function flecheIncrustee(x, y, hauteur, cote) {
  const echelle = hauteur / 44;
  return (
    `<g transform="translate(${x} ${y}) scale(${echelle})" color="${ORANGE}">` +
    dessinerFlecheOperation({ cote, fragment: true }) +
    `</g>`
  );
}

/**
 * Dessine la rédaction d'une résolution d'équation.
 *
 * @param {object} options
 * @param {Array<{equation: string, operation?: string, conclusion?: boolean}>} options.etapes
 *   — chaque étape porte son équation « membre = membre » ; `operation`
 *   (ex. « −5 », « ÷3 ») annote le passage DEPUIS la ligne précédente ;
 *   `conclusion` colore la ligne en vert.
 *   La vérification est un objet séparé : voir verification.js.
 * @param {string} [options.lettre] — lettre de l'inconnue (italique)
 * @param {number} [options.taillePolice] — hauteur des équations (px)
 * @param {number} [options.largeur] — largeur totale du rendu
 * @returns {string} balise <svg> autonome
 */
export function dessinerRedaction({
  etapes,
  lettre = "x",
  taillePolice = 26,
  largeur = 420,
} = {}) {
  if (!Array.isArray(etapes) || etapes.length === 0) {
    throw new RangeError("dessinerRedaction : au moins une étape est requise");
  }
  for (const etape of etapes) {
    if (typeof etape.equation !== "string" || !etape.equation.includes("=")) {
      throw new RangeError("dessinerRedaction : chaque étape doit porter une équation « … = … »");
    }
  }

  const interligne = taillePolice * 1.15;
  const hauteurOperation = taillePolice * 1.5;
  const centre = largeur / 2;
  const morceaux = [];
  let y = taillePolice * 1.3;

  etapes.forEach((etape, i) => {
    const [gauche, droite] = etape.equation.split("=").map((m) => m.trim());

    if (i > 0 && etape.operation) {
      // Rangée d'opération façon ÉquaBarre : l'annotation vit AU BORD
      // (marges fixes), jamais calculée sur la largeur du texte — les
      // grandes équations ne posent plus de problème.
      const yOperation = y - taillePolice * 0.55;
      const tailleFleche = hauteurOperation * 0.82;
      const largeurEtiquette = largeurApprochee(etape.operation, taillePolice * 0.78);
      morceaux.push(
        `<text x="8" y="${yOperation + hauteurOperation * 0.42}" font-family="${POLICE}" font-size="${taillePolice * 0.78}" font-weight="700" fill="${ORANGE}" text-anchor="start">${texteMathematique(etape.operation, lettre)}</text>`,
        flecheIncrustee(10 + largeurEtiquette, yOperation, tailleFleche, "gauche"),
        `<text x="${largeur - 8}" y="${yOperation + hauteurOperation * 0.42}" font-family="${POLICE}" font-size="${taillePolice * 0.78}" font-weight="700" fill="${ORANGE}" text-anchor="end">${texteMathematique(etape.operation, lettre)}</text>`,
        flecheIncrustee(largeur - 10 - largeurEtiquette - tailleFleche * 1.1, yOperation, tailleFleche, "droite"),
      );
      y += hauteurOperation;
    } else if (i > 0) {
      y += interligne * 0.4;
    }

    const couleur = etape.conclusion ? VERT : ENCRE;
    morceaux.push(
      `<text x="${centre - taillePolice * 0.45}" y="${y}" font-family="${POLICE}" font-size="${taillePolice}" font-weight="700" fill="${couleur}" text-anchor="end">${texteMathematique(gauche, lettre)}</text>`,
      `<text x="${centre}" y="${y}" font-family="${POLICE}" font-size="${taillePolice}" font-weight="700" fill="${etape.conclusion ? VERT : COULEURS_BARRES.hachureCalcul}" text-anchor="middle">=</text>`,
      `<text x="${centre + taillePolice * 0.45}" y="${y}" font-family="${POLICE}" font-size="${taillePolice}" font-weight="700" fill="${couleur}" text-anchor="start">${texteMathematique(droite, lettre)}</text>`,
    );
    y += interligne;
  });

  const hauteurTotale = y + taillePolice * 0.4;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteurTotale}" width="${largeur}" height="${hauteurTotale}" role="img" aria-label="rédaction de la résolution, ${etapes.length} étape(s)">` +
    morceaux.join("") +
    `</svg>`
  );
}
