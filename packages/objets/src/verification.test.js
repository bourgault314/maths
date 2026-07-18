import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dessinerVerification } from "./verification.js";
import {
  aideRegroupement,
  diviseursDe,
  propositionsDecomposition,
} from "./equabarre-logique.js";

describe("dessinerVerification (objet séparé)", () => {
  it("rend le bandeau avec la lettre en italique", () => {
    const svg = dessinerVerification({ texte: "3 × 4 + 5 = 17" });
    assert.match(svg, /aria-label="vérification"/);
    assert.match(svg, /Vérification : 3 × 4 \+ 5 = 17/);
    assert.match(svg, /<rect[^>]*fill="#f1f5f9"/);
    assert.equal(svg, dessinerVerification({ texte: "3 × 4 + 5 = 17" }));
  });

  it("échappe le texte et refuse le vide", () => {
    assert.ok(!dessinerVerification({ texte: "<script>1</script>" }).includes("<script"));
    assert.throws(() => dessinerVerification({ texte: "  " }), RangeError);
  });
});

describe("propositions de réponse (pédagogie de l'outil historique)", () => {
  it("aide au regroupement, verbatim de l'outil : 4 jetons, la bonne toujours là", () => {
    // sans mélange : [somme, +1, −1, +10] (3 premiers distracteurs)
    assert.deepEqual(aideRegroupement(9), [9, 10, 8, 19]);
    // avec n'importe quel mélange, la bonne réponse est toujours présente
    const inverse = (l) => [...l].reverse();
    assert.ok(aideRegroupement(9, inverse).includes(9));
    assert.equal(aideRegroupement(9, inverse).length, 4);
    assert.ok(aideRegroupement(3).every((v) => v > 0));
  });

  it("partager : tous les diviseurs de 2 à n", () => {
    assert.deepEqual(diviseursDe(12), [2, 3, 4, 6, 12]);
    assert.deepEqual(diviseursDe(7), [7]);
  });

  it("décomposer : des suggestions valides et sans doublon", () => {
    for (const n of [6, 9, 12, 25]) {
      const paires = propositionsDecomposition(n);
      assert.ok(paires.length >= 2, `pas assez de suggestions pour ${n}`);
      for (const [a, b] of paires) {
        assert.equal(a + b, n, `${a}+${b} ≠ ${n}`);
        assert.ok(a > 0 && b > 0);
      }
      const cles = paires.map((p) => p.join("+"));
      assert.equal(new Set(cles).size, cles.length);
    }
  });
});
