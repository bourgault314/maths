/* SPLAT! Enquête — ② part du même bord que les barres de ① (03/10/2026, choisi par Gwenaël sur
   planche : « papier et écran, pas le téléphone »).
   Les fonctions de outils/splat.html sont exécutées telles quelles (extraites du fichier), avec une
   mesure de texte fixe (longueur × taille × 0,6) pour que le test ne dépende d'aucune police.
   1. Papier et écran : ② commence là où commencent les barres de ① (lineX = barX), le schéma
      garde UNE échelle pour ① et ②.
   2. Téléphone (portrait) : ② part du bord du cadre, comme avant.
   3. Une carte où un nom de couleur qui tenait dans sa case n'y tiendrait plus (il passerait à
      son initiale) garde ② au bord du cadre : la règle « aucun mot réduit à son initiale » tient.
   4. Les deux dessins de ② (le corrigé et le pas à pas) prennent lineX de la mise en page. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function bloc(debut, fin){
  const start = html.indexOf(debut);
  assert.notEqual(start, -1, `${debut} introuvable`);
  return html.slice(start, html.indexOf(fin, start) + fin.length);
}
function ligne(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}

const mise = new Function(`
  const enqueteTexteLargeur = (t, fs) => String(t).length * fs * 0.6;
  const formatRelationNumber = (v) => String(v);
  ${ligne("const ENQ_LIGNE_ALIGNEE = ")}
  ${bloc("const ENQ_PROFIL_IMPRIME = {", "};")}
  ${ligne("const ENQ_PROFIL_ECRAN = ")}
  ${ligne("const ENQ_PROFIL_TEL = ")}
  ${fn("enqueteProfil")}
  ${fn("enqueteLargeursCases")}
  ${fn("enqueteEchelle")}
  ${fn("enqueteMotsTiennent")}
  ${fn("enqueteMiseEnPage")}
  return { enqueteMiseEnPage, enqueteProfil };
`)();

const tache = (v, de) => ({ kind:"tache", v, de });
/* trois barres écrites en bleues (une, k1, k2 bleues), comme la fiche 18, carte 1 (bleue 6, noire 18 =
   3 bleues, verte 36 = 6 bleues) : seul le nombre de cases compte, l'échelle suit la valeur */
function modele(k1, k2, v = 6){
  const b = () => tache(v, 0);
  const rows = [
    { label:"bleue", cells:[b()], sous:[] },
    { label:"noire", cells:Array.from({ length:k1 }, b), sous:[] },
    { label:"verte", cells:Array.from({ length:k2 }, b), sous:[] }
  ];
  const total = (1 + k1 + k2) * v;
  return { rows, accolade:total, ligne:{ total, groupes:rows.map((r) => ({ cells:r.cells, label:r.label })) },
    texteCellule:() => "bleue", motCellule:() => "bleue" };
}
const P = (o) => mise.enqueteProfil(o);

test("papier et écran : ② part du même bord que les barres de ①, une seule échelle", () => {
  for(const o of [{ isPrint:true }, {}]){
    const M = mise.enqueteMiseEnPage(modele(1, 2), P(o));
    assert.equal(M.lineX, M.barX, "② commence sous les barres, pas sous les noms");
    assert.equal(M.s, M.sLigne, "① et ② à la même échelle");
    assert.ok(Math.abs(M.lineX + M.lineW + P(o).ligneBord / 2 - (M.x0 + M.largeur)) < 1e-9, "② va jusqu'au bord droit du cadre");
  }
});

test("téléphone : ② part du bord du cadre, comme avant", () => {
  const Pt = P({ portrait:true });
  const M = mise.enqueteMiseEnPage(modele(1, 2), Pt);
  assert.equal(M.lineX, M.x0 + Pt.ligneBord / 2);
  assert.notEqual(M.lineX, M.barX);
});

test("un nom qui tenait et ne tiendrait plus : ② reste au bord du cadre (pas d'initiale)", () => {
  const Pi = P({ isPrint:true });
  /* 1 + 3 + 6 bleues (la fiche 18, carte 1) : « bleue » tient dans sa case avec ② au bord, plus avec ② aligné */
  const M = mise.enqueteMiseEnPage(modele(3, 6), Pi);
  assert.equal(M.lineX, M.x0 + Pi.ligneBord / 2, "la carte garde ② au bord du cadre");
  const libre = 6 * M.s - 2 * Pi.cellPad;
  assert.ok("bleue".length * Pi.wordMin * 0.6 <= libre, "« bleue » tient en entier");
});

test("si le mot ne tenait déjà pas, l'alignement ne coûte rien : ② s'aligne", () => {
  const M = mise.enqueteMiseEnPage(modele(4, 12), P({ isPrint:true }));
  assert.equal(M.lineX, M.barX);
});

test("les deux dessins de ② (corrigé, pas à pas) prennent lineX de la mise en page", () => {
  assert.match(fn("drawEnqueteLigne"), /const lineX = M\.lineX;/);
  assert.match(fn("enqueteG3DessinerLigne"), /const bord = P\.ligneBord, lineX = M\.lineX;/);
  assert.doesNotMatch(fn("drawEnqueteLigne") + fn("enqueteG3DessinerLigne"), /lineX = x0 \+ bord \/ 2/);
});
