import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA_GABARIT_QUESTION,
  estDonneePure,
  validerGabarit,
} from "./gabarit.js";

const exempleValide = () => ({
  schema: SCHEMA_GABARIT_QUESTION,
  id: "fractions.simplifier-simple",
  version: 1,
  titre: "Simplifier une fraction",
  generateur: { nom: "fractions.simplifier", version: 1 },
  parametres: { niveau: "simple" },
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
      generateur: { nom: "fractions.simplifier", version: 0 },
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
});
