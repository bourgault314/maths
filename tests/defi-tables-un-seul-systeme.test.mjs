// Défi tables — lot « un seul système, les boîtes » (05/10/2026, décisions de
// Gwenaël sur planches, dossier audit-defi-tables\un-seul-systeme\) :
//   1. Mes calculs du jour est LA PORTE de la journée : une fois par jour, en
//      premier ; dix calculs chronométrés (6 s par calcul, 30 s au moins) ; il
//      ne se rate pas ;
//   2. il ne prend que les calculs des tables PASSÉES — avant aujourd'hui ;
//   3. les calculs dus d'abord, puis un complément (tables passées, vus depuis
//      le plus longtemps), jamais deux fois le même ;
//   4. les séances suivantes du même jour : les calculs dus qui restent (sans
//      complément, sans porte), puis trois marches ; plus rien de dû : quatre ;
//   5. le mélange est libre : plus de verrou, plus d'« à refaire », plus dans
//      la séance ; trois trophées (réussi avec au moins 3, 6, puis 9 tables :
//      trois coupes grises qui se dorent, sans mot ni nombre) et un bouton
//      proposé quand une table vient d'être passée ET qu'un trophée est à
//      gagner ;
//   6. « Je passe le test », la table est « passée » ; l'escalier et Platine
//      dès 9 tables passées ;
//   7. les petits restes : « Tu as choisi », le pied de l'élève, « 10 / 11 »,
//      les nombres manquants écrits du côté de la table connue.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const CORE = require("../outils/calcul_mental/defi_tables_core.js");
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const html = await lire("../outils/calcul_mental/defi_tables.html");
const moteur = await lire("../outils/calcul_mental/defi_tables_mon_parcours.js");
const copie = await lire("../_serveur/public/prof/defi_tables_mon_parcours.js");
const applis = await lire("../_serveur/public/lib/applis.php");
const prof = await lire("../_serveur/public/prof/index.php");
const espace = await lire("../_serveur/public/index.php");

const LUNDI = "2026-10-05";
const MARDI = "2026-10-06";
const MERCREDI = "2026-10-07";

function hasard(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Un parcours avec des tables passées (à une date) et leurs calculs répondus
// juste, une fois par jour donné.
function eleve(passees, jours, datePassage = jours[jours.length - 1]) {
  let p = P.creerParcours();
  passees.forEach(table => {
    jours.forEach(jour => {
      P.faitsDeLaTable(table).forEach(cle => { p = P.appliquerReponse(p, cle, {correcte: true, date: jour}).parcours; });
    });
    p.tables[table].acquise = datePassage;
  });
  return P.normaliserParcours(p);
}

const repondre = (p, cle, correcte, date) => P.appliquerReponse(p, cle, {correcte, date}).parcours;

// Les trois trophées de Mon mélange, tels que le moteur les rend.
// Lot « Mon mélange aux paliers » (09/10/2026) : deux coupes, 3 et 6 tables.
const trophees = (gagnes = [], aGagner = []) => [3, 6].map(tables => ({tables, gagne: gagnes.includes(tables), aGagner: aGagner.includes(tables)}));
// Un mélange joué avec les tables passées du parcours.
const melanger = (p, correct, date) => P.appliquerSerie(p, P.configMelange(p), {correct, total: 20, date});
const passer = (p, tables, date) => {
  const copie = P.normaliserParcours(p);
  tables.forEach(table => { copie.tables[table].acquise = date; });
  return P.normaliserParcours(copie);
};

// Une fonction de la page, par son nom (jusqu'à son accolade fermante).
function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  return html.slice(debut, html.indexOf("\n      }\n", debut) + "\n      }".length);
}

// Un faux document, juste assez pour exécuter les fonctions qui dessinent.
function fauxElement(tag) {
  const el = {
    tag, className: "", type: "", dataset: {}, attrs: {}, children: [], ecouteurs: {}, _texte: null,
    get textContent() { return el._texte !== null ? el._texte : el.children.map(n => typeof n === "string" ? n : n.textContent).join(""); },
    set textContent(v) { el.children = []; el._texte = String(v); },
    setAttribute(nom, valeur) { el.attrs[nom] = String(valeur); },
    append(...noeuds) { el.children.push(...noeuds); },
    addEventListener(type, fn) { el.ecouteurs[type] = fn; }
  };
  return el;
}
const fauxDocument = {createElement: fauxElement, createElementNS: (_, tag) => fauxElement(tag), createTextNode: t => t};
// Tout ce qu'un élément ÉCRIT (les textContent posés), lui et ses descendants.
const ecrits = el => [el._texte, ...el.children.flatMap(n => typeof n === "string" ? [n] : ecrits(n))].filter(t => t !== null && t !== "");

