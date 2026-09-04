import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Depuis la fusion d'ÉquaSplat et d'ÉquaSplat import (août 2026), la page
// outils/equasplat.html reçoit elle-même les équations de Splat Équations et des
// Automatismes. Ces épingles décrivent le MODE RÉCEPTION (body.importMode) tel
// qu'il a été porté depuis l'ancienne page equasplat_import_splat.html, qui
// n'est plus qu'une redirection.
const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");
const redirect = await readFile(new URL("../outils/equasplat_import_splat.html", import.meta.url), "utf8");

test("l’ancienne page import redirige vers ÉquaSplat en conservant l’adresse", () => {
  assert.match(redirect, /<meta name="robots" content="noindex, follow">/);
  assert.match(redirect, /"\.\/equasplat\.html" \+ window\.location\.search \+ window\.location\.hash/);
  assert.match(redirect, /window\.location\.replace\(destination\)/);
  assert.ok(!/function createImportedEquationState/.test(redirect), "la redirection ne contient plus le moteur");
});

test("le mode réception s’allume à l’import et nulle part ailleurs", () => {
  // Deux appels : la réception réussie et l'écran « Impossible de lire l’équation importée ».
  const appels = html.match(/setAppLayout\("import"\)/g) || [];
  assert.equal(appels.length, 2, "l’import est le seul chemin vers le mode réception");
  assert.match(html, /function setAppLayout\(mode\)\{[\s\S]*?document\.body\.classList\.toggle\("importMode", reception\);\s*document\.documentElement\.classList\.toggle\("importModeRoot", reception\);/);
  // Le constructeur local et le dé ne l'allument jamais.
  for (const nom of ["buildFromEquationInput", "buildFromInputs", "randomExercise"]) {
    const debut = html.indexOf(`function ${nom}(`);
    const fin = html.indexOf("\n  function ", debut + 1);
    assert.ok(debut !== -1, `${nom} existe`);
    assert.ok(!html.slice(debut, fin).includes("setAppLayout(\"import\")"), `${nom} n’allume pas le mode réception`);
  }
  // Le tableau reçu appartient à celui qui l'a envoyé : ni Menu, ni dé, ni bascule de vue.
  assert.match(html, /body\.importMode \.menuQuickBtn,\s*body\.importMode #btnStageRandom\{\s*display:none !important;\s*\}/);
});

test("en réception, le mode téléphone de l’usage libre ne s’active jamais", () => {
  assert.match(html, /function isImportLayout\(\)\{ return appLayoutMode === "import"; \}/);
  assert.match(html, /function isPhoneLayout\(\)\{ return !isImportLayout\(\) && phoneLayoutMedia\.matches; \}/);
  assert.match(html, /function isMobileImportLayout\(\)\{\s*return document\.body\.classList\.contains\("importMode"\)\s*&& window\.matchMedia\(MOBILE_IMPORT_QUERY\)\.matches\s*&& !document\.fullscreenElement;/);
  // Les règles de réception sont toutes sous body.importMode ; celles de l'usage
  // libre sous main.activeMode : aucune règle partagée.
  assert.ok(!/body\.importMode main\.activeMode/.test(html));
});

test("ÉquaSplat mobile place l’équation, le plateau puis les commandes dans le flux", () => {
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.stageQuickActions\{\s*display:none;/);
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.topbar\{\s*order:1;/);
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.board\{\s*order:2;/);
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.instructionZone\{\s*order:3;/);
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.mobileBottomControls\{\s*order:4;\s*position:static;/);
  // Hors réception, le conteneur des commandes est transparent pour la grille libre.
  assert.match(html, /\.mobileBottomControls\{\s*display:contents;\s*\}/);
  assert.match(html, /<div class="mobileBottomControls" id="mobileBottomControls">\s*<div class="toolBar" id="toolBar"/);
});

test("ÉquaSplat mobile compacte les actions objet sur une ligne et sépare les familles", () => {
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.toolRowObjects\{\s*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(html, /body\.importUnitMode \.stage:not\(:fullscreen\) \.toolRowObjects\{\s*grid-template-columns:1fr;/);
  assert.match(html, /\.toolRowEquation\{[^}]*rgba\(240,253,244,/s);
  assert.match(html, /\.toolRowObjects\{[^}]*rgba\(239,246,255,/s);
  assert.match(html, /class="mobileLabel">Partager</);
  assert.match(html, /class="mobileLabel">Enlever des deux côtés</);
  assert.match(html, /class="mobileLabel">Ajouter des deux côtés</);
  assert.match(html, /\.mobileLabel\{\s*display:none;/);
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.desktopLabel\{\s*display:none;/);
  assert.doesNotMatch(html, /id="mobileRemovedDisplayMode"/);
  assert.match(html, /id="btnStageReset"[^>]*>Recommencer<\/button>/);
});

test("Annuler et Recommencer restent disponibles avec une flèche lisible", () => {
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) #btnFullscreen\{\s*display:none;/);
  assert.match(html, /id="toolUndo"[^>]*>[^<]*<span class="desktopUndoLabel">Annuler<\/span><span class="mobileUndoLabel"><svg class="undoIcon"/);
  assert.match(html, /<path d="M9 14 4 9l5-5"><\/path>/);
  assert.match(html, /toolUndo\.addEventListener\("click", undo\)/);
  // « Recommencer » ramène l'équation reçue, jamais une équation libre.
  assert.match(html, /if\(btnStageReset\) btnStageReset\.addEventListener\("click", resetCurrentExercise\);/);
  assert.match(html, /function resetCurrentExercise\(\)\{\s*if\(isImportLayout\(\)\)\{[\s\S]*?restartImportedEquation\(\);\s*return;\s*\}/);
  assert.match(html, /function restartImportedEquation\(\)\{\s*if\(!initialImportState\) return;\s*state = clone\(initialImportState\);/);
  assert.match(html, /initialImportState = clone\(state\);/);
});

test("l’historique bleu réserve dès le départ une grande zone et suit sa dernière ligne", () => {
  assert.match(html, /equationHistory\.scrollTop = equationHistory\.scrollHeight/);
  assert.match(html, /\.equationHistory\{[^}]*overflow-y:auto;/s);
  assert.match(html, /\.topbar\{\s*order:1;[^}]*height:auto;[^}]*min-height:120px;[^}]*max-height:none;[^}]*flex:1 1 120px;[^}]*border:2px solid #93c5fd;[^}]*background:#eff6ff;/s);
  assert.match(html, /\.equationHistory\{[^}]*overflow-y:auto;[^}]*overscroll-behavior:contain;[^}]*-webkit-overflow-scrolling:touch;/s);
});

test("les opérations faites aux deux membres apparaissent entre les équations", () => {
  // Le moteur est celui d'ÉquaSplat : opérations objets, flèche droite, bords extérieurs.
  assert.match(html, /function recordEquationStep\(operation=null\)/);
  assert.match(html, /function renderOperationRow\(operation\)/);
  assert.match(html, /<span class="operationArrow" aria-hidden="true">↓<\/span>/);
  assert.match(html, /\.operationCell\.opLeft\{\s*justify-content:flex-start;\s*padding-left:3px;/);
  assert.match(html, /\.operationCell\.opRight\{\s*justify-content:flex-end;\s*padding-right:3px;/);
  assert.match(html, /Même opération dans les deux membres/);
  assert.match(html, /recordEquationStep\(makeBothSidesOperation\(opLabel\)\)/);
  assert.match(html, /recordEquationStep\(makeBothSidesOperation\("×\(−1\)"\)\)/);
  assert.match(html, /state\.stepOps\.push\(makeBothSidesOperation\(`÷ \$\{pending\.count\}`\)\)/);
  assert.match(html, /finishAddBothAction\(makeBothSidesOperation\(formatSignedOperationNumber\(value\)\)\)/);
  assert.match(html, /finishAddBothAction\(makeBothSidesOperation\(formatSignedOperationX\(sign \* count\)\)\)/);
  // Les paquets de billes passent par les mini-plateaux des jetons numérotés :
  // même geste (touche-en un), même écriture (÷ nombre de taches).
  assert.match(html, /beginPendingShareConclusion\(\{count:situation\.xCount, xSide:situation\.varSide, tokenSide:situation\.tokenSide\}, each\)/);
  assert.match(html, /state\.pendingShareConclusion\.unit = true;/);
  // Plus de raccourci « 4𝑛 = 4 × 1 » ni de bouton Conclure avec les billes.
  assert.match(html, /if\(isImportedUnitMode\(\) && !\(state && state\.conclusionDone\)\) return null;/);
  // Au téléphone, la ligne d'opération garde la grille trois colonnes.
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.equationOpRow\{\s*grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\);/);
});

test("retirer une tache de chaque membre affiche bien moins x", () => {
  assert.match(html, /return \{ok:true, type:"x", coef:leftCoef, label:formatXTerm\(leftCoef\), left, right\};/);
  assert.match(html, /const opLabel = formatSubtractBothSidesOperation\(info\);/);
  assert.match(html, /function formatSignedOperationX\(coef\)\{[\s\S]*?return n < 0 \? `−\$\{body\}` : `\+\$\{body\}`;/);
});

test("la sélection orange est assez épaisse pour rester visible au doigt", () => {
  assert.match(html, /\.selectedOutline\{\s*fill:none;\s*stroke:#f97316;\s*stroke-width:14;\s*opacity:1;/);
});

test("les réponses passent par le pavé tactile d’ÉquaSplat, commun à tout écran tactile", () => {
  // L'ancien pavé statique (.mobileMathKeypad ×4, seulement sous 760 px) n'est pas repris.
  assert.doesNotMatch(html, /mobileMathKeypad/);
  assert.match(html, /function usesTouchKeypad\(\)[\s\S]*navigator\.maxTouchPoints/);
  assert.match(html, /function activateTouchKeypad\(input, options=\{\}\)/);
  for (const name of ["decomposeInput", "groupInput", "addBothInput", "fusionInput"]) {
    assert.match(html, new RegExp(`bindTouchKeypadInput\\(${name},`));
  }
});

test("la décomposition accepte naturellement une soustraction", () => {
  assert.match(html, /if\(!\/\^\[\+-\]\?\\d\+\(\?:\[\+-\]\\d\+\)\*\$\/\.test\(raw\)\) return null;/);
  assert.match(html, /raw\.match\(\/\[\+-\]\?\\d\+\/g\)/);
  // …mais pas de nombre négatif en Splat positif.
  assert.match(html, /if\(!isRelativeUniverse\(\) && values\.some\(v => v < 0\)\)\{/);
});

test("le partage final écrit immédiatement la division et la solution", () => {
  assert.match(html, /function applySharedTokenSplit\(side, id, partCount, partValue\)/);
  assert.match(html, /opportunity\.tokenSide === side[\s\S]*opportunity\.token\.id === id[\s\S]*opportunity\.count === count/);
  assert.match(html, /function beginPendingShareConclusion\(opportunity, each\)/);
  assert.match(html, /const pending = \{\s*id:uid\(\),\s*count:opportunity\.count,\s*each:Number\(each\),\s*xSide:opportunity\.xSide,\s*tokenSide:opportunity\.tokenSide/);
  assert.match(html, /state\.pendingShareConclusion = pending/);
  assert.match(html, /if\(isFinalShare\)\{[\s\S]*beginPendingShareConclusion\(opportunity, each\)[\s\S]*\}else\{[\s\S]*arr\.splice\(idx, 1, \.\.\.Array\.from/s);
  // La conclusion respecte le côté de l'inconnue (version ÉquaSplat conservée).
  assert.match(html, /function finalEquationForConclusion\(info\)\{[\s\S]*?return info\.xSide === "left" \? `\$\{unknown\} = \$\{value\}` : `\$\{value\} = \$\{unknown\}`;/);
  assert.match(html, /function pendingShareFinalEquation\(pending\)/);
  assert.match(html, /pending\.xSide === "left" \? `\$\{unknown\} = \$\{value\}` : `\$\{value\} = \$\{unknown\}`/);
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
  assert.match(html, /setTimeout\(\(\) => finalizePendingShare\(pending\.id\), 420\)/);
  const finalizeStart = html.indexOf("function finalizePendingShare");
  const finalizeEnd = html.indexOf("\n  function ", finalizeStart + 1);
  const finalizeSource = html.slice(finalizeStart, finalizeEnd);
  assert.doesNotMatch(finalizeSource, /recordEquationStep/);
  assert.match(finalizeSource, /simplifyPlateauForConclusion\(\{\s*value:pending\.each,/);
  assert.match(html, /function drawSharedTray\(leftTray, rightTray\)/);
  assert.match(html, /divider\.setAttribute\("y1", y\)/);
  assert.match(html, /divider\.setAttribute\("y2", bottom\)/);
  assert.match(html, /drawSharedTray\(leftTray, rightTray\)/);
  assert.doesNotMatch(html, /drawText\(800, viewHeight \/ 2, "=", "eqMiddle"\)/);
  assert.match(html, /divider\.setAttribute\("y2", y \+ cardH\)/);
});

test("la conclusion inversée est reconnue et le doublon Annuler a disparu", () => {
  assert.ok(html.includes('(rhs === v && /^[−-]?\\d+$/.test(lhs))'));
  assert.doesNotMatch(html, /id="btnStageUndo"/);
});

test("décomposer 30 en 10 + 10 + 10 déclenche la même division finale", () => {
  assert.match(html, /function decompositionMatchesFinalShare\(opportunity, side, id, values\)/);
  assert.match(html, /values\.length !== opportunity\.count/);
  assert.match(html, /values\.every\(value => Number\(value\) === Number\(opportunity\.result\)\)/);
  assert.match(html, /const isFinalShare = decompositionMatchesFinalShare\(opportunity, side, id, values\)/);
  assert.match(html, /if\(isFinalShare\)\{\s*beginPendingShareConclusion\(opportunity, Number\(opportunity\.result\)\);/);
});

test("un partage final n’est proposé que face à des taches positives", () => {
  // Face à des taches −x, « x = 4 » serait faux : l'élève prend d'abord l'opposé.
  assert.match(html, /leftX\.length >= 2 && xSign\(leftX\[0\]\) > 0 && leftX\.every/);
  assert.match(html, /rightX\.length >= 2 && xSign\(rightX\[0\]\) > 0 && rightX\.every/);
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

test("les billes unitaires s’écrivent comme un seul nombre et se partagent en paquets", () => {
  assert.match(html, /const unitSum = pieces\s*\.filter\(p => p\.type === "token" && p\.unit\)/);
  assert.match(html, /if\(useUnits && piece\.type === "token" && !piece\.unit\)\{/);
  assert.match(html, /out\.push\(makeToken\(1, \{unit:true\}\)\)/);
  assert.match(html, /const TOKEN_UNIT_R = 18;/);
  assert.match(html, /<button class="toolBtn unitShareToolBtn" id="toolShareUnits" type="button">Faire des paquets<\/button>/);
  assert.match(html, /#toolShareUnits\{\s*display:none;\s*\}/);
  assert.match(html, /body\.importUnitMode #toolDecompose,\s*body\.importUnitMode #toolGroup,\s*body\.importUnitMode #toolShare\{\s*display:none;\s*\}/);
  assert.match(html, /body\.importUnitMode #toolShareUnits\{\s*display:inline-flex;[^}]*align-items:center;[^}]*justify-content:center;/s);
  for (const nom of ["isImportedUnitMode", "getUnitShareSituation", "getUnitShareOpportunity", "applyUnitPacketChoice", "applyUnitShareTokens", "clearUnitPacketConclusion", "addUnitPacketConclusion", "drawUnitPacketBoxes", "applyUnitPacketPositions", "packetGridForTray", "positionsInPacketBox"]) {
    assert.match(html, new RegExp(`function ${nom}\\(`), `${nom} est portée`);
  }
  assert.match(html, /if\(toolShareUnits\) toolShareUnits\.addEventListener\("click", applyUnitShareTokens\);/);
  assert.match(html, /\.packetBox\.matchXCount\{/);
  assert.match(html, /\.unitPacketChoice\{/);
  assert.match(html, /btn\.textContent = `\$\{choice\.packetCount\} paquet\$\{choice\.packetCount > 1 \? "s" : ""\} de \$\{choice\.each\}`;/);
  // « Il reste n taches et m jetons : on peut faire des paquets. » ne doit pas être
  // recouverte par la consigne générique du mode « Enlever » : c'est la seule aide
  // qui reste depuis que le raccourci « 4𝑛 = 4 × 1 » a disparu.
  assert.match(html, /const selection = selectedDeletePiecesBySide\(\);\s*if\(actionMode === "delete" && !selection\.left\.length && !selection\.right\.length\) return;/);
});

test("sur téléphone seule la zone bleue défile", () => {
  assert.match(html, /html\.importModeRoot\{[^}]*height:100svh;[^}]*overflow:hidden;[^}]*overscroll-behavior:none;/s);
  assert.match(html, /body\.importMode\{[^}]*position:fixed;[^}]*inset:0;[^}]*width:100%;/s);
  assert.match(html, /body\.importMode\{[^}]*height:100svh;[^}]*min-height:0;[^}]*max-height:100svh;[^}]*overflow:hidden;[^}]*overscroll-behavior:none;/s);
  assert.match(html, /body\.importMode main\{[^}]*height:calc\(100% - 8px\);[^}]*max-height:calc\(100% - 8px\);[^}]*overflow:hidden;/s);
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\)\{[^}]*height:100%;[^}]*max-height:100%;[^}]*overflow:hidden;/s);
  assert.match(html, /@media \(max-width:760px\) and \(max-height:720px\)[\s\S]*?\.topbar\{[^}]*height:auto;[^}]*min-height:100px;[^}]*flex:1 1 100px;/);
});

test("le plateau mobile utilise tout son cadre avec des plateaux rectangulaires", () => {
  assert.match(html, /\.board\{\s*order:2;[^}]*width:calc\(100% \+ 12px\);[^}]*height:clamp\(260px,76vw,300px\);[^}]*margin-left:-6px;[^}]*margin-right:-6px;/s);
  assert.match(html, /function mobileSvgViewHeight\(\)\{[^}]*Math\.round\(1600 \* height \/ width\)[^}]*980, 1420/s);
  assert.match(html, /const viewHeight = isMobileImportLayout\(\) \? mobileSvgViewHeight\(\) : \(isPhoneLayout\(\) \? 1280 : desktopSvgViewHeight\(\)\);\s*svg\.setAttribute\("viewBox", `0 0 1600 \$\{viewHeight\}`\)/);
  assert.match(html, /\? \{x:8, y:36, w:760, h:viewHeight-72\}/);
  assert.match(html, /: \{x:832, y:36, w:760, h:viewHeight-72\}/);
  assert.match(html, /return isMobileImportLayout\(\) \? Math\.round\(radius \* 1\.36\) : radius/);
  assert.match(html, /x:tray\.x\+\(mobileLayout \? 45 : 70\)/);
  assert.match(html, /w:tray\.w-\(mobileLayout \? 90 : 140\)/);
  assert.match(html, /r:mobileLayout \? 108 : radius/);
  assert.ok((760 - 90) / 3 > 2 * 108, "trois splats agrandis doivent rester séparés sur une ligne");
  assert.match(html, /@media \(max-width:760px\) and \(max-height:720px\)/);
  assert.match(html, /\.board\{\s*height:250px;\s*min-height:250px;\s*max-height:250px;/);
  assert.match(html, /\.topbar\{\s*height:auto;\s*min-height:100px;\s*max-height:none;/);
});

test("l’élargissement conserve tous les garde-fous anti-chevauchement", () => {
  assert.match(html, /if\(tokenOverlapsSplats\(p, splats, r\)\) continue;/);
  assert.match(html, /const minTokenDist = isImportLayout\(\) \? undefined : r \* 2\.12;/);
  assert.match(html, /if\(tokenOverlapsExisting\(p, placed, minTokenDist\)\) continue;/);
  assert.match(html, /const minDist = \(a\.unit \|\| b\.unit\) \? tokenRadius\(a\) \+ tokenRadius\(b\) \+ 12 : tokenRadius\(\) \* 2\.10;/);
  assert.match(html, /separateTokenPositions\(tray, visible, tokens, sideName\);/);
});

test("l’import reste toujours en mode Caché sans contrôle mobile ou rapide", () => {
  assert.doesNotMatch(html, /stageRemovedDisplayMode/);
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

test("la mention de confidentialité reste accessible en réception, sans toucher à l’usage libre", () => {
  assert.doesNotMatch(html, /body\.importMode \.mg-mention-slot\{\s*display:none !important;/);
  assert.match(html, /<div class="actionZone" id="actionZone"><\/div>\s*<a class="mobileConsentLink" href="\.\.\/confidentialite\.html">Sans cookie ni traceur · Confidentialité<\/a>/);
  assert.match(html, /<footer class="equasplatConsentFooter">\s*<a class="equasplatConsentLink" href="\.\.\/confidentialite\.html">Sans cookie ni traceur · Confidentialité<\/a>/);
  assert.match(html, /\.mobileConsentLink\{\s*display:none;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.mobileConsentLink\{\s*display:inline-flex;[^}]*min-height:32px;/s);
  assert.match(html, /\.equasplatConsentFooter\{\s*display:none;/);
  assert.match(html, /body\.importMode \.equasplatConsentFooter\{\s*display:flex;/);
  assert.match(html, /body\.importMode \.equasplatConsentFooter\{\s*display:none;/);
  assert.match(html, /@media \(max-width:760px\) and \(max-height:680px\)[\s\S]*?\.board\{\s*height:220px;\s*min-height:220px;\s*max-height:220px;/);
  // En usage libre, aucun lien ne porte l'attribut : mention-confidentialite.js
  // garde sa mention automatique. En réception, l'attribut est posé et la mention
  // automatique (flottante sur écran verrouillé) s'efface.
  assert.ok(!/<a[^>]*data-mathsgo-confidentialite/.test(html), "pas d’attribut dans le HTML statique");
  assert.match(html, /function bindReceptionConsentLinks\(\)\{[\s\S]*?lien\.setAttribute\("data-mathsgo-confidentialite", ""\);/);
  assert.match(html, /if\(reception\) bindReceptionConsentLinks\(\);/);
  assert.doesNotMatch(html, /mathsgoConsentement|consent-open|Gérer mes cookies/, "plus rien de l’ancienne bannière");
});
