// Défi calcul, lot P1 — le CORRECTIF de la relecture de Codex (27/11/2026,
// carte-et-cles\P1\refait\defi-calcul-lot-P1-CODEX-RAPPORT.md). Un test par
// point trouvé, sur ses scénarios (reproductions A à G du rapport) :
//  - bloquant : un retour RETROUVÉ (juste au 2e calcul, ou juste mais lent)
//    efface le raté d'avant — la règle B compte deux ratés DE SUITE ;
//  - bloquant : un 2e calcul resté à l'écran d'un retour déjà réglé ailleurs
//    est périmé (la page dit le jour du premier calcul raté, `premierLe`) ;
//  - (bloquant : l'ordre FTP puis fusion — dans la notice, pas de code) ;
//  - la fusion garde la sorte connue ; une copie de version 13 abîmée
//    (x = 241) ne devient pas « sorte 60, un raté » ; une échéance abîmée
//    (9999) revient ; une leçon ouverte puis quittée n'est plus « du premier
//    coup » ; le 2e calcul et le retour suivant gardent la méthode ; le
//    compte des retrouvés survit au rechargement de la page.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const C = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const PAGE = readFileSync(new URL("../outils/calcul_mental/defi_calcul_modules.html", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const carte = C.carte();
const jour = n => P.ajouterJours("2026-06-01", n);
const etoile = {module: "A1", niveau: 1};
const options = n => ({carte, aujourdhui: jour(n)});
const gagnee = P.appliquerTentative(P.creerParcours(), {...etoile, reponses: Array(6).fill({juste: true, ms: 1000})}, options(0)).parcours;
const retour = (p, n, juste, deuxieme, plus = {}) =>
  P.appliquerRetour(p, {...etoile, juste, deuxieme, sorte: 1, ms: 1000, ...plus}, {...options(n), source: plus.source || 0});
const rate = (p, n) => retour(retour(p, n, false, false).parcours, n, false, true);
const x = p => p.modules.A1.x[0];
const corps = nom => {
  const debut = PAGE.indexOf(`function ${nom}(`);
  assert.ok(debut >= 0, nom);
  const suite = PAGE.slice(debut + 10).search(/\n {6}(?:async )?function |\n {6}const [A-Za-z_]+ = /);
  return PAGE.slice(debut, debut + 10 + suite);
};

test("bloquant — raté, puis retrouvé au 2e calcul, puis raté : l'étoile reste (la règle B compte deux ratés DE SUITE)", () => {
  assert.equal(gagnee.modules.A1.b[0], 4);
  const ratee = rate(gagnee, 7);
  assert.deepEqual([ratee.mouvement.rate, ratee.mouvement.perdue, x(ratee.parcours) & 1], [true, false, 1], "raté une fois : elle reste, le raté est noté");
  const premier = retour(ratee.parcours, 8, false, false);
  const retrouvee = retour(premier.parcours, 8, true, true, {premierLe: premier.mouvement.premierLe});
  assert.deepEqual([retrouvee.mouvement.rate, retrouvee.mouvement.accident, x(retrouvee.parcours) & 1], [false, true, 0], "retrouvée au 2e calcul : plus de raté en cours");
  assert.equal(Math.floor(x(retrouvee.parcours) / 4), 1, "la sorte ratée reste : le retour suivant commence par elle");
  const encore = rate(retrouvee.parcours, 9);
  assert.deepEqual([encore.mouvement.rate, encore.mouvement.perdue, encore.parcours.modules.A1.b[0] > 0], [true, false, true], "ratée encore : elle reste (pas deux de suite)");
  assert.equal(rate(encore.parcours, 10).mouvement.perdue, true, "ratée une 2e fois de suite : elle part");
});

test("bloquant — raté, puis juste mais lent (par cœur), puis raté : l'étoile reste", () => {
  const ratee = rate(gagnee, 7).parcours;
  const lente = retour(ratee, 8, true, false, {type: "F", ms: 12000});
  assert.deepEqual([lente.mouvement.lent, x(lente.parcours) & 1], [true, 0]);
  assert.equal(rate(lente.parcours, 9).mouvement.perdue, false);
});

