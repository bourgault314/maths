// Défi calcul, lot F4 « Personne ne reste bloqué » (18/11/2026, choix de
// Gwenaël après l'audit des six profils) : J'apprends ne se rate plus (il
// s'arrête sur « On continue demain » et reprend où il en était), 5 justes
// sur les 6 derniers, plus de séance qui finit sur un test raté, le test de
// palier, et « à voir en classe » au 3e arrêt sur le même niveau. Le format
// passe en version 10 (`ar`, `paliers` ; recalé le 20/11 après le lot 6
// « programmes 2 », qui avait pris la 9) : la check-list du modèle commun
// (deux appareils hors ligne, vieille copie, donnée abîmée, fusion dans les
// deux sens).

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

const J = "2026-11-23";
const plus = (n, jour = J) => P.ajouterJours(jour, n);
const opts = (jour = J, seance = true) => ({aujourdhui: jour, carte: CARTE, seance});
const types = (p, jour = J) => P.fileSeance(p, CARTE, {aujourdhui: jour}).etapes.map(e => e.type);
const premiere = (p, jour = J) => P.fileSeance(p, CARTE, {aujourdhui: jour}).etapes[0];
const ouvrir = (p, jour = J) => P.ouvrirSeance(p, CARTE, {aujourdhui: jour});
const reussie = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
// Arrêté sans aide : 25 calculs, un faux sur trois.
const arretee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const duPalier = palier => P.parcoursConstruit(CARTE).filter(c => P.palierDe(CARTE, c.module, c.niveau) === palier);
// Le test de palier déjà joué (pour suivre le parcours module par module).
const sansTestDePalier = p => Object.assign(p, {paliers: [plus(-30), plus(-30), plus(-30), plus(-30)]});
const apprendre = (p, module, niveau, reponses, jour = J) => P.appliquerSerie(p, {module, niveau, genre: "apprends", reponses}, opts(jour));

// ------------------------------------------------------------ le test de palier

test("test de palier : 12 compétences au plus, le dernier niveau de chaque module du palier, les derniers dans l'ordre de la carte", () => {
  assert.deepEqual(P.SEUILS.palier, {calculs: 12, fauxPermis: 1, etale: 7});
  for (const palier of [1, 2, 3, 4]) {
    const liste = P.calculsDuTestDePalier(CARTE, palier);
    const modules = new Set(duPalier(palier).map(c => c.module)).size;
    assert.equal(liste.length, Math.min(12, modules), `palier ${palier} (vers la 6e : 10 modules, 10 calculs)`);
    const ordre = P.parcoursConstruit(CARTE).map(c => `${c.module}-${c.niveau}`);
    const rangs = liste.map(c => ordre.indexOf(`${c.module}-${c.niveau}`));
    assert.deepEqual(rangs, [...rangs].sort((x, y) => x - y), "dans l'ordre de la carte");
    assert.equal(new Set(liste.map(c => c.module)).size, liste.length, "un calcul par module");
    liste.forEach(c => {
      assert.equal(P.palierDe(CARTE, c.module, c.niveau), palier);
      const plusHaut = duPalier(palier).filter(x => x.module === c.module).map(x => x.niveau);
      assert.equal(c.niveau, Math.max(...plusHaut), `${c.module}-${c.niveau} : le dernier niveau du module dans le palier`);
      assert.ok(CORE.niveauDe(`${c.module}-${c.niveau}`), "un niveau construit, qui sait tirer un calcul");
    });
  }
});

