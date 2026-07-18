import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dessinerAngle,
  dessinerCercle,
  dessinerDemiDroite,
  dessinerDroite,
  dessinerFigure,
  dessinerPoint,
  dessinerSegment,
} from "./figure.js";
import { decrireDemiCercle, decrirePolygoneQuelconque } from "./figures-usuelles.js";
import {
  sommetsParallelogramme,
  sommetsPolygoneRegulier,
  sommetsTriangle,
} from "./geometrie.js";

const lignesDe = (svg) =>
  [...svg.matchAll(/<line x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/g)].map(
    (m) => m.slice(1, 5).map(Number),
  );

describe("dessinerPoint — la croix maths&go", () => {
  it("croix exactement centrée, zone tactile invisible plus large", () => {
    const svg = dessinerPoint({ nom: "M" });
    // les deux traits de la croix se croisent au centre de la boîte (32, 32)
    const traits = lignesDe(svg);
    assert.equal(traits.length, 2);
    for (const [x1, y1, x2, y2] of traits) {
      assert.ok(Math.abs((x1 + x2) / 2 - 32) < 0.05, "croix décentrée en x");
      assert.ok(Math.abs((y1 + y2) / 2 - 32) < 0.05, "croix décentrée en y");
    }
    assert.match(svg, /<circle[^>]*r="22"[^>]*fill="rgba\(0,0,0,0\)"/);
    assert.match(svg, />M</);
  });

  it("croix et nom masquables, couleurs séparées", () => {
    const sans = dessinerPoint({ afficherCroix: false, afficherNom: false });
    assert.equal(lignesDe(sans).length, 0);
    assert.ok(!sans.includes(">A<"));
    const colore = dessinerPoint({ couleur: "#dc2626", couleurNom: "#1d4ed8" });
    assert.match(colore, /stroke="#dc2626"/);
    assert.match(colore, /fill="#1d4ed8"[^>]*>A</);
  });
});

describe("dessinerSegment", () => {
  it("mesure française, texte imposé, codage, milieu", () => {
    const svg = dessinerSegment({
      nom: "AB",
      longueur: 4.5,
      mesure: true,
      codage: 2,
      milieuVisible: true,
      nomMilieu: "I",
    });
    assert.match(svg, />4,5 cm</);
    assert.match(svg, />I</);
    // 1 segment + 2 traits de codage + 2 croix extrémités (4) + 2 croix milieu...
    assert.ok(lignesDe(svg).length >= 7);
    assert.match(dessinerSegment({ texteMesure: "?" }), />\?</);
  });

  it("tourné : aucune valeur non finie, noms toujours présents", () => {
    for (const rotationDeg of [0, 37, 90, 180, 271]) {
      const svg = dessinerSegment({ rotationDeg });
      assert.ok(!/NaN|Infinity/.test(svg), `rotation ${rotationDeg}`);
      assert.match(svg, />A</);
      assert.match(svg, />B</);
    }
  });

  it("refuse les données invalides", () => {
    assert.throws(() => dessinerSegment({ nom: "abc" }), /deux lettres/);
    assert.throws(() => dessinerSegment({ longueur: -1 }), /strictement positif/);
  });
});

describe("dessinerDroite et dessinerDemiDroite", () => {
  it("la droite est prolongée jusqu'au cadre, même verticale", () => {
    for (const rotationDeg of [0, 30, 89.6, 90, 90.4, 150]) {
      const svg = dessinerDroite({ rotationDeg });
      assert.ok(!/NaN|Infinity/.test(svg), `rotation ${rotationDeg}`);
      const [premiere] = lignesDe(svg);
      const longueur = Math.hypot(premiere[2] - premiere[0], premiere[3] - premiere[1]);
      assert.ok(longueur > 150, `droite trop courte (${longueur}px) à ${rotationDeg}°`);
    }
    // verticale exacte : les deux extrémités ont la même abscisse
    const [verticale] = lignesDe(dessinerDroite({ rotationDeg: 90 }));
    assert.ok(Math.abs(verticale[0] - verticale[2]) < 0.05);
  });

  it("la demi-droite a UNE flèche du côté infini et une origine en croix", () => {
    const svg = dessinerDemiDroite({ nomsPoints: "AB" });
    assert.match(svg, />A</);
    assert.match(svg, />B</);
    // le tracé : 1 porteur + 2 branches de flèche + 2×2 croix = 7 lignes
    assert.equal(lignesDe(svg).length, 7);
  });
});

