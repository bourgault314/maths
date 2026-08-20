import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `la fonction ${name} doit exister`);
  const end = nextName ? html.indexOf(`function ${nextName}(`, start + 1) : -1;
  assert.notEqual(end, -1, `la fonction ${nextName} doit suivre ${name}`);
  return html.slice(start, end);
}

test("les quatre modes A/A±/B/B± partagent le plateau haut", () => {
  const trayConfig = functionSource("getTrayConfig", "getUnitSplats");
  for(const family of ["U", "UPM", "N", "NPM"]){
    assert.match(trayConfig, new RegExp(`mode === "${family}"`));
  }
  assert.match(trayConfig, /y:210, w:1360, h:660, isHigh: true/);
  assert.match(trayConfig, /y:270, w:1360, h:550, isHigh: false/);
});

test("l'impression descend seulement le grand plateau sans toucher au plateau interactif", () => {
  const printTrayConfig = functionSource("getPrintTrayConfig", "getUnitSplats");

  assert.match(printTrayConfig, /const tray = getTrayConfig\(mode\)/);
  assert.match(printTrayConfig, /const offsetY = tray\.isHigh \? 35 : 0/);
  assert.match(printTrayConfig, /return \{\.\.\.tray, y:tray\.y \+ offsetY, offsetY\}/);
});

test("l'impression dessine le meme plateau que celui utilise pour placer les jetons", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.match(printRenderer, /const printTray = getPrintTrayConfig\(card\.family\)/);
  assert.match(printRenderer, /x:printTray\.x, y:trayY, width:printTray\.w, height:trayH/);
  assert.doesNotMatch(printRenderer, /const trayY = 270/);
  assert.doesNotMatch(printRenderer, /const trayH = 550/);
});

test("l'impression ramene chaque jeton entierement dans son plateau", () => {
  const fitToken = functionSource("fitPrintTokenToTray", "renderCardIntoSvg");
  const fitPrintTokenToTray = Function(`return (${fitToken})`)();
  const tray = {x:120, y:210, w:1360, h:660};

  assert.deepEqual(
    fitPrintTokenToTray(120, 210, 32, tray, 5),
    {cx:156.5, cy:246.5}
  );
  assert.deepEqual(
    fitPrintTokenToTray(1480, 870, 32, tray, 5),
    {cx:1443.5, cy:833.5}
  );

  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");
  assert.match(printRenderer, /fitPrintTokenToTray\(cx, cy, beadR, printTray, strokeWidth\)/);
  assert.equal((printRenderer.match(/fitPrintTokenToTray\(/g) || []).length, 5);
});

test("le total et les aides restent separes du plateau haut a l'impression", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.match(printRenderer, /let tx = 800, ty = 92/);
  assert.match(printRenderer, /const totalNumberSize = 96/);
  assert.match(printRenderer, /const boxH = 210/);
  assert.match(printRenderer, /let boxW = 280/);
  assert.doesNotMatch(printRenderer, /compactPrintTotal/);
  assert.match(printRenderer, /let currentY = trayY \+ trayH \+ 100/g);
  assert.match(printRenderer, /const centerY = \(isHelpOnly \? 1240 : 1285\) \+ printOffsetY/);
});

test("les jetons, les taches et les badges suivent le decalage d'impression", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.match(printRenderer, /const printOffsetY = printTray\.offsetY/);
  assert.match(printRenderer, /cy \+= printOffsetY/);
  assert.equal((printRenderer.match(/blobPath\(s\.cx,\s*s\.cy \+ printOffsetY,\s*s\.r\)/g) || []).length, 2);
  assert.match(printRenderer, /s0\.cy\+printOffsetY-h\/2/);
  assert.match(printRenderer, /s0\.cy\+printOffsetY, "0 jeton"/);
});

test("le nouveau logo classique reste discret dans le pied de page", () => {
  assert.match(html, /\.print-logo\{[\s\S]*?width:36mm;/);
});
