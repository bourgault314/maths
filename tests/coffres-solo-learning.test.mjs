import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
// Le générateur vit dans le moteur partagé (assets/js/coffres-moteur.js, testé à part) ;
// la page ne garde que l'affichage, le cours, l'aide et la correction.
const engine = require("../assets/js/coffres-moteur.js");
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
  ${extractFunction("operationModel")}
  globalThis.learningCore = { operationModel };
`, context);
const { operationModel } = context.learningCore;
const { findSolutionPair } = engine;

test("le mémo distingue réellement les deux orientations du produit", () => {
  assert.match(html, /aria-label="Un réseau de 3 rangées et 4 colonnes contient 12 points[^\"]+4 colonnes[^\"]+3 rangées/);
  assert.match(html, /dimension-columns"><span>4<\/span>[\s\S]*?dimension-rows"><span>3<\/span>[\s\S]*?--dot-columns:4/);
  assert.match(html, /aria-label="Un réseau de 4 rangées et 3 colonnes contient 12 points[^\"]+3 colonnes[^\"]+4 rangées/);
  assert.match(html, /dimension-columns"><span>3<\/span>[\s\S]*?dimension-rows"><span>4<\/span>[\s\S]*?--dot-columns:3/);
  assert.match(html, /<span>3 rangées de 4<\/span>[\s\S]*?<span>4 rangées de 3<\/span>/);
  const productMemo = html.match(/<article data-operation="product">([\s\S]*?)<\/article>/)?.[1] || "";
  assert.doesNotMatch(productMemo, /(?:dimension-columns|dimension-rows)[^>]*>[^<]*(?:longueur|largeur)/i);
  assert.deepEqual({ ...operationModel("product", 3, 4) }, { rows: 3, columns: 4, total: 12 });
  assert.deepEqual({ ...operationModel("product", 4, 3) }, { rows: 4, columns: 3, total: 12 });
});

test("le quotient 8 divisé par 2 porte les deux interprétations", () => {
  assert.match(html, /Le quotient de 8 par 2 est 4\./);
  assert.match(html, /Grouper : 4 paquets de 2/);
  assert.match(html, /Partager : 2 paquets de 4/);
  assert.match(html, /Le quotient est le résultat d’une division\./);
  const quotientMemo = html.match(/<article data-operation="quotient">([\s\S]*?)<\/article>/)?.[1] || "";
  assert.match(quotientMemo, /Une barre rectangulaire de 8 unités est divisée en 4 paquets de 2 unités/);
  assert.match(quotientMemo, /Une barre rectangulaire de 8 unités est divisée en 2 paquets de 4 unités/);
  assert.equal((quotientMemo.match(/class="quotient-bar"/g) || []).length, 2);
  assert.equal((quotientMemo.match(/data-group-count="4" data-group-size="2" data-total-units="8"/g) || []).length, 1);
  assert.equal((quotientMemo.match(/data-group-count="2" data-group-size="4" data-total-units="8"/g) || []).length, 1);
  assert.equal((quotientMemo.match(/class="quotient-bar-unit"/g) || []).length, 16);
  assert.equal((quotientMemo.match(/8 ÷ 2 = 4/g) || []).length, 1);
  assert.doesNotMatch(quotientMemo, /8 ÷ 2 :|Il indique combien de paquets/);
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
  assert.match(differenceMemo, /comparison-upper[\s\S]*?comparison-lower" style="--difference-center:70%">[\s\S]*?compare-known[\s\S]*?difference-marker" style="grid-column:3 \/ -1"><\/span>[\s\S]*?difference-marker-label near">différence = 3<\/span>/);
  assert.doesNotMatch(differenceMemo, /difference-marker-row/);
  assert.doesNotMatch(differenceMemo, /\?|>\s*(?:Tout|Parties?|partie)\s*</i);
  assert.match(html, /\.comparison-upper\s*\{[\s\S]*?border-radius:\s*0/);
  assert.match(html, /\.compare-known\s*\{[\s\S]*?border-top:\s*0[\s\S]*?border-radius:\s*0/);
  assert.match(html, /\.difference-marker\s*\{[\s\S]*?margin-top:\s*7px[\s\S]*?border-top:\s*2px solid/);
  assert.match(html, /\.difference-marker::before,[\s\S]*?top:\s*-7px/);
  assert.match(html, /\.difference-marker-label\s*\{[\s\S]*?left:\s*var\(--difference-center\)[\s\S]*?transform:\s*translateX\(-50%\)[\s\S]*?text-align:\s*center[\s\S]*?white-space:\s*nowrap/);
  assert.match(html, /\.difference-marker-label\.near\s*\{\s*top:\s*17px/);
  assert.match(html, /model\.difference \/ model\.high >= \.36[\s\S]*?markerLabel\.classList\.add\("near"\)/);
  assert.match(html, /model\.difference \/ model\.high < \.2[\s\S]*?markerLabel\.classList\.add\("compact"\)/);
});

test("l’aide reprend exactement la carte du cours et les corrections restent personnalisées", () => {
  assert.match(html, /function createSumQuantityModel\(model\)[\s\S]*?makeQuantitySegment\(model\.total\)[\s\S]*?makeQuantitySegment\(model\.first, "quantity-first"\)[\s\S]*?makeQuantitySegment\(model\.second, "quantity-second"\)/);
  assert.match(html, /function createDifferenceComparison\(model\)[\s\S]*?index >= model\.low \? " unmatched"[\s\S]*?--difference-center[\s\S]*?known\.style\.gridColumn = `1 \/ span \$\{model\.low\}`[\s\S]*?difference-marker-label", `différence = \$\{model\.difference\}`[\s\S]*?lower\.append\(marker, markerLabel\)[\s\S]*?diagram\.append\(upper, lower\)/);
  assert.match(html, /function createProductArray\(model\)[\s\S]*?String\(model\.columns\)[\s\S]*?String\(model\.rows\)[\s\S]*?--demo-columns/);
  assert.match(html, /function makeQuotientBar\(groupCount, groupSize\)[\s\S]*?bar\.dataset\.groupCount[\s\S]*?bar\.dataset\.groupSize[\s\S]*?quotient-bar-group[\s\S]*?quotient-bar-unit/);
  assert.match(html, /if \(nextMode === "sum"\)[\s\S]*?createSumQuantityModel\(model\)/);
  assert.match(html, /else if \(nextMode === "difference"\)[\s\S]*?createDifferenceComparison\(model\)/);
  assert.match(html, /else if \(nextMode === "product"\)[\s\S]*?createProductArray\(model\)/);
  assert.match(html, /Grouper : \$\{model\.groupCount\} paquets de \$\{model\.groupSize\}/);
  assert.match(html, /Partager : \$\{model\.shareGroups\} paquets de \$\{model\.each\}/);
  assert.match(html, /makeQuotientBar\(model\.groupCount, model\.groupSize\)/);
  assert.match(html, /makeQuotientBar\(model\.shareGroups, model\.each\)/);
  assert.match(html, /@media \(max-width: 520px\)[\s\S]*?\.demo-interpretations\s*\{\s*grid-template-columns:\s*1fr/);
  assert.doesNotMatch(html, /function makeGroups|demo-group|quotient-pair|quotient-groups/);
  assert.doesNotMatch(html, /function makeBar|bar-model-label|bar-missing/);

  for (const mode of ["sum", "difference", "product", "quotient"]) {
    assert.equal((html.match(new RegExp(`<article data-operation="${mode}"`, "g")) || []).length, 1, `Carte ${mode}`);
  }
  assert.match(html, /function renderHelpCard\(nextMode\)[\s\S]*?lesson\.querySelector\(`article\[data-operation="\$\{nextMode\}"\]`\)[\s\S]*?sourceCard\.cloneNode\(true\)[\s\S]*?helpVisual\.replaceChildren\(\.\.\.content\)/);
  assert.match(html, /function openHelp\(\)[\s\S]*?renderHelpCard\(mode\)[\s\S]*?dialogs\.open\(helpDialog/);
  assert.doesNotMatch(html, /renderLearningPanel\(helpVisual|learningNotes\[mode\]\.help|learningNotes\[mode\]\.example/);
  assert.match(html, /function openCorrection\([\s\S]*?renderLearningPanel\(correctionVisual, mode, solutionFirst, solutionSecond\)/);
  assert.match(html, /function showSolution\(\)[\s\S]*?openCorrection\(\{ trigger \}\)/);
  assert.match(html, /openCorrection\(\{ chosenPair: \[firstValue, secondValue\], chosenPositions, trigger: secondButton \}\)/);
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
  assert.match(html, /id="help-title"[^>]*>Rappel du cours<\/h2>/);
  assert.match(html, /id="help-visual" class="operation-grid help-operation-grid" role="region" aria-label="Cours de l’opération en cours" tabindex="0"/);
  assert.doesNotMatch(html, /id="help-copy"/);
  assert.match(html, /id="correction-dialog"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /openCorrection\(\{ chosenPair: \[firstValue, secondValue\], chosenPositions, trigger: secondButton \}\)/);
  assert.match(html, /const retryMode = mode;\s*const retryTarget = target;[\s\S]*makeChallenge\(retryMode, \{ target: retryTarget \}\)/);
  assert.match(html, /const operationTitles = \{ sum: "La somme", difference: "La différence", product: "Le produit", quotient: "Le quotient" \}/);
  assert.doesNotMatch(html, /id="correction-copy"|learningNotes\[mode\]\.correction/);
  assert.match(html, /renderCorrectionCalculation\(correctionChoice, "Ton essai", chosenPair\[0\], chosenPair\[1\]\)/);
  assert.match(html, /correctionChoice.hidden = !chosenPair/);
  assert.match(html, /renderCorrectionCalculation\(correctionSolution, "Une solution", solutionFirst, solutionSecond\)/);
  assert.match(html, /onEscape: retryAfterLearning/);
});

test("la correction montre où étaient les cases : « Sur ton plateau »", () => {
  // Copie réduite du plateau (11/11/2026) : ton essai en rouge, la solution en vert, même épaisseur de contour.
  assert.match(html, /<div class="correction-calculs">\s*<div id="correction-choice"[^>]*><\/div>\s*<div id="correction-solution"[^>]*><\/div>\s*<\/div>\s*<!--[^>]*-->\s*<div id="correction-board" class="correction-board" role="img">\s*<span class="correction-label" aria-hidden="true">Sur ton plateau<\/span>\s*<div class="correction-board-grid" aria-hidden="true"><\/div>\s*<\/div>\s*<div id="correction-visual"/);
  assert.match(html, /const chosenPositions = \[Number\(firstButton\.dataset\.index\), secondPosition\];/);
  assert.match(html, /renderCorrectionBoard\(found\.positions, chosenPair \? chosenPositions : null\)/);
  const css = html.slice(html.indexOf("coffres-learning.css"));
  assert.match(css, /\.correction-board-grid span \{[^}]*border: 3px solid/);
  assert.doesNotMatch(css, /\.correction-board-grid span\.(?:essai|solution)[^{]*\{[^}]*(?:border-width|box-shadow|border:)/, "Le vert et le rouge gardent le même contour : seule la couleur change.");
  assert.match(css, /\.correction-board-grid span\.essai\.solution \{[^}]*linear-gradient/);
});

test("le cours garde la définition mathématique de chaque résultat sans long paragraphe", () => {
  assert.match(html, /La somme de 3 et de 2 est 5\.[\s\S]*3 \+ 2 = 5[\s\S]*La somme est le résultat d’une addition\./);
  assert.match(html, /La différence entre 5 et 2 est 3\.[\s\S]*5 − 2 = 3[\s\S]*La différence est le résultat d’une soustraction\./);
  assert.match(html, /Le produit de 3 par 4 est 12\.[\s\S]*3 × 4 = 12 ; 4 × 3 = 12 aussi[\s\S]*Le produit est le résultat d’une multiplication\./);
  assert.match(html, /Le quotient de 8 par 2 est 4\.[\s\S]*8 ÷ 2 = 4[\s\S]*Le quotient est le résultat d’une division\./);
  assert.doesNotMatch(html, /Ici, 3 points|Elle mesure l’écart|Il indique combien de paquets égaux/);
  assert.match(html, /aria-label="Ordre des nombres dans le jeu"[\s\S]*Tu peux choisir les deux cases dans n’importe quel ordre\.[\s\S]*Différence :<\/strong> le jeu calcule le plus grand nombre − le plus petit\.[\s\S]*Quotient :<\/strong> le jeu calcule le plus grand nombre ÷ le plus petit, seulement si la division tombe juste\./);
  assert.match(html, /\.operation-conventions\s*\{[^}]*grid-column:\s*1 \/ -1[^}]*grid-template-columns:\s*1fr 1fr/);
  assert.match(html, /@media \(max-width: 520px\)[\s\S]*?\.operation-conventions\s*\{\s*grid-template-columns:\s*1fr/);
});

test("le cours complet n’apparaît qu’au lancement et chaque dialogue repart en haut", () => {
  const actions = html.match(/<div class="lesson-actions">([\s\S]*?)<\/div>/)?.[1] || "";
  assert.equal((actions.match(/<button/g) || []).length, 1);
  assert.match(actions, /id="start-game"[^>]*>J’ai compris, jouer<\/button>/);
  assert.match(html, /id="lesson-course" class="operation-grid" role="region" aria-label="Cours complet sur les quatre opérations" tabindex="0"/);
  assert.doesNotMatch(html, /id="close-lesson"|id="show-lesson"|Voir le plateau|>Mémo<\/button>/);
  assert.match(html, /const resetScroll = dialog => \{[\s\S]*?node\.scrollTop = 0[\s\S]*?node\.scrollLeft = 0/);
  assert.match(html, /dialog\.hidden = false;\s*resetScroll\(dialog\)[\s\S]*?focusNode\(target, true\)/);
  assert.match(html, /function openLesson\(\) \{[\s\S]*?trigger: null,[\s\S]*?initialFocus: "#start-game"/);
  assert.match(html, /document\.querySelector\("#start-game"\)\.addEventListener[\s\S]*?start\(\{ moveFocus: true, focusTarget: trigger \}\)/);
});

test("la série garde exactement dix clés et la distribution validée", () => {
  assert.match(html, /const GOAL = 10;/);
  assert.match(html, /shuffle\(settingsCore.soloSeries\(selectedOperations\)\)/);
  assert.doesNotMatch(html, /id="(?:timer|chronometer|countdown)"/i);
});

// Lot 2 puis lot « moteur » : la page s'appuie sur le moteur partagé pour le tirage.
const MODES = engine.OPERATIONS;

test("la page charge le moteur partagé et ne garde aucun générateur local", () => {
  assert.match(html, /<script src="\.\.\/\.\.\/assets\/js\/coffres-settings\.js\?v=4"><\/script>\s*<script src="\.\.\/\.\.\/assets\/js\/coffres-moteur\.js\?v=1"><\/script>/);
  assert.match(html, /const engine = window\.MATHSGO_COFFRES_MOTEUR;/);
  assert.match(html, /const \{ row, column, adjacent, calculate, isSolution, boardSolutions, findSolutionPair, randomInteger, shuffle \} = engine;/);
  assert.doesNotMatch(html, /function (?:generateBoard|pairFor|levelRules|fillBounds|multiplicationPair|allowedProductPair|divisionDecoys|matchingPairs|randomInteger)\(/);
  assert.match(html, /engine\.generateBoard\(mode, gameLevel, randomInteger\(1, 3\) === 1, \{\s*family: replayTarget === null && Boolean\(familyPlan\[keys\]\),\s*target: replayTarget\s*\}\)/);
  assert.match(html, /familyPlan = engine\.planFamilies\(modes, level\)/);
  assert.match(html, /generateBoard: engine\.generateBoard,[\s\S]*searchMetrics: engine\.searchMetrics/);
});

test("les paires candidates du moteur donnent bien la cible demandée", () => {
  const plain = pairs => JSON.parse(JSON.stringify(pairs));
  assert.deepEqual(plain(engine.matchingPairs("sum", 11, 1)), [[9, 2], [8, 3], [7, 4], [6, 5]]);
  assert.deepEqual(plain(engine.matchingPairs("quotient", 4, 1)), [[16, 4], [20, 5], [24, 6], [28, 7], [32, 8], [36, 9]]);
  assert.deepEqual(plain(engine.matchingPairs("quotient", 4, 2)), []);
  assert.deepEqual(plain(engine.matchingPairs("product", 49, 1)), [[7, 7]]);
  assert.deepEqual(plain(engine.matchingPairs("difference", 49, 2)), [[51, 2], [52, 3], [53, 4], [54, 5], [55, 6], [56, 7], [57, 8], [58, 9]]);
  for (const level of [1, 2, 3]) for (const mode of MODES) {
    const board = engine.generateBoard(mode, level, true);
    assert.equal(engine.boardSolutions(mode, board.target, board.values).length, 2, `${mode} niveau ${level}`);
  }
});

test("le repère de la seconde paire n’apparaît qu’après la réussite ; niveau et vérification bonus sont câblés", () => {
  assert.doesNotMatch(html, /pair-count|pair-hint|updatePairHint|1 paire/);
  assert.match(html, /if \(solutionCount > 1\) status\.textContent \+= " Bien joué — il y en a une autre !";\s*wonMessage = status\.textContent;/);
  assert.match(html, /Solo · <span id="level-label">niveau 1<\/span><\/span>/);
  assert.match(html, /data-level="1"[^>]*>Niveau 1<small>Petits calculs<\/small>/);
  assert.match(html, /data-level="2"[^>]*>Niveau 2<small>Calculs intermédiaires<\/small>/);
  assert.match(html, /data-level="3"[^>]*>Niveau 3<small>Calculs plus avancés<\/small>/);
  assert.match(html, /function readLevel\(\) \{[\s\S]*?settingsCore\.normalizeLevel/);
  assert.match(html, /if \(nextLevel > 1\) params\.set\("niveau", String\(nextLevel\)\)/);
  assert.match(html, /if \(largeScreen\.matches\) \{[\s\S]*?bonusOpen = true;[\s\S]*?showNextButton\(\);[\s\S]*?\} else \{[\s\S]*?pendingTimer = window\.setTimeout\(advance, 750\);/);
  assert.match(html, /\? `\$\{expression\(mode, firstValue, secondValue\)\} aussi !`/);
  assert.match(html, /: `\$\{expression\(mode, firstValue, secondValue\)\} : non, pas celle-là\.`/);
  assert.match(html, /function select\(position\) \{\s*if \(!modeDialog.hidden \|\| !lesson.hidden\) return;\s*if \(bonusOpen\) \{\s*selectBonus\(position\);\s*return;\s*\}\s*if \(locked\) return;/);
  assert.match(html, /const content = \[gameLevel >= 2 \? createLevelCard\(nextMode, sourceCard, gameLevel\) : sourceCard\.cloneNode\(true\)\]/);
  assert.match(html, /2: \{ sum: \[28, 7\], difference: \[52, 7\], product: \[18, 4\], quotient: \[72, 4\] \}/);
  assert.match(html, /3: \{ sum: \[46, 27\], difference: \[72, 38\], product: \[24, 7\], quotient: \[168, 7\] \}/);
  assert.match(html, /visualLevel >= 2 \|\| \(nextMode === "quotient" && model\.total > 36\)/);
  // Le script de la page ne touche à aucun stockage : c'est le moteur du
  // suivi (assets/js/coffres-parcours.js) qui range la case de l'élève, et
  // l'amorce du <head> ne lit que le code de l'onglet (lot « Coffres magiques
  // sur le suivi », 21/10/2026).
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
  assert.doesNotMatch(html, /localStorage/);
  assert.equal((html.match(/sessionStorage/g) || []).length, 1, "l'amorce du <head>, et elle seule");
  assert.match(html, /window\.sessionStorage\.getItem\("mathsgo-suivi-code"\)/);
});

test("le défi accorde correctement le genre des quatre opérations", () => {
  assert.match(html, /operationArticles\s*=\s*\{\s*sum:\s*"une",\s*difference:\s*"une",\s*product:\s*"un",\s*quotient:\s*"un"\s*\}/);
  assert.match(html, /`\$\{operationArticles\[mode\]\} <b>\$\{operationLabels\[mode\]\}<\/b>/);
  assert.doesNotMatch(html, /`une <b>\$\{operationLabels\[mode\]\}/);
});
