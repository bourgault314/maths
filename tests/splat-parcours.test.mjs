// Le moteur partagé du parcours SPLAT! (assets/js/splat-parcours.js, lot 1
// « moteur » du chantier SPLAT! ↔ suivi, 07/10/2026) : le format (D2), « la
// meilleure série gagne » (D3), la fusion entre appareils, l'ancien contenu de
// la clé sans code lu tel quel, les cases par code, ce qui part au serveur, et
// la liste fermée des parcours comparée à splat-etapes.js. Ces tests EXÉCUTENT
// le moteur ; le client du suivi est testé à part (splat-parcours-suivi.test.mjs).

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFile, readdir} from "node:fs/promises";
import {PARCOURS, SOURCE_MOTEUR, ETAPES_CARTE, A, B, caseAncienne, parcoursAvecTravail, fauxStockage, chainesLibres} from "./splat-faux-monde.mjs";

const {BONUS} = ETAPES_CARTE;
const {ETAPES} = ETAPES_CARTE;

// Échauffement du monde 6 (lot 3, 14/10/2026) : splat-etapes.js a maintenant É1-É3, juste avant
// la 38 — la liste « en attente du lot 3 » du lot 2 est retirée, le moteur suit splat-etapes.js.
test("échauffement : É1-É3 sont dans splat-etapes.js, juste avant la 38, avec leurs titres", () => {
  assert.deepEqual(ETAPES.slice(31, 35).map(e => e[0]), ["ech1", "ech2", "ech3", "m4e1"], "les trois étapes juste avant la 38");
  assert.deepEqual(ETAPES.slice(31, 34).map(e => [e[1], e[2]]),
    [["É1", "Des jetons verts et rouges"], ["É2", "Je partage les jetons"], ["É3", "Un jeton, un nombre"]]);
});
const serie = (fait, etoiles, cartes, vues) => ({fait, etoiles, cartes, vues});

// ------------------------------------------------------------- la liste fermée

test("PARCOURS_VALIDES est exactement ETAPES + BONUS de splat-etapes.js, dans cet ordre (40 étapes + 14 Bonus = 54)", () => {
  const attendu = [...ETAPES.map(e => e[0]), ...BONUS.map(b => b[0])];
  assert.deepEqual([...PARCOURS.PARCOURS_VALIDES], attendu,
    "la carte a changé : recopier dans CARTE_ETAPES et CARTE_BONUS (assets/js/splat-parcours.js) les lignes que donne le test « la carte réduite du moteur… », puis le motif dans lib/applis.php :\n" + JSON.stringify(attendu));
  assert.equal(ETAPES.length, 40, "la numérotation saute de 28 à 35, et l'échauffement É1-É3 s'ajoute avant la 38 : 40 étapes");
  assert.equal(BONUS.length, 14);
  assert.equal(new Set(attendu).size, 54, "aucun doublon");
});

// Lot 3 « serveur + tuile » (07/10/2026) : les pages du serveur de suivi n'ont
// que le moteur (copié dans _serveur/public/prof/), pas splat-etapes.js. Le
// moteur porte donc la carte réduite — numéro et monde de chaque parcours,
// sans les titres — et resumeProf la prend quand on ne lui donne rien.
test("la carte réduite du moteur est ETAPES et BONUS de splat-etapes.js, sans les titres", () => {
  const sansTitre = ligne => [ligne[0], ligne[1], ligne[3], ligne[4]];
  const attenduEtapes = ETAPES.map(sansTitre);
  const attenduBonus = BONUS.map(sansTitre);
  const aRecopier = "\nCARTE_ETAPES : " + JSON.stringify(ETAPES.map(e => [e[0], e[1], e[4]]))
    + "\nCARTE_BONUS : " + JSON.stringify(BONUS.map(b => [b[0], b[1], b[4]]));
  assert.deepEqual(PARCOURS.CARTE.ETAPES.map(sansTitre), attenduEtapes,
    "la carte des mondes a changé (numéro, monde ou parcours d’une étape) : recopier dans assets/js/splat-parcours.js" + aRecopier);
  assert.deepEqual(PARCOURS.CARTE.BONUS.map(sansTitre), attenduBonus,
    "les Bonus ont changé : recopier dans assets/js/splat-parcours.js" + aRecopier);
  const mondes = [...new Map(ETAPES.map(e => [e[4], e[3]])).entries()];
  assert.deepEqual(PARCOURS.CARTE.MONDES.map(m => [m[0], m[1]]), mondes, "les six mondes, leur numéro et leur nom");
  assert.ok([...PARCOURS.CARTE.ETAPES, ...PARCOURS.CARTE.BONUS].every(l => l[2] === ""),
    "aucun titre : une retouche de titre ne doit demander aucun dépôt sur le serveur de suivi");
});

