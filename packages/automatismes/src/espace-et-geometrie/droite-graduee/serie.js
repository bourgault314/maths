import { creerGenerateur, validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=42";
import {
  FAMILLE_DETERMINER_PAS,
  FAMILLE_DIAGNOSTIC,
  FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT,
  GABARIT_DROITE_GRADUEE,
  VARIANTE_DEUX_POINTS_QCM,
  VARIANTE_DIRECTE,
  VARIANTE_LECTURE_QCM,
  VARIANTE_PAS_QCM,
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

// La rotation fait rencontrer toute la gamme : dixièmes, quarts, demis,
// unités, petits multiples et grandes échelles de brevet.
const PAS = Object.freeze([
  [1, 10], [1, 4], [1, 2], [1, 1], [2, 1],
  [5, 1], [10, 1], [20, 1], [25, 1], [50, 1],
]);
const NOMS = Object.freeze(["A", "B", "C", "D", "M", "N", "P"]);

function gabaritAvec(parametres) { return { ...GABARIT_DROITE_GRADUEE, parametres }; }

function departMultiple({ index, nombreIntervalles, aleatoire, grandPas }) {
  const mode = index % 4;
  if (mode === 0) return -aleatoire.entier(2, Math.max(2, nombreIntervalles - 3)); // zéro visible et décentré
  if (mode === 1) return aleatoire.entier(1, grandPas ? 3 : 8); // tout positif
  if (mode === 2) return -(nombreIntervalles + aleatoire.entier(1, grandPas ? 3 : 8)); // tout négatif
  return aleatoire.entier(2, grandPas ? 5 : 12); // origine hors cadre
}

function choisirEtiquettes({ famille, nombreIntervalles, aleatoire }) {
  const separationMin = famille === FAMILLE_DETERMINER_PAS ? 3 : 2;
  const candidats = [];
  for (let gauche = 0; gauche <= nombreIntervalles - separationMin; gauche += 1) {
    for (let droite = gauche + separationMin; droite <= nombreIntervalles; droite += 1) {
      if (droite - gauche <= 5) candidats.push([gauche, droite]);
    }
  }
  return aleatoire.choix(candidats);
}

function choisirCible({ nombreIntervalles, etiquettes, aleatoire }) {
  const candidats = Array.from({ length: nombreIntervalles + 1 }, (_, indice) => indice)
    .filter((indice) => !etiquettes.includes(indice));
  return aleatoire.choix(candidats);
}

function choisirVariante(famille, index) {
  if (famille === FAMILLE_DETERMINER_PAS) return index >= 10 ? VARIANTE_PAS_QCM : VARIANTE_DIRECTE;
  if (famille === FAMILLE_DIAGNOSTIC) return index >= 15 ? VARIANTE_DEUX_POINTS_QCM : VARIANTE_LECTURE_QCM;
  return VARIANTE_DIRECTE;
}

export function planifierSerieDroiteGraduee({ graine, nombreQuestions = 10 }) {
  validerGraine(graine);
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 20) throw new RangeError("serie droite-graduee : longueur entre 1 et 20 requise");
  const aleatoire = creerGenerateur(`droite-graduee-plan-v2:${graine}:${nombreQuestions}`);
  const decalage = aleatoire.entier(0, PAS.length - 1);
  return FAMILLES.slice(0, nombreQuestions).map((famille, index) => {
    const [pasNumerateur, pasDenominateur] = PAS[(index + decalage) % PAS.length];
    const nombreIntervalles = aleatoire.entier(7, 9);
    const departUnitesDePas = departMultiple({ index: index + decalage, nombreIntervalles, aleatoire, grandPas: pasNumerateur >= 10 });
    let departNumerateur = departUnitesDePas * pasNumerateur;
    // Quelques entiers sont affichés autour de 70 : l’élève ne doit pas chercher systématiquement zéro.
    if (pasNumerateur === 1 && pasDenominateur === 1 && (index + decalage) % 6 === 5) departNumerateur += 70;
    const etiquettes = choisirEtiquettes({ famille, nombreIntervalles, aleatoire });
    const indiceCible = choisirCible({ nombreIntervalles, etiquettes, aleatoire });
    const candidatsSecondPoint = Array.from({ length: nombreIntervalles + 1 }, (_, indice) => indice)
      .filter((indice) => indice !== indiceCible && !etiquettes.includes(indice));
    const indiceSecondPoint = aleatoire.choix(candidatsSecondPoint);
    const nomPoint = NOMS[(index + decalage) % NOMS.length];
    const nomSecondPoint = NOMS[(index + decalage + 3) % NOMS.length];
    return {
      famille,
      variante: choisirVariante(famille, index),
      departNumerateur,
      departDenominateur: pasDenominateur,
      pasNumerateur,
      pasDenominateur,
      nombreIntervalles,
      etiquettes,
      indiceCible,
      nomPoint,
      positionPoint: (index + decalage) % 2 === 0 ? "dessus" : "dessous",
      indiceSecondPoint,
      nomSecondPoint,
      decalageChoix: (index + decalage) % 4,
    };
  });
}

export function genererSerieDroiteGraduee({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") throw new TypeError("serie droite-graduee : registre requis");
  return planifierSerieDroiteGraduee({ graine, nombreQuestions })
    .map((parametres, index) => registre.instancier(gabaritAvec(parametres), `${graine}:${index + 1}`));
}
