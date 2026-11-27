// Défi calcul, lot K1 « la carte chez l'élève » — le correctif de la
// relecture de Codex du 26/11/2026 (6 bloquants, 10 gênants, 1 détail).
// Chaque scénario du rapport est rejoué ici avec le vrai moteur, dans les
// deux sens de la fusion ; chacun échouait sur la branche du lot avant le
// correctif. Les scénarios de la page et du serveur ont leurs fichiers :
// defi-calcul-lot-K1-correctif-page.test.mjs, _serveur/tests/lancer.php
// (« defi-calcul lot K1, correctif ») et la recette au navigateur
// defi-calcul-lot-K1-correctif-ecrans.cjs.

import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();

const J = "2026-11-23"; // un lundi
const plus = (n, jour = J) => P.ajouterJours(jour, n);
const o = (jour = J, seance = true, source = 0) => ({aujourdhui: jour, carte: CARTE, seance, source});
const de = k => { const [module, n] = k.split("-"); return {module, niveau: Number(n)}; };
const copie = p => JSON.parse(JSON.stringify(p));
const justes = (n = 6) => Array.from({length: n}, () => ({juste: true, ms: 1500}));
const fausses = () => [{juste: false, ms: 1500}, {juste: false, ms: 1500}];
const tenter = (p, k, reponses = justes(), jour = J, seance = false, source = 0) => P.appliquerTentative(p, Object.assign(de(k), {reponses}), o(jour, seance, source)).parcours;
const retour = (p, k, juste, jour = J, plusRetour = {}) => P.appliquerRetour(p, Object.assign(de(k), {juste, ms: 1500, type: "P"}, plusRetour), {aujourdhui: jour, carte: CARTE});
const lecon = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const arretee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const ETAGE = {};
CARTE.modules.forEach(m => m.paliers.forEach((palier, i) => { if (palier) ETAGE[`${m.id}-${i + 1}`] = palier; }));
const duEtage = n => CARTE.ordre.filter(k => ETAGE[k] === n);
const SECONDES = 4;
// L'aléa qui donne à une séance l'identité voulue (1 à 9 999).
const aleaPour = identite => (identite - .5) / 9999;
const fusion = (x, y, options = {}) => P.fusionner(x, y, Object.assign({aujourdhui: J}, options));
// La même fusion dans les deux sens, et la copie qui revient ne change rien.
function fusionSure(a, b, options = {}) {
  const ab = fusion(a, b, options);
  assert.deepEqual(fusion(b, a, options), ab, "la fusion donne la même chose dans les deux sens");
  assert.deepEqual(fusion(ab, a, options), ab, "la copie A qui revient ne change rien");
  assert.deepEqual(fusion(ab, b, options), ab, "la copie B qui revient ne change rien");
  assert.deepEqual(P.normaliserParcours(ab, {aujourdhui: J}), ab, "une fusion est déjà propre");
  return ab;
}
// Une étoile posée à la main (tenue en boîte `b`, due le jour `e`).
function poser(p, k, {b = 2, e = J, d = plus(-10), a = 1, g = 1} = {}) {
  const {module, niveau} = de(k);
  if (!p.modules[module]) {
    const n = P.NIVEAUX[module];
    const liste = v => Array.from({length: n}, () => v);
    p.modules[module] = {vu: d, b: liste(0), e: liste(null), a: liste(0), x: liste(0), r: liste(0), q: liste(null), pe: liste(0), d: liste(null), s: liste(null), ar: liste(0), g: liste(0), c: {}};
  }
  Object.entries({b, e, d, a, g}).forEach(([champ, valeur]) => { p.modules[module][champ][niveau - 1] = valeur; });
  return p;
}
const tenir = (cles, options) => P.normaliserParcours(cles.reduce((p, k) => poser(p, k, options), P.creerParcours()), {aujourdhui: J});
// Une séance faite et finie : ouverte sous `identite`, `secondes` de temps.
function seanceFinie(p, jour, identite, secondes = 60) {
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: jour, alea: aleaPour(identite)});
  p = P.noterTemps(p, secondes);
  return P.fermerSeance(p, CARTE, {aujourdhui: jour, force: true}).parcours;
}
const numeros = p => p.journal.numero.slice();
const minutes = p => p.journal.minutes.reduce((somme, m) => somme + Math.max(0, m), 0);

// ============================================================ 1. le moteur

// ---- bloquant : une copie abîmée peut effacer du travail valide

