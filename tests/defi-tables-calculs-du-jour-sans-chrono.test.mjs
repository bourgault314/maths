// Lot « Mes calculs du jour sans chrono » (04/11/2026, décisions de Gwenaël).
//
// Le défaut : Mes calculs du jour avait UN chrono pour la série (6 s par
// calcul, 1 min pour 10). Un élève qui bloquait 20 s sur le premier calcul
// n'avait plus le temps de faire les autres.
// La règle : plus de chrono sur la série ; chaque calcul est mesuré, sans
// rien montrer pendant qu'il cherche. Juste en 6 secondes ou moins : comme
// avant (il monte s'il est dû). Juste en plus de 6 secondes : « Juste, mais
// un peu lent : il reviendra demain. » — la boîte ne bouge pas, le calcul
// revient demain. Faux : comme avant.
// Et la Légende des tables qui a plus de 10 calculs dus retrouve « Encore une
// séance » sur son accueil, comme les autres élèves.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PARCOURS, html, fauxStockage} from "./defi-tables-faux-monde.mjs";

const P = PARCOURS;
const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url), "utf8");
const J = "2026-11-04";
const DEMAIN = "2026-11-05";

const fait = champs => P.normaliserParcours({calculs: {"7-8": champs}});
const calcul = parcours => parcours.calculs["7-8"];
const repondre = (etat, reponse, date = J) => P.appliquerReponse(etat, "7-8", {date, ...reponse});

// ---------------------------------------------------------------- le seuil

test("le seuil : plus de 6 secondes = lent ; 6 secondes pile, ou moins, non ; un temps illisible n'est jamais lent", () => {
  assert.equal(P.SEUILS.revision.lentApres, 6);
  assert.deepEqual([0.4, 3, 6, 6.01, 20].map(P.reponseLente), [false, false, false, true, true]);
  assert.deepEqual([NaN, undefined, null, "abc"].map(P.reponseLente), [false, false, false, false]);
  assert.equal(P.dureeMesCalculs, undefined, "plus de durée pour la série");
  assert.equal(P.SEUILS.revision.secondesParCalcul, undefined);
  assert.equal(P.SEUILS.revision.dureeMin, undefined);
});

// ---------------------------------------------------------------- le moteur

test("juste mais lent, sur un calcul dû : la boîte ne bouge pas, il revient demain (pas aujourd'hui)", () => {
  const avant = fait({boite: 3, vu: "2026-11-01", erreur: null, gagne: "2026-11-01", echeance: J});
  const {parcours, fait: f} = repondre(avant, {correcte: true, lent: true});
  assert.deepEqual(calcul(parcours), {boite: 3, cases: 2, vu: J, erreur: null, gagne: "2026-11-01", echeance: DEMAIN});
  assert.deepEqual([f.monte, f.descend, f.lent, f.du], [false, false, true, true]);
  assert.equal(P.faitDu(calcul(parcours), J), false, "plus dû aujourd'hui : une 2e séance ne le repose pas");
  assert.equal(P.faitDu(calcul(parcours), DEMAIN), true, "dû demain");
  // Le même, juste et rapide : il monte (rien ne change pour lui).
  const vite = repondre(avant, {correcte: true}).parcours;
  assert.equal(calcul(vite).boite, 4);
  assert.equal(calcul(vite).echeance, "2026-11-11");
});

test("juste mais lent, sur un calcul pas dû (le complément du jour) : il revient demain au lieu de dans 14 jours", () => {
  const avant = fait({boite: 5, vu: "2026-10-28", erreur: null, gagne: "2026-10-28", echeance: "2026-11-11"});
  const {parcours, fait: f} = repondre(avant, {correcte: true, lent: true});
  assert.deepEqual(calcul(parcours), {boite: 5, cases: 3, vu: J, erreur: null, gagne: "2026-10-28", echeance: DEMAIN});
  assert.deepEqual([f.monte, f.descend, f.lent], [false, false, true]);
});

