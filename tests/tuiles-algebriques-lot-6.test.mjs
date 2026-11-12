import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Tuiles algébriques — lot 6 (06/11/2026) : fignolage.
// 1) Le tableau produit « développer » dépassait de son cadre (6 px à droite et en bas) : le bord de 3 px
//    du cadre (box-sizing: border-box) n'était pas compté. Dans les deux tableaux, les tuiles étaient aussi
//    posées 3 px trop à gauche et trop haut par rapport à leur case. Tout part maintenant du bord intérieur.
// 2) Le catalogue dit qu'on peut taper une expression, la développer et la factoriser.
// Mesures au navigateur (0 px de dépassement, tuiles centrées) : preuves du lot.
const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const page = lire("outils/tuiles_algebriques/tuiles_algebriques.html");
const methode = (debut) => {
  const i = page.indexOf(`\n            ${debut}`);
  assert.notEqual(i, -1, `méthode introuvable : ${debut}`);
  const fin = page.indexOf("\n            }\n", i);
  return page.slice(i, fin + 14);
};

test("le bord des tableaux est une seule constante, égale au bord dessiné par la feuille de style", () => {
  assert.match(page, /const PRODUCT_FRAME_BORDER = 3;/);
  const css = page.slice(page.indexOf(".product-frame {"), page.indexOf(".product-toolbar {"));
  assert.match(css, /border: 3px solid/);
  assert.match(css, /box-sizing: border-box;/);
});

test("tableau produit : le cadre compte son bord, la grille garde sa taille", () => {
  const m = methode("getProductMetrics(frame = this.productFrame) {");
  assert.match(m, /const width = gridW \+ 2 \* bord;/);
  assert.match(m, /const height = toolbarH \+ gridH \+ 2 \* bord;/);
  const r = methode("renderProductFrame() {");
  assert.match(r, /grid\.style\.width = m\.gridW \+ 'px';/);
  assert.match(r, /grid\.style\.height = m\.gridH \+ 'px';/);
  assert.doesNotMatch(r, /grid\.style\.width = m\.width/);
});

test("les deux tableaux placent les tuiles depuis le bord intérieur du cadre", () => {
  for (const nom of ["getProductMetrics(frame = this.productFrame) {", "factoMetrics(frame) {"]) {
    const m = methode(nom);
    assert.match(m, /const ox = \(frame\?\.x \|\| 0\) \+ bord, oy = \(frame\?\.y \|\| 0\) \+ bord;/, nom);
    assert.match(m, /const colX = \(c\) => ox \+ leftW/, nom);
    assert.match(m, /const rowY = \(r\) => oy \+ toolbarH \+ topH/, nom);
    assert.match(m, /centralX: ox \+ leftW,/, nom);
  }
  assert.match(methode("factoMetrics(frame) {"), /Math\.max\(300, gridW \+ 2 \* bord\)/);
});

test("plus aucun calcul de place depuis le bord extérieur du cadre (f.x / f.y)", () => {
  assert.doesNotMatch(page, /f\.x \+ m\.leftW/);
  assert.doesNotMatch(page, /f\.y \+ m\.toolbarH/);
  assert.doesNotMatch(page, /f\.x \+ \(m\.leftW/);
  const z = methode("getProductZoneInfo(t) {");
  assert.match(z, /const leftStartX = m\.ox;/);
  assert.match(z, /const topStartY = m\.oy \+ m\.toolbarH;/);
});

test("le catalogue annonce qu'on peut taper, développer et factoriser", () => {
  const cat = lire("assets/js/catalogue-refonte-data.js");
  assert.match(cat, /"cardDescription": "Taper ou composer une expression avec les tuiles x², x et 1, puis la réduire, la développer ou la factoriser\."/);
  assert.match(cat, /"description": "Tapez ou composez une expression avec les tuiles x², x et 1, puis réduisez-la, développez-la ou factorisez-la\."/);
  assert.doesNotMatch(cat, /Composez, ordonnez et simplifiez des expressions/);
  assert.match(page, /<meta name="description" content="Tapez ou composez une expression[^"]*factorisez-la\.">/);
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=papiers-imprimer-20261112-1/);
});

// Audit des générateurs (choix de Gwenaël du 06/11/2026, questions à choix) : vert/rouge en tête et par défaut,
// le 𝑥 rond de l'appli (police SplatLettres) partout, tuiles à coins droits (déjà le cas, gardé).
const gTuiles = lire("outils/tuiles_algebriques/generateur_tuiles.html");
const gExos = lire("outils/tuiles_algebriques/generateur_exercices_calcul_litteral.html");
const policeX = /@font-face\{font-family:SplatLettres;src:url\('\/assets\/fonts\/SplatLettres-BoldItalic\.woff2'\)[^}]*unicode-range:U\+1D434-1D467,U\+210E\}/;

