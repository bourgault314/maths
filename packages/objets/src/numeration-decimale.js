// Objets visuels de numération décimale pour NC-03 / NC-04.
//
// Le matériel conserve une même cellule de référence : une unité mesure
// exactement 10 × 10 cellules, un dixième 10 × 1 (ou 1 × 10 dans la variante
// verticale) et un centième 1 × 1. Les pièces restent donc comparables sans
// que le dessin repose sur une approximation décimale.

import {
  COULEURS,
  COULEURS_NUMERATION_DECIMALE,
  COULEURS_RANGS_NUMERATION_DECIMALE,
  TYPOGRAPHIE,
} from "../../charte/src/charte.js?v=31";
import { construireDonneesTableauNumeration } from "./fractions-decimaux.js?v=31";

export const VERSION_NUMERATION_DECIMALE = 2;

export const ORIENTATIONS_MATERIEL_NUMERATION_DECIMALE = Object.freeze([
  "horizontale",
  "verticale",
]);

const LARGEUR_PAR_DEFAUT = 320;
const LARGEUR_MINIMALE = 240;
const LARGEUR_MAXIMALE = 1600;
const MARGE = 12;
const RANGS_TABLEAU = Object.freeze([
  "unites",
  "dixiemes",
  "centiemes",
  "milliemes",
]);
const POLICE = TYPOGRAPHIE.texte.replaceAll('"', "'");

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (caractere) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    })[caractere]);
}

function arrondi2(nombre) {
  return Number.parseFloat(Number(nombre).toFixed(2));
}

function nombreSvg(nombre) {
  return String(arrondi2(nombre));
}

function lireLargeur(largeur, nomFonction) {
  if (!Number.isFinite(largeur)) {
    throw new TypeError(`${nomFonction} : largeur finie requise`);
  }
  if (largeur < LARGEUR_MINIMALE || largeur > LARGEUR_MAXIMALE) {
    throw new RangeError(
      `${nomFonction} : largeur comprise entre ${LARGEUR_MINIMALE} et ${LARGEUR_MAXIMALE} requise`,
    );
  }
  return arrondi2(largeur);
}

function verifierNombreDePieces(valeur, nom, maximum) {
  if (!Number.isSafeInteger(valeur)) {
    throw new TypeError(`${nom} : entier sûr requis`);
  }
  if (valeur < 0 || valeur > maximum) {
    throw new RangeError(`${nom} : valeur comprise entre 0 et ${maximum} requise`);
  }
}

function verifierOrientation(orientation) {
  if (!ORIENTATIONS_MATERIEL_NUMERATION_DECIMALE.includes(orientation)) {
    throw new RangeError(
      `dessinerMaterielNumerationDecimale : orientation invalide « ${orientation} »`,
    );
  }
}

function attributsSvg(largeur, hauteur, texteAlternatif, donnees = "") {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" ` +
    `width="${largeur}" height="${hauteur}" role="img" ` +
    `aria-label="${echapper(texteAlternatif)}" preserveAspectRatio="xMidYMid meet" ` +
    `style="max-width:100%;height:auto"${donnees}>`
  );
}

function cheminGrilleUnite(cellule) {
  const taille = 10 * cellule;
  const commandes = [];
  for (let index = 1; index < 10; index += 1) {
    if (index === 5) continue;
    const position = nombreSvg(index * cellule);
    commandes.push(`M ${position} 0 V ${nombreSvg(taille)}`);
    commandes.push(`M 0 ${position} H ${nombreSvg(taille)}`);
  }
  return commandes.join(" ");
}

function cheminGrilleDixieme(cellule, orientation) {
  const commandes = [];
  for (let index = 1; index < 10; index += 1) {
    if (index === 5) continue;
    const position = nombreSvg(index * cellule);
    commandes.push(
      orientation === "horizontale"
        ? `M ${position} 0 V ${nombreSvg(cellule)}`
        : `M 0 ${position} H ${nombreSvg(cellule)}`,
    );
  }
  return commandes.join(" ");
}

function dessinerUnite(x, y, cellule, index) {
  const taille = nombreSvg(10 * cellule);
  const milieu = nombreSvg(5 * cellule);
  return (
    `<g class="nd-piece nd-unite" data-piece-index="${index}" ` +
    `data-largeur-cellules="10" data-hauteur-cellules="10" ` +
    `transform="translate(${nombreSvg(x)} ${nombreSvg(y)})">` +
    `<rect class="nd-forme" x="0" y="0" width="${taille}" height="${taille}" ` +
    `fill="${COULEURS_NUMERATION_DECIMALE.unite}" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.25"/>` +
    `<path class="nd-grille" d="${cheminGrilleUnite(cellule)}" fill="none" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="0.55"/>` +
    `<path class="nd-separation-cinq" d="M ${milieu} 0 V ${taille} M 0 ${milieu} H ${taille}" ` +
    `fill="none" stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.35"/>` +
    `</g>`
  );
}

