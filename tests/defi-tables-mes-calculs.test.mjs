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

function repondre(etat, cle, correcte, date = DATE) {
  return parcours.appliquerReponse(etat, cle, {correcte, date}).parcours;
}

function acquerir(etat, table) {
  return parcours.appliquerSerie(etat, normaliser(parcours.configValidation(table)), {correct: 20, total: 20, date: DATE}).parcours;
}

// Lot « un seul système, les boîtes » (05/10/2026) : Mes calculs du jour ne
// prend que les calculs des tables PASSÉES AVANT le jour. Les parcours de ces
// tests reçoivent donc les tables concernées, passées à une date antérieure.
function copie(etat) {
  return JSON.parse(JSON.stringify(etat));
}

function avecTablesPassees(etat, tables, date = "2026-08-31") {
  const suite = copie(etat);
  tables.forEach(table => { suite.tables[table].acquise = date; });
  return suite;
}

test("la grille compte 36 faits, de 2×2 à 9×9, sens confondus", () => {
  assert.equal(parcours.FAITS.length, 36);
  assert.equal(parcours.FAITS[0], "2-2");
  assert.equal(parcours.FAITS.at(-1), "9-9");
  assert.equal(parcours.cleFait("8-7"), "7-8", "8×7 et 7×8 sont le même fait");
  assert.equal(parcours.cleFait("7-8"), "7-8");
  assert.equal(parcours.cleFait("1-7"), null, "la table de 1 est hors grille");
  assert.equal(parcours.cleFait("7-10"), null, "la table de 10 est hors grille");
  assert.equal(parcours.cleFait("n'importe quoi"), null);
  assert.equal(parcours.libelleFait("7-8"), "7 × 8");
  assert.deepEqual(parcours.faitsDeLaTable(9), ["2-9", "3-9", "4-9", "5-9", "6-9", "7-9", "8-9", "9-9"]);
  assert.equal(parcours.faitsDeLaTable(7).length, 8);
  assert.equal(parcours.creerParcours().calculs && Object.keys(parcours.creerParcours().calculs).length, 0);
});

test("cinq boîtes par fait (lot mémoire) : monte quand dû et réussi, −1 par erreur, échéances 0 · 1 · 3 · 7 · 14 jours", () => {
  let etat = parcours.creerParcours();
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "jamais-vu");

  // Jamais vu + réussi : boîte 2 (en route), retour demain.
  etat = repondre(etat, "6-7", true);
  assert.deepEqual(etat.calculs["6-7"], {boite: 2, cases: 1, vu: DATE, erreur: null, gagne: DATE, echeance: "2026-09-02"});
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "en-cours");

  etat = repondre(etat, "6-7", true);
  etat = repondre(etat, "7-6", true);
  assert.equal(etat.calculs["6-7"].boite, 2, "pas dû : une bonne réponse ne change rien, même dans l’autre sens");

  etat = repondre(etat, "7-6", true, "2026-09-02");
  assert.deepEqual([etat.calculs["6-7"].boite, etat.calculs["6-7"].echeance], [3, "2026-09-05"], "dû et réussi : boîte 3, retour dans 3 jours (les deux sens alimentent la même boîte)");
  etat = repondre(etat, "6-7", true, "2026-09-03");
  assert.equal(etat.calculs["6-7"].boite, 3, "le 3 : pas encore dû, rien ne bouge");
  etat = repondre(etat, "6-7", true, "2026-09-05");
  assert.deepEqual([etat.calculs["6-7"].boite, etat.calculs["6-7"].echeance], [4, "2026-09-12"], "boîte 4 = su, retour dans 7 jours");
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "su");
  etat = repondre(etat, "6-7", true, "2026-09-20");
  assert.deepEqual([etat.calculs["6-7"].boite, etat.calculs["6-7"].echeance], [5, "2026-10-04"], "en retard de 8 jours, c’est toujours dû : boîte 5, retour dans 14 jours");
  etat = repondre(etat, "6-7", true, "2026-10-04");
  assert.deepEqual([etat.calculs["6-7"].boite, etat.calculs["6-7"].echeance, etat.calculs["6-7"].cases], [5, "2026-10-18", 3], "la boîte 5 est renouvelée à chaque réussite : l’entretien ; le miroir « cases » plafonne à 3");

  // Une erreur : une boîte de moins, dû aujourd’hui — jamais de retour direct en boîte 1.
  etat = repondre(etat, "6-7", false, "2026-10-05");
  assert.deepEqual(etat.calculs["6-7"], {boite: 4, cases: 3, vu: "2026-10-05", erreur: "2026-10-05", gagne: "2026-10-04", echeance: "2026-10-05"}, "un fait en boîte 5 qui reçoit une erreur descend en 4, échéance ramenée au jour même");
  assert.equal(parcours.faitDu(etat.calculs["6-7"], "2026-10-05"), false, "raté aujourd’hui : plus « dû » aujourd’hui (il est revenu en fin de série, il ne peut pas monter)");
  assert.equal(parcours.faitDu(etat.calculs["6-7"], "2026-10-06"), true, "dû demain");

  // Lot « une descente par jour » (22/10/2026) : d'autres erreurs le même
  // jour ne font plus descendre (avant : « sans limite par jour »).
  etat = repondre(etat, "6-7", false, "2026-10-05");
  etat = repondre(etat, "6-7", false, "2026-10-05");
  etat = repondre(etat, "6-7", false, "2026-10-05");
  assert.deepEqual(etat.calculs["6-7"], {boite: 4, cases: 3, vu: "2026-10-05", erreur: "2026-10-05", gagne: "2026-10-04", echeance: "2026-10-05"}, "au plus une boîte de moins par jour : trois erreurs de plus le même jour, il reste en boîte 4, toujours dû demain");
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "su");

  etat = repondre(etat, "6-7", true, "2026-10-05");
  assert.equal(etat.calculs["6-7"].boite, 4, "pas de regain le jour d’une erreur sur ce calcul : il « revient dans un nouveau défi », c’est-à-dire un autre jour");
  etat = repondre(etat, "6-7", false, "2026-10-06");
  assert.equal(etat.calculs["6-7"].boite, 3, "le lendemain, une erreur fait de nouveau descendre d’une boîte");
  etat = repondre(etat, "6-7", true, "2026-10-07");
  assert.equal(etat.calculs["6-7"].boite, 4, "et le surlendemain, la première réussite fait remonter d’une boîte");
  assert.equal(repondre(etat, "6-7", true, "2026-10-07").calculs["6-7"].boite, 4, "mais une seule fois : il n’est plus dû");
  // Jamais sous la boîte 1.
  let bas = repondre(parcours.creerParcours(), "3-4", false, "2026-10-05");
  bas = repondre(bas, "3-4", false, "2026-10-06");
  assert.equal(bas.calculs["3-4"].boite, 1, "un calcul jamais vu part de la boîte 1 et n’en descend pas");

  const premiereErreur = repondre(parcours.creerParcours(), "3-9", false);
  assert.equal(parcours.etatFait(premiereErreur.calculs["3-9"]), "a-travailler", "une erreur au premier essai suffit");
  assert.equal(premiereErreur.calculs["3-9"].echeance, DATE);

  const horsGrille = parcours.appliquerReponse(parcours.creerParcours(), "7-10", {correcte: true, date: DATE});
  assert.equal(horsGrille.fait, null);
  assert.deepEqual(horsGrille.parcours.calculs, {}, "un calcul hors grille ne laisse aucune trace");

  // Ce que la réponse rapporte à la page : monte / descend / dû.
  const monte = parcours.appliquerReponse(parcours.creerParcours(), "2-2", {correcte: true, date: DATE}).fait;
  assert.deepEqual(monte, {cle: "2-2", boite: 2, etat: "en-cours", du: true, monte: true, descend: false, echeance: "2026-09-02"});
  assert.deepEqual(parcours.SEUILS.revision.delais, [0, 1, 3, 7, 14]);
  assert.equal(parcours.SEUILS.revision.boites, 5);
});

