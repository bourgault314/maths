// Défi calcul, lot 1a : la progression (version 1), la validation d'un
// niveau, le mélange, la file de la séance, la fusion, le rangement par code,
// et l'hygiène de la page (fiche technique § 9, points 4, 5 et 8).

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

import {CLES_DECLAREES, parcoursComplet} from "../scripts/generer-parcours-reference-defi-calcul.mjs";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");

const CARTE = CORE.carte();
// La carte sans l'essai : aucun pilote ouvert d'office, tout est construit.
const CARTE_OUVERTE = CARTE.map(fiche => Object.assign({}, fiche, {pilote: false, construit: fiche.palier > 0}));
const JOUR = "2026-10-06";
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

function fauxStockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    cles: () => [...m.keys()],
    brut: k => m.get(k)
  };
}

const reponses = (justes, total, ms = 2000) => Array.from({length: total}, (_, i) => ({juste: i < justes, ms}));
const valider = (parcours, module, niveau, {type = "P", jour = JOUR, carte = CARTE, liste = null} = {}) =>
  P.appliquerSerie(parcours, {module, niveau, genre: "valide", type, reponses: liste || reponses(type === "F" ? 12 : 10, type === "F" ? 12 : 10)}, {aujourdhui: jour, carte});

// Tous les niveaux d'un module validés, dans l'ordre.
function validerTout(parcours, module, options) {
  for (let n = 1; n <= P.NIVEAUX[module]; n += 1) parcours = valider(parcours, module, n, options).parcours;
  return parcours;
}

// Un parcours où `modules` ont chacun leur premier niveau validé à `jour`.
function avecValides(modules, jour = "2026-10-01") {
  return modules.reduce((parcours, id) => valider(parcours, id, 1, {jour, carte: CARTE_OUVERTE}).parcours, P.creerParcours());
}

test("le format : version 1, rien d'autre que ce que la fiche décrit", () => {
  const neuf = P.creerParcours();
  assert.deepEqual(neuf, {version: 1, epoque: 0, prenom: "", mod: "", modules: {}, seance: {jour: null, etape: 0, n: 0}, seances: [], jours: []});
  assert.equal(P.estVide(neuf), true);
  const {parcours} = valider(neuf, "A5", 1);
  assert.deepEqual(parcours.modules.A5, {
    vu: JOUR, ok: null, nv: 2, v: [1, 0, 0, 0], a: [0, 0, 0, 0], t: [20, 0, 0, 0], f: [1, 0, 0, 0],
    err: 0, r: false, c: {}, b: 1, e: "2026-10-07"
  });
  assert.equal(P.estVide(parcours), false);
  assert.equal(P.CLE_STOCKAGE, "mathsgo-defi-calcul-parcours");
  assert.equal(P.CLE_SYNC, "mathsgo-defi-calcul-sync");
  assert.equal(P.CLE_SEL, "mathsgo-defi-calcul-sel");
  assert.equal(P.CODES.length, 71);
});