test("Codex 1 — une boîte abîmée (99, un texte, une case qui manque) n'est pas une étoile perdue : l'étoile valide de l'autre copie reste", () => {
  // (Lot P1 : gagnée après un « Je tente » raté la veille — boîte 2, comme avant ; du premier coup,
  // elle entrerait en boîte 4.)
  const sain = tenter(tenter(P.creerParcours(), "A1-1", fausses(), plus(-1)), "A1-1");
  assert.equal(sain.modules.A1.b[0], 2);
  [99, "2", null, -1, 2.5, [2], true].forEach(valeur => {
    const abime = copie(sain);
    abime.modules.A1.b[0] = valeur;
    const f = fusionSure(sain, abime);
    assert.equal(f.modules.A1.b[0], 2, `boîte ${JSON.stringify(valeur)} : l'étoile tenue reste tenue`);
    assert.equal(f.modules.A1.e[0], sain.modules.A1.e[0], "avec son échéance");
    assert.equal(P.recevoir(sain, abime, {aujourdhui: J}).parcours.modules.A1.b[0], 2, "la copie abîmée reçue du serveur");
    assert.equal(P.recevoir(abime, sain, {aujourdhui: J}).parcours.modules.A1.b[0], 2, "la copie abîmée sur l'appareil");
  });
  // La liste des boîtes manque en entier.
  const sansBoites = copie(sain);
  delete sansBoites.modules.A1.b;
  assert.equal(fusionSure(sain, sansBoites).modules.A1.b[0], 2);
  // Passée par le serveur, la boîte abîmée est devenue 0 (le compteur est resté) : jamais perdue et pourtant
  // entrée un jour, la copie est incohérente — elle ne gagne pas non plus.
  const remplacee = copie(sain);
  remplacee.modules.A1.b[0] = 0;
  remplacee.modules.A1.e[0] = null;
  assert.equal(fusionSure(sain, remplacee).modules.A1.b[0], 2, "une boîte remise à 0 sans perte (pe = 0) n'est pas une étoile perdue");
  // Une étoile déjà perdue une fois, puis regagnée : la même copie avec la boîte abîmée ne la fait pas repartir.
  // (Lot P1, la règle B : raté le lendemain, elle revient encore ; ratée le surlendemain, elle part.)
  let regagnee = retour(retour(sain, "A1-1", false, plus(1)).parcours, "A1-1", false, plus(1)).parcours;
  regagnee = retour(retour(regagnee, "A1-1", false, plus(2)).parcours, "A1-1", false, plus(2)).parcours;
  regagnee = tenter(regagnee, "A1-1", justes(), plus(2));
  assert.deepEqual([regagnee.modules.A1.b[0], regagnee.modules.A1.pe[0]], [2, 1]);
  const regagneeAbimee = copie(regagnee);
  regagneeAbimee.modules.A1.b[0] = 99;
  assert.equal(P.normaliserParcours(regagneeAbimee, {aujourdhui: J}).modules.A1.g[0], 0, "cette copie ne sait plus rien de l'étoile : son compteur vaut 0");
  assert.equal(fusionSure(regagnee, regagneeAbimee).modules.A1.b[0], 2, "une boîte abîmée sur une étoile déjà perdue un jour : l'étoile regagnée reste");
  // Une VRAIE perte (deux calculs faux au retour : `pe` monte, le compteur aussi) gagne toujours contre la copie d'avant.
  // (Lot P1, la règle B : ratée le lendemain, puis le surlendemain.)
  let perdue = retour(sain, "A1-1", false, plus(1)).parcours;
  perdue = retour(perdue, "A1-1", false, plus(1)).parcours;
  perdue = retour(retour(perdue, "A1-1", false, plus(2)).parcours, "A1-1", false, plus(2)).parcours;
  assert.deepEqual([perdue.modules.A1.b[0], perdue.modules.A1.pe[0]], [0, 1]);
  const f = fusionSure(sain, perdue);
  assert.deepEqual([f.modules.A1.b[0], f.modules.A1.pe[0], f.modules.A1.d[0]], [0, 1, J], "une étoile réellement perdue reste perdue, avec son jour d'entrée");
});

test("Codex 1 — une version illisible (« 12 » en texte) n'est pas une remise à zéro : son époque ne vaut rien", () => {
  const sain = tenter(tenter(P.creerParcours(), "A1-1"), "M1-1");
  [{version: "12", epoque: 7}, {epoque: 7}, {version: 12.5, epoque: 7}, {version: null, epoque: 1000000}, {version: [12], epoque: 3, modules: sain.modules}].forEach(illisible => {
    assert.equal(P.normaliserParcours(illisible).epoque, 0, `${JSON.stringify(illisible).slice(0, 40)} : pas d'époque`);
    const f = fusionSure(sain, illisible);
    assert.deepEqual(f, P.normaliserParcours(sain, {aujourdhui: J}), "le travail valide reste, entier");
    assert.deepEqual(P.recevoir(sain, illisible, {aujourdhui: J}).parcours, f);
  });
  // Une vraie remise à zéro (version lisible, époque plus haute) gagne toujours en bloc.
  const zero = P.remettreAZero(sain);
  assert.equal(zero.epoque, 1);
  assert.deepEqual(fusionSure(sain, zero).modules, {});
  // Une version restaurée par le professeur depuis une page d'avant (version 11, époque relevée) aussi.
  assert.deepEqual(fusionSure(sain, {version: 11, epoque: 4}).modules, {});
  assert.equal(P.normaliserParcours({version: 11, epoque: 4}).epoque, 4);
});

// ---- bloquant : une même séance peut compter deux fois

