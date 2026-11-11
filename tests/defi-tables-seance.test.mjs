// Lot « Ma séance du jour », lot 1 (02/10/2026) : la rangée d'une table, les
// bouts, l'échelle à décalage, le raccourci vers la validation, le compte des
// séances — dans le moteur — et, dans la page, la clé ?seance=1 qui cache tout.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");
const applis = readFileSync(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");

const J1 = "2026-10-05"; // un lundi
// Le départ et le compte d'une table (lot 2 : « seance » porte aussi « dernier », testé à part).
const departN = seance => ({depart: seance.depart, n: seance.n});
const jour = n => P.ajouterJours(J1, n - 1);

// Joue une étape comme la page : la série est appliquée au parcours (réponses
// puis série), puis l'étape est notée. « erreurs » : le nombre de calculs ratés.
let tour = 0;
function jouerEtape(parcours, seance, etape, date, erreurs = 0) {
  let p = parcours;
  let resultat;
  if (etape.type === "revision") {
    const plan = P.planRevision(p, {aujourdhui: date, random: () => 0.5});
    plan.forEach((question, index) => { p = P.appliquerReponse(p, question.cle, {correcte: index >= erreurs, date}).parcours; });
    resultat = {juste: plan.length - Math.min(erreurs, plan.length), total: plan.length};
  } else if (etape.type === "apprends") {
    const total = etape.cle === "gaps" ? 8 : 11;
    p = P.appliquerSerie(P.demarrerSerie(p, etape.config), etape.config, {correct: total, total, date}).parcours;
    resultat = {juste: etape.cle === "beads" ? total : total - erreurs, total};
  } else {
    const tables = etape.config.tables;
    const total = etape.config.total;
    tour += 3;
    for (let index = 0; index < total; index += 1) {
      const table = tables[index % tables.length];
      const multiplicateur = 1 + (index % 10);
      // Les erreurs tournent d'une série à l'autre (pas toujours le même calcul).
      const rate = erreurs > 0 && (index + tour) % total < erreurs;
      p = P.appliquerReponse(p, `${table}-${multiplicateur}`, {correcte: !rate, date}).parcours;
    }
    const suivi = P.appliquerSerie(p, etape.config, {correct: total - erreurs, total, date});
    p = suivi.parcours;
    const principal = suivi.evenements.find(evenement => typeof evenement.reussi === "boolean");
    resultat = {juste: total - erreurs, total, reussi: Boolean(principal && principal.reussi)};
  }
  return P.noterEtape(p, seance, etape, resultat, date);
}

// Joue une séance entière ; erreursPar(etape, rang) donne les erreurs de chaque étape.
function jouerSeance(parcours, date, erreursPar = () => 0, table = null) {
  let p = parcours;
  let seance = P.ouvrirSeance(p, {aujourdhui: date, table});
  const noms = [];
  for (let garde = 0; garde < 12 && !seance.finie; garde += 1) {
    const etape = P.etapeDeSeance(p, seance, date);
    if (!etape) break;
    noms.push(etape.type === "validation" ? "validation" : etape.type === "revision" ? "revision" : etape.type === "melange" ? "melange" : etape.marche);
    ({parcours: p, seance} = jouerEtape(p, seance, etape, date, erreursPar(etape, garde)));
  }
  return {parcours: p, seance, noms};
}

// Lot « retours de classe » : une séance qui a réussi sa marche 7 à 9 sur 10.
const septReussie = (seance = {}) => ({...seance, faites: [...(seance.faites || []), {type: "entraine", marche: 7, juste: 9, total: 10, rate: false, reussi: null}]});

const nomsDe = (parcours, date, table = null) => P.programmeDeSeance(parcours, P.ouvrirSeance(parcours, {aujourdhui: date, table}), date).etapes.map(etape => etape.conditionnelle ? `${etape.nom} (si prêts)` : etape.nom);

test("la rangée : dix cases, les résultats ; vide, entourée (boîte 2), pleine (boîte 3) ; les bouts à la première réussite", () => {
  let p = P.creerParcours();
  let rangee = P.rangeeTable(p, 3);
  assert.deepEqual(rangee.cases.map(item => item.produit), [3, 6, 9, 12, 15, 18, 21, 24, 27, 30]);
  assert.deepEqual(rangee.cases.map(item => item.bout), [true, false, false, false, false, false, false, false, false, true], "× 1 et × 10 sont les deux bouts, pas de 0");
  assert.ok(rangee.cases.every(item => item.etat === "vide"));
  p = P.appliquerReponse(p, "3-7", {correcte: true, date: jour(1)}).parcours;
  assert.equal(P.rangeeTable(p, 3).cases[6].etat, "entouree", "une réussite : boîte 2, la case est entourée");
  p = P.appliquerReponse(p, "3-7", {correcte: true, date: jour(1)}).parcours;
  assert.equal(P.rangeeTable(p, 3).cases[6].etat, "entouree", "le même jour, rien ne monte");
  p = P.appliquerReponse(p, "3-7", {correcte: true, date: jour(2)}).parcours;
  assert.equal(P.rangeeTable(p, 3).cases[6].etat, "pleine", "le lendemain : boîte 3, la case est pleine");
  p = P.appliquerReponse(p, "7-3", {correcte: false, date: jour(3)}).parcours;
  assert.equal(P.rangeeTable(p, 3).cases[6].etat, "entouree", "une erreur : une boîte de moins");
  // Les bouts : hors des boîtes et de la grille des 36.
  const raté = P.appliquerReponse(p, "1-3", {correcte: false, date: jour(3)});
  assert.equal(raté.parcours, p, "un bout raté ne change rien");
  const bout = P.appliquerReponse(p, "1-3", {correcte: true, date: jour(3)});
  assert.equal(bout.fait, null, "un bout n'est pas un calcul de la grille");
  assert.deepEqual(bout.bouts, [[3, 1]]);
  p = bout.parcours;
  assert.equal(P.rangeeTable(p, 3).cases[0].etat, "pleine", "plein dès la première réussite");
  assert.equal(Object.keys(p.calculs).length, 1, "rien n'entre dans la grille des 36");
  assert.equal(P.appliquerReponse(p, "3-1", {correcte: false, date: jour(4)}).parcours.tables[3].bouts.length, 1, "un bout réussi ne se vide plus");
  p = P.appliquerReponse(p, "10-3", {correcte: true, date: jour(3)}).parcours;
  assert.deepEqual(p.tables[3].bouts, [1, 10]);
  assert.deepEqual(p.tables[10].bouts, [3], "3 × 10 est aussi une case de la table de 10");
  assert.equal(P.appliquerReponse(p, "0-3", {correcte: true}).parcours, p, "pas de 0");
  assert.equal(P.appliquerReponse(p, "1-1", {correcte: true}).parcours, p, "la table de 1 n'est pas du parcours");
});

test("la table de 10 a sa rangée (10 à 100) : dix bouts ; « prête » = les dix cases pleines", () => {
  let p = P.creerParcours();
  assert.deepEqual(P.multiplicateursBouts(10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(P.multiplicateursBouts(7), [1, 10]);
  assert.equal(P.rangeeTable(p, 10).prete, false, "une rangée vide n'est pas prête (avant : 0 calcul sur 0, donc prête)");
  for (let m = 1; m <= 10; m += 1) p = P.appliquerReponse(p, `10-${m}`, {correcte: true, date: jour(1)}).parcours;
  assert.deepEqual(P.rangeeTable(p, 10).cases.map(item => item.produit), [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  assert.equal(P.rangeeTable(p, 10).prete, true);
  // Une table de la grille : les 8 calculs en boîte 3 ET les deux bouts.
  let q = P.creerParcours();
  for (const date of [jour(1), jour(2)]) for (let m = 2; m <= 9; m += 1) q = P.appliquerReponse(q, `4-${m}`, {correcte: true, date}).parcours;
  assert.equal(P.rangeeTable(q, 4).pleines, 8);
  assert.equal(P.rangeeTable(q, 4).prete, false, "il manque les deux bouts");
  q = P.appliquerReponse(P.appliquerReponse(q, "4-1", {correcte: true}).parcours, "4-10", {correcte: true}).parcours;
  assert.equal(P.rangeeTable(q, 4).prete, true);
});

test("le parcours : des clés en plus, sans changer de version ; une clé absente vaut son départ ; un JSON forgé est nettoyé", () => {
  assert.equal(P.VERSION, 5, "pas de migration : la version ne change pas (4 : le lot S1 « les journaux », 5 : le lot « le jour vert », plus tard)");
  const neuf = P.creerParcours();
  assert.deepEqual(neuf.tables[7].bouts, []);
  assert.deepEqual(departN(neuf.tables[7].seance), {depart: 1, n: 0});
  assert.deepEqual(neuf.tables[7].sansFaute, {desordre: 0, trous: 0});
  assert.deepEqual(neuf.seances, []);
  const ancien = JSON.parse(JSON.stringify(neuf));
  delete ancien.seances;
  P.TABLES.forEach(table => { delete ancien.tables[table].bouts; delete ancien.tables[table].seance; delete ancien.tables[table].sansFaute; });
  assert.deepEqual(P.normaliserParcours(ancien), neuf, "un parcours d'avant le lot se lit comme un parcours neuf");
  const forge = JSON.parse(JSON.stringify(neuf));
  forge.tables[7].bouts = [10, 3, "1", 10, 99, "<b>"];
  forge.tables[7].seance = {depart: 42, n: -3, texte: "bonjour"};
  forge.tables[7].sansFaute = {desordre: 7, trous: 1, mixte: 1};
  forge.seances = ["2026-10-06", "pas une date", "2026-10-05", "2026-10-06", 12];
  const propre = P.normaliserParcours(forge);
  assert.deepEqual(propre.tables[7].bouts, [1, 10]);
  assert.deepEqual(departN(propre.tables[7].seance), {depart: 1, n: 0});
  assert.deepEqual(propre.tables[7].sansFaute, {desordre: 0, trous: 1});
  assert.deepEqual(propre.seances, ["2026-10-05", "2026-10-06", "2026-10-06"]);
  assert.equal(P.estVide(P.appliquerReponse(neuf, "1-3", {correcte: true}).parcours), false, "un bout réussi est déjà du travail");
});

test("la séance : Mes calculs du jour seulement s'il y a des calculs des tables passées, Mon mélange seulement aux paliers, puis les marches qui se suivent — quatre étapes (lot M2)", () => {
  let p = P.creerParcours();
  assert.deepEqual(P.MARCHES.map(m => m.nom), ["Les perles", "Je construis la bande", "La bande à trous", "Dans l’ordre", "Dans le désordre", "Nombres manquants et divisions", "Résultats, nombres manquants et divisions", "Je passe le test"]);
  assert.deepEqual(nomsDe(p, jour(1)), ["Les perles", "Je construis la bande", "La bande à trous", "Dans l’ordre"], "jour 1 : marches 1 à 4 de la table de 2 (lot M2 : toujours 4 étapes)");
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(1)}).table, 2, "sans choix, la première table de l'ordre conseillé");
  assert.deepEqual(nomsDe(p, jour(1), 7), ["Les perles", "Je construis la bande", "La bande à trous", "Dans l’ordre"]);
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(1), table: 7}).table, 7, "le changement de table est libre");
  p.tables[2].seance = {depart: 3, n: 2};
  p = P.appliquerReponse(p, "2-6", {correcte: true, date: jour(1)}).parcours;
  // Lot « un seul système » : un calcul dû de la table EN COURS reste à ses
  // marches — sans table passée, jamais de « Mes calculs du jour » : 4 marches.
  assert.equal(P.calculsDus(p, {aujourdhui: jour(2)}).length, 1, "le calcul est bien dû…");
  assert.deepEqual(nomsDe(p, jour(2)), ["La bande à trous", "Dans l’ordre", "Dans le désordre", "Nombres manquants et divisions"], "… mais aucune table n'est passée : pas de Mes calculs du jour, quatre marches");
  assert.equal(P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: jour(2)}), jour(2)).minutes, 4, "lot M1 : les durées mesurées (chaque marche 1)");
  // Une table passée AUJOURD'HUI n'entre dans Mes calculs du jour que demain.
  p.tables[2].acquise = jour(2); p.tables[10].acquise = jour(2);
  p = P.normaliserParcours(p);
  assert.deepEqual(nomsDe(p, jour(2)), ["Les perles", "Je construis la bande", "La bande à trous", "Dans l’ordre"], "passée aujourd'hui : pas encore de révision, quatre marches de la table suivante");
  // Passée AVANT aujourd'hui : son calcul dû ouvre la séance — trois marches
  // derrière, et plus jamais de mélange (deux tables passées, mélange jamais joué).
  p.tables[2].acquise = jour(1); p.tables[10].acquise = jour(1);
  p = P.normaliserParcours(p);
  assert.equal(P.melangeDu, undefined, "le verrou du mélange est retiré du moteur");
  assert.deepEqual(nomsDe(p, jour(2)), ["Mes calculs du jour", "Les perles", "Je construis la bande", "La bande à trous"], "avec révision : trois marches, quatre étapes, pas de mélange");
  assert.ok(P.ouvrirSeance(p, {aujourdhui: jour(2)}).file.every(prevue => prevue.type !== "melange"));
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(2)}).table, 5);
  // Une table passée, choisie exprès : ses trois entraînements, rien ne bouge.
  assert.deepEqual(nomsDe(p, jour(2), 2), ["Mes calculs du jour", "Dans le désordre", "Nombres manquants et divisions", "Résultats, nombres manquants et divisions"]);
  const acquise = jouerSeance(p, jour(2), () => 0, 2);
  assert.deepEqual(departN(acquise.parcours.tables[2].seance), {depart: 3, n: 2}, "le départ d'une table passée ne bouge pas");
  // Lot « Mon mélange aux paliers » (09/10/2026, décision de Gwenaël) : une
  // 3e table passée, la coupe des 3 pas gagnée — Mon mélange en 2e étape,
  // deux marches derrière (quatre étapes en tout).
  p.tables[5].acquise = jour(1);
  p = P.normaliserParcours(p);
  assert.deepEqual(nomsDe(p, jour(2)), ["Mes calculs du jour", "Mon mélange", "Les perles", "Je construis la bande"], "3 tables passées : Mon mélange, puis deux marches");
  p.melange.reussi = 3;
  p = P.normaliserParcours(p);
  assert.ok(P.ouvrirSeance(p, {aujourdhui: jour(2)}).file.every(prevue => prevue.type !== "melange"), "la coupe des 3 gagnée : plus de mélange avant 6 tables");
  // Les 9 tables passées : plus de marches — Mes calculs du jour, puis
  // l'étoile (l'escalier s'ouvre sans mélange). Lot « Mon mélange aux
  // paliers » : plus de Mon mélange des 9 tables avant l'étoile (lot « Mon
  // mélange sur l'accueil et l'expert ») — il était plus dur qu'elle.
  P.TABLES.forEach(table => { p.tables[table].acquise = jour(1); });
  p = P.normaliserParcours(p);
  assert.equal(P.tableDeSeance(p), null);
  assert.deepEqual(nomsDe(p, jour(2)), ["Mes calculs du jour", "Tente ★"], "Mes calculs du jour, puis l'étoile — même sans la coupe des 6");
});

