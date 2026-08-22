import { creerGenerateur, validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=46";
import {
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_PLACER_POINT_REPERE,
  GABARIT_LIRE_COORDONNEES,
  GABARIT_PLACER_POINT_REPERE,
} from "./questions.js?v=46";

export const QUOTAS_LIRE_COORDONNEES = Object.freeze({
  5: Object.freeze({ complet: 3, abscisse: 1, ordonnee: 1, qcm: 0, identifier: 0 }),
  10: Object.freeze({ complet: 5, abscisse: 2, ordonnee: 1, qcm: 1, identifier: 1 }),
  15: Object.freeze({ complet: 8, abscisse: 2, ordonnee: 2, qcm: 2, identifier: 1 }),
  20: Object.freeze({ complet: 10, abscisse: 3, ordonnee: 3, qcm: 2, identifier: 2 }),
});

const FAMILLES_LECTURE = Object.freeze([
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_LIRE_COORDONNEES,
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
  "q1", "q2", "q3", "q4", "axe-x",
  "axe-y", "q2", "q4", "q3", "q1",
  "q2", "q4", "axe-x", "q3", "q1",
  "axe-y", "q4", "q2", "q3", "rare",
]);

const ZONES_PLACEMENT = Object.freeze([
  "q1", "q2", "q3", "q4", "q1",
  "q2", "q3", "q4", "axe-x", "axe-y",
  "q1", "q2", "q3", "q4", "axe-x",
  "axe-y", "q1", "q2", "q3", "rare",
]);

export const GABARITS_BORNES_REPERE = Object.freeze([
  Object.freeze({ xMin: -4, xMax: 4, yMin: -3, yMax: 3 }),
  Object.freeze({ xMin: -5, xMax: 3, yMin: -3, yMax: 4 }),
  Object.freeze({ xMin: -3, xMax: 5, yMin: -4, yMax: 3 }),
  Object.freeze({ xMin: -4, xMax: 3, yMin: -3, yMax: 5 }),
  Object.freeze({ xMin: -3, xMax: 4, yMin: -5, yMax: 3 }),
]);

const NOMS_POINTS = Object.freeze([
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "P", "R", "S", "T", "U", "V",
]);

function exigerNombreQuestions(nombreQuestions, quoi) {
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 20) {
    throw new RangeError(`${quoi} : nombreQuestions doit être compris entre 1 et 20`);
  }
}

function valeurs(minimum, maximum) {
  return Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
}

function candidatsZone(zone, bornes, { qcm = false } = {}) {
  const negatifsX = valeurs(bornes.xMin, -1);
  const positifsX = valeurs(1, bornes.xMax);
  const negatifsY = valeurs(bornes.yMin, -1);
  const positifsY = valeurs(1, bornes.yMax);
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
  return qcm
    ? candidats.filter(({ x, y }) => x !== 0 && y !== 0 && Math.abs(x) !== Math.abs(y))
    : candidats;
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
  for (let y = bornes.yMin; y <= bornes.yMax; y += 1) {
    for (let x = bornes.xMin; x <= bornes.xMax; x += 1) {
      if (x === cible.x && y === cible.y) continue;
      tous.push({ x, y });
    }
  }
  for (const candidat of aleatoire.melange(tous)) {
    if (positions.every((point) => distanceChebyshev(point, candidat) >= 2)) {
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

/** Produit les paramètres purs des vingt profils GE-03. */
export function planifierSerieLireCoordonnees({ graine, nombreQuestions = 10 }) {
  const { aleatoire, utilisees, decalageNom, inclureOrigine } = preparerSerie(
    graine,
    nombreQuestions,
    "lecture",
  );
  return Array.from({ length: nombreQuestions }, (_, index) => {
    const famille = FAMILLES_LECTURE[index];
    const bornes = GABARITS_BORNES_REPERE[(index + aleatoire.entier(0, GABARITS_BORNES_REPERE.length - 1)) % GABARITS_BORNES_REPERE.length];
    const zoneBrute = ZONES_LECTURE[index];
    const zone = zoneBrute === "rare"
      ? (inclureOrigine ? "origine" : aleatoire.choix(["axe-x", "axe-y"]))
      : zoneBrute;
    const cible = choisirCible(aleatoire, zone, bornes, utilisees, {
      qcm: famille === FAMILLE_DIAGNOSTIC_COORDONNEES,
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
    const bornes = GABARITS_BORNES_REPERE[(index + aleatoire.entier(0, GABARITS_BORNES_REPERE.length - 1)) % GABARITS_BORNES_REPERE.length];
    const zoneBrute = ZONES_PLACEMENT[index];
    const zone = zoneBrute === "rare" ? (inclureOrigine ? "origine" : "q4") : zoneBrute;
    const cible = choisirCible(aleatoire, zone, bornes, utilisees);
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

