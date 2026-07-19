import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

test("la scène mobile occupe le viewport et donne le reste de la hauteur au plateau", () => {
  assert.match(html, /html\.equasplatActive,[\s\S]*body\.equasplatActive\{[^}]*height:100svh;[^}]*overflow:hidden;/s);
  assert.match(html, /main\.activeMode\{[^}]*height:calc\(100svh - 12px\);/s);
  assert.match(html, /grid-template-rows:auto 118px minmax\(0,1fr\) 56px auto !important;/);
  assert.match(html, /\.stage:not\(:fullscreen\)\{[^}]*overflow-y:hidden !important;[^}]*overscroll-behavior:none;/s);
  assert.match(html, /\.stage:not\(:fullscreen\) \.board\{[^}]*height:100% !important;[^}]*min-height:0 !important;[^}]*max-height:none !important;/s);
  assert.match(html, /function setAppLayout\(mode\)[\s\S]*document\.documentElement\.classList\.toggle\("equasplatActive"[\s\S]*document\.body\.classList\.toggle\("equasplatActive"/);
});

test("les plateaux mobiles sont plus hauts et occupent le SVG disponible", () => {
  assert.match(html, /svg\.setAttribute\("viewBox", isPhoneLayout\(\) \? "0 0 1600 980" : "0 0 1600 820"\)/);
  assert.match(html, /function getTrayForSide\(side\)\{\s*if\(isPhoneLayout\(\)\)\{[\s\S]*\{x:24, y:34, w:736, h:912\}[\s\S]*\{x:840, y:34, w:736, h:912\}/);
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
