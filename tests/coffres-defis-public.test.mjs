import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const pageDefinitions = [
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

const catalogueContext = vm.createContext({ window: {} });
vm.runInContext(catalogueSource, catalogueContext);
const catalogue = catalogueContext.window.MATHSGO_CATALOGUE;

function inlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]+\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
}

test("les quatre adaptations sont publiques, autonomes et reliées à leur vrai parent", () => {
  for (const definition of pageDefinitions) {
    const html = pages[definition.path];
    assert.match(html, new RegExp(`<link rel="canonical" href="${definition.canonical.replaceAll("/", "\\/")}">`), definition.path);
    assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/, definition.path);
    assert.match(html, new RegExp(`href="${definition.parent.replace(/[?]/g, "\\?")}"`), definition.path);
    assert.doesNotMatch(html, /Axelle|Bureau|sessionStorage|game-pass/i, definition.path);
    for (const source of inlineScripts(html)) assert.doesNotThrow(() => new vm.Script(source), definition.path);
  }
});

test("les règles et durées approuvées restent explicites", () => {
  assert.match(pages["outils/club_maths/coffres_magiques.html"], /const KEYS_TO_WIN = 5;/);
  assert.match(pages["outils/club_maths/coffres_magiques.html"], /mode = challengeNumber % 2 \? "sum" : "product";/);

  const solo = pages["outils/calcul_mental/coffres_magiques_solo.html"];
  assert.match(solo, /const GOAL = 10;/);
  assert.match(solo, /\["sum", "sum", "sum", "difference", "difference", "product", "product", "product", "quotient", "quotient"\]/);

  assert.match(pages["outils/calcul_mental/defi_tables.html"], /const TOTAL = 25;[\s\S]*const DURATION = 60;/);
  assert.match(pages["outils/calcul_mental/defi_calcul.html"], /const TOTAL = 30;[\s\S]*const DURATION = 180;/);
});

test("le catalogue publie les quatre cartes dans les groupes validés", () => {
  const expected = new Map([
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
});

test("Calcul mental est parcourable avec la famille Bouliers regroupée", () => {
  const design = catalogueUi.match(/"calcul-mental":\s*\{([\s\S]*?)\n\s*\},\n\s*proportionnalite:/)?.[1] || "";
  const bouliers = catalogue.collections.find(collection => collection.id === "bouliers");
  assert.doesNotMatch(design, /hiddenFromBrowse\s*:\s*true/);
  assert.ok(bouliers?.notions.includes("calcul-mental"));
});

test("le hub Club Math relie Coffres magiques et garde une grille équilibrée", () => {
  assert.match(clubHub, /href="coffres_magiques\.html" class="card coffres"/);
  assert.match(clubHub, /@media \(min-width: 1100px\)[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
});

test("les quatre miniatures sont des SVG 720 × 320", async () => {
  const thumbnails = [
    "assets/img/thumbnails/jeux/coffres-magiques.svg",
    "assets/img/thumbnails/calcul-mental/coffres-magiques-solo.svg",
    "assets/img/thumbnails/calcul-mental/defi-tables.svg",
    "assets/img/thumbnails/calcul-mental/defi-calcul.svg"
  ];
  for (const path of thumbnails) {
    const svg = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(svg, /<svg[^>]+width="720"[^>]+height="320"[^>]+viewBox="0 0 720 320"/, path);
  }
});
