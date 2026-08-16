// Candidat « carré quadrillé » — version 4, construit pour NC-02.
//
// Une seule représentation relie les trois lectures utiles d'un carré :
//
// - « sens » : n rangées, n colonnes et n × n carreaux ;
// - « aire-inconnue » : le côté est connu, l'aire reste à calculer ;
// - « cote-inconnu » : l'aire est connue et les deux côtés égaux restent
//   à retrouver. Dans ce dernier mode, le quadrillage est volontairement
//   masqué : il ne doit pas donner la réponse par simple comptage.
// - « decomposition » : pour 11 et 12 uniquement, les colonnes sont séparées
//   en 10 + 1 ou 10 + 2 afin de rendre visibles les deux produits partiels.
//
// Le quadrillage est un CHEMIN unique, jamais une collection de n²
// rectangles. Le dessin de 12 × 12 reste donc léger et lisible. Le
// viewBox est fixe dans tous les modes : question, aide et correction ne
// provoquent aucun saut de mise en page.

import { COULEURS, TYPOGRAPHIE } from "../../charte/src/charte.js?v=33";

export const VERSION_CARRE_QUADRILLE = 4;

export const MODES_CARRE_QUADRILLE = Object.freeze([
  "sens",
  "aire-inconnue",
  "cote-inconnu",
  "decomposition",
]);

export const COULEURS_CARRE_QUADRILLE = Object.freeze({
  fond: COULEURS.fondDoux,
  contour: COULEURS.bleu,
  grille: COULEURS.texteAttenue,
  texte: COULEURS.encre,
  ligne: COULEURS.orange,
  colonne: COULEURS.turquoise,
  papier: COULEURS.papier,
});

export const LARGEUR_CARRE_QUADRILLE = 240;
export const HAUTEUR_CARRE_QUADRILLE = 240;

const X_CARRE = 52;
const Y_CARRE = 20;
const TAILLE_CARRE = 168;
const POLICE_TEXTE = TYPOGRAPHIE.texte.replaceAll('"', "'");
const POLICE_MATHEMATIQUES = TYPOGRAPHIE.mathematiques.replaceAll('"', "'");
const STYLE_CHIFFRES_ALIGNES =
  "font-variant-numeric: lining-nums tabular-nums; font-feature-settings: 'lnum' 1, 'tnum' 1;";

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );
}

function arrondi2(nombre) {
  return Number.parseFloat(Number(nombre).toFixed(2));
}

function verifierCote(cote) {
  if (!Number.isInteger(cote) || cote < 1 || cote > 12) {
    throw new RangeError(
      `dessinerCarreQuadrille : cote doit être un entier compris entre 1 et 12 (reçu « ${cote} »).`,
    );
  }
}

function verifierMode(mode) {
  if (!MODES_CARRE_QUADRILLE.includes(mode)) {
    throw new RangeError(
      `dessinerCarreQuadrille : mode invalide « ${mode} » (attendu : ${MODES_CARRE_QUADRILLE.join(
        ", ",
      )}).`,
    );
  }
}

function verifierCompatibiliteMode(cote, mode) {
  if (mode === "decomposition" && ![11, 12].includes(cote)) {
    throw new RangeError(
      "dessinerCarreQuadrille : le mode decomposition exige un côté égal à 11 ou 12.",
    );
  }
}

function lireMiseEnEvidence(miseEnEvidence, cote, mode) {
  if (miseEnEvidence == null) return null;
  if (mode === "cote-inconnu") {
    throw new RangeError(
      "dessinerCarreQuadrille : la mise en évidence exige un quadrillage visible.",
    );
  }
  if (typeof miseEnEvidence !== "object" || Array.isArray(miseEnEvidence)) {
    throw new TypeError(
      "dessinerCarreQuadrille : miseEnEvidence doit contenir une ligne et une colonne.",
    );
  }
  const { ligne, colonne } = miseEnEvidence;
  if (
    !Number.isInteger(ligne) ||
    !Number.isInteger(colonne) ||
    ligne < 1 ||
    ligne > cote ||
    colonne < 1 ||
    colonne > cote
  ) {
    throw new RangeError(
      `dessinerCarreQuadrille : ligne et colonne doivent être des entiers compris entre 1 et ${cote}.`,
    );
  }
  return Object.freeze({ ligne, colonne });
}

