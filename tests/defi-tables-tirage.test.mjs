// Lot « le tirage des questions » de Défi tables (09-10/10/2026, décisions de
// Gwenaël, planches à l'appui).
//
// Jamais deux fois la même question dans une série (« 4 × 7 = ? » et
// « ? × 7 = 28 » ne sont pas la même question), et deux fois le même calcul
// séparées par au moins 3 autres questions :
//   - le test d'une table (« Je passe le test », et « comme le test, en
//     2 min ») : chaque calcul ×1 à ×10 deux fois — une fois en produit,
//     une fois « à l'envers », une vraie recherche : un nombre manquant, ou
//     une division où l'on cherche (63 ÷ 7 = ?, 63 ÷ ? = 9 ; « ? ÷ 7 = 9 »,
//     c'est 7 × 9, un produit déguisé : il n'est pas posé au test).
//     10 produits, 5 nombres manquants, 5 divisions ; tous les élèves ont
//     les mêmes 20 calculs, chacun vérifié dans les deux sens (décisions du
//     10/10 : la version « A », puis ×1 et ×10 à l'envers aussi plutôt que
//     deux calculs ×6 à ×9 une 3e fois) ;
//   - Mon mélange (20 questions) : 20 calculs tous différents (4 × 7 et 7 × 4
//     comptent pour un), tables à parts égales, ×1 et ×10 une fois chacun au
//     plus, 14 produits / 3 nombres manquants / 3 divisions (une de chaque
//     écriture). Avec deux tables seulement, un calcul revient — sous une
//     autre forme, plus loin ;
//   - la Légende (étoiles, couronne, records : 25 questions, tables 2 à 10) :
//     25 calculs tous différents, tables à parts égales, ×1 et ×10 une fois
//     chacun au plus, un tiers de chaque forme (9 + 8 + 8) ;
//   - inchangés, tirés EXACTEMENT comme avant (empreintes prises sur main
//     c1a64e2, #960) : les entraînements, les réglages libres, l'évaluation
//     CM1, J'apprends ;
//   - les records repartent à zéro (rien n'est effacé) : tests PHP,
//     _serveur/tests/lancer.php (« records — repartent à zéro… »).
//
// Sabotages attendus (chacun rend ce fichier rouge) :
//   - ECART_MIN = 1 ;
//   - retirer le plafond de RARES (×1 et ×10 tirés comme les autres) ;
//   - ×1 et ×10 posés une seule fois au test (sans leur fois à l'envers) ;
//   - retirer la vérification « pas deux fois la même question » ;
//   - remettre « ? ÷ 7 = 9 » au test d'une table (DIVISIONS_TEST = DIVISION_FORMS).

import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const core = require("../outils/calcul_mental/defi_tables_core.js");

const MANQUANTS = ["left", "reverse-left", "reverse-right", "right"];
const DIVISIONS = ["division-dividend", "division-divisor", "division-quotient"];
const ECART_MIN = 4;