test("« lent » ne vaut que pour une réponse juste : faux reste faux (une boîte de moins, dû aujourd'hui)", () => {
  const avant = fait({boite: 3, vu: "2026-11-01", erreur: null, gagne: "2026-11-01", echeance: J});
  const {parcours, fait: f} = repondre(avant, {correcte: false, lent: true});
  assert.deepEqual([calcul(parcours).boite, calcul(parcours).erreur, calcul(parcours).echeance], [2, J, J]);
  assert.equal(f.lent, undefined, "pas de marque « lent » sur une erreur");
  assert.equal(f.descend, true);
});

test("raté puis juste mais lent le même jour : l'erreur reste, rien ne remonte", () => {
  let p = fait({boite: 3, vu: "2026-11-01", erreur: null, gagne: "2026-11-01", echeance: J});
  p = repondre(p, {correcte: false}).parcours;
  p = repondre(p, {correcte: true, lent: true}).parcours;
  assert.deepEqual([calcul(p).boite, calcul(p).erreur], [2, J]);
  assert.equal(P.faitDu(calcul(p), J), false);
  assert.equal(P.faitDu(calcul(p), DEMAIN), true);
});

test("le lendemain, juste et rapide : le calcul monte enfin", () => {
  let p = fait({boite: 3, vu: "2026-11-01", erreur: null, gagne: "2026-11-01", echeance: J});
  p = repondre(p, {correcte: true, lent: true}).parcours;
  const {parcours, fait: f} = repondre(p, {correcte: true}, DEMAIN);
  assert.deepEqual([calcul(parcours).boite, f.monte], [4, true]);
});

test("Mes calculs du jour, 2e séance du jour : un calcul lent n'est pas reposé, un calcul raté non plus", () => {
  const p0 = P.normaliserParcours({
    tables: {7: {acquise: "2026-10-20"}, 8: {acquise: "2026-10-20"}},
    calculs: Object.fromEntries(["7-8", "7-7", "8-8"].map(cle => [cle, {boite: 2, vu: "2026-11-01", erreur: null, gagne: "2026-11-01", echeance: J}]))
  });
  let p = P.appliquerReponse(p0, "7-8", {correcte: true, lent: true, date: J}).parcours;
  p = P.appliquerReponse(p, "7-7", {correcte: false, date: J}).parcours;
  p = P.appliquerReponse(p, "8-8", {correcte: true, date: J}).parcours;
  p = {...p, calculsDuJour: J};
  assert.deepEqual(P.serieDuJour(p, {aujourdhui: J}).cles, [], "rien à refaire aujourd'hui");
  assert.deepEqual(P.dusDuJour(p, DEMAIN).sort(), ["7-7", "7-8"], "demain : le raté et le lent");
});

// ---------------------------------------------------- la file des réponses

test("la file des réponses sous un code : 0 faux, 1 juste, 2 juste mais lent — gardé par la normalisation", () => {
  const stockage = fauxStockage();
  const code = "ABCD-EFGH";
  P.noterReponse(stockage, code, "7-8", {correcte: true, lent: true, date: J, epoque: 0});
  P.noterReponse(stockage, code, "7-7", {correcte: true, date: J, epoque: 0});
  P.noterReponse(stockage, code, "8-8", {correcte: false, lent: true, date: J, epoque: 0});
  const file = P.chargerReponses(stockage, code);
  assert.deepEqual(file.liste.map(entree => [entree[1], entree[3]]), [["7-8", 2], ["7-7", 1], ["8-8", 0]]);
  // Une valeur inconnue reste lue comme avant : juste.
  assert.deepEqual(P.normaliserReponses({dernier: 2, liste: [[1, "7-8", J, 2], [2, "7-7", J, 5]]}).liste.map(e => e[3]), [2, 1]);
});

test("rebaser rejoue une réponse lente comme lente : la boîte du serveur ne monte pas", () => {
  const serveur = fait({boite: 3, vu: "2026-11-01", erreur: null, gagne: "2026-11-01", echeance: J});
  const local = repondre(serveur, {correcte: true, lent: true}).parcours;
  const rejoue = P.rebaser(local, serveur, [[1, "7-8", J, 2]]);
  assert.deepEqual([calcul(rejoue).boite, calcul(rejoue).echeance], [3, DEMAIN]);
  const commeJuste = P.rebaser(local, serveur, [[1, "7-8", J, 1]]);
  assert.equal(calcul(commeJuste).boite, 4, "la même réponse notée juste aurait fait monter");
});

