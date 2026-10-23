// Lot « fusion jours différents : l'appareil ancien ne doit plus écraser
// l'appareil à jour » (23/10/2026 au soir, suite des PR #1040 et #1043).
//
// Le défaut (réserve n° 1 de Codex sur la #1043) : par calcul, quand les deux
// côtés n'ont pas le même « vu », le jour le plus récent gagnait EN BLOC. Juste
// sur un seul appareil (l'état d'aujourd'hui descend de celui d'hier), faux dès
// qu'un côté est une COPIE ANCIENNE : un appareil resté hors ligne un mois en
// boîte 2 qui ratait 2 × 8 écrasait la boîte 5 de l'appareil du jour (→ 1,
// vérité 4) ; sa bonne réponse aussi (→ 2, vérité 5).
//
// La règle : un gain (une erreur) d'un côté est une NOUVELLE pour l'autre s'il
// est plus récent que le dernier gain (la dernière erreur) de l'autre. R = le
// côté vu en dernier, A = l'autre :
//  1. R a une erreur nouvelle sans être en retard sur les gains → R gagne (en
//     bloc avec un gain nouveau aussi ; sinon jamais plus haut que A − 1) ;
//  2. R a un gain nouveau (sans erreur nouvelle) → max(R, A + 1), moins une
//     boîte si A porte une erreur que R ignore ;
//  3. R a une erreur nouvelle mais est en retard sur les gains → max(R, A − 1) ;
//  4. rien de neuf → l'état de A, le « vu » de R.
// Les trois entrées de fusionner — sauverCase, le 409 du serveur, la lecture à
// l'ouverture — sont jouées en bas avec le vrai code de la page.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PARCOURS, html, fauxStockage, fauxServeur, fauxTemps, demarrerAppli, tic} from "./defi-tables-faux-monde.mjs";

const P = PARCOURS;
const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
const J = "2026-10-23";

const fait = (champs) => P.normaliserParcours({calculs: {"2-8": champs}});
const calcul = (parcours) => parcours.calculs["2-8"];
const repondre = (etat, correcte, date) => P.appliquerReponse(etat, "2-8", {correcte, date}).parcours;
// La fusion dans les deux sens doit donner le même calcul.
function fusionDesDeuxCotes(x, y, message) {
  const un = calcul(P.fusionner(x, y));
  assert.deepEqual(calcul(P.fusionner(y, x)), un, `${message} — dans les deux sens`);
  return un;
}

// L'appareil du jour : 2 × 8 en boîte 5 depuis le 12/10, revu le 20/10.
const A_JOUR = fait({boite: 5, vu: "2026-10-20", erreur: null, gagne: "2026-10-12", echeance: "2026-10-26"});
// La copie restée hors ligne depuis un mois : boîte 2, dernier gain le 20/09.
const ANCIEN = fait({boite: 2, vu: "2026-09-20", erreur: null, gagne: "2026-09-20", echeance: "2026-09-23"});

// -------------------------------------------------- les deux cas de Codex

test("la copie ancienne rate aujourd'hui (2 → 1) : une erreur connue coûte une boîte à l'appareil du jour, pas quatre", () => {
  const rate = repondre(ANCIEN, false, J);
  assert.equal(calcul(rate).boite, 1, "sur la copie seule : boîte 1");
  const fusion = fusionDesDeuxCotes(A_JOUR, rate, "copie ancienne ratée");
  assert.deepEqual(fusion, {boite: 4, cases: 3, vu: J, erreur: J, gagne: "2026-10-12", echeance: J},
    "boîte 4 (avant ce lot : 1), l'erreur du jour, dû aujourd'hui, et le gain du 12/10 n'est pas perdu");
});

test("la copie ancienne répond juste aujourd'hui, pas dû (reste en 2) : rien de neuf, la boîte 5 reste", () => {
  const tranquille = fait({...calcul(ANCIEN), echeance: "2026-10-30"});
  const juste = repondre(tranquille, true, J);
  assert.deepEqual([calcul(juste).boite, calcul(juste).gagne], [2, "2026-09-20"], "pas dû : seul « vu » bouge");
  const fusion = fusionDesDeuxCotes(A_JOUR, juste, "copie ancienne, bonne réponse non due");
  assert.deepEqual(fusion, {boite: 5, cases: 3, vu: J, erreur: null, gagne: "2026-10-12", echeance: "2026-10-26"},
    "l'état de l'appareil du jour, vu aujourd'hui (avant ce lot : boîte 2)");
});

