/* Relecture du monde 5 (27/09/2026) — la lettre ronde dans l'outil des Équations et dans ÉquaSplat.
   - SplatLettres (la lettre ronde des livrets, déjà dans splat.html depuis le 26/09) est déclarée
     dans outils/splat_equations.html et outils/equasplat.html, pour les lettres mathématiques
     SEULEMENT (unicode-range), en tête de chaque liste de polices qui peut afficher une lettre ;
   - deux dessins du même rond : fin (graisse ≤ 599), gras (≥ 600, SplatLettres-BoldItalic) ;
   - ÉquaSplat l'agrandit de 20 % (la taille des livrets du monde 5) ; l'outil garde sa taille ;
   - dans ÉquaSplat, la lettre d'une tache fait 0,8 × le rayon de la tache, centrée sur son encre.
   Décisions de Gwenaël par questions à choix, 27/09/2026. */
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL("../" + p, import.meta.url));
const outil = lire("outils/splat_equations.html");
const equa = lire("outils/equasplat.html");
const PLAGE = "unicode-range:U+1D434-1D467,U+210E}";

function faces(src){ return src.match(/@font-face\{font-family:SplatLettres;[^}]*\}/g) || []; }

test("la police grasse existe, fabriquée comme la fine", () => {
  for (const f of ["SplatLettres-Italic.woff2", "SplatLettres-BoldItalic.woff2"]) {
    assert.ok(existe("assets/fonts/" + f), f);
    const o = statSync(new URL("../assets/fonts/" + f, import.meta.url)).size;
    assert.ok(o > 4000 && o < 20000, `${f} : ${o} octets, 52 lettres seulement`);
  }
  const fab = lire("_sources/polices/splat-lettres/fabrique.py");
  assert.match(fab, /\("KaTeX_Math-Italic\.woff2", "SplatLettres-Italic\.woff2", "Italic"/);
  assert.match(fab, /\("KaTeX_Math-BoldItalic\.woff2", "SplatLettres-BoldItalic\.woff2", "BoldItalic"/);
  assert.match(fab, /recalcTimestamp=False/, "le même fichier à chaque fabrication");
});

test("les deux pages déclarent quatre @font-face : fin jusqu'à 599, gras au-delà, droite et italique", () => {
  for (const [nom, src] of [["splat_equations", outil], ["equasplat", equa]]) {
    const f = faces(src);
    assert.equal(f.length, 4, `${nom} : 4 déclarations`);
    for (const style of ["normal", "italic"]) {
      assert.ok(f.some(x => x.includes("SplatLettres-Italic.woff2") && x.includes(`font-style:${style};font-weight:100 599;`)), `${nom} : fine ${style}`);
      assert.ok(f.some(x => x.includes("SplatLettres-BoldItalic.woff2") && x.includes(`font-style:${style};font-weight:600 900;`)), `${nom} : grasse ${style}`);
    }
    for (const x of f) {
      assert.ok(x.endsWith(PLAGE), `${nom} : lettres mathématiques seulement`);
      assert.match(x, /font-display:block;/);
    }
  }
  // ÉquaSplat : +20 % (la taille des livrets du monde 5) ; l'outil : sa taille
  for (const x of faces(equa)) assert.match(x, /size-adjust:120%;/);
  for (const x of faces(outil)) assert.doesNotMatch(x, /size-adjust/);
});

test("l'outil des Équations : SplatLettres en tête de chaque police qui peut dessiner une lettre", () => {
  assert.match(outil, /\*\{box-sizing:border-box;font-family:SplatLettres,system-ui,-apple-system,Segoe UI,Roboto,Arial;\}/);
  assert.match(outil, /line-height:1;\n    font-family:SplatLettres,system-ui,-apple-system,Segoe UI,Roboto,Arial;/, "le bouton 𝑥 / ?");
  // plus aucune liste Times sans SplatLettres devant (lignes d'équation, schémas, flèches, lettre
  // des taches du livret 2 des relatifs), quelles que soient les guillemets
  const listesTimes = [...outil.matchAll(/["']?Times New Roman["']?, Times, serif/g)].map(m => outil.slice(Math.max(0, m.index - 14), m.index));
  assert.ok(listesTimes.length >= 11, `${listesTimes.length} listes Times`);
  for (const avant of listesTimes) assert.match(avant, /SplatLettres, $/, `liste Times sans SplatLettres : « …${avant} »`);
  assert.equal((outil.match(/"SplatLettres, 'Times New Roman', Times, serif"/g) || []).length, 10);
  // la lettre des taches imprimées (livret 2 des relatifs) : SplatLettres, centrée sur son encre
  assert.match(outil, /^const EQ_PRINT_LETTRE_FONT = 'SplatLettres, "Times New Roman", Times, serif';/m);
  // 1,2 × : la lettre ronde garde sur la tache la hauteur du lot R3 (son œil est plus bas)
  assert.match(outil, /^const EQ_PRINT_LETTRE_ECHELLE = 1\.2;/m);
  assert.match(outil, /Math\.round\(clamp\(Math\.round\(r \* \(revealed \? 0\.46 : \(opposed \? 0\.66 : 0\.78\)\)\), 20, 64\) \* EQ_PRINT_LETTRE_ECHELLE\)/);
  assert.match(outil, /attrs\["font-family"\] = EQ_PRINT_LETTRE_FONT;[\s\S]{0,80}const \[dx, dy\] = eqPrintLettreDecalage\(label\);\s*attrs\["dominant-baseline"\] = "alphabetic";/);
  assert.doesNotMatch(outil, /font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial/);
  // la mesure des flèches de la correction courte : dans la police dessinée
  assert.match(outil, /^const EQ_SIX_CORR_DRAWN_FONT = 'SplatLettres, system-ui, -apple-system, "Segoe UI", Roboto, Arial';/m);
});

test("l'outil des Équations : redessin quand la police arrive, l'impression automatique l'attend", () => {
  const fin = outil.slice(outil.indexOf("if(serieSuite.length) genererSerieComposee();"));
  assert.match(fin, /const lettresPretes = \(document\.fonts && document\.fonts\.load\)\s*\? Promise\.all\(\["1em", "bold 1em"\]\.map\(f => document\.fonts\.load\(f \+ " SplatLettres", "\\u\{1D465\}"\)\.catch\(\(\) => \[\]\)\)\)\s*: Promise\.resolve\(\[\]\);/);
  assert.match(fin, /if\(!jeuAuto\) lettresPretes\.then\(\(\) => \{ if\(cards\.length\) updateUI\(\); \}\);/);
  assert.match(fin, /if\(impressionAuto\) lettresPretes\.then\(\(\) => printSheet\(\)\);/);
  assert.doesNotMatch(fin, /if\(impressionAuto\) printSheet\(\);/);
});

test("ÉquaSplat : SplatLettres en tête de l'équation, des taches, des flèches et du bouton", () => {
  assert.match(equa, /color:var\(--ink\);\n    font-family:SplatLettres,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;/, "l'équation (texte de la page)");
  assert.equal((equa.match(/font-family:SplatLettres,Georgia,'Times New Roman',serif;/g) || []).length, 2, ".splatText et .miniSplatSvg text");
  assert.doesNotMatch(equa, /font-family:Georgia/);
  assert.match(equa, /\.opLabel\{\n    font-family:SplatLettres, Arial, Helvetica, sans-serif;/);
  assert.match(equa, /\.opArrowLabel\{\n      font-family:SplatLettres, Arial, Helvetica, sans-serif;/);
  assert.match(equa, /\.unknownToggleBtn\{\n    font-family:SplatLettres, Georgia, "Times New Roman", serif;/);
  assert.match(equa, /ctx\.font = `950 \$\{fontPx\}px SplatLettres, Arial, Helvetica, sans-serif`;/, "la mesure des étiquettes des flèches");
  // la police arrivée : les flèches sont redessinées, les lettres des taches remesurées
  assert.match(equa, /document\.fonts\.load\("1em SplatLettres", "\\u\{1D465\}"\)\.then\(\(\) => \{\s*scheduleOperationArrowsRedraw\(\);/);
  assert.match(equa, /splatLettreEncre\.clear\(\); if\(state\) renderSvg\(\);/);
});

test("ÉquaSplat : la lettre d'une tache, 0,8 × le rayon, centrée sur son encre (calcul exécuté)", () => {
  const debut = equa.indexOf("  const SPLAT_LETTRE_K = 0.8;");
  const src = equa.slice(debut, equa.indexOf("  function drawTray(tray, title){"));
  assert.ok(debut > 0 && src.includes("function drawSplatLetter"));
  // un faux canvas : « 𝑡 » mesuré 50 de large, encre de 2 à 46, 60 au-dessus et 2 sous la ligne de base
  const poses = [];
  const bac = vm.createContext({
    document: {
      fonts: { check: () => true },
      createElement: () => ({ getContext: () => ({ set font(v){ poses.push(v); },
        measureText: () => ({ width: 50, actualBoundingBoxLeft: -2, actualBoundingBoxRight: 46, actualBoundingBoxAscent: 60, actualBoundingBoxDescent: 2 }) }) }),
    },
    drawText: (x, y, label, cls) => {
      const attrs = { x, y, label, cls };
      return { style: {}, setAttribute: (k, v) => { attrs[k] = v; }, attrs };
    },
  });
  vm.runInContext(src + ";globalThis.t = drawSplatLetter({}, 100, 200, 50, '𝑡');", bac);
  const t = bac.t;
  assert.equal(t.attrs.x, 100); assert.equal(t.attrs.y, 200);
  assert.equal(t.style.fontSize, "40.0px", "0,8 × 50");
  assert.equal(t.style.dominantBaseline, "alphabetic");
  // l'encre va de 2 à 46 (milieu 24), la chasse de 0 à 50 (milieu 25) : dx = (50 − 48) / 200 em ;
  // le milieu de l'encre est à (60 − 2) / 2 au-dessus de la ligne de base : dy = 58 / 200 em
  assert.equal(t.attrs.dx, "0.010em");
  assert.equal(t.attrs.dy, "0.290em");
  assert.match(poses[0], /^italic 950 100px SplatLettres, Georgia/, "mesurée dans la police dessinée");
});