test("la grille appartient au parcours : entraînements, validations, mélanges, Expert et révisions seulement", () => {
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configApprends(7, "construct"))), false);
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configApprends(7, "gaps"))), false);
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configApprends(7, "ordered"))), false, "dans l’ordre = on ajoute, on ne se souvient pas");
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configApprends(7, "random"))), false, "J’apprends n’alimente jamais la grille");
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configEntraine(7, "trous"))), true);
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configValidation(7))), true);
  assert.equal(parcours.serieAlimenteGrille(normaliser(parcours.configEtoile(3))), true);
  assert.equal(parcours.serieAlimenteGrille(normaliser({mode: "validation", tables: [2, 10], total: 20, duration: 90})), true, "le mélange aussi");
  assert.equal(parcours.serieAlimenteGrille(normaliser({mode: "custom", tables: [7]})), false, "Réglages est à part du parcours");
  assert.equal(parcours.serieAlimenteGrille(normaliser({mode: "evaluation"})), false, "l’évaluation CM1 est à part du parcours");
  assert.equal(parcours.serieAlimenteGrille(parcours.configRevision()), true);
  assert.equal(parcours.serieAlimenteGrille(normaliser({})), false);
});

test("le résumé et la grille 8×8 : moitié active, miroir grisé du même fait", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "6-7", false);
  etat = repondre(etat, "2-2", true);
  etat = repondre(etat, "2-3", true, "2026-09-01");
  etat = repondre(etat, "2-3", true, "2026-09-02");
  etat = repondre(etat, "2-3", true, "2026-09-05");

  const resume = parcours.resumeCalculs(etat, "2026-09-03");
  assert.deepEqual(resume, {sus: 1, enCours: 1, aTravailler: 1, jamaisVus: 33, dus: 2, total: 36, boites: [1, 1, 0, 1, 0]},
    "par couleur, par boîte, et les dus : 6-7 (raté le 1er) et 2-2 (retour le 2) sont dus le 3 ; 2-3 (boîte 4) revient le 12");

  const grille = parcours.grilleCalculs(etat, "2026-09-03");
  assert.equal(grille.lignes.length, 8);
  assert.deepEqual(grille.resume, resume);
  const ligne6 = grille.lignes.find(ligne => ligne.ligne === 6);
  const cellule67 = ligne6.cellules.find(cellule => cellule.colonne === 7);
  assert.equal(cellule67.active, true);
  assert.equal(cellule67.etat, "a-travailler");
  assert.deepEqual([cellule67.boite, cellule67.du, cellule67.echeance], [1, true, DATE]);
  const ligne7 = grille.lignes.find(ligne => ligne.ligne === 7);
  const miroir76 = ligne7.cellules.find(cellule => cellule.colonne === 6);
  assert.equal(miroir76.active, false, "7×6 est le miroir grisé");
  assert.equal(miroir76.cle, "6-7");
  assert.equal(miroir76.etat, "a-travailler", "le miroir montre l’état du même fait");
});

