import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Serveur pro, lot 6 « l'entrée et Mon espace » (31/10/2026).
//
// L'espace élève (index.php) charge la charte commune suivi.css avant son
// <style>, qui ne garde que les six cases du code et les tuiles avec leurs
// jauges. Choix de Gwenaël (planches 4 et 5 du lot) : côté élève, les titres
// restent GRAS ; « Se déconnecter » est le bouton secondaire bleu de la
// charte ; sur la tuile Défi tables, la Légende s'écrit « 👑 Légende ».
// La connexion du professeur prend le dessin de l'entrée de l'élève : grand
// logo, carte centrée, bouton sur toute la largeur, sans en-tête.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/index.php");
const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = page.slice(page.indexOf(BALISE), page.indexOf("</script>", page.indexOf(BALISE)));
const prof = lire("_serveur/public/prof/index.php");
const styleProf = prof.slice(prof.indexOf("<style>"), prof.indexOf("</style>"));

test("Mon espace : suivi.css chargée AVANT le <style>, avec son empreinte", () => {
  assert.match(page, /\$charte = __DIR__ \. '\/suivi\.css';\n\$versionCharte = is_file\(\$charte\) \? substr\(md5_file\(\$charte\), 0, 10\) : '0';/);
  const lien = page.indexOf('<link rel="stylesheet" href="suivi.css?v=<?= htmlspecialchars($versionCharte, ENT_QUOTES) ?>">');
  assert.ok(lien > 0, "la page charge la charte, adresse relative (même dossier)");
  assert.ok(lien < page.indexOf("<style>"), "la charte d'abord, le style de la page ensuite");
});

test("Mon espace : le <style> ne recopie plus ce que la charte fait", () => {
  for (const regle of [":root {", "* { box-sizing", "body {", ".barre {", "header {", "main {", ".carte {",
    "button {", "button.secondaire {", ".actions {", ".erreur {", ".classe {", "footer {", "[hidden]"]) {
    assert.ok(!style.includes("\n  " + regle), `recopié de la charte : ${regle}`);
  }
  assert.doesNotMatch(style, /font-size: \.(?:9|92|86|82)rem/, "les tailles de texte sont celles de la charte (16 / 14)");
  assert.match(style, /\.appli strong \{[^}]*font-size: var\(--texte\);/);
  assert.match(style, /\.appli span \{[^}]*font-size: var\(--texte-secondaire\);/);
});

test("Mon espace : les classes de la charte (en-tête, pastille, message, pied, colonne étroite)", () => {
  assert.match(page, /<header class="entete">\s*<img src="mathsgo-logo\.png" alt="maths&go">\s*<div class="droite" id="entete-droite" hidden>\s*<span class="pastille teal" id="classe"><\/span>\s*<button type="button" class="secondaire" id="changer">Se déconnecter<\/button>/);
  assert.match(page, /<main class="etroit">/);
  assert.match(page, /<p class="message erreur" id="erreur" hidden><\/p>/);
  assert.match(page, /<footer class="pied">\s*<a href="infos\.php">Infos et confidentialité<\/a>\s*<\/footer>/);
  assert.match(style, /body\.sur-code \.entete \{ display: none; \}/, "le premier écran garde son grand logo, sans en-tête");
});

test("Mon espace : les titres de l'élève restent gras (seule exception à la charte)", () => {
  assert.match(style, /\n  h1 \{ font-weight: 700; \}\n/);
  assert.match(style, /#ecran-code h1 \{ font-size: 2\.15rem;/, "le grand titre du premier écran reste grand");
});

test("Mon espace : un nom de classe long passe à la ligne, « Se déconnecter » reste à l'écran", () => {
  // La pastille de la charte ne se coupe pas et .droite ne rétrécit pas : un
  // nom de 17 caractères débordait à 360 px, et 40 caractères sortaient le
  // bouton de l'écran à 390 px.
  assert.match(style, /\.entete \.droite \{ flex: 0 1 auto; min-width: 0; \}/);
  assert.match(style, /#classe \{ white-space: normal; overflow-wrap: anywhere; \}/);
  assert.match(style, /#changer \{ flex: none; \}/);
});

test("la porte Défi tables : l'insigne « Légende » (la couronne de l'appli), le nom entier pour le lecteur d'écran", () => {
  // Lot B1 : le badge de la tuile est devenu l'insigne de la porte.
  const debut = script.indexOf("  function insigneDe(");
  const insigne = script.slice(debut, script.indexOf("\n  }\n", debut));
  assert.match(insigne, /if \(r\.cle === "legende"\) insigne\.append\(dessinCouronne\(\), document\.createTextNode\("Légende"\)\);/);
  assert.match(insigne, /insigne\.setAttribute\("aria-label", `Mon rang : \$\{texteCourt\(r\.lu \|\| r\.nom\)\}`\);/);
});

test("la connexion du professeur : grand logo, carte centrée, bouton large, sans en-tête", () => {
  assert.match(prof, /<section id="ecran-connexion">\s*<img class="logo-accueil" src="\.\.\/mathsgo-logo\.png" alt="maths&amp;go" width="180" height="84">\s*<h1>Suivi des élèves<\/h1>/);
  assert.match(prof, /<div class="carte">\s*<form id="form-connexion"/, "plus de largeur écrite dans la balise");
  assert.match(styleProf, /body:has\(#ecran-connexion:not\(\[hidden\]\)\) \.entete \{ display: none; \}/);
  assert.match(styleProf, /#ecran-connexion \{ text-align: center;/);
  assert.match(styleProf, /#ecran-connexion \.carte \{ max-width: 420px; margin: 0 auto; text-align: left; \}/);
  assert.match(styleProf, /#ecran-connexion \.actions button \{ flex: 1 1 100%; \}/);
});
