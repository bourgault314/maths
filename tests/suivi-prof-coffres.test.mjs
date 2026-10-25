import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

// Lot « Coffres magiques sur le suivi » (21/10/2026) — Coffres magiques dans
// « Ma classe » et dans l'espace élève.
//
// Ma classe : un onglet « Coffres magiques » entre Défi tables et SPLAT!
// (maquette 01 validée par Gwenaël) — un niveau par colonne (« 5 trésors »,
// « dont 3 parfaits » seulement au-dessus de zéro, « — » si rien), le jour du
// dernier trésor, un Détail (la partie en cours, puis un tableau par opération :
// clés gagnées, aides ouvertes, solutions montrées, erreurs) ; dans ⚙ Réglages,
// les niveaux et les opérations accessibles (maquettes 02/03), enregistrés à
// chaque clic. Espace élève : la tuile (planche validée) — une ligne par niveau
// commencé, « 🔑 6 / 10 » au bout de la ligne de la partie en cours.
//
// Ces tests EXÉCUTENT les fonctions des pages, telles qu'elles y sont écrites,
// avec le VRAI moteur servi par le serveur (prof/coffres-parcours.js) et un
// document de poche. Sabotages : coffres-suivi-sabotages.py dans le dossier du lot.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/prof/index.php");
const espace = lire("_serveur/public/index.php");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const scriptDe = source => {
  const debut = source.indexOf(BALISE);
  const fin = source.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne doit être trouvé");
  return source.slice(debut, fin);
};
const script = scriptDe(page);
const scriptEspace = scriptDe(espace);
const COFFRES = createRequire(import.meta.url)(join(racine, "_serveur/public/prof/coffres-parcours.js"));

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(position, i + 1);
    }
  }
  throw new Error("bloc non fermé");
}

function fonction(nom, source = script) {
  const motif = new RegExp(`(?:async )?function ${nom}\\(`);
  const m = motif.exec(source);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(source, m.index);
}

