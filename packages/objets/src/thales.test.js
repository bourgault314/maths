import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  VARIATIONS_THALES,
  creerThales,
  dessinerThales,
  resoudreThales,
} from "./thales.js";
import { distance, sontAlignes, sontParalleles } from "./geometrie.js";

const proche = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} attendu proche de ${b}`);

describe("creerThales — un seul modèle, toutes les proportions", () => {
  it("chaque variation : alignements, parallélisme et rapports VRAIS par construction", () => {
    for (const [nomVariation, reglages] of Object.entries(VARIATIONS_THALES)) {
      for (const orientationDeg of [0, 57, 203]) {
        const t = creerThales({ variation: nomVariation, orientationDeg });
        const { sommet: A, proches: [M, N], eloignes: [B, C] } = t.lettres;
        const p = t.points;
        assert.ok(sontAlignes(p[A], p[M], p[B]), `${nomVariation} : A,M,B non alignés`);
        assert.ok(sontAlignes(p[A], p[N], p[C]), `${nomVariation} : A,N,C non alignés`);
        assert.ok(sontParalleles(p[M], p[N], p[B], p[C], 1e-6), `${nomVariation} : (MN) non // (BC)`);
        const rapport = Math.abs(reglages.k);
        proche(distance(p[A], p[M]) / distance(p[A], p[B]), rapport, 1e-9);
        proche(distance(p[A], p[N]) / distance(p[A], p[C]), rapport, 1e-9);
        proche(distance(p[M], p[N]) / distance(p[B], p[C]), rapport, 1e-9);
        assert.equal(t.configuration, reglages.k < 0 ? "papillon" : "emboitee");
      }
    }
  });

  it("papillon : les points proches sont de l'autre côté du sommet (ordre M,A,B)", () => {
    const t = creerThales({ variation: "papillon" });
    assert.deepEqual(t.alignements[0][1], t.lettres.sommet);
  });

  it("agrandie (k > 1) : l'ordre réel est A,B,M et les rôles suivent la géométrie", () => {
    const t = creerThales({ k: 2, b: 5, c: 4 });
    assert.equal(t.configuration, "agrandie");
    assert.deepEqual(t.alignements, [["A", "B", "M"], ["A", "C", "N"]]);
    assert.deepEqual(t.lettres.proches, ["B", "C"]);
    assert.deepEqual(t.lettres.eloignes, ["M", "N"]);
    const p = t.points;
    assert.ok(distance(p.A, p.B) < distance(p.A, p.M), "B doit être plus proche de A que M");
    proche(distance(p.A, p.M) / distance(p.A, p.B), 2, 1e-9);
  });

  it("refuse k = 1 (les deux triangles seraient confondus)", () => {
    assert.throws(() => creerThales({ k: 1 }), /k = 1/);
  });

  it("les longueurs annoncées correspondent aux distances réelles", () => {
    const t = creerThales({ k: 0.4, b: 10, c: 9 });
    for (const [nomLongueur, valeur] of Object.entries(t.longueurs)) {
      proche(distance(t.points[nomLongueur[0]], t.points[nomLongueur[1]]), valeur, 1e-9);
    }
  });

  it("refuse les données illisibles ou impossibles", () => {
    assert.throws(() => creerThales({ k: 0 }), /non nul/);
    assert.throws(() => creerThales({ angleDeg: 5 }), /lisible/);
    assert.throws(() => creerThales({ lettres: "AABBC" }), /distinctes/);
  });
});

