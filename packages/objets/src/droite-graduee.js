// Objet officiel « droite graduée » — STATUT BROUILLON.
//
// LA droite graduée unique du site : droite simple (entiers, décimaux,
// relatifs) et DOUBLE droite de correspondance (proportionnalité,
// pourcentages). Elle reprend le travail pédagogique de la PR #8
// (studio/components/representation-pack-v1.js, sections number-line et
// double-number-line), réécrit pour la fondation V2 : modules ESM,
// couleurs de la charte, code et messages en français.
//
// CE QUI VIENT DE LA PR #8 (la valeur pédagogique, conservée telle quelle) :
// - bornes libres, y compris négatives, et pas décimal ;
// - PLUSIEURS points repérés à la fois, chacun avec sa valeur, son
//   étiquette, sa couleur et son côté (au-dessus ou en dessous) ;
// - le marquage d'un point : trait pointillé vertical + disque cerclé
//   de blanc, qui se lit de loin au tableau ;
// - étiquettes de graduation remplaçables une par une (« un demi » à la
//   place de 0,5) ;
// - masquage total des nombres, pour l'exercice « où se trouve ce
//   nombre ? » ;
// - liste de graduations imposée à la main ;
// - garde-fou anti-surcharge : au-delà de SEUIL_NOMBRES graduations, on
//   trace les traits mais on n'écrit plus les nombres ;
// - la double droite : deux échelles alignées, nombres à l'extérieur
//   (en haut pour la ligne du haut, en bas pour celle du bas), un nom de
//   ligne à gauche de chacune ;
// - la double droite des pourcentages : donner le total suffit, les
//   correspondances sont calculées ; trois échelles nommées (quarts,
//   cinquièmes, libre) et la possibilité de dépasser 100 %.
//
// CE QUI EST CORRIGÉ ICI (défauts relevés en exécutant le code d'origine) :
// a) NOMBRES EN FRANÇAIS — la virgule décimale, toujours : l'original
//    écrivait « 0.25 » sur les graduations pendant que l'étiquette du
//    point, saisie à la main, disait « 1,25 » ;
// b) SIGNE MOINS — le vrai « − » (U+2212), jamais le trait d'union,
//    y compris sur les graduations négatives ;
// c) le trait pointillé d'un point NE TRAVERSE PLUS le nombre de la
//    graduation qui est de son côté : quand il y a collision, le trait
//    s'interrompt le temps du nombre (voir `trouDuTrait`) ;
// d) la double droite des pourcentages marque le point sur les DEUX
//    lignes : l'original ne marquait que celle du haut, et l'élève ne
//    voyait donc pas la correspondance soulignée ;
// e) coordonnées ARRONDIES À 2 DÉCIMALES dans le SVG (l'original
//    sortait des « 488.99999999999994 ») ;
// f) largeur réglable et HAUTEUR AJUSTÉE au contenu réellement dessiné :
//    plus de bande blanche en bas quand il n'y a pas d'étiquette.
//
// Le rendu est une chaîne SVG pure et déterministe : mêmes réglages,
// même dessin, partout (diaporama, fiche, atelier, labo, exports).

import { COULEURS } from "../../charte/src/charte.js?v=31";
import {
  mesurerEcritureFractionSvg,
  rendreFractionSvg,
  verbaliserFraction,
} from "./expressions.js?v=31";

export const VERSION_DROITE_GRADUEE = 1;

/** Les deux côtés possibles pour un point repéré. */
export const POSITIONS_POINT = Object.freeze(["dessus", "dessous"]);

/** Les trois échelles nommées de la double droite des pourcentages. */
export const ECHELLES_POURCENTAGE = Object.freeze(["quarts", "cinquiemes", "libre"]);

/** Le pas imposé par chaque échelle nommée (« libre » choisit le sien). */
export const PAS_DES_ECHELLES = Object.freeze({ quarts: 25, cinquiemes: 20, libre: 10 });

/**
 * Garde-fou anti-surcharge : au-delà de ce nombre de graduations, les
 * nombres ne sont plus écrits (les traits, eux, restent).
 */
export const SEUIL_NOMBRES = 21;

/** Au-delà, on refuse de dessiner : le réglage est une erreur de saisie. */
export const MAX_GRADUATIONS = 400;

/** Le vrai signe moins typographique — jamais le trait d'union. */
export const SIGNE_MOINS = "−";

// Palette : prise dans la charte, aucune couleur inventée ici.
export const COULEURS_DROITE = Object.freeze({
  encre: COULEURS.encre,
  papier: COULEURS.papier,
  point: COULEURS.bleu, // le premier point repéré
  correspondance: COULEURS.reussite, // le point correspondant de la ligne du bas
});

const POLICE = "Arial, Helvetica, sans-serif";

// Géométrie, en pixels du dessin. Tout est relatif à l'axe de la ligne.
const TAILLE_TITRE = 15;
const TAILLE_NOM_LIGNE = 13;
const TAILLE_NOM_MIN = 9; // en dessous, un nom de ligne n'est plus lisible au tableau
const X_NOM = 12; // les noms de ligne sont calés à gauche, à cette abscisse
const TAILLE_NOMBRES = 13;
const TAILLE_ETIQUETTE_DEFAUT = 13;
const TAILLE_ETIQUETTE_MIN = 9;
const TAILLE_ETIQUETTE_MAX = 40;
const DEMI_GRADUATION = 8; // hauteur d'un trait de graduation, de part et d'autre
const DECALAGE_NOMBRES_DESSUS = 15; // ligne de base des nombres au-dessus de l'axe
const DECALAGE_NOMBRES_DESSOUS = 27; // ligne de base des nombres en dessous
const RAYON_POINT = 4.5;
const ECART_ENTRE_LIGNES = 10; // respiration entre les deux lignes d'une double droite
const MARGE_BASSE = 8;
const MARGE_HAUTE = 8;
const MARGE_TITRE = 30;
const MARGE_DROITE = 30; // place de la flèche
const MARGE_GAUCHE_SANS_NOM = 34;