test("resumeProf sans carte (pages du serveur de suivi) rend la même chose qu’avec celle de splat-etapes.js", () => {
  let p = PARCOURS.creer();
  ETAPES.filter(e => e[4] <= 2).forEach(e => { p = PARCOURS.enregistrerSerie(p, e[0], serie(true, 4, 4, 0), "2026-09-20"); });
  p = PARCOURS.enregistrerSerie(p, "enq10", serie(true, 3, 4, 1), "2026-10-01");
  p = PARCOURS.enregistrerEnCours(p, "enq11", {idx: 2, etoiles: 1, cartes: 4}, "2026-10-02");
  p = PARCOURS.enregistrerSerie(p, "sys25d", serie(true, 4, 4, 0), "2026-10-03");
  const avecLaCarte = PARCOURS.resumeProf(p, ETAPES, BONUS);
  const sansRien = PARCOURS.resumeProf(p);
  assert.deepEqual(sansRien, avecLaCarte);
  assert.equal(sansRien.total, 40, "le total vient de la carte : 40 étapes");
  assert.deepEqual(sansRien.mondes.map(m => m.etat), ["fini", "fini", "cours", "cours", "vide", "vide"]);
});

test("le motif PHP du serveur (lot 3) accepte les 54 parcours et rien d’autre", () => {
  const motif = PARCOURS.motifPhp();
  assert.match(motif, /^\/\^\(\?:[a-z0-9|]+\)\$\/$/, "un motif PCRE délimité, tel que lib/applis.php l’attend");
  const regex = new RegExp(motif.slice(1, -1));
  PARCOURS.PARCOURS_VALIDES.forEach(id => assert.ok(regex.test(id), id));
  ["m1e7", "enq", "enq10d", "fait", "prenom", "m1e1 ", "M1E1", "", "ech", "ech0", "ech4", "ech9", "ech1d", "É1"].forEach(id => assert.equal(regex.test(id), false, id));
});

test("le moteur est un fichier de page : il s’analyse seul, s’exporte pour node et sous window.MathsGoSplatParcours", () => {
  assert.doesNotThrow(() => new vm.Script(SOURCE_MOTEUR));
  const fenetre = {};
  new Function("window", "globalThis", SOURCE_MOTEUR)(fenetre, fenetre);
  assert.equal(typeof fenetre.MathsGoSplatParcours.creerClient, "function");
  assert.equal(fenetre.MathsGoSplatParcours.VERSION, PARCOURS.VERSION);
  assert.equal(PARCOURS.APPLI, "splat");
  assert.deepEqual(Object.keys(PARCOURS.creer()), ["version", "epoque", "etapes"]);
});

// Lot 2 « outils + carte » (08/10/2026) : le test « aucune page ne charge encore
// le moteur » du lot 1 est inversé. La carte et les trois outils chargent le
// moteur, puis l'habillage du suivi (assets/js/splat-suivi.js), sans « defer »
// (les outils dessinent leur première carte pendant le chargement), avec le MÊME
// ?v= partout — à bumper partout ensemble quand l'un des deux fichiers change
// (le moteur se recopie aussi dans _serveur/public/prof/ : test de copie).
test("la carte et les trois outils chargent le moteur puis l’habillage du suivi, sans defer, avec le même ?v= partout", async () => {
  const racine = new URL("../", import.meta.url);
  const pages = ["outils/splat_univers.html", "outils/splat.html", "outils/splat_tache_barre.html", "outils/equasplat.html"];
  const versions = {moteur: new Set(), habillage: new Set()};
  for (const page of pages) {
    const html = await readFile(new URL(page, racine), "utf8");
    const tete = html.slice(0, html.indexOf("</head>"));
    const moteur = [...html.matchAll(/<script src="\.\.\/assets\/js\/splat-parcours\.js\?v=([\w-]+)"><\/script>/g)];
    const habillage = [...html.matchAll(/<script src="\.\.\/assets\/js\/splat-suivi\.js\?v=([\w-]+)"><\/script>/g)];
    assert.equal(moteur.length, 1, `${page} : le moteur, une fois, sans defer`);
    assert.equal(habillage.length, 1, `${page} : l’habillage, une fois, sans defer`);
    assert.ok(moteur[0].index < habillage[0].index, `${page} : le moteur d’abord`);
    assert.ok(habillage[0].index < tete.length, `${page} : dans le <head>, avant le script de la page`);
    versions.moteur.add(moteur[0][1]);
    versions.habillage.add(habillage[0][1]);
  }
  assert.equal(versions.moteur.size, 1, "même ?v= du moteur dans les quatre pages");
  assert.equal(versions.habillage.size, 1, "même ?v= de l’habillage dans les quatre pages");
  const fichiers = await readdir(new URL("assets/js/", racine));
  assert.ok(fichiers.includes("splat-parcours.js") && fichiers.includes("splat-suivi.js"));
});

// ------------------------------------------------------------- le format

test("l’ancien contenu de la clé sans code se lit tel quel et se complète (vues 0, essais 1)", () => {
  const p = PARCOURS.normaliser(caseAncienne());
  // Relue dans la version du moteur (2 depuis le lot S1 « les journaux »).
  assert.equal(p.version, 2);
  assert.equal(p.epoque, 0);
  assert.deepEqual(p.etapes.m1e1, {fait: true, etoiles: 10, cartes: 12, vues: 0, essais: 1, date: "2026-09-28"});
  // Une étape faite qu'on rejoue : l'étoile reste, la reprise aussi (locale).
  assert.equal(p.etapes.m2e1.fait, true);
  assert.equal(p.etapes.m2e1.idx, undefined, "pas d’idx sur une étape faite");
  assert.deepEqual(p.etapes.m2e1.enCours, {sig: "s|1", idx: 2, etoiles: 1, res: [true, false]});
  // Une série en cours d'avant le moteur : idx et etoiles viennent d'enCours,
  // vues compte les « ko » (réponses montrées).
  assert.equal(p.etapes.enq14.fait, false);
  assert.equal(p.etapes.enq14.idx, 3);
  assert.equal(p.etapes.enq14.etoiles, 2);
  assert.equal(p.etapes.enq14.vues, 1);
  assert.equal(p.etapes.enq14.essais, 1);
  assert.equal(p.etapes.enq14.date, null);
  assert.equal(PARCOURS.etatEtape(p, "enq14"), "cours");
  assert.equal(PARCOURS.etatEtape(p, "m1e1"), "reussie");
  assert.equal(PARCOURS.etatEtape(p, "m1e2"), "vide");
});

