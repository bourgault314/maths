// Anzan, lot « grades-colonne » (07/11/2026) : les 13 grades en Colonne
// (みとり暗算 du 暗算検定 du 日本珠算連盟, vérifiés sur dix sujets modèles
// officiels de shuzan.jp et le document de la chambre de commerce de
// Kurashiki), leurs calculs, et ce que le parcours en garde (le moteur de
// l'appli et sa copie de la page prof). La page est jouée dans
// tests/flash-anzan-seance.test.mjs.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");
const PARCOURS = require("../outils/calcul_mental/flash_anzan_parcours.js");

const JOUR = "2026-11-07";
const noter = (p, id, mode, n, faits, score, jour = JOUR) =>
  PARCOURS.noterSeance(p, {id, mode, reglages: CORE.reglagesGrade(n, "bip"), faits, score}, jour).parcours;
const chiffres = v => String(v).length;

test("la grille : 13 grades, du 10e kyu (十級, numéro 41) au 1er kyu (一級, 53), 準 compris, recopiée à l'identique dans le moteur du parcours", () => {
  assert.equal(CORE.NB_GRADES_COLONNE, 13);
  assert.equal(CORE.PREMIER_COLONNE, 41);
  assert.equal(CORE.DERNIER_GRADE, 53);
  const noms = [];
  const japonais = [];
  for (let n = 41; n <= 53; n += 1) { noms.push(CORE.nomGrade(n)); japonais.push(CORE.nomJaponais(n)); }
  assert.deepEqual(noms, ["10e kyu", "9e kyu", "8e kyu", "7e kyu", "6e kyu", "5e kyu", "4e kyu", "pré-3e kyu", "3e kyu", "pré-2e kyu", "2e kyu", "pré-1er kyu", "1er kyu"]);
  assert.deepEqual(japonais, ["十級", "九級", "八級", "七級", "六級", "五級", "四級", "準三級", "三級", "準二級", "二級", "準一級", "一級"]);
  // Les seuils officiels sur 500 (250, 300, 350, 400, puis 400) ramenés à 10.
  assert.deepEqual(CORE.GRADES_COLONNE.map(c => c.seuil), [5, 6, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]);
  // 15 s par calcul du 10e au 7e kyu (12 min ÷ 50), sans limite ensuite (rien d'officiel).
  assert.deepEqual(CORE.GRADES_COLONNE.map(c => c.limite), [15, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.ok(CORE.LIMITES.includes(15), "15 s est une limite du mode Colonne");
  // Additions seules jusqu'au 2e kyu ; des soustractions au pré-1er et au 1er.
  assert.deepEqual(CORE.GRADES_COLONNE.map(c => c.operations), [...Array(11).fill("plus"), "plusmoins", "plusmoins"]);
  for (let n = 41; n <= 53; n += 1) {
    assert.equal(PARCOURS.nomGrade(n), CORE.nomGrade(n));
    assert.equal(PARCOURS.seuilGrade(n), CORE.seuilGrade(n));
    const c = CORE.GRADES_COLONNE[n - 41];
    const p = PARCOURS.GRADES_COLONNE[n - 41];
    assert.deepEqual([p.kyu, p.pre, p.chiffresMin, p.chiffresMax, p.nombres, p.operations, p.seuil],
      [c.kyu, c.pre, c.chiffresMin, c.chiffresMax, c.nombres, c.operations, c.seuil], `ligne ${n}`);
    assert.equal(c.plan.length, 10);
  }
  assert.equal(CORE.nomGrade(54), "");
  assert.equal(CORE.seuilGrade(1), 7, "le Flash garde 7 sur 10");
});

test("les réglages d'un grade en Colonne : la colonne, 10 calculs, la limite de la grille", () => {
  const r = CORE.reglagesGrade(41, "bip");
  assert.deepEqual(r, {operations: "plus", chiffresMin: 1, chiffresMax: 1, nombres: 5, calculs: 10, grade: 41, colonne: true, limite: 15});
  assert.equal(CORE.reglagesGrade(45).limite, 0);
  assert.equal(CORE.reglagesGrade(53).operations, "plusmoins");
  assert.equal(CORE.reglagesGrade(54), null);
  assert.equal(CORE.texteGrade(41).replace(/\u00a0/g, " "), "3 à 5 nombres d’un chiffre · 15 s par calcul");
  assert.equal(CORE.texteGrade(45).replace(/\u00a0/g, " "), "5 nombres de 1 ou 2 chiffres");
  assert.equal(CORE.texteGrade(48).replace(/\u00a0/g, " "), "5 nombres de 2, puis de 3 chiffres");
  assert.equal(CORE.texteGrade(50).replace(/\u00a0/g, " "), "5 puis 7 nombres de 3 chiffres");
  assert.equal(CORE.texteGrade(52).replace(/\u00a0/g, " "), "7 puis 10 nombres de 3 chiffres, + et −");
  assert.equal(CORE.texteGrade(53).replace(/\u00a0/g, " "), "10 nombres de 3 chiffres, + et −");
  assert.equal(CORE.resume("grade", r).replace(/\u00a0/g, " "), "🥋 10e kyu · Colonne · 3 à 5 nombres d’un chiffre · 15 s par calcul");
  assert.equal(CORE.resume("entrainement", CORE.reglagesGrade(53), {avecMode: false}).replace(/\u00a0/g, " "), "10 nombres de 3 chiffres, + et −");
  // Le verdict suit le seuil du grade.
  assert.equal(CORE.verdictGrade(10, 5, 41), "reussi");
  assert.equal(CORE.verdictGrade(10, 4, 41), "presque");
  assert.equal(CORE.verdictGrade(10, 2, 41), "pasencore");
  assert.equal(CORE.verdictGrade(10, 7, 44), "presque");
  assert.equal(CORE.verdictGrade(10, 8, 53), "reussi");
  assert.equal(CORE.verdictGrade(10, 7, 1), "reussi", "le Flash ne change pas");
  assert.equal(CORE.verdictGrade(9, 9, 41), "arrete");
});

// Les sous-entendus des sujets modèles, joués sur 400 séances par grade.
test("les calculs suivent la feuille : la forme de chaque calcul, et ce que les sujets modèles sous-entendent", () => {
  const formes = {
    41: [3, 3, 3, 4, 4, 4, 5, 5, 5, 5], 45: Array(10).fill(5), 47: Array(10).fill(5),
    48: Array(10).fill(5), 49: Array(10).fill(5), 50: [5, 5, 5, 5, 5, 7, 7, 7, 7, 7], 51: Array(10).fill(7),
    52: [7, 7, 7, 7, 7, 10, 10, 10, 10, 10], 53: Array(10).fill(10)
  };
  for (let n = 41; n <= 53; n += 1) {
    const rng = CORE.mulberry32(1000 + n);
    for (let essai = 0; essai < 400; essai += 1) {
      const seance = CORE.tirerSeance(CORE.reglagesGrade(n), rng);
      assert.equal(seance.length, 10);
      let avecMoins = 0;
      seance.forEach((calcul, i) => {
        const v = calcul.termes.map(t => t.valeur);
        const attendu = formes[n] || formes[n <= 44 ? 41 : 45];
        assert.equal(v.length, attendu[i], `grade ${n}, calcul ${i + 1}`);
        // Le total est juste ; aucun nombre deux fois de suite ; jamais de zéro devant.
        assert.equal(calcul.termes.reduce((a, t) => a + t.signe * t.valeur, 0), calcul.total);
        v.forEach((x, j) => { if (j) assert.notEqual(x, v[j - 1], `grade ${n} : ${v}`); assert.ok(x >= 1); });
        if (n <= 44) {
          // 10e-7e kyu : 1 à 9, sans zéro, aucun chiffre deux fois dans un calcul.
          assert.ok(v.every(x => x >= 1 && x <= 9));
          assert.equal(new Set(v).size, v.length, `grade ${n} : ${v}`);
        } else if (n === 45 || n === 46) {
          // 6 chiffres en tout (un nombre de 2 chiffres) ; 8 (trois).
          assert.equal(v.reduce((a, x) => a + chiffres(x), 0), n === 45 ? 6 : 8, `${v}`);
          assert.ok(v.every(x => x <= 99));
        } else if (n === 47) {
          assert.ok(v.every(x => x >= 10 && x <= 99));
        } else if (n === 48) {
          assert.ok(v.every(x => chiffres(x) === (i < 5 ? 2 : 3)), `${v}`);
        } else {
          assert.ok(v.every(x => x >= 100 && x <= 999));
        }
        const moins = calcul.termes.map((t, j) => (t.signe < 0 ? j : -1)).filter(j => j >= 0);
        if (moins.length) {
          avecMoins += 1;
          // 4 nombres enlevés sur 10, jamais le 1er, le 2e ni le dernier ;
          // le total reste au-dessus de zéro après chaque nombre.
          assert.equal(v.length, 10);
          assert.equal(moins.length, 4);
          assert.ok(moins.every(j => j >= 2 && j <= 8), `${moins}`);
          let total = 0;
          calcul.termes.forEach(t => { total += t.signe * t.valeur; assert.ok(total > 0, `${v}`); });
          if (n === 52) assert.ok(i >= 5, "pré-1er kyu : les calculs à 7 nombres sont des additions");
        }
      });
      assert.equal(avecMoins, n === 52 ? 2 : n === 53 ? 4 : 0, `grade ${n}`);
    }
  }
});

test("le parcours : une séance de grade en Colonne est notée à sa ligne de la grille, rien d'approché", () => {
  let p = noter(PARCOURS.creer(), 11, "grade", 41, 10, 5);
  assert.equal(PARCOURS.normaliser(p).gradeColonne, 1, "10e kyu réussi à 5 sur 10");
  assert.equal(PARCOURS.gradeReussi(p), 0, "le Flash ne bouge pas");
  const s = PARCOURS.historique(p)[0];
  assert.equal(s.grade, 41);
  assert.equal(s.reussi, true);
  assert.deepEqual(PARCOURS.libelleGrade(s), {mode: "🥋 10e kyu · Colonne", details: "Passage · réussi"});
  // Les réglages d'un autre grade, ou d'une séance libre, sont refusés.
  const faux = PARCOURS.noterSeance(PARCOURS.creer(), {id: 12, mode: "grade", reglages: {...CORE.reglagesGrade(41), nombres: 6}, faits: 10, score: 10}, JOUR);
  assert.equal(faux.numero, null);
  const faux2 = PARCOURS.noterSeance(PARCOURS.creer(), {id: 13, mode: "grade", reglages: {...CORE.reglagesGrade(53), operations: "plus"}, faits: 10, score: 10}, JOUR);
  assert.equal(faux2.numero, null);
  // Le seuil du grade : 7 sur 10 au 7e kyu ne suffit pas (8).
  p = noter(p, 14, "grade", 42, 10, 6);
  p = noter(p, 15, "grade", 43, 10, 7);
  p = noter(p, 16, "grade", 44, 10, 7);
  assert.equal(PARCOURS.gradeColonneReussi(p), 3);
  assert.deepEqual(PARCOURS.libelleGrade(PARCOURS.historique(p)[0]), {mode: "🥋 7e kyu · Colonne", details: "Passage · presque"});
  // L'entraînement ne compte pas ; un passage arrêté non plus.
  p = noter(p, 17, "entrainement", 44, 10, 10);
  p = noter(p, 18, "grade", 44, 9, 9);
  assert.equal(PARCOURS.gradeColonneReussi(p), 3);
  assert.deepEqual(PARCOURS.libelleGrade(PARCOURS.historique(p)[1]), {mode: "🎯 7e kyu · Colonne", details: "Entraînement au grade"});
});

test("le parcours : les cadenas en Colonne, la fusion (le plus haut des deux), la borne des 500 séances", () => {
  let p = PARCOURS.creer();
  let etat = PARCOURS.etatGradesColonne(p);
  assert.equal(etat.length, 13);
  assert.deepEqual(etat.slice(0, 2).map(g => [g.numero, g.nom, g.ouvert, g.actuel]), [[41, "10e kyu", true, true], [42, "9e kyu", false, false]]);
  p = noter(p, 21, "grade", 41, 10, 9);
  etat = PARCOURS.etatGradesColonne(p);
  assert.deepEqual(etat.slice(0, 3).map(g => [g.reussi, g.ouvert, g.actuel, g.meilleur]), [[true, true, false, 9], [false, true, true, null], [false, false, false, null]]);
  // Les grades du Flash et de la Colonne ne se mêlent pas.
  assert.equal(PARCOURS.etatGrades(p)[0].actuel, true);
  assert.equal(PARCOURS.etatGrades(p)[0].meilleur, null);
  // Fusion : le plus haut des deux, dans les deux sens.
  const a = noter(PARCOURS.creer(), 31, "grade", 41, 10, 10);
  let b = PARCOURS.creer();
  for (let n = 41, id = 40; n <= 46; n += 1, id += 1) b = noter(b, id, "grade", n, 10, 10);
  assert.equal(PARCOURS.gradeColonneReussi(PARCOURS.fusionner(a, b)), 6);
  assert.equal(PARCOURS.gradeColonneReussi(PARCOURS.fusionner(b, a)), 6);
  assert.deepEqual(PARCOURS.fusionner(a, b), PARCOURS.fusionner(b, a));
  // Les séances sorties des 500 gardées : seule la clé reste ; la fusion
  // garde quand même le plus haut.
  assert.equal(PARCOURS.gradeColonneReussi(PARCOURS.fusionner({gradeColonne: 6}, {gradeColonne: 2})), 6);
  assert.equal(PARCOURS.gradeColonneReussi(PARCOURS.fusionner({gradeColonne: 2}, {gradeColonne: 6})), 6);
  // Le grade reste quand ses séances sortent des 500 gardées.
  let q = noter(PARCOURS.creer(), 1, "grade", 41, 10, 10);
  for (let i = 0; i < 510; i += 1) q = PARCOURS.noterSeance(q, {id: 1000 + i, mode: "colonne", reglages: CORE.normaliser("colonne", {}), faits: 10, score: 3}, JOUR).parcours;
  assert.equal(Object.keys(q.seances).length, PARCOURS.SEANCES_MAX);
  assert.equal(PARCOURS.gradeColonneReussi(q), 1);
  // Une donnée abîmée : bornée, comme gradeReussi.
  assert.equal(PARCOURS.normaliser({gradeColonne: "x"}).gradeColonne, undefined);
  assert.equal(PARCOURS.normaliser({gradeColonne: -3}).gradeColonne, undefined);
  assert.equal(PARCOURS.normaliser({gradeColonne: 99}).gradeColonne, 13);
});

test("le parcours d'une élève qui ne passe pas de grade en Colonne reste octet pour octet celui d'avant", () => {
  let p = noter(PARCOURS.creer(), 5, "grade", 1, 10, 9);
  p = PARCOURS.noterSeance(p, {id: 6, mode: "colonne", reglages: CORE.normaliser("colonne", {}), faits: 10, score: 8}, JOUR).parcours;
  assert.ok(!("gradeColonne" in p));
  assert.ok(!JSON.stringify(p).includes("gradeColonne"));
});

test("Ma classe : le grade en Colonne à côté de celui du Flash", () => {
  const flash = noter(PARCOURS.creer(), 1, "grade", 1, 10, 9);
  const colonne = noter(PARCOURS.creer(), 2, "grade", 41, 10, 9);
  const deux = noter(flash, 3, "grade", 41, 10, 9);
  assert.equal(PARCOURS.resumeProf(flash).texteGrade, "🥋 Grade réussi : 20e kyu");
  assert.equal(PARCOURS.resumeProf(flash).gradeColonne, 0);
  assert.equal(PARCOURS.resumeProf(colonne).texteGrade, "🥋 Grade réussi : 10e kyu en Colonne");
  assert.equal(PARCOURS.resumeProf(colonne).gradeColonne, 41);
  assert.equal(PARCOURS.resumeProf(colonne).grade, 0);
  assert.equal(PARCOURS.resumeProf(deux).texteGrade, "🥋 Grades réussis : 20e kyu en Flash · 10e kyu en Colonne");
  // La page prof écrit la ligne du tableau avec nomGrade du moteur.
  const prof = readFileSync(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
  // Lot S4c : la colonne « Colonne » de l'onglet Anzan porte le grade Colonne.
  assert.match(prof, /const cColonne = cellule\(parMode\.colonne, lu\.gradeColonne\);/);
  assert.match(prof, /if \(grade && ANZAN && ANZAN\.nomGrade\) td\.append\(el\("small", "anzan-grade", `🥋 \$\{ANZAN\.nomGrade\(grade\)\}`\)\);/);
});

test("le serveur connaît la clé gradeColonne (lib/applis.php)", () => {
  assert.ok(PARCOURS.CLES_SERVEUR.includes("gradeColonne"));
  const applis = readFileSync(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");
  assert.match(applis, /'gradeReussi', 'gradeColonne'\]/);
});
