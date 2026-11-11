// Lot « 🏆 Les records » (09/10/2026) — le défi d'après la couronne.
//
// Le moteur : la course (configCourse, classerSerie → « course »), le juge
// (courseCompte : 25 sur 25, un temps humain), l'écriture des temps
// (formatTemps), la course à la place de l'étoile dans la séance d'une
// Légende (etapeDeSeance, option « records »), la case d'envoi (course en
// attente, record connu). La page : les écrans, le chrono qui monte, les
// boutons, la fin de course, l'envoi (faux-monde : serveur qui répond, serveur
// muet, « pas encore Légende », classe fermée). Le serveur et la page prof :
// ce que le dépôt doit porter. Les bornes : les mêmes des deux côtés.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PARCOURS, html, fauxStockage, demarrerAppli, sansPrenom} from "./defi-tables-faux-monde.mjs";

const P = PARCOURS;
const lire = async chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const serveurRecords = await lire("../_serveur/public/lib/records.php");
const apiRecords = await lire("../_serveur/public/api/records.php");
const apiProf = await lire("../_serveur/public/api/prof.php");
const apiEleve = await lire("../_serveur/public/api/eleve.php");
const applis = await lire("../_serveur/public/lib/applis.php");
const bd = await lire("../_serveur/public/lib/bd.php");
const archives = await lire("../_serveur/public/lib/archives.php");
const verifier = await lire("../_serveur/public/verifier.php");
const sauvegarde = await lire("../_serveur/public/sauvegarde.php");
const pageProf = await lire("../_serveur/public/prof/index.php");
const moteurCopie = await lire("../_serveur/public/prof/defi_tables_mon_parcours.js");
const moteur = await lire("../outils/calcul_mental/defi_tables_mon_parcours.js");

const AUJ = "2026-10-09";

// Une Légende : 9 tables passées, couronne gagnée.
function legende() {
  let p = P.creerParcours();
  P.TABLES.forEach(table => { p.tables[table].acquise = "2026-10-01"; });
  p.expert = {etoiles: 5, dernier: "2026-10-08", couronne: "2026-10-08"};
  p.melange.reussi = 9;
  p.calculsDuJour = AUJ;
  return P.normaliserParcours(p);
}
function presqueLegende() {
  const p = legende();
  p.expert = {etoiles: 4, dernier: "2026-10-08", couronne: null};
  return P.normaliserParcours(p);
}

// ------------------------------------------------------------------- le moteur

test("SEUILS.course : 25 questions, aucune erreur (décision du 09/10), 15 s au moins (11/11, audit GPT F04), une heure au plus", () => {
  assert.deepEqual(P.SEUILS.course, {total: 25, erreursMax: 0, dixiemesMin: 150, dixiemesMax: 36000});
});

test("la couronne exige 25 sur 25 ; les quatre étoiles gardent leurs 2 erreurs ; une couronne gagnée avant reste gagnée", () => {
  assert.equal(P.SEUILS.etoile.erreursMaxCouronne, 0);
  assert.equal(P.erreursMaxEtoile(4), 2);
  assert.equal(P.erreursMaxEtoile(5), 0);
  const p = presqueLegende();
  const ratee = P.appliquerSerie(p, P.configEtoile(5), {correct: 24, total: 25, date: AUJ});
  assert.equal(ratee.evenements[0].reussi, false, "24 sur 25 : pas de couronne");
  assert.equal(ratee.parcours.expert.couronne, null);
  const gagnee = P.appliquerSerie(p, P.configEtoile(5), {correct: 25, total: 25, date: AUJ});
  assert.equal(gagnee.evenements[0].couronne, true);
  assert.equal(gagnee.parcours.expert.couronne, AUJ);
  const etoile = P.appliquerSerie({...p, expert: {etoiles: 3, dernier: null, couronne: null}}, P.configEtoile(4), {correct: 23, total: 25, date: AUJ});
  assert.equal(etoile.evenements[0].reussi, true, "★★★★ : 2 erreurs permises");
  assert.equal(P.normaliserParcours(legende()).expert.couronne, "2026-10-08", "rien de rétroactif");
  // La page le dit avant l'épreuve, et compte le seuil juste.
  assert.match(html, /reussir = S\.etoile\.total - PARCOURS\.erreursMaxEtoile\(marche\);/);
  assert.match(html, /" pour réussir\\u00a0: aucune erreur\." : " pour réussir\."/);
  assert.match(html, /if \(evenement\.type === "etoile"\) return evenement\.total - PARCOURS\.erreursMaxEtoile\(evenement\.etoile\);/);
});

test("configCourse : les 25 questions de la couronne, sans limite de temps, marquée « records »", () => {
  const config = P.configCourse();
  assert.deepEqual(config, {mode: "test", tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], testLevel: 3, total: 25, duration: null, course: "records"});
});

test("classerSerie : la course d'une Légende est une « course » ; pour un autre élève, elle ne compte pas ; une étoile reste une étoile", () => {
  assert.deepEqual(P.classerSerie(legende(), P.configCourse()), {type: "course"});
  assert.equal(P.classerSerie(presqueLegende(), P.configCourse()), null, "pas Légende : rien");
  assert.equal(P.classerSerie(legende(), {...P.configCourse(), total: 20}), null, "pas 25 questions : rien");
  assert.equal(P.classerSerie(legende(), {...P.configCourse(), tables: [2, 3]}), null, "pas toutes les tables : rien");
  assert.deepEqual(P.classerSerie(legende(), P.configEtoile(5)), {type: "etoile", etoile: 5}, "la couronne se rejoue comme avant");
  assert.equal(P.recordsPossibles(legende()), true);
  assert.equal(P.recordsPossibles(presqueLegende()), false);
  assert.equal(P.recordsPossibles(null), false);
});

test("appliquerSerie : une course ne change RIEN au parcours — l'événement dit seulement si c'est 25 sur 25", () => {
  const avant = legende();
  const r = P.appliquerSerie(avant, P.configCourse(), {correct: 25, total: 25, date: AUJ});
  assert.deepEqual(r.evenements, [{type: "course", reussi: true, score: 25, total: 25}]);
  assert.deepEqual(r.parcours, avant, "rien n'entre dans le parcours : le classement vit sur le serveur");
  const rate = P.appliquerSerie(avant, P.configCourse(), {correct: 24, total: 25, date: AUJ});
  assert.equal(rate.evenements[0].reussi, false, "une erreur : pas réussie");
  assert.deepEqual(rate.parcours, avant);
});

test("courseCompte : 25 sur 25 et un temps humain, sinon la raison", () => {
  assert.deepEqual(P.courseCompte(25, 25, 498), {compte: true, raison: null});
  assert.deepEqual(P.courseCompte(25, 25, 150), {compte: true, raison: null}, "15,0 s : juste au seuil, ça compte");
  assert.deepEqual(P.courseCompte(24, 25, 498), {compte: false, raison: "erreurs"});
  assert.deepEqual(P.courseCompte(25, 25, 149), {compte: false, raison: "rapide"}, "14,9 s : pas un élève (plancher remonté le 11/11, audit GPT F04)");
  assert.deepEqual(P.courseCompte(25, 25, 100), {compte: false, raison: "rapide"}, "les 10,0 s fabriqués par GPT ne comptent plus");
  assert.deepEqual(P.courseCompte(25, 25, 36001), {compte: false, raison: "long"});
  assert.deepEqual(P.courseCompte(25, 20, 498), {compte: false, raison: "erreurs"}, "pas 25 questions");
});

