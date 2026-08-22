import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  FAMILLES_NC01,
  PAQUET_FAMILLES_NC01,
  genererSerieNC01,
  planifierSerieNC01,
  signatureVisibleQuestion,
} from "./serie.js";

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);

function occurrences(plan, cle = "famille") {
  const resultat = new Map();
  for (const element of plan) {
    const valeur = element[cle];
    resultat.set(valeur, (resultat.get(valeur) ?? 0) + 1);
  }
  return resultat;
}

describe("NC-01 — paquet pédagogique déterministe", () => {
  it("garantit exactement les quotas de référence à vingt", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const compte = occurrences(planifierSerieNC01({
        graine: `quota-${seed}`,
        nombreQuestions: 20,
      }));
      for (const profil of PAQUET_FAMILLES_NC01.profils) {
        assert.equal(compte.get(profil.id), profil.quota, profil.id);
      }
    }
  });

  it("observe toutes les familles dès une question et respecte leurs poids sur 5 000 seeds", () => {
    const compte = new Map(PAQUET_FAMILLES_NC01.profils.map(({ id }) => [id, 0]));
    let rareDansDeux = 0;
    for (let seed = 0; seed < 5_000; seed += 1) {
      const une = planifierSerieNC01({ graine: `petite-${seed}`, nombreQuestions: 1 });
      compte.set(une[0].famille, compte.get(une[0].famille) + 1);
      const deux = planifierSerieNC01({ graine: `petite-${seed}`, nombreQuestions: 2 });
      if (deux.some(({ famille }) => famille === FAMILLES_NC01.F5)) rareDansDeux += 1;
    }
    for (const { id, quota } of PAQUET_FAMILLES_NC01.profils) {
      const proportion = compte.get(id) / 5_000;
      assert.ok(Math.abs(proportion - quota / 20) < 0.025, `${id}: ${proportion}`);
      assert.ok(compte.get(id) > 0, `${id} absent`);
    }
    assert.ok(rareDansDeux > 0);
    assert.ok(compte.get(FAMILLES_NC01.F2) > compte.get(FAMILLES_NC01.F5));
  });

  it("reste déterministe et évite les répétitions lorsqu'une alternance existe", () => {
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 1_000; seed += 1) {
        const configuration = { graine: `ordre-${seed}`, nombreQuestions };
        const plan = planifierSerieNC01(configuration);
        assert.deepEqual(planifierSerieNC01(configuration), plan);
        assert.equal(plan.length, nombreQuestions);
        const compte = occurrences(plan);
        const alternancePossible = Math.max(...compte.values()) <= Math.ceil(nombreQuestions / 2);
        if (alternancePossible) {
          assert.ok(plan.every((element, index) =>
            index === 0 || element.famille !== plan[index - 1].famille));
        }
        for (const { famille, parametres } of plan) {
          if (famille !== FAMILLES_NC01.F5) continue;
          if (parametres.sousForme === "unique") assert.ok([9, 10].includes(parametres.critere));
          if (parametres.sousForme === "plus-petit") assert.equal(parametres.critere, 3);
        }
      }
    }
  });

  it("conserve à vingt les sous-formes pédagogiques validées", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const plan = planifierSerieNC01({ graine: `formes-${seed}`, nombreQuestions: 20 });
      assert.deepEqual(
        plan.filter(({ famille }) => famille === FAMILLES_NC01.F5)
          .map(({ parametres }) => parametres.sousForme).sort(),
        ["plus-petit", "toutes-solutions", "unique"],
      );
      const partages = plan.filter(({ famille }) => famille === FAMILLES_NC01.F6)
        .map(({ parametres }) => parametres.sousForme);
      assert.equal(partages.filter((forme) => forme === "oui-non").length, 2);
      assert.equal(partages.filter((forme) => forme === "retrait-minimal").length, 2);
    }
  });
});

describe("NC-01 — génération", () => {
  it("produit des questions V2 sans doublon visible à toutes les allocations", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 100; seed += 1) {
        const questions = genererSerieNC01({
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

  it("laisse « Aucun » apparaître naturellement sans l'imposer", () => {
    const registre = creerRegistreAutomatismes();
    let occurrencesAucun = 0;
    let questionsF2 = 0;
    for (let seed = 0; seed < 300; seed += 1) {
      const questions = genererSerieNC01({
        registre,
        graine: `aucun-${seed}`,
        nombreQuestions: 10,
      });
      const f2 = questions.filter(({ classement }) =>
        classement.famille === FAMILLES_NC01.F2);
      questionsF2 += f2.length;
      occurrencesAucun += f2.filter(({ reponse }) =>
        reponse.attendus.includes("aucun")).length;
    }
    assert.ok(occurrencesAucun > 0 && occurrencesAucun < questionsF2);
  });
});
