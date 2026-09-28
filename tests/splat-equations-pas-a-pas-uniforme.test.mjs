import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* 28/09/2026 — le pas à pas de Splat Équations, monde 5 et relatifs, suit une même règle :
   une ligne d'équation = une opération faite des deux côtés, avec sa flèche ; le geste
   (casser un jeton, ajouter des jetons ou des taches) se voit sur le plateau, pas dans
   l'équation ; la première ligne est l'équation telle qu'on la lit sur la carte (paquets
   séparés), puis la ligne réduite. L'écran correspond au corrigé imprimé. */

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

/* Monde 5 : les vraies fonctions de la page, le dessin du plateau remplacé par un relevé. */
function monde5(eq, vue = "equation"){
  return Function("eq", "vue", `
    const xChar = "x";
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const getEquationStepView = () => vue;
    const makeEqStepGroupedParts = (coeff, vis, xVal, varChar, opts = {}) => ({coeff, vis, opts});
    ${extraire("sumArray")}
    ${extraire("eqVisibleSum")}
    ${extraire("coeffXLabel")}
    ${extraire("formatEqSideFromCoeffVis")}
    ${extraire("eqStepSeenSide")}
    ${extraire("getEquationStepStates")}
    ${extraire("eqStepStateLines")}
    ${extraire("getEquationStepLineEntries")}
    return { etats: getEquationStepStates(eq, "m", {includeVerify:true}), lignes: getEquationStepLineEntries(eq, "m") };
  `)(eq, vue);
}

/* Relatifs : les vraies fonctions d'écriture et de lecture des lignes ; les fabriques de
   morceaux de plateau sont remplacées par des tableaux vides (le plateau n'est pas testé ici). */
