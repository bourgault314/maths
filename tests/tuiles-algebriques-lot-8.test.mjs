import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Tuiles algébriques — lot 8 (11/11/2026) : la bulle d'une tuile, la barre du haut, le tableau produit, le stylo.
// 1) Toucher une tuile sans la bouger (ou clic droit) ouvre une bulle : Pivoter, Dupliquer, Opposé, Supprimer.
//    La main, l'outil Pivoter et la corbeille quittent la barre ; une tuile glissée dans la colonne de gauche s'enlève.
// 2) L'équation est plus grande (47 px sur un écran de 1440) dans une boîte de 80 px.
// 3) Tableau produit : une croix noire sépare les facteurs des produits, traits fins et clairs entre les produits.
// 4) Stylo : toile de la taille de l'écran (avant 12 000 × 12 000 points dans le plateau zoomé : 16 images/s).
const page = readFileSync(new URL("../outils/tuiles_algebriques/tuiles_algebriques.html", import.meta.url), "utf8");
const methode = (debut) => {
  const i = page.indexOf(`\n            ${debut}`);
  assert.notEqual(i, -1, `méthode introuvable : ${debut}`);
  const fin = page.indexOf("\n            }\n", i);
  return page.slice(i, fin + 14);
};

test("la bulle a ses quatre boutons, avec leur nom écrit", () => {
  const bulle = page.slice(page.indexOf('<div id="bulle-tuile"'), page.indexOf("<!-- TAPER UNE EXPRESSION"));
  for (const [action, nom] of [["pivoter", "Pivoter"], ["dupliquer", "Dupliquer"], ["oppose", "Opposé"], ["supprimer", "Supprimer"]]) {
    assert.match(bulle, new RegExp(`data-action="${action}"[\\s\\S]*?</svg>${nom}</button>`));
  }
  assert.match(bulle, /role="toolbar"/);
  assert.match(bulle, /hidden>/);
});

