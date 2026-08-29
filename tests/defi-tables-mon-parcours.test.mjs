import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const core = require("../outils/calcul_mental/defi_tables_core.js");
const parcours = require("../outils/calcul_mental/defi_tables_mon_parcours.js");

const DATE = "2026-09-01";

function normaliser(config) {
  return core.normalizeConfiguration(config);
}

function jouer(etat, config, correct, total) {
  return parcours.appliquerSerie(etat, normaliser(config), {correct, total, date: DATE});
}

function acquerirTables(etat, tables) {
  return tables.reduce((courant, table) => jouer(courant, parcours.configValidation(table), 20, 20).parcours, etat);
}

function stockageMemoire(initial = {}) {
  const donnees = {...initial};
  return {
    getItem: cle => (cle in donnees ? donnees[cle] : null),
    setItem: (cle, valeur) => { donnees[cle] = String(valeur); },
    removeItem: cle => { delete donnees[cle]; },
    donnees
  };
}

test("le parcours couvre les tables 2 à 10 et conseille les faciles d’abord", () => {
  assert.deepEqual([...parcours.TABLES], [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual([...parcours.ORDRE_CONSEIL], [2, 10, 5, 3, 4, 6, 7, 8, 9]);
  const vide = parcours.creerParcours();
  assert.equal(vide.version, 1);
  assert.equal(vide.prenom, "");
  assert.deepEqual(Object.keys(vide.tables).map(Number), [...parcours.TABLES]);
  assert.ok(parcours.estVide(vide));
});

test("les configurations du parcours sont acceptées par le moteur de questions", () => {
  const entrainement = normaliser(parcours.configEntraine(7, "trous"));
  assert.equal(entrainement.mode, "train");
  assert.deepEqual(entrainement.tables, [7]);
  assert.equal(entrainement.total, 10);
  assert.equal(entrainement.duration, null);
  assert.deepEqual(entrainement.questionTypes, ["missing"]);
  assert.ok(core.generateQuestions(entrainement).every(question => question.category === "missing"));

  const mixte = normaliser(parcours.configEntraine(7, "mixte"));
  assert.deepEqual(mixte.questionTypes, ["direct", "missing"]);

  const validation = normaliser(parcours.configValidation(7));
  assert.equal(validation.mode, "validation");
  assert.equal(validation.total, 20);
  assert.equal(validation.duration, 90);
  assert.deepEqual(validation.questionTypes, ["direct", "missing"]);
  const questions = core.generateQuestions(validation);
  assert.equal(questions.length, 20);
  assert.equal(questions.filter(question => question.category === "direct").length, 14);
  assert.equal(questions.filter(question => question.category === "missing").length, 6);
  assert.ok(questions.every(question => question.focusTable === 7));
  assert.equal(core.configurationLabel(validation), "Je valide ma table · Table de 7 · 20 questions · 1 min 30");
  assert.equal(core.durationLabel(90), "1 min 30");
  assert.equal(normaliser(parcours.configValidation(7, 60)).duration, 90, "pas de validation en 1 minute");
  assert.equal(normaliser(parcours.configValidation(7, 180)).duration, 180);

  const expert = normaliser(parcours.configExpert(3));
  assert.equal(expert.mode, "test");
  assert.deepEqual(expert.tables, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(expert.total, 25);
  assert.equal(expert.duration, 120);
  assert.deepEqual(expert.questionTypes, ["direct", "missing", "division"]);
});

test("J’apprends : ◐ quand on commence, ● quand l’activité est terminée", () => {
  const config = normaliser(parcours.configApprends(7, "random"));
  const commence = parcours.demarrerSerie(parcours.creerParcours(), config);
  assert.equal(commence.tables[7].apprends.random, 1);
  assert.equal(commence.tables[7].apprends.construct, 0);
  const {parcours: fini, evenements} = parcours.appliquerSerie(commence, config, {correct: 8, total: 11, date: DATE});
  assert.equal(fini.tables[7].apprends.random, 2);
  assert.deepEqual(evenements, [{type: "apprends", table: 7, activite: "random", termines: 1}]);
});

test("Je m’entraîne : trois entraînements différents, 1 erreur max sur 10, un raté ne consomme rien", () => {
  let etat = parcours.creerParcours();
  let resultat = jouer(etat, parcours.configEntraine(7, "desordre"), 7, 10);
  etat = resultat.parcours;
  assert.equal(etat.tables[7].entraine.desordre, 1, "essayé sans réussir");
  assert.deepEqual(etat.tables[7].entraine.dernier, {entrainement: "desordre", score: 7, total: 10});
  assert.equal(resultat.evenements[0].reussi, false);

  resultat = jouer(etat, parcours.configEntraine(7, "desordre"), 9, 10);
  etat = resultat.parcours;
  assert.equal(etat.tables[7].entraine.desordre, 2);
  assert.equal(resultat.evenements[0].nouveau, true);
  assert.equal(resultat.evenements[0].reussites, 1);
  assert.equal(resultat.evenements[0].pret, false);

  etat = jouer(etat, parcours.configEntraine(7, "trous"), 10, 10).parcours;
  resultat = jouer(etat, parcours.configEntraine(7, "mixte"), 9, 10);
  etat = resultat.parcours;
  assert.equal(resultat.evenements[0].pret, true, "trois entraînements réussis → prêt à valider");
  assert.equal(etat.tables[7].acquise, null, "trois entraînements ne valident pas la table");

  const rejoue = jouer(etat, parcours.configEntraine(7, "mixte"), 10, 10);
  assert.equal(rejoue.evenements[0].nouveau, false, "un entraînement déjà réussi ne compte pas deux fois");
});

test("un entraînement sur plusieurs tables ou de 20 questions ne compte pas", () => {
  const etat = parcours.creerParcours();
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "train", tables: [6, 7], total: 10})), null);
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "train", tables: [7], total: 20})), null);
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "train", tables: [1], total: 10})), null, "la table de 1 est hors parcours");
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "custom", tables: [7], total: 10})), null);
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "evaluation"})), null);
});

