// Lot « Une seule fiche » (08/10/2026) — décisions de Gwenaël (questions à
// choix du 08/10, planches 14 à 17) après la fiche de Toti (306), imprimée
// depuis « Ma classe » : ses 9 tables, ses 3 coupes et sa couronne gagnées le
// même jour, sans une seule séance sur une table ; la fiche avait des cases en
// long, des coupes et des étoiles foncées, et le cadre du professeur disait
// « Aucune séance ni activité enregistrée ».
//   1. Une seule fiche : la page 1 est la même partout (cases carrées de
//      13,5 mm, une page).
//   2. Le cadre du professeur devient une page 2, seulement depuis « Ma
//      classe » : les 9 tables toujours, une colonne « Passée » (« test
//      direct » : passée sans séance ni activité), puis Mon mélange, Je
//      deviens expert, Mes calculs et les jours de travail.
//   3. Une table passée : une pastille verte pleine (fiche, légende, table de
//      10, et Mon parcours à l'écran).
//   4. Plus de lignes de règles en bas de la fiche.
//   5. Mon mélange et Je deviens expert : deux cartes côte à côte.
//   6. Coupes et étoiles gagnées : jaune doré au contour foncé ; pas encore
//      gagnées : un contour gris, vide (planche 17, choix B).
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const lire = chemin => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
const html = lire("outils/calcul_mental/defi_tables.html");
const fiche = html.slice(html.indexOf('<section id="fiche-print"'), html.indexOf('<template id="notice-seance">'));

function source(nom) {
  const debut = html.indexOf(`      function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} doit exister dans la page`);
  const fin = html.indexOf("\n      }\n", debut) + "\n      }".length;
  return html.slice(debut, fin);
}

// ------------------------------------------------------------------ faux DOM

function element(tag = "div") {
  const classes = new Set();
  const el = {
    tag, hidden: false, children: [], attrs: {}, dataset: {}, _texte: "",
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
    get textContent() { return el.children.length ? el.children.map(n => (typeof n === "string" ? n : n.textContent)).join("") : el._texte; },
    set textContent(v) { el.children = []; el._texte = String(v); },
    classList: {
      toggle(c, on) { (on === undefined ? !classes.has(c) : on) ? classes.add(c) : classes.delete(c); },
      add(...c) { c.forEach(x => classes.add(x)); }, remove(...c) { c.forEach(x => classes.delete(x)); }, contains(c) { return classes.has(c); }
    },
    append(...n) { el.children.push(...n); },
    replaceChildren(...n) { el.children = [...n]; el._texte = ""; },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    get childNodes() { return el.children; }
  };
  return el;
}

function fauxDocument() {
  const ids = new Map();
  const document = {createElement: element, createElementNS: (_, tag) => element(tag), createTextNode: t => t, body: element("body")};
  document.getElementById = id => { if (!ids.has(id)) ids.set(id, element(id)); return ids.get(id); };
  return {document, $: document.getElementById};
}

// Les espaces insécables des dates (« 8 oct. ») deviennent des espaces pour comparer.
const texte = noeud => noeud.textContent.replace(/[  ]/g, " ");

// renderFicheProf, EXÉCUTÉE : la page 2 telle que la page la remplit.
function pageProf(parcours, {prenom = "", classe = "", date = "08/10/2026"} = {}) {
  const {document, $} = fauxDocument();
  $("fiche-prenom").textContent = prenom;
  $("fiche-classe").textContent = classe;
  $("fiche-date").textContent = date;
  const fiche = P.normaliserParcours(parcours);
  const renderFicheProf = new Function("document", "$", "PARCOURS", "PARCOURS_TABLES",
    `${source("dateCourte")}\n${source("renderFicheProf")}\nreturn renderFicheProf;`)(document, $, P, P.TABLES);
  renderFicheProf(fiche, P.etatAffichage(fiche, "2026-10-08"));
  const lignes = $("fiche-prof-rows").children.map(tr => tr.children.map(texte));
  return {$, lignes, ligne: id => texte($(id))};
}

// --------------------------------------------------------------- les élèves

