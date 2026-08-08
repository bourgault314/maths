import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  buildDirectoryHtml,
  buildCollectionResourceSections,
  buildSitemapXml,
  loadCatalogue,
  metadataPages,
  publicEntries,
  publicUrlForPath,
  publishedCollectionResources,
  relativeHref,
  updateHtmlMetadata
} from "../scripts/lib/seo-publication.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = loadCatalogue(root);
const published = catalogue.resources.filter(({ status }) => status === "published");

test("les URL d’index utilisent leur adresse publique courte", () => {
  assert.equal(publicUrlForPath("index.html"), "https://mathsgo.re/");
  assert.equal(publicUrlForPath("auto/index.html"), "https://mathsgo.re/auto/");
  assert.equal(
    publicUrlForPath("outils/bouliers/rekenrek/cache cache.html"),
    "https://mathsgo.re/outils/bouliers/rekenrek/cache%20cache.html"
  );
  assert.equal(
    relativeHref("outils/bouliers/rekenrek/index.html", "outils/bouliers/rekenrek/cache cache.html"),
    "cache%20cache.html"
  );
});

test("le sitemap contient chaque ressource publiée et chaque collection une seule fois", () => {
  const entries = publicEntries(catalogue);
  const urls = entries.map(({ url }) => url);
  assert.equal(new Set(urls).size, urls.length);
  for (const resource of published) {
    assert.ok(urls.includes(publicUrlForPath(resource.path)), resource.path);
  }
  for (const collection of catalogue.collections) {
    assert.ok(urls.includes(publicUrlForPath(`outils/${collection.hub}`)), collection.id);
  }
  const xml = buildSitemapXml(catalogue);
  assert.equal((xml.match(/<loc>/g) || []).length, entries.length);
});

test("l’annuaire contient un lien HTML direct vers chaque ressource publiée", () => {
  const html = buildDirectoryHtml(catalogue);
  for (const resource of published) {
    assert.ok(html.includes(`href="${publicUrlForPath(resource.path)}"`), resource.path);
  }
});

test("le hub Rekenrek suit exactement les ressources publiées de sa collection", () => {
  const resources = publishedCollectionResources(catalogue, "rekenrek");
  const sections = buildCollectionResourceSections(catalogue, "rekenrek");
  assert.equal(resources.length, 27);
  for (const resource of resources) {
    assert.ok(sections.includes(`href="${relativeHref("outils/bouliers/rekenrek/index.html", resource.path)}"`), resource.path);
  }
  assert.doesNotMatch(sections, /boss_final\.html|rekenrek_sheet_generator_lecture\.html|rekenrek_sheet_generator_double_niv1\.html/);
});

test("les métadonnées sont ajoutées de façon idempotente", () => {
  const page = metadataPages(catalogue).find(({ path: pagePath }) => pagePath === "outils/bouliers/rekenrek/rekenrek.html");
  const input = "<!doctype html><html><head><meta charset=\"utf-8\"><title>Ancien titre</title></head><body></body></html>";
  const once = updateHtmlMetadata(input, page);
  const twice = updateHtmlMetadata(once, page);
  assert.equal(twice, once);
  assert.match(once, /<meta name="description"/);
  assert.match(once, /<link rel="canonical" href="https:\/\/mathsgo\.re\/outils\/bouliers\/rekenrek\/rekenrek\.html">/);
  assert.match(once, /<meta name="robots" content="index, follow, max-image-preview:large">/);
});

test("les sorties générées présentes dans le dépôt sont synchronisées", () => {
  assert.equal(fs.readFileSync(path.join(root, "sitemap.xml"), "utf8"), buildSitemapXml(catalogue));
  assert.equal(fs.readFileSync(path.join(root, "outils/toutes-les-ressources.html"), "utf8"), buildDirectoryHtml(catalogue));
});
