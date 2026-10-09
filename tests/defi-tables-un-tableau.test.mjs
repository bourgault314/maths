// Lot « un seul tableau » de Défi tables (04/10/2026).
//
// Mon parcours = la carte de ma table, puis « Mes calculs » (les cinq boîtes,
// le détail au toucher, le tableau), puis le mélange et l'escalier. Les dix
// rangées et l'écran Mes calculs à part disparaissent ; la fiche tient sur une
// page. Le tableau garde les couleurs et les cinq carrés de l'ancienne grille,
// avec en plus (décisions de Gwenaël) :
//   - le produit en gros dès la première réponse, rouge compris ; « pas
//     encore vu » blanc et vide ;
//   - la moitié miroir grise, avec le même nombre, seulement pour un calcul vu ;
//   - ✓ après le numéro des tables acquises, ma table soulignée en bleu ;
//   - « Table de 10 : acquise ✓ » (la 10 n'est pas dans le tableau) ;
//   - « Encore 10 calculs » seulement les jours où rien ne revient (retiré au
//     lot « Mon parcours », 04/10 au soir).
// Sur la carte de séance de l'accueil : « Mon mélange · tables 2, 5 et 10 ».
//
// Les fonctions sont EXTRAITES de la page et EXÉCUTÉES avec le vrai moteur et
// un faux DOM : ce test dit ce que voit l'élève, pas ce qu'on a écrit.
//
// Sabotages attendus (chacun rend ce fichier rouge) :
//   - écrire le produit dans une case jamais vue ;
//   - colorer la moitié miroir (ou la griser quand le calcul n'est pas vu) ;
//   - oublier le ✓ d'une table acquise ;
//   - laisser « et 10 » sécable sur la carte de séance ;
//   - ne pas resserrer la fiche du professeur (cadre plein).

import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }\n", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

// ------------------------------------------------------------------ faux DOM

function element(tag) {
  const classes = new Set();
  const el = {
    tag, hidden: false, children: [], attrs: {}, ecouteurs: {}, _texte: "", style: {},
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
    get textContent() { return el.children.length ? el.children.map(n => typeof n === "string" ? n : n.textContent).join("") : el._texte; },
    set textContent(v) { el.children = []; el._texte = String(v); },
    classList: {
      toggle(c, on) { (on === undefined ? !classes.has(c) : on) ? classes.add(c) : classes.delete(c); },
      add(c) { classes.add(c); }, remove(c) { classes.delete(c); }, contains(c) { return classes.has(c); }
    },
    append(...n) { el.children.push(...n); }, appendChild(n) { el.children.push(n); return n; },
    replaceChildren(...n) { el.children = [...n]; el._texte = ""; },
    setAttribute(k, v) { el.attrs[k] = String(v); }, getAttribute(k) { return el.attrs[k] ?? null; },
    addEventListener(t, f) { el.ecouteurs[t] = f; },
    querySelector(sel) { return el.sous[sel] || (el.sous[sel] = element(sel)); }, sous: {},
    get childNodes() { return el.children; }
  };
  return el;
}

function fauxDocument() {
  const ids = new Map();
  const document = {
    createElement: element,
    createElementNS: (_, tag) => element(tag),
    createTextNode: t => t,
    querySelector: sel => document.getElementById(sel)
  };
  document.getElementById = id => { if (!ids.has(id)) ids.set(id, element(id)); return ids.get(id); };
  return {document, $: document.getElementById};
}

// ----------------------------------------------------------- les parcours

const A = ["2026-09-14", "2026-09-15", "2026-09-18", "2026-09-25"];
const AUJ = P.jourLocal();
function tous(t) { return Array.from({length: 10}, (_, i) => `${Math.min(t, i + 1)}-${Math.max(t, i + 1)}`); }
function construire({acquises = [], jours = []} = {}) {
  let p = P.creerParcours();
  const rep = (cle, ok, date) => { p = P.appliquerReponse(p, cle, {correcte: ok, date}).parcours; };
  for (const t of acquises) {
    for (const j of A) for (const c of tous(t)) rep(c, true, j);
    p.tables[t].acquise = A[A.length - 1];
  }
  for (const [date, cles, ok] of jours) for (const c of cles) rep(c, ok, date);
  return P.normaliserParcours(p);
}

