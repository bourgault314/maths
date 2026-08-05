import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { creerRegistreAutomatismes } from "../../registre.js";
import {
  FAMILLES_NC01,
  genererSerieNC01,
  planifierSerieNC01,
  signatureVisibleQuestion,
} from "./serie.js";

function occurrences(plan) {
  const resultat = new Map();
  for (const { famille } of plan) {
    resultat.set(famille, (resultat.get(famille) ?? 0) + 1);
  }
  return resultat;
}

describe("NC-01 — plan équilibré de série", () => {
  it("fait de cinq questions une révision courte incluant le sens du partage", () => {
    const compte = occurrences(planifierSerieNC01({
      graine: "cinq",
      nombreQuestions: 5,
    }));
    assert.deepEqual(
      [...compte.keys()].sort(),
      [
        FAMILLES_NC01.F1,
        FAMILLES_NC01.F2,
        FAMILLES_NC01.F3,
        FAMILLES_NC01.F4,
        FAMILLES_NC01.F6,
      ].sort(),
    );
    assert.equal(compte.has(FAMILLES_NC01.F5), false);
  });

  it("garantit les quotas 2/2/2/2/1/1 pour dix questions", () => {
    for (let graine = 0; graine < 300; graine += 1) {
      const plan = planifierSerieNC01({ graine: `quota-${graine}`, nombreQuestions: 10 });
      const compte = occurrences(plan);
      assert.equal(compte.get(FAMILLES_NC01.F1), 2);
      assert.equal(compte.get(FAMILLES_NC01.F2), 2);
      assert.equal(compte.get(FAMILLES_NC01.F3), 2);
      assert.equal(compte.get(FAMILLES_NC01.F4), 2);
      assert.equal(compte.get(FAMILLES_NC01.F5), 1);
      assert.equal(compte.get(FAMILLES_NC01.F6), 1);
    }
  });

  it("couvre les trois sous-formes de production et de partage en vingt questions", () => {
    const plan = planifierSerieNC01({ graine: "vingt", nombreQuestions: 20 });
    const compte = occurrences(plan);
    assert.deepEqual(
      [...compte.values()].sort((a, b) => a - b),
      [3, 3, 3, 3, 4, 4],
    );
    assert.deepEqual(
      plan.filter(({ famille }) => famille === FAMILLES_NC01.F5)
        .map(({ parametres }) => parametres.sousForme).sort(),
      ["plus-petit", "toutes-solutions", "unique"],
    );
    assert.deepEqual(
      plan.filter(({ famille }) => famille === FAMILLES_NC01.F6)
        .map(({ parametres }) => parametres.sousForme).sort(),
      ["groupes-possibles", "oui-non", "retrait-minimal"],
    );
  });

  it("renforce F5 et F6 dans une consolidation de quinze questions", () => {
    const compte = occurrences(planifierSerieNC01({
      graine: "quinze",
      nombreQuestions: 15,
    }));
    assert.equal(compte.get(FAMILLES_NC01.F1), 3);
    assert.equal(compte.get(FAMILLES_NC01.F2), 3);
    assert.equal(compte.get(FAMILLES_NC01.F3), 3);
    assert.equal(compte.get(FAMILLES_NC01.F4), 2);
    assert.equal(compte.get(FAMILLES_NC01.F5), 2);
    assert.equal(compte.get(FAMILLES_NC01.F6), 2);
  });

  it("commence simplement et n'enchaîne jamais deux familles identiques", () => {
    for (let graine = 0; graine < 500; graine += 1) {
      const plan = planifierSerieNC01({ graine: `ordre-${graine}`, nombreQuestions: 10 });
      assert.ok([FAMILLES_NC01.F1, FAMILLES_NC01.F2].includes(plan[0].famille));
      plan.slice(1).forEach((element, index) => {
        assert.notEqual(element.famille, plan[index].famille);
      });
    }
  });

  it("reste fiable pour toutes les longueurs acceptées par le lecteur", () => {
    for (const nombreQuestions of [1, 2, 9, 10, 30, 40, 50, 75, 100]) {
      for (let graine = 0; graine < 40; graine += 1) {
        const plan = planifierSerieNC01({
          graine: `longueur-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.equal(plan.length, nombreQuestions);
        plan.slice(1).forEach((element, index) => {
          assert.notEqual(element.famille, plan[index].famille);
        });
      }
    }
  });

  it("équilibre critères, verdicts et sous-formes structurantes", () => {
    for (let graine = 0; graine < 200; graine += 1) {
      const plan = planifierSerieNC01({ graine: `equilibre-${graine}`, nombreQuestions: 10 });
      const criteres = plan
        .filter(({ famille }) => [FAMILLES_NC01.F1, FAMILLES_NC01.F3, FAMILLES_NC01.F5].includes(famille))
        .map(({ famille, parametres }) => famille === FAMILLES_NC01.F5
          ? parametres.critere
          : parametres.diviseur);
      assert.deepEqual([...new Set(criteres)].sort((a, b) => a - b), [2, 3, 5, 9, 10]);
      assert.deepEqual(
        plan.filter(({ famille }) => famille === FAMILLES_NC01.F1)
          .map(({ parametres }) => parametres.verdict).sort(),
        ["non", "oui"],
      );
      assert.deepEqual(
        plan.filter(({ famille }) => famille === FAMILLES_NC01.F4)
          .map(({ parametres }) => parametres.verdict).sort(),
        ["faux", "vrai"],
      );
      assert.deepEqual(
        plan.filter(({ famille }) => famille === FAMILLES_NC01.F4)
          .map(({ parametres }) => parametres.sousForme).sort(),
        ["justification", "vrai-faux"],
      );
    }
  });

  it("rejoue exactement le même plan", () => {
    assert.deepEqual(
      planifierSerieNC01({ graine: "rejouer", nombreQuestions: 10 }),
      planifierSerieNC01({ graine: "rejouer", nombreQuestions: 10 }),
    );
  });
});

describe("NC-01 — génération de la série", () => {
  it("produit dix questions des six familles sans doublon visible", () => {
    const questions = genererSerieNC01({
      registre: creerRegistreAutomatismes(),
      graine: "serie-complete",
      nombreQuestions: 10,
    });
    assert.equal(questions.length, 10);
    assert.equal(new Set(questions.map(signatureVisibleQuestion)).size, 10);
    assert.deepEqual(
      [...new Set(questions.map((question) => question.classement.famille))].sort(),
      Object.values(FAMILLES_NC01).sort(),
    );
  });

  it("rejoue les mêmes instances et varie avec une autre graine", () => {
    const registre = creerRegistreAutomatismes();
    const a = genererSerieNC01({ registre, graine: "a", nombreQuestions: 10 });
    const encoreA = genererSerieNC01({ registre, graine: "a", nombreQuestions: 10 });
    const b = genererSerieNC01({ registre, graine: "b", nombreQuestions: 10 });
    assert.deepEqual(a, encoreA);
    assert.notDeepEqual(a, b);
  });
});
