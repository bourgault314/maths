import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

/* ÉquaSplat, 15/10/2026 (essai de Gwenaël sur sa Surface tactile, choix par questions) :
   - Décomposer accepte « −3 + −6 » (refusé avec un message faux), refuse « + 0 », et son
     exemple d'aide s'écrit comme Regrouper ;
   - Regrouper et le glisser écrivent la somme avec des parenthèses : « 9 + (−7) = ? » ;
   - un seul mot, « Regrouper » : glisser un jeton sur un autre ouvre une fenêtre « Regrouper »
     (plus de « Fusionner », ni dans l'outil, ni sur la carte des mondes, ni dans le film) ;
   - « Ajouter des deux côtés » : jeton à gauche, taches à droite sur écran large, onglets au
     téléphone, nombre de taches choisi avec − / + (la case « 1 » donnait « 12 ») ;
   - écran tactile large : le pavé à droite de la case dans les autres fenêtres ;
   - −𝑥 −𝑥 = −8 −8 (partage avant l'opposé) : « Prends l'opposé pour trouver 𝑥. » ;
   - équation résolue : la phrase du milieu s'efface. */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");
const univers = await readFile(new URL("../outils/splat_univers.html", import.meta.url), "utf8");

function source(nom){
  const debut = html.indexOf(`  function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}

const ctx = vm.createContext({});
vm.runInContext(`
  ${source("formatSignedNumber")}
  ${source("formatFusionTerm")}
  ${source("formatSumOfTerms")}
  ${source("parseSum")}
  globalThis.api = { parseSum, formatSumOfTerms };`, ctx);
const { parseSum, formatSumOfTerms } = ctx.api;

test("Décomposer : chaque terme peut porter son signe (« −3 + −6 », « −3 − 6 », « −3 + (−6) »)", () => {
  const lire = t => JSON.parse(JSON.stringify(parseSum(t)));
  assert.deepEqual(lire("-3+-6"), [-3, -6]);
  assert.deepEqual(lire("−3 + −6"), [-3, -6]);
  assert.deepEqual(lire("-3-6"), [-3, -6]);
  assert.deepEqual(lire("-3+(-6)"), [-3, -6]);
  assert.deepEqual(lire("(−3) + (−6)"), [-3, -6]);
  assert.deepEqual(lire("12-3+-4"), [12, -3, -4]);
  assert.deepEqual(lire("4+5"), [4, 5]);
  assert.deepEqual(lire("−3 − −6"), [-3, 6], "−3 − (−6) : les jetons −3 et 6");
  for(const faux of ["", "3+", "+-3", "3(+4)", "3+(-4", "a+1", "3 4"]){
    if(faux === "3 4") assert.deepEqual(lire(faux), [34], "les espaces sont ignorés, comme avant");
    else assert.equal(parseSum(faux), null, faux);
  }
});

test("Décomposer : pas de jeton 0, l'exemple d'aide est une somme que l'outil accepte", () => {
  const fenetre = source("applyDecomposeInput");
  assert.match(fenetre, /if\(values\.some\(v => v === 0\)\)\{/);
  assert.match(fenetre, /par exemple <strong>\$\{formatSumOfTerms\(exemple\)\}<\/strong>/);
  assert.match(fenetre, /La somme doit faire <strong>\$\{formatSignedNumber\(piece\.value\)\}<\/strong>/);
  // l'exemple proposé pour −9 (« −4 + (−5) ») passe bien la lecture
  assert.equal(formatSumOfTerms([-4, -5]), "−4 + (−5)");
  assert.deepEqual(JSON.parse(JSON.stringify(parseSum("−4 + (−5)"))), [-4, -5]);
  // toujours pas de nombre négatif en Splat positif
  assert.match(fenetre, /if\(!isRelativeUniverse\(\) && values\.some\(v => v < 0\)\)\{/);
});

test("Regrouper et le glisser écrivent la somme de la même façon, avec des parenthèses", () => {
  assert.equal(formatSumOfTerms([9, -7]), "9 + (−7)");
  assert.equal(formatSumOfTerms([-13, 13]), "−13 + 13");
  assert.equal(formatSumOfTerms([12, 9]), "12 + 9");
  assert.match(source("openGroupDialog"), /groupDialogText\.innerHTML = `\$\{formatSumOfTerms\(info\.selected\.map\(x => x\.piece\.value\)\)\} = \?`;/);
  assert.match(source("openFusionDialog"), /fusionDialogText\.innerHTML = `\$\{formatSumOfTerms\(\[a, b\]\)\} = \?`;/);
});

test("un seul mot : la fenêtre du glisser s'appelle « Regrouper », plus aucun « Fusionner » à l'écran", () => {
  assert.match(html, /<dialog id="fusionDialog">\s*<div class="dialogInner">\s*<h2 class="dialogTitle">Regrouper<\/h2>/);
  assert.match(html, /<label id="fusionLabel" for="fusionInput">Somme des deux jetons<\/label>/);
  assert.match(html, /<button class="green" id="btnApplyFusion" type="button">Regrouper<\/button>/);
  assert.doesNotMatch(html, /#fusionDialog \.dialogTitle\{\s*display:none;/, "le titre se voit, comme dans Regrouper");
  assert.doesNotMatch(html, /["'>`]Fusionner|fusionnés/);
  assert.match(source("applyFusion"), /Jetons regroupés : <strong>/);
  assert.match(univers, /enlève, regroupe, partage/);
  assert.doesNotMatch(univers, /fusionne/);
});

