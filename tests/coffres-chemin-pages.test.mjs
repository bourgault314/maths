import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// Lot « Coffres magiques : le chemin des coffres et le cadeau Gloubi »
// (09/11/2026) — ce que les deux pages promettent : l'appli solo s'ouvre sur
// « Tes coffres » pour l'élève connecté (et pour lui seul), le trésor ouvert
// devient un coffre gagné, le coffre d'or offre trois matchs contre Gloubi ;
// la page des Carrés gloutons joue ces matchs en « mode cadeau » et les note
// dans le parcours. Le parcours au navigateur est vérifié sur un banc (notice
// du lot) ; ici, ce qui doit tenir dans le texte des pages, et les fonctions
// du cadeau exécutées.
const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const SOLO = lire("outils/calcul_mental/coffres_magiques_solo.html");
const CARRES = lire("outils/club_maths/carres_gloutons.html");
const P = createRequire(import.meta.url)("../assets/js/coffres-parcours.js");

function bloc(source, debut) {
  const i = source.indexOf(debut);
  assert.ok(i >= 0, `introuvable : ${debut}`);
  const ouvre = source.indexOf("{", i);
  let n = 0;
  for (let k = ouvre; k < source.length; k += 1) {
    if (source[k] === "{") n += 1;
    else if (source[k] === "}" && --n === 0) return source.slice(i, k + 1);
  }
  throw new Error("bloc non fermé");
}
const fonction = (source, nom) => bloc(source, `function ${nom}(`);

// ------------------------------------------------------------- l'appli solo

test("solo : « Tes coffres » et le trésor de l'élève sont des fenêtres à part ; le visiteur garde « Trésor ouvert ! »", () => {
  assert.match(SOLO, /<section id="chemin" class="overlay" hidden role="dialog" aria-modal="true" aria-labelledby="chemin-title">/);
  assert.match(SOLO, /<h2 id="chemin-title" tabindex="-1">Tes coffres<\/h2>/);
  assert.match(SOLO, /<button id="chemin-autre" class="chemin-autre" type="button">Entraînement libre<\/button>/);
  assert.match(SOLO, /<section id="tresor" class="overlay" hidden role="dialog"/);
  assert.match(SOLO, /<h2 id="result-title" tabindex="-1">Trésor ouvert !<\/h2>\s*<p>Tu as ouvert les dix coffres\.<\/p>/, "le visiteur : inchangé");
  assert.match(SOLO, /<script src="\.\.\/\.\.\/assets\/js\/coffres-parcours\.js\?v=20261109-1"><\/script>/);
});

test("solo : le chemin des coffres est pour l'élève connecté SEULEMENT (code dans l'onglet, moteur chargé)", () => {
  assert.match(fonction(SOLO, "cheminActif"), /return Boolean\(SUIVI && SUIVI\.actif\(\) && PARCOURS && PARCOURS\.cheminDesCoffres\);/);
  assert.match(fonction(SOLO, "demarrerEleve"), /if \(cheminActif\(\)\) \{\s*ouvrirChemin\(\);\s*return;\s*\}/);
  assert.match(fonction(SOLO, "complete"), /suiviEcrire\(\(P, avant\) => P\.noterTresor\(avant, null, \{ niveau: gameLevel \}\)\);\s*if \(cheminActif\(\)\) \{\s*ouvrirTresor\(\);\s*return;\s*\}\s*document\.querySelector\("#result-score"\)/);
});

