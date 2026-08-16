import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  COULEURS_BANDES_FRACTIONS,
  couleurBandeFraction,
} from "../../charte/src/charte.js";
import {
  VERSION_BANDES_FRACTIONS_RAIL,
  dessinerBandesFractionnairesSurRailDecimal,
} from "./bandes-fractions-rail.js";
import { PROVENANCE_OBJETS } from "./provenance.js";

function occurrences(texte, motif) {
  return [...texte.matchAll(motif)].length;
}

function attributPremier(svg, classe, attribut) {
  const element = svg.match(new RegExp(`<[^>]+class="[^"]*${classe}[^"]*"[^>]*>`));
  assert.ok(element, `classe ${classe} absente du SVG`);
  const valeur = element[0].match(new RegExp(`${attribut}="([^"]+)"`));
  assert.ok(valeur, `attribut ${attribut} absent de ${classe}`);
  return Number(valeur[1]);
}

function blocDeClasse(svg, classe) {
  return svg.match(new RegExp(`<g class="${classe}">(.*?)</g>`))?.[1] ?? null;
}

describe("bandes fractionnaires sur rail — cas d'or", () => {
  it("aligne exactement les cinq pièces de 5/1 sur le rail jusqu'à 5", () => {
    const reglages = Object.freeze({
      numerateur: 5,
      denominateur: 1,
      profil: "solution",
      etape: "pieces",
      largeur: 260,
    });
    const rendu = dessinerBandesFractionnairesSurRailDecimal(reglages);

    assert.equal(rendu.erreur, null);
    assert.deepEqual(
      {
        unites: rendu.donnees.unites,
        reste: rendu.donnees.reste,
        maximumRail: rendu.donnees.maximumRail,
        pas: rendu.donnees.pas,
      },
      { unites: 5, reste: 0, maximumRail: 5, pas: 1 },
    );
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 5);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part-barre"/g), 0);
    assert.equal(
      occurrences(rendu.svg, /class="ecriture-part"[^>]*>1<\/text>/g),
      5,
    );
    assert.equal(occurrences(rendu.svg, /class="source-fraction-barre"/g), 1);
    assert.equal(occurrences(rendu.svg, /class="joint-piece"/g), 4);
    assert.equal(occurrences(rendu.svg, /class="graduation graduation-entier"/g), 6);
    assert.match(
      rendu.svg,
      new RegExp(`class="fond-bandes"[^>]*fill="${COULEURS_BANDES_FRACTIONS.unite}"`),
    );
    assert.match(rendu.svg, /class="resultat-decimal"[^>]*>5<\/text>/);
    assert.match(rendu.texteAlternatif, /des unités/);
    assert.equal(
      attributPremier(rendu.svg, "guide-cible", "x1"),
      rendu.donnees.positionCible,
    );
    assert.equal(
      attributPremier(rendu.svg, "guide-origine", "x1"),
      rendu.donnees.origineRail,
    );
    assert.doesNotMatch(rendu.svg, /class="point-cible"/);
    assert.equal(rendu.donnees.distanceCible, 5 * rendu.donnees.largeurPartie);
    assert.ok(rendu.donnees.positionCible + 12 <= rendu.largeur);
    assert.equal(
      rendu.svg,
      dessinerBandesFractionnairesSurRailDecimal(reglages).svg,
    );
  });

  it("aligne exactement un demi sur 0,5", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 1,
      denominateur: 2,
      profil: "solution",
      etape: "lecture",
    });

    assert.equal(VERSION_BANDES_FRACTIONS_RAIL, 6);
    assert.equal(rendu.erreur, null);
    assert.deepEqual(
      {
        unites: rendu.donnees.unites,
        reste: rendu.donnees.reste,
        maximumRail: rendu.donnees.maximumRail,
        pas: rendu.donnees.pas,
      },
      { unites: 0, reste: 1, maximumRail: 1, pas: 0.5 },
    );
    assert.match(rendu.svg, new RegExp(`fill="${couleurBandeFraction(2)}"`));
    assert.match(rendu.svg, /class="resultat-decimal"[^>]*>0,5<\/text>/);
    assert.equal(
      attributPremier(rendu.svg, "guide-cible", "x1"),
      rendu.donnees.positionCible,
    );
    assert.equal(rendu.donnees.distanceCible, rendu.donnees.largeurPartie);
  });

  it("aligne trois quarts sur 0,75 avec la palette historique", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 3,
      denominateur: 4,
      profil: "solution",
      etape: "lecture",
    });

    assert.equal(rendu.erreur, null);
    assert.equal(rendu.donnees.maximumRail, 1);
    assert.equal(rendu.donnees.reste, 3);
    assert.match(rendu.svg, new RegExp(`fill="${COULEURS_BANDES_FRACTIONS.d4}"`));
    assert.match(rendu.svg, /class="resultat-decimal"[^>]*>0,75<\/text>/);
    assert.equal(
      rendu.donnees.distanceCible,
      3 * rendu.donnees.largeurPartie,
    );
  });

  it("forme deux unités puis un demi pour cinq demis sans livrer 2,5 en aide NC03", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 2,
      profil: "aide-nc03",
      etape: "unites",
    });

    assert.deepEqual(
      {
        unites: rendu.donnees.unites,
        reste: rendu.donnees.reste,
        maximumRail: rendu.donnees.maximumRail,
      },
      { unites: 2, reste: 1, maximumRail: 3 },
    );
    assert.equal(occurrences(rendu.svg, /class="unite-retournee"/g), 2);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 1);
    assert.match(rendu.svg, new RegExp(`fill="${COULEURS_BANDES_FRACTIONS.d2}"`));
    assert.ok(!rendu.svg.includes("2,5"));
    assert.ok(!rendu.texteAlternatif.includes("2,5"));
    assert.match(rendu.svg, /class="etiquette-cible cible-decimale-masquee"[^>]*>\?<\/text>/);
  });

  it("fusionne exactement les deux quarts restants en une demi-bande historique", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 6,
      denominateur: 4,
      profil: "aide-nc03",
      etape: "reste",
    });

    assert.equal(rendu.erreur, null);
    assert.deepEqual(
      {
        unites: rendu.donnees.unites,
        reste: rendu.donnees.reste,
        resteFusionneEnDemi: rendu.donnees.resteFusionneEnDemi,
      },
      { unites: 1, reste: 2, resteFusionneEnDemi: true },
    );
    assert.equal(occurrences(rendu.svg, /class="unite-retournee"/g), 1);
    assert.equal(occurrences(rendu.svg, /class="reste-fusionne-en-demi"/g), 1);
    assert.equal(occurrences(rendu.svg, /class="ecriture-reste-demi"/g), 1);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 0);
    assert.match(
      rendu.svg,
      new RegExp(`class="demi-historique"[^>]*fill="${COULEURS_BANDES_FRACTIONS.d2}"`),
    );
    assert.equal(
      attributPremier(rendu.svg, "demi-historique", "width"),
      2 * rendu.donnees.largeurPartie,
    );
    assert.match(rendu.svg, /aria-label="Deux quarts regroupés forment un demi\."/);
    assert.match(rendu.texteAlternatif, /deux quarts restants sont regroupés en une demi-bande/i);
    assert.ok(!rendu.svg.includes("1,5"));
    assert.ok(!rendu.texteAlternatif.includes("1,5"));
  });

  it("garde l'étape reste valide sans fusion quand le reste n'est pas deux quarts", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "aide-nc03",
      etape: "reste",
    });

    assert.equal(rendu.erreur, null);
    assert.equal(rendu.donnees.reste, 3);
    assert.equal(rendu.donnees.resteFusionneEnDemi, false);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 3);
    assert.equal(occurrences(rendu.svg, /class="reste-fusionne-en-demi"/g), 0);
  });

  it("groupe sept quarts face visible, mais masque le numérateur en aide NC04", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "aide-nc04-imposee",
      etape: "groupes",
    });

    assert.deepEqual(
      {
        unites: rendu.donnees.unites,
        reste: rendu.donnees.reste,
        maximumRail: rendu.donnees.maximumRail,
      },
      { unites: 1, reste: 3, maximumRail: 2 },
    );
    assert.equal(occurrences(rendu.svg, /class="separation-interne"/g), 3);
    assert.equal(occurrences(rendu.svg, /class="frontiere-unite"/g), 1);
    assert.equal(occurrences(rendu.svg, /class="joint-piece"/g), 2);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 7);
    assert.match(rendu.svg, /stroke="rgba\(0,0,0,\.22\)"[^>]*stroke-dasharray="4 4"/);
    assert.match(rendu.svg, /class="source-decimale"[^>]*>1,75<\/text>/);
    assert.match(rendu.svg, /class="cible-fractionnaire-masquee"/);
    assert.ok(!rendu.svg.includes('class="source-fraction"'));
    assert.ok(!rendu.svg.includes(">7</text>"));
    assert.ok(!rendu.texteAlternatif.includes("numérateur 7"));
    assert.ok(!rendu.texteAlternatif.includes("sept quarts"));
  });

  it("étend les quarts jusqu'à 12/4 sur un rail de trois unités", () => {
    for (const [numerateur, decimal] of [
      [9, "2,25"],
      [10, "2,5"],
      [11, "2,75"],
      [12, "3"],
    ]) {
      const rendu = dessinerBandesFractionnairesSurRailDecimal({
        numerateur,
        denominateur: 4,
        profil: "solution",
        etape: "lecture",
        largeur: 340,
      });

      assert.equal(rendu.erreur, null);
      assert.equal(rendu.donnees.maximumRail, 3);
      assert.equal(rendu.donnees.positionCible <= rendu.donnees.positionFinRail, true);
      assert.ok(rendu.donnees.positionPointeFleche <= rendu.largeur);
      assert.match(rendu.svg, new RegExp(`class="resultat-decimal"[^>]*>${decimal}<\\/text>`));
    }
  });

  it("déroule 10/4 de dix pièces à deux unités puis un demi", () => {
    const pieces = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 10,
      denominateur: 4,
      profil: "solution",
      etape: "pieces",
      largeur: 340,
    });
    const groupes = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 10,
      denominateur: 4,
      profil: "solution",
      etape: "groupes",
      largeur: 340,
    });
    const unites = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 10,
      denominateur: 4,
      profil: "solution",
      etape: "unites",
      largeur: 340,
    });
    const reste = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 10,
      denominateur: 4,
      profil: "solution",
      etape: "reste",
      largeur: 340,
    });

    assert.equal(occurrences(pieces.svg, /class="ecriture-part"/g), 10);
    assert.equal(occurrences(pieces.svg, /class="joint-piece"/g), 9);
    assert.equal(occurrences(groupes.svg, /class="separation-interne"/g), 6);
    assert.equal(occurrences(groupes.svg, /class="frontiere-unite"/g), 2);
    assert.equal(occurrences(unites.svg, /class="unite-retournee"/g), 2);
    assert.equal(occurrences(unites.svg, /class="ecriture-part"/g), 2);
    assert.equal(unites.donnees.resteFusionneEnDemi, false);
    assert.equal(occurrences(reste.svg, /class="unite-retournee"/g), 2);
    assert.equal(occurrences(reste.svg, /class="reste-fusionne-en-demi"/g), 1);
    assert.equal(occurrences(reste.svg, /class="ecriture-reste-demi"/g), 1);
    assert.equal(occurrences(reste.svg, /class="ecriture-part"/g), 0);
    assert.equal(reste.donnees.resteFusionneEnDemi, true);
    assert.equal(
      attributPremier(reste.svg, "demi-historique", "width"),
      2 * reste.donnees.largeurPartie,
    );
  });

  it("rend 12/4 comme trois unités exactes, sans reste artificiel", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 12,
      denominateur: 4,
      profil: "solution",
      etape: "reste",
      largeur: 340,
    });

    assert.deepEqual(
      {
        unites: rendu.donnees.unites,
        reste: rendu.donnees.reste,
        maximumRail: rendu.donnees.maximumRail,
        resteFusionneEnDemi: rendu.donnees.resteFusionneEnDemi,
      },
      { unites: 3, reste: 0, maximumRail: 3, resteFusionneEnDemi: false },
    );
    assert.equal(occurrences(rendu.svg, /class="unite-retournee"/g), 3);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 0);
    assert.equal(occurrences(rendu.svg, /class="reste-fusionne-en-demi"/g), 0);
    assert.equal(rendu.donnees.positionCible, rendu.donnees.positionFinRail);
    assert.match(rendu.svg, /class="resultat-decimal"[^>]*>3<\/text>/);
  });
});

