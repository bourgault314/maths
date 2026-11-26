// Défi calcul, lot 1 « la séance » (12/11/2026, planches validées par
// Gwenaël) : le MOTEUR. La séance au temps (10 ou 15 minutes), le palier, le
// 2e calcul après un faux, le « lent » deux fois de suite, le test à 3 sur 4,
// les sortes. Les pages : defi-calcul-rythme-f1.test.mjs ; le serveur :
// _serveur/tests/lancer.php.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
// Lot F4 : ces tests suivent le parcours module par module — les tests de
// palier y sont déjà joués (tests/defi-calcul-lot-F4.test.mjs les joue).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});
const CARTE = CORE.carte();
const J = "2026-11-16";
const plus = n => P.ajouterJours(J, n);
const reussie = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const ratee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const types = (p, jour = J, options = {}) => P.fileSeance(p, CARTE, Object.assign({aujourdhui: jour}, options)).etapes.map(e => e.type);
const tester = (p, module, marche, jour = J, options = {}) => P.appliquerTest(p, {module, marche,
  niveaux: Array.from({length: Math.min(P.NIVEAUX[module], marche + 1)}, (_, i) => ({niveau: i + 1, justes: i < marche ? 3 : 1, total: 3}))},
  Object.assign({aujourdhui: jour, carte: CARTE, seance: true}, options));
// Lot 2 « J'apprends en une étape » : J'apprends contient l'entraînement.
const apprendre = (p, module, niveau, jour = J, reponses = reussie()) => P.appliquerSerie(p, {module, niveau, genre: "apprends", reponses}, {aujourdhui: jour, carte: CARTE, seance: true});
// Lot 7e-2 (choix de Gwenaël, « retester au lieu d'imposer J'apprends ») :
// un niveau pas encore joué a son test ; raté, il s'apprend.
const raterMarche = (p, module, niveau, jour = J) => P.appliquerTest(p, {module, marche: 0, niveaux: [{niveau, justes: 1, total: 3}]},
  {aujourdhui: jour, carte: CARTE, seance: true}).parcours;

// Un élève qui sait A1 (test passé il y a une semaine), tout dû aujourd'hui.
function eleveA1() {
  let p = P.ouvrirSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: plus(-7)});
  p = tester(p, "A1", 3, plus(-7)).parcours;
  p.modules.A1.e = [J, J, J];
  p.seance = {jour: null, etape: 0, n: 1, p: Array(11).fill(0), j: [0, 0, 0, 0, 0, 0]};
  return P.normaliserParcours(p);
}

test("les sortes : un 2e calcul d'une autre sorte (sinon d'une autre écriture) ; la sorte change d'un retour à l'autre", () => {
  ["A3-1", "M2-1", "A5-3", "A1-2", "M4-1"].forEach(cle => {
    const sortes = CORE.sortesDe(cle).map(s => s.n);
    for (let graine = 1; graine <= 20; graine += 1) {
      const premier = CORE.genererUn(cle, graine, {tour: graine});
      const deuxieme = CORE.genererUn(cle, graine + 1000, {autreQue: premier});
      assert.notEqual(CORE.sorteDe(deuxieme), CORE.sorteDe(premier), `${cle} graine ${graine}`);
    }
    const vues = new Set(Array.from({length: sortes.length}, (_, tour) => CORE.sorteDe(CORE.genererUn(cle, 7, {tour}))));
    assert.equal(vues.size, sortes.length, `${cle} : en ${sortes.length} retours, chaque sorte une fois`);
  });
  assert.deepEqual(CORE.sortesDe("M2-1").map(s => s.nom), ["× 10", "× 100"]);  // lot 7e : × 1 000 au CM1
});

test("les réglages dans l'onglet : la durée et le palier, liés au code ; rien de lisible : 10 minutes, tout", () => {
  const m = new Map();
  const onglet = {getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k)};
  assert.deepEqual(P.chargerReglagesOnglet(onglet, "7K3M9P"), {minutes: 10, palier: 4});
  assert.equal(P.sauverReglagesOnglet(onglet, "7K3M9P", {"defi-calcul": {minutes: 15, palier: 2}}), true);
  assert.deepEqual(P.chargerReglagesOnglet(onglet, "7K3M9P"), {minutes: 15, palier: 2});
  assert.deepEqual(P.chargerReglagesOnglet(onglet, "2222AA"), {minutes: 10, palier: 4}, "un autre code");
  assert.deepEqual(P.reglagesDeSeance({"defi-calcul": {minutes: "15", palier: 9, nouveautes: 3}}), {minutes: 10, palier: 4});
  P.sauverReglagesOnglet(onglet, "7K3M9P", {});
  assert.equal(m.size, 0, "les défauts : rien de rangé");
  assert.equal(P.sauverReglagesOnglet(onglet, "7K3M9P", null), false, "une réponse sans réglages ne touche à rien");
});
