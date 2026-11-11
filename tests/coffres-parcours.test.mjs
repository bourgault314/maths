// Lot « Coffres magiques sur le suivi » (21/10/2026) : le moteur du parcours
// élève de Coffres magiques (assets/js/coffres-parcours.js) — le format, les
// gestes, la fusion, la vue du professeur et de la tuile, les réglages de la
// classe, et le client du suivi, EXÉCUTÉS dans un faux monde.
//
// Sabotages attendus (chacun rend au moins un test rouge) : voir
// coffres-suivi-sabotages.py dans le dossier du lot.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PARCOURS, fauxStockage, fauxServeur, fauxDocument, fauxTemps, tic, A, B, SERIE_DEUX, partieSix, parcoursAvecTresors,
  chainesLibres, lire} from "./coffres-suivi-monde.mjs";
import {parcoursComplet, CHEMIN} from "../scripts/generer-parcours-reference-coffres.mjs";

const SERIE = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];

// ------------------------------------------------------------------ le format

test("un parcours neuf est vide ; normaliser borne tout, ne garde que ce qui compte", () => {
  // Version 2 depuis le lot S1 « les journaux » (le journal des jours joués).
  assert.deepEqual(PARCOURS.creer(), {version: 2, epoque: 0, niveaux: {}, operations: {}});
  assert.equal(PARCOURS.estVide(PARCOURS.creer()), true);
  const p = PARCOURS.normaliser({
    epoque: "3",
    niveaux: {"1": {tresors: 5, parfaits: 9}, "2": {tresors: 0, parfaits: 0}, "4": {tresors: 3, parfaits: 1}, "x": {tresors: 1}},
    operations: {sum: {cles: 2, aides: -1, solutions: "7", erreurs: 1.5}, puissance: {cles: 3}, product: {cles: 0, aides: 0, solutions: 0, erreurs: 0}},
    dernier: "2026-13-01",
    partie: {niveau: 2, ops: [3, 1, 1, 9], serie: SERIE_DEUX, familles: [true], cles: 99, parfait: "oui", jour: "2026-10-21"},
    prenom: "Léa"
  });
  assert.deepEqual(p.niveaux, {"1": {tresors: 5, parfaits: 5}}, "parfaits ≤ trésors ; un niveau à zéro ou hors 1-3 saute");
  assert.deepEqual(p.operations, {sum: {cles: 2, aides: 0, solutions: 7, erreurs: 0}}, "des entiers bornés ; une opération inconnue ou à zéro saute");
  assert.equal(p.dernier, undefined, "une fausse date saute");
  assert.deepEqual(p.partie, {niveau: 2, ops: [1, 3], serie: SERIE_DEUX, familles: SERIE_DEUX.map(() => false), cles: 10, parfait: true, jour: "2026-10-21"},
    "les opérations triées sans doublon ni inconnue ; 10 clés au plus ; des familles de la bonne longueur ou rien");
  assert.equal("prenom" in p, false);
  assert.equal(PARCOURS.estVide(p), false);
});

test("une partie sans série complète, ou dont la série sort des opérations choisies, n'est pas une partie", () => {
  for (const partie of [
    {niveau: 2, ops: [1], serie: [1, 1, 1], cles: 1},
    {niveau: 2, ops: [1], serie: SERIE_DEUX, cles: 1},
    {niveau: 0, ops: [1], serie: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], cles: 1},
    {niveau: 1, ops: [], serie: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], cles: 1},
    null, "partie", 7
  ]) {
    assert.equal(PARCOURS.normaliserPartie(partie), null, JSON.stringify(partie));
  }
  assert.equal("partie" in PARCOURS.normaliser({partie: {niveau: 2, ops: [1], serie: SERIE_DEUX}}), false);
});

// ------------------------------------------------------------------ les gestes