test("test de palier : la première étape d'un élève neuf ; tout juste (un faux permis), tout le palier entre solide, retours étalés, ceinture", () => {
  let p = ouvrir(P.creerParcours());
  assert.deepEqual(premiere(p), {type: "palier", palier: 1});
  const r = P.appliquerTestPalier(p, {palier: 1, justes: 11, total: 12}, opts());
  assert.equal(r.reussi, true);
  assert.equal(r.entrees, duPalier(1).length);
  p = r.parcours;
  const echeances = new Set();
  duPalier(1).forEach(({module: id, niveau}) => {
    const l = p.modules[id];
    assert.equal(l.b[niveau - 1], 4, `${id}-${niveau} solide`);
    assert.equal(l.a[niveau - 1], 1);
    assert.equal(l.d[niveau - 1], J);
    assert.equal(l.s[niveau - 1], J);
    const e = l.e[niveau - 1];
    assert.ok(e >= plus(7) && e <= plus(13), `${id}-${niveau} revient dans 7 à 13 jours (${e})`);
    echeances.add(e);
  });
  assert.equal(echeances.size, 7, "les retours sont étalés sur 7 jours");
  assert.deepEqual(r.ceintures, [1], "la ceinture jaune tout de suite");
  assert.deepEqual(p.paliers, [J, null, null, null]);
  assert.equal(p.seance.j[2], duPalier(1).length, "compétences prouvées au journal");
  assert.equal(p.seance.p[P.PLAN.tests], 1, "un test de plus dans la séance");
  // Le palier suivant a son test de palier, tout de suite.
  assert.deepEqual(premiere(p), {type: "palier", palier: 2});
  // Personne ne reçoit tout le palier le même jour dans Mes calculs du jour.
  for (let d = 7; d <= 13; d += 1) assert.ok(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: plus(d)}).length <= 20);
});

test("test de palier raté : rien n'entre, rien n'est perdu, il ne revient pas ; les tests module par module", () => {
  let p = ouvrir(P.creerParcours());
  const r = P.appliquerTestPalier(p, {palier: 1, justes: 1, total: 3}, opts());
  assert.equal(r.reussi, false);
  assert.equal(r.entrees, 0);
  p = r.parcours;
  assert.deepEqual(p.paliers, [J, null, null, null], "joué");
  assert.equal(P.compter(p, CARTE).entrees, 0);
  assert.equal(premiere(p).type, "test", "le premier module, comme avant");
  assert.equal(premiere(p, plus(1)).type, "test", "le lendemain non plus, pas de test de palier");
  // 12 joués avec 2 faux, ou pas tous joués : raté.
  assert.equal(P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 1, justes: 10, total: 12}, opts()).reussi, false);
  assert.equal(P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 1, justes: 11, total: 11}, opts()).reussi, false);
  assert.equal(P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 1, justes: 99, total: 12}, opts()).reussi, true, "justes borné au total");
  assert.equal(P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 9, justes: 12, total: 12}, opts()).reussi, false, "un palier qui n'existe pas");
});

test("test de palier : seulement au début d'un palier pas commencé, jamais au-delà du réglage, et pas sans le temps", () => {
  // Commencé (une compétence jouée au test) : pas de test de palier.
  let p = ouvrir(P.creerParcours());
  const c = duPalier(1)[0];
  p = P.appliquerTest(p, {module: c.module, marche: 0, niveaux: [{niveau: 1, justes: 0, total: 2}]}, opts()).parcours;
  assert.equal(P.palierATester(p, CARTE, P.competenceCourante(p, CARTE, 4, J)), 0);
  // Le réglage du professeur : jusqu'aux bases — pas de test du CM1.
  let q = P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 1, justes: 12, total: 12}, opts()).parcours;
  assert.equal(P.palierATester(q, CARTE, P.competenceCourante(q, CARTE, 4, J), 1), 0);
  assert.equal(P.fileSeance(q, CARTE, {aujourdhui: J, palier: 1}).etapes.filter(e => e.type === "palier").length, 0);
  // Après le premier apprentissage, le test de palier demande le temps du
  // test, d'un test de module et d'un début de J'apprends (6 minutes).
  q.seance.p[P.PLAN.commences] = 1;
  q = P.noterTemps(q, 5 * 60);
  assert.deepEqual(types(q), ["palier"]);
  q = P.noterTemps(q, 61);
  assert.deepEqual(types(q), [], "6 min 01 passées : il attend la prochaine séance");
});

// ------------------------------------------------- J'apprends ne se rate plus

