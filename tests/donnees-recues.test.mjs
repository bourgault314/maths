import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Audit « données reçues » (15/10/2026), volet 2 du chantier sécurité des pages :
// ce qu'une page relit de la MÉMOIRE DE L'APPAREIL (localStorage) ne doit
// jamais entrer dans son HTML tel quel. Cinq pages le faisaient (Axelle J4–J10,
// Solèy, Bandes et Disques de fractions, l'atelier Solèy). Ces tests épinglent
// les lignes corrigées et jouent les filtres sur une mémoire piégée ; la preuve
// au navigateur est _sources/liens-pieges/preuve-donnees-recues.py.

const lire = chemin => readFile(new URL("../" + chemin, import.meta.url), "utf8");
// Les objets fabriqués dans un contexte vm ont un autre prototype : on compare leur contenu.
const plat = valeur => JSON.parse(JSON.stringify(valeur));
const PIEGE = '<img src=x onerror="window.__pirate=1">';

// ------------------------------------------------------------------ Axelle
test("Axelle (daily/app.js) : une réponse « dans l'ordre » relue ne garde que les étiquettes de la question, écrites en texte", async () => {
  const app = await lire("axelle/daily/app.js");
  assert.match(app, /const chosen = saved && Array\.isArray\(saved\.value\) \? saved\.value\.filter\(token => question\.tokens\.includes\(token\)\) : \[\];/);
  assert.match(app, /data-placed="\$\{index\}" \$\{saved \? "disabled" : ""\}>\$\{escapeHtml\(token\)\}<\/button>/);
  assert.doesNotMatch(app, /saved\.value\.slice\(\)/, "l'ancienne relecture sans filtre ne doit pas revenir");
});

// ------------------------------------------------------------------- Solèy
function sauvegardeSoley(source, brut) {
  // Le bloc « Sauvegarde » du moteur, joué sur une mémoire donnée.
  const debut = source.indexOf("let save=loadSave();");
  const fin = source.indexOf("/* ===== Progression");
  assert.ok(debut > 0 && fin > debut, "le bloc de sauvegarde du moteur doit rester repérable");
  const bloc = source.slice(debut, fin);
  const contexte = vm.createContext({
    loadSave: () => JSON.parse(JSON.stringify(brut)),
    Number, Object, Math, Infinity
  });
  vm.runInContext(bloc + "\n;globalThis.resultat = save;", contexte);
  return contexte.resultat;
}

test("Solèy (engine.js) : les comptes de fruits et de pièces relus redeviennent des nombres", async () => {
  const moteur = await lire("outils/club_maths/soley/js/engine.js");
  assert.match(moteur, /for\(const o of \[save\.fruits,save\.pieces\]\)for\(const k of Object\.keys\(o\)\)\{const n=compteSauve\(o\[k\]\);if\(n===null\)delete o\[k\];else o\[k\]=n;\}/);
  const save = sauvegardeSoley(moteur, {done: {a: true}, fruits: {a: PIEGE, b: "2", c: 3.7, d: -1}, pieces: {a: "x", b: 4}});
  assert.deepEqual(plat(save.fruits), {b: 2, c: 3});
  assert.deepEqual(plat(save.pieces), {b: 4});
  assert.deepEqual(plat(save.done), {a: true});
  // Une sauvegarde qui n'est pas un objet ne casse pas la page.
  const vide = sauvegardeSoley(moteur, "n'importe quoi");
  assert.deepEqual(plat(vide.fruits), {});
});

test("Solèy v1 (page non reliée) : même nettoyage des fruits", async () => {
  const page = await lire("outils/club_maths/soley-v1.html");
  assert.match(page, /for\(const k of Object\.keys\(save\.fruits\)\)\{const n=Number\(save\.fruits\[k\]\);if\(Number\.isFinite\(n\)&&n>=0\)save\.fruits\[k\]=Math\.floor\(n\);else delete save\.fruits\[k\];\}/);
});

