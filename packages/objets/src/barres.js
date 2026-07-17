// Objet officiel « schéma en barres » — version 2, STATUT BROUILLON.
//
// Réécrit pour reproduire À L'IDENTIQUE le langage visuel des outils
// maths&go existants (ÉquaBarre, PythaBarre, AngleBarre, Problèmes en
// barres), relevé dans leur code et à l'écran le 18/07/2026 :
//
// - un TABLEAU : lignes empilées sans écart, cases collées bord à bord,
//   filets de 2 px gris-ardoise (encre à 36 %) jamais doublés, AUCUN
//   coin arrondi ;
// - largeurs strictement proportionnelles aux valeurs (l'inconnue pèse
//   sa valeur de solution) ;
// - PAS d'accolade : l'égalité se lit par l'alignement des lignes, les
//   valeurs vivent dans les cases ;
// - case nombre blanche (dégradé très léger), case inconnue bleu pâle
//   avec 𝑥 italique bleu — ou « ? », ou tache Splat noire, selon le
//   réglage « affichage de l'inconnue » ;
// - états par HACHURES diagonales 135° : orange (sélection pour
//   suppression), vert (sélection pour regroupement), bleu (à
//   calculer), gris + opacité réduite (case enlevée, « garder
//   hachuré ») ; résultat en vert doux ; valeur conclue en rouge ;
// - rôles sémantiques fixes façon PythaBarre (vert/bleu/orange) pour
//   synchroniser barre, figure et équation ;
// - chiffres énormes, graisse maximale, virgule décimale française.
//
// Ce module rend la version STATIQUE (SVG pur, déterministe) : fiches,
// questions, corrections, aperçus. La version interactive (clic,
// pensée tablette — jamais de glisser-déposer dans les outils barres)
// sera un rendu DOM du même modèle de données.

import { COULEURS_BARRES } from "../../charte/src/charte.js";

export const VERSION_BARRES = 2;

export const TYPES_DE_PIECE = ["nombre", "inconnue"];
export const ETATS_PIECE = [
  "normal",
  "aCalculer",
  "selectionSuppression",
  "selectionAjout",
  "supprime",
  "resultat",
  "conclu",
];
export const AFFICHAGES_INCONNUE = ["lettre", "question", "splat"];
export const ROLES_PIECE = ["aucun", "vert", "bleu", "orange"];

const OPACITE_FILET = 0.36;
const POLICE_VALEURS = "'Segoe UI', system-ui, sans-serif";
const POLICE_LETTRE = "Georgia, 'Times New Roman', serif";

// Tache Splat (blob noir à 5 lobes, silhouette simplifiée de l'icône
// d'ÉquaBarre), dessinée dans un carré 100×100 centré en (50,50).
const CHEMIN_SPLAT =
  "M50 8 C62 10 68 20 78 18 C90 16 96 26 88 36 C82 44 92 50 92 58 " +
  "C92 70 80 72 74 80 C68 90 56 92 50 84 C44 92 30 92 26 82 C22 72 10 70 10 58 " +
  "C10 48 20 44 16 34 C12 24 22 14 32 18 C40 20 42 10 50 8 Z";

function fondsPour(piece) {
  const role = piece.role ?? "aucun";
  if (piece.etat === "supprime") {
    return { haut: COULEURS_BARRES.supprimeFond, bas: COULEURS_BARRES.supprimeFond, texte: COULEURS_BARRES.attenue };
  }
  if (piece.etat === "resultat" || piece.etat === "conclu") {
    return { haut: COULEURS_BARRES.resultatFond, bas: COULEURS_BARRES.resultatFondBas, texte: piece.etat === "conclu" ? COULEURS_BARRES.conclusion : COULEURS_BARRES.encre };
  }
  if (role === "vert") return { haut: COULEURS_BARRES.roleVert, bas: COULEURS_BARRES.resultatFondBas, texte: COULEURS_BARRES.roleVertTexte, opaciteHaut: 0.19 };
  if (role === "bleu") return { haut: COULEURS_BARRES.roleBleu, bas: COULEURS_BARRES.inconnueFondBas, texte: COULEURS_BARRES.roleBleuTexte, opaciteHaut: 0.17 };
  if (role === "orange") return { haut: COULEURS_BARRES.roleOrange, bas: COULEURS_BARRES.nombreFond, texte: COULEURS_BARRES.roleOrangeTexte, opaciteHaut: 0.17 };
  if (piece.type === "inconnue") {
    return { haut: COULEURS_BARRES.inconnueFond, bas: COULEURS_BARRES.inconnueFondBas, texte: COULEURS_BARRES.inconnueTexte };
  }
  return { haut: COULEURS_BARRES.nombreFond, bas: COULEURS_BARRES.nombreFondBas, texte: COULEURS_BARRES.encre };
}

