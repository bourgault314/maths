// Défi conversions : la carte et la progression (sans navigateur).
//   - la carte : 54 codes (carte v4), rangs uniques, paliers 10 / 16 / 9 / 6 / 8 / 5
//     vus par l'élève (E1 et D7, au palier 1, construits au lot A2 bis ; C9 et
//     Q11, carte v4, ajoutées au lot 3b) ;
//   - le format version 2 (lot 3a), sa renormalisation, la lecture de la
//     version 1 ;
//   - le rythme (lot 3a) : la coche le jour même, les retours (lendemain,
//     3 jours, 1 semaine, 2 semaines, puis tous les mois), l'étoile, « Je me souviens »,
//     « Je valide » mélangé, « Je ne sais pas », les ceintures ;
//   - la fusion : la check-list du modèle commun (AGENTS.md, fiche § 3.3).
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const CARTE = require("../outils/conversions/conversions_carte.js");
const P = require("../outils/conversions/defi_conversions_parcours.js");

const PRETS = CARTE.ORDRE.filter(c => CARTE.etape(c).pret);
const J = "2026-11-11";
const hier = P.ajouterJours(J, -1);

test("la carte v4 : 54 étapes, codes et rangs figés, paliers 10/16/9/6/8/5 vus par l'élève", () => {
  assert.equal(CARTE.ETAPES.length, 54);
  assert.deepEqual(CARTE.ETAPES.map(e => e.rang), Array.from({length: 54}, (_, i) => i + 1));
  assert.deepEqual(CARTE.ETAPES.map(e => e.code), [...P.CODES], "même liste que le moteur (copie du serveur au lot 2)");
  assert.equal(new Set(CARTE.ETAPES.map(e => e.code)).size, 54);
  CARTE.ETAPES.forEach(e => assert.match(e.code, P.MOTIF_ETAPE));
  assert.deepEqual(CARTE.PALIERS.map(p => p.etapes), [10, 16, 9, 6, 8, 5]);
  assert.equal(CARTE.etape("D2").palier, 1, "La demi-heure, le quart d'heure : palier 1 (BO de cycle 2)");
  assert.equal(CARTE.etape("D2").rang, 21, "son rang ne bouge pas");
  // Les ajouts de la carte v3 : rangs 49 à 52, jamais réutilisés.
  assert.deepEqual(["E1", "D7", "Q10", "A5"].map(c => CARTE.etape(c).rang), [49, 50, 51, 52]);
  assert.deepEqual(["E1", "D7", "Q10", "A5"].map(c => CARTE.etape(c).palier), [1, 1, 2, 2]);
  // Lot 3b : les deux ajouts de la carte v4, rangs 53 et 54.
  assert.deepEqual(["C9", "Q11"].map(c => CARTE.etape(c).rang), [53, 54]);
  assert.deepEqual(["C9", "Q11"].map(c => CARTE.etape(c).palier), [3, 5]);
  assert.ok(!CARTE.etape("C9").pret && !CARTE.etape("Q11").pret, "pas encore construites (B3, B5)");
  // Lot A2 bis : E1 et D7 ne sont plus cachées. Elles prennent leur place
  // dans leur famille (Convertir, Durées), après les étapes déjà en ligne.
  assert.deepEqual(CARTE.ETAPES.filter(e => e.cachee).map(e => e.code), []);
  assert.equal(CARTE.ORDRE.length, 54);
  assert.deepEqual(CARTE.etapesDuPalier(1).map(e => e.code), ["R1", "R2", "P1", "C1", "C2", "E1", "D1", "D2", "D7", "Q1"]);
  assert.ok(CARTE.palierPret(1), "le palier 1 reste prêt");
  assert.ok(CARTE.famillesDuPalier(1).every(f => f.etapes.every(e => !e.cachee)));
  assert.ok(CARTE.etapesDuPalier(2).some(e => e.code === "A5") && CARTE.etapesDuPalier(2).some(e => e.code === "Q10"));
  // Le moteur accepte les nouveaux codes (rang 54 compris).
  const p = P.creer();
  const {parcours} = P.noterSeance(p, {id: 7, etape: "A5", montre: true}, J);
  const relu = P.normaliser(JSON.parse(JSON.stringify(parcours)));
  assert.equal(Object.values(relu.seances)[0][1], 52, "le rang 52 passe la normalisation");
  assert.equal(P.RANG.A5, 52);
  const q11 = P.noterSeance(P.creer(), {id: 8, etape: "Q11", montre: true}, J).parcours;
  assert.equal(Object.values(P.normaliser(JSON.parse(JSON.stringify(q11))).seances)[0][1], 54, "le rang 54 passe la normalisation");
  assert.equal(P.RANG.C9, 53);
  assert.ok(P.MOTIF_ETAPE.test("C9") && P.MOTIF_ETAPE.test("Q11") && !P.MOTIF_ETAPE.test("C10") && !P.MOTIF_ETAPE.test("Q12"));
  assert.equal(CARTE.REPERES.length, 36);
  CARTE.REPERES.forEach(r => assert.match(r.code, P.MOTIF_REPERE));
  // Lot A2 ter : la règle (1 mm) rejoint « Mes premiers repères ».
  assert.equal(CARTE.etape("R1").reperes.length, 10);
  assert.equal(CARTE.repere("l1").etape, "R1");
});

