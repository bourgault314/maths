// Défi calcul, lot K1 « la carte chez l'élève » — passe 1, les données et le
// moteur (25/11/2026 ; choix de Gwenaël des 21, 22 et 25/11, conception « la
// carte et les clés », § 11 et § 12). La progression passe en version 12 :
// des étoiles (cadenas, étoile vide, étoile pleine), « Je tente » (6 calculs,
// 5 justes), un retour raté fait partir l'étoile, Mes calculs du jour par
// paquets de 10, la porte et la ceinture, « Tente toute la ceinture »,
// « Continuer », la séance au temps ; et les constats de la relecture de
// Codex du 22/11 que ce lot devait régler une fois pour toutes : B1 (une
// version plus récente n'abîme rien), B2 (la fusion étoile par étoile, ses
// trois égalités), G1, G2, G3, G5, G6, G8, G9.

import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();

const J = "2026-11-23"; // un lundi
const plus = (n, jour = J) => P.ajouterJours(jour, n);
const o = (jour = J, seance = true) => ({aujourdhui: jour, carte: CARTE, seance});
const cle = c => `${c.module}-${c.niveau}`;
const de = k => { const [module, n] = k.split("-"); return {module, niveau: Number(n)}; };
const etat = (p, k, jour = J, plusOptions = {}) => P.etatEtoile(p, CARTE, de(k).module, de(k).niveau, Object.assign({aujourdhui: jour}, plusOptions));
const justes = (n = 6) => Array.from({length: n}, () => ({juste: true, ms: 1500}));
const tenter = (p, k, reponses = justes(), jour = J, seance = false) => P.appliquerTentative(p, Object.assign(de(k), {reponses}), o(jour, seance));
const lecon = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const arretee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const apprendre = (p, k, reponses = lecon(), jour = J, seance = false) => P.appliquerSerie(p, Object.assign(de(k), {genre: "apprends", reponses}), o(jour, seance));
const retour = (p, k, juste, jour = J, plusRetour = {}) => P.appliquerRetour(p, Object.assign(de(k), {juste, ms: 1500, type: "P"}, plusRetour), {aujourdhui: jour, carte: CARTE});
const ETAGE = {};
CARTE.modules.forEach(m => m.paliers.forEach((palier, i) => { if (palier) ETAGE[`${m.id}-${i + 1}`] = palier; }));
const duEtage = n => CARTE.ordre.filter(k => ETAGE[k] === n);

// Une étoile posée à la main dans un parcours (pour préparer un état sans
// le jouer) : tenue en boîte `b`, due le jour `e`.
function poser(p, k, {b = 2, e = J, d = plus(-10), a = 1, g = 1, plusChamps = {}} = {}) {
  const {module, niveau} = de(k);
  if (!p.modules[module]) {
    const n = P.NIVEAUX[module];
    const liste = v => Array.from({length: n}, () => v);
    p.modules[module] = {vu: d, b: liste(0), e: liste(null), a: liste(0), x: liste(0), r: liste(0), q: liste(null), pe: liste(0), d: liste(null), s: liste(null), ar: liste(0), g: liste(0), c: {}};
  }
  const ligne = p.modules[module];
  Object.assign(plusChamps, {b, e, d, a, g});
  Object.keys(plusChamps).forEach(champ => { ligne[champ][niveau - 1] = plusChamps[champ]; });
  return p;
}
// Lot P1 « tout ouvert » (27/11/2026, DECISIONS § 9 à 11) : tout est ouvert
// dès le premier jour ; « Tente toute la ceinture » n'existe plus (ses tests
// sont retirés : note « tests retirés » du lot) ; une étoile gagnée du
// premier coup à « Je tente » entre en boîte 4 (de retour dans 7 jours) ;
// un retour raté = la règle B (elle reste, descend d'une boîte, revient
// demain ; ratée encore, elle part) ; la vitesse ne refuse plus une étoile ;
// la progression est en version 14. Chaque test changé le dit.
// Lot K1b « les bases en trois classes » (26/11/2026) : la carte a SIX étages
// (le CP 14 étoiles, le CE1 20, le CE2 19, le CM1 33, le CM2 43, vers la 6e
// 12) et 141 étoiles ; la progression est en version 13. Les règles de ce
// fichier n'ont pas changé : seuls les comptes (44 → 14 pour le premier
// étage, 4 → 6 étages, 29 → 37 lignes) et les numéros de version suivent.
// Ce que le lot K1b ajoute a ses fichiers : defi-calcul-lot-K1b-donnees
// (la reprise d'une version 12) et defi-calcul-lot-K1b-carte.
const tenir = (cles, options) => P.normaliserParcours(cles.reduce((p, k) => poser(p, k, options), P.creerParcours()), {aujourdhui: J});

// ------------------------------------------------------------ la table

test("la table : les 141 étoiles ont une ligne, l'étage est le palier, chaque ligne suit l'ordre de la carte", () => {
  assert.equal(CARTE.ordre.length, 141);
  const rang = new Map(CARTE.ordre.map((k, i) => [k, i]));
  const dans = CARTE.lignes.flatMap(l => l.cles);
  assert.equal(dans.length, 141);
  assert.equal(new Set(dans).size, 141, "aucune étoile dans deux lignes");
  assert.deepEqual(CARTE.ordre.filter(k => !dans.includes(k)), [], "aucune étoile sans ligne");
  assert.equal(CARTE.lignes.length, 37);
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(n => CARTE.lignes.filter(l => l.etage === n).length), [4, 7, 6, 8, 9, 3]);
  CARTE.lignes.forEach(l => {
    assert.ok(l.nom.length > 3, "une ligne a un nom d'élève");
    assert.ok(l.cles.length >= 2 && l.cles.length <= 6, `${l.nom} : 2 à 6 étoiles`);
    l.cles.forEach((k, i) => {
      assert.equal(ETAGE[k], l.etage, `${k} est à l'étage de sa ligne`);
      if (i) assert.ok(rang.get(l.cles[i - 1]) < rang.get(k), `${l.nom} : ${k} après ${l.cles[i - 1]}`);
      assert.equal(CORE.niveauDe(k).niveau.ligne, l.nom, `${k} porte le nom de sa ligne`);
    });
  });
});

test("la table : aucun lien « d'abord » ne remonte l'ordre de la carte ni ne sort de l'étage", () => {
  const rang = new Map(CARTE.ordre.map((k, i) => [k, i]));
  assert.equal(Object.keys(CARTE.dabord).length, 11);
  Object.entries(CARTE.dabord).forEach(([k, avant]) => {
    assert.ok(rang.has(k) && rang.has(avant), `${k} → ${avant} : deux étoiles de la carte`);
    assert.equal(ETAGE[k], ETAGE[avant], `${k} → ${avant} : même étage`);
    assert.ok(rang.get(avant) < rang.get(k), `${k} → ${avant} : l'étoile d'abord est avant dans la carte`);
    const ligne = CARTE.lignes.find(l => l.cles.includes(k));
    assert.ok(!ligne.cles.includes(avant), `${k} → ${avant} : un lien relie deux lignes`);
  });
  const neuf = P.creerParcours();
  assert.equal(etat(neuf, "A10-2").etat, "fermee");
  const p = tenir(["A10-1"]);
  assert.deepEqual([etat(p, "A10-2").etat, etat(p, "A10-2").dabord], ["fermee", "A2-1"], "l'étoile d'avant gagnée, il reste le lien : « Fermée. D'abord : … »");
  assert.equal(etat(tenir(["A10-1", "A2-1"]), "A10-2").etat, "aGagner");
});

test("« Je tente » : 6 calculs, au moins un de chaque sorte, du plus simple au plus dur, jamais deux fois le même", () => {
  assert.deepEqual(CORE.TENTATIVE, {calculs: 6, justes: 5});
  for (const k of CARTE.ordre) {
    for (const graine of [1, 7, 42]) {
      const serie = CORE.genererTentative(k, {graine});
      assert.equal(serie.length, 6, `${k} : 6 calculs`);
      assert.equal(new Set(serie.map(c => c.texte)).size, 6, `${k} : pas de doublon`);
      CORE.sortesDe(k).forEach(sorte => assert.ok(serie.some(c => c.sorte === sorte.n), `${k} : la sorte « ${sorte.nom} » y est`));
      for (let i = 1; i < 6; i += 1) assert.ok(CORE.difficulte(serie[i]) >= CORE.difficulte(serie[i - 1]), `${k} : du plus simple au plus dur`);
      assert.deepEqual(CORE.genererTentative(k, {graine}).map(c => c.texte), serie.map(c => c.texte), "la même graine rend la même série");
    }
  }
  assert.deepEqual(CORE.genererTentative("X1-1"), [], "un module réservé n'a pas de « Je tente »");
});

// ------------------------------------------------------------ les états

test("un élève neuf : la première étoile de chaque ligne est à gagner (sauf lien « d'abord »), les autres fermées — à tous les étages (lot P1 : tout est ouvert)", () => {
  const carte = P.carteEleve(P.creerParcours(), CARTE, {aujourdhui: J});
  assert.deepEqual(carte.etages.map(e => [e.etage, e.ouvert, e.total, e.etoiles, e.quarts]), [[1, true, 14, 0, 0], [2, true, 20, 0, 0], [3, true, 19, 0, 0], [4, true, 33, 0, 0], [5, true, 43, 0, 0], [6, true, 12, 0, 0]]);
  assert.ok(carte.etages.every(e => e.test === undefined), "plus de « Tente toute la ceinture »");
  assert.equal(carte.courant, 1);
  carte.etages.forEach(etage => etage.lignes.forEach(l => l.etoiles.forEach((e, i) => {
    const lien = CARTE.dabord[e.cle];
    assert.equal(e.etat, i === 0 && !lien ? "aGagner" : "fermee", `${e.cle}`);
    if (i) assert.equal(e.dabord, l.etoiles[i - 1].cle, `${e.cle} : fermée par celle d'avant`);
    else if (lien) assert.equal(e.dabord, lien);
    if (e.etat === "aGagner") assert.deepEqual(e.actions, {tente: true, apprends: true, entraine: false});
    else assert.deepEqual(e.actions, {tente: false, apprends: false, entraine: false});
  })));
});