test("commencer, gagner des clés, se tromper, demander de l'aide, voir une solution, ouvrir le trésor", () => {
  let p = PARCOURS.creer();
  p = PARCOURS.commencerPartie(p, {niveau: 2, ops: ["sum", "product"], serie: ["sum", "product", "sum", "product", "sum", "product", "sum", "product", "sum", "product"], familles: [true, false, false, false, false, false, false, false, false, false]}, "2026-10-21");
  assert.deepEqual(p.partie, {niveau: 2, ops: [1, 3], serie: SERIE_DEUX, familles: [true, false, false, false, false, false, false, false, false, false], cles: 0, parfait: true, jour: "2026-10-21"},
    "les clés et les numéros d'opérations se valent");
  p = PARCOURS.noterCle(p, "sum", "2026-10-21");
  p = PARCOURS.noterAide(p, "product", "2026-10-21");
  assert.equal(p.partie.parfait, true, "regarder le cours n'est pas tricher");
  p = PARCOURS.noterErreur(p, "product", "2026-10-21");
  assert.equal(p.partie.parfait, false, "une erreur : la partie n'est plus parfaite");
  p = PARCOURS.noterSolution(p, "product", "2026-10-21");
  p = PARCOURS.noterCle(p, 3, "2026-10-21");
  // Une solution montrée suffit, à elle seule, à retirer le parfait.
  const seule = PARCOURS.noterSolution(PARCOURS.commencerPartie(PARCOURS.creer(), {niveau: 1, ops: [1], serie: new Array(10).fill(1)}, "2026-10-21"), "sum", "2026-10-21");
  assert.equal(seule.partie.parfait, false, "« Montrer une solution » : la partie n'est plus parfaite");
  assert.equal(seule.operations.sum.solutions, 1);
  assert.deepEqual(p.operations, {sum: {cles: 1, aides: 0, solutions: 0, erreurs: 0}, product: {cles: 1, aides: 1, solutions: 1, erreurs: 1}});
  assert.equal(p.partie.cles, 2);
  for (let i = 0; i < 8; i += 1) p = PARCOURS.noterCle(p, "sum", "2026-10-22");
  assert.equal(p.partie.cles, 10, "jamais plus de dix");
  assert.equal(p.partie.jour, "2026-10-22", "le jour du dernier geste");
  p = PARCOURS.noterTresor(p, "2026-10-22");
  assert.deepEqual(p.niveaux, {"2": {tresors: 1, parfaits: 0}}, "un trésor au niveau de la partie, pas parfait");
  assert.equal(p.dernier, "2026-10-22");
  assert.equal("partie" in p, false, "la partie en cours s'efface");
  // Un trésor parfait.
  p = PARCOURS.commencerPartie(p, {niveau: 2, ops: [1, 3], serie: SERIE_DEUX}, "2026-10-23");
  SERIE_DEUX.forEach(op => { p = PARCOURS.noterCle(p, op, "2026-10-23"); });
  p = PARCOURS.noterTresor(p, "2026-10-23");
  assert.deepEqual(p.niveaux, {"2": {tresors: 2, parfaits: 1}});
  assert.equal(p.operations.sum.cles, 9 + 5, "les clés gagnées s'additionnent, trésor après trésor");
  // Un geste sur une opération inconnue ne fait rien ; un trésor sans partie
  // prend le niveau donné.
  assert.deepEqual(PARCOURS.noterCle(p, "puissance", "2026-10-23"), p);
  const sansPartie = PARCOURS.noterTresor(p, "2026-10-24", {niveau: 3, parfait: true});
  assert.deepEqual(sansPartie.niveaux["3"], {tresors: 1, parfaits: 1});
  assert.deepEqual(PARCOURS.noterTresor(p, "2026-10-24"), p, "ni partie ni niveau : rien");
  assert.equal(PARCOURS.noterTresor(p, "2026-10-24").dernier, "2026-10-23");
});

test("abandonner la partie : les clés gagnées restent dans le cumul, les trésors restent", () => {
  let p = PARCOURS.commencerPartie(parcoursAvecTresors(), {niveau: 2, ops: [1, 3], serie: SERIE_DEUX}, "2026-10-21");
  p = PARCOURS.noterCle(p, 1, "2026-10-21");
  const avant = PARCOURS.normaliser(p);
  p = PARCOURS.oublierPartie(p);
  assert.equal("partie" in p, false);
  assert.deepEqual(p.operations, avant.operations);
  assert.deepEqual(p.niveaux, avant.niveaux);
});

test("les gestes rendent un parcours neuf : le reçu n'est pas modifié", () => {
  const p = PARCOURS.commencerPartie(PARCOURS.creer(), {niveau: 1, ops: [1], serie: new Array(10).fill(1)}, "2026-10-21");
  const copie = JSON.stringify(p);
  PARCOURS.noterCle(p, 1); PARCOURS.noterErreur(p, 1); PARCOURS.noterTresor(p); PARCOURS.oublierPartie(p);
  assert.equal(JSON.stringify(p), copie);
});

// ------------------------------------------------------------------ la fusion