test("Codex 2 — la même séance, close au rang 2 sur un appareil et au rang 3 sur l'autre, ne compte qu'une fois", () => {
  // Une première séance finie, puis la séance d'identité 2000, ouverte et copiée sur deux appareils.
  const avant = seanceFinie(P.creerParcours(), J, 1000);
  let ouverte = P.ouvrirSeance(avant, CARTE, {aujourdhui: J, alea: aleaPour(2000)});
  ouverte = P.noterTemps(ouverte, 120);
  assert.equal(ouverte.seance.i, 2000);
  // L'appareil A la clôt : rang 2.
  const a = P.fermerSeance(ouverte, CARTE, {aujourdhui: J, force: true}).parcours;
  assert.deepEqual(numeros(a), [11000, 22000]);
  // L'appareil B a reçu entre-temps une séance finie ailleurs (identité 5000), puis clôt la sienne : rang 3.
  const ailleurs = seanceFinie(avant, J, 5000);
  let b = copie(ouverte);
  b.seances = ailleurs.seances.slice();
  b.journal = copie(ailleurs.journal);
  b.seance.n = 2;
  b = P.fermerSeance(b, CARTE, {aujourdhui: J, force: true}).parcours;
  assert.deepEqual(numeros(b), [11000, 25000, 32000]);
  const f = fusionSure(a, b);
  assert.deepEqual(f.seances, [J, J, J], "trois séances ce jour-là, pas quatre");
  assert.deepEqual(numeros(f).map(n => n % 10000).sort(), [1000, 2000, 5000]);
  assert.equal(minutes(f), 1 + 2 + 1, "les deux minutes de la séance 2000 ne comptent qu'une fois");
  assert.equal(f.seance.n, 3, "trois séances finies");
  // La même chose par le vrai chemin : B reçoit la séance finie ailleurs en gardant la sienne OUVERTE.
  const recu = fusionSure(ouverte, ailleurs);
  assert.equal(P.seanceOuverte(recu, J), true, "la séance ouverte ne disparaît pas parce qu'une autre a été finie ailleurs");
  assert.deepEqual([recu.seance.i, recu.seance.j[SECONDES], recu.seance.n], [2000, 120, 2]);
  const b2 = P.fermerSeance(recu, CARTE, {aujourdhui: J, force: true}).parcours;
  assert.deepEqual(fusionSure(a, b2).seances, [J, J, J]);
  assert.equal(fusionSure(a, b2).seance.n, 3);
  // Une séance ouverte ici et finie là-bas est finie ; la refermer ici ne la recompte pas.
  const fini = fusionSure(ouverte, a);
  assert.equal(P.seanceOuverte(fini, J), false);
  assert.equal(fini.seance.n, 2);
  const encore = copie(a);
  encore.seance = copie(ouverte.seance);
  encore.seance.n = 2;
  const lu = P.normaliserParcours(encore, {aujourdhui: J});
  assert.equal(P.seanceOuverte(lu, J), false, "une séance ouverte que le journal dit finie se relit finie");
  // L'appareil A a fini la séance 2000 puis en a ouvert une autre (7000) ; l'appareil B revient avec sa vieille copie
  // de la 2000, encore ouverte : la séance de A reste ouverte, seule, avec son temps à elle.
  let suite = P.ouvrirSeance(a, CARTE, {aujourdhui: J, alea: aleaPour(7000)});
  suite = P.noterTemps(suite, 50, {source: 4});
  const reprise = fusionSure(suite, ouverte);
  assert.deepEqual([P.seanceOuverte(reprise, J), reprise.seance.i, reprise.seance.j[SECONDES], reprise.seance.n], [true, 7000, 50, 2],
    "la vieille séance finie ne se mêle pas à la séance en cours, et ne la ferme pas");
  // Deux séances DIFFÉRENTES restent deux, même aux mêmes nombres (G3).
  assert.deepEqual(fusionSure(seanceFinie(avant, J, 3000), seanceFinie(avant, J, 4000)).seances, [J, J, J]);
});

// ---- gênant : la fusion perd le temps d'un des appareils

test("Codex 3 — le temps de deux appareils est réuni : ce qui est commun compte une fois, ce que chacun a ajouté est gardé", () => {
  // Deux séances ouvertes chacune de son côté le même jour, 120 et 180 secondes : une séance de 300 secondes.
  const a = P.noterTemps(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: aleaPour(1111)}), 120, {source: 11});
  const b = P.noterTemps(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: aleaPour(2222)}), 180, {source: 22});
  let f = fusionSure(a, b);
  assert.equal(P.seanceOuverte(f, J), true);
  assert.equal(f.seance.j[SECONDES], 300, "120 + 180 secondes");
  assert.equal(f.seance.i, 1111, "une seule séance, la plus petite identité");
  // Une séance commune à 120 secondes ; un appareil ajoute 180, l'autre 120 : 420, pas 240 ni 540.
  const commune = P.noterTemps(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: aleaPour(3333)}), 120, {source: 11});
  const a2 = P.noterTemps(commune, 180, {source: 11});
  const b2 = P.noterTemps(commune, 120, {source: 22});
  f = fusionSure(a2, b2);
  assert.equal(f.seance.j[SECONDES], 420, "120 communes + 180 + 120");
  assert.deepEqual(f.seance.parts.filter((_, i) => i % 11 === 0), [11, 22], "une part par onglet");
  assert.equal(fusionSure(f, commune).seance.j[SECONDES], 420, "la copie commune qui revient n'ajoute rien");
  // Sans source connue (0 des deux côtés) : le plus grand, jamais la somme — rien n'est compté deux fois.
  f = fusionSure(P.noterTemps(P.noterTemps(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: aleaPour(4444)}), 120), 180),
    P.noterTemps(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: aleaPour(4444)}), 120));
  assert.equal(f.seance.j[SECONDES], 300);
  // Les autres comptes suivent la même règle (ici, une étoile gagnée par « Je tente » sur chaque appareil).
  const depart = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: aleaPour(5555)});
  const [ligne1, ligne2] = [CARTE.lignes[0].cles[0], CARTE.lignes.find(l => l.etage === 1 && l.cles[0] !== CARTE.lignes[0].cles[0]).cles[0]];
  f = fusionSure(tenter(depart, ligne1, justes(), J, true, 11), tenter(depart, ligne2, justes(), J, true, 22));
  assert.equal(f.seance.j[2], 2, "deux étoiles gagnées dans la séance, une par appareil");
  // `j` est la somme des parts, recalculée à chaque relecture ; huit onglets au plus.
  let p = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: aleaPour(6666)});
  for (let source = 1; source <= 10; source += 1) p = P.noterTemps(p, 10, {source});
  assert.equal(p.seance.parts.length, 8 * 11);
  assert.equal(p.seance.j[SECONDES], 100, "au-delà de huit onglets, le temps s'ajoute à la dernière part : rien n'est perdu");
  const trafique = copie(p);
  trafique.seance.j[SECONDES] = 5000;
  assert.equal(P.normaliserParcours(trafique, {aujourdhui: J}).seance.j[SECONDES], 100, "`j` ne se lit pas : il se recalcule");
  // Une copie d'avant ce correctif (pas de parts) : son `j` devient la part d'une source pas connue.
  const ancienne = copie(p);
  delete ancienne.seance.parts;
  assert.deepEqual(P.normaliserParcours(ancienne, {aujourdhui: J}).seance.parts, [0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0]);
  // Une séance fermée n'a pas de parts ; le journal ne garde que les totaux.
  const finie = P.fermerSeance(p, CARTE, {aujourdhui: J, force: true}).parcours;
  assert.deepEqual([finie.seance.parts, finie.seance.j[SECONDES], finie.journal.minutes], [[], 0, [2]]);
});

