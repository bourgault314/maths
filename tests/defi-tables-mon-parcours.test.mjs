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

// Passe des tables l'une après l'autre. Lot « un seul système » (05/10/2026) :
// plus de verrou, le mélange n'a plus à être réussi entre deux tables.
function acquerirTables(etat, tables) {
  return tables.reduce((courant, table) => jouer(courant, parcours.configValidation(table), 20, 20).parcours, etat);
}

function stockageMemoire(initial = {}) {
  const donnees = {...initial};
  return {
    getItem: cle => (cle in donnees ? donnees[cle] : null),
    setItem: (cle, valeur) => { donnees[cle] = String(valeur); },
    removeItem: cle => { delete donnees[cle]; },
    key: i => Object.keys(donnees)[i] ?? null,
    get length() { return Object.keys(donnees).length; },
    donnees
  };
}

// Sous un code, la case durable ne porte pas de prénom (lot 8).
const sansPrenom = p => parcours.definirPrenom(p, "");

test("le parcours couvre les tables 2 à 10 et conseille les faciles d’abord", () => {
  assert.deepEqual([...parcours.TABLES], [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual([...parcours.ORDRE_CONSEIL], [2, 10, 5, 3, 4, 6, 7, 8, 9]);
  const vide = parcours.creerParcours();
  assert.equal(vide.version, 5, "lot « le jour vert » : version 5 du parcours (le travail hors séance ; 4 = lot S1, le journal des séances ; 3 = lot mémoire, 2 = lot 3)");
  assert.equal(vide.prenom, "");
  assert.deepEqual(Object.keys(vide.tables).map(Number), [...parcours.TABLES]);
  assert.ok(parcours.estVide(vide));
});

test("les configurations du parcours sont acceptées par le moteur de questions", () => {
  // Lot « divisions » (04/10/2026) : les divisions prennent une partie de la
  // place des nombres manquants, dans les deux sens. Lot « trois divisions »
  // (09/10/2026) : leurs trois écritures (56 ÷ 7 = ?, ? ÷ 7 = 8, 56 ÷ ? = 8).
  const compter = questions => ["direct", "missing", "division"].map(categorie => questions.filter(question => question.category === categorie).length);
  const entrainement = normaliser(parcours.configEntraine(7, "trous"));
  assert.equal(entrainement.mode, "train");
  assert.deepEqual(entrainement.tables, [7]);
  assert.equal(entrainement.total, 10);
  assert.equal(entrainement.duration, null);
  assert.deepEqual(entrainement.questionTypes, ["missing", "division"]);
  const mixte = normaliser(parcours.configEntraine(7, "mixte"));
  assert.deepEqual(mixte.questionTypes, ["direct", "missing", "division"]);
  const sens = new Set();
  const ecritures = new Set();
  for (let tirage = 0; tirage < 40; tirage += 1) {
    const trous = core.generateQuestions(entrainement);
    assert.deepEqual(compter(trous), [0, 5, 5], "marche 6 : 5 nombres manquants + 5 divisions");
    assert.deepEqual(compter(core.generateQuestions(mixte)), [6, 2, 2], "marche 7 : 6 résultats, 2 nombres manquants, 2 divisions");
    trous.filter(question => question.category === "division").forEach(question => {
      ecritures.add(question.type);
      assert.equal(question.product, question.first * question.second);
      assert.ok([question.first, question.second].includes(7), "une division de la table de 7");
      assert.equal(question.factKey, `${Math.min(question.first, question.second)}-${Math.max(question.first, question.second)}`, "elle compte pour son calcul (56 ÷ 7 = case 7 × 8)");
      sens.add(question.first === 7 ? "par la table" : "par l'autre facteur");
    });
  }
  assert.equal(sens.size, 2, "les deux sens : 56 ÷ 7 et 56 ÷ 8");
  assert.deepEqual([...ecritures].sort(), ["division-dividend", "division-divisor", "division-quotient"], "les trois écritures dans l'entraînement : 56 ÷ 7 = ?, ? ÷ 7 = 8, 56 ÷ ? = 8");
  const expert = core.generateQuestions(normaliser(parcours.configEtoile(1)));
  assert.ok(expert.some(question => question.type !== "division-quotient" && question.category === "division"), "Expert garde ses trois formes");

  const validation = normaliser(parcours.configValidation(7));
  assert.equal(validation.mode, "validation");
  assert.equal(validation.total, 20);
  assert.equal(validation.duration, 90);
  assert.deepEqual(validation.questionTypes, ["direct", "missing", "division"]);
  const questions = core.generateQuestions(validation);
  assert.equal(questions.length, 20);
  // Lot « le tirage des questions » (10/10/2026) : le test d'une table pose
  // 10 résultats, 5 nombres manquants, 5 divisions (avant : 14 + 3 + 3).
  assert.deepEqual(compter(questions), [10, 5, 5], "10 résultats, 5 nombres manquants, 5 divisions");
  // Lot « trois divisions » (09/10/2026), revu au lot « le tirage » : au
  // test, les divisions où l'on cherche (56 ÷ 7 = ?, 56 ÷ ? = 8), pas
  // « ? ÷ 7 = 8 » (c'est 7 × 8).
  const ecrituresDuTest = questions.filter(question => question.category === "division").map(question => question.type);
  assert.equal(ecrituresDuTest.filter(type => type === "division-dividend").length, 0);
  assert.deepEqual(["division-divisor", "division-quotient"].map(type => ecrituresDuTest.filter(ecriture => ecriture === type).length).sort(), [2, 3]);
  assert.ok(questions.every(question => question.focusTable === 7));
  assert.equal(core.configurationLabel(validation), "Je passe le test · Table de 7 · 20 questions · 1 min 30");
  assert.equal(core.durationLabel(90), "1 min 30");
  assert.equal(normaliser(parcours.configValidation(7, 60)).duration, 90, "pas de validation en 1 minute");
  assert.equal(normaliser(parcours.configValidation(7, 180)).duration, 180);

  // Le mélange (lot 3) : le format de la validation, sur les tables acquises.
  const melange = normaliser(parcours.configMelange(acquerirTables(parcours.creerParcours(), [2, 10])));
  assert.equal(melange.mode, "validation");
  assert.deepEqual(melange.tables, [2, 10]);
  assert.equal(melange.total, 20);
  assert.equal(melange.duration, 90);
  const questionsMelange = core.generateQuestions(melange);
  assert.deepEqual(compter(questionsMelange), [14, 3, 3], "le mélange a le format de la validation (lot « divisions » : 3 divisions)");
  assert.deepEqual([...new Set(questionsMelange.map(question => question.focusTable))].sort(), [10, 2]);
  assert.equal(core.configurationLabel(melange), "Mon mélange · Tables de 2 et 10 · 20 questions · 1 min 30");

  // Une marche de l'escalier : tout, toutes les tables, seule la durée change.
  const etoile = normaliser(parcours.configEtoile(2));
  assert.equal(etoile.mode, "test");
  assert.deepEqual(etoile.tables, [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(etoile.total, 25);
  assert.equal(etoile.duration, 105);
  assert.deepEqual(etoile.questionTypes, ["direct", "missing", "division"], "les divisions dès la première étoile");
  assert.deepEqual([1, 2, 3, 4, 5].map(n => normaliser(parcours.configEtoile(n)).duration), [120, 105, 90, 75, 60]);
  assert.equal(core.durationLabel(105), "1 min 45");
  assert.equal(core.durationLabel(75), "1 min 15");
  assert.equal(core.configurationLabel(etoile), "Je deviens expert · Tables de 2 à 10 · produits, trous, divisions · 25 questions · 1 min 45");
});

test("J’apprends : ◐ quand on commence, ● quand l’activité est terminée", () => {
  const config = normaliser(parcours.configApprends(7, "random"));
  const commence = parcours.demarrerSerie(parcours.creerParcours(), config);
  assert.equal(commence.tables[7].apprends.random, 1);
  assert.equal(commence.tables[7].apprends.construct, 0);
  const {parcours: fini, evenements} = parcours.appliquerSerie(commence, config, {correct: 8, total: 11, date: DATE});
  assert.equal(fini.tables[7].apprends.random, 2);
  assert.deepEqual(evenements, [{type: "apprends", table: 7, activite: "random", termines: 1, fois: 1}]);
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

test("Passée : « Je passe le test », 20 questions en 1 min 30 avec 1 erreur max (lot du 21/10/2026) ; 2 ou 3 minutes = préparation", () => {
  let etat = parcours.creerParcours();
  let resultat = jouer(etat, parcours.configValidation(7), 18, 20);
  assert.equal(resultat.evenements[0].reussi, false);
  assert.equal(resultat.parcours.tables[7].acquise, null);

  resultat = jouer(etat, parcours.configValidation(7), 19, 20);
  etat = resultat.parcours;
  assert.equal(etat.tables[7].acquise, DATE);
  assert.deepEqual(resultat.evenements, [
    {type: "validation", table: 7, reussi: true, score: 19, total: 20, dejaAcquise: false, nouvelle: true},
    {type: "rang", rang: 1, nom: "Bronze", cle: "bronze"}
  ], "la première table donne le rang Bronze — et l’événement n’a plus de champ « verrouillee »");

  const encore = jouer(etat, parcours.configValidation(7), 20, 20);
  assert.equal(encore.evenements[0].dejaAcquise, true);
  assert.equal(encore.evenements[0].nouvelle, false);

  const preparation = jouer(parcours.creerParcours(), parcours.configValidation(8, 180), 20, 20);
  assert.equal(preparation.parcours.tables[8].acquise, null, "en 3 minutes on ne valide pas");
  assert.deepEqual(preparation.evenements, [{type: "preparation", table: 8, reussi: true, score: 20, total: 20, duree: 180}]);
  assert.equal(jouer(parcours.creerParcours(), parcours.configValidation(8, 120), 20, 20).evenements[0].type, "preparation");
});

// Lot « un seul système » (05/10/2026) : Mon mélange est libre. Il apparaît
// toujours à 2 tables passées, mais il n'est plus jamais dû : plus de
// « mélange débloqué », plus de « à refaire », il ne passe devant rien.
// Les coupes de Mon mélange (deux depuis le lot « Mon mélange aux paliers »),
// quand aucune n'est gagnée ni à gagner.
const SANS_TROPHEE = [3, 6].map(tables => ({tables, gagne: false, aGagner: false}));

test("le mélange apparaît à 2 tables passées ; libre, il n’est jamais dû et ne repasse plus « à refaire »", () => {
  let etat = parcours.creerParcours();
  assert.equal(parcours.configMelange(etat), null);

  let resultat = jouer(etat, parcours.configValidation(2), 20, 20);
  etat = resultat.parcours;
  assert.equal(parcours.configMelange(etat), null, "une seule table : pas encore de mélange");

  resultat = jouer(etat, parcours.configValidation(5), 20, 20);
  etat = resultat.parcours;
  assert.deepEqual(resultat.evenements.map(evenement => evenement.type), ["validation"], "plus d’événement « melange-debloque »");
  assert.deepEqual(parcours.configMelange(etat), {mode: "validation", tables: [2, 5], total: 20, duration: 90});
  assert.equal(etat.melange.aJour, false);
  assert.deepEqual(parcours.etatAffichage(etat, DATE).melange, {visible: true, tables: [2, 5], dernier: null, score: null, reussi: null, trophees: SANS_TROPHEE}, "proposé, jamais joué ; 2 tables : aucun trophée à gagner encore");
  assert.equal(parcours.prochaineEtape(etat, DATE).type, "apprends", "le mélange ne passe plus devant la table suivante");
  assert.equal(parcours.prochaineEtape(etat, DATE).table, 10);

  // Raté : le parcours garde quand même le jour et le score du dernier joué.
  resultat = jouer(etat, parcours.configMelange(etat), 17, 20);
  assert.deepEqual(resultat.evenements, [{type: "melange", reussi: false, score: 17, total: 20, tables: [2, 5], trophee: null, coupes: []}]);
  assert.equal(resultat.parcours.melange.aJour, false);
  assert.equal(resultat.parcours.melange.dernier, DATE);
  assert.equal(resultat.parcours.melange.score, 17);
  assert.equal(resultat.parcours.melange.reussi, null, "jamais réussi");

  resultat = jouer(etat, parcours.configMelange(etat), 18, 20);
  etat = resultat.parcours;
  assert.deepEqual(resultat.evenements, [{type: "melange", reussi: true, score: 18, total: 20, tables: [2, 5], trophee: null, coupes: []}], "plus de champ « escalierOuvert » ; réussi avec 2 tables : pas encore de trophée");
  assert.equal(etat.melange.aJour, true);
  assert.equal(etat.melange.dernier, DATE);
  assert.equal(etat.melange.score, 18);
  assert.equal(etat.melange.reussi, 2, "réussi avec 2 tables");
  assert.equal(parcours.prochaineEtape(etat, DATE).table, 10, "table suivante dans l’ordre conseillé");

  // Une nouvelle table ne remet rien « à refaire ».
  resultat = jouer(etat, parcours.configValidation(10), 19, 20);
  etat = resultat.parcours;
  assert.deepEqual(resultat.evenements.map(evenement => evenement.type), ["validation", "rang"], "plus d’événement « melange-a-refaire »");
  assert.equal(etat.melange.aJour, true);
  assert.equal(etat.melange.aRefaireAvec, null);
  assert.deepEqual(etat.melange.tables, [2, 5, 10]);
  assert.equal(etat.melange.reussi, 2, "le mélange reste réussi avec 2 tables");
  assert.equal(parcours.prochaineEtape(etat, DATE).type, "apprends", "jamais « melange »");
  assert.equal(parcours.prochaineEtape(etat, DATE).table, 3);
  assert.doesNotMatch(parcours.prochaineEtape(etat, DATE).libelle, /mélange/i);
  // Trois tables passées, mélange réussi avec 2 seulement : le trophée des 3
  // tables est à gagner, pas gagné.
  assert.deepEqual(parcours.etatAffichage(etat, DATE).melange, {visible: true, tables: [2, 5, 10], dernier: DATE, score: 18, reussi: 2,
    trophees: [{tables: 3, gagne: false, aGagner: true}, {tables: 6, gagne: false, aGagner: false}]});
});

// Lot « les trophées » (05/10/2026) : Mon mélange rapporte des coupes — le
// réussir avec au moins 3, puis 6 tables (la 3e, les 9 tables, est retirée au
// lot « Mon mélange aux paliers » du 09/10/2026 : elle était plus dure que la
// première étoile). Rien ne se ferme avec elles.
test("les coupes de Mon mélange : 3, puis 6 tables — gagnées par un mélange réussi, jamais reprises", () => {
  assert.deepEqual([...parcours.SEUILS.melange.trophees], [3, 6]);
  const lire = etat => parcours.tropheesMelange(etat).map(item => `${item.tables}${item.gagne ? "G" : item.aGagner ? "a" : "-"}`).join(" ");
  let etat = acquerirTables(parcours.creerParcours(), [2, 5]);
  assert.equal(lire(etat), "3- 6-", "2 tables : rien à gagner encore");
  etat = acquerirTables(etat, [10]);
  assert.equal(lire(etat), "3a 6-", "3 tables passées : le premier trophée est à gagner");
  // Raté : rien n'est gagné, l'événement ne porte pas de trophée.
  let resultat = jouer(etat, parcours.configMelange(etat), 17, 20);
  assert.equal(resultat.evenements[0].trophee, null);
  assert.equal(lire(resultat.parcours), "3a 6-");
  resultat = jouer(etat, parcours.configMelange(etat), 18, 20);
  etat = resultat.parcours;
  assert.equal(resultat.evenements[0].trophee, 3, "le mélange réussi avec 3 tables gagne le trophée des 3");
  assert.equal(lire(etat), "3G 6-");
  // Rejoué et réussi : le trophée est déjà là, la série n'en gagne pas.
  resultat = jouer(etat, parcours.configMelange(etat), 20, 20);
  assert.equal(resultat.evenements[0].trophee, null, "un trophée ne se gagne qu’une fois");
  // Six tables passées : le deuxième est à gagner, le premier reste gagné
  // (même après un mélange raté).
  etat = acquerirTables(etat, [3, 4, 6]);
  assert.equal(lire(etat), "3G 6a");
  assert.equal(lire(jouer(etat, parcours.configMelange(etat), 10, 20).parcours), "3G 6a", "raté : rien n’est repris");
  // Les 9 tables : la coupe des 6 reste à gagner (libre, sans passage
  // obligé à 9 tables) ; le mélange des 9 la gagne, il n'y a rien au-delà.
  etat = acquerirTables(etat, [7, 8, 9]);
  assert.equal(lire(etat), "3G 6a");
  resultat = jouer(etat, parcours.configMelange(etat), 19, 20);
  assert.equal(resultat.evenements[0].trophee, 6, "la plus grande coupe gagnée par la série");
  assert.deepEqual(resultat.evenements[0].coupes, [6], "toutes celles qu'elle gagne");
  assert.equal(lire(resultat.parcours), "3G 6G");
  assert.deepEqual(parcours.etatAffichage(resultat.parcours, DATE).melange.trophees, parcours.tropheesMelange(resultat.parcours), "l’état d’affichage porte les mêmes trophées");
});

test("un mélange choisi à la main, ou joué en 2 ou 3 minutes, ne compte pas", () => {
  let etat = acquerirTables(parcours.creerParcours(), [2, 5, 10]);
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "validation", tables: [2, 5], total: 20, duration: 90})), null, "pas exactement les tables acquises");
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "validation", tables: [2, 5, 10], total: 20, duration: 120})), null, "2 minutes ne comptent pas");
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "validation", tables: [2, 5, 10], total: 20, duration: 180})), null, "3 minutes non plus");
  assert.deepEqual(parcours.classerSerie(etat, normaliser({mode: "validation", tables: [2, 5, 10], total: 20, duration: 90})), {type: "melange", tables: [2, 5, 10]});
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "test", tables: [2, 5, 10], testLevel: 1})), null, "l’ancien mélange à 25 (mode test) ne compte plus");
  assert.equal(parcours.classerSerie(etat, normaliser({mode: "test", tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], testLevel: 3, duration: 120})), null, "l’escalier est fermé tant que les 9 tables ne sont pas passées");
});

