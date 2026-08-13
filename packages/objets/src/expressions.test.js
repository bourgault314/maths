import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  caseVide,
  egalite,
  groupe,
  inferieurStrict,
  nombre,
  produit,
  puissance,
  somme,
  texteCourt,
  variable,
  versHtmlSemantique,
  versHtmlEgalitesAlignees,
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

  it("peut colorer chaque chiffre d’un décimal selon son rang sans changer sa lecture", () => {
    const html = versHtmlSemantique(nombre(1.47, {
      decimales: 2,
      rangsDecimaux: true,
    }));
    assert.match(html, /aria-label="1,47"/);
    assert.match(html, /mathsgo-role-unites">1<\/span>,/);
    assert.match(html, /mathsgo-role-dixiemes">4<\/span>/);
    assert.match(html, /mathsgo-role-centiemes">7<\/span>/);
  });

  it("rend les cases vides et les encadrements avec une verbalisation accessible", () => {
    const cases = versHtmlSemantique(egalite(
      nombre(49),
      produit(caseVide(), caseVide()),
    ));
    assert.match(cases, /aria-label="49 égale case vide fois case vide"/);
    assert.equal((cases.match(/class="case-vide-aide"/g) ?? []).length, 2);

    const encadrement = versHtmlSemantique(inferieurStrict(
      produit(nombre(6), nombre(6)),
      nombre(40),
      produit(nombre(7), nombre(7)),
    ));
    assert.match(encadrement, /aria-label="6 fois 6 est inférieur à 40 est inférieur à 7 fois 7"/);
    assert.match(encadrement, />6 × 6 &lt; 40 &lt; 7 × 7<\/span>$/);
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

describe("versHtmlEgalitesAlignees", () => {
  it("place tous les signes égale dans une seule grille et conserve les exposants", () => {
    const html = versHtmlEgalitesAlignees(egalite(
      somme(puissance(nombre(7), 2), nombre(1)),
      somme(nombre(49), nombre(1)),
      nombre(50),
    ));
    assert.match(html, /mathsgo-expression mathsgo-egalites-alignees/);
    assert.equal((html.match(/mathsgo-egalite-signe/g) ?? []).length, 2);
    assert.equal((html.match(/<sup>2<\/sup>/g) ?? []).length, 1);
    assert.match(html, /aria-label="7 au carré plus 1 égale 49 plus 1 égale 50"/);
  });

  it("rend les parenthèses comme partie de l'expression structurée", () => {
    assert.match(
      versHtmlSemantique(produit(nombre(11), groupe(somme(nombre(10), nombre(1))))),
      />11 × \(10 \+ 1\)<\/span>$/,
    );
  });

  it("refuse une relation qui n'est pas une suite d'égalités", () => {
    assert.throws(() => versHtmlEgalitesAlignees(nombre(2)), /suite alignée/);
  });
});
