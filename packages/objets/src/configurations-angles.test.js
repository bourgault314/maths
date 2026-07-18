import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  creerConfigurationAngles,
  dessinerConfigurationAngles,
  redigerConfigurationAngles,
  resoudreConfigurationAngles,
} from "./configurations-angles.js";
import {
  angle,
  egalite,
  mesure,
  puissance,
  quotient,
  racine,
  segment,
  somme,
  versTex,
  versTexte,
  versUnicode,
} from "./expressions.js";

const proche = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} attendu proche de ${b}`);

describe("expressions — l'écriture mathématique structurée", () => {
  const pythagore = egalite(
    puissance(segment("BC"), 2),
    somme(puissance(segment("AB"), 2), puissance(segment("AC"), 2)),
  );

  it("versUnicode : BC² = AB² + AC², chapeaux, racines, mesures", () => {
    assert.equal(versUnicode(pythagore), "BC² = AB² + AC²");
    assert.equal(versUnicode(angle("ABC")), "AB̂C");
    assert.equal(versUnicode(angle("B")), "B̂");
    assert.equal(versUnicode(racine(mesure(144, ""))), "√144");
    assert.equal(versUnicode(mesure(38.5, "°", { decimales: 1 })), "38,5°");
    assert.equal(versUnicode(mesure(7.5, "cm")), "7,5\u00A0cm");
    assert.equal(versUnicode(quotient(segment("AM"), segment("AB"))), "AM/AB");
  });

  it("versTex : \\widehat, \\dfrac, virgule {,}, degré collé", () => {
    assert.equal(versTex(angle("ABC")), "\\widehat{ABC}");
    assert.equal(versTex(quotient(segment("AM"), segment("AB"))), "\\dfrac{AM}{AB}");
    assert.equal(versTex(mesure(38.5, "°", { decimales: 1 })), "38{,}5^\\circ");
    assert.equal(versTex(mesure(7.5, "cm")), "7{,}5\\ \\mathrm{cm}");
    assert.equal(versTex(pythagore), "BC^{2}=AB^{2}+AC^{2}");
  });

  it("versTexte : le français accessible", () => {
    assert.equal(
      versTexte(pythagore),
      "B C au carré égale A B au carré plus A C au carré",
    );
    assert.equal(versTexte(mesure(38.5, "°", { decimales: 1 })), "38,5 degrés");
  });
});

describe("configurations d'angles — les relations survivent à tout", () => {
  const angleParId = (instance, id) => instance.angles.find((a) => a.id === id);

  it("sécantes : opposés égaux, adjacents supplémentaires, sous toute orientation et miroir", () => {
    for (const orientationDeg of [0, 37, 90, 141, 265, 359]) {
      for (const miroir of [false, true]) {
        const instance = creerConfigurationAngles({
          type: "secantes",
          angleDeg: 55,
          orientationDeg,
          miroir,
        });
        assert.equal(instance.angles.length, 4);
        proche(instance.angles.map((a) => a.mesureDeg).reduce((s, x) => s + x, 0), 360);
        for (const relation of instance.relations) {
          const [a1, a2] = relation.angles.map((id) => angleParId(instance, id));
          if (relation.type === "opposes") proche(a1.mesureDeg, a2.mesureDeg);
          if (relation.type === "adjacents-supplementaires") proche(a1.mesureDeg + a2.mesureDeg, 180);
        }
      }
    }
  });

  it("parallèles-sécante : correspondants et alternes égaux, co-intérieurs supplémentaires — batterie complète", () => {
    let verifies = 0;
    for (let orientationDeg = 0; orientationDeg < 360; orientationDeg += 23) {
      for (const miroir of [false, true]) {
        const instance = creerConfigurationAngles({
          type: "paralleles-secante",
          angleDeg: 55,
          orientationDeg,
          miroir,
        });
        assert.equal(instance.angles.length, 8);
        assert.deepEqual(instance.parallelisme, [["d1", "d2"]]);
        for (const relation of instance.relations) {
          const [a1, a2] = relation.angles.map((id) => angleParId(instance, id));
          if (["correspondants", "alternes-internes", "alternes-externes", "opposes"].includes(relation.type)) {
            proche(a1.mesureDeg, a2.mesureDeg, 1e-9);
            verifies++;
          }
          if (relation.type === "co-interieurs") {
            proche(a1.mesureDeg + a2.mesureDeg, 180, 1e-9);
            verifies++;
          }
        }
        // les alternes-internes relient bien les DEUX sommets
        for (const r of instance.relations.filter((x) => x.type === "alternes-internes")) {
          const sommets = r.angles.map((id) => angleParId(instance, id).sommet);
          assert.notEqual(sommets[0], sommets[1]);
        }
      }
    }
    assert.ok(verifies > 300, "la batterie doit vérifier des centaines de paires");
  });

  it("supplémentaires, complémentaires, bissectrice, triangle, quadrilatère, angle extérieur", () => {
    const supp = creerConfigurationAngles({ type: "supplementaires", angleDeg: 55 });
    proche(supp.angles[0].mesureDeg + supp.angles[1].mesureDeg, 180);

    const comp = creerConfigurationAngles({ type: "complementaires", angleDeg: 35 });
    proche(comp.angles[0].mesureDeg + comp.angles[1].mesureDeg, 90);

    const bis = creerConfigurationAngles({ type: "bissectrice", angleDeg: 76 });
    proche(bis.angles[0].mesureDeg, bis.angles[1].mesureDeg);

    const tri = creerConfigurationAngles({ type: "triangle", angles: [50, 60, 70] });
    proche(tri.angles.reduce((s, a) => s + a.mesureDeg, 0), 180, 1e-6);

    const quad = creerConfigurationAngles({ type: "quadrilatere" });
    proche(quad.angles.reduce((s, a) => s + a.mesureDeg, 0), 360, 1e-6);

    const ext = creerConfigurationAngles({ type: "angle-exterieur", angles: [50, 60, 70] });
    const exterieur = ext.angles.find((a) => a.id === "angle:exterieur");
    proche(exterieur.mesureDeg, 50 + 60, 1e-6); // 180 − 70
  });

  it("refuse un type inconnu et un angle caractéristique invalide", () => {
    assert.throws(() => creerConfigurationAngles({ type: "zigzag" }), /type inconnu/);
    assert.throws(() => creerConfigurationAngles({ type: "secantes", angleDeg: 0 }), /entre 0° et 180°/);
  });
});

describe("resoudreConfigurationAngles — le solveur justifie tout", () => {
  it("opposés par le sommet : même mesure, phrase correcte", () => {
    const instance = creerConfigurationAngles({ type: "secantes", angleDeg: 55 });
    const solution = resoudreConfigurationAngles(instance, {
      valeurs: { "O:u+.v+": 55 },
      inconnue: "O:u-.v-",
    });
    proche(solution.mesureDeg, 55);
    assert.match(solution.etapes[0].texte, /opposés par le sommet/);
    assert.match(solution.etapes.at(-1).texte, /55°/);
  });

  it("adjacents supplémentaires : 180 − 55 = 125", () => {
    const instance = creerConfigurationAngles({ type: "secantes", angleDeg: 55 });
    const solution = resoudreConfigurationAngles(instance, {
      valeurs: { "O:u+.v+": 55 },
      inconnue: "O:v+.u-",
    });
    proche(solution.mesureDeg, 125);
    assert.match(solution.etapes[0].texte, /angle plat|supplémentaires/);
  });

  it("complémentaires : 90 − 35 ; bissectrice : égalité", () => {
    const comp = creerConfigurationAngles({ type: "complementaires", angleDeg: 35 });
    const solutionComp = resoudreConfigurationAngles(comp, {
      valeurs: { "O:1": 35 },
      inconnue: "O:2",
    });
    proche(solutionComp.mesureDeg, 55);
    assert.match(solutionComp.etapes[0].texte, /complémentaires/);

    const bis = creerConfigurationAngles({ type: "bissectrice", angleDeg: 76 });
    const solutionBis = resoudreConfigurationAngles(bis, {
      valeurs: { "O:1": 38 },
      inconnue: "O:2",
    });
    proche(solutionBis.mesureDeg, 38);
    assert.match(solutionBis.etapes[0].texte, /bissectrice/);
  });

  it("correspondants et alternes-internes : la justification cite les parallèles", () => {
    const instance = creerConfigurationAngles({ type: "paralleles-secante", angleDeg: 55 });
    const correspondants = instance.relations.find((r) => r.type === "correspondants");
    const solution = resoudreConfigurationAngles(instance, {
      valeurs: { [correspondants.angles[0]]: 55 },
      inconnue: correspondants.angles[1],
    });
    proche(solution.mesureDeg, 55);
    assert.match(solution.etapes[0].texte, /parallèles/);
    assert.match(solution.etapes[0].texte, /correspondants/);

    const alternes = instance.relations.find((r) => r.type === "alternes-internes");
    const mesureConnue = instance.angles.find((a) => a.id === alternes.angles[0]).mesureDeg;
    const solutionAlt = resoudreConfigurationAngles(instance, {
      valeurs: { [alternes.angles[0]]: mesureConnue },
      inconnue: alternes.angles[1],
    });
    proche(solutionAlt.mesureDeg, mesureConnue);
    assert.match(solutionAlt.etapes[0].texte, /alternes-internes/);
  });

  it("troisième angle du triangle et quatrième du quadrilatère", () => {
    const tri = creerConfigurationAngles({ type: "triangle", angles: [50, 60, 70] });
    const solution = resoudreConfigurationAngles(tri, {
      valeurs: { "angle:A": 50, "angle:B": 60 },
      inconnue: "angle:C",
    });
    proche(solution.mesureDeg, 70);
    assert.match(solution.etapes[0].texte, /180°/);

    const quad = creerConfigurationAngles({ type: "quadrilatere" });
    const [a1, a2, a3, a4] = quad.angles;
    const solutionQuad = resoudreConfigurationAngles(quad, {
      valeurs: { [a1.id]: a1.mesureDeg, [a2.id]: a2.mesureDeg, [a3.id]: a3.mesureDeg },
      inconnue: a4.id,
    });
    proche(solutionQuad.mesureDeg, a4.mesureDeg, 1e-6);
  });

  it("angle extérieur = somme des deux non adjacents", () => {
    const instance = creerConfigurationAngles({ type: "angle-exterieur", angles: [50, 60, 70] });
    const solution = resoudreConfigurationAngles(instance, {
      valeurs: { "angle:A": 50, "angle:B": 60 },
      inconnue: "angle:exterieur",
    });
    proche(solution.mesureDeg, 110);
  });

  it("échoue proprement quand les données ne suffisent pas", () => {
    const tri = creerConfigurationAngles({ type: "triangle", angles: [50, 60, 70] });
    assert.throws(
      () => resoudreConfigurationAngles(tri, { valeurs: { "angle:A": 50 }, inconnue: "angle:C" }),
      /aucune relation/,
    );
  });

  it("rédaction : profil complet et profil compact", () => {
    const instance = creerConfigurationAngles({ type: "triangle", angles: [50, 60, 70] });
    const solution = resoudreConfigurationAngles(instance, {
      valeurs: { "angle:A": 50, "angle:B": 60 },
      inconnue: "angle:C",
    });
    const complet = redigerConfigurationAngles(solution, { profil: "complet" });
    assert.ok(complet.length >= 3);
    assert.ok(complet.some((l) => l.unicode?.includes("180°")));
    assert.ok(complet.every((l) => l.accessible));
    const compact = redigerConfigurationAngles(solution, { profil: "compact" });
    assert.ok(compact.length <= complet.length);
  });
});

describe("dessinerConfigurationAngles — le SVG est sain", () => {
  it("chaque type se dessine sans NaN, avec une viewBox valide", () => {
    for (const type of [
      "secantes", "perpendiculaires", "supplementaires", "complementaires",
      "bissectrice", "paralleles-secante", "triangle", "angle-exterieur", "quadrilatere",
    ]) {
      for (const orientationDeg of [0, 63, 197]) {
        const instance = creerConfigurationAngles({ type, angleDeg: 55, orientationDeg });
        const montrer = instance.angles.slice(0, 2).map((a) => ({ id: a.id }));
        const svg = dessinerConfigurationAngles(instance, { montrer, theme: "couleur" });
        assert.match(svg, /^<svg /, type);
        assert.ok(!/NaN|Infinity/.test(svg), `${type} à ${orientationDeg}° : NaN dans le SVG`);
      }
    }
  });

  it("les secteurs montrés produisent un remplissage et un arc, texte « ? » possible", () => {
    const instance = creerConfigurationAngles({ type: "paralleles-secante", angleDeg: 55 });
    const svg = dessinerConfigurationAngles(instance, {
      montrer: [
        { id: instance.angles[0].id, texte: "?" },
        { id: instance.angles[5].id, arcs: 2 },
      ],
    });
    assert.match(svg, /fill-opacity="0.16"/);
    assert.match(svg, />\?</);
    assert.ok((svg.match(/<polyline/g) ?? []).length >= 3); // 1 arc + 2 arcs
  });

  it("refuse un angle à montrer inconnu", () => {
    const instance = creerConfigurationAngles({ type: "secantes" });
    assert.throws(
      () => dessinerConfigurationAngles(instance, { montrer: [{ id: "Z:zz" }] }),
      /angle à montrer inconnu/,
    );
  });
});

describe("perpendiculaires — l'angle droit se déduit sans mesure donnée", () => {
  it("chaque angle se résout à 90° par la relation « droit », sans valeurs", () => {
    const instance = creerConfigurationAngles({ type: "perpendiculaires" });
    for (const a of instance.angles) {
      const solution = resoudreConfigurationAngles(instance, { inconnue: a.id });
      assert.equal(solution.mesureDeg, 90);
      assert.equal(solution.relation, "droit");
      const textes = solution.etapes.map((e) => e.texte ?? "").join("\n");
      assert.match(textes, /perpendiculaires/);
      assert.match(textes, /angles droits/);
    }
  });

  it("les sécantes ordinaires, elles, exigent toujours une mesure", () => {
    const instance = creerConfigurationAngles({ type: "secantes", angleDeg: 55 });
    assert.throws(
      () => resoudreConfigurationAngles(instance, { inconnue: instance.angles[0].id }),
      /aucune relation/,
    );
  });
});
