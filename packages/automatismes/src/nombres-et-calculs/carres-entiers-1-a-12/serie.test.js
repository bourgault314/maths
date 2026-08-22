import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  FAMILLES_NC02,
  PAQUET_FAMILLES_NC02,
  QUOTAS_SERIES_NC02,
  genererSerieNC02,
  planifierSerieNC02,
  signatureVisibleQuestion,
} from "./serie.js";

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);
const FAMILLES = Object.freeze(Object.values(FAMILLES_NC02));

function occurrences(plan) {
  const compte = new Map(FAMILLES.map((famille) => [famille, 0]));
  for (const { famille } of plan) compte.set(famille, compte.get(famille) + 1);
  return compte;
}

describe("NC-02 — paquet pédagogique déterministe", () => {
  it("respecte exactement les quotas de familles et de sous-profils à vingt", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const plan = planifierSerieNC02({ graine: `quota-${seed}`, nombreQuestions: 20 });
      const compte = occurrences(plan);
      assert.deepEqual(
        FAMILLES.map((famille) => compte.get(famille)),
        QUOTAS_SERIES_NC02[20],
      );
      const directs = plan.filter(({ famille }) => famille === FAMILLES_NC02.F1)
        .map(({ parametres }) => parametres.formulation);
      assert.equal(directs.filter((forme) => forme === "calculer").length, 3);
      assert.equal(directs.filter((forme) => forme === "carre-de").length, 2);
      assert.equal(directs.filter((forme) => forme === "completer").length, 1);
      assert.equal(directs.filter((forme) => forme === "choisir-resultat").length, 1);
      assert.equal(directs.filter((forme) => forme === "encadrer-resultat").length, 1);
      assert.deepEqual(
        plan.filter(({ famille }) => famille === FAMILLES_NC02.F5)
          .map(({ parametres }) => parametres.forme).sort(),
        ["trouver-aire", "trouver-cote"],
      );
      assert.deepEqual(
        plan.filter(({ famille }) => famille === FAMILLES_NC02.F6)
          .map(({ parametres }) => parametres.operation).sort(),
        ["addition", "soustraction"],
      );
    }
  });

  it("rend les profils rares observables dans les allocations de 1 et 2 questions", () => {
    const famillesVues = new Set();
    const formulationsVues = new Set();
    const formesInversesVues = new Set();
    const compte = new Map(FAMILLES.map((famille) => [famille, 0]));
    for (let seed = 0; seed < 8_000; seed += 1) {
      const une = planifierSerieNC02({ graine: `petite-${seed}`, nombreQuestions: 1 });
      famillesVues.add(une[0].famille);
      compte.set(une[0].famille, compte.get(une[0].famille) + 1);
      if (une[0].parametres.formulation) formulationsVues.add(une[0].parametres.formulation);
      if (une[0].parametres.forme) formesInversesVues.add(une[0].parametres.forme);
      const deux = planifierSerieNC02({ graine: `petite-${seed}`, nombreQuestions: 2 });
      deux.forEach(({ parametres }) => {
        if (parametres.formulation) formulationsVues.add(parametres.formulation);
        if (parametres.forme) formesInversesVues.add(parametres.forme);
      });
    }
    assert.deepEqual([...famillesVues].sort(), [...FAMILLES].sort());
    assert.ok(formulationsVues.has("choisir-resultat"));
    assert.ok(formulationsVues.has("encadrer-resultat"));
    assert.ok(formesInversesVues.has("produit-facteurs-egaux"));
    FAMILLES.forEach((famille, index) => {
      const observee = compte.get(famille) / 8_000;
      assert.ok(Math.abs(observee - QUOTAS_SERIES_NC02[20][index] / 20) < 0.02);
    });
  });

  it("est déterministe et évite les familles consécutives si cela est possible", () => {
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 1_000; seed += 1) {
        const configuration = { graine: `ordre-${seed}`, nombreQuestions };
        const plan = planifierSerieNC02(configuration);
        assert.deepEqual(planifierSerieNC02(configuration), plan);
        const compte = occurrences(plan);
        const alternancePossible = Math.max(...compte.values()) <= Math.ceil(nombreQuestions / 2);
        if (alternancePossible) {
          assert.ok(plan.every((element, index) =>
            index === 0 || element.famille !== plan[index - 1].famille));
        }
      }
    }
  });

  it("couvre les treize bases de rappel sans répétition à vingt", () => {
    for (let seed = 0; seed < 1_000; seed += 1) {
      const bases = planifierSerieNC02({ graine: `bases-${seed}`, nombreQuestions: 20 })
        .filter(({ famille }) => [FAMILLES_NC02.F1, FAMILLES_NC02.F2].includes(famille))
        .map(({ parametres }) => parametres.base);
      assert.deepEqual([...bases].sort((a, b) => a - b), [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
    }
  });

  it("déclare bien vingt jetons sans dépendre d'une table de préfixes", () => {
    assert.equal(PAQUET_FAMILLES_NC02.profils.reduce((somme, profil) =>
      somme + profil.quota, 0), 20);
  });
});

describe("NC-02 — génération", () => {
  it("produit des questions V2 sans doublon visible à toutes les allocations", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 100; seed += 1) {
        const questions = genererSerieNC02({
          registre,
          graine: `questions-${nombreQuestions}-${seed}`,
          nombreQuestions,
        });
        assert.equal(questions.length, nombreQuestions);
        assert.equal(new Set(questions.map(signatureVisibleQuestion)).size, nombreQuestions);
        assert.ok(questions.every((question) => validerQuestionInstanceV2(question).valide));
      }
    }
  });
});
