// « Suivre ses élèves », lot S1 « les journaux » (07/11/2026) : Défi tables,
// SPLAT! et Coffres magiques tiennent leur journal — Défi tables une entrée
// par séance finie, SPLAT! et Coffres une entrée par jour joué —, sur le
// modèle de Défi calcul (lot G1). La fusion entre deux appareils (la
// check-list du modèle commun, AGENTS.md), la version qui monte, ce que le
// serveur déclare, le pire cas, et la fonction de lecture commune aux cinq
// moteurs (resumeSuivi) que la page prof appellera au lot S2. Rien ne
// change à l'écran.
// Correctif après la relecture de Codex (07/11/2026) : chaque séance de Défi
// tables et de Défi calcul a son NUMÉRO ; la fusion réunit les séances par
// numéro (une copie sans journal n'efface plus rien, l'ordre des fusions ne
// compte plus) ; Défi calcul passe en version 6. SPLAT! note aussi le jour
// d'une série commencée la veille et continuée.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const T = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const S = require("../assets/js/splat-parcours.js");
const C = require("../assets/js/coffres-parcours.js");
const A = require("../outils/calcul_mental/flash_anzan_parcours.js");
const D = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
// Lot F4 : le test de palier déjà joué (ces tests jouent des séances module par module).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});
const CORE_CALCUL = require("../outils/calcul_mental/defi_calcul_core.js");
// Tout ce qui a un palier est « construit » : il y a toujours une nouveauté (comme tests/defi-calcul-journal-g1).
const CARTE_CALCUL = (carte => ({modules: carte.modules.map(fiche => Object.assign({}, fiche, {construit: fiche.paliers.some(Boolean)})), ordre: carte.ordre}))(CORE_CALCUL.carte());

// Une séance de Défi calcul jouée jusqu'au bout, comme la page (la même que
// tests/defi-calcul-journal-g1.test.mjs, tout juste ; `n` choisit la marche du test).
function jouerSeanceD(p, jour, n = 0) {
  p = D.ouvrirSeance(p, CARTE_CALCUL, {aujourdhui: jour, nouveautes: 1});
  const avant = p.seance.n;
  for (let tour = 0; tour < 30 && p.seance.n === avant; tour += 1) {
    const etape = D.fileSeance(p, CARTE_CALCUL, {aujourdhui: jour}).etapes[0];
    if (!etape) break;
    p = D.noterTemps(p, 60);
    if (etape.type === "jour") {
      D.tirerCalculsDuJour(p, CARTE_CALCUL, {aujourdhui: jour}).forEach(c => {
        p = D.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: (n + c.niveau) % 3 !== 0, ms: 2000, type: "P"}, {aujourdhui: jour}).parcours;
      });
      p = D.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE_CALCUL}).parcours;
    } else if (etape.type === "test") {
      const m = Math.min(n % 3, D.NIVEAUX[etape.module]);
      const niveaux = Array.from({length: Math.min(D.NIVEAUX[etape.module], m + 1)}, (_, i) => ({niveau: i + 1, justes: i < m ? 2 : 0, total: 2}));
      p = D.appliquerTest(p, {module: etape.module, marche: m, niveaux}, {aujourdhui: jour, carte: CARTE_CALCUL, seance: true}).parcours;
    } else {
      // Défi calcul, lot 2 : J'apprends en une étape reçoit les réponses.
      const reponses = [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
      p = D.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: etape.type, reponses}, {aujourdhui: jour, carte: CARTE_CALCUL, seance: true}).parcours;
    }
  }
  return p;
}
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

// Mercredi 11 novembre 2026 ; le lundi de sa semaine est le 9.
const MERCREDI = "2026-11-11";
const LUNDI = "2026-11-09";
const plus = (jour, n) => T.ajouterJours(jour, n);

// Fusionner dans les deux sens : le même résultat, et refusionner avec l'une
// ou l'autre copie ne change plus rien (la fusion est stable).
function deuxSens(fusionner, a, b) {
  const ab = fusionner(a, b);
  assert.deepEqual(fusionner(b, a), ab, "le même résultat dans les deux sens");
  assert.deepEqual(fusionner(ab, a), ab, "refusionner avec la première copie ne change rien");
  assert.deepEqual(fusionner(ab, b), ab, "refusionner avec la seconde copie ne change rien");
  assert.deepEqual(fusionner(ab, ab), ab, "ni avec elle-même");
  return ab;
}

// ================================================================ Défi tables

const entreeT = (p, i) => T.JOURNAL.map(champ => p.journal[champ][i]);
// Un parcours de Défi tables dont les séances et le journal sont donnés :
// [[jour, [table, etapes, calculs, justes, test, numero?]], …] — sans numéro,
// une entrée connue en reçoit un en se relisant.
function avecJournalT(paires) {
  const p = T.creerParcours();
  p.seances = paires.map(([jour]) => jour);
  T.JOURNAL.forEach((champ, index) => { p.journal[champ] = paires.map(([, entree]) => entree[index]); });
  return T.normaliserParcours(p);
}
const ligneT = n => [7, 4, n, n, 0];
// Une entrée telle que la page l'écrit : avec son numéro (rang × 10 000 + tirage).
const numeroteeT = (n, numero) => [7, 4, n, n, 0, numero];
const sansNumero = entree => entree.slice(0, -1);

// Une séance jouée jusqu'au bout, comme la page : le moteur note chaque
// étape. `resultat` donne le score d'une étape (par défaut : tout juste).
function jouerSeanceT(p, jour, {table = null, resultat = () => null, finJour = jour} = {}) {
  let seance = T.ouvrirSeance(p, {table, aujourdhui: jour});
  for (let tour = 0; tour < 12; tour += 1) {
    const etape = T.etapeDeSeance(p, seance, tour ? finJour : jour);
    if (!etape) break;
    const total = etape.type === "revision" ? etape.calculs : etape.type === "validation" ? 20 : 10;
    const r = resultat(etape, total) || {juste: total, total, reussi: true};
    const note = T.noterEtape(p, seance, etape, r, tour ? finJour : jour);
    p = note.parcours;
    seance = note.seance;
    if (seance.finie) break;
  }
  return {parcours: p, seance};
}

test("Défi tables, version 4 : un journal vide au départ, aligné sur les séances ; jamais de temps passé", () => {
  assert.equal(T.VERSION, 5); // 5 depuis le lot « le jour vert » (le travail hors séance)
  const p = T.creerParcours();
  assert.deepEqual(T.JOURNAL, ["table", "etapes", "calculs", "justes", "test", "numero"]);
  assert.deepEqual(p.journal, {table: [], etapes: [], calculs: [], justes: [], test: [], numero: []});
  assert.deepEqual(T.normaliserParcours(p), p);
  // Décision de Gwenaël (07/11/2026) : aider l'élève, pas le fliquer — ni
  // minutes ni temps de séance, et la page ne mesure rien.
  assert.equal("chrono" in p, false);
  assert.equal(T.noterTemps, undefined);
  assert.equal("minutes" in T.normaliserParcours({seances: [MERCREDI], journal: {minutes: [12]}}).journal, false, "des minutes envoyées ne sont pas gardées");
});

test("Défi tables : une séance finie écrit son entrée — la table, les étapes, Mes calculs du jour, le test", () => {
  // Léa : la table de 2 en cours, au départ 6 (5-6-7-8) ; des calculs dus.
  let p = T.normaliserParcours({tables: {2: {seance: {depart: 6, n: 3, dernier: "2026-11-10"}}},
    calculs: {"3-4": {boite: 1, vu: "2026-11-10", echeance: "2026-11-10"}, "3-5": {boite: 2, vu: "2026-11-09", echeance: "2026-11-10"}}});
  p.tables[3].acquise = "2026-11-01";
  p = T.normaliserParcours(p);
  const {parcours, seance} = jouerSeanceT(p, MERCREDI, {table: 2,
    resultat: (etape, total) => (etape.type === "revision" ? {juste: total - 1, total} : null)});
  assert.equal(seance.finie, true);
  assert.deepEqual(parcours.seances, [MERCREDI]);
  const [table, etapes, calculs, justes, test] = entreeT(parcours, 0);
  assert.equal(table, 2);
  assert.equal(etapes, seance.faites.length);
  const revision = seance.faites.filter(f => f.type === "revision");
  assert.ok(revision.length, "la séance a commencé par Mes calculs du jour");
  assert.equal(calculs, revision.reduce((s, f) => s + f.total, 0));
  assert.equal(justes, calculs - 1);
  const passe = seance.faites.some(f => f.type === "validation");
  assert.equal(test, passe ? 1 : 0, "le test réussi : 1 ; pas passé : 0");
});

