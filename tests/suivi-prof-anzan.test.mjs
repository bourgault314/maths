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

const SOURCES_TABLEAU = ["nomAffiche", "dateLisible", "celluleNomTexte", "celluleDate", "boutonGeste", "menuGestes", "poserGestes",
  "jourCourt", "dessinerTableauAnzan", "resumeDeLaClasse", "lireAnzan", "parLaClasse", "elevesDeLOnglet", "voitLOnglet", "aDuTravail",
  "finirOnglet", "accesDe"].map(n => fonction(n)).join("\n");

function ongletAnzan(liste, options = {}) {
  const {zones, $} = creerZones();
  const corps = new Noeud("tbody");
  const messages = [];
  const ouverts = [];
  const moteur = options.sansMoteur ? null : ANZAN;
  const classe = options.classe || {id: 7, libelle: "405", applis: ["defi-tables", "splat"], reglages: {}};
  const fabrique = new Function("document", "$", "ANZAN", "droitClasse", "messager", "dessinerPapier", "revenirA", "placerMenu",
    "classe", "appliAffichee", "ouvrirParcoursAnzan",
    `let eleves = [];\n${SOURCES_TABLEAU}\nreturn {poser: l => { eleves = l; }, lireAnzan, dessinerTableauAnzan, elevesDeLOnglet, finirOnglet};`);
  const f = fabrique(document, $, moteur, options.droit || "proprietaire", (id, t, type) => messages.push({id, t, type}),
    () => {}, () => {}, () => {}, classe, "flash-anzan", eleve => ouverts.push(eleve.prenom));
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

test("onglet Anzan, appli donnée à Rania seule : sa ligne seulement — « 106 calculs », « 10 jours », le jour de la dernière séance, « Parcours » ; la ligne du haut le dit", () => {
  const {lignes, zones, ouverts} = ongletAnzan(classe405());
  assert.equal(lignes.length, 1, "la classe n'a pas Anzan : seuls les élèves qui l'ont en plus");
  const [rania] = lignes;
  const calculs = RANIA_SEANCES.reduce((somme, s) => somme + s[8], 0);
  const jours = new Set(RANIA_SEANCES.map(s => s[0])).size;
  assert.deepEqual(cellules(rania).slice(0, 4).map(td => td.textContent), ["Rania", `${calculs} calculs`, `${jours} jours`, "23 oct. 2026"]);
  assert.equal(cellules(rania)[1].premier(n => n.tag === "b").textContent, `${calculs} calculs`, "le compte en gras");
  assert.deepEqual(cellules(rania).map(td => td.dataset.libelle), ["", "Calculs", "Jours", "Dernière séance", ""], "les libellés au téléphone");
  const bouton = cellules(rania)[4].premier(n => n.tag === "button");
  assert.equal(bouton.textContent, "Parcours");
  bouton.cliquer();
  assert.deepEqual(ouverts, ["Rania"]);
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
  assert.deepEqual(cellules(lignes[0]).slice(0, 4).map(td => [td.textContent, td.className]), [["Alice", "nom"], ["—", "sans"], ["—", "sans"], ["—", "sans"]]);
  assert.deepEqual(cellules(lignes[1]).slice(1, 4).map(td => td.textContent), ["5 calculs", "1 jour", "22 oct. 2026"]);
  assert.equal(zones.get("resume-classe").textContent, "3 élèves · 1 n’a encore rien fait");
});

test("un élève qui n'a plus Anzan en plus mais y a du travail reste dans l'onglet ; un élève de la classe qui ne l'a pas n'y est pas", () => {
  const liste = classe405();
  liste[0].maj_le = "2026-10-20T07:00:00Z";
  liste[0].parcours = LUCAS;
  const {lignes} = ongletAnzan(liste);
  assert.deepEqual(lignes.map(tr => cellules(tr)[0].textContent), ["Alice", "Rania"]);
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

test("sans moteur : l'onglet le dit, les lignes restent lisibles, pas de « Parcours »", () => {
  const {lignes, messages} = ongletAnzan(classe405(), {sansMoteur: true});
  assert.equal(lignes.length, 1);
  assert.deepEqual(cellules(lignes[0]).slice(1, 4).map(td => td.textContent), ["—", "—", "—"]);
  assert.equal(cellules(lignes[0])[4].premier(n => n.tag === "button" && n.textContent === "Parcours"), null);
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
  assert.deepEqual(cellules(lignes[0]).slice(1, 3).map(td => td.textContent), ["30 calculs", "2 jours"],
    "les faits bornés aux calculs prévus, le mode inventé jeté");
});

// ------------------------------------------------------------ « Le parcours de Rania »

const SOURCES_FENETRE = ["prenomCourt", "seElide", "deNom", "jourAnzan", "reglagesAnzan", "parcoursAnzanDe",
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
    `let parcoursAnzanEleve = null;\nlet parcoursAnzanAffiches = 10;\nlet numeroImpression = 0;\n${constante("MODES_IMPRESSION")}\n${SOURCES_FENETRE.replace(/aujourdhui = new Date\(\)/, "aujourdhui = maintenant")}\n`
    + "return {ouvrirParcoursAnzan, plusDeSeancesAnzan, fermerParcoursAnzan, imprimerParcoursAnzan, parcoursAnzanDe, reglagesAnzan, jourAnzan, eleve: () => parcoursAnzanEleve};")(
    doc, $, options.sansMoteur ? null : ANZAN, {id: 7}, fenetreNav, () => 0, options.aujourdhui || AUJOURDHUI);
  // Le lecteur de la page (lireAnzan), le vrai : resumeProf + historique.
  const lireAnzan = new Function("ANZAN", `${fonction("lireAnzan")}\nreturn lireAnzan;`)(ANZAN);
  const lu = Object.assign({}, eleve, {lu: lireAnzan(eleve.parcours)});
  return {zones, $, f, lu, classes, impressions, ecouteurs};
}

test("« Parcours » : le titre, la phrase du compte, les dix dernières séances (la plus récente en haut) — jour, mode, réglages, score, « arrêtée » ; « sur 12 » dessous", () => {
  const r = fenetre({id: 3, prenom: "Rania", parcours: RANIA});
  r.f.ouvrirParcoursAnzan(r.lu);
  const boite = r.$("parcours-anzan");
  assert.equal(boite.open, true);
  assert.equal(r.$("pa-titre").textContent, "Le parcours de Rania");
  assert.equal(r.$("pa-compte").textContent, ANZAN.texteResume(RANIA), "la phrase de la tuile, rendue par le moteur");
  assert.match(r.$("pa-compte").textContent, /^\d+ calculs · \d+ jours d’entraînement$/);
  const items = r.$("pa-liste").children;
  assert.equal(items.length, 10);
  // Les espaces insécables du noyau (« 10 nombres ») se lisent ici comme des espaces.
  const propre = span => span.enfants.filter(e => e.tag === "#texte").map(e => e._texte).join("");
  const sp = x => x.replace(/\u00a0/g, " ");
  const lu = li => li.children.map(span => (span.children.length
    ? [propre(span), ...span.children.map(x => sp(x.textContent))].filter(Boolean) : span.textContent));
  assert.deepEqual(lu(items[0]), ["23 oct.", ["⚡ Flash", "+ et − · 2 à 3 chiffres · 10 nombres · 0,8 s"], ["0/2", "arrêtée"]],
    "la plus récente en haut (le plus grand ORDRE, même avec le plus petit identifiant)");
  assert.deepEqual(lu(items[2]), ["22 oct.", ["⚡ Flash", "2 à 3 chiffres · 10 nombres · 0,8 s"], "8/10"]);
  assert.deepEqual(lu(items[3]), ["21 oct.", ["📝 Colonne", "+ et − · 3 chiffres · 8 nombres · 20 s"], "10/10"]);
  assert.deepEqual(lu(items[5]), ["20 oct.", ["⚡ Flash", "2 chiffres · 10 nombres · 1 s"], ["6/7", "arrêtée"]], "6/7 · arrêtée = 7 calculs faits sur 10 prévus");
  assert.deepEqual(lu(items[9]), ["15 oct.", ["📝 Colonne", "+ et − · 2 chiffres · 10 nombres"], "9/10"],
    "la dixième : les deux plus anciennes (12 et 13 oct.) ne sont pas montrées ; Colonne sans limite de temps");
  assert.equal(r.$("pa-note").textContent, "Les 10 dernières séances, sur 12.");
  assert.equal(r.$("pa-imprimer").hidden, false);
  assert.equal(items.some(li => li.premier(n => n.tag === "button")), false, "lecture seule : aucun bouton dans la liste");
  // Fermée : la fenêtre oublie tout.
  r.f.fermerParcoursAnzan();
  assert.equal(r.f.eleve(), null);
  assert.deepEqual(["pa-titre", "pa-compte", "pa-liste", "pa-note"].map(id => r.$(id).textContent), ["", "", "", ""]);
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

test("« Parcours » d'un élève sans séance, ou sans prénom : la phrase le dit, pas de liste, pas d'« Imprimer » ; « d’Alice » s'élide", () => {
  const vide = fenetre({id: 1, prenom: "Alice", parcours: null});
  vide.f.ouvrirParcoursAnzan(vide.lu);
  assert.equal(vide.$("pa-titre").textContent, "Le parcours d’Alice");
  assert.equal(vide.$("pa-compte").textContent, "Alice n’a pas encore fait de séance.");
  assert.equal(vide.$("pa-liste").hidden, true);
  assert.equal(vide.$("pa-note").textContent, "");
  assert.equal(vide.$("pa-imprimer").hidden, true);
  const anonyme = fenetre({id: 2, prenom: "", parcours: LUCAS});
  anonyme.f.ouvrirParcoursAnzan(anonyme.lu);
  assert.equal(anonyme.$("pa-titre").textContent, "Le parcours de cet élève");
  assert.equal(anonyme.$("pa-note").textContent, "", "une seule séance : pas de « sur … »");
  const sansMoteur = fenetre({id: 3, prenom: "Rania", parcours: RANIA}, {sansMoteur: true});
  sansMoteur.f.ouvrirParcoursAnzan(sansMoteur.lu);
  assert.equal(sansMoteur.$("parcours-anzan").open, false, "sans moteur, rien ne s'ouvre");
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
  assert.deepEqual(sortie.lignes[0], ["23 oct.", "⚡ Flash", "+ et − · 2 à 3 chiffres · 10 nombres · 0,8 s", "0/2 · arrêtée"]);
  assert.deepEqual(sortie.lignes[2], ["22 oct.", "⚡ Flash", "2 à 3 chiffres · 10 nombres · 0,8 s", "8/10"]);
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
  assert.match(constante("TRIS"), /"flash-anzan": \[\["prenom", "Prénom"\], \["calculs", "Calculs"\], \["date", "Dernière séance"\]\]/);
});

// ------------------------------------------------------------ la page

test("APPLIS, l'onglet, l'en-tête, le moteur chargé d'ICI à la première ouverture, la ligne des Réglages, « En plus pour »", () => {
  const APPLIS = new Function(`${constante("APPLIS")}\nreturn APPLIS;`)();
  assert.deepEqual(APPLIS[2], {cle: "flash-anzan", nom: "Anzan", unite: ["séance", "séances"]}, "après Coffres, comme au catalogue ; nom « Anzan »");
  assert.match(page, /<button type="button" data-appli="flash-anzan" aria-pressed="false">Anzan<\/button>/);
  const entete = page.slice(page.indexOf('<tr id="entete-anzan" hidden>'), page.indexOf("</tr>", page.indexOf('<tr id="entete-anzan"')));
  assert.deepEqual([...entete.matchAll(/<th>(?:<button type="button" data-tri="(\w+)">)?([^<]*)/g)].map(m => `${m[2]}${m[1] ? `:${m[1]}` : ""}`),
    ["Élève:prenom", "Calculs:calculs", "Jours", "Dernière séance:date", ""]);
  assert.match(page, /\$moteurAnzan = __DIR__ \. '\/flash_anzan_parcours\.js';\s*\$versionAnzan = is_file\(\$moteurAnzan\) \? substr\(md5_file\(\$moteurAnzan\), 0, 10\) : '0';/);
  assert.match(script, /const MOTEUR_ANZAN = "flash_anzan_parcours\.js\?v=<\?= htmlspecialchars\(\$versionAnzan, ENT_QUOTES\) \?>";/,
    "le moteur servi par le suivi (une adresse relative : jamais d'un autre domaine)");
  assert.doesNotMatch(page, /<script[^>]+flash_anzan_parcours/, "pas chargé d'office : seulement à l'ouverture de l'onglet");
  assert.match(fonction("chargerMoteurDe"), /if \(cle === "flash-anzan"\) return chargerMoteurAnzan\(\);/);
  assert.match(fonction("chargerMoteurAnzan"), /script\.src = MOTEUR_ANZAN;/);
  assert.match(fonction("elevesLus"), /cle === "flash-anzan" \? lireAnzan/);
  assert.match(fonction("dessinerTableau"), /if \(appliAffichee === "flash-anzan"\) \{ dessinerTableauAnzan\(corps, ecriture, lignes\); finirOnglet\(lignes\); return; \}/);
  assert.match(fonction("evalVisible"), /&& \(\(classe\.applis \|\| \[\]\)\.includes\("defi-tables"\)\)/,
    "un onglet Défi tables ouvert pour un élève en plus n'ouvre pas les évaluations de la classe");
  // ⚙ Réglages : la ligne Anzan après Coffres, sans réglage de classe, et sa ligne « En plus pour ».
  const activites = page.slice(page.indexOf('<div class="carte" id="liste-activites">'), page.indexOf('data-appli="splat"> <strong>SPLAT!'));
  assert.match(activites, /data-appli="coffres"[\s\S]*<label class="activite-tete"><input type="checkbox" data-appli="flash-anzan"> <strong>Anzan<\/strong><\/label>\s*<div class="en-plus-pour" id="en-plus-flash-anzan" hidden><\/div>\s*<\/div>/);
  assert.doesNotMatch(page, /data-appli="flash-anzan" checked/, "décochée par défaut : la case suit la liste de la classe");
  // Déconnexion : tout ce qui porte un prénom est vidé, la fenêtre fermée.
  const zones = new Function(`${constante("ZONES_TEXTE")}\nreturn ZONES_TEXTE;`)();
  for (const id of ["en-plus-flash-anzan", "pa-titre", "pa-compte", "pa-liste", "pa-note", "fa-titre", "fa-compte", "fa-corps", "fa-note"]) {
    assert.ok(zones.includes(id), `${id} vidé à la déconnexion`);
  }
  assert.match(fonction("viderZones"), /"voit", "parcours-anzan"\]\.forEach/);
  assert.match(fonction("oublierEtat"), /parcoursAnzanEleve = null;/);
  assert.match(script, /\$\("parcours-anzan"\)\.addEventListener\("close", fermerParcoursAnzan\);/);
  assert.match(script, /\$\("pa-imprimer"\)\.addEventListener\("click", imprimerParcoursAnzan\);/);
});

test("la fenêtre et la feuille : le HTML, le logo et la signature en pied ; à l'impression, la feuille seule", () => {
  assert.match(page, /<dialog id="parcours-anzan" class="voit parcours-anzan" aria-labelledby="pa-titre">/);
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
     const detailsOuverts = new Set();
     const $ = () => ({textContent: "", hidden: false});
     let jeton = etat.jeton;
     function chargerMoteurDe() { return Promise.resolve(null); }
     function elevesLus(cle, liste) { return (liste || []).map(e => Object.assign({}, e, {lu: {}})); }
     function messager() {} function surErreur(e) { poses.push("erreur " + e.message); }
     function montrer(ecran) { poses.push("montrer " + ecran); }
     function appliquerDroits() {} function poserAppli() { poses.push("onglets"); } function dessinerTableau() { poses.push("tableau"); }
     function lireChoixAppli() { return ""; } function retenirChoixAppli() {} function lireSplat() { return {}; } function poserOnglets() { poses.push("onglets"); return []; }
     const redessin = {demander() { poses.push("tableau"); }};
     ${["lesApplisConnues", "applisDeLaClasse", "applisAMontrer", "appliAMontrer", "reporterAccesDeLaListe", "ouvrirClasse", "afficherAppli"].map(n => fonction(n)).join("\n")}
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

test("lot 4b-bis — afficherAppli : la liste fraîche sans personne pour Anzan → l'activité affichée ne change pas, l'accès est reporté, l'onglet part, un message le dit", async () => {
  const poses = [];
  const messages = [];
  const tableaux = {"defi-tables": [{id: 1, prenom: "Rania", acces: {applis: ["defi-tables", "flash-anzan"], reglages: {}}, lu: {}}]};
  const f = new Function("tableaux", "poses", "messages", "APPLIS",
    `let classe = {id: 7, applis: ["defi-tables"]}, eleves = tableaux["defi-tables"], appliAffichee = "defi-tables", demandeAppli = 0, jeton = "x";
     function chargerMoteurDe() { return Promise.resolve(null); }
     async function api() { return {eleves: [{id: 1, prenom: "Rania", acces: {applis: ["defi-tables"], reglages: {}}}]}; }
     function elevesLus(cle, liste) { return liste.map(e => Object.assign({}, e, {lu: {}})); }
     function messager(id, t, type) { messages.push([id, t, type]); } function surErreur(e) { throw e; }
     function poserAppli() { poses.push("poserAppli"); } function poserOnglets() { poses.push("onglets " + applisAMontrer().join(",")); return applisAMontrer(); }
     function retenirChoixAppli() {} function lireSplat() { return {}; } const redessin = {demander() { poses.push("tableau"); }};
     ${["lesApplisConnues", "applisDeLaClasse", "applisAMontrer", "reporterAccesDeLaListe", "afficherAppli"].map(n => fonction(n)).join("\n")}
     return {afficherAppli, etat: () => ({appliAffichee, eleves})};`)(
    tableaux, poses, messages, [{cle: "defi-tables", nom: "Défi tables"}, {cle: "flash-anzan", nom: "Anzan"}]);
  await f.afficherAppli("flash-anzan");
  assert.equal(f.etat().appliAffichee, "defi-tables", "on reste sur Défi tables");
  assert.deepEqual(tableaux["defi-tables"][0].acces.applis, ["defi-tables"], "l'accès frais est reporté sur la liste déjà lue");
  assert.deepEqual(poses, ["onglets defi-tables"], "l'onglet Anzan part ; rien d'autre n'est redessiné");
  assert.deepEqual(messages.at(-1), ["message-appli", "Anzan n’est plus ouvert à aucun élève de cette classe.", "info"]);
});

test("lot 4b-bis — supprimer le dernier élève qui avait Anzan : son onglet part, et on quitte l'onglet s'il était affiché", async () => {
  const appels = [];
  const f = new Function("appels",
    `let eleves = [{id: 1, prenom: "Rania"}], appliAffichee = "flash-anzan";
     async function demander() { return true; } async function api(a) { appels.push(a); return {ok: true}; }
     function nomAffiche(e) { return e.prenom; } function reporterEleve() {} const redessin = {demander() {}};
     function messager() {} function surErreur(e) { throw e; }
     function poserOnglets() { appels.push("onglets"); return ["defi-tables"]; } function afficherAppli(cle) { appels.push("afficher " + cle); }
     ${fonction("supprimerEleve")}
     return supprimerEleve;`)(appels);
  await f({id: 1, prenom: "Rania"});
  assert.deepEqual(appels, ["eleves.supprimer", "onglets", "afficher defi-tables"]);
});

test("lot 4b-bis — des réglages Anzan enregistrés sans un calcul ne comptent pas comme du travail (onglet « en plus » et « tout le monde a commencé »)", () => {
  const reglagesSeuls = {version: 1, epoque: 0, reglages: {mode: "flash", rang: 1}, seances: {}};
  // Lucas : plus d'accès, des réglages seulement → pas dans l'onglet ; Rania : son accès et ses séances.
  const liste = [
    {prenom: "Lucas", parcours: reglagesSeuls, maj_le: "2026-10-22T07:00:00Z", acces: ACCES_CLASSE},
    {prenom: "Rania", parcours: RANIA, maj_le: "2026-10-23T09:00:00Z", acces: ACCES_RANIA}
  ];
  const {lignes, zones} = ongletAnzan(liste);
  assert.deepEqual(lignes.map(tr => cellules(tr)[0].textContent), ["Rania"]);
  assert.equal(zones.get("resume-classe").textContent, "1 élève · en plus de la classe, qui n’a pas cette activité");
  // Anzan ouvert à toute la classe : Lucas n'a « encore rien fait ».
  const tous = ongletAnzan(liste.map(e => Object.assign({}, e, {acces: ACCES_RANIA})),
    {classe: {id: 7, libelle: "405", applis: ["defi-tables", "flash-anzan", "splat"], reglages: {}}});
  assert.equal(tous.zones.get("resume-classe").textContent, "2 élèves · 1 n’a encore rien fait");
});

test("lot 4b-bis — une impression à la fois : la feuille des codes, sans « afterprint », ne sort pas avec le parcours Anzan ; son filet de 60 s ne touche pas l'impression suivante", () => {
  const {$} = creerZones();
  const classes = new Set();
  const minuteurs = [];
  const sorties = [];
  const fenetreNav = {addEventListener() {}, removeEventListener() {}, print: () => sorties.push([...classes].sort())};
  const doc = Object.assign({}, document, {body: {classList: {add: c => classes.add(c), remove: c => classes.delete(c)}}});
  const r = new Function("document", "$", "window", "setTimeout", "ANZAN",
    `let droitClasse = "proprietaire", classe = {id: 7}, parcoursAnzanEleve = null, parcoursAnzanAffiches = 10, numeroImpression = 0;
     ${constante("MODES_IMPRESSION")}
     function dessinerBandelettes() {} function dessinerPapier() {}
     ${["prenomCourt", "seElide", "deNom", "jourAnzan", "reglagesAnzan", "parcoursAnzanDe", "quitterImpressions", "imprimer", "imprimerParcoursAnzan"].map(n => fonction(n)).join("\n")}
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
