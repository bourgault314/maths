// Contrôle des sujets « Évaluation nationale 6e — Automatismes » : officiel fidèle, jumeaux sains.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../outils/evaluations_nationales/en_commun.js");
require("../outils/evaluations_nationales/sujets/6e_automatismes.js");
const S = globalThis.EN_SUJETS["6e-automatismes"];
const { hasard } = globalThis.EN;
const texte = (h) => h.replace(/<span class="frac"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, "$1/$2").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const OFFICIEL = {
  1: "76 004", 2: "0,072", 3: "3,2", 4: "0,04", 5: "10 fois 5 millièmes.", 6: "2 600 000", 7: "2,2", 8: "4/10",
  9: "87 842", 10: "1,082", 11: "3/7", 12: "7", 13: "4,05", 14: "7 548,2", 15: "17", 16: "mm", 17: "22 cm",
  18: "10 fois", 19: "240", 20: "9 cm²", 21: "20 cm³", 22: "Les angles B et E sont égaux.", 23: "grammes (g)",
};
const OFFICIEL_CHOIX = {
  1: ["76 004", "76 1004", "60 16 1 004", "16 004"], 2: ["0,720", "72,001", "72,1000", "0,072"], 3: ["0,32", "3,2", "32,0", "32,10"],
  4: ["0,04", "0,4", "4", "400"], 6: ["2 600 000", "2 060 000", "2 000 600", "2 000 006"], 7: ["2,2", "1,12", "22", "20,2"],
  8: ["1/4", "4/1", "4/10", "10/4"], 9: ["9 345", "87 842", "235 412", "1 010 000"], 10: ["1,082", "1,4", "1,09", "2,03"],
  11: ["3/4", "3/7", "4/4", "4/7"], 12: ["8", "6", "7", "5"], 13: ["4,20", "4,50", "4,05", "4,5"], 14: ["7,5482", "75,482", "7 548,2", "75 482"],
  15: ["1,7", "15,2", "17", "152,0"], 17: ["18 cm", "22 cm", "28 cm", "14 cm"], 19: ["0,24", "2,4", "240", "2 400"], 20: ["6 cm²", "9 cm²", "12 cm²", "15 cm²"],
  21: ["4 cm³", "9 cm³", "20 cm³", "24 cm³"],
};

test("23 questions, 15 en nombres et calculs, 8 en grandeurs et mesures", () => {
  assert.equal(S.questions.length, 23);
  assert.equal(S.questions.filter((q) => q.domaine === "NC").length, 15);
  assert.equal(S.questions.filter((q) => q.domaine === "GM").length, 8);
});

test("le sujet officiel reprend exactement les réponses et les choix de 2026", () => {
  for (const q of S.questions) {
    const g = q.generer(hasard(1), true);
    const justes = g.choix.filter((x) => x.juste).map((x) => texte(x.html));
    assert.deepEqual(justes, [OFFICIEL[q.num]], `question ${q.num}`);
    if (OFFICIEL_CHOIX[q.num]) assert.deepEqual(new Set(g.choix.map((x) => texte(x.html))), new Set(OFFICIEL_CHOIX[q.num]), `choix ${q.num}`);
  }
});

test("2 000 sujets jumeaux : 4 choix distincts, une seule bonne réponse, un piège expliqué pour chaque faux", () => {
  for (let graine = 1; graine <= 2000; graine++) {
    const r = hasard(graine);
    for (const q of S.questions) {
      const g = q.generer(r, false);
      assert.equal(g.choix.length, 4, `q${q.num} graine ${graine}`);
      const t = g.choix.map((x) => texte(x.html));
      assert.equal(new Set(t).size, 4, `q${q.num} graine ${graine} : ${t.join(" | ")}`);
      assert.equal(g.choix.filter((x) => x.juste).length, 1, `q${q.num} graine ${graine}`);
      for (const x of g.choix) if (!x.juste) assert.ok(x.erreur, `q${q.num} : piège sans explication`);
      assert.ok(!/NaN|undefined|Infinity/.test(t.join() + g.enonce), `q${q.num} graine ${graine}`);
    }
  }
});

// Les bonnes réponses des jumeaux (et la variété de leurs formes) sont contrôlées depuis le lot EN4c dans
// tests/evaluations-nationales-6e-variete.test.mjs : la réponse y est recalculée depuis l'énoncé ou la figure.
