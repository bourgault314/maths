import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dessinerVerification } from "./verification.js";
import {
  aideDecomposition,
  aideRegroupement,
  creerEtat,
  diviseursDe,
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

  it("décomposer : la PREMIÈRE proposition fait apparaître un nombre de l'autre membre", () => {
    // 9 = x + 6 : décomposer 9 (bas) doit proposer « 6 + 3 » en premier
    const etat = creerEtat("9 = x + 6");
    const propositions = aideDecomposition(etat, 1, 9);
    assert.equal(propositions[0], "6 + 3");
    assert.ok(propositions.length >= 2 && propositions.length <= 4);
    for (const p of propositions) {
      const somme = p.split("+").reduce((s, v) => s + Number(v.trim()), 0);
      assert.equal(somme, 9, `${p} ne fait pas 9`);
    }
    assert.equal(new Set(propositions).size, propositions.length);
  });
});