// ---- gênant : une copie de quinze jours fait monter le compteur à chaque retour

test("Codex 4 — à la borne des 60 séances, une vieille copie ne fait plus monter le compte (61 → 62 → 63)", () => {
  // Deux séances le premier jour : c'est la vieille copie. Puis 59 séances, deux par jour : 61 en tout, 60 gardées.
  let p = seanceFinie(seanceFinie(P.creerParcours(), plus(-40), 101), plus(-40), 102);
  const vieille = copie(p);
  for (let i = 0; i < 59; i += 1) p = seanceFinie(p, plus(-39 + Math.floor(i / 2)), 200 + i);
  assert.deepEqual([p.seance.n, p.seances.length, p.seances[0]], [61, 60, plus(-40)], "61 séances finies, 60 gardées, la première du premier jour est sortie");
  assert.equal(numeros(p)[0] % 10000, 102);
  let courant = p;
  for (let passage = 0; passage < 3; passage += 1) {
    const recu = P.recevoir(courant, vieille, {aujourdhui: J});
    assert.equal(recu.parcours.seance.n, 61, `passage ${passage + 1} : toujours 61`);
    assert.deepEqual(recu.parcours.journal, p.journal, "les mêmes 60 séances");
    courant = recu.parcours;
  }
  assert.equal(P.recevoir(vieille, p, {aujourdhui: J}).apporte, false, "la vieille copie n'apporte rien : rien ne repart au serveur");
  assert.deepEqual(fusionSure(p, vieille), P.normaliserParcours(p, {aujourdhui: J}));
  // Une séance vraiment nouvelle pour l'autre côté, elle, compte toujours.
  const nouvelle = seanceFinie(vieille, J, 999);
  assert.equal(fusionSure(p, nouvelle).seance.n, 62);
});

// ---- gênant : le temps seul disparaît au changement de jour

test("Codex 5 — deux minutes d'un J'apprends quitté avant la fin ne disparaissent pas le lendemain", () => {
  let p = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: aleaPour(700)});
  p = P.noterTemps(p, 120, {source: 5});
  assert.deepEqual([p.seance.etape, p.seance.j[0], p.seance.j[SECONDES]], [0, 0, 120], "ni étape finie ni calcul du jour : du temps seulement");
  const lendemain = P.ouvrirSeance(p, CARTE, {aujourdhui: plus(1), alea: aleaPour(701)});
  assert.deepEqual(lendemain.seances, [J], "la séance de la veille compte pour son jour");
  assert.deepEqual([lendemain.journal.minutes, lendemain.journal.numero, lendemain.seance.n], [[2], [10700], 1]);
  assert.deepEqual([lendemain.seance.jour, lendemain.seance.i, lendemain.seance.j[SECONDES]], [plus(1), 701, 0], "et une séance neuve s'ouvre");
  // Une séance ouverte où rien ne s'est passé ne compte toujours pas ; quelques secondes non plus (une minute au moins).
  const rien = P.ouvrirSeance(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J}), CARTE, {aujourdhui: plus(1)});
  assert.deepEqual(rien.seances, []);
  const ouvre = secondes => P.ouvrirSeance(P.noterTemps(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J}), secondes), CARTE, {aujourdhui: plus(1)}).seances;
  assert.deepEqual([ouvre(59), ouvre(60)], [[], [J]]);
  // La même chose quand c'est la fusion qui apporte le jour suivant : la séance de la veille n'est pas perdue.
  const autre = seanceFinie(P.creerParcours(), plus(1), 800);
  const f = fusionSure(p, autre);
  assert.deepEqual(f.seances, [J, plus(1)]);
  assert.deepEqual([f.journal.minutes, f.seance.n], [[2, 1], 2]);
});

// ---- gênant : une ceinture peut rester non attribuée après fusion

