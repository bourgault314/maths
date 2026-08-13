// Correspondances concrètes entre matériel décimal et fractions simples.
//
// Ces SVG prolongent le plateau historique de numération : l'unité rouge,
// les dixièmes verts et les centièmes jaunes gardent une échelle exacte. Ils
// ne calculent pas par approximation : les 25 ou 75 cellules sont les mêmes
// avant et après réorganisation, et cinq bandes de dixièmes occupent
// exactement la moitié de l'empreinte d'une unité.

import {
  COULEURS_BANDES_FRACTIONS,
  COULEURS_NUMERATION_DECIMALE,
  COULEURS_RANGS_NUMERATION_DECIMALE,
  TYPOGRAPHIE,
} from "../../charte/src/charte.js?v=27";

export const VERSION_CORRESPONDANCES_DECIMALES = 2;

export const ETAPES_REORGANISATION_CENTIEMES = Object.freeze([
  "lignes",
  "quadrants",
  "comparaison",
]);

export const ETAPES_DEMI_DIXIEMES = Object.freeze([
  "dixiemes",
  "demi",
  "comparaison",
]);

const LARGEUR_DEFAUT = 560;
const LARGEUR_MINIMALE = 240;
const LARGEUR_MAXIMALE = 1200;
const MARGE = 12;
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

function normaliserLargeur(largeur) {
  if (typeof largeur !== "number" || !Number.isFinite(largeur)) return null;
  if (largeur < LARGEUR_MINIMALE || largeur > LARGEUR_MAXIMALE) return null;
  return arrondi2(largeur);
}

function verifierBooleen(valeur) {
  return typeof valeur === "boolean";
}

function attributsSvg(largeur, hauteur, texteAlternatif, donnees = "") {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${nombreSvg(largeur)} ${nombreSvg(hauteur)}" ` +
    `width="${nombreSvg(largeur)}" height="${nombreSvg(hauteur)}" role="img" ` +
    `aria-label="${echapper(texteAlternatif)}" preserveAspectRatio="xMidYMid meet" ` +
    `style="max-width:100%;height:auto"${donnees}>`
  );
}

function texte(x, y, contenu, {
  taille = 14,
  graisse = 700,
  couleur = COULEURS_NUMERATION_DECIMALE.encre,
  ancre = "middle",
  classe = "",
} = {}) {
  const attributClasse = classe ? ` class="${echapper(classe)}"` : "";
  return (
    `<text${attributClasse} x="${nombreSvg(x)}" y="${nombreSvg(y)}" ` +
    `text-anchor="${ancre}" font-family="${POLICE}" font-size="${nombreSvg(taille)}" ` +
    `font-weight="${graisse}" fill="${couleur}">${echapper(contenu)}</text>`
  );
}

function renduErreur(message, largeurDemandee) {
  const largeur = normaliserLargeur(largeurDemandee) ?? LARGEUR_DEFAUT;
  const hauteur = 104;
  const texteAlternatif = `Erreur de réglage : ${message}`;
  const svg = attributsSvg(largeur, hauteur, texteAlternatif, ' data-erreur="true"') +
    `<rect x="12" y="12" width="${nombreSvg(largeur - 24)}" height="80" rx="10" ` +
    `fill="#fef2f2" stroke="#b91c1c" stroke-width="2"/>` +
    texte(largeur / 2, 44, "Réglage impossible", {
      taille: 17,
      couleur: "#991b1b",
    }) +
    texte(largeur / 2, 70, message, { taille: 12, graisse: 600 }) +
    "</svg>";
  return Object.freeze({
    svg,
    largeur,
    hauteur,
    texteAlternatif,
    erreur: message,
    donnees: null,
  });
}

function indexCellule(ligne, colonne) {
  return ligne * 10 + colonne;
}

function ordreParQuadrants() {
  const ordre = [];
  for (const [ligneDepart, colonneDepart] of [
    [0, 0],
    [0, 5],
    [5, 0],
    [5, 5],
  ]) {
    for (let ligne = 0; ligne < 5; ligne += 1) {
      for (let colonne = 0; colonne < 5; colonne += 1) {
        ordre.push(indexCellule(ligneDepart + ligne, colonneDepart + colonne));
      }
    }
  }
  return ordre;
}

