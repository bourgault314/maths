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
  assert.match(html, /id="help-title"[^>]*>Rappel du cours<\/h2>/);
  assert.match(html, /id="help-visual" class="operation-grid help-operation-grid" role="region" aria-label="Cours de l’opération en cours" tabindex="0"/);
  assert.doesNotMatch(html, /id="help-copy"/);
  assert.match(html, /id="correction-dialog"[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(html, /openCorrection\(\{ chosenPair: \[firstValue, secondValue\], trigger: secondButton \}\)/);
  assert.match(html, /const retryMode = mode;[\s\S]*makeChallenge\(retryMode\)/);
  assert.match(html, /const operationTitles = \{ sum: "La somme", difference: "La différence", product: "Le produit", quotient: "Le quotient" \}/);
  assert.doesNotMatch(html, /id="correction-copy"|learningNotes\[mode\]\.correction/);
  assert.match(html, /Ton calcul : \$\{expression\(mode, chosenPair\[0\], chosenPair\[1\]\)\}\. Il fallait obtenir \$\{target\}\./);
  assert.match(html, /Voici une paire voisine du plateau\./);
  assert.match(html, /\$\{solutionFirst\} et \$\{solutionSecond\} conviennent : \$\{expression\(mode, solutionFirst, solutionSecond\)\}\./);
  assert.match(html, /onEscape: retryAfterLearning/);
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
  assert.match(html, /shuffle\(\["sum", "sum", "sum", "difference", "difference", "product", "product", "product", "quotient", "quotient"\]\)/);
  assert.doesNotMatch(html, /id="(?:timer|chronometer|countdown)"/i);
});

// Lot 2 : tirage à 1 ou 2 paires, niveau 2, réglage et aides en barres.
const generatorContext = vm.createContext({});
vm.runInContext(`
  const SIZE = 4;
  let values = [];
  let level = 1;
  ${extractFunction("row")}
  ${extractFunction("column")}
  ${extractFunction("adjacent")}
  ${extractFunction("calculate")}
  ${extractFunction("randomInteger")}
  ${extractFunction("neighborPairs")}
  ${extractFunction("isSolution")}
  ${extractFunction("boardSolutions")}
  ${extractFunction("levelRules")}
  ${extractFunction("pairFor")}
  ${extractFunction("matchingPairs")}
  ${extractFunction("sameValues")}
  ${extractFunction("generateBoard")}
  globalThis.nativeRandom = Math.random;
  globalThis.generator = { generateBoard, boardSolutions, matchingPairs, levelRules, pairFor, adjacent };
`, generatorContext);
const generator = generatorContext.generator;
const MODES = ["sum", "difference", "product", "quotient"];

function touching(first, second) {
  return first.some(a => second.some(b => a === b || generator.adjacent(a, b)));
}

test("le tirage produit exactement 1 ou 2 paires voisines gagnantes, jamais plus", () => {
  for (const level of [1, 2]) {
    for (const mode of MODES) {
      for (let attempt = 0; attempt < 300; attempt += 1) {
        const wantTwo = attempt % 2 === 0;
        const board = generator.generateBoard(mode, level, wantTwo);
        const found = generator.boardSolutions(mode, board.target, board.values);
        assert.equal(found.length, wantTwo ? 2 : 1, `${mode} niveau ${level} (${board.values.join(" ")}, cible ${board.target}) : ${found.length} paire(s) au lieu de ${wantTwo ? 2 : 1}`);
        assert.equal(board.solutions, found.length);
        if (found.length === 2) assert.ok(!touching(found[0], found[1]), `${mode} niveau ${level} : les deux paires se touchent`);
        const fillMax = level === 2 ? 20 : 12;
        board.values.forEach((value, position) => {
          if (mode === "quotient" && found.some(pair => pair.includes(position))) return;
          assert.ok(value >= 1 && value <= fillMax, `${mode} niveau ${level} : case ${value} hors de 1 à ${fillMax}`);
        });
      }
    }
  }
});

