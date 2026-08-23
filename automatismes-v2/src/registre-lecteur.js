import { GABARIT_RECONNAISSANCE_SOLIDES } from "../../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=53";
import {
  genererSerieSolidesUsuels,
  PAQUET_PROFILS_SOLIDES_USUELS,
  PAQUET_VUES_SOLIDES_USUELS,
} from "../../packages/automatismes/src/espace-et-geometrie/solides-usuels/serie.js?v=53";
import { GABARIT_DROITE_GRADUEE } from "../../packages/automatismes/src/espace-et-geometrie/droite-graduee/questions.js?v=53";
import {
  genererSerieDroiteGraduee,
  PAQUET_FAMILLES_DROITE_GRADUEE,
  PAQUET_PROFILS_DROITE_GRADUEE,
} from "../../packages/automatismes/src/espace-et-geometrie/droite-graduee/serie.js?v=53";
import {
  GABARIT_LIRE_COORDONNEES,
  GABARIT_PLACER_POINT_REPERE,
} from "../../packages/automatismes/src/espace-et-geometrie/reperage-plan/questions.js?v=53";
import {
  genererSerieLireCoordonnees,
  genererSeriePlacerPointRepere,
  PAQUET_FAMILLES_LIRE_COORDONNEES,
  PAQUET_PAS_REPERE,
  PAQUET_ZONES_LECTURE,
  PAQUET_ZONES_PLACEMENT,
} from "../../packages/automatismes/src/espace-et-geometrie/reperage-plan/serie.js?v=53";
import {
  GABARIT_VOLUME_CUBE_PAVE,
  GABARIT_VOLUME_CYLINDRE,
  GABARIT_VOLUME_PRISME,
} from "../../packages/automatismes/src/grandeurs-et-mesures/volumes/calcul-volumes.js?v=53";
import {
  genererSerieVolumeCubePave,
  genererSerieVolumeCylindre,
  genererSerieVolumePrisme,
  PAQUET_DONNEES_VOLUMES,
  PAQUET_FORMES_VOLUME_CUBE_PAVE,
  PAQUET_MODES_VOLUME_CYLINDRE,
  PAQUET_VUES_VOLUMES,
} from "../../packages/automatismes/src/grandeurs-et-mesures/volumes/serie.js?v=53";
import { GABARIT_SELECTION_DIVISEURS } from "../../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js?v=53";
import {
  genererSerieNC01,
  PAQUET_FAMILLES_NC01,
} from "../../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/serie.js?v=53";
import { GABARIT_CALCUL_DIRECT_CARRE } from "../../packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/calcul-direct.js?v=53";
import {
  genererSerieNC02,
  PAQUET_FAMILLES_NC02,
} from "../../packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/serie.js?v=53";
import {
  GABARIT_FRACTION_VERS_DECIMAL,
} from "../../packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/fraction-vers-decimal.js?v=53";
import {
  GABARIT_DECIMAL_VERS_FRACTION,
} from "../../packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/decimal-vers-fraction.js?v=53";
import {
  genererSerieDecimalVersFraction,
  genererSerieFractionVersDecimal,
  genererSerieFractionsDecimaux,
  PAQUET_CLASSES_VALEURS_FRACTIONS_DECIMAUX,
  PAQUET_CLASSES_VALEURS_FRACTIONS_ISOLEES,
  PAQUET_CONTENUS_FRACTIONS_DECIMAUX,
  PAQUET_CONTENUS_NC03,
  PAQUET_CONTENUS_NC04,
  PAQUET_MICRO_NOTIONS_FRACTIONS_DECIMAUX,
  PAQUET_PRESENTATIONS_FRACTIONS_DECIMAUX,
} from "../../packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/serie.js?v=53";
import {
  GABARIT_ECRITURES_MULTIPLES,
} from "../../packages/automatismes/src/nombres-et-calculs/ecritures-multiples-nombre/questions.js?v=53";
import {
  genererSerieEcrituresMultiples,
  PAQUET_PRESENTATIONS_ECRITURES_MULTIPLES,
  PAQUET_PROFILS_ECRITURES_MULTIPLES,
} from "../../packages/automatismes/src/nombres-et-calculs/ecritures-multiples-nombre/serie.js?v=53";
import {
  DOMAINES_AUTOMATISMES,
  MICRO_NOTIONS_AUTOMATISMES,
  MODULES_AUTOMATISMES,
} from "../../packages/automatismes/src/identifiants.js?v=53";
import {
  TAILLE_PAQUET_REFERENCE,
} from "../../packages/moteur-exercices/src/paquets-ponderes.js?v=53";