const ORDRE_QUADRANTS = Object.freeze(ordreParQuadrants());

function indicesColories(centiemes, disposition) {
  return disposition === "lignes"
    ? Object.freeze(Array.from({ length: centiemes }, (_, index) => index))
    : Object.freeze(ORDRE_QUADRANTS.slice(0, centiemes));
}

function dessinerGrilleCentiemes({
  x,
  y,
  cote,
  centiemes,
  disposition,
  afficherEcritures,
}) {
  const cellule = cote / 10;
  const colories = new Set(indicesColories(centiemes, disposition));
  const morceaux = [
    `<g class="cd-grille-centiemes cd-disposition-${disposition}" ` +
      `data-disposition="${disposition}" data-centiemes="${centiemes}" ` +
      `transform="translate(${nombreSvg(x)} ${nombreSvg(y)})">`,
    `<rect class="cd-empreinte-unite" x="0" y="0" width="${nombreSvg(cote)}" ` +
      `height="${nombreSvg(cote)}" fill="${COULEURS_RANGS_NUMERATION_DECIMALE.unites.fond}"/>`,
  ];
  for (let ligne = 0; ligne < 10; ligne += 1) {
    for (let colonne = 0; colonne < 10; colonne += 1) {
      const index = indexCellule(ligne, colonne);
      const coloriee = colories.has(index);
      morceaux.push(
        `<rect class="cd-cellule-centieme${coloriee ? " cd-cellule-coloriee" : ""}" ` +
        `data-cellule-index="${index}" data-ligne="${ligne}" data-colonne="${colonne}" ` +
        `x="${nombreSvg(colonne * cellule)}" y="${nombreSvg(ligne * cellule)}" ` +
        `width="${nombreSvg(cellule)}" height="${nombreSvg(cellule)}" ` +
        `fill="${coloriee ? COULEURS_NUMERATION_DECIMALE.centieme : "#fffdf5"}" ` +
        `stroke="rgba(17,24,39,.72)" stroke-width="${nombreSvg(Math.max(0.45, cellule * 0.035))}"/>`,
      );
    }
  }
  // Les deux médianes donnent quatre zones 5 × 5 sans faire dépendre la
  // lecture du seul jaune. Elles sont présentes dans les deux dispositions.
  morceaux.push(
    `<path class="cd-separations-quadrants" d="M ${nombreSvg(cote / 2)} 0 V ${nombreSvg(cote)} ` +
      `M 0 ${nombreSvg(cote / 2)} H ${nombreSvg(cote)}" fill="none" ` +
      `stroke="${COULEURS_NUMERATION_DECIMALE.encre}" stroke-width="${nombreSvg(Math.max(1.5, cellule * 0.11))}"/>`,
    `<rect class="cd-contour-unite" x="0" y="0" width="${nombreSvg(cote)}" height="${nombreSvg(cote)}" ` +
      `fill="none" stroke="${COULEURS_RANGS_NUMERATION_DECIMALE.unites.texte}" ` +
      `stroke-width="${nombreSvg(Math.max(2, cellule * 0.16))}"/>`,
  );
  if (afficherEcritures && disposition === "quadrants") {
    const quadrants = centiemes / 25;
    for (let index = 0; index < quadrants; index += 1) {
      const colonneQuadrant = index % 2;
      const ligneQuadrant = Math.floor(index / 2);
      morceaux.push(
        texte(
          (colonneQuadrant + 0.5) * cote / 2,
          (ligneQuadrant + 0.5) * cote / 2 + 5,
          centiemes === 25 ? "1 quart" : `${index + 1}`,
          {
            taille: Math.max(9, Math.min(14, cellule * 0.82)),
            graisse: 800,
            couleur: COULEURS_RANGS_NUMERATION_DECIMALE.centiemes.texte,
            classe: "cd-etiquette-quadrant",
          },
        ),
      );
    }
  }
  morceaux.push("</g>");
  return Object.freeze({
    svg: morceaux.join(""),
    cellule: arrondi2(cellule),
    indicesColories: indicesColories(centiemes, disposition),
  });
}