describe("dessinerAngle — la primitive angle", () => {
  it("aigu, obtus, plat, rentrant : arc présent, mesure française", () => {
    for (const mesureDeg of [30, 90.5, 135, 180, 220, 300]) {
      const svg = dessinerAngle({ mesureDeg });
      assert.ok(!/NaN|Infinity/.test(svg));
      assert.match(svg, /<polyline/);
      assert.match(svg, new RegExp(`>${String(mesureDeg).replace(".", ",")}°<`));
    }
  });

  it("angle droit : marque carrée, pas de valeur", () => {
    const svg = dessinerAngle({ mesureDeg: 90 });
    const marques = svg.match(/<polyline points="[^"]*"/g) ?? [];
    assert.equal(marques.length, 1);
    assert.equal(marques[0].split(" ").length - 1, 3); // trois points : un carré
    assert.ok(!svg.includes(">90°<"));
  });

  it("arcs multiples, secteur colorié, texte imposé, angle orienté", () => {
    const svg = dessinerAngle({ mesureDeg: 50, arcs: 3, secteur: true, texte: "x" });
    assert.equal((svg.match(/<polyline/g) ?? []).length, 3);
    assert.match(svg, /<polygon[^>]*fill-opacity/);
    assert.match(svg, />x</);
    const oriente = dessinerAngle({ mesureDeg: 60, oriente: true });
    assert.ok(lignesDe(oriente).length >= 4); // 2 côtés + 2 branches de flèche
  });

  it("refuse une mesure hors de ]0°, 360°[", () => {
    assert.throws(() => dessinerAngle({ mesureDeg: 0 }), /entre 0° et 360°/);
    assert.throws(() => dessinerAngle({ mesureDeg: 360 }), /entre 0° et 360°/);
  });
});

describe("cercle enrichi", () => {
  it("les extrémités d'une corde sont exactement SUR le cercle", () => {
    const svg = dessinerCercle({
      rayon: 3,
      visible: { cordes: [{ de: 20, a: 130 }], centre: false },
    });
    const rayonPx = Number(svg.match(/r="([\d.]+)"/)[1]);
    const [cx, cy] = svg.match(/<circle cx="([\d.]+)" cy="([\d.]+)"/).slice(1, 3).map(Number);
    const [corde] = lignesDe(svg);
    for (const [x, y] of [[corde[0], corde[1]], [corde[2], corde[3]]]) {
      assert.ok(Math.abs(Math.hypot(x - cx, y - cy) - rayonPx) < 0.05);
    }
  });

  it("la tangente est PERPENDICULAIRE au rayon au point de tangence", () => {
    const svg = dessinerCercle({
      rayon: 2.5,
      visible: { tangente: { en: 40 }, centre: true },
    });
    const traits = lignesDe(svg);
    // le premier trait est la tangente, le deuxième le rayon pointillé
    const [tx1, ty1, tx2, ty2] = traits[0];
    const [rx1, ry1, rx2, ry2] = traits[1];
    const scalaire =
      (tx2 - tx1) * (rx2 - rx1) + (ty2 - ty1) * (ry2 - ry1);
    const produitNormes =
      Math.hypot(tx2 - tx1, ty2 - ty1) * Math.hypot(rx2 - rx1, ry2 - ry1);
    // tolérance : les coordonnées SVG sont arrondies à 2 décimales
    assert.ok(Math.abs(scalaire / produitNormes) < 1e-3, "tangente non perpendiculaire");
  });

  it("secteur et arcs : dessinés sans cercle complet si demandé", () => {
    const svg = dessinerCercle({
      rayon: 3,
      visible: {
        cercle: false,
        centre: false,
        secteur: { deDeg: 10, aDeg: 100 },
        arcs: [{ deDeg: 10, aDeg: 100 }],
      },
    });
    assert.ok(!/<circle/.test(svg), "aucun cercle complet attendu");
    assert.match(svg, /<polygon/); // le secteur
    assert.match(svg, /<polyline/); // l'arc
  });

  it("plusieurs rayons à la fois", () => {
    const svg = dessinerCercle({
      rayon: 3,
      visible: { rayonsVersDeg: [0, 45, 90], centre: false },
    });
    assert.equal(lignesDe(svg).length, 3);
  });

  it("préréglage demi-cercle : un arc, un diamètre, pas de cercle complet", () => {
    const svg = dessinerCercle(decrireDemiCercle({ rayon: 3 }));
    assert.ok(!/<circle/.test(svg));
    assert.match(svg, /<polyline/);
  });
});