test("J'apprends arrêté : On continue demain, il reprend où il en était, jamais « On te montre »", () => {
  let p = sansTestDePalier(ouvrir(P.creerParcours()));
  p = P.appliquerTest(p, {module: "A1", marche: 0, niveaux: [{niveau: 1, justes: 0, total: 2}]}, opts()).parcours;
  assert.deepEqual(premiere(p), {type: "apprends", module: "A1", niveau: 1});
  // Arrêté au dessin (le temps est passé, 4 calculs faits).
  const auDessin = [{juste: true, outil: "manip"}, {juste: true, outil: "manip"}, {juste: false, outil: "image"}, {juste: true, outil: "image"}];
  const r = apprendre(p, "A1", 1, auDessin);
  assert.equal(r.verdict.reussi, false);
  assert.deepEqual(r.evenements, [{type: "arrete", module: "A1", niveau: 1, reprise: 1, arrets: 1, aVoir: false, retour: null}]);
  assert.equal(r.finie, true, "rien de nouveau aujourd'hui");
  p = r.parcours;
  assert.deepEqual(premiere(p, plus(1)), {type: "apprends", module: "A1", niveau: 1, depart: 1}, "demain : au dessin");
  // Le lendemain, il arrive sans aide puis s'arrête : il reprendra sans aide.
  p = ouvrir(p, plus(1));
  p = apprendre(p, "A1", 1, [{juste: true, outil: "image"}, {juste: true, outil: "image"}, {juste: true, outil: "aucun"}, {juste: false, outil: "aucun"}], plus(1)).parcours;
  assert.deepEqual(premiere(p, plus(2)), {type: "apprends", module: "A1", niveau: 1, depart: 2});
  // Le surlendemain : 5 justes sans aide, d'emblée — réussi.
  p = ouvrir(p, plus(2));
  const fini = apprendre(p, "A1", 1, Array.from({length: 5}, () => ({juste: true, outil: "aucun"})), plus(2));
  assert.equal(fini.verdict.reussi, true);
  assert.equal(fini.parcours.modules.A1.b[0], 2);
  assert.equal(fini.parcours.modules.A1.ar[0], 0, "plus rien d'arrêté");
  // La page ne choisit pas la reprise : le moteur relit `ar`. Le même
  // départ sans aide, rejoué sans `depart`, n'aurait pas réussi au moteur
  // s'il commençait aux perles… il réussit ici parce que le moteur le sait.
  assert.equal(P.suivreEntrainement(Array.from({length: 5}, () => ({juste: true, outil: "aucun"})), {genre: "apprends"}).reussi, true);
});

test("au 3e arrêt sur le même niveau : « à voir en classe », il attend 7 jours (avec le reste de son module), l'élève passe à la suite", () => {
  let p = sansTestDePalier(ouvrir(P.creerParcours()));
  p = P.appliquerTest(p, {module: "A1", marche: 0, niveaux: [{niveau: 1, justes: 0, total: 2}]}, opts()).parcours;
  let r;
  for (let d = 0; d < 3; d += 1) {
    p = ouvrir(p, plus(d));
    assert.deepEqual(premiere(p, plus(d)).module, "A1");
    r = apprendre(p, "A1", 1, arretee(), plus(d));
    p = r.parcours;
  }
  const ev = r.evenements.find(e => e.type === "arrete");
  assert.deepEqual(ev, {type: "arrete", module: "A1", niveau: 1, reprise: 2, arrets: 3, aVoir: true, retour: plus(9)});
  assert.equal(p.modules.A1.e[0], plus(9), "l'échéance d'un niveau pas appris : son jour de retour");
  assert.equal(P.aVoirEnClasse(p.modules.A1, 0), true);
  assert.equal(P.etatCompetence(p.modules.A1, 0, plus(3)), "classe");
  // Le lendemain : la suite (un autre module), jamais A1-2 sans A1-1.
  const suite = P.competenceCourante(p, CARTE, 4, plus(3));
  assert.notEqual(suite.module, "A1");
  for (let d = 3; d < 9; d += 1) assert.notEqual(P.competenceCourante(p, CARTE, 4, plus(d)).module, "A1", `jour ${d}`);
  // Au 7e jour, il revient, et reprend où il en était (sans aide).
  assert.deepEqual(P.competenceCourante(p, CARTE, 4, plus(9)), {module: "A1", niveau: 1});
  assert.deepEqual(premiere(p, plus(9)), {type: "apprends", module: "A1", niveau: 1, depart: 2});
  // La page prof : « à voir en classe », pas encore appris, son jour de retour.
  const prof = P.resumeProf(p, CARTE, plus(4));
  const vu = prof.revoir.find(c => c.module === "A1" && c.niveau === 1);
  assert.equal(vu.etat, "classe");
  assert.equal(vu.pasApprise, true);
  assert.equal(vu.retour, plus(9));
  assert.equal(prof.aVoir, 1);
  assert.deepEqual(P.resumeSuivi(p, {aujourdhui: plus(4)}).aider, [{type: "a-reprendre", competences: 1}]);
  // Appris : plus rien à voir.
  p = ouvrir(p, plus(9));
  p = apprendre(p, "A1", 1, Array.from({length: 5}, () => ({juste: true, outil: "aucun"})), plus(9)).parcours;
  assert.equal(P.aVoirEnClasse(p.modules.A1, 0), false);
  assert.equal(P.resumeProf(p, CARTE, plus(9)).aVoir, 0);
});

