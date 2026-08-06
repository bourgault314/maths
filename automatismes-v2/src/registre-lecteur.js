import { GABARIT_RECONNAISSANCE_SOLIDES } from "../../packages/automatismes/src/espace-et-geometrie/solides-usuels/reconnaissance.js?v=10";
import {
  GABARIT_VOLUME_CUBE_PAVE,
  GABARIT_VOLUME_CYLINDRE,
  GABARIT_VOLUME_PRISME,
} from "../../packages/automatismes/src/grandeurs-et-mesures/volumes/calcul-volumes.js?v=10";
import { GABARIT_SELECTION_DIVISEURS } from "../../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js?v=10";
import { genererSerieNC01 } from "../../packages/automatismes/src/nombres-et-calculs/criteres-divisibilite/serie.js?v=10";

export const NOTION_NC01 = "criteres-divisibilite";
export const NOTION_SOLIDES_USUELS = "solides-usuels";
export const NOTION_VOLUME_CUBE_PAVE = "volume-cube-pave";
export const NOTION_VOLUME_PRISME = "volume-prisme";
export const NOTION_VOLUME_CYLINDRE = "volume-cylindre";

export const RENDU_DIVISIBILITE = "divisibilite";
export const RENDU_SOLIDE = "solide";
export const RENDU_VOLUME = "volume";

const RENDUS = new Set([
  RENDU_DIVISIBILITE,
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
  aideChiffres = false,
  rotationSolide = false,
  creerSerie = null,
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
  if (creerSerie !== null && typeof creerSerie !== "function") {
    throw new TypeError(`fabrique de série invalide : ${id}`);
  }
  return Object.freeze({
    id,
    nom,
    gabarit,
    rendu,
    graineApercu,
    capacites: Object.freeze({ cours, aideChiffres, rotationSolide }),
    creerSerie,
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
    aideChiffres: true,
    creerSerie: genererSerieNC01,
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