test("générateurs : vert / rouge est la première couleur et celle de l'ouverture", () => {
  assert.match(gTuiles, /<select id="colorMode"><option value="sign" selected>vert rouge<\/option><option value="blueyellow">bleu jaune<\/option>/);
  assert.match(gExos, /<select id="colorMode" class="control-select"><option value="sign" selected>Vert \/ rouge/);
  assert.doesNotMatch(gTuiles, /value="blueyellow" selected/);
  assert.doesNotMatch(gExos, /value="blueyellow" selected/);
  // les mêmes vert et rouge que l'appli
  assert.match(gTuiles, /--pos:#72c475; --neg:#ef3f35;/);
  assert.match(gExos, /--x:#72c475;[^;]*;[^;]*--neg:#ef3f35;/);
});

test("générateur de tuiles : le 𝑥 de l'appli sur les tuiles, plus de x dessiné", () => {
  assert.match(gTuiles, policeX);
  assert.match(gTuiles, /const base=isX \? '<span class="lettre-x">𝑥<\/span>'/);
  assert.match(gTuiles, /\.lettre-x\{font-family:SplatLettres,/);
  assert.doesNotMatch(gTuiles, /roundedXGlyph|x-glyph/);
  assert.match(gTuiles, /<span>Carrés 𝑥²<\/span>/);
  assert.match(gTuiles, /<span>Bandes 𝑥<\/span>/);
  assert.match(gTuiles, /const l=shownLetter\(\);/);
  assert.match(gTuiles, /html,body\{margin:0;min-height:100%;font-family:SplatLettres,/);
});

test("générateur d'exercices : le 𝑥 de l'appli sur la feuille et dans les boutons du menu", () => {
  assert.match(gExos, policeX);
  assert.match(gExos, /\.math-x,\.tile-label,\.term-block\{font-family:SplatLettres,"Cambria Math"/);
  assert.match(gExos, /\.seg-btn\{font-family:SplatLettres,Arial,sans-serif\}/);
  assert.match(gExos, /const label=xRond\(segmentLabel\(/);
  assert.match(gExos, /return opt\?xRond\(segmentLabel\(/);
  // la lettre seule devient 𝑥, pas le x de « Mixte »
  const corps = gExos.match(/function xRond\(text\)\{return ([^}]*)\}/)[1];
  const xRond = new Function("text", `return ${corps}`);
  assert.equal(xRond("−x / a − x"), "−𝑥 / a − 𝑥");
  assert.equal(xRond("Avec x²"), "Avec 𝑥²");
  assert.equal(xRond("Mixte complet"), "Mixte complet");
  assert.equal(xRond("a(x ± b)"), "a(𝑥 ± b)");
});

test("générateurs : on attend la police du 𝑥 avant d'imprimer", () => {
  assert.match(gTuiles, /document\.fonts\.ready\.then\(\(\)=>setTimeout\(\(\)=>window\.print\(\), 80\)\)/);
  assert.match(gExos, /document\.fonts\.ready\.then\(\(\)=>setTimeout\(\(\)=>window\.print\(\),80\)\)/);
});

test("générateurs : tuiles à coins droits", () => {
  assert.doesNotMatch(gTuiles.match(/\.tile\{[^}]*\}/)[0], /border-radius/);
  assert.match(gExos, /\.tile\{display:grid;place-items:center;border:0!important;border-radius:0!important;/);
  assert.match(gExos, /<rect x="1" y="1" width="98" height="98" rx="0"/);
});

test("catalogue : miniatures des générateurs refaites (vert / rouge, 𝑥 rond) et leur ?v= suit", () => {
  const cat = lire("assets/js/catalogue-refonte-data.js");
  assert.match(cat, /tuiles-algebriques\/generateur-exercices\.png\?v=2/);
  assert.match(cat, /tuiles-algebriques\/tuiles-decouper\.png\?v=2/);
});

test("appli : le tableau « développer » suit les coins arrondis de son cadre, et le 𝑥 de l'interface est rond", () => {
  assert.match(page, /\.product-frame:not\(\.facto\) > \.product-grid \{ border-radius: 0 0 9px 9px; overflow: hidden; \}/);
  assert.match(page, /body \{\n[^}]*font-family: SplatLettres, 'Fredoka', sans-serif;/);
});
