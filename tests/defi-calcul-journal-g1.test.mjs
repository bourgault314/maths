// Défi calcul, lot G1 « journal + accueil » (07/11/2026) : le journal des
// séances, les deux dates de chaque compétence, la fusion entre deux
// appareils (la check-list du modèle commun, AGENTS.md), ce que l'accueil de
// l'élève pourra voir de sa semaine, ce que lit la page prof, la version 5.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
// Lot F4 : ces tests suivent le parcours module par module — les tests de
// palier y sont déjà joués (tests/defi-calcul-lot-F4.test.mjs les joue).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});
const CARTE_REELLE = CORE.carte();
// Tout ce qui a un palier est « construit » : il y a toujours une nouveauté.
const CARTE = {modules: CARTE_REELLE.modules.map(fiche => Object.assign({}, fiche, {construit: fiche.paliers.some(Boolean)})), ordre: CARTE_REELLE.ordre};
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

// Mercredi 11 novembre 2026 ; le lundi de sa semaine est le 9.
const MERCREDI = "2026-11-11";
const LUNDI = "2026-11-09";
const plus = (jour, n) => P.ajouterJours(jour, n);

const reussie = () => [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
const ratee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const vide = () => ({calculs: [], justes: [], nouveautes: [], prouvees: [], rouges: [], minutes: [], numero: []});
// Les six nombres du lot G1 (sans le numéro de la séance, ajouté au correctif du lot S1).
const SIX = ["calculs", "justes", "nouveautes", "prouvees", "rouges", "minutes"];
const entree = (p, i) => SIX.map(champ => p.journal[champ][i]);

// Une séance jouée jusqu'au bout, comme la page : chaque étape reçoit d'abord
// son temps actif (noterTemps), puis le moteur. `juste(module, niveau)` : la
// réponse à un calcul du jour ; `marche(module)` : ce que prouve le test ;
// `entrainement` : "reussi" ou "rate".
// Lot 1 « la séance » : la séance au temps (10 minutes) ; `nouveautes` ne
// règle plus rien.
function jouerSeance(p, jour, {secondes = 120, juste = () => true, marche = () => 0, entrainement = "reussi", minutes = 10} = {}) {
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: jour, minutes});
  const n = p.seance.n;
  for (let tour = 0; tour < 30 && p.seance.n === n; tour += 1) {
    const etape = P.fileSeance(p, CARTE, {aujourdhui: jour}).etapes[0];
    if (!etape || etape.type === "avance") break;
    p = P.noterTemps(p, secondes);
    if (etape.type === "jour") {
      P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(c => {
        p = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: juste(c.module, c.niveau), ms: 2000, type: "P"}, {aujourdhui: jour}).parcours;
      });
      p = P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
    } else if (etape.type === "test") {
      // (Lot 7e-2 : un test peut commencer plus haut — un niveau pas encore
      // joué d'un module commencé a son test.)
      const de = (P.marchesDuTest(p, CARTE, etape.module) || {de: 1}).de;
      const m = Math.min(marche(etape.module), P.NIVEAUX[etape.module] - de + 1);
      const niveaux = Array.from({length: Math.min(P.NIVEAUX[etape.module] - de + 1, m + 1)}, (_, i) => ({niveau: de + i, justes: i < m ? 3 : 0, total: 3}));
      p = P.appliquerTest(p, {module: etape.module, marche: m ? de + m - 1 : 0, niveaux}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
    } else {
      // Lot 2 : J'apprends en une étape (on montre, puis l'élève fait).
      const reponses = etape.type === "apprends" && entrainement === "rate" ? ratee() : reussie();
      p = P.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: etape.type, reponses}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
    }
  }
  return p;
}

// ------------------------------------------------- la fusion : la check-list

