// Lot R4 bis « retours iPhone » (13/09/2026) : les sept points relevés par
// Gwenaël sur son téléphone après la mise en ligne de R4, et les quatre
// décisions prises sur maquette le même jour.
//
// 1. FIN DE RÉVISION. « Rejouer » n'existe pas sur une révision, donc « Ma
//    table » restait seul dans sa demi-colonne, à gauche, sous un cadre aligné
//    à gauche : quatre boutons pour deux actions. Le cadre se centre et porte
//    tous les boutons : « Continuer → » + « Ma table » tant qu'il reste des
//    calculs du jour ; à zéro « Ma table » (principal), « Encore N calculs »,
//    « Voir mes calculs ». « Voir mon parcours » n'est plus sur cet écran.
// 2. MES CALCULS. Une boîte touchée s'allume dans la grille (ses calculs
//    gardent leur couleur, les autres s'estompent, aucun contour ajouté) — en
//    plus de la liste, que Gwenaël a voulu garder. La ligne « En route ·
//    revient demain » devient « Ils reviennent demain ». Au-delà d'une série,
//    le bouton dit « Réviser 10 calculs » et la ligne dessous « 36 à faire
//    aujourd’hui » (le bouton annonçait 36 : « ça fait peur »).
// 3. LA LÉGENDE. Chaque carré s'étirait à la largeur de son mot ; quatre
//    carrés de 44 px, le mot centré dessous.
// 4. LA FLÈCHE DE RETOUR de Mes calculs semblait posée sur un trait : la
//    barre ne mesurait que 44 px (son bouton, en position absolue, ne compte
//    pas dans sa hauteur) et le rond de 44 px touchait l'ombre du bas. Barre
//    de 62 px : 8 px au-dessus, 10 en dessous, l'ancre de la grille suit.
// 5. L'EN-TÊTE. Le lien du site « ← Calcul mental » ne s'affiche que sur
//    l'accueil de l'appli ; ailleurs, une seule flèche, celle de l'appli.
// 6. « 10×10 » débordait de sa case sur l'iPhone (police plus large que
//    celles de Linux et Windows) : lettres plus serrées, « × » plus petit.
// 7. Le relief de 5 px sous les boutons bleus fait paraître le texte trop
//    haut : deux pixels de marge passent du bas vers le haut.

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

// Un faux document minimal : des éléments qui gardent leurs classes, leurs
// enfants et leurs écouteurs, assez pour rejouer une fonction de rendu.
function fauxDocument(ids) {
  const elements = {};
  const creer = (tag = "div") => {
    const el = {
      tag, hidden: false, textContent: "", children: [], listeners: {}, attributes: {}, dataset: {},
      classes: new Set(),
      get className() { return [...el.classes].join(" "); },
      set className(v) { el.classes = new Set(v.split(/\s+/).filter(Boolean)); },
      classList: {
        add: (...c) => c.forEach(x => el.classes.add(x)),
        remove: (...c) => c.forEach(x => el.classes.delete(x)),
        toggle: (c, force) => { (force === undefined ? !el.classes.has(c) : force) ? el.classes.add(c) : el.classes.delete(c); },
        contains: c => el.classes.has(c)
      },
      append: (...n) => el.children.push(...n),
      appendChild: n => { el.children.push(n); return n; },
      replaceChildren: (...n) => { el.children = [...n]; },
      addEventListener: (type, fn) => { el.listeners[type] = fn; },
      setAttribute: (k, v) => { el.attributes[k] = v; },
      focus: () => {}
    };
    return el;
  };
  ids.forEach(id => { elements[id] = creer(); });
  // Le panneau blanc (lot « Mon parcours » : show() lui pose « avec-parcours »).
  const panneau = creer("section");
  const document = {
    createElement: creer,
    createTextNode: t => ({texte: t}),
    getElementById: id => elements[id] || null,
    querySelector: selecteur => (selecteur === ".panel" ? panneau : null),
    body: creer("body")
  };
  return {document, elements, $: id => elements[id]};
}

// --------------------------------------------------------- 1. fin de révision