test("la révision = les calculs dus aujourd’hui des tables passées, boîtes à tour de rôle (les plus en retard d’abord dans chaque boîte), verts compris, ordre de passage mélangé — jamais un calcul jamais vu ; sans table passée, rien", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "6-7", false, "2026-09-01");
  etat = repondre(etat, "7-8", false, "2026-09-03");
  etat = repondre(etat, "3-9", false, "2026-09-02");
  etat = repondre(etat, "2-5", true, "2026-09-01");   // boîte 2, retour le 2
  etat = repondre(etat, "4-4", true, "2026-09-02");   // boîte 2, retour le 3
  etat = repondre(etat, "4-4", true, "2026-09-03");   // boîte 3, retour le 6
  etat = repondre(etat, "8-8", true, "2026-09-01");   // boîte 2, retour le 2
  etat = repondre(etat, "8-8", true, "2026-09-02");   // boîte 3, retour le 5
  etat = repondre(etat, "8-8", true, "2026-09-05");   // boîte 4 (su), retour le 12

  assert.deepEqual(parcours.calculsATravailler(etat), ["7-8", "3-9", "6-7"], "les rouges, raté le plus récemment d’abord");
  assert.deepEqual(parcours.calculsATravailler(etat, 7), ["7-8", "6-7"]);

  // Tour de rôle : un rouge (le plus en retard : 6-7, raté le 1er), un boîte 2, puis les rouges suivants…
  assert.deepEqual(parcours.calculsDus(etat, {aujourdhui: "2026-09-04"}), ["6-7", "2-5", "3-9", "7-8"], "le 4 : les trois rouges et 2-5 (dû depuis le 2), boîtes à tour de rôle ; 4-4 revient le 6, 8-8 le 12");
  assert.deepEqual(parcours.calculsDus(etat, {aujourdhui: "2026-09-12"}), ["6-7", "2-5", "4-4", "8-8", "3-9", "7-8"], "le 12 : tout est dû — un rouge, un bleu (boîte 2), un boîte 3, le vert (c’est l’entretien), puis les rouges restants");
  assert.deepEqual(parcours.calculsDus(etat, {aujourdhui: "2026-09-03"}), ["6-7", "2-5", "3-9"], "le 3 : 7-8 vient d’être raté aujourd’hui, il n’est plus dû aujourd’hui (retour demain) ; 4-4 vient de monter aujourd’hui, il revient le 6");

  // La nouvelle règle : aucune table passée, Mes calculs du jour ne prend rien
  // (ces calculs dus restent aux marches de leur table).
  assert.deepEqual(parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-12"}), [], "sans table passée : six calculs dus, aucune question");
  assert.deepEqual(parcours.dusDuJour(etat, "2026-09-12"), []);
  assert.equal(parcours.mesCalculsAFaire(etat, "2026-09-12"), false, "et aucune porte");
  // Une table passée le jour même n'entre que le lendemain.
  const ceJour = avecTablesPassees(etat, [7], "2026-09-12");
  assert.equal(parcours.calculDesTablesPassees(ceJour, "6-7", "2026-09-12"), false);
  assert.deepEqual(parcours.dusDuJour(ceJour, "2026-09-12"), [], "table de 7 passée le 12 : rien le 12");
  assert.deepEqual(parcours.dusDuJour(ceJour, "2026-09-13").sort(), ["6-7", "7-8"], "le 13 : ses deux calculs dus, et eux seuls");
  assert.equal(parcours.prisParMesCalculs(ceJour, "7-8", "2026-09-13"), true);
  assert.equal(parcours.prisParMesCalculs(ceJour, "3-9", "2026-09-13"), false, "3 × 9 : ni la table de 3 ni celle de 9 n’est passée");

  // Les tables de 2, 3, 4, 7 et 8 passées le 31 août : les six calculs sont pris.
  const passe = avecTablesPassees(etat, [2, 3, 4, 7, 8]);
  assert.deepEqual(parcours.dusDuJour(passe, "2026-09-12").sort(), parcours.calculsDus(passe, {aujourdhui: "2026-09-12"}).sort());
  const plan = parcours.planRevision(passe, {random: () => 0, aujourdhui: "2026-09-12"});
  assert.equal(plan.length, 6, "six calculs dus : six questions, pas une de plus");
  assert.deepEqual(plan.map(item => item.cle).sort(), ["2-5", "3-9", "4-4", "6-7", "7-8", "8-8"], "les six, dans un ordre de passage mélangé");
  assert.ok(plan.every(item => etat.calculs[item.cle]), "aucun calcul jamais vu");
  assert.equal(new Set(plan.map(item => item.cle)).size, 6, "jamais deux fois le même fait");
  // Le 6 : cinq dus ; 8-8 (retour le 12) n'est pas dû. La première série du
  // jour le prend en complément (un calcul d'une table passée, vu avant
  // aujourd'hui) ; une fois Mes calculs du jour joué, il n'y est plus.
  assert.deepEqual(parcours.serieDuJour(passe, {aujourdhui: "2026-09-06"}), {cles: [...parcours.dusDuJour(passe, "2026-09-06"), "8-8"], dus: 5, complement: 1, restants: 0, faite: false});
  assert.deepEqual(parcours.dusDuJour(passe, "2026-09-06").sort(), ["2-5", "3-9", "4-4", "6-7", "7-8"]);
  assert.deepEqual(parcours.planRevision(passe, {random: () => 0, aujourdhui: "2026-09-06"}).map(item => item.cle).sort(), ["2-5", "3-9", "4-4", "6-7", "7-8", "8-8"], "le 6, la première série : les cinq dus, complétés par 8-8");
  const joue = {...passe, calculsDuJour: "2026-09-06"};
  assert.deepEqual(parcours.planRevision(joue, {random: () => 0, aujourdhui: "2026-09-06"}).map(item => item.cle).sort(), ["2-5", "3-9", "4-4", "6-7", "7-8"], "le 6, déjà joué : les dus seulement — 8-8 (retour le 12) n’y est pas");
  assert.equal(parcours.serieDuJour(joue, {aujourdhui: "2026-09-06"}).faite, true);
  assert.deepEqual([parcours.dureeMesCalculs(10), parcours.dureeMesCalculs(6), parcours.dureeMesCalculs(3)], [60, 36, 30], "6 secondes par calcul, 30 secondes au moins");
  // Trente calculs dus, répartis : chaque série de dix mêle les boîtes.
  let charge = parcours.creerParcours();
  parcours.FAITS.slice(0, 30).forEach((cle, index) => {
    charge.calculs[cle] = {boite: 1 + (index % 4), vu: "2026-09-01", erreur: index % 4 ? null : "2026-09-01", gagne: "2026-09-01", echeance: `2026-09-0${1 + (index % 5)}`};
  });
  charge = parcours.normaliserParcours(charge);
  const dus = parcours.calculsDus(charge, {aujourdhui: "2026-09-12"});
  const compo = liste => [1, 2, 3, 4].map(boite => liste.filter(cle => charge.calculs[cle].boite === boite).length);
  assert.deepEqual(compo(dus.slice(0, 10)), [3, 3, 2, 2], "série 1 : trois rouges, trois bleus, deux, deux — pas dix rouges d’affilée");
  assert.deepEqual(compo(dus.slice(10, 20)), [2, 2, 3, 3]);
  assert.deepEqual(compo(dus.slice(20, 30)), [3, 3, 2, 2]);
  assert.equal(new Set(dus).size, 30, "tout est couvert, une fois");
  // « Encore 10 calculs » : plus rien de dû, les prochains à revenir, rien de dû dedans.
  const libre = parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-01", libre: true});
  assert.deepEqual(libre.map(item => item.cle).sort(), ["2-5", "3-9", "4-4", "6-7", "7-8", "8-8"], "le 1er au soir, rien n’est dû : les six calculs connus, qui reviennent tous plus tard (6-7, raté ce jour-là, revient demain)");
  assert.ok(libre.every(item => !parcours.faitDu(etat.calculs[item.cle], "2026-09-01")));
  assert.deepEqual(parcours.calculsAVenir(etat, {aujourdhui: "2026-09-12"}), [], "le 12, tout est dû : rien « à venir »");

  const questions = plan.map(item => core.tableQuestion(item.type, item.first, item.second));
  questions.forEach((question, index) => {
    assert.equal(parcours.cleFait(question.factKey), plan[index].cle, "chaque question porte bien sur son fait");
  });
  // La forme suit ce qu'il a rencontré. Dans Mes calculs du jour, chaque
  // calcul a une table passée (le test contient nombres manquants et
  // divisions) : les trois formes y sont. La règle « que des produits » se lit
  // donc sur la révision d'UNE table, qui ne demande pas de table passée.
  assert.ok(questions.some(question => question.category !== "direct"), "tables passées : pas que des produits");
  const planTable7 = parcours.planRevision(etat, {table: 7, random: () => 0, aujourdhui: "2026-09-12"});
  assert.deepEqual(planTable7.map(item => item.cle).sort(), ["6-7", "7-8"]);
  assert.ok(planTable7.every(item => item.type === "direct"), "aucune table n’a passé l’entraînement « trous » ni n’est passée : que des produits (la forme suit ce qu’il a rencontré)");
  // La table de 4 a réussi l'entraînement « trous » (nombres manquants et
  // divisions, lot « divisions ») : sur la révision de la table de 7, 4-7 peut
  // arriver en trou ou en division, les autres non.
  const avecTrous = copie(etat);
  avecTrous.tables[4].entraine.trous = 2;
  ["2-7", "3-7", "4-7"].forEach(cle => {
    avecTrous.calculs[cle] = {boite: 2, cases: 1, vu: "2026-09-01", erreur: null, gagne: "2026-09-01", echeance: "2026-09-02"};
  });
  assert.deepEqual(parcours.formesPermises(avecTrous, "4-4"), ["direct", "missing", "division"]);
  assert.deepEqual(parcours.formesPermises(avecTrous, "4-7"), ["direct", "missing", "division"]);
  assert.deepEqual(parcours.formesPermises(avecTrous, "7-8"), ["direct"]);
  const plans = Array.from({length: 20}, (_, graine) => parcours.planRevision(avecTrous, {table: 7, random: () => (graine % 7) / 7, aujourdhui: "2026-09-12"}));
  const formes = plans.flat();
  assert.ok(plans.every(plan7 => plan7.length === 5), "les cinq calculs dus de la table de 7");
  assert.ok(formes.every(item => item.cle === "4-7" || item.type === "direct"), "seul 4-7 peut être posé en trou");
  assert.ok(formes.some(item => item.cle === "4-7" && item.type !== "direct"), "et il l’est parfois");
  assert.ok(formes.some(item => item.cle === "4-7" && item.type.startsWith("division")), "ni trou ni division sans l'entraînement : 4-7 seulement, et parfois en division");
  // Lot « trois divisions » (09/10/2026) : les trois écritures, plus seulement 28 ÷ 4 = ?.
  // (le tirage « tout au même nombre » de ce test ne les montre pas toutes : la
  // répartition se mesure dans tests/defi-tables-trois-divisions.test.mjs).
  const divisions = formes.filter(item => item.type.startsWith("division"));
  assert.ok(divisions.every(item => ["division-quotient", "division-dividend", "division-divisor"].includes(item.type)));
  assert.ok(divisions.some(item => item.type !== "division-quotient"), "plus seulement 28 ÷ 4 = ? : aussi ? ÷ 4 = 7 ou 28 ÷ ? = 7");
  // Une table passée ouvre les trous et les divisions (le test en contient).
  const acquise = acquerir(JSON.parse(JSON.stringify(etat)), 7);
  assert.deepEqual(parcours.formesPermises(acquise, "7-8"), ["direct", "missing", "division"]);
  // Une question sur deux reste un résultat ; l'autre alterne nombre manquant et division.
  const tout = JSON.parse(JSON.stringify(etat));
  [2, 3, 4, 5, 6, 7, 8, 9].forEach(table => { tout.tables[table].acquise = "2026-09-01"; });
  const plan8 = parcours.planRevision(tout, {random: () => 0, aujourdhui: "2026-09-12"});
  const categorie = type => type === "direct" ? "direct" : type.startsWith("division") ? "division" : "missing";
  assert.deepEqual(plan8.map(item => categorie(item.type)), ["direct", "missing", "direct", "division", "direct", "missing"], "la part des questions « à l'envers » ne change pas");
  // Sans entraînement ni table acquise, une étoile ouvre encore les divisions (Expert).
  const etoile = JSON.parse(JSON.stringify(etat)); etoile.expert.etoiles = 1;
  assert.deepEqual(parcours.formesPermises(etoile, "7-8"), ["direct", "division"]);
});