test("Codex 6 — chaque appareil gagne une des deux dernières étoiles : la fusion donne la ceinture, à un jour qui ne dépend que des données", () => {
  const etage = duEtage(1);
  // Les deux dernières étoiles à gagner : la dernière de deux lignes différentes.
  const [x, y] = CARTE.lignes.filter(l => l.etage === 1).slice(0, 2).map(l => l.cles[l.cles.length - 1]);
  const base = tenir(etage.filter(k => k !== x && k !== y), {e: plus(5), d: plus(-10)});
  [x, y].forEach(k => assert.equal(P.etatEtoile(base, CARTE, de(k).module, de(k).niveau, {aujourdhui: J}).etat, "aGagner", k));
  const a = tenter(base, x, justes(), plus(-1));
  const b = tenter(base, y, justes(), J);
  assert.deepEqual([a.ceintures[0], b.ceintures[0]], [null, null]);
  const f = fusionSure(a, b, {carte: CARTE});
  const compte = P.carteEleve(f, CARTE, {aujourdhui: J}).etages[0];
  assert.deepEqual([compte.etoiles, compte.total], [etage.length, etage.length], "toutes les étoiles de l'étage");
  assert.equal(f.ceintures[0], J, "la ceinture est donnée : le jour où la dernière étoile a été gagnée");
  assert.deepEqual(P.fusionner(b, a, {aujourdhui: plus(9), carte: CARTE}).ceintures, f.ceintures, "le même jour, quel que soit le jour de la fusion");
  const recu = P.recevoir(a, b, {aujourdhui: J, carte: CARTE});
  assert.deepEqual([recu.parcours.ceintures[0], recu.apporte], [J, true], "et la page la renvoie au serveur");
  // Jamais au-delà du réglage du professeur, jamais une ceinture sans toutes ses étoiles.
  assert.equal(fusionSure(a, base, {carte: CARTE}).ceintures[0], null);
  // Sans la carte (un appelant d'avant), rien ne change.
  assert.equal(fusion(a, b).ceintures[0], null);
  // Une ceinture déjà datée garde son jour (le plus ancien).
  const deja = copie(f);
  deja.ceintures[0] = plus(-3);
  assert.equal(fusionSure(deja, f, {carte: CARTE}).ceintures[0], plus(-3));
});

// ---- gênant : aFermer et « Continuer » divergent

test("Codex 7 — « Continuer » ne propose que ce qui tient encore, et c'est la même sélection qui ferme la séance", () => {
  // Un « Je tente » raté sur la première étoile (fermé pour aujourd'hui : elle ne propose plus que J'apprends).
  let depart = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: .5});
  const premiere = CARTE.ordre[0];
  depart = P.appliquerTentative(depart, Object.assign(de(premiere), {reponses: fausses()}), o()).parcours;
  assert.equal(depart.seance.p[P.PLAN.commences], 1);
  const a = secondes => P.noterTemps(depart, secondes);
  // À 8 min 20 : le J'apprends de cette étoile (4 minutes) ne tient plus, un « Je tente » ailleurs (1 minute) tient.
  let p = a(500);
  let s = P.etatSeance(p, CARTE, {aujourdhui: J});
  assert.equal(s.aFermer, false);
  assert.equal(s.continuer.type, "etoile");
  assert.notEqual(`${s.continuer.module}-${s.continuer.niveau}`, premiere, "pas le J'apprends qui ne tient plus");
  assert.equal(s.continuer.action, "tente");
  assert.equal(P.peutCommencer(p, s.continuer.action, {aujourdhui: J}), true, "ce que « Continuer » propose peut commencer");
  // Le but du jour, lui, ne change pas parce que la séance avance.
  assert.deepEqual([s.but.module, s.but.niveau, s.but.action], [de(premiere).module, de(premiere).niveau, "apprends"]);
  // Tant qu'il reste du temps pour J'apprends, c'est bien lui qui est proposé, sur cette étoile.
  s = P.etatSeance(a(300), CARTE, {aujourdhui: J});
  assert.deepEqual([`${s.continuer.module}-${s.continuer.niveau}`, s.continuer.action], [premiere, "apprends"]);
  // De 0 à 12 minutes : ce qui est proposé peut toujours commencer, et la séance se ferme exactement quand plus rien ne l'est.
  for (let secondes = 0; secondes <= 720; secondes += 20) {
    p = secondes ? a(secondes) : depart;
    s = P.etatSeance(p, CARTE, {aujourdhui: J});
    if (s.continuer.type === "etoile") assert.equal(P.peutCommencer(p, s.continuer.action, {aujourdhui: J}), true, `${secondes} s : « Continuer » propose quelque chose qui tient`);
    assert.equal(s.aFermer, s.continuer.type === "rien", `${secondes} s : la séance se ferme quand « Continuer » n'a plus rien, et seulement là`);
  }
  // Plus rien ne tient : rien, et le moteur dit pourquoi.
  s = P.etatSeance(a(620), CARTE, {aujourdhui: J});
  assert.deepEqual([s.continuer.type, s.continuer.tempsFini, s.continuer.toutGagne, s.aFermer], ["rien", true, false, true]);
  // Une seule étoile reste à gagner, « Je tente » y est fermé pour aujourd'hui, et J'apprends ne tient plus : la séance
  // se ferme, même si un « Je tente » tiendrait encore dans le temps (il n'y a plus rien à tenter).
  const base1 = duEtage(1);
  const derniere = CARTE.lignes.filter(l => l.etage === 1)[0].cles.slice(-1)[0];
  let seule = tenir(base1.filter(k => k !== derniere), {e: plus(5), d: plus(-10)});
  seule = P.ouvrirSeance(seule, CARTE, {aujourdhui: J, alea: .5, palier: 1});
  seule = P.appliquerTentative(seule, Object.assign(de(derniere), {reponses: fausses()}), Object.assign(o(), {palier: 1})).parcours;
  seule = P.noterTemps(seule, 480);
  assert.equal(P.peutCommencer(seule, "tente", {aujourdhui: J}), true, "un « Je tente » tiendrait encore");
  s = P.etatSeance(seule, CARTE, {aujourdhui: J, palier: 1});
  assert.deepEqual([s.continuer.type, s.continuer.tempsFini, s.aFermer], ["rien", true, true], "mais il n'y a plus rien à proposer : la séance se ferme");
  // Hors séance, « Continuer » ne regarde pas le temps.
  const ferme = P.fermerSeance(a(620), CARTE, {aujourdhui: J, force: true}).parcours;
  assert.equal(P.etatSeance(ferme, CARTE, {aujourdhui: J}).continuer.type, "etoile");
  // Et l'étape qui finit : à 8 min 20, un 2e « Je tente » raté laisse la séance ouverte seulement si autre chose tient.
  const autre = P.etatSeance(a(500), CARTE, {aujourdhui: J}).continuer;
  const apres = P.appliquerTentative(a(540), {module: autre.module, niveau: autre.niveau, reponses: fausses()}, o());
  assert.equal(apres.finie, !P.seanceOuverte(apres.parcours, J));
  assert.equal(P.etatSeance(apres.parcours, CARTE, {aujourdhui: J}).aFermer, false, "une étape qui laisse la séance ouverte lui laisse quelque chose à jouer");
});