// renderCalculs, exécutée : le tableau tel que l'élève le voit.
function tableau(parcours, {maTable = 3} = {}) {
  const {document, $} = fauxDocument();
  const avant = `
    const document = ARG.document; const $ = ARG.$; const PARCOURS = ARG.P; const parcours = ARG.parcours;
    const tableEnCours = () => ARG.maTable; let calculsSelection = null;
    const renderBoites = () => {}; const renderJour = () => {}; const renderCalculsDetail = () => {}; const montrerDetail = () => {};
    const LIBELLES_ETATS_CALCULS = {"jamais-vu": "pas encore vu", "a-travailler": "à revoir", "en-cours": "en route", "su": "su"};
    const pluriel = (n, m) => n + " " + m + (n > 1 ? "s" : "");`;
  const code = [avant, source("renderCalculs")].join("\n");
  new Function("ARG", `${code}\nrenderCalculs();`)({document, $, P, parcours, maTable});
  const grille = $("calculs-grille").children;
  // 1 coin + 8 en-têtes de colonne, puis par ligne : 1 en-tête + 8 cases.
  const colonnes = grille.slice(1, 9);
  const lignes = [];
  for (let l = 0; l < 8; l += 1) lignes.push(grille.slice(9 + l * 9, 9 + (l + 1) * 9));
  const caseDe = (ligne, colonne) => {
    const bouton = lignes[ligne - 2][colonne - 1];
    const [nombre, carres] = bouton.children;
    return {classes: bouton.className, nombre: nombre.textContent, pleines: carres.children.filter(c => c.classList.contains("is-pleine")).length};
  };
  // Lot « Mon parcours » : après les cases, les deux bandes de la croix de ma table.
  return {$, colonnes, enTete: l => lignes[l - 2][0], caseDe, croix: grille.slice(9 + 8 * 9)};
}

// ------------------------------------------------------------------ tests

