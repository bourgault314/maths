import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const dataSource = readFileSync(new URL("assets/js/catalogue-refonte-data.js", root), "utf8");
const catalogueSource = readFileSync(new URL("assets/js/catalogue-refonte.js", root), "utf8");
const iconSource = readFileSync(new URL("assets/js/mathsgo-icon-library.js", root), "utf8");

const dataContext = vm.createContext({ window: {} });
vm.runInContext(dataSource, dataContext);
const catalogue = dataContext.window.MATHSGO_CATALOGUE;
const notions = new Map(catalogue.notions.map((notion) => [notion.id, notion]));
const classifications = catalogue.resourceClassifications || {};
const publishedGeometry = catalogue.resources.filter((resource) => (
  resource.status === "published" && resource.domains.includes("geometrie")
));

function belongsTo(resource, notionId) {
  const primary = classifications[resource.path]?.primaryNotion;
  return primary ? primary === notionId : resource.notions.includes(notionId);
}

function branchIds(rootId) {
  const ids = [rootId];
  catalogue.notions
    .filter((notion) => notion.parent === rootId)
    .forEach((notion) => ids.push(...branchIds(notion.id)));
  return ids;
}

function branchResources(rootId) {
  const ids = branchIds(rootId);
  return publishedGeometry.filter((resource) => ids.some((id) => belongsTo(resource, id)));
}

test("la géométrie présente six rubriques remplies sans Pythagore ni Thalès en doublon", () => {
  const rootIds = Array.from(catalogue.notions)
    .filter((notion) => notion.domain === "geometrie" && !notion.parent)
    .map((notion) => notion.id)
    .filter((id) => branchResources(id).length > 0);

  assert.deepEqual(rootIds, [
    "construction-geometrique",
    "angles",
    "triangles",
    "reperage",
    "mesures-geometriques",
    "espace-constructions"
  ]);
  assert.equal(notions.get("pythagore").parent, "triangles");
  assert.equal(notions.get("thales").parent, "triangles");
});

test("les dix-huit ressources géométriques ont exactement une place dans les six rubriques", () => {
  const expectedCounts = new Map([
    ["construction-geometrique", 1],
    ["angles", 3],
    ["triangles", 10],
    ["reperage", 2],
    ["mesures-geometriques", 1],
    ["espace-constructions", 1]
  ]);
  const placements = new Map(publishedGeometry.map((resource) => [resource.path, []]));

  for (const [rootId, expectedCount] of expectedCounts) {
    const resources = branchResources(rootId);
    assert.equal(resources.length, expectedCount, rootId);
    resources.forEach((resource) => placements.get(resource.path).push(rootId));
  }

  assert.equal(publishedGeometry.length, 18);
  for (const [path, roots] of placements) {
    assert.equal(roots.length, 1, `${path} doit avoir une seule rubrique géométrique, reçu : ${roots.join(", ")}`);
  }
});

test("Triangles ouvre ses trois sous-rubriques dans le vrai catalogue et dans le fil d’Ariane", () => {
  assert.deepEqual(
    Array.from(catalogue.notions).filter((notion) => notion.parent === "triangles").map((notion) => notion.id),
    ["triangles-proprietes", "pythagore", "thales"]
  );
  assert.match(catalogueSource, /function childNotions\(parentId\)/);
  assert.match(catalogueSource, /if \(notion\.parent\) return false;/);
  assert.match(catalogueSource, /data-breadcrumb-target="notion-parent"/);
  assert.match(catalogueSource, /title\.textContent = "Choisissez une notion";/);
});

test("l’icône Repérage renforce les axes et met le quadrillage secondaire en pointillés", () => {
  assert.match(iconSource, /coordinates: `<svg[^`]+stroke-dasharray="1\.6 2"/);
  assert.match(iconSource, /M6 34h58M23 44V5" fill="none" stroke="#334155" stroke-width="2\.15"/);
  assert.match(iconSource, /"construction-geometrique": `<svg/);
});