test("l’agenda : dus aujourd’hui, ce qui attendra demain, le prochain retour ; les calculs en retard — ceux des tables passées avant le jour, eux seuls", () => {
  // La table de 5 est passée depuis le 31 août : ses calculs sont ceux de Mes calculs du jour.
  let etat = avecTablesPassees(parcours.creerParcours(), [5]);
  etat = repondre(etat, "2-5", true, "2026-09-01");   // retour le 2
  etat = repondre(etat, "3-5", true, "2026-09-01");   // retour le 2
  etat = repondre(etat, "4-5", true, "2026-09-01");
  etat = repondre(etat, "4-5", true, "2026-09-02");   // boîte 3, retour le 5
  // Les mêmes réponses sans table passée : rien pour Mes calculs du jour.
  const sansTable = copie(etat);
  sansTable.tables[5].acquise = null;
  assert.deepEqual(parcours.agendaCalculs(sansTable, "2026-09-03"), {dus: 0, demain: 0, prochain: null}, "sans table passée : rien de dû, rien demain, aucun retour annoncé");
  assert.deepEqual(parcours.calculsEnRetard(sansTable, "2026-09-07"), [], "ni rien en retard pour la page du professeur");
  // Table passée le 3 : rien le 3 (la porte ne se referme pas en pleine journée), ses calculs dès le 4.
  const passeeLe3 = avecTablesPassees(sansTable, [5], "2026-09-03");
  assert.deepEqual(parcours.agendaCalculs(passeeLe3, "2026-09-03"), {dus: 0, demain: 2, prochain: {jour: "2026-09-04", dans: 1, calculs: 2}}, "une table passée aujourd’hui entre dans Mes calculs du jour demain");
  assert.deepEqual(parcours.agendaCalculs(etat, "2026-09-01"), {dus: 0, demain: 2, prochain: {jour: "2026-09-02", dans: 1, calculs: 2}});
  assert.deepEqual(parcours.agendaCalculs(etat, "2026-09-03"), {dus: 2, demain: 2, prochain: {jour: "2026-09-04", dans: 1, calculs: 2}}, "les dus restés dus comptent pour demain");
  etat = repondre(etat, "2-5", true, "2026-09-03");   // boîte 3, retour le 6
  etat = repondre(etat, "3-5", false, "2026-09-03");  // boîte 1, dû… demain (raté aujourd’hui)
  assert.deepEqual(parcours.agendaCalculs(etat, "2026-09-03"), {dus: 0, demain: 1, prochain: {jour: "2026-09-04", dans: 1, calculs: 1}}, "un calcul raté aujourd’hui attend demain");
  assert.deepEqual(parcours.agendaCalculs(repondre(avecTablesPassees(parcours.creerParcours(), [9]), "9-9", true, "2026-09-01"), "2026-09-01").prochain, {jour: "2026-09-02", dans: 1, calculs: 1});
  assert.equal(parcours.agendaCalculs(repondre(parcours.creerParcours(), "9-9", true, "2026-09-01"), "2026-09-01").prochain, null, "table de 9 pas passée : aucun retour annoncé");
  const loin = parcours.normaliserParcours({tables: {9: {acquise: "2026-08-31"}}, calculs: {"9-9": {boite: 4, vu: "2026-09-01", erreur: null, gagne: "2026-09-01", echeance: "2026-09-08"}}});
  assert.deepEqual(parcours.agendaCalculs(loin, "2026-09-05"), {dus: 0, demain: 0, prochain: {jour: "2026-09-08", dans: 3, calculs: 1}}, "« Reviens dans 3 jours : 1 calcul t’attendra »");
  assert.deepEqual(parcours.agendaCalculs(parcours.creerParcours(), "2026-09-05"), {dus: 0, demain: 0, prochain: null});

  assert.deepEqual(parcours.calculsEnRetard(etat, "2026-09-03"), [], "rien en retard le 3 : 2-5 refait, 3-5 raté aujourd’hui, 4-5 revient le 5");
  assert.deepEqual(parcours.calculsEnRetard(etat, "2026-09-07").sort(), ["2-5", "3-5", "4-5"], "le 7, sans rien avoir refait : les trois sont en retard (dus avant aujourd’hui)");
  assert.deepEqual(parcours.calculsEnRetard(etat, "2026-09-05"), ["3-5"], "le 5 : 4-5 est dû aujourd’hui, pas en retard ; 3-5 l’est depuis le 4");
  assert.deepEqual(parcours.bilanJours(etat, "2026-09-03"), {semaine: 3, dus: 0, demain: 1, aujourdhui: true});
  assert.deepEqual(parcours.calculsDeLaBoite(etat, 3), ["2-5", "4-5"]);
  assert.deepEqual(parcours.calculsDeLaBoite(etat, 1), ["3-5"]);
  assert.deepEqual(parcours.calculsDeLaBoite(etat, 5), []);
});

