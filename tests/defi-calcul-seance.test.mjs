// Défi calcul, lot 3 : la séance guidée après le scénario d'un module et la
// carte v2 (30/10/2026) — les boîtes par compétence, l'ordre de la carte,
// le test d'entrée en escalier, l'entraînement à longueur adaptée, Mes
// calculs du jour, « le rouge d'abord », la reprise le jour même.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

// La carte du site : quatre modules construits (A2, M2, A5, D2). Et une
// carte où tout est construit, pour les grands nombres.
const CARTE = CORE.carte();
const CARTE_PLEINE = {modules: CARTE.modules.map(fiche => Object.assign({}, fiche, {construit: fiche.paliers.some(Boolean)})), ordre: CARTE.ordre};
const J1 = "2026-11-02";
const plus = n => P.ajouterJours(J1, n);

// Un entraînement : `justes` justes de suite sans outil à la fin (réussi à 5),
// ou raté (25 calculs, jamais 5 de suite).
const reussie = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const ratee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: i % 2 ? "image" : "aucun"}));
const types = (parcours, jour, carte = CARTE) => P.fileSeance(parcours, carte, {aujourdhui: jour}).etapes.map(e => e.type);
const file = (parcours, jour, carte = CARTE) => P.fileSeance(parcours, carte, {aujourdhui: jour});

// Les gestes de la page, un par étape.
const ouvrir = (p, jour, carte = CARTE) => P.ouvrirSeance(p, carte, {aujourdhui: jour});
const apprendre = (p, module, niveau, jour, carte = CARTE) =>
  P.appliquerSerie(p, {module, niveau, genre: "apprends"}, {aujourdhui: jour, carte, seance: true});
const entrainer = (p, module, niveau, reponses, jour, {carte = CARTE, seance = true, genre = "entraine", causes = {}} = {}) =>
  P.appliquerSerie(p, {module, niveau, genre, reponses, causes}, {aujourdhui: jour, carte, seance});
// Un test d'entrée : `marche` = la marche la plus haute prouvée.
const tester = (p, module, marche, jour, {carte = CARTE, seance = true} = {}) => {
  const k = P.NIVEAUX[module];
  const niveaux = Array.from({length: Math.min(k, marche + 1)}, (_, i) => ({niveau: i + 1, justes: i < marche ? 2 : 0, total: 2}));
  return P.appliquerTest(p, {module, marche, niveaux}, {aujourdhui: jour, carte, seance});
};
const repondre = (p, module, niveau, juste, jour, {ms = 2000, type = "P", cause = 0} = {}) =>
  P.appliquerRetour(p, {module, niveau, juste, ms, type, cause}, {aujourdhui: jour});
const finirJour = (p, jour, carte = CARTE) => P.terminerCalculsDuJour(p, {aujourdhui: jour, carte});

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

test("l'ordre de la carte v2 : la séance suit les compétences, pas les modules", () => {
  assert.deepEqual(P.parcoursConstruit(CARTE).map(c => `${c.module}-${c.niveau}`),
    ["A2-1", "A2-2", "M2-1", "A5-1", "A2-3", "A5-2", "A5-3", "A2-4", "M2-2", "D2-1", "A5-4", "D2-2", "D2-3", "D2-4"]);
  assert.equal(P.parcoursConstruit(CARTE_PLEINE).length, 129);
  assert.deepEqual(P.parcoursConstruit(CARTE_PLEINE).slice(0, 4).map(c => `${c.module}-${c.niveau}`), ["A1-1", "A1-2", "A1-3", "A10-1"]);
  // Le palier est celui du niveau : A5 « + 9 » aux bases, « + 98 » au CM2.
  assert.equal(P.palierDe(CARTE, "A5", 1), 1);
  assert.equal(P.palierDe(CARTE, "A5", 4), 3);
  assert.equal(P.palierDe(CARTE, "D2", 4), 4);
  assert.equal(P.typeDe(CARTE, "A2", 1), "F");
  assert.equal(P.typeDe(CARTE, "A2", 3), "P");
  const compte = P.compter(P.creerParcours(), CARTE);
  assert.deepEqual(compte.paliers.map(p => p.total), [37, 32, 45, 15]);
  assert.equal(compte.total, 129);
});

test("premier jour : pas de calculs du jour, la séance commence par le test du premier module", () => {
  const neuf = P.creerParcours();
  const f = file(neuf, J1);
  assert.deepEqual(f.etapes, [{type: "test", module: "A2"}, {type: "nouveau"}]);
  assert.equal(f.faites, 0);
  assert.equal(f.ouverte, false);
  assert.equal(f.finie, false);
  assert.deepEqual(P.competenceCourante(neuf, CARTE), {module: "A2", niveau: 1});
  assert.equal(P.moduleCourant(neuf, CARTE), "A2");
  assert.deepEqual(P.competenceCourante(neuf, CARTE_PLEINE), {module: "A1", niveau: 1});
  assert.deepEqual(P.competenceCourante(neuf, {modules: [], ordre: []}), null);
});

