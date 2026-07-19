// Le composant du studio ne définit plus ni la palette ni la racine : il les
// réexporte depuis la fondation. Ce test protège ses consommateurs
// historiques (scripts/build-pythagore-thumbnails.mjs, pages du studio) et
// vérifie que le sens des dépendances reste studio → packages.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PYTHAGORE_COLORS, squareRootSvg, windmillSvg, pythagoreanBarsSvg } from "./visuals.js";
import { COULEURS_PYTHAGORE } from "../../../packages/charte/src/charte.js";
import { squareRootSvg as racineDesObjets } from "../../../packages/objets/src/pythagore.js";

describe("composant Pythagore du studio", () => {
  it("réexporte exactement la palette de la charte", () => {
    assert.equal(PYTHAGORE_COLORS, COULEURS_PYTHAGORE);
  });

  it("réexporte exactement la racine dessinée des objets", () => {
    assert.equal(squareRootSvg, racineDesObjets);
  });

  it("ne redéfinit plus de couleur en dur", () => {
    const source = readFileSync(new URL("./visuals.js", import.meta.url), "utf8");
    const enDur = [...source.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((trouve) => trouve[0]);
    // Restent seulement les teintes propres aux géométries du moulin :
    // le blanc du triangle, l'encre des étiquettes et le rouge de l'angle droit.
    assert.deepEqual([...new Set(enDur)].sort(), ["#172033", "#ef4444"]);
  });

  it("continue de dessiner le moulin et le schéma en barres", () => {
    const moulin = windmillSvg({ x: 0, y: 0, small: 52, medium: 104 });
    const barres = pythagoreanBarsSvg({ x: 0, y: 0 });
    assert.ok(moulin.startsWith("<g") && moulin.includes("polygon"));
    assert.ok(!moulin.includes("NaN") && !barres.includes("NaN"));
    assert.ok(barres.includes(COULEURS_PYTHAGORE.hypFill));
  });
});
