const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const catalogueScriptPath = path.join(root, "assets/js/catalogue-refonte.js");
const catalogueScript = fs.readFileSync(catalogueScriptPath, "utf8");
const catalogueStyles = fs.readFileSync(path.join(root, "assets/css/catalogue-refonte.css"), "utf8");
const catalogueHtml = fs.readFileSync(path.join(root, "outils/index.html"), "utf8");
const dataContext = { window: {} };
vm.runInNewContext(
  fs.readFileSync(path.join(root, "assets/js/catalogue-refonte-data.js"), "utf8"),
  dataContext,
);

function collectThumbnailReferences(value, references = new Set()) {
  if (!value || typeof value !== "object") return references;
  if (typeof value.thumbnail === "string") references.add(value.thumbnail.split("?")[0]);
  Object.values(value).forEach((child) => collectThumbnailReferences(child, references));
  return references;
}

const dataThumbnails = collectThumbnailReferences(dataContext.window.MATHSGO_CATALOGUE);
const interfaceThumbnails = [...catalogueScript.matchAll(/thumbnail:\s*"([^"]+)"/g)]
  .map((match) => match[1].split("?")[0]);
const allThumbnails = new Set([...dataThumbnails, ...interfaceThumbnails]);
const pngThumbnails = [...allThumbnails].filter((thumbnail) => /\.png$/i.test(thumbnail));

global.window = {};
delete require.cache[require.resolve(catalogueScriptPath)];
require(catalogueScriptPath);
const thumbnailHelpers = global.window.MATHSGO_CATALOGUE_THUMBNAILS;

test("toutes les miniatures et tous les replis WebP existent", () => {
  assert.ok(allThumbnails.size >= 89, "l’inventaire doit couvrir les données et les collections de l’interface");
  assert.ok(pngThumbnails.length >= 66, "tous les PNG actuels doivent être couverts");

  for (const thumbnail of allThumbnails) {
    assert.ok(fs.existsSync(path.join(root, thumbnail)), thumbnail);
  }

  for (const thumbnail of pngThumbnails) {
    const originalPath = path.join(root, thumbnail);
    const webpPath = path.join(root, thumbnailHelpers.webpVariant(thumbnail));
    assert.ok(fs.existsSync(webpPath), `variante WebP manquante pour ${thumbnail}`);
    const signature = fs.readFileSync(webpPath).subarray(0, 12);
    assert.equal(signature.subarray(0, 4).toString("ascii"), "RIFF", thumbnail);
    assert.equal(signature.subarray(8, 12).toString("ascii"), "WEBP", thumbnail);
    assert.ok(
      fs.statSync(webpPath).size < fs.statSync(originalPath).size,
      `la variante WebP doit alléger ${thumbnail}`,
    );
  }
});

test("le chemin WebP conserve les versions de cache et ignore les SVG", () => {
  assert.equal(
    thumbnailHelpers.webpVariant("assets/img/exemple.png?v=2"),
    "assets/img/exemple.webp?v=2",
  );
  assert.equal(
    thumbnailHelpers.webpVariant("assets/img/exemple.svg?v=2"),
    "assets/img/exemple.svg?v=2",
  );
});

test("la visibilité est calculée sur les deux axes du viewport", () => {
  const viewport = [390, 844];
  assert.equal(thumbnailHelpers.intersectsViewport({ top: 800, right: 300, bottom: 900, left: 20 }, ...viewport), true);
  assert.equal(thumbnailHelpers.intersectsViewport({ top: -80, right: 300, bottom: 1, left: 20 }, ...viewport), true);
  assert.equal(thumbnailHelpers.intersectsViewport({ top: 844, right: 300, bottom: 900, left: 20 }, ...viewport), false);
  assert.equal(thumbnailHelpers.intersectsViewport({ top: 20, right: 0, bottom: 120, left: -100 }, ...viewport), false);
  assert.equal(thumbnailHelpers.intersectsViewport({ top: 20, right: 500, bottom: 120, left: 390 }, ...viewport), false);
});

test("les quatre rendus d’image passent par le même chargement progressif", () => {
  assert.equal((catalogueScript.match(/thumbnailMarkup\(/g) || []).length, 5);
  assert.equal((catalogueScript.match(/loading="lazy"/g) || []).length, 1);
  assert.match(catalogueScript, /<picture class="catalogue-thumbnail-picture"><source data-thumbnail-srcset=/);
  assert.match(catalogueScript, /data-thumbnail-src="[^\n]+alt="" loading="lazy" decoding="async" data-catalogue-thumbnail/);
  assert.match(catalogueStyles, /\.catalogue-thumbnail-picture\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
  assert.match(catalogueStyles, /\.collection-thumbnail img\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;/s);
});

test("seules les miniatures visibles sont prioritaires", () => {
  assert.match(catalogueScript, /const priorityImage = visibleImages\.find\(\(image\) => !image\.complete\) \|\| visibleImages\[0\];/);
  assert.match(
    catalogueScript,
    /priorityImage\.setAttribute\("fetchpriority", "high"\);[\s\S]*?image\.setAttribute\("loading", visibleSet\.has\(image\) \? "eager" : "lazy"\);[\s\S]*?image\.src = image\.dataset\.thumbnailSrc;/,
    "la priorité et le mode de chargement doivent être fixés avant de fournir l’URL au navigateur",
  );
  assert.match(catalogueScript, /function scrollInstantlyTo\(top\)[\s\S]*?scheduleThumbnailPriorityRefresh\(\);\s*\}/);
  assert.match(catalogueScript, /notionGrid\.innerHTML[\s\S]*?scheduleThumbnailPriorityRefresh\(\);/);
  assert.match(catalogueScript, /resourceGrid\.innerHTML = directAccess \+ groupedResources;\s*scheduleThumbnailPriorityRefresh\(\);/);
});

test("les versions de cache publient ensemble le JavaScript et le CSS", () => {
  assert.match(catalogueHtml, /catalogue-refonte\.css\?v=miniatures-20260811-1/);
  assert.match(catalogueHtml, /catalogue-refonte\.js\?v=miniatures-20260811-1/);
});
