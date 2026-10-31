// Lot « Qui voit quoi », lot 4a (23/10/2026) : le serveur de suivi apprend
// Anzan. Ce fichier épingle le TEXTE des fichiers PHP et de l'espace élève (le
// test PHP de _serveur/tests/lancer.php, lui, fait passer les parcours par le
// vrai serveur) : les listes d'applis, la tuile et son dessin, verifier.php.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const catalogue = lire("_serveur/public/lib/applis.php");
const espace = lire("_serveur/public/index.php");

test("l'API élève accepte « flash-anzan », et le professeur peut le proposer à une classe ou le donner à un élève", () => {
  assert.match(lire("_serveur/public/api/parcours.php"), /const APPLIS_CONNUES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat'\];/,
    "sans « flash-anzan » ici, le premier envoi de l'appli répondrait « 400 Application inconnue »");
  assert.match(lire("_serveur/public/api/prof.php"), /const APPLIS_PROPOSABLES = \['defi-tables', 'coffres', 'flash-anzan', 'defi-calcul', 'automatismes', 'splat'\];/,
    "« Ce que voit Rania » et « Activités de la classe » passent par cette liste");
  const cles = [...catalogue.matchAll(/^\s{4}'([a-z0-9-]+)' => \[$/gm)].map(m => m[1]);
  assert.deepEqual(cles, ["defi-tables", "coffres", "flash-anzan", "defi-calcul", "automatismes", "splat", "soley"],
    "Anzan juste après Coffres : les applis de calcul mental ensemble, dans l'ordre du catalogue du site");
});

test("la tuile de Mon espace : le soroban comme dessin, et une ligne « N calculs · M jours d'entraînement » lue par le moteur", () => {
  const debut = espace.indexOf("  const ICONES = {");
  const icones = espace.slice(debut, espace.indexOf("\n  };", debut));
  assert.ok(icones.includes('"flash-anzan":'), "Anzan a son dessin (sinon : les quatre points par défaut)");
  const dessin = icones.slice(icones.indexOf('"flash-anzan":'), icones.indexOf('"automatismes":'));
  assert.match(dessin, /fill="#087a71"/, "les perles qui comptent, vert d'eau (la vignette du site)");
  assert.match(dessin, /fill="#10294a"/, "le cadre et la barre, bleu nuit");
  assert.equal((dessin.match(/<rect x="\d+" y="[\d.]+" width="6" height="3"/g) || []).length, 15, "trois tiges de cinq perles");
  const jauges = espace.slice(espace.indexOf("  const JAUGES = {"), espace.indexOf("  const moteursEnCours = {};"));
  assert.match(jauges, /"flash-anzan": \{\s*url: "prof\/flash_anzan_parcours\.js\?v=<\?= htmlspecialchars\(\$versionAnzan, ENT_QUOTES\) \?>",\s*global: "MathsGoFlashAnzanParcours",/);
  assert.match(jauges, /const resume = P\.resumeTuile\(brut\);\s*if \(resume\.vide\) return null;\s*return \{lignes: \[\{texte: resume\.texte, bonus: ""\}\]\};/,
    "rien tant qu'aucun calcul n'est fait ; les mots sont ceux du moteur");
  assert.doesNotMatch(jauges.slice(jauges.indexOf('"flash-anzan"')), /innerHTML/, "rien du serveur ne devient du HTML");
});

test("verifier.php contrôle le moteur Anzan servi localement", () => {
  const verifier = lire("_serveur/public/verifier.php");
  assert.match(verifier, /verif\(\$lignes, "Moteur Anzan servi localement", function \(\) \{\s*\$chemin = __DIR__ \. '\/prof\/flash_anzan_parcours\.js';/);
  assert.match(verifier, /'MathsGoFlashAnzanParcours'/);
});
