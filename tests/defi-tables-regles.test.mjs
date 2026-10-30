// Lot 3 de Défi tables v2 (08/09/2026) : « les règles ».
//
// Le mélange devient obligatoire et verrouille « Je valide » ; l'escalier des
// étoiles n'arrive qu'à la fin ; un rang qui ne redescend jamais ; les jours
// travaillés de la semaine ; le jour LOCAL de l'appareil ; la migration
// versionnée des parcours d'avant. Le moteur d'abord (exécuté), puis ce que la
// page et le serveur en font.
//
// Lot « un seul système, les boîtes » (05/10/2026, décisions de Gwenaël) : le
// mélange n'est plus obligatoire — plus de verrou, plus de « à refaire », il
// n'ouvre plus l'escalier (9 tables passées suffisent, Platine aussi). « Mon
// mélange » reste, libre. La table est « passée » (la clé reste « acquise »),
// le test s'appelle « Je passe le test ». Les tests ci-dessous disent ces
// règles-là.

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

// Passe des tables l'une après l'autre : le test réussi suffit, plus aucun
// mélange à réussir entre deux.
function acquerir(etat, tables, date = DATE) {
  return tables.reduce((courant, table) => jouer(courant, P.configValidation(table), 20, 20, date).parcours, etat);
}

// Les 9 tables passées : l'escalier est ouvert (sans mélange).
function escalierOuvert(date = DATE) {
  return acquerir(P.creerParcours(), [...P.TABLES], date);
}

// ---------------------------------------------------------------- le mélange

// Les trois trophées de Mon mélange (3, 6, 9 tables) : ceux qui sont gagnés,
// ceux qui sont à gagner maintenant.
// Lot « Mon mélange aux paliers » (09/10/2026) : deux coupes, 3 et 6 tables.
const trophees = (gagnes = [], aGagner = []) => [3, 6].map(tables => ({tables, gagne: gagnes.includes(tables), aGagner: aGagner.includes(tables)}));

test("le mélange est libre : proposé dès 2 tables passées, jamais dû ni « à refaire » ; il garde le dernier joué, son score et le plus grand nombre de tables réussi — jusqu’aux 9 — et ses coupes (3, puis 6 tables)", () => {
  assert.equal(typeof P.melangeDu, "undefined", "« melangeDu » a quitté le moteur : le mélange n’est plus jamais dû");
  let etat = acquerir(P.creerParcours(), [2]);
  assert.equal(P.configMelange(etat), null, "une table : rien à mélanger");
  assert.equal(P.etatAffichage(etat).melange.visible, false);

  etat = jouer(etat, P.configValidation(10), 20, 20).parcours;
  let affichage = P.etatAffichage(etat);
  assert.deepEqual(affichage.melange, {visible: true, tables: [2, 10], dernier: null, score: null, reussi: null, trophees: trophees()}, "deux tables : le mélange est proposé, jamais joué — aucun trophée à gagner avant 3 tables");
  assert.ok(!("du" in affichage.melange) && !("aJour" in affichage.melange) && !("aRefaireAvec" in affichage.melange), "ni « dû », ni « à jour », ni « à refaire »");
  assert.ok(!("verrou" in affichage), "plus de verrou");
  assert.equal(affichage.prochaine.type, "apprends", "la prochaine étape n’est jamais le mélange : la table suivante");
  assert.equal(affichage.prochaine.table, 5);

  // Raté : le parcours garde le jour et le score, rien d'autre ne bouge.
  const rate = jouer(etat, P.configMelange(etat), 17, 20);
  assert.deepEqual(rate.evenements, [{type: "melange", reussi: false, score: 17, total: 20, tables: [2, 10], trophee: null, coupes: []}], "l’événement : réussi ou non, le score, les tables, le trophée gagné — plus de « escalierOuvert »");
  assert.deepEqual(rate.parcours.melange, {tables: [2, 10], aJour: false, aRefaireAvec: null, dernier: DATE, score: 17, reussi: null});
  assert.deepEqual(P.etatAffichage(rate.parcours).melange, {visible: true, tables: [2, 10], dernier: DATE, score: 17, reussi: null, trophees: trophees()}, "le moteur garde le score du dernier joué (la page ne l’affiche plus)");

  // Réussi le lendemain : « reussi » = le nombre de tables du mélange ; avec 2
  // tables, pas encore de trophée.
  const reussi = jouer(rate.parcours, P.configMelange(rate.parcours), 18, 20, "2026-09-09");
  assert.deepEqual(reussi.evenements, [{type: "melange", reussi: true, score: 18, total: 20, tables: [2, 10], trophee: null, coupes: []}]);
  assert.deepEqual(reussi.parcours.melange, {tables: [2, 10], aJour: true, aRefaireAvec: null, dernier: "2026-09-09", score: 18, reussi: 2});

  // Une table de plus : rien n'est remis « à refaire », « reussi » reste — et
  // le trophée des 3 tables est à gagner.
  const cinq = jouer(reussi.parcours, P.configValidation(5), 20, 20, "2026-09-09");
  assert.ok(!types(cinq).some(type => type.startsWith("melange")), "plus d’événement « melange-a-refaire »");
  etat = cinq.parcours;
  affichage = P.etatAffichage(etat);
  assert.deepEqual(affichage.melange, {visible: true, tables: [2, 5, 10], dernier: "2026-09-09", score: 18, reussi: 2, trophees: trophees([], [3])}, "réussi avec 2 tables, il y en a une de plus depuis : le trophée des 3 tables est à gagner");
  assert.equal(etat.melange.aRefaireAvec, null);
  // Rejoué avec les 3 tables et raté : le dernier score change, « reussi » ne redescend pas, aucun trophée gagné.
  etat = jouer(etat, P.configMelange(etat), 12, 20, "2026-09-10").parcours;
  assert.deepEqual([etat.melange.dernier, etat.melange.score, etat.melange.reussi], ["2026-09-10", 12, 2]);

  // Jusqu'à la neuvième : le mélange reste visible, avec les 9 tables — et il n'ouvre rien.
  etat = acquerir(etat, [3, 4, 6, 7, 8, 9]);
  assert.ok(P.toutesAcquises(etat));
  affichage = P.etatAffichage(etat);
  assert.equal(affichage.melange.visible, true, "avec les 9 tables, le mélange existe encore");
  assert.deepEqual(affichage.melange.tables, [...P.TABLES]);
  assert.deepEqual(P.configMelange(etat), {mode: "validation", tables: [...P.TABLES], total: 20, duration: 90});
  assert.equal(affichage.expert.ouvert, true, "l’escalier est ouvert par les 9 tables, sans mélange");
  const neuf = jouer(etat, P.configMelange(etat), 20, 20, "2026-09-11");
  assert.deepEqual(neuf.evenements, [{type: "melange", reussi: true, score: 20, total: 20, tables: [...P.TABLES], trophee: 6, coupes: [3, 6]}], "le mélange des 9 tables réussi : ni rang, ni escalier — tout était déjà là ; il rapporte les coupes qui manquaient (deux depuis le lot « Mon mélange aux paliers »), « trophee » la plus grande");
  assert.equal(neuf.parcours.melange.reussi, 9);
  assert.deepEqual(P.etatAffichage(neuf.parcours).melange.trophees, trophees([3, 6]), "les deux coupes d’un coup");
});

