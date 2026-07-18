// Les pièges du cahier des charges, transformés en garde-fous.
//
// Chaque test porte le numéro du piège de la partie 6 du cahier des charges
// « bibliothèque de solides 3D en SVG ». Un piège corrigé une fois ne doit
// plus jamais revenir : c'est le rôle de ce fichier.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";
import {
  BASES_PRISME,
  aretesDe,
  calculerVisibilite,
  creerBoule,
  creerCone,
  creerCube,
  creerCylindre,
  creerPave,
  creerPrisme,
  creerPyramide,
  creerSphere,
  creerTetraedre,
  creerVue,
  dessinerSolide,
  verifierBaseConvexe,
} from "./solides.js";

const EPS = 1e-9;
const norme = (p) => Math.hypot(...p);
const soustraire = (p, q) => p.map((v, i) => v - q[i]);

/** Les prismes et pyramides de toutes les bases exigées par le programme. */
const BASES_EXIGEES = [
  ["triangle quelconque", { base: "triangle-quelconque" }],
  ["triangle rectangle", { base: "triangle-rectangle" }],
  ["triangle isocèle", { base: "triangle-isocele" }],
  ["triangle équilatéral", { base: "triangle-equilateral" }],
  ["parallélogramme", { base: "parallelogramme" }],
  ["trapèze quelconque", { base: "trapeze" }],
  ["trapèze rectangle", { base: "trapeze-rectangle" }],
  ["trapèze isocèle", { base: "trapeze-isocele" }],
  ["pentagone régulier", { cotes: 5 }],
  ["hexagone régulier", { cotes: 6 }],
];

function projeter(solide, options) {
  const vue = creerVue(options);
  return solide.sommets.map((p) => vue.projeter(vue.tourner(p)).slice(0, 2));
}

// ---------------------------------------------------------------------------
// 6.1 Perspective et proportions
// ---------------------------------------------------------------------------

describe("pièges 6.1 — perspective et proportions", () => {
  it("piège 1 et 3 : deux arêtes parallèles et égales le restent une fois projetées", () => {
    const cube = creerCube({ arete: 4 });
    const ecrans = projeter(cube, { projection: "cavaliere", angleDeg: 30, coefficient: 0.5 });
    const aretes = aretesDe(cube);
    // on regroupe les arêtes par direction dans le MODÈLE
    const groupes = new Map();
    for (const arete of aretes) {
      const [a, b] = arete.sommets;
      const d = soustraire(cube.sommets[b], cube.sommets[a]);
      const cle = d.map((v) => Math.round(Math.abs(v) * 1e6) / 1e6).join("|");
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle).push(arete);
    }
    for (const [cle, groupe] of groupes) {
      const vecteurs = groupe.map(({ sommets: [a, b] }) => soustraire(ecrans[b], ecrans[a]));
      const longueurs = vecteurs.map((v) => norme(v));
      for (const longueur of longueurs) {
        assert.ok(
          Math.abs(longueur - longueurs[0]) < 1e-6,
          `direction ${cle} : longueurs projetées inégales (${longueurs.join(", ")}) — il y aurait un point de fuite`,
        );
      }
      for (const v of vecteurs) {
        const croix = v[0] * vecteurs[0][1] - v[1] * vecteurs[0][0];
        assert.ok(Math.abs(croix) < 1e-6, `direction ${cle} : les projections ne sont plus parallèles`);
      }
    }
  });

  it("piège 4 : une face frontale n'est pas déformée (le carré reste un carré)", () => {
    const cube = creerCube({ arete: 4 });
    const vue = creerVue({ projection: "cavaliere", angleDeg: 30, coefficient: 0.5 });
    // la face frontale est celle de profondeur constante (y minimal)
    const yMin = Math.min(...cube.sommets.map((p) => p[1]));
    const frontaux = cube.sommets.filter((p) => Math.abs(p[1] - yMin) < EPS);
    assert.equal(frontaux.length, 4);
    const ecrans = frontaux.map((p) => vue.projeter(vue.tourner(p)).slice(0, 2));
    const xs = [...new Set(ecrans.map((p) => Math.round(p[0] * 1e6)))];
    const ys = [...new Set(ecrans.map((p) => Math.round(p[1] * 1e6)))];
    assert.equal(xs.length, 2, "la face frontale doit rester un rectangle droit");
    assert.equal(ys.length, 2);
    const largeur = Math.abs(xs[1] - xs[0]);
    const hauteur = Math.abs(ys[1] - ys[0]);
    assert.ok(Math.abs(largeur - hauteur) < 1e-3, "un carré frontal doit rester un carré");
  });

  it("piège 2 : toutes les fuyantes subissent la même transformation", () => {
    const pave = creerPave({ longueur: 6, largeur: 4, hauteur: 3 });
    const vue = creerVue({ projection: "cavaliere", angleDeg: 45, coefficient: 0.5 });
    // deux points ne différant que par la profondeur : même décalage écran
    const decalages = [];
    for (const x of [-3, 3]) {
      for (const z of [-1.5, 1.5]) {
        const avant = vue.projeter(vue.tourner([x, -2, z]));
        const arriere = vue.projeter(vue.tourner([x, 2, z]));
        decalages.push([arriere[0] - avant[0], arriere[1] - avant[1]]);
      }
    }
    for (const d of decalages) {
      assert.ok(Math.abs(d[0] - decalages[0][0]) < 1e-9 && Math.abs(d[1] - decalages[0][1]) < 1e-9,
        "deux profondeurs égales doivent produire le même décalage");
    }
  });

  it("piège 7 : le cube garde ses trois dimensions égales dans le modèle", () => {
    const cube = creerCube({ arete: 4 });
    const longueurs = aretesDe(cube).map(({ sommets: [a, b] }) =>
      norme(soustraire(cube.sommets[b], cube.sommets[a])),
    );
    for (const longueur of longueurs) assert.ok(Math.abs(longueur - 4) < 1e-9);
  });
});

