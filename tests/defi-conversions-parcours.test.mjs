// Défi conversions, lot 1 : la carte et la progression (sans navigateur).
//   - la carte : 48 codes, rangs uniques, paliers 8 / 14 / 8 / 6 / 7 / 5 ;
//   - le format version 1 et sa renormalisation ;
//   - la règle du lendemain (Je valide s'ouvre le jour d'après « À toi ») ;
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

test("la carte : 48 étapes, codes et rangs figés, paliers 8/14/8/6/7/5", () => {
  assert.equal(CARTE.ETAPES.length, 48);
  assert.deepEqual(CARTE.ETAPES.map(e => e.rang), Array.from({length: 48}, (_, i) => i + 1));
  assert.deepEqual(CARTE.ETAPES.map(e => e.code), [...P.CODES], "même liste que le moteur (copie du serveur au lot 2)");
  assert.equal(new Set(CARTE.ETAPES.map(e => e.code)).size, 48);
  CARTE.ETAPES.forEach(e => assert.match(e.code, P.MOTIF_ETAPE));
  assert.deepEqual(CARTE.PALIERS.map(p => p.etapes), [8, 14, 8, 6, 7, 5]);
  assert.equal(CARTE.etape("D2").palier, 1, "La demi-heure, le quart d'heure : palier 1 (BO de cycle 2)");
  assert.equal(CARTE.etape("D2").rang, 21, "son rang ne bouge pas");
  assert.equal(CARTE.REPERES.length, 28);
  CARTE.REPERES.forEach(r => assert.match(r.code, P.MOTIF_REPERE));
  assert.equal(CARTE.etape("R1").reperes.length, 9);
});

test("la carte : le palier 1 est entier (8 étapes prêtes, textes complets)", () => {
  assert.deepEqual(PRETS, ["R1", "R2", "P1", "C1", "C2", "D1", "D2", "Q1"]);
  PRETS.forEach(code => {
    const e = CARTE.etape(code);
    assert.equal(e.apprends.length, 3, code);
    assert.ok(e.retenir.length > 20, code);
    assert.ok(e.cahier, code);
  });
  assert.equal(CARTE.etape("P1").relations.length, 10, "10 relations des bases (1 m = 1 000 mm)");
  assert.ok(CARTE.etape("P1").relations.includes(CARTE.typo("1 m = 1 000 mm")));
});

test("la carte : les textes ont leurs espaces insécables", () => {
  const textes = JSON.stringify(CARTE.ETAPES) + JSON.stringify(CARTE.REPERES);
  assert.doesNotMatch(textes, /\d \d{3}(?!\d)/, "milliers séparés par une espace normale");
  assert.doesNotMatch(textes, /\d (?:cm|mm|km|kg|cL|dL|min)\b/, "espace normale avant une unité");
  assert.doesNotMatch(textes, /\d\.\d/, "point décimal");
});

test("le format version 1 : création, mêmes données → même JSON", () => {
  assert.deepEqual(P.creer(), {version: 1, epoque: 0, etapes: {}, reperes: {}, seances: {}});
  let p = P.marquerVue(P.creer(), "C1", J);
  p = P.marquerVue(p, "R1", J);
  assert.deepEqual(Object.keys(p.etapes), ["R1", "C1"], "rangées par code, dans l'ordre des rangs");
  assert.equal(JSON.stringify(P.normaliser(JSON.parse(JSON.stringify(p)))), JSON.stringify(p));
});

test("la renormalisation : code inconnu, date fausse, entier hors bornes, séance abîmée", () => {
  const brut = {
    version: 1, epoque: -3,
    etapes: {
      ZZ: [J, null, null, 0, 0, 0, null],
      C1: ["2026-02-30", "0000-01-01", J, 7, 44, 9, "pas une date"],
      C2: [J, null, null, 1, 2, 0, null],
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
      5: [J, 99, 5, 7, -1, 9, 9, 0, 0, 0, 999, 15, 5]
    }
  };
  const p = P.normaliser(brut);
  assert.equal(p.epoque, 0);
  assert.deepEqual(Object.keys(p.etapes), ["C1", "C2"]);
  assert.deepEqual(p.etapes.C1, [null, null, J, 2, 0, 2, null], "dates fausses → null, entiers ramenés, ratées à 0 si validée");
  assert.deepEqual(p.etapes.C2, [J, null, null, 0, 2, 0, null], "mode 0 sans validation");
  assert.deepEqual(p.reperes, {c2: [J, 1]});
  assert.deepEqual(Object.values(p.seances).map(s => s[11]), [12, 15], "identifiant 0, mauvaise longueur, date fausse, clé non numérique : jetées");
  assert.deepEqual(p.seances["2"], [J, 48, 1, 2, 0, 3, 3, 0, 0, 0, 48, 15, 5]);
});

