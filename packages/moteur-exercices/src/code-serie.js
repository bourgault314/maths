// Codes de série MG2 (cahier des charges V2 §13).
//
// POURQUOI UN NOUVEAU FORMAT
//
// Les codes MG1 sont GELÉS : ils désignent des séries de l'application
// actuelle et doivent continuer à fonctionner telles quelles. La V2 ne
// produit donc pas de MG1 — elle a son propre préfixe, et les deux
// familles ne peuvent pas être confondues.
//
// CE QU'UN CODE TRANSPORTE
//
// Un code MG2 contient TOUT ce qu'il faut pour reconstruire la série sans
// serveur : les versions du moteur, le profil de programme, ce qu'on
// travaille, combien, avec quelle graine, dans quel mode. Rien d'autre :
// pas de questions, pas de réponses, pas de données d'élève.
//
// LA RÈGLE QUI PROTÈGE LES SÉRIES DÉJÀ PARTAGÉES
//
// Un code porte les versions qui l'ont produit. Quand le moteur évoluera,
// les anciennes versions devront rester capables de rejouer les anciens
// codes : c'est pourquoi la version du schéma est LUE dans le code, jamais
// supposée. Un code qu'on ne sait plus rejouer doit le dire clairement,
// pas produire une autre série en silence.

import { SCHEMA_SERIE_DEFINITION, validerSerieDefinition } from "../../contrats/src/serie.js";

export const PREFIXE_MG2 = "MG2-";

/** Version du FORMAT de code. Change si la disposition des champs change. */
export const VERSION_CODE = 1;

/**
 * Correspondance entre les champs de la définition et les clés courtes du
 * code. Les clés sont courtes parce qu'un élève tape ce code à la main ;
 * elles sont documentées ici et nulle part ailleurs.
 *
 *   f — format (version du code)      g — graine
 *   p — programme                     m — modules
 *   n — niveau                        t — notions
 *   b — profil DNB                    q — nombre de questions
 *   o — mode                          a — politique d'aide
 *   c — version de contenu (releaseId)
 */

// ---------------------------------------------------------------------------
// Outils purs : base64url et somme de contrôle
// ---------------------------------------------------------------------------

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** JSON à clés triées : le même contenu donne toujours le même texte. */
function jsonCanonique(valeur) {
  if (Array.isArray(valeur)) return `[${valeur.map(jsonCanonique).join(",")}]`;
  if (valeur && typeof valeur === "object") {
    return `{${Object.keys(valeur)
      .sort()
      .map((cle) => `${JSON.stringify(cle)}:${jsonCanonique(valeur[cle])}`)
      .join(",")}}`;
  }
  return JSON.stringify(valeur) ?? "null";
}

/**
 * Encode des octets en base64url, sans dépendre de `btoa` ni de `Buffer` :
 * le même code doit tourner dans un navigateur et dans `node --test`.
 */
function base64urlDepuisOctets(octets) {
  let sortie = "";
  for (let i = 0; i < octets.length; i += 3) {
    const a = octets[i];
    const b = octets[i + 1];
    const c = octets[i + 2];
    sortie += ALPHABET[a >> 2];
    sortie += ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b === undefined) break;
    sortie += ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c === undefined) break;
    sortie += ALPHABET[c & 63];
  }
  return sortie;
}

function octetsDepuisBase64url(texte) {
  const valeurs = [];
  for (const caractere of texte) {
    const rang = ALPHABET.indexOf(caractere);
    if (rang === -1) throw new RangeError(`caractère invalide dans le code : « ${caractere} »`);
    valeurs.push(rang);
  }
  const octets = [];
  for (let i = 0; i < valeurs.length; i += 4) {
    const [a, b, c, d] = valeurs.slice(i, i + 4);
    if (b === undefined) throw new RangeError("code tronqué");
    octets.push(((a << 2) | (b >> 4)) & 255);
    if (c !== undefined) octets.push(((b << 4) | (c >> 2)) & 255);
    if (d !== undefined) octets.push(((c << 6) | d) & 255);
  }
  return Uint8Array.from(octets);
}

