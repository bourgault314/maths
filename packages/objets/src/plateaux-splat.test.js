import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  COULEURS_PLATEAUX,
  RAYON_BILLE,
  RAYON_JETON,
  RAYON_TACHE,
  chercherFusion,
  contraindrePositionJeton,
  couleurJetonPositif,
  dessinerPlateaux,
  dispositionPaquets,
  placerJetons,
  plateauDuCote,
  positionsTaches,
} from "./plateaux-splat.js";
import { creerEtat, faireDesPaquets, importerCharge } from "./equasplat-logique.js";
import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";

describe("positionsTaches — la constellation des taches", () => {
  it("range 3 taches en deux rangées (2 puis 1)", () => {
    const pieces = [{ type: "tache" }, { type: "tache" }, { type: "tache" }];
    const positions = positionsTaches(pieces, plateauDuCote("gauche"));
    assert.equal(positions.size, 3);
    const [a, b, c] = [positions.get(0), positions.get(1), positions.get(2)];
    assert.equal(a.cy, b.cy);
    assert.ok(c.cy > a.cy);
    assert.equal(a.r, RAYON_TACHE);
  });

  it("ignore les jetons : seules les taches reçoivent une place", () => {
    const pieces = [{ type: "jeton", valeur: 4 }, { type: "tache" }];
    const positions = positionsTaches(pieces, plateauDuCote("droite"));
    assert.equal(positions.size, 1);
    assert.ok(positions.has(1));
  });
});

describe("placerJetons — le placement naturel, reproductible", () => {
  it("même graine, mêmes positions ; jetons dans le plateau, hors taches", () => {
    const faire = () => {
      const etat = creerEtat("2x + 4 = 18");
      placerJetons(etat, creerGenerateur("positions-1"));
      return etat;
    };
    const a = faire();
    const b = faire();
    assert.deepEqual(
      a.droite.map((p) => [p.x, p.y]),
      b.droite.map((p) => [p.x, p.y]),
    );
    const plateau = plateauDuCote("droite");
    for (const jeton of a.droite) {
      assert.ok(jeton.x > plateau.x && jeton.x < plateau.x + plateau.w);
      assert.ok(jeton.y > plateau.y && jeton.y < plateau.y + plateau.h);
    }
    const taches = [...positionsTaches(a.gauche, plateauDuCote("gauche")).values()];
    for (const jeton of a.gauche.filter((p) => p.type === "jeton")) {
      for (const t of taches) {
        assert.ok(Math.hypot(jeton.x - t.cx, jeton.y - t.cy) >= t.r + RAYON_JETON);
      }
    }
  });

  it("ne déplace pas un jeton déjà posé à la main (position sûre)", () => {
    const etat = creerEtat("x + 4 = 11");
    const plateau = plateauDuCote("droite");
    etat.droite[0].x = plateau.x + 200;
    etat.droite[0].y = plateau.y + 500;
    placerJetons(etat, creerGenerateur("g"));
    assert.equal(etat.droite[0].x, plateau.x + 200);
    assert.equal(etat.droite[0].y, plateau.y + 500);
  });
});

describe("contraindrePositionJeton et chercherFusion", () => {
  it("ramène un jeton lâché hors du plateau à l'intérieur", () => {
    const plateau = plateauDuCote("gauche");
    const p = contraindrePositionJeton(plateau, [], -100, 2000);
    assert.ok(p.cx >= plateau.x + RAYON_JETON);
    assert.ok(p.cy <= plateau.y + plateau.h - RAYON_JETON);
  });

  it("trouve le jeton cible sous le jeton déposé, et lui seul", () => {
    const etat = creerEtat("2x + 4 = 18");
    etat.droite[0].x = 1000;
    etat.droite[0].y = 400;
    etat.droite.push({ type: "jeton", valeur: 3, x: 1400, y: 600 });
    assert.equal(chercherFusion(etat, "droite", 1, 1010, 420), 0);
    assert.equal(chercherFusion(etat, "droite", 1, 1200, 400), null);
  });
});

