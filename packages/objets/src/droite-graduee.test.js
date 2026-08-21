// Tests de l'objet officiel « droite graduée ».
//
// Ils vérifient DEUX choses distinctes :
//   1. que les réglages pédagogiques repris de la PR #8 fonctionnent
//      (bornes libres, pas décimal, points multiples, étiquettes
//      remplacées, masquage, graduations imposées, double droite,
//      pourcentages calculés à partir du seul total) ;
//   2. que les six défauts relevés en exécutant le code d'origine sont
//      bel et bien corrigés (virgule française, vrai signe moins, trait
//      pointillé qui ne traverse plus les nombres, correspondance
//      marquée en bas, coordonnées arrondies, hauteur ajustée).

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COULEURS } from "../../charte/src/charte.js";
import { PROVENANCE_OBJETS } from "./provenance.js";
import {
  COULEURS_DROITE,
  ECHELLES_POURCENTAGE,
  MAX_GRADUATIONS,
  PREREGLAGES_DROITE_GRADUEE,
  SEUIL_NOMBRES,
  SIGNE_MOINS,
  VERSION_DROITE_GRADUEE,
  construireEchelleReguliere,
  construireGraduations,
  dessinerDoubleDroiteGraduee,
  dessinerDoubleDroitePourcentage,
  dessinerDroiteGraduee,
  dessinerPrereglageDroiteGraduee,
  formaterNombre,
  positionRelativeSurDroite,
} from "./droite-graduee.js";

/* ---- petites loupes sur le SVG produit ---- */

/** Les textes écrits dans le dessin, avec leur ordonnée. */
function textesDe(svg) {
  return [...svg.matchAll(/<text[^>]*\by="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({
    y: Number(m[1]),
    contenu: m[2],
  }));
}

function contenusDe(svg) {
  return textesDe(svg).map((t) => t.contenu);
}

