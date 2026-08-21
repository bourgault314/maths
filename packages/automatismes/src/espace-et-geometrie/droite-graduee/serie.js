import { creerGenerateur, validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=42";
import {
  FAMILLE_DETERMINER_PAS,
  FAMILLE_DIAGNOSTIC,
  FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT,
  GABARIT_DROITE_GRADUEE,
} from "./questions.js?v=42";

export const QUOTAS_DROITE_GRADUEE = Object.freeze({
  5: Object.freeze({ lire: 2, placer: 2, pas: 1, diagnostic: 0 }),
  10: Object.freeze({ lire: 4, placer: 4, pas: 1, diagnostic: 1 }),
  15: Object.freeze({ lire: 6, placer: 6, pas: 2, diagnostic: 1 }),
  20: Object.freeze({ lire: 8, placer: 8, pas: 2, diagnostic: 2 }),
});

const FAMILLES = Object.freeze([
  FAMILLE_LIRE_ABSCISSE, FAMILLE_PLACER_POINT, FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT, FAMILLE_DETERMINER_PAS, FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT, FAMILLE_LIRE_ABSCISSE, FAMILLE_PLACER_POINT,
  FAMILLE_DIAGNOSTIC, FAMILLE_LIRE_ABSCISSE, FAMILLE_PLACER_POINT,
  FAMILLE_DETERMINER_PAS, FAMILLE_LIRE_ABSCISSE, FAMILLE_PLACER_POINT,
  FAMILLE_LIRE_ABSCISSE, FAMILLE_PLACER_POINT, FAMILLE_DIAGNOSTIC,
  FAMILLE_LIRE_ABSCISSE, FAMILLE_PLACER_POINT,
]);
const PAS = Object.freeze([
  [1, 1], [1, 2], [1, 4], [1, 10], [10, 1], [50, 1],
  [1, 2], [1, 10], [1, 4], [1, 1], [10, 1], [1, 2],
  [50, 1], [1, 4], [1, 10], [1, 1], [10, 1], [1, 2], [1, 4], [50, 1],
]);
const DEPARTS_UNITES = Object.freeze([-4, -8, -20, -75, 5, -2, -30, 12]);

function gabaritAvec(parametres) { return { ...GABARIT_DROITE_GRADUEE, parametres }; }

export function planifierSerieDroiteGraduee({ graine, nombreQuestions = 10 }) {
  validerGraine(graine);
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 20) throw new RangeError("serie droite-graduee : longueur entre 1 et 20 requise");
  const aleatoire = creerGenerateur(`droite-graduee-plan-v1:${graine}:${nombreQuestions}`);
  const decalage = aleatoire.entier(0, PAS.length - 1);
  return FAMILLES.slice(0, nombreQuestions).map((famille, index) => {
    const [pasNumerateur, pasDenominateur] = PAS[(index + decalage) % PAS.length];
    const nombreIntervalles = aleatoire.entier(6, 9);
    const origine = DEPARTS_UNITES[(index + decalage) % DEPARTS_UNITES.length];
    const departNumerateur = origine * pasDenominateur;
    const etiquettes = aleatoire.melange([0, 1, 2, 3, nombreIntervalles - 2, nombreIntervalles - 1, nombreIntervalles]).slice(0, 2).sort((a, b) => a - b);
    if (etiquettes[0] === etiquettes[1]) etiquettes[1] = nombreIntervalles;
    const candidats = Array.from({ length: nombreIntervalles + 1 }, (_, i) => i).filter((i) => !etiquettes.includes(i));
    const indiceCible = aleatoire.choix(candidats);
    return {
      famille,
      departNumerateur,
      departDenominateur: pasDenominateur,
      pasNumerateur,
      pasDenominateur,
      nombreIntervalles,
      etiquettes,
      indiceCible,
      nomPoint: ["A", "B", "C", "D", "M", "N", "P"][(index + decalage) % 7],
    };
  });
}

export function genererSerieDroiteGraduee({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") throw new TypeError("serie droite-graduee : registre requis");
  return planifierSerieDroiteGraduee({ graine, nombreQuestions }).map((parametres, index) => registre.instancier(gabaritAvec(parametres), `${graine}:${index + 1}`));
}