// ------------------------------------------- une séance ne finit pas sur un test raté

test("après un test raté aujourd'hui, J'apprends est garanti ; un test pas garanti demande le temps d'un début de J'apprends", () => {
  assert.equal(P.SEUILS.seance.durees.apresTest, 120);
  let p = sansTestDePalier(ouvrir(P.creerParcours()));
  p = P.appliquerTest(p, {module: "A1", marche: 3, niveaux: [1, 2, 3].map(niveau => ({niveau, justes: 3, total: 3}))}, opts()).parcours;
  p.seance.p[P.PLAN.commences] = 1;
  p = P.noterTemps(p, 7 * 60 + 30);
  assert.deepEqual(types(p), ["test"], "7 min 30 + 1 min 30 + 2 min = 11 min : ça tient");
  p = P.noterTemps(p, 1);
  assert.deepEqual(types(p), [], "une seconde de plus : le test attend demain");
  // Un test raté au bout du temps : J'apprends suit quand même.
  let q = sansTestDePalier(ouvrir(P.creerParcours()));
  q.seance.p[P.PLAN.commences] = 1;
  q = P.noterTemps(q, 7 * 60);
  q = P.appliquerTest(q, {module: "A1", marche: 0, niveaux: [{niveau: 1, justes: 1, total: 3}]}, opts()).parcours;
  q = P.noterTemps(q, 5 * 60);
  assert.deepEqual(types(q), ["apprends"], "12 minutes : J'apprends, garanti après le test raté");
});

// ---------------------------------------------------------- les données (v10)

test("format : version 10, `ar` par module, `paliers` à quatre places ; une version 9 ou 8 se relit sans rien perdre", () => {
  assert.equal(P.VERSION, 10);
  assert.deepEqual(P.creerParcours().paliers, [null, null, null, null]);
  const v8 = {version: 8, ceintures: ["2026-11-02", null, null, null],
    modules: {A1: {vu: J, b: [4, 0, 0], e: [plus(3), null, null], a: [1, 0, 0], f: [1, 1, 0], x: [0, 0, 0], t: [0, 0, 0], l: [0, 0, 0], d: [J, null, null], s: [J, null, null], c: {}}}};
  const lu = P.normaliserParcours(v8);
  assert.equal(lu.version, 10);
  assert.deepEqual(lu.paliers, [null, null, null, null]);
  assert.deepEqual(lu.modules.A1.ar, [0, 0, 0]);
  assert.deepEqual(lu.modules.A1.b, [4, 0, 0]);
  assert.deepEqual(lu.ceintures, ["2026-11-02", null, null, null]);
  assert.deepEqual(P.normaliserParcours(lu), lu, "idempotente");
  // Une version 9 (lot 6 « programmes 2 » : F6 à 4 niveaux, F9 à 3) : rien
  // ne se décale une seconde fois, le module su le reste.
  const v9 = {version: 9, ceintures: [J, null, null, null],
    modules: {F6: {vu: J, ok: J, b: [4, 3, 0, 5], e: [plus(3), plus(2), null, plus(4)], a: [1, 1, 0, 1], f: [1, 1, 0, 2], x: [0, 0, 0, 0], t: [0, 0, 0, 0], l: [0, 0, 0, 0], d: [J, J, null, J], s: [J, J, null, J], c: {}},
      F9: {vu: J, ok: null, b: [2, 0, 0], e: [plus(1), null, null], a: [1, 0, 0], f: [1, 0, 0], x: [0, 0, 0], t: [0, 0, 0], l: [0, 0, 0], d: [J, null, null], s: [null, null, null], c: {}}}};
  const lu9 = P.normaliserParcours(JSON.parse(JSON.stringify(v9)));
  assert.equal(lu9.version, 10);
  assert.deepEqual(lu9.modules.F6.b, [4, 3, 0, 5], "F6 : pas de case neuve en plus");
  assert.deepEqual(lu9.modules.F6.e, [plus(3), plus(2), null, plus(4)]);
  assert.equal(lu9.modules.F6.ok, J, "le module su le reste");
  assert.deepEqual(lu9.modules.F9.b, [2, 0, 0]);
  assert.deepEqual(lu9.modules.F6.ar, [0, 0, 0, 0]);
  assert.deepEqual(lu9.paliers, [null, null, null, null]);
  assert.deepEqual(lu9.ceintures, [J, null, null, null]);
  assert.deepEqual(P.normaliserParcours(lu9), lu9, "idempotente");
});