test("Défi tables : le test pas encore réussi vaut 2 ; une séance sans table vaut 0 ; Mes calculs du jour sans réponse : 0 calcul", () => {
  // Le test raté au raccourci de la marche 7 : « pas encore » (2).
  let p = T.normaliserParcours({tables: {2: {seance: {depart: 6, n: 3, dernier: "2026-11-10"}}}});
  const rate = jouerSeanceT(p, MERCREDI, {table: 2, resultat: (etape, total) => (etape.type === "validation" ? {juste: 10, total, reussi: false} : null)});
  assert.ok(rate.seance.faites.some(f => f.type === "validation"), "le test a été passé");
  assert.equal(entreeT(rate.parcours, 0)[4], 2);
  // Les 9 tables passées : la séance est sans table (0).
  const tables = {};
  T.TABLES.forEach(t => { tables[t] = {acquise: "2026-10-01"}; });
  p = T.normaliserParcours({tables, calculs: {"3-4": {boite: 1, vu: "2026-11-10", echeance: "2026-11-10"}}});
  const expert = jouerSeanceT(p, MERCREDI, {resultat: (etape, total) => (etape.type === "revision" ? {juste: 0, total: 1, rien: true} : {juste: total, total, reussi: false})});
  assert.equal(expert.seance.finie, true);
  const e = entreeT(expert.parcours, 0);
  assert.equal(e[0], 0, "sans table : 0");
  assert.deepEqual([e[2], e[3]], [0, 0], "temps écoulé sans réponse : 0 calcul");
});

test("Défi tables : une séance qui passe minuit compte pour le jour où elle finit, avec ses étapes d'avant minuit", () => {
  const mardi = plus(MERCREDI, -1);
  const {parcours, seance} = jouerSeanceT(T.creerParcours(), mardi, {table: 2, finJour: MERCREDI});
  assert.equal(seance.finie, true);
  assert.deepEqual(parcours.seances, [MERCREDI], "le jour où elle finit");
  assert.equal(entreeT(parcours, 0)[1], seance.faites.length, "toutes ses étapes, d'avant et d'après minuit");
});

test("Défi tables : la séance reprise (rechargée, ou sur un autre appareil) garde ses étapes jusqu'au journal", () => {
  let p = T.creerParcours();
  let seance = T.ouvrirSeance(p, {table: 2, aujourdhui: MERCREDI});
  let etape = T.etapeDeSeance(p, seance, MERCREDI);
  let note = T.noterEtape(p, seance, etape, {juste: 10, total: 10}, MERCREDI);
  // Le même élève sur la tablette : le parcours du serveur, la séance reprise.
  p = T.normaliserParcours(JSON.parse(JSON.stringify(note.parcours)));
  seance = T.ouvrirSeance(p, {table: 2, aujourdhui: MERCREDI});
  assert.equal(seance.faites.length, 1, "reprise là où elle en était");
  while (!seance.finie) {
    etape = T.etapeDeSeance(p, seance, MERCREDI);
    note = T.noterEtape(p, seance, etape, {juste: 10, total: 10, reussi: true}, MERCREDI);
    p = note.parcours;
    seance = note.seance;
  }
  assert.equal(entreeT(p, 0)[1], seance.faites.length, "les étapes des deux appareils");
});

test("Défi tables : une progression de version 3 se relit sans rien perdre — ses séances ont un journal « pas connu »", () => {
  const v3 = {version: 3, seances: ["2026-11-02", "2026-11-03", "2026-11-03"], tables: {2: {acquise: "2026-11-01"}}};
  const p = T.normaliserParcours(v3);
  assert.equal(p.version, 5);
  assert.deepEqual(p.seances, v3.seances);
  assert.deepEqual(p.journal.test, [-1, -1, -1]);
  assert.equal(p.tables[2].acquise, "2026-11-01");
  // Une séance finie ensuite s'ajoute, connue.
  const suite = jouerSeanceT(p, MERCREDI, {table: 3}).parcours;
  assert.deepEqual(suite.journal.table, [-1, -1, -1, 3]);
});

test("Défi tables : donnée abîmée — une date impossible part avec son entrée, des valeurs hors bornes valent -1, une liste courte s'aligne sur la fin", () => {
  const p = T.normaliserParcours({
    seances: ["2026-11-02", "2026-02-30", "2026-11-03", "pas une date", "2026-11-04"],
    journal: {table: [2, 3, 4, 5, 6], etapes: [4, 4, 4, 4, 99], calculs: [10, 10, 10, 10, 8.5], justes: [12, 1, 2, 3, 4], test: [7, 1]}
  });
  assert.deepEqual(p.seances, ["2026-11-02", "2026-11-03", "2026-11-04"]);
  assert.deepEqual(p.journal.table, [2, 4, 6], "la date impossible et le texte partent avec leur entrée");
  assert.deepEqual(p.journal.etapes, [4, 4, -1], "99 étapes : hors bornes");
  assert.deepEqual(p.journal.calculs, [10, 10, -1], "8,5 : pas un entier, pas connu");
  assert.deepEqual(p.journal.justes, [10, 2, 4], "jamais plus de justes que de calculs");
  assert.deepEqual(p.journal.test, [-1, -1, 1], "la liste courte s'aligne sur la séance la plus récente (7 : hors bornes)");
});

test("Défi tables : la borne — 60 séances, le journal suit les plus récentes", () => {
  const paires = Array.from({length: 70}, (_, i) => [plus("2026-09-01", i), ligneT(i)]);
  const p = avecJournalT(paires);
  assert.equal(p.seances.length, 60);
  assert.equal(p.seances[0], plus("2026-09-01", 10));
  assert.equal(p.journal.calculs[0], 10);
  assert.equal(p.journal.calculs[59], 69);
});

test("Défi tables : chaque séance finie a son numéro — son rang dans la journée, puis l'empreinte de ses nombres", () => {
  let p = avecJournalT([["2026-11-09", ligneT(10)]]);
  p = jouerSeanceT(p, MERCREDI, {table: 2}).parcours;
  p = jouerSeanceT(p, MERCREDI, {table: 3}).parcours;
  const [lundi, premiere, seconde] = p.journal.numero;
  assert.equal(Math.floor(lundi / 10000), 1, "une entrée connue sans numéro en reçoit un (rang 1)");
  assert.equal(Math.floor(premiere / 10000), 1, "la première séance de mercredi : rang 1");
  assert.equal(Math.floor(seconde / 10000), 2, "la seconde : rang 2 — la journée reste dans l'ordre où elle a été jouée");
  assert.deepEqual(p.journal.table, [7, 2, 3]);
  // Relu, le numéro ne bouge pas ; une séance blanche (d'avant le journal) n'en a pas.
  assert.deepEqual(T.normaliserParcours(JSON.parse(JSON.stringify(p))), p);
  assert.deepEqual(T.normaliserParcours({version: 3, seances: [MERCREDI]}).journal.numero, [-1]);
  // Un numéro abîmé (rang 0, trop grand, pas un entier) : pas de numéro, l'entrée connue en reçoit un.
  const abime = T.normaliserParcours({seances: [MERCREDI, MERCREDI, MERCREDI], journal: {table: [2, 3, 4], etapes: [], calculs: [], justes: [], test: [], numero: [42, 1000000, 15000.5]}});
  assert.deepEqual(abime.journal.numero.map(n => Math.floor(n / 10000)), [1, 2, 3]);
});

