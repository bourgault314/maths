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
  assert.match(html, /function majSortieJeu\(\) \{[\s\S]*?game-menu-label"\)\.textContent = reglages \? "Réglages" : "Ma table"/);
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
  assert.match(html, /items: ligne\.apprends\.map\(item => \(\{[\s\S]*?libelle: majuscule\(PARCOURS\.LIBELLES_APPRENDS\[item\.activite\]\)[\s\S]*?lancer: \(\) => launchFromParcours\(PARCOURS\.configApprends\(table, item\.activite\), "menu"\)/, "les QUATRE activités sont lançables, chacune la sienne");
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
  assert.match(html, /\$\("launch-back"\)\.textContent = state\.origin === "reglages" \? "Modifier" : "← Ma table"/);
  assert.match(html, /action: \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\)/, "l’étape 3 part sur la durée par défaut du moteur, 1 min 30");
});

test("la même épreuve avec plus de temps devient un entraînement de l’étape 2", () => {
  assert.match(html, /libelle: "Comme la validation, en 2 min"/);
  assert.match(html, /lancer: \(\) => launchFromParcours\(PARCOURS\.configValidation\(table, 120\), "menu"\)/, "le moteur la classe déjà en « préparation » : elle ne valide pas la table");
  assert.match(html, /if \(!ligne\.acquise\) \{\s*choixEntraine\.push\(/, "inutile sur une table déjà acquise");
  assert.match(html, /marqueur: "⏱"/, "ce n’est pas un des trois entraînements comptés : pas de rond d’état");
});

// ------------------------------------------- 4. l’accueil dit ce qu’il fait

test("l’accueil annonce le passage à la table suivante", () => {
  assert.match(html, /<p id="acc-suite" class="acc-suite" role="status" hidden><\/p>/);
  assert.match(html, /suite\.textContent = aAnnoncer \? `Table de \$\{annoncee\} acquise ✓ — on continue avec la table de \$\{table\}\.` : ""/);
  assert.match(html, /const aAnnoncer = Boolean\(annoncee\) && !replie && annoncee !== table;/, "rien à dire si la table n’a pas changé (mélange dû) ni sur l’accueil replié des 9 tables");
  assert.match(html, /const acquise = suivi\.evenements\.find\(evenement => evenement\.type === "validation" && evenement\.nouvelle\);\s*if \(acquise\) state\.tableAnnoncee = acquise\.table;/, "seule une table NOUVELLEMENT acquise s’annonce");
  assert.match(html, /state\.tableAnnoncee = null;/, "l’annonce disparaît dès que l’élève relance quelque chose");
});

// --------------------------------------------------- 5. Mes calculs

test("« Mes calculs » s’ouvre sur la grille, et le retour reste à l’écran", () => {
  assert.match(html, /show\("calculs"\);[\s\S]{0,300}\$\("calculs-grille"\)\.scrollIntoView\?\.\(\{block: "start", behavior: "auto"\}\)/);
  assert.match(html, /\.calculs-screen \.settings-toolbar \{ position: sticky; top: 0;/, "sinon « ← Ma table » sortirait de l’écran en défilant");
  assert.match(html, /#calculs-grille \{ scroll-margin-top: 58px; \}/, "la grille s’arrête sous la barre, pas dessous");
});
