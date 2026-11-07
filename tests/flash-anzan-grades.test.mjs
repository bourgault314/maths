// Anzan, lot « grades » (07/11/2026) : la grille officielle des grades de
// Flash Anzan, leurs calculs, et ce que le parcours en garde (le moteur de
// l'appli et sa copie de la page prof). La page elle-même est jouée dans
// tests/flash-anzan-seance.test.mjs.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");
const PARCOURS = require("../outils/calcul_mental/flash_anzan_parcours.js");

const JOUR = "2026-11-07";
const reglages = n => CORE.reglagesGrade(n, "bip");
const noter = (p, id, mode, n, faits, score, jour = JOUR) => PARCOURS.noterSeance(p, {id, mode, reglages: reglages(n), faits, score}, jour).parcours;

test("la grille est celle de l'Association japonaise du test de Flash Anzan (flash-anzan.jp/school), recopiée à l'identique dans le moteur du parcours", () => {
  assert.equal(CORE.NB_GRADES, 40);
  assert.deepEqual(CORE.GRADES.map(g => ({...g})), PARCOURS.GRADES.map(g => ({...g})), "la page prof lit la même grille");
  const ligne = n => {
    const g = CORE.GRADES[n - 1];
    return [CORE.nomGrade(n), g.chiffres, g.nombres, g.dixiemes / 10];
  };
  // Quelques lignes recopiées du site de l'association (桁, 口数, タイム).
  assert.deepEqual(ligne(1), ["20e kyu", 1, 3, 5]);
  assert.deepEqual(ligne(8), ["13e kyu", 1, 20, 15]);
  assert.deepEqual(ligne(11), ["10e kyu", 2, 2, 4]);
  assert.deepEqual(ligne(20), ["1er kyu", 2, 15, 13]);
  assert.deepEqual(ligne(21), ["1er dan", 2, 15, 10]);
  assert.deepEqual(ligne(22), ["2e dan", 3, 4, 4]);
  assert.deepEqual(ligne(29), ["9e dan", 3, 15, 4.5]);
  assert.deepEqual(ligne(30), ["10e dan", 3, 15, 3]);
  assert.deepEqual(ligne(40), ["20e dan", 3, 15, 1.5]);
  assert.deepEqual(CORE.GRADES.slice(30).map(g => g.dixiemes), [28, 26, 24, 22, 20, 19, 18, 17, 16, 15], "11e → 20e dan");
  for (let n = 1; n <= 40; n += 1) assert.equal(PARCOURS.nomGrade(n), CORE.nomGrade(n));
  assert.equal(CORE.nomGrade(0), "");
  assert.equal(CORE.nomGrade(41), "");
  assert.equal(CORE.GRADE_CALCULS, 10);
  assert.equal(CORE.GRADE_REUSSI, 7, "10問中7題以上の正解で合格");
});