test("le test en escalier : la marche la plus haute en boîte 3, celles d'en dessous en boîte 4, le reste à apprendre", () => {
  let p = ouvrir(P.creerParcours(), J1);
  let r = tester(p, "A2", 2, J1);
  p = r.parcours;
  assert.deepEqual(p.modules.A2.b, [4, 3, 0, 0]);
  assert.deepEqual(p.modules.A2.e, [plus(7), plus(3), null, null]);
  assert.deepEqual(r.bilan.map(n => [n.connu, n.boite, n.jouee]), [[true, 4, true], [true, 3, true], [false, 0, true], [false, 0, false]]);
  assert.equal(r.marche, 2);
  assert.equal(r.tout, false);
  assert.equal(r.finie, false);
  // Les marches prouvées comptent comme « J'apprends fait » (31/10).
  assert.deepEqual(p.modules.A2.a, [1, 1, 0, 0]);
  // « Le niveau 3, tu vas l'apprendre maintenant » : A2-3, jouée au test sans être prouvée, vient tout
  // de suite — pas le test de M2, même si M2-1 la précède dans l'ordre de la carte (31/10).
  assert.deepEqual(P.competenceCourante(p, CARTE), {module: "A2", niveau: 3});
  assert.deepEqual(file(p, J1).etapes, [{type: "apprends", module: "A2", niveau: 3}, {type: "entraine", module: "A2", niveau: 3}]);
  // Rien prouvé : rien n'entre, le module n'est plus intact, on apprend.
  let q = tester(ouvrir(P.creerParcours(), J1), "A2", 0, J1).parcours;
  assert.deepEqual(q.modules.A2.b, [0, 0, 0, 0]);
  assert.deepEqual(types(q, J1), ["apprends", "entraine"]);
  assert.deepEqual(file(q, J1).etapes[0], {type: "apprends", module: "A2", niveau: 1});
  // Tout prouvé : tout est su sauf la dernière marche (en route), le module n'est pas encore « su ».
  q = tester(ouvrir(P.creerParcours(), J1), "M2", 2, J1).parcours;
  assert.deepEqual(q.modules.M2.b, [4, 3]);
  assert.equal(q.modules.M2.ok, null);
  // Le test ne touche pas une compétence déjà entrée.
  const deja = avecBoites({"A2-1": [2, J1]});
  r = tester(ouvrir(deja, J1), "A2", 3, J1);
  assert.deepEqual(r.parcours.modules.A2.b, [2, 4, 3, 0]);
});

test("au plus 4 tests par séance ; un élève qui sait tout traverse les modules", () => {
  let p = ouvrir(P.creerParcours(), J1);
  const joues = [];
  for (let i = 0; i < 6; i += 1) {
    const f = file(p, J1);
    if (!f.etapes.length || f.etapes[0].type !== "test") break;
    joues.push(f.etapes[0].module);
    p = tester(p, f.etapes[0].module, P.NIVEAUX[f.etapes[0].module], J1).parcours;
  }
  assert.deepEqual(joues, ["A2", "M2", "A5", "D2"]);
  // Tout est entré : plus rien à faire aujourd'hui, la séance est finie et comptée.
  assert.deepEqual(types(p, J1), []);
  assert.equal(p.seance.n, 1);
  assert.deepEqual(p.seances, [J1]);
  // Avec la carte pleine, le 5e module de la séance ne passe pas par le test : J'apprends.
  let q = ouvrir(P.creerParcours(), J1, CARTE_PLEINE);
  for (let i = 0; i < 4; i += 1) {
    const f = file(q, J1, CARTE_PLEINE);
    q = tester(q, f.etapes[0].module, P.NIVEAUX[f.etapes[0].module], J1, {carte: CARTE_PLEINE}).parcours;
  }
  assert.equal(types(q, J1, CARTE_PLEINE)[0], "apprends");
});

test("la séance ordinaire : calculs du jour, J'apprends, Je m'entraîne — une nouveauté, puis c'est fini", () => {
  const J2 = plus(1);
  let p = tester(ouvrir(P.creerParcours(), J1), "A2", 2, J1).parcours;
  // Arrêté à la marche 3 : on apprend A2-3 dans la même séance.
  assert.deepEqual(types(p, J1), ["apprends", "entraine"]);
  p = apprendre(p, "A2", 3, J1).parcours;
  assert.equal(p.modules.A2.a[2], 1);
  let r = entrainer(p, "A2", 3, reussie(), J1);
  p = r.parcours;
  assert.deepEqual(r.evenements, [{type: "entree", module: "A2", niveau: 3, boite: 2}]);
  assert.equal(p.modules.A2.b[2], 2);
  assert.equal(p.modules.A2.e[2], J2);
  assert.equal(r.finie, true, "une nouveauté par séance : la séance est finie");
  assert.equal(file(p, J1).finie, true);
  assert.equal(p.seance.n, 1);
  // « Encore une séance » : la nouveauté suivante (M2-1, module intact : le test).
  assert.deepEqual(file(p, J1).etapes, [{type: "test", module: "M2"}, {type: "nouveau"}]);
  // Le lendemain : A2-1 (boîte 4) et A2-2 (boîte 3) ne sont pas dues, A2-3 oui : 1 calcul du jour,
  // rien d'autre (31/10 : plus de calculs d'entretien).
  const f = file(p, J2);
  assert.deepEqual(f.etapes, [{type: "jour", calculs: 1}, {type: "test", module: "M2"}, {type: "nouveau"}], "le fil annonce la nouveauté dès le début");
  assert.equal(f.etapes[0].calculs, 1);
  assert.deepEqual(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J2}).map(c => `${c.module}-${c.niveau}:${c.du}`), ["A2-3:true"]);
});

