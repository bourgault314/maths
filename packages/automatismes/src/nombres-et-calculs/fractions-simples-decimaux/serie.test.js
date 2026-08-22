import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import { MICRO_NOTION_NC03, MICRO_NOTION_NC04 } from "./commun.js";
import {
  PAQUET_CONTENUS_FRACTIONS_DECIMAUX,
  PAQUET_CONTENUS_NC03,
  PAQUET_CONTENUS_NC04,
  PAQUET_PRESENTATIONS_FRACTIONS_DECIMAUX,
  genererSerieDecimalVersFraction,
  genererSerieFractionVersDecimal,
  genererSerieFractionsDecimaux,
  planifierSerieDecimalVersFraction,
  planifierSerieFractionVersDecimal,
  planifierSerieFractionsDecimaux,
  signatureVisibleQuestion,
} from "./serie.js";

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);

function pgcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

function cleValeur({ numerateur, denominateur }) {
  const diviseur = pgcd(numerateur, denominateur);
  return `${numerateur / diviseur}/${denominateur / diviseur}`;
}

function nombre(plan, predicat) {
  return plan.filter(predicat).length;
}

function verifierOrdreQuandPossible(plan) {
  const qcm = nombre(plan, ({ presentation }) => presentation === "qcm-diagnostique");
  if (qcm <= plan.length - qcm + 1) {
    assert.ok(plan.every((element, index) =>
      index === 0
      || element.presentation !== "qcm-diagnostique"
      || plan[index - 1].presentation !== "qcm-diagnostique"));
  }
  const libres = nombre(plan, ({ forme }) => forme === "fraction-libre");
  if (libres <= plan.length - libres + 1) {
    assert.ok(plan.every((element, index) =>
      index === 0
      || element.forme !== "fraction-libre"
      || plan[index - 1].forme !== "fraction-libre"));
  }
}

