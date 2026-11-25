// Livret « Calcul littéral » (tuiles algébriques, lot 7 du 06/11/2026) : le livret a une vraie source
// (_sources/livret-litteral/), deux versions seulement (vert/rouge, blanc/gris) et les erreurs de l'audit
// ne reviennent pas. Les calculs eux-mêmes sont refaits par _sources/livret-litteral/verifier_calculs.py.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const racine = new URL("../", import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, racine), "utf8");
const existe = (chemin) => existsSync(new URL(chemin, racine));
const SOURCE = "_sources/livret-litteral/livret_litteral.html";

test("le livret a une source modifiable et un script de rendu en vrai Chromium", () => {
  for (const f of ["livret_litteral.html", "livret.css", "livret.js", "render.py", "verifier_calculs.py", "README.md"]) {
    assert.ok(existe(`_sources/livret-litteral/${f}`), f);
  }
  const render = lire("_sources/livret-litteral/render.py");
  assert.match(render, /launch\(channel="chromium"\)/);
  assert.match(render, /verifier_calculs\.py/);
  assert.match(render, /livret_litteral_vert_rouge\.pdf/);
  assert.match(render, /livret_litteral_blanc_gris\.pdf/);
});

test("deux versions seulement : vert/rouge en premier, puis blanc/gris", () => {
  assert.ok(existe("outils/tuiles_algebriques/livret_litteral_vert_rouge.pdf"));
  assert.ok(existe("outils/tuiles_algebriques/livret_litteral_blanc_gris.pdf"));
  assert.ok(!existe("outils/tuiles_algebriques/livret_litteral_bleu_jaune.pdf"));
  assert.ok(!existe("outils/tuiles_algebriques/livret_litteral_mathigon.pdf"));
  for (const f of ["assets/js/catalogue-refonte-data.js", "sitemap.xml", "outils/toutes-les-ressources.html", "scripts/uniformiser-pdf-sans-source.sh", "outils/SOURCES-GABARITS.md"]) {
    assert.doesNotMatch(lire(f), /livret_litteral_(bleu_jaune|mathigon)/, f);
  }
  const cat = lire("assets/js/catalogue-refonte-data.js");
  const groupe = cat.slice(cat.indexOf('"id": "cours-tuiles-algebriques"'));
  const chemins = groupe.slice(groupe.indexOf('"paths"'), groupe.indexOf("]")).match(/livret_litteral_\w+\.pdf/g);
  assert.deepEqual(chemins, ["livret_litteral_vert_rouge.pdf", "livret_litteral_blanc_gris.pdf"]);
  assert.match(groupe, /livrets\.png\?v=2/);
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=exerciseur-conversions-20261125-1/);
});

test("le dépôt sait que le livret a une source", () => {
  const doc = lire("outils/SOURCES-GABARITS.md");
  const avecSource = doc.slice(doc.indexOf("## PDF possédant une source HTML"), doc.indexOf("## PDF sans source exacte"));
  const sansSource = doc.slice(doc.indexOf("## PDF sans source exacte"), doc.indexOf("## PDF possédant des sources Python"));
  assert.match(avecSource, /_sources\/livret-litteral\/livret_litteral\.html/);
  assert.doesNotMatch(sansSource, /tuiles_algebriques/);
  assert.doesNotMatch(lire("scripts/uniformiser-pdf-sans-source.sh"), /livret_litteral/);
});

test("les PDF : 31 pages, Poppins et la lettre ronde de SPLAT! seulement", () => {
  for (const v of ["vert_rouge", "blanc_gris"]) {
    const pdf = readFileSync(new URL(`outils/tuiles_algebriques/livret_litteral_${v}.pdf`, racine)).toString("latin1");
    assert.equal(pdf.match(/\/Type\s*\/Page[^s]/g).length, 31, v);
    const polices = new Set([...pdf.matchAll(/\/BaseFont\s*\/[A-Z]{6}\+([A-Za-z-]+)/g)].map((m) => m[1].split("-")[0]));
    assert.deepEqual([...polices].sort(), ["Poppins", "SplatLettres"], v);
  }
});

test("la source garde les corrections de l'audit", () => {
  const s = lire(SOURCE);
  assert.equal(s.match(/<section class="page"/g).length, 31);
  // 1. Exercices 3 : plus deux fois (2x − 6)(3x − 5)
  assert.equal(s.match(/<m>\(2x - 6\)\(3x - 5\)<\/m>/g).length, 1);
  // 2. Activité 8 (modèle d'aire) : la grille 4 / −24x a −6x en tête de colonne, plus +9
  assert.match(s, /<td class="h tiret"><m>-6x<\/m><\/td><\/tr><tr><td class="h"><\/td><td>4<\/td><td class="tiret"><m>-24x<\/m><\/td>/);
  // 3. un seul titre pour l'activité 5
  const titres5 = [...s.matchAll(/data-sur="Activité 5" data-titre="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(titres5)], ["Développer et réduire"]);
  // 5. aucun tiret « - » ni x droit dans le texte rendu : tout passe par <m> (vérifié au rendu), et aucune police en dur
  assert.doesNotMatch(lire("_sources/livret-litteral/livret.css"), /font-family:[^;]*(Lato|FreeSerif|Times)/);
  // 6. couleurs exactes de l'appli
  const css = lire("_sources/livret-litteral/livret.css");
  for (const c of ["#72c475", "#2f7f35", "#ef3f35", "#a61f18"]) assert.ok(css.includes(c), c);
  assert.match(css, /SplatLettres-Italic\.woff2/);
  // 8. la légende de l'activité 2 a la tuile x²
  const a2 = s.slice(s.indexOf('data-sur="Activité 2"'), s.indexOf("Section A", s.indexOf('data-sur="Activité 2"')));
  assert.match(a2, /<tl u="[\d.]+">x2<\/tl>/);
  // 9. exercices 4 : « Section B (suite) » avant la question 2), et la question 1) existe
  assert.match(s, /<span class="n">1\)<\/span><span>Mali et Jayden/);
  assert.match(s, /Section B \(suite\)<\/b><span>Deux méthodes pour un même produit<\/span><\/h2>\s*<div class="bloc"[^>]*>\s*<div class="q"><span class="n">2\)/);
  // 10. « Exemple » partout, plus de « Modèle »
  assert.doesNotMatch(s, />Modèle</);
  // choix de Gwenaël : plus de x/2 ni x/3 + 8, activités 7 et 8 inversées
  assert.doesNotMatch(s, /x\/2|x\/3/);
  assert.ok(s.indexOf('data-sur="Activité 7" data-titre="Introduire la factorisation"') > 0);
  assert.ok(s.indexOf('data-sur="Activité 8" data-titre="Factoriser avec le modèle d’aire"') > s.indexOf('data-sur="Activité 7"'));
});

test("les calculs du livret sont justes (verifier_calculs.py)", (t) => {
  // python3 (Linux, CI) ou python (Windows) ; s'il n'y a pas de Python, le test est sauté.
  for (const py of ["python3", "python"]) {
    const r = spawnSync(py, ["_sources/livret-litteral/verifier_calculs.py"], { cwd: new URL(".", racine), encoding: "utf8" });
    const sortie = `${r.stdout || ""}${r.stderr || ""}`;
    if (/ERREURS/.test(sortie)) assert.fail(sortie);
    if (r.status === 0 && /toutes justes/.test(sortie)) return;
  }
  t.skip("Python absent : calculs non refaits ici");
});