test("les réglages d'un grade : additions, un seul nombre de chiffres, 10 calculs, le temps de toute la série partagé entre ses nombres", () => {
  assert.deepEqual(reglages(8), {operations: "plusmoins", chiffresMin: 1, chiffresMax: 1, nombres: 20, calculs: 10, grade: 8, sansRetenue: "unites", tempsMs: 750, son: "bip"});
  assert.deepEqual(reglages(11), {operations: "plus", chiffresMin: 2, chiffresMax: 2, nombres: 2, calculs: 10, grade: 11, tempsMs: 2000, son: "bip"}, "10e kyu : la retenue arrive, additions seules");
  assert.ok(Math.abs(reglages(1).tempsMs - 5000 / 3) < 1e-9, "5 s pour 3 nombres");
  assert.equal(reglages(40).tempsMs, 100, "20e dan : un dixième de seconde par nombre");
  assert.equal(CORE.tempsParNombreMs(reglages(29)), 300);
  assert.equal(CORE.tempsParNombreMs({temps: 8}), 800, "le Flash garde ses dixièmes de seconde");
  assert.equal(CORE.reglagesGrade(0), null);
  assert.equal(CORE.reglagesGrade(2, "aucun").son, "aucun", "le bip suit l'interrupteur du Flash");
  const sp = t => t.replace(/\u00a0/g, " ");
  assert.equal(sp(CORE.texteGrade(1)), "3 nombres d’un chiffre, sans retenue · 5 s en tout");
  assert.equal(sp(CORE.texteGrade(2)), "3 nombres d’un chiffre, + et −, sans retenue · 5 s en tout", "le 19e kyu n'est plus le même que le 20e");
  assert.equal(sp(CORE.texteGrade(9)), "10 dizaines rondes, + et −, sans retenue · 10 s en tout");
  assert.equal(sp(CORE.texteGrade(10)), "15 nombres de 2 chiffres, + et −, sans retenue · 15 s en tout");
  assert.equal(sp(CORE.texteGrade(11)), "2 nombres de 2 chiffres · 4 s en tout");
  assert.equal(sp(CORE.texteGrade(29)), "15 nombres de 3 chiffres · 4,5 s en tout");
  assert.equal(sp(CORE.resume("grade", reglages(12))), "🥋 9e kyu · 3 nombres de 2 chiffres · 6 s en tout");
  assert.equal(sp(CORE.resume("entrainement", reglages(8))), "🎯 13e kyu · 20 nombres d’un chiffre, + et −, sans retenue · 15 s en tout");
});

test("le verdict : réussi à 7, presque à 5 ou 6, pas encore à 4 ; un passage incomplet est « arrêté »", () => {
  assert.equal(CORE.verdictGrade(10, 10), "reussi");
  assert.equal(CORE.verdictGrade(10, 7), "reussi");
  assert.equal(CORE.verdictGrade(10, 6), "presque");
  assert.equal(CORE.verdictGrade(10, 5), "presque");
  assert.equal(CORE.verdictGrade(10, 4), "pasencore");
  assert.equal(CORE.verdictGrade(9, 9), "arrete");
});

test("les calculs d'un grade : additions de nombres d'exactement N chiffres, jamais deux fois le même nombre de suite ; le Flash ordinaire tire comme avant", () => {
  for (const n of [11, 20, 22, 40]) {
    const rng = CORE.mulberry32(1000 + n);
    const g = CORE.GRADES[n - 1];
    for (let k = 0; k < 500; k += 1) {
      const c = CORE.tirerCalcul(reglages(n), rng);
      assert.equal(c.termes.length, g.nombres);
      c.termes.forEach((t, i) => {
        assert.equal(t.signe, 1);
        assert.equal(String(t.valeur).length, g.chiffres);
        if (i) assert.notEqual(t.valeur, c.termes[i - 1].valeur);
      });
      assert.equal(c.total, c.termes.reduce((s, t) => s + t.valeur, 0));
    }
  }
  // Sans grade, le tirage est celui d'avant le lot (même suite de hasard) :
  // l'ancien algorithme, réécrit ici, donne les mêmes calculs.
  const ancien = (r, rng) => {
    const entre = (a, b) => a + Math.floor(rng() * (b - a + 1));
    const termes = [];
    let total = 0;
    for (let i = 0; i < r.nombres; i += 1) {
      const n = entre(r.chiffresMin, r.chiffresMax);
      let texte = String(entre(1, 9));
      for (let j = 1; j < n; j += 1) texte += String(entre(0, 9));
      const valeur = Number(texte);
      let signe = 1;
      if (i > 0 && r.operations === "plusmoins" && rng() < 0.5 && total - valeur >= 0) signe = -1;
      total += signe * valeur;
      termes.push({signe, valeur});
    }
    return {termes, total};
  };
  const r = CORE.normaliser("flash", {operations: "plusmoins", chiffresMin: 1, chiffresMax: 1, nombres: 30});
  const a = CORE.mulberry32(7);
  const b = CORE.mulberry32(7);
  for (let k = 0; k < 200; k += 1) assert.deepEqual(CORE.tirerCalcul(r, a), ancien(r, b));
});

