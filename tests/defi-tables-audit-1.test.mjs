// Défi tables — audit 1 (30/09/2026) : le lot de corrections validé par
// Gwenaël (A, B, C, E, F, 1, 2, 3, 6, 8). Les morceaux qui décident sans le
// DOM sont EXÉCUTÉS tels qu'ils sont écrits dans la page ; le reste est lu
// dans la source, comme les autres tests de Défi tables.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

// Une fonction de la page, de « function nom( » jusqu'à son accolade fermante
// (indentation de six espaces, comme toutes les fonctions de l'appli).
function fonction(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.ok(debut > 0, `la fonction ${nom} existe`);
  const fin = html.indexOf("\n      }\n", debut);
  return html.slice(debut, fin + "\n      }".length);
}

function gestionnaireClavier() {
  // Le gestionnaire de la série (un autre, plus haut, gère le plein écran).
  const repere = 'document.addEventListener("keydown", event => {\n        if (!state.running) return;';
  const debut = html.indexOf(repere);
  assert.ok(debut > 0);
  assert.equal(html.indexOf(repere, debut + 1), -1, "un seul gestionnaire de la série");
  const fin = html.indexOf("\n      });", debut);
  return html.slice(debut + 'document.addEventListener("keydown", '.length, fin + "\n      }".length);
}

function jouerClavier({gardeVisible = false, dansLaGarde = false, key, repeat = false}) {
  const appels = {chiffres: [], suivant: 0, empeche: 0};
  const state = {running: true, answer: "", configuration: {mode: "validation"}};
  const handler = new Function("state", "gardeVisible", "activitePerles", "enterDigit", "renderInlineAnswer", "clearAnswerError", "next",
    `return ${gestionnaireClavier()};`)(
    state, gardeVisible, () => false, chiffre => appels.chiffres.push(chiffre), () => {}, () => {}, () => { appels.suivant += 1; });
  handler({
    key,
    repeat,
    target: {closest: selecteur => (dansLaGarde && selecteur === "#suivi-garde" ? {} : null)},
    preventDefault() { appels.empeche += 1; }
  });
  return appels;
}

test("A. « C’est toujours toi ? » : les touches vont au champ du code, jamais à la série", () => {
  // Reproduit : taper 7K3M9P donnait « KMP » dans le champ et 739 à la série.
  for (const key of ["7", "3", "9", "Enter", "Backspace"]) {
    const appels = jouerClavier({gardeVisible: true, dansLaGarde: true, key});
    assert.deepEqual(appels, {chiffres: [], suivant: 0, empeche: 0}, `« ${key} » reste au champ du code`);
  }
  // La question affichée suffit, même si la touche vient d'ailleurs que du
  // champ (l'élève a touché le voile) : chacune des deux gardes a son cas.
  assert.deepEqual(jouerClavier({gardeVisible: true, key: "7"}), {chiffres: [], suivant: 0, empeche: 0});
  // La cible dans la garde suffit, même si l'état n'est pas encore à jour.
  assert.deepEqual(jouerClavier({dansLaGarde: true, key: "7"}), {chiffres: [], suivant: 0, empeche: 0});
  // Sans la question, la série reçoit toujours ses chiffres.
  assert.deepEqual(jouerClavier({key: "7"}), {chiffres: ["7"], suivant: 0, empeche: 1});
});

