import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

import {
  COULEURS_NUMERATION_DECIMALE,
  COULEURS_RANGS_NUMERATION_DECIMALE,
} from "../../charte/src/charte.js";
import {
  ECHANGES_RANGS_NUMERATION_DECIMALE,
  ETATS_CONVERSION_RANGS_NUMERATION_DECIMALE,
  ORIENTATIONS_MATERIEL_NUMERATION_DECIMALE,
  SENS_CONVERSION_RANGS_NUMERATION_DECIMALE,
  VERSION_NUMERATION_DECIMALE,
  dessinerConversionRangsNumerationDecimale,
  dessinerEchangeRangsNumerationDecimale,
  dessinerMaterielNumerationDecimale,
  dessinerTableauNumerationDecimale,
} from "./numeration-decimale.js";
import { PROVENANCE_OBJETS } from "./provenance.js";

function compter(texte, motif) {
  return (texte.match(motif) ?? []).length;
}

function arrondi2(nombre) {
  return Number.parseFloat(Number(nombre).toFixed(2));
}

function positionsPieces(svg, classe) {
  const motif = new RegExp(
    `class="nd-piece ${classe}"[^>]*data-piece-index="(\\d+)"[^>]*` +
      `data-largeur-cellules="(\\d+)" data-hauteur-cellules="(\\d+)"[^>]*` +
      `transform="translate\\(([\\d.]+) ([\\d.]+)\\)"`,
    "g",
  );
  return [...svg.matchAll(motif)].map((correspondance) => ({
    index: Number(correspondance[1]),
    largeurCellules: Number(correspondance[2]),
    hauteurCellules: Number(correspondance[3]),
    x: Number(correspondance[4]),
    y: Number(correspondance[5]),
  }));
}

function verifierPiecesDansViewBox(rendu) {
  for (const classe of ["nd-unite", "nd-dixieme", "nd-centieme"]) {
    for (const piece of positionsPieces(rendu.svg, classe)) {
      assert.ok(piece.x >= 0);
      assert.ok(piece.y >= 0);
      assert.ok(
        piece.x + piece.largeurCellules * rendu.tailleCellule <= rendu.largeur + 0.01,
        `${classe} ${piece.index} dépasse horizontalement`,
      );
      assert.ok(
        piece.y + piece.hauteurCellules * rendu.tailleCellule <= rendu.hauteur + 0.01,
        `${classe} ${piece.index} dépasse verticalement`,
      );
    }
  }
}

