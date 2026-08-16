import { creerRegistre } from "../../moteur-exercices/src/generation.js?v=38";
import { GENERATEUR_RECONNAISSANCE_SOLIDES } from "./espace-et-geometrie/solides-usuels/reconnaissance.js?v=38";
import {
  GENERATEUR_VOLUME_CUBE_PAVE,
  GENERATEUR_VOLUME_CYLINDRE,
  GENERATEUR_VOLUME_PRISME,
} from "./grandeurs-et-mesures/volumes/calcul-volumes.js?v=38";
import { GENERATEUR_CHIFFRE_MANQUANT } from "./nombres-et-calculs/criteres-divisibilite/chiffre-manquant.js?v=38";
import { GENERATEUR_CRITERE_PRECIS } from "./nombres-et-calculs/criteres-divisibilite/critere-precis.js?v=38";
import { GENERATEUR_PARTAGE_COURT } from "./nombres-et-calculs/criteres-divisibilite/partage-court.js?v=38";
import { GENERATEUR_SELECTION_DIVISEURS } from "./nombres-et-calculs/criteres-divisibilite/selection-diviseurs.js?v=38";
import { GENERATEUR_SELECTION_NOMBRES } from "./nombres-et-calculs/criteres-divisibilite/selection-nombres.js?v=38";
import { GENERATEUR_CALCUL_COURT_CARRE } from "./nombres-et-calculs/carres-entiers-1-a-12/calcul-court.js?v=38";
import { GENERATEUR_CALCUL_DIRECT_CARRE } from "./nombres-et-calculs/carres-entiers-1-a-12/calcul-direct.js?v=38";
import { GENERATEUR_CARRE_QUADRILLE } from "./nombres-et-calculs/carres-entiers-1-a-12/carre-quadrille.js?v=38";
import { GENERATEUR_RECONNAITRE_CARRES } from "./nombres-et-calculs/carres-entiers-1-a-12/reconnaitre-carres.js?v=38";
import { GENERATEUR_RETROUVER_ENTIER_CARRE } from "./nombres-et-calculs/carres-entiers-1-a-12/retrouver-entier.js?v=38";
import { GENERATEUR_SENS_NOTATION_CARRE } from "./nombres-et-calculs/carres-entiers-1-a-12/sens-notation.js?v=38";
import { GENERATEUR_DECIMAL_VERS_FRACTION } from "./nombres-et-calculs/fractions-simples-decimaux/decimal-vers-fraction.js?v=38";
import { GENERATEUR_FRACTION_VERS_DECIMAL } from "./nombres-et-calculs/fractions-simples-decimaux/fraction-vers-decimal.js?v=38";

/**
 * Crée le registre des seuls générateurs pédagogiques V2 déjà construits.
 * Un contenu non enregistré ici ne peut pas être instancié par l'application.
 */
export function creerRegistreAutomatismes() {
  const registre = creerRegistre();
  registre.enregistrer(GENERATEUR_CRITERE_PRECIS);
  registre.enregistrer(GENERATEUR_SELECTION_DIVISEURS);
  registre.enregistrer(GENERATEUR_SELECTION_NOMBRES);
  registre.enregistrer(GENERATEUR_CHIFFRE_MANQUANT);
  registre.enregistrer(GENERATEUR_PARTAGE_COURT);
  registre.enregistrer(GENERATEUR_CALCUL_DIRECT_CARRE);
  registre.enregistrer(GENERATEUR_RETROUVER_ENTIER_CARRE);
  registre.enregistrer(GENERATEUR_SENS_NOTATION_CARRE);
  registre.enregistrer(GENERATEUR_RECONNAITRE_CARRES);
  registre.enregistrer(GENERATEUR_CARRE_QUADRILLE);
  registre.enregistrer(GENERATEUR_CALCUL_COURT_CARRE);
  registre.enregistrer(GENERATEUR_FRACTION_VERS_DECIMAL);
  registre.enregistrer(GENERATEUR_DECIMAL_VERS_FRACTION);
  registre.enregistrer(GENERATEUR_RECONNAISSANCE_SOLIDES);
  registre.enregistrer(GENERATEUR_VOLUME_CUBE_PAVE);
  registre.enregistrer(GENERATEUR_VOLUME_PRISME);
  registre.enregistrer(GENERATEUR_VOLUME_CYLINDRE);
  return registre;
}
