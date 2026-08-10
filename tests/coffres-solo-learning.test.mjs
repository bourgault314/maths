import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const html = await readFile(new URL("../outils/calcul_mental/coffres_magiques_solo.html", import.meta.url), "utf8");
const script = [...html.matchAll(/<script(?![^>]+\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].at(-1)?.[1] || "";

function extractFunction(name) {
  const start = script.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Fonction ${name} introuvable`);
  const bodyStart = script.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = bodyStart; index < script.length; index += 1) {
    const character = script[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}" && --depth === 0) return script.slice(start, index + 1);
  }
  throw new Error(`Fin de la fonction ${name} introuvable`);
}

const context = vm.createContext({});
vm.runInContext(`
  const SIZE = 4;
  let values = [];
  ${extractFunction("row")}
  ${extractFunction("column")}
  ${extractFunction("calculate")}
  ${extractFunction("operationModel")}
  ${extractFunction("neighborPairs")}
  ${extractFunction("findSolutionPair")}
  globalThis.learningCore = { operationModel, findSolutionPair };
`, context);
const { operationModel, findSolutionPair } = context.learningCore;

test("le mémo distingue réellement les deux orientations du produit", () => {
  assert.match(html, /aria-label="Trois rangées de quatre points font douze points"[\s\S]*?--dot-columns:4/);
  assert.match(html, /aria-label="Quatre rangées de trois points font douze points"[\s\S]*?--dot-columns:3/);
  assert.deepEqual({ ...operationModel("product", 3, 4) }, { rows: 3, columns: 4, total: 12 });
  assert.deepEqual({ ...operationModel("product", 4, 3) }, { rows: 4, columns: 3, total: 12 });
});

test("le quotient 8 divisé par 2 porte les deux interprétations", () => {
  assert.match(html, /8 ÷ 2 : combien de groupes de 2 dans 8 \? 4/);
  assert.match(html, /8 ÷ 2 : partager 8 en 2 groupes : 4 dans chaque groupe/);
  assert.match(html, /Le quotient est le résultat d’une division\. Dans ce jeu, la division doit tomber juste et on divise le plus grand nombre par le plus petit\./);
  assert.deepEqual(
    { ...operationModel("quotient", 8, 2) },
    { total: 8, groupSize: 2, groupCount: 4, shareGroups: 2, each: 4 }
  );
});

test("les modèles visuels de somme et de différence restent mathématiquement exacts", () => {
  assert.deepEqual({ ...operationModel("sum", 3, 2) }, { first: 3, second: 2, total: 5 });
  assert.deepEqual({ ...operationModel("difference", 2, 5) }, { high: 5, low: 2, difference: 3 });
  assert.match(html, /La différence est le résultat d’une soustraction\. Dans ce jeu, on retire le plus petit nombre du plus grand/);
});

test("la recherche de correction renvoie une vraie paire voisine", () => {
  const productBoard = [3, 4, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11];
  const product = findSolutionPair("product", 12, productBoard);
  assert.deepEqual(Array.from(product.positions), [0, 1]);
  assert.deepEqual(Array.from(product.pair), [3, 4]);

  const quotientBoard = [8, 2, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7];
  const quotient = findSolutionPair("quotient", 4, quotientBoard);
  assert.deepEqual(Array.from(quotient.positions), [0, 1]);
  assert.deepEqual(Array.from(quotient.pair), [8, 2]);
});

test("l’aide sépare l’indice de la révélation et la correction impose un nouvel essai", () => {
  assert.match(html, /id="help-button"[^>]*>Aide<\/button>/);
  assert.match(html, /id="show-solution"[^>]*>Montrer une solution<\/button>/);
  assert.match(html, /id="help-dialog"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /id="correction-dialog"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /openCorrection\(\{ chosenPair: \[firstValue, secondValue\], trigger: secondButton \}\)/);
  assert.match(html, /const retryMode = mode;[\s\S]*makeChallenge\(retryMode\)/);
  assert.match(html, /Tu vas maintenant essayer la même opération sur un nouveau plateau, sans recevoir de clé/);
  assert.match(html, /onEscape: retryAfterLearning/);
});

test("la série garde exactement dix clés et la distribution validée", () => {
  assert.match(html, /const GOAL = 10;/);
  assert.match(html, /shuffle\(\["sum", "sum", "sum", "difference", "difference", "product", "product", "product", "quotient", "quotient"\]\)/);
  assert.doesNotMatch(html, /id="(?:timer|chronometer|countdown)"/i);
});
