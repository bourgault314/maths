import { GABARIT_RECONNAISSANCE_SOLIDES } from "../../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=35";
import {
  GABARIT_VOLUME_CUBE_PAVE,
  GABARIT_VOLUME_CYLINDRE,
  GABARIT_VOLUME_PRISME,
} from "../../packages/automatismes/src/grandeurs-et-mesures/volumes/calcul-volumes.js?v=35";
import { GABARIT_SELECTION_DIVISEURS } from "../../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js?v=35";
import { genererSerieNC01 } from "../../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/serie.js?v=35";
import { GABARIT_CALCUL_DIRECT_CARRE } from "../../packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/calcul-direct.js?v=35";
import { genererSerieNC02 } from "../../packages/automatismes/src/nombres-et-calculs/carres-entiers-1-a-12/serie.js?v=35";
import {
  GABARIT_FRACTION_VERS_DECIMAL,
} from "../../packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/fraction-vers-decimal.js?v=35";
import {
  genererSerieFractionsDecimaux,
} from "../../packages/automatismes/src/nombres-et-calculs/fractions-simples-decimaux/serie.js?v=35";
import {
  MODULES_AUTOMATISMES,
} from "../../packages/automatismes/src/identifiants.js?v=35";

export const NOTION_NC01 = MODULES_AUTOMATISMES.CRITERES_DIVISIBILITE;
export const NOTION_NC02 = MODULES_AUTOMATISMES.CARRES_ENTIERS;
export const NOTION_FRACTIONS_SIMPLES_DECIMAUX =
  MODULES_AUTOMATISMES.FRACTIONS_SIMPLES_DECIMAUX;
export const NOTION_SOLIDES_USUELS = MODULES_AUTOMATISMES.SOLIDES_USUELS;
export const NOTION_VOLUME_CUBE_PAVE = MODULES_AUTOMATISMES.VOLUME_CUBE_PAVE;
export const NOTION_VOLUME_PRISME = MODULES_AUTOMATISMES.VOLUME_PRISME;
export const NOTION_VOLUME_CYLINDRE = MODULES_AUTOMATISMES.VOLUME_CYLINDRE;

export const RENDU_DIVISIBILITE = "divisibilite";
export const RENDU_CARRES = "carres";
export const RENDU_FRACTIONS_DECIMAUX = "fractions-decimaux";
export const RENDU_SOLIDE = "solide";
export const RENDU_VOLUME = "volume";

const RENDUS = new Set([
  RENDU_DIVISIBILITE,
  RENDU_CARRES,
  RENDU_FRACTIONS_DECIMAUX,
  RENDU_SOLIDE,
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
  creerSerie = null,
  nombreQuestionsMaximum = 100,
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
  if (creerSerie !== null && typeof creerSerie !== "function") {
    throw new TypeError(`fabrique de série invalide : ${id}`);
  }
  if (
    !Number.isInteger(nombreQuestionsMaximum)
    || nombreQuestionsMaximum < 1
    || nombreQuestionsMaximum > 100
  ) {
    throw new RangeError(`capacité de série invalide : ${id}`);
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
  }),
  definirNotion({
    id: NOTION_FRACTIONS_SIMPLES_DECIMAUX,
    nom: "Fractions simples et décimaux",
    gabarit: GABARIT_FRACTION_VERS_DECIMAL,
    rendu: RENDU_FRACTIONS_DECIMAUX,
    graineApercu: "apercu-nc03-nc04-complet",
    cours: true,
    pagesCours: 6,
    creerSerie: genererSerieFractionsDecimaux,
    nombreQuestionsMaximum: 20,
  }),
  definirNotion({
    id: NOTION_SOLIDES_USUELS,
    nom: "Solides usuels",
    gabarit: GABARIT_RECONNAISSANCE_SOLIDES,
    rendu: RENDU_SOLIDE,
    cours: true,
    rotationSolide: true,
  }),
  definirNotion({
    id: NOTION_VOLUME_CUBE_PAVE,
    nom: "Volumes — cube et pavé",
    gabarit: GABARIT_VOLUME_CUBE_PAVE,
    rendu: RENDU_VOLUME,
    cours: true,
    rotationSolide: true,
  }),
  definirNotion({
    id: NOTION_VOLUME_PRISME,
    nom: "Volumes — prisme droit",
    gabarit: GABARIT_VOLUME_PRISME,
    rendu: RENDU_VOLUME,
    cours: true,
    rotationSolide: true,
  }),
  definirNotion({
    id: NOTION_VOLUME_CYLINDRE,
    nom: "Volumes — cylindre",
    gabarit: GABARIT_VOLUME_CYLINDRE,
    rendu: RENDU_VOLUME,
    cours: true,
    rotationSolide: true,
  }),
]);

const PAR_ID = new Map(DEFINITIONS.map((definition) => [definition.id, definition]));
if (PAR_ID.size !== DEFINITIONS.length) {
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
