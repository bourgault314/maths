import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  angleAuSommet,
  calculerSommets,
  dessinerTriangle,
} from "./triangle.js";

describe("calculerSommets — exactitude mathématique", () => {
  it("les angles dessinés sont EXACTEMENT les angles demandés", () => {
    for (const angles of [[50, 60, 70], [90, 45, 45], [120, 40, 20], [33.5, 66.5, 80]]) {
      const sommets = calculerSommets({ angles });
      angles.forEach((attendu, i) => {
        const reel = angleAuSommet(sommets, i);
        assert.ok(
          Math.abs(reel - attendu) < 1e-3,
          `angle ${i} : ${reel}° au lieu de ${attendu}°`,
        );
      });
    }
  });

  it("avec trois côtés, les longueurs sont respectées (3-4-5 rectangle)", () => {
    const sommets = calculerSommets({ cotes: [5, 4, 3] });
    // côté a=5 opposé au sommet 1 → entre sommets 2 et 3, etc.
    const longueur = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    assert.ok(Math.abs(longueur(sommets[1], sommets[2]) - 5) < 1e-9);
    assert.ok(Math.abs(longueur(sommets[0], sommets[2]) - 4) < 1e-9);
    assert.ok(Math.abs(longueur(sommets[0], sommets[1]) - 3) < 1e-9);
    // et l'angle opposé à l'hypoténuse est droit
    assert.ok(Math.abs(angleAuSommet(sommets, 0) - 90) < 1e-6);
  });

  it("refuse les triangles impossibles, avec des messages clairs", () => {
    assert.throws(() => calculerSommets({ angles: [90, 60, 60] }), /somme des angles/);
    assert.throws(() => calculerSommets({ angles: [0, 90, 90] }), /strictement positifs/);
    assert.throws(() => calculerSommets({ cotes: [1, 2, 5] }), /inégalité triangulaire/);
    assert.throws(() => calculerSommets({}), /soit trois angles, soit trois côtés/);
  });
});

describe("dessinerTriangle", () => {
  it("produit un SVG déterministe avec les trois lettres et les arcs colorés", () => {
    const a = dessinerTriangle({ nom: "ABC", angles: [50, 60, 70] });
    assert.equal(a, dessinerTriangle({ nom: "ABC", angles: [50, 60, 70] }));
    for (const lettre of ["A", "B", "C"]) assert.match(a, new RegExp(`>${lettre}<`));
    assert.equal((a.match(/<path/g) || []).length, 3); // trois arcs d'angle
    assert.match(a, />50°</);
    assert.match(a, />70°</);
  });

  it("marque l'angle droit d'un carré rouge au lieu d'un arc", () => {
    const svg = dessinerTriangle({ nom: "RST", angles: [90, 35, 55] });
    assert.match(svg, /<polyline[^>]*stroke="#ef4444"/);
    assert.equal((svg.match(/<path/g) || []).length, 2); // seulement 2 arcs
    assert.ok(!svg.includes(">90°<"), "pas de valeur affichée sur l'angle droit");
  });

  it("affiche les longueurs des côtés à la demande, virgule française", () => {
    const svg = dessinerTriangle({
      nom: "DEF",
      cotes: [5, 4.5, 3],
      afficherCotes: true,
      afficherAngles: false,
    });
    assert.match(svg, />4,5 cm</);
    assert.equal((svg.match(/<path/g) || []).length, 0);
  });

  it("se décrit aux lecteurs d'écran avec ses angles réels", () => {
    assert.match(
      dessinerTriangle({ nom: "ABC", angles: [50, 60, 70] }),
      /aria-label="triangle ABC, angles 50°, 60°, 70°"/,
    );
  });

  it("rejette un nom invalide", () => {
    assert.throws(() => dessinerTriangle({ nom: "abc", angles: [60, 60, 60] }), /trois lettres/);
  });

  it("chaque arc d'angle bombe vers l'INTÉRIEUR du triangle (le bug de la photo)", () => {
    // Batterie de triangles, y compris très obtus et très aplatis :
    // l'ancienne heuristique de balayage se trompait de côté.
    const estDansTriangle = (p, sommets) => {
      let interieur = false;
      for (let i = 0, j = 2; i < 3; j = i++) {
        const [xi, yi] = sommets[i];
        const [xj, yj] = sommets[j];
        if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
          interieur = !interieur;
        }
      }
      return interieur;
    };
    for (const angles of [
      [50, 60, 70],
      [120, 40, 20],
      [150, 15, 15],
      [10, 10, 160],
      [89, 89, 2],
    ]) {
      const svg = dessinerTriangle({ nom: "ABC", angles });
      const polygone = svg
        .match(/<polygon points="([^"]+)"/)[1]
        .split(" ")
        .map((paire) => paire.split(",").map(Number));
      const arcs = [
        ...svg.matchAll(
          /<path d="M ([\d.-]+) ([\d.-]+) A ([\d.-]+) [\d.-]+ 0 0 1 ([\d.-]+) ([\d.-]+)"/g,
        ),
      ];
      assert.equal(arcs.length, 3, `angles ${angles} : trois arcs attendus`);
      for (const [, x1, y1, rayon, x2, y2] of arcs.map((a) => a.map(Number))) {
        // le sommet de l'arc est le sommet du triangle équidistant des
        // deux extrémités (à la distance rayon)
        const v = polygone.find(
          (p) =>
            Math.abs(Math.hypot(p[0] - x1, p[1] - y1) - rayon) < 0.5 &&
            Math.abs(Math.hypot(p[0] - x2, p[1] - y2) - rayon) < 0.5,
        );
        assert.ok(v, `angles ${angles} : sommet introuvable pour un arc`);
        // le point le plus bombé de l'arc (sur la bissectrice) est DANS le triangle
        const m = [(x1 + x2) / 2, (y1 + y2) / 2];
        const d = Math.hypot(m[0] - v[0], m[1] - v[1]);
        const bombe = [
          v[0] + ((m[0] - v[0]) / d) * rayon,
          v[1] + ((m[1] - v[1]) / d) * rayon,
        ];
        assert.ok(
          estDansTriangle(bombe, polygone),
          `angles ${angles} : l'arc du sommet ${JSON.stringify(v)} sort de la figure`,
        );
      }
    }
  });
});
