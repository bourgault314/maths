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
// ou raté (20 calculs, jamais 5 de suite).
const reussie = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const ratee = () => Array.from({length: 20}, (_, i) => ({juste: i % 3 !== 0, outil: i % 2 ? "image" : "aucun"}));
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
  // La compétence suivante de l'ORDRE : M2-1 (pas A2-3, qui vient plus loin) — et son module est intact : le test.
  assert.deepEqual(P.competenceCourante(p, CARTE), {module: "M2", niveau: 1});
  assert.deepEqual(types(p, J1), ["test", "nouveau"]);
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

test("la séance ordinaire : calculs du jour, la suite, J'apprends, Je m'entraîne — une nouveauté, puis c'est fini", () => {
  const J2 = plus(1);
  let p = tester(ouvrir(P.creerParcours(), J1), "A2", 2, J1).parcours;
  p = tester(p, "M2", 0, J1).parcours;
  // M2 raté dès la 1re marche : on apprend M2-1 dans la même séance.
  assert.deepEqual(types(p, J1), ["apprends", "entraine"]);
  p = apprendre(p, "M2", 1, J1).parcours;
  assert.equal(p.modules.M2.a[0], 1);
  let r = entrainer(p, "M2", 1, reussie(), J1);
  p = r.parcours;
  assert.deepEqual(r.evenements, [{type: "entree", module: "M2", niveau: 1, boite: 2}]);
  assert.equal(p.modules.M2.b[0], 2);
  assert.equal(p.modules.M2.e[0], J2);
  assert.equal(r.finie, true, "une nouveauté par séance : la séance est finie");
  assert.equal(file(p, J1).finie, true);
  assert.equal(p.seance.n, 1);
  // « Encore une séance » : la nouveauté suivante (A5-1, module intact : le test).
  assert.deepEqual(types(p, J1), ["test", "nouveau"]);
  // Le lendemain : A2-1 (boîte 4) n'est pas due, A2-2 non plus, M2-1 oui : 1 calcul du jour… complété à 10 au plus par l'entretien (3 entrées).
  const f = file(p, J2);
  assert.deepEqual(f.etapes.map(e => e.type), ["jour", "suite"]);
  assert.equal(f.etapes[0].calculs, 3);
  assert.deepEqual(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J2}).map(c => `${c.module}-${c.niveau}:${c.du}`), ["M2-1:true", "A2-2:false", "A2-1:false"]);
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
  assert.equal(P.SEUILS.rattrapage.nouveauteApres, true, "réglage du lot 3 : la nouveauté reprend une fois le rouge entraîné (réversible)");
  const J2 = plus(1);
  // A5-1 en route (boîte 2), due aujourd'hui ; A2-1 à apprendre après.
  let p = avecBoites({"A5-1": [2, J1], "A2-1": [3, plus(2)], "A2-2": [3, plus(2)], "M2-1": [3, plus(2)]});
  p = ouvrir(p, J1);
  assert.deepEqual(types(p, J1), ["jour", "suite"]);
  p = repondre(p, "A5", 1, false, J1).parcours;
  let r = finirJour(p, J1);
  p = r.parcours;
  assert.deepEqual(r.rouge, {module: "A5", niveau: 1});
  // La suite : l'entraînement de la rouge, avec l'aide, sans J'apprends (a = 1) ; pas de nouveauté.
  assert.deepEqual(types(p, J1), ["rattrape"]);
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
  assert.deepEqual(types(q, J2), ["jour", "suite"]);
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
  assert.deepEqual(types(p, J1), ["rattrape"]);
  p = entrainer(p, "A2", 1, reussie(), J1, {genre: "rattrape"}).parcours;
  assert.deepEqual(types(p, J1), ["test", "nouveau"], "le rouge entraîné, la nouveauté suit (A5-1, module intact)");
  // Demain : elle est due (boîte 3, revient demain), plus rouge ; juste, elle remonte en 4.
  assert.deepEqual(P.rouges(p, CARTE, J2), []);
  let q = ouvrir(p, J2);
  assert.deepEqual(types(q, J2), ["jour", "suite"]);
  q = repondre(q, "A2", 1, true, J2).parcours;
  assert.equal(q.modules.A2.b[0], 4);
  q = finirJour(q, J2).parcours;
  assert.deepEqual(types(q, J2), ["test", "nouveau"]);
});