test("la copie ancienne répond juste et dû (2 → 3) : un gain nouveau vaut une boîte au-dessus de ce que l'autre sait → 5", () => {
  const gagne = repondre(ANCIEN, true, J);
  assert.equal(calcul(gagne).boite, 3);
  const fusion = fusionDesDeuxCotes(A_JOUR, gagne, "copie ancienne, bonne réponse due");
  assert.deepEqual(fusion, {boite: 5, cases: 3, vu: J, erreur: null, gagne: J, echeance: P.echeanceDeBoite(5, J)},
    "boîte 5 (6 plafonnée ; avant ce lot : 3), gain du jour, retour « délai de la boîte 5 »");
  // Et si l'appareil du jour n'était qu'en boîte 3 : 3 + 1 = 4.
  const jour3 = fait({boite: 3, vu: "2026-10-20", erreur: null, gagne: "2026-10-12", echeance: "2026-10-23"});
  assert.equal(fusionDesDeuxCotes(jour3, gagne, "A en 3").boite, 4);
});

// ------------------------------------------- une vieille copie restée haute

test("une vieille copie restée PLUS HAUTE (5 d'il y a un mois) rouverte en ligne ne remonte pas le parcours du jour", () => {
  const vieille = fait({boite: 5, vu: "2026-09-20", erreur: null, gagne: "2026-09-12", echeance: "2026-10-12"});
  // Le parcours du jour, descendu par de vraies erreurs sur trois jours, puis une encore aujourd'hui.
  let jour = vieille;
  ["2026-10-10", "2026-10-12", "2026-10-14"].forEach(d => { jour = repondre(jour, false, d); });
  assert.equal(calcul(jour).boite, 2);
  // Simple passage aujourd'hui (règle 4) : la boîte du jour.
  const passage = repondre(fait({...calcul(jour), echeance: "2026-10-30"}), true, J);
  assert.equal(fusionDesDeuxCotes(vieille, passage, "vieille copie haute, passage").boite, 2, "la boîte 2 du jour (règle « en bloc » : 2 aussi ; la règle « max(R, A − 1) » du premier projet aurait donné 4)");
  // Erreur aujourd'hui (règle 1) : 2 → 1, et la vieille copie n'y change rien.
  const erreur = repondre(jour, false, J);
  assert.deepEqual(fusionDesDeuxCotes(vieille, erreur, "vieille copie haute, erreur"), {boite: 1, cases: 0, vu: J, erreur: J, gagne: "2026-09-12", echeance: J});
  // Et la vieille copie utilisée HORS LIGNE aujourd'hui avec une erreur (5 → 4) :
  // à gain égal, jamais plus haut qu'une boîte sous le parcours du jour.
  const horsLigne = repondre(fait({...calcul(vieille), echeance: J}), false, J);
  assert.equal(calcul(horsLigne).boite, 4);
  assert.equal(fusionDesDeuxCotes(jour, horsLigne, "vieille copie haute, erreur hors ligne").boite, 1, "min(4, 2 − 1) = 1 (avant ce lot : 4)");
});

// ------------------------------------------- un seul appareil : rien ne change

