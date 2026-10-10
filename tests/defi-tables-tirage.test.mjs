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
//   - dans une série d'UNE table (le test et les deux entraînements à
//     divisions), la division cache toujours l'autre nombre : la réponse
//     n'est jamais le numéro de la table, sauf le carré (9 ÷ 3 = ?) ;
//   - Mon mélange (20 questions) : 20 calculs tous différents (4 × 7 et 7 × 4
//     comptent pour un), tables à parts égales, ×1 et ×10 une fois chacun au
//     plus, 14 produits / 3 nombres manquants / 3 divisions (une de chaque
//     écriture). Avec deux tables seulement, un calcul revient — sous une
//     autre forme, plus loin ;
//   - la Légende (étoiles, couronne, records : 25 questions, tables 2 à 10) :
//     25 calculs tous différents, tables à parts égales, ×1 et ×10 une fois
//     chacun au plus, un tiers de chaque forme (9 + 8 + 8) ;
//   - relecture du 10/10 (Fable), Mon mélange et la Légende : les questions à
//     l'envers sont réparties entre les tables à parts égales (les divisions
//     d'abord, puis les nombres manquants, en tournant : une table qui en a
//     deux a une division et un nombre manquant), chaque table garde un
//     produit ; et chaque calcul a la même chance de sortir — 7 × 8 peut être
//     tiré par deux tables, 7 × 7 par une seule : il compte double chez elle ;
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
//   - remettre « ? ÷ 7 = 9 » au test d'une table (DIVISIONS_TEST = DIVISION_FORMS) ;
//   - laisser la division cacher la table dans une série d'une seule table
//     (parLeMultiplicateurUneTable qui rend le sens tiré) ;
//   - ne plus mélanger les tables (ordonnerSerie appelé sans le nombre de tables) ;
//   - tirer les formes sans regarder les tables (repartirFormes qui rend le
//     plan tel quel) ;
//   - retirer le double billet des calculs qu'une seule table peut tirer
//     (billets = ALL_TABLES).

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
        // À l'envers, la réponse n'est jamais le numéro de la table (sauf le
        // carré, 49 ÷ 7 = ?) : 28 ÷ 7 = ? et 28 ÷ ? = 7, jamais 28 ÷ 4 = ? ni 28 ÷ ? = 4.
        questions.filter(question => question.category !== "direct" && question.multiplier !== table).forEach(question => {
          assert.notEqual(question.answer, table, `${message} : « ${question.prompt} » donne la table`);
        });
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

