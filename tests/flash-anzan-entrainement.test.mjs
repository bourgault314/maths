// Anzan, lot « entraînement 5 ou 10 » (07/11/2026) : « 🎯 M'entraîner » à un
// grade se fait en 5 ou 10 calculs, au choix de l'élève (Rania trouvait 10
// trop long) ; le PASSAGE d'un grade reste à 10. Ici : le noyau (les
// réglages, la moitié de la feuille en Colonne) et le format du parcours
// (le moteur de l'appli et sa copie de la page prof). La page est jouée
// dans tests/flash-anzan-seance.test.mjs.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");
const PARCOURS = require("../outils/calcul_mental/flash_anzan_parcours.js");

const JOUR = "2026-11-07";
// Une séance de grade telle que la page la note, en `calculs` calculs.
const seance = (mode, n, calculs, faits = calculs, score = faits, id = 7) => {
  const r = CORE.reglagesGrade(n, "bip", calculs);
  return [JOUR, mode, r.operations, r.chiffresMin, r.chiffresMax, r.nombres, n, calculs, faits, score, id, 1];
};
const garde = liste => PARCOURS.normaliserSeance(liste) !== null;

test("le noyau : 5 ou 10 calculs pour s'entraîner, la même liste dans le moteur du parcours ; tout autre nombre donne 10", () => {
  assert.deepEqual([...CORE.ENTRAINEMENT_CALCULS], [5, 10]);
  assert.deepEqual([...PARCOURS.ENTRAINEMENT_CALCULS], [...CORE.ENTRAINEMENT_CALCULS], "recopiée à l'identique");
  for (const n of [1, 8, 20, 40, 41, 48, 53]) {
    assert.equal(CORE.reglagesGrade(n, "bip").calculs, 10, `grade ${n} : 10 par défaut`);
    assert.equal(CORE.reglagesGrade(n, "bip", 5).calculs, 5);
    assert.equal(CORE.reglagesGrade(n, "bip", 10).calculs, 10);
    for (const autre of [0, 1, 7, 20, "5", null]) assert.equal(CORE.reglagesGrade(n, "bip", autre).calculs, 10, `grade ${n}, ${autre} : 10`);
    // Le reste des réglages ne bouge pas.
    const {calculs: _a, ...dix} = CORE.reglagesGrade(n, "bip", 10);
    const {calculs: _b, ...cinq} = CORE.reglagesGrade(n, "bip", 5);
    assert.deepEqual(cinq, dix);
  }
});

test("le noyau : au Flash, 5 calculs tirés ; en Colonne, une forme sur deux de la feuille, le mélange gardé", () => {
  const rng = CORE.mulberry32(12345);
  for (let n = 1; n <= CORE.NB_GRADES; n += 1) {
    assert.equal(CORE.tirerSeance(CORE.reglagesGrade(n, "bip", 5), rng).length, 5, `grade ${n}`);
  }
  const attendus = {
    41: ["u3", "u4", "u4", "u5", "u5"], 45: ["m6", "m6", "m6", "m6", "m6"], 47: ["d5", "d5", "d5", "d5", "d5"],
    48: ["d5", "d5", "t5", "t5", "t5"], 50: ["t5", "t5", "t7", "t7", "t7"],
    52: ["t7", "t7", "t10", "t10", "s10"], 53: ["t10", "t10", "t10", "s10", "s10"]
  };
  for (const [n, plan] of Object.entries(attendus)) assert.deepEqual(CORE.planColonne(Number(n), 5), plan, `grade ${n}`);
  for (let n = CORE.PREMIER_COLONNE; n <= CORE.DERNIER_GRADE; n += 1) {
    assert.deepEqual(CORE.planColonne(n, 10), [...CORE.GRADES_COLONNE[n - CORE.PREMIER_COLONNE].plan], "10 : la feuille entière");
    assert.deepEqual(CORE.planColonne(n), CORE.planColonne(n, 10), "sans nombre : la feuille entière");
    for (let essai = 0; essai < 50; essai += 1) {
      const calculs = CORE.tirerSeance(CORE.reglagesGrade(n, "bip", 5), rng);
      assert.equal(calculs.length, 5);
      // Les mêmes nombres de nombres que le plan (l'ordre des calculs de 10
      // nombres peut changer : leur place est tirée au hasard).
      assert.deepEqual(calculs.map(c => c.termes.length).sort((a, b) => a - b),
        CORE.planColonne(n, 5).map(f => (f[0] === "u" || f[0] === "t" || f[0] === "s" || f[0] === "d" ? Number(f.slice(1)) : 5)).sort((a, b) => a - b));
      calculs.forEach(c => assert.ok(c.total >= 0));
    }
  }
  // Pré-1er et 1er kyu : au moins un calcul avec des nombres enlevés.
  for (const n of [52, 53]) {
    const calculs = CORE.tirerSeance(CORE.reglagesGrade(n, "bip", 5), rng);
    assert.ok(calculs.some(c => c.termes.some(t => t.signe < 0)), `grade ${n} : un calcul « s10 »`);
  }
});