test("un seul appareil, jours différents : gain, erreur, simple passage, et plusieurs jours de suite — l'état d'aujourd'hui, à l'identique", () => {
  const hier = fait({boite: 3, vu: "2026-10-22", erreur: "2026-10-15", gagne: "2026-10-20", echeance: "2026-10-23"});
  const hierPasDu = fait({...calcul(hier), echeance: "2026-10-30"});
  const cas = {
    gain: [hier, repondre(hier, true, J)],
    erreur: [hier, repondre(hier, false, J)],
    passage: [hierPasDu, repondre(hierPasDu, true, J)]
  };
  assert.deepEqual(calcul(cas.gain[1]), {boite: 4, cases: 3, vu: J, erreur: "2026-10-15", gagne: J, echeance: P.echeanceDeBoite(4, J)});
  assert.deepEqual(calcul(cas.erreur[1]), {boite: 2, cases: 1, vu: J, erreur: J, gagne: "2026-10-20", echeance: J});
  assert.deepEqual(calcul(cas.passage[1]), {boite: 3, cases: 2, vu: J, erreur: "2026-10-15", gagne: "2026-10-20", echeance: "2026-10-30"});
  Object.entries(cas).forEach(([nom, [avant, apres]]) => {
    assert.deepEqual(fusionDesDeuxCotes(avant, apres, nom), calcul(apres), `${nom} : la fusion rend l'état d'aujourd'hui tel quel`);
  });
  // Une copie d'il y a une semaine (la case d'un autre appareil du même élève, rouverte) :
  // erreur, erreur, gain, puis erreur, erreur → la vérité, pas « une boîte sous la copie ».
  const copie = fait({boite: 4, vu: "2026-10-15", erreur: null, gagne: "2026-10-15", echeance: "2026-10-22"});
  let etat = copie;
  [["2026-10-16", false], ["2026-10-17", false], ["2026-10-18", true], ["2026-10-19", false], ["2026-10-20", false]]
    .forEach(([d, ok]) => { etat = repondre(fait({...calcul(etat), echeance: d}), ok, d); });
  assert.equal(calcul(etat).boite, 1, "4 → 3 → 2 → 3 → 2 → 1");
  assert.deepEqual(fusionDesDeuxCotes(copie, etat, "copie d'il y a une semaine"), calcul(etat), "la copie rouverte ne ressuscite rien");
  // Deux gains sur deux jours depuis la copie : 5, pas « copie + 1 ».
  let gains = copie;
  [["2026-10-22", true], ["2026-10-23", true]].forEach(([d, ok]) => { gains = repondre(fait({...calcul(gains), echeance: d}), ok, d); });
  assert.equal(calcul(gains).boite, 5);
  assert.equal(fusionDesDeuxCotes(copie, gains, "deux gains").boite, 5);
});

// ------------------------------------- deux appareils connectés qui divergent

test("deux appareils connectés qui divergent : une erreur d'un côté et un gain de l'autre, à des jours différents, comptent chacun une fois", () => {
  const commun = fait({boite: 3, vu: "2026-10-01", erreur: null, gagne: "2026-10-01", echeance: "2026-10-05"});
  // L'un rate le 5, l'autre gagne le 7 : 3 − 1 + 1 = 3.
  const rate5 = repondre(commun, false, "2026-10-05");
  const gagne7 = repondre(commun, true, "2026-10-07");
  assert.deepEqual([calcul(rate5).boite, calcul(gagne7).boite], [2, 4]);
  assert.deepEqual(fusionDesDeuxCotes(rate5, gagne7, "erreur le 5, gain le 7"), {boite: 3, cases: 2, vu: "2026-10-07", erreur: "2026-10-05", gagne: "2026-10-07", echeance: P.echeanceDeBoite(3, "2026-10-07")},
    "boîte 3 (avant ce lot : 4, le gain du 7 gagnait en bloc)");
  // L'un gagne le 5, l'autre rate le 7, le premier repasse le 9 : 3 aussi, dû depuis l'erreur.
  const gagne5 = repondre(fait({...calcul(repondre(commun, true, "2026-10-05")), echeance: "2026-10-20"}), true, "2026-10-09");
  const rate7 = repondre(commun, false, "2026-10-07");
  assert.deepEqual(fusionDesDeuxCotes(gagne5, rate7, "gain le 5, erreur le 7, passage le 9"), {boite: 3, cases: 2, vu: "2026-10-09", erreur: "2026-10-07", gagne: "2026-10-05", echeance: "2026-10-07"});
  // Deux gains à deux jours différents : 5 (avant ce lot : 4).
  assert.equal(fusionDesDeuxCotes(repondre(commun, true, "2026-10-05"), repondre(commun, true, "2026-10-07"), "deux gains").boite, 5);
  // Deux erreurs à deux jours différents : 1 (avant ce lot : 2).
  assert.equal(fusionDesDeuxCotes(repondre(commun, false, "2026-10-05"), repondre(commun, false, "2026-10-07"), "deux erreurs").boite, 1);
  // Un instantané pris le matin (simple passage), l'autre appareil gagne l'après-midi du même jour puis repasse le lendemain :
  // le gain est une nouvelle pour l'instantané (rien ici ne regarde « vu »).
  const matin = repondre(fait({...calcul(commun), echeance: "2026-10-20"}), true, "2026-10-05");
  const apresMidi = repondre(fait({...calcul(repondre(commun, true, "2026-10-05")), echeance: "2026-10-20"}), true, "2026-10-06");
  assert.equal(fusionDesDeuxCotes(matin, apresMidi, "instantané du matin, gain l'après-midi").boite, 4);
  const apresMidiRate = repondre(fait({...calcul(repondre(commun, false, "2026-10-05")), echeance: "2026-10-20"}), true, "2026-10-06");
  assert.equal(calcul(apresMidiRate).boite, 2);
  assert.equal(fusionDesDeuxCotes(matin, apresMidiRate, "instantané du matin, erreur l'après-midi").boite, 2, "l'erreur du 5 est une nouvelle pour l'instantané, même pris ce jour-là");
});