test("l’escalier s’ouvre dès les 9 tables passées, sans mélange ; ★ à 👑 par la durée seule", () => {
  let etat = acquerirTables(parcours.creerParcours(), [2, 10, 5, 3, 4, 6, 7, 8]);
  assert.equal(parcours.escalierOuvert(etat), false);
  assert.equal(parcours.classerSerie(etat, normaliser(parcours.configEtoile(1))), null, "8 tables : fermé");
  // La neuvième table ouvre l'escalier et donne Platine : le mélange n'y est
  // plus pour rien (aucun n'a été joué ici).
  let resultat = jouer(etat, parcours.configValidation(9), 20, 20);
  etat = resultat.parcours;
  assert.ok(parcours.toutesAcquises(etat));
  assert.deepEqual(resultat.evenements.map(evenement => evenement.type), ["validation", "toutes-acquises", "rang"]);
  assert.equal(resultat.evenements[2].nom, "Platine", "Platine = 9 tables passées");
  assert.equal(etat.rang, 4);
  assert.equal(etat.melange.dernier, null, "aucun mélange joué");
  assert.equal(etat.melange.aRefaireAvec, null, "la neuvième table ne remet rien à refaire");
  assert.ok(parcours.escalierOuvert(etat));
  assert.equal(parcours.classerSerie(etat, normaliser(parcours.configEtoile(1))).type, "etoile", "9 tables : ouvert, sans mélange");
  assert.notEqual(parcours.prochaineEtape(etat).type, "melange");
  assert.deepEqual(parcours.prochaineEtape(etat).config, parcours.configEtoile(1));

  // Le mélange des 9 tables reste jouable, libre : il n'ouvre rien et ne
  // donne aucun rang — il rapporte les coupes qui manquent (lot « les
  // trophées » ; deux coupes depuis le lot « Mon mélange aux paliers »).
  resultat = jouer(etat, parcours.configMelange(etat), 20, 20);
  assert.deepEqual(resultat.evenements, [{type: "melange", reussi: true, score: 20, total: 20, tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], trophee: 6, coupes: [3, 6]}], "ni « escalierOuvert », ni rang : seulement les coupes des 3 et des 6 tables");
  assert.equal(resultat.parcours.melange.reussi, 9);
  assert.equal(resultat.parcours.rang, 4);

  resultat = jouer(etat, parcours.configEtoile(1), 22, 25);
  assert.equal(resultat.evenements[0].reussi, false, "3 erreurs : raté");
  assert.equal(resultat.parcours.expert.etoiles, 0);

  resultat = jouer(etat, parcours.configEtoile(1), 23, 25);
  etat = resultat.parcours;
  assert.equal(etat.expert.etoiles, 1);
  assert.equal(resultat.evenements[0].nouveau, true);
  assert.equal(parcours.prochaineEtape(etat).etoile, 2);

  // D5 (lot « après l'audit GPT », décision de Gwenaël du 14/10/2026) : pas
  // de saut — ★★★ jouée à une étoile ne compte pas (la série ne classe rien).
  resultat = jouer(etat, parcours.configEtoile(3), 24, 25);
  assert.deepEqual(resultat.evenements, [], "★★★ à une étoile : la série ne compte pas");
  assert.equal(resultat.parcours.expert.etoiles, 1);
  etat = jouer(etat, parcours.configEtoile(2), 24, 25).parcours;
  etat = jouer(etat, parcours.configEtoile(3), 24, 25).parcours;
  assert.equal(etat.expert.etoiles, 3, "★★ puis ★★★ : marche par marche");
  assert.equal(etat.rang, 4, "toujours Platine : Diamant attend ★★★★");

  const rejoue = jouer(etat, parcours.configEtoile(2), 25, 25);
  assert.deepEqual(rejoue.evenements, [], "rejouer ★★ (gagnée) ne compte pas non plus");
  assert.equal(rejoue.parcours.expert.etoiles, 3, "une marche inférieure ne retire rien");

  resultat = jouer(etat, parcours.configEtoile(4), 25, 25);
  etat = resultat.parcours;
  assert.equal(etat.rang, 5, "★★★★ = Diamant");
  assert.equal(resultat.evenements.find(evenement => evenement.type === "rang").nom, "Diamant");

  resultat = jouer(etat, parcours.configEtoile(5), 25, 25);
  etat = resultat.parcours;
  assert.equal(etat.expert.etoiles, 5);
  assert.equal(etat.expert.couronne, DATE);
  assert.equal(resultat.evenements[0].couronne, true);
  assert.equal(etat.rang, 6, "👑 = Légende des tables");
  const apres = parcours.prochaineEtape(etat);
  assert.equal(apres.type, "legende", "Légende mais grille jamais remplie : rien à réviser, rejouer une marche");
  assert.match(apres.libelle, /Légende des tables/);
});

