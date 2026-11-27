// Défi calcul, lot P1 refait « tout ouvert, et une semaine après un « Je
// tente » réussi » (27/11/2026) — le MOTEUR. Décisions de Gwenaël :
// carte-et-cles\P1\defi-calcul-parcours-DECISIONS-26-11.md, § 9 à 11.
//  - tout est ouvert dès le premier jour, chaque ceinture se gagne à part ;
//  - « Continuer » part du CP pour tous et monte ; après un « Je tente »
//    raté, il descend tout seul (« Plus facile ») ; pas de classe de l'élève ;
//  - LA RÈGLE NEUVE : une étoile gagnée DU PREMIER COUP à « Je tente » entre
//    en boîte 4 (premier retour au bout de 7 jours, puis 14, 30, 60) ; toute
//    autre étoile gagnée entre en boîte 2 (le lendemain, puis 3, 7, 14…) ;
//  - la règle B : un retour raté, l'étoile reste, descend d'une boîte,
//    revient le lendemain ; ratée encore, elle part ;
//  - la sorte d'un calcul raté (rangée dans `x`, × 4) : le 2e calcul et le
//    retour suivant sont de la même sorte.
// Les données (versions 12 et 13 relues, la fusion, la taille) :
// defi-calcul-lot-P1-donnees.test.mjs.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const J = "2026-06-01";
const plus = n => P.ajouterJours(J, n);
const de = cle => { const [module, niveau] = cle.split("-"); return {module, niveau: Number(niveau)}; };
const o = (jour, seance = false) => ({aujourdhui: jour, carte: CARTE, seance, source: 7});
const justes = () => Array.from({length: 6}, () => ({juste: true, ms: 1500}));
const rates = () => [{juste: false, ms: 1500}, {juste: false, ms: 1500}];
const lecon = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const arretee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const exiger = (r, quoi) => { assert.equal(r.refuse, undefined, `${quoi} : ${r.refuse}`); return r.parcours; };
const tenter = (p, cle, jour) => P.appliquerTentative(p, Object.assign(de(cle), {reponses: justes()}), o(jour));
const rater = (p, cle, jour) => exiger(P.appliquerTentative(p, Object.assign(de(cle), {reponses: rates()}), o(jour)), `Je tente raté ${cle}`);
const apprendre = (p, cle, jour) => exiger(P.appliquerSerie(p, Object.assign(de(cle), {genre: "apprends", reponses: lecon()}), o(jour)), `J'apprends ${cle}`);
const arreter = (p, cle, jour) => exiger(P.appliquerSerie(p, Object.assign(de(cle), {genre: "apprends", reponses: arretee()}), o(jour)), `J'apprends arrêté ${cle}`);
const retour = (p, cle, jour, juste, plusDe = {}) => P.appliquerRetour(p, Object.assign(de(cle), {juste, ms: 1500, type: "P"}, plusDe), {aujourdhui: jour, carte: CARTE});
const etoile = (p, cle, jour = J) => { const {module, niveau} = de(cle); const l = P.normaliserParcours(p, {aujourdhui: jour}).modules[module]; return {b: l.b[niveau - 1], e: l.e[niveau - 1], x: l.x[niveau - 1], a: l.a[niveau - 1], s: l.s[niveau - 1], g: l.g[niveau - 1], pe: l.pe[niveau - 1]}; };
const etoilesDe = carte => carte.etages.flatMap(e => e.lignes.flatMap(l => l.etoiles));
const etage = n => CARTE.lignes.filter(l => l.etage === n).flatMap(l => l.cles);
// Un retour réussi du premier coup, le jour où l'étoile est due.
const reussir = (p, cle) => { const jour = etoile(p, cle).e; const r = retour(p, cle, jour, true); assert.equal(r.refuse, undefined); return [r.parcours, jour]; };

// ------------------------------------------------------------------ les seuils

