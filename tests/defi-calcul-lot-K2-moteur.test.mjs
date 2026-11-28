// Défi calcul, lot K2 « le professeur » (28/11/2026) — le MOTEUR.
// Ce que la page du professeur lit, étoile par étoile, dans resumeProf :
// `tentes`, `tenteLe`, `arrets`, `rate`, `retours`, `grille`, `echeances` —
// sans rien changer aux données, et sans retirer aucun champ d'avant.
// La règle « a réussi un retour » (retourReussi) : au-dessus de la boîte
// d'entrée — boîte 5 pour une étoile gagnée du premier coup à « Je tente »
// (entrée en boîte 4), boîte 3 sinon (entrée en boîte 2). Et la remise à
// zéro faite par le SERVEUR ({version, epoque + 1}, api/prof.php,
// eleves.recommencer) gagne en bloc à la fusion avec la copie de l'appareil.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";
import {readFileSync} from "node:fs";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const J = "2026-06-01";
const plus = n => P.ajouterJours(J, n);
const de = cle => { const [module, niveau] = cle.split("-"); return {module, niveau: Number(niveau)}; };
const o = jour => ({aujourdhui: jour, carte: CARTE, seance: false, source: 7});
const justes = () => Array.from({length: 6}, () => ({juste: true, ms: 1500}));
const rates = () => [{juste: false, ms: 1500}, {juste: false, ms: 1500}];
const lecon = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const arretee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const exiger = (r, quoi) => { assert.equal(r.refuse, undefined, `${quoi} : ${r.refuse}`); return r.parcours; };
const tenter = (p, cle, jour) => exiger(P.appliquerTentative(p, Object.assign(de(cle), {reponses: justes()}), o(jour)), `Je tente ${cle}`);
const rater = (p, cle, jour) => exiger(P.appliquerTentative(p, Object.assign(de(cle), {reponses: rates()}), o(jour)), `Je tente raté ${cle}`);
const apprendre = (p, cle, jour) => exiger(P.appliquerSerie(p, Object.assign(de(cle), {genre: "apprends", reponses: lecon()}), o(jour)), `J'apprends ${cle}`);
const arreter = (p, cle, jour) => exiger(P.appliquerSerie(p, Object.assign(de(cle), {genre: "apprends", reponses: arretee()}), o(jour)), `J'apprends arrêté ${cle}`);
const retour = (p, cle, jour, juste) => exiger(P.appliquerRetour(p, Object.assign(de(cle), {juste, ms: 1500, type: "P"}), {aujourdhui: jour, carte: CARTE}), `retour ${cle}`);
const rateRetour = (p, cle, jour) => retour(retour(p, cle, jour, false), cle, jour, false);
// L'étoile telle que la page la lit.
function lue(p, cle, jour) {
  const {module, niveau} = de(cle);
  const m = P.resumeProf(p, CARTE, jour).modules.find(x => x.id === module);
  const i = niveau - 1;
  return {grille: m.grille[i], boite: m.boites[i], retours: m.retours[i], rate: m.rate[i], tentes: m.tentes[i], tenteLe: m.tenteLe[i], arrets: m.arrets[i], echeance: m.echeances[i]};
}
const A = "A1-1";

test("gagnée du premier coup à « Je tente » : « gagnée » en boîte 4 ; un retour réussi (boîte 5) : « tenue »", () => {
  let p = tenter(P.creerParcours(), A, J);
  assert.deepEqual(lue(p, A, J), {grille: "gagnee", boite: 4, retours: 0, rate: 0, tentes: 0, tenteLe: null, arrets: 0, echeance: plus(7)});
  p = retour(p, A, plus(7), true);
  assert.deepEqual([lue(p, A, plus(7)).grille, lue(p, A, plus(7)).boite, lue(p, A, plus(7)).retours], ["tenu", 5, 1]);
});

test("apprise par J'apprends : « gagnée » en boîte 2 ; un retour réussi (boîte 3) : « tenue » — la règle de la passe 1 (« dès la boîte 2 ») était fausse", () => {
  let p = apprendre(P.creerParcours(), A, J);
  assert.deepEqual([lue(p, A, J).grille, lue(p, A, J).boite, lue(p, A, J).retours], ["gagnee", 2, 0], "la boîte 2 est sa boîte d'entrée : pas de retour encore");
  p = retour(p, A, plus(1), true);
  assert.deepEqual([lue(p, A, plus(1)).grille, lue(p, A, plus(1)).boite], ["tenu", 3]);
});

test("un retour raté : « ratée au dernier retour » (elle reste, descend d'une boîte) ; le 2e de suite : « perdue » ; regagnée, elle repart de la boîte 2, même gagnée du premier coup la première fois", () => {
  let p = tenter(P.creerParcours(), A, J);
  p = rateRetour(p, A, plus(7));
  assert.deepEqual([lue(p, A, plus(7)).grille, lue(p, A, plus(7)).boite, lue(p, A, plus(7)).rate], ["rate", 3, 1]);
  p = rateRetour(p, A, plus(8));
  assert.deepEqual([lue(p, A, plus(8)).grille, lue(p, A, plus(8)).boite, lue(p, A, plus(8)).rate], ["perdue", 0, 0]);
  p = tenter(p, A, plus(8));
  assert.deepEqual([lue(p, A, plus(8)).grille, lue(p, A, plus(8)).boite], ["gagnee", 2], "regagnée : boîte 2, pas encore tenue");
  p = retour(p, A, plus(9), true);
  assert.deepEqual([lue(p, A, plus(9)).grille, lue(p, A, plus(9)).boite], ["tenu", 3], "boîte 3 : tenue (sa date « solide » est restée celle du gain, mais elle a été perdue)");
});

