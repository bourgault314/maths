import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

// Lot « Coffres magiques : le chemin des coffres et le cadeau Gloubi »
// (09/11/2026) — les données : coffres bronze/argent/or lus dans les trésors,
// matchs de Gloubi JOUÉS et cran du suivant par niveau, fusion entre appareils.
const require = createRequire(import.meta.url);
const P = require("../assets/js/coffres-parcours.js");

const avecTresors = (t1, t2 = 0, t3 = 0) => {
  const p = P.creer();
  [t1, t2, t3].forEach((t, i) => { if (t) p.niveaux[String(i + 1)] = {tresors: t, parfaits: 0}; });
  return P.normaliser(p);
};
const joue = (p, niveau, ...issues) => issues.reduce((q, issue) => P.noterMatchGloubi(q, niveau, issue), p);

test("coffres : le 1er trésor donne le bronze, le 2e l'argent, le 3e l'or ; les suivants comptent sans coffre", () => {
  assert.deepEqual(P.COFFRES, ["bronze", "argent", "or"]);
  assert.equal(P.coffresDuNiveau(avecTresors(0), 1), 0);
  assert.equal(P.coffresDuNiveau(avecTresors(1), 1), 1);
  assert.equal(P.coffresDuNiveau(avecTresors(2), 1), 2);
  assert.equal(P.coffresDuNiveau(avecTresors(3), 1), 3);
  assert.equal(P.coffresDuNiveau(avecTresors(7), 1), 3);
  assert.equal(P.resumeTuile(avecTresors(7, 1)).lignes[0].coffres, 3);
  assert.equal(P.resumeTuile(avecTresors(7, 1)).lignes[0].tresors, 7, "les trésors continuent d'être comptés");
  assert.equal(P.resumeProf(avecTresors(2)).niveaux[0].coffres, 2);
});

test("le chemin : le prochain coffre est celui du premier niveau débloqué sans son or ; un niveau fermé reste visible", () => {
  let c = P.cheminDesCoffres(avecTresors(2), null);
  assert.deepEqual(c.prochain, {niveau: 1, coffre: "or"});
  assert.deepEqual(c.niveaux.map(n => n.coffres), [2, 0, 0]);
  c = P.cheminDesCoffres(avecTresors(3), null);
  assert.deepEqual(c.prochain, {niveau: 2, coffre: "bronze"}, "l'or du niveau 1 ouvre le niveau 2");
  c = P.cheminDesCoffres(avecTresors(3), {niveaux: [1, 3], operations: null});
  assert.deepEqual(c.prochain, {niveau: 3, coffre: "bronze"}, "un niveau fermé par le professeur n'est pas conseillé");
  assert.deepEqual(c.niveaux.map(n => n.ouvert), [true, false, true], "mais il reste dans la liste, fermé");
  assert.equal(P.cheminDesCoffres(avecTresors(3, 3, 4), null).prochain, null, "tous les ors : plus de prochain coffre");
  assert.equal(P.cheminDesCoffres(avecTresors(3, 3, 4), null).niveaux.length, 3);
});

// Décision de Gwenaël du 11/11/2026 : une vraie progression — le niveau suivant
// s'ouvre avec le coffre d'or du niveau ouvert juste en dessous.
test("progression : le niveau 2 s'ouvre avec l'or du niveau 1, le niveau 3 avec l'or du niveau 2", () => {
  const etats = p => P.cheminDesCoffres(p, null).niveaux.map(n => [n.debloque, n.apres]);
  assert.deepEqual(etats(P.creer()), [[true, null], [false, 1], [false, 2]], "au départ : le niveau 1 seul");
  assert.deepEqual(P.cheminDesCoffres(P.creer(), null).verrou, {niveau: 2, apres: 1});
  assert.deepEqual(etats(avecTresors(2)), [[true, null], [false, 1], [false, 2]], "l'argent ne suffit pas");
  assert.deepEqual(etats(avecTresors(3)), [[true, null], [true, null], [false, 2]]);
  assert.deepEqual(P.cheminDesCoffres(avecTresors(3), null).verrou, {niveau: 3, apres: 2});
  assert.deepEqual(etats(avecTresors(3, 3)), [[true, null], [true, null], [true, null]]);
  assert.equal(P.cheminDesCoffres(avecTresors(3, 3), null).verrou, null);
  assert.deepEqual(P.niveauxDebloques(avecTresors(3), null), [1, 2]);
});

