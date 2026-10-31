import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Serveur pro, lot 7 « la séance en direct, Infos et KaTeX 0.18.2 » (31/10/2026).
//
// La charte commune suivi.css est chargée par l'écran du tableau
// (prof/direct.php), l'écran de l'élève (direct.php) et Infos (infos.php),
// AVANT leur <style>, avec son empreinte dans l'adresse.
// Choix de Gwenaël (planches 1 et 3 du lot, 31/10/2026) : « ← Mon espace » est
// le bouton secondaire bleu de la charte ; dans Infos, les titres des cartes
// sont ceux de la charte (Georgia 20) en GRAS, comme tous les titres côté élève.
// Côté professeur, Claude décide : la scène projetée garde ses grandes tailles
// et ses titres gras (ce sont les élèves qui la lisent), le téléphone a un
// en-tête sur deux lignes au plus et une barre du bas en trois rangées.
// KaTeX passe de 0.16.47 à 0.18.2 (avis GHSA-238p-pmpm-9mq7), options de rendu
// inchangées.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const styleDe = page => page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
const tableau = lire("_serveur/public/prof/direct.php");
const eleve = lire("_serveur/public/direct.php");
const infos = lire("_serveur/public/infos.php");

test("les trois pages chargent suivi.css AVANT leur <style>, avec son empreinte", () => {
  for (const [nom, page, adresse, versionPhp] of [
    ["prof/direct.php", tableau, "../suivi.css", /\$versionCharte = \$versionDe\(__DIR__ \. '\/\.\.\/suivi\.css'\);/],
    ["direct.php", eleve, "suivi.css", /\$charte = __DIR__ \. '\/suivi\.css';\n\$versionCharte = is_file\(\$charte\) \? substr\(md5_file\(\$charte\), 0, 10\) : '0';/],
    ["infos.php", infos, "suivi.css", /\$charte = __DIR__ \. '\/suivi\.css';\n\$versionCharte = is_file\(\$charte\) \? substr\(md5_file\(\$charte\), 0, 10\) : '0';/],
  ]) {
    assert.match(page, versionPhp, `${nom} : l'empreinte de la charte`);
    const lien = page.indexOf(`<link rel="stylesheet" href="${adresse}?v=<?= htmlspecialchars($versionCharte, ENT_QUOTES) ?>">`);
    assert.ok(lien > 0, `${nom} charge la charte`);
    assert.ok(lien < page.indexOf("<style>"), `${nom} : la charte d'abord, le style de la page ensuite`);
  }
});

test("les trois pages ne recopient plus ce que la charte fait", () => {
  for (const [nom, page] of [["prof/direct.php", tableau], ["direct.php", eleve], ["infos.php", infos]]) {
    const style = styleDe(page);
    for (const regle of [":root {", "* { box-sizing", "header {", "header img {", ".barre { height", "button {",
      "button.secondaire {", "button.danger {", "select {", "dialog {", "dialog h2 {", ".message {", "[hidden]",
      ".bouton {", ".retour { display: block"]) {
      assert.ok(!style.includes("\n  " + regle), `${nom} recopie la charte : ${regle}`);
    }
    assert.match(page, /<header class="entete">/, `${nom} : l'en-tête de la charte`);
  }
});

