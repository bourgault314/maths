// Contrat « programme » — version 1 (cahier des charges V2 §4.4, §7.1).
//
// POURQUOI CE FICHIER EXISTE
//
// Un automatisme n'est pas vrai « en soi » : il est vrai pour un niveau,
// dans un programme, à partir d'une année. Le même élève de 3e ne relève
// pas du même texte officiel en 2027 et en 2029, et une session du DNB
// interroge un état du programme figé à sa date.
//
// La règle qui découle de tout cela : AUCUNE question, AUCUN générateur,
// AUCUN gabarit ne contient de logique de calendrier. Ils déclarent une
// RÉFÉRENCE (programme, version, niveau, identifiant officiel) ; c'est ce
// catalogue, et lui seul, qui répond à « est-ce actif en 2027-2028 ? ».
//
// Ce fichier ne contient donc aucune question et aucun contenu pédagogique :
// seulement l'ossature officielle et les règles de datation.

export const SCHEMA_PROGRAMME = "mathsgo.programme/1";

/** Les niveaux couverts, du plus jeune au plus âgé. */
export const NIVEAUX_PROGRAMME = ["CM1", "CM2", "6e", "5e", "4e", "3e"];

/**
 * Statut d'un item : ce qui est ENSEIGNÉ n'est pas ce qui doit devenir
 * AUTOMATIQUE. Le BO distingue les deux et nous devons le refléter :
 * Pythagore est enseigné en 4e mais n'est automatisme qu'en 3e.
 */
export const STATUTS_PROGRAMME = ["enseigne", "automatise"];

/**
 * Les programmes que le système doit savoir distinguer (§4.4).
 *
 * `entreeEnVigueur` donne, pour chaque niveau, la première année scolaire
 * où le texte s'applique. Les deux arrêtés fixent la montée en charge :
 * CM1 et 6e en 2025-2026, CM2 et 5e en 2026-2027, 4e en 2027-2028,
 * 3e en 2028-2029.
 */
export const PROGRAMMES = Object.freeze({
  "cycle3-2025": {
    id: "cycle3-2025",
    nom: "Programme de cycle 3 (BO du 16 avril 2025)",
    version: "2025",
    niveaux: ["CM1", "CM2", "6e"],
    entreeEnVigueur: { CM1: "2025-2026", "6e": "2025-2026", CM2: "2026-2027" },
    remplace: null,
  },
  "cycle4-2026": {
    id: "cycle4-2026",
    nom: "Programme de cycle 4 (BO du 5 mars 2026)",
    version: "2026",
    niveaux: ["5e", "4e", "3e"],
    entreeEnVigueur: { "5e": "2026-2027", "4e": "2027-2028", "3e": "2028-2029" },
    remplace: "cycle4-2020",
  },
  "cycle4-2020": {
    id: "cycle4-2020",
    nom: "Programme de cycle 4 (2020) — en extinction",
    version: "2020",
    niveaux: ["5e", "4e", "3e"],
    // Ce programme est celui qui s'applique TANT QUE le nouveau n'est pas
    // entré en vigueur pour le niveau considéré. Il n'a donc pas de date
    // d'entrée (il était déjà là) mais une date de sortie par niveau.
    entreeEnVigueur: { "5e": null, "4e": null, "3e": null },
    sortieDeVigueur: { "5e": "2026-2027", "4e": "2027-2028", "3e": "2028-2029" },
    remplace: null,
  },
});

/**
 * Profils du DNB : une session interroge un état daté du programme.
 * `programmes` liste les textes dont relèvent les candidats de la session.
 *
 * Rien ici n'est un contenu pédagogique : c'est la carte d'identité d'une
 * session, qui sert à filtrer ce qu'on a le droit de proposer.
 */
export const PROFILS_DNB = Object.freeze({
  "dnb-2027": {
    id: "dnb-2027",
    session: 2027,
    anneeScolaire: "2026-2027",
    programmes: ["cycle4-2020"],
    note: "Les candidats de 2027 ont suivi la 3e sous le programme de 2020.",
  },
  "dnb-2029": {
    id: "dnb-2029",
    session: 2029,
    anneeScolaire: "2028-2029",
    programmes: ["cycle4-2026"],
    note: "Première session dont la 3e relève entièrement du programme de 2026.",
  },
});

// ---------------------------------------------------------------------------
// Années scolaires
// ---------------------------------------------------------------------------

const ANNEE_SCOLAIRE = /^(\d{4})-(\d{4})$/;

/**
 * Transforme « 2027-2028 » en un entier comparable (2027).
 * Refuse tout ce qui n'est pas une année scolaire bien formée : une
 * comparaison silencieusement fausse serait pire qu'une erreur.
 * @param {string} annee
 * @returns {number}
 */
