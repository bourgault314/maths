import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* Lot B (28/09/2026) — les corrigés imprimés de Splat Équations suivent la règle de l'écran
   (lot A) : une ligne d'équation = une opération faite des deux côtés, avec sa flèche ; la
   première ligne est l'équation telle qu'on la lit sur la carte (paquets séparés), puis la
   ligne réduite, sans flèche entre les deux. Au corrigé 6/page, cette première ligne n'écarte
   pas les flèches (« 1re ligne élargie », choisi par Gwenaël le 28/09). Les PDF régénérés se
   comparent à main page par page (voir la notice du lot) ; ici, les fonctions de la page,
   exécutées, et la structure du code. */

const html = await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8");
const renderEq = await readFile(new URL("../_sources/livret-splat-equations/render.py", import.meta.url), "utf8");

function extraire(nom){
  const debut = html.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}
function constante(nom){
  const m = html.match(new RegExp(`^const ${nom} = [^\\n]*;`, "m"));
  assert.ok(m, `la constante ${nom} doit exister`);
  return m[0];
}

/* Monde 5 : les lignes du corrigé et leurs flèches, avec les vraies fonctions de la page. */
function monde5(eq){
  return Function("eq", `
    const xChar = "x";
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const getEquationStepView = () => "equation";
    const makeEqStepGroupedParts = () => ({});
    ${["sumArray", "eqVisibleSum", "coeffXLabel", "formatEqSideFromCoeffVis", "buildEquationSolveLines",
       "eqStepSeenSide", "buildEquationSolveLinesAsSeen", "getEquationStepStates", "eqStepStateLines",
       "getEquationStepLineEntries", "getEquationSolveLineOperations"].map(extraire).join("\n")}
    const lines = buildEquationSolveLinesAsSeen(eq, "a");
    return { lines, ops: getEquationSolveLineOperations(eq, lines, "a"), reduites: buildEquationSolveLines(eq, "a") };
  `)(eq);
}

test("monde 5 : l'équation telle qu'on la lit, puis la réduite, sans flèche entre les deux", () => {
  // la carte la plus chargée du défi (fiche 37, carte 2)
  const { lines, ops, reduites } = monde5({ x: 7, left: { tasks: 1, visible: [15, 11, 56] }, right: { tasks: 3, visible: [15, 42, 11] } });
  assert.deepEqual(lines, ["a + 15 + 11 + 56 = 3a + 15 + 42 + 11", "a + 82 = 3a + 68", "82 = 2a + 68", "14 = 2a", "7 = a"]);
  assert.deepEqual(ops, [null, "− a", "− 68", "÷ 2"]);
  assert.deepEqual(lines.slice(1), reduites);
});

test("monde 5 : un seul paquet par plateau — une seule ligne, rien ne change", () => {
  const { lines, ops, reduites } = monde5({ x: 5, left: { tasks: 3, visible: [12] }, right: { tasks: 0, visible: [27] } });
  assert.deepEqual(lines, reduites);
  assert.deepEqual(lines, ["3a + 12 = 27", "3a = 15", "a = 5"]);
  assert.deepEqual(ops, ["− 12", "÷ 3"]);
});

test("les couvertures du monde 5 : l'exemple 3n + 7 + 5 = 10 + 17 et celui du défi gagnent leur première ligne", () => {
  assert.deepEqual(monde5({ x: 5, left: { tasks: 3, visible: [7, 5] }, right: { tasks: 0, visible: [10, 17] } }).lines,
    ["3a + 7 + 5 = 10 + 17", "3a + 12 = 27", "3a = 15", "a = 5"]);
  assert.deepEqual(monde5({ x: 12, left: { tasks: 4, visible: [11, 27] }, right: { tasks: 0, visible: [71, 15] } }).lines,
    ["4a + 11 + 27 = 71 + 15", "4a + 38 = 86", "4a = 48", "a = 12"]);
});

/* Le corrigé 6/page, exécuté : mesure au canvas remplacée par l'estimation × 1,2 (le repli de
   la page), dessin relevé dans des objets. */
