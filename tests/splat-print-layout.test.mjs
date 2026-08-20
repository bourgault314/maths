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

test("l'impression dessine le meme plateau que celui utilise pour placer les jetons", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.match(printRenderer, /const printTray = getTrayConfig\(card\.family\)/);
  assert.match(printRenderer, /x:printTray\.x, y:trayY, width:printTray\.w, height:trayH/);
  assert.doesNotMatch(printRenderer, /const trayY = 270/);
  assert.doesNotMatch(printRenderer, /const trayH = 550/);
});

test("le total et les aides restent separes du plateau haut a l'impression", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.match(printRenderer, /const compactPrintTotal = printTray\.isHigh/);
  assert.match(printRenderer, /const boxH = compactPrintTotal \? 180 : 210/);
  assert.match(printRenderer, /let currentY = trayY \+ trayH \+ 100/g);
});
