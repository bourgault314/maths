import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";

const require = createRequire(import.meta.url);
const core = require("../outils/calcul_mental/defi_tables_core.js");
const { ACTIVITES_APPRENDS } = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html =await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const revisionPdf = await readFile(new URL("../outils/calcul_mental/fiche_tables_multiplication.pdf", import.meta.url));
const editableSource = await readFile(new URL("../_sources/defi-tables/fiche_tables_multiplication.docx", import.meta.url));

function seededRandom(seed = 123456789) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

test("les cinq parcours gardent les réglages pédagogiques décidés", () => {
  assert.deepEqual(core.PRESETS.learn, {
    total: 11,
    duration: null,
    questionTypes: ["direct"],
    selection: "single",
    order: "ordered",
    learnActivity: "construct"
  });
  assert.deepEqual(core.PRESETS.train, {
    total: 10,
    duration: null,
    questionTypes: ["direct"],
    selection: "multiple",
    order: "random"
  });
  assert.deepEqual(core.PRESETS.test, {
    total: 25,
    duration: 120,
    questionTypes: ["direct"],
    selection: "multiple",
    order: "random",
    testLevel: 1
  });
  assert.deepEqual(core.PRESETS.evaluation, {
    total: 25,
    duration: 60,
    questionTypes: ["evaluation"],
    selection: "automatic",
    order: "random"
  });
});

