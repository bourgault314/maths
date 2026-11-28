// Lot « le jour vert » (11/11/2026, chantier « Suivre ses élèves »).
// Choix de Gwenaël (09/11) : dans Défi tables, un jour de travail, c'est TOUT
// travail sur une table — Mes calculs du jour, une étape, le test (même pas
// encore réussi), un entraînement, J'apprends, Mon mélange — en séance OU
// depuis l'accueil ; une étoile ou une course des records SEULE ne compte
// pas ; le nombre de séances ne change pas. Choix du 11/11 : la fiche dit ce
// qui a été fait chaque jour, dans chaque appli (Coffres : les clés du jour ;
// SPLAT! : l'étape ; Défi calcul : le module ; Anzan : le verdict d'un grade ;
// Défi tables en séance : le nombre d'étapes).
// Les tests EXÉCUTENT les moteurs, comme la page le fait.
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";

const require = createRequire(import.meta.url);
const T = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const TC = require("../outils/calcul_mental/defi_tables_core.js");
const C = require("../assets/js/coffres-parcours.js");
const S = require("../assets/js/splat-parcours.js");
const D = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
// Lot F4 : le test de palier déjà joué (ces tests jouent des séances module par module).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});
const DCORE = require("../outils/calcul_mental/defi_calcul_core.js");
const A = require("../outils/calcul_mental/flash_anzan_parcours.js");
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");

const LUNDI = "2026-11-09", MARDI = "2026-11-10", JEUDI = "2026-11-12", VENDREDI = "2026-11-13";
const jours = r => r.jours.map(j => j.jour);
const hors = (r, jour) => (r.jours.find(j => j.jour === jour) || {lignes: []}).lignes.filter(l => l.hors === 1);

// Une série jouée en entier, puis ce que fait la page hors séance (finish).
function serie(p, config, date, justes) {
  const cfg = TC.normalizeConfiguration(config);
  const qs = TC.generateQuestions(cfg, () => 0.42);
  const ok = Math.min(justes, qs.length);
  qs.forEach((q, i) => { p = T.appliquerReponse(p, q.factKey, {correcte: i >= qs.length - ok, date}).parcours; });
  const suivi = T.appliquerSerie(p, cfg, {correct: ok, total: qs.length, date, rates: []});
  const verdict = suivi.evenements.find(e => typeof e.reussi === "boolean");
  return {suivi, parcours: T.noterHorsSeance(suivi.parcours, suivi.classement, {reussi: Boolean(verdict && verdict.reussi), date})};
}
const deuxTables = () => {
  let p = T.creerParcours();
  p = serie(p, T.configValidation(2), "2026-11-02", 20).parcours;
  return serie(p, T.configValidation(10), "2026-11-02", 20).parcours;
};

test("Défi tables : le test passé depuis l'accueil, RÉUSSI, fait un jour de travail (avant : jours [] et dernier null)", () => {
  const {suivi, parcours} = serie(T.creerParcours(), T.configValidation(3), MARDI, 20);
  assert.equal(suivi.classement.type, "validation");
  assert.equal(parcours.tables[3].acquise, MARDI);
  const r = T.resumeSuivi(parcours, {aujourdhui: VENDREDI});
  assert.deepEqual(jours(r), [MARDI]);
  assert.equal(r.dernier, MARDI);
  assert.deepEqual(hors(r, MARDI), [{hors: 1, table: 3, mesCalculs: 0, apprends: 0, entraine: 0, melange: 0, score: null, test: 1}]);
  assert.deepEqual(r.feliciter, [{type: "table", table: 3}]);
  assert.deepEqual(parcours.seances, [], "ce n'est pas une séance : le nombre de séances ne change pas");
});

