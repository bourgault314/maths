// Défi tables — lot « Encore une séance » (08/10/2026, planche 13, choix A de
// Gwenaël, dossier audit-defi-tables\encore-une-seance\) : « Encore une
// séance » ne lance plus la séance suivante d'un coup. Au bilan comme sur
// l'accueil, il fait MONTRER la séance suivante par l'accueil — « Encore une
// séance », le nombre d'étapes, la liste des étapes, « Commencer » — à la
// place de la carte « ✓ Séance du jour faite » (la hauteur de la carte du
// matin : le cadre blanc tient sur un petit écran d'ordinateur). L'élève voit
// ce qu'il va faire : la séance d'après n'est jamais celle du matin (une
// table passée → la suivante, des erreurs → un cran plus bas…).
//
// Le moteur est chargé tel quel ; les fonctions de la page sont EXTRAITES et
// EXÉCUTÉES avec un faux DOM (comme defi-tables-retouches-apres-mon-parcours).
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
const constante = nom => {
  const m = html.match(new RegExp(`const ${nom} = ("[^"]*");`));
  assert.ok(m, `${nom} doit exister dans la page`);
  return JSON.parse(m[1]);
};

// ------------------------------------------------------------------ faux DOM
function element(tag = "div") {
  const classes = new Set();
  const el = {
    tag, id: "", type: "", hidden: false, children: [], attrs: {}, ecouteurs: {}, _texte: "",
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
    get textContent() { return el.children.length ? el.children.map(n => (typeof n === "string" ? n : n.textContent)).join("") : el._texte; },
    set textContent(v) { el.children = []; el._texte = String(v); },
    classList: {
      add(...c) { c.forEach(x => classes.add(x)); }, remove(...c) { c.forEach(x => classes.delete(x)); },
      contains(c) { return classes.has(c); }, toggle(c, on) { (on === undefined ? !classes.has(c) : on) ? classes.add(c) : classes.delete(c); }
    },
    // Un texte posé puis complété (« Mes calculs du jour » + « · 10 calculs ») garde son début.
    append(...n) { if (el._texte) { el.children.push(el._texte); el._texte = ""; } el.children.push(...n); },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    addEventListener(t, f) { el.ecouteurs[t] = f; }, click() { el.ecouteurs.click?.(); }
  };
  return el;
}
const tous = (el, t) => (el.children || []).flatMap(n => (typeof n === "string" ? [] : [...(t(n) ? [n] : []), ...tous(n, t)]));
const parClasse = (el, c) => tous(el, n => n.classList.contains(c));
const parTag = (el, t) => tous(el, n => n.tag === t);
const document = {createElement: tag => element(tag), createTextNode: t => t};

const AUJ = "2026-10-06";
const DEMAIN = "2026-10-07";

// Le moteur au jour AUJ (la page l'appelle sans date : jourLocal()).
const PARCOURS = {
  ...P,
  ouvrirSeance: (p, o = {}) => P.ouvrirSeance(p, {...o, aujourdhui: AUJ}),
  programmeDeSeance: (p, s, _jour, options) => P.programmeDeSeance(p, s, AUJ, options),
  bilanSeances: p => P.bilanSeances(p, AUJ)
};

// La carte de l'accueil, avec ce dont elle a besoin ; carteSeanceFaite est
// remplacée par un repère, commencerSeance note la table lancée.
function carte(parcours, state, table) {
  const lancees = [];
  const FAITE = {repere: "carte « Séance du jour faite »"};
  // Lot « Les records » : la carte demande à la page les options de la
  // séance (optionsSeance) — ici, pas de records : {}.
  const fabrique = new Function("document", "PARCOURS", "parcours", "state", "commencerSeance", "carteSeanceFaite",
    "NOM_DU_TEST", "CONDITION_DU_TEST", "optionsSeance",
    `${source("soude")}; ${source("pluriel")}; ${source("carteDeSeance")}; return carteDeSeance;`);
  const rendue = fabrique(document, PARCOURS, parcours, state, t => lancees.push(t), () => FAITE,
    constante("NOM_DU_TEST"), constante("CONDITION_DU_TEST"), () => ({}))(table);
  return {rendue, lancees, faite: rendue === FAITE};
}
const titre = c => parTag(c, "strong")[0].textContent;
const duree = c => parClasse(c, "duree")[0].textContent.replace(/ /g, " ");
const etapes = c => tous(parClasse(c, "programme")[0], n => n.tag === "span" && !n.classList.contains("programme") && n.children.some(x => x.tag === "i"))
  .map(item => item.children.find(x => x.tag === "span").textContent.replace(/ /g, " "));

