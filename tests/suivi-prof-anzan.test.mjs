import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

// Lot « Qui voit quoi », lot 4b (24/10/2026) — Anzan dans « Ma classe ».
//
// Décisions de Gwenaël (22 et 23/10) : Anzan se donne à Rania seule depuis
// « Ce que voit Rania » (onglet Élèves), ou à toute une classe depuis
// ⚙ Réglages → Activités (décochée par défaut) ; un onglet « Anzan » quand la
// classe OU un élève l'a ; on compte des CALCULS (une séance en fait 5, 10 ou
// 20) : « 106 calculs · 10 jours d'entraînement », la phrase de la tuile ;
// « Parcours » ouvre les dix dernières séances (l'écran « Mon historique » de
// l'élève, en lecture seule), avec « Imprimer » ; nom affiché : « Anzan » ;
// aucun code d'élève hors de l'onglet Élèves ; rien du serveur en HTML.
//
// Ces tests EXÉCUTENT les fonctions de la page, telles qu'elles y sont
// écrites, avec le VRAI moteur servi par le serveur
// (prof/flash_anzan_parcours.js) et un document de poche. Sabotages :
// qui-voit-quoi-lot-4b-sabotages.py dans le dossier du lot.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/prof/index.php");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne doit être trouvé");
  return page.slice(debut, fin);
})();
const exiger = createRequire(import.meta.url);
const ANZAN = exiger(join(racine, "_serveur/public/prof/flash_anzan_parcours.js"));
const CORE = exiger(join(racine, "outils/calcul_mental/flash_anzan_core.js"));

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
    this.value = ""; this.checked = false; this.disabled = false; this.open = false;
  }
  get children() { return this.enfants.filter(e => e.tag !== "#texte"); }
  // Comme le vrai DOM : le texte posé devient un nœud texte, et ce qu'on
  // ajoute ensuite vient après lui (« 0/2 » puis <small>arrêtée</small>).
  set textContent(v) { const s = v === null || v === undefined ? "" : String(v); this._texte = ""; this.enfants = s ? [texte(s)] : []; }
  get textContent() { return this.enfants.length ? this.enfants.map(e => e.textContent).join("") : this._texte; }
  set innerHTML(_) { throw new Error("innerHTML interdit dans l'onglet Anzan"); }
  append(...noeuds) { noeuds.forEach(n => { const x = typeof n === "string" ? texte(n) : n; x.parent = this; this.enfants.push(x); }); }
  appendChild(n) { this.append(n); return n; }
  setAttribute(k, v) { this.attributs[k] = String(v); if (k === "class") this.className = String(v); }
  getAttribute(k) { return k === "class" ? this.className : this.attributs[k]; }
  addEventListener(type, f) { (this.ecouteurs[type] = this.ecouteurs[type] || []).push(f); }
  cliquer() { (this.ecouteurs.click || []).forEach(f => f()); }
  showModal() { this.open = true; this.modales = (this.modales || 0) + 1; }
  tous(predicat, sortie = []) { this.enfants.forEach(e => { if (predicat(e)) sortie.push(e); e.tous(predicat, sortie); }); return sortie; }
  premier(predicat) { return this.tous(predicat)[0] || null; }
}
function texte(t) { const n = new Noeud("#texte"); n._texte = String(t); return n; }
const document = {
  createElement: tag => new Noeud(tag),
  createTextNode: t => texte(t),
  body: {classes: [], classList: null}
};
function creerZones() {
  const zones = new Map();
  return {zones, $: id => { if (!zones.has(id)) zones.set(id, new Noeud(id === "parcours-anzan" ? "dialog" : "div")); return zones.get(id); }};
}

// ------------------------------------------------------------ des élèves

// Une séance : les douze champs du moteur (jour, mode, operations, chiffresMin,
// chiffresMax, nombres, temps, calculs prévus, faits, score, id, ordre).
const S = (ordre, jour, mode, operations, cmin, cmax, nombres, temps, calculs, faits, score) =>
  [jour, mode, operations, cmin, cmax, nombres, temps, calculs, faits, score, 500000 - ordre * 37, ordre];