test("fusion : le maximum de chaque compteur, la date la plus récente, la partie la plus récente puis la plus avancée", () => {
  const a = {version: 1, epoque: 0, niveaux: {"1": {tresors: 3, parfaits: 2}}, operations: {sum: {cles: 10, aides: 1, solutions: 0, erreurs: 2}}, dernier: "2026-10-10",
    partie: partieSix({cles: 6, jour: "2026-10-20"})};
  const b = {version: 1, epoque: 0, niveaux: {"1": {tresors: 2, parfaits: 2}, "2": {tresors: 1, parfaits: 0}}, operations: {sum: {cles: 8, aides: 3, solutions: 1, erreurs: 1}, product: {cles: 4, aides: 0, solutions: 0, erreurs: 0}}, dernier: "2026-10-12",
    partie: partieSix({cles: 2, jour: "2026-10-21", niveau: 1, ops: [1], serie: new Array(10).fill(1)})};
  const f = PARCOURS.fusionner(a, b);
  assert.deepEqual(f.niveaux, {"1": {tresors: 3, parfaits: 2}, "2": {tresors: 1, parfaits: 0}});
  assert.deepEqual(f.operations, {sum: {cles: 10, aides: 3, solutions: 1, erreurs: 2}, product: {cles: 4, aides: 0, solutions: 0, erreurs: 0}});
  assert.equal(f.dernier, "2026-10-12");
  assert.equal(f.partie.cles, 2, "la partie du jour le plus récent gagne, même moins avancée");
  assert.equal(f.partie.niveau, 1);
  // Même jour : la plus avancée.
  const c = Object.assign({}, b, {partie: partieSix({cles: 3, jour: "2026-10-20"})});
  assert.equal(PARCOURS.fusionner(a, c).partie.cles, 6);
  assert.equal(PARCOURS.fusionner(c, a).partie.cles, 6, "dans les deux sens");
  // Une seule partie : elle reste.
  assert.equal(PARCOURS.fusionner(a, PARCOURS.creer()).partie.cles, 6);
  assert.equal("partie" in PARCOURS.fusionner(PARCOURS.oublierPartie(a), PARCOURS.oublierPartie(b)), false);
});

test("fusion : à époque différente, la plus haute gagne en bloc (restauration par le professeur)", () => {
  const restauree = Object.assign(parcoursAvecTresors(), {epoque: 5});
  const appareil = Object.assign(PARCOURS.commencerPartie(parcoursAvecTresors(), {niveau: 3, ops: [4], serie: new Array(10).fill(4)}, "2026-10-21"), {epoque: 4});
  appareil.niveaux["1"].tresors = 9;
  const f = PARCOURS.fusionner(appareil, restauree);
  assert.deepEqual(f, PARCOURS.normaliser(restauree));
  assert.equal(f.niveaux["1"].tresors, 2, "les neuf trésors de l'appareil ne reviennent pas");
  assert.equal("partie" in f, false);
});

// ------------------------------------------------------- le serveur, la référence

test("ce qui part au serveur : le format, rien d'autre — jamais un plateau, une cible ni un texte", () => {
  const p = PARCOURS.commencerPartie(parcoursAvecTresors(), {niveau: 2, ops: [1, 3], serie: SERIE_DEUX, plateau: [5, 12], cible: 77}, "2026-10-21");
  const sortie = PARCOURS.pourServeur(Object.assign({prenom: "Léa"}, p));
  assert.deepEqual(chainesLibres(sortie), []);
  assert.equal("plateau" in sortie.partie, false);
  assert.equal("prenom" in sortie, false);
  // Lot S1 : le journal des jours joués part avec le reste.
  assert.deepEqual(Object.keys(sortie), ["version", "epoque", "niveaux", "operations", "dernier", "partie", "jours", "journal", "depuis"]);
});

test("le parcours de référence du serveur est à jour (node scripts/generer-parcours-reference-coffres.mjs)", () => {
  const reference = JSON.parse(readFileSync(CHEMIN, "utf8"));
  assert.deepEqual(reference, parcoursComplet(),
    "le moteur a changé la forme du parcours : relance « node scripts/generer-parcours-reference-coffres.mjs », puis complète 'cles'/'motifs' de « coffres » dans _serveur/public/lib/applis.php (le test PHP le vérifie)");
  assert.deepEqual(chainesLibres(reference), []);
  assert.equal(reference.partie.cles, 6);
  // Lot « le chemin des coffres et le cadeau Gloubi » (09/11/2026) : deux matchs de Gloubi joués au niveau 1.
  assert.deepEqual(reference.niveaux["1"], {tresors: 5, parfaits: 3, gloubi: 2, cran: 2}, "les chiffres de la maquette 01 (Léa)");
  assert.equal(reference.operations.sum.cles, 28);
});

