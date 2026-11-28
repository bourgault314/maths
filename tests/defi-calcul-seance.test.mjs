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
// Lot F4 : ces tests suivent le parcours module par module — les tests de
// palier y sont déjà joués (tests/defi-calcul-lot-F4.test.mjs les joue).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});

// La carte du site : quatre modules construits (A2, M2, A5, D2). Et une
// carte où tout est construit, pour les grands nombres.
const CARTE_REELLE = CORE.carte();
// Les scénarios de ce fichier ont été écrits quand seuls les quatre pilotes
// étaient construits : ils jouent le MOTEUR sur cette carte-là (modules lot 1,
// 31/10/2026 : A1, A10, A11, M1 sont construits depuis ; la vraie carte a son
// propre test, juste en dessous).
const PILOTES = new Set(["A2", "A5", "M2", "D2"]);
const CARTE = {modules: CARTE_REELLE.modules.map(fiche => Object.assign({}, fiche, {construit: PILOTES.has(fiche.id)})), ordre: CARTE_REELLE.ordre};
const CARTE_PLEINE = {modules: CARTE.modules.map(fiche => Object.assign({}, fiche, {construit: fiche.paliers.some(Boolean)})), ordre: CARTE.ordre};
const J1 = "2026-11-02";
const plus = n => P.ajouterJours(J1, n);

// Un entraînement : `justes` justes de suite sans outil à la fin (réussi à 5),
// ou raté (25 calculs, jamais 5 de suite).
const reussie = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const ratee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: i % 2 ? "image" : "aucun"}));
// Lot 1 « la séance » (12/11/2026) : la ligne « Puis j'avance… » ({type:
// "avance"}) ne se joue pas ; ces scénarios regardent les étapes jouables.
const jouables = f => Object.assign({}, f, {etapes: f.etapes.filter(e => e.type !== "avance")});
const types = (parcours, jour, carte = CARTE) => jouables(P.fileSeance(parcours, carte, {aujourdhui: jour})).etapes.map(e => e.type);
const file = (parcours, jour, carte = CARTE) => jouables(P.fileSeance(parcours, carte, {aujourdhui: jour}));
// Le temps passe (lot 1) : la séance de 10 minutes est épuisée.
const tempsPasse = (p, secondes = 11 * 60) => P.noterTemps(p, secondes);

// Les gestes de la page, un par étape.
const ouvrir = (p, jour, carte = CARTE) => P.ouvrirSeance(p, carte, {aujourdhui: jour});
// Lot 2 « J'apprends en une étape » (12/11/2026) : J'apprends contient
// l'entraînement (on montre, puis l'élève fait jusqu'à 5 justes de suite).
const apprendre = (p, module, niveau, jour, carte = CARTE, reponses = reussie()) =>
  P.appliquerSerie(p, {module, niveau, genre: "apprends", reponses}, {aujourdhui: jour, carte, seance: true});
const entrainer = (p, module, niveau, reponses, jour, {carte = CARTE, seance = true, genre = "entraine", causes = {}} = {}) =>
  P.appliquerSerie(p, {module, niveau, genre, reponses, causes}, {aujourdhui: jour, carte, seance});
// Un test d'entrée : `marche` = la marche la plus haute prouvée.
const tester = (p, module, marche, jour, {carte = CARTE, seance = true} = {}) => {
  const k = P.NIVEAUX[module];
  const niveaux = Array.from({length: Math.min(k, marche + 1)}, (_, i) => ({niveau: i + 1, justes: i < marche ? 3 : 0, total: 3}));
  return P.appliquerTest(p, {module, marche, niveaux}, {aujourdhui: jour, carte, seance});
};
const repondre = (p, module, niveau, juste, jour, {ms = 2000, type = "P", cause = 0} = {}) =>
  P.appliquerRetour(p, {module, niveau, juste, ms, type, cause}, {aujourdhui: jour});
const finirJour = (p, jour, carte = CARTE) => P.terminerCalculsDuJour(p, {aujourdhui: jour, carte});