const J = "2026-10-08";
const jour = n => P.ajouterJours(J, -n);
const calculs = (p, boite = k => 2, vu = J) => {
  for (let a = 2; a <= 9; a += 1) for (let b = a; b <= 9; b += 1) {
    const k = `${a}-${b}`;
    const valeur = boite(k);
    if (valeur) p.calculs[k] = {boite: valeur, vu, erreur: valeur === 1, gagne: vu, echeance: J};
  }
};
// Toti (306), le 08/10 : ses 9 tables par le test, 3 coupes, la couronne ; une séance (celle de l'expert).
function toti() {
  const p = P.creerParcours();
  p.prenom = "Toti";
  P.TABLES.forEach(table => { p.tables[table].acquise = J; });
  p.melange = {tables: [...P.TABLES], aJour: true, aRefaireAvec: null, dernier: J, score: 19, reussi: 9};
  p.expert = {etoiles: 5, dernier: J, couronne: J};
  p.seances = [J];
  p.jours = [J];
  calculs(p, k => (["3-4", "3-9", "5-8", "5-9", "6-9"].includes(k) ? 1 : 2));
  return p;
}
// Sam : des activités sur les 9 tables, 5 passées (2 à 6), la coupe des 3, deux séances aujourd'hui.
function sam() {
  const p = P.creerParcours();
  p.prenom = "Sam";
  P.TABLES.forEach(table => {
    const ligne = p.tables[table];
    ligne.seance.n = table;
    ligne.seance.dernier = J;
    Object.keys(ligne.fois).forEach((cle, i) => { ligne.fois[cle] = 1 + ((table + i) % 4); });
    if (table <= 6) ligne.acquise = J;
  });
  p.melange = {tables: [2, 3, 4, 5, 6], aJour: true, aRefaireAvec: null, dernier: J, score: 18, reussi: 3};
  p.seances = [J, J];
  p.jours = [J];
  calculs(p, k => (["3-4", "6-7", "7-8"].includes(k) ? 1 : 2));
  return p;
}
// Lina : 2, 5 et 10 passées par le test (29/09), la 3 après 4 séances, la 4 en route.
function lina() {
  const p = P.creerParcours();
  p.prenom = "Lina";
  [2, 5, 10].forEach(table => { p.tables[table].acquise = "2026-09-29"; });
  p.tables[3].acquise = "2026-10-02";
  p.tables[3].seance.n = 4;
  Object.assign(p.tables[3].fois, {beads: 1, construct: 1, gaps: 2, ordered: 1, desordre: 2, trous: 1, mixte: 3});
  p.tables[4].seance.n = 2;
  Object.assign(p.tables[4].fois, {beads: 1, construct: 1, gaps: 1, ordered: 1});
  p.melange = {tables: [2, 3, 5, 10], aJour: true, aRefaireAvec: null, dernier: "2026-10-06", score: 17, reussi: 3};
  p.jours = [20, 17, 9, 8, 6, 2, 0].map(jour);
  p.seances = [jour(9), jour(8), jour(6), jour(6), jour(0)];
  calculs(p, k => ([2, 3, 5].some(t => k.split("-").map(Number).includes(t)) ? 1 + (k.length % 5) : 0), jour(3));
  return p;
}
// Maëlys : ses 9 tables, les 3 coupes, ★★ réussie le 7 oct.
function maelys() {
  const p = P.creerParcours();
  p.prenom = "Maëlys";
  P.TABLES.forEach(table => { p.tables[table].acquise = "2026-10-01"; p.tables[table].seance.n = 3; p.tables[table].fois.beads = 1; });
  p.melange = {tables: [...P.TABLES], aJour: true, aRefaireAvec: null, dernier: "2026-10-05", score: 20, reussi: 9};
  p.expert = {etoiles: 2, dernier: "2026-10-07", couronne: null};
  p.jours = [jour(7), jour(5), jour(1)];
  p.seances = [jour(7), jour(5)];
  calculs(p, () => 4, jour(3));
  return p;
}

// ------------------------------------------------------------- 1. une seule fiche

