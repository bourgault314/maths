import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  PAQUET_PROFILS_SOLIDES_USUELS,
  PAQUET_VUES_SOLIDES_USUELS,
  genererSerieSolidesUsuels,
  planifierSerieSolidesUsuels,
  signatureVisibleQuestionSolides,
} from "./serie.js";

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);

function compter(plan, predicat) {
  return plan.filter(predicat).length;
}

describe("GE-12 — paquet pédagogique déterministe", () => {
  it("garantit à vingt les formes, variantes et vues de référence", () => {
    const formesAttendues = { cube: 4, pave: 4, prisme: 3, cylindre: 3, pyramide: 3, cone: 3 };
    for (let seed = 0; seed < 500; seed += 1) {
      const plan = planifierSerieSolidesUsuels({
        graine: `quotas-solides-${seed}`,
        nombreQuestions: 20,
      });
      assert.deepEqual(
        Object.fromEntries(Object.keys(formesAttendues).map((forme) => [
          forme,
          compter(plan, (element) => element.forme === forme),
        ])),
        formesAttendues,
      );
      assert.equal(compter(plan, ({ forme, variante }) =>
        forme === "pyramide" && variante === "triangulaire"), 1);
      assert.equal(compter(plan, ({ forme, variante }) =>
        forme === "cone" && variante === "large"), 1);
      for (let vueIndex = 0; vueIndex < 4; vueIndex += 1) {
        assert.equal(compter(plan, (element) => element.vueIndex === vueIndex), 5);
      }
      assert.equal(new Set(plan.map(({ forme, variante, vueIndex }) =>
        `${forme}:${variante}:${vueIndex}`)).size, 20);
      assert.ok(plan.every((element, index) =>
        index === 0 || element.forme !== plan[index - 1].forme));
    }
  });

  it("rend les variantes rares observables dans les petites allocations", () => {
    const formes = new Set();
    const variantesRares = new Set();
    let coeur = 0;
    for (let seed = 0; seed < 8_000; seed += 1) {
      const plan = planifierSerieSolidesUsuels({
        graine: `petite-solides-${seed}`,
        nombreQuestions: seed % 2 + 1,
      });
      for (const { forme, variante } of plan) {
        formes.add(forme);
        coeur += Number(forme === "cube" || forme === "pave");
        if (variante === "triangulaire" || variante === "large") {
          variantesRares.add(`${forme}:${variante}`);
        }
      }
    }
    assert.deepEqual(formes, new Set(["cube", "pave", "prisme", "cylindre", "pyramide", "cone"]));
    assert.deepEqual(variantesRares, new Set(["pyramide:triangulaire", "cone:large"]));
    assert.ok(coeur > 4_000);
  });

  it("reste déterministe à toutes les allocations et déclare deux paquets complets", () => {
    assert.equal(PAQUET_PROFILS_SOLIDES_USUELS.tailleReference, 20);
    assert.equal(PAQUET_VUES_SOLIDES_USUELS.tailleReference, 20);
    for (let seed = 0; seed < 3_000; seed += 1) {
      const configuration = {
        graine: `audit-solides-${seed}`,
        nombreQuestions: LONGUEURS[seed % LONGUEURS.length],
      };
      const plan = planifierSerieSolidesUsuels(configuration);
      assert.deepEqual(planifierSerieSolidesUsuels(configuration), plan);
      assert.equal(new Set(plan.map(({ forme, variante, vueIndex }) =>
        `${forme}:${variante}:${vueIndex}`)).size, plan.length);
    }
  });
});

describe("GE-12 — génération", () => {
  it("produit des questions V2 sans doublon visible", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 100; seed += 1) {
        const questions = genererSerieSolidesUsuels({
          registre,
          graine: `questions-solides-${nombreQuestions}-${seed}`,
          nombreQuestions,
        });
        assert.equal(questions.length, nombreQuestions);
        assert.equal(new Set(questions.map(signatureVisibleQuestionSolides)).size, nombreQuestions);
        assert.ok(questions.every((question) => validerQuestionInstanceV2(question).valide));
      }
    }
  });
});