function sixPage(lines, ops){
  return Function("lines", "ops", `
    ${constante("EQ_SIX_CORR_EQ_FONT")}
    const EQ_SIX_CORR_EQ_LEFT = -140, EQ_SIX_CORR_EQ_RIGHT = 1740;
    ${constante("EQ_SIX_CORR_EQ_BOTTOM")}
    ${constante("EQ_OP_ARROW_COLOR")}
    const EQ_SIX_CORR_DRAWN_FONT = "x";
    const el = null, text = null;
    ${["printMathCharWeight", "estimatePrintMathTextWidth", "drawEquationLines", "drawOperationArrow",
       "drawOperationArrowsForLines", "drawEqSixCorrectionLines"].map(extraire).join("\n")}
    const eqSixTextWidth = (s, f, fs) => Math.round(estimatePrintMathTextWidth(s, fs) * 1.2);
    const pieces = [];
    const g = { appendChild: n => pieces.push(n) };
    const tEl = (name, attrs) => ({ name, attrs });
    const tText = (x, y, t, a) => ({ name: "text", x, y, t, attrs: a });
    const card = { _eqTrays: { left: { y: 132, h: 848 } } };
    drawEqSixCorrectionLines(g, card, lines, ops, tEl, tText);
    const textes = pieces.filter(p => p.name === "text");
    const font = Math.max(...textes.map(t => Number(t.attrs["font-size"])));
    const fleches = pieces.filter(p => p.name === "path").map(p => p.attrs.d);
    return { font, fleches, textes };
  `)(lines, ops);
}

test("corrigé 6/page : la première ligne, sans flèche, prend la place des flèches (« 1re ligne élargie »)", () => {
  const lignes = ["a + 15 + 11 + 56 = 3a + 15 + 42 + 11", "a + 82 = 3a + 68", "82 = 2a + 68", "14 = 2a", "7 = a"];
  const ops = [null, "− a", "− 68", "÷ 2"];
  const avec = sixPage(lignes, ops);
  // la même première ligne, comptée comme si une flèche la touchait (le réglage d'avant) : plus petit
  const avant = sixPage(lignes, ["+ 0", ...ops.slice(1)]);
  assert.ok(avec.font > avant.font, `${avec.font} doit dépasser ${avant.font}`);
  // les flèches se calent sur les lignes qu'elles relient : à la même taille, une première ligne
  // plus courte ne les déplace pas
  const courte = sixPage(["a + 82 = 3a + 68", ...lignes.slice(1)], ops);
  assert.equal(courte.font, avec.font);
  assert.deepEqual(courte.fleches, avec.fleches);
  // trois flèches de chaque côté (courbe + pointe), aucune entre la 1re et la 2e ligne
  assert.equal(avec.fleches.length, 3 * 2 * 2);
});

test("corrigé 6/page : sans aucune flèche, le calcul de la taille ne change pas (pas de ligne « nue »)", () => {
  const code = extraire("drawEqSixCorrectionLines");
  assert.match(code, /const avecFleches = ops\.some\(Boolean\);/);
  assert.match(code, /const nue = i => avecFleches && !ops\[i\] && !\(i > 0 && ops\[i - 1\]\);/);
  assert.match(code, /const placeNue = reelNue \? eqGap \+ reelNue : 0;/);
  // et la règle est celle des flèches de l'écran : skipBareLines
  assert.match(extraire("drawOperationArrowsForLines"), /if\(geom\.skipBareLines && !ops\[i\] && !\(i > 0 && ops\[i - 1\]\)\) return;/);
});

test("correction 4/page du monde 5 : la même première ligne, la taille choisie sur les lignes à flèches, interligne resserré à cinq lignes", () => {
  const col = extraire("drawEquationPrintCorrectionColumn");
  assert.match(col, /const lines = buildEquationSolveLinesAsSeen\(eq, varChar\);/);
  assert.match(col, /const aFleches = lines\.length - \(nonReduite \? 1 : 0\);/);
  assert.match(col, /const eqFontSize = \(aFleches >= 4\) \? G\.eqFontSize4 : G\.eqFontSize;/);
  assert.match(col, /const eqGap = \(lines\.length >= 5 && G\.eqGap5\) \? G\.eqGap5 : \(\(aFleches >= 4\) \? G\.eqGap4 : G\.eqGap\);/);
  assert.match(col, /fontSize: eqFontSize, eqGap: G\.eqEqGap, skipBareLines: true\}/);
  // cinq lignes à 58 sous quatre schémas : la dernière s'arrête à 2 154 (mesuré), la carte fait 2 200
  const premiere = 900 + 4 * 232 + 40;
  assert.ok(premiere + 4 * 68 + 15 <= 2160);
});