// --------------------------------------------------- bords : null, boîte 1, v2

test("gain ou erreur absents (null = jamais), boîte 1, plafond 5 : rien ne casse, rien ne sort des boîtes", () => {
  // Jamais gagné nulle part : la copie ancienne (boîte 2 migrée) rate → une boîte sous l'autre côté.
  const sansGainJour = fait({boite: 4, vu: "2026-10-20", erreur: null, gagne: null, echeance: "2026-10-20"});
  const sansGainAncien = repondre(fait({boite: 2, vu: "2026-09-20", erreur: null, gagne: null, echeance: "2026-09-20"}), false, J);
  assert.deepEqual(fusionDesDeuxCotes(sansGainJour, sansGainAncien, "sans aucun gain"), {boite: 3, cases: 2, vu: J, erreur: J, gagne: null, echeance: J});
  // Jamais gagné d'un seul côté : le gain de l'autre est bien une nouvelle.
  const jamais = fait({boite: 1, vu: "2026-10-01", erreur: null, gagne: null, echeance: "2026-10-01"});
  const unGain = repondre(jamais, true, "2026-10-05");
  assert.equal(fusionDesDeuxCotes(jamais, unGain, "premier gain").boite, 2);
  // Erreur en boîte 1 des deux côtés, jours différents : boîte 1, jamais 0.
  const b1 = repondre(jamais, false, "2026-10-05");
  const b1bis = repondre(jamais, false, "2026-10-07");
  assert.equal(fusionDesDeuxCotes(b1, b1bis, "deux erreurs en boîte 1").boite, 1);
  // Erreur nouvelle sur une copie en retard, l'autre côté en boîte 1 : max(1, 0) = 1.
  assert.equal(fusionDesDeuxCotes(fait({boite: 1, vu: "2026-10-20", erreur: "2026-10-20", gagne: "2026-10-10", echeance: "2026-10-20"}), repondre(ANCIEN, false, J), "A en boîte 1").boite, 1);
  // Gain nouveau quand l'autre côté est déjà en 5 : 5, pas 6.
  assert.equal(fusionDesDeuxCotes(A_JOUR, repondre(ANCIEN, true, J), "plafond").boite, 5);
  // Une copie ancienne qui a gagné le 2/10 (gain déjà dépassé par celui du 12/10 de l'appareil du jour),
  // puis ne fait que passer aujourd'hui : rien de neuf → l'état du jour, erreur du 21 comprise, dû depuis.
  const gainAncien = repondre(fait({...calcul(ANCIEN), echeance: "2026-10-02"}), true, "2026-10-02");
  const erreurJour = repondre(A_JOUR, false, "2026-10-21");
  const gainPuisTouche = repondre(fait({...calcul(gainAncien), echeance: "2026-10-30"}), true, J);
  assert.deepEqual(fusionDesDeuxCotes(erreurJour, gainPuisTouche, "gain ancien le 2, erreur du jour le 21, passage"), {boite: 4, cases: 3, vu: J, erreur: "2026-10-21", gagne: "2026-10-12", echeance: "2026-10-21"});
});