test("Défi tables, fusion : deux appareils hors ligne le même jour — chaque séance une fois, jamais une copie en double", () => {
  const avant = avecJournalT([["2026-11-09", ligneT(10)]]);
  // Le téléphone : une séance mercredi ; la tablette : deux séances mercredi.
  const telephone = jouerSeanceT(avant, MERCREDI, {table: 2}).parcours;
  let tablette = jouerSeanceT(avant, MERCREDI, {table: 3}).parcours;
  tablette = jouerSeanceT(tablette, MERCREDI, {table: 3}).parcours;
  const f = deuxSens(T.fusionner, telephone, tablette);
  assert.deepEqual(f.seances, ["2026-11-09", MERCREDI, MERCREDI, MERCREDI], "les trois séances jouées mercredi");
  assert.deepEqual([...f.journal.table].sort(), [2, 3, 3, 7]);
  assert.equal(f.journal.calculs[0], 10, "lundi ne bouge pas");
  // Chaque entrée vient entière d'un seul côté.
  [1, 2, 3].forEach(i => assert.ok([entreeT(telephone, 1), entreeT(tablette, 1), entreeT(tablette, 2)].some(e => JSON.stringify(e) === JSON.stringify(entreeT(f, i)))));
  // Le téléphone renvoie ensuite la fusion : rien ne double.
  assert.deepEqual(T.fusionner(T.fusionner(f, telephone), tablette), f);
});

test("Défi tables, fusion : une vieille copie revient — elle n'efface aucune entrée connue, rien ne double", () => {
  const recente = avecJournalT([["2026-11-02", ligneT(8)], [MERCREDI, ligneT(12)]]);
  // Une page de version 3 restée ouverte : deux séances mercredi, sans journal.
  const vieille = T.normaliserParcours({version: 3, seances: ["2026-11-02", MERCREDI, MERCREDI]});
  const f = deuxSens(T.fusionner, recente, vieille);
  assert.deepEqual(f.seances, ["2026-11-02", MERCREDI, MERCREDI], "le plus grand des deux comptes : une séance sans numéro peut être la séance connue");
  assert.deepEqual(f.journal.calculs, [8, -1, 12], "la connue est gardée ; la séance de plus, pas connue, se range avant");
  // Deux copies d'une même séance (le même numéro) : celle qui en sait le
  // plus gagne, même avec un plus petit total ; puis le plus grand total.
  const partielle = T.normaliserParcours({seances: [MERCREDI], journal: {table: [7], etapes: [], calculs: [], justes: [], test: [], numero: [15555]}});
  const complete = avecJournalT([[MERCREDI, [0, 1, 0, 0, 0, 15555]]]);
  assert.deepEqual(entreeT(deuxSens(T.fusionner, partielle, complete), 0), [0, 1, 0, 0, 0, 15555]);
  assert.deepEqual(entreeT(deuxSens(T.fusionner, avecJournalT([[MERCREDI, [7, 4, 2, 2, 0, 15555]]]), complete), 0), [7, 4, 2, 2, 0, 15555]);
  // Une copie d'il y a quinze jours, avec son propre journal.
  const ancienne = avecJournalT([["2026-10-20", ligneT(3)]]);
  assert.deepEqual(deuxSens(T.fusionner, f, ancienne).journal.calculs, [3, 8, -1, 12]);
});

test("Défi tables, fusion (relecture de Codex, défaut 1) : une copie sans journal de 60 séances n'efface pas l'entrée connue de sa plus ancienne", () => {
  const a = avecJournalT([["2026-09-01", [7, 4, 12, 12, 0]]]);
  const b = T.normaliserParcours({version: 3, seances: ["2026-09-01", ...Array.from({length: 59}, (_, i) => plus("2026-09-02", i))]});
  assert.equal(b.seances.length, 60);
  const f = deuxSens(T.fusionner, a, b);
  assert.equal(f.seances.length, 60);
  assert.deepEqual(sansNumero(entreeT(f, 0)), [7, 4, 12, 12, 0], "l'entrée connue reste connue");
});

test("Défi tables, fusion (relecture de Codex, défaut 2) : la borne de 60 après la réunion — l'ordre des fusions ne change rien", () => {
  const a = avecJournalT([["2026-09-01", numeroteeT(4, 11234)], ["2026-09-01", numeroteeT(12, 25678)]]);
  const b = avecJournalT([["2026-09-01", numeroteeT(8, 13333)]]);
  const c = avecJournalT(Array.from({length: 59}, (_, i) => [plus("2026-09-02", i), numeroteeT(20, 10000 + i)]));
  const gauche = T.fusionner(T.fusionner(a, b), c);
  assert.deepEqual(T.fusionner(a, T.fusionner(b, c)), gauche);
  assert.deepEqual(T.fusionner(T.fusionner(a, c), b), gauche);
  assert.deepEqual(T.fusionner(T.fusionner(c, b), a), gauche);
  assert.equal(gauche.seances.length, 60);
  assert.deepEqual(entreeT(gauche, 0), numeroteeT(12, 25678), "le 1er septembre garde sa dernière séance");
  // Rien n'oscille : la vieille copie revient, encore et encore.
  let x = gauche;
  for (let tour = 0; tour < 4; tour += 1) {
    x = T.fusionner(x, [a, b, c][tour % 3]);
    assert.deepEqual(x, gauche, `tour ${tour + 1}`);
  }
});

test("Défi tables, fusion : stable sur des histoires au hasard (copies d'une même histoire, version 3 comprise, borne comprise)", () => {
  let graine = 11;
  const hasard = n => { graine = (graine * 48271) % 2147483647; return graine % n; };
  for (let essai = 0; essai < 40; essai += 1) {
    const histoire = [];
    let jour = "2026-09-01";
    const longueur = 10 + hasard(80);
    while (histoire.length < longueur) {
      const fois = 1 + hasard(3);
      for (let k = 0; k < fois; k += 1) histoire.push([jour, [2 + hasard(9), 1 + hasard(5), hasard(11), 0, hasard(3)]]);
      jour = plus(jour, 1 + hasard(2));
    }
    const copie = () => {
      const p = avecJournalT(histoire.slice(0, 1 + hasard(histoire.length)));
      if (hasard(3)) return p;
      const v3 = JSON.parse(JSON.stringify(p));
      v3.version = 3;
      delete v3.journal;
      return T.normaliserParcours(v3);
    };
    const [a, b, c] = [copie(), copie(), copie()];
    const ab = deuxSens(T.fusionner, a, b);
    assert.deepEqual(T.fusionner(ab, c), T.fusionner(a, T.fusionner(b, c)), `essai ${essai} : l'ordre des fusions ne compte pas`);
    // La copie la plus avancée (toute l'histoire) n'est jamais abîmée par une autre.
    const toute = avecJournalT(histoire);
    assert.deepEqual(T.fusionner(toute, a), toute, `essai ${essai} : la copie à jour reste telle quelle`);
  }
});

