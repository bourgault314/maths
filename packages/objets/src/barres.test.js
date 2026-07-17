import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COULEURS } from "../../charte/src/charte.js";
import { ROLES_SEGMENT, dessinerSchemaBarres } from "./barres.js";

const partieTout = () => ({
  barres: [
    {
      segments: [
        { valeur: 26, etiquette: "26" },
        { valeur: 12, etiquette: "?", role: "inconnu" },
      ],
    },
  ],
  accolades: [{ barre: 0, de: 0, a: 1, position: "haut", etiquette: "38" }],
});

describe("dessinerSchemaBarres", () => {
  it("produit un SVG autonome et déterministe", () => {
    const a = dessinerSchemaBarres(partieTout());
    assert.equal(a, dessinerSchemaBarres(partieTout()));
    assert.ok(a.startsWith("<svg") && a.endsWith("</svg>"));
  });

  it("les largeurs sont proportionnelles aux valeurs", () => {
    const svg = dessinerSchemaBarres(partieTout());
    const largeurs = [...svg.matchAll(/<rect[^>]*? width="([0-9.]+)"/g)].map((m) => Number(m[1]));
    assert.equal(largeurs.length, 2);
    assert.ok(Math.abs(largeurs[0] / largeurs[1] - 26 / 12) < 1e-9, `${largeurs[0]} / ${largeurs[1]} ≠ 26/12`);
  });

  it("l'inconnue est une case blanche en pointillés", () => {
    const svg = dessinerSchemaBarres(partieTout());
    assert.match(svg, new RegExp(`fill="${COULEURS.papier}"[^>]*stroke-dasharray`));
    assert.match(svg, />\?</);
  });

  it("l'accolade porte son étiquette et couvre les segments demandés", () => {
    const svg = dessinerSchemaBarres(partieTout());
    assert.equal((svg.match(/<path/g) || []).length, 1);
    assert.match(svg, />38</);
  });

  it("comparaison : deux barres alignées à gauche avec noms", () => {
    const svg = dessinerSchemaBarres({
      barres: [
        { etiquette: "Léa", segments: [{ valeur: 26, etiquette: "26" }] },
        {
          etiquette: "Tom",
          segments: [
            { valeur: 26, etiquette: "26", role: "second" },
            { valeur: 12, etiquette: "?", role: "inconnu" },
          ],
        },
      ],
      accolades: [{ barre: 1, de: 1, a: 1, position: "bas", etiquette: "12 de plus" }],
    });
    assert.match(svg, />Léa</);
    assert.match(svg, />Tom</);
    const xs = [...svg.matchAll(/<rect[^>]*x="([0-9.]+)"/g)].map((m) => Number(m[1]));
    assert.equal(xs[0], xs[1], "les deux barres doivent partir du même bord gauche");
  });

  it("groupes égaux : n segments identiques de même largeur", () => {
    const svg = dessinerSchemaBarres({
      barres: [{ segments: Array.from({ length: 6 }, () => ({ valeur: 7, etiquette: "7" })) }],
      accolades: [{ barre: 0, de: 0, a: 5, position: "bas", etiquette: "?" }],
    });
    const largeurs = [...svg.matchAll(/<rect[^>]*? width="([0-9.]+)"/g)].map((m) => Number(m[1]));
    assert.equal(largeurs.length, 6);
    assert.equal(new Set(largeurs).size, 1, "six segments égaux → six largeurs identiques");
  });

  it("n'utilise que des couleurs de la charte (plus le blanc)", () => {
    const autorisees = new Set([...Object.values(COULEURS), "#ffffff"]);
    const svg = dessinerSchemaBarres({
      barres: [
        {
          segments: ROLES_SEGMENT.map((role, i) => ({ valeur: i + 1, etiquette: role, role })),
        },
      ],
    });
    for (const couleur of svg.match(/#[0-9a-f]{6}/g) || []) {
      assert.ok(autorisees.has(couleur), `couleur hors charte : ${couleur}`);
    }
  });

  it("se décrit aux lecteurs d'écran", () => {
    assert.match(
      dessinerSchemaBarres(partieTout()),
      /aria-label="schéma en barres, 1 barre\(s\)"/,
    );
  });

  it("rejette les schémas invalides", () => {
    assert.throws(() => dessinerSchemaBarres({ barres: [] }), RangeError);
    assert.throws(
      () => dessinerSchemaBarres({ barres: [{ segments: [{ valeur: 0 }] }] }),
      RangeError,
    );
    assert.throws(
      () => dessinerSchemaBarres({ barres: [{ segments: [{ valeur: 1, role: "vert" }] }] }),
      RangeError,
    );
    assert.throws(
      () =>
        dessinerSchemaBarres({
          barres: [{ segments: [{ valeur: 1 }] }],
          accolades: [{ barre: 0, de: 0, a: 3, position: "haut", etiquette: "x" }],
        }),
      RangeError,
    );
    assert.throws(
      () =>
        dessinerSchemaBarres({
          barres: [{ segments: [{ valeur: 1 }] }],
          accolades: [{ barre: 0, de: 0, a: 0, position: "milieu", etiquette: "x" }],
        }),
      RangeError,
    );
  });
});