test("Défi tables : le test RATÉ depuis l'accueil compte aussi (« test pas encore ») ; puis réussi le même jour : « réussi » l'emporte", () => {
  let {parcours} = serie(T.creerParcours(), T.configValidation(4), MARDI, 15);
  let r = T.resumeSuivi(parcours, MARDI);
  assert.deepEqual(hors(r, MARDI).map(l => [l.table, l.test]), [[4, 2]]);
  parcours = serie(parcours, T.configValidation(4), MARDI, 20).parcours;
  r = T.resumeSuivi(parcours, MARDI);
  assert.deepEqual(hors(r, MARDI).map(l => [l.table, l.test]), [[4, 1]]);
});

test("Défi tables : Mes calculs du jour joué depuis l'accueil (ce que fait finish) — un jour, une ligne sans table", () => {
  let p = deuxTables();
  const plan = T.planRevision(p, {aujourdhui: JEUDI});
  assert.ok(plan.length > 0);
  plan.forEach(q => { p = T.appliquerReponse(p, q.cle, {correcte: true, date: JEUDI}).parcours; });
  p = T.noterHorsSeance(p, {type: "revision", table: null}, {date: JEUDI});
  const r = T.resumeSuivi(p, VENDREDI);
  assert.deepEqual(hors(r, JEUDI).map(l => [l.table, l.mesCalculs]), [[0, 1]]);
});

test("Défi tables : entraînement, J'apprends, « comme le test » et Mon mélange depuis l'accueil comptent ; Mon mélange dit son score le jour du dernier", () => {
  let p = deuxTables();
  p = serie(p, T.configEntraine(4, "desordre"), JEUDI, 9).parcours;
  const cfg = TC.normalizeConfiguration(T.configApprends(4, "beads"));
  let suivi = T.appliquerSerie(T.demarrerSerie(p, cfg), cfg, {correct: 11, total: 11, date: JEUDI});
  p = T.noterHorsSeance(suivi.parcours, suivi.classement, {date: JEUDI});
  p = serie(p, T.configValidation(6, 120), JEUDI, 20).parcours;
  p = serie(p, T.configMelange(p), JEUDI, 19).parcours;
  const lignes = hors(T.resumeSuivi(p, VENDREDI), JEUDI);
  assert.deepEqual(lignes.map(l => [l.table, l.apprends, l.entraine, l.melange, l.score]), [[4, 1, 1, 0, null], [6, 0, 1, 0, null], [0, 0, 0, 1, 19]]);
});

test("Défi tables : une étoile seule, une course des records seule, une série qui ne compte pas : PAS de jour", () => {
  let p = T.creerParcours();
  T.TABLES.forEach(t => { p.tables[t].acquise = "2026-10-01"; });
  p = T.normaliserParcours(p);
  const etoile = serie(p, {mode: "test", tables: [...T.TABLES], testLevel: 3, total: 25, duration: 120, questionTypes: ["direct", "missing", "division"]}, JEUDI, 25);
  assert.equal(etoile.suivi.classement.type, "etoile");
  assert.deepEqual(etoile.parcours.horsSeance, {jours: [], table: [], fait: []});
  p = etoile.parcours; p.expert.couronne = "2026-10-20"; p = T.normaliserParcours(p);
  const course = T.appliquerSerie(p, {...TC.normalizeConfiguration(T.configCourse()), course: "records", duration: null}, {correct: 25, total: 25, date: JEUDI});
  assert.equal(course.classement.type, "course");
  assert.deepEqual(T.noterHorsSeance(course.parcours, course.classement, {date: JEUDI}).horsSeance.jours, []);
  assert.equal(T.noterHorsSeance(p, null, {date: JEUDI}), p);
  assert.equal(T.noterHorsSeance(p, {type: "entraine", table: 99}, {date: JEUDI}), p, "une table inconnue ne note rien");
  assert.ok(!jours(T.resumeSuivi(course.parcours, VENDREDI)).includes(JEUDI));
});