test("l’échelle à décalage : +1 par séance finie, +2 quand les marches sont sans faute, jamais plus loin que le départ 6 (5-6-7-8 au sommet, lot M2)", () => {
  let p = P.creerParcours();
  // Une erreur dans la bande : la séance est finie, pas sans faute.
  let s = jouerSeance(p, jour(1), etape => (etape.cle === "construct" ? 1 : 0));
  assert.deepEqual(s.noms, [1, 2, 3, 4]);
  assert.equal(s.seance.finie, true);
  assert.deepEqual(departN(s.parcours.tables[2].seance), {depart: 2, n: 1}, "jour 2 : marches 2 à 5");
  assert.equal(s.seance.avance, 1);
  s = jouerSeance(s.parcours, jour(2));
  assert.deepEqual(s.noms, [2, 3, 4, 5]);
  assert.deepEqual(departN(s.parcours.tables[2].seance), {depart: 4, n: 2}, "tout sans faute : deux marches d'un coup");
  assert.equal(s.seance.avance, 2);
  // Les perles ne se ratent pas : elles comptent sans faute.
  s = jouerSeance(P.creerParcours(), jour(1));
  assert.equal(s.parcours.tables[2].seance.depart, 3);
  // Jamais plus loin que 6.
  let q = P.creerParcours();
  q.tables[2].seance = {depart: 6, n: 5};
  s = jouerSeance(q, jour(1), () => 1);
  assert.equal(s.parcours.tables[2].seance.depart, 6);
  assert.equal(P.SEUILS.seance.departMax, 6);
  // « Encore une séance » le même jour : la séance du jour suivant.
  s = jouerSeance(P.creerParcours(), jour(1), () => 1);
  const encore = jouerSeance(s.parcours, jour(1), () => 1);
  assert.deepEqual(encore.noms, [2, 3, 4, 5], "le même jour, la séance suivante est décalée d'une marche");
  assert.deepEqual(encore.parcours.seances, [jour(1), jour(1)]);
});

test("une marche ratée : moins de 7 sur 10 ; la marche d'en dessous, la marche ratée refaite, puis la suite ; le départ redescend tout de suite", () => {
  assert.equal(P.marcheRatee(7, 10), false, "7 sur 10 n'est pas raté");
  assert.equal(P.marcheRatee(6, 10), true, "6 sur 10 est raté");
  assert.equal(P.marcheRatee(8, 11), false);
  assert.equal(P.marcheRatee(7, 11), true, "sur les 11 cases de la bande : 4 erreurs");
  assert.equal(P.marcheRatee(6, 8), false);
  assert.equal(P.marcheRatee(5, 8), true, "sur les 8 trous : 3 erreurs");
  // « Je construis la bande » ratée → les perles, la bande refaite, puis la bande à trous.
  let p = P.creerParcours();
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(1)});
  ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1)));
  const note = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1), 4);
  assert.equal(note.faite.rate, true);
  assert.deepEqual(note.seance.file.map(prevue => prevue.marche), [1, 2, 3], "les perles, la bande refaite, puis la suite prévue");
  assert.deepEqual(departN(note.parcours.tables[2].seance), {depart: 1, n: 1}, "le départ est descendu TOUT DE SUITE (onglet fermé ou non)");
  assert.deepEqual(note.parcours.seances, [], "la séance n'est pas finie");
  // La reprise réussie : la séance continue, elle avance d'UNE marche (jamais de deux).
  let rang = 0;
  let s = jouerSeance(P.creerParcours(), jour(1), etape => (etape.marche === 2 && rang++ === 0 ? 4 : 0));
  assert.deepEqual(s.noms, [1, 2, 1, 2, 3], "jour 1 avec la bande ratée une fois : cinq étapes");
  assert.equal(s.seance.finie, true);
  assert.deepEqual(s.parcours.seances, [jour(1)]);
  assert.equal(s.parcours.tables[2].seance.depart, 2, "raté réparé : +1, pas +2");
  // La reprise ratée aussi : la séance s'arrête, le lendemain repart un cran plus bas.
  let q = P.creerParcours();
  q.tables[3].seance = {depart: 2, n: 1};
  s = jouerSeance(q, jour(1), etape => (etape.marche === 3 ? 4 : 0), 3);
  assert.deepEqual(s.noms, [2, 3, 2, 3], "bande à trous ratée deux fois : pas de troisième essai");
  assert.equal(s.parcours.tables[3].seance.depart, 2, "un cran sous la marche ratée");
  assert.deepEqual(s.parcours.seances, [jour(1)], "une séance écourtée est une séance faite");
  // « Dans le désordre » raté en 3e position (séance 3-4-5) → dans l'ordre, désordre refait.
  q = P.creerParcours();
  q.tables[3].seance = {depart: 3, n: 2};
  rang = 0;
  s = jouerSeance(q, jour(1), etape => (etape.marche === 5 && rang++ === 0 ? 4 : 0), 3);
  assert.deepEqual(s.noms, [3, 4, 5, 4, 5]);
  assert.equal(s.parcours.tables[3].seance.depart, 4);
  // La marche d'en dessous ratée elle aussi : la séance s'arrête, une seule descente.
  q = P.creerParcours();
  q.tables[3].seance = {depart: 3, n: 2};
  const deux = jouerSeance(q, jour(1), etape => (etape.type === "apprends" && etape.marche >= 2 ? 5 : 0), 3);
  assert.deepEqual(deux.noms, [3, 2], "pas de descente en cascade");
  assert.equal(deux.parcours.tables[3].seance.depart, 1);
  // Un raté réparé, puis un autre plus haut : on repart sous le SECOND.
  q = P.creerParcours();
  q.tables[3].seance = {depart: 3, n: 2};
  rang = 0;
  s = jouerSeance(q, jour(1), etape => ((etape.marche === 4 && rang++ === 0) || etape.marche === 5 ? 4 : 0), 3);
  assert.deepEqual(s.noms, [3, 4, 3, 4, 5]);
  assert.equal(s.parcours.tables[3].seance.depart, 4, "dans l'ordre est réparé ; désordre raté : demain 4-5-6");
  // Un raté ne descend jamais sous la marche 1.
  const bas = jouerSeance(P.creerParcours(), jour(1), etape => (etape.marche === 2 ? 6 : 0));
  assert.deepEqual(bas.noms, [1, 2, 1, 2]);
  assert.equal(bas.parcours.tables[2].seance.depart, 1);
});

