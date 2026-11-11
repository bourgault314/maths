// « Suivre ses élèves », lot S4c « les onglets d'appli » (08/11/2026).
//
//  0. À 320 px de large, tout tient : « Mon compte » devient un bouton à
//     icône jusqu'à 380 px (le mot reste pour les lecteurs d'écran), les
//     tableaux des applis passent un cran plus petit.
//  1. Défi tables, la fiche : sous le parcours, « Ses séances » au format
//     « Activité » à la place du tableau « Pour le professeur »
//     (defi_tables.html, la vue du professeur) — les mêmes mots que la fiche.
//  2. SPLAT! : une étape se touche (sa bulle) ; « Par monde » dans la classe
//     (fini · en cours · pas commencé, chaque nombre donne les prénoms ; qui
//     a vu des réponses cette semaine).
//  3. Anzan : la classe par mode (Flash, Colonne, le grade dessous) ; la
//     fiche filtre ses séances (Toutes · Flash · Colonne · Grades).
//  4. Coffres : « Depuis le début » / « Cette semaine » dans la classe, et
//     « Cette semaine » puis « Depuis le début » dans la fiche.
// Choix de Gwenaël du 08/11/2026 (questions à choix, planches Q1 à Q4).
//
// Ces tests EXÉCUTENT les fonctions de la page et des moteurs, telles
// qu'elles y sont écrites, sur un petit document de remplacement.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import {createRequire} from "node:module";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const exiger = createRequire(import.meta.url);
const page = readFileSync(join(racine, "_serveur/public/prof/index.php"), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = page.slice(page.indexOf(BALISE), page.indexOf("</script>", page.indexOf(BALISE)));
const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
const site = readFileSync(join(racine, "outils/calcul_mental/defi_tables.html"), "utf8");
const SPLAT = exiger(join(racine, "_serveur/public/prof/splat-parcours.js"));
const ANZAN = exiger(join(racine, "_serveur/public/prof/flash_anzan_parcours.js"));

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") { profondeur -= 1; if (profondeur === 0) return source.slice(position, i + 1); }
  }
  throw new Error("bloc non fermé");
}
function fonction(nom, source = script) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(source);
  assert.ok(m, `la source doit définir ${nom}()`);
  return blocDepuis(source, m.index);
}
function constante(nom, source = script) {
  const debut = source.indexOf(`const ${nom} = `);
  assert.ok(debut >= 0, `la source doit définir ${nom}`);
  return source.slice(debut, source.indexOf(";\n", debut) + 1);
}

// ------------------------------------------------------------ un petit document

class Noeud {
  constructor(balise) {
    this.tagName = balise.toUpperCase();
    this.enfants = [];
    this.parent = null;
    this.attributs = {};
    this.hidden = false;
    this.className = "";
    this.dataset = {};
    this.style = {};
    this.texte = "";
    this.ecoutes = {};
    this.offsetWidth = 100;
    this.offsetLeft = 0;
    this.offsetTop = 30;
    this.clientWidth = 600;
    this.clientHeight = 60;
    const moi = this;
    this.classList = {
      contains: c => moi.className.split(/\s+/).includes(c),
      add: c => { if (!moi.classList.contains(c)) moi.className = `${moi.className} ${c}`.trim(); },
      remove: c => { moi.className = moi.className.split(/\s+/).filter(x => x && x !== c).join(" "); },
      toggle: (c, oui) => (oui ? moi.classList.add(c) : moi.classList.remove(c)),
    };
  }
  get textContent() { return this.texte + this.enfants.map(e => e.textContent).join(""); }
  set textContent(v) { this.texte = String(v); this.enfants.forEach(e => { e.parent = null; }); this.enfants = []; }
  set innerHTML(_) { throw new Error("innerHTML interdit : tout passe par textContent"); }
  get children() { return this.enfants.filter(e => e.tagName !== "#TEXT"); }
  get isConnected() { return true; }
  getClientRects() { return [1]; }
  getBoundingClientRect() { return {left: 40, top: 100, bottom: 120, right: 120, width: 80, height: 20}; }
  append(...noeuds) {
    noeuds.forEach(n => {
      const enfant = typeof n === "string" ? Object.assign(new Noeud("#text"), {texte: n}) : n;
      enfant.parent = this;
      this.enfants.push(enfant);
    });
  }
  appendChild(n) { this.append(n); return n; }
  replaceChildren(...n) { this.textContent = ""; this.append(...n); }
  remove() { if (this.parent) this.parent.enfants = this.parent.enfants.filter(e => e !== this); this.parent = null; }
  closest(choix) { let n = this.parent; while (n) { if (choix.split(",").some(c => n.classList.contains(c.trim().replace(/^\./, "")))) return n; n = n.parent; } return null; }
  setAttribute(k, v) { this.attributs[k] = String(v); }
  getAttribute(k) { return k in this.attributs ? this.attributs[k] : null; }
  addEventListener(type, f) { (this.ecoutes[type] = this.ecoutes[type] || []).push(f); }
  click() { (this.ecoutes.click || []).forEach(f => f({target: this, stopPropagation() {}})); }
  survoler() { (this.ecoutes.mouseenter || []).forEach(f => f()); }
  tous(balise) { return this.enfants.flatMap(e => (e.tagName === balise.toUpperCase() ? [e] : []).concat(e.tous(balise))); }
  parClasse(c) { return this.enfants.flatMap(e => (e.classList.contains(c) ? [e] : []).concat(e.parClasse(c))); }
}
function documentFactice(ids) {
  const noeuds = {};
  ids.forEach(id => { noeuds[id] = new Noeud("div"); noeuds[id].id = id; });
  const document = {createElement: b => new Noeud(b), createTextNode: t => Object.assign(new Noeud("#text"), {texte: t}),
    documentElement: {clientWidth: 1366}, querySelectorAll: () => []};
  return {noeuds, document, $: id => noeuds[id] || null};
}

