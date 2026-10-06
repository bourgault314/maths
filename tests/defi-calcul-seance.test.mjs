// Défi calcul, lot 2a : la séance guidée (document de l'étape 5a, § 2 à 5
// et § 12) — les boîtes par compétence, la file des étapes, le test de
// module, Mes calculs du jour, le rattrapage, la reprise le jour même.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

// La carte du site : quatre modules construits (A2, M2, A5 au palier 1, D2
// au palier 3). Et une carte où tout est construit, pour les grands nombres.
const CARTE = CORE.carte();
const CARTE_PLEINE = CARTE.map(fiche => Object.assign({}, fiche, {construit: fiche.palier > 0}));
const J1 = "2026-10-05";
const plus = n => P.ajouterJours(J1, n);

const reponses = (justes, total = 10) => Array.from({length: total}, (_, i) => ({juste: i < justes}));
const types = (parcours, jour, carte = CARTE) => P.fileSeance(parcours, carte, {aujourdhui: jour}).etapes.map(e => e.type);
const file = (parcours, jour, carte = CARTE) => P.fileSeance(parcours, carte, {aujourdhui: jour});

// Les gestes de la page, un par étape.
const ouvrir = (p, jour, carte = CARTE) => P.ouvrirSeance(p, carte, {aujourdhui: jour});
const apprendre = (p, module, niveau, jour, carte = CARTE) =>
  P.appliquerSerie(p, {module, niveau, genre: "apprends"}, {aujourdhui: jour, carte, seance: true});
const entrainer = (p, module, niveau, justes, jour, {carte = CARTE, seance = true, genre = "entraine", causes = {}} = {}) =>
  P.appliquerSerie(p, {module, niveau, genre, reponses: reponses(justes), causes}, {aujourdhui: jour, carte, seance});
// Un test de module : `justes` = le nombre de calculs justes de chaque niveau.
const tester = (p, module, justes, jour, {carte = CARTE, seance = true} = {}) =>
  P.appliquerTest(p, {module, niveaux: justes.map((j, i) => ({niveau: i + 1, justes: j, total: 3}))}, {aujourdhui: jour, carte, seance});
const repondre = (p, module, niveau, juste, jour, {ms = 2000, type = "P", cause = 0} = {}) =>
  P.appliquerRetour(p, {module, niveau, juste, ms, type, cause}, {aujourdhui: jour});

// Un parcours où des compétences sont déjà dans des boîtes : {"A5-1": [boîte, échéance, échecs]}.
function avecBoites(boites, base = P.creerParcours()) {
  const p = P.normaliserParcours(base);
  Object.entries(boites).forEach(([cle, [boite, echeance, echecs = 0]]) => {
    const [id, n] = cle.split("-");
    const ligne = p.modules[id] || P.normaliserParcours({modules: {[id]: {}}}).modules[id];
    ligne.b[n - 1] = boite;
    ligne.e[n - 1] = echeance;
    ligne.x[n - 1] = echecs;
    ligne.a[n - 1] = 1;
    ligne.f[n - 1] = 1;
    ligne.vu = ligne.vu || "2026-09-01";
    p.modules[id] = ligne;
  });
  return P.normaliserParcours(p);
}

test("premier jour : pas de calculs du jour, la séance commence par le test du premier module", () => {
  const neuf = P.creerParcours();
  const f = file(neuf, J1);
  assert.deepEqual(f.etapes, [{type: "test", module: "A2"}, {type: "nouveau"}]);
  assert.equal(f.faites, 0);
  assert.equal(f.ouverte, false);
  assert.equal(f.finie, false);
  assert.deepEqual(P.competenceCourante(neuf, CARTE), {module: "A2", niveau: 1});
  assert.equal(P.moduleCourant(neuf, CARTE), "A2");
  // La séance ne parcourt que les modules construits, dans l'ordre de la carte.
  assert.deepEqual(P.competenceCourante(neuf, CARTE_PLEINE), {module: "A1", niveau: 1});
  assert.deepEqual(P.competenceCourante(neuf, []), null);
});