// Décision du 10/10 : dans une série d'UNE table, la division cache toujours
// l'autre nombre — au test de la table de 3, « 12 ÷ 3 = ? » et « 12 ÷ ? = 3 »
// (on cherche 4), jamais « 12 ÷ 4 = ? » ni « 12 ÷ ? = 4 » (c'est 3, la table
// qu'on passe). Le carré (9 ÷ 3 = ?) reste : son autre nombre est aussi 3.
// Mon mélange et la Légende gardent les deux sens.
test("une seule table (le test, « comme le test », les deux entraînements à divisions) : la réponse n'est jamais le numéro de la table, sauf le carré", () => {
  let divisions = 0;
  for (const table of P.TABLES) {
    for (let tirage = 0; tirage < 60; tirage += 1) {
      for (const config of [P.configValidation(table), P.configValidation(table, 120), P.configEntraine(table, "trous"), P.configEntraine(table, "mixte")]) {
        generer(config, graine(40000 + table * 100 + tirage)).forEach(question => {
          // Les produits, et « ? ÷ 7 = 8 » dont la réponse est le produit (7 pour 7 × 1), ne sont pas concernés.
          if (question.category === "direct" || question.type === "division-dividend") return;
          if (question.category === "division") divisions += 1;
          if (question.multiplier === table) assert.equal(question.answer, table, `le carré : ${question.prompt}`);
          else assert.notEqual(question.answer, table, `table de ${table} : « ${question.prompt} » donne la table`);
        });
      }
    }
  }
  assert.ok(divisions > 4000, `${divisions} divisions vérifiées`);
  // Au test de la table de 3 : 3 ÷ 3 = ? et 3 ÷ ? = 3 (réponse 1) restent ; 3 ÷ 1 = ? et 3 ÷ ? = 1 partent.
  const ecrits = new Set();
  for (let tirage = 0; tirage < 400; tirage += 1) generer(P.configValidation(3), graine(50000 + tirage)).forEach(question => ecrits.add(question.prompt));
  ["3 ÷ 3 = ?", "3 ÷ ? = 3", "9 ÷ 3 = ?", "9 ÷ ? = 3", "12 ÷ 3 = ?", "12 ÷ ? = 3"].forEach(prompt => assert.ok(ecrits.has(prompt), `${prompt} est posé`));
  ["3 ÷ 1 = ?", "3 ÷ ? = 1", "12 ÷ 4 = ?", "12 ÷ ? = 4", "30 ÷ 10 = ?", "30 ÷ ? = 10"].forEach(prompt => assert.ok(!ecrits.has(prompt), `${prompt} n'est plus posé`));
  // Mon mélange : les deux sens restent (on ne sait pas de quelle table vient le calcul).
  const sens = new Set();
  for (let tirage = 0; tirage < 200; tirage += 1) {
    generer(P.configMelange(parcoursPasse([2, 5, 10])), graine(60000 + tirage))
      .filter(question => question.type === "division-divisor" && question.first !== question.second)
      .forEach(question => sens.add(question.answer === question.focusTable ? "la table" : "l'autre"));
  }
  assert.deepEqual([...sens].sort(), ["l'autre", "la table"]);
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

// Retouche du 10/10 (« tu es sûr que ça mélange bien les tables ? ») : rangée
// au hasard, une série collait souvent la même table — jusqu'à 7 questions de
// suite sur 3 tables. Dès 3 tables, jamais deux questions de suite sur la même
// table ; avec 2 tables, jamais trois. Avant le lot : jamais trois non plus.
test("les tables bien mélangées : dès 3 tables (mélange, Légende), jamais deux questions de suite sur la même table ; avec 2 tables, jamais trois", () => {
  const plusLongueSuite = questions => questions.reduce(([max, suite], question, index) => {
    const n = index && question.focusTable === questions[index - 1].focusTable ? suite + 1 : 1;
    return [Math.max(max, n), n];
  }, [0, 0])[0];
  const series = [
    [() => P.configMelange(parcoursPasse([2, 5, 10])), 1], [() => P.configMelange(parcoursPasse([3, 4, 7])), 1],
    [() => P.configMelange(parcoursPasse([3, 4, 6, 7, 8, 9])), 1], [() => P.configMelange(parcoursPasse([...P.TABLES])), 1],
    [() => P.configEtoile(2), 1], [() => P.configCourse(), 1],
    [() => P.configMelange(parcoursPasse([2, 5])), 2], [() => P.configMelange(parcoursPasse([7, 8])), 2]
  ];
  series.forEach(([config, permis], index) => {
    for (let tirage = 0; tirage < 150; tirage += 1) {
      const questions = generer(config(), graine(70000 + index * 1000 + tirage));
      assert.ok(plusLongueSuite(questions) <= permis, `série ${index + 1}, tirage ${tirage} : ${plusLongueSuite(questions)} questions de suite sur la même table`);
    }
  });
});

// ------------------------------------------- relecture du 10/10 : les formes

// Les formes étaient tirées sans regarder les tables : dans un mélange de 3
// tables, une fois sur six une table n'avait aucune question à l'envers, et
// trois fois sur quatre une table avait 2 ou 3 divisions quand une autre n'en
// avait pas (mesuré sur 10 000 séries). Désormais les questions à l'envers sont
// réparties entre les tables à parts égales, divisions et nombres manquants
// aussi ; chaque table garde au moins un produit.
test("les formes réparties entre les tables (mélange de 2 à 9 tables, Légende) : questions à l'envers, divisions et nombres manquants à parts égales (à une près), un produit au moins par table tant que la série en a assez", () => {
  const melanges = [[2, 5], [7, 8], [2, 5, 10], [3, 4, 7], [2, 4, 6, 8], [2, 3, 4, 5, 6], [3, 4, 6, 7, 8, 9], [2, 3, 4, 5, 6, 7, 8], [2, 3, 4, 5, 6, 7, 8, 9], [...P.TABLES]];
  const configs = melanges.map(tables => [P.configMelange(parcoursPasse(tables)), tables]).concat([[P.configEtoile(1), P.TABLES], [P.configEtoile(5), P.TABLES], [P.configCourse(), P.TABLES]]);
  const ecart = valeurs => Math.max(...valeurs) - Math.min(...valeurs);
  configs.forEach(([config, tables], index) => {
    for (let tirage = 0; tirage < 100; tirage += 1) {
      const questions = generer(config, graine(80000 + index * 1000 + tirage));
      const message = `${core.configurationLabel(config)}, tirage ${tirage}`;
      const parTable = tables.map(table => questions.filter(question => question.focusTable === table));
      const compte = categorie => parTable.map(serie => serie.filter(question => question.category === categorie).length);
      const [produits, manquants, divisions] = ["direct", "missing", "division"].map(compte);
      const envers = manquants.map((n, k) => n + divisions[k]);
      assert.ok(ecart(envers) <= 1, `${message} : les questions à l'envers à parts égales (${envers.join(", ")})`);
      assert.ok(ecart(divisions) <= 1, `${message} : les divisions à parts égales (${divisions.join(", ")})`);
      assert.ok(ecart(manquants) <= 1, `${message} : les nombres manquants à parts égales (${manquants.join(", ")})`);
      // Un produit au moins par table — sauf quand la série n'en a pas assez :
      // la Légende en pose 8 ou 9 (9 + 8 + 8 tombe au hasard sur une forme),
      // et à 8 produits pour 9 tables, une table en est privée, jamais deux.
      const privees = Math.max(0, tables.length - produits.reduce((somme, n) => somme + n, 0));
      assert.equal(produits.filter(n => n === 0).length, privees, `${message} : un produit au moins par table (${produits.join(", ")})`);
      envers.forEach((n, k) => {
        if (n === 2) assert.deepEqual([manquants[k], divisions[k]], [1, 1], `${message} : la table de ${tables[k]} a deux questions à l'envers — une division et un nombre manquant`);
      });
    }
  });
});

test("les formes réparties, cas par cas : 3 tables — chaque table 1 division et 1 nombre manquant ; 6 tables — chaque table 1 question à l'envers ; 9 tables — jamais 2 sur la même ; Légende — une table à 3 questions les a sous les 3 formes ; 2 tables — 3 à l'envers chacune", () => {
  const cas = [
    [P.configMelange(parcoursPasse([2, 5, 10])), (envers, manquants, divisions) => envers.every(n => n === 2) && manquants.every(n => n === 1) && divisions.every(n => n === 1)],
    [P.configMelange(parcoursPasse([3, 4, 6, 7, 8, 9])), envers => envers.every(n => n === 1)],
    [P.configMelange(parcoursPasse([...P.TABLES])), envers => envers.every(n => n <= 1) && envers.filter(n => n === 1).length === 6],
    [P.configMelange(parcoursPasse([7, 8])), envers => envers.every(n => n === 3)],
    [P.configCourse(), (envers, manquants, divisions, produits) => produits.every((n, k) => n + envers[k] !== 3 || (n === 1 && manquants[k] === 1 && divisions[k] === 1))]
  ];
  cas.forEach(([config, regle], index) => {
    const tables = core.normalizeConfiguration(config).tables;
    for (let tirage = 0; tirage < 100; tirage += 1) {
      const questions = generer(config, graine(90000 + index * 1000 + tirage));
      const compte = categorie => tables.map(table => questions.filter(question => question.focusTable === table && question.category === categorie).length);
      const [produits, manquants, divisions] = ["direct", "missing", "division"].map(compte);
      const envers = manquants.map((n, k) => n + divisions[k]);
      assert.ok(regle(envers, manquants, divisions, produits), `${core.configurationLabel(config)}, tirage ${tirage} : produits ${produits.join(",")} / manquants ${manquants.join(",")} / divisions ${divisions.join(",")}`);
    }
  });
});

// Dans une table, quelle forme va à quel calcul reste tiré au sort : ×1, ×10,
// le carré et 7 × 8 sortent tantôt en produit, tantôt à l'envers.
test("les formes réparties ne figent rien dans la table : un même calcul sort sous toutes les formes d'une série à l'autre", () => {
  const formes = new Map();
  for (let tirage = 0; tirage < 400; tirage += 1) {
    generer(P.configCourse(), graine(95000 + tirage)).forEach(question => {
      if (!formes.has(question.factKey)) formes.set(question.factKey, new Set());
      formes.get(question.factKey).add(question.category);
    });
  }
  ["7-7", "7-8", "2-3", "1-7", "7-10", "10-10"].forEach(cle => assert.deepEqual([...formes.get(cle)].sort(), ["direct", "division", "missing"], `${cle} sous les trois formes`));
});

// ----------------------------------- relecture du 10/10 : chaque calcul sa chance

// 7 × 8 peut être tiré par la table de 7 ou par celle de 8 ; 7 × 7 seulement
// par la table de 7. Sans correction, dans la Légende, les 8 carrés sortaient
// dans 39 % des séries et les 28 autres calculs dans 62 % ; dans un mélange de
// 3 tables, les calculs communs à deux tables (2 × 5) sortaient dans 95 % des
// séries, les autres dans 80 %. Un calcul qu'une seule table peut tirer a deux
// billets : tous les calculs ont alors la même chance (mesuré : 55 à 59 %).
test("chaque calcul a la même chance de sortir : la Légende, le mélange de 6 tables et de 3 tables — les carrés comme les autres, les calculs communs à deux tables comme les autres", () => {
  const cas = [
    ["la Légende", P.configCourse(), 2000, 1.2],
    ["mélange de 6 tables", P.configMelange(parcoursPasse([2, 3, 4, 5, 6, 7])), 2000, 1.2],
    ["mélange de 3 tables", P.configMelange(parcoursPasse([2, 5, 10])), 2000, 1.1]
  ];
  cas.forEach(([nom, config, n, rapportMax], index) => {
    const tables = core.normalizeConfiguration(config).tables;
    const compte = new Map();
    for (let tirage = 0; tirage < n; tirage += 1) generer(config, graine(100000 + index * 10000 + tirage)).forEach(question => compte.set(question.factKey, (compte.get(question.factKey) || 0) + 1));
    // Les calculs de 2 × 2 à 9 × 9 des tables de la série (×1 et ×10 sont plafonnés à part).
    const coeur = [];
    tables.forEach(table => { for (let m = 2; m <= 9; m += 1) if (table <= 9 && (m >= table || !tables.includes(m))) coeur.push(`${Math.min(table, m)}-${Math.max(table, m)}`); });
    const frequences = coeur.map(cle => [cle, (compte.get(cle) || 0) / n]);
    const [[cleMin, min]] = frequences.slice().sort((a, b) => a[1] - b[1]);
    const [[cleMax, max]] = frequences.slice().sort((a, b) => b[1] - a[1]);
    assert.ok(max / min <= rapportMax, `${nom} : ${cleMax} sort dans ${(100 * max).toFixed(0)} % des séries, ${cleMin} dans ${(100 * min).toFixed(0)} %`);
    const moyenne = liste => liste.reduce((somme, [, f]) => somme + f, 0) / liste.length;
    const carres = frequences.filter(([cle]) => cle.split("-")[0] === cle.split("-")[1]);
    const autres = frequences.filter(([cle]) => cle.split("-")[0] !== cle.split("-")[1]);
    const rapport = moyenne(carres) / moyenne(autres);
    assert.ok(rapport >= 0.9 && rapport <= 1.1, `${nom} : les carrés sortent dans ${(100 * moyenne(carres)).toFixed(0)} % des séries, les autres dans ${(100 * moyenne(autres)).toFixed(0)} %`);
  });
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

test("ce qui ne change pas est tiré exactement comme avant : les entraînements (sauf le sens de leurs divisions), les réglages libres, l'évaluation CM1, J'apprends", () => {
  // Empreintes de 50 séries tirées avec une graine fixe, prises sur main
  // c1a64e2 (#960), avant le lot. Les deux entraînements à divisions changent
  // exprès (la réponse n'est plus la table) — et SEULEMENT là : vérifié sur
  // 8 100 séries (outils-lot\orient.cjs), mêmes calculs et mêmes formes
  // question par question, seuls les énoncés « 28 ÷ 4 = ? » / « 28 ÷ ? = 4 »
  // deviennent « 28 ÷ 7 = ? » / « 28 ÷ ? = 7 ». Avant : e7c6525422855d1a,
  // 19414b1b84c605d8, 7271114220ce9eec, b938a29cd5dca382.
  const series = config => Array.from({length: 50}, (_, index) => generer(config, graine(7000 + index)).map(question => question.prompt));
  const attendu = {
    "Dans le désordre (7)": [P.configEntraine(7, "desordre"), "38f1114c4a9d7efc"],
    "Nombres manquants et divisions (7)": [P.configEntraine(7, "trous"), "9a91e5a082f50056"],
    "Résultats, nombres manquants et divisions (7)": [P.configEntraine(7, "mixte"), "f267846a3afba723"],
    "Nombres manquants et divisions (3)": [P.configEntraine(3, "trous"), "04cb9a5d249123b4"],
    "Résultats, nombres manquants et divisions (9)": [P.configEntraine(9, "mixte"), "5b16ece980ca0961"],
    "réglages libres : produits": [{mode: "custom", tables: [4, 6], total: 20, questionTypes: ["direct"]}, "2e1c67278f0243e2"],
    "réglages libres : tout": [{mode: "custom", tables: [2, 8], total: 30, questionTypes: ["direct", "missing", "division"]}, "ea172470bd7c22a3"],
    "réglages libres : entraînement": [{mode: "train", tables: [3, 5, 7], total: 15, questionTypes: ["direct", "missing"]}, "400cc8e5a454b343"],
    "l'évaluation CM1": [{mode: "evaluation"}, "fc7f2dca9b6b048f"],
    "J'apprends": [P.configApprends(6, "construct"), "b00dddece5ce5c59"]
  };
  Object.entries(attendu).forEach(([nom, [config, valeur]]) => assert.equal(empreinte(series(config)), valeur, nom));
});