// Un tirage reproductible (mulberry32) : les mêmes séries à chaque passage.
function graine(s) {
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const generer = (config, random) => core.generateQuestions(core.normalizeConfiguration(config), random);
const empreinte = valeur => createHash("sha256").update(JSON.stringify(valeur)).digest("hex").slice(0, 16);
const compter = questions => ["direct", "missing", "division"].map(categorie => questions.filter(question => question.category === categorie).length);
const parCle = (questions, cle) => {
  const groupes = new Map();
  questions.forEach((question, index) => {
    const valeur = cle(question);
    if (!groupes.has(valeur)) groupes.set(valeur, []);
    groupes.get(valeur).push({question, index});
  });
  return groupes;
};

function parcoursPasse(tables) {
  const p = P.creerParcours();
  tables.forEach(table => { p.tables[table].acquise = "2026-09-01"; });
  return P.normaliserParcours(p);
}

// Ce qui vaut pour toute série du lot : pas deux fois la même question, et
// deux fois le même calcul à au moins ECART_MIN places l'une de l'autre.
function verifierEcarts(questions, message) {
  const prompts = questions.map(question => question.prompt);
  assert.equal(new Set(prompts).size, prompts.length, `${message} : jamais deux fois la même question (${prompts.join(" | ")})`);
  parCle(questions, question => question.factKey).forEach((fois, cle) => {
    for (let n = 1; n < fois.length; n += 1) {
      assert.ok(fois[n].index - fois[n - 1].index >= ECART_MIN, `${message} : ${cle} aux places ${fois[n - 1].index + 1} et ${fois[n].index + 1}, trop près`);
    }
  });
}

// ------------------------------------------------------- le test d'une table

test("le test d'une table, tables 2 à 10 : chaque calcul ×1 à ×10 deux fois, une fois en produit et une fois vraiment cherché — 10 + 5 + 5", () => {
  let n = 0;
  for (const table of P.TABLES) {
    for (let tirage = 0; tirage < 40; tirage += 1) {
      for (const config of [P.configValidation(table), P.configValidation(table, 120)]) {
        const questions = generer(config, graine(table * 1000 + tirage));
        const message = `table de ${table}, tirage ${tirage}`;
        assert.equal(questions.length, 20, message);
        assert.ok(questions.every(question => question.focusTable === table), `${message} : que la table de ${table}`);
        assert.deepEqual(compter(questions), [10, 5, 5], `${message} : 10 produits, 5 nombres manquants, 5 divisions`);
        verifierEcarts(questions, message);

        const parCalcul = parCle(questions, question => question.multiplier);
        assert.deepEqual([...parCalcul.keys()].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], `${message} : tous les calculs sortent`);
        parCalcul.forEach((fois, multiplicateur) => {
          const categories = fois.map(({question}) => question.category).sort();
          assert.equal(fois.length, 2, `${message} : ×${multiplicateur} exactement deux fois`);
          assert.equal(categories[0], "direct", `${message} : ×${multiplicateur} une fois en produit`);
          assert.ok(["division", "missing"].includes(categories[1]), `${message} : ×${multiplicateur} une fois à l'envers`);
        });

        // Les produits dans les deux sens, moitié-moitié (« 7 × 4 » et « 4 × 7 »).
        const produits = questions.filter(question => question.category === "direct" && question.first !== question.second);
        const tableDevant = produits.filter(question => question.first === table).length;
        assert.ok(Math.abs(tableDevant - (produits.length - tableDevant)) <= 1, `${message} : les produits dans les deux sens`);
        // Le carré (7 × 7) ne se pose jamais « dans l'autre sens » : un seul produit.
        assert.equal(questions.filter(question => question.category === "direct" && question.multiplier === table).length, 1, `${message} : le carré`);
        // Les nombres manquants : les quatre écritures (2 + 1 + 1 + 1).
        const manquants = MANQUANTS.map(type => questions.filter(question => question.type === type).length).sort();
        assert.deepEqual(manquants, [1, 1, 1, 2], `${message} : 7 × ? = 28, ? × 7 = 28, 28 = 7 × ?, 28 = ? × 7`);
        // Les divisions : seulement celles où l'on cherche — 63 ÷ 7 = ? et
        // 63 ÷ ? = 9 (3 + 2) ; jamais « ? ÷ 7 = 9 », un produit déguisé.
        assert.equal(questions.filter(question => question.type === "division-dividend").length, 0, `${message} : pas de « ? ÷ 7 = 9 » au test`);
        const divisions = ["division-quotient", "division-divisor"].map(type => questions.filter(question => question.type === type).length).sort();
        assert.deepEqual(divisions, [2, 3], `${message} : 63 ÷ 7 = ? et 63 ÷ ? = 9`);
        // Et dans les deux sens : 56 ÷ 7 et 56 ÷ 8.
        const parLaTable = questions.filter(question => question.category === "division" && question.first === table && question.second !== table).length;
        const parLAutre = questions.filter(question => question.category === "division" && question.second === table && question.first !== table).length;
        assert.ok(parLaTable >= 1 && parLAutre >= 1, `${message} : les divisions dans les deux sens`);
        n += 1;
      }
    }
  }
  assert.equal(n, 720);
});