// ============================================================ 3. la page (ce que le moteur garantit)

// ---- bloquant : deux réponses au premier calcul peuvent faire perdre l'étoile

test("Codex 10 — deux appareils répondent faux au MÊME premier calcul : la 2e réponse est périmée, l'étoile reste", () => {
  const depart = tenir(["A1-1"], {b: 3, e: J});
  // L'appareil A répond faux au premier calcul : le 2e attend.
  const a = retour(depart, "A1-1", false, J, {deuxieme: false});
  assert.equal(a.mouvement.secondAVenir, true);
  // L'appareil B reçoit cet état pendant que SON premier calcul est encore à l'écran, puis répond faux.
  const recu = P.recevoir(depart, a.parcours, {aujourdhui: J}).parcours;
  const b = retour(recu, "A1-1", false, J, {deuxieme: false});
  assert.equal(b.refuse, "perime", "la réponse au premier calcul ne vaut plus : un autre appareil y a déjà répondu");
  assert.deepEqual([b.mouvement.perime, b.mouvement.secondAVenir, b.mouvement.perdue], [true, true, false], "le moteur dit qu'un 2e calcul attend");
  assert.deepEqual(b.parcours, P.normaliserParcours(recu, {aujourdhui: J}), "rien n'a changé");
  assert.equal(b.parcours.modules.A1.b[0], 3, "l'étoile est toujours là");
  // Une réponse JUSTE périmée ne compte pas non plus (elle ferait monter la boîte sans le 2e calcul).
  assert.equal(retour(recu, "A1-1", true, J, {deuxieme: false}).refuse, "perime");
  // Le 2e calcul, annoncé comme tel : faux, le retour est raté (lot P1, la règle B : elle reste et revient
  // demain) ; juste, c'était un accident.
  assert.deepEqual([retour(recu, "A1-1", false, J, {deuxieme: true}).mouvement.rate, retour(recu, "A1-1", false, J, {deuxieme: true}).mouvement.perdue], [true, false]);
  assert.equal(retour(recu, "A1-1", true, J, {deuxieme: true}).mouvement.accident, true);
  // Une réponse annoncée « 2e calcul » alors que rien n'attend : périmée, elle aussi.
  assert.equal(retour(depart, "A1-1", false, J, {deuxieme: true}).refuse, "perime");
  // Sans annonce (un appelant d'avant), le moteur fait comme avant.
  assert.equal(retour(recu, "A1-1", false, J).mouvement.rate, true);
  // Le 2e calcul qui attend dit le jour où le premier a été posé : la page retrouve ce premier calcul et en pose un autre.
  const tire = P.tirerCalculsDuJour(a.parcours, CARTE, {aujourdhui: plus(1)});
  // (Lot P1 : `sorte`, celle du premier calcul — 0 ici, l'appelant ne l'a pas donnée.)
  assert.deepEqual(tire, [{module: "A1", niveau: 1, du: true, second: true, premierLe: J, premierRetour: false, sorte: 0}]);
  // Ce jour suit l'étoile d'un appareil à l'autre, et s'efface quand le retour est réglé.
  assert.equal(recu.modules.A1.q[0], J);
  assert.equal(retour(recu, "A1-1", true, J, {deuxieme: true}).parcours.modules.A1.q[0], null);
  // Pour chacune des 132 étoiles : le premier calcul du jour (celui que la page pose, d'après le jour et le code), puis
  // 60 tirages du 2e calcul — jamais le même. (Sans l'exclusion, il revenait jusqu'à 18 fois sur 400 selon l'étoile.)
  // (Lot P1 : la page tire le 2e calcul DE LA MÊME SORTE — `memeSorte` ; jamais le même calcul non plus.)
  const jour = "2026-11-25";
  const tour = Math.round(Date.parse(`${jour}T12:00:00Z`) / 86400000);
  let sansExclusion = 0;
  CARTE.ordre.forEach(k => {
    const rang = P.rangDe(de(k).module, de(k).niveau);
    const premier = CORE.genererUn(k, (CORE.graineDe(`${jour}:7K3M9P`) + rang * 977) >>> 0, {tour: tour + rang});
    assert.ok(premier, k);
    for (let graine = 1; graine <= 60; graine += 1) {
      const g = Math.imul(graine, 2654435761) >>> 0;
      assert.notEqual(CORE.genererUn(k, g, {autreQue: premier, memeSorte: true}).texte, premier.texte, `${k} : le 2e calcul n'est jamais le premier`);
      if (CORE.genererUn(k, g).texte === premier.texte) sansExclusion += 1;
    }
  });
  assert.ok(sansExclusion > 10, "le scénario existe : tiré sans exclure le premier, le même calcul revenait");
});