test("ÉquaSplat écrivait « resolues » dans enCours : lu comme etoiles", () => {
  const p = PARCOURS.normaliser({m3e1: {enCours: {sig: "4:abcd", idx: 2, resolues: 2, res: [true, true]}}});
  assert.equal(p.etapes.m3e1.etoiles, 2);
  assert.equal(p.etapes.m3e1.enCours.etoiles, 2);
});

test("normaliser rejette ce qui ne dit rien : entrée vide, parcours au nom impossible, dates fausses, tableau", () => {
  const p = PARCOURS.normaliser({m1e1: {}, "m1 e1": {fait: true}, "<b>": {fait: true}, m1e2: {fait: true, date: "2026-13-40", etoiles: "7", cartes: 4.5}});
  assert.deepEqual(Object.keys(p.etapes), ["m1e2"]);
  assert.equal(p.etapes.m1e2.date, null);
  assert.equal(p.etapes.m1e2.etoiles, 7, "un entier écrit en chaîne passe");
  assert.equal(p.etapes.m1e2.cartes, 0, "un nombre à virgule ne passe pas");
  assert.deepEqual(PARCOURS.normaliser([1, 2]), PARCOURS.creer());
  assert.deepEqual(PARCOURS.normaliser(null), PARCOURS.creer());
  assert.equal(PARCOURS.estVide(PARCOURS.normaliser({})), true);
  assert.equal(PARCOURS.estVide(p), false);
});

test("le format D2 (enveloppe version/epoque/etapes) se relit à l’identique", () => {
  // Version 2 depuis le lot S1 « les journaux » (sans jour joué : pas de journal).
  const d2 = {version: 2, epoque: 3, etapes: {enq11: {fait: true, etoiles: 2, cartes: 4, vues: 1, essais: 2, date: "2026-10-05"},
    enq14: {fait: false, etoiles: 2, cartes: 4, vues: 0, essais: 1, date: "2026-10-07", idx: 3}}};
  const p = PARCOURS.normaliser(d2);
  assert.deepEqual(p, d2);
  assert.deepEqual(PARCOURS.pourServeur(p), d2);
  assert.equal(PARCOURS.etatEtape(p, "enq11"), "aide", "réussie avec une réponse vue");
});

// ------------------------------------------------- « la meilleure série gagne »

test("meilleure : fait d’abord, puis vues le plus petit, puis etoiles le plus grand ; à égalité la première", () => {
  const faite = {fait: true, etoiles: 2, cartes: 4, vues: 2};
  const enCours = {fait: false, etoiles: 4, cartes: 4, vues: 0};
  assert.equal(PARCOURS.meilleure(faite, enCours), faite, "une série en cours ne vaut jamais une étoile");
  assert.equal(PARCOURS.meilleure(enCours, faite), faite);
  const sansAide = {fait: true, etoiles: 1, cartes: 4, vues: 0};
  assert.equal(PARCOURS.meilleure(faite, sansAide), sansAide, "moins de réponses vues gagne, même avec moins d’étoiles");
  const parfaite = {fait: true, etoiles: 4, cartes: 4, vues: 0};
  assert.equal(PARCOURS.meilleure(sansAide, parfaite), parfaite);
  const a = {fait: true, etoiles: 4, cartes: 4, vues: 0};
  assert.equal(PARCOURS.meilleure(a, parfaite), a, "égalité : on garde ce qu’on a");
  assert.equal(PARCOURS.meilleure(null, a), a);
});

test("enregistrerSerie : une série parfaite puis une série bâclée — l’élève garde la parfaite, essais compte les deux", () => {
  let p = PARCOURS.enregistrerSerie(PARCOURS.creer(), "m1e1", serie(true, 12, 12, 0), "2026-09-28");
  p = PARCOURS.enregistrerSerie(p, "m1e1", serie(true, 5, 12, 3), "2026-10-02");
  assert.deepEqual(p.etapes.m1e1, {fait: true, etoiles: 12, cartes: 12, vues: 0, essais: 2, date: "2026-09-28"});
  // Dans l'autre sens : la bâclée d'abord, la parfaite ensuite remplace, et la
  // date reste celle de la PREMIÈRE réussite.
  let q = PARCOURS.enregistrerSerie(PARCOURS.creer(), "m1e1", serie(true, 5, 12, 3), "2026-09-28");
  q = PARCOURS.enregistrerSerie(q, "m1e1", serie(true, 12, 12, 0), "2026-10-02");
  assert.deepEqual(q.etapes.m1e1, {fait: true, etoiles: 12, cartes: 12, vues: 0, essais: 2, date: "2026-09-28"});
  assert.equal(PARCOURS.etatEtape(q, "m1e1"), "reussie");
});

