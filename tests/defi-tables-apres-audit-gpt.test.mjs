// Lot « après l'audit GPT du moteur » (14/10/2026) — les correctifs du tri du
// rapport GPT, décidés par Gwenaël :
//  D7  le chrono d'une série lit une horloge que les réglages de l'appareil ne
//      changent pas (performance.now) ;
//  D12 au retour du réseau, la course en attente repart aussi ;
//  D8  la course part avec son jour, et le serveur la classe dans SA semaine ;
//  D13 la carte dit « 4 ou 5 étapes » quand la marche 7 refaite peut se glisser
//      avant le test annoncé, sans écrire le test deux fois ;
//  D1  deux onglets du même code, hors ligne : la case de l'appareil fusionne ;
//  D5  étoiles marche par marche — seule la suivante se lance et compte, sauf la
//      couronne rejouée par la Légende ;
//  D4  « Retirer ce temps » dans Ma classe (page prof + serveur) ;
//  point 8 : « Lire la table » tient dans l'écran d'un ordinateur (deux colonnes).

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PARCOURS, html, fauxStockage, demarrerAppli, sansPrenom, entre} from "./defi-tables-faux-monde.mjs";

const P = PARCOURS;
const lire = async chemin => readFile(new URL(chemin, import.meta.url), "utf8");
const moteur = await lire("../outils/calcul_mental/defi_tables_mon_parcours.js");
const libRecords = await lire("../_serveur/public/lib/records.php");
const apiRecords = await lire("../_serveur/public/api/records.php");
const apiProf = await lire("../_serveur/public/api/prof.php");
const journal = await lire("../_serveur/public/lib/journal.php");
const pageProf = await lire("../_serveur/public/prof/index.php");
const lancer = await lire("../_serveur/tests/lancer.php");

const source = nom => {
  const debut = html.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `function ${nom} introuvable`);
  let fin = html.indexOf("\n      }\n", debut);
  return html.slice(debut, fin + 9);
};
const AUJ = "2026-10-14";
const jour = n => `2026-10-${String(n).padStart(2, "0")}`;

// ------------------------------------------------------------------ D7 : le chrono

test("D7 · horlogeSerie lit performance.now (et Date.now seulement s'il manque) ; partir, finish, updateTimer, les pauses et finishRevision s'en servent", () => {
  assert.match(source("horlogeSerie"), /return window\.performance && typeof window\.performance\.now === "function" \? window\.performance\.now\(\) : Date\.now\(\);/);
  assert.match(source("partir"), /state\.startAt = horlogeSerie\(\);\s*state\.endAt = DURATION === null \? 0 : state\.startAt \+ DURATION \* 1000;/);
  assert.match(source("finish"), /const elapsed = horlogeSerie\(\) - state\.startAt;/);
  assert.match(source("finishRevision"), /const elapsed = horlogeSerie\(\) - state\.startAt;/);
  assert.match(source("updateTimer"), /formatTime\(Math\.floor\(\(horlogeSerie\(\) - state\.startAt\) \/ 1000\)\)/, "la course : le chrono qui monte");
  assert.match(source("updateTimer"), /Math\.ceil\(\(state\.endAt - horlogeSerie\(\)\) \/ 1000\)/, "les séries à durée : le compte à rebours");
  // Lot « Mes calculs du jour sans chrono » (04/11/2026) : plus de pause de
  // chrono dans Mes calculs du jour ; le temps de chaque calcul se mesure sur
  // la même horloge.
  assert.match(html, /state\.questionAfficheeA = horlogeSerie\(\);/);
  assert.match(html, /PARCOURS\.reponseLente\(\(horlogeSerie\(\) - \(state\.questionAfficheeA \|\| 0\)\) \/ 1000\)/);
  // Plus aucun chrono de série sur Date.now : les seuls Date.now qui restent
  // sont des instants (sync.maj, derniers gestes, purge) ou la lecture d'une
  // correction, pas une mesure de temps de jeu.
  const chrono = [source("partir"), source("finish"), source("finishRevision"), source("updateTimer"), source("noterFinDeCourse")].join("\n");
  assert.doesNotMatch(chrono, /Date\.now/);
});

