import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  PAQUET_DONNEES_VOLUMES,
  PAQUET_FORMES_VOLUME_CUBE_PAVE,
  PAQUET_MODES_VOLUME_CYLINDRE,
  PAQUET_VUES_VOLUMES,
  genererSerieVolumeCubePave,
  genererSerieVolumeCylindre,
  genererSerieVolumePrisme,
  planifierSerieVolumeCubePave,
  planifierSerieVolumeCylindre,
  planifierSerieVolumePrisme,
  signatureVisibleQuestionVolume,
} from "./serie.js";

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);
const PLANIFICATEURS = Object.freeze([
  planifierSerieVolumeCubePave,
  planifierSerieVolumePrisme,
  planifierSerieVolumeCylindre,
]);

function compter(plan, predicat) {
  return plan.filter(({ parametres }) => predicat(parametres)).length;
}

function verifierCouplesDistincts(plan) {
  assert.equal(new Set(plan.map(({ parametres }) =>
    `${parametres.donneesIndex}:${parametres.vueIndex}`)).size, plan.length);
}

describe("GM-13/GM-14/GM-15 — paquets pédagogiques déterministes", () => {
  it("garantit à vingt les quotas de formes, modes, données et vues", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const plans = PLANIFICATEURS.map((planifier) => planifier({
        graine: `quotas-volumes-${seed}`,
        nombreQuestions: 20,
      }));
      for (const plan of plans) {
        for (let index = 0; index < 5; index += 1) {
          assert.equal(compter(plan, ({ donneesIndex }) => donneesIndex === index), 4);
        }
        for (let index = 0; index < 4; index += 1) {
          assert.equal(compter(plan, ({ vueIndex }) => vueIndex === index), 5);
        }
        verifierCouplesDistincts(plan);
      }
      assert.equal(compter(plans[0], ({ forme }) => forme === "cube"), 10);
      assert.equal(compter(plans[0], ({ forme }) => forme === "pave"), 10);
      assert.equal(compter(plans[2], ({ mode }) => mode === "exact"), 10);
      assert.equal(compter(plans[2], ({ mode }) => mode === "approximation"), 10);
    }
  });

  it("rend chaque profil secondaire observable dans une allocation de 1 ou 2 questions", () => {
    const donnees = new Set();
    const vues = new Set();
    const formes = new Set();
    const modes = new Set();
    for (let seed = 0; seed < 8_000; seed += 1) {
      const nombreQuestions = seed % 2 + 1;
      for (const element of planifierSerieVolumePrisme({
        graine: `petite-volume-${seed}`,
        nombreQuestions,
      })) {
        donnees.add(element.parametres.donneesIndex);
        vues.add(element.parametres.vueIndex);
      }
      planifierSerieVolumeCubePave({
        graine: `petite-volume-${seed}`,
        nombreQuestions,
      }).forEach(({ parametres }) => formes.add(parametres.forme));
      planifierSerieVolumeCylindre({
        graine: `petite-volume-${seed}`,
        nombreQuestions,
      }).forEach(({ parametres }) => modes.add(parametres.mode));
    }
    assert.deepEqual(donnees, new Set([0, 1, 2, 3, 4]));
    assert.deepEqual(vues, new Set([0, 1, 2, 3]));
    assert.deepEqual(formes, new Set(["cube", "pave"]));
    assert.deepEqual(modes, new Set(["exact", "approximation"]));
  });

  it("reste déterministe, distinct et complet à toutes les allocations", () => {
    for (const paquet of [
      PAQUET_DONNEES_VOLUMES,
      PAQUET_FORMES_VOLUME_CUBE_PAVE,
      PAQUET_MODES_VOLUME_CYLINDRE,
      PAQUET_VUES_VOLUMES,
    ]) assert.equal(paquet.tailleReference, 20);
    for (let seed = 0; seed < 3_000; seed += 1) {
      const nombreQuestions = LONGUEURS[seed % LONGUEURS.length];
      for (const planifier of PLANIFICATEURS) {
        const configuration = { graine: `audit-volumes-${seed}`, nombreQuestions };
        const plan = planifier(configuration);
        assert.deepEqual(planifier(configuration), plan);
        verifierCouplesDistincts(plan);
      }
    }
  });
});

describe("GM-13/GM-14/GM-15 — génération", () => {
  it("produit des questions V2 sans doublon visible", () => {
    const registre = creerRegistreAutomatismes();
    const generateurs = [
      genererSerieVolumeCubePave,
      genererSerieVolumePrisme,
      genererSerieVolumeCylindre,
    ];
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 100; seed += 1) {
        for (const generer of generateurs) {
          const questions = generer({
            registre,
            graine: `questions-volumes-${nombreQuestions}-${seed}`,
            nombreQuestions,
          });
          assert.equal(questions.length, nombreQuestions);
          assert.equal(new Set(questions.map(signatureVisibleQuestionVolume)).size, nombreQuestions);
          assert.ok(questions.every((question) => validerQuestionInstanceV2(question).valide));
        }
      }
    }
  });
});
