// Lot « fusion du même jour + une descente par jour » (22/10/2026).
//
// Le défaut : sous un code, sauverCase() fusionne à chaque sauvegarde la case
// de l'appareil avec le parcours en mémoire. Deux états du même jour → avant ce
// lot, « la boîte la plus haute » : la copie de l'appareil (réussite du matin)
// effaçait l'erreur de l'après-midi, et le tableau Mes calculs restait bleu.
// La règle : le jour d'une erreur, aucun gain n'est possible, donc le côté qui
// porte l'erreur du jour est forcément le plus récent — il gagne, mais jamais
// plus d'une boîte sous l'autre côté (correctif du 23/10/2026 : un appareil
// resté hors ligne ne doit pas écraser l'appareil du jour).
// Et désormais : au plus UNE descente par jour pour un même calcul.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PARCOURS, html, fauxStockage, demarrerAppli} from "./defi-tables-faux-monde.mjs";

const P = PARCOURS;
const moteur = await readFile(new URL("../outils/calcul_mental/defi_tables_mon_parcours.js", import.meta.url), "utf8");
const J = "2026-10-22";
const LENDEMAIN = "2026-10-23";

const repondre = (etat, cle, correcte, date = J) => P.appliquerReponse(etat, cle, {correcte, date}).parcours;
const fait = (champs) => P.normaliserParcours({calculs: {"2-8": champs}});
const calcul = (parcours) => parcours.calculs["2-8"];

// Un parcours où 2 × 8 est en boîte « boite », dû le jour J, sans erreur du jour.
function enBoite(boite, aujourdhui = J) {
  return fait({boite, vu: "2026-10-01", erreur: null, gagne: "2026-10-01", echeance: aujourdhui});
}

// ------------------------------------------------- la preuve du 22/10/2026

test("la preuve : réussite puis erreur le même jour, la fusion appareil / mémoire garde l'erreur (dans les deux ordres)", () => {
  let memoire = repondre(P.creerParcours(), "2-8", true);   // « Dans le désordre » : 2 × 8 juste → boîte 2
  const appareil = memoire;                                 // sauverCase() a rangé cette copie
  memoire = repondre(memoire, "2-8", false);                // marche 7 : 16 ÷ ? = 2 raté → boîte 1
  assert.equal(calcul(memoire).boite, 1, "sans code : boîte 1, rouge");
  const attendu = {boite: 1, cases: 0, vu: J, erreur: J, gagne: J, echeance: J};
  assert.deepEqual(calcul(P.fusionner(appareil, memoire)), attendu, "sauverCase() sous un code : l'erreur reste (avant le lot : boîte 2, l'erreur disparaissait)");
  assert.deepEqual(calcul(P.fusionner(memoire, appareil)), attendu, "et dans l'autre ordre (le 409 du serveur, la lecture à l'ouverture)");
});

test("il suffit que le calcul ait été touché le même jour : une bonne réponse non due, puis une erreur → l'erreur reste", () => {
  // Boîte 3, pas dû avant le 25 : la bonne réponse ne change que « vu ».
  let memoire = repondre(fait({boite: 3, vu: "2026-10-20", erreur: null, gagne: "2026-10-20", echeance: "2026-10-25"}), "2-8", true);
  const appareil = memoire;
  assert.deepEqual([calcul(appareil).boite, calcul(appareil).vu], [3, J], "touché aujourd'hui, rien d'autre");
  memoire = repondre(memoire, "2-8", false);
  assert.deepEqual(calcul(P.fusionner(appareil, memoire)), {boite: 2, cases: 1, vu: J, erreur: J, gagne: "2026-10-20", echeance: J});
});

// ---------------------------------------------- les trois règles du même jour

test("règle 1 : un seul côté porte l'erreur du jour → son erreur, son échéance, son gain et sa boîte, même s'il est plus haut", () => {
  const sansErreur = fait({boite: 4, vu: J, erreur: null, gagne: J, echeance: "2026-10-29"});
  const avecErreur = fait({boite: 3, vu: J, erreur: J, gagne: null, echeance: J});
  const attendu = {boite: 3, cases: 2, vu: J, erreur: J, gagne: null, echeance: J};
  assert.deepEqual(calcul(P.fusionner(sansErreur, avecErreur)), attendu);
  assert.deepEqual(calcul(P.fusionner(avecErreur, sansErreur)), attendu, "dans les deux sens");
  // Le côté avec l'erreur peut aussi être le plus HAUT (un vieil appareil
  // touché aujourd'hui par une bonne réponse non due) : il gagne quand même.
  const vieux = fait({boite: 2, vu: J, erreur: null, gagne: "2026-09-01", echeance: "2026-10-30"});
  const recent = fait({boite: 4, vu: J, erreur: J, gagne: "2026-10-15", echeance: J});
  assert.deepEqual(calcul(P.fusionner(vieux, recent)), {boite: 4, cases: 3, vu: J, erreur: J, gagne: "2026-10-15", echeance: J});
});