test("enregistrerEnCours puis enregistrerSerie : une seule série, un seul essai ; la reprise locale s’efface à la fin", () => {
  let p = PARCOURS.enregistrerEnCours(PARCOURS.creer(), "enq14", {idx: 1, etoiles: 1, vues: 0, cartes: 4, sig: "g=7", res: [true]}, "2026-10-07");
  assert.deepEqual(p.etapes.enq14, {fait: false, etoiles: 1, cartes: 4, vues: 0, essais: 1, date: "2026-10-07", idx: 1,
    enCours: {sig: "g=7", idx: 1, etoiles: 1, res: [true]}});
  p = PARCOURS.enregistrerEnCours(p, "enq14", {idx: 3, etoiles: 2, vues: 1, cartes: 4, sig: "g=7", res: [true, true, "ko"]}, "2026-10-07");
  assert.equal(p.etapes.enq14.essais, 1, "la même série (même empreinte) ne compte pas deux fois");
  assert.equal(p.etapes.enq14.idx, 3);
  assert.equal(p.etapes.enq14.vues, 1);
  assert.equal(PARCOURS.etatEtape(p, "enq14"), "cours");
  // vues absent : compté depuis res (les « ko »).
  const q = PARCOURS.enregistrerEnCours(PARCOURS.creer(), "enq14", {idx: 3, etoiles: 2, cartes: 4, res: [true, true, "ko"]}, "2026-10-07");
  assert.equal(q.etapes.enq14.vues, 1);
  // La série finit : l'étoile, essais toujours 1, plus de reprise ni d'idx.
  p = PARCOURS.enregistrerSerie(p, "enq14", serie(true, 2, 4, 1), "2026-10-07");
  assert.deepEqual(p.etapes.enq14, {fait: true, etoiles: 2, cartes: 4, vues: 1, essais: 1, date: "2026-10-07"});
  assert.equal(PARCOURS.etatEtape(p, "enq14"), "aide");
  // Une NOUVELLE série (autre empreinte, ou après « Rejouer toute la série ») compte un essai de plus.
  p = PARCOURS.enregistrerEnCours(p, "enq14", {idx: 1, etoiles: 1, cartes: 4, sig: "g=8", res: [true]}, "2026-10-08");
  assert.equal(p.etapes.enq14.essais, 2);
  assert.equal(p.etapes.enq14.fait, true, "jamais par-dessus une étape faite");
  assert.equal(p.etapes.enq14.date, "2026-10-07", "la date de la première réussite ne bouge pas");
  assert.equal(p.etapes.enq14.idx, undefined);
  assert.deepEqual(p.etapes.enq14.enCours, {sig: "g=8", idx: 1, etoiles: 1, res: [true]}, "mais la reprise locale est là");
  p = PARCOURS.effacerEnCours(p, "enq14");
  assert.equal(p.etapes.enq14.enCours, undefined);
  assert.equal(p.etapes.enq14.fait, true, "« Rejouer toute la série » : l’étoile reste");
});

test("enregistrerSerie après une reprise d’avant le moteur (ancien enCours) : la série était déjà comptée", () => {
  const p = PARCOURS.enregistrerSerie(PARCOURS.normaliser(caseAncienne()), "enq14", serie(true, 3, 4, 1), "2026-10-07");
  assert.equal(p.etapes.enq14.essais, 1);
  assert.equal(p.etapes.enq14.fait, true);
});

test("une entrée aux bornes : rien ne casse, les nombres sont bornés, un parcours au nom impossible est ignoré", () => {
  const p = PARCOURS.enregistrerSerie(PARCOURS.creer(), "m1e1", {fait: true, etoiles: -4, cartes: 99999, vues: "x"}, "pas une date");
  assert.equal(p.etapes.m1e1.etoiles, 0);
  assert.equal(p.etapes.m1e1.cartes, 1000);
  assert.equal(p.etapes.m1e1.vues, 0);
  assert.equal(p.etapes.m1e1.date, PARCOURS.jourLocal(), "sans date valable : aujourd’hui (jour local)");
  assert.deepEqual(PARCOURS.enregistrerSerie(PARCOURS.creer(), "m1 e1", serie(true, 1, 1, 0)), PARCOURS.creer());
  assert.deepEqual(PARCOURS.enregistrerEnCours(PARCOURS.creer(), "m1e1", {idx: 0}), PARCOURS.creer(), "idx 0 : rien à dire");
  assert.deepEqual(PARCOURS.effacerEnCours(PARCOURS.creer(), "m1e1"), PARCOURS.creer());
});

// ------------------------------------------------------------- la fusion

