import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  choisirDisposition,
  DISPOSITION_ORDINATEUR,
  DISPOSITION_TELEPHONE,
  DISPOSITION_TNI,
} from "./disposition.js";

describe("dispositions du lecteur", () => {
  it("réserve le flux compact aux écrans de moins de 720 px", () => {
    assert.equal(choisirDisposition({ largeur: 375, mode: "interactif" }), DISPOSITION_TELEPHONE);
    assert.equal(choisirDisposition({ largeur: 719, mode: "diaporama" }), DISPOSITION_TELEPHONE);
  });

  it("utilise la composition ordinateur pour l'interactif large", () => {
    assert.equal(choisirDisposition({ largeur: 720, mode: "interactif" }), DISPOSITION_ORDINATEUR);
    assert.equal(choisirDisposition({ largeur: 1920, mode: "interactif" }), DISPOSITION_ORDINATEUR);
  });

  it("active la composition TNI pour le diaporama à partir de 900 px", () => {
    assert.equal(choisirDisposition({ largeur: 899, mode: "diaporama" }), DISPOSITION_ORDINATEUR);
    assert.equal(choisirDisposition({ largeur: 900, mode: "diaporama" }), DISPOSITION_TNI);
    assert.equal(choisirDisposition({ largeur: 1920, mode: "diaporama" }), DISPOSITION_TNI);
  });

  it("refuse une largeur ou un mode incohérent", () => {
    assert.throws(() => choisirDisposition({ largeur: 0, mode: "interactif" }), TypeError);
    assert.throws(() => choisirDisposition({ largeur: 1024, mode: "inconnu" }), RangeError);
  });
});