// ============================================================ 4. Mon espace (ce que le moteur garantit)

test("Codex 16 — un jour d'entrée sans étoile jamais tenue est écarté : pas de « +1 étoile cette semaine » fictif", () => {
  const jeudi = plus(3);
  const liste = v => Array.from({length: P.NIVEAUX.A1}, () => v);
  const brut = {version: 12, modules: {A1: {vu: jeudi, b: liste(0), e: liste(null), a: liste(0), x: liste(0), r: liste(0), q: liste(null), pe: liste(0),
    d: [jeudi, null, null], s: [jeudi, null, null], ar: liste(0), g: liste(0), c: {}}}};
  const entrees = (p, jour = plus(4)) => P.resumeProf(p, CARTE, jour).modules.find(m => m.id === "A1").entrees;
  assert.deepEqual(entrees(brut), [null, null, null], "aucune étoile tenue, aucune perte : ce jour d'entrée ne compte pas");
  assert.equal(P.carteEleve(brut, CARTE, {aujourdhui: plus(4)}).etoiles, 0);
  assert.equal(P.etatEtoile(brut, CARTE, "A1", 1, {aujourdhui: plus(4)}).aRegagner, false, "ni « Tu l'avais gagnée »");
  // Une étoile réellement gagnée puis perdue garde son jour d'entrée (et « Regagne ton étoile »).
  // (Lot P1 : gagnée après un « Je tente » raté la veille — elle revient le lendemain ; la règle B : ratée
  // deux jours de suite, elle part.)
  let p = tenter(tenter(P.creerParcours(), "A1-1", fausses(), plus(2)), "A1-1", justes(), jeudi);
  p = retour(retour(p, "A1-1", false, plus(4)).parcours, "A1-1", false, plus(4)).parcours;
  p = retour(retour(p, "A1-1", false, plus(5)).parcours, "A1-1", false, plus(5)).parcours;
  assert.deepEqual([p.modules.A1.b[0], p.modules.A1.pe[0]], [0, 1]);
  assert.deepEqual(entrees(p, plus(5)), [jeudi, null, null]);
  assert.equal(P.etatEtoile(p, CARTE, "A1", 1, {aujourdhui: plus(5)}).aRegagner, true);
  // Une étoile tenue aussi, bien sûr.
  assert.deepEqual(entrees(tenter(P.creerParcours(), "A1-1", justes(), jeudi)), [jeudi, null, null]);
});

// ============================================================ les lois de la fusion, avec les parts et la carte

function hasard(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Un élève joué au hasard par le moteur, `jours` jours de suite à partir de
// `debut`, depuis l'onglet `source` : des retours (le calcul annoncé), des
// « Je tente », des J'apprends finis ou arrêtés, du temps, des séances
// laissées ouvertes.
function jouer(depart, rng, debut, jours, {fort = .7, source = 0} = {}) {
  let p = depart;
  for (let n = 0; n < jours; n += 1) {
    const jour = plus(n, debut);
    if (rng() < .15) continue;
    p = P.ouvrirSeance(p, CARTE, {aujourdhui: jour, alea: rng()});
    P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(c => {
      if (rng() < .1) return;
      const r = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: rng() < fort, ms: rng() < .2 ? 7000 : 1500, deuxieme: c.second, cause: 1 + Math.floor(rng() * 14)}, {aujourdhui: jour, carte: CARTE, source});
      p = r.parcours;
      if (r.mouvement && r.mouvement.secondAVenir && rng() < .85) p = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: rng() < fort, ms: 1500, deuxieme: true}, {aujourdhui: jour, carte: CARTE, source}).parcours;
    });
    if (rng() < .8) p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
    for (let etape = 0; etape < 6 && P.seanceOuverte(p, jour); etape += 1) {
      p = P.noterTemps(p, 30 + Math.floor(rng() * 150), {source});
      const jouables = P.carteEleve(p, CARTE, {aujourdhui: jour}).etages.flatMap(e => e.lignes.flatMap(l => l.etoiles)).filter(e => e.etat === "aGagner" && !e.attend);
      if (!jouables.length) break;
      const e = jouables[Math.floor(rng() * jouables.length)];
      if (e.actions.tente && rng() < .6) {
        const reponses = Array.from({length: 6}, () => ({juste: rng() < fort + .15, ms: 1500}));
        p = P.appliquerTentative(p, {module: e.module, niveau: e.niveau, reponses, causes: {3: 1}}, o(jour, true, source)).parcours;
      } else {
        p = P.appliquerSerie(p, {module: e.module, niveau: e.niveau, genre: "apprends", reponses: rng() < .6 ? lecon() : arretee()}, o(jour, true, source)).parcours;
      }
    }
    if (P.seanceOuverte(p, jour) && rng() < .6) p = P.fermerSeance(p, CARTE, {aujourdhui: jour, force: true}).parcours;
  }
  return p;
}