test("lib/applis.php déclare pour « coffres » exactement CLES_SERVEUR et le motif des niveaux du moteur", () => {
  const catalogue = lire("_serveur/public/lib/applis.php");
  const debut = catalogue.indexOf("    'coffres' => [\n");
  assert.ok(debut > 0, "lib/applis.php doit déclarer l'appli « coffres »");
  const entree = catalogue.slice(debut, catalogue.indexOf("\n    ],\n", debut));
  const listePhp = cle => {
    // Jusqu'au « ], » qui ferme la liste en fin de ligne (le motif des niveaux contient lui-même des crochets).
    const m = entree.match(new RegExp(`'${cle}' => \\[([\\s\\S]*?)\\],\n`));
    assert.ok(m, `« ${cle} » doit être une liste PHP`);
    return [...m[1].matchAll(/'([^']*)'/g)].map(x => x[1]);
  };
  assert.deepEqual(listePhp("cles"), [...PARCOURS.CLES_SERVEUR]);
  assert.deepEqual(listePhp("motifs"), [PARCOURS.MOTIF_NIVEAUX_PHP]);
  assert.deepEqual(listePhp("mots"), [], "aucun mot : que des nombres, des booléens et des dates");
  assert.match(entree, /'compteur' => 'niveaux',/);
  assert.match(entree, /'disponible' => true,/);
  assert.match(entree, /'url' => 'https:\/\/mathsgo\.re\/outils\/calcul_mental\/coffres_magiques_solo\.html',/, "la version solo, jamais le duo");
  assert.match(entree, /'nom' => 'Coffres magiques',/);
  assert.match(entree, /'description' => 'Trouve les deux nombres qui ouvrent le coffre\.',/, "la phrase de la tuile, choisie par Gwenaël");
  assert.match(entree, new RegExp(`'reglages' => \\['niveaux' => ${PARCOURS.NOMBRE_NIVEAUX}, 'operations' => ${PARCOURS.NOMBRE_OPERATIONS}\\],`));
  const regex = new RegExp(PARCOURS.MOTIF_NIVEAUX_PHP.slice(1, -1));
  ["1", "2", "3"].forEach(n => assert.ok(regex.test(n)));
  ["0", "4", "10", "1-3", "sum", ""].forEach(n => assert.equal(regex.test(n), false, n));
  assert.equal(PARCOURS.APPLI, "coffres");
});

// --------------------------------------------------------- la vue du professeur

test("resumeProf : trois niveaux, quatre opérations toujours, la partie en cours à partir d'une clé", () => {
  const vide = PARCOURS.resumeProf(null);
  assert.deepEqual(vide.niveaux.map(n => [n.numero, n.tresors, n.parfaits]), [[1, 0, 0], [2, 0, 0], [3, 0, 0]]);
  assert.deepEqual(vide.operations.map(o => o.nom), ["addition", "soustraction", "multiplication", "division"]);
  assert.equal(vide.commence, false);
  assert.equal(vide.partie, null);
  const reference = JSON.parse(readFileSync(CHEMIN, "utf8"));
  const r = PARCOURS.resumeProf(reference);
  assert.deepEqual(r.niveaux.map(n => [n.tresors, n.parfaits]), [[5, 3], [2, 1], [1, 0]]);
  assert.deepEqual(r.operations.map(o => [o.cles, o.aides, o.solutions, o.erreurs]), [[28, 1, 0, 1], [15, 0, 0, 1], [23, 2, 1, 1], [20, 1, 1, 1]]);
  assert.equal(r.tresors, 8);
  assert.equal(r.parfaits, 4);
  assert.equal(r.dernier, "2026-10-21");
  assert.deepEqual(r.partie, {niveau: 2, ops: [1, 3], operations: "addition et multiplication", cles: 6, total: 10});
  assert.equal(r.commence, true);
  // Une partie à 0 clé n'est qu'un choix de réglages : pas « en cours » pour le professeur.
  const zero = PARCOURS.commencerPartie(PARCOURS.creer(), {niveau: 1, ops: [1], serie: new Array(10).fill(1)});
  assert.equal(PARCOURS.resumeProf(zero).partie, null);
  assert.equal(PARCOURS.resumeProf(zero).commence, false);
});

test("nommerOperations : « addition », « addition et multiplication », « addition, soustraction et division »", () => {
  assert.equal(PARCOURS.nommerOperations([1]), "addition");
  assert.equal(PARCOURS.nommerOperations([1, 3]), "addition et multiplication");
  assert.equal(PARCOURS.nommerOperations(["sum", "difference", "quotient"]), "addition, soustraction et division");
  assert.equal(PARCOURS.nommerOperations([9]), "");
});

