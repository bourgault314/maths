// Contrat « gabarit de question » — version 1.
//
// Un gabarit décrit une FAMILLE de questions à valeurs variables. C'est une
// donnée pure : il ne contient AUCUN code. Il référence par son nom un
// générateur — une fonction écrite, relue et testée dans le moteur
// d'exercices — et lui transmet des paramètres. Les contenus ne peuvent que
// choisir un générateur enregistré et le paramétrer ; tout le code reste
// versionné dans Git.
//
// Structure :
// {
//   schema: "mathsgo.gabarit-question/1",
//   id: "fixture.question-variable",     // identifiant stable, en minuscules
//                                        //   (lettres, chiffres, points,
//                                        //   tirets)
//   version: 1,                          // version du gabarit lui-même
//   titre: "Fixture technique",          // pour le Studio et les listes
//   generateur: { nom: "fixture.echo", version: 1 },
//   parametres: { ... },                 // objet libre, validé par le
//                                        //   générateur à l'instanciation
// }

export const SCHEMA_GABARIT_QUESTION = "mathsgo.gabarit-question/1";

const FORMAT_IDENTIFIANT = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

/**
 * Vérifie le format commun des identifiants de gabarit et de générateur.
 * @param {unknown} identifiant
 * @returns {identifiant is string}
 */
export function estIdentifiantValide(identifiant) {
  return (
    typeof identifiant === "string" &&
    identifiant.length <= 128 &&
    FORMAT_IDENTIFIANT.test(identifiant)
  );
}

/**
 * Vrai si la valeur est une donnée pure : null, booléen, nombre fini,
 * texte, tableau ou objet simple de données pures. Tout le reste
 * (fonction, date, classe, nombre infini…) est refusé.
 * @param {unknown} valeur
 * @returns {boolean}
 */
export function estDonneePure(valeur) {
  return verifierDonneePure(valeur, new WeakSet());
}

/**
 * @param {unknown} valeur
 * @param {WeakSet<object>} chemin
 * @returns {boolean}
 */
function verifierDonneePure(valeur, chemin) {
  if (valeur === null) return true;
  const type = typeof valeur;
  if (type === "boolean" || type === "string") return true;
  if (type === "number") return Number.isFinite(valeur);
  if (type !== "object") return false;

  const objet = /** @type {object} */ (valeur);
  if (chemin.has(objet)) return false;

  if (!Array.isArray(objet) && Object.getPrototypeOf(objet) !== Object.prototype) {
    return false;
  }
  const cles = Reflect.ownKeys(objet);
  if (cles.some((cle) => typeof cle === "symbol")) return false;

  if (Array.isArray(objet)) {
    if (cles.length !== objet.length + 1 || !cles.includes("length")) return false;
    for (let i = 0; i < objet.length; i++) {
      if (!Object.hasOwn(objet, i)) return false;
    }
  }

  const descripteurs = Object.entries(Object.getOwnPropertyDescriptors(objet))
    .filter(([cle]) => !Array.isArray(objet) || cle !== "length")
    .map(([, descripteur]) => descripteur);
  if (
    descripteurs.some(
      (descripteur) =>
        !descripteur.enumerable ||
        !("value" in descripteur) ||
        typeof descripteur.get === "function" ||
        typeof descripteur.set === "function",
    )
  ) {
    return false;
  }

  chemin.add(objet);
  const pure = Object.values(objet).every((element) =>
    verifierDonneePure(element, chemin),
  );
  chemin.delete(objet);
  return pure;
}

/**
 * Valide un gabarit de question contre la version 1 du contrat.
 * @param {unknown} gabarit
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerGabarit(gabarit) {
  const erreurs = [];

  if (typeof gabarit !== "object" || gabarit === null) {
    return { valide: false, erreurs: ["gabarit : objet attendu"] };
  }
  const g = /** @type {Record<string, any>} */ (gabarit);

  if (g.schema !== SCHEMA_GABARIT_QUESTION) {
    erreurs.push(
      `schema : « ${SCHEMA_GABARIT_QUESTION} » attendu, reçu « ${g.schema} »`,
    );
  }
  if (!estIdentifiantValide(g.id)) {
    erreurs.push(
      "id : identifiant en minuscules de 1 à 128 caractères requis (lettres, chiffres, points, tirets)",
    );
  }
  if (!Number.isInteger(g.version) || g.version < 1) {
    erreurs.push("version : entier ≥ 1 requis");
  }
  if (typeof g.titre !== "string" || g.titre.trim().length === 0) {
    erreurs.push("titre : texte non vide requis");
  }

  if (typeof g.generateur !== "object" || g.generateur === null) {
    erreurs.push("generateur : objet { nom, version } attendu");
  } else {
    if (!estIdentifiantValide(g.generateur.nom)) {
      erreurs.push("generateur.nom : identifiant en minuscules requis");
    }
    if (!Number.isInteger(g.generateur.version) || g.generateur.version < 1) {
      erreurs.push("generateur.version : entier ≥ 1 requis");
    }
  }

  if (typeof g.parametres !== "object" || g.parametres === null || Array.isArray(g.parametres)) {
    erreurs.push("parametres : objet attendu (éventuellement vide)");
  } else if (!estDonneePure(g.parametres)) {
    erreurs.push("parametres : données pures uniquement (pas de fonction, date ou objet spécial)");
  }

  return { valide: erreurs.length === 0, erreurs };
}
