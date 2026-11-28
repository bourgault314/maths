// Défi calcul, lot K1b — le CORRECTIF après la relecture de Codex du
// 26/11/2026 (un bloquant, deux gênants, deux détails), côté moteur.
//
// 1. BLOQUANT. Un appareil resté hors ligne en version 12 perd une étoile
//    coupée (compteur 4) ; pendant ce temps, l'autre appareil, passé en
//    version 13, réussit le retour de sa MOITIÉ DU HAUT (compteur 2 + 1).
//    Quand le premier arrive, la reprise reportait sa perte sur la moitié du
//    haut et la fusion gardait le compteur 4 : le retour réussi était effacé.
//    Désormais le compteur d'une moitié du haut a deux étages — reporté
//    d'avant (4 999 au plus), joué en version 13 (5 001 et plus) : ce qui
//    est joué passe toujours devant ce qui n'est que reporté.
// 3. GÊNANT. Une progression lue en version 12 au serveur est récrite UNE
//    fois en version 13, même quand l'appareil n'apporte rien.
// 4. DÉTAIL. `palier: 2.0` dans le texte JSON se lit 2 (les deux lecteurs du
//    navigateur ; le serveur est aligné, voir _serveur/tests/lancer.php).
// 5. DÉTAIL. Les tailles mesurées : la référence versionnée, le pire cas.
// (Le point 2 et la part « serveur » des points 3 et 4 sont dans
// _serveur/tests/lancer.php.)
//
// Les copies de version 12 (tests/defi-calcul-lot-K1b-correctif-version-12.json)
// sont JOUÉES par le moteur du main 05340b1, pas écrites à la main.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const HL = JSON.parse(await readFile(new URL("./defi-calcul-lot-K1b-correctif-version-12.json", import.meta.url), "utf8"));
const V12 = JSON.parse(await readFile(new URL("./defi-calcul-lot-K1b-version-12.json", import.meta.url), "utf8"));
const copie = x => JSON.parse(JSON.stringify(x));

// Les neuf étoiles coupées : [la moitié du bas, la moitié du haut].
const PAIRES = [["A10-1", "A10-4"], ["A10-2", "A10-5"], ["A11-2", "A11-4"], ["A2-1", "A2-6"], ["A3-1", "A3-5"], ["A5-1", "A5-5"],
  ["M1-1", "M1-7"], ["M1-2", "M1-8"], ["M1-4", "M1-9"]];
const HAUTES = PAIRES.map(([, haut]) => haut);
const de = cle => { const [module, niveau] = cle.split("-"); return {module, niveau: Number(niveau)}; };
const etat = (p, cle) => { const {module, niveau} = de(cle); const l = p.modules[module]; const i = niveau - 1;
  return l ? {b: l.b[i], e: l.e[i], x: l.x[i], r: l.r[i], pe: l.pe[i], d: l.d[i], g: l.g[i]} : null; };
const o = jour => ({aujourdhui: jour, carte: CARTE});
const HERITE_MAX = 4999;
const JOUE = 5000;
const [J20, J21, J23, J24] = ["2026-11-20", "2026-11-21", "2026-11-23", "2026-11-24"];