test("D7 · reculer l'horloge de l'appareil pendant une course ne raccourcit pas le temps : la mesure suit performance.now", () => {
  // Le même bout de code que la page (partir → finish), avec une fausse
  // fenêtre dont performance.now avance seul, et un Date.now qu'on recule.
  let tic = 50000;
  let heure = 1_700_000_000_000;
  const fenetre = {performance: {now: () => tic}, setInterval: () => 1, clearInterval() {}};
  const mesure = new Function("window", "Date", "state", "DURATION", "$", "renderQuestion", "ajusterEchelle", "updateTimer", `
    ${source("horlogeSerie")}
    ${source("partir")}
    return {partir, lire: () => horlogeSerie() - state.startAt};
  `)(fenetre, {now: () => heure}, {configuration: {course: "records"}}, null, () => ({disabled: false}), () => {}, () => {}, () => {});
  mesure.partir();
  tic += 48_200; // 48,2 s de course…
  heure -= 60_000; // …pendant lesquelles l'élève recule l'heure d'une minute.
  assert.equal(mesure.lire(), 48_200, "le temps mesuré est celui qui s'est vraiment écoulé");
});

// ------------------------------------------------------------- D12 : le réseau

test("D12 · reprendreLesEnvois relance la course en attente, pas seulement la progression", () => {
  assert.match(source("reprendreLesEnvois"), /if \(envoiPossible\(\) && sync\.dirty\) envoyerMaintenant\(\);\s*envoyerCourseEnAttente\(\);/);
});

function legende() {
  let p = P.creerParcours();
  P.TABLES.forEach(table => { p.tables[table].acquise = "2026-10-01"; });
  p.expert = {etoiles: 5, dernier: "2026-10-08", couronne: "2026-10-08"};
  p.melange.reussi = 9;
  p.calculsDuJour = AUJ;
  return P.normaliserParcours(p);
}

// Un réseau où les records sont d'abord muets, puis répondent (« reviens »).
function reseauCoupable(progression) {
  const appels = [];
  let records = "muet";
  const enVol = [];
  const reponse = (status, donnees) => ({status, json: async () => donnees, headers: {get: () => null}});
  const ligue = {ok: true, ouvert: true, legende: true, record: {meilleur: null, meilleurLe: null, semaine: null, lundi: null, nom: true},
    lundi: "2026-10-12", semaine: [], toujours: [], rangSemaine: null, rangToujours: null};
  const fetch = (url, options) => {
    const corps = options && options.body ? JSON.parse(String(options.body)) : {};
    const chemin = url.split("/").pop();
    appels.push({chemin, corps});
    if (chemin === "records.php") {
      // Muet : l'appel reste en vol (comme pendant les 8 s avant l'abandon),
      // et tombe en panne quand le réseau « revient » (reviens).
      if (records === "muet") return new Promise((_, rejeter) => enVol.push(rejeter));
      if (corps.temps) return Promise.resolve(reponse(200, {...ligue, nouveau: true, avant: null, record: {...ligue.record, meilleur: corps.temps}}));
      return Promise.resolve(reponse(200, ligue));
    }
    if (chemin === "eleve.php") return Promise.resolve(reponse(200, {ok: true, prenom: "Toti", classe: "306", reglages: {}}));
    if (corps.lire) return Promise.resolve(reponse(200, {ok: true, existe: true, parcours: progression, maj_le: null, revision: 1}));
    return Promise.resolve(reponse(200, {ok: true, maj_le: AUJ, revision: (corps.base_revision || 0) + 1}));
  };
  return {fetch, appels, reviens: () => { records = "ok"; enVol.splice(0).forEach(rejeter => rejeter(new TypeError("Failed to fetch"))); },
    courses: () => appels.filter(a => a.chemin === "records.php" && a.corps.temps).map(a => a.corps)};
}