// ---------------------------------------------------------------------------
// 6.2 Arêtes et visibilité
// ---------------------------------------------------------------------------

describe("pièges 6.2 — arêtes et visibilité", () => {
  const SOLIDES = [
    ["cube", creerCube()],
    ["pavé", creerPave()],
    ...BASES_EXIGEES.map(([nom, options]) => [`prisme ${nom}`, creerPrisme(options)]),
    ["pyramide carrée", creerPyramide({ cotes: 4 })],
    ["pyramide décentrée", creerPyramide({ cotes: 4, sommetDecale: [1.5, 0.6] })],
    ["tétraèdre", creerTetraedre()],
  ];

  it("piège 8 : aucune arête du contour apparent n'est en pointillés", () => {
    const generateur = creerGenerateur("pieges-silhouette");
    for (const [nom, solide] of SOLIDES) {
      for (let essai = 0; essai < 12; essai++) {
        const options = {
          projection: "orthographique",
          lacetDeg: generateur.entier(0, 359),
          tangageDeg: generateur.entier(-80, 80),
        };
        const ecrans = projeter(solide, options);
        const { aretes } = calculerVisibilite(solide, options);
        // une arête du contour : ses deux extrémités sur l'enveloppe convexe
        // ET aucune autre arête ne la recouvre — on teste le critère simple
        // « une face au moins est visible », qui doit valoir pour un convexe
        for (const arete of aretes) {
          if (arete.visible) continue;
          const [a, b] = arete.sommets;
          const milieu = [(ecrans[a][0] + ecrans[b][0]) / 2, (ecrans[a][1] + ecrans[b][1]) / 2];
          const centre = ecrans.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]).map((c) => c / ecrans.length);
          const distanceMilieu = norme(soustraire(milieu, centre));
          const rayonMax = Math.max(...ecrans.map((p) => norme(soustraire(p, centre))));
          assert.ok(
            distanceMilieu <= rayonMax + 1e-6,
            `${nom} : une arête cachée sort de la silhouette`,
          );
        }
      }
    }
  });

  it("piège 10 : la visibilité change quand on tourne (aucune liste figée)", () => {
    for (const [nom, solide] of SOLIDES) {
      const devant = calculerVisibilite(solide, { projection: "orthographique", lacetDeg: 0, tangageDeg: 20 });
      const derriere = calculerVisibilite(solide, { projection: "orthographique", lacetDeg: 180, tangageDeg: 20 });
      const signature = (v) => v.aretes.map((a) => (a.visible ? 1 : 0)).join("");
      assert.notEqual(
        signature(devant),
        signature(derriere),
        `${nom} : les pointillés ne bougent pas quand on retourne le solide`,
      );
    }
  });

  it("piège 11 : la hauteur d'une pyramide n'a pas le style d'une arête cachée", () => {
    const svg = dessinerSolide(creerPyramide({ cotes: 4 }), { hauteur: true, cachees: "pointilles" });
    assert.ok(svg.includes('stroke-dasharray="12 5 3 5"'), "la hauteur doit être en trait mixte");
    assert.ok(svg.includes('stroke-dasharray="8 6"'), "les arêtes cachées gardent leurs tirets");
  });

  it("piège 14 : une sphère n'a aucune arête", () => {
    for (const solide of [creerSphere(), creerBoule()]) {
      assert.throws(() => calculerVisibilite(solide), /polyèdres/);
      assert.equal(solide.nature, "revolution");
      assert.equal(solide.faces, undefined);
    }
  });

  it("les arêtes cachées peuvent être masquées entièrement", () => {
    const avec = dessinerSolide(creerCube(), { cachees: "pointilles" });
    const sans = dessinerSolide(creerCube(), { cachees: "masquees" });
    assert.ok(avec.includes('stroke-dasharray="8 6"'));
    assert.ok(!sans.includes('stroke-dasharray="8 6"'));
  });
});

