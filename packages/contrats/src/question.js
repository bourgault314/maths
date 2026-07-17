// Contrat « question instanciée » — version 1.
//
// Une question instanciée est une question PRÊTE À AFFICHER : tous les
// nombres sont tirés, tous les textes sont définitifs. C'est le format
// d'échange entre le générateur (qui la produit), le lecteur (qui
// l'affiche), le correcteur (qui juge la réponse) et le Studio (qui la
// prévisualise). Aucun code n'y circule : uniquement des données.
//
// Structure :
// {
//   schema: "mathsgo.question-instance/1",
//   id: "dnb_01#3",                      // identifiant stable et lisible
//   enonce: [bloc, ...],                 // au moins un bloc
//   reponse: {
//     type: "texte-exact",               // seul type de la version 1
//     champs: [{ valeursAcceptees: ["0,75", "3/4"] }, ...],
//   },
//   aide?: [bloc, ...],                  // facultatif
//   correction?: [bloc, ...],            // facultatif
//   origine?: { ... },                   // traçabilité libre (module V1,
//                                        //   graine, version du générateur…)
// }
//
// Un bloc est { type: "texte" | "latex", contenu: "..." }.
// Dans un bloc latex, chaque « [[reponse]] » est un trou à compléter ;
// le i-ième trou correspond à reponse.champs[i]. Une question sans trou
// affiche un champ de réponse unique sous l'énoncé (et doit donc déclarer
// exactement un champ).
//
// Évolution : tout ajout incompatible (nouveau type de réponse, nouveau
// type de bloc…) doit passer par une nouvelle version du schéma, jamais
// par une modification silencieuse de celle-ci.

export const SCHEMA_QUESTION_INSTANCE = "mathsgo.question-instance/1";

export const TYPES_DE_BLOC = ["texte", "latex"];
export const TYPES_DE_REPONSE = ["texte-exact"];

const MARQUEUR_TROU = /\[\[reponse\]\]/g;

/**
 * Compte les trous « [[reponse]] » déclarés dans les blocs d'énoncé.
 * @param {Array<{type: string, contenu: string}>} blocs
 */
export function compterTrous(blocs) {
  return blocs.reduce(
    (total, bloc) =>
      total + (typeof bloc.contenu === "string"
        ? (bloc.contenu.match(MARQUEUR_TROU) || []).length
        : 0),
    0,
  );
}

function validerBlocs(blocs, nom, erreurs, { auMoinsUn }) {
  if (!Array.isArray(blocs)) {
    erreurs.push(`${nom} : liste de blocs attendue`);
    return;
  }
  if (auMoinsUn && blocs.length === 0) {
    erreurs.push(`${nom} : au moins un bloc est requis`);
  }
  blocs.forEach((bloc, i) => {
    if (typeof bloc !== "object" || bloc === null) {
      erreurs.push(`${nom}[${i}] : bloc attendu`);
      return;
    }
    if (!TYPES_DE_BLOC.includes(bloc.type)) {
      erreurs.push(`${nom}[${i}] : type de bloc inconnu « ${bloc.type} »`);
    }
    if (typeof bloc.contenu !== "string" || bloc.contenu.length === 0) {
      erreurs.push(`${nom}[${i}] : contenu texte non vide requis`);
    }
  });
}

/**
 * Valide une question instanciée contre la version 1 du contrat.
 * Ne modifie rien ; renvoie la liste complète des problèmes trouvés.
 * @param {unknown} question
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerQuestionInstance(question) {
  const erreurs = [];

  if (typeof question !== "object" || question === null) {
    return { valide: false, erreurs: ["question : objet attendu"] };
  }
  const q = /** @type {Record<string, any>} */ (question);

  if (q.schema !== SCHEMA_QUESTION_INSTANCE) {
    erreurs.push(
      `schema : « ${SCHEMA_QUESTION_INSTANCE} » attendu, reçu « ${q.schema} »`,
    );
  }
  if (typeof q.id !== "string" || q.id.trim().length === 0) {
    erreurs.push("id : identifiant texte non vide requis");
  }

  validerBlocs(q.enonce, "enonce", erreurs, { auMoinsUn: true });
  if (q.aide !== undefined) validerBlocs(q.aide, "aide", erreurs, { auMoinsUn: false });
  if (q.correction !== undefined) {
    validerBlocs(q.correction, "correction", erreurs, { auMoinsUn: false });
  }

  if (typeof q.reponse !== "object" || q.reponse === null) {
    erreurs.push("reponse : objet attendu");
  } else {
    if (!TYPES_DE_REPONSE.includes(q.reponse.type)) {
      erreurs.push(`reponse.type : type inconnu « ${q.reponse.type} »`);
    }
    if (!Array.isArray(q.reponse.champs) || q.reponse.champs.length === 0) {
      erreurs.push("reponse.champs : au moins un champ est requis");
    } else {
      q.reponse.champs.forEach((champ, i) => {
        const valeurs = champ?.valeursAcceptees;
        if (!Array.isArray(valeurs) || valeurs.length === 0) {
          erreurs.push(`reponse.champs[${i}] : valeursAcceptees non vide requis`);
        } else if (valeurs.some((v) => typeof v !== "string" || v.length === 0)) {
          erreurs.push(`reponse.champs[${i}] : chaque valeur acceptée doit être un texte non vide`);
        }
      });

      if (Array.isArray(q.enonce)) {
        const trous = compterTrous(q.enonce);
        if (trous > 0 && trous !== q.reponse.champs.length) {
          erreurs.push(
            `enonce : ${trous} trou(s) [[reponse]] pour ${q.reponse.champs.length} champ(s) déclaré(s)`,
          );
        }
        if (trous === 0 && q.reponse.champs.length !== 1) {
          erreurs.push(
            "reponse : sans trou dans l'énoncé, exactement un champ est attendu",
          );
        }
      }
    }
  }

  return { valide: erreurs.length === 0, erreurs };
}
