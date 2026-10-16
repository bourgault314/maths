// Lot R2 (11/09/2026, après l'audit) : l'écran de résultat commence par un
// verdict. Ces tests lisent la source de la page : ils tiennent les textes et
// l'ordre des blocs, pas le rendu (joué au navigateur avant la livraison).
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

test("le verdict dit réussi, pas encore ou temps écoulé — et ce qui manquait", () => {
  assert.match(html, /function verdictSerie\(suivi, elapsed\) \{/);
  assert.match(html, /verdict\.titre = "Pas encore";\s*verdict\.config = rappelCourt\(\);[\s\S]{0,700}?: `\$\{sur\(principal\.score, principal\.total\)\} — il en faut \$\{seuilDe\(principal\)\}`;/, "le score dit le seuil");
  // Audit 1 (30/09/2026, Gwenaël) : sur un écran raté, plus de « 20 questions · 1 min 30 » sous le score.
  assert.match(html, /const rappelCourt = \(\) => \{\s*const parts = configurationLabel\(config\)\.split\(" · "\);\s*const melange = config\.mode === "validation" && config\.tables\.length > 1;\s*return parts\.slice\(0, melange \? 2 : 1\)\.join\(" · "\);/, "le rappel court garde l’épreuve, et les tables d’un mélange");
  assert.match(html, /verdict\.titre = "Temps écoulé";\s*verdict\.config = rappelCourt\(\);/, "le temps écoulé aussi");
  // Lot « Les records » : la couronne a son seuil à elle (erreursMaxEtoile) ; les autres viennent des SEUILS.
  assert.match(html, /if \(evenement\.type === "etoile"\) return evenement\.total - PARCOURS\.erreursMaxEtoile\(evenement\.etoile\);\s*const regle = \{entraine: "entrainement", validation: "validation", preparation: "validation", melange: "melange"\}\[evenement\.type\];/, "le seuil vient des SEUILS du moteur, pas d’un nombre écrit en dur");
  assert.match(html, /const tempsEcoule = config\.duration !== null && remaining > 0;/);
  assert.match(html, /if \(principal && !principal\.reussi && tempsEcoule\) \{[\s\S]*?verdict\.classe = "is-temps";[\s\S]*?verdict\.titre = "Temps écoulé";/, "le temps écoulé est un verdict à part, en ambre");
  assert.match(html, /principal\.type === "entraine" \? "Entraînement réussi !"/);
  assert.match(html, /`\$\{sur\(principal\.score, principal\.total\)\} · \$\{principal\.reussites\} entraînement/, "un entraînement réussi dit où on en est des trois");
});

test("J’apprends n’a ni score ni temps : on s’entraîne, on ne se chronomètre pas", () => {
  // Audit 1 (30/09/2026) : le titre dit l'activité qui vient de finir.
  assert.match(html, /verdict\.titre = activitePerles\(config\) \? "Perles terminées !"\s*: config\.learnActivity === "construct" \? "Bande terminée !"\s*: config\.learnActivity === "gaps" \? "Bande complétée !"\s*: "Série terminée !";/);
  assert.match(html, /\? "Les 10 cases construites sur le boulier"/, "lot E2 : comme le compteur « 10 / 10 cases »");
  assert.match(html, /verdict\.config = `J’apprends · Table de \$\{config\.tables\[0\]\}`;/, "la ligne du dessous dit la table");
  assert.doesNotMatch(html, /activité\$\{apprends\.termines > 1/, "plus de « N activités sur 5 faites »");
  assert.doesNotMatch(html, /11 questions/, "les perles ne sont pas « 11 questions »");
  assert.doesNotMatch(html, /Toutes les réponses que tu as données sont justes/, "et on ne félicite pas pour des réponses qu’il n’a pas tapées");
});

test("la fête est le cadre du verdict, et le rang s’y affiche une fois", () => {
  assert.match(html, /if \(fete\.principal\) \{[\s\S]*?verdict\.classe = "is-fete";/);
  assert.match(html, /verdict\.icone = "🎉";\s*verdict\.titre = `Table de \$\{validation\.table\} passée !`;/, "lot « un seul système » : la table est « passée »");
  assert.match(html, /if \(rangMonte && !\(etoile && etoile\.couronne\)\) \{\s*verdict\.rang = rangMonte\.rang;/);
  assert.match(html, /<p id="result-rang" class="result-fete-rang" hidden><\/p>/);
  assert.match(html, /\.result-verdict\.is-champion \{ border-color: #e7c86a;/);
});

// Lot « un seul système » (05/10/2026) : plus de mélange dû, donc plus de
// « Refais ton mélange… » ni de « Réussis d'abord ton mélange… » ; après une
// table passée, la suite ne dit que la table suivante (ou l'escalier ouvert).
test("la suite tient en une phrase, sans mélange à refaire (une coupe gagnée se dit), et les nombres ne se coupent pas", () => {
  assert.match(html, /function suiteApresSerie\(evenements, fete\) \{/);
  const suite = html.slice(html.indexOf("function suiteApresSerie(evenements, fete) {"), html.indexOf("function phraseTestRate() {"));
  assert.match(suite, /if \(trouve\("toutes-acquises"\)\) return "Tes 9 tables sont passées : l’escalier des étoiles est ouvert !";\s*return suivante \? `On continue avec la table de \$\{suivante\}\.` : "";/, "table passée : la table suivante, ou l’escalier ouvert par la neuvième");
  assert.doesNotMatch(suite, /melange-a-refaire|melange-debloque|verrouillee|escalierOuvert/, "plus aucun événement du mélange obligatoire");
  assert.doesNotMatch(suite, /Refais ton mélange|réussis ton mélange|Réussis d’abord ton mélange|Réussis le mélange/, "ni aucune de ses phrases");
  // Lot « trophées » : Mon mélange réussi n'ouvre rien — il dit la coupe
  // gagnée, et rien quand il n'en gagne pas (le verdict suffit).
  assert.match(suite, /if \(fete\.melange\) return fete\.melange\.trophee \? `Tu gagnes la coupe des \$\{fete\.melange\.trophee\} tables\\u00a0!` : "";/, "Mon mélange réussi : la coupe gagnée, sinon rien");
  assert.match(suite, /\? "Maintenant, passe le test en 1 min 30\."/);
  // Lot dosage + validation : « tu peux valider » seulement quand les 8
  // calculs sont en boîte 3 ; sinon la phrase du rendez-vous, la même que l’accueil.
  assert.match(html, /if \(!entraine\.validation \|\| entraine\.validation\.prete\) return "Tes trois entraînements sont réussis : tu peux passer le test !";/);
  assert.match(html, /return `Tes trois entraînements sont réussis ! \$\{phraseRendezVous\(entraine\.validation, entraine\.table\)\}`;/);
  assert.match(html, /return fete\.etoile\.couronne \? "" : `Tente \$\{PARCOURS\.symboleEtoile\(fete\.etoile\.etoile \+ 1\)\}/);
  assert.match(html, /function soude\(texte\) \{/);
  assert.match(html, /\.replace\(\/\\bmin \(\\d\)\/g, "min\\u00a0\$1"\)/, "« 1 min 30 » reste sur une ligne (audit, A14)");
  assert.match(html, /\$\("result-score"\)\.textContent = soude\(verdict\.score\);/);
  // Relecture (Claude Code, 11/09) : la fonction elle-même, jouée sur les
  // phrases du verdict. « il en faut 18 » reste entier : à 390 px, « il en /
  // faut 18 » se coupait sous « Temps écoulé ».
  const soude = new Function(`${html.match(/function soude\(texte\) \{[\s\S]*?;\s*\}/)[0]}; return soude;`)();
  const nb = String.fromCharCode(160);
  assert.equal(soude("4 réponses sur 20 en 1 min 30 — il en faut 18"), `4${nb}réponses sur${nb}20 en 1${nb}min${nb}30 — il${nb}en${nb}faut${nb}18`);
  assert.equal(soude("On continue avec la table de 3."), `On continue avec la table de${nb}3.`);
  assert.equal(soude("Maintenant, passe le test en 1 min 30."), `Maintenant, passe le test en 1${nb}min${nb}30.`);
});

test("les corrections : les erreurs seules, les réponses justes repliées, jamais de cadre vert", () => {
  assert.match(html, /if \(wrongEntries\.length\) \{\s*const title = document\.createElement\("h2"\);/);
  assert.match(html, /details\.open = window\.matchMedia\("\(min-width: 1040px\)"\)\.matches;/, "ouvertes d’office sur ordinateur seulement");
  assert.match(html, /summary\.textContent = wrongEntries\.length\s*\? \(rightEntries\.length > 1 \? `Mes \$\{rightEntries\.length\} réponses justes` : "Ma réponse juste"\)\s*: \(rightEntries\.length > 1 \? `Voir mes \$\{rightEntries\.length\} réponses` : "Voir ma réponse"\);/);
  assert.doesNotMatch(html, /Aucune erreur à corriger/);
  assert.doesNotMatch(html, /is-clean/);
  assert.match(html, /\.corrections:empty \{ display: none; \}/);
  // Relecture (Claude Code, 11/09) : un calcul passé (« Passer ») n'a pas de
  // réponse à barrer — « Pas de réponse » reste lisible, sans trait.
  assert.match(html, /passe: Boolean\(response\.skipped\),/);
  assert.match(html, /if \(entry\.passe\) \{\s*given\.classList\.add\("is-passe"\);\s*given\.setAttribute\("aria-label", "Pas de réponse"\);/);
  assert.match(html, /\.given-answer\.is-passe \{ padding: 0; background: none; \}/, "« Pas de réponse » n'est pas barré (trait en biais, lot « la flèche de retour »)");
});

test("téléphone : le bouton principal sur toute la largeur, Rejouer devant sur un échec, rien ne bouge dans le HTML", () => {
  assert.match(html, /\.result-actions \{ display: grid; grid-template-columns: 1fr 1fr; gap: 9px; \}/);
  assert.match(html, /\.result-actions > \.primary,\s*\.result\.is-rate \.result-actions > #retry \{ grid-column: 1 \/ -1; \}/);
  assert.match(html, /\.result-actions > #retry\[hidden\] \+ #result-open-parcours \{ grid-column: 1 \/ -1; \}/, "la révision, sans Rejouer, garde une ligne pleine");
  // L'ordre des trois boutons dans le HTML ne change pas : c'est le CSS qui
  // fait passer « Rejouer » devant (order: -1) sur un échec.
  assert.match(html, /<button id="result-accueil" class="primary" type="button">Ma table<\/button>\s*<button id="retry" class="secondary" type="button">Rejouer<\/button>/);
});

test("le mode site (Réglages libres, éval CM1) reste neutre : ni vert, ni rouge, ni « Temps écoulé »", () => {
  // 11/09, après le rejeu de Code : un 15/25 en CM1 affichait ✗ rouge au-dessus
  // d'un message-conseil positif, et le chrono écoulé — la règle en CM1 —
  // titrait « Temps écoulé ». Rien n'est à valider en mode site.
  assert.match(html, /verdict\.classe = "is-neutre";/);
  assert.match(html, /\.result\.is-neutre \.result-verdict \{ border-color: var\(--line\); background: #f6f9fb; \}/);
  assert.match(html, /\.result\.is-neutre \.hero-icon \{ display: none; \}/);
  assert.match(html, /result\.classList\.remove\("is-fete", "is-rate", "is-temps", "is-neutre", "is-revision"\);/);
  assert.doesNotMatch(html, /const reussi = state\.correct >= Math\.ceil\(TOTAL \* \.8\);/, "plus de seuil à 80 % en mode site");
});

test("la révision garde son bilan et ses boutons, sans verdict réussi / raté", () => {
  assert.match(html, /\$\("result-title"\)\.textContent = "Révision terminée";/);
  // Relecture (Claude Code, 11/09) : le temps rejoint le score, comme sur les
  // autres verdicts — plus de « Série terminée en 13 s. » sous « Révision terminée ».
  assert.match(html, /\$\("result-score"\)\.textContent = soude\(`\$\{score\} sur \$\{total\} au premier essai · \$\{formatElapsed\(elapsed\)\}`\);/);
  // « Série terminée ! » est devenu le titre de J’apprends (audit 1) : c'est
  // l'écran de la révision qui ne doit pas le dire.
  const debutRevision = html.indexOf("function finishRevision() {");
  const finRevision = html.slice(debutRevision, html.indexOf("\n      function ", debutRevision));
  assert.match(finRevision, /"Révision terminée"/, "c'est bien la fonction de fin de révision");
  assert.doesNotMatch(finRevision, /Série terminée/);
  // Lot mémoire : « Continuer → » tant qu'il reste des calculs du jour, puis
  // « Reviens demain : N calculs t'attendront » — plus de « Encore une révision ».
  assert.match(html, /encore\.textContent = "Continuer\u00a0→";/);
  assert.doesNotMatch(html, /Encore une révision/);
});