test("Défi tables et Défi calcul, fusion : trois appareils qui jouent chacun de leur côté et se réunissent dans n'importe quel ordre — le même journal, rien de connu perdu", () => {
  let graine = 7;
  const hasard = n => { graine = (graine * 48271) % 2147483647; return graine % n; };
  const vraiHasard = Math.random;
  Math.random = () => hasard(1000000) / 1000000;
  try {
    for (const [P, nom] of [[T, "Défi tables"], [D, "Défi calcul"]]) {
      for (let essai = 0; essai < 25; essai += 1) {
        // Des séances écrites comme la page les écrit (rangerSeances via la fin
        // de séance) : on les fabrique avec le moteur, jour après jour.
        const appareils = [P.creerParcours(), P.creerParcours(), P.creerParcours()];
        let jour = "2026-09-01";
        for (let n = 0; n < 30 + hasard(50); n += 1) {
          const i = hasard(3);
          appareils[i] = P.normaliserParcours(ajouterSeance(P, appareils[i], jour, hasard(9)));
          if (!hasard(4)) appareils[(i + 1) % 3] = P.fusionner(appareils[(i + 1) % 3], appareils[i]);
          if (!hasard(2)) jour = plus(jour, 1);
        }
        // Une page d'avant (sans journal) qui a vu l'un d'eux.
        const vieux = JSON.parse(JSON.stringify(appareils[hasard(3)]));
        delete vieux.journal;
        vieux.version = P === T ? 3 : 5;
        const [a, b, c, v] = [...appareils, P.normaliserParcours(vieux)];
        const reference = P.fusionner(P.fusionner(P.fusionner(a, b), c), v);
        const ordres = [P.fusionner(a, P.fusionner(b, P.fusionner(c, v))), P.fusionner(P.fusionner(v, c), P.fusionner(b, a)),
          P.fusionner(P.fusionner(P.fusionner(c, a), v), b)];
        // Le journal (les autres champs ont leurs propres règles, testées ailleurs).
        const journalDe = x => ({seances: x.seances, journal: x.journal});
        ordres.forEach((x, k) => assert.deepEqual(journalDe(x), journalDe(reference), `${nom}, essai ${essai}, ordre ${k + 2}`));
        // Toute séance connue d'un appareil, et encore dans les 60 plus récentes, est là, entière.
        const gardees = new Set(P.JOURNAL.length && reference.seances.map((j, i) => `${j} ${JSON.stringify(P.JOURNAL.map(ch => reference.journal[ch][i]))}`));
        const plusAncien = reference.seances[0];
        appareils.forEach(app => app.seances.forEach((j, i) => {
          const e = P.JOURNAL.map(ch => app.journal[ch][i]);
          if (j > plusAncien) assert.ok(gardees.has(`${j} ${JSON.stringify(e)}`), `${nom}, essai ${essai} : la séance ${j} est gardée`);
        }));
      }
    }
  } finally {
    Math.random = vraiHasard;
  }
});

test("Défi calcul, version 6 (relecture de Codex ; 7 au lot 1 « la séance ») : chaque séance a son numéro ; un journal de version 5 se relit sans rien perdre ; une copie sans journal n'efface rien", () => {
  assert.equal(D.VERSION, 10, "lot 6 « programmes 2 » : 9 ; lot F4 « personne ne reste bloqué » : 10");
  assert.deepEqual(D.JOURNAL, ["calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes", "numero"]);
  // Un journal de version 5 (lot G1) : ses entrées connues reçoivent un numéro (rang 1, 2…), les blanches non.
  const v5 = {version: 5, seances: ["2026-11-02", MERCREDI, MERCREDI],
    journal: {calculs: [-1, 10, 6], justes: [-1, 9, 6], nouveautes: [-1, 1, 0], prouvees: [-1, 0, 2], rouges: [-1, 0, 1], minutes: [-1, 6, 4]}};
  const p = D.normaliserParcours(v5);
  assert.equal(p.version, 10);
  assert.deepEqual(p.journal.calculs, [-1, 10, 6], "rien de perdu, dans l'ordre");
  assert.deepEqual(p.journal.numero.map(n => (n < 0 ? n : Math.floor(n / 10000))), [-1, 1, 2]);
  assert.deepEqual(D.normaliserParcours(v5), p, "le même numéro à chaque relecture, sur chaque appareil");
  // Une séance jouée ensuite : rang 3 ce jour-là.
  const suite = jouerSeanceD(sansTestDePalier(D.normaliserParcours(v5)), MERCREDI);
  assert.equal(Math.floor(suite.journal.numero[3] / 10000), 3);
  // Le défaut 1 de la relecture : une copie sans journal de 60 séances.
  const a = D.normaliserParcours({version: 5, seances: ["2026-09-01"], journal: {calculs: [10], justes: [9], nouveautes: [2], prouvees: [1], rouges: [0], minutes: [12]}});
  const b = D.normaliserParcours({version: 4, seances: ["2026-09-01", ...Array.from({length: 59}, (_, i) => plus("2026-09-02", i))]});
  const f = deuxSens(D.fusionner, a, b);
  assert.deepEqual(D.JOURNAL.slice(0, -1).map(champ => f.journal[champ][0]), [10, 9, 2, 1, 0, 12], "l'entrée connue reste connue");
  // La page prof et resumeSuivi ne rendent pas le numéro.
  assert.equal("numero" in D.resumeProf(suite, CARTE_CALCUL, MERCREDI).journal[0], false);
  assert.equal("numero" in D.resumeSuivi(suite, {aujourdhui: MERCREDI}).jours[0].lignes[0], false);
});

test("Défi tables et Défi calcul : entre la mise à jour du site et le FTP, le serveur jette le numéro — relue, la séance retrouve le même numéro et ne double pas", () => {
  for (const [P, jouer, nom] of [[T, (p, jour) => jouerSeanceT(p, jour, {table: 4}).parcours, "Défi tables"], [D, (p, jour) => jouerSeanceD(p, jour), "Défi calcul"]]) {
    // La page du jour : deux séances lundi, une mercredi.
    let local = P.normaliserParcours(P === T ? {version: 3, seances: [LUNDI]} : {version: 5, seances: [LUNDI], journal: {calculs: [3], justes: [3], nouveautes: [0], prouvees: [0], rouges: [0], minutes: [2]}});
    local = jouer(jouer(local, LUNDI), MERCREDI);
    // Le serveur d'avant le FTP : il garde le journal (Défi calcul) ou rien (Défi tables), jamais le numéro.
    const serveur = JSON.parse(JSON.stringify(local));
    if (P === T) delete serveur.journal; else delete serveur.journal.numero;
    const relu = P.fusionner(local, P.normaliserParcours(serveur));
    assert.deepEqual(relu.seances, local.seances, `${nom} : aucune séance en double`);
    assert.deepEqual(relu.journal, local.journal, `${nom} : le même journal, les mêmes numéros`);
    if (P === D) assert.deepEqual(P.normaliserParcours(serveur).journal.numero, local.journal.numero, "Défi calcul : le numéro se retrouve à la relecture");
  }
});

// Une séance finie, ajoutée par le moteur comme à la fin d'une vraie séance
// (même chemin : rangerSeances et un numéro neuf), sans la jouer étape par
// étape : on passe par une copie que l'on fusionne.
function ajouterSeance(P, p, jour, n) {
  if (P === T) return jouerSeanceT(p, jour, {table: 2 + (n % 9)}).parcours;
  return jouerSeanceD(p, jour, n);
}

test("Défi tables : réouverture — relire la progression du serveur ne change rien, rien à renvoyer", () => {
  const p = jouerSeanceT(avecJournalT([["2026-11-02", ligneT(8)]]), MERCREDI, {table: 2}).parcours;
  const serveur = JSON.parse(JSON.stringify(p));
  assert.deepEqual(T.fusionner(p, serveur), p);
  assert.deepEqual(T.normaliserParcours(serveur), p);
  assert.equal(JSON.stringify(T.fusionner(serveur, p)), JSON.stringify(p), "octet pour octet");
});

test("Défi tables : deux époques — la plus haute gagne en bloc, journal compris (Recommencer à zéro)", () => {
  const p = jouerSeanceT(T.creerParcours(), MERCREDI, {table: 2}).parcours;
  const zero = T.remettreAZero(p);
  assert.deepEqual(zero.journal.table, []);
  assert.deepEqual(deuxSens(T.fusionner, p, zero).journal.table, []);
});

// ===================================================================== SPLAT!

const serieS = (fait, etoiles, cartes, vues) => ({fait, etoiles, cartes, vues});

