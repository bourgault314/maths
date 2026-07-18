import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RAD,
  aire,
  aireSignee,
  angleInterieurPolygone,
  axesSymetrie,
  centreSymetrie,
  centroide,
  distance,
  estDansPolygone,
  intersectionSegments,
  milieu,
  normaliserAngle,
  perimetre,
  pointsArc,
  secteurAngulaire,
  sommetsCarre,
  sommetsCerfVolant,
  sommetsLosange,
  sommetsParallelogramme,
  sommetsPolygoneRegulier,
  sommetsQuadrilatere,
  sommetsRectangle,
  sommetsTrapeze,
  sommetsTrapezeIsocele,
  sommetsTrapezeRectangle,
  sommetsTriangle,
  sontParalleles,
  sontPerpendiculaires,
  transformer,
} from "./geometrie.js";

const proche = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} attendu proche de ${b}`);

// L'angle intérieur au sommet i, recalculé indépendamment (produit scalaire).
function angleParProduitScalaire(sommets, i) {
  const n = sommets.length;
  const v = sommets[i];
  const p = sommets[(i + 1) % n];
  const q = sommets[(i - 1 + n) % n];
  const u1 = [p[0] - v[0], p[1] - v[1]];
  const u2 = [q[0] - v[0], q[1] - v[1]];
  const c =
    (u1[0] * u2[0] + u1[1] * u2[1]) / (Math.hypot(...u1) * Math.hypot(...u2));
  return Math.acos(Math.min(1, Math.max(-1, c))) / RAD;
}

describe("secteurAngulaire — la batterie du cahier des charges", () => {
  it("retrouve chaque angle dans les huit orientations principales", () => {
    // angles imposés par le cahier des charges, orientations tous les 45°
    for (const angleDeg of [10, 45, 90, 135, 179, 180, 220, 350]) {
      for (let orientation = 0; orientation < 360; orientation += 45) {
        const depart = orientation * RAD;
        const v = [2, -3];
        const versA = [v[0] + Math.cos(depart), v[1] + Math.sin(depart)];
        const arrivee = depart + angleDeg * RAD;
        const versB = [v[0] + Math.cos(arrivee), v[1] + Math.sin(arrivee)];
        const dedans = depart + (angleDeg / 2) * RAD;
        const interieur = [v[0] + Math.cos(dedans), v[1] + Math.sin(dedans)];

        const secteur = secteurAngulaire(v, versA, versB, interieur);
        proche(secteur.delta / RAD, angleDeg, 1e-9);
        // la bissectrice du secteur rendu pointe bien vers le point
        // intérieur (écart angulaire modulo 2π, car 0 et 2π se confondent)
        const bissectrice = secteur.depart + secteur.delta / 2;
        const ecart = Math.abs(
          normaliserAngle(bissectrice - dedans + Math.PI) - Math.PI,
        );
        proche(ecart, 0, 1e-9);
      }
    }
  });

  it("sans point intérieur, rend toujours le secteur non rentrant", () => {
    for (const angleDeg of [10, 90, 179, 181, 220, 350]) {
      const v = [0, 0];
      const versA = [1, 0];
      const versB = [Math.cos(angleDeg * RAD), Math.sin(angleDeg * RAD)];
      const secteur = secteurAngulaire(v, versA, versB);
      proche(secteur.delta / RAD, Math.min(angleDeg, 360 - angleDeg), 1e-9);
    }
  });

  it("avec point intérieur du côté rentrant, rend l'angle rentrant", () => {
    const v = [0, 0];
    const versA = [1, 0];
    const versB = [0, 1]; // petit secteur : 90°, rentrant : 270°
    const secteur = secteurAngulaire(v, versA, versB, [-1, -1]);
    proche(secteur.delta / RAD, 270, 1e-9);
  });
});

describe("angleInterieurPolygone", () => {
  it("triangle : somme 180°, dans les deux sens de parcours", () => {
    const t = [[0, 0], [5, 1], [2, 4]];
    for (const sommets of [t, [...t].reverse()]) {
      const somme = [0, 1, 2]
        .map((i) => angleInterieurPolygone(sommets, i).mesureDeg)
        .reduce((a, b) => a + b, 0);
      proche(somme, 180, 1e-9);
    }
  });

  it("quadrilatère concave : l'angle rentrant est bien > 180° et la somme fait 360°", () => {
    const concave = [[0, 0], [6, 0], [6, 4], [2, 1]]; // rentrant au 4e sommet
    const mesures = [0, 1, 2, 3].map(
      (i) => angleInterieurPolygone(concave, i).mesureDeg,
    );
    proche(mesures.reduce((a, b) => a + b, 0), 360, 1e-9);
    assert.ok(mesures[3] > 180, `angle rentrant attendu, obtenu ${mesures[3]}°`);
  });

  it("rotation complète de 0° à 359° : l'arc reste TOUJOURS dans la figure", () => {
    const base = sommetsTriangle({ angles: [50, 60, 70] });
    for (let rotation = 0; rotation < 360; rotation++) {
      const sommets = transformer(base, { rotationDeg: rotation });
      for (let i = 0; i < 3; i++) {
        const { depart, delta, mesureDeg } = angleInterieurPolygone(sommets, i);
        proche(mesureDeg, angleParProduitScalaire(sommets, i), 1e-6);
        // chaque point INTERMÉDIAIRE de l'arc est strictement dans le
        // triangle (les deux extrémités sont posées sur les côtés)
        const rayon = 0.05;
        for (const p of pointsArc(sommets[i], rayon, depart, delta).slice(1, -1)) {
          assert.ok(
            estDansPolygone(p, sommets),
            `rotation ${rotation}°, sommet ${i} : point d'arc hors de la figure`,
          );
        }
      }
    }
  });

  it("carré sous rotation et miroir : quatre angles droits, toujours", () => {
    const base = sommetsCarre({ cote: 4 });
    for (const options of [
      { rotationDeg: 30 },
      { rotationDeg: 217 },
      { miroirX: true, rotationDeg: 61 },
      { miroirY: true, rotationDeg: 118 },
    ]) {
      const sommets = transformer(base, options);
      for (let i = 0; i < 4; i++) {
        proche(angleInterieurPolygone(sommets, i).mesureDeg, 90, 1e-9);
      }
    }
  });
});

