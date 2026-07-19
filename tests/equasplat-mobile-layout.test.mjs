import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/equasplat_import_splat.html", import.meta.url), "utf8");

test("ÉquaSplat mobile place l’équation, le plateau puis les commandes dans le flux", () => {
  assert.match(html, /\.stage:not\(:fullscreen\) \.stageQuickActions\{\s*display:none;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.topbar\{\s*order:1;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.board\{\s*order:2;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.instructionZone\{\s*order:3;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.mobileBottomControls\{\s*order:4;\s*position:static;/);
});

test("ÉquaSplat mobile compacte les actions objet sur une ligne et sépare les familles", () => {
  assert.match(html, /\.toolRowObjects\{\s*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(html, /body\.importUnitMode \.stage:not\(:fullscreen\) \.toolRowObjects\{\s*grid-template-columns:1fr;/);
  assert.match(html, /\.toolRowEquation\{[^}]*rgba\(240,253,244,/s);
  assert.match(html, /\.toolRowObjects\{[^}]*rgba\(239,246,255,/s);
  assert.match(html, /class="mobileLabel">Partager</);
  assert.match(html, /class="mobileLabel">Enlever des deux côtés</);
  assert.match(html, /class="mobileLabel">Ajouter des deux côtés</);
  assert.doesNotMatch(html, /id="mobileRemovedDisplayMode"/);
  assert.match(html, /id="toolRestart"[^>]*>Recommencer<\/button>/);
});

test("Annuler et Recommencer restent disponibles avec une flèche lisible", () => {
  assert.match(html, /#btnStageUndo,\s*body\.importMode \.stage:not\(:fullscreen\) #btnFullscreen\{\s*display:none;/);
  assert.match(html, /id="toolUndo"[^>]*>[^<]*<span class="desktopUndoLabel">↶ Annuler<\/span><span class="mobileUndoLabel"><svg class="undoIcon"/);
  assert.match(html, /<path d="M9 14 4 9l5-5"><\/path>/);
  assert.match(html, /toolUndo\.addEventListener\("click", undo\)/);
  assert.match(html, /toolRestart\) toolRestart\.addEventListener\("click", restartImportedEquation\)/);
});

test("l’historique bleu réserve dès le départ une grande zone et suit sa dernière ligne", () => {
  assert.match(html, /equationHistory\.scrollTop = equationHistory\.scrollHeight/);
  assert.match(html, /\.equationHistory\{[^}]*overflow-y:auto;/s);
  assert.match(html, /\.topbar\{\s*order:1;[^}]*height:auto;[^}]*min-height:120px;[^}]*max-height:none;[^}]*flex:1 1 120px;[^}]*border:2px solid #93c5fd;[^}]*background:#eff6ff;/s);
  assert.match(html, /\.equationHistory\{[^}]*overflow-y:auto;[^}]*overscroll-behavior:contain;[^}]*-webkit-overflow-scrolling:touch;/s);
});

test("les opérations faites aux deux membres apparaissent entre les équations", () => {
  assert.match(html, /function recordEquationStep\(operationLabel=null\)/);
  assert.match(html, /function operationBetweenRows\(label\)/);
  assert.match(html, /class="equationOperationArrow"[^>]*>↓<\/span>/);
  assert.match(html, /\.equationOperationSideLeft\{\s*justify-content:flex-start;\s*padding-left:3px;/);
  assert.match(html, /\.equationOperationSideRight\{\s*justify-content:flex-end;\s*padding-right:3px;/);
  assert.match(html, /equationOperationSideLeft"><span>\$\{safeLabel\}<\/span><span class="equationOperationArrow"/);
  assert.match(html, /equationOperationSideRight"><span class="equationOperationArrow"[^>]*>↓<\/span><span>\$\{safeLabel\}<\/span>/);
  assert.match(html, /Même opération dans les deux membres/);
  assert.match(html, /recordEquationStep\(operation\)/);
  assert.match(html, /recordEquationStep\("× \(−1\)"\)/);
  assert.match(html, /recordEquationStep\(`÷ \$\{pending\.count\}`\)/);
  assert.match(html, /finishAddBothAction\(operationDeltaLabel\(value\)\)/);
  assert.match(html, /finishAddBothAction\(operationDeltaLabel\(sign \* count, currentVar\(\)\)\)/);
});

test("retirer une tache de chaque membre affiche bien moins x", () => {
  assert.match(html, /return \{ok:true, type:"x", label:formatXTerm\(leftCoef\), left, right, leftCoef, rightCoef\};/);
  assert.match(html, /operationDeltaLabel\(-info\.leftCoef, currentVar\(\)\)/);
  assert.match(html, /suffix && magnitude === 1 \? suffix/);
});

test("la sélection orange est assez épaisse pour rester visible au doigt", () => {
  assert.match(html, /\.selectedOutline\{\s*fill:none;\s*stroke:#f97316;\s*stroke-width:12;\s*opacity:1;/);
});

test("les réponses disposent d’un pavé mathématique uniquement sur téléphone", () => {
  assert.equal((html.match(/class="mobileMathKeypad"/g) || []).length, 4);
  assert.match(html, /data-keypad-for="decomposeInput" data-keypad-mode="expression"/);
  assert.match(html, /data-keypad-for="groupInput" data-keypad-mode="integer"/);
  assert.match(html, /data-keypad-for="addBothInput" data-keypad-mode="integer"/);
  assert.match(html, /data-keypad-for="fusionInput" data-keypad-mode="integer"/);
  assert.match(html, /\.mobileMathKeypad\{\s*display:none;/);
  assert.match(html, /body\.importMode \.mobileMathKeypad\{\s*display:grid;\s*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(html, /function mobileMathKeyValue\(input, mode, key\)/);
  assert.match(html, /\["plus", "\+", "operator"\]/);
  assert.match(html, /\["minus", "−", "operator"\]/);
  assert.match(html, /\["backspace", "⌫", "danger"\]/);
  assert.match(html, /input\.readOnly = active/);
  assert.match(html, /input\.setAttribute\("inputmode", "none"\)/);
  assert.match(html, /const allowMinus = isRelativeUniverse\(\)/);
  assert.match(html, /minusKey\.hidden = !allowMinus/);
  assert.doesNotMatch(html, /mobileSignBtn/);
});

test("la décomposition accepte naturellement une soustraction", () => {
  assert.match(html, /if\(!\/\^\[\+-\]\?\\d\+\(\?:\[\+-\]\\d\+\)\*\$\/\.test\(raw\)\) return null;/);
  assert.match(html, /raw\.match\(\/\[\+-\]\?\\d\+\/g\)/);
});

test("le partage final passe par des mini-égalités avant la division", () => {
  assert.match(html, /function applySharedTokenSplit\(side, id, partCount, partValue\)/);
  assert.match(html, /opportunity\.tokenSide === side[\s\S]*opportunity\.token\.id === id[\s\S]*opportunity\.count === count/);
  assert.match(html, /state\.pendingShareConclusion = \{[\s\S]*shareBatch,[\s\S]*count,[\s\S]*each,[\s\S]*xSide:opportunity\.xSide,[\s\S]*tokenSide:opportunity\.tokenSide/s);
  assert.match(html, /if\(state && state\.pendingShareConclusion\) return null;/);
  assert.match(html, /function drawPendingShareGroups\(viewHeight\)/);
  assert.match(html, /const cols = count <= 3 \? 1 : 2;/);
  assert.match(html, /class", "pendingShareGroup"/);
  assert.match(html, /<span class="shareInstruction"><strong>\$\{count\} groupes identiques<\/strong> — touche-en un\.<\/span>/);
  assert.match(html, /\.instructionZone \.shareInstruction\{[\s\S]*?color:#ea580c;/);
  assert.match(html, /setTimeout\(\(\) => finalizePendingShare\(pending\.shareBatch\), 260\)/);
  assert.match(html, /recordEquationStep\(`÷ \$\{pending\.count\}`\)/);
  assert.match(html, /state\[pending\.xSide\] = \[\.\.\.removedX, makeX\(1\)\]/);
  assert.match(html, /state\[pending\.tokenSide\] = \[\.\.\.removedTokens, makeToken\(pending\.each\)\]/);
});

test("un partage qui ne conclut pas reste écrit comme un produit", () => {
  assert.match(html, /if\(opts\.shareBatch\) token\.shareBatch = opts\.shareBatch/);
  assert.match(html, /const shareBatch = uid\(\)/);
  assert.match(html, /makeToken\(each, \{shareBatch\}\)/);
  assert.match(html, /`−\$\{batch\.length\} × \$\{Math\.abs\(value\)\}`/);
  assert.match(html, /`\$\{batch\.length\} × \$\{formatSignedNumber\(value\)\}`/);
  assert.match(html, /applySharedTokenSplit\(side, id, n, part\)/);
});

test("sur téléphone seule la zone bleue défile", () => {
  assert.match(html, /html\.importModeRoot\{[^}]*height:100svh;[^}]*overflow:hidden;[^}]*overscroll-behavior:none;/s);
  assert.match(html, /body\.importMode\{[^}]*position:fixed;[^}]*inset:0;[^}]*width:100%;/s);
  assert.match(html, /body\.importMode\{[^}]*height:100svh;[^}]*min-height:0;[^}]*max-height:100svh;[^}]*overflow:hidden;[^}]*overscroll-behavior:none;/s);
  assert.match(html, /body\.importMode main\{[^}]*height:calc\(100% - 8px\);[^}]*max-height:calc\(100% - 8px\);[^}]*overflow:hidden;/s);
  assert.match(html, /\.stage:not\(:fullscreen\)\{[^}]*height:100%;[^}]*max-height:100%;[^}]*overflow:hidden;/s);
  assert.match(html, /@media \(max-width:760px\) and \(max-height:720px\)[\s\S]*?\.topbar\{[^}]*height:auto;[^}]*min-height:100px;[^}]*flex:1 1 100px;/);
});

test("le plateau mobile utilise tout son cadre avec des plateaux rectangulaires", () => {
  assert.match(html, /\.board\{\s*order:2;[^}]*width:calc\(100% \+ 12px\);[^}]*height:clamp\(260px,76vw,300px\);[^}]*margin-left:-6px;[^}]*margin-right:-6px;/s);
  assert.match(html, /function mobileSvgViewHeight\(\)\{[^}]*Math\.round\(1600 \* height \/ width\)[^}]*980, 1420/s);
  assert.match(html, /svg\.setAttribute\("viewBox", `0 0 1600 \$\{viewHeight\}`\)/);
  assert.match(html, /\? \{x:8, y:36, w:760, h:viewHeight-72\}/);
  assert.match(html, /: \{x:832, y:36, w:760, h:viewHeight-72\}/);
  assert.match(html, /return isMobileImportLayout\(\) \? Math\.round\(radius \* 1\.36\) : radius/);
  assert.match(html, /x:tray\.x\+\(mobileLayout \? 45 : 70\)/);
  assert.match(html, /w:tray\.w-\(mobileLayout \? 90 : 140\)/);
  assert.match(html, /r:mobileLayout \? 108 : 84/);
  assert.ok((760 - 90) / 3 > 2 * 108, "trois splats agrandis doivent rester séparés sur une ligne");
  assert.match(html, /@media \(max-width:760px\) and \(max-height:720px\)/);
  assert.match(html, /\.board\{\s*height:250px;\s*min-height:250px;\s*max-height:250px;/);
  assert.match(html, /\.topbar\{\s*height:auto;\s*min-height:100px;\s*max-height:none;/);
});

test("l’élargissement conserve tous les garde-fous anti-chevauchement", () => {
  assert.match(html, /if\(tokenOverlapsSplats\(p, splats, r\)\) continue;/);
  assert.match(html, /if\(tokenOverlapsExisting\(p, placed\)\) continue;/);
  assert.match(html, /const minDist = tokenRadius\(a\) \+ tokenRadius\(b\) \+ 12;/);
  assert.match(html, /separateTokenPositions\(tray, visible, tokens, sideName\);/);
});

test("l’import reste toujours en mode Caché sans contrôle mobile ou rapide", () => {
  assert.match(html, /body\.importMode #stageRemovedDisplayMode\{\s*display:none;/);
  assert.match(html, /syncRemovedDisplayControls\("hide"\)/);
  assert.doesNotMatch(html, /requestedRemovedDisplay/);
  assert.doesNotMatch(html, /mobileRemovedDisplayModeEl/);
});

test("la validation mobile garde toujours la même hauteur", () => {
  assert.match(html, /\.mobileBottomControls \.actionZone\{\s*height:44px;\s*min-height:44px;\s*max-height:44px;/);
  assert.match(html, /function stabilizeMobileActionZone\(\)/);
  assert.match(html, /actionZone\.appendChild\(makePlaceholder\("Valider"\)\)/);
  assert.match(html, /if\(child\.tagName === "BUTTON" && \/\^Effacer\/\.test\(child\.textContent \|\| ""\)\)\{\s*child\.remove\(\);/);
  assert.doesNotMatch(html, /Désélectionner/);
  assert.doesNotMatch(html, /makePlaceholder\("Effacer"/);
  assert.doesNotMatch(html, /actionPlaceholderHidden/);
  assert.match(html, /renderActions\(\);\s*stabilizeMobileActionZone\(\);/);
});

test("le contrôle des cookies ne se superpose plus aux commandes mobiles", () => {
  assert.match(html, /\.mg-consent-manage-slot--fixed\{\s*display:none !important;/);
  assert.match(html, /document\.documentElement\.classList\.add\("importModeRoot"\)/);
  assert.match(html, /getComputedStyle\(mobileBottomControlsEl\)\.position === "fixed"/);
});