test("B. Entrée gardée enfoncée ne saute pas la correction, et Suivant attend 700 ms après une erreur", () => {
  assert.deepEqual(jouerClavier({key: "Enter"}), {chiffres: [], suivant: 1, empeche: 1});
  assert.deepEqual(jouerClavier({key: "Enter", repeat: true}), {chiffres: [], suivant: 0, empeche: 1}, "la répétition de la touche est ignorée");
  assert.match(html, /const DELAI_LECTURE_CORRECTION_MS = 700;/);
  assert.match(html, /function showAnswerFeedback\([^)]*\) \{\s*state\.waitingForContinue = true;\s*state\.correctionAfficheeA = correct \? 0 : Date\.now\(\);/,
    "le délai part de l'affichage d'une correction — une bonne réponse n'attend pas");
  assert.match(html, /if \(state\.waitingForContinue\) \{\s*if \(state\.correctionAfficheeA && Date\.now\(\) - state\.correctionAfficheeA < DELAI_LECTURE_CORRECTION_MS\) return;\s*advanceAfterResponse\(\);/,
    "le bouton ne change pas d'aspect : l'appui trop rapide est seulement ignoré");
});

test("C. Temps écoulé : le score compte les réponses justes, le détail compte aussi les calculs passés", () => {
  // Lot « test : pas deux fois le même calcul » (16/10/2026) : assez de justes
  // mais un calcul raté deux fois → « mais 7 × 8 raté deux fois » au lieu du seuil.
  assert.match(html, /verdict\.score = `\$\{pluriel\(state\.correct, "juste"\)\} sur \$\{TOTAL\} en \$\{CORE\.durationLabel\(config\.duration\)\} — \$\{assez \? `mais \$\{libelleRateDeuxFois\(principal\)\} raté\\u00a0deux\\u00a0fois` : `il en faut \$\{seuilDe\(principal\)\}`\}`;/);
  assert.doesNotMatch(html, /pluriel\(state\.answered, "réponse"\)/);
  assert.match(html, /state\.correct \? pluriel\(state\.correct, "juste"\) : "",\s*fausses \? pluriel\(fausses, "erreur"\) : "",\s*passees \? pluriel\(passees, "passée"\) : ""\s*\]\.filter\(Boolean\)\.join\(", "\)/);
  const calculsPasses = new Function("state", `${fonction("calculsPasses")}; return calculsPasses();`);
  assert.equal(calculsPasses({responses: [{skipped: false}, {skipped: true}, undefined, {skipped: true}]}), 2);
  const pluriel = new Function(`${fonction("pluriel")}; return pluriel;`)();
  assert.equal(pluriel(1, "juste"), "1 juste");
  assert.equal(pluriel(12, "juste"), "12 justes");
  assert.equal(pluriel(2, "passée"), "2 passées");
});