export const NOTION_NC01 = MODULES_AUTOMATISMES.CRITERES_DIVISIBILITE;
export const NOTION_NC02 = MODULES_AUTOMATISMES.CARRES_ENTIERS;
export const NOTION_FRACTION_VERS_DECIMAL =
  MICRO_NOTIONS_AUTOMATISMES.FRACTION_VERS_DECIMAL;
export const NOTION_DECIMAL_VERS_FRACTION =
  MICRO_NOTIONS_AUTOMATISMES.DECIMAL_VERS_FRACTION;
export const NOTION_FRACTIONS_SIMPLES_DECIMAUX =
  MODULES_AUTOMATISMES.FRACTIONS_SIMPLES_DECIMAUX;
export const NOTION_ECRITURES_MULTIPLES_NOMBRE =
  MODULES_AUTOMATISMES.ECRITURES_MULTIPLES_NOMBRE;
export const NOTION_SOLIDES_USUELS = MODULES_AUTOMATISMES.SOLIDES_USUELS;
export const NOTION_DROITE_GRADUEE = MODULES_AUTOMATISMES.DROITE_GRADUEE;
export const NOTION_LIRE_COORDONNEES_POINT = MODULES_AUTOMATISMES.LIRE_COORDONNEES_POINT;
export const NOTION_PLACER_POINT_REPERE = MODULES_AUTOMATISMES.PLACER_POINT_REPERE;
export const NOTION_VOLUME_CUBE_PAVE = MODULES_AUTOMATISMES.VOLUME_CUBE_PAVE;
export const NOTION_VOLUME_PRISME = MODULES_AUTOMATISMES.VOLUME_PRISME;
export const NOTION_VOLUME_CYLINDRE = MODULES_AUTOMATISMES.VOLUME_CYLINDRE;

export const RENDU_DIVISIBILITE = "divisibilite";
export const RENDU_CARRES = "carres";
export const RENDU_FRACTIONS_DECIMAUX = "fractions-decimaux";
export const RENDU_ECRITURES_MULTIPLES = "ecritures-multiples";
export const RENDU_SOLIDE = "solide";
export const RENDU_DROITE_GRADUEE = "droite-graduee";
export const RENDU_REPERAGE_PLAN = "reperage-plan";
export const RENDU_VOLUME = "volume";

const RENDUS = new Set([
  RENDU_DIVISIBILITE,
  RENDU_CARRES,
  RENDU_FRACTIONS_DECIMAUX,
  RENDU_ECRITURES_MULTIPLES,
  RENDU_SOLIDE,
  RENDU_DROITE_GRADUEE,
  RENDU_REPERAGE_PLAN,
  RENDU_VOLUME,
]);

