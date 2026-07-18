// Contrat « série » — version 2 (cahier des charges V2 §7.10 à §7.12, §13).
//
// CE QUI CHANGE PAR RAPPORT À LA V1
//
// La série de l'application actuelle est décrite du point de vue de son
// écran : elle mêle ce que l'utilisateur a DEMANDÉ et ce que le moteur a
// PRODUIT. La V2 sépare les deux, et c'est ce qui rend le partage possible
// sans serveur :
//
//   — SeriesDefinition : ce que l'utilisateur a demandé. Petit, stable,
//     encodable dans un code. C'est LUI qui voyage.
//   — SeriesInstance : ce que le moteur en a tiré. Volumineux, entièrement
//     reconstructible à partir de la définition et des versions.
//
// Deux personnes ouvrant le même code reconstruisent donc la même série
// chacune chez elle, sans que rien ne transite par un serveur.
//
// AUCUNE dépendance au navigateur ici : ni DOM, ni stockage, ni horloge.
// L'interface fournira ses propres adaptateurs (§7.12).

export const SCHEMA_SERIE_DEFINITION = "mathsgo.serie-definition/2";
export const SCHEMA_SERIE_INSTANCE = "mathsgo.serie-instance/2";
export const SCHEMA_TENTATIVE = "mathsgo.tentative/1";

/** Les manières d'utiliser une série (§12). */
export const MODES_SERIE = ["exploration", "entrainement", "projection"];

/**
 * Politique d'aide (§6.2). Elle appartient à la SÉRIE, pas à la question :
 * la même question s'aide au vidéoprojecteur et ne s'aide pas en évaluation.
 */
export const POLITIQUES_AIDE = ["aucune", "a-la-demande", "apres-erreur", "toujours"];

/** Bornes de bon sens — une série hors de ces bornes est une erreur de saisie. */
export const QUESTIONS_MINIMUM = 1;
export const QUESTIONS_MAXIMUM = 60;