test("le tableau : le produit en gros dès la première réponse (rouge compris), une case jamais vue reste vide et blanche", () => {
  const p = construire({acquises: [2], jours: [["2026-10-01", ["3-7", "3-9"], true], ["2026-10-01", ["3-8"], false]]});
  const t = tableau(p);
  const vu = t.caseDe(3, 7);
  assert.equal(vu.nombre, "21");
  assert.match(vu.classes, /^mc-cell is-(en-cours|a-travailler|su)/);
  assert.equal(vu.pleines, p.calculs["3-7"].boite, "les cinq carrés : la boîte du calcul");
  const rouge = t.caseDe(3, 8);
  assert.equal(p.calculs["3-8"].boite, 1);
  assert.equal(rouge.classes, "mc-cell is-a-travailler");
  assert.equal(rouge.nombre, "24", "le rouge aussi porte son nombre (idée de Gwenaël)");
  const jamais = t.caseDe(4, 6);
  assert.equal(jamais.classes, "mc-cell is-jamais-vu");
  assert.equal(jamais.nombre, "", "une case jamais vue ne donne pas la réponse");
  assert.equal(jamais.pleines, 0);
  assert.match(html, /\.mc-cell \{\s*aspect-ratio: 1 \/ 1;[\s\S]*?background: #fff;/, "« pas encore vu » est blanc");
  assert.match(html, /\.mc-nb \{ font-size: 19px;/);
  assert.match(html, /@media \(min-width: 1024px\) \{\s*\.mc-nb \{ font-size: 22px; \}/);
});

test("la moitié miroir : grise avec le même nombre pour un calcul vu, blanche et vide sinon", () => {
  const p = construire({jours: [["2026-10-01", ["3-7"], true]]});
  const t = tableau(p);
  const miroirVu = t.caseDe(7, 3);
  assert.equal(miroirVu.classes, "mc-cell is-miroir is-vu");
  assert.equal(miroirVu.nombre, "21");
  assert.equal(miroirVu.pleines, p.calculs["3-7"].boite, "les mêmes carrés, en gris");
  const miroirJamais = t.caseDe(6, 4);
  assert.equal(miroirJamais.classes, "mc-cell is-miroir", "le miroir d'un calcul jamais vu reste blanc");
  assert.equal(miroirJamais.nombre, "");
  assert.doesNotMatch(miroirVu.classes, /is-(en-cours|su|a-travailler)/, "pas de couleur sur la moitié miroir");
  assert.match(html, /\.mc-cell\.is-miroir\.is-vu \{ border-color: #d5dbe0; color: #5f6e79; background: #e9edf1; \}/);
  assert.doesNotMatch(html, /\n    \.mc-cell\.is-miroir \{ opacity/, "plus de miroir à moitié transparent (seul le filtre d’une boîte l’estompe)");
});

// Lot « Mon parcours » (décision 3) : le soulignement n'était pas compris —
// ma table est sur une bande bleue, sa ligne ET sa colonne (« la croix ») ;
// le ✓ des tables passées passe À GAUCHE du numéro de ligne.
test("les en-têtes : ✓ avant le numéro des tables passées ; ma table : la croix (ligne et colonne), plus de soulignement", () => {
  const p = construire({acquises: [2, 5]});
  const t = tableau(p, {maTable: 3});
  assert.equal(t.enTete(2).className, "calculs-entete is-acquise");
  assert.equal(t.enTete(5).className, "calculs-entete is-acquise");
  assert.equal(t.enTete(2).attrs["aria-label"], "Table de 2, passée", "lot « un seul système » : la table est « passée »");
  assert.equal(t.enTete(3).className, "calculs-entete is-ma-table");
  assert.equal(t.colonnes[1].className, "calculs-entete is-ma-table", "la colonne 3 aussi");
  assert.equal(t.enTete(4).className, "calculs-entete");
  assert.deepEqual(t.croix.map(b => [b.className, b.style.gridRow, b.style.gridColumn, b.attrs["aria-hidden"]]),
    [["calculs-croix", "3 / span 1", "2 / span 8", "true"], ["calculs-croix", "2 / span 8", "3 / span 1", "true"]], "la ligne 3 et la colonne 3, derrière les cases");
  assert.deepEqual(tableau(p, {maTable: 9}).croix.map(b => [b.style.gridRow, b.style.gridColumn]), [["9 / span 1", "2 / span 8"], ["2 / span 8", "9 / span 1"]]);
  assert.equal(tableau(p, {maTable: 10}).croix.length, 0, "la table de 10 n’est pas dans le tableau : pas de croix");
  assert.equal(tableau(p, {maTable: null}).croix.length, 0);
  assert.match(html, /\.calculs-entete\.is-acquise::before \{ content: "✓"; margin-right: 2px;/);
  assert.doesNotMatch(html, /\.calculs-entete\.is-acquise::after|text-decoration: underline 3px/);
  assert.match(html, /\.calculs-croix \{ position: absolute; inset: -4px; z-index: 0; border-radius: 13px; background: var\(--blue\); pointer-events: none; \}/);
  assert.match(html, /\.calculs-grille\.is-filtre \.calculs-croix \{ display: none; \}/, "une boîte ou « Aujourd’hui » allumé : la croix s’efface");
});

test("« Table de 10 : passée ✓ » quand elle l’est (la 10 n’est pas dans le tableau)", () => {
  assert.match(html, /<p id="calculs-dix" class="calculs-dix" hidden><b>Table de 10<\/b>&nbsp;: passée ✓<\/p>/);
  assert.equal(tableau(construire({acquises: [2, 10]})).$("calculs-dix").hidden, false);
  assert.equal(tableau(construire({acquises: [2]})).$("calculs-dix").hidden, true);
});

// Lot « Mon parcours » (04/10/2026 au soir, décision de Gwenaël) : « Encore 10
// calculs » est retiré — même les jours où rien ne revient. La révision n'a
// qu'une porte, la séance.
test("plus d’« Encore 10 calculs » près du tableau, même quand rien ne revient — la révision n’a qu’une porte, la séance", () => {
  const rien = construire({jours: [[AUJ, tous(3), true]]});
  assert.equal(P.agendaCalculs(rien).dus, 0);
  assert.ok(P.calculsAVenir(rien).length > 0, "des calculs connus, à venir");
  const t = tableau(rien);
  assert.equal(t.$("calculs-grille").children.length > 0, true, "le tableau est dessiné");
  assert.doesNotMatch(html, /calculs-encore|libelleEncoreLibre/);
});

// Lot « un seul système » (05/10/2026) : Mon mélange est libre — il n'est
// plus une étape de la séance. Ses tables s'écrivent toujours de la même
// façon, là où il vit : la ligne ★ du menu et Mon parcours (qui abrège en
// « mes N tables » au-delà de 3 tables, lot « trophées »).
test("Mon mélange : « tables 2, 5 et 10 », « mes 9 tables » (« mes N tables » dès 4 dans Mon parcours), « et 10 » jamais seul à la ligne — et une étape de la séance seulement aux paliers", () => {
  const tablesDuMelange = new Function("PARCOURS_TABLES", `${source("listeTables")}\n${source("tablesDuMelange")}\nreturn tablesDuMelange;`)([...P.TABLES]);
  assert.equal(tablesDuMelange([2, 5, 10]), "tables 2, 5 et 10");
  assert.equal(tablesDuMelange([2, 10]), "tables 2 et 10");
  assert.equal(tablesDuMelange([2, 3, 4, 5, 6, 7, 8, 10]), "tables 2, 3, 4, 5, 6, 7, 8 et 10");
  assert.equal(tablesDuMelange([...P.TABLES]), "mes 9 tables");
  // La carte de séance dit le détail de l'étape « Mon mélange » (« mes N
  // tables · 1 min 30 », comme l'étoile) — aux paliers depuis le lot « Mon
  // mélange aux paliers ».
  assert.match(html, /: etape\.type === "etoile" \|\| etape\.type === "melange" \? etape\.detail/);
  // Lot « trophées » : dans Mon parcours, à côté des trois coupes, la liste
  // jusqu'à 3 tables, puis « mes N tables » (court, sur une ligne).
  assert.match(html, /tables\.textContent = etat\.melange\.tables\.length <= 3 \? tablesDuMelange\(etat\.melange\.tables\) : `mes \$\{etat\.melange\.tables\.length\}\\u00a0tables`;/, "Mon parcours");
  assert.match(html, /aria: `Mon mélange, \$\{tablesDuMelange\(melange\.tables\)\} : 20 questions en 1 min 30\.`,/, "la ligne ★ du menu");
  // La configuration du mélange porte bien ses tables, réussi ou non.
  const p = construire({acquises: [2, 5, 10]});
  p.melange = {...p.melange, aJour: false};
  assert.deepEqual(P.configMelange(p).tables, [2, 5, 10]);
  // Lot « Mon mélange aux paliers » (09/10/2026, décision de Gwenaël) : à
  // 3 tables passées, tant que la coupe des 3 manque, Mon mélange est la 2e
  // étape de la séance. La coupe gagnée, plus de mélange dans la séance, et
  // celui d'une vieille séance restée ouverte est sauté.
  assert.deepEqual(P.ouvrirSeance(p, {aujourdhui: AUJ}).file.filter(etape => etape.type !== "marche").map(etape => etape.type).slice(-1), ["melange"], "coupe des 3 à gagner : Mon mélange dans la séance");
  p.melange = {...p.melange, reussi: 3};
  const seance = P.ouvrirSeance(p, {aujourdhui: AUJ});
  assert.equal(seance.file.some(etape => etape.type === "melange"), false, "coupe gagnée : pas de mélange dans la séance");
  const vieille = {...seance, file: [{type: "melange"}, ...seance.file]};
  const suivante = P.etapeDeSeance(p, vieille, AUJ);
  assert.ok(suivante && suivante.type !== "melange", "un mélange venu d’une vieille séance est sauté");
});

test("la carte de ma table : l’échelle tant qu’elle n’est pas passée ; passée, la date", () => {
  const jouer = (parcours, maTable) => {
    const {document, $} = fauxDocument();
    const avant = `const document = ARG.document; const $ = ARG.$; const PARCOURS = ARG.P; const parcours = ARG.parcours;
      const echelleDeTable = table => Object.assign(document.createElement("div"), {className: "echelle", table});
      ${source("dateEnLettres")}`;
    const zone = $("parcours-matable");
    new Function("ARG", `${avant}\n${source("renderMaTable")}\nrenderMaTable(ARG.zone, ARG.P.etatAffichage(ARG.parcours), ARG.maTable);`)({document, $, P, parcours, zone, maTable});
    return zone;
  };
  const p = construire({acquises: [2]});
  const enCours = jouer(p, 3);
  assert.equal(enCours.children[0].children[0].textContent, "Table de 3");
  assert.equal(enCours.children[0].children[1].textContent, "ma table");
  assert.equal(enCours.children[1].className, "echelle");
  assert.equal(enCours.classList.contains("is-acquise"), false);
  const acquise = jouer(p, 2);
  assert.equal(acquise.children.length, 1, "pas d’échelle pour une table passée");
  assert.match(acquise.children[0].children[1].textContent, /^ma tablepassée le 25 septembre ✓$/);
  assert.equal(acquise.classList.contains("is-acquise"), true);
});

test("la page : une seule tuile, plus d’écran Mes calculs ; Mon parcours = ma table, Mes calculs, mélange, escalier", () => {
  assert.doesNotMatch(html, /id="open-calculs"|id="calculs" class="calculs-screen"|id="parcours-list"|id="parcours-legende"/);
  assert.match(html, /\.acc-liens > \.acc-lien \{ grid-template-columns: 34px auto; justify-content: center; width: min\(100%, 300px\); justify-self: center; \}/, "la tuile unique est un bouton centré");
  const ecran = html.slice(html.indexOf('<div id="parcours" class="parcours-screen" hidden>'), html.indexOf('<div id="play" hidden>'));
  // Lot « Mon parcours » : « Aujourd'hui » avant les boîtes ; l'ordre du code
  // est celui du téléphone (le tableau est à gauche sur ordinateur par le CSS).
  const ordre = ["parcours-matable", "parcours-calculs", "calculs-jour", "calculs-boites", "calculs-detail", "calculs-grille", "calculs-dix", "parcours-melange", "parcours-expert"]
    .map(id => ecran.indexOf(`id="${id}"`));
  assert.ok(ordre.every(i => i > 0), "tout est dans Mon parcours");
  assert.deepEqual([...ordre].sort((a, b) => a - b), ordre, "dans cet ordre");
  // La légende : cinq états, le cinquième est la moitié grise.
  assert.match(ecran, /<span class="mc-cell is-miroir is-vu"><span class="mc-nb">21<\/span>[\s\S]*?<\/span><\/span> même calcul<\/span>/);
  // L'adresse #calculs (et ouvrir=calculs) ouvre Mon parcours sur le bloc.
  assert.match(html, /function openCalculs\(\) \{\s*openParcours\(\);\s*\$\("parcours-calculs"\)\.scrollIntoView/);
});

test("la fiche : une page, le même tableau, des cases carrées partout (lot « Une seule fiche »)", () => {
  assert.doesNotMatch(html, /fiche-page2|id="fiche-rows"/);
  // Lot « Une seule fiche » (décision 4) : la ligne « Mes calculs : les 5
  // carrés… » (qui avait remplacé « Ma rangée ») quitte la fiche.
  assert.doesNotMatch(html, /<b>Mes calculs<\/b> : les 5 carrés/);
  assert.doesNotMatch(html, /<b>Ma rangée<\/b> : une case entourée/);
  assert.doesNotMatch(html, /avec-prof/, "la fiche du professeur ne se resserre plus");
  assert.match(html, /\.fiche-carre td \{ width: 13\.5mm; height: 13\.5mm; \}/, "13,5 mm sur toutes les fiches");
  // Noir et blanc : le texte coloré des cases est foncé (rouge, bleu, vert, gris).
  assert.match(html, /\.fiche-carre \.a-travailler, \.fiche-mini\.a-travailler \{ border-color: #efb4b4; background: #ffebeb; color: #a93030; \}/);
  assert.match(html, /\.fiche-carre \.miroir\.vu, \.fiche-mini\.miroir\.vu \{ border-color: #d5dbe0; background: #e9edf1; color: #5f6e79; \}/);
});