function definirNotion({
  id,
  nom,
  gabarit,
  rendu,
  graineApercu = `apercu-${id}`,
  cours = false,
  pagesCours = cours ? 1 : 0,
  aideChiffres = false,
  rotationSolide = false,
  creerSerie,
  nombreQuestionsMaximum,
  paquetsSelection,
  notionsProduites = [id],
}) {
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new TypeError(`identifiant de notion invalide : ${id}`);
  }
  if (typeof nom !== "string" || nom.trim() === "") {
    throw new TypeError(`nom de notion manquant : ${id}`);
  }
  if (!gabarit || typeof gabarit !== "object") {
    throw new TypeError(`gabarit de notion manquant : ${id}`);
  }
  if (!RENDUS.has(rendu)) {
    throw new RangeError(`rendu de notion inconnu : ${rendu}`);
  }
  if (![cours, aideChiffres, rotationSolide].every((valeur) => typeof valeur === "boolean")) {
    throw new TypeError(`capacités de notion invalides : ${id}`);
  }
  if (!Number.isInteger(pagesCours) || pagesCours < 0 || (cours && pagesCours < 1)) {
    throw new RangeError(`nombre de pages de cours invalide : ${id}`);
  }
  if (typeof creerSerie !== "function") {
    throw new TypeError(`fabrique de série V2 obligatoire : ${id}`);
  }
  if (nombreQuestionsMaximum !== TAILLE_PAQUET_REFERENCE) {
    throw new RangeError(
      `capacité de série V2 invalide : ${id} doit accepter ${TAILLE_PAQUET_REFERENCE} questions`,
    );
  }
  if (!Array.isArray(paquetsSelection) || paquetsSelection.length < 1) {
    throw new TypeError(`paquets de sélection V2 obligatoires : ${id}`);
  }
  const idsPaquets = new Set();
  for (const paquet of paquetsSelection) {
    if (
      !paquet
      || typeof paquet.id !== "string"
      || paquet.tailleReference !== TAILLE_PAQUET_REFERENCE
      || !Array.isArray(paquet.profils)
      || paquet.profils.length < 1
    ) {
      throw new TypeError(`paquet de sélection V2 invalide : ${id}`);
    }
    if (idsPaquets.has(paquet.id)) {
      throw new RangeError(`paquet de sélection V2 dupliqué pour ${id} : ${paquet.id}`);
    }
    idsPaquets.add(paquet.id);
    const total = paquet.profils.reduce((somme, profil) => somme + profil.quota, 0);
    if (
      total !== TAILLE_PAQUET_REFERENCE
      || paquet.profils.some((profil) =>
        !["principale", "secondaire", "rare"].includes(profil.categorie))
    ) {
      throw new RangeError(`quotas du paquet ${paquet.id} invalides pour ${id}`);
    }
  }
  if (
    !Array.isArray(notionsProduites)
    || notionsProduites.length < 1
    || notionsProduites.some((notion) => typeof notion !== "string")
  ) {
    throw new TypeError(`notions produites invalides : ${id}`);
  }
  return Object.freeze({
    id,
    nom,
    gabarit,
    rendu,
    graineApercu,
    capacites: Object.freeze({ cours, aideChiffres, rotationSolide }),
    pagesCours,
    creerSerie,
    nombreQuestionsMaximum,
    paquetsSelection: Object.freeze([...paquetsSelection]),
    notionsProduites: Object.freeze([...notionsProduites]),
  });
}

