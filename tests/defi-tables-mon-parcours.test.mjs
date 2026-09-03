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
  assert.equal(fusion.calculs["3-8"].cases, 1, "l'erreur du 12 (1 case) l'emporte sur les 3 cases du 10 : le jour le plus récent gagne");
  assert.equal(fusion.calculs["3-8"].vu, "2026-09-12");
  assert.equal(fusion.calculs["3-8"].erreur, "2026-09-12");
  assert.equal(fusion.calculs["3-8"].gagne, null, "et rien du 10 ne revient");
  assert.deepEqual(parcours.fusionner(b, a).calculs["3-8"], fusion.calculs["3-8"], "dans les deux sens");
  assert.equal(fusion.calculs["6-7"].cases, 1, "un calcul connu d'un seul côté est repris tel quel");
  assert.equal(fusion.calculs["9-9"].cases, 0);
  assert.equal(Object.keys(fusion.calculs).length, 3);

  // Même jour des deux côtés : impossible d'ordonner (on n'enregistre pas
  // l'heure) — limite connue et acceptée : le plus avancé gagne, l'erreur et
  // le gain les plus récents sont conservés, le gain du jour n'est pas rouvert.
  const matin = parcours.normaliserParcours({calculs: {"3-8": {cases: 3, vu: "2026-09-12", erreur: null, gagne: "2026-09-12"}}});
  const apresMidi = parcours.normaliserParcours({calculs: {"3-8": {cases: 2, vu: "2026-09-12", erreur: "2026-09-12", gagne: null}}});
  const memeJour = parcours.fusionner(matin, apresMidi).calculs["3-8"];
  assert.deepEqual(memeJour, {cases: 3, vu: "2026-09-12", erreur: "2026-09-12", gagne: "2026-09-12"});
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
    expert: {niveau: 1, dernier: "2026-09-02", champion: "x".repeat(300)},
    calculs: {"3-8": {cases: 1, vu: "pas une date"}, "6-7": {cases: 1, vu: "2026-09-03", erreur: "<script>", gagne: "2026-09-03"}}
  });
  assert.equal(abime.tables[7].acquise, null);
  assert.equal(abime.melange.dernier, null);
  assert.equal(abime.expert.dernier, "2026-09-02");
  assert.equal(abime.expert.champion, null);
  assert.equal(abime.calculs["3-8"], undefined, "un calcul sans jour valide n'existe pas");
  assert.deepEqual(abime.calculs["6-7"], {cases: 1, vu: "2026-09-03", erreur: null, gagne: "2026-09-03"});
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
  assert.match(html, /Ton prénom reste sur cet appareil\./);
  assert.match(html, /id="parcours-reset"[\s\S]*Recommencer à zéro/);
  assert.match(html, /id="parcours-confirm-yes"[\s\S]*Effacer/);
  assert.doesNotMatch(html, /window\.confirm\(/);
  assert.match(html, /PARCOURS\.appliquerSerie\(parcours, state\.configuration, \{correct: state\.correct, total: TOTAL\}\)/);
  assert.match(html, /PARCOURS\.demarrerSerie\(parcours, config\)/);
  assert.match(html, /id="result-parcours"/);
  assert.match(html, /id="result-open-parcours"[\s\S]*Voir mon parcours/);
  assert.match(html, /ENTREE\.ouvrir === "parcours" \|\| ENTREE\.code\) openParcours\(\);/);
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
  // Le code arrive par le lien de l'espace élève. L'adresse est lue par le
  // script du <head> (tests/defi-tables-suivi-appareil.test.mjs l'exécute) ;
  // l'appli a un repli qui la lit de la même façon si ce script n'a pas tourné.
  assert.match(html, /window\.MATHSGO_ENTREE = entree;/);
  assert.match(html, /parametres\.get\("code"\)/);
  assert.match(html, /parametres\.get\("fiche"\)/);
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
  assert.match(html, /Ta progression, elle, est enregistrée pour ton professeur\./,
    "la phrase vraie pour un élève suivi doit rester");
  assert.match(html, /id="suivi-repere"/, "le repère de suivi est permanent, dans la barre du haut");
  assert.doesNotMatch(html, /id="parcours-fusion"/, "plus de question « c'est le tien ? » : ce qui est fait sans code reste sans code (lot 2b)");

  // Chaque enregistrement local part aussi au serveur, sans être attendu — et
  // dans la case du code actif.
  assert.match(html, /function sauverParcours\(\) \{\s*PARCOURS\.sauver\(storage\(\), parcours, codeSuivi\);/);
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
    const faux = {
      getElementById: id => (id === "lien-retour" ? lien : null),
      querySelector: selecteur => (selecteur === "a.brand" ? logo : null)
    };
    new Function("SUIVI_URL", "document", "suiviActif", "entreeRefusee", `${source}\nreturn majLienRetour;`)(
      "https://suivi.mathsgo.re", faux, () => suivi, entreeRefusee
    )();
    return {lien, logo};
  }

  const sansCode = executer(false).lien;
  assert.equal(sansCode.href, "../index.html?domain=nombres-calculs&notion=calcul-mental");
  assert.equal(sansCode.etiquette.textContent, "Calcul mental");
  assert.equal(sansCode.attributs["aria-label"], "Retour au calcul mental");

  const avecCode = executer(true).lien;
  assert.equal(avecCode.href, "https://suivi.mathsgo.re/");
  assert.equal(avecCode.etiquette.textContent, "Mon espace");
  assert.equal(avecCode.attributs["aria-label"], "Retour à mon espace");

  // Lot 3 : un billet refusé laisse l'élève sans code, mais il vient de son
  // espace — c'est là qu'il doit pouvoir repartir.
  const billetRefuse = executer(false, "expire").lien;
  assert.equal(billetRefuse.href, "https://suivi.mathsgo.re/");
  assert.equal(billetRefuse.etiquette.textContent, "Mon espace");

  // Le logo était la dernière porte de sortie : il ramenait toujours à
  // l'accueil du site, y compris pour un élève arrivé de son espace.
  assert.equal(executer(false).logo.href, "/",
    "pour un visiteur ordinaire, le logo ramène à l'accueil du site");
  assert.equal(executer(false).logo.attributs["aria-label"], "Accueil maths&go");
  assert.equal(executer(true).logo.href, "https://suivi.mathsgo.re/",
    "pour un élève suivi, le logo ramène à son espace");
  assert.equal(executer(true).logo.attributs["aria-label"], "Retour à mon espace");
});