test("J’apprends laisse choisir le bâton, l’ordre ou le désordre", () => {
  const construct = core.generateQuestions({mode: "learn", tables: [9], learnActivity: "construct"}, seededRandom());
  const gaps = core.generateQuestions({mode: "learn", tables: [9], learnActivity: "gaps"}, seededRandom());
  const ordered = core.generateQuestions({mode: "learn", tables: [9], learnActivity: "ordered"}, seededRandom());
  const random = core.generateQuestions({mode: "learn", tables: [9], learnActivity: "random"}, seededRandom());

  assert.equal(core.normalizeConfiguration({mode: "learn", tables: [9]}).learnActivity, "construct");
  assert.deepEqual(construct.map(question => question.multiplier), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(construct.every(question => question.learnActivity === "construct"));
  assert.equal(gaps.length, 8);
  assert.deepEqual(gaps.map(question => question.multiplier).toSorted((a, b) => a - b), [1, 2, 3, 4, 6, 7, 8, 9]);
  assert.equal(core.normalizeConfiguration({mode: "learn", tables: [9], learnActivity: "gaps"}).total, 8);
  assert.equal(ordered.length, 11);
  assert.deepEqual(ordered.map(question => question.multiplier), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(ordered.every(question => question.type === "direct" && question.focusTable === 9));
  assert.deepEqual(random.map(question => question.multiplier).toSorted((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.notDeepEqual(random.map(question => question.multiplier), ordered.map(question => question.multiplier));
  assert.ok(random.every(question => question.learnActivity === "random"));
  assert.throws(() => core.generateQuestions({mode: "learn", tables: [7, 9]}), /exactement une table/);
});

test("Je m’entraîne propose 10 ou 20 produits directs sans limite de temps", () => {
  const shortConfiguration = core.normalizeConfiguration({mode: "train", tables: [6, 7]});
  const longConfiguration = core.normalizeConfiguration({mode: "train", tables: [6, 7], total: 20});
  const shortQuestions = core.generateQuestions(shortConfiguration, seededRandom());
  const longQuestions = core.generateQuestions(longConfiguration, seededRandom());

  assert.equal(shortConfiguration.duration, null);
  assert.equal(shortQuestions.length, 10);
  assert.equal(longQuestions.length, 20);
  assert.ok(longQuestions.every(question => question.type === "direct"));
  assert.deepEqual(new Set(longQuestions.map(question => question.focusTable)), new Set([6, 7]));
  assert.equal(longQuestions.filter(question => question.focusTable === 6).length, 10);
  assert.equal(longQuestions.filter(question => question.focusTable === 7).length, 10);
  assert.ok(longQuestions.every(question => question.multiplier >= 1));
});

test("Je deviens expert propose trois niveaux et une à trois minutes", () => {
  const level1 = core.normalizeConfiguration({
    mode: "test",
    tables: [3, 4, 8],
    total: 10,
    duration: null,
    questionTypes: ["division"],
    testLevel: 1
  });
  const level2 = core.normalizeConfiguration({mode: "test", tables: [3, 4, 8], duration: 60, testLevel: 2});
  const level3 = core.normalizeConfiguration({mode: "test", tables: [3, 4, 8], duration: 180, testLevel: 3});
  const questions1 = core.generateQuestions(level1, seededRandom());
  const questions2 = core.generateQuestions(level2, seededRandom());
  const questions3 = core.generateQuestions(level3, seededRandom());

  assert.equal(level1.total, 25);
  assert.equal(level1.duration, 120);
  assert.deepEqual(level1.questionTypes, ["direct"]);
  assert.equal(questions1.length, 25);
  assert.ok(questions1.every(question => question.category === "direct"));

  assert.equal(level2.duration, 60);
  assert.deepEqual(new Set(questions2.map(question => question.category)), new Set(["direct", "missing"]));

  assert.equal(level3.duration, 180);
  assert.deepEqual(new Set(questions3.map(question => question.category)), new Set(["direct", "missing", "division"]));
  assert.deepEqual(
    new Set(questions3.filter(question => question.category === "division").map(question => question.type)),
    new Set(["division-quotient", "division-dividend", "division-divisor"])
  );
  assert.ok(questions3.some(question => /^\? ÷ \d+ = \d+$/.test(question.prompt)));
  assert.ok(questions3.some(question => /^\d+ ÷ \? = \d+$/.test(question.prompt)));
  assert.ok(questions3.some(question => /^\d+ ÷ \d+ = \?$/.test(question.prompt)));
});

test("Réglages permet de mélanger produits, trous et divisions", () => {
  const configuration = core.normalizeConfiguration({
    mode: "custom",
    tables: [4, 6],
    questionTypes: ["direct", "missing", "division"],
    total: 25,
    duration: 120
  });
  const questions = core.generateQuestions(configuration, seededRandom());
  const categories = new Set(questions.map(question => question.category));

  assert.equal(configuration.total, 25);
  assert.equal(configuration.duration, 120);
  assert.deepEqual(categories, new Set(["direct", "missing", "division"]));
  assert.ok(questions.filter(question => question.category === "division").every(question => question.prompt.includes("÷")));
});

test("le parcours CM1 conserve son mélange spécifique", () => {
  const questions = core.generateQuestions({mode: "evaluation"}, seededRandom());

  assert.equal(questions.length, 25);
  assert.equal(questions.filter(question => question.type !== "direct").length, 6);
  assert.ok(questions.every(question => question.type === "direct" || ["right", "left"].includes(question.type)));
  assert.ok(questions.every(question => question.first >= 1 && question.second >= 1));
});

test("l’accueil « Ma table » a remplacé les cinq cartes ; Réglages libres et l’évaluation CM1 restent des portes du mode site", () => {
  // Lot 2 (08/09/2026) : plus aucune carte de mode, plus de « Comment veux-tu
  // travailler ? ». Les deux seuls [data-mode] qui restent sont les petits liens
  // pour les professeurs, cachés sous un code (tests/defi-tables-accueil.test.mjs).
  assert.doesNotMatch(html, /class="mode-card/);
  assert.doesNotMatch(html, /Comment veux-tu travailler/);
  assert.doesNotMatch(html, /data-mode="learn"|data-mode="train"|data-mode="test"/);
  assert.match(html, /class="acc-site" type="button" data-mode="custom"[^>]*>Réglages libres</);
  assert.match(html, /class="acc-site" type="button" data-mode="evaluation"[^>]*>Évaluation CM1</);
  assert.match(html, /id="acc-etapes"/);
  assert.doesNotMatch(html, /revision-sheet-action/);
  assert.match(html, /data-question-type="division"[\s\S]*Division/);
  assert.match(html, /data-test-level="1"[\s\S]*Niveau 1/);
  assert.match(html, /data-test-level="2"[\s\S]*Niveau 2/);
  assert.match(html, /data-test-level="3"[\s\S]*Niveau 3/);
  assert.match(html, /data-duration="180"[\s\S]*3 min/);
  assert.match(html, /data-duration="120"[\s\S]*2 min/);
  assert.match(html, /data-duration="60"[\s\S]*1 min/);
  assert.match(html, /count-settings[\s\S]*data-total="10"[\s\S]*data-total="20"/);
  assert.match(html, /data-learn-activity="construct"[\s\S]*Je construis la bande/, "lot 4b : le bâton s’appelle la bande");
  assert.match(html, /class="type-button is-selected"[^>]*data-learn-activity="construct"/);
  assert.match(html, /data-learn-activity="gaps"[\s\S]*Je complète une bande à trous/);
  assert.doesNotMatch(html, /bâton/, "le mot ne survit nulle part dans la page (number-stick-* reste le nom interne)");
  assert.match(html, /data-learn-activity="ordered"[\s\S]*Je réponds dans l’ordre/);
  assert.match(html, /data-learn-activity="random"[\s\S]*Je réponds dans le désordre/);
  assert.doesNotMatch(html, /Choisis ton objectif\. L’application prépare le reste pour toi/);
  assert.doesNotMatch(html, /Tu verras ses dix produits/);
});

test("la réponse s’affiche dans le calcul sans déplacer le clavier", () => {
  assert.match(html, /className = "inline-answer"/);
  assert.match(html, /replaceChildren\(document\.createTextNode\(before\), slot/);
  assert.doesNotMatch(html, /id="answer"/);
  assert.match(html, /\.answer-feedback \{[\s\S]*min-height:/);
  assert.match(html, /@media \(max-width: 620px\)[\s\S]*\.fullscreen-toggle \{ display: none; \}/);
});

test("J’apprends et Je m’entraîne démarrent directement, les autres parcours gardent leur confirmation", () => {
  assert.match(html, /id="launch-summary"/);
  assert.match(html, /id="launch-start"[\s\S]*C’est parti/);
  assert.match(html, /\$\("launch-start"\)\.addEventListener\("click", beginRound\)/);
  assert.doesNotMatch(html, /setTimeout\(beginRound/);
  assert.match(html, /if \(config\.mode === "learn" \|\| config\.mode === "train"\) \{[\s\S]*beginRound\(\);[\s\S]*return;/);
  assert.match(html, /de ×0 à ×10/);
  // Lot « Mon parcours » : « 25 questions » et la durée insécables (ils se coupaient au téléphone).
  assert.match(html, /produits, trous, divisions · \$\{insecable\("25 questions"\)\}/, "lot 3 : une marche de l’escalier, tout dedans, seule la durée change");
});

test("J’apprends garde la bande pour construire et la propose en aide temporaire pour mémoriser", () => {
  assert.match(html, /class="keypad"[\s\S]*class="actions"[\s\S]*id="learn-sequence"/);
  assert.match(html, /question-card"\)\.classList\.toggle\("show-learn-sequence", visible\)/);
  assert.match(html, /\.question\.show-learn-sequence \.actions \{ margin-bottom: 0; \}/);
  assert.match(html, /function createNumberStick/);
  assert.match(html, /grid-template-columns: repeat\(11/);
  // Lot 4a (09/09/2026) : l'étiquette porte la multiplication entière et
  // collée (« 0×3 … 10×3 ») au lieu de « ×0, ×1 », qui se lit « fois zéro »,
  // à l'envers du sens n × table retenu avec Claire. Collée partout : à onze
  // cases sur un téléphone, « 10 × 3 » ne tient pas dans la case.
  // R4 bis : le texte « n×t » est dans un span (multiplier, « × », table).
  assert.match(html, /texte\.append\(String\(multiplier\), fois, String\(table\)\);/);
  assert.match(html, /multiplierLabel\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(html, /cell\.append\(multiplierLabel, value\)/);
  assert.match(html, /const visible = state\.configuration\?\.mode === "learn"/);
  assert.match(html, /state\.revealedLearnResults\.add\(question\.multiplier\)/);
  assert.match(html, /config\.learnActivity === "gaps" \? \[0, 5, 10\] : config\.learnActivity === "beads" \? \[0\] : \[\]/,
    "« à trous » commence avec ×0, ×5 et ×10 remplis ; « je pousse les perles » avec la seule case 0 (0 × table = 0, sans geste)");
  // Audit 4 : dans l’ordre et le désordre, « visibles » est exactement revealedLearnResults.
  assert.match(html, /const visibles = stickOnly \? casesVisibles\(state, question\) : state\.revealedLearnResults;\s*const stick = createNumberStick\(table, visibles, \{/, "la bande d’aide ne montre que les cases déjà répondues");
  assert.doesNotMatch(html, /ALL_MULTIPLIERS/);
  assert.match(html, /draftMultiplier: stickOnly \? question\?\.multiplier : null/);
  assert.match(html, /activeMultiplier: question\?\.multiplier/);
  assert.match(html, /if \(stickOnly\) \$\("answer-feedback"\)\.before\(zone\)/);
  assert.match(html, /else \$\("expression"\)\.before\(zone\)/);
  assert.match(html, /helpButton\.textContent = state\.learnStickHelpVisible \? "Masquer" : revealedCount \? `Voir la bande \(\$\{revealedCount\} \/ 11\)` : "Voir la bande \(vide\)"/);
  assert.match(html, /helpButton\.addEventListener\("click", toggleLearnStickHelp\)/);
  assert.match(html, /\}, 6000\);/);
  assert.match(html, /state\.learnStickHelpVisible = false;[\s\S]*state\.learnStickHelpUsed = false;[\s\S]*renderExpression\(question\)/);
  assert.match(html, /const assisted = !stickActivity && state\.learnStickHelpUsed/);
  // Lot R4 (P4, décision Q5) : construire la bande suit la même règle que
  // « dans l'ordre » et « désordre » — une mauvaise réponse renvoie le calcul
  // en fin de série. Le détail est dans defi-tables-bande-et-calculs.test.mjs.
  assert.match(html, /const shouldRetry = \(!correct && !donnee\) \|\| assisted;/);
  assert.match(html, /if \(correct && !assisted\) state\.mastered\.add\(question\.factKey\)/);
  assert.match(html, /showAnswerFeedback\(question, correct, skip \? null : value, shouldRetry, assisted, donnee\)/);
  assert.match(html, /assisted \? "Bravo\\u00a0! On le reverra sans la bande\." : "Bravo\\u00a0!"/);
  // Lot « un seul système » (05/10/2026) : le compteur « 10 / 11 calculs sus »
  // est en trois morceaux — « calculs » (.compteur-mot) s'efface sous 360 px,
  // « sus » (.compteur-suite) sous 430 px, comme « complétées » pour les cases.
  assert.match(html, /suite\.textContent = " complétées";\s*\$\("question-count"\)\.replaceChildren\(`\$\{completed\} \/ \$\{total\} cases`, suite\);/);
  assert.match(html, /mot\.className = "compteur-mot";\s*mot\.textContent = " calculs";\s*const suite = document\.createElement\("span"\);\s*suite\.className = "compteur-suite";\s*suite\.textContent = " sus";\s*\$\("question-count"\)\.replaceChildren\(`\$\{completed\} \/ \$\{total\}`, mot, suite\);/);
  assert.match(html, /@media \(max-width: 429px\) \{ #question-count \.compteur-suite \{ display: none; \} \}/);
  assert.match(html, /@media \(max-width: 359px\) \{ #question-count \.compteur-mot \{ display: none; \} \}/);
  assert.match(html, /question\?\.multiplier === 0 \? "Commence à 0\."\s*: suitUnePleine \? `Ajoute \$\{table\}\.` : "Complète la case bleue\.";/);
  assert.match(html, /if \(correct\) \{[\s\S]*\$\("validate"\)\.style\.visibility = "hidden";[\s\S]*scheduleAutoAdvance\(stickActivity \? DELAI_SUIVANT_BANDE : DELAI_SUIVANT\);/);
  assert.match(html, /\$\("validate"\)\.style\.visibility = "";[\s\S]*setAnswerControlsEnabled\(true\)/);
  assert.match(html, /\}, delai\);/);
  assert.match(html, /const DELAI_SUIVANT = 800;/);
  assert.match(html, /\.question\.stick-trace \.learn-sequence \{[\s\S]*display: grid;[\s\S]*justify-items: center;[\s\S]*margin: 0 0 8px;/);
  // Lot R1 (audit du 11/09, A8) : les étiquettes de la bande à 11 px au moins,
  // dans l'activité (9,4 px avant) comme dans l'aide « Voir la bande » (7,7 px).
  assert.match(html, /\.question\.stick-trace \.number-stick-cell \{[\s\S]*min-height: 45px;[\s\S]*grid-template-rows: 15px minmax\(30px, 1fr\);/);
  assert.match(html, /\.question\.stick-trace \.number-stick-multiplier \{ font-size: clamp\(\.6875rem, 1\.5vw, \.8rem\); \}/);
  assert.match(html, /\.question\.stick-trace \.number-stick-value \{[\s\S]*min-height: 30px;[\s\S]*font-size: clamp\(\.8rem, 2\.2vw, \.95rem\);/);
  assert.match(html, /\.challenge-playing \.number-stick-cell \{ min-height: 54px; grid-template-rows: 16px minmax\(38px, 1fr\); \}/);
  assert.match(html, /\.challenge-playing \.number-stick-multiplier \{ font-size: \.6875rem; \}/);
  assert.match(html, /\.challenge-playing \.number-stick-value \{ min-height: 38px; font-size: clamp\(\.8rem, 3\.4vw, \.95rem\); \}/);
  assert.doesNotMatch(html, /results\.join\(" → "\)/);
  assert.match(html, /state\.configuration\.mode === "train"\) \{[\s\S]*showAnswerFeedback/);
  assert.match(html, /state\.configuration\.mode === "train"\) \{[\s\S]*showAnswerFeedback\(question, correct, skip \? null : value\);[\s\S]*if \(correct\) \{[\s\S]*\$\("validate"\)\.style\.visibility = "hidden";[\s\S]*scheduleAutoAdvance\(\);/);
  assert.match(html, /textContent = enabled \? "Valider" : "Suivant"/);
  assert.match(html, /completeReview = state\.configuration\.mode === "test"/);
  assert.match(html, /Mes \$\{wrongEntries\.length\} erreurs/, "lot R2 : les erreurs d’abord, sous leur titre");
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/);
  // Le moteur était le seul des deux scripts sans épingle, et le lot A2 est
  // passé au travers : il ajoutait chargerSync / sauverSync / casesDetachees au
  // moteur sans monter son numéro. Un navigateur qui avait déjà l'ancien moteur
  // en cache recevait la nouvelle page avec l'ancien moteur —
  // « PARCOURS.chargerSync is not a function », plus de repère de suivi, plus
  // rien envoyé au professeur, et une page d'accueil d'apparence normale.
  // Changer ce numéro à chaque modification du moteur ; ce test le rappelle.
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261104-1/);
});

test("une erreur = une ligne : le calcul avec sa bonne réponse, la réponse donnée barrée à côté", () => {
  // Lot R2 : plus de « Question 3 » ni de « Ta réponse : / Bonne réponse : »
  // sur deux lignes ; le numéro n'apportait rien, l'élève relit le calcul.
  assert.match(html, /const \[avant, apres\] = entry\.prompt\.split\("\?"\);/);
  assert.match(html, /expression\.append\(document\.createTextNode\(avant\), expected, document\.createTextNode\(apres \?\? ""\)\);/);
  assert.match(html, /given\.setAttribute\("aria-label", `Ta réponse : \$\{entry\.given\}`\);/, "le sens reste dit aux lecteurs d’écran");
  assert.match(html, /item\.append\(questionLine, given\)/);
  // Lot « la flèche de retour » (14/10/2026, décision de Gwenaël) : barrée
  // d'un trait en biais — le trait horizontal se perdait dans un chiffre seul.
  assert.match(html, /\.given-answer \{ display: inline-block; padding: 0 \.3em; color: var\(--red\); font-size: \.95rem; font-weight: 800; line-height: 1\.25;\s*background: linear-gradient\(to top right, transparent calc\(50% - 1\.4px\), currentColor calc\(50% - 1\.4px\), currentColor calc\(50% \+ 1\.4px\), transparent calc\(50% \+ 1\.4px\)\); \}/);
  assert.doesNotMatch(html, /\.given-answer \{[^}]*line-through/, "plus de trait horizontal");
  assert.doesNotMatch(html, /`Question \$\{entry\.number\}`/);
});

test("les détails mobiles restent alignés et les titres programmatiquement ciblés n’affichent pas de cadre", () => {
  assert.match(html, /h1\[tabindex="-1"\]:focus \{ outline: none; \}/);
  assert.match(html, /\.time-options\.is-timed-only \{ grid-template-columns: repeat\(3/);
  assert.match(html, /classList\.toggle\("is-timed-only", configuration\.mode === "test"\)/);
});

test("la fiche PDF est publique mais sa source modifiable n’est pas proposée aux élèves", () => {
  assert.equal(revisionPdf.subarray(0, 4).toString(), "%PDF");
  assert.equal(editableSource.subarray(0, 2).toString(), "PK");
  // R5 : la feuille des tables était un papier de professeur ; lot « retours
  // de classe » : un seul lien pour l'élève, dans « Lire la table », vers le PDF.
  assert.equal((html.match(/fiche_tables_multiplication\.pdf/g) || []).length, 1);
  assert.doesNotMatch(html, /\.pdf"[^>]*\sdownload/);
  assert.doesNotMatch(html, /fiche_tables_multiplication\.docx/);
});

test("le pavé numérique a la taille de l’écran et Valider sa propre rangée (lot 1 clavier, 07/09/2026)", () => {
  // Téléphone : 50 px sur un iPhone courant, jamais moins que les 44 px d’avant ; chiffres à 1.5rem.
  assert.match(html, /#play \{[^}]*--pave-largeur: 360px;[^}]*--touche-h: clamp\(44px, 7\.5dvh, 50px\);[^}]*--touche-ecart: clamp\(2px, \.45dvh, 3px\);[^}]*--touche-police: 1\.5rem;[^}]*--valider-gap: 14px;/);
  // Tablette 56 px, ordinateur 64 px, la hauteur suivant celle de la fenêtre.
  assert.match(html, /@media \(min-width: 621px\) \{\s*#play \{[^}]*--touche-h: clamp\(46px, calc\(12\.6dvh - 41px\), 56px\);[^}]*--touche-police: 1\.5rem;/);
  assert.match(html, /@media \(min-width: 1040px\) \{\s*#play \{[^}]*--pave-largeur: 390px;[^}]*--touche-h: clamp\(46px, calc\(12\.6dvh - 33px\), 64px\);[^}]*--touche-police: 1\.7rem;/);
  // Comme un clavier de téléphone : fond teinté, touches blanches, aucune zone morte (le bouton
  // remplit sa case, seule sa face ::before est en retrait), Effacer et ⌫ grisés.
  assert.match(html, /\.keypad \{ width: min\(100%, var\(--pave-largeur\)\); display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); gap: 0;[^}]*background: #e3ecf2; \}/);
  assert.match(html, /\.keypad button \{[^}]*isolation: isolate;[^}]*min-height: 44px;[^}]*height: calc\(var\(--touche-h\) \+ 2 \* var\(--touche-ecart\)\);[^}]*background: none;[^}]*font-size: var\(--touche-police\);/);
  assert.match(html, /\.keypad button::before \{[^}]*inset: var\(--touche-ecart\);[^}]*z-index: -1;[^}]*background: #fff;/);
  assert.match(html, /\.keypad button\[data-key="clear"\]::before,\s*\.keypad button\[data-key="backspace"\]::before \{ background: #cbdae5; \}/);
  // Valider : même largeur que le pavé, deux colonnes sur trois, séparé des chiffres par --valider-gap ;
  // Passer dans la troisième colonne ; seul (J’apprends), Valider prend toute la largeur.
  assert.match(html, /\.actions \{ width: min\(100%, var\(--pave-largeur\)\); display: grid; grid-template-columns: 2fr 1fr; gap: var\(--touche-gap\); margin: var\(--valider-gap\) auto 0; \}/);
  assert.match(html, /\.actions button \{ min-width: 0; min-height: 44px; height: var\(--touche-h\);/);
  assert.match(html, /\.question\.no-skip \.actions \{ grid-template-columns: 1fr; \}/);
  // Dans J’apprends le bâton prend sa place : les touches redescendent un peu pour que tout tienne.
  assert.match(html, /\.question\.show-learn-sequence \{ --touche-h: clamp\(44px, 6\.9dvh, 46px\); \}/);
  assert.match(html, /\.question\.show-learn-sequence \{ --touche-h: clamp\(46px, calc\(10\.5dvh - 30px\), 56px\); \}/);
  assert.match(html, /\.question\.show-learn-sequence \{ --touche-h: clamp\(46px, calc\(10\.5dvh - 30px\), 64px\); \}/);
  // Téléphone : le pavé se cale en bas de la carte.
  assert.match(html, /\.challenge-playing \.keypad \{ margin: auto auto 0; \}/);
  // Le calcul s’écrit aussi gros que la largeur le permet (12,4vw fait tenir « ? × 10 = 100 » dès 320 px).
  assert.match(html, /\.challenge-playing \.expression \{ min-height: clamp\(68px, 12dvh, 92px\);[^}]*font-size: clamp\(2rem, min\(12\.4vw, 8dvh\), 3\.4rem\); \}/);
  assert.match(html, /\.challenge-playing \.expression \{ min-height: 84px;[^}]*font-size: clamp\(2\.2rem, min\(7vw, 8\.5dvh\), 4rem\); \}/);
  // Sur ordinateur, la boîte du retour est aussi haute qu'une ligne de texte (38 px mesurés) :
  // sinon elle grandit au premier message et pousse le pavé de 2 px à chaque réponse.
  assert.match(html, /\.challenge-playing \.answer-feedback \{ min-height: 38px; margin-top: 4px; \}/);
  // Les anciennes tailles fixes du défi en cours ont disparu.
  assert.doesNotMatch(html, /\.challenge-playing \.keypad button \{ min-height: 44px; height: 44px; \}/);
  assert.doesNotMatch(html, /\.challenge-playing \.keypad \{ width: min\(100%, 330px\)/);
  assert.doesNotMatch(html, /\.actions button \{ min-width: 140px; \}/);
});

test("la grille de Mon parcours a une colonne par activité de J’apprends (correctif A1, 11/09/2026)", () => {
  // Le lot 4b (#709) a porté J’apprends à 5 activités, la grille était restée à 4 colonnes :
  // le 5ᵉ rond et le 3ᵉ de Je m’entraîne tombaient dans les respirations (5 à 8 px de large)
  // et la case Acquise passait seule à la ligne. Les gabarits suivent le moteur.
  const n = ACTIVITES_APPRENDS.length;
  // [^}]* : chaque motif reste dans sa règle, il ne va pas chercher la valeur plus loin.
  const gabarits = [...html.matchAll(/\.parcours-cells \{[^}]*grid-template-columns: ([^;}]*);/g)].map(m => m[1]);
  assert.equal(gabarits.length, 2, "le gabarit général et celui du téléphone (max-width: 480px)");
  gabarits.forEach(gabarit => assert.ok(gabarit.startsWith(`repeat(${n}, minmax(0, 1fr))`), gabarit));
  // Téléphone : la colonne Acquise passe à 56 px au lot R3 — l'étiquette de groupe
  // y est montée à 11 px (audit A8) et « ACQUISE » y demande 49 px dans une police
  // large (48,7 mesurés en Arial Black au lot R0).
  assert.ok(gabarits[1].endsWith("minmax(56px, 1fr)"), gabarits[1]);
  // Les étiquettes suivent : J’APPRENDS sur n colonnes, JE M’ENTRAÎNE après la respiration.
  assert.match(html, new RegExp(`\\.parcours-group-label \\{ grid-column: span ${n};`));
  assert.match(html, new RegExp(`\\.parcours-group-label\\.is-entraine \\{ grid-column: ${n + 2} / span 3; \\}`));
  // Acquise : n ronds, une respiration, 3 entraînements, une respiration, puis sa colonne (= 11).
  const acquise = html.match(/\.parcours-group-label\.is-acquise \{ grid-column: (\d+); \}/);
  assert.equal(Number(acquise?.[1]), n + 6);
});

test("lot R3 · les étiquettes de groupe de Mon parcours font 11 px partout", () => {
  // Audit A8 : 9,3 px au téléphone, 10,2 sur ordinateur, 10,9 sur tablette —
  // c'était le plus petit texte de l'écran où l'élève lit tout son travail.
  const tailles = [...html.matchAll(/\.parcours-group-label(?:\.is-\w+)? \{([^}]*)\}/g)]
    .map(m => (m[1].match(/font-size: ([^;]+);/) || [])[1])
    .filter(Boolean);
  assert.ok(tailles.length >= 2, "le gabarit général et celui de l'ordinateur");
  tailles.forEach(t => assert.equal(t, ".6875rem", "11 px : jamais moins"));
  // Le téléphone ne redescend plus : sa règle ne garde que l'interlettrage.
  assert.match(html, /\.parcours-group-label \{ letter-spacing: \.01em; \}/);
  // Sur un écran de 320 px, « JE M'ENTRAÎNE » ne tient plus sur une ligne à 11 px :
  // il passe sur deux lignes au lieu d'être coupé au milieu d'un mot.
  assert.doesNotMatch(html, /\.parcours-group-label \{[^}]*white-space: nowrap/);
});