const DEFINITIONS = Object.freeze([
  definirNotion({
    id: NOTION_NC01,
    nom: "Critères de divisibilité",
    gabarit: GABARIT_SELECTION_DIVISEURS,
    rendu: RENDU_DIVISIBILITE,
    graineApercu: "apercu-nc01-complet",
    cours: true,
    pagesCours: 3,
    aideChiffres: true,
    creerSerie: genererSerieNC01,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [PAQUET_FAMILLES_NC01],
  }),
  definirNotion({
    id: NOTION_NC02,
    nom: "Carrés des entiers de 0 à 12",
    gabarit: GABARIT_CALCUL_DIRECT_CARRE,
    rendu: RENDU_CARRES,
    graineApercu: "apercu-nc02-complet",
    cours: true,
    pagesCours: 5,
    creerSerie: genererSerieNC02,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [PAQUET_FAMILLES_NC02],
  }),
  definirNotion({
    id: NOTION_FRACTION_VERS_DECIMAL,
    nom: "Fraction vers écriture décimale",
    gabarit: GABARIT_FRACTION_VERS_DECIMAL,
    rendu: RENDU_FRACTIONS_DECIMAUX,
    graineApercu: "apercu-nc03-complet",
    cours: true,
    pagesCours: 5,
    creerSerie: genererSerieFractionVersDecimal,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [
      PAQUET_CONTENUS_NC03,
      PAQUET_PRESENTATIONS_FRACTIONS_DECIMAUX,
      PAQUET_CLASSES_VALEURS_FRACTIONS_ISOLEES,
    ],
  }),
  definirNotion({
    id: NOTION_DECIMAL_VERS_FRACTION,
    nom: "Écriture décimale vers fraction",
    gabarit: GABARIT_DECIMAL_VERS_FRACTION,
    rendu: RENDU_FRACTIONS_DECIMAUX,
    graineApercu: "apercu-nc04-complet",
    cours: true,
    pagesCours: 5,
    creerSerie: genererSerieDecimalVersFraction,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [
      PAQUET_CONTENUS_NC04,
      PAQUET_PRESENTATIONS_FRACTIONS_DECIMAUX,
      PAQUET_CLASSES_VALEURS_FRACTIONS_ISOLEES,
    ],
  }),
  definirNotion({
    id: NOTION_ECRITURES_MULTIPLES_NOMBRE,
    nom: "Un nombre, plusieurs écritures",
    gabarit: GABARIT_ECRITURES_MULTIPLES,
    rendu: RENDU_ECRITURES_MULTIPLES,
    graineApercu: "apercu-nc05-complet",
    cours: true,
    pagesCours: 6,
    creerSerie: genererSerieEcrituresMultiples,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [
      PAQUET_PROFILS_ECRITURES_MULTIPLES,
      PAQUET_PRESENTATIONS_ECRITURES_MULTIPLES,
    ],
  }),
  definirNotion({
    id: NOTION_DROITE_GRADUEE,
    nom: "Droite graduée",
    gabarit: GABARIT_DROITE_GRADUEE,
    rendu: RENDU_DROITE_GRADUEE,
    graineApercu: "apercu-ge01-ge02-complet",
    cours: true,
    pagesCours: 6,
    creerSerie: genererSerieDroiteGraduee,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [
      PAQUET_FAMILLES_DROITE_GRADUEE,
      PAQUET_PROFILS_DROITE_GRADUEE,
    ],
  }),
  definirNotion({
    id: NOTION_LIRE_COORDONNEES_POINT,
    nom: "Lire les coordonnées d'un point",
    gabarit: GABARIT_LIRE_COORDONNEES,
    rendu: RENDU_REPERAGE_PLAN,
    graineApercu: "apercu-ge03-complet",
    cours: true,
    pagesCours: 3,
    creerSerie: genererSerieLireCoordonnees,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [
      PAQUET_FAMILLES_LIRE_COORDONNEES,
      PAQUET_PAS_REPERE,
      PAQUET_ZONES_LECTURE,
    ],
  }),
  definirNotion({
    id: NOTION_PLACER_POINT_REPERE,
    nom: "Placer un point dans un repère",
    gabarit: GABARIT_PLACER_POINT_REPERE,
    rendu: RENDU_REPERAGE_PLAN,
    graineApercu: "apercu-ge04-complet",
    cours: true,
    pagesCours: 3,
    creerSerie: genererSeriePlacerPointRepere,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [PAQUET_PAS_REPERE, PAQUET_ZONES_PLACEMENT],
  }),
  definirNotion({
    id: NOTION_SOLIDES_USUELS,
    nom: "Solides usuels",
    gabarit: GABARIT_RECONNAISSANCE_SOLIDES,
    rendu: RENDU_SOLIDE,
    cours: true,
    rotationSolide: true,
    creerSerie: genererSerieSolidesUsuels,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [PAQUET_PROFILS_SOLIDES_USUELS, PAQUET_VUES_SOLIDES_USUELS],
  }),
  definirNotion({
    id: NOTION_VOLUME_CUBE_PAVE,
    nom: "Volumes — cube et pavé",
    gabarit: GABARIT_VOLUME_CUBE_PAVE,
    rendu: RENDU_VOLUME,
    cours: true,
    rotationSolide: true,
    creerSerie: genererSerieVolumeCubePave,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [
      PAQUET_FORMES_VOLUME_CUBE_PAVE,
      PAQUET_DONNEES_VOLUMES,
      PAQUET_VUES_VOLUMES,
    ],
  }),
  definirNotion({
    id: NOTION_VOLUME_PRISME,
    nom: "Volumes — prisme droit",
    gabarit: GABARIT_VOLUME_PRISME,
    rendu: RENDU_VOLUME,
    cours: true,
    rotationSolide: true,
    creerSerie: genererSerieVolumePrisme,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [PAQUET_DONNEES_VOLUMES, PAQUET_VUES_VOLUMES],
  }),
  definirNotion({
    id: NOTION_VOLUME_CYLINDRE,
    nom: "Volumes — cylindre",
    gabarit: GABARIT_VOLUME_CYLINDRE,
    rendu: RENDU_VOLUME,
    cours: true,
    rotationSolide: true,
    creerSerie: genererSerieVolumeCylindre,
    nombreQuestionsMaximum: 20,
    paquetsSelection: [
      PAQUET_MODES_VOLUME_CYLINDRE,
      PAQUET_DONNEES_VOLUMES,
      PAQUET_VUES_VOLUMES,
    ],
  }),
]);

const DEFINITION_FRACTIONS_SIMPLES_DECIMAUX_LEGACY = definirNotion({
  id: NOTION_FRACTIONS_SIMPLES_DECIMAUX,
  nom: "Fractions simples et décimaux",
  gabarit: GABARIT_FRACTION_VERS_DECIMAL,
  rendu: RENDU_FRACTIONS_DECIMAUX,
  graineApercu: "apercu-nc03-nc04-complet",
  cours: true,
  pagesCours: 6,
  creerSerie: genererSerieFractionsDecimaux,
  nombreQuestionsMaximum: 20,
  paquetsSelection: [
    PAQUET_MICRO_NOTIONS_FRACTIONS_DECIMAUX,
    PAQUET_CONTENUS_FRACTIONS_DECIMAUX,
    PAQUET_PRESENTATIONS_FRACTIONS_DECIMAUX,
    PAQUET_CLASSES_VALEURS_FRACTIONS_DECIMAUX,
  ],
  notionsProduites: [NOTION_FRACTION_VERS_DECIMAL, NOTION_DECIMAL_VERS_FRACTION],
});