function libelleDisposition(disposition, centiemes, afficherEcritures) {
  if (disposition === "lignes") {
    return afficherEcritures
      ? `${centiemes} centièmes en lignes`
      : "Rangés par lignes";
  }
  const quadrants = centiemes / 25;
  return afficherEcritures
    ? `${quadrants} ${quadrants === 1 ? "quart" : "quarts"} de l’unité`
    : "Regroupés en quarts";
}

function ecritureCentiemes(centiemes, etape) {
  const quarts = centiemes / 25;
  const decimal = centiemes === 25 ? "0,25" : "0,75";
  if (etape === "lignes") return `${centiemes}/100`;
  if (etape === "quadrants") return `${centiemes}/100 = ${quarts}/4`;
  return `${centiemes}/100 = ${quarts}/4 = ${decimal}`;
}

function texteAlternatifCentiemes(centiemes, etape, afficherEcritures) {
  const quadrants = centiemes / 25;
  if (!afficherEcritures) {
    const comparaison = etape === "comparaison"
      ? " Deux dispositions de la même collection sont comparées."
      : "";
    return `Des petits carrés jaunes sont ${etape === "lignes" ? "rangés par lignes" : "regroupés en quarts d’une unité 10 par 10"}.${comparaison} Les écritures sont masquées.`;
  }
  if (etape === "lignes") {
    return `${centiemes} centièmes jaunes sont rangés par lignes dans une unité de 100 cases.`;
  }
  if (etape === "quadrants") {
    return `${centiemes} centièmes jaunes sont réorganisés en ${quadrants} ${quadrants === 1 ? "quadrant de 25 cases" : "quadrants de 25 cases"}.`;
  }
  return `${centiemes} centièmes jaunes sont d’abord rangés par lignes puis réorganisés, sans changer la quantité, en ${quadrants} ${quadrants === 1 ? "quart" : "quarts"} de l’unité. ${ecritureCentiemes(centiemes, etape)}.`;
}

/**
 * Montre 25 ou 75 centièmes avant et/ou après leur réorganisation en
 * quadrants 5 × 5 d'une même unité 10 × 10.
 *
 * @param {object} options
 * @param {25|75} options.centiemes
 * @param {"lignes"|"quadrants"|"comparaison"} [options.etape="comparaison"]
 * @param {number} [options.largeur=560]
 * @param {boolean} [options.afficherEcritures=true]
 */
