// Regénère packages/objets/src/programme-automatismes.js depuis la matrice
// vérifiée docs/reference-matrice-automatismes/matrice.json.
// Usage : node scripts/generer-programme-automatismes.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(racine, "docs", "reference-matrice-automatismes", "matrice.json");
const cible = join(racine, "packages", "objets", "src", "programme-automatismes.js");

const matrice = JSON.parse(readFileSync(source, "utf8"));
if (matrice.total !== 187 || matrice.automatismes.length !== 187) {
  throw new Error(`Matrice inattendue : total ${matrice.total}, ${matrice.automatismes.length} entrées`);
}

const lignes = matrice.automatismes
  .map((a) => `  ${JSON.stringify(a)},`)
  .join("\n");

const contenu = `/*
 * Les automatismes des nouveaux programmes (CM1 à 3e), en données.
 *
 * FICHIER GÉNÉRÉ par scripts/generer-programme-automatismes.mjs depuis
 * docs/reference-matrice-automatismes/matrice.json (matrice vérifiée ligne
 * à ligne contre les annexes officielles — voir le README de ce dossier).
 * Ne pas éditer à la main : modifier la matrice puis regénérer.
 *
 * Chaque entrée : { id, domaine (1-7), domaineNom, niveau, rubriqueOfficielle,
 * texte, statut (BO–CM ou BO–Auto), application }.
 */

export const AUTOMATISMES_BO = [
${lignes}
];

const PAR_ID = new Map(AUTOMATISMES_BO.map((a) => [a.id, a]));

/** L'automatisme officiel portant cet identifiant (ex. « 3-26 »), ou null. */
export function automatisme(id) {
  return PAR_ID.get(id) ?? null;
}

/** Les automatismes d'un niveau (« CM1 », « CM2 », « 6e », « 5e », « 4e », « 3e »). */
export function automatismesDuNiveau(niveau) {
  return AUTOMATISMES_BO.filter((a) => a.niveau === niveau);
}

/** Les automatismes d'un domaine maths&go (1 à 7). */
export function automatismesDuDomaine(domaine) {
  return AUTOMATISMES_BO.filter((a) => a.domaine === domaine);
}
`;

writeFileSync(cible, contenu, "utf8");
console.log(`${matrice.automatismes.length} automatismes écrits dans ${cible}`);