test("le parcours : un entraînement en 5 ou 10 calculs est gardé ; un passage en 5, jamais ; aucun autre nombre", () => {
  for (const n of [1, 8, 9, 20, 21, 40, 41, 44, 52, 53]) {
    assert.ok(garde(seance("entrainement", n, 5)), `entraînement ${n} en 5`);
    assert.ok(garde(seance("entrainement", n, 10)), `entraînement ${n} en 10`);
    assert.ok(garde(seance("grade", n, 10)), `passage ${n} en 10`);
    assert.ok(!garde(seance("grade", n, 5)), `passage ${n} en 5 : jeté`);
    assert.ok(!garde(seance("entrainement", n, 20)), `entraînement ${n} en 20 : jeté`);
    const sept = seance("entrainement", n, 5);
    sept[7] = 7;
    assert.ok(!garde(sept), `entraînement ${n} en 7 : jeté`);
  }
  // Un entraînement de 5 : au plus 5 faits, au plus 5 justes.
  const trop = seance("entrainement", 1, 5, 9, 9);
  const s = PARCOURS.normaliserSeance(trop);
  assert.deepEqual([s.calculs, s.faits, s.score], [5, 5, 5]);
});

test("le parcours : un entraînement en 5, réussi ou non, ne réussit aucun grade ; il compte ses calculs ; il passe la fusion", () => {
  let p = PARCOURS.creer();
  p = PARCOURS.noterSeance(p, {id: 11, mode: "entrainement", reglages: CORE.reglagesGrade(1, "bip", 5), faits: 5, score: 5}, JOUR).parcours;
  p = PARCOURS.noterSeance(p, {id: 12, mode: "entrainement", reglages: CORE.reglagesGrade(41, "bip", 5), faits: 3, score: 3}, JOUR).parcours;
  assert.equal(p.gradeReussi, undefined);
  assert.equal(p.gradeColonne, undefined);
  const h = PARCOURS.historique(p);
  assert.equal(h.length, 2);
  assert.deepEqual(h.map(x => [x.mode, x.calculs, x.faits, x.arretee]), [["entrainement", 5, 3, true], ["entrainement", 5, 5, false]]);
  assert.equal(PARCOURS.resume(p).calculs, 8);
  assert.deepEqual(PARCOURS.libelleGrade(h[1]), {mode: "🎯 20e kyu", details: "Entraînement au grade"});
  // Le serveur renvoie le parcours : rien ne se perd, dans les deux sens.
  const retour = JSON.parse(JSON.stringify(PARCOURS.pourServeur ? PARCOURS.pourServeur(p) : p));
  assert.deepEqual(PARCOURS.fusionner(retour, PARCOURS.creer()).seances, p.seances);
  assert.deepEqual(PARCOURS.fusionner(PARCOURS.creer(), retour).seances, p.seances);
});

test("la page prof reçoit le même moteur, octet pour octet", () => {
  assert.equal(readFileSync(new URL("../_serveur/public/prof/flash_anzan_parcours.js", import.meta.url), "utf8"),
    readFileSync(new URL("../outils/calcul_mental/flash_anzan_parcours.js", import.meta.url), "utf8"));
});

test("le résumé d'une séance au Flash : le temps par nombre ET le temps du calcul en entier", () => {
  const nb = t => t.replace(/ /g, " ");
  const r = CORE.normaliser("flash", {});
  assert.equal(nb(CORE.resume("flash", r)), "⚡ Flash · 2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout");
  assert.equal(nb(CORE.resume("flash", CORE.normaliser("flash", {nombres: 3, temps: 1}), {avecMode: false})), "2 à 3 chiffres · 3 nombres · 0,1 s par nombre · 0,3 s en tout");
  assert.equal(nb(CORE.resume("flash", CORE.normaliser("flash", {nombres: 30, temps: 50}), {avecMode: false})), "2 à 3 chiffres · 30 nombres · 5 s par nombre · 150 s en tout");
  assert.equal(nb(CORE.resume("flash", CORE.normaliser("flash", {nombres: 7, temps: 3}), {avecMode: false})), "2 à 3 chiffres · 7 nombres · 0,3 s par nombre · 2,1 s en tout");
  // La Colonne et les grades ne changent pas.
  assert.equal(nb(CORE.resume("colonne", CORE.normaliser("colonne", {limite: 20}))), "📝 Colonne · + et − · 3 chiffres · 8 nombres · 20 s");
  assert.doesNotMatch(CORE.resume("entrainement", CORE.reglagesGrade(8, "bip", 5)), /par nombre/);
});

test("le résumé ne se coupe qu'après un point : « 8 s en tout » et « 0,8 s par nombre » d'un bloc, le point collé au morceau d'avant (noyau et page prof)", () => {
  const r = CORE.normaliser("flash", {});
  const t = CORE.resume("flash", r);
  assert.ok(t.includes("0,8 s par nombre"), t);
  assert.ok(t.includes("8 s en tout"), t);
  assert.ok(!t.includes(" · "), "aucun « · » précédé d'une espace sécable");
  assert.equal(t.split(" · ").length, 5, "quatre points, tous collés au morceau d'avant");
  const g = CORE.resume("entrainement", CORE.reglagesGrade(1, "bip", 5));
  assert.ok(g.includes("5 s en tout") && !g.includes(" · "), g);
  const prof = readFileSync(new URL("../_serveur/public/prof/index.php", import.meta.url), "utf8");
  assert.match(prof, /return morceaux\.join\("\\u00a0· "\);/);
  assert.match(prof, /\\u00a0par\\u00a0nombre`, `\$\{sec\(r\.nombres \* \(r\.temps \/ 10\)\)\}\\u00a0en\\u00a0tout`/);
});