function dessinerDixieme(x, y, cellule, orientation, index) {
  const largeur = orientation === "horizontale" ? 10 * cellule : cellule;
  const hauteur = orientation === "horizontale" ? cellule : 10 * cellule;
  const milieu = nombreSvg(5 * cellule);
  const separation = orientation === "horizontale"
    ? `M ${milieu} 0 V ${nombreSvg(hauteur)}`
    : `M 0 ${milieu} H ${nombreSvg(largeur)}`;
  return (
    `<g class="nd-piece nd-dixieme" data-piece-index="${index}" ` +
    `data-largeur-cellules="${orientation === "horizontale" ? 10 : 1}" ` +
    `data-hauteur-cellules="${orientation === "horizontale" ? 1 : 10}" ` +
    `transform="translate(${nombreSvg(x)} ${nombreSvg(y)})">` +
    `<rect class="nd-forme" x="0" y="0" width="${nombreSvg(largeur)}" ` +
    `height="${nombreSvg(hauteur)}" fill="${COULEURS_NUMERATION_DECIMALE.dixieme}" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.25"/>` +
    `<path class="nd-grille" d="${cheminGrilleDixieme(cellule, orientation)}" fill="none" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="0.55"/>` +
    `<path class="nd-separation-cinq" d="${separation}" fill="none" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.35"/>` +
    `</g>`
  );
}

function dessinerCentieme(x, y, cellule, index) {
  return (
    `<g class="nd-piece nd-centieme" data-piece-index="${index}" ` +
    `data-largeur-cellules="1" data-hauteur-cellules="1" ` +
    `transform="translate(${nombreSvg(x)} ${nombreSvg(y)})">` +
    `<rect class="nd-forme" x="0" y="0" width="${nombreSvg(cellule)}" ` +
    `height="${nombreSvg(cellule)}" fill="${COULEURS_NUMERATION_DECIMALE.centieme}" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.1"/>` +
    `</g>`
  );
}

function libelleSection(y, contenu) {
  return (
    `<text class="nd-libelle-section" x="${MARGE}" y="${nombreSvg(y)}" ` +
    `font-family="${POLICE}" font-size="14" font-weight="700" ` +
    `fill="${COULEURS_NUMERATION_DECIMALE.encre}">${echapper(contenu)}</text>`
  );
}

function disposerUnites(nombre, cellule, largeur, yDepart) {
  const taille = 10 * cellule;
  const espace = Math.max(6, cellule * 0.55);
  const disponible = largeur - 2 * MARGE;
  const parLigne = Math.max(1, Math.floor((disponible + espace) / (taille + espace)));
  const morceaux = [libelleSection(yDepart + 15, "Unités")];
  const yPieces = yDepart + 24;
  for (let index = 0; index < nombre; index += 1) {
    const colonne = index % parLigne;
    const ligne = Math.floor(index / parLigne);
    morceaux.push(
      dessinerUnite(
        MARGE + colonne * (taille + espace),
        yPieces + ligne * (taille + espace),
        cellule,
        index + 1,
      ),
    );
  }
  const lignes = Math.ceil(nombre / parLigne);
  return Object.freeze({
    svg: morceaux.join(""),
    bas: yPieces + lignes * taille + Math.max(0, lignes - 1) * espace,
  });
}

function disposerDixiemes(nombre, cellule, orientation, yDepart) {
  // Les pièces doivent rester visuellement dénombrables : un filet blanc trop
  // fin les faisait lire comme une seule grille continue sur téléphone.
  const espace = Math.max(3, cellule * 0.22);
  const morceaux = [libelleSection(yDepart + 15, "Dixièmes")];
  const yPieces = yDepart + 24;

  if (orientation === "horizontale") {
    let y = yPieces;
    for (let index = 0; index < nombre; index += 1) {
      if (index > 0) y += espace;
      morceaux.push(dessinerDixieme(MARGE, y, cellule, orientation, index + 1));
      y += cellule;
    }
    return Object.freeze({ svg: morceaux.join(""), bas: y });
  }

  const parLigne = 10;
  let bas = yPieces;
  for (let index = 0; index < nombre; index += 1) {
    const colonne = index % parLigne;
    const ligne = Math.floor(index / parLigne);
    const x = MARGE + colonne * (cellule + espace);
    const y = yPieces + ligne * (10 * cellule + Math.max(8, cellule * 0.75));
    morceaux.push(dessinerDixieme(x, y, cellule, orientation, index + 1));
    bas = Math.max(bas, y + 10 * cellule);
  }
  return Object.freeze({ svg: morceaux.join(""), bas });
}