const LARGEUR_MIN = 240;
const LARGEUR_MAX = 1600;
const LARGEUR_DEFAUT = 720;

// Où poser l'étiquette d'un point, selon son côté et selon que les
// nombres des graduations occupent déjà ce côté (« loin ») ou non
// (« proche »). C'est ce décalage qui évite la superposition.
const DECALAGE_ETIQUETTE = Object.freeze({
  dessus: Object.freeze({ proche: 26, loin: 46 }),
  dessous: Object.freeze({ proche: 30, loin: 54 }),
});

// Une fraction est un bloc à deux étages : sa barre ne peut pas être placée
// comme la ligne de base d'une simple étiquette. Cette marge sépare son bord
// réel des graduations ou, lorsqu'ils sont du même côté, des nombres déjà
// écrits sur la droite.
const ECART_FRACTION_ELEMENT = 6;

const EPSILON = 1e-9;

// ---------------------------------------------------------------------------
// Nombres et texte
// ---------------------------------------------------------------------------

function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );
}

/** Arrondi d'affichage des coordonnées SVG — correction (e). */
function arrondi2(n) {
  return Number.parseFloat(n.toFixed(2));
}

/** Arrondi de calcul : absorbe les 0,30000000000000004 du flottant. */
function arrondi6(n) {
  return Number.parseFloat(n.toFixed(6));
}

/**
 * Écriture française d'un nombre : virgule décimale et vrai signe moins
 * — corrections (a) et (b). Une chaîne est rendue telle quelle (elle
 * vient d'une étiquette choisie par l'enseignant).
 * @param {number|string} valeur
 * @returns {string}
 */
export function formaterNombre(valeur) {
  if (typeof valeur === "string") return valeur;
  const n = Number(valeur);
  if (!Number.isFinite(n)) {
    throw new RangeError(`formaterNombre : nombre attendu (reçu « ${valeur} »).`);
  }
  const arrondi = arrondi6(n);
  const chiffres = Math.abs(arrondi).toString().replace(".", ",");
  return (arrondi < 0 ? SIGNE_MOINS : "") + chiffres;
}

function nombreFini(valeur, quoi) {
  const n = Number(valeur);
  if (!Number.isFinite(n)) {
    throw new RangeError(`${quoi} : un nombre est attendu (reçu « ${valeur} »).`);
  }
  return n;
}

/**
 * Une couleur n'est acceptée qu'écrite en hexadécimal — même règle que
 * fractions.js. Cela suffit à la charte, et cela ferme la porte à toute
 * INJECTION dans les attributs du SVG : une chaîne libre pourrait y
 * glisser un `onload=`, car les couleurs, contrairement aux textes, ne
 * passent pas par `echapper`.
 */
function couleurValide(couleur) {
  return typeof couleur === "string" && /^#[0-9a-fA-F]{3,8}$/.test(couleur);
}

function lireCouleur(couleur, defaut, quoi) {
  if (couleur == null) return defaut;
  if (!couleurValide(couleur)) {
    throw new RangeError(
      `${quoi} : la couleur doit être hexadécimale, par exemple #2f6fb2 (reçu « ${couleur} »).`,
    );
  }
  return couleur;
}

// ---------------------------------------------------------------------------
// Primitives SVG (toutes les coordonnées passent par arrondi2)
// ---------------------------------------------------------------------------

function texte(x, y, contenu, taille, graisse, couleur, ancre = "middle") {
  return (
    `<text x="${arrondi2(x)}" y="${arrondi2(y)}" text-anchor="${ancre}" ` +
    `font-family="${POLICE}" font-size="${taille}" font-weight="${graisse}" ` +
    `fill="${couleur}">${echapper(contenu)}</text>`
  );
}

function trait(x1, y1, x2, y2, couleur, epaisseur, pointille = null) {
  const motif = pointille ? ` stroke-dasharray="${pointille}"` : "";
  return (
    `<line x1="${arrondi2(x1)}" y1="${arrondi2(y1)}" x2="${arrondi2(x2)}" y2="${arrondi2(y2)}" ` +
    `stroke="${couleur}" stroke-width="${epaisseur}"${motif}/>`
  );
}

function disque(cx, cy, rayon, remplissage, contour) {
  return (
    `<circle cx="${arrondi2(cx)}" cy="${arrondi2(cy)}" r="${rayon}" ` +
    `fill="${remplissage}" stroke="${contour}" stroke-width="1.2"/>`
  );
}

/** La pointe de flèche du bout de la droite (elle dit « ça continue »). */
function pointeFleche(x, y, couleur) {
  const p = (a, b) => `${arrondi2(a)},${arrondi2(b)}`;
  return `<polygon points="${p(x, y)} ${p(x - 10, y - 5)} ${p(x - 10, y + 5)}" fill="${couleur}"/>`;
}

// La balise racine suit la convention des autres objets (barres, jetons,
// plateaux, triangle) : largeur ET hauteur en pixels, en plus du viewBox.
// Sans hauteur, le dessin ne s'affiche pas quand on ouvre le fichier seul,
// hors d'une page web — c'est le cas d'un export ou d'un envoi de fichier.
function svgRacine(largeur, hauteur, corps, description) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${arrondi2(largeur)} ${arrondi2(hauteur)}" ` +
    `width="${arrondi2(largeur)}" height="${arrondi2(hauteur)}" ` +
    `role="img" aria-label="${echapper(description)}">${corps}</svg>`
  );
}

// ---------------------------------------------------------------------------
// Graduations
// ---------------------------------------------------------------------------

/** Clé de recherche d'une étiquette personnalisée (nombre normalisé). */
function cleGraduation(valeur) {
  return String(arrondi6(Number(valeur)));
}

/**
 * Les graduations d'un pas régulier, de min à max.
 * @param {number} min @param {number} max @param {number} pas
 * @param {string} quoi — le nom de la fonction appelante, pour l'erreur.
 * @returns {number[]}
 */