test("une étoile fermée ne se joue pas : ni « Je tente », ni J'apprends — rien ne change", () => {
  const p = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: .5});
  const avant = JSON.stringify(p);
  // (Lot P1 : tout est ouvert — une étoile fermée l'est par celle d'avant dans sa ligne, ou par un
  // lien « d'abord » : A10-5 et A5-5 (lien) au CE1, A2-5 au CM1, F1-3 vers la 6e. A2-4 et D2-4, les
  // premières de leur ligne, sont maintenant à gagner.)
  for (const k of ["A1-2", "A10-2", "A10-5", "A5-5", "A2-5", "F1-3"]) {
    const t = tenter(p, k, justes(), J, true);
    assert.deepEqual([t.refuse, t.reussi, JSON.stringify(t.parcours)], ["fermee", false, avant], `« Je tente » ${k}`);
    const a = apprendre(p, k, lecon(), J, true);
    assert.deepEqual([a.refuse, a.verdict, JSON.stringify(a.parcours)], ["fermee", null, avant], `J'apprends ${k}`);
  }
  assert.equal(tenter(p, "X1-1").refuse, "inconnue");
  assert.equal(retour(p, "A1-1", true).refuse, "pasGagnee", "un retour sur une étoile pas gagnée ne fait rien");
  assert.equal(P.appliquerSerie(p, {module: "A1", niveau: 1, genre: "encore", reponses: lecon()}, o()).refuse, "pasGagnee", "« Je m'entraîne encore » : sur une étoile gagnée seulement");
});

// ------------------------------------------------------------ « Je tente »

test("« Je tente » : 5 justes sur 6, l'étoile est gagnée tout de suite ; du premier coup, en boîte 4, elle revient dans 7 jours (lot P1) ; la suivante s'ouvre", () => {
  assert.deepEqual(P.SEUILS.tente, {calculs: 6, justes: 5, fauxPermis: 1, essais: 2, lentMs: 5000});
  const cinq = [...justes(3), {juste: false}, ...justes(2)];
  const r = tenter(P.creerParcours(), "A1-1", cinq);
  assert.deepEqual([r.reussi, r.justes, r.faux, r.total], [true, 5, 1, 6]);
  assert.deepEqual(r.evenements, [{type: "gagnee", module: "A1", niveau: 1, par: "tente", duPremierCoup: true, retour: plus(7)}]);
  const e = etat(r.parcours, "A1-1");
  assert.deepEqual([e.etat, e.boite, e.due, e.premierRetour], ["gagnee", 4, false, true]);
  assert.deepEqual(e.actions, {tente: false, apprends: false, entraine: true});
  assert.equal(r.parcours.modules.A1.e[0], plus(7), "du premier coup : elle revient dans 7 jours (lot P1)");
  assert.equal(r.parcours.modules.A1.d[0], J);
  assert.equal(etat(r.parcours, "A1-2").etat, "aGagner");
  assert.equal(tenter(r.parcours, "A1-1").refuse, "gagnee", "une étoile gagnée ne se retente pas");
  // 4 justes, 2 faux : pas gagnée.
  assert.equal(tenter(P.creerParcours(), "A1-1", [...justes(4), {juste: false}, {juste: false}]).reussi, false);
  assert.equal(tenter(P.creerParcours(), "A1-1", justes(4)).reussi, false, "4 justes ne suffisent pas");
});

test("« Je tente » raté : fermé sur cette étoile jusqu'au lendemain ; raté deux fois : fermé pour de bon, J'apprends seulement, jusqu'à ce qu'elle soit gagnée", () => {
  const rate = [{juste: true}, {juste: false}, {juste: false}];
  let r = tenter(P.creerParcours(), "A1-1", rate);
  assert.deepEqual(r.evenements, [{type: "tenteRate", module: "A1", niveau: 1, ferme: false}]);
  let p = r.parcours;
  assert.deepEqual([etat(p, "A1-1").etat, etat(p, "A1-1").tente], ["aGagner", "aujourdhui"]);
  assert.deepEqual(etat(p, "A1-1").actions, {tente: false, apprends: true, entraine: false});
  const avant = JSON.stringify(p);
  r = tenter(p, "A1-1");
  assert.deepEqual([r.refuse, JSON.stringify(r.parcours)], ["tente", avant], "retenté le jour même : refusé, rien ne change");
  assert.equal(etat(p, "A10-1").actions.tente, true, "les autres étoiles ne sont pas touchées");
  assert.equal(P.continuer(p, CARTE, {aujourdhui: J}).action, "apprends", "« Continuer » propose J'apprends sur elle");
  // Le lendemain : permis de nouveau.
  assert.deepEqual([etat(p, "A1-1", plus(1)).tente, etat(p, "A1-1", plus(1)).actions.tente], ["", true]);
  p = tenter(p, "A1-1", rate, plus(1)).parcours;
  assert.deepEqual([etat(p, "A1-1", plus(1)).tente, etat(p, "A1-1", plus(9)).tente], ["ferme", "ferme"], "deux ratés : fermé pour de bon");
  assert.equal(tenter(p, "A1-1", justes(), plus(9)).refuse, "tente");
  // J'apprends la donne ; les essais repartent de zéro.
  r = apprendre(p, "A1-1", lecon(), plus(9));
  assert.equal(r.verdict.reussi, true);
  assert.deepEqual([r.parcours.modules.A1.b[0], r.parcours.modules.A1.r[0], r.parcours.modules.A1.q[0], r.parcours.modules.A1.a[0]], [2, 0, null, 1]);
});

test("« Je tente » d'un niveau « par cœur » : la vitesse ne refuse plus une étoile (lot P1) — les réponses lentes sont comptées à part", () => {
  assert.equal(P.typeDe(CARTE, "A1", 1), "F");
  const lent = {juste: true, ms: 6000};
  const vite = {juste: true, ms: 1500};
  assert.equal(tenter(P.creerParcours(), "A1-1", [lent, vite, lent, vite, lent, vite]).reussi, true, "lent une fois sur deux : rien");
  // (Lot P1 : avant, juste mais lent deux fois de suite comptait faux — six réponses justes pouvaient rater
  // le test alors que l'écran dit « 5 justes ».)
  const r = tenter(P.creerParcours(), "A1-1", [lent, lent, vite, vite, vite, vite]);
  assert.deepEqual([r.reussi, r.justes, r.faux, r.lents], [true, 6, 0, 2]);
  assert.equal(tenter(P.creerParcours(), "A1-1", [lent, lent, lent, lent, vite, vite]).reussi, true, "quatre lents : toujours 6 justes");
  assert.equal(P.typeDe(CARTE, "A10", 1), "P");
  assert.equal(tenter(P.creerParcours(), "A10-1", [lent, lent, lent, lent, lent, lent]).reussi, true, "une procédure n'a pas de règle de temps");
});

// ------------------------------------------------------------ J'apprends

test("J'apprends : le finir donne l'étoile ; arrêté, il reprend ; au 3e arrêt « à voir en classe » — la suivante de la ligne attend 7 jours, les autres lignes restent ouvertes", () => {
  let r = apprendre(P.creerParcours(), "A1-1");
  assert.deepEqual(r.evenements, [{type: "gagnee", module: "A1", niveau: 1, par: "apprends"}]);
  assert.deepEqual([r.parcours.modules.A1.b[0], r.parcours.modules.A1.e[0], r.parcours.modules.A1.a[0]], [2, plus(1), 1]);
  assert.equal(etat(r.parcours, "A1-1").premierRetour, false, "sa leçon est faite : pas d'exemple résolu à son retour");
  // Trois arrêts.
  let p = P.creerParcours();
  r = apprendre(p, "A1-1", arretee());
  assert.equal(r.verdict.reussi, false);
  assert.deepEqual(r.evenements.map(e => [e.type, e.arrets, e.aVoir]), [["arrete", 1, false]]);
  p = r.parcours;
  assert.deepEqual([etat(p, "A1-1").enCours, etat(p, "A1-1").reprise, etat(p, "A1-2").etat], [true, P.REPRISE.seul, "fermee"]);
  assert.deepEqual(P.continuer(p, CARTE, {aujourdhui: plus(1)}), {type: "etoile", module: "A1", niveau: 1, raison: "enCours", action: "apprends", depart: P.REPRISE.seul,
    etage: 1, ligne: "Jusqu’à 20", resteLigne: 3});
  p = apprendre(p, "A1-1", arretee(), plus(1)).parcours;
  r = apprendre(p, "A1-1", arretee(), plus(2));
  p = r.parcours;
  assert.deepEqual(r.evenements.map(e => [e.arrets, e.aVoir, e.retour]), [[3, true, plus(9)]]);
  const e = etat(p, "A1-1", plus(3));
  assert.deepEqual([e.etat, e.aVoir, e.attend, e.enCours], ["aGagner", true, plus(9), false]);
  assert.deepEqual(e.actions, {tente: false, apprends: false, entraine: false}, "elle ne se joue pas pendant sa semaine");
  assert.equal(tenter(p, "A1-1", justes(), plus(3)).refuse, "attend");
  assert.equal(apprendre(p, "A1-1", lecon(), plus(3)).refuse, "attend");
  assert.equal(etat(p, "A1-2", plus(3)).etat, "fermee", "la suivante de sa ligne attend avec elle");
  assert.equal(etat(p, "A10-1", plus(3)).etat, "aGagner", "les autres lignes restent ouvertes");
  assert.notEqual(P.continuer(p, CARTE, {aujourdhui: plus(3)}).module, "A1", "« Continuer » passe à la suite");
  // Au bout de 7 jours : elle se rejoue, et la suivante s'ouvre.
  assert.deepEqual([etat(p, "A1-1", plus(9)).attend, etat(p, "A1-1", plus(9)).actions.apprends, etat(p, "A1-2", plus(9)).etat], [null, true, "aGagner"]);
  // Un 4e arrêt ne referme pas la suivante.
  p = apprendre(p, "A1-1", arretee(), plus(9)).parcours;
  assert.equal(etat(p, "A1-2", plus(10)).etat, "aGagner");
});

