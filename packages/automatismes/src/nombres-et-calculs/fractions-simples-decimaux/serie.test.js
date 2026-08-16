import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  validerQuestionInstanceV2,
} from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  DENOMINATEURS_AUTORISES,
  MICRO_NOTION_NC03,
  MICRO_NOTION_NC04,
  NOTION_FRACTIONS_SIMPLES_DECIMAUX,
  estFractionDuDomaine,
} from "./commun.js";
import {
  QUOTAS_SERIES_FRACTIONS_DECIMAUX,
  genererSerieFractionsDecimaux,
  planifierSerieFractionsDecimaux,
  repartirMicroNotionsFractionsDecimaux,
  signatureVisibleQuestion,
} from "./serie.js";

const LONGUEURS_JALONS = Object.freeze([5, 10, 15, 20]);

function cleRationnelle({ numerateur, denominateur }) {
  let a = Math.abs(numerateur);
  let b = Math.abs(denominateur);
  while (b !== 0) [a, b] = [b, a % b];
  return `${numerateur / a}/${denominateur / a}`;
}

function compterMicroNotions(elements) {
  return elements.reduce((comptes, element) => {
    const microNotion = element.microNotion ?? element.classement.microNotion;
    comptes[microNotion] = (comptes[microNotion] ?? 0) + 1;
    return comptes;
  }, { [MICRO_NOTION_NC03]: 0, [MICRO_NOTION_NC04]: 0 });
}

function verifierContraintesOrdre(plan) {
  for (let index = 1; index < plan.length; index += 1) {
    assert.equal(
      plan[index - 1].presentation === "qcm-diagnostique"
        && plan[index].presentation === "qcm-diagnostique",
      false,
      `deux QCM consécutifs aux positions ${index} et ${index + 1}`,
    );
    assert.equal(
      plan[index - 1].forme === "fraction-libre"
        && plan[index].forme === "fraction-libre",
      false,
      `deux fractions libres consécutives aux positions ${index} et ${index + 1}`,
    );
  }
  for (let index = 2; index < plan.length; index += 1) {
    assert.equal(
      plan[index - 2].microNotion === plan[index].microNotion
        && plan[index - 1].microNotion === plan[index].microNotion,
      false,
      `trois questions de même sens à la position ${index + 1}`,
    );
    assert.equal(
      plan[index - 2].denominateur === plan[index].denominateur
        && plan[index - 1].denominateur === plan[index].denominateur,
      false,
      `trois dénominateurs identiques à la position ${index + 1}`,
    );
  }
}

