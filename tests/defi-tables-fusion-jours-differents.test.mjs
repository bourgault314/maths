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
import {PARCOURS, html, fauxStockage, fauxServeur, fauxTemps, demarrerAppli, tic} from "./defi-tables-faux-monde.mjs";

const P = PARCOURS;
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
  // Et le même résultat rejoué une seconde fois (doublon, refusion) : 1, pas 4.
  const une = P.rebaser(local, serveur, file);
  assert.ok(memesCalculs(P.rebaser(local, une, file), une), "rejouer sur un état qui a déjà la réponse ne change rien");
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
  assert.deepEqual(P.chargerReponses(local, CODE), {sure: false, dernier: 0, liste: []});
  P.noterReponse(local, "", "2-8", {correcte: true, date: J});
  P.noterReponse(local, CODE, "1-8", {correcte: true, date: J});
  P.noterReponse(local, CODE, "2-8", {correcte: true, date: "pas une date"});
  assert.equal(P.chargerReponses(local, CODE).dernier, 0, "sans code, hors grille, ou sans jour : rien");
  P.noterReponse(local, CODE, "8-2", {correcte: false, date: J});
  P.noterReponse(local, CODE, "3-7", {correcte: true, date: J});
  assert.deepEqual(P.chargerReponses(local, CODE), {sure: false, dernier: 2, liste: [[1, "2-8", J, 0], [2, "3-7", J, 1]]});
  // Un onglet réécrit son état d'envoi (sans la file) : la file reste.
  P.sauverSync(local, CODE, {revision: 4, dirty: true, detache: false, maj: 1});
  assert.equal(P.chargerReponses(local, CODE).liste.length, 2);
  assert.equal(P.chargerSync(local, CODE).revision, 4);
  assert.equal("reponses" in P.chargerSync(local, CODE), false, "l'état tenu par la page ne porte pas la file");
  // Le 200 d'un envoi qui couvrait la réponse n° 1 : elle sort, la file devient sûre.
  assert.deepEqual(P.reponsesParties(local, CODE, 1), {sure: true, dernier: 2, liste: [[2, "3-7", J, 1]]});
  assert.deepEqual(P.oublierReponses(local, CODE), {sure: true, dernier: 2, liste: []});
  // Une file forgée ou abîmée se lit sans rien casser ; trop longue, elle n'est plus sûre.
  assert.deepEqual(P.normaliserReponses({sure: 1, dernier: 3, liste: [[1, "2-8", J, 1], [1, "3-7", J, 0], [2, "1-1", J, 1], [3, "2-8", "hier", 1], "x", [9, "2-8", J, 1]]}),
    {sure: true, dernier: 3, liste: [[1, "2-8", J, 1]]});
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
  assert.deepEqual(P.chargerReponses(local, CODE), {sure: true, dernier: 0, liste: []}, "la lecture a montré que le serveur savait tout");
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
  assert.equal((html.match(/noterReponseAEnvoyer\(resultat, correcte\);/g) || []).length, 2, "Mes calculs et l'évaluation notent leurs réponses");
  assert.match(html, /parcours = PARCOURS\.remettreAZero\(parcours\);\s*oublierReponsesAEnvoyer\(\);/);
  assert.match(html, /if \(reponse\.statut === 409 && donnees && donnees\.parcours !== undefined\) \{\s*rejoindreServeur\(PARCOURS\.normaliserParcours\(donnees\.parcours\)\);/);
  assert.match(html, /const fusion = rejoindreServeur\(distant\);/);
  assert.match(html, /parcours = PARCOURS\.rebaser\(local, distant, file\.liste\);\s*PARCOURS\.sauver\(storage\(\), parcours, codeSuivi\);/, "la case est réécrite telle quelle, pas refusionnée");
  assert.match(html, /PARCOURS\.reponsesParties\(storage\(\), codeSuivi, jusqua\);/);
  assert.match(moteur, /if \(connu && connu\.vu && connu\.vu > jour\) return;\s*rejoue = appliquerReponse\(rejoue, cle, \{correcte: Boolean\(entree\[3\]\), date: jour\}\)\.parcours;/);
  assert.doesNotMatch(moteur, /plusRecente\(R\.gagne, A\.gagne\)/, "la règle « par dates » du premier essai a disparu");
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261023-3/, "cache-buster du moteur bumpé");
});
