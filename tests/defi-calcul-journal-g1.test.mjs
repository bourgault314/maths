// Défi calcul, lot G1 « journal + accueil » (07/11/2026) : le journal des
// séances, les deux dates de chaque compétence, la fusion entre deux
// appareils (la check-list du modèle commun, AGENTS.md), ce que l'accueil de
// l'élève pourra voir de sa semaine, ce que lit la page prof, la version 5.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE_REELLE = CORE.carte();
// Tout ce qui a un palier est « construit » : il y a toujours une nouveauté.
const CARTE = {modules: CARTE_REELLE.modules.map(fiche => Object.assign({}, fiche, {construit: fiche.paliers.some(Boolean)})), ordre: CARTE_REELLE.ordre};
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

// Mercredi 11 novembre 2026 ; le lundi de sa semaine est le 9.
const MERCREDI = "2026-11-11";
const LUNDI = "2026-11-09";
const plus = (jour, n) => P.ajouterJours(jour, n);

const reussie = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const ratee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const vide = () => ({calculs: [], justes: [], nouveautes: [], prouvees: [], rouges: [], minutes: [], numero: []});
// Les six nombres du lot G1 (sans le numéro de la séance, ajouté au correctif du lot S1).
const SIX = ["calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes"];
const entree = (p, i) => SIX.map(champ => p.journal[champ][i]);

// Une séance jouée jusqu'au bout, comme la page : chaque étape reçoit d'abord
// son temps actif (noterTemps), puis le moteur. `juste(module, niveau)` : la
// réponse à un calcul du jour ; `marche(module)` : ce que prouve le test ;
// `entrainement` : "reussi" ou "rate".
function jouerSeance(p, jour, {secondes = 120, juste = () => true, marche = () => 0, entrainement = "reussi", nouveautes = 1} = {}) {
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: jour, nouveautes});
  const n = p.seance.n;
  for (let tour = 0; tour < 30 && p.seance.n === n; tour += 1) {
    const etape = P.fileSeance(p, CARTE, {aujourdhui: jour}).etapes[0];
    if (!etape) break;
    p = P.noterTemps(p, secondes);
    if (etape.type === "jour") {
      P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(c => {
        p = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: juste(c.module, c.niveau), ms: 2000, type: "P"}, {aujourdhui: jour}).parcours;
      });
      p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
    } else if (etape.type === "test") {
      const m = marche(etape.module);
      const niveaux = Array.from({length: Math.min(P.NIVEAUX[etape.module], m + 1)}, (_, i) => ({niveau: i + 1, justes: i < m ? 2 : 0, total: 2}));
      p = P.appliquerTest(p, {module: etape.module, marche: m, niveaux}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
    } else if (etape.type === "apprends") {
      p = P.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: "apprends"}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
    } else {
      const reponses = etape.type === "entraine" && entrainement === "rate" ? ratee() : reussie();
      p = P.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: etape.type, reponses}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
    }
  }
  return p;
}

test("version 5 (6 depuis le correctif du lot S1) : le journal est vide au départ, ce que la séance a fait aussi", () => {
  assert.equal(P.VERSION, 6);
  const neuf = P.creerParcours();
  assert.deepEqual(neuf.journal, vide());
  assert.deepEqual(neuf.seance.j, [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(P.JOURNAL, ["calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes", "numero"]);
});

test("le journal d'une séance : calculs du jour, justes, nouveautés, compétences prouvées, rouges, minutes", () => {
  // Jour 1 : le test du premier module prouve 2 marches (la 1re en boîte 4,
  // la 2e en boîte 3), puis la 3e s'apprend et s'entraîne.
  let p = jouerSeance(P.creerParcours(), "2026-11-02", {marche: () => 2, secondes: 100});
  assert.deepEqual(p.seances, ["2026-11-02"]);
  // 3 étapes (test, J'apprends, Je m'entraîne) à 100 s : 5 minutes.
  assert.deepEqual(entree(p, 0), [0, 0, 1, 2, 0, 5]);
  assert.deepEqual(p.seance.j, [0, 0, 0, 0, 0, 0], "la séance finie repart de zéro");
  // Jour 2 : la compétence entrée en boîte 2 revient dans Mes calculs du
  // jour ; ratée, elle est rouge : « Je m'entraîne encore », puis une
  // nouveauté.
  p = jouerSeance(p, "2026-11-03", {juste: () => false, secondes: 61});
  const deux = entree(p, 1);
  assert.equal(deux[0], 1, "un calcul du jour");
  assert.equal(deux[1], 0, "faux");
  assert.equal(deux[4], 1, "une rouge entraînée");
  assert.equal(deux[2], 1, "une nouveauté");
  assert.equal(deux[3], 0);
  assert.ok(deux[5] >= 4, "la durée suit les étapes");
  assert.equal(p.journal.calculs.length, p.seances.length, "une entrée par séance");
});

test("le temps actif : seulement dans une séance ouverte, en minutes, 90 au plus ; une séance de 20 s compte 1 minute", () => {
  let p = P.noterTemps(P.creerParcours(), 300);
  assert.deepEqual(p.seance.j, [0, 0, 0, 0, 0, 0], "pas de séance ouverte : rien");
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: MERCREDI});
  p = P.noterTemps(p, 20);
  assert.equal(p.seance.j[4], 20);
  ["x", -5, NaN, 1e9, "60"].forEach(v => assert.equal(P.noterTemps(p, v).seance.j[4], v === "60" ? 80 : 20, `rien d'abîmé ne compte (${v})`));
  p = P.noterTemps(p, 5000);
  p = P.noterTemps(p, 5000);
  assert.equal(p.seance.j[4], 5400, "90 minutes au plus");
  const court = jouerSeance(P.creerParcours(), MERCREDI, {secondes: 7});
  assert.equal(court.journal.minutes[0], 1, "quelques secondes : 1 minute, pas 0");
  const long = jouerSeance(P.creerParcours(), MERCREDI, {secondes: 3000});
  assert.equal(long.journal.minutes[0], 90);
  const sansTemps = jouerSeance(P.creerParcours(), MERCREDI, {secondes: 0});
  assert.equal(sansTemps.journal.minutes[0], 0);
});

