// Contrat « gabarit de question » — version 1.
//
// Un gabarit décrit une FAMILLE de questions à valeurs variables :
// « simplifier une fraction tirée au hasard », « ajouter deux relatifs
// entre -10 et 10 »… Le gabarit est une donnée pure : il ne contient
// AUCUN code. Il référence par son nom un générateur — une fonction
// écrite, relue et testée dans le moteur d'exercices — et lui transmet
// des paramètres.
//
// C'est le remplaçant sûr du « formula_code » de l'ancien Automatismes,
// qui stockait des programmes sous forme de texte et les exécutait.
// Ici : les contenus (Studio, banques) ne peuvent que choisir un
// générateur existant et le paramétrer ; tout le code reste dans Git.
//
// Structure :
// {
//   schema: "mathsgo.gabarit-question/1",
//   id: "fractions.simplifier-simple",   // identifiant stable, en
//                                        //   minuscules (lettres, chiffres,
//                                        //   points, tirets)
//   version: 1,                          // version du gabarit lui-même
//   titre: "Simplifier une fraction",    // pour le Studio et les listes
//   generateur: { nom: "fractions.simplifier", version: 1 },
//   parametres: { ... },                 // objet libre, validé par le
//                                        //   générateur à l'instanciation
// }

export const SCHEMA_GABARIT_QUESTION = "mathsgo.gabarit-question/1";

const FORMAT_ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

/**
 * Vrai si la valeur est une donnée pure : null, booléen, nombre fini,
 * texte, tableau ou objet simple de données pures. Tout le reste
 * (fonction, date, classe, nombre infini…) est refusé.
 * @param {unknown} valeur
 * @returns {boolean}
 */
export function estDonneePure(valeur) {
  if (valeur === null) return true;
  const type = typeof valeur;
  if (type === "boolean" || type === "string") return true;
  if (type === "number") return Number.isFinite(valeur);
  if (Array.isArray(valeur)) return valeur.every(estDonneePure);
  if (type === "object") {
    if (Object.getPrototypeOf(valeur) !== Object.prototype) return false;
    return Object.values(valeur).every(estDonneePure);
  }
  return false;
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
  if (typeof g.id !== "string" || !FORMAT_ID.test(g.id)) {
    erreurs.push(
      "id : identifiant en minuscules requis (lettres, chiffres, points, tirets)",
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
    if (typeof g.generateur.nom !== "string" || !FORMAT_ID.test(g.generateur.nom)) {
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