test("Mes calculs du jour : juste et due, la boîte monte ; fausse, elle descend ; deux ratés et J'apprends est à refaire", () => {
  const J2 = plus(1);
  let p = avecBoites({"A5-1": [2, J1], "A5-2": [3, plus(2)], "A2-1": [4, J1]});
  let r = repondre(p, "A5", 1, true, J1);
  assert.equal(r.mouvement.sens, "monte");
  assert.equal(r.parcours.modules.A5.b[0], 3);
  assert.equal(r.parcours.modules.A5.e[0], plus(3));
  // Pas due : rien.
  r = repondre(p, "A5", 2, true, J1);
  assert.equal(r.mouvement.sens, "reste");
  assert.equal(r.parcours.modules.A5.b[1], 3);
  // Fausse : descend, revient demain, un échec ; rouge pour la séance.
  r = repondre(p, "A5", 2, false, J1);
  assert.equal(r.mouvement.sens, "descend");
  assert.equal(r.parcours.modules.A5.b[1], 2);
  assert.equal(r.parcours.modules.A5.e[1], J2);
  assert.equal(r.parcours.modules.A5.x[1], 1);
  assert.equal(r.mouvement.rouge, true);
  assert.equal(r.parcours.modules.A5.a[1], 1, "un seul raté : J'apprends reste fait");
  // Deuxième raté de suite : J'apprends à refaire.
  const r2 = repondre(r.parcours, "A5", 2, false, J2);
  assert.equal(r2.parcours.modules.A5.x[1], 2);
  assert.equal(r2.parcours.modules.A5.a[1], 0);
  assert.equal(r2.parcours.modules.A5.b[1], 1);
  // Une compétence sue (boîte 4) ratée : boîte 3, rouge pour la journée seulement.
  r = repondre(p, "A2", 1, false, J1);
  assert.equal(r.parcours.modules.A2.b[0], 3);
  assert.equal(r.mouvement.rouge, true);
  assert.deepEqual(P.rouges(r.parcours, CARTE, J1).map(c => `${c.module}-${c.niveau}`), ["A2-1"]);
  assert.deepEqual(P.rouges(r.parcours, CARTE, J2), [], "le lendemain, seule la boîte 1 est rouge");
  // Boîte 1 ratée : reste en boîte 1, rouge demain aussi.
  const q = repondre(avecBoites({"A5-1": [1, J1]}), "A5", 1, false, J1).parcours;
  assert.equal(q.modules.A5.b[0], 1);
  assert.deepEqual(P.rouges(q, CARTE, J2).length, 1);
  // Nulle part ailleurs une erreur ne descend.
  const e = entrainer(avecBoites({"A5-1": [3, J1]}), "A5", 1, ratee(), J1, {seance: false});
  assert.equal(e.parcours.modules.A5.b[0], 3);
  assert.equal(e.verdict.reussi, false);
});

test("la vitesse des faits : juste mais au-delà de 5 s, la boîte reste et revient demain", () => {
  const p = avecBoites({"A2-1": [2, J1]});
  const lent = repondre(p, "A2", 1, true, J1, {ms: 6000, type: "F"});
  assert.equal(lent.parcours.modules.A2.b[0], 2);
  assert.equal(lent.parcours.modules.A2.e[0], plus(1));
  assert.equal(lent.mouvement.sens, "reste");
  const rapide = repondre(p, "A2", 1, true, J1, {ms: 4000, type: "F"});
  assert.equal(rapide.parcours.modules.A2.b[0], 3);
  const procedure = repondre(p, "A2", 1, true, J1, {ms: 9000, type: "P"});
  assert.equal(procedure.parcours.modules.A2.b[0], 3);
});