test("après minuit : la séance compte pour le jour où elle finit, avec tout ce qu'elle a fait la veille", () => {
  let p = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: "2026-11-10"});
  p = P.noterTemps(p, 240);
  // Le test se joue mardi soir…
  p = P.appliquerTest(p, {module: "A2", marche: 1, niveaux: [{niveau: 1, justes: 2, total: 2}, {niveau: 2, justes: 0, total: 2}]}, {aujourdhui: "2026-11-10", carte: CARTE, seance: true}).parcours;
  assert.deepEqual(p.seance.j, [0, 0, 1, 0, 240, 0]);
  // … la suite après minuit, sans rouvrir la séance.
  for (let tour = 0; tour < 5 && !p.seances.length; tour += 1) {
    const etape = P.fileSeance(p, CARTE, {aujourdhui: MERCREDI}).etapes[0];
    p = P.noterTemps(p, 60);
    p = etape.type === "apprends"
      ? P.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: "apprends"}, {aujourdhui: MERCREDI, carte: CARTE, seance: true}).parcours
      : P.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: "entraine", reponses: reussie()}, {aujourdhui: MERCREDI, carte: CARTE, seance: true}).parcours;
  }
  assert.deepEqual(p.seances, [MERCREDI], "le jour où elle a fini");
  assert.equal(p.journal.prouvees[0], 1, "le test de la veille compte");
  assert.equal(p.journal.minutes[0], 6, "4 minutes la veille + 2 après minuit");
  // Une séance laissée ouverte un autre jour, puis une séance NEUVE : elle
  // part de zéro.
  let q = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: "2026-11-08"});
  q = P.noterTemps(q, 600);
  q = P.ouvrirSeance(q, CARTE, {aujourdhui: MERCREDI});
  assert.deepEqual(q.seance.j, [0, 0, 0, 0, 0, 0]);
  // Rouvrir la séance du jour ne remet rien à zéro.
  q = P.noterTemps(q, 30);
  assert.deepEqual(P.ouvrirSeance(q, CARTE, {aujourdhui: MERCREDI}).seance.j, [0, 0, 0, 0, 30, 0]);
});

test("Mes calculs du jour : chaque première réponse compte, juste ou pas ; hors séance ouverte, rien", () => {
  const base = P.normaliserParcours({modules: {A2: {vu: "2026-11-01", b: [3, 2, 0, 0, 0], e: [MERCREDI, MERCREDI, null, null, null], a: [1, 1, 0, 0, 0], f: [1, 1, 0, 0, 0]}}});
  let p = P.ouvrirSeance(base, CARTE, {aujourdhui: MERCREDI});
  p = P.appliquerRetour(p, {module: "A2", niveau: 1, juste: true, ms: 1000, type: "P"}, {aujourdhui: MERCREDI}).parcours;
  p = P.appliquerRetour(p, {module: "A2", niveau: 2, juste: false, ms: 1000, type: "P"}, {aujourdhui: MERCREDI}).parcours;
  assert.deepEqual(p.seance.j.slice(0, 2), [2, 1]);
  const horsSeance = P.appliquerRetour(base, {module: "A2", niveau: 1, juste: true, ms: 1000, type: "P"}, {aujourdhui: MERCREDI}).parcours;
  assert.deepEqual(horsSeance.seance.j, [0, 0, 0, 0, 0, 0]);
  // Une série hors séance (le mode professeur, une activité choisie) non plus.
  const serie = P.appliquerSerie(p, {module: "A2", niveau: 2, genre: "rattrape", reponses: reussie()}, {aujourdhui: MERCREDI, carte: CARTE}).parcours;
  assert.equal(serie.seance.j[3], 0);
});

test("les deux dates : d le jour où elle entre, s le jour où elle devient sue — posées une fois", () => {
  // Le test : la marche la plus haute en boîte 3 (entrée, pas sue), celles
  // d'en dessous en boîte 4 (entrées ET sues le même jour).
  let p = P.appliquerTest(P.creerParcours(), {module: "A2", marche: 3, niveaux: [1, 2, 3].map(n => ({niveau: n, justes: 2, total: 2})).concat([{niveau: 4, justes: 0, total: 2}])},
    {aujourdhui: LUNDI, carte: CARTE}).parcours;
  assert.deepEqual(p.modules.A2.d, [LUNDI, LUNDI, LUNDI, null, null]);
  assert.deepEqual(p.modules.A2.s, [LUNDI, LUNDI, null, null, null]);
  // L'entraînement réussi : entrée.
  p = P.appliquerSerie(p, {module: "A5", niveau: 1, genre: "entraine", reponses: reussie()}, {aujourdhui: LUNDI, carte: CARTE}).parcours;
  assert.deepEqual(p.modules.A5.d, [LUNDI, null, null, null]);
  assert.deepEqual(p.modules.A5.s, [null, null, null, null]);
  // A2-3 en boîte 3 revient jeudi : juste, elle passe en boîte 4 — sue jeudi.
  const jeudi = plus(LUNDI, 3);
  p = P.appliquerRetour(p, {module: "A2", niveau: 3, juste: true, ms: 1000, type: "P"}, {aujourdhui: jeudi}).parcours;
  assert.equal(p.modules.A2.b[2], 4);
  assert.equal(p.modules.A2.s[2], jeudi);
  // Elle redescend (boîte 3) puis remonte : la date ne bouge plus.
  const loin = plus(jeudi, 7);
  p = P.appliquerRetour(p, {module: "A2", niveau: 3, juste: false, ms: 1000, type: "P"}, {aujourdhui: loin}).parcours;
  assert.equal(p.modules.A2.b[2], 3);
  p = P.appliquerRetour(p, {module: "A2", niveau: 3, juste: true, ms: 1000, type: "P"}, {aujourdhui: plus(loin, 1)}).parcours;
  assert.equal(p.modules.A2.b[2], 4);
  assert.equal(p.modules.A2.s[2], jeudi, "devenue sue la première fois, une seule fois");
  // Une entrée en boîte 2 qui monte en 3 : toujours pas sue.
  const a5 = P.appliquerRetour(p, {module: "A5", niveau: 1, juste: true, ms: 1000, type: "P"}, {aujourdhui: plus(LUNDI, 1)}).parcours.modules.A5;
  assert.deepEqual([a5.b[0], a5.s[0]], [3, null]);
});

