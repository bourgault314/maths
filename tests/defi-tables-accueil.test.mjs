// Lot 2 de Défi tables v2 (08/09/2026) : l'accueil « Ma table ».
//
// Un seul écran de commande pour l'élève — la table en cours et ses trois
// étapes, le bouton Réviser, deux portes (Mon parcours, Mes calculs) — et,
// sans code seulement, deux petits liens pour les professeurs (Réglages
// libres, Évaluation CM1). Aucune règle de l'appli ne change : ce test
// vérifie ce qui s'affiche, ce qui se cache, et les mots employés.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {demarrerAppli, fauxReseau, fauxStockage, tic} from "./defi-tables-faux-monde.mjs";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const confidentialite = await readFile(new URL("../confidentialite.html", import.meta.url), "utf8");

// ------------------------------------------------------------- ce que la page contient

test("l’accueil : Ma table et ses trois étapes, Réviser, Mon parcours, Mes calculs, les petits liens", () => {
  assert.match(html, /<section id="mode-screen" class="mode-screen">[\s\S]*<div class="acc">/);
  // Lot 3 : avant le bloc Ma table, le bloc « Je deviens expert » (caché tant
  // que les 9 tables ne sont pas acquises). L'avis unique de migration qui le
  // précédait a été retiré au lot 4b : il n'y avait pas d'élèves à prévenir.
  assert.match(html, /<div class="acc">\s*<!--[^>]*-->\s*<section id="acc-expert" class="expert"[^>]*hidden>[\s\S]*?<section class="matable"/, "l’accueil commence par le bloc Ma table (l’escalier ne s’affiche que quand il a lieu d’être)");
  assert.doesNotMatch(html, /acc-avis|marquerAvisVu|texteAvis/, "plus d’avis « le parcours a changé » : ni bloc, ni texte, ni bouton OK");
  assert.match(html, /<p id="acc-table-eyebrow" class="eyebrow">Ma table<\/p><h1 id="acc-table-titre" tabindex="-1">/, "« La table de N » est le titre de l’écran (« Mes tables » quand les 9 sont acquises)");
  assert.match(html, /id="acc-changer" class="matable-changer"[^>]*aria-controls="acc-choix">Changer de table</);
  assert.match(html, /id="acc-acquises"/);
  assert.ok(html.indexOf('id="acc-changer"') < html.indexOf('id="acc-acquises"'), "« 2 tables acquises sur 9 » sous « Changer de table » (complément du 08/09)");
  assert.match(html, /id="acc-etapes" class="etapes"/);
  assert.match(html, /id="acc-reviser" class="reviser etape" type="button" hidden>[\s\S]*Réviser&nbsp;→/, "lot mémoire : le bloc du jour est une ligne d’étape, cachée tant que rien n’est dû");
  // Lot R3 (12/09) : « Expert » avec sa majuscule se lisait comme un nom propre ;
  // le sous-titre reprend le titre du panneau, « je deviens expert ».
  assert.match(html, /id="open-parcours" class="acc-lien"[\s\S]*<svg class="ico"[\s\S]*Mon parcours<small>tables, mélange, étoiles<\/small>/);
  // Lot « un seul tableau » (04/10/2026) : une seule tuile — Mes calculs vit
  // dans Mon parcours.
  assert.doesNotMatch(html, /id="open-calculs"/, "plus de tuile « Mes calculs » sur l’accueil");
  assert.equal((html.match(/class="acc-lien"/g) || []).length, 1, "une seule tuile : Mon parcours");
  // R5 (13/09, Q7) : l'écran de la fiche a un seul chemin. Lot « Mon mélange
  // sur l'accueil et l'expert » : il part de Mon parcours (« Imprimer ma
  // fiche ») — « Voir ma fiche » a quitté l'accueil.
  assert.doesNotMatch(html, /id="acc-fiche"|Voir ma fiche</);
  assert.match(html, /id="parcours-fiche" class="parcours-imprimer" type="button" aria-controls="fiche">[\s\S]*?<span>Imprimer ma fiche<\/span><\/button>/);
  assert.equal((html.match(/Imprimer ma fiche</g) || []).length, 2, "« Imprimer ma fiche » dans Mon parcours, et sur l'écran de la fiche");
  assert.match(html, /id="acc-notice-bouton"[^>]*aria-controls="acc-notice">Comment ça marche&nbsp;\?</);
  assert.match(html, /id="acc-notice" class="notice" data-notice hidden/);
  // Les trois étapes sont construites par renderAccueil, numérotées 1-2-3 ; la
  // 4e ligne ★ n'existe qu'à partir de 2 tables acquises.
  assert.match(html, /num: "1",\s*titre: "J’apprends"/);
  assert.match(html, /num: "2",\s*titre: "Je m’entraîne"/);
  // Lot « un seul système » (05/10/2026) : la table est « passée », le test
  // s'appelle « Je passe le test » (NOM_DU_TEST, écrit une seule fois).
  assert.match(html, /const NOM_DU_TEST = "Je passe le test";/);
  assert.match(html, /num: "3",\s*titre: ligne\.acquise \? "Ma table est passée" : NOM_DU_TEST/, "une table passée le dit en titre ; sinon « Je passe le test »");
  assert.doesNotMatch(html, /Ma table est acquise|"Je valide ma table"/, "plus de « acquise » ni de « Je valide ma table » dans les titres");
  assert.match(html, /num: "★",\s*titre: "Mon mélange"/, "lot 3 : la ligne ★ s’appelle « Mon mélange »");
  assert.match(html, /if \(etat\.melange\.visible && !replie && !carteSeance\) \{/, "la ligne ★ suit la règle du moteur : dès 2 tables passées, dans le menu d’une table (pas sur le bloc replié « Mes tables »)");
  assert.match(html, /sousTitre: ligne\.acquise \? `passée le \$\{dateEnLettres\(ligne\.acquise\)\}` : "20 questions · 1 min 30"/, "la seule règle écrite sur l’accueil");
});

test("l’appli ne choisit rien : les trois étapes restent des boutons, elle surligne seulement la conseillée", () => {
  assert.match(html, /bouton\.className = `etape \$\{classe\}\$\{conseille \? " is-next" : ""\}`/);
  // Lot « un seul système » : plus de cadenas. Lot « Mes calculs du jour
  // d'abord » (08/10/2026) : la porte de Mes calculs du jour ne désactive
  // plus rien non plus — ce qu'on touche le lance d'abord, puis enchaîne.
  assert.equal((html.match(/bouton\.disabled = /g) || []).length, 0, "plus aucun bouton désactivé");
  assert.doesNotMatch(html, /est-fermee|porte-mot|Après Mes calculs du jour"/, "plus de liens grisés « Après Mes calculs du jour »");
  assert.doesNotMatch(html, /classe: "valide verrou"|ligneVerrou|cadenas\.textContent/, "la ligne du test n’est plus jamais cadenassée");
  assert.match(html, /const conseil = prochaine\.type === "revision" \? "reviser"/, "le conseil suit prochaineEtape du moteur");
  assert.match(html, /\.etape\.is-next \{ border-color: var\(--blue\)/);
  assert.match(html, /\.etape\.is-next \.num \{ background: var\(--blue\); color: #fff; \}/);
  assert.match(html, /reviser\.classList\.toggle\("is-next", conseil === "reviser"\)/);
});

test("pas de ligne « Bonjour », avec ou sans code : le bandeau de suivi dit déjà qui est là", () => {
  assert.doesNotMatch(visible, /Bonjour/, "décision de Gwenaël du 08/09");
  assert.doesNotMatch(html, /id="intro-title"|acc-hello/);
  assert.match(html, /if \(name === "intro"\) \(configuration\.mode \? \$\("settings-title"\) : \$\("acc-table-titre"\)\)\.focus/, "le focus va au titre « La table de N »");
});

const visible = html.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");

test("« Prochaine étape » a disparu du parcours et du résultat ; le résultat ramène à Ma table", () => {
  assert.doesNotMatch(visible, /Prochaine étape/);
  assert.doesNotMatch(visible, /Lancer la prochaine étape/);
  assert.doesNotMatch(html, /id="change-settings"/, "« Changer d’entraînement » et « Retour au calcul mental » ont quitté le résultat : Ma table les remplace");
  assert.doesNotMatch(html, /<a class="secondary" href="\.\.\/index\.html/, "plus de porte de sortie du résultat vers le catalogue pour un élève suivi");
  assert.match(html, /<button id="result-accueil" class="primary" type="button">Ma table<\/button>\s*<button id="retry" class="secondary" type="button">Rejouer<\/button>\s*<button id="result-open-parcours" class="secondary" type="button">Voir mon parcours<\/button>/);
});

test("le menu ⋯ du parcours : « Effacer mon historique » puis « Comment ça marche ? » (lot « Effacer l'historique », 06/11/2026 ; R5 : plus d'impression ici)", () => {
  assert.match(html, /id="parcours-reset"[^>]*>Effacer mon historique<[\s\S]*id="parcours-notice-option"[\s\S]*Comment ça marche/);
  assert.doesNotMatch(html, /id="parcours-rename"|>Modifier mon prénom<|>Recommencer à zéro</);
  assert.doesNotMatch(html, /parcours-print-option/);
  assert.match(html, /id="parcours-notice-bouton"[^>]*aria-controls="parcours-notice"/);
  assert.match(html, /id="parcours-notice" class="notice" data-notice hidden/);
  assert.match(html, /\$\("parcours-back"\)\.addEventListener\("click", backToModes\)/);
  assert.match(html, /<span class="settings-back-label">Ma table<\/span><\/button>\s*<h1 id="parcours-title"/);
  // Lot « un seul tableau » : plus d'écran Mes calculs à part, donc plus de retour à lui.
  assert.doesNotMatch(html, /id="calculs" class="calculs-screen"|calculs-back/, "l’écran Mes calculs à part n’existe plus");
});

// ---------------------------------------------------------------- les mots

test("les trois mots d’état : à revoir (rouge) · en route (bleu) · su (vert), partout", () => {
  assert.match(html, /"a-travailler": "à revoir",\s*"en-cours": "en route",\s*"su": "su"/);
  assert.match(html, /is-a-travailler"><span class="mc-nb">21<\/span><span class="mc-cases">[\s\S]*?<\/span><\/span> à revoir<\/span>/, "légende du tableau");
  assert.match(html, /is-en-cours"><span class="mc-nb">21<\/span><span class="mc-cases">[\s\S]*?<\/span><\/span> en route<\/span>/);
  assert.match(html, /<i class="fiche-mini a-travailler">[\s\S]*?<\/i>à revoir<\/span>[\s\S]*?<i class="fiche-mini en-cours">[\s\S]*?<\/i>en route<\/span>[\s\S]*?<i class="fiche-mini su">[\s\S]*?<\/i>su<\/span>/, "la fiche imprimable : la même légende");
  assert.match(html, /\.mc-cell\.is-a-travailler \{ border-color: #efb4b4; color: var\(--red\); background: var\(--red-soft\); \}/, "« à revoir » est rouge");
  assert.match(html, /\.fiche-carre \.a-travailler, \.fiche-mini\.a-travailler \{ border-color: #efb4b4; background: #ffebeb; color: #a93030; \}/);
  // Plus aucun « à travailler » ni « en cours » (au sens de la grille) sur les écrans de l'élève.
  assert.doesNotMatch(visible, /à travailler|à retravailler/, "le mot « à travailler » ne s’affiche plus");
  assert.doesNotMatch(visible, /\ben cours\b(?! de route)/, "le mot « en cours » ne s’affiche plus");
  // Lot « un seul tableau » : la barre « Réviser 2 calculs → » des tables
  // acquises est partie avec les rangées — la révision n'a plus qu'une porte.
  assert.doesNotMatch(html, /parcours-revoir|function boutonReviser/);
});

test("le détail d’une case dit la règle du jour, et seulement là", () => {
  // Lot mémoire : raté aujourd'hui, dû, ou le jour du retour — rien d'autre.
  // Lot « Mon parcours » (décision 8) : « … dans ta séance ».
  assert.match(html, /if \(fait && fait\.erreur === aujourdhui\) note = "Raté aujourd’hui : il reviendra demain dans ta séance\.";/);
  assert.match(html, /else if \(fait && PARCOURS\.faitDu\(fait, aujourdhui\)\) note = boite >= 5\s*\? "À faire aujourd’hui : réussis-le pour le garder 14 jours de plus\."\s*: "À faire aujourd’hui : réussis-le pour monter d’une boîte\.";/);
  assert.match(html, /else if \(fait && fait\.echeance\) note = `Il reviendra dans ta séance \$\{libelleDans\(PARCOURS\.ecartJours\(aujourdhui, fait\.echeance\)\)\}\.`;/);
  assert.doesNotMatch(html, /function formaterJour/, "« Vu il y a 3 jours » n’est plus écrit : la date qui compte est celle du retour");
});

test("Ctrl+P remplit la fiche : l’écouteur beforeprint ne passe pas l’événement à renderFiche", () => {
  // renderFiche(source) prend « source » pour un parcours. Passée directement à
  // addEventListener, elle recevait l’objet Event : etatAffichage() lisait alors
  // parcours.tables[2] sur un tables absent et levait une TypeError — la fiche
  // sortait vide pour qui imprimait par Ctrl+P au lieu du bouton.
  assert.match(html, /addEventListener\("beforeprint", \(\) => renderFiche\(ficheAffichee\)\)/,
    "Ctrl+P remplit la fiche : l'écouteur ne passe pas l'événement à renderFiche");
  assert.doesNotMatch(html, /"beforeprint", renderFiche\)/);
  // … et il réimprime la fiche AFFICHÉE : dans la vue du professeur
  // (…#fiche=CODE), un renderFiche() sans source remplissait la feuille avec
  // le parcours de l'appareil du professeur, pas celui de l'élève ouvert.
  assert.match(html, /let ficheAffichee = null;/);
  assert.match(html, /function renderFiche\(source\) \{\s*\n\s*ficheAffichee = source \|\| null;/);
});

test("plus aucun texte de règle sur les écrans de l’élève en dehors de la notice", () => {
  assert.doesNotMatch(html, /Une case gagnée par bonne réponse/);
  assert.doesNotMatch(html, /Réglages et Évaluation CM1 sont à part/);
  assert.doesNotMatch(html, /25 produits, 2 minutes, 2 erreurs max\. À refaire/);
  assert.doesNotMatch(html, /Réussir ★ valide toutes tes tables d’un coup\./);
  assert.doesNotMatch(html, /Un calcul raté revient une fois dans la série/);
  assert.doesNotMatch(html, /class="parcours-note"/);
});

test("la notice « Comment ça marche ? » : les règles, écrites une fois, clonées deux fois", () => {
  // Lot 2b (03/10/2026) : la notice de la séance est la seule ; celle d'avant
  // (« je m'entraîne 3 fois ») est partie avec la clé ?seance=1.
  assert.doesNotMatch(html, /notice-regles"/);
  const notice = html.match(/<template id="notice-seance">([\s\S]*?)<\/template>/);
  assert.ok(notice, "le gabarit de la notice existe");
  const texte = notice[1];
  assert.equal((texte.match(/<p>/g) || []).length, 6, "six lignes, une par sujet");
  // Lot « un seul système » : Mon mélange est libre — la notice ne parle plus
  // d'un mélange à réussir avant le test d'une nouvelle table. Lot « les
  // trophées » : elle dit ce qu'il rapporte (une coupe avec 3, 6, puis 9 tables
  // — le mot « trophée » est parti au lot « Mon mélange sur l'accueil et l'expert »).
  // Lot « retours de classe » : le nombre et son mot ne se séparent plus (&nbsp;).
  assert.match(texte, /<p><b>Mon mélange\.<\/b> Mes tables passées mélangées&nbsp;: 20&nbsp;questions en 1&nbsp;min&nbsp;30\. À 3, puis 6&nbsp;tables, il passe avant le test jusqu’à ce que je gagne la coupe\.<\/p>/);
  assert.doesNotMatch(texte, /avant de valider|acquise/, "ni verrou ni « acquise » dans la notice");
  assert.doesNotMatch(texte, /je m’entraîne 3 fois|25 produits|Champion|★ produits/);
  assert.equal((html.match(/data-notice hidden/g) || []).length, 2, "accueil + parcours");
  assert.match(html, /document\.querySelectorAll\("\[data-notice\]"\)\.forEach\(zone => zone\.append\(modele\.content\.cloneNode\(true\)\)\)/);
});

// ------------------------------------------------------ la table en cours (exécuté)

// Les fonctions de l'accueil qui décident sans le DOM, telles qu'elles sont
// écrites dans la page : table en cours, étape conseillée, phrases de Réviser.
function chargerLogiqueAccueil(codeSuivi, session = fauxStockage(), seance = false) {
  const debut = html.indexOf("const CLE_TABLE_CHOISIE");
  const fin = "const NOMS_ENTRAINEMENTS";
  const source = html.slice(debut, html.indexOf(fin));
  const util = html.slice(html.indexOf("function pluriel(nombre, mot)"), html.indexOf("const LIBELLES_ETATS_CALCULS"))
    + html.slice(html.indexOf("function phraseProchainRetour(agenda)"), html.indexOf("function renderCalculsDetail()"));
  return new Function("PARCOURS", "PARCOURS_TABLES", "codeSuivi", "stockageSession", "SEANCE", `${util}\n${source}
    return {lireTableChoisie, ecrireTableChoisie, tableEnCours, etapeConseillee, phraseProchainRetour, questionsRevision, libelleDans};`)(
    PARCOURS, [...PARCOURS.TABLES], codeSuivi, () => session, seance
  );
}

function lea() {
  let p = PARCOURS.creerParcours();
  for (const t of [2, 10]) {
    p.tables[t].entraine = {desordre: 2, trous: 2, mixte: 2, dernier: null};
    p.tables[t].acquise = "2026-09-03";
  }
  p.tables[5].apprends = {construct: 2, gaps: 2, ordered: 0, random: 0};
  p.tables[5].entraine = {desordre: 2, trous: 0, mixte: 2, dernier: null};
  p.melange = {tables: [2, 10], aJour: true, aRefaireAvec: null, dernier: "2026-09-04"};
  return PARCOURS.normaliserParcours(p);
}

test("Ma table = la prochaine de l’ordre conseillé qui n’est pas acquise, sauf choix de l’élève", () => {
  const session = fauxStockage();
  const logique = chargerLogiqueAccueil("", session);
  const etat = PARCOURS.etatAffichage(lea());
  assert.equal(logique.tableEnCours(etat), 5, "2 et 10 acquises → la table de 5");
  assert.equal(logique.tableEnCours(PARCOURS.etatAffichage(PARCOURS.creerParcours())), 2, "parcours vide → la table de 2");

  logique.ecrireTableChoisie(7);
  assert.equal(logique.tableEnCours(etat), 7, "l’élève a choisi la table de 7");
  assert.equal(logique.lireTableChoisie(), 7);
  logique.ecrireTableChoisie(2);
  assert.equal(logique.tableEnCours(etat), 5, "une table acquise n’est plus « ma table » : retour à l’ordre conseillé");
  logique.ecrireTableChoisie(null);
  assert.equal(logique.lireTableChoisie(), null);

  // Le choix vit dans l'onglet, AVEC le code : le camarade suivant ne l'hérite pas.
  const sousCode = chargerLogiqueAccueil("ABC234", session);
  sousCode.ecrireTableChoisie(9);
  assert.equal(sousCode.tableEnCours(etat), 9);
  assert.equal(chargerLogiqueAccueil("XYZ789", session).lireTableChoisie(), null, "un autre code ne voit pas ce choix");
  assert.equal(chargerLogiqueAccueil("", session).lireTableChoisie(), null, "ni la case sans code");
  assert.match(session.brut("mathsgo-defi-tables-table"), /"table":9/);

  // Tout acquis : la ligne reste sur la dernière table de l'ordre conseillé.
  const tout = PARCOURS.creerParcours();
  PARCOURS.TABLES.forEach(t => { tout.tables[t].acquise = "2026-09-01"; });
  assert.equal(logique.tableEnCours(PARCOURS.etatAffichage(PARCOURS.normaliserParcours(tout))), 9);

  // Avec la séance (lot 2a, décision du 03/10) : sans choix dans l'onglet, la
  // table de la dernière séance (pour tous depuis le lot 2b).
  const joue = lea();
  joue.tables[7].seance = {depart: 3, n: 2, dernier: "2026-10-05"};
  const etatJoue = PARCOURS.etatAffichage(PARCOURS.normaliserParcours(joue));
  assert.equal(etatJoue.tableSeance, 7);
  assert.equal(chargerLogiqueAccueil("", fauxStockage(), true).tableEnCours(etatJoue), 7, "la 7 de la dernière séance");
  const avecChoix = chargerLogiqueAccueil("", fauxStockage(), true);
  avecChoix.ecrireTableChoisie(4);
  assert.equal(avecChoix.tableEnCours(etatJoue), 4, "le choix de l'onglet passe devant");
});

test("l’étape conseillée d’une table suit la même lecture que le moteur", () => {
  const logique = chargerLogiqueAccueil("");
  const ligneDe = (parcours, table) => PARCOURS.etatAffichage(parcours).lignes.find(l => l.table === table);
  const vide = PARCOURS.creerParcours();
  assert.equal(logique.etapeConseillee(ligneDe(vide, 2)), "apprends", "rien de commencé → J’apprends");
  assert.equal(logique.etapeConseillee(ligneDe(lea(), 5)), "entraine", "2 entraînements sur 3 → Je m’entraîne");
  assert.equal(logique.etapeConseillee(ligneDe(lea(), 2)), "valide", "acquise → Je valide (déjà ✓)");
  const prete = lea();
  prete.tables[5].entraine.trous = 2;
  // Lot « dosage + validation » (19/09/2026) : les trois réussis ne suffisent
  // plus, il faut les 8 calculs de la table en boîte 3 — d'ici là, le rond
  // reste sur Je m'entraîne.
  assert.equal(logique.etapeConseillee(ligneDe(prete, 5)), "entraine", "3 sur 3 mais la grille pas prête → toujours Je m’entraîne");
  PARCOURS.faitsDeLaTable(5).forEach(cle => { prete.calculs[cle] = {boite: 3, cases: 2, vu: "2026-09-01", erreur: null, gagne: "2026-09-02", echeance: "2026-09-05"}; });
  assert.equal(logique.etapeConseillee(ligneDe(prete, 5)), "valide", "3 sur 3 et les 8 calculs en boîte 3 → Je valide ma table");
  // Lot 4b, règle du 10/09 : J'apprends tant que les cinq activités ne sont
  // pas toutes terminées ET qu'aucun entraînement n'est réussi — la page lit
  // le conseil que le moteur calcule (ligne.conseil), une seule règle.
  const commence = PARCOURS.creerParcours();
  commence.tables[3].apprends.construct = 1;
  assert.equal(logique.etapeConseillee(ligneDe(commence, 3)), "apprends", "une activité commencée → toujours J’apprends (« finir un J’apprends ne veut pas dire qu’il connaît »)");
  PARCOURS.ACTIVITES_APPRENDS.forEach(activite => { commence.tables[3].apprends[activite] = 2; });
  assert.equal(logique.etapeConseillee(ligneDe(commence, 3)), "entraine", "les cinq terminées → Je m’entraîne");
  const seul = PARCOURS.creerParcours();
  seul.tables[4].entraine.desordre = 2;
  assert.equal(logique.etapeConseillee(ligneDe(seul, 4)), "entraine", "un entraînement réussi sans rien apprendre → Je m’entraîne");
  assert.match(html, /function etapeConseillee\(ligne\) \{\s*return ligne\.conseil;\s*\}/, "la page ne recopie pas la règle : elle lit le moteur");
  // Cohérence avec le moteur sur le parcours de Léa.
  assert.equal(PARCOURS.prochaineEtape(lea()).type, "entraine");
  assert.equal(PARCOURS.prochaineEtape(lea()).table, 5);
});

// Lot « un seul tableau » (04/10/2026) : la phrase sous le bouton de l'écran
// Mes calculs (phraseReviser) est partie avec l'écran — la révision n'a plus
// qu'une porte, la séance. Reste la phrase du bilan de révision.
test("la phrase « Reviens demain : N calculs t’attendront » ; 10 à la fois", () => {
  const logique = chargerLogiqueAccueil("");
  assert.doesNotMatch(html, /function phraseReviser/);
  assert.equal(logique.phraseProchainRetour({dus: 0, demain: 8, prochain: {jour: "2026-09-13", dans: 1, calculs: 8}}), "Reviens demain : 8 calculs t’attendront.");
  assert.equal(logique.phraseProchainRetour({dus: 0, demain: 0, prochain: {jour: "2026-09-15", dans: 3, calculs: 1}}), "Reviens dans 3 jours : 1 calcul t’attendra.");
  assert.equal(logique.phraseProchainRetour({dus: 0, demain: 0, prochain: null}), "Rien ne t’attend pour l’instant.");
  assert.equal(logique.questionsRevision({dus: 21}), 10);
  assert.equal(logique.questionsRevision({dus: 0}), 0);
  assert.equal(logique.libelleDans(0), "aujourd’hui");
  assert.equal(logique.libelleDans(1), "demain");
  assert.equal(logique.libelleDans(14), "dans 14 jours");
});

// -------------------------------------------------------- le mode élève (exécuté)

test("avec un code, les liens Réglages libres et Évaluation CM1 n’existent pas ; sans code, ils sont là", async () => {
  assert.match(html, /body\.mode-eleve \.acc-site \{ display: none !important; \}/);
  assert.equal((html.match(/class="acc-site"/g) || []).length, 2);
  assert.match(html, /if \(document\.body\) document\.body\.classList\.toggle\("mode-eleve", Boolean\(suiviActif\(\) \|\| entreeRefusee \|\| VUE_PROF\)\);/,
    "le même signal que le lien du haut (majLienRetour), pas un paramètre d’adresse — et la vue du professeur a la même barre");

  // Sans code : mode site.
  const site = demarrerAppli({});
  site.api.majLienRetour();
  assert.equal(site.document.body.classes.has("mode-eleve"), false);

  // Sous un code (onglet rechargé) : mode élève.
  const eleve = demarrerAppli({codeOnglet: "ABC234"});
  eleve.api.majLienRetour();
  assert.equal(eleve.document.body.classes.has("mode-eleve"), true);
  eleve.api.demarrerSuivi();
  await tic(20);
  assert.equal(eleve.document.body.classes.has("mode-eleve"), true, "toujours après la réponse du serveur");

  // Entré par un billet : mode élève dès l'échange.
  const parBillet = demarrerAppli({entree: {billet: "b1", ouvrir: "parcours"}, reseau: fauxReseau({billets: {b1: "DEF567"}})});
  assert.equal(parBillet.document.body.classes.has("mode-eleve"), false, "avant l’échange, personne n’est suivi");
  await parBillet.api.entrerParBillet("b1", () => {});
  assert.equal(parBillet.api.codeSuivi, "DEF567");
  assert.equal(parBillet.document.body.classes.has("mode-eleve"), true);

  // Billet refusé : l'élève vient quand même de son espace → mode élève aussi.
  const refuse = demarrerAppli({entree: {billet: "mort"}, reseau: fauxReseau({billets: {}})});
  await refuse.api.entrerParBillet("mort", () => {});
  assert.equal(refuse.api.entreeRefusee, "expire");
  assert.equal(refuse.document.body.classes.has("mode-eleve"), true);

  // « Se déconnecter » : retour au mode site.
  eleve.api.quitterSuivi();
  assert.equal(eleve.document.body.classes.has("mode-eleve"), false);
});

// ------------------------------------------------- l'en-tête compact (point 9)

// Lot « Mon parcours » (04/10/2026, point 6 — dessin de Gwenaël sur ses photos
// d'iPhone) : l'en-tête de 2 étages devient UNE barre fine pour l'élève à code,
// sans logo, avec « Se déconnecter » DANS le bloc de suivi (plus de pilule).
// En-tête commun (variante A, planches du 31/10/2026) : cette barre passe DANS
// le cadre blanc (placerEnTete, body.en-tete-cadre) — sur l'accueil, la flèche
// ronde, le titre « Calcul mental / Défi tables », le plein écran rond, et sous
// le titre la ligne « ● Suivi · Léa · 405 · Se déconnecter » ; ailleurs, la
// ligne seule. La vue du professeur garde sa barre fine au-dessus ; le
// visiteur sans code garde l'en-tête du site.
test("élève à code : la barre du haut DANS le cadre — flèche, titre, plein écran, ligne « Suivi · Léa · 405 · Se déconnecter » (en-tête commun, 31/10/2026)", async () => {
  assert.doesNotMatch(html, /id="suivi-sortie"|suivi-sortie|renderSortieBarre/, "plus de pilule « Se déconnecter » dans l’en-tête : la sortie est dans la ligne");
  const eleve = html.slice(html.indexOf("/* Lot « Mon parcours » (point 6, dessin de Gwenaël) : l'élève à code"), html.indexOf("</style>", html.indexOf("/* Lot « Mon parcours » (point 6, dessin de Gwenaël) : l'élève à code")));
  assert.match(eleve, /body\.mode-eleve \.topbar > \.brand \{ display: none; \}/, "plus de logo en haut pour l’élève à code");
  assert.match(eleve, /body\.mode-eleve \.topbar-actions \{ display: contents; \}/);
  assert.doesNotMatch(html, /body\.mode-eleve [^{]*\.brand[^{]*\{[^}]*display: (block|flex)/);
  // Le dessin A : trois colonnes (flèche, titre, plein écran), la ligne dessous ;
  // ailleurs que sur l'accueil, la ligne au milieu, entre la place de la flèche et le plein écran.
  assert.match(eleve, /body\.en-tete-cadre \.topbar \{ display: grid; grid-template-columns: minmax\(44px, 1fr\) auto minmax\(44px, 1fr\);\s*grid-template-areas: "g t d" "l l l";/);
  assert.match(eleve, /body\.en-tete-cadre\.ecran-interne \.topbar \{ grid-template-areas: "g l d";/);
  assert.match(eleve, /body\.en-tete-cadre #lien-retour \{ grid-area: g;[^}]*border-radius: 50%;/, "la flèche ronde à gauche");
  assert.match(eleve, /body\.en-tete-cadre \.fullscreen-toggle \{ grid-area: d;[^}]*border-radius: 50%;/, "le plein écran rond à droite");
  assert.match(eleve, /body\.en-tete-cadre:not\(\.ecran-interne\) \.ec-titre \{ display: block; grid-area: t;/, "le titre au centre, sur l’accueil");
  assert.match(html, /<div class="ec-titre"><p class="eyebrow">Calcul mental<\/p><p class="ec-nom">Défi tables<\/p><\/div>/);
  assert.match(eleve, /body\.en-tete-cadre \.suivi-repere \{ grid-area: l; display: block;[^}]*background: none; color: #506b7d; font-weight: 500; font-size: \.86rem;/,
    "la ligne sans bandeau pâle, grise, petite");
  assert.match(eleve, /body\.en-tete-cadre \.suivi-repere \.puce \{[^}]*background: #147447;/, "puce verte");
  assert.match(eleve, /body\.en-tete-cadre \.suivi-repere \.repere-prenom \{ font-weight: 700; color: #143451; \}/, "le prénom en gras, couleur encre");
  assert.match(eleve, /body\.en-tete-cadre \.suivi-repere \.sortie::after \{[^}]*height: 44px;/, "« Se déconnecter » se touche sur 44 px de haut");
  assert.match(html, /function placerEnTete\(\) \{[\s\S]*?const dedans = !VUE_PROF && Boolean\(suiviActif\(\) \|\| entreeRefusee \|\| attendu\);[\s\S]*?if \(tete\) \{ if \(tete\.nextElementSibling !== barre\) tete\.after\(barre\); \}\s*else if \(dedans && cadre\.firstElementChild !== barre\) cadre\.prepend\(barre\);\s*else if \(!dedans && barre\.parentNode !== cadre\.parentNode\) cadre\.before\(barre\);/,
    "la MÊME barre entre dans le cadre (jamais pour la vue du professeur) — sous le titre de l'écran s'il en a un —, et en ressort");
  assert.match(html, /bloc\.className = "sortie-bloc";/);
  assert.doesNotMatch(html, /pied-logo|<footer class="site-footer"/, "plus de pied de page dans l’appli (24/10/2026)");

  // Sans code : la barre reste au-dessus du cadre.
  const site = demarrerAppli({});
  site.api.majLienRetour();
  assert.equal(site.document.body.classes.has("en-tete-cadre"), false, "le visiteur garde l’en-tête du site");

  // Exécuté (l'identité arrive du serveur simulé : Léa, 405).
  const eleveSuivi = demarrerAppli({codeOnglet: "ABC234"});
  eleveSuivi.api.majLienRetour();
  eleveSuivi.api.demarrerSuivi();
  await tic(20);
  assert.equal(eleveSuivi.document.body.classes.has("en-tete-cadre"), true, "sous un code, la barre est dans le cadre");
  const repere = eleveSuivi.repere();
  assert.equal(repere.hidden, false);
  assert.equal(repere.texte, "Suivi · Léa · 405 · Se déconnecter", "« Suivi par ton professeur » devient « Suivi »");
  const morceaux = repere.enfants.find(n => n && n.className === "repere-texte");
  assert.ok(morceaux, "le texte en morceaux");
  assert.deepEqual(morceaux.enfants.map(n => typeof n === "string" ? n : [n.className, n.textContent]),
    [["morceau", "Suivi"], " · ", ["morceau repere-prenom", "Léa"], " · ", ["morceau repere-classe", "405"]],
    "chaque morceau insécable : la ligne ne se coupe qu’aux « · »");
  assert.equal(eleveSuivi.boutonRepere("Se déconnecter")?.textContent, "Se déconnecter", "la sortie est dans la ligne");
  eleveSuivi.api.quitterSuivi();
  assert.equal(eleveSuivi.repere().hidden, true, "après « Se déconnecter », plus de ligne");
});

test("la page Confidentialité nomme les deux clés de session de l’accueil", () => {
  assert.match(confidentialite, /<code>mathsgo-defi-tables-prenom<\/code>, <code>mathsgo-defi-tables-table<\/code>/);
  assert.match(confidentialite, /table choisie sur l’accueil de Défi tables/);
});

// ---------------------------------------------- lot R3 : l'accueil et le parcours
// Retouches de l'audit du 11/09/2026, décidées avec Gwenaël le 11 et le 12 :
// le bleu ne dit plus qu'une chose, le cadenas répond, les cibles au doigt
// passent à 44 px, les petits textes à 11 px, le focus se voit, et les deux
// portes professeur sont utilisables jusqu'au bout.

const regle = nom => {
  const m = html.match(new RegExp(`(?:^|\\n)\\s*${nom.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")} \\{([^}]*)\\}`));
  assert.ok(m, `règle CSS introuvable : ${nom}`);
  return m[1];
};

test("lot R3 · le bleu ne désigne plus que l’étape conseillée", () => {
  // A4 : « Je valide ma table » était écrit en bleu quelle que soit l'étape
  // conseillée — l'élève de 6e y lisait « c'est là qu'il faut aller ».
  assert.doesNotMatch(html, /\.etape\.valide strong \{ color: var\(--blue\); \}/);
  // Ce qui reste bleu : l'étape conseillée, et elle seule (is-next).
  assert.match(html, /\.etape\.is-next \{ border-color: var\(--blue\);/);
  assert.match(html, /\.expert \.etape\.is-next strong \{ color: var\(--blue\); \}/);
  // Lot E1 (03/10/2026) : l'ancien menu « Choisir une activité » est une
  // liste simple — plus aucun « conseillé », ni sur les lignes ni dans les
  // panneaux : c'est la séance du jour qui conseille.
  assert.match(html, /function panneauChoix\(\{id, legende, items\}\)/);
  assert.match(html, /items\.forEach\(item => zone\.append\(boutonChoix\(item\)\)\);/);
  assert.doesNotMatch(html, /marquerConseil/);
  assert.doesNotMatch(html, /conseilCarte/);
  assert.doesNotMatch(html, /tag\.textContent = "conseillé";/);
});

test("lot « un seul système » · plus de cadenas : « Je passe le test » lance toujours le test, Mon mélange ne ferme rien", () => {
  // Le cadenas du lot R3 (qui descendait jusqu'à « Mon mélange ») est parti
  // avec le verrou : la ligne 3 et le lien de la carte lancent le test.
  assert.doesNotMatch(html, /montrerMelange/, "plus de geste « va d’abord faire ton mélange »");
  assert.doesNotMatch(html, /Réussis d’abord ton mélange/);
  assert.doesNotMatch(html, /etat\.verrou|verrouillee/, "l’état du moteur n’a plus de verrou, l’événement non plus");
  assert.doesNotMatch(html, /PARCOURS\.melangeDu/, "melangeDu a quitté le moteur");
  assert.match(html, /titre: ligne\.acquise \? "Ma table est passée" : NOM_DU_TEST,[\s\S]{0,700}?action: \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\)/, "la ligne 3 lance le test, sans condition");
  assert.match(html, /lien\(NOM_DU_TEST, \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\), "rond"\);/, "le lien de la carte de séance aussi");
  // La porte de Mes calculs du jour ne retient plus : elle le lance d'abord,
  // puis enchaîne sur le test (lot « Mes calculs du jour d'abord »).
  assert.match(html, /if \(origin !== "seance" && PARCOURS\.mesCalculsAFaire\(parcours\)\) \{\s*if \(config\.mode !== "revision"\) state\.apresMesCalculs = \{config, origin, nom: nomDeLaSuite\(config\), puis\};\s*startRevision\(null, origin\);\s*return;\s*\}/);
  // Rien n'a été ajouté sur l'écran de l'élève : pas de phrase de plus.
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), /Fais d’abord ton mélange pour/);
});

test("lot R3 · les cibles du doigt font 44 px", () => {
  // A11 : « Se déconnecter » est la SEULE sortie sur tablette (la pilule de
  // l'en-tête n'existe qu'au téléphone) et ne faisait que 28 px.
  assert.match(regle(".suivi-repere .sortie"), /min-height: 44px/);
  assert.match(regle(".suivi-repere"), /min-height: 44px/);
  assert.match(html, /\.matable-changer \{ min-height: 44px;/);
  assert.match(html, /\.acc-bas button \{ min-height: 44px;/);
  assert.match(regle(".stick-help-button"), /min-height: 44px/);
  // En pleine activité sur téléphone, la hauteur manque : 36 px, pas 32.
  assert.match(html, /\.challenge-playing \.stick-help-button \{ min-height: 36px;/);
});

test("lot R3 · « Changer de table » est centré, et Réviser lisible", () => {
  // P1 : neuf boutons alignés à gauche, 100 px de vide à droite.
  assert.match(regle(".matable-choix"), /justify-content: center/);
  // Au téléphone, trois rangées de trois (sa demande P1), pas 5 + 4.
  assert.match(html, /\.matable-choix \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/);
  // A7 (R3) : blanc sur #e0771a faisait 3,07:1. Lot mémoire : le bouton du
  // bloc du jour est bleu (var(--blue) = #0755b8, 6,9:1) — un bouton principal.
  assert.match(html, /\.reviser \.go \{[^}]*background: var\(--blue\);/);
  assert.doesNotMatch(html, /\.reviser \.go \{[^}]*background: #e0771a;/);
  assert.match(html, /\.reviser \{ order: -1; \}/, "en tête de l’accueil");
});

test("lot R3 · les petits textes, le focus et le bandeau des réglages", () => {
  // A8 : « conseillé » à 10,9 px → 12 px. Lot E1 : l'étiquette a disparu
  // du menu (liste simple), sa règle avec.
  assert.doesNotMatch(html, /\.choix-activite \.tag \{/);
  // A19 : le contour du clavier était à 1,6:1 (rgba .3) ; plein, il fait 4,6:1.
  assert.doesNotMatch(html, /outline: 3px solid rgba\(15, 108, 249, \.3\)/);
  assert.equal((html.match(/outline: 3px solid #0f6cf9/g) || []).length, 2, "le focus général et celui du pavé");
  // A16 : le bandeau « Commencer » ne laisse plus voir les options derrière lui.
  const dock = regle(".start-dock");
  assert.match(dock, /bottom: 0;/, "collé au bas : rien ne dépasse dessous");
  assert.match(dock, /background: #fff;/, "fond plein, plus de dégradé transparent");
  assert.match(dock, /box-shadow: 0 -9px 10px -9px/, "l'ombre dit qu'il y a une suite");
  // A20 : après une série lancée depuis les deux portes professeur, un retour.
  assert.match(html, /<button id="result-reglages" class="secondary" type="button" hidden>Réglages<\/button>/);
  assert.equal((html.match(/\$\("result-reglages"\)\.hidden = state\.origin !== "reglages";/g) || []).length, 2,
    "les deux fins de série : la normale et celle de la révision (la seconde n'est qu'une remise à zéro)");
  // Reste du lot R2, relevé par Code : ce point n'était protégé par aucun test.
  // « Voir mon parcours » (146,5 px) ne tient dans sa demi-colonne au téléphone
  // qu'avec 10 px de marge intérieure au lieu des 17 px des autres boutons.
  assert.match(html, /\.result-actions > button \{ padding-left: 10px; padding-right: 10px; \}/);
});

// ------------------------------------------ lot R3 bis : « Changer de table »
// Idée de Gwenaël (12/09) : au doigt, choisir sa table est une décision seule à
// l'écran. Tant que le choix est ouvert, le reste de l'accueil s'efface ; à la
// sélection, tout revient avec la nouvelle table.

test("lot R3 bis · le choix des tables occupe l’écran seul, au doigt", () => {
  // Le reste de l'accueil s'efface jusqu'à 1039 px (téléphone et tablette).
  assert.match(html, /@media \(max-width: 1039px\) \{\s*\.acc\.choix-ouvert > :not\(\.matable\),\s*\.acc\.choix-ouvert #acc-etapes \{ display: none; \}/);
  // Au-delà, rien ne change : le panneau s'insère comme avant.
  assert.doesNotMatch(html, /\.acc\.choix-ouvert > :not\(\.matable\) \{ display: none; \}\s*$/m,
    "la règle vit dans sa media query, pas en dehors");
  // La classe suit l'état, dans les deux sens.
  assert.match(html, /document\.querySelector\("\.acc"\)\.classList\.toggle\("choix-ouvert", Boolean\(state\.choixTableOuvert\)\)/);
  // Le titre du choix : même façon de faire que « Choisis ton activité ».
  assert.match(html, /<p id="acc-choix-legende" class="choix-legende">Choisis ta table<\/p>/);
  assert.match(html, /<div id="acc-choix" class="matable-choix" role="group" aria-labelledby="acc-choix-legende" hidden>/);
  assert.match(html, /\$\("acc-choix-legende"\)\.hidden = !state\.choixTableOuvert;/);
  // Le lien du haut dit comment repartir sans rien changer (choix de Gwenaël, 12/09).
  assert.match(html, /\$\("acc-changer"\)\.textContent = state\.choixTableOuvert && !replie && !toutes\s*\?\s*`Je garde la table de \$\{table\}`/);
  // Choisir une table referme : la ligne existait déjà, on la garde.
  assert.match(html, /state\.choixTableOuvert = false;\s*renderAccueil\(\);\s*\$\("acc-table-titre"\)\.focus/);
});