test("SPLAT!, version 2 : le journal du jour — les séries commencées, les étoiles, les réponses vues (chacune une fois)", () => {
  assert.equal(S.VERSION, 2);
  assert.deepEqual(S.JOURNAL, ["series", "reussies", "vues"]);
  let p = S.creer();
  assert.deepEqual(p, {version: 2, epoque: 0, etapes: {}}, "pas de journal tant que rien n'est joué");
  // Une série notée carte par carte : une réponse vue à la 2e carte, puis la
  // carte rouge rejouée (la même série) ; puis l'étoile.
  p = S.enregistrerEnCours(p, "m1e1", {sig: "a", idx: 1, etoiles: 1, res: [true], vues: 0, cartes: 4}, MERCREDI);
  p = S.enregistrerEnCours(p, "m1e1", {sig: "a", idx: 2, etoiles: 1, res: [true, "ko"], vues: 1, cartes: 4}, MERCREDI);
  p = S.enregistrerEnCours(p, "m1e1", {sig: "a", idx: 3, etoiles: 2, res: [true, "ko", true], vues: 1, cartes: 4}, MERCREDI);
  p = S.enregistrerSerie(p, "m1e1", serieS(true, 3, 4, 1), MERCREDI);
  assert.deepEqual(p.jours, [MERCREDI]);
  assert.deepEqual(p.journal, {series: [1], reussies: [1], vues: [1]}, "une série, une étoile, une réponse vue — pas trois");
  assert.equal(p.depuis, MERCREDI);
  // Une série finie d'un coup (sans note en cours), une autre seulement commencée.
  p = S.enregistrerSerie(p, "m1e2", serieS(true, 4, 4, 0), MERCREDI);
  p = S.enregistrerEnCours(p, "m1e3", {sig: "b", idx: 1, etoiles: 0, res: ["ko"], vues: 1, cartes: 4}, MERCREDI);
  assert.deepEqual(p.journal, {series: [3], reussies: [2], vues: [2]});
  // « Rejouer toute la série » : une nouvelle série.
  p = S.effacerEnCours(p, "m1e3");
  p = S.enregistrerEnCours(p, "m1e3", {sig: "c", idx: 1, etoiles: 1, res: [true], vues: 0, cartes: 4}, plus(MERCREDI, 1));
  assert.deepEqual(p.jours, [MERCREDI, plus(MERCREDI, 1)]);
  assert.deepEqual(p.journal, {series: [3, 1], reussies: [2, 0], vues: [2, 0]});
  // Ce qui part au serveur : le journal, des entiers et des dates seulement.
  const sortie = S.pourServeur(p);
  assert.deepEqual(sortie.journal, p.journal);
  assert.doesNotMatch(JSON.stringify(sortie), /"vj"|enCours|"sig"|"res"/, "le compte local des réponses vues ne part pas");
});

test("SPLAT! : une série commencée hier et finie aujourd'hui — la série hier, l'étoile aujourd'hui", () => {
  let p = S.enregistrerEnCours(S.creer(), "m2e1", {sig: "a", idx: 1, etoiles: 1, res: [true], vues: 0, cartes: 4}, "2026-11-10");
  p = S.enregistrerSerie(p, "m2e1", serieS(true, 3, 4, 0), MERCREDI);
  assert.deepEqual(p.jours, ["2026-11-10", MERCREDI]);
  assert.deepEqual(p.journal, {series: [1, 0], reussies: [0, 1], vues: [0, 0]});
});

test("SPLAT! (relecture de Codex, défaut 3) : une série commencée la veille et continuée sans être finie — ce jour-là aussi est un jour joué, la série n'est pas recomptée", () => {
  let p = S.creerParcours ? S.creerParcours() : {};
  p = S.enregistrerEnCours(p, "m1e1", {sig: "x", idx: 1, res: [true], vues: 0, cartes: 4}, LUNDI);
  p = S.enregistrerEnCours(p, "m1e1", {sig: "x", idx: 2, res: [true, true], vues: 0, cartes: 4}, plus(LUNDI, 1));
  assert.deepEqual(p.jours, [LUNDI, plus(LUNDI, 1)]);
  assert.deepEqual(p.journal, {series: [1, 0], reussies: [0, 0], vues: [0, 0]});
  const r = S.resumeSuivi(p, {aujourdhui: MERCREDI});
  assert.deepEqual(r.jours.map(j => j.jour), [LUNDI, plus(LUNDI, 1)]);
  assert.equal(r.dernier, plus(LUNDI, 1));
  // La même carte, rien de nouveau (la page rechargée) : pas un jour joué.
  p = S.enregistrerEnCours(p, "m1e1", {sig: "x", idx: 2, res: [true, true], vues: 0, cartes: 4}, MERCREDI);
  assert.deepEqual(p.jours, [LUNDI, plus(LUNDI, 1)]);
  // Finie le lendemain sans étoile : ce jour-là aussi.
  p = S.enregistrerSerie(p, "m1e1", serieS(false, 1, 4, 0), MERCREDI);
  assert.deepEqual(p.jours, [LUNDI, plus(LUNDI, 1), MERCREDI]);
  assert.deepEqual(p.journal.series, [1, 0, 0]);
});

test("SPLAT! : donnée abîmée, borne de 60 jours, jours en double", () => {
  const p = S.normaliser({version: 2, epoque: 0, etapes: {},
    jours: ["2026-11-02", "2026-02-30", "2026-11-03", "2026-11-02", "x"], journal: {series: [1, 9, 2, 5, 9], reussies: [1, 1, "2", 0, 1], vues: [-7, 0, 0, 1, 0]},
    depuis: "2026-12-01"});
  assert.deepEqual(p.jours, ["2026-11-02", "2026-11-03"]);
  assert.deepEqual(p.journal, {series: [5, 2], reussies: [1, -1], vues: [1, 0]}, "le même jour deux fois : le plus grand, colonne par colonne");
  assert.equal(p.depuis, "2026-11-02", "jamais après le premier jour gardé");
  // Une colonne trop courte s'aligne sur les jours les plus récents.
  assert.deepEqual(S.normaliser({etapes: {}, jours: ["2026-11-02", "2026-11-03"], journal: {series: [4], reussies: [], vues: [1, 2, 3]}}).journal,
    {series: [-1, 4], reussies: [-1, -1], vues: [2, 3]});
  // 70 jours : les 60 plus récents.
  const long = S.normaliser({etapes: {}, jours: Array.from({length: 70}, (_, i) => plus("2026-08-01", i)), journal: {series: Array.from({length: 70}, (_, i) => i), reussies: [], vues: []}});
  assert.equal(long.jours.length, 60);
  assert.equal(long.journal.series[0], 10);
});

test("SPLAT!, fusion : deux appareils le même jour (le plus grand), une vieille copie, la borne, les deux sens, la réouverture", () => {
  const jour = (j, series, reussies, vues) => ({version: 2, epoque: 0, etapes: {m1e1: {fait: true, etoiles: 3, cartes: 4, vues: 0, essais: 1, date: "2026-11-01"}},
    jours: j, journal: {series, reussies, vues}, depuis: j[0]});
  const telephone = jour(["2026-11-09", MERCREDI], [2, 1], [1, 1], [0, 0]);
  const tablette = jour([MERCREDI], [3], [0], [-1]);
  const f = deuxSens(S.fusionner, telephone, tablette);
  assert.deepEqual(f.jours, ["2026-11-09", MERCREDI]);
  assert.deepEqual(f.journal, {series: [2, 3], reussies: [1, 1], vues: [0, 0]}, "le plus grand de chaque colonne, jamais la somme ; connu bat -1");
  assert.equal(f.depuis, "2026-11-09");
  // Une vieille copie (version 1, sans journal) n'efface rien.
  const vieille = S.normaliser({version: 1, epoque: 0, etapes: {m1e1: {fait: true, etoiles: 3, cartes: 4, vues: 0, essais: 1, date: "2026-11-01"}}});
  assert.deepEqual(deuxSens(S.fusionner, f, vieille).journal, f.journal);
  // La borne : 60 jours d'un côté, un jour plus ancien de l'autre — rien n'oscille.
  const plein = jour(Array.from({length: 60}, (_, i) => plus("2026-09-01", i)), Array(60).fill(1), Array(60).fill(1), Array(60).fill(0));
  const ancien = jour(["2026-08-20"], [9], [9], [9]);
  const g = deuxSens(S.fusionner, plein, ancien);
  assert.deepEqual([g.jours, g.journal], [S.normaliser(plein).jours, S.normaliser(plein).journal], "le jour trop ancien ne revient pas");
  assert.equal(g.depuis, "2026-08-20", "le journal était tenu dès le 20 août (le lot S2 sait que la borne coupe : connuDepuis)");
  assert.equal(S.resumeSuivi(g, "2026-11-01").connuDepuis, "2026-09-01");
  // Réouverture : relire le serveur ne change rien.
  assert.deepEqual(S.fusionner(f, JSON.parse(JSON.stringify(S.pourServeur(f)))), f);
});