test("une progression de version 4 se relit sans rien perdre : journal « pas connu », pas de date", () => {
  const v4 = {
    version: 4, epoque: 0, prenom: "",
    modules: {A2: {vu: "2026-11-05", ok: null, b: [4, 3, 0, 0, 0], e: ["2026-11-12", "2026-11-08", null, null, null], a: [1, 1, 0, 0, 0], f: [1, 1, 0, 0, 0], x: [0, 0, 0, 0, 0], t: [0, 0, 0, 0, 0], c: {}}},
    seance: {jour: "2026-11-06", etape: 1, n: 3, p: [1, 0, 0, 1, 0, 1, 0]},
    seances: ["2026-11-03", "2026-11-04", "2026-11-05"], jours: ["2026-11-05"]
  };
  const p = P.normaliserParcours(v4);
  assert.equal(p.version, 6);
  assert.deepEqual(p.seances, v4.seances);
  assert.deepEqual(p.journal.calculs, [-1, -1, -1]);
  assert.deepEqual(p.modules.A2.d, [null, null, null, null, null]);
  assert.deepEqual(p.modules.A2.s, [null, null, null, null, null]);
  assert.deepEqual(p.seance, {jour: "2026-11-06", etape: 1, n: 3, p: [1, 0, 0, 1, 0, 1, 0], j: [0, 0, 0, 0, 0, 0]}, "la séance ouverte continue, de zéro");
  assert.deepEqual(P.normaliserParcours(p), p, "idempotente");
  // La séance qui finit ensuite a un vrai journal ; les anciennes restent « pas connu ».
  const suite = jouerSeance(p, "2026-11-06");
  assert.deepEqual(suite.journal.calculs.slice(0, 3), [-1, -1, -1]);
  assert.ok(suite.journal.calculs[3] >= 0);
  // resumeProf les rend null.
  const resume = P.resumeProf(suite, CARTE, "2026-11-06");
  assert.equal(resume.journal.length, 4);
  assert.deepEqual(resume.journal[0], {jour: "2026-11-03", calculs: null, justes: null, nouveautes: null, prouvees: null, rouges: null, minutes: null});
  assert.ok(Number.isInteger(resume.journal[3].minutes));
});

test("donnée abîmée : dates impossibles, entiers hors bornes, listes trop courtes ou trop longues, année 0000", () => {
  const brut = {
    version: 5,
    modules: {A5: {vu: "2026-11-05", b: [2, 4, 0, 3], e: ["2026-11-06", "2026-11-09", null, "2026-11-08"], d: ["2026-02-30", "0000-01-01", "2026-11-01", 7], s: [null, "2026-11-05x", "2026-11-01"]}},
    seance: {jour: "2026-11-06", etape: 1, n: 3, p: [1, 0, 0, 0, 0, 1, 0], j: [5, 9, -2, "x", 99999]},
    // « 2026-02-30 » et « 0000-01-01 » ne sont pas des jours : le serveur les
    // retirerait de la liste, et leur journal glisserait d'un rang.
    seances: ["2026-11-01", "2026-02-30", "0000-01-01", "2026-11-03", "2026-11-02"],
    journal: {calculs: [10, 11, 12, 13, 14], justes: [12, 3, 3, 3, 3], nouveautes: [1, 9, 1, 1, 1], prouvees: [0, 0, 0, 0], rouges: "x", minutes: [5, 5, 5, 5, 5, 5, 5]}
  };
  const p = P.normaliserParcours(brut);
  assert.deepEqual(p.seances, ["2026-11-01", "2026-11-02", "2026-11-03"], "les jours impossibles partent, le reste est trié");
  // Chaque entrée reste avec SA date : 2026-11-02 était la 5e, 2026-11-03 la 4e.
  assert.deepEqual(p.journal.calculs, [10, 14, 13]);
  assert.deepEqual(p.journal.justes, [10, 3, 3], "jamais plus de justes que de calculs");
  assert.deepEqual(p.journal.nouveautes, [1, 1, 1]);
  assert.deepEqual(p.journal.prouvees, [-1, 0, 0], "une liste trop courte s'aligne sur les plus récentes");
  assert.deepEqual(p.journal.rouges, [-1, -1, -1]);
  assert.deepEqual(p.journal.minutes, [5, 5, 5], "une liste trop longue garde ses dernières valeurs");
  assert.deepEqual(p.modules.A5.d, [null, null, null, null], "pas entrée (A5-3) : pas de date ; date impossible : null");
  assert.deepEqual(p.modules.A5.s, [null, null, null, null]);
  assert.deepEqual(p.seance.j, [5, 5, 0, 0, 0, 0], "hors bornes : 0 ; jamais plus de justes que de calculs");
  assert.deepEqual(P.normaliserParcours(JSON.parse(JSON.stringify(p))), p, "idempotente");
  // Une séance fermée ne garde rien de ce qu'elle a fait.
  assert.deepEqual(P.normaliserParcours({seance: {p: [0, 0, 0, 0, 0, 0, 0], j: [3, 3, 0, 0, 60]}}).seance.j, [0, 0, 0, 0, 0, 0]);
  // La même règle que le serveur (checkdate) : 29 février d'une année
  // bissextile oui, d'une autre non.
  assert.deepEqual(P.normaliserParcours({seances: ["2028-02-29", "2026-02-29", "1900-02-29", "2000-02-29"]}).seances, ["2000-02-29", "2028-02-29"]);
});

test("la borne : 60 séances, le journal suit les plus récentes", () => {
  let p = P.creerParcours();
  for (let i = 0; i < 70; i += 1) p = jouerSeance(p, plus("2026-09-01", Math.floor(i / 2)), {secondes: 60 + i});
  assert.equal(p.seances.length, 60);
  P.JOURNAL.forEach(champ => assert.equal(p.journal[champ].length, 60, champ));
  assert.equal(p.seances[0], plus("2026-09-01", 5), "les 10 plus anciennes sont parties");
  assert.ok(p.journal.minutes.every(m => m >= 1));
  // La séance la plus récente est la dernière, avec son journal.
  assert.equal(p.seances[59], plus("2026-09-01", 34));
});

// ------------------------------------------------- la fusion : la check-list

