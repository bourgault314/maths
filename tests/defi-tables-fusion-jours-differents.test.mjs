// Lot « fusion jours différents : l'appareil ancien ne doit plus écraser
// l'appareil à jour » (PR #1046), avec son CORRECTIF du 23/10/2026 au soir,
// écrit après la relecture de Codex.
//
// Le défaut (réserve n° 1 de Codex sur la #1043) : par calcul, quand les deux
// côtés n'ont pas le même « vu », le jour le plus récent gagne EN BLOC. Juste
// sur un seul appareil, faux dès que le côté le plus récent est une COPIE
// ANCIENNE qui a joué depuis : un appareil resté hors ligne un mois en boîte 2
// qui rate 2 × 8 écrasait la boîte 5 de l'appareil du jour (→ 1, vérité 4).
//
// Premier essai (c6d5147f) : une règle « par dates » dans fusionner. Codex a
// montré qu'elle cassait d'autres cas (vieille copie en 5 → 1 puis 4 à la
// sauvegarde ; copie migrée qui remonte de 1 à 3 ; deux réussites rapprochées
// → 5 au lieu de 4 ; l'ordre des fusions qui change la boîte). Une case (une
// boîte et trois dates) ne dit pas d'où elle vient.
//
// Le correctif : fusionner revient à la règle de main (exacte sur un seul
// appareil, même boîte quel que soit l'ordre des fusions). Sous un code,
// l'appareil note chaque réponse de la grille que le serveur n'a pas encore
// confirmée ; quand l'état du serveur arrive (409, lecture à l'ouverture), il
// REJOUE ces réponses avec appliquerReponse sur l'état du serveur (rebaser).
// Les vérités ci-dessous sont toutes calculées en rejouant les réponses avec
// le vrai moteur, jamais écrites à la main.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
// Copie exacte de git show 7bb9c9e0:outils/calcul_mental/defi_tables_mon_parcours.js.
// Fixture autonome : les tests fonctionnent aussi avec un checkout Git superficiel.
import MAIN_7BB9 from "./fixtures/defi-tables/main-7bb9c9e0.cjs";
import {PARCOURS, html, fauxStockage, fauxServeur, fauxTemps, demarrerAppli, tic} from "./defi-tables-faux-monde.mjs";

const P = PARCOURS;
// Le moteur de main (7bb9c9e0) ne connaît ni le journal des séances ni le
// temps de la séance ouverte (lot S1 « les journaux », version 4) : son
// résultat est relu par le moteur d'aujourd'hui, qui les ajoute vides, avant
// d'être comparé. Tout le reste est comparé tel quel.
const MAIN = Object.assign({}, MAIN_7BB9, {fusionner: (a, b) => P.normaliserParcours(MAIN_7BB9.fusionner(a, b))});
const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
const J = "2026-10-23";
const CODE = "AXKQ7T";

const fait = (champs) => P.normaliserParcours({calculs: {"2-8": champs}});
const calcul = (parcours) => parcours.calculs["2-8"];
const boite = (parcours) => calcul(parcours).boite;
const repondre = (etat, correcte, date, cle = "2-8") => P.appliquerReponse(etat, cle, {correcte, date}).parcours;
// Rejouer une file [numéro, calcul, jour, juste] sur un parcours : la vérité.
const jouer = (etat, file) => file.reduce((p, [, cle, jour, ok]) => repondre(p, Boolean(ok), jour, cle), etat);
// La même chose qu'en JSON, sans tenir compte de l'ordre des clés.
function memesCalculs(x, y) {
  const cles = Object.keys(x.calculs).sort();
  return JSON.stringify(cles) === JSON.stringify(Object.keys(y.calculs).sort())
    && cles.every(cle => JSON.stringify(x.calculs[cle]) === JSON.stringify(y.calculs[cle]));
}

// L'appareil du jour : 2 × 8 en boîte 5 depuis le 12/10, revu le 20/10.
const A_JOUR = fait({boite: 5, vu: "2026-10-20", erreur: null, gagne: "2026-10-12", echeance: "2026-10-26"});
// La copie restée hors ligne depuis un mois : boîte 2, dernier gain le 20/09.
const ANCIEN = fait({boite: 2, vu: "2026-09-20", erreur: null, gagne: "2026-09-20", echeance: "2026-09-23"});

// ------------------------------------------- rebaser : les cas de Codex

test("rebaser — la copie ancienne (boîte 2) rate, répond juste, répond juste et dû : 4, 5, 5 sur la boîte 5 du serveur", () => {
  [[false, 4, "rate"], [true, 5, "répond juste"]].forEach(([ok, attendu, nom]) => {
    const file = [[1, "2-8", J, ok ? 1 : 0]];
    const local = jouer(ANCIEN, file);
    const resultat = P.rebaser(local, A_JOUR, file);
    assert.equal(boite(resultat), attendu, nom);
    assert.ok(memesCalculs(resultat, jouer(A_JOUR, file)), `${nom} : exactement la réponse rejouée sur l'appareil du jour`);
  });
  // « Juste et dû » sur la copie (échéance passée là-bas) : sur l'état du serveur
  // le calcul n'est pas dû (échéance le 26) → il reste en 5, gain du 12 gardé.
  const du = P.rebaser(repondre(ANCIEN, true, J), A_JOUR, [[1, "2-8", J, 1]]);
  assert.deepEqual(calcul(du), {...calcul(A_JOUR), vu: J});
  // La fusion des états (main), pour mémoire : 1, 2 et 3.
  assert.equal(boite(P.fusionner(A_JOUR, repondre(ANCIEN, false, J))), 1);
});