// ------------------------------------------------------------ 0. 320 px

test("0 — à 320 px : « Mon compte » en bouton à icône jusqu'à 380 px (le mot reste dans le bouton), les tableaux un cran plus petits ; l'en-tête ne change pas", () => {
  const bloc = style.slice(style.indexOf("@media (max-width: 380px) {"));
  assert.ok(bloc.length > 100, "un bloc pour les très petits écrans");
  const regles = blocDepuis(bloc, 0);
  assert.match(regles, /\.entete #mon-compte \{ position: relative; width: var\(--cible\); padding: 0; font-size: 0; \}/, "un carré de 44 px, le mot caché à l'œil seulement");
  assert.match(regles, /\.entete #mon-compte::before \{[^}]*-webkit-mask: url\("data:image\/svg\+xml,[^"]+"\) center \/ contain no-repeat;\s*mask: url\(/, "l'icône, dessinée par la couleur du bouton");
  assert.match(regles, /#tableau th \{ font-size: \.78rem; \}/);
  assert.match(regles, /#tableau td \{ font-size: \.9rem; \}/);
  assert.match(regles, /#tableau td\.nom \{ max-width: 30vw; \}/);
  assert.match(regles, /#tableau \.indice-tel \{ white-space: normal; \}/, "« 12 séances dessus » passe à la ligne, jamais coupé");
  assert.match(page, /<button type="button" class="secondaire" id="mon-compte" hidden>Mon compte<\/button>/, "le bouton garde son mot (lecteurs d'écran)");
  assert.doesNotMatch(regles, /display: none/, "rien ne disparaît");
});

// ------------------------------------------------------------ 1. Défi tables

const siteScript = site.slice(site.indexOf("// « Ses séances », à l'écran, sous le parcours"), site.indexOf("// « Imprimer sa fiche » : la feuille de l'élève affiché"));

test("1 — Défi tables, « Ses séances » : les MÊMES mots que « Activité » de la fiche (texteLigne), séance par séance", () => {
  const texteSeanceProf = new Function(`${fonction("texteSeanceProf", siteScript)}\nreturn texteSeanceProf;`)();
  const texteLigne = new Function("ANZAN", `${fonction("pluriel")}\n${fonction("texteLigne")}\nreturn texteLigne;`)(null);
  const lignes = [
    {table: 7, etapes: 3, calculs: 10, justes: 8, test: 0},
    {table: 6, etapes: 5, calculs: 10, justes: 10, test: 1},
    {table: 8, etapes: 5, calculs: 10, justes: 4, test: 2},
    {table: 0, etapes: 2, calculs: 6, justes: 3, test: 0},
    {table: null, etapes: null, calculs: null, justes: null, test: null},
    {table: 9, etapes: 1, calculs: 0, justes: 0, test: 0},
    {table: 4, etapes: 2, calculs: 10, justes: null, test: 0}
  ];
  lignes.forEach(l => assert.deepEqual(texteSeanceProf(l), texteLigne("defi-tables", l), JSON.stringify(l)));
  assert.deepEqual(texteSeanceProf(lignes[2]), ["table de 8 · 5\u00a0étapes · test pas encore", "calculs du jour 4/10", true]);
  assert.deepEqual(texteSeanceProf(lignes[3]), ["révisions · 2\u00a0étapes", "calculs du jour 3/6", false]);
  assert.deepEqual(texteSeanceProf({table: 3, calculs: 10, justes: 4}), ["table de 3", "calculs du jour 4/10", true], "sous la moitié : en orange");
});

test("1 — Défi tables, « Ses séances » : six jours, puis « Voir les jours précédents » (sept de plus, en remontant les périodes) ; la limite dite quand tout est montré ; rien par innerHTML", () => {
  // Un moteur de remplacement : des jours de séance tous les 3 jours, du 01/09 au 12/11.
  const tous = [];
  for (let t = Date.parse("2026-09-01T12:00:00Z"); t <= Date.parse("2026-11-12T12:00:00Z"); t += 3 * 864e5) tous.push(new Date(t).toISOString().slice(0, 10));
  const plus = (j, n) => new Date(Date.parse(`${j}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
  const lundi = j => { const d = new Date(`${j}T12:00:00Z`); return plus(j, -((d.getUTCDay() + 6) % 7)); };
  const PARCOURS = {
    ajouterJours: plus,
    jourLocal: () => "2026-11-12",
    resumeSuivi: (_, {aujourdhui}) => {
      const debut = plus(lundi(aujourdhui), -21);
      const avant = tous.filter(j => j <= aujourdhui);
      return {debut, connuDepuis: "2026-09-01", dernier: avant.length ? avant[avant.length - 1] : null,
        jours: tous.filter(j => j >= debut && j <= aujourdhui).map(jour => ({jour, lignes: [{table: 7, etapes: 2, calculs: 10, justes: 9, test: 0}]}))};
    }
  };
  const r = documentFactice(["parcours-prof"]);
  const f = new Function("document", "$", "PARCOURS", "VUE_PROF", "parcoursProf",
    `${siteScript}\nreturn {renderCarteProf, joursSeancesProf, texteSeanceProf};`)(r.document, r.$, PARCOURS, true, {tables: {}});
  const carte = r.$("parcours-prof");
  f.renderCarteProf();
  assert.equal(carte.hidden, false);
  assert.equal(carte.tous("h2")[0].textContent, "Ses séances");
  const jours = () => carte.parClasse("sp-jour-titre").map(p => p.textContent);
  assert.deepEqual(jours(), ["Jeudi 12 nov.", "Lundi 9 nov.", "Vendredi 6 nov.", "Mardi 3 nov.", "Samedi 31 oct.", "Mercredi 28 oct."]);
  assert.equal(carte.parClasse("sp-chiffres")[0].textContent, "calculs du jour 9/10");
  const plusBouton = carte.parClasse("sp-plus")[0];
  assert.equal(plusBouton.textContent, "Voir les jours précédents");
  plusBouton.click();
  assert.equal(jours().length, 13, "sept de plus");
  let tours = 0;
  while (carte.parClasse("sp-plus").length) { carte.parClasse("sp-plus")[0].click(); tours += 1; }
  assert.equal(tours, 2, "13, 20, puis les 25");
  assert.equal(jours().length, tous.length, "jusqu'au plus ancien jour gardé, en sautant d'une période à l'autre");
  assert.equal(jours().at(-1), "Mardi 1 sept.");
  assert.equal(carte.parClasse("sp-plus").length, 0);
  assert.equal(carte.parClasse("sp-note")[0].textContent, "Les séances d’avant le 01/09 ne sont plus gardées.");
  // Hors de la vue du professeur : la carte reste cachée.
  const r2 = documentFactice(["parcours-prof"]);
  r2.$("parcours-prof").hidden = true;
  new Function("document", "$", "PARCOURS", "VUE_PROF", "parcoursProf", `${siteScript}\nrenderCarteProf();`)(r2.document, r2.$, PARCOURS, false, {tables: {}});
  assert.equal(r2.$("parcours-prof").hidden, true);
  assert.doesNotMatch(siteScript, /innerHTML|insertAdjacentHTML/);
});

test("1 — Défi tables : un élève sans séance → « Aucune séance pour l’instant. » ; la page 2 de la fiche imprimée ne change pas", () => {
  const PARCOURS = {ajouterJours: (j) => j, jourLocal: () => "2026-11-12",
    resumeSuivi: () => ({debut: "2026-10-19", connuDepuis: null, dernier: null, jours: []})};
  const r = documentFactice(["parcours-prof"]);
  new Function("document", "$", "PARCOURS", "VUE_PROF", "parcoursProf", `${siteScript}\nrenderCarteProf();`)(r.document, r.$, PARCOURS, true, {tables: {}});
  assert.equal(r.$("parcours-prof").parClasse("sp-vide")[0].textContent, "Aucune séance pour l’instant.");
  assert.match(site, /<div id="fiche-prof" class="fiche-page-prof" hidden>/, "la page 2 imprimée est toujours là");
  assert.match(site, /<h2 class="fiche-prof-titre">Pour le professeur <span id="fiche-prof-qui"><\/span><\/h2>/);
});

// ------------------------------------------------------------ 2. SPLAT!

const outilsSplat = new Function("document", `${fonction("pluriel")}\n${fonction("jourCourtSemaine")}\n${fonction("texteEtapeSplat")}\nreturn {texteEtapeSplat};`)({});

test("2 — SPLAT!, la bulle d'une étape : ce que le parcours (relu par le moteur) garde — le jour, le premier coup, les séries, les réponses vues", () => {
  let p = SPLAT.creer();
  p = SPLAT.enregistrerEnCours(p, "m1e5", {idx: 3, etoiles: 2, cartes: 6, vues: 1, res: [true, true, "ko"]}, "2026-10-26");
  p = SPLAT.enregistrerSerie(p, "m1e5", {fait: true, etoiles: 5, cartes: 6, vues: 1}, "2026-10-27");
  p = SPLAT.enregistrerEnCours(p, "enq10", {idx: 6, etoiles: 4, cartes: 6, res: [true, true, true, true, false]}, "2026-11-09");
  p = SPLAT.enregistrerSerie(p, "m1e1", {fait: true, etoiles: 6, cartes: 6, vues: 0}, "2026-10-20");
  const n = SPLAT.normaliser(p);
  const etat = id => SPLAT.etatEtape(n, id);
  const t = (num, id, bonus = false) => outilsSplat.texteEtapeSplat(num, bonus, etat(id), n.etapes[id]).replace(/ /g, " ");
  assert.equal(t(5, "m1e5"), "Étape 5 · réussie le mar. 27/10 · 5 sur 6 du premier coup · 1 série · 1 réponse vue");
  assert.equal(t(1, "m1e1"), "Étape 1 · réussie le mar. 20/10 · 6 sur 6 du premier coup · 1 série");
  assert.equal(t(10, "enq10"), "Étape 10 · en cours : carte 6 sur 6 · le lun. 09/11 · 1 série");
  assert.equal(t(12, "enq12"), "Étape 12 · pas encore commencée");
  assert.equal(t("11d", "enq11d", true), "Bonus 11d · pas encore commencée");
});

test("2 — SPLAT!, la fiche : chaque case est un bouton, son détail au toucher ou au survol dans une bulle AU-DESSUS de sa case (rien ne bouge) ; une à la fois ; retouchée, oubliée", () => {
  const contenu = fonction("contenuSplat");
  assert.match(contenu, /const caseEtape = document\.createElement\("button"\);\s*caseEtape\.type = "button";/);
  assert.match(contenu, /caseEtape\.setAttribute\("aria-label", texte\);/);
  assert.match(contenu, /caseEtape\.addEventListener\("click", evenement => \{ evenement\.stopPropagation\(\); montrerBulleCase\(caseEtape, texte, true\); \}\);/);
  assert.match(contenu, /caseEtape\.addEventListener\("mouseenter", \(\) => montrerBulleCase\(caseEtape, texte, false\)\);/);
  assert.match(contenu, /legende\.append\(el\("span", "", "· toucher une étape : son détail"\)\);/);
  const bulles = [];
  const doc = {createElement: b => new Noeud(b), querySelectorAll: choix => (choix === ".dc-bulle" ? bulles.filter(b => b.parent)
    : choix === ".dc-case.choisie, .et.choisie" ? rangee.children.filter(c => c.classList.contains("choisie")) : [])};
  const f = new Function("document", `${fonction("el")} ${fonction("montrerBulleCase")} ${fonction("cacherBulleCase")} return {montrerBulleCase};`)(doc);
  const rangee = new Noeud("div");
  rangee.className = "detail-monde";
  const c1 = new Noeud("button"), c2 = new Noeud("button");
  c1.className = "et ok"; c2.className = "et";
  c1.offsetLeft = 200; c2.offsetLeft = 560;
  rangee.append(c1, c2);
  const ajouter = rangee.append.bind(rangee);
  rangee.append = n => { if (n.className === "dc-bulle") bulles.push(n); ajouter(n); };
  f.montrerBulleCase(c1, "Étape 5 · réussie", true);
  const b1 = bulles.filter(b => b.parent);
  assert.deepEqual(b1.map(b => b.textContent), ["Étape 5 · réussie"]);
  assert.equal(b1[0].style.left, "200px", "centrée sur sa case (200 + 50 − 50)");
  assert.equal(b1[0].style.right, "auto");
  assert.equal(b1[0].style.bottom, "34px", "au-dessus de la case (60 − 30 + 4)");
  assert.ok(c1.classList.contains("choisie"));
  f.montrerBulleCase(c2, "Étape 12 · pas encore commencée", true);
  assert.equal(bulles.filter(b => b.parent)[0].style.left, "500px", "dans la largeur de la rangée (600 − 100)");
  assert.ok(!c1.classList.contains("choisie") && c2.classList.contains("choisie"), "une à la fois");
  f.montrerBulleCase(c2, "Étape 12 · pas encore commencée", true);
  assert.equal(bulles.filter(b => b.parent).length, 0, "retoucher la case l'oublie");
  assert.match(style, /\.detail-monde \{ position: relative; \}/);
  assert.match(style, /button\.et \{ min-height: 0; gap: 0; font: inherit;/, "la case garde sa taille");
  assert.match(script, /if \(!dans\("\.dc-case, \.detail-monde \.et"\)\) cacherBulleCase\(\);/, "un clic ailleurs la ferme");
});

// « Par monde » : la vraie fonction, les lectures de la page remplacées.
function parMonde(eleves, {ouverts = null, journal = {}, aujourdhui = "2026-11-12"} = {}) {
  const r = documentFactice(["splat-mondes", "splat-mondes-liste", "splat-mondes-vues", "pop-eleves"]);
  const ouvertures = [];
  const f = new Function("document", "$", "window", "SPLAT", "elevesDeLOnglet", "mondesOuverts", "suiviApp", "aujourdhuiSuivi", "ordreDeLaFeuille", "nomAffiche", "ouvrirFenetreEleve", "fermerPopOuEnEst", `
    ${fonction("el")} ${fonction("pluriel")} ${fonction("jourPlus")} ${fonction("lundiDuJour")}
    let ancrePopEleves = null;
    ${fonction("ouvrirPopEleves")} ${fonction("fermerPopEleves")} ${fonction("garderPopEleves")}
    ${fonction("boutonNombre")} ${fonction("lienFiche")} ${fonction("prenomsEnLiens")}
    ${fonction("dessinerMondesSplat")}
    return {dessinerMondesSplat};`)(r.document, r.$, {scrollX: 0, scrollY: 0}, SPLAT, () => eleves, () => ouverts,
    (cle, eleve) => (journal[eleve.prenom] ? {jours: journal[eleve.prenom]} : null), () => aujourdhui, l => l,
    e => e.prenom, (eleve, onglet) => ouvertures.push([eleve.prenom, onglet]), () => {});
  f.dessinerMondesSplat();
  return {r, ouvertures};
}
const lu = mondes => ({lisible: true, faits: 1, cours: 0, mondes: mondes.map((etat, i) => ({numero: i + 1, etat}))});

test("2 — SPLAT!, « Par monde » : pour chaque monde ouvert, fini · en cours · pas commencé ; chaque nombre donne les prénoms (par-dessus la page), un prénom ouvre la fiche sur SPLAT! ; qui a vu des réponses cette semaine", () => {
  const eleves = [
    {prenom: "Léa", lu: lu(["fini", "cours", "vide", "vide", "vide", "vide"])},
    {prenom: "Noah", lu: lu(["fini", "fini", "cours", "vide", "vide", "vide"])},
    {prenom: "Inès", lu: lu(["cours", "vide", "vide", "vide", "vide", "vide"])},
    {prenom: "Rayan", lu: {lisible: true, faits: 0, cours: 0, mondes: lu(["vide", "vide", "vide", "vide", "vide", "vide"]).mondes}}
  ];
  const journal = {
    "Léa": [{jour: "2026-11-06", lignes: [{series: 1, reussies: 1, vues: 4}]}, {jour: "2026-11-10", lignes: [{series: 2, reussies: 1, vues: 2}]}],
    "Noah": [{jour: "2026-11-11", lignes: [{series: 1, reussies: 1, vues: 0}]}],
    "Inès": [{jour: "2026-11-12", lignes: [{series: 1, reussies: 0, vues: 1}, {series: 1, reussies: 0, vues: -1}]}]
  };
  const {r, ouvertures} = parMonde(eleves, {journal});
  assert.equal(r.$("splat-mondes").hidden, false);
  const lignes = r.$("splat-mondes-liste").children;
  assert.equal(lignes.length, 6, "les six mondes (tous ouverts)");
  assert.deepEqual(lignes.slice(0, 3).map(li => li.textContent), [
    "Monde 1fini 2en cours 1pas commencé 1", "Monde 2fini 1en cours 1pas commencé 2", "Monde 3fini 0en cours 1pas commencé 3"]);
  assert.equal(lignes[0].children[0].getAttribute ? lignes[0].children[0].title : "", "Petit SPLAT!", "le nom du monde au survol");
  const encours2 = lignes[1].parClasse("bouton-nombre")[1];
  encours2.click();
  const pop = r.$("pop-eleves");
  assert.equal(pop.hidden, false);
  assert.equal(pop.textContent, "Monde 2 · en coursLéa");
  pop.parClasse("lc-lien")[0].click();
  assert.deepEqual(ouvertures, [["Léa", "splat"]], "la fiche, sur SPLAT!");
  assert.equal(lignes[2].parClasse("bouton-nombre").length, 2, "« fini 0 » n'est pas un bouton");
  // La semaine : depuis lundi 09/11 — Léa (2, pas les 4 du vendredi d'avant), Inès (1, une valeur pas connue ignorée).
  const vues = r.$("splat-mondes-vues");
  assert.equal(vues.textContent.replace(/ /g, " "), "Des réponses vues cette semaine : 2 élèves");
  vues.parClasse("bouton-nombre")[0].click();
  assert.equal(pop.textContent, "Réponses vues cette semaineLéa (2), Inès (1)");
});

test("2 — SPLAT!, « Par monde » : seulement les mondes ouverts à la classe ; cachée tant que personne n'a rien fait ; « Aucune réponse vue cette semaine. »", () => {
  const eleves = [{prenom: "Léa", lu: lu(["fini", "cours", "vide", "vide", "vide", "vide"])}];
  const {r} = parMonde(eleves, {ouverts: [1, 2]});
  assert.deepEqual(r.$("splat-mondes-liste").children.map(li => li.children[0].textContent), ["Monde 1", "Monde 2"]);
  assert.equal(r.$("splat-mondes-vues").textContent, "Aucune réponse vue cette semaine.");
  const vide = parMonde([{prenom: "Rayan", lu: {lisible: true, faits: 0, cours: 0, mondes: []}}]);
  assert.equal(vide.r.$("splat-mondes").hidden, true);
  assert.equal(vide.r.$("splat-mondes-liste").textContent, "");
  assert.match(page, /<div class="carte splat-mondes" id="splat-mondes" hidden>/);
  assert.match(fonction("poserAppli"), /if \(!splat\) \$\("splat-mondes"\)\.hidden = true;/, "hors de SPLAT!, la carte part");
  assert.match(fonction("dessinerTableauSplat"), /dessinerObjectifSplat\(\);\s*dessinerMondesSplat\(\);/);
  for (const id of ["splat-mondes-liste", "splat-mondes-vues"]) assert.match(constante("ZONES_TEXTE"), new RegExp(`"${id}"`), `${id} vidée à la déconnexion`);
  assert.match(script, /"vue-classe", "dc-ouest", "dc-qui", "dc-ouest-pop", "pop-eleves",\s*\/\/[^\n]*\n\s*"splat-mondes",/, "et cachée");
});

// ------------------------------------------------------------ 3. Anzan

const S = (jour, mode, faits, grade = 0, score = faits) => ({jour, mode, faits, calculs: faits, score, grade, reglages: {}});

test("3 — Anzan, la classe par mode : les calculs en Flash et en Colonne, passages et entraînements aux grades rangés dans leur mode", () => {
  const f = new Function("ANZAN", `${fonction("calculsParModeAnzan")}\nreturn calculsParModeAnzan;`)(ANZAN);
  const colonne = ANZAN.NB_GRADES + 1;
  const lu = {historique: [S("2026-11-01", "flash", 10), S("2026-11-02", "colonne", 6), S("2026-11-03", "grade", 10, 20),
    S("2026-11-04", "entrainement", 5, colonne), S("2026-11-05", "flash", -3)]};
  assert.equal(ANZAN.estGradeColonne(colonne), true);
  assert.deepEqual(f(lu), {flash: 20, colonne: 11});
  assert.deepEqual(f({}), {flash: 0, colonne: 0});
  assert.match(page, /<th><button type="button" data-tri="flash">Flash<\/button><\/th>\s*<th><button type="button" data-tri="colonne">Colonne<\/button><\/th>/);
  const tri = fonction("trierEleves");
  assert.match(tri, /if \(tri\.colonne === "flash" \|\| tri\.colonne === "colonne"\) \{\s*const grade = tri\.colonne === "flash" \? eleve\.lu\.grade : eleve\.lu\.gradeColonne;\s*return \(grade \|\| 0\) \* 1e7 \+ calculsParModeAnzan\(eleve\.lu \|\| \{\}\)\[tri\.colonne\];/,
    "le tri d'un mode : son plus haut grade, puis ses calculs");
});

test("3 — Anzan, la fiche : Toutes · Flash · Colonne · Grades (les modes présents, avec leur nombre) ; un mode choisi ne montre que ses séances, 10 puis 10 de plus ; l'impression suit ; rouverte, la fiche repart à Toutes", () => {
  const r = documentFactice(["pa-compte", "pa-grade", "pa-filtres", "pa-liste", "pa-note", "pa-plus", "pa-imprimer"]);
  const historique = [];
  for (let i = 0; i < 14; i += 1) historique.push(S(`2026-10-${String(10 + i).padStart(2, "0")}`, i % 2 ? "colonne" : "flash", 10));
  historique.push(S("2026-10-30", "grade", 10, 20, 9));
  historique.reverse();
  const eleve = {id: 3, prenom: "Rania", lu: {historique, seances: historique.length, texte: "150 calculs"}};
  const f = new Function("document", "$", "ANZAN", "classe", `
    let parcoursAnzanEleve = null, parcoursAnzanAffiches = 10, parcoursAnzanFiltre = null;
    ${constante("FILTRES_ANZAN")}
    ${["el", "prenomCourt", "seElide", "deNom", "jourAnzan", "reglagesAnzan", "modeAnzan", "parcoursAnzanDe", "ouvrirParcoursAnzan",
      "plusDeSeancesAnzan", "dessinerParcoursAnzan", "fermerParcoursAnzan"].map(n => fonction(n)).join("\n")}
    function quitterImpressions() {}
    return {ouvrirParcoursAnzan, plusDeSeancesAnzan, fermerParcoursAnzan, parcoursAnzanDe, filtre: () => parcoursAnzanFiltre};`)(r.document, r.$, ANZAN, {id: 7});
  f.ouvrirParcoursAnzan(eleve);
  const filtres = r.$("pa-filtres");
  assert.equal(filtres.hidden, false);
  assert.deepEqual(filtres.children.map(b => [b.textContent, b.getAttribute("aria-pressed")]),
    [["Toutes", "true"], ["⚡ Flash (7)", "false"], ["📝 Colonne (7)", "false"], ["🥋 Grades (1)", "false"]]);
  assert.equal(r.$("pa-liste").children.length, 10);
  filtres.children[2].click();
  assert.equal(f.filtre(), "colonne");
  assert.equal(r.$("pa-liste").children.length, 7);
  assert.ok(r.$("pa-liste").children.every(li => li.textContent.includes("Colonne")));
  assert.equal(r.$("pa-note").textContent, "", "les 7 sont toutes là");
  assert.equal(r.$("pa-plus").hidden, true);
  assert.deepEqual(filtres.children.map(b => b.getAttribute("aria-pressed")), ["false", "false", "true", "false"]);
  filtres.children[3].click();
  assert.equal(r.$("pa-liste").children.length, 1);
  assert.match(r.$("pa-liste").children[0].textContent, new RegExp(ANZAN.nomGrade(20)));
  const vu = f.parcoursAnzanDe(eleve, new Date("2026-11-08T08:00:00Z"), 3, "flash");
  assert.equal(vu.note, "Les 3 dernières, sur 7.");
  assert.equal(vu.reste, 4);
  assert.match(fonction("imprimerParcoursAnzan"), /parcoursAnzanDe\(eleve, undefined, parcoursAnzanAffiches, parcoursAnzanFiltre\)/, "on imprime ce que montre la fiche");
  // L'élève suivant (‹ ›) : ses séances repartent à Toutes ; fermée puis rouverte aussi.
  f.ouvrirParcoursAnzan(Object.assign({}, eleve, {id: 5, prenom: "Lina"}));
  assert.equal(f.filtre(), null, "un autre élève : Toutes");
  filtres.children[1].click();
  f.fermerParcoursAnzan();
  assert.equal(f.filtre(), null, "fermée : le mode est oublié");
  f.ouvrirParcoursAnzan(eleve);
  assert.equal(f.filtre(), null, "rouverte : Toutes");
  // Un seul mode : pas de boutons.
  f.ouvrirParcoursAnzan({id: 4, prenom: "Tom", lu: {historique: historique.filter(s => s.mode === "flash"), seances: 7}});
  assert.equal(filtres.hidden, true);
  assert.equal(filtres.children.length, 0);
});

// ------------------------------------------------------------ 4. Coffres

function coffres(journalDe, aujourdhui = "2026-11-12") {
  return new Function("suiviApp", "aujourdhuiSuivi", `${fonction("jourPlus")} ${fonction("lundiDuJour")}\n${fonction("semaineCoffres")}\nreturn semaineCoffres;`)(
    (cle, eleve) => (journalDe[eleve.prenom] ? {jours: journalDe[eleve.prenom]} : null), () => aujourdhui);
}

test("4 — Coffres, « Cette semaine » : ce que le journal garde depuis lundi (trésors, parfaits, aides, solutions vues, jours) ; une valeur pas connue ne compte pas", () => {
  const semaine = coffres({
    "Léa": [{jour: "2026-11-06", lignes: [{tresors: 3, parfaits: 1, aides: 2, solutions: 1}]},
            {jour: "2026-11-09", lignes: [{tresors: 1, parfaits: 1, aides: 0, solutions: 0}]},
            {jour: "2026-11-11", lignes: [{tresors: 2, parfaits: -1, aides: 1, solutions: 2}]}],
    "Tom": [{jour: "2026-11-05", lignes: [{tresors: 1, parfaits: 0, aides: 0, solutions: 0}]}]
  });
  assert.deepEqual(semaine({prenom: "Léa"}), {tresors: 3, parfaits: 1, aides: 1, solutions: 2, jours: 2});
  assert.deepEqual(semaine({prenom: "Tom"}), {tresors: 0, parfaits: 0, aides: 0, solutions: 0, jours: 0});
  assert.equal(semaine({prenom: "Malo"}), null);
  // Le lundi : la semaine commence.
  const lundi = coffres({"Léa": [{jour: "2026-11-15", lignes: [{tresors: 1, parfaits: 1, aides: 0, solutions: 0}]},
    {jour: "2026-11-16", lignes: [{tresors: 2, parfaits: 0, aides: 0, solutions: 0}]}]}, "2026-11-16");
  assert.deepEqual(lundi({prenom: "Léa"}), {tresors: 2, parfaits: 0, aides: 0, solutions: 0, jours: 1});
});

test("4 — Coffres, la classe : « Depuis le début » / « Cette semaine » au-dessus du tableau ; cette semaine, une colonne par compte (« — » à zéro) ; les titres et les tris suivent", () => {
  const r = documentFactice(["fragiles", "objectif", "resume-classe"]);
  const corps = new Noeud("tbody");
  const journal = {"Léa": [{jour: "2026-11-10", lignes: [{tresors: 2, parfaits: 1, aides: 0, solutions: 3}]}]};
  const f = new Function("document", "$", "COFFRES", "suiviApp", "aujourdhuiSuivi", "celluleNomTexte", "large", "finirLigne", "resumeDeLaClasse", "dessinerPapier", `
    let eleves = [];
    let periodeCoffres = "semaine";
    ${["el", "jourPlus", "lundiDuJour", "semaineCoffres", "dessinerTableauCoffres"].map(n => fonction(n)).join("\n")}
    return {dessinerTableauCoffres};`)(r.document, r.$, null, (cle, e) => (journal[e.prenom] ? {jours: journal[e.prenom]} : null), () => "2026-11-12",
    e => Object.assign(new Noeud("td"), {texte: e.prenom, className: "nom"}), td => td.classList.add("large"), () => {}, () => "2 élèves", () => {});
  f.dessinerTableauCoffres(corps, true, [{prenom: "Léa", lu: {}}, {prenom: "Malo", lu: {}}]);
  const [lea, malo] = corps.children;
  assert.deepEqual(lea.children.map(td => [td.textContent, td.className]),
    [["Léa", "nom"], ["2", ""], ["1", "large"], ["—", "sans large"], ["3", ""], ["1", "large"]]);
  assert.equal(lea.children[1].children[0].tagName, "B", "les trésors en gras");
  assert.deepEqual(malo.children.slice(1).map(td => td.textContent), ["—", "—", "—", "—", "—"]);
  assert.match(page, /<div class="dc-paliers-choix periode-coffres" id="periode-coffres" role="group" aria-label="Période" hidden>\s*<button type="button" data-periode="debut" aria-pressed="true">Depuis le début<\/button>\s*<button type="button" data-periode="semaine" aria-pressed="false">Cette semaine<\/button>/);
  const entete = page.slice(page.indexOf('<tr id="entete-coffres-semaine" hidden>'), page.indexOf("</tr>", page.indexOf('<tr id="entete-coffres-semaine"')));
  assert.deepEqual([...entete.matchAll(/<th(?: class="(\w+)")?>(?:<button type="button" data-tri="([\w-]+)">)?([^<]*)/g)].map(m => `${m[3]}${m[2] ? `:${m[2]}` : ""}${m[1] ? ` (${m[1]})` : ""}`),
    ["Élève:prenom", "Trésors:s-tresors", "Parfaits:s-parfaits (large)", "Aides:s-aides (large)", "Solutions vues:s-solutions", "Jours:s-jours (large)", "", " (fin)"]);
  assert.match(fonction("choisirPeriodeCoffres"), /periodeCoffres = periode;[\s\S]*?aria-pressed[\s\S]*?poserAppli\(\);\s*dessinerTableau\(\);/);
  assert.match(fonction("trierEleves"), /if \(\/\^s-\/\.test\(tri\.colonne\)\) \{\s*const semaine = semaineCoffres\(eleve\);\s*return semaine \? semaine\[tri\.colonne\.slice\(2\)\] : -1;/);
  assert.match(script, /document\.querySelectorAll\("#periode-coffres button"\)\.forEach\(bouton => \{\s*bouton\.addEventListener\("click", \(\) => choisirPeriodeCoffres\(bouton\.dataset\.periode\)\);/);
});

test("4 — Coffres, la fiche : « Cette semaine » (ou « Rien cette semaine. ») puis « Depuis le début » et tout ce qu'il y avait", () => {
  const contenu = fonction("contenuCoffres");
  assert.match(contenu, /cellule\.append\(el\("h3", "fe-periode", "Cette semaine"\)\);[\s\S]*?\["Trésors", String\(semaine\.tresors\), semaine\.parfaits \? `dont \$\{semaine\.parfaits\} parfait/);
  assert.match(contenu, /\["Aides", String\(semaine\.aides\)\],\s*\["Solutions vues", String\(semaine\.solutions\)\],\s*\["Jours", String\(semaine\.jours\)\]/);
  assert.match(contenu, /else cellule\.append\(paragrapheVide\("Rien cette semaine\."\)\);\s*cellule\.append\(el\("h3", "fe-periode", "Depuis le début"\)\);\s*const depuis = ficheChiffres\(\[/);
});

test("ni HTML ni code d'élève dans ce que le lot ajoute à la page", () => {
  for (const nom of ["texteEtapeSplat", "dessinerMondesSplat", "calculsParModeAnzan", "modeAnzan", "semaineCoffres", "choisirPeriodeCoffres"]) {
    assert.doesNotMatch(fonction(nom), /innerHTML|insertAdjacentHTML|\.code\b/, nom);
  }
});