test("la porte : pas de Mes calculs du jour sans table passée, même avec des calculs dus", () => {
  let p = P.creerParcours();
  ["2-3", "2-4", "2-7"].forEach(cle => { p = repondre(p, cle, true, LUNDI); });
  assert.equal(P.calculsDus(p, {aujourdhui: MARDI}).length, 3, "les trois calculs sont bien dus mardi");
  assert.deepEqual(P.serieDuJour(p, {aujourdhui: MARDI}).cles, [], "mais aucun n'est d'une table passée");
  assert.equal(P.mesCalculsAFaire(p, MARDI), false);
  assert.equal(P.etatAffichage(p, MARDI).porte, false);
  const seance = P.ouvrirSeance(p, {table: 2, aujourdhui: MARDI});
  assert.deepEqual(seance.file.map(etape => etape.type), ["marche", "marche", "marche", "marche"], "quatre marches, pas de révision");
  assert.equal(P.agendaCalculs(p, MARDI).dus, 0);
  assert.deepEqual(P.calculsEnRetard(p, MERCREDI), [], "la page du professeur ne compte pas ces calculs en retard");
});

test("une table passée AUJOURD'HUI n'entre dans Mes calculs du jour que demain (la porte ne se referme pas en pleine journée)", () => {
  let p = P.creerParcours();
  P.faitsDeLaTable(2).forEach(cle => { p = repondre(p, cle, true, LUNDI); });
  assert.equal(P.mesCalculsAFaire(p, MARDI), false, "mardi matin : rien de fermé");
  p.tables[2].acquise = MARDI;
  p = P.normaliserParcours(p);
  assert.equal(P.calculDesTablesPassees(p, "2-7", MARDI), false);
  assert.equal(P.mesCalculsAFaire(p, MARDI), false, "le test réussi mardi ne ferme rien mardi");
  assert.equal(P.calculDesTablesPassees(p, "2-7", MERCREDI), true);
  assert.equal(P.mesCalculsAFaire(p, MERCREDI), true, "mercredi, ses 8 calculs font la porte");
  assert.equal(P.serieDuJour(p, {aujourdhui: MERCREDI}).cles.length, 8);
  assert.equal(P.agendaCalculs(p, MARDI).demain, 8, "le bilan de mardi annonce « Demain : 8 calculs »");
});

test("la série du jour : les dus d'abord, puis le complément ; dix au plus, jamais deux fois le même", () => {
  // Tables de 2 et de 5 passées, vues trois jours de suite fin septembre : tout est en boîte 4, rien n'est dû le 29.
  let p = eleve([2, 5], ["2026-09-21", "2026-09-22", "2026-09-25"]);
  assert.equal(P.dusDuJour(p, "2026-09-29").length, 0);
  // Deux erreurs le 28 : elles sont dues le 29.
  p = repondre(p, "2-7", false, "2026-09-28");
  p = repondre(p, "5-8", false, "2026-09-28");
  const serie = P.serieDuJour(p, {aujourdhui: "2026-09-29"});
  assert.deepEqual(serie.cles.slice(0, 2).sort(), ["2-7", "5-8"], "les deux calculs dus sont en tête");
  assert.equal(serie.dus, 2);
  assert.equal(serie.complement, 8);
  assert.equal(serie.cles.length, 10);
  assert.equal(new Set(serie.cles).size, 10, "jamais deux fois le même calcul");
  assert.ok(serie.cles.every(cle => P.calculDesTablesPassees(p, cle, "2026-09-29")));
  assert.equal(serie.faite, false);
  assert.equal(P.mesCalculsAFaire(p, "2026-09-29"), true);
  // Déterministe : l'accueil annonce la série qui sera jouée.
  assert.deepEqual(P.serieDuJour(p, {aujourdhui: "2026-09-29"}).cles, serie.cles);
  assert.deepEqual(P.planRevision(p, {aujourdhui: "2026-09-29", random: hasard(1)}).map(q => q.cle).sort(), serie.cles.slice().sort());
});

test("le complément : seulement des calculs vus avant aujourd'hui, pas ratés aujourd'hui, pas attendus demain", () => {
  let p = eleve([2], ["2026-09-21", "2026-09-22", "2026-09-25"]);
  const jour = "2026-09-29";
  // 2-3 revu aujourd'hui (pas dû : rien ne monte) ; 2-4 raté aujourd'hui.
  p = repondre(p, "2-3", true, jour);
  p = repondre(p, "2-4", false, jour);
  // 2-9 attendu demain.
  p.calculs["2-9"].echeance = "2026-09-30";
  const serie = P.serieDuJour(P.normaliserParcours(p), {aujourdhui: jour});
  assert.equal(serie.dus, 0);
  assert.ok(!serie.cles.includes("2-3"), "vu aujourd'hui : pas dans le complément");
  assert.ok(!serie.cles.includes("2-4"), "raté aujourd'hui : il revient demain");
  assert.ok(!serie.cles.includes("2-9"), "attendu demain : il sera posé demain, le jour où il peut monter");
  assert.equal(serie.cles.length, 5);
});

