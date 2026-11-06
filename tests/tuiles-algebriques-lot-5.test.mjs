import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Tuiles algébriques — lot 5 (06/11/2026) : le mode « Factoriser ». Choix de Gwenaël : bouton dans la colonne
// (il prend les tuiles du plateau), tableau qui s'agrandit (une case = une tuile), l'élève pose les côtés
// (un côté faux repart), une ligne d'état en continu, tout jusqu'aux négatifs avec la paire « + 𝑥 et −𝑥 »,
// « un côté vaut 1 » et « on peut encore mettre un nombre en facteur » dits sur un cadre vert,
// un produit au milieu d'une somme toujours refusé à la frappe.
// Les gestes (souris, doigt, ↶, Pivoter, corbeille) sont joués au navigateur (notice du lot).
const page = readFileSync(new URL("../outils/tuiles_algebriques/tuiles_algebriques.html", import.meta.url), "utf8");
const methode = (debut) => {
  const i = page.indexOf(`\n            ${debut}`);
  assert.notEqual(i, -1, `méthode introuvable : ${debut}`);
  const fin = page.indexOf("\n            }\n", i);
  return page.slice(i, fin + 14);
};

const debut = page.indexOf("// === FACTORISER : ANALYSE DU RECTANGLE");
const fin = page.indexOf("// === FIN DE L'ANALYSE DU RECTANGLE ===");
assert.ok(debut > 0 && fin > debut, "bloc d'analyse du rectangle introuvable");
const F = new Function(
  page.slice(debut, fin) + "\nreturn { factoAnalyser, factoSignes, factoCoteAccepte, factoTailles, factoTexte, factoEstJuste };"
)();

// Une case : [ligne, colonne, type, signe, orientation]. Un côté : [index, type, signe].
let id = 1;
const donnees = ({ cases = [], hauts = [], gauches = [], cible, reste = [] }) => {
  const cells = cases.map(([row, col, type, sign, orientation = "h"]) => ({ id: id++, row, col, type, sign, orientation }));
  const tops = hauts.map(([col, type, sign]) => ({ id: id++, col, type, sign }));
  const lefts = gauches.map(([row, type, sign]) => ({ id: id++, row, type, sign }));
  const v = { x2: 0, x: 0, unit: 0 };
  reste.forEach(([type, sign]) => { v[type] += sign; });
  const R = Math.max(0, ...cells.map((c) => c.row + 1), ...lefts.map((l) => l.row + 1));
  const C = Math.max(0, ...cells.map((c) => c.col + 1), ...tops.map((t) => t.col + 1));
  return { R, C, cells, tops, lefts, cible, resteValeur: v, resteNombre: reste.length };
};
const X2X3 = { x2: 1, x: 3, unit: 2 }; // 𝑥² + 3𝑥 + 2
const RECT_321 = [[0, 0, "x2", 1], [0, 1, "x", 1, "v"], [0, 2, "x", 1, "v"], [1, 0, "x", 1, "h"], [1, 1, "unit", 1], [1, 2, "unit", 1]];

test("l'état suit l'élève : vide, tuiles à ranger, trou, rectangle, côtés, factorisé", () => {
  assert.equal(F.factoAnalyser(donnees({ cible: X2X3, reste: [["x2", 1], ["x", 1]] })).etat, "vide");
  const enCours = F.factoAnalyser(donnees({ cases: RECT_321.slice(0, 4), cible: X2X3, reste: [["unit", 1], ["unit", 1]] }));
  assert.deepEqual(enCours, { etat: "reste", n: 2 });
  assert.equal(F.factoTexte(enCours), "Encore 2 tuiles à ranger.");
  assert.equal(F.factoAnalyser(donnees({ cases: RECT_321.slice(0, 5), cible: X2X3 })).etat, "trou");
  assert.deepEqual(F.factoAnalyser(donnees({ cases: RECT_321, cible: X2X3 })), { etat: "cotes", manque: 5 });
  const juste = F.factoAnalyser(donnees({ cases: RECT_321, cible: X2X3,
    hauts: [[0, "x", 1], [1, "unit", 1], [2, "unit", 1]], gauches: [[0, "x", 1], [1, "unit", 1]] }));
  assert.equal(juste.etat, "juste");
  assert.equal(F.factoTexte(juste), "✓ Factorisé !");
});

