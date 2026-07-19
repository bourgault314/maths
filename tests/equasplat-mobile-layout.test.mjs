import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/equasplat_import_splat.html", import.meta.url), "utf8");

test("ÉquaSplat mobile place le plateau, les commandes puis l’équation dans le flux", () => {
  assert.match(html, /\.stage:not\(:fullscreen\) \.board\{\s*order:2;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.instructionZone\{\s*order:3;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.mobileBottomControls\{\s*order:4;\s*position:static;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.topbar\{\s*order:5;/);
});

test("ÉquaSplat mobile garde deux boutons par ligne et sépare les familles", () => {
  assert.match(html, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.toolRowObjects\{[^}]*rgba\(239,246,255,/s);
  assert.match(html, /\.toolRowEquation\{[^}]*rgba\(240,253,244,/s);
  assert.match(html, /class="mobileLabel">Partager</);
  assert.match(html, /class="mobileLabel">Enlever des deux côtés</);
  assert.match(html, /class="mobileLabel">Ajouter des deux côtés</);
});

test("les commandes mobiles redondantes sont masquées sans supprimer Annuler", () => {
  assert.match(html, /#btnStageUndo,\s*body\.importMode \.stage:not\(:fullscreen\) #btnFullscreen\{\s*display:none;/);
  assert.match(html, /id="toolUndo"[^>]*>[^<]*<span class="desktopUndoLabel">↶ Annuler<\/span><span class="mobileUndoLabel"><span class="undoArrow"/);
  assert.match(html, /toolUndo\.addEventListener\("click", undo\)/);
});

test("l’historique continue de suivre automatiquement sa dernière ligne", () => {
  assert.match(html, /equationHistory\.scrollTop = equationHistory\.scrollHeight/);
  assert.match(html, /\.equationHistory\{[^}]*overflow-y:auto;/s);
});

test("les écrans courts reçoivent une composition plus compacte", () => {
  assert.match(html, /@media \(max-width:760px\) and \(max-height:720px\)/);
  assert.match(html, /\.board\{\s*height:180px;\s*min-height:180px;\s*max-height:180px;/);
  assert.match(html, /\.topbar\{\s*height:90px;\s*min-height:90px;\s*max-height:90px;/);
});

test("le contrôle des cookies ne se superpose plus aux commandes mobiles", () => {
  assert.match(html, /\.mg-consent-manage-slot--fixed\{\s*position:relative !important;/);
  assert.match(html, /getComputedStyle\(mobileBottomControlsEl\)\.position === "fixed"/);
});
