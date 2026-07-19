// Tests de l'objet officiel « fractions ».
//
// Ils vérifient ce qui fait la valeur pédagogique de l'objet : le
// découpage en parts égales, l'écriture fractionnaire DESSINÉE (et non
// écrite « 3/4 »), le repère de l'unité, la grille carrée qui montre les
// fractions équivalentes, et les trois corrections demandées à la reprise
// de la PR #8 (arrondi à 2 décimales, couleurs de la charte, virgule
// décimale française).

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { COULEURS, COULEURS_POURCENTAGES } from "../../charte/src/charte.js";
import { PROVENANCE_OBJETS } from "./provenance.js";
import {
  COTES_GRILLE_MAX,
  COULEURS_FRACTIONS,
  DENOMINATEUR_MAX,
  PREREGLAGES_FRACTIONS,
  VERSION_FRACTIONS,
  dessinerBandeFraction,
  dessinerGrilleFraction,
  dessinerPrereglageFraction,
  verifierBandeFraction,
  verifierGrilleFraction,
} from "./fractions.js";

const ICI = dirname(fileURLToPath(import.meta.url));

function rectangles(svg) {
  return [...svg.matchAll(/<rect [^>]*\/>/g)].map((m) => m[0]);
}

function rectanglesColories(svg, couleur) {
  return rectangles(svg).filter((r) => r.includes(`fill="${couleur}"`));
}

function blocEcriture(svg) {
  const bloc = svg.match(/<g class="ecriture-fraction">(.*?)<\/g>/);
  return bloc ? bloc[1] : null;
}

function elementsDe(fragment) {
  return [...fragment.matchAll(/<(text|line|rect|circle|path)[ >]/g)].map((m) => m[1]);
}

function viewBoxDe(svg) {
  return svg.match(/viewBox="([^"]+)"/)[1];
}

