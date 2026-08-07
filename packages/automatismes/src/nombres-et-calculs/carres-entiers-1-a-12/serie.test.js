import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { creerRegistreAutomatismes } from "../../registre.js";
import {
  FAMILLES_NC02,
  QUOTAS_SERIES_NC02,
  genererSerieNC02,
  planifierSerieNC02,
  signatureVisibleQuestion,
} from "./serie.js";

const LONGUEURS = Object.freeze([5, 10, 15, 20]);
const FAMILLES = Object.freeze(Object.values(FAMILLES_NC02));

function occurrences(plan) {
  const resultat = new Map();
  for (const { famille } of plan) {
    resultat.set(famille, (resultat.get(famille) ?? 0) + 1);
  }
  return resultat;
}

function bandeDe(base) {
  if (base <= 4) return 0;
  if (base <= 8) return 1;
  return 2;
}

function basesRappel(plan) {
  return plan
    .filter(({ famille }) => [FAMILLES_NC02.F1, FAMILLES_NC02.F2].includes(famille))
    .map(({ parametres }) => parametres.base);
}

describe("NC-02 — plan de série", () => {
  it("respecte exactement les quatre tables de quotas validées", () => {
    for (const nombreQuestions of LONGUEURS) {
      for (let graine = 0; graine < 250; graine += 1) {
        const compte = occurrences(planifierSerieNC02({
          graine: `quota-${nombreQuestions}-${graine}`,
          nombreQuestions,
        }));
        assert.deepEqual(
          FAMILLES.map((famille) => compte.get(famille) ?? 0),
          QUOTAS_SERIES_NC02[nombreQuestions],
        );
      }
    }
  });

  it("commence par le rappel et n'enchaîne jamais deux familles identiques", () => {
    for (const nombreQuestions of LONGUEURS) {
      for (let graine = 0; graine < 1_000; graine += 1) {
        const plan = planifierSerieNC02({
          graine: `ordre-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.ok([FAMILLES_NC02.F1, FAMILLES_NC02.F2].includes(plan[0].famille));
        plan.slice(1).forEach((element, index) => {
          assert.notEqual(element.famille, plan[index].famille);
        });
      }
    }
  });

  it("couvre les treize bases sans répétition par F1 et F2 dans toute série de vingt", () => {
    for (let graine = 0; graine < 1_000; graine += 1) {
      const plan = planifierSerieNC02({
        graine: `couverture-${graine}`,
        nombreQuestions: 20,
      });
      const bases = basesRappel(plan);
      assert.equal(bases.length, 13);
      assert.equal(new Set(bases).size, 13);
      assert.deepEqual([...bases].sort((a, b) => a - b), [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
    }
  });

  it("équilibre les trois bandes de bases dans toutes les longueurs", () => {
    for (const nombreQuestions of LONGUEURS) {
      for (let graine = 0; graine < 500; graine += 1) {
        const comptes = [0, 0, 0];
        basesRappel(planifierSerieNC02({
          graine: `bandes-${nombreQuestions}-${graine}`,
          nombreQuestions,
        })).forEach((base) => { comptes[bandeDe(base)] += 1; });
        assert.ok(Math.max(...comptes) - Math.min(...comptes) <= 1);
      }
    }
  });

  it("garantit le produit à deux facteurs dès dix questions", () => {
    for (const nombreQuestions of [10, 15, 20]) {
      for (let graine = 0; graine < 1_000; graine += 1) {
        const formes = planifierSerieNC02({
          graine: `produit-${nombreQuestions}-${graine}`,
          nombreQuestions,
        })
          .filter(({ famille }) => famille === FAMILLES_NC02.F2)
          .map(({ parametres }) => parametres.forme);
        assert.ok(formes.includes("produit-facteurs-egaux"));
      }
    }
  });

  it("équilibre les deux sens de F5 et les deux opérations de F6 quand elles apparaissent deux fois", () => {
    for (const nombreQuestions of [15, 20]) {
      for (let graine = 0; graine < 500; graine += 1) {
        const plan = planifierSerieNC02({
          graine: `sous-formes-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        const operations = plan
          .filter(({ famille }) => famille === FAMILLES_NC02.F6)
          .map(({ parametres }) => parametres.operation)
          .sort();
        assert.deepEqual(operations, ["addition", "soustraction"]);
        if (nombreQuestions === 20) {
          const formesCarre = plan
            .filter(({ famille }) => famille === FAMILLES_NC02.F5)
            .map(({ parametres }) => parametres.forme)
            .sort();
          assert.deepEqual(formesCarre, ["trouver-aire", "trouver-cote"]);
          const basesCarre = plan
            .filter(({ famille }) => famille === FAMILLES_NC02.F5)
            .map(({ parametres }) => parametres.base);
          assert.equal(new Set(basesCarre).size, 2);
        }
      }
    }
  });

  it("réserve exactement un QCM direct et un encadrement dans la série de vingt", () => {
    for (let graine = 0; graine < 1_000; graine += 1) {
      const formulations = planifierSerieNC02({
        graine: `variantes-directes-${graine}`,
        nombreQuestions: 20,
      })
        .filter(({ famille }) => famille === FAMILLES_NC02.F1)
        .map(({ parametres }) => parametres.formulation);
      assert.equal(formulations.filter((forme) => forme === "choisir-resultat").length, 1);
      assert.equal(formulations.filter((forme) => forme === "encadrer-resultat").length, 1);
    }
  });

  it("emploie uniquement la formulation « carrés parfaits » dans la série de vingt", () => {
    for (let graine = 0; graine < 500; graine += 1) {
      const formulations = planifierSerieNC02({
        graine: `vocabulaire-carres-${graine}`,
        nombreQuestions: 20,
      })
        .filter(({ famille }) => famille === FAMILLES_NC02.F4)
        .map(({ parametres }) => parametres.formulation)
        .sort();
      assert.deepEqual(formulations, ["carres-parfaits", "carres-parfaits"]);
    }
  });

  it("rejoue exactement le plan et varie avec une autre graine", () => {
    assert.deepEqual(
      planifierSerieNC02({ graine: "meme", nombreQuestions: 20 }),
      planifierSerieNC02({ graine: "meme", nombreQuestions: 20 }),
    );
    assert.notDeepEqual(
      planifierSerieNC02({ graine: "meme", nombreQuestions: 20 }),
      planifierSerieNC02({ graine: "autre", nombreQuestions: 20 }),
    );
  });

  it("fournit un préfixe pédagogique pour chaque longueur intermédiaire d'un mélange", () => {
    for (let nombreQuestions = 1; nombreQuestions <= 20; nombreQuestions += 1) {
      for (let graine = 0; graine < 100; graine += 1) {
        const plan = planifierSerieNC02({
          graine: `intermediaire-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.equal(plan.length, nombreQuestions);
        assert.ok([FAMILLES_NC02.F1, FAMILLES_NC02.F2].includes(plan[0].famille));
        plan.slice(1).forEach((element, index) => {
          assert.notEqual(element.famille, plan[index].famille);
        });
        if (nombreQuestions >= 2) {
          assert.ok(plan.some(({ famille }) => famille === FAMILLES_NC02.F1));
          assert.ok(plan.some(({ famille }) => famille === FAMILLES_NC02.F2));
        }
      }
    }
  });

  it("refuse les longueurs hors de la plage utile au lecteur", () => {
    for (const nombreQuestions of [0, 21, 100, 1.5]) {
      assert.throws(
        () => planifierSerieNC02({ graine: "invalide", nombreQuestions }),
        /entre 1 et 20/,
      );
    }
  });
});

describe("NC-02 — génération de séries complètes", () => {
  it("génère des questions conformes sans aucun doublon visible", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS) {
      for (let graine = 0; graine < 300; graine += 1) {
        const questions = genererSerieNC02({
          registre,
          graine: `serie-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.equal(questions.length, nombreQuestions);
        assert.equal(
          new Set(questions.map(signatureVisibleQuestion)).size,
          nombreQuestions,
        );
      }
    }
  });

  it("génère aussi les sous-séries de deux et trois questions requises par le mélange", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of [2, 3]) {
      for (let graine = 0; graine < 200; graine += 1) {
        const questions = genererSerieNC02({
          registre,
          graine: `sous-serie-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.equal(questions.length, nombreQuestions);
        assert.equal(new Set(questions.map(signatureVisibleQuestion)).size, nombreQuestions);
        assert.deepEqual(
          [...new Set(questions.map(({ classement }) => classement.famille))].sort(),
          nombreQuestions === 2
            ? [FAMILLES_NC02.F1, FAMILLES_NC02.F2].sort()
            : [FAMILLES_NC02.F1, FAMILLES_NC02.F2, FAMILLES_NC02.F3].sort(),
        );
      }
    }
  });

  it("rejoue les mêmes instances et varie avec une autre graine", () => {
    const registre = creerRegistreAutomatismes();
    const a = genererSerieNC02({ registre, graine: "serie-a", nombreQuestions: 20 });
    const encoreA = genererSerieNC02({ registre, graine: "serie-a", nombreQuestions: 20 });
    const b = genererSerieNC02({ registre, graine: "serie-b", nombreQuestions: 20 });
    assert.deepEqual(a, encoreA);
    assert.notDeepEqual(a, b);
  });

  it("expose bien les six familles dans une série de vingt", () => {
    const questions = genererSerieNC02({
      registre: creerRegistreAutomatismes(),
      graine: "six-familles",
      nombreQuestions: 20,
    });
    assert.deepEqual(
      [...new Set(questions.map(({ classement }) => classement.famille))].sort(),
      [...FAMILLES].sort(),
    );
  });
});
