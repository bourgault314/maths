import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `la fonction ${name} doit exister`);
  const end = html.indexOf(`function ${nextName}(`, start + 1);
  assert.notEqual(end, -1, `la fonction ${nextName} doit suivre ${name}`);
  return html.slice(start, end);
}

test("les quatre modes Splat partagent une vraie disposition en deux colonnes", () => {
  const renderer = functionSource("renderCard", "approxTextWidthForLabel");

  assert.match(renderer, /card\.family === "U" \|\| card\.family === "N" \|\|\s*card\.family === "UPM" \|\| card\.family === "NPM"/);
  assert.match(renderer, /const abBarCenterX = 1240/);
  assert.match(renderer, /const abEquationCenterX = 1300/);

  const trayRight = -80 + 0.70 * (120 + 1360);
  const tableLeft = 1240 - 380 / 2;
  const longQuestionEquationLeft = 1300 - 22 - ("16 + 2 × ?".length * 46 * 0.56);
  assert.equal(trayRight, 956);
  assert.equal(tableLeft - trayRight, 94);
  assert.ok(longQuestionEquationLeft - trayRight > 60, "l'equation longue de la capture doit rester nettement a droite du plateau");
});

test("le tableau, le bouton et les calculs suivent la colonne de droite", () => {
  const renderer = functionSource("renderCard", "approxTextWidthForLabel");

  assert.match(renderer, /drawBarModelPartsInGroup\(emptyGroup, isABTwoColumnLayout \? abBarCenterX : 800/g);
  assert.match(renderer, /isABTwoColumnLayout \? abSolveButtonX/);
  assert.match(renderer, /const centerX = isABTwoColumnLayout \? abEquationCenterX/g);
  assert.match(renderer, /centerX: isSplatTwoColumnLayout \? abEquationCenterX/);
});

test("en B la premiere equation ne remonte plus pendant la resolution", () => {
  const renderer = functionSource("renderCard", "approxTextWidthForLabel");

  assert.match(renderer, /const finalCalcLines = 1 \+ resolutionLineCount/);
  assert.match(renderer, /\(finalCalcLines - 1\) \* \(calcGap \/ 2\)/);
  assert.doesNotMatch(renderer, /const calcLines = revealState >= 3 \? \(1 \+ resolutionLineCount\) : 1/);
});

test("les equations relatives A± et B± gardent aussi leur premiere ligne fixe", () => {
  const numberedSigned = functionSource("drawNumberedSignedEquationAid", "buildUnitSignedEquationLines");
  const unitSigned = functionSource("drawUnitSignedEquationAid", "fitPrintTokenToTray");

  for(const source of [numberedSigned, unitSigned]){
    assert.match(source, /const shownLines = revealState === 1 \? \[allLines\[0\]\] : allLines/);
    assert.match(source, /const startY = centerY - \(\(allLines\.length - 1\) \* gap \/ 2\)/);
    assert.doesNotMatch(source, /startY = centerY - \(\(shownLines\.length - 1\)/);
  }
});

test("la nouvelle disposition reste limitee au rendu ecran", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.doesNotMatch(printRenderer, /abBarCenterX|abEquationCenterX|finalCalcLines/);
  assert.match(printRenderer, /const printTray = getPrintTrayConfig\(card\.family\)/);
});

test("C et C direct gardent leur mise en page normale mais rentrent dans le plein ecran", () => {
  const renderer = functionSource("renderCard", "approxTextWidthForLabel");

  assert.match(renderer, /isFullscreenProjection \? "translate\(210 -32\) scale\(0\.74\)" : "translate\(240 -46\) scale\(0\.70\)"/);
  assert.match(renderer, /isFullscreenProjection \? -38 : -42/);

  // En plein écran, le plateau descend avec TOTAL et reste séparé du premier schéma.
  const trayTop = -32 + 0.74 * 270;
  const trayBottom = trayTop + 0.74 * 550;
  assert.ok(trayTop > 160);
  assert.ok(trayBottom < 620);
});