describe("bandes fractionnaires sur rail — géométrie historique", () => {
  it("dessine les joints pleins une seule fois quand les pièces restent indépendantes", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 3,
      denominateur: 4,
      profil: "aide-nc03",
      etape: "pieces",
    });

    assert.equal(occurrences(rendu.svg, /class="fond-bandes"/g), 1);
    assert.equal(occurrences(rendu.svg, /class="contour-bandes"/g), 1);
    assert.equal(occurrences(rendu.svg, /class="joint-piece"/g), 2);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 3);
    assert.equal(occurrences(rendu.svg, /class="separation-interne"/g), 0);
  });

  it("distingue les pointillés internes des frontières d'unités pour cinq demis", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 2,
      profil: "aide-nc03",
      etape: "groupes",
    });

    assert.equal(occurrences(rendu.svg, /class="separation-interne"/g), 2);
    assert.equal(occurrences(rendu.svg, /class="frontiere-unite"/g), 2);
    assert.equal(occurrences(rendu.svg, /class="joint-piece"/g), 0);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 5);
  });

  it("emploie la même abscisse pour le bord des bandes et le guide du rail", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 2,
      profil: "solution",
      etape: "lecture",
      largeur: 720,
    });

    const origine = attributPremier(rendu.svg, "contour-bandes", "x");
    const largeurBandes = attributPremier(rendu.svg, "contour-bandes", "width");
    const cible = attributPremier(rendu.svg, "guide-cible", "x1");
    assert.equal(cible, Number((origine + largeurBandes).toFixed(2)));
    assert.equal(cible, rendu.donnees.positionCible);
  });

  it("conserve les deux guides, la graduation finale et décale la flèche", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "solution",
      etape: "lecture",
      largeur: 260,
    });

    assert.equal(
      attributPremier(rendu.svg, "guide-origine", "x1"),
      rendu.donnees.origineRail,
    );
    assert.equal(
      attributPremier(rendu.svg, "guide-cible", "x1"),
      rendu.donnees.positionCible,
    );
    assert.doesNotMatch(rendu.svg, /class="point-cible"/);
    assert.match(
      rendu.svg,
      new RegExp(
        `class="graduation graduation-entier" x1="${rendu.donnees.positionFinRail}"`,
      ),
    );
    assert.equal(
      rendu.donnees.positionDebutFleche - rendu.donnees.positionFinRail,
      8,
    );
    assert.equal(
      rendu.donnees.positionPointeFleche - rendu.donnees.positionDebutFleche,
      12,
    );
    assert.ok(rendu.donnees.positionPointeFleche <= rendu.largeur);
  });

  it("compose l'équation avec la fraction canonique et des espacements compacts", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 2,
      profil: "solution",
      etape: "pieces",
      largeur: 260,
    });

    const x1Barre = attributPremier(rendu.svg, "source-fraction-barre", "x1");
    const x2Barre = attributPremier(rendu.svg, "source-fraction-barre", "x2");
    const xEgal = attributPremier(rendu.svg, "signe-egal", "x");
    const xResultat = attributPremier(rendu.svg, "resultat-decimal", "x");
    assert.equal(occurrences(rendu.svg, /class="source-fraction-numerateur"/g), 1);
    assert.equal(occurrences(rendu.svg, /class="source-fraction-denominateur"/g), 1);
    assert.ok(xEgal - x2Barre <= 24);
    assert.ok(xResultat - xEgal <= 40);
    assert.ok(x1Barre >= 0);
    assert.ok(xResultat <= rendu.largeur);
  });

  it("réduit les inscriptions canoniques pour quarts étroits sans les déformer", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 6,
      denominateur: 4,
      profil: "solution",
      etape: "pieces",
      largeur: 260,
    });

    const x1Barre = attributPremier(rendu.svg, "ecriture-part-barre", "x1");
    const x2Barre = attributPremier(rendu.svg, "ecriture-part-barre", "x2");
    assert.equal(occurrences(rendu.svg, /class="ecriture-part-barre"/g), 6);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part-numerateur"/g), 6);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part-denominateur"/g), 6);
    assert.ok(x2Barre - x1Barre <= rendu.donnees.largeurPartie * 0.75);
  });

  it("reste lisible sur 340 px sans changer les proportions", () => {
    const bureau = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "solution",
      etape: "lecture",
      largeur: 720,
    });
    const mobile = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "solution",
      etape: "lecture",
      largeur: 340,
    });

    assert.equal(mobile.largeur, 340);
    assert.match(mobile.svg, /viewBox="0 0 340 232"/);
    assert.ok(mobile.donnees.largeurPartie >= 34);
    assert.equal(
      bureau.donnees.distanceCible / bureau.donnees.largeurUnite,
      mobile.donnees.distanceCible / mobile.donnees.largeurUnite,
    );
  });

  it("garde les pièces de P6 fines tout en rendant leurs textes lisibles sur mobile", () => {
    const largeurAffichee = 234;
    const echelleMobile = largeurAffichee / 260;
    const echelleHistorique = largeurAffichee / 720;

    for (const { numerateur, denominateur, etape } of [
      { numerateur: 7, denominateur: 2, etape: "pieces" },
      { numerateur: 6, denominateur: 4, etape: "reste" },
      { numerateur: 5, denominateur: 1, etape: "pieces" },
    ]) {
      const bureau = dessinerBandesFractionnairesSurRailDecimal({
        numerateur,
        denominateur,
        profil: "solution",
        etape,
        largeur: 720,
      });
      const mobile = dessinerBandesFractionnairesSurRailDecimal({
        numerateur,
        denominateur,
        profil: "solution",
        etape,
        largeur: 260,
        format: "mobile-compact",
      });
      const mobileStandard = dessinerBandesFractionnairesSurRailDecimal({
        numerateur,
        denominateur,
        profil: "solution",
        etape,
        largeur: 260,
      });

      assert.equal(mobile.erreur, null);
      assert.equal(mobile.hauteur, 154);
      assert.equal(mobile.donnees.format, "mobile-compact");
      assert.equal(mobile.donnees.hauteurBande, 34);
      assert.match(mobile.svg, /viewBox="0 0 260 154"/);
      assert.equal(mobileStandard.hauteur, 232);
      assert.equal(mobileStandard.donnees.hauteurBande, 52);

      const classePartie = denominateur === 1
        ? "ecriture-part"
        : etape === "reste"
          ? "ecriture-reste-demi-numerateur"
          : "ecriture-part-numerateur";
      const taillePartie = attributPremier(mobile.svg, classePartie, "font-size");
      const tailleRail = attributPremier(mobile.svg, "etiquette-rail", "font-size");
      assert.ok(taillePartie * echelleMobile >= 11);
      assert.ok(tailleRail * echelleMobile >= 11);
      assert.ok(mobile.donnees.hauteurBande * echelleMobile <= 31);
      assert.ok(mobile.hauteur * echelleMobile < mobileStandard.hauteur * echelleMobile);

      const partieHistoriqueAffichee = bureau.donnees.largeurPartie * echelleHistorique;
      const partieMobileAffichee = mobile.donnees.largeurPartie * echelleMobile;
      assert.ok(Math.abs(partieMobileAffichee - partieHistoriqueAffichee) <= 3);
      assert.equal(
        bureau.donnees.distanceCible / bureau.donnees.largeurUnite,
        mobile.donnees.distanceCible / mobile.donnees.largeurUnite,
      );
    }
  });

  it("conserve ses proportions dans la variante étroite de 260 px", () => {
    const mobileEtroit = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 1,
      profil: "solution",
      etape: "pieces",
      largeur: 260,
    });

    assert.equal(mobileEtroit.erreur, null);
    assert.equal(mobileEtroit.largeur, 260);
    assert.match(mobileEtroit.svg, /viewBox="0 0 260 232"/);
    assert.ok(mobileEtroit.donnees.largeurPartie >= 39);
    assert.equal(
      attributPremier(mobileEtroit.svg, "guide-cible", "x1"),
      mobileEtroit.donnees.positionCible,
    );
  });

  it("allège seulement les étiquettes d’un rail mobile multi-unité", () => {
    const quarts = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 6,
      denominateur: 4,
      profil: "solution",
      etape: "reste",
      largeur: 260,
    });
    const demis = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 2,
      profil: "solution",
      etape: "pieces",
      largeur: 260,
    });

    assert.match(quarts.svg, /class="etiquette-rail"[^>]*>0,5<\/text>/);
    assert.match(quarts.svg, /class="etiquette-rail cible"[^>]*>1,5<\/text>/);
    assert.ok(!quarts.svg.includes(">0,25</text>"));
    assert.ok(!quarts.svg.includes(">0,75</text>"));
    assert.match(demis.svg, /class="etiquette-rail cible"[^>]*>2,5<\/text>/);
    assert.match(demis.svg, /class="etiquette-rail"[^>]*>1,5<\/text>/);
    assert.ok(!demis.svg.includes(">0,5</text>"));
  });

  it("écarte les cibles 9/4 et 11/4 des entiers sur un rail mobile compact", () => {
    for (const format of [
      { largeur: 260, format: "mobile-compact" },
      { largeur: 340, format: "standard" },
    ]) {
      const neufQuarts = dessinerBandesFractionnairesSurRailDecimal({
        numerateur: 9,
        denominateur: 4,
        profil: "solution",
        etape: "lecture",
        ...format,
      });
      const onzeQuarts = dessinerBandesFractionnairesSurRailDecimal({
        numerateur: 11,
        denominateur: 4,
        profil: "solution",
        etape: "lecture",
        ...format,
      });

      for (const rendu of [neufQuarts, onzeQuarts]) {
        assert.equal(
          occurrences(rendu.svg, /class="etiquette-rail(?: cible)?"/g),
          5,
        );
        assert.doesNotMatch(rendu.svg, /class="etiquette-rail(?: cible)?"[^>]*>0,5<\/text>/);
        assert.doesNotMatch(rendu.svg, /class="etiquette-rail(?: cible)?"[^>]*>1,5<\/text>/);
        assert.doesNotMatch(rendu.svg, /class="etiquette-rail(?: cible)?"[^>]*>2,5<\/text>/);
      }
      assert.match(
        neufQuarts.svg,
        /class="etiquette-rail"[^>]*text-anchor="end"[^>]*>2<\/text>/,
      );
      assert.match(
        neufQuarts.svg,
        /class="etiquette-rail cible"[^>]*text-anchor="start"[^>]*>2,25<\/text>/,
      );
      assert.match(
        onzeQuarts.svg,
        /class="etiquette-rail cible"[^>]*text-anchor="end"[^>]*>2,75<\/text>/,
      );
      assert.match(
        onzeQuarts.svg,
        /class="etiquette-rail"[^>]*text-anchor="start"[^>]*>3<\/text>/,
      );
    }
  });

  it("applique le même dégagement aux cibles décimales visibles en aide NC04", () => {
    const neufQuarts = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 9,
      denominateur: 4,
      profil: "aide-nc04-imposee",
      etape: "pieces",
      largeur: 260,
      format: "mobile-compact",
    });
    const onzeQuarts = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 11,
      denominateur: 4,
      profil: "aide-nc04-imposee",
      etape: "pieces",
      largeur: 260,
      format: "mobile-compact",
    });

    assert.match(
      neufQuarts.svg,
      /class="etiquette-cible source-decimale"[^>]*text-anchor="start"[^>]*>2,25<\/text>/,
    );
    assert.match(
      onzeQuarts.svg,
      /class="etiquette-cible source-decimale"[^>]*text-anchor="end"[^>]*>2,75<\/text>/,
    );
  });

  it("conserve le recto coloré quand les unités sont formées", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 2,
      profil: "solution",
      etape: "unites",
    });

    assert.match(rendu.svg, new RegExp(`fill="${COULEURS_BANDES_FRACTIONS.d2}"`));
    assert.ok(!rendu.svg.includes(COULEURS_BANDES_FRACTIONS.unite));
    assert.equal(occurrences(rendu.svg, /class="unite-retournee"/g), 2);
  });
});