test("donnée abîmée : `ar` borné, la reprise et les arrêts relus, l'échéance d'un niveau pas appris seulement au 3e arrêt", () => {
  const abime = {version: 9, paliers: ["2026-11-02", "x", 4, "2026-13-01", "2026-11-09"],
    modules: {A1: {b: [0, 0, 3], e: [plus(5), plus(5), plus(2)], ar: [11, 4, 7], f: [1, 1, 1]}, A2: {b: [0, 0, 0, 0, 0], ar: ["x", -3, 99, 2.5, null], e: ["demain", null, null, null, null]}}};
  const lu = P.normaliserParcours(abime);
  assert.deepEqual(lu.paliers, ["2026-11-02", null, null, null]);
  assert.deepEqual(lu.modules.A1.ar, [11, 4, 0], "entrée : plus rien d'arrêté");
  assert.deepEqual([P.arretsDe(lu.modules.A1, 0), P.repriseDe(lu.modules.A1, 0)], [3, 2]);
  assert.deepEqual([P.arretsDe(lu.modules.A1, 1), P.repriseDe(lu.modules.A1, 1)], [1, 1]);
  assert.deepEqual(lu.modules.A1.e, [plus(5), null, plus(2)], "un jour de retour au 3e arrêt seulement");
  assert.deepEqual(lu.modules.A2.ar, [0, 0, 0, 0, 0], "hors bornes (29 au plus : 9 arrêts, sans aide) : rien d'arrêté");
  assert.deepEqual(lu.modules.A2.e, [null, null, null, null, null]);
  assert.deepEqual(P.normaliserParcours(lu), lu);
});