test("le format du mélange = celui du test d’une table : 20 questions, 14 produits + 3 nombres manquants + 3 divisions (lot « divisions »), tables passées seulement, 1 min 30, 2 erreurs max", () => {
  const etat = acquerir(P.creerParcours(), [2, 10, 5]);
  const config = n(P.configMelange(etat));
  assert.equal(config.mode, "validation");
  assert.equal(config.total, 20);
  assert.equal(config.duration, 90);
  for (let tirage = 0; tirage < 20; tirage += 1) {
    const questions = core.generateQuestions(config);
    assert.equal(questions.length, 20);
    assert.equal(questions.filter(question => question.category === "direct").length, 14);
    assert.equal(questions.filter(question => question.category === "missing").length, 3);
    assert.equal(questions.filter(question => question.category === "division").length, 3);
    assert.ok(questions.every(question => [2, 5, 10].includes(question.focusTable)), "tables passées seulement");
  }
  assert.equal(jouer(etat, P.configMelange(etat), 17, 20).evenements[0].reussi, false, "3 erreurs : raté");
  assert.equal(jouer(etat, P.configMelange(etat), 17, 20).parcours.melange.reussi, null);
  assert.equal(jouer(etat, P.configMelange(etat), 18, 20).evenements[0].reussi, true, "2 erreurs : réussi");
  assert.equal(jouer(etat, P.configMelange(etat), 18, 20).parcours.melange.reussi, 3, "réussi avec ses 3 tables");
  // « Mon mélange » = exactement les tables passées, en 1 min 30 : choisi à
  // la main ou joué plus lentement, ce n'est pas lui.
  assert.deepEqual(P.classerSerie(etat, config), {type: "melange", tables: [2, 5, 10]});
  assert.equal(P.classerSerie(etat, n({mode: "validation", tables: [2, 10], total: 20, duration: 90})), null, "deux tables sur trois : pas « Mon mélange »");
  assert.equal(P.classerSerie(etat, n({mode: "validation", tables: [2, 5, 10], total: 20, duration: 120})), null, "en 2 min : pas « Mon mélange »");
  // Le dernier, avec les 9 tables : même format.
  const neuf = acquerir(P.creerParcours(), [...P.TABLES]);
  const dernier = n(P.configMelange(neuf));
  assert.equal(dernier.total, 20);
  assert.equal(dernier.duration, 90);
  assert.deepEqual(dernier.questionTypes, ["direct", "missing", "division"]);
});