test("la marche 8 : la validation si la table est prête, sinon la marche 7 refaite à sa place ; plus de verrou : le mélange jamais joué ne la retient pas", () => {
  let p = P.creerParcours();
  p.tables[3].seance = {depart: 6, n: 5};
  // Lot M2 : au sommet, rien de dû, la fenêtre s'arrête à la marche 8 (5-6-7-8, pas 6-7-8 seul).
  assert.deepEqual(nomsDe(p, jour(1), 3), ["Dans le désordre", "Nombres manquants et divisions", "Résultats, nombres manquants et divisions", "Je passe le test (si prêts)"]);
  assert.equal(p.tables[3].seance.depart, 6, "le départ enregistré ne bouge pas");
  // Deux erreurs par entraînement : depuis le lot M1, une seule (9 sur 10) aux
  // deux formes gagnerait le raccourci.
  let s = jouerSeance(p, jour(1), () => 2, 3);
  assert.deepEqual(s.noms, [5, 6, 7, 7], "pas prête : la marche 7 refaite à la place de la validation (lot « Mon mélange sur l'accueil et l'expert »)");
  assert.equal(s.parcours.tables[3].acquise, null);
  // Le lendemain : les calculs dus de la table en cours restent à ses marches
  // (aucune table passée) — pas de Mes calculs du jour, la séance garde 4 marches.
  assert.ok(P.calculsDus(s.parcours, {aujourdhui: jour(2), table: 3}).length > 0, "des calculs de la table de 3 sont dus");
  s = jouerSeance(s.parcours, jour(2), () => 1, 3);
  assert.ok(!s.noms.includes("revision"), "sans table passée, jamais de révision en tête");
  assert.equal(s.noms[0], 5);
  // Prête (10 cases pleines) : la marche 8 est la validation.
  let q = P.creerParcours();
  q.tables[3].seance = {depart: 6, n: 5};
  for (const date of [jour(1), jour(2)]) for (let m = 1; m <= 10; m += 1) q = P.appliquerReponse(q, `3-${m}`, {correcte: true, date}).parcours;
  // Lot « retours de classe » : hors séance, rien n'est promis ; le test vient
  // après la marche 7 réussie dans la séance.
  assert.equal(P.validationDeSeance(q, 3), false, "hors séance : rien n'est promis");
  assert.equal(P.validationDeSeance(q, 3, septReussie()), true, "la marche 7 réussie dans la séance : le test");
  s = jouerSeance(q, jour(3), etape => (etape.type === "validation" ? 1 : 0), 3);
  assert.deepEqual(s.noms, [5, 6, 7, "validation"]);
  assert.equal(s.parcours.tables[3].acquise, jour(3));
  // Deux tables passées, mélange jamais joué : plus de verrou — la validation
  // d'une autre table reste proposée, et la séance n'a pas d'étape « mélange ».
  q.tables[2].acquise = jour(1); q.tables[10].acquise = jour(1);
  q = P.normaliserParcours(q);
  assert.equal(P.validationDeSeance(q, 3, septReussie()), true, "plus de verrou");
  // 2 × 3, calcul d'une table passée avant aujourd'hui, ouvre la séance : trois marches derrière.
  s = jouerSeance(q, jour(3), etape => (etape.type === "validation" ? 1 : 0), 3);
  assert.deepEqual(s.noms, ["revision", 6, 7, "validation"], "Mes calculs du jour, deux entraînements, le test — jamais de mélange");
  assert.equal(s.seance.finie, true);
  assert.equal(s.parcours.tables[3].acquise, jour(3), "le test réussi passe la table, sans mélange");
  assert.equal(s.parcours.melange.dernier, null, "le mélange n'a pas été joué");
  // Lot « Mon mélange aux paliers » (09/10/2026) : la table de 3 passée, ça
  // fait 3 tables — la coupe des 3 est à gagner, Mon mélange vient en 2e
  // étape de la séance suivante (aucun verrou pour autant).
  assert.equal(P.ouvrirSeance(s.parcours, {aujourdhui: jour(4)}).file.filter(prevue => prevue.type !== "revision")[0].type, "melange", "… et il vient en tête de la séance suivante (après Mes calculs du jour s'il y en a), au palier des 3 tables");
});

test("seule la marche 7 compte : une erreur aux entraînements d'avant n'empêche pas le test (lot « retours de classe »)", () => {
  let q = P.creerParcours();
  q.tables[3].seance = {depart: 6, n: 5};
  for (const date of [jour(1), jour(2)]) for (let m = 1; m <= 10; m += 1) q = P.appliquerReponse(q, `3-${m}`, {correcte: true, date}).parcours;
  // Deux erreurs aux deux premiers entraînements (8 sur 10) : pas de raccourci,
  // et des calculs qui redescendent (lot M2 : « Dans le désordre » est joué,
  // séance 5-6-7-8). Lot « retours de classe » : seule la marche 7 à 9 sur 10
  // ouvre le test.
  const s = jouerSeance(q, jour(3), etape => (etape.type === "validation" || etape.marche === 7 ? 1 : 2), 3);
  assert.deepEqual(s.noms, [5, 6, 7, "validation"], "la marche 7 à 9 sur 10 : la marche 8 est la validation, malgré les erreurs d'avant");
  assert.equal(P.rangeeTable(s.parcours, 3).prete, false, "les erreurs ont fait redescendre des calculs");
  assert.equal(P.raccourciValidation(s.parcours, 3), false);
  // Avec Mes calculs du jour en tête, pareil. Lot « un seul système » : Mes
  // calculs du jour ne prend que les calculs des tables passées — ici 2 × 4
  // (la table de 2 passée la veille).
  let r = P.creerParcours();
  r.tables[4].seance = {depart: 6, n: 5};
  r.tables[2].acquise = jour(1);
  for (const date of [jour(0), jour(1)]) for (let m = 1; m <= 10; m += 1) if (m !== 2) r = P.appliquerReponse(r, `4-${m}`, {correcte: true, date}).parcours;
  r = P.appliquerReponse(r, "4-2", {correcte: true, date: jour(1)}).parcours;
  assert.deepEqual(P.serieDuJour(r, {aujourdhui: jour(2)}).cles, ["2-4"]);
  const t = jouerSeance(r, jour(2), etape => (etape.type === "revision" ? 0 : 1), 4);
  assert.deepEqual(t.noms, ["revision", 6, 7, "validation"]);
  // Plus de verrou : deux tables passées, mélange jamais joué, la marche 7 réussie ouvre le test.
  q.tables[2].acquise = jour(1); q.tables[10].acquise = jour(1);
  q = P.normaliserParcours(q);
  const seance = P.ouvrirSeance(q, {aujourdhui: jour(3), table: 3});
  assert.equal(P.validationDeSeance(q, 3, seance), false, "la marche 7 d'abord");
  assert.equal(P.validationDeSeance(q, 3, septReussie(seance)), true);
});

test("validation ratée : retour à la marche 7, et la séance suivante est 6-7-8", () => {
  let q = P.creerParcours();
  q.tables[3].seance = {depart: 6, n: 5};
  for (const date of [jour(1), jour(2)]) for (let m = 1; m <= 10; m += 1) q = P.appliquerReponse(q, `3-${m}`, {correcte: true, date}).parcours;
  const s = jouerSeance(q, jour(9), etape => (etape.type === "validation" ? 5 : 0), 3);
  assert.deepEqual(s.noms.slice(-3), [7, "validation", 7]);
  assert.equal(s.parcours.tables[3].acquise, null);
  assert.equal(s.parcours.tables[3].seance.depart, 6);
  assert.equal(s.seance.finie, true);
});

test("le raccourci : 9 sur 10 ou mieux à « Dans le désordre » ET à « Nombres manquants » mène à la séance 5-6-7-8 ; le test vient après 9 sur 10 à la marche 7 (lot « retours de classe »)", () => {
  let p = P.creerParcours();
  p.tables[3].seance = {depart: 4, n: 3};
  // Un seul des deux : pas de raccourci (la séance suivante n'est pas 5-6-7-8
  // d'office) — mais le test vient quand même après 10 sur 10 à la marche 7.
  let s = jouerSeance(p, jour(1), etape => (etape.marche === 6 ? 2 : 0), 3);
  assert.deepEqual(s.noms, [4, 5, 6, 7, "validation"], "8 sur 10 aux nombres manquants, 10 sur 10 à la marche 7 : le test");
  assert.deepEqual(s.parcours.tables[3].sansFaute, {desordre: 1, trous: 0});
  assert.equal(P.raccourciValidation(s.parcours, 3), false);
  // Les deux : la validation vient après la marche 7, même si les boîtes ne
  // sont pas prêtes (lot « retours de classe » : la marche 7 ne se saute plus —
  // ici en 4e étape, le test en 5e).
  s = jouerSeance(p, jour(1), () => 0, 3);
  assert.deepEqual(s.noms, [4, 5, 6, 7, "validation"]);
  assert.equal(P.rangeeTable(P.creerParcours(), 3).prete, false);
  assert.equal(s.parcours.tables[3].acquise, jour(1), "validée dans la séance, sans attendre les boîtes");
  // Lot M2 : dans la séance 5-6-7-8, la marche 8 devient elle-même la validation (4 étapes).
  p.tables[3].seance = {depart: 5, n: 4};
  s = jouerSeance(p, jour(1), etape => (etape.type === "validation" ? 6 : 0), 3);
  assert.deepEqual(s.noms, [5, 6, 7, "validation", 7], "validation ratée : retour à la marche 7 (5e étape : cinq au plus)");
  assert.equal(s.parcours.tables[3].seance.depart, 6);
  assert.deepEqual(nomsDe(s.parcours, jour(2), 3).slice(-1), ["Je passe le test (si prêts)"], "le raccourci reste gagné : le test, si la marche 7 est réussie");
  assert.equal(jouerSeance(s.parcours, jour(2), () => 0, 3).noms.slice(-1)[0], "validation");
  // Une seule erreur à chacun : le raccourci (lot M1).
  p.tables[3].seance = {depart: 4, n: 3};
  s = jouerSeance(p, jour(1), etape => (etape.type === "entraine" ? 1 : 0), 3);
  assert.deepEqual(s.noms, [4, 5, 6, 7, "validation"], "9 sur 10 aux trois : la validation se propose après la marche 7");
  // Un 9 sur 10 hors séance (« Choisir une activité ») compte aussi ; un 8 sur 10, non.
  let q = P.creerParcours();
  assert.equal(P.SEUILS.seance.raccourciErreursMax, 1);
  q = P.appliquerSerie(q, P.configEntraine(3, "desordre"), {correct: 10, total: 10, date: jour(1)}).parcours;
  q = P.appliquerSerie(q, P.configEntraine(3, "trous"), {correct: 8, total: 10, date: jour(1)}).parcours;
  assert.deepEqual(q.tables[3].sansFaute, {desordre: 1, trous: 0});
  q = P.appliquerSerie(q, P.configEntraine(3, "trous"), {correct: 9, total: 10, date: jour(1)}).parcours;
  assert.equal(P.raccourciValidation(q, 3), true);
  // Plus de verrou : deux tables passées sans mélange joué, le raccourci mène au test.
  q.tables[2].acquise = jour(1); q.tables[10].acquise = jour(1);
  q = P.normaliserParcours(q);
  assert.equal(P.validationDeSeance(q, 3), false, "hors séance : rien n'est promis");
  assert.equal(P.validationDeSeance(q, 3, septReussie()), true);
});

