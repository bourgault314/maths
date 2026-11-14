// Lot EN-A1 (14/11/2026, choix de Gwenaël) — l'accueil de l'appli Évaluations nationales, sans serveur :
//  · une page outils/evaluations_nationales/ : quatre onglets 6e 5e 4e 3e (A), les tests de la classe dessous, rangés
//    « Le test national de la rentrée » / « Pour se positionner » / « Exemples de questions » ;
//  · l'écran d'un test : la flèche ramène aux tests de sa classe ; « Refaire mes N questions ratées » depuis cet écran ;
//  · « Explorer les outils » : le bandeau « Évaluations nationales » à côté de celui d'Automatismes.
// Les mesures à l'écran (tout tient dans 1 366 × 657, rien ne bouge d'un onglet à l'autre…) sont dans
// tests/evaluations-nationales-accueil-ecrans.cjs (recette au navigateur).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require("../outils/evaluations_nationales/en_commun.js");
const lire = (c) => readFileSync(new URL("../" + c, import.meta.url), "utf8");
const evaluation = lire("outils/evaluations_nationales/evaluation.html");
for (const m of evaluation.matchAll(/<script src="\.\/((?:sujets\/)?[\w]+\.js)\?v=[^"]+"><\/script>/g))
  if (!/^(en_commun|evaluation)\.js$/.test(m[1])) require(`../outils/evaluations_nationales/${m[1]}`);
const S = globalThis.EN_SUJETS;
const accueil = lire("outils/evaluations_nationales/index.html");
const accueilJs = lire("outils/evaluations_nationales/accueil.js");
const evaluationJs = lire("outils/evaluations_nationales/evaluation.js");
const NIVEAUX = ["6e", "5e", "4e", "3e"];
const listeDe = (n) => accueil.slice(accueil.indexOf(`<div id="liste-${n}"`), accueil.indexOf("</div>", accueil.indexOf(`<div id="liste-${n}"`)));

test("l'accueil : chaque test de l'appli y a sa carte, une seule, dans la liste de sa classe", () => {
  const cartes = [...accueil.matchAll(/<a class="test[^"]*" href="evaluation\.html\?sujet=([\w-]+)" data-sujet="\1">/g)].map((m) => m[1]);
  assert.deepEqual([...cartes].sort(), Object.keys(S).sort(), "une carte par sujet chargé par evaluation.html");
  assert.equal(new Set(cartes).size, cartes.length);
  for (const [id, s] of Object.entries(S)) {
    const liste = listeDe(s.niveau);
    const i = liste.indexOf(`data-sujet="${id}"`);
    assert.ok(i > 0, `${id} est dans la liste de ${s.niveau}`);
    const carte = liste.slice(i, liste.indexOf("</a>", i));
    assert.ok(carte.includes(`<strong>${s.titre}</strong>`), `${id} : titre`);
    assert.ok(carte.includes(`<span class="nb">${s.questions.length}&nbsp;questions</span>`), `${id} : ${s.questions.length} questions, le nombre collé à son mot`);
    assert.equal(carte.includes("calculatrice"), Boolean(s.calculatrice), `${id} : calculatrice`);
    // Les icônes des domaines du site (choix du 14/11, 21 h 40) : le métronome pour les tests d'automatismes.
    const icone = (carte.match(/data-home-icon="([\w-]+)"/) || [])[1];
    const attendue = s.titre === "Automatismes" ? "automatismes" : /Nombres/.test(s.titre) ? "factor-tree" : /Expressions/.test(s.titre) ? "splat"
      : /Grandeurs/.test(s.titre) ? "equal-volume-vase" : /éométrie/.test(s.titre) ? "seigaiha" : "strategy";
    assert.equal(icone, attendue, `${id} : icône ${attendue}`);
    // Le rangement suit la famille du sujet.
    const avant = liste.slice(0, i);
    const groupe = [...avant.matchAll(/<p class="groupe-titre">([^<]+)<\/p>/g)].pop()[1];
    const attendu = !s.famille ? "Le test national de la rentrée" : s.famille === "Outil de positionnement" ? "Pour se positionner" : "Exemples de questions";
    assert.equal(groupe, attendu, `${id} : rangé sous « ${attendu} »`);
  }
});

test("l'accueil : quatre onglets, une classe retenue sur l'appareil, ?niveau= pour un lien direct", () => {
  for (const n of NIVEAUX) {
    assert.match(accueil, new RegExp(`<button id="onglet-${n}" type="button" role="tab" data-niveau="${n}" aria-controls="liste-${n}"`));
    assert.match(accueil, new RegExp(`<div id="liste-${n}" class="liste" role="tabpanel" aria-labelledby="onglet-${n}">`));
  }
  assert.match(accueilJs, /const NIVEAUX = \["6e", "5e", "4e", "3e"\];/);
  assert.match(accueilJs, /const CLE_NIVEAU = "mathsgo-en-niveau";/);
  assert.match(accueilJs, /get\("niveau"\)/);
  // Le dernier résultat vient de la clé que garde l'appli d'évaluation.
  assert.match(accueilJs, /lire\("mathsgo-en-" \+ carte\.dataset\.sujet\)/);
  assert.match(evaluationJs, /const CLE = "mathsgo-en-" \+ sujet\.id;/);
  assert.match(accueil, /<script src="\.\/accueil\.js\?v=\d{8}-\d+"><\/script>/);
  // Les icônes : les scripts de la page d'accueil du site, aux mêmes versions qu'elle.
  const home = lire("index.html");
  for (const f of ["mathsgo-icon-library", "daily-metronome", "daily-factor-tree", "daily-strategy-fractal", "daily-splat-letter", "daily-vase-curves", "daily-rosettes", "domain-icon-renderer", "accueil-domain-icons"]) {
    const v = home.match(new RegExp(`assets/js/${f}\\.js\\?v=([\\w-]+)`))[1];
    assert.ok(accueil.includes(`/assets/js/${f}.js?v=${v}"`), `${f}.js à la version de l'accueil du site (${v})`);
  }
});

test("l'accueil : sans JavaScript, les quatre classes restent visibles (seul html.js cache une liste)", () => {
  // La classe « js » est posée avant la feuille de style ; chaque règle qui cache une liste est préfixée par html.js.
  assert.ok(accueil.indexOf('document.documentElement.classList.add("js")') < accueil.indexOf("<style>"));
  for (const r of accueil.matchAll(/([^{}\n]*\.cachee[^{}]*)\{/g)) assert.match(r[1].trim(), /^html\.js /, r[1]);
  assert.match(accueil, /html:not\(\.js\) \.niveaux\{display:none\}/);
});

test("l'accueil : page d'appli — pas de pied de page, hors moteurs de recherche comme l'appli", () => {
  assert.doesNotMatch(accueil, /<footer/);
  assert.doesNotMatch(accueil, /mention-confidentialite/);
  assert.match(accueil, /<meta name="robots" content="noindex, follow">/);
  assert.match(accueil, /<a class="retour" href="\/outils\/index\.html"/);
});

test("l'écran d'un test : la flèche ramène aux tests de sa classe ; sans sujet, on va à l'accueil", () => {
  assert.match(evaluation, /<a id="retour" class="retour" href="\.\/"/);
  assert.match(evaluationJs, /\$\("#retour"\)\.href = `\.\/\?niveau=\$\{encodeURIComponent\(sujet\.niveau\)\}`;/);
  assert.match(evaluationJs, /if \(!sujet\) \{ location\.replace\("\.\/"\); return; \}/);
  assert.doesNotMatch(evaluationJs, /\|\| window\.EN_SUJETS\["6e-automatismes"\]/);
});

test("l'écran d'un test : les questions ratées du dernier sujet sont gardées et se refont depuis l'écran du test", () => {
  assert.match(evaluation, /<button id="refaire-accueil" class="carte rates" type="button" hidden>/);
  // Gardées au bilan d'un sujet entier, avec le sujet officiel de référence.
  assert.match(evaluationJs, /modele: passation\.modele \? passation\.modele\.cle : null,/);
  assert.match(evaluationJs, /rates: resultats\.filter\(\(x\) => !x\.juste\)\.map\(\(x\) => x\.it\.q\.num\)/);
  // Après les avoir refaites, seules les encore ratées restent.
  assert.match(evaluationJs, /if \(d && Array\.isArray\(d\.rates\)\) \{ d\.rates = resultats\.filter/);
  // Pas de jumeaux, pas de carte ; le jumeau est celui du sujet officiel du passage.
  assert.match(evaluationJs, /const carteRates = avecJumeaux && rates\.length > 0;/);
  assert.match(evaluationJs, /lancer\("jumeau", rates, null, modele\)/);
});

test("« Explorer les outils » : le bandeau Évaluations nationales à côté d'Automatismes", () => {
  const outils = lire("outils/index.html");
  const bloc = outils.slice(outils.indexOf('<div class="auto-features">'), outils.indexOf('<div class="catalogue-controls">'));
  assert.ok(bloc.includes('<a class="auto-feature" href="../auto/">'));
  assert.ok(bloc.includes('<a class="auto-feature auto-feature-evaluations" href="evaluations_nationales/">'));
  assert.ok(bloc.indexOf("../auto/") < bloc.indexOf("evaluations_nationales/"), "Automatismes d'abord");
  const css = lire("assets/css/catalogue-refonte.css");
  assert.match(css, /\.auto-features \{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.catalogue-deep-view \.auto-features \{\s*display: none;/);
  assert.match(outils, /catalogue-refonte\.css\?v=evaluations-accueil-20261114-1/);
});
