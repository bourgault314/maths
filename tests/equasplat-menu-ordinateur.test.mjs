import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Le menu de départ d'ÉquaSplat (main.startMode) est compact par construction
// (patch 4 : carte de 540 px, libellés de 10,5 px). Depuis août 2026, il grandit
// sur ordinateur — un cran à partir de 1024 px de large, un second sur les
// écrans hauts — sans rien changer en dessous de 1024 px : le téléphone garde
// exactement sa composition, qui tenait déjà sur l'écran.
const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

const bloc = (debut, fin) => {
  const i = html.indexOf(debut);
  assert.notEqual(i, -1, `bloc introuvable : ${debut}`);
  const j = html.indexOf(fin, i + debut.length);
  assert.notEqual(j, -1, `fin de bloc introuvable : ${fin}`);
  return html.slice(i, j);
};

const cranOrdinateur = bloc("@media (min-width:1024px){", "@media (min-width:1024px) and (min-height:860px){");
const cranGrandEcran = bloc("@media (min-width:1024px) and (min-height:860px){", "</style>");

test("le menu compact reste la base (téléphone et petits écrans inchangés)", () => {
  assert.match(html, /main\.startMode\{\s*grid-template-columns:minmax\(320px, 520px\) !important;\s*width:min\(540px, calc\(100vw - 24px\)\) !important;/);
  assert.match(html, /main\.startMode \.menuField label\{[^}]*font-size:10\.5px !important;/s);
  assert.match(html, /@media \(max-width:520px\)\{\s*\.menuField\{\s*grid-template-columns:1fr !important;\s*row-gap:4px !important;\s*\}\s*\}/);
  // Aucun des deux crans ne s'applique sous 1024 px.
  assert.ok(!/@media \(min-width:(?!1024px)\d+px\)\{[\s\S]*?main\.startMode\{/.test(html), "un seul seuil d'agrandissement : 1024 px");
});

test("à partir de 1024 px, la carte et ses textes grandissent d’un cran, visible d’un seul tenant", () => {
  assert.match(cranOrdinateur, /main\.startMode\{\s*grid-template-columns:minmax\(320px, 620px\) !important;\s*width:min\(640px, calc\(100vw - 24px\)\) !important;/);
  assert.match(cranOrdinateur, /\.menuField\{\s*width:min\(560px,100%\) !important;\s*grid-template-columns:200px minmax\(0,1fr\) !important;/);
  assert.match(cranOrdinateur, /main\.startMode \.menuField label\{\s*font-size:12px !important;/);
  assert.match(cranOrdinateur, /main\.startMode \.menuField select,\s*main\.startMode \.menuField input\{\s*min-height:36px !important;[^}]*font-size:14\.5px !important;/s);
  assert.match(cranOrdinateur, /\.equationInput\{\s*min-height:44px !important;[^}]*font-size:clamp\(22px,2vw,26px\) !important;/s);
  assert.match(cranOrdinateur, /main\.startMode \.btnrow button,\s*main\.startMode #btnBuild,\s*main\.startMode #btnRandom\{\s*min-height:44px !important;/);
  // Le bouton Aléatoire garde son texte « 🎲 Aléatoire » fourni par ::before :
  // sa taille de police nulle n'est jamais réécrite par le cran.
  assert.ok(!/main\.startMode #btnRandom\{[^}]*font-size/.test(cranOrdinateur), "le cran ne touche pas à la police de #btnRandom");
  assert.match(cranOrdinateur, /main\.startMode #btnRandom::before\{\s*font-size:15\.5px !important;/);
  assert.match(html, /main\.startMode #btnRandom\{\s*font-size:0 !important;\s*\}/);
});

test("sur les écrans hauts, un second cran, toujours sous le même seuil de largeur", () => {
  assert.match(cranGrandEcran, /main\.startMode\{\s*grid-template-columns:minmax\(320px, 700px\) !important;\s*width:min\(720px, calc\(100vw - 24px\)\) !important;/);
  assert.match(cranGrandEcran, /\.menuField\{\s*width:min\(640px,100%\) !important;\s*grid-template-columns:225px minmax\(0,1fr\) !important;/);
  assert.match(cranGrandEcran, /main\.startMode \.menuField label\{\s*font-size:13px !important;/);
  assert.match(cranGrandEcran, /main\.startMode \.menuField select,\s*main\.startMode \.menuField input\{\s*min-height:46px !important;[^}]*font-size:16\.5px !important;/s);
  assert.match(cranGrandEcran, /\.equationInput\{\s*min-height:58px !important;/);
  assert.match(cranGrandEcran, /main\.startMode \.btnrow button,\s*main\.startMode #btnBuild,\s*main\.startMode #btnRandom\{\s*min-height:52px !important;/);
  assert.ok(!/main\.startMode #btnRandom\{[^}]*font-size/.test(cranGrandEcran), "le second cran ne touche pas à la police de #btnRandom");
});

test("les deux crans ne concernent que le menu de départ", () => {
  for (const [nom, cran] of [["ordinateur", cranOrdinateur], ["grand écran", cranGrandEcran]]) {
    assert.ok(!/activeMode|importMode|\.stage|#splatSvg|\.toolBar/.test(cran), `le cran ${nom} ne touche ni la scène, ni la réception`);
  }
});