describe("NC-03/NC-04 — paquets pédagogiques déterministes", () => {
  it("garantit les quotas combinés de référence à vingt", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const plan = planifierSerieFractionsDecimaux({
        graine: `quota-${seed}`,
        nombreQuestions: 20,
      });
      assert.equal(nombre(plan, ({ microNotion }) => microNotion === MICRO_NOTION_NC03), 10);
      assert.equal(nombre(plan, ({ microNotion }) => microNotion === MICRO_NOTION_NC04), 10);
      assert.equal(nombre(plan, ({ presentation }) => presentation === "qcm-diagnostique"), 4);
      assert.equal(nombre(plan, ({ forme }) => forme === "fraction-libre"), 2);
      assert.equal(nombre(plan, ({ denominateur }) => denominateur === 1000), 1);
      assert.equal(nombre(plan, ({ classeValeur }) => classeValeur === "inferieur-un"), 2);
      assert.equal(nombre(plan, ({ classeValeur }) => classeValeur === "superieur-un-non-entier"), 2);
      assert.equal(nombre(plan, ({ classeValeur }) => classeValeur === "entier"), 1);
      assert.equal(new Set(plan.map(cleValeur)).size, 20);
    }
  });

  it("garantit les quotas propres à chaque sens séparé à vingt", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const nc03 = planifierSerieFractionVersDecimal({
        graine: `isole-${seed}`,
        nombreQuestions: 20,
      });
      const nc04 = planifierSerieDecimalVersFraction({
        graine: `isole-${seed}`,
        nombreQuestions: 20,
      });
      for (const plan of [nc03, nc04]) {
        assert.equal(nombre(plan, ({ presentation }) => presentation === "qcm-diagnostique"), 4);
        assert.equal(nombre(plan, ({ denominateur }) => denominateur === 1000), 1);
        assert.equal(nombre(plan, ({ classeValeur }) => classeValeur === "inferieur-un"), 1);
        assert.equal(nombre(plan, ({ classeValeur }) => classeValeur === "superieur-un-non-entier"), 1);
        assert.equal(nombre(plan, ({ classeValeur }) => classeValeur === "entier"), 1);
        assert.equal(new Set(plan.map(cleValeur)).size, 20);
      }
      assert.equal(nombre(nc03, ({ forme }) => forme === "fraction-libre"), 0);
      assert.equal(nombre(nc04, ({ forme }) => forme === "fraction-libre"), 2);
    }
  });

  it("rend QCM, millièmes et fractions libres observables dans 1 ou 2 questions", () => {
    const observations = {
      combineQcm: 0,
      combineMillieme: 0,
      combineLibre: 0,
      nc03Millieme: 0,
      nc04Millieme: 0,
      nc04Libre: 0,
    };
    const microNotions = new Set();
    for (let seed = 0; seed < 8_000; seed += 1) {
      const combine = planifierSerieFractionsDecimaux({
        graine: `petite-${seed}`,
        nombreQuestions: 2,
      });
      combine.forEach(({ microNotion }) => microNotions.add(microNotion));
      observations.combineQcm += nombre(combine, ({ presentation }) =>
        presentation === "qcm-diagnostique");
      observations.combineMillieme += nombre(combine, ({ denominateur }) => denominateur === 1000);
      observations.combineLibre += nombre(combine, ({ forme }) => forme === "fraction-libre");
      const nc03 = planifierSerieFractionVersDecimal({
        graine: `petite-${seed}`,
        nombreQuestions: 1,
      });
      const nc04 = planifierSerieDecimalVersFraction({
        graine: `petite-${seed}`,
        nombreQuestions: 1,
      });
      observations.nc03Millieme += Number(nc03[0].denominateur === 1000);
      observations.nc04Millieme += Number(nc04[0].denominateur === 1000);
      observations.nc04Libre += Number(nc04[0].forme === "fraction-libre");
    }
    assert.deepEqual(microNotions, new Set([MICRO_NOTION_NC03, MICRO_NOTION_NC04]));
    Object.entries(observations).forEach(([id, total]) => assert.ok(total > 0, `${id} absent`));
  });

  it("reste déterministe, distinct et correctement ordonné sur 3 000 seeds", () => {
    const planificateurs = [
      planifierSerieFractionsDecimaux,
      planifierSerieFractionVersDecimal,
      planifierSerieDecimalVersFraction,
    ];
    for (let seed = 0; seed < 3_000; seed += 1) {
      const nombreQuestions = LONGUEURS[seed % LONGUEURS.length];
      for (const planifier of planificateurs) {
        const configuration = { graine: `audit-${seed}`, nombreQuestions };
        const plan = planifier(configuration);
        assert.deepEqual(planifier(configuration), plan);
        assert.equal(plan.length, nombreQuestions);
        assert.equal(new Set(plan.map(cleValeur)).size, nombreQuestions);
        verifierOrdreQuandPossible(plan);
        assert.ok(plan.every(({ denominateur }) => [1, 2, 4, 10, 100, 1000].includes(denominateur)));
        assert.equal(plan.some(({ numerateur, denominateur }) =>
          numerateur === 5 && denominateur === 8), false);
      }
    }
  });

  it("déclare toutes les dimensions sur vingt jetons", () => {
    for (const paquet of [
      PAQUET_CONTENUS_FRACTIONS_DECIMAUX,
      PAQUET_CONTENUS_NC03,
      PAQUET_CONTENUS_NC04,
      PAQUET_PRESENTATIONS_FRACTIONS_DECIMAUX,
    ]) assert.equal(paquet.tailleReference, 20);
  });
});

describe("NC-03/NC-04 — génération", () => {
  it("produit des questions V2 distinctes sous la bonne notion", () => {
    const registre = creerRegistreAutomatismes();
    const fabriques = [
      [genererSerieFractionVersDecimal, MICRO_NOTION_NC03],
      [genererSerieDecimalVersFraction, MICRO_NOTION_NC04],
      [genererSerieFractionsDecimaux, null],
    ];
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 100; seed += 1) {
        for (const [generer, notion] of fabriques) {
          const questions = generer({
            registre,
            graine: `questions-${nombreQuestions}-${seed}`,
            nombreQuestions,
          });
          assert.equal(questions.length, nombreQuestions);
          assert.equal(new Set(questions.map(signatureVisibleQuestion)).size, nombreQuestions);
          assert.ok(questions.every((question) => validerQuestionInstanceV2(question).valide));
          if (notion !== null) {
            assert.ok(questions.every(({ classement }) => classement.notion === notion));
          }
        }
      }
    }
  });
});