test("D12 · en marche : records muets, une course attend ; le réseau revient (« online ») et la course part sans attendre un 200 du parcours", async () => {
  const reseau = reseauCoupable(sansPrenom(legende()));
  const appli = demarrerAppli({reseau, codeOnglet: "AXKQ7T", local: fauxStockage()});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  const TICKET = "0123456789abcdef0123456789abcdef"; // lot « correctifs de l'audit Codex » (29/10/2026)
  appli.api.noterCourse(512, TICKET);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli.api.sync.course.temps, 512, "en attente");
  const avant = reseau.courses().length;
  // Rien à envoyer côté parcours (sync.dirty faux) : avant le lot, « online »
  // ne faisait rien du tout. Et le premier envoi est encore en vol quand le
  // réseau revient : la relance attend qu'il retombe, puis repart une fois.
  assert.equal(appli.api.sync.dirty, false);
  appli.declencher("online");
  await new Promise(r => setTimeout(r, 5));
  assert.equal(reseau.courses().length, avant, "l'envoi en vol n'est pas doublé");
  reseau.reviens();
  await new Promise(r => setTimeout(r, 10));
  assert.equal(reseau.courses().length, avant + 1, "la course est partie au retour du réseau");
  assert.deepEqual(reseau.courses().at(-1), {code: "AXKQ7T", temps: 512, justes: 25, jour: P.jourLocal(), course: TICKET});
  assert.equal(appli.api.sync.course, undefined, "plus rien en attente");
});

// -------------------------------------------------------------- D8 : le jour

