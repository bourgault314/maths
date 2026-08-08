import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  buildDirectoryHtml,
  buildCollectionResourceSections,
  buildSitemapXml,
  allHtmlFilePaths,
  hasNoindexDirective,
  loadCatalogue,
  metadataPages,
  nonPublicHtmlPaths,
  publicEntries,
  publicUrlForPath,
  publishedCollectionResources,
  relativeHref,
  updateHtmlMetadata,
  updateHtmlNoindex
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

test("les pages hors catalogue public reçoivent un noindex idempotent", () => {
  const input = "<!doctype html><html><head><title>Travail en cours</title></head><body></body></html>";
  const once = updateHtmlNoindex(input, "travail.html");
  const twice = updateHtmlNoindex(once, "travail.html");
  assert.equal(twice, once);
  assert.match(once, /<meta name="robots" content="noindex, follow">/);

  for (const relativePath of nonPublicHtmlPaths(root, catalogue)) {
    const html = fs.readFileSync(path.join(root, relativePath), "utf8");
    assert.ok(hasNoindexDirective(html), relativePath);
  }
});

test("le recensement HTML ignore les dossiers techniques exclus de la publication", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mathsgo-seo-"));
  try {
    fs.mkdirSync(path.join(fixtureRoot, "outils"));
    fs.mkdirSync(path.join(fixtureRoot, "_site"));
    fs.mkdirSync(path.join(fixtureRoot, ".cache"));
    fs.writeFileSync(path.join(fixtureRoot, "index.html"), "");
    fs.writeFileSync(path.join(fixtureRoot, "outils", "outil.HTML"), "");
    fs.writeFileSync(path.join(fixtureRoot, "_site", "copie.html"), "");
    fs.writeFileSync(path.join(fixtureRoot, ".cache", "copie.html"), "");

    assert.deepEqual(allHtmlFilePaths(fixtureRoot), ["index.html", "outils/outil.HTML"]);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("ÉquaBarre et ÉquaSplat restent publics, leurs récepteurs import restent techniques", () => {
  const publicPaths = new Set(publicEntries(catalogue).map(({ filePath }) => filePath));
  const privatePaths = new Set(nonPublicHtmlPaths(root, catalogue));
  for (const relativePath of ["outils/equabarre.html", "outils/equasplat.html"]) {
    assert.ok(publicPaths.has(relativePath), relativePath);
    assert.ok(!hasNoindexDirective(fs.readFileSync(path.join(root, relativePath), "utf8")), relativePath);
  }
  for (const relativePath of ["outils/equabarre_import_splat.html", "outils/equasplat_import_splat.html"]) {
    assert.ok(privatePaths.has(relativePath), relativePath);
    assert.ok(hasNoindexDirective(fs.readFileSync(path.join(root, relativePath), "utf8")), relativePath);
  }

  const questionEngine = fs.readFileSync(path.join(root, "auto/scripts/02-question-engine.js"), "utf8");
  assert.match(questionEngine, /equabarre_import_splat\.html/);
  assert.match(questionEngine, /equasplat_import_splat\.html/);
});

test("le hub Gerbert ne relie que ses ressources publiées", () => {
  const hubPath = "outils/bouliers/abaque_de_gerbert/index.html";
  const hub = fs.readFileSync(path.join(root, hubPath), "utf8");
  const gerbertResources = catalogue.resources.filter(({ path: resourcePath }) => (
    resourcePath.startsWith("outils/bouliers/abaque_de_gerbert/") && resourcePath !== hubPath
  ));
  for (const resource of gerbertResources) {
    const href = relativeHref(hubPath, resource.path);
    if (resource.status === "published") assert.match(hub, new RegExp(`href=["']${href}["']`), resource.path);
    else assert.doesNotMatch(hub, new RegExp(`href=["']${href}["']`), resource.path);
  }
});

test("les workflows bloquent le SEO désynchronisé et excluent le gabarit Axelle", () => {
  const checksWorkflow = fs.readFileSync(path.join(root, ".github/workflows/verifications.yml"), "utf8");
  const publishWorkflow = fs.readFileSync(path.join(root, ".github/workflows/publier.yml"), "utf8");
  assert.match(checksWorkflow, /node scripts\/generate-seo\.mjs --check/);
  assert.match(publishWorkflow, /node scripts\/generate-seo\.mjs --check/);
  assert.match(publishWorkflow, /--exclude 'axelle\/daily\/template-index\.html'/);
});

test("les sorties générées présentes dans le dépôt sont synchronisées", () => {
  assert.equal(fs.readFileSync(path.join(root, "sitemap.xml"), "utf8"), buildSitemapXml(catalogue));
  assert.equal(fs.readFileSync(path.join(root, "outils/toutes-les-ressources.html"), "utf8"), buildDirectoryHtml(catalogue));
});