// ------------------------------------------------------- plus de verrou

test("plus de verrou : un test réussi passe la table, toujours — même sans mélange, même après un mélange raté ; J’apprends et Je m’entraîne restent libres", () => {
  const etat = acquerir(P.creerParcours(), [2, 10]);
  assert.equal(etat.melange.dernier, null, "deux tables, le mélange jamais joué");
  const tentative = jouer(etat, P.configValidation(5), 20, 20);
  assert.deepEqual(tentative.evenements[0], {type: "validation", table: 5, reussi: true, score: 20, total: 20, dejaAcquise: false, nouvelle: true}, "l’événement n’a plus de champ « verrouillee »");
  assert.equal(tentative.parcours.tables[5].acquise, DATE);
  assert.equal(P.tablesAcquises(tentative.parcours).length, 3);
  assert.deepEqual(types(tentative), ["validation", "rang"], "ni « melange-debloque », ni « melange-a-refaire »");
  // Un mélange raté ne ferme rien non plus.
  const rate = jouer(etat, P.configMelange(etat), 5, 20).parcours;
  assert.equal(jouer(rate, P.configValidation(5), 20, 20).evenements[0].nouvelle, true);
  // Seul le test lui-même décide : 3 erreurs, la table n'est pas passée.
  const manque = jouer(etat, P.configValidation(5), 17, 20);
  assert.deepEqual([manque.evenements[0].reussi, manque.evenements[0].nouvelle, manque.parcours.tables[5].acquise], [false, false, null]);
  // La grille et les autres étapes, comme avant.
  const grille = P.appliquerReponse(etat, "5-7", {correcte: true, date: DATE});
  assert.equal(grille.parcours.calculs["5-7"].cases, 1);
  assert.equal(jouer(etat, P.configEntraine(5, "mixte"), 10, 10).parcours.tables[5].entraine.mixte, 2);
  assert.equal(jouer(etat, P.configApprends(5, "construct"), 11, 11).parcours.tables[5].apprends.construct, 2);
  const rejouee = jouer(etat, P.configValidation(10), 20, 20).evenements[0];
  assert.deepEqual([rejouee.dejaAcquise, rejouee.nouvelle, "verrouillee" in rejouee], [true, false, false], "une table passée se rejoue");
  assert.equal(jouer(etat, P.configValidation(5, 180), 20, 20).evenements[0].type, "preparation", "2 ou 3 min = préparation");
});

// --------------------------------------------------------------- l'escalier

test("l’escalier : 5 marches par la durée seule, tout dedans, 2 erreurs max ; marche par marche, pas de saut (D5)", () => {
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
    // Lot « après l'audit GPT » (D5, décision de Gwenaël du 14/10/2026) :
    // à 0 étoile, seule ★ compte — ★★ à 👑 ne classent rien.
    assert.deepEqual(P.classerSerie(etat, config), etoile === 1 ? {type: "etoile", etoile} : null);
  });
  assert.equal(jouer(etat, P.configEtoile(1), 22, 25).parcours.expert.etoiles, 0, "3 erreurs : raté");
  assert.deepEqual(jouer(etat, P.configEtoile(2), 25, 25).evenements, [], "★★ sans ★ : la série ne compte pas");
  assert.deepEqual(jouer(etat, P.configEtoile(5), 25, 25).parcours.expert, etat.expert, "👑 directement : rien ne change — plus de Légende d'un coup");
  const une = jouer(etat, P.configEtoile(1), 23, 25).parcours;
  assert.equal(une.expert.etoiles, 1, "2 erreurs : ★ gagnée");
  const deux = jouer(une, P.configEtoile(2), 23, 25).parcours;
  assert.equal(deux.expert.etoiles, 2, "puis ★★ : marche par marche");
  assert.equal(P.etatAffichage(deux).expert.suivante.etoile, 3);
  assert.deepEqual(jouer(deux, P.configEtoile(1), 25, 25).evenements, [], "rejouer ★ (gagnée) ne compte pas");
  assert.equal(jouer(deux, P.configEtoile(1), 25, 25).parcours.expert.etoiles, 2, "et ne retire rien");
  const quatre = jouer(jouer(deux, P.configEtoile(3), 25, 25).parcours, P.configEtoile(4), 25, 25).parcours;
  assert.equal(quatre.expert.etoiles, 4);
  // Lot « Les records » (09/10/2026, décision de Gwenaël) : la couronne exige
  // 25 sur 25 — 24 ne la donne plus.
  assert.equal(jouer(quatre, P.configEtoile(5), 24, 25).parcours.expert.couronne, null, "la couronne : aucune erreur permise");
  const couronne = jouer(quatre, P.configEtoile(5), 25, 25);
  assert.equal(couronne.parcours.expert.etoiles, 5);
  assert.equal(couronne.parcours.expert.couronne, DATE);
  assert.equal(couronne.evenements[0].couronne, true);
  assert.equal(P.etatAffichage(couronne.parcours).expert.suivante, null, "plus rien à tenter");
  // La Légende rejoue la couronne (l'entretien) : la série compte, rien ne change.
  const rejouee = jouer(couronne.parcours, P.configEtoile(5), 25, 25);
  assert.equal(rejouee.evenements[0].type, "etoile");
  assert.equal(rejouee.evenements[0].nouveau, false);
  assert.deepEqual(jouer(couronne.parcours, P.configEtoile(4), 25, 25).evenements, [], "★★★★ gagnée, rejouée : ne compte pas");
  assert.equal(P.symboleEtoile(5), "👑");
  assert.equal(P.symboleEtoile(4), "★★★★");
});

