import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* 28/09/2026 : dans le pas à pas du mode Équation de Splat Équations, la ligne de
   décomposition (« 18 + 2 = t + 18 ») embrouillait les élèves et n'était pas sur le
   corrigé du livret. L'équation passe désormais directement de « 20 = t + 18 » à
   « 2 = t » avec les flèches « − 18 » ; la décomposition reste visible sur le plateau
   (jeton cassé, part commune hachurée des deux côtés). Même retour : le mot
   « Résoudre » était trop haut dans son bouton vert. */

const html = await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8");

function extraire(nom){
  const debut = html.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}

/* Les lignes écrites et leurs flèches, calculées par les vraies fonctions de la page ;
   le dessin du plateau (makeEqStepGroupedParts) est remplacé par un relevé de ses
   réglages, pour vérifier que la décomposition y est toujours. */
function pasAPas(eq){
  return Function("eq", `
    const xChar = "x";
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const makeEqStepGroupedParts = (coeff, vis, xVal, varChar, opts = {}) => ({coeff, vis, opts});
    ${extraire("sumArray")}
    ${extraire("eqVisibleSum")}
    ${extraire("coeffXLabel")}
    ${extraire("formatEqSideFromCoeffVis")}
    ${extraire("getEquationStepStates")}
    ${extraire("eqStepStateLines")}
    ${extraire("getEquationStepLineEntries")}
    return { etats: getEquationStepStates(eq, "t"), lignes: getEquationStepLineEntries(eq, "t") };
  `)(eq);
}

test("20 = t + 18 : deux lignes seulement, reliées par « − 18 », plus de « 18 + 2 = t + 18 »", () => {
  const eq = { x: 2, left: { tasks: 0, visible: [20] }, right: { tasks: 1, visible: [18] } };
  const { etats, lignes } = pasAPas(eq);
  assert.deepEqual(lignes.map(l => l.line), ["20 = t + 18", "2 = t"]);
  assert.deepEqual(lignes.map(l => l.op), [null, "− 18"]);
  // le plateau garde la décomposition : 18 hachuré + 2 à gauche, 18 hachuré à droite
  const hachure = etats.find(e => e.kind === "hatchV");
  assert.ok(hachure, "l'étape « J'enlève 18 de chaque côté » existe toujours");
  assert.equal(hachure.equationLines, undefined);
  assert.deepEqual(hachure.leftParts.opts.visibleSplit.map(p => [p.value, p.removed]), [[18, true], [2, false]]);
  assert.deepEqual(hachure.rightParts.opts.visibleSplit.map(p => [p.value, p.removed]), [[18, true]]);
});

test("3t + 5 = t + 17 : chaque ligne vient d'une opération faite des deux côtés", () => {
  const eq = { x: 6, left: { tasks: 3, visible: [5] }, right: { tasks: 1, visible: [17] } };
  const { lignes } = pasAPas(eq);
  // avant : « 2t + 5 = 5 + 12 » s'intercalait entre la 2e et la 3e ligne
  assert.deepEqual(lignes.map(e => e.line), ["3t + 5 = t + 17", "2t + 5 = 17", "2t = 12", "t = 6"]);
  lignes.slice(1).forEach(e => assert.ok(e.op, `la ligne « ${e.line} » a sa flèche`));
});

test("plus de ligne de décomposition dans le code de la page", () => {
  assert.doesNotMatch(html, /formatEqStepDecomposedSide/);
  assert.doesNotMatch(html, /equationLines: \[decomposedLine/);
  assert.doesNotMatch(html, /entry\.decomp/);
});

test("« Résoudre » centré dans son bouton vert (ligne de base posée, plus « middle »)", () => {
  const f = extraire("drawEquationEquaSplatSolveButton");
  assert.match(f, /width:126, height:44/);
  assert.match(f, /text\(63, 30, "Résoudre", \{\s*"text-anchor":"middle", "dominant-baseline":"alphabetic",/);
  assert.doesNotMatch(f, /"dominant-baseline":"middle"/);
});
