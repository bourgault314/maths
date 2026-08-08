import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const catalogueSourceUrl = new URL("../assets/js/catalogue-refonte-data.js", import.meta.url);

function loadCatalogue() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(readFileSync(catalogueSourceUrl, "utf8"), context, {
    filename: catalogueSourceUrl.pathname
  });
  assert.ok(context.window.MATHSGO_CATALOGUE, "Le fichier doit exposer window.MATHSGO_CATALOGUE.");
  return context.window.MATHSGO_CATALOGUE;
}

const catalogue = loadCatalogue();
const resources = Array.from(catalogue.resources || []);
const published = resources.filter((resource) => resource.status === "published");
const classifications = catalogue.resourceClassifications || {};
const families = Array.from(catalogue.resourceFamilies || []);
const resourcesByPath = new Map(resources.map((resource) => [resource.path, resource]));
const publishedByPath = new Map(published.map((resource) => [resource.path, resource]));

const allowedGroups = new Set([
  "manipuler",
  "entrainer",
  "generer",
  "imprimer",
  "activites",
  "cours",
  "jeux"
]);

const expectedGroupCounts = {
  manipuler: 36,
  entrainer: 21,
  generer: 32,
  imprimer: 14,
  activites: 10,
  cours: 11,
  jeux: 5
};

const expectedVisibleCardCounts = {
  manipuler: 32,
  entrainer: 21,
  generer: 32,
  imprimer: 12,
  activites: 8,
  cours: 5,
  jeux: 5
};

function resolvedPrimaryGroup(resource) {
  return classifications[resource.path]?.primaryGroup || null;
}

function assertPathsInGroup(group, paths) {
  for (const path of paths) {
    const resource = publishedByPath.get(path);
    assert.ok(resource, `${path} doit rester une ressource publiée.`);
    assert.equal(resolvedPrimaryGroup(resource), group, `${path} doit être classée dans « ${group} ».`);
  }
}

test("le catalogue conserve 145 entrées dont 129 publiées", () => {
  assert.equal(catalogue.schemaVersion, 5);
  assert.equal(resources.length, 145);
  assert.equal(published.length, 129);
  assert.equal(new Set(resources.map((resource) => resource.path)).size, resources.length, "Chaque chemin doit être unique.");
});

test("chaque ressource a un groupe principal déterministe parmi les sept groupes autorisés", () => {
  const missing = resources
    .filter((resource) => !resolvedPrimaryGroup(resource))
    .map((resource) => resource.path);
  assert.deepEqual(missing, [], "Ajouter classifications[path].primaryGroup à chaque ressource.");

  const invalid = resources
    .map((resource) => [resource.path, resolvedPrimaryGroup(resource)])
    .filter(([, group]) => !allowedGroups.has(group));
  assert.deepEqual(invalid, [], "Aucun autre identifiant de groupe ne doit être utilisé.");

  assert.deepEqual(
    [...new Set(published.map(resolvedPrimaryGroup))].sort(),
    [...allowedGroups].sort(),
    "Les sept groupes doivent être représentés."
  );

  const inconsistentNotions = published
    .filter((resource) => {
      const primaryNotion = classifications[resource.path]?.primaryNotion;
      return primaryNotion && !(resource.notions || []).includes(primaryNotion);
    })
    .map((resource) => resource.path);
  assert.deepEqual(inconsistentNotions, [], "La notion principale doit aussi être déclarée sur la ressource.");
});

test("aucune carte publiée ne conserve la description générique", () => {
  const genericDescription = /^Une ressource maths&go pour travailler(?:\b|…|\.\.\.)/i;
  const rawGeneric = published
    .filter((resource) => genericDescription.test((resource.description || "").trim()))
    .map((resource) => resource.path);
  const offenders = published
    .filter((resource) => {
      const effectiveDescription = classifications[resource.path]?.cardDescription || resource.description || "";
      return genericDescription.test(effectiveDescription.trim());
    })
    .map((resource) => resource.path);
  assert.deepEqual(rawGeneric, [], "Nettoyer aussi la description source, pas seulement le texte de carte.");
  assert.deepEqual(offenders, []);
});

test("la répartition arbitrée des 129 ressources reste stable", () => {
  const actual = Object.fromEntries([...allowedGroups].map((group) => [group, 0]));
  for (const resource of published) actual[resolvedPrimaryGroup(resource)] += 1;
  assert.deepEqual(actual, expectedGroupCounts);
});

