import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dessinerCercle,
  dessinerFigure,
  echapper,
  formaterAngle,
  formaterLongueur,
  formaterNombre,
} from "./figure.js";
import { sommetsCarre, sommetsRectangle, sommetsTriangle } from "./geometrie.js";

describe("formatage français (cahier des charges §18)", () => {
  it("virgule décimale, zéros inutiles retirés", () => {
    assert.equal(formaterNombre(4.5), "4,5");
    assert.equal(formaterNombre(4), "4");
    assert.equal(formaterNombre(4.256), "4,26");
  });

  it("espace insécable avant l'unité, degré collé", () => {
    assert.equal(formaterLongueur(4.5, "cm"), "4,5\u00A0cm");
    assert.equal(formaterLongueur(3, ""), "3");
    assert.equal(formaterAngle(38.54), "38,5°");
    assert.equal(formaterAngle(60), "60°");
  });

  it("échappe tout HTML", () => {
    assert.equal(echapper(`<script>"&'`), "&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("dessinerFigure — le contrat", () => {
  it("est déterministe et autonome", () => {
    const description = {
      sommets: sommetsCarre({ cote: 4 }),
      visible: { angles: true, mesuresCotes: true },
    };
    const svg = dessinerFigure(description);
    assert.equal(svg, dessinerFigure(description));
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /aria-label="quadrilatère ABCD"/);
  });

  it("carré : quatre marques d'angle droit, jamais d'arc", () => {
    const svg = dessinerFigure({
      sommets: sommetsCarre({ cote: 4 }),
      visible: { angles: true },
    });
    // 4 marques d'angle droit = 4 polylignes de 3 points
    const marques = svg.match(/<polyline points="[^"]*"/g) ?? [];
    assert.equal(marques.length, 4);
    marques.forEach((m) => assert.equal(m.split(" ").length - 1, 3));
  });

  it("la mesure d'un côté est la vraie longueur, en français", () => {
    const svg = dessinerFigure({
      sommets: sommetsRectangle({ largeur: 6, hauteur: 4.5 }),
      visible: { mesuresCotes: true },
    });
    assert.match(svg, />6\u00A0cm</);
    assert.match(svg, />4,5\u00A0cm</);
  });

  it("textes imposés : « ? » et lettres remplacent la mesure", () => {
    const svg = dessinerFigure({
      sommets: sommetsRectangle({}),
      visible: { mesuresCotes: ["AB"], mesuresAngles: ["A"] },
      textesCotes: { AB: "?" },
      textesAngles: { A: "x" },
    });
    assert.match(svg, />\?</);
    assert.match(svg, />x</);
  });

  it("angles d'un triangle : arcs en polyligne DANS la figure, même après rotation", () => {
    for (const rotationDeg of [0, 45, 133, 217, 301]) {
      const svg = dessinerFigure({
        sommets: sommetsTriangle({ angles: [50, 60, 70] }),
        transform: { rotationDeg },
        visible: { angles: true },
      });
      const arcs = svg.match(/<polyline points="([^"]*)"/g) ?? [];
      assert.equal(arcs.length, 3, `rotation ${rotationDeg}° : trois arcs attendus`);
    }
  });

  it("mesures d'angles affichées, angle droit sans valeur", () => {
    const svg = dessinerFigure({
      sommets: sommetsTriangle({ famille: "rectangle", cathetes: [4, 3] }),
      visible: { angles: true, mesuresAngles: true },
    });
    assert.ok(!svg.includes(">90°<"), "pas de valeur sur l'angle droit");
    assert.match(svg, />53,1°</); // atan(4/3), arrondi au dixième
    assert.match(svg, />36,9°</);
  });

  it("diagonales, centre et axes de symétrie d'un rectangle", () => {
    const svg = dessinerFigure({
      sommets: sommetsRectangle({ largeur: 6, hauteur: 4 }),
      visible: { diagonales: true, centre: true, axes: true },
    });
    assert.match(svg, />O</); // le centre est nommé
    // 2 axes en trait mixte
    const mixtes = svg.match(/stroke-dasharray="12 5 3 5"/g) ?? [];
    assert.equal(mixtes.length, 2);
  });

  it("codages : traits d'égalité, chevrons de parallélisme, angles égaux", () => {
    const svg = dessinerFigure({
      sommets: sommetsRectangle({}),
      codages: [
        { type: "egalite", cotes: ["AB", "CD"], traits: 2 },
        { type: "paralleles", cotes: ["BC", "AD"], fleches: 1 },
        { type: "anglesEgaux", sommets: ["A", "C"], arcs: 2 },
      ],
    });
    assert.ok(svg.length > 500);
    // 2 côtés × 2 traits + 2 côtés × 1 chevron (2 branches) = 8 petites lignes
    // en plus des 4 côtés du contour
    const lignes = svg.match(/<line /g) ?? [];
    assert.equal(lignes.length, 4 + 4 + 4);
  });

  it("codage milieu : croix + double codage sur les deux moitiés", () => {
    const svg = dessinerFigure({
      sommets: sommetsTriangle({ angles: [50, 60, 70] }),
      codages: [{ type: "milieu", cote: "BC", traits: 1 }],
    });
    // 3 côtés + 2 traits d'égalité + 2 traits de croix
    assert.equal((svg.match(/<line /g) ?? []).length, 7);
  });

  it("styles par élément : un côté rouge pointillé, remplissage", () => {
    const svg = dessinerFigure({
      sommets: sommetsCarre({}),
      styles: {
        figure: { remplissage: "#dbeafe" },
        cotes: { AB: { couleur: "#dc2626", pointilles: true } },
      },
    });
    assert.match(svg, /fill="#dbeafe"/);
    assert.match(svg, /stroke="#dc2626"[^/]*stroke-dasharray="8 6"/);
  });

  it("thème couleur : contour AngleBarre bleu, lettres bleues", () => {
    const svg = dessinerFigure({
      sommets: sommetsCarre({}),
      styles: { theme: "couleur" },
    });
    assert.match(svg, /stroke="#1d4ed8"/);
    assert.match(svg, /fill="#1d4ed8"[^>]*>A</);
  });

  it("refuse les descriptions invalides avec des messages clairs", () => {
    assert.throws(() => dessinerFigure({ sommets: [[0, 0], [1, 1]] }), /trois sommets/);
    assert.throws(
      () => dessinerFigure({ sommets: sommetsCarre({}), nom: "ABC" }),
      /une lettre majuscule distincte par sommet/,
    );
    assert.throws(
      () => dessinerFigure({ sommets: sommetsCarre({}), visible: { mesuresCotes: ["AZ"] } }),
      /n'existe pas/,
    );
    assert.throws(
      () => dessinerFigure({ sommets: sommetsCarre({}), codages: [{ type: "zigzag" }] }),
      /codage inconnu/,
    );
  });

  it("neutralise le HTML dans les textes fournis", () => {
    const svg = dessinerFigure({
      sommets: sommetsCarre({}),
      visible: { mesuresCotes: ["AB"] },
      textesCotes: { AB: `<img src=x>` },
    });
    assert.ok(!svg.includes("<img"));
    assert.match(svg, /&lt;img/);
  });
});

describe("dessinerCercle", () => {
  it("centre, rayon exact, mesures françaises", () => {
    const svg = dessinerCercle({
      rayon: 3,
      visible: { rayonVersDeg: 40, mesureRayon: true },
    });
    assert.match(svg, /<circle[^>]*fill="none"/);
    assert.match(svg, />3\u00A0cm</);
    assert.match(svg, />O</);
    // le segment du rayon a exactement la longueur du rayon en pixels
    const [, x1, y1, x2, y2] = svg.match(
      /<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/,
    );
    const longueur = Math.hypot(x2 - x1, y2 - y1);
    const rayonPx = Number(svg.match(/r="([\d.]+)"/)[1]);
    assert.ok(Math.abs(longueur - rayonPx) < 0.05);
  });

  it("le diamètre passe exactement par le centre", () => {
    const svg = dessinerCercle({
      rayon: 2.5,
      visible: { diametreVersDeg: 25, mesureDiametre: true },
    });
    assert.match(svg, />5\u00A0cm</);
    const [, x1, y1, x2, y2] = svg
      .match(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/)
      .map(Number);
    // milieu du segment = centre du cercle
    const [, cx, cy] = svg.match(/<circle cx="([\d.]+)" cy="([\d.]+)"/).map(Number);
    assert.ok(Math.abs((x1 + x2) / 2 - cx) < 0.05);
    assert.ok(Math.abs((y1 + y2) / 2 - cy) < 0.05);
  });

  it("disque : remplissage sous le cercle ; points nommés sur le cercle", () => {
    const svg = dessinerCercle({
      rayon: 3,
      points: [{ nom: "A", angleDeg: 40 }],
      visible: { disque: true, rayonVersDeg: "A" },
    });
    assert.match(svg, /<circle[^>]*fill-opacity/);
    assert.match(svg, />A</);
  });

  it("refuse un rayon invalide", () => {
    assert.throws(() => dessinerCercle({ rayon: 0 }), /strictement positif/);
    assert.throws(
      () => dessinerCercle({ rayon: 2, visible: { rayonVersDeg: "Z" } }),
      /n'est pas défini/,
    );
  });
});
