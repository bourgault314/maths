// Thalès maths&go — version 1, STATUT BROUILLON.
//
// LA figure de Thalès de base, avec ses variations de proportions :
// UN SEUL modèle par homothétie de centre A (le sommet commun) —
//   B = A + b·u   C = A + c·v   M = A + k·b·u   N = A + k·c·v
// Par CONSTRUCTION : A,M,B et A,N,C alignés, (MN) // (BC), et
// OM/OB = ON/OC = MN/BC = |k|. Le petit triangle a donc exactement
// les mêmes proportions que le grand — réduit (0 < k < 1), agrandi
// (k > 1) ou en papillon (k < 0), comme demandé par Gwenaël.
//
// Les lettres reprennent la figure historique du site : A sommet
// commun, M et N les points proches, B et C les points éloignés
// (auto/scripts/shared/visuals/geometry/thales-configuration.js — dont
// les coordonnées figées sont remplacées ici par une vraie
// construction). Couleurs de cours : sommet commun ORANGE, petit
// triangle BLEU, grand triangle TURQUOISE ; exercice : tout noir.

import {
  RAD,
  distance,
  sontAlignes,
  sontParalleles,
} from "./geometrie.js";
import { briquesSvg, echapper, formaterLongueur } from "./figure.js";
import { egalite, quotient, segment as segmentExpr, versUnicode } from "./expressions.js";

export const VERSION_THALES = 1;

const { ligne, croix, texte, px, enveloppeSvg } = briquesSvg;
const ENCRE = "#0f172a";
// palette de cours du composant historique (thales-configuration.js)
const COULEURS_THALES = { sommet: "#ff9114", petit: "#11468c", grand: "#1daeae" };

/** Les variations prêtes à l'emploi : même allure, proportions différentes. */
export const VARIATIONS_THALES = {
  base: { k: 0.4, angleDeg: 38, b: 10, c: 9 },
  reduite: { k: 0.25, angleDeg: 38, b: 10, c: 9 },
  moitie: { k: 0.5, angleDeg: 38, b: 10, c: 9 },
  deuxTiers: { k: 2 / 3, angleDeg: 44, b: 9, c: 7.5 },
  papillon: { k: -0.5, angleDeg: 34, b: 8, c: 7 },
  papillonPetit: { k: -0.35, angleDeg: 34, b: 9, c: 8 },
};

/**
 * Crée une configuration de Thalès par homothétie de centre A.
 *
 * @param {object} options
 * @param {string} [options.variation] — clé de VARIATIONS_THALES
 * @param {number} [options.k] — rapport (0<k<1 emboîté, k<0 papillon, k>1 agrandi)
 * @param {number} [options.angleDeg] — angle en A, lisible (20 à 160)
 * @param {number} [options.b] — longueur AB ; @param {number} [options.c] — AC
 * @param {string} [options.lettres] — cinq lettres « AMNBC »
 * @param {number} [options.orientationDeg] @param {boolean} [options.miroir]
 */
export function creerThales(options = {}) {
  const variation = VARIATIONS_THALES[options.variation ?? "base"] ?? VARIATIONS_THALES.base;
  const {
    k = variation.k,
    angleDeg = variation.angleDeg,
    b = variation.b,
    c = variation.c,
    lettres = "AMNBC",
    orientationDeg = 8,
    miroir = false,
  } = options;
  if (!Number.isFinite(k) || k === 0 || Math.abs(k) > 4) {
    throw new RangeError("Thalès : le rapport k doit être non nul et raisonnable (|k| ≤ 4)");
  }
  if (!(angleDeg >= 20 && angleDeg <= 160)) {
    throw new RangeError("Thalès : l'angle au sommet doit rester lisible (20° à 160°)");
  }
  if (!(b > 0) || !(c > 0)) {
    throw new RangeError("Thalès : les longueurs AB et AC doivent être positives");
  }
  if (!/^[A-Z]{5}$/.test(lettres) || new Set(lettres).size !== 5) {
    throw new RangeError("Thalès : cinq lettres majuscules distinctes attendues (AMNBC)");
  }
  const [A, M, N, B, C] = lettres.split("");
  const signe = miroir ? -1 : 1;
  const u = [Math.cos(orientationDeg * RAD), Math.sin(orientationDeg * RAD)];
  const v = [
    Math.cos((orientationDeg + signe * angleDeg) * RAD),
    Math.sin((orientationDeg + signe * angleDeg) * RAD),
  ];
  const points = {
    [A]: [0, 0],
    [B]: [b * u[0], b * u[1]],
    [C]: [c * v[0], c * v[1]],
    [M]: [k * b * u[0], k * b * u[1]],
    [N]: [k * c * v[0], k * c * v[1]],
  };
  const configuration = k < 0 ? "papillon" : "emboitee";
  const longueurs = {
    [`${A}${M}`]: Math.abs(k) * b,
    [`${A}${B}`]: b,
    [`${A}${N}`]: Math.abs(k) * c,
    [`${A}${C}`]: c,
    [`${M}${N}`]: Math.abs(k) * distance(points[B], points[C]),
    [`${B}${C}`]: distance(points[B], points[C]),
  };
  return {
    type: "thales",
    version: 1,
    configuration,
    k,
    lettres: { sommet: A, proches: [M, N], eloignes: [B, C] },
    points,
    longueurs,
    // l'ordre RÉEL des points sur chaque droite (pour la rédaction)
    alignements: k > 0 ? [[A, M, B], [A, N, C]] : [[M, A, B], [N, A, C]],
    paralleles: [`(${M}${N})`, `(${B}${C})`],
    description: `configuration de Thalès ${configuration === "papillon" ? "papillon" : "emboîtée"} de sommet ${A}, rapport ${String(Math.round(Math.abs(k) * 100) / 100).replace(".", ",")}`,
  };
}