// Deux appareils, le même élève : la fusion rend la même chose dans les deux
// sens, ne perd aucune séance d'un jour au plus grand des deux comptes, et le
// journal suit ses séances.
// `divergentes` : deux histoires différentes (pas une copie de l'autre) —
// la fusion des MODULES (d'avant le lot G1) peut alors demander un tour de
// plus (« J'apprends » le plus prudent) ; les séances et le journal, non.
function deuxSens(a, b, {divergentes = false} = {}) {
  const ab = P.fusionner(a, b);
  const ba = P.fusionner(b, a);
  assert.deepEqual(ab, ba, "le même résultat dans les deux sens");
  assert.deepEqual(P.fusionner(ab, ab), ab, "rien à refaire");
  [a, b].forEach(copie => {
    const encore = P.fusionner(ab, copie);
    if (divergentes) assert.deepEqual([encore.seances, encore.journal, encore.seance], [ab.seances, ab.journal, ab.seance], "une copie qui revient ne change ni les séances ni le journal");
    else assert.deepEqual(encore, ab, "une copie qui revient ne change rien");
  });
  P.JOURNAL.forEach(champ => assert.equal(ab.journal[champ].length, ab.seances.length));
  return ab;
}

test("fusion : deux appareils hors ligne le même jour — chaque séance une fois (son numéro), entière, les dates les plus anciennes", () => {
  const base = jouerSeance(P.creerParcours(), "2026-11-09", {marche: () => 1});
  // Téléphone et tablette repartent de la même copie, hors ligne, mardi.
  const telephone = jouerSeance(base, "2026-11-10", {secondes: 300});
  const tablette = jouerSeance(jouerSeance(base, "2026-11-10", {secondes: 60}), "2026-11-10", {secondes: 60});
  const f = deuxSens(telephone, tablette);
  // Correctif du lot S1 (relecture de Codex) : chaque séance a son numéro —
  // les trois séances jouées mardi sont là, chacune une fois, entière ; la
  // séance de lundi, connue des deux côtés, ne double pas.
  assert.deepEqual(f.seances, ["2026-11-09", "2026-11-10", "2026-11-10", "2026-11-10"], "mardi : les 3 séances jouées");
  assert.deepEqual(entree(f, 0), entree(base, 0));
  const mardi = [1, 2, 3].map(i => JSON.stringify(entree(f, i))).sort();
  assert.deepEqual(mardi, [entree(telephone, 1), entree(tablette, 1), entree(tablette, 2)].map(e => JSON.stringify(e)).sort());
  // Le téléphone a reçu la fusion et la renvoie : rien ne double.
  assert.deepEqual(P.fusionner(P.fusionner(f, telephone), tablette), f);
  // Les dates d'une compétence entrée des deux côtés : la plus ancienne.
  const x = P.normaliserParcours({modules: {A5: {vu: "2026-11-10", b: [2, 0, 0, 0], e: ["2026-11-11", null, null, null], d: ["2026-11-10", null, null, null]}}});
  const y = P.normaliserParcours({modules: {A5: {vu: "2026-11-09", b: [4, 0, 0, 0], e: ["2026-11-16", null, null, null], d: ["2026-11-06", null, null, null], s: ["2026-11-09", null, null, null]}}});
  const xy = deuxSens(x, y).modules.A5;
  assert.deepEqual([xy.b[0], xy.d[0], xy.s[0]], [2, "2026-11-06", "2026-11-09"], "les boîtes en bloc du côté le plus récent ; les dates, les premières connues");
});

test("fusion : une vieille copie revient 15 jours plus tard — rien ne se perd, rien ne double", () => {
  let p = P.creerParcours();
  for (let i = 0; i < 6; i += 1) p = jouerSeance(p, plus("2026-10-20", i), {marche: () => 1});
  const vieille = JSON.parse(JSON.stringify(p));
  for (let i = 0; i < 15; i += 1) p = jouerSeance(p, plus("2026-10-26", i), {secondes: 90});
  const f = deuxSens(vieille, p);
  assert.deepEqual(f, P.normaliserParcours(p), "la copie récente, telle quelle");
  // Une vieille copie d'avant le lot G1 (version 4, sans journal ni dates) :
  // les entrées connues gagnent sur les « pas connu ».
  const v4 = JSON.parse(JSON.stringify(vieille));
  v4.version = 4;
  delete v4.journal;
  Object.values(v4.modules).forEach(m => { delete m.d; delete m.s; });
  delete v4.seance.j;
  const g = deuxSens(v4, p);
  assert.deepEqual(g.journal, P.normaliserParcours(p).journal);
  assert.deepEqual(g.modules.A2.d, p.modules.A2.d);
});

test("fusion : la borne de 60 atteinte, le même jour et des jours différents", () => {
  // b : une copie plus ancienne (après 58 séances), qui avait encore les 2
  // séances du 1er jour, coupées depuis dans a.
  let a = P.creerParcours();
  let b = null;
  for (let i = 0; i < 64; i += 1) {
    a = jouerSeance(a, plus("2026-09-01", Math.floor(i / 2)), {secondes: 60});
    if (i === 57) b = JSON.parse(JSON.stringify(a));
  }
  const f = deuxSens(a, b);
  assert.equal(f.seances.length, 60);
  assert.deepEqual(f, P.normaliserParcours(a), "la copie récente, telle quelle");
  // Deux appareils qui ont chacun 60 séances, décalées : les 60 plus récentes de l'union.
  let c = P.creerParcours();
  for (let i = 0; i < 60; i += 1) c = jouerSeance(c, plus("2026-09-05", i), {secondes: 120});
  const g = deuxSens(a, c, {divergentes: true});
  assert.equal(g.seances.length, 60);
  assert.equal(g.seances[59], plus("2026-09-05", 59));
});

test("fusion : la même séance ouverte des deux côtés garde le plus grand de chaque compte ; finie d'un côté, elle est finie", () => {
  let base = jouerSeance(P.creerParcours(), "2026-11-09", {marche: () => 1});
  base = P.ouvrirSeance(base, CARTE, {aujourdhui: MERCREDI});
  const a = P.noterTemps(base, 200);
  const b = P.noterTemps(base, 50);
  const f = deuxSens(a, b);
  assert.deepEqual(f.seance.j, [0, 0, 0, 0, 200, 0]);
  // Finie sur l'un : la séance fermée gagne (plus de séances finies), son
  // journal est là, et ce que l'autre avait en cours ne traîne pas.
  const finie = jouerSeance(a, MERCREDI);
  const g = deuxSens(finie, b);
  assert.deepEqual(g.seance.j, [0, 0, 0, 0, 0, 0]);
  assert.equal(g.seances.length, 2);
});