test("D8 · l'appli envoie le jour de la course avec le temps ; le serveur l'accepte (jour_de_course) et classe la course dans sa semaine", () => {
  assert.match(source("envoyerCourseEnAttente"), /appelRecords\(\{temps: course\.temps, justes: PARCOURS\.SEUILS\.course\.total, jour: course\.jour, course: course\.ticket\}\)/);
  // Depuis le 29/10/2026 (ticket de course, relecture Codex R3), le ticket se consomme dans la même transaction.
  assert.match(apiRecords, /enregistrer_course\(\$pdo, \$eleveId, \$temps, jour_de_course\(\$corps\['jour'\] \?\? null\),\s*fn\(\): bool => consommer_ticket_de_course\(\$pdo, \$eleveId, \$ticket\)\);/);
  // Le serveur : format strict, pas dans le futur, 7 jours au plus, sinon aujourd'hui.
  assert.match(libRecords, /const COURSE_JOURS_MAX = 7;/);
  assert.match(libRecords, /function jour_de_course\(mixed \$brut, \?string \$aujourdhui = null\): string/);
  assert.match(libRecords, /preg_match\('\/\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/', \$brut\) !== 1\) return \$aujourdhui;/);
  assert.match(libRecords, /if \(\$date > \$limite\) return \$aujourdhui;/, "pas dans le futur");
  assert.match(libRecords, /if \(\$date < \$limite->modify\('-' \. COURSE_JOURS_MAX \. ' days'\)\) return \$aujourdhui;/, "7 jours au plus");
  assert.match(libRecords, /function enregistrer_course\(PDO \$pdo, int \$eleveId, int \$dixiemes, \?string \$jour = null, \?callable \$consommer = null\): array/);
  assert.match(libRecords, /\$lundi = lundi_de\(\$jour\);/, "la semaine du jour de la course");
  assert.match(libRecords, /if \(\$lundiGarde !== '' && strcmp\(\$lundi, \$lundiGarde\) < 0\) \{/, "une course d'une semaine passée ne touche pas à la semaine gardée");
  assert.match(libRecords, /record_affichable\(record_de\(\$pdo, \$eleveId\), \$lundiCourant\)/, "ce qui est rendu reste lu sur la semaine en cours");
  // Les tests du serveur le jouent pour de bon.
  assert.match(lancer, /jour_de_course\(/);
  assert.match(lancer, /records — D8/);
});

// ----------------------------------------------------- D13 : « 4 ou 5 étapes »

function departSix() {
  let p = P.creerParcours();
  [2, 5, 10].forEach(table => { p.tables[table].acquise = "2026-10-01"; });
  p.melange.reussi = 3;
  p.tables[3].seance = {depart: 6, n: 4, dernier: jour(13)};
  p.calculsDuJour = AUJ;
  return P.normaliserParcours(p);
}

test("D13 · départ 6, test annoncé en 4e étape : la carte dit « 4 ou 5 étapes », le test n'est pas écrit deux fois, une minute de plus au plus", () => {
  const p = departSix();
  const programme = P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: AUJ, table: 3}), AUJ);
  // Mes calculs du jour déjà fait : la séance prend quatre marches, 5-6-7 et le test.
  assert.deepEqual(programme.etapes.map(etape => etape.nom), ["Dans le désordre", "Nombres manquants et divisions", "Résultats, nombres manquants et divisions", "Je passe le test"]);
  assert.equal(programme.etapes[3].conditionnelle, true);
  assert.equal(programme.raccourciEnFin, true, "« 4 ou 5 étapes » : la marche 7 refaite peut se glisser avant le test");
  assert.equal(programme.testDejaAnnonce, true, "pas de 5e ligne : le test est déjà la dernière");
  assert.equal(programme.minutes, 1 + 1 + 1 + 2, "le test annoncé compte 2 min");
  assert.equal(programme.minutesMax, programme.minutes + 1, "la marche 7 refaite : 1 min");
  // Cinq étapes déjà annoncées (Mes calculs du jour en plus, départ 5) : jamais de 6e.
  const q = P.normaliserParcours({...p, calculsDuJour: null, tables: {...p.tables, 3: {...p.tables[3], seance: {depart: 5, n: 4, dernier: jour(13)}}}});
  q.calculs["2-3"] = {boite: 1, cases: 0, vu: jour(13), erreur: jour(13), gagne: null, echeance: AUJ};
  const plein = P.programmeDeSeance(q, P.ouvrirSeance(q, {aujourdhui: AUJ, table: 3}), AUJ);
  if (plein.etapes.length === 5) {
    assert.equal(plein.raccourciEnFin, false);
    assert.equal(plein.testDejaAnnonce, false);
  }
  // Le cas d'avant le lot (la marche 7 en dernier, le test pas annoncé) n'a pas changé.
  const r = P.normaliserParcours({...p, tables: {...p.tables, 3: {...p.tables[3], seance: {depart: 4, n: 4, dernier: jour(13)}}}});
  const quatre = P.programmeDeSeance(r, P.ouvrirSeance(r, {aujourdhui: AUJ, table: 3}), AUJ);
  assert.equal(quatre.raccourciEnFin, true);
  assert.equal(quatre.testDejaAnnonce, false, "là, la 5e ligne du test s'écrit");
  assert.equal(quatre.minutesMax, quatre.minutes + 2);
});