test("toucher sans bouger (moins de 6 px) ouvre la bulle, sans laisser de pas à annuler ; un vrai glisser ne l'ouvre pas", () => {
  const d = methode("handleDragStart(e) {");
  assert.match(d, /const touche = Math\.hypot\(pt\.x - toucher\.x, pt\.y - toucher\.y\) < 6;/);
  assert.match(d, /if \(touche\) \{\s*this\.history\.length = Math\.min\(this\.history\.length, toucher\.historique\);[^\n]*\n\s*this\.ouvrirBulle\(tuile\);/);
  // la paire nulle touchée se reforme avant d'ouvrir la bulle
  assert.ok(d.indexOf("this.checkSnapAndFinalize(this.draggedToken); // une paire nulle") < d.indexOf("this.ouvrirBulle(tuile);"));
  // clic droit : pas de glisser, c'est la bulle
  assert.match(d, /if \(e\.button !== undefined && e\.button !== 0\) return;/);
});

test("clic droit sur une tuile : la même bulle ; toucher ailleurs, Échap, la vue qui bouge la ferment", () => {
  const i = methode("initBulle() {");
  assert.match(i, /addEventListener\('contextmenu', \(e\) => \{[\s\S]*?e\.preventDefault\(\);[\s\S]*?this\.ouvrirBulle\(t\);/);
  assert.match(i, /document\.addEventListener\('pointerdown', \(e\) => \{\s*if \(this\.bulleTuile && !this\.bulle\.contains\(e\.target\)\) this\.fermerBulle\(\);\s*\}, true\);/);
  assert.match(i, /e\.key === 'Escape'\) this\.fermerBulle\(\)/);
  assert.match(methode("updateTransform() {"), /this\.fermerBulle\(\);/);
  assert.match(methode("undo() {"), /this\.fermerBulle\(\);/);
});

test("la bulle ne montre que ce qui s'applique à la tuile touchée", () => {
  const a = methode("actionsBulle(t) {");
  assert.match(a, /pivoter: t\.type === 'x' && t\.pairId === null && \(!t\.productZone \|\| \(t\.productZone === 'cell' && facto\)\)/);
  // Dupliquer / Opposé : pas dans un tableau, ni dans une paire nulle, ni pour un facteur 2(…) pas développé
  assert.match(a, /const libre = !!step && !t\.productZone && t\.pairId === null && !t\._canceling && !facto/);
  assert.match(a, /!\(t\.ghostIds && t\.ghostIds\.length\) && !\(step\.type === 'multiplication' && !step\.distributed\)/);
  // une parenthèse « − » pas retournée : c'est « Ajouter l'opposé » qui s'en charge
  assert.match(a, /oppose: libre && !this\.isFlipPending\(t\) && !\(step\.type === 'subtraction' && !step\.oppositeApplied\)/);
  assert.match(a, /supprimer: true/);
  assert.match(methode("actionBulle(action) {"), /if \(!this\.actionsBulle\(t\)\[action\]\) return;/);
});

test("Dupliquer : la copie rejoint le groupe de la tuile (𝑥 devient 2𝑥) et s'annule avec ↶", () => {
  const d = methode("dupliquerTuile(t) {");
  assert.match(d, /^\s*dupliquerTuile\(t\) \{\s*this\.saveState\(\);/);
  assert.match(d, /packId: t\.packId/);
  assert.match(d, /sign: t\.sign, displaySign: t\.displaySign/);
  assert.match(d, /step\.tokenIds\.splice\(step\.tokenIds\.indexOf\(t\.id\) \+ 1, 0, id\);/);
  assert.match(d, /this\.placeLibrePres\(t\)/);
});

test("Opposé : la tuile se retourne et passe en fin de son groupe (𝑥 + 𝑥 + 𝑥 → 2𝑥 − 𝑥)", () => {
  const o = methode("opposeTuile(t) {");
  assert.match(o, /this\.saveState\(\);/);
  assert.match(o, /t\.sign = -t\.sign; t\.displaySign = t\.sign;/);
  assert.match(o, /step\.tokenIds = step\.tokenIds\.filter\(i => i !== t\.id\); step\.tokenIds\.push\(t\.id\);/);
  assert.match(o, /t\.packId = this\.nextPackId\+\+;/);
  assert.match(o, /this\.flipTileVisual\(t, this\.flipRun\);/);
});

test("une tuile glissée dans la colonne de gauche s'enlève, la colonne s'allume pendant le glisser", () => {
  assert.match(page, /<aside id="colonne-tuiles"/);
  assert.match(methode("isOverTileTrash(cx, cy) {"), /getElementById\('colonne-tuiles'\)/);
  assert.match(methode("setTileTrashActive(active) {"), /classList\.toggle\('rangement', !!active\)/);
  assert.match(page, /#colonne-tuiles\.rangement \{/);
});

test("barre du haut : le stylo s'allume et s'éteint d'un clic ; plus d'outil main, pivoter ni supprimer", () => {
  assert.match(page, /onclick="app\.setTool\(app\.currentTool === 'pen' \? 'hand' : 'pen'\)" id="tool-pen"/);
  assert.match(methode("setTool(t) {"), /if \(t !== 'pen'\) t = 'hand';/);
  assert.match(methode("updateToolButtons() {"), /setAttribute\('aria-pressed', on \? 'true' : 'false'\)/);
  assert.doesNotMatch(page, /currentTool === 'erase'|currentTool === 'rotate'|tile-trash-zone|tool-hand/);
});

test("l'équation : 47 px sur un écran de 1440 (52 au plus), boîte de 80 px", () => {
  assert.match(page, /#equation-display \{ font-size: clamp\(20px, 3\.3vw, 52px\);/);
  assert.match(page, /#eq-boite \{ height: 80px; \}/);
  assert.match(page, /<div id="eq-boite" class="[^"]*"/);
  assert.doesNotMatch(page.match(/<div id="eq-boite" class="([^"]*)"/)[1], /h-\[/);
});

test("tableau produit : croix noire de 4 px entre facteurs et produits, traits fins entre les produits", () => {
  assert.match(page, /\.product-slot\.top \{ border-bottom: 0; box-shadow: inset 0 -4px 0 #1e293b; \}/);
  assert.match(page, /\.product-slot\.left \{ border-right: 0; box-shadow: inset -4px 0 0 #1e293b; \}/);
  assert.match(page, /\.product-corner \{ border-right: 0; border-bottom: 0; box-shadow: inset -4px -4px 0 #1e293b; \}/);
  assert.match(page, /\.product-slot, \.product-cell, \.product-corner \{ border-right-width: 1\.5px; border-bottom-width: 1\.5px;/);
});

test("stylo : toile de la taille de l'écran, hors du plateau zoomé, qui suit la vue", () => {
  assert.doesNotMatch(page, /CANVAS_WORLD/);
  assert.match(page, /<div id="board-world"><\/div>[\s\S]*?<canvas id="drawing-canvas"><\/canvas>\s*<\/div>/);
  const r = methode("resizeCanvas() {");
  assert.match(r, /this\.canvas\.width = Math\.round\(w \* dpr\);/);
  assert.match(methode("applyPenTransform() {"), /setTransform\(d \* this\.scale, 0, 0, d \* this\.scale, d \* this\.pan\.x, d \* this\.pan\.y\)/);
  assert.match(methode("updateTransform() {"), /this\.redrawPen\(\);/);
});

test("stylo : seulement le nouveau bout du trait, tous les points reçus, en courbe", () => {
  assert.match(page, /e\.getCoalescedEvents\(\)/);
  assert.match(page, /this\.draw\(lot\.length \? lot : \[e\]\);/);
  const d = methode("draw(events) {");
  assert.match(d, /for \(const ev of events\)/);
  assert.match(d, /c\.quadraticCurveTo\(/);
  assert.doesNotMatch(d, /moveTo\(pts\[0\]/); // jamais tout le trait à chaque mouvement
  assert.match(methode("tracerTrait(pts) {"), /quadraticCurveTo/);
});