test("Acquise : 20 questions en 1 min 30 avec 2 erreurs max ; 2 ou 3 minutes = préparation", () => {
  let etat = parcours.creerParcours();
  let resultat = jouer(etat, parcours.configValidation(7), 17, 20);
  assert.equal(resultat.evenements[0].reussi, false);
  assert.equal(resultat.parcours.tables[7].acquise, null);

  resultat = jouer(etat, parcours.configValidation(7), 18, 20);
  etat = resultat.parcours;
  assert.equal(etat.tables[7].acquise, DATE);
  assert.deepEqual(resultat.evenements, [{type: "validation", table: 7, reussi: true, score: 18, total: 20, dejaAcquise: false, nouvelle: true}]);

  const encore = jouer(etat, parcours.configValidation(7), 20, 20);
  assert.equal(encore.evenements[0].dejaAcquise, true);
  assert.equal(encore.evenements[0].nouvelle, false);

  const preparation = jouer(parcours.creerParcours(), parcours.configValidation(8, 180), 20, 20);
  assert.equal(preparation.parcours.tables[8].acquise, null, "en 3 minutes on ne valide pas");
  assert.deepEqual(preparation.evenements, [{type: "preparation", table: 8, reussi: true, score: 20, total: 20, duree: 180}]);
  assert.equal(jouer(parcours.creerParcours(), parcours.configValidation(8, 120), 20, 20).evenements[0].type, "preparation");
});

