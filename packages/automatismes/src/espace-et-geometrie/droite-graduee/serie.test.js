import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { creerRegistreAutomatismes } from "../../registre.js";
import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import {
  FAMILLE_DETERMINER_PAS,
  FAMILLE_DIAGNOSTIC,
  FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT,
} from "./questions.js";
import { genererSerieDroiteGraduee } from "./serie.js";

describe("série GE-01 + GE-02 — droite graduée", () => {
  it("respecte les quotas aux quatre jalons", () => {
    const attendus = {
      5: [2, 2, 1, 0],
      10: [4, 4, 1, 1],
      15: [6, 6, 2, 1],
      20: [8, 8, 2, 2],
    };
    const familles = [FAMILLE_LIRE_ABSCISSE, FAMILLE_PLACER_POINT, FAMILLE_DETERMINER_PAS, FAMILLE_DIAGNOSTIC];
    for (const nombreQuestions of [5, 10, 15, 20]) {
      const questions = genererSerieDroiteGraduee({ registre: creerRegistreAutomatismes(), graine: "quotas-ge", nombreQuestions });
      assert.deepEqual(familles.map((famille) => questions.filter((q) => q.classement.famille === famille).length), attendus[nombreQuestions]);
      assert.ok(questions.every((question) => validerQuestionInstanceV2(question).valide));
    }
  });

  it("rejoue la même série et couvre les pas prévus", () => {
    const registre = creerRegistreAutomatismes();
    const a = genererSerieDroiteGraduee({ registre, graine: "rejouer-ge", nombreQuestions: 20 });
    const b = genererSerieDroiteGraduee({ registre, graine: "rejouer-ge", nombreQuestions: 20 });
    assert.deepEqual(a, b);
    const pas = new Set(a.map((q) => {
      const droite = q.enonce.find((bloc) => bloc.type === "droite-graduee");
      return droite.pas.numerateur / droite.pas.denominateur;
    }));
    for (const valeur of [0.1, 0.25, 0.5, 1, 10, 50]) assert.ok(pas.has(valeur));
    assert.ok(a.some((q) => q.enonce.find((bloc) => bloc.type === "droite-graduee").depart.numerateur < 0));
  });
});