test("SPLAT! : stable sur des histoires au hasard (deux appareils qui jouent, des copies qui reviennent)", () => {
  let graine = 5;
  const hasard = n => { graine = (graine * 48271) % 2147483647; return graine % n; };
  for (let essai = 0; essai < 30; essai += 1) {
    const appareils = [S.creer(), S.creer(), S.creer()];
    const copies = [];
    let jour = "2026-09-01";
    for (let geste = 0; geste < 40 + hasard(60); geste += 1) {
      const i = hasard(3);
      const id = S.PARCOURS_VALIDES[hasard(8)];
      appareils[i] = hasard(2) ? S.enregistrerSerie(appareils[i], id, serieS(Boolean(hasard(2)), 2, 4, hasard(3)), jour)
        : S.enregistrerEnCours(appareils[i], id, {sig: String(hasard(5)), idx: 1 + hasard(3), etoiles: 1, res: [true], vues: hasard(3), cartes: 4}, jour);
      if (hasard(5) === 0) { const j = hasard(3); appareils[j] = S.fusionner(appareils[j], appareils[(j + 1) % 3]); }
      if (hasard(7) === 0) copies.push(appareils[hasard(3)]);
      if (hasard(3) === 0) jour = plus(jour, 1 + hasard(3));
    }
    // Le journal seul (la reprise locale d'une série en cours suit le premier
    // appareil, comme avant le lot S1 : elle ne part jamais au serveur).
    const j = p => ({jours: p.jours, journal: p.journal, depuis: p.depuis});
    const fj = (x, y) => j(S.fusionner(x, y));
    const [a, b, c] = appareils;
    assert.deepEqual(fj(a, b), fj(b, a), `essai ${essai} : les deux sens`);
    const ab = S.fusionner(a, b);
    assert.deepEqual(fj(ab, a), j(ab), `essai ${essai} : refusionner ne change rien`);
    assert.deepEqual(fj(ab, c), fj(a, S.fusionner(b, c)), `essai ${essai} : l'ordre ne compte pas`);
    const tout = [...copies, ...appareils].reduce((x, y) => S.fusionner(x, y), S.creer());
    copies.forEach(copie => assert.deepEqual(fj(tout, copie), j(tout), `essai ${essai} : une vieille copie ne change rien`));
  }
});

// ============================================================ Coffres magiques

const SERIE = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];
function tresorC(p, jour, {aide = false, solution = false} = {}) {
  p = C.commencerPartie(p, {niveau: 1, ops: [1, 2, 3, 4], serie: SERIE, familles: SERIE.map(() => false)}, jour);
  if (aide) p = C.noterAide(p, "sum", jour);
  if (solution) p = C.noterSolution(p, "sum", jour);
  SERIE.forEach(o => { p = C.noterCle(p, o, jour); });
  return C.noterTresor(p, jour);
}

test("Coffres magiques, version 2 : le journal du jour — trésors, parfaits, aides, solutions", () => {
  assert.equal(C.VERSION, 4, "version 4 depuis le lot « le jour vert » (les clés du jour au journal)");
  assert.deepEqual(C.JOURNAL, ["tresors", "parfaits", "aides", "solutions", "cles"]);
  assert.deepEqual(C.creer(), {version: 4, epoque: 0, niveaux: {}, operations: {}});
  let p = tresorC(C.creer(), MERCREDI);
  p = tresorC(p, MERCREDI, {aide: true});
  p = tresorC(p, MERCREDI, {aide: true, solution: true});
  p = C.noterAide(p, "product", plus(MERCREDI, 1));
  assert.deepEqual(p.jours, [MERCREDI, plus(MERCREDI, 1)]);
  assert.deepEqual(p.journal, {tresors: [3, 0], parfaits: [2, 0], aides: [2, 1], solutions: [1, 0], cles: [30, 0]}, "une aide ne casse pas le parfait, une solution si ; les clés du jour (lot « le jour vert »)");
  assert.equal(p.depuis, MERCREDI);
  assert.deepEqual(C.pourServeur(p).journal, p.journal);
  // Une erreur ou une clé seules ne font pas un jour du journal.
  assert.equal("jours" in C.noterErreur(C.creer(), "sum", MERCREDI), false);
});

test("Coffres, fusion : le plus grand de chaque colonne le même jour, une vieille copie, la borne, les deux sens, la réouverture", () => {
  const a = tresorC(tresorC(C.creer(), "2026-11-09"), MERCREDI);
  const b = tresorC(tresorC(tresorC(C.creer(), MERCREDI), MERCREDI, {solution: true}), MERCREDI);
  const f = deuxSens(C.fusionner, a, b);
  assert.deepEqual(f.jours, ["2026-11-09", MERCREDI]);
  assert.deepEqual(f.journal.tresors, [1, 3], "jamais la somme");
  assert.deepEqual(f.journal.solutions, [0, 1]);
  assert.deepEqual(deuxSens(C.fusionner, f, C.normaliser({version: 1, niveaux: {1: {tresors: 1, parfaits: 1}}})).journal, f.journal, "une vieille copie n'efface rien");
  const plein = C.normaliser({jours: Array.from({length: 60}, (_, i) => plus("2026-09-01", i)), journal: {tresors: Array(60).fill(1), parfaits: [], aides: [], solutions: []}});
  const g = deuxSens(C.fusionner, plein, C.normaliser({jours: ["2026-08-01"], journal: {tresors: [5], parfaits: [5], aides: [5], solutions: [5]}}));
  assert.deepEqual([g.jours, g.journal], [plein.jours, plein.journal], "le jour trop ancien ne revient pas");
  assert.equal(C.resumeSuivi(g, "2026-11-01").connuDepuis, "2026-09-01", "la borne coupe : connu depuis le plus ancien jour gardé");
  assert.deepEqual(C.fusionner(f, JSON.parse(JSON.stringify(C.pourServeur(f)))), f);
});

// =================================================== la lecture commune (S2)

const FORME = ["appli", "aujourdhui", "debut", "connuDepuis", "dernier", "jours", "aider", "feliciter"];

test("resumeSuivi : le même nom et la même forme dans les cinq moteurs, des nombres seulement, aucune phrase", () => {
  const moteurs = [[T, T.creerParcours(), "defi-tables"], [S, S.creer(), "splat"], [C, C.creer(), "coffres"],
    [A, A.creer(), "flash-anzan"], [D, sansTestDePalier(D.creerParcours()), "defi-calcul"]];
  moteurs.forEach(([M, vide, appli]) => {
    assert.equal(typeof M.resumeSuivi, "function", appli);
    const r = M.resumeSuivi(vide, {aujourdhui: MERCREDI});
    assert.deepEqual(Object.keys(r), FORME, appli);
    assert.equal(r.appli, appli);
    assert.equal(r.debut, "2026-10-19", `${appli} : le lundi d'il y a trois semaines`);
    assert.deepEqual([r.dernier, r.jours, r.aider, r.feliciter], [null, [], [], []], `${appli} : rien`);
    assert.deepEqual(M.resumeSuivi(vide, MERCREDI), r, `${appli} : le jour seul se donne aussi`);
    assert.deepEqual(M.resumeSuivi(null, MERCREDI).jours, [], `${appli} : un parcours absent ne casse rien`);
  });
});