test("le mélange apparaît à 2 tables acquises et repasse « à refaire » à chaque nouvelle table", () => {
  let etat = parcours.creerParcours();
  assert.equal(parcours.configMelange(etat), null);

  let resultat = jouer(etat, parcours.configValidation(2), 20, 20);
  etat = resultat.parcours;
  assert.equal(parcours.configMelange(etat), null, "une seule table : pas encore de mélange");

  resultat = jouer(etat, parcours.configValidation(5), 20, 20);
  etat = resultat.parcours;
  assert.deepEqual(resultat.evenements.map(evenement => evenement.type), ["validation", "melange-debloque"]);
  assert.deepEqual(parcours.configMelange(etat), {mode: "test", tables: [2, 5], testLevel: 1, total: 25, duration: 120});
  assert.equal(etat.melange.aJour, false);
  assert.equal(parcours.prochaineEtape(etat).type, "melange", "le mélange passe avant la table suivante");

  resultat = jouer(etat, parcours.configMelange(etat), 22, 25);
  assert.equal(resultat.evenements[0].type, "melange");
  assert.equal(resultat.evenements[0].reussi, false);
  assert.equal(resultat.parcours.melange.aJour, false);

  resultat = jouer(etat, parcours.configMelange(etat), 23, 25);
  etat = resultat.parcours;
  assert.equal(etat.melange.aJour, true);
  assert.equal(etat.melange.dernier, DATE);
  assert.equal(parcours.prochaineEtape(etat).table, 10, "mélange à jour → table suivante dans l’ordre conseillé");

  resultat = jouer(etat, parcours.configValidation(10), 19, 20);
  etat = resultat.parcours;
  assert.deepEqual(resultat.evenements.map(evenement => evenement.type), ["validation", "melange-a-refaire"]);
  assert.equal(etat.melange.aJour, false);
  assert.equal(etat.melange.aRefaireAvec, 10);
  assert.deepEqual(etat.melange.tables, [2, 5, 10]);
  assert.match(parcours.prochaineEtape(etat).libelle, /avec la table de 10/);
});

test("un test Expert sur un mélange choisi à la main ne compte pas", () => {
  let etat = acquerirTables(parcours.creerParcours(), [2, 5, 10]);
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "test", tables: [2, 5], testLevel: 1})), null, "pas exactement les tables acquises");
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "test", tables: [2, 5, 10], testLevel: 2})), null, "le mélange des acquises est en produits seulement");
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "test", tables: [2, 5, 10], testLevel: 1, duration: 180})), null, "3 minutes ne comptent pas");
  assert.deepEqual(parcours.classerSerie(etat, normaliser({mode: "test", tables: [2, 5, 10], testLevel: 1})), {type: "melange", tables: [2, 5, 10]});
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "test", tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], testLevel: 1})), null, "1 à 10 n’est pas le grand mélange");
});

test("Expert : trois étoiles sur le grand mélange 2 à 10, ★ valide toutes les tables, ★★★ = champion", () => {
  let etat = parcours.creerParcours();
  let resultat = jouer(etat, parcours.configExpert(1), 22, 25);
  assert.equal(resultat.evenements[0].reussi, false);
  assert.equal(resultat.parcours.expert.niveau, 0);
  assert.equal(parcours.tablesAcquises(resultat.parcours).length, 0);

  resultat = jouer(etat, parcours.configExpert(1), 23, 25);
  etat = resultat.parcours;
  assert.equal(etat.expert.niveau, 1);
  assert.equal(resultat.evenements[0].nouveau, true);
  assert.deepEqual(resultat.evenements[0].tablesValidees, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.ok(parcours.toutesAcquises(etat));
  assert.equal(parcours.configMelange(etat), null, "toutes acquises : le mélange intermédiaire disparaît");
  assert.equal(parcours.prochaineEtape(etat).type, "expert");
  assert.equal(parcours.prochaineEtape(etat).niveau, 2);

  resultat = jouer(etat, parcours.configExpert(3), 24, 25);
  etat = resultat.parcours;
  assert.equal(etat.expert.niveau, 3, "réussir le niveau 3 directement donne les trois étoiles");
  assert.equal(etat.expert.champion, DATE);
  assert.equal(resultat.evenements[0].champion, true);
  assert.equal(parcours.prochaineEtape(etat).type, "champion");

  const rejoue = jouer(etat, parcours.configExpert(2), 25, 25);
  assert.equal(rejoue.evenements[0].nouveau, false);
  assert.equal(rejoue.parcours.expert.niveau, 3, "un niveau inférieur ne retire rien");
});

test("Expert est ouvert dès le début, sans verrou", () => {
  const etat = parcours.creerParcours();
  assert.deepEqual(parcours.classerSerie(etat, normaliser(parcours.configExpert(2))), {type: "expert", niveau: 2});
});

test("la prochaine étape suit le parcours d’une table : bâton → entraînements → validation", () => {
  let etat = parcours.creerParcours();
  let etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "apprends");
  assert.equal(etape.table, 2);
  assert.equal(etape.config.learnActivity, "construct");

  etat = parcours.demarrerSerie(etat, normaliser(parcours.configApprends(2, "construct")));
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "entraine");
  assert.equal(etape.entrainement, "desordre");

  etat = jouer(etat, parcours.configEntraine(2, "desordre"), 10, 10).parcours;
  assert.equal(parcours.prochaineEtape(etat).entrainement, "trous");
  etat = jouer(etat, parcours.configEntraine(2, "trous"), 10, 10).parcours;
  etat = jouer(etat, parcours.configEntraine(2, "mixte"), 10, 10).parcours;
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "validation");
  assert.deepEqual(etape.config, {mode: "validation", tables: [2], total: 20, duration: 90});

  etat = jouer(etat, etape.config, 20, 20).parcours;
  assert.equal(parcours.prochaineEtape(etat).table, 10, "après la table de 2 vient la table de 10");
});

