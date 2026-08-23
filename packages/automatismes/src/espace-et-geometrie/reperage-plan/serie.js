import { creerGenerateur, validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=54";
import {
  apparierProfilsCompatibles,
  definirPaquetPondere,
  ordonnerEnLimitantRepetitions,
  tirerProfilsPonderes,
} from "../../../../moteur-exercices/src/paquets-ponderes.js?v=54";
import {
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  FAMILLE_LIRE_ABSCISSE_REPERE,
  FAMILLE_LIRE_COORDONNEES,
  FAMILLE_LIRE_ORDONNEE,
  FAMILLE_PLACER_POINT_REPERE,
  FORMULATION_COORDONNEE_PHRASE,
  FORMULATION_COORDONNEE_SYMBOLIQUE,
  GABARIT_LIRE_COORDONNEES,
  GABARIT_PLACER_POINT_REPERE,
} from "./questions.js?v=54";

export const QUOTAS_LIRE_COORDONNEES = Object.freeze({
  20: Object.freeze({ complet: 10, abscisse: 3, ordonnee: 3, qcm: 2, identifier: 2 }),
});

export const PAQUET_FAMILLES_LIRE_COORDONNEES = definirPaquetPondere({
  id: "ge03-familles",
  profils: [
    { id: FAMILLE_LIRE_COORDONNEES, quota: 10, categorie: "principale" },
    { id: FAMILLE_LIRE_ABSCISSE_REPERE, quota: 3, categorie: "secondaire" },
    { id: FAMILLE_LIRE_ORDONNEE, quota: 3, categorie: "secondaire" },
    { id: FAMILLE_DIAGNOSTIC_COORDONNEES, quota: 2, categorie: "rare" },
    { id: FAMILLE_IDENTIFIER_POINT, quota: 2, categorie: "rare" },
  ],
});

export const PAQUET_PAS_REPERE = definirPaquetPondere({
  id: "ge03-ge04-pas",
  profils: [
    { id: "pas-1", quota: 15, categorie: "principale", pas: 1 },
    { id: "pas-0.5", quota: 4, categorie: "secondaire", pas: 0.5 },
    { id: "pas-0.25", quota: 1, categorie: "rare", pas: 0.25 },
  ],
});

export const PAQUET_FORMULATIONS_COORDONNEE_ISOLEE = definirPaquetPondere({
  id: "ge03-formulations-coordonnee-isolee",
  profils: [
    { id: FORMULATION_COORDONNEE_PHRASE, quota: 14, categorie: "principale" },
    { id: FORMULATION_COORDONNEE_SYMBOLIQUE, quota: 6, categorie: "secondaire" },
  ],
});

export const PAQUET_ZONES_LECTURE = definirPaquetPondere({
  id: "ge03-zones",
  profils: [
    { id: "q1", quota: 3, categorie: "principale" },
    { id: "q2", quota: 4, categorie: "principale" },
    { id: "q3", quota: 4, categorie: "principale" },
    { id: "q4", quota: 4, categorie: "principale" },
    { id: "axe-x", quota: 2, categorie: "secondaire" },
    { id: "axe-y", quota: 2, categorie: "secondaire" },
    { id: "rare", quota: 1, categorie: "rare" },
  ],
});

export const PAQUET_ZONES_PLACEMENT = definirPaquetPondere({
  id: "ge04-zones",
  profils: [
    { id: "q1", quota: 4, categorie: "principale" },
    { id: "q2", quota: 4, categorie: "principale" },
    { id: "q3", quota: 4, categorie: "principale" },
    { id: "q4", quota: 3, categorie: "principale" },
    { id: "axe-x", quota: 2, categorie: "secondaire" },
    { id: "axe-y", quota: 2, categorie: "secondaire" },
    { id: "rare", quota: 1, categorie: "rare" },
  ],
});

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
  const dansBornes = ({ x, y }) => x >= bornes.xMin && x <= bornes.xMax
    && y >= bornes.yMin && y <= bornes.yMax;
  const sansAmbiguite = qcm
    ? candidats.filter(({ x, y }) => x !== 0
      && y !== 0
      && Math.abs(x) !== Math.abs(y)
      // Les quatre propositions ont un sens dans le repère affiché. Aucun
      // distracteur ne peut être éliminé uniquement parce qu'une coordonnée
      // sortirait des bornes visibles.
      && [
        { x, y },
        { x: y, y: x },
        { x: -x, y },
        { x, y: -y },
      ].every(dansBornes))
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

function choisirBornes(aleatoire, pas) {
  const gabarits = GABARITS_PAR_PAS.get(pas);
  return aleatoire.choix(gabarits);
}

function fractionAxePourFamille(famille, pas) {
  if (pas === 1) return null;
  if (famille === FAMILLE_LIRE_ABSCISSE_REPERE) return "x";
  if (famille === FAMILLE_LIRE_ORDONNEE) return "y";
  return "au-moins-une";
}

function zoneCompatibleLecture({ famille, pas }, profilZone, inclureOrigine) {
  if (famille === FAMILLE_DIAGNOSTIC_COORDONNEES) {
    return ["q1", "q2", "q3", "q4"].includes(profilZone.id);
  }
  if (profilZone.id === "rare") return !inclureOrigine || pas === 1;
  if (pas === 1) return true;
  if (famille === FAMILLE_LIRE_ABSCISSE_REPERE) return profilZone.id !== "axe-y";
  if (famille === FAMILLE_LIRE_ORDONNEE) return profilZone.id !== "axe-x";
  return true;
}

function resoudreZoneLecture(profilZone, { famille, pas }, inclureOrigine, aleatoire) {
  if (profilZone.id !== "rare") return profilZone.id;
  if (inclureOrigine) return "origine";
  if (pas < 1 && famille === FAMILLE_LIRE_ABSCISSE_REPERE) return "axe-x";
  if (pas < 1 && famille === FAMILLE_LIRE_ORDONNEE) return "axe-y";
  return aleatoire.choix(["axe-x", "axe-y"]);
}

function tirerZonesCompatibles({
  paquet,
  elements,
  graine,
  inclureOrigine,
  estCompatible,
}) {
  for (let essai = 0; essai < 40; essai += 1) {
    const profils = tirerProfilsPonderes({
      paquet,
      graine: `${graine}:essai-${essai}`,
      nombreElements: elements.length,
    });
    try {
      return apparierProfilsCompatibles({
        elements,
        profils,
        graine: `${graine}:appariement-${essai}`,
        estCompatible: (element, profil) =>
          estCompatible(element, profil, inclureOrigine),
      });
    } catch (erreur) {
      if (!String(erreur.message).startsWith("appariement pondéré")) throw erreur;
    }
  }
  throw new Error("série repérage-plan : profils compatibles introuvables");
}

/** Produit les paramètres purs des vingt profils GE-03. */
export function planifierSerieLireCoordonnees({ graine, nombreQuestions = 10 }) {
  const { aleatoire, utilisees, decalageNom, inclureOrigine } = preparerSerie(
    graine,
    nombreQuestions,
    "lecture",
  );
  const familles = ordonnerEnLimitantRepetitions({
    elements: tirerProfilsPonderes({
      paquet: PAQUET_FAMILLES_LIRE_COORDONNEES,
      graine: `ge03-familles:${graine}`,
      nombreElements: nombreQuestions,
    }),
    graine: `ge03-ordre-familles:${graine}`,
    cle: ({ id }) => id,
  });
  const pas = tirerProfilsPonderes({
    paquet: PAQUET_PAS_REPERE,
    graine: `ge03-pas:${graine}`,
    nombreElements: nombreQuestions,
  });
  const elements = familles.map((profil, index) => ({
    famille: profil.id,
    pas: pas[index].pas,
  }));
  const nombreCoordonneesIsolees = elements.filter(({ famille }) => [
    FAMILLE_LIRE_ABSCISSE_REPERE,
    FAMILLE_LIRE_ORDONNEE,
  ].includes(famille)).length;
  const formulationsIsolees = nombreCoordonneesIsolees === 0
    ? []
    : tirerProfilsPonderes({
      paquet: PAQUET_FORMULATIONS_COORDONNEE_ISOLEE,
      graine: `ge03-formulations-isolees:${graine}`,
      nombreElements: nombreCoordonneesIsolees,
    });
  let indexFormulationIsolee = 0;
  const zones = tirerZonesCompatibles({
    paquet: PAQUET_ZONES_LECTURE,
    elements,
    graine: `ge03-zones:${graine}`,
    inclureOrigine,
    estCompatible: zoneCompatibleLecture,
  });
  return elements.map(({ famille, pas: pasValeur }, index) => {
    const bornes = choisirBornes(aleatoire, pasValeur);
    const zone = resoudreZoneLecture(
      zones[index],
      { famille, pas: pasValeur },
      inclureOrigine,
      aleatoire,
    );
    const cible = choisirCible(aleatoire, zone, bornes, utilisees, {
      qcm: famille === FAMILLE_DIAGNOSTIC_COORDONNEES,
      fractionAxe: fractionAxePourFamille(famille, bornes.pas),
    });
    const noms = nomsTournes(decalageNom, index);
    const nomPoint = noms[0];
    const familleIsolee = [
      FAMILLE_LIRE_ABSCISSE_REPERE,
      FAMILLE_LIRE_ORDONNEE,
    ].includes(famille);
    return {
      famille,
      ...bornes,
      ...cible,
      nomPoint,
      decalageChoix: aleatoire.entier(0, 3),
      ...(familleIsolee
        ? { formulation: formulationsIsolees[indexFormulationIsolee++].id }
        : {}),
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
  const pas = tirerProfilsPonderes({
    paquet: PAQUET_PAS_REPERE,
    graine: `ge04-pas:${graine}`,
    nombreElements: nombreQuestions,
  });
  const elements = pas.map((profil) => ({ pas: profil.pas }));
  const zones = tirerZonesCompatibles({
    paquet: PAQUET_ZONES_PLACEMENT,
    elements,
    graine: `ge04-zones:${graine}`,
    inclureOrigine,
    estCompatible: ({ pas: pasValeur }, profilZone, origine) =>
      profilZone.id !== "rare" || !origine || pasValeur === 1,
  });
  return elements.map(({ pas: pasValeur }, index) => {
    const bornes = choisirBornes(aleatoire, pasValeur);
    const zone = zones[index].id === "rare"
      ? (inclureOrigine ? "origine" : "q4")
      : zones[index].id;
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
