import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dessinerRedaction } from "./redaction.js";

// Le modèle fourni par Gwenaël (rédaction du Splat deux plateaux) :
// 3x + 5 = 17 → (−5) → 3x = 12 → (÷3) → x = 4, puis vérification.
const modele = () => ({
  etapes: [
    { equation: "3x + 5 = 17" },
    { equation: "3x = 12", operation: "−5" },
    { equation: "x = 4", operation: "÷3", conclusion: true },
  ],
  verification: "3 × 4 + 5 = 17",
  lettre: "x",
});

describe("dessinerRedaction", () => {
  it("rend le modèle du Splat : déterministe, aligné sur le =", () => {
    const a = dessinerRedaction(modele());
    assert.equal(a, dessinerRedaction(modele()));
    assert.ok(a.startsWith("<svg") && a.endsWith("</svg>"));
    assert.match(a, /aria-label="rédaction de la résolution, 3 étape\(s\)"/);
  });

  it("chaque opération est annotée DES DEUX CÔTÉS avec flèches arrondies", () => {
    const svg = dessinerRedaction(modele());
    // 2 opérations × 2 côtés × (courbe + pointe) = 8 chemins orange
    assert.equal((svg.match(/<path/g) || []).length, 8);
    assert.equal((svg.match(/ Q /g) || []).length, 4, "les flèches doivent être arrondies (courbes)");
    // le texte de l'opération apparaît à gauche ET à droite
    assert.equal((svg.match(/>−5</g) || []).length, 2);
    assert.equal((svg.match(/>÷3</g) || []).length, 2);
  });

  it("la conclusion est en vert, la lettre en italique, le = en bleu", () => {
    const svg = dessinerRedaction(modele());
    assert.match(svg, /fill="#16a34a"[^>]*text-anchor="end"><tspan font-style="italic">x<\/tspan>/);
    assert.match(svg, /fill="#3b82f6"/);
  });

  it("affiche la ligne de vérification dans son bandeau", () => {
    const svg = dessinerRedaction(modele());
    assert.match(svg, /Vérification : 3 × 4 \+ 5 = 17/);
    assert.match(svg, /<rect[^>]*fill="#f1f5f9"/);
  });

  it("échappe les textes hostiles", () => {
    const svg = dessinerRedaction({
      etapes: [
        { equation: "x = 1" },
        { equation: "x = 1", operation: '<script>alert(1)</script>' },
      ],
    });
    assert.ok(!svg.includes("<script"));
    assert.match(svg, /&lt;script&gt;/);
  });

  it("rejette les étapes invalides", () => {
    assert.throws(() => dessinerRedaction({ etapes: [] }), RangeError);
    assert.throws(
      () => dessinerRedaction({ etapes: [{ equation: "pas d'egal" }] }),
      RangeError,
    );
  });
});