// Lot « un seul système » (05/10/2026) : le verrou du mélange est supprimé.
test("plus de verrou : une nouvelle table est passée même sans mélange — entraînements et mélange restent libres", () => {
  let etat = acquerirTables(parcours.creerParcours(), [2, 10]);
  assert.equal(parcours.melangeDu, undefined, "« melangeDu » a quitté le moteur");
  assert.equal(etat.melange.dernier, null, "le mélange n’a jamais été joué");
  let resultat = jouer(etat, parcours.configValidation(5), 20, 20);
  assert.equal(resultat.evenements[0].reussi, true, "le test est réussi…");
  assert.ok(!("verrouillee" in resultat.evenements[0]), "…et l’événement n’a plus de champ « verrouillee »");
  assert.equal(resultat.evenements[0].nouvelle, true);
  assert.equal(resultat.parcours.tables[5].acquise, DATE, "la table est passée, sans mélange");
  assert.ok(!resultat.evenements.some(evenement => evenement.type === "melange-debloque" || evenement.type === "melange-a-refaire"));
  assert.ok(!("verrou" in parcours.etatAffichage(etat, DATE)), "l’état d’affichage n’a plus de verrou");
  // J'apprends et Je m'entraîne, sur n'importe quelle table : libres.
  assert.equal(jouer(etat, parcours.configEntraine(5, "trous"), 10, 10).parcours.tables[5].entraine.trous, 2);
  assert.equal(jouer(etat, parcours.configApprends(7, "ordered"), 11, 11).parcours.tables[7].apprends.ordered, 2);
  // Une table déjà passée se rejoue librement.
  const rejoue = jouer(etat, parcours.configValidation(2), 20, 20).evenements[0];
  assert.equal(rejoue.dejaAcquise, true);
  assert.equal(rejoue.nouvelle, false);
  // Un mélange raté ne ferme rien non plus.
  etat = jouer(etat, parcours.configMelange(etat), 10, 20).parcours;
  assert.equal(etat.melange.aJour, false);
  resultat = jouer(etat, parcours.configValidation(5), 19, 20);
  assert.equal(resultat.evenements[0].nouvelle, true);
  assert.deepEqual(parcours.tablesAcquises(resultat.parcours), [2, 5, 10]);
});

test("la prochaine étape suit le parcours d’une table : perles → entraînements → validation", () => {
  let etat = parcours.creerParcours();
  let etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "apprends");
  assert.equal(etape.table, 2);
  assert.equal(etape.config.learnActivity, "beads", "lot 4b : les perles d’abord");
  assert.equal(etape.libelle, "Table de 2 : pousse les perles");

  // Règle du 10/09 : J'apprends reste conseillé tant que les cinq activités
  // ne sont pas terminées — commencer les perles ne suffit pas.
  etat = parcours.demarrerSerie(etat, normaliser(parcours.configApprends(2, "beads")));
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "apprends");
  assert.equal(etape.activite, "beads", "l’activité commencée reste la conseillée");
  etat = jouer(etat, parcours.configApprends(2, "beads"), 11, 11).parcours;
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.activite, "construct", "perles terminées : la bande");
  assert.equal(etape.libelle, "Table de 2 : construis la bande");
  // Un entraînement réussi de lui-même : plus besoin de conseiller J'apprends.
  etat = jouer(etat, parcours.configEntraine(2, "desordre"), 10, 10).parcours;
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "entraine");
  assert.equal(etape.entrainement, "trous");
  // Et l'autre porte : les cinq activités terminées, sans entraînement.
  let studieux = parcours.creerParcours();
  parcours.ACTIVITES_APPRENDS.forEach(activite => { studieux = jouer(studieux, parcours.configApprends(2, activite), 11, 11).parcours; });
  assert.equal(parcours.prochaineEtape(studieux).type, "entraine", "les cinq terminées → Je m’entraîne");
  assert.equal(parcours.prochaineEtape(studieux).entrainement, "desordre");

  etat = parcours.creerParcours();
  etat = jouer(etat, parcours.configEntraine(2, "desordre"), 10, 10).parcours;
  assert.equal(parcours.prochaineEtape(etat).entrainement, "trous");

  etat = jouer(etat, parcours.configEntraine(2, "trous"), 10, 10).parcours;
  etat = jouer(etat, parcours.configEntraine(2, "mixte"), 10, 10).parcours;
  // Lot « dosage + validation » (19/09/2026) : les trois réussis, la
  // validation n'est conseillée que quand les 8 calculs de la table sont en
  // boîte 3. Ici la grille est vide (jouer() ne répond à aucun calcul) : le
  // rond reste sur Je m'entraîne, sur l'entraînement refait le moins souvent.
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "entraine", "3 sur 3 mais la grille pas prête → Je m’entraîne");
  assert.equal(etape.entrainement, "desordre", "les trois à 1 fois → le premier");
  parcours.faitsDeLaTable(2).forEach(cle => { etat.calculs[cle] = {boite: 3, cases: 2, vu: DATE, erreur: null, gagne: DATE, echeance: "2099-01-01"}; });
  etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "validation");
  assert.deepEqual(etape.config, {mode: "validation", tables: [2], total: 20, duration: 90});

  assert.equal(etape.libelle, "Table de 2 : passe le test (20 questions en 1 min 30)");

  etat = jouer(etat, etape.config, 20, 20).parcours;
  assert.equal(parcours.prochaineEtape(etat, DATE).table, 10, "le jour même, après la table de 2 vient la table de 10");
  // Lot « un seul système » : dès le lendemain, Mes calculs du jour (la porte)
  // passe devant — rien n'est dû (échéances en 2099), la série se complète
  // avec les 8 calculs de la table passée, vus la veille.
  const lendemain = parcours.prochaineEtape(etat, "2026-09-02");
  assert.equal(lendemain.type, "revision");
  assert.equal(lendemain.libelle, "Mes calculs du jour : 8 calculs");
});

test("l’état d’affichage résume la carte sans DOM", () => {
  let etat = acquerirTables(parcours.creerParcours(), [2, 5]);
  etat = jouer(etat, parcours.configEntraine(7, "trous"), 6, 10).parcours;
  const etat2 = parcours.etatAffichage(etat, DATE);
  assert.equal(etat2.lignes.length, 9);
  const ligne7 = etat2.lignes.find(ligne => ligne.table === 7);
  assert.deepEqual(ligne7.entraine.map(item => item.etat), [0, 1, 0]);
  assert.deepEqual(ligne7.dernierEntrainement, {entrainement: "trous", score: 6, total: 10});
  assert.equal(etat2.lignes.find(ligne => ligne.table === 2).acquise, DATE);
  assert.deepEqual(etat2.acquises, [2, 5]);
  assert.deepEqual(etat2.melange, {visible: true, tables: [2, 5], dernier: null, score: null, reussi: null, trophees: SANS_TROPHEE}, "Mon mélange : proposé, libre, jamais dû");
  assert.ok(!("verrou" in etat2), "plus de verrou");
  assert.equal(etat2.porte, false, "aucun calcul vu avant aujourd’hui : la porte n’est pas fermée");
  assert.deepEqual(etat2.serieDuJour, {cles: [], dus: 0, complement: 0, restants: 0, faite: false});
  assert.deepEqual(etat2.expert.etoiles, [false, false, false, false, false]);
  assert.equal(etat2.expert.ouvert, false);
  assert.equal(etat2.rang.nom, "Bronze", "2 tables acquises : Bronze (Argent à 3)");
  assert.equal(etat2.prochaine.type, "apprends", "plus jamais « melange » : la table suivante");
  assert.equal(etat2.prochaine.table, 10);
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
  assert.equal(abime.expert.etoiles, 0);
  assert.equal(abime.melange.aJour, false);

  assert.deepEqual(parcours.charger(null), parcours.creerParcours());
  assert.equal(parcours.sauver(null, etat), false);
  const cassé = {getItem() { throw new Error("quota"); }, setItem() { throw new Error("quota"); }};
  assert.deepEqual(parcours.charger(cassé), parcours.creerParcours());
  assert.equal(parcours.sauver(cassé, etat), false);
});

