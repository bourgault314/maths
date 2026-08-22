import { creerGenerateur, validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=50";
import {
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_PLACER_POINT_REPERE,
  GABARIT_LIRE_COORDONNEES,
  GABARIT_PLACER_POINT_REPERE,
} from "./questions.js?v=50";

export const QUOTAS_LIRE_COORDONNEES = Object.freeze({
  5: Object.freeze({ complet: 2, abscisse: 1, ordonnee: 1, qcm: 1, identifier: 0 }),
  10: Object.freeze({ complet: 5, abscisse: 2, ordonnee: 1, qcm: 1, identifier: 1 }),
  15: Object.freeze({ complet: 8, abscisse: 2, ordonnee: 2, qcm: 2, identifier: 1 }),
  20: Object.freeze({ complet: 10, abscisse: 3, ordonnee: 3, qcm: 2, identifier: 2 }),
});

const FAMILLES_LECTURE = Object.freeze([
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  FAMILLE_LIRE_COORDONNEES,
]);

const ZONES_LECTURE = Object.freeze([
  "q1", "q2", "axe-y", "q4", "axe-x",
  "q3", "q4", "q2", "q1", "q3",
  "q2", "q4", "axe-x", "q3", "q1",
  "axe-y", "q4", "q2", "q3", "rare",
]);

const ZONES_PLACEMENT = Object.freeze([
  "q1", "q2", "q3", "q4", "q1",
  "q2", "q3", "q4", "axe-x", "axe-y",
  "q1", "q2", "q3", "q4", "axe-x",
  "axe-y", "q1", "q2", "q3", "rare",
]);

const PAS_PAR_PROFIL = Object.freeze([
  1, 1, 1, 0.5, 1,
  1, 1, 0.5, 1, 1,
  0.5, 1, 1, 1, 1,
  1, 0.5, 1, 0.25, 1,
]);

export const GABARITS_BORNES_REPERE = Object.freeze([
  Object.freeze({ pas: 1, xMin: -4, xMax: 4, yMin: -3, yMax: 3 }),
  Object.freeze({ pas: 1, xMin: -5, xMax: 3, yMin: -3, yMax: 4 }),
  Object.freeze({ pas: 1, xMin: -3, xMax: 5, yMin: -4, yMax: 3 }),
  Object.freeze({ pas: 1, xMin: -4, xMax: 3, yMin: -3, yMax: 5 }),
  Object.freeze({ pas: 1, xMin: -3, xMax: 4, yMin: -5, yMax: 3 }),
  Object.freeze({ pas: 0.5, xMin: -3, xMax: 2.5, yMin: -2, yMax: 2.5 }),
  Object.freeze({ pas: 0.5, xMin: -2.5, xMax: 3, yMin: -2, yMax: 2.5 }),
  Object.freeze({ pas: 0.5, xMin: -2, xMax: 2.5, yMin: -2.5, yMax: 2 }),
  Object.freeze({ pas: 0.25, xMin: -1.5, xMax: 1.25, yMin: -1, yMax: 1.25 }),
  Object.freeze({ pas: 0.25, xMin: -1.25, xMax: 1.5, yMin: -1.25, yMax: 1 }),
]);

const GABARITS_PAR_PAS = new Map([0.25, 0.5, 1].map((pas) => [
  pas,
  GABARITS_BORNES_REPERE.filter((gabarit) => gabarit.pas === pas),
]));

const NOMS_POINTS = Object.freeze([
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "P", "R", "S", "T", "U", "V",
]);

function exigerNombreQuestions(nombreQuestions, quoi) {
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 20) {
    throw new RangeError(`${quoi} : nombreQuestions doit être compris entre 1 et 20`);
  }
}

function valeurs(minimum, maximum, pas) {
  const nombreIntervalles = Math.round((maximum - minimum) / pas);
  return Array.from(
    { length: nombreIntervalles + 1 },
    (_, index) => minimum + index * pas,
  );
}