// Un calcul de retour sur une étoile tenue (Mes calculs du jour).
function retour(p, cle, jour, juste, deuxieme) {
  const r = P.appliquerRetour(p, Object.assign(de(cle), {juste, ms: 1500, type: "P"}, deuxieme === undefined ? {} : {deuxieme}), o(jour));
  assert.equal(r.refuse, undefined, `retour ${cle} : ${r.refuse}`);
  return r;
}
const reussir = (p, cle, jour) => retour(p, cle, jour, true).parcours;
// Les deux calculs faux : l'étoile est perdue.
// (Lot P1, la règle B : un retour raté, l'étoile reste et revient le
// lendemain ; c'est le retour raté du lendemain qui la fait partir. `perdre`
// rate donc le retour du jour `jour`, puis celui du lendemain : quatre gestes,
// l'étoile perdue le lendemain.)
function rater(p, cle, jour) {
  const premier = retour(p, cle, jour, false);
  assert.equal(premier.mouvement.secondAVenir, true, `${cle} : le 2e calcul est attendu`);
  return retour(premier.parcours, cle, jour, false, true);
}
function perdre(p, cle, jour) {
  const un = rater(p, cle, jour);
  assert.equal(un.mouvement.perdue, false, `${cle} : la règle B, elle revient demain`);
  const deux = rater(un.parcours, cle, P.ajouterJours(jour, 1));
  assert.equal(deux.mouvement.perdue, true, `${cle} : perdue`);
  return deux.parcours;
}
const justes = () => Array.from({length: 6}, () => ({juste: true, ms: 1500}));
const rates = () => [{juste: false, ms: 1500}, {juste: false, ms: 1500}];
const etoilesVues = (p, jour) => P.carteEleve(p, CARTE, {aujourdhui: jour}).etages.flatMap(e => e.lignes.flatMap(l => l.etoiles));
// Un élève de version 13 qui gagne tout le CP par « Je tente », dans l'ordre où la carte l'ouvre.
function cpGagne(jour) {
  let p = P.creerParcours();
  const duCP = new Set(CARTE.lignes.filter(l => l.etage === 1).flatMap(l => l.cles));
  for (let tour = 0; tour < 20; tour += 1) {
    const cle = etoilesVues(p, jour).filter(e => e.etat === "aGagner" && duCP.has(e.cle)).map(e => e.cle)[0];
    if (!cle) break;
    p = P.appliquerTentative(p, Object.assign(de(cle), {reponses: justes()}), {aujourdhui: jour, carte: CARTE, seance: false}).parcours;
  }
  assert.equal(etoilesVues(p, jour).filter(e => duCP.has(e.cle) && e.etat === "gagnee").length, 14, "les 14 étoiles du CP");
  return p;
}
function tenter(p, cle, jour, reponses = justes()) {
  const r = P.appliquerTentative(p, Object.assign(de(cle), {reponses}), Object.assign(o(jour), {seance: false}));
  assert.equal(r.refuse, undefined, `Je tente ${cle} : ${r.refuse}`);
  return r.parcours;
}
// Les deux sens, et la même chose que la copie de version 12 soit reprise
// avant la fusion ou pendant.
function fusionDansLesDeuxSens(a, b, jour, quoi) {
  const ab = P.fusionner(a, b, o(jour));
  assert.deepEqual(P.fusionner(b, a, o(jour)), ab, `${quoi} : le même résultat dans les deux sens`);
  const [a13, b13] = [a, b].map(x => copie(P.normaliserParcours(x, {aujourdhui: jour})));
  assert.deepEqual(P.fusionner(a13, b13, o(jour)), ab, `${quoi} : reprises avant la fusion, ou pendant`);
  assert.deepEqual(P.fusionner(ab, a, o(jour)), ab, `${quoi} : la première copie qui revient ne change rien`);
  assert.deepEqual(P.fusionner(ab, b, o(jour)), ab, `${quoi} : la seconde copie qui revient ne change rien`);
  assert.deepEqual(P.fusionner(ab, ab, o(jour)), ab, `${quoi} : avec elle-même`);
  return ab;
}

// ------------------------------------------------------------- les témoins

test("les copies de version 12 jouées par le moteur du main : la copie commune, l'appareil hors ligne qui perd les neuf étoiles coupées, celui qui les réussit", () => {
  assert.equal(HL.version, 12);
  assert.deepEqual(HL.coupees, PAIRES.map(([bas]) => bas));
  assert.deepEqual([HL.jourCommun, HL.jourHorsLigne], [J20, J21]);
  [HL.commune, HL.perd, HL.reussit, HL.jamais, HL.gagne].forEach(p => assert.equal(p.version, 12));
  PAIRES.forEach(([bas]) => {
    // Les nombres de la relecture de Codex : boîte 3, compteur 2 ; perdue, compteur 4.
    assert.deepEqual(etat(HL.commune, bas), {b: 3, e: J21, x: 0, r: 0, pe: 0, d: "2026-11-17", g: 2}, bas);
    assert.deepEqual(etat(HL.perd, bas), {b: 0, e: null, x: 0, r: 0, pe: 1, d: "2026-11-17", g: 4}, bas);
    assert.deepEqual(etat(HL.reussit, bas), {b: 4, e: "2026-11-28", x: 0, r: 0, pe: 0, d: "2026-11-17", g: 3}, bas);
  });
});

// ------------------------------------------------------------ 1. le bloquant