test("le rouge d'abord : la compétence ratée est entraînée avec l'aide le jour même, avant la nouveauté ; ratée encore, elle refait J'apprends", () => {
  assert.equal(P.SEUILS.rattrapage.parSeance, 3, "31/10 : 3 rouges au plus par séance, puis la nouveauté vient toujours");
  const J2 = plus(1);
  // A5-1 en route (boîte 2), due aujourd'hui ; A2-1 à apprendre après.
  let p = avecBoites({"A5-1": [2, J1], "A2-1": [3, plus(2)], "A2-2": [3, plus(2)], "M2-1": [3, plus(2)]});
  p = ouvrir(p, J1);
  assert.equal(types(p, J1)[0], "jour");
  p = repondre(p, "A5", 1, false, J1).parcours;
  let r = finirJour(p, J1);
  p = r.parcours;
  assert.deepEqual(r.rouge, {module: "A5", niveau: 1});
  // La suite : l'entraînement de la rouge, avec l'aide, sans J'apprends (a = 1) ; puis la nouveauté.
  assert.deepEqual(types(p, J1), ["rattrape", "apprends", "entraine"]);
  r = entrainer(p, "A5", 1, reussie(), J1, {genre: "rattrape"});
  p = r.parcours;
  assert.equal(p.modules.A5.t[0], 1, "entraînée aujourd'hui");
  assert.equal(p.modules.A5.b[0], 1, "l'entraînement ne fait pas bouger la boîte");
  assert.equal(p.modules.A5.x[0], 1, "ni les échecs");
  // Le rouge est entraîné : la nouveauté reprend dans la même séance (A2-3 : J'apprends, puis Je m'entraîne).
  assert.equal(r.finie, false);
  assert.deepEqual(file(p, J1).etapes, [{type: "apprends", module: "A2", niveau: 3}, {type: "entraine", module: "A2", niveau: 3}]);
  p = apprendre(p, "A2", 3, J1).parcours;
  r = entrainer(p, "A2", 3, reussie(), J1);
  p = r.parcours;
  assert.equal(r.finie, true);
  // « Encore une séance » le même jour : rien de dû, la rouge est déjà entraînée ; la nouveauté suivante (A5-2) est à apprendre.
  assert.deepEqual(file(ouvrir(p, J1), J1).etapes.map(e => `${e.type}:${e.module}-${e.niveau}`), ["apprends:A5-2", "entraine:A5-2"]);
  // Le lendemain : A5-1 est due ; ratée encore → J'apprends, puis l'entraînement.
  let q = ouvrir(p, J2);
  assert.equal(types(q, J2)[0], "jour");
  q = repondre(q, "A5", 1, false, J2).parcours;
  assert.equal(q.modules.A5.a[0], 0);
  q = finirJour(q, J2).parcours;
  assert.deepEqual(types(q, J2).slice(0, 2), ["apprends", "rattrape"]);
  assert.deepEqual(file(q, J2).etapes[0], {type: "apprends", module: "A5", niveau: 1});
  q = apprendre(q, "A5", 1, J2).parcours;
  assert.deepEqual(file(q, J2).etapes[0], {type: "rattrape", module: "A5", niveau: 1});
  q = entrainer(q, "A5", 1, reussie(), J2, {genre: "rattrape"}).parcours;
  assert.deepEqual(file(q, J2).etapes[0].type, "apprends", "puis la nouveauté du jour");
  // Juste le surlendemain : la boîte remonte, plus rien de rouge.
  const J3 = plus(2);
  let s = ouvrir(q, J3);
  s = repondre(s, "A5", 1, true, J3).parcours;
  assert.equal(s.modules.A5.b[0], 2);
  assert.equal(s.modules.A5.x[0], 0);
  assert.deepEqual(P.rouges(s, CARTE, J3), []);
});

test("une compétence sue ratée : rouge pour la journée (entraînée avec l'aide), bleue demain, elle ne bloque plus", () => {
  const J2 = plus(1);
  let p = ouvrir(avecBoites({"A2-1": [4, J1], "A2-2": [4, plus(5)], "M2-1": [4, plus(5)]}), J1);
  p = repondre(p, "A2", 1, false, J1).parcours;
  assert.equal(p.modules.A2.b[0], 3);
  let r = finirJour(p, J1);
  p = r.parcours;
  assert.deepEqual(r.rouge, {module: "A2", niveau: 1});
  assert.deepEqual(types(p, J1), ["rattrape", "test", "nouveau"]);
  p = entrainer(p, "A2", 1, reussie(), J1, {genre: "rattrape"}).parcours;
  assert.deepEqual(types(p, J1), ["test", "nouveau"], "le rouge entraîné, la nouveauté suit (A5-1, module intact)");
  // Demain : elle est due (boîte 3, revient demain), plus rouge ; juste, elle remonte en 4.
  assert.deepEqual(P.rouges(p, CARTE, J2), []);
  let q = ouvrir(p, J2);
  assert.equal(types(q, J2)[0], "jour");
  q = repondre(q, "A2", 1, true, J2).parcours;
  assert.equal(q.modules.A2.b[0], 4);
  q = finirJour(q, J2).parcours;
  assert.deepEqual(types(q, J2), ["test", "nouveau"]);
});

test("plusieurs rouges le même jour : toutes entraînées, 3 au plus par séance, puis la nouveauté vient toujours", () => {
  let p = ouvrir(avecBoites({"A2-1": [2, J1], "A2-2": [2, J1], "M2-1": [3, plus(2)]}), J1);
  p = repondre(p, "A2", 1, false, J1).parcours;
  p = repondre(p, "A2", 2, false, J1).parcours;
  p = finirJour(p, J1).parcours;
  assert.deepEqual(file(p, J1).etapes, [{type: "rattrape", module: "A2", niveau: 1}, {type: "test", module: "A5"}, {type: "nouveau"}]);
  let r = entrainer(p, "A2", 1, reussie(), J1, {genre: "rattrape"});
  p = r.parcours;
  assert.equal(r.finie, false);
  assert.deepEqual(file(p, J1).etapes[0], {type: "rattrape", module: "A2", niveau: 2}, "la seconde rouge, dans la même séance");
  p = entrainer(p, "A2", 2, reussie(), J1, {genre: "rattrape"}).parcours;
  assert.deepEqual(types(p, J1), ["test", "nouveau"]);
  // Quatre rouges : 3 dans la séance (boîte la plus basse, puis l'ordre de la carte), puis la nouveauté ;
  // la 4e attend « Encore une séance ».
  let q = ouvrir(avecBoites({"A2-1": [2, J1], "A2-2": [2, J1], "M2-1": [2, J1], "A5-1": [2, J1]}), J1);
  ["A2-1", "A2-2", "M2-1", "A5-1"].forEach(cle => { const [m, n] = cle.split("-"); q = repondre(q, m, Number(n), false, J1).parcours; });
  q = finirJour(q, J1).parcours;
  const entrainees = [];
  for (let i = 0; i < 3; i += 1) {
    const e = file(q, J1).etapes[0];
    assert.equal(e.type, "rattrape");
    entrainees.push(`${e.module}-${e.niveau}`);
    q = entrainer(q, e.module, e.niveau, reussie(), J1, {genre: "rattrape"}).parcours;
  }
  assert.deepEqual(entrainees, ["A2-1", "A2-2", "M2-1"]);
  assert.deepEqual(file(q, J1).etapes, [{type: "apprends", module: "A2", niveau: 3}, {type: "entraine", module: "A2", niveau: 3}], "puis la nouveauté");
  q = apprendre(q, "A2", 3, J1).parcours;
  r = entrainer(q, "A2", 3, reussie(), J1);
  assert.equal(r.finie, true);
  q = ouvrir(r.parcours, J1);
  assert.deepEqual(file(q, J1).etapes[0], {type: "rattrape", module: "A5", niveau: 1}, "Encore une séance : la 4e rouge");
});

