// Lot « trois divisions » de Défi tables (09/10/2026, décisions de Gwenaël).
//
// Une division s'écrit de trois façons PARTOUT dans le parcours — 56 ÷ 7 = ?,
// ? ÷ 7 = 8 et 56 ÷ ? = 8 —, plus seulement à « Je deviens expert » et dans
// les réglages libres (cela annule « une seule forme » du lot « divisions »
// du 04/10) :
//   - « Nombres manquants et divisions » (5 divisions) : les trois écritures ;
//   - « Résultats, nombres manquants et divisions » (2 divisions) : deux
//     écritures différentes ;
//   - le test d'une table et Mon mélange (3 divisions) : une de chaque ;
//   - chaque écriture dans les deux sens, à parts à peu près égales :
//     ? ÷ 7 = 8 et ? ÷ 8 = 7, 56 ÷ ? = 8 et 56 ÷ ? = 7 ;
//   - Mes calculs du jour : les trois écritures à tour de rôle (deux
//     divisions dans une série : deux écritures différentes) ;
//   - les dosages ne changent pas ; l'expert, les réglages libres,
//     l'évaluation CM1 et les séries sans division sont tirés EXACTEMENT
//     comme avant (empreintes prises sur main bbb1140, #956) ;
//   - rien de nouveau n'est enregistré : une division compte pour son
//     calcul, quelle que soit son écriture ;
//   - l'écran juste avant le test et le mélange montre cinq pastilles
//     (version B, tests/defi-tables-optimisation-e2.test.mjs).
//
// Sabotages attendus (chacun rend ce fichier, ou celui qu'il nomme, rouge) :
//   - remettre une seule forme dans le parcours (quotient seul en train/validation) ;
//   - ne plus tirer les deux sens dans le parcours ;
//   - tirer les deux sens aussi à l'expert ;
//   - Mes calculs du jour toujours en 56 ÷ 7 = ? ;
//   - Mes calculs du jour : la même écriture pour toutes les divisions de la série ;
//   - retirer les deux nouvelles pastilles (rouge : optimisation-e2) ;
//   - oublier de monter le ?v= d'un des deux moteurs.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const core = require("../outils/calcul_mental/defi_tables_core.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const N = " ";
const ECRITURES = ["division-dividend", "division-divisor", "division-quotient"];

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
const divisions = questions => questions.filter(question => question.category === "division");
const empreinte = valeur => createHash("sha256").update(JSON.stringify(valeur)).digest("hex").slice(0, 16);

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }\n", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

function parcoursPasse(tables, dus) {
  const p = P.creerParcours();
  tables.forEach(table => { p.tables[table].acquise = "2026-09-01"; });
  dus.forEach(cle => { p.calculs[cle] = {boite: 2, cases: 1, vu: "2026-09-01", erreur: null, gagne: "2026-09-01", echeance: "2026-09-02"}; });
  return P.normaliserParcours(p);
}

// Lot « le tirage des questions » (10/10/2026) : le test d'une table pose
// 5 divisions, seulement celles où l'on cherche — 56 ÷ 7 = ? et 56 ÷ ? = 8
// (3 + 2) ; « ? ÷ 7 = 8 », c'est 7 × 8, un produit déguisé : il n'est plus
// posé au test (tests/defi-tables-tirage.test.mjs). Mon mélange garde ses
// 3 divisions, une de chaque écriture.
test("le test d'une table : 56 ÷ 7 = ? et 56 ÷ ? = 8, pas « ? ÷ 7 = 8 » ; Mon mélange : une division de chaque écriture — à chaque tirage, pour chaque table", () => {
  let n = 0;
  for (const table of P.TABLES) {
    for (let tirage = 0; tirage < 30; tirage += 1) {
      for (const config of [P.configValidation(table), P.configValidation(table, 120)]) {
        const questions = generer(config, graine(table * 1000 + tirage));
        assert.equal(questions.length, 20);
        const parEcriture = ECRITURES.map(type => divisions(questions).filter(question => question.type === type).length);
        assert.equal(parEcriture[0], 0, `table de ${table} : pas de « ? ÷ 7 = 8 » au test`);
        assert.deepEqual(parEcriture.slice(1).sort(), [2, 3], `table de ${table} : 56 ÷ 7 = ? et 56 ÷ ? = 8`);
        n += 1;
      }
    }
  }
  const melanges = [[2, 5], [2, 5, 10], [3, 4, 6, 7, 8, 9], [...P.TABLES]];
  melanges.forEach((tables, index) => {
    const config = P.configMelange(parcoursPasse(tables, []));
    assert.deepEqual(config.tables, tables);
    for (let tirage = 0; tirage < 40; tirage += 1) {
      assert.deepEqual(divisions(generer(config, graine(9000 + index * 100 + tirage))).map(question => question.type).sort(), ECRITURES, `le mélange des tables ${tables.join(", ")}`);
    }
  });
  assert.equal(n, 540);
});