function hachuresPour(etat) {
  switch (etat) {
    case "selectionSuppression":
      return { couleur: COULEURS_BARRES.hachureSuppression, opacite: 0.22 };
    case "selectionAjout":
      return { couleur: COULEURS_BARRES.hachureAjout, opacite: 0.16 };
    case "aCalculer":
      return { couleur: COULEURS_BARRES.hachureCalcul, opacite: 0.12 };
    case "supprime":
      return { couleur: COULEURS_BARRES.hachureGris ?? COULEURS_BARRES.filet, opacite: 0.26 };
    default:
      return null;
  }
}

function texteDePiece(piece, inconnue) {
  if (piece.etiquette !== undefined) return String(piece.etiquette);
  if (piece.type === "inconnue") {
    if (inconnue.affichage === "question") return "?";
    if (inconnue.affichage === "splat") return "";
    return inconnue.lettre ?? "x";
  }
  return String(piece.valeur).replace(".", ",");
}

/**
 * Dessine un schéma en barres façon maths&go (tableau à lignes empilées).
 *
 * @param {object} options
 * @param {Array<{etiquette?: string, pieces: Array<{
 *   type: "nombre" | "inconnue",
 *   valeur?: number,          // requis pour un nombre ; poids d'affichage
 *   etiquette?: string,       // remplace le texte automatique
 *   etat?: string,            // voir ETATS_PIECE
 *   role?: string,            // aucun | vert | bleu | orange
 * }>}>} options.lignes — de haut en bas ; l'égalité se lit par l'alignement
 * @param {{ affichage?: "lettre" | "question" | "splat", lettre?: string, valeur?: number }} [options.inconnue]
 *   — valeur = poids d'affichage de chaque case inconnue (la solution)
 * @param {number} [options.largeur] — largeur totale en pixels
 * @param {number} [options.hauteurPiece] — hauteur d'une ligne (104 comme les outils)
 * @param {string} [options.prefixeId] — préfixe des motifs internes (unicité dans la page)
 * @returns {string} balise <svg> autonome
 */