test("l'entraînement à couches : les perles 2 justes, l'image 2 justes, puis rien ; une erreur ramène l'image, deux les perles ; réussi à 5 justes de suite sans outil, raté à 25 ; « encore » : l'image d'abord, fini à 3", () => {
  const s = P.suivreEntrainement;
  const m = {juste: true, outil: "manip"};
  const i = {juste: true, outil: "image"};
  const a = {juste: true, outil: "aucun"};
  const faux = outil => ({juste: false, outil});
  assert.deepEqual(s([]), {outil: "manip", reussi: false, fini: false, justes: 0, total: 0, justesDeSuite: 0, objectif: 5});
  assert.equal(s([m]).outil, "manip");
  assert.equal(s([m, m]).outil, "image", "2 justes avec les perles : l'image");
  assert.equal(s([m, m, i]).outil, "image");
  assert.equal(s([m, m, i, i]).outil, "aucun", "2 justes avec l'image : plus rien");
  // Pas d'outil à manipuler (au-delà de 100 perles) : l'image d'abord.
  assert.equal(s([], {manip: false}).outil, "image");
  assert.equal(s([i, i], {manip: false}).outil, "aucun");
  assert.equal(s([faux("image"), faux("image")], {manip: false}).outil, "image", "sans perles, deux erreurs : l'image");
  const debut = [m, m, i, i];
  assert.equal(s([...debut, faux("aucun")]).outil, "image", "une erreur : l'image revient");
  assert.equal(s([...debut, faux("aucun"), faux("image")]).outil, "manip", "deux erreurs de suite : à manipuler");
  assert.equal(s([...debut, faux("aucun"), faux("image"), m]).outil, "image", "après ces perles-là, un juste suffit : la droite");
  assert.equal(s([...debut, faux("aucun"), faux("image"), m, i]).outil, "aucun");
  // Une erreur au milieu des perles du début : l'image (deux erreurs : les perles reviennent).
  assert.equal(s([m, faux("manip")]).outil, "image");
  const cinq = [a, a, a, a, a];
  assert.equal(s([...debut, ...cinq]).reussi, true);
  assert.equal(s([...debut, ...cinq]).fini, true);
  assert.equal(s([...debut, ...cinq.slice(0, 4)]).reussi, false);
  assert.equal(s([...debut, ...cinq], {toutesFormesVues: false}).reussi, false, "une écriture pas encore vue : on continue");
  // Un juste avec l'outil ne compte pas dans les 5 sans outil.
  assert.equal(s([...debut, a, a, a, i, a]).justesDeSuite, 1);
  // 25 calculs sans y arriver : fini, raté ; 24 : pas fini.
  assert.equal(s(ratee()).fini, true);
  assert.equal(s(ratee()).reussi, false);
  assert.equal(s(ratee().slice(0, 24)).fini, false);
  assert.equal(P.verdictEntrainement(reussie()).reussi, true);
  assert.equal(P.verdictEntrainement(ratee()).reussi, false);
  // Je m'entraîne encore : l'image d'abord, fini à 3 justes de suite sans aide (toutes les écritures : pas exigé), 20 au plus.
  const e = {genre: "rattrape"};
  assert.equal(s([], e).outil, "image");
  assert.equal(s([], e).objectif, 3);
  assert.equal(s([i, i], e).outil, "aucun");
  assert.equal(s([i, i, a, a, a], {genre: "rattrape", toutesFormesVues: false}).reussi, true);
  assert.equal(s([i, i, a, a], e).reussi, false);
  assert.equal(s(ratee().slice(0, 20), e).fini, true);
  assert.equal(P.verdictEntrainement([i, i, a, a, a], e).reussi, true);
});