/** Les axes (les seuls traits d'épaisseur 1.8), du haut vers le bas. */
function axesDe(svg) {
  return [...svg.matchAll(/<line [^>]*y1="([\d.]+)"[^>]*stroke-width="1\.8"/g)]
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

/** Les traits pointillés d'une couleur donnée : [{ y1, y2 }]. */
function pointillesDe(svg, couleur) {
  const motif = new RegExp(
    `<line x1="([\\d.]+)" y1="([\\d.]+)" x2="[\\d.]+" y2="([\\d.]+)" stroke="${couleur}"[^>]*stroke-dasharray`,
    "g",
  );
  return [...svg.matchAll(motif)].map((m) => ({ x: Number(m[1]), y1: Number(m[2]), y2: Number(m[3]) }));
}

function disquesDe(svg, couleur) {
  return [...svg.matchAll(new RegExp(`<circle [^>]*fill="${couleur}"`, "g"))].length;
}

function viewBoxDe(svg) {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  assert.ok(m, "viewBox absente ou invalide");
  return { largeur: Number(m[1]), hauteur: Number(m[2]) };
}

/* ------------------------------------------------------------------ */
/* 1. Les réglages repris de la PR #8                                   */
/* ------------------------------------------------------------------ */

describe("bornes et graduations", () => {
  it("les bornes sont libres, y compris négatives (nombres relatifs)", () => {
    const { svg } = dessinerDroiteGraduee({ min: -5, max: 5, pas: 1 });
    const contenus = contenusDe(svg);
    assert.deepEqual(contenus, [
      "−5", "−4", "−3", "−2", "−1", "0", "1", "2", "3", "4", "5",
    ]);
  });

  it("le pas peut être décimal", () => {
    const { svg } = dessinerDroiteGraduee({ min: 0, max: 2, pas: 0.25 });
    const contenus = contenusDe(svg);
    assert.equal(contenus.length, 9);
    assert.deepEqual(contenus.slice(0, 3), ["0", "0,25", "0,5"]);
    assert.equal(contenus.at(-1), "2");
  });

  it("une liste de graduations peut être imposée à la main", () => {
    const { svg } = dessinerDroiteGraduee({
      min: 0,
      max: 12,
      graduations: [0, 3, 12, 7], // volontairement dans le désordre
    });
    assert.deepEqual(contenusDe(svg), ["0", "3", "7", "12"]);
  });

  it("construireGraduations ferme toujours l'intervalle sur max", () => {
    assert.deepEqual(construireGraduations(0, 1, 0.4), [0, 0.4, 0.8, 1]);
    assert.deepEqual(construireGraduations(0, 1, 0.1).length, 11);
  });

  it("l'échelle régulière ne fabrique jamais un dernier intervalle plus court", () => {
    assert.deepEqual(
      construireEchelleReguliere({ depart: -0.5, pas: 0.25, nombreIntervalles: 6 }),
      {
        min: -0.5,
        max: 1,
        pas: 0.25,
        nombreIntervalles: 6,
        graduations: [-0.5, -0.25, 0, 0.25, 0.5, 0.75, 1],
      },
    );
    assert.deepEqual(
      construireEchelleReguliere({ depart: -100, pas: 50, nombreIntervalles: 5 }).graduations,
      [-100, -50, 0, 50, 100, 150],
    );
  });

  it("la position relative partage la même échelle avec la future interaction", () => {
    assert.equal(positionRelativeSurDroite(-20, -20, 20), 0);
    assert.equal(positionRelativeSurDroite(0, -20, 20), 0.5);
    assert.equal(positionRelativeSurDroite(20, -20, 20), 1);
    assert.throws(() => positionRelativeSurDroite(30, -20, 20), /30 sort de \[−20 ; 20\]/);
  });
});

describe("points repérés", () => {
  it("plusieurs points à la fois, chacun avec sa couleur et son étiquette", () => {
    const { svg } = dessinerDroiteGraduee({
      min: -5,
      max: 5,
      pas: 1,
      points: [
        { valeur: -2, etiquette: "−2" },
        { valeur: 3, etiquette: "+3", couleur: COULEURS.reussite, position: "dessous" },
      ],
    });
    // deux disques cerclés de blanc, un par couleur
    assert.equal(disquesDe(svg, COULEURS_DROITE.point), 1);
    assert.equal(disquesDe(svg, COULEURS.reussite), 1);
    assert.ok(svg.includes('stroke="#ffffff"'), "le disque n'est pas cerclé de blanc");
    const contenus = contenusDe(svg);
    assert.ok(contenus.includes("−2"));
    assert.ok(contenus.includes("+3"));
  });

  it("un point posé « dessous » écrit son étiquette sous la droite", () => {
    const { svg } = dessinerDroiteGraduee({
      min: 0,
      max: 10,
      pas: 1,
      points: [
        { valeur: 2, etiquette: "haut" },
        { valeur: 8, etiquette: "bas", position: "dessous" },
      ],
    });
    const [axe] = axesDe(svg);
    const textes = textesDe(svg);
    assert.ok(textes.find((t) => t.contenu === "haut").y < axe, "l'étiquette « haut » n'est pas au-dessus");
    assert.ok(textes.find((t) => t.contenu === "bas").y > axe, "l'étiquette « bas » n'est pas en dessous");
  });

  it("le marquage d'un point est bien trait pointillé + disque", () => {
    const { svg } = dessinerDroiteGraduee({
      min: 0,
      max: 10,
      pas: 1,
      points: [{ valeur: 7.5, etiquette: "7,5" }],
    });
    assert.ok(pointillesDe(svg, COULEURS_DROITE.point).length >= 1, "trait pointillé absent");
    assert.equal(disquesDe(svg, COULEURS_DROITE.point), 1);
  });
});

describe("étiquettes de graduation et masquage", () => {
  it("une étiquette remplace le nombre d'une seule graduation", () => {
    const { svg } = dessinerDroiteGraduee({
      min: 0,
      max: 2,
      pas: 0.5,
      etiquettes: { "0,5": "un demi", "1,5": "trois demis" },
    });
    assert.deepEqual(contenusDe(svg), ["0", "un demi", "1", "trois demis", "2"]);
  });

  it("la clé d'une étiquette s'écrit à la française comme à l'anglaise", () => {
    const francaise = dessinerDroiteGraduee({ min: 0, max: 2, pas: 0.5, etiquettes: { "0,5": "½" } });
    const anglaise = dessinerDroiteGraduee({ min: 0, max: 2, pas: 0.5, etiquettes: { 0.5: "½" } });
    assert.equal(francaise.svg, anglaise.svg);
    const negative = dessinerDroiteGraduee({ min: -2, max: 2, pas: 1, etiquettes: { "−1": "moins un" } });
    assert.ok(contenusDe(negative.svg).includes("moins un"));
  });

  it("le masquage total efface tous les nombres (« où est ce nombre ? »)", () => {
    const { svg } = dessinerDroiteGraduee({ min: 0, max: 1, pas: 0.1, afficherNombres: false });
    assert.deepEqual(contenusDe(svg), []);
    // les traits de graduation, eux, restent bien là
    assert.equal([...svg.matchAll(/stroke-width="1\.35"/g)].length, 11);
  });

  it("le garde-fou anti-surcharge coupe les nombres au-delà du seuil", () => {
    const raisonnable = dessinerDroiteGraduee({ min: 0, max: SEUIL_NOMBRES - 1, pas: 1 });
    assert.equal(contenusDe(raisonnable.svg).length, SEUIL_NOMBRES);
    const surchargee = dessinerDroiteGraduee({ min: 0, max: 40, pas: 1 });
    assert.deepEqual(contenusDe(surchargee.svg), [], "les 41 nombres auraient dû être masqués");
    // seuil relevé à la main : les nombres reviennent
    const forcee = dessinerDroiteGraduee({ min: 0, max: 40, pas: 1, seuilNombres: 60 });
    assert.equal(contenusDe(forcee.svg).length, 41);
  });
});

/* ------------------------------------------------------------------ */
/* 2. Les corrections apportées au code d'origine                       */
/* ------------------------------------------------------------------ */

describe("corrections (a) et (b) : écriture française des nombres", () => {
  it("les décimaux s'écrivent avec une virgule, jamais un point", () => {
    const { svg } = dessinerDroiteGraduee({ min: 0, max: 2, pas: 0.25 });
    const contenus = contenusDe(svg);
    assert.ok(contenus.includes("0,25"), "0,25 attendu");
    assert.ok(contenus.includes("1,75"), "1,75 attendu");
    for (const contenu of contenus) {
      assert.ok(!/\d\.\d/.test(contenu), `point décimal anglais dans « ${contenu} »`);
    }
  });

  it("le signe moins est le vrai « − », jamais le trait d'union", () => {
    const { svg } = dessinerDroiteGraduee({ min: -3, max: 3, pas: 0.5 });
    const contenus = contenusDe(svg);
    assert.ok(contenus.includes(`${SIGNE_MOINS}2,5`), "−2,5 attendu");
    for (const contenu of contenus) {
      assert.ok(!contenu.includes("-"), `trait d'union dans « ${contenu} »`);
    }
    assert.equal(formaterNombre(-0.5), "−0,5");
    assert.equal(formaterNombre(0), "0");
  });
});

describe("correction (c) : le trait pointillé ne traverse pas les nombres", () => {
  it("il s'interrompt quand le point tombe sur une graduation numérotée", () => {
    const { svg } = dessinerDroiteGraduee({
      min: 0,
      max: 10,
      pas: 1,
      points: [{ valeur: 7, etiquette: "7" }],
    });
    const [axe] = axesDe(svg);
    const yNombre = textesDe(svg).find((t) => t.contenu === "7" && t.y < axe).y;
    const morceaux = pointillesDe(svg, COULEURS_DROITE.point);
    assert.equal(morceaux.length, 2, "le trait aurait dû être coupé en deux");
    for (const m of morceaux) {
      const haut = Math.min(m.y1, m.y2);
      const bas = Math.max(m.y1, m.y2);
      assert.ok(
        yNombre < haut || yNombre > bas,
        `le trait pointillé traverse encore le nombre (${haut} → ${bas}, nombre en ${yNombre})`,
      );
    }
  });

  it("il reste entier quand le point tombe entre deux graduations", () => {
    const { svg } = dessinerDroiteGraduee({
      min: 0,
      max: 10,
      pas: 1,
      points: [{ valeur: 7.5, etiquette: "7,5" }],
    });
    assert.equal(pointillesDe(svg, COULEURS_DROITE.point).length, 1);
  });
});

describe("correction (e) : coordonnées arrondies à 2 décimales", () => {
  it("aucun 488.99999999999994 dans le SVG", () => {
    const dessins = [
      dessinerDroiteGraduee({ min: 0, max: 7, pas: 1, points: [{ valeur: 5, etiquette: "5" }] }).svg,
      dessinerDroiteGraduee({ min: -1.3, max: 4.1, pas: 0.3 }).svg,
      dessinerDoubleDroitePourcentage({ total: 240, pourcentage: 75 }).svg,
    ];
    for (const svg of dessins) {
      const trop = svg.match(/="[\d.]*\.\d{3,}"/g);
      assert.equal(trop, null, `coordonnées non arrondies : ${trop}`);
      assert.ok(!/NaN|Infinity/.test(svg), "NaN ou Infinity dans le SVG");
    }
  });
});

describe("correction (f) : largeur réglable, hauteur ajustée au contenu", () => {
  it("la largeur se règle et reste dans les bornes raisonnables", () => {
    assert.equal(dessinerDroiteGraduee({ largeur: 480 }).largeur, 480);
    assert.equal(viewBoxDe(dessinerDroiteGraduee({ largeur: 480 }).svg).largeur, 480);
    assert.equal(dessinerDroiteGraduee({ largeur: 10 }).largeur, 240, "largeur minimale non appliquée");
    assert.equal(dessinerDroiteGraduee({ largeur: 9000 }).largeur, 1600, "largeur maximale non appliquée");
  });

  it("pas de blanc inutile : la hauteur suit ce qui est réellement dessiné", () => {
    const nue = dessinerDroiteGraduee({ min: 0, max: 10, pas: 1 });
    const avecPointDessus = dessinerDroiteGraduee({
      min: 0, max: 10, pas: 1, points: [{ valeur: 4, etiquette: "4" }],
    });
    const avecPointDessous = dessinerDroiteGraduee({
      min: 0, max: 10, pas: 1, points: [{ valeur: 4, etiquette: "4", position: "dessous" }],
    });
    const avecTitre = dessinerDroiteGraduee({ min: 0, max: 10, pas: 1, titre: "Place le nombre 7" });
    assert.ok(nue.hauteur < avecPointDessus.hauteur, "l'étiquette du haut ne coûte rien ?");
    assert.ok(nue.hauteur < avecPointDessous.hauteur, "l'étiquette du bas ne coûte rien ?");
    assert.equal(avecTitre.hauteur - nue.hauteur, 22, "le titre devrait coûter exactement sa bande");
    assert.equal(viewBoxDe(nue.svg).hauteur, nue.hauteur);
    // la droite nue tient en peu de place : c'était 160 dans l'original
    assert.ok(nue.hauteur < 100, `hauteur trop généreuse : ${nue.hauteur}`);
  });
});

/* ------------------------------------------------------------------ */
/* 3. Double droite et pourcentages                                     */
/* ------------------------------------------------------------------ */

describe("double droite graduée", () => {
  it("deux échelles alignées, nombres à l'extérieur, un nom à gauche de chacune", () => {
    const { svg } = dessinerDoubleDroiteGraduee({
      haut: { min: 0, max: 5, pas: 1, nom: "Litres", points: [{ valeur: 3, etiquette: "3 L" }] },
      bas: { min: 0, max: 8.5, pas: 1.7, nom: "Prix (€)" },
    });
    const [yHaut, yBas] = axesDe(svg);
    assert.ok(yHaut < yBas, "les deux axes ne sont pas empilés");
    const textes = textesDe(svg);
    // les nombres de la ligne du haut sont au-dessus d'elle
    for (const valeur of ["1", "2", "3", "4", "5"]) {
      const t = textes.find((x) => x.contenu === valeur && x.y < yHaut);
      assert.ok(t, `le nombre ${valeur} de la ligne du haut n'est pas au-dessus d'elle`);
    }
    // ceux de la ligne du bas sont en dessous d'elle
    for (const valeur of ["1,7", "3,4", "8,5"]) {
      const t = textes.find((x) => x.contenu === valeur);
      assert.ok(t && t.y > yBas, `le nombre ${valeur} de la ligne du bas n'est pas en dessous d'elle`);
    }
    // les noms de ligne sont à gauche, à hauteur de leur axe
    const litres = textes.find((t) => t.contenu === "Litres");
    const prix = textes.find((t) => t.contenu === "Prix (€)");
    assert.ok(Math.abs(litres.y - yHaut) < 8 && Math.abs(prix.y - yBas) < 8);
    assert.ok(svg.includes('x="12"'), "les noms de ligne ne sont pas calés à gauche");
  });
});

describe("double droite des pourcentages", () => {
  it("donner le total suffit : les correspondances sont calculées", () => {
    const dessin = dessinerDoubleDroitePourcentage({ total: 240, pourcentage: 75, nomBas: "Élèves" });
    const contenus = contenusDe(dessin.svg);
    for (const p of ["0 %", "25 %", "50 %", "75 %", "100 %"]) {
      assert.ok(contenus.includes(p), `${p} manquant en haut`);
    }
    for (const v of ["60", "120", "180", "240"]) {
      assert.ok(contenus.includes(v), `${v} manquant en bas`);
    }
    assert.equal(dessin.valeur, 180);
  });

  it("correction (d) : le point est marqué SUR LES DEUX lignes", () => {
    const { svg } = dessinerDoubleDroitePourcentage({ total: 240, pourcentage: 75, nomBas: "Élèves" });
    const [yHaut, yBas] = axesDe(svg);
    const textes = textesDe(svg);
    assert.ok(
      textes.some((t) => t.contenu === "75 %" && t.y < yHaut - 20),
      "l'étiquette du point manque au-dessus de la ligne des pourcentages",
    );
    assert.equal(
      textes.filter((t) => t.contenu === "180").length,
      2,
      "180 devrait apparaître deux fois : la graduation ET le point repéré",
    );
    assert.ok(
      textes.some((t) => t.contenu === "180" && t.y > yBas + 40),
      "la correspondance n'est pas étiquetée sous la ligne des valeurs",
    );
    assert.equal(disquesDe(svg, COULEURS_DROITE.point), 1);
    assert.equal(disquesDe(svg, COULEURS_DROITE.correspondance), 1);
  });

  it("les trois échelles nommées : quarts, cinquièmes, libre", () => {
    assert.deepEqual([...ECHELLES_POURCENTAGE], ["quarts", "cinquiemes", "libre"]);
    const quarts = contenusDe(dessinerDoubleDroitePourcentage({ total: 200, echelle: "quarts" }).svg);
    assert.ok(quarts.includes("25 %") && quarts.includes("50 %") && !quarts.includes("20 %"));
    const cinquiemes = contenusDe(dessinerDoubleDroitePourcentage({ total: 200, echelle: "cinquiemes" }).svg);
    assert.ok(cinquiemes.includes("20 %") && cinquiemes.includes("40 %") && !cinquiemes.includes("25 %"));
    const libre = contenusDe(
      dessinerDoubleDroitePourcentage({ total: 200, echelle: "libre", pas: 12.5 }).svg,
    );
    assert.ok(libre.includes("12,5 %"), "l'échelle libre n'a pas pris le pas demandé");
  });

  it("on peut dépasser 100 % (hausses)", () => {
    const dessin = dessinerDoubleDroitePourcentage({
      total: 200, echelle: "libre", pas: 20, maxPourcentage: 140, pourcentage: 120,
    });
    const contenus = contenusDe(dessin.svg);
    assert.ok(contenus.includes("140 %"), "la droite s'arrête à 100 %");
    assert.ok(contenus.includes("280"), "la valeur de 140 % manque en bas");
    assert.equal(dessin.valeur, 240);
  });

  it("sans total, la ligne du bas reste en pourcentages", () => {
    const dessin = dessinerDoubleDroitePourcentage({ echelle: "quarts", pourcentage: 50 });
    assert.equal(dessin.valeur, 50);
  });
});

/* ------------------------------------------------------------------ */
/* 4. Refus des réglages impossibles                                    */
/* ------------------------------------------------------------------ */

describe("les réglages impossibles sont refusés, en français", () => {
  it("max doit être strictement supérieur à min", () => {
    assert.throws(
      () => dessinerDroiteGraduee({ min: 5, max: 5 }),
      (e) => e instanceof RangeError && /doit être strictement supérieur à min/.test(e.message),
    );
    assert.throws(
      () => dessinerDroiteGraduee({ min: 5, max: 2 }),
      /max \(2\) doit être strictement supérieur à min \(5\)/,
    );
  });

  it("le pas doit être strictement positif, et le nombre de graduations raisonnable", () => {
    assert.throws(() => dessinerDroiteGraduee({ pas: 0 }), /le pas doit être strictement positif/);
    assert.throws(() => dessinerDroiteGraduee({ pas: -2 }), /le pas doit être strictement positif \(reçu −2\)/);
    assert.throws(() => dessinerDroiteGraduee({ min: 0, max: 1000, pas: 0.5 }), /c'est trop/);
    assert.throws(() => dessinerDroiteGraduee({ pas: "beaucoup" }), /un nombre est attendu/);
  });

  it("un point ou une graduation hors des bornes est refusé", () => {
    assert.throws(
      () => dessinerDroiteGraduee({ min: 0, max: 10, points: [{ valeur: 12, etiquette: "12" }] }),
      /le point 12 sort de la droite \[0 ; 10\]/,
    );
    assert.throws(
      () => dessinerDroiteGraduee({ min: 0, max: 10, graduations: [0, 5, 30] }),
      /la graduation 30 sort de la droite/,
    );
    assert.throws(
      () => dessinerDroiteGraduee({ min: -5, max: 5, points: [{ valeur: -9 }] }),
      /le point −9 sort de la droite \[−5 ; 5\]/,
    );
  });

  it("une position de point inconnue est refusée", () => {
    assert.throws(
      () => dessinerDroiteGraduee({ points: [{ valeur: 3, position: "gauche" }] }),
      /position de point invalide « gauche » — attendu « dessus » ou « dessous »/,
    );
  });

  it("un coteNombres mal orthographié est refusé, pas ignoré en silence", () => {
    assert.throws(
      () => dessinerDroiteGraduee({ coteNombres: "en dessous" }),
      /coteNombres invalide « en dessous » — attendu « dessus » ou « dessous »/,
    );
    // les deux valeurs légitimes, elles, passent
    for (const cote of ["dessus", "dessous"]) {
      assert.ok(dessinerDroiteGraduee({ coteNombres: cote }).hauteur > 0);
    }
  });

  it("une couleur qui n'est pas hexadécimale est refusée (pas d'injection dans le SVG)", () => {
    // Les couleurs ne passent PAS par l'échappement des textes : une chaîne
    // libre glisserait un attribut dans le SVG. Même règle que fractions.js.
    assert.throws(
      () => dessinerDroiteGraduee({ points: [{ valeur: 2, couleur: '" onload="alerte(1)' }] }),
      /couleur du point n° 1 : la couleur doit être hexadécimale/,
    );
    assert.throws(
      () => dessinerDroiteGraduee({ points: [{ valeur: 2, couleur: "rouge" }] }),
      /la couleur doit être hexadécimale/,
    );
    assert.throws(
      () => dessinerDoubleDroitePourcentage({ total: 100, pourcentage: 50, couleurPoint: "red" }),
      /couleurPoint : la couleur doit être hexadécimale/,
    );
    assert.throws(
      () =>
        dessinerDoubleDroitePourcentage({
          total: 100,
          pourcentage: 50,
          couleurCorrespondance: "><script>x</script>",
        }),
      /couleurCorrespondance : la couleur doit être hexadécimale/,
    );
    // une couleur hexadécimale légitime reste acceptée
    const bonne = dessinerDroiteGraduee({ points: [{ valeur: 2, couleur: "#2f6fb2" }] });
    assert.equal(disquesDe(bonne.svg, "#2f6fb2"), 1);
  });

  it("une liste de graduations imposée reste plafonnée comme le pas régulier", () => {
    const trop = Array.from({ length: MAX_GRADUATIONS + 2 }, (_, i) => i / 1000);
    assert.throws(
      () => dessinerDroiteGraduee({ min: 0, max: 1, graduations: trop }),
      /graduations demandées, c'est trop/,
    );
    // juste en dessous du plafond, ça passe
    const juste = Array.from({ length: MAX_GRADUATIONS + 1 }, (_, i) => i / 1000);
    assert.ok(dessinerDroiteGraduee({ min: 0, max: 1, graduations: juste }).svg.startsWith("<svg"));
  });

  it("des graduations en double ne s'impriment pas l'une sur l'autre", () => {
    const { svg } = dessinerDroiteGraduee({ min: 0, max: 4, graduations: [0, 2, 2, 2, 4] });
    assert.deepEqual(contenusDe(svg), ["0", "2", "4"], "le 2 aurait dû être écrit une seule fois");
    assert.equal([...svg.matchAll(/stroke-width="1\.35"/g)].length, 3, "trait de graduation doublé");
    assert.throws(
      () => dessinerDroiteGraduee({ min: 0, max: 4, graduations: [2, 2] }),
      /au moins deux valeurs distinctes/,
    );
  });

  it("les réglages de pourcentage incohérents sont refusés", () => {
    assert.throws(
      () => dessinerDoubleDroitePourcentage({ total: 100, echelle: "tiers" }),
      /échelle inconnue « tiers »/,
    );
    assert.throws(
      () => dessinerDoubleDroitePourcentage({ total: 100, echelle: "quarts", pas: 10 }),
      /l'échelle « quarts » impose un pas de 25 %/,
    );
    assert.throws(
      () => dessinerDoubleDroitePourcentage({ total: 0 }),
      /le total doit être strictement positif/,
    );
    assert.throws(
      () => dessinerDoubleDroitePourcentage({ total: 240, pourcentage: 180 }),
      /le pourcentage 180 % sort de la droite \[0 % ; 100 %\]/,
    );
  });
});

/* ------------------------------------------------------------------ */
/* 5. Tenue générale de l'objet                                         */
/* ------------------------------------------------------------------ */

describe("tenue générale", () => {
  it("le rendu est déterministe et les textes sont échappés", () => {
    const options = { min: 0, max: 4, pas: 1, points: [{ valeur: 2, etiquette: "<script>x</script>" }] };
    const a = dessinerDroiteGraduee(options).svg;
    const b = dessinerDroiteGraduee(options).svg;
    assert.equal(a, b);
    assert.ok(!a.includes("<script"), "texte non échappé");
  });

  it("un nom de ligne trop long rétrécit au lieu de déborder sur l'axe", () => {
    const nom = "Nombre de bonbons distribués";
    const etroite = dessinerDroiteGraduee({ min: 0, max: 4, largeur: 240, nom });
    const taille = Number(etroite.svg.match(/font-size="([\d.]+)"[^>]*>Nombre de bonbons/)[1]);
    assert.ok(taille < 13, `le nom garde sa taille pleine (${taille}) et déborde sur la droite`);
    assert.ok(taille >= 9, `le nom est devenu illisible (${taille})`);
    // sur un dessin large, la place ne manque pas : taille pleine
    const large = dessinerDroiteGraduee({ min: 0, max: 4, largeur: 900, nom });
    assert.equal(Number(large.svg.match(/font-size="([\d.]+)"[^>]*>Nombre de bonbons/)[1]), 13);
  });

  it("le SVG est autonome et bien formé", () => {
    const { svg } = dessinerDoubleDroitePourcentage({ total: 240, pourcentage: 75 });
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), "xmlns manquant");
    assert.ok(svg.endsWith("</svg>"), "balise racine non fermée");
    // aucune ressource extérieure : le dessin doit vivre seul dans un export
    assert.ok(!/<image|xlink:href|url\(|<use\b/.test(svg), "le SVG dépend d'une ressource extérieure");
    assert.ok(!/on[a-z]+=/.test(svg), "un attribut d'événement s'est glissé dans le SVG");
    // autant de balises ouvertes que fermées pour les éléments à contenu
    assert.equal(
      [...svg.matchAll(/<text\b/g)].length,
      [...svg.matchAll(/<\/text>/g)].length,
      "des balises <text> ne sont pas fermées",
    );
  });

  it("les couleurs viennent de la charte, aucune n'est inventée", () => {
    assert.equal(COULEURS_DROITE.encre, COULEURS.encre);
    assert.equal(COULEURS_DROITE.point, COULEURS.bleu);
    assert.equal(COULEURS_DROITE.correspondance, COULEURS.reussite);
    assert.equal(VERSION_DROITE_GRADUEE, 2);
  });

  it("emploie la typographie mathématique commune et expose sa géométrie", () => {
    const dessin = dessinerDroiteGraduee({ min: -1, max: 1, pas: 0.25, largeur: 480 });
    assert.match(dessin.svg, /font-family="'Times New Roman', Times, 'Liberation Serif', serif"/);
    assert.match(dessin.svg, /font-variant-numeric="lining-nums tabular-nums"/);
    assert.deepEqual(dessin.geometrie.graduations, [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]);
    assert.equal(dessin.geometrie.min, -1);
    assert.equal(dessin.geometrie.max, 1);
    assert.ok(dessin.geometrie.xGauche < dessin.geometrie.xDroite);
    assert.throws(() => dessin.geometrie.graduations.push(2), TypeError);
  });

  it("chaque préréglage se dessine sans erreur", () => {
    assert.ok(PREREGLAGES_DROITE_GRADUEE.length >= 8);
    for (const p of PREREGLAGES_DROITE_GRADUEE) {
      const dessin = dessinerPrereglageDroiteGraduee(p.id);
      assert.ok(dessin.svg.startsWith("<svg"), `${p.id} : SVG absent`);
      assert.ok(dessin.hauteur > 0 && dessin.largeur > 0, `${p.id} : dimensions invalides`);
    }
    assert.throws(() => dessinerPrereglageDroiteGraduee("inconnu"), /préréglage inconnu/);
  });

  it("l'origine du module est déclarée dans le registre de provenance", () => {
    const origine = PROVENANCE_OBJETS["droite-graduee.js"];
    assert.ok(origine, "droite-graduee.js absent de PROVENANCE_OBJETS");
    assert.equal(origine.statut, "reconstruit");
    assert.match(origine.source, /PR #8/);
  });

  // Défaut constaté à l'usage : un SVG sans hauteur ne s'affiche pas quand on
  // ouvre le fichier seul (export, envoi, visionneuse) — il ne marche que dans
  // une page web. Tous les objets de la maison donnent largeur ET hauteur.
  it("porte une largeur ET une hauteur en pixels, comme les autres objets", () => {
    for (const { svg } of [
      dessinerDroiteGraduee({ min: 0, max: 10 }),
      dessinerDoubleDroitePourcentage({ total: 240 }),
    ]) {
      assert.match(svg, /width="\d+(\.\d+)?"/, "largeur en pixels absente");
      assert.match(svg, /height="\d+(\.\d+)?"/, "hauteur en pixels absente");
      assert.doesNotMatch(svg, /width="100%"/, "largeur en pourcentage : illisible hors page web");
    }
  });
});
