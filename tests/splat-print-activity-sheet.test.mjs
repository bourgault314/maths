import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const classic = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const equations = await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8");
const petit = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");

test("les deux outils proposent un titre imprime et le conservent dans le lien partage", () => {
  for(const html of [classic, equations]){
    assert.match(html, /id="printActivityTitle"/);
    assert.match(html, /params\.has\("title"\)/);
    assert.match(html, /params\.set\("title", printTitle\.slice\(0, 160\)\)/);
  }
});

test("les titres de bandeau distinguent les deux outils", () => {
  assert.match(classic, /title\.textContent = "Splat!"/);
  assert.match(equations, /title\.textContent = "Splat! Équations"/);
  for(const html of [classic, equations]){
    assert.match(html, /customTitle \? `\$\{customTitle\} — Correction` : "Correction"/);
  }
});

test("les consignes de page emploient un vocabulaire adapte aux familles", () => {
  assert.match(classic, /Trouve le nombre de jetons cachés sous chaque tache en modélisant la situation par une équation puis en la résolvant/);
  assert.match(classic, /Trouve la valeur cachée sous chaque tache en modélisant la situation par une équation puis en la résolvant/);
  assert.match(classic, /Utilise les indices pour déterminer la valeur cachée/);
  assert.match(equations, /Trouve le nombre de jetons cachés sous chaque tache en modélisant la situation par une équation puis en la résolvant/);
  assert.match(equations, /Trouve la valeur cachée sous chaque tache en modélisant la situation par une équation puis en la résolvant/);
});

test("les pages de correction ne repetent pas la consigne", () => {
  assert.match(classic, /if\(mode !== "correction"\) sheet\.appendChild\(createClassicPrintInstruction\(slotCards\)\)/);
  assert.match(equations, /if\(mode !== "correction"\) sheet\.appendChild\(createEquationPrintInstruction\(slotCards\)\)/);
  assert.match(petit, /if \(!isCorrectionPage\) \{[\s\S]*instruction\.innerHTML = getInstructionHtml\(\)/);
});

test("la regle commune est portee par la page et non repetee dans les cartes imprimees", () => {
  assert.match(classic, /Lorsque plusieurs taches apparaissent, elles cachent le même nombre de jetons/);
  assert.match(equations, /Lorsque plusieurs taches apparaissent, elles cachent le même nombre de jetons/);
  assert.match(petit, /Lorsque plusieurs taches apparaissent, elles cachent le même nombre de jetons/);

  const classicPrint = classic.slice(classic.indexOf("function renderCardIntoSvg("), classic.indexOf("function classicPrintTaskCount("));
  assert.doesNotMatch(classicPrint, /Sous chaque tache/);

  const equationPrint = equations.slice(equations.indexOf("function renderCardEquationPrint("), equations.indexOf("function renderCardIntoSvg("));
  assert.doesNotMatch(equationPrint, /Sous chaque tache/);
});

test("les formats equations ont une hauteur de page explicite en portrait et paysage", () => {
  assert.match(equations, /height:calc\(297mm - 16mm\)/);
  assert.match(equations, /\.printArea\.print-2up \.sheet\{height:calc\(210mm - 16mm\)/);
  assert.match(equations, /\.pCard svg\{width:100%;height:100%/);
});