test("resumeTuile : une ligne par niveau commencé, la partie en cours au bout de la sienne, rien sinon", () => {
  assert.deepEqual(PARCOURS.resumeTuile(null), {lignes: [], vide: true});
  const reference = JSON.parse(readFileSync(CHEMIN, "utf8"));
  assert.deepEqual(PARCOURS.resumeTuile(reference).lignes, [
    {niveau: 1, tresors: 5, coffres: 3, cles: null, total: 10},
    {niveau: 2, tresors: 2, coffres: 2, cles: 6, total: 10},
    {niveau: 3, tresors: 1, coffres: 1, cles: null, total: 10}
  ]);
  // Niveau 3 commencé sans trésor : « pas encore de trésor » et 4 / 10.
  let p = PARCOURS.commencerPartie(parcoursAvecTresors(), {niveau: 3, ops: [4], serie: new Array(10).fill(4)}, "2026-10-21");
  for (let i = 0; i < 4; i += 1) p = PARCOURS.noterCle(p, 4, "2026-10-21");
  assert.deepEqual(PARCOURS.resumeTuile(p).lignes, [{niveau: 1, tresors: 2, coffres: 2, cles: null, total: 10}, {niveau: 3, tresors: 0, coffres: 0, cles: 4, total: 10}]);
  // Une partie à 0 clé ne fait pas de ligne.
  const zero = PARCOURS.commencerPartie(PARCOURS.creer(), {niveau: 2, ops: [1], serie: new Array(10).fill(1)});
  assert.equal(PARCOURS.resumeTuile(zero).vide, true);
});

// ------------------------------------------------------- les réglages de la classe

test("reglagesDeClasse : les listes du serveur, propres ; null = tout ouvert, dans le doute on ouvre", () => {
  assert.deepEqual(PARCOURS.reglagesDeClasse(null), {niveaux: null, operations: null});
  assert.deepEqual(PARCOURS.reglagesDeClasse({}), {niveaux: null, operations: null});
  assert.deepEqual(PARCOURS.reglagesDeClasse({coffres: {niveaux: [2, 1, 2, 9, "x"], operations: [3, 1]}}), {niveaux: [1, 2], operations: [1, 3]});
  assert.deepEqual(PARCOURS.reglagesDeClasse({coffres: {niveaux: [1, 2, 3], operations: "1"}}), {niveaux: null, operations: null});
  assert.deepEqual(PARCOURS.reglagesDeClasse({splat: {mondes: [1]}}), {niveaux: null, operations: null}, "les mondes de SPLAT! ne sont pas à Coffres");
  const r = PARCOURS.reglagesDeClasse({coffres: {niveaux: [2], operations: [1, 4]}});
  assert.deepEqual(PARCOURS.niveauxOuverts(r), [2]);
  assert.deepEqual(PARCOURS.operationsOuvertes(r).map(o => o.cle), ["sum", "quotient"]);
  assert.equal(PARCOURS.niveauOuvert(r, 1), false);
  assert.equal(PARCOURS.operationOuverte(r, "quotient"), true);
  assert.equal(PARCOURS.operationOuverte(r, 3), false);
  assert.equal(PARCOURS.operationOuverte(r, "puissance"), false);
  assert.deepEqual(PARCOURS.niveauxOuverts(null), [1, 2, 3]);
  assert.equal(PARCOURS.operationsOuvertes(null).length, 4);
});

test("partieCompatible : non si son niveau est fermé ou une de ses opérations retirée ; ouvrir davantage ne change rien", () => {
  const partie = partieSix();
  assert.equal(PARCOURS.partieCompatible(partie, null), true);
  assert.equal(PARCOURS.partieCompatible(partie, {coffres: {niveaux: [1, 2], operations: [1, 3, 4]}}), true);
  assert.equal(PARCOURS.partieCompatible(partie, {coffres: {niveaux: [1, 3]}}), false, "le niveau 2 fermé");
  assert.equal(PARCOURS.partieCompatible(partie, {coffres: {operations: [1]}}), false, "la multiplication retirée");
  assert.equal(PARCOURS.partieCompatible(partie, {niveaux: [2], operations: [1, 3]}), true, "accepte aussi les listes déjà lues");
  assert.equal(PARCOURS.partieCompatible(null, {coffres: {niveaux: [1]}}), true, "pas de partie : rien à abandonner");
});

test("les réglages de l'onglet : sous un code, avec le code ; tout ouvert = rien d'écrit ; un autre code ne les lit pas", () => {
  const session = fauxStockage();
  assert.equal(PARCOURS.sauverReglagesOnglet(session, A, {coffres: {niveaux: [2], operations: [1, 3]}}), true);
  assert.deepEqual(PARCOURS.chargerReglagesOnglet(session, A), {niveaux: [2], operations: [1, 3]});
  assert.deepEqual(PARCOURS.chargerReglagesOnglet(session, B), {niveaux: null, operations: null}, "un autre code : tout ouvert");
  assert.equal(JSON.parse(session.getItem(PARCOURS.CLE_REGLAGES)).code, A, "liés au code, dans l'onglet");
  PARCOURS.sauverReglagesOnglet(session, A, {niveaux: null, operations: null});
  assert.equal(session.getItem(PARCOURS.CLE_REGLAGES), null, "tout ouvert : la clé s'en va");
  assert.equal(PARCOURS.sauverReglagesOnglet(session, "p@s", {niveaux: [1]}), false);
  PARCOURS.sauverReglagesOnglet(session, A, {niveaux: [1], operations: null});
  PARCOURS.effacerCode(session);
  assert.equal(session.getItem(PARCOURS.CLE_REGLAGES), null, "effacer le code emporte les réglages");
});

