#!/usr/bin/env node

// Pose la ligne du compteur de visites (assets/js/compteur.js) sur les pages
// publiques du site : celles du plan du site (sitemap.xml).
//
// Le dépôt n'a aucun gabarit de <head> partagé : chaque page porte le sien en
// dur. Ce script tient lieu de gabarit, comme scripts/injecter-icone.mjs, et
// tests/compteur-visites.test.mjs empêche une page du plan du site de partir
// sans le compteur (une nouvelle ressource du catalogue entre dans sitemap.xml
// par npm run seo:generer : il faut alors relancer ce script).
//
// Pourquoi le plan du site et pas toutes les pages : il liste exactement les
// pages que le visiteur peut trouver. Les redirections des anciens index, les
// pages de travail, studio/ et le serveur de suivi (_serveur/, jamais publié
// ici) n'y sont pas, et n'ont pas à être comptés.
//
// Outil d'ÉCRITURE, lancé à la main, jamais en CI.
//
//   node scripts/injecter-compteur.mjs           liste ce qui serait modifié
//   node scripts/injecter-compteur.mjs --apply   écrit

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const LIGNE_COMPTEUR = '<script src="/assets/js/compteur.js?v=compteur-20261121-1" defer></script>';

// Les pages HTML du plan du site, en chemins du dépôt (« outils/index.html »).
export function pagesDuPlanDuSite(racine = root) {
  const plan = fs.readFileSync(path.join(racine, "sitemap.xml"), "utf8");
  const pages = new Set();
  for (const [, adresse] of plan.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const url = new URL(adresse);
    if (url.hostname !== "mathsgo.re") continue;
    let relatif = decodeURIComponent(url.pathname).replace(/^\//, "");
    if (relatif === "" || relatif.endsWith("/")) relatif += "index.html";
    if (!relatif.toLowerCase().endsWith(".html")) continue; // PDF, vidéos : pas de <head>
    pages.add(relatif);
  }
  return [...pages].sort();
}

export function porteLeCompteur(html) {
  return /<script\b[^>]*\bsrc\s*=\s*["']\/assets\/js\/compteur\.js(?:\?[^"']*)?["']/i.test(html);
}

export function insererLigne(html) {
  // Le dépôt mélange les fins de ligne, parfois dans un même fichier
  // (conversions_unites_aires.html). On reprend celle de la ligne où l'on écrit.
  const finDeLigneAvant = (indice) => {
    const debutDeLigne = html.lastIndexOf("\n", indice);
    return debutDeLigne > 0 && html[debutDeLigne - 1] === "\r" ? "\r\n" : "\n";
  };
  const finHead = html.search(/<\/head>/i);
  if (finHead !== -1) {
    const fin = finDeLigneAvant(finHead);
    return html.slice(0, finHead) + LIGNE_COMPTEUR + fin + html.slice(finHead);
  }
  const debutBody = html.search(/<body\b/i);
  if (debutBody !== -1) {
    const fin = finDeLigneAvant(debutBody);
    return html.slice(0, debutBody) + LIGNE_COMPTEUR + fin + html.slice(debutBody);
  }
  return null;
}

function principal() {
  const apply = process.argv.includes("--apply");
  const modifiees = [];
  const dejaFaites = [];
  const introuvables = [];
  const sansPointInsertion = [];

  for (const relatif of pagesDuPlanDuSite()) {
    const absolu = path.join(root, relatif);
    if (!fs.existsSync(absolu)) {
      introuvables.push(relatif);
      continue;
    }
    const html = fs.readFileSync(absolu, "utf8");
    if (porteLeCompteur(html)) {
      dejaFaites.push(relatif);
      continue;
    }
    const modifie = insererLigne(html);
    if (modifie === null) {
      sansPointInsertion.push(relatif);
      continue;
    }
    modifiees.push(relatif);
    if (apply) fs.writeFileSync(absolu, modifie, "utf8");
  }

  console.log(`${apply ? "Modifiées" : "À modifier"} : ${modifiees.length}`);
  for (const p of modifiees) console.log(`  ${p}`);
  console.log(`Déjà équipées : ${dejaFaites.length}`);
  if (introuvables.length) {
    console.log(`Dans le plan du site mais absentes du dépôt : ${introuvables.length}`);
    for (const p of introuvables) console.log(`  ${p}`);
  }
  if (sansPointInsertion.length) {
    console.log(`Sans <head> ni <body> (non modifiées) : ${sansPointInsertion.length}`);
    for (const p of sansPointInsertion) console.log(`  ${p}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  principal();
}