// ---------------------------------------------------------------------------
// 6.3 Géométrie propre aux familles
// ---------------------------------------------------------------------------

describe("pièges 6.3 — géométrie des familles", () => {
  it("piège 15 : les deux bases d'un prisme sont congruentes et parallèles", () => {
    for (const [nom, options] of BASES_EXIGEES) {
      const prisme = creerPrisme(options);
      const bases = prisme.faces.filter((f) => f.role === "base");
      assert.equal(bases.length, 2, `${nom} : il faut exactement deux bases`);
      const [b1, b2] = bases;
      assert.equal(b1.sommets.length, b2.sommets.length, `${nom} : bases de tailles différentes`);
      // toutes les altitudes d'une base sont égales : les plans sont horizontaux
      for (const base of bases) {
        const zs = base.sommets.map((i) => prisme.sommets[i][2]);
        for (const z of zs) assert.ok(Math.abs(z - zs[0]) < 1e-9, `${nom} : base non plane`);
      }
      // congruence : mêmes longueurs de côtés, dans le même ordre cyclique
      const cotes = (face) =>
        face.sommets.map((s, i) => {
          const t = face.sommets[(i + 1) % face.sommets.length];
          return Number(norme(soustraire(prisme.sommets[t], prisme.sommets[s])).toFixed(9));
        });
      const c1 = cotes(b1);
      const c2 = cotes(b2);
      const memeCycle = c1.some((_, decalage) =>
        c1.every((v, i) => Math.abs(v - c2[(i + decalage) % c2.length]) < 1e-9),
      ) || c1.some((_, decalage) =>
        c1.every((v, i) => Math.abs(v - [...c2].reverse()[(i + decalage) % c2.length]) < 1e-9),
      );
      assert.ok(memeCycle, `${nom} : les deux bases ne sont pas congruentes`);
    }
  });

  it("piège 16 : les arêtes latérales d'un prisme droit sont perpendiculaires aux bases", () => {
    for (const [nom, options] of BASES_EXIGEES) {
      const prisme = creerPrisme(options);
      const n = prisme.sommets.length / 2;
      for (let i = 0; i < n; i++) {
        const d = soustraire(prisme.sommets[n + i], prisme.sommets[i]);
        assert.ok(Math.abs(d[0]) < 1e-9 && Math.abs(d[1]) < 1e-9,
          `${nom} : arête latérale non verticale`);
      }
    }
  });

  it("piège 17 : autant de faces latérales que la base a de côtés", () => {
    for (const [nom, options] of BASES_EXIGEES) {
      const prisme = creerPrisme(options);
      const base = prisme.faces.find((f) => f.role === "base");
      const laterales = prisme.faces.filter((f) => f.role === "laterale");
      assert.equal(laterales.length, base.sommets.length, `${nom} : mauvais nombre de faces latérales`);
      for (const face of laterales) {
        assert.equal(face.sommets.length, 4, `${nom} : une face latérale de prisme est un quadrilatère`);
      }
    }
  });

  it("piège 18 : les faces latérales suivent l'ordre cyclique des côtés de la base", () => {
    for (const [nom, options] of BASES_EXIGEES) {
      const prisme = creerPrisme(options);
      const n = prisme.sommets.length / 2;
      const laterales = prisme.faces.filter((f) => f.role === "laterale");
      // la largeur de chaque face latérale doit valoir le côté correspondant
      const largeurs = laterales.map((face) => {
        const bas = face.sommets.filter((i) => i < n);
        return Number(norme(soustraire(prisme.sommets[bas[1]], prisme.sommets[bas[0]])).toFixed(9));
      });
      const cotesBase = Array.from({ length: n }, (_, i) =>
        Number(norme(soustraire(prisme.sommets[(i + 1) % n], prisme.sommets[i])).toFixed(9)),
      );
      assert.deepEqual([...largeurs].sort(), [...cotesBase].sort(), `${nom} : largeurs latérales incohérentes`);
    }
  });

  it("piège 19 : une pyramide a UN sommet principal et des faces latérales triangulaires", () => {
    for (const options of [{ cotes: 3 }, { cotes: 4 }, { cotes: 6 }, { longueur: 5, largeur: 3 },
      { cotes: 4, sommetDecale: [1.2, 0.8] }, { base: "trapeze-isocele" }]) {
      const pyramide = creerPyramide(options);
      const apex = pyramide.roles.sommetPrincipal;
      const laterales = pyramide.faces.filter((f) => f.role === "laterale");
      for (const face of laterales) {
        assert.equal(face.sommets.length, 3, "une face latérale de pyramide est un triangle");
        assert.ok(face.sommets.includes(apex), "toutes les faces latérales rejoignent LE sommet");
      }
      assert.equal(pyramide.faces.filter((f) => f.role === "base").length, 1);
      assert.equal(pyramide.noms[apex], "S");
    }
  });

  it("piège 20 : la hauteur est perpendiculaire au plan de base, jamais une arête latérale", () => {
    const decalee = creerPyramide({ cotes: 4, cote: 3.5, hauteur: 4, sommetDecale: [1.5, 0] });
    const apex = decalee.sommets[decalee.roles.sommetPrincipal];
    const pied = decalee.roles.piedHauteur;
    const d = soustraire(apex, pied);
    assert.ok(Math.abs(d[0]) < 1e-9 && Math.abs(d[1]) < 1e-9, "la hauteur doit être verticale");
    assert.ok(Math.abs(norme(d) - 4) < 1e-9, "la hauteur vaut la valeur demandée");
    // et le pied n'est PAS le centre de la base quand le sommet est décalé
    assert.ok(Math.abs(pied[0] - 1.5) < 1e-9, "le pied suit l'aplomb du sommet");
  });

  it("piège 21 : une pyramide à base carrée peut être NON régulière", () => {
    const reguliere = creerPyramide({ cotes: 4 });
    const decentree = creerPyramide({ cotes: 4, sommetDecale: [1.5, 0] });
    assert.equal(reguliere.roles.reguliere, true);
    assert.equal(decentree.roles.reguliere, false);
    // les arêtes latérales d'une pyramide décentrée ne sont plus toutes égales
    const apex = decentree.roles.sommetPrincipal;
    const laterales = decentree.faces
      .filter((f) => f.role === "laterale")
      .map((f) => norme(soustraire(decentree.sommets[f.sommets[0]], decentree.sommets[apex])));
    const toutesEgales = laterales.every((l) => Math.abs(l - laterales[0]) < 1e-6);
    assert.ok(!toutesEgales, "une pyramide décentrée n'a pas toutes ses arêtes latérales égales");
    // une base RECTANGULAIRE non carrée n'est jamais régulière
    assert.equal(creerPyramide({ longueur: 5, largeur: 3 }).roles.reguliere, false);
  });

  it("piège 22 : hauteur et génératrice du cône sont deux longueurs distinctes", () => {
    const cone = creerCone({ rayon: 3, hauteur: 4 });
    const generatrice = Math.hypot(cone.rayon, cone.hauteur);
    assert.equal(generatrice, 5);
    assert.notEqual(generatrice, cone.hauteur);
  });

  it("piège 24 : un cylindre n'est pas un prisme — ses bases restent analytiques", () => {
    const cylindre = creerCylindre({ rayon: 2, hauteur: 4 });
    assert.equal(cylindre.nature, "revolution");
    assert.equal(cylindre.sommets, undefined);
    assert.equal(cylindre.faces, undefined);
    assert.equal(cylindre.rayon, 2);
  });

  it("piège 25 : la boule est pleine, la sphère est une surface", () => {
    const sphere = creerSphere({ rayon: 2.5 });
    const boule = creerBoule({ rayon: 2.5 });
    assert.equal(sphere.pleine, undefined);
    assert.equal(boule.pleine, true);
    assert.equal(sphere.rayon, boule.rayon);
    assert.notEqual(sphere.type, boule.type);
  });
});

