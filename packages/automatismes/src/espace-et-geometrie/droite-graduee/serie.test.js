import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerQuestionInstanceV2 } from "../../../../contrats/src/question-v2.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  FAMILLE_DETERMINER_PAS,
  FAMILLE_DIAGNOSTIC,
  FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT,
  VARIANTE_DEUX_POINTS_QCM,
  VARIANTE_PAS_QCM,
} from "./questions.js";
import {
  PAQUET_FAMILLES_DROITE_GRADUEE,
  PAQUET_PROFILS_DROITE_GRADUEE,
  genererSerieDroiteGraduee,
  planifierSerieDroiteGraduee,
} from "./serie.js";

const LONGUEURS = Object.freeze([1, 2, 5, 10, 15, 20]);
const FAMILLES = Object.freeze([
  FAMILLE_LIRE_ABSCISSE,
  FAMILLE_PLACER_POINT,
  FAMILLE_DETERMINER_PAS,
  FAMILLE_DIAGNOSTIC,
]);

function compter(plan, predicat) {
  return plan.filter(predicat).length;
}

function signatureVisible(question) {
  return JSON.stringify({ famille: question.classement.famille, enonce: question.enonce });
}

function verifierEspacementQuandPossible(plan) {
  for (const famille of FAMILLES) {
    const occurrences = compter(plan, (element) => element.famille === famille);
    if (occurrences <= plan.length - occurrences + 1) {
      assert.ok(plan.every((element, index) =>
        index === 0
        || element.famille !== famille
        || plan[index - 1].famille !== famille));
    }
  }
}

describe("GE-01/GE-02 — paquet pédagogique déterministe", () => {
  it("garantit à vingt les quotas, variantes et profils de référence", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const plan = planifierSerieDroiteGraduee({
        graine: `quotas-ge-${seed}`,
        nombreQuestions: 20,
      });
      assert.deepEqual(FAMILLES.map((famille) =>
        compter(plan, (element) => element.famille === famille)), [8, 8, 2, 2]);
      assert.equal(compter(plan, ({ variante }) => variante === VARIANTE_PAS_QCM), 1);
      assert.equal(compter(plan, ({ variante }) => variante === VARIANTE_DEUX_POINTS_QCM), 1);
      assert.equal(compter(plan, ({ notation }) => notation === "fraction"), 3);
      const pas = new Set(plan.map(({ pasNumerateur, pasDenominateur }) =>
        pasNumerateur / pasDenominateur));
      for (const valeur of [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50]) {
        assert.ok(pas.has(valeur), `pas ${valeur} absent`);
      }
      verifierEspacementQuandPossible(plan);
    }
  });

  it("rend toutes les familles et les variantes rares observables sur 1 ou 2 questions", () => {
    const familles = new Set();
    let pasQcm = 0;
    let deuxPoints = 0;
    let fractions = 0;
    let principales = 0;
    for (let seed = 0; seed < 8_000; seed += 1) {
      const plan = planifierSerieDroiteGraduee({
        graine: `petite-ge-${seed}`,
        nombreQuestions: seed % 2 + 1,
      });
      for (const element of plan) {
        familles.add(element.famille);
        principales += Number([
          FAMILLE_LIRE_ABSCISSE,
          FAMILLE_PLACER_POINT,
        ].includes(element.famille));
        pasQcm += Number(element.variante === VARIANTE_PAS_QCM);
        deuxPoints += Number(element.variante === VARIANTE_DEUX_POINTS_QCM);
        fractions += Number(element.notation === "fraction");
      }
    }
    assert.deepEqual(familles, new Set(FAMILLES));
    assert.ok(pasQcm > 0);
    assert.ok(deuxPoints > 0);
    assert.ok(fractions > 0);
    assert.ok(principales > 8_000);
  });

  it("reste déterministe, cohérent et sans préfixe de jalon", () => {
    for (let seed = 0; seed < 3_000; seed += 1) {
      const nombreQuestions = LONGUEURS[seed % LONGUEURS.length];
      const configuration = { graine: `audit-ge-${seed}`, nombreQuestions };
      const plan = planifierSerieDroiteGraduee(configuration);
      assert.deepEqual(planifierSerieDroiteGraduee(configuration), plan);
      assert.equal(plan.length, nombreQuestions);
      verifierEspacementQuandPossible(plan);
      assert.ok(plan.every((element) =>
        element.indiceCible >= 0
        && element.indiceCible <= element.nombreIntervalles
        && !element.etiquettes.includes(element.indiceCible)
        && element.etiquettes[1] - element.etiquettes[0] >= 2));
    }
  });

  it("déclare deux paquets de vingt jetons", () => {
    assert.equal(PAQUET_FAMILLES_DROITE_GRADUEE.tailleReference, 20);
    assert.equal(PAQUET_PROFILS_DROITE_GRADUEE.tailleReference, 20);
  });
});

describe("GE-01/GE-02 — génération", () => {
  it("produit des questions V2 sans doublon visible à toutes les allocations", () => {
    const registre = creerRegistreAutomatismes();
    for (const nombreQuestions of LONGUEURS) {
      for (let seed = 0; seed < 100; seed += 1) {
        const questions = genererSerieDroiteGraduee({
          registre,
          graine: `questions-ge-${nombreQuestions}-${seed}`,
          nombreQuestions,
        });
        assert.equal(questions.length, nombreQuestions);
        assert.equal(new Set(questions.map(signatureVisible)).size, nombreQuestions);
        assert.ok(questions.every((question) => validerQuestionInstanceV2(question).valide));
        for (const question of questions.filter(({ reponse }) => reponse.choix)) {
          const libelles = question.reponse.choix.map(({ libelle }) => libelle);
          assert.ok(libelles.length >= 4);
          assert.equal(new Set(libelles).size, libelles.length);
          assert.ok(question.reponse.attendus.every((attendu) =>
            question.reponse.choix.some(({ id }) => id === attendu)));
        }
      }
    }
  });
});