test("entrer dans les boîtes : entraînement réussi → boîte 2, demain ; raté → rien", () => {
  let p = P.creerParcours();
  p.test = 0;
  const rate = entrainer(p, "A5", 1, 7, J1, {seance: false});
  assert.equal(rate.verdict.reussi, false, "7 sur 10 ne suffit pas");
  assert.deepEqual(rate.parcours.modules.A5.b, [0, 0, 0, 0], "un entraînement raté ne fait entrer rien, et ne descend rien");
  assert.deepEqual(rate.evenements, []);
  const reussi = entrainer(p, "A5", 1, 8, J1, {seance: false});
  assert.equal(reussi.verdict.reussi, true, "8 sur 10 suffit");
  assert.deepEqual(reussi.parcours.modules.A5.b, [2, 0, 0, 0]);
  assert.deepEqual(reussi.parcours.modules.A5.e, [plus(1), null, null, null]);
  assert.deepEqual(reussi.evenements, [{type: "entree", module: "A5", niveau: 1, boite: 2}]);
  // Une compétence n'entre qu'une fois : rejouée, sa boîte ne bouge pas.
  p = avecBoites({"A5-1": [4, plus(5)]});
  const rejoue = entrainer(p, "A5", 1, 10, J1, {seance: false});
  assert.deepEqual([rejoue.parcours.modules.A5.b[0], rejoue.parcours.modules.A5.e[0]], [4, plus(5)]);
  assert.equal(rejoue.parcours.modules.A5.f[0], 2, "la série est comptée");
  const rejoueRate = entrainer(p, "A5", 1, 2, J1, {seance: false, causes: {1: 3}});
  assert.equal(rejoueRate.parcours.modules.A5.b[0], 4, "une erreur d'entraînement ne fait JAMAIS descendre");
  assert.deepEqual(rejoueRate.parcours.modules.A5.c, {1: 3}, "elle nourrit seulement le compteur des causes");
  // « J'apprends » : le niveau est appris, rien d'autre.
  const appris = P.appliquerSerie(P.creerParcours(), {module: "A5", niveau: 2, genre: "apprends"}, {aujourdhui: J1, carte: CARTE});
  assert.deepEqual(appris.parcours.modules.A5.a, [0, 1, 0, 0]);
  assert.deepEqual(appris.parcours.jours, [], "« J'apprends » seul ne fait pas un jour de travail");
  assert.deepEqual(reussi.parcours.jours, [J1]);
});

test("le test de module : 3 sur 3 → boîte 3, dans 3 jours ; le reste est à apprendre", () => {
  let p = ouvrir(P.creerParcours(), J1);
  const t = tester(p, "A2", [3, 3, 2, 0], J1);
  assert.deepEqual(t.parcours.modules.A2.b, [3, 3, 0, 0]);
  assert.deepEqual(t.parcours.modules.A2.e, [plus(3), plus(3), null, null]);
  assert.deepEqual(t.parcours.modules.A2.f, [1, 1, 1, 1], "le test compte une série par niveau");
  assert.deepEqual(t.bilan.map(n => [n.niveau, n.justes, n.total, n.connu, n.entre]), [[1, 3, 3, true, true], [2, 3, 3, true, true], [3, 2, 3, false, false], [4, 0, 3, false, false]]);
  assert.equal(t.tout, false);
  assert.equal(t.parcours.test, P.TEST.propre, "un test raté : il n'est plus proposé");
  assert.equal(t.finie, false);
  // Raté : la nouveauté continue sur le premier niveau raté, dans la même séance.
  assert.deepEqual(file(t.parcours, J1).etapes, [{type: "apprends", module: "A2", niveau: 3}, {type: "entraine", module: "A2", niveau: 3}]);
  assert.equal(file(t.parcours, J1).faites, 1);
  // 2 sur 3, c'est « à apprendre » : il faut les 3.
  assert.equal(tester(p, "A2", [2, 2, 2, 2], J1).parcours.modules.A2.b.some(Boolean), false);
  // Un test incomplet (moins de 3 calculs d'un niveau) ne fait pas entrer ce niveau.
  const court = P.appliquerTest(p, {module: "A2", niveaux: [{niveau: 1, justes: 2, total: 2}]}, {aujourdhui: J1, carte: CARTE});
  assert.equal(court.parcours.modules.A2.b[0], 0);
  // Réussi en entier : tout entre, le test reste proposé, la séance passe au module suivant.
  const tout = tester(p, "A2", [3, 3, 3, 3], J1);
  assert.equal(tout.tout, true);
  assert.deepEqual(tout.parcours.modules.A2.b, [3, 3, 3, 3]);
  assert.equal(tout.parcours.test, P.TEST.oui);
  assert.deepEqual(file(tout.parcours, J1).etapes, [{type: "test", module: "M2"}, {type: "nouveau"}]);
  // Le test ne fait qu'entrer : une compétence déjà dans une boîte ne bouge pas.
  const deja = avecBoites({"A2-1": [5, plus(9)], "A2-2": [1, plus(1)]});
  const refait = tester(deja, "A2", [0, 3, 3, 3], J1, {seance: false});
  assert.deepEqual(refait.parcours.modules.A2.b, [5, 1, 3, 3]);
  assert.deepEqual(refait.parcours.modules.A2.e.slice(0, 2), [plus(9), plus(1)]);
  assert.equal(P.appliquerTest(p, {module: "Z9"}, {aujourdhui: J1}).bilan.length, 0);
});

test("au plus 4 tests par séance ; un élève qui sait tout traverse les modules", () => {
  let p = ouvrir(P.creerParcours(), J1, CARTE_PLEINE);
  const joues = [];
  for (let i = 0; i < 6; i += 1) {
    const etape = file(p, J1, CARTE_PLEINE).etapes[0];
    if (etape.type !== "test") break;
    joues.push(etape.module);
    p = tester(p, etape.module, Array.from({length: P.NIVEAUX[etape.module]}, () => 3), J1, {carte: CARTE_PLEINE}).parcours;
  }
  assert.deepEqual(joues, ["A1", "A2", "M1", "A3"], "quatre tests, dans l'ordre de la carte");
  assert.equal(p.seance.p[P.PLAN.tests], 4);
  // Le cinquième module s'ouvre par « J'apprends », dans la même séance.
  assert.deepEqual(file(p, J1, CARTE_PLEINE).etapes, [{type: "apprends", module: "M2", niveau: 1}, {type: "entraine", module: "M2", niveau: 1}]);
  // Le lendemain, les tests reprennent là où ils en étaient.
  assert.deepEqual(types(p, plus(1), CARTE_PLEINE), ["jour", "test", "nouveau"]);
  assert.equal(file(p, plus(1), CARTE_PLEINE).etapes[1].module, "M2");
});

