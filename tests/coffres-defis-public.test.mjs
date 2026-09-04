import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const tablesCore = require("../outils/calcul_mental/defi_tables_core.js");

const pageDefinitions = [
  {
    path: "outils/club_maths/carres_gloutons.html",
    canonical: "https://mathsgo.re/outils/club_maths/carres_gloutons.html",
    parent: "../index.html?domain=jeux-recherches&amp;notion=strategie"
  },
  {
    path: "outils/club_maths/coffres_magiques.html",
    canonical: "https://mathsgo.re/outils/club_maths/coffres_magiques.html",
    parent: "../index.html?domain=jeux-recherches&amp;notion=strategie"
  },
  {
    path: "outils/calcul_mental/coffres_magiques_solo.html",
    canonical: "https://mathsgo.re/outils/calcul_mental/coffres_magiques_solo.html",
    parent: "../index.html?domain=nombres-calculs&amp;notion=calcul-mental"
  },
  {
    path: "outils/calcul_mental/defi_tables.html",
    canonical: "https://mathsgo.re/outils/calcul_mental/defi_tables.html",
    parent: "../index.html?domain=nombres-calculs&amp;notion=calcul-mental"
  },
  {
    path: "outils/calcul_mental/defi_calcul.html",
    canonical: "https://mathsgo.re/outils/calcul_mental/defi_calcul.html",
    parent: "../index.html?domain=nombres-calculs&amp;notion=calcul-mental"
  }
];

const pages = Object.fromEntries(await Promise.all(pageDefinitions.map(async definition => [
  definition.path,
  await readFile(new URL(`../${definition.path}`, import.meta.url), "utf8")
])));
const catalogueSource = await readFile(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8");
const catalogueUi = await readFile(new URL("../assets/js/catalogue-refonte.js", import.meta.url), "utf8");
const clubHub = await readFile(new URL("../outils/club_maths/index.html", import.meta.url), "utf8");
const directory = await readFile(new URL("../outils/toutes-les-ressources.html", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const privacy = await readFile(new URL("../confidentialite.html", import.meta.url), "utf8");

const catalogueContext = vm.createContext({ window: {} });
vm.runInContext(catalogueSource, catalogueContext);
const catalogue = catalogueContext.window.MATHSGO_CATALOGUE;

function inlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]+\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
}

test("les cinq adaptations sont publiques, autonomes et reliées à leur vrai parent", () => {
  for (const definition of pageDefinitions) {
    const html = pages[definition.path];
    assert.match(html, new RegExp(`<link rel="canonical" href="${definition.canonical.replaceAll("/", "\\/")}">`), definition.path);
    assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/, definition.path);
    assert.match(html, new RegExp(`href="${definition.parent.replace(/[?]/g, "\\?")}"`), definition.path);
    assert.doesNotMatch(html, /Axelle|Bureau|game-pass/i, definition.path);
    // Le stockage de session servait au laissez-passer du club : banni des
    // adaptations publiques. Défi tables l'emploie depuis le lot A1 pour une
    // autre raison — l'identité de l'élève suivi y vit le temps d'un onglet —
    // et seulement là.
    if (definition.path !== "outils/calcul_mental/defi_tables.html") {
      assert.doesNotMatch(html, /sessionStorage/i, definition.path);
    }
    for (const source of inlineScripts(html)) assert.doesNotThrow(() => new vm.Script(source), definition.path);
  }
});