test("l’escalier est fermé sans les 9 tables : une marche jouée ne compte pas ; les 9 tables passées l’ouvrent, sans mélange", () => {
  const huit = acquerir(P.creerParcours(), [2, 10, 5, 3, 4, 6, 7, 8]);
  assert.equal(P.escalierOuvert(huit), false);
  assert.equal(P.classerSerie(huit, n(P.configEtoile(1))), null);
  assert.equal(P.etatAffichage(huit).expert.ouvert, false);
  assert.equal(jouer(huit, P.configEtoile(1), 25, 25).classement, null, "8 tables : la marche jouée ne compte pas");
  // Un mélange réussi avec 8 tables n'ouvre rien.
  assert.equal(P.escalierOuvert(jouer(huit, P.configMelange(huit), 20, 20).parcours), false);
  const neuf = acquerir(P.creerParcours(), [...P.TABLES]);
  assert.equal(neuf.melange.dernier, null, "9 tables, le mélange jamais joué");
  assert.equal(P.escalierOuvert(neuf), true, "9 tables passées : ouvert");
  assert.deepEqual(P.classerSerie(neuf, n(P.configEtoile(1))), {type: "etoile", etoile: 1});
  assert.equal(jouer(neuf, P.configEtoile(1), 25, 25).parcours.expert.etoiles, 1);
  assert.equal(P.prochaineEtape(neuf).type, "etoile", "la prochaine étape : la première marche, plus jamais « melange »");
  // Les anciens tests Expert (niveau 1 ou 2, ou 3 minutes) ne sont plus des marches.
  const ouvert = escalierOuvert();
  assert.equal(P.classerSerie(ouvert, n({mode: "test", tables: [...P.TABLES], testLevel: 1, duration: 120})), null);
  assert.equal(P.classerSerie(ouvert, n({mode: "test", tables: [...P.TABLES], testLevel: 3, duration: 180})), null);
  assert.equal(P.classerSerie(ouvert, n({mode: "test", tables: [2, 3, 4], testLevel: 3, duration: 120})), null);
});

// ------------------------------------------------------------------ le rang

