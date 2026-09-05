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
/* Les pages de collection (outils/<theme>/index.html) affichent elles aussi des
   miniatures : depuis que « Chat, c'est toi le chat ! » tient dans une seule carte,
   c'est la page du jeu — et non plus le catalogue — qui appelle trois de ces PNG. */
const collectionThumbnails = fs
  .readdirSync(path.join(root, "outils"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(root, "outils", entry.name, "index.html"))
  .filter((pagePath) => fs.existsSync(pagePath))
  .flatMap((pagePath) =>
    fs.readFileSync(pagePath, "utf8")
      .split('"')
      .filter((morceau) => morceau.includes("assets/img/thumbnails/"))
      .map((morceau) => morceau.slice(morceau.indexOf("assets/img/thumbnails/")).split("?")[0]));
const allThumbnails = new Set([...dataThumbnails, ...interfaceThumbnails, ...collectionThumbnails]);
const pngThumbnails = [...allThumbnails].filter((thumbnail) => /\.png$/i.test(thumbnail));

global.window = {};
delete require.cache[require.resolve(catalogueScriptPath)];
require(catalogueScriptPath);
const thumbnailHelpers = global.window.MATHSGO_CATALOGUE_THUMBNAILS;

test("toutes les miniatures et tous les replis WebP existent", () => {
  assert.ok(allThumbnails.size >= 92, "l’inventaire doit couvrir les données, les collections de l’interface et les pages de collection");
  assert.ok(pngThumbnails.length >= 68, "tous les PNG actuels doivent être couverts");

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

test("le premier rang est eager selon le nombre de colonnes", () => {
  const cases = [
    { width: 390, eager: 1 },
    { width: 768, eager: 2 },
    { width: 1366, eager: 3 },
  ];

  for (const { width, eager } of cases) {
    const priorities = Array.from({ length: 6 }, (_, index) => (
      thumbnailHelpers.thumbnailPriority(index, width)
    ));
    assert.equal(thumbnailHelpers.eagerThumbnailCount(width), eager);
    assert.deepEqual(
      priorities.map((priority) => priority.loading),
      Array.from({ length: 6 }, (_, index) => index < eager ? "eager" : "lazy"),
    );
    assert.deepEqual(
      priorities.map((priority) => priority.fetchPriority),
      ["high", "", "", "", "", ""],
    );
  }
});

test("les quatre rendus d’image passent par le même chargement progressif", () => {
  assert.equal((catalogueScript.match(/thumbnailMarkup\(/g) || []).length, 5);
  assert.match(catalogueScript, /<picture class="catalogue-thumbnail-picture"><source srcset=/);
  assert.match(catalogueScript, /const image = `<img\$\{priorityAttribute\} src="\$\{escapeHtml\(source\)\}" alt="" loading="\$\{priority\.loading\}" data-catalogue-thumbnail>`/);
  assert.doesNotMatch(catalogueScript, /data-thumbnail-src/);
  assert.doesNotMatch(catalogueScript, /decoding="async"/);
  assert.match(catalogueStyles, /\.catalogue-thumbnail-picture\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
  assert.match(catalogueStyles, /\.collection-thumbnail img\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;/s);
});

test("les URL partent immédiatement sans ordonnanceur de mise en page", () => {
  assert.doesNotMatch(catalogueScript, /refreshThumbnailPriorities|scheduleThumbnailPriorityRefresh|queueMicrotask/);
  assert.equal((catalogueScript.match(/beginThumbnailRender\(\)/g) || []).length, 2);
  assert.match(catalogueScript, /function render\(\) \{\s*beginThumbnailRender\(\);/);
  assert.doesNotMatch(catalogueScript, /image\.src\s*=|pictureSource\.srcset\s*=/);
});

test("les versions de cache publient ensemble le JavaScript et le CSS", () => {
  assert.match(catalogueHtml, /catalogue-refonte\.css\?v=breadcrumb-align-20260829-1/);
  assert.match(catalogueHtml, /catalogue-refonte\.js\?v=multiplication-posee-20260905-1/);
});