test("la carte : le palier 1 est entier (10 étapes prêtes, textes complets)", () => {
  assert.deepEqual(PRETS, ["R1", "R2", "P1", "C1", "C2", "E1", "D1", "D2", "D7", "Q1"]);
  PRETS.forEach(code => {
    const e = CARTE.etape(code);
    assert.equal(e.apprends.length, 3, code);
    // Lot A2 ter (choix de Gwenaël, le 13/11) : « À retenir » n'a plus de
    // texte quand ses cases (relations, repères) disent tout ; sinon, une ou
    // deux phrases courtes.
    if (e.relations || e.reperes.length) assert.ok(e.retenir === "" || e.retenir.length < 160, code);
    else assert.ok(e.retenir.length > 20 && e.retenir.length < 170 && e.retenir.split(/[.!?](?:\s|$)/).filter(x => x.trim()).length <= 3, `${code} : ${e.retenir.length} signes`);
    assert.ok(e.cahier, code);
  });
  assert.equal(CARTE.etape("P1").relations.length, 10, "10 relations des bases (1 m = 1 000 mm)");
  assert.ok(CARTE.etape("P1").relations.includes(CARTE.typo("1 m = 1 000 mm")));
});

test("la carte : les textes ont leurs espaces insécables", () => {
  // (Lot 3b-2 : le crédit d'une illustration cite sa licence, « CC BY-SA 3.0 ».)
  const textes = JSON.stringify(CARTE.ETAPES) + JSON.stringify(CARTE.REPERES.map(r => Object.assign({}, r, {credit: ""})));
  assert.doesNotMatch(textes, /\d \d{3}(?!\d)/, "milliers séparés par une espace normale");
  assert.doesNotMatch(textes, /\d (?:cm|mm|km|kg|cL|dL|min)\b/, "espace normale avant une unité");
  assert.doesNotMatch(textes, /\d\.\d/, "point décimal");
});

test("le format version 2 : création, mêmes données → même JSON", () => {
  assert.deepEqual(P.creer(), {version: 2, epoque: 0, etapes: {}, reperes: {}, seances: {}});
  let p = P.marquerVue(P.creer(), "C1", J);
  p = P.marquerVue(p, "R1", J);
  assert.deepEqual(Object.keys(p.etapes), ["R1", "C1"], "rangées par code, dans l'ordre des rangs");
  assert.deepEqual(p.etapes.C1, [J, null, null, 0, 0, 0, 0, null, null, 0], "10 valeurs");
  assert.equal(JSON.stringify(P.normaliser(JSON.parse(JSON.stringify(p)))), JSON.stringify(p));
});

test("la renormalisation : code inconnu, date fausse, entier hors bornes, séance abîmée", () => {
  const brut = {
    version: 2, epoque: -3,
    etapes: {
      ZZ: [J, null, null, 0, 0, 0, 0, null, null, 0],
      C1: ["2026-02-30", "0000-01-01", hier, 7, 44, 99, 0, J, "pas une date", 123456],
      C2: [J, null, null, 1, 2, 3, 1, J, J, 5],
      D1: [hier, null, hier, 1, 0, 2, 4, J, null, 7],
      D2: [hier, null, J, 1, 0, 1, 0, hier, hier, 7],
      R1: [J],
      P1: "texte"
    },
    reperes: {c2: [J, 5], x9: [J, 0], m3: ["hier", 0]},
    seances: {
      1: [J, 4, 1, 1, 1, 3, 3, 0, 0, 0, 0, 12, 1],
      2: [J, 4, 1, 1, 1, 3, 3, 0, 0, 0, 0, 0, 2],
      3: [J, 4, 1],
      4: ["2026-13-01", 4, 1, 1, 1, 3, 3, 0, 0, 0, 0, 13, 3],
      x: [J, 4, 1, 1, 1, 3, 3, 0, 0, 0, 0, 14, 4],
      5: [J, 99, 5, 7, -1, 19, 19, 0, 0, 0, 999, 15, 5],
      6: [J, 4, 0, 0, 0, 2, 5, 0, 0, 0, 0, 16, 6]
    }
  };
  const p = P.normaliser(brut);
  assert.equal(p.epoque, 0);
  assert.deepEqual(Object.keys(p.etapes), ["C1", "C2", "D1", "D2"]);
  assert.deepEqual(p.etapes.C1, [null, null, hier, 2, 0, 9, 0, J, J, 99999],
    "dates fausses → null, entiers ramenés ; 3 réussis et plus sans étoile : l'étoile au dernier retour");
  assert.deepEqual(p.etapes.D1, [hier, null, hier, 1, 0, 2, 0, J, null, 7], "on ne réussit et rate pas à la fois");
  assert.deepEqual(p.etapes.D2, [hier, null, J, 1, 0, 0, 0, null, null, 0], "un retour ou une étoile avant la validation : effacés");
  assert.deepEqual(p.etapes.C2, [J, null, null, 0, 2, 0, 0, null, null, 0], "pas validée : mode 0, ni retour ni étoile");
  assert.deepEqual(p.reperes, {c2: [J, 1]});
  assert.deepEqual(Object.values(p.seances).map(s => s[11]), [12, 15, 16], "identifiant 0, mauvaise longueur, date fausse, clé non numérique : jetées");
  assert.deepEqual(p.seances["2"], [J, 54, 1, 2, 0, 12, 12, 0, 0, 0, 54, 15, 5], "ramenés aux bornes (12 questions au plus dans Je me souviens)");
  assert.deepEqual(p.seances["3"].slice(5, 7), [2, 2], "jamais plus de justes que de questions posées");
});