test("sans retenue (20e → 11e kyu) : chaque colonne du boulier reste entre 0 et 9 ; le 20e kyu n'a que des additions ; le 12e des dizaines rondes ; jamais deux fois le même nombre de suite ; jamais 0 comme réponse", () => {
  const colonnesOk = (avant, signe, v) => [1, 10].every(p => {
    const c = Math.floor(avant / p) % 10 + signe * (Math.floor(v / p) % 10);
    return c >= 0 && c <= 9;
  });
  const vus = {};
  for (let n = 1; n <= 10; n += 1) {
    const r = reglages(n);
    const g = CORE.GRADES[n - 1];
    assert.ok(r.sansRetenue, `${CORE.nomGrade(n)} : sans retenue`);
    assert.equal(r.operations, n === 1 ? "plus" : "plusmoins");
    const rng = CORE.mulberry32(500 + n);
    let moins = 0;
    for (let k = 0; k < 2000; k += 1) {
      const c = CORE.tirerCalcul(r, rng);
      assert.equal(c.termes.length, g.nombres);
      let total = 0;
      c.termes.forEach((t, i) => {
        if (i === 0) assert.equal(t.signe, 1, "le premier nombre est ajouté");
        if (n === 1) assert.equal(t.signe, 1, "20e kyu : additions seules");
        if (t.signe < 0) moins += 1;
        assert.equal(String(t.valeur).length, g.chiffres);
        if (n === 9) assert.equal(t.valeur % 10, 0, "12e kyu : 10, 20 … 90");
        assert.ok(colonnesOk(total, t.signe, t.valeur), `${CORE.nomGrade(n)} : retenue à ${total} ${t.signe < 0 ? "−" : "+"} ${t.valeur}`);
        if (i) assert.notEqual(t.valeur, c.termes[i - 1].valeur);
        total += t.signe * t.valeur;
      });
      assert.equal(c.total, total);
      assert.ok(total > 0, "jamais 0 comme réponse");
      if (n === 1) assert.ok(total <= 9);
      vus[n] = true;
    }
    if (n > 1) assert.ok(moins > 2000 * (g.nombres - 1) * 0.25, `${CORE.nomGrade(n)} : des soustractions, souvent`);
  }
  assert.equal(Object.keys(vus).length, 10);
  // Les grades « + et − » du moteur sont ceux que le parcours (et sa copie de
  // la page prof) accepte.
  const plusEtMoins = Object.keys(CORE.SANS_RETENUE).map(Number).filter(n => CORE.SANS_RETENUE[n].plusmoins);
  assert.deepEqual(plusEtMoins, [...PARCOURS.GRADES_PLUS_ET_MOINS]);
});

test("le parcours : une séance de grade « + et − » est gardée pour le 19e → 11e kyu (et les anciennes, en additions, aussi) ; jetée pour le 20e kyu et dès le 10e", () => {
  const seance = champs => ({version: 1, epoque: 0, reglages: {}, seances: {"1": champs}});
  const garde = (ops, n) => {
    const g = CORE.GRADES[n - 1];
    return Object.keys(PARCOURS.normaliser(seance(["2026-11-07", "grade", ops, g.chiffres, g.chiffres, g.nombres, n, 10, 10, 8, 5, 1])).seances).length === 1;
  };
  for (let n = 1; n <= 40; n += 1) {
    assert.equal(garde("plus", n), true, `${CORE.nomGrade(n)} en additions`);
    assert.equal(garde("plusmoins", n), n >= 2 && n <= 10, `${CORE.nomGrade(n)} en + et −`);
  }
  // Une séance notée par la page garde ses opérations.
  const p = noter(PARCOURS.creer(), 1, "grade", 2, 10, 8);
  assert.equal(PARCOURS.historique(p)[0].reglages.operations, "plusmoins");
  assert.equal(PARCOURS.gradeReussi(p), 2);
});