test("D13 · la page : la 5e ligne du test ne s'ajoute que si le test n'est pas déjà dans la liste ; le compte dit « 4 ou 5 »", () => {
  const carte = source("carteDeSeance");
  assert.match(carte, /if \(enPlus && !programme\.testDejaAnnonce\) \{\s*const item = document\.createElement\("span"\);\s*item\.className = "en-plus";/);
  assert.match(carte, /\$\{enPlus && !programme\.testDejaAnnonce \? ` ; \$\{nombre \+ 1\}, \$\{NOM_DU_TEST\}, \$\{CONDITION_DU_TEST\}` : ""\}/, "l'aria-label suit");
  assert.match(carte, /`\$\{nombre\}\\u00a0ou\\u00a0\$\{nombre \+ 1\}\\u00a0étapes · environ\\u00a0\$\{minutes\}\\u00a0min`/);
});

// --------------------------------------------------------- D1 : deux onglets

test("D1 · sous un code, sauverCase fusionne avec la case de l'appareil avant d'écrire ; sans code, rien ne change", () => {
  assert.match(source("sauverCase"), /if \(suiviActif\(\)\) \{\s*const local = PARCOURS\.charger\(storage\(\), codeSuivi\);\s*if \(local\) parcours = PARCOURS\.fusionner\(local, parcours\);\s*PARCOURS\.sauver\(storage\(\), parcours, codeSuivi\);\s*return;\s*\}/);
  assert.match(source("sauverCase"), /ecrirePrenomOnglet\(parcours\.prenom\);\s*PARCOURS\.sauver\(storage\(\), PARCOURS\.definirPrenom\(parcours, ""\), ""\);/);
});

test("D1 · deux onglets du même code, hors ligne tous les deux : la table passée dans l'un et celle passée dans l'autre survivent toutes les deux", async () => {
  const CODE = "AXKQ7T";
  const local = fauxStockage();
  const session = fauxStockage();
  const reseau = {fetch: () => Promise.reject(new TypeError("Failed to fetch"))};
  const a = demarrerAppli({reseau, codeOnglet: CODE, local, session});
  const b = demarrerAppli({reseau, codeOnglet: CODE, local, session});
  a.api.demarrerSuivi();
  b.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(a.api.suiviActif(), true);
  assert.equal(b.api.suiviActif(), true);
  // L'onglet A passe la table de 2, l'onglet B la table de 5, chacun dans sa
  // mémoire, puis chacun range sa case.
  a.api.parcours = P.appliquerSerie(a.api.parcours, P.configValidation(2), {correct: 20, total: 20, date: AUJ}).parcours;
  a.api.sauverParcours();
  b.api.parcours = P.appliquerSerie(b.api.parcours, P.configValidation(5), {correct: 20, total: 20, date: AUJ}).parcours;
  b.api.sauverParcours();
  await new Promise(r => setTimeout(r, 5));
  const durable = P.charger(local, CODE);
  assert.deepEqual(P.tablesAcquises(durable), [2, 5], "les deux tables sont dans la case de l'appareil");
  assert.deepEqual(P.tablesAcquises(b.api.parcours), [2, 5], "l'onglet qui a écrit en second a repris la fusion");
  // Avant le lot, B écrasait A : seule la table de 5 restait.
  const ecrasement = P.appliquerSerie(P.creerParcours(), P.configValidation(5), {correct: 20, total: 20, date: AUJ}).parcours;
  assert.deepEqual(P.tablesAcquises(ecrasement), [5]);
});

// --------------------------------------------------- D5 : étoiles verrouillées

function neufTables(etoiles = 0, couronne = null) {
  let p = P.creerParcours();
  P.TABLES.forEach(table => { p.tables[table].acquise = "2026-10-01"; });
  p.expert = {etoiles, dernier: etoiles ? "2026-10-08" : null, couronne};
  return P.normaliserParcours(p);
}

test("D5 · le moteur : seule l'étoile suivante classe une série ; une étoile plus loin, ou déjà gagnée, ne compte pas ; la couronne gagnée se rejoue", () => {
  const zero = neufTables();
  assert.deepEqual(P.classerSerie(zero, P.configEtoile(1)), {type: "etoile", etoile: 1});
  [2, 3, 4, 5].forEach(etoile => assert.equal(P.classerSerie(zero, P.configEtoile(etoile)), null, `★ manquante : ${etoile} ne compte pas`));
  const trois = neufTables(3);
  assert.equal(P.classerSerie(trois, P.configEtoile(2)), null, "gagnée : ne compte pas");
  assert.deepEqual(P.classerSerie(trois, P.configEtoile(4)), {type: "etoile", etoile: 4});
  assert.equal(P.classerSerie(trois, P.configEtoile(5)), null, "la couronne attend ★★★★");
  // 0 étoile, 25 sur 25 en 1 min (👑) : plus de Légende d'un coup.
  const saut = P.appliquerSerie(zero, P.configEtoile(5), {correct: 25, total: 25, date: AUJ});
  assert.deepEqual(saut.evenements, []);
  assert.equal(saut.parcours.expert.couronne, null);
  assert.equal(saut.parcours.expert.etoiles, 0);
  // La Légende rejoue sa couronne : la série compte (entretien), rien ne change.
  const legendeDesTables = neufTables(5, "2026-10-08");
  assert.deepEqual(P.classerSerie(legendeDesTables, P.configEtoile(5)), {type: "etoile", etoile: 5});
  assert.equal(P.classerSerie(legendeDesTables, P.configEtoile(4)), null);
  const rejouee = P.appliquerSerie(legendeDesTables, P.configEtoile(5), {correct: 25, total: 25, date: AUJ});
  assert.equal(rejouee.evenements[0].nouveau, false);
  assert.equal(rejouee.parcours.expert.couronne, "2026-10-08", "la première date reste");
  // La séance propose toujours la suivante (et la couronne pour la Légende) :
  // ce qu'elle propose est accepté par classerSerie.
  [zero, trois, legendeDesTables].forEach(p => {
    const etape = P.etapeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: AUJ}), AUJ);
    if (etape && etape.type === "etoile") assert.ok(P.classerSerie(p, etape.config), `la séance : ${etape.nom} compte`);
  });
  // Le commentaire d'en-tête ne promet plus « une étoile réussie valide les précédentes ».
  assert.doesNotMatch(moteur, /Une étoile réussie valide les précédentes/);
  assert.match(moteur, /Marche par marche : seule l'étoile\s*\/\/\s*SUIVANTE compte/);
});

