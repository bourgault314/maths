// Lot 5b « aides et carte » (08/11/2026, choix de Gwenaël : « A, deux boutons », « Les étapes ») :
// au monde 4, « Bonus » était enfoncé à l'arrivée, ses fiches montrées, impossible à refermer —
// le monde n'a pas de parties, et la carte ouvre toujours une partie. Désormais : « Les étapes ⭐ x / 4 »
// (plein à l'arrivée) puis « Bonus ✨ x / 4 » en pointillés, comme les mondes 3 et 6.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const univers = readFileSync(new URL("../outils/splat_univers.html", import.meta.url), "utf8");
function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin, a + 1);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(
  bloc("const PS=", "const PROF =") +
  bloc("function partieNum(", "function voletProfHtml(") +
  bloc("/* ============ vue élève : les parties en boutons", "const main=document.getElementById(\"univers\");") +
  ";globalThis.X={MONDES,MONDE_ENQUETE,MONDE_SYSTEME,partiesHtml,etapesSeules,NOM_ETAPES};", ctx);
const { MONDES, MONDE_ENQUETE, MONDE_SYSTEME, partiesHtml, etapesSeules, NOM_ETAPES } = ctx.X;

test("seul le monde 4 a la partie « Les étapes » (un monde sans partie, avec un Bonus)", () => {
  assert.equal(NOM_ETAPES, "Les étapes");
  assert.deepEqual(JSON.parse(JSON.stringify(MONDES.map((m) => etapesSeules(m)))), [false, false, false, true, false, false]);
  const h = partiesHtml(MONDE_SYSTEME, 3);
  // le bouton des étapes d'abord, plein (pas de pointillés), puis le Bonus en pointillés
  assert.ok(h.indexOf('class="partieBtn" data-volet="etapes"') > 0, "bouton des étapes, sans classe de pointillés");
  assert.ok(h.indexOf('data-volet="etapes"') < h.indexOf('data-volet="bonus"'), "Les étapes avant le Bonus");
  assert.ok(h.includes('class="partieBtn bonus" data-volet="bonus"'));
  // les autres mondes ne changent pas
  assert.ok(!partiesHtml(MONDE_ENQUETE, 2).includes('data-volet="etapes"'));
});

test("ses étapes portent la partie « etapes », derrière un titre caché qui vient AVANT elles (ouvert par défaut)", () => {
  assert.match(univers, /const clePartie=partie>=0\?partieCle\(m\.volets\[partie\],partie\):etapesSeules\(m\)\?'etapes':null;/);
  // la « partie » sans titre précède la première étape : c'est volets[0] dans ouvrirParties (ouverte quand tout est gagné)
  assert.match(univers, /const sansTitre=etapesSeules\(m\)&&ei===0\?'<li class="volet ferme sansTitre" id="'\+m\.idp\+'-etapes" data-volet="etapes"><\/li>':'';\s*return sansTitre\+volet\+'<li class="etape/);
  // jamais montrée, même ouverte : le bouton suffit
  assert.match(univers, /main>\.monde>\.etapes>\.volet\.sansTitre\{display:none\}/);
  // ouvrirParties ne change pas : l'adresse, puis le Bonus retenu, puis la partie en cours, sinon la première
  assert.match(univers, /const ouverte=vise\|\|\(bonus&&bonusRetenu\(bonusDeSection\(sec\)\)\?bonus:null\)\|\|\[\.\.\.volets\]\.find\(v=>v\.dataset\.volet===enCours\)\|\|volets\[0\];/);
});

test("ses étoiles : celles du monde, sur le bouton", () => {
  assert.match(univers, /const se=document\.getElementById\("stars"\+mi\+"-etapes"\);\s*if\(se\) se\.textContent="⭐ "\+f\+" \/ "\+m\.etapes\.length;/);
});
