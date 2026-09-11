// Lot R2 (11/09/2026, après l'audit) : l'écran de résultat commence par un
// verdict. Ces tests lisent la source de la page : ils tiennent les textes et
// l'ordre des blocs, pas le rendu (joué au navigateur avant la livraison).
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

test("le verdict dit réussi, pas encore ou temps écoulé — et ce qui manquait", () => {
  assert.match(html, /function verdictSerie\(suivi, elapsed\) \{/);
  assert.match(html, /verdict\.titre = "Pas encore";\s*verdict\.score = `\$\{sur\(principal\.score, principal\.total\)\} — il en faut \$\{seuilDe\(principal\)\}`;/, "le score dit le seuil");
  assert.match(html, /const regle = \{entraine: "entrainement", validation: "validation", preparation: "validation", melange: "melange", etoile: "etoile"\}\[evenement\.type\];/, "le seuil vient des SEUILS du moteur, pas d’un nombre écrit en dur");
  assert.match(html, /const tempsEcoule = config\.duration !== null && remaining > 0;/);
  assert.match(html, /if \(principal && !principal\.reussi && tempsEcoule\) \{[\s\S]*?verdict\.classe = "is-temps";[\s\S]*?verdict\.titre = "Temps écoulé";/, "le temps écoulé est un verdict à part, en ambre");
  assert.match(html, /principal\.type === "entraine" \? "Entraînement réussi !"/);
  assert.match(html, /`\$\{sur\(principal\.score, principal\.total\)\} · \$\{principal\.reussites\} entraînement/, "un entraînement réussi dit où on en est des trois");
});

test("J’apprends n’a ni score ni temps : on s’entraîne, on ne se chronomètre pas", () => {
  assert.match(html, /if \(config\.mode === "learn"\) \{\s*verdict\.titre = `Table de \$\{config\.tables\[0\]\} terminée !`;/);
  assert.match(html, /\? "Les 11 produits construits sur le boulier"/);
  assert.match(html, /verdict\.config = `J’apprends · \$\{apprends\.termines\} activité/, "la ligne du dessous dit combien d’activités sont faites");
  assert.doesNotMatch(html, /11 questions/, "les perles ne sont pas « 11 questions »");
  assert.doesNotMatch(html, /Toutes les réponses que tu as données sont justes/, "et on ne félicite pas pour des réponses qu’il n’a pas tapées");
});

test("la fête est le cadre du verdict, et le rang s’y affiche une fois", () => {
  assert.match(html, /if \(fete\.principal\) \{[\s\S]*?verdict\.classe = "is-fete";/);
  assert.match(html, /verdict\.icone = "🎉";\s*verdict\.titre = `Table de \$\{validation\.table\} acquise !`;/);
  assert.match(html, /if \(rangMonte && !\(etoile && etoile\.couronne\)\) \{\s*verdict\.rang = rangMonte\.rang;/);
  assert.match(html, /<p id="result-rang" class="result-fete-rang" hidden><\/p>/);
  assert.match(html, /\.result-verdict\.is-champion \{ border-color: #e7c86a;/);
});

test("la suite tient en une phrase, et les nombres ne se coupent pas", () => {
  assert.match(html, /function suiteApresSerie\(evenements, fete\) \{/);
  assert.match(html, /if \(trouve\("melange-a-refaire"\)\) return `Refais ton mélange avec la table de \$\{fete\.validation\.table\}\$\{puis\}\.`;/, "mélange à refaire + table suivante = une phrase");
  assert.match(html, /if \(entraine && entraine\.reussi && entraine\.pret\) return "Tes trois entraînements sont réussis : tu peux valider ta table !";/);
  assert.match(html, /return fete\.etoile\.couronne \? "" : `Tente \$\{PARCOURS\.symboleEtoile\(fete\.etoile\.etoile \+ 1\)\}/);
  assert.match(html, /function soude\(texte\) \{/);
  assert.match(html, /\.replace\(\/\\bmin \(\\d\)\/g, "min\\u00a0\$1"\)/, "« 1 min 30 » reste sur une ligne (audit, A14)");
  assert.match(html, /\$\("result-score"\)\.textContent = soude\(verdict\.score\);/);
});

test("les corrections : les erreurs seules, les réponses justes repliées, jamais de cadre vert", () => {
  assert.match(html, /if \(wrongEntries\.length\) \{\s*const title = document\.createElement\("h2"\);/);
  assert.match(html, /details\.open = window\.matchMedia\("\(min-width: 1040px\)"\)\.matches;/, "ouvertes d’office sur ordinateur seulement");
  assert.match(html, /summary\.textContent = wrongEntries\.length\s*\? \(rightEntries\.length > 1 \? `Mes \$\{rightEntries\.length\} réponses justes` : "Ma réponse juste"\)\s*: \(rightEntries\.length > 1 \? `Voir mes \$\{rightEntries\.length\} réponses` : "Voir ma réponse"\);/);
  assert.doesNotMatch(html, /Aucune erreur à corriger/);
  assert.doesNotMatch(html, /is-clean/);
  assert.match(html, /\.corrections:empty \{ display: none; \}/);
});

test("téléphone : le bouton principal sur toute la largeur, Rejouer devant sur un échec, rien ne bouge dans le HTML", () => {
  assert.match(html, /\.result-actions \{ display: grid; grid-template-columns: 1fr 1fr; gap: 9px; \}/);
  assert.match(html, /\.result-actions > \.primary,\s*\.result\.is-rate \.result-actions > #retry \{ grid-column: 1 \/ -1; \}/);
  assert.match(html, /\.result-actions > #retry\[hidden\] \+ #result-open-parcours \{ grid-column: 1 \/ -1; \}/, "la révision, sans Rejouer, garde une ligne pleine");
  // L'ordre des trois boutons dans le HTML ne change pas : c'est le CSS qui
  // fait passer « Rejouer » devant (order: -1) sur un échec.
  assert.match(html, /<button id="result-accueil" class="primary" type="button">Ma table<\/button>\s*<button id="retry" class="secondary" type="button">Rejouer<\/button>/);
});

test("la révision garde son bilan et ses deux boutons, sans verdict réussi / raté", () => {
  assert.match(html, /\$\("result-title"\)\.textContent = "Révision terminée";/);
  assert.match(html, /\$\("result-score"\)\.textContent = `\$\{score\} sur \$\{total\} au premier essai`;/);
  assert.match(html, /encore\.textContent = "Encore une révision";/);
});