test("D5 · Mon parcours : seule la marche suivante se lance ; les gagnées et les suivantes n'ont pas de config ; la couronne gagnée reste jouable", () => {
  const zone = entre("        // Lot « après l'audit GPT » (D5, décision de Gwenaël du 14/10/2026) :", "        expert.append(expertHead, stars);");
  assert.match(zone, /const jouable = expertOuvert && \(marche\.suivante \|\| \(marche\.gagnee && marche\.etoile === PARCOURS\.ETOILES_MAX\)\);/);
  assert.match(zone, /config: jouable \? marche\.config : null,/);
  assert.match(zone, /action: jouable \? null : \(\) => \{\}/, "sans config ni action, makeCell ne poserait pas aria-disabled");
  assert.match(zone, /extraClass: `n\$\{marche\.etoile\}\$\{!expertOuvert \|\| \(!jouable && !marche\.gagnee\) \? " is-fermee" : ""\}`/, "les marches plus loin : grises, en pointillés ; les gagnées : dorées");
  assert.match(zone, /" — plus tard"/);
  assert.match(html, /Rejoue la couronne quand tu veux depuis Mon parcours\./, "l'accueil d'une Légende sans records ne promet plus « une marche »");
  assert.doesNotMatch(html, /Rejoue une marche quand tu veux/);
  // etatAffichage dit déjà « suivante » : ce que la page lit.
  const etat = P.etatAffichage(neufTables(2));
  assert.deepEqual(etat.expert.marches.map(m => [m.etoile, m.gagnee, m.suivante]), [[1, true, false], [2, true, false], [3, false, true], [4, false, false], [5, false, false]]);
});

// ----------------------------------------------------- D4 : « Retirer ce temps »

