import { creerGenerateur, validerGraine } from "../../../../moteur-exercices/src/aleatoire.js?v=53";
import {
  apparierProfilsCompatibles,
  definirPaquetPondere,
  ordonnerEnLimitantRepetitions,
  tirerProfilsPonderes,
} from "../../../../moteur-exercices/src/paquets-ponderes.js?v=53";
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
} from "./questions.js?v=53";

export const QUOTAS_DROITE_GRADUEE = Object.freeze({
  20: Object.freeze({ lire: 8, placer: 8, pas: 2, diagnostic: 2 }),
});

export const VERSION_PLAN_SERIE_DROITE_GRADUEE = 3;

export const PAQUET_FAMILLES_DROITE_GRADUEE = definirPaquetPondere({
  id: "ge01-ge02-familles",
  profils: [
    {
      id: "lire-abscisse",
      quota: 8,
      categorie: "principale",
      famille: FAMILLE_LIRE_ABSCISSE,
      variante: VARIANTE_DIRECTE,
    },
    {
      id: "placer-point",
      quota: 8,
      categorie: "principale",
      famille: FAMILLE_PLACER_POINT,
      variante: VARIANTE_DIRECTE,
    },
    {
      id: "determiner-pas-direct",
      quota: 1,
      categorie: "secondaire",
      famille: FAMILLE_DETERMINER_PAS,
      variante: VARIANTE_DIRECTE,
    },
    {
      id: "determiner-pas-qcm",
      quota: 1,
      categorie: "rare",
      famille: FAMILLE_DETERMINER_PAS,
      variante: VARIANTE_PAS_QCM,
    },
    {
      id: "diagnostic-lecture-qcm",
      quota: 1,
      categorie: "secondaire",
      famille: FAMILLE_DIAGNOSTIC,
      variante: VARIANTE_LECTURE_QCM,
    },
    {
      id: "diagnostic-deux-points-qcm",
      quota: 1,
      categorie: "rare",
      famille: FAMILLE_DIAGNOSTIC,
      variante: VARIANTE_DEUX_POINTS_QCM,
    },
  ],
});

export const PAQUET_PROFILS_DROITE_GRADUEE = definirPaquetPondere({
  id: "ge01-ge02-profils",
  profils: [
    { id: "un-zero-reference", quota: 1, categorie: "principale", pas: [1, 1], origine: "zero-reference" },
    { id: "deux-zero-reference", quota: 1, categorie: "principale", pas: [2, 1], origine: "zero-reference" },
    { id: "cinq-zero-reference", quota: 1, categorie: "principale", pas: [5, 1], origine: "zero-reference" },
    { id: "demi-zero-reference", quota: 1, categorie: "principale", pas: [1, 2], origine: "zero-reference" },
    { id: "dix-zero-reference", quota: 1, categorie: "principale", pas: [10, 1], origine: "zero-reference" },
    { id: "un-zero-visible", quota: 1, categorie: "principale", pas: [1, 1], origine: "zero-visible" },
    { id: "dixieme-zero-reference", quota: 1, categorie: "secondaire", pas: [1, 10], origine: "zero-reference" },
    { id: "vingt-zero-visible", quota: 1, categorie: "secondaire", pas: [20, 1], origine: "zero-visible" },
    { id: "quart-fraction-positive-a", quota: 1, categorie: "rare", pas: [1, 4], origine: "fraction-positive", notation: "fraction" },
    { id: "demi-references-libres", quota: 1, categorie: "secondaire", pas: [1, 2], origine: "references-libres" },
    { id: "quart-fraction-positive-b", quota: 1, categorie: "rare", pas: [1, 4], origine: "fraction-positive", notation: "fraction" },
    { id: "cinq-autour-70", quota: 1, categorie: "secondaire", pas: [5, 1], origine: "positive", decalageDepart: 70 },
    { id: "vingt-cinq-references-libres", quota: 1, categorie: "secondaire", pas: [25, 1], origine: "references-libres" },
    { id: "dixieme-negatif", quota: 1, categorie: "secondaire", pas: [1, 10], origine: "negative" },
    { id: "deux-hors-zero", quota: 1, categorie: "secondaire", pas: [2, 1], origine: "hors-zero" },
    { id: "cinquante-references-libres", quota: 1, categorie: "secondaire", pas: [50, 1], origine: "references-libres" },
    { id: "vingt-negatif", quota: 1, categorie: "secondaire", pas: [20, 1], origine: "negative" },
    { id: "demi-hors-zero", quota: 1, categorie: "secondaire", pas: [1, 2], origine: "hors-zero" },
    { id: "quart-fraction-negative", quota: 1, categorie: "rare", pas: [1, 4], origine: "fraction-negative", notation: "fraction" },
    { id: "cinquante-hors-zero", quota: 1, categorie: "rare", pas: [50, 1], origine: "hors-zero" },
  ],
});
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

