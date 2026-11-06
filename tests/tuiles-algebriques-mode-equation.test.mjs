import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Tuiles algébriques — lot 3 (06/11/2026) : le mode équation reçoit ce que les lots 1 et 2 ont apporté à
// l'appli principale, plus les choix de Gwenaël du 06/11 (barre du haut et couleurs comme l'appli principale,
// corbeille en phase 1 seulement, boutons Ordonner / Réduire / Simplifier). Les gestes sont joués au
// navigateur (notice du lot) ; ici, on garde les points qui pourraient repartir en arrière sans bruit.
const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const page = lire("outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html");
const principale = lire("outils/tuiles_algebriques/tuiles_algebriques.html");
const methode = (debut) => {
  const i = page.indexOf(`\n            ${debut}`);
  assert.notEqual(i, -1, `méthode introuvable : ${debut}`);
  const fin = page.indexOf("\n            }\n", i);
  return page.slice(i, fin + 14);
};
const bloc = (texte, nom) => {
  const m = texte.match(new RegExp(`const ${nom} = \\{[\\s\\S]*?\\n        \\};`));
  assert.ok(m, `${nom} introuvable`);
  return m[0];
};

test("mêmes couleurs que l'appli principale, Vert rouge par défaut, menu Couleurs", () => {
  const couleurs = (t) => bloc(t, "TILE_COLOR_MODES").match(/\{ bg: '#[0-9a-f]{6}', border: '#[0-9a-f]{6}', text: '#[0-9a-f]{6}', eq: '#[0-9a-f]{6}' \}/g);
  for (const spec of couleurs(page)) assert.ok(principale.includes(spec), `couleur absente de l'appli principale : ${spec}`);
  assert.match(page, /<option value="sign" selected>Vert rouge<\/option>\s*<option value="blueyellow">Bleu jaune<\/option>\s*<option value="mathigon">Mathigon<\/option>\s*<option value="bw">Blanc gris<\/option>/);
  assert.match(page, /this\.colorMode = 'sign';/);
  assert.doesNotMatch(page, /radial-gradient/); // plus de tuiles bombées
  assert.doesNotMatch(page, /COLORS\.(pos|neg)/); // l'équation suit le menu
});