// Rania : douze séances (deux de plus que les dix montrées), dont trois arrêtées,
// les identifiants qui DESCENDENT quand le temps monte (l'ordre seul compte).
const RANIA_SEANCES = [
  S(1, "2026-10-12", "flash", "plus", 1, 1, 6, 15, 10, 10, 10),
  S(2, "2026-10-13", "flash", "plus", 1, 2, 8, 12, 5, 5, 5),
  S(3, "2026-10-15", "colonne", "plusmoins", 2, 2, 10, 0, 10, 10, 9),
  S(4, "2026-10-17", "flash", "plus", 1, 2, 8, 12, 5, 5, 5),
  S(5, "2026-10-18", "flash", "plus", 1, 2, 8, 10, 10, 10, 10),
  S(6, "2026-10-19", "colonne", "plusmoins", 3, 3, 10, 20, 20, 20, 17),
  S(7, "2026-10-20", "flash", "plus", 2, 2, 10, 10, 10, 7, 6),
  S(8, "2026-10-21", "flash", "plus", 2, 2, 10, 10, 10, 10, 9),
  S(9, "2026-10-21", "colonne", "plusmoins", 3, 3, 8, 20, 10, 10, 10),
  S(10, "2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 8),
  S(11, "2026-10-23", "flash", "plus", 2, 3, 10, 8, 5, 2, 0),
  S(12, "2026-10-23", "flash", "plusmoins", 2, 3, 10, 8, 5, 2, 0)
];
const parcoursDe = seances => ({version: 1, epoque: 0, reglages: {},
  seances: Object.fromEntries(seances.map((s, i) => [String(i + 1), s]))});
const RANIA = parcoursDe(RANIA_SEANCES);
const LUCAS = parcoursDe([S(1, "2026-10-22", "colonne", "plus", 1, 1, 5, 0, 5, 5, 4)]);
const AUJOURDHUI = new Date("2026-10-24T08:00:00Z");

// ------------------------------------------------------------ la page, exécutée

const SOURCES_TABLEAU = ["nomAffiche", "dateLisible", "celluleNomTexte", "celluleDate", "large", "finirLigne",
  "peutRevenir", "boutonGeste", "menuGestes", "placerMenu", "jourCourt", "dessinerTableauAnzan", "resumeDeLaClasse", "lireAnzan", "parLaClasse", "elevesDeLOnglet", "voitLOnglet", "aDuTravail",
  "finirOnglet", "accesDe", "calculsParModeAnzan", "indiceTelephone", "el", "pluriel", "jourAnzan"].map(n => fonction(n)).join("\n");

function ongletAnzan(liste, options = {}) {
  const {zones, $} = creerZones();
  const corps = new Noeud("tbody");
  const messages = [];
  const ouverts = [];
  const moteur = options.sansMoteur ? null : ANZAN;
  const classe = options.classe || {id: 7, libelle: "405", applis: ["defi-tables", "splat"], reglages: {}};
  const fabrique = new Function("document", "$", "ANZAN", "droitClasse", "messager", "dessinerPapier",
    "classe", "appliAffichee", "ouvrirFenetreEleve", "revenirA", "voirFiche",
    `let eleves = [];\n${SOURCES_TABLEAU}\nreturn {poser: l => { eleves = l; }, lireAnzan, dessinerTableauAnzan, elevesDeLOnglet, finirOnglet};`);
  const f = fabrique(document, $, moteur, options.droit || "proprietaire", (id, t, type) => messages.push({id, t, type}),
    () => {}, classe, "flash-anzan", eleve => ouverts.push(eleve.prenom),
    () => {}, () => { throw new Error("pas de parcours Défi tables depuis Anzan"); });
  const eleves = liste.map((e, i) => Object.assign({id: i + 1, code: `CODE0${i}`, initiale: "", restaurable: false, journees: []}, e,
    {lu: f.lireAnzan(e.parcours)}));
  f.poser(eleves);
  const lignes = f.elevesDeLOnglet();
  f.dessinerTableauAnzan(corps, (options.droit || "proprietaire") !== "lecture", lignes);
  f.finirOnglet(lignes);
  return {zones, corps, lignes: corps.children, messages, ouverts, eleves};
}

const ACCES_RANIA = {applis: ["defi-tables", "flash-anzan", "splat"], reglages: {}};
const ACCES_CLASSE = {applis: ["defi-tables", "splat"], reglages: {}};
const classe405 = () => [
  {prenom: "Alice", parcours: null, maj_le: null, acces: ACCES_CLASSE},
  {prenom: "Lucas", parcours: null, maj_le: null, acces: ACCES_CLASSE},
  {prenom: "Rania", parcours: RANIA, maj_le: "2026-10-23T09:00:00Z", acces: ACCES_RANIA}
];
const cellules = tr => tr.children;
// Lot S4c : au téléphone, le jour de la dernière séance passe sous le prénom
// (indice-tel) — le prénom seul est celui du bouton.
const prenomDe = td => td.premier(n => n.tag === "button").textContent;
// Lot S4c : les calculs par mode (Flash, Colonne) d'une liste de séances S().
const parMode = seances => ({flash: seances.filter(x => x[1] !== "colonne").reduce((t, x) => t + x[8], 0),
  colonne: seances.filter(x => x[1] === "colonne").reduce((t, x) => t + x[8], 0)});

test("onglet Anzan, appli donnée à Rania seule : sa ligne seulement — « 106 calculs », « 10 jours », le jour de la dernière séance ; la ligne ouvre sa fenêtre (lot 5c) ; la ligne du haut le dit", () => {
  const {lignes, zones, ouverts} = ongletAnzan(classe405());
  assert.equal(lignes.length, 1, "la classe n'a pas Anzan : seuls les élèves qui l'ont en plus");
  const [rania] = lignes;
  const {flash, colonne} = parMode(RANIA_SEANCES);
  const jours = new Set(RANIA_SEANCES.map(s => s[0])).size;
  // Lot S4c : par mode — Flash, Colonne, puis les jours et le jour de la dernière séance.
  assert.equal(prenomDe(cellules(rania)[0]), "Rania");
  assert.deepEqual(cellules(rania).slice(1, 5).map(td => td.textContent), [`${flash} calculs`, `${colonne} calculs`, `${jours} jours`, "23 oct. 2026"]);
  assert.equal(flash + colonne, RANIA_SEANCES.reduce((t, x) => t + x[8], 0), "les deux modes font tous ses calculs");
  assert.equal(cellules(rania)[1].premier(n => n.tag === "b").textContent, `${flash} calculs`, "le compte en gras");
  assert.deepEqual(cellules(rania).map(td => td.className), ["nom", "", "", "large", "large", "geste", "va"], "au téléphone, les jours et le jour se cachent ; le « ⋯ » (lot 8), la flèche au bout");
  assert.equal(cellules(rania)[0].premier(n => n.tag === "span" && /indice-tel/.test(n.className)).textContent, "23 oct.", "au téléphone, le jour sous le prénom");
  assert.equal(cellules(rania)[0].premier(n => n.tag === "button").className, "lien-eleve", "le prénom est un bouton (le clavier y arrive)");
  assert.equal(rania.className, "cliquable");
  assert.equal(rania.premier(n => n.tag === "button" && n.textContent === "Parcours"), null, "plus de « Parcours » sur la ligne");
  rania.cliquer();
  assert.deepEqual(ouverts, ["Rania"], "la ligne entière ouvre la fenêtre de l'élève");
  assert.equal(zones.get("resume-classe").textContent, "1 élève · en plus de la classe, qui n’a pas cette activité");
  assert.equal(zones.get("objectif").hidden, true, "pas de carte de classe pour Anzan");
  assert.equal(zones.get("fragiles").hidden, true);
  assert.equal(lignes.some(tr => tr.textContent.includes("CODE0")), false, "aucun code d'élève dans l'onglet");
});

test("onglet Anzan, appli ouverte à toute la classe : tout le monde, « — » pour qui n'a rien fait, au singulier pour une séance d'un jour ; le résumé de la classe", () => {
  const liste = classe405().map(e => Object.assign(e, {acces: ACCES_RANIA}));
  liste[1].parcours = LUCAS;
  liste[1].maj_le = "2026-10-22T07:00:00Z";
  const {lignes, zones} = ongletAnzan(liste, {classe: {id: 7, libelle: "405", applis: ["defi-tables", "flash-anzan", "splat"], reglages: {}}});
  assert.equal(lignes.length, 3);
  assert.deepEqual(cellules(lignes[0]).slice(0, 5).map(td => [td.textContent, td.className]), [["Alice", "nom"], ["—", "sans"], ["—", "sans"], ["—", "sans large"], ["—", "sans large"]]);
  assert.deepEqual(cellules(lignes[1]).slice(1, 5).map(td => td.textContent), ["—", "5 calculs", "1 jour", "22 oct. 2026"], "Lucas : une séance en Colonne");
  assert.equal(zones.get("resume-classe").textContent, "3 élèves · aucun calcul reçu pour 1");
});

test("un élève qui n'a plus Anzan en plus mais y a du travail reste dans l'onglet ; un élève de la classe qui ne l'a pas n'y est pas", () => {
  const liste = classe405();
  liste[0].maj_le = "2026-10-20T07:00:00Z";
  liste[0].parcours = LUCAS;
  const {lignes} = ongletAnzan(liste);
  assert.deepEqual(lignes.map(tr => prenomDe(cellules(tr)[0])), ["Alice", "Rania"]);
});

test("la même règle pour toutes les applis : l'onglet SPLAT! d'un élève qui l'a en plus (classe sans SPLAT!) tait les cartes de la classe ; une classe qui a l'appli les garde", () => {
  const AVEC = {applis: ["defi-tables", "splat"], reglages: {}};
  const SANS = {applis: ["defi-tables"], reglages: {}};
  const rejouer = (applis, lignes = [{id: 1, acces: AVEC}, {id: 2, acces: AVEC}]) => {
    const {$} = creerZones();
    $("objectif").hidden = false;
    $("fragiles").hidden = false;
    $("resume-classe").textContent = "5 élèves · tout le monde a commencé";
    new Function("$", "classe", "appliAffichee", "lignes",
      `${["parLaClasse", "accesDe", "voitLOnglet", "finirOnglet"].map(n => fonction(n)).join("\n")}\nfinirOnglet(lignes);`)(
      $, {applis, reglages: {}}, "splat", lignes);
    return [$("objectif").hidden, $("fragiles").hidden, $("resume-classe").textContent];
  };
  assert.deepEqual(rejouer(["defi-tables"]), [true, true, "2 élèves · en plus de la classe, qui n’a pas cette activité"]);
  assert.deepEqual(rejouer(["defi-tables", "splat"]), [false, false, "5 élèves · tout le monde a commencé"], "la classe a SPLAT! : rien ne change");
  // Lot 4b-bis (remarque de Codex) : ceux qui ne l'ont plus mais dont le travail reste sont comptés à part.
  assert.equal(rejouer(["defi-tables"], [{id: 1, acces: AVEC}, {id: 2, acces: SANS}])[2],
    "1 élève · en plus de la classe, qui n’a pas cette activité · 1 n’y a plus accès (son travail reste)");
  assert.equal(rejouer(["defi-tables"], [{id: 1, acces: AVEC}, {id: 2, acces: SANS}, {id: 3, acces: SANS}])[2],
    "1 élève · en plus de la classe, qui n’a pas cette activité · 2 n’y ont plus accès (leur travail reste)");
});

test("sans moteur : l'onglet le dit, les lignes restent lisibles", () => {
  const {lignes, messages} = ongletAnzan(classe405(), {sansMoteur: true});
  assert.equal(lignes.length, 1);
  assert.deepEqual(cellules(lignes[0]).slice(1, 5).map(td => td.textContent), ["—", "—", "—", "—"]);
  assert.ok(messages.some(m => m.id === "message-appli" && m.type === "erreur" && m.t.includes("prof/flash_anzan_parcours.js")));
});

test("c'est le moteur qui lit le parcours : la page ne touche jamais aux séances, et une séance trafiquée ne se lit pas", () => {
  const section = script.slice(script.indexOf("// ------------------------------------------------------------ l'onglet Anzan"),
    script.indexOf("// ---------------------------------------------------------------- feuille imprimée"));
  assert.ok(section.length > 3000, "la section du lot");
  assert.doesNotMatch(section, /\.parcours\b|\.seances\[|innerHTML|insertAdjacentHTML|\.code\b/, "ni parcours lu à la main, ni HTML, ni code");
  assert.match(fonction("lireAnzan"), /ANZAN\.resumeProf\(brut \|\| null\)/);
  const pirate = parcoursDe([
    S(1, "2026-10-22", "flash", "plus", 2, 3, 10, 8, 10, 10, 10),
    ["2026-10-23", "flash", "plus", 2, 3, 10, 8, 10, 1e9, 1e9, 7, 2],          // plus de faits que prévus
    ["2026-10-23", "<img src=x onerror=alert(1)>", "plus", 2, 3, 10, 8, 10, 10, 10, 8, 3], // un mode inventé
    ["2026-10-23", "flash", "plus", 2, 3, 10, 8, 10, 10, 99, 9, 4]               // un score plus grand que les faits
  ]);
  const {lignes} = ongletAnzan([{prenom: "Pirate", parcours: pirate, maj_le: "2026-10-23T08:00:00Z", acces: ACCES_RANIA}]);
  assert.deepEqual([cellules(lignes[0])[1], cellules(lignes[0])[3]].map(td => td.textContent), ["30 calculs", "2 jours"],
    "les faits bornés aux calculs prévus, le mode inventé jeté");
});

// ------------------------------------------------------------ « Le parcours de Rania »

const SOURCES_FENETRE = ["prenomCourt", "seElide", "deNom", "jourAnzan", "reglagesAnzan", "modeAnzan", "el", "parcoursAnzanDe",
  "ouvrirParcoursAnzan", "plusDeSeancesAnzan", "dessinerParcoursAnzan", "fermerParcoursAnzan", "quitterImpressions", "imprimerParcoursAnzan"].map(n => fonction(n)).join("\n");

function fenetre(eleve, options = {}) {
  const {zones, $} = creerZones();
  const classes = new Set();
  const impressions = [];
  const ecouteurs = {};
  const fenetreNav = {
    addEventListener: (type, f) => { ecouteurs[type] = f; },
    removeEventListener: type => { delete ecouteurs[type]; },
    print: () => impressions.push({classes: [...classes], titre: $("fa-titre").textContent,
      lignes: $("fa-corps").children.map(tr => tr.children.map(td => td.textContent.replace(/\u00a0/g, " ")))})
  };
  const doc = Object.assign({}, document, {body: {classList: {add: c => classes.add(c), remove: c => classes.delete(c)}}});
  const f = new Function("document", "$", "ANZAN", "classe", "window", "setTimeout", "maintenant",
    `let parcoursAnzanEleve = null;\nlet parcoursAnzanAffiches = 10;\nlet parcoursAnzanFiltre = null;\nlet numeroImpression = 0;\n${constante("MODES_IMPRESSION")}\n${constante("FILTRES_ANZAN")}\n${SOURCES_FENETRE.replace(/aujourdhui = new Date\(\)/, "aujourdhui = maintenant")}\n`
    + "return {ouvrirParcoursAnzan, plusDeSeancesAnzan, fermerParcoursAnzan, imprimerParcoursAnzan, parcoursAnzanDe, reglagesAnzan, jourAnzan, eleve: () => parcoursAnzanEleve};")(
    doc, $, options.sansMoteur ? null : ANZAN, {id: 7}, fenetreNav, () => 0, options.aujourdhui || AUJOURDHUI);
  // Le lecteur de la page (lireAnzan), le vrai : resumeProf + historique.
  const lireAnzan = new Function("ANZAN", `${fonction("lireAnzan")}\nreturn lireAnzan;`)(ANZAN);
  const lu = Object.assign({}, eleve, {lu: lireAnzan(eleve.parcours)});
  return {zones, $, f, lu, classes, impressions, ecouteurs};
}

test("ses séances dans la fenêtre de l'élève (lot 5c) : la phrase du compte, les dix dernières séances (la plus récente en haut) — jour, mode, réglages, score, « arrêtée » ; « sur 12 » dessous", () => {
  const r = fenetre({id: 3, prenom: "Rania", parcours: RANIA});
  r.f.ouvrirParcoursAnzan(r.lu);
  assert.equal(r.f.eleve().prenom, "Rania");
  assert.equal(r.f.parcoursAnzanDe(r.lu, AUJOURDHUI).titre, "Le parcours de Rania", "le titre de la feuille imprimée");
  assert.equal(r.$("pa-compte").textContent, ANZAN.texteResume(RANIA), "la phrase de la tuile, rendue par le moteur");
  assert.match(r.$("pa-compte").textContent, /^\d+ calculs · \d+ jours d’entraînement$/);
  const items = r.$("pa-liste").children;
  assert.equal(items.length, 10);
  // Les espaces insécables du noyau (« 10 nombres ») se lisent ici comme des espaces.
  const propre = span => span.enfants.filter(e => e.tag === "#texte").map(e => e._texte).join("");
  const sp = x => x.replace(/\u00a0/g, " ");
  const lu = li => li.children.map(span => (span.children.length
    ? [propre(span), ...span.children.map(x => sp(x.textContent))].filter(Boolean) : span.textContent));
  assert.deepEqual(lu(items[0]), ["23 oct.", ["⚡ Flash", "+ et − · 2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout"], ["0/2", "arrêtée"]],
    "la plus récente en haut (le plus grand ORDRE, même avec le plus petit identifiant)");
  assert.deepEqual(lu(items[2]), ["22 oct.", ["⚡ Flash", "2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout"], "8/10"]);
  assert.deepEqual(lu(items[3]), ["21 oct.", ["📝 Colonne", "+ et − · 3 chiffres · 8 nombres · 20 s"], "10/10"]);
  assert.deepEqual(lu(items[5]), ["20 oct.", ["⚡ Flash", "2 chiffres · 10 nombres · 1 s par nombre · 10 s en tout"], ["6/7", "arrêtée"]], "6/7 · arrêtée = 7 calculs faits sur 10 prévus");
  assert.deepEqual(lu(items[9]), ["15 oct.", ["📝 Colonne", "+ et − · 2 chiffres · 10 nombres"], "9/10"],
    "la dixième : les deux plus anciennes (12 et 13 oct.) ne sont pas montrées ; Colonne sans limite de temps");
  assert.equal(r.$("pa-note").textContent, "Les 10 dernières séances, sur 12.");
  assert.equal(r.$("pa-imprimer").hidden, false);
  assert.equal(items.some(li => li.premier(n => n.tag === "button")), false, "lecture seule : aucun bouton dans la liste");
  // Fermée : la fenêtre oublie tout.
  r.f.fermerParcoursAnzan();
  assert.equal(r.f.eleve(), null);
  assert.deepEqual(["pa-compte", "pa-liste", "pa-note"].map(id => r.$(id).textContent), ["", "", ""]);
  assert.deepEqual([r.$("pa-plus").hidden, r.$("pa-imprimer").hidden], [true, true]);
});

test("« Voir les séances précédentes » : 10 de plus à chaque clic, jusqu'à la plus ancienne ; « Imprimer » sort ce que montre la fenêtre ; rouverte, la fenêtre repart à 10", () => {
  const r = fenetre({id: 3, prenom: "Rania", parcours: RANIA});
  r.f.ouvrirParcoursAnzan(r.lu);
  assert.equal(r.$("pa-liste").children.length, 10);
  assert.equal(r.$("pa-plus").hidden, false, "12 séances gardées : le bouton est là");
  r.f.plusDeSeancesAnzan();
  const items = r.$("pa-liste").children;
  assert.equal(items.length, 12, "les deux plus anciennes arrivent");
  assert.equal(items[11].children[0].textContent, "12 oct.", "la plus ancienne en bas");
  assert.equal(r.$("pa-plus").hidden, true, "plus rien à montrer : le bouton part");
  assert.equal(r.$("pa-note").textContent, "", "toutes les séances sont là : pas de « sur 12 »");
  r.f.imprimerParcoursAnzan();
  assert.equal(r.impressions[0].lignes.length, 12, "la feuille suit la fenêtre");
  r.ecouteurs.afterprint();
  // Rouverte sans passer par la fermeture (la page ne compte pas sur l'événement « close ») : 10.
  r.f.ouvrirParcoursAnzan(r.lu);
  assert.equal(r.$("pa-liste").children.length, 10, "rouverte : 10 de nouveau");
  // Et fermée puis rouverte : 10 aussi.
  r.f.plusDeSeancesAnzan();
  r.f.fermerParcoursAnzan();
  r.f.ouvrirParcoursAnzan(r.lu);
  assert.equal(r.$("pa-liste").children.length, 10, "fermée puis rouverte : 10");
  // Un élève à une séance : pas de bouton.
  const lucas = fenetre({id: 2, prenom: "Lucas", parcours: LUCAS});
  lucas.f.ouvrirParcoursAnzan(lucas.lu);
  assert.equal(lucas.$("pa-plus").hidden, true);
  assert.match(page, /<button type="button" class="secondaire pa-plus" id="pa-plus" hidden>Voir les séances précédentes<\/button>/);
  assert.match(script, /\$\("pa-plus"\)\.addEventListener\("click", plusDeSeancesAnzan\);/);
  assert.match(fonction("lireAnzan"), /historique: ANZAN\.historique\(brut \|\| null\)/, "toutes les séances, lues par le moteur");
});

test("la fenêtre d'un élève sans séance, ou sans prénom : la phrase le dit, pas de liste, pas d'« Imprimer » ; « d’Alice » s'élide", () => {
  const vide = fenetre({id: 1, prenom: "Alice", parcours: null});
  vide.f.ouvrirParcoursAnzan(vide.lu);
  assert.equal(vide.f.parcoursAnzanDe(vide.lu, AUJOURDHUI).titre, "Le parcours d’Alice");
  assert.equal(vide.$("pa-compte").textContent, "Alice n’a pas encore fait de séance.");
  assert.equal(vide.$("pa-liste").hidden, true);
  assert.equal(vide.$("pa-note").textContent, "");
  assert.equal(vide.$("pa-imprimer").hidden, true);
  const anonyme = fenetre({id: 2, prenom: "", parcours: LUCAS});
  anonyme.f.ouvrirParcoursAnzan(anonyme.lu);
  assert.equal(anonyme.f.parcoursAnzanDe(anonyme.lu, AUJOURDHUI).titre, "Le parcours de cet élève");
  assert.equal(anonyme.$("pa-note").textContent, "", "une seule séance : pas de « sur … »");
  const sansMoteur = fenetre({id: 3, prenom: "Rania", parcours: RANIA}, {sansMoteur: true});
  sansMoteur.f.ouvrirParcoursAnzan(sansMoteur.lu);
  assert.equal(sansMoteur.f.eleve(), null, "sans moteur, rien ne s'ouvre");
});

test("les réglages d'une séance : les mots du noyau d'Anzan (CORE.resume sans le mode), sur TOUS les réglages possibles", () => {
  const r = fenetre({id: 1, prenom: "Rania", parcours: null});
  let essais = 0;
  for (const mode of CORE.MODES) {
    for (const operations of CORE.OPERATIONS) {
      for (let cmin = CORE.BORNES.chiffres.min; cmin <= CORE.BORNES.chiffres.max; cmin += 1) {
        for (let cmax = cmin; cmax <= CORE.BORNES.chiffres.max; cmax += 1) {
          for (const nombres of [CORE.BORNES.nombres.min, 10, CORE.BORNES.nombres.max]) {
            for (const valeur of mode === "flash" ? CORE.TEMPS : CORE.LIMITES) {
              const reglages = {operations, chiffresMin: cmin, chiffresMax: cmax, nombres, calculs: 10};
              if (mode === "flash") reglages.temps = valeur; else reglages.limite = valeur;
              assert.equal(r.f.reglagesAnzan(mode, reglages), CORE.resume(mode, reglages, {avecMode: false}), JSON.stringify([mode, reglages]));
              essais += 1;
            }
          }
        }
      }
    }
  }
  assert.ok(essais > 1500, `${essais} réglages comparés`);
});

test("le jour : « 23 oct. » cette année, avec l'année sinon — à l'heure de La Réunion", () => {
  const r = fenetre({id: 1, prenom: "Rania", parcours: null});
  assert.equal(r.f.jourAnzan("2026-10-23", AUJOURDHUI), "23 oct.");
  assert.equal(r.f.jourAnzan("2025-12-31", AUJOURDHUI), "31 déc. 2025");
  assert.equal(r.f.jourAnzan("2026-10-23", new Date("2027-01-02T00:00:00Z")), "23 oct. 2026");
  assert.equal(r.f.jourAnzan("", AUJOURDHUI), "");
  assert.equal(r.f.jourAnzan("pas une date", AUJOURDHUI), "");
});

test("« Imprimer » : la feuille seule (classe imprime-anzan), les mêmes séances, vidée après ; possible en lecture seule (aucun code)", () => {
  const r = fenetre({id: 3, prenom: "Rania", parcours: RANIA});
  assert.equal(r.f.imprimerParcoursAnzan(), false, "rien d'ouvert : rien à imprimer");
  r.f.ouvrirParcoursAnzan(r.lu);
  assert.equal(r.f.imprimerParcoursAnzan(), true);
  assert.equal(r.impressions.length, 1);
  const [sortie] = r.impressions;
  assert.deepEqual(sortie.classes, ["imprime-anzan"]);
  assert.equal(sortie.titre, "Le parcours de Rania");
  assert.equal(sortie.lignes.length, 10);
  assert.deepEqual(sortie.lignes[0], ["23 oct.", "⚡ Flash", "+ et − · 2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout", "0/2 · arrêtée"]);
  assert.deepEqual(sortie.lignes[2], ["22 oct.", "⚡ Flash", "2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout", "8/10"]);
  r.ecouteurs.afterprint();
  assert.equal(r.classes.size, 0, "la classe part au retour");
  assert.deepEqual(["fa-titre", "fa-compte", "fa-corps", "fa-note"].map(id => r.$(id).textContent), ["", "", "", ""], "la feuille est vidée");
  assert.doesNotMatch(fonction("imprimerParcoursAnzan"), /droitClasse/, "pas de droit à vérifier : la feuille n'a aucun code");
});

// ------------------------------------------------------------ le tri

test("le tri « Calculs » : les calculs faits, puis les jours ; « Dernière séance » trie sur le jour de la dernière séance", () => {
  const trier = new Function("eleves", "tri", "appliAffichee", "ordreDeLaFeuille", `${fonction("trierEleves")}\ntrierEleves();\nreturn eleves.map(e => e.prenom);`);
  const lus = [
    {prenom: "Rien", code: "A", parcours: null},
    {prenom: "Lucas", code: "B", parcours: LUCAS},
    {prenom: "Rania", code: "C", parcours: RANIA},
    {prenom: "Zoé", code: "D", parcours: parcoursDe([S(1, "2026-10-10", "flash", "plus", 1, 1, 5, 10, 5, 5, 5)]), maj_le: "2026-10-24T08:00:00Z"}
  ].map(e => Object.assign(e, {lu: ANZAN.resumeProf(e.parcours)}));
  assert.deepEqual(trier(lus.slice(), {colonne: "calculs", sens: -1}, "flash-anzan", l => l), ["Rania", "Lucas", "Zoé", "Rien"],
    "à calculs égaux (Lucas et Zoé : 5), l'ordre stable du code départage");
  assert.deepEqual(trier(lus.slice(), {colonne: "date", sens: -1}, "flash-anzan", l => l).slice(0, 3), ["Rania", "Lucas", "Zoé"],
    "le jour de la dernière SÉANCE (Zoé : le 10), pas la dernière activité (Zoé : le 24)");
  assert.match(constante("TRIS"), /"flash-anzan": \["prenom", "flash", "colonne", "jours", "date"\]/, "lot 5c : les titres de colonnes trient, « Jours » aussi ; lot S4c : Flash, Colonne");
  assert.deepEqual(trier(lus.slice(), {colonne: "jours", sens: -1}, "flash-anzan", l => l), ["Rania", "Lucas", "Zoé", "Rien"],
    "« Jours » : les jours d'entraînement, puis les calculs");
});

// ------------------------------------------------------------ la page

test("APPLIS, l'onglet, l'en-tête, le moteur chargé d'ICI à la première ouverture ; plus de ligne dans Réglages (lot 5b : « Régler Anzan »)", () => {
  const APPLIS = new Function(`${constante("APPLIS")}\nreturn APPLIS;`)();
  assert.deepEqual(APPLIS[2], {cle: "flash-anzan", nom: "Anzan", unite: ["séance", "séances"]}, "après Coffres, comme au catalogue ; nom « Anzan »");
  assert.match(page, /<button type="button" data-appli="flash-anzan" aria-pressed="false">Anzan<\/button>/);
  const entete = page.slice(page.indexOf('<tr id="entete-anzan" hidden>'), page.indexOf("</tr>", page.indexOf('<tr id="entete-anzan"')));
  assert.deepEqual([...entete.matchAll(/<th(?: class="(\w+)")?>(?:<button type="button" data-tri="(\w+)">)?([^<]*)/g)].map(m => `${m[3]}${m[2] ? `:${m[2]}` : ""}${m[1] ? ` (${m[1]})` : ""}`),
    ["Élève:prenom", "Flash:flash", "Colonne:colonne", "Jours:jours (large)", "Dernière séance:date (large)", "", " (fin)"]);
  assert.match(page, /\$moteurAnzan = __DIR__ \. '\/flash_anzan_parcours\.js';\s*\$versionAnzan = is_file\(\$moteurAnzan\) \? substr\(md5_file\(\$moteurAnzan\), 0, 10\) : '0';/);
  assert.match(script, /const MOTEUR_ANZAN = "flash_anzan_parcours\.js\?v=<\?= htmlspecialchars\(\$versionAnzan, ENT_QUOTES\) \?>";/,
    "le moteur servi par le suivi (une adresse relative : jamais d'un autre domaine)");
  assert.doesNotMatch(page, /<script[^>]+flash_anzan_parcours/, "pas chargé d'office : seulement à l'ouverture de l'onglet");
  assert.match(fonction("chargerMoteurDe"), /if \(cle === "flash-anzan"\) return chargerMoteurAnzan\(\);/);
  assert.match(fonction("chargerMoteurAnzan"), /script\.src = MOTEUR_ANZAN;/);
  assert.match(fonction("elevesLus"), /cle === "flash-anzan" \? lireAnzan/);
  assert.match(fonction("dessinerTableau"), /if \(appliAffichee === "flash-anzan"\) \{ dessinerTableauAnzan\(corps, ecriture, lignes\); fin\(\); return; \}/);
  assert.match(fonction("evalVisible"), /&& \(\(classe\.applis \|\| \[\]\)\.includes\("defi-tables"\)\)/,
    "un onglet Défi tables ouvert pour un élève en plus n'ouvre pas les évaluations de la classe");
  // Serveur pro, lot 5b : Anzan se règle dans son onglet (« Régler Anzan ») —
  // plus de carte « Activités » dans Réglages, plus de ligne « En plus pour ».
  assert.doesNotMatch(page, /id="liste-activites"|id="en-plus-flash-anzan"|class="activite-tete"/);
  assert.doesNotMatch(page, /data-appli="flash-anzan" checked/);
  // Déconnexion : tout ce qui porte un prénom est vidé, la fenêtre fermée.
  const zones = new Function(`${constante("ZONES_TEXTE")}\nreturn ZONES_TEXTE;`)();
  for (const id of ["regler-corps", "qui-voit-etat", "pa-compte", "pa-liste", "pa-note", "fa-titre", "fa-compte", "fa-corps", "fa-note", "fe-titre", "fe-sous", "fe-contenu"]) {
    assert.ok(zones.includes(id), `${id} vidé à la déconnexion`);
  }
  assert.match(fonction("viderZones"), /"regler", "fenetre-eleve"\]\.forEach/);
  assert.match(fonction("oublierEtat"), /parcoursAnzanEleve = null;/);
  assert.match(script, /\$\("fenetre-eleve"\)\.addEventListener\("close", surFermetureFenetre\);/);
  assert.match(fonction("surFermetureFenetre"), /fenetreEleveId = null;\s*fermerParcoursAnzan\(\);/, "fermée, la fenêtre oublie l'élève et ses séances");
  assert.match(script, /\$\("pa-imprimer"\)\.addEventListener\("click", imprimerParcoursAnzan\);/);
});

test("la fenêtre et la feuille : le HTML, le logo et la signature en pied ; à l'impression, la feuille seule", () => {
  assert.match(page, /<dialog id="fenetre-eleve" class="fenetre fenetre-eleve" aria-labelledby="fe-titre">/, "lot 5c : les séances vivent dans la fenêtre de l'élève");
  assert.doesNotMatch(page, /id="parcours-anzan"/);
  assert.match(page, /<ol class="pa-liste" id="pa-liste" aria-label="Ses dernières séances"><\/ol>/);
  const feuille = page.slice(page.indexOf('<div class="fiche-anzan" id="fiche-anzan">'), page.indexOf("<!-- Ctrl+P sans passer par un bouton"));
  assert.match(feuille, /<img src="\.\.\/mathsgo-logo-print\.png" alt="maths&go" style="height:26px">\s*<span>mathsgo\.re · CC BY-NC-SA 4\.0<\/span>/);
  assert.equal([...feuille.matchAll(/mathsgo-logo/g)].length, 1, "un seul logo");
  assert.ok(page.indexOf('id="fiche-anzan"') > page.indexOf('<section id="ecran-classe"'), "la feuille est dans l'écran de la classe");
  assert.match(page, /\.fiche-anzan \{ display: none; \}/, "jamais à l'écran");
  assert.match(page, /body\.imprime-anzan \.fiche-anzan \{ display: block; \}/);
  assert.match(page, /body\.imprime-anzan dialog \{ display: none !important; \}/, "la fenêtre ouverte ne s'imprime pas par-dessus");
});

// ------------------------------------------------------------ lot 4b-bis : la relecture de Codex (24/10/2026)

const tic = () => new Promise(r => setTimeout(r, 0));

// ouvrirClasse et afficherAppli, exécutées telles qu'écrites, avec un serveur
// dont on tient la réponse : on la rend APRÈS « Se déconnecter ».
function classeRejouee() {
  const attentes = [];
  const poses = [];
  const etat = {jeton: "jeton-de-test"};
  const api = (action, corps) => new Promise(resolve => attentes.push(() => resolve({
    classe: {id: corps.classe_id, libelle: "405", applis: ["defi-tables", "splat"], droit: "proprietaire"},
    eleves: [{id: 1, prenom: "Rania", acces: {applis: ["defi-tables", "flash-anzan", "splat"], reglages: {}}}]
  })));
  const f = new Function("api", "etat", "poses", "APPLIS", "ANZAN",
    `let classe = null, droitClasse = "proprietaire", eleves = [], tableaux = {}, appliAffichee = "defi-tables", vue = "appli", demandeAppli = 0, voitEleve = null, parcoursAnzanEleve = null;
     const classes = [{id: 7, applis: ["defi-tables", "splat"]}];
     function oublierRecherche() {} function fermerFenetreEleve() {} function zoneClasses() { return "message-classes"; }
     const $ = () => ({textContent: "", hidden: false});
     let jeton = etat.jeton;
     function chargerMoteurDe() { return Promise.resolve(null); }
     function elevesLus(cle, liste) { return (liste || []).map(e => Object.assign({}, e, {lu: {}})); }
     function messager() {} function surErreur(e) { poses.push("erreur " + e.message); }
     function montrer(ecran) { poses.push("montrer " + ecran); }
     function appliquerDroits() {} function poserAppli() { poses.push("onglets"); } function dessinerTableau() { poses.push("tableau"); }
     function lireChoixAppli() { return ""; } function retenirChoixAppli() {} function lireSplat() { return {}; } function poserOnglets() { poses.push("onglets"); return []; }
     const redessin = {demander() { poses.push("tableau"); }};
     ${["lesApplisConnues", "applisDeLaClasse", "applisAMontrer", "appliAMontrer", "reporterAccesDeLaListe", "ouvrirClasse", "avecSignal", "afficherAppli"].map(n => fonction(n)).join("\n")}
     // « Se déconnecter », pour ce qui compte ici (la vraie oublierEtat le fait : un test le vérifie).
     function deconnecter() { jeton = ""; classe = null; eleves = []; tableaux = {}; demandeAppli += 1; }
     return {ouvrirClasse, afficherAppli, deconnecter, etat: () => ({classe, eleves, appliAffichee}),
       poserClasse: c => { classe = c; }, poserEleves: l => { eleves = l; tableaux = {"defi-tables": l}; }};`)(
    api, etat, poses, [{cle: "defi-tables", nom: "Défi tables"}, {cle: "coffres", nom: "Coffres magiques"}, {cle: "flash-anzan", nom: "Anzan"}, {cle: "splat", nom: "SPLAT!"}], ANZAN);
  return {f, attentes, poses};
}

test("lot 4b-bis — une classe qui arrive APRÈS « Se déconnecter » n'est pas posée dans la page (ni l'écran, ni « Rania »)", async () => {
  const r = classeRejouee();
  const ouverture = r.f.ouvrirClasse(7);
  await tic();
  r.f.deconnecter();
  r.attentes[0]();
  await ouverture;
  assert.equal(r.f.etat().classe, null, "la classe n'est pas reposée");
  assert.deepEqual(r.f.etat().eleves, [], "aucun prénom");
  assert.deepEqual(r.poses, [], "ni l'écran de la classe, ni le tableau");
  assert.match(fonction("oublierEtat"), /demandeAppli \+= 1;/, "la vraie déconnexion périme les lectures en cours");
  // Deux classes rapprochées : la première réponse, arrivée après la seconde demande, ne passe pas devant.
  const s = classeRejouee();
  const premiere = s.f.ouvrirClasse(7);
  const seconde = s.f.ouvrirClasse(8);
  await tic();
  s.attentes[1]();
  await seconde;
  s.attentes[0]();
  await premiere;
  assert.equal(s.f.etat().classe.id, 8, "la classe ouverte en dernier reste");
});

test("lot 4b-bis — un onglet qui arrive APRÈS « Se déconnecter » n'est pas posé", async () => {
  const r = classeRejouee();
  r.f.poserClasse({id: 7, libelle: "405", applis: ["defi-tables", "splat"]});
  r.f.poserEleves([{id: 1, prenom: "Rania", acces: {applis: ["defi-tables", "flash-anzan", "splat"], reglages: {}}, lu: {}}]);
  const lecture = r.f.afficherAppli("flash-anzan");
  await tic();
  r.f.deconnecter();
  r.attentes[0]();
  await lecture;
  assert.deepEqual(r.f.etat().eleves, [], "« Rania : 101 calculs » ne revient pas dans le document");
  assert.equal(r.f.etat().appliAffichee, "defi-tables");
});

test("lot 4b-bis, revu au lot 5b — afficherAppli : la liste fraîche sans personne pour Anzan → l'accès est reporté, l'onglet s'affiche quand même (grisé, avec sa carte)", async () => {
  const poses = [];
  const messages = [];
  const tableaux = {"defi-tables": [{id: 1, prenom: "Rania", acces: {applis: ["defi-tables", "flash-anzan"], reglages: {}}, lu: {}}]};
  const f = new Function("tableaux", "poses", "messages", "APPLIS",
    `let classe = {id: 7, applis: ["defi-tables"]}, eleves = tableaux["defi-tables"], appliAffichee = "defi-tables", demandeAppli = 0, jeton = "x";
     function chargerMoteurDe() { return Promise.resolve(null); }
     async function api() { return {eleves: [{id: 1, prenom: "Rania", acces: {applis: ["defi-tables"], reglages: {}}}]}; }
     function elevesLus(cle, liste) { return liste.map(e => Object.assign({}, e, {lu: {}})); }
     function messager(id, t, type) { messages.push([id, t, type]); } function surErreur(e) { throw e; }
     function poserAppli() { poses.push("poserAppli " + appliAffichee + " " + applisAMontrer().join(",")); }
     function retenirChoixAppli(cle) { poses.push("retenu " + cle); } function lireSplat() { return {}; } const redessin = {demander() { poses.push("tableau"); }};
     ${["lesApplisConnues", "applisDeLaClasse", "applisAMontrer", "reporterAccesDeLaListe", "afficherAppli"].map(n => fonction(n)).join("\n")}
     return {afficherAppli, etat: () => ({appliAffichee, eleves})};`)(
    tableaux, poses, messages, [{cle: "defi-tables", nom: "Défi tables"}, {cle: "flash-anzan", nom: "Anzan"}]);
  await f.afficherAppli("flash-anzan");
  assert.deepEqual(tableaux["defi-tables"][0].acces.applis, ["defi-tables"], "l'accès frais est reporté sur la liste déjà lue");
  assert.equal(f.etat().appliAffichee, "flash-anzan", "l'onglet Anzan s'affiche : grisé, sa carte dit qu'il est fermé (poserQuiVoit)");
  assert.deepEqual(poses, ["retenu flash-anzan", "poserAppli flash-anzan defi-tables", "tableau"], "Anzan n'est plus parmi les applis ouvertes : son onglet sera grisé");
  assert.deepEqual(messages.at(-1), ["message-appli", "", ""]);
  // On va voir Défi tables, puis on revient sur l'onglet Anzan, grisé : il s'affiche (sa carte « fermé »).
  await f.afficherAppli("defi-tables");
  await f.afficherAppli("flash-anzan");
  assert.equal(f.etat().appliAffichee, "flash-anzan", "un onglet grisé s'ouvre comme les autres");
  // Une appli que la page ne connaît pas, ou sans classe : rien.
  poses.length = 0;
  await f.afficherAppli("inconnue");
  assert.deepEqual(poses, []);
});

test("lot 5b — supprimer le dernier élève qui avait Anzan : l'onglet reste (grisé), on ne quitte pas l'onglet affiché", async () => {
  const appels = [];
  const f = new Function("appels",
    `let eleves = [{id: 1, prenom: "Rania"}], appliAffichee = "flash-anzan";
     async function demander() { return true; } async function api(a) { appels.push(a); return {ok: true}; }
     function nomAffiche(e) { return e.prenom; } function reporterEleve() { appels.push("reporté"); } const redessin = {demander() { appels.push("tableau"); }};
     function messager(id, t) { appels.push(id + " " + t); } function surErreur(e) { throw e; }
     function poserAppli() { appels.push("poserAppli " + appliAffichee); }
     ${fonction("supprimerEleve")}
     return {supprimerEleve, eleves: () => eleves};`)(appels);
  await f.supprimerEleve({id: 1, prenom: "Rania"});
  assert.deepEqual(appels, ["eleves.supprimer", "reporté", "tableau", "message-classe Élève supprimé.", "poserAppli flash-anzan"]);
  assert.deepEqual(f.eleves(), []);
});

test("lot 4b-bis — des réglages Anzan enregistrés sans un calcul ne comptent pas comme du travail (onglet « en plus » et « tout le monde a commencé »)", () => {
  const reglagesSeuls = {version: 1, epoque: 0, reglages: {mode: "flash", rang: 1}, seances: {}};
  // Lucas : plus d'accès, des réglages seulement → pas dans l'onglet ; Rania : son accès et ses séances.
  const liste = [
    {prenom: "Lucas", parcours: reglagesSeuls, maj_le: "2026-10-22T07:00:00Z", acces: ACCES_CLASSE},
    {prenom: "Rania", parcours: RANIA, maj_le: "2026-10-23T09:00:00Z", acces: ACCES_RANIA}
  ];
  const {lignes, zones} = ongletAnzan(liste);
  assert.deepEqual(lignes.map(tr => prenomDe(cellules(tr)[0])), ["Rania"]);
  assert.equal(zones.get("resume-classe").textContent, "1 élève · en plus de la classe, qui n’a pas cette activité");
  // Anzan ouvert à toute la classe : Lucas n'a « encore rien fait ».
  const tous = ongletAnzan(liste.map(e => Object.assign({}, e, {acces: ACCES_RANIA})),
    {classe: {id: 7, libelle: "405", applis: ["defi-tables", "flash-anzan", "splat"], reglages: {}}});
  assert.equal(tous.zones.get("resume-classe").textContent, "2 élèves · aucun calcul reçu pour 1");
});

test("lot 4b-bis — une impression à la fois : la feuille des codes, sans « afterprint », ne sort pas avec le parcours Anzan ; son filet de 60 s ne touche pas l'impression suivante", () => {
  const {$} = creerZones();
  const classes = new Set();
  const minuteurs = [];
  const sorties = [];
  const fenetreNav = {addEventListener() {}, removeEventListener() {}, print: () => sorties.push([...classes].sort())};
  const doc = Object.assign({}, document, {body: {classList: {add: c => classes.add(c), remove: c => classes.delete(c)}}});
  const r = new Function("document", "$", "window", "setTimeout", "ANZAN",
    `let droitClasse = "proprietaire", classe = {id: 7}, parcoursAnzanEleve = null, parcoursAnzanAffiches = 10, parcoursAnzanFiltre = null, numeroImpression = 0;
     ${constante("MODES_IMPRESSION")}
     ${constante("FILTRES_ANZAN")}
     function dessinerBandelettes() {} function dessinerPapier() {}
     ${["prenomCourt", "seElide", "deNom", "jourAnzan", "reglagesAnzan", "modeAnzan", "parcoursAnzanDe", "quitterImpressions", "imprimer", "imprimerParcoursAnzan"].map(n => fonction(n)).join("\n")}
     return {imprimer, imprimerParcoursAnzan, poserEleve: e => { parcoursAnzanEleve = e; }};`)(
    doc, $, fenetreNav, (g, ms) => { minuteurs.push(g); return minuteurs.length; }, ANZAN);
  r.imprimer("recap");
  assert.deepEqual(sorties[0], ["imprime-recap"]);
  // « afterprint » ne vient pas ; on imprime le parcours de Rania.
  r.poserEleve({id: 3, prenom: "Rania", lu: Object.assign({}, ANZAN.resumeProf(RANIA), {historique: ANZAN.historique(RANIA), lisible: true})});
  r.imprimerParcoursAnzan();
  assert.deepEqual(sorties[1], ["imprime-anzan"], "seule la feuille Anzan sort — pas les codes de la classe");
  // Le filet de 60 s de la feuille des codes passe : il ne retire pas la classe de l'impression en cours.
  minuteurs[0]();
  assert.deepEqual([...classes], ["imprime-anzan"]);
  assert.notEqual($("fa-titre").textContent, "", "la feuille Anzan reste remplie");
  // Et dans l'autre sens : le parcours Anzan sans « afterprint », puis les bandelettes.
  r.imprimer("bandelettes");
  assert.deepEqual(sorties[2], ["imprime-bandelettes"]);
  assert.equal($("fa-titre").textContent, "", "la feuille Anzan est vidée : rien d'elle ne sort avec les bandelettes");
  assert.match(fonction("viderZones"), /quitterImpressions\(\);/, "la déconnexion retire toute impression en attente");
  // Deux fois la même feuille, sans « afterprint » : le filet de la PREMIÈRE ne défait pas la seconde.
  const avant = minuteurs.length;
  r.imprimer("recap");
  r.imprimer("recap");
  minuteurs[avant]();
  assert.deepEqual([...classes], ["imprime-recap"], "la feuille des codes en cours garde sa classe");
  r.imprimerParcoursAnzan();
  r.imprimerParcoursAnzan();
  minuteurs[avant + 2]();
  assert.deepEqual([...classes], ["imprime-anzan"], "le parcours en cours garde sa classe");
  assert.equal($("fa-titre").textContent, "Le parcours de Rania", "et sa feuille n'est pas vidée par le vieux filet");
});

// ------------------------------------------------------------ les grades
// Lot « grades » (07/11/2026), demande de Gwenaël : voir où en est l'élève
// sans ouvrir l'historique. Barème révisé (22/11/2026) : un grade se gagne
// étape par étape — sous le compte de calculs, le plus haut grade GAGNÉ et,
// dessous, le grade et l'étape en cours ; chaque passage et entraînement
// dans ses séances, avec les mots du moteur.
const G = (ordre, jour, mode, numero, calculs, faits, score) => {
  const e = ANZAN.etape(numero);
  return S(ordre, jour, mode, e.operations, e.chiffresMin, e.chiffresMax, e.nombres, numero, calculs, faits, score);
};
const RANIA_GRADES = parcoursDe(RANIA_SEANCES.concat([
  G(13, "2026-11-22", "grade", 101, 10, 10, 9),
  G(14, "2026-11-22", "grade", 102, 10, 10, 8),
  G(15, "2026-11-23", "entrainement", 103, 5, 5, 3),
  G(16, "2026-11-23", "grade", 103, 10, 10, 6)
]));
// Une étape réussie sur deux : aucun grade gagné encore.
const RANIA_ETAPE = parcoursDe(RANIA_SEANCES.concat([G(13, "2026-11-22", "grade", 101, 10, 10, 9)]));

test("grades : sous le compte de calculs, le plus haut grade gagné puis « En cours : grade · étape » (sans ouvrir la fenêtre) ; rien pour qui n'en a pas", () => {
  const liste = classe405();
  liste[2].parcours = RANIA_GRADES;
  const {lignes} = ongletAnzan(liste);
  // Lot S4c : le grade Flash sous les calculs Flash (passages compris).
  const calculs = cellules(lignes[0])[1];
  assert.equal(calculs.premier(n => n.tag === "b").textContent, `${parMode(RANIA_SEANCES).flash + 35} calculs`);
  const petits = calculs.children.filter(n => n.tag === "small");
  assert.deepEqual(petits.map(n => n.className), ["anzan-grade", "anzan-grade en-cours"]);
  // « 19e kyu » et « étape 1 sur 2 » d'un bloc chacun : la ligne ne se coupe qu'après « · ».
  assert.deepEqual(petits.map(n => n.textContent), ["🥋 20e kyu", "En\u00a0cours\u00a0: 19e\u00a0kyu · étape\u00a01\u00a0sur\u00a02"],
    "les deux étapes du 20e kyu sont réussies : il est gagné ; l'étape 1 du 19e kyu n'est que « presque »");
  // La Colonne : aucune étape tentée, rien sous ses calculs.
  assert.deepEqual(cellules(lignes[0])[2].children.filter(n => n.tag === "small"), []);
  // Une seule étape réussie : pas de grade gagné, mais on voit où en est l'élève.
  const debut = classe405();
  debut[2].parcours = RANIA_ETAPE;
  const enCours = cellules(ongletAnzan(debut).lignes[0])[1].children.filter(n => n.tag === "small");
  assert.deepEqual(enCours.map(n => n.textContent), ["En\u00a0cours\u00a0: 20e\u00a0kyu · étape\u00a02\u00a0sur\u00a02"]);
  assert.match(lire("_serveur/public/prof/index.php"), /\.anzan-grade\.en-cours \{ font-weight: 400; white-space: normal; \}/, "au téléphone, la ligne se coupe au lieu d'élargir le tableau");
  const sans = ongletAnzan(classe405());
  assert.equal(cellules(sans.lignes[0])[1].premier(n => n.tag === "small"), null);
});

test("grades : dans la fenêtre, le grade gagné et l'étape en cours sous le compte, et les séances de grade avec les mots du moteur (imprimées aussi)", () => {
  const r = fenetre({id: 3, prenom: "Rania", parcours: RANIA_GRADES});
  r.f.ouvrirParcoursAnzan(r.lu);
  assert.equal(r.$("pa-grade").hidden, false);
  assert.equal(r.$("pa-grade").textContent, "🥋 Flash\u00a0: 20e kyu réussi, 19e kyu · étape 1 sur 2 en cours");
  const items = r.$("pa-liste").children;
  const ligne = li => li.children.slice(1).map(span => span.textContent.replace(/\u00a0/g, " "));
  assert.deepEqual(ligne(items[0]), ["🥋 19e kyuÉtape 1 sur 2 · presque", "6/10"]);
  assert.deepEqual(ligne(items[1]), ["🎯 19e kyuEntraînement · étape 1 sur 2", "3/5"]);
  assert.deepEqual(ligne(items[2]), ["🥋 20e kyuÉtape 2 sur 2 · réussie", "8/10"]);
  assert.deepEqual(ligne(items[3]), ["🥋 20e kyuÉtape 1 sur 2 · réussie", "9/10"]);
  r.f.imprimerParcoursAnzan();
  assert.deepEqual(r.impressions[0].lignes[0].slice(1), ["🥋 19e kyu", "Étape 1 sur 2 · presque", "6/10"]);
  r.f.fermerParcoursAnzan();
  assert.equal(r.$("pa-grade").hidden, true);
  assert.equal(r.$("pa-grade").textContent, "");
  const debut = fenetre({id: 3, prenom: "Rania", parcours: RANIA_ETAPE});
  debut.f.ouvrirParcoursAnzan(debut.lu);
  assert.equal(debut.$("pa-grade").textContent, "🥋 Flash\u00a0: 20e kyu · étape 2 sur 2 en cours");
  const sans = fenetre({id: 3, prenom: "Rania", parcours: RANIA});
  sans.f.ouvrirParcoursAnzan(sans.lu);
  assert.equal(sans.$("pa-grade").hidden, true, "pas de ligne sans étape réussie");
});

test("grades : des séances de l'ancienne grille (numéros de grade 1 à 53, clés gradeReussi et gradeColonne) ne se lisent plus — ni grade, ni ligne, ni erreur", () => {
  const ancien = parcoursDe(RANIA_SEANCES.concat([
    S(13, "2026-11-07", "grade", "plus", 1, 1, 3, 1, 10, 10, 9),
    S(14, "2026-11-08", "grade", "plus", 1, 1, 5, 41, 10, 10, 9)]));
  ancien.gradeReussi = 12;
  ancien.gradeColonne = 5;
  const lu = ANZAN.resumeProf(ancien);
  assert.equal(lu.grade, 0);
  assert.equal(lu.gradeColonne, 0);
  assert.equal(lu.enCours, "");
  assert.equal(lu.texteGrade, "");
  assert.equal(lu.seances, RANIA_SEANCES.length, "les séances libres restent, celles de l'ancienne grille partent");
  const liste = classe405();
  liste[2].parcours = ancien;
  assert.deepEqual(cellules(ongletAnzan(liste).lignes[0])[1].children.filter(n => n.tag === "small"), []);
});