export function dessinerReorganisationCentiemes({
  centiemes,
  etape = "comparaison",
  largeur = LARGEUR_DEFAUT,
  afficherEcritures = true,
} = {}) {
  const largeurLue = normaliserLargeur(largeur);
  if (largeurLue === null) {
    return renduErreur(
      `la largeur doit être comprise entre ${LARGEUR_MINIMALE} et ${LARGEUR_MAXIMALE}`,
      largeur,
    );
  }
  if (![25, 75].includes(centiemes)) {
    return renduErreur("les centièmes doivent valoir 25 ou 75", largeurLue);
  }
  if (!ETAPES_REORGANISATION_CENTIEMES.includes(etape)) {
    return renduErreur(`étape inconnue : ${String(etape)}`, largeurLue);
  }
  if (!verifierBooleen(afficherEcritures)) {
    return renduErreur("afficherEcritures doit être un booléen", largeurLue);
  }

  const comparaison = etape === "comparaison";
  const ecart = comparaison ? Math.max(42, largeurLue * 0.1) : 0;
  const cote = comparaison
    ? Math.min(190, (largeurLue - 2 * MARGE - ecart) / 2)
    : Math.min(240, largeurLue - 2 * MARGE);
  const largeurContenu = comparaison ? 2 * cote + ecart : cote;
  const xDepart = (largeurLue - largeurContenu) / 2;
  const yGrille = 48;
  const dispositions = comparaison ? ["lignes", "quadrants"] : [etape];
  const rendus = dispositions.map((disposition, index) => {
    const x = xDepart + index * (cote + ecart);
    const grille = dessinerGrilleCentiemes({
      x,
      y: yGrille,
      cote,
      centiemes,
      disposition,
      afficherEcritures,
    });
    return Object.freeze({ disposition, x: arrondi2(x), ...grille });
  });
  const yEquation = yGrille + cote + 34;
  const hauteur = arrondi2(yEquation + (afficherEcritures ? 26 : 10));
  const alternatif = texteAlternatifCentiemes(
    centiemes,
    etape,
    afficherEcritures,
  );
  const entetes = rendus.map((rendu) => texte(
    rendu.x + cote / 2,
    29,
    libelleDisposition(rendu.disposition, centiemes, afficherEcritures),
    {
      taille: comparaison ? Math.max(9, Math.min(13, cote / 12)) : 14,
      couleur: rendu.disposition === "lignes"
        ? COULEURS_RANGS_NUMERATION_DECIMALE.centiemes.texte
        : COULEURS_RANGS_NUMERATION_DECIMALE.unites.texte,
      classe: "cd-titre-disposition",
    },
  )).join("");
  const fleche = comparaison
    ? `<g class="cd-fleche-reorganisation" aria-hidden="true">` +
      `<line x1="${nombreSvg(xDepart + cote + 8)}" y1="${nombreSvg(yGrille + cote / 2)}" ` +
      `x2="${nombreSvg(xDepart + cote + ecart - 10)}" y2="${nombreSvg(yGrille + cote / 2)}" ` +
      `stroke="${COULEURS_NUMERATION_DECIMALE.encre}" stroke-width="2"/>` +
      `<path d="M ${nombreSvg(xDepart + cote + ecart - 17)} ${nombreSvg(yGrille + cote / 2 - 6)} ` +
      `L ${nombreSvg(xDepart + cote + ecart - 9)} ${nombreSvg(yGrille + cote / 2)} ` +
      `L ${nombreSvg(xDepart + cote + ecart - 17)} ${nombreSvg(yGrille + cote / 2 + 6)}" ` +
      `fill="none" stroke="${COULEURS_NUMERATION_DECIMALE.encre}" stroke-width="2"/>` +
      `</g>`
    : "";
  const equation = afficherEcritures
    ? texte(largeurLue / 2, yEquation, ecritureCentiemes(centiemes, etape), {
      taille: Math.max(13, Math.min(18, largeurLue / 25)),
      graisse: 800,
      couleur: COULEURS_RANGS_NUMERATION_DECIMALE.centiemes.texte,
      classe: "cd-ecriture-correspondance",
    })
    : "";
  const svg = attributsSvg(
    largeurLue,
    hauteur,
    alternatif,
    ` data-objet="reorganisation-centiemes" data-centiemes="${centiemes}" ` +
      `data-etape="${etape}" data-afficher-ecritures="${afficherEcritures}"`,
  ) + `<g aria-hidden="true">${entetes}${rendus.map(({ svg: dessin }) => dessin).join("")}${fleche}${equation}</g></svg>`;
  const donnees = Object.freeze({
    centiemes,
    etape,
    afficherEcritures,
    quadrantsComplets: centiemes / 25,
    coteUnite: arrondi2(cote),
    tailleCellule: arrondi2(cote / 10),
    dispositions: Object.freeze(rendus.map(({ disposition, indicesColories: indices }) =>
      Object.freeze({ disposition, indicesColories: indices }))),
  });
  return Object.freeze({
    svg,
    largeur: largeurLue,
    hauteur,
    texteAlternatif: alternatif,
    erreur: null,
    donnees,
  });
}

