// Contrat « question instanciée » — version 2.
//
// La version 1 reste INTACTE et continue de servir : elle ne connaît que
// les blocs texte/LaTeX et la réponse « texte-exact ». La version 2 ajoute
// ce que le générateur V2 exige (cahier des charges §3.6) :
//
//   — des blocs « objet » qui RÉFÉRENCENT un objet visuel maths&go
//     (jamais un SVG en dur : la question porte les données sémantiques,
//     le rendu produit le dessin) ;
//   — des réponses TYPÉES avec une valeur canonique exacte, séparée de
//     sa forme affichée (§3.5 : jamais de flottant approximatif) ;
//   — des modèles d'erreurs (§5) : les distracteurs deviennent des
//     diagnostics, pas des cases à cocher ;
//   — trois niveaux d'aide (§6.2) ;
//   — la traçabilité complète des versions (§4.7).
//
// Une question instanciée reste une DONNÉE PURE : aucune fonction, aucun
// SVG, aucun HTML n'y circule.

export const SCHEMA_QUESTION_INSTANCE_2 = "mathsgo.question-instance/2";

/** Un bloc « objet » nomme un objet officiel ; il ne contient pas son dessin. */
export const TYPES_DE_BLOC_2 = ["texte", "latex", "objet"];

/**
 * Formes de réponses (§3.4). La réponse est PRODUITE par l'élève.
 * « selection-diviseurs » est la seule situation où des propositions
 * visibles remplacent la saisie.
 */
export const TYPES_DE_REPONSE_2 = [
  "entier",
  "decimal",
  "fraction",
  "expression",
  "coordonnees",
  "mesure",
  "texte-court",
  "selection-diviseurs",
];

/** Rôle d'un visuel (§6.1) : une donnée indispensable n'est jamais une aide. */
export const ROLES_VISUEL = ["donnee", "representation", "correction"];

export const NIVEAUX_AIDE = [1, 2, 3];

// ---------------------------------------------------------------------------
// Valeurs canoniques exactes (§3.5)
// ---------------------------------------------------------------------------

/** Entier exact. */
export function valeurEntier(valeur) {
  if (!Number.isSafeInteger(valeur)) {
    throw new RangeError(`valeurEntier : entier sûr attendu, reçu ${valeur}`);
  }
  return { type: "entier", valeur: valeur === 0 ? 0 : valeur };
}

/**
 * Décimal fini exact : mantisse entière et nombre de décimales.
 * 2,30 s'écrit { mantisse: 230, decimales: 2 } — la valeur vaut
 * mantisse / 10^decimales, sans jamais passer par un flottant.
 */
export function valeurDecimal(mantisse, decimales = 0) {
  if (!Number.isSafeInteger(mantisse)) {
    throw new RangeError(`valeurDecimal : mantisse entière attendue, reçu ${mantisse}`);
  }
  if (!Number.isInteger(decimales) || decimales < 0 || decimales > 12) {
    throw new RangeError(`valeurDecimal : décimales entre 0 et 12 attendues, reçu ${decimales}`);
  }
  return { type: "decimal", mantisse: mantisse === 0 ? 0 : mantisse, decimales };
}

function pgcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const r = x % y;
    x = y;
    y = r;
  }
  return x;
}

/**
 * Fraction exacte, normalisée : dénominateur strictement positif, signe
 * porté par le numérateur, réduite si `reduire` (défaut : oui).
 */
export function valeurFraction(numerateur, denominateur, { reduire = true } = {}) {
  if (!Number.isSafeInteger(numerateur) || !Number.isSafeInteger(denominateur)) {
    throw new RangeError("valeurFraction : entiers sûrs attendus");
  }
  if (denominateur === 0) {
    throw new RangeError("valeurFraction : dénominateur nul interdit");
  }
  let n = numerateur;
  let d = denominateur;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  if (reduire) {
    const g = pgcd(n, d) || 1;
    n /= g;
    d /= g;
  }
  return { type: "fraction", numerateur: n === 0 ? 0 : n, denominateur: d };
}

/** Sélection de diviseurs : les propositions offertes et celles attendues. */
export function valeurSelectionDiviseurs(proposes, attendus) {
  if (!Array.isArray(proposes) || proposes.length === 0) {
    throw new RangeError("valeurSelectionDiviseurs : propositions non vides attendues");
  }
  if (!Array.isArray(attendus)) {
    throw new RangeError("valeurSelectionDiviseurs : liste attendue");
  }
  const hors = attendus.filter((a) => !proposes.includes(a));
  if (hors.length > 0) {
    throw new RangeError(`valeurSelectionDiviseurs : attendus hors propositions (${hors.join(", ")})`);
  }
  return {
    type: "selection-diviseurs",
    proposes: [...proposes],
    attendus: [...attendus].sort((a, b) => a - b),
  };
}

