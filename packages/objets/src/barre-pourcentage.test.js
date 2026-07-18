import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";
import { COULEURS_POURCENTAGES, couleurFamillePourcentage } from "../../charte/src/charte.js";
import { TYPES_POURCENTAGES, creerQuestion } from "./pourcentages.js";
import {
  GABARITS_REFERENCE_POURCENTAGE,
  HAUTEURS_GABARITS,
  PREREGLAGES_BARRE_POURCENTAGE,
  VERSION_BARRE_POURCENTAGE,
  dessinerBarrePourcentage,
  gabaritDeQuestion,
} from "./barre-pourcentage.js";

const Q50 = { mode: "direct", percent: 50, parts: 2, activeParts: 1, totalVal: 84, calcVal: 42 };
const Q25 = { mode: "direct", percent: 25, parts: 4, activeParts: 1, totalVal: 60, calcVal: 15 };
const Q5 = { mode: "direct", percent: 5, parts: 20, activeParts: 1, totalVal: 180, calcVal: 9 };
const Q1 = { mode: "direct", percent: 1, parts: 100, activeParts: 1, totalVal: 300, calcVal: 3 };
const QINV = { mode: "find_percent", percent: 20, parts: 5, activeParts: 1, totalVal: 60, calcVal: 12 };
const QTOT = { mode: "find_total", percent: 30, parts: 10, activeParts: 3, totalVal: 90, calcVal: 27 };
const QINC = { mode: "evo_inc", percent: 20, parts: 5, activeParts: 1, totalVal: 150, calcVal: 180 };
const QDEC = { mode: "evo_dec", percent: 25, parts: 4, activeParts: 1, totalVal: 80, calcVal: 60 };

function viewBoxDe(svg) {
  return svg.match(/viewBox="([^"]+)"/)[1];
}

describe("gabaritDeQuestion", () => {
  it("choisit le gabarit comme l'exerciceur", () => {
    assert.equal(gabaritDeQuestion(Q50), "simple");
    assert.equal(gabaritDeQuestion(Q25), "chemin");
    assert.equal(gabaritDeQuestion(Q5), "chemin");
    assert.equal(gabaritDeQuestion(Q1), "cent");
    assert.equal(gabaritDeQuestion(QINV), "simple");
    assert.equal(gabaritDeQuestion(QTOT), "simple");
    assert.equal(gabaritDeQuestion(QINC), "evolution");
    assert.equal(gabaritDeQuestion(QDEC), "evolution");
  });
  it("le chemin de calcul peut être débranché", () => {
    assert.equal(gabaritDeQuestion(Q25, { chemin: false }), "simple");
  });
});

describe("géométrie réservée — la règle d'or", () => {
  it("le viewBox est identique en énoncé et en correction, pour toutes les questions possibles", () => {
    const alea = creerGenerateur("geometrie");
    for (const type of Object.keys(TYPES_POURCENTAGES)) {
      for (let i = 0; i < 15; i++) {
        const q = creerQuestion(type, (i % 3) + 1, i % 2 === 1, alea);
        const enonce = dessinerBarrePourcentage(q, { correction: false });
        const correction = dessinerBarrePourcentage(q, { correction: true });
        assert.equal(
          viewBoxDe(enonce.svg),
          viewBoxDe(correction.svg),
          `${type} : le tableau ne doit jamais bouger entre énoncé et correction`,
        );
        assert.equal(enonce.gabarit, correction.gabarit);
        assert.equal(enonce.hauteur, HAUTEURS_GABARITS[enonce.gabarit]);
        assert.equal(enonce.largeur, 1000);
      }
    }
  });
});

describe("couleurs de famille", () => {
  it("chaque découpage est dessiné dans sa couleur officielle", () => {
    for (const [q, parts] of [
      [Q50, 2],
      [Q25, 4],
      [QINV, 5],
      [QTOT, 10],
      [Q5, 20],
      [Q1, 100],
    ]) {
      const { svg } = dessinerBarrePourcentage(q, { chemin: false });
      assert.ok(
        svg.includes(`fill="${couleurFamillePourcentage(parts)}"`),
        `parts=${parts} : couleur ${couleurFamillePourcentage(parts)} attendue`,
      );
    }
  });
  it("le chemin de calcul montre les DEUX familles (25 % sous 50 %)", () => {
    const { svg } = dessinerBarrePourcentage(Q25);
    assert.ok(svg.includes(`fill="${COULEURS_POURCENTAGES.c25}"`));
    assert.ok(svg.includes(`fill="${COULEURS_POURCENTAGES.c50}"`));
  });
});

