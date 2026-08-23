import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const equabarre = await readFile(new URL("../outils/equabarre.html", import.meta.url), "utf8");
const equasplat = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

// Les opérations faites dans les deux membres s'écrivent en vertical de chaque
// côté du signe égal. ÉquaBarre les compose comme ÉquaSplat : flèche droite,
// poussée vers le bord extérieur, visible dans les deux vues.

test("la flèche des opérations est droite, jamais un SVG courbé", () => {
  assert.match(equabarre, /const arrow = `<span class="operationArrow" aria-hidden="true">↓<\/span>`;/);
  assert.ok(!/opArrowSvg/.test(equabarre), "plus aucune trace de l'ancienne flèche SVG");
  assert.ok(!/operationArrowSvg/.test(equabarre), "la fabrique de flèche courbée est retirée");
});

test("l'historique est une liste en grille, plus un tableau", () => {
  // Un tableau rétracte ses colonnes sur leur contenu : la cellule d'opération
  // ne pouvait pas atteindre le bord. La grille donne sa moitié à chaque membre.
  assert.ok(!/equationTable/.test(equabarre), "plus de tableau d'équations");
  assert.match(equabarre, /<div class="equationList" aria-label="Étapes de résolution">/);
  assert.match(equabarre, /<div class="equationRow \$\{cls\}">/);
  for (const regle of [/\.equationRow\{[^}]*grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/s,
                       /\.equationOpRow\{[^}]*grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/s]) {
    assert.ok(regle.test(equabarre), `grille trois colonnes : ${regle}`);
  }
});

test("les opérations partent vers les bords extérieurs", () => {
  assert.match(equabarre, /\.operationCell\.opLeft\{\s*justify-content:flex-start;/);
  assert.match(equabarre, /\.operationCell\.opRight\{\s*justify-content:flex-end;/);
  assert.match(equabarre, /\.equationOpRow \.operationCell\{[^}]*width:100%;/s);
});

test("l'opération reste écrite en vue classique comme en rédaction", () => {
  // Le piège d'avant : la ligne n'était pas masquée, elle n'était pas fabriquée.
  const rendu = equabarre.slice(
    equabarre.indexOf("function renderEquationHistory"),
    equabarre.indexOf("function syncFullscreenSizeMode")
  );
  assert.ok(rendu.length > 0, "le rendu de l'historique est bien là");
  assert.ok(!/isDetailedEquationView/.test(rendu), "aucune condition de vue sur la ligne d'opération");
  assert.match(rendu, /if\(i > 0\)\{\s*rows\.push\(renderOperationRow\(stepOps\[i - 1\]\)\);/);
});

test("l'opération porte le bleu de « transformer »", () => {
  assert.match(equabarre, /\.equationOpRow\{[^}]*color:#2563eb;/s);
});

test("ÉquaBarre et ÉquaSplat écrivent la même ligne d'opération", () => {
  // La référence, c'est ÉquaSplat : si son rendu bouge, celui-ci doit suivre.
  const extraire = (source) => source.slice(
    source.indexOf("function renderOperationRow"),
    source.indexOf("function renderEquationHistory")
  ).trim();
  assert.equal(extraire(equabarre), extraire(equasplat));
});

// LA RÈGLE DES FLÈCHES (23/08/2026) : flèche arrondie là où il y a de la largeur
// — ordinateur ou tablette, vue classique — et flèche « ↓ » là où il n'y en a pas
// — vue rédaction, où l'équation vit dans une colonne étroite, et téléphone.
// Les deux outils l'appliquent, avec le même dessin.
test("les deux outils dessinent la même flèche arrondie", () => {
  const extraire = (source) => source.slice(
    source.indexOf("  function measureOpLabelWidth"),
    source.indexOf("  let opArrowRedrawHandle")
  ).trim();
  const moteur = extraire(equasplat);
  assert.ok(moteur.length > 2000, "le calque de flèches d'ÉquaSplat est bien là");
  assert.equal(extraire(equabarre), moteur);
});

test("la flèche arrondie ne remplace la ligne « ↓ » qu'en vue classique et en largeur", () => {
  // ÉquaSplat teste viewMode, ÉquaBarre teste equationViewMode : même règle,
  // écrite avec le vocabulaire de chaque fichier.
  assert.match(equasplat, /OP_ARROW_MEDIA\.matches\) && viewMode !== "redaction";/);
  assert.match(equabarre, /OP_ARROW_MEDIA\.matches\) && !isDetailedEquationView\(\);/);
  assert.match(equabarre, /@media \(min-width:761px\)\{\s*\.stage:not\(\.detailedView\) \.equationOpRow\{\s*display:none !important;/);
  assert.match(
    equabarre,
    /equationHistory\.innerHTML = `<div class="equationList"[^`]*`;\s*drawOperationArrowsOverlay\(\);/
  );
});