describe("primitives", () => {
  it("distance, milieu, aire, périmètre, centroïde", () => {
    proche(distance([0, 0], [3, 4]), 5);
    assert.deepEqual(milieu([0, 0], [4, 6]), [2, 3]);
    proche(aire(sommetsRectangle({ largeur: 6, hauteur: 4 })), 24);
    proche(perimetre(sommetsRectangle({ largeur: 6, hauteur: 4 })), 20);
    assert.deepEqual(centroide([[0, 0], [4, 0], [4, 4], [0, 4]]), [2, 2]);
  });

  it("aire signée : positive dans le sens direct, négative dans l'autre", () => {
    const carre = sommetsCarre({ cote: 2 });
    assert.ok(aireSignee(carre) > 0);
    assert.ok(aireSignee([...carre].reverse()) < 0);
  });

  it("intersection de segments : diagonales d'un carré en (2, 2)", () => {
    const p = intersectionSegments([0, 0], [4, 4], [4, 0], [0, 4]);
    proche(p[0], 2);
    proche(p[1], 2);
    assert.equal(intersectionSegments([0, 0], [1, 0], [0, 1], [1, 1]), null);
  });

  it("parallélisme et perpendicularité", () => {
    assert.ok(sontParalleles([0, 0], [2, 1], [4, 0], [8, 2]));
    assert.ok(!sontParalleles([0, 0], [2, 1], [0, 0], [2, 1.001]));
    assert.ok(sontPerpendiculaires([0, 0], [2, 1], [0, 0], [-1, 2]));
    assert.ok(!sontPerpendiculaires([0, 0], [2, 1], [0, 0], [2, 1]));
  });
});