test("le parcours : un passage réussi (7/10 sur 10 faits) donne « gradeReussi » ; presque, arrêté ou entraînement ne donnent rien", () => {
  let p = PARCOURS.creer();
  p = noter(p, 1, "grade", 1, 10, 6);
  p = noter(p, 2, "grade", 1, 9, 9);
  p = noter(p, 3, "entrainement", 1, 10, 10);
  assert.equal(p.gradeReussi, undefined);
  assert.equal(PARCOURS.gradeReussi(p), 0);
  assert.ok(!("gradeReussi" in JSON.parse(JSON.stringify(PARCOURS.pourServeur(p)))), "absent tant qu'aucun grade n'est réussi");
  p = noter(p, 4, "grade", 1, 10, 7);
  assert.equal(PARCOURS.gradeReussi(p), 1);
  p = noter(p, 5, "grade", 2, 10, 10);
  assert.equal(PARCOURS.pourServeur(p).gradeReussi, 2);
  assert.deepEqual(Object.keys(PARCOURS.pourServeur(p)), ["version", "epoque", "reglages", "seances", "gradeReussi"]);
  // Repasser un grade réussi en le ratant ne fait rien perdre.
  p = noter(p, 6, "grade", 1, 10, 0);
  assert.equal(PARCOURS.gradeReussi(p), 2);
  const etat = PARCOURS.etatGrades(p);
  assert.deepEqual(etat.slice(0, 4).map(g => [g.reussi, g.ouvert, g.actuel, g.meilleur]),
    [[true, true, false, 7], [true, true, false, 10], [false, true, true, null], [false, false, false, null]]);
  assert.deepEqual(PARCOURS.historique(p).map(s => PARCOURS.libelleGrade(s).details),
    ["Passage · pas encore", "Passage · réussi", "Passage · réussi", "Entraînement au grade", "Passage · arrêté", "Passage · presque"]);
  assert.deepEqual(PARCOURS.historique(p).map(s => s.reussi), [false, true, true, undefined, false, false],
    "réussi : un passage complet à 7 ou plus ; rien sur un entraînement");
  assert.equal(PARCOURS.libelleGrade(PARCOURS.historique(p)[0]).mode, "🥋 20e kyu");
  assert.equal(PARCOURS.resumeProf(p).grade, 2);
  assert.equal(PARCOURS.resumeProf(p).texteGrade, "🥋 Grade réussi : 19e kyu");
  assert.equal(PARCOURS.resumeProf(PARCOURS.creer()).texteGrade, "");
  assert.equal(PARCOURS.libelleGrade({mode: "flash", reglages: {}}), null);
});

test("le parcours : une séance de grade qui ne suit pas la grille est jetée ; « gradeReussi » abîmé est borné", () => {
  const seance = champs => ({version: 1, epoque: 0, reglages: {}, seances: {"1": champs}});
  const bon = ["2026-11-07", "grade", "plus", 1, 1, 3, 1, 10, 10, 8, 5, 1];
  assert.equal(Object.keys(PARCOURS.normaliser(seance(bon)).seances).length, 1);
  const variantes = [
    ["plusmoins", 2], [2, 3], [2, 4], [4, 5], [0, 6], [41, 6], [5, 7], [20, 7], ["examen", 1]
  ];
  for (const [valeur, i] of variantes) {
    const abime = bon.slice();
    abime[i] = valeur;
    assert.equal(Object.keys(PARCOURS.normaliser(seance(abime)).seances).length, 0, `champ ${i} = ${valeur}`);
  }
  assert.equal(PARCOURS.normaliser({gradeReussi: 99}).gradeReussi, 40);
  assert.equal(PARCOURS.normaliser({gradeReussi: -3}).gradeReussi, undefined);
  assert.equal(PARCOURS.normaliser({gradeReussi: "12"}).gradeReussi, 12, "le même entier, comme les autres champs du moteur");
  assert.equal(PARCOURS.normaliser({gradeReussi: "douze"}).gradeReussi, undefined);
});