// Lot « Mon parcours » (04/10/2026, décision de Gwenaël) : « Encore 10 calculs »
// est retiré — à zéro, « Ma table » et « Voir mes calculs ».
// Lot « un seul système » (05/10/2026) : ce cadre est celui d'une révision
// SANS chrono (les calculs d'une table). Mes calculs du jour, lui, est
// chronométré et a son propre bilan (test suivant).
test("fin de révision (sans chrono) : le cadre porte les boutons — Continuer + Ma table, ou Ma table + Voir mes calculs", () => {
  const cas = [];
  for (const restants of [11, 0]) {
    const {document, $} = fauxDocument(["result", "result-verdict", "result-icon", "result-title", "result-score", "result-config", "result-detail", "result-rang", "result-message", "result-previous", "retry", "result-parcours", "result-reglages", "result-accueil"]);
    const avant = `
      const document = ARG.document; const $ = ARG.$;
      const state = {startAt: 0, configuration: {revisionTable: 7, duration: null}, revisionPremierTotal: 10, revisionPremierScore: 10, revisionMontes: 10, revisionDescendus: 0, origin: "menu"};
      const parcours = {};
      const PARCOURS = {calculsDus: () => new Array(${restants}), agendaCalculs: () => ({dus: ${restants}, prochain: {dans: 1, calculs: 3}}), calculsAVenir: () => [1, 2, 3]};
      const soude = t => t; const pluriel = (n, m) => n + " " + m + (n > 1 ? "s" : ""); const formatElapsed = () => "17 s";
      const phraseProchainRetour = () => "Reviens demain : 3 calculs t’attendront.";
      const startRevision = () => {}; const backToModes = () => {}; const openCalculs = () => {};
      const renderCorrections = () => {}; const show = () => {}; const horlogeSerie = () => 17000;`;
    const finishRevision = new Function("ARG", `${avant}\n${source("finishRevision")}\nreturn finishRevision;`)({document, $});
    finishRevision();
    const actions = $("result-parcours").children.find(c => c.className === "result-parcours-actions");
    cas.push({restants, revision: $("result").classes.has("is-revision"), boutons: actions.children.map(b => `${b.textContent} [${b.className}]`)});
  }
  assert.deepEqual(cas, [
    {restants: 11, revision: true, boutons: ["Continuer →", "Ma table [secondary retour-flechee]"].map((t, i) => i === 0 ? "Continuer → [primary]" : t)},
    {restants: 0, revision: true, boutons: ["Ma table [primary retour-flechee]", "Voir mes calculs [secondary]"]}
  ], "deux boutons tant qu'il en reste, deux à zéro (plus d’« Encore 10 calculs ») — et « Voir mon parcours » n'est plus là");
});

// Lot « un seul système » (05/10/2026) : Mes calculs du jour est chronométré.
// Il ne se rate pas : « fait » et le score ; le temps écoulé, les calculs pas
// faits ne sont pas comptés faux — ils reviendront. Pas de bilan des boîtes
// ni de « Continuer » : la séance prend la suite.
test("fin de Mes calculs du jour (chronométré) : « Mes calculs du jour : fait » et le score, ou « Temps écoulé » et ce qui n’a pas été fait", () => {
  const jouer = (faits, score) => {
    const {document, $} = fauxDocument(["result", "result-verdict", "result-icon", "result-title", "result-score", "result-config", "result-detail", "result-rang", "result-message", "result-previous", "retry", "result-parcours", "result-reglages", "result-accueil"]);
    const avant = `
      const document = ARG.document; const $ = ARG.$; const TOTAL = 10;
      const state = {startAt: 0, configuration: {revisionTable: null, duration: 60}, revisionPremierTotal: ${faits}, revisionPremierScore: ${score}, revisionMontes: 0, revisionDescendus: 0, origin: "seance"};
      const parcours = {}; const PARCOURS = {};
      const soude = t => t; const pluriel = (n, m) => n + " " + m + (n > 1 ? "s" : ""); const formatElapsed = () => "17 s";
      const renderCorrections = () => {}; const show = () => {}; const enSeance = () => true; const horlogeSerie = () => 17000;`;
    new Function("ARG", `${avant}\n${source("finishRevision")}\nfinishRevision();`)({document, $});
    return {icone: $("result-icon").textContent, titre: $("result-title").textContent, score: $("result-score").textContent, detail: $("result-detail").textContent,
      zoneCachee: $("result-parcours").hidden, boutons: $("result-parcours").children.length, rejouer: !$("retry").hidden};
  };
  assert.deepEqual(jouer(10, 9), {icone: "✓", titre: "Mes calculs du jour : fait", score: "9 sur 10", detail: "", zoneCachee: true, boutons: 0, rejouer: false});
  assert.deepEqual(jouer(7, 6), {icone: "⏱", titre: "Temps écoulé", score: "6 sur 7 · 3 calculs pas faits", detail: "Ils reviendront.", zoneCachee: true, boutons: 0, rejouer: false});
  assert.deepEqual(jouer(9, 9), {icone: "⏱", titre: "Temps écoulé", score: "9 sur 9 · 1 calcul pas fait", detail: "Il reviendra.", zoneCachee: true, boutons: 0, rejouer: false});
  // Le chrono : 6 secondes par calcul (30 au moins), seulement sans table ;
  // il s'arrête tant qu'une correction est à l'écran, et un calcul raté ne
  // revient pas en fin de série.
  assert.match(html, /DURATION = table === null \? PARCOURS\.dureeMesCalculs\(plan\.length\) : null;/);
  assert.match(html, /if \(state\.pauseA\) return;/);
  assert.match(html, /const willRetry = !correct && !question\.retry && !chrono;/);
});