test("fusion : la copie d'avant la réponse lente (vue un autre jour) ne la défait pas", () => {
  const avant = fait({boite: 3, vu: "2026-11-01", erreur: null, gagne: "2026-11-01", echeance: J});
  const apres = repondre(avant, {correcte: true, lent: true}).parcours;
  assert.deepEqual(calcul(P.fusionner(avant, apres)), calcul(apres));
  assert.deepEqual(calcul(P.fusionner(apres, avant)), calcul(apres));
});

test("la séance : l'étape Mes calculs du jour n'a plus de durée", () => {
  const p = P.normaliserParcours({
    tables: {2: {acquise: "2026-10-20"}},
    calculs: Object.fromEntries(["2-2", "2-3", "2-4"].map(cle => [cle, {boite: 2, vu: "2026-11-01", erreur: null, gagne: "2026-11-01", echeance: J}])),
    jours: ["2026-11-01"]
  });
  const seance = P.ouvrirSeance(p, {table: 3, aujourdhui: J});
  const etape = P.etapeDeSeance(p, seance, J);
  assert.deepEqual([etape.type, etape.calculs, "duree" in etape], ["revision", 3, false]);
});

test("la copie du moteur servie à la page prof est identique", () => {
  assert.equal(copie, moteur);
});

// ------------------------------------------------------------------ la page

test("la page : plus de chrono sur Mes calculs du jour, le temps de chaque calcul part à son affichage", () => {
  assert.match(html, /DURATION = null;\s+state\.pauseA = null;\s+state\.revisionLents = 0;/);
  assert.match(html, /mesCalculs: table === null\}/);
  assert.match(html, /state\.questionAfficheeA = horlogeSerie\(\);/);
  assert.match(html, /const lent = Boolean\(state\.configuration\.mesCalculs && correct && !skip && !question\.retry\s*&& PARCOURS\.reponseLente\(\(horlogeSerie\(\) - \(state\.questionAfficheeA \|\| 0\)\) \/ 1000\)\);/);
  assert.match(html, /alimenterMesCalculs\(question, correct && !skip, lent\);/);
  assert.match(html, /PARCOURS\.appliquerReponse\(parcours, question\.factKey, \{correcte, lent\}\);/);
  assert.match(html, /PARCOURS\.noterReponse\(storage\(\), codeSuivi, resultat\.fait\.cle, \{correcte, lent, date: fait && fait\.vu, epoque: resultat\.parcours\.epoque\}\);/);
  // Le chrono de l'en-tête est caché (pas même « À ton rythme »), et remis
  // pour toute autre série, l'évaluation de classe comprise.
  assert.match(html, /\$\("time"\)\.style\.visibility = state\.configuration\.mesCalculs \? "hidden" : "";/);
  assert.match(html, /\$\("time"\)\.style\.removeProperty\("--reste"\);\s*\$\("time"\)\.style\.visibility = "";/);
});