test("BLOQUANT — une copie de version 12 restée hors ligne n'efface plus le retour réussi en version 13 sur la moitié du haut (les neuf étoiles coupées, dans les deux sens)", () => {
  PAIRES.forEach(([bas, haut]) => {
    // L'appareil passé en version 13 : la copie commune reprise, puis le
    // retour de la moitié du haut réussi le 23/11.
    const repris = P.normaliserParcours(HL.commune, {aujourdhui: J23});
    assert.deepEqual(etat(repris, haut), {b: 3, e: J21, x: 0, r: 0, pe: 0, d: "2026-11-17", g: 2}, `${haut} : reportée de ${bas}`);
    const joue = reussir(repris, haut, J23);
    assert.deepEqual([etat(joue, haut).b, etat(joue, haut).e], [4, "2026-11-30"], `${haut} : boîte 4, retour le 30/11`);
    // L'appareil resté hors ligne en version 12 a perdu l'étoile d'avant le
    // 21/11 (compteur 4). Il arrive le 24/11.
    const fusion = fusionDansLesDeuxSens(joue, HL.perd, J24, haut);
    assert.deepEqual([etat(fusion, haut).b, etat(fusion, haut).e], [4, "2026-11-30"], `${haut} : le retour réussi du 23/11 est gardé`);
    // La moitié du bas, elle, est la même étoile qu'avant : sa perte du
    // 21/11, plus avancée que la copie commune, est gardée (règle du lot K1).
    assert.deepEqual([etat(fusion, bas).b, etat(fusion, bas).pe], [0, 1], `${bas} : perdue le 21/11 sur l'appareil hors ligne`);
    // Les autres moitiés du haut, que l'appareil en version 13 n'a pas
    // rejouées : la perte reportée d'avant, comme en version 12.
    HAUTES.filter(cle => cle !== haut).forEach(autre => assert.deepEqual([etat(fusion, autre).b, etat(fusion, autre).pe], [0, 1], `${autre} : pas rejouée, perdue avec l'étoile d'avant`));
    // La copie commune de version 12, restée intacte, ne fait rien reculer.
    assert.deepEqual(P.fusionner(fusion, HL.commune, o(J24)), fusion, `${haut} : la copie commune qui revient`);
    assert.deepEqual(P.fusionner(HL.commune, joue, o(J24)), P.fusionner(joue, joue, o(J24)), `${haut} : la copie commune seule ne change rien au travail du 23/11`);
    // La page : ce que le serveur rend (la fusion) ne demande plus rien à l'appareil qui a joué.
    assert.equal(P.recevoir(joue, copie(fusion), o(J24)).apporte, false, `${haut} : rien à renvoyer`);
  });
});

test("BLOQUANT — et dans l'autre sens : une moitié du haut PERDUE en version 13 n'est pas rendue par une copie de version 12 qui avait réussi l'étoile d'avant", () => {
  PAIRES.forEach(([bas, haut]) => {
    const perdu = perdre(P.normaliserParcours(HL.commune, {aujourdhui: J23}), haut, J23);
    assert.deepEqual([etat(perdu, haut).b, etat(perdu, haut).pe], [0, 1]);
    const fusion = fusionDansLesDeuxSens(perdu, HL.reussit, J24, haut);
    assert.deepEqual([etat(fusion, haut).b, etat(fusion, haut).pe], [0, 1], `${haut} : perdue le 24/11 en version 13 (lot P1 : ratée le 23 et le 24), elle le reste`);
    assert.deepEqual([etat(fusion, bas).b, etat(fusion, bas).e], [4, "2026-11-28"], `${bas} : le retour réussi le 21/11 sur l'appareil hors ligne`);
  });
});

test("ce qui n'est que REPORTÉ d'avant se départage comme en version 12 : reprendre puis fusionner, ou fusionner (moteur de la version 12) puis reprendre", () => {
  [["perd", HL.perd], ["reussit", HL.reussit]].forEach(([nom, horsLigne]) => {
    const fusion = fusionDansLesDeuxSens(HL.commune, horsLigne, J24, nom);
    // (Les étoiles : tout ce qui est enregistré par étoile. La ceinture du CP, elle, peut rester à
    // l'appareil qui a repris la copie commune quand les 14 étoiles étaient tenues : une ceinture
    // gagnée ne se reperd pas — règle du lot K1, inchangée.)
    assert.deepEqual(fusion.modules, P.fusionner(HL.fusions[nom], HL.fusions[nom], o(J24)).modules, `${nom} : la fusion faite par le moteur de la version 12, puis reprise`);
    PAIRES.forEach(([bas, haut]) => {
      const attendu = etat(P.normaliserParcours(horsLigne, {aujourdhui: J24}), bas);
      assert.deepEqual(etat(fusion, haut), attendu, `${nom}, ${haut} : l'état de l'appareil le plus avancé, pour les deux moitiés`);
      assert.deepEqual(etat(fusion, bas), attendu, `${nom}, ${bas}`);
      assert.ok(etat(fusion, haut).g <= HERITE_MAX, `${haut} : un compteur reporté reste à 4 999 au plus`);
    });
  });
});