test("réouverture : la page relit la progression du serveur, rien à renvoyer", () => {
  let p = P.creerParcours();
  for (let i = 0; i < 8; i += 1) p = jouerSeance(p, plus("2026-11-01", i), {marche: () => 2, secondes: 75});
  const serveur = JSON.parse(JSON.stringify(p));
  const appareil = JSON.parse(JSON.stringify(p));
  assert.equal(JSON.stringify(P.fusionner(appareil, serveur)), JSON.stringify(serveur), "même JSON : rien à renvoyer");
  assert.equal(JSON.stringify(P.normaliserParcours(serveur)), JSON.stringify(serveur));
});

test("deux époques : la plus haute gagne en bloc, journal compris (Recommencer à zéro, une restauration)", () => {
  const a = jouerSeance(P.creerParcours(), MERCREDI);
  const b = P.remettreAZero(a);
  const f = deuxSens(a, b);
  assert.deepEqual(f.journal, vide());
  assert.deepEqual(f.seances, []);
});

// ------------------------------------------------------ l'accueil de l'élève

test("semaineEleve : les 7 jours, les soirs, les 4 semaines, les compétences sues et les modules qui ont avancé", () => {
  let p = P.creerParcours();
  p = jouerSeance(p, "2026-10-21", {marche: () => 0});
  p = jouerSeance(p, "2026-10-28");
  p = jouerSeance(p, "2026-10-29");
  // Lundi : le test du module suivant prouve 3 marches (2 sues, la 3e en boîte 3).
  p = jouerSeance(p, LUNDI, {marche: () => 3});
  p = jouerSeance(p, LUNDI);
  const s = P.semaineEleve(p, CARTE, MERCREDI);
  assert.equal(s.montrer, true);
  assert.deepEqual(s.jours.map(j => j.jour), ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]);
  assert.deepEqual(s.jours.map(j => j.fait), [true, false, false, false, false, false, false]);
  assert.deepEqual(s.jours.map(j => j.aujourdhui), [false, false, true, false, false, false, false]);
  assert.deepEqual(s.jours.map(j => j.apres), [false, false, false, true, true, true, true]);
  assert.equal(s.soirs, 1, "un soir, même avec deux séances");
  assert.deepEqual(s.semaines.map(P.texteSemaine), ["1", "2", "0", "2"]);
  assert.ok(s.sues >= 2, "les marches sues du test comptent");
  assert.ok(s.avancees.length >= 3, "entrées cette semaine : leurs modules ont avancé");
  const lundi = Object.entries(p.modules).flatMap(([id, m]) => m.d.map((d, i) => (d === LUNDI || m.s[i] === LUNDI ? `${id}-${i + 1}` : null))).filter(Boolean);
  assert.deepEqual(s.avancees.map(c => `${c.module}-${c.niveau}`).sort(), lundi.sort(), "exactement les compétences entrées ou devenues sues depuis lundi");
  assert.equal(s.sues, Object.values(p.modules).reduce((n, m) => n + m.s.filter((x, i) => x === LUNDI && m.b[i] >= 4).length, 0));
  // Ce qui est entré la semaine d'avant ne compte pas.
  const avant = P.semaineEleve(p, CARTE, "2026-11-08");
  assert.deepEqual([avant.sues, avant.avancees.length], [0, 0]);
  // Une compétence sue cette semaine puis redescendue ne compte plus.
  const redescendue = P.normaliserParcours({modules: {A2: {vu: MERCREDI, b: [3, 0, 0, 0, 0], e: [plus(MERCREDI, 3), null, null, null, null], d: ["2026-11-01", null, null, null, null], s: [LUNDI, null, null, null, null]}}, seances: [LUNDI]});
  const r = P.semaineEleve(redescendue, CARTE, MERCREDI);
  assert.equal(r.sues, 0);
  assert.deepEqual(r.avancees, [{module: "A2", niveau: 1}], "mais son module a bien avancé");
  // Une date venue du futur (horloge d'un autre appareil) ne compte pas.
  const futur = P.normaliserParcours({modules: {A2: {vu: MERCREDI, b: [4, 0, 0, 0, 0], e: [plus(MERCREDI, 7), null, null, null, null], d: [plus(MERCREDI, 2), null, null, null, null], s: [plus(MERCREDI, 2), null, null, null, null]}}, seances: [LUNDI]});
  assert.deepEqual([P.semaineEleve(futur, CARTE, MERCREDI).sues, P.semaineEleve(futur, CARTE, MERCREDI).avancees.length], [0, 0]);
  // Un module pas dans la carte (réservé) n'est jamais compté.
  const reserve = P.normaliserParcours({modules: {X1: {vu: MERCREDI, b: [4, 0, 0], e: [plus(MERCREDI, 7), null, null], d: [LUNDI, null, null], s: [LUNDI, null, null]}}, seances: [LUNDI]});
  assert.deepEqual([P.semaineEleve(reserve, CARTE, MERCREDI).sues, P.semaineEleve(reserve, CARTE, MERCREDI).avancees.length], [0, 0]);
});

test("semaineEleve : rien à montrer sans séance dans les 4 dernières semaines ; le dimanche ; la borne des 60", () => {
  assert.equal(P.semaineEleve(P.creerParcours(), CARTE, MERCREDI).montrer, false, "aucune séance : rien");
  const vieux = P.normaliserParcours({seances: ["2026-09-01"]});
  assert.equal(P.semaineEleve(vieux, CARTE, MERCREDI).montrer, false, "rien depuis 4 semaines : rien non plus");
  const dimanche = P.semaineEleve(P.normaliserParcours({seances: ["2026-11-15"]}), CARTE, "2026-11-15");
  assert.deepEqual([dimanche.jours[6].aujourdhui, dimanche.jours[6].fait, dimanche.soirs], [true, true, 1]);
  // 60 séances en 15 jours (4 par jour, jusqu'à mercredi) : la semaine
  // d'avant la plus ancienne gardée n'est plus connue (« ? »), celle où elle
  // tombe dit « au moins » (« 20+ »).
  const plein = P.normaliserParcours({seances: Array.from({length: 60}, (_, i) => plus("2026-10-28", Math.floor(i / 4)))});
  assert.deepEqual(P.semaineEleve(plein, CARTE, MERCREDI).semaines.map(P.texteSemaine), ["?", "20+", "28", "12"]);
});

// ------------------------------------------------------------ la page prof

