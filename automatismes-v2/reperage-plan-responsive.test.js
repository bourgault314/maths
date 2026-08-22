import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import {
  dessinerRepereCartesien,
  positionDansRepere,
} from "../packages/objets/src/repere-cartesien.js";
import {
  GABARITS_BORNES_REPERE,
} from "../packages/automatismes/src/espace-et-geometrie/reperage-plan/serie.js";

describe("responsive du repérage dans le plan", () => {
  it("conserve des unités carrées et une zone utile lisible de 320 px au TNI", () => {
    for (const largeur of [320, 390, 768, 1366, 1920]) {
      const largeurObjet = largeur <= 620 ? 320 : 680;
      for (const bornes of GABARITS_BORNES_REPERE) {
        const { geometrie, largeur: largeurSvg, hauteur } = dessinerRepereCartesien({
          ...bornes,
          largeur: largeurObjet,
          points: [
            { nom: "A", x: bornes.xMin, y: bornes.yMax },
            { nom: "M", x: bornes.xMax, y: bornes.yMin },
          ],
        });
        const origine = positionDansRepere(0, 0, geometrie);
        const uniteX = positionDansRepere(1, 0, geometrie);
        const uniteY = positionDansRepere(0, 1, geometrie);
        assert.equal(largeurSvg, largeurObjet);
        assert.ok(Math.abs(
          (uniteX.x - origine.x) - (origine.y - uniteY.y),
        ) < 0.01, `${largeur}px : les unités ne sont pas carrées`);
        assert.ok(geometrie.cellule >= 31, `${largeur}px : graduation trop serrée`);
        assert.ok(geometrie.xDroite - geometrie.xGauche >= 248);
        assert.ok(geometrie.yBas - geometrie.yHaut >= 186);
        assert.ok(hauteur <= 590, `${largeur}px : repère trop haut`);
      }
    }
  });

  it("garde deux rendus responsives, des cibles de 44 px et une surface aimantée", async () => {
    const [styles, application] = await Promise.all([
      readFile(new URL("./styles.css", import.meta.url), "utf8"),
      readFile(new URL("./app.js", import.meta.url), "utf8"),
    ]);
    assert.match(styles, /\.cible-point-repere\s*\{[\s\S]*?width:\s*48px;[\s\S]*?height:\s*48px;/);
    assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.cible-point-repere\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/);
    assert.match(styles, /\.surface-placement-repere\s*\{[\s\S]*?touch-action:\s*manipulation;/);
    assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.repere-version-large\s*\{\s*display:\s*none;/);
    assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.repere-version-mobile\s*\{\s*display:\s*block;/);
    assert.match(application, /rendreVersion\(680, "large"\).*rendreVersion\(320, "mobile"\)/s);
    assert.match(application, /Math\.round\(xMin \+ proportionX \* \(xMax - xMin\)\)/);
    assert.match(application, /Math\.round\(yMax - proportionY \* \(yMax - yMin\)\)/);
    assert.match(application, /\["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"\]/);
  });
});
