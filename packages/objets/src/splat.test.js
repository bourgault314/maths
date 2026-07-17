import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COULEURS_SPLAT, cheminTache, dessinerTache } from "./splat.js";

describe("cheminTache (port verbatim de blobPath)", () => {
  it("reproduit exactement la silhouette des outils historiques (témoin)", () => {
    const d = cheminTache(60, 60, 44);
    // Premier point : a=0 → k = 0,90 → (60 + 44×0,90 ; 60) = (99,6 ; 60)
    assert.ok(d.startsWith("M 99.6 60 C "), d.slice(0, 24));
    assert.ok(d.endsWith(" Z"));
    // 40 segments de Bézier, chemin fermé
    assert.equal((d.match(/ C /g) || []).length, 40);
  });

  it("est déterministe et homothétique", () => {
    assert.equal(cheminTache(60, 60, 44), cheminTache(60, 60, 44));
    assert.notEqual(cheminTache(60, 60, 44), cheminTache(60, 60, 45));
  });
});

describe("dessinerTache", () => {
  it("tache couverte opaque, tache révélée translucide", () => {
    assert.match(dessinerTache(), /fill-opacity="1"/);
    assert.match(dessinerTache({ revelee: true }), /fill-opacity="0.22"/);
  });

  it("les six couleurs des outils sont disponibles", () => {
    for (const couleur of Object.keys(COULEURS_SPLAT)) {
      assert.match(dessinerTache({ couleur }), new RegExp(`fill="${COULEURS_SPLAT[couleur]}"`));
    }
    assert.equal(COULEURS_SPLAT.violet, "#9d4edd");
  });

  it("rejette une couleur inconnue", () => {
    assert.throws(() => dessinerTache({ couleur: "rose" }), RangeError);
  });
});
