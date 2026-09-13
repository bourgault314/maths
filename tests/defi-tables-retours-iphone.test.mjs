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
  const document = {
    createElement: creer,
    createTextNode: t => ({texte: t}),
    getElementById: id => elements[id] || null,
    querySelector: () => null,
    body: creer("body")
  };
  return {document, elements, $: id => elements[id]};
}

// --------------------------------------------------------- 1. fin de révision

test("fin de révision : le cadre porte les boutons — Continuer + Ma table, ou Ma table + Encore N + Voir mes calculs", () => {
  const cas = [];
  for (const restants of [11, 0]) {
    const {document, $} = fauxDocument(["result", "result-verdict", "result-icon", "result-title", "result-score", "result-config", "result-detail", "result-rang", "result-message", "result-previous", "retry", "result-parcours", "result-reglages", "result-accueil"]);
    const avant = `
      const document = ARG.document; const $ = ARG.$;
      const state = {startAt: 0, configuration: {revisionTable: null, revisionLibre: false}, revisionPremierTotal: 10, revisionPremierScore: 10, revisionMontes: 10, revisionDescendus: 0, origin: "menu"};
      const parcours = {};
      const PARCOURS = {calculsDus: () => new Array(${restants}), agendaCalculs: () => ({dus: ${restants}, prochain: {dans: 1, calculs: 3}}), calculsAVenir: () => [1, 2, 3]};
      const soude = t => t; const pluriel = (n, m) => n + " " + m + (n > 1 ? "s" : ""); const formatElapsed = () => "17 s";
      const phraseProchainRetour = () => "Reviens demain : 3 calculs t’attendront.";
      const startRevision = () => {}; const backToModes = () => {}; const openCalculs = () => {};
      const libelleEncoreLibre = () => "Encore 10 calculs"; const renderCorrections = () => {}; const show = () => {};`;
    const finishRevision = new Function("ARG", `${avant}\n${source("finishRevision")}\nreturn finishRevision;`)({document, $});
    finishRevision();
    const actions = $("result-parcours").children.find(c => c.className === "result-parcours-actions");
    cas.push({restants, revision: $("result").classes.has("is-revision"), boutons: actions.children.map(b => `${b.textContent} [${b.className}]`)});
  }
  assert.deepEqual(cas, [
    {restants: 11, revision: true, boutons: ["Continuer →", "Ma table [secondary]"].map((t, i) => i === 0 ? "Continuer → [primary]" : t)},
    {restants: 0, revision: true, boutons: ["Ma table [primary]", "Encore 10 calculs [secondary]", "Voir mes calculs [secondary]"]}
  ], "deux boutons tant qu'il en reste, trois à zéro — et « Voir mon parcours » n'est plus là");
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

test("une boîte touchée s’allume dans la grille : is-filtre sur la grille, is-dans-boite sur ses calculs (pas sur le miroir), sans contour", () => {
  assert.match(html, /const boiteChoisie = calculsSelection && calculsSelection\.boite \? calculsSelection\.boite : 0;/);
  assert.match(html, /zone\.classList\.toggle\("is-filtre", Boolean\(boiteChoisie\)\);/);
  assert.match(html, /const dansBoite = Boolean\(boiteChoisie\) && cellule\.active && cellule\.boite === boiteChoisie;/, "seule la moitié active s'allume — le miroir reste éteint");
  assert.match(html, /\$\{dansBoite \? " is-dans-boite" : ""\}`;/);
  assert.match(html, /\.calculs-grille\.is-filtre \.mc-cell:not\(\.is-dans-boite\) \{ opacity: \.28; \}/, "les autres s'estompent");
  assert.match(html, /\.calculs-grille\.is-filtre \.mc-cell\.is-miroir \{ opacity: \.12; \}/);
  assert.doesNotMatch(html, /\.is-dans-boite \{[^}]*(outline|box-shadow)/, "aucun contour ajouté (maquette du 13/09 : « bizarre »)");
});

test("le cadre d’une boîte : « Ils reviennent demain », « Ratés : ils reviennent demain » — et la liste des calculs reste", () => {
  assert.match(html, /\? "Ratés : ils reviennent demain"\s*: `Ils reviennent \$\{libelleDans\(PARCOURS\.SEUILS\.revision\.delais\[boite - 1\]\)\}`\)\);/);
  assert.doesNotMatch(html, /· revient \$\{boite === 1 \? "le lendemain"/, "plus de « En route · revient demain »");
  assert.match(html, /ligneDetail\("mc-detail-liste", cles\.length \? cles\.map\(PARCOURS\.libelleFait\)\.join\(" · "\)/, "la liste, que Gwenaël a voulu garder");
});

test("le bouton de Mes calculs : « Réviser 10 calculs » + « 36 à faire aujourd’hui » au-delà d’une série ; inchangé jusqu’à 10", () => {
  assert.match(html, /const parSerie = PARCOURS\.SEUILS\.revision\.total;\s*const enPlusieurs = agenda\.dus > parSerie;/);
  assert.match(html, /\$\("calculs-hint"\)\.textContent = enPlusieurs \? `\$\{agenda\.dus\} à faire aujourd’hui` : agenda\.dus \? "" : phraseReviser\(agenda, grille\.resume\);/);
  assert.match(html, /\$\("calculs-hint"\)\.hidden = Boolean\(agenda\.dus\) && !enPlusieurs;/);
  assert.match(html, /bouton\.textContent = enPlusieurs \? `Réviser \$\{parSerie\} calculs` : agenda\.dus \? `Réviser mes \$\{pluriel\(agenda\.dus, "calcul"\)\} du jour`/);
});

// --------------------------------------------------- 3 et 4. légende, barre

test("la légende : quatre carrés de même largeur, le mot centré dessous", () => {
  assert.match(html, /\.calculs-legende > span \{ display: inline-flex; flex-direction: column; align-items: center; gap: 4px; \}/);
  assert.match(html, /\.calculs-legende \.mc-cell \{ width: 44px; min-height: 22px; min-width: 0; pointer-events: none; \}/);
});

test("la barre collée de Mes calculs : 8 px au-dessus du rond, 10 en dessous, l’ancre de la grille suit", () => {
  // Le bouton est en position absolue : il ne compte pas dans la hauteur de la
  // barre, c'est min-height qui la fixe (44 + 8 + 10).
  assert.match(html, /\.calculs-screen \.settings-toolbar \{ position: sticky; top: 0; z-index: 5; min-height: 62px; padding: 8px 0 10px;/);
  // 62 px de barre, l'ancre 4 px dessous (avant : 44 → 58).
  assert.match(html, /#calculs-grille \{ scroll-margin-top: 66px; \}/);
});

// ----------------------------------------------------------- 5. l'en-tête

test("« ← Calcul mental » seulement sur l’accueil : body.ecran-interne partout ailleurs", () => {
  assert.match(html, /document\.body\.classList\.toggle\("ecran-interne", name !== "intro"\);/);
  assert.match(html, /body\.ecran-interne #lien-retour \{ display: none; \}/);
  // Le lien lui-même ne bouge pas : la page prof, le suivi (billets) le
  // repointent toujours vers l'espace élève.
  assert.match(html, /<a id="lien-retour" class="catalogue-link"/);
  const {document, $} = fauxDocument(["intro", "launch", "play", "result", "parcours", "calculs", "settings-title", "acc-table-titre", "launch-summary", "result-title", "parcours-title", "calculs-title"]);
  const avant = `const document = ARG.document; const $ = ARG.$; const window = {scrollTo: () => {}};
    const renderAccueil = () => {}; const renderParcours = () => {}; const renderCalculs = () => {}; const syncControls = () => {};
    const configuration = {mode: null};`;
  const show = new Function("ARG", `${avant}\n${source("show")}\nreturn show;`)({document, $});
  const vus = {};
  ["calculs", "parcours", "play", "result", "intro"].forEach(nom => { show(nom); vus[nom] = document.body.classes.has("ecran-interne"); });
  assert.deepEqual(vus, {calculs: true, parcours: true, play: true, result: true, intro: false});
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
