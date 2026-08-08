import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  diagnostiquerDecimalVersNumerateur,
  diagnostiquerFractionLibre,
  diagnostiquerFractionVersDecimal,
} from "./diagnostic-fractions-decimaux.js";

describe("diagnostics ciblés NC-03", () => {
  it("reconnaît uniquement les mécanismes témoins identifiables", () => {
    assert.equal(
      diagnostiquerFractionVersDecimal({
        numerateur: 3,
        denominateur: 2,
        saisie: "3,2",
      }).code,
      "E1",
    );
    assert.equal(
      diagnostiquerFractionVersDecimal({
        numerateur: 3,
        denominateur: 2,
        saisie: "0,5",
      }).code,
      "E2",
    );
    assert.equal(
      diagnostiquerFractionVersDecimal({
        numerateur: 21,
        denominateur: 10,
        saisie: "0,21",
      }).code,
      "E3",
    );
    assert.equal(
      diagnostiquerFractionVersDecimal({
        numerateur: 7,
        denominateur: 100,
        saisie: "0,7",
      }).code,
      "E4",
    );
    assert.equal(
      diagnostiquerFractionVersDecimal({
        numerateur: 7,
        denominateur: 1,
        saisie: "7,1",
      }).code,
      "E8",
    );
  });

  it("ne transforme ni une variante correcte ni une erreur quelconque en diagnostic", () => {
    for (const saisie of ["0.50", "0,500", ",5"]) {
      assert.equal(
        diagnostiquerFractionVersDecimal({
          numerateur: 1,
          denominateur: 2,
          saisie,
        }),
        null,
      );
    }
    assert.equal(
      diagnostiquerFractionVersDecimal({
        numerateur: 3,
        denominateur: 2,
        saisie: "9",
      }),
      null,
    );
    assert.equal(
      diagnostiquerFractionVersDecimal({
        numerateur: 51,
        denominateur: 100,
        saisie: "5,1",
      }),
      null,
    );
  });
});

describe("diagnostics ciblés NC-04", () => {
  it("distingue la copie des chiffres et l'inversion d'une fraction libre", () => {
    assert.equal(
      diagnostiquerDecimalVersNumerateur({
        numerateur: 3,
        denominateur: 4,
        valeur: 75,
      }).code,
      "E5",
    );
    assert.equal(
      diagnostiquerFractionLibre({
        numerateur: 3,
        denominateur: 2,
        numerateurSaisi: 2,
        denominateurSaisi: 3,
      }).code,
      "E6",
    );
  });

  it("ne diagnostique jamais une réponse correcte ni une erreur non spécifique", () => {
    assert.equal(
      diagnostiquerDecimalVersNumerateur({
        numerateur: 51,
        denominateur: 100,
        valeur: 51,
      }),
      null,
    );
    assert.equal(
      diagnostiquerDecimalVersNumerateur({
        numerateur: 3,
        denominateur: 4,
        valeur: 2,
      }),
      null,
    );
    assert.equal(
      diagnostiquerFractionLibre({
        numerateur: 3,
        denominateur: 2,
        numerateurSaisi: 30,
        denominateurSaisi: 20,
      }),
      null,
    );
  });
});