test("le niveau 1 garde les tirages historiques et le niveau 2 monte jusqu’à 20", () => {
  assert.match(html, /if \(nextMode === "sum" \|\| nextMode === "product"\) return \[randomInteger\(2, 9\), randomInteger\(2, 9\)\];[\s\S]*?const difference = randomInteger\(2, 8\);[\s\S]*?const low = randomInteger\(1, 12 - difference\);[\s\S]*?const divisor = randomInteger\(2, 6\);[\s\S]*?const quotient = randomInteger\(2, 6\);/);
  assert.deepEqual(Array.from(generator.levelRules(1).fill), [1, 12]);
  assert.deepEqual(Array.from(generator.levelRules(2).fill), [1, 20]);
  const bounds = { 1: { sum: [4, 18], difference: [2, 8], product: [4, 81], quotient: [2, 6] }, 2: { sum: [12, 40], difference: [3, 19], product: [33, 300], quotient: [2, 9] } };
  for (const level of [1, 2]) {
    for (const mode of MODES) {
      for (let attempt = 0; attempt < 500; attempt += 1) {
        const [first, second] = generator.pairFor(mode, level);
        const target = mode === "difference" ? Math.abs(first - second) : mode === "quotient" ? Math.max(first, second) / Math.min(first, second) : mode === "sum" ? first + second : first * second;
        const [minimum, maximum] = bounds[level][mode];
        assert.ok(target >= minimum && target <= maximum, `${mode} niveau ${level} : ${first} et ${second} donnent ${target}`);
        if (level === 2 && mode !== "quotient") assert.ok(first <= 20 && second <= 20, `${mode} niveau 2 : ${first} ou ${second} dépasse 20`);
        if (level === 2 && mode === "product") assert.ok(Math.max(first, second) >= 11, `produit niveau 2 : ${first} × ${second} sans facteur à deux chiffres`);
      }
    }
  }
  const plain = pairs => JSON.parse(JSON.stringify(pairs));
  assert.deepEqual(plain(generator.matchingPairs("sum", 11, 1)), [[2, 9], [3, 8], [4, 7], [5, 6]]);
  assert.deepEqual(plain(generator.matchingPairs("quotient", 4, 2)).slice(0, 2), [[24, 6], [28, 7]]);
  assert.deepEqual(plain(generator.matchingPairs("product", 49, 1)), [[7, 7]]);
  assert.deepEqual(plain(generator.matchingPairs("difference", 19, 2)), [[20, 1]]);
});

test("le tirage reste déterministe quand Math.random est figé (scénarios de test)", () => {
  try {
    for (const fixed of [0, .1, .13, .2, .5, .9, .999]) {
      vm.runInContext(`Math.random = () => ${fixed};`, generatorContext);
      for (const level of [1, 2]) {
        for (const mode of MODES) {
          const board = generator.generateBoard(mode, level, true);
          assert.ok(board.solutions === 1 || board.solutions === 2, `${mode} niveau ${level} avec Math.random = ${fixed} : ${board.solutions} paires`);
        }
      }
    }
  } finally {
    vm.runInContext("Math.random = globalThis.nativeRandom;", generatorContext);
  }
});

test("le repère de paires, le niveau et la vérification bonus sont câblés", () => {
  assert.match(html, /<span id="pair-count" class="pair-hint" hidden><\/span>/);
  assert.match(html, /Solo · <span id="level-label">niveau 1<\/span> · trouve 10 clés/);
  assert.match(html, /class="level-choice" type="button" data-level="1" aria-pressed="true">Niveau 1<small>nombres de 1 à 12<\/small>/);
  assert.match(html, /class="level-choice" type="button" data-level="2" aria-pressed="false">Niveau 2<small>nombres jusqu’à 20<\/small>/);
  assert.match(html, /function readLevel\(\) \{[\s\S]*?get\("niveau"\) === "2" \? 2 : 1/);
  assert.match(html, /\$\{level === 2 \? "&niveau=2" : ""\}/);
  assert.match(html, /generateBoard\(mode, gameLevel, randomInteger\(1, 3\) === 1\)/);
  assert.match(html, /pairHint\.textContent = solutionCount === 1 \? "1 paire" : `\$\{solutionCount\} paires`/);
  assert.match(html, /if \(largeScreen\.matches\) \{[\s\S]*?bonusOpen = true;[\s\S]*?showNextButton\(\);[\s\S]*?\} else \{[\s\S]*?pendingTimer = window\.setTimeout\(advance, 750\);/);
  assert.match(html, /\? `\$\{expression\(mode, firstValue, secondValue\)\} aussi !`/);
  assert.match(html, /: `\$\{expression\(mode, firstValue, secondValue\)\} : non, pas celle-là\.`/);
  assert.match(html, /function select\(position\) \{\s*if \(bonusOpen\) \{\s*selectBonus\(position\);\s*return;\s*\}\s*if \(locked\) return;/);
  assert.match(html, /const content = \[gameLevel === 2 \? createLevelTwoCard\(nextMode, sourceCard\) : sourceCard\.cloneNode\(true\)\]/);
  assert.match(html, /levelTwoExamples = \{ sum: \[13, 8\], difference: \[17, 9\], product: \[12, 15\], quotient: \[60, 15\] \}/);
  assert.match(html, /if \(visualLevel === 2\) \{[\s\S]*?createBarDiagram\(nextMode, model\)/);
  assert.doesNotMatch(html, /localStorage|sessionStorage/);
});

test("le défi accorde correctement le genre des quatre opérations", () => {
  assert.match(html, /operationArticles\s*=\s*\{\s*sum:\s*"une",\s*difference:\s*"une",\s*product:\s*"un",\s*quotient:\s*"un"\s*\}/);
  assert.match(html, /`\$\{operationArticles\[mode\]\} <b>\$\{operationLabels\[mode\]\}<\/b>/);
  assert.doesNotMatch(html, /`une <b>\$\{operationLabels\[mode\]\}/);
});
