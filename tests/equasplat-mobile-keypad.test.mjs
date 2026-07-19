import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

function functionSource(name){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `la fonction ${name} doit exister`);
  const next = html.indexOf("\n  function ", start + 1);
  return html.slice(start, next === -1 ? html.length : next);
}

test("la scène mobile donne tout l’espace libre à la vraie zone d’équation", () => {
  assert.match(html, /html\.equasplatActive,[\s\S]*body\.equasplatActive\{[^}]*height:100svh;[^}]*overflow:hidden;/s);
  assert.match(html, /main\.activeMode\{[^}]*height:calc\(100svh - 12px\);/s);
  assert.match(html, /--mobile-equation-min-height:clamp\(145px,21svh,180px\);[\s\S]*grid-template-rows:auto minmax\(var\(--mobile-equation-min-height\),1fr\) auto 56px auto !important;/);
  assert.match(html, /\.stage:not\(:fullscreen\)\{[^}]*overflow-y:hidden !important;[^}]*overscroll-behavior:none;/s);
  assert.match(html, /\.stage:not\(:fullscreen\) \.topbar\{[^}]*grid-area:history;[^}]*height:100% !important;[^}]*max-height:none !important;[^}]*justify-content:flex-start !important;/s);
  assert.match(html, /\.stage:not\(:fullscreen\) \.equationHistory\{[^}]*height:100% !important;[^}]*max-height:100% !important;[^}]*flex:1 1 auto;[^}]*overflow-y:auto !important;/s);
  assert.match(html, /\.stage:not\(:fullscreen\) \.board\{[^}]*height:clamp\(250px,76vw,310px\) !important;[^}]*max-height:310px !important;[^}]*margin:0 0 -5px !important;[^}]*align-self:end;/s);
  assert.doesNotMatch(html, /\.stage:not\(:fullscreen\) \.topbar\{[^}]*grid-row:2 \/ 4;/s);
  assert.match(html, /function setAppLayout\(mode\)[\s\S]*document\.documentElement\.classList\.toggle\("equasplatActive"[\s\S]*document\.body\.classList\.toggle\("equasplatActive"/);
});