test("un retour réussi APRÈS un raté la ramène à sa boîte d'entrée : « gagnée », pas « tenue »", () => {
  let p = tenter(P.creerParcours(), A, J);
  p = rateRetour(p, A, plus(7));
  p = retour(p, A, plus(8), true);
  assert.deepEqual([lue(p, A, plus(8)).grille, lue(p, A, plus(8)).boite, lue(p, A, plus(8)).rate], ["gagnee", 4, 0]);
});

test("« Je tente » raté : « essayée », tentes 1 puis 2, et le jour du dernier ; gagnée ensuite : plus de jour", () => {
  let p = rater(P.creerParcours(), A, J);
  assert.deepEqual([lue(p, A, J).grille, lue(p, A, J).tentes, lue(p, A, J).tenteLe], ["essai", 1, J]);
  p = rater(p, A, plus(1));
  assert.deepEqual([lue(p, A, plus(1)).grille, lue(p, A, plus(1)).tentes, lue(p, A, plus(1)).tenteLe], ["essai", 2, plus(1)]);
  p = apprendre(p, A, plus(2));
  assert.deepEqual([lue(p, A, plus(2)).grille, lue(p, A, plus(2)).tentes, lue(p, A, plus(2)).tenteLe], ["gagnee", 0, null]);
});

test("J'apprends arrêté : « essayée », arrets 1, 2 ; au 3e : « à voir en classe »", () => {
  let p = arreter(P.creerParcours(), A, J);
  assert.deepEqual([lue(p, A, J).grille, lue(p, A, J).arrets], ["essai", 1]);
  p = arreter(p, A, plus(1));
  assert.deepEqual([lue(p, A, plus(1)).grille, lue(p, A, plus(1)).arrets], ["essai", 2]);
  p = arreter(p, A, plus(2));
  assert.deepEqual([lue(p, A, plus(2)).grille, lue(p, A, plus(2)).arrets], ["classe", 3]);
});

test("rien de fait : « vide » ; etatGrille et retourReussi sont rendus par le moteur", () => {
  assert.equal(lue(P.creerParcours(), A, J).grille, "vide");
  assert.equal(typeof P.etatGrille, "function");
  assert.equal(typeof P.retourReussi, "function");
});

test("resumeProf : les champs neufs ont la longueur du module, et tous les champs d'avant sont toujours là", () => {
  const ref = JSON.parse(readFileSync(new URL("../_serveur/tests/parcours-reference-defi-calcul.json", import.meta.url), "utf8"));
  const r = P.resumeProf(ref, CARTE, "2026-11-28");
  for (const champ of ["lisible", "commence", "sues", "entrees", "total", "paliers", "ouvert", "modules", "revoir", "aVoir", "rouges", "causes", "seances", "semaines", "journal", "ceintures", "dernier"]) {
    assert.ok(champ in r, `champ ${champ}`);
  }
  const ETATS = ["tenu", "gagnee", "rate", "perdue", "essai", "classe", "vide"];
  r.modules.forEach(m => {
    for (const champ of ["id", "construit", "niveaux", "etats", "paliers", "boites", "su", "vu", "entrees", "sues", "perdues"]) assert.ok(champ in m, `${m.id}.${champ}`);
    for (const champ of ["tentes", "tenteLe", "arrets", "rate", "retours", "grille", "echeances"]) assert.equal(m[champ].length, m.boites.length, `${m.id}.${champ}`);
    m.grille.forEach(e => assert.ok(ETATS.includes(e), `${m.id} : ${e}`));
    m.tentes.forEach(n => assert.ok(n >= 0 && n <= 2));
    m.arrets.forEach(n => assert.ok(n >= 0 && n <= 9));
    m.rate.forEach(n => assert.ok(n === 0 || n === 1));
  });
});

test("la remise à zéro du SERVEUR ({version, epoque + 1}) gagne en bloc à la fusion, dans les deux sens ; l'appareil la relit vide", () => {
  let p = tenter(P.creerParcours(), A, J);
  p = P.normaliserParcours(p, {aujourdhui: J});
  p.epoque = 3;
  const serveur = {version: 15, epoque: 4};
  const lu = P.normaliserParcours(serveur, {aujourdhui: J});
  assert.equal(lu.epoque, 4);
  assert.equal(Object.keys(lu.modules).length, 0);
  for (const [a, b] of [[p, lu], [lu, p]]) {
    const f = P.fusionner(a, b, {aujourdhui: J, carte: CARTE});
    assert.equal(f.epoque, 4);
    assert.deepEqual([Object.keys(f.modules).length, f.seances.length], [0, 0], "l'ancien travail ne revient pas");
  }
  assert.deepEqual(P.remettreAZero(p).epoque, 4, "la même époque que remettreAZero() du moteur");
});

test("les deux copies du moteur restent identiques", () => {
  const a = readFileSync(new URL("../outils/calcul_mental/defi_calcul_mon_parcours.js", import.meta.url), "utf8");
  const b = readFileSync(new URL("../_serveur/public/prof/defi_calcul_mon_parcours.js", import.meta.url), "utf8");
  assert.equal(a, b);
});
