// Lot « Mon parcours, bilan, boutons, fiche vierge » de Défi tables (04/10/2026).
//
// Les décisions de Gwenaël (toutes visibles sur les planches du dossier
// audit-defi-tables\mon-parcours\) :
//   1. Mon parcours : ma table en haut, puis Mes calculs (titre, « Aujourd'hui »,
//      les boîtes, le tableau, la légende), le mélange, Expert.
//   2. Ordinateur : deux colonnes, mesuré comme les autres écrans (× 0,8 au moins).
//   3. Ma table dans le tableau : la croix (sa ligne et sa colonne sur une bande
//      bleue) ; le ✓ des tables acquises à gauche du numéro de ligne.
//   4. Un seul « allumé » : ma table, une boîte ou « Aujourd'hui ».
//   5. La ligne « Aujourd'hui : N calculs reviennent dans ta séance ».
//   6. Le détail seulement au toucher, avec ✕ ; au téléphone SOUS le tableau.
//   7. Une boîte : ses calculs rangés par JOUR de retour (plus le délai de la boîte).
//   8. Une case : « En route — boîte 3 », « Il reviendra dans ta séance… ».
//  10. La légende garde son « 21 » (Gwenaël, 04/10 au soir : on le GARDE).
//  11. Mon mélange compact.
//  12. Le bilan : « À retenir pour la prochaine séance », sans phrase.
//  13. La rangée (accueil et bilan) aux couleurs du tableau.
//  15. La fiche vierge = la fiche de l'appli, vide, sur une page ; la croix y est aussi.
//
// Les fonctions sont EXTRAITES de la page et EXÉCUTÉES avec le vrai moteur et
// un faux DOM : ce test dit ce que voit l'élève, pas ce qu'on a écrit.
//
// Sabotages attendus (chacun rend ce fichier rouge) : la croix tracée jusqu'à
// « -1 » (lignes implicites), le jour d'une boîte remplacé par son délai, un
// calcul raté laissé vide dans la rangée, la phrase remise sous « À retenir »,
// le détail ouvert au-dessus du tableau au téléphone, Mon parcours remis en
// « page longue », la croix oubliée sur la fiche, le « 21 » retiré de la légende.

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

function element(tag = "div") {
  const classes = new Set();
  const el = {
    tag, type: "", hidden: false, children: [], attrs: {}, dataset: {}, ecouteurs: {}, style: {}, _texte: "",
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
    get textContent() { return el.children.length ? el.children.map(n => (typeof n === "string" ? n : n.textContent)).join("") : el._texte; },
    set textContent(v) { el.children = []; el._texte = String(v); },
    classList: {
      toggle(c, on) { (on === undefined ? !classes.has(c) : on) ? classes.add(c) : classes.delete(c); },
      add(...c) { c.forEach(x => classes.add(x)); }, remove(...c) { c.forEach(x => classes.delete(x)); }, contains(c) { return classes.has(c); }
    },
    append(...n) { el.children.push(...n); }, appendChild(n) { el.children.push(n); return n; },
    replaceChildren(...n) { el.children = [...n]; el._texte = ""; },
    setAttribute(k, v) { el.attrs[k] = String(v); }, getAttribute(k) { return el.attrs[k] ?? null; },
    addEventListener(t, f) { el.ecouteurs[t] = f; },
    click() { el.ecouteurs.click?.(); },
    getBoundingClientRect() { return {top: 100, bottom: 160, left: 0, right: 300}; },
    get childNodes() { return el.children; },
    tous(test) { return [...(test(el) ? [el] : []), ...el.children.flatMap(n => (n && n.tous ? n.tous(test) : []))]; }
  };
  return el;
}
const parClasse = (racine, c) => racine.tous(n => n.classList && n.classList.contains(c));
const parTag = (racine, t) => racine.tous(n => n.tag === t);

function fauxDocument() {
  const ids = new Map();
  const document = {
    createElement: element,
    createElementNS: (_, tag) => element(tag),
    createTextNode: t => t,
    querySelector: () => null,
    body: element("body")
  };
  document.getElementById = id => { if (!ids.has(id)) ids.set(id, element(id)); return ids.get(id); };
  return {document, $: document.getElementById};
}

// ----------------------------------------------------------- Léa, mardi 6 octobre

const AUJ = "2026-10-06";
// Léa (comme sur les planches) : table de 3 ; 2, 5 et 10 acquises ; boîtes 1 · 1 · 4 · 6 · 9 ;
// 8 calculs dus aujourd'hui (le raté d'hier, 3 × 7, et les six de la boîte 4).
function lea() {
  const p = P.creerParcours();
  const fait = (boite, echeance, erreur = "") => ({boite, cases: 0, vu: "2026-09-28", erreur, gagne: "", echeance});
  for (let m = 2; m <= 9; m += 1) p.calculs[`2-${m}`] = fait(5, "2026-10-09");
  p.calculs["3-5"] = fait(5, "2026-10-16");
  for (const cle of ["4-5", "5-5", "5-6", "5-7", "5-8", "5-9"]) p.calculs[cle] = fait(4, AUJ);
  for (const cle of ["3-3", "3-4", "3-6", "3-9"]) p.calculs[cle] = fait(3, "2026-10-08");
  p.calculs["3-7"] = fait(2, AUJ);
  p.calculs["3-8"] = fait(1, "2026-10-05", "2026-10-05");
  for (const t of [2, 5, 10]) p.tables[t].acquise = "2026-10-02";
  return P.normaliserParcours(p);
}

// Mes calculs, exécuté : renderCalculs et tout ce qu'il dessine (« Aujourd'hui »,
// les boîtes, le tableau, la croix, le détail), avec le moteur réel.
function mesCalculs(parcours, {maTable = 3, aujourdhui = AUJ} = {}) {
  const {document, $} = fauxDocument();
  const avant = `
    const document = ARG.document; const $ = ARG.$; const parcours = ARG.parcours;
    const PARCOURS = {...ARG.P, jourLocal: () => ARG.aujourdhui,
      grilleCalculs: p => ARG.P.grilleCalculs(p, ARG.aujourdhui), agendaCalculs: p => ARG.P.agendaCalculs(p, ARG.aujourdhui),
      etatAffichage: p => ARG.P.etatAffichage(p, ARG.aujourdhui)};
    const tableEnCours = () => ARG.maTable; let calculsSelection = null;
    const MARGE_DETAIL = 8; const window = {innerHeight: 740, scrollBy: () => {}};
    const LIBELLES_ETATS_CALCULS = {"jamais-vu": "pas encore vu", "a-travailler": "à revoir", "en-cours": "en route", "su": "su"};
    const pluriel = (n, m) => n + " " + m + (n > 1 ? "s" : "");`;
  const fonctions = ["soude", "jourDuJour", "majuscule", "ligneDetail", "libelleDans", "montrerDetail", "sansAnimation",
    "jourDeRetour", "calculsDeDemain", "sortesDeCalculs", "renderCalculsDetail", "renderBoites", "renderCalculs", "renderJour"].map(source);
  // L'écouteur de la carte de ma table (posé une fois au démarrage de la page).
  const ecouteurCarte = html.slice(html.indexOf('      $("parcours-matable").addEventListener("click", () => {'), html.indexOf("      });", html.indexOf('      $("parcours-matable").addEventListener("click", () => {')) + "      });".length);
  const code = [avant, ...fonctions, ecouteurCarte, "renderCalculs();", "return {selection: () => calculsSelection};"].join("\n");
  const etat = new Function("ARG", code)({document, $, P, parcours, maTable, aujourdhui});
  const grille = () => $("calculs-grille").children;
  const cases = () => grille().filter(n => n.classList.contains("mc-cell"));
  const caseDe = (ligne, colonne) => grille().slice(9 + (ligne - 2) * 9, 9 + (ligne - 1) * 9)[colonne - 1];
  const croix = () => grille().filter(n => n.classList.contains("calculs-croix"));
  const detail = () => $("calculs-detail");
  const lignesDetail = () => detail().children.filter(n => n.tag !== "button").map(n => n.textContent);
  const boite = n => $("calculs-boites").children[n - 1];
  const jour = () => $("calculs-jour").children[0];
  return {$, etat, cases, caseDe, croix, detail, lignesDetail, boite, jour, carte: $("parcours-matable"), grille: $("calculs-grille")};
}