function indicesCiblesPossibles({ nombreIntervalles, etiquettes, origine, notation, departUnitesDePas }) {
  if (notation === "fraction" && origine === "fraction-positive") {
    return [5, 6, 7].filter((indice) =>
      indice <= nombreIntervalles && !etiquettes.includes(indice));
  }
  if (notation === "fraction" && origine === "fraction-negative") {
    const indiceZero = -departUnitesDePas;
    return [indiceZero - 1, indiceZero - 2, indiceZero - 3]
      .filter((indice) => indice >= 0 && !etiquettes.includes(indice));
  }
  return Array.from({ length: nombreIntervalles + 1 }, (_, indice) => indice)
    .filter((indice) => !etiquettes.includes(indice))
    // Les extrémités restent possibles dans la banque, mais ne sont plus le
    // choix ordinaire : elles compliquent le geste sans enrichir le calcul.
    .filter((indice) => indice > 0 && indice < nombreIntervalles);
}

function choisirCible(options) {
  return options.aleatoire.choix(indicesCiblesPossibles(options));
}

function signatureParametresVisibles(parametres) {
  return JSON.stringify({
    famille: parametres.famille,
    variante: parametres.variante,
    notation: parametres.notation,
    departNumerateur: parametres.departNumerateur,
    departDenominateur: parametres.departDenominateur,
    pasNumerateur: parametres.pasNumerateur,
    pasDenominateur: parametres.pasDenominateur,
    nombreIntervalles: parametres.nombreIntervalles,
    etiquettes: parametres.etiquettes,
    indiceCible: parametres.indiceCible,
    nomPoint: parametres.nomPoint,
    positionPoint: parametres.positionPoint,
    ...(parametres.variante === VARIANTE_DEUX_POINTS_QCM
      ? {
          indiceSecondPoint: parametres.indiceSecondPoint,
          nomSecondPoint: parametres.nomSecondPoint,
        }
      : {}),
  });
}

