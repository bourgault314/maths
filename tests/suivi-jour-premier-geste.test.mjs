// Un jour de travail dès le premier geste — Coffres magiques : dès la PREMIÈRE CLÉ (choix de
// Gwenaël, 08/11/2026 : « l'élève a fait quelque chose »).
//
// Jusqu'ici (lot S1), un jour de Coffres ne comptait que s'il avait un
// trésor ouvert (10 clés). Désormais compte AUSSI le dernier jour joué de la
// partie en cours, dès qu'elle a une clé. RIEN NE CHANGE AUX DONNÉES : la
// partie garde déjà ses clés (p.partie.cles) et son jour (p.partie.jour,
// posé à chaque clé) ; seul resumeSuivi les lit. Limite acceptée : la même
// partie reprise un autre jour ne garde que ce jour-là.
//
// Les applis comptent pareil : un jour où l'élève a vraiment travaillé
// (Défi tables : Mes calculs du jour ou une étape ; Anzan : un calcul fait ;
// SPLAT! : une série jouée ; Coffres : une clé).

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const exiger = createRequire(import.meta.url);
const C = exiger("../assets/js/coffres-parcours.js");
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");

const SERIE = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];
const partie = (p, jour) => C.commencerPartie(p, {niveau: 1, ops: [1, 2, 3, 4], serie: SERIE, familles: SERIE.map(() => false)}, jour);
const cles = (p, n, jour) => { for (let i = 0; i < n; i += 1) p = C.noterCle(p, SERIE[i % SERIE.length], jour); return p; };
const tresor = (p, jour) => C.noterTresor(cles(partie(p, jour), 10, jour), jour);
const JEUDI = "2026-11-12";

test("une partie commencée sans clé : pas un jour de travail (une connexion seule ne compte pas)", () => {
  const r = C.resumeSuivi(C.pourServeur(partie(C.creer(), "2026-11-10")), {aujourdhui: JEUDI});
  assert.deepEqual(r.jours, []);
  assert.equal(r.dernier, null);
});

test("UNE clé gagnée : ce jour-là est un jour de travail ; sa ligne ne dit pas de trésor", () => {
  const p = cles(partie(C.creer(), "2026-11-10"), 1, "2026-11-11");
  const r = C.resumeSuivi(C.pourServeur(p), {aujourdhui: JEUDI});
  // Lot « le jour vert » (11/11/2026) : le journal note les clés du jour, et
  // la ligne du jour de la partie pas finie dit ses clés et son niveau.
  assert.deepEqual(r.jours, [{jour: "2026-11-11", lignes: [{tresors: 0, parfaits: 0, aides: 0, solutions: 0, cles: 1, partie: 1, niveau: 1}]}]);
  assert.equal(r.dernier, "2026-11-11", "il n'est plus « absent » : il a travaillé ce jour-là");
  assert.deepEqual(r.feliciter, [], "toujours rien à féliciter pour Coffres");
});

test("le jour de clés avec une aide ou une solution vue : la ligne les garde (le journal les a notées)", () => {
  let p = partie(C.creer(), "2026-11-11");
  p = C.noterAide(p, "sum", "2026-11-11");
  p = C.noterSolution(p, "sum", "2026-11-11");
  p = cles(p, 3, "2026-11-11");
  const r = C.resumeSuivi(C.pourServeur(p), {aujourdhui: JEUDI});
  assert.deepEqual(r.jours, [{jour: "2026-11-11", lignes: [{tresors: 0, parfaits: 0, aides: 1, solutions: 1, cles: 3, partie: 3, niveau: 1}]}]);
  assert.deepEqual(r.aider, [{type: "solutions-vues", solutions: 1}]);
});

