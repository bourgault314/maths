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
  assert.equal(resultat.evenements.length, 1, "l’étoile ne raconte pas les étapes intermédiaires (mélange débloqué, toutes acquises)");
  assert.ok(parcours.toutesAcquises(etat));
  assert.equal(parcours.configMelange(etat), null, "toutes acquises : le mélange intermédiaire disparaît");
  assert.equal(parcours.prochaineEtape(etat).type, "expert");
  assert.equal(parcours.prochaineEtape(etat).niveau, 2);

  resultat = jouer(etat, parcours.configExpert(3), 24, 25);
  etat = resultat.parcours;
  assert.equal(etat.expert.niveau, 3, "réussir le niveau 3 directement donne les trois étoiles");
  assert.equal(etat.expert.champion, DATE);
  assert.equal(resultat.evenements[0].champion, true);
  const apresChampion = parcours.prochaineEtape(etat);
  assert.equal(apresChampion.type, "revision", "champion mais grille incomplète : le parcours envoie vers Mes calculs");
  assert.match(apresChampion.libelle, /Champion des tables/);

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

// ---------------------------------------------------------- suivi de classe

test("le code élève se nettoie, se valide et se range à part du parcours", () => {
  assert.equal(parcours.CLE_CODE, "mathsgo-suivi-code");
  assert.equal(parcours.LONGUEUR_CODE, 6);
  assert.equal(parcours.normaliserCode(" c4f-xrj "), "C4FXRJ");
  assert.ok(parcours.codeValide("c4fxrj"));
  assert.ok(!parcours.codeValide("C4FXR"), "cinq caractères");
  assert.ok(!parcours.codeValide("C4FXRO"), "la lettre O n'existe pas dans l'alphabet des codes");
  assert.ok(!parcours.codeValide("C4FXR1"), "le chiffre 1 non plus");

  const stockage = stockageMemoire();
  assert.ok(parcours.sauverCode(stockage, "c4f xrj"));
  assert.equal(stockage.donnees["mathsgo-suivi-code"], "C4FXRJ");
  assert.equal(parcours.chargerCode(stockage), "C4FXRJ");
  assert.ok(!parcours.sauverCode(stockage, "BOF"), "un code invalide n'écrase pas celui qui est là");
  assert.equal(parcours.chargerCode(stockage), "C4FXRJ");
  parcours.effacerCode(stockage);
  assert.equal(parcours.chargerCode(stockage), "");
  assert.equal(stockage.donnees["mathsgo-defi-tables-parcours"], undefined,
    "le code ne touche pas au parcours");
});

test("un code absent ou illisible ne fait jamais planter la lecture", () => {
  assert.equal(parcours.chargerCode(null), "");
  assert.equal(parcours.chargerCode(stockageMemoire()), "");
  assert.equal(parcours.chargerCode(stockageMemoire({"mathsgo-suivi-code": "n'importe quoi"})), "");
  assert.equal(parcours.sauverCode(null, "C4FXRJ"), false);
});

test("fusion : rien ne se perd, on garde le plus avancé des deux", () => {
  // Appareil A : la table 3 est allée plus loin. Appareil B : la table 4.
  let a = parcours.creerParcours();
  a = jouer(a, parcours.configApprends(3, "construct"), 1, 1).parcours;
  a = jouer(a, parcours.configEntraine(3, "desordre"), 10, 10).parcours;
  a = jouer(a, parcours.configValidation(3), 20, 20).parcours;

  let b = parcours.creerParcours();
  b = jouer(b, parcours.configEntraine(4, "trous"), 10, 10).parcours;

  const fusion = parcours.fusionner(a, b);
  assert.equal(fusion.tables[3].apprends.construct, 2, "l'activité faite sur A est gardée");
  assert.equal(fusion.tables[3].entraine.desordre, 2);
  assert.ok(fusion.tables[3].acquise, "la table acquise sur A reste acquise");
  assert.equal(fusion.tables[4].entraine.trous, 2, "l'entraînement fait sur B est gardé");
  // La fusion ne dépend pas de l'ordre des deux appareils.
  const inverse = parcours.fusionner(b, a);
  assert.deepEqual(inverse.tables, fusion.tables);
});