test("D4 · le serveur : records.retirer, propriétaire seulement, journalisé ; retirer_temps efface le record et la semaine, garde le nom", () => {
  assert.match(apiProf, /'records\.retirer' => 'proprietaire',/);
  assert.match(apiProf, /case 'records\.retirer':[\s\S]*?\$eleve = eleve_pour_action\(\$pdo, \$profId, \$corps\['eleve_id'\] \?\? 0, \$action\);\s*\$retire = retirer_temps\(\$pdo, \(int\)\$eleve\['id'\]\);\s*journaliser\(\$pdo, \$profId, 'records\.retirer', 'eleve', \(int\)\$eleve\['id'\]\);\s*repondre\(\['ok' => true, 'retire' => \$retire\] \+ ligue\(\$pdo, \$profId, null, true\)\);/);
  assert.match(journal, /'records\.retirer',/);
  assert.match(libRecords, /function retirer_temps\(PDO \$pdo, int \$eleveId\): bool/);
  assert.match(libRecords, /UPDATE records SET meilleur = NULL, meilleur_le = NULL, semaine = NULL, semaine_lundi = NULL, maj_le = \?\s*WHERE eleve_id = \? AND meilleur IS NOT NULL/, "le choix du nom (colonne nom) n'est pas touché");
  // La ligue du professeur porte l'élève derrière chaque ligne ; celle de l'élève, non.
  assert.match(libRecords, /function ligue\(PDO \$pdo, int \$profId, \?int \$eleveId = null, bool \$pourProf = false\): array/);
  assert.match(libRecords, /if \(\$pourProf\) \{\s*\$prenom = trim\(\(string\)\$ligne\['prenom'\]\);\s*\$rendu\['eleve'\] = \['id' => \$id, 'prenom' => \$prenom === '' \? 'Élève' : \$prenom, 'classe' => \(string\)\$ligne\['libelle'\]\];\s*\}/);
  assert.match(apiProf, /case 'records\.ligue':[\s\S]*?repondre\(\['ok' => true\] \+ ligue\(\$pdo, \$profId, null, true\)\);/);
  assert.match(apiRecords, /\+ ligue\(\$pdo, \$contexte\['prof_id'\], \$eleveId\) \+ \$enPlus/, "l'appli élève : sans identités");
  // La matrice des droits testée côté serveur suit.
  assert.match(lancer, /'records\.retirer' => 'proprietaire',/);
  assert.match(lancer, /records — D4/);
});

