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

test("la carte de séance : « 10 minutes », la dernière ligne « Puis j'avance… » ; 15 minutes au choix du professeur", () => {
  const f = P.fileSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: J});
  assert.deepEqual(f.etapes, [{type: "test", module: "A1"}, {type: "avance"}]);
  assert.equal(f.jouables, 1);
  assert.equal(f.minutes, 10);
  assert.equal(P.fileSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: J, minutes: 15}).minutes, 15);
  assert.equal(P.fileSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: J, minutes: 12}).minutes, 10, "ni 10 ni 15 : 10");
  // La durée est rangée dans le plan à l'ouverture : elle ne bouge plus de la séance.
  const ouverte = P.ouvrirSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: J, minutes: 15});
  assert.equal(ouverte.seance.p[P.PLAN.minutes], 15);
  assert.equal(P.fileSeance(ouverte, CARTE, {aujourdhui: J, minutes: 10}).minutes, 15);
  assert.deepEqual([P.minutesDeSeance(15), P.minutesDeSeance("15"), P.minutesDeSeance(20)], [15, 10, 10]);
});

test("la séance au temps : l'avancée est garantie jusqu'au premier apprentissage ; ensuite, rien ne commence sans le temps de finir", () => {
  let p = P.ouvrirSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: J});
  // Le temps passé ne coupe pas le premier test ni le premier apprentissage.
  p = P.noterTemps(p, 20 * 60);
  assert.deepEqual(types(p), ["test"], "le test du premier module, même après 20 minutes ; pas de « Puis j'avance »");
  p = tester(p, "A1", 1).parcours;
  assert.deepEqual(types(p), ["apprends"], "le premier apprentissage, quoi qu'il arrive (lot 2 : une seule étape)");
  const r = apprendre(p, "A1", 2);
  assert.equal(r.parcours.seance.p[P.PLAN.commences], 0, "la séance est refermée");
  assert.equal(r.finie, true, "le temps est passé : la séance est finie");
  assert.deepEqual(r.parcours.seances, [J]);
  // Avec du temps : le module suivant est testé, et ainsi de suite.
  let q = P.ouvrirSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: J});
  q = tester(q, "A1", 1).parcours;
  q = P.noterTemps(q, 4 * 60);
  q = apprendre(q, "A1", 2).parcours;
  assert.equal(q.seance.p[P.PLAN.ouverte], 1, "4 minutes : la séance continue");
  assert.equal(q.seance.p[P.PLAN.commences], 1);
  // (Lot 7e-2 : A1-3, pas encore joué, a son test ; raté, on l'apprend.)
  assert.deepEqual(types(q), ["test", "avance"], "A1-3, pas encore joué : « Tu connais déjà ? » ; il restera du temps");
  q = raterMarche(q, "A1", 3);
  assert.deepEqual(types(q), ["apprends", "avance"], "A1-3, raté au test : on l'apprend ; il restera du temps");
  // Lot F4 : le J'apprends qui suit un test raté AUJOURD'HUI est garanti
  // (une séance ne finit jamais sur un test raté) ; il s'arrête au bout du
  // temps. Le même, le test raté un autre jour : 9 minutes passées,
  // J'apprends (4 min) ne tient plus — la séance attend.
  q = P.noterTemps(q, 5 * 60);
  assert.deepEqual(types(q), ["apprends"], "garanti après le test raté");
  q.modules.A1.vu = P.ajouterJours(J, -1);
  assert.deepEqual(types(q), []);
  assert.equal(P.fileSeance(q, CARTE, {aujourdhui: J}).aFermer, true, "plus rien à jouer : elle se ferme à l'accueil");
  const fermee = P.fermerSeance(q, CARTE, {aujourdhui: J});
  assert.equal(fermee.fermee, true);
  assert.deepEqual(fermee.parcours.seances, [J]);
  assert.equal(fermee.parcours.journal.minutes[0], 9);
  assert.equal(P.fermerSeance(fermee.parcours, CARTE, {aujourdhui: J}).fermee, false, "rien à refermer");
});