test("rebaser — réserve 2.A : la vieille copie en 5 rate sur un serveur descendu en 2 → 1", () => {
  const base5 = fait({boite: 5, vu: "2026-09-12", erreur: null, gagne: "2026-09-12", echeance: "2026-09-26"});
  const serveur = jouer(base5, [[1, "2-8", "2026-10-10", 0], [2, "2-8", "2026-10-12", 0], [3, "2-8", "2026-10-14", 0]]);
  assert.equal(boite(serveur), 2);
  const file = [[1, "2-8", J, 0]];
  const local = jouer(base5, file);
  assert.equal(boite(local), 4);
  assert.equal(boite(P.rebaser(local, serveur, file)), 1);
  // La page conserve le résultat du rejeu en mémoire ET dans la case.
  // Revoir le même état serveur ne le change pas : 1, pas 4.
  const une = P.rebaser(local, serveur, file);
  assert.ok(memesCalculs(P.rebaser(une, une, file), une), "la page déjà rebasée reste en 1");
  // Une AUTRE copie restée en 4 et un serveur vu le même jour sont ambigus :
  // une date seule ne prouve pas que cette réponse a été reçue. Repli sur main.
  assert.deepEqual(P.rebaser(local, une, file), MAIN.fusionner(local, une));
});

test("rebaser — réserve 2.B : une copie migrée (version 2, sans date de gain) rouverte sans jouer ne remonte rien", () => {
  const v2 = P.normaliserParcours({version: 2, calculs: {"2-8": {cases: 3, vu: "2026-10-01", erreur: null, gagne: null}}});
  assert.equal(boite(v2), 4);
  const serveur = jouer(v2, [[1, "2-8", "2026-10-05", 0], [2, "2-8", "2026-10-06", 0], [3, "2-8", "2026-10-07", 0]]);
  assert.equal(boite(serveur), 1);
  // File sûre et vide (rien joué) ou file pas sûre (fusion des états) : 1 dans les deux sens.
  assert.equal(boite(P.rebaser(v2, serveur, [])), 1);
  assert.equal(boite(P.fusionner(v2, serveur)), 1);
  assert.equal(boite(P.fusionner(serveur, v2)), 1);
});

test("rebaser — réserve 2.C : deux bonnes réponses rapprochées ne font qu'un gain ; espacées, deux", () => {
  const commun = jouer(P.creerParcours(), [[1, "2-8", "2026-10-01", 1], [2, "2-8", "2026-10-02", 1]]);
  assert.equal(boite(commun), 3);
  const serveur = repondre(commun, true, "2026-10-05");
  assert.equal(boite(serveur), 4);
  [["2026-10-07", 4], ["2026-10-12", 5]].forEach(([jour, attendu]) => {
    const file = [[1, "2-8", jour, 1]];
    const resultat = P.rebaser(jouer(commun, file), serveur, file);
    assert.equal(boite(resultat), attendu, `juste le 5 (serveur), juste le ${jour.slice(-2)} (page restée sur la boîte 3)`);
    assert.ok(memesCalculs(resultat, jouer(serveur, file)), "la vérité rejouée, échéance comprise");
  });
});

test("rebaser — les historiques de la table de Codex (2.E) : la vérité rejouée", () => {
  const commun = fait({boite: 3, vu: "2026-10-02", erreur: null, gagne: "2026-10-02", echeance: "2026-10-05"});
  // [ce que le serveur a reçu de l'autre appareil, ce que cet appareil rejoue]
  const cas = {
    "erreur 05 (serveur), réussite 07": [[[1, "2-8", "2026-10-05", 0]], [[1, "2-8", "2026-10-07", 1]], 3],
    "deux erreurs, 05 et 07": [[[1, "2-8", "2026-10-05", 0]], [[1, "2-8", "2026-10-07", 0]], 1],
    "réussite 05 (serveur), erreur 07, bonne réponse 09": [[[1, "2-8", "2026-10-05", 1]], [[1, "2-8", "2026-10-07", 0], [2, "2-8", "2026-10-09", 1]], 4]
  };
  Object.entries(cas).forEach(([nom, [autre, file, attendu]]) => {
    const serveur = jouer(commun, autre);
    const resultat = P.rebaser(jouer(commun, file), serveur, file);
    assert.equal(boite(resultat), attendu, nom);
    assert.ok(memesCalculs(resultat, jouer(serveur, file)), nom);
  });
  // L'ancienne limite acceptée de la #1046 : copie en 2 qui rate le 22 PUIS gagne le 23, serveur à jour en 5.
  const file = [[1, "2-8", "2026-10-22", 0], [2, "2-8", "2026-10-23", 1]];
  assert.equal(boite(P.rebaser(jouer(ANCIEN, file), A_JOUR, file)), 5, "5 − 1 + 1 (la #1046 donnait 2)");
});

// --------------------------------- fusionner : la règle de main, revenue