test("la règle du lendemain : Je valide s'ouvre le jour d'après « À toi »", () => {
  let p = P.marquerVue(P.creer(), "C1", J);
  assert.equal(P.actionDe(p, "C1", J), "a-toi");
  assert.equal(P.actionDe(P.creer(), "C1", J), "apprends");
  p = P.marquerEntrainee(p, "C1", J);
  assert.equal(P.actionDe(p, "C1", J), "demain", "le jour même : pas encore");
  assert.equal(P.actionDe(p, "C1", J, {prof: true}), "valide", "mode prof : tout de suite");
  assert.equal(P.actionDe(p, "C1", P.ajouterJours(J, 1)), "valide", "le lendemain");
  assert.equal(P.actionDe(p, "C1", P.ajouterJours(J, 5)), "valide", "et les jours suivants");
  // Une validation ratée : « À toi » à refaire, revalider le lendemain.
  let q = P.noterValidation(p, "C1", false, P.ajouterJours(J, 1));
  assert.equal(q.etapes.C1[1], null);
  assert.equal(P.actionDe(q, "C1", P.ajouterJours(J, 1)), "a-toi");
  q = P.marquerEntrainee(q, "C1", P.ajouterJours(J, 1));
  assert.equal(P.actionDe(q, "C1", P.ajouterJours(J, 1)), "demain");
  // Deuxième ratée de suite : J'apprends en entier.
  q = P.noterValidation(q, "C1", false, P.ajouterJours(J, 2));
  assert.equal(q.etapes.C1[4], 2);
  assert.equal(P.actionDe(q, "C1", P.ajouterJours(J, 2)), "apprends");
  q = P.marquerEntrainee(q, "C1", P.ajouterJours(J, 2));
  q = P.noterValidation(q, "C1", false, P.ajouterJours(J, 3));
  assert.equal(q.etapes.C1[4], 3, "3 : à reprendre en classe");
  assert.equal(P.resumeProf(q, {aujourdhui: P.ajouterJours(J, 3)}).etapes.find(e => e.code === "C1").aReprendre, true);
  assert.equal(P.actionDe(q, "C1", P.ajouterJours(J, 3)), "a-toi", "et l'élève continue");
  q = P.marquerEntrainee(q, "C1", P.ajouterJours(J, 3));
  q = P.noterValidation(q, "C1", true, P.ajouterJours(J, 4));
  assert.deepEqual(q.etapes.C1.slice(2, 5), [P.ajouterJours(J, 4), 1, 0]);
  assert.equal(P.actionDe(q, "C1", P.ajouterJours(J, 4)), "validee");
});

