import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const catalogueSourceUrl = new URL("../assets/js/catalogue-refonte-data.js", import.meta.url);
const catalogueScriptUrl = new URL("../assets/js/catalogue-refonte.js", import.meta.url);
const thumbnailUrl = new URL("../assets/img/thumbnails/splat/progression-cycle-3.svg", import.meta.url);
const digipadUrl = "https://digipad.app/p/1754235/397f3f517445b";

function loadCatalogue() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(readFileSync(catalogueSourceUrl, "utf8"), context, {
    filename: catalogueSourceUrl.pathname
  });
  return context.window.MATHSGO_CATALOGUE;
}

const catalogue = loadCatalogue();
const classification = catalogue.resourceClassifications[digipadUrl];
const resource = catalogue.resources.find((item) => item.path === digipadUrl);

test("la progression cycle 3 n'a plus de carte au catalogue, son lien reste dans la carte des mondes", () => {
  // relecture du monde 1, lot 2 (25/09/2026), Gwenaël : « ça on enlève », la progression est dans
  // l'univers. La ressource est masquée (réversible), pas effacée ; le lien vers le Digipad de
  // Claire reste dans le pied de la vue professeur de la carte des mondes.
  assert.ok(resource, "le Digipad reste décrit dans le catalogue");
  assert.equal(resource.title, "SPLAT! cycle 3 — une progression possible");
  assert.equal(resource.status, "hidden");
  const univers = readFileSync(new URL("../outils/splat_univers.html", import.meta.url), "utf8");
  assert.ok(univers.includes(`<a href="${digipadUrl}" target="_blank" rel="noopener">`), "le lien reste dans la carte des mondes");
  const annuaire = readFileSync(new URL("../outils/toutes-les-ressources.html", import.meta.url), "utf8");
  assert.ok(!annuaire.includes(digipadUrl), "plus dans l'annuaire de toutes les ressources");
  assert.deepEqual(Array.from(classification.collections), ["splat"]);
  assert.equal(classification.primaryGroup, "cours");
  assert.equal(classification.primaryNotion, "calcul-litteral");
  assert.equal(classification.thumbnail, "assets/img/thumbnails/splat/progression-cycle-3.svg?v=1");
});

test("les trois outils Splat existants restent dans Créer et personnaliser", () => {
  for (const path of [
    "outils/splat_tache_barre.html",
    "outils/splat.html",
    "outils/splat_equations.html"
  ]) {
    assert.equal(catalogue.resourceClassifications[path].primaryGroup, "generer", path);
  }
});

test("les liens extérieurs sont ouverts sans quitter la collection", () => {
  const catalogueScript = readFileSync(catalogueScriptUrl, "utf8");
  assert.match(catalogueScript, /target="_blank" rel="noopener noreferrer"/);
});

test("la miniature reste volontairement simple et typographique", () => {
  const thumbnail = readFileSync(thumbnailUrl, "utf8");
  assert.match(thumbnail, /SPLAT!/);
  assert.match(thumbnail, /Une progression possible/);
  assert.match(thumbnail, /CYCLE 3/);
  assert.doesNotMatch(thumbnail, /OBSERVER|CACHER|REPRÉSENTER|ÉCRIRE/);
});