test("1. une seule fiche : la page 1 ne se resserre plus pour le professeur — cases carrées de 13,5 mm partout, une page", () => {
  assert.doesNotMatch(html, /avec-prof/, "plus de fiche « avec-prof » resserrée (ni CSS ni JS)");
  assert.match(html, /\.fiche-carre \{ width: auto; margin-left: auto; margin-right: auto; \}\s*\n\s*\.fiche-carre td \{ width: 13\.5mm; height: 13\.5mm; \}/);
  assert.match(html, /\.fiche-carre tr > th:first-child \{ width: 9mm; \}/, "la colonne des pastilles : 9 mm");
  // Le pied de la page 1 vient juste après les deux cartes : la page du professeur est APRÈS lui.
  const page1 = fiche.slice(0, fiche.indexOf('<div id="fiche-prof"'));
  assert.match(page1, /<\/div>\s*<\/div>\s*<footer class="fiche-foot">mathsgo\.re · CC BY-NC-SA 4\.0<\/footer>\s*(<!--[\s\S]*?-->\s*)?$/);
  assert.equal((page1.match(/<footer /g) || []).length, 1);
  // La fiche vierge PDF est cette page 1, vide : toujours une page.
  const pdf = readFileSync(new URL("../outils/calcul_mental/fiche_parcours_tables.pdf", import.meta.url)).toString("latin1");
  assert.match(pdf, /\/Count 1\b/);
  assert.doesNotMatch(pdf, /\/Count [2-9]\b/);
});

test("1. la vignette et le catalogue suivent la fiche vierge refaite", () => {
  assert.match(lire("assets/js/catalogue-refonte-data.js"), /"thumbnail": "assets\/img\/thumbnails\/calcul-mental\/fiche-parcours-tables\.png\?v=8"/);
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=exerciseur-conversions-20261125-1/);
  // Le moteur n'a pas bougé : rien à déposer sur le serveur.
  assert.match(html, /defi_tables_mon_parcours\.js\?v=20261111-3/);
  assert.equal(lire("_serveur/public/prof/defi_tables_mon_parcours.js"), lire("outils/calcul_mental/defi_tables_mon_parcours.js"));
});

// ---------------------------------------------------- 2. la page du professeur

test("2. la page du professeur : une page 2, après le pied de la page 1, avec son propre pied", () => {
  assert.match(fiche, /<footer class="fiche-foot">mathsgo\.re · CC BY-NC-SA 4\.0<\/footer>\s*(<!--[\s\S]*?-->\s*)?<div id="fiche-prof" class="fiche-page-prof" hidden>\s*<div class="fiche-prof">\s*<h2 class="fiche-prof-titre">Pour le professeur <span id="fiche-prof-qui"><\/span><\/h2>/);
  assert.match(fiche, /<th>Résultats, nombres<br>manquants et divisions<\/th><th>Passée<\/th><\/tr><\/thead>\s*<tbody id="fiche-prof-rows"><\/tbody>\s*<\/table>\s*<p class="fiche-prof-ligne"><b>Mon mélange :<\/b> <span id="fiche-prof-melange"><\/span><\/p>\s*<p class="fiche-prof-ligne"><b>Je deviens expert :<\/b> <span id="fiche-prof-expert"><\/span><\/p>\s*<p class="fiche-prof-ligne"><b>Mes calculs :<\/b> <span id="fiche-prof-calculs"><\/span><\/p>\s*<p class="fiche-prof-ligne"><b>Jours de travail \(les 14 derniers\) :<\/b> <span id="fiche-prof-jours"><\/span><\/p>\s*<\/div>\s*<footer class="fiche-foot">mathsgo\.re · CC BY-NC-SA 4\.0<\/footer>\s*<\/div>\s*<\/section>/);
  // Sur le papier : une nouvelle feuille. À l'écran (vue « Ma classe ») : sous la page 1.
  const debutImpression = html.indexOf("      @page { size: A4 portrait; margin: 12mm; }");
  const impression = html.slice(debutImpression, html.indexOf("\n    }\n", debutImpression));
  assert.match(impression, /\.fiche-page-prof \{ break-before: page; margin-top: 0; \}/);
  assert.match(html, /\.fiche-page-prof \{ margin-top: 10mm; \}/);
  // Seulement depuis « Ma classe » (une source est donnée) ; ni l'élève, ni la fiche vierge.
  assert.match(html, /\$\("fiche-prof"\)\.hidden = !source;\s*renderFicheProf\(source \? fiche : null, etat\);/);
  assert.match(html, /const FICHE_VIERGE = "vierge";[\s\S]*?const vierge = source === FICHE_VIERGE;\s*if \(vierge\) source = null;/);
  assert.doesNotMatch(html, /fiche-prof-vide|Aucune séance ni activité enregistrée/);
});

