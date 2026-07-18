// Contrat « réponse » — version 1 (cahier des charges V2 §7.7, §9).
//
// CE QUE CE FICHIER GARANTIT
//
// 1. La saisie de l'élève n'est JAMAIS exécutée. Pas de `eval`, pas de
//    `Function`, pas de `with`, pas de `JSON.parse` sur du texte libre.
//    On lit les caractères un par un avec une grammaire fermée : ce qui
//    n'est pas explicitement reconnu est refusé.
//
// 2. La vérité mathématique n'est jamais un flottant. « 0,1 + 0,2 » ne doit
//    pas décider si un élève a raison. Toute saisie devient une valeur
//    canonique exacte (entier, décimal mantisse+décimales, fraction).
//
// 3. L'écriture française est acceptée sans être « corrigée » en douce :
//    virgule décimale, espaces de milliers (y compris insécables), signe
//    moins typographique. Ce sont des façons LÉGITIMES d'écrire, pas des
//    fautes.
//
// 4. Ce qu'on accepte est une DÉCISION déclarée, pas un hasard : une
//    politique d'acceptation dit si 2/4 vaut 1/2, si 0,33 vaut 1/3, et
//    avec quel arrondi.

import {
  memeValeur,
  valeurDecimal,
  valeurEntier,
  valeurFraction,
} from "./question-instance-2.js";

export const SCHEMA_REPONSE = "mathsgo.reponse/1";

/**
 * Politiques d'acceptation (§9). Elles se DÉCLARENT dans le gabarit :
 * aucune n'est appliquée par défaut sans avoir été choisie.
 *
 * — « exacte » : la valeur canonique doit coïncider, forme comprise.
 *   3/6 est refusé si on attend 1/2 (utile quand on travaille la
 *   simplification elle-même).
 * — « valeur-egale » : la valeur mathématique suffit. 3/6, 1/2 et 0,5
 *   sont acceptés indifféremment.
 * — « fraction-equivalente » : les fractions égales sont acceptées, mais
 *   pas un décimal (on veut une fraction).
 * — « arrondi » : accepte une approximation, à la précision déclarée.
 */
export const POLITIQUES_ACCEPTATION = [
  "exacte",
  "valeur-egale",
  "fraction-equivalente",
  "arrondi",
];

/** Raisons de refus d'une saisie — destinées à être expliquées à l'élève. */
export const RAISONS_REFUS = {
  VIDE: "vide",
  CARACTERE_INTERDIT: "caractere-interdit",
  FORME_INCONNUE: "forme-inconnue",
  DIVISION_PAR_ZERO: "division-par-zero",
  TROP_LONG: "trop-long",
  TROP_DE_DECIMALES: "trop-de-decimales",
};

/** Une saisie d'élève reste courte : au-delà, c'est un collage accidentel. */
const LONGUEUR_MAXIMALE = 40;
const DECIMALES_MAXIMALES = 12;

// ---------------------------------------------------------------------------
// Normalisation de l'écriture
// ---------------------------------------------------------------------------

/**
 * Toutes les espaces qu'un clavier, un traitement de texte ou un copier-coller
 * peuvent produire — y compris l'insécable et l'insécable fine, que les
 * élèves obtiennent en tapant « 1 000 » dans certains contextes.
 */
const ESPACES = new RegExp(
  "[\\u0009\\u0020\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000\\uFEFF]",
  "g",
);

/** Les traits que les claviers et polices produisent pour « moins ». */
const SIGNES_MOINS = new RegExp("[\\u2212\\u2013\\u2014\\u2012\\u2043]", "g");

/**
 * Met une saisie sous forme canonique d'écriture, SANS juger de sa valeur.
 * N'exécute rien : ce sont des remplacements de caractères.
 * @param {string} texte
 * @returns {string}
 */