/** CRC-32 : détecte une faute de frappe avant qu'elle ne devienne une autre série. */
export function sommeDeControle(texte) {
  let crc = 0xffffffff;
  for (let i = 0; i < texte.length; i++) {
    crc ^= texte.charCodeAt(i) & 0xff;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(36).padStart(7, "0").slice(-7);
}

// ---------------------------------------------------------------------------
// Encodage et décodage
// ---------------------------------------------------------------------------

/**
 * Fabrique le code partageable d'une série.
 * @param {object} definition — conforme à mathsgo.serie-definition/2
 * @returns {string} par exemple « MG2-eyJhIjoi…-3f9k2ab »
 */
export function encoderSerie(definition) {
  const controle = validerSerieDefinition(definition);
  if (!controle.valide) {
    throw new Error(`impossible d'encoder : ${controle.erreurs.join(" ; ")}`);
  }

  // Les champs vides sont OMIS : « pas de profil DNB » et « aucune notion
  // isolée » sont le cas courant, et les écrire coûterait une vingtaine de
  // caractères à chaque code partagé.
  const charge = {
    f: VERSION_CODE,
    p: definition.profil.programme,
    n: definition.profil.niveau,
    q: definition.nombreDeQuestions,
    g: definition.graine,
    o: definition.mode,
    a: definition.politiqueAide,
    c: definition.contenu,
  };
  if (definition.profil.dnb) charge.b = definition.profil.dnb;
  if ((definition.modules ?? []).length > 0) charge.m = [...definition.modules].sort();
  if ((definition.notions ?? []).length > 0) charge.t = [...definition.notions].sort();

  const texte = jsonCanonique(charge);
  const corps = base64urlDepuisOctets(new TextEncoder().encode(texte));
  return `${PREFIXE_MG2}${corps}-${sommeDeControle(texte)}`;
}

/**
 * Relit un code de série.
 *
 * Ne lève jamais sur un code mal formé : renvoie un refus motivé, pour que
 * l'interface puisse dire à un élève ce qui ne va pas plutôt que d'afficher
 * une page blanche.
 *
 * @param {string} code
 * @returns {{ valide: boolean, definition: object|null, raison: string|null }}
 */
export function decoderSerie(code) {
  const refus = (raison) => ({ valide: false, definition: null, raison });

  if (typeof code !== "string") return refus("code absent");
  const propre = code.trim().replace(/\s+/g, "");
  if (!propre.startsWith(PREFIXE_MG2)) {
    // Un code MG1 est reconnaissable : on le dit, au lieu de « code invalide ».
    if (propre.startsWith("MG1-")) {
      return refus("ce code appartient à l'application actuelle (MG1), pas à la V2");
    }
    return refus(`un code de série commence par « ${PREFIXE_MG2} »`);
  }

  const reste = propre.slice(PREFIXE_MG2.length);
  const separateur = reste.lastIndexOf("-");
  if (separateur <= 0) return refus("code incomplet : somme de contrôle absente");

  const corps = reste.slice(0, separateur);
  const controleAttendu = reste.slice(separateur + 1);

  let texte;
  try {
    texte = new TextDecoder().decode(octetsDepuisBase64url(corps));
  } catch (erreur) {
    return refus(`code illisible (${erreur.message})`);
  }

  if (sommeDeControle(texte) !== controleAttendu) {
    return refus("le code comporte une erreur de saisie (somme de contrôle)");
  }

  let charge;
  try {
    charge = JSON.parse(texte);
  } catch {
    return refus("code illisible");
  }
  if (typeof charge !== "object" || charge === null) return refus("code illisible");

  // La version du FORMAT est lue, jamais supposée : c'est ce qui permettra
  // de rejouer les anciens codes quand le format évoluera.
  if (charge.f !== VERSION_CODE) {
    return refus(
      `ce code a été fabriqué par une version ${charge.f} du format, celle-ci lit la version ${VERSION_CODE}`,
    );
  }

  const definition = {
    schema: SCHEMA_SERIE_DEFINITION,
    profil: { programme: charge.p, niveau: charge.n, dnb: charge.b ?? null },
    modules: charge.m ?? [],
    notions: charge.t ?? [],
    nombreDeQuestions: charge.q,
    graine: charge.g,
    mode: charge.o,
    politiqueAide: charge.a,
    contenu: charge.c,
  };

  const conformite = validerSerieDefinition(definition);
  if (!conformite.valide) {
    return refus(`code cohérent mais série impossible : ${conformite.erreurs.join(" ; ")}`);
  }
  return { valide: true, definition, raison: null };
}
