// Défi tables — lot « les règles des records » (11/10/2026). Décisions de
// Gwenaël, après discussion et planches 1 à 7 :
//  1. dans la course des records, une erreur ne fait plus perdre la course :
//     la question reste, en rouge (« Pas tout à fait, essaie encore. »), la
//     case se vide, le chrono continue — la course finit toujours à 25 justes ;
//  2. à la 3e erreur sur le même calcul, la course s'arrête (décision du
//     11/10 après la PR #969, planches 8 à 10) : « Course arrêtée », « 3
//     erreurs sur 10 × 7 = 70 », le temps ne compte pas ;
//  3. plus de « Passer » dans la course ;
//  4. la ligne de lancement : « Le chrono monte. Une erreur : la question
//     reste. Trois sur le même calcul : la course s'arrête. » ;
//  5. la liste « Mes erreurs » du résultat garde les calculs ratés au premier
//     essai (la première réponse est celle qu'on garde, la grille Mes calculs
//     aussi) ;
//  6. un décompte 3, 2, 1 (0,8 s chacun) avant la course ET les marches de
//     l'escalier (étoiles, couronne) — la question cachée, le pavé grisé, le
//     chrono part avec la première question. Pas ailleurs (test d'une table,
//     Mon mélange, Mes calculs du jour).
// Les étoiles et la couronne ne changent pas de règle : une erreur y compte,
// la question ne revient pas. Le moteur et le serveur ne changent pas.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }", debut) + "\n      }".length;
  return html.slice(debut, fin);
}
const constante = nom => Number(html.match(new RegExp(`const ${nom} = (\\d+);`))[1]);

// Une Légende (couronne gagnée) et un élève aux 9 tables sans étoile.
function legende() {
  const p = P.creerParcours();
  P.TABLES.forEach(table => { p.tables[table].acquise = "2026-10-01"; });
  p.expert = {etoiles: 5, dernier: "2026-10-08", couronne: "2026-10-08"};
  return P.normaliserParcours(p);
}
function neufTables() {
  const p = legende();
  p.expert = {etoiles: 0, dernier: null, couronne: null};
  return P.normaliserParcours(p);
}

// ------------------------------------------------------------------ 1. la réponse

// Le vrai traitement d'une réponse (next), joué avec un faux écran.
function fauxEcran() {
  const el = () => ({textContent: "", className: "", style: {}, focus() {}, classList: {add() {}, remove() {}, contains: () => false}});
  const elements = {"answer-feedback": el(), expression: el(), validate: el(), time: el(), skip: el(), "inline-answer": el()};
  return {elements, $: id => elements[id] || (elements[id] = el())};
}
function joueur(state) {
  const ecran = fauxEcran();
  const appels = {grille: [], avance: 0, retenu: [], fin: 0};
  const fabrique = new Function("state", "$", "appels", `
    const ERREURS_AVANT_ARRET = ${constante("ERREURS_AVANT_ARRET")};
    const DELAI_LECTURE_CORRECTION_MS = 0;
    const CORE = {solvedPrompt: question => question.prompt.replace("?", String(question.answer))};
    const finish = () => { appels.fin += 1; state.running = false; };
    // Lot E2 : la série de l'évaluation en classe passe ailleurs (nextEvaluation).
    const enEvaluation = () => false;
    const showAnswerError = () => { appels.retenu.push("erreur de saisie"); };
    const alimenterMesCalculs = (question, correcte) => { appels.grille.push([question.factKey, correcte]); };
    const renderInlineAnswer = () => {};
    const showAnswerFeedback = () => {};
    const scheduleAutoAdvance = () => {};
    // advanceAfterResponse → renderQuestion, qui remet le compte des essais à zéro.
    const advanceAfterResponse = () => { appels.avance += 1; state.index += 1; state.essaisCourse = 0; };
    ${source("essaieEncoreCourse")}
    ${source("arreterCourse")}
    ${source("next")}
    return next;
  `);
  const next = fabrique(state, ecran.$, appels);
  const taper = valeur => { state.answer = String(valeur); next(false); };
  return {taper, next, appels, retour: () => ecran.elements["answer-feedback"]};
}
const Q = (a, b) => ({answer: a * b, factKey: `${Math.min(a, b)}-${Math.max(a, b)}`, prompt: `${a} × ${b} = ?`});
function etatCourse(configuration = {mode: "test", course: "records", total: 25}) {
  const questions = [Q(10, 7), Q(6, 8), Q(9, 9)];
  return {running: true, waitingForContinue: false, answer: "", questions, index: 0, responses: [], correct: 0, answered: 0, configuration, essaisCourse: 0};
}

