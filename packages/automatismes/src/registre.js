import { creerRegistre } from "../../moteur-exercices/src/generation.js";
import { GENERATEUR_RECONNAISSANCE_SOLIDES } from "./espace-et-geometrie/solides-usuels/reconnaissance.js?v=5";
import {
  GENERATEUR_VOLUME_CUBE_PAVE,
  GENERATEUR_VOLUME_CYLINDRE,
  GENERATEUR_VOLUME_PRISME,
} from "./grandeurs-et-mesures/volumes/calcul-volumes.js?v=5";
import { GENERATEUR_SELECTION_DIVISEURS } from "./nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js";

/**
 * Crée le registre des seuls générateurs pédagogiques V2 déjà construits.
 * Un contenu non enregistré ici ne peut pas être instancié par l'application.
 */
export function creerRegistreAutomatismes() {
  const registre = creerRegistre();
  registre.enregistrer(GENERATEUR_SELECTION_DIVISEURS);
  registre.enregistrer(GENERATEUR_RECONNAISSANCE_SOLIDES);
  registre.enregistrer(GENERATEUR_VOLUME_CUBE_PAVE);
  registre.enregistrer(GENERATEUR_VOLUME_PRISME);
  registre.enregistrer(GENERATEUR_VOLUME_CYLINDRE);
  return registre;
}