test("la version 1 se lit encore et devient une version 2", () => {
  const v1 = {version: 1, epoque: 3, etapes: {
    R1: ["2026-11-01", "2026-11-01", "2026-11-02", 1, 0, 1, "2026-11-06"],
    R2: ["2026-11-03", "2026-11-03", null, 0, 1, 0, null],
    P1: ["2026-11-01", null, "2026-11-05", 2, 0, 0, "2026-11-04"]
  }, reperes: {l1: ["2026-11-06", 1]}, seances: {1: ["2026-11-06", 4, 1, 1, 1, 3, 2, 1, 0, 0, 0, 77, 1]}};
  const p = P.normaliser(v1);
  assert.equal(p.version, 2);
  assert.equal(p.epoque, 3);
  assert.deepEqual(p.etapes.R1, ["2026-11-01", "2026-11-01", "2026-11-02", 1, 0, 0, 0, "2026-11-06", null, 0],
    "le dernier échauffement, après la validation, devient le dernier retour");
  assert.deepEqual(p.etapes.R2, ["2026-11-03", "2026-11-03", null, 0, 1, 0, 0, null, null, 0], "pas validée : rien ne change");
  assert.deepEqual(p.etapes.P1, ["2026-11-01", null, "2026-11-05", 2, 0, 0, 0, null, null, 0], "un échauffement d'avant la validation ne compte pas");
  assert.deepEqual(p.reperes, {l1: ["2026-11-06", 1]});
  assert.deepEqual(p.seances["1"], ["2026-11-06", 4, 1, 1, 1, 3, 2, 1, 0, 0, 0, 77, 1], "les séances ne changent pas");
  assert.equal(P.prochainRetour(p, "R1"), "2026-11-07", "R1 : revient le lendemain de son dernier échauffement");
  assert.equal(P.prochainRetour(p, "P1"), "2026-11-06", "P1 : le lendemain de sa validation");
  // Stockée en version 1 sur l'appareil, elle se relit, puis se réécrit en version 2.
  const boite = new Map([[P.CLE_STOCKAGE, JSON.stringify(v1)]]);
  const stockage = {getItem: k => (boite.has(k) ? boite.get(k) : null), setItem: (k, v) => boite.set(k, v)};
  const lu = P.charger(stockage);
  assert.deepEqual(lu, p);
  P.sauver(stockage, lu);
  assert.equal(JSON.parse(boite.get(P.CLE_STOCKAGE)).version, 2);
  // Un appareil en version 1, l'autre en version 2 : la fusion marche dans les deux sens.
  const v2 = P.noterRetour(p, "R1", true, "2026-11-07", 42);
  assert.equal(JSON.stringify(P.fusionner(v1, v2)), JSON.stringify(P.fusionner(v2, v1)));
  assert.deepEqual(P.fusionner(v1, v2).etapes.R1.slice(5, 10), [1, 0, "2026-11-07", null, 42]);
});

test("le rythme : la coche le jour même, « Je valide » juste après « À toi »", () => {
  let p = P.marquerVue(P.creer(), "C1", J);
  assert.equal(P.actionDe(P.creer(), "C1", J), "apprends");
  assert.equal(P.actionDe(p, "C1", J), "a-toi");
  p = P.marquerEntrainee(p, "C1", J);
  assert.equal(P.actionDe(p, "C1", J), "valide", "le jour même, juste après");
  assert.equal(P.actionDe(p, "C1", P.ajouterJours(J, 1)), "a-toi", "parti avant Je valide : le lendemain, À toi d'abord");
  assert.equal(P.actionDe(p, "C1", P.ajouterJours(J, 1), {prof: true}), "valide", "mode prof : tout de suite");
  // Une validation ratée : « À toi » à refaire.
  let q = P.noterValidation(p, "C1", false, J);
  assert.equal(q.etapes.C1[1], null);
  assert.equal(P.actionDe(q, "C1", J), "a-toi");
  q = P.marquerEntrainee(q, "C1", J);
  assert.equal(P.actionDe(q, "C1", J), "valide", "même le même jour");
  // Deuxième ratée de suite : J'apprends en entier.
  q = P.noterValidation(q, "C1", false, J);
  assert.equal(q.etapes.C1[4], 2);
  assert.equal(P.actionDe(q, "C1", J), "apprends");
  q = P.marquerEntrainee(q, "C1", J);
  q = P.noterValidation(q, "C1", false, J);
  assert.equal(q.etapes.C1[4], 3, "3 : à reprendre en classe");
  assert.equal(P.aReprendre(q, "C1"), true);
  assert.equal(P.resumeProf(q, {aujourdhui: J}).etapes.find(e => e.code === "C1").aReprendre, true);
  assert.equal(P.actionDe(q, "C1", J), "a-toi", "et l'élève continue");
  q = P.marquerEntrainee(q, "C1", J);
  q = P.noterValidation(q, "C1", true, J);
  assert.deepEqual(q.etapes.C1.slice(2, 5), [J, 1, 0]);
  assert.equal(P.aReprendre(q, "C1"), false, "validée : plus à reprendre");
  assert.equal(P.actionDe(q, "C1", J), "validee");
  assert.equal(P.noterValidation(q, "C1", false, J).etapes.C1[2], J, "la coche ne repart jamais");
});

