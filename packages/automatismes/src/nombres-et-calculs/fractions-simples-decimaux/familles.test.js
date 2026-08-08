import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validerGabarit } from "../../../../contrats/src/gabarit.js";
import {
  COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
  TYPE_REPONSE_ENTIER_NATUREL,
  TYPE_REPONSE_FRACTION_EQUIVALENTE,
  TYPE_REPONSE_NOMBRE_DECIMAL,
  validerQuestionInstanceV2,
} from "../../../../contrats/src/question-v2.js";
import { fractionsEgales } from "../../../../objets/src/fractions-decimaux.js";
import { creerRegistreAutomatismes } from "../../registre.js";
import {
  DENOMINATEURS_AUTORISES,
  MICRO_NOTION_NC03,
  MICRO_NOTION_NC04,
  NOTION_FRACTIONS_SIMPLES_DECIMAUX,
  NUMERATEURS_DEMIS,
  NUMERATEURS_QUARTS,
  estFractionDuDomaine,
} from "./commun.js";
import {
  GABARIT_DECIMAL_VERS_FRACTION,
} from "./decimal-vers-fraction.js";
import {
  GABARIT_FRACTION_VERS_DECIMAL,
} from "./fraction-vers-decimal.js";

const registre = creerRegistreAutomatismes();

function instancier(gabarit, parametres, graine = "fractions-test") {
  return registre.instancier(
    { ...gabarit, parametres: { ...parametres } },
    graine,
  );
}

function bloc(question, id) {
  return question.enonce.find((element) => element.id === id);
}

function verifierClassement(question, microNotion) {
  assert.equal(question.classement.notion, NOTION_FRACTIONS_SIMPLES_DECIMAUX);
  assert.equal(question.classement.microNotion, microNotion);
  assert.equal(question.classement.domaine, "nombres-et-calculs");
  assert.equal(question.classement.cible, "dnb-2026-01");
}