// Un parcours où des compétences sont déjà dans des boîtes : {"A5-1": [boîte, échéance, échecs]}.
function avecBoites(boites, base = sansTestDePalier(P.creerParcours())) {
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

test("l'ordre de la carte v3 : la séance suit les compétences, pas les modules", () => {
  assert.deepEqual(P.parcoursConstruit(CARTE).map(c => `${c.module}-${c.niveau}`),
    // (Lot K1b : A2-6 et A5-5, les moitiés du CE1 ; l'ordre des trois étages des bases.)
    ["A2-1", "A5-1", "A2-6", "A2-2", "A5-5", "A2-3", "M2-1", "A5-2", "A5-3", "A2-4", "M2-2", "D2-1", "A2-5", "A5-4", "D2-2", "D2-3", "D2-4"]);
  assert.equal(P.parcoursConstruit(CARTE_PLEINE).length, 151); // (lot K1b : neuf de plus, 132 avant)
  assert.deepEqual(P.parcoursConstruit(CARTE_PLEINE).slice(0, 4).map(c => `${c.module}-${c.niveau}`), ["A1-1", "A1-2", "A1-3", "A10-1"]);
  // Le palier est celui du niveau : A5 « + 9 » au CP, « + 98 » au CM2 (l'étage 5 depuis le lot K1b).
  assert.equal(P.palierDe(CARTE, "A5", 1), 1);
  assert.equal(P.palierDe(CARTE, "A5", 5), 2, "sa moitié du CE1, à la fin du module");
  assert.equal(P.palierDe(CARTE, "A5", 4), 5);
  assert.equal(P.palierDe(CARTE, "D2", 4), 6);
  // (Lot 7e-2 : « Compléments à la dizaine » et « … à 100 : dizaines » sont des procédures.)
  assert.equal(P.typeDe(CARTE, "A2", 1), "P");
  assert.equal(P.typeDe(CARTE, "A2", 2), "P");
  assert.equal(P.typeDe(CARTE, "M1", 1), "F");
  assert.equal(P.typeDe(CARTE, "A2", 3), "P");
  const compte = P.compter(sansTestDePalier(P.creerParcours()), CARTE);
  // (Lot 7e-2 : F8-3 passe du CM2 au CM1.)
  assert.deepEqual(compte.paliers.map(p => p.total), [14, 20, 19, 33, 43, 22]); // (lot K1b : six étages ; [44, 33, 43, 12] avant) // (lot 7c : F4-2 au CM2 ; lot 7d : M11 au CM1 ; lot 6 « programmes 2 »)
  assert.equal(compte.total, 151);
});

test("l'entraînement à couches : les perles 2 justes, l'image 2 justes, puis rien ; une erreur ramène l'image, deux les perles ; réussi à 5 justes de suite sans outil, raté à 25 ; « encore » : l'image d'abord, fini à 3", () => {
  const s = P.suivreEntrainement;
  const m = {juste: true, outil: "manip"};
  const i = {juste: true, outil: "image"};
  const a = {juste: true, outil: "aucun"};
  const faux = outil => ({juste: false, outil});
  assert.deepEqual(s([]), {outil: "manip", reussi: false, fini: false, arrete: false, justes: 0, total: 0, justesDeSuite: 0, sur: 0, objectif: 5, reprise: 1}); // (correctif F4 : `sur`)
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
  // Lot F4 (choix de Gwenaël) : 5 justes sur les 6 derniers sans aide. Une
  // erreur seule : le dessin pour UN calcul — juste, on repart sans aide, la
  // fenêtre est gardée ; deux de suite : à manipuler, la fenêtre repart.
  assert.equal(s([...debut, a, a, faux("aucun")]).outil, "image", "une erreur : le dessin, pour un calcul");
  assert.equal(s([...debut, a, a, faux("aucun"), i]).outil, "aucun", "juste avec le dessin : sans aide de nouveau");
  assert.equal(s([...debut, a, a, faux("aucun"), i, a, a]).reussi, false, "4 justes sur 5");
  assert.equal(s([...debut, a, a, faux("aucun"), i, a, a, a]).reussi, true, "5 justes sur les 6 derniers");
  assert.equal(s([...debut, a, a, faux("aucun"), i, a, a, a]).justesDeSuite, 5);
  assert.equal(s([...debut, a, faux("aucun"), i, a, faux("aucun"), i, a, a, a]).reussi, false, "deux erreurs dans les 6 derniers");
  assert.equal(s([...debut, a, a, a, a, faux("aucun"), faux("image")]).outil, "manip", "deux erreurs de suite : on repart des perles");
  assert.equal(s([...debut, a, a, a, a, faux("aucun"), faux("image"), m, i, a]).justesDeSuite, 1, "et la fenêtre repart");
  // J'apprends ne se rate plus (lot F4) : arrêté quand la séance a passé
  // son temps (4 calculs au moins), au plus tard au bout de 25.
  const ap = {genre: "apprends"};
  assert.equal(s([m, m, i], Object.assign({tempsFini: true}, ap)).fini, false, "3 calculs : on continue");
  assert.deepEqual([s([m, m, i, i], Object.assign({tempsFini: true}, ap)).fini, s([m, m, i, i], Object.assign({tempsFini: true}, ap)).arrete], [true, true]);
  assert.equal(s([m, m, i, i], {tempsFini: true, genre: "entraine"}).fini, false, "Je m'entraîne (le professeur) : pas d'arrêt au temps");
  assert.equal(s(ratee(), ap).arrete, true, "25 calculs");
  assert.equal(s(ratee().slice(0, 24), ap).fini, false);
  // Où il reprendra : au dessin, ou sans aide s'il y était.
  assert.equal(s([m, m, i, i], ap).reprise, 1);
  assert.equal(s([m, m, i, i, a], ap).reprise, 2);
  assert.equal(s([m, m, i, i, a, faux("aucun")], ap).reprise, 2, "le dessin d'un calcul : toujours sans aide");
  assert.equal(s([m, m, i, i, a, faux("aucun"), faux("image")], ap).reprise, 1, "deux erreurs de suite : au dessin");
  // La reprise : sans aide d'emblée, ou au dessin (jamais « on te montre »).
  assert.equal(s([], Object.assign({depart: 2}, ap)).outil, "aucun");
  assert.equal(s([], Object.assign({depart: 1}, ap)).outil, "image");
  assert.equal(s([a, a, a, a, a], Object.assign({depart: 2}, ap)).reussi, true);
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

test("Mes calculs du jour : la sorte, puis l'écriture, change d'un retour à l'autre", () => {
  ["A2-3", "A2-4", "A5-1", "M2-2", "D2-1"].forEach(cle => {
    const vues = new Set();
    const sortes = new Set();
    for (let tour = 0; tour < 12; tour += 1) {
      const calcul = CORE.genererUn(cle, 12345, {tour});
      assert.ok(calcul, cle);
      vues.add(calcul.forme);
      sortes.add(CORE.sorteDe(calcul));
    }
    // Lot 1 : chaque sorte du niveau revient (une à chaque retour).
    assert.equal(sortes.size, CORE.sortesDe(cle).length, `${cle} : toutes les sortes reviennent`);
    const toutes = new Set(CORE.genererSerie(cle, {graine: 12345, ordonne: false}).map(c => c.forme));
    assert.equal(vues.size, toutes.size, `${cle} : toutes les écritures reviennent à tour de rôle`);
    if (CORE.sortesDe(cle).length > 1) assert.notEqual(CORE.sorteDe(CORE.genererUn(cle, 12345, {tour: 0})), CORE.sorteDe(CORE.genererUn(cle, 12345, {tour: 1})), cle);
  });
});

// ------------------------------------------------------------- lot F1 « rythme »
//
// Décisions de Gwenaël du 07/11/2026 : les boîtes continuent (30 puis 60
// jours), 8 tests par séance, 1, 2 ou 3 nouveautés par séance réglées par le
// professeur pour la classe (1 par défaut et sans code).

// Une compétence non entrée et « commencée » (J'apprends fait) : la
// nouveauté de la séance est son entraînement.
function seanceNeuve(nouveautes, jour = J1) {
  const p = tester(ouvrir(sansTestDePalier(P.creerParcours()), jour), "A2", 2, jour).parcours;
  return P.ouvrirSeance(p, CARTE, {aujourdhui: plus(1), nouveautes});
}

// Les règles du lot F1 (« nouveautés par séance ») ont été remplacées par la
// séance au temps (lot 1 « la séance », 12/11/2026) : tests/defi-calcul-lot-1-seance.test.mjs.