test("fusionner : par étape la meilleure, essais max, date la plus ancienne des réussites, union des parcours", () => {
  let a = PARCOURS.enregistrerSerie(PARCOURS.creer(), "m1e1", serie(true, 10, 12, 0), "2026-09-28");
  a = PARCOURS.enregistrerSerie(a, "m1e1", serie(true, 11, 12, 0), "2026-10-01");
  a = PARCOURS.enregistrerSerie(a, "m1e2", serie(true, 3, 6, 2), "2026-09-30");
  let b = PARCOURS.enregistrerSerie(PARCOURS.creer(), "m1e1", serie(true, 12, 12, 0), "2026-09-25");
  b = PARCOURS.enregistrerSerie(b, "m1e3", serie(true, 6, 6, 0), "2026-10-03");
  const f = PARCOURS.fusionner(a, b);
  assert.deepEqual(f.etapes.m1e1, {fait: true, etoiles: 12, cartes: 12, vues: 0, essais: 2, date: "2026-09-25"},
    "la meilleure (12 étoiles), essais = max(2, 1), la date la plus ancienne");
  assert.deepEqual(f.etapes.m1e2, a.etapes.m1e2);
  assert.deepEqual(f.etapes.m1e3, b.etapes.m1e3);
  assert.deepEqual(PARCOURS.fusionner(b, a), f, "les deux côtés sont interchangeables");
  assert.deepEqual(PARCOURS.fusionner(f, f), f, "fusionner avec soi-même ne change rien");
});

test("fusionner : une série en cours d’un côté ne remplace jamais l’étoile de l’autre ; deux en cours : la plus avancée", () => {
  const ici = PARCOURS.enregistrerEnCours(PARCOURS.creer(), "enq14", {idx: 3, etoiles: 3, vues: 0, cartes: 4, sig: "g", res: [true, true, true]}, "2026-10-07");
  const serveur = {version: 1, epoque: 0, etapes: {enq14: {fait: true, etoiles: 2, cartes: 4, vues: 1, essais: 1, date: "2026-10-05"}}};
  const f = PARCOURS.fusionner(ici, serveur);
  assert.equal(f.etapes.enq14.fait, true);
  assert.equal(f.etapes.enq14.etoiles, 2);
  assert.equal(f.etapes.enq14.idx, undefined);
  assert.equal(f.etapes.enq14.date, "2026-10-05");
  assert.deepEqual(f.etapes.enq14.enCours, ici.etapes.enq14.enCours, "la reprise locale survit (elle n’est jamais envoyée)");
  // Deux séries en cours : la meilleure (moins de vues, plus d'étoiles), la date la plus récente.
  const autre = PARCOURS.enregistrerEnCours(PARCOURS.creer(), "enq14", {idx: 2, etoiles: 1, vues: 1, cartes: 4}, "2026-10-08");
  const g = PARCOURS.fusionner(ici, autre);
  assert.equal(g.etapes.enq14.fait, false);
  assert.equal(g.etapes.enq14.idx, 3);
  assert.equal(g.etapes.enq14.etoiles, 3);
  assert.equal(g.etapes.enq14.date, "2026-10-08", "pas fait : le dernier passage");
});

test("fusionner : une époque plus haute gagne en bloc (remise à zéro, restauration par le professeur)", () => {
  const a = PARCOURS.enregistrerSerie(PARCOURS.creer(), "m1e1", serie(true, 12, 12, 0), "2026-09-28");
  const restaure = {version: 1, epoque: 1, etapes: {}};
  assert.deepEqual(PARCOURS.fusionner(a, restaure), PARCOURS.normaliser(restaure), "tout ce que le professeur a défait reste défait");
  assert.deepEqual(PARCOURS.fusionner(restaure, a), PARCOURS.normaliser(restaure));
});

// ------------------------------------------------------- ce qui part au serveur

test("pourServeur : version, epoque et les 7 champs de chaque étape de la liste fermée — jamais enCours, jamais un parcours inconnu", () => {
  let p = PARCOURS.normaliser(caseAncienne());
  p = PARCOURS.enregistrerSerie(p, "perso42", serie(true, 4, 4, 0), "2026-10-07");
  const s = PARCOURS.pourServeur(p);
  // Lot S1 « les journaux » : la série jouée a ouvert le journal du jour.
  assert.deepEqual(Object.keys(s), ["version", "epoque", "etapes", "jours", "journal", "depuis"]);
  assert.deepEqual(Object.keys(s.etapes), ["m1e1", "m2e1", "enq14"], "dans l’ordre de la liste fermée ; « perso42 » ne part pas");
  assert.deepEqual(s.etapes.enq14, {fait: false, etoiles: 2, cartes: 0, vues: 1, essais: 1, date: null, idx: 3});
  assert.deepEqual(s.etapes.m2e1, {fait: true, etoiles: 3, cartes: 4, vues: 0, essais: 1, date: "2026-10-01"}, "pas d’enCours, pas d’idx");
  assert.deepEqual(chainesLibres(s), [], "rien que des nombres, des booléens, null, des dates et les noms de la liste fermée");
  assert.doesNotMatch(JSON.stringify(s), /sig|res|enCours|ko/);
  assert.equal(p.etapes.perso42.fait, true, "mais localement, le travail hors liste est gardé");
});