describe("NC-03/NC-04 — contrats communs", () => {
  it("publie deux gabarits purs et des instances V2 conformes", () => {
    for (const [gabarit, parametres] of [
      [GABARIT_FRACTION_VERS_DECIMAL, { numerateur: 7, denominateur: 2 }],
      [GABARIT_DECIMAL_VERS_FRACTION, {
        numerateur: 7,
        denominateur: 2,
        forme: "denominateur-impose",
      }],
      [GABARIT_DECIMAL_VERS_FRACTION, {
        numerateur: 3,
        denominateur: 2,
        forme: "fraction-libre",
      }],
    ]) {
      assert.deepEqual(validerGabarit(gabarit), { valide: true, erreurs: [] });
      assert.deepEqual(
        validerQuestionInstanceV2(instancier(gabarit, parametres)),
        { valide: true, erreurs: [] },
      );
    }
  });

  it("conserve une notion visible commune et deux micro-notions stables", () => {
    const directe = instancier(
      GABARIT_FRACTION_VERS_DECIMAL,
      { numerateur: 3, denominateur: 2 },
    );
    const inverse = instancier(
      GABARIT_DECIMAL_VERS_FRACTION,
      { numerateur: 3, denominateur: 2, forme: "denominateur-impose" },
    );
    verifierClassement(directe, MICRO_NOTION_NC03);
    verifierClassement(inverse, MICRO_NOTION_NC04);
  });

  it("déclare strictement les six dénominateurs du périmètre", () => {
    assert.deepEqual(DENOMINATEURS_AUTORISES, [1, 2, 4, 10, 100, 1000]);
    assert.deepEqual(NUMERATEURS_DEMIS, [1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(NUMERATEURS_QUARTS, [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal(estFractionDuDomaine(5, 8), false);
    assert.equal(estFractionDuDomaine(1, 3), false);
    assert.equal(estFractionDuDomaine(10, 1000), false);
    assert.equal(estFractionDuDomaine(11, 1000), true);
  });
});

describe("NC-03 — fraction vers écriture décimale", () => {
  it("couvre tous les demis 1 à 7 et tous les quarts 1 à 8", () => {
    for (const [denominateur, numerateurs] of [
      [2, NUMERATEURS_DEMIS],
      [4, NUMERATEURS_QUARTS],
    ]) {
      for (const numerateur of numerateurs) {
        const question = instancier(
          GABARIT_FRACTION_VERS_DECIMAL,
          { numerateur, denominateur },
          `nc03-${numerateur}-${denominateur}`,
        );
        assert.deepEqual(bloc(question, "fraction"), {
          id: "fraction",
          type: "rationnel",
          numerateur,
          denominateur,
          ecriture: "fraction",
        });
        assert.deepEqual(question.reponse, {
          type: TYPE_REPONSE_NOMBRE_DECIMAL,
          comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
          attendu: { numerateur, denominateur },
        });
      }
    }
  });

  it("couvre aussi entier, dixième, centième et millième sans aplatir le rationnel", () => {
    for (const [numerateur, denominateur] of [
      [7, 1],
      [21, 10],
      [7, 100],
      [7, 1000],
    ]) {
      const question = instancier(
        GABARIT_FRACTION_VERS_DECIMAL,
        { numerateur, denominateur },
        `nc03-rang-${denominateur}`,
      );
      assert.deepEqual(question.reponse.attendu, { numerateur, denominateur });
      assert.equal(bloc(question, "fraction").type, "rationnel");
    }
  });

  it("refuse les couples hors domaine, notamment 5/8", () => {
    for (const parametres of [
      { numerateur: 5, denominateur: 8 },
      { numerateur: 8, denominateur: 2 },
      { numerateur: 9, denominateur: 4 },
      { numerateur: 10, denominateur: 1000 },
    ]) {
      assert.throws(
        () => instancier(GABARIT_FRACTION_VERS_DECIMAL, parametres),
        /invalide|incompatible/,
      );
    }
  });

  it("complète sans échec un seul paramètre numérique imposé", () => {
    for (let index = 0; index < 50; index += 1) {
      const avecNumerateur = instancier(
        GABARIT_FRACTION_VERS_DECIMAL,
        { numerateur: 49 },
        `nc03-numerateur-seul-${index}`,
      );
      assert.equal(bloc(avecNumerateur, "fraction").numerateur, 49);

      const avecDenominateur = instancier(
        GABARIT_FRACTION_VERS_DECIMAL,
        { denominateur: 4 },
        `nc03-denominateur-seul-${index}`,
      );
      assert.equal(bloc(avecDenominateur, "fraction").denominateur, 4);
    }
  });
});

describe("NC-04 — écriture décimale vers fraction", () => {
  it("garde le dénominateur imposé dans l'énoncé et le numérateur seul en réponse", () => {
    const question = instancier(
      GABARIT_DECIMAL_VERS_FRACTION,
      { numerateur: 103, denominateur: 100, forme: "denominateur-impose" },
    );
    assert.deepEqual(bloc(question, "nombre-decimal"), {
      id: "nombre-decimal",
      type: "rationnel",
      numerateur: 103,
      denominateur: 100,
      ecriture: "decimal",
    });
    assert.deepEqual(bloc(question, "denominateur-impose"), {
      id: "denominateur-impose",
      type: "entier",
      valeur: 100,
    });
    assert.deepEqual(question.reponse, {
      type: TYPE_REPONSE_ENTIER_NATUREL,
      comparaison: "valeur-exacte",
      attendu: 103,
      minimum: 0,
      maximum: 999,
    });
  });

  it("couvre tous les demis et quarts dans le sens inverse", () => {
    for (const [denominateur, numerateurs] of [
      [2, NUMERATEURS_DEMIS],
      [4, NUMERATEURS_QUARTS],
    ]) {
      for (const numerateur of numerateurs) {
        const question = instancier(
          GABARIT_DECIMAL_VERS_FRACTION,
          { numerateur, denominateur, forme: "denominateur-impose" },
          `nc04-${numerateur}-${denominateur}`,
        );
        assert.equal(question.reponse.attendu, numerateur);
        assert.equal(bloc(question, "denominateur-impose").valeur, denominateur);
      }
    }
  });

  it("accepte toute fraction équivalente pour la production libre", () => {
    const question = instancier(
      GABARIT_DECIMAL_VERS_FRACTION,
      { numerateur: 3, denominateur: 2, forme: "fraction-libre" },
    );
    assert.equal(bloc(question, "denominateur-impose"), undefined);
    assert.deepEqual(question.reponse, {
      type: TYPE_REPONSE_FRACTION_EQUIVALENTE,
      comparaison: COMPARAISON_VALEUR_RATIONNELLE_EXACTE,
      attendu: { numerateur: 3, denominateur: 2 },
    });
    for (const [numerateur, denominateur] of [
      [3, 2],
      [15, 10],
      [6, 4],
      [30, 20],
    ]) {
      assert.equal(fractionsEgales(3, 2, numerateur, denominateur), true);
    }
  });

  it("complète de manière compatible les paramètres partiels de chaque forme", () => {
    for (let index = 0; index < 50; index += 1) {
      const imposee = instancier(
        GABARIT_DECIMAL_VERS_FRACTION,
        { numerateur: 103, forme: "denominateur-impose" },
        `nc04-numerateur-seul-${index}`,
      );
      assert.equal(bloc(imposee, "nombre-decimal").numerateur, 103);

      const libre = instancier(
        GABARIT_DECIMAL_VERS_FRACTION,
        { numerateur: 7, forme: "fraction-libre" },
        `nc04-libre-partielle-${index}`,
      );
      assert.equal(bloc(libre, "nombre-decimal").numerateur, 7);
      assert.ok([2, 4].includes(bloc(libre, "nombre-decimal").denominateur));
    }
  });

  it("rejoue les questions à l'identique", () => {
    const a = instancier(GABARIT_DECIMAL_VERS_FRACTION, {}, "meme-graine");
    const encoreA = instancier(GABARIT_DECIMAL_VERS_FRACTION, {}, "meme-graine");
    const b = instancier(GABARIT_DECIMAL_VERS_FRACTION, {}, "autre-graine");
    assert.deepEqual(a, encoreA);
    assert.notDeepEqual(a, b);
  });
});
