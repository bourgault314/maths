import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
  validerGabarit,
} from "./gabarit.js";

const exempleValide = () => ({
  schema: SCHEMA_GABARIT_QUESTION,
  id: "fixture.question-variable",
  version: 1,
  titre: "Fixture technique",
  generateur: { nom: "fixture.echo", version: 1 },
  parametres: { etiquette: "test" },
});

describe("validerGabarit", () => {
  it("accepte un gabarit complet", () => {
    assert.deepEqual(validerGabarit(exempleValide()), { valide: true, erreurs: [] });
  });

  it("accepte des paramètres vides", () => {
    const g = { ...exempleValide(), parametres: {} };
    assert.equal(validerGabarit(g).valide, true);
  });

  it("rejette les identifiants mal formés", () => {
    for (const id of ["", "Majuscule", "espace interdit", "accent-é", "double..point"]) {
      const g = { ...exempleValide(), id };
      assert.equal(validerGabarit(g).valide, false, `id accepté à tort : « ${id} »`);
    }
  });

  it("rejette un générateur absent ou mal décrit", () => {
    const sans = { ...exempleValide() };
    delete sans.generateur;
    assert.equal(validerGabarit(sans).valide, false);
    const mauvaiseVersion = {
      ...exempleValide(),
      generateur: { nom: "fixture.echo", version: 0 },
    };
    assert.equal(validerGabarit(mauvaiseVersion).valide, false);
  });

  it("rejette des paramètres contenant du code ou des objets spéciaux", () => {
    const avecFonction = { ...exempleValide(), parametres: { calcul: () => 1 } };
    assert.equal(validerGabarit(avecFonction).valide, false);
    const avecDate = { ...exempleValide(), parametres: { quand: new Date(0) } };
    assert.equal(validerGabarit(avecDate).valide, false);
  });
});

describe("estDonneePure", () => {
  it("accepte les données JSON simples", () => {
    assert.equal(
      estDonneePure({ a: 1, b: "x", c: [true, null, { d: 2.5 }] }),
      true,
    );
  });

  it("refuse fonctions, dates, infinis et prototypes trafiqués", () => {
    assert.equal(estDonneePure(() => 1), false);
    assert.equal(estDonneePure(new Date(0)), false);
    assert.equal(estDonneePure(Infinity), false);
    assert.equal(estDonneePure(Object.create({ piege: true })), false);
  });

  it("refuse cycles, tableaux creux, propriétés accessoires et symboles", () => {
    const cycle = {};
    cycle.soi = cycle;
    assert.equal(estDonneePure(cycle), false);
    assert.equal(estDonneePure([1, , 3]), false);
    assert.equal(estDonneePure({ get valeur() { return 1; } }), false);
    assert.equal(estDonneePure({ [Symbol("cache")]: 1 }), false);
  });

  it("accepte une même donnée référencée à plusieurs endroits sans cycle", () => {
    const partagee = { valeur: 1 };
    assert.equal(estDonneePure({ a: partagee, b: partagee }), true);
  });
});
