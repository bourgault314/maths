// Objet officiel « vérification » — version 1, BROUILLON.
//
// Le bandeau « Vérification : … » est un objet SÉPARÉ de la rédaction
// (décision de Gwenaël) : on peut le poser sous une rédaction, sous un
// tableau, dans une correction — ou ne pas le mettre du tout.

import { COULEURS_BARRES } from "../../charte/src/charte.js";

export const VERSION_VERIFICATION = 1;

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );
}

/**
 * Dessine un bandeau de vérification.
 * @param {object} options
 * @param {string} options.texte — ex. « 3 × 4 + 5 = 17 »
 * @param {string} [options.lettre] — lettre rendue en italique si présente
 * @param {number} [options.taillePolice]
 * @param {number} [options.largeur]
 * @returns {string} balise <svg> autonome
 */
export function dessinerVerification({ texte, lettre = "x", taillePolice = 17, largeur = 400 } = {}) {
  if (typeof texte !== "string" || texte.trim() === "") {
    throw new RangeError("dessinerVerification : un texte est requis");
  }
  const contenu = echapper(texte)
    .split(echapper(lettre))
    .join(`<tspan font-style="italic">${echapper(lettre)}</tspan>`);
  const hauteur = taillePolice * 2.1;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" width="${largeur}" height="${hauteur}" role="img" aria-label="vérification">` +
    `<rect x="0" y="0" width="${largeur}" height="${hauteur}" fill="#f1f5f9" rx="6"/>` +
    `<text x="12" y="${hauteur / 2 + taillePolice * 0.36}" font-family="'Segoe UI', system-ui, sans-serif" font-size="${taillePolice}" font-weight="700" fill="${COULEURS_BARRES.attenue}">Vérification : ${contenu}</text>` +
    `</svg>`
  );
}