test("les murs et les outils Rekenrek respectent la frontière manipulation, entraînement et génération", () => {
  assertPathsInGroup("generer", [
    "outils/fractions/mur_fractions.html",
    "outils/plateaux_manipulation/mur_diviseurs.html",
    "outils/bouliers/rekenrek/double_niv1.html",
    "outils/bouliers/rekenrek/double_niv2.html",
    "outils/bouliers/rekenrek/presque double.html",
    "outils/bouliers/rekenrek/cache cache.html",
    "outils/bouliers/rekenrek/cache cache barre.html"
  ]);

  assertPathsInGroup("manipuler", [
    "outils/plateaux_manipulation/mur_diviseurs_pgcd.html"
  ]);

  assertPathsInGroup("entrainer", [
    "outils/bouliers/rekenrek/ajouter9_ajouter8.html",
    "outils/bouliers/rekenrek/enlever9_enlever8.html",
    "outils/bouliers/rekenrek/force_5.html",
    "outils/bouliers/rekenrek/force_5_soustraction.html",
    "outils/bouliers/rekenrek/grignoteur.html",
    "outils/bouliers/rekenrek/pont_dizaine.html",
    "outils/bouliers/rekenrek/jeu_des_doubles.html",
    "outils/bouliers/rekenrek/suivant_precedent.html",
    "outils/bouliers/rekenrek/presque_doubles.html",
    "outils/bouliers/rekenrek/cache-cache.html",
    "outils/bouliers/rekenrek/comparateur.html",
    "outils/bouliers/rekenrek/pousser_des_nombres.html",
    "outils/bouliers/rekenrek/lecture_de_nombres.html",
    "outils/bouliers/rekenrek/tables.html"
  ]);
});

test("les arbitrages pédagogiques clés restent explicites", () => {
  assertPathsInGroup("cours", [
    "outils/fiche_thales_direct_a_verifier.pdf",
    "outils/fiche_reciproque_thales.pdf",
    "outils/fiche_thales_criteres_a_verifier.pdf",
    "outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf",
    "outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf",
    "outils/tuiles_algebriques/livret_litteral_mathigon.pdf",
    "outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf",
    "outils/nombres_relatifs/nombres_relatifs_couleur_mathsgo.pdf",
    "outils/nombres_relatifs/nombres_relatifs_vert_rouge_ecriture_blanche.pdf",
    "outils/nombres_relatifs/nombres_relatifs_gris_blanc.pdf",
    "outils/nombres_relatifs/nombres_relatifs_vert_rouge_contour_noir.pdf"
  ]);

  assertPathsInGroup("activites", [
    "outils/club_maths/jeu_du_chaos.html",
    "outils/detective_des_grandeurs_additive__1.pdf",
    "outils/detective_des_grandeurs_additive__2.pdf",
    "outils/detective_des_grandeurs_multiplicative__1.pdf",
    "outils/fractions_multiples_problemes.pdf",
    "outils/plateaux_manipulation/moulin_pythagore.html",
    "outils/plateaux_manipulation/puzzle_brousseau.html",
    "cps/bilan-s1.html"
  ]);

  assertPathsInGroup("generer", ["outils/labo-des-regularites.html"]);
  assertPathsInGroup("entrainer", ["auto/index.html"]);
  assertPathsInGroup("imprimer", ["outils/angles/fiche_angles_triangles.pdf"]);
  assertPathsInGroup("jeux", [
    "outils/club_maths/tables_modulaires.html",
    "outils/chat-cest-toi-le-chat.pdf"
  ]);
});

test("aucun titre publié n’expose un marqueur technique ou de version", () => {
  const technicalMarker = /\b(?:finale?|layout|pro|stable|undo|version|v\d+|xl)\b|zoom étendu|barre haute|millim[eé]tr[eé]/i;
  const offenders = published
    .filter((resource) => technicalMarker.test(resource.title))
    .map((resource) => `${resource.path} — ${resource.title}`);
  assert.deepEqual(offenders, []);
});

test("les familles regroupent toutes leurs variantes sans perte ni chevauchement", () => {
  const seenPaths = new Map();

  for (const family of families) {
    assert.ok(family.id, "Chaque famille doit avoir un identifiant.");
    assert.ok(allowedGroups.has(family.group), `${family.id} doit utiliser un groupe autorisé.`);
    assert.ok((family.paths || []).length >= 2, `${family.id} doit réellement regrouper plusieurs variantes.`);

    const labelPaths = Object.keys(family.labels || {}).sort();
    assert.deepEqual(labelPaths, [...family.paths].sort(), `${family.id} doit libeller exactement toutes ses variantes.`);

    for (const path of family.paths) {
      assert.ok(resourcesByPath.has(path), `${family.id} référence une ressource inexistante : ${path}`);
      assert.ok(publishedByPath.has(path), `${family.id} ne doit pas absorber une ressource non publiée : ${path}`);
      assert.equal(seenPaths.has(path), false, `${path} apparaît dans plusieurs familles.`);
      assert.equal(resolvedPrimaryGroup(publishedByPath.get(path)), family.group, `${family.id} mélange des groupes différents.`);
      seenPaths.set(path, family.id);
    }
  }

  const standaloneCount = published.filter((resource) => !seenPaths.has(resource.path)).length;
  const representedResourceCount = standaloneCount + [...seenPaths.keys()].length;
  const visibleCardCount = standaloneCount + families.length;
  const visibleCardsByGroup = Object.fromEntries([...allowedGroups].map((group) => [group, 0]));

  for (const resource of published) {
    if (!seenPaths.has(resource.path)) visibleCardsByGroup[resolvedPrimaryGroup(resource)] += 1;
  }
  for (const family of families) visibleCardsByGroup[family.group] += 1;

  assert.equal(representedResourceCount, published.length, "Aucune variante publiée ne doit disparaître du catalogue.");
  assert.equal(visibleCardCount, 115, "Les 129 ressources doivent être représentées par 115 cartes après regroupement.");
  assert.deepEqual(visibleCardsByGroup, expectedVisibleCardCounts);
});
