import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dessinerCercle, dessinerFigure } from "./figure.js";
import {
  CATEGORIES_FIGURES,
  FIGURES_USUELLES,
  decrireCarre,
  decrireCerfVolant,
  decrireParallelogramme,
  decrireRectangle,
  decrireTriangleIsocele,
  decrireTriangleRectangle,
} from "./figures-usuelles.js";
import {
  angleInterieurPolygone,
  distance,
  transformer,
} from "./geometrie.js";

describe("le registre FIGURES_USUELLES", () => {
  it("chaque entrée est complète et se dessine sans erreur, même tournée", () => {
    for (const [cle, entree] of Object.entries(FIGURES_USUELLES)) {
      assert.ok(entree.titre, `${cle} : titre manquant`);
      assert.ok(
        CATEGORIES_FIGURES.includes(entree.categorie),
        `${cle} : catégorie inconnue « ${entree.categorie} »`,
      );
      assert.ok(["polygone", "cercle"].includes(entree.genre), `${cle} : genre invalide`);
      assert.ok(Array.isArray(entree.parametres), `${cle} : paramètres manquants`);

      const description = entree.decrire();
      if (entree.genre === "polygone") {
        description.transform = { rotationDeg: 137 };
        description.visible = { angles: true, mesuresCotes: true, mesuresAngles: true };
        const svg = dessinerFigure(description);
        assert.match(svg, /^<svg /, `${cle} : SVG invalide`);
      } else {
        const svg = dessinerCercle(description);
        assert.match(svg, /^<svg /, `${cle} : SVG invalide`);
      }
    }
  });

  it("chaque paramètre déclaré est accepté par le constructeur", () => {
    for (const [cle, entree] of Object.entries(FIGURES_USUELLES)) {
      const options = {};
      for (const p of entree.parametres) options[p.cle] = p.defaut;
      const description = entree.decrire(options);
      assert.ok(description, `${cle} : échec avec les paramètres par défaut`);
    }
  });

  it("toutes les catégories annoncées sont utilisées", () => {
    const utilisees = new Set(
      Object.values(FIGURES_USUELLES).map((e) => e.categorie),
    );
    for (const categorie of CATEGORIES_FIGURES) {
      assert.ok(utilisees.has(categorie), `catégorie vide : ${categorie}`);
    }
  });
});

describe("les codages par défaut disent la vérité géométrique", () => {
  const cotesEgaux = (sommets, nom, groupe) => {
    const longueurs = groupe.map((c) => {
      const i = nom.indexOf(c[0]);
      const j = nom.indexOf(c[1]);
      return distance(sommets[i], sommets[j]);
    });
    longueurs.forEach((l) =>
      assert.ok(Math.abs(l - longueurs[0]) < 1e-9, `côtés ${groupe} non égaux`),
    );
  };

  it("carré : le codage d'égalité couvre quatre côtés réellement égaux", () => {
    const { sommets, nom, codages } = decrireCarre({ cote: 5 });
    const egalite = codages.find((c) => c.type === "egalite");
    assert.equal(egalite.cotes.length, 4);
    cotesEgaux(sommets, nom, egalite.cotes);
    const droits = codages.find((c) => c.type === "angleDroit");
    for (const lettre of droits.sommets) {
      const i = nom.indexOf(lettre);
      assert.ok(Math.abs(angleInterieurPolygone(sommets, i).mesureDeg - 90) < 1e-9);
    }
  });

  it("rectangle et parallélogramme : chaque groupe d'égalité est vrai", () => {
    for (const description of [decrireRectangle(), decrireParallelogramme()]) {
      for (const codage of description.codages.filter((c) => c.type === "egalite")) {
        cotesEgaux(description.sommets, description.nom, codage.cotes);
      }
    }
  });

  it("cerf-volant et triangle isocèle : les paires codées sont égales", () => {
    for (const description of [decrireCerfVolant(), decrireTriangleIsocele()]) {
      for (const codage of description.codages.filter((c) => c.type === "egalite")) {
        cotesEgaux(description.sommets, description.nom, codage.cotes);
      }
    }
  });

  it("triangle rectangle : l'angle droit codé est réellement droit", () => {
    const { sommets, nom, codages } = decrireTriangleRectangle({ cathetes: [4, 3] });
    const lettre = codages.find((c) => c.type === "angleDroit").sommets[0];
    const i = nom.indexOf(lettre);
    assert.ok(Math.abs(angleInterieurPolygone(sommets, i).mesureDeg - 90) < 1e-9);
  });

  it("les codages restent vrais après rotation et miroir", () => {
    const { sommets, nom, codages } = decrireCerfVolant();
    const tournes = transformer(sommets, { rotationDeg: 213, miroirX: true });
    for (const codage of codages.filter((c) => c.type === "egalite")) {
      const longueurs = codage.cotes.map((c) =>
        distance(tournes[nom.indexOf(c[0])], tournes[nom.indexOf(c[1])]),
      );
      longueurs.forEach((l) => assert.ok(Math.abs(l - longueurs[0]) < 1e-9));
    }
  });
});

describe("surcharges", () => {
  it("coder: false retire tous les codages", () => {
    assert.equal(decrireCarre({ coder: false }).codages.length, 0);
  });

  it("un nom personnalisé se propage aux codages", () => {
    const { codages } = decrireRectangle({ nom: "MNPQ" });
    assert.deepEqual(
      codages.find((c) => c.type === "egalite").cotes,
      ["MN", "PQ"],
    );
    assert.deepEqual(codages.find((c) => c.type === "angleDroit").sommets, [
      "M",
      "N",
      "P",
      "Q",
    ]);
  });
});
