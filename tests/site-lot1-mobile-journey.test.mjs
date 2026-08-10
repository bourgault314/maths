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

test("le fil d'Ariane mobile garde un seul retour contextuel", () => {
  assert.match(catalogueScript, /class="breadcrumb-parent" data-breadcrumb-target="domain"/);
  assert.match(catalogueStyles, /catalogue-breadcrumb:has\(\.breadcrumb-parent\) \.breadcrumb-back\s*\{[^}]*display:\s*none/s);
  assert.match(catalogueStyles, /body\.catalogue-is-deep \.breadcrumb-parent\s*\{[^}]*width:\s*100%;[^}]*text-overflow:\s*ellipsis/s);
  assert.match(catalogueStyles, /\.breadcrumb-parent::before\s*\{[^}]*content:\s*"←"/s);
  assert.match(catalogueStyles, /body\.catalogue-is-deep \.breadcrumb-back\s*\{[^}]*min-height:\s*44px/s);
  assert.match(catalogueStyles, /body\.catalogue-is-deep \.breadcrumb-parent\s*\{[^}]*min-height:\s*44px/s);
  assert.match(catalogueStyles, /\.catalogue-breadcrumb button\s*\{[^}]*min-height:\s*44px/s);
});

test("les variantes d'une même ressource restent distinctes du décor de leur carte", () => {
  assert.match(catalogueStyles, /\.resource-variants\s*\{[^}]*gap:\s*5px/s);
  assert.match(catalogueStyles, /\.resource-variants a\s*\{[^}]*border:\s*1px solid #dbe4eb;[^}]*background:\s*#ffffff/s);
  assert.match(catalogueStyles, /\.resource-variants a:hover,[\s\S]*?background:\s*#f4f7fa/s);
});

test("la couche compacte Rekenrek couvre les tablettes et conserve les gestes du plateau", () => {
  assert.match(rekenrekStyles, /@media\s*\(max-width:\s*1100px\)/);
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
  assert.match(parentNavigationScript, /if \(!\/\^\\\/outils\\\/bouliers\\\/rekenrek\\\//);
  assert.match(parentNavigationScript, /return;\n\s*normaliseViewport\(\);/);
  assert.doesNotMatch(parentNavigationScript, /document\.createElement\("a"\)/);
  assert.match(parentNavigationScript, /window\.self !== window\.top[\s\S]*?link\.target = "_top"/);
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