describe("bandes fractionnaires sur rail — contrats de masquage", () => {
  it("nomme une unité sans lever les masques des deux profils d'aide", () => {
    const aideNc03 = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 1,
      denominateur: 1,
      profil: "aide-nc03",
      etape: "lecture",
    });
    const aideNc04 = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 1,
      profil: "aide-nc04-imposee",
      etape: "pieces",
    });

    assert.match(aideNc03.texteAlternatif, /avec une unité/);
    assert.match(aideNc03.svg, /class="cible-decimale-masquee"[^>]*>\?<\/text>/);
    assert.ok(!aideNc03.svg.includes('class="resultat-decimal"'));
    assert.match(aideNc04.texteAlternatif, /chacune une unité/);
    assert.equal(aideNc04.donnees.partiesPosees, 0);
    assert.match(aideNc04.svg, /class="cible-fractionnaire-masquee"/);
    assert.ok(!aideNc04.svg.includes('class="source-fraction"'));
  });

  it("ne place aucune réserve de pièces dans l'état initial NC04", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "aide-nc04-imposee",
      etape: "pieces",
    });

    assert.equal(rendu.donnees.partiesPosees, 0);
    assert.ok(!rendu.svg.includes('class="fond-bandes"'));
    assert.ok(!rendu.svg.includes('class="ecriture-part"'));
    assert.match(rendu.svg, /class="rail-decimal"/);
    assert.match(rendu.svg, /class="source-decimale"[^>]*>1,75<\/text>/);
  });

  it("permet de poser seulement les pièces manipulées en NC04", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "aide-nc04-imposee",
      etape: "pieces",
      partiesPosees: 3,
    });

    assert.equal(rendu.donnees.partiesPosees, 3);
    assert.equal(occurrences(rendu.svg, /class="ecriture-part"/g), 3);
    assert.equal(occurrences(rendu.svg, /class="joint-piece"/g), 2);
  });

  it("masque les deux termes de la fraction libre", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 2,
      profil: "aide-nc04-libre",
      etape: "pieces",
    });
    const cible = blocDeClasse(rendu.svg, "cible-fractionnaire-masquee");

    assert.ok(cible);
    assert.equal(occurrences(cible, />\?<\/text>/g), 2);
    assert.ok(!rendu.svg.includes('class="source-fraction"'));
  });

  it("ne lève jamais le masque NC03 à l'étape lecture", () => {
    const aide = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 2,
      profil: "aide-nc03",
      etape: "lecture",
    });
    const solution = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 5,
      denominateur: 2,
      profil: "solution",
      etape: "lecture",
    });

    assert.ok(!aide.svg.includes("2,5"));
    assert.ok(!aide.texteAlternatif.includes("2,5"));
    assert.match(solution.svg, /class="resultat-decimal"[^>]*>2,5<\/text>/);
    assert.match(solution.texteAlternatif, /vaut 2,5/);
  });

  it("conserve les masques des profils d'aide sur les nouveaux quarts", () => {
    const aideNc03 = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 11,
      denominateur: 4,
      profil: "aide-nc03",
      etape: "lecture",
      largeur: 260,
      format: "mobile-compact",
    });
    const aideNc04Imposee = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 9,
      denominateur: 4,
      profil: "aide-nc04-imposee",
      etape: "pieces",
      largeur: 260,
      format: "mobile-compact",
    });
    const aideNc04Libre = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 11,
      denominateur: 4,
      profil: "aide-nc04-libre",
      etape: "pieces",
      largeur: 260,
      format: "mobile-compact",
    });

    assert.ok(!aideNc03.svg.includes("2,75"));
    assert.ok(!aideNc03.texteAlternatif.includes("2,75"));
    assert.match(aideNc03.svg, /class="etiquette-cible cible-decimale-masquee"[^>]*>\?<\/text>/);

    for (const [aide, decimal, numerateur] of [
      [aideNc04Imposee, "2,25", "9"],
      [aideNc04Libre, "2,75", "11"],
    ]) {
      assert.match(aide.svg, new RegExp(`class="source-decimale"[^>]*>${decimal}<\\/text>`));
      assert.match(aide.svg, /class="cible-fractionnaire-masquee"/);
      assert.ok(!aide.svg.includes('class="source-fraction"'));
      assert.ok(!aide.svg.includes(`>${numerateur}</text>`));
      assert.ok(!aide.texteAlternatif.includes(`numérateur ${numerateur}`));
    }
  });

  it("ne confond jamais une fraction dessinée avec un texte contenant une barre oblique", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "solution",
      etape: "lecture",
    });
    const source = blocDeClasse(rendu.svg, "source-fraction");

    assert.ok(source);
    assert.equal(occurrences(source, /<text /g), 2);
    assert.equal(occurrences(source, /<line /g), 1);
    assert.ok(!rendu.svg.includes("7/4"));
    assert.ok(!rendu.svg.includes("&#47;"));
  });
});

