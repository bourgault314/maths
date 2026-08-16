import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import {
  COLONNES_TABLEAU_NUMERATION,
  DENOMINATEURS_DECIMAUX_PRIS_EN_CHARGE,
  DONNEES_DROITE_DEMIS,
  DONNEES_DROITE_QUARTS,
  DONNEES_DROITE_UNITES,
  VERSION_FRACTIONS_DECIMAUX,
  analyserEcritureDecimalePositive,
  construireDonneesTableauDepuisFraction,
  construireDonneesTableauNumeration,
  formaterFractionEnDecimal,
  fractionsEgales,
  normaliserEcritureDecimalePositive,
  obtenirDonneesDroiteFractionnaire,
  pgcd,
  reduireFraction,
} from "./fractions-decimaux.js";

describe("arithmétique rationnelle exacte", () => {
  it("calcule le pgcd avec zéro et sans dépendre du signe", () => {
    assert.equal(pgcd(54, 24), 6);
    assert.equal(pgcd(-54, 24), 6);
    assert.equal(pgcd(0, 7), 7);
    assert.equal(pgcd(0, 0), 0);
    assert.equal(pgcd(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
  });

  it("réduit les fractions et normalise leur signe", () => {
    assert.deepEqual(reduireFraction(15, 10), {
      numerateur: 3,
      denominateur: 2,
    });
    assert.deepEqual(reduireFraction(6, -8), {
      numerateur: -3,
      denominateur: 4,
    });
    assert.deepEqual(reduireFraction(-6, -8), {
      numerateur: 3,
      denominateur: 4,
    });
    assert.deepEqual(reduireFraction(0, -8), {
      numerateur: 0,
      denominateur: 1,
    });
  });

  it("compare les fractions par une égalité exacte", () => {
    for (const [numerateur, denominateur] of [
      [3, 2],
      [15, 10],
      [6, 4],
      [30, 20],
    ]) {
      assert.equal(fractionsEgales(3, 2, numerateur, denominateur), true);
    }
    assert.equal(fractionsEgales(3, 2, 2, 3), false);
    assert.equal(fractionsEgales(3, 2, 15, 100), false);

    const grand = Number.MAX_SAFE_INTEGER;
    assert.equal(fractionsEgales(grand, grand, 1, 1), true);
  });

  it("refuse les dénominateurs nuls et les valeurs non entières", () => {
    assert.throws(() => reduireFraction(3, 0), /zéro interdit/);
    assert.throws(() => fractionsEgales(1, 0, 1, 2), /zéro interdit/);
    assert.throws(() => pgcd(1.5, 2), /entier sûr/);
  });
});

describe("analyse d'une écriture décimale positive", () => {
  it("normalise point, virgule, espaces, zéro initial et zéros finaux", () => {
    const equivalentes = [
      "0,5",
      "0.5",
      " 0,500 ",
      "0 , 5 0 0",
      ",5",
      ".5",
      "00,5000",
    ];
    for (const saisie of equivalentes) {
      assert.equal(normaliserEcritureDecimalePositive(saisie), "0,5");
    }
    assert.equal(normaliserEcritureDecimalePositive("2,"), "2");
    assert.equal(normaliserEcritureDecimalePositive("2.000"), "2");
  });

  it("conserve les zéros intercalés et le rang décimal", () => {
    const centiemes = analyserEcritureDecimalePositive("0,0700");
    assert.deepEqual(centiemes, {
      normalisee: "0,07",
      partieEntiere: "0",
      partieDecimale: "07",
      nombreDecimales: 2,
      fractionDecimale: { numerateur: 7, denominateur: 100 },
      fractionReduite: { numerateur: 7, denominateur: 100 },
    });

    const milliemes = analyserEcritureDecimalePositive("1.005");
    assert.equal(milliemes.normalisee, "1,005");
    assert.deepEqual(milliemes.fractionDecimale, {
      numerateur: 1005,
      denominateur: 1000,
    });
    assert.deepEqual(milliemes.fractionReduite, {
      numerateur: 201,
      denominateur: 200,
    });
  });

  it("rejette signe, exponentielle, doubles séparateurs et précision excessive", () => {
    for (const saisie of [
      "",
      "-0,5",
      "+0,5",
      "−0,5",
      "1e-3",
      "1,2,3",
      "1.2.3",
      "1,2.3",
      ",",
      ".",
      "0,1234",
      "abc",
    ]) {
      assert.throws(
        () => analyserEcritureDecimalePositive(saisie),
        /vide|invalide|trois chiffres/,
        saisie,
      );
    }
    assert.throws(
      () => analyserEcritureDecimalePositive(0.5),
      /texte requis/,
    );
  });
});

describe("formatage exact des fractions finies", () => {
  it("couvre tous les dénominateurs du module sans calcul flottant", () => {
    assert.deepEqual(DENOMINATEURS_DECIMAUX_PRIS_EN_CHARGE, [
      1, 2, 4, 10, 100, 1000,
    ]);
    assert.equal(formaterFractionEnDecimal(7, 1), "7");
    assert.equal(formaterFractionEnDecimal(7, 2), "3,5");
    assert.equal(formaterFractionEnDecimal(5, 4), "1,25");
    assert.equal(formaterFractionEnDecimal(21, 10), "2,1");
    assert.equal(formaterFractionEnDecimal(7, 100), "0,07");
    assert.equal(formaterFractionEnDecimal(7, 1000), "0,007");
    assert.equal(formaterFractionEnDecimal(100, 100), "1");
    assert.equal(formaterFractionEnDecimal(0, 4), "0");
  });

  it("refuse les fractions hors du périmètre positif", () => {
    assert.throws(
      () => formaterFractionEnDecimal(1, 3),
      /dénominateur non pris en charge/,
    );
    assert.throws(
      () => formaterFractionEnDecimal(-1, 2),
      /fraction positive/,
    );
    assert.throws(() => formaterFractionEnDecimal(1, 0), /zéro interdit/);
  });
});

describe("données des droites des unités, des demis et des quarts", () => {
  it("couvre les unités de 0/1 à 12/1", () => {
    assert.equal(DONNEES_DROITE_UNITES.id, "unites");
    assert.equal(DONNEES_DROITE_UNITES.denominateur, 1);
    assert.equal(DONNEES_DROITE_UNITES.maximum, 12);
    assert.equal(DONNEES_DROITE_UNITES.pas, 1);
    assert.equal(DONNEES_DROITE_UNITES.graduations.length, 13);
    assert.deepEqual(DONNEES_DROITE_UNITES.graduations.at(-1), {
      numerateur: 12,
      denominateur: 1,
      valeur: 12,
      ecritureDecimale: "12",
    });
  });

  it("couvre les demis de 0/2 à 7/2", () => {
    assert.equal(DONNEES_DROITE_DEMIS.denominateur, 2);
    assert.equal(DONNEES_DROITE_DEMIS.maximum, 3.5);
    assert.equal(DONNEES_DROITE_DEMIS.pas, 0.5);
    assert.equal(DONNEES_DROITE_DEMIS.graduations.length, 8);
    assert.deepEqual(DONNEES_DROITE_DEMIS.graduations.at(-1), {
      numerateur: 7,
      denominateur: 2,
      valeur: 3.5,
      ecritureDecimale: "3,5",
    });
  });

  it("couvre les quarts de 0/4 à 12/4, y compris les écritures réductibles", () => {
    assert.equal(DONNEES_DROITE_QUARTS.denominateur, 4);
    assert.equal(DONNEES_DROITE_QUARTS.maximum, 3);
    assert.equal(DONNEES_DROITE_QUARTS.graduations.length, 13);
    assert.deepEqual(DONNEES_DROITE_QUARTS.graduations.at(-1), {
      numerateur: 12,
      denominateur: 4,
      valeur: 3,
      ecritureDecimale: "3",
    });
    assert.deepEqual(
      DONNEES_DROITE_QUARTS.graduations
        .filter(({ numerateur }) => numerateur > 0 && numerateur % 2 === 0)
        .map(({ numerateur, ecritureDecimale }) => ({
          numerateur,
          ecritureDecimale,
        })),
      [
        { numerateur: 2, ecritureDecimale: "0,5" },
        { numerateur: 4, ecritureDecimale: "1" },
        { numerateur: 6, ecritureDecimale: "1,5" },
        { numerateur: 8, ecritureDecimale: "2" },
        { numerateur: 10, ecritureDecimale: "2,5" },
        { numerateur: 12, ecritureDecimale: "3" },
      ],
    );
  });

  it("rend les constantes canoniques et refuse les autres dénominateurs", () => {
    assert.equal(obtenirDonneesDroiteFractionnaire(1), DONNEES_DROITE_UNITES);
    assert.equal(obtenirDonneesDroiteFractionnaire(2), DONNEES_DROITE_DEMIS);
    assert.equal(obtenirDonneesDroiteFractionnaire(4), DONNEES_DROITE_QUARTS);
    assert.throws(
      () => obtenirDonneesDroiteFractionnaire(10),
      /dénominateur 1, 2 ou 4/,
    );
  });
});

describe("tableau de numération jusque dans les millièmes", () => {
  it("déclare les quatre rangs dans l'ordre", () => {
    assert.deepEqual(
      COLONNES_TABLEAU_NUMERATION.map(
        ({ id, denominateur }) => [id, denominateur],
      ),
      [
        ["unites", 1],
        ["dixiemes", 10],
        ["centiemes", 100],
        ["milliemes", 1000],
      ],
    );
  });

  it("distingue zéro intercalé et cellule située après le dernier rang", () => {
    const donnees = construireDonneesTableauNumeration("0,07");
    assert.equal(donnees.dernierRang, "centiemes");
    assert.deepEqual(
      donnees.colonnes.map(({ chiffre }) => chiffre),
      ["0", "0", "7", null],
    );
    assert.deepEqual(donnees.fractionLue, {
      numerateur: 7,
      denominateur: 100,
    });
  });

  it("produit aussi le tableau exact depuis une fraction", () => {
    const donnees = construireDonneesTableauDepuisFraction(21, 10);
    assert.equal(donnees.ecritureDecimale, "2,1");
    assert.equal(donnees.dernierRang, "dixiemes");
    assert.deepEqual(
      donnees.colonnes.map(({ chiffre }) => chiffre),
      ["2", "1", null, null],
    );

    const milliemes = construireDonneesTableauDepuisFraction(3, 1000);
    assert.deepEqual(
      milliemes.colonnes.map(({ chiffre }) => chiffre),
      ["0", "0", "0", "3"],
    );
    assert.equal(milliemes.dernierRang, "milliemes");
  });
});

it("publie la brique dans le paquet @mathsgo/objets", async () => {
  assert.equal(VERSION_FRACTIONS_DECIMAUX, 4);
  const paquet = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(
    paquet.exports["./fractions-decimaux"],
    "./src/fractions-decimaux.js",
  );
});
