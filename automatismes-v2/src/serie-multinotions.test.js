import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  genererSerieMultinotions,
  ordonnerNotionsDansSerie,
  repartirQuestionsEntreNotions,
} from "./serie-multinotions.js";

function notions(nombre) {
  return Array.from({ length: nombre }, (_, index) => `notion-${index + 1}`);
}

describe("répartition multi-notions", () => {
  it("répartit chaque longueur de menu équitablement entre toutes les notions compatibles", () => {
    for (const total of [5, 10, 15, 20]) {
      for (let nombreNotions = 1; nombreNotions <= total; nombreNotions += 1) {
        const ids = notions(nombreNotions);
        const repartition = repartirQuestionsEntreNotions({
          notions: ids,
          nombreQuestions: total,
          graine: `repartition-${total}-${nombreNotions}`,
        });
        const quotas = repartition.map(({ nombreQuestions }) => nombreQuestions);
        assert.equal(quotas.reduce((somme, quota) => somme + quota, 0), total);
        assert.ok(quotas.every((quota) => quota >= 1));
        assert.ok(Math.max(...quotas) - Math.min(...quotas) <= 1);
      }
    }
  });

  it("produit les répartitions attendues pour les exemples de référence", () => {
    const quotaTrie = (nombreNotions, total) => repartirQuestionsEntreNotions({
      notions: notions(nombreNotions),
      nombreQuestions: total,
      graine: "exemples-reference",
    }).map(({ nombreQuestions }) => nombreQuestions).sort((a, b) => b - a);
    assert.deepEqual(quotaTrie(2, 5), [3, 2]);
    assert.deepEqual(quotaTrie(2, 10), [5, 5]);
    assert.deepEqual(quotaTrie(2, 15), [8, 7]);
    assert.deepEqual(quotaTrie(2, 20), [10, 10]);
    assert.deepEqual(quotaTrie(3, 20), [7, 7, 6]);
    assert.deepEqual(quotaTrie(4, 20), [5, 5, 5, 5]);
    assert.deepEqual(quotaTrie(6, 20), [4, 4, 3, 3, 3, 3]);
  });

  it("est déterministe et ne réserve pas toujours le bonus à la première notion", () => {
    const ids = notions(3);
    const premiere = repartirQuestionsEntreNotions({
      notions: ids,
      nombreQuestions: 20,
      graine: "stable",
    });
    assert.deepEqual(
      repartirQuestionsEntreNotions({ notions: ids, nombreQuestions: 20, graine: "stable" }),
      premiere,
    );
    const beneficiaires = new Set();
    for (let index = 0; index < 60; index += 1) {
      const repartition = repartirQuestionsEntreNotions({
        notions: ids,
        nombreQuestions: 20,
        graine: `bonus-${index}`,
      });
      repartition
        .filter(({ nombreQuestions }) => nombreQuestions === 7)
        .forEach(({ notion }) => beneficiaires.add(notion));
    }
    assert.deepEqual([...beneficiaires].sort(), [...ids].sort());
  });

  it("ordonne le mélange sans deux notions identiques voisines", () => {
    const repartition = [
      { notion: "a", nombreQuestions: 7 },
      { notion: "b", nombreQuestions: 7 },
      { notion: "c", nombreQuestions: 6 },
    ];
    const ordre = ordonnerNotionsDansSerie({ repartition, graine: "ordre-stable" });
    assert.deepEqual(
      ordonnerNotionsDansSerie({ repartition, graine: "ordre-stable" }),
      ordre,
    );
    assert.equal(ordre.length, 20);
    assert.ok(ordre.every((notion, index) => index === 0 || notion !== ordre[index - 1]));
    const ordres = new Set(
      Array.from({ length: 20 }, (_, index) =>
        ordonnerNotionsDansSerie({ repartition, graine: `ordre-${index}` }).join("|")),
    );
    assert.ok(ordres.size > 1);
  });

  it("ordonne aussi le cas ciblé à une seule notion", () => {
    assert.deepEqual(
      ordonnerNotionsDansSerie({
        repartition: [{ notion: "a", nombreQuestions: 5 }],
        graine: "ordre-cible",
      }),
      ["a", "a", "a", "a", "a"],
    );
  });

  it("refuse les sélections impossibles ou ambiguës", () => {
    assert.throws(
      () => repartirQuestionsEntreNotions({ notions: ["a", "b"], nombreQuestions: 1, graine: "x" }),
      /chaque notion/,
    );
    assert.throws(
      () => repartirQuestionsEntreNotions({ notions: ["a", "a"], nombreQuestions: 2, graine: "x" }),
      /doublons/,
    );
  });
});

describe("génération multi-notions", () => {
  it("préserve l'ordre de chaque sous-série et intercale les files", () => {
    const definitions = ["a", "b", "c"].map((id) => ({
      id,
      gabarit: { id },
      creerSerie: ({ nombreQuestions }) => Array.from(
        { length: nombreQuestions },
        (_, index) => ({ id: `${id}-${index + 1}`, classement: { notion: id } }),
      ),
    }));
    const registre = { instancier() { throw new Error("inutilisé"); } };
    const questions = genererSerieMultinotions({
      definitions,
      registre,
      graine: "files",
      nombreQuestions: 20,
    });
    assert.equal(questions.length, 20);
    assert.equal(new Set(questions.map(({ id }) => id)).size, 20);
    for (const id of ["a", "b", "c"]) {
      const positionsLocales = questions
        .filter(({ classement }) => classement.notion === id)
        .map(({ id: questionId }) => Number(questionId.split("-").at(-1)));
      assert.deepEqual(
        positionsLocales,
        Array.from({ length: positionsLocales.length }, (_, index) => index + 1),
      );
    }
  });

  it("conserve exactement la graine historique d'une série ciblée", () => {
    let graineRecue;
    const definition = {
      id: "a",
      gabarit: { id: "a" },
      creerSerie: ({ graine }) => {
        graineRecue = graine;
        return [{ id: "a-1", classement: { notion: "a" } }];
      },
    };
    genererSerieMultinotions({
      definitions: [definition],
      registre: { instancier() {} },
      graine: "graine-publique",
      nombreQuestions: 1,
    });
    assert.equal(graineRecue, "graine-publique");
  });

  it("refuse avant la fabrique un quota supérieur à la capacité déclarée", () => {
    const definition = {
      id: "a",
      gabarit: { id: "a" },
      nombreQuestionsMaximum: 20,
      creerSerie() { throw new Error("la fabrique ne doit pas être appelée"); },
    };
    assert.throws(
      () => genererSerieMultinotions({
        definitions: [definition],
        registre: { instancier() {} },
        graine: "trop-longue",
        nombreQuestions: 21,
      }),
      /accepte au plus 20 questions/,
    );
  });
});