test("les seuils : version 14, boîte d'entrée 2, boîte 4 pour une étoile gagnée du premier coup, la règle B ; ni classe ni « Tente toute la ceinture »", () => {
  assert.equal(P.VERSION, 14);
  assert.deepEqual(P.SEUILS.revision, {boites: 7, delais: [1, 1, 3, 7, 14, 30, 60], entree: 2, duPremierCoup: 4, su: 4});
  assert.equal(P.SEUILS.revision.delais[P.SEUILS.revision.duPremierCoup - 1], 7, "la boîte 4 : 7 jours");
  assert.equal(P.SEUILS.retour.ratesDeSuite, 2, "la règle B");
  assert.equal(P.SEUILS.sortes, 60);
  ["classes", "ceinture"].forEach(cle => assert.ok(!(cle in P.SEUILS), `SEUILS.${cle} n'existe plus`));
  ["classeDe", "classeEleve", "definirClasse", "calculsDuTestDeCeinture", "appliquerTestCeinture"].forEach(nom => assert.equal(P[nom], undefined, `${nom} n'existe plus`));
  assert.ok(!("classe" in P.creerParcours()), "pas de classe dans la progression");
  assert.deepEqual(P.reglagesParDefaut(), {minutes: 10, palier: 6}, "pas de classe dans les réglages");
  assert.deepEqual(P.reglagesDeSeance({"defi-calcul": {minutes: 15, etage: 3, classe: 8}}), {minutes: 15, palier: 3}, "une classe envoyée est ignorée");
});

// ------------------------------------------------------------------ tout ouvert

test("tout ouvert : un élève neuf a tous les étages ouverts, la première étoile de chaque ligne à gagner (sauf lien « d'abord »)", () => {
  const carte = P.carteEleve(P.creerParcours(), CARTE, {aujourdhui: J});
  assert.equal(carte.etages.length, 6);
  carte.etages.forEach(e => assert.equal(e.ouvert, true, `étage ${e.etage} ouvert`));
  carte.etages.forEach(e => e.lignes.forEach(l => {
    assert.ok(["aGagner", "fermee"].includes(l.etoiles[0].etat));
    l.etoiles.slice(1).forEach(x => assert.equal(x.etat, "fermee", `${x.cle} attend celle d'avant`));
  }));
  const premieres = carte.etages.flatMap(e => e.lignes.map(l => l.etoiles[0]));
  assert.ok(premieres.filter(x => x.etat === "aGagner").length >= premieres.length - 3, "au plus quelques premières étoiles attendent un lien « d'abord »");
  assert.equal(carte.courant, 1, "l'étage où l'élève travaille : le CP");
  // Une étoile du CM2 se gagne le premier jour, sans rien en dessous.
  const cm2 = etage(5)[0];
  const r = tenter(P.creerParcours(), cm2, J);
  assert.equal(r.refuse, undefined);
  assert.equal(r.reussi, true);
});

test("chaque ceinture se gagne à part : toutes les étoiles d'un étage, dans n'importe quel ordre", () => {
  let p = P.creerParcours();
  // Le CE1 d'abord, sans rien au CP.
  for (let tour = 0; tour < 6; tour += 1) etage(2).forEach(cle => { const r = tenter(p, cle, plus(tour)); if (!r.refuse) p = r.parcours; });
  const c = P.etatCeintures(p, CARTE);
  assert.ok(P.normaliserParcours(p).ceintures[1], "la ceinture du CE1 est gagnée");
  assert.equal(P.normaliserParcours(p).ceintures[0], null, "pas celle du CP");
  assert.equal(c.gagnees, 1);
  assert.equal(c.porte, 2, "la plus haute ceinture gagnée");
  assert.equal(c.prochaine, 1, "celle qu'il remplit : la première pas gagnée, du bas");
});

// ------------------------------------------------------------------ « Continuer »