test("une étoile gagnée d'un côté n'est jamais défaite par des essais ratés de l'autre — même joués en version 13 sur la moitié du haut", () => {
  // Un élève de version 13 : le CP gagné, puis « Je tente » raté sur A10-5.
  // (A10-5 s'ouvre derrière A10-4, dans sa ligne, et derrière A2-6.)
  let p = cpGagne(J20);
  for (let tour = 0; tour < 25 && etoilesVues(p, J20).find(e => e.cle === "A10-5").etat !== "aGagner"; tour += 1) {
    p = tenter(p, etoilesVues(p, J20).filter(e => e.etat === "aGagner" && e.cle !== "A10-5").map(e => e.cle)[0], J20);
  }
  assert.equal(etoilesVues(p, J21).find(e => e.cle === "A10-5").etat, "aGagner");
  const rate = tenter(p, "A10-5", J21, rates());
  assert.deepEqual([etat(rate, "A10-5").b, etat(rate, "A10-5").r, etat(rate, "A10-5").g], [0, 1, JOUE + 1]);
  // L'autre appareil, resté en version 12, a gagné l'étoile d'avant (A10-2).
  assert.equal(etat(HL.gagne, "A10-2").b, 2);
  const fusion = fusionDansLesDeuxSens(rate, HL.gagne, J24, "A10-5");
  assert.deepEqual([etat(fusion, "A10-5").b, etat(fusion, "A10-5").r], [2, 0], "gagnée avec l'étoile d'avant : elle passe devant l'essai raté");
});

test("deux appareils en version 13, hors ligne le même jour, sur la même moitié du haut : la règle du lot K1 (le plus de gestes, puis la boîte la plus basse)", () => {
  PAIRES.forEach(([, haut]) => {
    const repris = P.normaliserParcours(HL.commune, {aujourdhui: J23});
    const reussi = reussir(repris, haut, J23);   // un geste : 5 001
    const perdu = perdre(repris, haut, J23);   // quatre gestes (lot P1 : ratée le 23 et le 24) : 5 004
    const unFaux = retour(repris, haut, J23, false).parcours;   // un geste : 5 001, le 2e calcul attend
    assert.deepEqual([etat(reussi, haut).g, etat(perdu, haut).g, etat(unFaux, haut).g], [JOUE + 1, JOUE + 4, JOUE + 1]);
    assert.equal(etat(fusionDansLesDeuxSens(reussi, perdu, J24, haut), haut).b, 0, `${haut} : quatre gestes contre un`);
    const egal = fusionDansLesDeuxSens(reussi, unFaux, J24, haut);
    assert.deepEqual([etat(egal, haut).b, etat(egal, haut).x], [3, 2], `${haut} : un geste chacun, la boîte la plus basse`);
  });
});

// ------------------------------------------- le compteur d'une moitié du haut