test("le parcours de référence est celui que le moteur produit, complet, sans chaîne libre, et il tient dans la limite du serveur", async () => {
  const {parcoursComplet, CHEMIN, EN_COURS} = await import("../scripts/generer-parcours-reference-splat.mjs");
  const reference = parcoursComplet();
  const fichier = JSON.parse(await readFile(CHEMIN, "utf8"));
  assert.deepEqual(fichier, reference,
    "le moteur a changé la forme du parcours : relance « node scripts/generer-parcours-reference-splat.mjs », puis complète 'cles'/'motifs' dans _serveur/public/lib/applis.php (le test PHP du lot 3 le vérifie)");
  assert.deepEqual(Object.keys(reference.etapes), [...PARCOURS.PARCOURS_VALIDES], "les 54 parcours, dans l’ordre");
  assert.deepEqual(chainesLibres(reference), []);
  const enCours = Object.keys(reference.etapes).filter(id => !reference.etapes[id].fait);
  assert.deepEqual(enCours, [EN_COURS], "une seule étape en cours");
  assert.equal(reference.etapes[EN_COURS].idx, 3);
  assert.ok(Object.values(reference.etapes).some(e => e.essais > 1), "des étapes rejouées");
  assert.ok(Object.values(reference.etapes).some(e => e.fait && e.vues > 0), "des réussites avec aide");
  assert.ok(Object.values(reference.etapes).every(e => e.date), "chaque étape datée");
  const taille = JSON.stringify(reference).length;
  assert.ok(taille > 3000 && taille < 40000, `taille ${taille} octets : loin des 40 000 du serveur`);
  // Les clés que lib/applis.php devra déclarer : exactement celles du fichier.
  const cles = new Set();
  const parcourir = (v, racine) => { if (v && typeof v === "object" && !Array.isArray(v)) Object.keys(v).forEach(k => { if (!racine) cles.add(k); parcourir(v[k], false); }); };
  parcourir(reference, false);
  PARCOURS.PARCOURS_VALIDES.forEach(id => cles.delete(id));
  assert.deepEqual([...cles].sort(), [...PARCOURS.CLES_SERVEUR].sort());
});

// ------------------------------------------------------------- la vue prof

test("resumeProf : par monde faits/total/état, les Bonus à part, un monde fini quand ses étapes sont faites (bonus ou pas)", () => {
  let p = PARCOURS.creer();
  ETAPES.filter(e => e[4] === 1).forEach(e => { p = PARCOURS.enregistrerSerie(p, e[0], serie(true, 4, 4, 0), "2026-09-20"); });
  p = PARCOURS.enregistrerSerie(p, "enq10", serie(true, 3, 4, 1), "2026-10-01");
  p = PARCOURS.enregistrerEnCours(p, "enq11", {idx: 2, etoiles: 1, cartes: 4}, "2026-10-02");
  p = PARCOURS.enregistrerSerie(p, "enq11d", serie(true, 4, 4, 0), "2026-10-03");
  const r = PARCOURS.resumeProf(p, ETAPES, BONUS);
  assert.equal(r.total, 40);
  assert.equal(r.faits, 7);
  assert.equal(r.aides, 1);
  assert.equal(r.cours, 1);
  assert.deepEqual(r.bonus, {total: 14, faits: 1, aides: 0, cours: 0});
  assert.equal(r.mondes.length, 6);
  assert.deepEqual(r.mondes.map(m => [m.numero, m.nom, m.etat]), [
    [1, "Petit SPLAT!", "fini"], [2, "SPLAT! Classique", "vide"], [3, "SPLAT! Enquête", "cours"],
    [4, "SPLAT! Système", "vide"], [5, "SPLAT! Équations", "vide"], [6, "SPLAT! Relatifs", "vide"]]);
  assert.deepEqual(r.mondes[0], {numero: 1, nom: "Petit SPLAT!", total: 6, faits: 6, aides: 0, cours: 0, bonus: {total: 0, faits: 0, aides: 0, cours: 0}, etat: "fini"});
  assert.equal(r.mondes[2].total, 15);
  assert.equal(r.mondes[2].faits, 1);
  assert.equal(r.mondes[2].bonus.total, 10);
  assert.equal(r.mondes[2].bonus.faits, 1);
  assert.equal(r.mondes[3].bonus.total, 4);
  assert.equal(r.etapes.enq10, "aide");
  assert.equal(r.etapes.enq11, "cours");
  assert.equal(r.etapes.enq12, "vide");
  // Un Bonus fait seul met son monde « en cours », pas « fini ».
  const q = PARCOURS.enregistrerSerie(PARCOURS.creer(), "sys25d", serie(true, 4, 4, 0), "2026-10-03");
  assert.equal(PARCOURS.resumeProf(q, ETAPES, BONUS).mondes[3].etat, "cours");
  assert.deepEqual(PARCOURS.resumeProf(PARCOURS.creer(), ETAPES, BONUS).mondes.map(m => m.etat), ["vide", "vide", "vide", "vide", "vide", "vide"]);
});

// Échauffement du monde 6 (lot 2 « suivi », 14/10/2026 ; décision de Gwenaël :
// « dans le total », 0 / 9 sur le monde, « sur 40 » sur la tuile).
test("échauffement : É1 compte UNE étape du monde 6 (1 / 40, monde 6 : 1 / 9), pas un Bonus ; part au serveur à sa place", () => {
  let p = PARCOURS.enregistrerSerie(PARCOURS.creer(), "ech1", serie(true, 12, 12, 0), "2026-10-15");
  const r = PARCOURS.resumeProf(p);
  assert.deepEqual([r.faits, r.total], [1, 40]);
  assert.deepEqual([r.mondes[5].numero, r.mondes[5].faits, r.mondes[5].total, r.mondes[5].etat], [6, 1, 9, "cours"]);
  assert.deepEqual(r.bonus, {total: 14, faits: 0, aides: 0, cours: 0}, "une étape, pas un Bonus");
  assert.equal(r.etapes.ech1, "reussie");
  p = PARCOURS.enregistrerSerie(p, "ech1", serie(true, 9, 12, 2), "2026-10-16");
  assert.equal(PARCOURS.resumeProf(p).faits, 1, "rejouée : toujours une seule étape");
  p = PARCOURS.enregistrerSerie(p, "m3e4", serie(true, 4, 4, 0), "2026-10-14");
  p = PARCOURS.enregistrerSerie(p, "m4e1", serie(true, 4, 4, 0), "2026-10-16");
  p.etapes.ech9 = {fait: true, etoiles: 12, cartes: 12, vues: 0, essais: 1, date: "2026-10-16"};
  const envoi = PARCOURS.pourServeur(p);
  assert.deepEqual(Object.keys(envoi.etapes), ["m3e4", "ech1", "m4e1"], "dans l'ordre de la carte ; « ech9 » ne part pas");
  assert.deepEqual(envoi.etapes.ech1, {fait: true, etoiles: 12, cartes: 12, vues: 0, essais: 2, date: "2026-10-15"}, "la meilleure série");
});

