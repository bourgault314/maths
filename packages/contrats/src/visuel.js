// Contrat « visuel » — version 1 (cahier des charges V2 §7.8, §6.1, §11).
//
// Une question ne stocke JAMAIS un dessin. Elle déclare : « il faut ici
// l'objet schéma-en-barres, version 2, dans le rôle « donnée », avec ces
// paramètres sémantiques ». C'est l'objet officiel qui sait dessiner, et
// c'est le rendu qui l'appelle.
//
// TROIS CONSÉQUENCES, toutes voulues :
//
// 1. Un visuel de rôle « donnee » porte une information indispensable à
//    l'énoncé. Ce n'est donc PAS une aide, et on n'a pas le droit de le
//    masquer derrière un bouton (§6.1). Le contrat le fait respecter.
//
// 2. Aucune couleur ne circule ici. Les paramètres sont sémantiques
//    (« partie », « tout », « inconnue ») ; la charte associe les teintes
//    aux rôles (§11.1). Un code hexadécimal dans un visuel est refusé.
//
// 3. L'objet est nommé et VERSIONNÉ. Redessiner un objet sans changer son
//    numéro casserait silencieusement les séries déjà partagées.

export const SCHEMA_VISUEL = "mathsgo.visuel/1";

/** Rôles d'un visuel (§6.1) — repris à l'identique du contrat question/2. */
export const ROLES_VISUEL = ["donnee", "representation", "correction"];

/**
 * États d'un objet dans le déroulé d'une question. Un même objet sert à
 * l'énoncé, à l'aide et à la correction : il change d'état, pas d'identité.
 */
export const ETATS_VISUEL = ["question", "aide", "correction"];

/**
 * Interactions qu'un objet peut offrir. « aucune » est le cas normal :
 * un visuel est d'abord une image juste.
 */
export const INTERACTIONS_VISUEL = [
  "aucune",
  "clic-case",
  "clic-longueur",
  "glisser",
  "saisie-dans-figure",
];

const IDENTIFIANT_OBJET = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Une couleur en dur dans un contenu est une erreur de couche (§11.1). */
const COULEUR_BRUTE = /#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i;

function contientCouleurBrute(valeur) {
  if (typeof valeur === "string") return COULEUR_BRUTE.test(valeur);
  if (valeur && typeof valeur === "object") {
    return Object.values(valeur).some(contientCouleurBrute);
  }
  return false;
}

function contientBalise(valeur) {
  if (typeof valeur === "string") return /<svg|<\/svg>|<div|<span|<img|<path/i.test(valeur);
  if (valeur && typeof valeur === "object") return Object.values(valeur).some(contientBalise);
  return false;
}

/**
 * Valide une déclaration de visuel.
 * @param {unknown} visuel
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerVisuel(visuel) {
  const erreurs = [];
  if (typeof visuel !== "object" || visuel === null) {
    return { valide: false, erreurs: ["visuel : objet attendu"] };
  }
  const v = /** @type {Record<string, any>} */ (visuel);

  if (typeof v.objet !== "string" || !IDENTIFIANT_OBJET.test(v.objet)) {
    erreurs.push(`visuel.objet : identifiant d'objet officiel requis, reçu « ${v.objet} »`);
  }
  if (!Number.isInteger(v.version) || v.version < 1) {
    erreurs.push("visuel.version : numéro de version entier ≥ 1 requis");
  }
  if (!ROLES_VISUEL.includes(v.role)) {
    erreurs.push(`visuel.role : rôle inconnu « ${v.role} »`);
  }
  if (!ETATS_VISUEL.includes(v.etat)) {
    erreurs.push(`visuel.etat : « question », « aide » ou « correction » attendu`);
  }
  if (typeof v.indispensable !== "boolean") {
    erreurs.push("visuel.indispensable : booléen requis");
  }
  if (v.interaction !== undefined && !INTERACTIONS_VISUEL.includes(v.interaction)) {
    erreurs.push(`visuel.interaction : interaction inconnue « ${v.interaction} »`);
  }
  if (typeof v.parametres !== "object" || v.parametres === null || Array.isArray(v.parametres)) {
    erreurs.push("visuel.parametres : objet de paramètres sémantiques attendu");
  } else {
    if (contientCouleurBrute(v.parametres)) {
      erreurs.push(
        "visuel.parametres : aucune couleur en dur — nommer un rôle de thème (§11.1)",
      );
    }
    if (contientBalise(v.parametres)) {
      erreurs.push("visuel.parametres : aucun SVG ni HTML — l'objet produit le dessin");
    }
  }

  // La règle qui protège la pédagogie : une donnée indispensable ne peut
  // pas être rangée dans l'aide (§6.1).
  if (v.role === "donnee" && v.indispensable === false) {
    erreurs.push(
      "visuel : un visuel de rôle « donnee » porte l'énoncé, il est indispensable",
    );
  }
  if (v.role === "donnee" && v.etat === "aide") {
    erreurs.push(
      "visuel : un visuel de rôle « donnee » ne peut pas être un état d'aide (§6.1)",
    );
  }

  const chercherFonction = (valeur, chemin) => {
    if (typeof valeur === "function") {
      erreurs.push(`${chemin} : aucune fonction ne circule dans un visuel`);
      return;
    }
    if (valeur && typeof valeur === "object") {
      for (const [cle, sous] of Object.entries(valeur)) chercherFonction(sous, `${chemin}.${cle}`);
    }
  };
  chercherFonction(v, "visuel");

  return { valide: erreurs.length === 0, erreurs };
}

/**
 * Fabrique une déclaration de visuel avec les défauts prudents :
 * rôle « representation », état « question », aucune interaction.
 * @param {string} objet @param {number} version
 * @param {object} [options]
 */
export function declarerVisuel(objet, version, options = {}) {
  const visuel = {
    objet,
    version,
    role: options.role ?? "representation",
    etat: options.etat ?? "question",
    parametres: options.parametres ?? {},
    indispensable: options.indispensable ?? (options.role === "donnee"),
    interaction: options.interaction ?? "aucune",
  };
  const controle = validerVisuel(visuel);
  if (!controle.valide) {
    throw new Error(`declarerVisuel : ${controle.erreurs.join(" ; ")}`);
  }
  return visuel;
}