// ---------------------------------------------------------------- le rangement

test("les cases locales : une par empreinte du code, jamais le code en clair ; la purge des 90 jours", () => {
  const local = fauxStockage();
  PARCOURS.sauver(local, parcoursAvecTresors(), A);
  PARCOURS.sauver(local, PARCOURS.creer(), "");
  assert.equal(PARCOURS.charger(local, A).niveaux["1"].tresors, 2);
  assert.equal(PARCOURS.clesRevelentUnCode(local), false);
  assert.ok(PARCOURS.cleStockage(A, local).startsWith("mathsgo-coffres-parcours:"));
  assert.equal(PARCOURS.cleStockage("", local), "mathsgo-coffres-parcours");
  PARCOURS.sauverSync(local, A, {revision: 3, dirty: false, maj: 1000});
  assert.equal(PARCOURS.purger(local, {maintenant: 1000 + PARCOURS.DUREE_CONSERVATION_MS + 1}), 1);
  assert.equal(local.getItem(PARCOURS.cleStockage(A, local)), null);
});

// ------------------------------------------------------------------ le client

function demarrer({entree = {}, local, session, serveur, codeOnglet = "", temps = null} = {}) {
  local = local || fauxStockage();
  session = session || fauxStockage();
  if (codeOnglet) PARCOURS.sauverCode(session, codeOnglet);
  serveur = serveur || fauxServeur({identite: {prenom: "Léa", classe: "CM1", reglages: {}}});
  const corps = [];
  const fetchBrut = serveur.fetch;
  const fetch = (url, options) => {
    corps.push({url, corps: options && options.body ? JSON.parse(String(options.body)) : null});
    return fetchBrut(url, options);
  };
  const rendus = [];
  const balises = [];
  const ecouteurs = {};
  const horloge = temps ? {now: () => temps.maintenant} : Date;
  const fenetre = {
    MATHSGO_ENTREE: Object.assign({billet: ""}, entree),
    location: {hash: "", pathname: "/outils/calcul_mental/coffres_magiques_solo.html", search: "", assign(url) { fenetre.allees.push(url); }},
    allees: [],
    setTimeout: temps ? (fn, ms) => temps.setTimeout(fn, ms) : (fn) => { fn(); return 1; },
    clearTimeout: temps ? id => temps.clearTimeout(id) : () => {},
    addEventListener(type, fn) { (ecouteurs[type] = ecouteurs[type] || []).push(fn); }
  };
  const client = PARCOURS.creerClient({
    fenetre, document: fauxDocument(), navigator: {sendBeacon(url, blob) { balises.push({url, blob}); return true; }}, fetch, horloge,
    stockage: () => local, stockageSession: () => session,
    rendre: {parcours: () => rendus.push("parcours"), repere: () => rendus.push("repere"), garde: () => rendus.push("garde")}
  });
  return {client, local, session, serveur, fenetre, rendus, balises, corps,
    declencher: (type, evenement) => (ecouteurs[type] || []).forEach(fn => fn(evenement)),
    envois: () => corps.filter(c => c.corps && c.corps.parcours)};
}