test("entraînement raté : la séance s'arrête, rien de nouveau aujourd'hui, demain repart de J'apprends", () => {
  const J2 = plus(1);
  let p = tester(ouvrir(P.creerParcours(), J1), "A2", 0, J1).parcours;
  p = apprendre(p, "A2", 1, J1).parcours;
  const r = entrainer(p, "A2", 1, ratee(), J1);
  p = r.parcours;
  assert.equal(r.verdict.reussi, false);
  assert.equal(r.finie, true);
  assert.equal(p.modules.A2.b[0], 0);
  assert.equal(p.modules.A2.a[0], 0, "J'apprends à refaire");
  assert.equal(p.seance.p[P.PLAN.nouveaute], P.NOUVEAUTE.arretee);
  assert.deepEqual(types(p, J1), [], "rien de nouveau avant demain");
  assert.deepEqual(types(ouvrir(p, J1), J1), []);
  assert.equal(file(p, J1).finie, true);
  assert.deepEqual(types(p, J2), ["apprends", "entraine"]);
  assert.deepEqual(file(p, J2).etapes[0], {type: "apprends", module: "A2", niveau: 1});
});

test("Mes calculs du jour : seulement les dues, 20 au plus, un par compétence, les plus en retard d'abord", () => {
  const boites = {};
  const cles = P.parcoursConstruit(CARTE_PLEINE).map(c => `${c.module}-${c.niveau}`);
  cles.forEach((cle, i) => { boites[cle] = [1 + (i % 5), plus(-(i % 7))]; });
  const plein = avecBoites(boites);
  const tirage = P.tirerCalculsDuJour(plein, CARTE_PLEINE, {aujourdhui: J1});
  assert.equal(tirage.length, 20);
  assert.ok(tirage.every(c => c.du));
  // Les boîtes les plus basses d'abord, puis les échéances les plus anciennes.
  const boitesTirees = tirage.map(c => plein.modules[c.module].b[c.niveau - 1]);
  assert.deepEqual(boitesTirees, [...boitesTirees].sort());
  // Peu de dues : rien n'est ajouté (31/10 : plus de calculs d'entretien).
  const peu = avecBoites({"A2-1": [2, J1], "A2-2": [3, plus(2)], "A5-1": [4, plus(6)], "M2-1": [5, plus(13)]});
  assert.deepEqual(P.tirerCalculsDuJour(peu, CARTE, {aujourdhui: J1}).map(c => `${c.module}-${c.niveau}:${c.du}`), ["A2-1:true"]);
  // Rien de dû : l'étape disparaît de la séance.
  const rien = avecBoites({"A2-1": [3, plus(2)], "A2-2": [3, plus(2)], "M2-1": [3, plus(2)]});
  assert.deepEqual(P.tirerCalculsDuJour(rien, CARTE, {aujourdhui: J1}), []);
  assert.equal(file(ouvrir(rien, J1), J1).etapes[0].type, "test");
});

test("module su : toutes ses compétences en boîte 4 ; ok est posé une fois et ne s'efface pas", () => {
  let p = avecBoites({"M2-1": [3, J1], "M2-2": [4, plus(3)]});
  let r = repondre(p, "M2", 1, true, J1);
  assert.equal(r.parcours.modules.M2.ok, J1);
  assert.deepEqual(r.evenements, [{type: "module", module: "M2"}]);
  assert.equal(P.etatModule(r.parcours, "M2", CARTE).etat, "su");
  // Un test qui prouve tout : les marches basses en 4, la haute en 3 : pas encore su.
  const q = tester(ouvrir(P.creerParcours(), J1), "M2", 2, J1).parcours;
  assert.equal(q.modules.M2.ok, null);
  // Une compétence qui redescend : ok reste, l'état dit « à revoir » quand elle est en boîte 1.
  let s = r.parcours;
  s = repondre(s, "M2", 1, false, plus(3)).parcours;
  s = repondre(s, "M2", 1, false, plus(4)).parcours;
  s = repondre(s, "M2", 1, false, plus(5)).parcours;
  assert.equal(s.modules.M2.ok, J1);
  assert.equal(s.modules.M2.b[0], 1);
  assert.equal(P.etatModule(s, "M2", CARTE).etat, "revoir");
  const compte = P.compter(s, CARTE);
  assert.equal(compte.modulesSus, 1);
  assert.equal(compte.sues, 1);
  assert.equal(compte.competences.rouge, 1);
});

test("arrêter et reprendre : les étapes faites restent faites, le jour même, ici ou ailleurs ; la veille non finie ne compte pas", () => {
  const J2 = plus(1);
  let p = avecBoites({"A2-1": [2, J1], "A2-2": [3, plus(2)], "M2-1": [3, plus(2)]});
  p = ouvrir(p, J1);
  assert.equal(P.seanceOuverte(p, J1), true);
  p = repondre(p, "A2", 1, true, J1).parcours;
  p = finirJour(p, J1).parcours;
  const f = file(p, J1);
  assert.equal(f.faites, 1);
  assert.deepEqual(f.etapes.map(e => e.type), ["test", "nouveau"], "A5-1 vient, A5 est intact");
  // Sur un autre appareil, après fusion : la même file.
  const ailleurs = P.fusionner(P.creerParcours(), p);
  assert.deepEqual(file(ailleurs, J1).etapes, f.etapes);
  assert.equal(file(ailleurs, J1).faites, 1);
  // Le lendemain : la séance de la veille ne compte pas, la file est reconstruite.
  assert.equal(P.seanceOuverte(p, J2), false);
  assert.equal(file(p, J2).faites, 0);
  assert.deepEqual(p.seances, []);
});

