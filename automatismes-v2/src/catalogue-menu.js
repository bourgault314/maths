import { DOMAINES_AUTOMATISMES } from "../../packages/automatismes/src/identifiants.js?v=49";
import {
  NOTION_DECIMAL_VERS_FRACTION,
  NOTION_DROITE_GRADUEE,
  NOTION_ECRITURES_MULTIPLES_NOMBRE,
  NOTION_FRACTION_VERS_DECIMAL,
  NOTION_LIRE_COORDONNEES_POINT,
  NOTION_NC01,
  NOTION_NC02,
  NOTION_PLACER_POINT_REPERE,
} from "./registre-lecteur.js?v=49";
import { ICONES_DOMAINES_MENU } from "./icones-domaines-menu.js?v=49";
import { NIVEAUX_PARCOURS } from "./niveaux-parcours.js?v=49";

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