test("fin de révision : la classe is-revision centre le cadre, cache la rangée du bas, et disparaît sur les autres verdicts", () => {
  assert.match(html, /\$\("result"\)\.classList\.add\("is-revision"\);/);
  assert.match(html, /result\.classList\.remove\("is-fete", "is-rate", "is-temps", "is-neutre", "is-revision"\);/, "renderVerdict (les séries qui ne sont pas des révisions) retire la classe");
  assert.match(html, /\.result\.is-revision \.result-parcours \{ text-align: center; \}/);
  assert.match(html, /\.result\.is-revision \.result-parcours-actions \{ justify-content: center; \}/);
  assert.match(html, /\.result\.is-revision \.result-actions \{ display: none; \}/, "plus de « Ma table » orphelin dans sa demi-colonne");
  // Téléphone : le principal sur toute la ligne, les secondaires côte à côte.
  assert.match(html, /\.result\.is-revision \.result-parcours-actions \{ display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 10px; \}/);
  assert.match(html, /\.result\.is-revision \.result-parcours-actions > \.primary,\s*\.result\.is-revision \.result-parcours-actions > \.primary \+ \.secondary:last-child \{ grid-column: 1 \/ -1; \}/,
    "un secondaire seul (« Ma table » sous « Continuer ») prend aussi toute la ligne");
  assert.doesNotMatch(html, /\$\("result-accueil"\)\.classList\.toggle\("primary", !restants\);/, "l'ancien bouton n'est plus piloté : il est caché");
  assert.match(html, /maTable\.addEventListener\("click", backToModes\);/, "« Ma table » du cadre fait ce que faisait l'ancien");
});

// ------------------------------------------------------------ 2. Mes calculs