test("2. Toti : ses 9 tables passées le 8 oct. par le test direct, les 2 coupes (lot « Mon mélange aux paliers »), la couronne", () => {
  const t = pageProf(toti(), {prenom: "Toti", classe: "306"});
  assert.equal(t.ligne("fiche-prof-qui"), "Toti · 306 · 08/10/2026");
  assert.equal(t.lignes.length, 9, "toujours les 9 tables");
  assert.deepEqual(t.lignes.map(l => l[0]), P.TABLES.map(table => `Table de ${table}`));
  t.lignes.forEach(l => {
    assert.deepEqual(l.slice(1, 9), Array(8).fill("·"), "aucune séance, aucune activité");
    assert.equal(l[9], "8 oct. · test direct");
  });
  assert.equal(t.ligne("fiche-prof-melange"), "les coupes des 3 et 6 tables · dernier joué le 8 oct. : 19 sur 20.");
  assert.equal(t.ligne("fiche-prof-expert"), "la couronne, gagnée le 8 oct.", "un seul point après « oct. »");
  assert.equal(t.ligne("fiche-prof-calculs"), "boîte 1 : 5 · boîte 2 : 31 · boîte 3 : 0 · boîte 4 : 0 · boîte 5 : 0 · pas encore vus : 0.");
  assert.equal(t.ligne("fiche-prof-jours"), "8 oct. (1 séance).");
  // Le compteur « Séances » ne change pas : un test réussi n'est pas une séance.
  assert.equal(t.$("fiche-prof-rows").children[0].children[1].className, "zero");
});

test("2. Sam : les compteurs des 9 tables ; « Passée » seulement pour les tables passées, sans « test direct »", () => {
  const s = pageProf(sam(), {prenom: "Sam", classe: "306"});
  assert.equal(s.lignes.length, 9);
  assert.deepEqual(s.lignes[0], ["Table de 2", "2", "3", "4", "1", "2", "7", "1", "2", "8 oct."]);
  assert.deepEqual(s.lignes.map(l => l[9]), ["8 oct.", "8 oct.", "8 oct.", "8 oct.", "8 oct.", "", "", "", ""]);
  assert.equal(s.$("fiche-prof-rows").children[0].children[9].className, "passee");
  assert.equal(s.ligne("fiche-prof-melange"), "la coupe des 3 tables · dernier joué le 8 oct. : 18 sur 20.");
  assert.equal(s.ligne("fiche-prof-expert"), "aucune étoile pour l’instant.");
  assert.equal(s.ligne("fiche-prof-jours"), "8 oct. (2 séances).");
});