test("Défi tables : deux appareils — l'union, drapeaux réunis ; le même résultat dans les deux sens et quel que soit l'ordre ; la borne des 60 après la réunion", () => {
  const a = T.noterHorsSeance(T.creerParcours(), {type: "validation", table: 7}, {reussi: false, date: MARDI});
  const b = T.noterHorsSeance(T.noterHorsSeance(T.creerParcours(), {type: "entraine", table: 7}, {date: MARDI}), {type: "melange"}, {date: JEUDI});
  const ab = T.fusionner(a, b), ba = T.fusionner(b, a);
  assert.deepEqual(ab.horsSeance, ba.horsSeance);
  assert.deepEqual(ab.horsSeance, {jours: [MARDI, JEUDI], table: [7, 0], fait: [T.HORS_SEANCE.pasEncore | T.HORS_SEANCE.entraine, T.HORS_SEANCE.melange]});
  assert.deepEqual(T.fusionner(ab, a).horsSeance, ab.horsSeance, "refusionner ne change rien");
  // 70 jours d'un côté (les jours ne montent PAS avec l'ordre d'écriture), 70 de l'autre, décalés.
  const plein = decalage => {
    let p = T.creerParcours();
    for (let i = 69; i >= 0; i -= 1) p = T.noterHorsSeance(p, {type: "entraine", table: 2 + (i % 9)}, {date: T.ajouterJours("2026-06-01", i * 2 + decalage)});
    return p;
  };
  const x = plein(0), y = plein(1), z = T.noterHorsSeance(T.creerParcours(), {type: "melange"}, {date: "2026-06-02"});
  assert.equal(x.horsSeance.jours.length, 60);
  const xyz = T.fusionner(T.fusionner(x, y), z), zyx = T.fusionner(z, T.fusionner(y, x)), yxz = T.fusionner(T.fusionner(y, z), x);
  assert.deepEqual(xyz.horsSeance, zyx.horsSeance);
  assert.deepEqual(xyz.horsSeance, yxz.horsSeance);
  assert.equal(xyz.horsSeance.jours.length, 60);
});

test("Défi tables : des données abîmées sont écartées (date fausse, table inconnue, drapeaux hors bornes), une liste plus courte ne décale rien", () => {
  const p = T.normaliserParcours({version: 5, horsSeance: {jours: ["2026-02-30", "0000-01-01", MARDI, JEUDI, VENDREDI, "texte"], table: [3, 3, 11, 4, 0], fait: [4, 4, 4, 64, 16, 2]}});
  assert.deepEqual(p.horsSeance, {jours: [VENDREDI], table: [0], fait: [16]});
  assert.deepEqual(T.normaliserParcours({horsSeance: "x"}).horsSeance, {jours: [], table: [], fait: []});
  assert.equal(T.VERSION, 5);
});

test("Défi tables : le passé rattrapé à la lecture (sans rien écrire) — table passée, dernier Mes calculs du jour, dernier Mon mélange, un jour SANS séance seulement", () => {
  let p = T.creerParcours();
  p.tables[3].acquise = MARDI;
  p.tables[5].acquise = LUNDI;
  p.calculsDuJour = JEUDI;
  p.melange.dernier = JEUDI; p.melange.score = 18;
  p.seances = [LUNDI];
  p.journal = {table: [5], etapes: [4], calculs: [10], justes: [9], test: [1], numero: [-1]};
  p.version = 4;
  p = T.normaliserParcours(JSON.parse(JSON.stringify(p)));
  const r = T.resumeSuivi(p, VENDREDI);
  assert.deepEqual(jours(r), [LUNDI, MARDI, JEUDI]);
  assert.deepEqual(hors(r, LUNDI), [], "lundi a une séance : elle dit déjà ce qu'elle a fait");
  assert.deepEqual(hors(r, MARDI).map(l => [l.table, l.test]), [[3, 1]]);
  assert.deepEqual(hors(r, JEUDI).map(l => [l.table, l.mesCalculs, l.melange, l.score]), [[0, 1, 1, 18]]);
  assert.deepEqual(p.horsSeance.jours, [], "rien n'est écrit");
  assert.equal(r.dernier, JEUDI);
  assert.deepEqual(T.resumeSuivi({version: 4, tables: {7: {acquise: "2026-11-20"}}}, VENDREDI).jours, [], "un jour à venir n'est pas un jour de travail");
});

