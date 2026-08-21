// NC-02/F6 — calculer un carré, puis une seule addition ou soustraction.

import {
  SCHEMA_QUESTION_INSTANCE_V2,
} from "../../../../contrats/src/question-v2.js?v=43";
import {
  VALEURS_CARRES_ENTIERS,
  blocPuissance,
  calculerCarre,
  classementCarres,
  creerGabaritCarres,
  exigerAleatoireCarres,
  exigerParametresCarres,
  reponseEntier,
  valeurParametreOuTirage,
} from "./commun.js?v=43";

export const NOM_GENERATEUR_CALCUL_COURT_CARRE =
  "nombres-et-calculs.carres-entiers-1-a-12.calcul-court";
export const VERSION_GENERATEUR_CALCUL_COURT_CARRE = 1;

export const BASES_CALCUL_COURT = Object.freeze(
  Array.from({ length: 10 }, (_, index) => index + 3),
);
export const OPERATIONS_CALCUL_COURT = Object.freeze([
  "addition",
  "soustraction",
]);

export const GABARIT_CALCUL_COURT_CARRE = creerGabaritCarres({
  id: NOM_GENERATEUR_CALCUL_COURT_CARRE,
  version: VERSION_GENERATEUR_CALCUL_COURT_CARRE,
  titre: "Carrés de 0 à 12 — calcul court",
});

const REGLES_PARAMETRES = Object.freeze({
  base: (valeur) => BASES_CALCUL_COURT.includes(valeur),
  operation: (valeur) => OPERATIONS_CALCUL_COURT.includes(valeur),
  terme: (valeur) => Number.isSafeInteger(valeur) && valeur >= 1 && valeur <= 9,
});

function calculerResultat(carre, operation, terme) {
  return operation === "addition" ? carre + terme : carre - terme;
}

export function termesAdmissiblesCalculCourt(base, operation) {
  if (!BASES_CALCUL_COURT.includes(base)) {
    throw new RangeError("termesAdmissiblesCalculCourt : base de 3 à 12 requise");
  }
  if (!OPERATIONS_CALCUL_COURT.includes(operation)) {
    throw new RangeError("termesAdmissiblesCalculCourt : opération inconnue");
  }
  const carre = calculerCarre(base);
  return Array.from({ length: 9 }, (_, index) => index + 1).filter((terme) => {
    const resultat = calculerResultat(carre, operation, terme);
    return resultat > 0 && !VALEURS_CARRES_ENTIERS.includes(resultat);
  });
}

export function genererQuestionCalculCourtCarre({ aleatoire, parametres }) {
  exigerAleatoireCarres(aleatoire, "calcul-court-carre");
  exigerParametresCarres(
    parametres,
    REGLES_PARAMETRES,
    "calcul-court-carre",
  );
  const base = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "base",
    BASES_CALCUL_COURT,
  );
  const operation = valeurParametreOuTirage(
    aleatoire,
    parametres,
    "operation",
    OPERATIONS_CALCUL_COURT,
  );
  const termesAdmissibles = termesAdmissiblesCalculCourt(base, operation);
  const terme = Object.hasOwn(parametres, "terme")
    ? parametres.terme
    : aleatoire.choix(termesAdmissibles);
  if (!termesAdmissibles.includes(terme)) {
    throw new RangeError(
      "calcul-court-carre : le terme doit donner un résultat positif qui n'est pas un carré",
    );
  }

  const carre = calculerCarre(base);
  const signe = operation === "addition" ? "+" : "−";
  const resultat = calculerResultat(carre, operation, terme);

  return {
    classement: classementCarres("calcul-court", [operation]),
    enonce: [
      { id: "consigne-calcul-court", type: "texte", contenu: "Calcule." },
      blocPuissance("carre", base),
      { id: "operation", type: "texte", contenu: signe },
      { id: "terme", type: "entier", valeur: terme },
    ],
    reponse: reponseEntier(resultat, 1, 153),
    aide: {
      blocs: [
        {
          id: "aide-remplacer",
          type: "texte",
          contenu: "Commence par remplacer l'écriture au carré par un produit.",
        },
        blocPuissance("aide-carre", base),
        {
          id: "aide-produit",
          type: "texte",
          contenu: `Calcule d'abord ${base} × ${base}.`,
        },
        {
          id: "aide-seconde-operation",
          type: "texte",
          contenu: `Effectue seulement ensuite ${signe} ${terme}.`,
        },
      ],
      outils: [],
    },
    correction: [
      {
        id: "correction-carre",
        type: "texte",
        contenu: `D'abord, ${base} × ${base} = ${carre}.`,
      },
      {
        id: "correction-operation",
        type: "texte",
        contenu: `Ensuite, ${carre} ${signe} ${terme} = ${resultat}.`,
      },
      {
        id: "correction-conclusion",
        type: "texte",
        contenu: `Le résultat du calcul est ${resultat}.`,
      },
    ],
  };
}

export const GENERATEUR_CALCUL_COURT_CARRE = Object.freeze({
  nom: NOM_GENERATEUR_CALCUL_COURT_CARRE,
  version: VERSION_GENERATEUR_CALCUL_COURT_CARRE,
  schemaQuestion: SCHEMA_QUESTION_INSTANCE_V2,
  generer: genererQuestionCalculCourtCarre,
});