test("la révision ne propose jamais un calcul jamais vu, même sur une table passée ; une grille vide ne donne rien ; rien de dû : la première série du jour se complète, puis plus rien", () => {
  assert.deepEqual(parcours.planRevision(parcours.creerParcours()), [], "grille vide : aucune question");
  let etat = acquerir(acquerir(parcours.creerParcours(), 2), 7);
  // tables 2 et 7 passées le 1er ; 6-7 su (boîte 4, retour le 12) ; tout le reste jamais vu
  etat = repondre(etat, "6-7", true, "2026-09-01");
  etat = repondre(etat, "6-7", true, "2026-09-02");
  etat = repondre(etat, "6-7", true, "2026-09-05");
  const plan = parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-12"});
  assert.deepEqual(plan.map(item => item.cle), ["6-7"], "seul le calcul vu (su, en entretien) ; les faits jamais vus des tables 2 et 7 restent hors révision");
  // Le 8, rien n'est dû. La première série du jour (la porte) se complète avec
  // les calculs des tables passées vus avant aujourd'hui — ici 6-7, et lui
  // seul : jamais un calcul jamais vu. Il n'est pas dû, il ne monte pas.
  assert.deepEqual(parcours.serieDuJour(etat, {aujourdhui: "2026-09-08"}), {cles: ["6-7"], dus: 0, complement: 1, restants: 0, faite: false});
  assert.deepEqual(parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-08"}).map(item => item.cle), ["6-7"], "le 8, la première série : 6-7 en complément");
  const rejoue = parcours.appliquerReponse(etat, "6-7", {correcte: true, date: "2026-09-08"});
  assert.deepEqual([rejoue.fait.monte, rejoue.fait.boite], [false, 4], "pas dû : le réussir ne fait rien monter");
  assert.deepEqual(parcours.planRevision({...rejoue.parcours, calculsDuJour: "2026-09-08"}, {random: () => 0, aujourdhui: "2026-09-08"}), [], "le 8, une fois joué : rien n’est dû, aucune question");
  // Sans la table de 7 (ni celle de 6) passée, 6-7 n'est jamais pris.
  const sansLa7 = copie(etat);
  sansLa7.tables[7].acquise = null;
  assert.deepEqual(parcours.planRevision(sansLa7, {random: () => 0, aujourdhui: "2026-09-12"}), [], "6 × 7 dû, mais ni la table de 6 ni celle de 7 n’est passée : rien");
  assert.deepEqual(parcours.planRevision(etat, {table: 2, aujourdhui: "2026-09-12"}), [], "sur la table 2 : rien de vu, rien à réviser");
});

test("l’entretien : les sus reviennent tous les 14 jours, les plus en retard d’abord", () => {
  let etat = parcours.creerParcours();
  parcours.FAITS.forEach(cle => {
    etat.calculs[cle] = {boite: 5, vu: "2026-09-05", erreur: null, gagne: "2026-09-05", echeance: "2026-09-19"};
  });
  // Les 8 tables de la grille passées depuis l'été : tout est pris par Mes calculs du jour.
  [2, 3, 4, 5, 6, 7, 8, 9].forEach(table => { etat.tables[table].acquise = "2026-07-01"; });
  etat.calculs["6-7"] = {boite: 5, vu: "2026-08-01", erreur: null, gagne: "2026-08-01", echeance: "2026-08-15"};
  etat.calculs["2-9"] = {boite: 5, vu: "2026-08-15", erreur: null, gagne: "2026-08-15", echeance: "2026-08-29"};
  etat = parcours.normaliserParcours(etat);
  assert.deepEqual(parcours.dusDuJour(etat, "2026-09-10"), ["6-7", "2-9"], "le 10 : seuls les deux en retard sont dus");
  // La première série du jour : les deux dus d'abord, complétés jusqu'à dix
  // par les calculs vus depuis le plus longtemps ; une fois jouée, les dus seuls.
  const porte = parcours.serieDuJour(etat, {aujourdhui: "2026-09-10"});
  assert.deepEqual([porte.cles.length, porte.cles.slice(0, 2), porte.dus, porte.complement, porte.restants], [10, ["6-7", "2-9"], 2, 8, 0]);
  assert.equal(new Set(porte.cles).size, 10, "jamais deux fois le même");
  assert.deepEqual(parcours.planRevision({...etat, calculsDuJour: "2026-09-10"}, {random: () => 0, aujourdhui: "2026-09-10"}).map(item => item.cle).sort(), ["2-9", "6-7"], "le 10, déjà joué : les deux dus, sans complément");
  assert.deepEqual(parcours.calculsDus(etat, {aujourdhui: "2026-09-19"}).slice(0, 2), ["6-7", "2-9"], "le plus ancien d’abord");
  const plan = parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-19"});
  assert.equal(plan.length, 10, "le 19, tout est dû : 10 à la fois");
  assert.ok(["6-7", "2-9"].every(cle => plan.some(item => item.cle === cle)), "les deux plus en retard sont dans la première série");
  assert.equal(parcours.calculsDus(etat, {aujourdhui: "2026-09-19"}).length, 36, "et il en reste 26 pour les séries suivantes (« Encore N »)");
  assert.equal(parcours.serieDuJour(etat, {aujourdhui: "2026-09-19"}).restants, 26);
});

// Un parcours au sommet de l'escalier : les 9 tables passées (plus de mélange
// à réussir, lot « un seul système »), puis une marche.
function legende(etoile = 1) {
  let etat = parcours.creerParcours();
  parcours.TABLES.forEach(table => {
    etat = parcours.appliquerSerie(etat, normaliser(parcours.configValidation(table)), {correct: 20, total: 20, date: DATE}).parcours;
  });
  assert.equal(etat.melange.dernier, null, "le mélange n’a pas été joué : l’escalier est ouvert quand même");
  // D5 (lot « après l'audit GPT ») : marche par marche, pas de saut.
  for (let marche = 1; marche <= etoile; marche += 1) {
    etat = parcours.appliquerSerie(etat, normaliser(parcours.configEtoile(marche)), {correct: 25, total: 25, date: DATE}).parcours;
  }
  return etat;
}

test("les divisions n’apparaissent en révision qu’à partir de la première étoile", () => {
  assert.ok(!parcours.planRevision(parcours.creerParcours(), {random: () => 0}).some(item => item.type.startsWith("division")), "sans étoile, pas de division");
  let etat = legende(1);
  assert.equal(etat.expert.etoiles, 1);
  parcours.FAITS.slice(0, 10).forEach(cle => { etat = repondre(etat, cle, true, "2026-09-02"); });
  const plan = parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-03"});
  const questions = plan.map(item => core.tableQuestion(item.type, item.first, item.second));
  assert.ok(questions.some(question => question.category === "division"));
});

test("révision sur une table : les calculs vus de cette table, ratés d’abord, sans jamais en sortir", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "7-8", false);
  etat = repondre(etat, "6-7", true);
  etat = repondre(etat, "3-4", false);
  const plan = parcours.planRevision(etat, {table: 7, random: () => 0, aujourdhui: "2026-09-02"});
  assert.deepEqual(plan.map(item => item.cle).sort(), ["6-7", "7-8"]);
  assert.ok(plan.every(item => parcours.facteursFait(item.cle).includes(7)));
  // Dix calculs dus ou plus : dix questions, jamais deux fois le même.
  // (Sans table : Mes calculs du jour — il faut les tables de 2 et de 3 passées avant le 3.)
  let plein = avecTablesPassees(parcours.creerParcours(), [2, 3], "2026-09-01");
  parcours.FAITS.slice(0, 14).forEach(cle => { plein = repondre(plein, cle, cle.endsWith("5"), "2026-09-02"); });
  const sansTable = copie(plein);
  sansTable.tables[2].acquise = sansTable.tables[3].acquise = null;
  assert.deepEqual(parcours.planRevision(sansTable, {random: () => 0, aujourdhui: "2026-09-03"}), [], "sans table passée : 14 calculs dus, Mes calculs du jour n’en prend aucun");
  assert.equal(parcours.planRevision(sansTable, {table: 2, random: () => 0, aujourdhui: "2026-09-03"}).length, 8, "la révision d’une table, elle, ne demande pas que la table soit passée");
  const dix = parcours.planRevision(plein, {random: () => 0, aujourdhui: "2026-09-03"});
  assert.equal(dix.length, 10);
  assert.equal(new Set(dix.map(item => item.cle)).size, 10);
});

