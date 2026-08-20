#!/usr/bin/env node

// Pose le bloc de déclaration d'icône sur les pages HTML qui n'en ont pas.
//
// Pourquoi : un navigateur réclame /favicon.ico tout seul, donc l'ONGLET
// affiche l'icône même sans balise. Mais la fiche d'un FAVORI, elle, garde ce
// qui a été enregistré à sa création : une page sans déclaration se retrouve
// avec un globe gris dans la barre de favoris. Constaté en vrai sur
// studio/atelier/ et studio/automatismes/ avant leur correction.
//
// Le dépôt n'a aucun gabarit de <head> partagé : chaque page porte le sien en
// dur. Ce script tient lieu de gabarit, et scripts/validate-icone.mjs empêche
// les futures pages de repartir sans.
//
// Outil d'ÉCRITURE, lancé à la main, jamais en CI (règle posée par l'en-tête de
// .github/workflows/verifications.yml). Calqué sur inject-parent-navigation.mjs.
//
//   node scripts/injecter-icone.mjs           liste ce qui serait modifié
//   node scripts/injecter-icone.mjs --apply   écrit

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");

// Le bloc canonique, copié tel quel depuis index.html. Chemins absolus depuis
// la racine du domaine : le site est servi à la racine de mathsgo.re (CNAME),
// donc ils valent depuis n'importe quelle profondeur.
const BLOC = [
  '<link rel="icon" href="/favicon.ico" sizes="48x48">',
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">',
  '<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/favicon-192.png">',
  '<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">',
].join("\n");

// Dossiers hors périmètre : archives personnelles et pages de travail, qui ne
// sont pas des pages du site publiées à destination des visiteurs.
const DOSSIERS_EXCLUS = [
  "node_modules",
  ".git",
  "fichiers-travailles",
  "auto/dev",
  // Jamais publié (le workflow rsync exclut les dossiers « _* ») :
  // rien à injecter dans les fichiers sources.
  "_sources",
];

export function declareDejaUneIcone(html) {
  return /<link\b[^>]*\brel\s*=\s*["']?[^"'>]*icon/i.test(html);
}

export function insererBloc(html) {
  // Le dépôt mélange les fins de ligne : certains fichiers sont en CRLF. Insérer
  // du LF dedans réécrirait la ligne d'ancrage et panacherait les deux styles
  // dans le même fichier. On reprend donc celui du fichier.
  const finDeLigne = /\r\n/.test(html) ? "\r\n" : "\n";
  const bloc = BLOC.split("\n").join(finDeLigne);

  // Cascade d'insertion, du plus propre au plus tolérant : ces pages ont des
  // <head> très hétérogènes, certaines n'ont même pas de </head> explicite.
  if (/<\/title>/i.test(html)) {
    return html.replace(/<\/title>/i, `</title>${finDeLigne}${bloc}`);
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${bloc}${finDeLigne}</head>`);
  }
  if (/<body\b/i.test(html)) {
    return html.replace(/<body\b/i, `${bloc}${finDeLigne}<body`);
  }
  return null;
}

function* parcourir(dossier) {
  for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
    const chemin = path.join(dossier, entree.name);
    const relatif = path.relative(root, chemin).split(path.sep).join("/");
    if (DOSSIERS_EXCLUS.some((exclu) => relatif === exclu || relatif.startsWith(`${exclu}/`))) continue;
    if (entree.isDirectory()) {
      yield* parcourir(chemin);
    } else if (entree.isFile() && entree.name.toLowerCase().endsWith(".html")) {
      yield chemin;
    }
  }
}

const modifiees = [];
const dejaFaites = [];
const sansPointInsertion = [];

for (const absolu of parcourir(root)) {
  const relatif = path.relative(root, absolu).split(path.sep).join("/");
  const html = fs.readFileSync(absolu, "utf8");

  // Fragments et gabarits : pas de <head>, donc pas de page à part entière.
  if (!/<head\b/i.test(html) && !/<title>/i.test(html)) continue;

  if (declareDejaUneIcone(html)) {
    dejaFaites.push(relatif);
    continue;
  }

  const modifie = insererBloc(html);
  if (modifie === null) {
    sansPointInsertion.push(relatif);
    continue;
  }

  modifiees.push(relatif);
  if (apply) fs.writeFileSync(absolu, modifie);
}

console.log(`${dejaFaites.length} page(s) déclaraient déjà leur icône.`);
if (sansPointInsertion.length > 0) {
  console.log(`\n${sansPointInsertion.length} page(s) sans point d'insertion, ignorée(s) :`);
  for (const p of sansPointInsertion) console.log(`  ${p}`);
}
console.log(`\n${modifiees.length} page(s) ${apply ? "modifiée(s)" : "à modifier"} :`);
for (const p of modifiees) console.log(`  ${p}`);
if (!apply && modifiees.length > 0) {
  console.log("\nRelancer avec --apply pour écrire.");
}