const PAR_ID = new Map([
  ...DEFINITIONS.map((definition) => [definition.id, definition]),
  [DEFINITION_FRACTIONS_SIMPLES_DECIMAUX_LEGACY.id,
    DEFINITION_FRACTIONS_SIMPLES_DECIMAUX_LEGACY],
]);
if (PAR_ID.size !== DEFINITIONS.length + 1) {
  throw new Error("le registre du lecteur contient un identifiant de notion dupliqué");
}

export function listerNotionsLecteur() {
  return [...DEFINITIONS];
}

export function connaitNotionLecteur(id) {
  return PAR_ID.has(id);
}

export function obtenirNotionLecteur(id) {
  const definition = PAR_ID.get(id);
  if (!definition) throw new RangeError(`notion inconnue : ${id}`);
  return definition;
}

// Configuration stable du menu Cycle 4 – DNB.
export const NIVEAUX_PARCOURS = Object.freeze(["5e", "4e", "3e", "DNB"]);
export const NIVEAU_PAR_DEFAUT = "DNB";

const NIVEAUX_CONNUS = new Set(NIVEAUX_PARCOURS);

export function estNiveauParcours(niveau) {
  return NIVEAUX_CONNUS.has(niveau);
}

// Icônes seedées et stables des quatre domaines du menu.
const GRAINES_DOMAINES = Object.freeze({
  nombres: 0x243f6a88,
  geometrie: 0x85a308d3,
  donnees: 0x13198a2e,
  informatique: 0x03707344,
});

export const ICONES_DOMAINES_MENU = Object.freeze({
  NOMBRES: "nombres",
  GEOMETRIE: "geometrie",
  DONNEES: "donnees",
  INFORMATIQUE: "informatique",
});

const CACHE_ICONES = new Map();

function hacherTexte(texte) {
  let valeur = 0x811c9dc5;
  for (const caractere of texte) {
    valeur ^= caractere.codePointAt(0);
    valeur = Math.imul(valeur, 0x01000193);
  }
  return valeur >>> 0;
}

export function graineIconesDomainesDuJour(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError("date invalide pour les icônes du menu");
  }
  const annee = String(date.getFullYear()).padStart(4, "0");
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return hacherTexte(`${annee}-${mois}-${jour}`);
}

function creerAleatoire(graine) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let valeur = etat;
    valeur = Math.imul(valeur ^ (valeur >>> 15), valeur | 1);
    valeur ^= valeur + Math.imul(valeur ^ (valeur >>> 7), valeur | 61);
    return ((valeur ^ (valeur >>> 14)) >>> 0) / 4294967296;
  };
}

function aleatoireDomaine(domaine, graine) {
  return creerAleatoire((graine ^ GRAINES_DOMAINES[domaine]) >>> 0);
}

function melanger(valeurs, aleatoire) {
  const resultat = valeurs.slice();
  for (let index = resultat.length - 1; index > 0; index -= 1) {
    const autre = Math.floor(aleatoire() * (index + 1));
    [resultat[index], resultat[autre]] = [resultat[autre], resultat[index]];
  }
  return resultat;
}

function rendreIconeNombres(graine) {
  const aleatoire = aleatoireDomaine(ICONES_DOMAINES_MENU.NOMBRES, graine);
  const emplacements = [9.5, 15, 20.5, 26];
  const lignes = [
    { y: 11.5, couleurs: ["#08aaa5", "#08aaa5", "#0b67b2"] },
    { y: 18, couleurs: ["#f58220", "#f58220", "#f58220"] },
    { y: 24.5, couleurs: ["#0b67b2", "#08aaa5", "#08aaa5"] },
  ];
  const trous = melanger([0, 1, 2, 3], aleatoire).slice(0, lignes.length);
  const boules = lignes.flatMap((ligne, indexLigne) => {
    const occupes = emplacements.filter((_, index) => index !== trous[indexLigne]);
    return occupes.map((x, index) =>
      `<circle cx="${x}" cy="${ligne.y}" r="2.55" fill="${ligne.couleurs[index]}"/>`);
  }).join("");
  return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#fffaf3" stroke="#173a5e" stroke-width="1.3"/><g fill="none" stroke="#aebfd1" stroke-width="1.2" stroke-linecap="round"><path d="M7.5 11.5h21M7.5 18h21M7.5 24.5h21"/></g><g stroke="#fffdf8" stroke-width=".72">${boules}</g></svg>`;
}

