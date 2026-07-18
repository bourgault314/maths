import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { creerGenerateur } from "../../moteur-exercices/src/aleatoire.js";
import {
  FAMILLES_POURCENTAGES,
  TYPES_POURCENTAGES,
  VERSION_POURCENTAGES,
  cleDoublon,
  construireSerie,
  creerQuestion,
  formaterNombre,
  habillerQuestion,
  plurielFr,
} from "./pourcentages.js";

const TOUS_TYPES = Object.keys(TYPES_POURCENTAGES);

// Tire beaucoup de questions d'un type sur tous les niveaux demandés.
function tirer(type, { niveaux = [1, 2, 3], decimaux = false, n = 120, graine = 42 } = {}) {
  const alea = creerGenerateur(`${type}-${decimaux}-${graine}`);
  const questions = [];
  for (let i = 0; i < n; i++) {
    const niveau = niveaux[i % niveaux.length];
    questions.push(creerQuestion(type, niveau, decimaux, alea));
  }
  return questions;
}

describe("catalogue", () => {
  it("expose la version et 20 types répartis en 5 familles sans doublon", () => {
    assert.equal(VERSION_POURCENTAGES, 1);
    assert.equal(TOUS_TYPES.length, 20);
    const familles = FAMILLES_POURCENTAGES.flatMap((f) => [...f.types]);
    assert.equal(familles.length, 20);
    assert.deepEqual([...familles].sort(), [...TOUS_TYPES].sort());
    for (const type of TOUS_TYPES) {
      assert.equal(typeof TYPES_POURCENTAGES[type], "string");
      assert.ok(TYPES_POURCENTAGES[type].length > 0);
    }
  });
});

describe("utilitaires", () => {
  it("écrit les décimaux à la française", () => {
    assert.equal(formaterNombre(2.5), "2,5");
    assert.equal(formaterNombre(140), "140");
  });
  it("accorde le pluriel (1 reste singulier, même négatif)", () => {
    assert.equal(plurielFr(1, "élève", "élèves"), "élève");
    assert.equal(plurielFr(-1, "élève", "élèves"), "élève");
    assert.equal(plurielFr(2, "élève", "élèves"), "élèves");
    assert.equal(plurielFr(0, "élève", "élèves"), "élèves");
  });
});

describe("creerQuestion — garde-fous", () => {
  it("refuse un type ou un niveau inconnus", () => {
    const alea = creerGenerateur(1);
    assert.throws(() => creerQuestion("base_37", 1, false, alea), RangeError);
    assert.throws(() => creerQuestion("base_50", 4, false, alea), RangeError);
  });
});

describe("creerQuestion — cohérence générale", () => {
  it("part, tout et pourcentage restent liés pour chaque type", () => {
    for (const type of TOUS_TYPES) {
      for (const decimaux of [false, true]) {
        for (const q of tirer(type, { decimaux, n: 60 })) {
          assert.ok(q.totalVal > 0, `${type} : total positif`);
          assert.ok(q.calcVal > 0, `${type} : résultat positif`);
          assert.ok(Number.isInteger(q.parts) && q.parts >= 2, `${type} : découpage entier`);
          assert.ok(
            Number.isInteger(q.activeParts) && q.activeParts >= 1 && q.activeParts <= q.parts,
            `${type} : parts actives dans la barre`,
          );
          if (q.mode === "evo_inc") {
            const attendu = (q.totalVal * (100 + q.percent)) / 100;
            assert.ok(Math.abs(q.calcVal - attendu) < 0.005 + 1e-9, `${type} : hausse exacte`);
          } else if (q.mode === "evo_dec") {
            const attendu = (q.totalVal * (100 - q.percent)) / 100;
            assert.ok(Math.abs(q.calcVal - attendu) < 0.005 + 1e-9, `${type} : baisse exacte`);
          } else {
            assert.equal(q.percent, (100 / q.parts) * q.activeParts, `${type} : pourcentage = parts actives`);
            const attendu = (q.totalVal / q.parts) * q.activeParts;
            assert.ok(Math.abs(q.calcVal - attendu) < 0.005 + 1e-9, `${type} : part exacte`);
          }
        }
      }
    }
  });
});

