// Anzan, barème révisé (22/11/2026) : ce que le PARCOURS garde des grades et
// de leurs étapes — le moteur de l'appli (flash_anzan_parcours.js) et sa copie
// de la page prof. Un grade se gagne en réussissant ses étapes, dans l'ordre :
// 65 étapes au Flash (numéros 101 … 165), 26 en Colonne (201 … 226). À côté
// des séances, « etapeFlash » et « etapeColonne » gardent le RANG de la plus
// haute étape réussie. L'ancienne grille (numéros de grade 1 … 53, clés
// « gradeReussi » et « gradeColonne ») ne se lit plus : aucun élève n'avait
// commencé, tout repart du 20e kyu.
//
// Ce fichier remplace flash-anzan-grades.test.mjs, flash-anzan-grades-colonne
// .test.mjs et flash-anzan-entrainement.test.mjs (l'ancienne grille). Les
// tirages sont dans flash-anzan-etapes.test.mjs, la page est jouée dans
// flash-anzan-seance.test.mjs. La fin joue la check-list de fusion d'AGENTS.md
// (« Fusion des données : modèle commun ») sur les étapes.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");
const PARCOURS = require("../outils/calcul_mental/flash_anzan_parcours.js");

const JOUR = "2026-11-22";
const NUMEROS = [...CORE.ETAPES_FLASH, ...CORE.ETAPES_COLONNE].map(e => e.numero);
const FLASH = CORE.normaliser("flash", {});
const json = x => JSON.stringify(x);
// Une séance d'étape telle que la page la note.
const noter = (p, id, mode, numero, faits, score, jour = JOUR) =>
  PARCOURS.noterSeance(p, {id, mode, reglages: CORE.reglagesEtape(numero, "bip", mode === "entrainement" ? 5 : 10), faits, score}, jour).parcours;
const libre = (p, id, jour = JOUR) => PARCOURS.noterSeance(p, {id, mode: "flash", reglages: FLASH, faits: 3, score: 2}, jour).parcours;
// La liste de douze scalaires d'une séance d'étape, telle que le serveur la garde.
const liste = (mode, numero, calculs, faits = calculs, score = faits, id = 7, ordre = 1, jour = JOUR) => {
  const e = PARCOURS.etape(numero);
  return [jour, mode, e.operations, e.chiffresMin, e.chiffresMax, e.nombres, numero, calculs, faits, score, id, ordre];
};
const garde = l => PARCOURS.normaliserSeance(l) !== null;
const brut = plus => ({version: 1, epoque: 0, reglages: {}, seances: {}, ...plus});

// ------------------------------------------------------------- la grille

test("la grille des étapes est recopiée à l'identique dans le moteur du parcours : 65 au Flash, 26 en Colonne, le grade, les chiffres, les nombres et les opérations de chacune", () => {
  assert.equal(PARCOURS.NB_ETAPES_FLASH, 65);
  assert.equal(PARCOURS.NB_ETAPES_COLONNE, 26);
  assert.equal(PARCOURS.ETAPES_FLASH.length, CORE.ETAPES_FLASH.length);
  assert.equal(PARCOURS.ETAPES_COLONNE.length, CORE.ETAPES_COLONNE.length);
  assert.deepEqual([PARCOURS.ETAPE_FLASH, PARCOURS.ETAPE_COLONNE], [CORE.ETAPE_FLASH, CORE.ETAPE_COLONNE]);
  assert.deepEqual([PARCOURS.ETAPE_FLASH, PARCOURS.ETAPE_COLONNE], [100, 200], "hors de l'ancienne grille (1 … 53) : ancien et nouveau code ne se lisent jamais de travers");
  for (const numero of NUMEROS) {
    const r = CORE.reglagesEtape(numero, "bip");
    assert.deepEqual({...PARCOURS.etape(numero)},
      {numero, grade: r.grade, chiffresMin: r.chiffresMin, chiffresMax: r.chiffresMax, nombres: r.nombres, operations: r.operations}, `étape ${numero}`);
    assert.equal(PARCOURS.rangEtape(numero), CORE.rangEtape(numero), `rang de ${numero}`);
    assert.equal(PARCOURS.numeroEtape(PARCOURS.rangEtape(numero), numero > 200), numero);
  }
  for (const numero of [0, 1, 20, 41, 53, 100, 166, 200, 227, 300, -101, 101.5, "101", null]) assert.equal(PARCOURS.etape(numero), null, `${numero} n'est pas une étape`);
  for (let n = 1; n <= CORE.DERNIER_GRADE; n += 1) {
    assert.equal(PARCOURS.nomGrade(n), CORE.nomGrade(n));
    assert.deepEqual(PARCOURS.etapesDuGrade(n).map(e => e.numero), CORE.etapesDuGrade(n).map(e => e.numero), `les étapes du grade ${n}`);
    assert.equal(PARCOURS.seuilGrade(n), CORE.seuilGrade(n));
    assert.ok(PARCOURS.etapesDuGrade(n).length >= 1, `le grade ${n} a au moins une étape`);
  }
  assert.deepEqual([PARCOURS.NB_GRADES, PARCOURS.NB_GRADES_COLONNE, PARCOURS.PREMIER_COLONNE, PARCOURS.DERNIER_GRADE],
    [CORE.NB_GRADES, CORE.NB_GRADES_COLONNE, CORE.PREMIER_COLONNE, CORE.DERNIER_GRADE]);
  assert.deepEqual([PARCOURS.NB_GRADES, PARCOURS.NB_GRADES_COLONNE, PARCOURS.PREMIER_COLONNE, PARCOURS.DERNIER_GRADE], [40, 10, 41, 50]);
  assert.deepEqual([PARCOURS.GRADE_CALCULS, PARCOURS.GRADE_REUSSI, PARCOURS.SEUIL_COLONNE], [CORE.GRADE_CALCULS, CORE.GRADE_REUSSI, CORE.SEUIL_COLONNE]);
  assert.deepEqual([PARCOURS.GRADE_CALCULS, PARCOURS.GRADE_REUSSI, PARCOURS.SEUIL_COLONNE], [10, 7, 8], "7 sur 10 au Flash, 8 sur 10 en Colonne");
  assert.deepEqual([...PARCOURS.ENTRAINEMENT_CALCULS], [...CORE.ENTRAINEMENT_CALCULS]);
  assert.deepEqual([...CORE.ENTRAINEMENT_CALCULS], [5], "« M'entraîner » : 5 calculs, un seul bouton (choix du 22/11/2026)");
  assert.equal(PARCOURS.estGradeColonne(40), false);
  assert.equal(PARCOURS.estGradeColonne(41), true);
  assert.equal(PARCOURS.estGradeColonne(50), true);
  assert.equal(PARCOURS.estGradeColonne(51), false, "les dan de Colonne viendront au lot 2");
});