test("les retours : le lendemain (2 questions), 3 jours, 1 semaine, 2 semaines, puis une fois par mois", () => {
  let p = P.marquerEntrainee(P.creer(), "C1", J);
  p = P.noterValidation(p, "C1", true, J);
  const jour = n => P.ajouterJours(J, n);
  assert.equal(P.prochainRetour(p, "C1"), jour(1));
  assert.deepEqual(P.tirerSouvenirs(p, J, PRETS), [], "rien le jour de la validation (ni le premier jour)");
  assert.deepEqual(P.tirerSouvenirs(p, jour(1), PRETS), [{code: "C1", questions: 2}]);
  p = P.noterRetour(p, "C1", true, jour(1), 11);
  assert.equal(P.prochainRetour(p, "C1"), jour(4), "3 jours après");
  assert.deepEqual(P.tirerSouvenirs(p, jour(3), PRETS), [], "pas avant");
  assert.deepEqual(P.tirerSouvenirs(p, jour(4), PRETS), [{code: "C1", questions: 1}], "1 question ensuite");
  p = P.noterRetour(p, "C1", true, jour(4), 12);
  assert.equal(P.prochainRetour(p, "C1"), jour(11), "1 semaine après");
  assert.equal(P.estSolide(p, "C1"), false);
  p = P.noterRetour(p, "C1", true, jour(11), 13);
  assert.equal(P.estSolide(p, "C1"), true, "3 retours réussis de suite : solide");
  assert.equal(p.etapes.C1[8], jour(11));
  assert.equal(P.prochainRetour(p, "C1"), jour(25), "2 semaines après");
  p = P.noterRetour(p, "C1", true, jour(25), 14);
  assert.equal(P.prochainRetour(p, "C1"), jour(55), "puis une fois par mois");
  p = P.noterRetour(p, "C1", true, jour(55), 14);
  assert.equal(P.prochainRetour(p, "C1"), jour(85));
  p = P.noterRetour(p, "C1", true, jour(85), 14);
  assert.equal(P.prochainRetour(p, "C1"), jour(115));
  assert.equal(P.graineRetour(p, "C1"), 14, "la graine du dernier retour, pour ne pas reposer ses questions");
  p = P.noterRetour(p, "C1", true, jour(115), 14);
  assert.equal(P.prochainRetour(p, "C1"), jour(145));
  p = P.noterRetour(p, "C1", true, jour(145) , 14);
  p = P.noterRetour(p, "C1", true, jour(175), 14);
  p = P.noterRetour(p, "C1", true, jour(205), 14);
  assert.equal(p.etapes.C1[5], 9, "le compteur s'arrête à 9");
  p = P.noterRetour(p, "C1", true, jour(235), 14);
  assert.equal(p.etapes.C1[5], 9);
  assert.equal(P.prochainRetour(p, "C1"), jour(265), "et le retour reste mensuel");
  // On rejoue la fin à partir du jour 71 : un retour raté.
  p = P.normaliser(Object.assign(P.creer(), {etapes: {C1: [J, J, J, 1, 0, 4, 0, jour(70), jour(11), 14]}}));
  // Un retour raté : la coche et l'étoile restent, l'étape revient le lendemain, en 2 questions.
  p = P.noterRetour(p, "C1", false, jour(71), 15);
  assert.equal(P.estValidee(p, "C1"), true);
  assert.equal(P.estSolide(p, "C1"), true, "l'étoile ne se perd pas");
  assert.equal(P.prochainRetour(p, "C1"), jour(72));
  assert.deepEqual(P.tirerSouvenirs(p, jour(72), PRETS), [{code: "C1", questions: 2}]);
  p = P.noterRetour(p, "C1", false, jour(72), 16);
  assert.equal(P.aReprendre(p, "C1"), false);
  p = P.noterRetour(p, "C1", false, jour(73), 17);
  assert.equal(P.aReprendre(p, "C1"), true, "3 retours ratés de suite : à reprendre en classe");
  assert.equal(P.resumeProf(p, {aujourdhui: jour(73)}).etapes.find(e => e.code === "C1").aReprendre, true);
  p = P.noterRetour(p, "C1", true, jour(74), 18);
  assert.equal(P.aReprendre(p, "C1"), false, "un retour réussi : plus à reprendre");
  assert.equal(P.prochainRetour(p, "C1"), jour(77), "et on repart : 3 jours");
  assert.equal(P.noterRetour(P.creer(), "C1", true, J, 1).etapes.C1, undefined, "pas de retour pour une étape pas validée");
});

test("« Je me souviens » : les plus anciennes dues d'abord, 6 étapes au plus", () => {
  let p = P.creer();
  const jour = n => P.ajouterJours(J, n);
  // R1, R2, P1, C1 validées au test il y a 10 jours ; C2 hier ; E1 il y a 3 jours, un retour réussi.
  ["R1", "R2", "P1", "C1"].forEach(c => { p = P.noterTest(p, c, jour(-10)); });
  p = P.noterTest(p, "E1", jour(-5));
  p = P.noterRetour(p, "E1", true, jour(-4), 3);
  p = P.marquerEntrainee(p, "C2", hier);
  p = P.noterValidation(p, "C2", true, hier);
  assert.deepEqual(P.retoursDus(p, J, PRETS), ["R1", "R2", "P1", "C1", "E1", "C2"], "dues depuis 9 jours (par rang), puis E1 (hier), puis C2");
  p = P.noterTest(p, "D1", jour(-10));
  assert.deepEqual(P.tirerSouvenirs(p, J, PRETS).map(x => `${x.code}${x.questions}`), ["R12", "R22", "P12", "C12", "D12", "E11"],
    "6 étapes au plus (C2, due depuis aujourd'hui seulement, attend) ; 2 questions au premier retour, 1 ensuite");
  ["R1", "R2", "P1", "C1", "D1"].forEach((c, i) => { p = P.noterRetour(p, c, i !== 1, J, i + 1); });
  p = P.noterRetour(p, "E1", true, J, 9);
  assert.deepEqual(P.tirerSouvenirs(p, J, PRETS), [{code: "C2", questions: 2}],
    "une seconde séance le même jour : la suite (les retours faits aujourd'hui ne reviennent pas)");
  assert.deepEqual(P.tirerSouvenirs(p, P.ajouterJours(J, 1), PRETS).map(x => `${x.code}${x.questions}`), ["C22", "R22"],
    "le lendemain : C2 (due depuis la veille), puis R2 ratée hier, en 2 questions");
});

test("une horloge fausse (une date à venir) ne fait pas disparaître les retours", () => {
  const futur = "2027-06-01";
  let p = P.noterTest(P.creer(), "C1", J);
  p = P.noterRetour(p, "C1", true, futur, 4);
  assert.deepEqual(P.retoursDus(p, J, PRETS), ["C1"], "retour daté après aujourd'hui : dû tout de suite");
  p = P.noterRetour(p, "C1", true, J, 5);
  assert.equal(p.etapes.C1[7], J, "le retour d'aujourd'hui remet la date en place");
  assert.deepEqual(P.retoursDus(p, J, PRETS), [], "et l'étape suit son rythme");
  const tot = P.noterTest(P.creer(), "C2", futur);
  assert.deepEqual(P.retoursDus(tot, J, PRETS), ["C2"], "même une validation datée dans le futur");
});