test("le test est proposé : au départ, au premier module d'un palier, après un module sans accroc", () => {
  // Test raté sur A2 : plus de test tant qu'un module n'est pas entré sans accroc.
  let p = tester(ouvrir(P.creerParcours(), J1), "A2", [0, 0, 0, 0], J1).parcours;
  assert.equal(p.test, P.TEST.propre);
  let jour = J1;
  // A2 s'apprend niveau par niveau, sans un seul entraînement raté.
  for (let n = 1; n <= 4; n += 1) {
    if (n > 1) { jour = P.ajouterJours(jour, 1); p = ouvrir(p, jour); }
    assert.deepEqual(file(p, jour).etapes.filter(e => e.type !== "jour").map(e => e.type), ["apprends", "entraine"]);
    p = apprendre(p, "A2", n, jour).parcours;
    p = entrainer(p, "A2", n, 9, jour).parcours;
  }
  assert.equal(p.test, P.TEST.oui, "module entré sans accroc : le test redevient proposé");
  jour = P.ajouterJours(jour, 1);
  assert.equal(file(p, jour).etapes.find(e => e.type === "test").module, "M2");
  // Un entraînement raté dans le module : pas de test au module suivant.
  let q = tester(ouvrir(P.creerParcours(), J1), "A2", [3, 3, 3, 0], J1).parcours;
  q = apprendre(q, "A2", 4, J1).parcours;
  q = entrainer(q, "A2", 4, 3, J1).parcours;
  assert.equal(q.test, P.TEST.non, "un entraînement raté : le module a un accroc");
  q = entrainer(q, "A2", 4, 9, J1).parcours;
  assert.equal(q.test, P.TEST.propre, "le module suivant repart propre, sans test");
  assert.deepEqual(types(q, plus(1)).filter(t => t !== "jour"), ["apprends", "entraine"]);
  assert.equal(file(q, plus(1)).etapes.find(e => e.type === "apprends").module, "M2");
  // … sauf au premier module (construit) d'un palier : D2, au palier 3.
  const fin = avecBoites({"A2-1": [2, plus(9)], "A2-2": [2, plus(9)], "A2-3": [2, plus(9)], "A2-4": [2, plus(9)],
    "M2-1": [2, plus(9)], "M2-2": [2, plus(9)], "A5-1": [2, plus(9)], "A5-2": [2, plus(9)], "A5-3": [2, plus(9)], "A5-4": [2, plus(9)]});
  fin.test = P.TEST.non;
  assert.deepEqual(file(fin, J1).etapes.filter(e => e.type !== "jour"), [{type: "test", module: "D2"}, {type: "nouveau"}]);
  // Et un module déjà entamé (un niveau appris) n'est plus « intact » : pas de test.
  const entame = P.appliquerSerie(P.creerParcours(), {module: "A2", niveau: 1, genre: "apprends"}, {aujourdhui: J1, carte: CARTE}).parcours;
  assert.deepEqual(types(entame, plus(1)), ["entraine"]);
});

test("la séance ordinaire : calculs du jour, J'apprends, Je m'entraîne — une nouveauté, puis c'est fini", () => {
  let p = avecBoites({"A2-1": [2, J1], "A2-2": [3, plus(2)]});
  p.test = P.TEST.non;
  const f = file(p, J1);
  assert.deepEqual(f.etapes, [
    {type: "jour", calculs: 2, entretien: true},
    {type: "apprends", module: "A2", niveau: 3},
    {type: "entraine", module: "A2", niveau: 3}
  ]);
  assert.equal(f.minutes, 8, "3 étapes, environ 8 min");
  p = ouvrir(p, J1);
  assert.equal(P.seanceOuverte(p, J1), true);
  assert.equal(P.seanceOuverte(p, plus(1)), false, "la séance de la veille ne compte plus");
  assert.deepEqual(P.ouvrirSeance(p, CARTE, {aujourdhui: J1}), p, "une séance déjà ouverte n'est pas touchée");
  p = repondre(p, "A2", 1, true, J1).parcours;
  p = repondre(p, "A2", 2, true, J1).parcours;
  const jour = P.terminerCalculsDuJour(p, {aujourdhui: J1, carte: CARTE});
  assert.equal(jour.finie, false);
  p = jour.parcours;
  assert.deepEqual([p.seance.etape, types(p, J1)], [1, ["apprends", "entraine"]]);
  p = apprendre(p, "A2", 3, J1).parcours;
  assert.deepEqual([p.seance.etape, types(p, J1)], [2, ["entraine"]]);
  const fin = entrainer(p, "A2", 3, 8, J1);
  assert.equal(fin.finie, true, "l'entraînement réussi finit la séance");
  p = fin.parcours;
  assert.deepEqual(p.modules.A2.b, [3, 3, 2, 0]);
  assert.deepEqual(p.seance, {jour: J1, etape: 0, n: 1, p: [0, 0, 0, 0, 0]});
  assert.deepEqual(p.seances, [J1]);
  assert.deepEqual(P.bilanSeances(p, J1), {semaine: 1, aujourdhui: 1});
  // « Encore une séance » : plus rien n'est dû, l'étape des calculs du jour saute.
  const encore = file(p, J1);
  assert.equal(encore.finie, true);
  assert.deepEqual(encore.etapes, [{type: "apprends", module: "A2", niveau: 4}, {type: "entraine", module: "A2", niveau: 4}]);
  // « Demain : … » : la compétence qui vient, et les calculs qui reviennent.
  assert.deepEqual(P.demain(p, CARTE, {aujourdhui: J1}), {prochaine: {module: "A2", niveau: 4}, reviennent: 3});
});

