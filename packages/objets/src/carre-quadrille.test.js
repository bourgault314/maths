import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COULEURS } from "../../charte/src/charte.js";
import {
  COULEURS_CARRE_QUADRILLE,
  HAUTEUR_CARRE_QUADRILLE,
  LARGEUR_CARRE_QUADRILLE,
  MODES_CARRE_QUADRILLE,
  VERSION_CARRE_QUADRILLE,
  dessinerCarreQuadrille,
} from "./carre-quadrille.js";

function compter(texte, motif) {
  return (texte.match(motif) ?? []).length;
}

function boiteEtiquetteAire(svg) {
  const correspondance = svg.match(
    /<rect class="cq-etiquette-aire" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/,
  );
  assert.ok(correspondance, "boîte de l’étiquette centrale absente");
  const [, x, y, largeur, hauteur] = correspondance.map(Number);
  return { x, y, largeur, hauteur };
}

describe("carré quadrillé", () => {
  it("accepte tous les côtés pédagogiques 1, 2, 9, 10 et 12", () => {
    for (const cote of [1, 2, 9, 10, 12]) {
      const rendu = dessinerCarreQuadrille({ cote });
      assert.equal(rendu.cote, cote);
      assert.equal(rendu.aire, cote * cote);
      assert.match(rendu.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      assert.ok(!rendu.svg.includes("NaN"));
      assert.ok(!rendu.svg.includes("Infinity"));
    }
  });

  it("refuse les côtés hors de 1 à 12 et les valeurs non entières", () => {
    for (const cote of [0, 13, -1, 2.5, NaN, "4", null]) {
      assert.throws(() => dessinerCarreQuadrille({ cote }), RangeError);
    }
  });

  it("valide le mode et expose les quatre modes attendus", () => {
    assert.equal(VERSION_CARRE_QUADRILLE, 4);
    assert.deepEqual(MODES_CARRE_QUADRILLE, [
      "sens",
      "aire-inconnue",
      "cote-inconnu",
      "decomposition",
    ]);
    assert.throws(() => dessinerCarreQuadrille({ mode: "correction" }), RangeError);
  });

  it("limite la décomposition aux côtés 11 et 12", () => {
    for (const cote of [1, 4, 10]) {
      assert.throws(
        () => dessinerCarreQuadrille({ cote, mode: "decomposition" }),
        /mode decomposition exige un côté égal à 11 ou 12/,
      );
    }
    for (const cote of [11, 12]) {
      assert.equal(dessinerCarreQuadrille({ cote, mode: "decomposition" }).mode, "decomposition");
    }
  });

  it("est strictement déterministe", () => {
    const options = {
      cote: 12,
      mode: "sens",
      miseEnEvidence: { ligne: 3, colonne: 8 },
    };
    assert.equal(dessinerCarreQuadrille(options).svg, dessinerCarreQuadrille(options).svg);
  });

  it("garde exactement la même taille dans tous les modes et pour tous les côtés", () => {
    const boites = [];
    for (const mode of MODES_CARRE_QUADRILLE) {
      const cotes = mode === "decomposition" ? [11, 12] : [1, 2, 9, 10, 12];
      for (const cote of cotes) {
        const rendu = dessinerCarreQuadrille({ cote, mode });
        assert.equal(rendu.largeur, LARGEUR_CARRE_QUADRILLE);
        assert.equal(rendu.hauteur, HAUTEUR_CARRE_QUADRILLE);
        boites.push(rendu.svg.match(/viewBox="([^"]+)"/)[1]);
      }
    }
    assert.deepEqual(new Set(boites), new Set(["0 0 240 240"]));
  });

  it("sépare visuellement 11 et 12 en 10 + 1 ou 10 + 2", () => {
    const cas = [
      { cote: 11, xSeparation: "204.73", largeurReste: "15.27", reste: 1 },
      { cote: 12, xSeparation: "192", largeurReste: "28", reste: 2 },
    ];
    for (const { cote, xSeparation, largeurReste, reste } of cas) {
      const rendu = dessinerCarreQuadrille({ cote, mode: "decomposition" });
      assert.equal(rendu.largeur, LARGEUR_CARRE_QUADRILLE);
      assert.equal(rendu.hauteur, HAUTEUR_CARRE_QUADRILLE);
      assert.match(rendu.svg, /viewBox="0 0 240 240"/);
      assert.equal(compter(rendu.svg, /class="cq-partie-dizaine"/g), 1);
      assert.equal(compter(rendu.svg, /class="cq-partie-reste"/g), 1);
      assert.equal(compter(rendu.svg, /class="cq-separation-decomposition"/g), 1);
      assert.equal(compter(rendu.svg, /class="cq-accolade-dizaine"/g), 1);
      assert.equal(compter(rendu.svg, /class="cq-accolade-reste"/g), 1);
      assert.match(rendu.svg, new RegExp(`class="cq-partie-reste" x="${xSeparation}"[^>]*width="${largeurReste}"`));
      assert.match(rendu.svg, new RegExp(`class="cq-separation-decomposition" d="M ${xSeparation} 20 V 188"`));
      assert.match(rendu.svg, /class="cq-largeur-dizaine"[^>]*>10<\/text>/);
      assert.match(rendu.svg, new RegExp(`class="cq-largeur-reste"[^>]*>${reste}<\\/text>`));
      assert.equal(compter(rendu.svg, /class="cq-grille"/g), 1);
      assert.ok(compter(rendu.svg, /<rect\b/g) <= 4);
      assert.ok(rendu.svg.length < 5000);
    }
  });

  it("décrit complètement la décomposition aux lecteurs d'écran", () => {
    const onze = dessinerCarreQuadrille({ cote: 11, mode: "decomposition" });
    assert.match(onze.texteAlternatif, /10 colonnes et 1 colonne/);
    assert.match(onze.texteAlternatif, /11 × 10 \+ 11 × 1 = 121 carreaux/);
    assert.match(onze.svg, /aria-label="Carré quadrillé de 11 rangées et 11 colonnes\./);

    const douze = dessinerCarreQuadrille({ cote: 12, mode: "decomposition" });
    assert.match(douze.texteAlternatif, /10 colonnes et 2 colonnes/);
    assert.match(douze.texteAlternatif, /12 × 10 \+ 12 × 2 = 144 carreaux/);
  });

  it("dessine la grille avec un chemin, jamais avec une case par rectangle", () => {
    for (const cote of [1, 2, 9, 10, 12]) {
      const svg = dessinerCarreQuadrille({ cote }).svg;
      assert.equal(compter(svg, /class="cq-fond"/g), 1);
      assert.equal(compter(svg, /class="cq-contour"/g), 1);
      assert.ok(compter(svg, /<rect\b/g) <= 3, `${cote} : trop de rectangles`);
      assert.equal(compter(svg, /class="cq-grille"/g), cote === 1 ? 0 : 1);
      assert.ok(svg.length < 4000, `${cote} : SVG trop lourd (${svg.length} caractères)`);
    }
  });

  it("met en évidence une rangée et une colonne sans multiplier les carreaux", () => {
    const svg = dessinerCarreQuadrille({
      cote: 12,
      miseEnEvidence: { ligne: 12, colonne: 1 },
    }).svg;
    assert.equal(compter(svg, /class="cq-ligne-active"/g), 1);
    assert.equal(compter(svg, /class="cq-colonne-active"/g), 1);
    assert.match(
      svg,
      new RegExp(
        `class="cq-ligne-active"[^>]*fill="${COULEURS_CARRE_QUADRILLE.ligne}"`,
      ),
    );
    assert.match(
      svg,
      new RegExp(
        `class="cq-colonne-active"[^>]*fill="${COULEURS_CARRE_QUADRILLE.colonne}"`,
      ),
    );
    assert.equal(compter(svg, /<rect\b/g), 5);
    assert.ok(svg.length < 4500);

    for (const miseEnEvidence of [
      { ligne: 0, colonne: 1 },
      { ligne: 1, colonne: 13 },
      { ligne: 1.5, colonne: 2 },
      { ligne: 2 },
      true,
    ]) {
      assert.throws(
        () => dessinerCarreQuadrille({ cote: 12, miseEnEvidence }),
        /miseEnEvidence|ligne et colonne/,
      );
    }
    assert.throws(
      () =>
        dessinerCarreQuadrille({
          cote: 7,
          mode: "cote-inconnu",
          miseEnEvidence: { ligne: 1, colonne: 1 },
        }),
      /quadrillage visible/,
    );
  });

  it("ne révèle pas le côté recherché dans le SVG du mode inverse", () => {
    const rendu = dessinerCarreQuadrille({ cote: 7, mode: "cote-inconnu" });
    assert.equal(rendu.aire, 49);
    assert.match(rendu.svg, />49<\/tspan>/);
    assert.match(rendu.svg, />carreaux<\/tspan>/);
    assert.match(rendu.svg, /Ses deux côtés, de même longueur, sont à trouver/);
    assert.equal(compter(rendu.svg, /class="cq-etiquette-aire"/g), 1);
    assert.ok(!rendu.svg.includes("7 rangées"));
    assert.ok(!rendu.svg.includes("7 colonnes"));
    assert.ok(!rendu.svg.includes("cq-grille"));
  });

  it("aligne les chiffres du total avec la police mathématique commune", () => {
    const svg = dessinerCarreQuadrille({ cote: 8 }).svg;
    assert.match(
      svg,
      /<tspan[^>]*font-family="'Times New Roman', Times, 'Liberation Serif', serif"[^>]*font-weight="700"[^>]*style="[^"]*lining-nums tabular-nums[^"]*'lnum' 1, 'tnum' 1;"[^>]*>64<\/tspan>/,
    );
    assert.match(
      svg,
      /<tspan[^>]*font-family="'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"[^>]*>carreaux<\/tspan>/,
    );
    const svg81 = dessinerCarreQuadrille({ cote: 9 }).svg;
    assert.match(
      svg81,
      /<tspan[^>]*font-family="'Times New Roman', Times, 'Liberation Serif', serif"[^>]*font-weight="700"[^>]*style="[^"]*lining-nums tabular-nums[^"]*'lnum' 1, 'tnum' 1;"[^>]*>81<\/tspan>/,
    );
    assert.equal(compter(svg81, />81<\/tspan>/g), 1);
  });

  it("garde des angles droits dans tous les rendus, y compris les cartouches centraux", () => {
    const rendus = [
      dessinerCarreQuadrille({
        cote: 9,
        mode: "sens",
        miseEnEvidence: { ligne: 1, colonne: 1 },
      }),
      dessinerCarreQuadrille({ cote: 9, mode: "aire-inconnue" }),
      dessinerCarreQuadrille({ cote: 9, mode: "cote-inconnu" }),
      dessinerCarreQuadrille({ cote: 12, mode: "decomposition" }),
    ];

    for (const rendu of rendus) {
      assert.doesNotMatch(rendu.svg, /\brx\s*=/);
    }
  });

  it("garde les côtés très courts et réserve les mots au texte accessible", () => {
    const sens = dessinerCarreQuadrille({ cote: 1 }).svg;
    assert.match(sens, /aria-label="Carré quadrillé de 1 rangée et 1 colonne, soit 1 carreau\./);
    assert.match(sens, /class="cq-cote"[^>]*>1<\/text>/);
    assert.match(sens, />1<\/tspan><tspan[^>]*>carreau<\/tspan>/);
    assert.doesNotMatch(sens, /1 rangées|1 colonnes|1 carreaux/);
  });

  it("ne place jamais les mots rangées, colonnes ou aire dans le dessin", () => {
    for (const mode of MODES_CARRE_QUADRILLE.filter((mode) => mode !== "decomposition")) {
      const svg = dessinerCarreQuadrille({ cote: 12, mode }).svg;
      const contenuVisible = svg.replace(/aria-label="[^"]*"/, "");
      assert.doesNotMatch(contenuVisible, /rangée|colonne|Aire\s*:/i);
    }
  });

  it("garde l’étiquette centrale à au moins dix unités du contour", () => {
    for (const mode of MODES_CARRE_QUADRILLE.filter((mode) => mode !== "decomposition")) {
      const boite = boiteEtiquetteAire(dessinerCarreQuadrille({ cote: 12, mode }).svg);
      assert.ok(boite.x >= 62);
      assert.ok(boite.y >= 30);
      assert.ok(boite.x + boite.largeur <= 210);
      assert.ok(boite.y + boite.hauteur <= 178);
    }
  });

  it("permet un nom accessible personnalisé et l'échappe", () => {
    const rendu = dessinerCarreQuadrille({
      cote: 4,
      texteAlternatif: 'Schéma "guidé" <sans réponse>',
    });
    assert.match(
      rendu.svg,
      /aria-label="Schéma &quot;guidé&quot; &lt;sans réponse&gt;"/,
    );
    assert.equal(rendu.texteAlternatif, 'Schéma "guidé" <sans réponse>');
    assert.throws(() => dessinerCarreQuadrille({ texteAlternatif: "  " }), TypeError);
  });

  it("n'emploie ni caractère exposant ni balise d'exposant", () => {
    for (const mode of MODES_CARRE_QUADRILLE) {
      const svg = dessinerCarreQuadrille({ cote: 12, mode }).svg;
      assert.ok(!svg.includes("²"));
      assert.ok(!svg.includes("<sup"));
      assert.ok(!svg.includes("^2"));
    }
  });

  it("ne prend ses couleurs que dans la charte", () => {
    const autorisees = new Set(Object.values(COULEURS));
    for (const couleur of Object.values(COULEURS_CARRE_QUADRILLE)) {
      assert.ok(autorisees.has(couleur), `couleur hors charte : ${couleur}`);
    }
  });
});
