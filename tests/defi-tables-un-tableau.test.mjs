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
//   - « Encore 10 calculs » seulement les jours où rien ne revient.
// Sur la carte de séance de l'accueil : « Mon mélange · tables 2, 5 et 10 ».
//
// Les fonctions sont EXTRAITES de la page et EXÉCUTÉES avec le vrai moteur et
// un faux DOM : ce test dit ce que voit l'élève, pas ce qu'on a écrit.
//
// Sabotages attendus (chacun rend ce fichier rouge) :
//   - écrire le produit dans une case jamais vue ;
//   - colorer la moitié miroir (ou la griser quand le calcul n'est pas vu) ;
//   - montrer « Encore 10 calculs » un jour où des calculs sont dus ;
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
    tag, hidden: false, children: [], attrs: {}, ecouteurs: {}, _texte: "",
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
    const renderBoites = () => {}; const renderCalculsDetail = () => {}; const montrerDetail = () => {};
    const LIBELLES_ETATS_CALCULS = {"jamais-vu": "pas encore vu", "a-travailler": "à revoir", "en-cours": "en route", "su": "su"};
    const pluriel = (n, m) => n + " " + m + (n > 1 ? "s" : "");`;
  const code = [avant, source("libelleEncoreLibre"), source("renderCalculs")].join("\n");
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
  return {$, colonnes, enTete: l => lignes[l - 2][0], caseDe};
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

test("les en-têtes : ✓ après le numéro des tables acquises, ma table soulignée (ligne et colonne)", () => {
  const p = construire({acquises: [2, 5]});
  const t = tableau(p, {maTable: 3});
  assert.equal(t.enTete(2).className, "calculs-entete is-acquise");
  assert.equal(t.enTete(5).className, "calculs-entete is-acquise");
  assert.equal(t.enTete(2).attrs["aria-label"], "Table de 2, acquise");
  assert.equal(t.enTete(3).className, "calculs-entete is-ma-table");
  assert.equal(t.colonnes[1].className, "calculs-entete is-ma-table", "la colonne 3 aussi");
  assert.equal(t.enTete(4).className, "calculs-entete");
  assert.match(html, /\.calculs-entete\.is-acquise::after \{ content: "✓";/);
  assert.match(html, /\.calculs-entete\.is-ma-table \{ color: var\(--blue\); text-decoration: underline 3px;/);
});

test("« Table de 10 : acquise ✓ » quand elle l’est (la 10 n’est pas dans le tableau)", () => {
  assert.equal(tableau(construire({acquises: [2, 10]})).$("calculs-dix").hidden, false);
  assert.equal(tableau(construire({acquises: [2]})).$("calculs-dix").hidden, true);
});

test("« Encore 10 calculs » seulement les jours où rien ne revient — la révision n’a qu’une porte, la séance", () => {
  // Des calculs dus aujourd'hui : rien près du tableau (la séance les a).
  const dus = construire({jours: [["2026-09-01", ["3-7", "3-8"], true]]});
  assert.ok(P.agendaCalculs(dus).dus > 0);
  assert.equal(tableau(dus).$("calculs-encore-zone").hidden, true);
  // Tout répondu aujourd'hui : rien ne revient, le bouton est là.
  const rien = construire({jours: [[AUJ, tous(3), true]]});
  assert.equal(P.agendaCalculs(rien).dus, 0);
  const t = tableau(rien);
  assert.equal(t.$("calculs-encore-zone").hidden, false);
  assert.equal(t.$("calculs-encore").textContent, "Encore 8 calculs", "le nombre de calculs connus, 10 au plus");
  // Rien de connu : pas de bouton.
  assert.equal(tableau(P.creerParcours()).$("calculs-encore-zone").hidden, true);
  assert.match(html, /\$\("calculs-encore"\)\.addEventListener\("click", \(\) => startRevision\(null, "parcours", true\)\);/);
});

test("la carte de séance : « Mon mélange · tables 2, 5 et 10 », « mes 9 tables », « et 10 » jamais seul à la ligne", () => {
  const tablesDuMelange = new Function("PARCOURS_TABLES", `${source("listeTables")}\n${source("tablesDuMelange")}\nreturn tablesDuMelange;`)([...P.TABLES]);
  assert.equal(tablesDuMelange([2, 5, 10]), "tables 2, 5 et 10");
  assert.equal(tablesDuMelange([2, 10]), "tables 2 et 10");
  assert.equal(tablesDuMelange([2, 3, 4, 5, 6, 7, 8, 10]), "tables 2, 3, 4, 5, 6, 7, 8 et 10");
  assert.equal(tablesDuMelange([...P.TABLES]), "mes 9 tables");
  assert.match(html, /: etape\.type === "melange" && etape\.config \? tablesDuMelange\(etape\.config\.tables\)/, "les tables de la série qui sera jouée");
  // La configuration du mélange de la séance porte bien ses tables.
  const p = construire({acquises: [2, 5, 10]});
  p.melange = {...p.melange, aJour: false};
  assert.deepEqual(P.configMelange(p).tables, [2, 5, 10]);
});

test("la carte de ma table : l’échelle tant qu’elle n’est pas acquise ; acquise, la date", () => {
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
  assert.equal(acquise.children.length, 1, "pas d’échelle pour une table acquise");
  assert.match(acquise.children[0].children[1].textContent, /^ma tableacquise le 25 septembre ✓$/);
  assert.equal(acquise.classList.contains("is-acquise"), true);
});

test("la page : une seule tuile, plus d’écran Mes calculs ; Mon parcours = ma table, Mes calculs, mélange, escalier", () => {
  assert.doesNotMatch(html, /id="open-calculs"|id="calculs" class="calculs-screen"|id="parcours-list"|id="parcours-legende"/);
  assert.match(html, /\.acc-liens > \.acc-lien \{ grid-template-columns: 34px auto; justify-content: center; width: min\(100%, 300px\); justify-self: center; \}/, "la tuile unique est un bouton centré");
  const ecran = html.slice(html.indexOf('<div id="parcours" class="parcours-screen" hidden>'), html.indexOf('<div id="play" hidden>'));
  const ordre = ["parcours-matable", "parcours-calculs", "calculs-boites", "calculs-detail", "calculs-grille", "calculs-dix", "calculs-encore", "parcours-melange", "parcours-expert"]
    .map(id => ecran.indexOf(`id="${id}"`));
  assert.ok(ordre.every(i => i > 0), "tout est dans Mon parcours");
  assert.deepEqual([...ordre].sort((a, b) => a - b), ordre, "dans cet ordre");
  // La légende : cinq états, le cinquième est la moitié grise.
  assert.match(ecran, /<span class="mc-cell is-miroir is-vu"><span class="mc-nb">21<\/span>[\s\S]*?<\/span><\/span> même calcul<\/span>/);
  // L'adresse #calculs (et ouvrir=calculs) ouvre Mon parcours sur le bloc.
  assert.match(html, /function openCalculs\(\) \{\s*openParcours\(\);\s*\$\("parcours-calculs"\)\.scrollIntoView/);
});

test("la fiche : une page, le même tableau, et la fiche du professeur se resserre (cadre plein)", () => {
  assert.doesNotMatch(html, /fiche-page2|id="fiche-rows"/);
  assert.match(html, /<p><b>Mes calculs<\/b> : les 5 carrés d’une case, c’est sa boîte\. Réussi le jour où il revient, un calcul monte d’une boîte ; raté, il redescend\.<\/p>/, "la ligne « Ma rangée » remplacée (choix de Gwenaël)");
  assert.doesNotMatch(html, /<b>Ma rangée<\/b> : une case entourée/);
  assert.match(html, /\.fiche-print\.avec-prof \.fiche-carre td \{ height: 9mm; \}/);
  assert.match(html, /\.fiche-carre td, \.fiche-mini \{ box-sizing: border-box; height: 11mm;/, "11 mm pour l’élève");
  // Noir et blanc : le texte coloré des cases est foncé (rouge, bleu, vert, gris).
  assert.match(html, /\.fiche-carre \.a-travailler, \.fiche-mini\.a-travailler \{ border-color: #efb4b4; background: #ffebeb; color: #a93030; \}/);
  assert.match(html, /\.fiche-carre \.miroir\.vu, \.fiche-mini\.miroir\.vu \{ border-color: #d5dbe0; background: #e9edf1; color: #5f6e79; \}/);
});
