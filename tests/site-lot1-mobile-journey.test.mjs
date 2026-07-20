import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalogueScript = await readFile(new URL("../assets/js/catalogue-refonte.js", import.meta.url), "utf8");
const catalogueStyles = await readFile(new URL("../assets/css/catalogue-refonte.css", import.meta.url), "utf8");
const parentNavigationScript = await readFile(new URL("../assets/js/tool-parent-navigation.js", import.meta.url), "utf8");
const rekenrekStyles = await readFile(new URL("../assets/css/rekenrek-mobile-compat.css", import.meta.url), "utf8");
const catalogueSource = await readFile(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8");
const catalogue = JSON.parse(catalogueSource
  .trim()
  .replace(/^window\.MATHSGO_CATALOGUE\s*=\s*/, "")
  .replace(/;\s*$/, ""));

const rekenrekPages = [
  "ajouter9_ajouter8.html",
  "cache-cache.html",
  "comparateur.html",
  "enlever9_enlever8.html",
  "force_5.html",
  "force_5_soustraction.html",
  "grignoteur.html",
  "jeu_des_doubles.html",
  "lecture_de_nombres.html",
  "pont_dizaine.html",
  "pousser_des_nombres.html",
  "presque_doubles.html",
  "rekenrek.html",
  "rekenrek_FD.html",
  "suivant_precedent.html",
  "tables.html",
];

test("le fil d'Ariane profond distingue clairement le retour et le domaine", () => {
  assert.match(catalogueScript, /class="breadcrumb-parent" data-breadcrumb-target="domain"/);
  assert.match(catalogueStyles, /catalogue-breadcrumb:has\(\.breadcrumb-parent\)[^{]*\{[^}]*grid-template-columns:\s*max-content minmax\(0, 1fr\)/s);
  assert.match(catalogueStyles, /\.breadcrumb-parent\s*\{[^}]*background:\s*transparent;[^}]*text-overflow:\s*ellipsis/s);
  assert.match(catalogueStyles, /\.breadcrumb-parent::before\s*\{[^}]*content:\s*"›"/s);
});

test("la couche Rekenrek reste limitée au mobile et conserve les gestes du plateau", () => {
  assert.match(rekenrekStyles, /@media\s*\(max-width:\s*720px\)/);
  assert.match(rekenrekStyles, /body\s*\{[^}]*touch-action:\s*pan-y pinch-zoom/s);
  assert.match(rekenrekStyles, /#main-container\s*\{[^}]*touch-action:\s*none/s);
  assert.match(rekenrekStyles, /\.toolbar\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(rekenrekStyles, /min-height:\s*44px\s*!important/);
  assert.doesNotMatch(rekenrekStyles, /@media\s*print\s*\{[\s\S]*?(?:transform|width|height|position)\s*:/);
});

test("la compatibilité Rekenrek fonctionne aussi sur un aperçu servi dans un sous-dossier", () => {
  assert.match(parentNavigationScript, /const siteBaseUrl = new URL\("\.\.\/\.\.\/", scriptSource\)/);
  assert.match(parentNavigationScript, /currentSitePathname\(\)/);
  assert.match(parentNavigationScript, /new URL\("assets\/css\/rekenrek-mobile-compat\.css\?v=1", siteBaseUrl\)/);
  assert.match(parentNavigationScript, /normaliseViewport\(\)/);
});

test("les seize anciens outils Rekenrek chargent la navigation et autorisent le zoom", async () => {
  for (const filename of rekenrekPages) {
    const html = await readFile(new URL(`../outils/bouliers/rekenrek/${filename}`, import.meta.url), "utf8");
    assert.match(html, /tool-parent-navigation\.js/, filename);
    const viewport = html.match(/<meta\b[^>]*name=["']viewport["'][^>]*>/i)?.[0] ?? "";
    assert.match(viewport, /width\s*=\s*device-width/i, filename);
    assert.doesNotMatch(viewport, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?/i, filename);
  }
});

test("aucune ressource HTML publiée ne bloque le zoom utilisateur", async () => {
  const publishedPaths = [...new Set(catalogue.resources
    .filter((resource) => resource.status === "published" && (resource.path.endsWith(".html") || resource.path.endsWith("/")))
    .map((resource) => resource.path.endsWith("/") ? `${resource.path}index.html` : resource.path))];

  for (const resourcePath of publishedPaths) {
    const html = await readFile(new URL(`../${resourcePath}`, import.meta.url), "utf8");
    const viewport = html.match(/<meta\b[^>]*name=["']viewport["'][^>]*>/i)?.[0] ?? "";
    assert.doesNotMatch(
      viewport,
      /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?/i,
      resourcePath,
    );
  }
});