function candidatsZone(zone, bornes, { qcm = false, fractionAxe = null } = {}) {
  const toutesX = valeurs(bornes.xMin, bornes.xMax, bornes.pas);
  const toutesY = valeurs(bornes.yMin, bornes.yMax, bornes.pas);
  const negatifsX = toutesX.filter((x) => x < 0);
  const positifsX = toutesX.filter((x) => x > 0);
  const negatifsY = toutesY.filter((y) => y < 0);
  const positifsY = toutesY.filter((y) => y > 0);
  const produit = (xs, ys) => xs.flatMap((x) => ys.map((y) => ({ x, y })));
  let candidats;
  if (zone === "q1") candidats = produit(positifsX, positifsY);
  else if (zone === "q2") candidats = produit(negatifsX, positifsY);
  else if (zone === "q3") candidats = produit(negatifsX, negatifsY);
  else if (zone === "q4") candidats = produit(positifsX, negatifsY);
  else if (zone === "axe-x") candidats = [...negatifsX, ...positifsX].map((x) => ({ x, y: 0 }));
  else if (zone === "axe-y") candidats = [...negatifsY, ...positifsY].map((y) => ({ x: 0, y }));
  else if (zone === "origine") candidats = [{ x: 0, y: 0 }];
  else throw new RangeError(`zone de repère inconnue : ${zone}`);
  const sansAmbiguite = qcm
    ? candidats.filter(({ x, y }) => x !== 0 && y !== 0 && Math.abs(x) !== Math.abs(y))
    : candidats;
  if (fractionAxe === "x") return sansAmbiguite.filter(({ x }) => !Number.isInteger(x));
  if (fractionAxe === "y") return sansAmbiguite.filter(({ y }) => !Number.isInteger(y));
  if (fractionAxe === "au-moins-une") {
    return sansAmbiguite.filter(({ x, y }) => !Number.isInteger(x) || !Number.isInteger(y));
  }
  return sansAmbiguite;
}

function choisirCible(aleatoire, zone, bornes, utilisees, options = {}) {
  const candidats = aleatoire.melange(candidatsZone(zone, bornes, options));
  const libre = candidats.find(({ x, y }) => !utilisees.has(`${x};${y}`));
  const cible = libre ?? candidats[0];
  if (!cible) throw new Error(`aucune coordonnée disponible pour ${zone}`);
  utilisees.add(`${cible.x};${cible.y}`);
  return cible;
}