test("les entraînements : les trois écritures dans « Nombres manquants et divisions », deux différentes dans « Résultats, nombres manquants et divisions »", () => {
  for (let tirage = 0; tirage < 200; tirage += 1) {
    const trous = divisions(generer(P.configEntraine(7, "trous"), graine(3000 + tirage)));
    assert.equal(trous.length, 5, "5 divisions : le dosage ne change pas");
    const parEcriture = ECRITURES.map(type => trous.filter(question => question.type === type).length).sort();
    assert.deepEqual(parEcriture, [1, 2, 2], "les trois écritures, aucune plus de deux fois");
    const mixte = divisions(generer(P.configEntraine(7, "mixte"), graine(4000 + tirage)));
    assert.equal(mixte.length, 2, "2 divisions : le dosage ne change pas");
    assert.notEqual(mixte[0].type, mixte[1].type, "deux écritures différentes");
  }
  assert.deepEqual(divisions(generer(P.configEntraine(7, "desordre"), graine(1))), [], "« Dans le désordre » : toujours que des résultats");
});

// Lot « le tirage des questions » (10/10/2026, décision de Gwenaël) : dans une
// série d'UNE table, la réponse n'est jamais le numéro de la table — 56 ÷ 7 = ?
// (lue par la table) et 56 ÷ ? = 7 (lue par le multiplicateur), on cherche 8 ;
// plus 56 ÷ 8 = ? ni 56 ÷ ? = 8, qui donnaient 7, la table qu'on passe.
// « ? ÷ 7 = 8 » (réponse 56) garde ses deux sens, à parts à peu près égales.
test("une seule table : 56 ÷ 7 = ? et 56 ÷ ? = 7 (on cherche 8, jamais la table) ; ? ÷ 7 = 8 et ? ÷ 8 = 7 à parts à peu près égales", () => {
  const sens = Object.fromEntries(ECRITURES.map(type => [type, {parLaTable: 0, parLAutre: 0}]));
  for (let tirage = 0; tirage < 300; tirage += 1) {
    for (const config of [P.configEntraine(7, "trous"), P.configEntraine(7, "mixte"), P.configValidation(7)]) {
      divisions(generer(config, graine(5000 + tirage))).forEach(question => {
        assert.ok(question.first === 7 || question.second === 7, "une division de SA table");
        if (question.first === question.second) return;
        // « par la table » : la table de 7 est le premier nombre (? ÷ 7 = 8, 56 ÷ 7 = ?, 56 ÷ ? = 8).
        sens[question.type][question.first === 7 ? "parLaTable" : "parLAutre"] += 1;
      });
    }
  }
  const {parLaTable, parLAutre} = sens["division-dividend"];
  assert.ok(parLaTable > 50 && parLAutre > 50, "? ÷ 7 = 8 et ? ÷ 8 = 7 : les deux sens");
  assert.ok(Math.abs(parLaTable - parLAutre) < (parLaTable + parLAutre) / 4, `à parts à peu près égales (${parLaTable} / ${parLAutre})`);
  assert.equal(sens["division-quotient"].parLAutre, 0, "jamais 56 ÷ 8 = ? (réponse 7, la table)");
  assert.ok(sens["division-quotient"].parLaTable > 50, "56 ÷ 7 = ?");
  assert.equal(sens["division-divisor"].parLaTable, 0, "jamais 56 ÷ ? = 8 (réponse 7, la table)");
  assert.ok(sens["division-divisor"].parLAutre > 50, "56 ÷ ? = 7");
  // Exemples écrits en clair (table de 7, multiplicateur 8).
  assert.equal(core.tableQuestion("division-dividend", 7, 8).prompt, "? ÷ 7 = 8");
  assert.equal(core.tableQuestion("division-dividend", 8, 7).prompt, "? ÷ 8 = 7");
  assert.equal(core.tableQuestion("division-divisor", 7, 8).prompt, "56 ÷ ? = 8");
  assert.equal(core.tableQuestion("division-divisor", 8, 7).prompt, "56 ÷ ? = 7");
});

test("les réponses sont justes et uniques, pour toutes les tables, tous les multiplicateurs, les trois écritures et les deux sens", () => {
  for (const table of [...P.TABLES]) {
    for (let multiplicateur = 1; multiplicateur <= 10; multiplicateur += 1) {
      for (const [premier, second] of [[table, multiplicateur], [multiplicateur, table]]) {
        for (const type of ECRITURES) {
          const question = core.tableQuestion(type, premier, second);
          const [gauche, droite] = question.prompt.split(" = ");
          const [dividende, diviseur] = gauche.split(" ÷ ");
          const lire = texte => (texte === "?" ? question.answer : Number(texte));
          assert.equal(question.prompt.split("?").length, 2, `${question.prompt} : une seule case`);
          assert.equal(lire(dividende), lire(diviseur) * lire(droite), `${question.prompt} → ${question.answer}`);
          assert.ok(lire(diviseur) > 0);
          assert.equal(question.factKey, `${Math.min(premier, second)}-${Math.max(premier, second)}`);
        }
      }
    }
  }
});

