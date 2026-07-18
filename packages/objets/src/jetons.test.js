import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COULEURS } from "../../charte/src/charte.js";
import {
  CONTENUS_JETON,
  ETATS_JETON,
  dessinerGroupeJetons,
  dessinerJeton,
} from "./jetons.js";

const compter = (svg, motif) => (svg.match(motif) || []).length;

describe("dessinerJeton", () => {
  it("produit un SVG autonome et déterministe", () => {
    const a = dessinerJeton({ valeur: 1 });
    const b = dessinerJeton({ valeur: 1 });
    assert.equal(a, b);
    assert.ok(a.startsWith("<svg") && a.endsWith("</svg>"));
    assert.match(a, /viewBox="0 0 100 100"/);
  });

  it("habillage contourNoir (défaut) : aplats des fiches, contour et texte noirs", () => {
    const positif = dessinerJeton({ valeur: 1 });
    assert.ok(positif.includes(COULEURS.jetonAplatPositif));
    assert.match(positif, new RegExp(`stroke="${COULEURS.jetonContour}"`));
    assert.match(positif, new RegExp(`fill="${COULEURS.jetonContour}"[^>]*>\\+1<`));
    assert.ok(dessinerJeton({ valeur: -1 }).includes(COULEURS.jetonAplatNegatif));
    const neutralise = dessinerJeton({ valeur: 1, etat: "neutralise" });
    assert.ok(neutralise.includes(COULEURS.jetonNeutralise));
    assert.ok(!neutralise.includes(COULEURS.jetonAplatPositif));
  });

  it("habillage contourAssorti : aplats des fiches, contour foncé assorti, texte noir", () => {
    const positif = dessinerJeton({ valeur: 1, habillage: "contourAssorti" });
    assert.ok(positif.includes(COULEURS.jetonAplatPositif));
    assert.match(positif, new RegExp(`stroke="${COULEURS.jetonPositifBord}"`));
    assert.ok(!positif.includes(`stroke="${COULEURS.jetonContour}"`));
    assert.match(positif, new RegExp(`fill="${COULEURS.jetonContour}"[^>]*>\\+1<`));
    const negatif = dessinerJeton({ valeur: -1, habillage: "contourAssorti" });
    assert.ok(negatif.includes(COULEURS.jetonAplatNegatif));
    assert.match(negatif, new RegExp(`stroke="${COULEURS.jetonNegatifBord}"`));
    const neutralise = dessinerJeton({ valeur: 1, etat: "neutralise", habillage: "contourAssorti" });
    assert.ok(neutralise.includes(COULEURS.jetonNeutralise));
    assert.ok(neutralise.includes(COULEURS.jetonNeutraliseBord));
  });

  it("habillage plateau : dégradé et texte blanc des plateaux de manipulation", () => {
    const positif = dessinerJeton({ valeur: 1, habillage: "plateau" });
    assert.ok(positif.includes(COULEURS.jetonPositif));
    assert.match(positif, /fill="#ffffff"[^>]*>\+1</);
    assert.ok(dessinerJeton({ valeur: -1, habillage: "plateau" }).includes(COULEURS.jetonNegatif));
    assert.throws(() => dessinerJeton({ valeur: 1, habillage: "chrome" }), RangeError);
  });

  it("n'utilise que des couleurs de la charte (plus le blanc)", () => {
    const autorisees = new Set([...Object.values(COULEURS), "#ffffff"]);
    for (const etat of ETATS_JETON) {
      const svg = dessinerJeton({ valeur: -1, etat });
      for (const couleur of svg.match(/#[0-9a-f]{6}/g) || []) {
        assert.ok(autorisees.has(couleur), `couleur hors charte : ${couleur} (état ${etat})`);
      }
    }
  });

  it("gère les trois contenus : signe, valeur, aucun", () => {
    assert.match(dessinerJeton({ valeur: 1, contenu: "signe" }), />\+</);
    assert.match(dessinerJeton({ valeur: -1, contenu: "valeur" }), />−1</);
    assert.ok(!dessinerJeton({ valeur: 1, contenu: "aucun" }).includes("<text"));
  });

  it("distingue visuellement les quatre états", () => {
    const rendus = ETATS_JETON.map((etat) => dessinerJeton({ valeur: 1, etat }));
    assert.equal(new Set(rendus).size, ETATS_JETON.length);
    assert.match(rendus[ETATS_JETON.indexOf("barre")], /<line/);
    assert.match(rendus[ETATS_JETON.indexOf("fantome")], /opacity="0\.35"/);
  });

  it("annonce son sens aux lecteurs d'écran", () => {
    assert.match(dessinerJeton({ valeur: -1 }), /aria-label="jeton moins un"/);
    assert.match(
      dessinerJeton({ valeur: 1, etat: "neutralise" }),
      /aria-label="jeton plus un \(neutralise\)"/,
    );
  });

  it("rejette les paramètres invalides", () => {
    assert.throws(() => dessinerJeton({ valeur: 2 }), RangeError);
    assert.throws(() => dessinerJeton({ valeur: 1, etat: "cassé" }), RangeError);
    assert.throws(() => dessinerJeton({ valeur: 1, contenu: "photo" }), RangeError);
  });

  it("produit un balisage équilibré", () => {
    for (const contenu of CONTENUS_JETON) {
      const svg = dessinerJeton({ valeur: 1, contenu, etat: "barre" });
      assert.equal(compter(svg, /<svg/g), compter(svg, /<\/svg>/g));
      assert.equal(compter(svg, /<text/g), compter(svg, /<\/text>/g));
      assert.equal(
        compter(svg, /<(circle|ellipse|line)\b/g),
        compter(svg, /(circle|ellipse|line)[^<]*\/>/g),
      );
    }
  });
});

describe("dessinerGroupeJetons", () => {
  it("grille régulière : 7 jetons sur 2 rangées de 5", () => {
    const svg = dessinerGroupeJetons({ positifs: 4, negatifs: 3, parRangee: 5 });
    assert.equal((svg.match(/<g transform/g) || []).length, 7);
    assert.match(svg, /viewBox="0 0 556 214"/); // 5×114−14 sur 2×114−14
  });

  it("neutralise autant de positifs que de négatifs", () => {
    // 2 paires = 4 jetons gris ; en habillage contourNoir la couleur
    // neutralisée n'apparaît qu'une fois par jeton (l'aplat)
    const svg = dessinerGroupeJetons({ positifs: 3, negatifs: 2, pairesNeutralisees: 2 });
    assert.equal(compter(svg, new RegExp(COULEURS.jetonNeutralise, "g")), 4);
    // et 2 fois par jeton (fond + voile) en habillage plateau
    const plateau = dessinerGroupeJetons({ positifs: 3, negatifs: 2, pairesNeutralisees: 2, habillage: "plateau" });
    assert.equal(compter(plateau, new RegExp(COULEURS.jetonNeutralise, "g")), 8);
  });

  it("décrit le groupe aux lecteurs d'écran", () => {
    assert.match(
      dessinerGroupeJetons({ positifs: 2, negatifs: 5, pairesNeutralisees: 1 }),
      /aria-label="2 jeton\(s\) plus un et 5 jeton\(s\) moins un, 1 paire\(s\) neutralisée\(s\)"/,
    );
  });

  it("rejette les demandes impossibles", () => {
    assert.throws(() => dessinerGroupeJetons({ positifs: -1 }), RangeError);
    assert.throws(
      () => dessinerGroupeJetons({ positifs: 2, negatifs: 1, pairesNeutralisees: 2 }),
      RangeError,
    );
  });

  it("reste déterministe", () => {
    const params = { positifs: 5, negatifs: 3, pairesNeutralisees: 3, contenu: "valeur" };
    assert.equal(dessinerGroupeJetons(params), dessinerGroupeJetons(params));
  });
});
