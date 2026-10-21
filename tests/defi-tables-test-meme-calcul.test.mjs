// Lot « test : pas deux fois le même calcul » (16/10/2026, décision de
// Gwenaël). Au test d'une table, chaque calcul de ×1 à ×10 sort deux fois
// (une fois en produit, une fois à l'envers). Avant : 18 sur 20 suffisaient,
// même avec les deux erreurs sur le même calcul — un élève pouvait ne pas
// savoir 7 × 8 du tout et passer sa table. Maintenant : 2 erreurs au plus, et
// jamais deux fois le même calcul. L'écran « Pas encore » dit alors
// « 18 sur 20 — mais 7 × 8 raté deux fois » (choix de Gwenaël) ; l'écran
// avant le test ne change pas (choix de Gwenaël). Mon mélange garde sa règle.
//
// Lot « test : une erreur au plus » (21/10/2026, décision de Gwenaël) : le
// test passe à 19 sur 20. 18 sur 20 ne suffit donc plus, même avec deux
// calculs différents ; la clé « rateDeuxFois » reste posée dans l'événement
// (le moteur la garde), mais l'écran dit « il en faut 19 ». Les tests
// ci-dessous sont mis à cette règle ; le détail est dans
// defi-tables-test-une-erreur.test.mjs.

process.env.TZ = "Indian/Reunion";

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const core = require("../outils/calcul_mental/defi_tables_core.js");
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
const copieServeur = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url), "utf8");

const DATE = "2026-10-16";
const n = config => core.normalizeConfiguration(config);
const jouer = (etat, config, correct, rates) => {
  const resultat = {correct, total: 20, date: DATE};
  if (rates !== undefined) resultat.rates = rates;
  return P.appliquerSerie(etat, n(config), resultat);
};
const evenement = (resultat, type) => resultat.evenements.find(item => item.type === type);

function fonction(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.ok(debut > 0, `la fonction ${nom} existe`);
  const fin = html.indexOf("\n      }\n", debut);
  return html.slice(debut, fin + "\n      }".length);
}

// Un générateur pseudo-aléatoire reproductible (les tirages du test).
function graine(depart) {
  let x = depart >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

test("calculRateDeuxFois : le premier calcul raté deux fois, sinon null", () => {
  assert.equal(P.calculRateDeuxFois(undefined), null, "sans liste : l'ancienne règle");
  assert.equal(P.calculRateDeuxFois(null), null);
  assert.equal(P.calculRateDeuxFois([]), null);
  assert.equal(P.calculRateDeuxFois(["7-8", "2-7"]), null, "deux calculs différents");
  assert.equal(P.calculRateDeuxFois(["7-8", "2-7", "7-8"]), "7-8");
  assert.equal(P.calculRateDeuxFois(["2-7", "7-8", "2-7", "7-8"]), "2-7", "le premier qui revient");
  assert.equal(P.calculRateDeuxFois(["1-7", "7-10", "1-7"]), "1-7", "×1 et ×10 comptent comme les autres");
  assert.equal(P.calculRateDeuxFois(["x", "x", "7-11", "7-11", "0-7", "0-7"]), null, "une clé qui n'est pas un calcul est ignorée");
  assert.equal(P.calculRateDeuxFois("7-8,7-8"), null, "pas une liste : ignorée");
});

test("le test : 18 sur 20 avec deux calculs différents ratés → pas encore depuis le 21/10 (une erreur au plus)", () => {
  const resultat = jouer(P.creerParcours(), P.configValidation(7), 18, ["7-8", "2-7"]);
  const validation = evenement(resultat, "validation");
  assert.equal(validation.reussi, false);
  assert.equal(validation.nouvelle, false);
  assert.equal("rateDeuxFois" in validation, false, "rien à signaler : c'est le seuil qui manque");
  assert.equal(resultat.parcours.tables[7].acquise, null);
});

test("le test : 18 sur 20 avec le même calcul raté deux fois → pas encore, et le calcul est nommé", () => {
  const resultat = jouer(P.creerParcours(), P.configValidation(7), 18, ["7-8", "7-8"]);
  const validation = evenement(resultat, "validation");
  assert.equal(validation.reussi, false);
  assert.equal(validation.rateDeuxFois, "7-8");
  assert.equal(validation.score, 18);
  assert.equal(validation.nouvelle, false);
  assert.equal(resultat.parcours.tables[7].acquise, null, "la table n'est pas passée");
  assert.equal(resultat.evenements.some(item => item.type === "toutes-acquises"), false);
});

test("le test : 19 et 20 sur 20 passent toujours ; 17 sur 20 reste raté", () => {
  assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7), 19, ["7-8"]), "validation").reussi, true);
  assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7), 20, []), "validation").reussi, true);
  const dixSept = evenement(jouer(P.creerParcours(), P.configValidation(7), 17, ["7-8", "2-7", "7-9"]), "validation");
  assert.equal(dixSept.reussi, false);
  assert.equal("rateDeuxFois" in dixSept, false, "17 sur 20 : c'est le seuil qui manque, pas un calcul");
});