test("le tableau : en-tête, pastille, message et fenêtres de la charte", () => {
  assert.match(tableau, /<header class="entete">\s*<img src="\.\.\/mathsgo-logo\.png" alt="maths&go">\s*<span class="titre">Séance en direct<\/span>\s*<span class="pastille teal" id="classe" hidden><\/span>/);
  assert.match(tableau, /<p class="message erreur" id="message" hidden><\/p>/);
  for (const id of ["fin", "quitter"]) {
    assert.match(tableau, new RegExp(`<dialog id="${id}" class="fenetre">\\s*<div class="fenetre-tete"><h2>`), `fenêtre ${id}`);
  }
  assert.match(tableau, /<dialog id="apercu" class="fenetre apercu">/);
  assert.match(tableau, /<dialog id="preparer" class="fenetre preparer">/);
  // Le nom de la classe vient du professeur (40 caractères) : il passe à la
  // ligne au lieu de pousser « Ma classe » hors de l'écran (leçon du lot 6).
  assert.match(styleDe(tableau), /#classe \{ white-space: normal; overflow-wrap: anywhere; min-width: 0; \}/);
});

test("le tableau : la scène projetée garde ses grandes tailles et ses titres gras", () => {
  const style = styleDe(tableau);
  assert.match(style, /#scene h1 \{ margin: 0; font: 700 clamp\(2rem, 5\.2vw, 3\.6rem\)\/1\.1 var\(--serif\);/);
  assert.match(style, /\.compteur \{ margin: 8px 0 0; font-size: clamp\(4\.5rem, 17vw, 12rem\);/);
  assert.match(style, /\.q-enonce \{[^}]*font-size: calc\(var\(--t\) \* clamp\(1\.5rem, min\(3\.9vw, 7vh\), 5\.4rem\)\)/);
  assert.match(style, /\.compte b \{ font-size: 32px;/, "le compteur de la barre : le « grand nombre » n1 de la charte");
});

test("le tableau : les cartes-réponses et les barres restent lisibles malgré les boutons de la charte", () => {
  // La charte donne aux boutons le texte blanc au survol, le centrage et
  // « pas de retour à la ligne » : une carte-réponse est un bouton.
  const style = styleDe(tableau);
  assert.match(style, /\.rep \{[^}]*justify-content: flex-start;[^}]*white-space: normal;/);
  assert.match(style, /button\.rep:hover \{ color: var\(--ink\);/);
  assert.match(style, /\.barres button \{[^}]*white-space: normal; \}/);
  assert.match(style, /\.barres button:hover \{ color: var\(--ink\);/);
});

test("le tableau au téléphone : deux lignes d'en-tête, trois rangées en bas, la figure au-dessus", () => {
  const style = styleDe(tableau);
  const debut = style.indexOf("@media (max-width: 600px)");
  assert.ok(debut > 0);
  const tel = style.slice(debut);
  assert.match(tel, /\.entete \{ flex-wrap: wrap;/);
  assert.match(tel, /\.q-corps \{ flex-direction: column; \}/);
  assert.match(tel, /\.commandes #case-tous \{ flex: 1 1 100%;/);
  assert.match(tel, /\.commandes #action \{ flex: 1 1 100%; \}/);
  assert.match(tel, /\.commandes #reglage-choix \{ font-size: 0;/);
  assert.match(tableau, /<select id="choix" aria-label="Réponses possibles">/, "le menu garde son nom pour le lecteur d'écran");
});

test("l'écran de l'élève : « ← Mon espace » bleu, titres gras, grosses touches inchangées", () => {
  const style = styleDe(eleve);
  assert.match(eleve, /<header class="entete">\s*<img src="mathsgo-logo\.png" alt="maths&go">\s*<div class="droite"><a class="bouton secondaire" href="\.\/" id="retour">← Mon espace<\/a><\/div>\s*<\/header>/);
  assert.match(style, /\n  h1 \{ margin: 0 0 4px; font-weight: 700;/);
  assert.match(style, /\.choix button \{\n    position: relative; min-height: clamp\(84px, 17vh, 132px\);[^}]*font-size: clamp\(2\.2rem, 9vw, 3\.2rem\); font-weight: 800;/);
  assert.match(style, /\.choix button:disabled \{ cursor: default; opacity: 1; \}/, "une touche fermée garde sa lettre lisible");
  assert.match(eleve, /<a class="bouton" href="\.\/" id="vers-espace" hidden>Retour à mon espace<\/a>/);
  assert.match(eleve, /<p class="message attention reseau" id="reseau" hidden>Connexion perdue\. Nouvel essai…<\/p>/);
});

test("Infos : la charte, titres des cartes en Georgia GRAS, toujours aucun lien qui sort", () => {
  const style = styleDe(infos);
  assert.match(infos, /<main class="etroit">/);
  assert.match(style, /\n  h1 \{ font-weight: 700;/);
  assert.match(style, /\.carte > h2:first-child \{ margin: 0 0 8px; font-weight: 700; \}/);
  assert.match(style, /\.parents \{ border-left: 5px solid var\(--teal\); background: var\(--teal-pale\); \}/);
  assert.match(style, /\.administratif \{ color: var\(--muted\); font-size: var\(--texte-secondaire\); \}/);
  assert.match(infos, /<a class="bouton retour" href="\.\/">← Retour à mon espace<\/a>/);
  const liens = [...infos.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(liens, ["mailto:gwenael@mathsgo.re?subject=Espace%20%C3%A9l%C3%A8ves%20maths%26go", "./"]);
});

test("KaTeX 0.18.2 : plus aucune trace de 0.16.47, mêmes options de rendu", () => {
  for (const dossier of ["assets/vendor", "_serveur/public/vendor"]) {
    assert.ok(existsSync(join(racine, dossier, "katex-0.18.2", "katex.min.js")), `${dossier}/katex-0.18.2`);
    assert.ok(!existsSync(join(racine, dossier, "katex-0.16.47")), `${dossier}/katex-0.16.47 doit disparaître`);
    assert.equal(readdirSync(join(racine, dossier, "katex-0.18.2", "fonts")).length, 20);
  }
  assert.match(lire("assets/vendor/katex-0.18.2/katex.min.js"), /version:"0\.18\.2"/);
  for (const page of ["outils/plateaux_manipulation/numeration_decimale.html", "outils/tuiles_algebriques/tuiles_algebriques.html",
    "outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html", "_serveur/public/prof/direct.php"]) {
    const texte = lire(page);
    assert.ok(!texte.includes("katex-0.16"), `${page} pointe encore vers une ancienne copie`);
    assert.ok(texte.includes("katex-0.18.2/katex.min.js"), `${page} charge KaTeX 0.18.2`);
  }
  assert.match(tableau, /const OPTIONS_KATEX = \{throwOnError: false, trust: false, strict: "ignore", maxSize: 20, maxExpand: 500\};/);
  // 0.18.0 préfixe les classes INTERNES (katex-base, katex-strut…) : aucune page
  // ne doit en viser une sous son ancien nom.
  for (const page of ["outils/plateaux_manipulation/numeration_decimale.html", "outils/tuiles_algebriques/tuiles_algebriques.html",
    "outils/tuiles_algebriques/tuiles_algebriques_mode_equation.html", "_serveur/public/prof/direct.php"]) {
    assert.doesNotMatch(styleDe(lire(page)), /\.(?:base|strut|vlist|mfrac|frac-line|sizing|reset-size\d*)\b/, page);
  }
});
