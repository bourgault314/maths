// Contrat « générateur » — version 1 (cahier des charges V2 §7.5, §8.3).
//
// Un générateur est la SEULE pièce du système qui a le droit d'être du
// code. Tout le reste — programme, banque, gabarits, questions — n'est que
// de la donnée. C'est pourquoi ce contrat est strict : ce qui peut
// exécuter quelque chose doit être déclaré, versionné, relu et testé.
//
// CE QU'UN GÉNÉRATEUR DOIT SAVOIR FAIRE (§8.3), dans cet ordre :
//
//   1. refuser des paramètres qu'il ne sait pas honorer ;
//   2. construire une structure mathématique valide ;
//   3. produire les données de l'énoncé ;
//   4. calculer la réponse EXACTE ;
//   5. vérifier ses propres invariants ;
//   6. produire les modèles d'erreurs.
//
// L'étape 5 mérite un mot : un générateur qui se contente de tirer des
// nombres finit par produire des questions absurdes (« 0 % de 0 »,
// « simplifier 7/7 »). Les invariants sont l'endroit où l'on écrit ce
// qu'une question de cette famille doit toujours vérifier — et ils sont
// contrôlés à CHAQUE tirage, pas seulement dans les tests.

export const SCHEMA_GENERATEUR = "mathsgo.generateur/1";

/**
 * Convention de nommage : « famille/gabarit », en minuscules avec tirets.
 * Elle est reprise TELLE QUELLE du premier module reconstruit
 * (« divisibilite/multiple-voisin ») : le contrat s'aligne sur la banque
 * existante, il ne lui impose pas une nouvelle orthographe.
 */
const NOM_GENERATEUR = /^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/;

/**
 * Valide la DÉFINITION d'un générateur (sa carte d'identité), avant qu'il
 * n'entre au registre.
 *
 * @param {unknown} generateur
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerDefinitionGenerateur(generateur) {
  const erreurs = [];
  if (typeof generateur !== "object" || generateur === null) {
    return { valide: false, erreurs: ["generateur : objet attendu"] };
  }
  const g = /** @type {Record<string, any>} */ (generateur);

  if (typeof g.nom !== "string" || !NOM_GENERATEUR.test(g.nom)) {
    erreurs.push(
      `generateur.nom : nom « famille/gabarit » requis (ex. « divisibilite/multiple-voisin »), reçu « ${g.nom} »`,
    );
  }
  if (!Number.isInteger(g.version) || g.version < 1) {
    erreurs.push("generateur.version : entier ≥ 1 requis");
  }
  if (typeof g.generer !== "function") {
    erreurs.push("generateur.generer : fonction requise");
  }
  // Facultatifs, mais s'ils existent ils doivent être du bon type.
  for (const champ of ["validerParametres", "invariants", "modelesErreurs"]) {
    if (g[champ] !== undefined && typeof g[champ] !== "function") {
      erreurs.push(`generateur.${champ} : fonction attendue si elle est déclarée`);
    }
  }
  if (g.essaisMaximum !== undefined
    && (!Number.isInteger(g.essaisMaximum) || g.essaisMaximum < 1)) {
    erreurs.push("generateur.essaisMaximum : entier ≥ 1 attendu");
  }

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Vérifie qu'un générateur n'a pas produit n'importe quoi.
 * Appelé par le moteur à chaque tirage, jamais contourné.
 *
 * @param {object} produit — ce que `generer` a renvoyé
 * @param {object} generateur — sa définition
 * @param {object} parametres — les paramètres du gabarit
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function verifierProduit(produit, generateur, parametres) {
  const erreurs = [];
  if (typeof produit !== "object" || produit === null) {
    return { valide: false, erreurs: ["le générateur n'a rien produit"] };
  }

  if (!Array.isArray(produit.enonce) || produit.enonce.length === 0) {
    erreurs.push("produit.enonce : au moins un bloc d'énoncé requis");
  }
  if (typeof produit.reponse !== "object" || produit.reponse === null) {
    erreurs.push("produit.reponse : réponse typée requise");
  }

  // Les invariants du générateur lui-même. Une exception levée ici est un
  // défaut du générateur : on la transforme en message lisible plutôt que
  // de la laisser remonter brute.
  if (typeof generateur.invariants === "function") {
    let respectes;
    try {
      respectes = generateur.invariants(produit, parametres);
    } catch (erreur) {
      erreurs.push(`invariants : le contrôle a échoué (${erreur.message})`);
      return { valide: false, erreurs };
    }
    if (respectes === false) {
      erreurs.push("invariants : la question produite ne les respecte pas");
    } else if (Array.isArray(respectes) && respectes.length > 0) {
      erreurs.push(...respectes.map((r) => `invariants : ${r}`));
    }
  }

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Erreur levée quand un générateur n'arrive pas à honorer un gabarit
 * dans le nombre d'essais autorisé (§8.6).
 *
 * On distingue deux situations, parce qu'elles n'appellent pas la même
 * réaction : une contrainte IMPOSSIBLE est un bug de gabarit à corriger ;
 * un épuisement d'essais peut n'être qu'un tirage malheureux.
 */
export class EchecDeGeneration extends Error {
  /**
   * @param {string} message
   * @param {{ generateur: string, gabarit?: string, essais: number, impossible?: boolean }} details
   */
  constructor(message, details) {
    super(message);
    this.name = "EchecDeGeneration";
    this.generateur = details.generateur;
    this.gabarit = details.gabarit ?? null;
    this.essais = details.essais;
    this.impossible = details.impossible === true;
  }
}
