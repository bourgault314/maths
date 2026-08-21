import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DOMAINES_AUTOMATISMES,
  IDENTITES_AUTOMATISMES,
  MICRO_NOTIONS_AUTOMATISMES,
  MODULES_AUTOMATISMES,
  creerClassementAutomatisme,
  normaliserIdentifiantMicroNotion,
  normaliserIdentifiantModule,
} from "./identifiants.js";

describe("identifiants canoniques d'Automatismes V2", () => {
  it("fixe sept domaines et onze micro-notions descriptives distinctes", () => {
    assert.deepEqual(Object.values(DOMAINES_AUTOMATISMES), [
      "nombres-et-calculs",
      "calcul-litteral-et-algebre",
      "proportionnalite-et-fonctions",
      "grandeurs-et-mesures",
      "espace-et-geometrie",
      "donnees-statistiques-et-probabilites",
      "pensee-informatique",
    ]);
    assert.equal(
      new Set(Object.values(MICRO_NOTIONS_AUTOMATISMES)).size,
      Object.values(MICRO_NOTIONS_AUTOMATISMES).length,
    );
    assert.equal(Object.values(IDENTITES_AUTOMATISMES).length, 11);
    assert.ok(Object.values(IDENTITES_AUTOMATISMES).every(Object.isFrozen));
  });

  it("conserve seulement l'ancien slug des carres comme alias de module", () => {
    assert.equal(
      normaliserIdentifiantModule("carres-entiers-1-a-12"),
      MODULES_AUTOMATISMES.CARRES_ENTIERS,
    );
    assert.equal(
      normaliserIdentifiantModule(MODULES_AUTOMATISMES.CARRES_ENTIERS),
      MODULES_AUTOMATISMES.CARRES_ENTIERS,
    );
    assert.equal(normaliserIdentifiantModule("inconnu"), "inconnu");
  });

  it("normalise les deux anciens identifiants de micro-notion", () => {
    assert.equal(
      normaliserIdentifiantMicroNotion("nc-03"),
      MICRO_NOTIONS_AUTOMATISMES.FRACTION_VERS_DECIMAL,
    );
    assert.equal(
      normaliserIdentifiantMicroNotion("nc-04"),
      MICRO_NOTIONS_AUTOMATISMES.DECIMAL_VERS_FRACTION,
    );
    assert.equal(
      normaliserIdentifiantMicroNotion("criteres-divisibilite"),
      MICRO_NOTIONS_AUTOMATISMES.CRITERES_DIVISIBILITE,
    );
    assert.equal(normaliserIdentifiantMicroNotion("inconnu"), "inconnu");
  });

  it("conserve les anciens codes PG des volumes comme metadonnees", () => {
    assert.deepEqual(
      [
        IDENTITES_AUTOMATISMES.VOLUME_CUBE_PAVE,
        IDENTITES_AUTOMATISMES.VOLUME_PRISME_DROIT,
        IDENTITES_AUTOMATISMES.VOLUME_CYLINDRE,
      ].map(({ codePilotage, anciensCodes }) => ({
        codePilotage,
        anciensCodes,
      })),
      [
        { codePilotage: "GM-13", anciensCodes: ["PG-22"] },
        { codePilotage: "GM-14", anciensCodes: ["PG-23"] },
        { codePilotage: "GM-15", anciensCodes: ["PG-24"] },
      ],
    );
  });

  it("produit un classement canonique sans code de pilotage ni alias", () => {
    const classement = creerClassementAutomatisme(
      IDENTITES_AUTOMATISMES.FRACTION_VERS_DECIMAL,
      "fraction-vers-decimal-demis",
      ["presentation-double-droite"],
    );
    assert.deepEqual(classement, {
      domaine: "nombres-et-calculs",
      notion: "fractions-simples-decimaux",
      microNotion: "fraction-vers-decimal",
      famille: "fraction-vers-decimal-demis",
      cible: "dnb-2026-01",
      complements: ["presentation-double-droite"],
    });
    assert.equal("codePilotage" in classement, false);
    assert.equal("anciensCodes" in classement, false);
    assert.equal("aliasesMicroNotion" in classement, false);
  });

  it("refuse les identites, familles et complements libres", () => {
    assert.throws(
      () => creerClassementAutomatisme({}, "famille"),
      /identite canonique/,
    );
    assert.throws(
      () => creerClassementAutomatisme(
        IDENTITES_AUTOMATISMES.CRITERES_DIVISIBILITE,
        "F1",
      ),
      /famille/,
    );
    assert.throws(
      () => creerClassementAutomatisme(
        IDENTITES_AUTOMATISMES.CRITERES_DIVISIBILITE,
        "critere-precis",
        ["meme", "meme"],
      ),
      /complements/,
    );
  });
});
