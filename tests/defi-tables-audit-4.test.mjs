// Défi tables — audit 4 (01/10/2026, décisions de Gwenaël sur planches) :
//
// 1. L'ACCUEIL GARDE SA TAILLE. Avant, sur ordinateur, déplier « J'apprends »
//    ne remesurait rien (le cadre blanc sortait de l'écran), mais revenir
//    d'une activité, choix toujours déplié, remesurait et rapetissait
//    l'accueil : deux tailles pour le même écran selon le chemin. Option D :
//    le choix ouvert prend la place des autres étapes et des liens du bas
//    (ordinateur seulement), l'échelle se mesure sur l'accueil FERMÉ, et un
//    « ✕ » sur la ligne ouverte dit comment revenir.
// 2. LES ERREURS DANS LA BANDE. La bonne réponse s'écrit en ambre (plus en
//    bleu, la couleur de ce que l'élève tape). Dans « Je construis la bande »,
//    elle reste dans la case : la case suivante se construit à partir d'elle,
//    et le calcul revient quand même une fois en fin de bande. La limite des
//    3 erreurs (lot « sauts ») ne change pas.
// 3. LES PERLES. Pas de flèches sous la bande (l'addition est juste en
//    dessous, et Gwenaël ne veut pas réduire le boulier) : les « + 2 » de
//    l'addition sont écrits en bleu, comme le saut de la bande.
//
// ajusterEchelle, casesVisibles, ecrireAddition et le traitement d'une
// réponse de J'apprends sont EXÉCUTÉS tels qu'ils sont écrits dans la page.
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }", debut) + "\n      }".length;
  return html.slice(debut, fin);
}
const constante = nom => Number(html.match(new RegExp(`const ${nom} = (\\d+);`))[1]);

// ------------------------------------------------------ 1. l'accueil

const blocEchelle = html.slice(html.indexOf("      const ECHELLE = Object.freeze("), html.indexOf('      window.addEventListener("resize", ajusterEchelle);'));

// Un faux accueil : la hauteur du corps vaut hauteur × échelle ; « fermé »
// quand aucun choix n'est ouvert OU pendant la mesure (classe mesure-replie).
function accueil({fenetre = [1440, 825], pleinEcran = false, ferme, ouvert, choixOuvert}) {
  const classes = noms => {
    const set = new Set(noms);
    return {contains: n => set.has(n), add: n => set.add(n), remove: n => set.delete(n), toggle: (n, v) => (v ? set.add(n) : set.delete(n)), set};
  };
  const proprietes = {};
  const racine = {style: {setProperty: (n, v) => { proprietes[n] = v; }, getPropertyValue: n => proprietes[n] || ""}};
  const acc = {classList: classes(choixOuvert ? ["etape-seule"] : [])};
  const corps = {classList: classes(pleinEcran ? ["fullscreen-active"] : [])};
  const mesures = [];
  Object.defineProperty(corps, "offsetHeight", {get() {
    const z = Number(proprietes["--echelle"]);
    const replie = !acc.classList.contains("etape-seule") || acc.classList.contains("mesure-replie");
    mesures.push(replie ? "fermé" : "ouvert");
    return Math.round((replie ? ferme : ouvert) * z);
  }});
  const ecrans = {intro: false, "mode-screen": false, calculs: true, parcours: true, lire: true, "question-card": true};
  const document = {
    documentElement: racine, body: corps,
    getElementById: id => ({hidden: ecrans[id] ?? true, scrollHeight: 0, clientHeight: 0}),
    querySelector: sel => (sel === ".acc" ? acc : null)
  };
  const window = {innerWidth: fenetre[0], innerHeight: fenetre[1], scrollY: 0, scrollTo() {}, matchMedia: () => ({matches: false})};
  const ajusterEchelle = new Function("document", "window", "state", "retracerSauts", `${blocEchelle}; return ajusterEchelle;`)(document, window, {etapeOuverte: choixOuvert ? "apprends" : null}, () => {});
  ajusterEchelle();
  return {z: Number(proprietes["--echelle"]), acc, mesures};
}