const IDENTIFIANT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Valide ce que l'utilisateur a demandé.
 *
 * `contenu` fige la version de la banque : une série partagée aujourd'hui
 * doit se rejouer identique dans deux ans, même si la banque a changé
 * entre-temps (§13).
 *
 * @param {unknown} definition
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerSerieDefinition(definition) {
  const erreurs = [];
  if (typeof definition !== "object" || definition === null) {
    return { valide: false, erreurs: ["definition : objet attendu"] };
  }
  const d = /** @type {Record<string, any>} */ (definition);

  if (d.schema !== SCHEMA_SERIE_DEFINITION) {
    erreurs.push(`schema : « ${SCHEMA_SERIE_DEFINITION} » attendu, reçu « ${d.schema} »`);
  }

  // Profil de programme : c'est lui qui dit quel texte officiel s'applique,
  // au lieu de coder « 4e » ou « DNB » en dur (§4.4).
  if (typeof d.profil !== "object" || d.profil === null) {
    erreurs.push("profil : objet attendu { programme, niveau }");
  } else {
    if (typeof d.profil.programme !== "string" || d.profil.programme.length === 0) {
      erreurs.push("profil.programme : identifiant de programme requis");
    }
    if (typeof d.profil.niveau !== "string" || d.profil.niveau.length === 0) {
      erreurs.push("profil.niveau : niveau requis");
    }
    if (d.profil.dnb !== undefined && d.profil.dnb !== null
      && typeof d.profil.dnb !== "string") {
      erreurs.push("profil.dnb : identifiant de profil DNB ou null");
    }
  }

  // Ce qu'on veut travailler : des modules, des notions, ou les deux.
  const modules = d.modules ?? [];
  const notions = d.notions ?? [];
  if (!Array.isArray(modules) || !Array.isArray(notions)) {
    erreurs.push("modules / notions : listes attendues");
  } else {
    if (modules.length === 0 && notions.length === 0) {
      erreurs.push("modules / notions : au moins un module ou une notion à travailler");
    }
    for (const id of [...modules, ...notions]) {
      if (typeof id !== "string" || !IDENTIFIANT.test(id)) {
        erreurs.push(`modules / notions : identifiant invalide « ${id} »`);
      }
    }
  }

  if (!Number.isInteger(d.nombreDeQuestions)
    || d.nombreDeQuestions < QUESTIONS_MINIMUM
    || d.nombreDeQuestions > QUESTIONS_MAXIMUM) {
    erreurs.push(
      `nombreDeQuestions : entier entre ${QUESTIONS_MINIMUM} et ${QUESTIONS_MAXIMUM} requis`,
    );
  }

  // La graine est un ENTIER : elle doit survivre à un encodage en code de
  // série et à une saisie au clavier par un élève.
  if (!Number.isInteger(d.graine) || d.graine < 0 || d.graine > 0xffffffff) {
    erreurs.push("graine : entier non signé sur 32 bits requis");
  }

  if (!MODES_SERIE.includes(d.mode)) {
    erreurs.push(`mode : mode inconnu « ${d.mode} »`);
  }
  if (!POLITIQUES_AIDE.includes(d.politiqueAide)) {
    erreurs.push(`politiqueAide : politique inconnue « ${d.politiqueAide} »`);
  }
  if (typeof d.contenu !== "string" || d.contenu.length === 0) {
    erreurs.push("contenu : identifiant de version de contenu (releaseId) requis");
  }

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Valide une série effectivement produite.
 *
 * `empreinte` est la promesse de reproductibilité : deux moteurs partant
 * de la même définition et des mêmes versions doivent la retrouver.
 *
 * @param {unknown} instance
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerSerieInstance(instance) {
  const erreurs = [];
  if (typeof instance !== "object" || instance === null) {
    return { valide: false, erreurs: ["instance : objet attendu"] };
  }
  const s = /** @type {Record<string, any>} */ (instance);

  if (s.schema !== SCHEMA_SERIE_INSTANCE) {
    erreurs.push(`schema : « ${SCHEMA_SERIE_INSTANCE} » attendu, reçu « ${s.schema} »`);
  }
  if (typeof s.id !== "string" || s.id.length === 0) {
    erreurs.push("id : identifiant de série requis");
  }

  const controleDefinition = validerSerieDefinition(s.definition);
  if (!controleDefinition.valide) {
    erreurs.push(...controleDefinition.erreurs.map((e) => `definition : ${e}`));
  }

  // Les versions du moteur : sans elles, « même code, même série » est faux.
  if (typeof s.versions !== "object" || s.versions === null) {
    erreurs.push("versions : objet attendu (aleatoire, selection, banque)");
  } else {
    for (const champ of ["aleatoire", "selection", "banque"]) {
      if (!Number.isInteger(s.versions[champ])) {
        erreurs.push(`versions.${champ} : numéro de version entier requis`);
      }
    }
  }

  if (!Array.isArray(s.questions)) {
    erreurs.push("questions : liste attendue");
  } else {
    const attendu = s.definition?.nombreDeQuestions;
    if (Number.isInteger(attendu) && s.questions.length !== attendu) {
      erreurs.push(
        `questions : ${attendu} question(s) demandée(s), ${s.questions.length} produite(s)`,
      );
    }
    const ids = new Set();
    s.questions.forEach((question, i) => {
      if (typeof question?.id !== "string") {
        erreurs.push(`questions[${i}].id : identifiant requis`);
        return;
      }
      // Une série ne doit jamais reposer deux fois exactement la même
      // question (§8.5).
      if (ids.has(question.id)) {
        erreurs.push(`questions[${i}] : question « ${question.id} » en double`);
      }
      ids.add(question.id);
    });
  }

  if (typeof s.empreinte !== "string" || s.empreinte.length === 0) {
    erreurs.push("empreinte : empreinte de reproductibilité requise");
  }

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Valide une tentative (§7.12).
 *
 * Le contrat existe dès maintenant pour que rien ne se fige mal, mais le
 * cœur ne conserve RIEN : ni stockage local, ni serveur. C'est l'interface
 * qui décidera plus tard où ces données vivent, si elles vivent.
 *
 * @param {unknown} tentative
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerTentative(tentative) {
  const erreurs = [];
  if (typeof tentative !== "object" || tentative === null) {
    return { valide: false, erreurs: ["tentative : objet attendu"] };
  }
  const t = /** @type {Record<string, any>} */ (tentative);

  if (t.schema !== SCHEMA_TENTATIVE) {
    erreurs.push(`schema : « ${SCHEMA_TENTATIVE} » attendu, reçu « ${t.schema} »`);
  }
  if (typeof t.question !== "string" || t.question.length === 0) {
    erreurs.push("question : identifiant de question requis");
  }
  if (typeof t.saisie !== "string") {
    erreurs.push("saisie : texte de la réponse saisie attendu (vide si abandon)");
  }
  if (typeof t.reussi !== "boolean") {
    erreurs.push("reussi : booléen requis");
  }
  if (!Number.isInteger(t.essais) || t.essais < 1) {
    erreurs.push("essais : entier ≥ 1 requis");
  }
  if (t.aideUtilisee !== undefined && t.aideUtilisee !== null
    && !Number.isInteger(t.aideUtilisee)) {
    erreurs.push("aideUtilisee : rang d'aide entier ou null");
  }
  if (t.modeleErreur !== undefined && t.modeleErreur !== null
    && typeof t.modeleErreur !== "string") {
    erreurs.push("modeleErreur : identifiant de modèle d'erreur ou null");
  }
  // La date est FACULTATIVE et fournie de l'extérieur : le cœur n'a pas
  // le droit de lire l'horloge (§8.1).
  if (t.date !== undefined && t.date !== null && typeof t.date !== "string") {
    erreurs.push("date : texte ISO fourni par l'appelant, ou null");
  }

  return { valide: erreurs.length === 0, erreurs };
}