test("bloquant — un 2e calcul resté à l'écran d'un retour réglé ailleurs est périmé (premierLe) ; le 2e calcul de CE retour compte", () => {
  // A : le 2e calcul du 8 juin à l'écran. B : ce retour réglé (deux faux), puis le premier calcul du 9 raté.
  const ratee = rate(gagnee, 7).parcours;
  const premier8 = retour(ratee, 8, false, false);
  assert.equal(premier8.mouvement.premierLe, jour(8), "la page apprend le jour du premier calcul raté");
  const regle8 = retour(premier8.parcours, 8, true, true, {premierLe: jour(8)}).parcours;
  const premier9 = retour(regle8, 9, false, false).parcours;
  const vieux = retour(premier9, 9, false, true, {premierLe: jour(8)});
  assert.deepEqual([vieux.refuse, vieux.mouvement.perime, vieux.mouvement.perdue, vieux.mouvement.secondAVenir, vieux.mouvement.premierLe], ["perime", true, false, true, jour(9)],
    "le vieux 2e calcul ne compte pas ; le moteur dit que le 2e calcul du 9 attend, et son jour");
  assert.deepEqual(vieux.parcours.modules.A1, premier9.modules.A1, "rien ne change");
  const bon = retour(premier9, 9, true, true, {premierLe: jour(9)});
  assert.deepEqual([bon.refuse, bon.mouvement.regle, bon.mouvement.accident], [undefined, true, true], "le 2e calcul du 9 compte");
  // Sans premierLe (un appelant d'avant), rien ne change : la règle d'avant.
  assert.equal(retour(premier9, 9, true, true).mouvement.regle, true);
  // La page rechargée la nuit : le 2e calcul du 8 repris le 9 compte encore (même premier calcul).
  const repris = retour(premier8.parcours, 9, true, true, {premierLe: jour(8)});
  assert.equal(repris.mouvement.regle, true);
});

test("la fusion garde la sorte connue (une copie de version 13 ne la connaît pas) ; dans les deux sens, et deux fois", () => {
  const attente = retour(gagnee, 7, false, false).parcours;
  assert.equal(x(attente), 6, "2e calcul attendu, sorte 1");
  const v13 = structuredClone(attente);
  v13.version = 13;
  v13.modules.A1.x[0] = 2;
  const ab = P.fusionner(attente, v13, options(7));
  const ba = P.fusionner(v13, attente, options(7));
  assert.deepEqual([x(ab), x(ba), x(P.fusionner(ab, v13, options(7)))], [6, 6, 6]);
  // Deux sortes différentes : un choix fixe, le même dans les deux sens.
  const autre = structuredClone(attente);
  autre.modules.A1.x[0] = 2 + 4 * 3;
  assert.equal(x(P.fusionner(attente, autre, options(7))), x(P.fusionner(autre, attente, options(7))));
});

test("une copie de version 13 abîmée (x = 241) est lue comme la lisait la version 13 : 0 ; en version 14, 241 reste 241", () => {
  const abimee = structuredClone(gagnee);
  abimee.version = 13;
  abimee.modules.A1.x[0] = 241;
  assert.equal(x(P.normaliserParcours(abimee)), 0);
  assert.equal(rate(abimee, 7).mouvement.perdue, false, "deux faux au premier retour : elle reste");
  const v14 = structuredClone(gagnee);
  v14.modules.A1.x[0] = 241;
  assert.equal(x(P.normaliserParcours(v14)), 241);
  [0, 1, 2, 3].forEach(v => { const c = structuredClone(gagnee); c.version = 13; c.modules.A1.x[0] = v; assert.equal(x(P.normaliserParcours(c)), v); });
});

test("une échéance abîmée bien au-delà du plus long délai (le 31/12/9999) : l'étoile revient ; une échéance normale ne bouge pas", () => {
  const p = P.creerParcours();
  p.modules.A1 = {b: [4], e: ["9999-12-31"]};
  assert.equal(P.tirerCalculsDuJour(p, carte, options(7)).length, 1);
  const q = P.creerParcours();
  q.modules.A1 = {b: [7], e: [jour(7 + 60)]};
  assert.equal(P.normaliserParcours(q, {aujourdhui: jour(7)}).modules.A1.e[0], jour(67), "60 jours : légitime");
  q.modules.A1.e[0] = jour(7 + 60 + 365);
  assert.equal(P.normaliserParcours(q, {aujourdhui: jour(7)}).modules.A1.e[0], jour(7 + 60 + 365), "un an de marge (horloge en avance)");
});

test("une leçon ouverte puis quittée sans réponse : « Je tente » réussi n'est plus « du premier coup » (le lendemain, pas 7 jours)", () => {
  const ouverte = P.noterLeconCommencee(P.creerParcours(), etoile, {aujourdhui: jour(0)});
  assert.deepEqual([ouverte.modules.A1.a[0], ouverte.modules.A1.ar[0], ouverte.modules.A1.b[0], ouverte.modules.A1.g[0]], [1, 0, 0, 0], "a = 1, rien d'autre");
  const r = P.appliquerTentative(ouverte, {...etoile, reponses: Array(6).fill({juste: true, ms: 1000})}, options(0));
  const ev = r.evenements.find(e => e.type === "gagnee");
  assert.deepEqual([ev.duPremierCoup, r.parcours.modules.A1.b[0], r.parcours.modules.A1.e[0]], [false, 2, jour(1)]);
  // Sans leçon ouverte : toujours la boîte 4.
  assert.equal(gagnee.modules.A1.b[0], 4);
  // Une étoile tenue, une clé inconnue : rendues telles quelles.
  assert.deepEqual(P.noterLeconCommencee(gagnee, etoile, {aujourdhui: jour(1)}).modules.A1, P.normaliserParcours(gagnee, {aujourdhui: jour(1)}).modules.A1);
  assert.deepEqual(P.noterLeconCommencee(gagnee, {module: "ZZ", niveau: 1}, {aujourdhui: jour(1)}), P.normaliserParcours(gagnee, {aujourdhui: jour(1)}));
  // La fusion la garde (a : le plus grand).
  assert.equal(P.fusionner(P.creerParcours(), ouverte, options(0)).modules.A1.a[0], 1);
});