test("fusion : une table acquise garde la date de la PREMIÈRE validation", () => {
  const tot = parcours.normaliserParcours({tables: {5: {acquise: "2026-09-01"}}});
  const tard = parcours.normaliserParcours({tables: {5: {acquise: "2026-11-20"}}});
  assert.equal(parcours.fusionner(tard, tot).tables[5].acquise, "2026-09-01");
  assert.equal(parcours.fusionner(tot, tard).tables[5].acquise, "2026-09-01");
});

test("fusion : la grille garde le maximum de cases, et ne rouvre pas le gain du jour", () => {
  const a = parcours.normaliserParcours({calculs: {
    "3-8": {cases: 3, vu: "2026-09-10", erreur: null, gagne: "2026-09-10"},
    "6-7": {cases: 1, vu: "2026-09-02", erreur: "2026-09-02", gagne: null}
  }});
  const b = parcours.normaliserParcours({calculs: {
    "3-8": {cases: 1, vu: "2026-09-12", erreur: "2026-09-12", gagne: null},
    "9-9": {cases: 0, vu: "2026-09-11", erreur: "2026-09-11", gagne: null}
  }});
  const fusion = parcours.fusionner(a, b);
  assert.equal(fusion.calculs["3-8"].cases, 3, "le plus avancé gagne");
  assert.equal(fusion.calculs["3-8"].vu, "2026-09-12", "la vue la plus récente");
  assert.equal(fusion.calculs["3-8"].erreur, "2026-09-12", "l'erreur la plus récente est conservée");
  assert.equal(fusion.calculs["6-7"].cases, 1, "un calcul connu d'un seul côté est repris tel quel");
  assert.equal(fusion.calculs["9-9"].cases, 0);
  assert.equal(Object.keys(fusion.calculs).length, 3);
});

test("fusion : le mélange redevient à refaire si l’autre appareil a plus de tables", () => {
  const cinq = acquerirTables(parcours.creerParcours(), [2, 3, 4, 5, 6]);
  const cinqAJour = jouer(cinq, parcours.configMelange(cinq), 25, 25).parcours;
  assert.equal(cinqAJour.melange.aJour, true);

  const sept = acquerirTables(parcours.creerParcours(), [2, 3, 4, 5, 6, 7, 8]);
  const fusion = parcours.fusionner(cinqAJour, sept);
  assert.equal(parcours.tablesAcquises(fusion).length, 7);
  assert.equal(fusion.melange.aJour, false, "le mélange n'avait pas été fait avec les 7 tables");

  // Même nombre de tables des deux côtés : le mélange reste acquis.
  const memeCinq = acquerirTables(parcours.creerParcours(), [2, 3, 4, 5, 6]);
  assert.equal(parcours.fusionner(cinqAJour, memeCinq).melange.aJour, true);
});

test("fusion : les étoiles Expert prennent le meilleur niveau, le titre sa première date", () => {
  const a = parcours.normaliserParcours({expert: {niveau: 1, dernier: "2026-09-01", champion: null}});
  const b = parcours.normaliserParcours({expert: {niveau: 3, dernier: "2026-10-01", champion: "2026-10-01"}});
  const fusion = parcours.fusionner(a, b);
  assert.equal(fusion.expert.niveau, 3);
  assert.equal(fusion.expert.dernier, "2026-10-01");
  assert.equal(fusion.expert.champion, "2026-10-01");
});

test("fusion : le prénom de l’appareil devant l’élève l’emporte", () => {
  const local = parcours.definirPrenom(parcours.creerParcours(), "Léa");
  const distant = parcours.definirPrenom(parcours.creerParcours(), "Léa B");
  assert.equal(parcours.fusionner(local, distant).prenom, "Léa");
  assert.equal(parcours.fusionner(parcours.creerParcours(), distant).prenom, "Léa B",
    "si l'appareil n'a pas de prénom, on prend celui du serveur");
});

test("fusion : un parcours vide ou illisible ne casse rien et ne perd rien", () => {
  const plein = acquerirTables(parcours.creerParcours(), [2, 3]);
  assert.deepEqual(parcours.fusionner(plein, null).tables, plein.tables);
  assert.deepEqual(parcours.fusionner(null, plein).tables, plein.tables);
  assert.deepEqual(parcours.fusionner("n'importe quoi", plein).tables, plein.tables);
  assert.ok(parcours.estVide(parcours.fusionner(null, undefined)));
});