describe("dessinerFigure — les enrichissements du lot", () => {
  it("hauteur d'un parallélogramme : pied perpendiculaire + marque", () => {
    const svg = dessinerFigure({
      sommets: sommetsParallelogramme({}),
      visible: { hauteur: { de: "D", vers: "AB", mesure: true } },
    });
    assert.ok(!/NaN|Infinity/.test(svg));
    // la hauteur est un trait pointillé perpendiculaire à AB (horizontal) : vertical
    const pointillees = [...svg.matchAll(/<line ([^>]*stroke-dasharray="8 6"[^>]*)\/>/g)];
    assert.ok(pointillees.length >= 1);
    assert.match(svg, / cm</); // la mesure de la hauteur
  });

  it("remarquables du triangle : cercles inscrit et circonscrit, centres nommés", () => {
    const svg = dessinerFigure({
      sommets: sommetsTriangle({ angles: [50, 60, 70] }),
      visible: {
        cercleInscrit: true,
        cercleCirconscrit: true,
        centresRemarquables: true,
        medianes: true,
        hauteurs: true,
        mediatrices: true,
        bissectrices: true,
        segmentDesMilieux: true,
      },
    });
    assert.ok(!/NaN|Infinity/.test(svg));
    assert.equal((svg.match(/<circle/g) ?? []).length, 2);
    for (const centre of ["G", "H", "O", "I"]) {
      assert.match(svg, new RegExp(`>${centre}<`));
    }
  });

  it("les remarquables refusent un quadrilatère", () => {
    assert.throws(
      () =>
        dessinerFigure({
          sommets: sommetsParallelogramme({}),
          visible: { medianes: true },
        }),
      /triangles/,
    );
  });

  it("mesures des diagonales et régions coloriées d'un quadrilatère", () => {
    const svg = dessinerFigure({
      sommets: sommetsParallelogramme({}),
      visible: { diagonales: true, mesuresDiagonales: true },
      styles: { regions: { AB: "#dbeafe", CD: "#fee2e2" } },
    });
    assert.equal((svg.match(/<polygon[^>]*fill-opacity="0.55"/g) ?? []).length, 2);
    assert.ok((svg.match(/ cm</g) ?? []).length >= 2);
  });

  it("polygone : rayons, apothème et triangulation", () => {
    const svg = dessinerFigure({
      sommets: sommetsPolygoneRegulier({ nbCotes: 6, cote: 3 }),
      visible: { rayons: true, apotheme: true, triangulation: "A" },
    });
    assert.ok(!/NaN|Infinity/.test(svg));
    // 6 côtés + 6 rayons + 1 apothème + 3 diagonales de triangulation
    assert.equal(lignesDe(svg).length, 16);
  });

  it("placements manuels : le nom suit le décalage imposé", () => {
    const auto = dessinerFigure({ sommets: sommetsTriangle({ angles: [50, 60, 70] }) });
    const force = dessinerFigure({
      sommets: sommetsTriangle({ angles: [50, 60, 70] }),
      placements: { noms: { A: [40, -40] } },
    });
    assert.notEqual(auto, force);
    assert.match(force, />A</);
  });

  it("préréglage polygone quelconque : rendu sans erreur", () => {
    const description = decrirePolygoneQuelconque();
    description.visible = { angles: true, mesuresCotes: true };
    assert.match(dessinerFigure(description), /^<svg /);
  });
});
