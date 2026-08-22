import { creerGenerateur, validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=50";
import {
  FAMILLE_DETERMINER_PAS,
  FAMILLE_DIAGNOSTIC,
  FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT,
  GABARIT_DROITE_GRADUEE,
  VARIANTE_DEUX_POINTS_QCM,
  VARIANTE_DIRECTE,
  VARIANTE_FRACTION_QCM,
  VARIANTE_LECTURE_QCM,
  VARIANTE_PAS_QCM,
} from "./questions.js?v=50";

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

// Une séance mélangée peut n'attribuer que 1, 2 ou 5 questions à ce module.
// Les vingt profils forment donc UNE progression continue : le préfixe reste
// représentatif et accessible, tandis que les cas plus chargés arrivent plus
// tard. La graine varie les valeurs à l'intérieur du profil, pas sa difficulté.
const PROFILS = Object.freeze([
  { pas: [1, 1], origine: "zero-reference" },
  { pas: [2, 1], origine: "zero-reference" },
  { pas: [5, 1], origine: "zero-reference" },
  { pas: [1, 2], origine: "zero-reference" },
  { pas: [10, 1], origine: "zero-reference" },
  { pas: [1, 1], origine: "zero-visible" },
  { pas: [1, 10], origine: "zero-reference" },
  { pas: [20, 1], origine: "zero-visible" },
  { pas: [1, 4], origine: "fraction-positive", notation: "fraction" },
  { pas: [1, 2], origine: "references-libres" },
  { pas: [1, 4], origine: "fraction-positive", notation: "fraction" },
  { pas: [5, 1], origine: "positive" },
  { pas: [25, 1], origine: "references-libres" },
  { pas: [1, 10], origine: "negative" },
  { pas: [2, 1], origine: "hors-zero" },
  { pas: [50, 1], origine: "references-libres" },
  { pas: [20, 1], origine: "negative" },
  { pas: [1, 2], origine: "hors-zero" },
  { pas: [1, 4], origine: "fraction-negative", notation: "fraction" },
  { pas: [50, 1], origine: "hors-zero" },
]);
const NOMS = Object.freeze(["A", "B", "C", "D", "M", "N", "P"]);

function gabaritAvec(parametres) { return { ...GABARIT_DROITE_GRADUEE, parametres }; }

function departMultiple({ origine, nombreIntervalles, aleatoire, grandPas }) {
  if (["zero-reference", "zero-visible", "fraction-negative"].includes(origine)) {
    return -aleatoire.entier(2, nombreIntervalles - 2);
  }
  if (origine === "fraction-positive") return 0;
  if (origine === "positive") return aleatoire.entier(1, grandPas ? 3 : 8);
  if (origine === "negative") return -(nombreIntervalles + aleatoire.entier(1, grandPas ? 3 : 8));
  return aleatoire.entier(2, grandPas ? 5 : 12);
}

function choisirEtiquettes({ famille, nombreIntervalles, aleatoire, origine, departUnitesDePas }) {
  const indiceZero = -departUnitesDePas;
  if (origine === "zero-reference" || origine === "fraction-negative") {
    const candidats = Array.from({ length: nombreIntervalles + 1 }, (_, indice) => indice)
      .filter((indice) => indice !== indiceZero && Math.abs(indice - indiceZero) >= 2 && Math.abs(indice - indiceZero) <= 5);
    return [indiceZero, aleatoire.choix(candidats)].sort((a, b) => a - b);
  }
  if (origine === "fraction-positive") return [0, 4];
  const separationMin = famille === FAMILLE_DETERMINER_PAS ? 3 : 2;
  const candidats = [];
  for (let gauche = 0; gauche <= nombreIntervalles - separationMin; gauche += 1) {
    for (let droite = gauche + separationMin; droite <= nombreIntervalles; droite += 1) {
      if (droite - gauche <= 5) candidats.push([gauche, droite]);
    }
  }
  return aleatoire.choix(candidats);
}

function choisirCible({ nombreIntervalles, etiquettes, aleatoire, origine, notation, departUnitesDePas }) {
  if (notation === "fraction" && origine === "fraction-positive") {
    const impropres = [5, 6, 7].filter((indice) => indice <= nombreIntervalles && !etiquettes.includes(indice));
    return aleatoire.choix(impropres);
  }
  if (notation === "fraction" && origine === "fraction-negative") {
    const indiceZero = -departUnitesDePas;
    const negatifs = [indiceZero - 1, indiceZero - 2, indiceZero - 3]
      .filter((indice) => indice >= 0 && !etiquettes.includes(indice));
    return aleatoire.choix(negatifs);
  }
  const candidats = Array.from({ length: nombreIntervalles + 1 }, (_, indice) => indice)
    .filter((indice) => !etiquettes.includes(indice))
    // Les extrémités restent possibles dans la banque, mais ne sont plus le
    // choix ordinaire : elles compliquent le geste sans enrichir le calcul.
    .filter((indice) => indice > 0 && indice < nombreIntervalles);
  return aleatoire.choix(candidats);
}

function choisirVariante(famille, index, notation) {
  if (notation === "fraction" && famille !== FAMILLE_PLACER_POINT) return VARIANTE_FRACTION_QCM;
  if (famille === FAMILLE_DETERMINER_PAS) return index >= 10 ? VARIANTE_PAS_QCM : VARIANTE_DIRECTE;
  if (famille === FAMILLE_DIAGNOSTIC) return index >= 15 ? VARIANTE_DEUX_POINTS_QCM : VARIANTE_LECTURE_QCM;
  return VARIANTE_DIRECTE;
}

export function planifierSerieDroiteGraduee({ graine, nombreQuestions = 10 }) {
  validerGraine(graine);
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 20) throw new RangeError("serie droite-graduee : longueur entre 1 et 20 requise");
  const aleatoire = creerGenerateur(`droite-graduee-plan-v2:${graine}:${nombreQuestions}`);
  return FAMILLES.slice(0, nombreQuestions).map((famille, index) => {
    const profil = PROFILS[index];
    const [pasNumerateur, pasDenominateur] = profil.pas;
    const nombreIntervalles = profil.origine.startsWith("fraction") ? 8 : aleatoire.entier(7, 9);
    const departUnitesDePas = departMultiple({ origine: profil.origine, nombreIntervalles, aleatoire, grandPas: pasNumerateur >= 10 });
    let departNumerateur = departUnitesDePas * pasNumerateur;
    // Quelques entiers sont affichés autour de 70 : l’élève ne doit pas chercher systématiquement zéro.
    if (index === 11) departNumerateur += 70;
    const etiquettes = choisirEtiquettes({ famille, nombreIntervalles, aleatoire, origine: profil.origine, departUnitesDePas });
    const indiceCible = choisirCible({ nombreIntervalles, etiquettes, aleatoire, origine: profil.origine, notation: profil.notation, departUnitesDePas });
    const candidatsSecondPoint = Array.from({ length: nombreIntervalles + 1 }, (_, indice) => indice)
      .filter((indice) => indice !== indiceCible && !etiquettes.includes(indice));
    const indiceSecondPoint = aleatoire.choix(candidatsSecondPoint);
    const decalageNom = aleatoire.entier(0, NOMS.length - 1);
    const nomPoint = NOMS[(index + decalageNom) % NOMS.length];
    const nomSecondPoint = NOMS[(index + decalageNom + 3) % NOMS.length];
    return {
      famille,
      variante: choisirVariante(famille, index, profil.notation),
      notation: profil.notation ?? "decimal",
      departNumerateur,
      departDenominateur: pasDenominateur,
      pasNumerateur,
      pasDenominateur,
      nombreIntervalles,
      etiquettes,
      indiceCible,
      nomPoint,
      positionPoint: index % 2 === 0 ? "dessus" : "dessous",
      indiceSecondPoint,
      nomSecondPoint,
      decalageChoix: aleatoire.entier(0, 3),
    };
  });
}

export function genererSerieDroiteGraduee({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") throw new TypeError("serie droite-graduee : registre requis");
  return planifierSerieDroiteGraduee({ graine, nombreQuestions })
    .map((parametres, index) => registre.instancier(gabaritAvec(parametres), `${graine}:${index + 1}`));
}