describe("dessinerPlateaux — le dessin des deux plateaux", () => {
  it("dessine deux plateaux, le signe égal, taches et jetons", () => {
    const etat = creerEtat("2x + 4 = 18");
    const svg = dessinerPlateaux(etat);
    assert.match(svg, /^<svg /);
    assert.equal((svg.match(/rx="34"/g) || []).length, 2);
    assert.match(svg, />=<\/text>/);
    assert.equal((svg.match(new RegExp(COULEURS_PLATEAUX.tache, "g")) || []).length, 2);
    assert.match(svg, /font-style="italic"/);
  });

  it("la tache −x est violette, étiquetée −x", () => {
    const etat = creerEtat("-x + 6 = -3", { univers: "relatif", tachesOpposees: true });
    const svg = dessinerPlateaux(etat);
    assert.match(svg, new RegExp(COULEURS_PLATEAUX.tacheOpposee));
    assert.match(svg, /−x</);
  });

  it("l'inconnue « ? » s'affiche sur la tache", () => {
    const etat = creerEtat("x + 2 = 9", { affichageInconnue: "question" });
    assert.match(dessinerPlateaux(etat), />\?<\/text>/);
  });

  it("en positif chaque valeur a sa teinte ; en relatif vert/rouge", () => {
    const positif = creerEtat("x + 4 = 11");
    assert.match(dessinerPlateaux(positif), /hsla\(/);
    assert.deepEqual(couleurJetonPositif(4), {
      fond: "hsla(148, 78%, 54%, .20)",
      bord: "hsla(148, 78%, 45%, .62)",
    });
    const relatif = creerEtat("x - 4 = 6", { univers: "relatif" });
    const svg = dessinerPlateaux(relatif);
    assert.match(svg, new RegExp(COULEURS_PLATEAUX.negatifBord));
    assert.match(svg, new RegExp(COULEURS_PLATEAUX.relatifPositifBord));
    assert.match(svg, /−4</);
  });

  it("une pièce enlevée est hachurée — ou masquée sur demande", () => {
    const etat = creerEtat("x + 4 = 11");
    etat.gauche[1].etat = "supprime";
    const garde = dessinerPlateaux(etat);
    assert.match(garde, /hachuresSupprime\)/);
    assert.match(garde, /opacity="\.28"/);
    const masque = dessinerPlateaux(etat, { apresSuppression: "masquer" });
    assert.doesNotMatch(masque, /url\(#hachuresSupprime\)/);
  });

  it("les sélections entourent en orange (enlever) et vert (regrouper)", () => {
    const etat = creerEtat("2x + 4 = 18");
    const svg = dessinerPlateaux(etat, {
      selectionSuppression: [{ cote: "gauche", indice: 0 }],
      selectionRegroupement: [{ cote: "droite", indice: 0 }],
    });
    assert.match(svg, new RegExp(`stroke="${COULEURS_PLATEAUX.selectionSuppression}" stroke-width="7"`));
    assert.match(svg, new RegExp(`stroke="${COULEURS_PLATEAUX.selectionRegroupement}" stroke-width="7"`));
  });

  it("le mode interactif pose data-cote et data-indice sur chaque pièce", () => {
    const etat = creerEtat("2x + 4 = 18");
    const svg = dessinerPlateaux(etat, { interactif: true });
    assert.equal((svg.match(/data-cote="gauche"/g) || []).length, 3);
    assert.equal((svg.match(/data-cote="droite"/g) || []).length, 1);
    assert.match(svg, /data-type="tache"/);
    const statique = dessinerPlateaux(etat);
    assert.doesNotMatch(statique, /data-cote/);
  });

  it("la taille demandée est respectée, proportions gardées", () => {
    const etat = creerEtat("x + 2 = 9");
    const svg = dessinerPlateaux(etat, { largeur: 400 });
    assert.match(svg, /width="400" height="205"/);
  });

  it("même état, même dessin (déterminisme)", () => {
    const etat = creerEtat("2x + 4 = 18");
    placerJetons(etat, creerGenerateur("d"));
    assert.equal(dessinerPlateaux(etat), dessinerPlateaux(etat));
  });
});

describe("les billes et leurs paquets", () => {
  function etatBilles() {
    return importerCharge({ numberMode: "unit", top: ["x", "x", "x"], bottom: [12] });
  }

  it("les billes sont petites, bleues, sans chiffre", () => {
    const svg = dessinerPlateaux(etatBilles());
    assert.match(svg, new RegExp(`r="${RAYON_BILLE}"`));
    assert.match(svg, /rgba\(27,102,255/);
    assert.doesNotMatch(svg, />1<\/text>/);
  });

  it("dispositionPaquets range 12 billes en 3 boîtes de 4", () => {
    const etat = etatBilles();
    faireDesPaquets(etat, 3);
    const disposition = dispositionPaquets(etat);
    assert.equal(disposition.boites.length, 3);
    assert.equal(disposition.positions.size, 12);
  });

  it("les boîtes justes sont vertes, les autres bleues en pointillé", () => {
    const juste = etatBilles();
    faireDesPaquets(juste, 3);
    assert.match(dessinerPlateaux(juste), new RegExp(COULEURS_PLATEAUX.paquetJusteBord.replace(/[().]/g, "\\$&")));
    const faux = etatBilles();
    faireDesPaquets(faux, 4);
    assert.match(dessinerPlateaux(faux), /stroke-dasharray="8 7"/);
  });
});