test("un trésor le lundi, des clés le mercredi : deux jours, dans l'ordre ; le même jour : compté une fois", () => {
  let p = tresor(C.creer(), "2026-11-09");
  p = cles(partie(p, "2026-11-11"), 4, "2026-11-11");
  let r = C.resumeSuivi(C.pourServeur(p), {aujourdhui: JEUDI});
  assert.deepEqual(r.jours.map(j => j.jour), ["2026-11-09", "2026-11-11"]);
  assert.equal(r.dernier, "2026-11-11");
  // Un trésor puis une nouvelle partie le même jour : un seul jour, la ligne du trésor.
  let q = tresor(C.creer(), "2026-11-11");
  q = cles(partie(q, "2026-11-11"), 2, "2026-11-11");
  r = C.resumeSuivi(C.pourServeur(q), {aujourdhui: JEUDI});
  assert.deepEqual(r.jours, [{jour: "2026-11-11", lignes: [{tresors: 1, parfaits: 1, aides: 0, solutions: 0, cles: 12, partie: 2, niveau: 1}]}]);
});

test("un jour à venir (horloge d'un autre appareil) ne compte pas ; un jour d'il y a plus de 4 semaines : dernier jour, pas dans les jours", () => {
  const futur = cles(partie(C.creer(), "2026-11-14"), 2, "2026-11-14");
  const r = C.resumeSuivi(C.pourServeur(futur), {aujourdhui: JEUDI});
  assert.deepEqual(r.jours, []);
  assert.equal(r.dernier, null);
  const vieux = cles(partie(C.creer(), "2026-09-01"), 2, "2026-09-01");
  const rv = C.resumeSuivi(C.pourServeur(vieux), {aujourdhui: JEUDI});
  assert.deepEqual(rv.jours, [], "hors des 4 dernières semaines");
  assert.equal(rv.dernier, "2026-09-01");
});

test("la même partie reprise un autre jour : les DEUX jours (lot « le jour vert » : les clés de chaque jour sont au journal ; avant, seul le dernier restait)", () => {
  let p = cles(partie(C.creer(), "2026-11-09"), 3, "2026-11-09");
  p = cles(p, 2, "2026-11-11");
  const r = C.resumeSuivi(C.pourServeur(p), {aujourdhui: JEUDI});
  assert.deepEqual(r.jours.map(j => [j.jour, j.lignes[0].cles, j.lignes[0].partie]), [["2026-11-09", 3, undefined], ["2026-11-11", 2, 5]]);
});

test("les données : la partie garde ses clés et son jour ; depuis le lot « le jour vert », une clé écrit aussi le journal du jour", () => {
  const p = cles(partie(C.creer(), "2026-11-11"), 3, "2026-11-11");
  const envoye = C.pourServeur(p);
  assert.equal(envoye.partie.cles, 3);
  assert.equal(envoye.partie.jour, "2026-11-11");
  assert.deepEqual(envoye.jours, ["2026-11-11"]);
  assert.deepEqual(envoye.journal.cles, [3]);
});