test("D4 · la page prof : « Retirer » au bout de chaque ligne de la carte (pas du plein écran), confirmation avec prénom et classe, message, tableau relu", () => {
  assert.match(pageProf, /function ligneDeRecord\(ligne, retirable = false\) \{/);
  assert.match(pageProf, /if \(retirable && ligne\.eleve\) \{\s*const retirer = document\.createElement\("button"\);\s*retirer\.type = "button";\s*retirer\.className = "rec-retirer";\s*retirer\.textContent = "Retirer";\s*retirer\.title = "Retirer ce temps";/);
  assert.match(pageProf, /liste\.append\(ligneDeRecord\(ligne, true\)\)/, "la carte : retirable");
  assert.match(pageProf, /\(ligueRecords\[cle\] \|\| \[\]\)\.forEach\(ligne => liste\.append\(ligneDeRecord\(ligne\)\)\);/, "le plein écran : sans bouton");
  assert.match(pageProf, /const reponse = await demander\(`Retirer le temps \$\{deNom\(qui\)\} \(\$\{formatTempsRecord\(ligne\.temps\)\}\) \? Son record et son temps de la semaine s’effacent\. Sa prochaine course compte à nouveau\.`,\s*null, \{oui: "Retirer ce temps", danger: true\}\);\s*if \(!reponse\) return;/);
  assert.match(pageProf, /const qui = `\$\{ligne\.eleve\.prenom\} · \$\{ligne\.eleve\.classe\}`;/, "le vrai prénom, même pour une ligne « Mystère »");
  assert.match(pageProf, /const donnees = await api\("records\.retirer", \{eleve_id: ligne\.eleve\.id\}\);\s*ligueRecords = donnees;\s*dessinerRecords\(\);\s*messager\("message-records", `Le temps \$\{deNom\(qui\)\} est retiré\.`, "ok"\);/);
  assert.match(pageProf, /if \(classe\) await ouvrirClasse\(classe\.id\);/, "le temps à côté de la couronne, dans le tableau, est relu");
  assert.match(pageProf, /<p class="message" id="message-records" hidden><\/p>/);
  assert.match(pageProf, /\.rec-carte \.rec-liste li \{ grid-template-columns: 30px minmax\(0, 1fr\) auto auto; \}/);
  assert.match(pageProf, /\.rec-retirer \{ min-height: 32px;/);
});

test("qui est Mystère (serveur pro, 25/10/2026) · dans la carte seulement, le professeur voit « Mystère (Léa · 405) » ; le plein écran et l'appli gardent « Mystère »", () => {
  // Dans la carte (retirable), sous « Mystère », le prénom et la classe que
  // le serveur rend au seul professeur (records.ligue, D4).
  assert.match(pageProf, /if \(retirable && ligne\.eleve && ligne\.nom === "Mystère"\) \{\s*const qui = document\.createElement\("span"\);\s*qui\.className = "rec-qui";\s*qui\.textContent = ligne\.eleve\.prenom === "Élève" \? `\(\$\{ligne\.eleve\.classe\}\)` : `\(\$\{ligne\.eleve\.prenom\} · \$\{ligne\.eleve\.classe\}\)`;\s*nom\.classList\.add\("avec-qui"\);\s*nom\.append\(" ", qui\);\s*\}/);
  // Écrit par textContent : un prénom n'est jamais lu comme du HTML.
  assert.doesNotMatch(pageProf, /qui\.innerHTML/);
  // Le plein écran (qu'on projette) appelle ligneDeRecord sans « retirable » :
  // jamais de parenthèse.
  assert.match(pageProf, /\(ligueRecords\[cle\] \|\| \[\]\)\.forEach\(ligne => liste\.append\(ligneDeRecord\(ligne\)\)\);/);
  // Toujours sur la ligne du dessous, jamais coupée ni posée sur le temps.
  assert.match(pageProf, /\.rec-liste \.nom\.avec-qui \{ white-space: normal; overflow: visible; \}/);
  assert.match(pageProf, /\.rec-qui \{ display: block; color: var\(--muted\);/);
  // L'appli des élèves ne reçoit toujours aucune identité.
  assert.match(apiRecords, /\+ ligue\(\$pdo, \$contexte\['prof_id'\], \$eleveId\) \+ \$enPlus/);
});

// ------------------------------------------------ point 8 : « Lire la table »

test("point 8 · « Lire la table » sur ordinateur : deux colonnes de six et cinq lignes, les deux liens côte à côte, la note sous le premier ; rien ne change en dessous de 1024 px", () => {
  const regle = entre("       1366 × 768 (règle : le cadre tient toujours entier). */\n", "    }\n");
  assert.match(regle, /^    @media \(min-width: 1024px\) \{\n      \.lire-screen \{ max-width: 760px; \}/);
  assert.match(regle, /\.lire-liste \{ grid-template-columns: 1fr 1fr; grid-template-rows: repeat\(6, auto\); grid-auto-flow: column; column-gap: 14px; \}/);
  assert.match(regle, /\.lire-liens \{ display: grid; grid-template-columns: auto auto; justify-content: center; align-items: start; gap: 8px 18px; margin-top: 16px; \}/);
  assert.match(regle, /\.lire-liens \.lire-note \{ grid-column: 1; margin: 0; \}/);
  assert.match(regle, /\.lire-liens \.lire-toutes \{ grid-column: 2; grid-row: 1; \}/);
  // Le balisage : les deux liens et la note dans un bloc, sous la liste.
  assert.match(html, /<ol id="lire-liste" class="lire-liste"><\/ol>\s*<div class="lire-liens">\s*<a id="lire-cartes"/);
  assert.match(html, /<span>Toutes les tables sur une page<\/span><\/a>\s*<\/div>\s*<\/div>\s*<div id="fiche"/);
  // Hors de l'écran large, la liste reste une colonne (la règle de base ne change pas).
  assert.match(html, /\.lire-liste \{ display: grid; gap: 6px; margin: 14px 0 0; padding: 0; list-style: none; \}/);
});

// ------------------------------------------------------------- l'hygiène du lot

test("le moteur a changé : son numéro de cache monte, et la copie de la page prof est identique", async () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-1/);
  const copie = await readFile(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  const original = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(copie.equals(original));
});