test("« Je m'entraîne encore » : sur une étoile gagnée, aucun effet sur les boîtes", () => {
  const p = tenir(["A1-1"], {b: 3, e: plus(2)});
  const faux = Array.from({length: 20}, () => ({juste: false, outil: "image"}));
  const r = P.appliquerSerie(p, {module: "A1", niveau: 1, genre: "encore", reponses: faux}, o());
  assert.equal(r.refuse, undefined);
  assert.deepEqual(["b", "e", "x", "pe", "g"].map(c => r.parcours.modules.A1[c][0]), [3, plus(2), 0, 0, 1], "s'entraîner ne fait perdre aucune étoile");
});

// ------------------------------------------------------------ le retour

test("un retour juste : la boîte monte, 1, 3, 7, 14, 30, 60 jours ; solide en boîte 4", () => {
  let p = tenir(["A10-1"], {b: 2, e: J, a: 0});
  let jour = J;
  for (const [boite, delai] of [[3, 3], [4, 7], [5, 14], [6, 30], [7, 60], [7, 60]]) {
    const r = retour(p, "A10-1", true, jour);
    assert.deepEqual([r.mouvement.regle, r.mouvement.monte || boite === 7, r.parcours.modules.A10.b[0], r.parcours.modules.A10.e[0]], [true, true, boite, plus(delai, jour)]);
    p = r.parcours;
    jour = plus(delai, jour);
  }
  assert.equal(p.modules.A10.s[0], plus(3), "solide le jour où elle atteint la boîte 4");
  assert.equal(p.modules.A10.a[0], 1, "elle est revenue une fois");
  assert.equal(retour(p, "A10-1", true, plus(1, J)).refuse, "pasDue", "une étoile pas due ne bouge pas");
});

test("un retour : un calcul ; faux, un 2e ; le 2e juste, c'était un accident — rien ne bouge, elle revient demain", () => {
  const p = tenir(["A10-1"], {b: 4, e: J});
  let r = retour(p, "A10-1", false);
  assert.deepEqual([r.mouvement.regle, r.mouvement.secondAVenir, r.mouvement.avant, r.mouvement.apres], [false, true, 4, 4]);
  assert.deepEqual([r.parcours.modules.A10.b[0], r.parcours.modules.A10.e[0]], [4, J], "le premier faux ne change ni la boîte ni l'échéance");
  assert.deepEqual(P.deuxiemeEnAttente(r.parcours, CARTE, {aujourdhui: J}), {module: "A10", niveau: 1});
  r = retour(r.parcours, "A10-1", true);
  assert.deepEqual([r.mouvement.accident, r.mouvement.rate, r.mouvement.perdue, r.mouvement.sens], [true, false, false, "reste"]);
  assert.deepEqual([r.parcours.modules.A10.b[0], r.parcours.modules.A10.e[0], r.parcours.modules.A10.pe[0]], [4, plus(1), 0]);
  assert.equal(P.deuxiemeEnAttente(r.parcours, CARTE, {aujourdhui: J}), null);
});

test("un retour raté (les deux calculs faux) : la règle B (lot P1) — l'étoile reste, descend d'une boîte et revient demain ; ratée encore, elle part, sort des boîtes, et se regagne le jour même — rien de ce qui est ouvert ne se referme", () => {
  // (Lot P1 : `ratesDeSuite` 2 — choix de Gwenaël du 26/11, 22 h 34 ; avant, 1 : l'étoile partait au premier retour raté.)
  assert.deepEqual(P.SEUILS.retour, {ratesDeSuite: 2, perdues: 3}, "la règle B");
  let p = tenir(["A1-1", "A1-2"], {b: 5, e: J});
  p = retour(p, "A1-1", false).parcours;
  const b = retour(p, "A1-1", false);
  assert.deepEqual([b.mouvement.rate, b.mouvement.perdue, b.mouvement.apres, b.mouvement.sens], [true, false, 4, "descend"]);
  assert.deepEqual(b.evenements, []);
  assert.deepEqual([b.parcours.modules.A1.b[0], b.parcours.modules.A1.e[0], b.parcours.modules.A1.pe[0]], [4, plus(1), 0], "elle descend d'une boîte et revient demain");
  const J1 = plus(1);
  p = retour(b.parcours, "A1-1", false, J1).parcours;
  const r = retour(p, "A1-1", false, J1);
  assert.deepEqual([r.mouvement.rate, r.mouvement.perdue, r.mouvement.apres, r.mouvement.sens], [true, true, 0, "descend"]);
  assert.deepEqual(r.evenements, [{type: "perdue", module: "A1", niveau: 1, aVoir: false}]);
  p = r.parcours;
  assert.deepEqual([p.modules.A1.b[0], p.modules.A1.e[0], p.modules.A1.pe[0], p.modules.A1.d[0]], [0, null, 1, plus(-10)], "elle sort des boîtes ; le jour où elle a été gagnée reste");
  const e = etat(p, "A1-1", J1);
  assert.deepEqual([e.etat, e.aRegagner, e.tente], ["aGagner", true, ""]);
  assert.deepEqual(e.actions, {tente: true, apprends: true, entraine: false}, "« Je tente » le jour même, ou J'apprends");
  assert.equal(etat(p, "A1-2", J1).etat, "gagnee");
  assert.equal(etat(p, "A1-3", J1).etat, "aGagner", "la suivante de la ligne reste ouverte");
  assert.equal(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J1}).some(c => cle(c) === "A1-1"), false, "elle ne revient plus dans Mes calculs du jour");
  assert.deepEqual(P.continuer(tenir([], {}), CARTE, {aujourdhui: J}).raison, "suivante");
  const c = P.continuer(retour(p, "A1-2", true, J1).parcours, CARTE, {aujourdhui: J1});
  assert.deepEqual([c.type, cle(c), c.raison, c.action], ["etoile", "A1-1", "aRegagner", "tente"], "« Continuer » la propose d'abord");
  // Regagnée : elle rentre au début des boîtes (perdue un jour : pas « du premier coup ») et revient le lendemain.
  const g = tenter(p, "A1-1", justes(), J1);
  assert.deepEqual([g.reussi, g.parcours.modules.A1.b[0], g.parcours.modules.A1.e[0], g.parcours.modules.A1.d[0], g.parcours.modules.A1.pe[0]], [true, 2, plus(2), plus(-10), 1]);
  assert.equal(etat(g.parcours, "A1-1", J1).premierRetour, false, "déjà revenue : plus d'exemple résolu");
});

test("un niveau « par cœur » : une réponse juste mais lente ne fait jamais perdre l'étoile — elle ne monte pas et revient demain", () => {
  let p = tenir(["A1-1"], {b: 3, e: J});
  for (let n = 0; n < 4; n += 1) {
    const jour = plus(n);
    const r = retour(p, "A1-1", true, jour, {ms: 7000, type: "F"});
    assert.deepEqual([r.mouvement.lent, r.mouvement.monte, r.mouvement.rate, r.parcours.modules.A1.b[0], r.parcours.modules.A1.e[0]], [true, false, false, 3, plus(1, jour)]);
    p = r.parcours;
  }
  assert.equal(retour(p, "A1-1", true, plus(4), {ms: 1000, type: "F"}).parcours.modules.A1.b[0], 4, "juste et rapide : elle monte");
});

test("la même étoile perdue trois fois : « à voir en classe » — signalée, elle se regagne toujours et ne bloque pas la porte", () => {
  // (Lot P1, la règle B : perdue = deux retours ratés de suite, un jour puis le lendemain.)
  let p = tenir(["A1-1"], {b: 2, e: J});
  let jour = J;
  for (let n = 1; n <= 3; n += 1) {
    if (n > 1) { p = tenter(p, "A1-1", justes(), jour).parcours; jour = plus(1, jour); }
    p = retour(retour(p, "A1-1", false, jour).parcours, "A1-1", false, jour).parcours;
    jour = plus(1, jour);
    p = retour(p, "A1-1", false, jour).parcours;
    const r = retour(p, "A1-1", false, jour);
    assert.deepEqual(r.evenements, [{type: "perdue", module: "A1", niveau: 1, aVoir: n === 3}]);
    p = r.parcours;
  }
  const e = etat(p, "A1-1", jour);
  assert.deepEqual([e.etat, e.aVoir, e.aRegagner, e.attend, e.actions.tente], ["aGagner", true, true, null, true]);
  assert.equal(P.etatCompetence(p.modules.A1, 0), "classe");
  const regagnee = tenter(p, "A1-1", justes(), jour).parcours;
  assert.equal(P.etatCompetence(regagnee.modules.A1, 0), "classe", "regagnée, elle reste signalée au professeur tant qu'elle n'est pas solide");
});

test("G2 — le 2e calcul n'est jamais perdu : la page fermée entre les deux, il est reposé, même seul, même le lendemain, même sur un autre appareil", () => {
  const depart = tenir(["A10-1"], {b: 3, e: J});
  let p = P.ouvrirSeance(depart, CARTE, {aujourdhui: J, alea: .3});
  assert.equal(P.etatSeance(p, CARTE, {aujourdhui: J}).obligatoire, 1);
  p = retour(p, "A10-1", false).parcours;
  // La page est fermée et rouverte : le parcours est relu tel qu'enregistré.
  p = P.normaliserParcours(JSON.parse(JSON.stringify(p)), {aujourdhui: J});
  const etatS = P.etatSeance(p, CARTE, {aujourdhui: J});
  assert.deepEqual([etatS.obligatoire, etatS.continuer], [1, {type: "paquet", calculs: 1, raison: "obligatoire"}], "Mes calculs du jour sont toujours là, pour ce seul calcul");
  // (Correctif K1 : `premierLe`, le jour où le premier calcul a été posé — la page en repose un AUTRE.)
  // (Lot P1 : `sorte`, celle du premier calcul — 0 ici, l'appelant ne l'a pas donnée.)
  assert.deepEqual(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J}), [{module: "A10", niveau: 1, du: true, second: true, premierLe: J, premierRetour: false, sorte: 0}]);
  // Le lendemain, sans y être revenu : c'est encore son 2e calcul.
  assert.deepEqual(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: plus(1)}).map(c => c.second), [true]);
  // Sur un autre appareil, qui avait la copie d'avant le faux.
  for (const fusion of [P.fusionner(p, depart, {aujourdhui: J}), P.fusionner(depart, p, {aujourdhui: J})]) {
    assert.deepEqual(P.deuxiemeEnAttente(fusion, CARTE, {aujourdhui: J}), {module: "A10", niveau: 1}, "la copie d'avant le faux ne l'efface pas");
  }
  // Avec d'autres étoiles dues : le 2e calcul passe en premier.
  const deux = retour(tenir(["A1-1", "A10-1"], {b: 3, e: plus(-2)}), "A10-1", false).parcours;
  assert.deepEqual(P.tirerCalculsDuJour(deux, CARTE, {aujourdhui: J}).map(c => [cle(c), c.second]), [["A10-1", true], ["A1-1", false]]);
});