describe("constructeurs de quadrilatères — les invariants du cahier des charges", () => {
  const diagonalesMemeMilieu = (s) =>
    distance(milieu(s[0], s[2]), milieu(s[1], s[3])) < 1e-9;

  it("parallélogramme : côtés opposés parallèles et égaux, diagonales de même milieu", () => {
    const s = sommetsParallelogramme({ base: 6, cote: 3.5, angleDeg: 65 });
    assert.ok(sontParalleles(s[0], s[1], s[3], s[2]));
    assert.ok(sontParalleles(s[1], s[2], s[0], s[3]));
    proche(distance(s[0], s[1]), distance(s[3], s[2]));
    proche(distance(s[1], s[2]), distance(s[0], s[3]));
    assert.ok(diagonalesMemeMilieu(s));
    assert.ok(centreSymetrie(s) !== null);
    assert.equal(axesSymetrie(s).length, 0);
  });

  it("rectangle : quatre angles droits, diagonales égales, deux axes", () => {
    const s = sommetsRectangle({ largeur: 6, hauteur: 4 });
    for (let i = 0; i < 4; i++) proche(angleInterieurPolygone(s, i).mesureDeg, 90);
    proche(distance(s[0], s[2]), distance(s[1], s[3]));
    assert.ok(diagonalesMemeMilieu(s));
    assert.equal(axesSymetrie(s).length, 2);
  });

  it("losange : quatre côtés égaux, diagonales perpendiculaires, deux axes", () => {
    for (const s of [
      sommetsLosange({ cote: 4, angleDeg: 65 }),
      sommetsLosange({ diagonales: [6, 3] }),
    ]) {
      const cotes = [0, 1, 2, 3].map((i) => distance(s[i], s[(i + 1) % 4]));
      cotes.forEach((c) => proche(c, cotes[0]));
      assert.ok(sontPerpendiculaires(s[0], s[2], s[1], s[3]));
      assert.ok(diagonalesMemeMilieu(s));
      assert.equal(axesSymetrie(s).length, 2);
    }
  });

  it("carré : rectangle ET losange à la fois, quatre axes", () => {
    const s = sommetsCarre({ cote: 4 });
    for (let i = 0; i < 4; i++) proche(angleInterieurPolygone(s, i).mesureDeg, 90);
    const cotes = [0, 1, 2, 3].map((i) => distance(s[i], s[(i + 1) % 4]));
    cotes.forEach((c) => proche(c, 4));
    proche(distance(s[0], s[2]), distance(s[1], s[3]));
    assert.ok(sontPerpendiculaires(s[0], s[2], s[1], s[3]));
    assert.equal(axesSymetrie(s).length, 4);
  });

  it("trapèzes : bases parallèles ; rectangle → deux angles droits ; isocèle → côtés obliques égaux et un axe", () => {
    const t = sommetsTrapeze({ grandeBase: 7, petiteBase: 4, hauteur: 3, decalage: 1 });
    assert.ok(sontParalleles(t[0], t[1], t[3], t[2]));

    const tr = sommetsTrapezeRectangle({ grandeBase: 7, petiteBase: 4, hauteur: 3 });
    proche(angleInterieurPolygone(tr, 0).mesureDeg, 90);
    proche(angleInterieurPolygone(tr, 3).mesureDeg, 90);

    const ti = sommetsTrapezeIsocele({ grandeBase: 7, petiteBase: 4, hauteur: 3 });
    proche(distance(ti[1], ti[2]), distance(ti[0], ti[3]));
    proche(
      angleInterieurPolygone(ti, 0).mesureDeg,
      angleInterieurPolygone(ti, 1).mesureDeg,
    );
    assert.equal(axesSymetrie(ti).length, 1);
  });

  it("cerf-volant : deux paires de côtés consécutifs égaux, un axe (la diagonale principale)", () => {
    const s = sommetsCerfVolant({ diagonalePrincipale: 6, diagonaleSecondaire: 4 });
    proche(distance(s[0], s[1]), distance(s[0], s[3]));
    proche(distance(s[2], s[1]), distance(s[2], s[3]));
    assert.ok(sontPerpendiculaires(s[0], s[2], s[1], s[3]));
    const axes = axesSymetrie(s);
    assert.equal(axes.length, 1);
    // l'axe est porté par la diagonale principale (x = 0)
    proche(axes[0][0][0], 0, 1e-7);
    proche(axes[0][1][0], 0, 1e-7);
  });

  it("quadrilatère quelconque : accepté dans l'ordre du tour, refusé si croisé", () => {
    const s = sommetsQuadrilatere({ points: [[0, 0], [5, 0], [6, 3], [1, 4]] });
    assert.equal(s.length, 4);
    assert.throws(
      () => sommetsQuadrilatere({ points: [[0, 0], [5, 0], [1, 4], [6, 3]] }),
      /croisée/,
    );
    assert.throws(() => sommetsQuadrilatere({ points: [[0, 0], [1, 1]] }), /quatre sommets/);
  });

  it("refuse les dimensions invalides avec des messages clairs", () => {
    assert.throws(() => sommetsCarre({ cote: 0 }), /strictement positif/);
    assert.throws(() => sommetsRectangle({ largeur: -2 }), /strictement positif/);
    assert.throws(() => sommetsParallelogramme({ angleDeg: 180 }), /entre 0° et 180°/);
    assert.throws(() => sommetsCerfVolant({ position: 1.2 }), /entre 0 et 1/);
  });
});