test("une case par code sur l’appareil, plus la case « sans code »", () => {
  const stockage = stockageMemoire();
  const lea = acquerirTables(parcours.definirPrenom(parcours.creerParcours(), "Léa"), [2, 5]);
  const tom = acquerirTables(parcours.definirPrenom(parcours.creerParcours(), "Tom"), [3]);
  const invite = parcours.definirPrenom(parcours.creerParcours(), "Invité");
  // Lot 8 : la clé porte une EMPREINTE du code (16 hexadécimaux), jamais le code.
  const cle = parcours.cleStockage("AXKQ7T", stockage);
  assert.match(cle, new RegExp(`^${parcours.CLE_STOCKAGE}:[0-9a-f]{16}$`));
  assert.doesNotMatch(cle, /AXKQ7T/);
  assert.equal(parcours.cleStockage("axkq7t", stockage), cle, "le code est normalisé");
  assert.notEqual(parcours.cleStockage("BZ4MHP", stockage), cle, "deux codes, deux cases");
  assert.equal(parcours.cleStockage("", stockage), parcours.CLE_STOCKAGE, "sans code : la clé historique");
  assert.equal(parcours.cleStockage(undefined, stockage), parcours.CLE_STOCKAGE);
  assert.equal(parcours.cleSync("AXKQ7T", stockage), parcours.CLE_SYNC + cle.slice(parcours.CLE_STOCKAGE.length),
    "l’état de synchronisation porte la même empreinte");

  assert.ok(parcours.sauver(stockage, lea, "AXKQ7T"));
  assert.ok(parcours.sauver(stockage, tom, "BZ4MHP"));
  assert.ok(parcours.sauver(stockage, invite));
  assert.deepEqual(parcours.charger(stockage, "AXKQ7T"), sansPrenom(lea), "sous un code, la case n’a pas de prénom");
  assert.deepEqual(parcours.charger(stockage, "BZ4MHP"), sansPrenom(tom));
  assert.deepEqual(parcours.charger(stockage), invite, "la case sans code n’a pas été touchée, prénom compris");
  assert.deepEqual(parcours.charger(stockage, "CCCCCC"), parcours.creerParcours(), "un code jamais vu : case vide");
  assert.equal(parcours.clesRevelentUnCode(stockage), false, "aucune clé ne laisse lire un code");
  assert.doesNotMatch(JSON.stringify(stockage.donnees), /Léa|Tom/, "aucun prénom d’élève suivi dans le stockage durable");
  assert.match(JSON.stringify(stockage.donnees), /Invité/, "le prénom de la case sans code, lui, reste");

  assert.ok(parcours.effacer(stockage, "AXKQ7T"));
  assert.deepEqual(parcours.charger(stockage, "AXKQ7T"), parcours.creerParcours());
  assert.deepEqual(parcours.charger(stockage, "BZ4MHP"), sansPrenom(tom), "effacer une case ne touche pas les autres");
  assert.deepEqual(parcours.charger(stockage), invite);
});

test("l’empreinte : SHA-256 de Node, sel par appareil, dix mille tours, seize hexadécimaux", async () => {
  const {createHash, webcrypto} = await import("node:crypto");
  for (const texte of ["", "abc", "sel:AXKQ7T", "éà🙂", "a".repeat(55), "a".repeat(56), "a".repeat(64), "x".repeat(1000)]) {
    assert.equal(parcours.sha256Hex(texte), createHash("sha256").update(texte, "utf8").digest("hex"), JSON.stringify(texte.slice(0, 12)));
  }
  // crypto.subtle, l'autre référence, sur un code.
  const subtle = Buffer.from(await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode("sel:AXKQ7T"))).toString("hex");
  assert.equal(parcours.sha256Hex("sel:AXKQ7T"), subtle);
  // L'empreinte = SHA-256 répété ITERATIONS_EMPREINTE fois sur « sel:code », tronqué.
  assert.equal(parcours.ITERATIONS_EMPREINTE, 10000);
  let h = createHash("sha256").update("0123456789abcdef0123456789abcdef:AXKQ7T").digest();
  for (let i = 1; i < parcours.ITERATIONS_EMPREINTE; i += 1) h = createHash("sha256").update(h).digest();
  assert.equal(parcours.empreinteCode("AXKQ7T", "0123456789abcdef0123456789abcdef"), h.toString("hex").slice(0, 16));
  assert.equal(parcours.LONGUEUR_EMPREINTE, 16);
  // Le sel : tiré une fois par appareil, relu ensuite ; deux appareils, deux clés.
  const a = stockageMemoire();
  const b = stockageMemoire();
  const selA = parcours.selAppareil(a);
  assert.match(selA, /^[0-9a-f]{32}$/);
  assert.equal(parcours.selAppareil(a), selA, "relu, pas retiré");
  assert.equal(a.donnees[parcours.CLE_SEL], selA);
  assert.notEqual(parcours.selAppareil(b), selA);
  assert.notEqual(parcours.cleStockage("AXKQ7T", a), parcours.cleStockage("AXKQ7T", b), "le même code n’a pas la même clé sur deux appareils");
  assert.equal(parcours.selAppareil(null), "", "sans stockage : sel vide, jamais d’erreur");
  assert.equal(parcours.selAppareil(stockageMemoire({[parcours.CLE_SEL]: "pas un sel"})).length, 32, "un sel abîmé est remplacé");
});

test("un appareil suivi par l’ancienne appli est repris : son parcours va dans la case du code, le code durable est oublié", () => {
  const lea = acquerirTables(parcours.definirPrenom(parcours.creerParcours(), "Léa"), [2, 5]);
  const ancien = stockageMemoire({
    [parcours.CLE_CODE]: "AXKQ7T",
    [parcours.CLE_STOCKAGE]: JSON.stringify(lea)
  });
  assert.equal(parcours.migrerStockage(ancien, 1756800000000), true);
  assert.equal(ancien.getItem(parcours.CLE_CODE), null, "l’identité ne vit plus dans le stockage durable");
  assert.deepEqual(parcours.charger(ancien, "AXKQ7T"), sansPrenom(lea), "le parcours est dans la case du code, sans le prénom");
  assert.equal(parcours.chargerSync(ancien, "AXKQ7T").maj, 1756800000000, "la case est datée de la migration, pour la purge (trouvé au navigateur)");
  assert.deepEqual(parcours.charger(ancien), parcours.creerParcours(), "la case sans code est vide");
  assert.equal(parcours.clesRevelentUnCode(ancien), false);
  assert.equal(parcours.migrerStockage(ancien), false, "une seconde fois, il n’y a plus rien à faire");

  // Sans code rangé, la case unique est déjà la case « sans code » : rien à faire.
  const invite = stockageMemoire({[parcours.CLE_STOCKAGE]: JSON.stringify(lea)});
  assert.equal(parcours.migrerStockage(invite), false);
  assert.deepEqual(parcours.charger(invite), lea);

  // Si la case du code existe déjà, on ne l’écrase pas.
  const tom = acquerirTables(parcours.creerParcours(), [3]);
  const deuxFois = stockageMemoire({
    [parcours.CLE_CODE]: "AXKQ7T",
    [parcours.CLE_STOCKAGE]: JSON.stringify(lea),
    [parcours.CLE_STOCKAGE + ":AXKQ7T"]: JSON.stringify(tom)
  });
  parcours.migrerStockage(deuxFois);
  assert.deepEqual(parcours.charger(deuxFois, "AXKQ7T"), tom);
  assert.deepEqual(parcours.charger(deuxFois), lea, "l’ancienne case reste, en case sans code");
  assert.equal(parcours.migrerStockage(null), false);
});

test("un appareil des lots A1 à 5 (cases au code en clair, prénoms compris) passe sous les empreintes, sans rien perdre", () => {
  const lea = acquerirTables(parcours.definirPrenom(parcours.creerParcours(), "Léa"), [2, 5]);
  const tom = acquerirTables(parcours.definirPrenom(parcours.creerParcours(), "Tom"), [3]);
  const invite = parcours.definirPrenom(parcours.creerParcours(), "Invité");
  const avant = stockageMemoire({
    [parcours.CLE_STOCKAGE]: JSON.stringify(invite),
    [parcours.CLE_STOCKAGE + ":AXKQ7T"]: JSON.stringify(lea),
    [parcours.CLE_SYNC + ":AXKQ7T"]: JSON.stringify({revision: 4, dirty: true, detache: false, maj: 1756500000000}),
    [parcours.CLE_STOCKAGE + ":BZ4MHP"]: JSON.stringify(tom),
    [parcours.CLE_SYNC + ":BZ4MHP"]: JSON.stringify({revision: 2, dirty: false, detache: true, maj: 0}),
    "soley-save-v5": "{\"autre\":\"outil\"}"
  });
  const maintenant = 1756800000000;
  assert.equal(parcours.migrerStockage(avant, maintenant), true);
  assert.equal(parcours.clesRevelentUnCode(avant), false, "plus aucune clé ne porte un code");
  assert.doesNotMatch(JSON.stringify(avant.donnees), /Léa|Tom/, "plus aucun prénom d’élève suivi");
  assert.deepEqual(parcours.charger(avant, "AXKQ7T"), sansPrenom(lea), "la progression de Léa est dans sa case à empreinte");
  assert.deepEqual(parcours.charger(avant, "BZ4MHP"), sansPrenom(tom));
  assert.deepEqual(parcours.charger(avant), invite, "la case sans code n’a pas bougé");
  assert.deepEqual(parcours.chargerSync(avant, "AXKQ7T"), {revision: 4, dirty: true, detache: false, maj: 1756500000000}, "l’état d’envoi suit");
  assert.deepEqual(parcours.chargerSync(avant, "BZ4MHP"), {revision: 2, dirty: false, detache: true, maj: maintenant}, "une case sans date est datée du jour de la migration");
  assert.equal(avant.donnees["soley-save-v5"], "{\"autre\":\"outil\"}", "les clés des autres outils ne sont pas touchées");
  assert.equal(parcours.migrerStockage(avant, maintenant), false, "une seconde fois, rien à faire");

  // La case à empreinte existe déjà (appareil passé par la nouvelle appli, puis
  // par l'ancienne encore en cache) : les deux fusionnent, rien ne se perd.
  const double = stockageMemoire();
  parcours.sauver(double, tom, "AXKQ7T");
  double.setItem(parcours.CLE_STOCKAGE + ":AXKQ7T", JSON.stringify(lea));
  parcours.migrerStockage(double, maintenant);
  const fusion = parcours.charger(double, "AXKQ7T");
  assert.deepEqual(parcours.tablesAcquises(fusion), [2, 3, 5]);
  assert.equal(fusion.prenom, "");
});