test("Mon étape, le test, les médailles, le carnet", () => {
  let p = P.creer();
  assert.equal(P.monEtape(p, PRETS), "R1");
  p = P.noterTest(p, "R1", J);
  p = P.noterTest(p, "R2", J);
  assert.equal(P.monEtape(p, PRETS), "P1");
  assert.equal(p.etapes.R1[3], 2, "validée au test");
  const reps = {R1: CARTE.etape("R1").reperes};
  assert.equal(P.carnet(p, reps).length, 9);
  const paliers = {1: PRETS};
  assert.deepEqual(P.medailles(p, paliers), []);
  PRETS.forEach(c => { p = P.noterTest(p, c, J); });
  assert.deepEqual(P.medailles(p, paliers), [1]);
  assert.equal(P.monEtape(p, PRETS), null);
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

test("l'échauffement : un repère, l'étape de la veille, une ancienne ; jamais deux fois la même étape", () => {
  let p = P.creer();
  ["R1", "R2", "P1"].forEach((c, i) => { p = P.noterTest(p, c, P.ajouterJours(J, -5 + i)); });
  p = P.marquerEntrainee(p, "C1", P.ajouterJours(J, -2));
  p = P.noterValidation(p, "C1", true, hier);
  const carnet = P.carnet(p, {R1: CARTE.etape("R1").reperes});
  assert.equal(P.echauffementDu(p, J, PRETS), true);
  let items = P.tirerEchauffement(p, J, PRETS, carnet);
  assert.deepEqual(items.map(i => i.type), ["repere", "etape", "etape"]);
  assert.equal(items[1].code, "C1", "la dernière validée (hier)");
  assert.equal(items[2].code, "R2", "une ancienne, pas R1 (déjà son repère)");
  // Une ancienne ratée passe devant.
  p = P.noterEchauffementEtape(p, "P1", false, hier);
  items = P.tirerEchauffement(p, J, PRETS, carnet);
  assert.equal(items[2].code, "P1");
  // Un repère raté revient en premier.
  p = P.noterEchauffementRepere(p, "m5", false, hier);
  assert.equal(P.tirerEchauffement(p, J, PRETS, carnet)[0].code, "m5");
  // Une fois par jour.
  p = P.noterSeance(p, {id: 7, posees: 1}, J).parcours;
  assert.equal(P.echauffementDu(p, J, PRETS), false);
  assert.equal(P.echauffementDu(p, P.ajouterJours(J, 1), PRETS), true);
  // Deux échauffements ratés de suite : On revoit.
  p = P.noterEchauffementEtape(p, "P1", false, J);
  assert.equal(P.aRevoir(p, PRETS), "P1");
  p = P.noterRevue(p, "P1");
  assert.equal(P.aRevoir(p, PRETS), null);
  assert.equal(P.estValidee(p, "P1"), true, "l'étape reste validée");
});

// ------------------------------------------------------------------ la fusion

function seance(p, id, champs, jour = J, ordre) {
  return P.noterSeance(p, Object.assign({id, ordre}, champs), jour).parcours;
}

test("fusion : deux appareils hors ligne le même jour, dans les deux sens", () => {
  let base = P.marquerVue(P.creer(), "R1", hier);
  base = seance(base, 500, {etape: "R1", montre: 1}, hier);
  let a = P.marquerEntrainee(base, "R1", hier);
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

test("fusion : une vieille copie rouverte au bout de 15 jours ne perd rien", () => {
  let vieux = P.noterTest(P.creer(), "R1", "2026-10-20");
  vieux = seance(vieux, 11, {test: 1}, "2026-10-20");
  let neuf = vieux;
  for (let k = 1; k <= 15; k += 1) neuf = seance(neuf, 100 + k, {etape: "R2", atoi: 2}, P.ajouterJours("2026-10-20", k));
  neuf = P.marquerEntrainee(neuf, "R2", "2026-11-03");
  neuf = P.noterValidation(neuf, "R2", true, "2026-11-04");
  let rouvert = P.marquerVue(vieux, "P1", J);
  rouvert = seance(rouvert, 7, {etape: "P1", montre: 1});
  const f = P.fusionner(rouvert, neuf);
  assert.equal(f.etapes.R2[2], "2026-11-04");
  assert.equal(f.etapes.R1[2], "2026-10-20");
  assert.ok(f.etapes.P1[0]);
  assert.equal(Object.keys(f.seances).length, 17);
  assert.equal(JSON.stringify(f), JSON.stringify(P.fusionner(neuf, rouvert)));
});

test("fusion : les règles champ par champ", () => {
  const a = P.normaliser({etapes: {C1: ["2026-11-01", "2026-11-02", "2026-11-05", 2, 0, 1, "2026-11-08"]}, reperes: {c2: ["2026-11-08", 0]}});
  const b = P.normaliser({etapes: {C1: ["2026-10-30", "2026-11-04", "2026-11-05", 1, 0, 2, "2026-11-07"]}, reperes: {c2: ["2026-11-08", 1]}});
  const f = P.fusionner(a, b);
  assert.deepEqual(f.etapes.C1, ["2026-10-30", "2026-11-04", "2026-11-05", 1, 0, 1, "2026-11-08"],
    "vue la plus ancienne, entraînée la plus récente, mode 1 avant 2 à égalité, échauffements ratés du dernier échauffement");
  assert.deepEqual(f.reperes.c2, ["2026-11-08", 1], "à égalité de jour, raté l'emporte");
  const c = P.normaliser({etapes: {C2: [J, null, null, 0, 3, 0, null]}});
  const d = P.normaliser({etapes: {C2: [J, null, hier, 1, 0, 0, null]}});
  assert.equal(P.fusionner(c, d).etapes.C2[4], 0, "0 si l'une des deux est validée");
  const e = P.normaliser({epoque: 2, etapes: {}});
  assert.deepEqual(P.fusionner(d, e), e, "l'époque la plus haute gagne en bloc");
  assert.deepEqual(P.fusionner(e, d), e);
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
  const abime = {version: 1, epoque: "x", etapes: {R1: ["0000-00-00", 1, 2, 3, 4, 5, 6]}, seances: {1: [J, 1, 1]}, reperes: []};
  const f = P.fusionner(abime, bon);
  assert.equal(f.etapes.R1[2], J);
  assert.equal(JSON.stringify(f), JSON.stringify(P.fusionner(bon, abime)));
});

test("le pire cas tient dans les bornes du serveur (2 000 clés, 40 000 octets)", () => {
  const p = {version: 1, epoque: 1000000, etapes: {}, reperes: {}, seances: {}};
  P.CODES.forEach(c => { p.etapes[c] = ["2026-12-31", "2026-12-31", "2026-12-31", 2, 0, 2, "2026-12-31"]; });
  CARTE.REPERES.forEach(r => { p.reperes[r.code] = ["2026-12-31", 1]; });
  for (let k = 1; k <= 150; k += 1) p.seances[String(k)] = ["2026-12-31", 48, 1, 2, 2, 3, 3, 48, 48, 48, 48, 999000 + k, 999000 + k];
  const m = P.mesurer(p);
  assert.equal(m.cles, 231);
  assert.ok(m.octets <= 13000, `${m.octets} octets`);
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
