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
} from "../../charte/src/charte.js?v=38";
import { construireDonneesTableauNumeration } from "./fractions-decimaux.js?v=38";
import {
  mesurerEcritureFractionSvg,
  rendreFractionSvg,
} from "./expressions.js?v=38";

export const VERSION_NUMERATION_DECIMALE = 7;

export const ORIENTATIONS_MATERIEL_NUMERATION_DECIMALE = Object.freeze([
  "horizontale",
  "verticale",
]);

const LARGEUR_PAR_DEFAUT = 320;
const LARGEUR_MINIMALE = 240;
const LARGEUR_MAXIMALE = 1600;
const MARGE = 12;
export const ECHANGES_RANGS_NUMERATION_DECIMALE = Object.freeze([
  "unite-dixiemes",
  "dixieme-centiemes",
  "unite-centiemes",
]);
export const ETATS_CONVERSION_RANGS_NUMERATION_DECIMALE = Object.freeze([
  "decompose",
  "converti-rang-final",
]);
export const SENS_CONVERSION_RANGS_NUMERATION_DECIMALE = Object.freeze([
  "fraction-vers-decimal",
  "decimal-vers-fraction",
]);
export const PROFILS_CONVERSION_RANGS_NUMERATION_DECIMALE = Object.freeze([
  "solution",
  "aide-nc03",
  "aide-nc04",
]);
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

function dessinerUnite(
  x,
  y,
  cellule,
  index,
  couleur = COULEURS_NUMERATION_DECIMALE.unite,
) {
  const taille = nombreSvg(10 * cellule);
  const milieu = nombreSvg(5 * cellule);
  return (
    `<g class="nd-piece nd-unite" data-piece-index="${index}" ` +
    `data-largeur-cellules="10" data-hauteur-cellules="10" ` +
    `transform="translate(${nombreSvg(x)} ${nombreSvg(y)})">` +
    `<rect class="nd-forme" x="0" y="0" width="${taille}" height="${taille}" ` +
    `fill="${couleur}" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.25"/>` +
    `<path class="nd-grille" d="${cheminGrilleUnite(cellule)}" fill="none" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="0.55"/>` +
    `<path class="nd-separation-cinq" d="M ${milieu} 0 V ${taille} M 0 ${milieu} H ${taille}" ` +
    `fill="none" stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.35"/>` +
    `</g>`
  );
}

function dessinerDixieme(
  x,
  y,
  cellule,
  orientation,
  index,
  couleur = COULEURS_NUMERATION_DECIMALE.dixieme,
) {
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
    `height="${nombreSvg(hauteur)}" fill="${couleur}" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.25"/>` +
    `<path class="nd-grille" d="${cheminGrilleDixieme(cellule, orientation)}" fill="none" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="0.55"/>` +
    `<path class="nd-separation-cinq" d="${separation}" fill="none" ` +
    `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1.35"/>` +
    `</g>`
  );
}