test("le rang : Bronze à 1 table, Argent à 3, Or à 6, Platine à 9 tables passées (sans mélange), Diamant à ★★★★, Légende à 👑", () => {
  let etat = P.creerParcours();
  assert.equal(P.etatAffichage(etat).rang.niveau, 0, "avant la première table : pas de badge");
  const attendu = [[2, "Bronze"], [10, "Bronze"], [5, "Argent"], [3, "Argent"], [4, "Argent"], [6, "Or"], [7, "Or"], [8, "Or"]];
  attendu.forEach(([table, nom]) => {
    etat = acquerir(etat, [table]);
    assert.equal(P.etatAffichage(etat).rang.nom, nom, `${P.tablesAcquises(etat).length} tables → ${nom}`);
  });
  // La neuvième table donne Platine tout de suite : le mélange n'y est plus pour rien.
  const platine = jouer(etat, P.configValidation(9), 20, 20);
  assert.equal(platine.parcours.rang, 4);
  assert.equal(platine.parcours.melange.dernier, null, "sans avoir jamais joué le mélange");
  assert.deepEqual(types(platine), ["validation", "toutes-acquises", "rang"]);
  assert.deepEqual(platine.evenements.find(evenement => evenement.type === "rang"), {type: "rang", rang: 4, nom: "Platine", cle: "platine"});
  // D5 : marche par marche.
  etat = platine.parcours;
  [1, 2, 3].forEach(marche => { etat = jouer(etat, P.configEtoile(marche), 25, 25).parcours; });
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
  // Lot « un seul système » : « dus » et « demain » ne comptent que les calculs
  // des tables passées AVANT le jour — ici la table de 2, passée le 1er.
  const reponses = [["2026-09-03", "2-3"], ["2026-09-05", "2-4"], ["2026-09-07", "2-6"], ["2026-09-08", "2-7"], ["2026-09-08", "2-8"]];
  const avecReponses = depart => reponses.reduce((courant, [jour, cle]) => P.appliquerReponse(courant, cle, {correcte: true, date: jour}).parcours, depart);
  let etat = P.creerParcours();
  etat.tables[2].acquise = "2026-09-01";
  etat = avecReponses(etat);
  assert.deepEqual(P.bilanJours(avecReponses(P.creerParcours()), "2026-09-08"), {semaine: 2, dus: 0, demain: 0, aujourdhui: true}, "sans table passée : les jours comptent, mais aucun calcul n’est « dû » pour Mes calculs du jour");
  // Lot mémoire : chaque calcul réussi (jamais vu) entre en boîte 2, retour le lendemain.
  assert.deepEqual(P.bilanJours(etat, "2026-09-08"), {semaine: 2, dus: 3, demain: 5, aujourdhui: true}, "lundi 7 et mardi 8 ; 2-3, 2-4 et 2-6 sont dus (revenus le 4, le 6, le 8) ; demain, les 5");
  assert.equal(P.bilanJours(etat, "2026-09-09").semaine, 2, "mercredi sans travail : toujours 2, rien ne se casse");
  assert.equal(P.bilanJours(etat, "2026-09-09").dus, 5);
  assert.equal(P.bilanJours(etat, "2026-09-14").semaine, 0, "lundi suivant : on repart de zéro, sans message");
  assert.equal(P.bilanJours(etat, "2026-09-06").semaine, 2, "la semaine du 31/08 au 06/09 : jeudi 3 et samedi 5");
  // Un calcul monté en boîte 4 aujourd'hui revient dans 7 jours : rien demain.
  let su = P.creerParcours();
  su.tables[7].acquise = "2026-08-31";
  ["2026-09-01", "2026-09-02", "2026-09-05"].forEach(jour => { su = P.appliquerReponse(su, "7-8", {correcte: true, date: jour}).parcours; });
  assert.equal(su.calculs["7-8"].boite, 4);
  assert.deepEqual(P.bilanJours(su, "2026-09-05"), {semaine: 3, dus: 0, demain: 0, aujourdhui: true}, "mardi 1er, mercredi 2, samedi 5 : trois jours");
  assert.equal(P.bilanJours(su, "2026-09-12").dus, 1);
  assert.equal(P.etatAffichage(su).jours.semaine >= 0, true);
});

// ------------------------------------------------------------- la migration

test("migration des parcours d’avant : tables gardées, ★/★★ → rien, ★★★ → ★, l’ancien mélange ne vaut pas un mélange réussi (et ne ferme rien), une seule fois, version 2", () => {
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
  assert.equal(migre.melange.aJour, false, "l’ancien mélange (25 produits en 2 min) ne vaut pas le nouveau");
  assert.equal(migre.melange.aRefaireAvec, null);
  assert.equal(migre.melange.dernier, "2026-09-02", "la date du dernier reste, pour mémoire");
  assert.deepEqual(P.etatAffichage(migre).melange, {visible: true, tables: [2, 5, 10], dernier: "2026-09-02", score: null, reussi: null, trophees: trophees([], [3])}, "proposé, jamais réussi au nouveau format — sans score, sans trophée (celui des 3 tables est à gagner)");
  assert.equal(jouer(migre, P.configValidation(3), 20, 20).evenements[0].nouvelle, true, "mais il ne ferme rien : la table suivante se passe sans lui");
  assert.equal(migre.rang, 2, "et il reçoit son rang : 3 tables = Argent");
  assert.ok(!("avis" in migre) && !("avisVu" in migre), "lot 4b : la migration ne pose plus d’avis à lire");

  // Champion d'avant (★★★ : divisions en 2 min) → la nouvelle ★ ; avec ses 9
  // tables, l'escalier est ouvert et il est Platine, sans mélange à refaire.
  const champion = P.normaliserParcours({version: 1, tables: Object.fromEntries(P.TABLES.map(t => [t, {acquise: "2026-09-01"}])), melange: {aJour: false}, expert: {niveau: 3, champion: "2026-09-02", dernier: "2026-09-02"}});
  assert.equal(champion.expert.etoiles, 1);
  assert.equal(champion.expert.dernier, "2026-09-02");
  assert.equal(P.escalierOuvert(champion), true, "9 tables passées : l’escalier est ouvert, sans le mélange des 9 tables");
  assert.equal(champion.rang, 4, "9 tables : Platine");
  assert.deepEqual([P.prochaineEtape(champion).type, P.prochaineEtape(champion).etoile], ["etoile", 2], "la suite : ★★");
  assert.equal(P.etatAffichage(champion).expert.niveau, 1);

  // Sans version : c'est un parcours d'avant aussi.
  assert.equal(P.normaliserParcours({tables: {7: {acquise: "2026-09-01"}}}).version, 3);
  // Un parcours qui porte encore les anciens compteurs d'avis les perd en silence.
  assert.ok(!("avis" in P.normaliserParcours({version: 2, avis: 2, avisVu: 0})));

  // Une seule fois : relu (version 2), plus rien ne bouge — même si l'élève a
  // refait son mélange entre-temps.
  const refait = jouer(migre, P.configMelange(migre), 20, 20).parcours;
  assert.equal(refait.melange.aJour, true);
  assert.equal(refait.melange.reussi, 3);
  const relu = P.normaliserParcours(JSON.parse(JSON.stringify(refait)));
  assert.equal(relu.melange.aJour, true, "pas de seconde migration");
  assert.deepEqual([relu.melange.reussi, relu.melange.score, relu.melange.dernier], [3, 20, DATE], "le mélange réussi est relu tel quel");
  assert.equal(relu.version, 3);
  // Les anciens champs (niveau, champion) n'existent plus dans un parcours à jour.
  assert.equal("niveau" in relu.expert, false);
  assert.equal("champion" in relu.expert, false);
});