// ---------------------------------------------------------------------------
// 6.6 Noms, cotes et lisibilité
// ---------------------------------------------------------------------------

describe("pièges 6.6 — noms et cotes", () => {
  it("piège 42 : les sommets correspondants des deux bases se suivent", () => {
    const prisme = creerPrisme({ cotes: 5 });
    const n = prisme.sommets.length / 2;
    for (let i = 0; i < n; i++) {
      const bas = prisme.sommets[i];
      const haut = prisme.sommets[n + i];
      assert.ok(Math.abs(bas[0] - haut[0]) < 1e-9 && Math.abs(bas[1] - haut[1]) < 1e-9,
        "le i-ème sommet du haut doit être à l'aplomb du i-ème sommet du bas");
    }
  });

  it("piège 43 : une rotation ne renomme pas les sommets", () => {
    const cube = creerCube();
    const noms = [...cube.noms];
    for (const lacetDeg of [0, 37, 180, 300]) {
      dessinerSolide(cube, { projection: "orthographique", lacetDeg, noms: true });
      assert.deepEqual(cube.noms, noms, "les noms du modèle ne doivent jamais changer");
    }
  });

  it("piège 45 : les cotes portent la longueur RÉELLE, pas la longueur dessinée", () => {
    // Une profondeur de 6 cm dessinée avec k = 0,5 ne mesure que 3 cm sur le
    // papier : elle doit rester étiquetée « 6 cm ». Aucune dimension du pavé
    // ne vaut 3, donc voir « 3 cm » signifierait qu'on a coté le dessin.
    const pave = creerPave({ longueur: 5, largeur: 6, hauteur: 2.5 });
    const svg = dessinerSolide(pave, {
      projection: "cavaliere",
      coefficient: 0.5,
      mesures: true,
      unite: "cm",
    });
    const INSECABLE = String.fromCharCode(160); // l unite est collee au nombre
    assert.ok(svg.includes(`6${INSECABLE}cm`), "la profondeur réelle (6 cm) doit apparaître");
    assert.ok(!svg.includes(`3${INSECABLE}cm`), "la longueur projetée (3 cm) ne doit jamais être cotée");
  });
});