test("fusion : deux appareils hors ligne, vieille copie, dans les deux sens — les arrêts ne s'oublient pas, un test de palier joué l'est des deux côtés", () => {
  // Le même élève, J'apprends A1-1 arrêté sur le téléphone (1 arrêt, au
  // dessin) et deux fois sur l'ordinateur (sans aide).
  // (Correctif F4 : la fusion borne le jour de retour à 7 jours après le
  // jour où elle se fait — ici, le jour du 3e arrêt.)
  const jour = {aujourdhui: plus(2)};
  const base = P.appliquerTest(sansTestDePalier(ouvrir(P.creerParcours())), {module: "A1", marche: 0, niveaux: [{niveau: 1, justes: 0, total: 2}]}, opts()).parcours;
  const tel = apprendre(base, "A1", 1, [{juste: true, outil: "manip"}, {juste: true, outil: "manip"}, {juste: true, outil: "image"}, {juste: false, outil: "image"}]).parcours;
  let ordi = apprendre(base, "A1", 1, arretee()).parcours;
  ordi = apprendre(ouvrir(ordi, plus(1)), "A1", 1, arretee(), plus(1)).parcours;
  const f1 = P.fusionner(tel, ordi, jour);
  const f2 = P.fusionner(ordi, tel, jour);
  assert.deepEqual(f1, f2, "l'ordre ne change rien");
  assert.deepEqual([P.arretsDe(f1.modules.A1, 0), P.repriseDe(f1.modules.A1, 0)], [2, 2], "le côté qui a le plus d'arrêts");
  // Le 3e arrêt sur un appareil (à voir en classe) : son jour de retour suit.
  const troisieme = apprendre(ouvrir(ordi, plus(2)), "A1", 1, arretee(), plus(2)).parcours;
  const f3 = P.fusionner(tel, troisieme, jour);
  assert.equal(f3.modules.A1.e[0], plus(9));
  assert.equal(P.aVoirEnClasse(f3.modules.A1, 0), true);
  assert.deepEqual(P.fusionner(troisieme, tel, jour), f3);
  // Appris d'un côté : plus rien d'arrêté, quelle que soit l'autre copie.
  const appris = apprendre(ouvrir(tel, plus(1)), "A1", 1, Array.from({length: 7}, () => ({juste: true, outil: "aucun"})), plus(1)).parcours;
  assert.equal(appris.modules.A1.b[0], 2);
  for (const f of [P.fusionner(appris, troisieme, jour), P.fusionner(troisieme, appris, jour)]) {
    assert.equal(f.modules.A1.b[0], 2);
    assert.equal(f.modules.A1.ar[0], 0);
    assert.notEqual(f.modules.A1.e[0], plus(9));
  }
  // Une vieille copie (version 9, sans `ar` ni `paliers`) ne fait rien perdre.
  const vieille = JSON.parse(JSON.stringify(base));
  delete vieille.paliers;
  Object.values(vieille.modules).forEach(l => delete l.ar);
  vieille.version = 9;
  const f4 = P.fusionner(vieille, troisieme, jour);
  assert.deepEqual([P.arretsDe(f4.modules.A1, 0), f4.modules.A1.e[0]], [3, plus(9)]);
  assert.deepEqual(f4.paliers, troisieme.paliers);
  // Un test de palier joué d'un côté : joué des deux (le jour le plus ancien).
  const a = Object.assign(P.creerParcours(), {paliers: [plus(-2), null, null, null]});
  const b = Object.assign(P.creerParcours(), {paliers: [plus(-5), plus(-1), null, null]});
  assert.deepEqual(P.fusionner(a, b, jour).paliers, [plus(-5), plus(-1), null, null]);
  assert.deepEqual(P.fusionner(b, a, jour).paliers, [plus(-5), plus(-1), null, null]);
});

test("le serveur : `ar` et `paliers` déclarés, version_min 10 ; la copie du moteur pour la page prof est identique", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'ceintures', 'ar', 'paliers'\],/);
  assert.match(bloc, /'version_min' => 10,/);
  assert.equal(await lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
});

test("lot 6-0 : une ceinture gagnée cette semaine est dans « À féliciter » (le jour le plus récent de la semaine), la page prof l'écrit", async () => {
  const p = Object.assign(P.creerParcours(), {ceintures: [plus(-10), plus(1), null, null]});
  assert.deepEqual(P.resumeSuivi(p, {aujourdhui: plus(2)}).feliciter, [{type: "ceinture", ceinture: 2}], "l'orange (cette semaine), pas la jaune (la semaine d'avant)");
  assert.deepEqual(P.resumeSuivi(p, {aujourdhui: plus(0)}).feliciter, [], "pas avant le jour où elle est gagnée");
  const prof = await lire("../_serveur/public/prof/index.php");
  assert.match(prof, /const NOMS_CEINTURES = \["ceinture jaune", "ceinture orange", "ceinture verte", "ceinture bleue"\];/);
  assert.match(prof, /\$\{NOMS_CEINTURES\[x\.ceinture - 1\]\} gagnée/);
  // La page prof dit « J'apprends arrêté 3 fois » d'un niveau jamais appris.
  assert.match(prof, /c\.etat === "classe" && c\.pasApprise/);
});
