#!/usr/bin/env node

// Vérifie que chaque URL déclarée dans sitemap.xml correspond à un fichier
// réellement présent dans le dépôt. Garde le contrat de non-régression décrit
// dans docs/inventaire-urls-publiques.md : une URL publiée ne doit jamais
// pointer vers un fichier manquant.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const origin = "https://mathsgo.re/";

const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const errors = [];

if (locs.length === 0) {
  errors.push("Aucune URL trouvée dans sitemap.xml : fichier vide ou malformé ?");
}

for (const url of locs) {
  if (!url.startsWith(origin)) {
    errors.push(`URL hors domaine : ${url}`);
    continue;
  }
  let relative = decodeURIComponent(url.slice(origin.length));
  if (relative === "" || relative.endsWith("/")) relative += "index.html";
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) {
    errors.push(`URL sans fichier : ${url} → ${relative}`);
  }
}

if (errors.length > 0) {
  console.error(`ERREUR — ${errors.length} problème(s) dans sitemap.xml :`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`OK — ${locs.length} URL du sitemap vérifiées, chacune correspond à un fichier existant.`);