describe("polygones réguliers", () => {
  it("pentagone : cinq côtés égaux, angles de 108°, cinq axes", () => {
    const s = sommetsPolygoneRegulier({ nbCotes: 5, cote: 3 });
    for (let i = 0; i < 5; i++) {
      proche(distance(s[i], s[(i + 1) % 5]), 3, 1e-9);
      proche(angleInterieurPolygone(s, i).mesureDeg, 108, 1e-9);
    }
    assert.equal(axesSymetrie(s).length, 5);
  });

  it("hexagone : six axes et un centre de symétrie", () => {
    const s = sommetsPolygoneRegulier({ nbCotes: 6, rayon: 2 });
    assert.equal(axesSymetrie(s).length, 6);
    assert.ok(centreSymetrie(s) !== null);
  });

  it("est posé sur un côté horizontal en bas", () => {
    const s = sommetsPolygoneRegulier({ nbCotes: 5, cote: 3 });
    const ymin = Math.min(...s.map((p) => p[1]));
    const enBas = s.filter((p) => Math.abs(p[1] - ymin) < 1e-9);
    assert.equal(enBas.length, 2);
  });
});

describe("triangles — familles", () => {
  it("équilatéral : trois côtés, trois angles de 60°, trois axes", () => {
    const s = sommetsTriangle({ famille: "equilateral", cote: 4 });
    for (let i = 0; i < 3; i++) {
      proche(distance(s[i], s[(i + 1) % 3]), 4, 1e-9);
      proche(angleInterieurPolygone(s, i).mesureDeg, 60, 1e-9);
    }
    assert.equal(axesSymetrie(s).length, 3);
  });

  it("rectangle : angle droit au premier sommet, cathètes respectées", () => {
    const s = sommetsTriangle({ famille: "rectangle", cathetes: [4, 3] });
    proche(angleInterieurPolygone(s, 0).mesureDeg, 90);
    proche(distance(s[0], s[1]), 4);
    proche(distance(s[0], s[2]), 3);
    proche(distance(s[1], s[2]), 5); // Pythagore, évidemment
  });

  it("isocèle : angle au sommet respecté, un axe de symétrie", () => {
    const s = sommetsTriangle({ famille: "isocele", base: 4, sommetDeg: 40 });
    proche(angleInterieurPolygone(s, 2).mesureDeg, 40, 1e-9);
    proche(distance(s[0], s[2]), distance(s[1], s[2]));
    assert.equal(axesSymetrie(s).length, 1);
  });

  it("par angles ou par côtés : le moteur exact du triangle v1", () => {
    const s = sommetsTriangle({ angles: [50, 60, 70] });
    proche(angleInterieurPolygone(s, 0).mesureDeg, 50, 1e-6);
    proche(angleInterieurPolygone(s, 1).mesureDeg, 60, 1e-6);
    const t = sommetsTriangle({ cotes: [5, 4, 3] });
    proche(angleInterieurPolygone(t, 0).mesureDeg, 90, 1e-6);
    assert.throws(() => sommetsTriangle({ angles: [90, 60, 60] }), /somme des angles/);
    assert.throws(() => sommetsTriangle({ cotes: [1, 2, 5] }), /inégalité triangulaire/);
    assert.throws(() => sommetsTriangle({}), /soit trois angles/);
  });
});

describe("transformer", () => {
  it("rotation : conserve toutes les longueurs et toutes les aires", () => {
    const base = sommetsTrapeze({});
    for (const rotationDeg of [17, 90, 233]) {
      const s = transformer(base, { rotationDeg });
      proche(perimetre(s), perimetre(base), 1e-9);
      proche(aire(s), aire(base), 1e-9);
    }
  });

  it("miroir : renverse l'orientation, échelle : multiplie les longueurs", () => {
    const base = sommetsTriangle({ angles: [50, 60, 70] });
    assert.ok(aireSignee(transformer(base, { miroirX: true })) * aireSignee(base) < 0);
    const double = transformer(base, { echelle: 2 });
    proche(perimetre(double), 2 * perimetre(base), 1e-9);
  });

  it("refuse une échelle nulle ou négative", () => {
    assert.throws(() => transformer([[0, 0]], { echelle: 0 }), /strictement positive/);
  });
});