test("un choix ouvert ne change pas la taille de l’accueil : elle se mesure sur l’accueil fermé", () => {
  // Ta fenêtre (1440 × 825) : l’accueil fermé tient à ×1 ; avec le choix
  // ouvert À LA PLACE des étapes, il est un peu moins haut.
  const ferme = accueil({ferme: 780, ouvert: 760, choixOuvert: false});
  const ouvert = accueil({ferme: 780, ouvert: 760, choixOuvert: true});
  assert.equal(ferme.z, 1);
  assert.equal(ouvert.z, ferme.z, "même taille fermé et ouvert");
  assert.ok(ouvert.mesures.includes("fermé"), "la recherche mesure l’accueil fermé");
  assert.equal(ouvert.acc.classList.contains("mesure-replie"), false, "la classe de mesure est retirée");
  // Plein écran 1440 × 960 : agrandi, et toujours la même taille.
  const pf = accueil({fenetre: [1440, 960], pleinEcran: true, ferme: 760, ouvert: 700, choixOuvert: false});
  const po = accueil({fenetre: [1440, 960], pleinEcran: true, ferme: 760, ouvert: 700, choixOuvert: true});
  assert.ok(pf.z > 1.2);
  assert.equal(po.z, pf.z);
});

test("même résultat quel que soit le chemin : la mesure ne dépend que de ce qui est affiché", () => {
  // Le défaut d’avant : au clic, pas de mesure (grand, déborde) ; au retour,
  // mesure du choix ouvert (petit). Ici, deux mesures du même écran donnent
  // la même échelle — que l’échelle de départ soit celle d’un jeu ou de l’accueil.
  const a = accueil({fenetre: [1366, 650], ferme: 790, ouvert: 780, choixOuvert: true});
  const b = accueil({fenetre: [1366, 650], ferme: 790, ouvert: 780, choixOuvert: false});
  assert.equal(a.z, b.z);
  assert.ok(a.z < 1 && a.z >= 0.8);
});

test("si le choix ouvert est plus haut que l’accueil fermé, il prend la plus grande taille en dessous qui tient", () => {
  const r = accueil({ferme: 700, ouvert: 900, choixOuvert: true});
  assert.ok(r.z <= 825 / 900 && r.z > 825 / 900 - 0.01, `le cadre tient (${r.z})`);
  const rien = accueil({ferme: 700, ouvert: 1400, choixOuvert: true});
  assert.equal(rien.z, 0.8, "rien ne tient : la plus petite taille, comme une série");
});

test("la page : l’accueil se remesure choix ouvert compris, et marque le choix ouvert", () => {
  const rendu = source("renderAccueil");
  assert.match(rendu, /document\.querySelector\("\.acc"\)\.classList\.toggle\("etape-seule", Boolean\(etapes\.querySelector\("\.etape-choix"\)\)\);\s*(\/\/[^\n]*\s*)*if \(!\$\("intro"\)\.hidden\) ajusterEchelle\(\);\s*\}$/);
  assert.doesNotMatch(html, /state\.etapeOuverte && !\$\("intro"\)/, "plus d’exception « choix déplié »");
  const ajuster = source("ajusterEchelle");
  assert.match(ajuster, /if \(ouvert\) acc\.classList\.add\("mesure-replie"\);\s*(\/\/[^\n]*\s*)*let z = chercherEchelle\(/);
  assert.match(ajuster, /acc\.classList\.remove\("mesure-replie"\);\s*(\/\/[^\n]*\s*)*if \(!tient\(z\)\) z = chercherEchelle\(\{\.\.\.bornes, max: z, longue: bornes\.min\}, tient\);/);
});