test("règle 1, le plancher (correctif du 23/10/2026, trouvé par Codex) : l'erreur d'un appareil resté hors ligne ne descend jamais plus d'une boîte sous l'appareil du jour", () => {
  // A, l'appareil du jour, en boîte 5 ; B, hors ligne depuis un mois, encore en
  // boîte 2. B rate aujourd'hui (→ 1), A ne rate pas. Avant : B écrasait A → 1.
  const aDuJour = fait({boite: 5, vu: J, erreur: null, gagne: "2026-10-20", echeance: "2026-11-03"});
  const bHorsLigne = repondre(fait({boite: 2, vu: "2026-09-20", erreur: null, gagne: "2026-09-20", echeance: J}), "2-8", false);
  assert.equal(calcul(bHorsLigne).boite, 1);
  const attendu = {boite: 4, cases: 3, vu: J, erreur: J, gagne: "2026-09-20", echeance: J};
  assert.deepEqual(calcul(P.fusionner(aDuJour, bHorsLigne)), attendu, "l'erreur est gardée (notée aujourd'hui, le calcul revient demain), mais une seule boîte de moins");
  assert.equal(P.faitDu(calcul(P.fusionner(aDuJour, bHorsLigne)), LENDEMAIN), true, "dû demain");
  assert.deepEqual(calcul(P.fusionner(bHorsLigne, aDuJour)), attendu, "dans les deux sens");
  // Le plancher ne remonte jamais au-dessus de « l'autre côté − 1 » : si l'autre
  // côté est en boîte 1 ou 2, le côté raté garde sa boîte.
  const bas = fait({boite: 2, vu: J, erreur: null, gagne: J, echeance: "2026-10-24"});
  const rate = fait({boite: 1, vu: J, erreur: J, gagne: null, echeance: J});
  assert.equal(calcul(P.fusionner(bas, rate)).boite, 1);
  assert.equal(calcul(P.fusionner(fait({boite: 1, vu: J, erreur: null, gagne: null, echeance: J}), rate)).boite, 1);
});

test("règle 2 : les deux côtés portent l'erreur du jour (deux appareils) → la boîte la plus haute et son échéance", () => {
  // Au plus une descente par jour : chaque côté vaut « sa boîte du matin − 1 »,
  // le plus haut est celui dont le parcours était à jour.
  const a = fait({boite: 3, vu: J, erreur: J, gagne: "2026-10-10", echeance: J});
  const b = fait({boite: 2, vu: J, erreur: J, gagne: null, echeance: J});
  const attendu = {boite: 3, cases: 2, vu: J, erreur: J, gagne: "2026-10-10", echeance: J};
  assert.deepEqual(calcul(P.fusionner(a, b)), attendu);
  assert.deepEqual(calcul(P.fusionner(b, a)), attendu, "dans les deux sens");
  // Le cas de Codex (23/10/2026) : A du jour 5 → 4, B hors ligne 2 → 1 → 4 (avant : 1).
  const aDuJour = repondre(fait({boite: 5, vu: "2026-10-20", erreur: null, gagne: "2026-10-20", echeance: J}), "2-8", false);
  const bHorsLigne = repondre(fait({boite: 2, vu: "2026-09-20", erreur: null, gagne: "2026-09-20", echeance: J}), "2-8", false);
  assert.deepEqual([calcul(aDuJour).boite, calcul(bHorsLigne).boite], [4, 1]);
  assert.equal(calcul(P.fusionner(aDuJour, bHorsLigne)).boite, 4);
  assert.equal(calcul(P.fusionner(bHorsLigne, aDuJour)).boite, 4, "dans les deux sens");
  // Sur un seul appareil : la case (1re erreur) et la mémoire (2e erreur du
  // jour, la boîte ne bouge plus) sont égales → rien ne change.
  const matin = enBoite(4);
  const local = repondre(matin, "2-8", false);
  const memoire = repondre(local, "2-8", false);
  assert.equal(calcul(P.fusionner(local, memoire)).boite, 3, "boîte 4 → 3, pas 2");
});