test("l’état d’affichage résume la carte sans DOM", () => {
  let etat = acquerirTables(parcours.creerParcours(), [2, 5]);
  etat = jouer(etat, parcours.configEntraine(7, "trous"), 6, 10).parcours;
  const etat2 = parcours.etatAffichage(etat);
  assert.equal(etat2.lignes.length, 9);
  const ligne7 = etat2.lignes.find(ligne => ligne.table === 7);
  assert.deepEqual(ligne7.entraine.map(item => item.etat), [0, 1, 0]);
  assert.deepEqual(ligne7.dernierEntrainement, {entrainement: "trous", score: 6, total: 10});
  assert.equal(etat2.lignes.find(ligne => ligne.table === 2).acquise, DATE);
  assert.deepEqual(etat2.acquises, [2, 5]);
  assert.equal(etat2.melange.visible, true);
  assert.deepEqual(etat2.expert.etoiles, [false, false, false]);
  assert.equal(etat2.prochaine.type, "melange");
});

test("prénom : nettoyé, limité à 20 caractères, conservé à la remise à zéro", () => {
  const etat = parcours.definirPrenom(acquerirTables(parcours.creerParcours(), [2, 5]), "   Léa   Marie-Ange Dupont-Durand ");
  assert.equal(etat.prenom, "Léa Marie-Ange Dupon");
  const zero = parcours.remettreAZero(etat);
  assert.equal(zero.prenom, "Léa Marie-Ange Dupon");
  assert.deepEqual(parcours.tablesAcquises(zero), []);
  assert.equal(parcours.estVide(parcours.remettreAZero(parcours.creerParcours())), true);
});

test("sauvegarde locale : aller-retour, données abîmées et stockage absent", () => {
  const stockage = stockageMemoire();
  let etat = acquerirTables(parcours.definirPrenom(parcours.creerParcours(), "Léa"), [2, 5]);
  etat = jouer(etat, parcours.configMelange(etat), 25, 25).parcours;
  assert.equal(parcours.sauver(stockage, etat), true);
  assert.deepEqual(parcours.charger(stockage), etat);

  assert.deepEqual(parcours.charger(stockageMemoire({[parcours.CLE_STOCKAGE]: "{pas du json"})), parcours.creerParcours());
  const abime = parcours.charger(stockageMemoire({[parcours.CLE_STOCKAGE]: JSON.stringify({prenom: 42, tables: {7: {apprends: {random: 9}, acquise: "2026-09-01"}}, expert: {niveau: 7}})}));
  assert.equal(abime.prenom, "");
  assert.equal(abime.tables[7].apprends.random, 0);
  assert.equal(abime.tables[7].acquise, "2026-09-01");
  assert.equal(abime.expert.niveau, 0);
  assert.equal(abime.melange.aJour, false);

  assert.deepEqual(parcours.charger(null), parcours.creerParcours());
  assert.equal(parcours.sauver(null, etat), false);
  const cassé = {getItem() { throw new Error("quota"); }, setItem() { throw new Error("quota"); }};
  assert.deepEqual(parcours.charger(cassé), parcours.creerParcours());
  assert.equal(parcours.sauver(cassé, etat), false);
});

test("appliquerSerie ne modifie jamais l’objet reçu", () => {
  const etat = parcours.creerParcours();
  const copie = JSON.stringify(etat);
  jouer(etat, parcours.configValidation(7), 20, 20);
  jouer(etat, parcours.configExpert(3), 25, 25);
  parcours.demarrerSerie(etat, normaliser(parcours.configApprends(7, "gaps")));
  assert.equal(JSON.stringify(etat), copie);
});