test("le CSS : sur ordinateur seulement, le choix ouvert prend la place ; le « ✕ » n’existe que sur la ligne ouverte", () => {
  const debut = html.indexOf("    .etape .fermer-choix { display: none; }");
  assert.ok(debut > 0, "le ✕ est caché par défaut (téléphone, tablette)");
  const media = html.slice(debut, html.indexOf("\n    }\n", debut));
  assert.match(media, /@media \(min-width: 1024px\) \{/, "même seuil que l’échelle (ECHELLE.largeurMin)");
  assert.match(html, /largeurMin: 1024/);
  assert.match(media, /\.acc\.etape-seule:not\(\.mesure-replie\) > :not\(\.matable\),/, "le bloc du jour, les tuiles, les liens, la notice");
  assert.match(media, /\.acc\.etape-seule:not\(\.mesure-replie\) #acc-etapes > :not\(\[aria-expanded="true"\]\):not\(\.etape-choix\),/, "les autres étapes, l’encadré rendez-vous, Mon mélange");
  assert.match(media, /\.acc\.etape-seule:not\(\.mesure-replie\) #acc-lire \{ display: none !important; \}/);
  assert.match(media, /\.acc\.mesure-replie \.etape-choix \{ display: none !important; \}/, "pendant la mesure, l’accueil est fermé");
  assert.match(media, /\.etape\[aria-expanded="true"\] \.fermer-choix \{[^}]*display: grid;/);
  const ligne = source("ligneEtape");
  assert.match(ligne, /if \(deplie\) \{\s*const fermer = document\.createElement\("i"\);\s*fermer\.className = "fermer-choix";\s*fermer\.textContent = "✕";\s*dots\.append\(fermer\);\s*\}/);
});

// ------------------------------------------------ 2. les erreurs de la bande

const casesVisibles = new Function(`${source("casesVisibles")}; return casesVisibles;`)();
const etat = o => ({revealedLearnResults: new Set(o.r || []), casesMontrees: new Set(o.m || []), correctionBande: o.c ?? null});
const vues = (o, q) => [...casesVisibles(etat(o), q)].sort((a, b) => a - b);

test("les cases écrites : complétées, montrées (ambre), la correction en cours ; jamais la case demandée avant sa réponse", () => {
  assert.deepEqual(vues({r: [0, 1], m: [2]}, {multiplier: 3}), [0, 1, 2], "le 2 × 7 raté reste écrit : on construit 3 × 7 à partir de lui");
  assert.deepEqual(vues({r: [0, 1, 3, 4], m: [2]}, {multiplier: 2, retry: true}), [0, 1, 3, 4], "le calcul revient : sa case est vide");
  assert.deepEqual(vues({r: [0, 1, 3, 4], m: [2], c: 2}, {multiplier: 2}), [0, 1, 2, 3, 4], "raté encore : la correction se voit");
  assert.deepEqual(vues({r: [0, 5, 10], c: 7}, {multiplier: 7}), [0, 5, 7, 10], "bande à trous : la correction se voit le temps du message");
  assert.deepEqual(vues({r: [0, 5, 10]}, {multiplier: 7}), [0, 5, 10], "puis la case redevient vide");
  assert.deepEqual(vues({r: [0, 1]}, undefined), [0, 1]);
});

// Le vrai traitement d'une réponse de J'apprends (même découpe que
// defi-tables-sauts-bande), joué sur une bande entière.
const DEBUT_BLOC = "          const assisted = !stickActivity && state.learnStickHelpUsed;\n";
const FIN_BLOC = "          showAnswerFeedback(question, correct, skip ? null : value, shouldRetry, assisted, donnee);";
const traiter = new Function("state", "question", "correct", "stickActivity", "assisted", `
  const ERREURS_AVANT_REPONSE = ${constante("ERREURS_AVANT_REPONSE")};
  ${source("reponseDonnee")}
  const renderLearnProgress = () => {};
  const renderLearnSequence = () => {};
  ${html.slice(html.indexOf(DEBUT_BLOC) + DEBUT_BLOC.length, html.indexOf(FIN_BLOC))}
  return {donnee, shouldRetry};
`);

function jouer(activite, reponse) {
  const multiplicateurs = activite === "gaps" ? [1, 2, 3, 4, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const state = {
    index: 0, mastered: new Set(), erreursBande: new Map(), casesDonnees: new Set(), casesMontrees: new Set(), correctionBande: null,
    configuration: {learnActivity: activite}, lastRevealedLearnMultiplier: null,
    questions: multiplicateurs.map(m => ({multiplier: m, factKey: `${Math.min(m, 7)}-${Math.max(m, 7)}`})),
    revealedLearnResults: new Set(activite === "gaps" ? [0, 5, 10] : [])
  };
  const passages = new Map();
  const vuAvant = [];
  while (state.index < state.questions.length) {
    const question = state.questions[state.index];
    vuAvant.push({m: question.multiplier, visibles: [...casesVisibles(state, question)].sort((a, b) => a - b), montrees: [...state.casesMontrees]});
    const n = (passages.get(question.multiplier) || 0) + 1;
    passages.set(question.multiplier, n);
    traiter(state, question, reponse(question.multiplier, n), true, false);
    state.correctionBande = null; // clearAnswerFeedback, au passage à la question suivante
    if (state.revealedLearnResults.size >= 11) break;
    state.index += 1;
  }
  return {state, passages, vuAvant};
}

test("je construis la bande : la réponse ratée reste écrite, la case suivante se construit à partir d’elle", () => {
  const {state, passages, vuAvant} = jouer("construct", (m, n) => m !== 4 || n >= 2);
  const apres = vuAvant.find(v => v.m === 5);
  assert.ok(apres.visibles.includes(4), "5 × 7 : la case de 4 × 7 est écrite (ambre) — « Ajoute 7 » est vrai");
  const retour = vuAvant.filter(v => v.m === 4)[1];
  assert.ok(retour && !retour.visibles.includes(4), "4 × 7 revient en fin de bande, case vide");
  assert.equal(passages.get(4), 2);
  assert.equal(state.revealedLearnResults.size, 11);
  assert.equal(state.casesMontrees.size, 0, "trouvé au retour : la case n’est plus ambre, elle est verte");
  assert.equal(state.casesDonnees.size, 0);
  assert.ok(state.mastered.has("4-7"));
});

test("je construis la bande : la limite des 3 erreurs ne change pas", () => {
  const {state, passages} = jouer("construct", m => m !== 4);
  assert.equal(passages.get(4), 3);
  assert.deepEqual([...state.casesDonnees], [4]);
  assert.equal(state.revealedLearnResults.size, 11);
  assert.equal(state.casesMontrees.size, 0);
});

test("une réponse montrée ne compte pas comme complétée : la bande ne se termine pas avant le retour du calcul", () => {
  const {passages} = jouer("construct", (m, n) => m !== 10 || n >= 2);
  assert.equal(passages.get(10), 2, "10 × 7 raté en dernier : il revient quand même");
});

test("bande à trous : rien ne reste écrit après la correction", () => {
  const {state, vuAvant, passages} = jouer("gaps", (m, n) => m !== 6 || n >= 2);
  assert.equal(passages.get(6), 2);
  assert.ok(vuAvant.every(v => v.montrees.length === 0), "jamais de case montrée dans la bande à trous");
  assert.ok(vuAvant.filter(v => v.m !== 6).every(v => !v.visibles.includes(6) || state.revealedLearnResults.has(6)));
});

test("la page : correction en ambre, phrase de construire, remises à zéro", () => {
  assert.match(html, /givenMultipliers: stickOnly \? new Set\(\[\.\.\.state\.casesDonnees, \.\.\.state\.casesMontrees, \.\.\.\(state\.correctionBande === null \? \[\] : \[state\.correctionBande\]\)\]\) : null/);
  assert.match(html, /const visibles = stickOnly \? casesVisibles\(state, question\) : state\.revealedLearnResults;/);
  assert.match(source("clearAnswerFeedback"), /state\.waitingForContinue = false;\s*state\.correctionBande = null;/);
  const remises = html.match(/state\.casesDonnees = new Set\(\);\s*state\.casesMontrees = new Set\(\);\s*state\.correctionBande = null;/g) || [];
  assert.equal(remises.length, 2, "au lancement d’une série et au retour à l’accueil");
  assert.match(html, /casesMontrees: new Set\(\),\s*correctionBande: null,/);
  assert.match(source("showAnswerFeedback"), /const montree = !correct && state\.casesMontrees\.has\(question\.multiplier\) && state\.configuration\?\.learnActivity === "construct";/);
  assert.match(html, /" Je l’écris dans la bande, le calcul reviendra\."/);
  // L'ambre bat le cadre bleu de la case en cours : la règle vient après.
  assert.ok(html.indexOf(".number-stick-cell.is-given .number-stick-value,") > html.indexOf(".number-stick-cell.is-current .number-stick-value {"));
});

// ------------------------------------------------------------ 3. les perles

function fauxElement(nom) {
  return {nom, className: "", enfants: [], textContent: "",
    replaceChildren(...e) { this.enfants = e; this.textContent = e.map(x => x.textContent ?? x.texte).join(""); }};
}
const ecrireAddition = new Function("document", `${source("ecrireAddition")}; return ecrireAddition;`)({
  createElement: fauxElement,
  createTextNode: texte => ({texte, textContent: texte})
});

test("les « + 2 » de l’addition sont à part (en bleu), le texte ne change pas", () => {
  for (const phrase of ["4 + 2 = 6", "9 + 1 + 2 = 12", "3", "", "10 + 10 = 20"]) {
    const zone = fauxElement("p");
    ecrireAddition(zone, phrase);
    assert.equal(zone.textContent, phrase, "le même texte qu’avant, pour l’écran comme pour le lecteur d’écran");
  }
  const zone = fauxElement("p");
  ecrireAddition(zone, "9 + 1 + 2 = 12");
  assert.deepEqual(zone.enfants.filter(e => e.className === "ajout").map(e => e.textContent), ["+ 1", "+ 2"]);
  assert.match(html, /\.perles-addition \.ajout \{ color: var\(--blue\); \}/);
  assert.match(html, /ecrireAddition\(dom\.addition, boulier\.figee/);
  assert.doesNotMatch(html, /dom\.addition\.textContent =/);
});
