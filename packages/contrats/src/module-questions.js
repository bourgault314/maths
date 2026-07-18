// Contrat « module de questions » — version 1 (cahier des charges §3.1).
//
// Un module est un CONTENEUR PUBLIC STABLE : son identifiant et son code
// de série ne bougent pas, car ils circulent dans les codes partagés et
// dans le menu. Mais l'unité de travail et de validation est la NOTION
// ATOMIQUE (§1.3) : un module n'est déclaré entièrement reconstruit que
// lorsque toutes ses notions ont quitté le noyau hérité.
//
// Un module ne contient QUE des données : ni fonction, ni formula_code,
// ni SVG, ni HTML (§9.1). Il référence des générateurs et des objets
// officiels par leur nom ; il ne les embarque pas.
//
// RÈGLE DE VALIDATION : `validation.etat` ne vaut « valide » que si
// Gwenaël l'a posé lui-même. Aucun assistant ne pose cette valeur
// (décision du 18/07/2026, §11.7).

export const SCHEMA_MODULE_QUESTIONS = "mathsgo.module-questions/1";

export const DOMAINES = [
  "nombres-calculs",
  "algebre",
  "proportionnalite-grandeurs",
  "espace-geometrie",
  "donnees-probabilites",
  "informatique",
  "jeux-recherches",
];

export const NIVEAUX = ["CM1", "CM2", "6e", "5e", "4e", "3e", "DNB"];

export const POLITIQUES_CALCULATRICE = ["interdite", "autorisee", "necessaire"];

/** Statuts de provenance (alignés sur packages/objets/src/provenance.js). */
export const PROVENANCES = ["origine-mathsgo", "reconstruit", "herite", "a-reconstruire"];

/** Une notion n'est visible des élèves qu'une fois « valide » (§7). */
export const ETATS_VALIDATION = ["brouillon", "a-valider", "valide"];

const IDENTIFIANT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function verifierTexte(valeur, nom, erreurs) {
  if (typeof valeur !== "string" || valeur.trim().length === 0) {
    erreurs.push(`${nom} : texte non vide requis`);
  }
}

function verifierIdentifiant(valeur, nom, erreurs) {
  if (typeof valeur !== "string" || !IDENTIFIANT.test(valeur)) {
    erreurs.push(`${nom} : identifiant en minuscules-avec-tirets requis, reçu « ${valeur} »`);
  }
}

function verifierListe(valeur, nom, erreurs, { valeursAutorisees, auMoinsUn = true } = {}) {
  if (!Array.isArray(valeur)) {
    erreurs.push(`${nom} : liste attendue`);
    return;
  }
  if (auMoinsUn && valeur.length === 0) erreurs.push(`${nom} : au moins un élément requis`);
  if (valeursAutorisees) {
    for (const v of valeur) {
      if (!valeursAutorisees.includes(v)) {
        erreurs.push(`${nom} : valeur inconnue « ${v} »`);
      }
    }
  }
}

function verifierValidation(validation, nom, erreurs) {
  if (typeof validation !== "object" || validation === null) {
    erreurs.push(`${nom} : objet attendu { etat, date, auteur }`);
    return;
  }
  if (!ETATS_VALIDATION.includes(validation.etat)) {
    erreurs.push(`${nom}.etat : « brouillon », « a-valider » ou « valide » attendu`);
  }
  if (validation.etat === "valide") {
    // Une validation ne vaut que si elle porte une date et un auteur : elle
    // engage quelqu'un.
    verifierTexte(validation.date, `${nom}.date`, erreurs);
    verifierTexte(validation.auteur, `${nom}.auteur`, erreurs);
  }
}

/** Une notion atomique (§3.2) — l'unité réelle de travail et de validation. */
function validerNotion(notion, index, erreurs) {
  const nom = `notions[${index}]`;
  if (typeof notion !== "object" || notion === null) {
    erreurs.push(`${nom} : objet attendu`);
    return;
  }
  verifierIdentifiant(notion.id, `${nom}.id`, erreurs);
  verifierTexte(notion.savoirFaire, `${nom}.savoirFaire`, erreurs);

  // Ce qui est enseigné n'est pas forcément ce qui doit devenir automatique.
  if (typeof notion.enseigne !== "boolean") erreurs.push(`${nom}.enseigne : booléen requis`);
  if (typeof notion.automatise !== "boolean") erreurs.push(`${nom}.automatise : booléen requis`);

  // La correspondance au BO se porte au niveau de la NOTION, pas du module.
  if (!Array.isArray(notion.automatismesBO)) {
    erreurs.push(`${nom}.automatismesBO : liste attendue (vide si hors automatismes)`);
  }
  if (notion.automatise === true && (notion.automatismesBO ?? []).length === 0
    && notion.horsAutomatismeBO !== true) {
    erreurs.push(
      `${nom} : notion déclarée automatisable sans identifiant du BO — ajouter l'identifiant ou horsAutomatismeBO: true`,
    );
  }

  verifierListe(notion.paliers, `${nom}.paliers`, erreurs);
  verifierListe(notion.famillesDeCas, `${nom}.famillesDeCas`, erreurs);
  if (notion.prerequis !== undefined) {
    verifierListe(notion.prerequis, `${nom}.prerequis`, erreurs, { auMoinsUn: false });
  }
  if (notion.modelesErreurs !== undefined) {
    verifierListe(notion.modelesErreurs, `${nom}.modelesErreurs`, erreurs, { auMoinsUn: false });
  }
  verifierValidation(notion.validation, `${nom}.validation`, erreurs);
}