test("tout est entré : la séance, ce sont les calculs du jour ; rien de dû à la seconde séance : à demain", () => {
  const boites = {};
  P.parcoursConstruit(CARTE).forEach(c => { boites[`${c.module}-${c.niveau}`] = [3, J1]; });
  let p = ouvrir(avecBoites(boites), J1);
  assert.deepEqual(types(p, J1), ["jour"]);
  assert.equal(P.competenceCourante(p, CARTE), null);
  P.parcoursConstruit(CARTE).forEach(c => { p = repondre(p, c.module, c.niveau, true, J1).parcours; });
  const r = finirJour(p, J1);
  assert.equal(r.finie, true);
  assert.deepEqual(types(r.parcours, J1), []);
  assert.equal(file(r.parcours, J1).finie, true);
  const d = P.demain(r.parcours, CARTE, {aujourdhui: J1});
  assert.equal(d.prochaine, null);
  assert.equal(d.rouge, null);
});

test("une année de séances : jamais plus de 20 calculs du jour, une nouveauté par séance, tout finit vert", () => {
  // Un élève qui réussit presque tout, sur la carte pleine (129 compétences).
  const rng = CORE.mulberry32(20261030);
  let p = P.creerParcours();
  let jour = J1;
  let maxCalculs = 0;
  let maxEtapes = 0;
  for (let d = 0; d < 400 && !(P.competenceCourante(p, CARTE_PLEINE) === null && P.compter(p, CARTE_PLEINE).sues === 129); d += 1) {
    jour = plus(d);
    p = ouvrir(p, jour, CARTE_PLEINE);
    let etapes = 0;
    let nouveautes = 0;
    const nAvant = p.seance.n;
    for (let garde = 0; garde < 12; garde += 1) {
      const f = file(p, jour, CARTE_PLEINE);
      if (!f.etapes.length || p.seance.n > nAvant) break;
      const e = f.etapes[0];
      etapes += 1;
      if (e.type === "jour") {
        maxCalculs = Math.max(maxCalculs, e.calculs);
        P.tirerCalculsDuJour(p, CARTE_PLEINE, {aujourdhui: jour}).forEach(c => {
          p = repondre(p, c.module, c.niveau, rng() < 0.92, jour, {type: P.typeDe(CARTE_PLEINE, c.module, c.niveau), ms: 3000}).parcours;
        });
        p = finirJour(p, jour, CARTE_PLEINE).parcours;
      } else if (e.type === "test") {
        p = tester(p, e.module, rng() < 0.5 ? P.NIVEAUX[e.module] : Math.floor(rng() * P.NIVEAUX[e.module]), jour, {carte: CARTE_PLEINE}).parcours;
      } else if (e.type === "apprends") {
        p = apprendre(p, e.module, e.niveau, jour, CARTE_PLEINE).parcours;
      } else {
        if (e.type === "entraine") nouveautes += 1;
        p = entrainer(p, e.module, e.niveau, rng() < 0.85 ? reussie() : ratee(), jour, {carte: CARTE_PLEINE, genre: e.type}).parcours;
      }
    }
    maxEtapes = Math.max(maxEtapes, etapes);
    assert.ok(nouveautes <= 1, `${jour} : ${nouveautes} nouveautés`);
    assert.ok(p.seance.n === nAvant + 1 || !file(p, jour, CARTE_PLEINE).etapes.length, `${jour} : la séance se finit`);
  }
  assert.ok(maxCalculs <= 20);
  assert.ok(maxEtapes <= 9, `${maxEtapes} étapes`);
  assert.equal(P.competenceCourante(p, CARTE_PLEINE), null, "tout est entré");
  const compte = P.compter(p, CARTE_PLEINE);
  assert.equal(compte.sues, 129, `${compte.sues} sues`);
  assert.ok(P.mesurer(p).cles < 2000 && P.mesurer(p).octets < 40000);
});

// Relecture Codex (31/10) : la marche annoncée par la page ne dépasse jamais
// ce que les résultats prouvent (2 justes par marche, montées l'une après
// l'autre). `marche: 4` avec un seul niveau joué à 0/2 n'entre rien.
test("le test d'entrée : la marche est bornée par les résultats", () => {
  const trafique = P.appliquerTest(P.creerParcours(), {module: "A2", marche: 4, niveaux: [{niveau: 1, justes: 0, total: 2}]}, {aujourdhui: "2026-10-31", carte: CARTE, seance: true});
  assert.equal(trafique.marche, 0);
  assert.equal(trafique.tout, false);
  assert.deepEqual(trafique.parcours.modules.A2.b, [0, 0, 0, 0], "rien n'entre");
  // Un trou dans l'escalier n'est pas une marche prouvée : 2/2, 1/3, 2/2 → marche 1.
  const trou = P.appliquerTest(P.creerParcours(), {module: "A2", marche: 3, niveaux: [{niveau: 1, justes: 2, total: 2}, {niveau: 2, justes: 1, total: 3}, {niveau: 3, justes: 2, total: 2}]}, {aujourdhui: "2026-10-31", carte: CARTE});
  assert.equal(trou.marche, 1);
  assert.deepEqual(trou.parcours.modules.A2.b, [3, 0, 0, 0]);
  // Le test honnête : inchangé.
  assert.deepEqual(tester(P.creerParcours(), "A2", 2, "2026-10-31").parcours.modules.A2.b, [4, 3, 0, 0]);
  assert.deepEqual(tester(P.creerParcours(), "A2", 4, "2026-10-31").parcours.modules.A2.b, [4, 4, 4, 3]);
});