// Joue une séance entière, au jour donné, sans faute (ou avec les ratés donnés).
function jouerSeance(p, jour = AUJ, rates = () => []) {
  let seance = P.ouvrirSeance(p, {aujourdhui: jour});
  for (let garde = 0; garde < 8 && !seance.finie; garde += 1) {
    const etape = P.etapeDeSeance(p, seance, jour);
    if (!etape) break;
    const erreurs = rates(etape);
    ({parcours: p, seance} = P.noterEtape(p, seance, etape, {juste: 10 - Math.min(2, erreurs.length), total: 10, erreurs}, jour));
  }
  assert.equal(seance.finie, true, "la séance est finie");
  return p;
}

// Une élève qui travaille la table de 4 (départ 4) et a passé la table de 2.
function eleve() {
  let p = P.creerParcours();
  p.tables[4].seance = {depart: 4, n: 3, dernier: "2026-10-05"};
  for (let m = 2; m <= 9; m += 1) p = P.appliquerReponse(p, `4-${m}`, {correcte: true, date: "2026-10-05"}).parcours;
  p.tables[2].acquise = "2026-10-02";
  for (let m = 2; m <= 9; m += 1) p = P.appliquerReponse(p, `2-${m}`, {correcte: true, date: "2026-10-05"}).parcours;
  return P.normaliserParcours(p);
}

test("« Encore une séance » fermé au chargement de la page", () => {
  assert.match(html, /\n        encoreOuverte: false,\n/, "dans l'état de la page, faux au départ");
});

test("l'accueil, séance du jour faite : la carte « Séance du jour faite » tant que « Encore une séance » n'est pas touché", () => {
  const p = jouerSeance(eleve());
  assert.equal(P.bilanSeances(p, AUJ).aujourdhui, 1);
  const {faite} = carte(p, {encoreOuverte: false}, 4);
  assert.equal(faite, true);
});

test("« Encore une séance » touché : la carte de la séance SUIVANTE prend la place — son titre, ses étapes, « Commencer »", () => {
  const p = jouerSeance(eleve());
  const state = {encoreOuverte: true};
  const {rendue, lancees, faite} = carte(p, state, 4);
  assert.equal(faite, false, "plus la carte « Séance du jour faite » : la séance suivante à sa place");
  assert.equal(rendue.tag, "button");
  assert.equal(rendue.className, "carte-seance");
  assert.equal(rendue.id, "acc-seance", "le même identifiant : le focus y va");
  assert.equal(titre(rendue), "Encore une séance");
  assert.equal(parClasse(rendue, "go")[0].textContent, "Commencer");
  // Les étapes annoncées sont bien celles que le moteur jouera.
  const seance = P.ouvrirSeance(p, {table: 4, aujourdhui: AUJ});
  const programme = P.programmeDeSeance(p, seance, AUJ);
  assert.ok(programme.etapes.length >= 3, `une séance complète (${programme.etapes.map(e => e.nom)})`);
  assert.deepEqual(etapes(rendue).map(nom => nom.split(" · ")[0]), programme.etapes.map(e => e.nom));
  assert.match(duree(rendue), new RegExp(`^${programme.etapes.length}( ou ${programme.etapes.length + 1})? étapes · environ `));
  assert.equal(lancees.length, 0, "rien ne part tout seul");
  rendue.click();
  assert.deepEqual(lancees, [4], "« Commencer » lance la séance de sa table");
});