test("E. un calcul raté revient demain — le détail d’une case, la boîte 1, la fiche", () => {
  // Lot « Mon parcours » (décisions 7 et 8) : « il reviendra demain dans ta
  // séance » ; la boîte touchée range ses calculs par JOUR de retour — un
  // calcul raté aujourd'hui sous « Demain » (tests/defi-tables-mon-parcours-lot.test.mjs
  // l'exécute) ; le délai de la boîte n'est plus dit, pas même dans l'aria.
  assert.match(html, /note = "Raté aujourd’hui : il reviendra demain dans ta séance\.";/);
  assert.match(html, /if \(fait\.erreur === aujourdhui\) return 1;/);
  assert.doesNotMatch(html, /Ratés : ils reviennent demain|SEUILS\.revision\.delais\[/, "plus de délai de boîte à l’écran");
  assert.doesNotMatch(html, /il revient tout de suite/);
  // En révision et dans J’apprends, le calcul repasse AUSSI en fin de série.
  assert.match(html, /question\.retry \? " · il revient" : ""/);
});

test("F. l’onglet qui redevient visible redessine l’accueil affiché (Mes calculs du jour après minuit)", () => {
  assert.match(html, /if \(document\.visibilityState === "hidden"\) envoyerAvantDeFermer\(\);[\s\S]{0,300}else if \(document\.visibilityState === "visible" && !\$\("intro"\)\.hidden && !\$\("mode-screen"\)\.hidden\) renderAccueil\(\);/);
});

test("1. test ou mélange ratés : les erreurs d’une table passée reviennent demain, celles d’une table pas passée envoient s’entraîner ; sans erreur, le temps a manqué", () => {
  // Lot « un seul système » (05/10/2026) : Mes calculs du jour ne prend que
  // les calculs des tables passées. Le test raté d'une table pas encore
  // passée n'annonce donc plus « reviennent demain » : il envoie s'entraîner.
  assert.match(html, /const melange = trouve\("melange"\);[\s\S]{0,400}?if \(validation && !validation\.reussi && !validation\.dejaAcquise\) return phraseTestRate\(\);\s*if \(\(validation && !validation\.reussi\) \|\| \(melange && !melange\.reussi\)\) return phraseErreursDemain\(\);\s*return "";/);
  const testRate = new Function("state", "TOTAL", `${fonction("calculsPasses")}\n${fonction("phraseTestRate")}; return phraseTestRate();`);
  const rate = (answered, correct, passees, index, duration = 90) => ({
    answered, correct, index, configuration: {duration},
    responses: Array.from({length: passees}, () => ({skipped: true}))
  });
  assert.equal(testRate(rate(20, 15, 0, 20), 20), "Entraîne‑toi, puis repasse le test.", "des erreurs : pas de « demain », la table n’est pas passée");
  assert.equal(testRate(rate(14, 12, 2, 20), 20), "Entraîne‑toi, puis repasse le test.", "les calculs passés comptent");
  assert.equal(testRate(rate(12, 12, 0, 12), 20), "Tu manques de temps : entraîne-toi, puis réessaie.", "sans erreur, le temps a manqué");
  assert.equal(testRate(rate(20, 20, 0, 20), 20), "");
  const phrase = new Function("state", "TOTAL", `${fonction("calculsPasses")}\n${fonction("phraseErreursDemain")}; return phraseErreursDemain();`);
  const serie = (answered, correct, passees, index, duration = 90) => ({
    answered, correct, index, configuration: {duration},
    responses: Array.from({length: passees}, () => ({skipped: true}))
  });
  assert.equal(phrase(serie(20, 15, 0, 20), 20), "Tes 5 erreurs reviennent demain dans Mes calculs. D’ici là, entraîne‑toi.");
  assert.equal(phrase(serie(14, 12, 2, 20), 20), "Ces 4 calculs reviennent demain dans Mes calculs. D’ici là, entraîne‑toi.", "les calculs passés comptent — lot E2 : « ces calculs », un calcul passé n’est pas une erreur");
  assert.equal(phrase(serie(0, 0, 1, 1), 20), "Ce calcul revient demain dans Mes calculs. D’ici là, entraîne‑toi.", "lot E2 : un seul calcul, passé");
  assert.equal(phrase(serie(12, 11, 0, 12), 20), "Ton erreur revient demain dans Mes calculs. D’ici là, entraîne‑toi.");
  assert.equal(phrase(serie(12, 12, 0, 12), 20), "Tu manques de temps : entraîne-toi, puis réessaie.");
});

test("1. validation ratée : « Je m’entraîne : … » en bouton bleu, l’entraînement que l’accueil conseille", () => {
  // L'ordre des boutons : le nouveau d'abord ; « Ma table » et « Rejouer » ne bougent pas.
  assert.match(html, /<button id="result-entraine" class="primary" type="button" hidden><\/button>\s*<button id="result-accueil" class="primary" type="button">Ma table<\/button>\s*<button id="retry" class="secondary" type="button">Rejouer<\/button>\s*<button id="result-open-parcours" class="secondary" type="button">Voir mon parcours<\/button>/);
  assert.match(html, /\.result\.avec-entraine \.result-actions > #retry \{ order: 0; color: var\(--blue\); border: 1px solid #c5d9e6; background: #fff; box-shadow: none; \}/, "Rejouer redevient secondaire");
  assert.match(html, /\.result\.avec-entraine \.result-actions > #retry \{ grid-column: auto; \}/, "téléphone : Ma table et Rejouer côte à côte");
  assert.match(html, /const conseil = validation && !validation\.reussi \? entrainementConseille\(validation\.table\) : null;/, "une validation ratée seulement");
  assert.match(html, /bouton\.textContent = `Je m’entraîne\\u00a0: \$\{conseil\.nom\}`;\s*\$\("result-accueil"\)\.classList\.remove\("primary"\);\s*\$\("result-accueil"\)\.classList\.add\("secondary"\);/);
  assert.match(html, /\$\("result-entraine"\)\.hidden = true;\s*\$\("result"\)\.classList\.remove\("avec-entraine"\);\s*if \(state\.configuration\.mode === "revision"\)/, "chaque fin de série repart sans le bouton");

  const noms = html.match(/const NOMS_ENTRAINEMENTS = Object\.freeze\(\{[^}]*\}\);/)[0];
  const conseille = (parcours, table) => new Function("PARCOURS", "parcours", `const SEANCE = false;\n${noms}\n${fonction("entrainementConseille")}; return entrainementConseille(${table});`)(PARCOURS, parcours);
  let parcours = PARCOURS.creerParcours();
  let conseil = conseille(parcours, 7);
  assert.equal(conseil.nom, "dans le désordre");
  assert.deepEqual(conseil.config, PARCOURS.configEntraine(7, "desordre"));
  parcours.tables[7].entraine.desordre = 2;
  conseil = conseille(parcours, 7);
  assert.equal(conseil.nom, "nombres manquants et divisions", "la même lecture que la tuile : le premier pas encore réussi");
  parcours.tables[7].entraine = {...parcours.tables[7].entraine, trous: 2, mixte: 2};
  conseil = conseille(parcours, 7);
  assert.equal(conseil.nom, "comme le test, en 2 min", "lot « un seul système » : la validation s’appelle « le test »");
  assert.deepEqual(conseil.config, PARCOURS.configValidation(7, 120));
});

test("2. le même vocabulaire partout : les trois entraînements, « sans chrono », « passée », « Tente », « sur »", () => {
  assert.match(html, /const NOMS_ENTRAINEMENTS = Object\.freeze\(\{desordre: "dans le désordre", trous: "nombres manquants et divisions", mixte: "résultats, nombres manquants et divisions"\}\);/);
  assert.match(html, /libelle: majuscule\(NOMS_ENTRAINEMENTS\[item\.entrainement\]\),/, "le panneau : « Dans le désordre », « Nombres manquants et divisions », « Résultats, nombres manquants et divisions » (lot « divisions »)");
  assert.doesNotMatch(html, /LIBELLES_ENTRAINEMENTS/, "plus aucun libellé d’entraînement pris au moteur");
  assert.doesNotMatch(html, /"les deux à la fois"|· les deux</, "lot 2b : « résultats et nombres manquants » partout, fiche comprise");
  assert.doesNotMatch(html, /sans chronomètre/i);
  // Lot « un seul système » : la table est « passée », partout.
  assert.match(html, /sousTitre: ligne\.acquise \? `passée le \$\{dateEnLettres\(ligne\.acquise\)\}`/);
  assert.match(html, /Ma table de \$\{table\} est passée depuis le \$\{dateEnLettres\(ligne\.acquise\)\}\./);
  assert.doesNotMatch(html, /`acquise le \$\{|est acquise depuis/);
  assert.doesNotMatch(html, /Tenter \$\{/);
  assert.match(html, /`Série précédente\\u00a0: \$\{previousScore\} sur \$\{TOTAL\}\.`/);
  // « 10 / 11 calculs sus » : les mêmes mots, dans deux morceaux qui
  // s'effacent sur les petits écrans (.compteur-mot, .compteur-suite).
  assert.match(html, /mot\.className = "compteur-mot";\s*mot\.textContent = " calculs";\s*const suite = document\.createElement\("span"\);\s*suite\.className = "compteur-suite";\s*suite\.textContent = " sus";\s*\$\("question-count"\)\.replaceChildren\(`\$\{completed\} \/ \$\{total\}`, mot, suite\);/);
  assert.match(html, /\$\("question-count"\)\.replaceChildren\(`\$\{completed\} \/ \$\{total\} cases`, suite\);/, "la bande : « cases complétées »");
});

test("8. les ronds gris lisibles, les sous-titres courts, « Tape » et « appuie »", () => {
  assert.match(html, /\.etape \.dots i\.is-check\.off \{ color: #698197; \}/);
  // Lot E1 : plus de rond ✓ ○ dans les panneaux du menu (liste simple).
  assert.doesNotMatch(html, /\.choix-activite \.etat/);
  assert.match(html, /detail: "20 questions · 2 min · avant le test",/);
  assert.match(html, /Mon parcours<small>tables, mélange, étoiles<\/small>/);
  assert.match(html, /"Tape une réponse ou appuie sur «\\u00a0Passer\\u00a0»\."/);
  // Lot « toujours toi » (11/11/2026) : la longue explication de la question
  // « C'est toujours toi ? » (« … Sinon, appuie sur « Non » … ») est retirée ;
  // il reste une ligne courte.
  assert.match(html, /<p class="cec-garde-consigne">Retape ton code pour continuer\.<\/p>/);
});

test("8. « ! ? : » ne se retrouvent jamais seuls en début de ligne dans les verdicts", () => {
  const soude = new Function(`${html.match(/function soude\(texte\) \{[\s\S]*?;\s*\}/)[0]}; return soude;`)();
  const nb = String.fromCharCode(160);
  assert.equal(soude("Bravo !"), `Bravo${nb}!`);
  assert.equal(soude("Table de 7 acquise !"), `Table de${nb}7 acquise${nb}!`);
  assert.equal(soude("Tu manques de temps : entraîne-toi, puis réessaie."), `Tu manques de temps${nb}: entraîne-toi, puis réessaie.`);
  assert.equal(soude("12 justes, 3 erreurs, 2 passées · 3 calculs non vus"), `12${nb}justes, 3${nb}erreurs, 2${nb}passées · 3${nb}calculs non vus`);
  assert.match(html, /etiquette\.textContent = "Et maintenant\\u00a0:";/);
});
