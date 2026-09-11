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

test("l’ordre des activités est conseillé, jamais imposé", () => {
  // Lot 4b : les cinq activités du moteur (les perles en tête) sont
  // lançables, chacune la sienne — plus d'activité « en essai » devant la liste.
  assert.match(html, /items: ligne\.apprends\.map\(item => \(\{[\s\S]*?libelle: majuscule\(PARCOURS\.LIBELLES_APPRENDS\[item\.activite\]\)[\s\S]*?lancer: \(\) => launchFromParcours\(PARCOURS\.configApprends\(table, item\.activite\), "menu"\)/, "les CINQ activités sont lançables, chacune la sienne");
  assert.doesNotMatch(html, /ESSAI_PERLES/, "le garde d’essai du lot 4a est parti : l’activité est ouverte à tous");
  assert.match(html, /conseillee: Boolean\(prochaineActivite\) && item\.activite === prochaineActivite\.activite/, "la conseillée est la première non faite, et rien de plus");
  assert.match(html, /conseillee: Boolean\(prochainEntrainement\) && item\.entrainement === prochainEntrainement\.entrainement/);
  assert.match(html, /tag\.textContent = "conseillé";/);
  assert.match(html, /etat\.textContent = marqueur \|\| \(fait \? "✓" : commence \? "◔" : "○"\)/, "l’élève voit ce qu’il a déjà fait");
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
  assert.match(html, /if \(!ligne\.acquise\) \{\s*choixEntraine\.push\(/, "inutile sur une table déjà acquise");
  assert.match(html, /marqueur: "⏱"/, "ce n’est pas un des trois entraînements comptés : pas de rond d’état");
});

// ------------------------------------------- 4. l’accueil dit ce qu’il fait

test("l’écran de résultat annonce la table suivante — et l’accueil ne bouge plus", () => {
  // 09/09 : l'annonce était d'abord sur l'accueil ; elle s'insérait au-dessus
  // des étapes et les décalait sous les yeux de l'élève quand il y revenait.
  // Elle se dit maintenant là où la table vient d'être acquise.
  assert.doesNotMatch(html, /acc-suite/, "plus rien ne s’insère au-dessus des étapes");
  assert.match(html, /function tableSuivanteApres\(acquise\) \{\s*if \(PARCOURS\.toutesAcquises\(parcours\)\) return null;/, "rien à annoncer quand les neuf sont acquises");
  assert.match(html, /return suivante && suivante !== acquise \? suivante : null;/);
  assert.match(html, /Bravo !\$\{suivante \? ` On continue avec la table de \$\{suivante\}\.` : ""\}/);
});

test("l’écran de résultat ne dit pas deux fois la même chose", () => {
  // La fête annonçait « Table de 2 acquise ! Tu passes Bronze », et le bilan
  // vert redisait « Table de 2 acquise ✓ (20/20…) » puis « Nouveau rang :
  // Bronze ». Un écran, une information, une fois.
  assert.match(html, /function feteDuResultat\(evenements\) \{/, "une seule lecture des événements, partagée par la fête et le bilan");
  assert.match(html, /const \{etoile, melange, validation, rangMonte\} = feteDuResultat\(evenements\);/, "la fête ne recalcule plus la sienne dans son coin");
  assert.match(html, /if \(evenement\.type === "rang" && fete\.rangAffiche\) return "";/, "le rang est déjà sur le badge de la fête");
  assert.match(html, /if \(evenement === fete\.validation && evenement === fete\.principal\) \{[\s\S]*?return suivante \? `On continue avec la table de \$\{suivante\}\.` : "";/, "il ne reste que ce que la fête ne dit pas : la suite");
  assert.match(html, /suivi\.evenements\.map\(evenement => messageApresFete\(evenement, fete\)\)/);
});

test("quand l’écran fête une nouvelle, il ne garde que l’essentiel", () => {
  assert.match(html, /\$\("result"\)\.classList\.add\("a-fete"\);/);
  assert.match(html, /\$\("result"\)\.classList\.remove\("a-fete"\);/, "et il la retire pour les séries qui ne se fêtent pas");
  assert.match(html, /\.result\.a-fete > \.eyebrow,\s*\.result\.a-fete > \.hero-icon,\s*\.result\.a-fete #result-config,\s*\.result\.a-fete #result-detail \{ display: none; \}/, "« Série terminée », le ✓, le rappel des réglages et le temps mis n’apprennent rien de plus quand on vient d’acquérir une table");
  assert.match(html, /\.result\.a-fete \.result-parcours \{ text-align: center; \}/);
  assert.match(html, /<p id="result-config" class="result-config"><\/p>\s*<p id="result-detail"><\/p>/, "les lignes restent dans la page : elles servent aux séries sans fête (entraînement, validation ratée)");
});

// --------------------------------------------------- 5. Mes calculs

test("une série sans faute ne déroule pas la liste de toutes les bonnes réponses", () => {
  assert.match(html, /if \(completeReview && !wrongEntries\.length\) \{[\s\S]*?`Tes \$\{rightEntries\.length\} réponses sont justes\.`[\s\S]*?return;/, "une phrase au lieu de vingt pastilles");
  assert.match(html, /: "Ta réponse est juste\."/, "et le singulier quand il n’y en a qu’une");
  assert.match(html, /\? \(wrongEntries\.length \? "Bilan de tes réponses" : "Aucune erreur à corriger"\)/);
  assert.match(html, /if \(completeReview && rightEntries\.length\) \{/, "avec des fautes, le bilan complet garde son sens : l’élève relit la série entière");
});

test("« Mes calculs » s’ouvre sur la grille, et le retour reste à l’écran", () => {
  assert.match(html, /show\("calculs"\);[\s\S]{0,300}\$\("calculs-grille"\)\.scrollIntoView\?\.\(\{block: "start", behavior: "auto"\}\)/);
  assert.match(html, /\.calculs-screen \.settings-toolbar \{ position: sticky; top: 0;/, "sinon « ← Ma table » sortirait de l’écran en défilant");
  assert.match(html, /#calculs-grille \{ scroll-margin-top: 58px; \}/, "la grille s’arrête sous la barre, pas dessous");
});