test("course : une erreur — la même question reste, la case se vide, « Pas tout à fait, essaie encore. »", () => {
  const state = etatCourse();
  const {taper, appels, retour} = joueur(state);
  taper(71);
  assert.equal(state.index, 0, "la question reste");
  assert.equal(appels.avance, 0, "on n'avance pas");
  assert.equal(state.answer, "", "la case se vide");
  assert.equal(retour().className, "answer-feedback is-wrong");
  assert.equal(retour().textContent, "Pas tout à fait, essaie encore.");
  assert.deepEqual(state.responses[0], {value: 71, correct: false, skipped: false}, "la première réponse est gardée");
  assert.equal(state.correct, 0);
});

test("course : à la 3e erreur sur le même calcul, la course s'arrête — le calcul et sa réponse sont gardés", () => {
  assert.equal(constante("ERREURS_AVANT_ARRET"), 3);
  const state = etatCourse();
  const {taper, appels, retour} = joueur(state);
  taper(71);
  taper(72);
  assert.equal(retour().textContent, "Pas tout à fait, essaie encore.", "2e erreur : la question reste encore");
  assert.equal(appels.fin, 0);
  taper(73);
  assert.equal(appels.fin, 1, "3e erreur : la course s'arrête (finish)");
  assert.equal(appels.avance, 0, "on n'avance pas à la question suivante");
  assert.equal(state.courseArretee, "10 × 7 = 70", "le calcul et sa réponse, pour le verdict");
  assert.ok(state.correct < 25, "pas 25 justes : le temps ne compte pas");
  assert.deepEqual(state.responses[0], {value: 71, correct: false, skipped: false}, "« Mes erreurs » garde la première réponse (71)");
  assert.equal(state.answered, 1, "une question répondue, pas trois");
});

test("course : deux erreurs sur un calcul, puis la bonne réponse — le compte repart à zéro à la question suivante", () => {
  const state = etatCourse();
  const {taper, appels} = joueur(state);
  taper(71); taper(72); taper(70);
  assert.equal(state.index, 1, "trouvé au 3e essai : la course continue");
  assert.equal(state.correct, 1);
  taper(47); taper(46);
  assert.equal(appels.fin, 0, "deux erreurs sur 6 × 8 : pas d'arrêt (les deux de 10 × 7 ne comptent plus)");
  taper(48);
  assert.equal(state.index, 2);
});

test("course : la grille Mes calculs ne reçoit que la PREMIÈRE réponse de chaque calcul", () => {
  const state = etatCourse();
  const {taper, appels} = joueur(state);
  taper(71); taper(72); taper(70);
  taper(48);
  taper(81);
  assert.deepEqual(appels.grille, [["7-10", false], ["6-8", true], ["9-9", true]]);
});

test("course : 25 questions, des erreurs corrigées — 25 justes, le temps compte ; « Mes erreurs » compte les ratés au premier essai", () => {
  const questions = Array.from({length: 25}, (_, i) => Q(2 + (i % 9), 3 + (i % 7)));
  const state = {...etatCourse(), questions};
  const {taper} = joueur(state);
  questions.forEach((question, i) => {
    if (i === 6 || i === 14) taper(question.answer + 1);
    if (i === 20) { taper(question.answer + 1); taper(question.answer + 2); }
    taper(question.answer);
  });
  assert.equal(state.index, 25);
  assert.equal(state.correct, 25);
  assert.equal(state.responses.filter(r => !r.correct).length, 3, "trois calculs ratés au premier essai");
  assert.deepEqual(P.courseCompte(state.correct, 25, 534), {compte: true, raison: null}, "le temps compte");
});

test("étoile et couronne : rien ne change — une erreur compte, la question suivante arrive", () => {
  for (const duration of [120, 60]) {
    const state = etatCourse({mode: "test", total: 25, duration, course: null});
    const {taper, appels, retour} = joueur(state);
    taper(71);
    assert.equal(appels.avance, 1, `marche de ${duration} s : on avance`);
    assert.equal(retour().textContent, "", "aucun message");
    assert.equal(state.correct, 0);
    assert.deepEqual(state.responses[0], {value: 71, correct: false, skipped: false});
  }
});