describe("matériel de numération décimale", () => {
  it("expose une API versionnée et les deux orientations", () => {
    assert.equal(VERSION_NUMERATION_DECIMALE, 5);
    assert.deepEqual(ORIENTATIONS_MATERIEL_NUMERATION_DECIMALE, [
      "horizontale",
      "verticale",
    ]);
    assert.ok(Object.isFrozen(ORIENTATIONS_MATERIEL_NUMERATION_DECIMALE));
  });

  it("dessine le cas d'or 3,6 avec trois unités et six dixièmes horizontaux", () => {
    const rendu = dessinerMaterielNumerationDecimale({
      unites: 3,
      dixiemes: 6,
      centiemes: 0,
      orientation: "horizontale",
      largeur: 320,
    });
    const cellule = rendu.tailleCellule;
    const tailleUnite = arrondi2(10 * cellule);

    assert.equal(rendu.valeurCentiemes, 360);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-unite"/g), 3);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-dixieme"/g), 6);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-centieme"/g), 0);
    assert.match(
      rendu.svg,
      new RegExp(
        `class="nd-piece nd-unite"[\\s\\S]*?class="nd-forme"[^>]*width="${tailleUnite}" height="${tailleUnite}"`,
      ),
    );
    assert.match(
      rendu.svg,
      new RegExp(
        `class="nd-piece nd-dixieme"[\\s\\S]*?class="nd-forme"[^>]*width="${tailleUnite}" height="${cellule}"`,
      ),
    );
    assert.match(rendu.svg, new RegExp(`fill="${COULEURS_NUMERATION_DECIMALE.unite}"`));
    assert.match(rendu.svg, new RegExp(`fill="${COULEURS_NUMERATION_DECIMALE.dixieme}"`));
    assert.match(rendu.texteAlternatif, /3 unités et 6 dixièmes/);
    assert.match(rendu.texteAlternatif, /orientés horizontalement/);
    assert.ok(Object.isFrozen(rendu));
  });

  it("espace uniformément les dixièmes sans rupture arbitraire après cinq", () => {
    const rendu = dessinerMaterielNumerationDecimale({ dixiemes: 6 });
    const positions = positionsPieces(rendu.svg, "nd-dixieme");
    assert.equal(positions.length, 6);
    const pas = positions.slice(1).map((piece, index) =>
      arrondi2(piece.y - positions[index].y));
    assert.ok(pas[0] - rendu.tailleCellule >= 3);
    assert.deepEqual(new Set(pas).size, 1);
    assert.equal(compter(rendu.svg, /class="nd-separation-cinq"/g), 6);
  });

  it("dessine le cas d'or 1,47 sans changer d'échelle", () => {
    const rendu = dessinerMaterielNumerationDecimale({
      unites: 1,
      dixiemes: 4,
      centiemes: 7,
      largeur: 320,
    });

    assert.equal(rendu.valeurCentiemes, 147);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-unite"/g), 1);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-dixieme"/g), 4);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-centieme"/g), 7);
    assert.match(rendu.svg, new RegExp(`fill="${COULEURS_NUMERATION_DECIMALE.centieme}"`));
    assert.match(rendu.texteAlternatif, /1 unité, 4 dixièmes et 7 centièmes/);

    const centiemes = positionsPieces(rendu.svg, "nd-centieme");
    assert.ok(centiemes[1].x - centiemes[0].x - rendu.tailleCellule >= 3);
    assert.equal(
      arrondi2(centiemes[5].x - centiemes[4].x),
      arrondi2(centiemes[4].x - centiemes[3].x),
    );

    for (const classe of ["nd-unite", "nd-dixieme", "nd-centieme"]) {
      const [piece] = positionsPieces(rendu.svg, classe);
      assert.ok(piece);
      assert.deepEqual(
        [piece.largeurCellules, piece.hauteurCellules],
        classe === "nd-unite" ? [10, 10] : classe === "nd-dixieme" ? [10, 1] : [1, 1],
      );
    }
  });

  it("tourne seulement les dixièmes dans la variante verticale", () => {
    const rendu = dessinerMaterielNumerationDecimale({
      unites: 1,
      dixiemes: 6,
      centiemes: 7,
      orientation: "verticale",
      largeur: 320,
    });
    const dixiemes = positionsPieces(rendu.svg, "nd-dixieme");
    assert.deepEqual(
      [dixiemes[0].largeurCellules, dixiemes[0].hauteurCellules],
      [1, 10],
    );
    assert.equal(
      arrondi2(dixiemes[5].x - dixiemes[4].x),
      arrondi2(dixiemes[4].x - dixiemes[3].x),
    );
    assert.match(rendu.texteAlternatif, /orientés verticalement/);
    assert.match(rendu.svg, /data-orientation="verticale"/);
  });

  it("retrouve la cellule historique de 28 px sur un support large", () => {
    const uneUnite = dessinerMaterielNumerationDecimale({
      unites: 1,
      dixiemes: 4,
      centiemes: 7,
      largeur: 720,
    });
    const troisUnites = dessinerMaterielNumerationDecimale({
      unites: 3,
      dixiemes: 6,
      largeur: 720,
    });

    assert.equal(uneUnite.tailleCellule, 28);
    assert.ok(troisUnites.tailleCellule >= 22);
    verifierPiecesDansViewBox(uneUnite);
    verifierPiecesDansViewBox(troisUnites);
  });

  it("reste déterministe, autonome et contenu à 240 px", () => {
    for (const orientation of ORIENTATIONS_MATERIEL_NUMERATION_DECIMALE) {
      const options = {
        unites: 3,
        dixiemes: 6,
        centiemes: 7,
        orientation,
        largeur: 240,
      };
      const premier = dessinerMaterielNumerationDecimale(options);
      const second = dessinerMaterielNumerationDecimale(options);
      assert.equal(premier.svg, second.svg);
      assert.match(premier.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      assert.match(premier.svg, /viewBox="0 0 240 [\d.]+"/);
      assert.match(premier.svg, /role="img" aria-label="[^"]+"/);
      assert.match(premier.svg, /style="max-width:100%;height:auto"/);
      assert.doesNotMatch(premier.svg, /NaN|Infinity|<script|<foreignObject/);
      verifierPiecesDansViewBox(premier);
    }
  });

  it("représente aussi zéro sans fabriquer de pièce", () => {
    const rendu = dessinerMaterielNumerationDecimale();
    assert.equal(compter(rendu.svg, /class="nd-piece /g), 0);
    assert.match(rendu.svg, /Aucune pièce/);
    assert.equal(rendu.texteAlternatif, "Matériel de numération décimale : aucune pièce.");
  });

  it("refuse les nombres de pièces, orientations et largeurs invalides", () => {
    for (const options of [
      { unites: -1 },
      { unites: 1.5 },
      { unites: 100 },
      { dixiemes: 100 },
      { centiemes: 1000 },
      { orientation: "diagonale" },
      { largeur: 239 },
      { largeur: Infinity },
      { largeur: "320" },
    ]) {
      assert.throws(() => dessinerMaterielNumerationDecimale(options));
    }
  });
});

describe("échanges exacts entre rangs", () => {
  it("superpose une unité et dix dixièmes dans deux empreintes strictement identiques", () => {
    const rendu = dessinerEchangeRangsNumerationDecimale({
      echange: "unite-dixiemes",
      largeur: 320,
    });
    const empreintes = [...rendu.svg.matchAll(
      /class="nd-echange-empreinte [^"]+" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g,
    )];

    assert.deepEqual(ECHANGES_RANGS_NUMERATION_DECIMALE, [
      "unite-dixiemes",
      "dixieme-centiemes",
    ]);
    assert.equal(empreintes.length, 2);
    assert.deepEqual(empreintes[0].slice(2), empreintes[1].slice(2));
    assert.deepEqual(rendu.empreinte, {
      largeur: Number(empreintes[0][3]),
      hauteur: Number(empreintes[0][4]),
    });
    assert.equal(compter(rendu.svg, /class="nd-piece nd-unite"/g), 1);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-dixieme"/g), 10);
    assert.match(rendu.svg, /class="nd-echange-fleche"[^>]*>↔<\/text>/);
    assert.match(rendu.svg, /class="nd-echange-entier nd-echange-entier-unites"/);
    assert.match(rendu.svg, /class="nd-echange-fraction-dixiemes"/);
    assert.match(rendu.svg, /nd-echange-fraction-dixiemes-numerateur[^>]*>10<\/text>/);
    assert.match(rendu.svg, /nd-echange-fraction-dixiemes-denominateur[^>]*>10<\/text>/);
    assert.match(rendu.texteAlternatif, /même empreinte/);

    const centreGauche = Number(empreintes[0][1]) + Number(empreintes[0][3]) / 2;
    const centreDroite = Number(empreintes[1][1]) + Number(empreintes[1][3]) / 2;
    const xEntier = Number(rendu.svg.match(
      /class="nd-echange-entier nd-echange-entier-unites" x="([\d.]+)"/,
    )[1]);
    const xDixieme = Number(rendu.svg.match(
      /class="nd-echange-fraction-dixiemes-numerateur" x="([\d.]+)"/,
    )[1]);
    const xEgal = Number(rendu.svg.match(
      /class="nd-echange-egal" x="([\d.]+)"/,
    )[1]);
    assert.ok(Math.abs(xEntier - centreGauche) <= 0.02);
    assert.ok(Math.abs(xDixieme - centreDroite) <= 0.02);
    assert.ok(Math.abs(xEgal - 160) <= 0.02);
  });

  it("garde la même longueur pour un dixième et dix centièmes", () => {
    for (const largeur of [240, 320, 720]) {
      const rendu = dessinerEchangeRangsNumerationDecimale({
        echange: "dixieme-centiemes",
        largeur,
      });
      const [dixieme] = positionsPieces(rendu.svg, "nd-dixieme");
      const centiemes = positionsPieces(rendu.svg, "nd-centieme");
      const largeurDixieme = dixieme.largeurCellules * rendu.tailleCellule;
      const largeurCentiemes = centiemes.at(-1).x - centiemes[0].x + rendu.tailleCellule;

      assert.equal(centiemes.length, 10);
      assert.ok(Math.abs(largeurDixieme - largeurCentiemes) <= 0.02);
      assert.equal(rendu.empreinte.largeur, arrondi2(largeurDixieme));
      assert.equal(rendu.empreinte.hauteur, rendu.tailleCellule);
      assert.match(rendu.svg, /class="nd-echange-fraction-dixiemes"/);
      assert.match(rendu.svg, /class="nd-echange-fraction-centiemes"/);
      assert.doesNotMatch(rendu.svg, /NaN|Infinity/);
    }
  });

  it("refuse un échange et une largeur invalides", () => {
    assert.throws(
      () => dessinerEchangeRangsNumerationDecimale({ echange: "centieme-millieme" }),
      /échange invalide/,
    );
    assert.throws(
      () => dessinerEchangeRangsNumerationDecimale({ largeur: 200 }),
      /largeur comprise/,
    );
  });
});