test("15 minutes : plus de temps, plus d'avancée ; une tolérance d'une minute", () => {
  let p = P.ouvrirSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: J, minutes: 15});
  p = tester(p, "A1", 1).parcours;
  p = apprendre(p, "A1", 2).parcours;
  // (Lot 7e-2 : A1-3 a son test ; raté, il s'apprend.)
  p = raterMarche(p, "A1", 3);
  // (Lot F4 : le test raté un autre jour — sinon J'apprends est garanti.)
  p.modules.A1.vu = P.ajouterJours(J, -1);
  p = P.noterTemps(p, 11 * 60);
  assert.deepEqual(types(p), ["apprends"], "11 min + 4 min = 15 : ça tient (sans « Puis j'avance »)");
  p = P.noterTemps(p, 61);
  assert.deepEqual(types(p), [], "12 min + 4 min > 16 : rien ne commence");
});

test("un module jamais commencé est toujours testé : pas de leçon d'office ; 12 tests au plus par séance", () => {
  assert.equal(P.SEUILS.test.parSeance, 12);
  let p = P.ouvrirSeance(sansTestDePalier(P.creerParcours()), CARTE, {aujourdhui: J});
  for (let i = 0; i < 12; i += 1) {
    const e = P.fileSeance(p, CARTE, {aujourdhui: J}).etapes[0];
    assert.equal(e.type, "test", `test n° ${i + 1}`);
    p = tester(p, e.module, P.NIVEAUX[e.module]).parcours;
  }
  assert.equal(p.seance.n, 1, "le 12e test ferme la séance ; le module suivant attend la suivante");
});

test("le palier : au-delà du réglage, ni test ni leçon ; le validé continue de revenir", () => {
  // Tout le palier 1 est appris (boîte 2, dû aujourd'hui) ; le réglage s'arrête aux bases.
  const p = sansTestDePalier(P.creerParcours());
  P.parcoursConstruit(CARTE).filter(c => P.palierDe(CARTE, c.module, c.niveau) === 1).forEach(({module, niveau}) => {
    const ligne = p.modules[module] || P.normaliserParcours({modules: {[module]: {}}}).modules[module];
    ligne.b[niveau - 1] = 2; ligne.e[niveau - 1] = J; ligne.a[niveau - 1] = 1; ligne.vu = plus(-1);
    p.modules[module] = ligne;
  });
  const q = P.normaliserParcours(p);
  assert.equal(P.competenceCourante(q, CARTE, 1), null, "rien au-delà des bases");
  assert.equal(P.palierDe(CARTE, P.competenceCourante(q, CARTE, 4).module, P.competenceCourante(q, CARTE, 4).niveau), 2, "tout : le palier 2 vient");
  assert.deepEqual(types(q, J, {palier: 1}), ["jour"], "les calculs du jour, rien de nouveau");
  assert.equal(P.fileSeance(q, CARTE, {aujourdhui: J, palier: 1}).etapes[0].calculs, 20, "le validé revient (20 au plus)");
  // Lot 7-0 (choix de Gwenaël) : les marches d'un palier plus haut d'un
  // module commencé ont leur test (avant : J'apprends d'office).
  assert.deepEqual(types(q, J, {palier: 2}).slice(0, 3), ["jour", "test", "avance"], "palier 2 : A2-4 (son module est commencé : le test de ses marches du palier 2)");
  assert.deepEqual([P.palierDeSeance(2), P.palierDeSeance(0), P.palierDeSeance("2"), P.palierDeSeance(5)], [2, 4, 4, 4]);
  assert.equal(P.etatModule(q, P.competenceCourante(q, CARTE, 4).module, CARTE, 1).ici, 0, "pas de « Mon niveau » au-delà");
});