test("échauffement : un élève qui avait fini le monde 6 passe à 6 / 9, « en cours » ; les étoiles 38-43 ne bougent pas", () => {
  let p = PARCOURS.creer();
  ["m4e1", "m4e2", "m4e3", "m4e4", "m4e5", "m4e6"].forEach(id => { p = PARCOURS.enregistrerSerie(p, id, serie(true, 4, 4, 0), "2026-10-10"); });
  const avant = JSON.stringify(p);
  const r = PARCOURS.resumeProf(p);
  assert.deepEqual([r.mondes[5].faits, r.mondes[5].total, r.mondes[5].etat], [6, 9, "cours"]);
  assert.deepEqual(["ech1", "ech2", "ech3", "m4e1", "m4e6"].map(id => r.etapes[id]), ["vide", "vide", "vide", "reussie", "reussie"]);
  assert.equal(JSON.stringify(p), avant, "lire ne touche à rien");
  ["ech1", "ech2", "ech3"].forEach(id => { p = PARCOURS.enregistrerSerie(p, id, serie(true, 12, 12, 0), "2026-10-17"); });
  assert.deepEqual([PARCOURS.resumeProf(p).mondes[5].faits, PARCOURS.resumeProf(p).mondes[5].etat], [9, "fini"]);
});

// ------------------------------------------------------------- les cases par code

