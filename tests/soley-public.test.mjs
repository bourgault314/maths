import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const gamePath = new URL("outils/club_maths/soley.html", root);
const thumbnailPath = new URL("assets/img/thumbnails/jeux/soley.svg", root);
const cataloguePath = new URL("assets/js/catalogue-refonte-data.js", root);

const html = fs.readFileSync(gamePath, "utf8");
const thumbnail = fs.readFileSync(thumbnailPath, "utf8");

function loadCatalogue() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(cataloguePath, "utf8"), context);
  return context.window.MATHSGO_CATALOGUE;
}

function createGameContext() {
  const inlineScript = html.match(/<script>\s*("use strict";[\s\S]*?)<\/script>/)?.[1];
  assert.ok(inlineScript, "le script principal de Solèy doit rester incorporé à la page");
  const core = inlineScript.slice(0, inlineScript.indexOf("/* ===== Dessin ===== */"));
  assert.ok(core.length > 0, "la logique testable doit précéder le rendu");
  const context = vm.createContext({
    localStorage: {
      getItem() { return null; },
      setItem() {}
    }
  });
  vm.runInContext(core, context);
  return context;
}

test("Solèy est publié une seule fois, dans Jeux et Fractions", () => {
  const catalogue = loadCatalogue();
  const resource = catalogue.resources.find(({ path }) => path === "outils/club_maths/soley.html");
  const classification = catalogue.resourceClassifications["outils/club_maths/soley.html"];

  assert.ok(resource);
  assert.equal(
    catalogue.resources.filter(({ path }) => path === resource.path).length,
    1
  );
  assert.deepEqual([...resource.domains], ["jeux-recherches", "nombres-calculs"]);
  assert.deepEqual([...resource.notions], ["strategie", "fractions"]);
  assert.equal(resource.status, "published");
  assert.equal(resource.recent, true);
  assert.equal(classification.primaryGroup, "jeux");
  assert.equal("primaryNotion" in classification, false);
  assert.equal(classification.thumbnail, "assets/img/thumbnails/jeux/soley.svg?v=1");
});

test("les 51 solutions de référence gagnent et ramassent les 107 fruits", () => {
  const context = createGameContext();
  const worldCounts = vm.runInContext(
    "Object.fromEntries(WORLDS.map(({id})=>[id,LV.filter(level=>level.w===id).length]))",
    context
  );
  assert.deepEqual(
    { ...worldCounts },
    { lagon: 8, foret: 9, volcan: 7, pitons: 7, soleils: 8, marche: 6, mafate: 6 }
  );

  const summary = vm.runInContext(`(() => {
    let fruits = 0;
    const failures = [];
    LV.forEach((level, index) => {
      cur = index;
      state.placed = {};
      const occupied = new Set([
        ...level.suns.map(({x,y}) => x + "," + y),
        ...level.rocks.map(([x,y]) => x + "," + y),
        ...level.targets.map(({x,y}) => x + "," + y),
        ...level.fruits.map(([x,y]) => x + "," + y),
        ...(level.gates || []).map(({x,y}) => x + "," + y)
      ]);
      for (const [toolIndex, x, y] of level.sol) {
        if (!level.tools[toolIndex] || occupied.has(x + "," + y)) {
          failures.push(level.name + ": placement de solution invalide");
          continue;
        }
        state.placed[x + "," + y] = { def: level.tools[toolIndex], ti: toolIndex };
      }
      const result = simulate();
      if (!result.win) failures.push(level.name + ": solution non gagnante");
      if (result.fruits.size !== level.fruits.length) {
        failures.push(level.name + ": fruit manquant");
      }
      fruits += result.fruits.size;
    });
    return { levels: LV.length, fruits, failures };
  })()`, context);

  assert.equal(summary.levels, 51);
  assert.equal(summary.fruits, 107);
  assert.deepEqual([...summary.failures], []);
});

test("l’accueil masque réellement le plateau et reprend la charte du site", () => {
  assert.match(html, /#play\.screen\{display:none;\}/);
  assert.match(html, /#play\.screen\.active\{display:flex;\}/);
  assert.match(html, /class="brandmark" href="\/"/);
  assert.match(html, /assets\/img\/mathsgo-logo\.png/);
  assert.match(html, /assets\/js\/consentement\.js/);
  assert.match(html, /Gérer mes cookies/);
  assert.match(html, /aria-label="Recommencer le niveau"/);
  assert.match(html, /class="chip[^"]*"[^>]*aria-pressed=/);
});

test("la miniature Solèy respecte le format du catalogue", () => {
  assert.match(thumbnail, /<svg[^>]*width="720"[^>]*height="320"[^>]*viewBox="0 0 720 320"/);
  assert.match(thumbnail, /Solèy — jeu de fractions/);
  assert.match(thumbnail, />51 NIVEAUX</);
});