export function rangAnneeScolaire(annee) {
  const trouve = ANNEE_SCOLAIRE.exec(String(annee ?? ""));
  if (!trouve) {
    throw new RangeError(`année scolaire « AAAA-AAAA » attendue, reçu « ${annee} »`);
  }
  const debut = Number(trouve[1]);
  const fin = Number(trouve[2]);
  if (fin !== debut + 1) {
    throw new RangeError(`année scolaire incohérente : « ${annee} »`);
  }
  return debut;
}

/**
 * Le programme qui s'applique à un niveau pour une année scolaire donnée.
 * Renvoie null si aucun programme connu ne couvre ce couple.
 * @param {string} niveau @param {string} anneeScolaire
 */
export function programmeEnVigueur(niveau, anneeScolaire) {
  const rang = rangAnneeScolaire(anneeScolaire);
  const candidats = Object.values(PROGRAMMES).filter((p) => p.niveaux.includes(niveau));

  // Un programme neuf l'emporte dès son entrée en vigueur ; sinon on reste
  // sur le texte en extinction, tant qu'il n'est pas sorti.
  const neuf = candidats.find((p) => {
    const entree = p.entreeEnVigueur?.[niveau];
    return entree != null && rang >= rangAnneeScolaire(entree);
  });
  if (neuf) return neuf;

  const ancien = candidats.find((p) => {
    const sortie = p.sortieDeVigueur?.[niveau];
    return sortie != null && rang < rangAnneeScolaire(sortie);
  });
  return ancien ?? null;
}

/**
 * Un item est-il actif pour cette année scolaire ?
 * C'est LA fonction qui remplace toute logique de calendrier dispersée
 * dans les questions.
 * @param {{ programme: string, niveau: string }} reference
 * @param {string} anneeScolaire
 */
export function estActif(reference, anneeScolaire) {
  if (!reference || typeof reference !== "object") return false;
  const enVigueur = programmeEnVigueur(reference.niveau, anneeScolaire);
  return enVigueur !== null && enVigueur.id === reference.programme;
}

/**
 * Les programmes dont relève une session du DNB.
 * @param {string} profilId
 */
export function programmesDuProfilDNB(profilId) {
  const profil = PROFILS_DNB[profilId];
  if (!profil) return [];
  return profil.programmes.map((id) => PROGRAMMES[id]).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Valide une référence au programme portée par une notion ou un gabarit.
 * @param {unknown} reference
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerReferenceProgramme(reference) {
  const erreurs = [];
  if (typeof reference !== "object" || reference === null) {
    return { valide: false, erreurs: ["reference : objet attendu"] };
  }
  const r = /** @type {Record<string, any>} */ (reference);

  const programme = PROGRAMMES[r.programme];
  if (!programme) {
    erreurs.push(`reference.programme : programme inconnu « ${r.programme} »`);
  }
  if (!NIVEAUX_PROGRAMME.includes(r.niveau)) {
    erreurs.push(`reference.niveau : niveau inconnu « ${r.niveau} »`);
  } else if (programme && !programme.niveaux.includes(r.niveau)) {
    erreurs.push(
      `reference : le programme « ${r.programme} » ne couvre pas le niveau ${r.niveau}`,
    );
  }
  if (!STATUTS_PROGRAMME.includes(r.statut)) {
    erreurs.push(`reference.statut : « enseigne » ou « automatise » attendu`);
  }
  if (r.identifiant !== undefined && r.identifiant !== null
    && (typeof r.identifiant !== "string" || r.identifiant.length === 0)) {
    erreurs.push("reference.identifiant : identifiant officiel texte ou null");
  }

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Valide un item de programme complet (§7.1) — une ligne officielle.
 * @param {unknown} item
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerProgrammeItem(item) {
  const erreurs = [];
  if (typeof item !== "object" || item === null) {
    return { valide: false, erreurs: ["item : objet attendu"] };
  }
  const i = /** @type {Record<string, any>} */ (item);

  if (typeof i.id !== "string" || i.id.length === 0) {
    erreurs.push("id : identifiant officiel requis");
  }
  if (typeof i.texte !== "string" || i.texte.trim().length === 0) {
    erreurs.push("texte : libellé officiel requis");
  }
  if (!Number.isInteger(i.domaine) || i.domaine < 1 || i.domaine > 7) {
    erreurs.push("domaine : numéro de domaine maths&go entre 1 et 7 requis");
  }
  const reference = validerReferenceProgramme({
    programme: i.programme,
    niveau: i.niveau,
    statut: i.statut,
    identifiant: i.id,
  });
  erreurs.push(...reference.erreurs);

  if (i.application !== undefined && i.application !== null) {
    try {
      rangAnneeScolaire(i.application);
    } catch (erreur) {
      erreurs.push(`application : ${erreur.message}`);
    }
  }

  return { valide: erreurs.length === 0, erreurs };
}