function dessinerEmpreinteDixiemes(x, y, cote, afficherEcritures) {
  const cellule = cote / 10;
  const morceaux = [
    `<g class="cd-empreinte-dixiemes" transform="translate(${nombreSvg(x)} ${nombreSvg(y)})">`,
    `<rect class="cd-unite-entiere" x="0" y="0" width="${nombreSvg(cote)}" height="${nombreSvg(cote)}" ` +
      `fill="${COULEURS_RANGS_NUMERATION_DECIMALE.unites.fond}" ` +
      `stroke="${COULEURS_RANGS_NUMERATION_DECIMALE.unites.texte}" stroke-width="2.4"/>`,
  ];
  for (let index = 1; index < 10; index += 1) {
    morceaux.push(
      `<line class="cd-grille-unite" x1="${nombreSvg(index * cellule)}" y1="0" ` +
      `x2="${nombreSvg(index * cellule)}" y2="${nombreSvg(cote)}" ` +
      `stroke="rgba(17,24,39,.38)" stroke-width="0.6"/>`,
      `<line class="cd-grille-unite" x1="0" y1="${nombreSvg(index * cellule)}" ` +
      `x2="${nombreSvg(cote)}" y2="${nombreSvg(index * cellule)}" ` +
      `stroke="rgba(17,24,39,.38)" stroke-width="0.6"/>`,
    );
  }
  for (let index = 0; index < 5; index += 1) {
    morceaux.push(
      `<g class="cd-bande-dixieme" data-piece-index="${index + 1}">` +
      `<rect x="0" y="${nombreSvg(index * cellule)}" width="${nombreSvg(cote)}" ` +
      `height="${nombreSvg(cellule)}" fill="${COULEURS_NUMERATION_DECIMALE.dixieme}" ` +
      `stroke="${COULEURS_NUMERATION_DECIMALE.trait}" stroke-width="1"/>` +
      Array.from({ length: 9 }, (_, colonne) =>
        `<line x1="${nombreSvg((colonne + 1) * cellule)}" y1="${nombreSvg(index * cellule)}" ` +
        `x2="${nombreSvg((colonne + 1) * cellule)}" y2="${nombreSvg((index + 1) * cellule)}" ` +
        `stroke="rgba(0,0,0,.48)" stroke-width="0.55"/>`).join("") +
      `</g>`,
    );
  }
  morceaux.push(
    `<line class="cd-ligne-demie-unite" x1="0" y1="${nombreSvg(cote / 2)}" ` +
      `x2="${nombreSvg(cote)}" y2="${nombreSvg(cote / 2)}" ` +
      `stroke="${COULEURS_NUMERATION_DECIMALE.encre}" stroke-width="2.4"/>`,
  );
  if (afficherEcritures) {
    morceaux.push(texte(cote / 2, cote / 4 + 5, "5 dixièmes", {
      taille: Math.max(11, Math.min(16, cellule * 0.72)),
      couleur: COULEURS_RANGS_NUMERATION_DECIMALE.dixiemes.texte,
      classe: "cd-etiquette-cinq-dixiemes",
    }));
  }
  morceaux.push("</g>");
  return morceaux.join("");
}

function fractionDemiSvg(cx, yBarre, afficherEcritures) {
  if (!afficherEcritures) {
    return texte(cx, yBarre + 4, "?", {
      taille: 18,
      couleur: COULEURS_BANDES_FRACTIONS.guide,
      classe: "cd-ecriture-demie-masquee",
    });
  }
  return `<g class="cd-ecriture-demie">` +
    texte(cx, yBarre - 6, "1", { taille: 14, graisse: 800 }) +
    `<line x1="${nombreSvg(cx - 10)}" y1="${nombreSvg(yBarre)}" ` +
      `x2="${nombreSvg(cx + 10)}" y2="${nombreSvg(yBarre)}" ` +
      `stroke="${COULEURS_NUMERATION_DECIMALE.encre}" stroke-width="1.8"/>` +
    texte(cx, yBarre + 16, "2", { taille: 14, graisse: 800 }) +
    `</g>`;
}