test("resumeProf rend le journal, les 4 semaines et les deux dates (pour le lot G2) — rien ne change d'autre", () => {
  const p = jouerSeance(P.creerParcours(), LUNDI, {marche: () => 2, secondes: 120});
  const r = P.resumeProf(p, CARTE, MERCREDI);
  assert.deepEqual(r.journal, [{jour: LUNDI, calculs: 0, justes: 0, nouveautes: 1, prouvees: 2, rouges: 0, minutes: 6}]);
  assert.deepEqual(r.semaines.map(P.texteSemaine), ["0", "0", "0", "1"]);
  // Le premier module de la carte : 2 marches prouvées, la 3e apprise.
  const premier = r.modules.find(m => m.id === P.parcoursConstruit(CARTE)[0].module);
  assert.deepEqual(premier.entrees.slice(0, 3), [LUNDI, LUNDI, LUNDI]);
  assert.deepEqual(premier.sues.slice(0, 3), [LUNDI, null, null]);
  ["lisible", "commence", "sues", "ouvert", "modules", "revoir", "causes", "seances", "dernier"].forEach(cle => assert.ok(cle in r, cle));
});

// ----------------------------------------------------------- la taille, le serveur

test("taille : un élève qui a tout rempli tient sous les bornes du serveur", async () => {
  const {parcoursComplet} = await import("../scripts/generer-parcours-reference-defi-calcul.mjs");
  const pire = P.mesurer(parcoursComplet({causes: P.SEUILS.causes, entier: true}));
  assert.ok(pire.cles < 2000, `${pire.cles} clés`);
  assert.ok(pire.octets < 40000, `${pire.octets} octets`);
  // Le journal plein (60 séances aux plus grands nombres) et les dates de
  // toutes les compétences y sont.
  const complet = parcoursComplet();
  assert.equal(complet.journal.calculs.length, 60);
  assert.ok(complet.modules.A2.d.every(Boolean));
});

test("serveur : version_min 5 (6 depuis le correctif du lot S1), les clés du journal déclarées ; infos.php le dit en une phrase", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const bloc = applis.slice(applis.indexOf("'defi-calcul' => ["), applis.indexOf("'automatismes' => ["));
  assert.match(bloc, /'version_min' => 6,/);
  ["d", "s", "j", "journal", ...P.JOURNAL].forEach(cle => assert.match(bloc, new RegExp(`'cles' => \\[[\\s\\S]*'${cle}'[\\s\\S]*\\],`), cle));
  const infos = await lire("../_serveur/public/infos.php");
  // Lot S1 « les journaux » : la phrase vaut désormais pour toutes les applis.
  assert.match(infos, /<p>Dans chaque activité, ta progression, ce sont aussi les jours où tu travailles et le nombre de tes réussites\.<\/p>/);
  // 08/11/2026 : la page publique ne liste plus les données du suivi ; elle
  // renvoie à la page Infos de l'espace, qui les dit (assertion ci-dessus).
  const confidentialite = await lire("../confidentialite.html");
  assert.match(confidentialite, /expliqué aux élèves et à leurs familles sur la page Infos de leur espace/);
  const copie = await lire("../_serveur/public/prof/defi_calcul_mon_parcours.js");
  assert.equal(copie, await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
});

// ------------------------------------------------------------- la page élève

test("la page élève : le temps actif donné au moteur ; l'accueil lit la semaine du moteur", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul_mon_parcours\.js\?v=20261108-1/);
  assert.match(page, /defi_calcul\.css\?v=20261108-1/, "la feuille ne change pas");
  // Lot « accueil » (07/11/2026) : la semaine de l'élève vient de
  // semaineEleve (tests/defi-calcul-accueil.test.mjs) ; plus de ligne
  // « N fois cette semaine ».
  assert.match(page, /PARCOURS\.semaineEleve\(parcours, CARTE, jourCourant\(\)\)/);
  assert.ok(!page.includes('id="acc-semaine"'));
  // Le temps : avant chaque fin d'étape, et quand on arrête au milieu.
  const finish = page.slice(page.indexOf("function finish()"), page.indexOf("function poserVerdict("));
  assert.ok(finish.indexOf("verserTempsActif();") > 0 && finish.indexOf("verserTempsActif();") < finish.indexOf("PARCOURS.terminerCalculsDuJour"), "fin d'étape : le temps d'abord");
  const apprends = page.slice(page.indexOf("function avancerTemps()"), page.indexOf("function repondreTemps()"));
  assert.ok(apprends.indexOf("verserTempsActif();") < apprends.indexOf("PARCOURS.appliquerSerie"));
  const quitter = page.slice(page.indexOf("function quitterSerie()"), page.indexOf("const DELAI_SUIVANT"));
  assert.ok(quitter.indexOf("verserTempsActif()") < quitter.indexOf("state.seance = null"));
  assert.match(page, /const TROU_ACTIF_MS = 60000;/);
});

// ------------------------------- le correctif après la relecture de Codex

// Une séance au journal connu : [calculs, justes, nouveautés, prouvées,
// rouges, minutes].
const ligneJ = (calculs, minutes = 5) => [calculs, calculs, 0, 0, 0, minutes];
// Une progression écrite à la main : des séances et leur journal.
function avecJournal(paires, extra = {}) {
  const journal = vide();
  paires.forEach(([, e]) => P.JOURNAL.forEach((champ, i) => journal[champ].push(e[i])));
  return P.normaliserParcours(Object.assign({version: 5, seances: paires.map(([jour]) => jour), journal}, extra));
}

// Correctif du lot S1 (relecture de Codex) : chaque séance écrite par la page
// a son numéro, rang dans la journée × 10 000 + un tirage.
const numerotee = (e, numero) => [...e, numero];