describe("gabarit simple", () => {
  it("énoncé : le total est affiché, les parts restent muettes (pointillés)", () => {
    const { svg } = dessinerBarrePourcentage(Q50);
    assert.ok(svg.includes(">84<"));
    assert.ok(!svg.includes(">42<"));
    assert.ok(svg.includes('stroke-dasharray="4,4"'));
  });
  it("correction : la valeur d'une part apparaît dans les cases", () => {
    const { svg } = dessinerBarrePourcentage(Q50, { correction: true });
    assert.ok(svg.includes(">42<"));
  });
  it("chercher le tout : le total est masqué par un tiret en énoncé, révélé en correction", () => {
    const enonce = dessinerBarrePourcentage(QTOT).svg;
    assert.ok(!enonce.includes(">90<"), "le total ne doit pas être visible");
    assert.ok(enonce.includes('stroke-dasharray="5,5"'));
    assert.ok(enonce.includes(">27<"), "la valeur donnée est accolée sous les parts");
    const correction = dessinerBarrePourcentage(QTOT, { correction: true }).svg;
    assert.ok(correction.includes(">90<"));
  });
  it("chercher le pourcentage : toutes les cases sont atténuées en énoncé", () => {
    const enonce = dessinerBarrePourcentage(QINV).svg;
    const actives = (enonce.match(/fill-opacity="1"/g) || []).length;
    assert.equal(actives, 0, "aucune case pleine tant qu'on cherche le pourcentage");
    const correction = dessinerBarrePourcentage(QINV, { correction: true }).svg;
    assert.ok((correction.match(/fill-opacity="1"/g) || []).length >= 1);
  });
});

describe("gabarit chemin (l'empilement pédagogique)", () => {
  it("25 % : la barre de 50 % au-dessus, toutes cases inactives", () => {
    const { svg, gabarit, hauteur } = dessinerBarrePourcentage(Q25, { correction: true });
    assert.equal(gabarit, "chemin");
    assert.equal(hauteur, 520);
    assert.ok(svg.includes(">30<"), "la moitié (84→42 ici 60→30) guide le calcul");
    assert.ok(svg.includes(">15<"), "le quart est la réponse");
  });
  it("5 % : la barre de 10 % au-dessus", () => {
    const { svg } = dessinerBarrePourcentage(Q5, { correction: true });
    assert.ok(svg.includes(">18<"), "10 % de 180");
    assert.ok(svg.includes(">9<"), "5 % de 180");
  });
});

describe("gabarit cent", () => {
  it("100 cases, flèche « Une case = ... » muette puis révélée", () => {
    const enonce = dessinerBarrePourcentage(Q1).svg;
    // 100 cases + la barre du tout + le rect interne du motif de hachures.
    assert.equal((enonce.match(/<rect/g) || []).length, 102);
    assert.ok(enonce.includes("Une case = ..."));
    const correction = dessinerBarrePourcentage(Q1, { correction: true }).svg;
    assert.ok(correction.includes("Une case = 3"));
  });
  it("37 % : l'accolade des parts actives apparaît", () => {
    const q = { mode: "direct", percent: 37, parts: 100, activeParts: 37, totalVal: 500, calcVal: 185 };
    const correction = dessinerBarrePourcentage(q, { correction: true }).svg;
    assert.ok(correction.includes(">185<"));
  });
});