test("normaliserParcours : idempotente, et sourde à ce qu'elle ne connaît pas", () => {
  const complet = parcoursComplet();
  assert.deepEqual(P.normaliserParcours(complet), complet, "la référence ressort identique");
  assert.deepEqual(P.normaliserParcours(JSON.parse(JSON.stringify(complet))), complet);
  const forge = {
    version: 9, epoque: -3, prenom: "  Léa   Martin  et un très long texte libre  ", mod: "Z9", intrus: "x",
    modules: {
      A5: {vu: "hier", ok: "2026-10-01", nv: 12, v: [1, 7, "x"], a: null, t: [99999], f: [-1, 3], b: 9, e: "bientôt", err: -4, r: "oui",
        c: {1: 3, 2: 0, abc: 4, 99: 12000, 3: "x"}, texte: "libre"},
      Z9: {v: [1]},
      M2: "n'importe quoi"
    },
    seance: {jour: "2026-13-99x", etape: 9, n: -1}, seances: ["2026-10-01", "x", 4], jours: ["2026-10-02", "2026-10-02", null]
  };
  const propre = P.normaliserParcours(forge);
  assert.deepEqual(P.normaliserParcours(propre), propre, "idempotente");
  assert.equal(propre.version, 1);
  assert.equal(propre.epoque, 0);
  assert.equal(propre.prenom.length, 20);
  assert.equal(propre.mod, "");
  assert.deepEqual(Object.keys(propre.modules), ["M2", "A5"], "les codes inconnus sont écartés, l'ordre est celui de la carte");
  assert.deepEqual(propre.modules.A5, {vu: null, ok: null, nv: 1, v: [1, 0, 0, 0], a: [0, 0, 0, 0], t: [0, 0, 0, 0], f: [0, 3, 0, 0],
    err: 0, r: false, c: {1: 3}, b: 1, e: propre.modules.A5.e});
  assert.match(propre.modules.A5.e, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal("b" in propre.modules.M2, false, "pas de boîte sans niveau validé");
  assert.deepEqual(propre.seance, {jour: null, etape: 0, n: 0});
  assert.deepEqual(propre.seances, ["2026-10-01"]);
  assert.deepEqual(propre.jours, ["2026-10-02"]);
  assert.deepEqual(P.normaliserParcours(null), P.creerParcours());
});

test("la référence tient dans ce que le serveur accepte, et ne porte que des clés déclarées", () => {
  const complet = parcoursComplet();
  const mesure = P.mesurer(complet);
  assert.ok(mesure.cles < 2000, `${mesure.cles} clés (2 000 au plus)`);
  assert.ok(mesure.octets < 40000, `${mesure.octets} octets (40 000 au plus)`);
  assert.equal(Object.keys(complet.modules).length, 71);
  // 12 causes par module, le plafond du moteur : toujours sous les limites.
  const pire = P.mesurer(parcoursComplet({causes: P.SEUILS.causes}));
  assert.ok(pire.cles < 2000 && pire.octets < 40000, `pire cas : ${pire.cles} clés, ${pire.octets} octets`);
  const permises = new Set([...CLES_DECLAREES, ...P.CODES]);
  const parcourir = valeur => {
    if (Array.isArray(valeur)) valeur.forEach(parcourir);
    else if (valeur && typeof valeur === "object") Object.entries(valeur).forEach(([cle, v]) => {
      assert.ok(permises.has(cle) || /^\d{1,2}$/.test(cle), `clé non déclarée : ${cle}`);
      parcourir(v);
    });
  };
  parcourir(complet);
  // Aucun texte libre : hors dates et codes de module, tout est nombre, booléen ou null.
  const textes = [];
  const chercher = valeur => {
    if (typeof valeur === "string") textes.push(valeur);
    else if (Array.isArray(valeur)) valeur.forEach(chercher);
    else if (valeur && typeof valeur === "object") Object.values(valeur).forEach(chercher);
  };
  chercher(complet);
  textes.forEach(texte => assert.ok(texte === "" || /^\d{4}-\d{2}-\d{2}$/.test(texte) || P.CODES.includes(texte), `texte inattendu : ${texte}`));
});

test("valider un fait : 10 justes sur 12 ET 4 s par calcul en moyenne", () => {
  const cas = (justes, ms) => P.verdictValidation("F", reponses(justes, 12, ms));
  assert.equal(cas(12, 2000).valide, true);
  assert.equal(cas(10, 4000).valide, true, "10 justes, 4,0 s pile");
  assert.equal(cas(9, 1000).valide, false, "9 justes ne suffisent pas");
  const lent = cas(10, 4100);
  assert.equal(lent.valide, false, "10 justes mais 4,1 s en moyenne");
  assert.equal(lent.tropLent, true);
  assert.equal(cas(9, 9000).tropLent, false, "« trop lentement » ne se dit qu'à qui a assez de justes");
  // La moyenne compte TOUS les calculs, les faux et les passés aussi.
  const melange = [...reponses(10, 10, 3000), {juste: false, ms: 9500}, {juste: false, ms: 9500}];
  assert.equal(P.verdictValidation("F", melange).valide, false, "(10 × 3 + 2 × 9,5) / 12 = 4,08 s");
  const {parcours, verdict, evenements} = valider(P.creerParcours(), "A2", 1, {type: "F", liste: reponses(10, 12, 4100)});
  assert.equal(verdict.valide, false);
  assert.deepEqual(parcours.modules.A2.v, [0, 0, 0, 0], "trop lentement : niveau non validé");
  assert.deepEqual(parcours.modules.A2.f, [1, 0, 0, 0], "la série est comptée");
  assert.equal(parcours.modules.A2.nv, 1);
  assert.deepEqual(evenements, []);
  assert.equal(valider(P.creerParcours(), "A2", 1, {type: "F", liste: reponses(10, 12, 3900)}).parcours.modules.A2.t[0], 39, "temps moyen en dixièmes de seconde");
});

test("valider une procédure : 8 justes sur 10, « juste, mais trop long » au-delà de 30 s", () => {
  const cas = liste => P.verdictValidation("P", liste);
  assert.equal(cas(reponses(8, 10)).valide, true);
  assert.equal(cas(reponses(7, 10)).valide, false);
  assert.equal(cas(reponses(10, 10, 30000)).valide, true, "30 s pile compte encore");
  const unLent = reponses(8, 10);
  unLent[2] = {juste: true, ms: 30001};
  const verdict = cas(unLent);
  assert.equal(verdict.valide, false, "8 justes dont un trop long : 7 comptés");
  assert.equal(verdict.justes, 7);
  assert.deepEqual(verdict.lents, [2]);
  const large = reponses(9, 10);
  large[0] = {juste: true, ms: 45000};
  assert.equal(cas(large).valide, true, "9 justes dont un trop long : 8 comptés");
  // Un calcul faux et lent n'est pas « juste, mais trop long ».
  const faux = reponses(8, 10);
  faux[9] = {juste: false, ms: 60000};
  assert.deepEqual(cas(faux).lents, []);
  // Une procédure lente en moyenne se valide : pas de règle des 4 s.
  assert.equal(cas(reponses(8, 10, 20000)).valide, true);
  assert.equal(cas(reponses(8, 10, 20000)).tropLent, false);
});

test("valider un niveau : boîte, niveau suivant, module validé quand tous ses niveaux le sont", () => {
  let etat = valider(P.creerParcours(), "A5", 1);
  assert.deepEqual(etat.evenements, [{type: "niveau", module: "A5", niveau: 1}]);
  assert.equal(etat.parcours.modules.A5.nv, 2, "la séance propose le niveau suivant");
  assert.equal(etat.parcours.modules.A5.b, 1, "le module entre dans le mélange dès son premier niveau validé");
  assert.equal(etat.parcours.modules.A5.e, P.ajouterJours(JOUR, 1), "il revient le lendemain");
  assert.equal(etat.parcours.modules.A5.ok, null, "il n'est « validé » qu'au dernier niveau");
  assert.deepEqual(etat.parcours.jours, [JOUR]);
  // Un deuxième niveau validé ne remet pas la boîte à 1.
  etat.parcours.modules.A5.b = 3;
  etat.parcours.modules.A5.e = "2026-10-20";
  etat = valider(etat.parcours, "A5", 2, {jour: "2026-10-07"});
  assert.equal(etat.parcours.modules.A5.b, 3);
  assert.equal(etat.parcours.modules.A5.e, "2026-10-20");
  assert.equal(etat.parcours.modules.A5.nv, 3);
  etat = valider(etat.parcours, "A5", 3, {jour: "2026-10-08"});
  etat = valider(etat.parcours, "A5", 4, {jour: "2026-10-09"});
  assert.equal(etat.parcours.modules.A5.ok, "2026-10-09");
  assert.deepEqual(etat.evenements, [{type: "niveau", module: "A5", niveau: 4}, {type: "module", module: "A5", suivant: "A2"}]);
  assert.equal(etat.parcours.mod, "A2", "le module suivant devient Mon module");
  assert.equal(etat.parcours.modules.A5.nv, 4);
  // Revalider ne change pas la date.
  assert.equal(valider(etat.parcours, "A5", 4, {jour: "2026-10-12"}).parcours.modules.A5.ok, "2026-10-09");
  // Niveaux libres : le dernier niveau seul ne valide pas le module.
  const direct = valider(P.creerParcours(), "A5", 4);
  assert.equal(direct.parcours.modules.A5.ok, null);
  assert.deepEqual(direct.parcours.modules.A5.v, [0, 0, 0, 1]);
  assert.equal(P.estValide(direct.parcours, "A5"), false);
  assert.deepEqual(direct.evenements, [{type: "niveau", module: "A5", niveau: 4}]);
  assert.equal(direct.parcours.modules.A5.nv, 1, "ensuite : le premier niveau pas encore validé");
  // Dans le désordre (4, 2, 1, 3) : validé au dernier niveau qui manquait.
  let desordre = valider(direct.parcours, "A5", 2);
  assert.equal(desordre.parcours.modules.A5.nv, 1);
  desordre = valider(desordre.parcours, "A5", 1);
  assert.equal(desordre.parcours.modules.A5.nv, 3);
  assert.equal(desordre.parcours.modules.A5.ok, null);
  desordre = valider(desordre.parcours, "A5", 3, {jour: "2026-10-09"});
  assert.equal(desordre.parcours.modules.A5.ok, "2026-10-09");
  assert.deepEqual(desordre.evenements, [{type: "niveau", module: "A5", niveau: 3}, {type: "module", module: "A5", suivant: "A2"}]);
  // Une progression abîmée : « ok » sans tous les niveaux ne tient pas.
  const abime = P.normaliserParcours(Object.assign(P.creerParcours(), {modules: {A5: Object.assign({}, direct.parcours.modules.A5, {ok: JOUR})}}));
  assert.equal(abime.modules.A5.ok, null);
  // Une validation ratée : rien ne bouge, sauf le compteur de séries.
  const rate = P.appliquerSerie(P.creerParcours(), {module: "A5", niveau: 1, genre: "valide", type: "P", reponses: reponses(7, 10)}, {aujourdhui: JOUR, carte: CARTE});
  assert.equal(rate.verdict.valide, false);
  assert.deepEqual(rate.parcours.modules.A5.v, [0, 0, 0, 0]);
  assert.equal("b" in rate.parcours.modules.A5, false);
});

test("s'entraîner et apprendre : ce qui est compté", () => {
  const serie = {module: "A5", niveau: 2, genre: "entraine", type: "P", reponses: reponses(8, 10), causes: {1: 2, 3: 1}};
  let etat = P.appliquerSerie(P.creerParcours(), serie, {aujourdhui: JOUR, carte: CARTE});
  assert.deepEqual(etat.verdict, {justes: 8, total: 10, reussi: true});
  assert.deepEqual(etat.parcours.modules.A5.f, [0, 1, 0, 0]);
  assert.deepEqual(etat.parcours.modules.A5.c, {1: 2, 3: 1});
  assert.deepEqual(etat.parcours.modules.A5.v, [0, 0, 0, 0], "un entraînement ne valide rien");
  assert.deepEqual(etat.parcours.jours, [JOUR]);
  etat = P.appliquerSerie(etat.parcours, Object.assign({}, serie, {reponses: reponses(7, 10), causes: {1: 1}}), {aujourdhui: JOUR, carte: CARTE});
  assert.equal(etat.verdict.reussi, false, "7 justes sur 10 : pas encore");
  assert.deepEqual(etat.parcours.modules.A5.c, {1: 3, 3: 1}, "les erreurs connues se cumulent par cause");
  assert.deepEqual(etat.parcours.modules.A5.f, [0, 2, 0, 0]);
  // J'apprends : seulement « appris », pas un jour travaillé, pas une série.
  const appris = P.appliquerSerie(P.creerParcours(), {module: "A2", niveau: 3, genre: "apprends"}, {aujourdhui: JOUR, carte: CARTE});
  assert.deepEqual(appris.parcours.modules.A2.a, [0, 0, 1, 0]);
  assert.deepEqual(appris.parcours.modules.A2.f, [0, 0, 0, 0]);
  assert.deepEqual(appris.parcours.jours, []);
  assert.equal(appris.parcours.modules.A2.vu, JOUR);
  // Un module inconnu ne change rien.
  assert.deepEqual(P.appliquerSerie(P.creerParcours(), {module: "Z1", niveau: 1, genre: "valide", reponses: []}).parcours, P.creerParcours());
});

test("les états d'un module et le module suivant", () => {
  const neuf = P.creerParcours();
  const etat = (parcours, id, carte = CARTE, options) => P.etatModule(parcours, id, carte, options).etat;
  // Pendant l'essai : les pilotes construits sont ouverts, le reste arrive « bientôt ».
  assert.equal(etat(neuf, "A2"), "libre");
  assert.equal(etat(neuf, "A5"), "libre", "A5 est ouvert sans A3 pendant l'essai");
  assert.equal(etat(neuf, "A1"), "bientot");
  assert.equal(etat(neuf, "M2"), "bientot", "M2 est pilote, mais pas encore construit");
  assert.equal(P.moduleSuivant(neuf, CARTE), "A2");
  assert.equal(P.moduleCourant(neuf, CARTE), "A2");
  const choisi = P.choisirModule(neuf, "A5", JOUR);
  assert.equal(P.moduleCourant(choisi, CARTE), "A5", "Mon module est celui que l'élève a choisi");
  assert.equal(etat(choisi, "A5"), "encours");
  assert.deepEqual(P.etatModule(P.choisirNiveau(choisi, "A5", 3, JOUR), "A5", CARTE), {id: "A5", niveau: 3, niveaux: 4, apres: [], etat: "encours"});
  // Sans l'essai : un module s'ouvre quand tous ses « avant » sont validés.
  assert.equal(etat(neuf, "A1", CARTE_OUVERTE), "libre");
  assert.deepEqual(P.etatModule(neuf, "A5", CARTE_OUVERTE), {id: "A5", niveau: 1, niveaux: 4, apres: ["A3"], etat: "ferme"});
  assert.equal(etat(neuf, "A5", CARTE_OUVERTE, {enAvant: "A5"}), "libre", "un module mis en avant s'ouvre sans ses « avant »");
  assert.equal(P.moduleSuivant(neuf, CARTE_OUVERTE), "A1");
  let p = neuf;
  ["A1", "A3"].forEach(id => { for (let n = 1; n <= P.NIVEAUX[id]; n += 1) p = valider(p, id, n, {carte: CARTE_OUVERTE}).parcours; });
  assert.equal(etat(p, "A1", CARTE_OUVERTE), "valide");
  assert.equal(etat(p, "A5", CARTE_OUVERTE), "libre", "A3 validé : A5 s'ouvre");
  assert.equal(P.moduleSuivant(p, CARTE_OUVERTE), "A2");
  p.modules.A1.r = true;
  assert.equal(etat(p, "A1", CARTE_OUVERTE), "revoir", "à revoir : le module reste validé");
  assert.equal(P.estValide(p, "A1"), true);
  assert.deepEqual(P.compter(p, CARTE_OUVERTE).paliers, [
    {palier: 1, valides: 2, total: 10}, {palier: 2, valides: 0, total: 14}, {palier: 3, valides: 0, total: 13}, {palier: 4, valides: 0, total: 5}
  ]);
  assert.equal(P.compter(p, CARTE).total, 42, "le compte dit « sur 42 »");
  // Tout ce qui est ouvert est validé : plus de module suivant.
  let fini = neuf;
  ["A2", "A5"].forEach(id => { fini = validerTout(fini, id); });
  assert.equal(P.moduleSuivant(fini, CARTE), null);
});

test("le mélange : 10 calculs, au plus 3 par module quand plus de 3 sont dus", () => {
  assert.deepEqual(P.tirerMelange(P.creerParcours(), {aujourdhui: JOUR}), [], "rien à réviser le premier jour");
  const compte = tirages => tirages.reduce((m, t) => Object.assign(m, {[t.module]: (m[t.module] || 0) + 1}), {});
  // Un seul module validé : les 10 calculs viennent de lui.
  const un = P.tirerMelange(avecValides(["A5"]), {aujourdhui: JOUR, graine: 4});
  assert.equal(un.length, 10);
  assert.deepEqual(compte(un), {A5: 10});
  assert.ok(un.every(t => t.niveau === 1 && t.du === true && t.reprise === false));
  // Trois modules dus : pas de plafond, à tour de rôle.
  assert.deepEqual(compte(P.tirerMelange(avecValides(["A1", "A2", "A5"]), {aujourdhui: JOUR})), {A1: 4, A2: 3, A5: 3});
  // Plus de trois modules dus : au plus 3 calculs par module.
  const cinq = P.tirerMelange(avecValides(["A1", "A2", "M1", "A3", "A5"]), {aujourdhui: JOUR, graine: 9});
  assert.equal(cinq.length, 10);
  Object.values(compte(cinq)).forEach(n => assert.ok(n <= 3));
  assert.deepEqual(compte(cinq), {A1: 2, A2: 2, M1: 2, A3: 2, A5: 2});
  const quatre = compte(P.tirerMelange(avecValides(["A1", "A2", "M1", "A5"]), {aujourdhui: JOUR}));
  assert.deepEqual(quatre, {A1: 3, A2: 3, M1: 2, A5: 2});
  // Rien n'est dû : on complète par l'échéance la plus proche (entretien).
  const pasDus = avecValides(["A1", "A2"], JOUR);
  pasDus.modules.A2.e = "2026-10-08";
  pasDus.modules.A1.e = "2026-10-20";
  const entretien = P.tirerMelange(pasDus, {aujourdhui: JOUR});
  assert.equal(entretien.length, 10);
  assert.equal(entretien[0].module, "A2", "l'échéance la plus proche d'abord");
  assert.ok(entretien.every(t => t.du === false));
  // Le niveau est tiré parmi les niveaux validés, et la graine fixe la série.
  let deux = avecValides(["A5"]);
  deux = valider(deux, "A5", 3, {jour: "2026-10-02"}).parcours;
  const niveaux = new Set(P.tirerMelange(deux, {aujourdhui: JOUR, graine: 21}).map(t => t.niveau));
  assert.deepEqual([...niveaux].sort(), [1, 3]);
  assert.deepEqual(P.tirerMelange(deux, {aujourdhui: JOUR, graine: 21}), P.tirerMelange(deux, {aujourdhui: JOUR, graine: 21}));
  assert.notDeepEqual(P.tirerMelange(deux, {aujourdhui: JOUR, graine: 21}).map(t => t.niveau), P.tirerMelange(deux, {aujourdhui: JOUR, graine: 22}).map(t => t.niveau));
  // Les boîtes à tour de rôle, le plus en retard d'abord dans chaque boîte.
  const boites = avecValides(["A1", "A2", "M1", "A5"]);
  Object.assign(boites.modules.A5, {b: 1, e: "2026-09-20"});
  Object.assign(boites.modules.A1, {b: 1, e: "2026-10-02"});
  Object.assign(boites.modules.A2, {b: 3, e: "2026-10-03"});
  Object.assign(boites.modules.M1, {b: 2, e: "2026-10-04"});
  assert.deepEqual(P.tirerMelange(boites, {aujourdhui: JOUR}).slice(0, 4).map(t => t.module), ["A5", "M1", "A2", "A1"]);
});

test("le mélange : un module à revoir ouvre par 5 calculs, un module mis en avant n'y est pas", () => {
  const p = avecValides(["A1", "A2", "A5"]);
  p.modules.A2.r = true;
  p.modules.A2.err = 2;
  const tirages = P.tirerMelange(p, {aujourdhui: JOUR});
  assert.equal(tirages.length, 10);
  assert.deepEqual(tirages.slice(0, 5).map(t => t.module), ["A2", "A2", "A2", "A2", "A2"]);
  assert.ok(tirages.slice(0, 5).every(t => t.reprise) && tirages.slice(5).every(t => !t.reprise));
  // Deux modules à revoir : le plus ancien d'abord.
  p.modules.A5.r = true;
  p.modules.A5.e = "2026-09-25";
  assert.equal(P.tirerMelange(p, {aujourdhui: JOUR})[0].module, "A5");
  // Mis en avant et pas encore validé : hors du mélange.
  const avant = avecValides(["A1", "A5"]);
  assert.ok(P.tirerMelange(avant, {aujourdhui: JOUR, enAvant: "A5"}).every(t => t.module === "A1"));
  // Mis en avant mais déjà validé par l'élève : il y reste.
  let valide = avant;
  for (let n = 2; n <= 4; n += 1) valide = valider(valide, "A5", n, {jour: "2026-10-02", carte: CARTE_OUVERTE}).parcours;
  assert.ok(P.tirerMelange(valide, {aujourdhui: JOUR, enAvant: "A5"}).some(t => t.module === "A5"));
});

test("la file de la séance : 4 étapes au plus, la validation après un entraînement réussi", () => {
  const types = file => file.map(etape => etape.type);
  // Premier jour : J'apprends, Je m'entraîne, Je valide.
  const jour1 = P.fileSeance(P.creerParcours(), CARTE);
  assert.deepEqual(jour1, [
    {type: "apprends", module: "A2", niveau: 1},
    {type: "entraine", module: "A2", niveau: 1},
    {type: "valide", module: "A2", niveau: 1, conditionnelle: true}
  ]);
  // « J'apprends » déjà fait : la séance commence à l'entraînement.
  const appris = P.appliquerSerie(P.creerParcours(), {module: "A2", niveau: 1, genre: "apprends"}, {aujourdhui: JOUR, carte: CARTE}).parcours;
  assert.deepEqual(types(P.fileSeance(appris, CARTE)), ["entraine", "valide"]);
  // Un niveau validé : « Mes calculs du jour » passe devant, et le niveau 2 n'est pas appris.
  const n1 = valider(appris, "A2", 1, {type: "F"}).parcours;
  const file = P.fileSeance(n1, CARTE);
  assert.deepEqual(types(file), ["melange", "apprends", "entraine", "valide"]);
  assert.deepEqual(file[1], {type: "apprends", module: "A2", niveau: 2});
  assert.equal(file.length, P.SEUILS.seance.etapesMax);
  // Un module mis en avant : étape 1, et la validation attend le lendemain (5e étape coupée).
  const avant = P.fileSeance(n1, CARTE, {enAvant: "A5"});
  assert.deepEqual(avant[0], {type: "apprends", module: "A5", niveau: 1, enAvant: true});
  assert.deepEqual(types(avant), ["apprends", "melange", "apprends", "entraine"]);
  assert.ok(P.fileSeance(n1, CARTE, {enAvant: "A5"}).length <= 4);
  // Déjà appris : l'étape du module mis en avant est un entraînement.
  const avantAppris = P.appliquerSerie(n1, {module: "A5", niveau: 1, genre: "apprends"}, {aujourdhui: JOUR, carte: CARTE}).parcours;
  assert.equal(P.fileSeance(avantAppris, CARTE, {enAvant: "A5"})[0].type, "entraine");
  // Entraînement raté : pas de validation ce jour-là, « Je m'entraîne encore ».
  const base = P.fileSeance(appris, CARTE);
  assert.deepEqual(types(P.suiteDeFile(base, 0, {reussi: true})), ["entraine", "valide"]);
  const rate = P.suiteDeFile(base, 0, {reussi: false});
  assert.deepEqual(rate, [{type: "entraine", module: "A2", niveau: 1}, {type: "entraine", module: "A2", niveau: 1, encore: true}]);
  assert.ok(!types(rate).includes("valide"));
  // L'entraînement du module mis en avant ne décide pas de la validation de Mon module.
  const deux = P.fileSeance(avantAppris, CARTE, {enAvant: "A5"});
  assert.deepEqual(P.suiteDeFile(deux, 0, {reussi: false}), deux);
  // Tout est validé : il ne reste que le mélange.
  let fini = P.creerParcours();
  ["A2", "A5"].forEach(id => { fini = validerTout(fini, id); });
  assert.deepEqual(types(P.fileSeance(fini, CARTE)), ["melange"]);
});

test("fusionner : le plus avancé des deux, dans les deux sens", () => {
  let a = valider(P.creerParcours(), "A5", 1, {jour: "2026-10-05"}).parcours;
  a = P.appliquerSerie(a, {module: "A5", niveau: 2, genre: "entraine", reponses: reponses(6, 10), causes: {1: 4, 2: 1}}, {aujourdhui: "2026-10-05", carte: CARTE}).parcours;
  let b = P.appliquerSerie(P.creerParcours(), {module: "A5", niveau: 1, genre: "apprends"}, {aujourdhui: "2026-10-06", carte: CARTE}).parcours;
  b = P.appliquerSerie(b, {module: "A5", niveau: 2, genre: "entraine", reponses: reponses(9, 10), causes: {1: 1, 3: 2}}, {aujourdhui: "2026-10-06", carte: CARTE}).parcours;
  b = valider(b, "A2", 1, {type: "F", jour: "2026-10-06"}).parcours;
  b.seance = {jour: "2026-10-06", etape: 2, n: 3};
  b.seances = ["2026-10-04", "2026-10-06", "2026-10-06"];
  a.seances = ["2026-10-05", "2026-10-06"];
  const ab = P.fusionner(a, b);
  const ba = P.fusionner(b, a);
  assert.deepEqual(ab, ba, "commutative");
  assert.deepEqual(P.fusionner(a, a), P.normaliserParcours(a), "idempotente");
  assert.deepEqual(P.fusionner(ab, a), ab);
  const m = ab.modules.A5;
  assert.equal(m.vu, "2026-10-06", "vu : la plus récente");
  assert.deepEqual(m.v, [1, 0, 0, 0], "v : le maximum case par case");
  assert.deepEqual(m.a, [1, 0, 0, 0]);
  assert.deepEqual(m.f, [1, 1, 0, 0]);
  assert.deepEqual(m.c, {1: 4, 2: 1, 3: 2}, "c : le maximum par cause");
  assert.equal(m.nv, 2, "nv : le plus grand");
  assert.equal(m.b, 1);
  assert.ok(ab.modules.A2, "un module présent d'un seul côté est gardé");
  assert.deepEqual(ab.seance, {jour: "2026-10-06", etape: 2, n: 3}, "la séance qui a le plus de séances finies");
  assert.deepEqual(ab.seances, ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-06"], "par date, le plus grand des deux comptes");
  assert.deepEqual(ab.jours, ["2026-10-05", "2026-10-06"]);
  // ok : la plus ancienne ; t : du côté qui a le plus joué le niveau.
  const x = validerTout(P.creerParcours(), "A5", {jour: "2026-10-02", liste: reponses(10, 10, 3000)});
  let y = validerTout(P.creerParcours(), "A5", {jour: "2026-10-08", liste: reponses(10, 10, 5000)});
  y = valider(y, "A5", 4, {jour: "2026-10-09", liste: reponses(10, 10, 7000)}).parcours;
  const xy = P.fusionner(x, y);
  assert.equal(xy.modules.A5.ok, "2026-10-02");
  assert.equal(xy.modules.A5.t[3], 70, "le temps du côté qui a 2 séries");
  assert.deepEqual(P.fusionner(y, x), xy);
  // Deux appareils, chacun une partie des niveaux : le module est validé à la fusion.
  let debut = valider(P.creerParcours(), "A5", 1, {jour: "2026-10-05"}).parcours;
  debut = valider(debut, "A5", 2, {jour: "2026-10-06"}).parcours;
  let fin = valider(P.creerParcours(), "A5", 3, {jour: "2026-10-07"}).parcours;
  fin = valider(fin, "A5", 4, {jour: "2026-10-08"}).parcours;
  assert.equal(fin.modules.A5.ok, null);
  const entier = P.fusionner(debut, fin);
  assert.deepEqual(entier.modules.A5.v, [1, 1, 1, 1]);
  assert.equal(entier.modules.A5.ok, "2026-10-08");
  assert.deepEqual(P.fusionner(fin, debut), entier);
  assert.equal(P.fusionner(debut, valider(P.creerParcours(), "A5", 4, {jour: "2026-10-08"}).parcours).modules.A5.nv, 3, "nv : le premier niveau pas encore validé");
  // La boîte, l'échéance, les erreurs du mélange : en bloc, du côté le plus récent.
  const ancien = avecValides(["A5"], "2026-10-01");
  Object.assign(ancien.modules.A5, {b: 4, e: "2026-10-30", err: 0, r: false});
  const recent = avecValides(["A5"], "2026-10-01");
  Object.assign(recent.modules.A5, {vu: "2026-10-05", b: 1, e: "2026-10-05", err: 2, r: true});
  const bloc = P.fusionner(ancien, recent).modules.A5;
  assert.deepEqual([bloc.b, bloc.e, bloc.err, bloc.r], [1, "2026-10-05", 2, true]);
  assert.deepEqual(P.fusionner(recent, ancien).modules.A5, bloc);
  // Mon module : celui du côté qui l'a vu le plus récemment.
  assert.equal(P.fusionner(P.choisirModule(P.creerParcours(), "A2", "2026-10-03"), P.choisirModule(P.creerParcours(), "A5", "2026-10-04")).mod, "A5");
  assert.equal(P.fusionner(P.choisirModule(P.creerParcours(), "A5", "2026-10-04"), P.creerParcours()).mod, "A5");
  // L'époque la plus haute gagne en bloc : « Recommencer à zéro » ne ressuscite rien.
  const zero = P.remettreAZero(a);
  assert.equal(zero.epoque, 1);
  assert.deepEqual(P.fusionner(a, zero), zero);
  assert.deepEqual(P.fusionner(zero, a), zero);
  // La fusion de deux références reste dans les limites du serveur.
  const mesure = P.mesurer(P.fusionner(parcoursComplet(), parcoursComplet({causes: 12})));
  assert.ok(mesure.cles < 2000 && mesure.octets < 40000);
});

test("les dates : jour local, lundi, échéance des boîtes, séances de la semaine", () => {
  assert.equal(P.jourLocal(new Date(2026, 9, 3, 23, 30)), "2026-10-03");
  assert.equal(P.ajouterJours("2026-10-31", 1), "2026-11-01");
  assert.equal(P.ecartJours("2026-10-01", "2026-10-08"), 7);
  assert.equal(P.lundiDe("2026-10-03"), "2026-09-28");
  assert.deepEqual([1, 2, 3, 4, 5].map(b => P.ecartJours(JOUR, P.echeanceDeBoite(b, JOUR))), [0, 1, 3, 7, 14]);
  const p = P.creerParcours();
  p.seances = ["2026-09-27", "2026-09-28", "2026-10-03", "2026-10-03"];
  assert.deepEqual(P.bilanSeances(P.normaliserParcours(p), "2026-10-03"), {semaine: 2, objectif: 4, aujourdhui: 2});
});

test("le rangement par code : une case par code, sous une empreinte, sans prénom", () => {
  const stockage = fauxStockage();
  const avecPrenom = P.definirPrenom(valider(P.creerParcours(), "A5", 1).parcours, "Léa");
  assert.equal(P.sauver(stockage, avecPrenom, "7K3M9P"), true);
  assert.equal(P.sauver(stockage, avecPrenom, ""), true);
  const cle = P.cleStockage("7K3M9P", stockage);
  assert.match(cle, /^mathsgo-defi-calcul-parcours:[0-9a-f]{16}$/);
  assert.equal(P.cleStockage("", stockage), "mathsgo-defi-calcul-parcours");
  assert.equal(P.clesRevelentUnCode(stockage), false, "aucune clé ne laisse lire un code");
  assert.ok(stockage.cles().every(k => k.startsWith("mathsgo-defi-calcul-")), "rien n'est écrit dans les cases de Défi tables");
  assert.equal(JSON.parse(stockage.brut(cle)).prenom, "", "sous un code, jamais de prénom dans la case");
  assert.equal(P.charger(stockage, "").prenom, "Léa");
  assert.deepEqual(P.charger(stockage, "7K3M9P").modules.A5.v, [1, 0, 0, 0]);
  assert.deepEqual(P.charger(stockage, "ABCDEF"), P.creerParcours(), "un autre code a sa propre case, vide");
  assert.equal(P.empreinteCode("7K3M9P", "sel"), P.empreinteCode("7K3M9P", "sel"));
  assert.notEqual(P.empreinteCode("7K3M9P", "sel"), P.empreinteCode("7K3M9P", "autre"));
  assert.equal(P.sha256Hex("Défi calcul"), createHash("sha256").update("Défi calcul").digest("hex"));
  // L'état de synchronisation, à côté de la case.
  assert.deepEqual(P.chargerSync(stockage, "7K3M9P"), {revision: 0, dirty: false, detache: false, maj: 0});
  P.sauverSync(stockage, "7K3M9P", {revision: 4, dirty: true, maj: 1000});
  assert.deepEqual(P.chargerSync(stockage, "7K3M9P"), {revision: 4, dirty: true, detache: false, maj: 1000});
  // La purge : une case à code sans ouverture depuis 90 jours quitte l'appareil.
  const jours = n => n * 24 * 60 * 60 * 1000;
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(89)}), 0);
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(91), garder: "7K3M9P"}), 0, "la case active n'est jamais purgée");
  assert.equal(P.purger(stockage, {maintenant: 1000 + jours(91)}), 1);
  assert.equal(stockage.brut(cle), undefined);
  assert.equal(P.charger(stockage, "").prenom, "Léa", "la case sans code reste");
  // Le code et l'identité vivent dans l'onglet, sous les clés du suivi.
  const onglet = fauxStockage();
  assert.equal(P.sauverCode(onglet, "7k3m9p"), true);
  assert.equal(P.chargerCode(onglet), "7K3M9P");
  assert.equal(P.sauverCode(onglet, "0O1I"), false);
  P.sauverIdentiteOnglet(onglet, "7K3M9P", {prenom: "Léa", classe: "4e B"});
  assert.deepEqual(P.chargerIdentiteOnglet(onglet, "7K3M9P"), {prenom: "Léa", classe: "4e B"});
  assert.equal(P.chargerIdentiteOnglet(onglet, "ABCDEF"), null);
  P.effacerCode(onglet);
  assert.equal(P.chargerCode(onglet), "");
  assert.deepEqual(onglet.cles(), []);
});