function rendreIconeDonnees(graine) {
  const aleatoire = aleatoireDomaine(ICONES_DOMAINES_MENU.DONNEES, graine);
  const hauteurs = melanger([8.5, 11, 14.5, 19], aleatoire);
  const couleurs = melanger(["#08aaa5", "#0b67b2", "#6553b8", "#f58220"], aleatoire);
  const abscisses = [8.5, 13.55, 18.6, 23.65];
  const barres = abscisses.map((x, index) => {
    const hauteur = hauteurs[index];
    return `<rect x="${x}" y="${28 - hauteur}" width="4.25" height="${hauteur}" rx=".8" fill="${couleurs[index]}"/>`;
  }).join("");
  return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#fffaf5" stroke="#173a5e" stroke-width="1.3"/><path d="M8 28h20" fill="none" stroke="#9eb0c2" stroke-width="1.1" stroke-linecap="round"/><g stroke="#fffdf8" stroke-width=".55">${barres}</g></svg>`;
}

function enumererTrajets(droite, haut, prefixe = "", trajets = []) {
  if (droite === 0 && haut === 0) {
    trajets.push(prefixe);
    return trajets;
  }
  if (droite > 0) enumererTrajets(droite - 1, haut, `${prefixe}D`, trajets);
  if (haut > 0) enumererTrajets(droite, haut - 1, `${prefixe}H`, trajets);
  return trajets;
}

function rendreIconeInformatique(graine) {
  const aleatoire = aleatoireDomaine(ICONES_DOMAINES_MENU.INFORMATIQUE, graine);
  const trajets = enumererTrajets(3, 3);
  const trajet = trajets[Math.floor(aleatoire() * trajets.length)];
  const chemin = `M9 27${[...trajet].map((mouvement) => mouvement === "D" ? "h6" : "v-6").join("")}`;
  return `<svg viewBox="0 0 36 36" focusable="false"><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#f5f4ff" stroke="#4f5fb3" stroke-width="1.3"/><g fill="none" stroke="#c7ccee" stroke-width=".72"><path d="M12 4v28M18 4v28M24 4v28M4 12h28M4 18h28M4 24h28"/></g><circle cx="8.8" cy="27" r="2.4" fill="#08aaa5" stroke="#087f78" stroke-width=".8"/><path d="${chemin}" fill="none" stroke="#6553b8" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 9V4.8" fill="none" stroke="#b95016" stroke-width="1.35" stroke-linecap="round"/><path d="M27 4.8h5.6L27 8.4Z" fill="#f58220" stroke="#b95016" stroke-width=".7" stroke-linejoin="round"/></svg>`;
}

