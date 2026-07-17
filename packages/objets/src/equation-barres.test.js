import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyserEquation, barresDepuisEquation } from "./equation-barres.js";
import { dessinerBarres } from "./barres.js";

const formes = (liste) => liste.map((p) => (p.type === "inconnue" ? "x" : p.valeur));

describe("analyserEquation (langage ÉquaBarre)", () => {
  it("l'équation canonique de l'outil : 2 + 2x + 7 = 3x + 5 + 1", () => {
    const r = analyserEquation("2 + 2x + 7 = 3x + 5 + 1");
    assert.equal(r.lettre, "x");
    assert.equal(r.solution, 3);
    assert.deepEqual(formes(r.membreGauche), [2, "x", "x", 7]);
    assert.deepEqual(formes(r.membreDroit), ["x", "x", "x", 5, 1]);
  });

  it("l'équation de la carte Splat : 31 + 2×? … soit 31 + 2n = 47", () => {
    const r = analyserEquation("31 + 2n = 47");
    assert.equal(r.lettre, "n");
    assert.equal(r.solution, 8);
    assert.deepEqual(formes(r.membreGauche), [31, "x", "x"]);
  });

  it("la multiplication est une répétition : 2(x+3) = x + 9", () => {
    const r = analyserEquation("2(x+3) = x + 9");
    assert.deepEqual(formes(r.membreGauche), ["x", 3, "x", 3]);
    assert.equal(r.solution, 3);
  });

  it("multiplications explicites et implicites : 3×4 + x = 2·7", () => {
    const r = analyserEquation("3×4 + x = 2·7");
    assert.deepEqual(formes(r.membreGauche), [4, 4, 4, "x"]);
    assert.deepEqual(formes(r.membreDroit), [7, 7]);
    assert.equal(r.solution, 2);
  });

  it("refuse ce que l'outil refuse, avec des messages clairs", () => {
    assert.throws(() => analyserEquation("x + 5"), /signe =/);
    assert.throws(() => analyserEquation("x - 2 = 5"), /soustractions/);
    assert.throws(() => analyserEquation("2,5 + x = 5"), /entiers/);
    assert.throws(() => analyserEquation("x + y = 5"), /une seule lettre/);
    assert.throws(() => analyserEquation("3 + 4 = 7"), /aucune inconnue/);
    assert.throws(() => analyserEquation("x + 1 = x + 5"), /autant d'inconnues/);
    assert.throws(() => analyserEquation("2x = 7"), /entier strictement positif/);
    assert.throws(() => analyserEquation("x + 7 = 5"), /entier strictement positif/);
    assert.throws(() => analyserEquation("x(x+1) = 6"), /non gérée/);
  });
});

describe("barresDepuisEquation → dessinerBarres", () => {
  it("produit directement un schéma dessinable, membre droit en haut", () => {
    const donnees = barresDepuisEquation("31 + 2n = 47", { affichage: "question" });
    assert.equal(donnees.solution, 8);
    assert.deepEqual(formes(donnees.lignes[0].pieces.map((p) => ({ ...p, lettre: "x" }))), [47]);
    const svg = dessinerBarres(donnees);
    assert.ok(svg.startsWith("<svg"));
    assert.match(svg, />47</);
    assert.match(svg, />\?</);
  });

  it("les deux lignes du schéma ont la même longueur (preuve de l'égalité)", () => {
    const donnees = barresDepuisEquation("2 + 2x + 7 = 3x + 5 + 1");
    const poids = (pieces) =>
      pieces.reduce((s, p) => s + (p.type === "inconnue" ? donnees.solution : p.valeur), 0);
    assert.equal(poids(donnees.lignes[0].pieces), poids(donnees.lignes[1].pieces));
  });
});
