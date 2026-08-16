import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  COULEURS_BANDES_FRACTIONS,
  COULEURS_NUMERATION_DECIMALE,
  COULEURS_RANGS_NUMERATION_DECIMALE,
} from "../../charte/src/charte.js";
import {
  ETAPES_DEMI_DIXIEMES,
  ETAPES_REORGANISATION_CENTIEMES,
  VERSION_CORRESPONDANCES_DECIMALES,
  dessinerDemiAvecDixiemes,
  dessinerReorganisationCentiemes,
} from "./correspondances-decimales.js";
import { PROVENANCE_OBJETS } from "./provenance.js";

function compter(texte, motif) {
  return (texte.match(motif) ?? []).length;
}

function disposition(rendu, nom) {
  return rendu.donnees.dispositions.find(({ disposition: id }) => id === nom);
}

describe("réorganisation des centièmes", () => {
  it("expose une API versionnée et trois états déterministes", () => {
    assert.equal(VERSION_CORRESPONDANCES_DECIMALES, 6);
    assert.deepEqual(ETAPES_REORGANISATION_CENTIEMES, [
      "lignes",
      "quadrants",
      "comparaison",
    ]);
    assert.deepEqual(ETAPES_DEMI_DIXIEMES, [
      "dixiemes",
      "demi",
      "comparaison",
    ]);
    assert.ok(Object.isFrozen(ETAPES_REORGANISATION_CENTIEMES));
    assert.ok(Object.isFrozen(ETAPES_DEMI_DIXIEMES));
  });

  for (const centiemes of [25, 75]) {
    it(`conserve exactement les mêmes ${centiemes} cellules dans la comparaison`, () => {
      const options = { centiemes, etape: "comparaison", largeur: 320 };
      const rendu = dessinerReorganisationCentiemes(options);
      assert.equal(rendu.erreur, null);
      assert.equal(rendu.svg, dessinerReorganisationCentiemes(options).svg);
      assert.equal(compter(rendu.svg, /class="cd-cellule-centieme/g), 200);
      assert.equal(compter(rendu.svg, /cd-cellule-coloriee/g), 2 * centiemes);
      assert.equal(disposition(rendu, "lignes").indicesColories.length, centiemes);
      assert.equal(disposition(rendu, "quadrants").indicesColories.length, centiemes);
      assert.equal(rendu.donnees.quadrantsComplets, centiemes / 25);
      assert.match(rendu.svg, /class="cd-fleche-reorganisation"/);
      assert.match(rendu.svg, /data-etape="comparaison"/);
      assert.match(rendu.texteAlternatif, /sans changer la quantité/);
      assert.ok(Object.isFrozen(rendu));
      assert.ok(Object.isFrozen(rendu.donnees));
    });
  }

  it("range d'abord 25 cellules par lignes puis forme le quadrant 5 × 5 supérieur gauche", () => {
    const lignes = dessinerReorganisationCentiemes({
      centiemes: 25,
      etape: "lignes",
    });
    const quadrants = dessinerReorganisationCentiemes({
      centiemes: 25,
      etape: "quadrants",
    });
    assert.deepEqual(disposition(lignes, "lignes").indicesColories, [
      ...Array.from({ length: 25 }, (_, index) => index),
    ]);
    const indices = new Set(disposition(quadrants, "quadrants").indicesColories);
    for (const index of [0, 4, 10, 14, 40, 44]) assert.ok(indices.has(index));
    for (const index of [5, 9, 45, 50, 55]) assert.ok(!indices.has(index));
    assert.match(quadrants.svg, />25\/100 = 1\/4<\/text>/);
  });

  it("forme exactement trois quadrants de 25 cellules pour 75 centièmes", () => {
    const rendu = dessinerReorganisationCentiemes({
      centiemes: 75,
      etape: "quadrants",
      largeur: 320,
    });
    const indices = new Set(disposition(rendu, "quadrants").indicesColories);
    for (const index of [0, 44, 5, 49, 50, 94]) assert.ok(indices.has(index));
    for (const index of [55, 59, 95, 99]) assert.ok(!indices.has(index));
    assert.equal(compter(rendu.svg, /class="cd-etiquette-quadrant"/g), 0);
    assert.doesNotMatch(rendu.svg, />[123]<\/text>/);
    assert.match(rendu.svg, />75\/100 = 3\/4<\/text>/);
  });

  it("masque les écritures sans appauvrir l'alternative accessible", () => {
    const rendu = dessinerReorganisationCentiemes({
      centiemes: 25,
      etape: "comparaison",
      largeur: 320,
      afficherEcritures: false,
    });
    assert.doesNotMatch(rendu.svg, /25\/100|1\/4|0,25/);
    assert.doesNotMatch(rendu.texteAlternatif, /25|1\/4|0,25/);
    assert.match(rendu.texteAlternatif, /même collection/);
    assert.match(rendu.texteAlternatif, /écritures sont masquées/);
    assert.equal(rendu.donnees.afficherEcritures, false);
  });

  it("peut nommer les deux dispositions sans répéter l’équation de synthèse", () => {
    const rendu = dessinerReorganisationCentiemes({
      centiemes: 75,
      etape: "comparaison",
      largeur: 320,
      afficherEcritures: true,
      afficherEquation: false,
    });
    assert.match(rendu.svg, />75 centièmes en lignes<\/text>/);
    assert.match(rendu.svg, />3 quarts de l’unité<\/text>/);
    assert.equal(compter(rendu.svg, /class="cd-etiquette-quadrant"/g), 0);
    assert.doesNotMatch(rendu.svg, /class="cd-ecriture-correspondance"/);
    assert.equal(rendu.donnees.afficherEcritures, true);
    assert.equal(rendu.donnees.afficherEquation, false);
    assert.match(rendu.svg, /data-afficher-equation="false"/);
    assert.doesNotMatch(rendu.texteAlternatif, /75\/100|3\/4|0,75/);
  });

  it("abrège les deux titres sans les rendre minuscules sur téléphone", () => {
    const rendu = dessinerReorganisationCentiemes({
      centiemes: 75,
      etape: "comparaison",
      largeur: 240,
      afficherEcritures: true,
      afficherEquation: false,
    });
    assert.match(rendu.svg, />75 centièmes<\/text>/);
    assert.match(rendu.svg, />3 quarts<\/text>/);
    assert.doesNotMatch(rendu.svg, />75 centièmes en lignes<\/text>/);
    assert.doesNotMatch(rendu.svg, />3 quarts de l’unité<\/text>/);
    assert.equal(
      compter(rendu.svg, /class="cd-titre-disposition"[^>]*font-size="11"/g),
      2,
    );
    assert.equal(compter(rendu.svg, /class="cd-etiquette-quadrant"/g), 0);
  });

  it("retire l’étiquette intérieure redondante d’un quart en format compact", () => {
    const mobile = dessinerReorganisationCentiemes({
      centiemes: 25,
      etape: "comparaison",
      largeur: 240,
      afficherEcritures: true,
      afficherEquation: false,
    });
    const large = dessinerReorganisationCentiemes({
      centiemes: 25,
      etape: "comparaison",
      largeur: 560,
      afficherEcritures: true,
      afficherEquation: false,
    });
    assert.match(mobile.svg, />1 quart<\/text>/);
    assert.equal(compter(mobile.svg, /class="cd-etiquette-quadrant"/g), 0);
    assert.equal(compter(large.svg, /class="cd-etiquette-quadrant"/g), 1);
  });

  it("reste autonome, lisible et contenu dans un viewBox de 320 px", () => {
    for (const centiemes of [25, 75]) {
      for (const etape of ETAPES_REORGANISATION_CENTIEMES) {
        const rendu = dessinerReorganisationCentiemes({
          centiemes,
          etape,
          largeur: 320,
        });
        assert.match(rendu.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
        assert.match(rendu.svg, /viewBox="0 0 320 [\d.]+"/);
        assert.match(rendu.svg, /role="img" aria-label="[^"]+"/);
        assert.match(rendu.svg, /style="max-width:100%;height:auto"/);
        assert.doesNotMatch(rendu.svg, /NaN|Infinity|<script|<foreignObject/);
        assert.ok(rendu.donnees.coteUnite <= 320);
        assert.ok(rendu.donnees.tailleCellule >= 10);
        assert.match(
          rendu.svg,
          new RegExp(`fill="${COULEURS_NUMERATION_DECIMALE.centieme}"`),
        );
        assert.match(
          rendu.svg,
          new RegExp(`stroke="${COULEURS_RANGS_NUMERATION_DECIMALE.unites.texte}"`),
        );
      }
    }
  });

  it("retourne un SVG d'erreur sûr pour les réglages invalides", () => {
    for (const options of [
      {},
      { centiemes: 50 },
      { centiemes: 25, etape: "colonnes" },
      { centiemes: 25, largeur: 200 },
      { centiemes: 25, largeur: Infinity },
      { centiemes: 25, afficherEcritures: "non" },
      { centiemes: 25, afficherEquation: "non" },
    ]) {
      const rendu = dessinerReorganisationCentiemes(options);
      assert.ok(rendu.erreur);
      assert.equal(rendu.donnees, null);
      assert.match(rendu.svg, /data-erreur="true"/);
      assert.doesNotMatch(rendu.svg, /NaN|Infinity|<script|<foreignObject/);
    }
  });
});

describe("cinq dixièmes et un demi", () => {
  it("aligne verticalement cinq bandes vertes dans la moitié gauche de l'unité", () => {
    const rendu = dessinerDemiAvecDixiemes({
      etape: "dixiemes",
      largeur: 320,
    });
    assert.equal(rendu.erreur, null);
    assert.equal(compter(rendu.svg, /class="cd-bande-dixieme"/g), 5);
    assert.equal(
      rendu.donnees.hauteurCinqDixiemes,
      rendu.donnees.coteUnite,
    );
    assert.equal(
      rendu.donnees.largeurCinqDixiemes,
      rendu.donnees.coteUnite / 2,
    );
    assert.equal(rendu.donnees.largeurCinqDixiemes, rendu.donnees.largeurDemi);
    assert.match(rendu.svg, /class="cd-reste-dixiemes"/);
    assert.match(
      rendu.svg,
      new RegExp(`class="cd-reste-dixiemes"[^>]*fill="${COULEURS_RANGS_NUMERATION_DECIMALE.dixiemes.fond}"`),
    );
    assert.match(rendu.svg, /class="cd-ligne-demie-unite cd-bord-cinq-dixiemes"/);
    assert.match(
      rendu.svg,
      new RegExp(`fill="${COULEURS_NUMERATION_DECIMALE.dixieme}"`),
    );
    assert.match(
      rendu.svg,
      new RegExp(`stroke="${COULEURS_RANGS_NUMERATION_DECIMALE.unites.texte}"`),
    );
    assert.match(rendu.texteAlternatif, /Cinq bandes vertes d’un dixième/);
  });

  it("aligne une vraie pièce historique de demi au milieu du même rail", () => {
    const rendu = dessinerDemiAvecDixiemes({
      etape: "comparaison",
      largeur: 320,
    });
    assert.equal(rendu.donnees.largeurDemi, rendu.donnees.coteUnite / 2);
    assert.equal(rendu.donnees.positionBordDemi, rendu.largeur / 2);
    assert.equal(compter(rendu.svg, /class="cd-piece-demi"/g), 1);
    assert.equal(compter(rendu.svg, /class="cd-guide-commun-demi"/g), 1);
    assert.match(rendu.svg, /class="cd-guide-commun-demi"[^>]*stroke-dasharray="5 4"/);
    assert.match(
      rendu.svg,
      new RegExp(`class="cd-piece-demi"[^>]*fill="${COULEURS_BANDES_FRACTIONS.d2}"`),
    );
    assert.equal(compter(rendu.svg, /class="cd-ecriture-demie-numerateur"/g), 1);
    assert.equal(compter(rendu.svg, /class="cd-ecriture-demie-barre"/g), 1);
    assert.equal(compter(rendu.svg, /class="cd-ecriture-demie-denominateur"/g), 1);
    assert.match(
      rendu.svg,
      /class="cd-ecriture-demie-numerateur"[^>]*font-family="&#39;/,
    );
    assert.match(rendu.svg, />0,5 = 5\/10 = 1\/2<\/text>/);
    assert.match(rendu.texteAlternatif, /même repère 0,5/);
  });

  it("peut nommer les matériels sans répéter l’équation de synthèse", () => {
    const rendu = dessinerDemiAvecDixiemes({
      etape: "comparaison",
      largeur: 320,
      afficherEcritures: true,
      afficherEquation: false,
    });
    assert.match(rendu.svg, /class="cd-ecriture-demie"/);
    assert.match(rendu.svg, /class="cd-repere-demi"/);
    assert.match(rendu.svg, />0,5<\/text>/);
    assert.doesNotMatch(rendu.svg, /class="cd-ecriture-correspondance"/);
    assert.equal(rendu.donnees.afficherEquation, false);
    assert.doesNotMatch(rendu.texteAlternatif, /5 sur 10|1 sur 2/);
  });

  it("peut masquer toutes les écritures finales dans un mode d'aide", () => {
    const rendu = dessinerDemiAvecDixiemes({
      etape: "comparaison",
      largeur: 320,
      afficherEcritures: false,
    });
    assert.doesNotMatch(rendu.svg, /0,5|5\/10|1\/2/);
    assert.doesNotMatch(rendu.svg, /class="cd-ecriture-demie-(?:numerateur|barre|denominateur)"/);
    assert.doesNotMatch(rendu.texteAlternatif, /0,5|5\/10|1\/2/);
    assert.match(rendu.svg, /class="cd-ecriture-demie-masquee"/);
    assert.match(rendu.svg, /class="cd-repere-demi-masque"/);
    assert.match(rendu.texteAlternatif, /écritures sont masquées/);
  });

  it("reste déterministe et responsive dans les trois étapes", () => {
    for (const etape of ETAPES_DEMI_DIXIEMES) {
      const options = { etape, largeur: 320 };
      const rendu = dessinerDemiAvecDixiemes(options);
      assert.equal(rendu.svg, dessinerDemiAvecDixiemes(options).svg);
      assert.match(rendu.svg, /viewBox="0 0 320 [\d.]+"/);
      assert.match(rendu.svg, /style="max-width:100%;height:auto"/);
      assert.match(rendu.svg, /role="img" aria-label="[^"]+"/);
      assert.doesNotMatch(rendu.svg, /NaN|Infinity|<script|<foreignObject/);
      assert.ok(rendu.hauteur > 0);
      assert.ok(rendu.donnees.coteUnite <= rendu.largeur);
    }
  });

  it("retourne un SVG d'erreur pour une étape, une largeur ou un booléen invalides", () => {
    for (const options of [
      { etape: "quart" },
      { largeur: 100 },
      { largeur: "320" },
      { afficherEcritures: 0 },
      { afficherEquation: "non" },
    ]) {
      const rendu = dessinerDemiAvecDixiemes(options);
      assert.ok(rendu.erreur);
      assert.equal(rendu.donnees, null);
      assert.match(rendu.svg, /data-erreur="true"/);
    }
  });

  it("est exporté par le paquet et déclare son origine", () => {
    const paquet = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );
    assert.equal(
      paquet.exports["./correspondances-decimales"],
      "./src/correspondances-decimales.js",
    );
    assert.equal(
      PROVENANCE_OBJETS["correspondances-decimales.js"].statut,
      "original_mathsgo",
    );
  });
});
