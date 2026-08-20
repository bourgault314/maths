import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const catalogueSourceUrl = new URL("../assets/js/catalogue-refonte-data.js", import.meta.url);
const catalogueScriptUrl = new URL("../assets/js/catalogue-refonte.js", import.meta.url);

const catalogueScript = readFileSync(catalogueScriptUrl, "utf8");

// Le comparateur est extrait du fichier livré au navigateur puis exécuté tel quel :
// le test ne réimplémente pas la règle, il fait tourner celle qui part en ligne.
function loadCompareCards() {
  const bloc = catalogueScript.match(/function compareCards\(a, b\) \{[\s\S]*?\n {2}\}/);
  assert.ok(bloc, "compareCards doit rester une fonction isolée de catalogue-refonte.js.");
  const sandbox = {};
  vm.runInNewContext(`${bloc[0]}\nthis.compareCards = compareCards;`, sandbox);
  return sandbox.compareCards;
}

function loadCatalogue() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(readFileSync(catalogueSourceUrl, "utf8"), context, {
    filename: catalogueSourceUrl.pathname
  });
  return context.window.MATHSGO_CATALOGUE;
}

const compareCards = loadCompareCards();
const catalogue = loadCatalogue();
const classifications = catalogue.resourceClassifications || {};
const families = catalogue.resourceFamilies || [];
const familyByPath = new Map();
for (const family of families) {
  for (const path of family.paths || []) familyByPath.set(path, family);
}

// Reproduit le repli des variantes sur une carte unique, comme displayItems.
function cardsFor(collectionId, groupId) {
  const seen = new Set();
  const cards = [];
  for (const resource of catalogue.resources) {
    if (resource.status !== "published") continue;
    const classification = classifications[resource.path] || {};
    if (!(classification.collections || []).includes(collectionId)) continue;
    const family = familyByPath.get(resource.path);
    if (family) {
      if (seen.has(family.id)) continue;
      seen.add(family.id);
      if (family.group === groupId) cards.push({ title: family.title, rang: family.rang });
      continue;
    }
    if (classification.primaryGroup === groupId) {
      cards.push({ title: resource.title, rang: classification.rang });
    }
  }
  return cards.sort(compareCards).map((card) => card.title);
}

test("le tri est réellement branché sur le rendu des sections", () => {
  assert.match(
    catalogueScript,
    /const groupItems = sortCards\(grouped\.get\(group\.id\)\);/,
    "renderResources doit trier les cartes d’une section avant de les écrire."
  );
  assert.match(
    catalogueScript,
    /function sortCards\(items\) \{\s*return items\.slice\(\)\.sort\(\(a, b\) => compareCards\(cardSortKey\(a\), cardSortKey\(b\)\)\);\s*\}/,
    "sortCards doit trier une copie, sans réordonner la liste d’origine."
  );
  assert.match(
    catalogueScript,
    /if \(item\.family\) return \{ title: item\.family\.title, rang: item\.family\.rang \};/,
    "une carte de famille doit tirer son rang de la famille, pas d’une de ses variantes."
  );
});

test("sans rang, les cartes d’une section suivent l’alphabet", () => {
  const cartes = [
    { title: "Tables de multiplication" },
    { title: "Ajouter 8 ou 9" },
    { title: "Le Grignoteur" }
  ].sort(compareCards);
  assert.deepEqual(cartes.map((c) => c.title), [
    "Ajouter 8 ou 9",
    "Le Grignoteur",
    "Tables de multiplication"
  ]);
});

test("un rang explicite passe devant l’alphabet, et les cartes sans rang suivent", () => {
  const cartes = [
    { title: "Aaa sans rang" },
    { title: "Zzz rang 2", rang: 2 },
    { title: "Mmm rang 1", rang: 1 }
  ].sort(compareCards);
  assert.deepEqual(cartes.map((c) => c.title), [
    "Mmm rang 1",
    "Zzz rang 2",
    "Aaa sans rang"
  ]);
});

test("les niveaux numérotés se rangent dans l’ordre des nombres", () => {
  const cartes = [
    { title: "Générateur Rekenrek — doubles, niveau 10" },
    { title: "Générateur Rekenrek — doubles, niveau 2" },
    { title: "Générateur Rekenrek — doubles, niveau 1" }
  ].sort(compareCards);
  assert.deepEqual(cartes.map((c) => c.title), [
    "Générateur Rekenrek — doubles, niveau 1",
    "Générateur Rekenrek — doubles, niveau 2",
    "Générateur Rekenrek — doubles, niveau 10"
  ]);
});

test("l’abaque de Gerbert garde sa progression : additions, soustractions, multiplications", () => {
  assert.deepEqual(cardsFor("gerbert", "entrainer"), [
    "Abaque de Gerbert – Additions",
    "Abaque de Gerbert – Soustractions",
    "Abaque de Gerbert — Multiplications"
  ], "L’alphabet coincerait les multiplications entre les additions et les soustractions.");
});

test("la vidéo ouvre les références de Gerbert, les deux textes IREM suivent", () => {
  assert.deepEqual(cardsFor("gerbert", "cours"), [
    "L’abaque de Gerbert — origine, histoire, utilisation",
    "L’abaque de Gerbert, par Alain Busser",
    "De l’abaque à jetons au calcul posé, par Nathalie Daval et Dominique Tournès"
  ]);
});

test("Rekenrek retrouve l’ordre de son ancien index, à la carte près", () => {
  assert.deepEqual(cardsFor("rekenrek", "manipuler"), [
    "Boulier Rekenrek",
    "Rekenrek — fractions et centièmes",
    "Rekenrek interactif"
  ], "Le manipulable nu ouvrait la section, pas les fractions et centièmes.");

  assert.deepEqual(cardsFor("rekenrek", "entrainer"), [
    "Ajouter 8 ou 9",
    "Enlever 8 ou 9",
    "Force 5 — additions",
    "Force 5 — soustractions",
    "Le Challenge Calcul",
    "Le Grignoteur",
    "Le Pont de la Dizaine",
    "Rekenrek - Le Voisin (Suivant/Précédent)",
    "Rekenrek — comparer et ranger",
    "Rekenrek — construire un nombre",
    "Rekenrek — entraînement aux doubles",
    "Rekenrek — entraînement aux presque-doubles",
    "Rekenrek — lecture flash",
    "Rekenrek — perles cachées",
    "Tables de multiplication"
  ]);
});

// Deux cartes à égalité laisseraient leur ordre à l'ordre du fichier de données,
// c'est-à-dire au hasard de la date d'ajout — précisément ce qu'on vient de corriger.
test("aucune section du site ne laisse deux cartes à égalité", () => {
  const groups = ["manipuler", "entrainer", "generer", "imprimer", "activites", "cours", "jeux"];
  const ex_aequo = [];
  for (const collection of catalogue.collections) {
    for (const group of groups) {
      const cards = cardsFor(collection.id, group).map((title) => ({ title }));
      for (let i = 0; i < cards.length; i += 1) {
        for (let j = i + 1; j < cards.length; j += 1) {
          if (compareCards(cards[i], cards[j]) === 0) {
            ex_aequo.push(`${collection.id} / ${group} : « ${cards[i].title} »`);
          }
        }
      }
    }
  }
  assert.deepEqual(ex_aequo, []);
});
