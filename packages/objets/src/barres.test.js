import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COULEURS_BARRES } from "../../charte/src/charte.js";
import {
  AFFICHAGES_INCONNUE,
  ETATS_PIECE,
  VERSION_BARRES,
  dessinerBarres,
} from "./barres.js";

// L'exemple canonique d'ÉquaBarre : 2 + 2x + 7 = 3x + 5 + 1 (x = 3).
// Membre droit en haut, membre gauche en bas, comme dans l'outil.
const equationEquaBarre = () => ({
  lignes: [
    {
      pieces: [
        { type: "inconnue" },
        { type: "inconnue" },
        { type: "inconnue" },
        { type: "nombre", valeur: 5 },
        { type: "nombre", valeur: 1 },
      ],
    },
    {
      pieces: [
        { type: "nombre", valeur: 2 },
        { type: "inconnue" },
        { type: "inconnue" },
        { type: "nombre", valeur: 7 },
      ],
    },
  ],
  inconnue: { affichage: "lettre", lettre: "x", valeur: 3 },
});

const largeursDe = (svg) =>
  [...svg.matchAll(/<rect[^>]*? width="([0-9.]+)" height="104"[^>]*?\/>/g)].map((m) => Number(m[1]));

describe("dessinerBarres (v2, langage ÉquaBarre)", () => {
  it("version 2 et rendu déterministe", () => {
    assert.equal(VERSION_BARRES, 2);
    assert.equal(dessinerBarres(equationEquaBarre()), dessinerBarres(equationEquaBarre()));
  });

  it("largeurs proportionnelles, l'inconnue pesant sa solution", () => {
    const svg = dessinerBarres(equationEquaBarre());
    const largeurs = largeursDe(svg);
    // haut : x x x 5 1 → 3,3,3,5,1 ; bas : 2 x x 7 → 2,3,3,7 (fonds pleins)
    assert.equal(largeurs.length, 9);
    const unite = largeurs[4]; // la case « 1 »
    const attendus = [3, 3, 3, 5, 1, 2, 3, 3, 7];
    largeurs.forEach((l, i) => {
      assert.ok(Math.abs(l - attendus[i] * unite) < 1e-6, `case ${i} : ${l} ≠ ${attendus[i]} × ${unite}`);
    });
  });

  it("les deux membres égaux donnent deux lignes de même largeur totale", () => {
    const svg = dessinerBarres(equationEquaBarre());
    const sommes = [0, 0];
    largeursDe(svg).forEach((l, i) => {
      sommes[i < 5 ? 0 : 1] += l;
    });
    assert.ok(Math.abs(sommes[0] - sommes[1]) < 1e-6, `lignes inégales : ${sommes}`);
  });

  it("aucune accolade : pas de chemin d'accolade dans le rendu", () => {
    const svg = dessinerBarres(equationEquaBarre());
    const chemins = (svg.match(/<path/g) || []).length;
    assert.equal(chemins, 0, "le langage barres maths&go n'utilise pas d'accolades");
  });

  it("filets : traits à 36 % d'opacité, jamais doublés entre les lignes", () => {
    const svg = dessinerBarres(equationEquaBarre());
    assert.match(svg, /stroke-opacity="0.36"/);
    // 1 trait haut + 2 traits bas de ligne + verticales : le trait
    // horizontal du milieu n'apparaît qu'une fois (bas de la ligne 0)
    const horizontales = [...svg.matchAll(/<line x1="[0-9.]+" y1="([0-9.]+)" x2="[0-9.]+" y2="\1"/g)].map((m) => Number(m[1]));
    const doublons = horizontales.filter((y, i) => horizontales.indexOf(y) !== i);
    assert.deepEqual(doublons, [], `traits horizontaux doublés aux y=${doublons}`);
  });

  it("inconnue : lettre italique bleue par défaut, « ? » ou Splat sur demande", () => {
    const lettre = dessinerBarres(equationEquaBarre());
    assert.match(lettre, /font-style="italic"/);
    assert.match(lettre, new RegExp(`fill="${COULEURS_BARRES.inconnueTexte}"[^>]*>x<`));

    const question = dessinerBarres({ ...equationEquaBarre(), inconnue: { affichage: "question", valeur: 3 } });
    assert.match(question, />\?</);
    assert.ok(!question.includes("font-style"));

    const splat = dessinerBarres({ ...equationEquaBarre(), inconnue: { affichage: "splat", valeur: 3 } });
    assert.match(splat, new RegExp(`<path d="M50 8[^"]*" fill="${COULEURS_BARRES.splat}"`));
  });

  it("états : hachures et opacités conformes aux outils", () => {
    const svg = dessinerBarres({
      lignes: [
        {
          pieces: [
            { type: "nombre", valeur: 4, etat: "selectionSuppression" },
            { type: "nombre", valeur: 4, etat: "selectionAjout" },
            { type: "nombre", valeur: 4, etat: "aCalculer" },
            { type: "nombre", valeur: 4, etat: "supprime" },
            { type: "nombre", valeur: 4, etat: "resultat" },
            { type: "nombre", valeur: 4, etat: "conclu" },
          ],
        },
      ],
    });
    for (const etat of ["selectionSuppression", "selectionAjout", "aCalculer", "supprime"]) {
      assert.match(svg, new RegExp(`url\\(#mgb-${etat}\\)`), `hachures absentes pour ${etat}`);
    }
    assert.match(svg, /<g opacity="0.42">/); // case supprimée estompée
    assert.match(svg, new RegExp(`fill="${COULEURS_BARRES.conclusion}"`)); // conclu en rouge
  });

  it("échappe les textes libres : impossible d'injecter du balisage", () => {
    const svg = dessinerBarres({
      lignes: [
        {
          etiquette: '<img src=x onerror="1">',
          pieces: [{ type: "nombre", valeur: 2, etiquette: "<script>alert(1)</script>" }],
        },
      ],
    });
    assert.ok(!svg.includes("<script"), "balise script non échappée");
    assert.ok(!svg.includes("<img"), "balise img non échappée");
    assert.match(svg, /&lt;script&gt;/);
  });

  it("virgule décimale française dans les cases", () => {
    const svg = dessinerBarres({ lignes: [{ pieces: [{ type: "nombre", valeur: 2.5 }] }] });
    assert.match(svg, />2,5</);
  });

  it("n'utilise que des couleurs de la charte barres (plus le blanc)", () => {
    const autorisees = new Set([...Object.values(COULEURS_BARRES), "#ffffff"]);
    const svg = dessinerBarres({
      lignes: [
        {
          etiquette: "Léa",
          pieces: ETATS_PIECE.map((etat) => ({ type: "nombre", valeur: 2, etat })).concat(
            [{ type: "inconnue" }],
            ["vert", "bleu", "orange"].map((role) => ({ type: "nombre", valeur: 2, role })),
          ),
        },
      ],
      inconnue: { affichage: "splat", valeur: 2 },
    });
    for (const couleur of svg.match(/#[0-9a-f]{6}/g) || []) {
      assert.ok(autorisees.has(couleur), `couleur hors charte : ${couleur}`);
    }
  });

  it("rejette les entrées invalides", () => {
    assert.throws(() => dessinerBarres({ lignes: [] }), RangeError);
    assert.throws(
      () => dessinerBarres({ lignes: [{ pieces: [{ type: "nombre", valeur: 0 }] }] }),
      RangeError,
    );
    assert.throws(
      () => dessinerBarres({ lignes: [{ pieces: [{ type: "tarte", valeur: 1 }] }] }),
      RangeError,
    );
    assert.throws(
      () =>
        dessinerBarres({
          lignes: [{ pieces: [{ type: "nombre", valeur: 1, etat: "cassé" }] }],
        }),
      RangeError,
    );
    assert.throws(
      () => dessinerBarres({ lignes: [{ pieces: [{ type: "inconnue" }] }], inconnue: { affichage: "photo" } }),
      RangeError,
    );
  });

  it("expose bien les trois affichages d'inconnue", () => {
    assert.deepEqual(AFFICHAGES_INCONNUE, ["lettre", "question", "splat"]);
  });
});