test("resumeSuivi, Défi tables : les jours de travail (une ligne par séance), un jour futur écarté, à aider (8 séances), à féliciter (une table passée)", () => {
  let p = avecJournalT([["2026-10-12", ligneT(1)], ["2026-10-20", ligneT(2)], [LUNDI, ligneT(3)], [LUNDI, ligneT(4)], ["2026-11-20", ligneT(5)]]);
  p.tables[5].acquise = "2026-11-10";
  p.tables[6].acquise = "2026-11-02";
  p.tables[7].seance = {depart: 3, n: 9, dernier: LUNDI};
  p = T.normaliserParcours(p);
  const r = T.resumeSuivi(p, {aujourdhui: MERCREDI});
  // Lot « le jour vert » : les jours où une table a été passée sans séance
  // (02/11, 10/11) sont rattrapés à la lecture.
  assert.deepEqual(r.jours.map(j => j.jour), ["2026-10-20", "2026-11-02", LUNDI, "2026-11-10"], "dans les 4 semaines, jusqu'à aujourd'hui");
  assert.deepEqual(r.jours[2].lignes, [{table: 7, etapes: 4, calculs: 3, justes: 3, test: 0}, {table: 7, etapes: 4, calculs: 4, justes: 4, test: 0}]);
  assert.equal(r.dernier, "2026-11-10", "le 20 novembre n'est pas encore venu");
  assert.deepEqual(r.aider, [{type: "seances-longues", table: 7, seances: 9}]);
  assert.deepEqual(r.feliciter, [{type: "table", table: 5}], "seulement cette semaine");
  assert.equal(r.connuDepuis, null);
  // Une séance d'avant le lot S1 : ses nombres sont null.
  const v3 = T.resumeSuivi({version: 3, seances: [LUNDI]}, MERCREDI);
  assert.deepEqual(v3.jours, [{jour: LUNDI, lignes: [{table: null, etapes: null, calculs: null, justes: null, test: null}]}]);
  // La borne atteinte : on sait depuis quand.
  const plein = avecJournalT(Array.from({length: 60}, (_, i) => [plus("2026-10-01", i % 30), ligneT(1)]));
  assert.equal(T.resumeSuivi(plein, MERCREDI).connuDepuis, "2026-10-01");
});

test("resumeSuivi, SPLAT! : un jour joué = un jour de travail ; à aider : des réponses vues cette semaine ; à féliciter : un monde fini cette semaine", () => {
  let p = S.creer();
  const monde1 = S.CARTE.ETAPES.filter(e => e[4] === 1).map(e => e[0]);
  monde1.forEach((id, i) => { p = S.enregistrerSerie(p, id, serieS(true, 4, 4, 0), i < 5 ? "2026-11-02" : "2026-11-10"); });
  p = S.enregistrerEnCours(p, "m2e1", {sig: "a", idx: 2, etoiles: 0, res: [false, "ko"], vues: 1, cartes: 4}, MERCREDI);
  const r = S.resumeSuivi(p, {aujourdhui: MERCREDI});
  assert.deepEqual(r.jours.map(j => j.jour), ["2026-11-02", "2026-11-10", MERCREDI]);
  assert.deepEqual(r.jours[2].lignes, [{series: 1, reussies: 0, vues: 1, etapes: [], bonus: 0}]);
  assert.deepEqual(r.aider, [{type: "reponses-vues", vues: 1}]);
  assert.deepEqual(r.feliciter, [{type: "monde", monde: 1}], "le monde 1 fini mardi");
  assert.deepEqual(S.resumeSuivi(p, {aujourdhui: plus(MERCREDI, 7)}).feliciter, [], "la semaine d'après : plus rien");
  assert.equal(r.connuDepuis, "2026-11-02");
  assert.equal(r.dernier, MERCREDI);
  // Un élève qui n'a joué qu'avant le lot S1 : rien de connu, mais un dernier jour.
  const avant = S.resumeSuivi({version: 1, etapes: {m1e1: {fait: true, etoiles: 4, cartes: 4, vues: 0, essais: 1, date: "2026-11-03"}}}, MERCREDI);
  assert.equal(avant.dernier, "2026-11-03");
  assert.equal(avant.connuDepuis, plus(MERCREDI, 1), "rien n'est connu jusqu'à aujourd'hui compris");
  assert.deepEqual(avant.jours, []);
});

test("resumeSuivi, Coffres : un trésor ouvert = un jour de travail ; à aider : des solutions vues cette semaine ; rien à féliciter", () => {
  let p = tresorC(C.creer(), "2026-11-02");
  p = C.noterAide(p, "sum", "2026-11-10");
  p = tresorC(p, MERCREDI, {solution: true});
  const r = C.resumeSuivi(p, {aujourdhui: MERCREDI});
  assert.deepEqual(r.jours.map(j => j.jour), ["2026-11-02", MERCREDI], "une aide seule n'est pas un jour de travail");
  assert.deepEqual(r.jours[1].lignes, [{tresors: 1, parfaits: 0, aides: 0, solutions: 1, cles: 10}]);
  assert.deepEqual(r.aider, [{type: "solutions-vues", solutions: 1}]);
  assert.deepEqual(r.feliciter, []);
  assert.equal(r.dernier, MERCREDI);
});

test("resumeSuivi, Anzan : une séance avec un calcul fait = un jour de travail ; à féliciter : un grade réussi cette semaine", () => {
  let p = A.creer();
  const flash = {operations: "plus", chiffresMin: 1, chiffresMax: 1, nombres: 5, temps: 10, calculs: 10, son: "bip"};
  p = A.noterSeance(p, {id: 11, mode: "flash", reglages: flash, faits: 10, score: 8}, "2026-11-02").parcours;
  p = A.noterSeance(p, {id: 12, mode: "flash", reglages: flash, faits: 4, score: 4}, LUNDI).parcours;
  const grade = A.etatGrades(p)[0];
  p = A.noterSeance(p, {id: 13, mode: "grade", reglages: {operations: "plus", chiffresMin: grade.chiffres, chiffresMax: grade.chiffres, nombres: grade.nombres, grade: 1, calculs: 10}, faits: 10, score: 9}, MERCREDI).parcours;
  const r = A.resumeSuivi(p, {aujourdhui: MERCREDI});
  assert.deepEqual(r.jours.map(j => j.jour), ["2026-11-02", LUNDI, MERCREDI]);
  assert.deepEqual(r.jours[1].lignes, [{mode: "flash", calculs: 4, justes: 4, prevus: 10, grade: 0, reussi: null}]);
  assert.deepEqual(r.aider, []);
  assert.equal(A.gradeReussi(p), 1);
  assert.deepEqual(r.feliciter, [{type: "grade", grade: 1}]);
  assert.deepEqual(A.resumeSuivi(p, plus(MERCREDI, 7)).feliciter, [], "la semaine d'après : plus rien");
});

test("resumeSuivi, Défi calcul : les séances du journal ; à aider : à reprendre en classe, rouges ; à féliciter : 5 compétences sues ou plus cette semaine", () => {
  const p = D.normaliserParcours({version: 5, seances: [LUNDI, MERCREDI], journal: {calculs: [10, 8], justes: [9, 8], nouveautes: [1, 0], prouvees: [0, 2], rouges: [0, 1], minutes: [6, 7]},
    modules: {
      A2: {vu: LUNDI, ok: null, b: [4, 4, 4, 4, 4], e: [null, null, null, null, null], a: [1, 1, 1, 1, 1], f: [1, 1, 1, 1, 1], x: [0, 0, 0, 0, 0], t: [0, 0, 0, 0, 0], c: {},
        d: [LUNDI, LUNDI, LUNDI, LUNDI, LUNDI], s: [LUNDI, LUNDI, "2026-11-10", MERCREDI, MERCREDI]},
      A3: {vu: LUNDI, ok: null, b: [1, 0, 0, 0, 0], e: [LUNDI, null, null, null, null], a: [1, 0, 0, 0, 0], f: [1, 0, 0, 0, 0], x: [0, 0, 0, 0, 0], t: [0, 0, 0, 0, 0], c: {}}
    }});
  const r = D.resumeSuivi(p, {aujourdhui: MERCREDI});
  assert.deepEqual(r.jours.map(j => j.jour), [LUNDI, MERCREDI]);
  // Les minutes que Défi calcul garde ne sont pas rendues : la page ne les montrera pas (07/11/2026).
  assert.deepEqual(r.jours[1].lignes, [{calculs: 8, justes: 8, nouveautes: 0, prouvees: 2, rouges: 1, modules: ["A2"]}]);
  assert.ok(r.aider.some(a => a.type === "rouges" && a.competences >= 1), JSON.stringify(r.aider));
  assert.deepEqual(r.feliciter, [{type: "competences", competences: 5}]);
});