export function construireGraduations(min, max, pas, quoi = "construireGraduations") {
  if (!(max > min)) {
    throw new RangeError(
      `${quoi} : max (${formaterNombre(max)}) doit être strictement supérieur à min (${formaterNombre(min)}).`,
    );
  }
  if (!(pas > 0) || !Number.isFinite(pas)) {
    throw new RangeError(
      `${quoi} : le pas doit être strictement positif (reçu ${formaterNombre(pas)}).`,
    );
  }
  const nombreDePas = Math.floor((max - min) / pas + 1e-6);
  if (nombreDePas > MAX_GRADUATIONS) {
    throw new RangeError(
      `${quoi} : ${nombreDePas + 1} graduations demandées, c'est trop (maximum ${MAX_GRADUATIONS + 1}) — augmenter le pas.`,
    );
  }
  const liste = [];
  for (let i = 0; i <= nombreDePas; i += 1) liste.push(arrondi6(min + i * pas));
  const derniere = liste[liste.length - 1];
  if (derniere < max - EPSILON) liste.push(arrondi6(max));
  return liste;
}

function normaliserEtiquettes(etiquettes, quoi) {
  const table = new Map();
  if (etiquettes == null) return table;
  if (typeof etiquettes !== "object") {
    throw new TypeError(`${quoi} : etiquettes doit être un objet { valeur: texte }.`);
  }
  for (const [cle, contenu] of Object.entries(etiquettes)) {
    // On accepte la clé écrite à la française (« 0,5 », « −2 ») comme à
    // l'anglaise (« 0.5 », « -2 ») : l'enseignant ne doit pas y penser.
    const n = Number(String(cle).replace(",", ".").replaceAll(SIGNE_MOINS, "-"));
    if (!Number.isFinite(n)) {
      throw new RangeError(`${quoi} : l'étiquette « ${cle} » ne désigne pas une graduation numérique.`);
    }
    table.set(cleGraduation(n), String(contenu));
  }
  return table;
}

function estEtiquetteFraction(etiquette) {
  return etiquette?.type === "fraction";
}

function normaliserEtiquettePoint(etiquette, quoi) {
  if (etiquette == null) return null;
  if (typeof etiquette !== "object" || Array.isArray(etiquette)) {
    return String(etiquette);
  }
  if (!estEtiquetteFraction(etiquette)) {
    throw new RangeError(`${quoi} : le type de l'étiquette structurée doit être « fraction ».`);
  }
  const clesInconnues = Object.keys(etiquette)
    .filter((cle) => !["type", "numerateur", "denominateur"].includes(cle));
  if (clesInconnues.length > 0) {
    throw new TypeError(`${quoi} : propriété inconnue « ${clesInconnues[0]} » dans la fraction.`);
  }
  if (!Number.isSafeInteger(etiquette.numerateur)) {
    throw new RangeError(`${quoi} : le numérateur de la fraction doit être un entier.`);
  }
  if (!Number.isSafeInteger(etiquette.denominateur) || etiquette.denominateur <= 0) {
    throw new RangeError(`${quoi} : le dénominateur de la fraction doit être un entier strictement positif.`);
  }
  return Object.freeze({
    type: "fraction",
    numerateur: etiquette.numerateur,
    denominateur: etiquette.denominateur,
  });
}

function normaliserPoints(points, min, max, quoi) {
  if (points == null) return [];
  if (!Array.isArray(points)) {
    throw new TypeError(`${quoi} : points doit être une liste.`);
  }
  return points.map((brut, i) => {
    if (!brut || typeof brut !== "object") {
      throw new TypeError(`${quoi} : le point n° ${i + 1} doit être un objet { valeur, etiquette }.`);
    }
    const valeur = nombreFini(brut.valeur, `${quoi} : valeur du point n° ${i + 1}`);
    if (valeur < min - EPSILON || valeur > max + EPSILON) {
      throw new RangeError(
        `${quoi} : le point ${formaterNombre(valeur)} sort de la droite ` +
          `[${formaterNombre(min)} ; ${formaterNombre(max)}].`,
      );
    }
    const position = brut.position ?? "dessus";
    if (!POSITIONS_POINT.includes(position)) {
      throw new RangeError(
        `${quoi} : position de point invalide « ${position} » — attendu « dessus » ou « dessous ».`,
      );
    }
    return {
      valeur,
      etiquette: normaliserEtiquettePoint(
        brut.etiquette,
        `${quoi} : étiquette du point n° ${i + 1}`,
      ),
      couleur: lireCouleur(brut.couleur, COULEURS_DROITE.point, `${quoi} : couleur du point n° ${i + 1}`),
      position,
    };
  });
}

/**
 * Lecture et contrôle des réglages d'UNE ligne graduée.
 * @param {object} options
 * @param {"dessus"|"dessous"} coteNombres — de quel côté les nombres sont écrits.
 * @param {string} quoi — nom de la fonction appelante (messages d'erreur).
 */