// Deux appareils, le même élève : la fusion rend la même chose dans les deux
// sens, ne perd aucune séance d'un jour au plus grand des deux comptes, et le
// journal suit ses séances.
// `divergentes` : deux histoires différentes (pas une copie de l'autre) —
// la fusion des MODULES (d'avant le lot G1) peut alors demander un tour de
// plus (« J'apprends » le plus prudent) ; les séances et le journal, non.
function deuxSens(a, b, {divergentes = false} = {}) {
  const ab = P.fusionner(a, b);
  const ba = P.fusionner(b, a);
  assert.deepEqual(ab, ba, "le même résultat dans les deux sens");
  assert.deepEqual(P.fusionner(ab, ab), ab, "rien à refaire");
  [a, b].forEach(copie => {
    const encore = P.fusionner(ab, copie);
    if (divergentes) assert.deepEqual([encore.seances, encore.journal, encore.seance], [ab.seances, ab.journal, ab.seance], "une copie qui revient ne change ni les séances ni le journal");
    else assert.deepEqual(encore, ab, "une copie qui revient ne change rien");
  });
  P.JOURNAL.forEach(champ => assert.equal(ab.journal[champ].length, ab.seances.length));
  return ab;
}

// ------------------------------------------------------ l'accueil de l'élève

// ------------------------------------------------------------ la page prof

// ----------------------------------------------------------- la taille, le serveur

test("taille : un élève qui a tout rempli tient sous les bornes du serveur", async () => {
  const {parcoursComplet} = await import("../scripts/generer-parcours-reference-defi-calcul.mjs");
  const pire = P.mesurer(parcoursComplet({causes: P.SEUILS.causes, entier: true}));
  assert.ok(pire.cles < 2000, `${pire.cles} clés`);
  assert.ok(pire.octets < 40000, `${pire.octets} octets`);
  // Le journal plein (60 séances aux plus grands nombres) et les dates de
  // toutes les compétences y sont.
  const complet = parcoursComplet();
  assert.equal(complet.journal.calculs.length, 60);
  assert.ok(complet.modules.A2.d.every(Boolean));
});

// ------------------------------------------------------------- la page élève

test("la page élève : le temps actif donné au moteur", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /defi_calcul_mon_parcours\.js\?v=20261126-1/);
  assert.match(page, /defi_calcul\.css\?v=20261125-7/, "la feuille a changé au lot 3b « Chaque sorte annoncée »");
  // (Lot K1 : l'accueil ne montre plus la semaine — la ligne des jours est
  // sur Mon espace.)
  assert.ok(!page.includes('id="acc-semaine"'));
  // Le temps : avant chaque fin d'étape, et quand on arrête au milieu.
  const finish = page.slice(page.indexOf("function finish()"), page.indexOf("function poserVerdict("));
  assert.ok(finish.indexOf("verserTempsActif();") > 0 && finish.indexOf("verserTempsActif();") < finish.indexOf("PARCOURS.terminerCalculsDuJour"), "fin d'étape : le temps d'abord");
  // Lot 2 « J'apprends en une étape » : la fin des temps de la leçon
  // n'enregistre plus rien ; J'apprends se termine dans finish (le temps
  // d'abord, vérifié plus haut).
  const apprends = page.slice(page.indexOf("function avancerTemps()"), page.indexOf("function repondreTemps()"));
  assert.ok(!apprends.includes("PARCOURS.appliquerSerie"), "rien n'est enregistré à la fin d'un temps");
  assert.ok(finish.indexOf("verserTempsActif();") < finish.indexOf("PARCOURS.appliquerSerie"), "J'apprends : le temps d'abord");
  const quitter = page.slice(page.indexOf("function quitterSerie()"), page.indexOf("const DELAI_SUIVANT"));
  assert.ok(quitter.indexOf("verserTempsActif()") < quitter.indexOf("state.seance = null"));
  assert.match(page, /const TROU_ACTIF_MS = 60000;/);
});

// ------------------------------- le correctif après la relecture de Codex