// Lot 3b (31/10) : l'élève coincé. Au 3e échec de suite dans Mes calculs du
// jour, la compétence est mise de côté 3 jours (boîte 1, pas rouge, ne bloque
// rien), signalée « à voir en classe » ; elle revient par J'apprends et « Je
// m'entraîne encore », puis par Mes calculs du jour ; un calcul du jour juste
// remet tout à zéro.
test("l'élève coincé : 3 échecs de suite, mise de côté 3 jours, signalée, puis elle revient par J'apprends", () => {
  let p = avecBoites({"A5-1": [2, J1], "A2-1": [3, plus(9)], "A2-2": [3, plus(9)], "M2-1": [3, plus(9)]});
  p = repondre(p, "A5", 1, false, J1).parcours;
  p = repondre(p, "A5", 1, false, plus(1)).parcours;
  assert.equal(p.modules.A5.x[0], 2);
  assert.equal(P.aVoirEnClasse(p.modules.A5, 0), false);
  const r = repondre(p, "A5", 1, false, plus(2));
  p = r.parcours;
  assert.equal(r.mouvement.deCote, true);
  assert.equal(r.mouvement.rouge, false, "mise de côté : pas rouge");
  assert.equal(p.modules.A5.x[0], 3);
  assert.equal(p.modules.A5.b[0], 1);
  assert.equal(p.modules.A5.a[0], 0);
  assert.equal(p.modules.A5.e[0], plus(5), "revient dans 3 jours");
  assert.equal(P.aVoirEnClasse(p.modules.A5, 0), true, "à voir en classe");
  // Pendant ses jours de côté : pas rouge, pas dans Mes calculs du jour, elle ne bloque rien.
  [plus(2), plus(3), plus(4)].forEach(jour => {
    assert.deepEqual(P.rouges(p, CARTE, jour), [], jour);
    assert.deepEqual(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}), [], jour);
  });
  p = P.terminerCalculsDuJour(p, {aujourdhui: plus(2), carte: CARTE}).parcours;
  assert.equal(file(p, plus(2)).etapes[0].type, "apprends", "la nouveauté du jour (A2-3) vient quand même");
  // Le jour où elle revient : pas dans Mes calculs du jour (J'apprends d'abord), rouge : J'apprends puis « encore ».
  const J = plus(5);
  assert.deepEqual(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J}).map(c => `${c.module}-${c.niveau}`), []);
  let q = ouvrir(p, J);
  assert.deepEqual(file(q, J).etapes.slice(0, 2), [{type: "apprends", module: "A5", niveau: 1}, {type: "rattrape", module: "A5", niveau: 1}]);
  q = apprendre(q, "A5", 1, J).parcours;
  q = entrainer(q, "A5", 1, reussie(), J, {genre: "rattrape"}).parcours;
  assert.equal(q.modules.A5.b[0], 1, "« encore » ne fait pas bouger la boîte");
  assert.equal(P.aVoirEnClasse(q.modules.A5, 0), true, "toujours signalée tant qu'un calcul du jour n'est pas juste");
  // Le lendemain : elle est dans Mes calculs du jour. Juste : tout repart à zéro.
  const L = plus(6);
  assert.deepEqual(P.tirerCalculsDuJour(q, CARTE, {aujourdhui: L}).map(c => `${c.module}-${c.niveau}`), ["A5-1"]);
  const juste = repondre(q, "A5", 1, true, L).parcours;
  assert.equal(juste.modules.A5.x[0], 0);
  assert.equal(juste.modules.A5.b[0], 2);
  assert.equal(P.aVoirEnClasse(juste.modules.A5, 0), false);
  // Fausse encore : de nouveau mise de côté 3 jours.
  const encore = repondre(q, "A5", 1, false, L);
  assert.equal(encore.mouvement.deCote, true);
  assert.equal(encore.parcours.modules.A5.e[0], P.ajouterJours(L, 3));
  // La borne du format : x va jusqu'à 3.
  assert.equal(P.normaliserParcours({modules: {A5: {b: [1], x: [3]}}}).modules.A5.x[0], 3);
  assert.equal(P.normaliserParcours({modules: {A5: {b: [1], x: [4]}}}).modules.A5.x[0], 0);
});

test("Mes calculs du jour : l'écriture change d'un retour à l'autre", () => {
  ["A2-3", "A2-4", "A5-1", "M2-2", "D2-1"].forEach(cle => {
    const vues = new Set();
    for (let tour = 0; tour < 6; tour += 1) {
      const calcul = CORE.genererUn(cle, 12345, {tour});
      assert.ok(calcul, cle);
      vues.add(calcul.forme);
    }
    const toutes = new Set(CORE.genererSerie(cle, {graine: 12345, ordonne: false}).map(c => c.forme));
    assert.equal(vues.size, toutes.size, `${cle} : toutes les écritures reviennent à tour de rôle`);
    if (toutes.size > 1) assert.notEqual(CORE.genererUn(cle, 12345, {tour: 0}).forme, CORE.genererUn(cle, 12345, {tour: 1}).forme, cle);
  });
});