test("le verdict : au Flash réussi à 7, presque à 5 ou 6 ; en Colonne réussi à 8, presque à 6 ou 7 ; un passage incomplet est « arrêté »", () => {
  assert.deepEqual([10, 7, 6, 5, 4].map(s => CORE.verdictGrade(10, s)), ["reussi", "reussi", "presque", "presque", "pasencore"]);
  assert.deepEqual([10, 7, 6, 5, 4].map(s => CORE.verdictGrade(10, s, 1)), ["reussi", "reussi", "presque", "presque", "pasencore"]);
  assert.deepEqual([10, 8, 7, 6, 5].map(s => CORE.verdictGrade(10, s, 41)), ["reussi", "reussi", "presque", "presque", "pasencore"]);
  assert.equal(CORE.verdictGrade(9, 9), "arrete");
  assert.equal(CORE.verdictGrade(9, 9, 41), "arrete");
});

test("les noms japonais — 二十級 … 一級, 初段 … 二十段 au Flash ; 十級 … 一級 en Colonne", () => {
  const attendus = ["二十級", "十九級", "十八級", "十七級", "十六級", "十五級", "十四級", "十三級", "十二級", "十一級",
    "十級", "九級", "八級", "七級", "六級", "五級", "四級", "三級", "二級", "一級",
    "初段", "二段", "三段", "四段", "五段", "六段", "七段", "八段", "九段", "十段",
    "十一段", "十二段", "十三段", "十四段", "十五段", "十六段", "十七段", "十八段", "十九段", "二十段"];
  assert.deepEqual(attendus.map((_, i) => CORE.nomJaponais(i + 1)), attendus);
  assert.deepEqual([41, 42, 43, 44, 45, 46, 47, 48, 49, 50].map(n => CORE.nomJaponais(n)), ["十級", "九級", "八級", "七級", "六級", "五級", "四級", "三級", "二級", "一級"]);
  assert.deepEqual([41, 50].map(n => CORE.nomGrade(n)), ["10e kyu", "1er kyu"], "plus de grades « pré- »");
  assert.equal(CORE.nomGrade(0), "");
  assert.equal(CORE.nomGrade(51), "");
});

// ------------------------------------------------------------- une séance

test("une séance d'étape : le passage en 10 calculs, l'entraînement en 5, à sa ligne exacte de la grille — rien d'approché", () => {
  for (const numero of NUMEROS) {
    assert.ok(garde(liste("grade", numero, 10)), `passage ${numero} en 10`);
    assert.ok(garde(liste("entrainement", numero, 5)), `entraînement ${numero} en 5`);
    assert.ok(!garde(liste("grade", numero, 5)), `passage ${numero} en 5 : jeté`);
    assert.ok(!garde(liste("entrainement", numero, 10)), `entraînement ${numero} en 10 : jeté`);
    assert.ok(!garde(liste("grade", numero, 20)), `passage ${numero} en 20 : jeté`);
    for (const [champ, nom] of [[3, "chiffresMin"], [4, "chiffresMax"], [5, "nombres"]]) {
      const fausse = liste("grade", numero, 10);
      fausse[champ] += 1;
      assert.ok(!garde(fausse), `étape ${numero}, ${nom} qui ne suit pas la grille : jetée`);
    }
    const autresSignes = liste("grade", numero, 10);
    autresSignes[2] = autresSignes[2] === "plus" ? "plusmoins" : "plus";
    assert.ok(!garde(autresSignes), `étape ${numero} : les opérations de la grille seulement`);
    // Ce que la page écrit pour cette étape est exactement ce que le parcours relit.
    const r = CORE.reglagesEtape(numero, "bip");
    const p = PARCOURS.noterSeance(PARCOURS.creer(), {id: 3, mode: "grade", reglages: r, faits: 10, score: 4}, JOUR).parcours;
    assert.deepEqual(p.seances["1"], liste("grade", numero, 10, 10, 4, 3, 1), `étape ${numero} : la séance notée`);
  }
  // Les bornes : au plus 10 faits et 10 justes en passage, 5 et 5 à l'entraînement.
  const trop = PARCOURS.normaliserSeance(liste("grade", 101, 10, 12, 11));
  assert.deepEqual([trop.calculs, trop.faits, trop.score], [10, 10, 10]);
  const trop5 = PARCOURS.normaliserSeance(liste("entrainement", 101, 5, 9, 9));
  assert.deepEqual([trop5.calculs, trop5.faits, trop5.score], [5, 5, 5]);
  // Le champ « temps » d'une séance d'étape porte son numéro.
  assert.equal(PARCOURS.normaliserSeance(liste("grade", 209, 10)).temps, 209);
  // Aucun numéro hors de la grille : ni l'ancienne (1 … 53), ni au-delà.
  for (const numero of [1, 8, 20, 21, 40, 41, 53, 100, 166, 200, 227, 253]) {
    for (const mode of ["grade", "entrainement"]) {
      assert.ok(!garde([JOUR, mode, "plus", 1, 1, 3, numero, mode === "grade" ? 10 : 5, 5, 5, 7, 1]), `${mode} ${numero} : jeté`);
    }
  }
});