function desechapper(texte) {
  return texte
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

/** Les rectangles d'une bande ou d'une grille, décodés en nombres. */
function casesDe(svg) {
  return rectangles(svg).map((r) => ({
    x: Number(r.match(/ x="(-?[\d.]+)"/)[1]),
    y: Number(r.match(/ y="(-?[\d.]+)"/)[1]),
    largeur: Number(r.match(/ width="([\d.]+)"/)[1]),
    hauteur: Number(r.match(/ height="([\d.]+)"/)[1]),
  }));
}

// ---------------------------------------------------------------------------

describe("la bande fractionnée", () => {
  it("découpe la bande en parts égales et colorie les premières", () => {
    const { svg, erreur } = dessinerBandeFraction({ numerateur: 3, denominateur: 4 });
    assert.equal(erreur, null);
    assert.equal(rectangles(svg).length, 4, "quatre parts pour un quatrième");
    assert.equal(rectanglesColories(svg, COULEURS_FRACTIONS.part).length, 3);
    assert.equal(rectanglesColories(svg, COULEURS_FRACTIONS.vide).length, 1);
    // parts égales : toutes les largeurs sont identiques
    const largeurs = new Set(
      rectangles(svg).map((r) => r.match(/width="([\d.]+)"/)[1]),
    );
    assert.equal(largeurs.size, 1, "les parts doivent être égales");
  });

  it("va jusqu'aux douzièmes (et jusqu'au dénominateur 24)", () => {
    const douziemes = dessinerBandeFraction({ numerateur: 7, denominateur: 12 });
    assert.equal(douziemes.erreur, null);
    assert.equal(rectangles(douziemes.svg).length, 12);
    assert.equal(rectanglesColories(douziemes.svg, COULEURS_FRACTIONS.part).length, 7);

    const vingtQuatriemes = dessinerBandeFraction({ numerateur: 5, denominateur: DENOMINATEUR_MAX });
    assert.equal(vingtQuatriemes.erreur, null);
    assert.equal(rectangles(vingtQuatriemes.svg).length, 24);
  });

  it("dessine l'écriture fractionnaire en TROIS éléments, jamais le texte « 3/4 »", () => {
    const { svg } = dessinerBandeFraction({ numerateur: 3, denominateur: 4 });
    const bloc = blocEcriture(svg);
    assert.ok(bloc, "l'écriture fractionnaire doit être présente");
    assert.deepEqual(
      elementsDe(bloc),
      ["text", "line", "text"],
      "numérateur, barre horizontale, dénominateur — trois éléments SVG séparés",
    );
    assert.match(bloc, /<text[^>]*>3<\/text>/);
    assert.match(bloc, /<text[^>]*>4<\/text>/);
    assert.ok(!svg.includes("3/4"), "l'écriture ne doit jamais être le texte « 3/4 »");
    assert.ok(!svg.includes("&#47;"));
  });

  it("l'écriture fractionnaire peut être débranchée", () => {
    const { svg } = dessinerBandeFraction({ numerateur: 3, denominateur: 4, ecriture: false });
    assert.equal(blocEcriture(svg), null);
  });

  it("le repère « 1 » de l'unité s'active et se désactive", () => {
    const avec = dessinerBandeFraction({ numerateur: 1, denominateur: 3 });
    assert.match(avec.svg, /<g class="repere-unite">/, "le repère est affiché par défaut");
    const bloc = avec.svg.match(/<g class="repere-unite">(.*?)<\/g>/)[1];
    assert.match(bloc, /<text[^>]*>1<\/text>/, "le repère porte bien l'écriture « 1 »");

    const sans = dessinerBandeFraction({ numerateur: 1, denominateur: 3, repere: false });
    assert.ok(!sans.svg.includes('class="repere-unite"'));
    // la géométrie est réservée : le dessin ne change pas de taille
    assert.equal(viewBoxDe(sans.svg), viewBoxDe(avec.svg));
  });

  it("accepte l'unité entière et la fraction nulle", () => {
    const entiere = dessinerBandeFraction({ numerateur: 4, denominateur: 4 });
    assert.equal(entiere.erreur, null);
    assert.equal(rectanglesColories(entiere.svg, COULEURS_FRACTIONS.part).length, 4);

    const nulle = dessinerBandeFraction({ numerateur: 0, denominateur: 4 });
    assert.equal(nulle.erreur, null);
    assert.equal(rectanglesColories(nulle.svg, COULEURS_FRACTIONS.part).length, 0);
  });
});

// ---------------------------------------------------------------------------

describe("la grille fractionnée", () => {
  it("montre la même fraction en 5 × 4 et en 4 × 5 — les fractions équivalentes", () => {
    const cinqParQuatre = dessinerGrilleFraction({ colonnes: 5, lignes: 4, coloriees: 16 });
    const quatreParCinq = dessinerGrilleFraction({ colonnes: 4, lignes: 5, coloriees: 16 });

    for (const rendu of [cinqParQuatre, quatreParCinq]) {
      assert.equal(rendu.erreur, null);
      assert.equal(rectangles(rendu.svg).length, 20, "vingt cases dans les deux cas");
      assert.equal(rectanglesColories(rendu.svg, COULEURS_FRACTIONS.part).length, 16);
    }
    // Même surface à l'écran : c'est ce qui rend la comparaison honnête.
    assert.equal(viewBoxDe(cinqParQuatre.svg), viewBoxDe(quatreParCinq.svg));
    // Mais le découpage, lui, diffère bien.
    assert.notEqual(cinqParQuatre.svg, quatreParCinq.svg);
  });

  it("reste toujours carrée, avec des cases régulières entre elles", () => {
    for (const [colonnes, lignes] of [[5, 4], [4, 5], [3, 1], [1, 7], [20, 20]]) {
      const { svg } = dessinerGrilleFraction({ colonnes, lignes, coloriees: 1, cote: 240 });
      const cases = rectangles(svg);
      const largeurs = new Set(cases.map((r) => r.match(/width="([\d.]+)"/)[1]));
      const hauteurs = new Set(cases.map((r) => r.match(/height="([\d.]+)"/)[1]));
      assert.equal(largeurs.size, 1, `${colonnes} × ${lignes} : cases de largeurs inégales`);
      assert.equal(hauteurs.size, 1, `${colonnes} × ${lignes} : cases de hauteurs inégales`);
      // colonnes × largeur de case = lignes × hauteur de case = le côté du carré
      const total = colonnes * Number([...largeurs][0]);
      const totalVertical = lignes * Number([...hauteurs][0]);
      assert.ok(Math.abs(total - 240) < 0.5, `${colonnes} × ${lignes} : la grille n'est pas carrée`);
      assert.ok(Math.abs(totalVertical - 240) < 0.5, `${colonnes} × ${lignes} : la grille n'est pas carrée`);
    }
  });

  it("donne la grille des centièmes en 10 × 10, sans peser 12 Ko", () => {
    const { svg, erreur, texteAlternatif } = dessinerGrilleFraction({
      colonnes: 10,
      lignes: 10,
      coloriees: 37,
    });
    assert.equal(erreur, null);
    assert.equal(rectangles(svg).length, 100);
    assert.equal(rectanglesColories(svg, COULEURS_FRACTIONS.part).length, 37);
    assert.match(texteAlternatif, /100 cases/);
    // L'original produisait ~12 Ko pour ces 100 cases (flottants à 14
    // décimales). L'arrondi à 2 décimales doit ramener bien en dessous.
    assert.ok(svg.length < 9000, `grille des centièmes trop lourde : ${svg.length} caractères`);
  });

  it("va jusqu'à 20 × 20 cases", () => {
    const { svg, erreur } = dessinerGrilleFraction({
      colonnes: COTES_GRILLE_MAX,
      lignes: COTES_GRILLE_MAX,
      coloriees: 400,
    });
    assert.equal(erreur, null);
    assert.equal(rectangles(svg).length, 400);
  });

  it("dessine aussi son écriture fractionnaire en trois éléments", () => {
    const { svg } = dessinerGrilleFraction({ colonnes: 5, lignes: 4, coloriees: 16 });
    const bloc = blocEcriture(svg);
    assert.deepEqual(elementsDe(bloc), ["text", "line", "text"]);
    assert.match(bloc, /<text[^>]*>16<\/text>/);
    assert.match(bloc, /<text[^>]*>20<\/text>/);
  });
});

// ---------------------------------------------------------------------------

describe("réglages par exercice", () => {
  it("la couleur de remplissage est surchargeable", () => {
    const bande = dessinerBandeFraction({ numerateur: 3, denominateur: 4, remplissage: "#08b9b2" });
    assert.equal(rectanglesColories(bande.svg, "#08b9b2").length, 3);
    assert.equal(rectanglesColories(bande.svg, COULEURS_FRACTIONS.part).length, 0);

    const grille = dessinerGrilleFraction({
      colonnes: 5,
      lignes: 4,
      coloriees: 16,
      remplissage: "#08b9b2",
    });
    assert.equal(rectanglesColories(grille.svg, "#08b9b2").length, 16);
  });

  it("les couleurs par défaut viennent de la charte, aucune palette figée en dur", () => {
    assert.equal(COULEURS_FRACTIONS.part, COULEURS_POURCENTAGES.c50);
    assert.equal(COULEURS_FRACTIONS.trait, COULEURS_POURCENTAGES.encre);
    assert.equal(COULEURS_FRACTIONS.vide, COULEURS.papier);
    assert.equal(COULEURS_FRACTIONS.erreurTrait, COULEURS.erreur);

    // Le CODE (commentaires exclus : l'en-tête cite légitimement le
    // #f4c542 de l'original) ne doit figer aucune couleur en dur.
    const code = readFileSync(join(ICI, "fractions.js"), "utf8")
      .split(/\r?\n/)
      .filter((ligne) => !ligne.trimStart().startsWith("//"))
      .join("\n");
    const couleursEcrites = new Set([...code.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0]));
    // Plus AUCUNE couleur littérale : même l'exemple du message d'erreur est
    // lu dans la charte, sans quoi il vieillirait le jour où le jaune change.
    assert.deepEqual([...couleursEcrites], []);
    assert.match(
      verifierBandeFraction({ numerateur: 1, denominateur: 2, remplissage: "rouge vif" }),
      new RegExp(`par exemple ${COULEURS_POURCENTAGES.c50}\\.$`),
      "l'exemple du message doit être le jaune des parts de la charte",
    );
  });
});