function rendreIconeGeometrie(graine) {
  const aleatoire = aleatoireDomaine(ICONES_DOMAINES_MENU.GEOMETRIE, graine);
  const taille = 4;
  const cellule = 7;
  const origine = 4;
  const rayon = cellule / 2;
  const orientations = Array.from({ length: taille }, () =>
    Array.from({ length: taille }, () => aleatoire() < 0.5 ? "a" : "b"));

  const pairePour = (orientation, bord) => {
    const paires = orientation === "a"
      ? { H: "G", G: "H", D: "B", B: "D" }
      : { H: "D", D: "H", G: "B", B: "G" };
    return paires[bord];
  };
  const cheminPour = (ligne, colonne, orientation, bord) => {
    const x = origine + colonne * cellule;
    const y = origine + ligne * cellule;
    if (orientation === "a") {
      return bord === "H" || bord === "G"
        ? `M${x + rayon} ${y}A${rayon} ${rayon} 0 0 1 ${x} ${y + rayon}`
        : `M${x + cellule} ${y + rayon}A${rayon} ${rayon} 0 0 0 ${x + rayon} ${y + cellule}`;
    }
    return bord === "H" || bord === "D"
      ? `M${x + rayon} ${y}A${rayon} ${rayon} 0 0 0 ${x + cellule} ${y + rayon}`
      : `M${x} ${y + rayon}A${rayon} ${rayon} 0 0 1 ${x + rayon} ${y + cellule}`;
  };

  const cheminsBase = [];
  orientations.forEach((ligne, indexLigne) => ligne.forEach((orientation, indexColonne) => {
    cheminsBase.push(cheminPour(indexLigne, indexColonne, orientation, "H"));
    cheminsBase.push(cheminPour(indexLigne, indexColonne, orientation, orientation === "a" ? "D" : "G"));
  }));

  const departs = [];
  for (let index = 0; index < taille; index += 1) {
    departs.push(
      { ligne: 0, colonne: index, bord: "H" },
      { ligne: index, colonne: taille - 1, bord: "D" },
      { ligne: taille - 1, colonne: index, bord: "B" },
      { ligne: index, colonne: 0, bord: "G" },
    );
  }
  const suivre = (depart) => {
    const parcours = [];
    const visites = new Set();
    let courant = { ...depart };
    while (
      courant.ligne >= 0 && courant.ligne < taille
      && courant.colonne >= 0 && courant.colonne < taille
    ) {
      const orientation = orientations[courant.ligne][courant.colonne];
      const sortie = pairePour(orientation, courant.bord);
      const cle = `${courant.ligne}:${courant.colonne}:${[courant.bord, sortie].sort().join("")}`;
      if (visites.has(cle)) break;
      visites.add(cle);
      parcours.push(cheminPour(courant.ligne, courant.colonne, orientation, courant.bord));
      if (sortie === "H") courant = { ligne: courant.ligne - 1, colonne: courant.colonne, bord: "B" };
      if (sortie === "D") courant = { ligne: courant.ligne, colonne: courant.colonne + 1, bord: "G" };
      if (sortie === "B") courant = { ligne: courant.ligne + 1, colonne: courant.colonne, bord: "H" };
      if (sortie === "G") courant = { ligne: courant.ligne, colonne: courant.colonne - 1, bord: "D" };
    }
    return parcours;
  };
  const decalage = Math.floor(aleatoire() * departs.length);
  const departsOrdonnes = departs.slice(decalage).concat(departs.slice(0, decalage));
  const cheminOrange = departsOrdonnes
    .map(suivre)
    .reduce((plusLong, parcours) => parcours.length > plusLong.length ? parcours : plusLong, []);
  const idMasque = `mathsgo-truchet-${graine.toString(16)}`;
  const base = cheminsBase.map((d) => `<path d="${d}"/>`).join("");
  const orange = cheminOrange.map((d) => `<path d="${d}"/>`).join("");
  return `<svg viewBox="0 0 36 36" focusable="false"><defs><clipPath id="${idMasque}"><rect x="4" y="4" width="28" height="28" rx="4"/></clipPath></defs><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="#f4fbfa"/><g clip-path="url(#${idMasque})"><g fill="none" stroke="#167f7b" stroke-width="1.2" stroke-linecap="round">${base}</g><g fill="none" stroke="#f58220" stroke-width="2" stroke-linecap="round">${orange}</g></g><rect x="3.5" y="3.5" width="29" height="29" rx="4.5" fill="none" stroke="#173a5e" stroke-width="1.3"/></svg>`;
}

export function rendreIconeDomaineMenu(domaine, graine = graineIconesDomainesDuJour()) {
  if (!Object.values(ICONES_DOMAINES_MENU).includes(domaine)) {
    throw new RangeError(`domaine d'icône inconnu : ${domaine}`);
  }
  if (!Number.isInteger(graine) || graine < 0 || graine > 0xffffffff) {
    throw new RangeError("graine d'icône invalide");
  }
  const cle = `${domaine}:${graine}`;
  if (CACHE_ICONES.has(cle)) return CACHE_ICONES.get(cle);
  const generateurs = {
    [ICONES_DOMAINES_MENU.NOMBRES]: rendreIconeNombres,
    [ICONES_DOMAINES_MENU.GEOMETRIE]: rendreIconeGeometrie,
    [ICONES_DOMAINES_MENU.DONNEES]: rendreIconeDonnees,
    [ICONES_DOMAINES_MENU.INFORMATIQUE]: rendreIconeInformatique,
  };
  const rendu = generateurs[domaine](graine);
  CACHE_ICONES.set(cle, rendu);
  return rendu;
}

// Catalogue visible du menu, adossé au registre canonique des notions.
const NIVEAUX_CYCLE_4_DNB = Object.freeze(["5e", "4e", "3e", "DNB"]);