function disposerCentiemes(nombre, cellule, yDepart) {
  const espace = Math.max(3, cellule * 0.22);
  const morceaux = [libelleSection(yDepart + 15, "Centièmes")];
  const yPieces = yDepart + 24;
  let bas = yPieces;
  for (let index = 0; index < nombre; index += 1) {
    const colonne = index % 10;
    const ligne = Math.floor(index / 10);
    const x = MARGE + colonne * (cellule + espace);
    const y = yPieces + ligne * (cellule + espace);
    morceaux.push(dessinerCentieme(x, y, cellule, index + 1));
    bas = Math.max(bas, y + cellule);
  }
  return Object.freeze({ svg: morceaux.join(""), bas });
}

function motCompte(nombre, singulier, pluriel) {
  return `${nombre} ${nombre === 1 ? singulier : pluriel}`;
}

function texteAlternatifMateriel(unites, dixiemes, centiemes, orientation) {
  const quantites = [
    unites > 0 ? motCompte(unites, "unité", "unités") : null,
    dixiemes > 0 ? motCompte(dixiemes, "dixième", "dixièmes") : null,
    centiemes > 0 ? motCompte(centiemes, "centième", "centièmes") : null,
  ].filter(Boolean);
  if (quantites.length === 0) {
    return "Matériel de numération décimale : aucune pièce.";
  }
  const enumeration = quantites.length === 1
    ? quantites[0]
    : `${quantites.slice(0, -1).join(", ")} et ${quantites.at(-1)}`;
  const precision = dixiemes > 0
    ? ` Les dixièmes sont orientés ${orientation === "horizontale" ? "horizontalement" : "verticalement"}.`
    : "";
  return `Matériel de numération décimale : ${enumeration}.${precision}`;
}

function tailleCellulePour(largeur, unites) {
  const disponible = largeur - 2 * MARGE;
  const colonnesUnites = unites > 0
    ? Math.min(unites, largeur >= 600 ? 3 : 2)
    : 1;
  // Une unité occupe 10 cellules. Entre deux unités, le plateau conserve
  // environ 0,55 cellule de respiration (avec un minimum effectif de 6 px).
  // On dimensionne d'abord pour faire tenir la ligne utile, puis on plafonne
  // à 28 px : c'est la cellule exacte du plateau historique.
  const denominateur = 10 * colonnesUnites + 0.55 * (colonnesUnites - 1);
  return arrondi2(Math.max(8, Math.min(28, disponible / denominateur)));
}

/**
 * Dessine le matériel décimal avec une échelle commune à toutes les pièces.
 *
 * @param {object} [options]
 * @param {number} [options.unites=0] nombre de carrés 10 × 10
 * @param {number} [options.dixiemes=0] nombre de barres 10 × 1 ou 1 × 10
 * @param {number} [options.centiemes=0] nombre de carrés 1 × 1
 * @param {"horizontale"|"verticale"} [options.orientation="horizontale"]
 * @param {number} [options.largeur=320] largeur du viewBox, de 240 à 1600
 */
export function dessinerMaterielNumerationDecimale({
  unites = 0,
  dixiemes = 0,
  centiemes = 0,
  orientation = "horizontale",
  largeur = LARGEUR_PAR_DEFAUT,
} = {}) {
  verifierNombreDePieces(unites, "dessinerMaterielNumerationDecimale.unites", 99);
  verifierNombreDePieces(dixiemes, "dessinerMaterielNumerationDecimale.dixiemes", 99);
  verifierNombreDePieces(centiemes, "dessinerMaterielNumerationDecimale.centiemes", 999);
  verifierOrientation(orientation);
  const largeurLue = lireLargeur(largeur, "dessinerMaterielNumerationDecimale");
  const cellule = tailleCellulePour(largeurLue, unites);
  const sections = [];
  let y = MARGE;

  const ajouterSection = (disposition) => {
    sections.push(disposition.svg);
    y = disposition.bas + 16;
  };
  if (unites > 0) ajouterSection(disposerUnites(unites, cellule, largeurLue, y));
  if (dixiemes > 0) ajouterSection(disposerDixiemes(dixiemes, cellule, orientation, y));
  if (centiemes > 0) ajouterSection(disposerCentiemes(centiemes, cellule, y));
  if (sections.length === 0) {
    sections.push(
      `<text class="nd-vide" x="${largeurLue / 2}" y="42" text-anchor="middle" ` +
      `font-family="${POLICE}" font-size="14" fill="${COULEURS_NUMERATION_DECIMALE.encre}">` +
      `Aucune pièce</text>`,
    );
    y = 64;
  }

  const hauteur = arrondi2(Math.max(72, y - 4));
  const alternatif = texteAlternatifMateriel(unites, dixiemes, centiemes, orientation);
  const valeurCentiemes = unites * 100 + dixiemes * 10 + centiemes;
  const svg =
    attributsSvg(
      largeurLue,
      hauteur,
      alternatif,
      ` data-orientation="${orientation}" data-valeur-centiemes="${valeurCentiemes}"`,
    ) +
    `<g aria-hidden="true">${sections.join("")}</g></svg>`;

  return Object.freeze({
    svg,
    largeur: largeurLue,
    hauteur,
    texteAlternatif: alternatif,
    unites,
    dixiemes,
    centiemes,
    orientation,
    tailleCellule: cellule,
    valeurCentiemes,
  });
}