describe("bandes fractionnaires sur rail — validation et stabilité", () => {
  it("couvre tous les profils et toutes les étapes pour les quarts 9 à 12", () => {
    for (const numerateur of [9, 10, 11, 12]) {
      for (const profil of [
        "aide-nc03",
        "aide-nc04-imposee",
        "aide-nc04-libre",
        "solution",
      ]) {
        for (const etape of ["pieces", "groupes", "unites", "reste", "lecture"]) {
          const rendu = dessinerBandesFractionnairesSurRailDecimal({
            numerateur,
            denominateur: 4,
            profil,
            etape,
            largeur: 260,
            format: "mobile-compact",
            ...(profil.startsWith("aide-nc04") && etape !== "pieces"
              ? { partiesPosees: numerateur }
              : {}),
          });

          assert.equal(rendu.erreur, null, `${numerateur}/4, ${profil}, ${etape}`);
          assert.equal(rendu.donnees.maximumRail, 3);
          assert.ok(!rendu.svg.includes("NaN"));
          assert.ok(rendu.donnees.positionPointeFleche <= rendu.largeur);
        }
      }
    }
  });

  it("rejette les dénominateurs et numérateurs hors du domaine du pilote", () => {
    const mauvaisDenominateur = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 3,
      denominateur: 10,
      profil: "solution",
    });
    const mauvaisNumerateur = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 8,
      denominateur: 2,
      profil: "solution",
    });
    const tropDUnites = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 13,
      denominateur: 1,
      profil: "solution",
    });
    const tropDeQuarts = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 13,
      denominateur: 4,
      profil: "solution",
    });
    const mauvaisFormat = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 2,
      profil: "solution",
      format: "miniature",
    });

    assert.match(mauvaisDenominateur.erreur, /dénominateur doit être 1, 2 ou 4/);
    assert.equal(mauvaisDenominateur.donnees, null);
    assert.match(mauvaisNumerateur.erreur, /compris entre 0 et 7/);
    assert.match(tropDUnites.erreur, /compris entre 0 et 12/);
    assert.match(tropDeQuarts.erreur, /compris entre 0 et 12/);
    assert.match(mauvaisFormat.erreur, /format doit être/);
  });

  it("exige explicitement le profil afin de ne jamais révéler une réponse par défaut", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 3,
      denominateur: 4,
    });

    assert.match(rendu.erreur, /profil doit être/);
    assert.ok(!rendu.svg.includes("0,75"));
  });

  it("interdit une étape de groupement incomplète", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 7,
      denominateur: 4,
      profil: "aide-nc04-imposee",
      etape: "groupes",
      partiesPosees: 3,
    });

    assert.match(rendu.erreur, /demandent que toutes les parties soient posées/);
  });

  it("produit un SVG déterministe sans modifier les réglages", () => {
    const reglages = Object.freeze({
      numerateur: 7,
      denominateur: 4,
      profil: "solution",
      etape: "lecture",
      largeur: 720,
    });
    const premier = dessinerBandesFractionnairesSurRailDecimal(reglages);
    const second = dessinerBandesFractionnairesSurRailDecimal(reglages);

    assert.equal(premier.svg, second.svg);
    assert.deepEqual(reglages, {
      numerateur: 7,
      denominateur: 4,
      profil: "solution",
      etape: "lecture",
      largeur: 720,
    });
    assert.ok(Object.isFrozen(premier));
    assert.ok(Object.isFrozen(premier.donnees));
  });

  it("est exporté par le paquet et déclare son origine", () => {
    const paquet = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );
    assert.equal(
      paquet.exports["./bandes-fractions-rail"],
      "./src/bandes-fractions-rail.js",
    );
    assert.equal(
      PROVENANCE_OBJETS["bandes-fractions-rail.js"].statut,
      "original_mathsgo",
    );
  });
});