test("« Continuer » part du CP pour tous et monte ; il ne lit aucune classe", () => {
  const p = P.creerParcours();
  const c = P.continuer(p, CARTE, {aujourdhui: J, sansPaquet: true});
  assert.equal(c.type, "etoile");
  assert.equal(c.etage, 1);
  assert.deepEqual(P.ordreDesEtages(6), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(P.ordreDesEtages(3), [1, 2, 3]);
  assert.deepEqual(P.continuer(p, CARTE, {aujourdhui: J, sansPaquet: true, classe: 8}), c, "une option « classe » ne change rien");
  // Le CP gagné : « Continuer » mène au CE1.
  let q = p;
  for (let tour = 0; tour < 6; tour += 1) etage(1).forEach(cle => { const r = tenter(q, cle, plus(tour)); if (!r.refuse) q = r.parcours; });
  assert.equal(P.continuer(q, CARTE, {aujourdhui: plus(6), sansPaquet: true}).etage, 2);
});

test("« Continuer » descend tout seul après un « Je tente » raté : l'étoile plus facile de la famille, et « Plus facile » la nomme", () => {
  // Une étoile du CM1 ratée, l'élève n'a rien en dessous.
  const cle = CARTE.lignes.filter(l => l.etage === 4).find(l => P.plusFacile(P.creerParcours(), CARTE, ...Object.values(de(l.cles[0])), {aujourdhui: J})).cles[0];
  const r = P.appliquerTentative(P.creerParcours(), Object.assign(de(cle), {reponses: rates()}), o(J));
  assert.equal(r.reussi, false);
  assert.ok(r.plusFacile, "« Plus facile » est proposée");
  assert.ok(r.plusFacile.etage < 4);
  assert.deepEqual(r.plusFacile, P.plusFacile(r.parcours, CARTE, de(cle).module, de(cle).niveau, {aujourdhui: J}));
  // (Correctif P1 : « Continuer » lui-même descend — une leçon arrêtée deux fois sur la
  // première étoile du CE2, et « Continuer » propose plus facile. Avant, seul un test
  // sans rapport attrapait un « Continuer » qui ne descendait plus.)
  let q = P.creerParcours();
  const haut = P.carteEleve(q, CARTE, {aujourdhui: J}).etages.find(e => e.etage === 3).lignes[0].etoiles[0];
  for (const d of [-2, -1]) q = exiger(P.appliquerSerie(q, {module: haut.module, niveau: haut.niveau, genre: "apprends", reponses: Array.from({length: 4}, () => ({juste: true, outil: "aucun"})), causes: {}, tempsFini: true}, o(P.ajouterJours(J, d))), "leçon arrêtée");
  const c = P.continuer(q, CARTE, {aujourdhui: J, sansPaquet: true});
  assert.equal(c.raison, "plusFacile", "« Continuer » descend");
  assert.ok(c.etage < 3, "plus bas que le CE2");
});

test("(correctif P1) une étoile déjà perdue, même sans autre trace : « Je tente » réussi n'est pas « du premier coup »", () => {
  const p = P.creerParcours();
  p.modules.A1 = {pe: [1]};
  const r = P.appliquerTentative(p, Object.assign(de("A1-1"), {reponses: justes()}), o(J));
  assert.equal(r.reussi, true);
  assert.deepEqual([r.evenements.find(e => e.type === "gagnee").duPremierCoup, etoile(r.parcours, "A1-1").b], [false, 2]);
});

// ------------------------------------------------------------------ la règle neuve

test("LA RÈGLE NEUVE — gagnée du premier coup à « Je tente » : boîte 4, premier retour au bout de 7 jours ; puis 14, 30, 60 jours, plafond à la boîte 7", () => {
  const r = tenter(P.creerParcours(), "A1-1", J);
  assert.equal(r.reussi, true);
  let p = r.parcours;
  assert.deepEqual([etoile(p, "A1-1").b, etoile(p, "A1-1").e], [4, plus(7)], "boîte 4, le 8 juin");
  const ev = r.evenements.find(e => e.type === "gagnee");
  assert.deepEqual([ev.par, ev.duPremierCoup, ev.retour], ["tente", true, plus(7)], "l'événement le dit (la page écrit « dans une semaine »)");
  // Pas due avant 7 jours : ni le lendemain, ni le 6e jour.
  [1, 3, 6].forEach(n => assert.equal(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: plus(n), maximum: 99}).length, 0, `rien de dû au jour ${n}`));
  assert.equal(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: plus(7), maximum: 99}).length, 1, "due au 7e jour");
  const ecarts = [];
  let jour;
  for (let n = 0; n < 5; n += 1) { [p, jour] = reussir(p, "A1-1"); ecarts.push([etoile(p, "A1-1").b, P.ecartJours ? P.ecartJours(jour, etoile(p, "A1-1").e) : null]); }
  assert.deepEqual(ecarts.map(x => x[0]), [5, 6, 7, 7, 7], "une boîte par retour réussi, plafond à 7");
  if (P.ecartJours) assert.deepEqual(ecarts.map(x => x[1]), [14, 30, 60, 60, 60], "14, 30, 60 jours, puis tous les 60 jours");
});

