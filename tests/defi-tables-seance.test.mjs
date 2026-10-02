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
  assert.equal(P.VERSION, 3, "pas de migration : la version ne change pas");
  const neuf = P.creerParcours();
  assert.deepEqual(neuf.tables[7].bouts, []);
  assert.deepEqual(neuf.tables[7].seance, {depart: 1, n: 0});
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
  assert.deepEqual(propre.tables[7].seance, {depart: 1, n: 0});
  assert.deepEqual(propre.tables[7].sansFaute, {desordre: 0, trous: 1});
  assert.deepEqual(propre.seances, ["2026-10-05", "2026-10-06", "2026-10-06"]);
  assert.equal(P.estVide(P.appliquerReponse(neuf, "1-3", {correcte: true}).parcours), false, "un bout réussi est déjà du travail");
});

test("la séance : Mes calculs du jour s'il y en a, le mélange s'il est dû, puis trois marches qui se suivent", () => {
  let p = P.creerParcours();
  assert.deepEqual(P.MARCHES.map(m => m.nom), ["Les perles", "Je construis la bande", "La bande à trous", "Dans l’ordre", "Dans le désordre", "Nombres manquants", "Résultats et nombres manquants", "Je valide ma table"]);
  assert.deepEqual(nomsDe(p, jour(1)), ["Les perles", "Je construis la bande", "La bande à trous"], "jour 1 : marches 1, 2, 3 de la table de 2");
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(1)}).table, 2, "sans choix, la première table de l'ordre conseillé");
  assert.deepEqual(nomsDe(p, jour(1), 7), ["Les perles", "Je construis la bande", "La bande à trous"]);
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(1), table: 7}).table, 7, "le changement de table est libre");
  p.tables[2].seance = {depart: 3, n: 2};
  p = P.appliquerReponse(p, "2-6", {correcte: true, date: jour(1)}).parcours;
  assert.deepEqual(nomsDe(p, jour(2)), ["Mes calculs du jour", "La bande à trous", "Dans l’ordre", "Dans le désordre"], "un calcul dû : la séance commence par lui");
  assert.equal(P.programmeDeSeance(p, P.ouvrirSeance(p, {aujourdhui: jour(2)}), jour(2)).minutes, 8);
  // Le mélange dû passe entre les calculs du jour et la table.
  p.tables[2].acquise = jour(1); p.tables[10].acquise = jour(1);
  p = P.normaliserParcours(p);
  assert.equal(P.melangeDu(p), true);
  assert.deepEqual(nomsDe(p, jour(2)).slice(0, 3), ["Mes calculs du jour", "Mon mélange", "Les perles"]);
  assert.equal(P.ouvrirSeance(p, {aujourdhui: jour(2)}).table, 5);
  // Une table acquise, choisie exprès : ses trois entraînements, rien ne bouge.
  assert.deepEqual(nomsDe(p, jour(2), 2).slice(2), ["Dans le désordre", "Nombres manquants", "Résultats et nombres manquants"]);
  const acquise = jouerSeance(p, jour(2), () => 0, 2);
  assert.deepEqual(acquise.parcours.tables[2].seance, {depart: 3, n: 2}, "le départ d'une table acquise ne bouge pas");
  // Les 9 tables acquises : plus de marches.
  P.TABLES.forEach(table => { p.tables[table].acquise = jour(1); });
  p = P.normaliserParcours(p);
  assert.equal(P.tableDeSeance(p), null);
  assert.ok(nomsDe(p, jour(2)).every(nom => ["Mes calculs du jour", "Mon mélange"].includes(nom)));
});