test("le moteur est copié octet pour octet au serveur ; la page de Coffres le recharge (nouveau numéro)", () => {
  assert.equal(lire("../_serveur/public/prof/coffres-parcours.js"), lire("../assets/js/coffres-parcours.js"));
  assert.match(lire("../outils/calcul_mental/coffres_magiques_solo.html"), /coffres-parcours\.js\?v=20261111-3"/);
});

// ============================================================ Défi tables
//
// Même règle (08/11/2026, après le cas de Said : une étape de la table de 6
// faite le 01/11, séance pas finie — « 0 jour » et « — » dans La classe) : le
// jour de la séance en cours compte dès qu'une étape y est faite. Les données
// ne changent pas : « enCours » garde déjà son jour et ses étapes.

const T = exiger("../outils/calcul_mental/defi_tables_mon_parcours.js");
const D = exiger("../outils/calcul_mental/defi_calcul_mon_parcours.js");
// Lot F4 : le test de palier déjà joué (ces tests jouent des séances module par module).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});
const DCORE = exiger("../outils/calcul_mental/defi_calcul_core.js");
const enCours = jour => ({jour, table: 6, depart: 1, echelle: true, rang: 0, file: [2, 3, 4], faites: [1, 10, 10, 0],
  erreurs: [], rate: null, sansFaute: true, remplacee: false, reparee: false, prete: false});

test("Défi tables : une séance pas finie avec une étape faite compte son jour (le cas de Said)", () => {
  const r = T.resumeSuivi({version: 3, seances: [], enCours: enCours("2026-11-01")}, {aujourdhui: "2026-11-08"});
  assert.deepEqual(r.jours, [{jour: "2026-11-01", lignes: [{table: 6, etapes: 1, calculs: 0, justes: 0, test: 0}]}]);
  assert.equal(r.dernier, "2026-11-01", "« Dernière fois » : dim. 01/11, comme l'onglet Défi tables");
});

test("Défi tables : un jour qui a déjà une séance finie n'est pas compté deux fois ; un jour à venir ne compte pas", () => {
  let p = T.creerParcours();
  p.seances = ["2026-11-10"];
  T.JOURNAL.forEach((champ, index) => { p.journal[champ] = [[4, 4, 10, 9, 0, -1][index]]; });
  p = T.normaliserParcours(Object.assign(p, {enCours: Object.assign(enCours("2026-11-10"), {rang: 1})}));
  let r = T.resumeSuivi(p, {aujourdhui: JEUDI});
  assert.deepEqual(r.jours.map(j => [j.jour, j.lignes.length]), [["2026-11-10", 1]]);
  r = T.resumeSuivi({version: 3, seances: [], enCours: enCours("2026-11-14")}, {aujourdhui: JEUDI});
  assert.deepEqual(r.jours, []);
  assert.equal(r.dernier, null);
});

test("Défi tables : sans séance en cours, rien ne change", () => {
  const r = T.resumeSuivi(T.creerParcours(), {aujourdhui: JEUDI});
  assert.deepEqual(r.jours, []);
  assert.equal(r.dernier, null);
});

// ============================================================ Défi calcul

const CARTE = (() => { const c = DCORE.carte(); return {modules: c.modules.map(f => Object.assign({}, f, {construit: f.paliers.some(Boolean)})), ordre: c.ordre}; })();

test("Défi calcul : une séance ouverte, pas finie, avec une étape faite compte son jour ; ouverte sans rien fait, non", () => {
  let p = D.ouvrirSeance(sansTestDePalier(D.creerParcours()), CARTE, {aujourdhui: "2026-11-11", nouveautes: 1});
  let r = D.resumeSuivi(p, {aujourdhui: JEUDI});
  assert.deepEqual(r.jours, [], "ouverte, rien de fait : pas un jour de travail");
  const etape = D.fileSeance(p, CARTE, {aujourdhui: "2026-11-11"}).etapes[0];
  assert.ok(etape, "la séance a une première étape");
  if (etape.type === "test") {
    p = D.appliquerTest(p, {module: etape.module, marche: 1, niveaux: [{niveau: 1, justes: 0, total: 2}]}, {aujourdhui: "2026-11-11", carte: CARTE, seance: true}).parcours;
  } else {
    // Défi calcul, lot 2 : J'apprends en une étape reçoit les réponses.
    const reponses = [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
    p = D.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: etape.type, reponses}, {aujourdhui: "2026-11-11", carte: CARTE, seance: true}).parcours;
  }
  assert.equal(D.normaliserParcours(p).seances.length, 0, "la séance n'est pas finie");
  r = D.resumeSuivi(p, {aujourdhui: JEUDI});
  assert.deepEqual(r.jours.map(j => j.jour), ["2026-11-11"]);
  assert.equal(r.dernier, "2026-11-11");
  assert.deepEqual(D.resumeSuivi(p, {aujourdhui: "2026-11-10"}).jours, [], "pas un jour à venir");
});

test("les moteurs de Défi tables et Défi calcul sont copiés octet pour octet ; leurs pages les rechargent", () => {
  assert.equal(lire("../_serveur/public/prof/defi_tables_mon_parcours.js"), lire("../outils/calcul_mental/defi_tables_mon_parcours.js"));
  assert.equal(lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
  assert.match(lire("../outils/calcul_mental/defi_tables.html"), /defi_tables_mon_parcours\.js\?v=20261111-3"/);
  assert.match(lire("../outils/calcul_mental/defi_calcul_modules.html"), /defi_calcul_mon_parcours\.js\?v=20261121-2"/);
});