test("tuile 0 propre : ni le 𝑥 dessous, ni bord coloré", () => {
  assert.match(page, /\.token\.is-zero \{[^}]*border: 2px solid #6b7280 !important;[^}]*color: transparent !important;/);
});

test("le 𝑥 rond partout : tuiles, menu, fantôme", () => {
  assert.match(page, /font-family:SplatLettres;src:url\('\/assets\/fonts\/SplatLettres-BoldItalic\.woff2'\)/);
  assert.match(page, /if \(type === 'x'\) return sign === 1 \? '𝑥' : '-𝑥';/);
  assert.equal((page.match(/class="preview-shape [^"]*">-?𝑥<\/div>/g) || []).length, 4);
  assert.doesNotMatch(page, /\? ?'x' ?: ?'-x'/);
});

test("barre du haut : flèche retour, ↶, Tout recommencer, outils groupés, vue", () => {
  assert.match(page, /data-mathsgo-parent-href="\/outils\/index\.html\?domain=algebre&amp;collection=tuiles-algebriques"[^>]*data-mathsgo-parent-place="#barre-outils"/);
  for (const id of ["tool-hand", "tool-pen", "btn-clear-drawing", "tile-trash-zone", "btn-reset", "btn-reset-view", "btn-sound", "btn-fullscreen", "color-mode-select"]) {
    assert.match(page, new RegExp(`id="${id}"`), id);
  }
  assert.doesNotMatch(page, /title="Tout effacer"/);
  assert.match(page, /let soundEnabled = false;/); // son coupé au départ
});

test("Tout recommencer : s'annule, revient en phase 1 avec ses boutons, efface le stylo, remet la main", () => {
  const reset = methode("resetBoard() {");
  assert.match(reset, /this\.saveState\(\);[\s\S]*this\.clearDrawing\(false\);[\s\S]*this\.mode = 'setup';\s*this\.updatePhaseUI\(\);\s*this\.setTool\('hand'\);/);
  const etat = methode("saveState() {");
  assert.match(etat, /mode: this\.mode,/);
  assert.match(etat, /strokes: this\.strokes \|\| \[\]/);
  const annuler = methode("undo() {");
  assert.match(annuler, /this\.strokes = Array\.isArray\(state\.strokes\)/);
  assert.match(annuler, /this\.updatePhaseUI\(\);/);
  assert.match(page, /e\.key === 'Escape' && this\.currentTool !== 'hand'\) this\.setTool\('hand'\)/);
});

test("corbeille : phase 1 seulement (choix du 06/11)", () => {
  assert.match(methode("updatePhaseUI() {"), /trash\.disabled = isSolve;/);
  assert.match(methode("setTool(t) {"), /if \(t === 'erase' && this\.mode !== 'setup'\) t = 'hand';/);
  assert.match(methode("deleteToken("), /if \(!t \|\| this\.mode !== 'setup'\) return;/);
});

test("boutons de chaque membre : Ordonner / Réduire / Simplifier (mêmes mots que l'appli principale)", () => {
  for (const cote of ["Left", "Right"]) {
    assert.match(page, new RegExp(`app\\.side${cote}\\.order\\(\\)[^>]*>Ordonner<[\\s\\S]*?app\\.side${cote}\\.reduce\\(\\)[^>]*>Réduire<[\\s\\S]*?app\\.side${cote}\\.simplify\\(\\)[^>]*>Simplifier<`));
  }
  assert.doesNotMatch(page, />(Trier|Regrouper)</);
});

test("tactile : menu au doigt, fond glissé de haut en bas, pincement, trait du milieu au centre", () => {
  assert.equal((page.match(/ontouchstart="app\.handleMenuTouchStart\(event, /g) || []).length, 8);
  assert.match(page, /\['touchstart', 'touchmove', 'touchend', 'touchcancel'\]\.forEach\(type => \{\s*this\.container\.addEventListener\(type, \(e\) => this\.handleBoardTouch\(e\), \{ passive: false \}\);/);
  const geste = methode("handleBoardTouch(e) {");
  assert.match(geste, /t\.target\.closest\('\.token'\)/);
  assert.match(geste, /this\.currentTool === 'pen' \|\| this\.draggedToken/);
  assert.match(geste, /Math\.min\(MAX_SCALE, Math\.max\(MIN_SCALE, this\.touchView\.scale0 \* dist \/ this\.touchView\.dist0\)\)/);
  assert.doesNotMatch(geste, /this\.pan\.x =/); // le « = » reste au-dessus du trait
  assert.match(methode("initPen() {"), /this\.container\.addEventListener\('pointerdown'/); // le doigt dessine en mode stylo
});

test("zoom de départ : 1 au tableau et sur ordinateur, plus petit au téléphone ; tuiles dans l'écran", () => {
  assert.match(page, /const INITIAL_SCALE = 1;/);
  assert.match(methode("getInitialScale() {"), /Math\.min\(w \/ INITIAL_VIEW_WORLD, h \/ INITIAL_VIEW_WORLD_H\)/);
  assert.match(page, /return Math\.max\(Math\.min\(minW, avail\), 2 \* \(90 \+ 10\)\);/);
});

test("équation aérée et plus grande", () => {
  assert.match(page, /#equation-display \{ font-size: clamp\(20px, 2\.4vw, 46px\); \}/);
  assert.match(methode("opLatex(sign)"), /\\\\:\$\{this\.colorLatex/);
});

test("la règle du « 0 » n'est plus glissée dans @keyframes vanish (le bloc était ignoré)", () => {
  assert.match(page, /@keyframes vanish \{ 0% \{ transform: scale\(1\); opacity: 1; \} 100% \{ transform: scale\(0\.1\); opacity: 0; \} \}/);
});

test("miniatures du catalogue refaites (vert rouge, coins droits) : adresse changée", () => {
  const catalogue = lire("assets/js/catalogue-refonte-data.js");
  assert.match(catalogue, /"thumbnail": "assets\/img\/thumbnails\/tuiles-algebriques\/plateau-expressions\.png\?v=3"/);
  assert.match(catalogue, /"thumbnail": "assets\/img\/thumbnails\/tuiles-algebriques\/plateau-equations\.png\?v=3"/);
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=livret-litteral-20261106-1/);
});