function distanceChebyshev(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function pointsIdentification(aleatoire, cible, nomCible, bornes, nomsDisponibles) {
  const positions = [{ ...cible }];
  const tous = [];
  for (const y of valeurs(bornes.yMin, bornes.yMax, bornes.pas)) {
    for (const x of valeurs(bornes.xMin, bornes.xMax, bornes.pas)) {
      if (x === cible.x && y === cible.y) continue;
      tous.push({ x, y });
    }
  }
  const distanceMinimale = bornes.pas < 1 ? 3 : 2;
  for (const candidat of aleatoire.melange(tous)) {
    if (positions.every((point) =>
      distanceChebyshev(point, candidat) / bornes.pas >= distanceMinimale)) {
      positions.push(candidat);
      if (positions.length === 4) break;
    }
  }
  if (positions.length !== 4) throw new Error("impossible d'espacer quatre points dans le repère");
  const autresNoms = nomsDisponibles.filter((nom) => nom !== nomCible).slice(0, 3);
  const points = [
    { nom: nomCible, ...positions[0] },
    ...positions.slice(1).map((position, index) => ({ nom: autresNoms[index], ...position })),
  ];
  return aleatoire.melange(points);
}

function gabaritAvec(gabarit, parametres) {
  return {
    ...gabarit,
    generateur: { ...gabarit.generateur },
    parametres,
  };
}

function preparerSerie(graine, nombreQuestions, suffixe) {
  validerGraine(graine);
  exigerNombreQuestions(nombreQuestions, `série ${suffixe}`);
  const aleatoire = creerGenerateur(`reperage-plan:${suffixe}:${graine}`);
  return {
    aleatoire,
    utilisees: new Set(),
    decalageNom: aleatoire.entier(0, NOMS_POINTS.length - 1),
    inclureOrigine: aleatoire.entier(0, 3) === 0,
  };
}

function nomsTournes(decalage, index) {
  return Array.from({ length: NOMS_POINTS.length }, (_, rang) =>
    NOMS_POINTS[(decalage + index + rang) % NOMS_POINTS.length]);
}

function choisirBornes(aleatoire, index) {
  const pas = PAS_PAR_PROFIL[index];
  const gabarits = GABARITS_PAR_PAS.get(pas);
  return gabarits[(index + aleatoire.entier(0, gabarits.length - 1)) % gabarits.length];
}

function fractionAxePourFamille(famille, pas) {
  if (pas === 1) return null;
  if (famille === FAMILLE_LIRE_ABSCISSE_REPERE) return "x";
  if (famille === FAMILLE_LIRE_ORDONNEE) return "y";
  return "au-moins-une";
}

/** Produit les paramètres purs des vingt profils GE-03. */
export function planifierSerieLireCoordonnees({ graine, nombreQuestions = 10 }) {
  const { aleatoire, utilisees, decalageNom, inclureOrigine } = preparerSerie(
    graine,
    nombreQuestions,
    "lecture",
  );
  return Array.from({ length: nombreQuestions }, (_, index) => {
    const famille = FAMILLES_LECTURE[index];
    const bornes = choisirBornes(aleatoire, index);
    const zoneBrute = ZONES_LECTURE[index];
    const zone = zoneBrute === "rare"
      ? (inclureOrigine ? "origine" : aleatoire.choix(["axe-x", "axe-y"]))
      : zoneBrute;
    const cible = choisirCible(aleatoire, zone, bornes, utilisees, {
      qcm: famille === FAMILLE_DIAGNOSTIC_COORDONNEES,
      fractionAxe: fractionAxePourFamille(famille, bornes.pas),
    });
    const noms = nomsTournes(decalageNom, index);
    const nomPoint = noms[0];
    return {
      famille,
      ...bornes,
      ...cible,
      nomPoint,
      decalageChoix: aleatoire.entier(0, 3),
      ...(famille === FAMILLE_IDENTIFIER_POINT
        ? { points: pointsIdentification(aleatoire, cible, nomPoint, bornes, noms) }
        : {}),
    };
  });
}

/** Produit les paramètres purs des vingt profils GE-04. */
export function planifierSeriePlacerPointRepere({ graine, nombreQuestions = 10 }) {
  const { aleatoire, utilisees, decalageNom, inclureOrigine } = preparerSerie(
    graine,
    nombreQuestions,
    "placement",
  );
  return Array.from({ length: nombreQuestions }, (_, index) => {
    const bornes = choisirBornes(aleatoire, index);
    const zoneBrute = ZONES_PLACEMENT[index];
    const zone = zoneBrute === "rare" ? (inclureOrigine ? "origine" : "q4") : zoneBrute;
    const cible = choisirCible(aleatoire, zone, bornes, utilisees, {
      fractionAxe: bornes.pas === 1 ? null : "au-moins-une",
    });
    return {
      famille: FAMILLE_PLACER_POINT_REPERE,
      ...bornes,
      ...cible,
      nomPoint: NOMS_POINTS[(decalageNom + index) % NOMS_POINTS.length],
      decalageChoix: 0,
    };
  });
}

export function genererSerieLireCoordonnees({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError("série lire-coordonnees : registre requis");
  }
  return planifierSerieLireCoordonnees({ graine, nombreQuestions })
    .map((parametres, index) => registre.instancier(
      gabaritAvec(GABARIT_LIRE_COORDONNEES, parametres),
      `${graine}:${index + 1}`,
    ));
}

export function genererSeriePlacerPointRepere({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") {
    throw new TypeError("série placer-point-repere : registre requis");
  }
  return planifierSeriePlacerPointRepere({ graine, nombreQuestions })
    .map((parametres, index) => registre.instancier(
      gabaritAvec(GABARIT_PLACER_POINT_REPERE, parametres),
      `${graine}:${index + 1}`,
    ));
}
