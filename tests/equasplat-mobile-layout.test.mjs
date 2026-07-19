import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/equasplat_import_splat.html", import.meta.url), "utf8");

test("ÉquaSplat mobile place le plateau, les commandes puis l’équation dans le flux", () => {
  assert.match(html, /\.stage:not\(:fullscreen\) \.stageQuickActions\{\s*display:none;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.board\{\s*order:1;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.instructionZone\{\s*order:2;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.mobileBottomControls\{\s*order:3;\s*position:static;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.topbar\{\s*order:4;/);
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
  assert.match(html, /\.topbar\{\s*order:4;[^}]*height:clamp\(300px,44dvh,380px\);[^}]*min-height:300px;[^}]*max-height:380px;[^}]*border:2px solid #93c5fd;[^}]*background:#eff6ff;/s);
});

test("le plateau mobile utilise tout son cadre avec des plateaux rectangulaires", () => {
  assert.match(html, /\.board\{\s*order:1;[^}]*width:calc\(100% \+ 12px\);[^}]*height:clamp\(350px,98vw,410px\);[^}]*margin-left:-6px;[^}]*margin-right:-6px;/s);
  assert.match(html, /svg\.setAttribute\("viewBox", mobileLayout \? "0 0 1600 1480" : "0 0 1600 820"\)/);
  assert.match(html, /\? \{x:8, y:54, w:760, h:1372\}/);
  assert.match(html, /: \{x:832, y:54, w:760, h:1372\}/);
  assert.match(html, /return isMobileImportLayout\(\) \? Math\.round\(radius \* 1\.30\) : radius/);
  assert.match(html, /x:tray\.x\+\(mobileLayout \? 45 : 70\)/);
  assert.match(html, /w:tray\.w-\(mobileLayout \? 90 : 140\)/);
  assert.match(html, /r:mobileLayout \? 108 : 84/);
  assert.ok((760 - 90) / 3 > 2 * 108, "trois splats agrandis doivent rester séparés sur une ligne");
  assert.match(html, /@media \(max-width:760px\) and \(max-height:720px\)/);
  assert.match(html, /\.board\{\s*height:285px;\s*min-height:285px;\s*max-height:285px;/);
  assert.match(html, /\.topbar\{\s*height:220px;\s*min-height:220px;\s*max-height:220px;/);
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
  assert.match(html, /\.mg-consent-manage-slot--fixed\{\s*position:relative !important;/);
  assert.match(html, /getComputedStyle\(mobileBottomControlsEl\)\.position === "fixed"/);
});