test("l'historique d'une étape : son numéro, son grade, « réussie » au seuil de son mode ; les mots de la liste", () => {
  let p = noter(PARCOURS.creer(), 1, "grade", 101, 10, 7);
  p = noter(p, 2, "grade", 102, 10, 6);
  p = noter(p, 3, "entrainement", 102, 5, 5);
  p = noter(p, 4, "grade", 201, 10, 7);
  p = noter(p, 5, "grade", 201, 10, 8);
  p = noter(p, 6, "grade", 124, 10, 3);
  p = noter(p, 7, "grade", 125, 7, 7);
  p = noter(p, 8, "entrainement", 125, 5, 2);
  const h = PARCOURS.historique(p).slice().reverse();
  assert.deepEqual(h.map(s => [s.mode, s.etape, s.grade, s.reussi]), [["grade", 101, 1, true], ["grade", 102, 1, false], ["entrainement", 102, 1, undefined],
    ["grade", 201, 41, false], ["grade", 201, 41, true], ["grade", 124, 11, false], ["grade", 125, 12, false], ["entrainement", 125, 12, undefined]]);
  assert.deepEqual(h.map(s => PARCOURS.libelleGrade(s)), [
    {mode: "🥋 20e kyu", details: "Étape 1 sur 2 · réussie"},
    {mode: "🥋 20e kyu", details: "Étape 2 sur 2 · presque"},
    {mode: "🎯 20e kyu", details: "Entraînement · étape 2 sur 2"},
    {mode: "🥋 10e kyu · Colonne", details: "Étape 1 sur 2 · presque"},
    {mode: "🥋 10e kyu · Colonne", details: "Étape 1 sur 2 · réussie"},
    {mode: "🥋 10e kyu", details: "Étape 3 sur 3 · pas encore"},
    {mode: "🥋 9e kyu", details: "Passage · arrêté"},
    {mode: "🎯 9e kyu", details: "Entraînement au grade"}], "un grade à une seule étape garde les mots d'avant");
  assert.equal(PARCOURS.libelleGrade({mode: "flash"}), null);
  assert.equal(PARCOURS.libelleGrade({mode: "grade", etape: 12}), null, "un numéro de l'ancienne grille ne se lit pas");
  assert.deepEqual(h[0].reglages, {operations: "plus", chiffresMin: 1, chiffresMax: 1, nombres: 2, calculs: 10, etape: 101, grade: 1});
});

// ------------------------------------------------------------- réussir

test("une étape réussie (10 calculs faits, le seuil atteint) fait monter le rang gardé ; presque, arrêté ou entraînement ne donnent rien ; le rang ne redescend jamais", () => {
  let p = PARCOURS.creer();
  assert.equal(PARCOURS.etapeReussie(p, false), 0);
  p = noter(p, 1, "grade", 101, 10, 6);
  p = noter(p, 2, "grade", 101, 7, 7);
  p = noter(p, 3, "entrainement", 101, 5, 5);
  assert.equal(p.etapeFlash, undefined, "presque, arrêté, entraînement tout juste : rien");
  assert.ok(!json(p).includes("etape"), "la clé n'apparaît pas tant qu'aucune étape n'est réussie");
  p = noter(p, 4, "grade", 101, 10, 7);
  assert.equal(p.etapeFlash, 1);
  assert.equal(PARCOURS.gradeReussi(p), 0, "une étape sur deux : le 20e kyu n'est pas gagné");
  p = noter(p, 5, "grade", 102, 10, 9);
  assert.equal(p.etapeFlash, 2);
  assert.equal(PARCOURS.gradeReussi(p), 1, "ses deux étapes réussies : le 20e kyu est gagné");
  // Retenter une étape déjà réussie, et la manquer : rien ne redescend.
  p = noter(p, 6, "grade", 101, 10, 2);
  assert.equal(p.etapeFlash, 2);
  assert.equal(p.etapeColonne, undefined, "le Flash ne touche pas à la Colonne");
  // La Colonne : 7 sur 10 ne suffit pas, il en faut 8.
  p = noter(p, 7, "grade", 201, 10, 7);
  assert.equal(p.etapeColonne, undefined);
  p = noter(p, 8, "grade", 201, 10, 8);
  assert.equal(p.etapeColonne, 1);
  assert.equal(PARCOURS.gradeColonneReussi(p), 0);
  p = noter(p, 9, "grade", 202, 10, 10);
  assert.equal(p.etapeColonne, 2);
  assert.equal(PARCOURS.gradeColonneReussi(p), 1, "le 10e kyu, premier des dix grades de la Colonne (son rang)");
  assert.equal(PARCOURS.resumeProf(p).gradeColonne, 41, "son numéro, pour la page prof");
  assert.equal(p.etapeFlash, 2, "la Colonne ne touche pas au Flash");
  // La même séance notée deux fois (la page note à chaque calcul) : une seule séance, le même rang.
  const encore = noter(p, 9, "grade", 202, 10, 10);
  assert.equal(json(encore), json(p));
});

