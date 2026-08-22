import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DOMAINES_AUTOMATISMES } from "../../packages/automatismes/src/identifiants.js";
import {
  DOMAINES_MENU,
  LIBELLES_MODULES_MENU,
  domainesMenuPourNiveau,
  notionsVisiblesPourNiveau,
} from "./catalogue-menu.js";
import { NIVEAUX_PARCOURS } from "./niveaux-parcours.js";

describe("catalogue du menu Cycle 4 – DNB", () => {
  it("conserve les quatre domaines du Studio et couvre la taxonomie V2", () => {
    assert.deepEqual(
      DOMAINES_MENU.map(({ nom }) => nom),
      [
        "Nombres et calculs",
        "Espace et géométrie",
        "Données, statistiques et probabilités",
        "Pensée informatique",
      ],
    );
    assert.deepEqual(
      new Set(DOMAINES_MENU.flatMap(({ domainesInternes }) => domainesInternes)),
      new Set(Object.values(DOMAINES_AUTOMATISMES)),
    );
  });

  it("oblige chaque automatisme visible à déclarer ses niveaux", () => {
    const notions = DOMAINES_MENU.flatMap(({ notions }) => notions);
    assert.equal(new Set(notions).size, notions.length);
    assert.deepEqual(new Set(notions), new Set(Object.keys(LIBELLES_MODULES_MENU)));
    for (const notion of notions) {
      const niveaux = LIBELLES_MODULES_MENU[notion].niveaux;
      assert.ok(Array.isArray(niveaux) && niveaux.length > 0, notion);
      assert.ok(niveaux.every((niveau) => NIVEAUX_PARCOURS.includes(niveau)), notion);
      assert.ok(niveaux.includes("DNB"), notion);
    }
  });

  it("classe les huit modules actuels dans tout le cycle 4 et au DNB", () => {
    for (const niveau of NIVEAUX_PARCOURS) {
      assert.equal(notionsVisiblesPourNiveau(niveau).length, 8, niveau);
    }
    assert.equal(domainesMenuPourNiveau("5e").length, 4);
    assert.deepEqual(
      domainesMenuPourNiveau("5e").map(({ notions }) => notions.length),
      [5, 3, 0, 0],
    );
  });

  it("refuse un niveau improvisé", () => {
    assert.throws(() => notionsVisiblesPourNiveau("6e"), /niveau de menu inconnu/);
  });
});