test("la clé sans code est celle d’aujourd’hui ; sous un code, l’empreinte (sel + SHA-256), jamais le code en clair", () => {
  const local = fauxStockage({[PARCOURS.CLE_STOCKAGE]: JSON.stringify(caseAncienne())});
  assert.equal(PARCOURS.cleStockage("", local), "mathsgo-splat-parcours");
  assert.equal(PARCOURS.cleStockage("mauvais", local), "mathsgo-splat-parcours", "un code invalide : la case sans code");
  const cle = PARCOURS.cleStockage(A, local);
  assert.match(cle, /^mathsgo-splat-parcours:[0-9a-f]{16}$/);
  assert.equal(PARCOURS.cleStockage(" axkq7t ", local), cle, "le code se normalise (majuscules, espaces)");
  assert.notEqual(PARCOURS.cleStockage(B, local), cle);
  assert.match(local.getItem(PARCOURS.CLE_SEL), /^[0-9a-f]{32}$/, "le sel de l’appareil, propre à SPLAT!");
  assert.notEqual(PARCOURS.CLE_SEL, "mathsgo-defi-tables-sel");
  // Le même code, un autre appareil (autre sel) : une autre clé.
  const autre = fauxStockage();
  assert.notEqual(PARCOURS.cleStockage(A, autre), cle);
  assert.equal(PARCOURS.sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(PARCOURS.empreinteCode(A, "00".repeat(16)).length, 16);
});

test("charger / sauver / effacer : la case d’aujourd’hui se lit telle quelle, chaque code a sa case, rien ne se mélange", () => {
  const local = fauxStockage({[PARCOURS.CLE_STOCKAGE]: JSON.stringify(caseAncienne())});
  const sansCode = PARCOURS.charger(local, "");
  assert.equal(sansCode.etapes.m1e1.fait, true, "le travail d’aujourd’hui, sans code, est là");
  assert.equal(PARCOURS.estVide(PARCOURS.charger(local, A)), true, "la case du code part vide : pas de transfert (Q4)");
  PARCOURS.sauver(local, parcoursAvecTravail("m1e2"), A);
  PARCOURS.sauver(local, parcoursAvecTravail("m1e3"), B);
  assert.deepEqual(Object.keys(PARCOURS.charger(local, A).etapes), ["m1e2"]);
  assert.deepEqual(Object.keys(PARCOURS.charger(local, B).etapes), ["m1e3"]);
  assert.deepEqual(PARCOURS.charger(local, ""), sansCode, "la case sans code n’a pas bougé");
  assert.equal(PARCOURS.clesRevelentUnCode(local), false);
  assert.equal(local.cles().filter(c => c.startsWith("mathsgo-splat-parcours")).length, 3);
  // Ce qui est écrit sous un code est normalisé (format D2) et relu à l'identique.
  const brut = JSON.parse(local.getItem(PARCOURS.cleStockage(A, local)));
  // Lot S1 « les journaux » : et le journal du jour joué.
  assert.deepEqual(Object.keys(brut), ["version", "epoque", "etapes", "jours", "journal", "depuis"]);
  PARCOURS.effacer(local, A);
  assert.equal(PARCOURS.estVide(PARCOURS.charger(local, A)), true);
  assert.deepEqual(Object.keys(PARCOURS.charger(local, B).etapes), ["m1e3"], "effacer A ne touche pas B");
  // Un stockage cassé : rien ne casse.
  const casse = {getItem() { throw new Error("quota"); }, setItem() { throw new Error("quota"); }, removeItem() { throw new Error("quota"); }};
  assert.deepEqual(PARCOURS.charger(casse, A), PARCOURS.creer());
  assert.equal(PARCOURS.sauver(casse, PARCOURS.creer(), A), false);
  assert.deepEqual(PARCOURS.charger(null, ""), PARCOURS.creer());
});

test("l’état d’envoi vit à côté de la case (mathsgo-splat-sync[:empreinte]) et la purge retire les cases dormantes, jamais l’active", () => {
  const local = fauxStockage();
  assert.deepEqual(PARCOURS.chargerSync(local, A), {revision: 0, dirty: false, detache: false, maj: 0});
  PARCOURS.sauverSync(local, A, {revision: 4, dirty: true, maj: 1000});
  assert.deepEqual(PARCOURS.chargerSync(local, A), {revision: 4, dirty: true, detache: false, maj: 1000});
  assert.equal(PARCOURS.cleSync("", local), "mathsgo-splat-sync");
  assert.match(PARCOURS.cleSync(A, local), /^mathsgo-splat-sync:[0-9a-f]{16}$/);
  PARCOURS.sauver(local, parcoursAvecTravail("m1e1"), A);
  PARCOURS.sauver(local, parcoursAvecTravail("m1e2"), B);
  PARCOURS.sauverSync(local, B, {revision: 1, maj: 1000});
  PARCOURS.sauver(local, parcoursAvecTravail("m1e3"), "");
  const dans100Jours = 1000 + 100 * 24 * 3600 * 1000;
  assert.equal(PARCOURS.purger(local, {maintenant: dans100Jours, garder: A}), 1, "B dort depuis 100 jours, A est la case active");
  assert.equal(PARCOURS.estVide(PARCOURS.charger(local, B)), true);
  assert.equal(PARCOURS.estVide(PARCOURS.charger(local, A)), false);
  assert.equal(PARCOURS.estVide(PARCOURS.charger(local, "")), false, "la case sans code n’est jamais purgée");
  PARCOURS.effacerSync(local, A);
  assert.equal(PARCOURS.chargerSync(local, A).revision, 0);
});

test("le code et l’identité de l’onglet : les MÊMES clés que Défi tables (un élève identifié l’est pour les deux applis)", () => {
  assert.equal(PARCOURS.CLE_CODE, "mathsgo-suivi-code");
  assert.equal(PARCOURS.CLE_IDENTITE, "mathsgo-suivi-identite");
  assert.equal(PARCOURS.CLE_DERNIER_GESTE, "mathsgo-suivi-dernier-geste");
  const session = fauxStockage();
  assert.equal(PARCOURS.sauverCode(session, "AB12"), false, "trop court");
  assert.equal(PARCOURS.sauverCode(session, "ABCD01"), false, "0 et 1 ne sont pas dans l’alphabet");
  assert.equal(PARCOURS.chargerCode(session), "");
  assert.equal(PARCOURS.sauverCode(session, " bz4mhp"), true);
  assert.equal(PARCOURS.chargerCode(session), B);
  assert.equal(session.getItem("mathsgo-suivi-code"), B, "lisible par Défi tables dans le même onglet");
  assert.equal(PARCOURS.codeValide("ABCDE0"), false, "ni 0 ni O ni I ni 1 dans l’alphabet des codes");
  assert.equal(PARCOURS.codeValide("ABCDEF"), true);
  PARCOURS.sauverIdentiteOnglet(session, B, {prenom: "  Léa  Marie ", classe: "405"});
  assert.deepEqual(PARCOURS.chargerIdentiteOnglet(session, B), {prenom: "Léa Marie", classe: "405"});
  assert.equal(PARCOURS.chargerIdentiteOnglet(session, A), null, "l’identité ne vaut que pour SON code");
  PARCOURS.effacerCode(session);
  assert.equal(PARCOURS.chargerCode(session), "");
  assert.equal(session.getItem("mathsgo-suivi-identite"), null, "effacer le code efface aussi l’identité");
});

test("lireEntree : le billet du <head> (MATHSGO_ENTREE) ou du fragment #b= ; une ancre ordinaire n’est pas une entrée", () => {
  assert.deepEqual(PARCOURS.lireEntree({MATHSGO_ENTREE: {billet: "b".repeat(32)}}), {billet: "b".repeat(32)});
  assert.deepEqual(PARCOURS.lireEntree({location: {hash: "#b=" + "c".repeat(32)}}), {billet: "c".repeat(32)});
  assert.deepEqual(PARCOURS.lireEntree({location: {hash: "#enq-bonus"}}), {billet: ""});
  assert.deepEqual(PARCOURS.lireEntree({location: {hash: "#sys-bonus&b=xyz"}}), {billet: "xyz"});
  assert.deepEqual(PARCOURS.lireEntree(null), {billet: ""});
});