test("fusion : fusionner un parcours avec lui-même ne le change pas", () => {
  let etat = acquerirTables(parcours.creerParcours(), [2, 3, 4]);
  etat = jouer(etat, parcours.configEntraine(5, "mixte"), 10, 10).parcours;
  assert.deepEqual(parcours.fusionner(etat, etat), parcours.normaliserParcours(etat));
});

test("vue classe : les calculs qui coincent chez le plus d’élèves", () => {
  const eleve = calculs => parcours.normaliserParcours({calculs});
  const rate = date => ({cases: 0, vu: date, erreur: date, gagne: null});
  const su = date => ({cases: 3, vu: date, erreur: null, gagne: date});
  const classe = [
    eleve({"7-8": rate("2026-09-10"), "6-7": rate("2026-09-10")}),
    eleve({"7-8": rate("2026-09-11"), "9-9": rate("2026-09-11")}),
    eleve({"7-8": rate("2026-09-12")}),
    eleve({"6-7": rate("2026-09-12"), "3-4": su("2026-09-12")}),
    null
  ];
  const fragiles = parcours.fragilesDeLaClasse(classe, {max: 3});
  assert.equal(fragiles.length, 3);
  assert.deepEqual(fragiles[0], {cle: "7-8", libelle: parcours.libelleFait("7-8"), eleves: 3});
  assert.equal(fragiles[1].cle, "6-7");
  assert.equal(fragiles[1].eleves, 2);
  assert.ok(!fragiles.some(fragile => fragile.cle === "3-4"), "un calcul su n'est pas fragile");
  assert.deepEqual(parcours.fragilesDeLaClasse([]), []);
  assert.deepEqual(parcours.fragilesDeLaClasse(null), []);
});

const html = await (await import("node:fs/promises")).readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const confidentialite = await (await import("node:fs/promises")).readFile(new URL("../confidentialite.html", import.meta.url), "utf8");

test("la page charge le moteur du parcours et propose la carte Mon parcours", () => {
  assert.match(html, /<script src="\.\/defi_tables_mon_parcours\.js\?v=[^"]+"><\/script>/);
  assert.match(html, /window\.MATHSGO_DEFI_TABLES_MON_PARCOURS/);
  assert.match(html, /id="open-parcours"[^>]*class="mode-card mode-card-parcours"[\s\S]*Mon parcours/);
  assert.match(html, /id="parcours"[^>]*class="parcours-screen"/);
  assert.match(html, /id="parcours-list"/);
  assert.match(html, /id="parcours-melange"/);
  assert.match(html, /id="parcours-expert"/);
  assert.match(html, /id="parcours-next"/);
  assert.match(html, /\["intro", "launch", "play", "result", "parcours", "calculs"\]/);
});

test("prénom local, remise à zéro confirmée dans la page, résultat relié au parcours", () => {
  assert.match(html, /id="parcours-name-input"[^>]*maxlength="20"/);
  assert.match(html, /Ton prénom reste sur cet appareil\. Si ton professeur te donne un code/);
  assert.match(html, /id="parcours-reset"[\s\S]*Recommencer à zéro/);
  assert.match(html, /id="parcours-confirm-yes"[\s\S]*Effacer/);
  assert.doesNotMatch(html, /window\.confirm\(/);
  assert.match(html, /PARCOURS\.appliquerSerie\(parcours, state\.configuration, \{correct: state\.correct, total: TOTAL\}\)/);
  assert.match(html, /PARCOURS\.demarrerSerie\(parcours, config\)/);
  assert.match(html, /id="result-parcours"/);
  assert.match(html, /id="result-open-parcours"[\s\S]*Voir mon parcours/);
  assert.match(html, /ouvrir === "parcours" \|\| codeDemande\) openParcours\(\);/);
});

