import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TYPOGRAPHIE } from "../../charte/src/charte.js";
import {
  COULEURS_REPERE,
  SIGNE_MOINS_REPERE,
  VERSION_REPERE_CARTESIEN,
  dessinerRepereCartesien,
  positionDansRepere,
} from "./repere-cartesien.js";

describe("repère cartésien V2", () => {
  it("produit un SVG pur, déterministe et autosuffisant", () => {
    const options = {
      xMin: -5,
      xMax: 3,
      yMin: -3,
      yMax: 4,
      largeur: 320,
      points: [{ nom: "M", x: -3, y: 2 }],
      description: "Repère avec le point M",
    };
    const premier = dessinerRepereCartesien(options);
    const second = dessinerRepereCartesien(options);
    assert.equal(premier.svg, second.svg);
    assert.equal(VERSION_REPERE_CARTESIEN, 1);
    assert.match(premier.svg, /^<svg/);
    assert.match(premier.svg, /width="320" height="[\d.]+"/);
    assert.match(premier.svg, /aria-label="Repère avec le point M"/);
  });

  it("conserve des unités carrées dans un repère asymétrique", () => {
    const { geometrie } = dessinerRepereCartesien({
      xMin: -5,
      xMax: 3,
      yMin: -3,
      yMax: 4,
    });
    const origine = positionDansRepere(0, 0, geometrie);
    const droite = positionDansRepere(1, 0, geometrie);
    const haut = positionDansRepere(0, 1, geometrie);
    assert.equal(droite.x - origine.x, geometrie.cellule);
    assert.equal(origine.y - haut.y, geometrie.cellule);
    assert.equal(geometrie.cellule, 64, "le repère doit rester lisible au tableau");
    assert.equal(geometrie.xAxe, origine.x);
    assert.equal(geometrie.yAxe, origine.y);
  });

  it("écrit le vrai signe moins, O une seule fois et la police mathématique canonique", () => {
    const { svg } = dessinerRepereCartesien({ xMin: -4, xMax: 4, yMin: -3, yMax: 3 });
    assert.ok(svg.includes(`${SIGNE_MOINS_REPERE}4`));
    assert.ok(!svg.includes(">-4<"));
    assert.equal((svg.match(/>O<\/text>/g) ?? []).length, 1);
    assert.ok(svg.includes(`font-family="${TYPOGRAPHIE.mathematiques.replaceAll('"', "'")}"`));
    assert.ok(!svg.includes(">0</text>"), "l'origine ne doit pas cumuler O et 0");
  });

  it("laisse les flèches positives remplacer les graduations d'extrémité", () => {
    const { svg, geometrie } = dessinerRepereCartesien({ xMin: -4, xMax: 4, yMin: -3, yMax: 3 });
    const extremiteX = positionDansRepere(geometrie.xMax, 0, geometrie);
    const avantExtremiteX = positionDansRepere(geometrie.xMax - 1, 0, geometrie);
    const extremiteY = positionDansRepere(0, geometrie.yMax, geometrie);
    const avantExtremiteY = positionDansRepere(0, geometrie.yMax - 1, geometrie);

    assert.ok(!svg.includes(`<line x1="${extremiteX.x}" y1="${geometrie.yAxe - 4}" x2="${extremiteX.x}" y2="${geometrie.yAxe + 4}"`));
    assert.ok(svg.includes(`<line x1="${avantExtremiteX.x}" y1="${geometrie.yAxe - 4}" x2="${avantExtremiteX.x}" y2="${geometrie.yAxe + 4}"`));
    assert.ok(!svg.includes(`<line x1="${geometrie.xAxe - 4}" y1="${extremiteY.y}" x2="${geometrie.xAxe + 4}" y2="${extremiteY.y}"`));
    assert.ok(svg.includes(`<line x1="${geometrie.xAxe - 4}" y1="${avantExtremiteY.y}" x2="${geometrie.xAxe + 4}" y2="${avantExtremiteY.y}"`));
  });

  it("différencie guides, point choisi et point attendu sans dépendre de la couleur seule", () => {
    const { svg } = dessinerRepereCartesien({
      points: [
        { nom: "M", x: -2, y: 2, role: "choisi" },
        { nom: "N", x: 2, y: -1, role: "attendu" },
      ],
      guides: [
        { x: -2, y: 2, axe: "abscisses" },
        { x: -2, y: 2, axe: "ordonnees" },
      ],
    });
    assert.ok(svg.includes(COULEURS_REPERE.choisi));
    assert.ok(svg.includes(COULEURS_REPERE.attendu));
    assert.ok(svg.includes(COULEURS_REPERE.guideAbscisse));
    assert.ok(svg.includes(COULEURS_REPERE.guideOrdonnee));
    assert.ok(svg.includes(">M</text>"));
    assert.ok(svg.includes(">N</text>"));
  });

  it("dessine les deux étapes spatiales d'un placement", () => {
    const horizontal = dessinerRepereCartesien({
      cheminPlacement: { x: 2, y: -1, etape: "horizontal" },
    }).svg;
    const complet = dessinerRepereCartesien({
      cheminPlacement: { x: 2, y: -1, etape: "complet" },
    }).svg;
    const compter = (svg, couleur) => (svg.match(new RegExp(`stroke="${couleur}"`, "g")) ?? []).length;
    assert.ok(compter(horizontal, COULEURS_REPERE.guideAbscisse) >= 1);
    assert.equal(compter(horizontal, COULEURS_REPERE.guideOrdonnee), 0);
    assert.ok(compter(complet, COULEURS_REPERE.guideOrdonnee) >= 1);
  });

  it("refuse les configurations illisibles ou hors contrat", () => {
    assert.throws(
      () => dessinerRepereCartesien({ xMin: 0 }),
      /xMin/,
    );
    assert.throws(
      () => dessinerRepereCartesien({ xMin: -10, xMax: 10 }),
      /compris entre 4 et 12/,
    );
    assert.throws(
      () => dessinerRepereCartesien({ points: [{ nom: "O", x: 1, y: 1 }] }),
      /différente de O/,
    );
    assert.throws(
      () => positionDansRepere(12, 0, dessinerRepereCartesien().geometrie),
      /point entier visible/,
    );
  });
});