test("les lois de la fusion tiennent avec les parts par onglet, la carte et des copies abîmées, sur 150 paires d'appareils jouées au hasard", () => {
  let ouvertes = 0;
  let reunies = 0;
  for (let graine = 1; graine <= 150; graine += 1) {
    const base = jouer(P.creerParcours(), hasard(graine), plus(-12), 3 + (graine % 6), {source: 1});
    let a = jouer(base, hasard(graine * 7919 + 1), plus(-4), 2 + (graine % 4), {source: 2});
    let b = jouer(base, hasard(graine * 104729 + 2), plus(-4), 2 + (graine % 3), {fort: .4, source: 3});
    // Une fois sur trois, les deux appareils ont une séance ouverte le même jour (la même, ou chacun la sienne).
    if (graine % 3 === 0) {
      if (graine % 2) a = b = P.noterTemps(P.ouvrirSeance(a, CARTE, {aujourdhui: J, alea: graine / 151}), 40, {source: 1});
      a = P.noterTemps(P.ouvrirSeance(a, CARTE, {aujourdhui: J, alea: graine / 151}), 20 + graine, {source: 2});
      b = P.noterTemps(P.ouvrirSeance(b, CARTE, {aujourdhui: J, alea: graine / 157}), 30 + graine, {source: 3});
    }
    const options = {aujourdhui: J, carte: CARTE};
    const f = (x, y) => P.fusionner(x, y, options);
    const propre = x => P.normaliserParcours(x, {aujourdhui: J});
    const ab = f(a, b);
    assert.deepEqual(f(b, a), ab, `graine ${graine} : dans les deux sens`);
    assert.deepEqual(f(a, propre(a)), propre(a), `graine ${graine} : avec soi-même`);
    assert.deepEqual(f(ab, a), ab, `graine ${graine} : la copie A qui revient`);
    assert.deepEqual(f(ab, b), ab, `graine ${graine} : la copie B qui revient`);
    assert.deepEqual(f(f(ab, a), b), ab, `graine ${graine} : les deux, encore`);
    assert.deepEqual(f(ab, base), ab, `graine ${graine} : la vieille copie commune qui revient`);
    assert.deepEqual(propre(ab), ab, "une fusion est déjà propre");
    assert.equal(P.recevoir(ab, a, options).apporte, true === (JSON.stringify(ab) !== JSON.stringify(propre(a))));
    assert.equal(P.recevoir(a, ab, options).apporte, false, `graine ${graine} : face à la fusion, la copie A n'apporte plus rien`);
    // Rien de ce qu'un appareil a fait dans les séances ne se perd : le temps de la fusion (journal et séance ouverte)
    // vaut au moins celui de chacun des deux.
    const temps = x => minutes(x) * 60 + x.seance.j[SECONDES];
    assert.ok(temps(ab) + 60 * ab.seances.length >= Math.max(temps(propre(a)), temps(propre(b))), `graine ${graine} : le temps des séances n'est pas perdu`);
    assert.ok(ab.seance.n >= Math.max(a.seance.n, b.seance.n), `graine ${graine} : les séances finies non plus`);
    assert.equal(ab.seance.j[SECONDES], ab.seance.parts.filter((_, i) => i % 11 === 5).reduce((s, v) => s + v, 0) > 5400 ? 5400 : ab.seance.parts.filter((_, i) => i % 11 === 5).reduce((s, v) => s + v, 0));
    // Une étoile tenue d'un côté et jamais tenue de l'autre reste tenue.
    P.CODES.forEach(id => {
      const [la, lb, lf] = [a.modules[id], b.modules[id], ab.modules[id]];
      if (!lf) return;
      lf.b.forEach((boite, i) => {
        const tenueA = la && la.b[i] > 0;
        const tenueB = lb && lb.b[i] > 0;
        const jamaisA = !la || (!la.b[i] && !la.pe[i]);
        const jamaisB = !lb || (!lb.b[i] && !lb.pe[i]);
        if ((tenueA && jamaisB) || (tenueB && jamaisA)) assert.ok(boite > 0, `graine ${graine}, ${id}-${i + 1} : gagnée d'un côté, jamais tenue de l'autre`);
        if (!boite && !lf.pe[i]) assert.equal(lf.d[i], null, `graine ${graine}, ${id}-${i + 1} : pas de jour d'entrée sans étoile`);
      });
    });
    // Une copie abîmée (une boîte hors bornes de chaque module) n'enlève aucune étoile à la copie valide.
    const abimee = copie(a);
    Object.keys(abimee.modules).forEach(id => { abimee.modules[id].b[0] = 99; });
    const avecAbimee = f(a, abimee);
    Object.keys(a.modules).forEach(id => assert.deepEqual(avecAbimee.modules[id].b, propre(a).modules[id].b, `graine ${graine}, ${id} : la copie abîmée n'efface rien`));
    if (P.seanceOuverte(propre(a), a.seance.jour) && P.seanceOuverte(propre(b), b.seance.jour)) {
      ouvertes += 1;
      if (a.seance.jour === b.seance.jour) reunies += 1;
    }
  }
  assert.ok(ouvertes > 40 && reunies > 40, `des séances ouvertes des deux côtés ont vraiment été fusionnées (${ouvertes}, dont ${reunies} le même jour)`);
});