test("point 4 : une fois Mes calculs du jour joué, les séances suivantes prennent les dus qui restent, sans complément ; puis plus rien", () => {
  // Trois tables passées mi-septembre, plus revues depuis : 21 calculs dus.
  // La coupe des 3 gagnée : pas de Mon mélange au palier dans ces séances
  // (lot « Mon mélange aux paliers », testé à part).
  let p = eleve([2, 3, 5], ["2026-09-14", "2026-09-15"]);
  p = P.normaliserParcours({...p, melange: {...p.melange, reussi: 3}});
  const total = P.dusDuJour(p, MARDI).length;
  assert.equal(total, 21);
  let serie = P.serieDuJour(p, {aujourdhui: MARDI});
  assert.deepEqual([serie.cles.length, serie.dus, serie.complement, serie.restants], [10, 10, 0, 11]);
  // 1re séance : Mes calculs du jour, puis trois marches.
  let seance = P.ouvrirSeance(p, {table: 4, aujourdhui: MARDI});
  assert.deepEqual(seance.file.map(etape => etape.type), ["revision", "marche", "marche", "marche"]);
  let etape = P.etapeDeSeance(p, seance, MARDI);
  assert.deepEqual([etape.type, etape.calculs, etape.duree, etape.porte], ["revision", 10, undefined, true], "plus de durée : pas de chrono (lot du 04/11/2026)");
  serie.cles.forEach(cle => { p = repondre(p, cle, true, MARDI); });
  let note = P.noterEtape(p, seance, etape, {juste: 10, total: 10}, MARDI);
  p = note.parcours;
  assert.equal(p.calculsDuJour, MARDI, "la porte est ouverte");
  assert.equal(P.mesCalculsAFaire(p, MARDI), false);
  // 2e séance du même jour : les dus restants (10 des 11), sans porte.
  serie = P.serieDuJour(p, {aujourdhui: MARDI});
  assert.deepEqual([serie.cles.length, serie.complement, serie.restants, serie.faite], [10, 0, 1, true]);
  p.enCours = null;
  seance = P.ouvrirSeance(p, {table: 4, aujourdhui: MARDI});
  etape = P.etapeDeSeance(p, seance, MARDI);
  assert.deepEqual([etape.type, etape.calculs, etape.porte], ["revision", 10, false]);
  serie.cles.forEach(cle => { p = repondre(p, cle, true, MARDI); });
  // 3e séance : le dernier calcul dû.
  p.enCours = null;
  serie = P.serieDuJour(p, {aujourdhui: MARDI});
  assert.deepEqual([serie.cles.length, serie.complement], [1, 0], "pas de complément après le premier jeu du jour");
  p = repondre(p, serie.cles[0], true, MARDI);
  // 4e séance : plus rien de dû, quatre marches.
  seance = P.ouvrirSeance(p, {table: 4, aujourdhui: MARDI});
  assert.deepEqual(seance.file.map(etape => etape.type), ["marche", "marche", "marche", "marche"]);
  // Le lendemain, la porte se referme.
  assert.equal(P.mesCalculsAFaire(p, MERCREDI), true);
});

test("il ne se rate pas : quel que soit le score, l'étape jouée ouvre la porte ; les calculs pas faits restent dus", () => {
  let p = eleve([2], ["2026-09-14", "2026-09-15"]);
  const seance = P.ouvrirSeance(p, {table: 3, aujourdhui: MARDI});
  const etape = P.etapeDeSeance(p, seance, MARDI);
  assert.equal(etape.calculs, 8);
  assert.equal(etape.duree, undefined, "plus de chrono sur la série");
  // La série arrêtée après trois réponses, toutes fausses.
  const serie = P.serieDuJour(p, {aujourdhui: MARDI}).cles;
  serie.slice(0, 3).forEach(cle => { p = repondre(p, cle, false, MARDI); });
  const note = P.noterEtape(p, seance, etape, {juste: 0, total: 3}, MARDI);
  assert.equal(note.faite.rate, false, "Mes calculs du jour n'est jamais « raté »");
  assert.equal(note.parcours.calculsDuJour, MARDI);
  assert.equal(note.seance.finie, false, "la séance continue");
  assert.equal(P.serieDuJour(note.parcours, {aujourdhui: MARDI}).cles.length, 5, "les cinq calculs pas faits restent dus (les trois ratés reviennent demain)");
});

test("calculsDuJour : une date, gardée par la normalisation, la plus récente à la fusion, déclarée au serveur", () => {
  assert.equal(P.creerParcours().calculsDuJour, null);
  assert.equal(P.normaliserParcours({calculsDuJour: "pas une date"}).calculsDuJour, null);
  assert.equal(P.normaliserParcours({calculsDuJour: MARDI}).calculsDuJour, MARDI);
  const a = {...P.creerParcours(), calculsDuJour: LUNDI};
  const b = {...P.creerParcours(), calculsDuJour: MARDI};
  assert.equal(P.fusionner(a, b).calculsDuJour, MARDI);
  assert.equal(P.fusionner(b, a).calculsDuJour, MARDI);
  assert.equal(P.fusionner(a, P.creerParcours()).calculsDuJour, LUNDI);
  assert.match(applis, /'retenir', 'calculsDuJour', 'reussi',/);
  assert.equal(P.VERSION, 3, "pas de changement de version : des clés en plus");
});