// ------------------------------------------------------------------ tests

test("1 et 6. l’ordre du code est celui du téléphone : ma table, Mes calculs (titre, Aujourd’hui, boîtes, détail, tableau, légende), mélange, Expert", () => {
  const ecran = html.slice(html.indexOf('<div id="parcours" class="parcours-screen" hidden>'), html.indexOf('<div id="play" hidden>'));
  const ids = ["parcours-matable", "parcours-calculs", "calculs-titre", "calculs-jour", "calculs-boites", "calculs-aide", "calculs-detail", "calculs-grille", "calculs-dix", "parcours-melange", "parcours-expert"];
  const positions = ids.map(id => ecran.indexOf(`id="${id}"`));
  assert.ok(positions.every(i => i > 0), "tout est dans Mon parcours");
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.ok(ecran.indexOf('class="calculs-legende"') > ecran.indexOf('id="calculs-grille"'));
  // Au téléphone, les deux enveloppes s'effacent (display: contents) et l'ordre
  // à l'écran est fixé : le détail s'ouvre SOUS le tableau, avant la légende —
  // il ne cache aucune case (la bulle collée en bas cachait 6 × 9 et 8 × 9).
  assert.match(html, /\.calculs-bloc \{ display: flex; flex-direction: column; \}\s*\.calculs-tete, \.calculs-tableau \{ display: contents; \}/);
  const ordre = nom => Number(html.match(new RegExp(`\\n    \\.${nom} \\{ order: (\\d+);`))[1]);
  const vu = ["calculs-titre", "calculs-jour", "calculs-boites", "calculs-grille", "calculs-detail", "calculs-legende", "calculs-aide", "calculs-dix"].map(ordre);
  assert.deepEqual(vu, [1, 2, 3, 4, 5, 6, 7, 8], "titre, Aujourd’hui, boîtes, tableau, détail, légende, aide, table de 10");
  // « Encore 10 calculs » est retiré (décision de Gwenaël, 04/10 au soir).
  assert.doesNotMatch(ecran, /calculs-encore|calculs-action/);
  // display: contents seulement sur des enveloppes sans rôle : rien ne quitte
  // l'arbre d'accessibilité (titre, grille, boutons gardent le leur).
  assert.match(ecran, /<div class="calculs-tete">/);
  assert.match(ecran, /<div class="calculs-tableau">/);
  assert.doesNotMatch(ecran, /<div class="calculs-(tete|tableau)" role=/);
  // Le détail : une zone « status » toujours dans la page (fermée = 0 px), pour
  // que le lecteur d'écran lise ce qui y arrive.
  assert.match(ecran, /<div id="calculs-detail" class="calculs-detail is-ferme" role="status" aria-live="polite"><\/div>/);
  assert.match(html, /\.calculs-detail\.is-ferme \{ display: block; height: 0; margin: 0; padding: 0; border: 0; overflow: hidden; box-shadow: none; \}/);
});