test("le compteur d'une moitié du haut : reporté d'avant, 4 999 au plus ; au premier geste de la version 13, il repart à 5 001 — pour CHAQUE geste (retour, « Je tente », J'apprends)", () => {
  assert.deepEqual(P.COMPTEURS_K1B, {heriteMax: HERITE_MAX, joue: JOUE});
  assert.ok(JOUE + 1000 < P.SEUILS.compteur, "de la place au-dessus de 5 000");
  // Reporté d'avant : le compteur de la moitié du bas, borné à 4 999 (une copie trafiquée).
  const repris = P.normaliserParcours(HL.commune, {aujourdhui: J23});
  PAIRES.forEach(([bas, haut]) => assert.deepEqual([etat(repris, bas).g, etat(repris, haut).g], [2, 2], haut));
  const gonflee = copie(HL.commune);
  gonflee.modules.A10.g = [9999, 6000, 0];
  const lue = P.normaliserParcours(gonflee, {aujourdhui: J23});
  assert.deepEqual(lue.modules.A10.g, [9999, 6000, 0, HERITE_MAX, HERITE_MAX], "la moitié du bas garde son compteur, celle du haut reste dans l'étage « reporté »");
  // Jamais gagnée : le compteur suit seul, borné lui aussi.
  const essais = copie(HL.jamais);
  essais.modules.A10.g[1] = 7000;
  assert.equal(P.normaliserParcours(essais, {aujourdhui: J23}).modules.A10.g[4], HERITE_MAX);

  PAIRES.forEach(([bas, haut]) => {
    // Le retour : un premier calcul faux (5 001), le second faux — raté (5 002 ; lot P1 : la règle B, elle revient demain).
    const premier = retour(repris, haut, J23, false).parcours;
    assert.equal(etat(premier, haut).g, JOUE + 1, `${haut} : le premier calcul faux`);
    assert.equal(etat(retour(premier, haut, J23, false, true).parcours, haut).g, JOUE + 2, `${haut} : raté`);
    // Le 2e calcul juste (un accident), et le retour réussi.
    assert.equal(etat(retour(premier, haut, J23, true, true).parcours, haut).g, JOUE + 2, `${haut} : le 2e calcul juste`);
    const monte = reussir(repris, haut, J23);
    assert.equal(etat(monte, haut).g, JOUE + 1, `${haut} : le retour réussi`);
    // Puis elle compte les gestes de la version 13, un par un.
    assert.equal(etat(reussir(monte, haut, "2026-11-30"), haut).g, JOUE + 2, `${haut} : le retour suivant`);
    // La moitié du bas et les autres étoiles : leur compteur d'un seul tenant.
    assert.equal(etat(reussir(repris, bas, J23), bas).g, 3, `${bas} : la moitié du bas monte d'un cran`);
    assert.equal(etat(perdre(repris, bas, J23), bas).g, 6, `${bas} : perdue, quatre crans (lot P1 : deux retours ratés)`);
  });
  assert.equal(etat(reussir(repris, "A1-1", J23), "A1-1").g, 3, "une étoile pas coupée");

  // Une copie où le 2e calcul d'une moitié du haut attend avec un compteur encore « reporté » (une
  // copie écrite à la main, ou par la première version de ce lot) : la perte, premier geste d'ici,
  // repart elle aussi à 5 001. (Lot P1 : l'étoile avait déjà raté un retour — `x` 3 — sinon la
  // règle B la garde.)
  const enAttente = copie(repris);
  Object.assign(enAttente.modules.A10, {x: [0, 0, 0, 0, 3], q: [null, null, null, null, J23]});
  const perdue = retour(enAttente, "A10-5", J23, false, true);
  assert.deepEqual([perdue.mouvement.perdue, etat(perdue.parcours, "A10-5").b, etat(perdue.parcours, "A10-5").g], [true, 0, JOUE + 1]);

  // Perdue (reportée d'avant), puis regagnée en version 13 par « Je tente ».
  const perdues = P.normaliserParcours(HL.perd, {aujourdhui: J23});
  let regagnees = 0;
  PAIRES.forEach(([, haut]) => {
    assert.deepEqual([etat(perdues, haut).b, etat(perdues, haut).g], [0, 4], haut);
    if (etoilesVues(perdues, J23).find(e => e.cle === haut).etat !== "aGagner") return;   // fermée derrière une autre étoile perdue
    regagnees += 1;
    assert.deepEqual([etat(tenter(perdues, haut, J23), haut).b, etat(tenter(perdues, haut, J23), haut).g], [2, JOUE + 1], `${haut} : regagnée par « Je tente »`);
    assert.equal(etat(tenter(perdues, haut, J23, rates()), haut).g, JOUE + 1, `${haut} : « Je tente » raté`);
  });
  assert.ok(regagnees >= 1, `des moitiés du haut perdues sont à regagner (${regagnees})`);

  // Un élève neuf en version 13 : chaque geste sur une moitié du haut encore à gagner.
  const neuf = cpGagne(J20);
  const ouvertes = () => etoilesVues(neuf, J20).filter(e => e.etat === "aGagner").map(e => e.cle);
  const hauteOuverte = HAUTES.find(cle => ouvertes().includes(cle));
  assert.ok(hauteOuverte, "une moitié du haut est à gagner dès que le CP est fini");
  // J'apprends réussi, J'apprends arrêté.
  const lecon = [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
  const apprise = P.appliquerSerie(neuf, Object.assign(de(hauteOuverte), {genre: "apprends", reponses: lecon}), Object.assign(o(J20), {seance: false}));
  assert.equal(apprise.refuse, undefined);
  assert.deepEqual([etat(apprise.parcours, hauteOuverte).b > 0, etat(apprise.parcours, hauteOuverte).g], [true, JOUE + 1], `${hauteOuverte} : gagnée par J'apprends`);
  const arretee = P.appliquerSerie(neuf, Object.assign(de(hauteOuverte), {genre: "apprends", reponses: Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}))}), Object.assign(o(J20), {seance: false}));
  assert.equal(arretee.refuse, undefined);
  assert.deepEqual([etat(arretee.parcours, hauteOuverte).b, etat(arretee.parcours, hauteOuverte).g], [0, JOUE + 1], `${hauteOuverte} : J'apprends arrêté`);
  // (Lot P1 : « Tente toute la ceinture » n'existe plus — son geste est retiré de ce test ; note
  // « tests retirés » du lot.)
  // « Je tente » réussi : 5 001 aussi.
  const tentee = P.appliquerTentative(neuf, Object.assign(de(hauteOuverte), {reponses: justes()}), Object.assign(o(J20), {seance: false}));
  assert.deepEqual([etat(tentee.parcours, hauteOuverte).b > 0, etat(tentee.parcours, hauteOuverte).g], [true, JOUE + 1], `${hauteOuverte} : gagnée par « Je tente »`);
});

// --------------------------------------------- la check-list du modèle commun