// ====================================================== le serveur, la taille

const mesurer = valeur => {
  let cles = 0;
  const compter = v => {
    if (Array.isArray(v)) v.forEach(compter);
    else if (v && typeof v === "object") Object.keys(v).forEach(cle => { cles += 1; compter(v[cle]); });
  };
  compter(valeur);
  return {cles, octets: Buffer.byteLength(JSON.stringify(valeur))};
};

test("le pire cas de chaque appli tient sous les bornes du serveur (2 000 clés, 40 000 octets)", async () => {
  // Défi tables : la référence complète, 60 séances au journal plein aux plus grands nombres.
  const {parcoursComplet: completT} = await import("../scripts/generer-parcours-reference.mjs");
  const t = completT();
  t.seances = Array.from({length: 60}, (_, i) => plus("2026-09-01", i));
  t.journal = {table: Array(60).fill(10), etapes: Array(60).fill(16), calculs: Array(60).fill(999), justes: Array(60).fill(999), test: Array(60).fill(2),
    numero: Array.from({length: 60}, (_, i) => 999999 - i)};
  t.retenir = {jour: "2026-10-30", erreurs: Array.from({length: 60}, (_, i) => 1000 + i)};
  const pireT = T.normaliserParcours(t);
  assert.equal(pireT.journal.calculs.length, 60);
  assert.equal(Math.max(...pireT.journal.numero), 999999);
  // SPLAT! : les 54 parcours, 60 jours au journal plein.
  const {parcoursComplet: completS} = await import("../scripts/generer-parcours-reference-splat.mjs");
  const s = completS();
  s.jours = Array.from({length: 60}, (_, i) => plus("2026-09-01", i));
  s.journal = {series: Array(60).fill(9999), reussies: Array(60).fill(9999), vues: Array(60).fill(9999)};
  const pireS = S.pourServeur(s);
  assert.equal(pireS.jours.length, 60);
  // Coffres : 60 jours au journal plein.
  const {parcoursComplet: completC} = await import("../scripts/generer-parcours-reference-coffres.mjs");
  const c = completC();
  c.jours = Array.from({length: 60}, (_, i) => plus("2026-09-01", i));
  c.journal = {tresors: Array(60).fill(9999), parfaits: Array(60).fill(9999), aides: Array(60).fill(9999), solutions: Array(60).fill(9999)};
  const pireC = C.pourServeur(c);
  [[pireT, "Défi tables"], [pireS, "SPLAT!"], [pireC, "Coffres"]].forEach(([p, nom]) => {
    const m = mesurer(p);
    assert.ok(m.cles < 2000, `${nom} : ${m.cles} clés`);
    assert.ok(m.octets < 40000, `${nom} : ${m.octets} octets`);
  });
});

test("serveur : version_min 5 (Défi tables), 6 (Défi calcul), 2 (SPLAT!) et 4 (Coffres), les clés du journal déclarées ; infos.php le dit en une phrase", async () => {
  const applis = await lire("../_serveur/public/lib/applis.php");
  const bloc = (debut, fin) => applis.slice(applis.indexOf(`'${debut}' => [`), applis.indexOf(`'${fin}' => [`));
  const tables = bloc("defi-tables", "coffres");
  assert.match(tables, /'version_min' => 5,/);
  ["journal", ...T.JOURNAL].forEach(cle => assert.match(tables, new RegExp(`'cles' => \\[[\\s\\S]*'${cle}'[\\s\\S]*\\],`), cle));
  const clesTables = tables.slice(tables.indexOf("'cles' => ["), tables.indexOf("'mots' =>"));
  assert.doesNotMatch(clesTables, /'chrono'|'secondes'|'minutes'/, "Défi tables ne déclare aucun temps passé");
  assert.match(bloc("coffres", "flash-anzan"), /'version_min' => 4,/, "Coffres : version 4 depuis le lot « le jour vert »");
  const calcul = bloc("defi-calcul", "automatismes");
  assert.match(calcul, /'version_min' => 10,/, "Défi calcul : une page de version 9 effacerait `ar` et `paliers` (9 : F6 et F9 ; 8 : `ceintures` ; 7 : `l` et le plan à 11 nombres ; 5 : les numéros)");
  ["journal", ...D.JOURNAL].forEach(cle => assert.match(calcul, new RegExp(`'cles' => \\[[\\s\\S]*'${cle}'[\\s\\S]*\\],`), `Défi calcul : ${cle}`));
  assert.match(bloc("splat", "soley"), /'version_min' => 2,/);
  assert.equal((applis.match(/'version_min' =>/g) || []).length, 4, "Défi calcul, Défi tables, Coffres, SPLAT!");
  ["jours", "journal", "depuis", ...S.JOURNAL].forEach(cle => assert.ok(S.CLES_SERVEUR.includes(cle), `SPLAT! : ${cle}`));
  ["jours", "journal", "depuis", ...C.JOURNAL].forEach(cle => assert.ok(C.CLES_SERVEUR.includes(cle), `Coffres : ${cle}`));
  const infos = await lire("../_serveur/public/infos.php");
  assert.match(infos, /<p>Dans chaque activité, ta progression, ce sont aussi les jours où tu travailles et le nombre de tes réussites\.<\/p>/);
  assert.equal((infos.match(/jours où tu/g) || []).length, 1, "une phrase, pas deux");
  // Les cinq moteurs copiés à l'identique pour Ma classe et Mon espace.
  for (const [site, prof] of [["../outils/calcul_mental/defi_tables_mon_parcours.js", "defi_tables_mon_parcours.js"],
    ["../assets/js/splat-parcours.js", "splat-parcours.js"], ["../assets/js/coffres-parcours.js", "coffres-parcours.js"],
    ["../outils/calcul_mental/flash_anzan_parcours.js", "flash_anzan_parcours.js"], ["../outils/calcul_mental/defi_calcul_mon_parcours.js", "defi_calcul_mon_parcours.js"]]) {
    assert.equal(await lire(`../_serveur/public/prof/${prof}`), await lire(site), prof);
  }
});

test("les moteurs changent d'adresse dans toutes les pages qui les chargent", async () => {
  for (const page of ["../outils/splat.html", "../outils/splat_tache_barre.html", "../outils/equasplat.html", "../outils/splat_univers.html"]) {
    assert.match(await lire(page), /splat-parcours\.js\?v=20261111-2"/, page);
  }
  assert.match(await lire("../outils/calcul_mental/coffres_magiques_solo.html"), /coffres-parcours\.js\?v=20261111-3"/);
  assert.match(await lire("../outils/calcul_mental/defi_tables.html"), /defi_tables_mon_parcours\.js\?v=20261111-3"/);
  assert.match(await lire("../outils/calcul_mental/flash_anzan.html"), /flash_anzan_parcours\.js\?v=20261111-2"/);
  assert.match(await lire("../outils/calcul_mental/defi_calcul_modules.html"), /defi_calcul_mon_parcours\.js\?v=20261121-1"/);
});

// ============================================================ la page Défi tables

test("la page Défi tables ne change pas : seule l'adresse du moteur monte ; elle ne mesure aucun temps", async () => {
  const page = await lire("../outils/calcul_mental/defi_tables.html");
  assert.match(page, /defi_tables_mon_parcours\.js\?v=20261111-3"/);
  assert.doesNotMatch(page, /TROU_ACTIF_MS|verserTempsActif|noterTemps/);
});
