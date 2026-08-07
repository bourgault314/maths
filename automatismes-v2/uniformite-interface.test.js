import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";

const [app, interfaceCss, indexV2, sitemap, accueil] = await Promise.all([
  readFile(new URL("./app.js", import.meta.url), "utf8"),
  readFile(new URL("./interface.css", import.meta.url), "utf8"),
  readFile(new URL("./index.html", import.meta.url), "utf8"),
  readFile(new URL("../sitemap.xml", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
]);

it("garde les trois chiffres des exemples du cours à la même taille", () => {
  assert.match(interfaceCss, /\.exemples-unites-cours p > span\s*\{/);
  assert.doesNotMatch(interfaceCss, /\.exemples-unites-cours p span\s*\{/);
  assert.match(interfaceCss, /\.nombre-unite-cours span\s*\{[^}]*font-size:\s*inherit;/s);
  assert.match(interfaceCss, /\.exemples-unites-cours p\s*\{[^}]*grid-template-columns:\s*70px minmax\(0, 1fr\)/s);
});

it("sépare les actions, le score centré et la progression", () => {
  assert.match(app, /class="actions-entete"/);
  assert.match(interfaceCss, /grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\)/);
  assert.match(interfaceCss, /\.score,[\s\S]*?justify-self:\s*center;/);
  assert.match(interfaceCss, /\.position\s*\{[^}]*justify-self:\s*end;/s);
  assert.match(app, /role="progressbar"[^>]*aria-valuemin="0"[^>]*aria-valuemax="100"[^>]*aria-valuenow=/s);
  assert.match(interfaceCss, /@media \(max-width: 430px\)[\s\S]*?\.actions-entete \.bouton-entete\s*\{[^}]*padding-inline:\s*6px[\s\S]*?\.bouton-aide-entete > span\s*\{[^}]*display:\s*none/s);
});

it("rend Menu et Aide visibles dans la même coque sans double encadrement", () => {
  assert.match(app, /bouton-menu[\s\S]*?<span aria-hidden="true">☰<\/span><strong>Menu<\/strong>/);
  assert.match(app, /bouton-aide-entete[\s\S]*?<span aria-hidden="true">\?<\/span><strong>Aide<\/strong>/);
  assert.match(interfaceCss, /\.bouton-menu,\s*\.bouton-aide-entete\s*\{[^}]*border:\s*2px solid/s);
  assert.match(interfaceCss, /\.bouton-aide-entete\s*\{[^}]*border-color:[^}]*var\(--mg-turquoise\)/s);
  assert.doesNotMatch(interfaceCss, /\.bouton-aide-entete\[aria-expanded="true"\][^}]*box-shadow:\s*inset/s);
  assert.match(interfaceCss, /\.bouton-entete\s*\{[^}]*min-height:\s*44px/s);
});

it("réserve le pavé à un pointeur principal tactile", () => {
  assert.match(interfaceCss, /@media \(pointer: coarse\) and \(hover: none\)/);
  assert.doesNotMatch(interfaceCss, /@media \(any-pointer: coarse\)/);
});

it("conserve Valider sur téléphone et le compacte seulement à partir de 680 px", () => {
  assert.match(interfaceCss, /\.barre-eleve button,[\s\S]*?min-height:\s*52px;/);
  assert.match(interfaceCss, /@media \(min-width: 680px\)[\s\S]*?\.barre-avant-validation \.bouton-principal\s*\{[^}]*width:\s*min\(100%, 360px\)/s);
});

it("utilise le même repère d'unité et ne demande plus un clic décoratif", () => {
  assert.match(app, /class="chiffre-unite-encadre"/);
  assert.match(interfaceCss, /\.chiffre-unite-encadre\s*\{[^}]*border:\s*3px solid var\(--mg-orange\)/s);
  assert.doesNotMatch(app, /<button[^>]*data-action="unite-aide"/);
});

it("respecte l'ordre du motif dans l'aide au chiffre manquant", () => {
  assert.match(app, /\[\.\.\.motif\]\.join\(" \+ "\)/);
  assert.doesNotMatch(app, /chiffresFixes\.join\(" \+ "\) \+ □/);
  assert.match(app, /class="case-chiffre-manquant[^>]*aria-live="polite" aria-atomic="true"/);
});

it("conserve la route pilote hors indexation et hors navigation", () => {
  assert.match(indexV2, /<meta name="robots" content="noindex,nofollow">/);
  assert.doesNotMatch(sitemap, /automatismes-v2/);
  assert.doesNotMatch(accueil, /automatismes-v2/);
});