test("client : l'entrée par un billet — le code, l'identité, les réglages de la classe, puis le parcours du serveur, et « prêt »", async () => {
  const serveur = fauxServeur({identite: {prenom: "Léa", classe: "CM1", reglages: {coffres: {niveaux: [1, 2], operations: [1, 3]}}}});
  serveur.poser(A, PARCOURS.commencerPartie(parcoursAvecTresors(), partieSix(), "2026-10-20"), 4);
  // Le faux serveur rend l'identité à tout appel eleve.php : on y ajoute le code pour l'échange du billet.
  const fetchBrut = serveur.fetch;
  serveur.fetch = (url, options) => {
    if (url.endsWith("/api/eleve.php") && JSON.parse(String(options.body)).billet) {
      return Promise.resolve({ok: true, status: 200, headers: {get: () => null}, json: async () => ({ok: true, type: "entree", code: A, prenom: "Léa", classe: "CM1", reglages: {coffres: {niveaux: [1, 2], operations: [1, 3]}}})});
    }
    return fetchBrut(url, options);
  };
  const m = demarrer({entree: {billet: "0123456789abcdef0123456789abcdef"}, serveur});
  assert.equal(m.client.suiviActif(), false, "rien avant l'échange");
  const entre = await m.client.demarrer();
  assert.equal(entre, true);
  assert.equal(m.client.codeSuivi, A);
  assert.equal(m.client.suiviIdentite.prenom, "Léa");
  assert.deepEqual(m.client.reglagesOuverts(), {niveaux: [1, 2], operations: [1, 3]}, "les réglages arrivent avec le billet");
  const pret = await m.client.pret();
  assert.deepEqual(pret, {actif: true, lu: true});
  assert.equal(m.client.partieEnCours().cles, 6, "la partie du serveur est dans la case");
  assert.equal(m.client.sync.revision, 4);
  assert.equal(m.corps.filter(c => c.corps && c.corps.billet).length, 1);
  assert.equal(m.corps[0].corps.appli, "coffres", "le billet s'échange pour « coffres »");
  assert.equal(PARCOURS.chargerCode(m.session), A, "le code dans l'onglet, jamais dans une adresse");
  assert.deepEqual(PARCOURS.chargerReglagesOnglet(m.session, A), {niveaux: [1, 2], operations: [1, 3]});
  assert.equal(m.client.etatRepere().texte, "Suivi par ton professeur · Léa · CM1");
});

test("client : un billet refusé — personne n'est suivi, « prêt » le dit, le repère explique", async () => {
  const serveur = fauxServeur();
  serveur.fetch = () => Promise.resolve({ok: false, status: 404, headers: {get: () => null}, json: async () => ({ok: false, erreur: "Ce lien a expiré."})});
  const m = demarrer({entree: {billet: "0123456789abcdef0123456789abcdef"}, serveur});
  assert.equal(await m.client.demarrer(), false);
  assert.deepEqual(await m.client.pret(), {actif: false, lu: false});
  assert.equal(m.client.entreeRefusee, "expire");
  assert.equal(m.client.etatRepere().etat, "refuse");
  assert.equal(m.envois().length, 0);
});

test("client : sous un code, chaque geste part groupé (700 ms) avec la révision lue ; un 409 fusionne et renvoie", async () => {
  const temps = fauxTemps();
  const serveur = fauxServeur({identite: {prenom: "Léa", classe: "CM1", reglages: {}}});
  serveur.poser(A, parcoursAvecTresors(), 2);
  const m = demarrer({codeOnglet: A, serveur, temps});
  await m.client.demarrer();
  await tic();
  assert.deepEqual(await m.client.pret(), {actif: true, lu: true});
  assert.equal(m.envois().length, 0, "la case était vide : rien à envoyer, le serveur fait foi");
  m.client.commencerUnePartie({niveau: 2, ops: [1, 3], serie: SERIE_DEUX, familles: []});
  m.client.noterUneCle("sum");
  m.client.noterUneErreur("product");
  assert.equal(m.envois().length, 0, "pas encore parti");
  await temps.avancer(700);
  await tic();
  assert.equal(m.envois().length, 1, "un seul envoi pour trois gestes");
  const envoi = m.envois()[0].corps;
  assert.equal(envoi.appli, "coffres");
  assert.equal(envoi.base_revision, 2);
  assert.equal(envoi.parcours.partie.cles, 1);
  assert.equal(envoi.parcours.operations.product.erreurs, 1);
  assert.deepEqual(chainesLibres(envoi.parcours), []);
  assert.equal(m.client.sync.revision, 3);
  assert.equal(m.client.sync.dirty, false);
  // Un autre appareil a écrit entre-temps (révision 5 au serveur) : 409, fusion, renvoi.
  serveur.poser(A, PARCOURS.noterCle(serveur.etat(A).parcours, "sum", "2026-10-21"), 5);
  m.client.noterUneCle("product");
  await temps.avancer(700);
  await tic();
  assert.equal(m.client.sync.revision, 6, "renvoyé avec la révision du serveur");
  assert.equal(m.client.parcours.partie.cles, 2, "la partie fusionnée : celle du serveur (plus récente ou égale), puis la clé de plus");
  assert.equal(m.client.parcours.operations.sum.cles, 8, "les clés des deux appareils : le maximum (6 des trésors, 1 ici, 1 là-bas)");
});