// ------------------------------------------------------------ les paquets

test("Mes calculs du jour par paquets de 10 : les plus anciennes d'abord, « encore N », ce qui n'est pas fait reste dû", () => {
  assert.deepEqual(P.SEUILS.jour, {paquet: 10, retard: 3, lentMs: 5000});
  // (Lot K1b : le premier étage n'a plus que 14 étoiles — 25 étoiles tenues, sur le CP et le CE1.)
  const cles = [...duEtage(1), ...duEtage(2)].slice(0, 25);
  let p = P.creerParcours();
  cles.forEach((k, i) => poser(p, k, {b: 2 + (i % 3), e: plus(-(i % 4))}));
  p = P.normaliserParcours(p, {aujourdhui: J});
  let s = P.etatSeance(p, CARTE, {aujourdhui: J});
  assert.deepEqual([s.ouverte, s.obligatoire, s.encore], [false, 10, 15], "avant « Commencer » : « Avant : tes 10 calculs du jour. »");
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: J, alea: .2});
  const paquet = P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J});
  assert.equal(paquet.length, 10);
  const echeances = paquet.map(c => p.modules[c.module].e[c.niveau - 1]);
  assert.deepEqual(echeances, [...echeances].sort(), "les plus anciennes d'abord");
  assert.ok(echeances.every(e => e <= plus(-2)), "les 10 plus en retard");
  // Trois calculs, puis la page est fermée : il reste 7 du paquet obligé.
  paquet.slice(0, 3).forEach(c => { p = retour(p, cle(c), true).parcours; });
  s = P.etatSeance(P.normaliserParcours(JSON.parse(JSON.stringify(p))), CARTE, {aujourdhui: J});
  assert.deepEqual([s.obligatoire, s.paquet, s.encore, s.continuer.raison], [7, 7, 15, "obligatoire"]);
  assert.equal(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J}).length, 7, "le paquet ne se regonfle pas");
  paquet.slice(3).forEach(c => { p = retour(p, cle(c), true).parcours; });
  let fin = P.terminerCalculsDuJour(p, {aujourdhui: J, carte: CARTE});
  assert.deepEqual([fin.finie, fin.encore], [false, 15]);
  p = fin.parcours;
  s = P.etatSeance(p, CARTE, {aujourdhui: J});
  assert.deepEqual([s.obligatoire, s.paquet, s.encore], [0, 0, 15], "le premier paquet fait, la carte ; le bouton dit « encore 15 »");
  // « Mes calculs du jour : encore 15 » : un paquet de 10, pas obligé.
  p = P.commencerPaquet(p, CARTE, {aujourdhui: J});
  s = P.etatSeance(p, CARTE, {aujourdhui: J});
  assert.deepEqual([s.obligatoire, s.paquet, s.encore, s.continuer], [0, 10, 5, {type: "paquet", calculs: 10, raison: "encours"}]);
  P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J}).forEach(c => { p = retour(p, cle(c), true).parcours; });
  p = P.terminerCalculsDuJour(p, {aujourdhui: J, carte: CARTE}).parcours;
  // Les 5 dernières ne sont pas faites : elles restent dues demain.
  assert.equal(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: plus(1), maximum: 999}).filter(c => p.modules[c.module].e[c.niveau - 1] <= J).length, 5);
});

test("une 2e séance le même jour ne refait pas Mes calculs du jour ; « Continuer » propose le paquet suivant dès 3 jours de retard", () => {
  let p = tenir(duEtage(1).slice(0, 14), {b: 3, e: J});
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: J, alea: .2});
  P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J}).forEach(c => { p = retour(p, cle(c), true).parcours; });
  p = P.terminerCalculsDuJour(p, {aujourdhui: J, carte: CARTE}).parcours;
  p = P.fermerSeance(p, CARTE, {aujourdhui: J, force: true}).parcours;
  assert.equal(p.seances.length, 1);
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: J, alea: .6});
  let s = P.etatSeance(p, CARTE, {aujourdhui: J});
  assert.deepEqual([s.finies, s.obligatoire, s.encore, s.continuer.type], [1, 0, 4, "etoile"], "pas de paquet obligé à la 2e séance : la carte, et le bouton « encore 4 »");
  // Quatorze étoiles en retard de 3 jours : le paquet obligé, puis
  // « Continuer » propose le reste avant une nouvelle étoile.
  const tard = plus(5);
  p = tenir(duEtage(1).slice(0, 14), {b: 3, e: plus(2)});
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: tard, alea: .7});
  s = P.etatSeance(p, CARTE, {aujourdhui: tard});
  assert.deepEqual([s.obligatoire, s.encore, s.continuer.raison], [10, 4, "obligatoire"]);
  P.tirerCalculsDuJour(p, CARTE, {aujourdhui: tard}).forEach(c => { p = retour(p, cle(c), true, tard).parcours; });
  p = P.terminerCalculsDuJour(p, {aujourdhui: tard, carte: CARTE}).parcours;
  assert.equal(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: tard, maximum: 999}).length, 4);
  assert.deepEqual(P.continuer(p, CARTE, {aujourdhui: tard}), {type: "paquet", calculs: 4, raison: "retard"}, "3 jours de retard : le paquet passe avant une nouvelle étoile");
  // Deux jours de retard seulement : après le paquet obligé, la carte d'abord.
  let q = P.ouvrirSeance(tenir(duEtage(1).slice(0, 14), {b: 3, e: plus(3)}), CARTE, {aujourdhui: tard, alea: .7});
  P.tirerCalculsDuJour(q, CARTE, {aujourdhui: tard}).forEach(c => { q = retour(q, cle(c), true, tard).parcours; });
  q = P.terminerCalculsDuJour(q, {aujourdhui: tard, carte: CARTE}).parcours;
  assert.deepEqual([P.etatSeance(q, CARTE, {aujourdhui: tard}).encore, P.continuer(q, CARTE, {aujourdhui: tard}).type], [4, "etoile"]);
  assert.equal(P.continuer(p, CARTE, {aujourdhui: tard, sansPaquet: true}).type, "etoile", "le but du jour reste une étoile");
});

// ------------------------------------------------------------ la porte, la ceinture

test("la porte et la ceinture : toutes les étoiles de l'étage ; la ceinture se remplit quart par quart, « 6 étoiles sur 14 »", () => {
  const bases = duEtage(1);
  assert.equal(bases.length, 14, "lot K1b : le CP");
  assert.deepEqual(P.SEUILS.ceintures, {nombre: 6, quarts: 4, barrettes: 3});
  for (const [n, quarts] of [[0, 0], [3, 0], [4, 1], [6, 1], [7, 2], [10, 2], [11, 3], [13, 3]]) {
    const c = P.etatCeintures(tenir(bases.slice(0, n)), CARTE);
    assert.deepEqual([c.porte, c.prochaine, c.etoiles, c.total, c.quarts], [0, 1, n, 14, quarts], `${n} étoiles`);
  }
  // Les mêmes seuils sur un étage de 43 étoiles (le CM2) : 10, 11, 21, 22, 32, 33, 42.
  const cm2 = duEtage(5);
  for (const [n, quarts] of [[10, 0], [11, 1], [21, 1], [22, 2], [32, 2], [33, 3], [42, 3]]) {
    const q = tenir(cm2.slice(0, n));
    q.ceintures = [J, J, J, J, null, null];
    const c = P.etatCeintures(P.normaliserParcours(q, {aujourdhui: J}), CARTE);
    assert.deepEqual([c.porte, c.prochaine, c.etoiles, c.total, c.quarts], [4, 5, n, 43, quarts], `CM2 : ${n} étoiles`);
  }
  // La 14e : la ceinture blanche-jaune. (Lot P1 : l'étage 2 était déjà ouvert — tout est ouvert.)
  let p = tenir(bases.slice(0, 13));
  assert.equal(P.carteEleve(p, CARTE, {aujourdhui: J}).etages[1].ouvert, true);
  const derniere = bases[13];
  assert.equal(etat(p, derniere).etat, "aGagner");
  const r = tenter(p, derniere);
  assert.deepEqual(r.ceintures, [1]);
  p = r.parcours;
  assert.deepEqual(p.ceintures, [J, null, null, null, null, null]);
  const carte = P.carteEleve(p, CARTE, {aujourdhui: J});
  assert.deepEqual(carte.etages.map(e => [e.ouvert, e.quarts]), [[true, 4], [true, 0], [true, 0], [true, 0], [true, 0], [true, 0]]);
  assert.deepEqual([carte.courant, P.etatCeintures(p, CARTE).porte, P.etatCeintures(p, CARTE).prochaine], [2, 1, 2]);
});

