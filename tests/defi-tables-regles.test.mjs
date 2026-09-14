// Lot 3 de Défi tables v2 (08/09/2026) : « les règles ».
//
// Le mélange devient obligatoire et verrouille « Je valide » ; l'escalier des
// étoiles n'arrive qu'à la fin ; un rang qui ne redescend jamais ; les jours
// travaillés de la semaine ; le jour LOCAL de l'appareil ; la migration
// versionnée des parcours d'avant. Le moteur d'abord (exécuté), puis ce que la
// page et le serveur en font.

// Le fuseau de la Réunion, AVANT toute date : c'est là que le jour UTC
// (toISOString) basculait à 4 h du matin.
process.env.TZ = "Indian/Reunion";

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const core = require("../outils/calcul_mental/defi_tables_core.js");
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const applis = await readFile(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");
const confidentialite = await readFile(new URL("../confidentialite.html", import.meta.url), "utf8");

const DATE = "2026-09-08";
const n = config => core.normalizeConfiguration(config);
const jouer = (etat, config, correct, total, date = DATE) => P.appliquerSerie(etat, n(config), {correct, total, date});
const types = resultat => resultat.evenements.map(evenement => evenement.type);

// Valide des tables l'une après l'autre en réussissant le mélange dès qu'il est dû.
function acquerir(etat, tables, date = DATE) {
  return tables.reduce((courant, table) => {
    const libre = P.melangeDu(courant) ? jouer(courant, P.configMelange(courant), 20, 20, date).parcours : courant;
    return jouer(libre, P.configValidation(table), 20, 20, date).parcours;
  }, etat);
}

// Les 9 tables, le mélange des 9 : l'escalier est ouvert.
function escalierOuvert(date = DATE) {
  const neuf = acquerir(P.creerParcours(), [...P.TABLES], date);
  return jouer(neuf, P.configMelange(neuf), 20, 20, date).parcours;
}

// ---------------------------------------------------------------- le mélange

test("le mélange : dû dès 2 tables (à faire), à jour quand il est réussi, à refaire à chaque nouvelle table — jusqu’aux 9", () => {
  let etat = acquerir(P.creerParcours(), [2]);
  assert.equal(P.melangeDu(etat), false, "une table : rien à mélanger");
  assert.equal(P.etatAffichage(etat).melange.visible, false);

  etat = jouer(etat, P.configValidation(10), 20, 20).parcours;
  assert.equal(P.melangeDu(etat), true, "deux tables : le mélange est dû");
  let affichage = P.etatAffichage(etat);
  assert.equal(affichage.melange.visible, true);
  assert.equal(affichage.melange.du, true);
  assert.equal(affichage.melange.aRefaireAvec, null, "« à faire », pas « à refaire »");
  assert.equal(affichage.verrou, true);
  assert.equal(affichage.prochaine.type, "melange");

  etat = jouer(etat, P.configMelange(etat), 18, 20).parcours;
  assert.equal(P.melangeDu(etat), false);
  affichage = P.etatAffichage(etat);
  assert.equal(affichage.melange.aJour, true);
  assert.equal(affichage.verrou, false);

  etat = jouer(etat, P.configValidation(5), 20, 20).parcours;
  affichage = P.etatAffichage(etat);
  assert.equal(affichage.melange.du, true);
  assert.equal(affichage.melange.aRefaireAvec, 5, "à refaire avec la table de 5");
  assert.deepEqual(affichage.melange.tables, [2, 5, 10]);

  // Jusqu'à la neuvième : le mélange reste visible et dû avec les 9 tables.
  etat = acquerir(etat, [3, 4, 6, 7, 8, 9]);
  assert.ok(P.toutesAcquises(etat));
  affichage = P.etatAffichage(etat);
  assert.equal(affichage.melange.visible, true, "avec les 9 tables, le mélange existe encore");
  assert.equal(affichage.melange.aRefaireAvec, 9);
  assert.deepEqual(P.configMelange(etat), {mode: "validation", tables: [...P.TABLES], total: 20, duration: 90});
  assert.equal(affichage.expert.ouvert, false);
});

test("le format du mélange = celui de la validation : 20 questions, 14 produits + 6 trous, tables acquises seulement, 1 min 30, 2 erreurs max, sans division", () => {
  const etat = acquerir(P.creerParcours(), [2, 10, 5]);
  const config = n(P.configMelange(etat));
  assert.equal(config.mode, "validation");
  assert.equal(config.total, 20);
  assert.equal(config.duration, 90);
  for (let tirage = 0; tirage < 20; tirage += 1) {
    const questions = core.generateQuestions(config);
    assert.equal(questions.length, 20);
    assert.equal(questions.filter(question => question.category === "direct").length, 14);
    assert.equal(questions.filter(question => question.category === "missing").length, 6);
    assert.ok(questions.every(question => [2, 5, 10].includes(question.focusTable)), "tables acquises seulement");
    assert.ok(!questions.some(question => question.category === "division"));
  }
  assert.equal(jouer(etat, P.configMelange(etat), 17, 20).parcours.melange.aJour, false, "3 erreurs : raté");
  assert.equal(jouer(etat, P.configMelange(etat), 18, 20).parcours.melange.aJour, true, "2 erreurs : réussi");
  // Le dernier, avec les 9 tables : même format, toujours sans division.
  const neuf = acquerir(P.creerParcours(), [...P.TABLES]);
  const dernier = n(P.configMelange(neuf));
  assert.equal(dernier.total, 20);
  assert.equal(dernier.duration, 90);
  assert.deepEqual(dernier.questionTypes, ["direct", "missing"]);
});

// ---------------------------------------------------------------- le verrou

test("le verrou ne touche que « Je valide » d’une table non acquise ; J’apprends et Je m’entraîne restent libres", () => {
  const etat = acquerir(P.creerParcours(), [2, 10]);
  assert.ok(P.melangeDu(etat));
  const tentative = jouer(etat, P.configValidation(5), 20, 20);
  assert.equal(tentative.evenements[0].verrouillee, true);
  assert.equal(tentative.parcours.tables[5].acquise, null);
  assert.equal(P.tablesAcquises(tentative.parcours).length, 2);
  // Mais la série a bien été jouée : le meilleur essai est noté, la grille compte.
  const grille = P.appliquerReponse(etat, "5-7", {correcte: true, date: DATE});
  assert.equal(grille.parcours.calculs["5-7"].cases, 1, "la grille ne connaît pas le verrou");
  assert.equal(jouer(etat, P.configEntraine(5, "mixte"), 10, 10).parcours.tables[5].entraine.mixte, 2);
  assert.equal(jouer(etat, P.configApprends(5, "construct"), 11, 11).parcours.tables[5].apprends.construct, 2);
  assert.equal(jouer(etat, P.configValidation(10), 20, 20).evenements[0].verrouillee, false, "une table acquise se rejoue");
  assert.equal(jouer(etat, P.configValidation(5, 180), 20, 20).evenements[0].type, "preparation", "2 ou 3 min = préparation, verrou ou pas");
  // Le mélange réussi lève le verrou pour de bon, jusqu'à la table suivante.
  const libre = jouer(etat, P.configMelange(etat), 20, 20).parcours;
  assert.equal(jouer(libre, P.configValidation(5), 20, 20).evenements[0].nouvelle, true);
});

// --------------------------------------------------------------- l'escalier

test("l’escalier : 5 marches par la durée seule, tout dedans, 2 erreurs max ; une étoile réussie valide les précédentes", () => {
  const etat = escalierOuvert();
  assert.ok(P.escalierOuvert(etat));
  const affichage = P.etatAffichage(etat);
  assert.equal(affichage.expert.ouvert, true);
  assert.deepEqual(affichage.expert.marches.map(marche => [marche.symbole, marche.libelleDuree]),
    [["★", "2 min"], ["★★", "1 min 45"], ["★★★", "1 min 30"], ["★★★★", "1 min 15"], ["👑", "1 min"]]);
  assert.equal(affichage.expert.suivante.etoile, 1);
  [1, 2, 3, 4, 5].forEach(etoile => {
    const config = n(P.configEtoile(etoile));
    assert.equal(config.total, 25);
    assert.deepEqual(config.tables, [...P.TABLES]);
    assert.deepEqual(config.questionTypes, ["direct", "missing", "division"]);
    assert.equal(config.duration, [120, 105, 90, 75, 60][etoile - 1]);
    const questions = core.generateQuestions(config);
    assert.equal(questions.length, 25);
    assert.ok(questions.some(question => question.category === "division"), "des divisions dès la première étoile");
    assert.deepEqual(P.classerSerie(etat, config), {type: "etoile", etoile});
  });
  assert.equal(jouer(etat, P.configEtoile(2), 22, 25).parcours.expert.etoiles, 0, "3 erreurs : raté");
  const deux = jouer(etat, P.configEtoile(2), 23, 25).parcours;
  assert.equal(deux.expert.etoiles, 2, "★★ réussie directement : ★ et ★★ acquises");
  assert.equal(P.etatAffichage(deux).expert.suivante.etoile, 3);
  assert.equal(jouer(deux, P.configEtoile(1), 25, 25).parcours.expert.etoiles, 2, "rejouer ★ ne retire rien");
  const couronne = jouer(deux, P.configEtoile(5), 24, 25);
  assert.equal(couronne.parcours.expert.etoiles, 5);
  assert.equal(couronne.parcours.expert.couronne, DATE);
  assert.equal(couronne.evenements[0].couronne, true);
  assert.equal(P.etatAffichage(couronne.parcours).expert.suivante, null, "plus rien à tenter");
  assert.equal(P.symboleEtoile(5), "👑");
  assert.equal(P.symboleEtoile(4), "★★★★");
});

test("l’escalier est fermé sans les 9 tables ou sans le dernier mélange : une marche jouée ne compte pas", () => {
  const huit = acquerir(P.creerParcours(), [2, 10, 5, 3, 4, 6, 7, 8]);
  assert.equal(P.classerSerie(huit, n(P.configEtoile(1))), null);
  assert.equal(P.etatAffichage(huit).expert.ouvert, false);
  const neuf = acquerir(P.creerParcours(), [...P.TABLES]);
  assert.equal(P.melangeDu(neuf), true);
  assert.equal(P.classerSerie(neuf, n(P.configEtoile(1))), null, "9 tables, mélange à refaire : fermé");
  assert.equal(jouer(neuf, P.configEtoile(1), 25, 25).classement, null);
  assert.equal(P.prochaineEtape(neuf).type, "melange");
  // Les anciens tests Expert (niveau 1 ou 2, ou 3 minutes) ne sont plus des marches.
  const ouvert = escalierOuvert();
  assert.equal(P.classerSerie(ouvert, n({mode: "test", tables: [...P.TABLES], testLevel: 1, duration: 120})), null);
  assert.equal(P.classerSerie(ouvert, n({mode: "test", tables: [...P.TABLES], testLevel: 3, duration: 180})), null);
  assert.equal(P.classerSerie(ouvert, n({mode: "test", tables: [2, 3, 4], testLevel: 3, duration: 120})), null);
});

// ------------------------------------------------------------------ le rang

test("le rang : Bronze à 1 table, Argent à 3, Or à 6, Platine à 9 + mélange, Diamant à ★★★★, Légende à 👑", () => {
  let etat = P.creerParcours();
  assert.equal(P.etatAffichage(etat).rang.niveau, 0, "avant la première table : pas de badge");
  const attendu = [[2, "Bronze"], [10, "Bronze"], [5, "Argent"], [3, "Argent"], [4, "Argent"], [6, "Or"], [7, "Or"], [8, "Or"], [9, "Or"]];
  attendu.forEach(([table, nom]) => {
    etat = acquerir(etat, [table]);
    assert.equal(P.etatAffichage(etat).rang.nom, nom, `${P.tablesAcquises(etat).length} tables → ${nom}`);
  });
  const platine = jouer(etat, P.configMelange(etat), 20, 20);
  assert.equal(platine.parcours.rang, 4);
  assert.deepEqual(platine.evenements.find(evenement => evenement.type === "rang"), {type: "rang", rang: 4, nom: "Platine", cle: "platine"});
  etat = jouer(platine.parcours, P.configEtoile(3), 25, 25).parcours;
  assert.equal(P.etatAffichage(etat).rang.nom, "Platine", "★★★ ne suffit pas");
  etat = jouer(etat, P.configEtoile(4), 25, 25).parcours;
  assert.equal(P.etatAffichage(etat).rang.nom, "Diamant");
  etat = jouer(etat, P.configEtoile(5), 25, 25).parcours;
  assert.deepEqual(P.etatAffichage(etat).rang, {niveau: 6, cle: "legende", nom: "Légende des tables"});
});

test("le rang ne redescend jamais : ni après une erreur, ni à la fusion, ni sous un parcours renvoyé par un appareil d’avant", () => {
  const argent = acquerir(P.creerParcours(), [2, 10, 5]);
  assert.equal(argent.rang, 2);
  // Une validation ratée, un mélange raté, des erreurs dans la grille : rien ne bouge.
  let etat = jouer(argent, P.configMelange(argent), 10, 20).parcours;
  etat = jouer(etat, P.configValidation(3), 5, 20).parcours;
  etat = P.appliquerReponse(etat, "2-5", {correcte: false, date: DATE}).parcours;
  assert.equal(etat.rang, 2);
  // Le rang enregistré est le meilleur atteint : un parcours qui le porte le garde,
  // même si son état courant dit moins (ici, rang 5 mais rien d'acquis).
  const porte = P.normaliserParcours({version: 2, rang: 5});
  assert.equal(porte.rang, 5);
  assert.equal(P.fusionner(porte, P.creerParcours()).rang, 5);
  assert.equal(P.fusionner(P.creerParcours(), porte).rang, 5);
  // Un appareil d'avant renvoie un parcours de version 1 : il n'a pas de rang,
  // la fusion garde celui de l'appareil à jour.
  const ancien = {version: 1, tables: {2: {acquise: "2026-09-01"}}};
  assert.equal(P.fusionner(argent, ancien).rang, 2);
  assert.equal(P.fusionner(ancien, argent).rang, 2);
  // Un rang trafiqué hors bornes ne passe pas.
  assert.equal(P.normaliserParcours({version: 2, rang: 99}).rang, 0);
});

// ---------------------------------------------------------------- le jour

test("le jour est le jour LOCAL de l’appareil : à la Réunion, 1 h du matin est déjà demain (le jour UTC disait encore hier)", () => {
  const uneHeureDuMatin = new Date(2026, 8, 8, 1, 0, 0);
  assert.equal(P.jourLocal(uneHeureDuMatin), "2026-09-08");
  assert.equal(uneHeureDuMatin.toISOString().slice(0, 10), "2026-09-07", "le jour UTC, lui, bascule à 4 h du matin ici");
  assert.equal(P.jourLocal(new Date(2026, 8, 8, 3, 59)), "2026-09-08");
  assert.equal(P.jourLocal(new Date(2026, 8, 8, 23, 59)), "2026-09-08");
  assert.equal(P.jourLocal(new Date(2026, 0, 1, 0, 0)), "2026-01-01", "mois et jour sur deux chiffres");
  assert.match(P.jourLocal(), /^\d{4}-\d{2}-\d{2}$/);
  assert.match(P.jourLocal(new Date("n'importe quoi")), /^\d{4}-\d{2}-\d{2}$/, "une date illisible retombe sur aujourd'hui");
  // Une réponse et une série sans date explicite prennent le jour local.
  const aujourdhui = P.jourLocal();
  assert.equal(P.appliquerReponse(P.creerParcours(), "7-8", {correcte: true}).parcours.calculs["7-8"].gagne, aujourdhui);
  assert.equal(P.appliquerSerie(P.creerParcours(), n(P.configValidation(7)), {correct: 20, total: 20}).parcours.tables[7].acquise, aujourdhui);
  // Et la page suit la même définition.
  assert.match(html, /function jourDuJour\(\) \{\s*return PARCOURS\.jourLocal\(\);/);
  assert.doesNotMatch(html.replace(/\/\/[^\n]*/g, ""), /toISOString\(\)\.slice\(0, 10\)/, "plus de jour UTC dans la page");
  assert.doesNotMatch(await_(), /toISOString/, "ni dans le moteur");
});

function await_() {
  return require("node:fs").readFileSync(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8").replace(/\/\/[^\n]*/g, "");
}

// ------------------------------------------------------------- les jours

test("les jours travaillés : un jour compte dès qu’une série de la grille est jouée, jamais J’apprends ; 14 jours gardés", () => {
  let etat = P.creerParcours();
  etat = jouer(etat, P.configApprends(2, "random"), 11, 11, "2026-09-01").parcours;
  assert.deepEqual(etat.jours, [], "J’apprends ne compte pas");
  etat = P.appliquerReponse(etat, "2-3", {correcte: false, date: "2026-09-01"}).parcours;
  assert.deepEqual(etat.jours, ["2026-09-01"], "une réponse de la grille, même fausse, marque le jour");
  etat = P.appliquerReponse(etat, "2-4", {correcte: true, date: "2026-09-01"}).parcours;
  assert.deepEqual(etat.jours, ["2026-09-01"], "sans doublon");
  for (let jour = 2; jour <= 20; jour += 1) {
    etat = P.appliquerReponse(etat, "2-4", {correcte: true, date: `2026-09-${String(jour).padStart(2, "0")}`}).parcours;
  }
  assert.equal(etat.jours.length, 14);
  assert.equal(etat.jours[0], "2026-09-07");
  assert.equal(etat.jours[13], "2026-09-20");
  // Sauvegarde, relecture, fusion : les jours restent des dates triées.
  const relu = P.normaliserParcours(JSON.parse(JSON.stringify(etat)));
  assert.deepEqual(relu.jours, etat.jours);
  const autre = P.appliquerReponse(P.creerParcours(), "3-3", {correcte: true, date: "2026-09-21"}).parcours;
  assert.equal(P.fusionner(etat, autre).jours.at(-1), "2026-09-21");
  assert.equal(P.fusionner(etat, autre).jours.length, 14);
});

test("« N jours cette semaine » compte depuis lundi, aujourd’hui compris — rien à casser ; « N calculs demain » = ce qui sera dû demain", () => {
  assert.equal(P.lundiDe("2026-09-08"), "2026-09-07", "mardi 8 → lundi 7");
  assert.equal(P.lundiDe("2026-09-07"), "2026-09-07", "un lundi reste lundi");
  assert.equal(P.lundiDe("2026-09-13"), "2026-09-07", "dimanche 13 → lundi 7");
  assert.equal(P.lundiDe("2026-09-14"), "2026-09-14");
  let etat = P.creerParcours();
  [["2026-09-03", "2-3"], ["2026-09-05", "2-4"], ["2026-09-07", "2-6"], ["2026-09-08", "2-7"], ["2026-09-08", "2-8"]].forEach(([jour, cle]) => {
    etat = P.appliquerReponse(etat, cle, {correcte: true, date: jour}).parcours;
  });
  // Lot mémoire : chaque calcul réussi (jamais vu) entre en boîte 2, retour le lendemain.
  assert.deepEqual(P.bilanJours(etat, "2026-09-08"), {semaine: 2, dus: 3, demain: 5, aujourdhui: true}, "lundi 7 et mardi 8 ; 2-3, 2-4 et 2-6 sont dus (revenus le 4, le 6, le 8) ; demain, les 5");
  assert.equal(P.bilanJours(etat, "2026-09-09").semaine, 2, "mercredi sans travail : toujours 2, rien ne se casse");
  assert.equal(P.bilanJours(etat, "2026-09-09").dus, 5);
  assert.equal(P.bilanJours(etat, "2026-09-14").semaine, 0, "lundi suivant : on repart de zéro, sans message");
  assert.equal(P.bilanJours(etat, "2026-09-06").semaine, 2, "la semaine du 31/08 au 06/09 : jeudi 3 et samedi 5");
  // Un calcul monté en boîte 4 aujourd'hui revient dans 7 jours : rien demain.
  let su = P.creerParcours();
  ["2026-09-01", "2026-09-02", "2026-09-05"].forEach(jour => { su = P.appliquerReponse(su, "7-8", {correcte: true, date: jour}).parcours; });
  assert.equal(su.calculs["7-8"].boite, 4);
  assert.deepEqual(P.bilanJours(su, "2026-09-05"), {semaine: 3, dus: 0, demain: 0, aujourdhui: true}, "mardi 1er, mercredi 2, samedi 5 : trois jours");
  assert.equal(P.bilanJours(su, "2026-09-12").dus, 1);
  assert.equal(P.etatAffichage(su).jours.semaine >= 0, true);
});

// ------------------------------------------------------------- la migration

test("migration des parcours d’avant : tables gardées, ★/★★ → rien, ★★★ → ★, mélange remis à faire, une seule fois, version 2", () => {
  const ancien = {
    version: 1,
    epoque: 2,
    prenom: "Léa",
    tables: {2: {acquise: "2026-08-30", entraine: {desordre: 2, trous: 2, mixte: 2}}, 10: {acquise: "2026-08-31"}, 5: {acquise: "2026-09-01"}},
    melange: {tables: [2, 5, 10], aJour: true, aRefaireAvec: null, dernier: "2026-09-02"},
    expert: {niveau: 2, dernier: "2026-09-03", champion: null},
    calculs: {"2-5": {cases: 2, vu: "2026-09-01", erreur: null, gagne: "2026-09-01"}}
  };
  const migre = P.normaliserParcours(ancien);
  assert.equal(migre.version, 3);
  assert.equal(migre.epoque, 2, "l’époque ne bouge pas");
  assert.deepEqual(P.tablesAcquises(migre), [2, 5, 10], "les tables acquises restent acquises");
  assert.equal(migre.tables[2].acquise, "2026-08-30", "à leur date");
  assert.deepEqual(migre.calculs["2-5"], {boite: 3, cases: 2, vu: "2026-09-01", erreur: null, gagne: "2026-09-01", echeance: "2026-09-04"}, "la grille ne bouge pas : 2 cases → boîte 3 (bleu), échéance recalculée (lot mémoire)");
  assert.equal(migre.expert.etoiles, 0, "★★ d’avant ne vaut rien");
  assert.equal(migre.expert.couronne, null);
  assert.equal(migre.melange.aJour, false, "le mélange est remis à faire");
  assert.equal(migre.melange.aRefaireAvec, null);
  assert.equal(migre.melange.dernier, "2026-09-02", "la date du dernier reste, pour mémoire");
  assert.ok(P.melangeDu(migre));
  assert.equal(migre.rang, 2, "et il reçoit son rang : 3 tables = Argent");
  assert.ok(!("avis" in migre) && !("avisVu" in migre), "lot 4b : la migration ne pose plus d’avis à lire");

  // Champion d'avant (★★★ : divisions en 2 min) → la nouvelle ★, escalier fermé.
  const champion = P.normaliserParcours({version: 1, tables: Object.fromEntries(P.TABLES.map(t => [t, {acquise: "2026-09-01"}])), melange: {aJour: false}, expert: {niveau: 3, champion: "2026-09-02", dernier: "2026-09-02"}});
  assert.equal(champion.expert.etoiles, 1);
  assert.equal(champion.expert.dernier, "2026-09-02");
  assert.equal(P.escalierOuvert(champion), false, "il lui reste le mélange des 9 tables");
  assert.equal(champion.rang, 3, "9 tables sans le mélange : Or, pas Platine");
  assert.equal(P.prochaineEtape(champion).type, "melange");
  assert.equal(P.etatAffichage(champion).expert.niveau, 1);

  // Sans version : c'est un parcours d'avant aussi.
  assert.equal(P.normaliserParcours({tables: {7: {acquise: "2026-09-01"}}}).version, 3);
  // Un parcours qui porte encore les anciens compteurs d'avis les perd en silence.
  assert.ok(!("avis" in P.normaliserParcours({version: 2, avis: 2, avisVu: 0})));

  // Une seule fois : relu (version 2), plus rien ne bouge — même si l'élève a
  // refait son mélange entre-temps.
  const refait = jouer(migre, P.configMelange(migre), 20, 20).parcours;
  assert.equal(refait.melange.aJour, true);
  const relu = P.normaliserParcours(JSON.parse(JSON.stringify(refait)));
  assert.equal(relu.melange.aJour, true, "pas de seconde migration");
  assert.equal(relu.version, 3);
  // Les anciens champs (niveau, champion) n'existent plus dans un parcours à jour.
  assert.equal("niveau" in relu.expert, false);
  assert.equal("champion" in relu.expert, false);
});

test("migration robuste à un appareil resté sur l’ancienne version : ce qu’il renvoie repasse par la migration et ne fait rien perdre", () => {
  // Léa a migré sur son téléphone, refait son mélange et validé une table de plus.
  let telephone = P.normaliserParcours({version: 1, tables: {2: {acquise: "2026-08-30"}, 10: {acquise: "2026-08-31"}}, melange: {aJour: true}});
  telephone = jouer(telephone, P.configMelange(telephone), 20, 20).parcours;
  telephone = jouer(telephone, P.configValidation(5), 20, 20).parcours;
  assert.deepEqual(P.tablesAcquises(telephone), [2, 5, 10]);
  // L'ordinateur du collège, encore sur l'ancienne appli, renvoie un parcours de
  // version 1 : deux tables, un mélange « à jour » à l'ancienne (25 produits
  // en 2 min), et même une ancienne ★★ gagnée entre-temps.
  const ordinateur = {version: 1, tables: {2: {acquise: "2026-08-30"}, 10: {acquise: "2026-08-31"}}, melange: {aJour: true, tables: [2, 10]}, expert: {niveau: 2}};
  [P.fusionner(telephone, ordinateur), P.fusionner(ordinateur, telephone)].forEach(fusion => {
    assert.deepEqual(P.tablesAcquises(fusion), [2, 5, 10], "rien ne se perd");
    assert.equal(fusion.expert.etoiles, 0, "l’ancienne ★★ ne vaut rien");
    assert.equal(fusion.melange.aJour, false, "le mélange à l’ancienne ne compte pas, et la table de 5 le remet de toute façon");
    assert.equal(fusion.version, 3);
    assert.equal(fusion.rang, 2);
  });
  // Et si l'ancien appareil renvoie plus (un parcours avancé sous les vieilles
  // règles) : ses tables sont gardées, ses étoiles converties, son mélange à refaire.
  const avance = {version: 1, tables: Object.fromEntries(P.TABLES.map(t => [t, {acquise: "2026-09-01"}])), melange: {aJour: true}, expert: {niveau: 3, champion: "2026-09-02"}};
  const fusion = P.fusionner(telephone, avance);
  assert.ok(P.toutesAcquises(fusion));
  assert.equal(fusion.expert.etoiles, 1);
  assert.equal(P.escalierOuvert(fusion), false);
});

test("l’avis « le parcours a changé » n’existe plus : ni dans le moteur, ni dans la page, ni au serveur", () => {
  // Lot 4b (décision de Gwenaël, 10/09/2026) : le message avait été ajouté
  // pour des élèves qui n'existaient pas (personne avant le 8/09). La
  // migration des données reste, le message et ses deux compteurs partent.
  const migre = P.normaliserParcours({version: 1, tables: {2: {acquise: "2026-08-30"}}});
  assert.ok(!("avis" in P.etatAffichage(migre)));
  assert.equal(typeof P.avisEnAttente, "undefined");
  assert.equal(typeof P.marquerAvisVu, "undefined");
  assert.doesNotMatch(html, /Le parcours a changé/);
  assert.doesNotMatch(html, /acc-avis|marquerAvisVu|texteAvis|renderAvis|class="avis"/);
  assert.doesNotMatch(applis, /'avis'|'avisVu'/, "le serveur ne les déclare plus : un vieil appareil qui les envoie encore les voit simplement filtrés");
});

// -------------------------------------------------------------- la page

test("l’accueil : « Mon mélange » surligné, le cadenas sur Je valide, l’escalier comme bloc principal, le badge de rang, la ligne des jours", () => {
  assert.match(html, /titre: "Mon mélange"/);
  assert.match(html, /sousTitre: "Réussis d’abord ton mélange"/);
  assert.match(html, /classe: "valide verrou"/);
  assert.match(html, /cadenas\.textContent = "🔒";/);
  assert.match(html, /ligneVerrou\.setAttribute\("aria-disabled", "true"\)/, "le cadenas se lit, il n’est pas un bouton désactivé en silence");
  assert.match(html, /const verrouillee = etat\.verrou && !ligne\.acquise;/, "le verrou ne touche que « Je valide » d’une table non acquise");
  assert.match(html, /\.etape\.melange\.is-next \{ border-color: #e0a800/, "le mélange dû est surligné en jaune");
  assert.match(html, /<section id="acc-expert" class="expert"[^>]*hidden>[\s\S]*<div id="acc-escalier" class="escalier"/);
  assert.match(html, /"Toutes les tables, de plus en plus vite" : "Réussis le mélange de tes 9 tables"/);
  assert.match(html, /titre: `Tenter \$\{suivante\.symbole\}`/, "un seul bouton « Tenter ★★★ »");
  assert.match(html, /"M’entraîner sur une table"/);
  assert.match(html, /"9 sur 9 acquises "/);
  assert.match(html, /<span id="acc-rang" class="rang"><\/span>/, "le badge de rang, sous « N tables acquises sur 9 »");
  assert.ok(html.indexOf('id="acc-acquises"') < html.indexOf('id="acc-rang"'));
  assert.equal((html.match(/badgeRang\(/g) || []).length, 3, "le badge : l’accueil, la fête de rang, et sa définition — nulle part ailleurs");
  assert.match(html, /<div id="acc-jours" class="jours" hidden><\/div>/);
  assert.match(html, /cette semaine`/);
  // Lot R3 (12/09) : « case » parlait d'une grille que l'élève n'a pas forcément
  // ouverte. Lot mémoire : « N calculs demain », d'après les échéances.
  assert.match(html, /\$\{pluriel\(jours\.demain, "calcul"\)\} demain/);
  assert.doesNotMatch(html, /à regagner demain/);
  assert.doesNotMatch(html.replace(/\/\/[^\n]*/g, ""), /jours de suite|d’affilée/, "pas de compteur d’affilée (décision du 08/09 : version b)");
  // Ce qui a disparu.
  const visible = html.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
  assert.doesNotMatch(visible, /Champion des tables/);
  assert.doesNotMatch(visible, /configExpert/);
  assert.doesNotMatch(visible, /valide toutes tes tables/);
  assert.doesNotMatch(visible, /25 produits/);
});

test("le parcours : Acquise cadenassée, « Mon mélange » jusqu’aux 9 tables, l’escalier à cinq marches avec leur durée", () => {
  assert.match(html, /kind: "lock",[\s\S]*?label: `Table de \$\{ligne\.table\}, valider ma table : verrouillé, réussis d’abord ton mélange`/);
  assert.match(html, /"Mon mélange : mes 9 tables" : `Mon mélange : tables \$\{listeTables\(etat\.melange\.tables\)\}`/);
  assert.match(html, /label: "Mon mélange, mes tables acquises \(20 questions en 1 min 30\)"/);
  assert.match(html, /expertTitle\.textContent = "Je deviens expert : toutes les tables, de plus en plus vite";/);
  assert.match(html, /etat\.expert\.marches\.forEach\(marche => \{/);
  assert.match(html, /config: etat\.expert\.ouvert \? marche\.config : null/, "fermé : les marches ne lancent rien");
  assert.match(html, /"après le mélange des 9 tables"/);
  assert.match(html, /\.cell\.is-lock \{/);
  assert.match(html, /\.cell\.is-star\.n4 \{/);
});

test("le résultat et les fêtes : 🎉 table et mélange, 🌟 étoile, un écran de rang, 👑 au sommet — sobres, sans son", () => {
  // Lot R2 : la fête est le cadre du verdict, en plus grand.
  assert.match(html, /verdict\.titre = `Table de \$\{validation\.table\} acquise !`;/);
  assert.match(html, /verdict\.titre = melange\.escalierOuvert \? "Mélange des 9 tables réussi !" : "Mélange réussi !";/);
  assert.match(html, /verdict\.icone = "🌟";\s*verdict\.titre = `\$\{PARCOURS\.symboleEtoile\(etoile\.etoile\)\} obtenue !`;/);
  assert.match(html, /verdict\.icone = "👑";\s*verdict\.titre = "Légende des tables !";/);
  assert.match(html, /rang\.append\(document\.createTextNode\("Tu passes "\), badgeRang\(PARCOURS\.rang\(verdict\.rang\)\)\);/);
  assert.match(html, /animation: none !important/, "prefers-reduced-motion");
  assert.doesNotMatch(html, /new Audio\(|AudioContext/, "sans son");
  assert.match(html, /Réussis d’abord ton mélange, puis reviens valider ta table\./, "une validation verrouillée le dit");
  assert.match(html, /L’escalier des étoiles est ouvert !/);
  assert.match(html, /verdict\.titre = "Nouveau rang !";/, "un rang gagné sans autre nouvelle a sa fête à lui");
});

test("le lancement : le mélange se joue en 1 min 30, comme la validation d’une table", () => {
  // 09/09 : l'écran de lancement ne propose plus de durée du tout — le
  // mélange et la validation partent sur celle du moteur.
  assert.doesNotMatch(html, /const validationTable = /);
  assert.doesNotMatch(html, /launch-durations/);
  assert.equal(P.SEUILS.melange.dureeMax, 90);
  assert.equal(P.SEUILS.validation.dureeMax, 90);
  assert.match(html, /return `Mon mélange · \$\{lesquelles\} · 20 questions · \$\{CORE\.durationLabel\(config\.duration\)\}`;/);
});

test("les scripts modifiés ont un nouveau numéro de cache, et la copie serveur du moteur est identique", async () => {
  assert.match(html, /defi_tables_core\.js\?v=20260914-1/);
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20260912-1/);
  const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(moteur.equals(copie), "_serveur/public/prof/defi_tables_mon_parcours.js doit être la copie octet pour octet du moteur");
});

// ------------------------------------------------------------- le serveur

test("le serveur accepte les nouveaux champs (sinon filtrer_progression les jette à la synchro), et la page Confidentialité les nomme", () => {
  const cles = applis.match(/'cles' => \[([\s\S]*?)\]/)[1];
  ["etoiles", "couronne", "rang", "jours", "beads", "boite", "echeance", "cases"].forEach(cle => {
    assert.match(cles, new RegExp(`'${cle}'`), `« ${cle} » déclaré dans _serveur/public/lib/applis.php`);
  });
  assert.match(cles, /'niveau'/, "l’ancien « niveau » reste accepté : un appareil d’avant l’envoie encore");
  // Le parcours de référence figé pour le test PHP porte bien les nouveaux champs.
  const reference = JSON.parse(require("node:fs").readFileSync(new URL("../_serveur/tests/parcours-reference.json", import.meta.url), "utf8"));
  assert.equal(reference.version, 3);
  assert.equal(reference.expert.etoiles, 5);
  assert.deepEqual(reference.calculs["2-2"], {boite: 1, cases: 0, vu: "2026-09-23", erreur: null, gagne: null, echeance: "2026-09-24"}, "lot mémoire : boîte et échéance dans le parcours de référence");
  assert.equal(reference.rang, 6);
  assert.ok(Array.isArray(reference.jours) && reference.jours.length > 0);
  assert.equal(reference.tables[2].apprends.beads, 2, "lot 4b : la cinquième activité est dans le parcours de référence");
  assert.match(confidentialite, /le rang atteint et les jours de travail des deux dernières semaines \(des dates, sans heure\)/);
});

test("un parcours migré fait l’aller-retour du paquet envoyé au serveur sans rien perdre", () => {
  const debut = html.indexOf("function paquetParcours(");
  const fin = html.indexOf("\n      }", debut) + "\n      }".length;
  const paquetParcours = new Function(`${html.slice(debut, fin)}\nreturn paquetParcours;`)();
  let migre = P.normaliserParcours({version: 1, prenom: "Léa", tables: {2: {acquise: "2026-08-30"}, 10: {acquise: "2026-08-31"}, 5: {acquise: "2026-09-01"}}, expert: {niveau: 3}});
  migre = P.appliquerReponse(migre, "2-5", {correcte: true, date: DATE}).parcours;
  const paquet = JSON.parse(paquetParcours("ABC234", migre, 4));
  assert.equal(paquet.parcours.prenom, "");
  assert.equal(paquet.parcours.version, 3);
  assert.equal(paquet.parcours.expert.etoiles, 1);
  assert.deepEqual(paquet.parcours.calculs["2-5"], {boite: 2, cases: 1, vu: DATE, erreur: null, gagne: DATE, echeance: P.ajouterJours(DATE, 1)});
  assert.equal(paquet.parcours.rang, 2);
  assert.deepEqual(paquet.parcours.jours, [DATE]);
  // Ce que le serveur renvoie (après son filtre, qui ne garde que les clés
  // déclarées) est relu tel quel : rien ne manque, rien ne migre une 2e fois.
  const relu = P.normaliserParcours(paquet.parcours);
  assert.deepEqual(relu, P.definirPrenom(migre, ""));
});
