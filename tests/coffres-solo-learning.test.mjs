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
  assert.match(html, /aria-label="Un réseau de 3 rangées et 4 colonnes contient 12 points[^\"]+4 colonnes[^\"]+3 rangées/);
  assert.match(html, /dimension-columns"><span>4<\/span>[\s\S]*?dimension-rows"><span>3<\/span>[\s\S]*?--dot-columns:4/);
  assert.match(html, /aria-label="Un réseau de 4 rangées et 3 colonnes contient 12 points[^\"]+3 colonnes[^\"]+4 rangées/);
  assert.match(html, /dimension-columns"><span>3<\/span>[\s\S]*?dimension-rows"><span>4<\/span>[\s\S]*?--dot-columns:3/);
  assert.match(html, /<span>3 rangées de 4<\/span>[\s\S]*?<span>4 rangées de 3<\/span>/);
  assert.doesNotMatch(html, /(?:dimension-columns|dimension-rows)[^>]*>[^<]*(?:longueur|largeur)/i);
  assert.deepEqual({ ...operationModel("product", 3, 4) }, { rows: 3, columns: 4, total: 12 });
  assert.deepEqual({ ...operationModel("product", 4, 3) }, { rows: 4, columns: 3, total: 12 });
});

test("le quotient 8 divisé par 2 porte les deux interprétations", () => {
  assert.match(html, /Combien de paquets de 2 dans 8 \? 4/);
  assert.match(html, /Partager 8 en 2 paquets : 4 dans chacun/);
  assert.match(html, /8 ÷ 2 : combien de paquets de 2 dans 8 \? 4/);
  assert.match(html, /8 ÷ 2 : partager 8 en 2 paquets : 4 dans chacun/);
  assert.match(html, /Le quotient est le résultat d’une division\. Il indique combien de paquets égaux on peut former, ou combien il y a dans chaque paquet\./);
  const quotientMemo = html.match(/<article data-operation="quotient">([\s\S]*?)<\/article>/)?.[1] || "";
  assert.match(quotientMemo, /Une barre rectangulaire de 8 unités est divisée en 4 paquets de 2 unités/);
  assert.match(quotientMemo, /Une barre rectangulaire de 8 unités est divisée en 2 paquets de 4 unités/);
  assert.equal((quotientMemo.match(/class="quotient-bar"/g) || []).length, 2);
  assert.equal((quotientMemo.match(/data-group-count="4" data-group-size="2" data-total-units="8"/g) || []).length, 1);
  assert.equal((quotientMemo.match(/data-group-count="2" data-group-size="4" data-total-units="8"/g) || []).length, 1);
  assert.equal((quotientMemo.match(/class="quotient-bar-unit"/g) || []).length, 16);
  assert.match(html, /\.quotient-bar\s*\{[\s\S]*?border-radius:\s*0/);
  assert.doesNotMatch(quotientMemo, /quotient-(?:pair|groups)/);
  assert.deepEqual(
    { ...operationModel("quotient", 8, 2) },
    { total: 8, groupSize: 2, groupCount: 4, shareGroups: 2, each: 4 }
  );
});

test("le mémo représente la somme avec des rectangles de points jointifs", () => {
  assert.deepEqual({ ...operationModel("sum", 3, 2) }, { first: 3, second: 2, total: 5 });
  const sumMemo = html.match(/<article data-operation="sum">([\s\S]*?)<\/article>/)?.[1] || "";
  assert.match(sumMemo, /Le rectangle du haut contient 5 points/);
  assert.match(sumMemo, /deux rectangles jointifs contiennent 3 points puis 2 points/);
  assert.match(sumMemo, /Les deux lignes ont exactement la même longueur/);
  assert.match(sumMemo, /3 plus 2 égale 5\./);
  assert.match(sumMemo, /sum-marker-row"><span class="sum-marker"><span>somme = 5<\/span>/);
  assert.match(sumMemo, /quantity-row quantity-total[\s\S]*?--quantity-value:5[\s\S]*?--dot-count:5/);
  assert.match(sumMemo, /quantity-first" style="--quantity-value:3"[\s\S]*?--dot-count:3[\s\S]*?quantity-second" style="--quantity-value:2"[\s\S]*?--dot-count:2/);
  assert.equal((sumMemo.match(/class="quantity-dot"/g) || []).length, 10);
  assert.doesNotMatch(sumMemo, />\s*(?:Tout|Parties?|partie)\s*</i);

  assert.match(html, /\.quantity-row \+ \.quantity-row\s*\{\s*border-top:\s*0/);
  assert.match(html, /\.quantity-row\s*\{[\s\S]*?border-radius:\s*0/);
  assert.match(html, /\.quantity-segment\s*\{[\s\S]*?flex:\s*var\(--quantity-value\) 1 0/);
  assert.match(html, /\.sum-marker\s*\{[\s\S]*?border-bottom:\s*2px solid/);
});

test("le mémo représente la différence par des points alignés et non appariés", () => {
  assert.deepEqual({ ...operationModel("difference", 2, 5) }, { high: 5, low: 2, difference: 3 });
  const differenceMemo = html.match(/<article data-operation="difference">([\s\S]*?)<\/article>/)?.[1] || "";
  assert.match(differenceMemo, /Le rectangle du haut contient 5 points alignés/);
  assert.match(differenceMemo, /rectangle du bas, collé dessous et aligné à gauche, contient 2 points/);
  assert.match(differenceMemo, /Les 3 points restants du haut sont mis en évidence/);
  assert.match(differenceMemo, /5 moins 2 égale 3\./);
  assert.equal((differenceMemo.match(/class="comparison-unit unmatched"/g) || []).length, 3);
  assert.equal((differenceMemo.match(/class="quantity-dot"/g) || []).length, 7);
  assert.match(differenceMemo, /comparison-upper[\s\S]*?comparison-lower" style="--difference-center:70%">[\s\S]*?compare-known[\s\S]*?difference-marker" style="grid-column:3 \/ -1"><\/span>[\s\S]*?difference-marker-label">différence = 3<\/span>/);
  assert.doesNotMatch(differenceMemo, /difference-marker-row/);
  assert.doesNotMatch(differenceMemo, /\?|>\s*(?:Tout|Parties?|partie)\s*</i);
  assert.match(html, /\.comparison-upper\s*\{[\s\S]*?border-radius:\s*0/);
  assert.match(html, /\.compare-known\s*\{[\s\S]*?border-top:\s*0[\s\S]*?border-radius:\s*0/);
  assert.match(html, /\.difference-marker\s*\{[\s\S]*?margin-top:\s*7px[\s\S]*?border-top:\s*2px solid/);
  assert.match(html, /\.difference-marker::before,[\s\S]*?top:\s*-7px/);
  assert.match(html, /\.difference-marker-label\s*\{[\s\S]*?left:\s*var\(--difference-center\)[\s\S]*?transform:\s*translateX\(-50%\)[\s\S]*?text-align:\s*center[\s\S]*?white-space:\s*nowrap/);
  assert.match(html, /model\.difference \/ model\.high < \.2[\s\S]*?markerLabel\.classList\.add\("compact"\)/);
});

test("l’aide et les deux corrections réutilisent les schémas de points", () => {
  assert.match(html, /function createSumQuantityModel\(model\)[\s\S]*?makeQuantitySegment\(model\.total\)[\s\S]*?makeQuantitySegment\(model\.first, "quantity-first"\)[\s\S]*?makeQuantitySegment\(model\.second, "quantity-second"\)/);
  assert.match(html, /function createDifferenceComparison\(model\)[\s\S]*?index >= model\.low \? " unmatched"[\s\S]*?--difference-center[\s\S]*?known\.style\.gridColumn = `1 \/ span \$\{model\.low\}`[\s\S]*?difference-marker-label", `différence = \$\{model\.difference\}`[\s\S]*?lower\.append\(marker, markerLabel\)[\s\S]*?diagram\.append\(upper, lower\)/);
  assert.match(html, /function createProductArray\(model\)[\s\S]*?String\(model\.columns\)[\s\S]*?String\(model\.rows\)[\s\S]*?--demo-columns/);
  assert.match(html, /function makeQuotientBar\(groupCount, groupSize\)[\s\S]*?bar\.dataset\.groupCount[\s\S]*?bar\.dataset\.groupSize[\s\S]*?quotient-bar-group[\s\S]*?quotient-bar-unit/);
  assert.match(html, /if \(nextMode === "sum"\)[\s\S]*?createSumQuantityModel\(model\)/);
  assert.match(html, /else if \(nextMode === "difference"\)[\s\S]*?createDifferenceComparison\(model\)/);
  assert.match(html, /else if \(nextMode === "product"\)[\s\S]*?createProductArray\(model\)/);
  assert.match(html, /Combien de paquets de \$\{model\.groupSize\} dans \$\{model\.total\} \? \$\{model\.groupCount\}/);
  assert.match(html, /Partager \$\{model\.total\} en \$\{model\.shareGroups\} paquets : \$\{model\.each\} dans chacun/);
  assert.match(html, /makeQuotientBar\(model\.groupCount, model\.groupSize\)/);
  assert.match(html, /makeQuotientBar\(model\.shareGroups, model\.each\)/);
  assert.match(html, /@media \(max-width: 520px\)[\s\S]*?\.demo-interpretations\s*\{\s*grid-template-columns:\s*1fr/);
  assert.doesNotMatch(html, /function makeGroups|demo-group|quotient-pair|quotient-groups/);
  assert.doesNotMatch(html, /function makeBar|bar-model-label|bar-missing/);

  assert.match(html, /function openHelp\(\)[\s\S]*?renderLearningPanel\(helpVisual, mode, example\[0\], example\[1\]\)/);
  assert.match(html, /function openCorrection\([\s\S]*?renderLearningPanel\(correctionVisual, mode, solutionFirst, solutionSecond\)/);
  assert.match(html, /function showSolution\(\)[\s\S]*?openCorrection\(\{ trigger \}\)/);
  assert.match(html, /openCorrection\(\{ chosenPair: \[firstValue, secondValue\], trigger: secondButton \}\)/);
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
  assert.match(html, /title: "La somme",\s*help: "Réunis les deux quantités : tu obtiens la somme\."/);
  assert.match(html, /title: "La différence",\s*help: "Compare les deux quantités : leur écart est la différence\."/);
  assert.match(html, /title: "Le produit",\s*help: "Un nombre indique les rangées ; l’autre, les points par rangée\."/);
  assert.match(html, /title: "Le quotient",\s*help: "Cherche le nombre de paquets égaux, ou la quantité dans chaque paquet\."/);
  assert.doesNotMatch(html, /id="correction-copy"|learningNotes\[mode\]\.correction/);
  assert.match(html, /Ton calcul : \$\{expression\(mode, chosenPair\[0\], chosenPair\[1\]\)\}\. Il fallait obtenir \$\{target\}\./);
  assert.match(html, /Voici une paire voisine du plateau\./);
  assert.match(html, /\$\{solutionFirst\} et \$\{solutionSecond\} conviennent : \$\{expression\(mode, solutionFirst, solutionSecond\)\}\./);
  assert.match(html, /onEscape: retryAfterLearning/);
});

test("le cours garde la définition mathématique de chaque résultat sans long paragraphe", () => {
  assert.match(html, /La somme est le résultat d’une addition\. Ici, 3 points et 2 points réunis donnent 5 points\./);
  assert.match(html, /La différence est le résultat d’une soustraction\. Elle mesure l’écart entre deux quantités\./);
  assert.match(html, /Le produit est le résultat d’une multiplication\. Ici, 3 rangées de 4 points, ou 4 rangées de 3 points, donnent 12 points\./);
  assert.match(html, /Le quotient est le résultat d’une division\. Il indique combien de paquets égaux on peut former, ou combien il y a dans chaque paquet\./);
});

test("la série garde exactement dix clés et la distribution validée", () => {
  assert.match(html, /const GOAL = 10;/);
  assert.match(html, /shuffle\(\["sum", "sum", "sum", "difference", "difference", "product", "product", "product", "quotient", "quotient"\]\)/);
  assert.doesNotMatch(html, /id="(?:timer|chronometer|countdown)"/i);
});

test("le défi accorde correctement le genre des quatre opérations", () => {
  assert.match(html, /operationArticles\s*=\s*\{\s*sum:\s*"une",\s*difference:\s*"une",\s*product:\s*"un",\s*quotient:\s*"un"\s*\}/);
  assert.match(html, /`\$\{operationArticles\[mode\]\} <b>\$\{operationLabels\[mode\]\}<\/b>/);
  assert.doesNotMatch(html, /`une <b>\$\{operationLabels\[mode\]\}/);
});