export function normaliserEcriture(texte) {
  if (typeof texte !== "string") return "";
  return texte
    .normalize("NFKC")
    .replace(SIGNES_MOINS, "-")
    .replace(ESPACES, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Lecture d'une saisie — grammaire fermée
// ---------------------------------------------------------------------------

/** Entier signé, sans séparateur : -12, 0, 340. */
const ENTIER = /^[+-]?\d+$/;
/** Décimal français ou anglais : 2,5 ou 2.5 — la virgule reste légitime. */
const DECIMAL = /^[+-]?\d*[.,]\d+$/;
/** Décimal se terminant par le séparateur : « 2, » — toléré, vaut 2. */
const DECIMAL_TRONQUE = /^[+-]?\d+[.,]$/;
/** Fraction d'entiers : -3/4. Le signe peut porter sur l'un ou l'autre. */
const FRACTION = /^([+-]?\d+)\/([+-]?\d+)$/;

function refus(raison, detail) {
  return { valide: false, valeur: null, raison, detail: detail ?? null };
}

/**
 * Lit une saisie d'élève et en fait une valeur canonique exacte.
 *
 * Ne lève jamais : renvoie un refus motivé, que l'interface peut expliquer.
 * @param {string} saisie
 * @param {{ decimalesMax?: number }} [options]
 * @returns {{ valide: boolean, valeur: object|null, raison: string|null, detail: string|null }}
 */
export function lireSaisie(saisie, options = {}) {
  const decimalesMax = options.decimalesMax ?? DECIMALES_MAXIMALES;

  if (typeof saisie !== "string") return refus(RAISONS_REFUS.VIDE);
  if (saisie.length > LONGUEUR_MAXIMALE * 4) return refus(RAISONS_REFUS.TROP_LONG);

  const texte = normaliserEcriture(saisie);
  if (texte.length === 0) return refus(RAISONS_REFUS.VIDE);
  if (texte.length > LONGUEUR_MAXIMALE) return refus(RAISONS_REFUS.TROP_LONG);

  // Garde-fou explicite : tout caractère hors de la grammaire est refusé
  // AVANT toute tentative de lecture. C'est ce qui rend l'exécution de
  // code impossible par construction.
  if (/[^0-9+\-/.,]/.test(texte)) {
    const fautif = texte.match(/[^0-9+\-/.,]/)?.[0] ?? "";
    return refus(RAISONS_REFUS.CARACTERE_INTERDIT, fautif);
  }

  if (ENTIER.test(texte)) {
    const valeur = Number(texte);
    if (!Number.isSafeInteger(valeur)) return refus(RAISONS_REFUS.TROP_LONG);
    return { valide: true, valeur: valeurEntier(valeur), raison: null, detail: null };
  }

  if (DECIMAL_TRONQUE.test(texte)) {
    const valeur = Number(texte.slice(0, -1));
    if (!Number.isSafeInteger(valeur)) return refus(RAISONS_REFUS.TROP_LONG);
    return { valide: true, valeur: valeurEntier(valeur), raison: null, detail: null };
  }

  if (DECIMAL.test(texte)) {
    const unifie = texte.replace(",", ".");
    const negatif = unifie.startsWith("-");
    const [entiere, decimale] = unifie.replace(/^[+-]/, "").split(".");
    if (decimale.length > decimalesMax) {
      return refus(RAISONS_REFUS.TROP_DE_DECIMALES, String(decimale.length));
    }
    // On assemble la mantisse par le TEXTE, jamais par une multiplication
    // flottante : « 0,07 » doit donner 7, pas 7.000000000000001.
    const chiffres = `${entiere || "0"}${decimale}`.replace(/^0+(?=\d)/, "");
    const mantisse = Number(chiffres);
    if (!Number.isSafeInteger(mantisse)) return refus(RAISONS_REFUS.TROP_LONG);
    return {
      valide: true,
      valeur: valeurDecimal(negatif && mantisse !== 0 ? -mantisse : mantisse, decimale.length),
      raison: null,
      detail: null,
    };
  }

  const fraction = FRACTION.exec(texte);
  if (fraction) {
    const numerateur = Number(fraction[1]);
    const denominateur = Number(fraction[2]);
    if (!Number.isSafeInteger(numerateur) || !Number.isSafeInteger(denominateur)) {
      return refus(RAISONS_REFUS.TROP_LONG);
    }
    if (denominateur === 0) return refus(RAISONS_REFUS.DIVISION_PAR_ZERO);
    // On ne réduit PAS ici : la politique d'acceptation décidera si 3/6
    // vaut 1/2. Réduire d'office effacerait l'information.
    return {
      valide: true,
      valeur: valeurFraction(numerateur, denominateur, { reduire: false }),
      raison: null,
      detail: null,
    };
  }

  return refus(RAISONS_REFUS.FORME_INCONNUE);
}

// ---------------------------------------------------------------------------
// Comparaison exacte, sans flottant
// ---------------------------------------------------------------------------

/** Une valeur canonique vue comme fraction exacte { n, d }, d > 0. */
function enFraction(valeur) {
  if (!valeur) return null;
  if (valeur.type === "entier") return { n: valeur.valeur, d: 1 };
  if (valeur.type === "decimal") return { n: valeur.mantisse, d: 10 ** valeur.decimales };
  if (valeur.type === "fraction") return { n: valeur.numerateur, d: valeur.denominateur };
  return null;
}

/** Égalité mathématique exacte : produit en croix sur des entiers. */
export function memeValeurMathematique(a, b) {
  const fa = enFraction(a);
  const fb = enFraction(b);
  if (!fa || !fb) return memeValeur(a, b);
  return fa.n * fb.d === fb.n * fa.d;
}

/**
 * La saisie est-elle acceptée pour cette réponse attendue ?
 *
 * @param {object} valeurSaisie — valeur canonique issue de lireSaisie
 * @param {object} valeurAttendue — valeur canonique de la réponse
 * @param {{ politique?: string, decimales?: number }} [options]
 * @returns {{ accepte: boolean, motif: string }}
 */
export function accepterReponse(valeurSaisie, valeurAttendue, options = {}) {
  const politique = options.politique ?? "valeur-egale";
  if (!POLITIQUES_ACCEPTATION.includes(politique)) {
    throw new RangeError(`politique d'acceptation inconnue « ${politique} »`);
  }
  if (!valeurSaisie || !valeurAttendue) return { accepte: false, motif: "valeur-absente" };

  if (politique === "exacte") {
    const identique = valeurSaisie.type === valeurAttendue.type
      && memeValeur(valeurSaisie, valeurAttendue)
      && (valeurSaisie.type !== "fraction"
        || valeurSaisie.denominateur === valeurAttendue.denominateur);
    return { accepte: identique, motif: identique ? "exacte" : "forme-differente" };
  }

  if (politique === "fraction-equivalente") {
    if (valeurSaisie.type !== "fraction") {
      return { accepte: false, motif: "fraction-attendue" };
    }
    const egal = memeValeurMathematique(valeurSaisie, valeurAttendue);
    return { accepte: egal, motif: egal ? "fraction-equivalente" : "valeur-differente" };
  }

  if (politique === "arrondi") {
    const decimales = options.decimales;
    if (!Number.isInteger(decimales) || decimales < 0 || decimales > DECIMALES_MAXIMALES) {
      throw new RangeError("politique « arrondi » : nombre de décimales à déclarer");
    }
    const fa = enFraction(valeurSaisie);
    const fb = enFraction(valeurAttendue);
    if (!fa || !fb) return { accepte: false, motif: "valeur-absente" };
    // Comparaison entière : |a − b| × 10^d × 2 ≤ 1 ⇔ écart ≤ un demi-rang.
    // Tout se fait sur des entiers, donc sans erreur d'arrondi parasite.
    const echelle = 10 ** decimales;
    const gauche = Math.abs(fa.n * fb.d - fb.n * fa.d) * echelle * 2;
    const droite = Math.abs(fa.d * fb.d);
    const accepte = gauche <= droite;
    return { accepte, motif: accepte ? "arrondi-accepte" : "hors-tolerance" };
  }

  const egal = memeValeurMathematique(valeurSaisie, valeurAttendue);
  return { accepte: egal, motif: egal ? "valeur-egale" : "valeur-differente" };
}

/**
 * Reconnaît l'erreur commise, s'il en existe un modèle (§5).
 * Renvoie null si aucun modèle ne correspond — c'est le cas le plus
 * fréquent, et il ne faut jamais inventer un diagnostic.
 *
 * @param {object} valeurSaisie
 * @param {Array<{ id: string, valeur: object }>} modelesErreurs
 * @returns {{ id: string, valeur: object, certain: boolean } | null}
 */
export function reconnaitreErreur(valeurSaisie, modelesErreurs) {
  if (!valeurSaisie || !Array.isArray(modelesErreurs)) return null;
  const correspondants = modelesErreurs.filter(
    (modele) => memeValeurMathematique(valeurSaisie, modele?.valeur),
  );
  if (correspondants.length === 0) return null;
  // Deux modèles produisant la même valeur : le diagnostic est AMBIGU.
  // On le signale au lieu de trancher au hasard (§5, §10).
  return { ...correspondants[0], certain: correspondants.length === 1 };
}

// ---------------------------------------------------------------------------
// Unités
// ---------------------------------------------------------------------------

/**
 * Une mesure garde sa valeur et son unité SÉPARÉES (§9) : « 24 cm » n'est
 * pas une chaîne, c'est un couple. Comparer des mesures d'unités
 * différentes n'est pas notre affaire ici — c'est une décision pédagogique.
 * @param {object} valeur — valeur canonique
 * @param {string} unite
 */
export function valeurMesure(valeur, unite) {
  if (typeof unite !== "string" || unite.trim().length === 0) {
    throw new RangeError("valeurMesure : unité non vide attendue");
  }
  return { type: "mesure", valeur, unite: unite.trim() };
}

/**
 * Valide une politique d'acceptation déclarée dans un gabarit.
 * @param {unknown} politique
 * @returns {{ valide: boolean, erreurs: string[] }}
 */
export function validerPolitiqueAcceptation(politique) {
  const erreurs = [];
  if (typeof politique !== "object" || politique === null) {
    return { valide: false, erreurs: ["politique : objet attendu"] };
  }
  const p = /** @type {Record<string, any>} */ (politique);
  if (!POLITIQUES_ACCEPTATION.includes(p.nom)) {
    erreurs.push(`politique.nom : politique inconnue « ${p.nom} »`);
  }
  if (p.nom === "arrondi"
    && (!Number.isInteger(p.decimales) || p.decimales < 0 || p.decimales > DECIMALES_MAXIMALES)) {
    erreurs.push("politique.decimales : nombre de décimales requis pour « arrondi »");
  }
  return { valide: erreurs.length === 0, erreurs };
}