test("formatTemps : « 49,8 s », « 1 min 01,3 s », « 2 min 00,0 s » ; libelleRang : 1er, 2e, 14e", () => {
  assert.equal(P.formatTemps(498), "49,8 s");
  assert.equal(P.formatTemps(613), "1 min 01,3 s");
  assert.equal(P.formatTemps(1200), "2 min 00,0 s");
  assert.equal(P.formatTemps(100), "10,0 s");
  assert.equal(P.formatTemps(5), "0,5 s");
  assert.equal(P.libelleRang(1), "1er");
  assert.equal(P.libelleRang(2), "2e");
  assert.equal(P.libelleRang(14), "14e");
  assert.equal(P.libelleRang(0), "");
});

test("la séance d'une Légende : sans l'option, « Tente 👑 » comme avant ; avec, « Ma première course » puis « Je bats mon record »", () => {
  const p = legende();
  const seance = P.ouvrirSeance(p, {aujourdhui: AUJ});
  const sans = P.programmeDeSeance(p, seance, AUJ).etapes;
  assert.deepEqual(sans.map(e => e.type), ["etoile"], "Mes calculs du jour est fait : l'étoile seule");
  assert.equal(sans[0].nom, "Tente 👑");
  const premiere = P.programmeDeSeance(p, seance, AUJ, {records: {meilleur: null}}).etapes;
  assert.equal(premiere.length, 1);
  assert.equal(premiere[0].type, "course");
  assert.equal(premiere[0].nom, "Ma première course");
  assert.equal(premiere[0].detail, "25 questions");
  assert.equal(premiere[0].etoile, 5, "elle garde le code de la couronne dans la séance enregistrée");
  assert.deepEqual(premiere[0].config, P.configCourse());
  assert.equal(premiere[0].minutes, 3);
  const encore = P.programmeDeSeance(p, seance, AUJ, {records: {meilleur: 524}}).etapes;
  assert.equal(encore[0].nom, "Je bats mon record");
  // Pas Légende : l'option ne change rien.
  const pl = presqueLegende();
  const s2 = P.ouvrirSeance(pl, {aujourdhui: AUJ});
  assert.deepEqual(P.programmeDeSeance(pl, s2, AUJ, {records: {meilleur: null}}).etapes.map(e => e.type), ["etoile"]);
  assert.equal(P.etapeDeSeance(pl, s2, AUJ, {records: {meilleur: null}}).nom, "Tente 👑");
  // records: false (classe fermée, pas de code) : rien ne change.
  assert.equal(P.etapeDeSeance(p, seance, AUJ, {records: false}).type, "etoile");
});

test("noterEtape : la course se note comme l'étoile qu'elle remplace — réussie à 25 sur 25, codée 305 dans la séance en cours, la séance finit", () => {
  const p = legende();
  const seance = P.ouvrirSeance(p, {aujourdhui: AUJ});
  const etape = P.etapeDeSeance(p, seance, AUJ, {records: {meilleur: null}});
  assert.equal(etape.type, "course");
  const note = P.noterEtape(p, seance, etape, {juste: 25, total: 25, reussi: true}, AUJ);
  assert.equal(note.faite.type, "course");
  assert.equal(note.faite.nom, "Ma première course");
  assert.equal(note.faite.reussi, true);
  assert.equal(note.seance.finie, true);
  assert.equal(note.parcours.enCours, null, "séance finie : plus de séance en cours");
  assert.deepEqual(note.parcours.seances.slice(-1), [AUJ]);
  assert.deepEqual(note.parcours.expert, p.expert, "la course ne touche pas aux étoiles");
  // Une séance coupée juste avant la course, puis reprise : elle propose la course.
  const avantCourse = P.noterEtape(p, {...seance, file: [{type: "revision"}, ...seance.file]}, {type: "revision", nom: "Mes calculs du jour", prevue: {type: "revision"}}, {juste: 10, total: 10}, AUJ);
  assert.equal(avantCourse.seance.finie, false);
  const reprise = P.seanceEnCours(avantCourse.parcours, {aujourdhui: AUJ});
  assert.ok(reprise, "la séance est en cours");
  assert.equal(P.etapeDeSeance(avantCourse.parcours, reprise, AUJ, {records: {meilleur: 524}}).nom, "Je bats mon record");
  // La même course, ratée (24 sur 25) : notée pas réussie, la séance finit quand même.
  const ratee = P.noterEtape(p, seance, etape, {juste: 24, total: 25, reussi: false}, AUJ);
  assert.equal(ratee.faite.reussi, false);
  assert.equal(ratee.seance.finie, true);
});