function normaliserLigne(options, coteNombres, quoi) {
  const o = options ?? {};
  const min = nombreFini(o.min ?? 0, `${quoi} : min`);
  const max = nombreFini(o.max ?? 10, `${quoi} : max`);
  if (!(max > min)) {
    throw new RangeError(
      `${quoi} : max (${formaterNombre(max)}) doit être strictement supérieur à min (${formaterNombre(min)}).`,
    );
  }
  const pas = nombreFini(o.pas ?? 1, `${quoi} : pas`);

  let graduations;
  if (o.graduations != null) {
    if (!Array.isArray(o.graduations) || o.graduations.length < 2) {
      throw new RangeError(`${quoi} : graduations doit être une liste d'au moins deux nombres.`);
    }
    const triees = o.graduations
      .map((v, i) => {
        const n = nombreFini(v, `${quoi} : graduation n° ${i + 1}`);
        if (n < min - EPSILON || n > max + EPSILON) {
          throw new RangeError(
            `${quoi} : la graduation ${formaterNombre(n)} sort de la droite ` +
              `[${formaterNombre(min)} ; ${formaterNombre(max)}].`,
          );
        }
        return arrondi6(n);
      })
      .sort((a, b) => a - b);
    // Deux graduations à la même valeur s'imprimeraient l'une SUR l'autre
    // (trait doublé, nombre en gras sale) : on n'en garde qu'un exemplaire.
    graduations = triees.filter((v, i) => i === 0 || v !== triees[i - 1]);
    if (graduations.length < 2) {
      throw new RangeError(`${quoi} : graduations doit contenir au moins deux valeurs distinctes.`);
    }
    // Même garde-fou que le pas régulier : une liste à la main n'a aucune
    // raison d'échapper au plafond (5 000 graduations = un SVG illisible).
    if (graduations.length > MAX_GRADUATIONS + 1) {
      throw new RangeError(
        `${quoi} : ${graduations.length} graduations demandées, c'est trop ` +
          `(maximum ${MAX_GRADUATIONS + 1}).`,
      );
    }
  } else {
    graduations = construireGraduations(min, max, pas, quoi);
  }

  const seuil = o.seuilNombres == null ? SEUIL_NOMBRES : nombreFini(o.seuilNombres, `${quoi} : seuilNombres`);
  const tailleEtiquetteDemandee = o.tailleEtiquette == null
    ? TAILLE_ETIQUETTE_DEFAUT
    : nombreFini(o.tailleEtiquette, `${quoi} : tailleEtiquette`);
  const tailleEtiquette = Math.round(tailleEtiquetteDemandee);
  if (tailleEtiquette < TAILLE_ETIQUETTE_MIN || tailleEtiquette > TAILLE_ETIQUETTE_MAX) {
    throw new RangeError(
      `${quoi} : tailleEtiquette doit être comprise entre ${TAILLE_ETIQUETTE_MIN} et ${TAILLE_ETIQUETTE_MAX}.`,
    );
  }
  // Masquage total demandé, ou garde-fou anti-surcharge.
  const nombresVisibles = o.afficherNombres === false ? false : graduations.length <= seuil;

  return {
    min,
    max,
    graduations,
    etiquettes: normaliserEtiquettes(o.etiquettes, quoi),
    nombresVisibles,
    coteNombres,
    points: normaliserPoints(o.points, min, max, quoi),
    nom: o.nom == null ? null : String(o.nom),
    tailleEtiquette,
  };
}

// ---------------------------------------------------------------------------
// Encombrement vertical : la hauteur suit le contenu — correction (f)
// ---------------------------------------------------------------------------

function decalageEtiquette(position, ligne) {
  const memeCote = ligne.nombresVisibles && position === ligne.coteNombres;
  return DECALAGE_ETIQUETTE[position][memeCote ? "loin" : "proche"];
}

/** La bande de papier occupée par les nombres, autour de l'axe (y relatif). */
function bandeDesNombres(coteNombres) {
  return coteNombres === "dessus"
    ? { haut: -DECALAGE_NOMBRES_DESSUS - 11, bas: -DECALAGE_NOMBRES_DESSUS + 5 }
    : { haut: DECALAGE_NOMBRES_DESSOUS - 11, bas: DECALAGE_NOMBRES_DESSOUS + 5 };
}

/**
 * Géométrie d'une fraction par rapport à l'axe (axe = 0).
 *
 * Le bord le plus proche reste au-delà des traits de graduation. Si les
 * nombres occupent déjà ce côté, la fraction passe entièrement après leur
 * bande. La taille du numérateur ou du dénominateur ne peut donc plus la
 * ramener sur l'axe.
 */
function geometrieFraction(point, ligne) {
  const mesure = mesurerEcritureFractionSvg(
    point.etiquette.numerateur,
    point.etiquette.denominateur,
    { taille: ligne.tailleEtiquette },
  );
  const memeCote = ligne.nombresVisibles && point.position === ligne.coteNombres;
  const bande = memeCote ? bandeDesNombres(ligne.coteNombres) : null;

  if (point.position === "dessus") {
    const bordBas = bande
      ? bande.haut - ECART_FRACTION_ELEMENT
      : -DEMI_GRADUATION - ECART_FRACTION_ELEMENT;
    const yBarre = bordBas - mesure.debordBas;
    return {
      mesure,
      yBarre,
      bordHaut: yBarre - mesure.debordHaut,
      bordBas,
    };
  }

  const bordHaut = bande
    ? bande.bas + ECART_FRACTION_ELEMENT
    : DEMI_GRADUATION + ECART_FRACTION_ELEMENT;
  const yBarre = bordHaut + mesure.debordHaut;
  return {
    mesure,
    yBarre,
    bordHaut,
    bordBas: yBarre + mesure.debordBas,
  };
}

/** Combien de place la ligne prend au-dessus et en dessous de son axe. */
function mesurerLigne(ligne) {
  let haut = DEMI_GRADUATION + 4;
  let bas = DEMI_GRADUATION + 4;
  if (ligne.nombresVisibles) {
    const bande = bandeDesNombres(ligne.coteNombres);
    if (ligne.coteNombres === "dessus") haut = Math.max(haut, -bande.haut + 4);
    else bas = Math.max(bas, bande.bas + 4);
  }
  for (const point of ligne.points) {
    if (point.etiquette == null) continue;
    const d = decalageEtiquette(point.position, ligne);
    if (estEtiquetteFraction(point.etiquette)) {
      const geometrie = geometrieFraction(point, ligne);
      if (point.position === "dessus") {
        haut = Math.max(haut, -geometrie.bordHaut + 4);
      } else {
        bas = Math.max(bas, geometrie.bordBas + 4);
      }
    } else if (point.position === "dessus") haut = Math.max(haut, d + 14);
    else bas = Math.max(bas, d + 8);
  }
  return { haut, bas };
}

/** Largeur approchée d'un texte Arial, suffisante pour réserver la place. */
function largeurTexte(contenu, taille, gras = false) {
  return String(contenu).length * taille * (gras ? 0.58 : 0.53);
}

