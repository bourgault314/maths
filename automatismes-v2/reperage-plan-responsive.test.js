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
        assert.ok(geometrie.cellule >= 20, `${largeur}px : graduation trop serrée`);
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
    assert.match(styles, /\.surface-placement-repere:focus-visible\s*\{/);
    assert.doesNotMatch(styles, /\.surface-placement-repere:focus(?!-visible)/);
    assert.match(styles, /\.surface-interaction-repere-aide,[\s\S]*?\.cible-axe-repere-aide\s*\{[\s\S]*?touch-action:\s*manipulation;/);
    assert.match(styles, /\.cible-axe-repere-aide:focus-visible\s*\{/);
    assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.repere-version-large\s*\{\s*display:\s*none;/);
    assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.repere-version-mobile\s*\{\s*display:\s*block;/);
    assert.match(styles, /\.indicateur-reponse-repere\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?min-height:\s*44px;/);
    assert.match(styles, /\.grille-qcm-repere\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?grid-auto-rows:\s*1fr;/);
    assert.match(styles, /@media \(max-width: 620px\)[\s\S]*?\.grille-qcm-repere\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/);
    assert.match(styles, /\.grille-qcm-repere \.choix\s*\{[\s\S]*?white-space:\s*nowrap;/);
    assert.match(styles, /\.coord-abscisse,[\s\S]*?color:\s*var\(--mg-orange\);/);
    assert.match(styles, /\.coord-ordonnee,[\s\S]*?color:\s*var\(--mg-turquoise\);/);
    assert.match(styles, /\.etape-progression-aide\s*\{[\s\S]*?min-height:\s*48px;/);
    assert.match(styles, /\.retour-interaction-repere\.retour-erreur::before\s*\{[\s\S]*?À revoir/);
    assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation:\s*none;/);
    assert.match(application, /rendreVersion\(680, "large"\).*rendreVersion\(320, "mobile"\)/s);
    assert.match(application, /axesMisesEnEvidence/);
    assert.match(application, /mettreOrigineEnEvidence/);
    assert.doesNotMatch(application, /pas-question-repere/);
    assert.doesNotMatch(application, /navigation-aide-repere|Indice suivant/);
    assert.doesNotMatch(application, /Point provisoire \(/);
    assert.match(application, /Point placé — tu peux le déplacer avant de valider/);
    assert.match(application, /data-action="repere-aide-surface"/);
    assert.match(application, /data-action="repere-aide-axe"/);
    assert.match(application, /retourMauvaisAxeRepere/);
    assert.match(application, /Math\.round\(proportionX \* nombreX\) \* pas/);
    assert.match(application, /Math\.round\(proportionY \* nombreY\) \* pas/);
    assert.match(application, /\["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"\]/);
    assert.match(application, /data-action="voir-reponse-repere"/);
    assert.match(application, /zone\.scrollTo\?\.\(\{[\s\S]*?top: destination/);
  });
});