function dessinerCentieme(
  x,
  y,
  cellule,
  index,
  couleur = COULEURS_NUMERATION_DECIMALE.centieme,
) {
  return (
    `<g class="nd-piece nd-centieme" data-piece-index="${index}" ` +
    `data-largeur-cellules="1" data-hauteur-cellules="1" ` +
    `transform="translate(${nombreSvg(x)} ${nombreSvg(y)})">` +
    `<rect class="nd-forme" x="0" y="0" width="${nombreSvg(cellule)}" ` +
    `height="${nombreSvg(cellule)}" fill="${couleur}" ` +
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

function verifierEchangeRangs(type) {
  if (!ECHANGES_RANGS_NUMERATION_DECIMALE.includes(type)) {
    throw new RangeError(
      `dessinerEchangeRangsNumerationDecimale : échange invalide « ${type} »`,
    );
  }
  return type;
}

function largeurEntierSvg(valeur, taille) {
  return Math.max(taille * 0.72, String(valeur).length * taille * 0.62);
}

function mesurerEcritureRang(specification, taille) {
  if (specification.type === "fraction") {
    return mesurerEcritureFractionSvg(
      specification.numerateur,
      specification.denominateur,
      { taille },
    ).largeur;
  }
  return largeurEntierSvg(specification.valeur, taille);
}

function rendreEcritureRang(specification, centreX, yBarre, taille) {
  const couleur = COULEURS_RANGS_NUMERATION_DECIMALE[specification.rang].textePedagogique;
  if (specification.type === "fraction") {
    return rendreFractionSvg(
      specification.numerateur,
      specification.denominateur,
      {
        centreX,
        yBarre,
        taille,
        couleur,
        classe: `nd-echange-fraction-${specification.rang}`,
        libelleAccessible: null,
      },
    );
  }
  return (
    `<text class="nd-echange-entier nd-echange-entier-${specification.rang}" ` +
    `x="${nombreSvg(centreX)}" y="${nombreSvg(yBarre)}" text-anchor="middle" ` +
    `dominant-baseline="middle" font-family="${POLICE}" font-size="${nombreSvg(taille)}" ` +
    `font-weight="800" fill="${couleur}">${echapper(specification.valeur)}</text>`
  );
}

function rendreEgaliteDansZone(
  gauche,
  droite,
  xZone,
  largeurZone,
  yBarre,
  taille,
) {
  const largeurGauche = mesurerEcritureRang(gauche, taille);
  const largeurDroite = mesurerEcritureRang(droite, taille);
  const largeurSigne = taille * 0.7;
  const espace = taille * 0.62;
  const largeurTotale = largeurGauche + largeurDroite + largeurSigne + 2 * espace;
  const depart = xZone + (largeurZone - largeurTotale) / 2;
  const centreGauche = depart + largeurGauche / 2;
  const centreSigne = depart + largeurGauche + espace + largeurSigne / 2;
  const centreDroite = depart + largeurGauche + 2 * espace + largeurSigne + largeurDroite / 2;
  return (
    rendreEcritureRang(gauche, centreGauche, yBarre, taille) +
    `<text class="nd-echange-egal" x="${nombreSvg(centreSigne)}" ` +
    `y="${nombreSvg(yBarre)}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="${POLICE}" font-size="${nombreSvg(taille)}" font-weight="800" ` +
    `fill="${COULEURS_NUMERATION_DECIMALE.encre}">=</text>` +
    rendreEcritureRang(droite, centreDroite, yBarre, taille)
  );
}

/**
 * Montre un échange de rang sans changer l'empreinte de la quantité.
 *
 * Une unité et ses dix dixièmes occupent exactement le même rectangle ;
 * un dixième et ses dix centièmes aussi, comme une unité et ses cent
 * centièmes. Les séparations sont tracées à
 * l'intérieur de l'empreinte au lieu d'ajouter des espaces entre les pièces.
 *
 * @param {object} [options]
 * @param {"unite-dixiemes"|"dixieme-centiemes"|"unite-centiemes"} [options.echange="unite-dixiemes"]
 * @param {number} [options.largeur=320] largeur du viewBox, de 240 à 1600
 */
export function dessinerEchangeRangsNumerationDecimale({
  echange = "unite-dixiemes",
  largeur = LARGEUR_PAR_DEFAUT,
} = {}) {
  const type = verifierEchangeRangs(echange);
  const largeurLue = lireLargeur(largeur, "dessinerEchangeRangsNumerationDecimale");
  const espaceCentral = Math.max(40, Math.min(72, largeurLue * 0.14));
  const largeurEmpreinte = arrondi2(Math.min(
    180,
    (largeurLue - 2 * MARGE - espaceCentral) / 2,
  ));
  const cellule = arrondi2(largeurEmpreinte / 10);
  const largeurEnsemble = 2 * largeurEmpreinte + espaceCentral;
  const xGauche = arrondi2((largeurLue - largeurEnsemble) / 2);
  const xDroite = arrondi2(xGauche + largeurEmpreinte + espaceCentral);
  const yForme = MARGE;
  const hauteurEmpreinte = type === "dixieme-centiemes" ? cellule : largeurEmpreinte;
  const yMilieu = arrondi2(yForme + hauteurEmpreinte / 2);
  const tailleFleche = Math.max(22, Math.min(34, espaceCentral * 0.58));
  const tailleEcriture = Math.max(16, Math.min(20, largeurLue / 20));
  const yBarre = arrondi2(yForme + hauteurEmpreinte + tailleEcriture * 1.65);
  const debordEcriture = mesurerEcritureFractionSvg(10, 100, {
    taille: tailleEcriture,
  }).debordBas;
  const hauteur = arrondi2(yBarre + debordEcriture + MARGE);
  const morceaux = [
    `<rect class="nd-echange-empreinte nd-echange-empreinte-gauche" ` +
      `x="${xGauche}" y="${yForme}" width="${largeurEmpreinte}" ` +
      `height="${hauteurEmpreinte}" fill="none" stroke="none"/>`,
    `<rect class="nd-echange-empreinte nd-echange-empreinte-droite" ` +
      `x="${xDroite}" y="${yForme}" width="${largeurEmpreinte}" ` +
      `height="${hauteurEmpreinte}" fill="none" stroke="none"/>`,
  ];
  let gauche;
  let droite;
  let alternatif;

  if (type === "unite-dixiemes") {
    morceaux.push(dessinerUnite(xGauche, yForme, cellule, 1));
    for (let index = 0; index < 10; index += 1) {
      morceaux.push(
        dessinerDixieme(
          xDroite,
          yForme + index * cellule,
          cellule,
          "horizontale",
          index + 1,
        ),
      );
    }
    gauche = { type: "entier", valeur: 1, rang: "unites" };
    droite = { type: "fraction", numerateur: 10, denominateur: 10, rang: "dixiemes" };
    alternatif = "Une unité rouge et dix dixièmes verts occupent exactement la même empreinte. Une unité égale dix dixièmes.";
  } else if (type === "dixieme-centiemes") {
    morceaux.push(
      dessinerDixieme(xGauche, yForme, cellule, "horizontale", 1),
    );
    for (let index = 0; index < 10; index += 1) {
      morceaux.push(
        dessinerCentieme(
          xDroite + index * cellule,
          yForme,
          cellule,
          index + 1,
        ),
      );
    }
    gauche = { type: "fraction", numerateur: 1, denominateur: 10, rang: "dixiemes" };
    droite = { type: "fraction", numerateur: 10, denominateur: 100, rang: "centiemes" };
    alternatif = "Un dixième vert et dix centièmes jaunes occupent exactement la même empreinte. Un dixième égale dix centièmes.";
  } else {
    morceaux.push(dessinerUnite(xGauche, yForme, cellule, 1));
    for (let ligne = 0; ligne < 10; ligne += 1) {
      for (let colonne = 0; colonne < 10; colonne += 1) {
        morceaux.push(
          dessinerCentieme(
            xDroite + colonne * cellule,
            yForme + ligne * cellule,
            cellule,
            ligne * 10 + colonne + 1,
          ),
        );
      }
    }
    gauche = { type: "entier", valeur: 1, rang: "unites" };
    droite = { type: "fraction", numerateur: 100, denominateur: 100, rang: "centiemes" };
    alternatif = "Une unité rouge et cent centièmes jaunes occupent exactement la même empreinte. Une unité égale cent centièmes.";
  }

  morceaux.push(
    `<text class="nd-echange-fleche" x="${nombreSvg(largeurLue / 2)}" ` +
      `y="${yMilieu}" text-anchor="middle" dominant-baseline="middle" ` +
      `font-family="${POLICE}" font-size="${nombreSvg(tailleFleche)}" font-weight="800" ` +
      `fill="${COULEURS.bleu}">↔</text>`,
    rendreEcritureRang(
      gauche,
      xGauche + largeurEmpreinte / 2,
      yBarre,
      tailleEcriture,
    ),
    `<text class="nd-echange-egal" x="${nombreSvg(largeurLue / 2)}" ` +
      `y="${nombreSvg(yBarre)}" text-anchor="middle" dominant-baseline="middle" ` +
      `font-family="${POLICE}" font-size="${nombreSvg(tailleEcriture)}" font-weight="800" ` +
      `fill="${COULEURS_NUMERATION_DECIMALE.encre}">=</text>`,
    rendreEcritureRang(
      droite,
      xDroite + largeurEmpreinte / 2,
      yBarre,
      tailleEcriture,
    ),
  );

  const svg =
    attributsSvg(
      largeurLue,
      hauteur,
      alternatif,
      ` data-echange="${type}" data-largeur-empreinte="${largeurEmpreinte}" ` +
        `data-hauteur-empreinte="${hauteurEmpreinte}"`,
    ) +
    `<g aria-hidden="true">${morceaux.join("")}</g></svg>`;

  return Object.freeze({
    svg,
    largeur: largeurLue,
    hauteur,
    texteAlternatif: alternatif,
    echange: type,
    tailleCellule: cellule,
    empreinte: Object.freeze({
      largeur: largeurEmpreinte,
      hauteur: hauteurEmpreinte,
    }),
  });
}

function verifierEtatConversionRangs(etat) {
  if (!ETATS_CONVERSION_RANGS_NUMERATION_DECIMALE.includes(etat)) {
    throw new RangeError(
      `dessinerConversionRangsNumerationDecimale : état invalide « ${etat} »`,
    );
  }
  return etat;
}

function verifierSensConversionRangs(sens) {
  if (!SENS_CONVERSION_RANGS_NUMERATION_DECIMALE.includes(sens)) {
    throw new RangeError(
      `dessinerConversionRangsNumerationDecimale : sens invalide « ${sens} »`,
    );
  }
  return sens;
}

function verifierProfilConversionRangs(profil) {
  if (!PROFILS_CONVERSION_RANGS_NUMERATION_DECIMALE.includes(profil)) {
    throw new RangeError(
      `dessinerConversionRangsNumerationDecimale : profil invalide « ${profil} »`,
    );
  }
  return profil;
}

function specificationSourceConversion(rang, quantite) {
  if (rang === "unites") {
    return Object.freeze({ type: "entier", valeur: quantite, rang });
  }
  const denominateur = rang === "dixiemes" ? 10 : 100;
  return Object.freeze({ type: "fraction", numerateur: quantite, denominateur, rang });
}

function specificationCibleConversion(rang, quantite, rangFinal) {
  const indexRang = RANGS_TABLEAU.indexOf(rang);
  const indexFinal = RANGS_TABLEAU.indexOf(rangFinal);
  const denominateur = 10 ** indexFinal;
  const facteur = 10 ** (indexFinal - indexRang);
  return Object.freeze({
    type: "fraction",
    numerateur: quantite * facteur,
    denominateur,
    rang: rangFinal,
  });
}

function texteSpecification(specification) {
  return specification.type === "fraction"
    ? `${specification.numerateur}/${specification.denominateur}`
    : String(specification.valeur);
}

function specificationsLegendeConversion(source, cible, sens, profil, etat) {
  const specificationsIdentiques = texteSpecification(source) === texteSpecification(cible);
  const etatInitial =
    (sens === "fraction-vers-decimal" && etat === "converti-rang-final")
    || (sens === "decimal-vers-fraction" && etat === "decompose");
  if (etatInitial) {
    const specificationInitiale = sens === "fraction-vers-decimal" ? cible : source;
    const unique =
      profil === "aide-nc04"
      && specificationsIdentiques
      && specificationInitiale.type === "fraction"
        ? Object.freeze({ ...specificationInitiale, numerateur: "?" })
        : specificationInitiale;
    return Object.freeze({ unique, texte: texteSpecification(unique) });
  }
  if (specificationsIdentiques) {
    const unique = profil === "aide-nc04" && source.type === "fraction"
      ? Object.freeze({ ...source, numerateur: "?" })
      : source;
    return Object.freeze({ unique, texte: texteSpecification(unique) });
  }
  const cibleVisible = profil === "aide-nc04" && cible.type === "fraction"
    ? Object.freeze({ ...cible, numerateur: "?" })
    : cible;
  const [gauche, droite] = sens === "fraction-vers-decimal"
    ? [cibleVisible, source]
    : [source, cibleVisible];
  return Object.freeze({
    gauche,
    droite,
    texte: `${texteSpecification(gauche)}=${texteSpecification(droite)}`,
  });
}

function largeurEgaliteLocale(gauche, droite, taille) {
  return (
    mesurerEcritureRang(gauche, taille)
    + mesurerEcritureRang(droite, taille)
    + taille * (0.7 + 2 * 0.62)
  );
}

function tailleEgaliteLocale(gauche, droite, largeurDisponible) {
  for (let taille = 18; taille >= 12; taille -= 0.5) {
    if (largeurEgaliteLocale(gauche, droite, taille) <= largeurDisponible - 4) {
      return taille;
    }
  }
  return 12;
}

function geometrieGroupeConversion(rang, quantite, cellule, largeurVisuelle) {
  if (rang === "unites") {
    const colonnes = Math.min(3, quantite);
    const lignes = Math.ceil(quantite / colonnes);
    const espace = Math.max(4, cellule * 0.5);
    return Object.freeze({
      largeur: arrondi2(colonnes * 10 * cellule + (colonnes - 1) * espace),
      hauteur: arrondi2(lignes * 10 * cellule + (lignes - 1) * espace),
      colonnes,
      espace: arrondi2(espace),
      largeurVisuelle,
    });
  }
  if (rang === "dixiemes") {
    return Object.freeze({
      largeur: arrondi2(10 * cellule),
      hauteur: arrondi2(quantite * cellule),
      colonnes: 1,
      espace: 0,
      largeurVisuelle,
    });
  }
  return Object.freeze({
    largeur: arrondi2(quantite * cellule),
    hauteur: cellule,
    colonnes: quantite,
    espace: 0,
    largeurVisuelle,
  });
}

function dessinerGroupeConversion({
  rang,
  quantite,
  x,
  y,
  cellule,
  geometrie,
  couleur,
}) {
  const morceaux = [
    `<rect class="nd-conversion-empreinte" x="${nombreSvg(x)}" y="${nombreSvg(y)}" ` +
      `width="${nombreSvg(geometrie.largeur)}" height="${nombreSvg(geometrie.hauteur)}" ` +
      `fill="none" stroke="none"/>`,
  ];
  if (rang === "unites") {
    for (let index = 0; index < quantite; index += 1) {
      const colonne = index % geometrie.colonnes;
      const ligne = Math.floor(index / geometrie.colonnes);
      morceaux.push(
        dessinerUnite(
          x + colonne * (10 * cellule + geometrie.espace),
          y + ligne * (10 * cellule + geometrie.espace),
          cellule,
          index + 1,
          couleur,
        ),
      );
    }
  } else if (rang === "dixiemes") {
    for (let index = 0; index < quantite; index += 1) {
      morceaux.push(
        dessinerDixieme(
          x,
          y + index * cellule,
          cellule,
          "horizontale",
          index + 1,
          couleur,
        ),
      );
    }
  } else {
    for (let index = 0; index < quantite; index += 1) {
      morceaux.push(
        dessinerCentieme(
          x + index * cellule,
          y,
          cellule,
          index + 1,
          couleur,
        ),
      );
    }
  }
  return morceaux.join("");
}

function rendreLegendeConversion({
  source,
  cible,
  sens,
  profil,
  etat,
  x,
  largeur,
  yBarre,
}) {
  const legende = specificationsLegendeConversion(source, cible, sens, profil, etat);
  if (legende.unique) {
    const taille = Math.max(14, Math.min(18, largeur / 4.8));
    return rendreEcritureRang(legende.unique, x + largeur / 2, yBarre, taille);
  }
  const taille = tailleEgaliteLocale(legende.gauche, legende.droite, largeur);
  return rendreEgaliteDansZone(
    legende.gauche,
    legende.droite,
    x,
    largeur,
    yBarre,
    taille,
  );
}

/**
 * Décompose une écriture au dixième ou au centième puis convertit chaque
 * groupe dans son dernier rang sans jamais changer sa géométrie.
 *
 * `decompose` conserve le langage rouge / vert / jaune des rangs.
 * `converti-rang-final` recolore les mêmes empreintes avec la couleur du
 * rang cible : une unité devient 10 dixièmes ou 100 centièmes.
 * Dans l'état de départ du sens choisi, chaque quantité est seulement nommée
 * dans son rang. Les égalités de conversion n'apparaissent qu'après l'échange.
 * Le sens fixe alors l'ordre des deux membres des légendes locales.
 *
 * @param {object} options
 * @param {string} options.ecritureDecimale écriture positive finissant aux dixièmes ou centièmes
 * @param {"decompose"|"converti-rang-final"} [options.etat="decompose"]
 * @param {"fraction-vers-decimal"|"decimal-vers-fraction"} [options.sens="fraction-vers-decimal"]
 * @param {"solution"|"aide-nc03"|"aide-nc04"} [options.profil="solution"]
 * @param {"dixiemes"|"centiemes"|null} [options.rangFinal=null]
 *   conserve un zéro final imposé par le dénominateur de la tâche
 * @param {number} [options.largeur=560] largeur du viewBox, de 240 à 1600
 */
export function dessinerConversionRangsNumerationDecimale({
  ecritureDecimale,
  etat = "decompose",
  sens = "fraction-vers-decimal",
  profil = "solution",
  rangFinal: rangFinalDemande = null,
  largeur = 560,
} = {}) {
  const etatLu = verifierEtatConversionRangs(etat);
  const sensLu = verifierSensConversionRangs(sens);
  const profilLu = verifierProfilConversionRangs(profil);
  if (
    (profilLu === "aide-nc03" && sensLu !== "fraction-vers-decimal")
    || (profilLu === "aide-nc04" && sensLu !== "decimal-vers-fraction")
  ) {
    throw new RangeError(
      "dessinerConversionRangsNumerationDecimale : profil d’aide incompatible avec le sens",
    );
  }
  const largeurLue = lireLargeur(largeur, "dessinerConversionRangsNumerationDecimale");
  const rangFinalLu = verifierRangFinal(rangFinalDemande);
  if (rangFinalLu && !["dixiemes", "centiemes"].includes(rangFinalLu)) {
    throw new RangeError(
      "dessinerConversionRangsNumerationDecimale : rangFinal limité aux dixièmes ou centièmes",
    );
  }
  const donnees = prolongerDonneesTableauJusquAuRang(
    construireDonneesTableauNumeration(ecritureDecimale),
    rangFinalLu,
  );
  if (!["dixiemes", "centiemes"].includes(donnees.dernierRang)) {
    throw new RangeError(
      "dessinerConversionRangsNumerationDecimale : une écriture au rang des dixièmes ou des centièmes est requise",
    );
  }
  const rangFinal = donnees.dernierRang;
  const indexFinal = RANGS_TABLEAU.indexOf(rangFinal);
  const denominateurFinal = 10 ** indexFinal;
  const nomRangFinal = rangFinal === "dixiemes" ? "dixièmes" : "centièmes";
  const nomRangFinalCompte = donnees.fractionLue.numerateur === 1
    ? rangFinal === "dixiemes" ? "dixième" : "centième"
    : nomRangFinal;
  const couleurRangFinal = rangFinal === "dixiemes"
    ? COULEURS_NUMERATION_DECIMALE.dixieme
    : COULEURS_NUMERATION_DECIMALE.centieme;
  const quantites = Object.fromEntries(
    donnees.colonnes.slice(0, 3).map(({ id, chiffre }) => [id, Number(chiffre)]),
  );
  if (quantites.unites > 9) {
    throw new RangeError(
      "dessinerConversionRangsNumerationDecimale : au plus 9 unités peuvent être représentées",
    );
  }

  const largeurLegendes = Math.max(88, Math.min(190, largeurLue * 0.36));
  const espaceColonnes = Math.max(12, Math.min(20, largeurLue * 0.035));
  const largeurVisuelle = largeurLue - 2 * MARGE - largeurLegendes - espaceColonnes;
  const colonnesUnites = Math.max(1, Math.min(3, quantites.unites || 1));
  const espaceUnitesEstime = 5 * (colonnesUnites - 1);
  const cellule = arrondi2(Math.max(4, Math.min(
    12,
    (largeurVisuelle - espaceUnitesEstime) / (10 * colonnesUnites),
  )));
  const xLegendes = MARGE + largeurVisuelle + espaceColonnes;
  const groupesBruts = RANGS_TABLEAU.slice(0, indexFinal + 1)
    .filter((rang) => quantites[rang] > 0)
    .map((rang) => ({
      rang,
      quantite: quantites[rang],
      source: specificationSourceConversion(rang, quantites[rang]),
      cible: specificationCibleConversion(rang, quantites[rang], rangFinal),
      geometrie: geometrieGroupeConversion(
        rang,
        quantites[rang],
        cellule,
        largeurVisuelle,
      ),
    }));
  const titre = sensLu === "fraction-vers-decimal"
    ? etatLu === "decompose"
      ? "Dans les rangs usuels"
      : `${donnees.fractionLue.numerateur} ${nomRangFinalCompte}`
    : etatLu === "decompose"
      ? `${donnees.ecritureDecimale} dans ses rangs`
      : `Tout dans le rang des ${nomRangFinal}`;
  const morceaux = [
    `<text class="nd-conversion-titre" x="${nombreSvg(largeurLue / 2)}" y="22" ` +
      `text-anchor="middle" font-family="${POLICE}" font-size="14" font-weight="700" ` +
      `fill="${COULEURS_NUMERATION_DECIMALE.encre}">${echapper(titre)}</text>`,
  ];
  const groupes = [];
  let y = 38;
  for (const groupe of groupesBruts) {
    const hauteurLigne = Math.max(56, groupe.geometrie.hauteur);
    const xGroupe = arrondi2(MARGE + (largeurVisuelle - groupe.geometrie.largeur) / 2);
    const yGroupe = arrondi2(y + (hauteurLigne - groupe.geometrie.hauteur) / 2);
    const couleur = etatLu === "converti-rang-final"
      ? couleurRangFinal
      : COULEURS_NUMERATION_DECIMALE[
          groupe.rang === "unites" ? "unite" : groupe.rang === "dixiemes" ? "dixieme" : "centieme"
        ];
    const donneesLegende = specificationsLegendeConversion(
      groupe.source,
      groupe.cible,
      sensLu,
      profilLu,
      etatLu,
    );
    const legende = donneesLegende.texte;
    morceaux.push(
      `<g class="nd-conversion-rang nd-conversion-${groupe.rang} ` +
        `nd-conversion-${etatLu}" data-rang="${groupe.rang}" ` +
        `data-quantite="${groupe.quantite}" data-legende="${legende}" ` +
        `data-x="${xGroupe}" data-y="${yGroupe}" ` +
        `data-largeur="${groupe.geometrie.largeur}" ` +
        `data-hauteur="${groupe.geometrie.hauteur}">`,
      dessinerGroupeConversion({
        rang: groupe.rang,
        quantite: groupe.quantite,
        x: xGroupe,
        y: yGroupe,
        cellule,
        geometrie: groupe.geometrie,
        couleur,
      }),
      rendreLegendeConversion({
        source: groupe.source,
        cible: groupe.cible,
        sens: sensLu,
        profil: profilLu,
        etat: etatLu,
        x: xLegendes,
        largeur: largeurLegendes,
        yBarre: y + hauteurLigne / 2,
      }),
      `</g>`,
    );
    groupes.push(Object.freeze({
      rang: groupe.rang,
      quantite: groupe.quantite,
      x: xGroupe,
      y: yGroupe,
      largeur: groupe.geometrie.largeur,
      hauteur: groupe.geometrie.hauteur,
      legende,
    }));
    y += hauteurLigne + 14;
  }
  const hauteur = arrondi2(Math.max(110, y - 2));
  const descriptions = groupes.map(({ rang, quantite, legende }) =>
    `${quantite} au rang ${rang}, ${legende}`).join(" ; ");
  const introductionAlternative = profilLu === "aide-nc03"
    ? `Conversion de ${donnees.fractionLue.numerateur} ${nomRangFinalCompte}.`
    : `Conversion par rang de ${donnees.ecritureDecimale}.`;
  const couleurNommee = rangFinal === "dixiemes" ? "verts" : "jaunes";
  const alternatif =
    `${introductionAlternative} ` +
    `${etatLu === "decompose" ? "Les couleurs distinguent les rangs." : `Tous les groupes sont convertis en ${nomRangFinal} ${couleurNommee}.`} ` +
    `Les empreintes ne changent pas. ${descriptions}.`;
  const attributEcriture = profilLu === "aide-nc03"
    ? ""
    : ` data-ecriture-decimale="${echapper(donnees.ecritureDecimale)}"`;
  const attributCible = profilLu === "aide-nc04"
    ? ""
    : ` data-numerateur-cible="${donnees.fractionLue.numerateur}" ` +
      `data-denominateur-cible="${denominateurFinal}"`;
  const svg =
    attributsSvg(
      largeurLue,
      hauteur,
      alternatif,
      `${attributEcriture} data-etat="${etatLu}" data-sens="${sensLu}" ` +
        `data-profil="${profilLu}" data-rang-final="${rangFinal}"${attributCible}`,
    ) +
    `<g aria-hidden="true">${morceaux.join("")}</g></svg>`;

  return Object.freeze({
    svg,
    largeur: largeurLue,
    hauteur,
    texteAlternatif: alternatif,
    ecritureDecimale: donnees.ecritureDecimale,
    etat: etatLu,
    sens: sensLu,
    profil: profilLu,
    rangFinal,
    tailleCellule: cellule,
    fractionCible: Object.freeze({
      numerateur: donnees.fractionLue.numerateur,
      denominateur: denominateurFinal,
    }),
    groupes: Object.freeze(groupes),
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

function verifierRangFinal(rangFinal) {
  if (rangFinal == null) return null;
  if (!RANGS_TABLEAU.includes(rangFinal)) {
    throw new RangeError(
      `dessinerTableauNumerationDecimale : rangFinal invalide « ${rangFinal} »`,
    );
  }
  return rangFinal;
}

function prolongerDonneesTableauJusquAuRang(donnees, rangFinal) {
  if (rangFinal == null || rangFinal === donnees.dernierRang) return donnees;
  const indexActuel = RANGS_TABLEAU.indexOf(donnees.dernierRang);
  const indexFinal = RANGS_TABLEAU.indexOf(rangFinal);
  if (indexFinal < indexActuel) {
    throw new RangeError(
      "dessinerTableauNumerationDecimale : rangFinal ne peut pas effacer un chiffre significatif",
    );
  }
  const facteur = 10 ** (indexFinal - indexActuel);
  const numerateur = donnees.fractionLue.numerateur * facteur;
  if (!Number.isSafeInteger(numerateur)) {
    throw new RangeError(
      "dessinerTableauNumerationDecimale : rangFinal produit un numérateur trop grand",
    );
  }
  const colonnes = donnees.colonnes.map((colonne, index) => Object.freeze({
    ...colonne,
    chiffre: index <= indexFinal ? (colonne.chiffre ?? "0") : null,
  }));
  const ecritureDecimale = indexFinal === 0
    ? colonnes[0].chiffre
    : `${colonnes[0].chiffre},${colonnes
        .slice(1, indexFinal + 1)
        .map(({ chiffre }) => chiffre)
        .join("")}`;
  return Object.freeze({
    ecritureDecimale,
    colonnes: Object.freeze(colonnes),
    dernierRang: rangFinal,
    fractionLue: Object.freeze({
      numerateur,
      denominateur: 10 ** indexFinal,
    }),
  });
}

function verifierAfficherLecture(afficherLecture) {
  if (typeof afficherLecture !== "boolean") {
    throw new TypeError(
      "dessinerTableauNumerationDecimale : afficherLecture doit être un booléen",
    );
  }
  return afficherLecture;
}

function lectureFractionTableau(donnees) {
  if (donnees.fractionLue.denominateur === 1) {
    return `${donnees.fractionLue.numerateur} unité${donnees.fractionLue.numerateur === 1 ? "" : "s"}`;
  }
  const colonne = donnees.colonnes
    .find(({ denominateur }) => denominateur === donnees.fractionLue.denominateur);
  const nomRang = colonne?.libelle.toLowerCase() ?? "unités";
  return `${donnees.fractionLue.numerateur} ${donnees.fractionLue.numerateur === 1
    ? nomRang.replace(/s$/, "")
    : nomRang}`;
}

function texteAlternatifTableau(
  donnees,
  rangMisEnEvidence,
  afficherChiffres,
  afficherLecture,
  annoncerEcriture,
) {
  const contenu = donnees.colonnes.map(({ chiffre, libelle }) =>
    `${libelle.toLowerCase()} : ${afficherChiffres ? chiffre ?? "case vide" : "case à compléter"}`).join(", ");
  const lecture = lectureFractionTableau(donnees);
  const evidence = rangMisEnEvidence
    ? ` La colonne des ${donnees.colonnes
        .find(({ id }) => id === rangMisEnEvidence).libelle.toLowerCase()} est mise en évidence.`
    : "";
  const lectureAccessible = afficherLecture
    ? ` Cette écriture se lit ${lecture}.`
    : "";
  const introduction = afficherChiffres && annoncerEcriture
    ? `Tableau de numération pour ${donnees.ecritureDecimale}`
    : afficherChiffres
      ? "Tableau de numération à lire"
      : "Tableau de numération à compléter";
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
 * @param {"unites"|"dixiemes"|"centiemes"|"milliemes"|null} [options.rangFinal=null]
 *   conserve explicitement les zéros jusqu'au rang imposé par la tâche
 * @param {"unites"|"dixiemes"|"centiemes"|"milliemes"|null} [options.rangMisEnEvidence=null]
 * @param {boolean} [options.afficherChiffres=true] masque les chiffres sans les laisser dans le SVG accessible
 * @param {boolean} [options.afficherLecture=true] affiche la lecture finale sous le tableau
 * @param {boolean} [options.annoncerEcriture=true] nomme l'écriture décimale dans le texte accessible
 */
export function dessinerTableauNumerationDecimale({
  ecritureDecimale,
  largeur = LARGEUR_PAR_DEFAUT,
  rangFinal = null,
  rangMisEnEvidence = null,
  afficherChiffres = true,
  afficherLecture = true,
  annoncerEcriture = true,
} = {}) {
  const largeurLue = lireLargeur(largeur, "dessinerTableauNumerationDecimale");
  const rangFinalLu = verifierRangFinal(rangFinal);
  const evidence = verifierRangMisEnEvidence(rangMisEnEvidence);
  const chiffresVisibles = verifierAfficherLecture(afficherChiffres);
  const lectureVisible = verifierAfficherLecture(afficherLecture);
  const lectureEffective = lectureVisible && chiffresVisibles;
  const ecritureAnnoncee = verifierAfficherLecture(annoncerEcriture);
  const donnees = prolongerDonneesTableauJusquAuRang(
    construireDonneesTableauNumeration(ecritureDecimale),
    rangFinalLu,
  );
  const hauteur = lectureEffective ? 132 : 108;
  const largeurTableau = largeurLue - 2 * MARGE;
  const largeurColonne = largeurTableau / donnees.colonnes.length;
  const yEntete = 12;
  const hauteurEntete = 36;
  const yValeur = yEntete + hauteurEntete;
  const hauteurValeur = 52;
  const tailleEntete = Math.max(9, Math.min(14, largeurColonne / 6.4));
  const xVirgule = MARGE + largeurColonne;
  const tailleVirgule = Math.max(24, Math.min(32, largeurColonne * 0.48));
  const colonnes = donnees.colonnes.map((colonne, index) => {
    const x = MARGE + index * largeurColonne;
    const active = colonne.id === evidence;
    const classe = `nd-tableau-colonne${active ? " nd-rang-actif" : ""}`;
    const couleursRang = COULEURS_RANGS_NUMERATION_DECIMALE[colonne.id];
    const trait = active ? COULEURS.bleu : couleursRang.texte;
    const chiffre = chiffresVisibles ? colonne.chiffre ?? "—" : "?";
    const chiffreExpose = chiffresVisibles ? colonne.chiffre ?? "" : "";
    return (
      `<g class="${classe}" data-rang="${colonne.id}" ` +
      `data-chiffre="${chiffreExpose}" ` +
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
      `font-weight="800" fill="${couleursRang.textePedagogique}">${echapper(chiffre)}</text>` +
      `</g>`
    );
  });
  const lecture = lectureFractionTableau(donnees);
  const alternatif = texteAlternatifTableau(
    donnees,
    evidence,
    chiffresVisibles,
    lectureEffective,
    ecritureAnnoncee,
  );
  const attributsFraction = lectureEffective
    ? ` data-numerateur="${donnees.fractionLue.numerateur}" ` +
      `data-denominateur="${donnees.fractionLue.denominateur}"`
    : "";
  const attributEcriture = chiffresVisibles && ecritureAnnoncee
    ? ` data-ecriture-decimale="${echapper(donnees.ecritureDecimale)}"`
    : "";
  const svg =
    attributsSvg(
      largeurLue,
      hauteur,
      alternatif,
      `${attributEcriture} data-afficher-lecture="${lectureEffective}"${attributsFraction}`,
    ) +
    `<g aria-hidden="true">${colonnes.join("")}` +
    `<text class="nd-virgule" data-separation="unites-dixiemes" ` +
      `x="${nombreSvg(xVirgule)}" y="${nombreSvg(yValeur + hauteurValeur / 2)}" ` +
      `text-anchor="middle" dominant-baseline="middle" font-family="${POLICE}" ` +
      `font-size="${nombreSvg(tailleVirgule)}" font-weight="800" ` +
      `fill="${COULEURS_NUMERATION_DECIMALE.encre}" stroke="${COULEURS.papier}" ` +
      `stroke-width="4" paint-order="stroke fill">,</text>` +
    (lectureEffective
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
    rangFinal: rangFinalLu,
    fractionLue: donnees.fractionLue,
    rangMisEnEvidence: evidence,
    afficherChiffres: chiffresVisibles,
    afficherLecture: lectureEffective,
    annoncerEcriture: ecritureAnnoncee,
  });
}