test("les règles et durées approuvées restent explicites", () => {
  const duel = pages["outils/club_maths/coffres_magiques.html"];
  assert.match(duel, /const KEYS_TO_WIN = 5;/);
  assert.match(duel, /const OPERATION_MODES = \["sum", "difference", "product", "quotient"\];/);
  assert.match(duel, /positionInBlock = \(challengeNumber - 1\) % \(OPERATION_MODES\.length \* 2\)/);
  assert.match(duel, /operationCycle\[Math\.floor\(positionInBlock \/ 2\)\]/);

  const solo = pages["outils/calcul_mental/coffres_magiques_solo.html"];
  assert.match(solo, /const GOAL = 10;/);
  assert.match(solo, /\["sum", "sum", "sum", "difference", "difference", "product", "product", "product", "quotient", "quotient"\]/);

  assert.deepEqual(tablesCore.PRESETS.learn, {
    total: 11,
    duration: null,
    questionTypes: ["direct"],
    selection: "single",
    order: "ordered",
    learnActivity: "construct"
  });
  assert.equal(tablesCore.PRESETS.train.total, 10);
  assert.equal(tablesCore.PRESETS.train.duration, null);
  assert.equal(tablesCore.normalizeConfiguration({mode: "train", tables: [3], total: 20}).total, 20);
  assert.equal(tablesCore.PRESETS.test.total, 25);
  assert.equal(tablesCore.PRESETS.test.duration, 120);
  assert.equal(tablesCore.PRESETS.test.testLevel, 1);
  assert.equal(tablesCore.PRESETS.evaluation.total, 25);
  assert.equal(tablesCore.PRESETS.evaluation.duration, 60);
  assert.match(pages["outils/calcul_mental/defi_calcul.html"], /const TOTAL = 30;[\s\S]*const DURATION = 180;/);
});