// ------------------------------------------------------ Bandes de fractions
test("Bandes de fractions : une scène relue ne garde que des pièces de la palette (dénominateur de la liste, nombres)", async () => {
  const html = await lire("outils/fractions/bandes_fractions.html");
  assert.match(html, /app\.tokens = normalizeTokenLabelModes\(sanitizeSnapshotTokens\(snap\.tokens, FRACTIONS\.map\(f => f\.denom\)\), snap\.labelMode \|\| 'numeric'\);/);
  const bloc = html.match(/\/\* BANDES_FRACTIONS_PURE_START \*\/([\s\S]*?)\/\* BANDES_FRACTIONS_PURE_END \*\//);
  assert.ok(bloc, "le bloc de fonctions pures doit rester extractible");
  const contexte = vm.createContext({});
  vm.runInContext(bloc[1] + "\n;globalThis.f = sanitizeSnapshotTokens;", contexte);
  const propres = contexte.f([
    {id: 1, denom: PIEGE, kind: "piece", side: "front", x: 1, y: 2, z: 3},
    {id: 2, denom: "4", kind: "piece", side: "front", x: 1, y: 2, z: 3},
    {id: 3, denom: 4, kind: PIEGE, side: PIEGE, x: PIEGE, y: null, z: "9", hidden: "oui", labelMode: "text"},
    {id: "4", denom: 4},
    null, "texte"
  ], [1, 2, 3, 4, 5, 6, 8, 10, 12]);
  assert.deepEqual(plat(propres), [{id: 3, denom: 4, kind: "piece", side: "front", x: 0, y: 0, z: 0, hidden: false, labelMode: "text"}]);
  assert.deepEqual(plat(contexte.f("rien", [4])), []);
});

// ----------------------------------------------------- Disques de fractions
test("Disques de fractions : une séance relue passe par _sanitizeSessionTokens", async () => {
  const html = await lire("outils/fractions/disques_fractions.html");
  assert.match(html, /this\.tokens = this\._sanitizeSessionTokens\(data\.tokens\);/);
  assert.doesNotMatch(html, /this\.tokens = data\.tokens\.map\(t => \(\{\.\.\.t\}\)\);/);
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]).find(s => s.includes("class FractionDisksApp"));
  assert.ok(script);
  const contexte = vm.createContext({window: {addEventListener() {}}, document: {}, console, setTimeout, clearTimeout});
  vm.runInContext(script + "\n;globalThis.App = FractionDisksApp;", contexte);
  const f = contexte.App.prototype._sanitizeSessionTokens;
  const propres = f.call({}, [
    {id: 1, denom: PIEGE, kind: "disk", side: "front", x: 1, y: 2},
    {id: 2, denom: 3, kind: PIEGE, side: PIEGE, x: "1", y: 2, z: "z", rot: null, slot: "s", hideLabel: 1},
    {id: 2.5, denom: 3}
  ]);
  assert.deepEqual(plat(propres), [{id: 2, denom: 3, kind: "piece", side: "front", x: 0, y: 2, z: null, rot: 0, slot: null, hideLabel: false}]);
});

// ---------------------------------------------------------- Atelier Solèy
test("Atelier Solèy : un brouillon n'est gardé que si son identifiant a la forme fabriquée par l'atelier, et la liste échappe ce qu'elle écrit", async () => {
  const atelier = await lire("outils/club_maths/soley/js/atelier.js");
  assert.match(atelier, /return typeof id === 'string' && \/\^br\[0-9a-z\]\{1,24\}\$\/\.test\(id\);/);
  assert.match(atelier, /d\.liste = d\.liste\.filter\(function\(e\)\{ return e && typeof e === 'object' && idBrouillonValide\(e\.id\); \}\);/);
  assert.match(atelier, /echapper\(e\.nom\) \+ '<small>' \+ echapper\(n\.cols \|\| '\?'\) \+ '×' \+ echapper\(n\.rows \|\| '\?'\) \+ ' · ' \+ quand \+/);
  assert.match(atelier, /const quand = echapper\(String\(e\.maj \|\| ''\)\.slice\(0, 10\)\);/);
  assert.match(atelier, /' au lieu de ' \+ echapper\(t\.disp \|\| fstr\(t\.need\)\) \+ '\.';/);
  // normaliser() : les champs d'un niveau relu reprennent leur type.
  assert.match(atelier, /v\.cols = Math\.min\(COLS_MAX, Math\.max\(COLS_MIN, entierOu\(n\.cols, 9\)\)\);/);
  assert.match(atelier, /const o = \{ x: entierOu\(t\.x, 0\), y: entierOu\(t\.y, 0\), need: fracOu\(t\.need, \[1, 1\]\) \};/);
});

// ---------------------------------------------------------- cache-buster
test("Axelle J4–J10 : les pages chargent le moteur corrigé (?v= bumpé)", async () => {
  for (const jour of [4, 5, 6, 7, 8, 9, 10]) {
    const page = await lire(`axelle/j${jour}/index.html`);
    assert.match(page, /daily\/app\.js\?v=donnees-recues-20261015-1/, `axelle/j${jour}/index.html`);
  }
});