function verifierRangMisEnEvidence(rangMisEnEvidence) {
  if (rangMisEnEvidence == null) return null;
  if (!RANGS_TABLEAU.includes(rangMisEnEvidence)) {
    throw new RangeError(
      `dessinerTableauNumerationDecimale : rangMisEnEvidence invalide « ${rangMisEnEvidence} »`,
    );
  }
  return rangMisEnEvidence;
}

function verifierAfficherLecture(afficherLecture) {
  if (typeof afficherLecture !== "boolean") {
    throw new TypeError(
      "dessinerTableauNumerationDecimale : afficherLecture doit être un booléen",
    );
  }
  return afficherLecture;
}

function texteAlternatifTableau(
  donnees,
  rangMisEnEvidence,
  afficherLecture,
  annoncerEcriture,
) {
  const contenu = donnees.colonnes.map(({ chiffre, libelle }) =>
    `${libelle.toLowerCase()} : ${chiffre ?? "case vide"}`).join(", ");
  const lecture = donnees.fractionLue.denominateur === 1
    ? `${donnees.fractionLue.numerateur} unités`
    : `${donnees.fractionLue.numerateur} ${donnees.colonnes
        .find(({ denominateur }) => denominateur === donnees.fractionLue.denominateur)
        .libelle.toLowerCase()}`;
  const evidence = rangMisEnEvidence
    ? ` La colonne des ${donnees.colonnes
        .find(({ id }) => id === rangMisEnEvidence).libelle.toLowerCase()} est mise en évidence.`
    : "";
  const lectureAccessible = afficherLecture
    ? ` Cette écriture se lit ${lecture}.`
    : "";
  const introduction = annoncerEcriture
    ? `Tableau de numération pour ${donnees.ecritureDecimale}`
    : "Tableau de numération à lire";
  return `${introduction} : ${contenu}.${lectureAccessible}${evidence}`;
}

function tailleChiffre(chiffre, largeurColonne) {
  const longueur = String(chiffre ?? "").length;
  if (longueur <= 2) return Math.min(26, largeurColonne * 0.42);
  return Math.max(13, Math.min(24, largeurColonne / (longueur * 0.62)));
}

/**
 * Dessine le tableau unités, dixièmes, centièmes, millièmes d'une écriture.
 *
 * @param {object} options
 * @param {string} options.ecritureDecimale écriture positive, au plus aux millièmes
 * @param {number} [options.largeur=320] largeur du viewBox, de 240 à 1600
 * @param {"unites"|"dixiemes"|"centiemes"|"milliemes"|null} [options.rangMisEnEvidence=null]
 * @param {boolean} [options.afficherLecture=true] affiche la lecture finale sous le tableau
 * @param {boolean} [options.annoncerEcriture=true] nomme l'écriture décimale dans le texte accessible
 */
