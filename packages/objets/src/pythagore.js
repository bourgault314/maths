// PythaBarre maths&go — rendu SVG, version 1, STATUT BROUILLON.
//
// Dessine les trois vues du problème depuis le moteur pur
// (pythagore-logique.js) : le schéma en barres (rectangles JOINTIFS aux
// couleurs de la charte — SANS la case bleu pâle d'auto/), le triangle
// rectangle aux VRAIES proportions avec son moulin (carrés construits
// sur les côtés), et la racine carrée DESSINÉE (squareRootSvg — jamais
// le caractère √).
// Les zones cliquables portent des attributs data-pytha-* ; la page
// pose les écouteurs.
//
// La palette vient de packages/charte : un objet ne sort jamais de
// packages/ pour aller chercher une couleur dans une page du studio.
// L'alias local garde le nom court utilisé partout dans le fichier.

import { briquesSvg, echapper } from "./figure.js";
import { COULEURS_PYTHAGORE } from "../../charte/src/charte.js";

const PYTHAGORE_COLORS = COULEURS_PYTHAGORE;
import {
  estRemplace,
  etapeCourante,
  formaterNombre,
  lignesBarres,
  memeCote,
  symboleRacine,
  valeurCote,
} from "./pythagore-logique.js";

export const VERSION_PYTHAGORE_RENDU = 1;

const { px, enveloppeSvg } = briquesSvg;
const POLICE = `'Segoe UI', system-ui, sans-serif`;

/** Le rôle de couleur d'un côté — sens partagé avec le moulin, jamais changeant. */
export function roleCouleur(probleme, cote) {
  if (memeCote(cote, probleme.hyp)) return "hyp";
  const jambes = probleme.jambes;
  return memeCote(cote, jambes[0]) ? "leg1" : "leg2";
}

const REMPLISSAGES = {
  hyp: { fond: PYTHAGORE_COLORS.hypFill, bord: PYTHAGORE_COLORS.hypStroke, texte: PYTHAGORE_COLORS.hypText },
  leg1: { fond: PYTHAGORE_COLORS.leg1Fill, bord: PYTHAGORE_COLORS.leg1Stroke, texte: PYTHAGORE_COLORS.leg1Text },
  leg2: { fond: PYTHAGORE_COLORS.leg2Fill, bord: PYTHAGORE_COLORS.leg2Stroke, texte: PYTHAGORE_COLORS.leg2Text },
  vide: { fond: "#f5f7fa", bord: "#8799ae", texte: "#50657d" },
  enlevee: { fond: "url(#pythaHachures)", bord: "#8799ae", texte: "#64748b" },
};

const texteSvg = (x, y, contenu, { couleur, taille = 22, graisse = 850, halo = 0 } = {}) =>
  `<text x="${px(x)}" y="${px(y)}" text-anchor="middle" dominant-baseline="central" font-family="${POLICE}" font-size="${taille}" font-weight="${graisse}" fill="${couleur}"${halo ? ` stroke="#ffffff" stroke-width="${halo}" paint-order="stroke" stroke-linejoin="round"` : ""}>${contenu}</text>`;

const defsHachures = `<defs><pattern id="pythaHachures" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(135)"><rect width="9" height="9" fill="#f1f5f9"/><line x1="0" y1="0" x2="0" y2="9" stroke="#94a3b8" stroke-width="2.5"/></pattern></defs>`;

/**
 * Le schéma en barres : deux lignes de rectangles jointifs, largeurs
 * proportionnelles aux carrés (largeur minimale préservée pour rester
 * cliquable). Cases actives : data-pytha-remplacer / data-pytha-calculer
 * ou data-pytha-slot pendant la construction de la relation.
 */
