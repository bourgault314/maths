import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";
import {
  CATEGORIES_SOLIDES,
  SOLIDES_USUELS,
  VERSION_SOLIDES,
  VUES_SOLIDES,
  aretesDe,
  calculerVisibilite,
  creerBoule,
  creerCone,
  creerCube,
  creerCylindre,
  creerDemiSphere,
  creerPave,
  creerPrisme,
  creerPyramide,
  creerSphere,
  creerTetraedre,
  creerVue,
  dessinerSolide,
} from "./solides.js";

// ---------------------------------------------------------------------------
// Outils de vérification INDÉPENDANTS (enveloppe convexe, point dans polygone)
// ---------------------------------------------------------------------------

function enveloppeConvexe(points) {
  // parcours monotone d'Andrew
  const tries = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const croix = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const moitie = (liste) => {
    const sortie = [];
    for (const p of liste) {
      while (sortie.length >= 2 && croix(sortie[sortie.length - 2], sortie[sortie.length - 1], p) <= 0) {
        sortie.pop();
      }
      sortie.push(p);
    }
    return sortie;
  };
  const bas = moitie(tries);
  const haut = moitie([...tries].reverse());
  return [...bas.slice(0, -1), ...haut.slice(0, -1)];
}

function dansOuSurPolygone(point, polygone, marge = 1e-6) {
  // vrai si le point est DANS la silhouette ou SUR son bord (les vues
  // exactement par la tranche posent l'arête cachée sur le bord — licite) ;
  // faux seulement s'il en sort franchement, ce qui trahirait un vrai bug
  for (let i = 0; i < polygone.length; i++) {
    const a = polygone[i];
    const b = polygone[(i + 1) % polygone.length];
    const cote = (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
    if (cote < -marge) return false;
  }
  return true;
}

function projeterSolide(solide, options) {
  const vue = creerVue(options);
  return solide.sommets.map((p) => vue.projeter(vue.tourner(p)).slice(0, 2));
}

const POLYEDRES = [
  ["cube", creerCube()],
  ["pavé", creerPave()],
  ["prisme 3", creerPrisme({ cotes: 3 })],
  ["prisme 5", creerPrisme({ cotes: 5 })],
  ["prisme 6", creerPrisme({ cotes: 6 })],
  ["prisme 8", creerPrisme({ cotes: 8 })],
  ["pyramide 3", creerPyramide({ cotes: 3 })],
  ["pyramide 4", creerPyramide({ cotes: 4 })],
  ["pyramide 6", creerPyramide({ cotes: 6 })],
  ["pyramide rectangulaire", creerPyramide({ longueur: 4.5, largeur: 3, hauteur: 4 })],
  ["tétraèdre", creerTetraedre()],
];

describe("solides : modèle", () => {
  it("expose sa version", () => {
    assert.equal(VERSION_SOLIDES, 1);
  });

  it("vérifie la relation d'Euler S − A + F = 2 sur tous les polyèdres", () => {
    for (const [nom, solide] of POLYEDRES) {
      const S = solide.sommets.length;
      const A = aretesDe(solide).length;
      const F = solide.faces.length;
      assert.equal(S - A + F, 2, `${nom} : ${S} − ${A} + ${F}`);
    }
  });

  it("compte sommets, arêtes et faces d'un prisme à n côtés", () => {
    for (const n of [3, 4, 5, 6, 7, 8]) {
      const prisme = creerPrisme({ cotes: n });
      assert.equal(prisme.sommets.length, 2 * n);
      assert.equal(aretesDe(prisme).length, 3 * n);
      assert.equal(prisme.faces.length, n + 2);
    }
  });

  it("compte sommets, arêtes et faces d'une pyramide à n côtés", () => {
    for (const n of [3, 4, 5, 6, 7, 8]) {
      const pyramide = creerPyramide({ cotes: n });
      assert.equal(pyramide.sommets.length, n + 1);
      assert.equal(aretesDe(pyramide).length, 2 * n);
      assert.equal(pyramide.faces.length, n + 1);
      assert.equal(pyramide.noms[n], "S");
    }
  });

  it("ferme la surface : chaque arête borde exactement deux faces", () => {
    for (const [nom, solide] of POLYEDRES) {
      for (const arete of aretesDe(solide)) {
        assert.equal(arete.faces.length, 2, `${nom} : arête ${arete.sommets.join("-")}`);
      }
    }
  });

  it("donne au tétraèdre régulier des arêtes toutes égales", () => {
    const t = creerTetraedre({ arete: 4 });
    for (const arete of aretesDe(t)) {
      const [a, b] = arete.sommets.map((i) => t.sommets[i]);
      const longueur = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      assert.ok(Math.abs(longueur - 4) < 1e-9, `arête de ${longueur}`);
    }
  });

  it("refuse les paramètres invalides", () => {
    assert.throws(() => creerCube({ arete: 0 }), RangeError);
    assert.throws(() => creerPave({ hauteur: -1 }), RangeError);
    assert.throws(() => creerPrisme({ cotes: 2 }), RangeError);
    assert.throws(() => creerPrisme({ cotes: 13 }), RangeError);
    assert.throws(() => creerPrisme({ cotes: 4.5 }), RangeError);
    assert.throws(() => creerCylindre({ rayon: 0 }), RangeError);
    assert.throws(() => creerCone({ hauteur: Number.NaN }), RangeError);
    assert.throws(() => creerSphere({ rayon: -2 }), RangeError);
    assert.throws(() => creerVue({ projection: "perspective" }), RangeError);
    assert.throws(() => dessinerSolide(creerCube(), { cachees: "invisibles" }), RangeError);
    assert.throws(() => dessinerSolide(creerCube(), { cadre: "flottant" }), RangeError);
  });
});

describe("solides : visibilité recalculée (jamais de liste figée)", () => {
  it("cache exactement 3 arêtes du cube en cavalière du collège", () => {
    const { aretes } = calculerVisibilite(creerCube(), {});
    assert.equal(aretes.filter((a) => !a.visible).length, 3);
    assert.equal(aretes.filter((a) => a.visible).length, 9);
  });

  it("change d'arêtes cachées quand le solide tourne", () => {
    const cube = creerCube();
    const cachees = (options) =>
      calculerVisibilite(cube, options).aretes
        .map((a, i) => (a.visible ? null : i))
        .filter((i) => i !== null)
        .join(",");
    const face = cachees({ projection: "orthographique", lacetDeg: -28, tangageDeg: 16 });
    const dos = cachees({ projection: "orthographique", lacetDeg: 152, tangageDeg: -16 });
    assert.notEqual(face, dos);
  });

  it("garde toute arête cachée dans la silhouette (300 orientations seedées)", () => {
    const generateur = creerGenerateur("solides-silhouette-1");
    const solides = [creerPave(), creerPrisme({ cotes: 5 }), creerPyramide({ cotes: 4 }), creerTetraedre()];
    for (let essai = 0; essai < 300; essai++) {
      const solide = solides[essai % solides.length];
      const options = {
        projection: essai % 2 ? "orthographique" : "cavaliere",
        angleDeg: generateur.entier(15, 75),
        coefficient: generateur.entier(3, 8) / 10,
        lacetDeg: generateur.entier(0, 359),
        tangageDeg: generateur.entier(-80, 80),
      };
      const ecrans = projeterSolide(solide, options);
      const silhouette = enveloppeConvexe(ecrans);
      const { aretes } = calculerVisibilite(solide, options);
      for (const arete of aretes) {
        if (arete.visible) continue;
        const [a, b] = arete.sommets;
        const milieu = [(ecrans[a][0] + ecrans[b][0]) / 2, (ecrans[a][1] + ecrans[b][1]) / 2];
        for (const [nom, point] of [["le milieu", milieu], ["l'extrémité", ecrans[a]], ["l'extrémité", ecrans[b]]]) {
          assert.ok(
            dansOuSurPolygone(point, silhouette),
            `essai ${essai} (${solide.type}) : ${nom} de l'arête cachée ${a}-${b} sort de la silhouette`,
          );
        }
      }
    }
  });

  it("réserve calculerVisibilite aux polyèdres", () => {
    assert.throws(() => calculerVisibilite(creerSphere(), {}), TypeError);
  });
});

describe("solides : vues et projections", () => {
  it("réduit le cube à 4 positions en vue de face", () => {
    const ecrans = projeterSolide(creerCube(), { projection: "orthographique", ...VUES_SOLIDES.face });
    const uniques = new Set(ecrans.map(([x, y]) => `${x.toFixed(6)};${y.toFixed(6)}`));
    assert.equal(uniques.size, 4);
  });

  it("montre la face du dessus en vue de dessus", () => {
    const { facesVisibles } = calculerVisibilite(creerPave(), {
      projection: "orthographique",
      ...VUES_SOLIDES.dessus,
    });
    const pave = creerPave();
    const indicesVisibles = facesVisibles
      .map((visible, i) => (visible ? i : null))
      .filter((i) => i !== null);
    assert.equal(indicesVisibles.length, 1);
    const face = pave.faces[indicesVisibles[0]];
    for (const i of face.sommets) assert.ok(pave.sommets[i][2] > 0, "la face visible est bien en haut");
  });

  it("projette la cavalière avec la face avant sans déformation", () => {
    const vue = creerVue({ projection: "cavaliere", angleDeg: 45, coefficient: 0.5 });
    const [x, y] = vue.projeter(vue.tourner([2, 0, 1.5]));
    assert.ok(Math.abs(x - 2) < 1e-12);
    assert.ok(Math.abs(y - -1.5) < 1e-12);
  });
});

describe("solides : rendu SVG", () => {
  it("dessine chaque solide usuel sans erreur, de façon déterministe", () => {
    for (const [cle, entree] of Object.entries(SOLIDES_USUELS)) {
      const solide = entree.creer();
      const un = dessinerSolide(solide, { taille: 300 });
      const deux = dessinerSolide(solide, { taille: 300 });
      assert.ok(un.startsWith("<svg"), cle);
      assert.equal(un, deux, `${cle} : rendu non déterministe`);
    }
  });

  it("garde un cadre carré constant quand un solide manipulable tourne", () => {
    const solides = [
      creerCube(),
      creerPave({ longueur: 6, largeur: 3.3, hauteur: 2.8 }),
      creerPrisme({ base: "triangle-rectangle", cote1: 4, cote2: 3, hauteur: 5 }),
      creerPyramide({ cotes: 4, cote: 4.2, hauteur: 4.8 }),
      creerCylindre({ rayon: 2.1, hauteur: 4.7 }),
      creerCone({ rayon: 2.2, hauteur: 4.8 }),
    ];
    for (const solide of solides) {
      const rendus = [-176, -88, 0, 88, 176].map((lacetDeg) => dessinerSolide(solide, {
        projection: "orthographique",
        lacetDeg,
        tangageDeg: 16,
        taille: 300,
        marge: 24,
        cadre: "stable",
        noms: true,
        mesures: true,
        hauteur: true,
      }));
      for (const svg of rendus) {
        assert.match(svg, /^<svg[^>]*viewBox="0 0 300 300"[^>]*width="300" height="300"/);
        assert.ok(!svg.includes("NaN"), solide.type);
      }
      assert.ok(new Set(rendus).size > 1, `${solide.type} : la silhouette doit encore changer`);
    }
  });

  it("met les arêtes cachées en pointillés, ou les masque sur demande", () => {
    const cube = creerCube();
    const pointilles = dessinerSolide(cube, {});
    const masquees = dessinerSolide(cube, { cachees: "masquees" });
    assert.ok(pointilles.includes("stroke-dasharray"));
    assert.ok(!masquees.includes('stroke-dasharray="8 6"'));
  });

  it("nomme les sommets sur demande (ABCD… et S pour la pyramide)", () => {
    const svg = dessinerSolide(creerPyramide({ cotes: 4 }), { noms: true });
    for (const lettre of ["A", "B", "C", "D", "S"]) {
      assert.ok(svg.includes(`>${lettre}</text>`), lettre);
    }
  });

  it("met la base en valeur et trace la hauteur avec son angle droit", () => {
    const svg = dessinerSolide(creerPyramide({ cotes: 4 }), { base: true, hauteur: true, mesures: true });
    assert.ok(svg.includes("#16a34a"), "base verte");
    assert.ok(svg.includes("data-role=\"angle-droit\""));
    assert.ok(svg.includes("4\u00a0cm"), "hauteur mesurée");
  });

  it("écrit les trois dimensions du pavé en mesures", () => {
    const svg = dessinerSolide(creerPave({ longueur: 5, largeur: 3, hauteur: 2.5 }), { mesures: true });
    for (const valeur of ["5\u00a0cm", "3\u00a0cm", "2,5\u00a0cm"]) {
      assert.ok(svg.includes(valeur), valeur);
    }
  });

  it("dessine le cylindre : deux génératrices et un arc caché", () => {
    const svg = dessinerSolide(creerCylindre(), {});
    assert.ok(svg.includes("stroke-dasharray"), "l'arrière du cercle de base est pointillé");
    assert.ok((svg.match(/<line /g) ?? []).length >= 2, "les génératrices de contour");
  });

  it("dessine le cône même vu dans l'axe (vue de dessus : un cercle)", () => {
    const svg = dessinerSolide(creerCone(), { projection: "orthographique", ...VUES_SOLIDES.dessus });
    assert.ok(svg.startsWith("<svg"));
    assert.ok(!svg.includes("NaN"));
  });

  it("dessine sphère, boule et demi-sphère sans corde parasite", () => {
    for (const solide of [creerSphere(), creerBoule(), creerDemiSphere()]) {
      const svg = dessinerSolide(solide, { projection: "orthographique", lacetDeg: -28, tangageDeg: 16 });
      assert.ok(svg.startsWith("<svg"));
      assert.ok(!svg.includes("NaN"));
    }
    const boule = dessinerSolide(creerBoule(), {});
    assert.ok(boule.includes("fill-opacity=\"0.08\""), "la boule est rendue pleine");
  });

  it("ne produit jamais de NaN sous 100 orientations seedées", () => {
    const generateur = creerGenerateur("solides-nan-1");
    const solides = [creerCylindre(), creerCone(), creerSphere(), creerDemiSphere(), creerPrisme({ cotes: 7 })];
    for (let essai = 0; essai < 100; essai++) {
      const svg = dessinerSolide(solides[essai % solides.length], {
        projection: essai % 2 ? "orthographique" : "cavaliere",
        lacetDeg: generateur.entier(0, 359),
        tangageDeg: generateur.entier(-89, 89),
        angleDeg: generateur.entier(15, 75),
        coefficient: generateur.entier(2, 9) / 10,
      });
      assert.ok(!svg.includes("NaN"), `essai ${essai}`);
    }
  });

  it("échappe les textes destinés au SVG", () => {
    const svg = dessinerSolide(creerCube(), { noms: true, unite: "<cm>" });
    assert.ok(!svg.includes("<cm>"));
  });
});

describe("solides : la banque de l'Atelier", () => {
  it("classe chaque solide usuel dans une catégorie connue", () => {
    for (const [cle, entree] of Object.entries(SOLIDES_USUELS)) {
      assert.ok(CATEGORIES_SOLIDES.includes(entree.categorie), cle);
      assert.ok(entree.titre.length > 0);
      assert.ok(Array.isArray(entree.parametres));
    }
  });

  it("crée chaque solide usuel avec les paramètres par défaut de sa fiche", () => {
    for (const [cle, entree] of Object.entries(SOLIDES_USUELS)) {
      const parametres = {};
      for (const p of entree.parametres) parametres[p.cle] = p.defaut;
      const solide = entree.creer(parametres);
      assert.ok(solide.type, cle);
    }
  });
});
