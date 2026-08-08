import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  validerQuestionInstanceV2,
} from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  DENOMINATEURS_AUTORISES,
  MICRO_NOTION_NC03,
  MICRO_NOTION_NC04,
  NOTION_FRACTIONS_SIMPLES_DECIMAUX,
  estFractionDuDomaine,
} from "./commun.js";
import {
  genererSerieFractionsDecimaux,
  planifierSerieFractionsDecimaux,
  repartirMicroNotionsFractionsDecimaux,
  signatureVisibleQuestion,
} from "./serie.js";

const LONGUEURS_JALONS = Object.freeze([5, 10, 15, 20]);

function compterMicroNotions(elements) {
  return elements.reduce((comptes, element) => {
    const microNotion = element.microNotion ?? element.classement.microNotion;
    comptes[microNotion] = (comptes[microNotion] ?? 0) + 1;
    return comptes;
  }, { [MICRO_NOTION_NC03]: 0, [MICRO_NOTION_NC04]: 0 });
}

describe("NC-03/NC-04 — plan de série commun", () => {
  it("équilibre tous les formats 1 à 20 et donne le bonus impair selon la graine", () => {
    const bonusVus = new Set();
    for (let nombreQuestions = 1; nombreQuestions <= 20; nombreQuestions += 1) {
      for (let graine = 0; graine < 100; graine += 1) {
        const repartition = repartirMicroNotionsFractionsDecimaux({
          graine: `repartition-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.equal(
          repartition[MICRO_NOTION_NC03] + repartition[MICRO_NOTION_NC04],
          nombreQuestions,
        );
        assert.ok(
          Math.abs(
            repartition[MICRO_NOTION_NC03] - repartition[MICRO_NOTION_NC04],
          ) <= 1,
        );
        if (nombreQuestions % 2 === 1) {
          bonusVus.add(
            repartition[MICRO_NOTION_NC03] > repartition[MICRO_NOTION_NC04]
              ? MICRO_NOTION_NC03
              : MICRO_NOTION_NC04,
          );
        }
      }
    }
    assert.deepEqual(
      [...bonusVus].sort(),
      [MICRO_NOTION_NC03, MICRO_NOTION_NC04].sort(),
    );
  });

  it("respecte les quotas des jalons 5, 10, 15 et 20", () => {
    for (const nombreQuestions of LONGUEURS_JALONS) {
      for (let graine = 0; graine < 200; graine += 1) {
        const plan = planifierSerieFractionsDecimaux({
          graine: `quota-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        const comptes = compterMicroNotions(plan);
        assert.equal(plan.length, nombreQuestions);
        if (nombreQuestions % 2 === 0) {
          assert.deepEqual(comptes, {
            [MICRO_NOTION_NC03]: nombreQuestions / 2,
            [MICRO_NOTION_NC04]: nombreQuestions / 2,
          });
        } else {
          assert.deepEqual(
            Object.values(comptes).sort((a, b) => a - b),
            [Math.floor(nombreQuestions / 2), Math.ceil(nombreQuestions / 2)],
          );
        }
      }
    }
  });

  it("n'enchaîne jamais trois questions dans le même sens", () => {
    for (let nombreQuestions = 1; nombreQuestions <= 20; nombreQuestions += 1) {
      for (let graine = 0; graine < 200; graine += 1) {
        const plan = planifierSerieFractionsDecimaux({
          graine: `ordre-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        plan.slice(2).forEach((element, index) => {
          assert.equal(
            element.microNotion === plan[index].microNotion
              && element.microNotion === plan[index + 1].microNotion,
            false,
          );
        });
      }
    }
  });

  it("réserve à vingt exactement une production libre", () => {
    for (let graine = 0; graine < 500; graine += 1) {
      const plan = planifierSerieFractionsDecimaux({
        graine: `libre-${graine}`,
        nombreQuestions: 20,
      });
      const libres = plan.filter(({ forme }) => forme === "fraction-libre");
      assert.equal(libres.length, 1);
      assert.equal(libres[0].microNotion, MICRO_NOTION_NC04);
    }
    for (let nombreQuestions = 1; nombreQuestions < 20; nombreQuestions += 1) {
      assert.equal(
        planifierSerieFractionsDecimaux({ graine: "sans-libre", nombreQuestions })
          .filter(({ forme }) => forme === "fraction-libre").length,
        0,
      );
    }
  });

  it("place au plus un millième et alterne son sens selon la graine", () => {
    const directions = new Set();
    for (let graine = 0; graine < 500; graine += 1) {
      const plan = planifierSerieFractionsDecimaux({
        graine: `millieme-${graine}`,
        nombreQuestions: 20,
      });
      const milliemes = plan.filter(({ denominateur }) => denominateur === 1000);
      assert.equal(milliemes.length, 1);
      directions.add(milliemes[0].microNotion);
    }
    assert.deepEqual(
      [...directions].sort(),
      [MICRO_NOTION_NC03, MICRO_NOTION_NC04].sort(),
    );
    for (let nombreQuestions = 1; nombreQuestions < 20; nombreQuestions += 1) {
      const plan = planifierSerieFractionsDecimaux({
        graine: "sans-millieme",
        nombreQuestions,
      });
      assert.equal(
        plan.filter(({ denominateur }) => denominateur === 1000).length,
        0,
      );
    }
  });

  it("reste strictement dans le domaine convenu, sans jamais produire 5/8", () => {
    for (let graine = 0; graine < 500; graine += 1) {
      const plan = planifierSerieFractionsDecimaux({
        graine: `domaine-${graine}`,
        nombreQuestions: 20,
      });
      for (const { numerateur, denominateur } of plan) {
        assert.ok(DENOMINATEURS_AUTORISES.includes(denominateur));
        assert.ok(estFractionDuDomaine(numerateur, denominateur));
        assert.notDeepEqual([numerateur, denominateur], [5, 8]);
      }
    }
  });

  it("rejoue exactement le plan et varie avec une autre graine", () => {
    assert.deepEqual(
      planifierSerieFractionsDecimaux({ graine: "meme", nombreQuestions: 20 }),
      planifierSerieFractionsDecimaux({ graine: "meme", nombreQuestions: 20 }),
    );
    assert.notDeepEqual(
      planifierSerieFractionsDecimaux({ graine: "meme", nombreQuestions: 20 }),
      planifierSerieFractionsDecimaux({ graine: "autre", nombreQuestions: 20 }),
    );
  });

  it("refuse les longueurs hors de la plage du lecteur", () => {
    for (const nombreQuestions of [0, 21, 100, 1.5]) {
      assert.throws(
        () => planifierSerieFractionsDecimaux({
          graine: "longueur-invalide",
          nombreQuestions,
        }),
        /entre 1 et 20/,
      );
    }
    for (const graine of [-1, 2 ** 32, 1.5, null]) {
      assert.throws(() => planifierSerieFractionsDecimaux({
        graine,
        nombreQuestions: 10,
      }));
    }
  });
});

describe("NC-03/NC-04 — génération de la série", () => {
  it("produit des questions conformes sous une seule notion visible", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS_JALONS) {
      for (let graine = 0; graine < 100; graine += 1) {
        const questions = genererSerieFractionsDecimaux({
          registre,
          graine: `serie-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.equal(questions.length, nombreQuestions);
        assert.equal(
          new Set(questions.map(signatureVisibleQuestion)).size,
          nombreQuestions,
        );
        for (const question of questions) {
          assert.equal(
            question.classement.notion,
            NOTION_FRACTIONS_SIMPLES_DECIMAUX,
          );
          assert.ok([
            MICRO_NOTION_NC03,
            MICRO_NOTION_NC04,
          ].includes(question.classement.microNotion));
          assert.deepEqual(
            validerQuestionInstanceV2(question),
            { valide: true, erreurs: [] },
          );
        }
      }
    }
  });

  it("produit exactement une réponse fraction libre dans la série de vingt", () => {
    const questions = genererSerieFractionsDecimaux({
      registre: creerRegistreAutomatismes(),
      graine: "serie-libre",
      nombreQuestions: 20,
    });
    const libres = questions.filter(
      ({ reponse }) => reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE,
    );
    assert.equal(libres.length, 1);
    assert.equal(libres[0].classement.microNotion, MICRO_NOTION_NC04);
  });

  it("rejoue les mêmes instances et varie avec une autre graine", () => {
    const registre = creerRegistreAutomatismes();
    const a = genererSerieFractionsDecimaux({
      registre,
      graine: "serie-a",
      nombreQuestions: 20,
    });
    const encoreA = genererSerieFractionsDecimaux({
      registre,
      graine: "serie-a",
      nombreQuestions: 20,
    });
    const b = genererSerieFractionsDecimaux({
      registre,
      graine: "serie-b",
      nombreQuestions: 20,
    });
    assert.deepEqual(a, encoreA);
    assert.notDeepEqual(a, b);
  });
});