export function dessinerBarresPythagore(probleme, travail, options = {}) {
  const { largeur = 560, hauteurPiece = 62, selection = null, flash = null } = options;
  const modele = lignesBarres(probleme, travail);
  if (!modele) return "";
  const marge = 6;
  const largeurUtile = largeur - 2 * marge;
  const partMinimale = 0.18;

  const largeurs = (cases) => {
    const total = cases.reduce((somme, c) => somme + (Number(c.poids) || 1), 0);
    const brutes = cases.map((c) => (Number(c.poids) || 1) / total);
    const corrigees = brutes.map((part) => Math.max(part, cases.length > 1 ? partMinimale : part));
    const somme = corrigees.reduce((a, b) => a + b, 0);
    return corrigees.map((part) => (part / somme) * largeurUtile);
  };

  let contenu = defsHachures;
  const dessinerLigne = (cases, y) => {
    let x = marge;
    const tailles = largeurs(cases);
    cases.forEach((c, i) => {
      const w = tailles[i];
      const role = c.genre === "enlevee" ? "enlevee"
        : !c.cote ? "vide"
        : roleCouleur(probleme, c.cote);
      const teinte = REMPLISSAGES[role] ?? REMPLISSAGES.vide;
      const active = c.cliquable || modele.mode === "relation";
      const estSelection = selection && c.cote && memeCote(selection, c.cote);
      const estFlash = flash && c.cote && memeCote(flash.cote, c.cote);
      const bord = estFlash ? (flash.genre === "bad" ? "#dc2626" : "#16a34a") : estSelection ? "#7c3aed" : teinte.bord;
      const epaisseur = estFlash || estSelection ? 4 : 2.5;
      const attributs = modele.mode === "relation"
        ? ` data-pytha-slot="${echapper(c.slot)}"`
        : c.cliquable === "remplacer" ? ` data-pytha-remplacer="${echapper(c.cote)}"`
        : c.cliquable === "calculer" ? ` data-pytha-calculer="${echapper(c.cote)}"` : "";
      const curseur = attributs ? ` style="cursor:pointer"` : "";
      contenu += `<g${attributs}${curseur}><rect x="${px(x)}" y="${px(y)}" width="${px(w)}" height="${hauteurPiece}" fill="${role === "enlevee" ? REMPLISSAGES.enlevee.fond : teinte.fond}" stroke="${bord}" stroke-width="${epaisseur}"/>` +
        texteSvg(x + w / 2, y + hauteurPiece / 2, echapper(c.texte), { couleur: teinte.texte, taille: 23 }) +
        (active && attributs ? `<rect x="${px(x)}" y="${px(y)}" width="${px(w)}" height="${hauteurPiece}" fill="#000" fill-opacity="0"/>` : "") +
        `</g>`;
      x += w;
    });
  };
  dessinerLigne(modele.haut, 4);
  dessinerLigne(modele.bas, 4 + hauteurPiece);
  const hauteurTotale = 8 + hauteurPiece * 2;
  return enveloppeSvg(largeur, hauteurTotale, "schéma en barres de Pythagore", contenu);
}

/**
 * Le triangle rectangle aux vraies proportions, avec le moulin (carrés
 * construits sur les côtés) et les longueurs cliquables. Rotation 0-3.
 */