// Lot « retouches après Mon parcours » : « fois », les séances finies depuis
// lundi (l'accueil écrit « 3 fois cette semaine ») ; « semaine » reste le
// nombre de jours (la page du professeur).
test("« Cette semaine » : les jours et les séances finies, depuis lundi ; une séance arrêtée ne compte pas", () => {
  let p = P.creerParcours();
  assert.deepEqual(P.bilanSeances(p, jour(1)), {semaine: 0, fois: 0, objectif: 5, aujourdhui: 0});
  // Arrêtée après une étape : rien n'est compté, le départ ne bouge pas.
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(1)});
  ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1)));
  assert.equal(seance.finie, false);
  assert.deepEqual(p.seances, []);
  assert.deepEqual(departN(p.tables[2].seance), {depart: 1, n: 0});
  p = jouerSeance(p, jour(1), () => 1).parcours;
  p = jouerSeance(p, jour(1), () => 1).parcours;
  p = jouerSeance(p, jour(3), () => 1).parcours;
  assert.deepEqual(P.bilanSeances(p, jour(3)), {semaine: 2, fois: 3, objectif: 5, aujourdhui: 1}, "deux séances le même jour = un jour, mais deux fois");
  assert.equal(P.bilanSeances(p, jour(1)).aujourdhui, 2);
  assert.equal(P.bilanSeances(p, jour(8)).semaine, 0, "le lundi suivant, on repart de zéro — rien à casser");
});

test("la fusion : les bouts s'ajoutent, le départ le plus récent gagne (il peut redescendre), un sans-faute reste, les séances ne se doublent pas", () => {
  const a = P.creerParcours();
  const b = P.creerParcours();
  a.tables[3].bouts = [1]; b.tables[3].bouts = [10];
  a.tables[3].seance = {depart: 5, n: 4}; b.tables[3].seance = {depart: 3, n: 5};
  a.tables[4].seance = {depart: 2, n: 2}; b.tables[4].seance = {depart: 4, n: 2};
  a.tables[3].sansFaute = {desordre: 1, trous: 0}; b.tables[3].sansFaute = {desordre: 0, trous: 1};
  a.seances = [jour(1), jour(1), jour(2)]; b.seances = [jour(1), jour(3)];
  for (const fusion of [P.fusionner(a, b), P.fusionner(b, a)]) {
    assert.deepEqual(fusion.tables[3].bouts, [1, 10]);
    assert.deepEqual(departN(fusion.tables[3].seance), {depart: 3, n: 5}, "le départ redescendu par la séance la plus récente n'est pas remonté par l'autre appareil");
    assert.deepEqual(departN(fusion.tables[4].seance), {depart: 4, n: 2}, "à égalité, le plus avancé");
    assert.deepEqual(fusion.tables[3].sansFaute, {desordre: 1, trous: 1});
    assert.deepEqual(fusion.seances, [jour(1), jour(1), jour(2), jour(3)]);
  }
  assert.deepEqual(P.fusionner(a, a).seances, a.seances, "fusionner deux fois le même parcours ne compte rien en double");
});

test("trois élèves types : celui qui sait tout, le moyen, celui qui ne sait rien", () => {
  // 1. Sait tout, suit la séance : 1-2-3-4, puis 3-4-5-6 (les deux entraînements
  //    gagnés ; lot « retours de classe » : sans la marche 7, pas de test), puis
  //    5-6-7 et le test.
  let p = P.creerParcours();
  const seances = [];
  for (let n = 1; n <= 3; n += 1) { const s = jouerSeance(p, jour(n)); p = s.parcours; seances.push(s.noms.join(",")); }
  assert.deepEqual(seances, ["1,2,3,4", "3,4,5,6", "5,6,7,validation"]);
  assert.equal(p.tables[2].acquise, jour(3), "la table de 2 passée à la troisième séance, juste après la marche 7");
  // 2. Moyen (deux erreurs par entraînement, jamais 9 sur 10) : pas de raccourci.
  //    Lot « un seul système » : sans table passée, il n'a pas de Mes calculs du
  //    jour — les calculs de sa table ne montent qu'aux marches, et ses erreurs
  //    (qui tournent) les font redescendre : tant qu'il reste à 8 sur 10, le test
  //    ne lui est pas proposé (avant le lot : la révision sans faute du matin
  //    rendait sa rangée prête, il validait entre la 4e et la 7e séance).
  p = P.creerParcours();
  const programme = [];
  for (let n = 1; n <= 14; n += 1) {
    const s = jouerSeance(p, jour(n), etape => (etape.type === "entraine" ? 2 : 0));
    p = s.parcours; programme.push(s.noms.join(","));
  }
  assert.equal(P.raccourciValidation(p, 2), false);
  assert.ok(programme.every(noms => !/revision|melange/.test(noms)), "sans table passée : ni Mes calculs du jour ni mélange dans ses séances");
  assert.ok(programme.every(noms => noms.split(",").length === 4), "quatre marches à chaque séance");
  assert.equal(p.tables[2].acquise, null, `à 8 sur 10 partout, le test n'est jamais proposé (${programme.join(" | ")})`);
  assert.deepEqual(programme.slice(-1), ["5,6,7,7"], "il tourne sur ses trois entraînements, la marche 7 refaite à la place du test");
  //    Le jour où il fait 9 sur 10 aux entraînements, le test se propose, et il passe la table.
  const mieux = jouerSeance(p, jour(15), etape => (etape.type === "entraine" ? 1 : 0));
  assert.deepEqual(mieux.noms, [5, 6, 7, "validation"], "9 sur 10 aux deux formes : la marche 8 est le test");
  assert.equal(mieux.parcours.tables[2].acquise, jour(15));
  // 3. Ne sait rien (5 sur 10 partout, la bande ratée aussi) : il ne dépasse pas
  //    la marche 5, on ne lui propose jamais la validation, et il refait les perles.
  p = P.creerParcours();
  let plusHaut = 0;
  let perles = 0;
  for (let n = 1; n <= 10; n += 1) {
    const s = jouerSeance(p, jour(n), etape => (etape.type === "revision" ? 0 : 5));
    p = s.parcours;
    s.noms.forEach(nom => { if (typeof nom === "number") plusHaut = Math.max(plusHaut, nom); if (nom === 1) perles += 1; });
    assert.ok(!s.noms.includes("validation"));
  }
  assert.ok(plusHaut <= 3, `il reste en bas de l'échelle (marche la plus haute : ${plusHaut})`);
  assert.ok(perles >= 10, "les perles chaque jour (et encore après la bande ratée)");
  assert.equal(p.tables[2].acquise, null);
  assert.equal(p.seances.length, 10, "et chaque séance compte quand même");
});