test("le 2e calcul garde la méthode (la sorte rare de « 20 × 3 ») ; le retour suivant commence par la sorte ratée", () => {
  const rang = P.rangDe("M3", 1);
  const calculDuJour = (date, sorte = 0) => C.genererUn("M3-1", (C.graineDe(date + ":") + rang * 977) >>> 0,
    {tour: Math.round(Date.parse(date + "T12:00:00Z") / 86400000) + rang, sorte});
  const janvier = calculDuJour("2026-01-08");
  assert.deepEqual([janvier.texte, C.numeroDeSorte(janvier)], ["20 × 3 = □", 2]);
  for (let graine = 1; graine <= 60; graine += 1) {
    const autre = C.genererUn("M3-1", graine, {autreQue: janvier, memeSorte: true});
    assert.equal(C.numeroDeSorte(autre), 2, `graine ${graine} : ${autre.texte}`);
    assert.notEqual(autre.texte, janvier.texte);
  }
  const meme = C.genererUn("M3-1", 1, {autreQue: janvier, memeSorte: true});
  const m = P.creerParcours();
  m.modules.M3 = {b: [4], e: ["2026-01-08"]};
  const faux = (pp, c, deuxieme) => P.appliquerRetour(pp, {module: "M3", niveau: 1, juste: false, deuxieme, sorte: C.numeroDeSorte(c)}, {carte, aujourdhui: "2026-01-08"}).parcours;
  const deuxFaux = faux(faux(m, janvier, false), meme, true);
  const [tire] = P.tirerCalculsDuJour(deuxFaux, carte, {aujourdhui: "2026-01-09"});
  assert.equal(tire.sorte, 2);
  assert.equal(C.numeroDeSorte(calculDuJour("2026-01-09", tire.sorte)), 2);
  // Sur toute la carte : le retour suivant d'une sorte numérotée est de cette sorte, ou au moins de la même méthode.
  for (const cle of carte.ordre) {
    const sortes = C.sortesNumerotees(cle);
    sortes.forEach((paire, i) => {
      const c = C.genererUn(cle, 12345, {tour: 3, sorte: i + 1});
      assert.equal(C.sorteDe(c), paire.sorte, `${cle} sorte ${i + 1}`);
    });
  }
});

test("la page : premierLe transmis avec le 2e calcul ; la leçon ouverte notée ; les retrouvés gardés dans l'onglet", () => {
  const noter = corps("noterRetour");
  assert.ok(noter.includes("function noterRetour(serie, calcul, juste, ms, cause, deuxieme = false, premierLe = null) {"));
  assert.ok(noter.includes("premierLe: deuxieme && premierLe ? premierLe : undefined,"));
  assert.ok(PAGE.includes("const mouvement = noterRetour(serie, question.calcul, juste, ms, cause, question.deuxieme, question.premierLe);"));
  assert.ok(PAGE.includes("{calcul: autre, retour: false, deuxieme: true, premierLe: mouvement.premierLe || jourCourant()}"), "le 2e calcul posé après un faux");
  assert.ok(PAGE.includes("tire.second ? {deuxieme: true, premierLe: tire.premierLe || aujourdhui} : {}"), "le 2e calcul repris après un rechargement");
  const lecon = corps("lancerApprends");
  assert.ok(/if \(!MODE_PROF && !revoir && !toute\) \{\n\s+const avant = parcours;\n\s+parcours = PARCOURS\.noterLeconCommencee\(parcours, \{module: id, niveau: n\}, \{aujourdhui: jourCourant\(\)\}\);/.test(lecon));
  assert.ok(lecon.indexOf("noterLeconCommencee") < lecon.indexOf("state.serie = toute"), "avant « On te montre »");
  assert.ok(lecon.includes("sauverParcours();"));
  assert.ok(PAGE.includes('const CLE_RETROUVES = "mathsgo-defi-calcul-retrouves";'));
  const gardes = corps("retrouvesGardes");
  assert.ok(gardes.includes("if (!lu || lu.code !== codeSuivi || !s.i || lu.jour !== s.jour || lu.i !== s.i) return {justes: 0, total: 0};"), "seulement la même séance du moteur, le même code");
  assert.ok(corps("garderRetrouves").includes("stockageSession().setItem(CLE_RETROUVES"));
  assert.ok(corps("nouvelleSeance").includes("retrouves: retrouvesGardes()"));
  assert.ok(/r\.total \+= 1;\s*if \(!m\.rate\) r\.justes \+= 1;\s*garderRetrouves\(r\);/.test(noter));
});