test("check-list du modèle commun, pour les neuf étoiles coupées : une vieille copie qui revient après 15 jours, la réouverture qui ne renvoie rien, des données abîmées", () => {
  // Trois semaines de travail en version 13 sur les moitiés du haut.
  let p = P.normaliserParcours(HL.commune, {aujourdhui: J23});
  HAUTES.forEach((cle, i) => { p = i % 3 === 2 ? perdre(p, cle, J23) : reussir(p, cle, J23); });
  HAUTES.forEach((cle, i) => { if (i % 3 === 0) p = reussir(p, cle, "2026-11-30"); });
  const apres = "2026-12-08";
  // Les vieilles copies de version 12 (commune, perdue, réussie) reviennent 15 jours après : rien ne change.
  [HL.commune, HL.perd, HL.reussit].forEach((vieille, n) => {
    const fusion = fusionDansLesDeuxSens(p, vieille, apres, `vieille copie ${n}`);
    HAUTES.forEach(cle => assert.deepEqual(etat(fusion, cle), Object.assign(etat(P.normaliserParcours(p, {aujourdhui: apres}), cle), {pe: Math.max(etat(p, cle).pe, n === 1 ? 1 : 0)}), `vieille copie ${n}, ${cle} : l'état joué en version 13`));
  });
  // La réouverture : la page relit sa propre progression (version 13) — rien à renvoyer.
  const relue = P.recevoir(p, copie(p), o(apres));
  assert.deepEqual([relue.lectureSeule, relue.apporte], [false, false]);
  assert.deepEqual(relue.parcours, P.normaliserParcours(p, {aujourdhui: apres}));
  // Un appareil qui n'a que la vieille copie reçoit la progression du serveur : rien à renvoyer non plus.
  const recu = P.recevoir(HL.commune, copie(p), o(apres));
  assert.deepEqual([recu.lectureSeule, recu.apporte], [false, false]);
  assert.deepEqual(recu.parcours.modules, P.normaliserParcours(p, {aujourdhui: apres}).modules);

  // Des données abîmées sur une moitié du haut jouée (A10-5) : la copie abîmée ne sait plus rien d'elle,
  // l'autre copie passe devant, quel que soit son compteur.
  const saine = reussir(P.normaliserParcours(HL.commune, {aujourdhui: J23}), "A10-5", J23);
  [["une boîte en texte", l => { l.b[4] = "4"; }], ["une boîte hors bornes", l => { l.b[4] = 99; }], ["une liste coupée", l => { l.b.length = 4; }]].forEach(([quoi, abimer]) => {
    const abimee = copie(saine);
    abimer(abimee.modules.A10);
    assert.equal(P.normaliserParcours(abimee, {aujourdhui: J24}).modules.A10.g[4], 0, `${quoi} : son compteur vaut 0`);
    assert.deepEqual(etat(fusionDansLesDeuxSens(abimee, HL.commune, J24, quoi), "A10-5"), etat(P.normaliserParcours(HL.commune, {aujourdhui: J24}), "A10-5"), `${quoi} : la copie valide, même seulement reportée, passe devant`);
    assert.deepEqual(etat(fusionDansLesDeuxSens(abimee, saine, J24, quoi), "A10-5"), etat(saine, "A10-5"), `${quoi} : la copie saine`);
  });
  // Un compteur abîmé (un texte, un nombre à virgule, négatif, trop grand) : 0.
  [["5001", 0], [5001.5, 0], [-3, 0], [123456, 0]].forEach(([valeur, attendu]) => {
    const abimee = copie(saine);
    abimee.modules.A10.g[4] = valeur;
    assert.equal(P.normaliserParcours(abimee, {aujourdhui: J24}).modules.A10.g[4], attendu, `compteur ${JSON.stringify(valeur)}`);
  });
  // Un compteur resté pile à 5 000 (jamais écrit par le moteur) : le geste suivant donne 5 001.
  const pile = copie(saine);
  pile.modules.A10.g[4] = JOUE;
  assert.equal(etat(reussir(pile, "A10-5", "2026-11-30"), "A10-5").g, JOUE + 1);
});

// Un tirage reproductible (pas l'horloge, pas Math.random).
function tirage(graine) {
  let x = graine >>> 0;
  return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; };
}

