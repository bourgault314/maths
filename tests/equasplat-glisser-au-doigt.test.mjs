import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* ÉquaSplat, 29/09/2026 : glisser un jeton ou une tache au doigt.
   Chrome ignore touch-action sur les éléments internes d'un SVG (<g>, <path>, <circle>) :
   seul celui du plateau compte. Sans lui, avec une équation reçue (?data=) ou sur tablette,
   le navigateur reprend le geste pour faire défiler la page (pointercancel) et la pièce
   s'arrête en route. Mesuré au navigateur (événements tactiles) : 12 gestes annulés sur 12
   hors téléphone lancé depuis le menu, 0 sur 12 avec la règle. */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");
const style = html.slice(html.indexOf("<style"), html.indexOf("</style>"));

/* Les règles écrites hors de toute @media : on retire les blocs @media (accolades équilibrées). */
function horsMedia(css){
  let out = "", i = 0;
  while(i < css.length){
    const m = css.indexOf("@media", i);
    if(m === -1){ out += css.slice(i); break; }
    out += css.slice(i, m);
    let j = css.indexOf("{", m), prof = 0;
    for(; j < css.length; j++){
      if(css[j] === "{") prof++;
      else if(css[j] === "}" && --prof === 0) break;
    }
    i = j + 1;
  }
  return out;
}

test("le plateau d'ÉquaSplat garde le doigt pour lui, quel que soit l'écran", () => {
  const regles = [...horsMedia(style).matchAll(/(^|[\s}])#splatSvg\s*\{([^}]*)\}/g)].map(m => m[2]);
  assert.ok(regles.some(corps => /touch-action\s*:\s*none/.test(corps)),
    "une règle #splatSvg hors de toute @media doit dire touch-action:none");
});
