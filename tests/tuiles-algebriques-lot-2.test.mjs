import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Tuiles algébriques — lot 2 (06/11/2026) : parenthèse « − » retournée au clic, tactile, zoom de départ,
// flèche retour, plus de texte « Molette… ». Les gestes eux-mêmes sont joués au navigateur (notice du lot).
const page = readFileSync(new URL("../outils/tuiles_algebriques/tuiles_algebriques.html", import.meta.url), "utf8");
const methode = (debut) => {
  const i = page.indexOf(`\n            ${debut}`);
  assert.notEqual(i, -1, `méthode introuvable : ${debut}`);
  const fin = page.indexOf("\n            }\n", i);
  return page.slice(i, fin + 14);
};

test("dans la parenthèse « − », la tuile s'affiche telle qu'on la tape", () => {
  const creer = methode("createTileToken(");
  // le signe réel reste l'opposé (il compte pour Simplifier, les paires, le tableau produit)…
  assert.match(creer, /if \(this\.isSubtractingInput && step\.type === 'subtraction' && !step\.oppositeApplied\) tileSign = -sign;/);
  // …mais l'étiquette, la couleur et la classe suivent le signe tapé
  assert.match(creer, /const colorClass = sign === 1 \? 'green' : 'red';/);
  assert.match(creer, /let label = getTileLabel\(type, sign\);/);
  assert.match(creer, /this\.styleTileElement\(el, type, sign\);/);
  assert.doesNotMatch(creer, /getTileLabel\(type, tileSign\)|styleTileElement\(el, type, tileSign\)/);
});

test("le changement de couleurs et « Précédent » gardent le signe affiché", () => {
  assert.match(methode("applyColorMode("), /this\.styleTileElement\(t\.element, t\.type, this\.shownSign\(t\)\)/);
  const annuler = methode("undo() {");
  assert.match(annuler, /this\.stopFlip\(\);/);
  assert.match(annuler, /getTileLabel\(data\.type, shown\)/);
  assert.match(annuler, /this\.styleTileElement\(el, data\.type, shown\);/);
});

test("« Ajouter l'opposé » retourne les tuiles une à une, avec une animation", () => {
  assert.match(methode("applyOpposite() {"), /this\.flipPendingBrackets\(\);/);
  const retourner = methode("flipPendingBrackets(");
  assert.match(retourner, /setTimeout\(\(\) => \{ if \(run === this\.flipRun\) this\.flipTileVisual\(t, run\); \}, i \* stagger\)/);
  const une = methode("flipTileVisual(");
  assert.match(une, /rotateY\(\$\{from\}deg\)/);
  assert.match(une, /half\(0, 90, 'ease-in'\)/);
  assert.match(une, /half\(-90, 0, 'ease-out'\)/);
  assert.match(une, /this\.paintToken\(t\);/); // la face change à mi-retournement
  assert.match(page, /\.token\.flipping \{ transition: none !important; \}/);
});