describe("creerQuestion — contraintes de tirage par type (entiers)", () => {
  const bornes = {
    base_50: { mult: 2, min: { 1: 2, 2: 202, 3: 2002 }, max: { 1: 200, 2: 2000, 3: 9998 } },
    base_25: { mult: 4, min: { 1: 4, 2: 204, 3: 1004 }, max: { 1: 200, 2: 1000, 3: 4000 } },
    base_20: { mult: 5, min: { 1: 10, 2: 205, 3: 1005 }, max: { 1: 200, 2: 1000, 3: 4000 } },
    base_10: { mult: 10, min: { 1: 10, 2: 210, 3: 2010 }, max: { 1: 200, 2: 2000, 3: 10000 } },
    base_5: { mult: 20, min: { 1: 20, 2: 220, 3: 2020 }, max: { 1: 200, 2: 2000, 3: 10000 } },
    base_1: { mult: 100, min: { 1: 100, 2: 1100, 3: 5100 }, max: { 1: 900, 2: 5000, 3: 15000 } },
  };

  for (const [type, regle] of Object.entries(bornes)) {
    it(`${type} : totaux multiples de ${regle.mult}, bornés par niveau`, () => {
      for (const niveau of [1, 2, 3]) {
        for (const q of tirer(type, { niveaux: [niveau], n: 80 })) {
          assert.equal(q.totalVal % regle.mult, 0, `${type} niveau ${niveau} : ${q.totalVal}`);
          assert.ok(q.totalVal >= regle.min[niveau] && q.totalVal <= regle.max[niveau]);
          assert.ok(Number.isInteger(q.calcVal), `${type} : la division tombe juste (${q.calcVal})`);
        }
      }
    });
  }

  it("mult_25 : toujours 75 % et un résultat entier", () => {
    for (const q of tirer("mult_25", { n: 60 })) {
      assert.equal(q.percent, 75);
      assert.equal(q.parts, 4);
      assert.equal(q.activeParts, 3);
      assert.ok(Number.isInteger(q.calcVal));
    }
  });

  it("mult_10 : multiples de 10 % sans 10, 50 ni 100", () => {
    const vus = new Set();
    for (const q of tirer("mult_10", { n: 200 })) {
      assert.ok([20, 30, 40, 60, 70, 80, 90].includes(q.percent), `percent = ${q.percent}`);
      assert.equal(q.totalVal % 10, 0);
      assert.ok(Number.isInteger(q.calcVal));
      vus.add(q.percent);
    }
    assert.ok(vus.size >= 5, "la variété des multiples est réelle");
  });

  it("mult_1 : entre 2 % et 49 %", () => {
    for (const q of tirer("mult_1", { n: 120 })) {
      assert.ok(q.percent >= 2 && q.percent <= 49, `percent = ${q.percent}`);
      assert.equal(q.parts, 100);
    }
  });

  it("mult_hi : entre 51 % et 99 %", () => {
    for (const q of tirer("mult_hi", { n: 120 })) {
      assert.ok(q.percent >= 51 && q.percent <= 99, `percent = ${q.percent}`);
      assert.equal(q.parts, 100);
    }
  });
});

describe("creerQuestion — décimaux : la division ne tombe pas juste", () => {
  const attendus = [
    ["base_50", (q) => q.totalVal % 2 !== 0],
    ["base_25", (q) => q.totalVal % 4 !== 0],
    ["base_20", (q) => q.totalVal % 5 !== 0],
    ["base_10", (q) => q.totalVal % 10 !== 0],
    ["base_5", (q) => q.totalVal % 20 !== 0],
  ];
  for (const [type, verifier] of attendus) {
    it(`${type} en décimaux : total jamais divisible par le découpage`, () => {
      for (const q of tirer(type, { decimaux: true, n: 90 })) {
        assert.ok(verifier(q), `${type} : ${q.totalVal}`);
        assert.ok(!Number.isInteger(q.calcVal), `${type} : ${q.calcVal} devrait être décimal`);
      }
    });
  }
});