test("règle 3 : même jour sans erreur du jour → la boîte la plus haute (inchangé) ; une erreur d'un AUTRE jour ne compte pas", () => {
  const bas = fait({boite: 3, vu: J, erreur: null, gagne: "2026-10-19", echeance: "2026-10-25"});
  const haut = fait({boite: 4, vu: J, erreur: null, gagne: J, echeance: "2026-10-29"});
  const attendu = {boite: 4, cases: 3, vu: J, erreur: null, gagne: J, echeance: "2026-10-29"};
  assert.deepEqual(calcul(P.fusionner(bas, haut)), attendu);
  assert.deepEqual(calcul(P.fusionner(haut, bas)), attendu, "dans les deux sens");
  // À boîte égale : l'échéance la plus proche, l'erreur et le gain les plus récents.
  const egal = P.fusionner(
    fait({boite: 3, vu: J, erreur: "2026-10-18", gagne: J, echeance: "2026-10-25"}),
    fait({boite: 3, vu: J, erreur: "2026-10-20", gagne: "2026-10-19", echeance: "2026-10-24"}));
  assert.deepEqual(calcul(egal), {boite: 3, cases: 2, vu: J, erreur: "2026-10-20", gagne: J, echeance: "2026-10-24"});
  // Une erreur d'hier (erreur ≠ vu) n'est pas « l'erreur du jour » : la plus haute gagne.
  const hier = fait({boite: 2, vu: J, erreur: "2026-10-21", gagne: null, echeance: J});
  assert.equal(calcul(P.fusionner(hier, haut)).boite, 4);
});

test("jours différents : le jour le plus récent gagne en bloc (inchangé)", () => {
  const hier = fait({boite: 4, vu: "2026-10-21", erreur: null, gagne: "2026-10-21", echeance: "2026-10-28"});
  const aujourdhui = fait({boite: 3, vu: J, erreur: J, gagne: null, echeance: J});
  const attendu = {boite: 3, cases: 2, vu: J, erreur: J, gagne: null, echeance: J};
  assert.deepEqual(calcul(P.fusionner(hier, aujourdhui)), attendu);
  assert.deepEqual(calcul(P.fusionner(aujourdhui, hier)), attendu);
  // Et l'état d'hier, plus bas, ne redescend pas un gain d'aujourd'hui.
  const gain = fait({boite: 5, vu: J, erreur: null, gagne: J, echeance: "2026-11-05"});
  assert.equal(calcul(P.fusionner(hier, gain)).boite, 5);
});

// ------------------------------------------------- une descente par jour

test("au plus une descente par jour : trois erreurs le même jour sur un calcul en boîte 5 → boîte 4 ; le lendemain, une erreur → boîte 3", () => {
  const depart = enBoite(5);
  const premiere = P.appliquerReponse(depart, "2-8", {correcte: false, date: J});
  assert.deepEqual([premiere.fait.boite, premiere.fait.descend], [4, true], "la première erreur du jour descend");
  const deuxieme = P.appliquerReponse(premiere.parcours, "2-8", {correcte: false, date: J});
  assert.deepEqual([deuxieme.fait.boite, deuxieme.fait.descend], [4, false], "la deuxième ne descend plus, et la page ne la compte pas comme une descente");
  const troisieme = P.appliquerReponse(deuxieme.parcours, "2-8", {correcte: false, date: J});
  assert.deepEqual(calcul(troisieme.parcours), {boite: 4, cases: 3, vu: J, erreur: J, gagne: "2026-10-01", echeance: J}, "l'erreur reste notée, le calcul reste dû demain");
  assert.equal(P.faitDu(calcul(troisieme.parcours), J), false, "pas de regain aujourd'hui");
  assert.equal(P.faitDu(calcul(troisieme.parcours), LENDEMAIN), true, "dû demain");
  assert.equal(calcul(repondre(troisieme.parcours, "2-8", true)).boite, 4, "une réussite le jour même ne change rien");
  const lendemain = P.appliquerReponse(troisieme.parcours, "2-8", {correcte: false, date: LENDEMAIN});
  assert.deepEqual([lendemain.fait.boite, lendemain.fait.descend], [3, true], "un autre jour, une erreur descend de nouveau");
  assert.equal(calcul(repondre(lendemain.parcours, "2-8", false, LENDEMAIN)).boite, 3, "mais une seule fois ce jour-là aussi");
});

test("une descente par jour : la montée du lendemain repart de la boîte gardée, et la boîte 1 reste la boîte 1", () => {
  let etat = repondre(enBoite(2), "2-8", false);
  etat = repondre(etat, "2-8", false);
  assert.equal(calcul(etat).boite, 1);
  etat = repondre(etat, "2-8", false, LENDEMAIN);
  assert.equal(calcul(etat).boite, 1, "jamais sous la boîte 1");
  etat = repondre(etat, "2-8", true, "2026-10-24");
  assert.equal(calcul(etat).boite, 2, "dû et réussi un autre jour : il remonte");
});

// ----------------------------------------- bout en bout : la vraie sauverCase

