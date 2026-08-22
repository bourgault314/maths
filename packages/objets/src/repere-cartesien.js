// Objet officiel V2 « repère cartésien scolaire ».
//
// Un seul rendu sert au lecteur Automatismes, au cours, aux aides, aux
// corrections et au Studio. Le calcul reste pur et déterministe : mêmes
// bornes et mêmes points produisent exactement le même SVG.

import { COULEURS, TYPOGRAPHIE } from "../../charte/src/charte.js?v=49";

export const VERSION_REPERE_CARTESIEN = 1;
export const SIGNE_MOINS_REPERE = "−";

export const ROLES_POINT_REPERE = Object.freeze([
  "donne",
  "choisi",
  "attendu",
  "exemple",
]);

export const COULEURS_REPERE = Object.freeze({
  encre: COULEURS.encre,
  grille: COULEURS.ligne,
  axe: COULEURS.bleuFonce,
  papier: COULEURS.papier,
  point: COULEURS.bleu,
  guideAbscisse: COULEURS.orange,
  guideOrdonnee: COULEURS.turquoise,
  choisi: COULEURS.erreur,
  attendu: COULEURS.reussite,
});

const POLICE_TEXTE = TYPOGRAPHIE.texte.replaceAll('"', "'");
const POLICE_MATHEMATIQUES = TYPOGRAPHIE.mathematiques.replaceAll('"', "'");