test("une ceinture gagnée ne se reprend jamais, la porte ne se referme pas ; une ceinture pas encore gagnée attend l'étoile perdue", () => {
  const bases = duEtage(1);
  let p = tenir(bases, {b: 3, e: J});
  p.ceintures[0] = plus(-3);
  // (Lot P1, la règle B : perdue au 2e retour raté de suite, le lendemain.)
  p = retour(retour(p, bases[5], false).parcours, bases[5], false).parcours;
  p = retour(retour(p, bases[5], false, plus(1)).parcours, bases[5], false, plus(1)).parcours;
  assert.equal(etat(p, bases[5], plus(1)).aRegagner, true);
  assert.deepEqual(p.ceintures, [plus(-3), null, null, null, null, null], "la première ceinture reste");
  const carte = P.carteEleve(p, CARTE, {aujourdhui: plus(1)});
  assert.deepEqual([carte.etages[0].etoiles, carte.etages[0].quarts, carte.etages[1].ouvert], [13, 4, true], "l'étage 2 reste ouvert");
  // Sans la ceinture : la porte était ouverte (toutes gagnées un jour), elle
  // le reste ; la ceinture, elle, attend que tout soit tenu en même temps.
  let q = tenir(bases.slice(0, 13), {b: 3, e: plus(5)});
  poser(q, bases[13], {b: 0, e: null, d: plus(-4), plusChamps: {pe: 1}});
  q = P.normaliserParcours(q, {aujourdhui: J});
  assert.equal(P.carteEleve(q, CARTE, {aujourdhui: J}).etages[1].ouvert, true, "gagnée un jour : la porte est ouverte");
  assert.deepEqual(q.ceintures, [null, null, null, null, null, null]);
  const deuxieme = duEtage(2)[0];
  const r = tenter(q, deuxieme);
  assert.deepEqual([r.reussi, r.ceintures], [true, []], "il avance à l'étage 2 ; pas encore de ceinture");
  assert.deepEqual(tenter(r.parcours, bases[13]).ceintures, [1], "l'étoile regagnée : la ceinture");
});

test("l'étoile « à voir en classe » ne bloque pas la porte mais retient la ceinture", () => {
  const bases = duEtage(1);
  let p = tenir(bases.slice(0, 13), {b: 3, e: plus(5)});
  const derniere = bases[13];
  for (let n = 0; n < 3; n += 1) p = apprendre(p, derniere, arretee(), plus(n)).parcours;
  const jour = plus(3);
  assert.deepEqual([etat(p, derniere, jour).aVoir, etat(p, derniere, jour).attend], [true, plus(9)]);
  const carte = P.carteEleve(p, CARTE, {aujourdhui: jour});
  assert.deepEqual([carte.etages[0].etoiles, carte.etages[0].ceinture, carte.etages[0].quarts, carte.etages[1].ouvert], [13, null, 3, true]);
  assert.deepEqual(p.ceintures, [null, null, null, null, null, null], "la ceinture attend la dernière étoile");
  const c = P.continuer(p, CARTE, {aujourdhui: jour});
  assert.deepEqual([c.type, ETAGE[cle(c)]], ["etoile", 2], "« Continuer » l'emmène à l'étage suivant");
  // Deux arrêts seulement : la ceinture attend. (Lot P1 : l'étage 2 est ouvert de toute façon — tout est ouvert.)
  let q = tenir(bases.slice(0, 13), {b: 3, e: plus(5)});
  for (let n = 0; n < 2; n += 1) q = apprendre(q, derniere, arretee(), plus(n)).parcours;
  assert.equal(P.carteEleve(q, CARTE, {aujourdhui: jour}).etages[1].ouvert, true);
  assert.equal(P.carteEleve(q, CARTE, {aujourdhui: jour}).etages[0].ceinture, null);
});

test("le réglage du professeur : rien au-delà ; une étoile gagnée au-dessus garde son étoile mais ne revient pas (G8)", () => {
  const bases = duEtage(1);
  const cm1 = duEtage(2);
  let p = tenir([...bases, ...cm1.slice(0, 3)], {b: 3, e: J});
  p.ceintures[0] = plus(-3);
  const regle = {aujourdhui: J, palier: 1};
  const carte = P.carteEleve(p, CARTE, regle);
  assert.deepEqual(carte.etages.map(e => e.etage), [1], "l'étage 2 n'est pas montré");
  assert.equal(P.tirerCalculsDuJour(p, CARTE, Object.assign({maximum: 999}, regle)).length, 14, "seules les étoiles du réglage reviennent");
  assert.equal(P.tirerCalculsDuJour(p, CARTE, {aujourdhui: J, maximum: 999}).length, 17);
  assert.equal(p.modules[de(cm1[0]).module].b[de(cm1[0]).niveau - 1], 3, "elle garde son étoile");
  assert.equal(tenter(p, cm1[3], justes(), J, false).reussi, true);
  assert.equal(P.appliquerTentative(p, Object.assign(de(cm1[3]), {reponses: justes()}), {aujourdhui: J, carte: CARTE, palier: 1}).refuse, "fermee", "au-dessus du réglage : fermé");
  assert.equal(P.continuer(tenir(bases, {b: 3, e: plus(4)}), CARTE, regle).type, "rien");
  // Jamais de ceinture au-delà du réglage.
  const tout = tenir([...bases, ...cm1], {b: 3, e: plus(4)});
  const r = P.appliquerSerie(tout, Object.assign(de(bases[0]), {genre: "encore", reponses: lecon()}), {aujourdhui: J, carte: CARTE, palier: 1});
  assert.deepEqual(r.ceintures, [1]);
  assert.deepEqual(P.appliquerSerie(r.parcours, Object.assign(de(bases[0]), {genre: "encore", reponses: lecon()}), {aujourdhui: J, carte: CARTE, palier: 2}).ceintures, [2], "le réglage remonté : la ceinture suivante vient");
});

test("G9 — un changement de carte ne fait jamais reculer la ceinture qui se remplit (les trois seuils de Codex)", () => {
  // Une carte « d'avant » : les mêmes étoiles, moins trois au premier étage
  // (11 au lieu de 14 — au lot K1 : 41 au lieu de 44, comme avant le lot C2).
  const retirees = ["M1-2", "M1-4", "A5-1"];
  const avant = Object.assign({}, CARTE, {ordre: CARTE.ordre.filter(k => !retirees.includes(k))});
  const garde = duEtage(1).filter(k => !retirees.includes(k));
  assert.equal(garde.length, 11);
  const p = tenir(garde.slice(0, 6));
  assert.equal(P.etatCeintures(p, avant).quarts, 2, "6 sur 11 : deux quarts");
  assert.equal(P.etatCeintures(p, CARTE).quarts, 1, "sans rien garder, 6 sur 14 n'en ferait qu'un");
  const repris = P.garderRemplissage(p, avant, {aujourdhui: J});
  assert.deepEqual(repris.quarts, [2, 0, 0, 0, 0, 0]);
  assert.deepEqual([P.etatCeintures(repris, CARTE).quarts, P.etatCeintures(repris, CARTE).etoiles, P.etatCeintures(repris, CARTE).total], [2, 6, 14], "l'écran garde ses deux quarts ; le compte dit vrai");
  assert.equal(P.carteEleve(repris, CARTE, {aujourdhui: J}).etages[0].quarts, 2);
  // Le remplissage gardé ne donne jamais la ceinture, et suit les deux appareils.
  assert.equal(P.etatCeintures(repris, CARTE).porte, 0);
  assert.deepEqual(P.fusionner(p, repris, {aujourdhui: J}).quarts, [2, 0, 0, 0, 0, 0]);
  // Une étoile perdue ne fait pas reculer sous ce qui a été gardé ; au-delà, le compte reprend la main.
  assert.equal(P.etatCeintures(tenir(garde.slice(0, 11)), CARTE).quarts, 3);
});

// ------------------------------------------------------------ « Tente toute la ceinture »
// (Lot P1 « tout ouvert », 27/11/2026 : « Tente toute la ceinture » n'existe
// plus — ses quatre tests sont retirés, nommés dans la note « tests retirés »
// du lot : les 12 calculs de chaque étage ; un faux permis et les retours
// étalés ; réussi en partie ; G1, revérifié à la remise.)

test("« Continuer » : le J'apprends commencé, puis l'étoile à regagner, puis la première étoile à gagner dans l'ordre de la carte", () => {
  assert.deepEqual(P.continuer(P.creerParcours(), CARTE, {aujourdhui: J}), {type: "etoile", module: "A1", niveau: 1, raison: "suivante", action: "tente", depart: 0, etage: 1, ligne: "Jusqu’à 20", resteLigne: 3});
  // Une étoile perdue, et un J'apprends arrêté plus loin dans la carte.
  let p = tenir(["A1-1", "A1-2", "A10-1"], {b: 3, e: plus(4)});
  poser(p, "A1-1", {b: 0, e: null, d: plus(-8), plusChamps: {pe: 1}});
  p = P.normaliserParcours(p, {aujourdhui: J});
  assert.deepEqual([cle(P.continuer(p, CARTE, {aujourdhui: J})), P.continuer(p, CARTE, {aujourdhui: J}).raison], ["A1-1", "aRegagner"]);
  p = apprendre(p, "M1-1", arretee(), J).parcours;
  const c = P.continuer(p, CARTE, {aujourdhui: plus(1)});
  assert.deepEqual([cle(c), c.raison, c.action], ["M1-1", "enCours", "apprends"]);
  // Tout est gagné, rien n'est dû.
  const tout = tenir(CARTE.ordre, {b: 5, e: plus(3)});
  // (Correctif K1 : `tempsFini` dit quand il reste des étoiles mais que plus rien ne tient dans la séance.)
  assert.deepEqual(P.continuer(tout, CARTE, {aujourdhui: J}), {type: "rien", toutGagne: true, tempsFini: false, prochainRetour: 3}, "« Tout est gagné. Tes étoiles reviennent dans 3 jours. »");
});

test("G6 — rien de ce que la séance propose n'est lu dans un plan : un plan trafiqué ne désigne aucune étoile", () => {
  const p = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: .5});
  assert.deepEqual(p.seance.p, [1, 10, 0, 0, 0]);
  const trafique = JSON.parse(JSON.stringify(p));
  trafique.seance.p = [1, 15, 1, 9, 3, 77, 201, 5, 2, 1, 1];
  const relu = P.normaliserParcours(trafique, {aujourdhui: J});
  assert.deepEqual(relu.seance.p, [1, 15, 1, 9, 3], "cinq nombres bornés, rien de plus");
  const s = P.etatSeance(relu, CARTE, {aujourdhui: J});
  assert.deepEqual([s.obligatoire, s.paquet, s.continuer], [0, 0, {type: "etoile", module: "A1", niveau: 1, raison: "suivante", action: "tente", depart: 0, etage: 1, ligne: "Jusqu’à 20", resteLigne: 3}], "un paquet annoncé sans étoile due ne vaut rien");
  assert.deepEqual(P.normaliserParcours(relu, {aujourdhui: J}), relu, "stable en une lecture");
});