test("client : à la fermeture, sendBeacon emporte ce qui n'est pas parti ; « dirty » tient pendant un envoi en vol", async () => {
  const temps = fauxTemps();
  const serveur = fauxServeur({identite: {prenom: "Léa", classe: "CM1", reglages: {}}});
  serveur.delai = 50;
  const m = demarrer({codeOnglet: A, serveur, temps});
  await m.client.demarrer();
  await tic(80);
  m.client.commencerUnePartie({niveau: 1, ops: [1], serie: new Array(10).fill(1), familles: []});
  await temps.avancer(700);
  // L'envoi est en vol (50 ms de délai) : une clé de plus pendant ce temps.
  m.client.noterUneCle("sum");
  await tic(80);
  assert.equal(m.client.sync.dirty, true, "la clé notée pendant le vol n'est pas sur le serveur");
  m.declencher("pagehide", {});
  assert.equal(m.balises.length, 1, "sendBeacon part");
  const paquet = JSON.parse(await m.balises[0].blob.text());
  assert.equal(paquet.parcours.partie.cles, 1);
});

test("client : un code refusé (404) détache — plus d'envoi, la case reste, tout ouvert ; « Se déconnecter » renvoie à l'espace", async () => {
  const serveur = fauxServeur({identite: {prenom: "Léa", classe: "CM1", reglages: {coffres: {niveaux: [1]}}}});
  const m = demarrer({codeOnglet: A, serveur});
  await m.client.demarrer();
  await tic();
  assert.deepEqual(m.client.reglagesOuverts(), {niveaux: [1], operations: null});
  serveur.forcer = {statut: 404, donnees: {ok: false}};
  m.client.commencerUnePartie({niveau: 1, ops: [1], serie: new Array(10).fill(1), familles: []});
  await tic();
  assert.equal(m.client.sync.detache, true);
  assert.equal(m.client.etatRepere().etat, "detache");
  assert.deepEqual(m.client.reglagesOuverts(), {niveaux: null, operations: null}, "un élève détaché n'a plus rien de fermé");
  // Une identité relue qui arrive APRÈS le 404 (elle partait avant) ne referme rien.
  const lent = fauxServeur({identite: {prenom: "Léa", classe: "CM1", reglages: {coffres: {niveaux: [1]}}}});
  const fetchLent = lent.fetch;
  lent.fetch = (url, options) => (url.endsWith("/api/eleve.php")
    ? new Promise(resolve => setTimeout(() => resolve(fetchLent(url, options)), 40)) : fetchLent(url, options));
  const m2 = demarrer({codeOnglet: A, serveur: lent});
  await m2.client.demarrer();
  lent.forcer = {statut: 404, donnees: {ok: false}};
  m2.client.commencerUnePartie({niveau: 1, ops: [1], serie: new Array(10).fill(1), familles: []});
  await tic(5);
  assert.equal(m2.client.sync.detache, true, "détaché avant l'arrivée de l'identité");
  await tic(60);
  assert.deepEqual(m2.client.reglagesOuverts(), {niveaux: null, operations: null}, "l'identité tardive ne referme pas le niveau 2");
  assert.equal(m.client.partieEnCours().cles, 0, "sa case reste");
  m.client.quitterSuivi();
  assert.equal(m.client.suiviActif(), false);
  assert.deepEqual(m.fenetre.allees, ["https://suivi.mathsgo.re/?oublier=1"]);
  assert.equal(m.session.getItem(PARCOURS.CLE_CODE), null);
  assert.equal(m.session.getItem(PARCOURS.CLE_REGLAGES), null);
});

test("client : sans code et sans billet, rien ne part, « prêt » tout de suite, tout ouvert", async () => {
  const m = demarrer();
  assert.equal(await m.client.demarrer(), false);
  assert.deepEqual(await m.client.pret(), {actif: false, lu: false});
  m.client.commencerUnePartie({niveau: 1, ops: [1], serie: new Array(10).fill(1), familles: []});
  assert.equal(m.corps.length, 0);
  assert.deepEqual(m.client.reglagesOuverts(), {niveaux: null, operations: null});
  assert.equal(m.client.etatRepere().etat, "cache");
});

test("client : la garde d'inactivité — après dix minutes, il faut retaper son code ; trois erreurs rendent l'onglet", async () => {
  const temps = fauxTemps();
  const serveur = fauxServeur({identite: {prenom: "Léa", classe: "CM1", reglages: {}}});
  const m = demarrer({codeOnglet: A, serveur, temps});
  await m.client.demarrer();
  await tic();
  assert.equal(m.client.gardeVisible, false);
  temps.maintenant; // (lecture)
  await temps.avancer(PARCOURS.GARDE_INACTIVITE_MS + 1);
  assert.equal(m.client.verifierGarde(), true);
  assert.equal(m.client.gardeVisible, true);
  assert.equal(m.client.repondreGarde(true, "FAUX12"), false);
  assert.equal(m.client.repondreGarde(true, A.toLowerCase()), true, "le bon code, en minuscules");
  assert.equal(m.client.gardeVisible, false);
});