test("une paire 𝑥 et −𝑥 laissée de côté ne compte pas comme « à ranger »", () => {
  const e = F.factoAnalyser(donnees({ cases: RECT_321, cible: X2X3, reste: [["x", 1], ["x", -1]] }));
  assert.equal(e.etat, "cotes");
});

test("une tuile qui ne remplit pas sa case est montrée", () => {
  // 𝑥² + 2𝑥 + 1 : le 1 sous 𝑥², et un 𝑥 debout à côté de lui
  const d = donnees({ cases: [[0, 0, "x2", 1], [0, 1, "x", 1, "v"], [1, 0, "unit", 1], [1, 1, "x", 1, "v"]], cible: { x2: 1, x: 2, unit: 1 } });
  const e = F.factoAnalyser(d);
  assert.equal(e.etat, "taille");
  assert.deepEqual(e.mal.sort(), [d.cells[2].id, d.cells[3].id].sort());
});

test("les signes : chaque case = signe de sa ligne × signe de sa colonne", () => {
  // 𝑥² − 1 avec la paire : (𝑥 + 1)(𝑥 − 1)
  const cases = [[0, 0, "x2", 1], [0, 1, "x", -1, "v"], [1, 0, "x", 1, "h"], [1, 1, "unit", -1]];
  const s = F.factoSignes(2, 2, cases.map(([row, col, type, sign]) => ({ row, col, type, sign })), [], []);
  assert.deepEqual(s, { lig: [1, 1], col: [1, -1] }); // la première ligne en +
  // impossible : ++ / −+
  const faux = [[0, 0, 1], [0, 1, 1], [1, 0, -1], [1, 1, 1]].map(([row, col, sign]) => ({ row, col, sign }));
  assert.equal(F.factoSignes(2, 2, faux, [], []), null);
  assert.equal(F.factoAnalyser(donnees({ cases: [[0, 0, "x2", 1], [0, 1, "x", 1, "v"], [1, 0, "x", -1, "h"], [1, 1, "unit", 1]], cible: { x2: 1, x: 0, unit: 1 } })).etat, "signes");
});

test("un rectangle qui ne vaut pas l'expression de départ est dit", () => {
  assert.equal(F.factoAnalyser(donnees({ cases: RECT_321, cible: { x2: 1, x: 3, unit: 3 } })).etat, "valeur");
});

test("un côté est refusé s'il n'a pas la taille de sa colonne, si la place est prise ou si les signes ne vont plus", () => {
  const d = donnees({ cases: RECT_321, cible: X2X3 });
  const ok = (zone, index, type, sign) => F.factoCoteAccepte(d, { zone, index, type, sign });
  assert.equal(ok("top", 0, "x", 1), true);
  assert.equal(ok("top", 0, "unit", 1), false); // colonne de 𝑥² : côté long
  assert.equal(ok("top", 1, "x", 1), false);    // colonne des 𝑥 debout : côté court
  assert.equal(ok("top", 0, "x2", 1), false);   // un côté se fait avec 𝑥 et 1
  assert.equal(ok("top", 3, "unit", 1), false); // colonne « + » vide
  assert.equal(ok("top", 0, "x", -1), true);    // (−𝑥 − 1)(−𝑥 − 2) est juste aussi
  const d2 = donnees({ cases: RECT_321, cible: X2X3, hauts: [[0, "x", -1]] });
  assert.equal(F.factoCoteAccepte(d2, { zone: "top", index: 1, type: "unit", sign: 1 }), false); // signes
  assert.equal(F.factoCoteAccepte(d2, { zone: "top", index: 1, type: "unit", sign: -1 }), true);
  assert.equal(F.factoCoteAccepte(d2, { zone: "top", index: 0, type: "x", sign: -1 }), false); // place prise
});