// ---------------------------------------------------------------------------

describe("validation avant dessin", () => {
  it("refuse un numérateur plus grand que le dénominateur, en français et dans un cadre", () => {
    const { svg, erreur, texteAlternatif } = dessinerBandeFraction({
      numerateur: 5,
      denominateur: 4,
    });
    assert.equal(erreur, verifierBandeFraction({ numerateur: 5, denominateur: 4 }));
    assert.match(erreur, /Le numérateur \(5\) ne peut pas dépasser le dénominateur \(4\)/);
    assert.match(svg, /<rect [^>]*stroke="#e03434"/, "le message doit être encadré");
    assert.match(svg, /Réglages impossibles/);
    assert.match(texteAlternatif, /Réglages impossibles/);
    // aucune bande n'est dessinée : on ne montre pas une fraction fausse
    assert.equal(rectanglesColories(svg, COULEURS_FRACTIONS.part).length, 0);
  });

  it("refuse les dénominateurs hors des bornes pédagogiques", () => {
    assert.match(
      verifierBandeFraction({ numerateur: 1, denominateur: 1 }),
      /entier compris entre 2 et 24/,
    );
    assert.match(
      verifierBandeFraction({ numerateur: 1, denominateur: 25 }),
      /entier compris entre 2 et 24/,
    );
    assert.match(
      verifierBandeFraction({ numerateur: 1, denominateur: 4.5 }),
      /entier compris entre 2 et 24/,
    );
    assert.match(verifierBandeFraction({ numerateur: -1, denominateur: 4 }), /positif ou nul/);
  });

  it("refuse trop de colonnes, trop de lignes, trop de cases coloriées", () => {
    assert.match(
      verifierGrilleFraction({ colonnes: 21, lignes: 4, coloriees: 1 }),
      /colonnes doit être un nombre entier compris entre 1 et 20/,
    );
    assert.match(
      verifierGrilleFraction({ colonnes: 5, lignes: 0, coloriees: 1 }),
      /lignes doit être un nombre entier compris entre 1 et 20/,
    );
    assert.match(
      verifierGrilleFraction({ colonnes: 5, lignes: 4, coloriees: 25 }),
      /\(25\) ne peut pas dépasser le nombre de cases de la grille \(20\)/,
    );
    const rendu = dessinerGrilleFraction({ colonnes: 5, lignes: 4, coloriees: 25 });
    assert.ok(rendu.erreur);
    assert.match(rendu.svg, /Réglages impossibles/);
  });

  it("refuse une couleur de remplissage qui n'en est pas une", () => {
    assert.match(
      verifierBandeFraction({ numerateur: 1, denominateur: 2, remplissage: "rouge vif" }),
      /couleur hexadécimale/,
    );
    assert.equal(verifierBandeFraction({ numerateur: 1, denominateur: 2, remplissage: "#fff" }), null);
  });

  it("n'accepte que les longueurs hexadécimales réellement valides", () => {
    // #ffe66 et #1234567 ne sont pas des couleurs CSS : le navigateur les
    // écarte et remplit les parts en noir. La validation doit les refuser
    // AVANT le dessin, sinon on montre une fraction fausse.
    for (const bonne of ["#fff", "#fff8", "#ffe664", "#ffe664cc"]) {
      assert.equal(
        verifierBandeFraction({ numerateur: 1, denominateur: 2, remplissage: bonne }),
        null,
        `${bonne} est une couleur valide`,
      );
    }
    for (const mauvaise of ["#ff", "#ffe66", "#1234567", "#ffe664ccdd", "ffe664", ""]) {
      assert.match(
        String(verifierBandeFraction({ numerateur: 1, denominateur: 2, remplissage: mauvaise })),
        /couleur hexadécimale/,
        `${mauvaise} doit être refusée`,
      );
    }
  });

  it("un appel sans aucun réglage donne un cadre d'erreur, jamais une exception", () => {
    for (const rendu of [dessinerBandeFraction(), dessinerGrilleFraction()]) {
      assert.ok(rendu.erreur, "un appel sans réglages doit être refusé");
      assert.match(rendu.svg, /Réglages impossibles/);
      assert.ok(rendu.largeur > 0 && rendu.hauteur > 0);
    }
  });

  it("le message d'erreur tient DANS son cadre : il est replié et jamais rogné", () => {
    // Le cadre fixe de 520 × 96 écrivait le message sur une seule ligne :
    // 498 px en Segoe UI pour 504 px de cadre, mais 507 à 617 px dès que la
    // police de repli s'applique — donc rogné, et hors du viewBox avec
    // DejaVu Sans ou Verdana. Le cadre suit maintenant son message.
    const messages = [
      dessinerBandeFraction({ numerateur: 5, denominateur: 4 }),
      dessinerGrilleFraction({ colonnes: 20, lignes: 20, coloriees: 401 }),
      dessinerGrilleFraction({ colonnes: 21, lignes: 4, coloriees: 1 }),
      dessinerBandeFraction({ numerateur: 1, denominateur: 2, remplissage: "rouge vif" }),
    ];
    for (const { svg, largeur, hauteur, erreur } of messages) {
      const lignes = [
        ...svg.matchAll(/<text[^>]*\by="([\d.]+)"[^>]*font-size="12"[^>]*>([^<]*)<\/text>/g),
      ].map((m) => ({ y: Number(m[1]), contenu: m[2] }));
      assert.ok(lignes.length >= 1, "le message doit être écrit dans le cadre");
      for (const { y, contenu } of lignes) {
        // 6,6 px par caractère à 12 px de corps : majorant mesuré au canvas
        // sur les messages de ce module, polices de repli comprises (6,43 px
        // au pire, en Verdana et DejaVu Sans).
        const largeurTexte = contenu.length * 6.6;
        assert.ok(
          largeurTexte <= largeur - 32,
          `message rogné (${Math.round(largeurTexte)} px dans un cadre de ${largeur} px) : « ${contenu} »`,
        );
        assert.ok(y + 4 < hauteur - 8, `ligne de message sous le bas du cadre : y = ${y}`);
      }
      // replié, le message reste le message : rien n'est perdu en route
      const recompose = desechapper(lignes.map((l) => l.contenu).join(" "));
      assert.equal(recompose, erreur, "le repli ne doit rien retirer au message");
    }
    // un message long est bien replié sur plusieurs lignes
    const long = dessinerGrilleFraction({ colonnes: 20, lignes: 20, coloriees: 401 });
    assert.equal(long.erreur.length, 94);
    const nbLignes = [...long.svg.matchAll(/font-size="12"/g)].length;
    assert.ok(nbLignes >= 2, "un message de 94 caractères doit être replié");
  });
});

