import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

import {
  COULEURS_NUMERATION_DECIMALE,
  COULEURS_RANGS_NUMERATION_DECIMALE,
} from "../../charte/src/charte.js";
import {
  ORIENTATIONS_MATERIEL_NUMERATION_DECIMALE,
  VERSION_NUMERATION_DECIMALE,
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
    assert.equal(VERSION_NUMERATION_DECIMALE, 2);
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

  it("reste lisible à la largeur mobile minimale et strictement déterministe", () => {
    const options = { ecritureDecimale: "0,725", largeur: 240 };
    const rendu = dessinerTableauNumerationDecimale(options);
    assert.equal(rendu.svg, dessinerTableauNumerationDecimale(options).svg);
    assert.match(rendu.svg, /viewBox="0 0 240 132"/);
    assert.match(rendu.svg, /style="max-width:100%;height:auto"/);
    assert.equal(compter(rendu.svg, /class="nd-nom-rang"/g), 4);
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