test("progression : rien n'est retiré — un trésor ou la partie en cours garde son niveau ouvert", () => {
  const vieux = avecTresors(1, 0, 2);
  assert.deepEqual(P.niveauxDebloques(vieux, null), [1, 3], "des trésors au niveau 3 d'avant le 11/11 : le niveau 3 reste ouvert");
  assert.deepEqual(P.cheminDesCoffres(vieux, null).prochain, {niveau: 1, coffre: "argent"}, "le conseil reste le chemin");
  const enCours = P.commencerPartie(P.creer(), {niveau: 2, ops: ["sum"], serie: Array(10).fill("sum"), familles: Array(10).fill(0)}, "2026-11-10");
  assert.deepEqual(P.niveauxDebloques(enCours, null), [1, 2], "une partie en cours au niveau 2 se reprend");
});

test("progression : les niveaux fermés par le professeur — le chemin commence au premier ouvert et saute les fermés", () => {
  const sans1 = {niveaux: [2, 3], operations: null};
  assert.deepEqual(P.cheminDesCoffres(P.creer(), sans1).niveaux.map(n => [n.ouvert, n.debloque, n.apres]),
    [[false, false, null], [true, true, null], [true, false, 2]]);
  const sans2 = {niveaux: [1, 3], operations: null};
  assert.deepEqual(P.niveauxDebloques(avecTresors(3), sans2), [1, 3], "l'or du niveau 1 ouvre le niveau 3 quand le 2 est fermé");
  assert.deepEqual(P.niveauxDebloques(avecTresors(3, 3), {niveaux: [1], operations: null}), [1], "un niveau fermé n'est jamais débloqué, même avec l'or dessous");
  assert.deepEqual(P.niveauxDebloques(avecTresors(0, 0, 2), {niveaux: [1, 2], operations: null}), [1], "fermé par le professeur : même ses trésors ne le rouvrent pas");
});

test("Gloubi : rien avant le coffre d'or (la surprise), trois matchs après, jamais plus", () => {
  assert.equal(P.matchsRestants(avecTresors(2), 1), 0);
  assert.deepEqual(P.cheminDesCoffres(avecTresors(2), null).gloubi, []);
  let p = avecTresors(3);
  assert.equal(P.matchsRestants(p, 1), 3);
  assert.deepEqual(P.cheminDesCoffres(p, null).gloubi, [{niveau: 1, restants: 3, cran: 1}]);
  p = joue(p, 1, "gagne");
  assert.equal(P.matchsRestants(p, 1), 2);
  p = joue(p, 1, "gagne", "gagne", "gagne", "gagne");
  assert.equal(P.matchsRestants(p, 1), 0, "après trois matchs, plus de cadeau");
  assert.equal(p.niveaux["1"].gloubi, 3);
  assert.equal(P.noterMatchGloubi(avecTresors(2), 1, "gagne").niveaux["1"].gloubi, undefined, "pas de match sans or");
  assert.equal(P.noterMatchGloubi(p, 7, "gagne").niveaux["7"], undefined);
});

test("Gloubi : un match ne compte pas comme jour de travail (ni journal, ni partie)", () => {
  let p = avecTresors(3);
  p = P.commencerPartie(p, {niveau: 2, ops: [1], serie: Array(10).fill(1)}, "2026-11-09");
  const avant = JSON.stringify({jours: p.jours, journal: p.journal, partie: p.partie, dernier: p.dernier});
  p = joue(p, 1, "gagne");
  assert.equal(JSON.stringify({jours: p.jours, journal: p.journal, partie: p.partie, dernier: p.dernier}), avant);
});

