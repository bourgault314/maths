#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDirectoryHtml,
  buildSitemapXml,
  loadCatalogue,
  metadataPages,
  publicEntries,
  updateHtmlMetadata,
  updateRekenrekHub
} from "./lib/seo-publication.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const catalogue = loadCatalogue(root);
const stale = [];
const changed = [];

function syncFile(relativePath, expected) {
  const target = path.join(root, relativePath);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current === expected) return;
  if (checkOnly) {
    stale.push(relativePath);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected);
    changed.push(relativePath);
  }
}

for (const page of metadataPages(catalogue)) {
  if (page.path === "outils/toutes-les-ressources.html") continue;
  const target = path.join(root, page.path);
  if (!fs.existsSync(target)) {
    stale.push(`${page.path} (fichier absent)`);
    continue;
  }
  const current = fs.readFileSync(target, "utf8");
  let expected = updateHtmlMetadata(current, page);
  if (page.path === "outils/bouliers/rekenrek/index.html") {
    expected = updateRekenrekHub(expected, catalogue);
  }
  syncFile(page.path, expected);
}

syncFile("outils/toutes-les-ressources.html", buildDirectoryHtml(catalogue));
syncFile("sitemap.xml", buildSitemapXml(catalogue));

if (stale.length > 0) {
  console.error(`Référencement désynchronisé (${stale.length} fichier${stale.length > 1 ? "s" : ""}) :`);
  for (const file of stale) console.error(`- ${file}`);
  console.error("Lancez « npm run seo:generer » puis validez les changements.");
  process.exit(1);
}

if (checkOnly) {
  console.log(`Référencement synchronisé : ${publicEntries(catalogue).length} URL publiques et métadonnées à jour.`);
} else {
  console.log(`Référencement généré : ${publicEntries(catalogue).length} URL publiques, ${changed.length} fichier${changed.length > 1 ? "s" : ""} mis à jour.`);
}
