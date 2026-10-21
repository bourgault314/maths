// Lot « test : une erreur au plus » (21/10/2026, décision de Gwenaël).
// Au test d'une table (« Je passe le test », 20 questions en 1 min 30) et à
// « Comme le test » (2 ou 3 minutes) : UNE erreur au plus, 19 sur 20 — « une
// erreur, c'est une faute de frappe ; deux, l'élève ne connaît pas son
// résultat ». Mon mélange garde 18 sur 20, les étoiles 23 sur 25, la
// couronne et les records 25 sur 25. Une table déjà passée reste passée.

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

const DATE = "2026-10-21";
const n = config => core.normalizeConfiguration(config);
const jouer = (etat, config, correct, rates, total = 20) => {
  const resultat = {correct, total, date: DATE};
  if (rates !== undefined) resultat.rates = rates;
  return P.appliquerSerie(etat, n(config), resultat);
};
const evenement = (resultat, type) => resultat.evenements.find(item => item.type === type);
const passer = (etat, tables) => tables.reduce((suite, table) => jouer(suite, P.configValidation(table), 20, []).parcours, etat);

test("les seuils : test 1 erreur, mélange 2, étoiles 2, couronne et records 0", () => {
  assert.equal(P.SEUILS.validation.total, 20);
  assert.equal(P.SEUILS.validation.erreursMax, 1, "le test d'une table : 19 sur 20");
  assert.equal(P.SEUILS.melange.erreursMax, 2, "Mon mélange : inchangé, 18 sur 20");
  assert.equal(P.SEUILS.etoile.erreursMax, 2, "les quatre étoiles : inchangées, 23 sur 25");
  assert.equal(P.erreursMaxEtoile(5), 0, "la couronne : 25 sur 25, inchangée");
  assert.equal(P.SEUILS.course.erreursMax, 0, "les records : 25 sur 25, inchangés");
});

test("le test : 20 et 19 sur 20 passent ; 18 ne passe plus, quels que soient les calculs ratés", () => {
  assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7), 20, []), "validation").reussi, true);
  const dixNeuf = jouer(P.creerParcours(), P.configValidation(7), 19, ["7-8"]);
  assert.equal(evenement(dixNeuf, "validation").reussi, true, "une faute de frappe : passée");
  assert.equal(dixNeuf.parcours.tables[7].acquise, DATE);
  for (const rates of [["7-8", "2-7"], ["7-8", "7-8"], undefined]) {
    const resultat = jouer(P.creerParcours(), P.configValidation(7), 18, rates);
    assert.equal(evenement(resultat, "validation").reussi, false, `18 sur 20 (${JSON.stringify(rates)}) : pas encore`);
    assert.equal(resultat.parcours.tables[7].acquise, null);
  }
});

test("« Comme le test » (2 ou 3 minutes) suit la même règle", () => {
  for (const duree of [120, 180]) {
    assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7, duree), 19, ["7-8"]), "preparation").reussi, true);
    assert.equal(evenement(jouer(P.creerParcours(), P.configValidation(7, duree), 18, ["7-8", "2-7"]), "preparation").reussi, false);
  }
});

test("une table déjà passée reste passée (rien de rétroactif)", () => {
  const passee = passer(P.creerParcours(), [7]);
  const resultat = jouer(passee, P.configValidation(7), 18, ["7-8", "2-7"]);
  assert.equal(evenement(resultat, "validation").reussi, false);
  assert.equal(evenement(resultat, "validation").dejaAcquise, true);
  assert.equal(resultat.parcours.tables[7].acquise, DATE, "elle reste passée");
});

test("Mon mélange garde 2 erreurs : 18 sur 20 gagne la coupe des 3 tables", () => {
  const etat = passer(P.creerParcours(), [2, 3, 5]);
  const melange = evenement(jouer(etat, P.configMelange(etat), 18, ["2-3", "3-5"]), "melange");
  assert.equal(melange.reussi, true);
  assert.equal(melange.trophee, 3);
  assert.equal(evenement(jouer(etat, P.configMelange(etat), 17, []), "melange").reussi, false);
});

test("les étoiles gardent 2 erreurs sur 25, la couronne aucune", () => {
  const etat = passer(P.creerParcours(), P.TABLES);
  assert.equal(evenement(jouer(etat, P.configEtoile(1), 23, undefined, 25), "etoile").reussi, true, "1re étoile à 23 sur 25");
  assert.equal(evenement(jouer(etat, P.configEtoile(1), 22, undefined, 25), "etoile").reussi, false);
});

test("les textes : notice, écran avant le test, verdict raté, phrase après « Comme le test »", () => {
  assert.match(html, /«&nbsp;Je passe le test&nbsp;»&nbsp;: 20&nbsp;questions en 1&nbsp;min&nbsp;30, une erreur au plus\.<\/p>/, "« Comment ça marche ? »");
  assert.doesNotMatch(html, /2&nbsp;erreurs au plus/);
  assert.doesNotMatch(html, /vise 18 sur 20/);
  assert.match(html, /`Continue à t’entraîner, puis vise \$\{PARCOURS\.SEUILS\.validation\.total - PARCOURS\.SEUILS\.validation\.erreursMax\} sur \$\{PARCOURS\.SEUILS\.validation\.total\} en 1 min 30\.`/, "le nombre vient du moteur : 19");
  // L'écran avant le test et le verdict lisent le seuil du moteur.
  assert.match(html, /reussir = S\.validation\.total - S\.validation\.erreursMax;/);
  assert.match(html, /return regle \? evenement\.total - PARCOURS\.SEUILS\[regle\]\.erreursMax : null;/);
});

test("le verdict raté : 18 sur 20 avec le même calcul raté deux fois dit « il en faut 19 », pas « mais … deux fois »", () => {
  const debut = html.indexOf("      function seuilDe(");
  const fin = html.indexOf("\n      }\n", debut);
  const seuilDe = new Function("PARCOURS", `${html.slice(debut, fin + "\n      }".length)}; return seuilDe;`)(P);
  const rate = evenement(jouer(P.creerParcours(), P.configValidation(7), 18, ["7-8", "7-8"]), "validation");
  assert.equal(rate.reussi, false);
  assert.equal(seuilDe(rate), 19);
  const assez = rate.rateDeuxFois && rate.score >= seuilDe(rate);
  assert.equal(assez, false, "la phrase « mais 7 × 8 raté deux fois » ne peut plus sortir : l'écran dit « il en faut 19 »");
});

test("le moteur a changé : son numéro monte, et la copie du serveur reste identique", () => {
  assert.match(html, /<script src="\.\/defi_tables_mon_parcours\.js\?v=20261021-1"><\/script>/);
  assert.equal(copieServeur, moteur);
});