test("la prochaine étape : « Mes calculs du jour » dès qu’un calcul d’une table passée est dû, devant tout le reste — la porte de la journée ; plus jamais « mélange »", () => {
  // La table de 2 est passée depuis le 31 août.
  let etat = avecTablesPassees(parcours.creerParcours(), [2]);
  etat = repondre(etat, "2-6", true, "2026-09-01");
  assert.notEqual(parcours.prochaineEtape(etat, "2026-09-01").type, "revision", "rien de dû aujourd’hui : la table");
  assert.equal(parcours.mesCalculsAFaire(etat, "2026-09-01"), false, "ni porte : le calcul vient d’être vu");
  const etape = parcours.prochaineEtape(etat, "2026-09-02");
  assert.equal(etape.type, "revision");
  assert.equal(etape.dus, 1);
  assert.equal(etape.libelle, "Mes calculs du jour : 1 calcul");
  assert.deepEqual(etape.config, {mode: "revision", table: null});
  assert.equal(parcours.etatAffichage(etat, "2026-09-02").prochaine.type, "revision");
  // La porte : fermée tant que Mes calculs du jour n'est pas joué ce jour-là.
  assert.equal(parcours.mesCalculsAFaire(etat, "2026-09-02"), true);
  assert.equal(parcours.etatAffichage(etat, "2026-09-02").porte, true);
  assert.equal(parcours.mesCalculsAFaire({...etat, calculsDuJour: "2026-09-02"}, "2026-09-02"), false, "joué : tout s’ouvre, même s’il reste un calcul dû");
  // Sans table passée : le même calcul dû reste aux marches de sa table.
  const sansTable = copie(etat);
  sansTable.tables[2].acquise = null;
  assert.notEqual(parcours.prochaineEtape(sansTable, "2026-09-02").type, "revision", "sans table passée : jamais « Mes calculs du jour »");
  assert.equal(parcours.mesCalculsAFaire(sansTable, "2026-09-02"), false);
  // Le mélange n'est plus jamais une étape : deux tables passées aujourd'hui, la suite est la table de 5.
  let deux = acquerir(acquerir(parcours.creerParcours(), 2), 10);
  parcours.faitsDeLaTable(2).forEach(cle => { deux = repondre(deux, cle, true, "2026-09-01"); });
  assert.deepEqual([parcours.prochaineEtape(deux, "2026-09-01").type, parcours.prochaineEtape(deux, "2026-09-01").table], ["apprends", 5], "les calculs joués aujourd’hui ne sont pas dus le jour même, et le mélange (libre) n’est plus une étape : la table suivante");
  assert.equal(parcours.prochaineEtape(deux, "2026-09-02").type, "revision", "le lendemain, les 8 calculs de la table de 2 passent devant");
  assert.equal(parcours.prochaineEtape(deux, "2026-09-02").dus, 8);
  assert.equal(parcours.prochaineEtape(deux, "2026-09-02").libelle, "Mes calculs du jour : 8 calculs");
});

test("les étoiles valident par échantillon : le parcours ne dit « fini » que grille verte", () => {
  let etat = legende(5);
  assert.equal(etat.expert.couronne, DATE);
  let etape = parcours.prochaineEtape(etat);
  assert.equal(etape.type, "legende", "Légende avec une grille jamais remplie : la révision n’a rien à reprendre, c’est l’escalier qui fait rencontrer les calculs");
  assert.match(etape.libelle, /36 calculs que tu n’as jamais rencontrés : rejoue une marche/);
  assert.deepEqual(etape.config, parcours.configEtoile(5));

  etat = repondre(etat, "7-8", false, "2026-09-01");
  etat = repondre(etat, "6-9", true, "2026-09-01");
  etape = parcours.prochaineEtape(etat, "2026-09-01");
  assert.equal(etape.type, "legende", "des calculs vus mais pas sus, rien de dû aujourd’hui : ils reviendront d’eux-mêmes");
  assert.match(etape.libelle, /2 calculs à faire monter jusqu’au vert : ils reviendront dans Mes calculs du jour/);
  assert.equal(etape.config, null);
  assert.equal(parcours.prochaineEtape(etat, "2026-09-02").type, "revision", "le lendemain, ils sont dus : Mes calculs du jour");

  parcours.FAITS.forEach(cle => {
    etat = repondre(etat, cle, true, "2026-09-02");
    etat = repondre(etat, cle, true, "2026-09-03");
    etat = repondre(etat, cle, true, "2026-09-06");
  });
  // Le 7, tout est vert et rien n'est dû — mais la porte du jour existe
  // toujours (lot « un seul système ») : dix calculs des tables passées, vus
  // depuis le plus longtemps. Une fois jouée, le parcours dit « tout est là ».
  assert.deepEqual([parcours.agendaCalculs(etat, "2026-09-07").dus, parcours.resumeCalculs(etat, "2026-09-07").sus], [0, 36]);
  etape = parcours.prochaineEtape(etat, "2026-09-07");
  assert.deepEqual([etape.type, etape.dus], ["revision", 10], "la première série du jour : dix calculs en complément, aucun dû");
  assert.equal(parcours.serieDuJour(etat, {aujourdhui: "2026-09-07"}).complement, 10);
  etape = parcours.prochaineEtape({...etat, calculsDuJour: "2026-09-07"}, "2026-09-07");
  assert.equal(etape.type, "legende");
  assert.match(etape.libelle, /36 calculs sont verts/);
});

test("passerelle : une table acquise avec 2 calculs à 0 est « à revoir », le ✓ reste", () => {
  let etat = acquerir(parcours.creerParcours(), 7);
  etat = repondre(etat, "7-8", false);
  assert.deepEqual(parcours.tablesARevoir(etat), [], "un seul calcul à 0 ne suffit pas");
  etat = repondre(etat, "6-7", false);
  assert.deepEqual(parcours.tablesARevoir(etat), [7]);
  const affichage = parcours.etatAffichage(etat);
  const ligne7 = affichage.lignes.find(ligne => ligne.table === 7);
  assert.equal(ligne7.aRevoir, true);
  assert.equal(ligne7.acquise, DATE, "le ✓ reste");
  assert.equal(affichage.lignes.find(ligne => ligne.table === 6).aRevoir, false, "la table de 6 n’est pas passée");
  assert.deepEqual(affichage.calculs, parcours.resumeCalculs(etat));
  assert.deepEqual(affichage.agenda, parcours.agendaCalculs(etat));
});

