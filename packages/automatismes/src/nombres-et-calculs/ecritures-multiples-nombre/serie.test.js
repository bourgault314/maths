import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TYPE_REPONSE_SELECTION_MULTIPLE,
  validerQuestionInstanceV2,
} from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  FAMILLES_ECRITURES_MULTIPLES,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  FAMILLE_UNITE_DEPASSEMENT,
  PRESENTATION_VISUELLE_ECRITURES,
  lirePourcentageQuestion,
} from "./questions.js";
import {
  QUOTAS_JALONS_ECRITURES_MULTIPLES,
  genererSerieEcrituresMultiples,
  planifierSerieEcrituresMultiples,
  repartirFamillesEcrituresMultiples,
} from "./serie.js";

const LONGUEURS = Object.freeze([5, 10, 15, 20]);
const ORDRE_PROGRESSIF_20 = Object.freeze([
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
  FAMILLE_POURCENTAGE_FRACTION_CENTIEMES,
  FAMILLE_POURCENTAGE_DECIMAL,
  FAMILLE_CHAINE_EGALITES,
  FAMILLE_UNITE_DEPASSEMENT,
  FAMILLE_FRACTION_REPERE_POURCENTAGE,
]);

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
        assert.deepEqual(
          plan.map(({ famille }) => famille),
          ORDRE_PROGRESSIF_20.slice(0, nombreQuestions),
        );
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

  it("garantit les repères, les petits pourcentages et l'effacement des visuels", () => {
    const visuelsAttendus = new Map([[5, 1], [10, 2], [15, 2], [20, 3]]);
    const denominateursAttendus = new Map([
      [5, [5]],
      [10, [5, 4]],
      [15, [5, 4, 10]],
      [20, [5, 4, 10, 2]],
    ]);
    for (const nombreQuestions of LONGUEURS) {
      for (let indexGraine = 0; indexGraine < 100; indexGraine += 1) {
        const plan = planifierSerieEcrituresMultiples({
          graine: `couverture-${nombreQuestions}-${indexGraine}`,
          nombreQuestions,
        });
        assert.equal(
          plan.filter(({ presentation }) =>
            presentation === PRESENTATION_VISUELLE_ECRITURES).length,
          visuelsAttendus.get(nombreQuestions),
        );
        assert.deepEqual(
          plan
            .filter(({ famille }) =>
              famille === FAMILLE_FRACTION_REPERE_POURCENTAGE)
            .map(({ denominateur }) => denominateur),
          denominateursAttendus.get(nombreQuestions),
        );
        const premierDecimal = plan.find(({ famille }) =>
          famille === FAMILLE_POURCENTAGE_DECIMAL);
        assert.ok(premierDecimal.pourcentage < 10);
        assert.equal(
          plan.at(-1).presentation === PRESENTATION_VISUELLE_ECRITURES,
          false,
        );
        assert.equal(
          plan.some(({ famille, presentation }) =>
            famille === FAMILLE_RECONNAITRE_EQUIVALENCES
            && presentation === PRESENTATION_VISUELLE_ECRITURES),
          false,
        );
        if (nombreQuestions >= 10) {
          const decimales = plan.filter(({ famille }) =>
            famille === FAMILLE_POURCENTAGE_DECIMAL);
          assert.deepEqual(
            new Set(decimales.map(({ variante }) => variante)),
            new Set(["pourcentage-vers-decimal", "decimal-vers-pourcentage"]),
          );
          const unites = plan.filter(({ famille }) =>
            famille === FAMILLE_UNITE_DEPASSEMENT);
          assert.equal(unites[0].pourcentage, 100);
          assert.ok(unites[1].pourcentage > 100);
          assert.equal(unites[1].variante, "mixte-vers-pourcentage");
        }
        if (nombreQuestions === 20) {
          assert.deepEqual(
            new Set(
              plan
                .filter(({ famille }) => famille === FAMILLE_CHAINE_EGALITES)
                .map(({ variante }) => variante),
            ),
            new Set([
              "chaine-vers-pourcentage",
              "chaine-vers-decimal",
              "chaine-vers-fraction",
            ]),
          );
        }
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