test("les trois égalités de la fusion tiennent sur 1 500 paires d'états tirés au sort : copies de version 12 et de version 13, moitiés du haut reportées ou jouées", () => {
  const alea = tirage(20261126);
  const sources = [HL.commune, HL.perd, HL.reussit, HL.jamais, HL.gagne, ...Object.values(V12.temoins).map(t => t.parcours)];
  // Un état : une copie de version 12, reprise ou non, puis de 0 à 8 gestes de la version 13 tirés au sort
  // (retours justes ou faux sur ce qui est tenu, « Je tente » réussis ou ratés sur ce qui est à gagner),
  // en penchant vers les neuf moitiés du haut.
  function etatAuSort() {
    const source = sources[Math.floor(alea() * sources.length)];
    if (alea() < .2) return copie(source);
    let p = P.normaliserParcours(source, {aujourdhui: J23});
    let jour = J23;
    const gestes = Math.floor(alea() * 9);
    for (let n = 0; n < gestes; n += 1) {
      if (alea() < .3) jour = P.ajouterJours(jour, 1 + Math.floor(alea() * 3));
      const etoiles = P.carteEleve(p, CARTE, {aujourdhui: jour}).etages.flatMap(e => e.lignes.flatMap(l => l.etoiles));
      const tenues = etoiles.filter(e => e.etat === "gagnee").map(e => e.cle);
      const aGagner = etoiles.filter(e => e.etat === "aGagner").map(e => e.cle);
      const pencher = liste => { const hautes = liste.filter(cle => HAUTES.includes(cle)); return hautes.length && alea() < .7 ? hautes : liste; };
      if (tenues.length && (alea() < .6 || !aGagner.length)) {
        const liste = pencher(tenues);
        const cle = liste[Math.floor(alea() * liste.length)];
        const r = P.appliquerRetour(p, Object.assign(de(cle), {juste: alea() < .5, ms: 1500, type: "P"}), o(jour));
        if (!r.refuse) p = r.parcours;
      } else if (aGagner.length) {
        const liste = pencher(aGagner);
        const cle = liste[Math.floor(alea() * liste.length)];
        const r = P.appliquerTentative(p, Object.assign(de(cle), {reponses: alea() < .5 ? justes() : rates()}), Object.assign(o(jour), {seance: false}));
        if (!r.refuse) p = r.parcours;
      }
    }
    return copie(p);
  }
  const jour = "2026-12-10";
  let jouees = 0;
  for (let n = 0; n < 1500; n += 1) {
    const [a, b] = [etatAuSort(), etatAuSort()];
    const ab = P.fusionner(a, b, o(jour));
    assert.deepEqual(P.fusionner(b, a, o(jour)), ab, `paire ${n} : fusion(A, B) = fusion(B, A)`);
    assert.deepEqual(P.fusionner(ab, a, o(jour)), ab, `paire ${n} : fusion(fusion(A, B), A) = fusion(A, B)`);
    assert.deepEqual(P.fusionner(ab, b, o(jour)), ab, `paire ${n} : fusion(fusion(A, B), B) = fusion(A, B)`);
    assert.deepEqual(P.fusionner(a, a, o(jour)), P.fusionner(P.fusionner(a, a, o(jour)), a, o(jour)), `paire ${n} : fusion(A, A) stable`);
    // Une moitié du haut JOUÉE en version 13 d'un côté seulement et tenue un jour des deux côtés : c'est son état qui est gardé.
    const [na, nb] = [a, b].map(x => P.normaliserParcours(x, {aujourdhui: jour}));
    HAUTES.forEach(cle => {
      const [ea, eb] = [etat(na, cle), etat(nb, cle)];
      if (!ea || !eb || (ea.g > JOUE) === (eb.g > JOUE)) return;
      const [joue, reporte] = ea.g > JOUE ? [ea, eb] : [eb, ea];
      const tenueUnJour = e => e.b > 0 || e.pe > 0;
      if (tenueUnJour(joue) !== tenueUnJour(reporte)) return;
      jouees += 1;
      assert.deepEqual([etat(ab, cle).b, etat(ab, cle).e, etat(ab, cle).x], [joue.b, joue.e, joue.x], `paire ${n}, ${cle} : le joué passe devant le reporté`);
    });
  }
  assert.ok(jouees > 100, `des moitiés du haut jouées d'un seul côté ont bien été tirées (${jouees})`);
});

// ------------------------------- 3. la ligne du serveur ne reste pas en version 12

test("GÊNANT — une progression LUE en version 12 est récrite une fois en version 13, même quand l'appareil n'apporte rien ; relue en version 13, plus rien ne repart", () => {
  const options = o(J24);
  [HL.commune, HL.perd, ...Object.values(V12.temoins).map(t => t.parcours)].forEach((ligne12, n) => {
    // Un appareil neuf (rien dans l'appareil).
    const neuf = P.recevoir(P.creerParcours(), ligne12, options);
    assert.deepEqual([neuf.lectureSeule, neuf.apporte], [false, true], `ligne ${n} : appareil neuf — la reprise part au serveur`);
    assert.equal(neuf.parcours.version, 15); // (lot P1 : relue en version 14 ; lot « la 6e complète » : 15)
    // Un appareil qui a déjà la même progression (reprise).
    const meme = P.recevoir(P.normaliserParcours(ligne12, {aujourdhui: J24}), ligne12, options);
    assert.deepEqual([meme.lectureSeule, meme.apporte], [false, true], `ligne ${n} : la même progression dans l'appareil`);
    // Ce qui part est la version 13 ; le serveur l'a : la lecture suivante ne renvoie rien.
    const ecrite = copie(Object.assign({}, neuf.parcours, {prenom: ""}));
    const ensuite = P.recevoir(neuf.parcours, ecrite, options);
    assert.deepEqual([ensuite.lectureSeule, ensuite.apporte], [false, false], `ligne ${n} : une seule fois`);
    assert.deepEqual(ensuite.parcours, neuf.parcours);
  });
  // Rien d'autre ne change : une version plus récente reste en lecture seule ; une version d'avant la 12
  // (elle repart de zéro, personne n'y avait joué) ne déclenche pas d'envoi à elle seule.
  // (Lot P1 : le moteur est en version 14 ; lot « la 6e complète » : 15 — la plus récente est la 16.)
  assert.deepEqual([P.recevoir(P.creerParcours(), {version: 16, modules: {}}, options).lectureSeule, P.recevoir(P.creerParcours(), {version: 16, modules: {}}, options).apporte], [true, false]);
  assert.equal(P.recevoir(P.creerParcours(), {version: 11, epoque: 0, modules: {}}, options).apporte, false);
  assert.equal(P.recevoir(P.creerParcours(), {version: "12", modules: {}}, options).apporte, false, "une version en texte n'est pas une version 12");
});