test("sans liste des calculs ratés (un appel d'avant ce lot) : le seuil seul — 19 passe, 18 ne passe plus (21/10)", () => {
  assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7), 19), "validation").reussi, true);
  assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7), 18), "validation").reussi, false);
});

test("une table déjà passée reste passée, même ratée par un calcul raté deux fois", () => {
  const passee = jouer(P.creerParcours(), P.configValidation(7), 20, []).parcours;
  const resultat = jouer(passee, P.configValidation(7), 18, ["7-8", "7-8"]);
  const validation = evenement(resultat, "validation");
  assert.equal(validation.reussi, false);
  assert.equal(validation.dejaAcquise, true);
  assert.equal(resultat.parcours.tables[7].acquise, DATE);
});

test("« comme le test » (2 ou 3 minutes) suit la même règle", () => {
  const rate = evenement(jouer(P.creerParcours(), P.configValidation(7, 180), 18, ["7-8", "7-8"]), "preparation");
  assert.equal(rate.reussi, false);
  assert.equal(rate.rateDeuxFois, "7-8");
  assert.equal(rate.duree, 180);
  const deuxCalculs = evenement(jouer(P.creerParcours(), P.configValidation(7, 120), 18, ["7-8", "2-7"]), "preparation");
  assert.equal(deuxCalculs.reussi, false, "18 sur 20 ne suffit plus (21/10)");
  const reussi = evenement(jouer(P.creerParcours(), P.configValidation(7, 120), 19, ["7-8"]), "preparation");
  assert.equal(reussi.reussi, true);
  assert.equal("rateDeuxFois" in reussi, false);
});

test("Mon mélange garde sa règle : 18 sur 20 suffisent", () => {
  let etat = P.creerParcours();
  [2, 3].forEach(table => { etat = jouer(etat, P.configValidation(table), 20, []).parcours; });
  const melange = evenement(jouer(etat, P.configMelange(etat), 18, ["2-3", "2-3"]), "melange");
  assert.equal(melange.reussi, true);
  assert.equal("rateDeuxFois" in melange, false);
});

test("la règle a un sens : au test d'une table, chaque calcul ×1 à ×10 sort exactement deux fois", () => {
  for (const table of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    for (let essai = 0; essai < 40; essai += 1) {
      const questions = core.generateQuestions(P.configValidation(table), graine(table * 1000 + essai));
      assert.equal(questions.length, 20);
      const compte = new Map();
      questions.forEach(question => compte.set(question.factKey, (compte.get(question.factKey) || 0) + 1));
      assert.equal(compte.size, 10, `table de ${table} : 10 calculs`);
      compte.forEach((fois, cle) => assert.equal(fois, 2, `table de ${table} : ${cle} sort deux fois`));
    }
  }
});

