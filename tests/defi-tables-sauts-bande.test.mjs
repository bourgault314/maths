// Lot « sauts sous la bande » de Défi tables (étape 2 du chantier « le
// parcours d'une table », décisions de Gwenaël le 30/09/2026) :
//
// 1. LES SAUTS « + 7 » (idée de Claire). Sous la bande de « Je construis la
//    bande » et de « Je complète une bande à trous », un arc relie deux cases
//    voisines remplies : il descend sous la bande et remonte vers la case
//    d'arrivée (Gwenaël a fait retourner les arcs de la première maquette).
//    Dans « Je construis », on montre en plus le saut À FAIRE, en bleu, vers
//    la case bleue — c'est ce que l'activité enseigne. Dans la bande à trous,
//    rien avant la réponse : sinon on additionne au lieu de se souvenir.
//
// 2. LE CALCUL QUI REVIENT SANS FIN. Dans la bande, à la 3e erreur sur le
//    même calcul, l'appli écrit la réponse dans la case — en ambre, jamais en
//    vert — dit « Je l'écris dans la bande. », et le calcul ne revient plus.
//    Dans l'ordre et le désordre, rien ne change.
//
// 3. LE PASSAGE D'UNE CASE À L'AUTRE, « un peu lent » : 450 ms après une
//    bonne réponse dans la bande (l'effet de la case dure 350 ms), 800 ms
//    partout ailleurs, comme avant.

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

function constante(nom) {
  const m = html.match(new RegExp(`const ${nom} = (\\d+);`));
  assert.ok(m, `la constante ${nom} doit exister`);
  return Number(m[1]);
}

const CASES_BANDE = constante("CASES_BANDE");
const ERREURS_AVANT_REPONSE = constante("ERREURS_AVANT_REPONSE");

// ------------------------------------------------ 1. quels sauts dessiner

const sautsDeLaBande = new Function(`
  const CASES_BANDE = ${CASES_BANDE};
  ${source("sautsDeLaBande")}
  return sautsDeLaBande;
`)();

const sauts = (activite, remplies, m) => sautsDeLaBande(activite, new Set(remplies), m);

test("je construis la bande : les sauts déjà faits, plus le saut à faire vers la case bleue", () => {
  assert.deepEqual(sauts("construct", [], 0), {faits: [], suivant: null}, "« Commence à 0. » : aucun saut");
  assert.deepEqual(sauts("construct", [0], 1), {faits: [], suivant: 0}, "le premier saut, de 0 vers 1 × 7");
  assert.deepEqual(sauts("construct", [0, 1, 2, 3], 4), {faits: [0, 1, 2], suivant: 3});
  assert.deepEqual(sauts("construct", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10), {faits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], suivant: null},
    "bande pleine : dix sauts, plus rien à faire");
});

test("je construis la bande : pas de saut vers ni depuis une case ratée restée vide", () => {
  // 4 × 7 a été raté : la case 4 est vide, on est sur 5 × 7. On n'ajoute pas
  // 7 à un trou — la consigne dit déjà « Complète la case bleue ».
  assert.deepEqual(sauts("construct", [0, 1, 2, 3], 5), {faits: [0, 1, 2], suivant: null});
  // Le calcul raté revient à la fin : 3 × 7 est sous ses yeux, le saut à
  // faire réapparaît.
  assert.deepEqual(sauts("construct", [0, 1, 2, 3, 5, 6, 7, 8, 9, 10], 4), {faits: [0, 1, 2, 5, 6, 7, 8, 9], suivant: 3});
});

test("bande à trous : aucun saut avant la réponse, un saut dès que deux voisines sont remplies", () => {
  assert.deepEqual(sauts("gaps", [0, 5, 10], 7), {faits: [], suivant: null}, "au départ, 0, 5 et 10 ne sont pas voisines");
  assert.deepEqual(sauts("gaps", [0, 5, 6, 10], 1), {faits: [5], suivant: null},
    "6 × 7 trouvé : le saut 5 → 6 apparaît ; et rien vers la case bleue");
  assert.deepEqual(sauts("gaps", [0, 1, 5, 6, 7, 10], 2).suivant, null, "jamais de saut à faire dans la bande à trous");
  assert.deepEqual(sauts("gaps", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 9).faits.length, 10);
});

// --------------------------------------------------- 2. le dessin des arcs

