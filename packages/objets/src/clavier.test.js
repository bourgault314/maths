import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACTION_TOUCHE_EFFACER,
  ACTION_TOUCHE_VALIDER,
  DISPOSITIONS,
  DISPOSITIONS_CLAVIER,
  obtenirDispositionClavier,
} from "./clavier.js";

describe("clavier maths&go — profils contextuels", () => {
  it("n'affiche dans NC-01 que les chiffres, Effacer et Valider", () => {
    const disposition = obtenirDispositionClavier("entier-naturel");
    assert.equal(disposition.colonnes, 3);
    assert.equal(disposition.touches.length, 12);
    assert.deepEqual(
      disposition.touches.slice(-3).map(({ action, libelle }) => ({ action, libelle })),
      [
        { action: ACTION_TOUCHE_EFFACER, libelle: "Effacer" },
        { action: "saisir", libelle: "0" },
        { action: ACTION_TOUCHE_VALIDER, libelle: "Valider" },
      ],
    );
    const libelles = disposition.touches.map(({ libelle }) => libelle);
    assert.ok(!libelles.includes(","));
    assert.ok(!libelles.includes("−"));
  });

  it("prévoit la virgule et le signe moins sans les imposer aux entiers", () => {
    const decimales = DISPOSITIONS_CLAVIER["nombre-decimal"].touches
      .map(({ libelle }) => libelle);
    const calcul = DISPOSITIONS_CLAVIER.calcul.touches.map(({ libelle }) => libelle);
    assert.ok(decimales.includes(","));
    assert.ok(decimales.includes("−"));
    assert.ok(calcul.includes(","));
    assert.ok(calcul.includes("−"));
  });

  it("fournit au module fractions un pavé décimal positif compact", () => {
    const disposition = obtenirDispositionClavier("decimal-positif");
    const libelles = disposition.touches.map(({ libelle }) => libelle);
    assert.equal(disposition.colonnes, 4);
    assert.ok(libelles.includes(","));
    assert.ok(libelles.includes("Effacer"));
    assert.ok(libelles.includes("Valider"));
    assert.ok(!libelles.includes("−"));
    assert.equal(disposition.touches.at(-1).classe, "touche-zero-large");
  });

  it("conserve l'ancien alias nombres et refuse les profils inconnus", () => {
    assert.equal(
      obtenirDispositionClavier("nombres"),
      obtenirDispositionClavier("entier-naturel"),
    );
    assert.deepEqual(
      DISPOSITIONS.nombres,
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"],
    );
    assert.throws(() => obtenirDispositionClavier("fraction"), /disposition inconnue/);
  });
});