/**
 * Résout une longueur inconnue par l'égalité des rapports
 * (produit en croix EXACT : x = a·b/c), et rend les étapes de la
 * rédaction du site (fiche « Thalès direct » de Gwenaël).
 *
 * @param {object} instance
 * @param {object} donnees — { inconnue: « MN », connues?: sous-ensemble
 *   des longueurs à afficher (par défaut : celles du rapport utile) }
 */
export function resoudreThales(instance, { inconnue } = {}) {
  const { sommet: A, proches: [M, N], eloignes: [B, C] } = instance.lettres;
  // les trois rapports, chacun (petit, grand)
  const rapports = [
    [`${A}${M}`, `${A}${B}`],
    [`${A}${N}`, `${A}${C}`],
    [`${M}${N}`, `${B}${C}`],
  ];
  const rapportDe = rapports.find((paire) => paire.includes(inconnue));
  if (!rapportDe) {
    throw new RangeError(`Thalès : « ${inconnue} » n'est pas une des six longueurs de la figure`);
  }
  // un rapport entièrement connu (ni l'un ni l'autre n'est l'inconnue)
  const rapportConnu = rapports.find((paire) => !paire.includes(inconnue));
  const [petitX, grandX] = rapportDe;
  const [petitC, grandC] = rapportConnu;
  const valeur = (nomLongueur) => instance.longueurs[nomLongueur];
  const enHaut = inconnue === petitX; // l'inconnue est-elle au numérateur ?
  // produit en croix exact : x·d = a·b
  const resultat = enHaut
    ? (valeur(grandX) * valeur(petitC)) / valeur(grandC)
    : (valeur(petitX) * valeur(grandC)) / valeur(petitC);
  const [a1, a2, a3] = instance.alignements[0];
  const [b1, b2, b3] = instance.alignements[1];
  const arrondi = (x) => Math.round(x * 100) / 100;

  const troisRapports = egalite(
    quotient(segmentExpr(rapports[0][0]), segmentExpr(rapports[0][1])),
    quotient(segmentExpr(rapports[1][0]), segmentExpr(rapports[1][1])),
    quotient(segmentExpr(rapports[2][0]), segmentExpr(rapports[2][1])),
  );
  const deuxUtiles = egalite(
    quotient(segmentExpr(petitX), segmentExpr(grandX)),
    quotient(segmentExpr(petitC), segmentExpr(grandC)),
  );
  const nombres = (x) => String(arrondi(x)).replace(".", ",");
  const substitution = `${inconnue === petitX ? inconnue : nombres(valeur(petitX))}/${inconnue === grandX ? inconnue : nombres(valeur(grandX))} = ${nombres(valeur(petitC))}/${nombres(valeur(grandC))}`;
  const produitEnCroix = enHaut
    ? `${nombres(valeur(grandC))} × ${inconnue} = ${nombres(valeur(grandX))} × ${nombres(valeur(petitC))}`
    : `${nombres(valeur(petitC))} × ${inconnue} = ${nombres(valeur(petitX))} × ${nombres(valeur(grandC))}`;
  const isolement = enHaut
    ? `${inconnue} = (${nombres(valeur(grandX))} × ${nombres(valeur(petitC))}) ÷ ${nombres(valeur(grandC))}`
    : `${inconnue} = (${nombres(valeur(petitX))} × ${nombres(valeur(grandC))}) ÷ ${nombres(valeur(petitC))}`;

  return {
    inconnue,
    valeur: resultat,
    exacte: Number.isInteger(arrondi(resultat) * 100),
    etapes: [
      {
        genre: "justification",
        texte: `Les points ${a1}, ${a2}, ${a3} sont alignés, ainsi que les points ${b1}, ${b2}, ${b3}, et les droites ${instance.paralleles[0]} et ${instance.paralleles[1]} sont parallèles.`,
      },
      { genre: "justification", texte: "D'après le théorème de Thalès :" },
      { genre: "calcul", unicode: versUnicode(troisRapports) },
      {
        genre: "justification",
        texte: "Je garde le rapport qui contient la longueur cherchée et un rapport entièrement connu :",
      },
      { genre: "calcul", unicode: versUnicode(deuxUtiles) },
      { genre: "calcul", unicode: substitution },
      { genre: "justification", texte: "J'utilise l'égalité des produits en croix, puis j'isole la longueur cherchée :" },
      { genre: "calcul", unicode: produitEnCroix },
      { genre: "calcul", unicode: isolement },
      { genre: "conclusion", texte: `Donc ${inconnue} = ${nombres(resultat)} cm.` },
    ],
  };
}