test("la page : la séance est l'accueil de tous — la clé ?seance=1 est retirée (lot 2b)", () => {
  assert.doesNotMatch(html, /\bSEANCE\b|lireCleSeance|CLE_SEANCE/, "plus aucune branche « sans la clé »");
  assert.match(html, /try \{ window\.localStorage\.removeItem\("mathsgo-defi-tables-seance"\); \} catch \(_\) \{\}/, "la trace de la clé est effacée de l'appareil");
  assert.match(html, /<body class="avec-seance">/, "la classe est posée dès le premier dessin");
  assert.match(html, /const avecSeance = !replie;/);
  assert.match(html, /if \(decouverte\) renderDecouverte\(etapes, etat\);\s*else if \(avecSeance\) renderSeanceAccueil\(etapes, etat, table, ligne\);\s*if \(!replie && !carteSeance\) \{/);
  assert.match(html, /\n        renderSemaine\(etat\);/);
  assert.match(html, /function enSeance\(\) \{\s*return Boolean\(seance\) && state\.origin === "seance";/, "une série hors séance garde son bilan d'avant");
  // Lot « Mon mélange aux paliers » : hors séance, Mon mélange lancé par
  // « Je passe le test » a son bouton vers le test.
  assert.match(html, /if \(enSeance\(\)\) noterEtapeDeSeance\(suivi\);\s*else if \(state\.apresMelange && suivi\.classement && suivi\.classement\.type === "melange"\) renderSuiteApresMelange\(\);\s*if \(state\.origin === "decouverte"\) renderSuiteDecouverte\(suivi\);\s*show\("result"\);/);
  assert.match(html, /function backToModes\(\) \{\s*quitterSeance\(\);/, "revenir à Ma table quitte la séance");
  assert.match(html, /mixte: "résultats, nombres manquants et divisions"\}\);/);
  assert.match(html, /function configurationLabel\(config\) \{\s*return CORE\.configurationLabel\(config\);/, "le noyau porte le nom lui-même");
  // Ce que la page pose, et où.
  assert.match(html, /<div id="acc-semaine" class="semaine" hidden><\/div>/);
  assert.match(html, /<div id="seance-fil" class="seance-fil" hidden><\/div>\s*<div class="status">/, "le fil de la séance est au-dessus de la barre");
  assert.match(html, /<div id="seance-fil-resultat" class="seance-fil centre" hidden><\/div>\s*<div id="result-verdict"/);
  assert.match(html, /<div id="seance-suite" class="seance-suite" hidden><\/div>/);
  // Entre deux étapes : UN bouton, « Arrêter la séance », pas de « Rejouer ».
  assert.match(html, /\.result\.en-seance \.result-actions,\s*\.result\.en-seance #result-parcours,\s*\.result\.en-seance #result-message,\s*\.result\.en-seance #result-previous,\s*\.result\.en-seance \.result-config \{ display: none !important; \}/);
  assert.match(html, /suite\.textContent = `Étape \$\{seance\.faites\.length \+ 1\}\\u00a0: \$\{prochaine\.nom\}\\u00a0→`;/, "lot « divisions » : la flèche reste avec son nom");
  // Lot « la flèche de retour » (14/10/2026, choix de Gwenaël) : « Arrêter la
  // séance » devient « ← Ma table », à gauche du bouton de l'étape suivante.
  assert.match(html, /arreter\.className = "secondary retour-flechee";\s*arreter\.id = "seance-arreter";\s*arreter\.textContent = "Ma table";\s*arreter\.addEventListener\("click", backToModes\);\s*const ligne = document\.createElement\("div"\);\s*ligne\.className = "suite-boutons";\s*ligne\.append\(arreter, suite\);\s*zone\.append\(ligne\);/);
  // Lot « une tentative n'est pas une séance » (08/11/2026) : « Séance faite » pour les suivantes du jour.
  assert.match(html, /\$\("result-title"\)\.textContent = PARCOURS\.bilanSeances\(parcours\)\.aujourdhui > 1 \? "Séance faite" : "Séance du jour faite";/);
  assert.match(html, /encore\.textContent = "Encore une séance";/);
  // La rangée : une case vide reste sans nombre. Lot « Mon parcours » (décision
  // 13) : aux couleurs du tableau — « vide » = entrée dans aucune boîte.
  assert.match(html, /if \(item\.etat\) \{\s*cellule\.className = `is-\$\{item\.etat\}`;\s*cellule\.textContent = String\(item\.produit\);\s*\}/);
  // Les bouts sont gardés hors séance aussi.
  assert.match(html, /if \(!resultat\.fait && resultat\.bouts && resultat\.bouts\.length\) \{\s*parcours = resultat\.parcours;\s*sauverParcours\(\);\s*\}/);
  // Les perles : le doigt (pixels d'écran) est ramené aux pixels du boulier quand le cadre est réduit.
  assert.match(html, /const zoom = rect\.width \/ boulier\.dom\.interieur\.offsetWidth \|\| 1;\s*const x = \(event\.clientX - rect\.left\) \/ zoom;/);
  assert.match(html, /const ecart = \(event\.clientX - drag\.depart\) \/ drag\.zoom;/);
  // Le bloc « Mes calculs du jour » quitte l'accueil de la séance. Lot « un
  // seul tableau » : la révision n'a plus qu'une porte, la séance (Mes calculs
  // n'a plus de bouton « Réviser »).
  assert.match(html, /reviser\.hidden = true;/, "Mes calculs du jour est dans la séance (les 9 tables aussi)");
  assert.doesNotMatch(html, /id="calculs-reviser"/);
});

// Décision de Gwenaël (03/10/2026) : au bilan, une rangée entièrement vide n'est
// pas montrée (les premiers jours, J'apprends ne remplit aucune case) ; elle
// revient dès qu'une case est entourée. renderBilanSeance et rangeeDeTable,
// extraites de la page, sont EXÉCUTÉES avec un faux DOM et le vrai moteur.
test("le bilan de séance : pas de rangée tant qu'elle est entièrement vide, la rangée dès qu'une case est entourée", () => {
  const extraire = (debut, fin) => {
    const a = html.indexOf(debut);
    const b = html.indexOf(fin, a);
    assert.ok(a > 0 && b > a, `${debut} introuvable dans la page`);
    return html.slice(a, b);
  };
  const code = extraire("function etatsDeRangee(table) {", "// L'écran entre deux étapes")
    + extraire("function renderBilanSeance(zone) {", "// La table de la prochaine séance");
  const element = (balise = "div") => ({
    balise, attributs: {}, childNodes: [], className: "", hidden: true, texte: "",
    classList: {remove() {}, add() {}},
    setAttribute(nom, valeur) { this.attributs[nom] = String(valeur); },
    removeAttribute(nom) { delete this.attributs[nom]; },
    addEventListener() {},
    append(...enfants) { this.childNodes.push(...enfants); },
    replaceChildren() { this.childNodes = []; this.texte = ""; },
    set textContent(valeur) { this.childNodes = []; this.texte = valeur; },
    get textContent() { return this.texte + this.childNodes.map(enfant => enfant.textContent).join(""); }
  });
  const classes = noeud => [noeud.className, ...noeud.childNodes.flatMap(enfant => (enfant.childNodes ? classes(enfant) : []))];
  const bilan = parcours => {
    const ids = {};
    const $ = id => (ids[id] ||= element());
    // Lot E3b : le bilan lit « À retenir » tel qu'il s'affiche (aRetenirAffiche).
    const fabrique = new Function("$", "PARCOURS", "parcours", "seance", "document", "pluriel", "soude", "backToModes", "tableDeLaSeance", "commencerSeance", "aRetenirAffiche",
      `${code}\nreturn renderBilanSeance;`);
    const renderBilanSeance = fabrique(
      $, P, parcours,
      {table: 2, faites: [{nom: "Les perles", juste: 11, total: 11, rate: false, reussi: null}]},
      {createElement: balise => element(balise), createTextNode: texte => ({textContent: texte})},
      (nombre, mot) => `${nombre} ${mot}${nombre > 1 ? "s" : ""}`,
      texte => texte, () => {}, () => undefined, () => {}, () => P.aRetenir(parcours)
    );
    const zone = element();
    renderBilanSeance(zone);
    return {zone, titre: $("result-title").textContent};
  };
  // Parcours vide : ni rangée, ni cadre ; les boutons viennent juste sous les étapes.
  const vide = bilan(P.creerParcours());
  assert.equal(vide.titre, "Séance du jour faite");
  assert.ok(!classes(vide.zone).includes("rangee"), "une rangée entièrement vide n'est pas montrée au bilan");
  assert.ok(!classes(vide.zone).includes("cadre"), "ni rangée ni phrase : pas de cadre vide");
  assert.equal(vide.zone.childNodes[0].className, "boutons");
  // Une case entourée (boîte 2) : la rangée est là.
  const entouree = P.appliquerReponse(P.creerParcours(), "2-3", {correcte: true, date: "2026-10-05"}).parcours;
  assert.equal(P.rangeeTable(entouree, 2).cases[2].etat, "entouree");
  const avec = bilan(entouree);
  assert.ok(classes(avec.zone).includes("cadre"));
  assert.ok(classes(avec.zone).includes("rangee"), "dès qu'une case est entourée, la rangée revient au bilan");
  assert.ok(classes(avec.zone).includes("is-en-cours"), "lot « Mon parcours » : la boîte 2 en bleu, comme au tableau");
  // Lot « Mon parcours » (décision 13) : un calcul RATÉ (boîte 1) n'est plus
  // une case vide — il est rouge, avec son nombre ; la rangée revient donc aussi.
  const rate = P.appliquerReponse(P.creerParcours(), "2-3", {correcte: false, date: "2026-10-05"}).parcours;
  assert.equal(rate.calculs["2-3"].boite, 1);
  assert.equal(P.rangeeTable(rate, 2).cases[2].etat, "vide", "le moteur ne change pas : pour lui, la case n'est pas prête");
  const avecRate = bilan(rate);
  assert.ok(classes(avecRate.zone).includes("rangee"));
  assert.ok(classes(avecRate.zone).includes("is-a-travailler"), "rouge, comme au tableau");
});

// Relecture de Code (02/10/2026) : la fonction de la page est EXÉCUTÉE avec un
// faux DOM — un test sur le texte ne dirait rien d'une étiquette restée en place.
// Lot « retouches après Mon parcours » (choix de Gwenaël) : plus de ronds (ils
// faisaient penser aux points d'un carrousel) ni d'objectif — « 3 fois cette
// semaine », et rien tant qu'aucune séance n'est finie.
test("« Cette semaine » : « 3 fois cette semaine », rien à zéro, plus de ronds ni d’objectif", () => {
  const debut = html.indexOf("function renderSemaine(etat) {");
  const fin = html.indexOf("// [seance:fin]", debut);
  assert.ok(debut > 0 && fin > debut, "renderSemaine introuvable dans la page");
  const element = () => ({
    attributs: {}, enfants: [], className: "", hidden: true, texte: "",
    setAttribute(nom, valeur) { this.attributs[nom] = String(valeur); },
    removeAttribute(nom) { delete this.attributs[nom]; },
    getAttribute(nom) { return nom in this.attributs ? this.attributs[nom] : null; },
    append(...enfants) { this.enfants.push(...enfants.map(e => (typeof e === "string" ? {textContent: e} : e))); },
    replaceChildren() { this.enfants = []; this.texte = ""; },
    set textContent(valeur) { this.enfants = []; this.texte = valeur; },
    get textContent() { return this.texte + this.enfants.map(enfant => enfant.textContent).join(""); },
    querySelector() { return null; }
  });
  const zones = {"acc-semaine": element(), "acc-jours": element(), "open-parcours": element()};
  let fois = 3;
  const fabrique = new Function("$", "PARCOURS", "document", "pluriel", "PARCOURS_TABLES", "parcours",
    `${html.slice(debut, fin)}\nreturn renderSemaine;`);
  const renderSemaine = fabrique(
    id => zones[id],
    {bilanSeances: () => ({semaine: 2, fois, objectif: 5, aujourdhui: 1})},
    {createElement: () => element()},
    (nombre, mot) => `${nombre} ${mot}${nombre > 1 ? "s" : ""}`,
    [2, 3, 4, 5, 6, 7, 8, 9, 10],
    P.creerParcours()
  );
  const zone = zones["acc-semaine"];
  renderSemaine({acquises: []});
  assert.equal(zone.hidden, false);
  assert.equal(zone.textContent, "3\u00a0fois cette semaine", "les séances, pas les jours (deux séances lundi = 2 fois)");
  assert.equal(zone.getAttribute("aria-label"), null, "le texte se lit seul");
  fois = 1;
  renderSemaine({acquises: []});
  assert.equal(zone.textContent, "1\u00a0fois cette semaine");
  fois = 0; // lundi matin
  renderSemaine({acquises: []});
  assert.equal(zone.hidden, true, "aucune séance : rien n’est écrit");
  assert.equal(zone.textContent, "");
  assert.doesNotMatch(html.slice(debut, fin), /objectif|rond/, "plus d’objectif, plus de ronds");
  assert.doesNotMatch(html, /\.semaine i\b/, "le style des ronds est parti");
});

test("le moteur a changé : nouveau numéro de cache, copie serveur identique, serveur qui accepte les nouvelles clés", () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-3/);
  const moteur = readFileSync(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  const copie = readFileSync(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(moteur.equals(copie), "cp outils/calcul_mental/defi_tables_mon_parcours.js _serveur/public/prof/");
  for (const cle of ["bouts", "seance", "depart", "n", "sansFaute", "seances", "enCours", "jour", "table", "echelle", "file", "faites", "erreurs", "rate", "remplacee", "reparee", "prete", "retenir"]) {
    assert.match(applis, new RegExp(`'${cle}'`), `lib/applis.php doit accepter « ${cle} »`);
  }
  const reference = JSON.parse(readFileSync(new URL("../_serveur/tests/parcours-reference.json", import.meta.url), "utf8"));
  assert.deepEqual(reference.tables[10].bouts, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "le parcours de référence porte les bouts (node scripts/generer-parcours-reference.mjs)");
  assert.equal(typeof reference.tables[7].seance.depart, "number");
  assert.equal(reference.seances.length, 4);
  assert.equal(reference.tables[7].seance.dernier, "2026-09-15", "lot 2 : le jour de la dernière séance (clé « dernier », déjà acceptée par le serveur)");
  assert.match(applis, /'dernier'/);
});

// ------------------------------------------------------------------ lot 2a
// Lot 2a (03/10/2026, décisions de Gwenaël) : la table de la dernière séance,
// le premier écran « Tu connais déjà des tables ? », la séance des 9 tables,
// Mon parcours, la notice, « Changer de table » qui ne montre que les tables.

test("lot 2a : la table de la séance est celle de la dernière séance jouée (pas acquise), sinon l'ordre conseillé", () => {
  let p = P.creerParcours();
  assert.equal(P.tableDeSeance(p), 2, "rien joué : l'ordre conseillé");
  // Une séance sur la table de 7, choisie : le lendemain, c'est elle.
  const s = jouerSeance(p, jour(1), () => 0, 7);
  p = s.parcours;
  assert.equal(p.tables[7].seance.dernier, jour(1));
  assert.equal(P.tableDeSeance(p), 7, "l'élève qui a choisi la 7 la retrouve");
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(2)}).table, 7);
  // Puis une séance sur la 4, plus récente : la 4 l'emporte.
  p = jouerSeance(p, jour(2), () => 0, 4).parcours;
  assert.equal(P.tableDeSeance(p), 4);
  // Une table acquise n'est plus « ma table ».
  p.tables[4].acquise = jour(2);
  assert.equal(P.tableDeSeance(P.normaliserParcours(p)), 7);
  // Le jour est relu, fusionné (le plus récent) et nettoyé.
  const relu = P.normaliserParcours(JSON.parse(JSON.stringify(p)));
  assert.equal(relu.tables[7].seance.dernier, jour(1));
  assert.equal(P.normaliserParcours({tables: {7: {seance: {depart: 3, n: 1, dernier: "pas une date"}}}}).tables[7].seance.dernier, null);
  const a = P.creerParcours(); a.tables[7].seance = {depart: 3, n: 2, dernier: "2026-10-05"};
  const b = P.creerParcours(); b.tables[7].seance = {depart: 2, n: 1, dernier: "2026-10-07"};
  assert.equal(P.fusionner(a, b).tables[7].seance.dernier, "2026-10-07");
  assert.equal(P.fusionner(b, a).tables[7].seance.dernier, "2026-10-07");
});

