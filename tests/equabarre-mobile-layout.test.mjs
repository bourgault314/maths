import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../outils/equabarre.html", import.meta.url), "utf8");

// Ces garde-fous couvrent la composition réellement utilisée en portrait étroit.

test("ÉquaBarre compose les actions mobiles en grilles compactes", () => {
  assert.match(html, /@media \(max-width:700px\)/);
  assert.match(html, /\.toolBarRowMain\{\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /\.toolBarRowGlobal\{\s*grid-template-columns:minmax\(0,1\.35fr\) minmax\(0,\.8fr\) minmax\(0,1fr\)/);
  assert.match(html, /min-height:44px/);
  assert.match(html, /<span class="mobileLabel">Partager<\/span>/);
  assert.match(html, /<span class="mobileLabel">Enlever des deux côtés<\/span>/);
  assert.match(html, /main\.activeMode\{\s*width:calc\(100% - 8px\)/);
});

test("l'historique précède le plateau dans la vue mobile", () => {
  assert.match(html, /\.stage\.detailedView:not\(:fullscreen\):not\(\.emptyState\) \.topbar\{[\s\S]*?order:2 !important/);
  assert.match(html, /\.stage\.detailedView:not\(:fullscreen\):not\(\.emptyState\) \.instructionZone\{[\s\S]*?order:3 !important/);
  assert.match(html, /\.stage\.detailedView:not\(:fullscreen\):not\(\.emptyState\) \.board\{[\s\S]*?order:4 !important/);
  assert.match(html, /\.stage\.detailedView:not\(:fullscreen\):not\(\.emptyState\) \.toolBar\{[\s\S]*?order:6 !important/);
  assert.match(html, /height:clamp\(210px,34svh,290px\) !important/);
  assert.match(html, /align-items:flex-start !important/);
  assert.match(html, /margin:0 auto auto !important/);
  assert.match(html, /margin-top:auto !important/);
});

test("les actions rapides sont centrées au-dessus de l'historique mobile", () => {
  assert.match(html, /align-self:stretch;\s*display:flex;\s*justify-content:center;\s*gap:4px/);
});

test("les choix des dialogues tiennent sur deux colonnes au téléphone", () => {
  assert.match(html, /#shareChoices\.open,[\s\S]*?#presetChips\.open,[\s\S]*?#addSuggestions\.open\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /#shareChoices \.chip,[\s\S]*?min-height:48px/);
});

test("les saisies d'opération ont un pavé tactile sans clavier natif", () => {
  assert.match(html, /class="mobileMathKeypad" data-keypad-for="addInput" data-mode="number"/);
  assert.match(html, /class="mobileMathKeypad" data-keypad-for="decomposeInput" data-mode="sum"/);
  assert.match(html, /input\.setAttribute\("inputmode", "none"\)/);
  assert.match(html, /input\.readOnly = true/);
  assert.match(html, /if\(!input \|\| mobileDialogInputEnabled\(\)\) return/);
  assert.match(html, /key === "backspace"/);
  assert.match(html, /key === "clear"/);
  assert.match(html, /key === "plus"/);
});