// ------------------------------------------------------- 4. `palier: 2.0`

function fauxStockage() {
  const m = new Map();
  return {getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: k => { m.delete(k); }};
}

test("DÉTAIL — l'ancien `palier` écrit `2.0` dans le texte JSON vaut 2 pour les deux lecteurs du navigateur (le moteur, l'onglet) : CM1, l'étage 4", () => {
  // Le texte tel qu'il arrive : JSON.parse ne distingue pas 2.0 de 2.
  [["1.0", 3], ["2.0", 4], ["3.0", 5], ["4.0", 6], ["2", 4], ["2e0", 4], ["2.5", 6], ["\"2\"", 6], ["0.0", 6], ["5.0", 6]].forEach(([texte, etage]) => {
    const lu = JSON.parse(`{"defi-calcul": {"palier": ${texte}}}`);
    assert.equal(P.reglagesDeSeance(lu).palier, etage, `le moteur, palier ${texte}`);
    const stockage = fauxStockage();
    stockage.setItem("mathsgo-defi-calcul-reglages", `{"code": "ABCDEF", "minutes": 10, "palier": ${texte}}`);
    assert.equal(P.chargerReglagesOnglet(stockage, "ABCDEF").palier, etage, `l'onglet, palier ${texte}`);
  });
  // Le nouveau nom fait foi, et la réponse du serveur peut porter les deux (correctif K1b, pour une page de version 12).
  assert.equal(P.reglagesDeSeance(JSON.parse('{"defi-calcul": {"etage": 2, "palier": 1}}')).palier, 2);
  assert.equal(P.reglagesDeSeance(JSON.parse('{"defi-calcul": {"etage": 4, "palier": 2}}')).palier, 4);
});

// ----------------------------------------------------- 5. les tailles mesurées

test("DÉTAIL — les tailles, mesurées : la référence versionnée (1 657 clés, 30 818 octets sans le prénom) ; toutes les étoiles tenues et 12 causes (1 954, 33 733) ; le pire cas (1 954, 35 972) — sous les bornes du serveur", async () => {
  // (Lot P1 : la sorte d'un calcul raté rangée dans `x` — aucune clé de plus, quelques octets.)
  // (Lot « la 6e complète » : D16, un module de plus, et dix étoiles — 1 680 clés et 31 139 octets
  // dans la référence ; toutes tenues 1 980 et 34 064 ; le pire cas 1 980 et 36 323.)
  const reference = JSON.parse(await readFile(new URL("../_serveur/tests/parcours-reference-defi-calcul.json", import.meta.url), "utf8"));
  // Avec la clé `prenom` (vide), comme le moteur la garde : une clé et 12 octets de plus.
  assert.deepEqual(P.mesurer(reference), {cles: 1680, octets: 31139});
  // Ce que le serveur garde (il ne connaît pas `prenom`) — les chiffres de la relecture de Codex.
  const {prenom, ...envoyee} = reference;
  assert.equal(prenom, "");
  assert.deepEqual(P.mesurer(envoyee), {cles: 1679, octets: 31127});
  const {parcoursComplet} = await import("../scripts/generer-parcours-reference-defi-calcul.mjs");
  assert.deepEqual(P.mesurer(parcoursComplet()), {cles: 1680, octets: 31139}, "le fichier versionné est ce que rend le générateur");
  // Les chiffres de la notice du lot : toutes les étoiles tenues, 12 causes par module…
  assert.deepEqual(P.mesurer(parcoursComplet({entier: true, causes: P.SEUILS.causes})), {cles: 1980, octets: 34064});
  // … et le pire cas pour la taille (aucune tenue, quatre dates par étoile, 12 causes).
  const pire = P.mesurer(parcoursComplet({pire: true, causes: P.SEUILS.causes}));
  assert.deepEqual(pire, {cles: 1980, octets: 36323});
  assert.ok(pire.cles < 2000 && pire.octets < 40000, "sous les bornes du serveur (2 000 clés, 40 000 octets)");
});