function dessinerPieceDemiSurRail(x, y, largeurUnite, afficherEcritures) {
  const hauteurBande = Math.max(32, Math.min(48, largeurUnite * 0.16));
  const largeurDemi = largeurUnite / 2;
  const yRail = y + hauteurBande + 30;
  return {
    svg: `<g class="cd-demi-sur-rail" transform="translate(${nombreSvg(x)} ${nombreSvg(y)})">` +
      `<rect class="cd-piece-demi" x="0" y="0" width="${nombreSvg(largeurDemi)}" ` +
      `height="${nombreSvg(hauteurBande)}" fill="${COULEURS_BANDES_FRACTIONS.d2}" ` +
      `stroke="${COULEURS_BANDES_FRACTIONS.trait}" stroke-width="1.4"/>` +
      fractionDemiSvg(largeurDemi / 2, hauteurBande / 2 - 3, afficherEcritures) +
      `<line class="cd-rail" x1="0" y1="${nombreSvg(yRail - y)}" ` +
      `x2="${nombreSvg(largeurUnite)}" y2="${nombreSvg(yRail - y)}" ` +
      `stroke="${COULEURS_BANDES_FRACTIONS.guide}" stroke-width="2"/>` +
      `<path class="cd-fleche-rail" d="M ${nombreSvg(largeurUnite)} ${nombreSvg(yRail - y)} ` +
      `l -9 -5 v 10 z" fill="${COULEURS_BANDES_FRACTIONS.guide}"/>` +
      [0, largeurDemi, largeurUnite].map((position) =>
        `<line x1="${nombreSvg(position)}" y1="${nombreSvg(yRail - y - 6)}" ` +
        `x2="${nombreSvg(position)}" y2="${nombreSvg(yRail - y + 7)}" ` +
        `stroke="${COULEURS_BANDES_FRACTIONS.guide}" stroke-width="1.6"/>`).join("") +
      texte(0, yRail - y + 24, "0", { taille: 11 }) +
      texte(largeurDemi, yRail - y + 24, afficherEcritures ? "0,5" : "?", {
        taille: 12,
        couleur: COULEURS_BANDES_FRACTIONS.guide,
        classe: afficherEcritures ? "cd-repere-demi" : "cd-repere-demi-masque",
      }) +
      texte(largeurUnite, yRail - y + 24, "1", { taille: 11 }) +
      `</g>`,
    hauteur: arrondi2(hauteurBande + 56),
    largeurDemi: arrondi2(largeurDemi),
  };
}

function texteAlternatifDemi(etape, afficherEcritures) {
  if (!afficherEcritures) {
    if (etape === "dixiemes") {
      return "Des bandes vertes de dixièmes occupent exactement la moitié de l’empreinte rouge d’une unité. Les écritures sont masquées.";
    }
    if (etape === "demi") {
      return "Une pièce jaune occupe exactement la moitié d’un rail allant de zéro à un. Les écritures sont masquées.";
    }
    return "Des bandes vertes occupent la moitié d’une unité et une pièce jaune occupe la moitié d’un rail de même largeur. Les écritures sont masquées.";
  }
  if (etape === "dixiemes") {
    return "Cinq bandes vertes d’un dixième occupent exactement la moitié d’une unité rouge.";
  }
  if (etape === "demi") {
    return "Une pièce historique jaune d’un demi s’aligne exactement sur 0,5 entre zéro et un.";
  }
  return "Cinq dixièmes occupent la moitié d’une unité ; une pièce d’un demi s’aligne sur le même repère 0,5. 0,5 égale 5 sur 10 égale 1 sur 2.";
}

/**
 * Compare cinq bandes historiques de dixièmes à une vraie pièce de demi sur
 * un rail de même largeur.
 *
 * @param {object} [options]
 * @param {"dixiemes"|"demi"|"comparaison"} [options.etape="comparaison"]
 * @param {number} [options.largeur=560]
 * @param {boolean} [options.afficherEcritures=true]
 * @param {boolean} [options.afficherEquation=options.afficherEcritures]
 */