test("la page envoie au moteur la clé de chaque question pas réussie — fausse, passée ou pas atteinte", () => {
  const calculsRates = new Function("state", `${fonction("calculsRatesDeLaSerie")}; return calculsRatesDeLaSerie();`);
  const state = {
    questions: [{factKey: "7-8"}, {factKey: "2-7"}, {factKey: "7-8"}, {factKey: "7-9"}, {factKey: "3-7"}],
    responses: [{correct: false}, {correct: true}, {correct: false, skipped: true}, {correct: true}]
  };
  assert.deepEqual(calculsRates(state), ["7-8", "7-8", "3-7"], "la 5e question n'a pas été atteinte : ratée");
  assert.match(html, /if \(state\.configuration\.mode === "validation"\) resultatSerie\.rates = calculsRatesDeLaSerie\(\);/, "seulement pour le test (et le mélange, qui l'ignore)");
});

test("de bout en bout : un vrai test de la table de 7, 7 × 8 raté dans les deux sens → pas encore", () => {
  const calculsRates = new Function("state", `${fonction("calculsRatesDeLaSerie")}; return calculsRatesDeLaSerie();`);
  const questions = core.generateQuestions(P.configValidation(7), graine(77));
  const repondre = fausses => questions.map(question => ({correct: !fausses.includes(question.factKey) || !(fausses.splice(fausses.indexOf(question.factKey), 1))}));
  const memeCalcul = {questions, responses: repondre(["7-8", "7-8"])};
  assert.equal(memeCalcul.responses.filter(reponse => reponse.correct).length, 18);
  const rate = evenement(jouer(P.creerParcours(), P.configValidation(7), 18, calculsRates(memeCalcul)), "validation");
  assert.equal(rate.reussi, false);
  assert.equal(rate.rateDeuxFois, "7-8");
  const deuxCalculs = {questions, responses: repondre(["7-8", "7-9"])};
  assert.equal(deuxCalculs.responses.filter(reponse => reponse.correct).length, 18);
  assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7), 18, calculsRates(deuxCalculs)), "validation").reussi, false, "deux calculs différents : 18 ne suffit plus (21/10)");
  const unCalcul = {questions, responses: repondre(["7-8"])};
  assert.equal(unCalcul.responses.filter(reponse => reponse.correct).length, 19);
  assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7), 19, calculsRates(unCalcul)), "validation").reussi, true, "une erreur : passée");
});

test("l'écran dit « 18 sur 20 — mais 7 × 8 raté deux fois », la table du test d'abord", () => {
  const libelle = new Function(`${fonction("libelleRateDeuxFois")}; return libelleRateDeuxFois;`)();
  const nb = " ";
  assert.equal(libelle({table: 7, rateDeuxFois: "7-8"}), `7${nb}×${nb}8`);
  assert.equal(libelle({table: 8, rateDeuxFois: "7-8"}), `8${nb}×${nb}7`);
  assert.equal(libelle({table: 7, rateDeuxFois: "7-7"}), `7${nb}×${nb}7`);
  assert.equal(libelle({table: 7, rateDeuxFois: "1-7"}), `7${nb}×${nb}1`);
  assert.equal(libelle({table: 7, rateDeuxFois: "7-10"}), `7${nb}×${nb}10`);
  assert.match(html, /const assez = principal\.rateDeuxFois && principal\.score >= seuilDe\(principal\);\s*verdict\.score = assez\s*\? `\$\{sur\(principal\.score, principal\.total\)\} — mais \$\{libelleRateDeuxFois\(principal\)\} raté\\u00a0deux\\u00a0fois`/, "« Pas encore »");
  assert.match(html, /const assez = principal\.rateDeuxFois && state\.correct >= seuilDe\(principal\);/, "« Temps écoulé » aussi (18 justes, le 20e calcul pas atteint)");
  assert.match(html, /<b>\$\{reussir\}|gras\.textContent = `\$\{reussir\}\\u00a0bonnes réponses`;/, "l'écran avant le test ne change pas");
  assert.doesNotMatch(html, /sans rater deux fois le même calcul/, "rien d'ajouté avant le test");
});

test("le moteur a changé : son numéro monte, et la copie du serveur reste identique", () => {
  assert.match(html, /<script src="\.\/defi_tables_mon_parcours\.js\?v=20261021-1"><\/script>/);
  assert.equal(copieServeur, moteur, "_serveur/public/prof/defi_tables_mon_parcours.js = outils/calcul_mental/defi_tables_mon_parcours.js");
});
