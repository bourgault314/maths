import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/* Lot « livrets Enquête + Système » (08/10/2026, décisions de Gwenaël sur la feuille d'essai
   et sur planches avant/après) : le nom de la couleur écrit sur les taches, SUR LE PAPIER
   seulement — version « C » : liseré noir PUR #000000 épais (22 % du corps, joints ronds), mot
   15 % plus gros, jamais plus large que sa tache (1,62 rayon, liseré compris). L'imprimante
   tramait le liseré noir à 80 % par-dessus la trame de la couleur (orange, verte, violette
   illisibles). L'écran, la projection et le mode élève ne changent pas.
   Aussi : le nom dans les cases des barres du Système (pages 2-3, corrigés « avec les
   taches »), et la petite carte des pages 2-3 du Système qui s'élargit dans le blanc laissé
   par le dessin de droite (deuxième tour : taches de 5 mm). */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const splat = lire("outils/splat.html");

function source(nom) {
  const debut = splat.indexOf(`\nfunction ${nom}(`);
  assert.ok(debut > 0, `${nom} introuvable`);
  const fin = splat.indexOf("\n}\n", debut + 1);
  return splat.slice(debut + 1, fin + 3);
}
const NOM_PAPIER = splat.match(/\nconst NOM_PAPIER = (\{[^}]*\});/);

/* exécute drawInvestigateSplatName pour de vrai, avec une largeur de texte simulée (0,62 em par
   lettre, DejaVu Sans Bold en moyenne) ; rend les attributs du <text> écrit */
function ecrit(mot, { r = 100, revealed = false, isPrint = false, fs } = {}) {
  const ecrits = [];
  const code = `
    const NOM_PAPIER = ${NOM_PAPIER[1]};
    const ENQUETE_NOM_ECART = 14;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const sysLargeurTexte = (t, f) => String(t).length * f * 0.62;
    const investigateColorInfo = () => ({});
    const investigateColorWord = () => mot;
    const el = () => ({}), text = () => ({});
    ${source("nomPapierCorps")}
    ${source("nomPapierAttrs")}
    ${source("drawInvestigateSplatName")}
    drawInvestigateSplatName({ appendChild: () => {} }, { cx: 0, cy: 0, r }, 0, {}, revealed,
      { mkEl: () => ({}), mkText: (x, y, t, a) => { ecrits.push(a); return {}; }, isPrint, fs });`;
  new Function("mot", "ecrits", "r", "revealed", "isPrint", "fs", code)(mot, ecrits, r, revealed, isPrint, fs);
  return ecrits[0];
}

test("NOM_PAPIER : la version C de la feuille d'essai (+15 %, liseré 22 %, 1,62 rayon)", () => {
  assert.ok(NOM_PAPIER, "NOM_PAPIER introuvable");
  assert.deepEqual(new Function(`return ${NOM_PAPIER[1]}`)(), { agrandi: 1.15, contour: 0.22, largeur: 1.62 });
});

test("à l'écran (et en projection), rien ne change : blanc, liseré noir à 80 %, 9 % du corps", () => {
  const a = ecrit("verte", { r: 100 });
  assert.equal(a["font-size"], "30");
  assert.equal(a.fill, "#ffffff");
  assert.equal(a.stroke, "rgba(0,0,0,0.80)");
  assert.equal(a["stroke-width"], "3");
  assert.equal(a["stroke-linejoin"], undefined);
});

test("sur le papier : noir pur épais, joints ronds, mot 15 % plus gros", () => {
  const a = ecrit("verte", { r: 100, isPrint: true });
  assert.equal(a["font-size"], "34.5");
  assert.equal(a.fill, "#ffffff");
  assert.equal(a.stroke, "#000000");
  assert.equal(a["stroke-width"], String(Math.round(34.5 * 0.22 * 10) / 10));
  assert.equal(a["stroke-linejoin"], "round");
  assert.equal(a["paint-order"], "stroke fill");
});

test("sur le papier, un mot long ne déborde pas de sa tache (« violette »)", () => {
  const a = ecrit("violette", { r: 100, isPrint: true, fs: 36 });
  const f = Number(a["font-size"]);
  assert.ok(f < 36 * 1.15, "« violette » ne grossit pas jusqu'à +15 %");
  assert.ok(8 * f * 0.62 + f * 0.22 <= 162 + 1e-9, `largeur ${8 * f * 0.62 + f * 0.22} > 1,62 rayon`);
  assert.equal(a.stroke, "#000000");
});

test("tache dévoilée (corrigé) : le mot noir au-dessus du jeton ne change pas, même sur le papier", () => {
  const a = ecrit("orange", { r: 100, isPrint: true, revealed: true });
  assert.equal(a.fill, "rgba(0,0,0,0.92)");
  assert.equal(a.stroke, "rgba(255,255,255,0.85)");
  assert.equal(a["font-size"], "30");
});

test("le Système passe isPrint au nom de ses taches, et ses cases de barres imprimées aussi", () => {
  assert.match(source("drawSysPlateaux"), /drawInvestigateSplatName\(gp, s, 0, nomCarte, devoile, \{ mkEl, mkText, isPrint, fs:/);
  const caseBarre = source("drawSysCaseBarre");
  assert.match(caseBarre, /const fs = isPrint \? nomPapierCorps\(mot, fs0, r\) : fs0;/);
  assert.match(caseBarre, /isPrint \? nomPapierAttrs\(fs\) : \{\}/);
  // l'Enquête imprimée passait déjà isPrint:true (renderCardIntoSvg)
  assert.equal((splat.match(/drawInvestigateSplatName\(targetSvg, \{\.\.\.s, cy:s\.cy \+ printOffsetY\}, idx, card, revealAnswers, \{ mkEl:tEl, mkText:tText, isPrint:true \}\)/g) || []).length, 2);
});

test("Système, pages 2-3 : la petite carte s'élargit dans le blanc, sans rapetisser le dessin de droite", () => {
  const render = lire("_sources/livret-splat-systeme/render.py");
  assert.match(render, /^ELARGIR_CARTE = 34$/m);
  assert.equal((render.match(/, elargir=ELARGIR_CARTE\)/g) || []).length, 2, "pages 2 et 3 (« À toi »)");
  assert.match(render, /if \(Math\.abs\(dessin\.getBoundingClientRect\(\)\.width - avant\) > 0\.5\) gauche\.style\.flex = '';/);
  // l'élargissement passe AVANT le contrôle « la page déborde sur le pied »
  assert.ok(render.indexOf("const plus = Math.min(d.elargir * mm") < render.indexOf("la page déborde sur le pied"));
});
