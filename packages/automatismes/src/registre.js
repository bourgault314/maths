import { creerRegistre } from "../../moteur-exercices/src/generation.js";
import { GENERATEUR_RECONNAISSANCE_SOLIDES } from "./espace-et-geometrie/solides-usuels/reconnaissance.js?v=9";
import {
  GENERATEUR_VOLUME_CUBE_PAVE,
  GENERATEUR_VOLUME_CYLINDRE,
  GENERATEUR_VOLUME_PRISME,
} from "./grandeurs-et-mesures/volumes/calcul-volumes.js?v=9";
import { GENERATEUR_AFFIRMATION_DIVISIBILITE } from "./nombres-et-calculs/criteres-divisibilite/affirmation-divisibilite.js?v=9";
import { GENERATEUR_CHIFFRE_MANQUANT } from "./nombres-et-calculs/criteres-divisibilite/chiffre-manquant.js?v=9";
import { GENERATEUR_CRITERE_PRECIS } from "./nombres-et-calculs/criteres-divisibilite/critere-precis.js?v=9";
import { GENERATEUR_PARTAGE_COURT } from "./nombres-et-calculs/criteres-divisibilite/partage-court.js?v=9";
import { GENERATEUR_SELECTION_DIVISEURS } from "./nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js?v=9";
import { GENERATEUR_SELECTION_NOMBRES } from "./nombres-et-calculs/criteres-divisibilite/selection-nombres.js?v=9";

/**
 * Crée le registre des seuls générateurs pédagogiques V2 déjà construits.
 * Un contenu non enregistré ici ne peut pas être instancié par l'application.
 */
export function creerRegistreAutomatismes() {
  const registre = creerRegistre();
  registre.enregistrer(GENERATEUR_CRITERE_PRECIS);
  registre.enregistrer(GENERATEUR_SELECTION_DIVISEURS);
  registre.enregistrer(GENERATEUR_SELECTION_NOMBRES);
  registre.enregistrer(GENERATEUR_AFFIRMATION_DIVISIBILITE);
  registre.enregistrer(GENERATEUR_CHIFFRE_MANQUANT);
  registre.enregistrer(GENERATEUR_PARTAGE_COURT);
  registre.enregistrer(GENERATEUR_RECONNAISSANCE_SOLIDES);
  registre.enregistrer(GENERATEUR_VOLUME_CUBE_PAVE);
  registre.enregistrer(GENERATEUR_VOLUME_PRISME);
  registre.enregistrer(GENERATEUR_VOLUME_CYLINDRE);
  return registre;
}