export function planifierSerieDroiteGraduee({ graine, nombreQuestions = 10 }) {
  validerGraine(graine);
  if (!Number.isInteger(nombreQuestions) || nombreQuestions < 1 || nombreQuestions > 20) throw new RangeError("serie droite-graduee : longueur entre 1 et 20 requise");
  const aleatoire = creerGenerateur(
    `droite-graduee-valeurs-v${VERSION_PLAN_SERIE_DROITE_GRADUEE}:${graine}:${nombreQuestions}`,
  );
  const familles = ordonnerEnLimitantRepetitions({
    elements: tirerProfilsPonderes({
      paquet: PAQUET_FAMILLES_DROITE_GRADUEE,
      graine: `droite-graduee-familles-v${VERSION_PLAN_SERIE_DROITE_GRADUEE}:${graine}`,
      nombreElements: nombreQuestions,
    }),
    graine: `droite-graduee-ordre-v${VERSION_PLAN_SERIE_DROITE_GRADUEE}:${graine}`,
    cle: ({ famille }) => famille,
  });
  let profils;
  for (let essai = 0; essai < 40; essai += 1) {
    const candidats = tirerProfilsPonderes({
      paquet: PAQUET_PROFILS_DROITE_GRADUEE,
      graine: `droite-graduee-profils-v${VERSION_PLAN_SERIE_DROITE_GRADUEE}:${graine}:essai-${essai}`,
      nombreElements: nombreQuestions,
    });
    try {
      profils = apparierProfilsCompatibles({
        elements: familles,
        profils: candidats,
        graine: `droite-graduee-appariement-v${VERSION_PLAN_SERIE_DROITE_GRADUEE}:${graine}:${essai}`,
        estCompatible: (famille, profil) =>
          profil.notation !== "fraction"
          || [FAMILLE_LIRE_ABSCISSE, FAMILLE_PLACER_POINT].includes(famille.famille),
      });
      break;
    } catch (erreur) {
      if (!String(erreur.message).startsWith("appariement pondéré")) throw erreur;
    }
  }
  if (!profils) throw new Error("serie droite-graduee : profils compatibles introuvables");
  const signatures = new Set();
  return familles.map((profilFamille, index) => {
    const famille = profilFamille.famille;
    const profil = profils[index];
    const [pasNumerateur, pasDenominateur] = profil.pas;
    const nombreIntervalles = profil.origine.startsWith("fraction") ? 8 : aleatoire.entier(7, 9);
    const departUnitesDePas = departMultiple({ origine: profil.origine, nombreIntervalles, aleatoire, grandPas: pasNumerateur >= 10 });
    let departNumerateur = departUnitesDePas * pasNumerateur;
    // Quelques entiers sont affichés autour de 70 : l’élève ne doit pas chercher systématiquement zéro.
    departNumerateur += profil.decalageDepart ?? 0;
    const etiquettes = choisirEtiquettes({ famille, nombreIntervalles, aleatoire, origine: profil.origine, departUnitesDePas });
    const indiceCible = choisirCible({ nombreIntervalles, etiquettes, aleatoire, origine: profil.origine, notation: profil.notation, departUnitesDePas });
    const candidatsSecondPoint = Array.from({ length: nombreIntervalles + 1 }, (_, indice) => indice)
      .filter((indice) => indice !== indiceCible && !etiquettes.includes(indice));
    const indiceSecondPoint = aleatoire.choix(candidatsSecondPoint);
    const decalageNom = aleatoire.entier(0, NOMS.length - 1);
    const nomPoint = NOMS[(index + decalageNom) % NOMS.length];
    const nomSecondPoint = NOMS[(index + decalageNom + 3) % NOMS.length];
    const resultat = {
      famille,
      variante: profil.notation === "fraction" && famille === FAMILLE_LIRE_ABSCISSE
        ? VARIANTE_FRACTION_QCM
        : profilFamille.variante,
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
    const cibles = aleatoire.melange(indicesCiblesPossibles({
      nombreIntervalles,
      etiquettes,
      origine: profil.origine,
      notation: profil.notation,
      departUnitesDePas,
    }));
    const noms = [nomPoint, ...aleatoire.melange(NOMS.filter((nom) => nom !== nomPoint))];
    for (const cible of cibles) {
      for (const nom of noms) {
        resultat.indiceCible = cible;
        resultat.nomPoint = nom;
        resultat.nomSecondPoint = NOMS[(NOMS.indexOf(nom) + 3) % NOMS.length];
        if (resultat.indiceSecondPoint === cible) {
          resultat.indiceSecondPoint = aleatoire.choix(
            candidatsSecondPoint.filter((indice) => indice !== cible),
          );
        }
        const signature = signatureParametresVisibles(resultat);
        if (!signatures.has(signature)) {
          signatures.add(signature);
          return resultat;
        }
      }
    }
    throw new Error(`serie droite-graduee : profil visible dupliqué à la position ${index + 1}`);
  });
}

export function genererSerieDroiteGraduee({ registre, graine, nombreQuestions = 10 }) {
  if (!registre || typeof registre.instancier !== "function") throw new TypeError("serie droite-graduee : registre requis");
  return planifierSerieDroiteGraduee({ graine, nombreQuestions })
    .map((parametres, index) => registre.instancier(gabaritAvec(parametres), `${graine}:${index + 1}`));
}
