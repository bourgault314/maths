#!/usr/bin/env node

// Contrôle de l'archive publiée sur mathsgo.re (lot « petits correctifs de
// sécurité », 11/11/2026, constat F09 de l'audit GPT du 09/11).
//
// Le dépôt est privé ; le site, lui, est public. L'étape « Assembler le site »
// de .github/workflows/publier.yml copie le dépôt dans _site/ en retirant ce
// qui ne regarde que les développeurs. Avant ce lot, tests/, scripts/ et
// docs/ partaient avec le site : un test du dépôt se lisait sur
// https://mathsgo.re/tests/…. Rien de secret n'y a été trouvé, mais une note
// sensible déposée demain dans l'un de ces dossiers aurait été publiée.
//
// Ce script relit l'archive VRAIMENT assemblée, après rsync :
//   1. aucun fichier exclu n'y est (un oubli dans la commande rsync, une
//      exclusion mal écrite — « tests » sans barre exclurait aussi un dossier
//      tests/ d'une appli, « scripts » emporterait auto/scripts/) ;
//   2. aucune page publiée ne charge ou ne pointe vers un fichier exclu (il
//      manquerait sur le site : page cassée) ;
//   3. les pages qui comptent sont bien là.
// Il tourne DEPUIS LE DÉPÔT (scripts/ n'est pas publié) :
//
//   node scripts/verifier-publication.mjs _site
//
// La liste des exclusions est tenue ICI et dans publier.yml ;
// tests/publication-assemblage.test.mjs vérifie que les deux disent la même
// chose, et rejoue l'assemblage sur le dépôt sans rsync (Windows n'en a pas).

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// Les motifs passés à rsync, dans l'ordre de publier.yml. Un motif qui
// commence par « / » ne vaut qu'à la racine ; un motif qui finit par « / »
// ne vise qu'un dossier ; un motif sans « / » vise un nom, à toute profondeur.
export const EXCLUSIONS = [
  ".*",
  "_*",
  "/tests/",
  "/scripts/",
  "/docs/",
  "/AGENTS.md",
  "node_modules",
  "*.test.js",
  "*.test.mjs",
  "*.test.cjs",
  "package.json",
  "package-lock.json",
  "axelle/daily/template-index.html",
];

// Ce qui doit être publié quoi qu'il arrive : une exclusion trop large se
// voit ici avant de casser le site.
export const REQUIS = [
  "index.html",
  "confidentialite.html",
  "outils/index.html",
  "assets/js/compteur.js",
  "assets/js/eleve-retour-espace.js",
  "outils/calcul_mental/defi_tables.html",
  "outils/calcul_mental/defi_tables_mon_parcours.js",
  "outils/calcul_mental/defi_calcul_modules.html",
  "outils/calcul_mental/flash_anzan.html",
  "outils/calcul_mental/coffres_magiques_solo.html",
  "outils/splat_univers.html",
  "auto/index.html",
  "auto/scripts/00-setup-icons.js",
];

// Le même jugement que rsync, pour un chemin relatif « a/b/c.ext » (barres
// obliques). estDossier : le chemin désigne-t-il un dossier ?
export function estExclu(relatif, estDossier = false) {
  const morceaux = relatif.split("/").filter(Boolean);
  if (!morceaux.length) return false;
  if (morceaux.some((nom) => nom.startsWith(".") || nom.startsWith("_"))) return true;
  if (morceaux.includes("node_modules")) return true;
  // « /tests/ », « /scripts/ », « /docs/ » : le dossier de la RACINE, et ce
  // qu'il contient. auto/scripts/ et studio/docs/ restent.
  if (["tests", "scripts", "docs"].includes(morceaux[0]) && (morceaux.length > 1 || estDossier)) return true;
  if (morceaux.length === 1 && morceaux[0] === "AGENTS.md") return true;
  const nom = morceaux[morceaux.length - 1];
  if (/\.test\.(?:js|mjs|cjs)$/i.test(nom) && !estDossier) return true;
  if ((nom === "package.json" || nom === "package-lock.json")) return true;
  const chemin = morceaux.join("/");
  if (chemin === "axelle/daily/template-index.html" || chemin.endsWith("/axelle/daily/template-index.html")) return true;
  return false;
}

// Tous les fichiers d'un dossier, en chemins relatifs « a/b/c ». Un lien
// symbolique est refusé : il pourrait publier ce qu'il désigne.
export function fichiersDe(racine, { elaguer = null } = {}) {
  const sortie = [];
  (function parcourir(dossier, prefixe) {
    for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
      const relatif = prefixe ? `${prefixe}/${entree.name}` : entree.name;
      if (entree.isSymbolicLink()) throw new Error(`Lien symbolique inattendu : ${relatif}`);
      if (entree.isDirectory()) {
        if (elaguer && elaguer(relatif, true)) continue;
        parcourir(path.join(dossier, entree.name), relatif);
      } else {
        if (elaguer && elaguer(relatif, false)) continue;
        sortie.push(relatif);
      }
    }
  })(racine, "");
  return sortie.sort();
}

// Les adresses du site qu'une page charge ou désigne (src=, href=), en
// chemins relatifs à la racine du site. Les autres sites sont ignorés.
export function referencesDuSite(relatif, html) {
  const cibles = [];
  for (const [, brut] of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"'<>]+)["']/gi)) {
    const valeur = brut.replace(/&amp;/g, "&").trim();
    if (!valeur || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(valeur)) continue;
    let url;
    try {
      url = new URL(valeur, `https://mathsgo.re/${relatif}`);
    } catch {
      continue;
    }
    if (url.origin !== "https://mathsgo.re") continue;
    let cible;
    try {
      cible = decodeURIComponent(url.pathname).replace(/^\//, "");
    } catch {
      continue;
    }
    cibles.push(cible);
  }
  return cibles;
}

// Le cœur du contrôle, sur une liste de fichiers et un moyen de les lire :
// le même pour l'archive assemblée (CI) et pour le dépôt filtré (test).
export function verifierListe(fichiers, lire) {
  const erreurs = [];
  const presents = new Set(fichiers);
  for (const relatif of fichiers) {
    if (estExclu(relatif)) erreurs.push(`Fichier qui ne devrait pas être publié : ${relatif}`);
  }
  for (const relatif of fichiers) {
    if (!/\.html?$/i.test(relatif)) continue;
    for (const cible of referencesDuSite(relatif, lire(relatif))) {
      if (cible && estExclu(cible)) erreurs.push(`Page qui désigne un fichier non publié : ${relatif} → ${cible}`);
    }
  }
  for (const requis of REQUIS) {
    if (!presents.has(requis)) erreurs.push(`Fichier indispensable absent de la publication : ${requis}`);
  }
  return erreurs;
}

export function verifierSite(racine) {
  if (!fs.existsSync(racine) || !fs.statSync(racine).isDirectory()) {
    return [`Archive introuvable : ${racine}`];
  }
  const fichiers = fichiersDe(racine);
  return verifierListe(fichiers, (relatif) => fs.readFileSync(path.join(racine, relatif), "utf8"));
}

function principal() {
  const racine = path.resolve(process.argv[2] || "_site");
  const erreurs = verifierSite(racine);
  if (erreurs.length) {
    console.error(`Publication refusée — ${erreurs.length} problème(s) :`);
    for (const erreur of erreurs) console.error(`  ${erreur}`);
    process.exit(1);
  }
  console.log(`Archive publiée vérifiée : ${fichiersDe(racine).length} fichiers, aucun fichier technique, aucune page cassée par une exclusion.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  principal();
}