test("Gloubi : le cran — niveaux 1 et 2 s'adaptent entre distrait et malin ; niveau 3 malin puis champion pour de bon", () => {
  assert.equal(P.cranDeDepart(1), 1);
  assert.equal(P.cranDeDepart(2), 2);
  assert.equal(P.cranDeDepart(3), 3);
  for (const niveau of [1, 2]) {
    assert.equal(P.cranSuivant(niveau, 1, "gagne"), 2);
    assert.equal(P.cranSuivant(niveau, 2, "gagne"), 3);
    assert.equal(P.cranSuivant(niveau, 3, "gagne"), 3, "plafond : malin");
    assert.equal(P.cranSuivant(niveau, 3, "perdu"), 2);
    assert.equal(P.cranSuivant(niveau, 1, "perdu"), 1, "plancher : distrait");
    assert.equal(P.cranSuivant(niveau, 2, "nul"), 2);
    assert.equal(P.cranSuivant(niveau, 4, "nul"), 3, "jamais de champion aux niveaux 1 et 2");
  }
  assert.equal(P.cranSuivant(3, 3, "perdu"), 3, "jamais sous le malin");
  assert.equal(P.cranSuivant(3, 3, "nul"), 3);
  assert.equal(P.cranSuivant(3, 3, "gagne"), 4, "gagner contre le malin : champion");
  assert.equal(P.cranSuivant(3, 4, "perdu"), 4, "on reste au champion, perdu…");
  assert.equal(P.cranSuivant(3, 4, "gagne"), 4, "… ou gagné");
  assert.equal(P.cranSuivant(3, 1, "perdu"), 3, "un cran abîmé remonte au malin");
  // De bout en bout dans le parcours.
  let p = avecTresors(3, 3, 3);
  assert.deepEqual([1, 2, 3].map(n => P.cranGloubi(p, n)), [1, 2, 3]);
  p = joue(p, 1, "gagne", "gagne");
  assert.equal(P.cranGloubi(p, 1), 3);
  p = joue(p, 2, "perdu", "perdu");
  assert.equal(P.cranGloubi(p, 2), 1);
  p = joue(p, 3, "nul", "gagne");
  assert.equal(P.cranGloubi(p, 3), 4);
  p = joue(p, 3, "perdu");
  assert.equal(P.cranGloubi(p, 3), 4);
  assert.equal(P.matchsRestants(p, 3), 0);
});

// ---------------------------------------------- la check-list de la fusion
// (modèle commun du 24/10/2026 : deux appareils hors ligne le même jour,
// vieille copie qui revient, borne atteinte, donnée abîmée, les deux sens,
// refusion qui ne change rien)

const memeJSON = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));

test("fusion : deux appareils hors ligne qui jouent chacun un match — le plus de matchs joués gagne, jamais de match ressuscité", () => {
  const base = avecTresors(3);
  const a = joue(base, 1, "gagne");           // 1 joué, cran 2
  const b = joue(base, 1, "perdu", "nul");    // 2 joués, cran 1
  const ab = P.fusionner(a, b), ba = P.fusionner(b, a);
  memeJSON(ab, ba);
  assert.equal(ab.niveaux["1"].gloubi, 2);
  assert.equal(ab.niveaux["1"].cran, 1, "le cran suit la copie qui a joué le plus");
  assert.equal(P.matchsRestants(ab, 1), 1);
  memeJSON(P.fusionner(ab, a), ab);
  memeJSON(P.fusionner(ab, b), ab);
  memeJSON(P.fusionner(ab, ab), ab);
});

test("fusion : même nombre de matchs, crans différents — le plus fort, dans les deux sens", () => {
  const base = avecTresors(3);
  const a = joue(base, 1, "gagne"), b = joue(base, 1, "perdu");
  memeJSON(P.fusionner(a, b), P.fusionner(b, a));
  assert.equal(P.fusionner(a, b).niveaux["1"].cran, 2);
});

test("fusion : une vieille copie (avant l'or, ou avant les matchs) ne rend aucun match", () => {
  const vieille = avecTresors(2);
  const recente = joue(avecTresors(4), 1, "gagne", "gagne", "nul");
  const f = P.fusionner(vieille, recente);
  memeJSON(f, P.fusionner(recente, vieille));
  assert.equal(P.matchsRestants(f, 1), 0);
  assert.equal(f.niveaux["1"].tresors, 4);
  const avantMatchs = avecTresors(3);
  assert.equal(P.matchsRestants(P.fusionner(avantMatchs, recente), 1), 0);
});

test("fusion : la borne (3 matchs) atteinte des deux côtés, et une restauration par époque", () => {
  const a = joue(avecTresors(3), 1, "gagne", "gagne", "gagne");
  const b = joue(avecTresors(3), 1, "perdu", "perdu", "perdu");
  const f = P.fusionner(a, b);
  assert.equal(f.niveaux["1"].gloubi, 3);
  assert.equal(f.niveaux["1"].cran, 3);
  memeJSON(f, P.fusionner(b, a));
  const restaure = Object.assign(avecTresors(3), {epoque: 1});
  assert.equal(P.matchsRestants(P.fusionner(a, restaure), 1), 3, "l'époque plus haute gagne en bloc");
});

