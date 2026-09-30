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
  assert.match(html, /id="open-calculs" class="acc-lien"[\s\S]*<svg class="ico"[\s\S]*Mes calculs<small>la grille des 36 calculs<\/small>/);
  // R5 (13/09, Q7) : « Voir ma fiche » ouvre l'écran de la fiche — le seul chemin.
  assert.match(html, /id="acc-fiche"[^>]*aria-controls="fiche">Voir ma fiche</);
  assert.equal((html.match(/Imprimer ma fiche</g) || []).length, 1, "un seul « Imprimer ma fiche », celui de l'écran de la fiche");
  assert.match(html, /id="acc-notice-bouton"[^>]*aria-controls="acc-notice">Comment ça marche&nbsp;\?</);
  assert.match(html, /id="acc-notice" class="notice" data-notice hidden/);
  // Les trois étapes sont construites par renderAccueil, numérotées 1-2-3 ; la
  // 4e ligne ★ n'existe qu'à partir de 2 tables acquises.
  assert.match(html, /num: "1",\s*titre: "J’apprends"/);
  assert.match(html, /num: "2",\s*titre: "Je m’entraîne"/);
  assert.match(html, /num: "3",\s*titre: ligne\.acquise \? "Ma table est acquise" : "Je valide ma table"/, "lot dosage + validation : une table acquise le dit en titre");
  assert.match(html, /num: "★",\s*titre: "Mon mélange"/, "lot 3 : la ligne ★ s’appelle « Mon mélange »");
  assert.match(html, /if \(etat\.melange\.visible && !toutes\) \{/, "la ligne ★ suit la règle du moteur : dès 2 tables acquises ; avec les 9, elle vit dans le bloc Je deviens expert");
  assert.match(html, /sousTitre: ligne\.acquise \? `acquise le \$\{dateEnLettres\(ligne\.acquise\)\}` : "20 questions · 1 min 30"/, "la seule règle écrite sur l’accueil");
});

