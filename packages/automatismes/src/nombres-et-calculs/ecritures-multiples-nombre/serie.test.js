import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TYPE_REPONSE_SELECTION_MULTIPLE,
  validerQuestionInstanceV2,
} from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  FAMILLES_ECRITURES_MULTIPLES,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  lirePourcentageQuestion,
} from "./questions.js";
import {
  QUOTAS_JALONS_ECRITURES_MULTIPLES,
  genererSerieEcrituresMultiples,
  planifierSerieEcrituresMultiples,
  repartirFamillesEcrituresMultiples,
} from "./serie.js";

const LONGUEURS = Object.freeze([5, 10, 15, 20]);

function quotasDansOrdre(repartition) {
  return FAMILLES_ECRITURES_MULTIPLES.map((famille) => repartition[famille]);
}

describe("NC-05 — série d'écritures multiples", () => {
  it("respecte les quotas pédagogiques aux quatre jalons", () => {
    for (const nombreQuestions of LONGUEURS) {
      assert.deepEqual(
        quotasDansOrdre(repartirFamillesEcrituresMultiples(nombreQuestions)),
        QUOTAS_JALONS_ECRITURES_MULTIPLES[nombreQuestions],
      );
    }
  });

  it("reste déterministe, sans valeur rationnelle répétée ni famille consécutive", () => {
    for (const nombreQuestions of LONGUEURS) {
      for (let indexGraine = 0; indexGraine < 100; indexGraine += 1) {
        const graine = `nc05-${nombreQuestions}-${indexGraine}`;
        const plan = planifierSerieEcrituresMultiples({ graine, nombreQuestions });
        assert.deepEqual(
          plan,
          planifierSerieEcrituresMultiples({ graine, nombreQuestions }),
        );
        assert.equal(new Set(plan.map(({ pourcentage }) => pourcentage)).size, plan.length);
        for (let index = 1; index < plan.length; index += 1) {
          assert.notEqual(plan[index - 1].famille, plan[index].famille);
        }
        if (nombreQuestions >= 10) {
          assert.equal(plan.some(({ pourcentage }) => pourcentage === 100), true);
          assert.equal(plan.some(({ pourcentage }) => pourcentage > 100), true);
        }
        const selectionsMultiples = plan.filter(
          ({ famille, variante }) =>
            famille === FAMILLE_RECONNAITRE_EQUIVALENCES
            && variante === "selection-multiple",
        );
        assert.equal(selectionsMultiples.length, nombreQuestions === 20 ? 1 : 0);
      }
    }
  });

  it("produit des questions V2 valides et une seule sélection multiple à 20", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS) {
      const questions = genererSerieEcrituresMultiples({
        registre,
        graine: `questions-${nombreQuestions}`,
        nombreQuestions,
      });
      assert.equal(questions.length, nombreQuestions);
      assert.equal(
        new Set(questions.map(lirePourcentageQuestion)).size,
        nombreQuestions,
      );
      for (const question of questions) {
        assert.deepEqual(validerQuestionInstanceV2(question), {
          valide: true,
          erreurs: [],
        });
        assert.ok(question.aide.blocs.length >= 3);
        assert.ok(question.correction.length >= 3);
      }
      assert.equal(
        questions.filter(
          ({ reponse }) => reponse.type === TYPE_REPONSE_SELECTION_MULTIPLE,
        ).length,
        nombreQuestions === 20 ? 1 : 0,
      );
    }
  });

  it("refuse les longueurs hors contrat", () => {
    for (const nombreQuestions of [0, 21, 2.5]) {
      assert.throws(
        () => planifierSerieEcrituresMultiples({
          graine: "longueur-invalide",
          nombreQuestions,
        }),
        /longueur attendue/,
      );
    }
  });
});
