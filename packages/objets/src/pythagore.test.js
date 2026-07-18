import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  creerProbleme,
  creerTravail,
  demarrer,
  etapeCourante,
  suivantAuto,
} from "./pythagore-logique.js";
import {
  VERSION_PYTHAGORE_RENDU,
  dessinerBarresPythagore,
  dessinerTrianglePythagore,
  racineEnLigne,
  roleCouleur,
} from "./pythagore.js";

const probleme = () => creerProbleme({ valeurs: { AB: 3, AC: 4, BC: "?" } });

function travailA(etapeVoulue) {
  const p = probleme();
  const t = creerTravail();
  demarrer(t);
  while (etapeCourante(p, t) !== etapeVoulue && etapeCourante(p, t) !== "fini") suivantAuto(p, t);
  return { p, t };
}

describe("pythagore : rendu", () => {
  it("expose sa version", () => {
    assert.equal(VERSION_PYTHAGORE_RENDU, 1);
  });

  it("colore l'hypoténuse en vert et les jambes en bleu puis orange, sans jamais changer", () => {
    const p = probleme();
    assert.equal(roleCouleur(p, "BC"), "hyp");
    assert.equal(roleCouleur(p, "CB"), "hyp");
    assert.equal(roleCouleur(p, "AB"), "leg1");
    assert.equal(roleCouleur(p, "AC"), "leg2");
  });

  it("dessine les cases-slots cliquables pendant la relation", () => {
    const { p, t } = travailA("relation");
    const svg = dessinerBarresPythagore(p, t);
    assert.ok(svg.startsWith("<svg"));
    for (const slot of ["lhs", "rhs1", "rhs2"]) assert.ok(svg.includes(`data-pytha-slot="${slot}"`), slot);
    assert.ok(svg.includes("…²"));
  });

  it("rend les cases à remplacer puis à calculer cliquables, jamais les autres", () => {
    const { p, t } = travailA("remplacer");
    const svgRemplacer = dessinerBarresPythagore(p, t);
    assert.ok(svgRemplacer.includes('data-pytha-remplacer="AB"'));
    assert.ok(svgRemplacer.includes('data-pytha-remplacer="AC"'));
    assert.ok(!svgRemplacer.includes("data-pytha-calculer"));
    suivantAuto(p, t);
    const svgCalculer = dessinerBarresPythagore(p, t);
    assert.ok(svgCalculer.includes("data-pytha-calculer"));
    assert.ok(!svgCalculer.includes("data-pytha-remplacer"));
  });

  it("hachure la case enlevée du chemin côté", () => {
    const p = creerProbleme({ valeurs: { AB: 3, AC: "?", BC: 5 } });
    const t = creerTravail();
    demarrer(t);
    while (etapeCourante(p, t) !== "racine") suivantAuto(p, t);
    const svg = dessinerBarresPythagore(p, t);
    assert.ok(svg.includes("pythaHachures"));
  });

  it("dessine le triangle aux vraies proportions avec moulin, angle droit et longueurs", () => {
    const { p, t } = travailA("relation");
    const svg = dessinerTrianglePythagore(p, t);
    assert.ok(svg.startsWith("<svg"));
    assert.ok(!svg.includes("NaN"));
    for (const cote of ["AB", "AC", "BC"]) assert.ok(svg.includes(`data-pytha-aire="${cote}"`), cote);
    assert.ok(svg.includes("#ef4444"), "l'angle droit rouge");
    assert.ok(svg.includes(">?<"), "l'inconnue affiche ?");
  });

  it("rend les longueurs cliquables à l'étape remplacer, et la réponse à la fin", () => {
    const { p, t } = travailA("remplacer");
    const svg = dessinerTrianglePythagore(p, t);
    assert.ok(svg.includes('data-pytha-longueur="AB"'));
    assert.ok(!svg.includes("data-pytha-aire"), "le moulin n'est plus cliquable après la relation");
    while (etapeCourante(p, t) !== "fini") suivantAuto(p, t);
    const fini = dessinerTrianglePythagore(p, t);
    assert.ok(fini.includes("5\u00a0cm"), "la longueur trouvée remplace le ?");
  });

  it("tourne par quarts de tour sans rien perdre", () => {
    for (const rotation of [0, 1, 2, 3]) {
      const p = creerProbleme({ valeurs: { AB: 3, AC: 4, BC: "?" }, rotation });
      const t = creerTravail();
      demarrer(t);
      const svg = dessinerTrianglePythagore(p, t);
      assert.ok(!svg.includes("NaN"), `rotation ${rotation}`);
      assert.ok(svg.includes(">A<") && svg.includes(">B<") && svg.includes(">C<"));
    }
  });

  it("dessine la racine carrée sans jamais écrire le caractère √", () => {
    const svg = racineEnLigne({ gauche: "BC", radicande: "25" });
    assert.ok(svg.startsWith("<svg"));
    assert.ok(!svg.includes("√"));
    assert.ok(svg.includes("25"));
    assert.ok(svg.includes("racine carrée"), "l'aria-label reste lisible");
  });

  it("est déterministe", () => {
    const { p, t } = travailA("remplacer");
    assert.equal(dessinerBarresPythagore(p, t), dessinerBarresPythagore(p, t));
    assert.equal(dessinerTrianglePythagore(p, t), dessinerTrianglePythagore(p, t));
  });
});