test("Je valide mélangé : 7 de l'étape, 3 des étapes validées du palier aux places 3, 6 et 9", () => {
  const palier = PRETS;
  let p = P.creer();
  assert.deepEqual(P.planValidation(p, "R1", palier), Array(10).fill("R1"), "rien de validé : 10 de l'étape");
  p = P.noterTest(p, "R1", J);
  assert.deepEqual(P.planValidation(p, "R2", palier), ["R2", "R2", "R1", "R2", "R2", "R1", "R2", "R2", "R1", "R2"], "une seule : elle revient 3 fois");
  ["R2", "P1", "C1"].forEach(c => { p = P.noterTest(p, c, J); });
  const plan = P.planValidation(p, "C2", palier);
  assert.deepEqual(plan.map((c, i) => (c === "C2" ? null : [i, c])).filter(Boolean), [[2, "C1"], [5, "P1"], [8, "R2"]], "les plus proches avant elle");
  assert.equal(plan.filter(c => c === "C2").length, 7);
  // Validées après elle par « Tu connais déjà ? » : elles comptent aussi, après celles d'avant.
  let q = P.noterTest(P.creer(), "D1", J);
  q = P.noterTest(q, "R1", J);
  assert.deepEqual([2, 5, 8].map(i => P.planValidation(q, "R2", palier)[i]), ["R1", "D1", "R1"]);
});

test("« Je ne sais pas » dans À toi : une erreur, et l'outil revient", () => {
  const j = (outil, juste = true, jnsp = false) => ({juste, outil, jnsp});
  const debut = [j("outil"), j("outil"), j("image"), j("image")];
  assert.equal(P.suivreEntrainement(debut).outil, "aucun");
  assert.equal(P.suivreEntrainement(debut.concat(j("aucun", false))).outil, "image", "une erreur : l'image");
  assert.equal(P.suivreEntrainement(debut.concat(j("aucun", false, true))).outil, "outil", "Je ne sais pas : l'outil");
  assert.equal(P.suivreEntrainement([j("outil"), j("outil"), j("image", false, true)]).outil, "outil");
  assert.equal(P.suivreEntrainement([j("outil", false, true)]).outil, "outil", "avec l'outil, il reste");
  assert.equal(P.suivreEntrainement(debut.concat(j("aucun", true, true))).justesDeSuite, 0, "jamais compté juste");
  // Dans Je valide, il compte dans les 3 erreurs.
  assert.equal(P.suivreValidation([false, false, false]).fini, true);
  assert.equal(P.suivreValidation([false, false, false]).reussie, false);
});

test("À toi : l'outil 2 justes, l'image 2 justes, puis 5 justes de suite ; 25 au plus", () => {
  const j = (outil, juste = true) => ({juste, outil});
  let r = [];
  assert.equal(P.suivreEntrainement(r).outil, "outil");
  r = [j("outil"), j("outil")];
  assert.equal(P.suivreEntrainement(r).outil, "image");
  r.push(j("image"), j("image"));
  assert.equal(P.suivreEntrainement(r).outil, "aucun");
  r.push(j("aucun"), j("aucun"), j("aucun"), j("aucun"));
  assert.equal(P.suivreEntrainement(r).reussi, false);
  r.push(j("aucun"));
  assert.equal(P.suivreEntrainement(r).reussi, true);
  assert.equal(P.suivreEntrainement([j("outil"), j("outil"), j("image", false)]).outil, "image", "une erreur ramène l'image");
  assert.equal(P.suivreEntrainement([j("outil", false)]).outil, "outil", "une erreur avec l'outil garde l'outil");
  assert.equal(P.suivreEntrainement([j("outil"), j("outil", false), j("outil", false)]).outil, "outil");
  assert.equal(P.suivreEntrainement([j("outil", false), j("outil"), j("outil")]).outil, "image", "puis 2 justes avec l'outil : l'image");
  assert.equal(P.suivreEntrainement([j("outil"), j("outil"), j("image", false), j("image", false)]).outil, "outil", "deux de suite, l'outil");
  const longue = Array.from({length: 25}, (_, i) => j("image", i % 2 === 0));
  assert.equal(P.suivreEntrainement(longue).fini, true);
});

test("Je valide : 8 sur 10, arrêt dès la 3e erreur ; le test : 3 justes sur 4", () => {
  assert.deepEqual(P.suivreValidation([true, false, true, false, true, false]), {justes: 3, erreurs: 3, fini: true, reussie: false});
  const neuf = [true, true, true, false, true, true, true, true, true, true];
  assert.equal(P.suivreValidation(neuf).reussie, true);
  assert.equal(P.suivreValidation(neuf.slice(0, 9)).fini, false);
  assert.deepEqual(P.suivreMarche([true, true, true]), {fini: true, reussie: true, total: 3});
  assert.equal(P.suivreMarche([true, false, true]).fini, false, "une erreur : une 4e question");
  assert.equal(P.suivreMarche([true, false, true, true]).reussie, true);
  assert.equal(P.suivreMarche([true, false, false]).reussie, false);
});