test("les nombres manquants : la table connue est écrite, c'est l'autre nombre qui manque", () => {
  // Seule la table de 2 est passée ; ses calculs sont dus.
  const p = eleve([2], ["2026-09-14", "2026-09-15"]);
  const formes = new Set();
  for (let graine = 1; graine <= 200; graine += 1) {
    P.planRevision(p, {aujourdhui: MARDI, random: hasard(graine)}).forEach(item => {
      if (!["right", "left", "reverse-right", "reverse-left"].includes(item.type)) return;
      const question = CORE.tableQuestion(item.type, item.first, item.second);
      // Le nombre cherché n'est jamais le 2 (sauf 2 × 2) : c'est lui qui est écrit.
      if (item.cle !== "2-2") assert.notEqual(question.answer, 2, `${question.prompt} : la table de 2 doit être écrite`);
      formes.add(item.type);
    });
  }
  assert.deepEqual([...formes].sort(), ["left", "reverse-left", "reverse-right", "right"], "les quatre écritures restent (« 2 × ? = 16 », « 16 = 2 × ? »…)");
});

test("le mélange est libre : aucun verrou, jamais « à refaire », des trophées", () => {
  assert.equal(P.melangeDu, undefined, "melangeDu a quitté le moteur");
  let p = eleve([2, 5], [LUNDI]);
  const melange = P.configMelange(p);
  assert.deepEqual(P.classerSerie(p, melange), {type: "melange", tables: [2, 5]});
  // Sans mélange, la table de 3 se passe.
  let suite = P.appliquerSerie(p, P.configValidation(3), {correct: 19, total: 20, date: MARDI});
  assert.deepEqual(suite.evenements.map(evenement => evenement.type), ["validation", "rang"]);
  assert.ok(!("verrouillee" in suite.evenements[0]));
  assert.equal(suite.parcours.tables[3].acquise, MARDI);
  p = suite.parcours;
  // Un mélange raté : le score est gardé, rien ne se ferme.
  suite = P.appliquerSerie(p, P.configMelange(p), {correct: 15, total: 20, date: MARDI});
  assert.deepEqual(suite.evenements, [{type: "melange", reussi: false, score: 15, total: 20, tables: [2, 3, 5], trophee: null, coupes: []}]);
  assert.deepEqual([suite.parcours.melange.dernier, suite.parcours.melange.score, suite.parcours.melange.reussi], [MARDI, 15, null]);
  // Réussi avec 3 tables ; une table de plus : « reussi » reste à 3, le
  // trophée des 3 tables est gagné (celui des 6 attend 6 tables passées).
  suite = P.appliquerSerie(suite.parcours, P.configMelange(p), {correct: 18, total: 20, date: MERCREDI});
  assert.equal(suite.parcours.melange.reussi, 3);
  p = P.appliquerSerie(suite.parcours, P.configValidation(10), {correct: 20, total: 20, date: MERCREDI}).parcours;
  const etat = P.etatAffichage(p, MERCREDI);
  assert.deepEqual(etat.melange, {visible: true, tables: [2, 3, 5, 10], dernier: MERCREDI, score: 18, reussi: 3, trophees: trophees([3])});
  assert.ok(!("verrou" in etat));
  assert.equal(p.melange.aRefaireAvec, null);
  // La coupe des 3 gagnée, 4 tables : pas d'étape « mélange » dans la séance
  // (lot « Mon mélange aux paliers » : elle n'y entre qu'aux paliers).
  assert.ok(!P.ouvrirSeance(p, {aujourdhui: "2026-10-08"}).file.some(etape => etape.type === "melange"));
  assert.notEqual(P.prochaineEtape(p, "2026-10-08").type, "melange");
  // Fusion : le plus grand trophée, le dernier joué.
  const autre = P.normaliserParcours({...p, melange: {...p.melange, reussi: 4, dernier: "2026-10-08", score: 20}});
  assert.deepEqual([P.fusionner(p, autre).melange.reussi, P.fusionner(autre, p).melange.dernier, P.fusionner(p, autre).melange.score], [4, "2026-10-08", 20]);
});

// ------------------------------------------------ les trophées de Mon mélange
// (05/10/2026, idée de Gwenaël) : le réussir avec au moins 3, 6, puis 9 tables
// — deux coupes seulement depuis le lot « Mon mélange aux paliers » (09/10/2026) :
// 3, puis 6 tables.

