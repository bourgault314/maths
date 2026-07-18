import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COULEURS,
  COULEURS_BARRES,
  COULEURS_POURCENTAGES,
  couleurFamillePourcentage,
  ESPACEMENTS,
  RAYONS,
  STATUT_CHARTE,
  TYPOGRAPHIE,
  VERSION_CHARTE,
  contraste,
} from "./charte.js";

describe("charte — intégrité des données", () => {
  it("toutes les couleurs sont des hexadécimaux valides", () => {
    for (const [role, valeur] of Object.entries({
      ...COULEURS,
      ...COULEURS_BARRES,
      ...COULEURS_POURCENTAGES,
    })) {
      assert.match(valeur, /^#[0-9a-f]{6}$/, `couleur invalide pour ${role} : ${valeur}`);
    }
  });

  it("chaque découpage de pourcentage a sa couleur de famille", () => {
    assert.equal(couleurFamillePourcentage(2), COULEURS_POURCENTAGES.c50);
    assert.equal(couleurFamillePourcentage(4), COULEURS_POURCENTAGES.c25);
    assert.equal(couleurFamillePourcentage(5), COULEURS_POURCENTAGES.c20);
    assert.equal(couleurFamillePourcentage(10), COULEURS_POURCENTAGES.c10);
    assert.equal(couleurFamillePourcentage(20), COULEURS_POURCENTAGES.c5);
    assert.equal(couleurFamillePourcentage(100), COULEURS_POURCENTAGES.c1);
    // Découpage inconnu : on retombe sur l'orange, comme l'exerciceur.
    assert.equal(couleurFamillePourcentage(7), COULEURS_POURCENTAGES.c10);
  });

  it("les crans d'espacement sont des multiples croissants de la base", () => {
    let precedent = 0;
    for (const cran of ESPACEMENTS.crans) {
      assert.equal(cran % ESPACEMENTS.base, 0, `cran ${cran} hors grille`);
      assert.ok(cran > precedent, "les crans doivent être strictement croissants");
      precedent = cran;
    }
  });

  it("chaque famille typographique déclare une police de secours", () => {
    for (const [role, pile] of Object.entries(TYPOGRAPHIE)) {
      assert.ok(pile.includes(","), `pas de police de secours pour ${role}`);
    }
  });

  it("les rayons sont positifs et croissants", () => {
    assert.ok(RAYONS.petit < RAYONS.moyen && RAYONS.moyen < RAYONS.grand);
  });

  it("version et statut cohérents", () => {
    assert.equal(VERSION_CHARTE, 1);
    assert.ok(["brouillon", "valide"].includes(STATUT_CHARTE));
  });
});

describe("charte — lisibilité (WCAG)", () => {
  it("le texte principal est lisible sur tous les fonds", () => {
    for (const fond of [COULEURS.page, COULEURS.papier, COULEURS.fondDoux]) {
      const rapport = contraste(COULEURS.encre, fond);
      assert.ok(rapport >= 4.5, `contraste encre/${fond} insuffisant : ${rapport.toFixed(2)}`);
    }
  });

  it("le texte atténué reste lisible sur fond de page", () => {
    assert.ok(contraste(COULEURS.texteAttenue, COULEURS.page) >= 4.5);
  });

  it("un texte blanc est lisible sur les couleurs d'action", () => {
    for (const role of ["bleu", "jetonPositif", "jetonNegatif", "erreur"]) {
      const rapport = contraste("#ffffff", COULEURS[role]);
      assert.ok(rapport >= 3, `blanc sur ${role} : ${rapport.toFixed(2)} (< 3)`);
    }
  });
});