describe("creerQuestion — chercher le pourcentage et chercher le tout", () => {
  it("inv_* : mode find_percent, découpage attendu", () => {
    const parts = { inv_50: 2, inv_25: 4, inv_20: 5, inv_10: 10 };
    for (const [type, nbParts] of Object.entries(parts)) {
      for (const q of tirer(type, { n: 60 })) {
        assert.equal(q.mode, "find_percent");
        assert.equal(q.parts, nbParts);
        assert.equal(q.percent, (100 / nbParts) * q.activeParts);
      }
    }
  });
  it("tot_* : mode find_total", () => {
    for (const type of ["tot_50", "tot_25", "tot_20", "tot_10"]) {
      for (const q of tirer(type, { n: 60 })) {
        assert.equal(q.mode, "find_total");
      }
    }
  });
  it("inv_25 propose 25 % ou 75 %, inv_20 les quatre cinquièmes possibles", () => {
    const p25 = new Set(tirer("inv_25", { n: 120 }).map((q) => q.percent));
    assert.deepEqual([...p25].sort((a, b) => a - b), [25, 75]);
    const p20 = new Set(tirer("inv_20", { n: 200 }).map((q) => q.percent));
    assert.deepEqual([...p20].sort((a, b) => a - b), [20, 40, 60, 80]);
  });
});

describe("creerQuestion — évolutions", () => {
  it("les pourcentages proposés suivent le niveau", () => {
    const attendus = {
      1: [10, 20, 25, 30, 50],
      2: [10, 20, 25, 30, 40, 50, 60, 70],
      3: [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90],
    };
    for (const type of ["evo_inc", "evo_dec"]) {
      for (const niveau of [1, 2, 3]) {
        for (const q of tirer(type, { niveaux: [niveau], n: 80 })) {
          assert.ok(attendus[niveau].includes(q.percent), `${type} n${niveau} : ${q.percent}`);
        }
      }
    }
  });
  it("entiers : le montant de variation tombe juste", () => {
    for (const type of ["evo_inc", "evo_dec"]) {
      for (const q of tirer(type, { n: 90 })) {
        assert.ok(Number.isInteger(q.calcVal), `${type} : ${q.calcVal}`);
      }
    }
  });
});

describe("habillerQuestion", () => {
  it("énoncé et correction contiennent les nombres de la question", () => {
    for (const type of TOUS_TYPES) {
      const alea = creerGenerateur(`habillage-${type}`);
      for (let i = 0; i < 30; i++) {
        const q = creerQuestion(type, ((i % 3) + 1), i % 2 === 1, alea);
        const h = habillerQuestion(q, alea);
        assert.ok(h.enonceHtml.length > 0, `${type} : énoncé vide`);
        assert.ok(h.correctionHtml.length > 0, `${type} : correction vide`);
        assert.ok(
          h.correctionHtml.includes(formaterNombre(q.calcVal)),
          `${type} : la correction cite le résultat (${h.correctionHtml})`,
        );
        assert.ok(typeof h.unite === "string");
      }
    }
  });

  it("évolution détaillée (4e) contre directe (3e)", () => {
    const q = {
      type: "evo_inc",
      mode: "evo_inc",
      niveau: 1,
      decimaux: false,
      percent: 20,
      parts: 5,
      activeParts: 1,
      totalVal: 150,
      calcVal: 180,
    };
    const detaillee = habillerQuestion(q, creerGenerateur(7), { modeEvolution: "4eme" });
    assert.ok(detaillee.correctionHtml.includes("20 % de 150 = 30"));
    assert.ok(detaillee.correctionHtml.includes("150 + 30 = 180"));
    const directe = habillerQuestion(q, creerGenerateur(7), { modeEvolution: "3eme" });
    assert.ok(directe.correctionHtml.includes("120 % de 150 = 180"));
    assert.ok(!directe.correctionHtml.includes("150 + 30"));
  });

  it("accords français : 1 élève « mange », 2 élèves « mangent »", () => {
    const base = { type: "base_50", mode: "direct", niveau: 1, decimaux: false, percent: 50, parts: 2, activeParts: 1 };
    // On force le contexte école en essayant plusieurs graines : le tirage
    // du contexte est aléatoire, on cherche simplement un cas de chaque.
    let singulier = null;
    let pluriel = null;
    for (let graine = 0; graine < 400 && (!singulier || !pluriel); graine++) {
      const un = habillerQuestion({ ...base, totalVal: 2, calcVal: 1 }, creerGenerateur(graine));
      if (un.enonceHtml.includes("cantine")) singulier = un;
      const deux = habillerQuestion({ ...base, totalVal: 4, calcVal: 2 }, creerGenerateur(graine));
      if (deux.correctionHtml.includes("cantine")) pluriel = deux;
    }
    assert.ok(singulier, "aucun contexte école tiré en 400 graines");
    assert.ok(pluriel, "aucun contexte école tiré en 400 graines");
    assert.ok(singulier.correctionHtml.includes("1 élève</strong> mange à la cantine"));
    assert.ok(pluriel.correctionHtml.includes("2 élèves</strong> mangent à la cantine"));
  });

  it("refuse un mode d'évolution inconnu", () => {
    const q = { mode: "direct", percent: 50, parts: 2, activeParts: 1, totalVal: 10, calcVal: 5 };
    assert.throws(() => habillerQuestion(q, creerGenerateur(1), { modeEvolution: "6eme" }), RangeError);
  });
});