test("2. Lina : « test direct » pour les tables passées sans rien, la date seule pour la table passée après des séances", () => {
  const l = pageProf(lina(), {prenom: "Lina", classe: "405"});
  const passee = Object.fromEntries(l.lignes.map(ligne => [ligne[0], ligne[9]]));
  assert.equal(passee["Table de 2"], "29 sept. · test direct");
  assert.equal(passee["Table de 5"], "29 sept. · test direct");
  assert.equal(passee["Table de 10"], "29 sept. · test direct");
  assert.equal(passee["Table de 3"], "2 oct.", "4 séances, puis passée");
  assert.equal(passee["Table de 4"], "", "en route : rien");
  assert.deepEqual(l.lignes[2].slice(1, 9), ["2", "1", "1", "1", "1", "·", "·", "·"], "la table de 4 : 2 séances, ses quatre premières activités");
  assert.equal(l.ligne("fiche-prof-melange"), "la coupe des 3 tables · dernier joué le 6 oct. : 17 sur 20.");
  assert.equal(l.ligne("fiche-prof-jours"), "18 sept. · 21 sept. · 29 sept. (1 séance) · 30 sept. (1 séance) · 2 oct. (2 séances) · 6 oct. · 8 oct. (1 séance).");
  const resume = P.etatAffichage(P.normaliserParcours(lina()), J).calculs;
  const vus = resume.boites.reduce((a, b) => a + b, 0);
  assert.ok(vus > 0 && vus < 36);
  assert.equal(l.ligne("fiche-prof-calculs"), `${resume.boites.map((n, i) => `boîte ${i + 1} : ${n}`).join(" · ")} · pas encore vus : ${36 - vus}.`);
});

test("2. Maëlys : ses étoiles et le jour de sa dernière réussite ; un élève neuf : les 9 tables vides, rien d'autre", () => {
  const m = pageProf(maelys(), {prenom: "Maëlys", classe: "306"});
  assert.equal(m.ligne("fiche-prof-expert"), "★★ · dernière réussite le 7 oct.");
  assert.equal(m.ligne("fiche-prof-melange"), "les coupes des 3 et 6 tables · dernier joué le 5 oct. : 20 sur 20.");
  assert.equal(m.ligne("fiche-prof-calculs"), "boîte 1 : 0 · boîte 2 : 0 · boîte 3 : 0 · boîte 4 : 36 · boîte 5 : 0 · pas encore vus : 0.");
  const neuf = P.creerParcours();
  neuf.prenom = "Noé";
  const n = pageProf(neuf, {prenom: "Noé", classe: "306", date: ""});
  assert.equal(n.ligne("fiche-prof-qui"), "Noé · 306", "une fiche vide n'a pas de date");
  assert.equal(n.lignes.length, 9);
  n.lignes.forEach(ligne => assert.deepEqual(ligne.slice(1), [...Array(8).fill("·"), ""]));
  assert.equal(n.ligne("fiche-prof-melange"), "aucune coupe · jamais joué.");
  assert.equal(n.ligne("fiche-prof-expert"), "aucune étoile pour l’instant.");
  assert.equal(n.ligne("fiche-prof-calculs"), "boîte 1 : 0 · boîte 2 : 0 · boîte 3 : 0 · boîte 4 : 0 · boîte 5 : 0 · pas encore vus : 36.");
  assert.equal(n.ligne("fiche-prof-jours"), "aucun.");
});

test("2. renderFicheProf(null) vide la page (la fiche de l'élève, la fiche vierge) ; les dates sont insécables", () => {
  const {document, $} = fauxDocument();
  const renderFicheProf = new Function("document", "$", "PARCOURS", "PARCOURS_TABLES",
    `${source("dateCourte")}\n${source("renderFicheProf")}\nreturn renderFicheProf;`)(document, $, P, P.TABLES);
  const plein = P.normaliserParcours(sam());
  renderFicheProf(plein, P.etatAffichage(plein, J));
  assert.equal($("fiche-prof-rows").children.length, 9);
  renderFicheProf(null, P.etatAffichage(plein, J));
  assert.equal($("fiche-prof-rows").children.length, 0);
  ["fiche-prof-qui", "fiche-prof-melange", "fiche-prof-expert", "fiche-prof-calculs", "fiche-prof-jours"].forEach(id => assert.equal($(id).textContent, "", id));
  const dateCourte = new Function(`${source("dateCourte")}\nreturn dateCourte;`)();
  assert.equal(dateCourte("2026-10-08"), "8 oct.");
  assert.equal(dateCourte("2026-09-29"), "29 sept.");
  assert.equal(dateCourte(null), "");
});

// ------------------------------------------------- 3. la pastille d'une table passée