export function dessinerTrianglePythagore(probleme, travail, options = {}) {
  const { taille = 420, moulin = true, selection = null } = options;
  const a = probleme.inconnueEstHyp ? probleme.jambe1.valeur : valeurCote(probleme, probleme.jambes[0]);
  const b = probleme.inconnueEstHyp ? probleme.jambe2.valeur : valeurCote(probleme, probleme.jambes[1]);
  const [sommetDroit, sommetHaut, sommetDroite] = [
    probleme.angleDroit,
    probleme.jambes[0][1] === probleme.angleDroit ? probleme.jambes[0][0] : probleme.jambes[0][1],
    probleme.jambes[1][1] === probleme.angleDroit ? probleme.jambes[1][0] : probleme.jambes[1][1],
  ];

  // repère mathématique : angle droit à l'origine, jambe 1 verticale, jambe 2 horizontale
  const points = { [sommetDroit]: [0, 0], [sommetHaut]: [0, a], [sommetDroite]: [b, 0] };
  const etape = etapeCourante(probleme, travail);

  // rotation par quarts de tour
  const tourner = ([x, y]) => {
    switch (probleme.rotation) {
      case 1: return [-y, x];
      case 2: return [-x, -y];
      case 3: return [y, -x];
      default: return [x, y];
    }
  };

  const centre = probleme.lettres
    .map((l) => points[l])
    .reduce((acc, p) => [acc[0] + p[0] / 3, acc[1] + p[1] / 3], [0, 0]);

  // carré extérieur construit sur un côté (du côté opposé au centre)
  const carreSurCote = (p1, p2) => {
    const direction = [p2[0] - p1[0], p2[1] - p1[1]];
    const longueur = Math.hypot(...direction) || 1;
    let normale = [-direction[1] / longueur, direction[0] / longueur];
    const milieu = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const versCentre = [centre[0] - milieu[0], centre[1] - milieu[1]];
    if (normale[0] * versCentre[0] + normale[1] * versCentre[1] > 0) normale = [-normale[0], -normale[1]];
    const decale = ([x, y]) => [x + normale[0] * longueur, y + normale[1] * longueur];
    return { coins: [p1, p2, decale(p2), decale(p1)], centre: [milieu[0] + normale[0] * longueur / 2, milieu[1] + normale[1] * longueur / 2] };
  };

  // tous les points candidats (triangle + carrés du moulin) pour le cadrage
  const candidats = probleme.lettres.map((l) => tourner(points[l]));
  const carres = {};
  for (const cote of probleme.nomsCotes) {
    const [l1, l2] = [cote[0], cote[1]];
    const construit = carreSurCote(points[l1], points[l2]);
    carres[cote] = { coins: construit.coins.map(tourner), centre: tourner(construit.centre) };
    if (moulin) candidats.push(...carres[cote].coins);
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of candidats) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const margePx = 34;
  const echelle = (taille - 2 * margePx) / Math.max(maxX - minX, maxY - minY, 1e-9);
  const largeurSvg = (maxX - minX) * echelle + 2 * margePx;
  const hauteurSvg = (maxY - minY) * echelle + 2 * margePx;
  const poser = ([x, y]) => [margePx + (x - minX) * echelle, hauteurSvg - margePx - (y - minY) * echelle];

  const etiquetteAire = (cote) => {
    const entree = probleme.valeurs[cote];
    if (entree.inconnue) {
      return (travail.regroupe || travail.enleve || travail.racineFaite || travail.conclu)
        ? formaterNombre(travail.resultat)
        : `${cote}²`;
    }
    if (travail.carres[cote]) return formaterNombre(travail.carres[cote]);
    if (travail.remplace || estRemplace(travail, cote)) return `${formaterNombre(entree.valeur)}²`;
    return `${cote}²`;
  };

  let contenu = defsHachures;
  if (moulin) {
    for (const cote of probleme.nomsCotes) {
      const role = roleCouleur(probleme, cote);
      const teinte = REMPLISSAGES[role];
      const coins = carres[cote].coins.map(poser);
      const cliquable = etape === "relation";
      const estSelection = selection && memeCote(selection, cote);
      contenu += `<g${cliquable ? ` data-pytha-aire="${echapper(cote)}" style="cursor:pointer"` : ""}>` +
        `<polygon points="${coins.map(([x, y]) => `${px(x)},${px(y)}`).join(" ")}" fill="${teinte.fond}" stroke="${estSelection ? "#7c3aed" : teinte.bord}" stroke-width="${estSelection ? 4 : 2.5}"/>` +
        texteSvg(...poser(carres[cote].centre), echapper(etiquetteAire(cote)), { couleur: teinte.texte, taille: Math.max(13, 17 * Math.min(1, echelle * Math.min(a, b) / 40)) , halo: 4 }) +
        `</g>`;
    }
  }

  // triangle blanc par-dessus, angle droit rouge (convention AngleBarre)
  const sommetsEcran = probleme.lettres.map((l) => poser(tourner(points[l])));
  contenu += `<polygon points="${sommetsEcran.map(([x, y]) => `${px(x)},${px(y)}`).join(" ")}" fill="#ffffff" stroke="${PYTHAGORE_COLORS.outline}" stroke-width="3" stroke-linejoin="round"/>`;
  const droitEcran = poser(tourner(points[sommetDroit]));
  const versHaut = poser(tourner(points[sommetHaut]));
  const versDroite = poser(tourner(points[sommetDroite]));
  const unitaire = (p, q) => {
    const d = [q[0] - p[0], q[1] - p[1]];
    const n = Math.hypot(...d) || 1;
    return [d[0] / n, d[1] / n];
  };
  const u1 = unitaire(droitEcran, versHaut);
  const u2 = unitaire(droitEcran, versDroite);
  const cote = 13;
  contenu += `<path d="M ${px(droitEcran[0] + u1[0] * cote)} ${px(droitEcran[1] + u1[1] * cote)} l ${px(u2[0] * cote)} ${px(u2[1] * cote)} l ${px(-u1[0] * cote)} ${px(-u1[1] * cote)}" fill="none" stroke="#ef4444" stroke-width="2.5"/>`;

  // noms des sommets
  const centreEcran = poser(tourner(centre));
  for (const lettre of probleme.lettres) {
    const p = poser(tourner(points[lettre]));
    const direction = [p[0] - centreEcran[0], p[1] - centreEcran[1]];
    const n = Math.hypot(...direction) || 1;
    contenu += texteSvg(p[0] + (direction[0] / n) * 16, p[1] + (direction[1] / n) * 16, lettre, { couleur: PYTHAGORE_COLORS.outline, taille: 17, halo: 5 });
  }

  // longueurs des côtés — cliquables à l'étape « remplacer »
  for (const coteNom of probleme.nomsCotes) {
    const p1 = poser(tourner(points[coteNom[0]]));
    const p2 = poser(tourner(points[coteNom[1]]));
    const milieu = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const sortant = [milieu[0] - centreEcran[0], milieu[1] - centreEcran[1]];
    const n = Math.hypot(...sortant) || 1;
    const position = moulin
      ? [milieu[0] - (sortant[0] / n) * 15, milieu[1] - (sortant[1] / n) * 15]
      : [milieu[0] + (sortant[0] / n) * 15, milieu[1] + (sortant[1] / n) * 15];
    const entree = probleme.valeurs[coteNom];
    const texteLongueur = entree.inconnue
      ? travail.conclu
        ? `${symboleRacine(travail.resultat) === "≈" ? "≈ " : ""}${formaterNombre(Math.sqrt(travail.resultat))}${probleme.unite ? `\u00a0${probleme.unite}` : ""}`
        : "?"
      : `${formaterNombre(entree.valeur)}${probleme.unite ? `\u00a0${probleme.unite}` : ""}`;
    const cliquable = etape === "remplacer" && !entree.inconnue && !estRemplace(travail, coteNom);
    const role = roleCouleur(probleme, coteNom);
    contenu += `<g${cliquable ? ` data-pytha-longueur="${echapper(coteNom)}" style="cursor:pointer"` : ""}>` +
      texteSvg(position[0], position[1], echapper(texteLongueur), {
        couleur: entree.inconnue && !travail.conclu ? "#7c3aed" : REMPLISSAGES[role].texte,
        taille: 15.5,
        halo: 5,
      }) +
      (cliquable ? `<rect x="${px(position[0] - 30)}" y="${px(position[1] - 15)}" width="60" height="30" fill="#000" fill-opacity="0"/>` : "") +
      `</g>`;
  }

  return enveloppeSvg(largeurSvg, hauteurSvg, `triangle ${probleme.lettres.join("")} rectangle en ${probleme.angleDroit}`, contenu);
}