describe("NC-03/NC-04 — plan de série commun", () => {
  it("équilibre tous les formats 1 à 20 et donne le bonus impair selon la graine", () => {
    const bonusVus = new Set();
    for (let nombreQuestions = 1; nombreQuestions <= 20; nombreQuestions += 1) {
      for (let graine = 0; graine < 100; graine += 1) {
        const repartition = repartirMicroNotionsFractionsDecimaux({
          graine: `repartition-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.equal(
          repartition[MICRO_NOTION_NC03] + repartition[MICRO_NOTION_NC04],
          nombreQuestions,
        );
        assert.ok(
          Math.abs(
            repartition[MICRO_NOTION_NC03] - repartition[MICRO_NOTION_NC04],
          ) <= 1,
        );
        if (nombreQuestions % 2 === 1) {
          bonusVus.add(
            repartition[MICRO_NOTION_NC03] > repartition[MICRO_NOTION_NC04]
              ? MICRO_NOTION_NC03
              : MICRO_NOTION_NC04,
          );
        }
      }
    }
    assert.deepEqual(
      [...bonusVus].sort(),
      [MICRO_NOTION_NC03, MICRO_NOTION_NC04].sort(),
    );
  });

  it("respecte sur mille graines les quotas de QCM, productions libres et millièmes", () => {
    for (const nombreQuestions of LONGUEURS_JALONS) {
      const quotas = QUOTAS_SERIES_FRACTIONS_DECIMAUX[nombreQuestions];
      for (let graine = 0; graine < 1000; graine += 1) {
        const plan = planifierSerieFractionsDecimaux({
          graine: `quota-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        const comptes = compterMicroNotions(plan);
        assert.equal(plan.length, nombreQuestions);
        assert.equal(
          plan.filter(({ presentation }) => presentation === "qcm-diagnostique").length,
          quotas.qcm,
        );
        assert.equal(
          plan.filter(({ presentation }) => presentation === "abstraite").length,
          nombreQuestions - quotas.qcm,
        );
        assert.equal(
          plan.filter(({ presentation }) => presentation === "double-droite").length,
          0,
        );
        assert.equal(
          plan.filter(({ forme }) => forme === "fraction-libre").length,
          quotas.productionsLibres,
        );
        assert.equal(
          plan.filter(({ denominateur }) => denominateur === 1000).length,
          quotas.milliemes,
        );
        assert.equal(new Set(plan.map(cleRationnelle)).size, nombreQuestions);
        verifierContraintesOrdre(plan);
        if (nombreQuestions === 5) {
          for (const denominateur of [2, 4, 10, 100]) {
            assert.ok(plan.some((element) =>
              element.forme !== "fraction-libre"
              && element.denominateur === denominateur));
          }
        }
        if (nombreQuestions % 2 === 0) {
          assert.deepEqual(comptes, {
            [MICRO_NOTION_NC03]: nombreQuestions / 2,
            [MICRO_NOTION_NC04]: nombreQuestions / 2,
          });
        } else {
          assert.deepEqual(
            Object.values(comptes).sort((a, b) => a - b),
            [Math.floor(nombreQuestions / 2), Math.ceil(nombreQuestions / 2)],
          );
        }
      }
    }
  });

  it("respecte les quatre contraintes d'ordre pour toutes les longueurs", () => {
    for (let nombreQuestions = 1; nombreQuestions <= 20; nombreQuestions += 1) {
      for (let graine = 0; graine < 200; graine += 1) {
        const plan = planifierSerieFractionsDecimaux({
          graine: `ordre-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        verifierContraintesOrdre(plan);
      }
    }
  });

  it("ne réserve aucune famille facile à la première position", () => {
    for (const nombreQuestions of LONGUEURS_JALONS) {
      const premiers = {
        qcm: false,
        libre: false,
        propre: false,
        impropre: false,
        microNotions: new Set(),
        denominateurs: new Set(),
      };
      for (let graine = 0; graine < 500; graine += 1) {
        const premier = planifierSerieFractionsDecimaux({
          graine: `premiere-${nombreQuestions}-${graine}`,
          nombreQuestions,
        })[0];
        premiers.qcm ||= premier.presentation === "qcm-diagnostique";
        premiers.libre ||= premier.forme === "fraction-libre";
        premiers.propre ||= premier.numerateur < premier.denominateur;
        premiers.impropre ||= premier.numerateur > premier.denominateur
          && premier.numerateur % premier.denominateur !== 0;
        premiers.microNotions.add(premier.microNotion);
        premiers.denominateurs.add(premier.denominateur);
      }
      assert.equal(premiers.qcm, true);
      assert.equal(premiers.libre, true);
      assert.equal(premiers.propre, true);
      assert.equal(premiers.impropre, true);
      assert.equal(premiers.microNotions.size, 2);
      assert.ok(premiers.denominateurs.size >= 3);
    }
  });

  it("place les fractions libres dès cinq et couvre leurs deux catégories", () => {
    for (const nombreQuestions of [5, 10]) {
      const categoriesVues = new Set();
      for (let graine = 0; graine < 1000; graine += 1) {
        const libres = planifierSerieFractionsDecimaux({
          graine: `libre-${nombreQuestions}-${graine}`,
          nombreQuestions,
        }).filter(({ forme }) => forme === "fraction-libre");
        assert.equal(libres.length, 1);
        assert.equal(libres[0].microNotion, MICRO_NOTION_NC04);
        categoriesVues.add([2, 4].includes(libres[0].denominateur)
          ? "demis-quarts"
          : "decimales");
      }
      assert.deepEqual([...categoriesVues].sort(), ["decimales", "demis-quarts"]);
    }
    for (const nombreQuestions of [15, 20]) {
      for (let graine = 0; graine < 1000; graine += 1) {
        const libres = planifierSerieFractionsDecimaux({
          graine: `libres-deux-${nombreQuestions}-${graine}`,
          nombreQuestions,
        }).filter(({ forme }) => forme === "fraction-libre");
        assert.equal(libres.length, 2);
        assert.equal(libres.filter(({ denominateur }) => [2, 4].includes(denominateur)).length, 1);
        assert.equal(libres.filter(({ denominateur }) => [10, 100].includes(denominateur)).length, 1);
      }
    }
  });

  it("place un millième à 15 et 20, dans les deux sens et avec trois chiffres", () => {
    const directions = new Set();
    let troisChiffresVu = false;
    for (const nombreQuestions of [15, 20]) {
      for (let graine = 0; graine < 1000; graine += 1) {
        const plan = planifierSerieFractionsDecimaux({
          graine: `millieme-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        const milliemes = plan.filter(({ denominateur }) => denominateur === 1000);
        assert.equal(milliemes.length, 1);
        assert.notEqual(milliemes[0].numerateur % 10, 0);
        directions.add(milliemes[0].microNotion);
        troisChiffresVu ||= milliemes[0].numerateur >= 100;
      }
    }
    assert.deepEqual(
      [...directions].sort(),
      [MICRO_NOTION_NC03, MICRO_NOTION_NC04].sort(),
    );
    assert.equal(troisChiffresVu, true);
    for (let nombreQuestions = 1; nombreQuestions < 15; nombreQuestions += 1) {
      const plan = planifierSerieFractionsDecimaux({
        graine: "sans-millieme",
        nombreQuestions,
      });
      assert.equal(
        plan.filter(({ denominateur }) => denominateur === 1000).length,
        0,
      );
    }
  });

  it("garantit les classes structurelles sans épuiser les valeurs distinctes", () => {
    const propre = ({ numerateur, denominateur, forme }) =>
      forme !== "fraction-libre"
      && [2, 4, 10, 100].includes(denominateur)
      && numerateur < denominateur;
    const impropre = ({ numerateur, denominateur, forme }) =>
      forme !== "fraction-libre"
      && [2, 4, 10, 100].includes(denominateur)
      && numerateur > denominateur
      && numerateur % denominateur !== 0;
    const propreSimple = (element) =>
      [2, 4].includes(element.denominateur) && propre(element);
    const impropreSimple = (element) =>
      [2, 4].includes(element.denominateur) && impropre(element);
    const entierCache = ({ numerateur, denominateur, forme }) =>
      forme !== "fraction-libre"
      && denominateur !== 1
      && numerateur % denominateur === 0;
    for (const nombreQuestions of LONGUEURS_JALONS) {
      for (let graine = 0; graine < 1000; graine += 1) {
        const plan = planifierSerieFractionsDecimaux({
          graine: `structures-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.ok(plan.some(propre));
        assert.ok(plan.some(impropre));
        if (nombreQuestions >= 10) {
          for (const microNotion of [MICRO_NOTION_NC03, MICRO_NOTION_NC04]) {
            const sens = plan.filter((element) => element.microNotion === microNotion);
            assert.ok(sens.some(propre));
            assert.ok(sens.some(impropre));
            if (nombreQuestions >= 15) {
              assert.ok(sens.some(propreSimple));
              assert.ok(sens.some(impropreSimple));
            }
          }
          assert.ok(plan.some(entierCache));
        }
        if (nombreQuestions === 20) {
          assert.ok(plan.filter((element) =>
            element.microNotion === MICRO_NOTION_NC04).some(entierCache));
          assert.ok(plan.some((element) =>
            element.microNotion === MICRO_NOTION_NC03
            && element.denominateur === 1));
        }
      }
    }
  });

  it("rend les quarts 9 à 12 atteignables dans les deux sens dès les séries courtes", () => {
    for (const nombreQuestions of [5, 10]) {
      const vus = new Map([
        [MICRO_NOTION_NC03, new Set()],
        [MICRO_NOTION_NC04, new Set()],
      ]);
      for (let graine = 0; graine < 1000; graine += 1) {
        const plan = planifierSerieFractionsDecimaux({
          graine: `nouveaux-quarts-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        for (const element of plan) {
          if (
            element.forme !== "fraction-libre"
            && element.denominateur === 4
            && element.numerateur >= 9
          ) {
            vus.get(element.microNotion).add(element.numerateur);
          }
        }
      }
      for (const valeurs of vus.values()) {
        assert.deepEqual([...valeurs].sort((a, b) => a - b), [9, 10, 11, 12]);
      }
    }
  });

  it("reste strictement dans le domaine convenu, sans jamais produire 5/8", () => {
    for (let graine = 0; graine < 1000; graine += 1) {
      const plan = planifierSerieFractionsDecimaux({
        graine: `domaine-${graine}`,
        nombreQuestions: 20,
      });
      for (const { numerateur, denominateur } of plan) {
        assert.ok(DENOMINATEURS_AUTORISES.includes(denominateur));
        assert.ok(estFractionDuDomaine(numerateur, denominateur));
        assert.notDeepEqual([numerateur, denominateur], [5, 8]);
      }
    }
  });

  it("emploie tous les repères officiels comme ancrages variables du pool", () => {
    const reperes = [
      "1/2",
      "1/4",
      "3/4",
      "3/2",
      "4/2",
      "5/2",
      "1/10",
      "1/100",
      "1/1000",
      "100/100",
      "7/1",
    ];
    const positions = new Map(reperes.map((repere) => [repere, new Set()]));
    for (let graine = 0; graine < 500; graine += 1) {
      const plan = planifierSerieFractionsDecimaux({
        graine: `reperes-${graine}`,
        nombreQuestions: 20,
      });
      assert.ok(
        plan.filter(({ numerateur, denominateur }) =>
          positions.has(`${numerateur}/${denominateur}`)).length >= 2,
        "une série de 20 doit contenir au moins deux repères officiels exacts",
      );
      plan.forEach(({ numerateur, denominateur }, position) => {
        positions.get(`${numerateur}/${denominateur}`)?.add(position);
      });
    }
    for (const repere of reperes) {
      assert.ok(positions.get(repere).size > 1, `${repere} doit apparaître sans position fixe`);
    }
  });

  it("rejoue exactement le plan et varie avec une autre graine", () => {
    assert.deepEqual(
      planifierSerieFractionsDecimaux({ graine: "meme", nombreQuestions: 20 }),
      planifierSerieFractionsDecimaux({ graine: "meme", nombreQuestions: 20 }),
    );
    assert.notDeepEqual(
      planifierSerieFractionsDecimaux({ graine: "meme", nombreQuestions: 20 }),
      planifierSerieFractionsDecimaux({ graine: "autre", nombreQuestions: 20 }),
    );
  });

  it("refuse les longueurs hors de la plage du lecteur", () => {
    for (const nombreQuestions of [0, 21, 100, 1.5]) {
      assert.throws(
        () => planifierSerieFractionsDecimaux({
          graine: "longueur-invalide",
          nombreQuestions,
        }),
        /entre 1 et 20/,
      );
    }
    for (const graine of [-1, 2 ** 32, 1.5, null]) {
      assert.throws(() => planifierSerieFractionsDecimaux({
        graine,
        nombreQuestions: 10,
      }));
    }
  });
});

describe("NC-03/NC-04 — génération de la série", () => {
  it("produit des questions conformes sous une seule notion visible", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS_JALONS) {
      for (let graine = 0; graine < 100; graine += 1) {
        const questions = genererSerieFractionsDecimaux({
          registre,
          graine: `serie-${nombreQuestions}-${graine}`,
          nombreQuestions,
        });
        assert.equal(questions.length, nombreQuestions);
        assert.equal(
          new Set(questions.map(signatureVisibleQuestion)).size,
          nombreQuestions,
        );
        for (const question of questions) {
          assert.equal(
            question.classement.notion,
            NOTION_FRACTIONS_SIMPLES_DECIMAUX,
          );
          assert.ok([
            MICRO_NOTION_NC03,
            MICRO_NOTION_NC04,
          ].includes(question.classement.microNotion));
          assert.deepEqual(
            validerQuestionInstanceV2(question),
            { valide: true, erreurs: [] },
          );
        }
      }
    }
  });

  it("instancie les quotas de réponses fraction libre aux quatre jalons", () => {
    for (const nombreQuestions of LONGUEURS_JALONS) {
      const questions = genererSerieFractionsDecimaux({
        registre: creerRegistreAutomatismes(),
        graine: `serie-libre-${nombreQuestions}`,
        nombreQuestions,
      });
      const libres = questions.filter(
        ({ reponse }) => reponse.type === TYPE_REPONSE_FRACTION_EQUIVALENTE,
      );
      assert.equal(
        libres.length,
        QUOTAS_SERIES_FRACTIONS_DECIMAUX[nombreQuestions].productionsLibres,
      );
      assert.ok(libres.every(
        ({ classement }) => classement.microNotion === MICRO_NOTION_NC04,
      ));
    }
  });

  it("rejoue les mêmes instances et varie avec une autre graine", () => {
    const registre = creerRegistreAutomatismes();
    const a = genererSerieFractionsDecimaux({
      registre,
      graine: "serie-a",
      nombreQuestions: 20,
    });
    const encoreA = genererSerieFractionsDecimaux({
      registre,
      graine: "serie-a",
      nombreQuestions: 20,
    });
    const b = genererSerieFractionsDecimaux({
      registre,
      graine: "serie-b",
      nombreQuestions: 20,
    });
    assert.deepEqual(a, encoreA);
    assert.notDeepEqual(a, b);
  });
});
