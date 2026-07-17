// Objet officiel « jeton de nombre relatif » — version 1, STATUT BROUILLON.
//
// LE jeton maths&go : celui des plateaux de manipulation, des questions
// d'Automatismes V2, des aides, des corrections et des fiches à imprimer.
// Il est dessiné par le code, aux couleurs de la charte, avec des
// espacements de la grille officielle — jamais redessiné à la main.
//
// Rendu : chaîne SVG pure et déterministe (mêmes paramètres = même
// dessin au caractère près). Aucun accès au navigateur : utilisable
// par le site, le Studio, le moteur et les tests.
//
// Convention pédagogique (plateaux existants, à valider par Gwenaël) :
// vert = positif, rouge = négatif, gris = neutralisé (paire annulée).

import { COULEURS, TYPOGRAPHIE } from "../../charte/src/charte.js";

export const VERSION_JETONS = 1;

export const ETATS_JETON = ["normal", "neutralise", "barre", "fantome"];
export const CONTENUS_JETON = ["signe", "valeur", "aucun"];

const TAILLE_REFERENCE = 100; // le jeton se dessine dans un carré 100×100

function couleursPour(valeur, etat) {
  if (etat === "neutralise") {
    return {
      principale: COULEURS.jetonNeutralise,
      claire: COULEURS.jetonNeutralise,
      bord: COULEURS.jetonNeutraliseBord,
    };
  }
  return valeur > 0
    ? {
        principale: COULEURS.jetonPositif,
        claire: COULEURS.jetonPositifClair,
        bord: COULEURS.jetonPositifBord,
      }
    : {
        principale: COULEURS.jetonNegatif,
        claire: COULEURS.jetonNegatifClair,
        bord: COULEURS.jetonNegatifBord,
      };
}

/**
 * Dessine un jeton (+1 ou −1) en SVG.
 *
 * @param {object} [options]
 * @param {1 | -1} [options.valeur] — +1 (vert) ou −1 (rouge)
 * @param {"normal" | "neutralise" | "barre" | "fantome"} [options.etat]
 * @param {"signe" | "valeur" | "aucun"} [options.contenu] — ce qui est
 *   écrit sur le jeton : le signe seul, « +1 » / « −1 », ou rien
 * @param {number} [options.taille] — côté du rendu en pixels
 * @returns {string} balise <svg> autonome
 */
export function dessinerJeton({
  valeur = 1,
  etat = "normal",
  contenu = "signe",
  taille = 56,
} = {}) {
  if (valeur !== 1 && valeur !== -1) {
    throw new RangeError(`dessinerJeton : valeur +1 ou -1 attendue, reçu ${valeur}`);
  }
  if (!ETATS_JETON.includes(etat)) {
    throw new RangeError(`dessinerJeton : état inconnu « ${etat} »`);
  }
  if (!CONTENUS_JETON.includes(contenu)) {
    throw new RangeError(`dessinerJeton : contenu inconnu « ${contenu} »`);
  }

  const c = couleursPour(valeur, etat);
  const signe = valeur > 0 ? "+" : "−";
  const texte =
    contenu === "aucun" ? "" : contenu === "valeur" ? `${signe}1` : signe;
  const tailleTexte = contenu === "valeur" ? 40 : 56;
  const opacite = etat === "fantome" ? 0.35 : 1;

  const morceaux = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TAILLE_REFERENCE} ${TAILLE_REFERENCE}" width="${taille}" height="${taille}" role="img" aria-label="jeton ${valeur > 0 ? "plus un" : "moins un"}${etat === "normal" ? "" : ` (${etat})`}" opacity="${opacite}">`,
    // disque : fond, bord épais, reflet en haut à gauche
    `<circle cx="50" cy="50" r="46" fill="${c.principale}" stroke="${c.bord}" stroke-width="6"/>`,
    `<circle cx="50" cy="50" r="43" fill="${c.claire}" opacity="0.45"/>`,
    `<ellipse cx="38" cy="34" rx="20" ry="14" fill="#ffffff" opacity="0.30"/>`,
  ];

  if (texte) {
    morceaux.push(
      `<text x="50" y="52" font-family='${TYPOGRAPHIE.titres}' font-size="${tailleTexte}" font-weight="600" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${texte}</text>`,
    );
  }
  if (etat === "barre") {
    morceaux.push(
      `<line x1="18" y1="82" x2="82" y2="18" stroke="${c.bord}" stroke-width="8" stroke-linecap="round"/>`,
    );
  }
  morceaux.push("</svg>");
  return morceaux.join("");
}