test("les plateaux mobiles sont plus hauts et occupent le SVG disponible", () => {
  assert.match(html, /const TOKEN_R_PHONE = 72;/);
  assert.match(html, /const viewHeight = isPhoneLayout\(\) \? 1280 : 820;\s*svg\.setAttribute\("viewBox", `0 0 1600 \$\{viewHeight\}`\)/);
  assert.match(html, /function getTrayForSide\(side\)\{\s*if\(isPhoneLayout\(\)\)\{[\s\S]*\{x:24, y:34, w:736, h:1212\}[\s\S]*\{x:840, y:34, w:736, h:1212\}/);
  assert.match(html, /return side === "left"\s*\? \{x:40, y:74, w:720, h:650\}\s*: \{x:840, y:74, w:720, h:650\}/);
});

test("les taches naissent en haut et les jetons dans le tiers bas au téléphone", () => {
  assert.match(html, /function tokenPlacementAreaForTray\(tray\)[\s\S]*y:tray\.y\+tray\.h\*\.62[\s\S]*h:tray\.h\*\.32/);
  assert.match(html, /const splatArea = isPhoneLayout\(\)[\s\S]*y:tray\.y\+54[\s\S]*h:tray\.h\*\.55/);
  assert.match(html, /if\(!isPhoneLayout\(\)\) return \[3, n-3\];[\s\S]*return \[3,3,n-6\];/);
  assert.match(html, /function randomTokenPositionInTray\(tray, sideName, visible, placed\)\{\s*const area = tokenPlacementAreaForTray\(tray\);/);
  assert.match(html, /function clampTokenPosition\(tray, cx, cy, r=40, avoid=true, side=null\)\{\s*const area = tokenAreaForTray\(tray\);/);
  assert.match(html, /function avoidSplatsOnDrop[\s\S]*function tokenOverlapsSplats[\s\S]*function separateTokenPositions/);
});

test("les dialogues tactiles neutralisent le clavier natif et figent l’arrière-plan", () => {
  assert.match(html, /function usesTouchKeypad\(\)[\s\S]*navigator\.maxTouchPoints/);
  assert.match(html, /input\.readOnly = true;\s*input\.setAttribute\("inputmode", "none"\);/);
  assert.match(html, /document\.documentElement\.classList\.add\("dialogOpen"\);/);
  assert.match(html, /html\.dialogOpen,\s*body\.dialogOpen\{\s*overflow:hidden;/);
  assert.match(html, /dialog\.touchKeypadActive \.btnrow > \.primary,[\s\S]*dialog\.touchKeypadActive \.btnrow > \.green\{\s*display:none;/);
  assert.match(html, /dialog\.classList\.add\("touchKeypadActive"\)/);
  assert.match(html, /dialog\.classList\.remove\("touchKeypadActive"\)/);
});

test("le signe moins du pavé n’est créé que lorsque le mode relatif l’autorise", () => {
  assert.match(html, /options\.allowMinus \? \["−","−"\] : null/);
  assert.match(html, /allowMinus:isRelativeUniverse\(\)/);
  assert.match(html, /bindTouchKeypadInput\(addBothXCount[\s\S]*allowMinus:false/);
});

test("toutes les saisies d’action passent par le dialogue stable", () => {
  for(const name of ["decomposeDialog", "groupDialog", "addBothDialog", "fusionDialog"]){
    assert.match(html, new RegExp(`openAppDialog\\(${name},`));
  }
  assert.match(html, /expression:true,[\s\S]*submitLabel:"Décomposer"/);
});

test("chaque réécriture visible conserve l’équation précédente", () => {
  const split = functionSource("applyTokenSplit");
  const group = functionSource("applyGroup");
  const fusion = functionSource("applyFusion");
  const transientZero = functionSource("removeTransientZero");

  assert.match(split, /historyMode="record"/);
  assert.match(split, /if\(historyMode === "record"\) recordEquationStep\(operation\)/);
  assert.match(group, /recordEquationStep\(\);/);
  assert.doesNotMatch(group, /updateCurrentEquationStep\(\)/);
  assert.match(fusion, /recordEquationStep\(\);/);
  assert.doesNotMatch(fusion, /updateCurrentEquationStep\(\)/);
  assert.match(transientZero, /updateCurrentEquationStep\(\);/);
});

test("les deux membres utilisent toujours la même taille de tache", () => {
  const commonRadius = functionSource("commonSplatRadius");
  const positions = functionSource("splatPositionsForItems");

  assert.match(commonRadius, /Math\.max\(1, countForSide\("left"\), countForSide\("right"\)\)/);
  assert.match(positions, /const radius = commonSplatRadius\(\);/);
  assert.doesNotMatch(positions, /splatRadius\(xs\.length\)/);
});

test("la sélection des objets est nettement renforcée", () => {
  assert.match(html, /\.selectedOutline\{[^}]*stroke-width:14;[^}]*opacity:1;[^}]*drop-shadow/s);
  assert.match(html, /\.groupSelectedOutline\{[^}]*stroke-width:14;[^}]*opacity:1;[^}]*drop-shadow/s);
  assert.ok((html.match(/pos\.r\+12/g) || []).length >= 4);
});

test("les opérations encadrent les équations dans le bon ordre", () => {
  const operationRow = functionSource("renderOperationRow");
  const beginPending = functionSource("beginPendingShareConclusion");

  assert.doesNotMatch(operationRow, /viewMode !== "redaction"/);
  assert.match(operationRow, /opLeft[\s\S]*opLabel[\s\S]*\$\{arrow\}/);
  assert.match(operationRow, /opRight[\s\S]*\$\{arrow\}[\s\S]*opLabel/);
  assert.match(html, /\.operationWrap\{[^}]*gap:5px;[^}]*white-space:nowrap;/s);
  assert.doesNotMatch(html, /\.operationWrap\{[^}]*justify-content:space-between;/s);
  assert.match(beginPending, /makeBothSidesOperation\(`÷ \$\{pending\.count\}`\)/);
});

test("un partage final écrit immédiatement la division et la solution", () => {
  const sharedSplit = functionSource("applySharedTokenSplit");
  const tokenSplit = functionSource("applyTokenSplit");
  const beginPending = functionSource("beginPendingShareConclusion");
  const groups = functionSource("drawPendingShareGroups");
  const renderSvg = functionSource("renderSvg");
  const finalize = functionSource("finalizePendingShare");
  const actions = functionSource("renderActions");

  assert.match(sharedSplit, /opportunity\.tokenSide === side[\s\S]*opportunity\.token\.id === id[\s\S]*opportunity\.count === count/);
  assert.match(beginPending, /state\.pendingShareConclusion = pending/);
  assert.match(beginPending, /state\.stepOps\.push\(makeBothSidesOperation\(`÷ \$\{pending\.count\}`\)\)/);
  assert.match(beginPending, /state\.steps\.push\(finalEquation\)/);
  assert.match(tokenSplit, /decompositionMatchesFinalShare\(opportunity, side, id, values\)/);
  assert.match(groups, /const cols = count <= 3 \? 1 : 2;/);
  assert.match(groups, /isCenteredLast[\s\S]*\(1600 - cardW\)\/2/);
  assert.match(groups, /pending\.xSide === "left" \? leftX : rightX/);
  assert.match(groups, /class", "pendingShareDivider"/);
  assert.doesNotMatch(groups, /pendingShareEquals/);
  assert.match(groups, /g\.style\.animationDelay = `\$\{index \* 110\}ms`/);
  assert.match(groups, /g\.setAttribute\("role", "button"\)/);
  assert.match(groups, /classList\.add\(groupIndex === index \? "chosen" : "discarded"\)/);
  assert.match(groups, /setTimeout\(\(\) => finalizePendingShare\(pending\.id\), 420\)/);
  assert.match(renderSvg, /if\(drawPendingShareGroups\(viewHeight\)\) return;/);
  assert.match(renderSvg, /drawSharedTray\(leftTray, rightTray\)/);
  assert.doesNotMatch(renderSvg, /drawText\(800, viewHeight\/2, "=", "eqMiddle"\)/);
  assert.match(actions, /groupes identiques<\/strong> — touche-en un/);
  assert.match(finalize, /delete state\.pendingShareConclusion;/);
  assert.doesNotMatch(finalize, /recordEquationStep/);
});

test("le grand plateau est unique et le cinquième mini-plateau reste centré", () => {
  const sharedTray = functionSource("drawSharedTray");
  const groups = functionSource("drawPendingShareGroups");

  assert.match(sharedTray, /drawTray\(\{x, y, w:right-x, h:bottom-y\}, ""\)/);
  assert.match(sharedTray, /divider\.setAttribute\("y1", y\)/);
  assert.match(sharedTray, /divider\.setAttribute\("y2", bottom\)/);
  assert.match(groups, /cols === 2 && count % 2 === 1/);
});

test("la scène utilise les grands écrans sans conserver le doublon Annuler", () => {
  assert.match(html, /main\.activeMode\{[\s\S]*width:min\(1600px, calc\(100vw - 24px\)\);/);
  assert.doesNotMatch(html, /id="btnStageUndo"/);
  assert.match(html, /if\(btnStageUndo\) btnStageUndo\.addEventListener\("click", undo\)/);
});