// Un faux SVG : chaque élément garde ses attributs, ses enfants et son texte.
function fauxNoeud(nom) {
  return {
    nom, attributs: {}, enfants: [], dataset: {}, style: {}, textContent: "",
    setAttribute(n, v) { this.attributs[n] = v; },
    append(...e) { this.enfants.push(...e); },
    replaceChildren(...e) { this.enfants = [...e]; }
  };
}

// Une fausse bande : `gauche` et `largeur` du cadre, onze cases égales à
// l'intérieur (6 px de bord et de marge de chaque côté, comme la vraie).
function dessiner({largeur = 358, gauche = 22, hauteurFenetre = 740, faits, suivant, table = 7}) {
  const interieur = (largeur - 12) / 11;
  const cases = Array.from({length: 11}, (_, k) => ({
    getBoundingClientRect: () => ({left: gauche + 6 + k * interieur, width: interieur})
  }));
  const stick = {
    isConnected: true,
    getBoundingClientRect: () => ({left: gauche, width: largeur}),
    querySelectorAll: () => cases
  };
  const dessin = fauxNoeud("div");
  const images = [];
  const tracer = new Function("ARG", `
    const document = {createElementNS: (ns, nom) => ARG.fauxNoeud(nom)};
    const window = {innerHeight: ARG.hauteurFenetre, requestAnimationFrame: f => ARG.images.push(f)};
    ${source("tracerSauts")}
    return tracerSauts;
  `)({fauxNoeud, hauteurFenetre, images});
  tracer(stick, dessin, table, {faits, suivant});
  const centre = k => gauche + 6 + (k + 0.5) * interieur - gauche;
  return {dessin, images, centre, svg: dessin.enfants[0]};
}

const nombres = d => d.match(/-?\d+(\.\d+)?/g).map(Number);

test("un arc par saut, du milieu d’une case au milieu de la suivante, qui descend puis remonte", () => {
  const {svg, centre} = dessiner({faits: [0, 1, 2], suivant: 3});
  const groupes = svg.enfants;
  assert.equal(groupes.length, 4, "trois sauts faits + le saut à faire");
  assert.deepEqual(groupes.map(g => g.attributs.class), ["saut", "saut", "saut", "saut est-suivant"]);
  assert.deepEqual(groupes.map(g => g.dataset.de), ["0", "1", "2", "3"]);
  for (const g of groupes) {
    const k = Number(g.dataset.de);
    const [arc, pointe, texte] = g.enfants;
    const [x1, y1, xq, yq, x2, y2] = nombres(arc.attributs.d);
    assert.ok(Math.abs(x1 - (centre(k) + 3)) < 0.1, "départ : le milieu de la case");
    assert.ok(Math.abs(x2 - (centre(k + 1) - 3)) < 0.1, "arrivée : le milieu de la case suivante");
    assert.ok(yq > y1 && yq > y2, "le point de contrôle est PLUS BAS : l’arc descend sous la bande et remonte (sens corrigé le 30/09)");
    // La pointe part de l'arrivée et s'étend vers le bas et la gauche : elle
    // pointe vers le haut, dans la case d'arrivée.
    const p = nombres(pointe.attributs.d);
    assert.equal(p[0], x2); assert.equal(p[1], y2);
    assert.ok(p[3] > y2 && p[5] > y2, "les deux ailes de la pointe sont sous son bout");
    assert.equal(pointe.attributs.class, "pointe");
    assert.equal(texte.textContent, "+ 7", "« + 7 », l’espace insécable fine");
    assert.ok(Number(texte.attributs.y) > yq / 2, "l’étiquette est sous l’arc");
  }
});

test("la place est réservée même sans arc : le pavé ne saute pas au premier saut", () => {
  const vide = dessiner({faits: [], suivant: null});
  assert.equal(vide.svg.enfants.length, 0);
  assert.equal(vide.dessin.style.height, "35px", "téléphone : 13 de creux + 12 de texte + 10");
  const plein = dessiner({faits: [0, 1, 2], suivant: 3});
  assert.equal(plein.dessin.style.height, "35px", "même hauteur avec des arcs");
  assert.equal(plein.dessin.style.width, "358px", "la largeur de la bande, pour que les arcs tombent sous les cases");
});

test("petits arcs sur un téléphone et sur un écran bas, grands arcs sur un grand écran", () => {
  const grand = dessiner({largeur: 716, gauche: 442, hauteurFenetre: 900, faits: [0], suivant: null});
  assert.equal(grand.dessin.style.height, "47px");
  assert.equal(grand.svg.enfants[0].enfants[2].attributs["font-size"], "17");
  const projecteur = dessiner({largeur: 716, gauche: 282, hauteurFenetre: 590, faits: [0], suivant: null});
  assert.equal(projecteur.dessin.style.height, "35px", "1280 × 590 : la place manque en hauteur");
  const telephone = dessiner({faits: [0], suivant: null});
  assert.equal(telephone.svg.enfants[0].enfants[2].attributs["font-size"], "12");
});