/**
 * Dessine un groupe de jetons en grille régulière (espacement de la
 * charte), positifs d'abord puis négatifs, rangée par rangée.
 *
 * @param {object} [options]
 * @param {number} [options.positifs] — nombre de jetons +1
 * @param {number} [options.negatifs] — nombre de jetons −1
 * @param {number} [options.parRangee] — jetons par rangée
 * @param {"signe" | "valeur" | "aucun"} [options.contenu]
 * @param {number} [options.taille] — taille d'un jeton en pixels
 * @param {number} [options.pairesNeutralisees] — nombre de paires nulles
 *   affichées neutralisées (grisées), prises sur les premiers jetons de
 *   chaque signe
 * @returns {string} balise <svg> autonome contenant la grille
 */
export function dessinerGroupeJetons({
  positifs = 0,
  negatifs = 0,
  parRangee = 5,
  contenu = "signe",
  taille = 56,
  pairesNeutralisees = 0,
} = {}) {
  if (!Number.isInteger(positifs) || positifs < 0 || !Number.isInteger(negatifs) || negatifs < 0) {
    throw new RangeError("dessinerGroupeJetons : effectifs entiers positifs requis");
  }
  if (!Number.isInteger(parRangee) || parRangee < 1) {
    throw new RangeError("dessinerGroupeJetons : parRangee ≥ 1 requis");
  }
  if (pairesNeutralisees > Math.min(positifs, negatifs)) {
    throw new RangeError(
      "dessinerGroupeJetons : plus de paires neutralisées que de paires possibles",
    );
  }

  // Tout se calcule en unités du dessin (un jeton = 100), puis la taille
  // en pixels ne fait que mettre à l'échelle : espacement toujours
  // proportionnel, grille toujours régulière.
  const ECART_UNITES = 14; // ≈ 8 px pour un jeton de 56 px
  const pas = TAILLE_REFERENCE + ECART_UNITES;

  const jetons = [
    ...Array.from({ length: positifs }, (_, i) => ({
      valeur: /** @type {1} */ (1),
      etat: i < pairesNeutralisees ? "neutralise" : "normal",
    })),
    ...Array.from({ length: negatifs }, (_, i) => ({
      valeur: /** @type {-1} */ (-1),
      etat: i < pairesNeutralisees ? "neutralise" : "normal",
    })),
  ];
  const total = jetons.length;
  const colonnes = total === 0 ? 1 : Math.min(parRangee, total);
  const rangees = total === 0 ? 1 : Math.ceil(total / parRangee);
  const largeur = colonnes * pas - ECART_UNITES;
  const hauteur = rangees * pas - ECART_UNITES;
  const echelle = taille / TAILLE_REFERENCE;

  const morceaux = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" width="${largeur * echelle}" height="${hauteur * echelle}" role="img" aria-label="${positifs} jeton(s) plus un et ${negatifs} jeton(s) moins un${pairesNeutralisees ? `, ${pairesNeutralisees} paire(s) neutralisée(s)` : ""}">`,
  ];
  jetons.forEach((jeton, i) => {
    const x = (i % parRangee) * pas;
    const y = Math.floor(i / parRangee) * pas;
    const interne = dessinerJeton({ ...jeton, contenu, taille: TAILLE_REFERENCE })
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "");
    morceaux.push(`<g transform="translate(${x} ${y})">${interne}</g>`);
  });
  morceaux.push("</svg>");
  return morceaux.join("");
}