test("deux rouges le même jour : une seule est entraînée par séance, l'autre à la séance suivante ; pas de nouveauté tant qu'il en reste une non entraînée", () => {
  let p = ouvrir(avecBoites({"A2-1": [2, J1], "A2-2": [2, J1], "M2-1": [3, plus(2)]}), J1);
  p = repondre(p, "A2", 1, false, J1).parcours;
  p = repondre(p, "A2", 2, false, J1).parcours;
  p = finirJour(p, J1).parcours;
  assert.deepEqual(file(p, J1).etapes, [{type: "rattrape", module: "A2", niveau: 1}], "la seconde rouge attend : pas de nouveauté");
  const r = entrainer(p, "A2", 1, reussie(), J1, {genre: "rattrape"});
  p = r.parcours;
  assert.equal(r.finie, true, "une rouge entraînée, une autre qui attend : la séance est finie");
  assert.equal(p.seance.n, 1);
  // Encore une séance : la seconde rouge, puis la nouveauté (M2-1 est entré : A5-1, module intact).
  let q = ouvrir(p, J1);
  assert.deepEqual(file(q, J1).etapes, [{type: "rattrape", module: "A2", niveau: 2}]);
  q = entrainer(q, "A2", 2, reussie(), J1, {genre: "rattrape"}).parcours;
  assert.deepEqual(types(q, J1), ["test", "nouveau"]);
});

test("l'entraînement à longueur adaptée : l'outil part après 2 justes, revient après une erreur, se manipule après 2 erreurs ; réussi à 5 justes de suite sans outil, raté à 20", () => {
  const s = P.suivreEntrainement;
  assert.deepEqual(s([]), {outil: "image", reussi: false, fini: false, justes: 0, total: 0, justesDeSuite: 0});
  assert.equal(s([{juste: true, outil: "image"}]).outil, "image");
  assert.equal(s([{juste: true, outil: "image"}, {juste: true, outil: "image"}]).outil, "aucun");
  const deux = [{juste: true, outil: "image"}, {juste: true, outil: "image"}];
  assert.equal(s([...deux, {juste: false, outil: "aucun"}]).outil, "image", "une erreur : l'outil revient");
  assert.equal(s([...deux, {juste: false, outil: "aucun"}, {juste: false, outil: "image"}]).outil, "manip", "deux erreurs de suite : à manipuler");
  assert.equal(s([...deux, {juste: false, outil: "aucun"}, {juste: false, outil: "image"}, {juste: true, outil: "manip"}]).outil, "image", "après les perles, la droite");
  assert.equal(s([...deux, {juste: false, outil: "aucun"}, {juste: false, outil: "image"}, {juste: true, outil: "manip"}, {juste: true, outil: "image"}]).outil, "aucun");
  const cinq = Array.from({length: 5}, () => ({juste: true, outil: "aucun"}));
  assert.equal(s([...deux, ...cinq]).reussi, true);
  assert.equal(s([...deux, ...cinq]).fini, true);
  assert.equal(s([...deux, ...cinq.slice(0, 4)]).reussi, false);
  assert.equal(s([...deux, ...cinq], {toutesFormesVues: false}).reussi, false, "une écriture pas encore vue : on continue");
  // Un juste avec l'outil ne compte pas dans les 5 sans outil.
  assert.equal(s([...deux, ...cinq.slice(0, 3), {juste: true, outil: "image"}, {juste: true, outil: "aucun"}]).justesDeSuite, 1);
  // 20 calculs sans y arriver : fini, raté.
  const r = s(ratee());
  assert.equal(r.fini, true);
  assert.equal(r.reussi, false);
  assert.equal(P.verdictEntrainement(reussie()).reussi, true);
  assert.equal(P.verdictEntrainement(ratee()).reussi, false);
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

test("Mes calculs du jour : 10 à 20, un par compétence, les plus en retard d'abord", () => {
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
  // Peu de dues : complétées à 10 par les plus proches.
  const peu = avecBoites({"A2-1": [2, J1], "A2-2": [3, plus(2)], "A5-1": [4, plus(6)], "M2-1": [5, plus(13)]});
  const t = P.tirerCalculsDuJour(peu, CARTE, {aujourdhui: J1});
  assert.deepEqual(t.map(c => `${c.module}-${c.niveau}:${c.du}`), ["A2-1:true", "A2-2:false", "A5-1:false", "M2-1:false"]);
  assert.deepEqual(P.tirerCalculsDuJour(peu, CARTE, {aujourdhui: J1, entretien: false}).length, 1);
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
        P.tirerCalculsDuJour(p, CARTE_PLEINE, {aujourdhui: jour, entretien: e.entretien}).forEach(c => {
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