describe("conversion paramétrique par rang", () => {
  it("décompose 1,47 en trois groupes et porte les légendes locales attendues", () => {
    const rendu = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "1,47",
      etat: "decompose",
      sens: "fraction-vers-decimal",
      largeur: 560,
    });

    assert.deepEqual(ETATS_CONVERSION_RANGS_NUMERATION_DECIMALE, [
      "decompose",
      "converti-rang-final",
    ]);
    assert.deepEqual(SENS_CONVERSION_RANGS_NUMERATION_DECIMALE, [
      "fraction-vers-decimal",
      "decimal-vers-fraction",
    ]);
    assert.deepEqual(rendu.fractionCible, { numerateur: 147, denominateur: 100 });
    assert.deepEqual(
      rendu.groupes.map(({ rang, quantite, legende }) => [rang, quantite, legende]),
      [
        ["unites", 1, "100/100=1"],
        ["dixiemes", 4, "40/100=4/10"],
        ["centiemes", 7, "7/100"],
      ],
    );
    assert.match(rendu.svg, /data-legende="100\/100=1"/);
    assert.match(rendu.svg, /data-legende="40\/100=4\/10"/);
    assert.match(rendu.svg, /data-legende="7\/100"/);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-unite"/g), 1);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-dixieme"/g), 4);
    assert.equal(compter(rendu.svg, /class="nd-piece nd-centieme"/g), 7);
    assert.equal(
      compter(
        rendu.svg,
        new RegExp(`class="nd-forme"[^>]*fill="${COULEURS_NUMERATION_DECIMALE.unite}"`, "g"),
      ),
      1,
    );
    assert.equal(
      compter(
        rendu.svg,
        new RegExp(`class="nd-forme"[^>]*fill="${COULEURS_NUMERATION_DECIMALE.dixieme}"`, "g"),
      ),
      4,
    );
    assert.equal(
      compter(
        rendu.svg,
        new RegExp(`class="nd-forme"[^>]*fill="${COULEURS_NUMERATION_DECIMALE.centieme}"`, "g"),
      ),
      7,
    );
    assert.match(rendu.texteAlternatif, /empreintes ne changent pas/);
  });

  it("convertit 3,54 en centièmes sans déplacer ni redimensionner un groupe", () => {
    const options = {
      ecritureDecimale: "3,54",
      sens: "decimal-vers-fraction",
      largeur: 320,
    };
    const decompose = dessinerConversionRangsNumerationDecimale({
      ...options,
      etat: "decompose",
    });
    const converti = dessinerConversionRangsNumerationDecimale({
      ...options,
      etat: "converti-rang-final",
    });
    const geometrie = (rendu) => rendu.groupes.map(
      ({ rang, quantite, x, y, largeur, hauteur }) =>
        [rang, quantite, x, y, largeur, hauteur],
    );

    assert.deepEqual(geometrie(converti), geometrie(decompose));
    assert.deepEqual(
      converti.groupes.map(({ legende }) => legende),
      ["3=300/100", "5/10=50/100", "4/100"],
    );
    assert.equal(compter(converti.svg, /class="nd-piece nd-unite"/g), 3);
    assert.equal(compter(converti.svg, /class="nd-piece nd-dixieme"/g), 5);
    assert.equal(compter(converti.svg, /class="nd-piece nd-centieme"/g), 4);
    assert.equal(
      compter(
        converti.svg,
        new RegExp(`class="nd-forme"[^>]*fill="${COULEURS_NUMERATION_DECIMALE.centieme}"`, "g"),
      ),
      12,
    );
    assert.doesNotMatch(
      converti.svg,
      new RegExp(`class="nd-forme"[^>]*fill="(?:${COULEURS_NUMERATION_DECIMALE.unite}|${COULEURS_NUMERATION_DECIMALE.dixieme})"`),
    );
    assert.match(converti.svg, /data-etat="converti-rang-final"/);
    assert.match(converti.texteAlternatif, /Tous les groupes sont convertis en centièmes jaunes/);
  });

  it("convertit aussi 3,6 en dixièmes avec les mêmes empreintes", () => {
    const options = {
      ecritureDecimale: "3,6",
      sens: "decimal-vers-fraction",
      largeur: 320,
    };
    const decompose = dessinerConversionRangsNumerationDecimale({
      ...options,
      etat: "decompose",
    });
    const converti = dessinerConversionRangsNumerationDecimale({
      ...options,
      etat: "converti-rang-final",
    });
    const geometrie = (rendu) => rendu.groupes.map(
      ({ rang, quantite, x, y, largeur, hauteur }) =>
        [rang, quantite, x, y, largeur, hauteur],
    );

    assert.equal(converti.rangFinal, "dixiemes");
    assert.deepEqual(converti.fractionCible, { numerateur: 36, denominateur: 10 });
    assert.deepEqual(geometrie(converti), geometrie(decompose));
    assert.deepEqual(
      converti.groupes.map(({ legende }) => legende),
      ["3=30/10", "6/10"],
    );
    assert.equal(
      compter(
        converti.svg,
        new RegExp(`class="nd-forme"[^>]*fill="${COULEURS_NUMERATION_DECIMALE.dixieme}"`, "g"),
      ),
      9,
    );
    assert.match(converti.texteAlternatif, /convertis en dixièmes verts/);
  });

  it("conserve le rang centièmes imposé pour 0,50", () => {
    const rendu = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "0,5",
      rangFinal: "centiemes",
      etat: "converti-rang-final",
      sens: "decimal-vers-fraction",
    });

    assert.equal(rendu.ecritureDecimale, "0,50");
    assert.equal(rendu.rangFinal, "centiemes");
    assert.deepEqual(rendu.fractionCible, { numerateur: 50, denominateur: 100 });
    assert.deepEqual(
      rendu.groupes.map(({ rang, quantite, legende }) => [rang, quantite, legende]),
      [["dixiemes", 5, "5/10=50/100"]],
    );
  });

  it("masque la cible propre à chaque sens dans les profils d’aide", () => {
    const aideNc03 = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "1,47",
      etat: "converti-rang-final",
      sens: "fraction-vers-decimal",
      profil: "aide-nc03",
    });
    const aideNc04 = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "1,47",
      sens: "decimal-vers-fraction",
      profil: "aide-nc04",
    });

    assert.doesNotMatch(aideNc03.svg, /1,47|data-ecriture-decimale/);
    assert.doesNotMatch(aideNc03.texteAlternatif, /1,47/);
    assert.match(aideNc03.svg, /147 centièmes regroupés/);
    assert.doesNotMatch(aideNc04.svg, /data-numerateur-cible|data-denominateur-cible/);
    assert.match(aideNc04.svg, /data-ecriture-decimale="1,47"/);
    assert.match(aideNc04.svg, /data-profil="aide-nc04"/);

    const zeroFinalImpose = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "0,5",
      rangFinal: "centiemes",
      sens: "decimal-vers-fraction",
      profil: "aide-nc04",
    });
    assert.equal(zeroFinalImpose.ecritureDecimale, "0,50");
    assert.match(zeroFinalImpose.svg, /data-legende="5\/10=\?\/100"/);
    assert.doesNotMatch(zeroFinalImpose.svg, /50\/100|data-numerateur-cible|data-denominateur-cible/);
    assert.doesNotMatch(zeroFinalImpose.texteAlternatif, /50\/100/);

    const aideNc04CentiemeImpose = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "0,5",
      rangFinal: "centiemes",
      sens: "decimal-vers-fraction",
      profil: "aide-nc04",
    });
    assert.deepEqual(
      aideNc04CentiemeImpose.groupes.map(({ legende }) => legende),
      ["5/10=?/100"],
    );
    assert.match(aideNc04CentiemeImpose.svg, /data-legende="5\/10=\?\/100"/);
    assert.match(aideNc04CentiemeImpose.texteAlternatif, /5\/10=\?\/100/);
    assert.doesNotMatch(aideNc04CentiemeImpose.svg, /50\/100/);
    assert.doesNotMatch(aideNc04CentiemeImpose.texteAlternatif, /50\/100/);

    const fractionLibreDixieme = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "0,3",
      sens: "decimal-vers-fraction",
      profil: "aide-nc04",
    });
    assert.deepEqual(
      fractionLibreDixieme.groupes.map(({ legende }) => legende),
      ["?/10"],
    );
    assert.match(fractionLibreDixieme.svg, /data-legende="\?\/10"/);
    assert.doesNotMatch(fractionLibreDixieme.svg, /3\/10/);
    assert.doesNotMatch(fractionLibreDixieme.texteAlternatif, /3\/10/);

    const singulier = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "0,1",
      etat: "converti-rang-final",
      sens: "fraction-vers-decimal",
      profil: "aide-nc03",
    });
    assert.match(singulier.svg, />1 dixième regroupé<\/text>/);
  });

  it("inverse seulement l'ordre des légendes, pas les quantités ni leur géométrie", () => {
    const direct = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "1,47",
      sens: "fraction-vers-decimal",
    });
    const inverse = dessinerConversionRangsNumerationDecimale({
      ecritureDecimale: "1,47",
      sens: "decimal-vers-fraction",
    });

    assert.deepEqual(
      direct.groupes.map(({ rang, quantite, largeur, hauteur }) =>
        [rang, quantite, largeur, hauteur]),
      inverse.groupes.map(({ rang, quantite, largeur, hauteur }) =>
        [rang, quantite, largeur, hauteur]),
    );
    assert.deepEqual(
      inverse.groupes.map(({ legende }) => legende),
      ["1=100/100", "4/10=40/100", "7/100"],
    );
  });

  it("reste contenu et déterministe sur mobile comme sur TNI", () => {
    for (const largeur of [240, 320, 720, 1600]) {
      const options = { ecritureDecimale: "3,54", largeur };
      const rendu = dessinerConversionRangsNumerationDecimale(options);
      assert.equal(rendu.svg, dessinerConversionRangsNumerationDecimale(options).svg);
      assert.match(rendu.svg, new RegExp(`viewBox="0 0 ${largeur} [\\d.]+"`));
      assert.doesNotMatch(rendu.svg, /NaN|Infinity|<script|<foreignObject/);
      for (const groupe of rendu.groupes) {
        assert.ok(groupe.x >= 0 && groupe.y >= 0);
        assert.ok(groupe.x + groupe.largeur <= largeur + 0.01);
        assert.ok(groupe.y + groupe.hauteur <= rendu.hauteur + 0.01);
      }
    }
  });

  it("refuse les rangs, sens, états et quantités hors de son contrat", () => {
    for (const options of [
      {},
      { ecritureDecimale: "1" },
      { ecritureDecimale: "0,725" },
      { ecritureDecimale: "10,47" },
      { ecritureDecimale: "1,47", etat: "final" },
      { ecritureDecimale: "1,47", sens: "gauche-droite" },
      { ecritureDecimale: "1,47", profil: "indice" },
      { ecritureDecimale: "1,47", sens: "fraction-vers-decimal", profil: "aide-nc04" },
      { ecritureDecimale: "1,47", sens: "decimal-vers-fraction", profil: "aide-nc03" },
      { ecritureDecimale: "1,47", largeur: 200 },
    ]) {
      assert.throws(() => dessinerConversionRangsNumerationDecimale(options));
    }
  });
});