// La fiche est dessinée en millimètres pour du A4 : à 390 px elle demandait
// 518 px et débordait par la droite — sur l'écran même où le professeur consulte
// un élève depuis son téléphone. Ce test EXÉCUTE la fonction d'ajustement sur une
// fausse page, et vérifie que la réduction reste enfermée dans @media screen :
// le papier ne doit jamais être réduit.
test("la fiche d’un élève se met à l’échelle de l’écran, jamais du papier", () => {
  const ecran = /@media screen \{\s*\n\s*body\.mode-fiche #fiche-print \{ zoom: var\(--fiche-zoom, 1\); \}\s*\n\s*\}/;
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

// La phrase sous le champ prénom dit « Ton prénom reste sur cet appareil ». Elle
// doit être VRAIE, y compris pour un élève suivi : c'est exactement le genre de
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
    version: 1,
    prenom: "Léa Dupont",
    tables: {5: {acquise: "2026-08-30"}},
    melange: {tables: [5, 7], aJour: false},
    expert: {niveau: 0},
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
  assert.equal(envoye.parcours.expert.niveau, 0);

  // Et l’appareil de l’élève, lui, garde son prénom : on n’a pas le droit de le
  // lui effacer en passant.
  assert.equal(parcours.prenom, "Léa Dupont",
    "l’objet local ne doit pas être modifié par l’envoi");
});

// « Ce n'est pas moi » et le repère de suivi sont exécutés dans
// tests/defi-tables-suivi-appareil.test.mjs (faux stockage, faux réseau, faux
// document) : ce qui est chargé, ce qui est envoyé, et sous quel code.
test("la sortie est posée sur le repère de suivi, dans la barre du haut", () => {
  assert.match(html, /bouton\("Ce n’est pas moi", /);
  assert.match(html, /bouton\("Quitter", quitterSuivi\)/);
  assert.match(html, /bouton\("Quitter et effacer mon travail de cette tablette", quitterEtEffacer\)/);
  assert.match(html, /bloc\.append\(document\.createTextNode\("· "\), bouton\("Ce n’est pas moi"/,
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
