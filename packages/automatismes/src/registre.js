import { creerRegistre } from "../../moteur-exercices/src/generation.js";
import { GENERATEUR_SELECTION_DIVISEURS } from "./nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js";

/**
 * Crée le registre des seuls générateurs pédagogiques V2 déjà construits.
 * Un contenu non enregistré ici ne peut pas être instancié par l'application.
 */
export function creerRegistreAutomatismes() {
  const registre = creerRegistre();
  registre.enregistrer(GENERATEUR_SELECTION_DIVISEURS);
  return registre;
}
