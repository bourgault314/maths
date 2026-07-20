import {
  RENDU_DIVISIBILITE as TYPE_DIVISIBILITE,
  RENDU_SOLIDE as TYPE_SOLIDE,
  RENDU_VOLUME as TYPE_VOLUME,
} from "../registre-lecteur.js?v=7";
import { RENDU_DIVISIBILITE } from "./divisibilite.js?v=7";
import { RENDU_SOLIDE } from "./solide.js?v=7";
import { RENDU_VOLUME } from "./volume.js?v=7";

const METHODES_OBLIGATOIRES = ["question", "aide", "correction"];

function verifierRendu(type, rendu) {
  if (!rendu || typeof rendu !== "object") {
    throw new TypeError(`rendu invalide : ${type}`);
  }
  for (const methode of METHODES_OBLIGATOIRES) {
    if (typeof rendu[methode] !== "function") {
      throw new TypeError(`méthode ${methode} absente du rendu ${type}`);
    }
  }
  if (rendu.cours !== undefined && typeof rendu.cours !== "function") {
    throw new TypeError(`méthode cours invalide dans le rendu ${type}`);
  }
  return rendu;
}

const RENDUS = new Map([
  [TYPE_DIVISIBILITE, verifierRendu(TYPE_DIVISIBILITE, RENDU_DIVISIBILITE)],
  [TYPE_SOLIDE, verifierRendu(TYPE_SOLIDE, RENDU_SOLIDE)],
  [TYPE_VOLUME, verifierRendu(TYPE_VOLUME, RENDU_VOLUME)],
]);

export function obtenirRenduLecteur(type) {
  const rendu = RENDUS.get(type);
  if (!rendu) throw new RangeError(`rendu absent : ${type}`);
  return rendu;
}

export function listerTypesRendus() {
  return [...RENDUS.keys()];
}