function constante(nom, source = script) {
  const position = source.indexOf(`const ${nom} = `);
  assert.ok(position > 0, `la page doit définir ${nom}`);
  const debut = position + `const ${nom} = `.length;
  let i = debut, profondeur = 0, dansTexte = "";
  for (; i < source.length; i += 1) {
    const c = source[i];
    if (dansTexte) { if (c === dansTexte && source[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if ("[{(".includes(c)) profondeur += 1;
    else if ("]})".includes(c)) profondeur -= 1;
    else if (c === ";" && profondeur === 0) break;
  }
  return source.slice(position, i + 1);
}

// ------------------------------------------------------------ un document de poche

class Noeud {
  constructor(tag) {
    this.tag = tag; this.enfants = []; this.attributs = {}; this.dataset = {}; this.style = {};
    this.className = ""; this.hidden = false; this._texte = ""; this.ecouteurs = {}; this.parent = null;
    this.value = ""; this.checked = false; this.disabled = false;
  }
  get children() { return this.enfants.filter(e => e.tag !== "#texte"); }
  set textContent(v) { this.enfants = []; this._texte = v === null || v === undefined ? "" : String(v); }
  get textContent() { return this.enfants.length ? this.enfants.map(e => e.textContent).join("") : this._texte; }
  append(...noeuds) { noeuds.forEach(n => { const x = typeof n === "string" ? texte(n) : n; x.parent = this; this.enfants.push(x); }); }
  appendChild(n) { this.append(n); return n; }
  after(n) { if (!this.parent) return; const i = this.parent.enfants.indexOf(this); n.parent = this.parent; this.parent.enfants.splice(i + 1, 0, n); }
  remove() { if (!this.parent) return; this.parent.enfants.splice(this.parent.enfants.indexOf(this), 1); this.parent = null; }
  setAttribute(k, v) { this.attributs[k] = String(v); if (k === "class") this.className = String(v); }
  getAttribute(k) { return k === "class" ? this.className : this.attributs[k]; }
  addEventListener(type, f) { (this.ecouteurs[type] = this.ecouteurs[type] || []).push(f); }
  cliquer() { (this.ecouteurs.click || []).forEach(f => f()); }
  tous(predicat, sortie = []) { this.enfants.forEach(e => { if (predicat(e)) sortie.push(e); e.tous(predicat, sortie); }); return sortie; }
  premier(predicat) { return this.tous(predicat)[0] || null; }
  get classList() {
    const n = this;
    return {
      toggle(c, oui) { const l = (n.className || "").split(" ").filter(x => x && x !== c); if (oui === undefined ? !(n.className || "").split(" ").includes(c) : oui) l.push(c); n.className = l.join(" "); },
      add(c) { this.toggle(c, true); },
      contains(c) { return (n.className || "").split(" ").includes(c); }
    };
  }
}
function texte(t) { const n = new Noeud("#texte"); n._texte = String(t); return n; }
const document = {
  createElement: tag => new Noeud(tag),
  createElementNS: (_, tag) => new Noeud(tag),
  createTextNode: t => texte(t),
};
function creerZones() {
  const zones = new Map();
  return {zones, $: id => { if (!zones.has(id)) zones.set(id, new Noeud("div")); return zones.get(id); }};
}
const aClasse = (noeud, classe) => (noeud.className || "").split(" ").includes(classe);

// ------------------------------------------------------------ des élèves

const Q = ["sum", "sum", "sum", "difference", "difference", "difference", "product", "product", "quotient", "quotient"];
const D = ["sum", "product", "sum", "product", "sum", "product", "sum", "product", "sum", "product"];
function tresor(p, niveau, ops, serie, jour, incidents = {}) {
  p = COFFRES.commencerPartie(p, {niveau, ops, serie, familles: []}, jour);
  serie.forEach((op, i) => {
    if (incidents[i] === "aide") p = COFFRES.noterAide(p, op, jour);
    if (incidents[i] === "solution") { p = COFFRES.noterAide(p, op, jour); p = COFFRES.noterSolution(p, op, jour); }
    if (incidents[i] === "erreur") p = COFFRES.noterErreur(p, op, jour);
    p = COFFRES.noterCle(p, op, jour);
  });
  return COFFRES.noterTresor(p, jour);
}
// Léa : les chiffres de la maquette 01 — 5 trésors N1 (3 parfaits), 2 N2 (1 parfait), partie en cours N2 à 6 clés.
let LEA = COFFRES.creer();
LEA = tresor(LEA, 1, [1, 2, 3, 4], Q, "2026-10-12");
LEA = tresor(LEA, 1, [1, 2, 3, 4], Q, "2026-10-13", {3: "erreur"});
LEA = tresor(LEA, 1, [1, 2, 3, 4], Q, "2026-10-14");
LEA = tresor(LEA, 1, [1, 2, 3, 4], Q, "2026-10-15", {0: "aide"});
LEA = tresor(LEA, 1, [1, 2, 3, 4], Q, "2026-10-16", {7: "solution", 8: "erreur"});
LEA = tresor(LEA, 2, [1, 3], D, "2026-10-19");
LEA = tresor(LEA, 2, [1, 3], D, "2026-10-20", {1: "erreur", 5: "aide"});
LEA = COFFRES.commencerPartie(LEA, {niveau: 2, ops: [1, 3], serie: D, familles: []}, "2026-10-21");
D.slice(0, 6).forEach((op, i) => { if (i === 2) LEA = COFFRES.noterErreur(LEA, op, "2026-10-21"); LEA = COFFRES.noterCle(LEA, op, "2026-10-21"); });
// Lucas : un trésor N1, pas parfait.
let LUCAS = tresor(COFFRES.creer(), 1, [1, 2, 3, 4], Q, "2026-10-19", {1: "solution"});
// Zoé : 3 N1 (2 parfaits), 1 N2 (parfait), 1 N3 (pas parfait).
let ZOE = COFFRES.creer();
ZOE = tresor(ZOE, 1, [1, 2, 3, 4], Q, "2026-10-10"); ZOE = tresor(ZOE, 1, [1, 2, 3, 4], Q, "2026-10-11", {4: "erreur"}); ZOE = tresor(ZOE, 1, [1, 2, 3, 4], Q, "2026-10-12");
ZOE = tresor(ZOE, 2, [1, 2, 3, 4], Q, "2026-10-15");
ZOE = tresor(ZOE, 3, [4], Q.map(() => "quotient"), "2026-10-21", {2: "solution"});
// Tom : une partie à 0 clé (un choix de réglages), rien d'autre.
const TOM = COFFRES.commencerPartie(COFFRES.creer(), {niveau: 1, ops: [1], serie: new Array(10).fill(1)}, "2026-10-21");

// ------------------------------------------------------------ la page, exécutée

const SOURCES_TABLEAU = ["nomAffiche", "dateLisible", "celluleNomTexte", "celluleDate", "large", "finirLigne", "ficheChiffres", "paragrapheVide",
  "jourCourt", "celluleNiveau", "contenuCoffres", "dessinerTableauCoffres", "resumeDeLaClasse", "lireCoffres"].map(n => fonction(n)).join("\n");

function ongletCoffres(liste, options = {}) {
  const {zones, $} = creerZones();
  const corps = new Noeud("tbody");
  const messages = [];
  const ouverts = [];
  const moteur = options.sansMoteur ? null : COFFRES;
  const fabrique = new Function("document", "$", "COFFRES", "droitClasse", "messager",
    "dessinerPapier", "classe", "ouvrirFenetreEleve",
    `let eleves = [];\n${SOURCES_TABLEAU}\nreturn {poser: liste => { eleves = liste; }, lireCoffres, dessinerTableauCoffres, contenuCoffres};`);
  const f = fabrique(document, $, moteur, options.droit || "proprietaire",
    (id, t, type) => messages.push({id, t, type}), () => {}, {id: 7, libelle: "CM1", reglages: {}}, eleve => ouverts.push(eleve.prenom));
  const eleves = liste.map((e, i) => Object.assign({id: i + 1, code: `CODE0${i}`, initiale: "", restaurable: false, journees: []}, e, {lu: f.lireCoffres(e.parcours)}));
  f.poser(eleves);
  f.dessinerTableauCoffres(corps, (options.droit || "proprietaire") !== "lecture");
  const lignes = corps.children;
  return {zones, corps, lignes, messages, eleves, f, ouverts};
}

const classe5 = () => [
  {prenom: "Léa", parcours: LEA, maj_le: "2026-10-21T07:40:00Z"},
  {prenom: "Lucas", parcours: LUCAS, maj_le: "2026-10-19T12:00:00Z"},
  {prenom: "Malo", parcours: null, maj_le: null},
  {prenom: "Tom", parcours: TOM, maj_le: "2026-10-21T08:00:00Z"},
  {prenom: "Zoé", parcours: ZOE, maj_le: "2026-10-21T08:00:00Z"},
];
const cellules = tr => tr.children;
// Lot 5c : « Trésors » (colonne du téléphone) après l'élève ; la flèche au bout.
const C_TRESORS = 1, C_N1 = 2, C_N2 = 3, C_N3 = 4, C_DATE = 5, C_VA = 6;
const niveauLu = td => ({b: td.premier(n => n.tag === "b")?.textContent || null, small: td.premier(n => n.tag === "small")?.textContent || null, texte: td.textContent});

test("l'onglet Coffres magiques : un niveau par colonne, « dont N parfaits » seulement au-dessus de zéro, « — » sinon, le jour du dernier trésor", () => {
  const {lignes, zones} = ongletCoffres(classe5());
  assert.equal(lignes.length, 5);
  const [lea, lucas, malo, tom, zoe] = lignes;
  assert.equal(cellules(lea)[0].textContent, "Léa");
  assert.deepEqual(niveauLu(cellules(lea)[C_N1]), {b: "5 trésors", small: "dont 3 parfaits", texte: "5 trésorsdont 3 parfaits"});
  assert.deepEqual(niveauLu(cellules(lea)[C_N2]), {b: "2 trésors", small: "dont 1 parfait", texte: "2 trésorsdont 1 parfait"});
  assert.deepEqual(niveauLu(cellules(lea)[C_N3]), {b: null, small: null, texte: "—"});
  assert.equal(cellules(lea)[C_DATE].textContent, "20 oct. 2026", "le jour du dernier trésor, pas de la dernière activité");
  assert.deepEqual(niveauLu(cellules(lucas)[C_N1]), {b: "1 trésor", small: null, texte: "1 trésor"}, "au singulier, sans « dont 0 parfait »");
  assert.equal(cellules(lucas)[C_DATE].textContent, "19 oct. 2026");
  assert.deepEqual(cellules(malo).slice(C_N1, C_DATE + 1).map(td => td.textContent), ["—", "—", "—", "—"]);
  assert.deepEqual(cellules(tom).slice(C_N1, C_DATE + 1).map(td => td.textContent), ["—", "—", "—", "—"], "une partie à 0 clé : rien à montrer");
  assert.deepEqual(niveauLu(cellules(zoe)[C_N3]), {b: "1 trésor", small: null, texte: "1 trésor"});
  assert.deepEqual(niveauLu(cellules(zoe)[C_N2]), {b: "1 trésor", small: "dont 1 parfait", texte: "1 trésordont 1 parfait"});
  // Au téléphone : « Trésors » (le total) à la place des trois niveaux.
  assert.deepEqual(cellules(lea).map(td => td.className), ["nom", "seul-telephone", "tresors large", "tresors large", "tresors sans large", "", "va"]);
  assert.deepEqual(lignes.map(tr => cellules(tr)[C_TRESORS].textContent), ["7 trésors", "1 trésor", "—", "—", "5 trésors"]);
  assert.equal(zones.get("resume-classe").textContent, "5 élèves · rien reçu pour 1");
  assert.equal(zones.get("objectif").hidden, true, "pas de carte de classe pour Coffres");
  assert.equal(zones.get("fragiles").hidden, true);
  // Lot 5c : plus de « Détail » — la ligne entière ouvre la fenêtre de l'élève ; aucun code nulle part.
  lignes.forEach(tr => { assert.equal(aClasse(tr, "cliquable"), true); assert.equal(cellules(tr)[C_VA].textContent, "›"); });
  assert.equal(lignes.some(tr => tr.tous(n => n.tag === "button").some(b => b.textContent !== cellules(tr)[0].textContent)), false, "un seul bouton : le prénom");
  assert.equal(lignes.some(tr => tr.textContent.includes("CODE0")), false);
});

test("la fenêtre de l'élève (lot 5c) : ses trésors et ses niveaux, la partie en cours (à partir d'une clé), puis les quatre opérations — clés gagnées, aides, solutions, erreurs", () => {
  const {lignes, eleves, f, ouverts} = ongletCoffres(classe5());
  lignes[0].cliquer();
  assert.deepEqual(ouverts, ["Léa"], "la ligne ouvre la fenêtre");
  const cellule = f.contenuCoffres(eleves[0]);
  const chiffres = cellule.premier(n => n.tag === "dl").children.map(div => div.children.map(x => x.textContent));
  assert.deepEqual(chiffres, [["Trésors", "7 trésorsdont 4 parfaits"], ["Niveau 1", "5 trésorsdont 3 parfaits"], ["Niveau 2", "2 trésorsdont 1 parfait"],
    ["Niveau 3", "—"], ["Dernier trésor", "20 oct. 2026"]]);
  const partie = cellule.premier(n => aClasse(n, "partie-en-cours"));
  assert.equal(partie.textContent, "Partie en cours : niveau 2 · addition et multiplication · 6 clés sur 10");
  const table = cellule.premier(n => n.tag === "table");
  const enTete = table.tous(n => n.tag === "th").map(n => n.textContent);
  assert.deepEqual(enTete, ["Opération", "Clés gagnées", "Aides ouvertes", "Solutions montrées", "Erreurs"]);
  const rangees = table.premier(n => n.tag === "tbody").children.map(tr => tr.children.map(td => td.textContent));
  assert.deepEqual(rangees, [["Addition", "28", "1", "0", "1"], ["Soustraction", "15", "0", "0", "1"], ["Multiplication", "23", "2", "1", "1"], ["Division", "10", "0", "0", "1"]],
    "les chiffres de la maquette 01 ; pas de trésors par opération");
  assert.equal(cellule.premier(n => aClasse(n, "aide"))?.textContent, "Parfait : sans erreur ni solution montrée.");
  // Lucas : pas de partie en cours → pas de ligne « Partie en cours ».
  const lucas = f.contenuCoffres(eleves[1]);
  assert.equal(lucas.premier(n => aClasse(n, "partie-en-cours")), null);
  assert.equal(lucas.premier(n => n.tag === "tbody").children.length, 4, "les quatre opérations, même à zéro");
  // Malo : rien reçu.
  assert.equal(f.contenuCoffres(eleves[2]).textContent, "Rien reçu pour l’instant.");
  assert.equal(cellule.textContent.includes("CODE0"), false);
});

test("sans moteur : l'onglet le dit, chaque ligne reste lisible", () => {
  const {lignes, messages} = ongletCoffres(classe5(), {sansMoteur: true});
  assert.equal(lignes.length, 5);
  assert.deepEqual(cellules(lignes[0]).slice(C_N1, C_DATE + 1).map(td => td.textContent), ["—", "—", "—", "—"]);
  assert.ok(messages.some(m => m.id === "message-appli" && m.type === "erreur" && m.t.includes("prof/coffres-parcours.js")));
});

test("c'est le moteur qui lit le parcours : la page ne touche jamais aux compteurs elle-même, et le moteur borne ce qu'il relit", () => {
  const section = script.slice(script.indexOf("// ------------------------------------------------------- l'onglet Coffres magiques"),
    script.indexOf("// ---------------------------------------------------------------- feuille imprimée"));
  assert.doesNotMatch(section, /\.parcours\.(niveaux|operations|partie|dernier)/, "jamais parcours.niveaux… dans la page");
  assert.match(fonction("lireCoffres"), /COFFRES\.resumeProf\(brut \|\| null\)/);
  const {lignes} = ongletCoffres([{prenom: "Pirate", parcours: {version: 1, epoque: 0, niveaux: {"1": {tresors: 3, parfaits: 99}, "7": {tresors: 1000}},
    operations: {sum: {cles: 1e9}}, partie: {niveau: 2, ops: [1], serie: new Array(10).fill(1), cles: 99}}, maj_le: "2026-10-21T08:00:00Z"}]);
  assert.deepEqual(niveauLu(cellules(lignes[0])[C_N1]), {b: "3 trésors", small: "dont 3 parfaits", texte: "3 trésorsdont 3 parfaits"}, "pas plus de parfaits que de trésors");
  assert.equal(cellules(lignes[0])[C_N3].textContent, "—", "un niveau 7 n'existe pas");
});

test("le tri « Trésors » : les trésors, puis les parfaits, puis une partie en cours ; « Dernier trésor » trie sur le jour du dernier trésor", () => {
  const trier = new Function("eleves", "tri", "appliAffichee", "ordreDeLaFeuille", `${fonction("trierEleves")}\ntrierEleves();\nreturn eleves.map(e => e.prenom);`);
  const lus = classe5().map((e, i) => Object.assign({id: i + 1, code: `C${i}`}, e, {lu: COFFRES.resumeProf(e.parcours)}));
  assert.deepEqual(trier(lus.slice(), {colonne: "tresors", sens: -1}, "coffres", l => l), ["Léa", "Zoé", "Lucas", "Malo", "Tom"]);
  assert.deepEqual(trier(lus.slice(), {colonne: "date", sens: -1}, "coffres", l => l).slice(0, 2), ["Zoé", "Léa"], "Zoé (21 oct.) avant Léa (20 oct.) même si Léa a joué après");
  assert.match(constante("TRIS"), /"coffres": \["prenom", "tresors", "niveau1", "niveau2", "niveau3", "date"\]/);
  // Lot 5c : chaque niveau trie sur ses trésors, puis ses parfaits ; un niveau jamais joué en bas.
  assert.deepEqual(trier(lus.slice(), {colonne: "niveau2", sens: -1}, "coffres", l => l).slice(0, 2), ["Léa", "Zoé"], "Léa : 2 trésors au niveau 2, Zoé : 1");
  assert.deepEqual(trier(lus.slice(), {colonne: "niveau3", sens: -1}, "coffres", l => l)[0], "Zoé");
});

test("APPLIS, l'onglet, l'en-tête, la note « Parfait : … » : Coffres magiques entre Défi tables et SPLAT!", () => {
  const APPLIS = new Function(`${constante("APPLIS")}\nreturn APPLIS;`)();
  assert.deepEqual(APPLIS[1], {cle: "coffres", nom: "Coffres magiques", unite: ["niveau commencé", "niveaux commencés"]});
  // Anzan se glisse entre Coffres et SPLAT! (lot « Qui voit quoi », lot 4b).
  assert.match(page, /<button type="button" data-appli="defi-tables" aria-pressed="true">Défi tables<\/button>\s*<button type="button" data-appli="coffres" aria-pressed="false">Coffres magiques<\/button>\s*<button type="button" data-appli="flash-anzan" aria-pressed="false">Anzan<\/button>\s*<button type="button" data-appli="splat" aria-pressed="false">SPLAT!<\/button>/);
  const entete = page.slice(page.indexOf('<tr id="entete-coffres" hidden>'), page.indexOf("</tr>", page.indexOf('<tr id="entete-coffres"')));
  assert.deepEqual([...entete.matchAll(/<th(?: class="([\w-]+)")?>(?:<button type="button" data-tri="(\w+)">)?([^<]*)/g)].map(m => `${m[3]}${m[2] ? `:${m[2]}` : ""}${m[1] ? ` (${m[1]})` : ""}`),
    ["Élève:prenom", "Trésors:tresors (seul-telephone)", "Niveau 1:niveau1 (large)", "Niveau 2:niveau2 (large)", "Niveau 3:niveau3 (large)", "Dernier trésor:date", ""]);
  assert.match(page, /<p class="sous note-coffres" id="note-coffres" hidden>Parfait : sans erreur ni solution montrée\.<\/p>/);
  assert.match(fonction("poserAppli"), /\$\("entete-coffres"\)\.hidden = !coffres;\s*\$\("entete-anzan"\)\.hidden = !anzan;\s*\$\("note-coffres"\)\.hidden = !coffres;\s*\$\("bloc-imprimer"\)\.hidden = splat \|\| coffres \|\| anzan;/);
  assert.match(fonction("dessinerTableau"), /if \(appliAffichee === "coffres"\) \{ dessinerTableauCoffres\(corps, ecriture, lignes\); fin\(\); return; \}/);
  assert.match(fonction("elevesLus"), /cle === "coffres" \? lireCoffres/);
  assert.match(fonction("chargerMoteurDe"), /if \(cle === "coffres"\) return chargerMoteurCoffres\(\);/);
  assert.match(script, /const MOTEUR_COFFRES = "coffres-parcours\.js\?v=<\?= htmlspecialchars\(\$versionCoffres, ENT_QUOTES\) \?>";/);
  assert.match(page, /\$versionCoffres = is_file\(\$moteurCoffres\) \? substr\(md5_file\(\$moteurCoffres\), 0, 10\) : '0';/);
});

// ------------------------------------------------------------ ⚙ Réglages

function casesCoffres() {
  const niveaux = [1, 2, 3].map(n => Object.assign(new Noeud("input"), {dataset: {niveau: String(n)}}));
  const operations = [1, 2, 3, 4].map(n => Object.assign(new Noeud("input"), {dataset: {operation: String(n)}}));
  return {niveaux, operations};
}

function reglagesRejoues(applis, reglages, {reponse = null, echec = null} = {}) {
  const {$} = creerZones();
  const {niveaux, operations} = casesCoffres();
  const mondes = [1, 2, 3, 4, 5, 6].map(n => { const i = Object.assign(new Noeud("input"), {dataset: {monde: String(n)}}); i.closest = () => new Noeud("label"); return i; });
  const cases = ["defi-tables", "coffres", "splat"].map(cle => Object.assign(new Noeud("input"), {dataset: {appli: cle}}));
  const doc = Object.assign({}, document, {querySelectorAll: s => (s.includes("data-niveau") ? niveaux : s.includes("data-operation") ? operations
    : s.startsWith("#mondes-ouverts") ? mondes : cases)});
  const appels = [];
  const messages = [];
  const rouverts = [];
  const api = async (action, corps) => { appels.push({action, corps}); if (echec) throw echec; return reponse || {ok: true}; };
  const etat = {classe: {id: 7, libelle: "CM1", applis, reglages}};
  const monde = new Function("document", "$", "api", "messager", "surErreur", "ouvrirClasse", "etat",
    `let classe = etat.classe;\n${constante("NOMBRE_MONDES")}\n${constante("NOMBRES_COFFRES")}\n${["mondesOuverts", "coffresOuverts", "poserPuce", "recordsOuvertsPourLaClasse", "poserActivites", "changerReglageCoffres"].map(n => fonction(n)).join("\n")}\nfunction poserEnPlusPour() {}\nposerActivites();\nreturn {changerReglageCoffres, coffresOuverts, poserActivites};`)(
    doc, $, api, (id, t, type) => messages.push({id, t, type}), (e, id) => messages.push({id, t: e.message, type: "erreur"}), async id => rouverts.push(id), etat);
  return {$, niveaux, operations, appels, messages, rouverts, monde};
}

test("coffresOuverts : les listes de la classe, ou null (tout ouvert) — rien de lisible, tout ouvert", () => {
  const r = reglagesRejoues(["defi-tables", "coffres"], {coffres: {niveaux: [2], operations: [1, 3]}});
  assert.deepEqual(r.monde.coffresOuverts("niveaux"), [2]);
  assert.deepEqual(r.monde.coffresOuverts("operations"), [1, 3]);
  assert.equal(reglagesRejoues(["coffres"], {}).monde.coffresOuverts("niveaux"), null);
  assert.equal(reglagesRejoues(["coffres"], {coffres: {niveaux: [1, 2, 3], operations: "x"}}).monde.coffresOuverts("niveaux"), null);
  assert.equal(reglagesRejoues(["coffres"], {coffres: {niveaux: [9, 0]}}).monde.coffresOuverts("niveaux"), null);
});

test("⚙ Réglages : sous Coffres, les trois niveaux et les quatre opérations, cochés d'après la classe ; cachés sans Coffres", () => {
  const tout = reglagesRejoues(["defi-tables", "coffres", "splat"], {});
  assert.equal(tout.$("coffres-reglages").hidden, false);
  assert.deepEqual(tout.niveaux.map(c => c.checked), [true, true, true]);
  assert.deepEqual(tout.operations.map(c => c.checked), [true, true, true, true]);
  const regle = reglagesRejoues(["coffres"], {coffres: {niveaux: [2], operations: [1]}});
  assert.deepEqual(regle.niveaux.map(c => c.checked), [false, true, false], "maquette 03");
  assert.deepEqual(regle.operations.map(c => c.checked), [true, false, false, false]);
  const sans = reglagesRejoues(["defi-tables"], {coffres: {niveaux: [2]}});
  assert.equal(sans.$("coffres-reglages").hidden, true, "la classe n'a pas Coffres : rien à régler");
  assert.match(page, /<label class="activite-tete"><input type="checkbox" data-appli="coffres"> <strong>Coffres magiques<\/strong><\/label>/);
  assert.match(page, /<p class="titre-sous" id="titre-coffres-niveaux">Niveaux accessibles aux élèves<\/p>/);
  assert.match(page, /<p class="titre-sous" id="titre-coffres-operations">Opérations accessibles<\/p>/);
  assert.deepEqual([...page.matchAll(/<label><input type="checkbox" data-niveau="(\d)"> ([^<]+)<\/label>/g)].map(m => [m[1], m[2]]), [["1", "Niveau 1"], ["2", "Niveau 2"], ["3", "Niveau 3"]]);
  assert.deepEqual([...page.matchAll(/<label><input type="checkbox" data-operation="(\d)"> ([^<]+)<\/label>/g)].map(m => [m[1], m[2]]), [["1", "Addition"], ["2", "Soustraction"], ["3", "Multiplication"], ["4", "Division"]]);
  assert.doesNotMatch(page.slice(page.indexOf('id="coffres-reglages"'), page.indexOf('data-appli="splat"')), /Enregistrer/, "pas de bouton « Enregistrer » : chaque clic s'enregistre");
});

test("décocher un niveau ou une opération : la liste cochée part au serveur, la classe est relue, « Réglages de Coffres magiques enregistrés. »", async () => {
  const r = reglagesRejoues(["coffres"], {});
  r.niveaux[2].checked = false;
  await r.monde.changerReglageCoffres("niveaux", r.niveaux[2]);
  assert.deepEqual(r.appels, [{action: "classes.modifier", corps: {classe_id: 7, reglages: {coffres: {niveaux: [1, 2]}}}}]);
  assert.deepEqual(r.rouverts, [7]);
  assert.deepEqual(r.messages.at(-1), {id: "message-activites", t: "Réglages de Coffres magiques enregistrés.", type: "ok"});
  r.operations[1].checked = false; r.operations[3].checked = false;
  await r.monde.changerReglageCoffres("operations", r.operations[3]);
  assert.deepEqual(r.appels.at(-1).corps.reglages, {coffres: {operations: [1, 3]}}, "seul le groupe touché part");
  assert.equal(r.$("cases-coffres-operations").attributs["aria-busy"], "false");
});

test("la dernière case cochée d'un groupe ne se décoche pas : refusé sans appel, avec le message ; une erreur du serveur remet la case", async () => {
  const r = reglagesRejoues(["coffres"], {coffres: {niveaux: [2], operations: [1]}});
  r.niveaux[1].checked = false;
  await r.monde.changerReglageCoffres("niveaux", r.niveaux[1]);
  assert.equal(r.niveaux[1].checked, true);
  assert.equal(r.appels.length, 0);
  assert.deepEqual(r.messages.at(-1), {id: "message-activites", t: "Une classe garde au moins un niveau ouvert.", type: "erreur"});
  r.operations[0].checked = false;
  await r.monde.changerReglageCoffres("operations", r.operations[0]);
  assert.equal(r.operations[0].checked, true);
  assert.deepEqual(r.messages.at(-1), {id: "message-activites", t: "Une classe garde au moins une opération ouverte.", type: "erreur"});
  const panne = reglagesRejoues(["coffres"], {}, {echec: new Error("Le serveur n'a pas pu répondre.")});
  panne.niveaux[0].checked = false;
  await panne.monde.changerReglageCoffres("niveaux", panne.niveaux[0]);
  assert.equal(panne.niveaux[0].checked, true, "la case revient");
  assert.equal(panne.messages.at(-1).type, "erreur");
  assert.ok(panne.niveaux.every(c => !c.disabled));
});

// ------------------------------------------------------------ l'espace élève : la tuile

test("la tuile Coffres : une ligne par niveau commencé, « 🔑 6 / 10 » au bout de la ligne de la partie en cours, rien avant", () => {
  // JAUGES, de « const JAUGES = { » à « \n  }; » (ses commentaires portent des apostrophes).
  const debut = scriptEspace.indexOf("  const JAUGES = {");
  const sourceJauges = scriptEspace.slice(debut, scriptEspace.indexOf("\n  };", debut) + 5).replace(/<\?= htmlspecialchars\(\$\w+, ENT_QUOTES\) \?>/g, "x");
  const JAUGES = new Function("P", `${sourceJauges}\nreturn JAUGES;`)();
  const lecteur = JAUGES.coffres.lecteur;
  assert.equal(JAUGES.coffres.global, "MathsGoCoffresParcours");
  assert.equal(JAUGES.coffres.url, "prof/coffres-parcours.js?v=x");
  assert.equal(lecteur(COFFRES, null), null, "rien tant que l'élève n'a ni trésor ni partie");
  assert.equal(lecteur(COFFRES, TOM), null, "une partie à 0 clé non plus");
  assert.deepEqual(lecteur(COFFRES, LEA).lignes, [
    {texte: "Niveau 1 : 5 trésors", bonus: ""},
    {texte: "Niveau 2 : 2 trésors", bonus: "🔑 6 / 10"}
  ]);
  let tom = COFFRES.commencerPartie(LEA, {niveau: 3, ops: [4], serie: new Array(10).fill(4)}, "2026-10-21");
  for (let i = 0; i < 4; i += 1) tom = COFFRES.noterCle(tom, 4, "2026-10-21");
  assert.deepEqual(lecteur(COFFRES, tom).lignes, [
    {texte: "Niveau 1 : 5 trésors", bonus: ""},
    {texte: "Niveau 2 : 2 trésors", bonus: ""},
    {texte: "Niveau 3 : pas encore de trésor", bonus: "🔑 4 / 10"}
  ], "planche validée : « pas encore de trésor » et 4 / 10");
  assert.deepEqual(lecteur(COFFRES, LUCAS).lignes, [{texte: "Niveau 1 : 1 trésor", bonus: ""}], "au singulier");
  // Rien d'autre : ni total, ni ronds, ni étoiles (refusés par Gwenaël).
  const sortie = lecteur(COFFRES, LEA);
  assert.deepEqual(Object.keys(sortie), ["lignes"]);
});

test("la tuile est posée par createElement et textContent : une ligne par niveau, la pastille dorée au bout", () => {
  const poserJauge = new Function("document", `${fonction("poserJauge", scriptEspace)}\nreturn poserJauge;`)(document);
  const tuile = new Noeud("a");
  poserJauge(tuile, {lignes: [{texte: "Niveau 1 : 5 trésors", bonus: ""}, {texte: "Niveau 2 : 2 trésors", bonus: "🔑 6 / 10"}]});
  assert.ok(aClasse(tuile, "a-jauge"));
  const bloc = tuile.children[0];
  assert.equal(bloc.className, "jauge niveaux");
  assert.deepEqual(bloc.children.map(l => l.children.map(s => [s.className, s.textContent])),
    [[["compte", "Niveau 1 : 5 trésors"]], [["compte", "Niveau 2 : 2 trésors"], ["bonus", "🔑 6 / 10"]]]);
  assert.equal(bloc.premier(n => aClasse(n, "jauge-barre")), null, "pas de barre");
  assert.equal(bloc.premier(n => n.tag === "svg"), null, "pas de pastilles de mondes");
  assert.match(espace, /"coffres":\s*'<svg class="icone" width="40" height="40" viewBox="0 0 46 46" aria-hidden="true" focusable="false">'/, "le coffre, dans ICONES");
  assert.match(espace, /\.appli \.jauge\.niveaux \.jauge-ligne \{ margin-top: 4px; min-height: 24px; \}/);
});