test("l’échelle à décalage : +1 par séance finie, +2 quand les trois marches sont sans faute, jamais plus loin que 6-7-8", () => {
  let p = P.creerParcours();
  // Une erreur dans la bande : la séance est finie, pas sans faute.
  let s = jouerSeance(p, jour(1), etape => (etape.cle === "construct" ? 1 : 0));
  assert.deepEqual(s.noms, [1, 2, 3]);
  assert.equal(s.seance.finie, true);
  assert.deepEqual(s.parcours.tables[2].seance, {depart: 2, n: 1}, "jour 2 : marches 2, 3, 4");
  assert.equal(s.seance.avance, 1);
  s = jouerSeance(s.parcours, jour(2));
  assert.deepEqual(s.noms, [2, 3, 4]);
  assert.deepEqual(s.parcours.tables[2].seance, {depart: 4, n: 2}, "tout sans faute : deux marches d'un coup");
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
  assert.deepEqual(encore.noms, [2, 3, 4], "le même jour, la séance suivante est décalée d'une marche");
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
  assert.deepEqual(note.parcours.tables[2].seance, {depart: 1, n: 1}, "le départ est descendu TOUT DE SUITE (onglet fermé ou non)");
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

test("la marche 8 : la validation si la table est prête, sinon un entraînement à sa place ; jamais tant que le mélange est dû", () => {
  let p = P.creerParcours();
  p.tables[3].seance = {depart: 6, n: 5};
  assert.deepEqual(nomsDe(p, jour(1), 3), ["Nombres manquants", "Résultats et nombres manquants", "Je valide ma table (si prêts)"]);
  let s = jouerSeance(p, jour(1), () => 1, 3);
  assert.deepEqual(s.noms, [6, 7, 5], "pas prête : « Dans le désordre » à la place de la validation");
  assert.equal(s.parcours.tables[3].acquise, null);
  // Le lendemain, les calculs du jour font monter les boîtes : la table est prête.
  s = jouerSeance(s.parcours, jour(2), () => 1, 3);
  assert.deepEqual(s.noms.slice(0, 1), ["revision"]);
  // Prête (10 cases pleines) : la marche 8 est la validation.
  let q = P.creerParcours();
  q.tables[3].seance = {depart: 6, n: 5};
  for (const date of [jour(1), jour(2)]) for (let m = 1; m <= 10; m += 1) q = P.appliquerReponse(q, `3-${m}`, {correcte: true, date}).parcours;
  assert.equal(P.validationDeSeance(q, 3), true);
  s = jouerSeance(q, jour(3), etape => (etape.type === "validation" ? 1 : 0), 3);
  assert.deepEqual(s.noms, [6, 7, "validation"]);
  assert.equal(s.parcours.tables[3].acquise, jour(3));
  // Le mélange dû : pas de validation d'une autre table.
  q.tables[2].acquise = jour(1); q.tables[10].acquise = jour(1);
  q = P.normaliserParcours(q);
  assert.equal(P.validationDeSeance(q, 3), false);
  s = jouerSeance(q, jour(3), etape => (etape.type === "melange" ? 5 : 0), 3);
  assert.deepEqual(s.noms, ["melange", 6, 7, 5], "mélange raté : la table continue, la validation attend");
  s = jouerSeance(q, jour(3), etape => (["melange", "validation"].includes(etape.type) ? 1 : 0), 3);
  assert.deepEqual(s.noms, ["melange", 6, 7, "validation", "melange"], "mélange réussi, validation réussie : le mélange suit, avec la nouvelle table");
  assert.equal(P.melangeDu(s.parcours), false);
});

test("une table prête pendant la séance le reste : une erreur à l'entraînement d'avant n'annule pas la validation", () => {
  let q = P.creerParcours();
  q.tables[3].seance = {depart: 6, n: 5};
  for (const date of [jour(1), jour(2)]) for (let m = 1; m <= 10; m += 1) q = P.appliquerReponse(q, `3-${m}`, {correcte: true, date}).parcours;
  // Une erreur à chaque entraînement (jamais de 10 sur 10, donc pas de raccourci).
  const s = jouerSeance(q, jour(3), () => 1, 3);
  assert.deepEqual(s.noms, [6, 7, "validation"], "prête à l'ouverture : la marche 8 est la validation, malgré les deux erreurs");
  assert.equal(P.raccourciValidation(s.parcours, 3), false);
  // Pas prête à l'ouverture, prête après Mes calculs du jour : pareil.
  let r = P.creerParcours();
  r.tables[4].seance = {depart: 6, n: 5};
  for (let m = 1; m <= 10; m += 1) r = P.appliquerReponse(r, `4-${m}`, {correcte: true, date: jour(1)}).parcours;
  assert.equal(P.ouvrirSeance(r, {aujourdhui: jour(2), table: 4}).prete, false);
  const t = jouerSeance(r, jour(2), etape => (etape.type === "revision" ? 0 : 1), 4);
  assert.deepEqual(t.noms, ["revision", 6, 7, "validation"]);
  // Le mélange dû garde son verrou, même sur une table vue prête.
  q.tables[2].acquise = jour(1); q.tables[10].acquise = jour(1);
  q = P.normaliserParcours(q);
  const seance = P.ouvrirSeance(q, {aujourdhui: jour(3), table: 3});
  assert.equal(seance.prete, true);
  assert.equal(P.validationDeSeance(q, 3, seance), false);
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

test("le raccourci : 10 sur 10 à « Dans le désordre » ET à « Nombres manquants » → la validation tout de suite", () => {
  let p = P.creerParcours();
  p.tables[3].seance = {depart: 4, n: 3};
  // Un seul des deux ne suffit pas.
  let s = jouerSeance(p, jour(1), etape => (etape.marche === 6 ? 1 : 0), 3);
  assert.deepEqual(s.noms, [4, 5, 6]);
  assert.deepEqual(s.parcours.tables[3].sansFaute, {desordre: 1, trous: 0});
  assert.equal(P.raccourciValidation(s.parcours, 3), false);
  // Les deux : la validation devient l'étape suivante, même si les boîtes ne sont pas prêtes.
  s = jouerSeance(p, jour(1), () => 0, 3);
  assert.deepEqual(s.noms, [4, 5, 6, "validation"]);
  assert.equal(P.rangeeTable(P.creerParcours(), 3).prete, false);
  assert.equal(s.parcours.tables[3].acquise, jour(1), "validée dans la séance, sans attendre les boîtes");
  // Dans la séance 5-6-7 : la validation prend la place de la marche 7.
  p.tables[3].seance = {depart: 5, n: 4};
  s = jouerSeance(p, jour(1), etape => (etape.type === "validation" ? 6 : 0), 3);
  assert.deepEqual(s.noms, [5, 6, "validation", 7], "validation ratée : retour à la marche 7");
  assert.equal(s.parcours.tables[3].seance.depart, 6);
  assert.deepEqual(nomsDe(s.parcours, jour(2), 3).slice(-1), ["Je valide ma table"], "le raccourci reste gagné : la marche 8 est la validation");
  // Un 10 sur 10 hors séance (« Choisir une activité ») compte aussi.
  let q = P.creerParcours();
  q = P.appliquerSerie(q, P.configEntraine(3, "desordre"), {correct: 10, total: 10, date: jour(1)}).parcours;
  q = P.appliquerSerie(q, P.configEntraine(3, "trous"), {correct: 9, total: 10, date: jour(1)}).parcours;
  assert.deepEqual(q.tables[3].sansFaute, {desordre: 1, trous: 0});
  q = P.appliquerSerie(q, P.configEntraine(3, "trous"), {correct: 10, total: 10, date: jour(1)}).parcours;
  assert.equal(P.raccourciValidation(q, 3), true);
  // Le mélange dû : le raccourci ne passe pas le verrou.
  q.tables[2].acquise = jour(1); q.tables[10].acquise = jour(1);
  q = P.normaliserParcours(q);
  assert.equal(P.validationDeSeance(q, 3), false);
});

test("« Cette semaine » : les jours avec une séance finie, depuis lundi ; une séance arrêtée ne compte pas", () => {
  let p = P.creerParcours();
  assert.deepEqual(P.bilanSeances(p, jour(1)), {semaine: 0, objectif: 4, aujourdhui: 0});
  // Arrêtée après une étape : rien n'est compté, le départ ne bouge pas.
  let seance = P.ouvrirSeance(p, {aujourdhui: jour(1)});
  ({parcours: p, seance} = jouerEtape(p, seance, P.etapeDeSeance(p, seance, jour(1)), jour(1)));
  assert.equal(seance.finie, false);
  assert.deepEqual(p.seances, []);
  assert.deepEqual(p.tables[2].seance, {depart: 1, n: 0});
  p = jouerSeance(p, jour(1), () => 1).parcours;
  p = jouerSeance(p, jour(1), () => 1).parcours;
  p = jouerSeance(p, jour(3), () => 1).parcours;
  assert.deepEqual(P.bilanSeances(p, jour(3)), {semaine: 2, objectif: 4, aujourdhui: 1}, "deux séances le même jour = un jour");
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
    assert.deepEqual(fusion.tables[3].seance, {depart: 3, n: 5}, "le départ redescendu par la séance la plus récente n'est pas remonté par l'autre appareil");
    assert.deepEqual(fusion.tables[4].seance, {depart: 4, n: 2}, "à égalité, le plus avancé");
    assert.deepEqual(fusion.tables[3].sansFaute, {desordre: 1, trous: 1});
    assert.deepEqual(fusion.seances, [jour(1), jour(1), jour(2), jour(3)]);
  }
  assert.deepEqual(P.fusionner(a, a).seances, a.seances, "fusionner deux fois le même parcours ne compte rien en double");
});

test("trois élèves types : celui qui sait tout, le moyen, celui qui ne sait rien", () => {
  // 1. Sait tout, suit la séance : 1-2-3, 3-4-5, puis 5-6 et le raccourci.
  let p = P.creerParcours();
  const seances = [];
  for (let n = 1; n <= 3; n += 1) { const s = jouerSeance(p, jour(n)); p = s.parcours; seances.push(s.noms.join(",")); }
  assert.deepEqual(seances, ["1,2,3", "3,4,5", "revision,5,6,validation"]);
  assert.equal(p.tables[2].acquise, jour(3), "la table de 2 acquise à la troisième séance");
  // 2. Moyen (une erreur par entraînement, jamais de 10 sur 10) : pas de raccourci ;
  //    il valide le jour où sa rangée est prête après Mes calculs du jour.
  p = P.creerParcours();
  let acquiseA = null;
  const programme = [];
  for (let n = 1; n <= 14 && !acquiseA; n += 1) {
    const s = jouerSeance(p, jour(n), etape => (etape.type === "entraine" ? 1 : 0));
    p = s.parcours; programme.push(s.noms.join(","));
    if (p.tables[2].acquise) acquiseA = n;
  }
  assert.equal(P.raccourciValidation(p, 2), false);
  assert.ok(acquiseA >= 4 && acquiseA <= 7, `le moyen valide la table de 2 entre la 4e et la 7e séance (ici : ${acquiseA} — ${programme.join(" | ")})`);
  assert.ok(programme.some(noms => /6,7,5$/.test(noms)) || programme.some(noms => /validation/.test(noms)));
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

test("la page : tout est derrière la clé ?seance=1 ; sans elle, l'accueil et les bilans d'avant", () => {
  assert.match(html, /const CLE_SEANCE = "mathsgo-defi-tables-seance";/);
  assert.match(html, /if \(demande === "0"\) durable\.removeItem\(CLE_SEANCE\);\s*else if \(demande !== null\) durable\.setItem\(CLE_SEANCE, "1"\);\s*return durable\.getItem\(CLE_SEANCE\) === "1";/, "?seance=1 pose la clé sur l'appareil, ?seance=0 la retire");
  assert.match(html, /const SEANCE = lireCleSeance\(\);\s*document\.body\.classList\.toggle\("avec-seance", SEANCE\);/);
  assert.match(html, /const avecSeance = SEANCE && !replie;/, "l'accueil de la séance ne se pose qu'avec la clé");
  assert.match(html, /if \(avecSeance\) renderSeanceAccueil\(etapes, etat, table, ligne\);\s*if \(!replie && !carteSeance\) \{/);
  assert.match(html, /if \(SEANCE\) renderSemaine\(etat\);/);
  assert.match(html, /function enSeance\(\) \{\s*return SEANCE && Boolean\(seance\) && state\.origin === "seance";/, "une série hors séance garde son bilan d'avant");
  assert.match(html, /if \(enSeance\(\)\) noterEtapeDeSeance\(suivi\);\s*show\("result"\);/);
  assert.match(html, /function backToModes\(\) \{\s*quitterSeance\(\);/, "revenir à Ma table quitte la séance");
  assert.match(html, /mixte: SEANCE \? "résultats et nombres manquants" : "les deux à la fois"/);
  assert.match(html, /return SEANCE \? libelle\.replace\("les deux à la fois", "résultats et nombres manquants"\) : libelle;/);
  // Ce que la page pose, et où.
  assert.match(html, /<div id="acc-semaine" class="semaine" hidden><\/div>/);
  assert.match(html, /<div id="seance-fil" class="seance-fil" hidden><\/div>\s*<div class="status">/, "le fil de la séance est au-dessus de la barre");
  assert.match(html, /<div id="seance-fil-resultat" class="seance-fil centre" hidden><\/div>\s*<div id="result-verdict"/);
  assert.match(html, /<div id="seance-suite" class="seance-suite" hidden><\/div>/);
  // Entre deux étapes : UN bouton, « Arrêter la séance », pas de « Rejouer ».
  assert.match(html, /\.result\.en-seance \.result-actions,\s*\.result\.en-seance #result-parcours,\s*\.result\.en-seance #result-message,\s*\.result\.en-seance #result-previous,\s*\.result\.en-seance \.result-config \{ display: none !important; \}/);
  assert.match(html, /suite\.textContent = `Étape \$\{seance\.faites\.length \+ 1\}\\u00a0: \$\{prochaine\.nom\} →`;/);
  assert.match(html, /arreter\.textContent = "Arrêter la séance";\s*arreter\.addEventListener\("click", backToModes\);/);
  assert.match(html, /\$\("result-title"\)\.textContent = "Séance du jour faite";/);
  assert.match(html, /encore\.textContent = "Encore une séance";/);
  // La rangée : une case vide reste sans nombre.
  assert.match(html, /if \(item\.etat !== "vide"\) \{\s*cellule\.className = item\.etat;\s*cellule\.textContent = String\(item\.produit\);\s*\}/);
  // Les bouts sont gardés même sans la clé (rien ne s'affiche, rien ne se perd).
  assert.match(html, /if \(!resultat\.fait && resultat\.bouts && resultat\.bouts\.length\) \{\s*parcours = resultat\.parcours;\s*sauverParcours\(\);\s*\}/);
  // Les perles : le doigt (pixels d'écran) est ramené aux pixels du boulier quand le cadre est réduit.
  assert.match(html, /const zoom = rect\.width \/ boulier\.dom\.interieur\.offsetWidth \|\| 1;\s*const x = \(event\.clientX - rect\.left\) \/ zoom;/);
  assert.match(html, /const ecart = \(event\.clientX - drag\.depart\) \/ drag\.zoom;/);
  // Le bloc « Mes calculs du jour » quitte l'accueil de la séance, pas Mes calculs.
  assert.match(html, /if \(avecSeance\) reviser\.hidden = true;/);
  assert.match(html, /<button id="calculs-reviser" class="primary" type="button">/);
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
  const code = extraire("function rangeeDeTable(table) {", "// L'écran entre deux étapes")
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
    const fabrique = new Function("$", "PARCOURS", "parcours", "seance", "document", "pluriel", "soude", "backToModes", "tableDeLaSeance", "commencerSeance",
      `${code}\nreturn renderBilanSeance;`);
    const renderBilanSeance = fabrique(
      $, P, parcours,
      {table: 2, faites: [{nom: "Les perles", juste: 11, total: 11, rate: false, reussi: null}]},
      {createElement: balise => element(balise), createTextNode: texte => ({textContent: texte})},
      (nombre, mot) => `${nombre} ${mot}${nombre > 1 ? "s" : ""}`,
      texte => texte, () => {}, () => undefined, () => {}
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
});

// Relecture de Code (02/10/2026) : la fonction de la page est EXÉCUTÉE avec un
// faux DOM — un test sur le texte ne dirait rien de l'étiquette restée en place.
test("« Cette semaine » : à la 5e séance, page ouverte, l'étiquette des ronds ne survit pas au texte", () => {
  const debut = html.indexOf("function renderSemaine(etat) {");
  const fin = html.indexOf("// [seance:fin]", debut);
  assert.ok(debut > 0 && fin > debut, "renderSemaine introuvable dans la page");
  const element = () => ({
    attributs: {}, enfants: [], className: "", hidden: true, texte: "",
    setAttribute(nom, valeur) { this.attributs[nom] = String(valeur); },
    removeAttribute(nom) { delete this.attributs[nom]; },
    getAttribute(nom) { return nom in this.attributs ? this.attributs[nom] : null; },
    append(...enfants) { this.enfants.push(...enfants); },
    replaceChildren() { this.enfants = []; this.texte = ""; },
    set textContent(valeur) { this.enfants = []; this.texte = valeur; },
    get textContent() { return this.texte + this.enfants.map(enfant => enfant.textContent).join(""); },
    querySelector() { return null; }
  });
  const zones = {"acc-semaine": element(), "acc-jours": element(), "open-parcours": element()};
  let semaine = 4;
  const fabrique = new Function("$", "PARCOURS", "document", "pluriel", "PARCOURS_TABLES", "parcours",
    `${html.slice(debut, fin)}\nreturn renderSemaine;`);
  const renderSemaine = fabrique(
    id => zones[id],
    {bilanSeances: () => ({semaine, objectif: 4, aujourdhui: 1})},
    {createElement: () => element()},
    (nombre, mot) => `${nombre} ${mot}${nombre > 1 ? "s" : ""}`,
    [2, 3, 4, 5, 6, 7, 8, 9, 10],
    P.creerParcours()
  );
  const zone = zones["acc-semaine"];
  renderSemaine({acquises: []});
  assert.equal(zone.getAttribute("aria-label"), "Cette semaine : 4 jours avec une séance sur 4");
  semaine = 5;
  renderSemaine({acquises: []});
  assert.equal(zone.textContent, "5 jours cette semaine ✓");
  assert.equal(zone.getAttribute("aria-label"), null, "l'étiquette « 4 sur 4 » contredirait le texte lu");
  semaine = 1; // lundi suivant : les ronds et leur étiquette reviennent
  renderSemaine({acquises: []});
  assert.equal(zone.getAttribute("aria-label"), "Cette semaine : 1 jour avec une séance sur 4");
});

test("le moteur a changé : nouveau numéro de cache, copie serveur identique, serveur qui accepte les nouvelles clés", () => {
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261002-1/);
  const moteur = readFileSync(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url));
  const copie = readFileSync(new URL("../_serveur/public/prof/defi_tables_mon_parcours.js", import.meta.url));
  assert.ok(moteur.equals(copie), "cp outils/calcul_mental/defi_tables_mon_parcours.js _serveur/public/prof/");
  for (const cle of ["bouts", "seance", "depart", "n", "sansFaute", "seances"]) {
    assert.match(applis, new RegExp(`'${cle}'`), `lib/applis.php doit accepter « ${cle} »`);
  }
  const reference = JSON.parse(readFileSync(new URL("../_serveur/tests/parcours-reference.json", import.meta.url), "utf8"));
  assert.deepEqual(reference.tables[10].bouts, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "le parcours de référence porte les bouts (node scripts/generer-parcours-reference.mjs)");
  assert.equal(typeof reference.tables[7].seance.depart, "number");
  assert.equal(reference.seances.length, 4);
});