describe("gabarit évolution", () => {
  it("hausse : cases ajoutées fantômes en énoncé, pleines en correction, accolade « Nouveau total »", () => {
    const enonce = dessinerBarrePourcentage(QINC).svg;
    assert.ok(enonce.includes('fill-opacity="0.15"'));
    assert.ok(!enonce.includes("Nouveau total"));
    const correction = dessinerBarrePourcentage(QINC, { correction: true }).svg;
    assert.ok(correction.includes("Nouveau total = 180"));
  });
  it("baisse : la part retirée est hachurée en correction, accolade verte « Reste »", () => {
    const enonce = dessinerBarrePourcentage(QDEC).svg;
    assert.ok(!enonce.includes("bp-hachure)"), "pas de hachures avant la correction");
    const correction = dessinerBarrePourcentage(QDEC, { correction: true }).svg;
    assert.ok(correction.includes('fill="url(#bp-hachure)"'));
    assert.ok(correction.includes("Reste = 60"));
    assert.ok(correction.includes(COULEURS_POURCENTAGES.reste));
  });
  it("accolade « montant » : seule l'augmentation est accolée", () => {
    const q = { mode: "evo_inc", percent: 25, parts: 4, activeParts: 1, totalVal: 240, calcVal: 300 };
    const correction = dessinerBarrePourcentage(q, { correction: true, accolade: "montant" }).svg;
    assert.ok(correction.includes("Augmentation = 60"));
    assert.ok(!correction.includes("Nouveau total"));
  });
  it("coefficient : barre normalisée à 100 %, accolade en pourcentage dès l'énoncé", () => {
    const q = { mode: "evo_inc", percent: 20, parts: 5, activeParts: 1, totalVal: 1, calcVal: 1.2 };
    const enonce = dessinerBarrePourcentage(q, { normalise: true, accolade: "coefficient" }).svg;
    assert.ok(enonce.includes(">100 %<"));
    assert.ok(enonce.includes(">20 %<"));
    assert.ok(enonce.includes(">120 %<"));
  });
});

describe("téléphone — affichage compact", () => {
  it("au-delà de 13 cases, seule la première case porte sa valeur en correction", () => {
    const { svg } = dessinerBarrePourcentage(Q5, { correction: true, chemin: false });
    const occurrences = (svg.match(/>9</g) || []).length;
    assert.equal(occurrences, 1, "une seule étiquette de part pour 20 cases");
  });
  it("dix cases et moins : toutes les cases sont étiquetées", () => {
    const q = { mode: "direct", percent: 10, parts: 10, activeParts: 1, totalVal: 230, calcVal: 23 };
    const { svg } = dessinerBarrePourcentage(q, { correction: true });
    assert.equal((svg.match(/>23</g) || []).length, 10);
  });
});

describe("tailles réglables (zoom des cases)", () => {
  it("largeurTotale et hauteurBarre pilotent le viewBox, la réserve reste identique énoncé/correction", () => {
    for (const [largeurTotale, hauteurBarre] of [[400, 36], [800, 60], [1200, 90]]) {
      for (const q of [Q50, Q25, Q1, QINC]) {
        const enonce = dessinerBarrePourcentage(q, { largeurTotale, hauteurBarre });
        const correction = dessinerBarrePourcentage(q, { largeurTotale, hauteurBarre, correction: true });
        assert.equal(viewBoxDe(enonce.svg), viewBoxDe(correction.svg));
        assert.equal(enonce.largeur, largeurTotale + 200);
      }
    }
  });
  it("une barre plus haute donne un dessin plus haut, à gabarit égal", () => {
    const petite = dessinerBarrePourcentage(Q50, { hauteurBarre: 30 });
    const grande = dessinerBarrePourcentage(Q50, { hauteurBarre: 90 });
    assert.ok(grande.hauteur > petite.hauteur);
  });
  it("les tailles hors bornes sont ramenées dans les limites", () => {
    const rendu = dessinerBarrePourcentage(Q50, { largeurTotale: 50, hauteurBarre: 500 });
    assert.equal(rendu.largeur, 240 + 200);
    assert.equal(rendu.hauteur, 200 + 2 * 120);
  });
});

describe("étiquettes : valeurs, pourcentages (verso), vierge (recto)", () => {
  it("« pourcentages » : 100 % en haut, le pourcentage dans chaque case", () => {
    const { svg } = dessinerBarrePourcentage(Q50, { etiquettes: "pourcentages", chemin: false });
    assert.ok(svg.includes(">100 %<"));
    assert.ok(svg.includes(">50 %<"));
    assert.ok(!svg.includes(">84<"), "le gabarit de référence ne montre aucune valeur");
    assert.ok(!svg.includes('fill-opacity="0.4"'), "toutes les cases sont pleines");
  });
  it("« pourcentages » sur 100 cases : la flèche dit « Une case = 1 % »", () => {
    const { svg } = dessinerBarrePourcentage(Q1, { etiquettes: "pourcentages" });
    assert.ok(svg.includes("Une case = 1 %"));
  });
  it("« vierge » : aucune valeur, des pointillés partout", () => {
    const { svg } = dessinerBarrePourcentage(Q50, { etiquettes: "vierge", chemin: false });
    assert.ok(!/>[0-9]/.test(svg.replace(/<defs>.*<\/defs>/, "")), "aucun chiffre visible");
    assert.ok(svg.includes("stroke-dasharray"));
  });
  it("le gabarit vierge et le gabarit rempli gardent le même viewBox que la question", () => {
    for (const etiquettes of ["valeurs", "pourcentages", "vierge"]) {
      const rendu = dessinerBarrePourcentage(Q50, { etiquettes, chemin: false });
      assert.equal(viewBoxDe(rendu.svg), "0 0 1000 320");
    }
  });
  it("refuse des étiquettes inconnues", () => {
    assert.throws(() => dessinerBarrePourcentage(Q50, { etiquettes: "verso" }), RangeError);
  });
});