test("Ajouter : le nombre de taches se choisit avec − et +, sans case à taper", () => {
  assert.doesNotMatch(html, /addBothXCount/);
  for(const id of ["btnAddBothXLess", "btnAddBothXMore", "addBothXPreview", "btnApplyAddBothX", "btnAddBothTabToken", "btnAddBothTabX"]){
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
  assert.match(html, /const ADD_BOTH_X_MAX = 8;/);
  const appliquer = source("applyAddBothX");
  assert.match(appliquer, /const sign = addBothX\.sign < 0 \? -1 : 1;/);
  assert.match(appliquer, /finishAddBothAction\(makeBothSidesOperation\(formatSignedOperationX\(sign \* count\)\)\);/);
  const rendu = source("renderAddBothX");
  assert.match(rendu, /`Ajouter \$\{addBothX\.count\} taches` : "Ajouter 1 tache"/);
  assert.match(rendu, /btnAddBothXLess\.disabled = addBothX\.count <= 1;/);
  assert.match(rendu, /btnAddBothXMore\.disabled = addBothX\.count >= ADD_BOTH_X_MAX;/);
  const ouvrir = source("openAddBothDialog");
  assert.match(ouvrir, /addBothDialog\.classList\.toggle\("deuxParties", canAddX\);/);
  assert.match(ouvrir, /addBothX = \{sign:1, count:1\};\s*showAddBothTab\("jeton"\);/);
  // côte à côte sur écran large, une partie à la fois au téléphone
  assert.match(html, /@media screen and \(min-width:860px\)\{\s*#addBothDialog\.deuxParties\{/);
  assert.match(html, /#addBothDialog\.deuxParties\[data-onglet="jeton"\] \.addBothXChoices,\s*#addBothDialog\.deuxParties\[data-onglet="taches"\] \.addBothTokenPart\{\s*display:none;/);
  // la petite tache est centrée comme celles du plateau
  assert.match(source("miniSplatSvgHtml"), /splatLettreDecalage\(label\)/);
});

test("écran tactile large : le pavé passe à droite de la case dans les autres fenêtres", () => {
  assert.match(html, /dialog\.touchKeypadActive:not\(#addBothDialog\) \.touchKeypad\.open\{\s*position:absolute;\s*right:38px;\s*top:50%;/);
  assert.match(html, /dialog\.touchKeypadActive:not\(#addBothDialog\) \.dialogInner\{\s*position:relative;\s*padding-right:calc\(300px \+ 70px\);/);
});

test("−𝑥 −𝑥 = −8 −8 : la phrase « Prends l'opposé », seulement dans cette situation", () => {
  const c = vm.createContext({});
  vm.runInContext(`
    let state = null;
    const oppositeXEnabled = () => true;
    const activePieces = side => state[side];
    const xSign = p => (p.sign < 0 ? -1 : 1);
    ${source("oppositeTachesFacingEqualTokens")}
    globalThis.essai = s => { state = s; return oppositeTachesFacingEqualTokens(); };`, c);
  const mX = {type:"x", sign:-1}, X = {type:"x", sign:1}, T = v => ({type:"token", value:v});
  assert.equal(c.essai({left:[mX, mX], right:[T(-8), T(-8)]}), true);
  assert.equal(c.essai({left:[T(5), T(5), T(5)], right:[mX, mX, mX]}), true);
  assert.equal(c.essai({left:[mX, mX], right:[T(-16)]}), false, "avant le partage : rien");
  assert.equal(c.essai({left:[mX], right:[T(5)]}), false, "une seule tache −𝑥 : rien (pas demandé)");
  assert.equal(c.essai({left:[X, X], right:[T(8), T(8)]}), false, "des taches 𝑥 : Conclure, comme avant");
  assert.equal(c.essai({left:[mX, mX], right:[T(-8), T(-7)]}), false);
  assert.match(html, /setInstruction\(`Prends l’opposé pour trouver \$\{v === "\?" \? "la valeur cachée" : escapeHtml\(v\)\}\.`\);/);
});

test("équation résolue : la phrase du milieu s'efface ; solution nulle écrite « 0 = 4𝑥 »", () => {
  assert.match(source("setInstruction"), /: \(eleveEquationResolue\(\) \? "" : \(html \|\| ""\)\);/);
  assert.match(source("currentEquationString"), /if\(info && !\(state && state\.billes\) && Number\(info\.value\) !== 0\) return equationBeforeConclusion\(info\);/);
});

test("Et un pirate ? la lettre du lien est une seule lettre, et la fenêtre Ajouter l'échappe", () => {
  assert.match(html, /const rawVar = typeof payload\.variable === "string" \? payload\.variable\.trim\(\) : "";\s*const wantedVar = \/\^\\p\{L\}\$\/u\.test\(rawVar\) \? rawVar : "𝑥";/);
  const lettre = /^\p{L}$/u;
  for(const ok of ["𝑥", "𝑏", "𝑘", "x", "t"]) assert.ok(lettre.test(ok), ok);
  for(const ko of ["<img src=x onerror=alert(1)>", "xy", "", "1", "𝑥<"]) assert.ok(!lettre.test(ko), ko);
  assert.match(source("miniSplatSvgHtml"), /\$\{escapeHtml\(label\)\}<\/text>/);
});
