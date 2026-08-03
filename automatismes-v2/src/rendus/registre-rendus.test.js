import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import {
  RENDU_DIVISIBILITE,
  RENDU_SOLIDE,
  RENDU_VOLUME,
} from "../registre-lecteur.js";
import {
  listerTypesRendus,
  obtenirRenduLecteur,
} from "./registre-rendus.js";

describe("registre des rendus du lecteur", () => {
  it("déclare chaque famille visible une seule fois", () => {
    assert.deepEqual(
      new Set(listerTypesRendus()),
      new Set([RENDU_DIVISIBILITE, RENDU_SOLIDE, RENDU_VOLUME]),
    );
    for (const type of listerTypesRendus()) {
      const rendu = obtenirRenduLecteur(type);
      assert.equal(typeof rendu.question, "function");
      assert.equal(typeof rendu.aide, "function");
      assert.equal(typeof rendu.correction, "function");
    }
  });

  it("refuse un type absent au lieu de choisir un rendu par défaut", () => {
    assert.throws(() => obtenirRenduLecteur("inconnu"), /rendu absent/);
  });

  it("garde app.js indépendant des détails des notions", async () => {
    const source = await readFile(new URL("../../app.js", import.meta.url), "utf8");
    for (const detail of [
      "dessinerSolide",
      "COURS_SOLIDES_USUELS",
      "rendreAideDivisibilite",
      "rendreCorrectionVolumes",
      "rendreQuestionSolides",
    ]) {
      assert.doesNotMatch(source, new RegExp(detail));
    }
    assert.match(source, /obtenirRenduLecteur/);
  });
});