test("3. une table passée : une pastille verte pleine — en tête de ligne, dans la légende, pour la table de 10", () => {
  assert.match(html, /\.fiche-carre th\.is-acquise \{ border-radius: 2mm; background: #147447; color: #fff; font-size: 11pt; \}/);
  assert.match(html, /\.fiche-carre th\.is-acquise::before \{ content: "✓"; margin-right: \.3mm; color: #fff; font-size: 9pt; \}/);
  assert.match(html, /\.fiche-passee \{ display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; min-width: 9mm; height: 9mm; padding: 0 1mm; border-radius: 2mm; background: #147447; color: #fff;/);
  const legende = fiche.slice(fiche.indexOf('<p class="fiche-carre-legende"'), fiche.indexOf("</p>", fiche.indexOf('<p class="fiche-carre-legende"')));
  assert.equal((legende.match(/<span>/g) || []).length, 6, "six éléments dans la légende");
  assert.match(legende, /<\/i>même calcul<\/span>\s*<span><i class="fiche-passee">✓3<\/i>table passée<\/span>\s*$/);
  assert.match(fiche, /<p id="fiche-dix" class="fiche-dix" hidden><i class="fiche-passee">✓10<\/i>Table de 10&nbsp;: passée<\/p>/);
  // display:flex battrait l'attribut hidden du navigateur : la règle [hidden] le rétablit.
  assert.match(html, /\.fiche-dix \{ display: flex;[^}]*\}\s*\n\s*\.fiche-dix\[hidden\] \{ display: none; \}/);
});

test("3. à l'écran, Mon parcours : la même pastille ; sur ordinateur, la colonne des numéros passe à 30 px (largeur inchangée)", () => {
  assert.match(html, /\.calculs-entete\.is-acquise\[role="rowheader"\] \{ border-radius: 9px; background: var\(--green\); color: #fff; \}\s*\n\s*\.calculs-entete\.is-acquise\[role="rowheader"\]::before \{ color: #fff; \}\s*\n\s*\.calculs-grille > \.calculs-entete\[role="rowheader"\] \{ min-width: 32px; \}/);
  // Après la règle qui colore ma table en bleu (même poids) : la pastille gagne.
  assert.ok(html.indexOf('.calculs-entete.is-acquise[role="rowheader"] {') > html.indexOf('.calculs-entete.is-ma-table[role="rowheader"] { color: var(--blue); }'));
  const ordi = html.slice(html.indexOf("    @media (min-width: 1024px) {\n      .panel.avec-parcours"), html.indexOf("\n    }\n", html.indexOf("    @media (min-width: 1024px) {\n      .panel.avec-parcours")));
  assert.match(ordi, /grid-template-columns: 30px repeat\(8, 43px\);/);
  assert.equal(30 + 8 * 43 + 8 * 3, 398, "la largeur de la grille (398 px, 3 px d'écart) ne change pas");
  assert.match(ordi, /\.calculs-grille > \.calculs-entete\[role="rowheader"\] \{ min-width: 0; \}/);
  // La tuile Mon mélange : coupes de 30 px ; sur un ordinateur bas, la règle
  // « max-height: 700px », placée APRÈS, les garde à 22 px (cadre blanc entier).
  const trente = html.indexOf("    .parcours-suite .mp-trophees b { width: 30px; height: 30px; }");
  const bas = html.indexOf("      .parcours-suite .mp-trophees b { width: 22px; height: 22px; }");
  assert.ok(trente > 0 && bas > trente);
  assert.match(html, /\.parcours-suite \.mp-trophees \{ gap: 5px; \}/);
  // Le moteur du rendu n'a pas changé : la classe vient toujours de la ligne acquise.
  assert.match(html, /etiquette\.className = `calculs-entete\$\{ligne\.ligne === maTable \? " is-ma-table" : ""\}\$\{acquise \? " is-acquise" : ""\}`;/);
});

// ------------------------------------------------------ 4 et 5. le bas de la fiche

test("4 et 5. plus de lignes de règles ; Mon mélange et Je deviens expert, deux cartes côte à côte", () => {
  assert.doesNotMatch(html, /fiche-rules|<b>Mes calculs<\/b> : les 5 carrés|<b>Passée ✓<\/b>/);
  assert.match(fiche, /<div class="fiche-duo">\s*<div class="fiche-block fiche-melange">\s*<strong>Mon mélange<\/strong>\s*<span id="fiche-melange-state" class="fiche-state"><\/span>\s*<p>Mes tables passées, 20 questions en 1 min 30\. Une coupe avec 3, puis 6 tables\.<\/p>\s*<\/div>\s*<div class="fiche-block fiche-expert">\s*<strong>Je deviens expert<\/strong>\s*<span id="fiche-stars" class="fiche-stars"><\/span>\s*<p>Mes 9 tables passées : 25 questions\. ★ 2 min · ★★ 1 min 45 · ★★★ 1 min 30 · ★★★★ 1 min 15 · 👑 1 min<\/p>\s*<\/div>\s*<\/div>/);
  assert.match(html, /\.fiche-duo \{ display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-top: 3mm; \}/);
  assert.match(html, /\.fiche-block \{ margin: 0; padding: 3mm 4mm;[^}]*text-align: center; break-inside: avoid; \}/);
  assert.match(html, /\.fiche-block strong \{ display: block; font-size: 13pt; \}/);
  assert.match(html, /\.fiche-state, \.fiche-stars \{ display: inline-flex; align-items: center; justify-content: center; margin: 2mm auto 1mm; padding: 1mm 3mm; border-radius: 3mm; background: #fff; \}/);
  assert.match(html, /\.fiche-state \.mp-trophees \{ gap: 2\.5mm; \}/);
  assert.match(html, /\.fiche-stars \.couronne \{ width: 6\.5mm; height: 5\.4mm;/);
  // L'écran de l'élève garde ses titres longs : seul le papier change.
  assert.match(html, /expertTitle\.textContent = "Je deviens expert : toutes les tables, de plus en plus vite";/);
});

// ---------------------------------------------------- 6. les couleurs, en noir et blanc

test("6. coupes et étoiles : gagnées, jaune doré au contour foncé ; pas encore gagnées, un contour gris, vide (planche 17, choix B)", () => {
  assert.match(html, /\.fiche-state \.mp-trophees b \{ width: 10mm; height: 10mm; color: #6b7a87; filter: none; \}/);
  assert.match(html, /\.fiche-state \.mp-trophees b \.corps \{ fill: #fff; stroke: currentColor; stroke-width: 1\.3; stroke-linejoin: round; \}/);
  assert.match(html, /\.fiche-state \.mp-trophees b\.is-gagne \{ color: #8a6500; \}/);
  assert.match(html, /\.fiche-state \.mp-trophees b\.is-gagne \.corps \{ fill: #f4c430; \}/);
  assert.match(html, /\.fiche-stars \{ color: #fff; -webkit-text-stroke: \.35pt #6b7a87; font-size: 15pt;/, "pas encore gagnée : vide, contour gris");
  assert.match(html, /\.fiche-stars b \{ color: #f4c430; -webkit-text-stroke: \.35pt #8a6500; font-weight: 400; \}/);
  assert.match(html, /\.fiche-stars \.couronne path \{ stroke: #6b7a87; stroke-width: 1\.3; stroke-linejoin: round; paint-order: stroke; \}\s*\n\s*\.fiche-stars b \.couronne path \{ stroke: #8a6500; \}/);
  assert.doesNotMatch(html, /\.fiche-stars \{[^}]*color: #(c9d6df|9fb0bd)/, "plus de gris plein, qui sortait plus foncé que le jaune en noir et blanc");
  // Le jaune doré, imprimé en noir et blanc, reste plus clair que le contour gris : les deux se distinguent.
  const gris = hex => { const [r, v, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16)); return 0.299 * r + 0.587 * v + 0.114 * b; };
  assert.ok(gris("ffffff") - gris("f4c430") > 50, "vide (blanc) et plein (jaune) bien différents en gris");
  assert.ok(gris("f4c430") - gris("8a6500") > 80, "le contour foncé d'une étoile gagnée se voit sur son jaune");
});