test("le 2e calcul : un faux s'applique tout de suite ; le 2e juste rend la boîte (« un accident »), il revient demain", () => {
  let p = P.ouvrirSeance(eleveA1(), CARTE, {aujourdhui: J});
  const avant = JSON.parse(JSON.stringify(p.modules.A1));
  const faux = P.appliquerRetour(p, {module: "A1", niveau: 1, juste: false, ms: 3000, type: "F"}, {aujourdhui: J});
  assert.equal(faux.mouvement.sens, "descend");
  assert.equal(faux.mouvement.deuxiemeAVenir, true);
  assert.equal(faux.parcours.modules.A1.b[0], avant.b[0] - 1, "quitter avant le 2e calcul ne fait rien gagner");
  assert.deepEqual(P.deuxiemeEnAttente(faux.parcours, J), {module: "A1", niveau: 1});
  const plan = faux.parcours.seance.p;
  assert.deepEqual([plan[P.PLAN.second], plan[P.PLAN.secondBoite], plan[P.PLAN.secondEchecs], plan[P.PLAN.secondAppris]], [P.rangDe("A1", 1) + 1, avant.b[0], 0, 1]);
  const juste = P.appliquerRetour(faux.parcours, {module: "A1", niveau: 1, juste: true, ms: 3000, type: "F"}, {aujourdhui: J, deuxieme: true});
  assert.equal(juste.mouvement.rendu, true);
  assert.equal(juste.parcours.modules.A1.b[0], avant.b[0], "la boîte d'avant");
  assert.equal(juste.parcours.modules.A1.x[0], 0, "ce n'est pas un échec");
  assert.equal(juste.parcours.modules.A1.e[0], plus(1), "revient demain");
  assert.equal(P.deuxiemeEnAttente(juste.parcours, J), null);
  assert.deepEqual(juste.parcours.seance.j.slice(0, 2), [2, 1], "le journal compte les deux calculs");
  // Le 2e faux : rien de plus (le 1er faux compte déjà).
  const encore = P.appliquerRetour(faux.parcours, {module: "A1", niveau: 1, juste: false, ms: 3000, type: "F"}, {aujourdhui: J, deuxieme: true});
  assert.deepEqual(encore.parcours.modules.A1.b, faux.parcours.modules.A1.b);
  assert.deepEqual(encore.parcours.modules.A1.x, faux.parcours.modules.A1.x);
  assert.equal(encore.mouvement.rendu, false);
  // Un 2e calcul d'une autre compétence ne rend rien.
  const autre = P.appliquerRetour(faux.parcours, {module: "A1", niveau: 2, juste: true, ms: 3000, type: "F"}, {aujourdhui: J, deuxieme: true});
  assert.deepEqual(autre.parcours.modules.A1.b, faux.parcours.modules.A1.b);
  // Le 2e calcul resté en attente (page fermée) : la fin des calculs du jour l'oublie, le faux reste.
  const fini = P.terminerCalculsDuJour(faux.parcours, {aujourdhui: J, carte: CARTE}).parcours;
  assert.equal(P.deuxiemeEnAttente(fini, J), null);
  assert.equal(fini.modules.A1.b[0], avant.b[0] - 1);
  // Hors séance : pas de 2e calcul.
  const horsSeance = P.appliquerRetour(eleveA1(), {module: "A1", niveau: 1, juste: false, ms: 3000, type: "F"}, {aujourdhui: J});
  assert.equal(horsSeance.mouvement.deuxiemeAVenir, false);
});

test("le 2e calcul rend aussi une compétence mise de côté au 3e échec", () => {
  let p = P.ouvrirSeance(eleveA1(), CARTE, {aujourdhui: J});
  p.modules.A1.x[2] = 2; p.modules.A1.a[2] = 0;
  p = P.normaliserParcours(p);
  const faux = P.appliquerRetour(p, {module: "A1", niveau: 3, juste: false, ms: 3000, type: "F"}, {aujourdhui: J});
  assert.equal(faux.mouvement.deCote, true);
  const juste = P.appliquerRetour(faux.parcours, {module: "A1", niveau: 3, juste: true, ms: 3000, type: "F"}, {aujourdhui: J, deuxieme: true});
  assert.deepEqual([juste.parcours.modules.A1.b[2], juste.parcours.modules.A1.x[2], juste.parcours.modules.A1.a[2]], [3, 2, 0], "tout ce qu'elle avait avant le faux");
});

test("le « lent » : la 1re fois, rien de visible ; deux fois de suite, c'est un faux (rouge), sans 2e calcul", () => {
  let p = P.ouvrirSeance(eleveA1(), CARTE, {aujourdhui: J});
  const l1 = P.appliquerRetour(p, {module: "A1", niveau: 1, juste: true, ms: 7000, type: "F"}, {aujourdhui: J});
  assert.equal(l1.mouvement.lent, true);
  assert.equal(l1.mouvement.sens, "reste");
  assert.equal(l1.parcours.modules.A1.l[0], 1);
  assert.equal(l1.parcours.modules.A1.e[0], plus(1));
  const q = P.ouvrirSeance(l1.parcours, CARTE, {aujourdhui: plus(1)});
  const l2 = P.appliquerRetour(q, {module: "A1", niveau: 1, juste: true, ms: 7000, type: "F"}, {aujourdhui: plus(1)});
  assert.equal(l2.mouvement.lent2, true);
  assert.deepEqual(l2.evenements.filter(e => e.type === "lent2"), [{type: "lent2", module: "A1", niveau: 1}]);
  assert.equal(l2.mouvement.sens, "descend");
  assert.equal(l2.mouvement.rouge, true);
  assert.equal(l2.mouvement.deuxiemeAVenir, false, "pas de 2e calcul après un lent");
  assert.equal(l2.parcours.modules.A1.l[0], 0);
  assert.equal(P.deuxiemeEnAttente(l2.parcours, plus(1)), null);
  // Lent puis juste et rapide : remis à 0. Une procédure n'est jamais lente.
  const vite = P.appliquerRetour(q, {module: "A1", niveau: 1, juste: true, ms: 2000, type: "F"}, {aujourdhui: plus(1)});
  assert.equal(vite.parcours.modules.A1.l[0], 0);
  assert.equal(P.appliquerRetour(p, {module: "A1", niveau: 1, juste: true, ms: 9000, type: "P"}, {aujourdhui: J}).parcours.modules.A1.l[0], 0);
});