test("solo : le gros bouton — Gloubi d'abord s'il attend, sinon reprendre la partie, sinon le prochain coffre", () => {
  const chemin = fonction(SOLO, "ouvrirChemin");
  assert.match(chemin, /const c = PARCOURS\.cheminDesCoffres\(parcoursEleve\(\), reglages\);/);
  assert.match(chemin, /jouer = \[`Reprendre · \$\{partie\.cles\} clé\$\{partie\.cles > 1 \? "s" : ""\} sur \$\{GOAL\}`, \(\) => reprendre\(partie\)\];/);
  assert.match(chemin, /jouer = \[`Gagner le \$\{nom\}\$\{matchs \? ` · niveau \$\{c\.prochain\.niveau\}` : ""\}`, \(\) => jouerAuNiveau\(c\.prochain\.niveau\)\];/);
  assert.match(chemin, /if \(matchs\) \{\s*poserBouton\(principal, "Jouer contre Gloubi", \(\) => allerVersGloubi\(c\.gloubi\[0\]\.niveau\)\);\s*poserBouton\(second, jouer\[0\], jouer\[1\]\);/);
  assert.match(chemin, /document\.querySelector\("#chemin-cadeau"\)\.hidden = !matchs;/, "rien de Gloubi avant un coffre d'or (la surprise)");
  assert.match(chemin, /autre\.hidden = !\(ouverts\.length > 1 \|\| opsDuChemin\.length > 1\);/);
  assert.match(fonction(SOLO, "rangeeNiveau"), /nom\.textContent = `\$\{ouvert && !verrou \? "" : "🔒 "\}Niveau \$\{numero\}`;/, "un niveau fermé ou pas encore ouvert reste visible, avec un cadenas");
  assert.match(fonction(SOLO, "allerVersGloubi"), /window\.location\.assign\(`\$\{ADRESSE_GLOUBI\}\?cadeau=\$\{niveau\}`\);/);
  assert.match(SOLO, /const ADRESSE_GLOUBI = "\.\.\/club_maths\/carres_gloutons\.html";/);
});

test("solo : le cours ne s'ouvre qu'au premier passage dans un niveau ; « Aide » reste dans le jeu", () => {
  assert.match(fonction(SOLO, "premierPassage"), /return !p \|\| !p\.niveaux\[String\(niveau\)\];/);
  assert.match(fonction(SOLO, "jouerAuNiveau"), /if \(premierPassage\(niveau\)\) openLesson\(\);\s*else start\(\{ moveFocus: true \}\);/);
  assert.match(fonction(SOLO, "confirmSettings"), /if \(\(!gameStarted \|\| changed\) && cheminActif\(\) && !premierPassage\(level\)\) start\(\{ moveFocus: true \}\);\s*else if \(!gameStarted \|\| changed\) openLesson\(\);/);
  assert.match(SOLO, /<button id="help-button" class="help-button" type="button">Aide<\/button>/);
});

test("solo : le trésor gagné — bronze et argent annoncent le suivant ; l'or offre Gloubi, et « Plus tard » garde les matchs", () => {
  const tresor = fonction(SOLO, "ouvrirTresor");
  assert.match(tresor, /texte\.textContent = `Tu as ouvert les dix coffres\. Encore \$\{GOAL\} clés pour le \$\{NOMS_COFFRE\[suivant\]\}\.`;/);
  assert.match(tresor, /poserBouton\(principal, `Continuer vers le \$\{NOMS_COFFRE\[suivant\]\}`, \(\) => jouerAuNiveau\(gameLevel\)\);/);
  assert.match(tresor, /\} else if \(couleur === "or" && matchs > 0\) \{\s*titre\.textContent = TITRES_COFFRE\.or;\s*texte\.textContent = `Tu as fini le niveau \$\{gameLevel\}\.`;\s*cadeau\.hidden = false;/);
  assert.match(tresor, /poserBouton\(second, "Plus tard", \(\) => \{ dialogs\.close\(tresor, \{ restoreFocus: false \}\); ouvrirChemin\(\); \}\);/, "« Plus tard » n'écrit rien : les matchs attendent dans le parcours");
  assert.doesNotMatch(tresor, /suiviEcrire|noterMatchGloubi/);
  assert.match(SOLO, /<strong>Ton cadeau : 3 matchs contre Gloubi<\/strong><span>Ferme plus de carrés que lui\.<\/span>/);
  assert.match(SOLO, /const TITRES_COFFRE = \{ bronze: "Coffre de bronze !", argent: "Coffre d’argent !", or: "Coffre d’or !" \};/);
});

// -------------------------------------------------------- les Carrés gloutons

test("Carrés gloutons : le mode cadeau demande « ?cadeau=1 à 3 » ET un élève suivi ; sinon la page de tout le monde", () => {
  assert.match(CARRES, /<script src="\.\.\/\.\.\/assets\/js\/coffres-parcours\.js\?v=20261109-1"><\/script>\s*<script src="\.\.\/\.\.\/assets\/js\/coffres-suivi\.js\?v=\d{8}-\d+"><\/script>\s*<script src="\.\.\/\.\.\/assets\/js\/gloubi-ia\.js\?v=20261109-1"><\/script>\s*<script>/);
  assert.match(CARRES, /const SUIVI_COFFRES = GLOUBI && PARCOURS_COFFRES && window\.MathsGoCoffresSuivi && \[1, 2, 3\]\.includes\(niveauCadeau\)\s*\? window\.MathsGoCoffresSuivi\.creer\(\{\}\) : null;/);
  assert.match(CARRES, /const cadeau = SUIVI_COFFRES && \(SUIVI_COFFRES\.actif\(\) \|\| SUIVI_COFFRES\.attente\(\)\)/);
  assert.match(CARRES, /html\.gloubi-cadeau \.site-header \{ display: none; \}/, "pas de lien vers le catalogue du site en cadeau");
  assert.match(CARRES, /const move = cadeau \? coupDuGloubi\(\) : chooseAiMove\(\);/, "le visiteur garde le Gloubi d'origine");
  assert.match(fonction(CARRES, "coupDuGloubi"), /return GLOUBI\.choisir\(cadeau\.cran, traces\);/);
  assert.match(CARRES, /if \(cadeau && matchOver\) finDeMatchCadeau\(outcome\);/, "un match n'est noté qu'une fois FINI (deux manches)");
});

// finDeMatchCadeau exécutée, avec le vrai moteur du parcours.
function finDeMatch({ parcours, issue, match = 1, bilan = { gagne: 0, nul: 0, perdu: 0 } }) {
  let case_ = parcours;
  const el = () => ({ textContent: "", hidden: false, className: "" });
  const page = { resultText: el(), resultTitle: el(), nextRound: el(), statusText: el(), result: el(), retour: el() };
  const SUIVI_COFFRES = { lire: () => case_, ecrire: maj => { case_ = maj(P, case_); } };
  const cadeau = { niveau: 1, cran: P.cranGloubi(parcours, 1), match, bilan };
  const source = `${fonction(CARRES, "finDeMatchCadeau")}\nreturn finDeMatchCadeau;`;
  const f = new Function("PLAYER", "AI", "cadeau", "SUIVI_COFFRES", "PARCOURS_COFFRES", "playerMatchSquares", "aiMatchSquares",
    "resultText", "resultTitle", "nextRound", "statusText", "result", "document", "pluriel", source)(
    "player", "ai", cadeau, SUIVI_COFFRES, P, 11, 7, page.resultText, page.resultTitle, page.nextRound, page.statusText, page.result,
    { querySelector: () => page.retour }, (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`);
  f(issue);
  return { case_, page, cadeau };
}

test("Carrés gloutons : un match fini est noté dans le parcours (gagné → Gloubi plus fort), et le suivant est proposé", () => {
  const or = P.normaliser({ niveaux: { "1": { tresors: 3, parfaits: 0 } } });
  const { case_, page, cadeau } = finDeMatch({ parcours: or, issue: "player" });
  assert.equal(case_.niveaux["1"].gloubi, 1);
  assert.equal(cadeau.cran, 2, "gagné contre le distrait : le gourmand au match suivant");
  assert.equal(page.nextRound.textContent, "Jouer le match 2");
  assert.equal(page.nextRound.hidden, false);
  assert.equal(page.resultText.textContent, "Total du match : 11 à 7. Il te reste 2 matchs contre Gloubi.");
});

test("Carrés gloutons : après le 3e match, le bilan et seulement « Retour à mes coffres » (pas de « Rejouer »)", () => {
  let p = P.normaliser({ niveaux: { "1": { tresors: 3, parfaits: 0 } } });
  p = P.noterMatchGloubi(p, 1, "gagne");
  p = P.noterMatchGloubi(p, 1, "nul");
  const { case_, page } = finDeMatch({ parcours: p, issue: "player", match: 3, bilan: { gagne: 1, nul: 1, perdu: 0 } });
  assert.equal(case_.niveaux["1"].gloubi, 3);
  assert.equal(P.matchsRestants(case_, 1), 0);
  assert.equal(page.resultTitle.textContent, "Tes 3 matchs sont joués !");
  assert.equal(page.resultText.textContent, "2 matchs gagnés, 1 nul contre Gloubi.");
  assert.equal(page.nextRound.hidden, true);
  assert.equal(page.retour.className, "primary");
  const perdus = finDeMatch({ parcours: P.noterMatchGloubi(P.noterMatchGloubi(P.normaliser({ niveaux: { "1": { tresors: 3 } } }), 1, "perdu"), 1, "perdu"),
    issue: "ai", match: 3, bilan: { gagne: 0, nul: 0, perdu: 2 } });
  assert.equal(perdus.page.resultText.textContent, "3 matchs perdus contre Gloubi.");
});

test("Carrés gloutons : nul → le même Gloubi ; perdu au niveau 1 → jamais sous le distrait", () => {
  const or = P.normaliser({ niveaux: { "1": { tresors: 3, parfaits: 0 } } });
  assert.equal(finDeMatch({ parcours: or, issue: "tie" }).cadeau.cran, 1);
  assert.equal(finDeMatch({ parcours: or, issue: "ai" }).cadeau.cran, 1);
  assert.equal(finDeMatch({ parcours: or, issue: "ai" }).case_.niveaux["1"].gloubi, 1);
});

// ------------------------------------------- progression et entraînement libre
// Décisions de Gwenaël du 11/11/2026 : le niveau suivant s'ouvre avec le coffre
// d'or ; le chemin joue toutes les opérations ouvertes à la classe ; « Entraînement
// libre » : niveau débloqué et opérations au choix, rien n'est enregistré.

test("solo : le chemin joue TOUTES les opérations ouvertes à la classe ; le cadenas dit quel coffre l'ouvre", () => {
  assert.match(fonction(SOLO, "jouerAuNiveau"), /libre = false;[\s\S]*ramenerAuxReglages\(\);\s*selectedOperations = operationsOuvertes\(\);/);
  const chemin = fonction(SOLO, "ouvrirChemin");
  assert.match(chemin, /const opsDuChemin = operationsOuvertes\(\);/);
  assert.match(chemin, /const ouverts = c\.niveaux\.filter\(n => n\.debloque\)\.map\(n => n\.numero\);/, "le niveau joué est toujours débloqué");
  assert.match(chemin, /verrou\.textContent = verrou\.hidden \? "" : `🔒 Le niveau \$\{c\.verrou\.niveau\} s’ouvre avec le coffre d’or du niveau \$\{c\.verrou\.apres\}\.`;/);
  assert.match(SOLO, /<p id="chemin-verrou" class="chemin-verrou" hidden><\/p>/);
});

test("solo : l'entraînement libre — niveaux débloqués, opérations au choix, rien d'enregistré, jamais le plateau du chemin", () => {
  assert.match(SOLO, /let libre = false;/);
  assert.match(fonction(SOLO, "suiviEcrire"), /if \(SUIVI && SUIVI\.actif\(\) && !libre\) SUIVI\.ecrire\(maj\);/);
  assert.match(fonction(SOLO, "niveauxOuverts"), /if \(libre && cheminActif\(\)\) \{\s*const debloques = PARCOURS\.niveauxDebloques\(parcoursEleve\(\), reglagesClasse\(\)\);/);
  assert.match(fonction(SOLO, "ouvrirChemin"), /autre\.onclick = \(\) => \{\s*libre = true;\s*openModeDialog\(\{ mandatory: true \}\);\s*\};/);
  assert.match(fonction(SOLO, "confirmSettings"), /if \(libre && cheminActif\(\)\) \{[\s\S]*?start\(\{ moveFocus: true \}\);\s*return;\s*\}/, "toujours une partie neuve, sans « Repartir à zéro clé ? »");
  assert.match(fonction(SOLO, "reprendre"), /const depuisLibre = libre;\s*libre = false;[\s\S]*if \(!depuisLibre && gameStarted/, "Reprendre ne retombe jamais sur le plateau de l'entraînement");
  assert.match(fonction(SOLO, "ouvrirTresor"), /if \(libre\) \{\s*ouvrirTresorLibre\(\);\s*return;\s*\}/);
  assert.doesNotMatch(fonction(SOLO, "ouvrirTresorLibre"), /suiviEcrire|coffreSvg|allerVersGloubi/, "rien de gagné pour les coffres");
  assert.match(SOLO, /<p id="libre-titre" class="libre-titre" hidden><strong>Entraînement libre<\/strong>Ça ne compte pas pour tes coffres\.<\/p>/);
  assert.match(fonction(SOLO, "syncLevelUi"), /prefixe\.textContent = libre \? "Entraînement libre · " : "Solo · ";\s*levelLabel\.textContent = `niveau \$\{gameLevel\}`;/);
});