test("le parcours : le grade réussi reste quand ses séances sortent des 500 gardées ; la fusion garde le plus haut, dans les deux sens", () => {
  let p = noter(PARCOURS.creer(), 1, "grade", 1, 10, 9);
  p = noter(p, 2, "grade", 2, 10, 9);
  for (let i = 0; i < 500; i += 1) p = PARCOURS.noterSeance(p, {id: 1000 + i, mode: "flash", reglages: CORE.normaliser("flash", {}), faits: 1, score: 1}, JOUR).parcours;
  assert.equal(PARCOURS.historique(p).filter(s => s.mode === "grade").length, 0, "les passages sont sortis");
  assert.equal(PARCOURS.gradeReussi(p), 2, "le grade, lui, reste");
  // Un parcours arrivé SANS la clé (une vieille copie) dont le passage réussi
  // est la plus ancienne de 501 séances : le grade est compté avant que la
  // borne la fasse sortir.
  const vieux = {version: 1, epoque: 0, reglages: {}, seances: {"1": ["2026-11-01", "grade", "plus", 1, 1, 3, 1, 10, 10, 9, 1, 1]}};
  for (let i = 2; i <= 501; i += 1) vieux.seances[String(i)] = ["2026-11-02", "flash", "plus", 2, 3, 10, 8, 10, 1, 1, 10 + i, i];
  const relu = PARCOURS.normaliser(vieux);
  assert.equal(Object.keys(relu.seances).length, 500);
  assert.equal(PARCOURS.historique(relu).some(s => s.mode === "grade"), false);
  assert.equal(relu.gradeReussi, 1);
  const autre = noter(PARCOURS.creer(), 9001, "grade", 1, 10, 7, "2026-11-08");
  const ab = PARCOURS.fusionner(p, autre);
  const ba = PARCOURS.fusionner(autre, p);
  assert.equal(ab.gradeReussi, 2);
  assert.equal(JSON.stringify(ab), JSON.stringify(ba), "le même résultat dans les deux sens");
  assert.equal(JSON.stringify(PARCOURS.fusionner(ab, ab)), JSON.stringify(ab), "rien de neuf : rien ne change");
  // Deux appareils hors ligne qui réussissent chacun un grade différent.
  const x = noter(noter(PARCOURS.creer(), 11, "grade", 1, 10, 7), 12, "grade", 2, 10, 8);
  const y = noter(PARCOURS.creer(), 21, "grade", 1, 10, 9);
  assert.equal(PARCOURS.fusionner(y, x).gradeReussi, 2);
  assert.equal(PARCOURS.fusionner(x, y).gradeReussi, 2);
  // Une époque plus haute (restauration par le professeur) gagne en bloc,
  // grade compris.
  const restaure = {...PARCOURS.creer(), epoque: 3};
  assert.equal(PARCOURS.fusionner(x, restaure).gradeReussi, undefined);
  // Un parcours sans grade ne change pas d'un octet (la clé n'apparaît pas).
  const flash = PARCOURS.noterSeance(PARCOURS.creer(), {id: 5, mode: "flash", reglages: CORE.normaliser("flash", {}), faits: 3, score: 2}, JOUR).parcours;
  assert.equal(JSON.stringify(PARCOURS.normaliser(flash)), JSON.stringify(flash));
  assert.ok(!JSON.stringify(flash).includes("grade"));
});

// Lot « grades-estampe » (07/11/2026) : le vrai nom japonais de chaque grade,
// écrit en petit à côté du nom français dans la liste et sur la fiche.
test("grades-estampe : les noms japonais — 二十級 … 一級, 初段, 二段 … 二十段", () => {
  const attendus = ["二十級", "十九級", "十八級", "十七級", "十六級", "十五級", "十四級", "十三級", "十二級", "十一級",
    "十級", "九級", "八級", "七級", "六級", "五級", "四級", "三級", "二級", "一級",
    "初段", "二段", "三段", "四段", "五段", "六段", "七段", "八段", "九段", "十段",
    "十一段", "十二段", "十三段", "十四段", "十五段", "十六段", "十七段", "十八段", "十九段", "二十段"];
  for (let n = 1; n <= 40; n += 1) assert.equal(CORE.nomJaponais(n), attendus[n - 1], CORE.nomGrade(n));
  assert.equal(CORE.nomJaponais(0), "");
  assert.equal(CORE.nomJaponais(41), "");
  assert.equal(CORE.nomJaponais(2.5), "");
});