/** Un gabarit (§3.3) : une famille de questions, en données seulement. */
function validerGabarit(gabarit, index, notionsConnues, erreurs) {
  const nom = `gabarits[${index}]`;
  if (typeof gabarit !== "object" || gabarit === null) {
    erreurs.push(`${nom} : objet attendu`);
    return;
  }
  verifierIdentifiant(gabarit.id, `${nom}.id`, erreurs);
  if (!notionsConnues.has(gabarit.notion)) {
    erreurs.push(`${nom}.notion : notion inconnue « ${gabarit.notion} »`);
  }
  verifierTexte(gabarit.generateur, `${nom}.generateur`, erreurs);
  if (!Number.isInteger(gabarit.palier) || gabarit.palier < 1) {
    erreurs.push(`${nom}.palier : entier ≥ 1 requis`);
  }
  if (typeof gabarit.parametres !== "object" || gabarit.parametres === null) {
    erreurs.push(`${nom}.parametres : objet attendu`);
  }
  verifierTexte(gabarit.reponse, `${nom}.reponse`, erreurs);
  verifierValidation(gabarit.validation, `${nom}.validation`, erreurs);
}

/** Rien d'exécutable ni de balisé ne doit entrer dans la banque (§9.1). */
function verifierDonneesPures(module, erreurs) {
  const parcourir = (valeur, chemin) => {
    if (typeof valeur === "function") {
      erreurs.push(`${chemin} : aucune fonction n'est autorisée dans un module`);
      return;
    }
    if (typeof valeur === "string") {
      if (/<svg|<\/svg>|<div|<span|<img/i.test(valeur)) {
        erreurs.push(`${chemin} : aucun SVG ni HTML brut dans un module`);
      }
      if (/formula_code/.test(valeur)) {
        erreurs.push(`${chemin} : aucun formula_code dans un module V2`);
      }
      return;
    }
    if (valeur && typeof valeur === "object") {
      for (const [cle, sous] of Object.entries(valeur)) {
        if (cle === "formula_code") {
          erreurs.push(`${chemin}.${cle} : aucun formula_code dans un module V2`);
        }
        parcourir(sous, `${chemin}.${cle}`);
      }
    }
  };
  parcourir(module, "module");
}

/**
 * Valide un module de questions V2.
 * @param {unknown} module
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerModuleQuestions(module) {
  const erreurs = [];
  if (typeof module !== "object" || module === null) {
    return { valide: false, erreurs: ["module : objet attendu"] };
  }
  const m = /** @type {Record<string, any>} */ (module);

  if (m.schema !== SCHEMA_MODULE_QUESTIONS) {
    erreurs.push(`schema : « ${SCHEMA_MODULE_QUESTIONS} » attendu, reçu « ${m.schema} »`);
  }
  verifierIdentifiant(m.id, "id", erreurs);
  if (!Number.isInteger(m.version) || m.version < 1) {
    erreurs.push("version : entier ≥ 1 requis");
  }
  if (!Number.isInteger(m.codeSerie) || m.codeSerie < 0) {
    erreurs.push("codeSerie : code numérique permanent requis");
  }
  verifierTexte(m.titre, "titre", erreurs);
  if (!DOMAINES.includes(m.domaine)) {
    erreurs.push(`domaine : domaine maths&go inconnu « ${m.domaine} »`);
  }
  verifierListe(m.niveaux, "niveaux", erreurs, { valeursAutorisees: NIVEAUX });
  if (m.legacyIds !== undefined) {
    verifierListe(m.legacyIds, "legacyIds", erreurs, { auMoinsUn: false });
  }
  if (!POLITIQUES_CALCULATRICE.includes(m.calculatrice)) {
    erreurs.push(`calculatrice : « interdite », « autorisee » ou « necessaire » attendu`);
  }
  if (!PROVENANCES.includes(m.provenance)) {
    erreurs.push(`provenance : statut inconnu « ${m.provenance} »`);
  }
  verifierValidation(m.validation, "validation", erreurs);

  // Notions puis gabarits (les gabarits référencent les notions).
  const notionsConnues = new Set();
  if (!Array.isArray(m.notions) || m.notions.length === 0) {
    erreurs.push("notions : au moins une notion atomique requise");
  } else {
    m.notions.forEach((notion, i) => {
      validerNotion(notion, i, erreurs);
      if (typeof notion?.id === "string") {
        if (notionsConnues.has(notion.id)) erreurs.push(`notions[${i}].id : doublon « ${notion.id} »`);
        notionsConnues.add(notion.id);
      }
    });
  }

  if (!Array.isArray(m.gabarits) || m.gabarits.length === 0) {
    erreurs.push("gabarits : au moins un gabarit requis");
  } else {
    const idsVus = new Set();
    m.gabarits.forEach((gabarit, i) => {
      validerGabarit(gabarit, i, notionsConnues, erreurs);
      if (typeof gabarit?.id === "string") {
        if (idsVus.has(gabarit.id)) erreurs.push(`gabarits[${i}].id : doublon « ${gabarit.id} »`);
        idsVus.add(gabarit.id);
      }
    });
    // Une notion sans gabarit ne produit aucune question : c'est une erreur.
    for (const notionId of notionsConnues) {
      if (!m.gabarits.some((g) => g?.notion === notionId)) {
        erreurs.push(`notions : « ${notionId} » n'a aucun gabarit`);
      }
    }
  }

  verifierDonneesPures(m, erreurs);
  return { valide: erreurs.length === 0, erreurs };
}

/** Les notions qu'un élève peut réellement rencontrer (validées seulement). */
export function notionsPubliables(module) {
  return (module.notions ?? []).filter((n) => n?.validation?.etat === "valide");
}

/** Un module n'est reconstruit que si TOUTES ses notions le sont (§1.3). */
export function moduleEntierementReconstruit(module) {
  const notions = module.notions ?? [];
  return notions.length > 0 && notions.every((n) => n?.provenance !== "herite");
}
