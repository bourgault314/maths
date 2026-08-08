import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadCatalogue, publicUrlForPath } from "../scripts/lib/seo-publication.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = loadCatalogue(root);
const homeHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const catalogueHtml = fs.readFileSync(path.join(root, "outils/index.html"), "utf8");
const catalogueJs = fs.readFileSync(path.join(root, "assets/js/catalogue-refonte.js"), "utf8");
const directoryHtml = fs.readFileSync(path.join(root, "outils/toutes-les-ressources.html"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

test("les domaines ayant des ressources sont de vrais liens dans le HTML initial", () => {
  for (const domain of catalogue.domains) {
    const count = catalogue.resources.filter(({ status, domains }) => status === "published" && domains.includes(domain.id)).length;
    if (domain.id === "cps") {
      assert.match(catalogueHtml, /<a[^>]+data-domain-card="cps"[^>]+data-domain-direct="true"/);
    } else if (count > 0) {
      assert.match(catalogueHtml, new RegExp(`<a[^>]+href="\\?domain=${domain.id}"[^>]+data-domain-card="${domain.id}"`));
    }
  }
  assert.match(catalogueJs, /const tag = count \? "a" : "div";/);
  assert.match(catalogueJs, /event\.preventDefault\(\);/);
});

test("l’annuaire statique est lié depuis l’accueil et le catalogue", () => {
  assert.match(homeHtml, /href="outils\/toutes-les-ressources\.html"/);
  assert.match(catalogueHtml, /href="toutes-les-ressources\.html"/);
});

test("l’annuaire expose les ressources publiées et aucune ressource non publiée", () => {
  const publishedUrls = new Set(catalogue.resources
    .filter(({ status }) => status === "published")
    .map(({ path: resourcePath }) => publicUrlForPath(resourcePath)));
  for (const resource of catalogue.resources) {
    const url = publicUrlForPath(resource.path);
    const href = `href="${url}"`;
    if (resource.status === "published") assert.ok(directoryHtml.includes(href), resource.path);
    else if (!publishedUrls.has(url)) assert.ok(!directoryHtml.includes(href), resource.path);
  }
});

test("chaque hub de collection est présent dans le sitemap", () => {
  for (const collection of catalogue.collections) {
    const url = publicUrlForPath(`outils/${collection.hub}`);
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), collection.id);
  }
});
