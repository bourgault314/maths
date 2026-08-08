import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  egalite,
  nombre,
  puissance,
  texteCourt,
  variable,
  versHtmlSemantique,
} from "./expressions.js";

describe("versHtmlSemantique", () => {
  it("rend une puissance avec un vrai exposant et sa verbalisation", () => {
    assert.equal(
      versHtmlSemantique(puissance(nombre(7), 2)),
      '<span class="mathsgo-expression" role="math" aria-label="7 au carré"><span class="mathsgo-puissance-base">7</span><sup>2</sup></span>',
    );
  });

  it("garde le même composant pour les bases à un et deux chiffres", () => {
    for (const base of [0, 1, 9, 10, 11, 12]) {
      const html = versHtmlSemantique(puissance(nombre(base), 2));
      assert.match(
        html,
        new RegExp(`<span class="mathsgo-puissance-base">${base}<\\/span><sup>2<\\/sup><\\/span>$`),
      );
      assert.equal((html.match(/mathsgo-puissance-base/g) ?? []).length, 1);
      assert.equal((html.match(/<sup>/g) ?? []).length, 1);
      assert.doesNotMatch(html, /\^2|²/);
    }
  });

  it("rend une expression composée sous une seule unité mathématique accessible", () => {
    assert.equal(
      versHtmlSemantique(egalite(puissance(nombre(4), 2), nombre(16))),
      '<span class="mathsgo-expression" role="math" aria-label="4 au carré égale 16"><span class="mathsgo-puissance-base">4</span><sup>2</sup> = 16</span>',
    );
  });

  it("échappe le contenu visible et la valeur de aria-label", () => {
    const expression = egalite(
      variable('<x onmouseover="alerte">'),
      texteCourt("'essai' & <script>"),
    );
    const html = versHtmlSemantique(expression);

    assert.equal(html.includes("<script>"), false);
    assert.equal(html.includes('<x onmouseover="alerte">'), false);
    assert.match(html, /&lt;x onmouseover=&quot;alerte&quot;&gt;/);
    assert.match(html, /&#39;essai&#39; &amp; &lt;script&gt;/);
    assert.match(html, />&lt;x onmouseover="alerte"&gt; = 'essai' &amp; &lt;script&gt;<\/span>$/);
  });

  it("refuse un nœud inconnu au lieu de fabriquer du HTML", () => {
    assert.throws(
      () => versHtmlSemantique({ type: "inconnu" }),
      /nœud inconnu/,
    );
  });
});
