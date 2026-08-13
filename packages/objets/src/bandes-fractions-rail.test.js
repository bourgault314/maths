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
  it("aligne exactement un demi sur 0,5", () => {
    const rendu = dessinerBandesFractionnairesSurRailDecimal({
      numerateur: 1,
      denominateur: 2,
      profil: "solution",
      etape: "lecture",
    });

    assert.equal(VERSION_BANDES_FRACTIONS_RAIL, 2);
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

  it("emploie la même abscisse pour le bord des bandes et le point du rail", () => {
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

    assert.match(mauvaisDenominateur.erreur, /dénominateur doit être 2 ou 4/);
    assert.equal(mauvaisDenominateur.donnees, null);
    assert.match(mauvaisNumerateur.erreur, /compris entre 0 et 7/);
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