test("la séance au temps : la première étape de la carte est toujours permise ; ensuite, seulement si elle tient (1 minute pour « Je tente », 4 pour J'apprends)", () => {
  let p = P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, minutes: 10, alea: .5});
  p = P.noterTemps(p, 1000);
  assert.deepEqual(["tente", "apprends", "ceinture"].map(a => P.peutCommencer(p, a, {aujourdhui: J})), [true, true, true], "rien de commencé : toujours permis");
  let r = tenter(p, "A1-1", justes(), J, true);
  assert.equal(r.finie, true, "le temps est passé : la séance finit après l'étape");
  assert.deepEqual([r.parcours.seances, r.parcours.seance.p], [[J], [0, 0, 0, 0, 0]]);
  // À 7 minutes : « Je tente » tient (8), J'apprends non (11 > 10 + 1) ; à 6 min 59 s, si.
  p = P.noterTemps(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, minutes: 10, alea: .5}), 200);
  p = tenter(p, "A1-1", justes(), J, true).parcours;
  p = P.noterTemps(p, 221);
  assert.deepEqual(["tente", "apprends"].map(a => P.peutCommencer(p, a, {aujourdhui: J})), [true, false]);
  assert.equal(P.peutCommencer(P.noterTemps(p, -1 + 0), "apprends", {aujourdhui: J}), false);
  const quinze = P.noterTemps(tenter(P.noterTemps(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, minutes: 15, alea: .5}), 200), "A1-1", justes(), J, true).parcours, 221);
  assert.equal(P.peutCommencer(quinze, "apprends", {aujourdhui: J}), true, "15 minutes : il tient");
  // Il reste moins d'une minute : la séance finit à l'étape suivante.
  p = P.noterTemps(p, 200);
  r = tenter(p, "A1-2", justes(), J, true);
  assert.deepEqual([r.reussi, r.finie], [true, true]);
  const s = P.etatSeance(r.parcours, CARTE, {aujourdhui: J});
  assert.deepEqual([s.ouverte, s.finies], [false, 1]);
  // « Encore une séance » : la première étape est de nouveau permise.
  const encore = P.ouvrirSeance(r.parcours, CARTE, {aujourdhui: J, alea: .9});
  assert.equal(P.peutCommencer(encore, "apprends", {aujourdhui: J}), true);
});

test("la séance finie compte au journal, avec ce qu'elle a fait ; quittée au milieu, elle se ferme ; continuée après minuit, elle compte pour le jour où elle finit", () => {
  // (Lot P1, la règle B : A1-1 a déjà raté son retour d'avant — `x` 1 ; ratée encore aujourd'hui, elle part.)
  let p = tenir(["A1-1", "A1-2"], {b: 2, e: J, a: 0});
  p.modules.A1.x[0] = 1;
  p = P.normaliserParcours(p, {aujourdhui: J});
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: J, alea: .1234});
  assert.equal(p.seance.i, 1234);
  p = retour(retour(p, "A1-1", false).parcours, "A1-1", false).parcours;
  p = retour(p, "A1-2", true).parcours;
  p = P.terminerCalculsDuJour(p, {aujourdhui: J, carte: CARTE}).parcours;
  p = tenter(p, "A1-1", justes(), J, true).parcours;
  p = apprendre(p, "A1-3", lecon(), J, true).parcours;
  p = P.noterTemps(p, 700);
  const r = tenter(p, "A10-1", [{juste: false}, {juste: false}], J, true);
  assert.equal(r.finie, true);
  p = r.parcours;
  const derniere = P.resumeProf(p, CARTE, J).journal.pop();
  assert.deepEqual(derniere, {jour: J, calculs: 3, justes: 1, nouveautes: 1, prouvees: 1, rouges: 1, minutes: 12, seuls: 5, seulsJustes: 5, tests: 0, testsRates: 0});
  assert.equal(p.journal.numero[0], 10000 + 1234, "le numéro : le rang dans la journée, puis l'identité de la séance");
  assert.equal(p.seance.n, 1);
  // Quittée au milieu, le temps passé : `aFermer`.
  let q = P.noterTemps(tenter(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: .5}), "A1-1", justes(), J, true).parcours, 2000);
  assert.equal(P.etatSeance(q, CARTE, {aujourdhui: J}).aFermer, true);
  q = P.fermerSeance(q, CARTE, {aujourdhui: J});
  assert.deepEqual([q.fermee, q.parcours.seances], [true, [J]]);
  // Après minuit.
  let m = tenter(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: .5}), "A1-1", justes(), J, true).parcours;
  m = tenter(P.noterTemps(m, 900), "A1-2", justes(), plus(1), true).parcours;
  assert.deepEqual(m.seances, [plus(1)]);
  // Laissée ouverte un autre jour : « Commencer » la ferme pour son jour, et en ouvre une neuve.
  let v = tenter(P.ouvrirSeance(P.creerParcours(), CARTE, {aujourdhui: J, alea: .5}), "A1-1", justes(), J, true).parcours;
  v = P.ouvrirSeance(v, CARTE, {aujourdhui: plus(2), alea: .7});
  assert.deepEqual([v.seances, v.seance.jour, v.seance.n, v.seance.i], [[J], plus(2), 1, 7000]);
});

test("G3 — deux séances faites chacune sur son appareil, aux mêmes nombres, restent deux ; une copie de la même séance se dédoublonne", () => {
  const depart = tenir(["A1-1", "A1-2", "A10-1", "A2-1"], {b: 3, e: J});
  const seance = (alea, cles) => {
    let p = P.ouvrirSeance(depart, CARTE, {aujourdhui: J, alea});
    cles.forEach(k => { p = retour(p, k, true).parcours; });
    p = P.noterTemps(p, 130);
    return P.fermerSeance(P.terminerCalculsDuJour(p, {aujourdhui: J, carte: CARTE}).parcours, CARTE, {aujourdhui: J, force: true}).parcours;
  };
  const a = seance(.11, ["A1-1", "A1-2"]);
  const b = seance(.77, ["A10-1", "A2-1"]);
  assert.deepEqual([a.seances, b.seances, a.seance.n, b.seance.n], [[J], [J], 1, 1]);
  const sans = (p, i) => P.JOURNAL.filter(c => c !== "numero").map(c => p.journal[c][i]);
  assert.deepEqual(sans(a, 0), sans(b, 0), "les mêmes nombres des deux côtés");
  for (const f of [P.fusionner(a, b, {aujourdhui: J}), P.fusionner(b, a, {aujourdhui: J})]) {
    assert.deepEqual([f.seances, f.seance.n], [[J, J], 2], "deux séances, et le compte dit 2");
    assert.deepEqual(P.fusionner(f, a, {aujourdhui: J}), f, "la copie de la première qui revient ne change rien");
    assert.deepEqual(P.fusionner(f, f, {aujourdhui: J}), f);
    assert.equal(P.resumeProf(f, CARTE, J).seances.semaine, 2, "le professeur voit deux séances");
  }
  // La même séance, vue de deux appareils (l'un a la copie d'avant la fin).
  const ouverte = P.ouvrirSeance(depart, CARTE, {aujourdhui: J, alea: .11});
  assert.deepEqual([P.fusionner(a, ouverte, {aujourdhui: J}).seances, P.fusionner(a, ouverte, {aujourdhui: J}).seance.n], [[J], 1]);
});

// ------------------------------------------------------------ la fusion (B2)

// Un élève joué au hasard par le moteur, `jours` jours de suite à partir de
// `debut` : des retours, des « Je tente », des J'apprends finis ou arrêtés,
// un test de ceinture de temps en temps. `rng` : un hasard rejouable.
function hasard(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function jouer(depart, rng, debut, jours, {fort = .7} = {}) {
  let p = depart;
  for (let n = 0; n < jours; n += 1) {
    const jour = plus(n, debut);
    if (rng() < .15) continue;
    p = P.ouvrirSeance(p, CARTE, {aujourdhui: jour, alea: rng()});
    P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(c => {
      if (rng() < .1) return; // la page fermée avant ce calcul
      let r = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: rng() < fort, ms: rng() < .2 ? 7000 : 1500, cause: 1 + Math.floor(rng() * 14)}, {aujourdhui: jour, carte: CARTE});
      p = r.parcours;
      if (r.mouvement && r.mouvement.secondAVenir && rng() < .85) p = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: rng() < fort, ms: 1500}, {aujourdhui: jour, carte: CARTE}).parcours;
    });
    if (rng() < .8) p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
    for (let etape = 0; etape < 6 && P.seanceOuverte(p, jour); etape += 1) {
      p = P.noterTemps(p, 30 + Math.floor(rng() * 150));
      const carte = P.carteEleve(p, CARTE, {aujourdhui: jour});
      // (Lot P1 : plus de « Tente toute la ceinture » dans les séances jouées au hasard.)
      const jouables = carte.etages.flatMap(e => e.lignes.flatMap(l => l.etoiles)).filter(e => e.etat === "aGagner" && !e.attend);
      if (!jouables.length) break;
      const e = jouables[Math.floor(rng() * jouables.length)];
      if (e.actions.tente && rng() < .6) {
        const reponses = Array.from({length: 6}, () => ({juste: rng() < fort + .15, ms: 1500}));
        p = P.appliquerTentative(p, {module: e.module, niveau: e.niveau, reponses, causes: {3: 1}}, o(jour)).parcours;
      } else {
        p = P.appliquerSerie(p, {module: e.module, niveau: e.niveau, genre: "apprends", reponses: rng() < .6 ? lecon() : arretee()}, o(jour)).parcours;
      }
    }
    if (P.seanceOuverte(p, jour) && rng() < .7) p = P.fermerSeance(p, CARTE, {aujourdhui: jour, force: true}).parcours;
  }
  return p;
}