function texteAlternatifParDefaut(cote, mode, miseEnEvidence) {
  const rangees = `${cote} ${cote === 1 ? "rangée" : "rangées"}`;
  const colonnes = `${cote} ${cote === 1 ? "colonne" : "colonnes"}`;
  const carreaux = `${cote * cote} ${cote * cote === 1 ? "carreau" : "carreaux"}`;
  const ajout = miseEnEvidence
    ? " Une rangée et une colonne sont mises en évidence."
    : "";
  if (mode === "cote-inconnu") {
    return `Carré contenant ${carreaux}. Ses deux côtés, de même longueur, sont à trouver.`;
  }
  if (mode === "aire-inconnue") {
    return `Carré quadrillé de ${rangees} et ${colonnes}. L'aire est à trouver.${ajout}`;
  }
  if (mode === "decomposition") {
    const reste = cote - 10;
    return (
      `Carré quadrillé de ${rangees} et ${colonnes}. Les colonnes sont séparées en ` +
      `10 colonnes et ${reste} ${reste === 1 ? "colonne" : "colonnes"}. ` +
      `La décomposition représente ${cote} × 10 + ${cote} × ${reste} = ${cote * cote} carreaux.${ajout}`
    );
  }
  return `Carré quadrillé de ${rangees} et ${colonnes}, soit ${carreaux}.${ajout}`;
}

function lireTexteAlternatif(texteAlternatif, cote, mode, miseEnEvidence) {
  if (texteAlternatif == null) {
    return texteAlternatifParDefaut(cote, mode, miseEnEvidence);
  }
  if (typeof texteAlternatif !== "string" || texteAlternatif.trim() === "") {
    throw new TypeError(
      "dessinerCarreQuadrille : texteAlternatif doit être une chaîne non vide.",
    );
  }
  return texteAlternatif.trim();
}

function cheminQuadrillage(cote) {
  if (cote === 1) return "";
  const pas = TAILLE_CARRE / cote;
  const commandes = [];
  for (let i = 1; i < cote; i += 1) {
    const x = arrondi2(X_CARRE + i * pas);
    const y = arrondi2(Y_CARRE + i * pas);
    commandes.push(`M ${x} ${Y_CARRE} V ${Y_CARRE + TAILLE_CARRE}`);
    commandes.push(`M ${X_CARRE} ${y} H ${X_CARRE + TAILLE_CARRE}`);
  }
  return commandes.join(" ");
}

function rectanglesMiseEnEvidence(cote, miseEnEvidence) {
  if (!miseEnEvidence) return "";
  const pas = TAILLE_CARRE / cote;
  const y = arrondi2(Y_CARRE + (miseEnEvidence.ligne - 1) * pas);
  const x = arrondi2(X_CARRE + (miseEnEvidence.colonne - 1) * pas);
  const taille = arrondi2(pas);
  return (
    `<rect class="cq-ligne-active" x="${X_CARRE}" y="${y}" width="${TAILLE_CARRE}" ` +
    `height="${taille}" fill="${COULEURS_CARRE_QUADRILLE.ligne}" fill-opacity="0.24"/>` +
    `<rect class="cq-colonne-active" x="${x}" y="${Y_CARRE}" width="${taille}" ` +
    `height="${TAILLE_CARRE}" fill="${COULEURS_CARRE_QUADRILLE.colonne}" fill-opacity="0.24"/>`
  );
}

function texte(
  x,
  y,
  contenu,
  { taille = 16, graisse = 700, rotation = null, classe = "" } = {},
) {
  const transformation = rotation == null ? "" : ` transform="rotate(${rotation} ${x} ${y})"`;
  const attributClasse = classe ? ` class="${echapper(classe)}"` : "";
  return (
    `<text${attributClasse} x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"${transformation} ` +
    `font-family="${POLICE_MATHEMATIQUES}" font-size="${taille}" font-weight="${graisse}" ` +
    `style="${STYLE_CHIFFRES_ALIGNES}" ` +
    `fill="${COULEURS_CARRE_QUADRILLE.texte}">${echapper(contenu)}</text>`
  );
}

