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
  squareRootSvg,
} from "./pythagore.js";
import { COULEURS_PYTHAGORE } from "../../charte/src/charte.js";

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

describe("pythagore : la racine dessinée n'a pas bougé en changeant de fichier", () => {
  // Relevé de la sortie produite par le composant du studio avant le
  // déménagement du tracé. Toute divergence, même d'un millième, casse ici.
  const SORTIE_PAR_DEFAUT =
    '<g fill="#334155" stroke="#334155">' +
    '<path d="M 0 13.52 l 3.96 6.12 l 5.76 -14.76 H 33.4" fill="none" stroke-width="1.98"' +
    ' stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text x="12.24" y="20" stroke="none" font-family="Segoe UI,Arial,sans-serif"' +
    ' font-size="18" font-weight="750">25</text></g>';

  it("rend exactement le même SVG qu'avant, valeurs par défaut", () => {
    assert.equal(squareRootSvg(), SORTIE_PAR_DEFAUT);
  });

  it("garde les mêmes arrondis au millième sur d'autres tailles", () => {
    assert.equal(
      squareRootSvg({ x: 12.5, baseline: 33.7, radicand: "676", fontSize: 20, fontWeight: 800 }),
      '<g fill="#334155" stroke="#334155">' +
        '<path d="M 12.5 26.5 l 4.4 6.8 l 6.4 -16.4 H 60.7" fill="none" stroke-width="2.2"' +
        ' stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="26.1" y="33.7" stroke="none" font-family="Segoe UI,Arial,sans-serif"' +
        ' font-size="20" font-weight="800">676</text></g>',
    );
  });

  it("les barres prennent leurs couleurs dans la charte", () => {
    const { p, t } = travailA("remplacer");
    const svg = dessinerBarresPythagore(p, t);
    assert.ok(svg.includes(COULEURS_PYTHAGORE.hypFill));
    assert.ok(svg.includes(COULEURS_PYTHAGORE.leg1Stroke));
    assert.ok(svg.includes(COULEURS_PYTHAGORE.leg2Text));
  });
});