const arrondiSvg = (valeur) => Math.round(valeur * 1000) / 1000;

/**
 * Racine française compacte : le radicande commence juste après le crochet.
 *
 * Le tracé est celui écrit pour PythaBarre et le Moulin ; il vivait dans
 * studio/components/pythagore/visuals.js, d'où packages/ le tirait. Il est
 * désormais ici, du côté des objets, et le composant du studio le réexporte.
 * Le calcul n'a pas changé d'un millième : pythagore.test.js le vérifie.
 */
export function squareRootSvg({ x = 0, baseline = 20, radicand = "25", fontSize = 18, color = "#334155", fontWeight = 750 } = {}) {
  const round = arrondiSvg;
  const text = String(radicand);
  const textWidth = Math.max(fontSize * 0.62, text.length * fontSize * 0.56);
  const numberX = x + fontSize * 0.68;
  const barEnd = numberX + textWidth + 1;
  const d = `M ${round(x)} ${round(baseline - fontSize * 0.36)} l ${round(fontSize * 0.22)} ${round(fontSize * 0.34)} l ${round(fontSize * 0.32)} ${round(-fontSize * 0.82)} H ${round(barEnd)}`;
  return `<g fill="${color}" stroke="${color}"><path d="${d}" fill="none" stroke-width="${round(Math.max(1.8, fontSize * 0.11))}" stroke-linecap="round" stroke-linejoin="round"/><text x="${round(numberX)}" y="${round(baseline)}" stroke="none" font-family="Segoe UI,Arial,sans-serif" font-size="${fontSize}" font-weight="${fontWeight}">${text}</text></g>`;
}

/**
 * La racine carrée DESSINÉE, en SVG autonome à hauteur de ligne :
 * « gauche = √(radicande) » sans jamais utiliser le caractère √.
 */
export function racineEnLigne({ gauche, radicande, taillePolice = 20, couleur = "#0f172a" } = {}) {
  const texteGauche = `${gauche} = `;
  const largeurGauche = texteGauche.length * taillePolice * 0.56;
  const racine = squareRootSvg({
    x: largeurGauche,
    baseline: taillePolice * 1.06,
    radicand: echapper(String(radicande)),
    fontSize: taillePolice,
    color: couleur,
    fontWeight: 800,
  });
  const largeurTotale = largeurGauche + taillePolice * 0.75 + String(radicande).length * taillePolice * 0.62 + 6;
  const hauteur = taillePolice * 1.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px(largeurTotale)} ${px(hauteur)}" width="${px(largeurTotale)}" height="${px(hauteur)}" role="img" aria-label="${echapper(`${gauche} égale racine carrée de ${radicande}`)}" style="vertical-align:middle">` +
    `<text x="0" y="${px(taillePolice * 1.02)}" font-family="${POLICE}" font-size="${taillePolice}" font-weight="800" fill="${couleur}">${echapper(texteGauche)}</text>` +
    racine +
    `</svg>`;
}