function texteDeuxLignes(x, y, ligne1, ligne2) {
  return (
    `<rect class="cq-etiquette-aire" x="${x - 64}" y="${y - 30}" width="128" height="60" ` +
    `fill="${COULEURS_CARRE_QUADRILLE.papier}" fill-opacity="0.94"/>` +
    `<text class="cq-aire" x="${x}" y="${y}" text-anchor="middle" ` +
    `fill="${COULEURS_CARRE_QUADRILLE.texte}">` +
    `<tspan x="${x}" dy="-0.25em" font-family="${POLICE_MATHEMATIQUES}" font-size="20" ` +
    `font-weight="700" style="${STYLE_CHIFFRES_ALIGNES}">${echapper(ligne1)}</tspan>` +
    `<tspan x="${x}" dy="1.45em" font-family="${POLICE_TEXTE}" font-size="13" ` +
    `font-weight="700">${echapper(ligne2)}</tspan>` +
    `</text>`
  );
}

function geometrieDecomposition(cote) {
  const pas = TAILLE_CARRE / cote;
  const largeurDizaine = arrondi2(10 * pas);
  const xSeparation = arrondi2(X_CARRE + largeurDizaine);
  const largeurReste = arrondi2(TAILLE_CARRE - largeurDizaine);
  return { largeurDizaine, xSeparation, largeurReste };
}

function fondsDecomposition(cote) {
  const { largeurDizaine, xSeparation, largeurReste } = geometrieDecomposition(cote);
  return (
    `<rect class="cq-partie-dizaine" x="${X_CARRE}" y="${Y_CARRE}" ` +
    `width="${largeurDizaine}" height="${TAILLE_CARRE}" ` +
    `fill="${COULEURS_CARRE_QUADRILLE.colonne}" fill-opacity="0.16"/>` +
    `<rect class="cq-partie-reste" x="${xSeparation}" y="${Y_CARRE}" ` +
    `width="${largeurReste}" height="${TAILLE_CARRE}" ` +
    `fill="${COULEURS_CARRE_QUADRILLE.ligne}" fill-opacity="0.2"/>`
  );
}

function reperesDecomposition(cote) {
  const { xSeparation } = geometrieDecomposition(cote);
  const yAccolade = Y_CARRE + TAILLE_CARRE + 7;
  const hauteurAccolade = 6;
  return (
    `<path class="cq-separation-decomposition" ` +
    `d="M ${xSeparation} ${Y_CARRE} V ${Y_CARRE + TAILLE_CARRE}" ` +
    `fill="none" stroke="${COULEURS_CARRE_QUADRILLE.ligne}" stroke-width="3"/>` +
    `<path class="cq-accolade-dizaine" ` +
    `d="M ${X_CARRE} ${yAccolade} V ${yAccolade + hauteurAccolade} ` +
    `H ${xSeparation} V ${yAccolade}" fill="none" ` +
    `stroke="${COULEURS_CARRE_QUADRILLE.contour}" stroke-width="1.5"/>` +
    `<path class="cq-accolade-reste" ` +
    `d="M ${xSeparation} ${yAccolade} V ${yAccolade + hauteurAccolade} ` +
    `H ${X_CARRE + TAILLE_CARRE} V ${yAccolade}" fill="none" ` +
    `stroke="${COULEURS_CARRE_QUADRILLE.contour}" stroke-width="1.5"/>`
  );
}