describe("tableau de numération décimale", () => {
  it("place exactement 725/1000 dans les quatre colonnes", () => {
    const rendu = dessinerTableauNumerationDecimale({
      ecritureDecimale: "0,725",
      largeur: 320,
      rangMisEnEvidence: "milliemes",
    });

    assert.equal(rendu.ecritureDecimale, "0,725");
    assert.deepEqual(
      rendu.colonnes.map(({ id, chiffre }) => [id, chiffre]),
      [
        ["unites", "0"],
        ["dixiemes", "7"],
        ["centiemes", "2"],
        ["milliemes", "5"],
      ],
    );
    assert.deepEqual(rendu.fractionLue, { numerateur: 725, denominateur: 1000 });
    assert.equal(rendu.dernierRang, "milliemes");
    assert.equal(rendu.rangMisEnEvidence, "milliemes");
    assert.equal(rendu.afficherLecture, true);
    assert.equal(compter(rendu.svg, /class="nd-tableau-colonne/g), 4);
    assert.equal(compter(rendu.svg, /class="nd-virgule"/g), 1);
    assert.match(
      rendu.svg,
      /class="nd-virgule" data-separation="unites-dixiemes"[^>]*font-size="[\d.]+"[^>]*>,<\/text>/,
    );
    assert.equal(compter(rendu.svg, /nd-rang-actif/g), 1);
    assert.match(rendu.svg, /data-rang="milliemes" data-chiffre="5"/);
    assert.match(rendu.svg, /data-numerateur="725" data-denominateur="1000"/);
    assert.match(rendu.svg, />0,725 : 725 millièmes<\/text>/);
    assert.match(rendu.texteAlternatif, /Cette écriture se lit 725 millièmes/);
    assert.match(rendu.texteAlternatif, /colonne des millièmes est mise en évidence/);
    for (const [rang, palette] of Object.entries(COULEURS_RANGS_NUMERATION_DECIMALE)) {
      const bloc = new RegExp(
        `data-rang="${rang}"[\\s\\S]*?class="nd-entete"[^>]*fill="${palette.principale}"` +
          `[\\s\\S]*?class="nd-cellule"[^>]*fill="${palette.fond}"` +
          `[\\s\\S]*?class="nd-nom-rang"[^>]*fill="${palette.encreEntete}"` +
          `[\\s\\S]*?class="nd-chiffre"[^>]*fill="${palette.texte}"`,
      );
      assert.match(rendu.svg, bloc, `couleurs absentes pour ${rang}`);
    }
    assert.doesNotMatch(rendu.svg, /class="nd-marque-rang-actif"/);
    assert.match(rendu.svg, /data-rang-actif="true"/);
  });

  it("peut laisser la lecture finale à l'élève sans la révéler à l'écran ni dans l'alternative", () => {
    const avecLecture = dessinerTableauNumerationDecimale({
      ecritureDecimale: "1,47",
    });
    const sansLecture = dessinerTableauNumerationDecimale({
      ecritureDecimale: "1,47",
      afficherLecture: false,
      annoncerEcriture: false,
    });

    assert.equal(avecLecture.afficherLecture, true);
    assert.equal(avecLecture.hauteur, 132);
    assert.match(avecLecture.svg, /class="nd-lecture"/);
    assert.match(avecLecture.svg, />1,47 : 147 centièmes<\/text>/);
    assert.match(avecLecture.texteAlternatif, /se lit 147 centièmes/);

    assert.equal(sansLecture.afficherLecture, false);
    assert.equal(sansLecture.hauteur, 108);
    assert.match(sansLecture.svg, /viewBox="0 0 320 108"/);
    assert.match(sansLecture.svg, /data-afficher-lecture="false"/);
    assert.doesNotMatch(sansLecture.svg, /class="nd-lecture"|147 centièmes/);
    assert.doesNotMatch(sansLecture.svg, /data-ecriture-decimale|data-numerateur|data-denominateur/);
    assert.doesNotMatch(sansLecture.texteAlternatif, /1,47|147 centièmes|Cette écriture se lit/);
    assert.match(sansLecture.texteAlternatif, /Tableau de numération à lire/);
    assert.match(sansLecture.texteAlternatif, /unités : 1, dixièmes : 4, centièmes : 7/);
    assert.equal(sansLecture.annoncerEcriture, false);
    assert.equal(compter(sansLecture.svg, /class="nd-tableau-colonne/g), 4);
  });

  it("masque réellement les chiffres avant le choix du rang", () => {
    const masque = dessinerTableauNumerationDecimale({
      ecritureDecimale: "1,47",
      rangFinal: "centiemes",
      afficherChiffres: false,
      afficherLecture: false,
      annoncerEcriture: false,
      rangMisEnEvidence: "dixiemes",
    });

    assert.equal(masque.afficherChiffres, false);
    assert.equal(masque.afficherLecture, false);
    assert.equal(compter(masque.svg, /class="nd-chiffre"/g), 4);
    assert.equal(compter(masque.svg, />\?<\/text>/g), 4);
    assert.equal(compter(masque.svg, /data-chiffre=""/g), 4);
    assert.equal(compter(masque.svg, /class="nd-virgule"/g), 1);
    assert.doesNotMatch(masque.svg, /1,47|data-numerateur|data-denominateur/);
    assert.doesNotMatch(masque.texteAlternatif, /unités : 1|dixièmes : 4|centièmes : 7/);
    assert.match(masque.texteAlternatif, /Tableau de numération à compléter/);
    assert.equal(
      compter(masque.texteAlternatif, /case à compléter/g),
      4,
    );
  });

  it("préserve un zéro intercalé et laisse vides les rangs suivants", () => {
    const rendu = dessinerTableauNumerationDecimale({ ecritureDecimale: "1,05" });
    assert.deepEqual(
      rendu.colonnes.map(({ chiffre }) => chiffre),
      ["1", "0", "5", null],
    );
    assert.match(rendu.svg, /data-rang="dixiemes" data-chiffre="0"/);
    assert.match(rendu.svg, /data-rang="milliemes" data-chiffre=""/);
    assert.match(rendu.texteAlternatif, /millièmes : case vide/);
  });

  it("accorde au singulier la lecture d’une seule part décimale", () => {
    const rendu = dessinerTableauNumerationDecimale({
      ecritureDecimale: "0,1",
      afficherLecture: true,
    });

    assert.match(rendu.svg, />0,1 : 1 dixième<\/text>/);
    assert.match(rendu.texteAlternatif, /se lit 1 dixième/);
    assert.doesNotMatch(rendu.svg, /1 dixièmes/);
  });

  it("préserve le zéro final imposé par le dénominateur de la tâche", () => {
    const centiemes = dessinerTableauNumerationDecimale({
      ecritureDecimale: "0,5",
      rangFinal: "centiemes",
    });
    const milliemes = dessinerTableauNumerationDecimale({
      ecritureDecimale: "0,5",
      rangFinal: "milliemes",
    });

    assert.equal(centiemes.ecritureDecimale, "0,50");
    assert.equal(centiemes.dernierRang, "centiemes");
    assert.equal(centiemes.rangFinal, "centiemes");
    assert.deepEqual(
      centiemes.colonnes.map(({ chiffre }) => chiffre),
      ["0", "5", "0", null],
    );
    assert.deepEqual(centiemes.fractionLue, {
      numerateur: 50,
      denominateur: 100,
    });
    assert.match(centiemes.svg, />0,50 : 50 centièmes<\/text>/);

    assert.equal(milliemes.ecritureDecimale, "0,500");
    assert.equal(milliemes.dernierRang, "milliemes");
    assert.equal(milliemes.rangFinal, "milliemes");
    assert.deepEqual(
      milliemes.colonnes.map(({ chiffre }) => chiffre),
      ["0", "5", "0", "0"],
    );
    assert.deepEqual(milliemes.fractionLue, {
      numerateur: 500,
      denominateur: 1000,
    });
    assert.match(milliemes.svg, />0,500 : 500 millièmes<\/text>/);
  });

  it("conserve 50/100 et 500/1000 tout en masquant leurs chiffres dans l’aide", () => {
    for (const [rangFinal, ecriture, numerateur, denominateur] of [
      ["centiemes", "0,50", 50, 100],
      ["milliemes", "0,500", 500, 1000],
    ]) {
      const rendu = dessinerTableauNumerationDecimale({
        ecritureDecimale: "0,5",
        rangFinal,
        afficherChiffres: false,
        afficherLecture: false,
        annoncerEcriture: false,
      });

      assert.equal(rendu.ecritureDecimale, ecriture);
      assert.deepEqual(rendu.fractionLue, { numerateur, denominateur });
      assert.equal(compter(rendu.svg, /class="nd-virgule"/g), 1);
      assert.equal(compter(rendu.svg, /class="nd-chiffre"/g), 4);
      assert.equal(compter(rendu.svg, />\?<\/text>/g), 4);
      assert.doesNotMatch(rendu.svg, /data-ecriture-decimale|data-numerateur|data-denominateur|class="nd-lecture"/);
      assert.doesNotMatch(rendu.texteAlternatif, new RegExp(`${numerateur} \\/ ${denominateur}|${ecriture}`));
    }
  });

  it("reste lisible à la largeur mobile minimale et strictement déterministe", () => {
    const options = { ecritureDecimale: "0,725", largeur: 240 };
    const rendu = dessinerTableauNumerationDecimale(options);
    assert.equal(rendu.svg, dessinerTableauNumerationDecimale(options).svg);
    assert.match(rendu.svg, /viewBox="0 0 240 132"/);
    assert.match(rendu.svg, /style="max-width:100%;height:auto"/);
    assert.equal(compter(rendu.svg, /class="nd-nom-rang"/g), 4);
    assert.equal(compter(rendu.svg, /class="nd-nom-rang"[^>]*font-size="11"/g), 4);
    assert.equal(compter(rendu.svg, /class="nd-chiffre"/g), 4);
    assert.doesNotMatch(rendu.svg, /NaN|Infinity|<script|<foreignObject/);

    const cellules = [...rendu.svg.matchAll(
      /<rect class="nd-cellule" x="([\d.]+)"[^>]*width="([\d.]+)"/g,
    )];
    assert.equal(cellules.length, 4);
    for (const cellule of cellules) {
      assert.ok(Number(cellule[1]) + Number(cellule[2]) <= 240.01);
    }
  });

  it("refuse une écriture, un rang ou une largeur invalide", () => {
    for (const options of [
      {},
      { ecritureDecimale: "0,1234" },
      { ecritureDecimale: "-0,5" },
      { ecritureDecimale: "0,5", rangMisEnEvidence: "dizaines" },
      { ecritureDecimale: "0,5", rangFinal: "dizaines" },
      { ecritureDecimale: "0,725", rangFinal: "centiemes" },
      { ecritureDecimale: "0,5", largeur: 200 },
      { ecritureDecimale: "0,5", largeur: NaN },
      { ecritureDecimale: "0,5", afficherLecture: "false" },
    ]) {
      assert.throws(() => dessinerTableauNumerationDecimale(options));
    }
  });

  it("est exporté par le paquet et déclare son origine", () => {
    const paquet = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );
    assert.equal(
      paquet.exports["./numeration-decimale"],
      "./src/numeration-decimale.js",
    );
    assert.equal(
      PROVENANCE_OBJETS["numeration-decimale.js"].statut,
      "original_mathsgo",
    );
  });
});