// ×1 et ×10 aussi à l'envers (décision du 10/10) : sur tous les tirages, chacun
// sort tantôt en nombre manquant, tantôt en division.
test("le test d'une table : ×1 et ×10 à l'envers aussi — 7 × ? = 7, 70 ÷ ? = 7…", () => {
  const formes = {1: new Set(), 10: new Set()};
  for (let tirage = 0; tirage < 200; tirage += 1) {
    generer(P.configValidation(7), graine(30000 + tirage))
      .filter(question => (question.multiplier === 1 || question.multiplier === 10) && question.category !== "direct")
      .forEach(question => formes[question.multiplier].add(question.category));
  }
  assert.deepEqual([...formes[1]].sort(), ["division", "missing"]);
  assert.deepEqual([...formes[10]].sort(), ["division", "missing"]);
});

test("le test d'une table : chaque question est juste (le produit, le nombre caché, la division)", () => {
  for (const table of P.TABLES) {
    generer(P.configValidation(table), graine(table)).forEach(question => {
      assert.equal(question.product, question.first * question.second, question.prompt);
      assert.equal(question.factKey, `${Math.min(question.first, question.second)}-${Math.max(question.first, question.second)}`, `${question.prompt} compte pour son calcul`);
      assert.ok([question.first, question.second].includes(table), `${question.prompt} est de la table de ${table}`);
    });
  }
});

// ---------------------------------------------------------------- Mon mélange

test("Mon mélange de 3, 6 et 9 tables : 20 calculs tous différents, tables à parts égales, ×1 et ×10 une fois au plus, 14 + 3 + 3, une division de chaque écriture", () => {
  const melanges = [[2, 5, 10], [3, 4, 7], [3, 4, 6, 7, 8, 9], [2, 4, 5, 6, 8, 10], [...P.TABLES]];
  melanges.forEach((tables, index) => {
    const config = P.configMelange(parcoursPasse(tables));
    assert.deepEqual(config.tables, tables);
    for (let tirage = 0; tirage < 60; tirage += 1) {
      const questions = generer(config, graine(9000 + index * 100 + tirage));
      const message = `mélange ${tables.join(", ")}, tirage ${tirage}`;
      assert.equal(questions.length, 20, message);
      assert.deepEqual(compter(questions), [14, 3, 3], `${message} : 14 + 3 + 3`);
      assert.deepEqual(questions.filter(question => question.category === "division").map(question => question.type).sort(), DIVISIONS, `${message} : une division de chaque écriture`);
      assert.equal(new Set(questions.map(question => question.factKey)).size, 20, `${message} : 20 calculs tous différents`);
      verifierEcarts(questions, message);
      const parTable = tables.map(table => questions.filter(question => question.focusTable === table).length);
      assert.ok(Math.max(...parTable) - Math.min(...parTable) <= 1, `${message} : tables à parts égales (${parTable.join(", ")})`);
      assert.ok(questions.filter(question => question.multiplier === 1).length <= 1, `${message} : ×1 une fois au plus`);
      assert.ok(questions.filter(question => question.multiplier === 10).length <= 1, `${message} : ×10 une fois au plus`);
      assert.ok(questions.every(question => tables.includes(question.focusTable)), `${message} : que ses tables passées`);
    }
  });
});

test("Mon mélange de 2 tables : pas assez de calculs — un calcul revient, sous une autre forme, jamais tout près", () => {
  for (const tables of [[2, 5], [7, 8], [9, 10]]) {
    const config = P.configMelange(parcoursPasse(tables));
    for (let tirage = 0; tirage < 80; tirage += 1) {
      const questions = generer(config, graine(12000 + tables[0] * 100 + tirage));
      const message = `mélange ${tables.join(", ")}, tirage ${tirage}`;
      assert.equal(questions.length, 20, message);
      assert.deepEqual(compter(questions), [14, 3, 3], `${message} : 14 + 3 + 3`);
      verifierEcarts(questions, message);
    }
  }
});

// Le moteur garde la règle même quand il manque de calculs : 25 questions sur
// deux tables (une série que l'appli ne lance pas — la Légende prend les
// neuf —, mais où les calculs reviennent souvent, sous plusieurs formes).
test("poussé dans ses retranchements (25 questions sur 2 tables) : toujours jamais deux fois la même question, ni deux fois le même calcul tout près", () => {
  for (const tables of [[2, 10], [3, 4], [7, 8], [6, 9]]) {
    const config = {mode: "test", tables, testLevel: 3, total: 25, duration: 120};
    for (let tirage = 0; tirage < 150; tirage += 1) {
      const questions = generer(config, graine(18000 + tables[0] * 1000 + tirage));
      assert.equal(questions.length, 25);
      verifierEcarts(questions, `25 questions sur les tables ${tables.join(" et ")}, tirage ${tirage}`);
    }
  }
});