/**
 * Dessine la figure de Thalès (emboîtée ou papillon) — vraie
 * construction à l'échelle, jamais de coordonnées figées.
 *
 * @param {object} instance
 * @param {object} [display] — { taille, theme (« noir » | « couleur »),
 *   longueurs: true | [« AM », …], textes: { AM: « ? » }, noms: true }
 */
export function dessinerThales(instance, display = {}) {
  const largeur = display.taille ?? 420;
  const hauteur = display.hauteur ?? Math.round(largeur * 0.66);
  const theme = display.theme ?? "noir";
  const enCouleur = theme === "couleur";
  const marge = 40;
  const { sommet: A, proches: [M, N], eloignes: [B, C] } = instance.lettres;

  // cadrage : toutes les coordonnées mathématiques → écran (y inversé)
  const nomsPoints = Object.keys(instance.points);
  const xs = nomsPoints.map((p) => instance.points[p][0]);
  const ys = nomsPoints.map((p) => instance.points[p][1]);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const echelle = Math.min(
    (largeur - 2 * marge) / Math.max(maxX - minX, 1e-9),
    (hauteur - 2 * marge) / Math.max(maxY - minY, 1e-9),
  );
  const E = {};
  for (const nomPoint of nomsPoints) {
    E[nomPoint] = [
      marge + (instance.points[nomPoint][0] - minX) * echelle,
      marge + (maxY - instance.points[nomPoint][1]) * echelle,
    ];
  }

  const couleurGrand = enCouleur ? COULEURS_THALES.grand : ENCRE;
  const couleurPetit = enCouleur ? COULEURS_THALES.petit : ENCRE;
  const couleurSommet = enCouleur ? COULEURS_THALES.sommet : ENCRE;
  const morceaux = [];

  // le grand triangle (les deux droites portent aussi M et N)
  morceaux.push(ligne(E[A], E[B], { couleur: couleurGrand, epaisseur: 3.5 }));
  morceaux.push(ligne(E[A], E[C], { couleur: couleurGrand, epaisseur: 3.5 }));
  morceaux.push(ligne(E[B], E[C], { couleur: couleurGrand, epaisseur: 3.5 }));
  // la base du petit triangle
  morceaux.push(ligne(E[M], E[N], { couleur: couleurPetit, epaisseur: 3.5 }));

  // points : croix maths&go
  for (const nomPoint of nomsPoints) {
    const couleur =
      nomPoint === A ? couleurSommet : [M, N].includes(nomPoint) ? couleurPetit : couleurGrand;
    morceaux.push(croix(E[nomPoint], { couleur, taille: 5 }));
  }
  // noms, posés à l'écart du centre de la figure
  if (display.noms ?? true) {
    const centre = [
      nomsPoints.reduce((s, p) => s + E[p][0], 0) / nomsPoints.length,
      nomsPoints.reduce((s, p) => s + E[p][1], 0) / nomsPoints.length,
    ];
    for (const nomPoint of nomsPoints) {
      const dehors = Math.atan2(E[nomPoint][1] - centre[1], E[nomPoint][0] - centre[0]);
      const couleur =
        nomPoint === A ? couleurSommet : [M, N].includes(nomPoint) ? couleurPetit : couleurGrand;
      morceaux.push(
        texte(nomPoint, [
          E[nomPoint][0] + Math.cos(dehors) * 16,
          E[nomPoint][1] + Math.sin(dehors) * 16,
        ], { couleur, taille: 18 }),
      );
    }
  }

  // longueurs affichées (vraies valeurs ou textes imposés « ? », « x »)
  const listeLongueurs =
    display.longueurs === true
      ? Object.keys(instance.longueurs)
      : Array.isArray(display.longueurs)
        ? display.longueurs
        : [];
  for (const nomLongueur of listeLongueurs) {
    if (!(nomLongueur in instance.longueurs)) {
      throw new RangeError(`Thalès : longueur inconnue « ${nomLongueur} »`);
    }
    const [p, q] = [E[nomLongueur[0]], E[nomLongueur[1]]];
    const milieuSegment = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const normale = Math.atan2(q[1] - p[1], q[0] - p[0]) - Math.PI / 2;
    const contenu =
      display.textes?.[nomLongueur] !== undefined
        ? echapper(display.textes[nomLongueur])
        : echapper(formaterLongueur(Math.round(instance.longueurs[nomLongueur] * 100) / 100, "cm"));
    morceaux.push(
      texte(contenu, [
        milieuSegment[0] + Math.cos(normale) * 15,
        milieuSegment[1] + Math.sin(normale) * 15,
      ], { couleur: ENCRE, taille: 13.5, halo: 4 }),
    );
  }

  return enveloppeSvg(largeur, hauteur, instance.description, morceaux.join(""));
}