test("Mon étape, le test, le carnet, les repères des retours", () => {
  let p = P.creer();
  assert.equal(P.monEtape(p, PRETS), "R1");
  p = P.noterTest(p, "R1", J);
  p = P.noterTest(p, "R2", J);
  assert.equal(P.monEtape(p, PRETS), "P1");
  assert.equal(p.etapes.R1[3], 2, "validée au test");
  assert.equal(P.prochainRetour(p, "R1"), P.ajouterJours(J, 1), "une étape du test revient comme les autres");
  const reps = CARTE.etape("R1").reperes;
  assert.equal(P.carnet(p, {R1: reps}).length, 10);
  // Le retour de « Mes premiers repères » : le repère raté d'abord, puis le plus ancien, puis jamais demandé.
  assert.deepEqual(P.reperesARedemander(p, reps, 2), reps.slice().sort().slice(0, 2), "rien de demandé : par code");
  reps.forEach((r, i) => { p = P.noterRepere(p, r, true, P.ajouterJours(J, -20 + i)); });
  assert.deepEqual(P.reperesARedemander(p, reps), [reps[0]], "le plus ancien");
  p = P.noterRepere(p, reps[5], false, J);
  assert.deepEqual(P.reperesARedemander(p, reps, 2), [reps[5], reps[0]], "le raté passe devant");
  assert.deepEqual(P.reperesARedemander(p, ["zz", reps[1]]), [reps[1]], "un code inconnu est ignoré");
});