test("entraînement raté : un second tout de suite ; raté deux fois, la séance s'arrête et demain repart de J'apprends", () => {
  let p = P.creerParcours();
  p.test = P.TEST.non;
  p = ouvrir(p, J1);
  p = apprendre(p, "A2", 1, J1).parcours;
  let r = entrainer(p, "A2", 1, 7, J1);
  assert.equal(r.finie, false);
  p = r.parcours;
  assert.deepEqual(file(p, J1).etapes, [{type: "encore", module: "A2", niveau: 1}], "« Je m'entraîne encore », tout de suite");
  assert.equal(p.modules.A2.a[0], 1);
  // Réussi au second : la compétence entre, la séance est finie.
  const ok = entrainer(p, "A2", 1, 8, J1);
  assert.equal(ok.finie, true);
  assert.equal(ok.parcours.modules.A2.b[0], 2);
  // Raté une seconde fois : la séance s'arrête, « J'apprends » est à refaire.
  r = entrainer(p, "A2", 1, 5, J1);
  assert.equal(r.finie, true);
  p = r.parcours;
  assert.equal(p.modules.A2.a[0], 0, "a repasse à 0");
  assert.equal(p.modules.A2.b[0], 0);
  assert.deepEqual(p.seances, [J1], "la séance arrêtée compte");
  assert.equal(p.seance.p[P.PLAN.nouveaute], P.NOUVEAUTE.arretee);
  // Aujourd'hui : rien de nouveau, et rien à revoir → pas de séance.
  assert.deepEqual(file(p, J1).etapes, []);
  assert.equal(file(p, J1).finie, true);
  // Demain : J'apprends, puis Je m'entraîne, du même niveau.
  assert.deepEqual(file(p, plus(1)).etapes, [{type: "apprends", module: "A2", niveau: 1}, {type: "entraine", module: "A2", niveau: 1}]);
  // Hors séance (mode professeur), un entraînement raté ne remet rien à zéro.
  const libre = entrainer(apprendre(P.creerParcours(), "A2", 1, J1).parcours, "A2", 1, 2, J1, {seance: false}).parcours;
  assert.equal(libre.modules.A2.a[0], 1);
});

test("Mes calculs du jour : juste et due, la boîte monte ; fausse, elle descend ; nulle part ailleurs", () => {
  const p = avecBoites({"A5-1": [1, J1], "A5-2": [2, J1], "A5-3": [3, J1], "A5-4": [4, J1]});
  // Les délais : 1, 1, 3, 7, 14 jours.
  [[1, 2, 1], [2, 3, 3], [3, 4, 7], [4, 5, 14]].forEach(([n, boite, jours]) => {
    const r = repondre(p, "A5", n, true, J1);
    assert.deepEqual([r.parcours.modules.A5.b[n - 1], r.parcours.modules.A5.e[n - 1]], [boite, plus(jours)], `niveau ${n}`);
    assert.deepEqual([r.mouvement.sens, r.mouvement.avant, r.mouvement.apres, r.mouvement.jours], ["monte", n, boite, jours]);
  });
  // La boîte 5 est la dernière : elle revient tous les 14 jours.
  const cinq = repondre(avecBoites({"A5-1": [5, J1]}), "A5", 1, true, J1);
  assert.deepEqual([cinq.parcours.modules.A5.b[0], cinq.parcours.modules.A5.e[0], cinq.mouvement.sens], [5, plus(14), "reste"]);
  // Fausse (ou passée) : une boîte de moins, 1 au moins, elle revient demain.
  [[1, 1], [2, 1], [3, 2], [4, 3]].forEach(([n, boite]) => {
    const r = repondre(p, "A5", n, false, J1, {cause: 2});
    assert.deepEqual([r.parcours.modules.A5.b[n - 1], r.parcours.modules.A5.e[n - 1], r.parcours.modules.A5.x[n - 1]], [boite, plus(1), 1], `niveau ${n}`);
    assert.equal(r.mouvement.sens, "descend");
    assert.deepEqual(r.parcours.modules.A5.c, {2: 1}, "la cause est comptée");
  });
  // Juste et pas due : rien ne bouge. Fausse et pas due : elle descend quand même.
  const pasDue = avecBoites({"A5-1": [3, plus(2)]});
  const juste = repondre(pasDue, "A5", 1, true, J1);
  assert.deepEqual([juste.parcours.modules.A5.b[0], juste.parcours.modules.A5.e[0], juste.mouvement.sens], [3, plus(2), "reste"]);
  assert.equal(repondre(pasDue, "A5", 1, false, J1).parcours.modules.A5.b[0], 2);
  // Pas deux montées le même jour, et pas de regain le jour d'une erreur.
  let q = repondre(p, "A5", 2, true, J1).parcours;
  q = repondre(q, "A5", 2, true, J1).parcours;
  assert.equal(q.modules.A5.b[1], 3, "montée une fois");
  let e = repondre(p, "A5", 3, false, J1).parcours;
  e = repondre(e, "A5", 3, true, J1).parcours;
  assert.deepEqual([e.modules.A5.b[2], e.modules.A5.e[2]], [2, plus(1)], "descendue ce matin, elle ne remonte pas ce soir");
  // Une compétence qui n'est pas dans les boîtes n'est pas touchée.
  assert.equal(repondre(P.creerParcours(), "A5", 1, true, J1).mouvement, null);
  assert.deepEqual(q.jours, [J1]);
});

