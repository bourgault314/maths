#!/usr/bin/env node

// Vérifie que chaque page HTML publiée déclare son icône, et que les fichiers
// d'icône déclarés existent bien.
//
// Le contrat : le repli navigateur sur /favicon.ico suffit pour l'ONGLET, mais
// pas pour la fiche d'un FAVORI, qui garde ce qui a été enregistré à sa
// création. Une page sans déclaration donne un globe gris dans la barre de
// favoris. Le dépôt n'ayant aucun gabarit de <head> partagé, rien n'empêche
// une nouvelle page de repartir sans : c'est le rôle de ce contrôle.
//
// Réparation : node scripts/injecter-icone.mjs --apply

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DOSSIERS_EXCLUS = ["node_modules", ".git", "fichiers-travailles", "auto/dev"];

// Les cibles du bloc canonique : si l'une disparaît, toutes les pages du site
// pointent dans le vide d'un coup.
const FICHIERS_ATTENDUS = [
  "favicon.ico",
  "favicon.svg",
  "assets/img/favicon-32.png",
  "assets/img/favicon-192.png",
  "assets/img/apple-touch-icon.png",
];

const erreurs = [];

for (const fichier of FICHIERS_ATTENDUS) {
  if (!fs.existsSync(path.join(root, fichier))) {
    erreurs.push(`Fichier d'icône manquant : ${fichier}`);
  }
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

let controlees = 0;
for (const absolu of parcourir(root)) {
  const relatif = path.relative(root, absolu).split(path.sep).join("/");
  const html = fs.readFileSync(absolu, "utf8");

  // Fragments et gabarits partiels : pas une page à part entière.
  if (!/<head\b/i.test(html) && !/<title>/i.test(html)) continue;

  controlees += 1;
  if (!/<link\b[^>]*\brel\s*=\s*["']?[^"'>]*icon/i.test(html)) {
    erreurs.push(`Page sans déclaration d'icône : ${relatif}`);
  }
}

if (erreurs.length > 0) {
  console.error("Contrôle des icônes : échec.");
  for (const erreur of erreurs) console.error(`  - ${erreur}`);
  console.error("\nRéparation : node scripts/injecter-icone.mjs --apply");
  process.exit(1);
}

console.log(`Contrôle des icônes : ${controlees} page(s) déclarent leur icône, ${FICHIERS_ATTENDUS.length} fichiers présents.`);