test("la case d'envoi : une course en attente et le record connu, seulement quand ils servent ; la meilleure de deux courses", () => {
  const stockage = fauxStockage();
  const code = "AXKQ7T";
  assert.deepEqual(P.chargerSync(stockage, code), {revision: 0, dirty: false, detache: false, maj: 0}, "une case neuve garde sa forme d'avant");
  // Lot « correctifs de l'audit Codex » (29/10/2026) : la course en attente
  // porte son TICKET de départ (32 hex) ; absent ou illisible → null.
  const TICKET = "0123456789abcdef0123456789abcdef";
  P.sauverSync(stockage, code, {revision: 3, dirty: false, detache: false, maj: 10, course: {temps: 498, jour: AUJ, ticket: TICKET}, record: {meilleur: 524, meilleurLe: "2026-10-08", semaine: 524, lundi: "2026-10-05", nom: true}});
  assert.deepEqual(P.chargerSync(stockage, code), {revision: 3, dirty: false, detache: false, maj: 10, course: {temps: 498, jour: AUJ, ticket: TICKET},
    record: {meilleur: 524, meilleurLe: "2026-10-08", semaine: 524, lundi: "2026-10-05", nom: true}});
  // Relecture Codex (R5) : une course sans ticket valable n'est pas gardée du tout — elle ne pourrait plus compter.
  P.sauverSync(stockage, code, {revision: 3, course: {temps: 498, jour: AUJ, ticket: "PAS-UN-TICKET"}});
  assert.equal(P.chargerSync(stockage, code).course, undefined, "un ticket illisible : la course n'est pas gardée");
  P.sauverSync(stockage, code, {revision: 3, course: {temps: 498, jour: AUJ}});
  assert.equal(P.chargerSync(stockage, code).course, undefined, "une course d'avant la mise à jour (sans ticket) non plus");
  assert.equal(P.ticketDeCourseValide(TICKET), true);
  assert.equal(P.ticketDeCourseValide(TICKET.toUpperCase()), false, "minuscules seulement, comme le serveur");
  assert.equal(P.ticketDeCourseValide(TICKET.slice(1)), false);
  assert.equal(P.ticketDeCourseValide(null), false);
  // Une course impossible (robot, ou texte) ne se garde pas ; un record illisible non plus.
  P.sauverSync(stockage, code, {revision: 3, course: {temps: 50}, record: {meilleur: "beaucoup"}});
  const lu = P.chargerSync(stockage, code);
  assert.equal(lu.course, undefined);
  assert.deepEqual(lu.record, {meilleur: null, meilleurLe: null, semaine: null, lundi: null, nom: null});
  assert.deepEqual(P.normaliserRecordConnu({meilleur: 498, nom: false}), {meilleur: 498, meilleurLe: null, semaine: null, lundi: null, nom: false});
  assert.deepEqual(P.normaliserRecordConnu({meilleur: 498, nom: "oui"}).nom, null, "un nom qui n'est pas un booléen : pas choisi");
  assert.equal(P.normaliserRecordConnu(null), null);
  assert.equal(P.garderMeilleureCourse(null, {temps: 498, jour: AUJ}), null, "sans ticket : rien à garder");
  assert.deepEqual(P.garderMeilleureCourse({temps: 498, jour: AUJ, ticket: TICKET}, {temps: 450, jour: AUJ}), {temps: 498, jour: AUJ, ticket: TICKET}, "une course sans ticket, même plus rapide, ne remplace pas celle qui a le sien (R5)");
  assert.deepEqual(P.garderMeilleureCourse({temps: 498, jour: AUJ}, {temps: 450, jour: AUJ, ticket: TICKET}), {temps: 450, jour: AUJ, ticket: TICKET}, "une vieille course sans ticket ne bloque pas une neuve");
  assert.deepEqual(P.garderMeilleureCourse({temps: 498, jour: AUJ, ticket: TICKET}, {temps: 531, jour: AUJ, ticket: TICKET.replace("0", "f")}), {temps: 498, jour: AUJ, ticket: TICKET}, "la plus courte reste, avec son ticket");
  assert.equal(P.garderMeilleureCourse(null, {temps: 20}), null, "une course impossible ne remplace rien");
});

test("le moteur copié sur le serveur est le même octet pour octet, et son numéro a monté", () => {
  assert.equal(moteurCopie, moteur);
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-3/);
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/, "le noyau est resté à celui du lot « trois divisions »");
});

// --------------------------------------------------------------------- la page

test("la page : les deux écrans (le tableau à onglets, le choix du nom avec la silhouette et le détective), le bouton « Voir les records »", () => {
  assert.match(html, /<div id="records" class="records-screen" hidden>[\s\S]*<h1 id="records-title" class="settings-heading" tabindex="-1">🏆 Les records<\/h1>/);
  assert.match(html, /<button id="records-onglet-semaine" type="button" role="tab" aria-selected="true" aria-controls="records-semaine">Cette semaine<\/button>/);
  assert.match(html, /<button id="records-onglet-toujours" type="button" role="tab" aria-selected="false" aria-controls="records-toujours">De tous les temps<\/button>/);
  assert.match(html, /<button id="records-courir" class="primary" type="button">Je bats mon record&nbsp;→<\/button>\s*<button id="records-nom-changer" class="rec-voir" type="button">Changer mon nom<\/button>/);
  assert.match(html, /<div id="records-nom" class="records-screen" hidden>[\s\S]*Tu es une Légende des tables&nbsp;!<\/h2>\s*<p class="rec-sous">Comment veux-tu apparaître dans les records&nbsp;\?<\/p>/);
  assert.match(html, /<button id="records-nom-prenom" type="button"><span class="ic"><svg [^>]*><circle cx="12" cy="8" r="4\.2"[\s\S]*?<\/svg><\/span><span><strong id="records-nom-prenom-texte">Mon prénom<\/strong><small>Mon prénom<\/small><\/span><\/button>/, "la silhouette au trait (planche R4, A), « Mon prénom » sans la classe");
  assert.match(html, /<button id="records-nom-mystere" type="button"><span class="ic" aria-hidden="true">🕵️<\/span><span><strong>Mystère<\/strong><small>Personne ne sait que c’est moi<\/small><\/span><\/button>/);
  assert.match(html, /<p class="rec-note">Tu peux changer quand tu veux\.<\/p>/);
  assert.doesNotMatch(html, /Mon prénom et ma classe/, "jamais la classe (décision du 09/10)");
  assert.match(html, /<button id="result-records" class="primary" type="button" hidden>Voir les records<\/button>/);
  assert.match(html, /<p id="result-course-attente" class="rec-attente" hidden><\/p>/);
  assert.match(html, /\["records", "records-nom"\]\.forEach\(id => \{ const ecran = \$\(id\); if \(ecran\) ecran\.hidden = id !== name; \}\);/);
});

test("la page : la course garde sa marque et perd sa durée après la normalisation du noyau ; le chrono monte", () => {
  assert.match(html, /if \(configuration\.course === "records"\) \{\s*config\.duration = null;\s*config\.course = "records";\s*\}/);
  assert.match(html, /configuration\.course = config\.course === "records" \? "records" : null;/);
  assert.match(html, /if \(state\.configuration\?\.course === "records"\) \{\s*\$\("time"\)\.textContent = formatTime\(Math\.floor\(\(horlogeSerie\(\) - state\.startAt\) \/ 1000\)\);\s*return;\s*\}/);
  assert.match(html, /if \(DURATION !== null \|\| course\) state\.timer = window\.setInterval\(updateTimer, 200\);/);
  assert.match(html, /course \? "Temps écoulé" : DURATION === null \? "Sans chrono" : "Temps restant"/);
});

test("la page : le lancement et les trois fins de course, dans les mots des planches R3", () => {
  // Lot « les règles des records » (11/10/2026) : la question reste ; trois erreurs sur le même calcul, la course s'arrête.
  assert.match(html, /gras\.textContent = "la question reste";\s*ligne\.append\(document\.createTextNode\("Le chrono monte\. Une erreur\\u00a0: "\), gras, document\.createTextNode\("\. Trois sur le même calcul\\u00a0: la course s’arrête\."\)\);/);
  assert.match(html, /verdict\.titre = "Nouveau record\\u00a0!";/);
  assert.match(html, /verdict\.score = `Ton record reste \$\{PARCOURS\.formatTemps\(record\.meilleur\)\}\.`;/);
  assert.match(html, /verdict\.score = jugement\.raison === "erreurs" \? "Le temps ne compte pas\\u00a0: il faut tout juste\." : "Le temps ne compte pas\.";/);
  assert.match(html, /attente\.textContent = "Temps gardé ici, pas encore envoyé\.";/);
  assert.match(html, /rang\.textContent = `\$\{PARCOURS\.libelleRang\(donnees\.rangSemaine\)\} cette semaine`;/);
  // La couronne : son temps est le premier record (25 sur 25 en 1 minute).
  assert.match(html, /const couronne = suivi\.evenements\.find\(evenement => evenement\.type === "etoile" && evenement\.couronne\);\s*if \(!course && !couronne\) return;/);
});

