// Tests de robustesse du lot « figures géométriques planes ».
//
// 1. Chaque SVG produit est SAIN : pas de NaN ni d'Infinity, viewBox
//    valide, identifiants uniques, textes échappés.
// 2. Générations ALÉATOIRES REPRODUCTIBLES : même graine, mêmes figures
//    (le générateur seedé du moteur d'exercices), en rejetant les
//    figures presque dégénérées comme l'exige le cahier des charges.
// 3. Les propriétés mathématiques survivent à rotation, miroir, échelle.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";
import {
  dessinerAngle,
  dessinerCercle,
  dessinerFigure,
  dessinerPoint,
  dessinerSegment,
} from "./figure.js";
import { FIGURES_USUELLES } from "./figures-usuelles.js";
import {
  aire,
  angleInterieurPolygone,
  perimetre,
  sommetsPolygone,
  sommetsTriangle,
  transformer,
} from "./geometrie.js";

function exigerSvgSain(svg, contexte) {
  assert.ok(!/NaN|Infinity/.test(svg), `${contexte} : NaN ou Infinity dans le SVG`);
  const boite = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  assert.ok(boite, `${contexte} : viewBox absente ou invalide`);
  const [largeur, hauteur] = [Number(boite[1]), Number(boite[2])];
  assert.ok(largeur > 0 && hauteur > 0 && Number.isFinite(largeur) && Number.isFinite(hauteur),
    `${contexte} : dimensions de viewBox invalides`);
  const ids = [...svg.matchAll(/ id="([^"]*)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${contexte} : identifiants SVG dupliqués`);
  // aucun chevron non échappé dans les contenus de texte
  for (const [, contenu] of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
    assert.ok(!contenu.includes("<"), `${contexte} : texte non échappé`);
  }
}

describe("chaque SVG produit est sain", () => {
  it("toutes les figures du registre, avec tout affiché, sous rotation", () => {
    for (const [cle, entree] of Object.entries(FIGURES_USUELLES)) {
      const description = entree.decrire();
      if (entree.genre === "polygone") {
        description.transform = { rotationDeg: 123, miroirX: true };
        description.visible = {
          sommets: true, angles: true, mesuresAngles: true, mesuresCotes: true,
          diagonales: true, mesuresDiagonales: true, centre: true, axes: true, milieux: true,
        };
        exigerSvgSain(dessinerFigure(description), cle);
      } else {
        exigerSvgSain(dessinerCercle(description), cle);
      }
    }
  });

  it("les primitives autonomes", () => {
    exigerSvgSain(dessinerPoint({ nom: "M" }), "point");
    exigerSvgSain(dessinerSegment({ mesure: true, codage: 3, rotationDeg: 67 }), "segment");
    exigerSvgSain(dessinerAngle({ mesureDeg: 220, arcs: 2, secteur: true }), "angle");
  });

  it("l'échappement neutralise un nom hostile partout", () => {
    const svg = dessinerCercle({ rayon: 2, nomCentre: `<script>alert(1)</script>` });
    assert.ok(!svg.includes("<script"), "HTML non neutralisé");
  });
});

describe("générations aléatoires reproductibles (graine du moteur)", () => {
  it("400 triangles aléatoires valides : tout est sain, tout est exact", () => {
    const de = creerGenerateur("figures-planes-2026");
    for (let tour = 0; tour < 400; tour++) {
      // angles tirés pour être TOUJOURS lisibles (chaque angle >= 12°)
      const angle1 = de.entier(12, 140);
      const angle2 = de.entier(12, Math.min(150, 168 - angle1));
      const angles = [angle1, angle2, 180 - angle1 - angle2];
      const rotationDeg = de.entier(0, 359);
      const sommets = transformer(sommetsTriangle({ angles }), {
        rotationDeg,
        miroirX: de.reel() < 0.5,
      });
      // les angles survivent à la transformation
      const mesures = [0, 1, 2].map((i) => angleInterieurPolygone(sommets, i).mesureDeg);
      const attendus = [...angles].sort((a, b) => a - b);
      const obtenus = [...mesures].sort((a, b) => a - b);
      for (let i = 0; i < 3; i++) {
        assert.ok(Math.abs(obtenus[i] - attendus[i]) < 1e-6, `tour ${tour} : angle faux`);
      }
      exigerSvgSain(
        dessinerFigure({
          sommets,
          visible: { angles: true, mesuresAngles: true, mesuresCotes: true },
          styles: { theme: de.reel() < 0.5 ? "noir" : "couleur" },
        }),
        `triangle aléatoire ${tour}`,
      );
    }
  });

  it("200 polygones étoilés aléatoires : simples, sains, aire conservée en rotation", () => {
    const de = creerGenerateur("polygones-2026");
    for (let tour = 0; tour < 200; tour++) {
      const nbCotes = de.entier(3, 9);
      // sommets en étoile autour de l'origine : toujours un polygone simple
      const points = [];
      for (let k = 0; k < nbCotes; k++) {
        const angle = ((k + de.reel() * 0.55) / nbCotes) * 2 * Math.PI;
        const rayon = 2 + de.reel() * 3;
        points.push([Math.cos(angle) * rayon, Math.sin(angle) * rayon]);
      }
      const sommets = sommetsPolygone({ points }); // valide : ni croisé ni dégénéré
      const tournes = transformer(sommets, { rotationDeg: de.entier(0, 359) });
      assert.ok(Math.abs(aire(tournes) - aire(sommets)) < 1e-9, "aire non conservée");
      assert.ok(Math.abs(perimetre(tournes) - perimetre(sommets)) < 1e-9, "périmètre non conservé");
      exigerSvgSain(
        dessinerFigure({ sommets: tournes, visible: { angles: true } }),
        `polygone aléatoire ${tour}`,
      );
    }
  });

  it("même graine → exactement les mêmes SVG (reproductibilité)", () => {
    const produire = () => {
      const de = creerGenerateur("preuve-reproductible");
      const svgs = [];
      for (let tour = 0; tour < 12; tour++) {
        const angle1 = de.entier(20, 100);
        const angle2 = de.entier(20, 160 - angle1);
        svgs.push(
          dessinerFigure({
            sommets: sommetsTriangle({ angles: [angle1, angle2, 180 - angle1 - angle2] }),
            transform: { rotationDeg: de.entier(0, 359) },
            visible: { angles: true, mesuresAngles: true },
          }),
        );
      }
      return svgs.join("\n");
    };
    assert.equal(produire(), produire());
  });

  it("l'échelle multiplie les longueurs sans déformer les angles", () => {
    const de = creerGenerateur("echelles-2026");
    for (let tour = 0; tour < 50; tour++) {
      const sommets = sommetsTriangle({
        angles: (() => {
          const angle1 = de.entier(20, 120);
          const angle2 = de.entier(20, 160 - angle1);
          return [angle1, angle2, 180 - angle1 - angle2];
        })(),
      });
      const facteur = 0.5 + de.reel() * 3;
      const agrandis = transformer(sommets, { echelle: facteur });
      assert.ok(Math.abs(perimetre(agrandis) - facteur * perimetre(sommets)) < 1e-9);
      for (let i = 0; i < 3; i++) {
        assert.ok(
          Math.abs(
            angleInterieurPolygone(agrandis, i).mesureDeg -
              angleInterieurPolygone(sommets, i).mesureDeg,
          ) < 1e-9,
          "angle déformé par l'échelle",
        );
      }
    }
  });
});