test("le test : 3 calculs par marche, 3 justes sur 4 pour monter ; deux faux arrêtent", () => {
  assert.deepEqual([P.SEUILS.test.parMarche, P.SEUILS.test.fauxPermis], [3, 1]);
  const marche = niveaux => P.appliquerTest(sansTestDePalier(P.creerParcours()), {module: "A1", marche: 3, niveaux}, {aujourdhui: J, carte: CARTE}).marche;
  assert.equal(marche([{niveau: 1, justes: 3, total: 3}, {niveau: 2, justes: 3, total: 4}, {niveau: 3, justes: 2, total: 4}]), 2);
  assert.equal(marche([{niveau: 1, justes: 2, total: 3}]), 0, "un faux sans le calcul de plus réussi");
  assert.equal(marche([{niveau: 1, justes: 4, total: 4}, {niveau: 2, justes: 4, total: 5}, {niveau: 3, justes: 3, total: 3}]), 3, "un niveau à 4 sortes");
});

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

test("une progression de version 6 se relit : `l` à 0, une séance ouverte continue avec 10 minutes ; l'arrêt d'un entraînement raté reste", () => {
  const v6 = {version: 6, modules: {A1: {vu: J, b: [4, 4, 3], e: [J, J, J], a: [1, 1, 1], f: [1, 1, 1], x: [0, 0, 0], t: [0, 0, 0]}},
    seance: {jour: J, etape: 2, n: 4, p: [1, 0, 0, 3, 0, 2, 1], j: [3, 3, 2, 0, 300, 1]}, seances: [plus(-1)]};
  const p = P.normaliserParcours(v6);
  assert.equal(p.version, 10, "lot 6 « programmes 2 » : 9 ; lot F4 : 10");
  assert.deepEqual(p.modules.A1.l, [0, 0, 0]);
  assert.deepEqual(p.seance.p, [1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(P.fileSeance(p, CARTE, {aujourdhui: J}).minutes, 10);
  const arretee = P.normaliserParcours(Object.assign({}, v6, {seance: Object.assign({}, v6.seance, {p: [1, 0, 0, 0, 3, 1, 0]})}));
  assert.equal(arretee.seance.p[P.PLAN.nouveaute], 3);
  // Un 2e calcul en attente sans ce qu'il rend ne vaut rien.
  assert.equal(P.normaliserParcours({version: 7, seance: {jour: J, etape: 1, n: 0, p: [1, 1, 0, 0, 0, 10, 0, 5, 0, 0, 0]}}).seance.p[P.PLAN.second], 0);
});

test("la fusion : `l` suit le bloc de la compétence ; les minutes et les apprentissages commencés, le plus grand des deux", () => {
  let a = P.ouvrirSeance(eleveA1(), CARTE, {aujourdhui: J, minutes: 15});
  a = P.appliquerRetour(a, {module: "A1", niveau: 1, juste: true, ms: 7000, type: "F"}, {aujourdhui: J}).parcours;
  let b = P.ouvrirSeance(eleveA1(), CARTE, {aujourdhui: J});
  b.seance.p[P.PLAN.commences] = 2;
  b = P.normaliserParcours(b);
  [P.fusionner(a, b), P.fusionner(b, a)].forEach(f => {
    assert.equal(f.modules.A1.l[0], 1, "le côté vu le plus récemment");
    assert.equal(f.seance.p[P.PLAN.minutes], 15);
    assert.equal(f.seance.p[P.PLAN.commences], 2);
  });
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
