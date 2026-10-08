// Le champ « Ton code » de la question de la garde (« C’est toujours toi, Léa ? »,
// après dix minutes sans geste), dans les trois pages qui la posent : Défi tables,
// Défi calcul et SPLAT! (habillage commun assets/js/splat-suivi.js).
//
// Correctif du 08/10/2026 (relevé par Code sur la PR du lot splat-suivi-2) : la règle
// était écrite « font: 700 1.5rem/1.2 inherit ». Dans le raccourci « font », le mot
// « inherit » n'a le droit d'être que SEUL : mêlé à d'autres valeurs, le navigateur
// jette toute la déclaration. Le code tapé s'affichait donc en petit et maigre
// (13 px dans SPLAT!, 16 px dans Défi tables et Défi calcul) au lieu de 24 px gras.
// Écrit en propriétés séparées, il passe à 24 px gras ; le champ est élargi à 9 em
// pour que les six caractères les plus larges (WWWWWW) tiennent sans glisser.
// Mesuré au navigateur : banc banc_champ_code.py du lot splat-suivi-2b.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const racine = new URL("../", import.meta.url);
const lire = chemin => readFile(new URL(chemin, racine), "utf8");

// L'habillage de SPLAT! range son style dans un tableau de chaînes : on le recolle.
const styleHabillage = source => source.replace(/",\s*"/g, "");

const FICHIERS = [
  {nom: "SPLAT! (habillage commun)", chemin: "assets/js/splat-suivi.js", css: styleHabillage},
  {nom: "Défi tables", chemin: "outils/calcul_mental/defi_tables.html", css: s => s},
  {nom: "Défi calcul", chemin: "outils/calcul_mental/defi_calcul.css", css: s => s},
];

function regleChamp(css) {
  const m = css.match(/\.suivi-garde-code\s*\{([^}]*)\}/);
  assert.ok(m, "la règle .suivi-garde-code existe");
  const decl = {};
  for (const morceau of m[1].split(";")) {
    const i = morceau.indexOf(":");
    if (i > 0) decl[morceau.slice(0, i).trim()] = morceau.slice(i + 1).trim();
  }
  return decl;
}

// Un raccourci « font » qui mêle « inherit » à d'autres valeurs : le navigateur l'ignore.
const RACCOURCI_INVALIDE = /(?:^|[{;\s"])font\s*:(?!\s*inherit\s*[;}"])[^;{}"]*\binherit\b/;

for (const {nom, chemin, css} of FICHIERS) {
  test(`${nom} : le code tapé dans la garde s'affiche en 24 px gras (règle que le navigateur lit)`, async () => {
    const d = regleChamp(css(await lire(chemin)));
    assert.equal(d.font, undefined, "pas de raccourci « font » dans la règle du champ");
    assert.equal(d["font-size"], "1.5rem");
    assert.equal(d["font-weight"], "700");
    assert.equal(d["font-family"], "inherit", "la police de la page, pas celle des champs du système");
    assert.equal(d["line-height"], "1.2");
    assert.equal(d.width, "9em", "six caractères larges tiennent (6,5 em : WWWWWW glissait)");
    assert.equal(d["max-width"], "100%");
    assert.equal(d["min-height"], "48px", "la hauteur du champ ne change pas");
  });
}

test("aucun raccourci « font » avec « inherit » mêlé dans les pages et styles du suivi", async () => {
  const chemins = [...FICHIERS.map(f => f.chemin), "outils/calcul_mental/defi_calcul_modules.html",
    "outils/splat_univers.html", "outils/splat.html", "outils/splat_tache_barre.html", "outils/equasplat.html"];
  for (const chemin of chemins) {
    const source = await lire(chemin);
    source.split("\n").forEach((ligne, i) =>
      assert.doesNotMatch(ligne, RACCOURCI_INVALIDE, `${chemin}:${i + 1} — « inherit » seul ou propriétés séparées`));
  }
  // Le détecteur lui-même : il voit le défaut, et laisse passer « font: inherit » seul.
  assert.match(".x { font: 700 1.5rem/1.2 inherit; }", RACCOURCI_INVALIDE);
  assert.match('".x{font:700 1.5rem/1.2 inherit;', RACCOURCI_INVALIDE);
  assert.doesNotMatch(".x { font: inherit; font-weight: 800; }", RACCOURCI_INVALIDE);
  assert.doesNotMatch("    input { font: inherit; touch-action: manipulation; }", RACCOURCI_INVALIDE);
  assert.doesNotMatch('".x button{font:inherit;font-weight:800}', RACCOURCI_INVALIDE);
});

test("les pages rechargent les fichiers changés (?v= bumpé)", async () => {
  const modules = await lire("outils/calcul_mental/defi_calcul_modules.html");
  assert.doesNotMatch(modules, /defi_calcul\.css\?v=20261005-2"/, "Défi calcul : nouveau ?v= de defi_calcul.css");
  for (const page of ["outils/splat_univers.html", "outils/splat.html", "outils/splat_tache_barre.html", "outils/equasplat.html"]) {
    const html = await lire(page);
    assert.doesNotMatch(html, /splat-suivi\.js\?v=20261008-1"/, `${page} : nouveau ?v= de l’habillage`);
  }
});