test("un cadre pointillé entoure les tuiles d'une parenthèse pas encore retournée", () => {
  assert.match(page, /\.bracket-frame \{[^}]*border: 3px dashed #ea580c;/);
  const cadre = methode("renderBracketFrames(");
  assert.match(cadre, /s\.type === 'subtraction' && \(!s\.oppositeApplied \|\| this\.flippingSteps\.has\(s\.id\)\)/);
  assert.match(methode("updateEquation() {"), /this\.renderBracketFrames\(\);/);
});

test("Ordonner et Réduire retournent d'abord la parenthèse (choix du 06/11)", () => {
  assert.match(methode("orderAll() {"), /this\.flipPendingBrackets\(\(\) => \{ this\.displayMode='ordered';/);
  assert.match(methode("reduceExpression() {"), /this\.flipPendingBrackets\(\(\) => \{ this\.displayMode='reduced';/);
});

test("une tuile pas retournée ne s'annule pas avec une tuile du dehors et n'entre pas dans le tableau produit", () => {
  const paires = methode("checkSnapAndFinalize(");
  assert.match(paires, /if \(this\.isFlipPending\(t\) !== this\.isFlipPending\(token\)\) continue;/);
  assert.match(methode("snapTokenToProductFrame("), /if \(this\.isFlipPending\(t\)\) return false;/);
  assert.match(methode("runSimplify() {"), /!this\.isFlipPending\(t\)/);
});

test("tactile : glisser le fond à un doigt et pincer à deux, sans toucher au glisser des tuiles", () => {
  for (const type of ["touchstart", "touchmove", "touchend", "touchcancel"]) {
    assert.match(page, new RegExp(`this\\.boardContainer\\.addEventListener\\('${type}', \\(e\\) => this\\.handleBoardTouch\\(e\\), \\{ passive: false \\}\\);`));
  }
  const geste = methode("handleBoardTouch(");
  assert.match(geste, /el\.closest\('\.token'\) \|\| el\.closest\('\.product-frame'\)/);
  assert.match(geste, /this\.currentTool === 'pen' \|\| this\.draggedToken/);
  assert.match(geste, /Math\.min\(MAX_SCALE, Math\.max\(MIN_SCALE, this\.touchView\.scale0 \* dist \/ this\.touchView\.dist0\)\)/);
  // le glisser d'une tuile arrête toujours l'événement avant le plateau
  assert.match(methode("handleDragStart(e)"), /if \(this\.currentTool !== 'hand'\) return; e\.stopPropagation\(\);/);
});

test("zoom de départ adapté au plateau, inchangé au tableau et sur ordinateur", () => {
  assert.match(page, /const INITIAL_SCALE = 1\.45;/);
  const zoom = methode("getInitialScale() {");
  assert.match(zoom, /Math\.min\(w \/ INITIAL_VIEW_WORLD, h \/ INITIAL_VIEW_WORLD_H\)/);
  assert.match(zoom, /Math\.min\(INITIAL_SCALE, Math\.max\(MIN_SCALE, fit\)\)/);
  const largeur = Number(page.match(/const INITIAL_VIEW_WORLD = (\d+);/)[1]);
  const hauteur = Number(page.match(/const INITIAL_VIEW_WORLD_H = (\d+);/)[1]);
  const depart = (w, h) => Math.round(Math.min(1.45, Math.max(0.5, Math.min(w / largeur, h / hauteur))) * 100) / 100;
  assert.equal(depart(1808, 988), 1.45); // tableau 1920 × 1080
  assert.equal(depart(1254, 676), 1.45); // ordinateur 1366 × 768
  assert.ok(depart(278, 574) <= 0.75);   // téléphone 390 × 844 : au moins trois tuiles x² de large
  assert.doesNotMatch(page, /this\.scale = INITIAL_SCALE/);
  assert.match(methode("resetView() {"), /this\.scale = this\.getInitialScale\(\);/);
});

test("flèche retour vers la collection, en tête de la barre, sans libellé ni hauteur en plus", () => {
  assert.match(page, /<body[^>]*data-mathsgo-parent-href="\/outils\/index\.html\?domain=algebre&amp;collection=tuiles-algebriques"/);
  assert.match(page, /<body[^>]*data-mathsgo-parent-place="#barre-outils"/);
  assert.match(page, /<div id="barre-outils" class="flex flex-wrap items-center gap-2">/);
  assert.match(page, /#barre-outils a\.mathsgo-back \{ min-height: 38px; height: 38px;/);
  assert.match(page, /#barre-outils a\.mathsgo-back \.mathsgo-back-label \{ display: none; \}/);
  assert.match(page, /<script defer src="\.\.\/\.\.\/assets\/js\/tool-parent-navigation\.js\?v=1"><\/script>/);
});

test("plus de texte « Molette » sur le plateau, et pas de double-clic pour retourner une tuile", () => {
  assert.doesNotMatch(page, /Molette: Zoom/);
  assert.doesNotMatch(page, /dblclick/);
});

test("le 𝑥 des tuiles est rond, comme dans l'équation (police SplatLettres du site)", () => {
  assert.match(page, /@font-face\{font-family:SplatLettres;src:url\('\/assets\/fonts\/SplatLettres-BoldItalic\.woff2'\)[^}]*unicode-range:U\+1D434-1D467,U\+210E\}/);
  assert.match(page, /\.token \{[^}]*font-family: SplatLettres, 'Times New Roman', serif;/);
  assert.match(page, /\.preview-shape \{[^}]*font-family: SplatLettres, 'Times New Roman', serif;/);
  assert.match(page, /if \(type === 'x2'\) return sign === 1 \? '𝑥²' : '-𝑥²';/);
  assert.match(page, /if \(type === 'x'\) return sign === 1 \? '𝑥' : '-𝑥';/);
  // menu de gauche : plus aucun x droit sur les tuiles
  const apercus = [...page.matchAll(/<div data-preview-type="(x2|x)"[^>]*>([^<]*)<\/div>/g)].map((m) => m[2]);
  assert.equal(apercus.length, 6);
  for (const texte of apercus) assert.doesNotMatch(texte, /x/);
});