test("Défi tables : la page note le travail hors séance — après Mes calculs du jour et après toute série, jamais dans une séance ni en vue professeur ; le moteur bumpé", () => {
  const page = lire("../outils/calcul_mental/defi_tables.html");
  const fin = page.slice(page.indexOf("      function finish() {"), page.indexOf("      // Audit 1 (30/09/2026) : après une validation ratée"));
  assert.match(fin, /if \(!enSeance\(\) && !VUE_PROF && state\.revisionPremierTotal > 0\) \{\s*parcours = PARCOURS\.noterHorsSeance\(parcours, \{type: "revision", table: state\.configuration\.revisionTable\}, \{date: PARCOURS\.jourLocal\(\)\}\);\s*sauverParcours\(\);/);
  assert.match(fin, /if \(!enSeance\(\) && !VUE_PROF && suivi\.classement\) \{\s*const verdict = suivi\.evenements\.find\(evenement => typeof evenement\.reussi === "boolean"\);\s*parcours = PARCOURS\.noterHorsSeance\(parcours, suivi\.classement, \{reussi: Boolean\(verdict && verdict\.reussi\), date: PARCOURS\.jourLocal\(\)\}\);\s*\}\s*sauverParcours\(\);/);
  assert.ok(fin.indexOf("PARCOURS.noterHorsSeance(parcours, suivi.classement") > fin.indexOf("PARCOURS.appliquerSerie(parcours, state.configuration"), "après appliquerSerie");
  assert.match(page, /defi_tables_mon_parcours\.js\?v=20261111-3"/);
  // « Ses séances » (vue professeur de Mon parcours) ne montre que les séances.
  assert.match(page, /const seances = j\.lignes\.filter\(l => !l\.hors\);/);
});

test("Serveur : les clés déclarées, Défi tables en version 5 et Coffres en version 4 à l'écriture", () => {
  const applis = lire("../_serveur/public/lib/applis.php");
  assert.match(applis, /'journal', 'etapes', 'justes', 'test', 'numero',\s*'horsSeance', 'fait'\],/);
  assert.match(applis, /'version_min' => 5,/);
  assert.match(applis, /'version_min' => 4,\s*\],\s*\/\/ Anzan/);
  const ref = JSON.parse(lire("../_serveur/tests/parcours-reference.json"));
  assert.deepEqual(ref.horsSeance, {jours: ["2026-09-20", "2026-09-20", "2026-09-24"], table: [0, 4, 6], fait: [17, 14, 10]});
  assert.equal(ref.version, 5);
});

test("Coffres : les clés d'un jour sans trésor font un jour de travail ; la partie pas finie dit ses clés et son niveau ; un journal d'avant (4 colonnes) se lit -1", () => {
  const dix = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];
  let p = C.commencerPartie(C.creer(), {niveau: 1, ops: [1, 2, 3, 4], serie: dix, familles: dix.map(() => false)}, MARDI);
  dix.slice(0, 6).forEach(o => { p = C.noterCle(p, o, MARDI); });
  dix.slice(6).forEach(o => { p = C.noterCle(p, o, VENDREDI); });
  p = C.noterTresor(p, VENDREDI);
  p = C.commencerPartie(p, {niveau: 2, ops: [1, 2, 3, 4], serie: dix, familles: dix.map(() => false)}, VENDREDI);
  dix.slice(0, 3).forEach(o => { p = C.noterCle(p, o, VENDREDI); });
  const r = C.resumeSuivi(C.pourServeur(p), VENDREDI);
  assert.deepEqual(r.jours, [
    {jour: MARDI, lignes: [{tresors: 0, parfaits: 0, aides: 0, solutions: 0, cles: 6}]},
    {jour: VENDREDI, lignes: [{tresors: 1, parfaits: 1, aides: 0, solutions: 0, cles: 7, partie: 3, niveau: 2}]}
  ]);
  assert.equal(C.VERSION, 4);
  const vieux = {version: 3, jours: [LUNDI], journal: {tresors: [1], parfaits: [0], aides: [0], solutions: [0]}, depuis: LUNDI};
  assert.deepEqual(C.resumeSuivi(vieux, VENDREDI).jours[0].lignes[0].cles, null);
  assert.deepEqual(C.fusionner(p, vieux).journal.cles, [-1, 6, 7], "fusion : le plus grand, -1 = pas connu");
  const aidesSeules = {version: 3, jours: [LUNDI], journal: {tresors: [0], parfaits: [0], aides: [2], solutions: [0]}, depuis: LUNDI};
  assert.deepEqual(C.resumeSuivi(aidesSeules, VENDREDI).jours, [], "une aide seule, sans clé ni trésor, n'est pas un jour (comme avant)");
});