test("2. ordinateur : deux colonnes — le tableau à gauche, ma table, Aujourd’hui et les boîtes, le mélange et Expert à droite ; le détail sur le mélange", () => {
  const ordi = html.slice(html.indexOf("    @media (min-width: 1024px) {\n      .panel.avec-parcours"), html.indexOf("\n    }\n", html.indexOf("    @media (min-width: 1024px) {\n      .panel.avec-parcours")));
  assert.match(ordi, /\.parcours-corps \{ display: grid; grid-template-columns: auto minmax\(0, 1fr\);/);
  assert.match(ordi, /\.calculs-bloc \{ display: contents; \}/);
  assert.match(ordi, /\.parcours-corps > \.parcours-matable \{ grid-column: 2; grid-row: 1;/);
  assert.match(ordi, /\.calculs-tableau \{ grid-column: 1; grid-row: 1 \/ span 3;/);
  assert.match(ordi, /\.calculs-titre \{ grid-column: 1; grid-row: 1;/);
  assert.match(ordi, /\.calculs-tete \{ grid-column: 2; grid-row: 2; \}/);
  // Lot « les trophées » : la colonne de droite finit au bas du tableau —
  // « Je deviens expert » prend la hauteur qui reste ; les trophées restent à
  // côté de « Mon mélange », sur la même ligne.
  assert.match(ordi, /\.parcours-suite \{ grid-column: 2; grid-row: 3; align-self: stretch; display: flex; flex-direction: column; \}/);
  assert.match(ordi, /\.parcours-suite #parcours-expert \{ flex: 1 1 auto; \}/);
  assert.match(ordi, /\.parcours-suite \.mp-melange-droite \{ flex-wrap: nowrap; \}/);
  // Écran bas (1024 × 600) : le bloc de Mon mélange et ses trophées se resserrent.
  assert.match(html, /@media \(min-width: 1024px\) and \(max-height: 700px\) \{[^@]*?\.parcours-suite #parcours-melange \{ padding-top: 8px; padding-bottom: 8px; \}\s*\.parcours-suite \.mp-trophees b \{ width: 22px; height: 22px; \}\s*\}/);
  // Lot « Une seule fiche » : la colonne des numéros à 30 px (la pastille d'une
  // table passée), les cases à 43 px — la largeur ne change pas.
  assert.match(ordi, /\.calculs-grille \{ width: 398px; max-width: none; margin-top: 6px; grid-template-columns: 30px repeat\(8, 43px\); \}/, "cases de 43 px");
  assert.match(ordi, /\.calculs-dix \{ position: absolute; top: 13px; right: 14px; margin: 0; \}/, "« Table de 10 : acquise ✓ » en haut à droite du tableau");
  assert.match(ordi, /\.calculs-detail \{ position: absolute; z-index: 30; left: 0; right: 0; top: calc\(100% \+ 6px\);/, "sous les boîtes, posé sur le mélange et Expert : rien ne bouge");
  assert.match(ordi, /\.calculs-aide\.is-cache \{ display: block; visibility: hidden; \}/, "la ligne d’aide garde sa place");
  // Le panneau : une classe posée par show(), plus de :has().
  assert.match(html, /document\.querySelector\("\.panel"\)\.classList\.toggle\("avec-parcours", name === "parcours"\);/);
  assert.doesNotMatch(html, /:has\(#parcours/);
  assert.doesNotMatch(html, /essai-[a-z]/, "aucune variante d’essai du prototype");
});

// Lot « retouches après Mon parcours » (point 6) : la plus petite échelle est × 0,75.
test("2. l’échelle : Mon parcours est mesuré comme l’accueil (× 0,75 à × 1 en fenêtre, agrandi en plein écran, × 0,75 s’il ne tient pas) ; Lire la table reste une page longue", () => {
  // ajusterEchelle, EXÉCUTÉE : la hauteur du corps suit l'échelle (comme le zoom).
  const jouer = ({ecran, hauteur, largeur = 1366, fenetre = 768, plein = false}) => {
    const proprietes = {};
    const classes = new Set(plein ? ["fullscreen-active"] : []);
    const visibles = {parcours: ecran === "parcours", lire: ecran === "lire", intro: false, "mode-screen": false};
    const document = {
      documentElement: {style: {setProperty: (k, v) => { proprietes[k] = v; }, getPropertyValue: k => proprietes[k] || ""}},
      body: {classList: {contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c)},
        get offsetHeight() { return Math.round(hauteur * Number(proprietes["--echelle"] || 1)); }},
      getElementById: id => (id in visibles ? {hidden: !visibles[id]} : null),
      querySelector: () => null
    };
    const window = {innerWidth: largeur, innerHeight: fenetre, scrollY: 0, scrollTo: () => {}, matchMedia: () => ({matches: false})};
    const code = html.slice(html.indexOf("      const ECHELLE = Object.freeze("), html.indexOf('      window.addEventListener("resize", ajusterEchelle);'));
    new Function("document", "window", "retracerSauts", `${code}\najusterEchelle();`)(document, window, () => {});
    return Number(proprietes["--echelle"]);
  };
  const z = jouer({ecran: "parcours", hauteur: 800});
  assert.ok(z < 1 && z >= 0.955 && z <= 768 / 800, `réduit juste ce qu’il faut (${z})`);
  assert.equal(jouer({ecran: "parcours", hauteur: 700}), 1, "jamais plus grand que nature en fenêtre");
  assert.equal(jouer({ecran: "parcours", hauteur: 1300, fenetre: 650}), 0.75, "il ne tient pas : × 0,75, pas × 1");
  assert.ok(jouer({ecran: "parcours", hauteur: 780, fenetre: 911, plein: true}) > 1.1, "plein écran : agrandi");
  assert.equal(jouer({ecran: "lire", hauteur: 1300, fenetre: 650}), 1, "Lire la table : page longue, × 1 en fenêtre");
});

test("3. la croix : la ligne ET la colonne de ma table, derrière les cases ; aucune quand ma table n’est pas dans le tableau", () => {
  const t = mesCalculs(lea());
  assert.deepEqual(t.croix().map(b => [b.style.gridRow, b.style.gridColumn, b.attrs["aria-hidden"]]),
    [["3 / span 1", "2 / span 8", "true"], ["2 / span 8", "3 / span 1", "true"]]);
  assert.equal(t.grille.classList.contains("is-filtre"), false);
  assert.equal(t.carte.classList.contains("is-eteinte"), false, "au départ, c’est ma table qui est allumée");
  // Les lignes de la grille sont implicites : « -1 » viserait la ligne des numéros.
  assert.doesNotMatch(source("renderCalculs"), /"2 \/ -1"/);
  assert.equal(mesCalculs(lea(), {maTable: 10}).croix().length, 0);
  // Le dessin : une bande pleine derrière les cases (z-index), pas des cadres.
  assert.match(html, /\.calculs-grille > \.mc-cell \{ z-index: 1; \}/);
  assert.match(html, /\.calculs-croix \{ position: absolute; inset: -4px; z-index: 0; border-radius: 13px; background: var\(--blue\); pointer-events: none; \}/);
  assert.match(html, /\.calculs-entete\.is-acquise::before \{ content: "✓"; margin-right: 2px;/, "✓ à gauche du numéro de ligne");
  assert.doesNotMatch(html, /text-decoration: underline 3px/, "plus de soulignement");
});

test("4 et 7. une boîte touchée : ses cases s’allument, la croix et la carte s’éteignent ; ses calculs rangés par jour de retour", () => {
  const t = mesCalculs(lea());
  t.boite(4).click();
  assert.equal(t.grille.classList.contains("is-filtre"), true);
  assert.equal(t.carte.classList.contains("is-eteinte"), true, "la carte de ma table s’éteint");
  assert.equal(t.boite(4).attrs["aria-pressed"], "true");
  const allumees = t.cases().filter(c => c.classList.contains("is-dans-boite")).map(c => c.textContent.replace(/\D/g, ""));
  assert.deepEqual(allumees, ["20", "25", "30", "35", "40", "45"], "les six calculs de la boîte 4 (pas leur miroir)");
  assert.equal(t.detail().classList.contains("is-ferme"), false);
  assert.equal(t.$("calculs-aide").classList.contains("is-cache"), true, "la ligne d’aide se cache");
  // Boîte 4 : six calculs dus aujourd'hui — « Aujourd'hui », plus jamais « dans 7 jours ».
  assert.deepEqual(t.lignesDetail(), ["Boîte 4 · 6 calculs", "Aujourd’hui4 × 55 × 55 × 65 × 75 × 85 × 9"]);
  const jours = parClasse(t.detail(), "mc-detail-jours")[0];
  assert.deepEqual(parTag(jours, "b").map(b => b.textContent), ["Aujourd’hui"]);
  assert.doesNotMatch(t.detail().textContent, /7 jours|reviennent/);
  // Boîte 5 : huit dans 3 jours, un dans 10 jours — chaque jour son titre.
  t.boite(5).click();
  assert.deepEqual(parTag(parClasse(t.detail(), "mc-detail-jours")[0], "b").map(b => b.textContent), ["Dans 3 jours", "Dans 10 jours"]);
  assert.deepEqual(parClasse(t.detail(), "mc-detail-jours")[0].children[3].children.map(s => s.textContent), ["3 × 5"]);
  // Boîte 1 : raté hier, il est dû aujourd'hui (« Aujourd'hui », pas « demain »).
  t.boite(1).click();
  assert.deepEqual(t.lignesDetail(), ["Boîte 1 · 1 calcul", "Aujourd’hui3 × 8"]);
  // La même boîte rallume la croix ; ✕ aussi ; la carte aussi.
  t.boite(1).click();
  assert.equal(t.etat.selection(), null);
  assert.equal(t.grille.classList.contains("is-filtre"), false);
  assert.equal(t.carte.classList.contains("is-eteinte"), false);
  assert.equal(t.detail().classList.contains("is-ferme"), true);
  t.boite(3).click();
  t.detail().children[0].click();
  assert.equal(t.etat.selection(), null, "✕ referme");
  t.boite(3).click();
  t.carte.click();
  assert.equal(t.etat.selection(), null, "toucher la carte éteinte rallume ma table");
  assert.equal(t.croix().length, 2);
  // Une boîte vide le dit.
  const vide = mesCalculs(P.creerParcours());
  vide.boite(2).click();
  assert.deepEqual(vide.lignesDetail(), ["Boîte 2 · 0 calcul", "Aucun calcul pour l’instant."]);
  // Le délai de la boîte n'est plus dit nulle part, pas même au lecteur d'écran.
  assert.equal(t.boite(4).attrs["aria-label"], "Boîte 4, su : 6 calculs. Voir la liste.");
});

test("7. le jour de retour d’un calcul : 0 s’il est dû, 1 s’il a été raté aujourd’hui, sinon l’écart à son échéance", () => {
  const jourDeRetour = new Function("PARCOURS", `${source("jourDeRetour")}; return jourDeRetour;`)(P);
  const fait = (boite, echeance, erreur = "") => ({boite, echeance, erreur, vu: "2026-09-01", gagne: "", cases: 0});
  assert.equal(jourDeRetour(fait(4, "2026-10-06"), AUJ), 0);
  assert.equal(jourDeRetour(fait(3, "2026-10-01"), AUJ), 0, "en retard : aujourd’hui");
  assert.equal(jourDeRetour(fait(1, "2026-10-06", "2026-10-06"), AUJ), 1, "raté aujourd’hui : demain");
  assert.equal(jourDeRetour(fait(5, "2026-10-09"), AUJ), 3);
  assert.equal(jourDeRetour(fait(5, "2026-10-20"), AUJ), 14);
});

// Lot « un seul système » (05/10/2026) : « Aujourd'hui » montre la série de
// Mes calculs du jour telle qu'elle sera jouée — seulement des calculs des
// tables PASSÉES (2, 5 et 10 pour Léa), 10 au plus : les calculs dus, complétés
// jusqu'à 10 par d'autres calculs de ces tables.
test("5. « Aujourd’hui » : la série de Mes calculs du jour (tables passées, 10 au plus), allumée, et ce qu’elle est ; jouée : « fait ✓ » ; rien : une phrase, pas un bouton", () => {
  const t = mesCalculs(lea());
  assert.equal(t.jour().tag, "button");
  assert.equal(t.jour().textContent, "Aujourd’hui\u00a0: 10\u00a0calculs dans Mes\u00a0calculs du\u00a0jour", "« jour » ne part pas seul à la ligne");
  // Des 8 calculs dus, 6 sont pris (la boîte 4 : table de 5, passée) ; 3 × 7
  // et 3 × 8 — ma table, pas encore passée — n'y sont pas. 4 de complément.
  const serieDeLea = P.serieDuJour(lea(), {aujourdhui: AUJ});
  assert.deepEqual({dus: serieDeLea.dus, complement: serieDeLea.complement, restants: serieDeLea.restants, faite: serieDeLea.faite}, {dus: 6, complement: 4, restants: 0, faite: false});
  assert.ok(!serieDeLea.cles.includes("3-7") && !serieDeLea.cles.includes("3-8"), "les calculs dus de la table en cours n’y sont pas");
  assert.ok(serieDeLea.cles.every(cle => P.prisParMesCalculs(lea(), cle, AUJ)));
  assert.equal(t.jour().attrs["aria-pressed"], "false");
  t.jour().click();
  assert.equal(t.jour().attrs["aria-pressed"], "true");
  assert.equal(t.carte.classList.contains("is-eteinte"), true);
  const allumees = t.cases().filter(c => c.classList.contains("is-dans-boite")).map(c => c.textContent.replace(/\D/g, ""));
  assert.deepEqual(allumees.sort((a, b) => a - b), serieDeLea.cles.map(cle => String(cle.split("-")[0] * cle.split("-")[1])).sort((a, b) => a - b), "les cases allumées sont celles de la série");
  assert.deepEqual(allumees, ["4", "14", "16", "18", "20", "25", "30", "35", "40", "45"], "les 6 calculs dus de la table de 5 et 4 calculs de la table de 2 — ni 21 ni 24 (table de 3)");
  assert.deepEqual(t.lignesDetail(), ["Aujourd’hui · 10 calculs", "6\u00a0à\u00a0faire\u00a0monter · 4\u00a0à\u00a0garder", "Ils sont dans ta séance : «\u00a0Mes\u00a0calculs\u00a0du\u00a0jour\u00a0»."]);
  t.jour().click();
  assert.equal(t.etat.selection(), null, "la même ligne rallume ma table");
  // Des calculs dus de tables pas passées (6 à 9) : ils ne comptent pas.
  const beaucoup = lea();
  for (const cle of ["6-6", "6-7", "6-8", "6-9", "7-7", "7-8", "7-9", "8-8", "8-9", "9-9"]) beaucoup.calculs[cle] = {boite: 5, cases: 0, vu: "2026-09-01", erreur: "", gagne: "", echeance: "2026-10-01"};
  const b = mesCalculs(beaucoup);
  assert.equal(b.jour().textContent, "Aujourd’hui\u00a0: 10\u00a0calculs dans Mes\u00a0calculs du\u00a0jour");
  // Les 9 tables passées et 18 calculs dus : 10 dans la série, jamais plus.
  // Lot « fignolage du 22/10 » (choix de Gwenaël) : le bouton dit pourtant le
  // VRAI total — « 18 calculs · 10 par séance » — et en allume les 18 (avant :
  // « 10 calculs dans Mes calculs du jour », alors que 18 étaient dus).
  P.TABLES.forEach(table => { beaucoup.tables[table].acquise = "2026-10-02"; });
  const serieLongue = P.serieDuJour(beaucoup, {aujourdhui: AUJ});
  assert.deepEqual({nombre: serieLongue.cles.length, dus: serieLongue.dus, complement: serieLongue.complement, restants: serieLongue.restants}, {nombre: 10, dus: 10, complement: 0, restants: 8});
  const c = mesCalculs(beaucoup);
  assert.equal(c.jour().textContent, "Aujourd’hui\u00a0: 18\u00a0calculs · 10\u00a0par\u00a0séance");
  c.jour().click();
  const tousDus = P.dusDuJour(beaucoup, AUJ);
  assert.equal(tousDus.length, 18);
  // Les 9 tables passées : les deux cases d'un calcul (5 × 7 et 7 × 5) s'allument ; on compare les produits.
  const produits = cles => [...new Set(cles.map(cle => String(cle.split("-")[0] * cle.split("-")[1])))].sort((a, b) => a - b);
  const allumeesLongue = [...new Set(c.cases().filter(cellule => cellule.classList.contains("is-dans-boite")).map(cellule => cellule.textContent.replace(/\D/g, "")))].sort((a, b) => a - b);
  assert.deepEqual(allumeesLongue, produits(tousDus), "les 18 calculs dus s'allument, pas seulement les 10 de la prochaine série");
  assert.ok(produits(tousDus).length > produits(serieLongue.cles).length);
  assert.equal(c.lignesDetail()[0], "Aujourd’hui · 18 calculs", "le détail suit le bouton");
  assert.equal(c.lignesDetail()[1], "1\u00a0à\u00a0revoir · 7\u00a0à\u00a0faire\u00a0monter · 10\u00a0à\u00a0garder", "seulement les nombres non nuls, la boîte 5 « à garder »");
  assert.equal(c.lignesDetail()[2], "Ils reviennent 10 par séance : «\u00a0Mes\u00a0calculs\u00a0du\u00a0jour\u00a0».");
  // Une fois Mes calculs du jour joué, 18 encore dus : « encore 18 calculs · 10 par séance ».
  const longueJouee = mesCalculs({...beaucoup, calculsDuJour: AUJ});
  assert.equal(longueJouee.jour().textContent, "Aujourd’hui\u00a0: encore 18\u00a0calculs · 10\u00a0par\u00a0séance");
  // Une fois Mes calculs du jour joué : plus de complément — les calculs dus
  // qui restent (« encore … dans ta prochaine séance »), ou « fait ✓ ».
  const joue = P.serieDuJour({...lea(), calculsDuJour: AUJ}, {aujourdhui: AUJ});
  assert.deepEqual({nombre: joue.cles.length, complement: joue.complement, faite: joue.faite}, {nombre: 6, complement: 0, faite: true});
  assert.match(source("renderJour"), /serie\.faite \? " dans ta prochaine\\u00a0séance" : " dans Mes\\u00a0calculs du\\u00a0jour"/);
  assert.match(source("renderJour"), /if \(serie\.faite\) element\.querySelector\("b"\)\.before\("encore "\);/);
  const toutFait = P.creerParcours();
  toutFait.calculs["2-4"] = {boite: 3, cases: 0, vu: "2026-10-06", erreur: "", gagne: "", echeance: "2026-10-20"};
  toutFait.tables[2].acquise = "2026-10-02";
  toutFait.calculsDuJour = AUJ;
  const f = mesCalculs(P.normaliserParcours(toutFait));
  assert.equal(f.jour().tag, "p");
  assert.equal(f.jour().textContent, "Mes calculs du jour\u00a0: fait\u00a0✓");
  // Rien de dû (et aucune table passée) : une phrase en pointillés.
  const sansDu = P.creerParcours();
  sansDu.calculs["3-4"] = {boite: 3, cases: 0, vu: "2026-10-01", erreur: "", gagne: "", echeance: "2026-10-20"};
  const r = mesCalculs(P.normaliserParcours(sansDu));
  assert.equal(r.jour().tag, "p");
  assert.equal(r.jour().textContent, "Rien ne revient aujourd’hui.");
  assert.match(html, /\.calculs-jour p \{ display: grid; place-items: center; border-style: dashed; color: var\(--muted\); \}/);
  assert.doesNotMatch(html, /is-du::after|essai-points/, "pas de point permanent sur les cases (refusé)");
});

test("8. une case touchée : « 3 × 4 = 4 × 3 = 12 », « En route — boîte 3 », le jour où il reviendra dans la séance ; contour encre, la croix reste", () => {
  const t = mesCalculs(lea());
  t.caseDe(3, 4).click();
  assert.deepEqual(t.lignesDetail(), ["3 × 4 = 4 × 3 = 12", "En route — boîte 3", "Il reviendra dans ta séance dans 2 jours."]);
  assert.equal(t.caseDe(3, 4).classList.contains("is-choisie"), true);
  assert.equal(t.croix().length, 2, "une case touchée n’éteint pas ma table");
  assert.equal(t.grille.classList.contains("is-filtre"), false);
  assert.equal(t.detail().children[0].attrs["aria-label"], "Fermer le détail");
  t.caseDe(3, 7).click();
  assert.equal(t.lignesDetail()[2], "À faire aujourd’hui : réussis-le pour monter d’une boîte.");
  // Raté AUJOURD'HUI : demain.
  const p = lea();
  p.calculs["3-8"] = {...p.calculs["3-8"], erreur: AUJ, echeance: AUJ};
  const r = mesCalculs(p);
  r.caseDe(3, 8).click();
  assert.deepEqual(r.lignesDetail(), ["3 × 8 = 8 × 3 = 24", "À revoir — boîte 1", "Raté aujourd’hui : il reviendra demain dans ta séance."]);
  r.boite(1).click();
  assert.deepEqual(r.lignesDetail(), ["Boîte 1 · 1 calcul", "Demain3 × 8"], "la boîte 1 le range sous « Demain »");
  assert.match(html, /\.calculs-grille > \.mc-cell\.is-choisie \{ z-index: 3; outline: 3px solid var\(--ink\); outline-offset: 2px; box-shadow: 0 0 0 2px #fff; \}/);
});

// Point 7 (04/10 au soir, décision de Gwenaël) : toucher 35 entoure 5 × 7 ET
// 7 × 5 — le même calcul, comme le dit le détail « 5 × 7 = 7 × 5 = 35 ».
test("7 (soir). toucher 35 entoure les deux cases du même calcul, 5 × 7 et 7 × 5 — et rien d’autre", () => {
  const t = mesCalculs(lea());
  const entourees = () => t.cases().filter(c => c.classList.contains("is-choisie"));
  t.caseDe(5, 7).click();
  assert.deepEqual(entourees(), [t.caseDe(5, 7), t.caseDe(7, 5)], "la case touchée et sa moitié miroir");
  assert.equal(t.lignesDetail()[0], "5 × 7 = 7 × 5 = 35");
  t.caseDe(7, 5).click();
  assert.deepEqual(entourees(), [t.caseDe(5, 7), t.caseDe(7, 5)], "touchée par la moitié miroir : les mêmes deux");
  t.caseDe(3, 3).click();
  assert.deepEqual(entourees(), [t.caseDe(3, 3)], "3 × 3 n’a qu’une case");
  t.boite(4).click();
  assert.equal(entourees().length, 0, "une boîte touchée n’entoure aucune case");
  t.jour().click();
  assert.equal(entourees().length, 0, "« Aujourd’hui » non plus");
});

test("9 et 10. les pastilles centrées (boîte du texte rognée) ; la légende garde son « 21 » — écran et fiche", () => {
  assert.match(html, /\.mc-detail-jours span \{ display: inline-block; padding: 7px 9px;[^}]*text-box: trim-both cap alphabetic; \}/);
  assert.match(html, /@media \(min-width: 1024px\) \{[\s\S]*?\.mc-detail-jours span \{ padding: 7\.5px 9px 6\.5px; \}/);
  const legende = html.slice(html.indexOf('<div class="calculs-legende" aria-hidden="true">'), html.indexOf("</div>", html.indexOf('<div class="calculs-legende" aria-hidden="true">')));
  // « Pas encore vu » sans nombre (comme une case jamais vue) ; les quatre autres avec « 21 ».
  assert.equal((legende.match(/<span class="mc-nb"><\/span>/g) || []).length, 1);
  assert.equal((legende.match(/<span class="mc-nb">21<\/span>/g) || []).length, 4);
  assert.match(html, /\.calculs-legende \.mc-cell \{ width: auto; min-width: 46px; height: 40px;/, "la case de la légende garde la place du nombre");
  const fiche = html.slice(html.indexOf('<p class="fiche-carre-legende" aria-hidden="true">'), html.indexOf("</p>", html.indexOf('<p class="fiche-carre-legende" aria-hidden="true">')));
  assert.equal((fiche.match(/<b><\/b>/g) || []).length, 1);
  assert.equal((fiche.match(/<b>21<\/b>/g) || []).length, 4);
  assert.match(html, /\.fiche-mini \{ display: flex; flex-direction: column; justify-content: center; width: 15mm; height: 9mm;/);
});

test("13. la rangée (accueil et bilan) aux couleurs du tableau : vide sans nombre, rouge avec son nombre, bleu, vert ; × 1 et × 10 en vert une fois réussis", () => {
  const p = lea();
  p.tables[3].bouts = [1];
  const {document} = fauxDocument();
  const code = `const document = ARG.document; const PARCOURS = ARG.P; const parcours = ARG.parcours;
    const pluriel = (n, m) => n + " " + m + (n > 1 ? "s" : "");
    ${source("etatsDeRangee")}\n${source("rangeeDeTable")}\nreturn rangeeDeTable(3);`;
  const rangee = new Function("ARG", code)({document, P, parcours: P.normaliserParcours(p)});
  // Lot « retours de classe » (planche 8 bis) : le 0 d'abord, en vert dès que
  // les autres nombres s'écrivent ; il ne compte pas.
  assert.deepEqual(rangee.children.map(b => [b.className, b.textContent]), [
    ["is-zero is-su", "0"], ["is-su", "3"], ["is-su", "6"], ["is-en-cours", "9"], ["is-en-cours", "12"], ["is-su", "15"],
    ["is-en-cours", "18"], ["is-en-cours", "21"], ["is-a-travailler", "24"], ["is-en-cours", "27"], ["", ""]],
    "× 1 réussi : vert ; 3 × 2 (boîte 5) et 3 × 5 (boîte 5) : verts ; boîtes 2 et 3 : bleues ; 3 × 8 raté : rouge AVEC son nombre ; × 10 jamais réussi : vide");
  assert.equal(rangee.attrs["aria-label"], "Table de 3, sur 10 calculs : 3 su, 5 en route, 1 à revoir");
  assert.doesNotMatch(rangee.attrs["aria-label"], /prêt/);
  assert.match(html, /\.rangee b\.is-a-travailler \{ border-color: #efb4b4; background: var\(--red-soft\); color: var\(--red\); \}/);
  assert.match(html, /\.rangee b\.is-en-cours \{ border-color: #a9c8e8; background: #eef6ff; color: var\(--blue\); \}/);
  assert.match(html, /\.rangee b\.is-su \{ border-color: #9ed4b4; background: var\(--green-soft\); color: var\(--green\); \}/);
  assert.doesNotMatch(html, /\.rangee b\.(pleine|entouree)/, "plus de vert sarcelle plein ni de case entourée");
  assert.doesNotMatch(html, /r-cases/, "sans petits carrés (variante B)");
  // Le moteur ne change pas : la rangée « prête » sert toujours au raccourci de validation.
  assert.equal(P.rangeeTable(P.normaliserParcours(p), 3).cases[7].etat, "vide");
  // La notice le dit (choix de Gwenaël).
  // Lot « retours de classe » : le gris « vu » s'ajoute en tête de la ligne.
  assert.match(html, /<p><b>Ma rangée\.<\/b> En gris quand je l’ai construite, puis les couleurs de Mes calculs&nbsp;: rouge&nbsp;à&nbsp;revoir, bleu&nbsp;en&nbsp;route, vert&nbsp;su\.<\/p>/, "chaque couleur reste avec son mot");
  assert.doesNotMatch(html, /Une case entourée|Toutes pleines/);
});

test("11. Mon mélange compact : le triangle qui le lance, « Mon mélange » et ses tables dessous, les trois trophées à droite — jamais « à faire »", () => {
  const rendu = source("renderParcours");
  assert.match(rendu, /ligneMelange\.className = "mp-melange";/);
  // Lot « un seul système » (05/10/2026) : Mon mélange est libre. La case est
  // un bouton « jouer » (plus une coche « à faire »). Lot « les trophées » : à
  // droite, plus de badge ni de dernier score — les trois trophées (toujours
  // là, gris tant qu'ils ne sont pas gagnés). Lot « Mes calculs du jour
  // d'abord » : jamais grisé — tant que Mes calculs du jour n'est pas joué,
  // la case le lance d'abord (launchFromParcours).
  assert.match(rendu, /textes\.append\(title, tables\);\s*droite\.append\(textes, tropheesDuMelange\(etat\.melange\.trophees\)\);\s*ligneMelange\.append\(makeCell\(\{\s*kind: "star",\s*etat: 0,[\s\S]*?texte: triangleJouer\(\),\s*config: PARCOURS\.configMelange\(parcours\)\s*\}\), droite\);/);
  assert.doesNotMatch(rendu, /"À jour ✓"|"À faire"|aRefaireAvec|melange\.aJour|etat\.verrou/, "plus d’état « à faire » / « à refaire » ni de verrou");
  assert.doesNotMatch(rendu, /après le mélange des 9 tables/, "l’escalier n’attend plus le mélange");
  assert.match(rendu, /const expertOuvert = etat\.expert\.ouvert;/);
  assert.doesNotMatch(html, /function dernierMelange\(|Dernier : \$\{|réussi avec \$\{/, "plus de dernier score ni de « réussi avec N tables ✓ »");
  assert.doesNotMatch(rendu, /"▶"/, "le caractère ▶ penchait à gauche : un dessin centré à la place");
  // Les trois trophées, EXÉCUTÉS : trois coupes (un dessin chacune), grises
  // puis gagnées — sans un mot, sans un nombre.
  const {document} = fauxDocument();
  const tropheesDuMelange = new Function("document", `${source("coupe")}\n${source("tropheesDuMelange")}; return tropheesDuMelange;`)(document);
  const dessin = p => {
    const zone = tropheesDuMelange(P.etatAffichage(p, AUJ).melange.trophees);
    assert.equal(zone.tag, "span");
    assert.equal(zone.className, "mp-trophees");
    assert.equal(zone.attrs.role, "img");
    assert.equal(zone.textContent, "", "aucun mot, aucun nombre affiché");
    assert.deepEqual(zone.children.map(b => [b.tag, b.dataset.tables]), [["b", "3"], ["b", "6"]], "lot « Mon mélange aux paliers » : deux coupes");
    zone.children.forEach(b => {
      assert.equal(b.children.length, 1);
      assert.equal(b.children[0].tag, "svg", "une coupe dessinée");
      assert.equal(b.children[0].attrs["aria-hidden"], "true");
      assert.deepEqual(b.children[0].children.map(path => path.attrs.class), ["anses", "corps"]);
    });
    return {gagnes: zone.children.map(b => b.className), nom: zone.attrs["aria-label"]};
  };
  const avecMelange = (p, reussi) => P.normaliserParcours({...p, melange: {...p.melange, dernier: AUJ, score: 19, reussi}});
  // Léa : 3 tables passées, jamais joué.
  assert.deepEqual(dessin(lea()), {gagnes: ["", ""], nom: "Coupes de Mon mélange (avec 3 et 6 tables) : aucune pour l’instant"});
  assert.deepEqual(dessin(avecMelange(lea(), 2)).gagnes, ["", ""], "réussi avec 2 tables : pas encore de trophée");
  assert.deepEqual(dessin(avecMelange(lea(), 3)), {gagnes: ["is-gagne", ""], nom: "Coupes de Mon mélange (avec 3 et 6 tables) : gagnée avec 3 tables"});
  assert.deepEqual(dessin(avecMelange(lea(), 7)), {gagnes: ["is-gagne", "is-gagne"], nom: "Coupes de Mon mélange (avec 3 et 6 tables) : gagnées avec 3 et 6 tables"});
  assert.deepEqual(dessin(avecMelange(lea(), 9)).gagnes, ["is-gagne", "is-gagne"], "le mélange des 9 tables n'a plus de coupe à lui");
  assert.match(html, /\.mp-trophees \{ display: inline-flex; align-items: center; gap: 3px; flex: 0 0 auto; \}/);
  assert.match(html, /\.mp-trophees b \{ display: inline-flex; width: 26px; height: 26px; color: #c3ced8; \}/, "grises…");
  assert.match(html, /\.mp-trophees b\.is-gagne \{ color: #e0a800;/, "… puis dorées");
  // Le triangle « jouer », EXÉCUTÉ : un dessin, centré dans sa case.
  const triangle = new Function("document", `${source("triangleJouer")}; return triangleJouer;`)(document)();
  assert.equal(triangle.tag, "svg");
  assert.equal(triangle.attrs.class, "jouer");
  assert.equal(triangle.attrs["aria-hidden"], "true");
  assert.equal(triangle.children.length, 1);
  assert.match(html, /\.cell \.jouer \{ display: block; width: 22px; height: 22px; margin: auto; fill: currentColor; \}/);
  assert.match(html, /\.mp-melange \.cell \{ display: grid; place-items: center;/);
  // Le sous-titre : « tables 2, 3 et 5 » jusqu'à 3 tables (« et 5 » jamais seul
  // à la ligne), puis « mes N tables » — court, à côté des trophées.
  assert.match(rendu, /tables\.textContent = etat\.melange\.tables\.length <= 3 \? tablesDuMelange\(etat\.melange\.tables\) : `mes \$\{etat\.melange\.tables\.length\}\\u00a0tables`;/);
  const tablesDuMelange = new Function("PARCOURS_TABLES", "listeTables", `${source("tablesDuMelange")}; return tablesDuMelange;`)(
    [...P.TABLES], t => (t.length > 1 ? `${t.slice(0, -1).join(", ")} et ${t[t.length - 1]}` : String(t[0])));
  assert.equal(tablesDuMelange([2, 5, 10]), "tables 2, 5 et 10");
  assert.match(html, /\.mp-melange \{ display: grid; grid-template-columns: 52px minmax\(0, 1fr\); align-items: center; gap: 10px; \}/);
  // Sur un téléphone étroit, les trophées passent SOUS les tables au lieu de les écraser (320 px).
  assert.match(html, /\.mp-melange-droite \{ display: flex; flex-wrap: wrap;[^}]*\}\s*\.mp-melange-droite > span:first-child \{ flex: 1 1 10em; min-width: 0; \}/);
  assert.match(html, /\.mp-melange-droite > span:first-child \{ white-space: nowrap; \}/);
  assert.doesNotMatch(rendu, /"Mon mélange : mes 9 tables"/);
});

test("12. le bilan : « Demain : N calculs t’attendent » dans le cadre bleu, puis « À retenir pour la prochaine séance » sans phrase", () => {
  const extraire = (debut, fin) => html.slice(html.indexOf(debut), html.indexOf(fin, html.indexOf(debut)));
  const code = extraire("function etatsDeRangee(table) {", "// L'écran entre deux étapes")
    + extraire("function renderBilanSeance(zone) {", "// La table de la prochaine séance");
  const {document, $} = fauxDocument();
  // Lot « retouches après Mon parcours » : la liste du JOUR, gardée dans le
  // parcours (3 × 8 et 8 × 3 sont le même calcul : une seule pastille).
  const p = {...lea(), retenir: {jour: AUJ, erreurs: [308, 803, 103]}};
  // Lot E3b : le bilan lit la liste telle qu'elle s'affiche (aRetenirAffiche) — ici, pas d'évaluation.
  const renderBilanSeance = new Function("$", "PARCOURS", "parcours", "seance", "document", "pluriel", "soude", "backToModes", "tableDeLaSeance", "commencerSeance", "listeTables", "aRetenirAffiche",
    `${code}\nreturn renderBilanSeance;`)($, {...P, agendaCalculs: q => P.agendaCalculs(q, AUJ), aRetenir: q => P.aRetenir(q, AUJ)}, P.normaliserParcours(p),
    {table: 3, faites: [{nom: "Mes calculs du jour", juste: 7, total: 8, rate: false, reussi: null}], erreurs: [[3, 8], [8, 3], [1, 3]]},
    document, (n, m) => `${n} ${m}${n > 1 ? "s" : ""}`, t => t, () => {}, () => 3, () => {}, t => t.join(", "), () => P.aRetenir(P.normaliserParcours(p), AUJ));
  const zone = element();
  renderBilanSeance(zone);
  const cadre = parClasse(zone, "cadre")[0];
  assert.ok(parClasse(cadre, "rangee").length, "la rangée, aux couleurs du tableau");
  assert.match(parTag(cadre, "p")[0].textContent, /^Demain : \d+ calculs? t’attend(ent)?\.$/);
  const retenir = parClasse(zone, "retenir")[0];
  assert.equal(parTag(retenir, "h2")[0].textContent, "À retenir pour la prochaine séance");
  assert.deepEqual(parTag(retenir, "li").map(li => li.textContent), ["3 × 8 =24", "1 × 3 =3"]);
  assert.equal(parTag(retenir, "p").length, 0, "sans phrase (elle était fausse pour × 1 et × 10)");
  assert.doesNotMatch(zone.textContent, /dans Mes calculs du jour/);
});

test("14. les boutons se voient : bord du bas partout, bord de 2 px plus foncé sur ordinateur, nom des étapes en 900", () => {
  const bloc = html.slice(html.indexOf("    /* Lot « Mon parcours » (décision 14"), html.indexOf("  </style>", html.indexOf("    /* Lot « Mon parcours » (décision 14")));
  assert.match(bloc, /\.choix-activite, \.acc-lien, \.seance-liens button\.rond \{ box-shadow: 0 2px 0 #c3d8e5; \}/);
  assert.match(bloc, /\.choix-activite\.is-plus \{ box-shadow: none; \}/);
  assert.match(bloc, /@media \(min-width: 1024px\) \{\s*\.etape, \.choix-activite, \.acc-lien \{ border-width: 2px; border-color: #b4c9d9; \}\s*\.etape, \.choix-activite, \.acc-lien, \.seance-liens button\.rond \{ box-shadow: 0 3px 0 #b4c9d9; \}\s*\.seance-liens button\.rond \{ border-color: #b4c9d9; \}\s*\.choix-activite\.is-plus \{ border-color: #b4c9d9; box-shadow: none; \}\s*\.etape strong \{ font-weight: 900; \}\s*\}/);
  // Placé APRÈS les règles d'origine (même poids) : l'ordre suffit.
  assert.ok(html.indexOf("    /* Lot « Mon parcours » (décision 14") > html.indexOf("    .etape { width: 100%;"));
  assert.ok(html.indexOf("    /* Lot « Mon parcours » (décision 14") > html.indexOf("    .seance-liens button.rond {"));
});

// --------------------------------------------------------- la fiche (15 et 3)

// renderFiche, exécutée : la fiche d'un élève, et la fiche vierge.
function fiche(laSource, {parcoursAppareil = P.creerParcours(), modeFiche = false} = {}) {
  const {document, $} = fauxDocument();
  if (modeFiche) document.body.classList.add("mode-fiche");
  $("fiche-prof").querySelector = () => element("table");
  $("fiche-calculs").querySelector = () => $("fiche-calculs-corps");
  const code = `const document = ARG.document; const $ = ARG.$; const PARCOURS = ARG.P; const parcours = ARG.parcoursAppareil;
    const PARCOURS_TABLES = ARG.P.TABLES; let ficheAffichee = null; const FICHE_VIERGE = "vierge";
    const prenomAffiche = () => ""; const suiviActif = () => false; const suiviIdentite = null;
    const dateEnLettres = jour => jour; const symboleMarche = marche => marche.symbole;
    const marchesDeTable = () => ({depart: 4, prochaines: [4, 5, 6], noms: ["Dans l’ordre", "Dans le désordre", "Nombres manquants et divisions"]});
    const nomDeMarche = nom => nom.charAt(0).toLowerCase() + nom.slice(1);
    const soude = texte => texte;
    ${source("coupe")}
    ${source("tropheesDuMelange")}
    ${source("phraseProchaineSeance")}\n${source("dateCourte")}\n${source("renderFicheProf")}\n${source("renderFiche")}\nrenderFiche(ARG.source);`;
  new Function("ARG", code)({document, $, P, parcoursAppareil, source: laSource});
  const corps = $("fiche-calculs-corps");
  const td = (ligne, colonne) => corps.children[ligne - 1].children[colonne - 1];
  return {$, td, corps};
}

test("3 et 15. la fiche : la croix de ma table case par case (bouts arrondis), ✓ à gauche ; lisible en noir et blanc", () => {
  const f = fiche(lea());
  const classes = (l, c) => f.td(l, c).className;
  assert.equal(classes(3, 2), "miroir vu croix-l debut", "3 × 2 (le miroir de 2 × 3) : début de la ligne de ma table");
  assert.equal(classes(3, 9), "en-cours croix-l fin");
  assert.equal(classes(3, 3), "en-cours croix-l croix-c", "le croisement");
  assert.equal(classes(2, 3), "su croix-c haut");
  assert.equal(classes(9, 3), "miroir vu croix-c bas");
  assert.equal(classes(4, 5), "su", "hors de la croix : rien");
  assert.match(html, /\.fiche-carre \{ isolation: isolate; \}/, "la bande reste au-dessus du blanc de la feuille");
  assert.match(html, /\.fiche-carre td\.croix-l::before, \.fiche-carre td\.croix-c::after \{ content: ""; position: absolute; z-index: -1; background: #0b57b7; \}/);
  // Les morceaux débordent de plus de la moitié de l'espace entre deux cases (1,1 mm) : ils se touchent.
  assert.match(html, /\.fiche-carre td\.croix-l::before \{ inset: -1mm -\.8mm; \}/);
  assert.match(html, /\.fiche-carre td\.croix-c::after \{ inset: -\.8mm -1mm; \}/);
  // Lot « Une seule fiche » : le ✓ en blanc, sur la pastille verte.
  assert.match(html, /\.fiche-carre th\.is-acquise::before \{ content: "✓"; margin-right: \.3mm; color: #fff;/);
  assert.doesNotMatch(html, /\.fiche-carre th\.is-acquise::after|\.fiche-carre th\.is-ma-table \{ text-decoration/);
});

test("15. la fiche vierge : la même fiche, vide — carte « Table de ___ · ma table » et son échelle vide, rien de l’élève, pas de cadre du professeur", () => {
  const vierge = fiche("vierge", {parcoursAppareil: lea(), modeFiche: true});
  const carte = vierge.$("fiche-matable");
  assert.equal(carte.hidden, false);
  assert.equal(carte.children[0].textContent, "Table de ");
  assert.equal(carte.children[0].children[1].className, "fiche-blanc", "une ligne à remplir");
  assert.equal(carte.children[1].textContent, "ma table");
  assert.equal(parTag(carte, "i").length, P.MARCHES.length, "l’échelle, vide");
  assert.equal(parTag(carte, "i").filter(i => i.className).length, 0);
  assert.equal(vierge.$("fiche-prenom").textContent, "");
  assert.equal(vierge.$("fiche-classe").textContent, "");
  assert.equal(vierge.$("fiche-date").textContent, "");
  assert.equal(vierge.$("fiche-semaine").textContent, "");
  assert.equal(vierge.$("fiche-subtitle").textContent, "Dans l’application, cette fiche se remplit toute seule. Ici, à la main.");
  assert.equal(vierge.$("fiche-prof").hidden, true, "pas de cadre du professeur");
  assert.equal(vierge.$("fiche-prof-rows").children.length, 0, "la page du professeur reste vide");
  // Le tableau : vide, sans croix (aucune table n'est « ma table »), même si l'appareil a un parcours.
  const tds = vierge.corps.children.slice(1).flatMap(tr => tr.children.slice(1));
  assert.equal(tds.length, 64);
  assert.ok(tds.every(td => ["jamais-vu", "miroir"].includes(td.className)), "rien de l’élève, pas de croix");
  assert.ok(tds.every(td => td.children[0].textContent === ""));
  // Lot « les trophées » : Mon mélange, libre — sur la fiche vierge, ses trois
  // trophées vides (à colorier), sans un mot ; sur celle de Léa (jamais joué),
  // les mêmes ; gagnés, ils se marquent.
  const tropheesFiche = f => {
    const etat = f.$("fiche-melange-state");
    assert.equal(etat.textContent, "", "ni « Dernier : … », ni nombre");
    assert.equal(etat.children.length, 1);
    assert.equal(etat.children[0].className, "mp-trophees");
    return etat.children[0].children.map(b => `${b.dataset.tables}${b.className === "is-gagne" ? "G" : b.className === "" ? "-" : "?"}`).join(" ");
  };
  assert.equal(tropheesFiche(vierge), "3- 6-");
  assert.equal(tropheesFiche(fiche(lea())), "3- 6-");
  const gagnante = P.normaliserParcours({...lea(), melange: {...lea().melange, dernier: AUJ, score: 19, reussi: 3}});
  assert.equal(tropheesFiche(fiche(gagnante)), "3G 6-");
  // La fiche vierge reste vide même si l'appareil a gagné des trophées.
  assert.equal(tropheesFiche(fiche("vierge", {parcoursAppareil: gagnante, modeFiche: true})), "3- 6-");
  // La fiche d'un élève, elle, n'a pas la ligne à remplir.
  assert.equal(parClasse(fiche(lea()).$("fiche-matable"), "fiche-blanc").length, 0);
});

// ------------------------------------------------- le soir du 04/10 (points 5, 6, 7)
//
// Ajouts de Gwenaël après ses photos d'iPhone (élève à code) :
//   5. lancement : la durée ne se coupe plus (« 1 / min 30 ») ; « C'est parti ! »
//      et « ← Ma table » de même taille ; version B (« 18 bonnes réponses pour
//      réussir » + l'exemple en trois pastilles) — testée dans optimisation-e2 ;
//   6. une seule barre fine pour l'élève à code — testée dans accueil ; le
//      titre de Mon parcours ne répète pas le prénom ;
//   7. prénom long ; Mon parcours s'ouvre centré sur Mes calculs (téléphone) ;
//      toucher 35 entoure aussi 7 × 5 (plus haut) ; « Encore 10 calculs »
//      retiré (comment-ça-marche, un-tableau, retours-iphone).

const CORE = require("../outils/calcul_mental/defi_tables_core.js");

test("5 (soir). le titre de lancement : « 1 min 30 », « 20 questions », « Table de 7 » insécables ; le « · » reste en bout de ligne", () => {
  const ligne = nom => html.split("\n").find(l => l.startsWith(`      const ${nom} = `));
  const code = [ligne("insecable"), ligne("dureeLancement"), source("shortTablesLabel"), source("launchLabel"), "return launchLabel;"].join("\n");
  const launchLabel = new Function("CORE", "ALL_TABLES", "PARCOURS_TABLES", "TRAIN_TYPES", "NOMS_ENTRAINEMENTS", "listeTables", code)(
    CORE, [...CORE.ALL_TABLES], [...P.TABLES], {}, {}, tables => tables.join(", "));
  const N = "\u00a0";
  assert.equal(launchLabel(P.configValidation(7)), `Table${N}de${N}7 · 20${N}questions · 1${N}min${N}30`);
  assert.equal(launchLabel({mode: "validation", tables: [2, 5, 10], total: 20, duration: 90}), `Mon mélange · tables 2, 5, 10 · 20${N}questions · 1${N}min${N}30`);
  assert.equal(launchLabel(P.configEtoile(1)), `Toutes les tables (2 à 10) · produits, trous, divisions · 25${N}questions · 2${N}minutes`,
    "plusieurs tables : le nom peut passer à la ligne (insécable, il déborderait à 320 px)");
  // Le seul endroit où le titre s'affiche : le « · » collé au morceau d'avant.
  assert.match(html, /\$\("launch-summary"\)\.textContent = launchLabel\(config\)\.replace\(\/ · \/g, "\\u00a0· "\);/);
  // Les deux boutons : une grille de deux colonnes égales, le retour avec le même relief.
  assert.match(html, /\.launch-actions \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[^}]*\}\s*\.launch-actions button \{ width: 100%; min-width: 0; \}/);
  assert.match(html, /\.launch-actions \.secondary \{ border: 2px solid #c5d9e6; box-shadow: 0 5px 0 #c5d9e6;/, "le même bord du bas de 5 px que « C’est parti ! »");
  assert.match(html, /\.primary \{ color: #fff; border: 0; background: var\(--blue\); box-shadow: 0 5px 0 #043f8c;/);
});

test("6 (soir). sous un code, Mon parcours s’appelle « Mon parcours » (le prénom est dans la barre) ; sans code, « Le parcours de Léa »", () => {
  const titre = (suivi, prenom, vueProf = false) => new Function("suiviActif", "prenomAffiche", "VUE_PROF", "parcours", `${source("parcoursTitle")}\nreturn parcoursTitle();`)(() => suivi, () => prenom, vueProf, {prenom});
  // Lot « Ma classe : le parcours de Léa » : la vue du professeur dit « Le parcours de Léa » (titre choisi par Gwenaël).
  assert.equal(titre(false, "Léa", true), "Le parcours de Léa");
  assert.equal(titre(false, "", true), "Le parcours de l’élève");
  assert.equal(titre(true, "Léa"), "Mon parcours");
  assert.equal(titre(false, "Léa"), "Le parcours de Léa");
  assert.equal(titre(false, ""), "Mon parcours");
  // Un prénom long (sans code, 20 caractères au plus) : plus petit, deux lignes au plus.
  assert.match(html, /\$\("parcours-title"\)\.classList\.toggle\("est-long", parcoursTitle\(\)\.length > 22\);/);
  assert.match(html, /\.parcours-toolbar \.settings-heading\.est-long \{ font-size: clamp\(1\.1rem, 4\.8vw, 1\.45rem\); line-height: 1\.15; text-wrap: balance; overflow-wrap: anywhere; \}/);
});

// Lot « retouches après Mon parcours » (décision 1) : Gwenaël a changé d'avis
// en essayant — Mon parcours s'ouvre EN HAUT, comme tous les autres écrans.
test("7 (soir), revu : Mon parcours s’ouvre en haut, au téléphone comme sur ordinateur", () => {
  const appels = [];
  const window = {scrollTo: o => appels.push(o.top)};
  new Function("window", `${source("ouvrirEnHaut")}\nouvrirEnHaut();`)(window);
  assert.deepEqual(appels, [0]);
  assert.match(html, /show\("parcours"\);\s*ouvrirEnHaut\(\);\s*\}/, "appelé à l’ouverture de Mon parcours");
  assert.equal(html.indexOf("centrerSurCalculs"), -1, "plus de centrage sur Mes calculs");
});