test("Mes calculs du jour : les trois écritures à tour de rôle, deux écritures différentes dans une même série", () => {
  const dus = ["2-7", "3-8", "4-6", "5-9", "6-7", "7-8", "8-9", "3-4", "2-9", "4-8", "5-6", "6-9"];
  const p = parcoursPasse([2, 3, 4, 5, 6, 7, 8, 9], dus);
  const compte = Object.fromEntries(ECRITURES.map(type => [type, 0]));
  const sens = new Set();
  for (let tirage = 0; tirage < 300; tirage += 1) {
    const plan = P.planRevision(p, {random: graine(6000 + tirage), aujourdhui: "2026-09-12"});
    assert.equal(plan.length, 10);
    const lesDivisions = plan.filter(item => item.type.startsWith("division"));
    assert.equal(lesDivisions.length, 2, "toujours 2 divisions sur 10 : la part ne change pas");
    assert.notEqual(lesDivisions[0].type, lesDivisions[1].type, "deux écritures différentes dans la série");
    lesDivisions.forEach(item => {
      compte[item.type] += 1;
      const question = core.tableQuestion(item.type, item.first, item.second);
      assert.equal(question.factKey, item.cle, "elle compte pour son calcul");
      if (item.type !== "division-quotient") sens.add(`${item.type}:${item.first < item.second ? "petit" : "grand"}`);
    });
  }
  ECRITURES.forEach(type => assert.ok(compte[type] > 150, `${type} : un tiers environ (${compte[type]} sur 600)`));
  assert.equal(sens.size, 4, "? ÷ 7 = 8 et ? ÷ 8 = 7, 56 ÷ ? = 8 et 56 ÷ ? = 7");
  // La révision d'UNE table, sans entraînement « trous » ni table passée : que des produits, comme avant.
  const debutant = P.normaliserParcours({calculs: {"6-7": {boite: 2, cases: 1, vu: "2026-09-01", erreur: null, gagne: "2026-09-01", echeance: "2026-09-02"}}});
  assert.ok(P.planRevision(debutant, {table: 7, random: graine(1), aujourdhui: "2026-09-12"}).every(item => item.type === "direct"));
});

test("ce qui ne doit pas changer est tiré exactement comme avant : l'expert, les réglages libres, l'évaluation CM1, « Dans le désordre », Mes calculs du jour sans division", () => {
  // Empreintes de 50 séries tirées avec une graine fixe, prises sur main
  // bbb1140 (#956), avant le lot.
  const series = config => Array.from({length: 50}, (_, index) => generer(config, graine(1000 + index)).map(question => question.prompt));
  // Lot « le tirage des questions » (10/10/2026) : l'expert change exprès
  // (25 calculs tous différents, ×1 et ×10 une fois au plus, jamais deux fois
  // la même question, les tables mélangées : jamais deux questions de suite
  // sur la même table ; relecture du 10/10 : les formes réparties entre les
  // tables, chaque calcul la même chance ; puis l'ordre par tours) — empreinte
  // reprise après le lot (avant : dac37702dfbc35fa, puis 1568c68b3267ba06
  // avant la relecture, puis e78e656dfcd34646 avant les tours).
  for (let etoile = 1; etoile <= 5; etoile += 1) assert.equal(empreinte(series(P.configEtoile(etoile))), "e8d21bc98f5951fd", `Je deviens expert, marche ${etoile}`);
  assert.equal(empreinte(series({mode: "custom", tables: [7], total: 20, questionTypes: ["division"]})), "3279314c51ced59e", "réglages libres : divisions");
  assert.equal(empreinte(series({mode: "custom", tables: [3, 7, 9], total: 20, questionTypes: ["direct", "missing", "division"]})), "64297727b6c7e319", "réglages libres : tout");
  assert.equal(empreinte(series(P.configEntraine(7, "desordre"))), "0ad6a1f2e8d99584", "Dans le désordre");
  assert.equal(empreinte(series({mode: "evaluation"})), "21efb5d71f49466f", "l'évaluation CM1");
  const p = parcoursPasse([2, 3, 4, 5, 6, 7, 8, 9], ["2-3", "4-7", "6-8"]);
  const plans = Array.from({length: 50}, (_, index) => P.planRevision(p, {random: graine(2000 + index), aujourdhui: "2026-09-12"}));
  assert.ok(plans.every(plan => plan.every(item => !item.type.startsWith("division"))), "trois calculs dus : pas de division");
  assert.equal(empreinte(plans), "5333b2dcbc52e95c", "Mes calculs du jour sans division : rien n'est tiré de plus");
});