export function dessinerDemiAvecDixiemes({
  etape = "comparaison",
  largeur = LARGEUR_DEFAUT,
  afficherEcritures = true,
  afficherEquation = afficherEcritures,
} = {}) {
  const largeurLue = normaliserLargeur(largeur);
  if (largeurLue === null) {
    return renduErreur(
      `la largeur doit être comprise entre ${LARGEUR_MINIMALE} et ${LARGEUR_MAXIMALE}`,
      largeur,
    );
  }
  if (!ETAPES_DEMI_DIXIEMES.includes(etape)) {
    return renduErreur(`étape inconnue : ${String(etape)}`, largeurLue);
  }
  if (!verifierBooleen(afficherEcritures)) {
    return renduErreur("afficherEcritures doit être un booléen", largeurLue);
  }
  if (!verifierBooleen(afficherEquation)) {
    return renduErreur("afficherEquation doit être un booléen", largeurLue);
  }

  const montrerDixiemes = etape !== "demi";
  const montrerDemi = etape !== "dixiemes";
  const coteUnite = Math.min(240, largeurLue - 2 * MARGE);
  const x = (largeurLue - coteUnite) / 2;
  let y = 42;
  const morceaux = [];
  if (montrerDixiemes) {
    morceaux.push(texte(largeurLue / 2, 25, afficherEcritures
      ? "5 dixièmes dans une unité"
      : "Empile les bandes vertes", {
      taille: 14,
      couleur: COULEURS_RANGS_NUMERATION_DECIMALE.dixiemes.texte,
      classe: "cd-titre-dixiemes",
    }));
    morceaux.push(dessinerEmpreinteDixiemes(x, y, coteUnite, afficherEcritures));
    y += coteUnite + 26;
  }
  if (montrerDixiemes && montrerDemi) {
    morceaux.push(texte(largeurLue / 2, y - 7, "Même moitié", {
      taille: 12,
      couleur: COULEURS_NUMERATION_DECIMALE.encre,
      classe: "cd-lien-meme-moitie",
    }));
  }
  if (montrerDemi) {
    if (!montrerDixiemes) {
      morceaux.push(texte(largeurLue / 2, 25, afficherEcritures
        ? "Une pièce d’un demi sur le rail"
        : "Aligne la pièce jaune", {
        taille: 14,
        couleur: COULEURS_RANGS_NUMERATION_DECIMALE.centiemes.texte,
        classe: "cd-titre-demi",
      }));
    }
    const rail = dessinerPieceDemiSurRail(x, y, coteUnite, afficherEcritures);
    morceaux.push(rail.svg);
    y += rail.hauteur + 16;
  }
  if (afficherEcritures && afficherEquation) {
    const ecriture = etape === "dixiemes"
      ? "0,5 = 5/10"
      : etape === "demi"
        ? "1/2 = 0,5"
        : "0,5 = 5/10 = 1/2";
    morceaux.push(texte(largeurLue / 2, y, ecriture, {
      taille: Math.max(14, Math.min(18, largeurLue / 26)),
      graisse: 800,
      couleur: COULEURS_RANGS_NUMERATION_DECIMALE.dixiemes.texte,
      classe: "cd-ecriture-correspondance",
    }));
    y += 24;
  }
  const hauteur = arrondi2(Math.max(148, y + 4));
  const alternatif = texteAlternatifDemi(etape, afficherEcritures);
  const svg = attributsSvg(
    largeurLue,
    hauteur,
    alternatif,
    ` data-objet="demi-dixiemes" data-etape="${etape}" ` +
      `data-afficher-ecritures="${afficherEcritures}"`,
  ) + `<g aria-hidden="true">${morceaux.join("")}</g></svg>`;
  const donnees = Object.freeze({
    etape,
    afficherEcritures,
    afficherEquation,
    dixiemes: 5,
    denominateurFraction: 2,
    coteUnite: arrondi2(coteUnite),
    hauteurCinqDixiemes: arrondi2(coteUnite / 2),
    largeurDemi: arrondi2(coteUnite / 2),
    valeur: Object.freeze({ numerateur: 1, denominateur: 2 }),
  });
  return Object.freeze({
    svg,
    largeur: largeurLue,
    hauteur,
    texteAlternatif: alternatif,
    erreur: null,
    donnees,
  });
}