test("la grille est sauvegardée avec le parcours et résiste aux données abîmées", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "6-7", false);
  etat = repondre(etat, "2-5", true);
  const relu = parcours.normaliserParcours(JSON.parse(JSON.stringify(etat)));
  assert.deepEqual(relu, etat);

  const abime = parcours.normaliserParcours({calculs: {
    "6-7": {boite: 99, cases: 99, vu: DATE, erreur: null, echeance: "demain"},
    "7-10": {boite: 2, vu: DATE, erreur: null},
    "2-5": {boite: 2},
    "3-3": "pas un objet"
  }});
  assert.deepEqual(abime.calculs["6-7"], {boite: 1, cases: 0, vu: DATE, erreur: null, gagne: null, echeance: DATE}, "une boîte invalide repart en boîte 1, dû tout de suite, comme le reste du parcours");
  assert.equal(abime.calculs["7-10"], undefined, "fait hors grille ignoré");
  assert.equal(abime.calculs["2-5"], undefined, "un fait sans date de passage est ignoré");
  assert.equal(abime.calculs["3-3"], undefined);

  assert.equal(parcours.estVide(etat), false, "des calculs enregistrés = un parcours non vide");
  assert.ok(parcours.estVide(parcours.remettreAZero(etat)), "recommencer à zéro efface aussi la grille");
});

test("appliquerReponse ne modifie jamais l’objet reçu", () => {
  const etat = repondre(parcours.creerParcours(), "6-7", true);
  const copie = JSON.stringify(etat);
  parcours.appliquerReponse(etat, "6-7", {correcte: false, date: DATE});
  parcours.planRevision(etat);
  parcours.grilleCalculs(etat);
  assert.equal(JSON.stringify(etat), copie);
});

const html = await (await import("node:fs/promises")).readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const confidentialite = await (await import("node:fs/promises")).readFile(new URL("../confidentialite.html", import.meta.url), "utf8");

// Lot « un seul tableau » (04/10/2026) : Mes calculs n'a plus d'écran à part,
// il vit dans Mon parcours, sous la carte de ma table.
test("Mes calculs vit dans Mon parcours : boîtes, détail, tableau, légende ; plus d’écran ni de tuile", () => {
  assert.match(html, /\["intro", "launch", "play", "result", "parcours", "lire", "fiche"\]/);
  assert.doesNotMatch(html, /id="open-calculs"|id="calculs" class="calculs-screen"|id="calculs-back"|id="calculs-reviser"/);
  const parcoursEcran = html.slice(html.indexOf('<div id="parcours" class="parcours-screen" hidden>'), html.indexOf('<div id="play" hidden>'));
  assert.match(parcoursEcran, /<div id="parcours-matable" class="parcours-row is-ma-table parcours-matable"><\/div>\s*<section id="parcours-calculs" class="parcours-row calculs-bloc" aria-labelledby="calculs-titre">\s*<h2 id="calculs-titre" class="calculs-titre">Mes calculs<\/h2>/, "la carte de ma table, puis Mes calculs");
  assert.ok(parcoursEcran.indexOf('id="parcours-calculs"') < parcoursEcran.indexOf('id="parcours-melange"'), "puis le mélange et l’escalier");
  assert.doesNotMatch(html, /id="calculs-resume"/, "lot mémoire : la ligne de résumé a laissé la place aux tuiles des boîtes");
  assert.match(parcoursEcran, /id="calculs-grille"/);
  assert.match(parcoursEcran, /id="calculs-detail"/);
  assert.match(parcoursEcran, /id="calculs-boites" class="calculs-boites" role="group" aria-label="Mes cinq boîtes"/, "le bandeau des cinq boîtes, au-dessus de la grille");
  assert.ok(html.indexOf('id="calculs-boites"') < html.indexOf('id="calculs-detail"') && html.indexOf('id="calculs-detail"') < html.indexOf('id="calculs-grille"'));
  assert.doesNotMatch(html, /class="calculs-note"/, "le paragraphe de règles a disparu : les règles vivent dans « Comment ça marche ? »");
  assert.match(html, /PARCOURS\.serieAlimenteGrille/);
  assert.match(html, /PARCOURS\.appliquerReponse/);
  assert.match(html, /PARCOURS\.planRevision/);
  assert.match(html, /CORE\.tableQuestion/);
  assert.match(html, /ouvrir === "calculs"\) openCalculs\(\)/);
});