describe("réglage des accolades", () => {
  it("« actives » : l'accolade apparaît même pour une seule part (20 % de 45)", () => {
    const auto = dessinerBarrePourcentage(Q25, { correction: true, chemin: false }).svg;
    assert.ok(!auto.includes(">15<") || auto.includes(">15<"), "référence auto"); // 15 dans la case
    const toujours = dessinerBarrePourcentage(Q25, {
      correction: true,
      chemin: false,
      accolades: "actives",
    }).svg;
    const nbAccolades = (toujours.match(/stroke-width="2\.5"\/><text/g) || []).length;
    assert.ok(nbAccolades >= 1, "une accolade sous la part active");
  });
  it("« aucune » : plus aucune accolade, même en correction", () => {
    const { svg } = dessinerBarrePourcentage(QTOT, { correction: true, accolades: "aucune" });
    assert.ok(!svg.includes('stroke-width="2.5"/><text'), "pas d'accolade");
  });
  it("refuse un réglage inconnu", () => {
    assert.throws(() => dessinerBarrePourcentage(Q50, { accolades: "partout" }), RangeError);
  });
});

describe("gabarits de référence (recto/verso imprimés)", () => {
  it("six familles, chacune se dessine en rempli et en vierge", () => {
    assert.equal(GABARITS_REFERENCE_POURCENTAGE.length, 6);
    for (const gabarit of GABARITS_REFERENCE_POURCENTAGE) {
      for (const etiquettes of ["pourcentages", "vierge"]) {
        const rendu = dessinerBarrePourcentage(gabarit.question, { etiquettes, chemin: false });
        assert.ok(rendu.svg.startsWith("<svg"), `${gabarit.id} en ${etiquettes}`);
        assert.ok(!rendu.svg.includes("NaN"));
      }
    }
  });
});

describe("robustesse", () => {
  it("refuse une question invalide", () => {
    assert.throws(() => dessinerBarrePourcentage(null), TypeError);
    assert.throws(() => dessinerBarrePourcentage({ parts: 2 }), RangeError);
    assert.throws(
      () => dessinerBarrePourcentage({ ...Q50, totalVal: Number.NaN }),
      RangeError,
    );
  });
  it("chaque préréglage se dessine sans erreur, en énoncé et en correction", () => {
    assert.equal(VERSION_BARRE_POURCENTAGE, 2);
    for (const p of PREREGLAGES_BARRE_POURCENTAGE) {
      for (const correction of [false, true]) {
        const rendu = dessinerBarrePourcentage(p.question, { ...(p.options ?? {}), correction });
        assert.ok(rendu.svg.startsWith("<svg"), `${p.id} : SVG attendu`);
        assert.ok(rendu.svg.endsWith("</svg>"));
        assert.equal(viewBoxDe(rendu.svg), `0 0 1000 ${rendu.hauteur}`);
      }
    }
  });
  it("toutes les questions du moteur se dessinent (600 tirages seedés)", () => {
    const alea = creerGenerateur("robustesse-barres");
    for (const type of Object.keys(TYPES_POURCENTAGES)) {
      for (let i = 0; i < 30; i++) {
        const q = creerQuestion(type, (i % 3) + 1, i % 2 === 0, alea);
        for (const correction of [false, true]) {
          const { svg } = dessinerBarrePourcentage(q, { correction });
          assert.ok(svg.includes("<svg"), `${type} : rendu vide`);
          assert.ok(!svg.includes("NaN"), `${type} : NaN dans le SVG`);
          assert.ok(!svg.includes("undefined"), `${type} : undefined dans le SVG`);
        }
      }
    }
  });
});
