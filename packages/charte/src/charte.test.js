import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COULEURS,
  COULEURS_BARRES,
  COULEURS_BANDES_FRACTIONS,
  COULEURS_NUMERATION_DECIMALE,
  COULEURS_RANGS_NUMERATION_DECIMALE,
  COULEURS_POURCENTAGES,
  COULEURS_PYTHAGORE,
  couleurFamillePourcentage,
  couleurBandeFraction,
  ESPACEMENTS,
  RAYONS,
  STATUT_CHARTE,
  TYPOGRAPHIE,
  VERSION_CHARTE,
  contraste,
} from "./charte.js";

// La palette de Pythagore telle qu'elle était dans le composant du studio
// avant son déménagement ici. Ce relevé est volontairement écrit en toutes
// lettres : c'est lui qui garantit qu'un déplacement de fichier n'a jamais
// changé une teinte à l'écran.
const PALETTE_PYTHAGORE_ATTENDUE = {
  hypFill: "#e2f5e8",
  hypStroke: "#24994d",
  hypText: "#187a3c",
  leg1Fill: "#dceeff",
  leg1Stroke: "#0879d0",
  leg1Text: "#0879d0",
  leg2Fill: "#fff0d8",
  leg2Stroke: "#e89516",
  leg2Text: "#b76e00",
  outline: "#172033",
  blue: "#169de8",
  green: "#13ad13",
  gray: "#969696",
  magenta: "#d90072",
  yellow: "#ffd071",
};

describe("charte — intégrité des données", () => {
  it("toutes les couleurs sont des hexadécimaux valides", () => {
    for (const [role, valeur] of Object.entries({
      ...COULEURS,
      ...COULEURS_BARRES,
      ...COULEURS_BANDES_FRACTIONS,
      ...COULEURS_NUMERATION_DECIMALE,
      ...COULEURS_POURCENTAGES,
      ...COULEURS_PYTHAGORE,
    })) {
      assert.match(valeur, /^#[0-9a-f]{6}$/, `couleur invalide pour ${role} : ${valeur}`);
    }
    for (const [rang, palette] of Object.entries(COULEURS_RANGS_NUMERATION_DECIMALE)) {
      for (const [role, valeur] of Object.entries(palette)) {
        assert.match(
          valeur,
          /^#[0-9a-f]{6}$/,
          `couleur invalide pour ${rang}.${role} : ${valeur}`,
        );
      }
    }
  });

  it("la palette de Pythagore est celle du composant d'origine, au hexadécimal près", () => {
    assert.deepEqual({ ...COULEURS_PYTHAGORE }, PALETTE_PYTHAGORE_ATTENDUE);
  });

  it("la palette de Pythagore reste gelée", () => {
    assert.ok(Object.isFrozen(COULEURS_PYTHAGORE));
  });

  it("les palettes des matériels historiques restent gelées et exactes", () => {
    assert.ok(Object.isFrozen(COULEURS_BANDES_FRACTIONS));
    assert.ok(Object.isFrozen(COULEURS_NUMERATION_DECIMALE));
    assert.equal(COULEURS_BANDES_FRACTIONS.d2, "#facc15");
    assert.equal(COULEURS_BANDES_FRACTIONS.d4, "#84cc16");
    assert.equal(COULEURS_BANDES_FRACTIONS.trait, "#000000");
    assert.equal(COULEURS_NUMERATION_DECIMALE.unite, "#ef4444");
    assert.equal(COULEURS_NUMERATION_DECIMALE.dixieme, "#22c55e");
    assert.equal(COULEURS_NUMERATION_DECIMALE.centieme, "#facc15");
    assert.equal(COULEURS_NUMERATION_DECIMALE.millieme, "#7c3aed");
    assert.ok(Object.isFrozen(COULEURS_RANGS_NUMERATION_DECIMALE));
    for (const [rang, palette] of Object.entries(COULEURS_RANGS_NUMERATION_DECIMALE)) {
      assert.ok(Object.isFrozen(palette), `palette ${rang} non gelée`);
    }
  });

  it("garde les textes de rang lisibles jusque sur les fonds de verdict", () => {
    for (const rang of ["dixiemes", "centiemes"]) {
      for (const fond of ["#d9f3f1", "#fdeaea", "#e7f7ee"]) {
        assert.ok(
          contraste(COULEURS_RANGS_NUMERATION_DECIMALE[rang].texte, fond) >= 4.5,
          `${rang} doit rester lisible sur ${fond}`,
        );
      }
    }
  });

  it("retrouve la couleur historique d'un dénominateur", () => {
    assert.equal(couleurBandeFraction(2), COULEURS_BANDES_FRACTIONS.d2);
    assert.equal(couleurBandeFraction(4), COULEURS_BANDES_FRACTIONS.d4);
    assert.equal(couleurBandeFraction(7), null);
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

  it("emploie une pile mathématique à chiffres alignés sur Safari/iOS", () => {
    assert.match(TYPOGRAPHIE.mathematiques, /^'Times New Roman',/);
    assert.doesNotMatch(TYPOGRAPHIE.mathematiques, /Georgia/i);
  });

  it("les rayons sont positifs et croissants", () => {
    assert.ok(RAYONS.petit < RAYONS.moyen && RAYONS.moyen < RAYONS.grand);
  });

  it("version et statut cohérents", () => {
    assert.equal(VERSION_CHARTE, 4);
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

  it("les rangs décimaux gardent un texte AA sur leurs fonds", () => {
    for (const [rang, palette] of Object.entries(COULEURS_RANGS_NUMERATION_DECIMALE)) {
      assert.ok(
        contraste(palette.texte, "#ffffff") >= 4.5,
        `texte ${rang} insuffisant sur blanc`,
      );
      assert.ok(
        contraste(palette.texte, palette.fond) >= 4.5,
        `texte ${rang} insuffisant sur son fond`,
      );
      assert.ok(
        contraste(palette.encreEntete, palette.principale) >= 4.5,
        `entête ${rang} insuffisante`,
      );
      assert.ok(
        contraste(palette.textePedagogique, "#ffffff") >= 4.5,
        `texte pédagogique ${rang} insuffisant sur blanc`,
      );
      assert.ok(
        contraste(palette.textePedagogique, palette.fond) >= 3,
        `grand texte pédagogique ${rang} insuffisant sur son fond`,
      );
    }
  });
});
