// GÉNÉRATEURS DE FIXTURE — outillage technique, PAS du contenu de classe.
//
// Ces générateurs existent pour éprouver le socle : déterminisme, boucle
// de rejet bornée, repli, modèles d'erreurs, refus d'un gabarit impossible.
// Ils ne sont enregistrés QUE par les tests et par le banc d'essai du
// studio. Aucun n'a vocation à être vu par un élève : leurs énoncés sont
// volontairement plats, sans habillage et sans intention pédagogique.
//
// Le lot 1 (« Puissances et carrés ») apportera les premiers générateurs
// réels, avec les formulations de Gwenaël.

import { valeurEntier } from "../../../contrats/src/question-instance-2.js";
import { EchecDeGeneration } from "../../../contrats/src/generateur.js";

/** Préfixe réservé : tout ce qui commence ainsi est de l'outillage. */
export const PREFIXE_FIXTURE = "fixture/";

/**
 * Somme de deux entiers.
 *
 * Il applique la règle §4.2 — choisir la RÉPONSE d'abord, puis les
 * données — pour que le socle soit éprouvé dans le sens où les vrais
 * générateurs travailleront.
 */
export const FIXTURE_SOMME = {
  nom: "fixture/somme",
  version: 1,

  validerParametres(parametres) {
    const problemes = [];
    const max = parametres?.maximum;
    if (!Number.isInteger(max) || max < 2) {
      problemes.push("« maximum » entier ≥ 2 requis");
    }
    if (parametres?.interdireZero !== undefined
      && typeof parametres.interdireZero !== "boolean") {
      problemes.push("« interdireZero » booléen attendu");
    }
    return problemes;
  },

  generer({ aleatoire, parametres }) {
    const max = parametres.maximum;
    // La réponse d'abord : on ne risque donc jamais une somme hors bornes.
    const total = aleatoire.entier(2, max);
    const premier = aleatoire.entier(1, total - 1);
    const second = total - premier;

    return {
      enonce: [{ type: "texte", contenu: `${premier} + ${second}` }],
      reponse: { type: "entier", valeur: valeurEntier(total) },
      correction: [
        { type: "texte", contenu: `${premier} + ${second} = ${total}` },
      ],
      // Deux erreurs classiques, utiles pour éprouver le diagnostic.
      modelesErreurs: [
        { id: "fixture-difference", valeur: valeurEntier(Math.abs(premier - second)) },
        { id: "fixture-produit", valeur: valeurEntier(premier * second) },
      ].filter((modele) => modele.valeur.valeur !== total),
    };
  },

  invariants(produit, parametres) {
    const problemes = [];
    const total = produit?.reponse?.valeur?.valeur;
    if (!Number.isInteger(total)) problemes.push("la réponse n'est pas un entier");
    if (total > parametres.maximum) problemes.push("la somme dépasse le maximum demandé");
    if (parametres.interdireZero && total === 0) problemes.push("somme nulle interdite ici");
    return problemes;
  },

  repli({ parametres }) {
    // Question de secours DÉTERMINISTE : mêmes paramètres, même question.
    const total = Math.min(3, parametres.maximum);
    return {
      enonce: [{ type: "texte", contenu: `1 + ${total - 1}` }],
      reponse: { type: "entier", valeur: valeurEntier(total) },
      correction: [{ type: "texte", contenu: `1 + ${total - 1} = ${total}` }],
    };
  },
};

/**
 * Générateur dont AUCUN tirage ne passe les invariants, mais dont le repli
 * les respecte. Sert à vérifier que la boucle de rejet est BORNÉE et que le
 * repli prend le relais au lieu de figer l'application.
 *
 * Il est construit ainsi à dessein : le repli est soumis aux MÊMES
 * invariants que les tirages. Un repli qui les violerait produirait une
 * question cassée — le filet de sécurité doit être valide, sinon il ne
 * sert à rien.
 */
export const FIXTURE_TOUJOURS_REFUSEE = {
  nom: "fixture/toujours-refusee",
  version: 1,
  essaisMaximum: 3,

  generer({ aleatoire }) {
    // Toujours une réponse non nulle : donc toujours refusée ci-dessous.
    return {
      enonce: [{ type: "texte", contenu: `valeur ${aleatoire.entier(1, 9)}` }],
      reponse: { type: "entier", valeur: valeurEntier(1) },
    };
  },

  invariants(produit) {
    return produit?.reponse?.valeur?.valeur === 0
      ? []
      : ["seule la question de secours est acceptée par cette fixture"];
  },

  repli() {
    return {
      enonce: [{ type: "texte", contenu: "question de secours" }],
      reponse: { type: "entier", valeur: valeurEntier(0) },
    };
  },
};

/**
 * Générateur sans repli, qui échoue toujours.
 * Sert à vérifier qu'un gabarit impossible produit une erreur CLAIRE
 * plutôt qu'une question à moitié construite (§8.6).
 */
export const FIXTURE_SANS_ISSUE = {
  nom: "fixture/sans-issue",
  version: 1,
  essaisMaximum: 2,

  generer() {
    return {
      enonce: [{ type: "texte", contenu: "impossible" }],
      reponse: { type: "entier", valeur: valeurEntier(1) },
    };
  },

  invariants() {
    return ["aucune question valide n'est atteignable"];
  },
};

/**
 * Générateur qui déclare l'impossibilité d'emblée.
 * Vérifie qu'on ne s'obstine pas à retirer quand c'est inutile.
 */
export const FIXTURE_IMPOSSIBLE = {
  nom: "fixture/impossible",
  version: 1,

  generer() {
    throw new EchecDeGeneration("contrainte impossible à satisfaire", {
      generateur: "fixture/impossible",
      essais: 0,
      impossible: true,
    });
  },
};

/** Tous les générateurs de fixture, pour les enregistrer d'un coup. */
export const GENERATEURS_FIXTURE = [
  FIXTURE_SOMME,
  FIXTURE_TOUJOURS_REFUSEE,
  FIXTURE_SANS_ISSUE,
  FIXTURE_IMPOSSIBLE,
];