test("juste mais un côté vaut 1, ou un nombre peut encore sortir : cadre vert et une phrase de plus", () => {
  // 2𝑥 + 4 sur une ligne : 1 × (2𝑥 + 4)
  const uneLigne = F.factoAnalyser(donnees({
    cases: [[0, 0, "x", 1], [0, 1, "x", 1], [0, 2, "unit", 1], [0, 3, "unit", 1], [0, 4, "unit", 1], [0, 5, "unit", 1]],
    hauts: [[0, "x", 1], [1, "x", 1], [2, "unit", 1], [3, "unit", 1], [4, "unit", 1], [5, "unit", 1]], gauches: [[0, "unit", 1]],
    cible: { x2: 0, x: 2, unit: 4 } }));
  assert.equal(uneLigne.etat, "juste-1");
  assert.ok(F.factoEstJuste(uneLigne));
  assert.match(F.factoTexte(uneLigne), /un côté vaut 1/);
  // 2𝑥² + 2𝑥 = 𝑥(2𝑥 + 2)
  const encore = F.factoAnalyser(donnees({
    cases: [[0, 0, "x2", 1], [0, 1, "x2", 1], [0, 2, "x", 1, "v"], [0, 3, "x", 1, "v"]],
    hauts: [[0, "x", 1], [1, "x", 1], [2, "unit", 1], [3, "unit", 1]], gauches: [[0, "x", 1]],
    cible: { x2: 2, x: 2, unit: 0 } }));
  assert.equal(encore.etat, "juste-plus");
  assert.match(F.factoTexte(encore), /encore mettre un nombre en facteur/);
  // 2(𝑥 + 2) : rien de plus
  const deux = F.factoAnalyser(donnees({
    cases: [[0, 0, "x", 1], [0, 1, "unit", 1], [0, 2, "unit", 1], [1, 0, "x", 1], [1, 1, "unit", 1], [1, 2, "unit", 1]],
    hauts: [[0, "x", 1], [1, "unit", 1], [2, "unit", 1]], gauches: [[0, "unit", 1], [1, "unit", 1]], cible: { x2: 0, x: 2, unit: 4 } }));
  assert.equal(deux.etat, "juste");
});

test("le bouton « Factoriser » est dans la colonne, sous « Tableau produit » ; le produit dans une somme reste refusé", () => {
  const i = page.indexOf('title="Ajouter un tableau produit">Tableau produit</button>');
  const j = page.indexOf('id="btn-factoriser" onclick="app.lancerFactoriser()"');
  assert.ok(i > 0 && j > i && j - i < 400, "« Factoriser » juste sous « Tableau produit »");
  assert.match(page, /Un produit se tape seul, par exemple 2\(𝑥 \+ 1\) ou \(𝑥 \+ 1\)\(𝑥 − 2\)\./);
  const lancer = methode("lancerFactoriser() {");
  for (const m of ["Pose ou tape d’abord une expression.", "Retourne d’abord la parenthèse", "Un tableau est déjà ouvert"]) assert.ok(lancer.includes(m), m);
  assert.match(lancer, /this\.saveState\(\);/);
});

test("↶ annule chaque geste du mode Factoriser, et un geste refusé ne laisse pas de pas vide", () => {
  assert.match(methode("saveState() {"), /mode: this\.productFrame\.mode, cible:/);
  assert.match(methode("handleDragStart(e) {"), /if \(this\.productFrame\?\.mode === 'facto'\) this\.saveState\(\);/);
  assert.match(methode("factoPoser(t) {"), /this\.history\.pop\(\);/);
});

test("enlever un côté laisse les tuiles du rectangle ; un côté reste sur SA colonne", () => {
  assert.match(methode("deleteToken(token, save = true) {"), /if \(!ids\.has\(t\.id\) \|\| facto\) return;/);
  assert.match(methode("reindexProductHeaders(zone) {"), /mode === 'facto'\) \{ this\.factoTasser\(\); return; \}/);
});

test("l'équation : départ = produit, « … » tant qu'un côté n'est pas fini, carré quand les deux côtés sont égaux", () => {
  const l = methode("factoLatex() {");
  assert.match(l, /\$\{cible\}\\\\;=\\\\;\$\{produit\}/);
  assert.match(l, /fini\(l, n\) \? '' :/);
  assert.match(l, /lg === lh\) produit = `\(\$\{lg\}\)\^2`/);
});

test("l'équation trop longue rapetisse pour tenir dans sa boîte (13 px au moins), d'un coup", () => {
  assert.match(methode("ajusterEquation() {"), /Math\.max\(13,/);
  assert.match(methode("updateEquation() {"), /this\.ajusterEquation\(\);/);
  assert.match(page, /#equation-display \{ font-size: clamp\(20px, 2\.4vw, 46px\); transition-property: opacity; \}/);
});

test("le tableau à factoriser tient dans son cadre (bord de 3 px compté)", () => {
  assert.match(methode("factoMetrics(frame) {"), /Math\.max\(300, gridW \+ 2 \* bord\)/);
});