test("les cadenas : les étapes s'ouvrent une à une, un grade s'ouvre quand le précédent est gagné ; l'étape à tenter et les mots « en cours »", () => {
  const vide = PARCOURS.creer();
  let etat = PARCOURS.etatGrades(vide);
  assert.equal(etat.length, 40);
  assert.deepEqual(etat.slice(0, 3).map(g => [g.numero, g.reussi, g.ouvert, g.actuel]), [[1, false, true, true], [2, false, false, false], [3, false, false, false]]);
  assert.deepEqual(etat[0].etapes.map(e => [e.numero, e.rang, e.reussie, e.ouverte, e.actuelle]), [[101, 1, false, true, true], [102, 2, false, false, false]]);
  assert.deepEqual(PARCOURS.etapeATenter(vide, false), {numero: 101, grade: 1, rang: 1, sur: 2});
  assert.equal(PARCOURS.texteEnCours(vide, false), "", "rien de commencé : rien à dire");
  // 17 étapes réussies : 20e → 13e kyu gagnés, la 1re étape du 12e kyu aussi.
  let p = brut({etapeFlash: 17});
  etat = PARCOURS.etatGrades(p);
  assert.deepEqual(etat.slice(0, 10).map(g => (g.reussi ? "R" : g.actuel ? "A" : g.ouvert ? "O" : "F")).join(""), "RRRRRRRRAF");
  assert.deepEqual(etat[8].etapes.map(e => [e.numero, e.reussie, e.ouverte, e.actuelle]), [[117, true, true, false], [118, false, true, true], [119, false, false, false]]);
  assert.equal(etat[8].etape, 2);
  assert.deepEqual(PARCOURS.etapeATenter(p, false), {numero: 118, grade: 9, rang: 2, sur: 3});
  assert.equal(PARCOURS.texteEnCours(p, false), "12e kyu · étape 2 sur 3");
  assert.equal(PARCOURS.gradeReussi(p), 8);
  // Un grade à une seule étape : ses mots ne disent pas « étape 1 sur 1 ».
  p = brut({etapeFlash: 24});
  assert.equal(PARCOURS.texteEnCours(p, false), "9e kyu");
  // Tout est gagné : plus rien à tenter.
  p = brut({etapeFlash: 65, etapeColonne: 26});
  assert.equal(PARCOURS.etapeATenter(p, false), null);
  assert.equal(PARCOURS.etapeATenter(p, true), null);
  assert.equal(PARCOURS.gradeReussi(p), 40);
  assert.equal(PARCOURS.gradeColonneReussi(p), 10);
  assert.ok(PARCOURS.etatGrades(p).every(g => g.reussi && !g.actuel && g.etapes.every(e => e.reussie)));
  // La Colonne : 10 grades, les siens.
  p = brut({etapeColonne: 8});
  etat = PARCOURS.etatGradesColonne(p);
  assert.equal(etat.length, 10);
  assert.deepEqual(etat.map(g => g.numero), [41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
  assert.deepEqual(etat.map(g => (g.reussi ? "R" : g.actuel ? "A" : g.ouvert ? "O" : "F")).join(""), "RRRAFFFFFF");
  assert.equal(etat[3].seuil, 8);
  assert.deepEqual(PARCOURS.etapeATenter(p, true), {numero: 209, grade: 44, rang: 3, sur: 3});
  assert.equal(PARCOURS.texteEnCours(p, true), "7e kyu · étape 3 sur 3");
  assert.equal(PARCOURS.etatGrades(p)[0].actuel, true, "le Flash, lui, n'a pas bougé");
  // La meilleure note d'une étape, lue dans les séances gardées.
  let q = noter(PARCOURS.creer(), 1, "grade", 101, 10, 8);
  q = noter(q, 2, "grade", 101, 10, 10);
  q = noter(q, 3, "grade", 102, 10, 4);
  assert.deepEqual(PARCOURS.etatGrades(q)[0].etapes.map(e => e.meilleur), [10, 4]);
});

test("« M'entraîner » : 5 calculs de l'étape, la moitié de son plan ; réussi ou non, il ne réussit aucune étape ; il compte ses calculs", () => {
  const rng = CORE.mulberry32(20261122);
  for (const numero of NUMEROS) {
    const r = CORE.reglagesEtape(numero, "bip", 5);
    assert.equal(r.calculs, 5, `étape ${numero}`);
    assert.equal(CORE.tirerSeance(r, rng).length, 5);
    for (const autre of [0, 1, 7, 10, 20, "5", null, undefined]) assert.equal(CORE.reglagesEtape(numero, "bip", autre).calculs, 10, `étape ${numero}, ${autre} : un passage, 10 calculs`);
    const {calculs: _a, ...dix} = CORE.reglagesEtape(numero, "bip", 10);
    const {calculs: _b, ...cinq} = r;
    assert.deepEqual(cinq, dix, "le reste des réglages ne bouge pas");
  }
  assert.equal(CORE.reglagesEtape(999, "bip"), null);
  let p = noter(PARCOURS.creer(), 11, "entrainement", 101, 5, 5);
  p = noter(p, 12, "entrainement", 201, 3, 3);
  assert.equal(p.etapeFlash, undefined);
  assert.equal(p.etapeColonne, undefined);
  const h = PARCOURS.historique(p);
  assert.deepEqual(h.map(x => [x.mode, x.calculs, x.faits, x.arretee]), [["entrainement", 5, 3, true], ["entrainement", 5, 5, false]]);
  assert.equal(PARCOURS.resume(p).calculs, 8);
  // Le serveur renvoie le parcours : rien ne se perd, dans les deux sens.
  const retour = JSON.parse(json(PARCOURS.pourServeur(p)));
  assert.deepEqual(PARCOURS.fusionner(retour, PARCOURS.creer()).seances, p.seances);
  assert.deepEqual(PARCOURS.fusionner(PARCOURS.creer(), retour).seances, p.seances);
});

test("le résumé d'une séance : le Flash dit le temps par nombre ET du calcul entier ; une étape dit son grade, son rang et ce qu'elle travaille — jamais coupé ailleurs qu'après un point", () => {
  const nb = t => t.replace(/ /g, " ");
  assert.equal(nb(CORE.resume("flash", FLASH)), "⚡ Flash · 2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout");
  assert.equal(nb(CORE.resume("flash", CORE.normaliser("flash", {nombres: 3, temps: 1}), {avecMode: false})), "2 à 3 chiffres · 3 nombres · 0,1 s par nombre · 0,3 s en tout");
  assert.equal(nb(CORE.resume("flash", CORE.normaliser("flash", {nombres: 30, temps: 50}), {avecMode: false})), "2 à 3 chiffres · 30 nombres · 5 s par nombre · 150 s en tout");
  assert.equal(nb(CORE.resume("colonne", CORE.normaliser("colonne", {limite: 20}))), "📝 Colonne · + et − · 3 chiffres · 8 nombres · 20 s");
  assert.equal(nb(CORE.resume("grade", CORE.reglagesEtape(101, "bip"))), "🥋 20e kyu · étape 1 · sans complément ni retenue, comme 2 + 5");
  assert.equal(nb(CORE.resume("entrainement", CORE.reglagesEtape(118, "bip", 5))), "🎯 12e kyu · étape 2 · une retenue vers les dizaines, comme 27 + 6");
  assert.equal(nb(CORE.resume("entrainement", CORE.reglagesEtape(112, "bip", 5))), "🎯 15e kyu · étape 2 · 7 nombres en 14 s");
  assert.equal(nb(CORE.resume("grade", CORE.reglagesEtape(201, "bip"))), "🥋 10e kyu · Colonne · étape 1 · sans complément ni retenue, comme 2 + 6 − 3");
  assert.equal(nb(CORE.resume("grade", CORE.reglagesEtape(209, "bip"))), "🥋 7e kyu · Colonne · étape 3 · des retenues en + et en − · 10 calculs en 3 min");
  // Un nombre et son unité ne se séparent pas ; le point est collé au morceau d'avant.
  for (const numero of NUMEROS) {
    for (const mode of ["grade", "entrainement"]) {
      const t = CORE.resume(mode, CORE.reglagesEtape(numero, "bip", mode === "grade" ? 10 : 5));
      assert.ok(!t.includes(" · "), `étape ${numero} : aucun « · » précédé d'une espace sécable — ${t}`);
      assert.doesNotMatch(t, /\d (s|min)\b/, `étape ${numero} : un nombre et son unité d'un bloc — ${t}`);
      assert.doesNotMatch(t, /par nombre/, "une étape ne dit pas le temps par nombre");
    }
  }
  const t = CORE.resume("flash", FLASH);
  assert.ok(t.includes("0,8 s par nombre") && t.includes("8 s en tout"), t);
  const prof = readFileSync(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
  assert.match(prof, /return morceaux\.join\("\\u00a0· "\);/);
  assert.match(prof, /\\u00a0par\\u00a0nombre`, `\$\{sec\(r\.nombres \* \(r\.temps \/ 10\)\)\}\\u00a0en\\u00a0tout`/);
});

// ------------------------------------------------------------- Ma classe

test("Ma classe : le plus haut grade gagné de chaque mode, puis le grade et l'étape en cours ; les mots viennent du moteur", () => {
  const nb = t => t.replace(/ /g, " ");
  const lu = p => PARCOURS.resumeProf(p);
  assert.deepEqual([lu(brut({})).grade, lu(brut({})).gradeColonne, lu(brut({})).enCours, lu(brut({})).enCoursColonne, lu(brut({})).texteGrade], [0, 0, "", "", ""]);
  assert.equal(nb(lu(brut({etapeFlash: 1})).texteGrade), "🥋 Flash : 20e kyu · étape 2 sur 2 en cours");
  assert.deepEqual([lu(brut({etapeFlash: 1})).grade, lu(brut({etapeFlash: 1})).enCours], [0, "20e kyu · étape 2 sur 2"]);
  assert.equal(nb(lu(brut({etapeFlash: 2})).texteGrade), "🥋 Flash : 20e kyu réussi, 19e kyu · étape 1 sur 2 en cours");
  assert.deepEqual([lu(brut({etapeFlash: 2})).grade, lu(brut({etapeFlash: 2})).gradeColonne], [1, 0]);
  assert.equal(nb(lu(brut({etapeColonne: 2})).texteGrade), "🥋 Colonne : 10e kyu réussi, 9e kyu · étape 1 sur 2 en cours");
  assert.deepEqual([lu(brut({etapeColonne: 2})).grade, lu(brut({etapeColonne: 2})).gradeColonne], [0, 41]);
  assert.equal(nb(lu(brut({etapeFlash: 24, etapeColonne: 9})).texteGrade),
    "🥋 Flash : 10e kyu réussi, 9e kyu en cours — Colonne : 7e kyu réussi, 6e kyu · étape 1 sur 2 en cours");
  assert.equal(nb(lu(brut({etapeFlash: 65, etapeColonne: 26})).texteGrade), "🥋 Flash : 20e dan réussi — Colonne : 1er kyu réussi");
  // La page prof écrit la cellule avec ces champs-là.
  const prof = readFileSync(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
  assert.match(prof, /const cFlash = cellule\(parMode\.flash, lu\.grade, lu\.enCours\);\s*const cColonne = cellule\(parMode\.colonne, lu\.gradeColonne, lu\.enCoursColonne\);/);
  assert.match(prof, /if \(grade && ANZAN && ANZAN\.nomGrade\) td\.append\(el\("small", "anzan-grade", `🥋 \$\{ANZAN\.nomGrade\(grade\)\}`\)\);\s*if \(enCours\) td\.append\(el\("small", "anzan-grade en-cours", /);
  assert.equal(readFileSync(new URL("../_serveur/public/prof/flash_anzan_parcours.js", import.meta.url), "utf8"),
    readFileSync(new URL("../outils/calcul_mental/flash_anzan_parcours.js", import.meta.url), "utf8"), "la page prof reçoit le même moteur, octet pour octet");
});

// ------------------------------------------------------------- l'ancienne grille

test("l'ancienne grille est ignorée sans erreur : ses clés et ses séances ne se lisent plus, le reste du parcours est gardé, et rien d'ancien ne repart vers le serveur", () => {
  const ancien = {version: 1, epoque: 0, reglages: {}, gradeReussi: 12, gradeColonne: 45, seances: {
    "1": ["2026-11-06", "grade", "plus", 1, 1, 3, 1, 10, 10, 9, 77, 1],
    "2": ["2026-11-07", "flash", "plus", 2, 3, 10, 8, 10, 10, 10, 78, 2],
    "3": ["2026-11-07", "entrainement", "plus", 1, 1, 5, 2, 5, 5, 5, 79, 3],
    "4": ["2026-11-08", "grade", "plus", 1, 1, 5, 41, 10, 10, 9, 80, 4],
    "5": ["2026-11-08", "colonne", "plusmoins", 3, 3, 8, 0, 10, 10, 7, 81, 5]}};
  const p = PARCOURS.normaliser(ancien);
  assert.deepEqual(Object.keys(p).sort(), ["epoque", "reglages", "seances", "version"], "ni gradeReussi, ni gradeColonne, ni étape");
  assert.deepEqual(PARCOURS.historique(p).map(s => [s.mode, s.id]), [["colonne", 81], ["flash", 78]], "les séances libres restent");
  assert.equal(PARCOURS.resume(p).calculs, 20);
  assert.equal(PARCOURS.gradeReussi(p), 0);
  assert.equal(PARCOURS.gradeColonneReussi(p), 0);
  assert.ok(PARCOURS.etatGrades(p)[0].actuel, "tout repart du 20e kyu");
  assert.ok(!json(PARCOURS.pourServeur(p)).includes("grade"), "rien de l'ancienne grille ne repart");
  assert.ok(!PARCOURS.CLES_SERVEUR.includes("gradeReussi") && !PARCOURS.CLES_SERVEUR.includes("gradeColonne"));
  assert.ok(PARCOURS.CLES_SERVEUR.includes("etapeFlash") && PARCOURS.CLES_SERVEUR.includes("etapeColonne"));
  // Une ancienne copie qui fusionne avec un parcours du nouveau barème : dans
  // les deux sens, le même résultat, l'étape gardée, pas d'erreur.
  let neuf = noter(PARCOURS.creer(), 500, "grade", 101, 10, 8, "2026-11-22");
  neuf = libre(neuf, 501, "2026-11-22");
  const ab = PARCOURS.fusionner(ancien, neuf);
  const ba = PARCOURS.fusionner(neuf, ancien);
  assert.equal(json(ab), json(ba));
  assert.equal(ab.etapeFlash, 1);
  assert.deepEqual(PARCOURS.historique(ab).map(s => s.id).sort((x, y) => x - y), [78, 81, 500, 501]);
  // Le catalogue du serveur : les clés du nouveau barème, plus celles de l'ancienne grille.
  const catalogue = readFileSync(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");
  const entree = catalogue.slice(catalogue.indexOf("    'flash-anzan' => ["));
  const anzan = entree.slice(0, entree.indexOf("\n    ],"));
  assert.match(anzan, /'etapeFlash', 'etapeColonne'/);
  assert.doesNotMatch(anzan, /'gradeReussi'|'gradeColonne'/);
});

// ------------------------------------------------------------- la check-list de fusion (AGENTS.md)

test("fusion — deux appareils hors ligne le même jour : chacun réussit ses étapes, aucune séance ne se perd, le rang le plus haut reste, le même résultat dans les deux sens", () => {
  const depart = noter(libre(PARCOURS.creer(), 900), 901, "grade", 101, 10, 8);
  // Le téléphone réussit l'étape 2 puis l'étape 1 du 19e kyu ; la tablette,
  // partie de la même copie, s'entraîne et manque l'étape 2.
  let tel = noter(depart, 4001, "grade", 102, 10, 7);
  tel = noter(tel, 4002, "grade", 103, 10, 9);
  let tablette = noter(depart, 3001, "entrainement", 102, 5, 4);
  tablette = noter(tablette, 3002, "grade", 102, 10, 5);
  tablette = noter(tablette, 3003, "grade", 201, 10, 8);
  const ab = PARCOURS.fusionner(tel, tablette);
  const ba = PARCOURS.fusionner(tablette, tel);
  assert.equal(json(ab), json(ba), "octet pour octet, dans les deux sens");
  assert.equal(ab.etapeFlash, 3);
  assert.equal(ab.etapeColonne, 1);
  assert.deepEqual(PARCOURS.historique(ab).map(s => s.id).sort((x, y) => x - y), [900, 901, 3001, 3002, 3003, 4001, 4002], "les sept séances, aucune en double");
  assert.deepEqual(Object.keys(ab.seances), ["1", "2", "3", "4", "5", "6", "7"], "les numéros ne sont que des places");
  // La même séance vue par les deux appareils (arrêtée sur l'un, finie sur l'autre) : la plus avancée.
  const arretee = noter(depart, 5001, "grade", 102, 6, 6);
  const finie = noter(depart, 5001, "grade", 102, 10, 9);
  for (const f of [PARCOURS.fusionner(arretee, finie), PARCOURS.fusionner(finie, arretee)]) {
    assert.equal(f.etapeFlash, 2);
    assert.deepEqual(PARCOURS.historique(f).filter(s => s.id === 5001).map(s => [s.faits, s.score]), [[10, 9]]);
  }
});

test("fusion — une vieille copie ressortie quinze jours après ne fait rien redescendre et ne retire aucune séance", () => {
  const vieille = noter(libre(PARCOURS.creer(), 10, "2026-11-22"), 11, "grade", 101, 10, 9, "2026-11-22");
  let actuel = vieille;
  [102, 103, 104, 105, 106].forEach((numero, i) => { actuel = noter(actuel, 100 + i, "grade", numero, 10, 8, `2026-11-${24 + i}`); });
  actuel = noter(actuel, 200, "grade", 201, 10, 9, "2026-12-01");
  assert.equal(actuel.etapeFlash, 6);
  // La vieille copie rejoue une étape déjà dépassée, le 7 décembre, hors ligne.
  const ressortie = noter(vieille, 300, "grade", 102, 10, 7, "2026-12-07");
  assert.equal(ressortie.etapeFlash, 2);
  const ab = PARCOURS.fusionner(actuel, ressortie);
  const ba = PARCOURS.fusionner(ressortie, actuel);
  assert.equal(json(ab), json(ba));
  assert.equal(ab.etapeFlash, 6, "le rang du compte ne redescend pas");
  assert.equal(ab.etapeColonne, 1);
  assert.equal(PARCOURS.historique(ab).length, 9, "2 + 5 + 1 + la séance de la vieille copie");
  assert.equal(PARCOURS.texteEnCours(ab, false), "17e kyu · étape 1 sur 2");
});

test("fusion — la borne des 500 séances : le rang reste quand les passages sortent ; une copie arrivée SANS la clé compte ses étapes avant que la borne les fasse sortir", () => {
  let p = noter(PARCOURS.creer(), 1, "grade", 101, 10, 9);
  p = noter(p, 2, "grade", 102, 10, 9);
  p = noter(p, 3, "grade", 201, 10, 8);
  for (let i = 0; i < 500; i += 1) p = PARCOURS.noterSeance(p, {id: 1000 + i, mode: "flash", reglages: FLASH, faits: 1, score: 1}, JOUR).parcours;
  assert.equal(Object.keys(p.seances).length, PARCOURS.SEANCES_MAX);
  assert.equal(PARCOURS.historique(p).filter(s => s.mode === "grade").length, 0, "les passages sont sortis");
  assert.equal(p.etapeFlash, 2, "le rang, lui, reste");
  assert.equal(p.etapeColonne, 1);
  assert.equal(PARCOURS.gradeReussi(p), 1);
  const vieux = {version: 1, epoque: 0, reglages: {}, seances: {"1": liste("grade", 101, 10, 10, 9, 1, 1, "2026-11-01"), "2": liste("grade", 201, 10, 10, 8, 2, 2, "2026-11-01")}};
  for (let i = 3; i <= 502; i += 1) vieux.seances[String(i)] = ["2026-11-02", "flash", "plus", 2, 3, 10, 8, 10, 1, 1, 10 + i, i];
  const relu = PARCOURS.normaliser(vieux);
  assert.equal(Object.keys(relu.seances).length, 500);
  assert.equal(PARCOURS.historique(relu).some(s => s.mode === "grade"), false);
  assert.equal(relu.etapeFlash, 1);
  assert.equal(relu.etapeColonne, 1);
  // Et la fusion de deux historiques pleins garde le rang le plus haut.
  const f = PARCOURS.fusionner(relu, p);
  assert.equal(Object.keys(f.seances).length, 500);
  assert.deepEqual([f.etapeFlash, f.etapeColonne], [2, 1]);
  assert.equal(json(f), json(PARCOURS.fusionner(p, relu)));
});

test("fusion — une donnée abîmée ne casse rien : un rang qui n'est pas un entier est jeté, un rang trop grand est ramené à la dernière étape connue, une séance d'étape trafiquée saute", () => {
  for (const faux of ["abc", -1, 0, 3.5, null, [], {}, true, NaN]) {
    assert.equal(PARCOURS.normaliser(brut({etapeFlash: faux})).etapeFlash, undefined, `etapeFlash ${json(faux)}`);
    assert.equal(PARCOURS.normaliser(brut({etapeColonne: faux})).etapeColonne, undefined, `etapeColonne ${json(faux)}`);
  }
  assert.equal(PARCOURS.normaliser(brut({etapeFlash: 66})).etapeFlash, 65);
  assert.equal(PARCOURS.normaliser(brut({etapeFlash: 1e9})).etapeFlash, 65);
  // Un rang de Colonne au-delà des 26 étapes d'aujourd'hui (les dan viendront
  // au lot 2) : ramené à 26, jamais remis à zéro — un appareil resté sur ce
  // moteur ne fera pas repartir du 10e kyu un élève arrivé aux dan.
  assert.equal(PARCOURS.normaliser(brut({etapeColonne: 30})).etapeColonne, 26);
  assert.equal(PARCOURS.etapeATenter(brut({etapeColonne: 30}), true), null);
  assert.equal(PARCOURS.gradeColonneReussi(brut({etapeColonne: 30})), 10);
  const abime = brut({etapeFlash: 2, seances: {
    "1": liste("grade", 101, 10, 10, 9, 1, 1),
    "2": ["2026-11-22", "grade", "plus", 3, 3, 15, 101, 10, 10, 10, 2, 2],
    "3": ["2026-11-22", "grade", "plus", 1, 1, 2, 9999, 10, 10, 10, 3, 3],
    "4": "n'importe quoi",
    "5": ["2026-11-22", "grade", "plus", 1, 1, 2, 101, 10, 10, 10, 4],
    "6": null}});
  const p = PARCOURS.normaliser(abime);
  assert.deepEqual(PARCOURS.historique(p).map(s => s.id), [1], "une seule séance est lisible");
  assert.equal(p.etapeFlash, 2);
  for (const rien of [null, undefined, "", 42, [], "{"]) assert.equal(json(PARCOURS.normaliser(rien)), json(PARCOURS.creer()), `${json(rien)} : un parcours vide`);
  assert.equal(json(PARCOURS.fusionner(abime, null)), json(PARCOURS.fusionner(null, abime)));
  // Une séance d'étape réussie pour une étape qui n'est pas encore ouverte (une
  // copie trafiquée : la page ne le permet pas) fait monter le rang jusqu'à
  // elle — c'est le parcours de l'élève, il ne touche que le sien.
  assert.equal(PARCOURS.normaliser(brut({seances: {"1": liste("grade", 110, 10, 10, 10)}})).etapeFlash, 10);
});

test("fusion — une réouverture ne renvoie rien : relire, fusionner avec soi-même ou avec la copie du serveur redonne le même parcours, octet pour octet", () => {
  let p = libre(PARCOURS.creer(), 50);
  p = noter(p, 51, "grade", 101, 10, 8);
  p = noter(p, 52, "entrainement", 102, 5, 3);
  p = noter(p, 53, "grade", 102, 10, 7);
  p = noter(p, 54, "grade", 201, 10, 9);
  const serveur = JSON.parse(json(PARCOURS.pourServeur(p)));
  assert.equal(json(PARCOURS.normaliser(p)), json(p), "relire ne change rien");
  assert.equal(json(PARCOURS.normaliser(serveur)), json(p), "la copie du serveur est la même");
  assert.equal(json(PARCOURS.fusionner(p, p)), json(p));
  assert.equal(json(PARCOURS.fusionner(p, serveur)), json(p));
  assert.equal(json(PARCOURS.fusionner(serveur, p)), json(p));
  assert.equal(json(PARCOURS.pourServeur(PARCOURS.fusionner(serveur, p))), json(serveur), "rien de neuf à envoyer");
  // Le serveur retire une clé qu'il ne connaît pas (lib/applis.php pas encore
  // déposé) : le parcours revient sans « etapeFlash », et le rang se retrouve
  // dans les séances gardées — puis repart au prochain envoi.
  const sansCles = JSON.parse(json(serveur));
  delete sansCles.etapeFlash;
  delete sansCles.etapeColonne;
  assert.equal(json(PARCOURS.normaliser(sansCles)), json(p));
  assert.equal(json(PARCOURS.fusionner(sansCles, PARCOURS.creer())), json(p));
});

test("fusion — des identifiants qui ne montent pas dans le sens du temps : l'ordre seul range les séances, et le rang est le même", () => {
  // Les identifiants DESCENDENT quand le temps monte.
  let p = noter(PARCOURS.creer(), 9000, "grade", 101, 10, 8);
  p = noter(p, 5000, "grade", 102, 10, 6);
  p = noter(p, 3000, "grade", 102, 10, 9);
  p = noter(p, 100, "grade", 103, 10, 7);
  assert.deepEqual(PARCOURS.historique(p).map(s => s.id), [100, 3000, 5000, 9000], "la plus récente en haut, quel que soit l'identifiant");
  assert.equal(p.etapeFlash, 3);
  assert.deepEqual(Object.values(p.seances).map(s => s[11]), [1, 2, 3, 4], "les ordres montent");
  const autre = noter(noter(PARCOURS.creer(), 7000, "grade", 101, 10, 10), 20, "grade", 201, 10, 8);
  const ab = PARCOURS.fusionner(p, autre);
  assert.equal(json(ab), json(PARCOURS.fusionner(autre, p)));
  assert.deepEqual([ab.etapeFlash, ab.etapeColonne], [3, 1]);
  assert.equal(PARCOURS.historique(ab).length, 6);
});

test("fusion — une époque plus haute (le professeur a remis le parcours à zéro) gagne en bloc, étapes comprises ; un parcours sans étape ne porte aucune clé d'étape", () => {
  const x = noter(noter(PARCOURS.creer(), 11, "grade", 101, 10, 7), 12, "grade", 102, 10, 8);
  const restaure = {...PARCOURS.creer(), epoque: 3};
  assert.equal(PARCOURS.fusionner(x, restaure).etapeFlash, undefined);
  assert.equal(PARCOURS.fusionner(restaure, x).etapeFlash, undefined);
  assert.equal(PARCOURS.historique(PARCOURS.fusionner(x, restaure)).length, 0);
  const flash = libre(PARCOURS.creer(), 5);
  assert.equal(json(PARCOURS.normaliser(flash)), json(flash));
  assert.ok(!json(flash).includes("etape") && !json(flash).includes("grade"));
});