function margeGauche(noms) {
  const utiles = noms.filter((n) => n != null && String(n).length > 0);
  if (!utiles.length) return MARGE_GAUCHE_SANS_NOM;
  const large = utiles.reduce((m, n) => Math.max(m, largeurTexte(n, TAILLE_NOM_LIGNE, true)), 0);
  return Math.round(X_NOM + large + 12);
}

/**
 * La marge gauche est plafonnée à la moitié du dessin, sinon il ne
 * resterait plus de droite à graduer. Sur un dessin étroit, un nom long
 * déborderait donc SUR l'axe : on rétrécit sa police pour qu'il tienne,
 * jusqu'à un plancher lisible.
 */
function tailleDuNom(nom, largeurDisponible) {
  const naturelle = largeurTexte(nom, TAILLE_NOM_LIGNE, true);
  if (naturelle <= largeurDisponible) return TAILLE_NOM_LIGNE;
  const reduite = Math.floor((TAILLE_NOM_LIGNE * largeurDisponible) / naturelle);
  return Math.max(TAILLE_NOM_MIN, reduite);
}

/** Le nom d'une ligne, écrit à sa gauche, à hauteur de son axe. */
function dessinerNomDeLigne(nom, yAxe, xGauche) {
  // La place va de X_NOM jusqu'au départ du trait, qui déborde de 10 px à
  // gauche de xGauche. Tant que margeGauche n'est pas plafonnée, le nom y
  // tient sans rien changer : seul un dessin étroit déclenche la réduction.
  const disponible = xGauche - 10 - X_NOM;
  const taille = tailleDuNom(nom, disponible);
  return texte(X_NOM, yAxe + 4, nom, taille, 700, COULEURS_DROITE.encre, "start");
}

// ---------------------------------------------------------------------------
// Dessin d'une ligne
// ---------------------------------------------------------------------------

/**
 * Le trait pointillé d'un point, éventuellement INTERROMPU pour ne pas
 * traverser le nombre d'une graduation — correction (c).
 */
function traitPointille(x, yHaut, yBas, couleur, trou) {
  if (!trou || trou.bas <= yHaut || trou.haut >= yBas) {
    return trait(x, yHaut, x, yBas, couleur, 2, "4 3");
  }
  let morceaux = "";
  if (trou.haut - yHaut > 4) morceaux += trait(x, yHaut, x, trou.haut, couleur, 2, "4 3");
  if (yBas - trou.bas > 4) morceaux += trait(x, trou.bas, x, yBas, couleur, 2, "4 3");
  return morceaux;
}

/**
 * Le nombre d'une graduation est-il sur le chemin du trait pointillé ?
 * On ne coupe le trait que s'il y a vraiment collision horizontale : un
 * point tombé entre deux graduations garde son trait entier.
 */
function trouDuTrait(xPoint, nombresPoses, ligne, position) {
  if (!ligne.nombresVisibles || position !== ligne.coteNombres) return null;
  const heurte = nombresPoses.some((n) => Math.abs(n.x - xPoint) < n.demiLargeur + 4);
  if (!heurte) return null;
  const bande = bandeDesNombres(ligne.coteNombres);
  return { haut: bande.haut - 3, bas: bande.bas + 3 };
}

function dessinerLigne(ligne, yAxe, xGauche, xDroite) {
  const { min, max, graduations, etiquettes, nombresVisibles, coteNombres, points } = ligne;
  const abscisse = (v) => xGauche + ((v - min) / (max - min)) * (xDroite - xGauche);
  let corps = "";

  corps += trait(xGauche - 10, yAxe, xDroite + 6, yAxe, COULEURS_DROITE.encre, 1.8);
  corps += pointeFleche(xDroite + 16, yAxe, COULEURS_DROITE.encre);

  const nombresPoses = [];
  for (const valeur of graduations) {
    const gx = abscisse(valeur);
    corps += trait(gx, yAxe - DEMI_GRADUATION, gx, yAxe + DEMI_GRADUATION, COULEURS_DROITE.encre, 1.35);
    if (!nombresVisibles) continue;
    const perso = etiquettes.get(cleGraduation(valeur));
    const contenu = perso == null ? formaterNombre(valeur) : perso;
    if (contenu === "") continue;
    const y = coteNombres === "dessus" ? yAxe - DECALAGE_NOMBRES_DESSUS : yAxe + DECALAGE_NOMBRES_DESSOUS;
    corps += texte(gx, y, contenu, TAILLE_NOMBRES, 400, COULEURS_DROITE.encre);
    nombresPoses.push({ x: gx, demiLargeur: largeurTexte(contenu, TAILLE_NOMBRES) / 2 });
  }

  for (const point of points) {
    const px = abscisse(point.valeur);
    if (point.etiquette == null) {
      // Sans étiquette : un simple repère, qui ne peut rien traverser.
      corps += traitPointille(px, yAxe - 9, yAxe + 9, point.couleur, null);
    } else {
      const d = decalageEtiquette(point.position, ligne);
      const fraction = estEtiquetteFraction(point.etiquette);
      const geometrie = fraction ? geometrieFraction(point, ligne) : null;
      const yBarreFraction = fraction ? yAxe + geometrie.yBarre : null;
      const yHaut = point.position === "dessus"
        ? fraction
          ? yAxe + geometrie.bordBas + 2
          : yAxe - d + 6
        : yAxe - 9;
      const yBas = point.position === "dessus"
        ? yAxe + 9
        : fraction
          ? yAxe + geometrie.bordHaut - 2
          : yAxe + d - 11;
      const trouRelatif = trouDuTrait(px, nombresPoses, ligne, point.position);
      const trou = trouRelatif ? { haut: yAxe + trouRelatif.haut, bas: yAxe + trouRelatif.bas } : null;
      corps += traitPointille(px, yHaut, yBas, point.couleur, trou);
      if (fraction) {
        corps += rendreFractionSvg(
          point.etiquette.numerateur,
          point.etiquette.denominateur,
          {
            centreX: px,
            yBarre: yBarreFraction,
            taille: ligne.tailleEtiquette,
            couleur: point.couleur,
            libelleAccessible: verbaliserFraction(
              point.etiquette.numerateur,
              point.etiquette.denominateur,
            ),
          },
        );
      } else {
        const yEtiquette = point.position === "dessus" ? yAxe - d : yAxe + d;
        corps += texte(px, yEtiquette, point.etiquette, ligne.tailleEtiquette, 700, point.couleur);
      }
    }
    // Le disque cerclé de blanc, posé en dernier : il reste lisible
    // même quand le trait pointillé passe dessous.
    corps += disque(px, yAxe, RAYON_POINT, point.couleur, COULEURS_DROITE.papier);
  }
  return corps;
}