test("migration robuste à un appareil resté sur l’ancienne version : ce qu’il renvoie repasse par la migration et ne fait rien perdre", () => {
  // Léa a migré sur son téléphone, réussi son mélange (2 tables) et passé une table de plus.
  let telephone = P.normaliserParcours({version: 1, tables: {2: {acquise: "2026-08-30"}, 10: {acquise: "2026-08-31"}}, melange: {aJour: true}});
  telephone = jouer(telephone, P.configMelange(telephone), 20, 20).parcours;
  telephone = jouer(telephone, P.configValidation(5), 20, 20).parcours;
  assert.deepEqual(P.tablesAcquises(telephone), [2, 5, 10]);
  // L'ordinateur du collège, encore sur l'ancienne appli, renvoie un parcours de
  // version 1 : deux tables, un mélange « à jour » à l'ancienne (25 produits
  // en 2 min), et même une ancienne ★★ gagnée entre-temps.
  const ordinateur = {version: 1, tables: {2: {acquise: "2026-08-30"}, 10: {acquise: "2026-08-31"}}, melange: {aJour: true, tables: [2, 10]}, expert: {niveau: 2}};
  assert.deepEqual([P.normaliserParcours(ordinateur).melange.aJour, P.normaliserParcours(ordinateur).melange.reussi], [false, null], "le mélange à l’ancienne, seul, ne compte pas");
  [P.fusionner(telephone, ordinateur), P.fusionner(ordinateur, telephone)].forEach(fusion => {
    assert.deepEqual(P.tablesAcquises(fusion), [2, 5, 10], "rien ne se perd");
    assert.equal(fusion.expert.etoiles, 0, "l’ancienne ★★ ne vaut rien");
    assert.equal(fusion.melange.reussi, 2, "le mélange réussi sur le téléphone est gardé (le plus grand nombre de tables) ; la table de 5 ne le remet plus « à refaire »");
    assert.equal(fusion.melange.aJour, true, "« aJour » = l’un OU l’autre");
    assert.equal(fusion.melange.aRefaireAvec, null);
    assert.deepEqual(fusion.melange.tables, [2, 5, 10]);
    assert.equal(fusion.version, 3);
    assert.equal(fusion.rang, 2);
  });
  // Et si l'ancien appareil renvoie plus (un parcours avancé sous les vieilles
  // règles) : ses tables sont gardées, ses étoiles converties ; les 9 tables
  // ouvrent l'escalier (plus de mélange des 9 tables à réussir).
  const avance = {version: 1, tables: Object.fromEntries(P.TABLES.map(t => [t, {acquise: "2026-09-01"}])), melange: {aJour: true}, expert: {niveau: 3, champion: "2026-09-02"}};
  const fusion = P.fusionner(telephone, avance);
  assert.ok(P.toutesAcquises(fusion));
  assert.equal(fusion.expert.etoiles, 1);
  assert.equal(P.escalierOuvert(fusion), true);
  assert.equal(fusion.rang, 4, "9 tables passées : Platine");
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

test("l’accueil : « Mon mélange » libre, plus de cadenas sur « Je passe le test », l’escalier comme bloc principal dès 9 tables passées, le badge de rang, la ligne des jours", () => {
  assert.match(html, /titre: "Mon mélange"/);
  assert.match(html, /sousTitre: sousTitreMelange\(melange\),\s*points: \[\],\s*conseille: false,/, "la ligne du mélange dit ses tables et son format ; elle n’est jamais l’étape conseillée");
  assert.doesNotMatch(html, /Réussis d’abord ton mélange/);
  assert.match(html, /const NOM_DU_TEST = "Je passe le test";/);
  assert.match(html, /const CONDITION_DU_TEST = "si j’ai 9\\u00a0sur\\u00a010 juste\\u00a0avant";/);
  assert.match(html, /classe: "valide",\s*num: "3",\s*titre: ligne\.acquise \? "Ma table est passée" : NOM_DU_TEST,/);
  assert.match(html, /action: \(\) => launchFromParcours\(PARCOURS\.configValidation\(table\), "menu"\)/, "« Je passe le test » lance toujours le test");
  assert.doesNotMatch(html, /classe: "valide verrou"|cadenas\.textContent|ligneVerrou|verrouillee|etat\.verrou|montrerMelange|kind: "lock"/, "plus de cadenas ni de verrou dans la page : aucune ligne, aucune case n’est créée cadenassée");
  assert.match(html, /\.etape\.melange\.is-next \{ border-color: #e0a800/, "le mélange dû est surligné en jaune");
  assert.match(html, /<section id="acc-expert" class="expert"[^>]*hidden>[\s\S]*<div id="acc-escalier" class="escalier"/);
  assert.match(html, /const toutes = etat\.acquises\.length === PARCOURS_TABLES\.length;\s*zone\.hidden = !toutes;/, "le bloc de l’escalier apparaît dès les 9 tables passées");
  assert.match(html, /\$\("acc-expert-titre"\)\.textContent = "Toutes les tables, de plus en plus vite";/);
  assert.doesNotMatch(html, /Réussis le mélange de tes 9 tables/);
  assert.match(html, /titre: `Tente \$\{suivante\.symbole\}`/, "un seul bouton « Tente ★★★ »");
  assert.match(html, /"M’entraîner sur une table"/);
  assert.match(html, /"9 sur 9 passées "/);
  assert.match(html, /<small id="acc-acquises">0 table passée sur 9<\/small>/);
  assert.match(html, /<span id="acc-rang" class="rang"><\/span>/, "le badge de rang, sous « N tables passées sur 9 »");
  assert.ok(html.indexOf('id="acc-acquises"') < html.indexOf('id="acc-rang"'));
  assert.equal((html.match(/badgeRang\(/g) || []).length, 3, "le badge : l’accueil, la fête de rang, et sa définition — nulle part ailleurs");
  assert.match(html, /<div id="acc-jours" class="jours" hidden><\/div>/);
  assert.match(html, /cette semaine`/);
  // Lot R3 (12/09) : « case » parlait d'une grille que l'élève n'a pas forcément
  // ouverte. Lot mémoire : « N calculs demain », d'après les échéances.
  assert.match(html, /\$\{pluriel\(jours\.demain, "calcul"\)\} \$\{jours\.demain > 1 \? "reviennent" : "revient"\} demain/, "audit 1 : « 8 calculs reviennent demain »");
  assert.doesNotMatch(html, /à regagner demain/);
  assert.doesNotMatch(html.replace(/\/\/[^\n]*/g, ""), /jours de suite|d’affilée/, "pas de compteur d’affilée (décision du 08/09 : version b)");
  // Ce qui a disparu.
  const visible = html.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
  assert.doesNotMatch(visible, /Champion des tables/);
  assert.doesNotMatch(visible, /configExpert/);
  assert.doesNotMatch(visible, /valide toutes tes tables/);
  assert.doesNotMatch(visible, /25 produits/);
});

test("le parcours : « Mon mélange » en bouton (triangle dessiné) jusqu’aux 9 tables (ses trois trophées à droite, sans mot ni nombre), l’escalier à cinq marches avec leur durée, ouvert après mes 9 tables", () => {
  // Lot « Mon parcours » (décision 11) : « Mon mélange », ses tables dessous.
  // Lot « trophées » : « tables 2, 3 et 5 » jusqu'à 3 tables, puis « mes N tables ».
  assert.match(html, /title\.textContent = "Mon mélange";\s*const tables = document\.createElement\("small"\);[^;]*?\s*tables\.textContent = etat\.melange\.tables\.length <= 3 \? tablesDuMelange\(etat\.melange\.tables\) : `mes \$\{etat\.melange\.tables\.length\}\\u00a0tables`;/);
  assert.match(html, /label: "Mon mélange, mes tables passées \(20 questions en 1 min 30\)",/);
  assert.match(html, /texte: triangleJouer\(\),/, "la case du mélange est un bouton : un triangle dessiné, centré");
  assert.doesNotMatch(html, /createTextNode\("▶"\)/, "plus le caractère ▶, qui penchait à gauche");
  assert.match(html, /function triangleJouer\(\) \{\s*const svg = document\.createElementNS\("http:\/\/www\.w3\.org\/2000\/svg", "svg"\);\s*svg\.setAttribute\("class", "jouer"\);/);
  assert.doesNotMatch(html, /tables\.textContent = "après Mes calculs du jour"/, "lot « Mes calculs du jour d'abord » : plus grisé, il le lance d'abord");
  assert.match(html, /droite\.append\(textes, tropheesDuMelange\(etat\.melange\.trophees\)\);/, "à droite : les trois trophées");
  assert.doesNotMatch(html, /dernierMelange|réussi avec \$\{|Dernier : \$\{melange\.score\}/, "plus de « Dernier : 17 sur 20 » ni de « réussi avec N tables ✓ »");
  assert.match(html, /expertTitle\.textContent = "Je deviens expert : toutes les tables, de plus en plus vite";/);
  assert.match(html, /etat\.expert\.marches\.forEach\(marche => \{/);
  assert.match(html, /const expertOuvert = etat\.expert\.ouvert;/);
  // Lot « après l'audit GPT » (D5) : seule la marche suivante se lance (et la
  // couronne gagnée, l'entretien de la Légende) ; fermé, rien ne se lance.
  assert.match(html, /const jouable = expertOuvert && \(marche\.suivante \|\| \(marche\.gagnee && marche\.etoile === PARCOURS\.ETOILES_MAX\)\);/, "la marche suivante, ou la couronne gagnée");
  assert.match(html, /config: jouable \? marche\.config : null/, "fermé ou pas la suivante : les marches ne lancent rien");
  assert.match(html, /action: jouable \? null : \(\) => \{\}/);
  assert.match(html, /marche\.gagnee \? "" : jouable \? "" : " — plus tard"/, "les marches plus loin : « plus tard »");
  assert.match(html, /const expertAttend = "après mes 9 tables";/, "lot « Mes calculs du jour d'abord » : l'escalier n'attend plus Mes calculs du jour");
  assert.doesNotMatch(html, /après le mélange des 9 tables/);
  assert.doesNotMatch(html, /\.cell\.is-lock|\.etape\.verrou|est-montree/, "lot « retours de classe » : le CSS du cadenas, qui ne servait plus, est retiré");
  assert.match(html, /\.cell\.is-star\.n4 \{/);
});

test("le résultat et les fêtes : 🎉 table passée et mélange, 🌟 étoile, un écran de rang, 👑 au sommet — sobres, sans son ; un mélange jamais exigé", () => {
  // Lot R2 : la fête est le cadre du verdict, en plus grand.
  assert.match(html, /verdict\.titre = `Table de \$\{validation\.table\} passée !`;/);
  assert.match(html, /verdict\.titre = melange\.tables\.length === PARCOURS_TABLES\.length \? "Mélange des 9 tables réussi !" : "Mélange réussi !";/, "l’événement n’a plus « escalierOuvert » : le titre compte les tables");
  assert.match(html, /verdict\.icone = "🌟";\s*verdict\.titre = `\$\{PARCOURS\.symboleEtoile\(etoile\.etoile\)\} obtenue !`;/);
  assert.match(html, /verdict\.icone = "👑";\s*verdict\.titre = "Légende des tables !";/);
  assert.match(html, /rang\.append\(document\.createTextNode\("Tu passes "\), badgeRang\(PARCOURS\.rang\(verdict\.rang\)\)\);/);
  assert.match(html, /animation: none !important/, "prefers-reduced-motion");
  assert.doesNotMatch(html, /new Audio\(|AudioContext/, "sans son");
  assert.doesNotMatch(html, /Réussis d’abord ton mélange|reviens valider ta table/, "plus de validation verrouillée");
  assert.match(html, /if \(trouve\("toutes-acquises"\)\) return "Tes 9 tables sont passées : l’escalier des étoiles est ouvert !";/, "c’est la neuvième table qui ouvre l’escalier");
  assert.match(html, /if \(fete\.melange\) return fete\.melange\.trophee \? `Tu gagnes la coupe des \$\{fete\.melange\.trophee\} tables\\u00a0!` : "";/, "le mélange réussi n’ouvre rien : il rapporte une coupe, ou le verdict suffit");
  // Lot « Mon mélange sur l'accueil et l'expert » : plus de bouton « Je me
  // teste sur mes N tables » après une table passée — Mon mélange est sur l'accueil.
  assert.doesNotMatch(html, /Je me teste sur mes|boutonMelange\(\)/);
  assert.match(html, /verdict\.titre = "Nouveau rang !";/, "un rang gagné sans autre nouvelle a sa fête à lui");
});

test("le lancement : le mélange se joue en 1 min 30, comme la validation d’une table", () => {
  // 09/09 : l'écran de lancement ne propose plus de durée du tout — le
  // mélange et la validation partent sur celle du moteur.
  assert.doesNotMatch(html, /const validationTable = /);
  assert.doesNotMatch(html, /launch-durations/);
  assert.equal(P.SEUILS.melange.dureeMax, 90);
  assert.equal(P.SEUILS.validation.dureeMax, 90);
  // Lot « Mon parcours » : « 20 questions » et « 1 min 30 » ne se coupent plus.
  assert.match(html, /return `Mon mélange · \$\{lesquelles\} · \$\{insecable\("20 questions"\)\} · \$\{dureeLancement\(config\.duration\)\}`;/);
});

test("les scripts modifiés ont un nouveau numéro de cache, et la copie serveur du moteur est identique", async () => {
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/);
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261029-2/);
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