test("rien de nouveau n'est enregistré : une division compte pour son calcul, quelle que soit son écriture", () => {
  let p = P.creerParcours();
  ECRITURES.forEach((type, index) => {
    const question = core.tableQuestion(type, index % 2 ? 8 : 7, index % 2 ? 7 : 8);
    assert.equal(question.factKey, "7-8");
    p = P.appliquerReponse(p, question.factKey, {correcte: true, date: `2026-10-0${index + 1}`}).parcours;
  });
  assert.deepEqual(Object.keys(p.calculs), ["7-8"], "une seule case : 7 × 8");
  assert.equal(P.VERSION, 3, "pas de changement de version");
  assert.doesNotMatch(JSON.stringify(p), /division|quotient|dividend|divisor/, "aucune écriture dans le parcours enregistré");
});

test("une division ratée se corrige avec sa multiplication, dans ses trois écritures", () => {
  const feedback = {className: "", textContent: ""};
  const montrer = new Function("$", "state", "renderInlineAnswer", "setAnswerControlsEnabled", `${source("showAnswerFeedback")}; return showAnswerFeedback;`)(
    id => (id === "answer-feedback" ? feedback : {focus() {}}),
    {casesMontrees: new Set(), configuration: {learnActivity: "ordered"}},
    () => {}, () => {});
  montrer(core.tableQuestion("division-dividend", 7, 4), false, 11);
  assert.equal(feedback.textContent, `Ta réponse${N}: 11. Bonne réponse${N}: 28, car 7${N}×${N}4${N}=${N}28.`, "? ÷ 7 = 4");
  montrer(core.tableQuestion("division-divisor", 7, 4), false, 4);
  assert.equal(feedback.textContent, `Ta réponse${N}: 4. Bonne réponse${N}: 7, car 7${N}×${N}4${N}=${N}28.`, "28 ÷ ? = 4");
  montrer(core.tableQuestion("division-divisor", 4, 7), false, null);
  assert.equal(feedback.textContent, `Pas de réponse. Bonne réponse${N}: 4, car 4${N}×${N}7${N}=${N}28.`, "28 ÷ ? = 7");
});

// Retouche demandée par Gwenaël sur la PR #957 (planche-pastilles-petits-telephones.png) :
// sur téléphone, les cinq pastilles tombaient en 2 + 2 + 1 (jusqu'à 360 px, et jusqu'à
// 390 px pour la table de 10) ou en 4 + 1 (table de 2). Désormais toujours 3 + 2 sous 768 px,
// les cinq sur une ligne au-dessus. Mesuré au navigateur, tables 2, 7, 9 et 10, de 320 à
// 1366 px (outils\mesure_rangs.py) ; ici, les règles et leur place APRÈS la règle de base.
// Lot « le tirage des questions » (10/10/2026, planche-pastilles-2plus2.png, choix de
// Gwenaël) : avant le test d'une table, quatre pastilles — 2 + 2 sous 768 px (les deux
// multiplications, puis les deux divisions) au lieu de 3 + 1 ; cinq au mélange : 3 + 2.
test("l'écran avant le test sur téléphone : 3 + 2 au mélange, 2 + 2 au test d'une table (saut forcé sous 768 px, pastilles qui rapetissent sous 430 px), après la règle de base", () => {
  const base = html.indexOf(".launch-exemple b { padding: 6px 11px;");
  const saut = html.indexOf(`@media (max-width: 767px) {
      .launch-exemple { row-gap: 4px; }
      .launch-exemple::before { content: ""; flex-basis: 100%; order: 1; }
      .launch-exemple b:nth-child(n + 4) { order: 2; }
      .launch-exemple b:first-child:nth-last-child(4) ~ b:nth-child(3) { order: 2; }
    }`);
  const petits = html.indexOf("@media (max-width: 429px) { .launch-exemple { column-gap: 6px; } .launch-exemple b { padding: 5px 7px; font-size: clamp(.85rem, 4.3vw, 1.15rem); } }");
  assert.ok(base > 0, "la règle de base des pastilles");
  assert.ok(saut > base, "le saut de ligne après la 3e pastille, après la règle de base");
  assert.ok(petits > base, "les pastilles plus petites sous 430 px, après la règle de base");
});

test("la page charge les moteurs du lot (leurs numéros montent) et le professeur a la même copie du moteur", async () => {
  assert.match(html, /<script src="\.\/defi_tables_core\.js\?v=20261015-1"><\/script>/);
  assert.match(html, /<script src="\.\/defi_tables_mon_parcours\.js\?v=20261023-3"><\/script>/);
  const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url), "utf8");
  const original = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
  assert.equal(copie, original);
});