test("fusionner — revenu à la règle de main : la même boîte quel que soit l'ordre des fusions (réserve 2.D)", () => {
  const depart = jouer(P.creerParcours(), [[1, "2-8", "2026-10-01", 1], [2, "2-8", "2026-10-02", 1]]);
  const a = repondre(depart, true, "2026-10-05");
  const b = repondre(depart, true, "2026-10-07");
  const c = repondre(depart, false, "2026-10-06");
  assert.equal(boite(P.fusionner(P.fusionner(a, b), c)), 4);
  assert.equal(boite(P.fusionner(a, P.fusionner(b, c))), 4);
  // Un petit corpus d'états issus du vrai moteur : toutes les permutations et
  // les deux parenthésages donnent la même boîte, et une fusion répétée ne
  // change rien.
  const corpus = [depart, a, b, c, repondre(depart, false, "2026-10-05"), repondre(a, false, "2026-10-05"),
    repondre(c, true, "2026-10-07"), repondre(repondre(depart, false, "2026-10-05"), true, "2026-10-06")];
  let ecarts = 0;
  corpus.forEach(x => corpus.forEach(y => corpus.forEach(z => {
    if (boite(P.fusionner(P.fusionner(x, y), z)) !== boite(P.fusionner(x, P.fusionner(y, z)))) ecarts += 1;
    if (boite(P.fusionner(x, y)) !== boite(P.fusionner(y, x))) ecarts += 1;
    const xy = P.fusionner(x, y);
    if (boite(P.fusionner(x, xy)) !== boite(xy)) ecarts += 1;
  })));
  assert.equal(ecarts, 0);
  assert.match(moteur, /if \(faitA\.vu !== faitB\.vu\) \{\s*fusion\.calculs\[cle\] = cloner\(faitA\.vu > faitB\.vu \? faitA : faitB\);/, "le jour le plus récent en bloc, comme sur main");
});

// --------------------------- rebaser : les deux propriétés qui le rendent sûr

// Un tirage reproductible (pas de Math.random : le même test à chaque fois).
function tirage(graine) {
  let etat = graine;
  return () => (etat = (etat * 1103515245 + 12345) % 2147483648) / 2147483648;
}
const JOURS = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-05", "2026-10-08", "2026-10-12", "2026-10-20"];
const CLES = ["2-8", "3-7", "6-9"];
function historique(hasard) {
  let numero = 0;
  let jour = 0;
  const suite = longueur => Array.from({length: longueur}, () => {
    jour = Math.min(JOURS.length - 1, jour + (hasard() < 0.45 ? 1 : 0));
    return [++numero, CLES[Math.floor(hasard() * CLES.length)], JOURS[jour], hasard() < 0.6 ? 1 : 0];
  });
  const avant = suite(Math.floor(hasard() * 6));
  return {avant, apres: suite(1 + Math.floor(hasard() * 8))};
}

test("rebaser — un seul appareil : le serveur a l'état d'avant, la file les réponses d'après → exactement l'état d'après (2 000 historiques)", () => {
  const hasard = tirage(20261023);
  for (let n = 0; n < 2000; n += 1) {
    const {avant, apres} = historique(hasard);
    const base = jouer(P.creerParcours(), avant);
    const verite = jouer(base, apres);
    assert.ok(memesCalculs(P.rebaser(verite, base, apres), verite), JSON.stringify({avant, apres}));
  }
});

test("rebaser — un envoi parti sans réponse lue (fermeture de la page) : rejouer ce que le serveur a déjà ne compte pas deux fois (2 000 historiques)", () => {
  const hasard = tirage(1046);
  for (let n = 0; n < 2000; n += 1) {
    const {avant, apres} = historique(hasard);
    const base = jouer(P.creerParcours(), avant);
    const verite = jouer(base, apres);
    // Le serveur a déjà reçu les k premières réponses de la file, ou toutes.
    const k = Math.floor(hasard() * (apres.length + 1));
    const serveur = jouer(base, apres.slice(0, k));
    assert.ok(memesCalculs(P.rebaser(verite, serveur, apres), verite), JSON.stringify({avant, apres, k}));
  }
});

test("rebaser — bords : file vide, remise à zéro d'un côté, réponse plus ancienne que ce que le serveur a vu", () => {
  // File vide : la fusion des états.
  assert.deepEqual(P.rebaser(ANCIEN, A_JOUR, []), P.fusionner(ANCIEN, A_JOUR));
  // Époques différentes (remise à zéro) : fusionner décide seul, rien ne se rejoue.
  const remis = P.remettreAZero(A_JOUR);
  assert.deepEqual(P.rebaser(repondre(ANCIEN, false, J), remis, [[1, "2-8", J, 0]]), P.fusionner(repondre(ANCIEN, false, J), remis));
  // Une réponse d'un jour plus ancien que le dernier jour où le serveur a vu ce calcul :
  // passée (l'autre appareil a joué ce calcul après elle — comme la fusion des états).
  const serveur = repondre(A_JOUR, true, J);
  const file = [[1, "2-8", "2026-10-21", 0]];
  assert.deepEqual(calcul(P.rebaser(jouer(ANCIEN, file), serveur, file)), calcul(serveur));
  // Un calcul que le serveur n'a jamais vu : rejoué depuis la boîte 1.
  const neuf = [[1, "3-7", J, 1]];
  assert.equal(P.rebaser(jouer(A_JOUR, neuf), A_JOUR, neuf).calculs["3-7"].boite, 2);
  // Les autres calculs et le reste du parcours : la fusion des états, comme avant.
  const local = jouer(fait({...calcul(A_JOUR)}), neuf);
  local.tables[7].acquise = "2026-10-22";
  assert.equal(P.rebaser(local, A_JOUR, neuf).tables[7].acquise, "2026-10-22");
});

// --------------------------------------------------- la file des réponses

test("la file : notée sous un code seulement, rangée à côté de la case, jamais effacée par l'état d'un onglet", () => {
  const local = fauxStockage();
  assert.deepEqual(P.chargerReponses(local, CODE), {sure: false, dernier: 0, liste: [], epoque: 0, perduJusqua: 0});
  P.noterReponse(local, "", "2-8", {correcte: true, date: J});
  P.noterReponse(local, CODE, "1-8", {correcte: true, date: J});
  P.noterReponse(local, CODE, "2-8", {correcte: true, date: "pas une date"});
  assert.equal(P.chargerReponses(local, CODE).dernier, 0, "sans code, hors grille, ou sans jour : rien");
  P.noterReponse(local, CODE, "8-2", {correcte: false, date: J});
  P.noterReponse(local, CODE, "3-7", {correcte: true, date: J});
  assert.deepEqual(P.chargerReponses(local, CODE), {sure: false, dernier: 2, liste: [[1, "2-8", J, 0], [2, "3-7", J, 1]], epoque: 0, perduJusqua: 0});
  // Un onglet réécrit son état d'envoi (sans la file) : la file reste.
  P.sauverSync(local, CODE, {revision: 4, dirty: true, detache: false, maj: 1});
  assert.equal(P.chargerReponses(local, CODE).liste.length, 2);
  assert.equal(P.chargerSync(local, CODE).revision, 4);
  assert.equal("reponses" in P.chargerSync(local, CODE), false, "l'état tenu par la page ne porte pas la file");
  // Le 200 d'un envoi qui couvrait la réponse n° 1 : elle sort, la file devient sûre.
  assert.deepEqual(P.reponsesParties(local, CODE, 1), {sure: true, dernier: 2, liste: [[2, "3-7", J, 1]], epoque: 0, perduJusqua: 0});
  assert.deepEqual(P.oublierReponses(local, CODE), {sure: true, dernier: 2, liste: [], epoque: 0, perduJusqua: 0});
  // Une file forgée ou abîmée se lit sans rien casser ; trop longue, elle n'est plus sûre.
  assert.deepEqual(P.normaliserReponses({sure: 1, dernier: 3, liste: [[1, "2-8", J, 1], [1, "3-7", J, 0], [2, "1-1", J, 1], [3, "2-8", "hier", 1], "x", [9, "2-8", J, 1]]}),
    {sure: true, dernier: 3, liste: [[1, "2-8", J, 1]], epoque: 0, perduJusqua: 0});
  const longue = {sure: true, dernier: P.REPONSES_MAX + 1, liste: Array.from({length: P.REPONSES_MAX + 1}, (_, i) => [i + 1, "2-8", J, 1])};
  const lue = P.normaliserReponses(longue);
  assert.equal(lue.liste.length, P.REPONSES_MAX);
  assert.equal(lue.sure, false);
});

// --------------------------------------- avec le vrai code de la page

function appli(serveur, {local, session} = {}) {
  const temps = fauxTemps();
  const a = demarrerAppli({local, session, reseau: serveur, minuteries: temps, codeOnglet: CODE});
  a.temps = temps;
  return a;
}
async function demarrer(a) {
  a.api.demarrerSuivi();
  await tic();
  await a.temps.avancer(1000);
}
// Répondre comme la page : appliquerReponse, la file, puis sauverParcours.
function repondreDansLaPage(a, correcte, cle = "2-8") {
  const resultat = P.appliquerReponse(a.api.parcours, cle, {correcte});
  a.api.parcours = resultat.parcours;
  a.api.noterReponseAEnvoyer(resultat, correcte);
  a.api.sauverParcours();
}
const auServeur = serveur => calcul(P.normaliserParcours(serveur.etat(CODE).parcours));

// La vieille copie en 5 de septembre, sûre (elle a été confirmée par le serveur ce jour-là).
async function vieilleCopieSure(serveur, copie) {
  const local = fauxStockage();
  P.sauver(local, copie, CODE);
  P.sauverSync(local, CODE, {revision: 1, dirty: false, detache: false, maj: 1});
  P.reponsesParties(local, CODE, 0);
  return local;
}

test("page — réserve 2.A : la vieille copie en 5 rate hors ligne, le réseau revient, 409 avec le serveur en 2 → 1 au serveur, dans la case et à l'écran", async () => {
  const jour = P.jourLocal();
  const base5 = fait({boite: 5, vu: "2026-09-12", erreur: null, gagne: "2026-09-12", echeance: "2026-09-26"});
  const serveur = fauxServeur();
  serveur.poser(CODE, jouer(base5, [[1, "2-8", "2026-10-10", 0], [2, "2-8", "2026-10-12", 0], [3, "2-8", "2026-10-14", 0]]), 5);
  serveur.mode = "coupe";
  const local = await vieilleCopieSure(serveur, base5);
  const b = appli(serveur, {local});
  await demarrer(b);
  repondreDansLaPage(b, false);
  await b.temps.avancer(1000);
  assert.equal(b.api.parcours.calculs["2-8"].boite, 4, "hors ligne : la copie seule");
  serveur.mode = "ok";
  b.declencher("online");
  await tic(20);
  await b.temps.avancer(3000);
  assert.deepEqual([auServeur(serveur).boite, auServeur(serveur).erreur], [1, jour], "le serveur : 2 − 1 (avant : 4)");
  assert.equal(b.api.parcours.calculs["2-8"].boite, 1);
  assert.equal(P.charger(local, CODE).calculs["2-8"].boite, 1, "la case n'est pas refusionnée avec la boîte périmée");
  const envois = serveur.appels.filter(x => x.parcours).map(x => P.normaliserParcours(x.parcours).calculs["2-8"].boite);
  assert.deepEqual(envois.slice(-2), [4, 1], "l'envoi refusé (409) portait la boîte périmée, le renvoi porte 1");
  assert.deepEqual(P.chargerReponses(local, CODE).liste, [], "le 200 a vidé la file");
  assert.equal(b.api.sync.dirty, false);
});

test("page — la copie restée un mois en boîte 2 rate hors ligne, 409 avec la boîte 5 du serveur → 4 ; la même chose à l'ouverture suivante", async () => {
  const jour = P.jourLocal();
  const serveur = fauxServeur();
  serveur.poser(CODE, A_JOUR, 3);
  serveur.mode = "coupe";
  const local = await vieilleCopieSure(serveur, ANCIEN);
  const b = appli(serveur, {local});
  await demarrer(b);
  repondreDansLaPage(b, false);
  await b.temps.avancer(1000);
  serveur.mode = "ok";
  b.declencher("online");
  await tic(20);
  await b.temps.avancer(3000);
  assert.deepEqual([auServeur(serveur).boite, auServeur(serveur).erreur, auServeur(serveur).gagne], [4, jour, "2026-10-12"], "4 (avant : 1)");
  // Même histoire, mais l'appareil est fermé hors ligne et rouvert en ligne : la lecture à l'ouverture rejoue.
  const serveur2 = fauxServeur();
  serveur2.poser(CODE, A_JOUR, 3);
  serveur2.mode = "coupe";
  const local2 = await vieilleCopieSure(serveur2, ANCIEN);
  const c = appli(serveur2, {local: local2});
  await demarrer(c);
  repondreDansLaPage(c, false);
  await c.temps.avancer(1000);
  serveur2.mode = "ok";
  const rouverte = appli(serveur2, {local: local2});
  await demarrer(rouverte);
  await rouverte.temps.avancer(1000);
  assert.equal(rouverte.api.parcours.calculs["2-8"].boite, 4);
  assert.equal(auServeur(serveur2).boite, 4);
});

test("page — l'envoi parti à la fermeture sans réponse lue : à l'ouverture suivante, la réponse n'est pas comptée deux fois", async () => {
  const serveur = fauxServeur();
  const depart = fait({boite: 3, vu: "2026-10-02", erreur: null, gagne: "2026-10-02", echeance: "2026-10-05"});
  serveur.poser(CODE, depart, 2);
  const local = await vieilleCopieSure(serveur, depart);
  P.sauverSync(local, CODE, {revision: 2, dirty: false, detache: false, maj: 1});
  const a = appli(serveur, {local});
  await demarrer(a);
  repondreDansLaPage(a, true);
  assert.equal(a.api.parcours.calculs["2-8"].boite, 4);
  // Le serveur reçoit le paquet (comme un sendBeacon) mais la page ne lit pas la réponse.
  serveur.poser(CODE, a.api.parcours, 3);
  assert.equal(P.chargerReponses(local, CODE).liste.length, 1, "la réponse est encore dans la file");
  const b = appli(serveur, {local});
  await demarrer(b);
  await b.temps.avancer(2000);
  assert.equal(b.api.parcours.calculs["2-8"].boite, 4, "une seule montée");
  assert.equal(auServeur(serveur).boite, 4);
  assert.deepEqual(P.chargerReponses(local, CODE).liste, [], "la file est vidée");
});

test("page — un appareil d'avant ce lot (file pas sûre) : la fusion des états, comme avant, jusqu'à son premier envoi confirmé", async () => {
  const serveur = fauxServeur();
  serveur.poser(CODE, A_JOUR, 3);
  const local = fauxStockage();
  P.sauver(local, ANCIEN, CODE);
  const a = appli(serveur, {local});
  await demarrer(a);
  assert.equal(a.api.parcours.calculs["2-8"].boite, 5, "la copie ancienne prend l'état du serveur");
  assert.equal(P.chargerReponses(local, CODE).sure, true, "le serveur savait tout : la file est sûre à partir d'ici");
  // La file pas sûre au moment d'un 409 : rejoindreServeur fusionne les états.
  const local2 = fauxStockage();
  const b = appli(fauxServeur(), {local: local2});
  b.api.parcours = repondre(ANCIEN, false, J);
  assert.equal(b.api.rejoindreServeur(A_JOUR).calculs["2-8"].boite, 1, "la règle de main, connue (réserve n° 1 de la #1043)");
});

test("page — à l'ouverture, un serveur qui sait déjà tout : la file devient sûre sans rien envoyer", async () => {
  const serveur = fauxServeur();
  serveur.poser(CODE, A_JOUR, 3);
  const local = fauxStockage();
  P.sauver(local, A_JOUR, CODE);
  P.sauverSync(local, CODE, {revision: 3, dirty: false, detache: false, maj: 1});
  assert.equal(P.chargerReponses(local, CODE).sure, false, "appareil d'avant ce lot : pas de file");
  const a = appli(serveur, {local});
  await demarrer(a);
  await a.temps.avancer(2000);
  assert.equal(serveur.appels.filter(x => x.parcours).length, 0, "rien à envoyer");
  assert.deepEqual(P.chargerReponses(local, CODE), {sure: true, dernier: 0, liste: [], epoque: 0, perduJusqua: 0}, "la lecture a montré que le serveur savait tout");
});

test("page — deux pages ouvertes en ligne : juste le 5 sur l'une, juste plus tard sur l'autre restée sur la boîte 3 → un seul gain (réserve 2.C)", async () => {
  const serveur = fauxServeur();
  const commun = jouer(P.creerParcours(), [[1, "2-8", "2026-10-01", 1], [2, "2-8", "2026-10-02", 1]]);
  const jour = P.jourLocal();
  // L'autre page a gagné aujourd'hui : le serveur est en 4, échéance dans 7 jours.
  serveur.poser(CODE, repondre(commun, true, jour), 4);
  const local = await vieilleCopieSure(serveur, commun);
  P.sauverSync(local, CODE, {revision: 3, dirty: false, detache: false, maj: 1});
  const b = appli(serveur, {local});
  serveur.mode = "coupe";
  await demarrer(b);
  serveur.mode = "ok";
  repondreDansLaPage(b, true);
  assert.equal(b.api.parcours.calculs["2-8"].boite, 4, "la page restée sur la boîte 3 croit monter");
  await b.temps.avancer(3000);
  assert.equal(auServeur(serveur).boite, 4, "4, pas 5 : le calcul n'était plus dû");
});

test("page — « Recommencer à zéro » vide la file : rien d'avant ne se rejoue", () => {
  const local = fauxStockage();
  const a = appli(fauxServeur(), {local});
  repondreDansLaPage(a, false);
  assert.equal(P.chargerReponses(local, CODE).liste.length, 1);
  a.api.oublierReponsesAEnvoyer();
  assert.deepEqual(P.chargerReponses(local, CODE).liste, []);
});

// ---------------------------------------------------------- les épingles

test("la page note les réponses, les rejoue au 409 et à l'ouverture, et charge le moteur du jour", () => {
  assert.equal((html.match(/noterReponseAEnvoyer\(resultat, correcte(, lent)?\);/g) || []).length, 2, "Mes calculs et l'évaluation notent leurs réponses");
  assert.match(html, /noterReponseAEnvoyer\(resultat, correcte, lent\);/, "Mes calculs note aussi les réponses lentes (lot du 04/11/2026)");
  assert.match(html, /parcours = PARCOURS\.remettreAZero\(parcours\);\s*oublierReponsesAEnvoyer\(\);/);
  assert.match(html, /if \(reponse\.statut === 409 && donnees && donnees\.parcours !== undefined\) \{\s*rejoindreServeur\(PARCOURS\.normaliserParcours\(donnees\.parcours\)\);/);
  assert.match(html, /const fusion = rejoindreServeur\(distant\);/);
  assert.match(html, /parcours = PARCOURS\.rebaser\(local, distant, file\.liste\);\s*PARCOURS\.sauver\(storage\(\), parcours, codeSuivi\);/, "la case est réécrite telle quelle, pas refusionnée");
  assert.match(html, /PARCOURS\.reponsesParties\(storage\(\), codeSuivi, jusqua, epoque\);/);
  assert.match(moteur, /jour <= connu\.vu/, "un calcul dont les réponses se chevauchent se replie sur main");
  assert.doesNotMatch(moteur, /plusRecente\(R\.gagne, A\.gagne\)/, "la règle « par dates » du premier essai a disparu");
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-2/, "cache-buster du moteur bumpé");
});


// ---------------------- correctif 2 : comparaison indépendante avec main
// Même matrice que l'audit : 17 histoires, les deux sens, quatre entrées.
// MAIN est le moteur réellement publié ; la vérité vient du rejeu chronologique,
// pas de nombres ajustés à l'implémentation testée. Le critère porte sur la boîte.
const dateC2 = n => typeof n === "number" ? `2026-10-${String(n).padStart(2, "0")}` : n;
const suiteC2 = (p, evenements, moteur = P) => evenements.reduce((etat, [jour, ok]) =>
  moteur.appliquerReponse(etat, "2-8", {correcte: ok, date: dateC2(jour)}).parcours, p);
const communC2 = suiteC2(P.creerParcours(), [[1, true], [2, true]]);
const cinqC2 = suiteC2(communC2, [[5, true], [12, true]]);
const ancienC2 = suiteC2(P.creerParcours(), [["2026-09-20", true]]);
const recentC2 = suiteC2(ancienC2, [["2026-09-21", true], ["2026-09-24", true], [12, true], [20, true]]);
const hautC2 = suiteC2(P.creerParcours(), [["2026-09-01", true], ["2026-09-02", true], ["2026-09-05", true], ["2026-09-12", true]]);
const migreC2 = P.normaliserParcours({version: 2, calculs: {"2-8": {cases: 3, vu: dateC2(1), gagne: null, erreur: null, echeance: dateC2(1)}}});
const unC2 = suiteC2(communC2, [[3, false], [4, false]]);
const matriceC2 = [];
function casC2(nom, depart, a, b, ordre = null) {
  matriceC2.push({nom, a: suiteC2(depart, a), b: suiteC2(depart, b), ea: a, eb: b,
    verite: suiteC2(depart, ordre || [...a, ...b].sort((x, y) => dateC2(x[0]).localeCompare(dateC2(y[0]))), MAIN)});
}
casC2("2.A copie haute rate", hautC2, [[10, false], [12, false], [14, false]], [[23, false]]);
casC2("2.B migrée sans jouer", migreC2, [], [[5, false], [6, false], [7, false]]);
casC2("2.C gains 05 07", communC2, [[5, true]], [[7, true]]);
casC2("2.C gains 05 12", communC2, [[5, true]], [[12, true]]);
casC2("2.E erreur05 gain07", communC2, [[5, false]], [[7, true]]);
casC2("2.E deux erreurs", communC2, [[5, false]], [[7, false]]);
casC2("A gain05 erreur07 passage09", communC2, [[5, true], [9, true]], [[7, false]]);
casC2("même jour erreur puis gain", communC2, [[5, false]], [[5, true], [6, true]], [[5, false], [5, true], [6, true]]);
casC2("même jour gain puis erreur", communC2, [[5, false]], [[5, true], [6, true]], [[5, true], [5, false], [6, true]]);
casC2("entretien26 erreur27", cinqC2, [[26, true]], [[27, false]]);
casC2("entretien ancien5 ignore3erreurs", cinqC2, [[20, false], [21, false], [22, false]], [[26, true]]);
casC2("boîte1 erreur05 gain06", unC2, [[5, false]], [[6, true]]);
casC2("boîte1 erreur05 gain05 puis06", unC2, [[5, false]], [[5, true], [6, true]], [[5, false], [5, true], [6, true]]);
for (const [nom, copie, eb] of [
  ["copie basse erreur23", ancienC2, [[23, false]]],
  ["copie basse juste23", ancienC2, [[23, true]]],
  ["copie basse non due23", fait({...calcul(ancienC2), echeance: dateC2(30)}), [[23, true]]],
  ["ancienne limite erreur22 gain23", ancienC2, [[22, false], [23, true]]]
]) matriceC2.push({nom, a: recentC2, b: suiteC2(copie, eb), ea: [], eb, verite: suiteC2(recentC2, eb, MAIN)});

function stockageC2(parcours, evenements = [], dirty = false) {
  const local = fauxStockage();
  P.sauver(local, parcours, CODE);
  P.sauverSync(local, CODE, {revision: 1, dirty, maj: 1});
  P.reponsesParties(local, CODE, 0, parcours.epoque);
  for (const [jour, ok] of evenements) P.noterReponse(local, CODE, "2-8", {correcte: ok, date: dateC2(jour), epoque: parcours.epoque});
  return local;
}
function reponseC2(app, ok, jour, cle = "2-8") {
  const resultat = P.appliquerReponse(app.api.parcours, cle, {correcte: ok, date: dateC2(jour)});
  app.api.parcours = resultat.parcours;
  app.api.noterReponseAEnvoyer(resultat, ok);
  app.api.sauverParcours();
}
async function ouvrirC2(app) { app.api.demarrerSuivi(); await tic(3); }
function pasPireC2(resultat, reference, verite, contexte) {
  const b = p => p.calculs["2-8"]?.boite ?? 1;
  assert.ok(Math.abs(b(resultat) - b(verite)) <= Math.abs(b(reference) - b(verite)),
    `${contexte} : correctif=${b(resultat)}, main=${b(reference)}, vérité=${b(verite)}`);
}
for (const ligne of matriceC2) for (const [sens, localP, distant, evenements] of [
  ["A/B", ligne.a, ligne.b, ligne.ea], ["B/A", ligne.b, ligne.a, ligne.eb]
]) test(`matrice jamais pire que main — ${ligne.nom}, ${sens}`, async () => {
  const reference = MAIN.fusionner(localP, distant);
  assert.deepEqual(P.fusionner(localP, distant), reference, "fusionner reste exactement main");
  const file = evenements.map(([jour, ok], i) => [i + 1, "2-8", dateC2(jour), +ok]);
  pasPireC2(P.rebaser(localP, distant, file), reference, ligne.verite, "moteur");
  for (const voie of ["sauverCase", "409", "ouverture"]) {
    const local = stockageC2(localP, evenements, true), net = fauxServeur();
    net.poser(CODE, distant, 5);
    if (voie !== "ouverture") net.mode = "coupe";
    const a = appli(net, {local});
    a.api.demarrerSuivi(); await tic(1);
    if (voie === "sauverCase") {
      a.api.parcours = distant; a.api.sauverParcours();
    } else {
      if (voie === "409") { net.mode = "ok"; a.api.envoyerMaintenant(); await tic(4); }
      await a.temps.avancer(1000); await tic(2);
      pasPireC2(net.etat(CODE).parcours, reference, ligne.verite, `${voie}/serveur`);
    }
    pasPireC2(a.api.parcours, reference, ligne.verite, `${voie}/écran`);
    pasPireC2(P.charger(local, CODE), reference, ligne.verite, `${voie}/stockage`);
  }
});

test("A — deux appareils : réussites hors ligne les 5 et 9, erreur au serveur le 7, conservent la boîte 4 de main", async () => {
  const net = fauxServeur(); net.poser(CODE, communC2, 1);
  let coupeA = false;
  const reseauA = {fetch: (url, opt) => coupeA ? Promise.reject(new TypeError("hors ligne")) : net.fetch(url, opt)};
  const localA = stockageC2(communC2), localB = stockageC2(communC2);
  const a = appli(reseauA, {local: localA}), b = appli(net, {local: localB});
  await ouvrirC2(a); await ouvrirC2(b);
  coupeA = true; reponseC2(a, true, 5); await a.temps.avancer(750);
  reponseC2(b, false, 7); b.api.envoyerMaintenant(); await tic(3);
  reponseC2(a, true, 9);
  const reference = MAIN.fusionner(a.api.parcours, net.etat(CODE).parcours);
  coupeA = false; a.api.envoyerMaintenant(); await tic(8);
  const verite = suiteC2(communC2, [[5, true], [7, false], [9, true]], MAIN);
  assert.equal(boite(verite), 4);
  assert.equal(boite(net.etat(CODE).parcours), 4);
  assert.deepEqual(calcul(net.etat(CODE).parcours), calcul(reference));
  pasPireC2(net.etat(CODE).parcours, reference, verite, "A/409 réel");
});

test("A — l'ambiguïté d'un calcul n'empêche pas le rejeu sûr d'un autre ; une horloge qui recule impose main", () => {
  const file = [[1, "2-8", dateC2(5), 1], [2, "2-8", dateC2(9), 1], [3, "3-7", dateC2(9), 1]];
  const local = jouer(communC2, file), distant = suiteC2(communC2, [[7, false]]);
  const resultat = P.rebaser(local, distant, file);
  assert.deepEqual(calcul(resultat), calcul(MAIN.fusionner(local, distant)));
  assert.deepEqual(resultat.calculs["3-7"], jouer(distant, file.slice(2)).calculs["3-7"]);
  const retrograde = [[1, "2-8", dateC2(12), 1], [2, "2-8", dateC2(9), 0]];
  const l = jouer(communC2, retrograde);
  assert.deepEqual(P.rebaser(l, communC2, retrograde), MAIN.fusionner(l, communC2));
});

test("B — reset distant, envoi 503, réouverture : aucune ancienne réponse ne ressuscite", async () => {
  const local = stockageC2(communC2), net = fauxServeur(); net.mode = "coupe";
  const a = appli(net, {local}); await ouvrirC2(a); reponseC2(a, true, 5);
  const remis = P.remettreAZero(communC2);
  net.poser(CODE, remis, 5); net.mode = "ok"; net.forcer = {statut: 503};
  const b = appli(net, {local}); await ouvrirC2(b); await b.temps.avancer(750);
  assert.equal(b.api.parcours.epoque, 1);
  assert.deepEqual(P.chargerReponses(local, CODE).liste, []);
  assert.equal(P.chargerReponses(local, CODE).epoque, 1);
  // Un onglet de l'époque précédente ne peut plus ajouter une vieille réponse.
  reponseC2(a, true, 6);
  assert.deepEqual(P.chargerReponses(local, CODE).liste, []);
  net.forcer = null;
  const c = appli(net, {local}); await ouvrirC2(c); await c.temps.avancer(750);
  assert.deepEqual(net.etat(CODE).parcours.calculs, {});
  assert.deepEqual(c.api.parcours.calculs, {});
  assert.deepEqual(P.charger(local, CODE).calculs, {});
  assert.deepEqual(MAIN.fusionner(suiteC2(communC2, [[5, true]]), remis).calculs, {});
});

test("B — un vieux 200 ne valide ni n'efface la file d'une nouvelle époque", async () => {
  const local = stockageC2(communC2), net = fauxServeur(); net.poser(CODE, communC2, 1);
  let retenir = false, liberer;
  const reseau = {fetch: (url, opt) => {
    const p = net.fetch(url, opt);
    if (retenir && JSON.parse(opt?.body || "{}").parcours) {
      retenir = false; return new Promise(resolve => { liberer = () => p.then(resolve); });
    }
    return p;
  }};
  const a = appli(reseau, {local}); await ouvrirC2(a);
  reponseC2(a, true, 5); retenir = true; a.api.envoyerMaintenant();
  // L'autre onglet remet à zéro pendant que le premier est suspendu.
  const b = appli(net, {local});
  b.api.parcours = P.remettreAZero(b.api.parcours);
  b.api.oublierReponsesAEnvoyer(); b.api.sauverParcours();
  reponseC2(b, true, 6);
  const avant = P.chargerReponses(local, CODE);
  assert.equal(avant.epoque, 1); assert.equal(avant.sure, false);
  liberer(); await tic(3);
  assert.deepEqual(P.chargerReponses(local, CODE), avant, "l'accusé d'époque 0 ne touche pas l'époque 1");
  await b.temps.avancer(750);
  assert.equal(net.etat(CODE).parcours.epoque, 1);
  assert.equal(boite(net.etat(CODE).parcours), 2);
  assert.equal(P.chargerReponses(local, CODE).sure, true);
});

test("C — autre onglet, file débordée, vieux 200 : repli main jusqu'à un accusé qui couvre les pertes", async () => {
  const net = fauxServeur(); net.poser(CODE, communC2, 1);
  const local = stockageC2(communC2);
  let retenir = false, liberer, coupeB = false;
  const reseauA = {fetch: (url, opt) => {
    const p = net.fetch(url, opt);
    if (retenir && JSON.parse(opt?.body || "{}").parcours) {
      retenir = false; return new Promise(resolve => { liberer = () => p.then(resolve); });
    }
    return p;
  }};
  const reseauB = {fetch: (url, opt) => coupeB ? Promise.reject(new TypeError("hors ligne")) : net.fetch(url, opt)};
  const a = appli(reseauA, {local}), b = appli(reseauB, {local});
  await ouvrirC2(a); await ouvrirC2(b);
  reponseC2(a, true, 5, "3-7"); retenir = true; a.api.envoyerMaintenant();
  // A est suspendu : ni ses minuteurs ni son accusé ne s'exécutent pendant B.
  coupeB = true; reponseC2(b, false, 6); await b.temps.avancer(750);
  for (let i = 0; i < 500; i++) reponseC2(b, true, 6, "3-7");
  reponseC2(b, true, 7); await b.temps.avancer(750);
  const avant = P.chargerReponses(local, CODE);
  assert.equal(avant.liste.length, 500); assert.equal(avant.perduJusqua, 3);
  assert.equal(avant.sure, false);
  const verite = suiteC2(communC2, [[6, false], [7, true]], MAIN);
  const reference = MAIN.fusionner(P.charger(local, CODE), net.etat(CODE).parcours);
  liberer(); await tic(3);
  const apres = P.chargerReponses(local, CODE);
  assert.equal(apres.sure, false, "le paquet n° 1 ne couvre pas la perte n° 3");
  assert.equal(apres.perduJusqua, 3);
  const c = appli(net, {local}); await ouvrirC2(c); await c.temps.avancer(750);
  assert.equal(boite(net.etat(CODE).parcours), 3);
  pasPireC2(net.etat(CODE).parcours, reference, verite, "C/réouverture");
  assert.deepEqual(calcul(net.etat(CODE).parcours), calcul(reference));
  assert.equal(P.chargerReponses(local, CODE).perduJusqua, 0);
  assert.equal(P.chargerReponses(local, CODE).sure, true, "le nouvel accusé couvre maintenant toute la file");
});