test("l’appli ne choisit rien : les trois étapes restent des boutons, elle surligne seulement la conseillée", () => {
  assert.match(html, /bouton\.className = `etape \$\{classe\}\$\{conseille \? " is-next" : ""\}`/);
  assert.doesNotMatch(html, /bouton\.disabled = /, "rien n’est désactivé en silence : le cadenas du lot 3 est un bouton qui explique et mène au mélange");
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

test("le menu ⋯ du parcours garde ses trois options, dans cet ordre (R5 : plus d'impression ici)", () => {
  assert.match(html, /id="parcours-rename"[\s\S]*Modifier mon prénom[\s\S]*id="parcours-reset"[\s\S]*Recommencer à zéro[\s\S]*id="parcours-notice-option"[\s\S]*Comment ça marche/);
  assert.doesNotMatch(html, /parcours-print-option/);
  assert.match(html, /id="parcours-notice-bouton"[^>]*aria-controls="parcours-notice"/);
  assert.match(html, /id="parcours-notice" class="notice" data-notice hidden/);
  assert.match(html, /\$\("parcours-back"\)\.addEventListener\("click", backToModes\)/);
  assert.match(html, /<span class="settings-back-label">Ma table<\/span><\/button>\s*<h1 id="parcours-title"/);
  assert.match(html, /\$\("calculs-back"\)\.addEventListener\("click", backToModes\)/, "Mes calculs revient à Ma table, pas au parcours");
});

// ---------------------------------------------------------------- les mots

test("les trois mots d’état : à revoir (rouge) · en route (bleu) · su (vert), partout", () => {
  assert.match(html, /"a-travailler": "à revoir",\s*"en-cours": "en route",\s*"su": "su"/);
  assert.match(html, /is-a-travailler"><span class="mc-cases">[\s\S]*?<\/span><\/span> à revoir<\/span>/, "légende de la grille");
  assert.match(html, /is-en-cours"><span class="mc-cases">[\s\S]*?<\/span><\/span> en route<\/span>/);
  assert.match(html, /rouge : à revoir \(boîte 1\) · bleu : en route \(boîtes 2 et 3\) · vert : su \(boîtes 4 et 5\)/, "fiche imprimable, page 2");
  assert.match(html, /\.mc-cell\.is-a-travailler \{ border-color: #efb4b4; color: var\(--red\); background: var\(--red-soft\); \}/, "« à revoir » est rouge");
  assert.match(html, /\.fiche-carre td\.a-travailler \{ background: #ffebeb; color: #a93030; \}/);
  // Plus aucun « à travailler » ni « en cours » (au sens de la grille) sur les écrans de l'élève.
  assert.doesNotMatch(visible, /à travailler|à retravailler/, "le mot « à travailler » ne s’affiche plus");
  assert.doesNotMatch(visible, /\ben cours\b(?! de route)/, "le mot « en cours » ne s’affiche plus");
  // Le bouton « à revoir » d'une table acquise existait déjà : même mot, même
  // sens — depuis l'audit 2, avec le nombre de calculs (« 2 calculs à revoir »).
  assert.match(html, /revoir\.textContent = `Réviser \$\{pluriel\(nombre, "calcul"\)\}\\u00a0→`;/);
});

test("le détail d’une case dit la règle du jour, et seulement là", () => {
  // Lot mémoire : raté aujourd'hui, dû, ou le jour du retour — rien d'autre.
  assert.match(html, /if \(fait && fait\.erreur === aujourdhui\) note = "Raté aujourd’hui : il revient demain\.";/);
  assert.match(html, /else if \(fait && PARCOURS\.faitDu\(fait, aujourdhui\)\) note = boite >= 5\s*\? "À faire aujourd’hui : réussis-le pour le garder 14 jours de plus\."\s*: "À faire aujourd’hui : réussis-le pour monter d’une boîte\.";/);
  assert.match(html, /else if \(fait && fait\.echeance\) note = `Revient \$\{libelleDans\(PARCOURS\.ecartJours\(aujourdhui, fait\.echeance\)\)\}\.`;/);
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
  const notice = html.match(/<template id="notice-regles">([\s\S]*?)<\/template>/);
  assert.ok(notice, "le gabarit de la notice existe");
  const texte = notice[1];
  assert.equal((texte.match(/<p>/g) || []).length, 6, "six phrases (lot 3 : le mélange, les étoiles, mon rang)");
  // Audit 1 (30/09/2026) : six lignes courtes, une par sujet, mêmes mots en gras.
  assert.match(texte, /<p><b>Ma table\.<\/b> J’apprends si je veux, je m’entraîne 3 fois, je valide&nbsp;: 20 questions en 1 min 30, 2 erreurs au maximum\.<\/p>/);
  assert.match(texte, /<p><b>Mon mélange\.<\/b> Dès 2 tables acquises, je réussis le mélange avant de valider une nouvelle table\.<\/p>/);
  assert.match(texte, /<p><b>Mes calculs\.<\/b> Chaque calcul a 5 boîtes\. Réussi le jour où il revient, il monte d’une boîte&nbsp;; raté, il descend et revient demain\.<\/p>/);
  assert.match(texte, /<p><b>Mes calculs du jour\.<\/b> Les calculs qui reviennent aujourd’hui, 10 à la fois, sans chrono\.<\/p>/);
  assert.match(texte, /<p><b>Les étoiles\.<\/b> Mes 9 tables acquises et le mélange réussi, je tente toutes les tables de plus en plus vite&nbsp;: ★ 2 min … 👑 1 min\.<\/p>/);
  assert.match(texte, /<p><b>Mon rang\.<\/b> Bronze, Argent, Or, Platine, Diamant, Légende\. On ne redescend jamais\.<\/p>/);
  // Une ligne par sujet : pas de phrase longue qui revient.
  assert.doesNotMatch(texte, /<b>Une table\.<\/b>|avec des trous|Chaque nouvelle table le remet à faire/);
  // Plus rien de l'ancien système : ni mélange à 25 en 2 min, ni Champion.
  assert.doesNotMatch(texte, /25 produits|Champion|★ produits/);
  assert.equal((html.match(/data-notice hidden/g) || []).length, 2, "accueil + parcours");
  assert.match(html, /document\.querySelectorAll\("\[data-notice\]"\)\.forEach\(zone => zone\.append\(modele\.content\.cloneNode\(true\)\)\)/);
});

// ------------------------------------------------------ la table en cours (exécuté)

// Les fonctions de l'accueil qui décident sans le DOM, telles qu'elles sont
// écrites dans la page : table en cours, étape conseillée, phrases de Réviser.
function chargerLogiqueAccueil(codeSuivi, session = fauxStockage()) {
  const debut = html.indexOf("const CLE_TABLE_CHOISIE");
  const fin = "const NOMS_ENTRAINEMENTS";
  const source = html.slice(debut, html.indexOf(fin));
  const util = html.slice(html.indexOf("function pluriel(nombre, mot)"), html.indexOf("const LIBELLES_ETATS_CALCULS"))
    + html.slice(html.indexOf("function phraseReviser(agenda, resume)"), html.indexOf("function renderCalculsDetail()"));
  return new Function("PARCOURS", "PARCOURS_TABLES", "codeSuivi", "stockageSession", `${util}\n${source}
    return {lireTableChoisie, ecrireTableChoisie, tableEnCours, etapeConseillee, phraseReviser, questionsRevision, libelleDans};`)(
    PARCOURS, [...PARCOURS.TABLES], codeSuivi, () => session
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

test("la phrase de Mes calculs : les dus du jour, 10 par 10 ; sinon quand ça revient ; une grille vide ne lance rien", () => {
  const logique = chargerLogiqueAccueil("");
  const vide = {aTravailler: 0, enCours: 0, sus: 0, jamaisVus: 36, total: 36};
  const pleine = {aTravailler: 4, enCours: 6, sus: 6, jamaisVus: 20, total: 36};
  assert.equal(logique.phraseReviser({dus: 4, demain: 4, prochain: null}, pleine), "4 calculs t’attendent · sans chrono.");
  assert.equal(logique.phraseReviser({dus: 1, demain: 1, prochain: null}, pleine), "1 calcul t’attend · sans chrono.");
  assert.equal(logique.phraseReviser({dus: 21, demain: 21, prochain: null}, pleine), "21 calculs t’attendent · 10 par 10, sans chrono.");
  assert.equal(logique.phraseReviser({dus: 0, demain: 8, prochain: {jour: "2026-09-13", dans: 1, calculs: 8}}, pleine), "Rien aujourd’hui. Reviens demain : 8 calculs t’attendront.");
  assert.equal(logique.phraseReviser({dus: 0, demain: 0, prochain: {jour: "2026-09-15", dans: 3, calculs: 1}}, pleine), "Rien aujourd’hui. Reviens dans 3 jours : 1 calcul t’attendra.");
  assert.equal(logique.phraseReviser({dus: 0, demain: 0, prochain: null}, pleine), "Rien aujourd’hui. Rien ne t’attend pour l’instant.");
  assert.equal(logique.phraseReviser({dus: 0, demain: 0, prochain: null}, vide), "Ta grille est vide : elle se remplit dans Je m’entraîne et les validations.");
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
  assert.match(html, /if \(document\.body\) document\.body\.classList\.toggle\("mode-eleve", Boolean\(suiviActif\(\) \|\| entreeRefusee\)\);/,
    "le même signal que le lien du haut (majLienRetour), pas un paramètre d’adresse");

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

test("sur téléphone, le repère de suivi tient sur une ligne sous le logo et « Se déconnecter » devient une pilule", async () => {
  // Version A, choisie par Gwenaël le 08/09/2026 : ligne 1 = logo, pilule
  // « Se déconnecter », flèche ; ligne 2 = le repère sur toute la largeur,
  // une seule ligne, coupé par « … » si le prénom est très long. Rien ne
  // change sur PC et tablette : la sortie reste sur le repère (règle du 03/09).
  assert.match(html, /<button id="suivi-sortie" class="catalogue-link suivi-sortie" type="button" hidden>Se déconnecter<\/button>/);
  assert.ok(html.indexOf('id="suivi-sortie"') < html.indexOf('id="lien-retour"'), "la pilule est à côté de la flèche, avant elle");
  assert.match(html, /\$\("suivi-sortie"\)\.addEventListener\("click", quitterSuivi\)/, "le même geste que la sortie du repère");
  // Les DEUX classes dans le sélecteur : `.suivi-sortie` seule perd contre
  // `.catalogue-link`, déclarée plus bas dans la même feuille avec la même
  // spécificité — la pilule s'affichait aussi sur PC et tablette, en double
  // avec la sortie du repère (mesuré au navigateur le 08/09 : 124 × 44 à
  // 1366 px, à côté du « · Se déconnecter » du repère).
  assert.match(html, /\n    \.catalogue-link\.suivi-sortie \{ display: none; \}/, "invisible hors téléphone");
  assert.ok(html.indexOf(".catalogue-link.suivi-sortie { display: none; }") < html.indexOf("\n    .catalogue-link {"),
    "la règle de base est écrite AVANT `.catalogue-link` : seule sa spécificité la fait gagner");
  const mobile = html.slice(html.indexOf("@media (max-width: 620px) {"), html.indexOf("@media (min-width: 621px) and (max-height: 900px)"));
  assert.match(mobile, /\.suivi-repere \{ display: block; margin: -2px 0 0; padding: 4px 10px; font-size: \.8rem;/, "le repère reste sous le logo, sur une ligne");
  assert.doesNotMatch(mobile, /\.suivi-repere \{ order: -1/, "pas de bande d’état au-dessus du logo (version B écartée)");
  assert.match(mobile, /\.suivi-repere:not\(\.detache\):not\(\.hors-ligne\) \{ white-space: nowrap; overflow: hidden; text-overflow: ellipsis; \}/, "une seule ligne, « … » si le prénom est long ; les états longs (code refusé, hors ligne) gardent le droit de passer à la ligne");
  assert.match(mobile, /\.suivi-repere \.sortie-bloc \{ display: none; \}/);
  assert.match(mobile, /\.catalogue-link\.suivi-sortie \{ display: inline-flex; \}/, "même sélecteur à deux classes, sinon la règle de base gagnerait ici");
  assert.match(html, /bloc\.className = "sortie-bloc";/);
  assert.doesNotMatch(html, /Suivi par ton professeur\$\{qui\}\$\{ou\}[^`]/, "le texte du repère ne change pas");

  // Exécuté : la pilule suit le code, comme le repère.
  const site = demarrerAppli({});
  site.api.renderRepere();
  assert.equal(site.document.getElementById("suivi-sortie").hidden, true, "sans code, pas de pilule");
  const eleve = demarrerAppli({codeOnglet: "ABC234"});
  eleve.api.renderRepere();
  assert.equal(eleve.document.getElementById("suivi-sortie").hidden, false, "sous un code, la pilule est là");
  assert.equal(eleve.boutonRepere("Se déconnecter")?.textContent, "Se déconnecter", "et la sortie du repère aussi (PC, tablette)");
  eleve.api.quitterSuivi();
  assert.equal(eleve.document.getElementById("suivi-sortie").hidden, true, "après « Se déconnecter », plus de pilule");
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
  // Un seul « conseillé » à la fois : l'étiquette du panneau déplié ne
  // s'écrit que si l'étape elle-même est celle que l'appli conseille.
  assert.match(html, /function panneauChoix\(\{id, legende, items, marquerConseil = true\}\)/);
  assert.match(html, /items\.forEach\(item => zone\.append\(boutonChoix\(\{\.\.\.item, marquerConseil\}\)\)\);/);
  assert.match(html, /if \(conseillee && marquerConseil\) \{/);
  // Lot dosage + validation : « conseilCarte » = le conseil, sauf sur une
  // table acquise (aucune étape conseillée sur une carte cochée).
  assert.match(html, /marquerConseil: conseilCarte === "apprends",/);
  assert.match(html, /marquerConseil: conseilCarte === "entraine",/);
  assert.match(html, /const conseilCarte = ligne\.acquise \? null : conseil;/);
  // Le lecteur d'écran entend la même chose que l'œil voit.
  assert.match(html, /\$\{conseillee && marquerConseil \? " Conseillé\." : ""\}/);
});

test("lot R3 · toucher le cadenas descend jusqu’à « Mon mélange » et l’illumine", () => {
  // A5, décision Q4 : aucun texte nouveau, un geste qui répond.
  assert.match(html, /action: montrerMelange/);
  const corps = html.slice(html.indexOf("function montrerMelange()"), html.indexOf("function badgeRang"));
  assert.match(corps, /document\.querySelector\("\.etape\.melange"\) \|\| \$\("acc-expert"\)/);
  assert.match(corps, /cible\.scrollIntoView\(\{block: "center", behavior: "smooth"\}\)/);
  assert.match(corps, /cible\.classList\.add\("est-montree"\)/);
  assert.match(corps, /setTimeout\(\(\) => cible\.classList\.remove\("est-montree"\), 1000\)/);
  assert.match(html, /\.etape\.est-montree \{ box-shadow:/, "le halo est une ombre : il reste visible sans animation");
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
  // A8 : « conseillé » à 10,9 px → 12 px.
  assert.match(regle(".choix-activite .tag"), /font-size: \.75rem/);
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
