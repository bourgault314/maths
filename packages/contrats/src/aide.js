// Contrat « aide » — version 1 (cahier des charges V2 §7.9, §6.2).
//
// Une aide n'est pas un texte de secours écrit après coup : c'est une
// ÉTAPE d'un cheminement. Le cahier des charges en fixe l'ordre, du plus
// léger au plus engageant :
//
//   1. repérage      — « de quoi parle la question ? »
//   2. rappel        — la connaissance mobilisée
//   3. représentation — la même situation, autrement (schéma, barre…)
//   4. propriété     — la règle qui s'applique ici
//   5. amorce        — la première étape, faite avec l'élève
//   6. erreur        — déclenchée par ce que l'élève vient d'écrire
//
// Deux règles structurantes :
//
// — Une aide REFERENCE les mêmes données et le même objet que la question.
//   Elle ne redessine pas une situation légèrement différente : ce serait
//   la meilleure façon d'égarer un élève.
//
// — Une aide de genre « erreur » n'existe qu'attachée à un modèle d'erreur
//   (§5). Sans modèle, elle serait un commentaire flottant.
//
// Ce fichier ne décide RIEN du contenu des aides : les textes sont de
// Gwenaël. Il décide seulement de leur forme et de leur ordre.

import { validerVisuel } from "./visuel.js";

export const SCHEMA_AIDE = "mathsgo.aide/1";

/** Les genres d'aide, DANS l'ordre de dévoilement. */
export const GENRES_AIDE = [
  "reperage",
  "rappel",
  "representation",
  "propriete",
  "amorce",
  "erreur",
];

/** Rang d'un genre dans le cheminement (1 = le plus léger). */
export function rangGenre(genre) {
  const rang = GENRES_AIDE.indexOf(genre);
  return rang === -1 ? null : rang + 1;
}

function validerBlocsAide(blocs, nom, erreurs) {
  if (!Array.isArray(blocs) || blocs.length === 0) {
    erreurs.push(`${nom} : au moins un bloc requis`);
    return;
  }
  blocs.forEach((bloc, i) => {
    if (typeof bloc !== "object" || bloc === null) {
      erreurs.push(`${nom}[${i}] : bloc attendu`);
      return;
    }
    if (bloc.type === "objet") {
      const controle = validerVisuel(bloc.visuel);
      if (!controle.valide) {
        erreurs.push(...controle.erreurs.map((e) => `${nom}[${i}].${e}`));
      }
    } else if (bloc.type === "texte" || bloc.type === "latex") {
      if (typeof bloc.contenu !== "string" || bloc.contenu.trim().length === 0) {
        erreurs.push(`${nom}[${i}] : contenu texte non vide requis`);
      }
    } else {
      erreurs.push(`${nom}[${i}] : type de bloc inconnu « ${bloc.type} »`);
    }
  });
}

/**
 * Valide une aide isolée.
 * @param {unknown} aide
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerAide(aide) {
  const erreurs = [];
  if (typeof aide !== "object" || aide === null) {
    return { valide: false, erreurs: ["aide : objet attendu"] };
  }
  const a = /** @type {Record<string, any>} */ (aide);

  if (!GENRES_AIDE.includes(a.genre)) {
    erreurs.push(`aide.genre : genre inconnu « ${a.genre} »`);
  }
  validerBlocsAide(a.blocs, "aide.blocs", erreurs);

  // Une aide « erreur » ne se déclenche pas toute seule.
  if (a.genre === "erreur") {
    if (typeof a.modeleErreur !== "string" || a.modeleErreur.length === 0) {
      erreurs.push(
        "aide.modeleErreur : une aide de genre « erreur » doit nommer le modèle d'erreur qui la déclenche (§5)",
      );
    }
  } else if (a.modeleErreur !== undefined) {
    erreurs.push("aide.modeleErreur : réservé aux aides de genre « erreur »");
  }

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Valide la SUITE d'aides d'une question : ordre, doublons, cohérence.
 * @param {unknown} aides
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerSuiteAides(aides) {
  const erreurs = [];
  if (!Array.isArray(aides)) {
    return { valide: false, erreurs: ["aides : liste attendue"] };
  }

  const genresVus = new Set();
  let rangPrecedent = 0;

  aides.forEach((aide, i) => {
    const controle = validerAide(aide);
    if (!controle.valide) {
      erreurs.push(...controle.erreurs.map((e) => `aides[${i}] : ${e}`));
      return;
    }
    // Les aides « erreur » sortent du cheminement : elles répondent à une
    // saisie, elles ne s'empilent pas dans l'ordre de dévoilement.
    if (aide.genre === "erreur") {
      const cle = `erreur:${aide.modeleErreur}`;
      if (genresVus.has(cle)) {
        erreurs.push(`aides[${i}] : deux aides pour le modèle « ${aide.modeleErreur} »`);
      }
      genresVus.add(cle);
      return;
    }
    if (genresVus.has(aide.genre)) {
      erreurs.push(`aides[${i}] : genre « ${aide.genre} » déjà présent`);
    }
    genresVus.add(aide.genre);

    const rang = rangGenre(aide.genre);
    if (rang < rangPrecedent) {
      erreurs.push(
        `aides[${i}] : « ${aide.genre} » arrive après une aide plus engageante — l'ordre du dévoilement doit être respecté`,
      );
    }
    rangPrecedent = rang;
  });

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Les aides à proposer, dans l'ordre, hors aides d'erreur.
 * @param {Array<object>} aides
 */
export function cheminementAides(aides) {
  return (aides ?? [])
    .filter((a) => a?.genre && a.genre !== "erreur")
    .slice()
    .sort((a, b) => rangGenre(a.genre) - rangGenre(b.genre));
}

/**
 * L'aide à proposer quand un modèle d'erreur a été reconnu.
 * Renvoie null s'il n'y en a pas — on n'invente jamais un commentaire.
 * @param {Array<object>} aides @param {string} modeleErreur
 */
export function aidePourErreur(aides, modeleErreur) {
  return (aides ?? []).find(
    (a) => a?.genre === "erreur" && a.modeleErreur === modeleErreur,
  ) ?? null;
}