test("toute autre étoile gagnée entre en boîte 2 et revient le lendemain : par J'apprends, après un « Je tente » raté, après une leçon arrêtée, regagnée après avoir été perdue", () => {
  // Par J'apprends.
  const a = apprendre(P.creerParcours(), "A1-1", J);
  assert.deepEqual([etoile(a, "A1-1").b, etoile(a, "A1-1").e], [2, plus(1)], "J'apprends");
  // Un « Je tente » raté hier, réussi aujourd'hui.
  let b = rater(P.creerParcours(), "A1-1", J);
  const rb = tenter(b, "A1-1", plus(1));
  assert.equal(rb.reussi, true);
  assert.deepEqual([etoile(rb.parcours, "A1-1").b, etoile(rb.parcours, "A1-1").e], [2, plus(2)], "après un raté");
  assert.equal(rb.evenements.find(e => e.type === "gagnee").duPremierCoup, false);
  // Une leçon arrêtée, puis « Je tente » réussi.
  const c = arreter(P.creerParcours(), "A1-1", J);
  const rc = tenter(c, "A1-1", J);
  assert.equal(rc.reussi, true);
  assert.equal(etoile(rc.parcours, "A1-1").b, 2, "après une leçon arrêtée");
  // Gagnée du premier coup, perdue à deux retours ratés, regagnée par « Je tente ».
  let d = tenter(P.creerParcours(), "A1-1", J).parcours;
  const rater2 = (p, jour) => { let r = retour(p, "A1-1", jour, false); r = retour(r.parcours, "A1-1", jour, false, {deuxieme: true}); return r; };
  let r1 = rater2(d, plus(7));
  assert.deepEqual([r1.mouvement.rate, r1.mouvement.perdue, etoile(r1.parcours, "A1-1").b, etoile(r1.parcours, "A1-1").e], [true, false, 3, plus(8)], "règle B : la boîte 4 descend en 3, revient le lendemain");
  let r2 = rater2(r1.parcours, plus(8));
  assert.deepEqual([r2.mouvement.perdue, etoile(r2.parcours, "A1-1").b, etoile(r2.parcours, "A1-1").pe], [true, 0, 1], "ratée encore : elle part");
  const re = tenter(r2.parcours, "A1-1", plus(8));
  assert.equal(re.reussi, true);
  assert.deepEqual([etoile(re.parcours, "A1-1").b, etoile(re.parcours, "A1-1").e], [2, plus(9)], "regagnée : boîte 2, le lendemain");
});

