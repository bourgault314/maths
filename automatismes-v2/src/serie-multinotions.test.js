import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { creerRegistreAutomatismes } from "../../packages/automatismes/src/registre.js";
import {
  FAMILLE_DIAGNOSTIC_COORDONNEES,
  FAMILLE_IDENTIFIER_POINT,
  decoderCoordonnee,
} from "../../packages/automatismes/src/espace-et-geometrie/reperage-plan/questions.js";
import {
  NOTION_LIRE_COORDONNEES_POINT,
  NOTION_NC01,
  NOTION_PLACER_POINT_REPERE,
  obtenirNotionLecteur,
} from "./registre-lecteur.js";
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

  it("sélectionne sans remise quand il y a plus de notions que de questions", () => {
    for (const total of [1, 2, 5]) {
      const ids = notions(10);
      const repartition = repartirQuestionsEntreNotions({
        notions: ids,
        nombreQuestions: total,
        graine: `sous-allocation-${total}`,
      });
      assert.equal(
        repartition.reduce((somme, element) => somme + element.nombreQuestions, 0),
        total,
      );
      assert.equal(repartition.filter(({ nombreQuestions }) => nombreQuestions === 1).length, total);
      assert.ok(repartition.every(({ nombreQuestions }) => [0, 1].includes(nombreQuestions)));
    }
  });

  it("est équitable sous-alloué sur 10 000 seeds", () => {
    const ids = notions(10);
    const compte = new Map(ids.map((id) => [id, 0]));
    for (let seed = 0; seed < 10_000; seed += 1) {
      const repartition = repartirQuestionsEntreNotions({
        notions: ids,
        nombreQuestions: 5,
        graine: `equite-${seed}`,
      });
      repartition
        .filter(({ nombreQuestions }) => nombreQuestions === 1)
        .forEach(({ notion }) => compte.set(notion, compte.get(notion) + 1));
    }
    for (const [id, nombre] of compte) {
      assert.ok(Math.abs(nombre - 5_000) < 250, `${id}: ${nombre}`);
    }
  });

  it("audite 3 000 seeds pour 1, 2, 3, 5 et 10 automatismes et tous les volumes du menu", () => {
    for (const nombreNotions of [1, 2, 3, 5, 10]) {
      const ids = notions(nombreNotions);
      for (const total of [5, 10, 15, 20]) {
        const cumuls = new Map(ids.map((id) => [id, 0]));
        for (let seed = 0; seed < 3_000; seed += 1) {
          const repartition = repartirQuestionsEntreNotions({
            notions: ids,
            nombreQuestions: total,
            graine: `matrice-${nombreNotions}-${total}-${seed}`,
          });
          assert.equal(
            repartition.reduce((somme, { nombreQuestions }) => somme + nombreQuestions, 0),
            total,
          );
          const actives = repartition.filter(({ nombreQuestions }) => nombreQuestions > 0);
          assert.equal(new Set(actives.map(({ notion }) => notion)).size, actives.length);
          if (total >= nombreNotions) {
            assert.equal(actives.length, nombreNotions);
            const quotas = actives.map(({ nombreQuestions }) => nombreQuestions);
            assert.ok(Math.max(...quotas) - Math.min(...quotas) <= 1);
          } else {
            assert.equal(actives.length, total);
            assert.ok(actives.every(({ nombreQuestions }) => nombreQuestions === 1));
          }
          repartition.forEach(({ notion, nombreQuestions }) =>
            cumuls.set(notion, cumuls.get(notion) + nombreQuestions));
        }
        const valeurs = [...cumuls.values()];
        assert.ok(
          Math.max(...valeurs) - Math.min(...valeurs) < Math.max(100, total * 20),
          `${nombreNotions} notions, ${total} questions : ${valeurs.join(", ")}`,
        );
      }
    }
  });

  it("ne dépend pas de l'ordre du tableau des notions", () => {
    const ids = notions(10);
    for (const total of [5, 10, 15, 20]) {
      assert.deepEqual(
        repartirQuestionsEntreNotions({
          notions: [...ids].reverse(),
          nombreQuestions: total,
          graine: "ordre-tableau",
        }),
        repartirQuestionsEntreNotions({
          notions: ids,
          nombreQuestions: total,
          graine: "ordre-tableau",
        }),
      );
    }
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

  it("refuse les sélections ambiguës", () => {
    assert.throws(
      () => repartirQuestionsEntreNotions({ notions: ["a", "a"], nombreQuestions: 2, graine: "x" }),
      /doublons/,
    );
  });
});