test("bout en bout : sous un code, une séance « Dans le désordre » juste puis 16 ÷ ? = 2 raté laisse 2 × 8 en boîte 1 — en mémoire, dans la case de l'appareil, et après rechargement", async () => {
  const CODE = "AXKQ7T";
  const local = fauxStockage();
  const session = fauxStockage();
  const reseau = {fetch: () => Promise.reject(new TypeError("Failed to fetch"))};
  const AUJ = P.jourLocal();
  const appli = demarrerAppli({reseau, codeOnglet: CODE, local, session});
  appli.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(appli.api.suiviActif(), true);
  // Comme la page (alimenterMesCalculs) : après CHAQUE réponse, appliquerReponse
  // puis sauverParcours() — donc sauverCase(), qui fusionne avec la case.
  const repondreCommeLaPage = (cle, correcte) => {
    appli.api.parcours = P.appliquerReponse(appli.api.parcours, cle, {correcte, date: AUJ}).parcours;
    appli.api.sauverParcours();
  };
  // Marche 5, « Dans le désordre » : les 8 calculs de la table de 2, tous justes.
  [2, 3, 4, 5, 6, 7, 8, 9].forEach(n => repondreCommeLaPage(`2-${n}`, true));
  assert.equal(appli.api.parcours.calculs["2-8"].boite, 2, "2 × 8 réussi : boîte 2");
  assert.equal(P.charger(local, CODE).calculs["2-8"].boite, 2, "et rangé dans la case de l'appareil");
  // Marche 7 : 16 ÷ ? = 2 raté (même calcul, 2-8).
  repondreCommeLaPage("2-8", false);
  assert.deepEqual([appli.api.parcours.calculs["2-8"].boite, appli.api.parcours.calculs["2-8"].erreur], [1, AUJ], "en mémoire : boîte 1, rouge");
  assert.equal(P.charger(local, CODE).calculs["2-8"].boite, 1, "dans la case de l'appareil aussi (avant le lot : boîte 2, la case effaçait l'erreur)");
  // Les sept autres calculs de la table ne bougent pas.
  [2, 3, 4, 5, 6, 7, 9].forEach(n => assert.equal(P.charger(local, CODE).calculs[P.cleFait(`2-${n}`)].boite, 2, `2 × ${n} reste en boîte 2`));
  // Une sauvegarde de plus (la fin de série, un autre calcul) ne ramène pas la boîte 2.
  repondreCommeLaPage("3-4", true);
  assert.equal(P.charger(local, CODE).calculs["2-8"].boite, 1, "toujours rouge après la sauvegarde suivante");
  // La page rechargée (même appareil, même code) relit la case : toujours rouge.
  const rechargee = demarrerAppli({reseau, codeOnglet: CODE, local, session});
  rechargee.api.demarrerSuivi();
  await new Promise(r => setTimeout(r, 5));
  assert.equal(rechargee.api.parcours.calculs["2-8"].boite, 1, "après rechargement : boîte 1");
  assert.equal(P.etatFait(rechargee.api.parcours.calculs["2-8"]), "a-travailler", "rouge dans Mon parcours");
});

// ---------------------------------------------------------- les épingles

test("le moteur porte la règle, la page charge le moteur du jour, l'ancien commentaire a disparu", () => {
  assert.match(moteur, /const erreurA = faitA\.erreur === faitA\.vu;\s*const erreurB = faitB\.erreur === faitB\.vu;\s*if \(erreurA !== erreurB\) \{\s*const rate = erreurA \? faitA : faitB;\s*const autre = erreurA \? faitB : faitA;\s*const boiteRatee = Math\.max\(rate\.boite, autre\.boite - 1\);\s*fusion\.calculs\[cle\] = \{\.\.\.cloner\(rate\), boite: boiteRatee, cases: casesDeBoite\(boiteRatee\)\};\s*return;\s*\}\s*const boite = Math\.max\(faitA\.boite, faitB\.boite\);/, "fusion : l'erreur du jour gagne, au plus une boîte sous l'autre côté ; sinon la plus haute");
  assert.match(moteur, /\} else \{[^}]*?if \(fait\.erreur !== date\) \{\s*descend = fait\.boite > 1;\s*fait\.boite = Math\.max\(1, fait\.boite - 1\);\s*\}\s*fait\.erreur = date;\s*fait\.echeance = date;\s*\}/, "appliquerReponse : la boîte ne descend qu'une fois par jour");
  assert.doesNotMatch(moteur, /LIMITE CONNUE, acceptée : deux appareils utilisés le MÊME JOUR/, "le commentaire faux (« gain puis erreur » et « erreur puis gain » ne peuvent pas être ordonnés) a disparu");
  assert.doesNotMatch(moteur, /Les erreurs comptent toujours, sans limite/);
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-2/, "cache-buster du moteur bumpé");
});