test("SPLAT! : la ligne dit les étapes réussies pour la première fois ce jour-là ; une étape refaite n'y est pas", () => {
  const [e1, e2] = S.PARCOURS_VALIDES;
  let p = S.creer();
  p = S.enregistrerSerie(p, e1, {fait: true, etoiles: 6, cartes: 6, vues: 0}, LUNDI);
  p = S.enregistrerSerie(p, e1, {fait: true, etoiles: 6, cartes: 6, vues: 0}, JEUDI);
  p = S.enregistrerSerie(p, e2, {fait: true, etoiles: 5, cartes: 6, vues: 1}, VENDREDI);
  const r = S.resumeSuivi(S.pourServeur(p), VENDREDI);
  const ligne = jour => r.jours.find(j => j.jour === jour).lignes[0];
  assert.deepEqual([ligne(LUNDI).etapes, ligne(LUNDI).reussies], [[1], 1]);
  assert.deepEqual([ligne(JEUDI).etapes, ligne(JEUDI).reussies], [[], 1], "jeudi : l'étape 1 refaite");
  assert.deepEqual(ligne(VENDREDI).etapes, [2]);
});

test("Défi calcul : la dernière ligne d'un jour porte les modules avancés ce jour-là (codes, la page écrit le nom)", () => {
  const carte = DCORE.carte();
  // (Lot K1 : deux étoiles de suite, celles que « Continuer » propose.)
  let p = D.ouvrirSeance(D.creerParcours(), carte, {aujourdhui: MARDI, alea: 0.25});
  for (let k = 0; k < 2; k += 1) {
    const et = D.continuer(p, carte, {aujourdhui: MARDI});
    if (et.type !== "etoile" || !D.seanceOuverte(p, MARDI)) break;
    p = D.noterTemps(p, 200);
    p = D.appliquerSerie(p, {module: et.module, niveau: et.niveau, genre: "apprends", reponses: Array(8).fill({juste: true, outil: "aucun"}), causes: {}}, {aujourdhui: MARDI, carte, seance: true}).parcours;
  }
  if (D.seanceOuverte(p, MARDI)) p = D.fermerSeance(p, carte, {aujourdhui: MARDI, force: true}).parcours;
  const r = D.resumeSuivi(p, VENDREDI);
  const lignes = r.jours.find(j => j.jour === MARDI).lignes;
  assert.ok(Array.isArray(lignes[lignes.length - 1].modules) && lignes[lignes.length - 1].modules.length >= 1);
  lignes[lignes.length - 1].modules.forEach(id => assert.ok(DCORE.moduleDe(id), id));
});

test("Anzan : un passage de grade dit réussi (1) ou pas encore (0) ; null hors des grades", () => {
  let p = A.creer();
  const flash = {operations: "plus", chiffresMin: 1, chiffresMax: 1, nombres: 5, temps: 10, calculs: 10, son: "bip"};
  p = A.noterSeance(p, {id: 21, mode: "flash", reglages: flash, faits: 10, score: 8}, LUNDI).parcours;
  // L'étape 1 du 20e kyu (barème révisé, 22/11/2026), telle que la page la note.
  const e = A.etape(101);
  const reg = {operations: e.operations, chiffresMin: e.chiffresMin, chiffresMax: e.chiffresMax, nombres: e.nombres, etape: 101, grade: e.grade, calculs: 10};
  p = A.noterSeance(p, {id: 22, mode: "grade", reglages: reg, faits: 10, score: 6}, MARDI).parcours;
  p = A.noterSeance(p, {id: 23, mode: "grade", reglages: reg, faits: 10, score: 10}, JEUDI).parcours;
  const r = A.resumeSuivi(p, VENDREDI);
  assert.deepEqual(r.jours.map(j => j.lignes[0].reussi), [null, 0, 1]);
  assert.deepEqual(r.jours.map(j => [j.lignes[0].etape, j.lignes[0].sur]), [[undefined, undefined], [1, 2], [1, 2]], "une séance de grade dit son étape");
});