test("la page : les boutons de fin de course — « ← Ma table » et « Rejouer » côte à côte, « Voir les records » sur la ligne du dessous (lot « fignolage du 22/10 », planches 1 et 4)", () => {
  // Hors séance : « Ma table » n'est plus caché (il manquait le retour) ; seuls
  // « Voir mon parcours » et l'entraînement conseillé le restent.
  assert.match(html, /\.result\.is-course \.result-actions > #result-open-parcours, \.result\.is-course \.result-actions > #result-entraine \{ display: none; \}/);
  assert.doesNotMatch(html, /\.result\.is-course \.result-actions > #result-accueil \{ display: none; \}/, "la course hors séance a son retour à Ma table");
  assert.match(html, /\.result\.is-course \.result-actions \{ display: grid; grid-template-columns: auto minmax\(0, 1fr\); gap: 12px; width: min\(100%, 440px\); margin-left: auto; margin-right: auto; \}/,
    "la même ligne qu'entre deux étapes : « ← Ma table » à sa largeur, « Rejouer » prend le reste");
  assert.match(html, /\.result\.is-course \.result-actions > #result-records \{ grid-column: 1 \/ -1; \}/, "« Voir les records » sur toute la ligne, dessous");
  assert.doesNotMatch(html, /\.result\.is-course(\.is-fete|:not\(\.is-fete\)) \.result-actions > #(result-records|retry) \{ order: -1; \}/, "plus d'ordre qui change avec la fête");
  assert.doesNotMatch(html, /\.result\.avec-erreurs\.is-course \.result-actions > button \{ grid-column: 1 \/ -1; \}/);
  // « Rejouer » bleu, même quand le record est battu (choix de la planche 1).
  assert.match(html, /if \(course\) \{\s*\$\("result-accueil"\)\.classList\.remove\("primary"\);\s*\$\("result-accueil"\)\.classList\.add\("secondary"\);\s*\$\("retry"\)\.className = "primary";\s*\$\("result-records"\)\.className = "secondary";\s*\}/);
  assert.doesNotMatch(html, /\$\("result-records"\)\.className = fete \?/);
  // « ← Ma table » sort de la course comme « Voir les records ».
  const retour = html.slice(html.indexOf("      function backToModes() {"), html.indexOf("\n      }\n", html.indexOf("      function backToModes() {")));
  assert.match(retour, /configuration\.course = null;/);
  // Dans une séance : « ← Ma table | Mon bilan → », puis « Voir les records » dessous (choix de Gwenaël).
  assert.match(html, /retour\.className = "secondary retour-flechee";\s*retour\.textContent = "Ma table";\s*retour\.addEventListener\("click", backToModes\);\s*const ligne = document\.createElement\("div"\);\s*ligne\.className = "suite-boutons";\s*ligne\.append\(retour, suite\);\s*zone\.append\(ligne\);/);
  assert.match(html, /if \(seance\.faites\[seance\.faites\.length - 1\]\.type === "course"\) \{\s*const voir = document\.createElement\("button"\);\s*voir\.type = "button";\s*voir\.className = "secondary voir-records";\s*voir\.textContent = "Voir les records";/);
  assert.match(html, /\.seance-suite \.voir-records \{ width: min\(100%, 440px\); \}/);
});

test("la page : le cadre « Les records » de l'accueil (planche R1) et la séance faite en un seul bouton", () => {
  assert.match(html, /zone\.querySelector\("\.eyebrow"\)\.textContent = "🏆 Les records";/);
  assert.match(html, /\? "Toutes les tables, le plus vite possible"\s*: `Ton record\\u00a0: \$\{PARCOURS\.formatTemps\(record\.meilleur\)\}`;/);
  assert.match(html, /\[\["Cette semaine", recordsEtat\.rangSemaine\], \["De tous les temps", recordsEtat\.rangToujours\]\]/);
  assert.match(html, /sousTitre: `\$\{PARCOURS\.SEUILS\.course\.total\}\\u00a0questions · le chrono monte`,/);
  assert.match(html, /go: "Jouer\\u00a0→"/);
  // Lot « une tentative n'est pas une séance » (08/11/2026, choix C) : un vrai bouton.
  assert.match(html, /voir\.className = "secondary rec-classement";\s*voir\.id = "acc-voir-records";\s*voir\.textContent = "🏆 Voir le classement";\s*voir\.addEventListener\("click", ouvrirRecords\);/);
  // Le chemin (décision 8) : au premier appui, le nom, une seule fois.
  assert.match(html, /function avecLeNomChoisi\(suite\) \{\s*if \(recordConnu\(\)\.nom === null && recordsOuverts\(\)\) \{/);
  // L'escalier reste dans Mon parcours : la page ne le retire pas.
  assert.match(html, /<div id="parcours-expert" class="parcours-row parcours-extra"><\/div>/);
});

test("la page : le tableau — onglets au téléphone, deux colonnes sur ordinateur ; hors des 10, « Ton record » sans rang ; les tableaux vides", () => {
  assert.match(html, /\[\["semaine", "Personne cette semaine, pour l’instant\."\], \["toujours", "Personne pour l’instant\."\]\]/);
  assert.match(html, /message\.textContent = etat \? vide : "Le serveur ne répond pas\\u00a0: réessaie plus tard\.";/);
  assert.match(html, /moi\.hidden = !\(record\.meilleur !== null && !dansLeTableau\);/);
  assert.match(html, /@media \(min-width: 1024px\) \{\s*\.records-screen \{ max-width: 900px; \}[\s\S]*?\.rec-onglets \{ display: none; \}/);
  assert.match(html, /\.rec-liste li\.moi \{ border: 2px solid var\(--blue\); background: #eef5ff; \}/);
});

test("la page : le parcours d'un élève porte son record (bandeau), la vue professeur inchangée par ailleurs", () => {
  assert.match(html, /ficheRecord = donnees\.record \|\| null;\s*afficherFicheEleve\(donnees\);/);
  // Lot « Ma classe : le parcours de Léa » : le record est dans le bandeau
  // (renderRepereProf), à la suite de la dernière activité.
  assert.match(html, /profEtat = \{prenom: distant\.prenom, classe: classe \|\| "", maj_le: maj_le \|\| null, record\};/);
  assert.match(html, /const record = profEtat\.record;\s*\n\s*if \(record && Number\.isInteger\(record\.meilleur\)\) \{[\s\S]*?`· record \$\{PARCOURS\.formatTemps\(record\.meilleur\)\}`/);
});

// ------------------------------------------------------ la page, en marche (faux-monde)

// Un faux réseau qui parle aussi records.php : « ok » répond comme le serveur,
// « pas-legende » répond 409, « ferme » 403, « muet » ne répond jamais au
// records seul ; les autres chemins répondent comme le faux réseau ordinaire.
function reseauAvecRecords({records = "ok", progression} = {}) {
  const appels = [];
  const reponse = (status, donnees) => ({status, json: async () => donnees, headers: {get: () => null}});
  const ligue = {ok: true, ouvert: true, legende: true, record: {meilleur: 498, meilleurLe: AUJ, semaine: 498, lundi: "2026-10-05", nom: true},
    lundi: "2026-10-05", semaine: [{rang: 1, nom: "Toti", temps: 498, moi: true}], toujours: [{rang: 1, nom: "Toti", temps: 498, moi: true}], rangSemaine: 1, rangToujours: 1};
  const fetch = (url, options) => {
    const corps = options && options.body ? JSON.parse(String(options.body)) : {};
    const chemin = url.split("/").pop();
    appels.push({chemin, corps});
    if (chemin === "records.php") {
      if (records === "muet") return new Promise(() => {});
      // Lot « correctifs de l'audit Codex » : le ticket du départ.
      if (corps.depart) return records === "coupe" ? Promise.reject(new TypeError("Failed to fetch")) : Promise.resolve(reponse(200, {ok: true, course: TICKET}));
      if (records === "pas-legende") return Promise.resolve(reponse(409, {ok: false, legende: false, erreur: "Pas encore Légende des tables."}));
      if (records === "ferme") return corps.lire ? Promise.resolve(reponse(200, {ok: true, ouvert: false})) : Promise.resolve(reponse(403, {ok: false, erreur: "Les records ne sont pas ouverts à ta classe."}));
      if (records === "refuse") return Promise.resolve(reponse(400, {ok: false, erreur: "Le temps ne compte pas."}));
      if (corps.temps) return Promise.resolve(reponse(200, {...ligue, nouveau: true, avant: 524, record: {...ligue.record, meilleur: corps.temps}}));
      return Promise.resolve(reponse(200, ligue));
    }
    if (chemin === "eleve.php") return Promise.resolve(reponse(200, {ok: true, prenom: "Toti", classe: "306", reglages: {}}));
    if (corps.lire) return Promise.resolve(reponse(200, {ok: true, existe: true, parcours: progression, maj_le: null, revision: 1}));
    return Promise.resolve(reponse(200, {ok: true, maj_le: AUJ, revision: (corps.base_revision || 0) + 1}));
  };
  return {fetch, appels, records: () => appels.filter(a => a.chemin === "records.php").map(a => a.corps)};
}

const CODE = "AXKQ7T";
const TICKET = "0123456789abcdef0123456789abcdef";

test("en marche : une Légende suivie lit sa ligue à l'ouverture ; la case garde son record ; la séance reçoit l'option", async () => {
  const reseau = reseauAvecRecords({progression: sansPrenom(legende())});
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(reseau.records(), [{code: CODE, lire: true}], "une lecture, par le code, dans le corps");
  assert.equal(appli.api.recordsOuverts(), true);
  assert.equal(appli.api.recordsEtat.rangSemaine, 1);
  assert.deepEqual(appli.api.recordConnu(), {meilleur: 498, meilleurLe: AUJ, semaine: 498, lundi: "2026-10-05", nom: true});
  assert.deepEqual(appli.api.sync.record, {meilleur: 498, meilleurLe: AUJ, semaine: 498, lundi: "2026-10-05", nom: true}, "gardé dans la case, pour l'accueil hors ligne");
  assert.deepEqual(appli.api.optionsSeance(), {records: {meilleur: 498}});
  assert.ok(appli.rendus.includes("accueil") || appli.rendus.includes("records"), "l'écran présent se redessine avec la ligue");
});

test("en marche : pas Légende, ou sans code, ou classe fermée — rien ne part, rien ne change", async () => {
  const reseau = reseauAvecRecords({progression: sansPrenom(presqueLegende())});
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(reseau.records(), [], "quatre étoiles : aucun appel aux records");
  assert.equal(appli.api.recordsOuverts(), false);
  assert.deepEqual(appli.api.optionsSeance(), {});
  // Sans code : une Légende de l'appareil n'a pas de ligue.
  const sansCode = demarrerAppli({reseau: reseauAvecRecords(), local: fauxStockage()});
  sansCode.api.parcours = legende();
  assert.equal(sansCode.api.recordsOuverts(), false);
  // La classe a fermé les records (réglage reçu avec l'identité).
  const ferme = reseauAvecRecords({records: "ferme", progression: sansPrenom(legende())});
  const appli2 = demarrerAppli({reseau: ferme, codeOnglet: CODE, local: fauxStockage()});
  appli2.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli2.api.recordsReglage, false, "« ouvert: false » à la lecture");
  assert.equal(appli2.api.recordsOuverts(), false);
  appli2.api.lireReglageRecords({"defi-tables": {records: false}});
  assert.equal(appli2.api.recordsReglage, false);
  appli2.api.lireReglageRecords({});
  assert.equal(appli2.api.recordsReglage, true, "rien de réglé : ouverts");
});

test("en marche : une course à 25 sur 25 part tout de suite ; le serveur répond : la ligue revient, l'attente s'efface", async () => {
  const reseau = reseauAvecRecords({progression: sansPrenom(legende())});
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  appli.api.noterCourse(450, TICKET);
  await new Promise(r => setTimeout(r, 5));
  // Lot « après l'audit GPT » (D8) : le jour de la course part avec le temps ;
  // lot « correctifs de l'audit Codex » (29/10/2026) : et le ticket du départ.
  assert.deepEqual(reseau.records().slice(-1), [{code: CODE, temps: 450, justes: 25, jour: P.jourLocal(), course: TICKET}], "le temps en dixièmes, « justes » 25, le jour de la course et le ticket");
  assert.equal(appli.api.sync.course, undefined, "plus rien en attente");
  assert.equal(appli.api.recordConnu().meilleur, 450, "le record connu suit");
  assert.equal(appli.api.sync.record.meilleur, 450);
});

test("en marche : serveur muet — la course attend dans la case, et repart après le prochain 200 du parcours", async () => {
  const reseau = reseauAvecRecords({records: "muet", progression: sansPrenom(legende())});
  const local = fauxStockage();
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  appli.api.noterCourse(450, TICKET);
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(appli.api.sync.course, {temps: 450, jour: P.jourLocal(), ticket: TICKET}, "en attente, avec son ticket");
  assert.deepEqual(P.chargerSync(local, CODE).course, {temps: 450, jour: P.jourLocal(), ticket: TICKET}, "et dans la case durable : elle survit à la fermeture");
  appli.api.noterCourse(470, TICKET);
  assert.equal(appli.api.sync.course.temps, 450, "une course moins bonne ne remplace pas celle qui attend");
  appli.api.noterCourse(430, TICKET);
  assert.equal(appli.api.sync.course.temps, 430, "une meilleure, si");
  appli.api.noterCourse(400, null);
  assert.equal(appli.api.sync.course.temps, 430, "sans ticket (course partie sans réseau), rien n'est gardé, même meilleure");
  // Le serveur revient : l'envoi du parcours réussit, la course part derrière.
  const revenu = reseauAvecRecords({progression: sansPrenom(legende())});
  const appli2 = demarrerAppli({reseau: revenu, codeOnglet: CODE, local});
  appli2.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(revenu.records().filter(c => c.temps), [{code: CODE, temps: 430, justes: 25, jour: P.jourLocal(), course: TICKET}], "la course en attente est partie à l'ouverture, ticket compris");
  assert.equal(appli2.api.sync.course, undefined);
});

test("en marche : « pas encore Légende » (409) garde la course ; un refus net (400) ou une classe fermée (403) l'efface", async () => {
  const reseau = reseauAvecRecords({records: "pas-legende", progression: sansPrenom(legende())});
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  appli.api.noterCourse(450, TICKET);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli.api.sync.course.temps, 450, "la couronne n'est pas encore là-bas : on garde");
  // Après un 200 du parcours, l'envoi est retenté (traiterReponseEnvoi).
  const avant = reseau.records().length;
  appli.api.sauverParcours();
  await new Promise(r => setTimeout(r, 5));
  assert.ok(reseau.records().length > avant, "retentée après l'enregistrement du parcours");
  const refuse = reseauAvecRecords({records: "refuse", progression: sansPrenom(legende())});
  const appli2 = demarrerAppli({reseau: refuse, codeOnglet: CODE, local: fauxStockage()});
  appli2.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  appli2.api.noterCourse(450, TICKET);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli2.api.sync.course, undefined, "refusée pour de bon : effacée");
});

test("en marche : le choix du nom ouvre d'abord, une seule fois, puis la suite ; « Changer mon nom » repasse par l'écran", async () => {
  const reseau = reseauAvecRecords({progression: sansPrenom(legende())});
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  // Le serveur a dit « nom: true » : pas d'écran du nom, la course part.
  appli.api.lancerCourse("menu");
  assert.ok(appli.rendus.includes("lancer:records"), "la course, tout de suite");
  assert.ok(!appli.rendus.includes("show:records-nom"));
  // Un élève dont le nom n'est pas choisi : l'écran du nom d'abord.
  appli.api.sync.record.nom = null;
  appli.api.recordsEtat.record.nom = null;
  appli.api.ouvrirRecords();
  assert.ok(appli.rendus.includes("show:records-nom"), "le nom d'abord");
  assert.ok(!appli.rendus.includes("show:records"));
  appli.api.choisirNom(false);
  await new Promise(r => setTimeout(r, 5));
  assert.deepEqual(reseau.records().slice(-1), [{code: CODE, nom: false}], "Mystère, envoyé par le code");
  assert.ok(appli.rendus.includes("show:records"), "puis la suite : le tableau");
});

test("en marche : « Se déconnecter » ou un autre code oublient la ligue", async () => {
  const reseau = reseauAvecRecords({progression: sansPrenom(legende())});
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.ok(appli.api.recordsEtat);
  appli.api.quitterSuivi();
  assert.equal(appli.api.recordsEtat, null);
  assert.equal(appli.api.recordsOuverts(), false);
});

// ----------------------------------------------------------- le serveur, la page prof

test("le serveur : la table « records », son API, le réglage par classe, ce qui part avec l'élève, la sauvegarde, verifier.php", () => {
  assert.match(bd, /CREATE TABLE IF NOT EXISTS records \(\s*eleve_id INTEGER NOT NULL PRIMARY KEY,\s*meilleur INTEGER NULL,\s*meilleur_le VARCHAR\(32\) NULL,\s*semaine INTEGER NULL,\s*semaine_lundi VARCHAR\(10\) NULL,\s*nom INTEGER NULL,\s*maj_le VARCHAR\(25\) NOT NULL\s*\)/);
  assert.match(bd, /Table « records » créée \(les meilleurs temps des Légendes des tables\)\./);
  assert.match(applis, /'reglages' => \['records' => true\],/);
  assert.match(apiRecords, /if \(\$justes !== COURSE_TOTAL\) \{[\s\S]*?erreur\("Le temps ne compte pas : il faut tout juste\.", 400\);/);
  assert.match(apiRecords, /if \(\$temps < SEUIL_COURSE_DIXIEMES \|\| \$temps > COURSE_MAX_DIXIEMES\) \{/);
  assert.match(apiRecords, /if \(!est_legende\(\$pdo, \$eleveId\)\) \{[\s\S]*?repondre\(\['ok' => false, 'legende' => false, 'erreur' => "Pas encore Légende des tables\."\], 409\);/);
  assert.match(apiRecords, /erreur\("Les records ne sont pas ouverts à ta classe\.", 403\);/);
  assert.match(serveurRecords, /const COURSE_TOTAL = 25;\s*(?:\/\/[^\n]*\n\s*)*const SEUIL_COURSE_DIXIEMES = 150;\s*const COURSE_MAX_DIXIEMES = 36000;\s*const RECORDS_TOP = 10;/);
  assert.match(serveurRecords, /if \(\(int\)\(\$ligne\['nom'\] \?\? 0\) !== 1\) \{ \$noms\[\$id\] = 'Mystère'; continue; \}/, "pas de choix, ou Mystère : Mystère");
  assert.match(serveurRecords, /\$noms\[\$id\] = \$homonyme && \$initiale !== '' \? "\$prenom \$initiale\." : \$prenom;/, "l'initiale pour les homonymes, jamais la classe");
  assert.match(serveurRecords, /WHERE c\.prof_id = \? AND r\.meilleur IS NOT NULL/, "la ligue du propriétaire des classes");
  assert.match(apiProf, /case 'records\.ligue':/);
  assert.match(apiProf, /'record' => \$recordsParEleve\[\(int\)\$ligne\['id'\]\] \?\? null,/, "le tableau porte le record");
  assert.match(apiProf, /oublier_record_de_l_eleve\(\$pdo, \(int\)\$eleve\['id'\]\);/, "eleves.supprimer");
  assert.match(archives, /oublier_record_de_l_eleve\(\$pdo, \(int\)\$eleve\['id'\]\);/, "supprimer_classe");
  assert.match(apiEleve, /'record' => \$appli === 'defi-tables' && records_disponibles\(\$pdo\) \? record_affichable\(record_de\(\$pdo, \(int\)\$eleve\['id'\]\)\) : null,/, "la fiche");
  assert.match(sauvegarde, /'journal', 'records', 'modeles_evaluation', 'cours_ouvertures'\]/);
  assert.match(verifier, /verif\(\$lignes, "Les records \(Défi tables\)", function \(\) \{/);
});

test("les bornes du serveur sont celles du moteur (SEUILS.course)", () => {
  const m = serveurRecords.match(/const COURSE_TOTAL = (\d+);\s*(?:\/\/[^\n]*\n\s*)*const SEUIL_COURSE_DIXIEMES = (\d+);\s*const COURSE_MAX_DIXIEMES = (\d+);/);
  assert.ok(m);
  assert.equal(Number(m[1]), P.SEUILS.course.total);
  assert.equal(Number(m[2]), P.SEUILS.course.dixiemesMin);
  assert.equal(Number(m[3]), P.SEUILS.course.dixiemesMax);
});

test("la page prof : le temps à côté de la couronne, la carte des records avec « Plein écran », la case par classe (planche R5)", () => {
  assert.match(pageProf, /<div class="carte rec-carte" id="bloc-records" hidden>[\s\S]*<strong>🏆 Les records<\/strong><p>Toutes tes classes · le plein écran montre ce que voient les élèves<\/p>[\s\S]*<button type="button" class="secondaire" id="records-plein-ecran">Plein écran<\/button>/);
  assert.match(pageProf, /<ol class="rec-liste" id="records-semaine"><\/ol><p class="rec-vide" id="records-semaine-vide" hidden>Personne cette semaine, pour l’instant\.<\/p>/);
  assert.match(pageProf, /<ol class="rec-liste" id="records-toujours"><\/ol>/);
  // Serveur pro, lot 5b : la case des records a quitté Réglages pour la fenêtre « Régler Défi tables »
  // (dessinerRegler), et elle ne part qu'à « Enregistrer » (changementsDeLaClasse).
  assert.match(pageProf, /caseACocher\("🏆 Les records", b\.records, coche => \{ b\.records = coche; \},\s*`Le concours de temps des Légendes des tables\. Décoché : la \$\{classe\.libelle\} ne le voit pas et n’y apparaît pas\.`\)/);
  assert.match(pageProf, /temps\.className = "rec-temps";\s*temps\.textContent = PARCOURS\.formatTemps\(eleve\.record\.meilleur\);/);
  assert.match(pageProf, /ligueRecords = await api\("records\.ligue"\);/);
  assert.match(pageProf, /if \(b\.cle === "defi-tables" && b\.records !== depart\.records\) pourLAppli\.records = b\.records;/);
  assert.match(pageProf, /if \(Object\.keys\(pourLAppli\)\.length\) charge\.reglages = \{\[b\.cle\]: pourLAppli\};/);
  assert.match(pageProf, /const visible = Boolean\(ligueRecords\) && appliAffichee === "defi-tables" && droitClasse === "proprietaire"/, "propriétaire, Défi tables");
  assert.match(pageProf, /fermer\.textContent = "✕ Fermer";/);
  // La carte des records part avec le reste à la déconnexion ; la fenêtre « Régler … » se ferme.
  assert.match(pageProf, /"bandeau-echues", "bloc-records", "bloc-evaluations", "vue-reglages", "onglet-reglages",\s*"vue-eleves", "onglet-eleves", "menu-classes",/);
  assert.match(pageProf, /\["boite", "secret", "eval-modele", "eval-ouvrir", "regler", "fenetre-eleve"\]\.forEach/);
  assert.doesNotMatch(pageProf, /id="case-records"/, "plus de case des records dans Réglages (lot 5b)");
  // Le plein écran (posé sur <body>) ne s'imprime pas avec les bandelettes ; la carte est dans #ecran-classe, déjà cachée à l'impression.
  assert.match(pageProf, /\.barre, header, footer, \.barre-outils, \.actions, \.rec-plein,\s*#ecran-classe > \*:not\(\.fiche\)/);
});

// ---------------------------------------------------------------------------
// Lot « correctifs de l'audit Codex » (29/10/2026) — défaut 1 de l'audit du
// 22/10 : un record se fabriquait en une requête. Le serveur chronomètre
// désormais la course : un ticket au départ (« depart »), rendu avec le
// temps à l'arrivée (« course »), et le serveur refuse un temps plus court
// que ce qu'il a mesuré. Côté page : le ticket est demandé au « C'est
// parti ! » (course des records ET marche de la couronne), le chrono ne part
// qu'une fois le ticket arrivé ou refusé, et sans ticket (pas de réseau au
// départ) le temps n'est pas gardé — le verdict le dit (décision de Gwenaël,
// 29/10/2026 : « course jouée, verdict honnête »).

test("ticket : courseAvecTicket — la course des records et la marche de la couronne, pas les étoiles ni les autres séries", async () => {
  const appli = demarrerAppli({reseau: reseauAvecRecords({progression: sansPrenom(legende())}), codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli.api.courseAvecTicket(P.configCourse()), true, "la course des records");
  assert.equal(appli.api.courseAvecTicket(P.configEtoile(P.ETOILES_MAX)), true, "la marche de la couronne (son temps est le premier record)");
  // Un élève à 2 étoiles : sa marche suivante est la 3e, pas la couronne.
  const deuxEtoiles = legende();
  deuxEtoiles.expert = {etoiles: 2, dernier: "2026-10-08", couronne: null};
  appli.api.parcours = sansPrenom(P.normaliserParcours(deuxEtoiles));
  assert.equal(appli.api.courseAvecTicket(P.configEtoile(3)), false, "une étoile ordinaire");
  assert.equal(appli.api.courseAvecTicket(P.configEtoile(5)), false, "la couronne tentée trop tôt ne compte pas : pas de ticket non plus");
  assert.equal(appli.api.courseAvecTicket(P.configValidation(7)), false, "le test d'une table");
  assert.equal(appli.api.courseAvecTicket(null), false);
});

test("ticket : demanderTicketDeCourse — un appel « depart » par le code ; réseau coupé → null ; sans code → null sans appel", async () => {
  const reseau = reseauAvecRecords({progression: sansPrenom(legende())});
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  const avant = reseau.records().length;
  assert.equal(await appli.api.demanderTicketDeCourse(), TICKET);
  assert.deepEqual(reseau.records().slice(avant), [{code: CODE, depart: true}], "le code dans le corps, « depart »");
  const coupe = reseauAvecRecords({records: "coupe", progression: sansPrenom(legende())});
  const appli2 = demarrerAppli({reseau: coupe, codeOnglet: CODE, local: fauxStockage()});
  appli2.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(await appli2.api.demanderTicketDeCourse(), null, "pas de réseau : pas de ticket");
  const sansCode = demarrerAppli({reseau: reseauAvecRecords({progression: sansPrenom(legende())}), local: fauxStockage()});
  assert.equal(await sansCode.api.demanderTicketDeCourse(), null);
  assert.equal(sansCode.reseau.records().length, 0, "sans code, rien ne part");
});

test("ticket : la page — demandé au lancement, le chrono attend le ticket, la fin de course l'attend aussi, et le verdict dit « Temps non compté » sans ticket", () => {
  // Au « C'est parti ! » : une seule demande, pendant le décompte.
  assert.match(html, /state\.ticketCourse = null;\s*state\.ticketCourseValeur = undefined;\s*if \(courseAvecTicket\(state\.configuration\)\) \{\s*const demande = demanderTicketDeCourse\(\);\s*state\.ticketCourse = demande;/);
  // Le chrono ne part qu'une fois le ticket là (ou refusé) : le « 1 » attend.
  assert.match(html, /state\.decompte = window\.setTimeout\(\(\) => \(n > 1 \? decompter\(n - 1\) : partirQuandLeTicketEstLa\(\)\), DECOMPTE_MS\);/);
  assert.match(html, /function partirQuandLeTicketEstLa\(\) \{\s*const demande = state\.ticketCourse;\s*if \(!demande \|\| state\.ticketCourseValeur !== undefined\) \{ partir\(\); return; \}/);
  // Le temps part avec le ticket, jamais sans.
  assert.match(html, /function noterCourse\(dixiemes, ticket\) \{\s*if \(!PARCOURS\.ticketDeCourseValide\(ticket\)\) return;/);
  assert.match(html, /appelRecords\(\{temps: course\.temps, justes: PARCOURS\.SEUILS\.course\.total, jour: course\.jour, course: course\.ticket\}\)/);
  // Le verdict honnête (décision de Gwenaël du 29/10/2026).
  assert.match(html, /const TEXTE_SANS_TICKET = "Temps non compté\\u00a0: pas de réseau au départ de la course\.";/);
  assert.match(html, /if \(state\.ticketCourseValeur === null\) \{\s*verdict\.classe = "is-neutre";\s*verdict\.icone = "⏱";\s*verdict\.titre = PARCOURS\.formatTemps\(dixiemes\);\s*verdict\.score = TEXTE_SANS_TICKET;/);
  // La fin de course attend la promesse, et dit la vérité sous la couronne aussi.
  assert.match(html, /Promise\.resolve\(demande\)\.then\(ticket => \{\s*if \(!PARCOURS\.ticketDeCourseValide\(ticket\)\) \{/);
  assert.match(html, /noterCourse\(dixiemes, ticket\);/);
});

test("ticket : le serveur — « depart » délivre un billet de type « course », l'arrivée l'exige, le lit sans le consommer avant le 409, le consomme avant d'écrire, et refuse un temps plus court que mesuré", async () => {
  const billets = await lire("../_serveur/public/lib/billets.php");
  assert.match(billets, /const TYPES_BILLET = \['entree', 'fiche', 'course'\];/);
  assert.match(billets, /const TYPES_BILLET_ENTREE = \['entree', 'fiche'\];/);
  assert.match(billets, /if \(!in_array\(\(string\)\$ligne\['type'\], TYPES_BILLET_ENTREE, true\)\) return null;/, "un ticket de course n'entre pas par api/eleve.php");
  assert.match(billets, /const DUREE_TICKET_COURSE = 8 \* 86400;/, "huit jours : une course finie hors ligne peut attendre");
  assert.match(billets, /function lire_ticket_de_course\(PDO \$pdo, int \$eleveId, string \$ticket\): \?array/);
  assert.match(billets, /function consommer_ticket_de_course\(PDO \$pdo, int \$eleveId, string \$ticket\): bool/);
  assert.match(apiRecords, /if \(!empty\(\$corps\['depart'\]\)\) \{\s*repondre\(\['ok' => true, 'course' => emettre_billet\(\$pdo, \$eleveId, 'course'\)\]\);/);
  assert.match(apiRecords, /\$depart = lire_ticket_de_course\(\$pdo, \$eleveId, \$ticket\);\s*if \(\$depart === null\) \{\s*erreur\("Le temps ne compte pas : la course n'a pas de ticket de départ\.", 400\);/);
  assert.match(apiRecords, /if \(!temps_plausible_depuis\(\$depart\['depart'\], \$temps\)\) \{/);
  // Relecture Codex (R3) : la consommation est jouée DANS la transaction qui écrit le record.
  assert.match(apiRecords, /fn\(\): bool => consommer_ticket_de_course\(\$pdo, \$eleveId, \$ticket\)\);\s*if \(isset\(\$resultat\['ticket'\]\)\) \{\s*erreur\("Le temps ne compte pas : ce ticket a déjà servi\.", 400\);/);
  assert.match(serveurRecords, /if \(\$consommer !== null && !\$consommer\(\)\) \{\s*transaction_annuler\(\$pdo\);\s*return \['ticket' => false\];/);
  // L'ordre : le ticket est LU avant le 409 « pas encore Légende » et CONSOMMÉ après.
  const lecture = apiRecords.indexOf("lire_ticket_de_course(");
  const legende = apiRecords.indexOf("if (!est_legende($pdo, $eleveId)) {");
  const consommation = apiRecords.indexOf("fn(): bool => consommer_ticket_de_course($pdo, $eleveId, $ticket)");
  assert.ok(lecture > 0 && lecture < legende && legende < consommation, "lu avant le 409, consommé après");
  assert.match(serveurRecords, /const MARGE_COURSE_DIXIEMES = 20;/);
  assert.match(serveurRecords, /function temps_plausible_depuis\(int \$depart, int \$dixiemes, \?int \$maintenant = null\): bool\s*\{\s*\$ecoule = \(\(\$maintenant \?\? time\(\)\) - \$depart\) \* 10;\s*return \$dixiemes <= \$ecoule \+ MARGE_COURSE_DIXIEMES;/);
});

test("relecture Codex R5 : le refus définitif (400) d'une vieille course n'efface que CETTE course — la neuve, avec son ticket, part ensuite", async () => {
  const ANCIEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const NEUF = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const reponse = (status, donnees) => ({status, json: async () => donnees, headers: {get: () => null}});
  const ligue = {ok: true, ouvert: true, legende: true, record: {meilleur: null, meilleurLe: null, semaine: null, lundi: null, nom: true},
    lundi: "2026-10-05", semaine: [], toujours: [], rangSemaine: null, rangToujours: null};
  const envoyes = [];
  let tenirLAncien = null;
  const reseau = {fetch(url, options) {
    const corps = options && options.body ? JSON.parse(String(options.body)) : {};
    const chemin = url.split("/").pop();
    if (chemin === "records.php") {
      if (corps.temps) {
        envoyes.push(corps);
        // L'ancien envoi reste en vol jusqu'à ce que le test le libère, puis est refusé pour de bon.
        if (corps.course === ANCIEN) return new Promise(r => { tenirLAncien = () => r(reponse(400, {ok: false, erreur: "Le temps ne compte pas."})); });
        return Promise.resolve(reponse(200, {...ligue, nouveau: true, avant: null, record: {...ligue.record, meilleur: corps.temps}}));
      }
      return Promise.resolve(reponse(200, ligue));
    }
    if (chemin === "eleve.php") return Promise.resolve(reponse(200, {ok: true, prenom: "Toti", classe: "306", reglages: {}}));
    if (corps.lire) return Promise.resolve(reponse(200, {ok: true, existe: true, parcours: sansPrenom(legende()), maj_le: null, revision: 1}));
    return Promise.resolve(reponse(200, {ok: true, maj_le: AUJ, revision: (corps.base_revision || 0) + 1}));
  }};
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  appli.api.noterCourse(200, ANCIEN);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(envoyes.length, 1, "l'ancienne course est partie (en vol)");
  appli.api.noterCourse(170, NEUF);
  assert.deepEqual(appli.api.sync.course, {temps: 170, jour: P.jourLocal(), ticket: NEUF}, "la neuve, meilleure, prend la place dans la case");
  tenirLAncien();
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(envoyes.map(c => c.course), [ANCIEN, NEUF], "le 400 de l'ancienne n'a pas effacé la neuve : elle est partie");
  assert.equal(appli.api.sync.course, undefined, "acceptée : plus rien en attente");
  assert.equal(appli.api.recordConnu().meilleur, 170);
});