describe("resoudreThales — produit en croix exact, les six inconnues", () => {
  it("chaque longueur peut être l'inconnue, résultat exact", () => {
    const t = creerThales({ k: 0.4, b: 10, c: 9 });
    for (const nomLongueur of Object.keys(t.longueurs)) {
      const solution = resoudreThales(t, { inconnue: nomLongueur });
      proche(solution.valeur, t.longueurs[nomLongueur], 1e-9);
      assert.equal(solution.inconnue, nomLongueur);
    }
  });

  it("l'exemple de la fiche : AM = 4, AB = 10, BC = 7,5 → MN = 3", () => {
    const t = creerThales({ k: 0.4, b: 10, c: 9 });
    proche(t.longueurs.AM, 4);
    proche(t.longueurs.AB, 10);
    const solution = resoudreThales(t, { inconnue: "MN" });
    proche(solution.valeur, 0.4 * t.longueurs.BC, 1e-9);
    // la rédaction suit la fiche du site, avec les phrases exactes
    const textes = solution.etapes.map((e) => e.texte ?? e.unicode).join("\n");
    assert.match(textes, /sont alignés, ainsi que les points/);
    assert.match(textes, /sont parallèles/);
    assert.match(textes, /AM\/AB = AN\/AC = MN\/BC/);
    assert.match(textes, /produits en croix/);
    // BC est irrationnelle ici : la valeur affichée est arrondie, donc «≈»
    assert.match(textes, /Donc MN ≈ /);
    assert.equal(solution.exacte, false);
  });

  it("l'inconnue au dénominateur fonctionne aussi (AB inconnu)", () => {
    const t = creerThales({ k: 0.5, b: 8, c: 7 });
    const solution = resoudreThales(t, { inconnue: "AB" });
    proche(solution.valeur, 8, 1e-9);
    assert.equal(solution.exacte, true);
    assert.match(solution.etapes.at(-1).texte, /Donc AB = 8 cm/);
  });

  it("refuse une longueur étrangère à la figure", () => {
    const t = creerThales({});
    assert.throws(() => resoudreThales(t, { inconnue: "XY" }), /six longueurs/);
  });
});

describe("dessinerThales — construction à l'échelle, jamais figée", () => {
  it("emboîtée et papillon, noir et couleur : SVG sain", () => {
    for (const variation of ["base", "moitie", "papillon"]) {
      for (const theme of ["noir", "couleur"]) {
        const t = creerThales({ variation });
        const svg = dessinerThales(t, {
          theme,
          longueurs: true,
          textes: { MN: "?" },
        });
        assert.match(svg, /^<svg /);
        assert.ok(!/NaN|Infinity/.test(svg), `${variation}/${theme} : NaN`);
        assert.match(svg, />\?</);
        for (const lettre of "AMNBC") assert.match(svg, new RegExp(`>${lettre}<`));
      }
    }
  });

  it("la figure est réellement à l'échelle : MN/BC mesuré dans le SVG = |k|", () => {
    const t = creerThales({ k: 0.4, b: 10, c: 9 });
    const svg = dessinerThales(t, {});
    // les CÔTÉS ont l'épaisseur 3.5 (les croix des points sont plus fines)
    const lignes = [...svg.matchAll(/<line x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)" stroke="[^"]*" stroke-width="3.5"/g)]
      .map((m) => m.slice(1, 5).map(Number));
    const longueur = (l) => Math.hypot(l[2] - l[0], l[3] - l[1]);
    // 6 côtés : AB, AC, BC puis AM, AN, MN — dans cet ordre
    assert.equal(lignes.length, 6);
    proche(longueur(lignes[5]) / longueur(lignes[2]), 0.4, 1e-3);
  });

  it("papillon et agrandie : les côtés du triangle proche sont réellement tracés", () => {
    for (const options of [{ variation: "papillon" }, { k: 1.5 }]) {
      const t = creerThales(options);
      const svg = dessinerThales(t, {});
      const nbCotes = [...svg.matchAll(/stroke-width="3.5"/g)].length;
      assert.equal(nbCotes, 6, `${JSON.stringify(options)} : six côtés attendus`);
    }
  });

  it("refuse une longueur d'affichage inconnue", () => {
    const t = creerThales({});
    assert.throws(() => dessinerThales(t, { longueurs: ["ZZ"] }), /longueur inconnue/);
  });
});
