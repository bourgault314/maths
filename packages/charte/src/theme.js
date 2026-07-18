// Jetons de thème — rôles sémantiques (cahier des charges V2 §11.2).
//
// LA SÉPARATION QUE CE FICHIER INSTALLE
//
// Un contenu pédagogique ne dit jamais « vert ». Il dit « ceci est le
// TOUT », « ceci est l'INCONNUE », « ceci est une CORRECTION ». Le choix
// des teintes est une décision de charte, prise une fois, ailleurs, et
// modifiable sans rouvrir une seule question.
//
// Concrètement : quand Gwenaël changera le vert des « parties », il
// changera UNE ligne ici, et les 187 automatismes suivront. Si les
// couleurs étaient écrites dans les contenus, il faudrait tout relire.
//
// ÉTAT : la table de correspondance ci-dessous est un POINT DE DÉPART
// repris de la charte existante. L'identité visuelle de la V2 n'est pas
// arrêtée (§3.3) — les ROLES, eux, sont stables et peuvent être utilisés
// dès maintenant.

import { COULEURS, COULEURS_BARRES } from "./charte.js";

export const VERSION_THEME = 1;
export const STATUT_THEME = "brouillon"; // → « valide » après décision de Gwenaël

/**
 * Les rôles sémantiques. C'est la seule liste que les contenus ont le
 * droit de nommer.
 */
export const ROLES_THEME = Object.freeze({
  PRINCIPAL: "principal",
  SECONDAIRE: "secondaire",
  DONNEE: "donnee",
  INCONNUE: "inconnue",
  PARTIE: "partie",
  TOUT: "tout",
  POSITIF: "positif",
  NEGATIF: "negatif",
  SELECTION: "selection",
  AIDE: "aide",
  CORRECTION: "correction",
  ERREUR: "erreur",
});

const ROLES_CONNUS = new Set(Object.values(ROLES_THEME));

/**
 * Correspondance provisoire rôle → teintes.
 *
 * `trait` et `fond` sont séparés : un même rôle n'a pas la même couleur
 * selon qu'il cerne ou qu'il remplit. `texte` est la couleur d'écriture
 * lisible SUR ce fond — elle est déclarée, jamais devinée, pour que le
 * contraste reste vérifiable (§15, vérifications visuelles).
 */
const CORRESPONDANCE = Object.freeze({
  principal: { trait: COULEURS.encre, fond: COULEURS.papier, texte: COULEURS.encre },
  secondaire: { trait: COULEURS.ligne, fond: COULEURS.fondDoux, texte: COULEURS.texteAttenue },

  // Les rôles du langage des barres sont repris de la charte existante,
  // où ils ont déjà été relevés dans les outils de Gwenaël.
  donnee: {
    trait: COULEURS_BARRES.filet,
    fond: COULEURS_BARRES.nombreFond,
    texte: COULEURS_BARRES.encre,
  },
  inconnue: {
    trait: COULEURS_BARRES.inconnueTexte,
    fond: COULEURS_BARRES.inconnueFond,
    texte: COULEURS_BARRES.inconnueTexte,
  },

  // ATTENTION : « partie » et « tout » attendent une décision de Gwenaël.
  // Les teintes ci-dessous reprennent les rôles vert/bleu des barres pour
  // que le banc d'essai affiche quelque chose de cohérent — ce n'est PAS
  // une convention pédagogique validée.
  partie: {
    trait: COULEURS_BARRES.roleVertTexte,
    fond: COULEURS_BARRES.roleVert,
    texte: COULEURS_BARRES.roleVertTexte,
  },
  tout: {
    trait: COULEURS_BARRES.roleBleuTexte,
    fond: COULEURS_BARRES.roleBleu,
    texte: COULEURS_BARRES.roleBleuTexte,
  },

  positif: {
    trait: COULEURS.jetonPositifBord,
    fond: COULEURS.jetonPositif,
    texte: COULEURS.papier,
  },
  negatif: {
    trait: COULEURS.jetonNegatifBord,
    fond: COULEURS.jetonNegatif,
    texte: COULEURS.papier,
  },
  selection: {
    trait: COULEURS_BARRES.hachureCalcul,
    fond: COULEURS_BARRES.inconnueFondBas,
    texte: COULEURS_BARRES.encre,
  },
  aide: { trait: COULEURS.turquoise, fond: COULEURS.fondDoux, texte: COULEURS.encre },
  correction: {
    trait: COULEURS_BARRES.roleVertTexte,
    fond: COULEURS_BARRES.resultatFond,
    texte: COULEURS_BARRES.roleVertTexte,
  },
  erreur: { trait: COULEURS.erreur, fond: COULEURS.papier, texte: COULEURS.erreur },
});

/**
 * Les teintes d'un rôle.
 *
 * Lève sur un rôle inconnu : une faute de frappe doit se voir tout de
 * suite, pas produire un objet incolore à l'écran.
 *
 * @param {string} role
 * @returns {{ trait: string, fond: string, texte: string }}
 */
export function teintesDuRole(role) {
  if (!ROLES_CONNUS.has(role)) {
    throw new RangeError(
      `rôle de thème inconnu « ${role} » — rôles connus : ${[...ROLES_CONNUS].join(", ")}`,
    );
  }
  const teintes = CORRESPONDANCE[role];
  if (!teintes) {
    throw new Error(`rôle « ${role} » déclaré mais sans teintes : compléter theme.js`);
  }
  return { ...teintes };
}

/** Tous les rôles, pour les planches de contrôle du studio. */
export function tousLesRoles() {
  return Object.values(ROLES_THEME).map((role) => ({ role, ...teintesDuRole(role) }));
}

/**
 * Un contenu contient-il une couleur en dur ? Utilisé par les tests de
 * dépendances : la banque doit rester incolore (§15).
 * @param {unknown} valeur
 */
export function contientCouleurBrute(valeur) {
  const motif = /#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i;
  const parcourir = (v) => {
    if (typeof v === "string") return motif.test(v);
    if (Array.isArray(v)) return v.some(parcourir);
    if (v && typeof v === "object") return Object.values(v).some(parcourir);
    return false;
  };
  return parcourir(valeur);
}