function lireLargeur(valeur, quoi) {
  if (valeur == null) return LARGEUR_DEFAUT;
  const n = nombreFini(valeur, `${quoi} : largeur`);
  return Math.max(LARGEUR_MIN, Math.min(LARGEUR_MAX, Math.round(n)));
}

// ---------------------------------------------------------------------------
// Droite graduée simple
// ---------------------------------------------------------------------------

/**
 * Dessine une droite graduée.
 *
 * @param {object} [options]
 * @param {number} [options.min=0] — borne gauche (peut être négative).
 * @param {number} [options.max=10] — borne droite, strictement supérieure à min.
 * @param {number} [options.pas=1] — pas des graduations (décimal accepté).
 * @param {number[]} [options.graduations] — liste imposée à la main ; le
 *   pas est alors ignoré.
 * @param {Object<string,string>} [options.etiquettes] — étiquettes de
 *   graduation remplacées une par une : { "0,5": "un demi" }. Une
 *   étiquette vide efface le nombre de cette graduation.
 * @param {boolean} [options.afficherNombres=true] — `false` masque TOUS
 *   les nombres (exercice « où se trouve ce nombre ? »).
 * @param {number} [options.seuilNombres=21] — au-delà de ce nombre de
 *   graduations, les nombres ne sont plus écrits.
 * @param {number} [options.tailleEtiquette=13] — taille des étiquettes de
 *   points, de 9 à 40 pixels dans le dessin SVG.
 * @param {Array<{valeur:number, etiquette?:string|{type:"fraction",
 *   numerateur:number,denominateur:number}, couleur?:string,
 *   position?:"dessus"|"dessous"}>} [options.points] — les points repérés.
 *   La couleur s'écrit en hexadécimal (#2f6fb2).
 * @param {"dessus"|"dessous"} [options.coteNombres="dessus"] — de quel
 *   côté de l'axe les nombres des graduations sont écrits.
 * @param {string} [options.nom] — nom de la ligne, écrit à sa gauche.
 * @param {string} [options.titre] — titre centré au-dessus du dessin.
 * @param {number} [options.largeur=720] — largeur du dessin (240 à 1600).
 * @param {string} [options.description] — texte lu par les lecteurs
 *   d'écran (aria-label du SVG).
 * @returns {{svg: string, largeur: number, hauteur: number}}
 */
export function dessinerDroiteGraduee(options = {}) {
  const quoi = "dessinerDroiteGraduee";
  const o = options ?? {};
  const largeur = lireLargeur(o.largeur, quoi);
  // Une faute de frappe sur coteNombres doit se voir, pas se taire.
  const coteNombres = o.coteNombres ?? "dessus";
  if (!POSITIONS_POINT.includes(coteNombres)) {
    throw new RangeError(
      `${quoi} : coteNombres invalide « ${coteNombres} » — attendu « dessus » ou « dessous ».`,
    );
  }
  const ligne = normaliserLigne(o, coteNombres, quoi);
  const titre = o.titre == null ? null : String(o.titre);

  const xGauche = Math.min(margeGauche([ligne.nom]), Math.round(largeur / 2));
  const xDroite = largeur - MARGE_DROITE;
  const { haut, bas } = mesurerLigne(ligne);
  const hautDuDessin = titre ? MARGE_TITRE : MARGE_HAUTE;
  const yAxe = hautDuDessin + haut;
  const hauteur = yAxe + bas + MARGE_BASSE;

  let corps = "";
  if (titre) corps += texte(largeur / 2, 22, titre, TAILLE_TITRE, 700, COULEURS_DROITE.encre);
  if (ligne.nom) corps += dessinerNomDeLigne(ligne.nom, yAxe, xGauche);
  corps += dessinerLigne(ligne, yAxe, xGauche, xDroite);

  return {
    svg: svgRacine(largeur, hauteur, corps, o.description ?? "Droite graduée"),
    largeur,
    hauteur,
  };
}

// ---------------------------------------------------------------------------
// Double droite graduée
// ---------------------------------------------------------------------------

/**
 * Dessine une double droite graduée : deux échelles alignées, qui
 * mettent en regard deux grandeurs (proportionnalité, correspondances).
 *
 * Les nombres de la ligne du HAUT sont écrits au-dessus d'elle, ceux de
 * la ligne du BAS en dessous : l'espace entre les deux droites reste
 * libre, et la lecture verticale saute aux yeux.
 *
 * @param {object} [options]
 * @param {object} [options.haut] — réglages de la ligne du haut (mêmes
 *   champs que `dessinerDroiteGraduee`, plus `nom`).
 * @param {object} [options.bas] — réglages de la ligne du bas.
 * @param {string} [options.titre] @param {number} [options.largeur=720]
 * @returns {{svg: string, largeur: number, hauteur: number}}
 */
