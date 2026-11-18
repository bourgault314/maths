// Lot EN-D1 (18/11/2026) — ordinateur et tableau : la question grandit avec l'écran.
// Avant ce lot, le cadre restait à 860 px de large et la question RAPETISSAIT sur un écran bas (17 px sur un écran de
// tableau en 1 280 × 720). Désormais ajusterTaille (evaluation.js) règle --k : la plus grande taille qui tient entière dans
// le cadre, sans défiler, jamais moins que la taille d'avant ; téléphone et petite tablette (< 700 px) : rien ne change.
// Les mesures à l'écran (tous les tests, officiels et jumeaux, de 1 024 × 768 à 1 920 × 1 080, et la comparaison au pixel
// près au téléphone) sont faites par le banc d'essai du lot ; ici on garde les règles qui les rendent possibles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../outils/evaluations_nationales/evaluation.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../outils/evaluations_nationales/evaluation.js", import.meta.url), "utf8");
const bloc = (debut) => {
  const i = html.indexOf(debut);
  assert.ok(i >= 0, debut);
  return html.slice(i, html.indexOf("\n    }", i));
};

test("ordinateur : le cadre s'élargit, la question grandit avec --k, les boutons du bas avec --kb", () => {
  const ordi = bloc("    @media(min-width:700px){");
  assert.match(ordi, /\.en-passation \.shell\{width:min\(1240px,calc\(100% - 40px\)\)\}/);
  assert.match(ordi, /#q-corps>\*\{zoom:var\(--k,1\)\}/);
  assert.match(ordi, /\.actions button\{font-size:calc\(1rem \* var\(--kb,1\)\)\}/);
  // Plus de plafond à 700 px : au tableau en 1 920 × 1 080, le cadre descend jusqu'en bas.
  assert.match(ordi, /\.q-carte\{height:max\(380px,calc\(100vh - 196px\)\);height:max\(380px,calc\(100dvh - 196px\)\)\}/);
});

test("fenêtre basse (écran de tableau 1 280 × 720) : l'énoncé ne rapetisse plus, c'est --k qui fait tenir", () => {
  const bas = bloc("    @media(min-width:700px) and (max-height:760px){");
  assert.match(bas, /\.q-carte\{height:max\(360px,calc\(100vh - 156px\)\);height:max\(360px,calc\(100dvh - 156px\)\)\}/);
  assert.match(bas, /html:not\(\.taille-base\) \.q-enonce\{font-size:1\.35rem\}/);
  // Le bloc du lot vient APRÈS les anciennes règles de fenêtre basse (même poids : la dernière gagne).
  assert.ok(html.indexOf("    @media(min-width:700px) and (max-height:760px){") > html.lastIndexOf(".q-enonce{font-size:1.08rem}"));
});

test("calculatrice : à partir de 1 340 px elle reste à côté du cadre, qui lui laisse sa place", () => {
  const large = bloc("    @media(min-width:1340px){\n      .en-passation.avec-calculatrice");
  assert.match(large, /\.en-passation\.avec-calculatrice \.shell\{width:min\(1240px,calc\(100% - 524px\)\)\}/);
  assert.match(large, /\.avec-calculatrice \.calculatrice\{right:calc\(\(100vw - min\(1240px,100vw - 524px\)\) \/ 2 - 242px\)\}/);
  assert.match(js, /document\.body\.classList\.toggle\("avec-calculatrice", Boolean\(sujet\.calculatrice\)\);/);
});

test("ajusterTaille : part de la taille permise par l'écran et descend tant que ça déborde, jamais sous 1", () => {
  const f = js.match(/function ajusterTaille\(\) \{([\s\S]*?)\n  \}\n/)[1];
  assert.match(f, /if \(largeur < 700\) \{/);
  assert.match(f, /racine\.style\.removeProperty\("--k"\)/);
  assert.match(f, /Math\.min\(2\.4, Math\.max\(1, Math\.min\(largeur \/ 720, hauteur \/ 405\)\)\)/);
  assert.match(f, /corps\.scrollHeight > corps\.clientHeight/);
  assert.match(f, /document\.body\.getBoundingClientRect\(\)\.height > hauteur/);
  assert.match(f, /if \(!deborde\(\)\) return;\n      if \(k <= 1\) break;/);
  // Même à 1, ça ne tient pas : on retrouve exactement l'écran d'avant le lot.
  assert.match(f, /racine\.classList\.add\("taille-base"\);/);
  assert.match(f, /racine\.classList\.remove\("taille-base"\);/);
  assert.match(f, /k = Math\.max\(1, k - 0\.05\);/);
  assert.match(f, /Math\.round\(16 \* \(1 \+ \(k - 1\) \/ 2\)\) \/ 16/);
  assert.match(f, /ajusterColonnes\(\);/); // les réponses repassent sur une colonne si elles ne tiennent plus
});

test("ajusterTaille est rejouée à chaque question et à chaque changement de fenêtre (plein écran compris)", () => {
  assert.match(js, /calculatrice\.question\(sujet\.calculatrice && it\.q\.calculatrice !== false\);\n    ajusterTaille\(\);\n  \}/);
  assert.match(js, /const remesurer = \(\) => \{ if \(passation && !\$\("#passe"\)\.hidden\) ajusterTaille\(\); \};/);
  assert.match(js, /window\.addEventListener\("resize", remesurer\)/);
});

test("le script a changé : son ?v= est bumpé", () => {
  assert.match(html, /<script src="\.\/evaluation\.js\?v=20261118-1"><\/script>/);
});