test("la purge : une case à code que personne n’a ouverte depuis 90 jours quitte l’appareil, jamais la case active ni la case sans code", () => {
  const jour = 24 * 60 * 60 * 1000;
  const maintenant = 1756800000000;
  const stockage = stockageMemoire({[parcours.CLE_STOCKAGE]: JSON.stringify(parcours.definirPrenom(parcours.creerParcours(), "Invité"))});
  const poser = (code, ilYA, extra = {}) => {
    parcours.sauver(stockage, acquerirTables(parcours.creerParcours(), [3]), code);
    parcours.sauverSync(stockage, code, {revision: 1, dirty: false, detache: false, maj: ilYA === null ? 0 : maintenant - ilYA, ...extra});
  };
  poser("AXKQ7T", 91 * jour);
  poser("BZ4MHP", 89 * jour);
  poser("C4FXRJ", 200 * jour);
  poser("D5GHJK", 400 * jour, {dirty: true, detache: true});
  poser("E6HJKL", null);
  assert.equal(parcours.DUREE_CONSERVATION_MS, 90 * jour);
  assert.equal(parcours.purger(stockage, {maintenant, garder: "C4FXRJ"}), 2, "deux cases retirées : 91 jours et 400 jours");
  assert.deepEqual(parcours.charger(stockage, "AXKQ7T"), parcours.creerParcours(), "la case de 91 jours est partie");
  assert.deepEqual(parcours.chargerSync(stockage, "AXKQ7T"), {revision: 0, dirty: false, detache: false, maj: 0}, "et son état");
  assert.deepEqual(parcours.charger(stockage, "D5GHJK"), parcours.creerParcours(), "détachée et jamais envoyée : partie aussi, le code ne vaut plus rien");
  assert.deepEqual(parcours.tablesAcquises(parcours.charger(stockage, "BZ4MHP")), [3], "89 jours : gardée");
  assert.deepEqual(parcours.tablesAcquises(parcours.charger(stockage, "C4FXRJ")), [3], "200 jours mais c’est le code qui arrive : gardée");
  assert.deepEqual(parcours.tablesAcquises(parcours.charger(stockage, "E6HJKL")), [3], "date inconnue : gardée");
  assert.equal(parcours.charger(stockage).prenom, "Invité", "la case sans code n’est jamais purgée");
  assert.equal(parcours.purger(stockage, {maintenant, garder: "C4FXRJ"}), 0, "une seconde fois, rien");
  assert.equal(parcours.purger(null), 0);
  assert.equal(parcours.purger(stockage, {maintenant: maintenant + 2 * jour}), 2, "deux jours plus tard, sans code actif : la case de 200 jours et celle qui en a maintenant 91 partent à leur tour");
  assert.deepEqual(parcours.tablesAcquises(parcours.charger(stockage, "E6HJKL")), [3], "date inconnue : toujours gardée");
});

test("l’identité donnée par le serveur ne vit que dans l’onglet, avec le code, et pour ce code seulement", () => {
  const onglet = stockageMemoire();
  assert.equal(parcours.CLE_IDENTITE, "mathsgo-suivi-identite");
  assert.equal(parcours.chargerIdentiteOnglet(onglet, "AXKQ7T"), null);
  assert.ok(parcours.sauverIdentiteOnglet(onglet, "axkq7t", {prenom: "  Léa ", classe: "6eB"}));
  assert.deepEqual(parcours.chargerIdentiteOnglet(onglet, "AXKQ7T"), {prenom: "Léa", classe: "6eB"});
  assert.equal(parcours.chargerIdentiteOnglet(onglet, "BZ4MHP"), null, "un autre code ne la lit pas");
  assert.equal(parcours.chargerIdentiteOnglet(onglet, ""), null);
  assert.equal(parcours.sauverIdentiteOnglet(onglet, "BOF", {prenom: "X"}), false, "code invalide : rien d’écrit");
  parcours.effacerCode(onglet);
  assert.equal(onglet.getItem(parcours.CLE_IDENTITE), null, "oublier le code, c’est oublier l’identité");
  assert.equal(parcours.chargerIdentiteOnglet(stockageMemoire({[parcours.CLE_IDENTITE]: "{pas du json"}), "AXKQ7T"), null);
  assert.equal(parcours.chargerIdentiteOnglet(null, "AXKQ7T"), null);
});

// Le serveur ne garde que ce qu'il connaît (_serveur/public/lib/progression.php).
// Pour que l'appli et le serveur ne divergent jamais en silence, un parcours
// COMPLET produit par l'appli est figé dans _serveur/tests/parcours-reference.json
// et doit ressortir identique du filtre PHP. Ce test-ci vérifie l'autre moitié :
// que le fichier figé est bien ce que l'appli produit aujourd'hui.
test("le parcours de référence figé pour le serveur est à jour avec l’appli", async () => {
  const {parcoursComplet, CHEMIN} = await import("../scripts/generer-parcours-reference.mjs");
  const fs = await import("node:fs/promises");
  const fige = JSON.parse(await fs.readFile(CHEMIN, "utf8"));
  assert.deepEqual(fige, JSON.parse(JSON.stringify(parcoursComplet())),
    "l'appli a changé la forme du parcours : relance « node scripts/generer-parcours-reference.mjs », puis complète 'cles'/'mots' dans _serveur/public/lib/applis.php (le test PHP le vérifie)");
  // Et il est bien complet : toutes les tables, tous les calculs, toutes les dates.
  assert.equal(Object.keys(fige.calculs).length, parcours.FAITS.length);
  assert.ok(parcours.TABLES.every(table => fige.tables[table].acquise));
  assert.equal(fige.epoque, 3);
});