test("la séance suivante n'est pas celle du matin : la carte le montre (les marches ont avancé d'un cran)", () => {
  const matin = carte(eleve(), {encoreOuverte: false}, 4).rendue;
  assert.equal(titre(matin), "Ma séance du jour");
  const soir = carte(jouerSeance(eleve()), {encoreOuverte: true}, 4).rendue;
  assert.equal(titre(soir), "Encore une séance");
  assert.notDeepEqual(etapes(soir), etapes(matin), `le matin : ${etapes(matin)} ; ensuite : ${etapes(soir)}`);
});

test("une séance en cours (onglet fermé, reprise) : « Reprendre ma séance », que « Encore une séance » ait été touché ou non", () => {
  let p = jouerSeance(eleve());
  let seance = P.ouvrirSeance(p, {table: 4, aujourdhui: AUJ});
  const etape = P.etapeDeSeance(p, seance, AUJ);
  ({parcours: p} = P.noterEtape(p, seance, etape, {juste: 10, total: 10, erreurs: []}, AUJ));
  for (const encoreOuverte of [false, true]) {
    const {rendue, faite} = carte(p, {encoreOuverte}, 4);
    assert.equal(faite, false);
    assert.equal(titre(rendue), "Reprendre ma séance", `encoreOuverte = ${encoreOuverte}`);
    assert.equal(parClasse(rendue, "go")[0].textContent, "Reprendre");
  }
});

test("le lendemain, rien de la veille : « Ma séance du jour », même si « Encore une séance » était resté ouvert", () => {
  const p = jouerSeance(eleve(), "2026-10-05");
  const {rendue, faite} = carte(p, {encoreOuverte: true}, 4);
  assert.equal(faite, false);
  assert.equal(titre(rendue), "Ma séance du jour");
});

test("l'élève aux 9 tables : « Encore une séance » montre sa séance suivante (Mes calculs du jour s'il en reste, puis l'étoile)", () => {
  let p = P.creerParcours();
  for (const t of [2, 3, 4, 5, 6, 7, 8, 9, 10]) p.tables[t].acquise = "2026-09-20";
  p.melange = {...p.melange, reussi: 9};
  p = jouerSeance(P.normaliserParcours(p));
  const {rendue, faite} = carte(p, {encoreOuverte: true}, null);
  assert.equal(faite, false);
  assert.equal(titre(rendue), "Encore une séance");
  const noms = etapes(rendue);
  assert.ok(noms.length >= 1 && /^Tente ★/.test(noms[noms.length - 1]), `l'étoile en dernier (${noms})`);
});

test("« Commencer » remet « Encore une séance » à faux : le soir, l'accueil redit « ✓ Séance du jour faite »", () => {
  const state = {encoreOuverte: true};
  let lancee = 0;
  const commencerSeance = new Function("state", "PARCOURS", "parcours", "lancerEtapeDeSeance",
    `let seance = null; ${source("commencerSeance")}; return commencerSeance;`)(state, PARCOURS, eleve(), () => { lancee += 1; });
  commencerSeance(4);
  assert.equal(state.encoreOuverte, false);
  assert.equal(lancee, 1);
});

test("le bilan : « Encore une séance » ne lance plus la séance, il ramène à l'accueil, qui la montre", () => {
  const bilan = source("renderBilanSeance");
  assert.match(bilan, /encore\.textContent = "Encore une séance";\s*encore\.addEventListener\("click", \(\) => \{\s*state\.encoreOuverte = true;\s*backToModes\(\);\s*\$\("acc-seance"\)\?\.focus\?\.\(\{preventScroll: true\}\);\s*\}\);/);
  assert.doesNotMatch(bilan, /commencerSeance\(prochaineTable\)/, "plus de départ direct");
  // backToModes → show("intro") → renderAccueil : c'est l'accueil qui dessine la carte.
  assert.match(source("backToModes"), /show\("intro"\);/);
  assert.match(source("show"), /if \(name === "intro"\) renderAccueil\(\);/);
});