test("un parcours de version 2 (« cases » sans boîte) passe par normaliserParcours avant la fusion, puis suit la règle", () => {
  const v2 = {version: 2, calculs: {"2-8": {cases: 1, vu: "2026-09-20", erreur: null, gagne: "2026-09-20"}}};
  const brutRate = {...v2, calculs: {"2-8": {cases: 0, vu: J, erreur: J, gagne: "2026-09-20"}}};
  const fusion = P.fusionner(A_JOUR, brutRate);
  assert.equal(calcul(fusion).boite, 4, "cases 0 → boîte 1, copie ancienne ratée → 5 − 1");
  assert.deepEqual(calcul(P.fusionner(brutRate, A_JOUR)), calcul(fusion));
  assert.equal(calcul(P.fusionner(A_JOUR, v2)).boite, 5, "cases 1 → boîte 2, pas de nouvelle (vu plus ancien) → l'état du jour");
  assert.equal(calcul(P.fusionner(v2, A_JOUR)).vu, "2026-10-20");
});

// --------------------------------- les trois entrées, avec le code de la page

const CODE = "AXKQ7T";

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

test("sauverCase : la mémoire de l'onglet est restée sur la copie ancienne, la case de l'appareil est à jour → la case lit 4", async () => {
  const serveur = fauxServeur();
  serveur.mode = "coupe";
  const local = fauxStockage();
  P.sauver(local, A_JOUR, CODE);
  const a = appli(serveur, {local});
  await demarrer(a);
  assert.equal(a.api.parcours.calculs["2-8"].boite, 5, "la page a lu la case");
  // L'onglet a gardé en mémoire la copie ancienne et y applique l'erreur du jour.
  a.api.parcours = repondre(ANCIEN, false, P.jourLocal());
  a.api.sauverParcours();
  const dansLaCase = P.charger(local, CODE).calculs["2-8"];
  assert.deepEqual([dansLaCase.boite, dansLaCase.erreur, dansLaCase.gagne], [4, P.jourLocal(), "2026-10-12"], "la case : boîte 4, l'erreur du jour, le gain du 12/10 gardé");
  assert.equal(a.api.parcours.calculs["2-8"].boite, 4, "et la mémoire de l'onglet aussi");
});

test("le 409 du serveur : l'appareil resté hors ligne un mois rate 2 × 8, envoie, reçoit 409 avec la boîte 5 du jour → le serveur finit à 4", async () => {
  const serveur = fauxServeur();
  serveur.poser(CODE, A_JOUR, 3);
  // L'appareil ancien : sa case porte la copie d'il y a un mois, il démarre hors ligne.
  serveur.mode = "coupe";
  const local = fauxStockage();
  P.sauver(local, ANCIEN, CODE);
  const b = appli(serveur, {local});
  await demarrer(b);
  assert.equal(b.api.parcours.calculs["2-8"].boite, 2, "hors ligne : la copie ancienne");
  b.api.parcours = repondre(b.api.parcours, false, P.jourLocal());
  b.api.sauverParcours();
  await b.temps.avancer(1000);
  assert.equal(b.api.sync.dirty, true);
  // Le réseau revient : l'envoi part avec une révision périmée → 409 → fusion → renvoi.
  serveur.mode = "ok";
  b.declencher("online");
  await tic(20);
  await b.temps.avancer(3000);
  const envois = serveur.appels.filter(x => x.parcours);
  assert.ok(envois.length >= 2, `envoi, 409, renvoi (${envois.length} envois)`);
  const final = P.normaliserParcours(serveur.etat(CODE).parcours).calculs["2-8"];
  assert.deepEqual([final.boite, final.erreur, final.gagne], [4, P.jourLocal(), "2026-10-12"], "le serveur : boîte 4 (avant ce lot : 1)");
  assert.equal(b.api.parcours.calculs["2-8"].boite, 4, "l'appareil ancien se range à 4");
  assert.equal(b.api.sync.dirty, false);
});

