import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

test("la scène mobile occupe le viewport et donne le reste de la hauteur au plateau", () => {
  assert.match(html, /main\.activeMode\{[^}]*height:calc\(100dvh - 12px\);/s);
  assert.match(html, /grid-template-rows:auto 118px minmax\(205px,1fr\) 56px auto !important;/);
  assert.match(html, /\.stage:not\(:fullscreen\) \.board\{[^}]*height:100% !important;[^}]*max-height:none !important;/s);
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