/* Relatifs : les vraies fonctions d'écriture et de lecture des lignes (comme au lot A). */
function relatifs(eq){
  const fabriques = [...html.matchAll(/^function (makeEquationSigned\w+)\(/gm)].map(m => `const ${m[1]} = () => [];`).join("\n");
  return Function("eq", `
    const xChar = "x";
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const getSignedWritingMode = () => "simplified";
    ${fabriques}
    ${["sumArray", "eqSignedCoeff", "formatSignedIntegerLabel", "formatSignedCoeffLabel", "formatSignedLinearExpression",
       "formatSignedAbsIntegerLabel", "joinSignedTerms", "formatVarCoeffAbs", "buildEquationSignedStructuredExpressionSide",
       "buildEquationSignedStructuredEquation", "equationSignedSideNeedsCombining", "getEquationSignedStepStates",
       "eqSignedLineCoeffs", "eqSignedLineOperation", "eqSignedSixCorrectionLinesOps"].map(extraire).join("\n")}
    return eqSignedSixCorrectionLinesOps(eq, "c");
  `)(eq);
}

test("relatifs, correction 4/page : les lignes et les flèches du corrigé 6/page, plus de ligne inversée", () => {
  const { lines, ops } = relatifs({ x: 8, left: { tasks: 0, visible: [47] }, right: { tasks: 2, visible: [31] } });
  assert.ok(!lines.includes("2c + 31 = 47"), lines.join(" | "));
  assert.equal(lines[0], "47 = 2c + 31");
  assert.equal(ops.length, lines.length - 1);
  assert.ok(ops.every(Boolean), ops.join(" | "));
  const rendu = extraire("renderCardEquationPrint");
  assert.match(rendu, /const corr = \(printMode === "worksheet"\) \? \{lines: \[\], ops: \[\]\} : eqSignedSixCorrectionLinesOps\(eq, varChar\);/);
  assert.match(rendu, /: corr\.lines;/);
  assert.match(rendu, /marginL: marge\(0\), marginR: marge\(1\), middleBaseline: true, skipBareLines: true\}/);
  assert.equal(html.includes("function buildEquationSignedPrintCorrectionLines("), false);
  // le dessin des lignes rend sa géométrie, pour y poser les flèches
  assert.match(extraire("drawPrintEquationLinesLikeProjection"), /return \{fontSize, eqGap, startY, gap\};/);
});

test("couverture du monde 5 : les flèches se calent sur les lignes qu'elles relient, pas sur la première", () => {
  assert.match(renderEq, /const aFleche = lignes\.filter\(e => \+e\.getAttribute\('y'\) >= hautFl - 0\.5 \* grand\);/);
  assert.match(renderEq, /const X0 = Math\.min\(\.\.\.aFleche\.map/);
  assert.match(renderEq, /const x0 = Math\.min\(\.\.\.aFleche\.map/);
  assert.match(renderEq, /if \(!gFl\.length \|\| !dFl\.length\) return \{erreur:/);
});

test("flèches rapprochées : chacune se cale sur le membre le plus long DE SON CÔTÉ (comme sur la couverture)", () => {
  const code = extraire("drawOperationArrowsForLines");
  assert.match(code, /halfL = Math\.max\(halfL, estimate\(lhs\) \+ eqGap\);/);
  assert.match(code, /halfR = Math\.max\(halfR, estimate\(rhs\) \+ eqGap\);/);
  assert.match(code, /const xL = centerX - halfL - marginL;/);
  assert.match(code, /const xR = centerX \+ halfR \+ marginR;/);
  // exécuté : « 80 = 2n + 26 » — la flèche de gauche se rapproche du 80, celle de droite ne bouge pas
  const lignes = ["80 = 2n + 26", "54 = 2n", "27 = n"], ops = ["− 26", "÷ 2"];
  const courte = sixPage(lignes, ops);
  const xs = d => d.map(p => Number(p.match(/^M ([-\d.]+)/)[1]));
  const gauche = Math.min(...xs(courte.fleches)), droite = Math.max(...xs(courte.fleches));
  // à gauche, le membre le plus long est « 80 » : la flèche est bien plus près du « = » qu'à droite
  assert.ok(800 - gauche < droite - 800, `${800 - gauche} doit être plus petit que ${droite - 800}`);
});
