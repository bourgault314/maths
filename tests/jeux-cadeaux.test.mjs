import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const [page,script,styles]=await Promise.all([
  readFile(new URL("../jeux-cadeaux/index.html",import.meta.url),"utf8"),
  readFile(new URL("../jeux-cadeaux/app.js",import.meta.url),"utf8"),
  readFile(new URL("../jeux-cadeaux/styles.css",import.meta.url),"utf8")
]);

test("la banque est publiable dans le catalogue",()=>assert.match(page,/index,follow/));
test("les quatre jeux du lot 1 sont proposés",()=>{
  for(const id of ["luciole","dodo","galets","tempo"]){
    assert.match(page,new RegExp(`data-game="${id}"`));
    assert.match(script,new RegExp(`${id}:\\{title:`));
  }
});
test("le mode cadeau borne le nombre de parties",()=>{
  assert.match(script,/Math\.max\(1,Math\.min\(2,/);
  assert.match(script,/get\(\"mode\"\)===\"cadeau\"/);
  assert.match(script,/location\.assign\(returnUrl\)/);
});
test("les commandes tactiles ont une taille minimale",()=>assert.match(styles,/\.controls button\{min-width:130px;min-height:50px/));
test("la page possède des adaptations téléphone et hauteur réduite",()=>{
  assert.match(styles,/@media\(max-width:650px\)/);
  assert.match(styles,/@media\(max-height:700px\)/);
});