/** Compare deux valeurs canoniques — exactement, sans flottant. */
export function memeValeur(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === "entier") return a.valeur === b.valeur;
  if (a.type === "decimal") {
    const d = Math.max(a.decimales, b.decimales);
    return a.mantisse * 10 ** (d - a.decimales) === b.mantisse * 10 ** (d - b.decimales);
  }
  if (a.type === "fraction") {
    return a.numerateur * b.denominateur === b.numerateur * a.denominateur;
  }
  if (a.type === "selection-diviseurs") {
    return a.attendus.length === b.attendus.length
      && a.attendus.every((v, i) => v === b.attendus[i]);
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Écriture française d'une valeur canonique (virgule, jamais de −0). */
export function ecrireValeur(valeur) {
  if (!valeur) return "";
  if (valeur.type === "entier") return String(valeur.valeur);
  if (valeur.type === "decimal") {
    if (valeur.decimales === 0) return String(valeur.mantisse);
    const signe = valeur.mantisse < 0 ? "-" : "";
    const chiffres = String(Math.abs(valeur.mantisse)).padStart(valeur.decimales + 1, "0");
    const coupe = chiffres.length - valeur.decimales;
    return `${signe}${chiffres.slice(0, coupe)},${chiffres.slice(coupe)}`;
  }
  if (valeur.type === "fraction") {
    return valeur.denominateur === 1
      ? String(valeur.numerateur)
      : `${valeur.numerateur}/${valeur.denominateur}`;
  }
  if (valeur.type === "selection-diviseurs") return valeur.attendus.join(" ; ");
  return "";
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validerBlocs(blocs, nom, erreurs, { auMoinsUn }) {
  if (!Array.isArray(blocs)) {
    erreurs.push(`${nom} : liste de blocs attendue`);
    return;
  }
  if (auMoinsUn && blocs.length === 0) erreurs.push(`${nom} : au moins un bloc est requis`);
  blocs.forEach((bloc, i) => {
    if (typeof bloc !== "object" || bloc === null) {
      erreurs.push(`${nom}[${i}] : bloc attendu`);
      return;
    }
    if (!TYPES_DE_BLOC_2.includes(bloc.type)) {
      erreurs.push(`${nom}[${i}] : type de bloc inconnu « ${bloc.type} »`);
      return;
    }
    if (bloc.type === "objet") {
      if (typeof bloc.objet !== "string" || bloc.objet.length === 0) {
        erreurs.push(`${nom}[${i}] : un bloc objet doit nommer un objet officiel`);
      }
      if (!ROLES_VISUEL.includes(bloc.role)) {
        erreurs.push(`${nom}[${i}] : rôle de visuel inconnu « ${bloc.role} »`);
      }
      if (bloc.donnees !== undefined && (typeof bloc.donnees !== "object" || bloc.donnees === null)) {
        erreurs.push(`${nom}[${i}] : donnees doit être un objet`);
      }
      if (/<svg|<div|<span/i.test(JSON.stringify(bloc.donnees ?? {}))) {
        erreurs.push(`${nom}[${i}] : aucun SVG ni HTML brut dans une question`);
      }
    } else if (typeof bloc.contenu !== "string" || bloc.contenu.length === 0) {
      erreurs.push(`${nom}[${i}] : contenu texte non vide requis`);
    }
  });
}

function validerValeurCanonique(valeur, nom, erreurs) {
  if (typeof valeur !== "object" || valeur === null) {
    erreurs.push(`${nom} : valeur canonique attendue`);
    return;
  }
  if (valeur.type === "fraction" && valeur.denominateur <= 0) {
    erreurs.push(`${nom} : dénominateur strictement positif attendu`);
  }
  if (valeur.type === "decimal" && !Number.isSafeInteger(valeur.mantisse)) {
    erreurs.push(`${nom} : mantisse entière attendue`);
  }
  if (Object.is(valeur.valeur, -0) || Object.is(valeur.mantisse, -0) || Object.is(valeur.numerateur, -0)) {
    erreurs.push(`${nom} : −0 interdit, écrire 0`);
  }
}

/**
 * Valide une question instanciée contre la version 2 du contrat.
 * Ne modifie rien ; renvoie la liste complète des problèmes trouvés.
 * @param {unknown} question
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerQuestionInstance2(question) {
  const erreurs = [];
  if (typeof question !== "object" || question === null) {
    return { valide: false, erreurs: ["question : objet attendu"] };
  }
  const q = /** @type {Record<string, any>} */ (question);

  if (q.schema !== SCHEMA_QUESTION_INSTANCE_2) {
    erreurs.push(`schema : « ${SCHEMA_QUESTION_INSTANCE_2} » attendu, reçu « ${q.schema} »`);
  }
  if (typeof q.id !== "string" || q.id.trim().length === 0) {
    erreurs.push("id : identifiant texte non vide requis");
  }

  // Cible : une question sait toujours quelle notion elle travaille.
  if (typeof q.cible !== "object" || q.cible === null) {
    erreurs.push("cible : objet attendu (module, notion, automatismeBO)");
  } else {
    for (const champ of ["module", "notion"]) {
      if (typeof q.cible[champ] !== "string" || q.cible[champ].length === 0) {
        erreurs.push(`cible.${champ} : identifiant requis`);
      }
    }
    if (q.cible.automatismeBO !== undefined && q.cible.automatismeBO !== null
      && typeof q.cible.automatismeBO !== "string") {
      erreurs.push("cible.automatismeBO : identifiant du programme ou null");
    }
  }

  validerBlocs(q.enonce, "enonce", erreurs, { auMoinsUn: true });

  // Réponse typée, avec valeur canonique exacte.
  if (typeof q.reponse !== "object" || q.reponse === null) {
    erreurs.push("reponse : objet attendu");
  } else {
    if (!TYPES_DE_REPONSE_2.includes(q.reponse.type)) {
      erreurs.push(`reponse.type : type inconnu « ${q.reponse.type} »`);
    }
    validerValeurCanonique(q.reponse.valeur, "reponse.valeur", erreurs);
    if (q.reponse.valeur?.type && q.reponse.type && q.reponse.valeur.type !== q.reponse.type) {
      erreurs.push(
        `reponse : type « ${q.reponse.type} » mais valeur de type « ${q.reponse.valeur.type} »`,
      );
    }
  }

  // Modèles d'erreurs : jamais égaux à la bonne réponse (§5.4).
  if (q.modelesErreurs !== undefined) {
    if (!Array.isArray(q.modelesErreurs)) {
      erreurs.push("modelesErreurs : liste attendue");
    } else {
      const vues = [];
      q.modelesErreurs.forEach((modele, i) => {
        if (typeof modele?.id !== "string" || modele.id.length === 0) {
          erreurs.push(`modelesErreurs[${i}].id : identifiant requis`);
        }
        validerValeurCanonique(modele?.valeur, `modelesErreurs[${i}].valeur`, erreurs);
        if (q.reponse?.valeur && memeValeur(modele?.valeur, q.reponse.valeur)) {
          erreurs.push(`modelesErreurs[${i}] : identique à la réponse exacte`);
        }
        if (vues.some((v) => memeValeur(v, modele?.valeur))) {
          erreurs.push(`modelesErreurs[${i}] : doublon avec un autre modèle`);
        }
        vues.push(modele?.valeur);
      });
    }
  }

  // Aides : niveaux 1 à 3, sans doublon.
  if (q.aides !== undefined) {
    if (!Array.isArray(q.aides)) {
      erreurs.push("aides : liste attendue");
    } else {
      const niveauxVus = new Set();
      q.aides.forEach((aide, i) => {
        if (!NIVEAUX_AIDE.includes(aide?.niveau)) {
          erreurs.push(`aides[${i}].niveau : 1, 2 ou 3 attendu`);
        } else if (niveauxVus.has(aide.niveau)) {
          erreurs.push(`aides[${i}] : niveau ${aide.niveau} déjà déclaré`);
        } else {
          niveauxVus.add(aide.niveau);
        }
        validerBlocs(aide?.blocs, `aides[${i}].blocs`, erreurs, { auMoinsUn: true });
      });
    }
  }

  if (q.correction !== undefined) {
    validerBlocs(q.correction, "correction", erreurs, { auMoinsUn: false });
  }

  // Traçabilité : on doit pouvoir rejouer une question à l'identique.
  if (typeof q.tracabilite !== "object" || q.tracabilite === null) {
    erreurs.push("tracabilite : objet attendu (versions et graine)");
  } else {
    for (const champ of ["generateur", "gabarit", "aleatoire"]) {
      if (!Number.isInteger(q.tracabilite[champ])) {
        erreurs.push(`tracabilite.${champ} : numéro de version entier requis`);
      }
    }
    if (q.tracabilite.graine === undefined) {
      erreurs.push("tracabilite.graine : graine requise");
    }
  }

  // Aucune fonction ne doit circuler.
  const chercherFonction = (valeur, chemin) => {
    if (typeof valeur === "function") {
      erreurs.push(`${chemin} : aucune fonction ne peut circuler dans une question`);
      return;
    }
    if (valeur && typeof valeur === "object") {
      for (const [cle, sousValeur] of Object.entries(valeur)) {
        chercherFonction(sousValeur, `${chemin}.${cle}`);
      }
    }
  };
  chercherFonction(q, "question");

  return { valide: erreurs.length === 0, erreurs };
}