test("la page : la course pose « no-skip » (plus de Passer) ; le compte des essais repart à chaque question", () => {
  assert.match(source("renderLearnSequence"), /\$\("question-card"\)\.classList\.toggle\("no-skip", visible \|\| state\.configuration\?\.course === "records"\);/);
  assert.match(source("renderQuestion"), /const question = state\.questions\[state\.index\];\s*state\.essaisCourse = 0;/);
  assert.match(html, /\.question\.no-skip #skip \{ display: none; \}/);
});

test("la page : la course arrêtée — « Course arrêtée », « 3 erreurs sur 10 × 7 = 70 », en rouge ; plus de réponse donnée", () => {
  const verdict = source("verdictCourse");
  assert.match(verdict, /if \(state\.courseArretee\) \{\s*verdict\.classe = "is-rate";\s*verdict\.icone = "✗";\s*verdict\.titre = "Course arrêtée";\s*verdict\.score = `\$\{ERREURS_AVANT_ARRET\} erreurs sur \$\{state\.courseArretee\}`;\s*return verdict;\s*\}/);
  assert.ok(verdict.indexOf("state.courseArretee") < verdict.indexOf("if (!jugement.compte)"), "avant le verdict « le temps ne compte pas »");
  assert.doesNotMatch(html, /tape-la/);
  assert.equal(html.split("state.courseArretee = null;").length - 1, 3, "remis à zéro à chaque série (start, Mes calculs du jour, et l'évaluation en classe du lot E2)");
});

test("la page : la ligne de lancement de la course (planches 1 et 8)", () => {
  assert.match(html, /gras\.textContent = "la question reste";\s*ligne\.append\(document\.createTextNode\("Le chrono monte\. Une erreur\\u00a0: "\), gras, document\.createTextNode\("\. Trois sur le même calcul\\u00a0: la course s’arrête\."\)\);/);
  assert.doesNotMatch(html, /gras\.textContent = "Tout juste";/);
});

// ------------------------------------------------------------------ 2. le décompte

// « ticket » (lot « correctifs de l'audit Codex », 29/10/2026) : null = la
// série n'a pas de ticket de course (une étoile ordinaire, ou pas de code) ;
// sinon {promesse} — ce que demanderTicketDeCourse() rendrait.
function banc(parcours, configuration, duree, ticket = null) {
  const ecran = fauxEcran();
  const montre = {maintenant: 1000, minuteries: []};
  const fenetre = {
    setTimeout(f, ms) { const m = {f, quand: montre.maintenant + ms, id: montre.minuteries.length + 1}; montre.minuteries.push(m); return m.id; },
    clearTimeout(id) { montre.minuteries = montre.minuteries.filter(m => m.id !== id); },
    setInterval() { return 99; },
    clearInterval() {}
  };
  const touches = [{disabled: false}, {disabled: false}];
  const document = {createElement: () => ({className: "", textContent: ""}), querySelectorAll: () => touches};
  const journal = [];
  const state = {configuration, running: false, launchReady: true, decompte: null, timer: null};
  ecran.elements.expression.replaceChildren = (...n) => { ecran.elements.expression.enfants = n; };
  ecran.elements.time.setAttribute = () => {};
  ecran.elements.time.classList = {add() {}, remove() {}, toggle() {}};
  const fabrique = new Function("state", "$", "window", "document", "Date", "PARCOURS", "parcours", "DURATION", "TOTAL", "journal", "ticket", `
    const formatTime = s => "0:" + String(s).padStart(2, "0");
    const courseAvecTicket = () => ticket !== null;
    const demanderTicketDeCourse = () => { journal.push("ticket demandé"); return ticket.promesse; };
    const renderFilSeance = () => {};
    const majSortieJeu = () => {};
    const show = ecran => journal.push("show " + ecran);
    const renderQuestion = () => { journal.push("question"); touches.forEach(t => { t.disabled = false; }); };
    const ajusterEchelle = () => {};
    const renderLearnSequence = () => {};
    const updateTimer = () => {};
    const clearAutoAdvance = () => {};
    const clearLearnStickHelpTimer = () => {};
    const touches = document.querySelectorAll();
    const quitterSerie = () => { journal.push("quitter"); state.running = false; stopTimer(); };
    ${source("beginRound")}
    ${source("partirQuandLeTicketEstLa")}
    ${source("horlogeSerie")}
    ${source("partir")}
    const DECOMPTE_MS = ${constante("DECOMPTE_MS")};
    ${source("avecDecompte")}
    ${source("decompter")}
    ${source("stopTimer")}
    ${source("returnToMenu")}
    ${source("noterDecompteCoupe")}
    ${source("reprendreAuRetour")}
    return {beginRound, returnToMenu, stopTimer, noterDecompteCoupe, reprendreAuRetour};
  `);
  const fonctions = fabrique(state, ecran.$, fenetre, document, {now: () => montre.maintenant}, P, parcours, duree, 25, journal, ticket);
  const avancer = ms => {
    const fin = montre.maintenant + ms;
    for (;;) {
      const prochaine = montre.minuteries.filter(m => m.quand <= fin).sort((a, b) => a.quand - b.quand)[0];
      if (!prochaine) break;
      montre.minuteries = montre.minuteries.filter(m => m !== prochaine);
      montre.maintenant = prochaine.quand;
      prochaine.f();
    }
    montre.maintenant = fin;
  };
  const chiffre = () => (ecran.elements.expression.enfants || [{}])[0].textContent;
  return {...fonctions, state, avancer, chiffre, journal, touches, ecran, montre};
}

test("décompte : la course — 3, 2, 1 (0,8 s chacun), question cachée, pavé grisé, puis le chrono part avec la première question", () => {
  assert.equal(constante("DECOMPTE_MS"), 800);
  const b = banc(legende(), P.configCourse(), null);
  b.beginRound();
  assert.equal(b.chiffre(), "3");
  assert.equal(b.state.running, false, "le pavé ne répond pas : la série n'a pas commencé");
  assert.equal(b.state.startAt, undefined, "le chrono n'est pas parti");
  assert.ok(b.touches.every(t => t.disabled), "le pavé grisé");
  assert.equal(b.ecran.elements.validate.disabled, true);
  assert.ok(!b.journal.includes("question"), "la question est cachée");
  b.avancer(799);
  assert.equal(b.chiffre(), "3");
  b.avancer(1);
  assert.equal(b.chiffre(), "2");
  b.avancer(800);
  assert.equal(b.chiffre(), "1");
  b.avancer(799);
  assert.equal(b.state.running, false);
  b.avancer(1);
  assert.equal(b.state.running, true, "la série commence");
  assert.equal(b.state.startAt, 1000 + 2400, "le chrono part 2,4 s après le clic, avec la première question");
  assert.ok(b.journal.includes("question"));
  assert.ok(b.touches.every(t => !t.disabled), "le pavé rallumé");
  assert.equal(b.ecran.elements.validate.disabled, false);
  assert.equal(b.state.decompte, null);
});

test("décompte : les marches de l'escalier aussi (★ et couronne) ; le test d'une table et Mon mélange partent au clic", () => {
  const etoile = banc(neufTables(), P.configEtoile(1), 120);
  etoile.beginRound();
  assert.equal(etoile.chiffre(), "3", "★ : décompte");
  const couronne = banc((() => { const p = neufTables(); p.expert.etoiles = 4; return P.normaliserParcours(p); })(), P.configEtoile(5), 60);
  couronne.beginRound();
  assert.equal(couronne.chiffre(), "3", "couronne : décompte (elle donne le premier record)");
  const test1 = banc(neufTables(), P.configValidation(7), 90);
  test1.beginRound();
  assert.equal(test1.state.running, true, "test d'une table : le chrono part au clic, comme avant");
  assert.equal(test1.chiffre(), undefined);
  const melange = banc(neufTables(), P.configMelange(neufTables()), 90);
  melange.beginRound();
  assert.equal(melange.state.running, true, "Mon mélange : au clic, comme avant");
});

test("décompte : « Ma table » pendant le décompte arrête tout — la série ne démarre pas en douce", () => {
  const b = banc(legende(), P.configCourse(), null);
  b.beginRound();
  b.avancer(900);
  b.returnToMenu();
  assert.deepEqual(b.journal.filter(e => e === "quitter"), ["quitter"]);
  assert.equal(b.state.decompte, null);
  b.avancer(5000);
  assert.equal(b.state.running, false, "aucune minuterie ne relance la série");
  assert.ok(!b.journal.includes("question"));
});

// Correction de Claude Code : pagehide arrête tout (stopTimer). Une page
// rendue par « Précédent » pendant le décompte restait figée sur « 2 », le
// pavé grisé, et « Ma table » ne répondait plus (la série n'était ni lancée
// ni en décompte).
test("décompte : la page quittée pendant le décompte puis rendue (« Précédent ») le reprend à 3", () => {
  assert.match(html, /window\.addEventListener\("pagehide", noterDecompteCoupe\);\s*window\.addEventListener\("pagehide", stopTimer\);/, "le décompte coupé se note AVANT que stopTimer l'efface");
  assert.match(html, /window\.addEventListener\("pageshow", reprendreAuRetour\);/);
  const b = banc(legende(), P.configCourse(), null);
  b.beginRound();
  b.avancer(900);
  assert.equal(b.chiffre(), "2");
  b.noterDecompteCoupe(); b.stopTimer();  // pagehide
  b.avancer(5000);
  assert.equal(b.state.running, false, "page cachée : rien ne part");
  b.reprendreAuRetour();  // pageshow
  assert.equal(b.chiffre(), "3", "le décompte reprend à 3");
  assert.ok(b.touches.every(t => t.disabled), "le pavé toujours grisé");
  b.avancer(2400);
  assert.equal(b.state.running, true, "puis la série part");
  assert.equal(b.journal.filter(e => e === "question").length, 1);
});

test("décompte : après « Ma table », quitter la page puis revenir ne relance rien", () => {
  const b = banc(legende(), P.configCourse(), null);
  b.beginRound();
  b.avancer(900);
  b.returnToMenu();
  b.noterDecompteCoupe(); b.stopTimer();
  b.reprendreAuRetour();
  b.avancer(5000);
  assert.equal(b.state.running, false);
  assert.ok(!b.journal.includes("question"));
});

test("décompte : un second clic sur « C'est parti ! » pendant le décompte ne relance rien", () => {
  const b = banc(legende(), P.configCourse(), null);
  b.beginRound();
  b.beginRound();
  b.avancer(2400);
  assert.equal(b.journal.filter(e => e === "question").length, 1);
});

test("la page : le décompte se dessine dans la case de la question, sans animation si l'élève l'a demandé", () => {
  assert.match(html, /\.expression \.decompte \{\s*color: var\(--blue\);\s*font-size: 1\.35em;\s*line-height: 1;\s*animation: decompte-pop \.8s ease-out both;\s*\}/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{\s*\.expression \.decompte \{ animation: none; \}\s*\}/);
  assert.match(html, /decompte: null,\n/, "l'état de départ le déclare");
});

// ------------------------------------------- le ticket de course (29/10/2026)

test("ticket : sans ticket (étoile ordinaire, pas de code), rien ne change — le chrono part au bout du décompte", () => {
  const b = banc(legende(), P.configCourse(), null);
  b.beginRound();
  assert.ok(!b.journal.includes("ticket demandé"));
  b.avancer(2400);
  assert.equal(b.state.running, true);
});

test("ticket : demandé au « C'est parti ! » ; déjà arrivé à la fin du décompte, le chrono part sans attendre", async () => {
  const b = banc(legende(), P.configCourse(), null, {promesse: Promise.resolve("0123456789abcdef0123456789abcdef")});
  b.beginRound();
  assert.equal(b.journal.filter(e => e === "ticket demandé").length, 1, "une demande, au lancement");
  await Promise.resolve(); // la promesse est tenue avant la fin du décompte
  assert.equal(b.state.ticketCourseValeur, "0123456789abcdef0123456789abcdef");
  b.avancer(2400);
  assert.equal(b.state.running, true, "le chrono part avec la première question");
  assert.equal(b.journal.filter(e => e === "question").length, 1);
});

test("ticket : réseau lent — le « 1 » attend le ticket, puis le chrono part ; refusé (pas de réseau), il part aussi", async () => {
  let tenir;
  const b = banc(legende(), P.configCourse(), null, {promesse: new Promise(r => { tenir = r; })});
  b.beginRound();
  b.avancer(2400);
  assert.equal(b.state.running, false, "le décompte est fini mais le ticket n'est pas là : on attend");
  assert.equal(b.chiffre(), "1", "le « 1 » reste à l'écran");
  tenir("0123456789abcdef0123456789abcdef");
  await Promise.resolve(); await Promise.resolve();
  assert.equal(b.state.running, true, "le ticket arrive : la série part");
  assert.equal(b.journal.filter(e => e === "question").length, 1);
  // Pas de réseau : la promesse rend null, la course part quand même (le
  // verdict dira que le temps ne compte pas — décision de Gwenaël, 29/10).
  let refuser;
  const c = banc(legende(), P.configCourse(), null, {promesse: new Promise(r => { refuser = r; })});
  c.beginRound();
  c.avancer(2400);
  assert.equal(c.state.running, false);
  refuser(null);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(c.state.running, true, "sans ticket, la course se joue quand même");
  assert.equal(c.state.ticketCourseValeur, null);
});

test("ticket : « Ma table » pendant l'attente du ticket arrête tout — la série ne démarre pas quand le ticket arrive", async () => {
  let tenir;
  const b = banc(legende(), P.configCourse(), null, {promesse: new Promise(r => { tenir = r; })});
  b.beginRound();
  b.avancer(2400);
  b.returnToMenu();
  tenir("0123456789abcdef0123456789abcdef");
  await Promise.resolve(); await Promise.resolve();
  assert.equal(b.state.running, false, "quittée : rien ne part");
  assert.ok(!b.journal.includes("question"));
});