// ------------------------------------------------------------ la page du professeur

const page = lire("../_serveur/public/prof/index.php");
function fonction(nom) {
  const debut = page.indexOf(`  function ${nom}(`);
  assert.ok(debut >= 0, nom);
  let profondeur = 0;
  for (let i = page.indexOf("{", debut); i < page.length; i += 1) {
    if (page[i] === "{") profondeur += 1;
    else if (page[i] === "}" && --profondeur === 0) return page.slice(debut, i + 1);
  }
  throw new Error(nom);
}
const texteBrut = new Function("ANZAN", "CALCUL_CORE", `${fonction("pluriel")}\n${fonction("texteLigne")}\nreturn texteLigne;`)(A, DCORE);
// pluriel() soude le nombre à son mot (espace insécable) : on compare en espaces simples.
const texteLigne = (...args) => texteBrut(...args).map(x => (typeof x === "string" ? x.replace(/\u00a0/g, " ") : x));

test("Page prof, « Activité » : chaque ligne dit ce qui a été fait — sans « hors séance », sans minutes, sans mot genré", () => {
  assert.deepEqual(texteLigne("defi-tables", {hors: 1, table: 3, mesCalculs: 0, apprends: 0, entraine: 0, melange: 0, score: null, test: 1}), ["table de 3 · test réussi ✓", "", false]);
  assert.deepEqual(texteLigne("defi-tables", {hors: 1, table: 4, mesCalculs: 0, apprends: 1, entraine: 1, melange: 0, score: null, test: 2}), ["table de 4 · J’apprends · entraînement · test pas encore", "", false]);
  assert.deepEqual(texteLigne("defi-tables", {hors: 1, table: 0, mesCalculs: 1, apprends: 0, entraine: 0, melange: 1, score: 18, test: 0}), ["Mes calculs du jour · Mon mélange", "18/20", false]);
  assert.deepEqual(texteLigne("defi-tables", {table: 5, etapes: 4, calculs: 10, justes: 9, test: 1}), ["table de 5 · 4 étapes · test réussi ✓", "calculs du jour 9/10", false]);
  assert.deepEqual(texteLigne("defi-tables", {table: 5, etapes: 1, calculs: 0, justes: 0, test: 0}), ["table de 5 · 1 étape", "", false]);
  assert.deepEqual(texteLigne("splat", {series: 1, reussies: 1, vues: 0, etapes: [3], bonus: 0})[0], "étape 3 réussie");
  assert.deepEqual(texteLigne("splat", {series: 3, reussies: 3, vues: 2, etapes: [3, 4], bonus: 0}), ["étapes 3 et 4 réussies · 1 étape refaite", "2 réponses vues", false]);
  assert.deepEqual(texteLigne("splat", {series: 2, reussies: 0, vues: 0, etapes: [], bonus: 0})[0], "2 séries · pas encore réussie");
  assert.deepEqual(texteLigne("splat", {series: 1, reussies: null, vues: null, etapes: []})[0], "1 série · pas encore réussie");
  assert.deepEqual(texteLigne("splat", {series: 2, reussies: 1, vues: 1}), ["2 séries · 1 étape réussie", "1 réponse vue", false], "une ligne sans le détail (moteur d'avant) : comme avant");
  assert.deepEqual(texteLigne("coffres", {tresors: 0, parfaits: 0, aides: 1, solutions: 0, cles: 6}), ["6 clés", "1 aide", false]);
  assert.deepEqual(texteLigne("coffres", {tresors: 1, parfaits: 1, aides: 0, solutions: 0, cles: 7, partie: 3, niveau: 2})[0], "1 trésor · 1 parfait · partie en cours : 3 clés sur 10 · niveau 2");
  assert.deepEqual(texteLigne("coffres", {tresors: null, parfaits: null, aides: null, solutions: null, cles: null, partie: 1, niveau: 1})[0], "partie en cours : 1 clé sur 10 · niveau 1");
  assert.deepEqual(texteLigne("coffres", {tresors: null, parfaits: null, aides: null, solutions: null})[0], "une partie", "jamais une ligne vide");
  const nom = DCORE.moduleDe("A1").nom;
  assert.deepEqual(texteLigne("defi-calcul", {calculs: 0, justes: 0, nouveautes: 1, prouvees: 0, rouges: 0, modules: ["A1", "ZZ9"]})[0], `${nom} · 1 étoile gagnée par J’apprends`, "un code sans nom n'est jamais écrit");
  assert.match(texteLigne("flash-anzan", {mode: "grade", calculs: 10, justes: 6, prevus: 10, grade: 1, reussi: 0})[0], / · pas encore$/);
  assert.match(texteLigne("flash-anzan", {mode: "grade", calculs: 10, justes: 10, prevus: 10, grade: 1, reussi: 1})[0], / · réussi ✓$/);
  // Barème révisé (22/11/2026) : la ligne dit l'étape, quand le grade en a plusieurs.
  assert.equal(texteLigne("flash-anzan", {mode: "grade", calculs: 10, justes: 8, prevus: 10, grade: 1, reussi: 1, etape: 1, sur: 2})[0].replace(/\u00a0/g, " "), "grade 20e kyu, étape 1 sur 2 · réussie ✓");
  assert.equal(texteLigne("flash-anzan", {mode: "grade", calculs: 10, justes: 5, prevus: 10, grade: 12, reussi: 0, etape: 1, sur: 1})[0].replace(/\u00a0/g, " "), "grade 9e kyu · pas encore");
  assert.equal(texteLigne("flash-anzan", {mode: "entrainement", calculs: 5, justes: 5, prevus: 5, grade: 9, reussi: null, etape: 2, sur: 3})[0].replace(/\u00a0/g, " "), "entraînement au 12e kyu, étape 2 sur 3");
  assert.equal(texteLigne("flash-anzan", {mode: "flash", calculs: 10, justes: 8, prevus: 10, grade: 0, reussi: null})[0], "Flash");
  const corps = fonction("texteLigne").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(corps, /hors séance|minute|\bil a\b|\belle a\b/i);
});

test("Copies du moteur dans prof/ : identiques octet pour octet ; cache-busters bumpés", () => {
  for (const [site, prof] of [["../outils/calcul_mental/defi_tables_mon_parcours.js", "defi_tables_mon_parcours.js"], ["../assets/js/coffres-parcours.js", "coffres-parcours.js"],
    ["../assets/js/splat-parcours.js", "splat-parcours.js"], ["../outils/calcul_mental/defi_calcul_mon_parcours.js", "defi_calcul_mon_parcours.js"], ["../outils/calcul_mental/flash_anzan_parcours.js", "flash_anzan_parcours.js"]]) {
    assert.equal(lire(`../_serveur/public/prof/${prof}`), lire(site), prof);
  }
  assert.match(lire("../outils/calcul_mental/coffres_magiques_solo.html"), /coffres-parcours\.js\?v=20261111-3"/);
  assert.match(lire("../outils/splat.html"), /splat-parcours\.js\?v=20261111-2"/);
  assert.match(lire("../outils/calcul_mental/flash_anzan.html"), /flash_anzan_parcours\.js\?v=20261122-1"/);
  assert.match(lire("../outils/calcul_mental/defi_calcul_modules.html"), /defi_calcul_mon_parcours\.js\?v=20261127-2"/);
});