test("Codex 1 : à la borne des 60, une vieille copie ne remplace pas une entrée récente, et rien n'oscille", () => {
  // La vieille copie : deux séances le 1er septembre (4 et 8 calculs).
  const vieille = avecJournal([["2026-09-01", numerotee(ligneJ(4), 11111)], ["2026-09-01", numerotee(ligneJ(8), 22222)]]);
  // L'élève en finit une 3e le 1er septembre (12 calculs), puis 59 séances
  // les jours suivants : la copie récente ne garde que la 3e du 1er.
  const recente = avecJournal([["2026-09-01", numerotee(ligneJ(12), 33333)], ...Array.from({length: 59}, (_, i) => [plus("2026-09-02", i), numerotee(ligneJ(20), 10000 + i)])]);
  assert.equal(recente.seances.length, 60);
  const f = deuxSens(vieille, recente);
  assert.equal(f.seances[0], "2026-09-01");
  assert.equal(f.journal.calculs[0], 12, "la séance gardée est la 3e du 1er septembre : 12, pas 8");
  assert.deepEqual(f, recente, "la copie récente, telle quelle");
  // Refusionner alternativement avec les deux copies : 12, toujours.
  let x = f;
  for (let tour = 0; tour < 4; tour += 1) {
    x = P.fusionner(x, tour % 2 ? recente : vieille);
    assert.equal(x.journal.calculs[0], 12, `tour ${tour + 1}`);
  }
  assert.deepEqual(x, f);
  // Même quand la vieille entrée est la plus grosse (30 calculs) : la borne
  // garde les séances les plus récentes, pas les plus grosses.
  const grosse = avecJournal([["2026-09-01", numerotee(ligneJ(4), 11111)], ["2026-09-01", numerotee(ligneJ(30), 22222)]]);
  assert.equal(deuxSens(grosse, recente).journal.calculs[0], 12);
});

test("Codex 2 : une copie v4 plus fournie ce jour-là n'efface pas ce que le jour savait", () => {
  // v5 : une séance le 7 novembre, 12 calculs, 10 justes, 4 minutes.
  const v5 = avecJournal([["2026-11-07", [12, 10, 0, 0, 0, 4]]]);
  // Une page v4 restée ouverte : deux séances ce jour-là, sans journal.
  const v4 = P.normaliserParcours({version: 4, seances: ["2026-11-07", "2026-11-07"]});
  const f = deuxSens(v5, v4);
  assert.deepEqual(f.seances, ["2026-11-07", "2026-11-07"], "la longueur du jour reste la plus grande");
  assert.deepEqual(f.journal.calculs, [-1, 12], "la séance de plus, pas connue, se range avant la connue");
  assert.deepEqual(entree(f, 1), [12, 10, 0, 0, 0, 4], "l'entrée entière, sans mélanger les colonnes");
  assert.deepEqual(entree(f, 0), [-1, -1, -1, -1, -1, -1]);
});

test("fusion séance par séance : une séance sans numéro (pas connue) peut être une séance connue de l'autre côté ; deux copies d'une même séance, la plus complète, puis le plus grand total", () => {
  // Le même jour : [connue, pas connue, connue] contre [pas connue, connue].
  const inconnue = [-1, -1, -1, -1, -1, -1];
  const a = avecJournal([["2026-11-07", ligneJ(6)], ["2026-11-07", inconnue], ["2026-11-07", ligneJ(9)]]);
  const b = avecJournal([["2026-11-07", inconnue], ["2026-11-07", ligneJ(7)]]);
  const f = deuxSens(a, b);
  assert.deepEqual(f.journal.calculs, [6, 7, 9]);
  // Deux copies d'une même séance (le même numéro) : le plus grand total,
  // puis le texte — le même dans les deux sens.
  const c = avecJournal([["2026-11-07", numerotee([5, 5, 0, 0, 0, 9], 12345)]]);
  const d = avecJournal([["2026-11-07", numerotee([8, 2, 0, 0, 0, 1], 12345)]]);
  assert.deepEqual(entree(deuxSens(c, d), 0), [5, 5, 0, 0, 0, 9], "19 contre 11 : l'entrée entière du plus grand total");
  const partielle = avecJournal([["2026-11-07", numerotee([40, -1, -1, -1, -1, -1], 12345)]]);
  assert.deepEqual(entree(deuxSens(partielle, c), 0), [5, 5, 0, 0, 0, 9], "celle qui en sait le plus, même avec un plus petit total");
  // La journée coupée par la borne des deux côtés : les séances retrouvées par leur numéro.
  const suite = Array.from({length: 58}, (_, i) => [plus("2026-09-02", i), ligneJ(20)]);
  const e = avecJournal([["2026-09-01", numerotee(ligneJ(3), 20001)], ["2026-09-01", inconnue], ...suite]);
  const g = avecJournal([["2026-09-01", numerotee(ligneJ(1), 10001)], ["2026-09-01", numerotee(ligneJ(4), 20001)], ...suite]);
  assert.deepEqual(deuxSens(e, g).journal.calculs.slice(0, 2), [1, 4]);
});

test("fusion : stable — refusionner avec l'une ou l'autre copie ne change plus rien (copies d'une même histoire, v4 comprises, borne comprise)", () => {
  // Une histoire : des séances (jusqu'à 4 par jour), chacune son journal.
  let graine = 7;
  const hasard = n => { graine = (graine * 48271) % 2147483647; return graine % n; };
  for (let essai = 0; essai < 40; essai += 1) {
    const histoire = [];
    let jour = "2026-09-01";
    const longueur = 10 + hasard(80);
    while (histoire.length < longueur) {
      const fois = 1 + hasard(4);
      for (let k = 0; k < fois; k += 1) histoire.push([jour, [hasard(30), hasard(10), hasard(3), hasard(4), hasard(3), 1 + hasard(30)]]);
      jour = plus(jour, 1 + hasard(2));
    }
    // Une copie : la progression à un moment de l'histoire (60 au plus), en
    // version 4 parfois (sans journal).
    const copie = () => {
      const fin = 1 + hasard(histoire.length);
      const p = avecJournal(histoire.slice(0, fin));
      if (hasard(3)) return p;
      const v4 = JSON.parse(JSON.stringify(p));
      v4.version = 4;
      delete v4.journal;
      return P.normaliserParcours(v4);
    };
    const [a, b] = [copie(), copie()];
    const ab = deuxSens(a, b);
    // Une 3e copie qui revient : l'ordre des fusions ne compte pas.
    const c = copie();
    assert.deepEqual(P.fusionner(ab, c), P.fusionner(a, P.fusionner(b, c)), `essai ${essai} : associative`);
  }
});

// Une étape d'une séance, comme la page.
function jouerEtape(p, jour, etape, {entrainement = "reussi"} = {}) {
  if (etape.type === "jour") {
    P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(c => {
      p = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: true, ms: 2000, type: "P"}, {aujourdhui: jour}).parcours;
    });
    return P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
  }
  if (etape.type === "test") {
    return P.appliquerTest(p, {module: etape.module, marche: 0, niveaux: [{niveau: 1, justes: 0, total: 2}]}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
  }
  if (etape.type === "apprends") return P.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: "apprends"}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
  const reponses = etape.type === "entraine" && entrainement === "rate" ? ratee() : reussie();
  return P.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: etape.type, reponses}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
}