test("la règle B, sur une étoile entrée en boîte 4 : un premier retour raté la descend en boîte 3 (le lendemain), un retour réussi ensuite la remonte en boîte 4 (7 jours)", () => {
  let p = tenter(P.creerParcours(), "A1-1", J).parcours;
  let r = retour(p, "A1-1", plus(7), false);
  assert.equal(r.mouvement.secondAVenir, true, "un faux : le 2e calcul est attendu");
  r = retour(r.parcours, "A1-1", plus(7), false, {deuxieme: true});
  assert.deepEqual([etoile(r.parcours, "A1-1").b, etoile(r.parcours, "A1-1").e, etoile(r.parcours, "A1-1").x & 1], [3, plus(8), 1]);
  r = retour(r.parcours, "A1-1", plus(8), true);
  assert.deepEqual([etoile(r.parcours, "A1-1").b, etoile(r.parcours, "A1-1").e, etoile(r.parcours, "A1-1").x], [4, plus(15), 0], "elle remonte, le retour raté s'efface");
});

test("l'appli regarde l'étoile, pas l'élève : une étoile du CP gagnée du premier coup par un élève qui a appris d'autres étoiles entre en boîte 4", () => {
  let p = apprendre(P.creerParcours(), "A10-1", J);
  p = rater(p, "A2-1", J);
  const r = tenter(p, "A1-1", J);
  assert.equal(etoile(r.parcours, "A1-1").b, 4);
  assert.equal(etoile(r.parcours, "A10-1").b, 2);
});

// ------------------------------------------------------------------ la sorte ratée

test("la sorte d'un calcul raté : rangée dans `x` (× 4), rendue par tirerCalculsDuJour, gardée par la règle B, effacée quand l'étoile monte", () => {
  let p = apprendre(P.creerParcours(), "A1-1", J);
  let r = retour(p, "A1-1", plus(1), false, {sorte: 3});
  assert.equal(etoile(r.parcours, "A1-1").x, 2 + 4 * 3, "le 2e calcul attend (2) et la sorte 3");
  const attente = P.tirerCalculsDuJour(r.parcours, CARTE, {aujourdhui: plus(1), maximum: 99});
  assert.equal(attente[0].sorte, 3, "le 2e calcul : la même sorte");
  r = retour(r.parcours, "A1-1", plus(1), false, {deuxieme: true, sorte: 3});
  assert.equal(etoile(r.parcours, "A1-1").x, 1 + 4 * 3, "la règle B : un retour raté (1) et la sorte 3");
  assert.equal(r.mouvement.sorte, 3);
  assert.equal(P.tirerCalculsDuJour(r.parcours, CARTE, {aujourdhui: plus(2), maximum: 99})[0].sorte, 3, "le retour suivant commence par elle");
  r = retour(r.parcours, "A1-1", plus(2), true, {sorte: 3});
  assert.equal(etoile(r.parcours, "A1-1").x, 0, "elle monte : la sorte s'efface");
  // Une sorte hors bornes est ignorée ; 60 est la plus grande.
  p = apprendre(P.creerParcours(), "A1-1", J);
  assert.equal(etoile(retour(p, "A1-1", plus(1), false, {sorte: 60}).parcours, "A1-1").x, 2 + 240);
  assert.equal(etoile(retour(p, "A1-1", plus(1), false, {sorte: 61}).parcours, "A1-1").x, 2);
  assert.equal(etoile(retour(p, "A1-1", plus(1), false, {sorte: "3"}).parcours, "A1-1").x, 2);
});

test("`x` se relit borné à 243 ; une étoile pas tenue n'a ni retour ni sorte", () => {
  const p = P.creerParcours();
  p.modules.A1 = {b: [3, 0, 0], e: [plus(3), null, null], x: [243, 245, 9], a: [1, 0, 0], g: [1, 0, 0]};
  const l = P.normaliserParcours(p, {aujourdhui: J}).modules.A1;
  assert.deepEqual(l.x, [243, 0, 0]);
});

// ------------------------------------------------------------------ le journal