test("la vitesse des faits : juste mais au-delà de 5 s, la boîte reste et revient demain", () => {
  const p = avecBoites({"A2-1": [2, J1]});
  const vite = repondre(p, "A2", 1, true, J1, {type: "F", ms: 5000});
  assert.deepEqual([vite.parcours.modules.A2.b[0], vite.parcours.modules.A2.e[0]], [3, plus(3)], "5 s tout juste : ça monte");
  const lent = repondre(p, "A2", 1, true, J1, {type: "F", ms: 5001});
  assert.deepEqual([lent.parcours.modules.A2.b[0], lent.parcours.modules.A2.e[0], lent.mouvement.sens], [2, plus(1), "reste"]);
  assert.equal(lent.parcours.modules.A2.x[0], 0, "juste : ce n'est pas un échec");
  // Une procédure n'a pas de limite de temps.
  const procedure = repondre(p, "A2", 1, true, J1, {type: "P", ms: 60000});
  assert.equal(procedure.parcours.modules.A2.b[0], 3);
});

test("deux ratés de suite : la compétence est rouge, et « Je m'entraîne encore » s'ajoute à la séance suivante", () => {
  // A2 et M2 sont entrés ; Mon niveau est A5-3.
  const loin = plus(30);
  let p = avecBoites({"A2-1": [5, loin], "A2-2": [5, loin], "A2-3": [5, loin], "A2-4": [5, loin], "M2-1": [5, loin], "M2-2": [5, loin],
    "A5-1": [3, J1], "A5-2": [2, J1]});
  p.test = P.TEST.non;
  p = ouvrir(p, J1);
  p = repondre(p, "A5", 1, false, J1).parcours;
  assert.deepEqual([p.modules.A5.b[0], p.modules.A5.x[0]], [2, 1]);
  // Un seul raté : pas de rattrapage, ni aujourd'hui ni demain.
  assert.equal(types(p, J1).includes("rattrape"), false);
  assert.equal(types(p, plus(1)).includes("rattrape"), false);
  // Le lendemain, raté encore : rouge, deux échecs.
  let j2 = ouvrir(p, plus(1));
  j2 = repondre(j2, "A5", 1, false, plus(1)).parcours;
  assert.deepEqual([j2.modules.A5.b[0], j2.modules.A5.x[0], P.couleurDeBoite(j2.modules.A5.b[0])], [1, 2, "rouge"]);
  // La séance en cours a été décidée à l'ouverture : pas de rattrapage dedans.
  assert.equal(types(j2, plus(1)).includes("rattrape"), false);
  // La séance suivante commence par les calculs du jour, puis le rattrapage, avant la nouveauté.
  const j3 = file(j2, plus(2));
  assert.deepEqual(j3.etapes.map(e => e.type), ["jour", "rattrape", "apprends", "entraine"]);
  assert.deepEqual(j3.etapes[1], {type: "rattrape", module: "A5", niveau: 1});
  assert.equal(j3.minutes, 10, "4 étapes, environ 10 min");
  // Le rattrapage est décidé à l'ouverture : même si la compétence est réussie
  // dans les calculs du jour, il a lieu ; et il se reprend sur un autre appareil.
  let s = ouvrir(j2, plus(2));
  assert.equal(s.seance.p[P.PLAN.rattrapage], P.rangDe("A5", 1) + 1);
  s = repondre(s, "A5", 1, true, plus(2)).parcours;
  assert.equal(s.modules.A5.x[0], 0);
  s = P.terminerCalculsDuJour(s, {aujourdhui: plus(2), carte: CARTE}).parcours;
  const repris = P.normaliserParcours(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(file(repris, plus(2)).etapes[0], {type: "rattrape", module: "A5", niveau: 1});
  // Le rattrapage : 10 calculs, les échecs repartent de 0, la boîte ne bouge pas — même raté.
  const boite = s.modules.A5.b[0];
  const fait = entrainer(avecBoites({"A5-3": [1, plus(3), 2]}, s), "A5", 3, 4, plus(2), {genre: "rattrape"});
  assert.deepEqual([fait.parcours.modules.A5.b[2], fait.parcours.modules.A5.x[2]], [1, 0]);
  s = entrainer(s, "A5", 1, 4, plus(2), {genre: "rattrape"}).parcours;
  assert.equal(s.modules.A5.b[0], boite);
  assert.equal(s.seance.p[P.PLAN.rattrapage], 0);
  assert.equal(types(s, plus(2)).includes("rattrape"), false, "un rattrapage par séance");
  // Deux compétences à rattraper : la plus ancienne d'abord.
  const deux = avecBoites({"A5-1": [1, J1, 2], "A2-1": [1, plus(1), 2]}, P.creerParcours());
  assert.deepEqual(file(deux, plus(2)).etapes.find(e => e.type === "rattrape"), {type: "rattrape", module: "A5", niveau: 1},
    "l'échéance la plus ancienne, pas l'ordre de la carte");
});

test("Mes calculs du jour : 10 à 20, un par compétence, les plus en retard d'abord", () => {
  // 130 compétences dans les boîtes.
  const toutes = {};
  CARTE_PLEINE.filter(f => f.construit).forEach((fiche, i) => {
    for (let n = 1; n <= fiche.niveaux; n += 1) toutes[`${fiche.id}-${n}`] = [2, plus(-((i + n) % 9))];
  });
  const plein = avecBoites(toutes);
  const tirage = P.tirerCalculsDuJour(plein, CARTE_PLEINE, {aujourdhui: J1});
  assert.equal(tirage.length, 20, "20 au plus");
  assert.equal(new Set(tirage.map(t => `${t.module}-${t.niveau}`)).size, 20, "une par compétence");
  assert.ok(tirage.every(t => t.du));
  // Les plus en retard d'abord : aucune compétence laissée n'est plus en retard qu'une compétence tirée.
  const retard = t => plein.modules[t.module].e[t.niveau - 1];
  const pire = tirage.map(retard).sort().pop();
  const laissees = Object.keys(toutes).filter(cle => !tirage.some(t => `${t.module}-${t.niveau}` === cle));
  assert.equal(laissees.length, 110);
  laissees.forEach(cle => { const [id, n] = cle.split("-"); assert.ok(plein.modules[id].e[n - 1] >= pire, cle); });
  // La boîte la plus basse passe avant une échéance plus ancienne.
  const rouge = avecBoites(Object.assign({}, toutes, {"F11-3": [1, J1]}));
  assert.deepEqual(P.tirerCalculsDuJour(rouge, CARTE_PLEINE, {aujourdhui: J1})[0], {module: "F11", niveau: 3, du: true});
  // Moins de 10 dues : on complète avec les non dues, par échéance la plus proche.
  // (Les échéances ne sont pas rangées dans l'ordre de la carte.)
  const peu = avecBoites(Object.fromEntries(Object.keys(toutes).slice(0, 30).map((cle, i) => [cle, [3, i < 4 ? J1 : plus(1 + (i * 7) % 26)]])));
  const complete = P.tirerCalculsDuJour(peu, CARTE_PLEINE, {aujourdhui: J1});
  assert.equal(complete.length, 10, "10 au moins");
  assert.deepEqual(complete.map(t => t.du), [true, true, true, true, false, false, false, false, false, false]);
  assert.deepEqual(complete.slice(4).map(t => peu.modules[t.module].e[t.niveau - 1]), [1, 2, 3, 4, 5, 6].map(plus), "l'entretien : les échéances les plus proches");
  // Sans entretien (seconde séance du jour) : seulement ce qui est dû.
  assert.equal(P.tirerCalculsDuJour(peu, CARTE_PLEINE, {aujourdhui: J1, entretien: false}).length, 4);
  // Peu de compétences dans les boîtes : un calcul par compétence, pas 10.
  const debut = avecBoites({"A2-1": [2, plus(1)], "A2-2": [2, J1], "A2-3": [3, plus(3)]});
  assert.deepEqual(P.tirerCalculsDuJour(debut, CARTE, {aujourdhui: J1}), [
    {module: "A2", niveau: 2, du: true}, {module: "A2", niveau: 1, du: false}, {module: "A2", niveau: 3, du: false}
  ]);
  assert.deepEqual(P.tirerCalculsDuJour(P.creerParcours(), CARTE, {aujourdhui: J1}), [], "rien dans les boîtes : l'étape n'existe pas");
  // Un module qui n'est pas construit n'est jamais tiré (aucun générateur).
  assert.ok(P.tirerCalculsDuJour(plein, CARTE, {aujourdhui: J1}).every(t => ["A2", "M2", "A5", "D2"].includes(t.module)));
  // En entretien, une réussite ne change rien, une erreur descend quand même.
  const entretien = repondre(debut, "A2", 3, true, J1).parcours.modules.A2;
  assert.deepEqual([entretien.b[2], entretien.e[2]], [3, plus(3)]);
  assert.equal(repondre(debut, "A2", 3, false, J1).parcours.modules.A2.b[2], 2);
});

test("module su : toutes ses compétences en boîte 4 ; ok est posé une fois et ne s'efface pas", () => {
  let p = avecBoites({"M2-1": [4, plus(3)], "M2-2": [3, J1]});
  assert.equal(P.estSu(p, "M2"), false);
  assert.equal(P.etatModule(p, "M2", CARTE).etat, "encours");
  const r = repondre(p, "M2", 2, true, J1);
  assert.deepEqual(r.evenements, [{type: "module", module: "M2"}], "« Module su ! »");
  p = r.parcours;
  assert.equal(p.modules.M2.ok, J1);
  assert.deepEqual(P.etatModule(p, "M2", CARTE), {id: "M2", niveaux: 2, couleurs: ["vert", "vert"], ici: 0, etat: "su"});
  assert.equal(P.compter(p, CARTE).sus, 1);
  // Une compétence redescend : le module reste coché, même en bleu…
  let q = repondre(p, "M2", 1, false, plus(3)).parcours;
  assert.equal(q.modules.M2.b[0], 3);
  assert.equal(q.modules.M2.ok, J1, "ok ne s'efface pas");
  assert.equal(P.etatModule(q, "M2", CARTE).etat, "su");
  // … et il montre ↻ tant qu'une de ses compétences est rouge.
  q = repondre(q, "M2", 1, false, plus(4)).parcours;
  q = repondre(q, "M2", 1, false, plus(5)).parcours;
  assert.equal(q.modules.M2.b[0], 1);
  assert.equal(P.etatModule(q, "M2", CARTE).etat, "revoir");
  assert.equal(P.estSu(q, "M2"), true);
  // Redevenu vert, la date d'origine reste, et « Module su ! » ne se rejoue pas.
  const retour = repondre(avecBoites({"M2-1": [3, J1]}, q), "M2", 1, true, plus(9));
  assert.deepEqual(retour.evenements, []);
  assert.equal(retour.parcours.modules.M2.ok, J1);
  // Les états : bientôt (pas construit), libre, en cours ; les comptes par palier.
  assert.equal(P.etatModule(P.creerParcours(), "A1", CARTE).etat, "bientot");
  assert.deepEqual(P.etatModule(P.creerParcours(), "A2", CARTE), {id: "A2", niveaux: 4, couleurs: ["gris", "gris", "gris", "gris"], ici: 1, etat: "libre"});
  assert.equal(P.etatModule(P.creerParcours(), "A5", CARTE).ici, 0);
  const compte = P.compter(q, CARTE);
  assert.deepEqual(compte.paliers.map(x => [x.palier, x.sus, x.total]), [[1, 1, 10], [2, 0, 14], [3, 0, 13], [4, 0, 5]]);
  assert.deepEqual([compte.sus, compte.total], [1, 42]);
  assert.deepEqual(compte.competences, {gris: 128, rouge: 1, bleu: 0, vert: 1});
});

test("arrêter et reprendre : les étapes faites restent faites, le jour même, ici ou ailleurs", () => {
  let p = avecBoites({"A2-1": [2, J1]});
  p.test = P.TEST.non;
  p = ouvrir(p, J1);
  p = repondre(p, "A2", 1, true, J1).parcours;
  p = P.terminerCalculsDuJour(p, {aujourdhui: J1, carte: CARTE}).parcours;
  p = apprendre(p, "A2", 2, J1).parcours;
  // « Arrêter la séance » : rien à écrire. La page se ferme, un autre appareil ouvre.
  const ailleurs = P.fusionner(P.creerParcours(), JSON.parse(JSON.stringify(p)));
  const reprise = file(ailleurs, J1);
  assert.deepEqual([reprise.ouverte, reprise.faites, reprise.etapes], [true, 2, [{type: "entraine", module: "A2", niveau: 2}]]);
  assert.deepEqual(ailleurs.seances, [], "une séance arrêtée n'est pas comptée");
  // Le lendemain sans avoir fini : la file du jour est reconstruite, ce qui a
  // été joué compte, la séance de la veille n'est pas comptée.
  const lendemain = file(p, plus(1));
  assert.deepEqual([lendemain.ouverte, lendemain.faites, lendemain.finie], [false, 0, false]);
  assert.deepEqual(lendemain.etapes.map(e => e.type), ["jour", "entraine"], "« J'apprends » est fait : il reste l'entraînement");
  assert.equal(p.modules.A2.b[0], 3, "la boîte montée la veille est gardée");
  let j2 = ouvrir(p, plus(1));
  assert.deepEqual(j2.seance, {jour: plus(1), etape: 0, n: 0, p: [1, 1, 0, 0, 0]});
  j2 = P.terminerCalculsDuJour(j2, {aujourdhui: plus(1), carte: CARTE}).parcours;
  const fin = entrainer(j2, "A2", 2, 10, plus(1));
  assert.equal(fin.finie, true);
  assert.deepEqual(fin.parcours.seances, [plus(1)]);
  // Un entraînement raté une fois, puis la page fermée : à la reprise, le second entraînement.
  let r = P.creerParcours();
  r.test = P.TEST.non;
  r = apprendre(ouvrir(r, J1), "A2", 1, J1).parcours;
  r = entrainer(r, "A2", 1, 2, J1).parcours;
  assert.deepEqual(file(P.normaliserParcours(JSON.parse(JSON.stringify(r))), J1).etapes, [{type: "encore", module: "A2", niveau: 1}]);
  // Le lendemain, ce raté isolé est oublié : un entraînement ordinaire.
  assert.deepEqual(types(r, plus(1)), ["entraine"]);
});

test("tout est entré : la séance, ce sont les calculs du jour ; rien de dû à la seconde séance : à demain", () => {
  const tout = {};
  CARTE.filter(f => f.construit).forEach(fiche => {
    for (let n = 1; n <= fiche.niveaux; n += 1) tout[`${fiche.id}-${n}`] = [3, n === 1 ? J1 : plus(2)];
  });
  let p = avecBoites(tout);
  assert.equal(P.competenceCourante(p, CARTE), null);
  assert.deepEqual(file(p, J1).etapes, [{type: "jour", calculs: 10, entretien: true}]);
  p = ouvrir(p, J1);
  P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J1}).forEach(t => { p = repondre(p, t.module, t.niveau, true, J1).parcours; });
  const fin = P.terminerCalculsDuJour(p, {aujourdhui: J1, carte: CARTE});
  assert.equal(fin.finie, true);
  assert.deepEqual(file(fin.parcours, J1), {etapes: [], faites: 0, ouverte: false, finie: true, minutes: 0});
  assert.deepEqual(P.demain(fin.parcours, CARTE, {aujourdhui: J1}).prochaine, null);
});