test("la page : en construction, hors catalogue, sans rien de Défi tables", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /<meta name="robots" content="noindex">/);
  ["defi_calcul_core.js", "defi_calcul_mon_parcours.js", "defi_calcul_aides.js", "defi_calcul.css"].forEach(fichier => {
    assert.match(page, new RegExp(`\\./${fichier.replace(".", "\\.")}\\?v=\\d{8}-\\d+"`), `${fichier} chargé avec son ?v=`);
  });
  assert.doesNotMatch(page, /<script[^>]+src="https?:/, "aucun script d'un autre domaine");
  assert.doesNotMatch(page, /defi[-_]tables/i, "la page ne charge ni ne nomme rien de Défi tables");
  assert.equal((page.match(/appli: "defi-calcul"/g) || []).length, 3, "lecture, billet, envoi : appli « defi-calcul »");
  assert.match(page, /\/\/ \[suivi:debut\][\s\S]+\/\/ \[suivi:fin\]/);
  assert.match(page, /MATHSGO_ENTREE/);
  // Les mots de l'élève, repris de Défi tables et des maquettes.
  ["Mon module", "Changer de module", "Je valide", "Choisir une activité", "Comment ça marche", "Ma séance du jour",
    "Je recopie cette phrase dans mon cahier.", "Juste, mais trop long", "mais trop lentement. Entraîne-toi encore.",
    "Pas encore", "Suivi par ton professeur", "C’est toujours toi"].forEach(mot => assert.ok(page.includes(mot), mot));
  // Ni code de module ni niveau de classe côté élève : la page ne les écrit nulle part en dur.
  assert.equal(/\b(CM1|CM2|6e|5e|4e|3e)\b/.test(page.replace(/<script[\s\S]*?<\/script>/g, "")), false, "aucun niveau de classe dans la page");
  // Hors catalogue, hors plan du site, et l'ancien Défi calcul n'a pas bougé.
  const catalogue = await lire("../assets/js/catalogue-refonte-data.js");
  assert.doesNotMatch(catalogue, /defi_calcul_modules/);
  assert.doesNotMatch(await lire("../sitemap.xml"), /defi_calcul_modules/);
  assert.match(await lire("../outils/calcul_mental/defi_calcul.html"), /const TOTAL = 30;/);
  // Les trois scripts s'installent sous leur nom, sans se marcher dessus.
  for (const [fichier, nom] of [["defi_calcul_core.js", "MATHSGO_DEFI_CALCUL_CORE"], ["defi_calcul_mon_parcours.js", "MATHSGO_DEFI_CALCUL_MON_PARCOURS"], ["defi_calcul_aides.js", "MATHSGO_DEFI_CALCUL_AIDES"]]) {
    assert.ok((await lire(`../outils/calcul_mental/${fichier}`)).includes(`root.${nom} = api`), nom);
  }
});