test("appliquerSerie ne modifie jamais l’objet reçu", () => {
  const etat = parcours.creerParcours();
  const copie = JSON.stringify(etat);
  jouer(etat, parcours.configValidation(7), 20, 20);
  jouer(etat, parcours.configEtoile(3), 25, 25);
  parcours.appliquerReponse(etat, "7-8", {correcte: true, date: DATE});
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

test("fusion : par calcul, le jour le plus récent gagne en bloc — une erreur d’aujourd’hui n’est pas effacée par l’état d’hier", () => {
  const a = parcours.normaliserParcours({calculs: {
    "3-8": {cases: 3, vu: "2026-09-10", erreur: null, gagne: "2026-09-10"},
    "6-7": {cases: 1, vu: "2026-09-02", erreur: "2026-09-02", gagne: null}
  }});
  const b = parcours.normaliserParcours({calculs: {
    "3-8": {cases: 1, vu: "2026-09-12", erreur: "2026-09-12", gagne: null},
    "9-9": {cases: 0, vu: "2026-09-11", erreur: "2026-09-11", gagne: null}
  }});
  const fusion = parcours.fusionner(a, b);
  assert.equal(fusion.calculs["3-8"].boite, 2, "l'erreur du 12 (boîte 2, l’ancienne « 1 case ») l'emporte sur la boîte 4 du 10 : le jour le plus récent gagne");
  assert.equal(fusion.calculs["3-8"].vu, "2026-09-12");
  assert.equal(fusion.calculs["3-8"].erreur, "2026-09-12");
  assert.equal(fusion.calculs["3-8"].gagne, null, "et rien du 10 ne revient");
  assert.deepEqual(parcours.fusionner(b, a).calculs["3-8"], fusion.calculs["3-8"], "dans les deux sens");
  assert.equal(fusion.calculs["6-7"].boite, 2, "un calcul connu d'un seul côté est repris tel quel");
  assert.equal(fusion.calculs["9-9"].boite, 1);
  assert.equal(Object.keys(fusion.calculs).length, 3);

  // Même jour des deux côtés (lot « fusion du même jour », 22/10/2026) : le
  // jour d'une erreur, aucun gain n'est possible, donc le côté qui porte
  // l'erreur du jour est le plus récent — il gagne en bloc (avant ce lot, le
  // plus avancé gagnait, et la case de l'appareil effaçait l'erreur).
  const matin = parcours.normaliserParcours({calculs: {"3-8": {boite: 4, vu: "2026-09-12", erreur: null, gagne: "2026-09-12", echeance: "2026-09-19"}}});
  const apresMidi = parcours.normaliserParcours({calculs: {"3-8": {boite: 3, vu: "2026-09-12", erreur: "2026-09-12", gagne: null, echeance: "2026-09-12"}}});
  const memeJour = parcours.fusionner(matin, apresMidi).calculs["3-8"];
  assert.deepEqual(memeJour, {boite: 3, cases: 2, vu: "2026-09-12", erreur: "2026-09-12", gagne: null, echeance: "2026-09-12"});
  assert.deepEqual(parcours.fusionner(apresMidi, matin).calculs["3-8"], memeJour, "dans les deux sens");
  // À boîte égale, l'échéance la plus proche : plutôt trop tôt que trop tard.
  const egal = parcours.fusionner(
    parcours.normaliserParcours({calculs: {"3-8": {boite: 3, vu: "2026-09-12", erreur: null, gagne: "2026-09-12", echeance: "2026-09-15"}}}),
    parcours.normaliserParcours({calculs: {"3-8": {boite: 3, vu: "2026-09-12", erreur: null, gagne: "2026-09-10", echeance: "2026-09-13"}}}));
  assert.equal(egal.calculs["3-8"].echeance, "2026-09-13");
});

test("fusion : une remise à zéro (époque plus haute) gagne entièrement, elle ne ressuscite pas", () => {
  const avance = acquerirTables(parcours.definirPrenom(parcours.creerParcours(), "Léa"), [2, 5, 7]);
  assert.equal(avance.epoque, 0);
  const remis = parcours.remettreAZero(avance);
  assert.equal(remis.epoque, 1, "la remise à zéro monte l'époque");
  assert.equal(remis.prenom, "Léa", "et garde le prénom");
  // L'autre appareil renvoie l'ancien état (époque 0) : il ne doit rien faire revenir.
  const fusion = parcours.fusionner(remis, avance);
  assert.deepEqual(parcours.tablesAcquises(fusion), [], "rien ne revient");
  assert.equal(fusion.epoque, 1);
  assert.equal(fusion.prenom, "Léa");
  const inverse = parcours.fusionner(avance, remis);
  assert.deepEqual(parcours.tablesAcquises(inverse), [], "dans l'autre sens aussi");
  assert.equal(inverse.epoque, 1);
  // Même époque : fusion ordinaire.
  const autre = acquerirTables(parcours.creerParcours(), [3]);
  assert.deepEqual(parcours.tablesAcquises(parcours.fusionner(avance, autre)), [2, 3, 5, 7]);
  // L'époque survit à la sauvegarde et à la normalisation, et reste bornée.
  assert.equal(parcours.normaliserParcours(JSON.parse(JSON.stringify(remis))).epoque, 1);
  assert.equal(parcours.normaliserParcours({epoque: -4}).epoque, 0);
  assert.equal(parcours.normaliserParcours({epoque: "12"}).epoque, 12);
});

test("les dates ne sont gardées que sous la forme AAAA-MM-JJ", () => {
  const abime = parcours.normaliserParcours({
    tables: {7: {acquise: "hier"}},
    melange: {dernier: "2026-09-01T10:00:00Z"},
    expert: {etoiles: 1, dernier: "2026-09-02", couronne: "x".repeat(300)},
    jours: ["2026-09-03", "hier", 12, "2026-09-03"],
    calculs: {"3-8": {cases: 1, vu: "pas une date"}, "6-7": {cases: 1, vu: "2026-09-03", erreur: "<script>", gagne: "2026-09-03"}},
    version: 2
  });
  assert.equal(abime.tables[7].acquise, null);
  assert.equal(abime.melange.dernier, null);
  assert.equal(abime.expert.dernier, "2026-09-02");
  assert.equal(abime.expert.couronne, null);
  assert.deepEqual(abime.jours, ["2026-09-03"], "les jours : des dates, sans doublon");
  assert.equal(abime.calculs["3-8"], undefined, "un calcul sans jour valide n'existe pas");
  assert.deepEqual(abime.calculs["6-7"], {boite: 2, cases: 1, vu: "2026-09-03", erreur: null, gagne: "2026-09-03", echeance: "2026-09-04"}, "version 2 : cases 1 → boîte 2, échéance recalculée depuis le dernier gain (+1 jour)");
});

// Lot « un seul système » (05/10/2026) : le mélange n'est plus jamais « à
// refaire ». La fusion garde le dernier joué et son score, le plus grand
// « réussi », et la date la plus récente de Mes calculs du jour.
test("fusion : Mon mélange garde le dernier joué et le plus grand « réussi », rien ne redevient à refaire ; Mes calculs du jour, la date la plus récente", () => {
  const cinq = acquerirTables(parcours.creerParcours(), [2, 3, 4, 5, 6]);
  const cinqAJour = jouer(cinq, parcours.configMelange(cinq), 20, 20).parcours;
  assert.equal(cinqAJour.melange.aJour, true);
  assert.equal(cinqAJour.melange.reussi, 5);

  // L'autre appareil a plus de tables : le mélange réussi avec 5 reste réussi.
  const sept = acquerirTables(parcours.creerParcours(), [2, 3, 4, 5, 6, 7, 8]);
  for (const fusion of [parcours.fusionner(cinqAJour, sept), parcours.fusionner(sept, cinqAJour)]) {
    assert.equal(parcours.tablesAcquises(fusion).length, 7);
    assert.deepEqual(fusion.melange, {tables: [2, 3, 4, 5, 6, 7, 8], aJour: true, aRefaireAvec: null, dernier: DATE, score: 20, reussi: 5},
      "gagné d’un côté, il le reste : rien à refaire avec les 7 tables");
  }

  // Deux jours différents : le plus récent, avec SON score (même moins bon).
  const plusTard = parcours.appliquerSerie(cinq, normaliser(parcours.configMelange(cinq)), {correct: 15, total: 20, date: "2026-09-03"}).parcours;
  for (const fusion of [parcours.fusionner(cinqAJour, plusTard), parcours.fusionner(plusTard, cinqAJour)]) {
    assert.equal(fusion.melange.dernier, "2026-09-03");
    assert.equal(fusion.melange.score, 15);
    assert.equal(fusion.melange.reussi, 5, "le trophée, lui, ne se perd pas");
    assert.equal(fusion.melange.aJour, true);
  }
  // Le même jour des deux côtés : le meilleur des deux scores.
  const memeJour = jouer(cinq, parcours.configMelange(cinq), 17, 20).parcours;
  assert.equal(parcours.fusionner(memeJour, cinqAJour).melange.score, 20);
  assert.equal(parcours.fusionner(cinqAJour, memeJour).melange.score, 20);
  // Jamais joué nulle part : rien.
  const jamais = parcours.fusionner(cinq, sept).melange;
  assert.deepEqual([jamais.aJour, jamais.dernier, jamais.score, jamais.reussi], [false, null, null, null]);

  // Mes calculs du jour : joué d'un côté, il l'est.
  const mardi = parcours.normaliserParcours({calculsDuJour: "2026-09-02"});
  const jeudi = parcours.normaliserParcours({calculsDuJour: "2026-09-04"});
  assert.equal(parcours.fusionner(mardi, jeudi).calculsDuJour, "2026-09-04");
  assert.equal(parcours.fusionner(jeudi, mardi).calculsDuJour, "2026-09-04");
  assert.equal(parcours.fusionner(parcours.creerParcours(), mardi).calculsDuJour, "2026-09-02");
  assert.equal(parcours.fusionner(parcours.creerParcours(), parcours.creerParcours()).calculsDuJour, null);
});

test("fusion : les étoiles prennent le meilleur des deux, la couronne sa première date, le rang ne redescend pas, les jours se réunissent", () => {
  const a = parcours.normaliserParcours({version: 2, expert: {etoiles: 1, dernier: "2026-09-01", couronne: null}, rang: 5, jours: ["2026-09-01", "2026-09-02"]});
  const b = parcours.normaliserParcours({version: 2, expert: {etoiles: 5, dernier: "2026-10-01", couronne: "2026-10-01"}, rang: 6, jours: ["2026-09-02", "2026-09-03"]});
  const fusion = parcours.fusionner(a, b);
  assert.equal(fusion.expert.etoiles, 5);
  assert.equal(fusion.expert.dernier, "2026-10-01");
  assert.equal(fusion.expert.couronne, "2026-10-01");
  assert.equal(fusion.rang, 6);
  assert.deepEqual(fusion.jours, ["2026-09-01", "2026-09-02", "2026-09-03"]);
  assert.ok(!("avis" in fusion) && !("avisVu" in fusion), "l’avis de migration n’existe plus (lot 4b)");
  assert.deepEqual(parcours.fusionner(b, a), fusion);
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
  assert.match(html, /id="open-parcours" class="acc-lien"[\s\S]*Mon parcours/);
  assert.match(html, /id="parcours"[^>]*class="parcours-screen"/);
  // Lot « un seul tableau » : la carte de ma table et Mes calculs à la place des dix rangées.
  assert.doesNotMatch(html, /id="parcours-list"/);
  assert.match(html, /id="parcours-matable"/);
  assert.match(html, /id="parcours-calculs"/);
  assert.match(html, /id="parcours-melange"/);
  assert.match(html, /id="parcours-expert"/);
  assert.doesNotMatch(html, /id="parcours-next"/, "« Prochaine étape » a quitté le parcours (lot 2) : l’accueil dit quoi faire");
  assert.doesNotMatch(html, /C’est parti<\/button>|"C’est parti"/, "et son bouton avec");
  assert.match(html, /\["intro", "launch", "play", "result", "parcours", "lire", "fiche"\]/);
});

test("prénom à l'impression seulement, effacement confirmé dans la page, résultat relié au parcours", () => {
  assert.match(html, /id="fiche-prenom-input"[^>]*maxlength="20"/);
  assert.doesNotMatch(html, /id="parcours-name-input"/, "plus de prénom demandé dans Mon parcours (06/11/2026)");
  assert.match(html, /id="parcours-reset"[^>]*>Effacer mon historique</);
  assert.match(html, /id="parcours-confirm-yes"[\s\S]*Effacer/);
  assert.doesNotMatch(html, /window\.confirm\(/);
  assert.match(html, /const resultatSerie = \{correct: state\.correct, total: TOTAL, decouverte: state\.origin === "decouverte"\};[\s\S]{0,500}?PARCOURS\.appliquerSerie\(parcours, state\.configuration, resultatSerie\)/);
  assert.match(html, /PARCOURS\.demarrerSerie\(parcours, config\)/);
  assert.match(html, /id="result-parcours"/);
  assert.match(html, /id="result-accueil" class="primary"[^>]*>Ma table<\/button>/, "le bouton principal du résultat ramène à l’accueil");
  assert.match(html, /id="result-open-parcours"[\s\S]*Voir mon parcours/);
  assert.match(html, /\$\("result-accueil"\)\.addEventListener\("click", backToModes\)/);
  // « ouvrir=parcours » (l’espace élève) mène à l’accueil « Ma table », qui est
  // l’entrée de l’élève ; seul « calculs » ouvre un autre écran directement.
  assert.match(html, /if \(ENTREE\.ouvrir === "calculs"\) openCalculs\(\); else backToModes\(\);/);
  assert.doesNotMatch(html, /ENTREE\.ouvrir === "parcours"\) openParcours\(\);/);
});

test("Je m’entraîne propose produits, trous ou les deux ; la validation se joue en 1 min 30", () => {
  assert.match(html, /id="train-type-settings"[\s\S]*data-train-type="desordre"[\s\S]*data-train-type="trous"[\s\S]*data-train-type="mixte"/);
  assert.match(html, /const TRAIN_TYPES = \{desordre: \["direct"\], trous: \["missing", "division"\], mixte: \["direct", "missing", "division"\]\}/);
  // Lot « divisions » : les types de la page = ceux du moteur, dans le même ordre.
  for (const [cle, types] of Object.entries({desordre: ["direct"], trous: ["missing", "division"], mixte: ["direct", "missing", "division"]})) assert.deepEqual(parcours.configEntraine(7, cle).questionTypes, types);
  // 09/09 : plus de choix 1 min 30 / 2 min / 3 min avant l'épreuve. La durée
  // de validation est celle du moteur, et « la même épreuve avec plus de
  // temps » est devenue un entraînement de l'étape 2 (voir
  // tests/defi-tables-navigation.test.mjs).
  assert.doesNotMatch(html, /data-launch-duration/);
  assert.equal(parcours.configValidation(7).duration, 90);
  assert.equal(parcours.configValidation(7, 120).duration, 120, "la préparation reste possible, à la demande");
  assert.match(html, /const completeReview = state\.configuration\.mode === "test" \|\| state\.configuration\.mode === "validation";/);
});

test("dans Je deviens expert, « Toutes les tables » coche 2 à 10", () => {
  assert.match(html, /return mode === "test" \? PARCOURS_TABLES : ALL_TABLES;/);
  assert.match(html, /"Toutes les tables \(2 à 10\)"/);
  assert.equal(core.configurationLabel(normaliser({mode: "test", tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], testLevel: 3})), "Je deviens expert · Tables de 2 à 10 · produits, trous, divisions · 25 questions · 2 minutes");
  assert.equal(core.configurationLabel(normaliser(parcours.configEntraine(7, "trous"))), "Je m’entraîne · Table de 7 · nombres manquants et divisions · 10 questions · sans chrono");
  assert.equal(core.configurationLabel(normaliser({mode: "train", tables: [6, 7]})), "Je m’entraîne · Tables de 6 et 7 · dans le désordre · 10 questions · sans chrono");
  // Audit 1 (30/09/2026) : les trois entraînements, le même nom partout.
  assert.equal(core.configurationLabel(normaliser(parcours.configEntraine(7, "desordre"))), "Je m’entraîne · Table de 7 · dans le désordre · 10 questions · sans chrono");
  assert.equal(core.configurationLabel(normaliser(parcours.configEntraine(7, "mixte"))), "Je m’entraîne · Table de 7 · résultats, nombres manquants et divisions · 10 questions · sans chrono");
});

test("la page Confidentialité décrit la sauvegarde locale de Mon parcours", () => {
  assert.match(confidentialite, /<code>mathsgo-defi-tables-parcours<\/code>/);
  assert.match(confidentialite, /la progression par table/);
  assert.match(confidentialite, /« Effacer mon historique »/);
  assert.doesNotMatch(confidentialite, /Recommencer à zéro/);
});

// Lot « un seul tableau » : plus de rangées en deux colonnes ; la page garde
// sa largeur, le tableau s'arrête à 560 px (la largeur de l'ancien écran).
test("sur écran large, Mon parcours garde ses blocs compacts et le tableau ne dépasse pas 560 px", () => {
  assert.match(html, /@media \(min-width: 1040px\) \{[\s\S]*?\.parcours-screen \{ max-width: 1120px; \}/);
  assert.doesNotMatch(html, /\.parcours-list \{/);
  assert.match(html, /\.parcours-screen \{ max-width: 720px/, "en dessous de 1040 px, rien ne change");
  assert.match(html, /\.calculs-grille \{\s*display: grid;\s*grid-template-columns: auto repeat\(8, minmax\(0, 1fr\)\);\s*gap: 3px;\s*max-width: 560px;\s*margin: 12px auto 0;\s*\}/, "le tableau garde la largeur de l’ancien écran Mes calculs");
});

test("la fiche « Mon parcours des tables » s’imprime depuis l’appli et existe en PDF vide avec sa source", async () => {
  const fs = await import("node:fs/promises");
  assert.match(html, /id="fiche-print" class="fiche-print" aria-hidden="true"/);
  assert.match(html, /body > \*:not\(#fiche-print\) \{ display: none !important; \}/);
  assert.match(html, /@page \{ size: A4 portrait; margin: 12mm; \}/);
  // R5 (Q7) : l'impression ne part plus du bas de Mon parcours mais de
  // l'écran « Voir ma fiche » (tests/defi-tables-fiche.test.mjs).
  assert.doesNotMatch(html, /id="parcours-print"/);
  assert.match(html, /id="fiche-imprimer" class="primary" type="button">Imprimer ma fiche</);
  // La fonction est appelée, pas passée en écouteur : elle recevrait l'objet
  // Event pour parcours (tests/defi-tables-accueil.test.mjs le détaille).
  assert.match(html, /window\.addEventListener\("beforeprint", \(\) => renderFiche\(ficheAffichee\)\)/);
  // R5 (Q6) : la fiche vierge n'est plus proposée à l'élève (catalogue et page prof).
  assert.doesNotMatch(html, /fiche_parcours_tables\.pdf/);
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
  // Le code arrive par le lien de l'espace élève. L'adresse est lue par le
  // script du <head> (tests/defi-tables-suivi-appareil.test.mjs l'exécute) ;
  // l'appli a un repli qui la lit de la même façon si ce script n'a pas tourné.
  assert.match(html, /window\.MATHSGO_ENTREE = entree;/);
  assert.match(html, /parametres\.get\("b"\)/, "le billet, seul chemin d’entrée depuis le lot « appareil partagé »");
  assert.doesNotMatch(html, /parametres\.get\("code"\)|parametres\.get\("fiche"\)/, "ni code ni fiche dans l’adresse");
  assert.match(html, /parametres\.get\("ouvrir"\)/);
  // Le site public ne parle plus du tout du suivi : on n'y tape pas de code, et
  // on n'y renvoie même pas vers l'espace élève. Un élève entre par
  // suivi.mathsgo.re, un point c'est tout — un visiteur ordinaire du site n'a
  // aucune raison de voir passer cette histoire de codes.
  assert.doesNotMatch(html, /id="parcours-code-open"/);
  assert.doesNotMatch(html, /id="parcours-code-input"/);
  assert.doesNotMatch(html, /id="parcours-code-remove"/);
  assert.doesNotMatch(html, /id="parcours-code-aide"/);
  assert.doesNotMatch(html, /Utiliser mon code de classe/);
  assert.doesNotMatch(html, /Changer mon code de classe/);
  // Même en creux : sans code, l'appli n'annonce pas un suivi qui n'existe pas
  // pour ce visiteur. La phrase complète revient dès qu'un code est actif.
  assert.doesNotMatch(html, /Si ton professeur te donne un code/);
  assert.match(html, /id="suivi-repere"/, "le repère de suivi est permanent, dans la barre du haut");
  assert.doesNotMatch(html, /id="parcours-fusion"/, "plus de question « c'est le tien ? » : ce qui est fait sans code reste sans code (lot 2b)");

  // Chaque enregistrement local part aussi au serveur, sans être attendu — et
  // dans la case du code actif.
  assert.match(html, /function sauverParcours\(\) \{\s*sauverCase\(\);/);
  assert.match(html, /function sauverCase\(\) \{\s*if \(suiviActif\(\)\) \{\s*const local = PARCOURS\.charger\(storage\(\), codeSuivi\);\s*if \(local\) parcours = PARCOURS\.fusionner\(local, parcours\);\s*PARCOURS\.sauver\(storage\(\), parcours, codeSuivi\);/,
    "sous un code, la case du code ; sans code, la case sans code et sans prénom");
  assert.match(html, /sync\.dirty = true;[\s\S]{0,120}sauverSync\(\);\s*\}\s*envoyerParcours\(\);/, "chaque sauvegarde marque du travail à envoyer, puis envoie");
  assert.doesNotMatch(html, /await envoyerParcours\(\)/, "l'envoi ne doit jamais être attendu");
  assert.match(html, /navigator\.sendBeacon/, "le dernier envoi part même si la page se ferme");
  assert.match(html, /https:\/\/suivi\.mathsgo\.re/);
});

test("plus aucune question ni confirmation autour du travail d’un autre : chaque code a sa case", () => {
  // Depuis le lot A1, un code différent bascule sur SA case ; depuis le lot
  // 2b, le travail fait sans code (ou sous un ancien code) n'est plus proposé
  // du tout. Plus rien à confirmer, plus rien à perdre.
  // (Comportement exécuté dans tests/defi-tables-suivi-appareil.test.mjs.)
  assert.doesNotMatch(html, /Non, ce n’est pas le mien|Oui, c’est le mien|Est-ce que c’est le tien/);
  assert.doesNotMatch(html, /questionFusion/);
  assert.doesNotMatch(html, /son travail sera perdu/);
  assert.doesNotMatch(html, /Oui, efface-le/);
});

test("sans connexion, l’élève n’est pas laissé à croire qu’il est suivi", () => {
  assert.match(html, /let suiviHorsLigne = false;/);
  assert.match(html, /travail gardé ici, pas encore envoyé/);
  // On ne promet plus un envoi qu'on ne maîtrise pas (un code régénéré ne
  // partira jamais) : le comportement exact est exécuté dans
  // tests/defi-tables-suivi-appareil.test.mjs.
  assert.doesNotMatch(html, /partira plus tard/);
  assert.match(html, /\.suivi-repere\.hors-ligne/);
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
  // Lot « Mon parcours » : ou vierge (le PDF de la page du professeur).
  assert.match(html, /const fiche = vierge \? PARCOURS\.creerParcours\(\) : source \|\| parcours;/);
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

// L'aiguillage de l'adresse et le nettoyage de la barre d'adresse sont
// désormais exécutés dans tests/defi-tables-suivi-appareil.test.mjs (script du
// <head> + bloc d'aiguillage), sur le lien que le serveur fabrique vraiment.

// Le lien est fabriqué d'un côté et lu de l'autre : c'est l'écart entre les deux
// qui a coûté le lot 8. On vérifie que le serveur ne met dans l'adresse que des
// paramètres que la page sait lire.
test("le lien fabriqué par l’espace élève ne porte que des paramètres que l’appli lit", async () => {
  const fs = await import("node:fs/promises");
  const espaceEleve = await fs.readFile(new URL("../_serveur/public/index.php", import.meta.url), "utf8");
  // Lot 3 : l'adresse porte un billet (#b=), plus jamais le code.
  const gabarit = /return `\$\{appli\.url\}([^`]*)`\s*\+\s*\(appli\.ancre \? `([^`]*)`/.exec(espaceEleve);
  assert.ok(gabarit, "le gabarit du lien (adresseAppli) doit rester trouvable dans l’espace élève");
  const parametres = [...`${gabarit[1]}${gabarit[2]}`.matchAll(/[#&]([a-z]+)=/g)].map(trouve => trouve[1]);
  assert.deepEqual(parametres, ["b", "ouvrir"]);
  // Et « Ma classe » ouvre la fiche par « #b=…&vue=fiche ».
  const maClasse = await fs.readFile(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
  const gabaritFiche = /defi_tables\.html(#b=\$\{encodeURIComponent\(r\.billet\)\}&vue=fiche)`/.exec(maClasse);
  assert.ok(gabaritFiche, "le gabarit de « Voir sa fiche » doit rester trouvable dans Ma classe");
  const parametresFiche = [...gabaritFiche[1].matchAll(/[#&]([a-z]+)=/g)].map(trouve => trouve[1]);
  assert.deepEqual(parametresFiche, ["b", "vue"]);
  [...new Set([...parametres, ...parametresFiche])].forEach(nom => {
    assert.ok(html.includes(`cle === "${nom}"`),
      `le script du <head> doit lire le paramètre « ${nom} » que le serveur met dans l’adresse`);
    assert.ok(html.includes(`parametres.get("${nom}")`),
      `et le repli de l’appli aussi`);
  });
});

// Le lien du haut de page ramenait toujours au catalogue de mathsgo.re, y compris
// pour un élève arrivé de son espace : il en sortait sans aucun chemin de retour.
// Ce test EXÉCUTE « majLienRetour » telle qu'elle est écrite dans la page, sur un
// faux lien — une assertion sur le texte du fichier décrirait l'adresse au lieu de
// la vérifier.
test("le lien du haut ramène l’élève suivi à son espace, les autres au catalogue", () => {
  assert.match(html, /<a id="lien-retour" class="catalogue-link"/);
  assert.match(html, /function renderParcours\(\) \{\s*\n\s*majLienRetour\(\);/);
  assert.match(html, /syncControls\(\);\s*\n\s*majLienRetour\(\);/, "appelé aussi au démarrage");

  const debut = html.indexOf("const RETOUR_CATALOGUE");
  const fin = "if (etiquette) etiquette.textContent = vers.texte;\n      }";
  assert.ok(debut > 0, "le bloc du lien de retour doit exister");
  const source = html.slice(debut, html.indexOf(fin) + fin.length);

  function executer(suivi, entreeRefusee = null) {
    const lien = {
      href: "",
      attributs: {},
      etiquette: {textContent: ""},
      setAttribute(nom, valeur) { this.attributs[nom] = valeur; },
      querySelector(selecteur) {
        return selecteur === ".catalogue-link-label" ? this.etiquette : null;
      }
    };
    const logo = {
      href: "",
      attributs: {},
      setAttribute(nom, valeur) { this.attributs[nom] = valeur; }
    };
    // Le pied de page du site, tel qu'il est dans la page : on ne regarde pas
    // ce qu'il contient au départ, seulement ce que la fonction en fait.
    const pied = {
      enfants: null,
      classes: new Set(),
      classList: {add: c => pied.classes.add(c)},
      replaceChildren(...noeuds) { pied.enfants = noeuds; }
    };
    const faux = {
      getElementById: id => (id === "lien-retour" ? lien : null),
      querySelector: selecteur => (selecteur === "a.brand" ? logo
        : selecteur === "footer.site-footer" ? pied : null),
      createElement: tag => ({
        tag, href: "", textContent: "", attributs: {}, enfants: [],
        setAttribute(nom, valeur) { this.attributs[nom] = valeur; },
        append(...noeuds) { this.enfants.push(...noeuds); }
      })
    };
    new Function("SUIVI_URL", "document", "suiviActif", "entreeRefusee", `${source}\nreturn majLienRetour;`)(
      "https://suivi.mathsgo.re", faux, () => suivi, entreeRefusee
    )();
    return {lien, logo, pied};
  }

  const sansCode = executer(false).lien;
  assert.equal(sansCode.href, "../index.html?domain=nombres-calculs&notion=calcul-mental");
  assert.equal(sansCode.etiquette.textContent, "Calcul mental");
  assert.equal(sansCode.attributs["aria-label"], "Retour au calcul mental");

  // Lot « code en cases » : sous un code actif, ?retour=1 — Mon espace reprend
  // l'activité vue dans l'appli au lieu de reposer « C'est toujours toi ? ».
  const avecCode = executer(true).lien;
  assert.equal(avecCode.href, "https://suivi.mathsgo.re/?retour=1");
  assert.equal(avecCode.etiquette.textContent, "Mon espace");
  assert.equal(avecCode.attributs["aria-label"], "Retour à mon espace");

  // Lot 3 : un billet refusé laisse l'élève sans code, mais il vient de son
  // espace — c'est là qu'il doit pouvoir repartir.
  const billetRefuse = executer(false, "expire").lien;
  assert.equal(billetRefuse.href, "https://suivi.mathsgo.re/", "un billet refusé n'a vu aucune activité : pas de ?retour=1");
  assert.equal(billetRefuse.etiquette.textContent, "Mon espace");

  // Le logo était la dernière porte de sortie : il ramenait toujours à
  // l'accueil du site, y compris pour un élève arrivé de son espace.
  assert.equal(executer(false).logo.href, "/",
    "pour un visiteur ordinaire, le logo ramène à l'accueil du site");
  assert.equal(executer(false).logo.attributs["aria-label"], "Accueil maths&go");
  assert.equal(executer(true).logo.href, "https://suivi.mathsgo.re/?retour=1",
    "pour un élève suivi, le logo ramène à son espace");
  assert.equal(executer(true).logo.attributs["aria-label"], "Retour à mon espace");

  // 24/10/2026 — plus de pied de page dans les applis (choix de Gwenaël) : ni
  // celui du site pour le visiteur, ni « logo + Mon espace » pour l'élève suivi,
  // dont le chemin de retour est en haut. Le lien de retour ne touche plus à rien
  // en bas de page.
  assert.equal(executer(false).pied.enfants, null);
  assert.equal(executer(true).pied.enfants, null, "plus de pied « Mon espace » pour l'élève suivi");
  assert.equal(executer(false, "expire").pied.enfants, null);
  assert.doesNotMatch(html, /majPiedDePage|pied-espace|pied-logo/);
});

// Plus de pied de page dans l'appli (24/10/2026) : les liens « Me contacter »,
// « Mentions légales », « Confidentialité » et « Licence » restent sur l'accueil
// et les pages de navigation du site ; l'élève trouve l'information sur Mon espace.
test("plus de pied de page dans l'appli, ni pour le visiteur ni pour l'élève suivi", () => {
  assert.doesNotMatch(html, /<footer class="site-footer"|\.site-footer\b/);
  assert.doesNotMatch(html, /href="mailto:gwenael@mathsgo\.re|mentions-legales\.html|licence\.html/);
  assert.equal((html.match(/<footer\b/g) || []).length, 2, "seules restent les deux signatures imprimées des fiches");
  assert.equal((html.match(/<footer class="fiche-foot">mathsgo\.re · CC BY-NC-SA 4\.0<\/footer>/g) || []).length, 2);
});


// La fiche est dessinée en millimètres pour du A4 : à 390 px elle demandait
// 518 px et débordait par la droite — sur l'écran même où le professeur consulte
// un élève depuis son téléphone. Ce test EXÉCUTE la fonction d'ajustement sur une
// fausse page, et vérifie que la réduction reste enfermée dans @media screen :
// le papier ne doit jamais être réduit.
test("la fiche d’un élève se met à l’échelle de l’écran, jamais du papier", () => {
  // R5 : la même règle vaut pour l'écran « Voir ma fiche » de l'élève (body.voir-fiche).
  const ecran = /@media screen \{\s*\n\s*body\.mode-fiche #fiche-print, body\.voir-fiche #fiche-print \{ zoom: var\(--fiche-zoom, 1\); \}/;
  assert.match(html, ecran, "la réduction doit être enfermée dans @media screen");
  assert.match(html, /renderFiche\(distant\);\s*\n\s*ajusterFiche\(\);/);
  assert.match(html, /window\.addEventListener\("resize", ajusterFiche\);/, "recalculée si l’écran tourne");

  const debut = html.indexOf("      function ajusterFiche() {");
  const fin = "bloc.style.setProperty(\"--fiche-zoom\", String(Math.round(facteur * 1000) / 1000));\n      }";
  assert.ok(debut > 0, "la fonction d’ajustement doit exister");
  const source = html.slice(debut, html.indexOf(fin) + fin.length);

  function executer({page, besoin, modeFiche = true}) {
    const bloc = {
      style: {
        valeurs: {}, width: "",
        setProperty(nom, valeur) { this.valeurs[nom] = valeur; },
        removeProperty(nom) { delete this.valeurs[nom]; }
      },
      getBoundingClientRect() {
        // « min-content » révèle la largeur dont la fiche a besoin ; sinon elle
        // s'étire jusqu'aux bords, ce qui ne dit rien.
        return {width: this.style.width === "min-content" ? besoin : page};
      }
    };
    const faux = {
      body: {classList: {contains: nom => nom === "mode-fiche" && modeFiche}},
      documentElement: {clientWidth: page},
      getElementById: id => (id === "fiche-print" ? bloc : null)
    };
    new Function("document", `${source}\nreturn ajusterFiche;`)(faux)();
    return bloc.style.valeurs["--fiche-zoom"];
  }

  // 390 px de page pour 518 px de fiche : 382 / 518 = 0,737.
  assert.equal(executer({page: 390, besoin: 518}), "0.737");
  // Écran large : la fiche tient, on n’y touche pas du tout.
  assert.equal(executer({page: 1366, besoin: 518}), undefined);
  // Écran minuscule : on ne descend jamais sous 0,45, illisible en dessous.
  assert.equal(executer({page: 200, besoin: 518}), "0.45");
  // Hors de la vue « fiche d’un élève », la fonction ne fait rien.
  assert.equal(executer({page: 390, besoin: 518, modeFiche: false}), undefined);
});

// La phrase sous le champ prénom dit « Ton prénom n’est pas envoyé ». Elle doit
// être VRAIE, y compris pour un élève suivi : c'est exactement le genre de
// phrase qu'une famille cite de travers si elle ne l'est pas. Or le prénom est
// une clé du parcours, et le parcours entier partait au serveur. Ce test EXÉCUTE
// la fabrication du paquet telle qu'elle est écrite dans la page.
test("le prénom tapé par l’élève ne part pas au serveur", () => {
  const debut = html.indexOf("function paquetParcours(");
  assert.ok(debut > 0, "la fabrication du paquet doit être trouvable dans la page");
  const fin = html.indexOf("\n      }", debut) + "\n      }".length;
  const source = html.slice(debut, fin);

  const paquetParcours = new Function(`${source}\nreturn paquetParcours;`)();

  const parcours = {
    version: 2,
    prenom: "Léa Dupont",
    tables: {5: {acquise: "2026-08-30"}},
    melange: {tables: [5, 7], aJour: false},
    expert: {etoiles: 0},
    calculs: {"5-7": {cases: 1, gagne: "2026-08-30"}}
  };
  const envoye = JSON.parse(paquetParcours("2F4FUL", parcours));

  assert.equal(envoye.parcours.prenom, "",
    "le prénom tapé sur l’appareil ne doit jamais monter au serveur");
  assert.equal(envoye.code, "2F4FUL");
  assert.equal(envoye.appli, "defi-tables");
  assert.deepEqual(envoye.parcours.tables, parcours.tables, "la progression, elle, doit partir entière");
  assert.deepEqual(envoye.parcours.calculs, parcours.calculs);
  assert.deepEqual(envoye.parcours.melange, parcours.melange);
  assert.equal(envoye.parcours.expert.etoiles, 0);

  // Et l’appareil de l’élève, lui, garde son prénom : on n’a pas le droit de le
  // lui effacer en passant.
  assert.equal(parcours.prenom, "Léa Dupont",
    "l’objet local ne doit pas être modifié par l’envoi");
});

// « Ce n'est pas moi » et le repère de suivi sont exécutés dans
// tests/defi-tables-suivi-appareil.test.mjs (faux stockage, faux réseau, faux
// document) : ce qui est chargé, ce qui est envoyé, et sous quel code.
test("la sortie est posée sur le repère de suivi, dans la barre du haut (dans le cadre pour l’élève, 31/10/2026)", () => {
  assert.match(html, /sortie\.textContent = "Se déconnecter";/);
  assert.match(html, /sortie\.addEventListener\("click", quitterSuivi\);/);
  assert.doesNotMatch(html, /quitterEtEffacer|et effacer mon travail/, "un seul clic pour se déconnecter, pas de sous-menu (décision du 03/09/2026)");
  assert.match(html, /bloc\.append\(document\.createTextNode\(" · "\), sortie\);/,
    "le séparateur doit revenir à la ligne avec le bouton, pas rester seul en fin de ligne");
  assert.match(html, /repere\.append\(bloc\);/, "la sortie doit être ajoutée au repère lui-même");
  assert.doesNotMatch(html, /id="parcours-code-remove"/, "et pas dans un menu");
});

// Le dépôt a déjà payé une accolade orpheline dans un <style> : le texte était
// bien dans le fichier, et le navigateur ignorait tout le bloc. Un test compte
// désormais les accolades du CSS. Voici l'équivalent pour le JavaScript, qui
// pèse 100 000 caractères dans un seul bloc en ligne : une erreur de syntaxe y
// casserait TOUTE l'appli, et aucun assert.match ne la verrait — le texte
// fautif serait bien présent dans le fichier. On demande donc au moteur
// JavaScript de l'analyser pour de bon.
test("le script en ligne de la page s’analyse sans erreur de syntaxe", () => {
  const blocs = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(blocs.length >= 1, "la page doit contenir au moins un script en ligne");
  blocs.forEach((bloc, index) => {
    assert.doesNotThrow(() => new Function(bloc[1]),
      `le bloc <script> n°${index + 1} de la page ne s’analyse pas`);
  });
});
