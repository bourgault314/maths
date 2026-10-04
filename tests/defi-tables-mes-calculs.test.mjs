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

  etat = repondre(etat, "6-7", false, "2026-10-05");
  etat = repondre(etat, "6-7", false, "2026-10-05");
  etat = repondre(etat, "6-7", false, "2026-10-05");
  assert.equal(etat.calculs["6-7"].boite, 1, "les erreurs comptent toujours, sans limite par jour, jamais sous la boîte 1");
  assert.equal(parcours.etatFait(etat.calculs["6-7"]), "a-travailler");

  etat = repondre(etat, "6-7", true, "2026-10-05");
  assert.equal(etat.calculs["6-7"].boite, 1, "pas de regain le jour d’une erreur sur ce calcul : il « revient dans un nouveau défi », c’est-à-dire un autre jour");
  etat = repondre(etat, "6-7", true, "2026-10-06");
  assert.equal(etat.calculs["6-7"].boite, 2, "le lendemain, la première réussite fait remonter d’une boîte");
  assert.equal(repondre(etat, "6-7", true, "2026-10-06").calculs["6-7"].boite, 2, "mais une seule fois : il n’est plus dû");

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

test("la révision = les calculs dus aujourd’hui, boîtes à tour de rôle (les plus en retard d’abord dans chaque boîte), verts compris, ordre de passage mélangé — jamais un calcul jamais vu", () => {
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

  const plan = parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-12"});
  assert.equal(plan.length, 6, "six calculs dus : six questions, pas une de plus");
  assert.deepEqual(plan.map(item => item.cle).sort(), ["2-5", "3-9", "4-4", "6-7", "7-8", "8-8"], "les six, dans un ordre de passage mélangé");
  assert.ok(plan.every(item => etat.calculs[item.cle]), "aucun calcul jamais vu");
  assert.equal(new Set(plan.map(item => item.cle)).size, 6, "jamais deux fois le même fait");
  assert.deepEqual(parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-06"}).map(item => item.cle).sort(), ["2-5", "3-9", "4-4", "6-7", "7-8"], "le 6 : 8-8 (retour le 12) n’y est pas");
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
  assert.ok(questions.every(question => question.category === "direct"), "aucune table n’a passé l’entraînement « trous » ni n’est acquise : que des produits (la forme suit ce qu’il a rencontré)");
  // La table de 4 a réussi l'entraînement « trous » : 4-4 peut arriver en trou, les autres non ; jamais de division avant la première étoile.
  const avecTrous = JSON.parse(JSON.stringify(etat));
  avecTrous.tables[4].entraine.trous = 2;
  assert.deepEqual(parcours.formesPermises(avecTrous, "4-4"), ["direct", "missing"]);
  assert.deepEqual(parcours.formesPermises(avecTrous, "7-8"), ["direct"]);
  const plans = Array.from({length: 20}, (_, graine) => parcours.planRevision(avecTrous, {random: () => (graine % 7) / 7, aujourdhui: "2026-09-12"}));
  const formes = plans.flat();
  assert.ok(formes.every(item => item.cle === "4-4" || item.type === "direct"), "seul 4-4 peut être posé en trou");
  assert.ok(formes.some(item => item.cle === "4-4" && item.type !== "direct"), "et il l’est parfois");
  assert.ok(formes.every(item => !item.type.startsWith("division")), "pas de division avant la première étoile");
  // Une table acquise ouvre les trous aussi (la validation en contient).
  const acquise = acquerir(JSON.parse(JSON.stringify(etat)), 7);
  assert.deepEqual(parcours.formesPermises(acquise, "7-8"), ["direct", "missing"]);
});

test("l’agenda : dus aujourd’hui, ce qui attendra demain, le prochain retour ; les calculs en retard", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "2-5", true, "2026-09-01");   // retour le 2
  etat = repondre(etat, "3-5", true, "2026-09-01");   // retour le 2
  etat = repondre(etat, "4-5", true, "2026-09-01");
  etat = repondre(etat, "4-5", true, "2026-09-02");   // boîte 3, retour le 5
  assert.deepEqual(parcours.agendaCalculs(etat, "2026-09-01"), {dus: 0, demain: 2, prochain: {jour: "2026-09-02", dans: 1, calculs: 2}});
  assert.deepEqual(parcours.agendaCalculs(etat, "2026-09-03"), {dus: 2, demain: 2, prochain: {jour: "2026-09-04", dans: 1, calculs: 2}}, "les dus restés dus comptent pour demain");
  etat = repondre(etat, "2-5", true, "2026-09-03");   // boîte 3, retour le 6
  etat = repondre(etat, "3-5", false, "2026-09-03");  // boîte 1, dû… demain (raté aujourd’hui)
  assert.deepEqual(parcours.agendaCalculs(etat, "2026-09-03"), {dus: 0, demain: 1, prochain: {jour: "2026-09-04", dans: 1, calculs: 1}}, "un calcul raté aujourd’hui attend demain");
  assert.deepEqual(parcours.agendaCalculs(repondre(parcours.creerParcours(), "9-9", true, "2026-09-01"), "2026-09-01").prochain, {jour: "2026-09-02", dans: 1, calculs: 1});
  const loin = parcours.normaliserParcours({calculs: {"9-9": {boite: 4, vu: "2026-09-01", erreur: null, gagne: "2026-09-01", echeance: "2026-09-08"}}});
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

test("la révision ne propose jamais un calcul jamais vu, même sur une table acquise ; une grille vide ne donne rien", () => {
  assert.deepEqual(parcours.planRevision(parcours.creerParcours()), [], "grille vide : aucune question");
  let etat = acquerir(parcours.creerParcours(), 2);
  // table 2 acquise ; 6-7 su (boîte 4, retour le 12) ; tout le reste jamais vu
  etat = repondre(etat, "6-7", true, "2026-09-01");
  etat = repondre(etat, "6-7", true, "2026-09-02");
  etat = repondre(etat, "6-7", true, "2026-09-05");
  const plan = parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-12"});
  assert.deepEqual(plan.map(item => item.cle), ["6-7"], "seul le calcul vu (su, en entretien) ; les faits jamais vus de la table 2 restent hors révision");
  assert.deepEqual(parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-08"}), [], "le 8, rien n’est dû : aucune question — rejouer ne fait rien monter");
  assert.deepEqual(parcours.planRevision(etat, {table: 2, aujourdhui: "2026-09-12"}), [], "sur la table 2 : rien de vu, rien à réviser");
});

test("l’entretien : les sus reviennent tous les 14 jours, les plus en retard d’abord", () => {
  let etat = parcours.creerParcours();
  parcours.FAITS.forEach(cle => {
    etat.calculs[cle] = {boite: 5, vu: "2026-09-05", erreur: null, gagne: "2026-09-05", echeance: "2026-09-19"};
  });
  etat.calculs["6-7"] = {boite: 5, vu: "2026-08-01", erreur: null, gagne: "2026-08-01", echeance: "2026-08-15"};
  etat.calculs["2-9"] = {boite: 5, vu: "2026-08-15", erreur: null, gagne: "2026-08-15", echeance: "2026-08-29"};
  etat = parcours.normaliserParcours(etat);
  assert.deepEqual(parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-10"}).map(item => item.cle).sort(), ["2-9", "6-7"], "le 10 : seuls les deux en retard sont dus");
  assert.deepEqual(parcours.calculsDus(etat, {aujourdhui: "2026-09-19"}).slice(0, 2), ["6-7", "2-9"], "le plus ancien d’abord");
  const plan = parcours.planRevision(etat, {random: () => 0, aujourdhui: "2026-09-19"});
  assert.equal(plan.length, 10, "le 19, tout est dû : 10 à la fois");
  assert.ok(["6-7", "2-9"].every(cle => plan.some(item => item.cle === cle)), "les deux plus en retard sont dans la première série");
  assert.equal(parcours.calculsDus(etat, {aujourdhui: "2026-09-19"}).length, 36, "et il en reste 26 pour les séries suivantes (« Encore N »)");
});

// Un parcours au sommet de l'escalier : les 9 tables, le mélange, puis une marche.
function legende(etoile = 1) {
  let etat = parcours.creerParcours();
  parcours.TABLES.forEach(table => {
    if (parcours.melangeDu(etat)) etat = parcours.appliquerSerie(etat, normaliser(parcours.configMelange(etat)), {correct: 20, total: 20, date: DATE}).parcours;
    etat = parcours.appliquerSerie(etat, normaliser(parcours.configValidation(table)), {correct: 20, total: 20, date: DATE}).parcours;
  });
  etat = parcours.appliquerSerie(etat, normaliser(parcours.configMelange(etat)), {correct: 20, total: 20, date: DATE}).parcours;
  return parcours.appliquerSerie(etat, normaliser(parcours.configEtoile(etoile)), {correct: 25, total: 25, date: DATE}).parcours;
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
  let plein = parcours.creerParcours();
  parcours.FAITS.slice(0, 14).forEach(cle => { plein = repondre(plein, cle, cle.endsWith("5"), "2026-09-02"); });
  const dix = parcours.planRevision(plein, {random: () => 0, aujourdhui: "2026-09-03"});
  assert.equal(dix.length, 10);
  assert.equal(new Set(dix.map(item => item.cle)).size, 10);
});

test("la prochaine étape : « Mes calculs du jour » dès qu’un calcul est dû, devant tout le reste — un conseil, pas un verrou", () => {
  let etat = parcours.creerParcours();
  etat = repondre(etat, "2-6", true, "2026-09-01");
  assert.notEqual(parcours.prochaineEtape(etat, "2026-09-01").type, "revision", "rien de dû aujourd’hui : la table");
  const etape = parcours.prochaineEtape(etat, "2026-09-02");
  assert.equal(etape.type, "revision");
  assert.equal(etape.dus, 1);
  assert.match(etape.libelle, /Mes calculs du jour : 1 calcul à réviser/);
  assert.deepEqual(etape.config, {mode: "revision", table: null});
  assert.equal(parcours.etatAffichage(etat, "2026-09-02").prochaine.type, "revision");
  // Devant le mélange dû, aussi.
  let deux = acquerir(acquerir(parcours.creerParcours(), 2), 10);
  parcours.faitsDeLaTable(2).forEach(cle => { deux = repondre(deux, cle, true, "2026-09-01"); });
  assert.equal(parcours.prochaineEtape(deux, "2026-09-01").type, "melange", "les calculs joués aujourd’hui ne sont pas dus le jour même : le mélange dû reste devant");
  assert.equal(parcours.prochaineEtape(deux, "2026-09-02").type, "revision", "le lendemain, les 8 calculs de la table de 2 passent devant le mélange");
  assert.equal(parcours.prochaineEtape(deux, "2026-09-02").dus, 8);
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
  etape = parcours.prochaineEtape(etat, "2026-09-07");
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
  assert.equal(affichage.lignes.find(ligne => ligne.table === 6).aRevoir, false, "la table de 6 n’est pas acquise");
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
  assert.match(html, /Raté aujourd’hui : il revient demain\./);
  assert.match(html, /`Revient \$\{libelleDans\(PARCOURS\.ecartJours\(aujourdhui, fait\.echeance\)\)\}\.`/);
  assert.match(html, /boîte \$\{boite\} sur \$\{PARCOURS\.SEUILS\.revision\.boites\}/, "« En route — boîte 3 sur 5 »");
  assert.match(html, /function jourDuJour\(\) \{\s*return PARCOURS\.jourLocal\(\);/, "même convention de date que le moteur : le jour local (lot 3)");
  assert.match(html, /\.mc-detail-calcul \{ font-size: 1\.05rem/);
  assert.match(html, /\.calculs-detail \{[\s\S]*?min-height: 78px/, "la hauteur réservée couvre trois lignes : la grille ne saute pas");
});

test("seule la première réponse compte pour la grille, et un raté ne revient qu’une fois", () => {
  assert.match(html, /if \(!question\.retry\) alimenterMesCalculs\(question, correct && !skip\);/, "les calculs qui reviennent n’alimentent pas la grille");
  assert.match(html, /const willRetry = !correct && !question\.retry;/, "un calcul raté revient une seule fois par série de révision");
  assert.doesNotMatch(html, /repartira dans la prochaine révision/, "la règle n’est plus écrite sur l’écran de résultat (lot 2)");
  // Relecture du lot R2 : le temps de la révision est passé sur la ligne du
  // score ; la ligne du dessous reste vide (ni la règle, ni « Série terminée »).
  assert.match(html, /\$\("result-detail"\)\.textContent = "";/);
});

test("la révision : les calculs dus, 10 par 10, « Encore N → Continuer », puis « Reviens demain : N calculs t’attendront »", () => {
  assert.match(html, /function startRevision\(/);
  assert.match(html, /mode: "revision"/);
  assert.doesNotMatch(html, /Encore une révision/, "à zéro, rejouer ne ferait rien monter : le bouton n’existe plus");
  assert.match(html, /const restants = PARCOURS\.calculsDus\(parcours, \{table\}\)\.length;/, "ce qui reste dû après la série");
  assert.match(html, /encore \$\{pluriel\(restants, "calcul"\)\} du jour\./);
  assert.match(html, /encore\.textContent = "Continuer\u00a0→";/, "insécable : la flèche ne passe pas seule à la ligne");
  assert.match(html, /if \(restants\) \{\s*const encore = document\.createElement\("button"\);/, "« Continuer » seulement s’il en reste");
  // R4 bis : « Ma table » est fabriqué dans le cadre, principal seulement à zéro.
  assert.match(html, /maTable\.className = restants \? "secondary" : "primary";/, "un seul bouton principal : Continuer tant qu’il en reste, Ma table ensuite");
  assert.match(html, /function phraseProchainRetour\(agenda\)/);
  assert.match(html, /return `Reviens \$\{quand\} : \$\{pluriel\(prochain\.calculs, "calcul"\)\} t’attendr\$\{prochain\.calculs > 1 \? "ont" : "a"\}\.`;/);
  assert.match(html, /mont\$\{montes > 1 \? "ent" : "e"\} d’une boîte/, "le bilan : ce qui monte, ce qui redescend");
  assert.match(html, /if \(!plan\.length\) return;/, "rien de dû ne lance rien");
  assert.match(html, /\$\("calculs-encore-zone"\)\.hidden = !libre;/, "dans Mon parcours, « Encore 10 calculs » seulement s’il reste des calculs à venir et rien de dû");
  assert.match(html, /function libelleEncoreLibre\(table = null\)/);
  assert.match(html, /startRevision\(table, state\.origin, true\)/, "le résultat propose « Encore 10 calculs » à zéro");
  assert.match(html, /PARCOURS\.planRevision\(parcours, \{table, libre\}\)/);
  assert.match(html, /au premier essai/);
  assert.match(html, /if \(entry\.retour\) \{[\s\S]*?number\.textContent = "Il est revenu";/, "un calcul qui revient n’est pas numéroté Question 11, 12… — il est marqué « Il est revenu » (lot R2 : les autres n’ont plus de numéro)");
  assert.doesNotMatch(html, /Rien aujourd’hui\. \$\{phraseProchainRetour\(agenda\)\}/, "lot « un seul tableau » : le bouton seul (choix de Gwenaël)");
  assert.doesNotMatch(html, /Tout est su ! 10 questions pour entretenir ta grille/, "l’entretien n’est plus une pioche : les verts reviennent à leur date");
  assert.doesNotMatch(html, /on découvre les 10 premiers calculs/, "plus de découverte de calculs par la révision (lot 3)");
  assert.doesNotMatch(html, /L’étoile valide toutes tes tables d’un coup/, "lot 3 : plus de raccourci « ★ valide les 9 tables »");
  assert.match(html, /id="result-verdict"/, "lot R2 : la fête est le cadre du verdict");
  assert.match(html, /renderVerdict\(suivi, elapsed\)/);
  assert.match(html, /verdict\.titre = "Légende des tables !";/, "écran de fête 👑");
  assert.match(html, /Table de \$\{validation\.table\} acquise !/, "écran de fête 🎉 à chaque table validée");
  assert.match(html, /animation: none !important/, "la fête respecte prefers-reduced-motion");
});

// Lot « un seul tableau » : la fiche de l'appli tient sur UNE page, le tableau
// de Mes calculs y est sous la carte de ma table. Le PDF vierge (publié, page
// du professeur) n'est pas touché par ce lot.
test("la fiche imprimable porte le tableau de Mes calculs sur sa page unique ; le PDF vide est inchangé", async () => {
  const fs = await import("node:fs/promises");
  assert.match(html, /id="fiche-calculs"/);
  assert.doesNotMatch(html, /fiche-page2/);
  assert.match(html, /<div id="fiche-matable" class="fiche-rangee is-ma-table fiche-matable" hidden><\/div>\s*<table id="fiche-calculs" class="fiche-carre"><tbody><\/tbody><\/table>/);
  const pdf = await fs.readFile(new URL("../outils/calcul_mental/fiche_parcours_tables.pdf", import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.match(pdf.toString("latin1"), /\/Count 2/, "le PDF vide fait deux pages");
  const source = await fs.readFile(new URL("../_sources/defi-tables/generer_fiche_parcours.py", import.meta.url), "utf8");
  assert.match(source, /MES CALCULS/);
  assert.match(source, /BOITES = 5/, "la fiche vide a cinq boîtes par calcul");
  assert.match(source, /for case in range\(BOITES\):/);
  assert.match(html, /for \(let index = 0; index < PARCOURS\.SEUILS\.revision\.boites; index \+= 1\) \{\s*const caseFait = document\.createElement\("span"\);\s*caseFait\.className = `fiche-case\$\{fait && index < fait\.boite \? " is-pleine" : ""\}`;/, "la fiche remplie aussi");
  assert.match(html, /nombre\.textContent = fait \? String\(ligne \* colonne\) : "";/, "le produit en gros dès la première réponse");
});

test("la page Confidentialité mentionne la grille des calculs", () => {
  assert.match(confidentialite, /par calcul|grille des calculs|Mes calculs/);
});
