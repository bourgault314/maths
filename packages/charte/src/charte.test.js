import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COULEURS,
  ESPACEMENTS,
  RAYONS,
  STATUT_CHARTE,
  TYPOGRAPHIE,
  VERSION_CHARTE,
  contraste,
} from "./charte.js";

describe("charte — intégrité des données", () => {
  it("toutes les couleurs sont des hexadécimaux valides", () => {
    for (const [role, valeur] of Object.entries(COULEURS)) {
      assert.match(valeur, /^#[0-9a-f]{6}$/, `couleur invalide pour ${role} : ${valeur}`);
    }
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