test("une boîte (ou « Aujourd’hui ») touchée s’allume dans la grille : is-filtre sur la grille, is-dans-boite sur ses calculs (pas sur le miroir), sur fond bleu", () => {
  assert.match(html, /const boiteChoisie = calculsSelection && calculsSelection\.boite \? calculsSelection\.boite : 0;/);
  // Lot « retouches après Mon parcours » : « Demain » s'allume de la même façon.
  assert.match(html, /zone\.classList\.toggle\("is-filtre", Boolean\(boiteChoisie\) \|\| jourChoisi \|\| Boolean\(demain\)\);/);
  // Lot « un seul système » (05/10/2026) : « Aujourd'hui » allume la série de
  // Mes calculs du jour (etat.serieDuJour : tables passées, 10 au plus), plus
  // tous les calculs dus.
  // Lot « fignolage du 22/10 » : plus de calculs dus que la série n'en prend,
  // « Aujourd'hui » les allume TOUS (le bouton dit leur vrai nombre).
  assert.match(html, /const serieDuJour = etat\.serieDuJour;[\s\S]{0,400}?const duJour = new Set\(serieDuJour\.restants > 0 \? PARCOURS\.dusDuJour\(parcours, PARCOURS\.jourLocal\(\)\) : serieDuJour\.cles\);\s*renderJour\(serieDuJour\);/);
  assert.match(html, /const dansBoite = cellule\.active && \(\(Boolean\(boiteChoisie\) && cellule\.boite === boiteChoisie\) \|\| \(jourChoisi && duJour\.has\(cellule\.cle\)\) \|\| Boolean\(demain && demain\.has\(cellule\.cle\)\)\);/, "seule la moitié active s'allume — le miroir reste éteint");
  assert.match(html, /\$\{dansBoite \? " is-dans-boite" : ""\}`;/);
  assert.match(html, /\.calculs-grille\.is-filtre \.mc-cell:not\(\.is-dans-boite\) \{ opacity: \.28; \}/, "les autres s'estompent");
  assert.match(html, /\.calculs-grille\.is-filtre \.mc-cell\.is-miroir \{ opacity: \.12; \}/);
  // Lot « Mon parcours » (décision 4, l'idée de Gwenaël du 04/10) : les cases
  // allumées sur fond bleu, comme ma table — un halo de 4 px, pas un anneau
  // collé à la case (les anneaux du 13/09 étaient « bizarres »).
  assert.match(html, /\.calculs-grille\.is-filtre \.mc-cell\.is-dans-boite \{ z-index: 2; box-shadow: 0 0 0 4px var\(--blue\); \}/);
});

// Lot « Mon parcours » (décision 7) : « Ils reviennent dans 7 jours » était le
// DÉLAI de la boîte, pas le jour où ses calculs reviennent (des calculs dus
// aujourd'hui s'annonçaient « dans 7 jours »). La liste reste, rangée par jour.
test("le cadre d’une boîte : ses calculs rangés par jour de retour — la liste reste, sans le délai de la boîte", () => {
  assert.doesNotMatch(html, /Ratés : ils reviennent demain|`Ils reviennent \$\{libelleDans/);
  assert.doesNotMatch(html, /· revient \$\{boite === 1 \? "le lendemain"/, "plus de « En route · revient demain »");
  // Lot E1 (décision 6) : une pastille par calcul (le « · » se lisait « fois »).
  assert.match(html, /titreJour\.textContent = majuscule\(libelleDans\(dans\)\);/);
  assert.match(html, /parJour\.get\(dans\)\.forEach\(cle => groupe\.append\(ligneDetail\("", PARCOURS\.libelleFait\(cle\)\)\)\);/, "la liste, que Gwenaël a voulu garder");
  assert.doesNotMatch(html, /cles\.map\(PARCOURS\.libelleFait\)\.join\(" · "\)/);
});

// Lot « un seul tableau » (04/10/2026) : la révision n'a qu'une porte, la
// séance ; Mes calculs (dans Mon parcours) n'a plus de bouton « Réviser ».
test("Mes calculs n’a plus de bouton « Réviser » : la séance s’en charge", () => {
  assert.doesNotMatch(html, /calculs-reviser|calculs-hint|phraseReviser/);
  assert.doesNotMatch(html, /`Réviser \$\{parSerie\} calculs`/);
});

// --------------------------------------------------- 3 et 4. légende, barre

test("la légende : cinq carrés de même largeur, le mot centré dessous", () => {
  assert.match(html, /\.calculs-legende > span \{ display: inline-flex; flex-direction: column; align-items: center; gap: 4px; \}/);
  // Audit 2 (30/09/2026) : le carré suit ses petites cases (43 px dès 480 px).
  // Lot « un seul tableau » : 46 px au moins, 40 de haut (le nombre au-dessus).
  assert.match(html, /\.calculs-legende \.mc-cell \{ width: auto; min-width: 46px; height: 40px; padding: 0 4px; aspect-ratio: auto; pointer-events: none; \}/);
});

// Lot « un seul tableau » : l'écran Mes calculs à part et sa barre collée sont partis.
test("plus de barre collée de Mes calculs : il vit dans Mon parcours", () => {
  assert.doesNotMatch(html, /\.calculs-screen \.settings-toolbar|#calculs-grille \{ scroll-margin-top/);
});

// ----------------------------------------------------------- 5. l'en-tête

test("« ← Calcul mental » seulement sur l’accueil : body.ecran-interne partout ailleurs", () => {
  assert.match(html, /document\.body\.classList\.toggle\("ecran-interne", name !== "intro"\);/);
  assert.match(html, /body\.ecran-interne #lien-retour \{ display: none; \}/);
  // Le lien lui-même ne bouge pas : la page prof, le suivi (billets) le
  // repointent toujours vers l'espace élève.
  assert.match(html, /<a id="lien-retour" class="catalogue-link"/);
  const {document, $} = fauxDocument(["intro", "launch", "play", "result", "parcours", "calculs", "lire", "fiche", "settings-title", "acc-table-titre", "launch-summary", "result-title", "parcours-title", "calculs-title"]);
  const avant = `const document = ARG.document; const $ = ARG.$; const window = {scrollTo: () => {}};
    const renderAccueil = () => {}; const renderParcours = () => {}; const renderCalculs = () => {}; const syncControls = () => {};
    const configuration = {mode: null}; const suivreHistorique = () => {}; const ajusterEchelle = () => {};
    const verrouPassage = () => false; const enEvaluation = () => false; const VUE_PROF = false;`;
  const show = new Function("ARG", `${avant}\n${source("show")}\nreturn show;`)({document, $});
  const vus = {};
  const panneau = {};
  ["calculs", "parcours", "play", "result", "intro"].forEach(nom => { show(nom); vus[nom] = document.body.classes.has("ecran-interne"); panneau[nom] = document.querySelector(".panel").classList.contains("avec-parcours"); });
  assert.deepEqual(vus, {calculs: true, parcours: true, play: true, result: true, intro: false});
  assert.deepEqual(panneau, {calculs: false, parcours: true, play: false, result: false, intro: false}, "lot « Mon parcours » : le panneau de Mon parcours, et lui seul");
});

// Lot E4 (16/10/2026) : passage d'évaluation commencé, pas fini → seuls
// l'accueil et la série de l'évaluation s'ouvrent.
test("E4 : pendant un passage, show() ne mène qu'à l'accueil — sauf la série de l'évaluation ; hors passage, rien ne change", () => {
  const ids = ["intro", "launch", "play", "result", "parcours", "lire", "fiche", "settings-title", "acc-table-titre", "launch-summary", "result-title", "parcours-title", "lire-title", "fiche-title", "fiche-print"];
  const fabriquer = (verrou, evaluation) => {
    const {document, $} = fauxDocument(ids);
    const avant = `const document = ARG.document; const $ = ARG.$; const window = {scrollTo: () => {}};
      const renderAccueil = () => {}; const renderParcours = () => {}; const syncControls = () => {}; const renderFiche = () => {}; const ajusterFiche = () => {}; const prenomAffiche = () => "";
      const configuration = {mode: null}; const suivreHistorique = () => {}; const ajusterEchelle = () => {};
      const verrouPassage = () => ${verrou}; const enEvaluation = () => ${evaluation}; const VUE_PROF = false;`;
    return {show: new Function("ARG", `${avant}\n${source("show")}\nreturn show;`)({document, $}), $};
  };
  const visible = $ => ["intro", "launch", "play", "result", "parcours", "lire", "fiche"].find(id => !$(id).hidden);
  for (const nom of ["parcours", "lire", "fiche", "launch", "result", "play"]) {
    const verrouille = fabriquer(true, false);
    verrouille.show(nom);
    assert.equal(visible(verrouille.$), "intro", `n) passage en cours : « ${nom} » ne s'ouvre pas`);
    const libre = fabriquer(false, false);
    libre.show(nom);
    assert.equal(visible(libre.$), nom, `hors passage : « ${nom} » s'ouvre`);
  }
  const serie = fabriquer(true, true);
  serie.show("play");
  assert.equal(visible(serie.$), "play", "la série de l'évaluation, elle, s'ouvre");
});

// ------------------------------------------------------ 6. « 10×10 »

test("les étiquettes de la bande : le texte dans un span (« 10×10 » inchangé), « × » plus petit, lettres serrées, mesure exacte", () => {
  assert.match(html, /texte\.append\(String\(multiplier\), fois, String\(table\)\);\s*multiplierLabel\.replaceChildren\(texte\);/, "un seul nœud dans la grille de l'étiquette : sinon trois lignes");
  assert.match(html, /fois\.className = "fois";\s*fois\.textContent = "×";/);
  assert.match(html, /\.number-stick-multiplier \{[^}]*letter-spacing: -\.03em;\s*white-space: nowrap;\s*\}/s);
  assert.match(html, /\.number-stick-multiplier \.fois \{ font-size: \.82em; \}/);
  // La taille de police ne descend pas sous les 11 px du lot R1.
  assert.match(html, /\.challenge-playing \.number-stick-multiplier \{ font-size: \.6875rem; \}/);
  // Et largeurBande() mesure ce span, pas la case (voir defi-tables-bande-et-calculs).
  assert.match(html, /const texte = etiquette\.firstElementChild;/);
});

// ------------------------------------------------- 7. le relief des boutons

test("les boutons bleus : 12 px en haut, 8 en bas — le texte se centre dans la forme visible, la hauteur ne change pas", () => {
  assert.match(html, /\.primary \{ color: #fff; border: 0; background: var\(--blue\); box-shadow: 0 5px 0 #043f8c; padding-top: 12px; padding-bottom: 8px; \}/);
  // Les boutons du cadre du résultat ont leur propre padding, PLUS PRÉCIS que
  // « .primary » : sans les deux pixels ici aussi, le « Ma table » principal de
  // la fin d'une révision gardait son texte 2,5 px trop haut (mesuré au
  // navigateur le 13/09) — le défaut même que ce lot corrige ailleurs.
  assert.match(html, /\.result-parcours \.primary \{ min-height: 44px; margin-top: 10px; padding: 10px 14px 6px; \}/,
    "le relief compensé atteint aussi les boutons bleus du cadre (44 px : 10 en haut, 6 en bas)");
  assert.doesNotMatch(html, /\.result-parcours \.primary \{ min-height: 44px; margin-top: 10px; padding: 8px 14px; \}/);
});