test("données abîmées : matchs hors bornes, cran illisible, Gloubi sans or, niveau inconnu", () => {
  const brut = {version: 2, epoque: 0, operations: {}, niveaux: {
    "1": {tresors: 3, parfaits: 0, gloubi: 99, cran: 99},
    "2": {tresors: 2, parfaits: 0, gloubi: 2, cran: 2},
    "3": {tresors: 5, parfaits: 0, gloubi: "2", cran: "x"},
    "4": {tresors: 3, gloubi: 1}
  }};
  const p = P.normaliser(brut);
  assert.deepEqual(p.niveaux["1"], {tresors: 3, parfaits: 0, gloubi: 3, cran: 3}, "bornés : 3 matchs, malin au plus au niveau 1");
  assert.deepEqual(p.niveaux["2"], {tresors: 2, parfaits: 0}, "pas de Gloubi sans coffre d'or");
  assert.deepEqual(p.niveaux["3"], {tresors: 5, parfaits: 0, gloubi: 2, cran: 3}, "un cran illisible : le départ du niveau");
  assert.equal(p.niveaux["4"], undefined);
  assert.deepEqual(P.normaliser({niveaux: {"1": {tresors: 3, gloubi: 0, cran: 4}}}).niveaux["1"], {tresors: 3, parfaits: 0},
    "pas de cran sans match joué");
  assert.deepEqual(P.normaliser({niveaux: {"3": {tresors: 3, gloubi: 1, cran: 1}}}).niveaux["3"].cran, 3, "niveau 3 : jamais sous le malin");
  memeJSON(P.normaliser(p), p, "relire ne change rien");
});

test("le serveur : gloubi et cran sont déclarés, et le parcours de référence en porte", () => {
  const applis = readFileSync(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8");
  const bloc = applis.slice(applis.indexOf("'coffres' => ["), applis.indexOf("'flash-anzan' => ["));
  for (const cle of ["gloubi", "cran"]) {
    assert.ok(P.CLES_SERVEUR.includes(cle));
    assert.match(bloc, new RegExp(`'${cle}'`));
  }
  const reference = JSON.parse(readFileSync(new URL("../_serveur/tests/parcours-reference-coffres.json", import.meta.url), "utf8"));
  assert.equal(reference.niveaux["1"].gloubi, 2);
  assert.equal(reference.niveaux["1"].cran, 2);
  memeJSON(P.pourServeur(reference), reference);
});

// Relecture Codex du 11/11/2026 : deux onglets jouent chacun contre le distrait ;
// le second ne doit pas appliquer sa victoire au cran rangé entre-temps.
test("Gloubi : le cran suivant part du Gloubi VRAIMENT affronté (deux onglets)", () => {
  const or = avecTresors(3);
  const onglet1 = P.noterMatchGloubi(or, 1, "gagne", 1);
  assert.equal(onglet1.niveaux["1"].cran, 2);
  const onglet2 = P.noterMatchGloubi(onglet1, 1, "gagne", 1);
  assert.equal(onglet2.niveaux["1"].gloubi, 2, "deux matchs joués");
  assert.equal(onglet2.niveaux["1"].cran, 2, "gagné contre le distrait : le gourmand, pas le malin");
  assert.equal(P.noterMatchGloubi(onglet1, 1, "gagne").niveaux["1"].cran, 3, "sans le cran joué : l'ancien comportement (cran rangé)");
  assert.equal(P.noterMatchGloubi(avecTresors(0, 0, 3), 3, "perdu", 1).niveaux["3"].cran, 3, "niveau 3 : jamais sous le malin, même avec un cran joué illisible");
});

test("version 3 : gloubi et cran exigent une page qui les connaît (le serveur refuse la version 2)", () => {
  assert.equal(P.VERSION, 4); // 4 depuis le lot « le jour vert » (les clés du jour au journal)
  assert.match(readFileSync(new URL("../_serveur/public/lib/applis.php", import.meta.url), "utf8"), /'gloubi', 'cran'\],[\s\S]*?'version_min' => 4,\s*\],\s*\/\/ Anzan/);
});
