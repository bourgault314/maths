import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  annuler,
  changerMode,
  cliquerPiece,
  creerEtat,
  decomposer,
  enleverPossible,
  enleverSelection,
  estResolue,
  partager,
  regrouperSelection,
  texteDuMembre,
} from "./equabarre-logique.js";

// Rappel : ligne 0 = membre droit (haut), ligne 1 = membre gauche (bas).

describe("creerEtat et équation qui suit", () => {
  it("l'historique démarre avec l'équation écrite depuis les barres", () => {
    const etat = creerEtat("2 + 2x + 7 = 3x + 5 + 1");
    assert.deepEqual(etat.historique, ["2x + 2 + 7 = 3x + 5 + 1"]);
    assert.equal(etat.solution, 3);
  });

  it("texteDuMembre ignore les cases enlevées", () => {
    const pieces = [
      { type: "inconnue" },
      { type: "nombre", valeur: 4, etat: "supprime" },
      { type: "nombre", valeur: 7 },
    ];
    assert.equal(texteDuMembre(pieces, "x"), "x + 7");
  });
});

describe("enlever dans chaque membre", () => {
  it("exige la même quantité en haut et en bas", () => {
    const etat = creerEtat("x + 5 = 2x + 1");
    // sélectionne x en bas seulement → impossible
    cliquerPiece(etat, 1, 0);
    assert.equal(enleverPossible(etat), false);
    assert.throws(() => enleverSelection(etat), /même quantité/);
    // sélectionne x en haut aussi → possible
    cliquerPiece(etat, 0, 0);
    assert.equal(enleverPossible(etat), true);
    enleverSelection(etat);
    assert.equal(etat.historique.at(-1), "5 = x + 1");
  });

  it("des nombres de même somme s'enlèvent aussi (4 contre 3+1)", () => {
    const etat = creerEtat("x + 3 + 1 = 4 + 8");
    cliquerPiece(etat, 1, 1); // 3 (bas)
    cliquerPiece(etat, 1, 2); // 1 (bas)
    cliquerPiece(etat, 0, 0); // 4 (haut)
    assert.equal(enleverPossible(etat), true);
    enleverSelection(etat);
    assert.equal(etat.historique.at(-1), "x = 8");
    assert.equal(estResolue(etat), true);
  });

  it("les cases enlevées restent présentes, hachurées (garder hachuré)", () => {
    const etat = creerEtat("x + 2 = 5 + 2");
    cliquerPiece(etat, 1, 1);
    cliquerPiece(etat, 0, 1);
    enleverSelection(etat);
    assert.equal(etat.lignes[1].pieces.length, 2);
    assert.equal(etat.lignes[1].pieces[1].etat, "supprime");
  });
});

describe("décomposer, partager, regrouper, déplacer", () => {
  it("décomposer 9 en 4 + 5, refuse une mauvaise somme", () => {
    const etat = creerEtat("x + 9 = 12");
    assert.throws(() => decomposer(etat, 1, 1, [4, 4]), /la somme fait 8/);
    decomposer(etat, 1, 1, [4, 5]);
    assert.equal(etat.historique.at(-1), "x + 4 + 5 = 12");
  });

  it("partager 12 en 3 parts égales, refuse le non-divisible", () => {
    const etat = creerEtat("3x = 12");
    assert.throws(() => partager(etat, 0, 0, 5), /pas partageable/);
    partager(etat, 0, 0, 3);
    assert.equal(etat.historique.at(-1), "3x = 4 + 4 + 4");
  });

  it("regrouper 5 + 1 en 6 (même membre uniquement)", () => {
    const etat = creerEtat("2x + 4 = x + 5 + 1");
    changerMode(etat, "regrouper");
    cliquerPiece(etat, 0, 1); // 5 (haut)
    const refus = cliquerPiece(etat, 1, 1); // 4 (bas) → refusé
    assert.equal(refus.action, "rien");
    cliquerPiece(etat, 0, 2); // 1 (haut)
    regrouperSelection(etat);
    assert.equal(etat.historique.at(-1), "2x + 4 = x + 6");
  });

  it("déplacer échange deux cases d'un même membre", () => {
    const etat = creerEtat("x + 3 + 8 = 12");
    changerMode(etat, "deplacer");
    cliquerPiece(etat, 1, 1);
    const resultat = cliquerPiece(etat, 1, 2);
    assert.equal(resultat.action, "deplace");
    assert.deepEqual(
      etat.lignes[1].pieces.map((p) => p.valeur ?? "x"),
      ["x", 8, 3],
    );
  });
});

describe("annuler et résolution", () => {
  it("annuler restaure l'état et l'historique précédents", () => {
    const etat = creerEtat("x + 5 = 2x + 1");
    cliquerPiece(etat, 1, 0);
    cliquerPiece(etat, 0, 0);
    enleverSelection(etat);
    assert.equal(etat.historique.length, 2);
    annuler(etat);
    assert.equal(etat.historique.length, 1);
    assert.equal(etat.lignes[1].pieces[0].etat, undefined);
  });

  it("le déroulé complet de 2 + 2x + 7 = 3x + 5 + 1 mène à x = 3", () => {
    const etat = creerEtat("2 + 2x + 7 = 3x + 5 + 1");
    // enlever 2x des deux côtés
    cliquerPiece(etat, 1, 1);
    cliquerPiece(etat, 1, 2);
    cliquerPiece(etat, 0, 0);
    cliquerPiece(etat, 0, 1);
    enleverSelection(etat);
    // regrouper 2 + 7 (bas) puis 5 + 1 (haut)
    changerMode(etat, "regrouper");
    cliquerPiece(etat, 1, 0);
    cliquerPiece(etat, 1, 3);
    regrouperSelection(etat);
    cliquerPiece(etat, 0, 3);
    cliquerPiece(etat, 0, 4);
    regrouperSelection(etat);
    assert.equal(etat.historique.at(-1), "9 = x + 6");
    // enlever 6 des deux côtés : décompose 9 en 6 + 3 d'abord
    changerMode(etat, "decomposer");
    decomposer(etat, 1, 0, [6, 3]);
    changerMode(etat, "enlever");
    const basSix = etat.lignes[1].pieces.findIndex((p) => p.valeur === 6 && p.etat !== "supprime");
    const hautSix = etat.lignes[0].pieces.findIndex((p) => p.valeur === 6 && p.etat !== "supprime");
    cliquerPiece(etat, 1, basSix);
    cliquerPiece(etat, 0, hautSix);
    enleverSelection(etat);
    assert.equal(etat.historique.at(-1), "3 = x");
    assert.equal(estResolue(etat), true);
    assert.equal(etat.solution, 3);
  });
});