test("le détail d’une case écrit le calcul dans les deux sens et empile ses informations", () => {
  assert.match(html, /ligne === colonne/, "la diagonale est traitée à part");
  assert.match(html, /\? `\$\{ligne\} × \$\{colonne\} = \$\{produit\}`/, "sur la diagonale le calcul n’est pas répété");
  assert.match(html, /: `\$\{ligne\} × \$\{colonne\} = \$\{colonne\} × \$\{ligne\} = \$\{produit\}`/, "ailleurs les deux sens sont écrits");
  assert.doesNotMatch(html, /zone\.textContent = morceaux\.join/, "le détail n’aligne plus ses informations derrière des points");
  assert.match(html, /ligneDetail\("mc-detail-calcul", calcul\)/);
  assert.match(html, /ligneDetail\("mc-detail-etat", /);
  assert.match(html, /majuscule\(LIBELLES_ETATS_CALCULS\[etat\]\)/);
  assert.match(html, /À faire aujourd’hui : réussis-le pour monter d’une boîte\./, "la note dit ce que l’élève a sous les yeux : dû, raté aujourd’hui, ou le jour du retour");
  // Lot « Mon parcours » (décision 8) : « … dans ta séance », et « En route — boîte 3 » (plus « sur 5 »).
  assert.match(html, /Raté aujourd’hui : il reviendra demain dans ta séance\./);
  assert.match(html, /`Il reviendra dans ta séance \$\{libelleDans\(PARCOURS\.ecartJours\(aujourdhui, fait\.echeance\)\)\}\.`/);
  assert.match(html, /`\$\{majuscule\(LIBELLES_ETATS_CALCULS\[etat\]\)\} — boîte \$\{boite\}`/, "« En route — boîte 3 »");
  assert.match(html, /function jourDuJour\(\) \{\s*return PARCOURS\.jourLocal\(\);/, "même convention de date que le moteur : le jour local (lot 3)");
  assert.match(html, /\.mc-detail-calcul \{ font-size: 1\.05rem/);
  // Lot « Mon parcours » (décision 6) : le détail n'apparaît qu'au toucher —
  // plus de cadre vide réservé ; il s'ouvre SOUS le tableau, qui ne bouge pas.
  assert.doesNotMatch(html, /\.calculs-detail \{[^}]*min-height: 78px/);
  assert.match(html, /\.calculs-detail\.is-ferme \{ display: block; height: 0;/);
});

test("seule la première réponse compte pour la grille ; un raté ne revient qu’une fois — et plus du tout dans Mes calculs du jour, chronométré", () => {
  // Lot « les règles des records » : la question qui reste dans la course
  // (reessai) n'alimente pas la grille non plus.
  assert.match(html, /if \(!question\.retry && !reessai\) alimenterMesCalculs\(question, correct && !skip\);/, "les calculs qui reviennent n’alimentent pas la grille");
  assert.match(html, /const chrono = state\.configuration\.duration !== null;/);
  assert.match(html, /const willRetry = !correct && !question\.retry && !chrono;/, "un calcul raté revient une seule fois par série de révision ; avec le chrono de Mes calculs du jour, il ne revient pas (il reviendra demain)");
  assert.match(html, /if \(chrono\) \{\s*state\.pauseA = horlogeSerie\(\);/, "le chrono s’arrête le temps de lire la correction");
  assert.doesNotMatch(html, /repartira dans la prochaine révision/, "la règle n’est plus écrite sur l’écran de résultat (lot 2)");
  // Relecture du lot R2 : le temps de la révision est passé sur la ligne du
  // score ; la ligne du dessous reste vide (ni la règle, ni « Série terminée »).
  assert.match(html, /\$\("result-detail"\)\.textContent = "";/);
});

test("la révision : Mes calculs du jour chronométré (« fait » ou « Temps écoulé ») ; sur une table : les calculs dus, 10 par 10, « Encore N → Continuer », puis « Reviens demain : N calculs t’attendront » (plus d’« Encore 10 calculs »)", () => {
  assert.match(html, /function startRevision\(/);
  assert.match(html, /mode: "revision"/);
  // Lot « un seul système » : sans table, c'est Mes calculs du jour — 6 s par
  // calcul (30 s au moins), et un bilan qui ne dit jamais « raté ».
  assert.match(html, /DURATION = table === null \? PARCOURS\.dureeMesCalculs\(plan\.length\) : null;/);
  assert.match(html, /soude\(pasFaits \? "Temps écoulé" : "Mes calculs du jour : fait"\)/);
  assert.match(html, /\$\("result-detail"\)\.textContent = pasFaits \? \(pasFaits > 1 \? "Ils reviendront\." : "Il reviendra\."\) : "";/, "les calculs pas faits ne sont pas comptés faux");
  assert.doesNotMatch(html, /Encore une révision/, "à zéro, rejouer ne ferait rien monter : le bouton n’existe plus");
  assert.match(html, /const restants = PARCOURS\.calculsDus\(parcours, \{table\}\)\.length;/, "ce qui reste dû après la série");
  assert.match(html, /encore \$\{pluriel\(restants, "calcul"\)\} du jour\./);
  assert.match(html, /encore\.textContent = "Continuer\u00a0→";/, "insécable : la flèche ne passe pas seule à la ligne");
  assert.match(html, /if \(restants\) \{\s*const encore = document\.createElement\("button"\);/, "« Continuer » seulement s’il en reste");
  // R4 bis : « Ma table » est fabriqué dans le cadre, principal seulement à zéro.
  // Lot « la flèche de retour » (14/10/2026) : « Ma table » porte la flèche (retour-flechee).
  assert.match(html, /maTable\.className = restants \? "secondary retour-flechee" : "primary retour-flechee";/, "un seul bouton principal : Continuer tant qu’il en reste, Ma table ensuite");
  assert.match(html, /function phraseProchainRetour\(agenda\)/);
  assert.match(html, /return `Reviens \$\{quand\} : \$\{pluriel\(prochain\.calculs, "calcul"\)\} t’attendr\$\{prochain\.calculs > 1 \? "ont" : "a"\}\.`;/);
  assert.match(html, /mont\$\{montes > 1 \? "ent" : "e"\} d’une boîte/, "le bilan : ce qui monte, ce qui redescend");
  assert.match(html, /if \(!plan\.length\) return;/, "rien de dû ne lance rien");
  // Lot « Mon parcours » (décision de Gwenaël) : « Encore 10 calculs » est
  // retiré, sous le tableau et sur le résultat ; la page ne demande plus au
  // moteur que les calculs dus (« libre » reste dans le moteur, testé plus bas).
  assert.doesNotMatch(html, /calculs-encore|libelleEncoreLibre|startRevision\([^)]*, true\)/);
  assert.match(html, /PARCOURS\.planRevision\(parcours, \{table\}\)/);
  assert.match(html, /au premier essai/);
  assert.match(html, /if \(entry\.retour\) \{[\s\S]*?number\.textContent = "Il est revenu";/, "un calcul qui revient n’est pas numéroté Question 11, 12… — il est marqué « Il est revenu » (lot R2 : les autres n’ont plus de numéro)");
  assert.doesNotMatch(html, /Rien aujourd’hui\. \$\{phraseProchainRetour\(agenda\)\}/, "lot « un seul tableau » : le bouton seul (choix de Gwenaël)");
  assert.doesNotMatch(html, /Tout est su ! 10 questions pour entretenir ta grille/, "l’entretien n’est plus une pioche : les verts reviennent à leur date");
  assert.doesNotMatch(html, /on découvre les 10 premiers calculs/, "plus de découverte de calculs par la révision (lot 3)");
  assert.doesNotMatch(html, /L’étoile valide toutes tes tables d’un coup/, "lot 3 : plus de raccourci « ★ valide les 9 tables »");
  assert.match(html, /id="result-verdict"/, "lot R2 : la fête est le cadre du verdict");
  assert.match(html, /renderVerdict\(suivi, elapsed\)/);
  assert.match(html, /verdict\.titre = "Légende des tables !";/, "écran de fête 👑");
  assert.match(html, /Table de \$\{validation\.table\} passée !/, "écran de fête 🎉 à chaque table passée");
  assert.match(html, /animation: none !important/, "la fête respecte prefers-reduced-motion");
});

// Lot « un seul tableau » : la fiche de l'appli tient sur UNE page, le tableau
// de Mes calculs y est sous la carte de ma table. Le PDF vierge (publié, page
// du professeur) n'est pas touché par ce lot.
// Lot « Mon parcours » (décision 15) : le PDF vide est désormais CETTE fiche,
// en mode vierge, imprimée par Chromium — une page, comme celle de l'appli.
test("la fiche imprimable porte le tableau de Mes calculs sur sa page unique ; le PDF vide est cette fiche, vierge", async () => {
  const fs = await import("node:fs/promises");
  assert.match(html, /id="fiche-calculs"/);
  assert.doesNotMatch(html, /fiche-page2/);
  assert.match(html, /<div id="fiche-matable" class="fiche-rangee is-ma-table fiche-matable" hidden><\/div>\s*<table id="fiche-calculs" class="fiche-carre"><tbody><\/tbody><\/table>/);
  const pdf = await fs.readFile(new URL("../outils/calcul_mental/fiche_parcours_tables.pdf", import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.match(pdf.toString("latin1"), /\/Count 1\b/, "le PDF vide fait une page");
  assert.doesNotMatch(pdf.toString("latin1"), /\/Count 2\b/);
  const source = await fs.readFile(new URL("../_sources/defi-tables/generer_fiche_parcours.py", import.meta.url), "utf8");
  assert.match(source, /await page\.goto\(PAGE\.as_uri\(\) \+ "\?vierge"\)/, "il imprime la fiche de l’appli, en mode vierge");
  assert.match(source, /if pages != 1:/, "et refuse un PDF de plus d’une page");
  assert.match(html, /for \(let index = 0; index < PARCOURS\.SEUILS\.revision\.boites; index \+= 1\) \{\s*const caseFait = document\.createElement\("span"\);\s*caseFait\.className = `fiche-case\$\{fait && index < fait\.boite \? " is-pleine" : ""\}`;/, "la fiche remplie aussi");
  assert.match(html, /nombre\.textContent = fait \? String\(ligne \* colonne\) : "";/, "le produit en gros dès la première réponse");
});

test("la page Confidentialité mentionne la grille des calculs", () => {
  assert.match(confidentialite, /par calcul|grille des calculs|Mes calculs/);
});
