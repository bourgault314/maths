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

test("ÉquaSplat mobile garde deux boutons par ligne et sépare les familles", () => {
  assert.match(html, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.toolRowObjects\{[^}]*rgba\(239,246,255,/s);
  assert.match(html, /\.toolRowEquation\{[^}]*rgba\(240,253,244,/s);
  assert.match(html, /class="mobileLabel">Partager</);
  assert.match(html, /class="mobileLabel">Enlever des deux côtés</);
  assert.match(html, /class="mobileLabel">Ajouter des deux côtés</);
  assert.match(html, /id="mobileRemovedDisplayMode"[^>]*class="mobileRemovedDisplayMode"/);
  assert.match(html, /id="toolRestart"[^>]*>Recommencer<\/button>/);
});

test("Annuler et Recommencer restent disponibles avec une flèche lisible", () => {
  assert.match(html, /#btnStageUndo,\s*body\.importMode \.stage:not\(:fullscreen\) #btnFullscreen\{\s*display:none;/);
  assert.match(html, /id="toolUndo"[^>]*>[^<]*<span class="desktopUndoLabel">↶ Annuler<\/span><span class="mobileUndoLabel"><svg class="undoIcon"/);
  assert.match(html, /<path d="M9 14 4 9l5-5"><\/path>/);
  assert.match(html, /toolUndo\.addEventListener\("click", undo\)/);
  assert.match(html, /toolRestart\) toolRestart\.addEventListener\("click", restartImportedEquation\)/);
});

test("l’historique bleu garde une hauteur fixe et suit sa dernière ligne", () => {
  assert.match(html, /equationHistory\.scrollTop = equationHistory\.scrollHeight/);
  assert.match(html, /\.equationHistory\{[^}]*overflow-y:auto;/s);
  assert.match(html, /\.topbar\{\s*order:4;[^}]*height:136px;[^}]*min-height:136px;[^}]*max-height:136px;[^}]*border:2px solid #93c5fd;[^}]*background:#eff6ff;/s);
});

test("le plateau est agrandi tout en gardant une variante pour les écrans courts", () => {
  assert.match(html, /\.board\{\s*order:1;[^}]*height:clamp\(290px,82vw,340px\);[^}]*min-height:290px;[^}]*max-height:340px;/s);
  assert.match(html, /@media \(max-width:760px\) and \(max-height:720px\)/);
  assert.match(html, /\.board\{\s*height:240px;\s*min-height:240px;\s*max-height:240px;/);
  assert.match(html, /\.topbar\{\s*height:110px;\s*min-height:110px;\s*max-height:110px;/);
});

test("l’import démarre en Caché mais respecte un paramètre explicite", () => {
  assert.match(html, /payload\.removedDisplayMode \|\| payload\.removedDisplay \|\| payload\.removedMode \|\| "hide"/);
  assert.match(html, /requestedRemovedDisplay === "keep" \|\| requestedRemovedDisplay === "hatched"/);
  assert.match(html, /mobileRemovedDisplayModeEl\.value = mode/);
});

test("le contrôle des cookies ne se superpose plus aux commandes mobiles", () => {
  assert.match(html, /\.mg-consent-manage-slot--fixed\{\s*position:relative !important;/);
  assert.match(html, /getComputedStyle\(mobileBottomControlsEl\)\.position === "fixed"/);
});