test("lot 2a : « Tu connais déjà des tables ? » — validations d'affilée, plus aucun verrou (premier écran ou non), table ratée qui démarre à la marche 5", () => {
  const valider = (parcours, table, erreurs, decouverte) => {
    let p = parcours;
    const config = P.configValidation(table);
    for (let index = 0; index < 20; index += 1) {
      p = P.appliquerReponse(p, `${table}-${1 + (index % 10)}`, {correcte: index >= erreurs, date: J1}).parcours;
    }
    return P.appliquerSerie(p, config, {correct: 20 - erreurs, total: 20, date: J1, decouverte}).parcours;
  };
  let p = valider(P.creerParcours(), 2, 0, true);
  p = valider(p, 10, 0, true);
  assert.equal(P.melangeDu, undefined, "deux tables passées : plus de mélange dû, le verrou est retiré");
  const sansDecouverte = valider(p, 5, 0, false);
  assert.equal(sansDecouverte.tables[5].acquise, J1, "hors du premier écran aussi : un test réussi passe la table, toujours");
  p = valider(p, 5, 0, true);
  assert.equal(p.tables[5].acquise, J1, "sur le premier écran, il valide d'affilée ce qu'il sait");
  // Lot « Mon mélange aux paliers » (09/10/2026) : 3 tables passées, la
  // coupe des 3 à gagner — la première séance a Mon mélange (aucun verrou).
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(2)}).file.filter(prevue => prevue.type !== "revision")[0].type, "melange");
  // Table de 3 ratée : sa séance part de « Dans le désordre ».
  p = valider(p, 3, 5, true);
  assert.equal(p.tables[3].acquise, null);
  const parti = P.commencerApresDecouverte(p, 3, {aujourdhui: J1});
  assert.equal(P.MARCHE_APRES_DECOUVERTE, 5);
  assert.equal(parti.tables[3].seance.depart, 5);
  assert.equal(parti.tables[3].seance.dernier, J1);
  assert.equal(P.tableDeSeance(parti), 3, "et c'est elle, ma table, les jours suivants");
  // Le jour même : les tables viennent d'être passées, rien pour Mes calculs
  // du jour — Mon mélange (palier des 3 tables), puis trois marches.
  assert.deepEqual(P.ouvrirSeance(parti, {aujourdhui: J1}).file.map(prevue => prevue.type === "marche" ? prevue.marche : prevue.type), ["melange", 5, 6, 7]);
  // Le lendemain : Mes calculs du jour (les calculs des tables passées la veille), Mon mélange, puis deux marches.
  assert.deepEqual(P.ouvrirSeance(parti, {aujourdhui: jour(2)}).file.map(prevue => prevue.type === "marche" ? prevue.marche : prevue.type), ["revision", "melange", 5, 6], "avec révision et Mon mélange : deux marches, quatre étapes");
  // La coupe des 3 gagnée : plus de mélange, trois marches derrière Mes calculs du jour.
  const coupe = P.normaliserParcours({...parti, melange: {...parti.melange, reussi: 4}});
  assert.deepEqual(P.ouvrirSeance(coupe, {aujourdhui: jour(2)}).file.map(prevue => prevue.type === "marche" ? prevue.marche : prevue.type), ["revision", 5, 6, 7]);
  assert.equal(P.commencerApresDecouverte(parti, 2), parti, "une table passée ne bouge pas");
  assert.equal(p.tables[3].seance.depart, 1, "le parcours d'origine n'est pas modifié");
});

test("lot 2a : les 9 tables passées ont leur séance — Mes calculs du jour s'il y en a, puis l'étoile suivante (plus de Mon mélange avant, lot « Mon mélange aux paliers »)", () => {
  let p = P.creerParcours();
  P.TABLES.forEach(table => { p.tables[table].acquise = "2026-10-01"; });
  p = P.normaliserParcours(p);
  // Lot « Mon mélange aux paliers » (09/10/2026) : plus de Mon mélange des 9
  // tables avant l'étoile, même sans aucune coupe.
  assert.deepEqual(P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: J1}), J1).etapes.map(etape => etape.type), ["etoile"]);
  // Mélange des 9 jamais joué : l'escalier est ouvert quand même (9 tables passées), la séance est l'étoile.
  let seance = P.ouvrirSeance(p, {aujourdhui: J1});
  assert.equal(seance.table, null);
  assert.equal(P.escalierOuvert(p), true);
  assert.equal(p.melange.aJour, false);
  let programme = P.programmeDeSeance(p, seance, J1).etapes.map(etape => etape.type);
  assert.deepEqual(programme, ["etoile"]);
  // Une vieille séance qui portait un mélange : l'étape s'efface.
  assert.equal(P.etapeDeSeance(p, {...seance, file: [{type: "melange"}, ...seance.file]}, J1).type, "etoile");
  // L'étoile ★, puis la suivante ; la couronne se rejoue.
  let etape = P.etapeDeSeance(p, seance, J1);
  assert.equal(etape.type, "etoile");
  assert.equal(etape.etoile, 1);
  assert.equal(etape.nom, "Tente ★");
  assert.equal(etape.detail, "2 min");
  assert.equal(etape.config.duration, 120);
  p.expert.etoiles = 2;
  etape = P.etapeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: J1}), J1);
  assert.equal(etape.nom, "Tente ★★★");
  p.expert.etoiles = P.ETOILES_MAX;
  etape = P.etapeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: J1}), J1);
  assert.equal(etape.etoile, P.ETOILES_MAX, "la couronne gagnée se rejoue");
  // La séance se note et compte dans « Cette semaine ».
  const note = P.noterEtape(p, P.ouvrirSeance(p, {aujourdhui: J1}), etape, {juste: 25, total: 25, reussi: true}, J1);
  assert.ok(note.seance.finie);
  assert.equal(note.faite.reussi, true);
  assert.deepEqual(note.parcours.seances, [J1]);
  // Des calculs dus : ils passent devant.
  p = P.appliquerReponse(p, "3-7", {correcte: false, date: J1}).parcours;
  programme = P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: jour(2)}), jour(2)).etapes.map(item => item.type);
  assert.deepEqual(programme, ["revision", "etoile"]);
  // Une table choisie exprès garde ses trois entraînements, sans étoile.
  assert.deepEqual(P.ouvrirSeance(p, {aujourdhui: jour(2), table: 7}).file.map(prevue => prevue.type).filter(type => type !== "revision"), ["marche", "marche", "marche"]);
});

