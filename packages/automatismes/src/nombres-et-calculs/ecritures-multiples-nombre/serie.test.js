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
  FAMILLE_RECONNAITRE_EQUIVALENCES,
  FAMILLE_UNITE_DEPASSEMENT,
  PRESENTATION_VISUELLE_ECRITURES,
  lirePourcentageQuestion,
} from "./questions.js";
import {
  PAQUET_PROFILS_ECRITURES_MULTIPLES,
  QUOTAS_JALONS_ECRITURES_MULTIPLES,
  genererSerieEcrituresMultiples,
  planifierSerieEcrituresMultiples,
  repartirFamillesEcrituresMultiples,
} from "./serie.js";

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);

function quotasDansOrdre(repartition) {
  return FAMILLES_ECRITURES_MULTIPLES.map((famille) => repartition[famille]);
}

describe("NC-05 — paquet pédagogique déterministe", () => {
  it("respecte exactement les quotas et variantes de référence à vingt", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const graine = `quota-${seed}`;
      assert.deepEqual(
        quotasDansOrdre(repartirFamillesEcrituresMultiples(20, graine)),
        QUOTAS_JALONS_ECRITURES_MULTIPLES[20],
      );
      const plan = planifierSerieEcrituresMultiples({ graine, nombreQuestions: 20 });
      assert.equal(plan.filter(({ presentation }) =>
        presentation === PRESENTATION_VISUELLE_ECRITURES).length, 3);
      assert.equal(plan.filter(({ variante }) => variante === "selection-multiple").length, 1);
      assert.equal(plan.filter(({ variante }) => variante === "unite-vers-entier").length, 1);
      assert.deepEqual(
        new Set(plan.filter(({ famille }) => famille === FAMILLE_POURCENTAGE_DECIMAL)
          .map(({ variante }) => variante)),
        new Set(["pourcentage-vers-decimal", "decimal-vers-pourcentage"]),
      );
      assert.deepEqual(
        new Set(plan.filter(({ famille }) => famille === FAMILLE_CHAINE_EGALITES)
          .map(({ variante }) => variante)),
        new Set([
          "chaine-vers-pourcentage",
          "chaine-vers-decimal",
          "chaine-vers-fraction",
        ]),
      );
      assert.deepEqual(
        plan.filter(({ famille }) => famille === FAMILLE_FRACTION_REPERE_POURCENTAGE)
          .map(({ denominateur }) => denominateur).sort((a, b) => a - b),
        [2, 4, 5, 10],
      );
    }
  });

  it("rend la sélection multiple et toutes les familles observables dans 1 ou 2 questions", () => {
    const familles = new Set();
    let selectionsMultiples = 0;
    for (let seed = 0; seed < 8_000; seed += 1) {
      const une = planifierSerieEcrituresMultiples({
        graine: `petite-${seed}`,
        nombreQuestions: 1,
      });
      familles.add(une[0].famille);
      const deux = planifierSerieEcrituresMultiples({
        graine: `petite-${seed}`,
        nombreQuestions: 2,
      });
      selectionsMultiples += deux.filter(({ variante }) =>
        variante === "selection-multiple").length;
    }
    assert.deepEqual([...familles].sort(), [...FAMILLES_ECRITURES_MULTIPLES].sort());
    assert.ok(selectionsMultiples > 0);
  });

  it("reste déterministe, sans valeur répétée et sans familles voisines si possible", () => {
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 1_000; seed += 1) {
        const configuration = { graine: `ordre-${seed}`, nombreQuestions };
        const plan = planifierSerieEcrituresMultiples(configuration);
        assert.deepEqual(planifierSerieEcrituresMultiples(configuration), plan);
        assert.equal(new Set(plan.map(({ pourcentage }) => pourcentage)).size, nombreQuestions);
        const compte = new Map();
        plan.forEach(({ famille }) => compte.set(famille, (compte.get(famille) ?? 0) + 1));
        if (Math.max(...compte.values()) <= Math.ceil(nombreQuestions / 2)) {
          assert.ok(plan.every((element, index) =>
            index === 0 || element.famille !== plan[index - 1].famille));
        }
      }
    }
  });

  it("conserve les cas unité et dépassement sans corrélation de position", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const unites = planifierSerieEcrituresMultiples({
        graine: `unites-${seed}`,
        nombreQuestions: 20,
      }).filter(({ famille }) => famille === FAMILLE_UNITE_DEPASSEMENT);
      assert.equal(unites.filter(({ pourcentage }) => pourcentage === 100).length, 1);
      assert.ok(unites.filter(({ pourcentage }) => pourcentage > 100).length === 3);
    }
    assert.equal(PAQUET_PROFILS_ECRITURES_MULTIPLES.tailleReference, 20);
  });
});

describe("NC-05 — génération", () => {
  it("produit des questions V2 sans doublon et garde un seul multi-choix à vingt", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 100; seed += 1) {
        const questions = genererSerieEcrituresMultiples({
          registre,
          graine: `questions-${nombreQuestions}-${seed}`,
          nombreQuestions,
        });
        assert.equal(questions.length, nombreQuestions);
        assert.equal(new Set(questions.map(lirePourcentageQuestion)).size, nombreQuestions);
        assert.ok(questions.every((question) => validerQuestionInstanceV2(question).valide));
        if (nombreQuestions === 20) {
          assert.equal(questions.filter(({ reponse }) =>
            reponse.type === TYPE_REPONSE_SELECTION_MULTIPLE).length, 1);
        }
      }
    }
  });

  it("ne rend la sélection multiple que dans sa famille compatible", () => {
    const questions = genererSerieEcrituresMultiples({
      registre: creerRegistreAutomatismes(),
      graine: "compatibilite-selection",
      nombreQuestions: 20,
    });
    for (const question of questions.filter(({ reponse }) =>
      reponse.type === TYPE_REPONSE_SELECTION_MULTIPLE)) {
      assert.equal(question.classement.famille, FAMILLE_RECONNAITRE_EQUIVALENCES);
    }
  });
});
