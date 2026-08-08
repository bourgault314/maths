// NC-02/F4 — reconnaître tous les nombres carrés parmi quatre entiers.

import {
  COMPARAISON_ENSEMBLE_EXACT,
  SCHEMA_QUESTION_INSTANCE_V2,
  TYPE_REPONSE_SELECTION_MULTIPLE,
} from "../../../../contrats/src/question-v2.js?v=21";
import {
  BASES_CARRES_ENTIERS,
  calculerCarre,
  classementCarres,
  creerGabaritCarres,
  estValeurCarreeDe0A12,
  exigerAleatoireCarres,
  exigerParametresCarres,
  retrouverBaseCarree,
} from "./commun.js?v=21";

export const NOM_GENERATEUR_RECONNAITRE_CARRES =
  "nombres-et-calculs.carres-entiers-1-a-12.reconnaitre-carres";
export const VERSION_GENERATEUR_RECONNAITRE_CARRES = 2;

export const GABARIT_RECONNAITRE_CARRES = creerGabaritCarres({
  id: NOM_GENERATEUR_RECONNAITRE_CARRES,
  version: VERSION_GENERATEUR_RECONNAITRE_CARRES,
  titre: "Carrés de 0 à 12 — reconnaître les carrés parfaits",
});

export const FORMULATIONS_RECONNAITRE_CARRES = Object.freeze([
  "nombres-carres",
  "carres-parfaits",
]);

const REGLES_PARAMETRES = Object.freeze({
  nombreCarres: (valeur) => valeur === 1 || valeur === 2,
  formulation: (valeur) => FORMULATIONS_RECONNAITRE_CARRES.includes(valeur),
});

function candidatsDiagnostiques(bases) {
  const candidats = [];
  for (const base of bases) {
    const carre = calculerCarre(base);
    candidats.push(
      carre - 1,
      carre + 1,
      2 * base,
      base,
      base + 2,
      base * (base - 1),
      base * (base + 1),
    );
  }
  return [...new Set(candidats)].filter(
    (valeur) =>
      Number.isSafeInteger(valeur) &&
      valeur >= 2 &&
      valeur <= 143 &&
      !estValeurCarreeDe0A12(valeur),
  );
}

function candidatsNonCarres(aleatoire, basesCibles) {
  const prioritaires = aleatoire.melange(candidatsDiagnostiques(basesCibles));
  const dejaVus = new Set(prioritaires);
  const autresBases = aleatoire
    .melange(BASES_CARRES_ENTIERS)
    .filter((base) => !basesCibles.includes(base));
  const reserve = aleatoire
    .melange(candidatsDiagnostiques(autresBases))
    .filter((valeur) => !dejaVus.has(valeur));
  return [...prioritaires, ...reserve];
}

function verifierNombreDeCandidats(candidats, nombreAttendu) {
  if (candidats.length < nombreAttendu) {
    throw new Error(
      `reconnaitre-carres : ${nombreAttendu} distracteurs diagnostiques requis`,
    );
  }
  return candidats.slice(0, nombreAttendu);
}

export function estDistracteurDiagnostiqueCarre(valeur) {
  return BASES_CARRES_ENTIERS.some((base) =>
    candidatsDiagnostiques([base]).includes(valeur),
  );
}

function expliquerValeur(valeur) {
  const base = retrouverBaseCarree(valeur);
  if (base !== null) {
    return `${valeur} est un carré : ${valeur} = ${base} × ${base}.`;
  }
  const inferieur = Math.floor(Math.sqrt(valeur));
  const superieur = inferieur + 1;
  return (
    `${valeur} n'est pas un carré : ` +
    `${inferieur} × ${inferieur} < ${valeur} < ${superieur} × ${superieur}.`
  );
}

export function genererQuestionReconnaitreCarres({ aleatoire, parametres }) {
  exigerAleatoireCarres(aleatoire, "reconnaitre-carres");
  exigerParametresCarres(
    parametres,
    REGLES_PARAMETRES,
    "reconnaitre-carres",
  );
  const nombreCarres = Object.hasOwn(parametres, "nombreCarres")
    ? parametres.nombreCarres
    : aleatoire.entier(1, 2);
  const formulation = Object.hasOwn(parametres, "formulation")
    ? parametres.formulation
    : aleatoire.choix(FORMULATIONS_RECONNAITRE_CARRES);
  const bases = aleatoire.melange(BASES_CARRES_ENTIERS).slice(0, nombreCarres);
  const valeursCarrees = bases.map(calculerCarre);
  const valeursNonCarrees = verifierNombreDeCandidats(
    candidatsNonCarres(aleatoire, bases)
      .filter((valeur) => !valeursCarrees.includes(valeur)),
    4 - nombreCarres,
  );
  const valeurs = aleatoire.melange([...valeursCarrees, ...valeursNonCarrees]);
  const choix = valeurs.map((valeur) => ({
    id: `nombre-${valeur}`,
    libelle: String(valeur),
  }));
  const attendus = choix
    .filter(({ libelle }) => estValeurCarreeDe0A12(Number(libelle)))
    .map(({ id }) => id);

  return {
    classement: classementCarres("reconnaitre-carres", [`forme-${formulation}`]),
    enonce: [
      {
        id: "consigne-selection",
        type: "texte",
        contenu: formulation === "nombres-carres"
          ? "Sélectionne tous les nombres carrés."
          : "Parmi ces nombres, lesquels sont des carrés parfaits ?",
      },
    ],
    reponse: {
      type: TYPE_REPONSE_SELECTION_MULTIPLE,
      comparaison: COMPARAISON_ENSEMBLE_EXACT,
      choix,
      attendus,
    },
    aide: {
      blocs: [
        {
          id: "aide-definition",
          type: "texte",
          contenu:
            "Un carré parfait peut s'écrire comme le produit de deux facteurs égaux, chacun compris entre 0 et 12.",
        },
        {
          id: "aide-verification",
          type: "texte",
          contenu:
            "Vérifie les quatre cartes et sélectionne toutes celles qui conviennent.",
        },
      ],
      outils: [],
    },
    correction: choix.map(({ id, libelle }) => ({
      id: `correction-${id}`,
      type: "texte",
      contenu: expliquerValeur(Number(libelle)),
    })),
  };
}

export const GENERATEUR_RECONNAITRE_CARRES = Object.freeze({
  nom: NOM_GENERATEUR_RECONNAITRE_CARRES,
  version: VERSION_GENERATEUR_RECONNAITRE_CARRES,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionReconnaitreCarres,
});