test("trophées, moteur : rien à gagner avec 2 tables ; avec 3 tables passées, le trophée 3 est « aGagner »", () => {
  assert.deepEqual([...P.SEUILS.melange.trophees], [3, 6]);
  let p = eleve([2, 5], [LUNDI]);
  assert.deepEqual(P.tropheesMelange(p), trophees(), "2 tables : ni gagné, ni à gagner");
  // Même réussi, le mélange de 2 tables ne rapporte pas de trophée.
  const deux = melanger(p, 20, MARDI);
  assert.equal(deux.evenements[0].reussi, true);
  assert.equal(deux.evenements[0].trophee, null);
  assert.deepEqual(P.tropheesMelange(deux.parcours), trophees());
  p = eleve([2, 3, 5], [LUNDI]);
  assert.deepEqual(P.tropheesMelange(p), trophees([], [3]), "3 tables passées : le premier trophée est à gagner");
  assert.deepEqual(P.etatAffichage(p, MARDI).melange.trophees, trophees([], [3]), "l'affichage porte les mêmes");
  assert.deepEqual(P.tropheesMelange(eleve([2, 3, 4, 5, 6, 10], [LUNDI])), trophees([], [3, 6]), "6 tables : deux trophées à gagner");
  assert.deepEqual(P.tropheesMelange(P.creerParcours()), trophees(), "un parcours neuf");
});

test("trophées, moteur : gagné une seule fois — 3 (avec 5 tables), puis 6 ; l'événement dit le trophée gagné PAR cette série", () => {
  let p = eleve([2, 3, 4, 5, 10], [LUNDI]);
  let suite = melanger(p, 18, MARDI);
  assert.deepEqual(suite.evenements, [{type: "melange", reussi: true, score: 18, total: 20, tables: [2, 3, 4, 5, 10], trophee: 3, coupes: [3]}]);
  assert.deepEqual(P.tropheesMelange(suite.parcours), trophees([3]), "5 tables : le trophée des 6 n'est pas encore à gagner");
  // Rejoué et réussi avec les mêmes tables : pas gagné deux fois.
  suite = melanger(suite.parcours, 20, MERCREDI);
  assert.equal(suite.evenements[0].reussi, true);
  assert.equal(suite.evenements[0].trophee, null, "le trophée des 3 tables est déjà gagné");
  assert.deepEqual(P.tropheesMelange(suite.parcours), trophees([3]));
  // Une sixième table : le deuxième trophée est à gagner, puis gagné.
  p = passer(suite.parcours, [6], MERCREDI);
  assert.deepEqual(P.tropheesMelange(p), trophees([3], [6]));
  suite = melanger(p, 18, "2026-10-08");
  assert.equal(suite.evenements[0].trophee, 6);
  assert.deepEqual(P.tropheesMelange(suite.parcours), trophees([3, 6]));
  // 8 tables, puis les 9 : réussi, mais rien de neuf — il n'y a plus de 3e
  // coupe (lot « Mon mélange aux paliers »).
  p = passer(suite.parcours, [7, 8], "2026-10-08");
  suite = melanger(p, 19, "2026-10-09");
  assert.equal(suite.evenements[0].trophee, null);
  assert.deepEqual(P.tropheesMelange(suite.parcours), trophees([3, 6]));
  p = passer(suite.parcours, [9], "2026-10-09");
  assert.deepEqual(P.tropheesMelange(p), trophees([3, 6]), "tout est gagné, plus rien à gagner");
  assert.equal(melanger(p, 20, "2026-10-13").evenements[0].trophee, null);
});

test("trophées, moteur : réussi d'un coup avec 9 tables, les deux sont gagnés et l'événement dit le plus grand (et les deux)", () => {
  const p = eleve([...P.TABLES], [LUNDI]);
  assert.deepEqual(P.tropheesMelange(p), trophees([], [3, 6]));
  const suite = melanger(p, 18, MARDI);
  assert.equal(suite.evenements[0].trophee, 6);
  assert.deepEqual(suite.evenements[0].coupes, [3, 6]);
  assert.deepEqual(P.tropheesMelange(suite.parcours), trophees([3, 6]));
});

test("trophées, moteur : un mélange raté ne gagne rien, et un trophée gagné ne se perd jamais (raté ensuite, fusion de deux appareils)", () => {
  let p = eleve([2, 3, 4, 5, 6, 10], [LUNDI]);
  // Raté (3 erreurs) : rien.
  let suite = melanger(p, 17, MARDI);
  assert.deepEqual([suite.evenements[0].reussi, suite.evenements[0].trophee], [false, null]);
  assert.deepEqual(P.tropheesMelange(suite.parcours), trophees([], [3, 6]), "toujours à gagner");
  // Gagnés (3 et 6 d'un coup), puis raté : ils restent.
  suite = melanger(suite.parcours, 18, MERCREDI);
  assert.equal(suite.evenements[0].trophee, 6);
  const gagne = suite.parcours;
  suite = melanger(gagne, 5, "2026-10-08");
  assert.deepEqual([suite.evenements[0].reussi, suite.evenements[0].trophee], [false, null]);
  assert.deepEqual(P.tropheesMelange(suite.parcours), trophees([3, 6]), "un mélange raté ne retire rien");
  // La normalisation (lecture du stockage, du serveur) les garde.
  assert.deepEqual(P.tropheesMelange(P.normaliserParcours(JSON.parse(JSON.stringify(suite.parcours)))), trophees([3, 6]));
  // Deux appareils : l'un a gagné, l'autre n'a jamais joué de mélange — dans
  // les deux sens, « reussi » le plus grand.
  const autre = eleve([2, 3, 4, 5, 6, 10], [LUNDI]);
  assert.equal(autre.melange.reussi, null);
  assert.deepEqual(P.tropheesMelange(P.fusionner(gagne, autre)), trophees([3, 6]));
  assert.deepEqual(P.tropheesMelange(P.fusionner(autre, gagne)), trophees([3, 6]));
  // L'autre appareil n'avait réussi qu'avec 3 tables : la fusion garde 6.
  const petit = P.normaliserParcours({...autre, melange: {...autre.melange, reussi: 3, dernier: "2026-10-09", score: 18}});
  assert.equal(P.fusionner(gagne, petit).melange.reussi, 6);
  assert.equal(P.fusionner(petit, gagne).melange.reussi, 6);
  assert.deepEqual(P.tropheesMelange(P.fusionner(petit, gagne)), trophees([3, 6]));
});