export function dessinerDoubleDroiteGraduee(options = {}) {
  const quoi = "dessinerDoubleDroiteGraduee";
  const o = options ?? {};
  const largeur = lireLargeur(o.largeur, quoi);
  const ligneHaut = normaliserLigne(o.haut, "dessus", `${quoi} (ligne du haut)`);
  const ligneBas = normaliserLigne(o.bas, "dessous", `${quoi} (ligne du bas)`);
  const titre = o.titre == null ? null : String(o.titre);

  const xGauche = Math.min(margeGauche([ligneHaut.nom, ligneBas.nom]), Math.round(largeur / 2));
  const xDroite = largeur - MARGE_DROITE;
  const mesureHaut = mesurerLigne(ligneHaut);
  const mesureBas = mesurerLigne(ligneBas);
  const hautDuDessin = titre ? MARGE_TITRE : MARGE_HAUTE;
  const yHaut = hautDuDessin + mesureHaut.haut;
  const yBas = yHaut + mesureHaut.bas + ECART_ENTRE_LIGNES + mesureBas.haut;
  const hauteur = yBas + mesureBas.bas + MARGE_BASSE;

  let corps = "";
  if (titre) corps += texte(largeur / 2, 22, titre, TAILLE_TITRE, 700, COULEURS_DROITE.encre);
  if (ligneHaut.nom) corps += dessinerNomDeLigne(ligneHaut.nom, yHaut, xGauche);
  if (ligneBas.nom) corps += dessinerNomDeLigne(ligneBas.nom, yBas, xGauche);
  corps += dessinerLigne(ligneHaut, yHaut, xGauche, xDroite);
  corps += dessinerLigne(ligneBas, yBas, xGauche, xDroite);

  return {
    svg: svgRacine(largeur, hauteur, corps, o.description ?? "Double droite graduée de correspondance"),
    largeur,
    hauteur,
  };
}

// ---------------------------------------------------------------------------
// Double droite des pourcentages
// ---------------------------------------------------------------------------

/**
 * Dessine la double droite des pourcentages : les pourcentages en haut,
 * la grandeur en bas. DONNER LE TOTAL SUFFIT — les correspondances sont
 * calculées (240 en tout ⇒ 25 % en face de 60).
 *
 * Le point demandé est marqué sur les DEUX lignes (correction (d) du
 * code d'origine, qui ne marquait que celle du haut).
 *
 * @param {object} [options]
 * @param {number} [options.total] — la valeur qui vaut 100 % ; omise, la
 *   ligne du bas reste en pourcentages.
 * @param {"quarts"|"cinquiemes"|"libre"} [options.echelle="quarts"] —
 *   « quarts » = pas de 25 %, « cinquiemes » = 20 %, « libre » = le pas
 *   donné (10 % par défaut).
 * @param {number} [options.pas] — le pas, réservé à l'échelle « libre ».
 * @param {number} [options.maxPourcentage=100] — peut dépasser 100 %.
 * @param {number} [options.pourcentage] — le point à repérer.
 * @param {string} [options.couleurPoint] — couleur hexadécimale du point
 *   de la ligne du haut. @param {string} [options.couleurCorrespondance] —
 *   celle du point correspondant de la ligne du bas.
 * @param {string} [options.nomHaut="Pourcentage"] @param {string} [options.nomBas="Valeur"]
 * @param {string} [options.titre] @param {number} [options.largeur=720]
 * @returns {{svg: string, largeur: number, hauteur: number, valeur: number|null}}
 */
export function dessinerDoubleDroitePourcentage(options = {}) {
  const quoi = "dessinerDoubleDroitePourcentage";
  const o = options ?? {};

  const echelle = o.echelle ?? "quarts";
  if (!ECHELLES_POURCENTAGE.includes(echelle)) {
    throw new RangeError(
      `${quoi} : échelle inconnue « ${echelle} » — attendu ${ECHELLES_POURCENTAGE.join(", ")}.`,
    );
  }
  const pasImpose = PAS_DES_ECHELLES[echelle];
  if (o.pas != null && echelle !== "libre" && nombreFini(o.pas, `${quoi} : pas`) !== pasImpose) {
    throw new RangeError(
      `${quoi} : l'échelle « ${echelle} » impose un pas de ${formaterNombre(pasImpose)} % — ` +
        `choisir l'échelle « libre » pour un autre pas.`,
    );
  }
  const pas = o.pas == null ? pasImpose : nombreFini(o.pas, `${quoi} : pas`);
  if (!(pas > 0)) {
    throw new RangeError(`${quoi} : le pas doit être strictement positif (reçu ${formaterNombre(pas)}).`);
  }

  const maxPourcentage = o.maxPourcentage == null ? 100 : nombreFini(o.maxPourcentage, `${quoi} : maxPourcentage`);
  if (!(maxPourcentage > 0)) {
    throw new RangeError(
      `${quoi} : maxPourcentage doit être strictement positif (reçu ${formaterNombre(maxPourcentage)}).`,
    );
  }
  const total = o.total == null ? null : nombreFini(o.total, `${quoi} : total`);
  if (total != null && !(total > 0)) {
    throw new RangeError(`${quoi} : le total doit être strictement positif (reçu ${formaterNombre(total)}).`);
  }

  const graduationsPourcent = construireGraduations(0, maxPourcentage, pas, quoi);
  const versValeur = (p) => (total == null ? p : arrondi6((total * p) / 100));

  const etiquettesHaut = {};
  for (const p of graduationsPourcent) etiquettesHaut[String(p)] = `${formaterNombre(p)} %`;

  const pointsHaut = [];
  const pointsBas = [];
  let valeur = null;
  if (o.pourcentage != null) {
    const p = nombreFini(o.pourcentage, `${quoi} : pourcentage`);
    if (p < 0 || p > maxPourcentage) {
      throw new RangeError(
        `${quoi} : le pourcentage ${formaterNombre(p)} % sort de la droite ` +
          `[0 % ; ${formaterNombre(maxPourcentage)} %].`,
      );
    }
    valeur = versValeur(p);
    pointsHaut.push({
      valeur: p,
      etiquette: `${formaterNombre(p)} %`,
      couleur: lireCouleur(o.couleurPoint, COULEURS_DROITE.point, `${quoi} : couleurPoint`),
      position: "dessus",
    });
    // Correction (d) : la correspondance est marquée sur la ligne du bas.
    pointsBas.push({
      valeur,
      etiquette: formaterNombre(valeur),
      couleur: lireCouleur(
        o.couleurCorrespondance,
        COULEURS_DROITE.correspondance,
        `${quoi} : couleurCorrespondance`,
      ),
      position: "dessous",
    });
  }

  const dessin = dessinerDoubleDroiteGraduee({
    largeur: o.largeur,
    titre: o.titre,
    description: o.description ?? "Double droite graduée de pourcentage",
    haut: {
      min: 0,
      max: maxPourcentage,
      pas,
      graduations: graduationsPourcent,
      etiquettes: etiquettesHaut,
      points: pointsHaut,
      nom: o.nomHaut ?? "Pourcentage",
      seuilNombres: o.seuilNombres,
      afficherNombres: o.afficherNombres,
    },
    bas: {
      min: 0,
      max: versValeur(maxPourcentage),
      pas: total == null ? pas : arrondi6((total * pas) / 100),
      graduations: graduationsPourcent.map(versValeur),
      points: pointsBas,
      nom: o.nomBas ?? "Valeur",
      seuilNombres: o.seuilNombres,
      afficherNombres: o.afficherNombres,
    },
  });

  return { ...dessin, valeur };
}