describe("construireSerie", () => {
  it("même graine, même série ; graine différente, série différente", () => {
    const params = {
      types: ["base_50", "base_25", "evo_dec", "tot_10"],
      niveaux: [1, 2],
      nombres: ["entiers", "decimaux"],
      quantite: 12,
      graine: "fiche-2026",
    };
    const a = construireSerie(params);
    const b = construireSerie(params);
    assert.deepEqual(a, b);
    const c = construireSerie({ ...params, graine: "fiche-2027" });
    assert.notDeepEqual(a.questions, c.questions);
  });

  it("répartit équitablement les types cochés", () => {
    const serie = construireSerie({ types: ["base_50", "inv_20", "tot_25"], quantite: 12, graine: 3 });
    assert.equal(serie.questions.length, 12);
    const parType = new Map();
    for (const q of serie.questions) parType.set(q.type, (parType.get(q.type) ?? 0) + 1);
    assert.deepEqual([...parType.values()].sort(), [4, 4, 4]);
  });

  it("anti-doublon : jamais deux fois la même question d'un type", () => {
    const serie = construireSerie({ types: ["base_50"], niveaux: [1], quantite: 15, graine: 9 });
    const cles = serie.questions.map((q) => cleDoublon("base_50", q));
    assert.equal(new Set(cles).size, cles.length);
  });

  it("chaque question arrive habillée", () => {
    const serie = construireSerie({ types: TOUS_TYPES, quantite: 20, graine: 5 });
    for (const q of serie.questions) {
      assert.ok(q.enonceHtml.length > 0);
      assert.ok(q.correctionHtml.length > 0);
      assert.ok(typeof q.unite === "string");
      assert.ok(TOUS_TYPES.includes(q.type));
    }
  });

  it("garde-fous : graine obligatoire, types connus, quantité entière", () => {
    assert.throws(() => construireSerie({ types: ["base_50"], quantite: 5 }), RangeError);
    assert.throws(() => construireSerie({ types: [], graine: 1 }), RangeError);
    assert.throws(() => construireSerie({ types: ["base_37"], graine: 1 }), RangeError);
    assert.throws(() => construireSerie({ types: ["base_50"], quantite: 2.5, graine: 1 }), RangeError);
    assert.throws(() => construireSerie({ types: ["base_50"], niveaux: [4], graine: 1 }), RangeError);
    assert.throws(() => construireSerie({ types: ["base_50"], nombres: ["romains"], graine: 1 }), RangeError);
  });
});