test("les textes choisis : la phrase après la réponse, le score, la liste, l'écran de lancement, la notice", () => {
  assert.match(html, /feedback\.textContent = lente \? "⏱ Juste, mais un peu lent\\u00a0: il reviendra demain\."/);
  assert.match(html, /\.answer-feedback\.is-lent \{ color: #8a4b00; background: #fff1d6; \}/);
  assert.match(html, /\$\("result-score"\)\.textContent = soude\(`\$\{score\} sur \$\{total\}\$\{lents \? ` · \$\{lents\} un peu lent\$\{lents > 1 \? "s" : ""\} ⏱` : ""\}`\);/);
  assert.match(html, /titre\.textContent = lents\.length > 1 \? `⏱ Mes \$\{lents\.length\} calculs un peu lents` : "⏱ Mon calcul un peu lent";/);
  assert.match(html, /puces\.className = "correction-chips lents";/);
  assert.match(html, /regle\.append\(document\.createTextNode\("Réponds vite\\u00a0: juste "\), vite, document\.createTextNode\(", un calcul revient plus tard\."\)\);/);
  assert.match(html, /Juste en 6&nbsp;secondes ou moins, un calcul revient plus tard\. Lent ou raté, il revient demain\./);
  assert.doesNotMatch(html, /en 1&nbsp;minute\. Réussi/);
  assert.doesNotMatch(html, /Temps écoulé" : "Mes calculs du jour : fait/);
});

test("la Légende des tables : séance faite et calculs encore dus → « Séance du jour faite » et « Encore une séance » ; plus rien de dû → la course (qui reste dessous)", () => {
  assert.match(html, /const resteDesCalculs = faite && programme\.etapes\.some\(etape => etape\.type === "revision"\);/);
  assert.match(html, /if \(resteDesCalculs\) action\.append\(carteSeanceFaite\(null\)\);\s*\/\/ Séance du jour faite \(planche R1, 4e écran\) : un seul bouton\./, "la course reste dessous");
});

test("le moteur du jour est chargé (cache-buster bumpé)", () => {
  assert.match(html, /<script src="\.\/defi_tables_mon_parcours\.js\?v=20261111-3"><\/script>/);
});

// ------------------------------- correctif après la relecture de Codex (04/11)

const sourcePage = nom => {
  const debut = html.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `function ${nom} introuvable`);
  const fin = html.indexOf("\n      }\n", debut);
  return html.slice(debut, fin + 9);
};

// Un petit monde : une horloge qu'on avance, une page visible ou cachée, de
// fausses minuteries — et les vraies fonctions de la page.
function monde() {
  const m = {maintenant: 1000, cachee: false, minuteurs: new Map(), prochain: 1, avances: 0, chronos: 0};
  const document = {get visibilityState() { return m.cachee ? "hidden" : "visible"; }};
  const window = {
    setTimeout: (f, d) => { const id = m.prochain++; m.minuteurs.set(id, {f, d}); return id; },
    clearTimeout: id => { m.minuteurs.delete(id); },
    setInterval: () => 99, clearInterval: () => {}
  };
  const state = {running: true, waitingForContinue: false, autoAdvanceTimer: null, avancePrevue: null, cacheeA: null, questionAfficheeA: null, timer: null, decompte: null, decompteCoupe: false, configuration: {mode: "revision", mesCalculs: true, duration: null}};
  const corps = `
    const DELAI_SUIVANT = 800;
    const horlogeSerie = () => m.maintenant;
    const advanceAfterResponse = () => { m.avances += 1; state.waitingForContinue = false; };
    const updateTimer = () => {}; const enEvaluation = () => false; const decompter = () => {};
    const clearLearnStickHelpTimer = () => {};
    const $ = () => ({hidden: false});
    ${sourcePage("clearAutoAdvance")}
    ${sourcePage("scheduleAutoAdvance")}
    ${sourcePage("stopTimer")}
    ${sourcePage("noterVisibilite")}
    ${sourcePage("reprendreAuRetour")}
    return {scheduleAutoAdvance, stopTimer, noterVisibilite, reprendreAuRetour};`;
  const f = new Function("m", "state", "document", "window", corps)(m, state, document, window);
  const tourner = () => { const liste = [...m.minuteurs.values()]; m.minuteurs.clear(); liste.forEach(x => x.f()); };
  return {m, state, f, tourner};
}

test("Codex 4 · page quittée pendant « Juste, mais un peu lent… » puis rendue par « Précédent » : le calcul suivant arrive quand même", () => {
  const {m, state, f, tourner} = monde();
  state.waitingForContinue = true;
  f.scheduleAutoAdvance(1800);
  f.stopTimer();                       // pagehide : le minuteur part
  assert.equal(m.minuteurs.size, 0);
  assert.equal(state.avancePrevue, 1800, "le délai prévu est gardé");
  f.reprendreAuRetour();               // pageshow
  assert.equal(m.minuteurs.size, 1, "le passage automatique est réarmé");
  assert.equal([...m.minuteurs.values()][0].d, 1800);
  tourner();
  assert.equal(m.avances, 1, "le calcul suivant arrive, une seule fois");
  // Rien d'attendu (correction d'une erreur, « Suivant » à toucher) : rien ne part tout seul.
  const autre = monde();
  autre.state.waitingForContinue = true;
  autre.f.reprendreAuRetour();
  assert.equal(autre.m.minuteurs.size, 0);
});

test("Codex 6 · le temps d'un calcul ne compte que page visible : 30 s ailleurs ne le rendent pas lent", () => {
  const {m, state, f} = monde();
  state.questionAfficheeA = 1000;      // le calcul s'affiche
  m.maintenant = 3000;                 // 2 s plus tard, l'élève part
  m.cachee = true; f.noterVisibilite();
  m.maintenant = 33000;                // 30 s ailleurs
  m.cachee = false; f.noterVisibilite();
  m.maintenant = 35000;                // il répond 2 s après son retour
  const secondes = (m.maintenant - state.questionAfficheeA) / 1000;
  assert.equal(secondes, 4, "2 s avant + 2 s après, rien pendant");
  assert.equal(P.reponseLente(secondes), false);
  assert.equal(state.cacheeA, null);
});

test("Codex 6 · un calcul affiché pendant que l'élève est ailleurs part à son retour ; et 7 s visibles restent lentes", () => {
  const {m, state, f} = monde();
  m.cachee = true; f.noterVisibilite(); // parti à 1000
  m.maintenant = 1500;
  state.questionAfficheeA = 1500;       // le passage automatique affiche le calcul suivant
  m.maintenant = 20000;
  m.cachee = false; f.noterVisibilite();
  assert.equal(state.questionAfficheeA, 20000, "il part au retour");
  m.maintenant = 27000;
  assert.equal(P.reponseLente((m.maintenant - state.questionAfficheeA) / 1000), true, "7 s visibles : lent");
  // La page rendue par « Précédent » fait le même calcul (reprendreAuRetour).
  assert.match(sourcePage("reprendreAuRetour"), /noterVisibilite\(\);/);
  assert.match(html, /document\.addEventListener\("visibilitychange", noterVisibilite\);/);
  assert.match(html, /state\.questionAfficheeA = horlogeSerie\(\);\s*if \(typeof document !== "undefined" && document\.visibilityState === "hidden"\) state\.cacheeA = state\.questionAfficheeA;/);
});

test("Codex 7 · les textes disent « en 6 secondes ou moins » (6 s pile n'est pas lent)", () => {
  assert.equal(P.reponseLente(6), false);
  assert.match(html, /vite\.textContent = `en \$\{PARCOURS\.SEUILS\.revision\.lentApres\}\\u00a0secondes ou moins`;/);
  assert.match(html, /Juste en 6&nbsp;secondes ou moins, un calcul revient plus tard\./);
  assert.doesNotMatch(html, /en moins de 6&nbsp;secondes|en moins de \$\{PARCOURS/);
});

test("Entrée lance la série depuis l'écran « C'est parti ! » — pas quand un autre bouton a la main, pas gardée enfoncée, et la même touche ne valide pas la 1re question", () => {
  const essai = ({running = false, launchReady = true, cache = false, garde = false, repeat = false, surBouton = false, key = "Enter"} = {}) => {
    const appels = {lance: 0, empeche: 0, arrete: 0};
    const state = {running, launchReady};
    const $ = () => ({hidden: cache});
    const f = new Function("state", "gardeVisible", "$", "beginRound", `${sourcePage("lancerAuClavier")}\nreturn lancerAuClavier;`)(
      state, garde, $, () => { appels.lance += 1; state.running = true; });
    f({key, repeat, target: {closest: () => (surBouton ? {} : null)}, preventDefault() { appels.empeche += 1; }, stopImmediatePropagation() { appels.arrete += 1; }});
    return appels;
  };
  assert.deepEqual(essai(), {lance: 1, empeche: 1, arrete: 1}, "Entrée lance, et la touche s'arrête là");
  for (const cas of [{repeat: true}, {surBouton: true}, {running: true}, {launchReady: false}, {cache: true}, {garde: true}, {key: "7"}]) {
    assert.deepEqual(essai(cas), {lance: 0, empeche: 0, arrete: 0}, JSON.stringify(cas));
  }
  const ici = html.indexOf('document.addEventListener("keydown", lancerAuClavier);');
  const serie = html.indexOf('document.addEventListener("keydown", event => {\n        if (!state.running) return;');
  assert.ok(ici > 0 && serie > ici, "posé avant le gestionnaire de la série");
});