test("Je m’entraîne propose produits, trous ou les deux ; la validation se lance en 1 min 30, 2 ou 3 min", () => {
  assert.match(html, /id="train-type-settings"[\s\S]*data-train-type="desordre"[\s\S]*data-train-type="trous"[\s\S]*data-train-type="mixte"/);
  assert.match(html, /const TRAIN_TYPES = \{desordre: \["direct"\], trous: \["missing"\], mixte: \["direct", "missing"\]\}/);
  assert.match(html, /data-launch-duration="90"[\s\S]*data-launch-duration="120"[\s\S]*data-launch-duration="180"/);
  assert.match(html, /Ta table est validée en 1 min 30\./);
  assert.match(html, /const completeReview = state\.configuration\.mode === "test" \|\| state\.configuration\.mode === "validation";/);
});

test("dans Je deviens expert, « Toutes les tables » coche 2 à 10", () => {
  assert.match(html, /return mode === "test" \? PARCOURS_TABLES : ALL_TABLES;/);
  assert.match(html, /"Toutes les tables \(2 à 10\)"/);
  assert.equal(core.configurationLabel(normaliser({mode: "test", tables: [2, 3, 4, 5, 6, 7, 8, 9, 10]})), "Je deviens expert · Tables de 2 à 10 · niveau 1 · 25 questions · 2 minutes");
  assert.equal(core.configurationLabel(normaliser(parcours.configEntraine(7, "trous"))), "Je m’entraîne · Table de 7 · nombres manquants · 10 questions · sans chronomètre");
  assert.equal(core.configurationLabel(normaliser({mode: "train", tables: [6, 7]})), "Je m’entraîne · Tables de 6 et 7 · 10 questions · sans chronomètre");
});

test("la page Confidentialité décrit la sauvegarde locale de Mon parcours", () => {
  assert.match(confidentialite, /<code>mathsgo-defi-tables-parcours<\/code>/);
  assert.match(confidentialite, /un prénom saisi librement et la progression par table/);
  assert.match(confidentialite, /Recommencer à zéro/);
});