test("la lecture à l'ouverture : une vieille copie à 5 rouverte en ligne prend le parcours du jour descendu à 1 — et ne le remonte pas", async () => {
  const serveur = fauxServeur();
  const descendu = fait({boite: 1, vu: "2026-10-22", erreur: "2026-10-22", gagne: "2026-09-12", echeance: "2026-10-22"});
  serveur.poser(CODE, descendu, 7);
  const local = fauxStockage();
  P.sauver(local, fait({boite: 5, vu: "2026-09-20", erreur: null, gagne: "2026-09-12", echeance: "2026-10-12"}), CODE);
  const a = appli(serveur, {local});
  await demarrer(a);
  assert.equal(a.api.parcours.calculs["2-8"].boite, 1, "à l'ouverture : la boîte 1 du jour (la règle « max(R, A − 1) » du premier projet aurait donné 4)");
  assert.equal(P.charger(local, CODE).calculs["2-8"].boite, 1, "la case est remise à jour");
  const auServeur = P.normaliserParcours(serveur.etat(CODE).parcours).calculs["2-8"];
  assert.deepEqual([auServeur.boite, auServeur.erreur], [1, "2026-10-22"], "et le serveur garde la boîte 1 (rien envoyé, ou le même état)");
  assert.equal(serveur.appels.filter(x => x.parcours && P.normaliserParcours(x.parcours).calculs["2-8"].boite > 1).length, 0, "aucun envoi n'a jamais porté une boîte remontée");
  // Et dans l'autre sens : la case ancienne en 2, le serveur du jour en 5.
  const local2 = fauxStockage();
  P.sauver(local2, ANCIEN, CODE);
  const serveur2 = fauxServeur();
  serveur2.poser(CODE, A_JOUR, 2);
  const c = appli(serveur2, {local: local2});
  await demarrer(c);
  assert.equal(c.api.parcours.calculs["2-8"].boite, 5, "la copie ancienne prend la boîte 5");
});

// ---------------------------------------------------------- les épingles

test("le moteur porte la règle, et la page charge le moteur du jour", () => {
  assert.match(moteur, /const \[R, A\] = faitA\.vu > faitB\.vu \? \[faitA, faitB\] : \[faitB, faitA\];\s*const gainNouveau = plusRecente\(R\.gagne, A\.gagne\);\s*const erreurNouvelle = plusRecente\(R\.erreur, A\.erreur\);\s*const gainManque = plusRecente\(A\.gagne, R\.gagne\);\s*const erreurManquee = plusRecente\(A\.erreur, R\.erreur\);/, "les quatre nouvelles, comparées aux dates de l'autre côté");
  assert.match(moteur, /if \(erreurNouvelle && !gainManque && R\.gagne\) \{\s*boite = gainNouveau \? R\.boite : Math\.min\(R\.boite, Math\.max\(1, A\.boite - 1\)\);/, "règle 1 : R gagne, à gain égal jamais plus haut que A − 1");
  assert.match(moteur, /if \(gainNouveau\) \{\s*boite = Math\.max\(R\.boite - \(erreurManquee \? 1 : 0\), Math\.min\(SEUILS\.revision\.boites, A\.boite \+ 1\)\);/, "règle 2 : un gain nouveau = une boîte au-dessus de A");
  assert.match(moteur, /\} else if \(erreurNouvelle\) \{\s*boite = Math\.max\(R\.boite, A\.boite - 1\);/, "règle 3 : une erreur connue coûte une boîte, jamais plus");
  assert.match(moteur, /fusion\.calculs\[cle\] = \{\.\.\.cloner\(A\), vu: R\.vu\};/, "règle 4 : rien de neuf → A, vu de R");
  assert.doesNotMatch(moteur, /fusion\.calculs\[cle\] = cloner\(faitA\.vu > faitB\.vu \? faitA : faitB\);/, "l'ancienne règle « le plus récent en bloc » a disparu");
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261023-2/, "cache-buster du moteur bumpé");
});