// ----------------------------------------------------------------- la Légende

test("la Légende (étoiles, couronne, records) : 25 calculs tous différents, tables 2 à 10 à parts égales, ×1 et ×10 une fois au plus, 9 + 8 + 8", () => {
  const configs = [1, 2, 3, 4, 5].map(etoile => P.configEtoile(etoile)).concat([P.configCourse()]);
  configs.forEach((config, index) => {
    for (let tirage = 0; tirage < 60; tirage += 1) {
      const questions = generer(config, graine(15000 + index * 100 + tirage));
      const message = `Légende ${index + 1}, tirage ${tirage}`;
      assert.equal(questions.length, 25, message);
      assert.deepEqual(compter(questions).sort(), [8, 8, 9], `${message} : un tiers de chaque forme`);
      assert.equal(new Set(questions.map(question => question.factKey)).size, 25, `${message} : 25 calculs tous différents`);
      verifierEcarts(questions, message);
      const parTable = P.TABLES.map(table => questions.filter(question => question.focusTable === table).length);
      assert.ok(Math.max(...parTable) - Math.min(...parTable) <= 1, `${message} : tables à parts égales (${parTable.join(", ")})`);
      assert.ok(questions.filter(question => question.multiplier === 1).length <= 1, `${message} : ×1 une fois au plus`);
      assert.ok(questions.filter(question => question.multiplier === 10).length <= 1, `${message} : ×10 une fois au plus`);
    }
  });
});

// ------------------------------------------------- reproductible, et le reste

test("une graine donne toujours la même série : le test, le mélange, la Légende", () => {
  const configs = [P.configValidation(7), P.configMelange(parcoursPasse([2, 3, 4, 5, 6, 7])), P.configEtoile(3), P.configCourse()];
  configs.forEach(config => {
    const a = generer(config, graine(42)).map(question => question.prompt);
    const b = generer(config, graine(42)).map(question => question.prompt);
    assert.deepEqual(a, b);
    assert.notDeepEqual(a, generer(config, graine(43)).map(question => question.prompt), "une autre graine, une autre série");
  });
});

test("ce qui ne change pas est tiré exactement comme avant : les entraînements, les réglages libres, l'évaluation CM1, J'apprends", () => {
  // Empreintes de 50 séries tirées avec une graine fixe, prises sur main
  // c1a64e2 (#960), avant le lot.
  const series = config => Array.from({length: 50}, (_, index) => generer(config, graine(7000 + index)).map(question => question.prompt));
  const attendu = {
    "Dans le désordre (7)": [P.configEntraine(7, "desordre"), "38f1114c4a9d7efc"],
    "Nombres manquants et divisions (7)": [P.configEntraine(7, "trous"), "e7c6525422855d1a"],
    "Résultats, nombres manquants et divisions (7)": [P.configEntraine(7, "mixte"), "19414b1b84c605d8"],
    "Nombres manquants et divisions (3)": [P.configEntraine(3, "trous"), "7271114220ce9eec"],
    "Résultats, nombres manquants et divisions (9)": [P.configEntraine(9, "mixte"), "b938a29cd5dca382"],
    "réglages libres : produits": [{mode: "custom", tables: [4, 6], total: 20, questionTypes: ["direct"]}, "2e1c67278f0243e2"],
    "réglages libres : tout": [{mode: "custom", tables: [2, 8], total: 30, questionTypes: ["direct", "missing", "division"]}, "ea172470bd7c22a3"],
    "réglages libres : entraînement": [{mode: "train", tables: [3, 5, 7], total: 15, questionTypes: ["direct", "missing"]}, "400cc8e5a454b343"],
    "l'évaluation CM1": [{mode: "evaluation"}, "fc7f2dca9b6b048f"],
    "J'apprends": [P.configApprends(6, "construct"), "b00dddece5ce5c59"]
  };
  Object.entries(attendu).forEach(([nom, [config, valeur]]) => assert.equal(empreinte(series(config)), valeur, nom));
});