test("écran pas encore affiché : on ne dessine rien et on remesure à l’image suivante", () => {
  const {dessin, images} = dessiner({largeur: 0, faits: [0], suivant: null});
  assert.equal(dessin.enfants.length, 0);
  assert.equal(images.length, 1, "un seul rappel demandé");
});

test("la page dessine les sauts sous la bande des deux activités, et les retrace quand l’écran change", () => {
  // Audit 4 : les sauts suivent les cases écrites (complétées + réponses montrées en ambre).
  assert.match(html, /zone\.replaceChildren\(instruction, stick, dessin\);\s*tracerSauts\(stick, dessin, table, sautsDeLaBande\(state\.configuration\.learnActivity, visibles, question\?\.multiplier\)\);/);
  assert.match(html, /dessin\.className = "bande-sauts";\s*dessin\.setAttribute\("aria-hidden", "true"\);/,
    "les arcs sont un dessin : les lecteurs d’écran lisent déjà les cases");
  assert.match(html, /window\.addEventListener\("resize", retracerSauts\);/);
  assert.match(source("retracerSauts"), /tracerSauts\(stick, dessin, Number\(dessin\.dataset\.table\), JSON\.parse\(dessin\.dataset\.sauts\)\)/);
  // Les couleurs : gris-bleu foncé pour les sauts faits (lisible en 12 px),
  // le bleu de la case bleue pour le saut à faire.
  assert.match(html, /\.bande-sauts \.saut \{ color: #52708f; \}/);
  assert.match(html, /\.bande-sauts \.saut\.est-suivant \{ color: var\(--blue\); \}/);
  assert.match(html, /\.bande-sauts \.saut path\.pointe \{ fill: currentColor; stroke: none; \}/);
});

// ------------------------------------- 3. à la 3e erreur, la réponse est donnée

const reponseDonnee = new Function(`
  const ERREURS_AVANT_REPONSE = ${ERREURS_AVANT_REPONSE};
  ${source("reponseDonnee")}
  return reponseDonnee;
`)();

test("la réponse est donnée à la 3e erreur sur le même calcul, pas avant", () => {
  assert.equal(ERREURS_AVANT_REPONSE, 3, "le chiffre de Claire, choisi par Gwenaël le 30/09");
  const erreurs = new Map();
  assert.equal(reponseDonnee(erreurs, "4-7"), false);
  assert.equal(reponseDonnee(erreurs, "4-7"), false);
  assert.equal(reponseDonnee(erreurs, "6-7"), false, "chaque calcul compte ses propres erreurs");
  assert.equal(reponseDonnee(erreurs, "4-7"), true);
  assert.equal(erreurs.get("4-7"), 3);
  assert.equal(erreurs.get("6-7"), 1);
});

// Le vrai morceau de la page qui traite une réponse de J'apprends, joué sur
// une bande entière : on garde la file de questions, les cases remplies, les
// cases données, et ce que dit la correction.
// Le début est la ligne D'AVANT la règle (audit 2, remarque de Code sur le
// sabotage 2 de #884) : un repère pris dans la règle elle-même faisait échouer
// la découpe au lieu du comportement quand on touchait à la règle.
const DEBUT_BLOC = "          const assisted = !stickActivity && state.learnStickHelpUsed;\n";
const FIN_BLOC = "          showAnswerFeedback(question, correct, skip ? null : value, shouldRetry, assisted, donnee);";
const bloc = (() => {
  const a = html.indexOf(DEBUT_BLOC);
  const b = html.indexOf(FIN_BLOC, a);
  assert.ok(a > 0 && b > a, "le traitement d’une réponse de J’apprends doit exister");
  assert.equal(html.indexOf(DEBUT_BLOC, a + 1), -1, "un seul traitement");
  return html.slice(a + DEBUT_BLOC.length, b);
})();
// Lot « retouches après Mon parcours » : la 1re erreur donne une deuxième
// chance (le bloc rend alors la main avant toute correction : undefined).
const traiter = new Function("state", "question", "correct", "stickActivity", "assisted", `
  const ERREURS_AVANT_REPONSE = ${ERREURS_AVANT_REPONSE};
  const skip = false;
  ${source("deuxiemeChance")}
  ${source("reponseDonnee")}
  const essaieEncore = () => {};
  const renderLearnProgress = () => {};
  const renderLearnSequence = () => {};
  ${bloc}
  return {donnee, shouldRetry};
`);

// Joue une bande : `reponse(multiplicateur, passage)` dit si l'élève répond
// juste au n-ième passage de ce calcul.
function jouerBande(activite, reponse) {
  const multiplicateurs = activite === "gaps" ? [1, 2, 3, 4, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const state = {
    index: 0,
    questions: multiplicateurs.map(m => ({multiplier: m, factKey: `${Math.min(m, 7)}-${Math.max(m, 7)}`})),
    mastered: new Set(),
    erreursBande: new Map(),
    casesDonnees: new Set(),
    casesMontrees: new Set(),
    correctionBande: null,
    ratesAuPremierEssai: new Set(),
    configuration: {learnActivity: activite},
    revealedLearnResults: new Set(activite === "gaps" ? [0, 5, 10] : []),
    lastRevealedLearnMultiplier: null
  };
  const stickActivity = ["construct", "gaps"].includes(activite);
  const passages = new Map();
  const messages = [];
  while (state.index < state.questions.length) {
    const question = state.questions[state.index];
    const passage = (passages.get(question.multiplier) || 0) + 1;
    passages.set(question.multiplier, passage);
    const correct = reponse(question.multiplier, passage);
    const rendu = traiter(state, question, correct, stickActivity, false);
    // Deuxième chance : la même question, tout de suite.
    if (!rendu) { messages.push("Essaie encore."); continue; }
    const {donnee, shouldRetry} = rendu;
    messages.push(correct ? "Bravo !" : shouldRetry ? "Le calcul reviendra." : donnee ? "Je l’écris dans la bande." : "");
    if (stickActivity && state.revealedLearnResults.size >= CASES_BANDE) break;
    state.index += 1;
    if (state.index > 200) throw new Error("la bande tourne en rond");
  }
  return {state, passages, messages};
}

test("je construis la bande : un calcul raté trois fois est écrit dans la case, et la bande se termine", () => {
  const {state, passages, messages} = jouerBande("construct", m => m !== 4);
  assert.equal(passages.get(4), 3, "4 × 7 est répondu trois fois, pas une de plus");
  assert.deepEqual([...state.casesDonnees], [4]);
  assert.equal(state.revealedLearnResults.size, 11, "la bande est complète");
  assert.equal(state.lastRevealedLearnMultiplier, 4, "la case donnée s’allume (en ambre)");
  // Lot « retouches après Mon parcours » : deuxième chance, puis la réponse
  // en ambre et le retour, puis écrite pour de bon.
  assert.deepEqual(messages.filter(m => m !== "Bravo !"), ["Essaie encore.", "Le calcul reviendra.", "Je l’écris dans la bande."]);
  assert.equal(state.mastered.has("4-7"), false, "une case donnée n’est pas « trouvée »");
});

test("trouvé au 2e essai : il ne revient pas ; au 3e (en fin de bande) : la case est verte", () => {
  const deux = jouerBande("construct", (m, n) => m !== 4 || n >= 2);
  assert.equal(deux.passages.get(4), 2);
  assert.equal(deux.state.questions.length, 11, "aucun calcul ajouté en fin de bande");
  assert.equal(deux.state.casesDonnees.size, 0);
  assert.equal(deux.state.casesMontrees.size, 0, "rien n’a été montré");
  const trois = jouerBande("construct", (m, n) => m !== 4 || n >= 3);
  assert.equal(trois.passages.get(4), 3);
  assert.equal(trois.state.questions.length, 12, "raté deux fois : il revient une fois");
  assert.equal(trois.state.casesDonnees.size, 0, "trouvé au 3e essai : c’est une case trouvée, pas donnée");
});

test("bande à trous : même règle, même sur plusieurs calculs à la fois", () => {
  const {state, passages} = jouerBande("gaps", m => m !== 6 && m !== 8);
  assert.equal(passages.get(6), 3);
  assert.equal(passages.get(8), 3);
  assert.deepEqual([...state.casesDonnees].sort(), [6, 8]);
  assert.equal(state.revealedLearnResults.size, 11);
});

test("dans l’ordre et le désordre, rien ne change : le calcul revient jusqu’à être trouvé", () => {
  const {state, passages} = jouerBande("ordered", (m, n) => m !== 4 || n >= 6);
  assert.equal(passages.get(4), 6, "cinq erreurs, cinq retours : la règle d’avant");
  assert.equal(state.casesDonnees.size, 0);
  assert.match(html, /const donnee = stickActivity && !correct && reponseDonnee\(/, "la limite ne joue que dans la bande");
});

test("la correction dit « Je l’écris dans la bande. » à la 3e erreur", () => {
  assert.match(html, /function showAnswerFeedback\(question, correct, given, willRetry = false, assisted = false, donnee = false, lente = false\)/);
  assert.match(html, /const suite = willRetry\s*\? \(montree \? " Je l’écris dans la bande, le calcul reviendra\." : " Le calcul reviendra\."\)\s*: donnee \? " Je l’écris dans la bande\." : "";/);
  assert.match(html, /: `Ta réponse\\u00a0: \$\{given\}\. Bonne réponse\\u00a0: \$\{question\.answer\}\$\{car\}\.\$\{suite\}`;/);
  assert.match(html, /\? `Pas de réponse\. Bonne réponse\\u00a0: \$\{question\.answer\}\$\{car\}\.\$\{suite\}`/);
});

test("la case donnée est ambre, jamais verte, et le lecteur d’écran le dit", () => {
  assert.match(html, /const donnee = filled && Boolean\(givenMultipliers\?\.has\(multiplier\)\);\s*cell\.classList\.toggle\("is-given", donnee\);/);
  assert.match(html, /cell\.setAttribute\("aria-label", `\$\{multiplier\} fois \$\{table\}, \$\{result\}\$\{donnee \? ", réponse donnée" : ""\}`\);/);
  // Audit 4 : les réponses montrées après une erreur sont ambre aussi.
  assert.match(html, /givenMultipliers: stickOnly \? new Set\(\[\.\.\.state\.casesDonnees, \.\.\.state\.casesMontrees, /);
  // Le vert du « is-new » (la case qui vient de se remplir) ne doit pas
  // l'emporter : la règle ambre vient APRÈS lui et le vise aussi.
  const regleNeuve = html.indexOf(".number-stick-cell.is-new .number-stick-value {");
  const regleAmbre = html.indexOf(".number-stick-cell.is-new.is-given .number-stick-value { color: #8a4b00; background: #fff1d6; box-shadow: inset 0 0 0 2px #e0a34a; }");
  assert.ok(regleNeuve > 0 && regleAmbre > regleNeuve, "la règle ambre suit la règle verte de la case neuve");
  assert.match(html, /\.number-stick-cell\.is-given \.number-stick-value,\s*\.number-stick-cell\.is-new\.is-given/);
});

test("les cases données repartent de zéro à chaque bande", () => {
  const remises = html.match(/state\.erreursBande = new Map\(\);\s*state\.casesDonnees = new Set\(\);/g) || [];
  assert.equal(remises.length, 2, "au lancement d’une série et au retour à l’accueil");
  assert.match(html, /erreursBande: new Map\(\),\s*casesDonnees: new Set\(\),/);
});

// ------------------------------------------------ 4. le passage plus rapide

test("dans la bande, la question suivante arrive après 450 ms ; ailleurs, 800 ms comme avant", () => {
  assert.equal(constante("DELAI_SUIVANT_BANDE"), 450);
  assert.equal(constante("DELAI_SUIVANT"), 800);
  const pop = html.match(/animation: stick-pop \.(\d+)s ease-out/);
  assert.ok(pop && Number(`0.${pop[1]}`) * 1000 < 450, "l’effet de la case qui se remplit a le temps de se jouer");
  assert.match(source("scheduleAutoAdvance"), /function scheduleAutoAdvance\(delai = DELAI_SUIVANT\)[\s\S]*\}, delai\);/);
  assert.match(html, /scheduleAutoAdvance\(stickActivity \? DELAI_SUIVANT_BANDE : DELAI_SUIVANT\);/);
  // Les entraînements, la validation : l'appel sans délai, donc 800. La
  // révision aussi, sauf un calcul juste mais lent de Mes calculs du jour
  // (lot du 04/11/2026) : le temps de lire « Juste, mais un peu lent ».
  const appels = html.match(/scheduleAutoAdvance\(\);/g) || [];
  assert.ok(appels.length >= 1, "les autres séries gardent le délai par défaut");
  assert.match(html, /scheduleAutoAdvance\(lente \? DELAI_SUIVANT_LENT : DELAI_SUIVANT\);/);
  assert.equal(constante("DELAI_SUIVANT_LENT"), 1800);
});
