// Lot « Défi tables : la navigation » (09/09/2026).
//
// Sept remarques de Gwenaël en essayant le lot 3 en classe. Une seule cause
// pour la moitié d'entre elles : l'écran « intro » est DEUX écrans (l'accueil
// « Ma table » et les réglages libres), et une série lancée depuis l'accueil
// laissait son mode posé — on revenait donc sur les réglages. Ce test garde
// les six décisions prises avec lui.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

// ------------------------------------------------- 1. les retours de série

test("une série lancée depuis l’accueil revient à l’accueil, jamais sur les réglages", () => {
  assert.match(html, /function quitterSerie\(\) \{/, "un seul chemin de sortie pour toutes les séries");
  assert.match(html, /if \(state\.origin === "reglages"\) \{\s*show\("intro"\);/, "seule une série partie des réglages y revient");
  assert.match(html, /const cible = homeScreen\(\);\s*if \(cible === "intro"\) \{\s*backToModes\(\);/, "sinon on repasse par backToModes, qui remet configuration.mode à zéro — c’est lui qui fait réapparaître l’accueil");
  assert.match(html, /function cancelLaunch\(\) \{\s*quitterSerie\(\);\s*\}/, "« Modifier » sort par le même chemin");
  assert.match(html, /function returnToMenu\(\) \{\s*if \(!state\.running && !state\.launchReady\) return;\s*quitterSerie\(\);\s*\}/, "le bouton de l’écran de jeu aussi");
  assert.match(html, /\$\("start"\)\.addEventListener\("click", \(\) => \{\s*state\.origin = "reglages";/, "l’origine « reglages » ne se pose qu’au départ des réglages libres");
  assert.equal((html.match(/state\.origin = "reglages"/g) || []).length, 1, "une seule porte pose cette origine");
});

test("le bouton de sortie de l’écran de jeu dit où il ramène", () => {
  assert.match(html, /id="game-menu"[^>]*aria-label="Arrêter la série et revenir à Ma table"/);
  assert.match(html, /<span class="game-menu-label">Ma table<\/span>/, "« Menu » ne disait pas où il menait — et il menait ailleurs");
  assert.match(html, /const SORTIES = Object\.freeze\(\{\s*reglages: \{mot: "Réglages", ou: "aux réglages"\},\s*parcours: \{mot: "Mon parcours", ou: "à Mon parcours"\},\s*calculs: \{mot: "Mes calculs", ou: "à Mes calculs"\},\s*menu: \{mot: "Ma table", ou: "à Ma table"\}/, "les QUATRE origines ont leur mot : quitterSerie ramène là d’où la série est partie, le bouton doit le dire");
  assert.match(html, /bouton\.querySelector\("\.game-menu-label"\)\.textContent = sortie\.mot;/);
  assert.match(html, /bouton\.setAttribute\("aria-label", `Arrêter la série et revenir \$\{sortie\.ou\}`\);/);
  assert.match(html, /function sortieDeSerie\(\) \{\s*return SORTIES\[state\.origin\] \|\| SORTIES\.menu;/, "une origine inconnue retombe sur Ma table, jamais sur un bouton vide");
  assert.match(html, /majSortieJeu\(\);\s*show\("play"\);/, "le nom est posé avant que l’écran s’affiche");
});

// ------------------------------------- 2. le choix de l’activité sur place

test("« J’apprends » et « Je m’entraîne » se déplient sur l’accueil au lieu de lancer d’office", () => {
  assert.match(html, /action: \(\) => basculerEtape\("apprends"\)/);
  assert.match(html, /action: \(\) => basculerEtape\("entraine"\)/);
  assert.match(html, /controle: "acc-choix-apprends"/);
  assert.match(html, /controle: "acc-choix-entraine"/);
  assert.match(html, /bouton\.setAttribute\("aria-expanded", String\(Boolean\(deplie\)\)\)/, "la tuile annonce son état aux lecteurs d’écran");
  assert.match(html, /function panneauChoix\(\{id, legende, items\}\)/);
  assert.match(html, /legende: "Choisis ton activité"/);
  assert.match(html, /legende: "Choisis ton entraînement"/);
  assert.match(html, /state\.etapeOuverte = state\.etapeOuverte === nom \? null : nom;/, "un deuxième appui referme");
  assert.doesNotMatch(html, /bouton\.disabled = /, "rien n’est désactivé : l’élève peut relancer une activité déjà faite");
});

test("l’ordre des activités est celui du parcours, jamais imposé — et le menu ne conseille plus (lot E1)", () => {
  // Lot 4b : les cinq activités du moteur (les perles en tête) sont
  // lançables, chacune la sienne — plus d'activité « en essai » devant la liste.
  assert.match(html, /items: ligne\.apprends\.map\(item => \(\{[\s\S]*?libelle: majuscule\(PARCOURS\.LIBELLES_APPRENDS\[item\.activite\]\)[\s\S]*?lancer: \(\) => launchFromParcours\(PARCOURS\.configApprends\(table, item\.activite\), "menu"\)/, "les CINQ activités sont lançables, chacune la sienne");
  assert.doesNotMatch(html, /ESSAI_PERLES/, "le garde d’essai du lot 4a est parti : l’activité est ouverte à tous");
  // Lot E1 (03/10/2026, « liste simple ») : ni « conseillé », ni ✓ ◔ ○ dans
  // le menu — c'est la séance du jour qui conseille, la rangée qui montre.
  assert.doesNotMatch(html, /conseillee: Boolean\(prochaine/);
  assert.doesNotMatch(html, /tag\.textContent = "conseillé";/);
  assert.doesNotMatch(html, /fait \? "✓" : commence \? "◔" : "○"/);
});

// ---------------------------------------------- 3. la validation et le temps

test("« Je valide ma table » se joue en 1 min 30, sans choix de durée", () => {
  assert.doesNotMatch(html, /data-launch-duration/, "les trois durées quittent l’écran de lancement (décision du 09/09)");
  assert.doesNotMatch(html, /launch-durations/, "le groupe et son CSS partent avec elles");
  assert.doesNotMatch(html, /Ta table est validée en 1 min 30\. En 2 ou 3 min/, "la phrase qui expliquait le choix n’a plus d’objet");
  assert.match(html, /\$\("launch-hint"\)\.textContent = chrono \? "Le chrono part quand tu appuies sur « C’est parti ! »\." : ""/, "l’écran de départ garde son seul rôle : le chrono ne part pas sous le doigt");
  assert.match(html, /\$\("launch-back-label"\)\.textContent = versReglages \? "Modifier" : sortieDeSerie\(\)\.mot;/, "le retour de l’écran de lancement nomme lui aussi l’écran d’origine");
  assert.match(html, /id="launch-back-fleche" class="back-icon"[^>]*><svg viewBox="0 0 24 24"/, "la vraie flèche du site, pas le caractère « ← » (règle de Gwenaël du 21/08)");
  assert.doesNotMatch(html, /"← Ma table"/, "aucun chevron typographique en guise de flèche");
  assert.match(html, /action: \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\)/, "l’étape 3 part sur la durée par défaut du moteur, 1 min 30");
});

test("la même épreuve avec plus de temps devient un entraînement de l’étape 2", () => {
  assert.match(html, /libelle: "Comme la validation, en 2 min"/);
  assert.match(html, /lancer: \(\) => launchFromParcours\(PARCOURS\.configValidation\(table, 120\), "menu"\)/, "le moteur la classe déjà en « préparation » : elle ne valide pas la table");
  // Lot dosage + validation (19/09/2026) : proposée AUSSI sur une table
  // acquise — se remettre en jambes sur une table validée est un vrai usage.
  assert.doesNotMatch(html, /if \(!ligne\.acquise\) \{\s*choixEntraine\.push\(/, "plus de condition « pas acquise » sur l’option 2 min");
  assert.match(html, /\n\s*choixEntraine\.push\(\{\s*libelle: "Comme la validation, en 2 min"/);
  // Lot E1 : plus de rond d'état dans le menu, donc plus de ⏱ pour s'en
  // distinguer ; le cadre en pointillés (is-plus) suffit.
  assert.match(html, /detail: "20 questions · 2 min · avant de valider",\s*extraClasse: "is-plus",/);
});

// ------------------------------------------- 4. l’accueil dit ce qu’il fait

test("l’écran de résultat annonce la table suivante — et l’accueil ne bouge plus", () => {
  // 09/09 : l'annonce était d'abord sur l'accueil ; elle s'insérait au-dessus
  // des étapes et les décalait sous les yeux de l'élève quand il y revenait.
  // Elle se dit maintenant là où la table vient d'être acquise.
  assert.doesNotMatch(html, /acc-suite/, "plus rien ne s’insère au-dessus des étapes");
  assert.match(html, /function tableSuivanteApres\(acquise\) \{\s*if \(PARCOURS\.toutesAcquises\(parcours\)\) return null;/, "rien à annoncer quand les neuf sont acquises");
  assert.match(html, /return suivante && suivante !== acquise \? suivante : null;/);
  assert.match(html, /return suivante \? `On continue avec la table de \$\{suivante\}\.` : "";/, "la suite, en une phrase, après une table acquise (lot R2)");
});

test("l’écran de résultat ne dit pas deux fois la même chose", () => {
  // La fête annonçait « Table de 2 acquise ! Tu passes Bronze », et le bilan
  // vert redisait « Table de 2 acquise ✓ (20/20…) » puis « Nouveau rang :
  // Bronze ». Un écran, une information, une fois.
  assert.match(html, /function feteDuResultat\(evenements\) \{/, "une seule lecture des événements, partagée par le verdict et la suite");
  assert.match(html, /const \{etoile, melange, validation, rangMonte\} = fete;/, "le verdict ne recalcule pas la fête dans son coin");
  assert.match(html, /verdict\.rang = rangMonte\.rang;/, "le rang est sur le badge du verdict, et nulle part ailleurs");
  assert.doesNotMatch(html, /Nouveau rang : \$\{evenement\.nom\}/, "plus de ligne « Nouveau rang : … » sous la fête");
  // Lot R2 (audit, A10) : après une table acquise, le mélange à refaire et la
  // table suivante tiennent dans UNE phrase, au lieu de deux consignes.
  assert.match(html, /function suiteApresSerie\(evenements, fete\) \{/);
  assert.match(html, /if \(trouve\("melange-a-refaire"\)\) return `Refais ton mélange avec la table de \$\{fete\.validation\.table\}\$\{puis\}\.`;/);
  assert.match(html, /const texte = suiteApresSerie\(suivi\.evenements, feteDuResultat\(suivi\.evenements\)\);/);
  assert.match(html, /etiquette\.textContent = "Et maintenant\\u00a0:";/);
  assert.doesNotMatch(html, /function evenementMessage\(/, "les anciens messages par événement n’ont plus d’appelant");
});

test("quand l’écran fête une nouvelle, il ne garde que l’essentiel", () => {
  // Lot R2 (audit, A3/A6) : le verdict est un seul cadre en tête — la fête
  // en est la version en grand, l'échec la version rouge, le temps écoulé
  // la version ambre — et les boutons viennent juste après la suite.
  assert.match(html, /result\.classList\.remove\("is-fete", "is-rate", "is-temps", "is-neutre", "is-revision"\);/);
  assert.match(html, /if \(verdict\.classe\) result\.classList\.add\(verdict\.classe\);/);
  assert.match(html, /verdict\.classe = "is-fete";/);
  assert.match(html, /verdict\.titre = "Pas encore";/);
  assert.match(html, /verdict\.titre = "Temps écoulé";/);
  assert.match(html, /\.result\.is-rate \.result-verdict \{ border-color: #f1c2c2;/);
  assert.match(html, /\.result\.is-temps \.result-verdict \{ border-color: #efd48a;/);
  assert.match(html, /\.result\.is-fete \.result-verdict \{ animation: fete-pop \.5s ease-out; \}/);
  assert.match(html, /<div id="result-verdict" class="result-verdict">\s*<span id="result-icon" class="hero-icon" aria-hidden="true">✓<\/span>\s*<h1 id="result-title" tabindex="-1">Résultat<\/h1>\s*<p id="result-score" class="result-score"><\/p>\s*<p id="result-config" class="result-config"><\/p>\s*<p id="result-detail"><\/p>/);
  assert.match(html, /<div id="result-parcours" class="result-parcours" hidden><\/div>\s*<div class="result-actions">/, "la suite, puis les boutons — avant les corrections");
  assert.match(html, /<\/div>\s*<p id="result-message" class="result-message"><\/p>\s*<p id="result-previous" class="previous-score" hidden><\/p>\s*<section id="corrections" class="corrections" aria-live="polite"><\/section>\s*<\/div>/, "les corrections ferment l’écran");
  assert.doesNotMatch(html, /<p class="eyebrow">Série terminée<\/p>/, "le verdict dit déjà que la série est finie");
  // Sur un échec, « Rejouer » devient le bouton principal (Gwenaël, 11/09).
  assert.match(html, /\.result\.is-rate \.result-actions > #retry \{ order: -1; color: #fff; border: 0; background: var\(--blue\);/);
  assert.match(html, /\.result\.is-rate \.result-actions > #result-accueil \{ color: var\(--blue\); border: 1px solid #c5d9e6; background: #fff;/);
});

// --------------------------------------------------- 5. Mes calculs

test("une série sans faute ne déroule pas la liste de toutes les bonnes réponses", () => {
  // Lot R2 : les réponses justes sont repliées derrière un titre dépliable —
  // « Voir mes 20 réponses » sans faute, « Mes 17 réponses justes » sous les
  // erreurs — ouvert d'office sur ordinateur seulement.
  assert.match(html, /if \(completeReview && rightEntries\.length\) \{[\s\S]*?details\.className = "correction-details";[\s\S]*?details\.open = window\.matchMedia\("\(min-width: 1040px\)"\)\.matches;/);
  assert.match(html, /`Voir mes \$\{rightEntries\.length\} réponses`/);
  assert.match(html, /`Mes \$\{rightEntries\.length\} réponses justes`/);
  assert.doesNotMatch(html, /Aucune erreur à corriger/, "plus de cadre vert : le verdict a parlé, et sur une série ratée au temps ce cadre le contredisait (audit, A3)");
  assert.doesNotMatch(html, /Bilan de tes réponses/);
  assert.match(html, /: \(wrongEntries\.length > 1 \? `Mes \$\{wrongEntries\.length\} erreurs` : "Mon erreur"\);/, "lot E2 : « Mon erreur » sans calcul passé, « à revoir » avec");
});

test("« Mes calculs » s’ouvre sur la grille, et le retour reste à l’écran", () => {
  assert.match(html, /show\("calculs"\);[\s\S]{0,300}\$\("calculs-grille"\)\.scrollIntoView\?\.\(\{block: "start", behavior: "auto"\}\)/);
  assert.match(html, /\.calculs-screen \.settings-toolbar \{ position: sticky; top: 0;/, "sinon « ← Ma table » sortirait de l’écran en défilant");
  assert.match(html, /#calculs-grille \{ scroll-margin-top: 66px; \}/, "la grille s’arrête sous la barre, pas dessous (R4 bis : barre de 62 px)");
});