export function dessinerTableauNumerationDecimale({
  ecritureDecimale,
  largeur = LARGEUR_PAR_DEFAUT,
  rangMisEnEvidence = null,
  afficherLecture = true,
  annoncerEcriture = true,
} = {}) {
  const largeurLue = lireLargeur(largeur, "dessinerTableauNumerationDecimale");
  const evidence = verifierRangMisEnEvidence(rangMisEnEvidence);
  const lectureVisible = verifierAfficherLecture(afficherLecture);
  const ecritureAnnoncee = verifierAfficherLecture(annoncerEcriture);
  const donnees = construireDonneesTableauNumeration(ecritureDecimale);
  const hauteur = lectureVisible ? 132 : 108;
  const largeurTableau = largeurLue - 2 * MARGE;
  const largeurColonne = largeurTableau / donnees.colonnes.length;
  const yEntete = 12;
  const hauteurEntete = 36;
  const yValeur = yEntete + hauteurEntete;
  const hauteurValeur = 52;
  const tailleEntete = Math.max(9, Math.min(14, largeurColonne / 6.4));
  const colonnes = donnees.colonnes.map((colonne, index) => {
    const x = MARGE + index * largeurColonne;
    const active = colonne.id === evidence;
    const classe = `nd-tableau-colonne${active ? " nd-rang-actif" : ""}`;
    const couleursRang = COULEURS_RANGS_NUMERATION_DECIMALE[colonne.id];
    const trait = active ? COULEURS.bleu : couleursRang.texte;
    const chiffre = colonne.chiffre ?? "—";
    return (
      `<g class="${classe}" data-rang="${colonne.id}" ` +
      `data-chiffre="${colonne.chiffre ?? ""}" ` +
      `data-rang-actif="${active}">` +
      `<rect class="nd-entete" x="${nombreSvg(x)}" y="${yEntete}" ` +
      `width="${nombreSvg(largeurColonne)}" height="${hauteurEntete}" ` +
      `fill="${couleursRang.principale}" ` +
      `stroke="${trait}" stroke-width="${active ? 2 : 1}"/>` +
      `<rect class="nd-cellule" x="${nombreSvg(x)}" y="${yValeur}" ` +
      `width="${nombreSvg(largeurColonne)}" height="${hauteurValeur}" ` +
      `fill="${couleursRang.fond}" stroke="${trait}" stroke-width="${active ? 2 : 1}"/>` +
      `<text class="nd-nom-rang" x="${nombreSvg(x + largeurColonne / 2)}" ` +
      `y="${nombreSvg(yEntete + hauteurEntete / 2)}" text-anchor="middle" dominant-baseline="middle" ` +
      `font-family="${POLICE}" font-size="${nombreSvg(tailleEntete)}" font-weight="700" ` +
      `fill="${couleursRang.encreEntete}">${echapper(colonne.libelle)}</text>` +
      `<text class="nd-chiffre" x="${nombreSvg(x + largeurColonne / 2)}" ` +
      `y="${nombreSvg(yValeur + hauteurValeur / 2)}" text-anchor="middle" dominant-baseline="middle" ` +
      `font-family="${POLICE}" font-size="${nombreSvg(tailleChiffre(chiffre, largeurColonne))}" ` +
      `font-weight="800" fill="${couleursRang.texte}">${echapper(chiffre)}</text>` +
      `</g>`
    );
  });
  const lecture = donnees.fractionLue.denominateur === 1
    ? `${donnees.fractionLue.numerateur} unité${donnees.fractionLue.numerateur === 1 ? "" : "s"}`
    : `${donnees.fractionLue.numerateur} ${donnees.colonnes
        .find(({ denominateur }) => denominateur === donnees.fractionLue.denominateur)
        .libelle.toLowerCase()}`;
  const alternatif = texteAlternatifTableau(
    donnees,
    evidence,
    lectureVisible,
    ecritureAnnoncee,
  );
  const attributsFraction = lectureVisible
    ? ` data-numerateur="${donnees.fractionLue.numerateur}" ` +
      `data-denominateur="${donnees.fractionLue.denominateur}"`
    : "";
  const attributEcriture = ecritureAnnoncee
    ? ` data-ecriture-decimale="${echapper(donnees.ecritureDecimale)}"`
    : "";
  const svg =
    attributsSvg(
      largeurLue,
      hauteur,
      alternatif,
      `${attributEcriture} data-afficher-lecture="${lectureVisible}"${attributsFraction}`,
    ) +
    `<g aria-hidden="true">${colonnes.join("")}` +
    (lectureVisible
      ? `<text class="nd-lecture" x="${largeurLue / 2}" y="120" text-anchor="middle" ` +
        `font-family="${POLICE}" font-size="13" font-weight="650" ` +
        `fill="${COULEURS_NUMERATION_DECIMALE.encre}">${echapper(
          `${donnees.ecritureDecimale} : ${lecture}`,
        )}</text>`
      : "") +
    `</g></svg>`;

  return Object.freeze({
    svg,
    largeur: largeurLue,
    hauteur,
    texteAlternatif: alternatif,
    ecritureDecimale: donnees.ecritureDecimale,
    colonnes: donnees.colonnes,
    dernierRang: donnees.dernierRang,
    fractionLue: donnees.fractionLue,
    rangMisEnEvidence: evidence,
    afficherLecture: lectureVisible,
    annoncerEcriture: ecritureAnnoncee,
  });
}
