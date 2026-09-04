#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const catalogueSource = fs.readFileSync(path.join(root, "assets/js/catalogue-refonte-data.js"), "utf8").trim();
const catalogue = JSON.parse(catalogueSource
  .replace(/^window\.MATHSGO_CATALOGUE\s*=\s*/, "")
  .replace(/;\s*$/, ""));
const apply = process.argv.includes("--apply");
const changed = [];

function normaliseResourcePath(resourcePath) {
  return resourcePath.endsWith("/") ? `${resourcePath}index.html` : resourcePath;
}

function hasExplicitParentLink(html) {
  if (/history\.(?:back|go)\s*\(/i.test(html)) return true;
  return [...html.matchAll(/<a\b([^>]*)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)]
    .some((match) => {
      const label = `${match[1]} ${match[3]} ${match[4].replace(/<[^>]+>/g, " ")}`;
      return /(retour|revenir|accueil|menu|sommaire|index|←|🏠|⌂)/i.test(label)
        && match[2] !== "#"
        && !/^javascript:/i.test(match[2]);
    });
}

const statusRank = { hidden: 0, review: 1, published: 2 };
const resourcesByPath = new Map();
for (const resource of catalogue.resources) {
  if (!(resource.path.endsWith(".html") || resource.path.endsWith("/"))) continue;
  const resourcePath = normaliseResourcePath(resource.path);
  const previous = resourcesByPath.get(resourcePath);
  if (!previous || (statusRank[resource.status] ?? -1) > (statusRank[previous.status] ?? -1)) {
    resourcesByPath.set(resourcePath, resource);
  }
}

for (const [resourcePath, resource] of resourcesByPath) {
  if (resource.status !== "published") continue;

  const absolutePath = path.join(root, resourcePath);
  if (!fs.existsSync(absolutePath)) continue;
  const html = fs.readFileSync(absolutePath, "utf8");
  if (/tool-parent-navigation\.js/i.test(html) || hasExplicitParentLink(html)) continue;

  const relativeScript = path.posix.relative(
    path.posix.dirname(resourcePath),
    "assets/js/tool-parent-navigation.js",
  );
  const tag = `<script defer src="${relativeScript}?v=1"></script>`;
  let updated;
  if (/<\/head>/i.test(html)) {
    updated = html.replace(/<\/head>/i, `${tag}\n</head>`);
  } else if (/<body\b/i.test(html)) {
    updated = html.replace(/<body\b/i, `${tag}\n<body`);
  } else if (/<script\b[^>]*mention-confidentialite\.js[^>]*><\/script>/i.test(html)) {
    updated = html.replace(
      /(<script\b[^>]*mention-confidentialite\.js[^>]*><\/script>)/i,
      `$1\n${tag}`,
    );
  } else if (/<\/style>/i.test(html)) {
    updated = html.replace(/<\/style>/i, `</style>\n${tag}`);
  } else {
    throw new Error(`Point d’insertion HTML introuvable : ${resourcePath}`);
  }
  if (apply) fs.writeFileSync(absolutePath, updated);
  changed.push(resourcePath);
}

console.log(`${apply ? "Modifiées" : "À modifier"} : ${changed.length} page(s)`);
for (const resourcePath of changed) console.log(`- ${resourcePath}`);
