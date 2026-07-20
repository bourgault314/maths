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
  assert.match(html, /state\.stepOperations\[nextIndex\] = nextIndex === 0 \? null : `÷ \$\{pending\.count\}`/);
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

test("le partage final écrit immédiatement la division et la solution", () => {
  assert.match(html, /function applySharedTokenSplit\(side, id, partCount, partValue\)/);
  assert.match(html, /opportunity\.tokenSide === side[\s\S]*opportunity\.token\.id === id[\s\S]*opportunity\.count === count/);
  assert.match(html, /function beginPendingShareConclusion\(opportunity, each\)/);
  assert.match(html, /const pending = \{[\s\S]*shareBatch:uid\(\),[\s\S]*count:opportunity\.count,[\s\S]*each:Number\(each\),[\s\S]*xSide:opportunity\.xSide,[\s\S]*tokenSide:opportunity\.tokenSide/s);
  assert.match(html, /state\.pendingShareConclusion = pending/);
  assert.match(html, /if\(isFinalShare\)\{[\s\S]*beginPendingShareConclusion\(opportunity, each\)[\s\S]*\}else\{[\s\S]*arr\.splice\(idx, 1, \.\.\.Array\.from/s);
  assert.match(html, /if\(state && state\.pendingShareConclusion\) return null;/);
  assert.match(html, /function pendingShareFinalEquation\(pending\)/);
  assert.match(html, /pending\.xSide === "left" \? `\$\{unknown\} = \$\{value\}` : `\$\{value\} = \$\{unknown\}`/);
  assert.match(html, /state\.stepOperations\[nextIndex\] = nextIndex === 0 \? null : `÷ \$\{pending\.count\}`/);
  assert.match(html, /state\.steps\.push\(finalEquation\)/);
  assert.doesNotMatch(html, /const pendingShareOperation = state && state\.pendingShareConclusion/);
  assert.match(html, /function drawPendingShareGroups\(viewHeight\)/);
  assert.match(html, /const cols = count <= 3 \? 1 : 2;/);
  assert.match(html, /const isCenteredLast = cols === 2 && count % 2 === 1 && index === count - 1/);
  assert.match(html, /isCenteredLast \? \(1600 - cardW\)\/2/);
  assert.match(html, /class", "pendingShareGroup"/);
  assert.match(html, /class", "pendingShareDivider"/);
  assert.match(html, /const leftLabel = pending\.xSide === "left" \? displayedUnknown\(\) : formatSignedNumber\(pending\.each\)/);
  assert.match(html, /const rightLabel = pending\.xSide === "right" \? displayedUnknown\(\) : formatSignedNumber\(pending\.each\)/);
  assert.match(html, /const splatX = pending\.xSide === "left" \? leftX : rightX/);
  assert.match(html, /const tokenX = pending\.tokenSide === "left" \? leftX : rightX/);
  assert.doesNotMatch(html, /pendingShareEquals/);
  assert.doesNotMatch(html, /\$\{displayedUnknown\(\)\} égale \$\{formatSignedNumber\(pending\.each\)\}/);
  assert.match(html, /<span class="shareInstruction"><strong>\$\{count\} groupes identiques<\/strong> — touche-en un\.<\/span>/);
  assert.match(html, /\.instructionZone \.shareInstruction\{[\s\S]*?color:#ea580c;/);
  assert.match(html, /setTimeout\(\(\) => finalizePendingShare\(pending\.shareBatch\), 420\)/);
  assert.match(html, /state\.stepOperations\[nextIndex\] = nextIndex === 0 \? null : `÷ \$\{pending\.count\}`/);
  const finalizeStart = html.indexOf("function finalizePendingShare");
  const finalizeEnd = html.indexOf("function parseSum", finalizeStart);
  const finalizeSource = html.slice(finalizeStart, finalizeEnd);
  assert.doesNotMatch(finalizeSource, /recordEquationStep/);
  assert.match(html, /state\[pending\.xSide\] = \[\.\.\.removedX, makeX\(1\)\]/);
  assert.match(html, /state\[pending\.tokenSide\] = \[\.\.\.removedTokens, makeToken\(pending\.each\)\]/);
  assert.match(html, /function drawSharedTray\(leftTray, rightTray\)/);
  assert.match(html, /divider\.setAttribute\("y1", y\)/);
  assert.match(html, /divider\.setAttribute\("y2", bottom\)/);
  assert.match(html, /drawSharedTray\(leftTray, rightTray\)/);
  assert.doesNotMatch(html, /drawText\(800, viewHeight \/ 2, "=", "eqMiddle"\)/);
  assert.match(html, /divider\.setAttribute\("y2", y \+ cardH\)/);
});

test("la conclusion inversée est reconnue et le doublon Annuler a disparu", () => {
  assert.ok(html.includes('(rhs === v && /^−?\\d+$/.test(lhs))'));
  assert.doesNotMatch(html, /id="btnStageUndo"/);
  assert.doesNotMatch(html, /btnStageUndo\.addEventListener/);
});

test("décomposer 30 en 10 + 10 + 10 déclenche la même division finale", () => {
  assert.match(html, /function decompositionMatchesFinalShare\(opportunity, side, id, values\)/);
  assert.match(html, /values\.length !== opportunity\.count/);
  assert.match(html, /values\.every\(value => Number\(value\) === Number\(opportunity\.result\)\)/);
  assert.match(html, /const isFinalShare = decompositionMatchesFinalShare\(opportunity, side, id, values\)/);
  assert.match(html, /if\(isFinalShare\)\{\s*beginPendingShareConclusion\(opportunity, Number\(opportunity\.result\)\);/);
});

test("les trois groupes arrivent avec une transition douce", () => {
  assert.match(html, /@keyframes pendingShareEnter/);
  assert.match(html, /animation:pendingShareEnter \.62s/);
  assert.match(html, /g\.style\.animationDelay = `\$\{index \* 110\}ms`/);
  assert.match(html, /@media \(prefers-reduced-motion:reduce\)/);
});

test("les taches restantes conservent leur case après une suppression", () => {
  assert.match(html, /function layoutItems\(tray, items, splatLayoutItems=items\)/);
  assert.match(html, /splatPositionsForItems\(tray, splatLayoutItems\)/);
  assert.match(html, /layoutItems\(leftTray, leftItems, state\.left\)/);
  assert.match(html, /layoutItems\(rightTray, rightItems, state\.right\)/);
});

test("l’import commence par expliquer l’égalité des deux quantités", () => {
  assert.match(html, /Il y a la même quantité à gauche qu’à droite\./);
  assert.match(html, /function showInitialEqualityInstruction\(\)/);
  assert.match(html, /setActionMode\(unitMode \? "delete" : "decompose"\);\s*showInitialEqualityInstruction\(\);/);
  assert.match(html, /setActionMode\(isImportedUnitMode\(\) \? "delete" : "decompose"\);\s*showInitialEqualityInstruction\(\);/);
  assert.match(html, /dismissInitialEqualityInstruction\(\);\s*setActionMode\("decompose"\)/);
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

test("le lien de gestion des cookies reste accessible dans ÉquaSplat import", () => {
  assert.doesNotMatch(html, /body\.importMode \.mg-consent-manage-slot,\s*body\.importMode \.mg-consent-manage\{\s*display:none !important;/);
  assert.match(html, /<div class="actionZone" id="actionZone"><\/div>\s*<button class="mobileConsentLink"[^>]*data-mathsgo-consent-open[^>]*>Gérer mes cookies<\/button>/);
  assert.match(html, /<footer class="equasplatConsentFooter">\s*<button class="equasplatConsentLink"[^>]*data-mathsgo-consent-open/);
  assert.match(html, /\.mobileConsentLink\{\s*display:none;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.mobileConsentLink\{\s*display:inline-flex;[^}]*min-height:32px;/s);
  assert.match(html, /body\.importMode \.equasplatConsentFooter\{\s*display:none;/);
  assert.match(html, /@media \(max-width:760px\) and \(max-height:680px\)[\s\S]*?\.board\{\s*height:220px;\s*min-height:220px;\s*max-height:220px;/);
  assert.match(html, /document\.documentElement\.classList\.add\("importModeRoot"\)/);
});
