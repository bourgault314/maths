import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/js/catalogue-refonte.js", import.meta.url), "utf8");
const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8"), context);
const catalogue = context.window.MATHSGO_CATALOGUE;
const published = catalogue.resources.filter((resource) => resource.status === "published");

// Exécuter les fonctions livrées, avec les vraies règles de navigation et les
// vraies données ; aucun second algorithme de comptage dans le test.
const functionNames = [
  "domainResourceCount", "resourceClassification", "resourceBelongsToNotion",
  "resourceCollections", "resourceBelongsToCollapsedCollection", "resourceShownInCollection", "displayItems",
  "uniqueResources", "resourceCount", "resourceCountLabel", "resourcesFromCards",
  "childNotions", "notionResources", "notionResourceCount", "collectionResources",
  "collectionResourceCount", "matchingNotionCollections"
];
const functions = functionNames.map((name) => {
  const match = source.match(new RegExp(`  function ${name}\\([^]*?\\n  \\}`));
  assert.ok(match, `Fonction livrée introuvable : ${name}`);
  return match[0];
});
const design = source.match(/  const notionDesign = \{[^]*?\n  \};/);
assert.ok(design);
Object.assign(context, {
  catalogue, published,
  resourceClassifications: catalogue.resourceClassifications,
  collectionMap: new Map(catalogue.collections.map((collection) => [collection.id, collection])),
  resourceFamilyByPath: new Map(catalogue.resourceFamilies.flatMap((family) => family.paths.map((path) => [path, family])))
});
vm.runInContext(`${design[0]}\n${functions.join("\n")}`, context);

test("Numération inclut les 44 ressources des bouliers, sans ajouter leur dossier", () => {
  assert.equal(context.collectionResourceCount("bouliers"), 44); // + Flash Anzan, rangé aussi dans Soroban (22/10/2026)
  assert.equal(context.notionResourceCount("numeration", "nombres-calculs"), 48);
});

test("les opérations et les variantes ne sont plus comptées comme de simples cartes", () => {
  assert.equal(context.notionResourceCount("calculs-poses", "nombres-calculs"), 12);
  assert.equal(context.notionResourceCount("relatifs", "nombres-calculs"), 10);
  assert.equal(context.collectionResourceCount("gerbert"), 9);
  assert.equal(context.collectionResourceCount("addition-posee"), 4);
  assert.equal(context.collectionResourceCount("division-posee"), 4);
});

test("le boulier commun à Rekenrek et Montessori ne gonfle pas le total du parent", () => {
  assert.equal(context.collectionResourceCount("rekenrek"), 29);
  assert.equal(context.collectionResourceCount("montessori"), 4);
  assert.equal(context.collectionResourceCount("soroban"), 3);
  assert.equal(context.collectionResourceCount("gerbert"), 9);
  assert.equal(context.collectionResourceCount("bouliers"), 44); // 45 liens, 44 destinations.
});

test("chaque domaine annonce seulement ses ressources atteignables", () => {
  const expected = {
    "nombres-calculs": 96,
    "proportionnalite-mesures": 18,
    algebre: 28, // − les livrets bleu/jaune et Mathigon (06/11/2026) ; + « Comment on joue ? » de la page Splat : le film, la vidéo, le diaporama (11/10/2026), puis le diaporama en ligne
    geometrie: 20,
    donnees: 2,
    informatique: 0,
    "jeux-recherches": 12,
    cps: 6 // + le Module Attention (11/11/2026)
  };
  for (const [domain, count] of Object.entries(expected)) {
    assert.equal(context.domainResourceCount(domain), count, domain);
  }
  assert.equal(context.notionResourceCount("calcul-mental", "nombres-calculs"), 8);
  assert.equal(context.resourceCount(published), 180, "Automatismes reste compté une fois dans le total du catalogue.");
});

test("Triangles compte ses descendants et les rubriques vides restent à zéro", () => {
  assert.equal(context.notionResourceCount("triangles", "geometrie"), 11);
  assert.equal(context.notionResourceCount("racines-carrees", "nombres-calculs"), 0);
  assert.equal(context.resourceCountLabel(1), "1 ressource");
  assert.equal(context.resourceCountLabel(12), "12 ressources");
});

test("une recherche compte tous les liens des variantes présentées et déduplique ses accès directs", () => {
  const family = catalogue.resourceFamilies.find(({ id }) => id === "cours-nombres-relatifs");
  const first = published.find((resource) => resource.path === family.paths[0]);
  const cards = context.displayItems([first]);
  assert.equal(cards.length, 1);
  assert.equal(context.resourceCount(context.resourcesFromCards(cards)), 4);

  const rekenrek = catalogue.collections.find(({ id }) => id === "rekenrek");
  const resources = context.collectionResources("rekenrek");
  assert.equal(context.resourceCount(context.resourcesFromCards(context.displayItems(resources), [rekenrek])), 29);
});

test("une collection imbriquée sans étiquette répétée sur ses ancêtres est comptée une seule fois", () => {
  const ids = ["test-parent", "test-enfant"];
  const resources = ["a", "b"].map((id) => ({
    id: `test-${id}`, path: `test/${id}.html`, status: "published",
    domains: [], notions: [], collections: ["test-enfant"]
  }));
  catalogue.collections.push({ id: ids[0] }, { id: ids[1], parent: ids[0] });
  published.push(...resources);
  try {
    assert.equal(context.collectionResourceCount(ids[0]), 2);
    assert.equal(context.resourceCount([...resources, ...resources]), 2);
  } finally {
    catalogue.collections.splice(-2);
    published.splice(-2);
  }
});