test("B2 — la fusion : fusion(A, B) = fusion(B, A), fusion(A, A) = A, fusion(fusion(A, B), A) = fusion(A, B), sur 300 paires d'appareils jouées au hasard", () => {
  let differentes = 0;
  for (let graine = 1; graine <= 300; graine += 1) {
    const rng = hasard(graine);
    const base = jouer(P.creerParcours(), rng, plus(-12), 3 + (graine % 6));
    const a = jouer(base, hasard(graine * 7919 + 1), plus(-4), 1 + (graine % 4));
    const b = jouer(base, hasard(graine * 104729 + 2), plus(-4), 1 + (graine % 3), {fort: .4});
    const f = (x, y) => P.fusionner(x, y, {aujourdhui: J});
    const ab = f(a, b);
    assert.deepEqual(f(b, a), ab, `graine ${graine} : dans les deux sens`);
    assert.deepEqual(f(a, P.normaliserParcours(a, {aujourdhui: J})), P.normaliserParcours(a, {aujourdhui: J}), `graine ${graine} : avec soi-même`);
    assert.deepEqual(f(ab, a), ab, `graine ${graine} : la copie A qui revient`);
    assert.deepEqual(f(ab, b), ab, `graine ${graine} : la copie B qui revient`);
    assert.deepEqual(f(f(ab, a), b), ab, `graine ${graine} : les deux, encore`);
    assert.deepEqual(f(ab, base), ab, `graine ${graine} : la vieille copie commune qui revient`);
    // Un appareil qui a continué garde TOUT son travail face à la copie d'où il est parti.
    assert.deepEqual(f(a, base), P.normaliserParcours(a, {aujourdhui: J}), `graine ${graine} : A fusionné avec son point de départ reste A`);
    assert.deepEqual(f(base, b), P.normaliserParcours(b, {aujourdhui: J}), `graine ${graine} : B, pareil`);
    assert.deepEqual(P.normaliserParcours(ab, {aujourdhui: J}), ab, "une fusion est déjà propre");
    if (JSON.stringify(a.modules) !== JSON.stringify(b.modules)) differentes += 1;
  }
  assert.ok(differentes > 250, "les deux appareils ont vraiment divergé");
});

test("B2 — la décision se prend étoile par étoile : jouer une autre étoile du même module ne donne aucune priorité aux boîtes d'à côté", () => {
  // Les deux cas de Codex, dans le format d'aujourd'hui. Départ commun : trois
  // étoiles de « Doubles et moitiés » tenues.
  const base = tenir(["M1-1", "M1-2", "M1-3"], {b: 3, e: J});
  // Un seul appareil : une réponse juste, puis la copie d'avant revient.
  const juste = retour(base, "M1-2", true).parcours;
  assert.equal(juste.modules.M1.b[1], 4);
  for (const f of [P.fusionner(juste, base, {aujourdhui: J}), P.fusionner(base, juste, {aujourdhui: J}), P.fusionner(P.fusionner(juste, base, {aujourdhui: J}), base, {aujourdhui: J})]) {
    assert.deepEqual(f.modules.M1.b, [4 - 1, 4, 3, 0, 0, 0, 0, 0, 0], "la réponse juste n'est jamais annulée");
  }
  // Deux appareils, le même jour : A joue M1-1, B joue M1-3 (et le rate — lot P1, la règle B : elle
  // descend d'une boîte et revient demain).
  const a = retour(base, "M1-1", true).parcours;
  const b = retour(retour(base, "M1-3", false).parcours, "M1-3", false).parcours;
  const f = P.fusionner(a, b, {aujourdhui: J});
  assert.deepEqual(f.modules.M1.b, [4, 3, 2, 0, 0, 0, 0, 0, 0], "chaque étoile suit l'appareil qui l'a jouée");
  assert.deepEqual([f.modules.M1.pe[2], f.modules.M1.e[2], f.modules.M1.d[2]], [0, plus(1), plus(-10)]);
  assert.deepEqual(P.fusionner(f, a, {aujourdhui: J}), f);
  assert.deepEqual(P.fusionner(b, f, {aujourdhui: J}), f);
  // La même étoile jouée des deux côtés, un geste chacun : le plus prudent, dans les deux sens.
  const monte = retour(base, "M1-1", true).parcours;
  const attend = retour(base, "M1-1", false).parcours;
  const m = P.fusionner(monte, attend, {aujourdhui: J});
  assert.deepEqual(P.fusionner(attend, monte, {aujourdhui: J}), m);
  assert.deepEqual([m.modules.M1.b[0], m.modules.M1.x[0]], [3, 2], "la boîte la plus basse : son 2e calcul l'attend");
  // Une leçon faite d'un côté n'est jamais remise à zéro par l'autre.
  const lu = apprendre(P.creerParcours(), "A1-1").parcours;
  const tente = tenter(P.creerParcours(), "A1-1").parcours;
  assert.equal(P.fusionner(lu, tente, {aujourdhui: J}).modules.A1.a[0], 1);
  assert.equal(P.fusionner(tente, lu, {aujourdhui: J}).modules.A1.a[0], 1);
});

test("la fusion : l'époque la plus haute gagne en bloc ; ceintures, tests de ceinture et jours se réunissent", () => {
  const a = tenir(["A1-1"], {b: 5, e: plus(9)});
  a.epoque = 2;
  const b = tenir(["A1-1", "A1-2"], {b: 2, e: J});
  assert.deepEqual(P.fusionner(a, b, {aujourdhui: J}), P.normaliserParcours(a, {aujourdhui: J}));
  assert.deepEqual(P.fusionner(b, a, {aujourdhui: J}), P.normaliserParcours(a, {aujourdhui: J}));
  const c = P.creerParcours();
  Object.assign(c, {ceintures: [plus(-2), null, null, null, null, null], paliers: [null, plus(-1), null, null, null, plus(-4)], jours: [plus(-2)], quarts: [0, 2, 0, 0, 1, 0]});
  const d = P.creerParcours();
  Object.assign(d, {ceintures: [plus(-5), plus(-1), null, null, null, null], paliers: [plus(-9), null, null, null, null, null], jours: [plus(-1)], quarts: [0, 1, 3, 0, 0, 0]});
  const f = P.fusionner(c, d, {aujourdhui: J});
  assert.deepEqual([f.ceintures, f.paliers, f.jours, f.quarts], [[plus(-5), plus(-1), null, null, null, null], [plus(-9), plus(-1), null, null, null, plus(-4)], [plus(-2), plus(-1)], [0, 2, 3, 0, 1, 0]]);
});

// ------------------------------------------------------------ les versions (B1)

function fauxStockage(initial = {}) {
  const m = new Map(Object.entries(initial));
  let ecritures = 0;
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { ecritures += 1; m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    ecritures: () => ecritures
  };
}

test("B1 — une progression d'une version plus récente n'est jamais lue, fusionnée ni recouverte : deux versions dans le même stockage", () => {
  // (Lot P1 : le moteur est en version 14 ; la page plus récente, en 15.)
  assert.equal(P.VERSION, 14);
  const stockage = fauxStockage();
  const mien = tenter(P.creerParcours(), "A1-1").parcours;
  assert.equal(P.sauver(stockage, mien, ""), true);
  // Une page plus récente (version 14 depuis le lot K1b, un format que ce moteur ne connaît
  // pas) écrit dans la même case : des listes plus longues, un champ neuf.
  const futur = {version: 15, epoque: 0, prenom: "", modules: {A1: {vu: J, b: [5, 4, 3, 2], e: [J, J, J, J], zz: [1, 1, 1, 1]}}, neuf: {x: 1}};
  const cle13 = P.cleStockage("", stockage);
  stockage.setItem(cle13, JSON.stringify(futur));
  const ecrituresAvant = stockage.ecritures();
  assert.equal(P.tropRecente(futur), true);
  assert.equal(P.versionEnAvance(stockage, ""), true);
  assert.deepEqual(P.charger(stockage, ""), P.creerParcours(), "rien n'en est interprété");
  assert.equal(P.sauver(stockage, mien, ""), false, "rien ne s'écrit par-dessus");
  assert.equal(P.sauver(stockage, P.charger(stockage, ""), ""), false);
  assert.equal(stockage.ecritures(), ecrituresAvant, "aucune écriture");
  assert.equal(stockage.getItem(cle13), JSON.stringify(futur), "la copie de la page plus récente est intacte, à l'octet près");
  // Reçue du serveur (à la lecture, ou avec un 409) : pas de fusion, lecture seule.
  const recu = P.recevoir(mien, futur, {aujourdhui: J});
  assert.deepEqual([recu.lectureSeule, recu.apporte, recu.parcours], [true, false, P.normaliserParcours(mien, {aujourdhui: J})]);
  assert.deepEqual(P.fusionner(mien, futur, {aujourdhui: J}), P.normaliserParcours(mien, {aujourdhui: J}), "fusionner ne fabrique rien avec elle");
  assert.deepEqual(P.fusionner(futur, mien, {aujourdhui: J}), P.normaliserParcours(mien, {aujourdhui: J}));
  assert.equal(P.tropRecente({version: 1500}), true, "une version au-delà de ce que le serveur accepte aussi");
  assert.equal(P.resumeProf(futur, CARTE, J).lisible, false);
  // Une réception ordinaire : la fusion, et `apporte` dit s'il faut renvoyer.
  const distant = tenter(P.creerParcours(), "A10-1").parcours;
  const ordinaire = P.recevoir(mien, distant, {aujourdhui: J});
  // (Lot P1 : gagnées du premier coup, boîte 4.)
  assert.deepEqual([ordinaire.lectureSeule, ordinaire.apporte, ordinaire.parcours.modules.A1.b[0], ordinaire.parcours.modules.A10.b[0]], [false, true, 4, 4]);
  assert.equal(P.recevoir(P.creerParcours(), distant, {aujourdhui: J}).apporte, false, "un appareil vide n'apporte rien : il ne renvoie pas");
  assert.equal(P.recevoir(distant, distant, {aujourdhui: J}).apporte, false);
});