// ---------------------------------------------------------------------------
// Préréglages : un exemple par usage, pour le catalogue et l'atelier.
// ---------------------------------------------------------------------------

export const PREREGLAGES_DROITE_GRADUEE = Object.freeze(
  [
    {
      id: "entiers",
      titre: "Entiers de 0 à 10 — placer 7",
      genre: "simple",
      options: { min: 0, max: 10, pas: 1, points: [{ valeur: 7, etiquette: "7" }] },
    },
    {
      id: "relatifs",
      titre: "Relatifs de −5 à 5 — deux points, un de chaque côté",
      genre: "simple",
      options: {
        min: -5,
        max: 5,
        pas: 1,
        points: [
          { valeur: -2, etiquette: "−2" },
          { valeur: 3, etiquette: "+3", position: "dessous", couleur: COULEURS_DROITE.correspondance },
        ],
      },
    },
    {
      id: "decimaux",
      titre: "Pas de 0,25 et étiquettes choisies",
      genre: "simple",
      options: {
        min: 0,
        max: 2,
        pas: 0.25,
        etiquettes: { "0,5": "un demi", "1,5": "trois demis" },
        points: [{ valeur: 1.25, etiquette: "1,25" }],
      },
    },
    {
      id: "muette",
      titre: "Droite muette — où se trouve ce nombre ?",
      genre: "simple",
      options: { min: 0, max: 1, pas: 0.1, afficherNombres: false, etiquettes: {} },
    },
    {
      id: "correspondance",
      titre: "Litres et prix — double droite de proportionnalité",
      genre: "double",
      options: {
        haut: { min: 0, max: 5, pas: 1, nom: "Litres", points: [{ valeur: 3, etiquette: "3 L" }] },
        bas: { min: 0, max: 8.5, pas: 1.7, nom: "Prix (€)" },
      },
    },
    {
      id: "fractions-decimaux-reperes",
      titre: "Repères : fractions et décimaux",
      genre: "double",
      options: {
        description: "Double droite graduée : un quart, un demi et trois quarts sont alignés avec 0,25, 0,5 et 0,75.",
        haut: {
          min: 0,
          max: 1,
          graduations: [0, 0.25, 0.5, 0.75, 1],
          etiquettes: { "0.25": "", "0.5": "", "0.75": "" },
          nom: "Fractions",
          tailleEtiquette: 18,
          points: [
            { valeur: 0.25, etiquette: { type: "fraction", numerateur: 1, denominateur: 4 }, couleur: COULEURS.orange, position: "dessus" },
            { valeur: 0.5, etiquette: { type: "fraction", numerateur: 1, denominateur: 2 }, couleur: COULEURS.bleu, position: "dessus" },
            { valeur: 0.75, etiquette: { type: "fraction", numerateur: 3, denominateur: 4 }, couleur: COULEURS.turquoise, position: "dessus" },
          ],
        },
        bas: {
          min: 0,
          max: 1,
          graduations: [0, 0.25, 0.5, 0.75, 1],
          etiquettes: { "0.25": "", "0.5": "", "0.75": "" },
          nom: "Décimaux",
          tailleEtiquette: 18,
          points: [
            { valeur: 0.25, etiquette: "0,25", couleur: COULEURS.orange, position: "dessous" },
            { valeur: 0.5, etiquette: "0,5", couleur: COULEURS.bleu, position: "dessous" },
            { valeur: 0.75, etiquette: "0,75", couleur: COULEURS.turquoise, position: "dessous" },
          ],
        },
      },
    },
    {
      id: "pourcentage-quarts",
      titre: "75 % de 240 élèves — échelle des quarts",
      genre: "pourcentage",
      options: { total: 240, echelle: "quarts", pourcentage: 75, nomBas: "Élèves" },
    },
    {
      id: "pourcentage-cinquiemes",
      titre: "40 % de 150 € — échelle des cinquièmes",
      genre: "pourcentage",
      options: { total: 150, echelle: "cinquiemes", pourcentage: 40, nomBas: "Prix (€)" },
    },
    {
      id: "pourcentage-hausse",
      titre: "Au-delà de 100 % : une hausse de 20 %",
      genre: "pourcentage",
      options: { total: 200, echelle: "libre", pas: 20, maxPourcentage: 140, pourcentage: 120 },
    },
  ].map((p) => Object.freeze({ ...p, options: Object.freeze(p.options) })),
);

/** Dessine un préréglage par son identifiant (atelier, catalogue, labo). */
export function dessinerPrereglageDroiteGraduee(id, supplement = {}) {
  const prereglage = PREREGLAGES_DROITE_GRADUEE.find((p) => p.id === id);
  if (!prereglage) {
    throw new RangeError(`dessinerPrereglageDroiteGraduee : préréglage inconnu « ${id} ».`);
  }
  const options = { titre: prereglage.titre, ...prereglage.options, ...supplement };
  if (prereglage.genre === "pourcentage") return dessinerDoubleDroitePourcentage(options);
  if (prereglage.genre === "double") return dessinerDoubleDroiteGraduee(options);
  return dessinerDroiteGraduee(options);
}