test("les deux portes Coffres donnent accès aux modes solo et duo", () => {
  const coffresPaths = [
    "outils/club_maths/coffres_magiques.html",
    "outils/calcul_mental/coffres_magiques_solo.html"
  ];

  for (const path of coffresPaths) {
    const html = pages[path];
    assert.match(html, /id="mode-dialog"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="mode-title"/, path);
    assert.match(html, /id="choose-solo"[\s\S]*Solo — S’entraîner/, path);
    assert.match(html, /id="choose-duo"[\s\S]*Duo — Se défier/, path);
    assert.match(html, /data-change-mode>Changer de mode/, path);
    assert.match(html, /function modeUrl\(nextMode\)[\s\S]*coffres_magiques_solo\.html[\s\S]*coffres_magiques\.html[\s\S]*\?mode=\$\{nextMode\}&from=\$\{origin\}/, path);
    assert.match(html, /#choose-solo"\)\.addEventListener\("click", \(\) => chooseMode\("solo"\)\)/, path);
    assert.match(html, /#choose-duo"\)\.addEventListener\("click", \(\) => chooseMode\("duo"\)\)/, path);
  }

  for (const path of coffresPaths) {
    const resource = catalogue.resources.find(item => item.path === path);
    const classification = catalogue.resourceClassifications[path];
    const catalogueCopy = `${resource?.description || ""} ${classification?.cardDescription || ""}`;
    assert.equal(classification?.cardTitle, "Coffres magiques — solo ou duo", `${path} : le titre sous la miniature sépare encore les deux modes`);
    assert.match(catalogueCopy, /solo/i, `${path} : le catalogue n’annonce pas le solo`);
    assert.match(catalogueCopy, /duo|à deux/i, `${path} : le catalogue n’annonce pas le duo`);
  }
  assert.match(catalogueUi, /const title = classification\.cardTitle \|\| resource\.title;[\s\S]*<h3>\$\{escapeHtml\(title\)\}<\/h3>/);
});

test("le catalogue publie les cinq cartes dans les groupes validés", () => {
  const expected = new Map([
    ["outils/club_maths/carres_gloutons.html", ["jeux-recherches", "strategie", "jeux"]],
    ["outils/club_maths/coffres_magiques.html", ["jeux-recherches", "strategie", "jeux"]],
    ["outils/calcul_mental/coffres_magiques_solo.html", ["nombres-calculs", "calcul-mental", "entrainer"]],
    ["outils/calcul_mental/defi_tables.html", ["nombres-calculs", "calcul-mental", "entrainer"]],
    ["outils/calcul_mental/defi_calcul.html", ["nombres-calculs", "calcul-mental", "entrainer"]]
  ]);

  for (const [path, [domain, notion, group]] of expected) {
    const resource = catalogue.resources.find(item => item.path === path);
    const classification = catalogue.resourceClassifications[path];
    assert.equal(resource?.status, "published", path);
    assert.ok(resource?.domains.includes(domain), path);
    assert.equal(classification?.primaryNotion, notion, path);
    assert.equal(classification?.primaryGroup, group, path);
    assert.ok(classification?.thumbnail, path);
  }
  assert.equal(catalogue.resourceClassifications["outils/club_maths/carres_gloutons.html"].thumbnail, "assets/img/thumbnails/jeux/carres-gloutons.svg?v=5");
  const duelCoffres = catalogue.resourceClassifications["outils/club_maths/coffres_magiques.html"];
  assert.equal(duelCoffres.thumbnail, "assets/img/thumbnails/jeux/coffres-magiques.svg?v=2");
  for (const tag of ["quatre-operations", "somme", "difference", "produit", "quotient"]) {
    assert.ok(duelCoffres.tags.includes(tag), tag);
  }
});

test("Calcul mental expose exactement les six ressources autonomes validées", () => {
  const design = catalogueUi.match(/"calcul-mental":\s*\{([\s\S]*?)\n\s*\},\n\s*proportionnalite:/)?.[1] || "";
  const notion = catalogue.notions.find(item => item.id === "calcul-mental");
  const bouliers = catalogue.collections.find(collection => collection.id === "bouliers");
  const boulierCollections = catalogue.collections.filter(collection => collection.id === "bouliers" || collection.parent === "bouliers");
  const boulierResources = catalogue.resources.filter(resource => resource.path.startsWith("outils/bouliers/"));
  const collectionMap = new Map(catalogue.collections.map(collection => [collection.id, collection]));
  const expectedPaths = [
    "outils/automatismes/CM_Livret_A5.html",
    "outils/calcul_mental/coffres_magiques_solo.html",
    "outils/calcul_mental/defi_calcul.html",
    "outils/calcul_mental/defi_tables.html",
    "outils/calcul_mental/fiche_tables_multiplication.pdf",
    "outils/calcul_mental/fiche_parcours_tables.pdf"
  ].sort();

  const visiblePaths = catalogue.resources.filter(resource => {
    if (resource.status !== "published" || !resource.domains.includes("nombres-calculs")) return false;
    const classification = catalogue.resourceClassifications[resource.path] || {};
    if ((classification.hiddenFromNotions || []).includes("calcul-mental")) return false;
    const belongs = classification.primaryNotion
      ? classification.primaryNotion === "calcul-mental"
      : resource.notions.includes("calcul-mental");
    const collections = new Set(classification.collections || resource.collections || []);
    if (resource.path.startsWith("outils/bouliers/")) collections.add("bouliers");
    const collapsed = [...collections].some(id => collectionMap.get(id)?.collapseInNotion);
    return belongs && !collapsed;
  }).map(resource => resource.path).sort();

  assert.equal(notion?.title, "Calcul mental");
  assert.doesNotMatch(design, /hiddenFromBrowse\s*:\s*true/);
  assert.deepEqual(Array.from(bouliers?.notions || []), ["numeration"]);
  for (const collection of boulierCollections) assert.deepEqual(Array.from(collection.notions), ["numeration"], collection.id);
  assert.deepEqual(Array.from(boulierResources.filter(resource => resource.notions.includes("calcul-mental")), resource => resource.path), []);
  assert.deepEqual(Array.from(boulierResources.filter(resource => catalogue.resourceClassifications[resource.path]?.primaryNotion !== "numeration"), resource => resource.path), []);
  assert.deepEqual(Array.from(visiblePaths), expectedPaths);
  assert.match(catalogueUi, /hiddenFromNotions \|\| \[\]/);
  assert.match(catalogueUi, /const branchIds = notionBranchIds\(notionId\)/);
  assert.match(catalogueUi, /resourceDisplayCount\(resources\) \+ collectionIds\.size/);

  const automatismes = catalogue.resources.find(resource => resource.path === "auto/index.html");
  assert.equal(automatismes?.status, "published");
  assert.ok(catalogue.resourceClassifications[automatismes.path].hiddenFromNotions.includes("calcul-mental"));
});

test("les cinq pages restent accessibles par le sitemap et Toutes les ressources", () => {
  for (const definition of pageDefinitions) {
    const occurrences = sitemap.split(`<loc>${definition.canonical}</loc>`).length - 1;
    assert.equal(occurrences, 1, definition.path);
    assert.ok(directory.includes(`href="${definition.canonical}"`), definition.path);
  }

  assert.ok(directory.includes('href="https://mathsgo.re/auto/"'));
});

test("les cinq pages suivent le socle légal et la mention de confidentialité des outils publics", () => {
  for (const definition of pageDefinitions) {
    const html = pages[definition.path];
    assert.doesNotMatch(html, /consentement\.(css|js)/, definition.path);
    assert.match(html, /<script(?=[^>]*\bdefer\b)(?=[^>]*\bsrc="\.\.\/\.\.\/assets\/js\/mention-confidentialite\.js(?:\?[^"#]*)?")[^>]*><\/script>/, definition.path);

    const legalFooter = [...html.matchAll(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi)]
      .map(match => match[0])
      .find(footer => /data-mathsgo-confidentialite/.test(footer));
    assert.ok(legalFooter, `${definition.path} : pied de page légal absent`);
    assert.match(legalFooter, /href="mailto:gwenael@mathsgo\.re\?subject=Contact%20depuis%20mathsgo\.re"/, definition.path);
    assert.match(legalFooter, /href="(?:\.\.\/\.\.\/|\/)mentions-legales\.html"/, definition.path);
    assert.match(legalFooter, /href="(?:\.\.\/\.\.\/|\/)confidentialite\.html"/, definition.path);
    assert.match(legalFooter, /<span data-mathsgo-confidentialite>Sans cookie ni traceur<\/span>/, definition.path);
  }
});

test("la politique de confidentialité explique les meilleurs scores locaux des deux défis", () => {
  assert.match(privacy, /mathsgo-defi-tables-best-v1/);
  assert.match(privacy, /mathsgo-defi-calcul-best-v1/);
  assert.match(privacy, /ne sont ni des cookies publicitaires ni des données d’audience/);
  assert.match(privacy, /supprimant les données du site dans les réglages de votre navigateur/);
});

test("le hub Club Math relie Coffres magiques et garde une grille équilibrée", () => {
  assert.match(clubHub, /href="coffres_magiques\.html" class="card coffres"/);
  assert.match(clubHub, /Choisissez le duel à deux[\s\S]*l’entraînement solo guidé sur les quatre opérations/);
  assert.match(clubHub, />Choisir solo ou duo</);
  assert.match(clubHub, /@media \(min-width: 1100px\)[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
});

test("les cinq miniatures sont des SVG 720 × 320", async () => {
  const thumbnails = [
    "assets/img/thumbnails/jeux/carres-gloutons.svg",
    "assets/img/thumbnails/jeux/coffres-magiques.svg",
    "assets/img/thumbnails/calcul-mental/coffres-magiques-solo.svg",
    "assets/img/thumbnails/calcul-mental/defi-tables.svg",
    "assets/img/thumbnails/calcul-mental/defi-calcul.svg"
  ];
  for (const path of thumbnails) {
    const svg = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(svg, /<svg[^>]+width="720"[^>]+height="320"[^>]+viewBox="0 0 720 320"/, path);
    if (path.endsWith("coffres-magiques.svg")) {
      assert.match(svg, /quatre opérations/);
      assert.match(svg, /un quotient de 4/);
    }
  }
});