test("le journal : `tests` compte les premiers retours À 7 JOURS (étoiles gagnées du premier coup), `testsRates` ceux qui sont ratés — pas les autres retours", () => {
  let p = P.creerParcours();
  p = exiger(P.appliquerTentative(p, Object.assign(de("A1-1"), {reponses: justes()}), o(J)), "A1-1");
  p = exiger(P.appliquerTentative(p, Object.assign(de("A10-1"), {reponses: justes()}), o(J)), "A10-1");
  p = apprendre(p, "A2-1", J);
  // (Correctif P1 : une étoile en boîte 2 SANS leçon — « Je tente » raté, puis
  // réussi le lendemain : son premier retour ne compte pas non plus. Avant, un
  // sabotage qui comptait tous les premiers retours sans leçon passait.)
  p = rater(p, "A1-2", J);
  p = exiger(P.appliquerTentative(p, Object.assign(de("A1-2"), {reponses: justes()}), o(plus(1))), "A1-2");
  assert.deepEqual([etoile(p, "A1-2").b, etoile(p, "A1-2").a], [2, 0]);
  const jour = plus(7);
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: jour, alea: .5});
  // A2-1 (boîte 2, appris) est due depuis le 2 juin : son retour ne compte pas.
  p = retour(p, "A2-1", jour, true).parcours;
  p = retour(p, "A1-2", jour, true).parcours;
  p = retour(p, "A1-1", jour, true).parcours;
  let r = retour(p, "A10-1", jour, false);
  r = retour(r.parcours, "A10-1", jour, false, {deuxieme: true});
  p = P.fermerSeance(r.parcours, CARTE, {aujourdhui: jour, force: true}).parcours;
  const n = p.journal.tests.length - 1;
  assert.deepEqual([p.journal.tests[n], p.journal.testsRates[n]], [2, 1]);
  // Revenue une fois : son retour suivant ne compte plus.
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: plus(21), alea: .5});
  p = retour(p, "A1-1", plus(21), true).parcours;
  p = P.fermerSeance(p, CARTE, {aujourdhui: plus(21), force: true}).parcours;
  assert.equal(p.journal.tests[p.journal.tests.length - 1], 0);
});

// ------------------------------------------------------------------ la charge

test("la pile une semaine après : un élève qui gagne tout le CP du premier coup n'a aucun calcul du jour pendant 6 jours ; le 7e, un paquet de 10 au plus, le reste suit", () => {
  let p = P.creerParcours();
  for (let tour = 0; tour < 6; tour += 1) etage(1).forEach(cle => { const r = tenter(p, cle, J); if (!r.refuse) p = r.parcours; });
  assert.ok(P.normaliserParcours(p).ceintures[0], "le CP en une séance");
  for (let n = 1; n < 7; n += 1) assert.equal(P.etatSeance(p, CARTE, {aujourdhui: plus(n)}).obligatoire, 0, `jour ${n} : aucun calcul du jour`);
  const s = P.etatSeance(p, CARTE, {aujourdhui: plus(7)});
  assert.equal(s.obligatoire, 10, "le 7e jour : un paquet de 10");
  assert.equal(s.encore, etage(1).length - 10, "le reste est dû, pas imposé");
});

test("marquer : chaque geste fait monter le compteur de l'étoile (« Je tente » réussi ou raté, J'apprends, un retour)", () => {
  let p = P.creerParcours();
  const g = cle => etoile(p, cle).g;
  p = rater(p, "A1-1", J); assert.ok(g("A1-1") >= 1);
  let avant = g("A1-1");
  p = tenter(p, "A1-1", plus(1)).parcours; assert.ok(g("A1-1") > avant);
  avant = g("A1-1");
  p = retour(p, "A1-1", plus(2), true).parcours; assert.ok(g("A1-1") > avant);
  p = apprendre(p, "A10-1", J); assert.ok(g("A10-1") >= 1);
});
