import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* ÉquaSplat, 28/09/2026 — même règle que Splat Équations : une ligne d'équation = une
   opération faite des deux côtés, avec sa flèche ; le geste se voit sur le plateau.
   - Décomposer, ou Partager dans un autre nombre de parts que de taches : plus de ligne.
   - Regrouper, fusionner, annuler une paire 𝑥 et −𝑥 (« Je simplifie ») : le premier geste
     après la ligne de départ ouvre la ligne réduite ; les suivants complètent la ligne en
     cours (la réduite, ou la ligne d'une flèche) au lieu d'en empiler une chacun.
   Le test EXÉCUTE les vraies fonctions d'écriture de l'historique, relues dans la page. */

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

/* Un historique miniature : « plateau » est l'équation que la page lirait sur le plateau. */
function historique(depart){
  const monde = {plateau: depart};
  const f = Function("monde", `
    let state = {steps:[], stepOps:[]};
    function currentEquationString(){ return monde.plateau; }
    function makeBothSidesOperation(label){ return {type:"bothSides", label:String(label || "")}; }
    ${source("recordEquationStep")}
    ${source("updateCurrentEquationStep")}
    ${source("recordSimplifyStep")}
    recordEquationStep();
    return {
      state: () => state,
      simplifier(eq){ monde.plateau = eq; recordSimplifyStep(); },
      operation(eq, label){ monde.plateau = eq; recordEquationStep(makeBothSidesOperation(label)); },
      casser(eq){ monde.plateau = eq; /* décomposer : rien ne s'écrit */ },
      lignes(){ return state.steps.map((l, i) => (i && state.stepOps[i - 1] ? "(" + state.stepOps[i - 1].label + ") " : "") + l); }
    };`);
  return f(monde);
}

test("relatifs : 𝑥 − 13 = −4 − 2 s'écrit comme le corrigé, en trois lignes", () => {
  const h = historique("𝑥 − 13 = −4 − 2");
  h.simplifier("𝑥 − 13 = −6");
  h.operation("𝑥 − 13 + 13 = −6 + 13", "+13");
  h.simplifier("𝑥 = −6 + 13");      // −13 et 13 regroupés (le 0 s'en va)
  h.simplifier("𝑥 = 7");            // −6 et 13 regroupés
  assert.deepEqual(h.lignes(), ["𝑥 − 13 = −4 − 2", "𝑥 − 13 = −6", "(+13) 𝑥 = 7"]);
});

test("monde 5 : regrouper les deux membres ne fait qu'une ligne réduite", () => {
  const h = historique("3𝑛 + 7 + 5 = 10 + 17");
  h.simplifier("3𝑛 + 12 = 10 + 17");
  h.simplifier("3𝑛 + 12 = 27");
  assert.deepEqual(h.lignes(), ["3𝑛 + 7 + 5 = 10 + 17", "3𝑛 + 12 = 27"]);
});

test("la ligne de départ n'est jamais réécrite", () => {
  const h = historique("2𝑐 − 𝑐 + 14 + 22 = 4𝑐 + 24");
  h.simplifier("𝑐 + 14 + 22 = 4𝑐 + 24");
  h.simplifier("𝑐 + 36 = 4𝑐 + 24");
  assert.equal(h.state().steps[0], "2𝑐 − 𝑐 + 14 + 22 = 4𝑐 + 24");
  assert.equal(h.state().steps.length, 2);
});

test("décomposer n'écrit rien : la ligne suivante vient avec sa flèche", () => {
  const h = historique("26 + 16 = 𝑥 + 34");
  h.simplifier("42 = 𝑥 + 34");
  h.casser("8 + 34 = 𝑥 + 34");
  h.operation("8 = 𝑥", "−34");
  assert.deepEqual(h.lignes(), ["26 + 16 = 𝑥 + 34", "42 = 𝑥 + 34", "(−34) 8 = 𝑥"]);
});

test("les gestes qui cassent un jeton n'écrivent plus de ligne", () => {
  assert.doesNotMatch(source("applyTokenSplit"), /recordEquationStep|updateCurrentEquationStep/);
  const partage = source("applySharedTokenSplit");
  const nonFinal = partage.slice(partage.indexOf("}else{"));
  assert.doesNotMatch(nonFinal, /recordEquationStep|updateCurrentEquationStep/);
  // le partage dans le bon nombre de parts écrit toujours « ÷ n » tout de suite
  assert.match(partage, /beginPendingShareConclusion\(opportunity, each\)/);
});

test("regrouper, fusionner et annuler une paire passent par « Je simplifie »", () => {
  for(const nom of ["applyGroup", "applyFusion", "applyZeroXGroup", "cancelZeroXPair"]){
    const f = source(nom);
    assert.match(f, /recordSimplifyStep\(\);/, nom);
    assert.doesNotMatch(f, /recordEquationStep\(/, nom);
  }
});

test("plus de « 3𝑥 = 3 × 8 » posé sur « 3𝑥 = 24 » : seule la ligne finale se réécrit au rendu", () => {
  const rendu = source("render");
  assert.doesNotMatch(rendu, /getSolvedValue\(\) !== null\) updateCurrentEquationStep/);
  assert.match(rendu, /conclusion\.count === 1 \|\| state\.conclusionDone\)\) updateCurrentEquationStep\(\);/);
});
