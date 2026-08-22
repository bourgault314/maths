import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  diagnostiquerChoixQcmRepere,
  diagnostiquerCoordonneeSeule,
  diagnostiquerCoupleRepere,
} from "./diagnostic-reperage-plan.js";

describe("diagnostics du repérage dans le plan", () => {
  it("distingue inversion, signes, axe, graduation et autre erreur", () => {
    assert.equal(diagnostiquerCoupleRepere({ attendu: [-3, 2], recu: [2, -3] }).code, "E1");
    assert.equal(diagnostiquerCoupleRepere({ attendu: [-3, 2], recu: [3, 2] }).code, "E2");
    assert.equal(diagnostiquerCoupleRepere({ attendu: [-3, 2], recu: [-3, -2] }).code, "E3");
    assert.equal(diagnostiquerCoupleRepere({ attendu: [3, 0], recu: [0, 3] }).code, "E4");
    assert.equal(diagnostiquerCoupleRepere({ attendu: [-3, 2], recu: [-2, 2] }).code, "E5");
    assert.equal(diagnostiquerCoupleRepere({ attendu: [-3, 2], recu: [4, -1] }).code, "E6");
  });

  it("ne diagnostique pas une réponse correcte ou invalide", () => {
    assert.equal(diagnostiquerCoupleRepere({ attendu: [-3, 2], recu: [-3, 2] }), null);
    assert.equal(diagnostiquerCoupleRepere({ attendu: [-3, 2], recu: ["-3", 2] }), null);
  });

  it("diagnostique une coordonnée isolée", () => {
    assert.equal(diagnostiquerCoordonneeSeule({ axe: "abscisse", attendu: -3, recu: 3 }).code, "E2");
    assert.equal(diagnostiquerCoordonneeSeule({ axe: "ordonnee", attendu: -2, recu: 2 }).code, "E3");
    const axe = diagnostiquerCoordonneeSeule({ axe: "ordonnee", attendu: 0, recu: 3 });
    assert.equal(axe.code, "E4");
    assert.match(axe.message, /axe des abscisses : son ordonnée vaut 0/);
    assert.equal(diagnostiquerCoordonneeSeule({ axe: "abscisse", attendu: 3, recu: 2 }).code, "E5");
  });

  it("conserve le mécanisme explicite des distracteurs QCM", () => {
    assert.equal(diagnostiquerChoixQcmRepere("inversion", [-3, 2]).code, "E1");
    assert.equal(diagnostiquerChoixQcmRepere("signe-abscisse", [-3, 2]).code, "E2");
    assert.equal(diagnostiquerChoixQcmRepere("signe-ordonnee", [-3, 2]).code, "E3");
  });
});