export const LIBELLES_MODULES_MENU = Object.freeze({
  [NOTION_NC01]: Object.freeze({
    titre: "Critères de divisibilité",
    precision: "Par 2, 3, 5, 9 et 10",
    niveaux: NIVEAUX_CYCLE_4_DNB,
  }),
  [NOTION_NC02]: Object.freeze({
    titre: "Carrés des entiers",
    precision: "De 0 à 12",
    niveaux: NIVEAUX_CYCLE_4_DNB,
  }),
  [NOTION_FRACTION_VERS_DECIMAL]: Object.freeze({
    titre: "Fraction → écriture décimale",
    precision: "Lire une fraction simple ou décimale",
    niveaux: NIVEAUX_CYCLE_4_DNB,
  }),
  [NOTION_DECIMAL_VERS_FRACTION]: Object.freeze({
    titre: "Écriture décimale → fraction",
    precision: "Écrire une fraction équivalente",
    niveaux: NIVEAUX_CYCLE_4_DNB,
  }),
  [NOTION_ECRITURES_MULTIPLES_NOMBRE]: Object.freeze({
    titre: "Un nombre, plusieurs écritures",
    precision: "Décimal, fraction et pourcentage",
    niveaux: NIVEAUX_CYCLE_4_DNB,
  }),
  [NOTION_DROITE_GRADUEE]: Object.freeze({
    titre: "Droite graduée",
    precision: "Lire une abscisse et placer un point",
    niveaux: NIVEAUX_CYCLE_4_DNB,
  }),
  [NOTION_LIRE_COORDONNEES_POINT]: Object.freeze({
    titre: "Lire les coordonnées d'un point",
    precision: "Abscisse, ordonnée et couple",
    niveaux: NIVEAUX_CYCLE_4_DNB,
  }),
  [NOTION_PLACER_POINT_REPERE]: Object.freeze({
    titre: "Placer un point dans un repère",
    precision: "Coordonnées entières",
    niveaux: NIVEAUX_CYCLE_4_DNB,
  }),
});

export const DOMAINES_MENU = Object.freeze([
  Object.freeze({
    id: "numbers",
    nom: "Nombres et calculs",
    icone: ICONES_DOMAINES_MENU.NOMBRES,
    domainesInternes: Object.freeze([
      DOMAINES_AUTOMATISMES.NC,
      DOMAINES_AUTOMATISMES.AL,
    ]),
    notions: Object.freeze([
      NOTION_NC01,
      NOTION_NC02,
      NOTION_FRACTION_VERS_DECIMAL,
      NOTION_DECIMAL_VERS_FRACTION,
      NOTION_ECRITURES_MULTIPLES_NOMBRE,
    ]),
  }),
  Object.freeze({
    id: "geometry",
    nom: "Espace et géométrie",
    icone: ICONES_DOMAINES_MENU.GEOMETRIE,
    domainesInternes: Object.freeze([
      DOMAINES_AUTOMATISMES.GE,
      DOMAINES_AUTOMATISMES.GM,
    ]),
    notions: Object.freeze([
      NOTION_DROITE_GRADUEE,
      NOTION_LIRE_COORDONNEES_POINT,
      NOTION_PLACER_POINT_REPERE,
    ]),
  }),
  Object.freeze({
    id: "data",
    nom: "Données, statistiques et probabilités",
    icone: ICONES_DOMAINES_MENU.DONNEES,
    domainesInternes: Object.freeze([
      DOMAINES_AUTOMATISMES.DS,
      DOMAINES_AUTOMATISMES.PF,
    ]),
    notions: Object.freeze([]),
  }),
  Object.freeze({
    id: "algorithm",
    nom: "Pensée informatique",
    icone: ICONES_DOMAINES_MENU.INFORMATIQUE,
    domainesInternes: Object.freeze([DOMAINES_AUTOMATISMES.PI]),
    notions: Object.freeze([]),
  }),
]);

export function notionsVisiblesPourNiveau(niveau) {
  if (!NIVEAUX_PARCOURS.includes(niveau)) {
    throw new RangeError(`niveau de menu inconnu : ${niveau}`);
  }
  return DOMAINES_MENU
    .flatMap(({ notions }) => notions)
    .filter((notion) => LIBELLES_MODULES_MENU[notion].niveaux.includes(niveau));
}

export function domainesMenuPourNiveau(niveau) {
  const visibles = new Set(notionsVisiblesPourNiveau(niveau));
  return DOMAINES_MENU.map((domaine) => Object.freeze({
    ...domaine,
    notions: Object.freeze(domaine.notions.filter((notion) => visibles.has(notion))),
  }));
}