test("trophées, page : deux coupes (lot « Mon mélange aux paliers »), sans un mot ni un nombre — grises, dorées quand elles sont gagnées, lisibles par un lecteur d'écran", () => {
  const tropheesDuMelange = new Function("document", `${source("coupe")}\n${source("tropheesDuMelange")}\nreturn tropheesDuMelange;`)(fauxDocument);
  const p = melanger(eleve([2, 3, 4, 5, 10], [LUNDI]), 20, MARDI).parcours;
  const zone = tropheesDuMelange(P.tropheesMelange(passer(p, [6, 7, 8, 9], MARDI)));
  assert.equal(zone.tag, "span");
  assert.equal(zone.className, "mp-trophees");
  assert.equal(zone.children.length, 2, "deux coupes");
  assert.deepEqual(zone.children.map(b => b.tag), ["b", "b"]);
  assert.deepEqual(zone.children.map(b => b.className), ["is-gagne", ""], "3 dorée, 6 grise");
  assert.deepEqual(zone.children.map(b => b.dataset.tables), ["3", "6"]);
  zone.children.forEach(b => {
    assert.equal(b.children.length, 1);
    assert.equal(b.children[0].tag, "svg", "une coupe dessinée");
    assert.equal(b.children[0].attrs["aria-hidden"], "true");
    assert.deepEqual(b.children[0].children.map(trait => trait.attrs.class), ["anses", "corps"]);
  });
  assert.deepEqual(ecrits(zone), [], "rien d'écrit : ni « Trophées », ni 3, 6, 9");
  assert.equal(zone.textContent, "");
  // Le dessin se dit à qui ne le voit pas.
  assert.equal(zone.attrs.role, "img");
  assert.equal(zone.attrs["aria-label"], "Coupes de Mon mélange (avec 3 et 6 tables) : gagnée avec 3 tables", "lot « Mon mélange sur l'accueil et l'expert » : « coupe », plus « trophée »");
  const vide = tropheesDuMelange(trophees());
  assert.deepEqual(vide.children.map(b => b.className), ["", ""], "deux coupes grises");
  assert.equal(vide.attrs["aria-label"], "Coupes de Mon mélange (avec 3 et 6 tables) : aucune pour l’instant");
  // La source : aucun texte posé dans ces deux fonctions, aucun « Trophées » affiché ailleurs.
  assert.doesNotMatch(source("coupe") + source("tropheesDuMelange"), /textContent|createTextNode|innerHTML/);
  assert.doesNotMatch(html, /textContent = [`"'][^;\n]*Troph/, "le mot « Trophées » n'est écrit nulle part à l'écran");
  assert.doesNotMatch(html, />\s*Trophées?\b/);
  // Les couleurs : gris, puis or.
  assert.match(html, /\.mp-trophees b \{ display: inline-flex; width: 26px; height: 26px; color: #c3ced8; \}/);
  assert.match(html, /\.mp-trophees b\.is-gagne \{ color: #e0a800;/);
});

// Lot « Mon mélange sur l'accueil et l'expert » (07/10/2026, planche 1) : le
// bouton « Je me teste sur mes N tables » du bilan était devenu Mon mélange,
// sur l'accueil. Lot « Mon mélange aux paliers » (09/10/2026, choix de
// Gwenaël, planche 4) : ce bouton est retiré à son tour — Mon mélange est dans
// la carte (2e étape) et avant le test.
test("coupes, page : plus de bouton Mon mélange, ni au bilan ni sur l'accueil", () => {
  assert.equal(html.indexOf("function boutonMelange("), -1, "l'ancien bouton du bilan est retiré");
  assert.equal(html.indexOf("boutonMelangeAccueil"), -1, "celui de l'accueil aussi");
  assert.doesNotMatch(html, /id = "acc-melange"|coupe-a-gagner/);
});

test("coupes, page : « Tu gagnes la coupe des N tables ! » après un mélange qui en gagne une, rien sinon", () => {
  const suiteApresSerie = new Function("tableSuivanteApres", "PARCOURS", `${source("suiteApresSerie")}\nreturn suiteApresSerie;`)(() => null, P);
  const phrase = suite => suiteApresSerie(suite.evenements, {melange: suite.evenements.find(evenement => evenement.type === "melange")});
  const p = eleve([2, 3, 4, 5, 10], [LUNDI]);
  const gagne = melanger(p, 18, MARDI);
  assert.equal(phrase(gagne), "Tu gagnes la coupe des 3 tables\u00a0!");
  assert.equal(phrase(melanger(gagne.parcours, 20, MERCREDI)), "", "rejoué et réussi : rien de neuf, le verdict suffit");
  assert.equal(phrase(melanger(eleve([...P.TABLES], [LUNDI]), 19, MARDI)), "Tu gagnes la coupe des 6 tables\u00a0!", "d'un coup avec 9 tables : la plus grande (deux coupes depuis le lot « Mon mélange aux paliers »)");
  // La page ne fête (fete.melange) qu'un mélange réussi.
  assert.match(html, /if \(fete\.melange\) return fete\.melange\.trophee \? `Tu gagnes la coupe des \$\{fete\.melange\.trophee\} tables\\u00a0!` : "";/);
});

test("trophées, page : sur ordinateur, la colonne de droite s'étire jusqu'au bas du tableau et « Je deviens expert » prend la hauteur qui reste", () => {
  const debut = html.indexOf("      .parcours-suite { grid-column: 2; grid-row: 4;");
  assert.notEqual(debut, -1);
  const media = html.lastIndexOf("@media", debut);
  assert.match(html.slice(media, html.indexOf("{", media)), /^@media \(min-width: 1024px\) $/, "dans la règle « ordinateur » (1 024 px et plus)");
  assert.match(html, /\.parcours-suite \{ grid-column: 2; grid-row: 4; align-self: stretch; display: flex; flex-direction: column; \}\s*\.parcours-suite #parcours-expert \{ flex: 1 1 auto; \}\s*\.parcours-suite \.mp-melange-droite \{ flex-wrap: nowrap; \}/);
  // Écran bas : le bloc du mélange et les coupes se resserrent.
  assert.match(html, /@media \(min-width: 1024px\) and \(max-height: 700px\) \{[^@]*?\.parcours-suite #parcours-melange \{ padding-top: 8px; padding-bottom: 8px; \}\s*\.parcours-suite \.mp-trophees b \{ width: 22px; height: 22px; \}\s*\}/);
  // Le triangle « jouer » : un dessin, plus le caractère ▶.
  assert.match(html, /texte: triangleJouer\(\),/);
  assert.doesNotMatch(html, /createTextNode\("▶"\)/);
});

test("« Je passe le test », l'escalier et Platine dès 9 tables passées", () => {
  assert.equal(P.MARCHES[7].nom, "Je passe le test");
  assert.match(CORE.configurationLabel(P.configValidation(7)), /^Je passe le test · Table de 7/);
  const p = eleve([...P.TABLES], [LUNDI]);
  assert.equal(p.melange.reussi, null, "aucun mélange joué");
  assert.equal(P.escalierOuvert(p), true);
  assert.equal(P.rangDeLEtat(p), 4, "Platine");
  assert.equal(P.classerSerie(p, P.configEtoile(1)).type, "etoile");
  // Lot « Mon mélange aux paliers » (09/10/2026) : plus de Mon mélange des
  // 9 tables avant l'étoile.
  assert.deepEqual(P.ouvrirSeance(p, {aujourdhui: LUNDI}).file.map(etape => etape.type), ["etoile"], "le premier jour, rien n'est fermé");
  assert.deepEqual(P.ouvrirSeance(p, {aujourdhui: MARDI}).file.map(etape => etape.type), ["revision", "etoile"]);
  assert.equal(P.resumeProf(p, MARDI).enCours.type, "expert");
});

// Lot « Mes calculs du jour sans chrono » (04/11/2026) : plus de chrono sur
// la série, l'écran de lancement dit la règle des 6 secondes, le chrono de
// l'en-tête est caché, et la carte de séance dit « 10 calculs » sans durée.
test("la page : Mes calculs du jour lancé par « C'est parti ! », sans chrono, la règle des 6 secondes à l'écran", () => {
  assert.match(html, /DURATION = null;\s+state\.pauseA = null;\s+state\.revisionLents = 0;/);
  assert.match(html, /if \(table !== null\) \{\s+beginRound\(\);\s+return;\s+\}/);
  assert.match(html, /regle\.append\(document\.createTextNode\("Réponds vite\\u00a0: juste "\), vite, document\.createTextNode\(", un calcul revient plus tard\."\)\);/);
  assert.match(html, /\$\("time"\)\.style\.visibility = state\.configuration\.mesCalculs \? "hidden" : "";/);
  assert.match(html, /const willRetry = !correct && !question\.retry && !mesCalculs;/);
  assert.doesNotMatch(html, /Temps écoulé" : "Mes calculs du jour : fait|dureeCourte/);
  assert.match(html, /const detail = etape\.type === "revision" \? soude\(pluriel\(etape\.calculs, "calcul"\)\)/);
});

// Lot « Mes calculs du jour d'abord » (08/10/2026, décision de Gwenaël,
// planches 19 et 20) : la porte ne grise plus rien ; rien ne se lance à côté
// pour autant — Mes calculs du jour d'abord, puis ce qui a été touché.
test("la page : la porte de l'accueil enchaîne, et rien ne se lance à côté", () => {
  assert.doesNotMatch(html, /est-fermee|porte-mot|bouton\.disabled = true/);
  assert.match(html, /if \(origin !== "seance" && PARCOURS\.mesCalculsAFaire\(parcours\)\) \{\s*if \(config\.mode !== "revision"\) state\.apresMesCalculs = \{config, origin, nom: nomDeLaSuite\(config\), puis\};\s*startRevision\(null, origin\);\s*return;\s*\}/);
  assert.doesNotMatch(html, /if \(etat\.porte\) state\.choisirActivite = false;/);
  assert.match(html, /config: PARCOURS\.configMelange\(parcours\)\s*\}\), droite\);/);
  assert.match(html, /const expertOuvert = etat\.expert\.ouvert;/);
});

test("la page : les mots, les coupes du mélange et les petits restes", () => {
  assert.match(html, /const NOM_DU_TEST = "Je passe le test";/);
  assert.match(html, /const CONDITION_DU_TEST = "si j’ai 9\\u00a0sur\\u00a010 juste\\u00a0avant";/);
  assert.ok(html.indexOf("const NOM_DU_TEST") < html.indexOf("function renderAccueil("), "défini avant le premier dessin de l'accueil");
  assert.doesNotMatch(html, /Je valide ma table"|acquise !`|Réussis d’abord ton mélange|montrerMelange|etat\.verrou|melangeDu/);
  // Lot « Mon mélange sur l'accueil et l'expert » : le bouton du bilan est
  // retiré ; lot « Mon mélange aux paliers » : celui de l'accueil aussi.
  assert.doesNotMatch(html, /Je me teste sur mes|function boutonMelange\(|boutonMelangeAccueil/);
  // Lot « trophées » : plus de « Dernier : 17 sur 20 » ni de « réussi avec N
  // tables ✓ » — trois coupes ; le bouton seulement s'il y a un trophée à gagner.
  assert.doesNotMatch(html, /dernierMelange|réussi avec \$\{|Dernier : \$\{melange\.score\}/);
  assert.doesNotMatch(html, /trophée à/);
  assert.match(html, /droite\.append\(textes, tropheesDuMelange\(etat\.melange\.trophees\)\);/);
  assert.match(html, /\$\("fiche-melange-state"\)\.replaceChildren\(tropheesDuMelange\(etat\.melange\.trophees\)\);/, "la fiche imprimée aussi");
  // Lot « retours de classe » : la notice soude ses nombres (&nbsp;), la fiche imprimée garde ses espaces.
  assert.equal(html.match(/20 questions en 1 min 30\. Une coupe avec 3, puis 6 tables\.<\/p>/g).length, 1, "la fiche dit la règle");
  assert.equal(html.match(/20&nbsp;questions en 1&nbsp;min&nbsp;30\. À 3, puis 6&nbsp;tables, il passe avant le test jusqu’à ce que je gagne la coupe\.<\/p>/g).length, 1, "la notice aussi (lot « Mon mélange aux paliers »)");
  assert.match(html, /if \(validation && !validation\.reussi && !validation\.dejaAcquise\) return phraseTestRate\(\);/);
  // « Tu as choisi » : seulement depuis les réglages.
  assert.match(html, /\$\("launch-eyebrow"\)\.hidden = state\.origin !== "reglages";/);
  // Le pied de l'élève : il n'y en a plus (24/10/2026), le retour est en haut.
  assert.doesNotMatch(html, /pied\.replaceChildren|majPiedDePage/);
  assert.doesNotMatch(html, /Infos et confidentialité"\)/);
  // « 10 / 11 » sur une ligne à 320 px.
  assert.match(html, /@media \(max-width: 359px\) \{ #question-count \.compteur-mot \{ display: none; \} \}/);
  // Les numéros de cache ont monté.
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/);
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261104-1/);
});

test("le serveur : la copie du moteur, « Tables passées », la tuile sans « Mon mélange à faire »", () => {
  assert.equal(copie, moteur, "la copie de la page du professeur est identique au moteur");
  assert.match(prof, /data-tri="acquises">Tables passées<\/button>/);
  assert.match(prof, /`Ensemble : \$\{objectif\.fait\} table\$\{pluriel\} passée\$\{pluriel\} sur \$\{objectif\.total\}`/);
  assert.doesNotMatch(prof, /Tables acquises/);
  assert.match(espace, /compte: `\$\{fait\} table\$\{fait > 1 \? "s" : ""\} passée\$\{fait > 1 \? "s" : ""\} sur \$\{total\}`/);
  assert.doesNotMatch(espace, /Mon mélange à faire"/);
});