// ---------------------------------------------------------------------------

describe("corrections apportées au code d'origine", () => {
  it("toutes les coordonnées sont arrondies à 2 décimales au plus", () => {
    const rendus = [
      dessinerBandeFraction({ numerateur: 7, denominateur: 12 }),
      dessinerBandeFraction({ numerateur: 5, denominateur: 24, largeur: 733 }),
      dessinerGrilleFraction({ colonnes: 10, lignes: 10, coloriees: 37 }),
      dessinerGrilleFraction({ colonnes: 7, lignes: 3, coloriees: 11, cote: 271 }),
      dessinerGrilleFraction({ colonnes: 20, lignes: 20, coloriees: 133 }),
    ];
    for (const { svg } of rendus) {
      const trop = [...svg.matchAll(/="(-?\d+\.\d{3,})"/g)].map((m) => m[1]);
      assert.deepEqual(trop, [], `coordonnées non arrondies : ${trop.slice(0, 3).join(", ")}`);
      assert.ok(!/NaN|Infinity/.test(svg), "aucun NaN ni Infinity dans le SVG");
    }
  });

  it("le SVG est bien formé : aucun attribut n'est refermé par ses propres guillemets", () => {
    // La pile de polices de la charte cite « "Segoe UI" » : reprise telle
    // quelle, elle cassait l'attribut font-family et le texte retombait en
    // serif. Chaque balise doit porter un nombre PAIR de guillemets.
    const rendus = [
      dessinerBandeFraction({ numerateur: 3, denominateur: 4, titre: "Trois quarts" }),
      dessinerGrilleFraction({ colonnes: 5, lignes: 4, coloriees: 16 }),
      dessinerBandeFraction({ numerateur: 5, denominateur: 4 }),
    ];
    for (const { svg } of rendus) {
      for (const [balise] of svg.matchAll(/<[^>]+>/g)) {
        const guillemets = (balise.match(/"/g) ?? []).length;
        assert.equal(guillemets % 2, 0, `balise mal formée : ${balise.slice(0, 90)}`);
      }
      assert.match(svg, /font-family="[^"]*sans-serif"/, "la pile de polices doit tenir entière");
      assert.ok(!svg.includes('font-family=""'), "la pile de polices ne doit pas être vide");
    }
  });

  it("les nombres affichés s'écrivent à la française et les textes sont échappés", () => {
    // Les fractions n'affichent que des entiers : la règle se vérifie sur
    // l'absence de point décimal dans les textes écrits.
    const { svg } = dessinerBandeFraction({ numerateur: 3, denominateur: 4, titre: "3 < 4 & vrai" });
    for (const [, contenu] of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
      assert.ok(!/\d\.\d/.test(contenu), `nombre à point décimal affiché : « ${contenu} »`);
    }
    assert.match(svg, /3 &lt; 4 &amp; vrai/, "le titre doit être échappé");
    for (const [, contenu] of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
      assert.ok(!contenu.includes("<"), "texte non échappé");
    }
  });
});

// ---------------------------------------------------------------------------

describe("accessibilité et déterminisme", () => {
  it("écrit un texte alternatif français, automatique, avec les bons accords", () => {
    const une = dessinerBandeFraction({ numerateur: 1, denominateur: 4 });
    assert.equal(
      une.texteAlternatif,
      "Bande unité partagée en 4 parts égales ; 1 part est coloriée, ce qui représente la fraction 1 sur 4.",
    );
    const trois = dessinerBandeFraction({ numerateur: 3, denominateur: 4 });
    assert.match(trois.texteAlternatif, /3 parts sont coloriées/);

    const grille = dessinerGrilleFraction({ colonnes: 5, lignes: 4, coloriees: 16 });
    assert.equal(
      grille.texteAlternatif,
      "Grille de 5 colonnes et 4 lignes, soit 20 cases égales ; 16 cases sont coloriées, ce qui représente la fraction 16 sur 20.",
    );
    // le texte alternatif est aussi porté par le SVG lui-même
    assert.ok(grille.svg.includes(`aria-label="${grille.texteAlternatif}"`));
    assert.match(grille.svg, /role="img"/);
  });

  it("même entrée, même sortie : le rendu est déterministe", () => {
    const reglagesBande = { numerateur: 7, denominateur: 12, titre: "Sept douzièmes" };
    const reglagesGrille = { colonnes: 10, lignes: 10, coloriees: 37 };
    for (let i = 0; i < 5; i += 1) {
      assert.equal(
        dessinerBandeFraction(reglagesBande).svg,
        dessinerBandeFraction(reglagesBande).svg,
      );
      assert.equal(
        dessinerGrilleFraction(reglagesGrille).svg,
        dessinerGrilleFraction(reglagesGrille).svg,
      );
    }
    // et deux fractions différentes ne donnent pas le même dessin
    assert.notEqual(
      dessinerBandeFraction({ numerateur: 7, denominateur: 12 }).svg,
      dessinerBandeFraction({ numerateur: 8, denominateur: 12 }).svg,
    );
  });

  it("accorde le singulier et le pluriel en français", () => {
    // « 1 lignes », « 1 cases égales » : le texte alternatif est lu à voix
    // haute, il doit être écrit en français correct.
    assert.equal(
      dessinerGrilleFraction({ colonnes: 1, lignes: 1, coloriees: 0 }).texteAlternatif,
      "Grille de 1 colonne et 1 ligne, soit 1 case égale ; 0 case est coloriée, " +
        "ce qui représente la fraction 0 sur 1.",
    );
    assert.equal(
      dessinerGrilleFraction({ colonnes: 3, lignes: 1, coloriees: 2 }).texteAlternatif,
      "Grille de 3 colonnes et 1 ligne, soit 3 cases égales ; 2 cases sont coloriées, " +
        "ce qui représente la fraction 2 sur 3.",
    );
    for (const rendu of [
      dessinerGrilleFraction({ colonnes: 1, lignes: 4, coloriees: 1 }),
      dessinerGrilleFraction({ colonnes: 4, lignes: 1, coloriees: 1 }),
      dessinerBandeFraction({ numerateur: 1, denominateur: 2 }),
      dessinerBandeFraction({ numerateur: 0, denominateur: 3 }),
    ]) {
      assert.ok(
        !/\b1 (colonnes|lignes|cases|parts)\b/.test(rendu.texteAlternatif),
        `pluriel après « 1 » : ${rendu.texteAlternatif}`,
      );
      assert.ok(
        !/\b0 (cases|parts)\b/.test(rendu.texteAlternatif),
        `pluriel après « 0 » : ${rendu.texteAlternatif}`,
      );
    }
  });

  it("ne modifie jamais l'objet de réglages qu'on lui confie", () => {
    const reglages = { numerateur: 3, denominateur: 4, titre: "Trois quarts" };
    const copie = JSON.parse(JSON.stringify(reglages));
    dessinerBandeFraction(reglages);
    assert.deepEqual(reglages, copie);

    const grille = { colonnes: 5, lignes: 4, coloriees: 16 };
    const copieGrille = JSON.parse(JSON.stringify(grille));
    dessinerGrilleFraction(grille);
    assert.deepEqual(grille, copieGrille);
  });
});

// ---------------------------------------------------------------------------

describe("géométrie du dessin", () => {
  it("les parts de la bande pavent toute la bande, sans trou ni débordement", () => {
    for (const denominateur of [2, 3, 7, 12, 13, 24]) {
      for (const largeurDemandee of [240, 620, 733]) {
        const rendu = dessinerBandeFraction({
          numerateur: 1,
          denominateur,
          largeur: largeurDemandee,
        });
        const parts = casesDe(rendu.svg);
        assert.equal(parts.length, denominateur);
        const marge = parts[0].x;
        const derniere = parts[parts.length - 1];
        assert.ok(
          Math.abs(derniere.x + derniere.largeur - (rendu.largeur - marge)) < 0.05,
          `${denominateur} parts sur ${largeurDemandee} px : la bande ne se referme pas`,
        );
        // aucun trou entre deux parts consécutives
        for (let i = 1; i < parts.length; i += 1) {
          const trou = parts[i].x - (parts[i - 1].x + parts[i - 1].largeur);
          assert.ok(Math.abs(trou) < 0.05, `trou de ${trou} px entre deux parts`);
        }
      }
    }
  });

  it("rien ne sort du cadre : toutes les cases tiennent dans le viewBox", () => {
    const rendus = [
      dessinerBandeFraction({ numerateur: 3, denominateur: 4, titre: "Trois quarts" }),
      dessinerBandeFraction({ numerateur: 5, denominateur: 24, hauteurBande: 120 }),
      dessinerGrilleFraction({ colonnes: 10, lignes: 10, coloriees: 37, titre: "Centièmes" }),
      dessinerGrilleFraction({ colonnes: 20, lignes: 20, coloriees: 400, cote: 900 }),
    ];
    for (const rendu of rendus) {
      for (const c of casesDe(rendu.svg)) {
        assert.ok(c.x >= 0 && c.y >= 0, "case à coordonnée négative");
        assert.ok(c.x + c.largeur <= rendu.largeur + 0.05, "case débordant à droite");
        assert.ok(c.y + c.hauteur <= rendu.hauteur + 0.05, "case débordant en bas");
      }
      assert.equal(viewBoxDe(rendu.svg), `0 0 ${rendu.largeur} ${rendu.hauteur}`);
    }
  });

  it("les tailles demandées sont ramenées dans leurs bornes", () => {
    assert.equal(dessinerBandeFraction({ numerateur: 1, denominateur: 2, largeur: 10 }).largeur, 240);
    assert.equal(
      dessinerBandeFraction({ numerateur: 1, denominateur: 2, largeur: 9999 }).largeur,
      1600,
    );
    assert.equal(
      dessinerBandeFraction({ numerateur: 1, denominateur: 2, largeur: "grand" }).largeur,
      620,
      "une largeur qui n'est pas un nombre retombe sur la valeur par défaut",
    );
    // la grille : côté borné entre 120 et 900, marges comprises dans la largeur
    // la grille : côté ramené entre 120 et 900, plus les deux marges (2 × 28)
    const petite = dessinerGrilleFraction({ colonnes: 2, lignes: 2, coloriees: 1, cote: 10 });
    assert.equal(petite.largeur, 120 + 56);
    const grande = dessinerGrilleFraction({ colonnes: 2, lignes: 2, coloriees: 1, cote: 9999 });
    assert.equal(grande.largeur, 900 + 56);
  });

  it("l'écriture fractionnaire de la grille se débranche aussi", () => {
    const avec = dessinerGrilleFraction({ colonnes: 5, lignes: 4, coloriees: 16 });
    const sans = dessinerGrilleFraction({ colonnes: 5, lignes: 4, coloriees: 16, ecriture: false });
    assert.ok(blocEcriture(avec.svg));
    assert.equal(blocEcriture(sans.svg), null);
    // la géométrie reste réservée : deux grilles du même réglage se superposent
    assert.equal(viewBoxDe(sans.svg), viewBoxDe(avec.svg));
  });

  it("même la grille la plus dense reste d'un poids raisonnable", () => {
    // 20 × 20 est le réglage maximal : 400 cases. C'est le pire cas, et il
    // doit rester transportable dans un diaporama ou un export.
    const { svg } = dessinerGrilleFraction({
      colonnes: COTES_GRILLE_MAX,
      lignes: COTES_GRILLE_MAX,
      coloriees: 133,
    });
    assert.equal(rectangles(svg).length, 400);
    assert.ok(svg.length < 30000, `grille 20 × 20 trop lourde : ${svg.length} caractères`);
  });
});

// ---------------------------------------------------------------------------

describe("le catalogue et le registre du dépôt", () => {
  it("chaque préréglage se dessine sans erreur", () => {
    assert.ok(PREREGLAGES_FRACTIONS.length >= 6);
    for (const prereglage of PREREGLAGES_FRACTIONS) {
      const rendu = dessinerPrereglageFraction(prereglage);
      assert.equal(rendu.erreur, null, `${prereglage.id} : ${rendu.erreur}`);
      assert.ok(rendu.svg.startsWith("<svg"));
      assert.ok(rendu.hauteur > 0 && rendu.largeur > 0);
    }
    assert.ok(dessinerPrereglageFraction(null).erreur);
  });

  it("le module est déclaré en provenance et exporté par le paquet", () => {
    assert.equal(VERSION_FRACTIONS, 1);
    const origine = PROVENANCE_OBJETS["fractions.js"];
    assert.ok(origine, "fractions.js doit figurer dans provenance.js");
    assert.equal(origine.statut, "reconstruit");
    assert.match(origine.source, /pack de représentations/);

    const paquet = JSON.parse(readFileSync(join(ICI, "..", "package.json"), "utf8"));
    assert.equal(paquet.exports["./fractions"], "./src/fractions.js");
  });
});