// Une séance au journal connu : [calculs, justes, nouveautés, prouvées,
// rouges, minutes].
const ligneJ = (calculs, minutes = 5) => [calculs, calculs, 0, 0, 0, minutes];
// Une progression écrite à la main : des séances et leur journal.
function avecJournal(paires, extra = {}) {
  const journal = vide();
  paires.forEach(([, e]) => P.JOURNAL.forEach((champ, i) => journal[champ].push(e[i])));
  return P.normaliserParcours(Object.assign({version: 5, seances: paires.map(([jour]) => jour), journal}, extra));
}

// Correctif du lot S1 (relecture de Codex) : chaque séance écrite par la page
// a son numéro, rang dans la journée × 10 000 + un tirage.
const numerotee = (e, numero) => [...e, numero];

// Une étape d'une séance, comme la page.
function jouerEtape(p, jour, etape, {entrainement = "reussi"} = {}) {
  if (etape.type === "jour") {
    P.tirerCalculsDuJour(p, CARTE, {aujourdhui: jour}).forEach(c => {
      p = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: true, ms: 2000, type: "P"}, {aujourdhui: jour}).parcours;
    });
    return P.terminerCalculsDuJour(p, {aujourdhui: jour, carte: CARTE}).parcours;
  }
  if (etape.type === "test") {
    // (Lot 7e-2 : le test commence au premier niveau pas encore joué.)
    const de = (P.marchesDuTest(p, CARTE, etape.module) || {de: 1}).de;
    return P.appliquerTest(p, {module: etape.module, marche: 0, niveaux: [{niveau: de, justes: 0, total: 3}]}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
  }
  const reponses = etape.type === "apprends" && entrainement === "rate" ? ratee() : reussie();
  return P.appliquerSerie(p, {module: etape.module, niveau: etape.niveau, genre: etape.type, reponses}, {aujourdhui: jour, carte: CARTE, seance: true}).parcours;
}

test("Codex 4 (la page) : un seul endroit verse le temps, avant chaque sortie et avant la sauvegarde", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const corps = nom => page.slice(page.indexOf(`function ${nom}(`), page.indexOf("\n      }\n", page.indexOf(`function ${nom}(`)));
  // Le seul appel au moteur, et le compteur vidé de ce qui est versé.
  assert.equal(page.split("PARCOURS.noterTemps(").length - 1, 1, "un seul endroit verse le temps");
  const verser = corps("verserTempsActif");
  assert.ok(verser.includes("PARCOURS.noterTemps("));
  assert.ok(verser.includes("actif.ms -= secondes * 1000;") && verser.indexOf("actif.ms -= secondes * 1000;") < verser.indexOf("PARCOURS.noterTemps("), "le compteur est vidé de ce qui est versé, avant de verser");
  // Avant chaque sortie, puis la sauvegarde.
  // (Lot K1 : « Arrêter la séance » laisse la séance ouverte — elle se
  // reprend aujourd'hui — et revient à l'accueil.)
  [["quitterSerie", "arreterActivite();"], ["quitterSeance", "versAccueil();"], ["fermerLaPage", "envoyerAvantDeFermer();"]].forEach(([nom, apres]) => {
    const c = corps(nom);
    assert.ok(c.includes("if (verserTempsActif()) sauverParcours();"), `${nom} : le temps, puis la sauvegarde`);
    assert.ok(c.includes(apres), `${nom} : « ${apres} »`);
    assert.ok(c.indexOf("verserTempsActif()") < c.indexOf(apres), `${nom} : avant « ${apres} »`);
  });
  // La page cachée, fermée ou rechargée passe par là.
  assert.match(page, /window\.addEventListener\("pagehide", fermerLaPage\);/);
  assert.match(page, /if \(document\.visibilityState === "hidden"\) fermerLaPage\(\);/);
  assert.ok(!/addEventListener\("pagehide", envoyerAvantDeFermer\)/.test(page), "plus d'envoi sans le temps");
  // Un onglet caché arrête le compte (il reprend au geste suivant).
  assert.match(corps("compterTempsActif"), /actif\.dernier = enSeance\(\) && document\.visibilityState !== "hidden" \? maintenant : null;/);
});

