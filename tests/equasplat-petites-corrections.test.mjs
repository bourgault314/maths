import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* ÉquaSplat, 29/09/2026 (choix de Gwenaël) :
   - les consignes gardent leurs espaces autour du gras (« Jetons regroupés : 36. ») ;
   - les consignes des taches opposées écrivent la lettre de l'équation, pas « x » ;
   - la fenêtre Partager s'ouvre sans bouton entouré ;
   - la sélection est plus fine sur ordinateur et tablette, le téléphone garde la sienne ;
   - le plateau ne bouge plus quand on touche une pièce (vue « Au-dessus ») ;
   - sous 1051 px de large, seulement la vue « Au-dessus » (le plateau disparaissait). */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

function source(nom){
  const debut = html.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}

function consigne({initiale = false, resolue = false} = {}){
  const zone = {innerHTML:""};
  const setInstruction = Function("instructionZone", "initialEqualityInstructionVisible", "INITIAL_EQUALITY_INSTRUCTION", "eleveEquationResolue", `
    ${source("setInstruction")}
    return setInstruction;
  `)(zone, initiale, "<strong>Il y a la même quantité à gauche qu’à droite.</strong>", () => resolue);
  return {zone, setInstruction};
}

test("toute la consigne va dans une seule boîte : les espaces autour du gras restent", () => {
  const {zone, setInstruction} = consigne();
  setInstruction("Jetons regroupés : <strong>36</strong>.");
  assert.equal(zone.innerHTML, '<span class="instructionText">Jetons regroupés : <strong>36</strong>.</span>');
  setInstruction("");
  assert.equal(zone.innerHTML, "", "une consigne vide laisse la zone vide");
  const initiale = consigne({initiale:true});
  initiale.setInstruction("autre chose");
  assert.equal(initiale.zone.innerHTML, '<span class="instructionText"><strong>Il y a la même quantité à gauche qu’à droite.</strong></span>');
  // 15/10/2026 : une fois l'équation résolue, la phrase du milieu s'efface
  const finie = consigne({resolue:true});
  finie.setInstruction("Jetons regroupés : <strong>7</strong>.");
  assert.equal(finie.zone.innerHTML, "", "équation résolue : plus de vieille consigne");
});

test("les consignes des taches opposées écrivent la lettre de l'équation", () => {
  const f = Function("displayedUnknown", `
    ${source("escapeHtml")}
    ${source("unknownHtml")}
    ${source("zeroXPairSelectedInstruction")}
    return zeroXPairSelectedInstruction;
  `);
  assert.equal(f(() => "𝑐")(), "Paire nulle sélectionnée : <strong>𝑐 + (−𝑐) = 0</strong>.");
  assert.equal(f(() => "?")(), "Paire nulle sélectionnée : <strong>? + (−?) = 0</strong>.");
  // Plus aucun « x » écrit en dur dans une consigne.
  assert.doesNotMatch(html, /setInstruction\("Paire nulle sélectionnée : <strong>x/);
  assert.doesNotMatch(html, /paire x \/ −x|taches x que de taches −x|taches x et −x|regrouper x et −x/);
  assert.equal((html.match(/setInstruction\(zeroXPairSelectedInstruction\(\)\)/g) || []).length, 2);
});

test("la fenêtre Partager s'ouvre sur son titre, pas sur « 2 parts »", () => {
  assert.match(html, /<h2 class="dialogTitle" id="shareDialogTitle" tabindex="-1">Partager équitablement<\/h2>/);
  const ouvrir = source("openShareDialog");
  assert.match(ouvrir, /openAppDialog\(shareDialog\);[\s\S]*shareTitle\.focus\(\{preventScroll:true\}\)/);
  assert.match(html, /#shareDialogTitle:focus\{outline:none\}/);
});

test("la sélection : anneau fin sur ordinateur et tablette, épais au téléphone", () => {
  assert.match(html, /\.selectedOutline\.fineRing,\s*\.groupSelectedOutline\.fineRing\{\s*stroke-width:7;/);
  const dessin = source("drawItem");
  assert.equal((dessin.match(/selectionRingClass\("selectedOutline"\)/g) || []).length, 2);
  assert.equal((dessin.match(/selectionRingClass\("groupSelectedOutline"\)/g) || []).length, 2);
  assert.doesNotMatch(dessin, /pos\.r\+12/);
});

test("vue « Au-dessus » : la consigne garde deux lignes, la zone des boutons un bouton", () => {
  assert.match(html, /body\.importMode main\.viewClassic \.stage:not\(:fullscreen\) \.instructionZone\{\s*flex:0 0 auto !important;\s*height:auto !important;\s*min-height:2\.6em !important;/);
  assert.match(html, /body\.importMode main\.viewClassic \.stage:not\(:fullscreen\) \.actionZone\{\s*flex:0 0 auto !important;\s*min-height:46px !important;/);
  // Les boutons de la zone font 46 px : la zone ne grandit plus quand l'un d'eux apparaît.
  assert.match(html, /body\.importMode \.stage:not\(:fullscreen\) \.actionZone button\{\s*min-height:46px !important;/);
});

test("sous 1051 px de large (iPad en paysage), seulement la vue « Au-dessus »", () => {
  assert.match(html, /const narrowViewMedia = window\.matchMedia\("\(max-width:1050px\)"\);/);
  assert.match(html, /function sideViewAvailable\(\)\{ return !narrowViewMedia\.matches; \}/);
  assert.match(source("setViewMode"), /viewMode = \(isPhoneLayout\(\) \|\| !sideViewAvailable\(\)\) \? "classic" : requested;/);
  // Le sélecteur est caché, et l'iPad qu'on tourne retrouve la vue choisie en grand.
  assert.match(html, /@media \(max-width:1050px\)\{\s*#viewModeSwitch\{display:none !important\}\s*\}/);
  assert.match(html, /narrowViewMedia\.addEventListener\("change", syncPhoneLayout\)/);
});