const LARGEUR_MIN = 280;
const LARGEUR_MAX = 1000;
const LARGEUR_DEFAUT = 640;
const INTERVALLES_MIN = 4;
const INTERVALLES_MAX = 12;
const CELLULE_MAX = 64;
const MARGE_GAUCHE = 42;
const MARGE_DROITE = 30;
const MARGE_HAUTE = 26;
const MARGE_BASSE = 40;
const TAILLE_NOMBRE = 15;
const TAILLE_POINT = 17;
const DEMI_CROIX = 7;

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (caractere) => ({
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

function entierBorne(valeur, nom, minimum, maximum) {
  if (!Number.isSafeInteger(valeur) || valeur < minimum || valeur > maximum) {
    throw new RangeError(`${nom} : entier entre ${minimum} et ${maximum} requis.`);
  }
  return valeur;
}

function normaliserBornes(options, quoi) {
  const xMin = entierBorne(options.xMin ?? -4, `${quoi}.xMin`, -20, -1);
  const xMax = entierBorne(options.xMax ?? 4, `${quoi}.xMax`, 1, 20);
  const yMin = entierBorne(options.yMin ?? -3, `${quoi}.yMin`, -20, -1);
  const yMax = entierBorne(options.yMax ?? 3, `${quoi}.yMax`, 1, 20);
  const largeurX = xMax - xMin;
  const largeurY = yMax - yMin;
  if (largeurX < INTERVALLES_MIN || largeurX > INTERVALLES_MAX) {
    throw new RangeError(`${quoi} : xMax − xMin doit être compris entre 4 et 12.`);
  }
  if (largeurY < INTERVALLES_MIN || largeurY > INTERVALLES_MAX) {
    throw new RangeError(`${quoi} : yMax − yMin doit être compris entre 4 et 12.`);
  }
  return Object.freeze({ xMin, xMax, yMin, yMax });
}

function normaliserLargeur(valeur, quoi) {
  const largeur = valeur ?? LARGEUR_DEFAUT;
  if (!Number.isFinite(largeur) || largeur < LARGEUR_MIN || largeur > LARGEUR_MAX) {
    throw new RangeError(`${quoi}.largeur : nombre entre ${LARGEUR_MIN} et ${LARGEUR_MAX} requis.`);
  }
  return arrondi2(largeur);
}

function normaliserPoint(point, index, bornes, quoi) {
  const chemin = `${quoi}.points[${index}]`;
  if (typeof point !== "object" || point === null || Array.isArray(point)) {
    throw new TypeError(`${chemin} : objet attendu.`);
  }
  const nom = String(point.nom ?? "");
  if (!/^[A-NP-Z]$/.test(nom)) {
    throw new RangeError(`${chemin}.nom : lettre majuscule différente de O requise.`);
  }
  const x = entierBorne(point.x, `${chemin}.x`, bornes.xMin, bornes.xMax);
  const y = entierBorne(point.y, `${chemin}.y`, bornes.yMin, bornes.yMax);
  const role = point.role ?? "donne";
  if (!ROLES_POINT_REPERE.includes(role)) {
    throw new RangeError(`${chemin}.role : rôle de point inconnu « ${role} ».`);
  }
  const afficherNom = point.afficherNom ?? true;
  if (typeof afficherNom !== "boolean") {
    throw new TypeError(`${chemin}.afficherNom : booléen requis.`);
  }
  return Object.freeze({ nom, x, y, role, afficherNom });
}

function normaliserPoints(points, bornes, quoi) {
  if (points === undefined) return Object.freeze([]);
  if (!Array.isArray(points) || points.length > 8) {
    throw new RangeError(`${quoi}.points : liste de zéro à huit points requise.`);
  }
  const normalises = points.map((point, index) => normaliserPoint(point, index, bornes, quoi));
  const noms = normalises.map((point) => point.nom);
  if (new Set(noms).size !== noms.length) {
    // Une correction peut superposer deux rôles au même endroit, mais garde
    // des noms distincts pour que la description reste non ambiguë.
    throw new RangeError(`${quoi}.points : les noms de points doivent être distincts.`);
  }
  return Object.freeze(normalises);
}

function normaliserGuides(guides, bornes, quoi) {
  if (guides === undefined) return Object.freeze([]);
  if (!Array.isArray(guides) || guides.length > 8) {
    throw new RangeError(`${quoi}.guides : liste de zéro à huit guides requise.`);
  }
  return Object.freeze(guides.map((guide, index) => {
    const chemin = `${quoi}.guides[${index}]`;
    if (typeof guide !== "object" || guide === null || Array.isArray(guide)) {
      throw new TypeError(`${chemin} : objet attendu.`);
    }
    const axe = guide.axe;
    if (axe !== "abscisses" && axe !== "ordonnees") {
      throw new RangeError(`${chemin}.axe : « abscisses » ou « ordonnees » requis.`);
    }
    return Object.freeze({
      x: entierBorne(guide.x, `${chemin}.x`, bornes.xMin, bornes.xMax),
      y: entierBorne(guide.y, `${chemin}.y`, bornes.yMin, bornes.yMax),
      axe,
    });
  }));
}

function normaliserChemin(chemin, bornes, quoi) {
  if (chemin === undefined || chemin === null) return null;
  if (typeof chemin !== "object" || Array.isArray(chemin)) {
    throw new TypeError(`${quoi}.cheminPlacement : objet attendu.`);
  }
  const etape = chemin.etape ?? "complet";
  if (etape !== "horizontal" && etape !== "complet") {
    throw new RangeError(`${quoi}.cheminPlacement.etape : « horizontal » ou « complet » requis.`);
  }
  return Object.freeze({
    x: entierBorne(chemin.x, `${quoi}.cheminPlacement.x`, bornes.xMin, bornes.xMax),
    y: entierBorne(chemin.y, `${quoi}.cheminPlacement.y`, bornes.yMin, bornes.yMax),
    etape,
  });
}

function geometrieRepere(bornes, largeur) {
  const nombreX = bornes.xMax - bornes.xMin;
  const nombreY = bornes.yMax - bornes.yMin;
  const cellule = arrondi2(Math.min(
    CELLULE_MAX,
    (largeur - MARGE_GAUCHE - MARGE_DROITE) / nombreX,
  ));
  const largeurTrace = cellule * nombreX;
  const xGauche = arrondi2((largeur - largeurTrace) / 2);
  const xDroite = arrondi2(xGauche + largeurTrace);
  const yHaut = MARGE_HAUTE;
  const yBas = arrondi2(yHaut + cellule * nombreY);
  const hauteur = arrondi2(yBas + MARGE_BASSE);
  const xAxe = arrondi2(xGauche + (0 - bornes.xMin) * cellule);
  const yAxe = arrondi2(yBas - (0 - bornes.yMin) * cellule);
  return Object.freeze({
    ...bornes,
    largeur,
    hauteur,
    cellule,
    xGauche,
    xDroite,
    yHaut,
    yBas,
    xAxe,
    yAxe,
  });
}

/** Convertit des coordonnées mathématiques en coordonnées du SVG. */
export function positionDansRepere(x, y, geometrie) {
  if (
    !geometrie
    || !Number.isFinite(geometrie.cellule)
    || !Number.isSafeInteger(x)
    || !Number.isSafeInteger(y)
    || x < geometrie.xMin
    || x > geometrie.xMax
    || y < geometrie.yMin
    || y > geometrie.yMax
  ) {
    throw new RangeError("positionDansRepere : point entier visible requis.");
  }
  return Object.freeze({
    x: arrondi2(geometrie.xGauche + (x - geometrie.xMin) * geometrie.cellule),
    y: arrondi2(geometrie.yBas - (y - geometrie.yMin) * geometrie.cellule),
  });
}

function texteSvg({ x, y, contenu, taille, graisse = 400, couleur, ancre = "middle", police = POLICE_MATHEMATIQUES, italique = false, halo = false }) {
  return `<text x="${arrondi2(x)}" y="${arrondi2(y)}" text-anchor="${ancre}" `
    + `font-family="${police}" font-size="${taille}" font-weight="${graisse}" `
    + `${italique ? 'font-style="italic" ' : ""}`
    + `font-variant-numeric="lining-nums tabular-nums" fill="${couleur}" `
    + `${halo ? `paint-order="stroke" stroke="${COULEURS_REPERE.papier}" stroke-width="4" stroke-linejoin="round" ` : ""}`
    + `>${echapper(contenu)}</text>`;
}

function ligneSvg(x1, y1, x2, y2, couleur, epaisseur, supplement = "") {
  return `<line x1="${arrondi2(x1)}" y1="${arrondi2(y1)}" x2="${arrondi2(x2)}" y2="${arrondi2(y2)}" `
    + `stroke="${couleur}" stroke-width="${epaisseur}" ${supplement}/>`;
}

function formaterEntier(valeur) {
  return valeur < 0 ? `${SIGNE_MOINS_REPERE}${Math.abs(valeur)}` : String(valeur);
}

function rectanglesSeChevauchent(a, b, marge = 2) {
  return !(
    a.droite + marge < b.gauche
    || b.droite + marge < a.gauche
    || a.bas + marge < b.haut
    || b.bas + marge < a.haut
  );
}

function rectangleTexte(x, y, nom, ancre = "middle") {
  const largeur = Math.max(13, nom.length * 10);
  const gauche = ancre === "start" ? x : ancre === "end" ? x - largeur : x - largeur / 2;
  return { gauche, droite: gauche + largeur, haut: y - 15, bas: y + 3 };
}

function obstaclesGraduations(geometrie) {
  const obstacles = [];
  for (let x = geometrie.xMin; x <= geometrie.xMax; x += 1) {
    if (x === 0) continue;
    const position = positionDansRepere(x, 0, geometrie);
    obstacles.push(rectangleTexte(position.x, geometrie.yAxe + 21, formaterEntier(x)));
  }
  for (let y = geometrie.yMin; y <= geometrie.yMax; y += 1) {
    if (y === 0) continue;
    const position = positionDansRepere(0, y, geometrie);
    obstacles.push(rectangleTexte(geometrie.xAxe - 10, position.y + 5, formaterEntier(y), "end"));
  }
  obstacles.push(rectangleTexte(geometrie.xAxe - 9, geometrie.yAxe - 8, "O", "end"));
  return obstacles;
}

function choisirEtiquettes(points, geometrie) {
  const obstacles = obstaclesGraduations(geometrie);
  for (const point of points) {
    const p = positionDansRepere(point.x, point.y, geometrie);
    obstacles.push({ gauche: p.x - 9, droite: p.x + 9, haut: p.y - 9, bas: p.y + 9 });
  }
  const choix = [];
  const decalages = [
    { dx: 12, dy: -12, ancre: "start" },
    { dx: -12, dy: -12, ancre: "end" },
    { dx: 12, dy: 20, ancre: "start" },
    { dx: -12, dy: 20, ancre: "end" },
    { dx: 0, dy: -15, ancre: "middle" },
    { dx: 0, dy: 23, ancre: "middle" },
    { dx: 14, dy: 6, ancre: "start" },
    { dx: -14, dy: 6, ancre: "end" },
  ];
  for (const point of points) {
    const p = positionDansRepere(point.x, point.y, geometrie);
    let meilleur = null;
    for (const [rang, candidat] of decalages.entries()) {
      const x = p.x + candidat.dx;
      const y = p.y + candidat.dy;
      const rectangle = rectangleTexte(x, y, point.nom, candidat.ancre);
      let score = rang;
      if (
        rectangle.gauche < geometrie.xGauche - 20
        || rectangle.droite > geometrie.xDroite + 20
        || rectangle.haut < geometrie.yHaut - 18
        || rectangle.bas > geometrie.yBas + 24
      ) score += 1000;
      score += obstacles.filter((obstacle) => rectanglesSeChevauchent(rectangle, obstacle)).length * 100;
      if (!meilleur || score < meilleur.score) meilleur = { x, y, ancre: candidat.ancre, rectangle, score };
    }
    choix.push(Object.freeze({ point, x: meilleur.x, y: meilleur.y, ancre: meilleur.ancre }));
    obstacles.push(meilleur.rectangle);
  }
  return Object.freeze(choix);
}

function couleurPoint(role) {
  if (role === "choisi") return COULEURS_REPERE.choisi;
  if (role === "attendu") return COULEURS_REPERE.attendu;
  if (role === "exemple") return COULEURS_REPERE.guideAbscisse;
  return COULEURS_REPERE.point;
}

function dessinerCroix(point, geometrie) {
  const p = positionDansRepere(point.x, point.y, geometrie);
  const couleur = couleurPoint(point.role);
  const croix = (epaisseur, teinte) =>
    ligneSvg(p.x - DEMI_CROIX, p.y - DEMI_CROIX, p.x + DEMI_CROIX, p.y + DEMI_CROIX, teinte, epaisseur, 'stroke-linecap="round"')
    + ligneSvg(p.x - DEMI_CROIX, p.y + DEMI_CROIX, p.x + DEMI_CROIX, p.y - DEMI_CROIX, teinte, epaisseur, 'stroke-linecap="round"');
  return croix(7, COULEURS_REPERE.papier) + croix(3.4, couleur);
}

function dessinerGuides(guides, geometrie) {
  return guides.map((guide) => {
    const point = positionDansRepere(guide.x, guide.y, geometrie);
    const fin = guide.axe === "abscisses"
      ? positionDansRepere(guide.x, 0, geometrie)
      : positionDansRepere(0, guide.y, geometrie);
    const couleur = guide.axe === "abscisses"
      ? COULEURS_REPERE.guideAbscisse
      : COULEURS_REPERE.guideOrdonnee;
    return ligneSvg(point.x, point.y, fin.x, fin.y, couleur, 2.8, 'stroke-dasharray="7 6" stroke-linecap="round"');
  }).join("");
}

function pointeChemin(depart, arrivee, couleur) {
  const dx = arrivee.x - depart.x;
  const dy = arrivee.y - depart.y;
  const longueur = Math.hypot(dx, dy);
  if (longueur < 1) return "";
  const ux = dx / longueur;
  const uy = dy / longueur;
  const px = -uy;
  const py = ux;
  const baseX = arrivee.x - ux * 10;
  const baseY = arrivee.y - uy * 10;
  const points = [
    `${arrondi2(arrivee.x)},${arrondi2(arrivee.y)}`,
    `${arrondi2(baseX + px * 5)},${arrondi2(baseY + py * 5)}`,
    `${arrondi2(baseX - px * 5)},${arrondi2(baseY - py * 5)}`,
  ].join(" ");
  return `<polygon points="${points}" fill="${couleur}"/>`;
}

function dessinerChemin(chemin, geometrie) {
  if (!chemin) return "";
  const origine = positionDansRepere(0, 0, geometrie);
  const milieu = positionDansRepere(chemin.x, 0, geometrie);
  const arrivee = positionDansRepere(chemin.x, chemin.y, geometrie);
  let svg = "";
  if (chemin.x !== 0) {
    svg += ligneSvg(origine.x, origine.y, milieu.x, milieu.y, COULEURS_REPERE.guideAbscisse, 4, 'stroke-linecap="round"');
    svg += pointeChemin(origine, milieu, COULEURS_REPERE.guideAbscisse);
  }
  if (chemin.etape === "complet" && chemin.y !== 0) {
    svg += ligneSvg(milieu.x, milieu.y, arrivee.x, arrivee.y, COULEURS_REPERE.guideOrdonnee, 4, 'stroke-linecap="round"');
    svg += pointeChemin(milieu, arrivee, COULEURS_REPERE.guideOrdonnee);
  }
  return svg;
}

function dessinerGrille(geometrie) {
  let svg = "";
  for (let x = geometrie.xMin; x <= geometrie.xMax; x += 1) {
    if (x === 0) continue;
    const p = positionDansRepere(x, 0, geometrie);
    svg += ligneSvg(p.x, geometrie.yHaut, p.x, geometrie.yBas, COULEURS_REPERE.grille, 1);
  }
  for (let y = geometrie.yMin; y <= geometrie.yMax; y += 1) {
    if (y === 0) continue;
    const p = positionDansRepere(0, y, geometrie);
    svg += ligneSvg(geometrie.xGauche, p.y, geometrie.xDroite, p.y, COULEURS_REPERE.grille, 1);
  }
  return svg;
}

function dessinerAxes(geometrie) {
  let svg = "";
  svg += ligneSvg(geometrie.xGauche, geometrie.yAxe, geometrie.xDroite, geometrie.yAxe, COULEURS_REPERE.axe, 2.4, 'stroke-linecap="round"');
  svg += ligneSvg(geometrie.xAxe, geometrie.yBas, geometrie.xAxe, geometrie.yHaut, COULEURS_REPERE.axe, 2.4, 'stroke-linecap="round"');
  svg += pointeChemin({ x: geometrie.xDroite - 13, y: geometrie.yAxe }, { x: geometrie.xDroite + 1, y: geometrie.yAxe }, COULEURS_REPERE.axe);
  svg += pointeChemin({ x: geometrie.xAxe, y: geometrie.yHaut + 13 }, { x: geometrie.xAxe, y: geometrie.yHaut - 1 }, COULEURS_REPERE.axe);
  return svg;
}

function dessinerGraduations(geometrie, afficherNomsAxes) {
  let svg = "";
  for (let x = geometrie.xMin; x <= geometrie.xMax; x += 1) {
    const p = positionDansRepere(x, 0, geometrie);
    // À l'extrémité positive, la flèche remplace le trait de graduation.
    // Le nombre reste affiché : la borne demeure donc lisible sans superposer
    // deux signes graphiques au même endroit.
    if (x !== geometrie.xMax) {
      svg += ligneSvg(p.x, geometrie.yAxe - 4, p.x, geometrie.yAxe + 4, COULEURS_REPERE.axe, 1.6);
    }
    if (x !== 0) {
      svg += texteSvg({ x: p.x, y: geometrie.yAxe + 21, contenu: formaterEntier(x), taille: TAILLE_NOMBRE, couleur: COULEURS_REPERE.encre, graisse: 600, halo: true });
    }
  }
  for (let y = geometrie.yMin; y <= geometrie.yMax; y += 1) {
    const p = positionDansRepere(0, y, geometrie);
    if (y !== geometrie.yMax) {
      svg += ligneSvg(geometrie.xAxe - 4, p.y, geometrie.xAxe + 4, p.y, COULEURS_REPERE.axe, 1.6);
    }
    if (y !== 0) {
      svg += texteSvg({ x: geometrie.xAxe - 10, y: p.y + 5, contenu: formaterEntier(y), taille: TAILLE_NOMBRE, couleur: COULEURS_REPERE.encre, graisse: 600, ancre: "end", halo: true });
    }
  }
  // O reste au-dessus et à gauche de l'origine : sur un écran étroit, cette
  // place l'écarte nettement de la graduation −1 écrite sous l'axe.
  svg += texteSvg({ x: geometrie.xAxe - 9, y: geometrie.yAxe - 8, contenu: "O", taille: 16, couleur: COULEURS_REPERE.axe, graisse: 700, ancre: "end", italique: true, halo: true });
  if (afficherNomsAxes) {
    svg += texteSvg({ x: geometrie.xDroite + 14, y: geometrie.yAxe + 5, contenu: "x", taille: 17, couleur: COULEURS_REPERE.axe, graisse: 700, italique: true });
    svg += texteSvg({ x: geometrie.xAxe + 12, y: geometrie.yHaut - 8, contenu: "y", taille: 17, couleur: COULEURS_REPERE.axe, graisse: 700, italique: true });
  }
  return svg;
}

/**
 * Dessine un repère orthogonal scolaire à pas entier.
 *
 * @param {object} [options]
 * @param {number} [options.xMin=-4]
 * @param {number} [options.xMax=4]
 * @param {number} [options.yMin=-3]
 * @param {number} [options.yMax=3]
 * @param {number} [options.largeur=640]
 * @param {Array<{nom:string,x:number,y:number,role?:string}>} [options.points]
 * @param {Array<{x:number,y:number,axe:"abscisses"|"ordonnees"}>} [options.guides]
 * @param {{x:number,y:number,etape?:"horizontal"|"complet"}} [options.cheminPlacement]
 * @param {boolean} [options.afficherNomsAxes=true]
 * @param {string} [options.description]
 * @returns {{svg:string,largeur:number,hauteur:number,geometrie:object}}
 */
export function dessinerRepereCartesien(options = {}) {
  const quoi = "dessinerRepereCartesien";
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new TypeError(`${quoi} : objet d'options attendu.`);
  }
  const bornes = normaliserBornes(options, quoi);
  const largeur = normaliserLargeur(options.largeur, quoi);
  const geometrie = geometrieRepere(bornes, largeur);
  const points = normaliserPoints(options.points, bornes, quoi);
  const guides = normaliserGuides(options.guides, bornes, quoi);
  const chemin = normaliserChemin(options.cheminPlacement, bornes, quoi);
  const afficherNomsAxes = options.afficherNomsAxes ?? true;
  if (typeof afficherNomsAxes !== "boolean") {
    throw new TypeError(`${quoi}.afficherNomsAxes : booléen requis.`);
  }
  const description = options.description ?? "Repère orthogonal gradué de 1 en 1";
  if (typeof description !== "string" || description.trim() === "") {
    throw new TypeError(`${quoi}.description : texte non vide requis.`);
  }

  let corps = `<rect x="${geometrie.xGauche}" y="${geometrie.yHaut}" width="${arrondi2(geometrie.xDroite - geometrie.xGauche)}" height="${arrondi2(geometrie.yBas - geometrie.yHaut)}" rx="3" fill="${COULEURS_REPERE.papier}" stroke="${COULEURS_REPERE.grille}" stroke-width="1"/>`;
  corps += dessinerGrille(geometrie);
  corps += dessinerAxes(geometrie);
  corps += dessinerGraduations(geometrie, afficherNomsAxes);
  corps += dessinerGuides(guides, geometrie);
  corps += dessinerChemin(chemin, geometrie);
  corps += points.map((point) => dessinerCroix(point, geometrie)).join("");
  corps += choisirEtiquettes(points.filter((point) => point.afficherNom), geometrie).map(({ point, x, y, ancre }) =>
    texteSvg({
      x,
      y,
      contenu: point.nom,
      taille: TAILLE_POINT,
      graisse: 700,
      couleur: couleurPoint(point.role),
      ancre,
      italique: true,
      halo: true,
    })).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geometrie.largeur} ${geometrie.hauteur}" `
    + `width="${geometrie.largeur}" height="${geometrie.hauteur}" role="img" aria-label="${echapper(description)}">${corps}</svg>`;
  return Object.freeze({ svg, largeur: geometrie.largeur, hauteur: geometrie.hauteur, geometrie });
}