test("une année de séances : jamais plus de 6 étapes ni de 20 calculs, une nouveauté par séance, tout finit vert", () => {
  // Un élève qui réussit 85 % du temps, une séance par jour ouvré, sur la
  // carte pleine. Le hasard est fixé.
  const rng = CORE.mulberry32(20261005);
  let p = P.creerParcours();
  let jour = J1;
  let seances = 0;
  for (let j = 0; j < 330 && !(P.competenceCourante(p, CARTE_PLEINE) === null && P.compter(p, CARTE_PLEINE).sus === 42); j += 1, jour = P.ajouterJours(jour, 1)) {
    if (new Date(`${jour}T12:00:00`).getDay() % 6 === 0) continue;
    const avant = P.compter(p, CARTE_PLEINE).competences.gris;
    let entrainements = 0;
    let etapes = 0;
    let tests = 0;
    p = ouvrir(p, jour, CARTE_PLEINE);
    for (;;) {
      const f = file(p, jour, CARTE_PLEINE);
      if (!f.ouverte || !f.etapes.length) break;
      const etape = f.etapes[0];
      etapes += 1;
      if (etape.type === "jour") {
        const tirage = P.tirerCalculsDuJour(p, CARTE_PLEINE, {aujourdhui: jour, entretien: etape.entretien});
        assert.ok(tirage.length >= 1 && tirage.length <= 20);
        assert.equal(tirage.length, etape.calculs);
        tirage.forEach(t => { p = repondre(p, t.module, t.niveau, rng() < 0.9, jour).parcours; });
        p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE_PLEINE}).parcours;
      } else if (etape.type === "test") {
        tests += 1;
        p = tester(p, etape.module, Array.from({length: P.NIVEAUX[etape.module]}, () => (rng() < 0.5 ? 3 : 2)), jour, {carte: CARTE_PLEINE}).parcours;
      } else if (etape.type === "apprends") {
        p = apprendre(p, etape.module, etape.niveau, jour, CARTE_PLEINE).parcours;
      } else if (etape.type === "rattrape") {
        p = entrainer(p, etape.module, etape.niveau, 9, jour, {carte: CARTE_PLEINE, genre: "rattrape"}).parcours;
      } else {
        entrainements += 1;
        p = entrainer(p, etape.module, etape.niveau, rng() < 0.85 ? 9 : 6, jour, {carte: CARTE_PLEINE}).parcours;
      }
      assert.ok(etapes <= 9, `séance sans fin le ${jour}`);
    }
    seances += 1;
    assert.ok(entrainements <= 2, "un entraînement, un second s'il est raté");
    assert.ok(tests <= 4, "4 tests au plus");
    assert.ok(etapes - Math.max(0, tests - 1) <= 6, `${etapes} étapes le ${jour}`);
    assert.equal(P.seanceOuverte(p, jour), false, "la séance jouée jusqu'au bout est fermée");
    assert.equal(p.seances.filter(s => s === jour).length, 1);
    // Une compétence nouvelle au plus par l'entraînement ; les tests en font entrer d'autres.
    if (!tests) assert.ok(avant - P.compter(p, CARTE_PLEINE).competences.gris <= 1);
    const mesure = P.mesurer(p);
    assert.ok(mesure.cles < 2000 && mesure.octets < 40000);
    assert.deepEqual(P.normaliserParcours(p), p, "ce que le moteur écrit est déjà normalisé");
  }
  assert.equal(P.competenceCourante(p, CARTE_PLEINE), null, `tout est entré (${seances} séances)`);
  assert.equal(P.compter(p, CARTE_PLEINE).sus, 42, "les 42 modules ont été sus");
  assert.ok(seances > 60 && seances < 240, `${seances} séances`);
});