test("Codex 3 : une nouveauté réussie avant minuit compte, même si la séance continue (et rate) après minuit", () => {
  // Trois nouveautés prévues ; la première réussie mardi soir.
  let p = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: "2026-11-10", nouveautes: 3});
  for (let tour = 0; tour < 6 && !Object.values(p.modules).some(m => m.b.some(Boolean)); tour += 1) {
    p = jouerEtape(p, "2026-11-10", P.fileSeance(p, CARTE, {aujourdhui: "2026-11-10"}).etapes[0]);
  }
  assert.equal(p.seance.p[6], 1, "une nouveauté réussie mardi");
  assert.equal(p.seance.j[5], 1, "comptée dans ce que la séance a fait");
  // Après minuit : « J'apprends » de la suivante, puis l'entraînement raté.
  for (let tour = 0; tour < 6 && !p.seances.length; tour += 1) {
    p = jouerEtape(p, MERCREDI, P.fileSeance(p, CARTE, {aujourdhui: MERCREDI}).etapes[0], {entrainement: "rate"});
  }
  assert.deepEqual(p.seances, [MERCREDI]);
  assert.equal(p.journal.nouveautes[0], 1, "la nouveauté de mardi soir est au journal");
  // Un `j` déjà enregistré à 5 nombres se relit avec 0 nouveauté.
  const ancien = P.normaliserParcours({version: 5, seance: {jour: MERCREDI, etape: 1, n: 0, p: [1, 0, 0, 0, 0, 1, 0], j: [4, 3, 0, 1, 90]}});
  assert.deepEqual(ancien.seance.j, [4, 3, 0, 1, 90, 0]);
  // 3 au plus ; trafiqué (hors bornes), il vaut 0, comme les autres comptes.
  const relu = n => P.normaliserParcours({version: 5, seance: {jour: MERCREDI, etape: 1, n: 0, p: [1, 0, 0, 0, 0, 3, 0], j: [0, 0, 0, 0, 0, n]}}).seance.j[5];
  assert.deepEqual([relu(3), relu(50), relu(-1)], [3, 0, 0]);
});

test("Codex 5 : semaineEleve ne coche pas un jour qui n'est pas encore venu", () => {
  // Mercredi 11 : une séance datée du vendredi 13 (l'horloge d'un autre appareil).
  const s = P.semaineEleve(P.normaliserParcours({seances: [LUNDI, "2026-11-13"]}), CARTE, MERCREDI);
  assert.deepEqual(s.jours[4], {jour: "2026-11-13", fait: false, aujourdhui: false, apres: true});
  assert.equal(s.jours[0].fait, true);
  assert.equal(s.soirs, 1);
});

test("Codex 4 (la page) : un seul endroit verse le temps, avant chaque sortie et avant la sauvegarde", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const corps = nom => page.slice(page.indexOf(`function ${nom}(`), page.indexOf("\n      }\n", page.indexOf(`function ${nom}(`)));
  // Le seul appel au moteur, et le compteur vidé de ce qui est versé.
  assert.equal(page.split("PARCOURS.noterTemps(").length - 1, 1, "un seul endroit verse le temps");
  const verser = corps("verserTempsActif");
  assert.ok(verser.includes("PARCOURS.noterTemps("));
  assert.ok(verser.includes("actif.ms -= secondes * 1000;") && verser.indexOf("actif.ms -= secondes * 1000;") < verser.indexOf("PARCOURS.noterTemps("), "le compteur est vidé de ce qui est versé, avant de verser");
  // Avant chaque sortie, puis la sauvegarde.
  [["quitterSerie", "arreterActivite();"], ["quitterSeance", "state.seance = null;"], ["fermerLaPage", "envoyerAvantDeFermer();"]].forEach(([nom, apres]) => {
    const c = corps(nom);
    assert.ok(c.includes("if (verserTempsActif()) sauverParcours();"), `${nom} : le temps, puis la sauvegarde`);
    assert.ok(c.includes(apres), `${nom} : « ${apres} »`);
    assert.ok(c.indexOf("verserTempsActif()") < c.indexOf(apres), `${nom} : avant « ${apres} »`);
  });
  // La page cachée, fermée ou rechargée passe par là.
  assert.match(page, /window\.addEventListener\("pagehide", fermerLaPage\);/);
  assert.match(page, /if \(document\.visibilityState === "hidden"\) fermerLaPage\(\);/);
  assert.ok(!/addEventListener\("pagehide", envoyerAvantDeFermer\)/.test(page), "plus d'envoi sans le temps");
  // Un onglet caché arrête le compte (il reprend au geste suivant).
  assert.match(corps("compterTempsActif"), /actif\.dernier = enSeance\(\) && document\.visibilityState !== "hidden" \? maintenant : null;/);
});

test("trouvé en testant le rechargement : une séance ouverte, sans étape finie, ne se referme pas contre la copie fermée du serveur", () => {
  // Le serveur : la séance de mercredi fermée (compte 1). L'appareil l'a
  // rouverte, a fait un calcul du jour et 40 s, puis la page s'est rechargée
  // avant l'envoi.
  const serveur = P.normaliserParcours({version: 5, modules: {A2: {vu: "2026-11-08", b: [3, 3, 0, 0, 0], e: [MERCREDI, MERCREDI, null, null, null], a: [1, 1, 0, 0, 0], f: [1, 1, 0, 0, 0]}},
    seance: {jour: MERCREDI, etape: 0, n: 1, p: [0, 0, 0, 0, 3, 0, 0]}, seances: [MERCREDI], jours: [MERCREDI]});
  let appareil = P.ouvrirSeance(serveur, CARTE, {aujourdhui: MERCREDI});
  appareil = P.appliquerRetour(appareil, {module: "A2", niveau: 1, juste: true, ms: 1000, type: "P"}, {aujourdhui: MERCREDI}).parcours;
  appareil = P.noterTemps(appareil, 40);
  const f = deuxSens(appareil, serveur);
  assert.equal(f.seance.p[0], 1, "toujours ouverte");
  assert.deepEqual(f.seance.j, [1, 1, 0, 0, 40, 0], "ce qu'elle a fait est gardé");
  // Finie sur l'autre appareil (son compte a monté) : finie.
  const finie = jouerSeance(appareil, MERCREDI);
  assert.equal(deuxSens(finie, appareil).seance.p[0], 0);
});