test("sur écran large, Mon parcours passe en deux colonnes compactes", () => {
  assert.match(html, /@media \(min-width: 1040px\) \{[\s\S]*?\.parcours-screen \{ max-width: 1120px; \}/);
  assert.match(html, /@media \(min-width: 1040px\) \{[\s\S]*?\.parcours-list \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(html, /@media \(min-width: 1040px\) \{[\s\S]*?\.parcours-cells \.cell \{ min-height: 34px/);
  assert.match(html, /\.parcours-screen \{ max-width: 720px/, "en dessous de 1040 px, rien ne change");
  assert.match(html, /\.calculs-screen \{ max-width: 560px/, "Mes calculs garde sa largeur");
});

test("la fiche « Mon parcours des tables » s’imprime depuis l’appli et existe en PDF vide avec sa source", async () => {
  const fs = await import("node:fs/promises");
  assert.match(html, /id="fiche-print" class="fiche-print" aria-hidden="true"/);
  assert.match(html, /body > \*:not\(#fiche-print\) \{ display: none !important; \}/);
  assert.match(html, /@page \{ size: A4 portrait; margin: 12mm; \}/);
  assert.match(html, /id="parcours-print"[\s\S]*Imprimer ma fiche/);
  assert.match(html, /window\.addEventListener\("beforeprint", renderFiche\)/);
  assert.match(html, /href="\.\/fiche_parcours_tables\.pdf" target="_blank" rel="noopener">Fiche vierge à remplir/);
  assert.match(html, /src="\.\.\/\.\.\/assets\/img\/qr-defi-tables-parcours\.svg"/);
  assert.match(html, /mathsgo\.re · CC BY-NC-SA 4\.0/);
  const pdf = await fs.readFile(new URL("../outils/calcul_mental/fiche_parcours_tables.pdf", import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 5000);
  const qr = await fs.readFile(new URL("../assets/img/qr-defi-tables-parcours.svg", import.meta.url), "utf8");
  assert.match(qr, /<svg/);
  const source = await fs.readFile(new URL("../_sources/defi-tables/generer_fiche_parcours.py", import.meta.url), "utf8");
  assert.match(source, /defi_tables\.html#parcours/);
  assert.match(source, /fiche_parcours_tables\.pdf/);
});

test("l’appli est branchée au suivi de classe sans jamais bloquer", () => {
  // Le code arrive par le lien de l'espace élève, ou se tape dans le menu ⋯.
  // L'adresse se lit comme une liste de paramètres : l'espace élève ajoute
  // « &ouvrir=parcours » derrière le code, et le code doit rester reconnu.
  assert.match(html, /new URLSearchParams\(adresse\.replace\(\/\^#\/, ""\)\)/);
  assert.match(html, /parametres\.get\("code"\)/);
  assert.match(html, /parametres\.get\("fiche"\)/);
  assert.match(html, /parametres\.get\("ouvrir"\)/);
  assert.match(html, /id="parcours-code-open"/);
  assert.match(html, /id="parcours-code-remove"/);
  assert.match(html, /id="parcours-suivi"/, "le repère de suivi est permanent");
  assert.match(html, /id="parcours-fusion"/, "la question posée sur un appareil partagé");

  // Chaque enregistrement local part aussi au serveur, sans être attendu.
  assert.match(html, /function sauverParcours\(\) \{\s*PARCOURS\.sauver\(storage\(\), parcours\);\s*envoyerParcours\(\);/);
  assert.doesNotMatch(html, /await envoyerParcours\(\)/, "l'envoi ne doit jamais être attendu");
  assert.match(html, /navigator\.sendBeacon/, "le dernier envoi part même si la page se ferme");
  assert.match(html, /https:\/\/suivi\.mathsgo\.re/);
});

test("effacer le parcours d’un camarade demande une confirmation", () => {
  // Sur un appareil partagé, « ce n'est pas le mien » efface le travail de
  // quelqu'un qui n'a peut-être pas de code : on prévient avant.
  assert.match(html, /questionFusion\.confirme/);
  assert.match(html, /son travail sera perdu/);
  assert.match(html, /Oui, efface-le/);
  assert.match(html, /Annuler/);
});

test("sans connexion, l’élève n’est pas laissé à croire qu’il est suivi", () => {
  assert.match(html, /let suiviHorsLigne = false;/);
  assert.match(html, /pas de connexion, ton travail partira plus tard/);
  // Un code venu du lien du professeur est gardé même si le serveur est muet.
  assert.match(html, /if \(silencieux\) \{\s*\n\s*codeSuivi = code;/);
  assert.match(html, /\.parcours-suivi\.hors-ligne/);
});

test("la fiche montre les calculs en carré de Pythagore", () => {
  // Choix du 30/08/2026 : le carré parle mieux qu'une liste — on voit d'un
  // coup quelle ligne et quelle colonne sont encore vides.
  assert.match(html, /class="fiche-carre"/);
  assert.match(html, /const facteurs = \[2, 3, 4, 5, 6, 7, 8, 9\];/);
  // La moitié miroir affiche le même calcul : 7×8 et 8×7 partagent leurs cases.
  assert.match(html, /Math\.min\(ligne, colonne\)\}-\$\{Math\.max\(ligne, colonne\)/);
  assert.doesNotMatch(html, /id="fiche-calculs" class="fiche-calculs-grid"/);
});

test("la fiche imprimable peut afficher le parcours d’un autre élève", () => {
  // Le professeur ouvre …#fiche=CODE : même gabarit, rempli depuis le serveur.
  assert.match(html, /function renderFiche\(source\)/);
  assert.match(html, /const fiche = source \|\| parcours;/);
  assert.match(html, /id="fiche-ecran"/);
  assert.match(html, /mode-fiche/);
});

test("les retours utilisent la flèche SVG du site, pas le caractère ←", () => {
  const arrow = /<path d="M19 12H5M11 6l-6 6 6 6"/g;
  assert.ok((html.match(arrow) || []).length >= 4, "catalogue, réglages, parcours, jeu");
  assert.doesNotMatch(html, /<button[^>]*>←/);
  assert.doesNotMatch(html, /aria-hidden="true">←</);
});

// Une accolade en trop dans la feuille de style ne se voit dans aucun
// assert.match : le texte cherché est toujours là, mais le navigateur jette la
// règle qui SUIT l'accolade orpheline. C'est ainsi que « @media print » avait
// disparu de la page tout en restant dans le fichier — l'élève imprimait alors
// toute l'application au lieu de sa seule fiche.
test("la feuille de style de Défi tables est équilibrée, et @media print survit", () => {
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(trouve => trouve[1]);
  assert.ok(styles.length >= 1, "la page doit porter au moins une feuille de style");
  styles.forEach((css, index) => {
    const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, "");
    let profondeur = 0;
    for (const caractere of sansCommentaires) {
      if (caractere === "{") profondeur += 1;
      else if (caractere === "}") profondeur -= 1;
      assert.ok(profondeur >= 0, `accolade fermante en trop dans le bloc <style> n°${index + 1}`);
    }
    assert.equal(profondeur, 0, `accolades non refermées dans le bloc <style> n°${index + 1}`);
  });
  // La règle qu'une accolade orpheline ferait disparaître en premier.
  assert.match(html, /@media print \{\s*\n\s*@page \{ size: A4 portrait; margin: 12mm; \}/);
});

// Le lot 8 a corrigé un bug qu'aucun assert.match ne pouvait voir : l'aiguillage
// cherchait /^#code=(…)$/, et le lien réel de l'espace élève porte
// « &ouvrir=parcours » derrière le code. Le code passait inaperçu, plus rien ne
// remontait au professeur, et rien ne le signalait. Une assertion sur le TEXTE du
// fichier n'aurait rien changé : elle aurait décrit la mauvaise règle avec
// autant d'aplomb. Ce test EXÉCUTE l'aiguillage tel qu'il est écrit dans la page,
// sur le lien que le serveur fabrique vraiment.
test("l’aiguillage de l’adresse reconnaît le lien réel de l’espace élève", () => {
  const bloc = /const adresse = window\.location\.hash \|\| "";([\s\S]*?)\n      \}\n    \}\)\(\);/.exec(html);
  assert.ok(bloc, "le bloc de lecture de l’adresse doit être trouvable dans la page");

  const aiguiller = new Function("hash", `
    const appels = [];
    const window = {location: {hash}};
    const openParcours = () => appels.push("parcours");
    const openCalculs = () => appels.push("calculs");
    const ouvrirFicheEleve = code => appels.push("fiche:" + code);
    const demarrerSuivi = code => appels.push("suivi:" + code);
    const adresse = window.location.hash || "";${bloc[1]}
    }
    return appels;
  `);

  // Le lien que _serveur/public/index.php construit réellement pour Défi tables
  // (applis.php déclare ancre = "parcours").
  assert.deepEqual(aiguiller("#code=2F4FUL&ouvrir=parcours"), ["parcours", "suivi:2F4FUL"],
    "le code doit être reconnu même quand un autre paramètre le suit");
  assert.deepEqual(aiguiller("#code=2F4FUL"), ["parcours", "suivi:2F4FUL"]);
  assert.deepEqual(aiguiller("#parcours"), ["parcours", "suivi:null"]);
  assert.deepEqual(aiguiller("#calculs"), ["calculs", "suivi:null"]);
  assert.deepEqual(aiguiller("#ouvrir=calculs&code=2F4FUL"), ["calculs", "suivi:2F4FUL"]);
  assert.deepEqual(aiguiller("#fiche=CDEF23"), ["fiche:CDEF23"], "la fiche du professeur ne démarre aucun suivi");
  assert.deepEqual(aiguiller(""), ["suivi:null"], "sans adresse, l’appli s’ouvre normalement");
});

// Le lien est fabriqué d'un côté et lu de l'autre : c'est l'écart entre les deux
// qui a coûté le lot 8. On vérifie que le serveur ne met dans l'adresse que des
// paramètres que la page sait lire.
test("le lien fabriqué par l’espace élève ne porte que des paramètres que l’appli lit", async () => {
  const fs = await import("node:fs/promises");
  const espaceEleve = await fs.readFile(new URL("../_serveur/public/index.php", import.meta.url), "utf8");
  const gabarit = /lien\.href = `\$\{appli\.url\}([^`]*)`\s*\+\s*\(appli\.ancre \? `([^`]*)`/.exec(espaceEleve);
  assert.ok(gabarit, "le gabarit du lien doit rester trouvable dans l’espace élève");
  const parametres = [...`${gabarit[1]}${gabarit[2]}`.matchAll(/[#&]([a-z]+)=/g)].map(trouve => trouve[1]);
  assert.deepEqual(parametres, ["code", "ouvrir"]);
  parametres.forEach(nom => {
    assert.ok(html.includes(`parametres.get("${nom}")`),
      `l’appli doit lire le paramètre « ${nom} » que le serveur met dans l’adresse`);
  });
});