test("les progressions d'avant la version 12 repartent de zéro (aucun élève n'avait joué) ; leur époque est gardée", () => {
  const v11 = {version: 11, epoque: 3, prenom: "Léa", modules: {A1: {vu: J, ok: J, b: [4, 4, 4], e: [J, J, J], a: [1, 1, 1], f: [2, 2, 2], x: [0, 0, 0], t: [0, 0, 0], l: [0, 0, 0], d: [J, J, J], s: [J, J, J], ar: [0, 0, 0], c: {2: 4}}},
    seance: {jour: J, etape: 2, n: 7, p: [1, 0, 0, 2, 0, 10, 1, 0, 0, 0, 0], j: [4, 3, 1, 0, 200, 1]}, seances: [plus(-1), J], journal: {calculs: [3, 4], justes: [3, 3], nouveautes: [0, 1], prouvees: [1, 0], rouges: [0, 0], minutes: [9, 10], numero: [10001, 10002]},
    jours: [plus(-1), J], ceintures: [J, null, null, null], paliers: [J, null, null, null]};
  for (const version of [2, 9, 10, 11]) {
    const lu = P.normaliserParcours(Object.assign({}, v11, {version}), {aujourdhui: J});
    assert.deepEqual(lu, Object.assign(P.creerParcours(), {epoque: 3, prenom: "Léa"}), `version ${version}`);
  }
  assert.equal(P.tropRecente(v11), false);
  // Elle ne gagne jamais contre le travail d'aujourd'hui à époque égale, et gagne en bloc si son époque est plus haute (une restauration du professeur).
  const mien = Object.assign(tenter(P.creerParcours(), "A1-1").parcours, {epoque: 3});
  assert.equal(P.fusionner(mien, v11, {aujourdhui: J}).modules.A1.b[0], 4, "(lot P1 : du premier coup, boîte 4)");
  assert.deepEqual(P.fusionner(mien, Object.assign({}, v11, {epoque: 4}), {aujourdhui: J}).modules, {});
});

test("G5 — une version illisible n'est jamais prise pour une version ancienne ; des valeurs abîmées ne décalent rien et ne lèvent aucune exception", () => {
  const propre = tenir(["M1-1", "M1-2", "M1-3"], {b: 3, e: J});
  for (const version of [10.5, 12.5, 13.5, 14.5, "12", "13", "14", true, null, undefined, [12], [13], [14], {}, -1, 0, NaN]) {
    const lu = P.normaliserParcours(Object.assign({}, JSON.parse(JSON.stringify(propre)), {version}), {aujourdhui: J});
    assert.deepEqual(lu.modules, {}, `version ${JSON.stringify(version)} : illisible, rien n'est repris`);
    assert.equal(P.versionDe({version}), 0);
  }
  assert.equal(P.versionDe({version: 12}), 12);
  assert.equal(P.versionDe({version: 13}), 13);
  assert.equal(P.versionDe({version: 14}), 14);
  // Un booléen, un texte, une liste d'un nombre, un objet piégé : la valeur neutre, à SA place.
  const piege = {toString: 1, valueOf: 1};
  const abime = JSON.parse(JSON.stringify(propre));
  // (Lot K1b : M1 a neuf étoiles — la liste est coupée à 9.)
  abime.modules.M1.b = [3, true, 2, [4], "5", piege, 0, 0, 0, 7, 7, 7];
  abime.modules.M1.e = [J, 20261123, "2026-02-30", null, true, piege];
  abime.modules.M1.g = [1, "2", 3.5, -1, 99999, null];
  abime.modules.M1.x = [true, 3, 4, piege];
  abime.modules.M1.c = {2: true, 3: "4", 5: 6, 77: piege};
  abime.seance = {jour: J, etape: "3", n: true, i: [5], g: piege, p: [true, "10", 1, 2, 3], j: [piege]};
  abime.ceintures = [true, J, "hier", piege, J, 5, J, J];
  abime.quarts = ["2", 2, 9, true, 3, -1, 3, 3];
  abime.epoque = "4";
  let lu;
  assert.doesNotThrow(() => { lu = P.normaliserParcours(abime, {aujourdhui: J}); });
  assert.deepEqual(lu.modules.M1.b, [3, 0, 2, 0, 0, 0, 0, 0, 0], "le booléen ne fait entrer aucune étoile, la liste est coupée à 9");
  assert.deepEqual(lu.modules.M1.e, [J, null, J, null, null, null, null, null, null], "une étoile tenue sans échéance lisible revient le jour de la lecture");
  assert.deepEqual(lu.modules.M1.g, [1, 0, 0, 0, 0, 0, 0, 0, 0]);
  // (Lot P1 : `x` va de 0 à 243 — 4, la sorte 1 d'un calcul raté, est une valeur valide sur une étoile tenue.)
  assert.deepEqual(lu.modules.M1.x, [0, 0, 4, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(lu.modules.M1.c, {5: 6});
  assert.deepEqual([lu.seance.p, lu.seance.n, lu.seance.i, lu.epoque], [[0, 0, 0, 0, 0], 0, 0, 0]);
  assert.deepEqual([lu.ceintures, lu.quarts], [[null, J, null, null, J, null], [0, 2, 0, 0, 3, 0]], "six étages : coupées à 6, chaque valeur à sa place");
  assert.deepEqual(P.normaliserParcours(lu, {aujourdhui: J}), lu, "stable en une lecture");
  // Le jour de repli est le jour de la lecture passé à la fonction, pas l'horloge du poste.
  const sans = JSON.parse(JSON.stringify(propre));
  sans.modules.M1.e = [null, null, null, null, null, null, null, null, null];
  assert.deepEqual(P.normaliserParcours(sans, {aujourdhui: "2020-01-01"}).modules.M1.e.slice(0, 3), ["2020-01-01", "2020-01-01", "2020-01-01"]);
  // Une liste trop courte : complétée ; rien d'autre qu'un objet : un parcours vide.
  const court = JSON.parse(JSON.stringify(propre));
  court.modules.M1.b = [3];
  assert.deepEqual(P.normaliserParcours(court, {aujourdhui: J}).modules.M1.b, [3, 0, 0, 0, 0, 0, 0, 0, 0]);
  for (const brut of [null, 12, "x", [], true]) assert.deepEqual(P.normaliserParcours(brut), P.creerParcours());
});

test("G5 — la même progression abîmée, passée par le filtre du serveur puis relue, donne la lecture locale", {skip: spawnSync("php", ["-v"]).status !== 0 && "php absent de ce poste (le test tourne avec `php _serveur/tests/lancer.php` à côté)"}, () => {
  const abime = JSON.parse(JSON.stringify(jouer(P.creerParcours(), hasard(5), plus(-9), 9)));
  abime.modules.A1.b = [4, "?", 3];
  abime.modules.A1.e = [J, "bientôt", J];
  abime.modules.A1.d = ["x", J, "2026-13-01"];
  abime.modules.A1.g = [1, "deux", 3];
  abime.modules.A1.pe = [0, "?", 1];
  abime.modules.A1.q = ["?", null, null];
  abime.seances = [...abime.seances.slice(0, 1), "pas une date", ...abime.seances.slice(1)];
  Object.keys(abime.journal).forEach(c => abime.journal[c].splice(1, 0, c === "justes" ? "x" : 5));
  abime.ceintures = ["?", J, null, null, null, null];
  abime.seance.p = [1, "10", 1, 2, 0];
  const script = `require ${JSON.stringify(fileURLToPath(new URL("../_serveur/public/lib/progression.php", import.meta.url)))}; echo json_encode(filtrer_progression('defi-calcul', json_decode(stream_get_contents(STDIN), false)), JSON_UNESCAPED_UNICODE);`;
  const php = spawnSync("php", ["-r", script], {input: JSON.stringify(abime), encoding: "utf8"});
  assert.equal(php.status, 0, php.stderr);
  const filtre = JSON.parse(php.stdout);
  assert.deepEqual(filtre.modules.A1.b, [4, 0, 3], "le serveur remplace à sa place, il ne retire pas");
  assert.deepEqual(filtre.modules.A1.e, [J, null, J]);
  assert.equal(filtre.seances.length, abime.seances.length, "la liste des séances garde sa longueur");
  assert.deepEqual(P.normaliserParcours(filtre, {aujourdhui: J}), P.normaliserParcours(abime, {aujourdhui: J}));
});

// ------------------------------------------------------------ ce que lit le professeur

test("le professeur et Mon espace lisent la même forme qu'avant (leur nouvel affichage est le lot K2)", () => {
  let p = tenir(["A1-1", "A1-2", "A1-3", "A10-1"], {b: 3, e: J});
  poser(p, "A1-2", {b: 5, e: plus(9), plusChamps: {s: plus(-2)}});
  poser(p, "A1-3", {b: 0, e: null, d: plus(-6), plusChamps: {pe: 1}});
  p = P.normaliserParcours(p, {aujourdhui: J});
  for (let n = 0; n < 3; n += 1) p = apprendre(p, "A2-1", arretee(), plus(n - 3)).parcours;
  const r = P.resumeProf(p, CARTE, J);
  assert.deepEqual([r.lisible, r.commence, r.entrees, r.sues, r.total], [true, true, 3, 1, 141]);
  const a1 = r.modules.find(m => m.id === "A1");
  assert.deepEqual([a1.etats, a1.boites, a1.su, a1.perdues], [["route", "su", "revoir"], [3, 5, 0], false, [0, 0, 1]]);
  assert.deepEqual(r.modules.find(m => m.id === "A2").etats[0], "classe");
  assert.deepEqual(r.revoir.map(c => [c.module, c.niveau, c.etat, c.apprends, c.pasApprise, c.deCote]), [["A1", 3, "revoir", true, false, false], ["A2", 1, "classe", true, true, true]]);
  assert.deepEqual([r.aVoir, r.rouges], [1, 1]);
  assert.deepEqual(Object.keys(r.ceintures).sort(), ["barrettes", "dates", "etoiles", "porte", "prochaine", "quarts", "solides", "total"]);
  const s = P.resumeSuivi(p, {aujourdhui: J});
  assert.deepEqual([s.appli, s.aider], ["defi-calcul", [{type: "a-reprendre", competences: 1}, {type: "rouges", competences: 1}]]);
  assert.deepEqual(P.resumeProf({version: 11, modules: {}}, CARTE, J).commence, false);
});