export function dessinerBarres({
  lignes,
  inconnue = {},
  largeur = 640,
  hauteurPiece = 104,
  prefixeId = "mgb",
} = {}) {
  if (!Array.isArray(lignes) || lignes.length === 0) {
    throw new RangeError("dessinerBarres : au moins une ligne est requise");
  }
  const affichage = inconnue.affichage ?? "lettre";
  if (!AFFICHAGES_INCONNUE.includes(affichage)) {
    throw new RangeError(`dessinerBarres : affichage d'inconnue inconnu « ${affichage} »`);
  }
  const poidsInconnue = inconnue.valeur ?? 1;
  if (!(poidsInconnue > 0)) {
    throw new RangeError("dessinerBarres : la valeur d'affichage de l'inconnue doit être > 0");
  }

  const poidsDePiece = (piece) => {
    if (piece.type === "inconnue") return poidsInconnue;
    if (piece.type === "nombre") {
      if (!(typeof piece.valeur === "number") || !(piece.valeur > 0)) {
        throw new RangeError("dessinerBarres : chaque nombre doit avoir une valeur > 0");
      }
      return piece.valeur;
    }
    throw new RangeError(`dessinerBarres : type de pièce inconnu « ${piece.type} »`);
  };

  for (const [i, ligne] of lignes.entries()) {
    if (!Array.isArray(ligne.pieces) || ligne.pieces.length === 0) {
      throw new RangeError(`dessinerBarres : la ligne ${i} n'a aucune pièce`);
    }
    for (const piece of ligne.pieces) {
      poidsDePiece(piece);
      if (piece.etat !== undefined && !ETATS_PIECE.includes(piece.etat)) {
        throw new RangeError(`dessinerBarres : état inconnu « ${piece.etat} »`);
      }
      if (piece.role !== undefined && !ROLES_PIECE.includes(piece.role)) {
        throw new RangeError(`dessinerBarres : rôle inconnu « ${piece.role} »`);
      }
    }
  }

  const avecNoms = lignes.some((l) => l.etiquette);
  const margeGauche = avecNoms ? 96 : 2;
  const largeurUtile = largeur - margeGauche - 2;
  const poidsMax = Math.max(
    ...lignes.map((l) => l.pieces.reduce((s, p) => s + poidsDePiece(p), 0)),
  );
  const echelle = largeurUtile / poidsMax;
  const hauteurTotale = lignes.length * hauteurPiece + 4;
  const tailleTexte = Math.round(hauteurPiece * 0.38);

  const morceaux = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteurTotale}" width="${largeur}" height="${hauteurTotale}" role="img" aria-label="schéma en barres maths&amp;go, ${lignes.length} ligne(s)">`,
    `<defs>` +
      ["selectionSuppression", "selectionAjout", "aCalculer", "supprime"]
        .map((etat) => {
          const h = hachuresPour(etat);
          return `<pattern id="${prefixeId}-${etat}" width="15" height="15" patternTransform="rotate(135)" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="#ffffff" fill-opacity="0"/><rect width="8" height="15" fill="${h.couleur}" fill-opacity="${h.opacite}"/></pattern>`;
        })
        .join("") +
      `</defs>`,
  ];

  const filet = `stroke="${COULEURS_BARRES.filet}" stroke-opacity="${OPACITE_FILET}" stroke-width="2"`;

  lignes.forEach((ligne, i) => {
    const y = 2 + i * hauteurPiece;
    const largeurLigne = ligne.pieces.reduce((s, p) => s + poidsDePiece(p), 0) * echelle;

    if (ligne.etiquette) {
      morceaux.push(
        `<text x="${margeGauche - 12}" y="${y + hauteurPiece / 2}" font-family="${POLICE_VALEURS}" font-size="${Math.round(tailleTexte * 0.55)}" font-weight="700" fill="${COULEURS_BARRES.encre}" text-anchor="end" dominant-baseline="central">${ligne.etiquette}</text>`,
      );
    }

    let x = margeGauche;
    ligne.pieces.forEach((piece) => {
      const l = poidsDePiece(piece) * echelle;
      const fonds = fondsPour(piece);
      const opaciteCase = piece.etat === "supprime" ? 0.42 : 1;

      morceaux.push(`<g opacity="${opaciteCase}">`);
      morceaux.push(
        `<rect x="${x}" y="${y}" width="${l}" height="${hauteurPiece}" fill="${fonds.haut}"${fonds.opaciteHaut ? ` fill-opacity="${fonds.opaciteHaut}"` : ""}/>`,
      );
      if (!fonds.opaciteHaut) {
        morceaux.push(
          `<rect x="${x}" y="${y + hauteurPiece / 2}" width="${l}" height="${hauteurPiece / 2}" fill="${fonds.bas}" fill-opacity="0.6"/>`,
        );
      }
      const hachures = hachuresPour(piece.etat);
      if (hachures) {
        morceaux.push(
          `<rect x="${x}" y="${y}" width="${l}" height="${hauteurPiece}" fill="url(#${prefixeId}-${piece.etat})"/>`,
        );
      }

      const texte = texteDePiece(piece, { affichage, lettre: inconnue.lettre });
      if (piece.type === "inconnue" && affichage === "splat" && piece.etiquette === undefined) {
        const cote = hauteurPiece * 0.62;
        morceaux.push(
          `<g transform="translate(${x + l / 2 - cote / 2} ${y + hauteurPiece / 2 - cote / 2}) scale(${cote / 100})"><path d="${CHEMIN_SPLAT}" fill="${COULEURS_BARRES.splat}"/></g>`,
        );
      } else if (texte) {
        const italique = piece.type === "inconnue" && affichage === "lettre" && piece.etiquette === undefined;
        morceaux.push(
          `<text x="${x + l / 2}" y="${y + hauteurPiece / 2}" font-family="${italique ? POLICE_LETTRE : POLICE_VALEURS}"${italique ? ' font-style="italic"' : ""} font-size="${tailleTexte}" font-weight="900" letter-spacing="-1" fill="${fonds.texte}" text-anchor="middle" dominant-baseline="central">${texte}</text>`,
        );
      }
      morceaux.push(`</g>`);

      x += l;
    });

    // Filets : séparateurs verticaux internes (jamais sur le bord droit),
    // tracés une seule fois.
    let xs = margeGauche;
    ligne.pieces.slice(0, -1).forEach((piece) => {
      xs += poidsDePiece(piece) * echelle;
      morceaux.push(`<line x1="${xs}" y1="${y}" x2="${xs}" y2="${y + hauteurPiece}" ${filet}/>`);
    });
    // Contour de la ligne : gauche, droite, bas — et haut seulement pour
    // la première ligne (le trait du milieu n'est jamais doublé).
    morceaux.push(`<line x1="${margeGauche}" y1="${y}" x2="${margeGauche}" y2="${y + hauteurPiece}" ${filet}/>`);
    morceaux.push(`<line x1="${margeGauche + largeurLigne}" y1="${y}" x2="${margeGauche + largeurLigne}" y2="${y + hauteurPiece}" ${filet}/>`);
    if (i === 0) {
      morceaux.push(`<line x1="${margeGauche}" y1="${y}" x2="${margeGauche + largeurLigne}" y2="${y}" ${filet}/>`);
    }
    morceaux.push(`<line x1="${margeGauche}" y1="${y + hauteurPiece}" x2="${margeGauche + largeurLigne}" y2="${y + hauteurPiece}" ${filet}/>`);
  });

  morceaux.push("</svg>");
  return morceaux.join("");
}