test("lot 2a : la page — premier écran, Mon parcours, notice, séance des 9 tables, « Changer de table » seul", () => {
  // « Changer de table » ouvert : seules les tables, à toutes les largeurs.
  assert.match(html, /body\.avec-seance \.acc\.choix-ouvert > :not\(\.matable\),\s*body\.avec-seance \.acc\.choix-ouvert #acc-etapes,\s*body\.avec-seance \.acc\.choix-ouvert #acc-lire \{ display: none; \}/);
  // Le premier écran : seulement pour un parcours vide, fermé pour l'onglet.
  assert.match(html, /return !fermee && \(decouverteEngagee \|\| PARCOURS\.estVide\(parcours\)\);/);
  assert.match(html, /const decouverte = avecSeance && enDecouverte\(\);/);
  assert.match(html, /decouverteEngagee = true;\s*launchFromParcours\(PARCOURS\.configValidation\(candidate\), "decouverte"\)/);
  assert.match(html, /\{correct: state\.correct, total: TOTAL, decouverte: state\.origin === "decouverte"\}/);
  // Lot E1 (décision 4) : « Non, je commence à apprendre », puis le choix de la table.
  assert.match(html, /commencer\.textContent = etat\.acquises\.length \? "C’est tout" : "Non, je commence à apprendre";/);
  assert.match(html, /parcours = PARCOURS\.commencerApresDecouverte\(parcours, table, \{juste: validation\.score\}\);\s*sauverParcours\(\);\s*ecrireTableChoisie\(table\);\s*fermerDecouverte\(\);/);
  // Mon parcours : lot « un seul tableau » (04/10/2026) — la carte de ma
  // table (son échelle) puis Mes calculs, à la place des dix rangées.
  assert.match(html, /\n        renderMaTable\(\$\("parcours-matable"\), etat, tableEnCours\(etat\)\);\s*renderSemaines\(\);\s*renderCalculs\(\);/);
  assert.doesNotMatch(html, /renderParcoursSeance/);
  assert.doesNotMatch(html, /kind: "dot",\s*etat: activite\.etat/, "lot 2b : les ronds de l'ancien parcours sont retirés");
  assert.doesNotMatch(html, /pas fait<\/span>\s*<span><span class="cell is-started">/, "et leur légende aussi");
  assert.match(html, /zone\.append\(head\);\s*if \(ligne && !ligne\.acquise\) zone\.append\(echelleDeTable\(maTable\)\);/, "l’échelle tant que ma table n’est pas acquise");
  // La table de la dernière séance.
  assert.match(html, /if \(etat\.tableSeance\) return etat\.tableSeance;/);
  // Les 9 tables : la carte de la séance dans « Je deviens expert ».
  // Lot « une tentative n'est pas une séance » (08/11/2026) : la séance faite et plus aucun calcul du jour, la ligne « Tente ★★★ » au lieu de la carte.
  assert.match(html, /if \(programme\.etapes\.length && \(!faite \|\| resteDesCalculs\)\) \{\s*action\.append\(carteDeSeance\(null\)\);/);
  // La notice de la séance : six lignes, la seule notice.
  const debut = html.indexOf('<template id="notice-seance">');
  const notice = html.slice(debut, html.indexOf("</template>", debut));
  assert.equal((notice.match(/<p>/g) || []).length, 6, "six lignes");
  assert.doesNotMatch(notice, /les deux à la fois|je m’entraîne 3 fois/i);
  assert.match(html, /const modele = \$\("notice-seance"\);/);
  assert.doesNotMatch(html, /notice-regles"|je m’entraîne 3 fois/, "la notice d'avant est retirée");
});

// Relecture de Code (03/10/2026), vue au navigateur : avec un code, l'accueil
// est dessiné AVANT que le serveur rende le parcours. Sur un appareil neuf, la
// case est vide à cet instant ; le lot livré figeait alors « premier écran » et
// Léa (3 tables acquises) restait sur « Tu connais déjà des tables ? », sans
// Mon parcours. La fonction de la page est EXÉCUTÉE, pas lue.
test("lot 2a : le premier écran suit le parcours rendu par le serveur — il ne reste ouvert que si l'élève y a tenté une table", () => {
  const debut = html.indexOf('const CLE_DECOUVERTE = "mathsgo-defi-tables-decouverte";');
  const fin = html.indexOf("function renderDecouverte(etapes, etat) {", debut);
  assert.ok(debut > 0 && fin > debut, "enDecouverte introuvable dans la page");
  const onglet = new Map();
  const stockageSession = () => ({getItem: cle => (onglet.has(cle) ? onglet.get(cle) : null), setItem: (cle, valeur) => onglet.set(cle, valeur)});
  const fabrique = new Function("PARCOURS", "stockageSession", "etat",
    `let parcours = etat.parcours; let codeSuivi = etat.code; let suiviAttendu = Boolean(etat.attendu); let billetEnCours = Boolean(etat.billet);
     ${html.slice(debut, fin)}
     return {
       enDecouverte() { parcours = etat.parcours; codeSuivi = etat.code; suiviAttendu = Boolean(etat.attendu); billetEnCours = Boolean(etat.billet); return enDecouverte(); },
       fermerDecouverte,
       tenter() { decouverteEngagee = true; }
     };`);
  const vide = P.creerParcours();
  let lea = P.creerParcours();
  [2, 5, 10].forEach(table => { lea.tables[table].acquise = "2026-10-02"; });
  lea = P.normaliserParcours(lea);

  // Appareil neuf : vide au premier dessin, puis le serveur rend le parcours de Léa.
  // Lot 2b : tant que le serveur n'a pas répondu, l'écran ne se pose pas.
  const etat = {parcours: vide, code: "ABCDEF", attendu: true};
  const page = fabrique(P, stockageSession, etat);
  assert.equal(page.enDecouverte(), false, "case vide, serveur attendu : pas encore de premier écran");
  // Billet encore en cours d'échange, attente de 2,5 s déjà finie : toujours pas d'écran
  // (une table touchée là se jouerait sans le code de l'élève).
  etat.attendu = false;
  etat.billet = true;
  assert.equal(page.enDecouverte(), false, "billet en cours : on ne sait pas qui entre, pas de premier écran");
  etat.billet = false;
  assert.equal(page.enDecouverte(), true, "le serveur n'a rien (ou n'a pas répondu) : l'écran s'affiche");
  etat.parcours = P.fusionner(vide, lea);
  assert.equal(page.enDecouverte(), false, "le serveur a rendu ses 3 tables : l'accueil de sa table, plus le premier écran");

  // Élève vraiment neuf qui valide la 2 sur l'écran : il reste ouvert…
  const neuf = {parcours: vide, code: "GHIJKL"};
  const autre = fabrique(P, stockageSession, neuf);
  assert.equal(autre.enDecouverte(), true);
  autre.tenter();
  neuf.parcours = lea;
  assert.equal(autre.enDecouverte(), true, "une table tentée sur l'écran : il reste ouvert pour la suivante");
  // … jusqu'à « C'est tout », pour l'onglet.
  autre.fermerDecouverte();
  assert.equal(autre.enDecouverte(), false);
  neuf.parcours = vide;
  assert.equal(fabrique(P, stockageSession, neuf).enDecouverte(), false, "fermé pour de bon dans l'onglet");
});

// ---------------------------------------------------------------------------
// Lot 2b (03/10/2026) : la fiche montre ce que montre Mon parcours, le cadre
// des compteurs est pour le professeur, et le premier écran attend le serveur.
//
// Sabotages attendus (chacun rend un test rouge) :
//   - écrire le résultat dans une case vide de la fiche ;
//   - montrer le cadre du professeur à l'élève (sans « source ») ;
//   - poser le premier écran pendant l'échange du billet ;
//   - ne pas finir l'attente quand le billet est refusé ;
//   - remettre « les deux à la fois » dans le noyau.

// Lot « un seul tableau » (04/10/2026) : la fiche tient sur UNE page — la
// carte de ma table, le même tableau qu'à l'écran, le mélange, l'escalier.
test("la fiche — la carte de ma table, le tableau de Mes calculs, « Cette semaine », une seule page", () => {
  const fiche = html.slice(html.indexOf('<section id="fiche-print"'), html.indexOf('<template id="notice-seance">'));
  assert.doesNotMatch(fiche, /fiche-rows|fiche-rangees|fiche-page2|fiche-r entouree/, "plus de rangées, plus de page 2");
  assert.doesNotMatch(fiche, /J’apprends|Je m’entraîne|fiche-table|Colorie les ronds/, "les ronds ont quitté l'appli au lot 2a");
  assert.match(fiche, /<div id="fiche-matable" class="fiche-rangee is-ma-table fiche-matable" hidden><\/div>\s*<table id="fiche-calculs" class="fiche-carre"><tbody><\/tbody><\/table>\s*<p class="fiche-carre-legende" aria-hidden="true">/);
  assert.match(fiche, /<\/i>pas encore vu<\/span>[\s\S]*?<\/i>à revoir<\/span>[\s\S]*?<\/i>en route<\/span>[\s\S]*?<\/i>su<\/span>[\s\S]*?<\/i>même calcul<\/span>/, "la légende de l’écran");
  // Lot « Une seule fiche » : la table de 10 passée prend la pastille.
  assert.match(fiche, /<p id="fiche-dix" class="fiche-dix" hidden><i class="fiche-passee">✓10<\/i>Table de 10&nbsp;: passée<\/p>/);
  // Un seul logo, en haut à droite ; le QR à gauche ; la signature seule en pied.
  assert.match(fiche, /<header class="fiche-head">\s*<div class="fiche-qr">[\s\S]*?<\/div>\s*<h1>Mon parcours<br>des tables<\/h1>\s*<img class="fiche-logo" src="\.\.\/\.\.\/assets\/img\/mathsgo-logo-print\.png"/);
  assert.equal((fiche.match(/mathsgo-logo/g) || []).length, 1, "un seul logo");
  // Lot « Une seule fiche » : la page 1 a sa signature (une seule page pour
  // l'élève) ; la page du professeur, la sienne.
  const page1 = fiche.slice(0, fiche.indexOf('<div id="fiche-prof"'));
  assert.equal((page1.match(/<footer class="fiche-foot">mathsgo\.re · CC BY-NC-SA 4\.0<\/footer>/g) || []).length, 1, "une seule signature : une seule page");
  assert.equal((fiche.match(/<footer class="fiche-foot">mathsgo\.re · CC BY-NC-SA 4\.0<\/footer>/g) || []).length, 2);
  // Le remplissage : le parcours de LA FICHE (celui d'un autre élève chez le professeur).
  assert.match(html, /const fait = fiche\.calculs\[cle\] \|\| null;\s*const td = document\.createElement\("td"\);\s*td\.className = colonne < ligne \? `miroir\$\{fait \? " vu" : ""\}` : PARCOURS\.etatFait\(fait\);/, "la moitié miroir grise seulement pour un calcul déjà vu");
  assert.match(html, /nombre\.textContent = fait \? String\(ligne \* colonne\) : "";/, "comme à l'écran : une case jamais vue ne donne pas le résultat");
  assert.match(html, /const maTable = vide \? null : PARCOURS\.tableDeSeance\(fiche\);/, "une fiche vide ne désigne aucune table");
  assert.match(html, /carte\.hidden = !maTable && !vierge;/, "lot « Mon parcours » : la fiche vierge a sa carte, vide");
  // Relecture de Code (03/10/2026), vue au navigateur : « Fiche » sur un élève
  // qui n'a rien fait — le serveur donne son prénom, et le prénom suffisait à
  // rendre la fiche « non vide » : table de 2 désignée, date, « Ma progression ».
  assert.match(html, /const vide = PARCOURS\.estVide\(\{\.\.\.fiche, prenom: ""\}\);\s*\$\("fiche-date"\)\.textContent = vide \?/);
  assert.match(html, /\$\("fiche-subtitle"\)\.textContent = vierge\s*\?[^:]*:\s*vide\s*\?/);
  const hugo = P.creerParcours();
  hugo.prenom = "Hugo";
  assert.equal(P.estVide(hugo), false, "le moteur compte le prénom : c'est à la fiche de l'écarter");
  assert.equal(P.estVide({...hugo, prenom: ""}), true);
  assert.match(html, /const marches = marchesDeTable\(fiche, maTable\);/);
  assert.match(html, /function echelleDeTable\(table\) \{\s*const \{depart, prochaines, noms\} = marchesDeTable\(parcours, table\);/, "Mon parcours et la fiche lisent l'échelle de la même façon");
  assert.match(html, /const semaine = PARCOURS\.bilanSeances\(fiche\);/);
  // Lot « Une seule fiche » (08/10/2026) : la page 1 ne se resserre plus
  // (elle se resserrait pour faire tenir le cadre du professeur) ; le cadre
  // est une page 2, seulement depuis « Ma classe ».
  assert.doesNotMatch(html, /avec-prof/);
  assert.match(html, /\$\("fiche-prof"\)\.hidden = !source;\s*renderFicheProf\(source \? fiche : null, etat\);/);
  assert.match(html, /\.fiche-page-prof \{ break-before: page; margin-top: 0; \}/);
  assert.doesNotMatch(html, /\.fiche-page2 \{ break-before: page/);
});

test("lot 2b : les compteurs « fois » sont pour le professeur — le cadre n'existe que dans la fiche ouverte depuis « Ma classe »", () => {
  // Lot « Une seule fiche » (08/10/2026, planche 16) : une page 2, titrée.
  assert.match(html, /<div id="fiche-prof" class="fiche-page-prof" hidden>\s*<div class="fiche-prof">\s*<h2 class="fiche-prof-titre">Pour le professeur <span id="fiche-prof-qui"><\/span><\/h2>\s*<p class="fiche-prof-sous">Combien de fois chaque activité a été faite, table par table\.<\/p>/);
  const rendu = html.slice(html.indexOf("      function renderFicheProf(fiche, etat) {"), html.indexOf("      function printFiche() {"));
  assert.match(rendu, /lignesProf\.replaceChildren\(\);[\s\S]*?if \(!fiche\) return;/, "sans source (la fiche de l'élève sur son appareil), aucune ligne");
  assert.match(rendu, /\$\("fiche-prof"\)\.hidden = !source;\s*renderFicheProf\(source \? fiche : null, etat\);/);
  // Toujours les 9 tables : plus de phrase « aucune séance » (Toti avait
  // passé ses 9 tables par le test, la fiche disait « Aucune séance ni
  // activité enregistrée ») — la colonne « Passée » dit « test direct ».
  assert.doesNotMatch(html, /fiche-prof-vide|Aucune séance ni activité enregistrée/);
  // Le nom proposé à l'enregistrement du PDF : le titre de la page.
  assert.match(html, /document\.title = `Fiche Défi tables\$\{distant\.prenom \? ` - \$\{distant\.prenom\}` : ""\}\$\{classe \? ` - \$\{classe\}` : ""\}`;/);
  assert.match(rendu, /const nombres = \[ligne\.seance\.n, fois\.beads, fois\.construct, fois\.gaps, fois\.ordered,\s*fois\.random \+ fois\.desordre, fois\.trous, fois\.mixte\];\s*const tr = document\.createElement\("tr"\);/, "une ligne par table, les 9, toujours");
  assert.equal((html.match(/<th>Séances<\/th><th>Perles<\/th>/g) || []).length, 1);
  // Le professeur passe toujours une source ; l'élève, jamais.
  assert.match(html, /renderFiche\(distant\);/);
  assert.match(html, /function imprimerLaFiche\(\) \{\s*renderFiche\(\);/);
});

test("lot 2b : avec un code, « Tu connais déjà des tables ? » attend le serveur — billet, lecture, 2,5 s au plus", () => {
  assert.match(html, /function enDecouverte\(\) \{\s*if \(suiviAttendu \|\| billetEnCours\) return false;/);
  assert.match(html, /const ATTENTE_SUIVI_MS = 2500;/);
  assert.match(html, /function attendreSuivi\(\) \{\s*if \(attenteFinie\) return;\s*suiviAttendu = true;\s*if \(minuteurAttente === null\) minuteurAttente = window\.setTimeout\(finAttente, ATTENTE_SUIVI_MS\);/);
  assert.match(html, /function finAttente\(\) \{[\s\S]{0,160}?attenteFinie = true;\s*if \(!suiviAttendu\) return;\s*suiviAttendu = false;\s*if \(!state\.running\) renderParcours\(\);/);
  // Le billet : l'attente commence avant l'échange, et finit si le billet est refusé.
  assert.match(html, /async function entrerParBillet\(billet, ouvrir\) \{[\s\S]{0,500}?billetEnCours = true;\s*renderParcours\(\);\s*const reponse = await echangerBillet\(billet\);/);
  // La lecture du parcours : seulement pour une case vide ; sans code ou détaché, rien n'attend.
  assert.match(html, /if \(!suiviActif\(\)\) \{ finAttente\(\); return; \}/);
  assert.match(html, /if \(sync\.detache\) \{ finAttente\(\); return; \}/);
  assert.match(html, /if \(PARCOURS\.estVide\(parcours\)\) \{\s*attendreSuivi\(\);\s*if \(!state\.running\) renderParcours\(\);\s*\} else finAttente\(\);/);
  assert.match(html, /lireParcoursDuServeur\(code\)\.then\(reponse => \{\s*if \(code !== codeSuivi\) return;[\s\S]{0,200}?suiviAttendu = false;/);
  // Pendant l'attente, l'accueil ne montre rien (ni table de 2, ni premier écran).
  assert.match(html, /classList\.toggle\("en-attente", suiviAttendu \|\| billetEnCours\);/);
  // Billet lent : l'accueil reste caché jusqu'au retour du billet, puis se redessine même si les 2,5 s sont passées.
  assert.match(html, /const reponse = await echangerBillet\(billet\);\s*billetEnCours = false;/);
  assert.match(html, /finAttente\(\);[\s\S]{0,200}?if \(!state\.running\) renderParcours\(\);\s*return false;/);
  assert.match(html, /\.acc\.en-attente > \* \{ visibility: hidden; \}/);
});

// Relecture de Code (03/10/2026), vue au navigateur avec un serveur simulé
// lent : le billet met 4 s à revenir. Le lot livré relançait les 2,5 s à son
// arrivée — « Tu connais déjà des tables ? », affiché à 2,5 s, disparaissait à
// 4 s puis revenait (ou laissait place à la table). Un élève rapide y avait
// déjà touché une table. Les fonctions de la page sont EXÉCUTÉES, minuteur simulé.
test("lot 2b : une seule attente par ouverture — 2,5 s en tout, billet compris, et l'accueil montré ne se cache plus", () => {
  const debut = html.indexOf("      let suiviAttendu = false;");
  const fin = html.indexOf("      function demarrerSuivi() {", debut);
  assert.ok(debut > 0 && fin > debut, "l'attente introuvable dans la page");
  const minuteurs = [];
  const window = {
    setTimeout: (fn, ms) => { minuteurs.push({fn, ms, actif: true}); return minuteurs.length - 1; },
    clearTimeout: id => { if (minuteurs[id]) minuteurs[id].actif = false; }
  };
  const dessins = [];
  const page = new Function("window", "state", "renderParcours",
    `${html.slice(debut, fin)}
     return {attendreSuivi, finAttente, attendu: () => suiviAttendu};`)(window, {running: false}, () => dessins.push("dessin"));
  const sonner = () => minuteurs.filter(m => m.actif).forEach(m => { m.actif = false; m.fn(); });

  // Le billet part : l'accueil attend, un seul minuteur de 2,5 s.
  page.attendreSuivi();
  assert.equal(page.attendu(), true);
  assert.deepEqual(minuteurs.map(m => m.ms), [2500]);
  // Le billet revient vite, la case est vide : on attend encore, SANS relancer le minuteur.
  page.attendreSuivi();
  assert.equal(minuteurs.length, 1, "le compte à rebours continue, il ne repart pas de zéro");
  assert.equal(minuteurs[0].actif, true);
  // 2,5 s : l'accueil se montre…
  sonner();
  assert.equal(page.attendu(), false);
  assert.equal(dessins.length, 1);
  // … et un billet lent qui revient après ne le cache plus.
  page.attendreSuivi();
  assert.equal(page.attendu(), false, "l'accueil déjà montré ne se cache plus");
  assert.equal(minuteurs.filter(m => m.actif).length, 0);
});

test("lot 2b : « résultats et nombres manquants » partout — noyau, fiche vierge ; les restes du lot 5a", () => {
  const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
  const noyau = lire("outils/calcul_mental/defi_tables_core.js");
  assert.match(noyau, /"direct\+missing\+division": "résultats, nombres manquants et divisions"/, "lot « divisions »");
  assert.doesNotMatch(noyau, /"les deux à la fois"/);
  assert.match(html, /defi_tables_core\.js\?v=20261015-1/, "le noyau a changé : son numéro monte");
  // Lot « Mon parcours » (décision 15) : la fiche vierge n'est plus dessinée
  // à part — c'est la fiche de l'appli, en mode vierge, imprimée par Chromium.
  // Ses règles sont donc celles de la fiche : « résultats, nombres manquants et divisions ».
  const vierge = lire("_sources/defi-tables/generer_fiche_parcours.py");
  assert.match(vierge, /await page\.goto\(PAGE\.as_uri\(\) \+ "\?vierge"\)/);
  assert.match(vierge, /pw\.chromium\.launch\(channel="chromium"\)/, "le vrai Chromium, pas le headless shell (largeur du texte)");
  assert.doesNotMatch(vierge, /APPRENDS|ENTRAINE|les deux|LEGENDE = |j’entoure|je colorie/, "plus de rangées à entourer ni à colorier");
  // Lot « Une seule fiche » : la ligne « Passée ✓ : le test… » quitte la
  // fiche ; le nom reste dans l'en-tête du cadre du professeur.
  assert.doesNotMatch(html, /<b>Passée ✓<\/b> : le test/);
  assert.match(html, /<th>Résultats, nombres<br>manquants et divisions<\/th><th>Passée<\/th>/);
  const publication = lire(".github/workflows/publier.yml");
  assert.match(publication, /python -m pip install --disable-pip-version-check reportlab\n/);
  assert.doesNotMatch(publication, /PyMuPDF|pypdf/);
});

// Retouches après le lot 2b (03/10/2026) : en séance, sous un code, la table
// finale des perles défilait dans son cadre (le fil « Ma séance » et le repère
// de suivi prennent de la hauteur). L'écriture se réduit jusqu'à tout montrer.
test("les perles : la table finale tient sans défiler, même en séance sous un code", () => {
  assert.match(html, /\$\("question-card"\)\.classList\.add\("est-finie"\);\s*mesurerBoulier\(\);\s*ajusterTableFinale\(\);/);
  // Et de nouveau quand la fenêtre change de taille (plein écran quitté…).
  assert.match(html, /window\.addEventListener\("resize", \(\) => \{\s*if \(\$\("question-card"\)\.classList\.contains\("est-finie"\)\) ajusterTableFinale\(\);\s*\}\);/);
  const debut = html.indexOf("      function ajusterTableFinale() {");
  const source = html.slice(debut, html.indexOf("\n      }", debut) + 9);
  // Exécutée avec une fausse liste : 11 lignes de 1,3 × la taille, dans 400 px.
  const liste = {style: {fontSize: ""}, clientHeight: 400, get scrollHeight() { return Math.ceil(11 * 1.3 * (parseFloat(this.style.fontSize) || 40)); }};
  new Function("boulier", "getComputedStyle", `${source}; ajusterTableFinale();`)({dom: {tableFinale: liste}}, () => ({fontSize: "40px"}));
  const taille = parseFloat(liste.style.fontSize);
  assert.ok(liste.scrollHeight <= liste.clientHeight + 1, "plus rien à faire défiler");
  assert.equal(taille, 28, "la plus grande écriture qui tient (40 px en demandait 572)");
  // Assez de place : la taille du style n'est pas touchée.
  const large = {style: {fontSize: ""}, clientHeight: 900, scrollHeight: 572};
  new Function("boulier", "getComputedStyle", `${source}; ajusterTableFinale();`)({dom: {tableFinale: large}}, () => ({fontSize: "40px"}));
  assert.equal(large.style.fontSize, "");
});
