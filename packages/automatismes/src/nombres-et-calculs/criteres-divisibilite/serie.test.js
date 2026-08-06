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
  it("garantit les quotas validés pour 5, 10, 15 et 20 questions", () => {
    const quotas = new Map([
      [5, [1, 2, 1, 0, 1]],
      [10, [2, 3, 2, 1, 2]],
      [15, [3, 4, 3, 2, 3]],
      [20, [4, 5, 4, 3, 4]],
    ]);
    const familles = [
      FAMILLES_NC01.F1,
      FAMILLES_NC01.F2,
      FAMILLES_NC01.F3,
      FAMILLES_NC01.F5,
      FAMILLES_NC01.F6,
    ];
    for (const [nombreQuestions, attendus] of quotas) {
      for (let graine = 0; graine < 100; graine += 1) {
        const compte = occurrences(planifierSerieNC01({
          graine: `quota-${nombreQuestions}-${graine}`,
          nombreQuestions,
        }));
        assert.deepEqual(familles.map((famille) => compte.get(famille) ?? 0), attendus);
      }
    }
  });

  it("couvre les sous-formes de production et les deux partages simples en vingt questions", () => {
    const plan = planifierSerieNC01({ graine: "vingt", nombreQuestions: 20 });
    const compte = occurrences(plan);
    assert.deepEqual(
      [...compte.values()].sort((a, b) => a - b),
      [3, 4, 4, 4, 5],
    );
    assert.deepEqual(
      plan.filter(({ famille }) => famille === FAMILLES_NC01.F5)
        .map(({ parametres }) => parametres.sousForme).sort(),
      ["plus-petit", "toutes-solutions", "unique"],
    );
    const sousFormesPartage = plan
      .filter(({ famille }) => famille === FAMILLES_NC01.F6)
      .map(({ parametres }) => parametres.sousForme);
    assert.equal(sousFormesPartage.filter((sousForme) => sousForme === "oui-non").length, 2);
    assert.equal(sousFormesPartage.filter((sousForme) => sousForme === "retrait-minimal").length, 2);
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
    for (let nombreQuestions = 1; nombreQuestions <= 100; nombreQuestions += 1) {
      for (let graine = 0; graine < 10; graine += 1) {
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
      const partages = plan.filter(({ famille }) => famille === FAMILLES_NC01.F6);
      assert.equal(partages.filter(({ parametres }) => parametres.sousForme === "oui-non").length, 1);
      assert.equal(partages.filter(({ parametres }) => parametres.sousForme === "retrait-minimal").length, 1);
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
  it("produit dix questions des cinq familles sans doublon visible", () => {
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

  it("laisse « Aucun » apparaître naturellement sans l'imposer à chaque série", () => {
    const registre = creerRegistreAutomatismes();
    let seriesAvecAucun = 0;
    let occurrencesAucun = 0;
    let questionsF2 = 0;
    for (let graine = 0; graine < 300; graine += 1) {
      const questions = genererSerieNC01({
        registre,
        graine: `aucun-naturel-${graine}`,
        nombreQuestions: 10,
      });
      const f2 = questions.filter((question) =>
        question.classement.famille === FAMILLES_NC01.F2);
      const nombreAucun = f2.filter((question) =>
        question.reponse.attendus.includes("aucun")).length;
      questionsF2 += f2.length;
      occurrencesAucun += nombreAucun;
      if (nombreAucun > 0) seriesAvecAucun += 1;
    }
    assert.ok(occurrencesAucun > 0 && occurrencesAucun < questionsF2);
    assert.ok(seriesAvecAucun > 0 && seriesAvecAucun < 300);
  });
});