test("les ceintures, les étoiles et la Légende des conversions", () => {
  const paliers = {};
  CARTE.PALIERS.forEach(pal => { paliers[pal.n] = CARTE.etapesDuPalier(pal.n).map(e => e.code); });
  let p = P.creer();
  let c = P.ceintures(p, paliers);
  assert.deepEqual(c.map(x => x.n), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(c[0], {n: 1, total: 10, validees: 0, solides: 0, gagnee: false, doree: false});
  PRETS.slice(0, 9).forEach(code => { p = P.noterTest(p, code, J); });
  assert.equal(P.ceintures(p, paliers)[0].gagnee, false, "9 sur 10 : pas encore");
  p = P.noterTest(p, "Q1", J);
  c = P.ceintures(p, paliers);
  assert.equal(c[0].gagnee, true, "les 10 cochées : la ceinture jaune");
  assert.equal(c[0].doree, false);
  assert.equal(c[1].gagnee, false);
  const jour = n => P.ajouterJours(J, n);
  PRETS.forEach(code => { [1, 4, 11].forEach(n => { p = P.noterRetour(p, code, true, jour(n), n); }); });
  c = P.ceintures(p, paliers);
  assert.equal(c[0].solides, 10);
  assert.equal(c[0].doree, true, "toutes ses étoiles : le liseré doré");
  assert.equal(P.legende(p), false);
  assert.deepEqual(P.solides(p, PRETS), PRETS);
  assert.deepEqual(P.resumeTuile(p, {aujourdhui: J}), {validees: 10, solides: 10, total: 54, legende: false, gainSemaine: 10});
  // Un retour raté ne retire ni la ceinture ni le liseré.
  p = P.noterRetour(p, "C1", false, jour(41), 9);
  assert.equal(P.ceintures(p, paliers)[0].doree, true);
  // La Légende : les six ceintures dorées.
  let tout = P.creer();
  P.CODES.forEach(code => { tout = P.noterTest(tout, code, J); [1, 4, 11].forEach(n => { tout = P.noterRetour(tout, code, true, jour(n), n); }); });
  assert.equal(P.legende(tout), true);
  assert.ok(P.ceintures(tout, paliers).every(x => x.doree));
  assert.equal(P.resumeProf(tout).legende, true);
});

// ------------------------------------------------------------------ la fusion

function seance(p, id, champs, jour = J, ordre) {
  return P.noterSeance(p, Object.assign({id, ordre}, champs), jour).parcours;
}

test("fusion : deux appareils hors ligne le même jour, dans les deux sens", () => {
  let base = P.marquerVue(P.creer(), "R1", hier);
  base = seance(base, 500, {etape: "R1", montre: 1}, hier);
  let a = P.marquerEntrainee(base, "R1", J);
  a = P.noterValidation(a, "R1", true, J);
  a = seance(a, 900, {etape: "R1", valide: 1});
  let b = P.marquerVue(base, "R2", J);
  b = seance(b, 30, {etape: "R2", montre: 1, atoi: 2});
  const ab = P.fusionner(a, b);
  const ba = P.fusionner(b, a);
  assert.equal(JSON.stringify(ab), JSON.stringify(ba), "même résultat dans les deux sens");
  assert.equal(Object.keys(ab.seances).length, 3);
  assert.equal(ab.etapes.R1[2], J);
  assert.ok(ab.etapes.R2);
  // Identifiants qui ne montent pas dans le sens du temps : l'ordre fait foi.
  const ids = Object.values(ab.seances).map(s => s[11]);
  assert.deepEqual(ids, [500, 30, 900]);
  // Réouverture : rien ne change, rien à renvoyer.
  assert.equal(JSON.stringify(P.fusionner(ab, ab)), JSON.stringify(ab));
  assert.equal(JSON.stringify(P.fusionner(ab, a)), JSON.stringify(ab));
});

test("fusion : les retours faits sur deux appareils", () => {
  const jour = n => P.ajouterJours(J, n);
  let base = P.noterTest(P.creer(), "C1", J);
  // Le téléphone fait le retour du lendemain (réussi) ; la tablette, restée en arrière, ne l'a pas.
  const tel = P.noterRetour(base, "C1", true, jour(1), 21);
  let f = P.fusionner(tel, base);
  assert.deepEqual(f.etapes.C1.slice(5, 10), [1, 0, jour(1), null, 21]);
  assert.equal(JSON.stringify(f), JSON.stringify(P.fusionner(base, tel)));
  // Le même jour sur les deux : le plus de réussis gagne ; puis le moins de ratés ; puis la graine.
  const tab = P.noterRetour(base, "C1", false, jour(1), 99);
  f = P.fusionner(tel, tab);
  assert.deepEqual(f.etapes.C1.slice(5, 10), [1, 0, jour(1), null, 21]);
  assert.equal(JSON.stringify(f), JSON.stringify(P.fusionner(tab, tel)));
  const tel2 = P.noterRetour(base, "C1", true, jour(1), 5);
  assert.equal(P.fusionner(tel, tel2).etapes.C1[9], 21, "à égalité : la plus grande graine, dans les deux sens");
  assert.equal(P.fusionner(tel2, tel).etapes.C1[9], 21);
  // Le plus récent gagne en bloc, même raté : l'élève a raté hier, il revient demain.
  let loin = tel;
  [4, 11].forEach(n => { loin = P.noterRetour(loin, "C1", true, jour(n), n); });
  assert.equal(P.estSolide(loin, "C1"), true);
  const rate = P.noterRetour(tel, "C1", false, jour(12), 7);
  f = P.fusionner(loin, rate);
  assert.deepEqual(f.etapes.C1.slice(5, 9), [0, 1, jour(12), jour(11)], "le retour le plus récent (raté) ; l'étoile reste");
  assert.equal(JSON.stringify(f), JSON.stringify(P.fusionner(rate, loin)));
  assert.equal(P.prochainRetour(f, "C1"), jour(13));
  // La validation la plus ancienne gagne ; les retours restent ceux d'après.
  const tot = P.noterTest(P.creer(), "C1", jour(-3));
  f = P.fusionner(loin, tot);
  assert.equal(f.etapes.C1[2], jour(-3));
  assert.deepEqual(f.etapes.C1.slice(5, 9), [3, 0, jour(11), jour(11)]);
});

test("fusion : une vieille copie rouverte au bout de 15 jours ne perd rien", () => {
  let vieux = P.noterTest(P.creer(), "R1", "2026-10-20");
  vieux = seance(vieux, 11, {test: 1}, "2026-10-20");
  let neuf = vieux;
  for (let k = 1; k <= 15; k += 1) neuf = seance(neuf, 100 + k, {etape: "R2", atoi: 2}, P.ajouterJours("2026-10-20", k));
  neuf = P.noterRetour(neuf, "R1", true, "2026-10-21", 3);
  neuf = P.marquerEntrainee(neuf, "R2", "2026-11-04");
  neuf = P.noterValidation(neuf, "R2", true, "2026-11-04");
  let rouvert = P.marquerVue(vieux, "P1", J);
  rouvert = seance(rouvert, 7, {etape: "P1", montre: 1});
  const f = P.fusionner(rouvert, neuf);
  assert.equal(f.etapes.R2[2], "2026-11-04");
  assert.equal(f.etapes.R1[2], "2026-10-20");
  assert.equal(f.etapes.R1[7], "2026-10-21", "le retour fait ailleurs reste");
  assert.ok(f.etapes.P1[0]);
  assert.equal(Object.keys(f.seances).length, 17);
  assert.equal(JSON.stringify(f), JSON.stringify(P.fusionner(neuf, rouvert)));
});

test("fusion : les règles champ par champ", () => {
  const a = P.normaliser({etapes: {C1: ["2026-11-01", "2026-11-02", "2026-11-05", 2, 0, 1, 0, "2026-11-08", null, 4]}, reperes: {c2: ["2026-11-08", 0]}});
  const b = P.normaliser({etapes: {C1: ["2026-10-30", "2026-11-04", "2026-11-05", 1, 0, 0, 1, "2026-11-07", null, 9]}, reperes: {c2: ["2026-11-08", 1]}});
  const f = P.fusionner(a, b);
  assert.deepEqual(f.etapes.C1, ["2026-10-30", "2026-11-04", "2026-11-05", 1, 0, 1, 0, "2026-11-08", null, 4],
    "vue la plus ancienne, entraînée la plus récente, mode 1 avant 2 à égalité, les retours du dernier retour");
  assert.deepEqual(f.reperes.c2, ["2026-11-08", 1], "à égalité de jour, raté l'emporte");
  const c = P.normaliser({etapes: {C2: [J, null, null, 0, 3, 0, 0, null, null, 0]}});
  const d = P.normaliser({etapes: {C2: [J, null, hier, 1, 0, 0, 0, null, null, 0]}});
  assert.equal(P.fusionner(c, d).etapes.C2[4], 0, "0 si l'une des deux est validée");
  const e = P.normaliser({epoque: 2, etapes: {}});
  assert.deepEqual(P.fusionner(d, e), e, "l'époque la plus haute gagne en bloc");
  assert.deepEqual(P.fusionner(e, d), e);
  const s1 = P.normaliser({etapes: {C3: ["2026-11-01", null, "2026-11-01", 1, 0, 3, 0, "2026-11-12", "2026-11-12", 1]}});
  const s2 = P.normaliser({etapes: {C3: ["2026-11-01", null, "2026-11-01", 1, 0, 0, 0, null, "2026-11-10", 0]}});
  assert.equal(P.fusionner(s1, s2).etapes.C3[8], "2026-11-10", "l'étoile la plus ancienne");
});

test("fusion : la borne des 150 séances, le même jour et sur des jours différents", () => {
  let a = P.creer();
  for (let k = 1; k <= 120; k += 1) a = seance(a, 1000 + k, {posees: 1}, P.ajouterJours(J, -200 + k));
  let b = a;
  for (let k = 1; k <= 60; k += 1) b = seance(b, 5000 + k, {test: 1}, J);
  for (let k = 1; k <= 40; k += 1) a = seance(a, 8000 + k, {montre: 1}, J);
  const f = P.fusionner(a, b);
  assert.equal(Object.keys(f.seances).length, 150);
  const ids = Object.values(f.seances).map(s => s[11]);
  assert.ok(!ids.includes(1001), "les plus anciennes sortent, après le tri");
  assert.ok(ids.includes(5060) && ids.includes(8040));
  assert.equal(JSON.stringify(f), JSON.stringify(P.fusionner(b, a)));
});

test("fusion : un ordre à la borne fait resserrer les ordres", () => {
  const brut = {seances: {1: [J, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 5, P.ORDRE_MAX]}};
  const r = P.noterSeance(brut, {id: 6, montre: 1}, J);
  const s = Object.values(r.parcours.seances);
  assert.deepEqual(s.map(x => [x[11], x[12]]), [[5, 1], [6, 2]]);
});

test("fusion : une donnée abîmée d'un côté ne casse rien", () => {
  const bon = P.noterTest(P.creer(), "R1", J);
  const abime = {version: 2, epoque: "x", etapes: {R1: ["0000-00-00", 1, 2, 3, 4, 5, 6, 7, 8, 9], R2: [1, 2, 3]}, seances: {1: [J, 1, 1]}, reperes: []};
  const f = P.fusionner(abime, bon);
  assert.equal(f.etapes.R1[2], J);
  assert.equal(f.etapes.R2, undefined);
  assert.equal(JSON.stringify(f), JSON.stringify(P.fusionner(bon, abime)));
});

test("la séance : « Je me souviens » noté (6 questions au plus, 3 étapes ratées)", () => {
  const r = P.noterSeance(P.creer(), {id: 4, posees: 6, justes: 4, ratees: ["C1", "P1", "R2", "R1"]}, J);
  const s = Object.values(r.parcours.seances)[0];
  assert.deepEqual(s.slice(5, 10), [6, 4, P.RANG.C1, P.RANG.P1, P.RANG.R2]);
  const prof = P.resumeProf(r.parcours, {aujourdhui: J});
  assert.deepEqual(prof.souvenirsRates.map(x => x.code).sort(), ["C1", "P1", "R2"]);
  assert.deepEqual(P.resumeSuivi(r.parcours).jours[0].lignes[0].souvRates, ["C1", "P1", "R2"]);
});

test("le pire cas tient dans les bornes du serveur (2 000 clés, 40 000 octets)", () => {
  const p = {version: 2, epoque: 1000000, etapes: {}, reperes: {}, seances: {}};
  P.CODES.forEach(c => { p.etapes[c] = ["2026-12-31", "2026-12-31", "2026-12-01", 2, 0, 9, 0, "2026-12-31", "2026-12-31", 99999]; });
  CARTE.REPERES.forEach(r => { p.reperes[r.code] = ["2026-12-31", 1]; });
  for (let k = 1; k <= 150; k += 1) p.seances[String(k)] = ["2026-12-31", 54, 1, 2, 2, 6, 6, 54, 54, 54, 54, 999000 + k, 999000 + k];
  const n = P.normaliser(p);
  assert.equal(Object.keys(n.etapes).length, 54);
  assert.equal(n.etapes.R1.join(), p.etapes.R1.join(), "le pire cas est bien gardé tel quel");
  const m = P.mesurer(p);
  assert.equal(m.cles, 245, "comme en version 1 : les valeurs d'une étape sont un tableau, pas des clés");
  assert.ok(m.octets <= 16000, `${m.octets} octets (le serveur accepte 40 000)`);
});

test("sans code : stocké sur l'appareil, Effacer monte l'époque", () => {
  const boite = new Map();
  const stockage = {getItem: k => (boite.has(k) ? boite.get(k) : null), setItem: (k, v) => boite.set(k, v)};
  P.sauver(stockage, P.noterTest(P.creer(), "R1", J));
  assert.equal(P.charger(stockage).etapes.R1[2], J);
  const vide = P.effacer(stockage);
  assert.equal(vide.epoque, 1);
  assert.equal(P.estVide(P.charger(stockage)), true);
  assert.ok(boite.has(P.CLE_STOCKAGE));
});

test("fusion : 400 paires de parcours joués au hasard — symétrique, sans perte, réouverture muette", () => {
  let graine = 7;
  const hasard = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
  const choisir = l => l[Math.floor(hasard() * l.length)];
  const jouer = (p, jours) => {
    for (let k = 0; k < 25; k += 1) {
      const jour = P.ajouterJours(J, Math.floor(hasard() * jours));
      const code = choisir(PRETS);
      const g = choisir([0, 1, 2, 3, 4, 5, 6]);
      if (g === 0) p = P.marquerVue(p, code, jour);
      else if (g === 1) p = P.marquerEntrainee(p, code, jour);
      else if (g === 2) p = P.noterValidation(p, code, hasard() < 0.7, jour);
      else if (g === 3) p = P.noterTest(p, code, jour);
      else if (g === 4 || g === 5) p = P.noterRetour(p, code, hasard() < 0.7, jour, 1 + Math.floor(hasard() * 99999));
      else p = P.noterSeance(p, {id: 1 + Math.floor(hasard() * 999), posees: Math.floor(hasard() * 7), etape: code}, jour).parcours;
    }
    return p;
  };
  for (let n = 0; n < 400; n += 1) {
    const base = jouer(P.creer(), 10);
    const a = jouer(base, 30);
    const b = jouer(base, 30);
    const ab = P.fusionner(a, b);
    assert.equal(JSON.stringify(ab), JSON.stringify(P.fusionner(b, a)), `paire ${n} : dans les deux sens`);
    assert.equal(JSON.stringify(P.fusionner(ab, a)), JSON.stringify(ab), `paire ${n} : rouvrir ne change rien`);
    assert.equal(JSON.stringify(P.normaliser(JSON.parse(JSON.stringify(ab)))), JSON.stringify(ab), `paire ${n} : stable`);
    PRETS.forEach(code => {
      if (P.estValidee(a, code) || P.estValidee(b, code)) assert.ok(P.estValidee(ab, code), `paire ${n} : ${code} reste cochée`);
      if (P.estSolide(a, code) || P.estSolide(b, code)) assert.ok(P.estSolide(ab, code), `paire ${n} : ${code} garde son étoile`);
    });
  }
});