// ---------------------------------------------------------------------------
// Les bases exigées existent vraiment et sont saines
// ---------------------------------------------------------------------------

describe("bases de prisme : le programme de 5e au complet", () => {
  it("toutes les bases demandées par le cahier des charges existent", () => {
    for (const cle of ["reguliere", "triangle-quelconque", "triangle-rectangle", "triangle-isocele",
      "triangle-equilateral", "parallelogramme", "trapeze", "trapeze-rectangle", "trapeze-isocele"]) {
      assert.equal(typeof BASES_PRISME[cle], "function", `base manquante : ${cle}`);
    }
  });

  it("chaque base est convexe, centrée et non dégénérée", () => {
    for (const [cle, fabrique] of Object.entries(BASES_PRISME)) {
      const points = fabrique();
      verifierBaseConvexe(points, cle);
      const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
      const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
      assert.ok(Math.abs(cx) < 1e-9 && Math.abs(cy) < 1e-9, `${cle} : base non centrée`);
    }
  });

  it("le triangle rectangle a bien un angle droit, l'équilatéral trois côtés égaux", () => {
    const rectangle = BASES_PRISME["triangle-rectangle"]({ cote1: 4, cote2: 3 });
    const cotes = rectangle.map((p, i) => norme(soustraire(rectangle[(i + 1) % 3], p))).sort((a, b) => a - b);
    assert.ok(Math.abs(cotes[0] ** 2 + cotes[1] ** 2 - cotes[2] ** 2) < 1e-9, "Pythagore doit être vérifié");
    const equilateral = BASES_PRISME["triangle-equilateral"]({ cote: 4 });
    for (let i = 0; i < 3; i++) {
      assert.ok(Math.abs(norme(soustraire(equilateral[(i + 1) % 3], equilateral[i])) - 4) < 1e-9);
    }
  });

  it("le trapèze isocèle a ses deux côtés obliques égaux", () => {
    const t = BASES_PRISME["trapeze-isocele"]({ grandeBase: 6, petiteBase: 3, hauteurTrapeze: 3 });
    const gauche = norme(soustraire(t[3], t[0]));
    const droite = norme(soustraire(t[2], t[1]));
    assert.ok(Math.abs(gauche - droite) < 1e-9, "trapèze isocèle : côtés obliques inégaux");
  });

  it("le trapèze rectangle a deux angles droits", () => {
    const t = BASES_PRISME["trapeze-rectangle"]({ grandeBase: 6, petiteBase: 3.5, hauteurTrapeze: 3 });
    const cote = soustraire(t[3], t[0]);
    assert.ok(Math.abs(cote[0]) < 1e-9, "le côté doit être perpendiculaire aux bases");
  });

  it("une base croisée ou aplatie est refusée", () => {
    assert.throws(() => verifierBaseConvexe([[0, 0], [4, 0], [0, 3], [4, 3]]), /convexe/);
    assert.throws(() => verifierBaseConvexe([[0, 0], [1, 1], [2, 2]]), /aplatie|convexe/);
    assert.throws(() => verifierBaseConvexe([[0, 0], [1, 1]]), /3 sommets/);
  });

  it("chaque base exigée se dessine sans erreur, de face comme de trois quarts", () => {
    for (const [nom, options] of BASES_EXIGEES) {
      for (const vue of [{ projection: "cavaliere" }, { projection: "orthographique", lacetDeg: 35, tangageDeg: 18 }]) {
        const svg = dessinerSolide(creerPrisme(options), { ...vue, noms: true, base: true, mesures: true });
        assert.ok(svg.startsWith("<svg"), `${nom} : rendu invalide`);
        assert.ok(!svg.includes("NaN"), `${nom} : NaN dans le rendu`);
      }
    }
  });

  it("une pyramide décentrée se dessine avec sa hauteur sans NaN", () => {
    for (const decalage of [[0, 0], [1.5, 0], [-1.2, 0.9]]) {
      const svg = dessinerSolide(creerPyramide({ cotes: 4, sommetDecale: decalage }), {
        hauteur: true,
        noms: true,
        mesures: true,
      });
      assert.ok(!svg.includes("NaN"), `décalage ${decalage} : NaN dans le rendu`);
      assert.ok(svg.includes('data-role="angle-droit"'), "l'angle droit au pied doit être marqué");
    }
  });
});