function libelles(cote, mode) {
  const aire = cote * cote;
  const motCarreau = aire === 1 ? "carreau" : "carreaux";
  const centreX = X_CARRE + TAILLE_CARRE / 2;
  const centreY = Y_CARRE + TAILLE_CARRE / 2;
  if (mode === "cote-inconnu") {
    return (
      texteDeuxLignes(centreX, centreY, aire, motCarreau) +
      texte(centreX, 216, "?", { taille: 22, classe: "cq-cote" }) +
      texte(24, centreY, "?", { taille: 22, classe: "cq-cote" })
    );
  }
  if (mode === "decomposition") {
    const pas = TAILLE_CARRE / cote;
    const largeurDizaine = 10 * pas;
    const reste = cote - 10;
    const centreDizaine = arrondi2(X_CARRE + largeurDizaine / 2);
    const centreReste = arrondi2(X_CARRE + largeurDizaine + (TAILLE_CARRE - largeurDizaine) / 2);
    return (
      texte(24, centreY, cote, { taille: 18, classe: "cq-cote" }) +
      texte(centreDizaine, 216, "10", { taille: 16, classe: "cq-largeur-dizaine" }) +
      texte(centreReste, 216, reste, { taille: 16, classe: "cq-largeur-reste" })
    );
  }

  const centre = mode === "aire-inconnue"
    ? (
        `<rect class="cq-etiquette-aire" x="${centreX - 36}" y="${centreY - 26}" ` +
        `width="72" height="52" fill="${COULEURS_CARRE_QUADRILLE.papier}" ` +
        `fill-opacity="0.94"/>` +
        texte(centreX, centreY, "?", { taille: 24, classe: "cq-aire" })
      )
    : texteDeuxLignes(centreX, centreY, aire, motCarreau);
  return (
    centre +
    texte(centreX, 216, cote, { taille: 18, classe: "cq-cote" }) +
    texte(24, centreY, cote, { taille: 18, classe: "cq-cote" })
  );
}

/**
 * Dessine le modèle d'aire d'un carré de côté entier, de 1 à 12.
 *
 * @param {object} [options]
 * @param {number} [options.cote=4] entier de 1 à 12
 * @param {"sens"|"aire-inconnue"|"cote-inconnu"|"decomposition"} [options.mode="sens"]
 * @param {{ligne:number,colonne:number}|null} [options.miseEnEvidence=null]
 *   une rangée et une colonne du quadrillage, indexées à partir de 1
 * @param {string|null} [options.texteAlternatif=null] nom accessible personnalisé
 * @returns {{svg:string,largeur:number,hauteur:number,texteAlternatif:string,cote:number,aire:number,mode:string}}
 */
export function dessinerCarreQuadrille({
  cote = 4,
  mode = "sens",
  miseEnEvidence = null,
  texteAlternatif = null,
} = {}) {
  verifierCote(cote);
  verifierMode(mode);
  verifierCompatibiliteMode(cote, mode);
  const evidence = lireMiseEnEvidence(miseEnEvidence, cote, mode);
  const alternatif = lireTexteAlternatif(texteAlternatif, cote, mode, evidence);
  const quadrillage = mode !== "cote-inconnu" ? cheminQuadrillage(cote) : "";

  const corps =
    `<rect class="cq-fond" x="${X_CARRE}" y="${Y_CARRE}" width="${TAILLE_CARRE}" ` +
    `height="${TAILLE_CARRE}" fill="${COULEURS_CARRE_QUADRILLE.fond}"/>` +
    (mode === "decomposition" ? fondsDecomposition(cote) : "") +
    rectanglesMiseEnEvidence(cote, evidence) +
    (quadrillage
      ? `<path class="cq-grille" d="${quadrillage}" fill="none" ` +
        `stroke="${COULEURS_CARRE_QUADRILLE.grille}" stroke-width="1"/>`
      : "") +
    (mode === "decomposition" ? reperesDecomposition(cote) : "") +
    `<rect class="cq-contour" x="${X_CARRE}" y="${Y_CARRE}" width="${TAILLE_CARRE}" ` +
    `height="${TAILLE_CARRE}" fill="none" ` +
    `stroke="${COULEURS_CARRE_QUADRILLE.contour}" stroke-width="2.5"/>` +
    libelles(cote, mode);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${LARGEUR_CARRE_QUADRILLE} ${HAUTEUR_CARRE_QUADRILLE}" ` +
    `width="${LARGEUR_CARRE_QUADRILLE}" height="${HAUTEUR_CARRE_QUADRILLE}" ` +
    `role="img" aria-label="${echapper(alternatif)}">${corps}</svg>`;

  return Object.freeze({
    svg,
    largeur: LARGEUR_CARRE_QUADRILLE,
    hauteur: HAUTEUR_CARRE_QUADRILLE,
    texteAlternatif: alternatif,
    cote,
    aire: cote * cote,
    mode,
  });
}