function relatifs(eq){
  const fabriques = [...html.matchAll(/^function (makeEquationSigned\w+)\(/gm)].map(m => `const ${m[1]} = () => [];`).join("\n");
  return Function("eq", `
    const xChar = "x";
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const getSignedWritingMode = () => "simplified";
    ${fabriques}
    ${["sumArray", "eqSignedCoeff", "formatSignedIntegerLabel", "formatSignedCoeffLabel", "formatSignedLinearExpression",
       "formatSignedAbsIntegerLabel", "joinSignedTerms", "formatVarCoeffAbs", "buildEquationSignedStructuredExpressionSide",
       "buildEquationSignedStructuredEquation", "equationSignedSideNeedsCombining", "getEquationSignedStepStates",
       "eqSignedLineCoeffs", "eqSignedLineOperation", "getEquationSignedStepLineEntries", "eqSignedSixCorrectionLinesOps"].map(extraire).join("\n")}
    return { etats: getEquationSignedStepStates(eq, "c"), lignes: getEquationSignedStepLineEntries(eq, "c"), corrige: eqSignedSixCorrectionLinesOps(eq, "c") };
  `)(eq);
}

test("monde 5 : « J'écris ce que je vois » (paquets séparés), puis « Je simplifie », sans flèche entre les deux", () => {
  const eq = { x: 4, left: { tasks: 6, visible: [12, 6] }, right: { tasks: 4, visible: [26] } };
  const { etats, lignes } = monde5(eq);
  assert.deepEqual(etats.slice(0, 2).map(e => e.kind), ["initial", "combined"]);
  assert.deepEqual(lignes.map(l => l.line), ["6m + 12 + 6 = 4m + 26", "6m + 18 = 4m + 26", "2m + 18 = 26", "2m = 8", "m = 4"]);
  assert.deepEqual(lignes.map(l => l.op), [null, null, "− 4m", "− 18", "÷ 2"]);
  // sur le plateau, les deux paquets restent séparés à la première étape
  assert.deepEqual(etats[0].leftParts.opts.visibleSplit.map(p => p.value), [12, 6]);
});

test("monde 5 : un seul paquet par plateau — une seule ligne, et l'étape « Je simplifie » disparaît", () => {
  const { etats, lignes } = monde5({ x: 16, left: { tasks: 0, visible: [28] }, right: { tasks: 1, visible: [12] } });
  assert.equal(etats[0].kind, "initial");
  assert.ok(!etats.some(e => e.kind === "combined"));
  assert.deepEqual(lignes.map(l => l.line), ["28 = m + 12", "16 = m"]);
});

test("monde 5 : la vue Schéma garde son premier tableau (paquets additionnés)", () => {
  const { etats } = monde5({ x: 4, left: { tasks: 6, visible: [12, 6] }, right: { tasks: 4, visible: [26] } }, "schema");
  assert.equal(etats[0].kind, "combined");
  assert.ok(!etats.some(e => e.kind === "initial"));
});

test("relatifs : plus de ligne « 47 − 31 = 2c + 31 − 31 », la flèche « − 31 » à la place", () => {
  const eq = { x: 8, left: { tasks: 0, visible: [29, 18], opposeFlags: [] }, right: { tasks: 2, visible: [29, -7, 9], opposeFlags: [false, false] } };
  const { lignes, corrige, etats } = relatifs(eq);
  assert.deepEqual(lignes.map(l => l.line), ["29 + 18 = 2c + 29 − 7 + 9", "47 = 2c + 31", "16 = 2c", "8 = c"]);
  assert.deepEqual(lignes.map(l => l.op), [null, null, "− 31", "÷ 2"]);
  // l'écran écrit exactement le corrigé imprimé
  assert.deepEqual(lignes.map(l => l.line), corrige.lines);
  assert.deepEqual(lignes.slice(1).map(l => l.op), corrige.ops);
  // partage en 2 groupes avant la division, sans nouvelle ligne
  const k = etats.findIndex(e => e.kind === "share");
  assert.ok(k > 0, "l'étape « Je partage en 2 groupes » existe");
  assert.equal(etats[k].groupCount, 2);
  assert.equal(etats[k].equation, "16 = 2c");
  assert.equal(etats[k + 1].kind, "final");
});

test("relatifs : plus de ligne « −4t + 4t − 11 = … » ; « + 4c » écrit sur la flèche", () => {
  const eq = { x: -3, left: { tasks: 4, visible: [-11], opposeFlags: [true, true, true, true] }, right: { tasks: 2, visible: [-7, 14], opposeFlags: [false, false] } };
  const { lignes, etats } = relatifs(eq);
  assert.ok(etats.some(e => e.kind === "hatchOppositeX"));
  assert.deepEqual(lignes.map(l => l.line), ["−4c − 11 = 2c − 7 + 14", "−4c − 11 = 2c + 7", "−11 = 6c + 7", "−18 = 6c", "−3 = c"]);
  assert.deepEqual(lignes.map(l => l.op), [null, null, "+ 4c", "− 7", "÷ 6"]);
  lignes.forEach(l => assert.doesNotMatch(l.line, /4c \+ 4c|− 7 = .* − 7$/));
});

test("relatifs : diviser par un négatif — partage en |c| groupes, « ÷ (−2) » sur la flèche", () => {
  const eq = { x: -7, left: { tasks: 4, visible: [14, 12], opposeFlags: [false, true, true, true] }, right: { tasks: 0, visible: [16, 24], opposeFlags: [] } };
  const { lignes, etats } = relatifs(eq);
  assert.equal(lignes[lignes.length - 1].op, "÷ (−2)");
  assert.equal(etats.find(e => e.kind === "share").groupCount, 2);
});

test("question a : le morceau neuf d'un jeton cassé se pose à côté, sans rien cacher, toujours au même endroit", () => {
  const f = Function(`const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); ${extraire("eqStepBesidePosition")} return eqStepBesidePosition;`)();
  const tray = { x: 60, y: 360, w: 680, h: 524 };
  const posV = [{ cx: 340, cy: 800 }];
  const p = f(posV, [], tray, 1, 26);
  assert.ok(Math.hypot(p.cx - 340, p.cy - 800) >= 2 * 26 + 12, "le 16 ne touche plus le 12");
  assert.deepEqual(f(posV, [], tray, 1, 26), p, "même carte, même place à chaque étape");
  // une tache juste à côté : on prend l'autre côté
  const q = f(posV, [{ cx: p.cx, cy: p.cy, r: 70 }], tray, 1, 26);
  assert.ok(Math.hypot(q.cx - p.cx, q.cy - p.cy) >= 70 + 26 + 6);
});

test("écran : les relatifs prennent le bloc fixe du monde 5 (police 46, « = » espacé comme au monde 5)", () => {
  assert.match(html, /function drawSignedEquationBlock\(lines, ops\)\{[\s\S]*?fontSize: EQ_VIEW_LINE_FONT,[\s\S]*?eqGap: 30,[\s\S]*?drawOperationArrowsForLines/);
  assert.match(html, /\|\| isSignedEquationFamily\(card\);/);
});

test("« Résoudre » est placé d'après ce qui est déjà dessiné, plus à une place fixe", () => {
  assert.match(html, /const place = placeEquationSolveButton\(layer, solveBtnX, solveBtnY\);\s*drawEquationEquaSplatSolveButton\(layer, card, place\.x, place\.y, revealState\);/);
});

test("bug « suivant » : sur une liste fermée, ← et → font avancer le plateau", () => {
  assert.match(html, /if\(_tag === "select" && \(e\.key === "ArrowLeft" \|\| e\.key === "ArrowRight"\) && !e\.altKey\)\{/);
});

test("vue Équation : une tache ne descend plus sur un jeton (le −26 ajouté collé à la tache « opposé », planche A3)", () => {
  const f = Function(`const EQ_VIEW_TRAY_TOP = 360, EQ_VIEW_TRAY_BOTTOM = 884; ${extraire("eqViewKeepClear")} return eqViewKeepClear;`)();
  // la carte 2 de la fiche 40, telle que la vue Équation la plaçait : 16 d'encre à encre
  const side = { beadR: 34, splats: [{ cx: 595, cy: 654, r: 74 }, { cx: 595, cy: 498, r: 74 }], posH: [], posV: [{ cx: 611, cy: 778 }] };
  const r = f(side);
  const encre = (r.posV[0].cy - 34) - (r.splats[0].cy + 74 * 1.07);
  assert.ok(encre >= 24, `jour entre la tache et le jeton : ${encre}`);
  assert.ok(Math.min(...r.splats.map(t => t.cy - 74 * 1.08)) >= 360 + 14, "les taches restent dans le plateau");
  // rien à faire quand il y a déjà de la place : même objet
  const large = { beadR: 34, splats: [{ cx: 300, cy: 450, r: 74 }], posH: [], posV: [{ cx: 300, cy: 800 }] };
  assert.equal(f(large), large);
});