describe("génération multi-notions", () => {
  it("laisse les profils GE rares apparaître dans une petite série multi-notions", () => {
    const definitions = [
      NOTION_NC01,
      NOTION_LIRE_COORDONNEES_POINT,
      NOTION_PLACER_POINT_REPERE,
    ].map(obtenirNotionLecteur);
    const registre = creerRegistreAutomatismes();
    const observes = {
      pasQuartLecture: false,
      pasQuartPlacement: false,
      qcm: false,
      identifier: false,
      origineLecture: false,
      originePlacement: false,
    };
    for (let seed = 0; seed < 3_000; seed += 1) {
      const configuration = {
        definitions,
        registre,
        graine: `multi-ge-court-${seed}`,
        nombreQuestions: 5,
      };
      const questions = genererSerieMultinotions(configuration);
      if (seed < 20) assert.deepEqual(genererSerieMultinotions(configuration), questions);
      assert.equal(questions.length, 5);
      const ge = questions.filter(({ classement }) => [
        NOTION_LIRE_COORDONNEES_POINT,
        NOTION_PLACER_POINT_REPERE,
      ].includes(classement.notion));
      assert.ok(ge.length >= 2 && ge.length <= 4);
      for (const question of ge) {
        const repere = question.enonce.find(({ type }) => type === "repere-cartesien");
        assert.ok(repere);
        const lecture = question.classement.notion === NOTION_LIRE_COORDONNEES_POINT;
        observes.pasQuartLecture ||= lecture && repere.pas === 0.25;
        observes.pasQuartPlacement ||= !lecture && repere.pas === 0.25;
        observes.qcm ||= question.classement.famille === FAMILLE_DIAGNOSTIC_COORDONNEES;
        observes.identifier ||= question.classement.famille === FAMILLE_IDENTIFIER_POINT;
        const cible = lecture
          ? repere.points.find(({ nom }) => nom === repere.nomPoint)
          : decoderCoordonnee(question.reponse.attendus[0]);
        assert.ok(cible);
        if (lecture) {
          observes.origineLecture ||= cible.x === 0 && cible.y === 0;
        } else {
          observes.originePlacement ||= cible.x === 0 && cible.y === 0;
        }
        if (repere.pas < 1) {
          assert.ok(!Number.isInteger(cible.x) || !Number.isInteger(cible.y));
        }
      }
      if (Object.values(observes).every(Boolean) && seed >= 20) break;
    }
    assert.deepEqual(observes, {
      pasQuartLecture: true,
      pasQuartPlacement: true,
      qcm: true,
      identifier: true,
      origineLecture: true,
      originePlacement: true,
    });
  });

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

  it("génère une question par notion tirée dans une série sous-allouée", () => {
    const definitions = notions(10).map((id) => ({
      id,
      gabarit: { id },
      creerSerie: ({ nombreQuestions }) => Array.from(
        { length: nombreQuestions },
        (_, index) => ({ id: `${id}-${index + 1}`, classement: { notion: id } }),
      ),
    }));
    const questions = genererSerieMultinotions({
      definitions,
      registre: { instancier() { throw new Error("inutilisé"); } },
      graine: "sous-allocation",
      nombreQuestions: 5,
    });
    assert.equal(questions.length, 5);
    assert.equal(new Set(questions.map(({ classement }) => classement.notion)).size, 5);
  });

  it("ne dépend pas de l'ordre du registre fourni", () => {
    const definitions = notions(10).map((id) => ({
      id,
      gabarit: { id },
      creerSerie: ({ graine, nombreQuestions }) => Array.from(
        { length: nombreQuestions },
        (_, index) => ({ id: `${id}-${graine}-${index}`, classement: { notion: id } }),
      ),
    }));
    const configuration = {
      registre: { instancier() { throw new Error("inutilisé"); } },
      graine: "ordre-registre",
      nombreQuestions: 5,
    };
    assert.deepEqual(
      genererSerieMultinotions({ definitions, ...configuration }),
      genererSerieMultinotions({ definitions: [...definitions].reverse(), ...configuration }),
    );
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
