#!/usr/bin/env node

// Vérifie que sitemap.xml correspond exactement au catalogue publié et aux
// pages d’entrée explicitement autorisées. Le catalogue reste ainsi la source
// de vérité : aucun fichier masqué ou de travail ne peut entrer dans le sitemap
// par simple présence sur le disque.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  hasNoindexDirective,
  loadCatalogue,
  nonPublicHtmlPaths,
  publicEntries,
  SITE_ORIGIN
} from "./lib/seo-publication.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const catalogue = loadCatalogue(root);
const expectedEntries = publicEntries(catalogue);
const expectedByUrl = new Map(expectedEntries.map((entry) => [entry.url, entry]));

const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const errors = [];

if (locs.length === 0) {
  errors.push("Aucune URL trouvée dans sitemap.xml : fichier vide ou malformé ?");
}

if (new Set(locs).size !== locs.length) {
  const duplicates = locs.filter((url, index) => locs.indexOf(url) !== index);
  errors.push(`URL dupliquée${duplicates.length > 1 ? "s" : ""} : ${[...new Set(duplicates)].join(", ")}`);
}

for (const expected of expectedByUrl.keys()) {
  if (!locs.includes(expected)) errors.push(`URL publique absente : ${expected}`);
}
for (const actual of locs) {
  if (!expectedByUrl.has(actual)) errors.push(`URL non déclarée comme publique : ${actual}`);
}

for (const url of locs) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    errors.push(`URL invalide : ${url}`);
    continue;
  }
  if (parsed.origin !== new URL(SITE_ORIGIN).origin || parsed.protocol !== "https:") {
    errors.push(`URL hors domaine : ${url}`);
    continue;
  }
  if (parsed.search || parsed.hash) errors.push(`URL avec paramètres ou fragment : ${url}`);

  const expected = expectedByUrl.get(url);
  if (!expected) continue;
  const target = path.join(root, expected.filePath);
  if (!fs.existsSync(target)) {
    errors.push(`URL sans fichier : ${url} → ${expected.filePath}`);
    continue;
  }
  if (expected.filePath.endsWith(".html")) {
    const html = fs.readFileSync(target, "utf8");
    if (/<meta\b(?=[^>]*\bname\s*=\s*["']robots["'])[^>]*\bnoindex\b[^>]*>/i.test(html)) {
      errors.push(`Page publique en noindex : ${url}`);
    }
    if (/<meta\b(?=[^>]*http-equiv\s*=\s*["']refresh["'])[^>]*>/i.test(html)) {
      errors.push(`Page publique avec redirection meta refresh : ${url}`);
    }
    const canonical = html.match(/<link\b(?=[^>]*\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["'])[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/i)
      || html.match(/<link\b(?=[^>]*\bhref\s*=\s*["']([^"']+)["'])[^>]*\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["'][^>]*>/i);
    if (!canonical) {
      errors.push(`Canonical absente : ${url}`);
    } else if (canonical[1] !== url) {
      errors.push(`Canonical incorrecte : ${url} → ${canonical[1]}`);
    }
  }
}

for (const relativePath of nonPublicHtmlPaths(root, catalogue)) {
  const html = fs.readFileSync(path.join(root, relativePath), "utf8");
  if (!hasNoindexDirective(html)) {
    errors.push(`Page hors catalogue public sans noindex : ${relativePath}`);
  }
}

if (errors.length > 0) {
  console.error(`ERREUR — ${errors.length} problème(s) dans sitemap.xml :`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`OK — ${locs.length} URL du sitemap synchronisées avec le catalogue, les hubs et leurs canonical.`);
