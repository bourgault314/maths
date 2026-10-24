import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

// Lot « splat-suivi-4 » (08/10/2026) — SPLAT! dans « Ma classe ».
//
// La page prof montre une activité à la fois : un choix « Défi tables |
// SPLAT! » sous le nom de la classe (seulement s'il y a le choix), un onglet
// SPLAT! (six pastilles de monde, étapes réussies, ✨ Bonus, Détail, carte de
// classe), et « Activités de la classe » pour cocher SPLAT! (propriétaire).
//
// Ces tests EXÉCUTENT les fonctions de la page, telles qu'elles y sont
// écrites, avec le VRAI moteur servi par le serveur (prof/splat-parcours.js)
// et un document de poche. Le reste (le vrai navigateur, le vrai serveur) est
// joué par le banc du lot : voir la notice.
//
// Sabotages attendus (chacun rend au moins un test rouge) : voir
// splat-suivi-lot-4-sabotages.py dans le dossier du lot.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = chemin => readFileSync(join(racine, chemin), "utf8");
const page = lire("_serveur/public/prof/index.php");
const espace = lire("_serveur/public/index.php");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne de la page prof doit être trouvé");
  return page.slice(debut, fin);
})();
const SPLAT = createRequire(import.meta.url)(join(racine, "_serveur/public/prof/splat-parcours.js"));

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

function fonction(nom) {
  const motif = new RegExp(`(?:async )?function ${nom}\\(`);
  const m = motif.exec(script);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(script, m.index);
}

function constante(nom) {
  const position = script.indexOf(`const ${nom} = `);
  assert.ok(position > 0, `la page doit définir ${nom}`);
  const debut = position + `const ${nom} = `.length;
  let i = debut, profondeur = 0, dansTexte = "";
  for (; i < script.length; i += 1) {
    const c = script[i];
    if (dansTexte) { if (c === dansTexte && script[i - 1] !== "\\") dansTexte = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { dansTexte = c; continue; }
    if ("[{(".includes(c)) profondeur += 1;
    else if ("]})".includes(c)) profondeur -= 1;
    else if (c === ";" && profondeur === 0) break;
  }
  return script.slice(position, i + 1);
}

// La partie SPLAT! du script : de « l'onglet SPLAT! » à « feuille imprimée ».
const sectionSplat = script.slice(script.indexOf("// ---------------------------------------------------------------- l'onglet SPLAT!"),
  script.indexOf("// ---------------------------------------------------------------- feuille imprimée"));

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
  append(...noeuds) {
    noeuds.forEach(n => { const x = typeof n === "string" ? texte(n) : n; x.parent = this; this.enfants.push(x); });
  }
  appendChild(n) { this.append(n); return n; }
  after(n) {
    if (!this.parent) return;
    const i = this.parent.enfants.indexOf(this);
    n.parent = this.parent;
    this.parent.enfants.splice(i + 1, 0, n);
  }
  remove() {
    if (!this.parent) return;
    this.parent.enfants.splice(this.parent.enfants.indexOf(this), 1);
    this.parent = null;
  }
  setAttribute(k, v) { this.attributs[k] = String(v); if (k === "class") this.className = String(v); }
  getAttribute(k) { return k === "class" ? this.className : this.attributs[k]; }
  addEventListener(type, f) { (this.ecouteurs[type] = this.ecouteurs[type] || []).push(f); }
  cliquer() { (this.ecouteurs.click || []).forEach(f => f()); }
  tous(predicat, sortie = []) {
    this.enfants.forEach(e => { if (predicat(e)) sortie.push(e); e.tous(predicat, sortie); });
    return sortie;
  }
  premier(predicat) { return this.tous(predicat)[0] || null; }
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

const M1 = ["m1e1", "m1e2", "m1e3", "m1e4", "m1e5", "m1e6"];
const M2 = ["m2e1", "m2e4", "m2e5"];
const ENQ = Array.from({length: 15}, (_, i) => `enq${i + 10}`);
const SYS = ["sys25", "sys26", "sys27", "sys28"];
const M5 = ["m3e1", "m3e2", "m3e4"];
const ECH = ["ech1", "ech2", "ech3"];  // l'échauffement du monde 6, É1-É3 (14/10/2026)
const M6 = ["m4e1", "m4e2", "m4e3", "m4e4", "m4e5", "m4e6"];
const etape = (fait, vues = 0, idx = 0) => Object.assign({fait, etoiles: 3, cartes: 4, vues, essais: 1, date: "2026-10-05"}, idx ? {idx} : {});
const faits = (liste, vues = []) => Object.fromEntries(liste.map(id => [id, etape(true, vues.includes(id) ? 1 : 0)]));
const parcours = etapes => ({version: 1, epoque: 0, etapes});

const LEA = parcours({...faits(M1), ...faits(M2), ...faits(ENQ.slice(0, 4), ["enq11"]), enq14: etape(false, 0, 3), enq11d: etape(true)});
const MAELYS = parcours({...faits([...M1, ...M2, ...ENQ, ...SYS, ...M5, ...ECH, ...M6]), ...faits(SPLAT.CARTE.BONUS.map(b => b[0]))});
const TOM = parcours({m1e1: etape(false, 0, 5)});

// ------------------------------------------------------------ la page, exécutée

const SOURCES_TABLEAU = ["nomAffiche", "dateLisible", "celluleNomTexte", "celluleDate", "boutonGeste", "menuGestes", "poserGestes",
  "elementSvg", "pastilleMonde", "ligneDetailSplat", "dessinerTableauSplat", "objectifSplat",
  "dessinerObjectifSplat", "resumeDeLaClasse", "lireSplat", "mondesOuverts", "mondesDeLEleve"].map(fonction).join("\n");
const CONSTANTES = ["COULEURS_MONDES", "ETATS_MONDE", "GRIS_FERME", "CASES_ETAPE", "SVG", "NOMBRE_MONDES"].map(constante).join("\n");

function ongletSplat(liste, options = {}) {
  const {zones, $} = creerZones();
  const corps = new Noeud("tbody");
  const messages = [];
  const etat = {detailsOuverts: options.detailsOuverts || new Set()};
  const moteur = options.sansMoteur ? null : SPLAT;
  // Lot « splat-suivi-5 » : la classe ouverte porte ses réglages (les mondes ouverts).
  const fabrique = new Function("document", "$", "SPLAT", "droitClasse", "detailsOuverts", "messager",
    "dessinerPapier", "nommer", "revenirA", "regenerer", "supprimerEleve", "placerMenu", "classe",
    `${CONSTANTES}\nlet eleves = [];\n${SOURCES_TABLEAU}\nreturn {poser: liste => { eleves = liste; }, lireSplat, dessinerTableauSplat, objectifSplat};`);
  const f = fabrique(document, $, moteur, options.droit || "proprietaire", etat.detailsOuverts,
    (id, t, type) => messages.push({id, t, type}), () => {}, () => {}, () => {}, () => {}, () => {}, () => {},
    {id: 7, libelle: "405", reglages: options.reglages || {}});
  const eleves = liste.map((e, i) => Object.assign({id: i + 1, code: `CODE0${i}`, initiale: "", restaurable: false, journees: []},
    e, {lu: f.lireSplat(e.parcours, e)}));
  f.poser(eleves);
  f.dessinerTableauSplat(corps, (options.droit || "proprietaire") !== "lecture");
  const lignes = corps.children.filter(tr => !aClasse(tr, "detail"));
  return {zones, corps, lignes, messages, eleves, f, etat};
}

const classe8 = () => [
  {prenom: "Léa", parcours: LEA, maj_le: "2026-10-07T07:40:00Z"},
  {prenom: "Maëlys", parcours: MAELYS, maj_le: "2026-10-07T12:00:00Z"},
  {prenom: "Tom", parcours: TOM, maj_le: "2026-10-05T08:00:00Z"},
  {prenom: "Yanis", parcours: null, maj_le: null},
];

const cellules = tr => tr.children;
// Les colonnes de l'onglet SPLAT! (sans la colonne Code depuis le lot « Ma classe : élèves »).
const C_ETAPES = 2, C_DATE = 3, C_GESTES = 4;
const COULEUR = n => ({1: "#d9690c", 2: "#0b67b2", 3: "#be185d", 4: "#92400e", 5: "#08857f", 6: "#7b42b4"})[n];
const pastilles = tr => tr.tous(n => n.tag === "svg");
const etatPastille = svg => svg.className.replace("monde-p ", "");

test("l'onglet SPLAT! : six pastilles, les étapes sur 40, ✨ pour les Bonus, « Détail » et « ⋯ » — plus de « Fiche »", () => {
  const {lignes} = ongletSplat(classe8());
  assert.equal(lignes.length, 4);
  // Lot « Ma classe : élèves » (18/10/2026) : plus de colonne Code, le prénom en texte.
  lignes.forEach(tr => assert.equal(cellules(tr).length, 5, "Élève · Mondes · Étapes réussies · Dernière activité · gestes"));
  lignes.forEach(tr => {
    assert.equal(cellules(tr)[0].children.length, 0, "le prénom est du texte, pas un champ");
    assert.ok(!cellules(tr).some(c => aClasse(c, "code")), "aucune cellule de code");
  });
  assert.deepEqual(lignes.map(tr => cellules(tr)[0].textContent), ["Léa", "Maëlys", "Tom", "Yanis"]);
  const [lea, maelys, tom, yanis] = lignes;
  assert.deepEqual(pastilles(lea).map(etatPastille), ["fini", "fini", "cours", "vide", "vide", "vide"]);
  assert.deepEqual(pastilles(maelys).map(etatPastille), Array(6).fill("fini"));
  assert.deepEqual(pastilles(tom).map(etatPastille), ["cours", "vide", "vide", "vide", "vide", "vide"], "une série en cours met le monde à moitié");
  assert.deepEqual(pastilles(yanis).map(etatPastille), Array(6).fill("vide"), "rien fait : six mondes vides");
  const compte = tr => cellules(tr)[C_ETAPES].premier(n => aClasse(n, "pastille")).textContent;
  const bonus = tr => (cellules(tr)[C_ETAPES].premier(n => aClasse(n, "bonus-compte")) || {textContent: ""}).textContent;
  assert.equal(compte(lea), "13 / 40");
  assert.equal(bonus(lea), "✨ 1", "les Bonus comptés à part (Q3)");
  assert.equal(compte(maelys), "40 / 40");
  assert.equal(bonus(maelys), "✨ 14");
  assert.equal(compte(tom), "0 / 40");
  assert.equal(bonus(tom), "", "pas de ✨ 0");
  assert.equal(compte(yanis), "0 / 40");
  assert.ok(aClasse(cellules(lea)[C_ETAPES].children[0], "p-vert") && aClasse(cellules(yanis)[C_ETAPES].children[0], "p-gris"));
  assert.equal(cellules(yanis)[C_DATE].textContent, "rien fait");
  lignes.forEach(tr => {
    const boutons = cellules(tr)[C_GESTES].children.filter(n => n.tag === "button").map(b => b.textContent);
    assert.deepEqual(boutons, ["Détail ▾"], "« Détail » à la place de « Fiche »");
    assert.equal(cellules(tr)[C_GESTES].premier(n => n.tag === "details"), null,
      "sans version à restaurer, pas de « ⋯ » : Nouveau code et Supprimer sont dans l'onglet Élèves");
  });
  // Une version à restaurer : le « ⋯ » ne contient que « Revenir à… ».
  const {lignes: avecVersion} = ongletSplat([{prenom: "Léa", parcours: LEA, restaurable: true}]);
  const menu = cellules(avecVersion[0])[C_GESTES].premier(n => n.tag === "details");
  assert.ok(menu, "« ⋯ » pour l'élève qui a une version à restaurer");
  assert.deepEqual(menu.tous(n => n.tag === "button").map(b => b.textContent), ["Revenir à…"]);
  assert.equal(SPLAT.CARTE.ETAPES.length, 40, "le total vient du moteur, jamais écrit dans la page");
  assert.doesNotMatch(sectionSplat, /\b37\b|\b40\b/, "aucun total écrit en dur");
});

test("la pastille : le dessin de l'espace élève, et « Monde 3 · SPLAT! Enquête : 4 / 15 » au survol", () => {
  const {lignes} = ongletSplat(classe8());
  const titres = pastilles(lignes[0]).map(svg => svg.premier(n => n.tag === "title").textContent);
  assert.deepEqual(titres, ["Monde 1 · Petit SPLAT! : 6 / 6", "Monde 2 · SPLAT! Classique : 3 / 3",
    "Monde 3 · SPLAT! Enquête : 4 / 15", "Monde 4 · SPLAT! Système : 0 / 4", "Monde 5 · SPLAT! Équations : 0 / 3",
    "Monde 6 · SPLAT! Relatifs : 0 / 9"]);
  // Le même dessin que la tuile de l'espace élève (homogénéité) : mêmes
  // couleurs, même rond, même moitié, même chiffre (centré au quart de pixel).
  const dessinEspace = blocDepuis(espace, espace.indexOf("function pastilleMonde("));
  const dessinPage = fonction("pastilleMonde");
  [/elementSvg\("circle", \{cx: "12", cy: "12", r: "11", fill: etat === "fini" \? couleur : "#fff",\s*stroke: couleur, "stroke-width": "2"\}\)/,
   /\{d: "M12 1A11 11 0 0 0 12 23Z", fill: couleur\}/,
   /\{x: "12", y: "16\.375", "text-anchor": "middle", "font-size": "12\.5",\s*"font-weight": "800", fill: etat === "vide" \? couleur : "#fff"\}/,
   /chiffre\.setAttribute\("paint-order", "stroke"\);/].forEach(motif => {
    assert.match(dessinEspace, motif, "repère dans l'espace élève");
    assert.match(dessinPage, motif, "le même dessin dans Ma classe");
  });
  const couleurs = src => src.slice(src.indexOf("const COULEURS_MONDES"), src.indexOf(";", src.indexOf("const COULEURS_MONDES")));
  assert.equal(couleurs(script), couleurs(espace), "les couleurs des mondes : celles de la tuile et de la carte");
  const moitie = pastilles(lignes[0])[2];
  const chiffre = moitie.premier(n => n.tag === "text");
  assert.equal(chiffre.attributs.fill, "#fff", "sur la moitié, le chiffre est blanc…");
  assert.equal(chiffre.attributs.stroke, COULEUR(3), "… cerné de la couleur du monde");
});

test("le Détail : une rangée par monde, les Bonus à part, la légende — et il se replie", () => {
  const {corps, lignes, etat} = ongletSplat(classe8());
  const bouton = cellules(lignes[0])[C_GESTES].children[0];
  bouton.cliquer();
  assert.equal(bouton.textContent, "Replier ▴");
  assert.equal(bouton.attributs["aria-expanded"], "true");
  assert.ok(etat.detailsOuverts.has(1), "Léa (id 1) est retenue comme dépliée");
  const detail = corps.children[1];
  assert.ok(aClasse(detail, "detail"), "le Détail se déplie JUSTE sous la ligne de l'élève");
  assert.equal(detail.children[0].colSpan, 5, "toute la largeur : cinq colonnes depuis le lot « Ma classe : élèves »");
  const rangees = detail.tous(n => aClasse(n, "detail-monde"));
  assert.deepEqual(rangees.map(r => r.children[0].textContent), ["Monde 1 · Petit SPLAT!", "Monde 2 · SPLAT! Classique",
    "Monde 3 · SPLAT! Enquête", "Monde 4 · SPLAT! Système", "Monde 5 · SPLAT! Équations", "Monde 6 · SPLAT! Relatifs",
    "✨ Bonus du monde 3", "✨ Bonus du monde 4"]);
  const cases = r => Object.fromEntries(r.children.slice(1).map(c => [c.textContent, c.className]));
  const m3 = cases(rangees[2]);
  assert.equal(Object.keys(m3).join(","), "10,11,12,13,14,15,16,17,18,19,20,21,22,23,24", "les numéros de la carte");
  assert.equal(m3["10"], "et ok", "réussie : vert");
  assert.equal(m3["11"], "et aide", "réussie avec une réponse vue : orange");
  assert.equal(m3["14"], "et cours", "en cours : pointillés");
  assert.equal(m3["15"], "et", "pas encore faite : blanc");
  assert.equal(Object.keys(cases(rangees[4])).join(","), "35,36,37");
  // (dans l'ordre des cases : Object.keys rangerait « 38 » avant « É1 »)
  assert.equal(rangees[5].children.slice(1).map(c => c.textContent).join(","), "É1,É2,É3,38,39,40,41,42,43",
    "l'échauffement avant la 38, la 38 reste la 38");
  const b3 = cases(rangees[6]);
  assert.equal(b3["11d"], "et bonus ok", "un Bonus réussi : doré");
  assert.equal(b3["12d"], "et bonus");
  assert.equal(Object.keys(cases(rangees[7])).join(","), "25d,26d,27d,28d");
  assert.deepEqual(detail.premier(n => aClasse(n, "legende-detail")).children.map(s => s.textContent),
    ["réussie", "réussie avec des réponses vues", "en cours", "pas encore faite", "bonus"]);
  bouton.cliquer();
  assert.equal(bouton.textContent, "Détail ▾");
  assert.ok(!corps.children.some(tr => aClasse(tr, "detail")), "replié : la rangée part");
  assert.equal(etat.detailsOuverts.size, 0);
});

// Échauffement du monde 6 (14/10/2026, décision de Gwenaël : « dans le total »).
test("échauffement : É1-É3 comptent au monde 6 ; un élève qui l'avait fini passe à 6 / 9, à moitié", () => {
  const ancien = parcours(faits(M6));
  const echauffe = parcours({...faits(M6), ...faits(["ech1"])});
  const {corps, lignes} = ongletSplat([{prenom: "Inès", parcours: ancien}, {prenom: "Noé", parcours: echauffe}]);
  const compte = tr => cellules(tr)[C_ETAPES].premier(n => aClasse(n, "pastille")).textContent;
  assert.deepEqual(lignes.map(compte), ["6 / 40", "7 / 40"]);
  assert.deepEqual(lignes.map(tr => etatPastille(pastilles(tr)[5])), ["cours", "cours"]);
  assert.deepEqual(lignes.map(tr => pastilles(tr)[5].premier(n => n.tag === "title").textContent),
    ["Monde 6 · SPLAT! Relatifs : 6 / 9", "Monde 6 · SPLAT! Relatifs : 7 / 9"]);
  cellules(lignes[1])[C_GESTES].children[0].cliquer();
  const m6 = corps.children[2].tous(n => aClasse(n, "detail-monde"))[5];
  assert.deepEqual(m6.children.slice(1).map(c => [c.textContent, c.className]).slice(0, 4),
    [["É1", "et ok"], ["É2", "et"], ["É3", "et"], ["38", "et ok"]]);
});

test("un Détail déplié le reste quand le tableau est redessiné (tri, saisie)", () => {
  const {corps} = ongletSplat(classe8(), {detailsOuverts: new Set([2])});
  const ordre = corps.children.map(tr => (aClasse(tr, "detail") ? "détail" : tr.children[0].textContent));
  assert.deepEqual(ordre, ["Léa", "Maëlys", "détail", "Tom", "Yanis"]);
});

test("la carte de classe SPLAT! : les étapes de tout le monde, les mondes finis — personne n'est nommé", () => {
  const {zones} = ongletSplat(classe8());
  assert.equal(zones.get("objectif").hidden, false);
  assert.equal(zones.get("objectif-compte").textContent, "Ensemble : 53 étapes réussies sur 160", "13 + 40 + 0 + 0, sur 4 élèves × 40");
  assert.equal(zones.get("objectif-lignes").textContent,
    "Monde 1 fini par 2 élèves · monde 2 par 2 · monde 3 par 1 · monde 4 par 1 · monde 5 par 1 · monde 6 par 1");
  assert.equal(zones.get("objectif-barre").style.width, "33%");
  const tout = [...zones.values()].map(z => z.textContent).join(" ");
  ["Léa", "Maëlys", "Tom", "Yanis", "CODE0"].forEach(interdit => assert.ok(!tout.includes(interdit), `« ${interdit} » dans la carte de classe`));
  assert.doesNotMatch(fonction("objectifSplat") + fonction("dessinerObjectifSplat"), /\bapi\(|fetch\(/, "rien de plus demandé au serveur");
});

test("la carte de classe se tait tant qu'aucune étape n'est réussie — séries en cours et Bonus seuls compris", () => {
  const cachee = liste => ongletSplat(liste).zones.get("objectif").hidden;
  assert.equal(cachee([]), true, "classe vide");
  assert.equal(cachee([{prenom: "A", parcours: null}, {prenom: "B", parcours: null}]), true, "personne n'a commencé");
  assert.equal(cachee([{prenom: "A", parcours: TOM}]), true, "une série en cours n'est pas une étape réussie");
  assert.equal(cachee([{prenom: "A", parcours: parcours({enq11d: etape(true)})}]), true, "un Bonus seul non plus (Q3)");
  const un = ongletSplat([{prenom: "A", parcours: parcours({m1e1: etape(true)})}, {prenom: "B", parcours: null}]);
  assert.equal(un.zones.get("objectif").hidden, false);
  assert.equal(un.zones.get("objectif-compte").textContent, "Ensemble : 1 étape réussie sur 80", "au singulier");
  assert.equal(un.zones.get("objectif-lignes").textContent, "", "aucun monde fini : pas de ligne");
  const seul = ongletSplat([{prenom: "A", parcours: parcours(faits(M2))}]);
  assert.equal(seul.zones.get("objectif-lignes").textContent, "Monde 2 fini par 1 élève", "le premier monde cité prend la majuscule, au singulier");
});

test("sans moteur : l'onglet le dit, chaque ligne reste lisible, ni carte ni Détail", () => {
  const {lignes, messages, zones} = ongletSplat(classe8(), {sansMoteur: true});
  assert.equal(lignes.length, 4);
  lignes.forEach(tr => {
    assert.equal(cellules(tr)[C_ETAPES].textContent, "—");
    assert.deepEqual(cellules(tr)[C_GESTES].children.filter(n => n.tag === "button"), []);
  });
  assert.equal(zones.get("objectif").hidden, true);
  assert.ok(messages.some(m => m.id === "message-appli" && /prof\/splat-parcours\.js/.test(m.t) && m.type === "erreur"),
    "le message de l'activité, au-dessus de son tableau");
});

test("en lecture seule : pas de code, pas de saisie, pas de « ⋯ » vide", () => {
  const {lignes} = ongletSplat(classe8().map(e => ({...e, code: null, restaurable: true})), {droit: "lecture"});
  lignes.forEach(tr => {
    assert.equal(cellules(tr).length, 5, "pas de colonne Code");
    assert.equal(cellules(tr)[0].tous(n => n.tag === "input").length, 0, "pas de champ de saisie");
    assert.equal(cellules(tr)[C_GESTES].premier(n => n.tag === "details"), null, "même avec une version : « Revenir à… » est en écriture");
  });
});

test("c'est le moteur qui lit le parcours : la page ne touche jamais aux étapes elle-même", () => {
  const lecteur = fonction("lireSplat");
  assert.match(lecteur, /SPLAT\.resumeProf\(brut \|\| null\)/);
  const splat = lecteur + sectionSplat;
  assert.doesNotMatch(splat, /(?:brut|parcours)\.etapes|\.etapes\[/, "pas de lecture de parcours.etapes dans la page");
  assert.doesNotMatch(splat, /\.(?:vues|idx|etoiles|essais|cartes)\b/, "les champs d'une étape ne sont lus que par le moteur");
  assert.doesNotMatch(splat, /innerHTML/, "rien de ce que renvoie le serveur ne devient du HTML");
  // Exécuté : un parcours vide, un parcours illisible, pas de moteur.
  const {f} = ongletSplat([]);
  const vide = f.lireSplat(null);
  assert.deepEqual([vide.faits, vide.total, vide.bonus, vide.lisible, vide.mondes.length], [0, 40, 0, true, 6]);
  assert.equal(f.lireSplat("n'importe quoi").faits, 0);
  assert.equal(f.lireSplat(LEA).etats.enq11, "aide");
});

// ------------------------------------------------------------ le choix de l'activité

test("APPLIS : ce que la page sait montrer est disponible au catalogue, proposé par l'API, dans l'ordre du catalogue", () => {
  const APPLIS = new Function(`${constante("APPLIS")}\nreturn APPLIS;`)();
  const catalogue = lire("_serveur/public/lib/applis.php");
  const api = lire("_serveur/public/api/prof.php");
  const proposables = JSON.parse(api.match(/const APPLIS_PROPOSABLES = (\[[^\]]+\]);/)[1].replace(/'/g, '"'));
  const ordre = [...catalogue.matchAll(/^ {4}'([a-z-]+)' => \[/gm)].map(m => m[1]);
  // Coffres magiques entre les deux (lot « Coffres magiques sur le suivi », 21/10/2026),
  // puis Anzan (lot « Qui voit quoi », lot 4b, 24/10/2026), comme au catalogue.
  assert.deepEqual(APPLIS.map(a => a.cle), ["defi-tables", "coffres", "flash-anzan", "splat"]);
  APPLIS.forEach(appli => {
    const entree = catalogue.slice(catalogue.indexOf(`'${appli.cle}' => [`));
    const bloc = entree.slice(0, entree.indexOf("\n    ],"));
    assert.match(bloc, /'disponible' => true,/, `${appli.cle} disponible au catalogue`);
    assert.ok(proposables.includes(appli.cle), `${appli.cle} proposée par l'API`);
    const compteur = bloc.match(/'compteur' => '(\w+)'/)[1];
    assert.equal({calculs: "calculs", etapes: "étapes", niveaux: "niveaux commencés", seances: "séances"}[compteur], appli.unite[1], "« Revenir à… » compte ce que compte le serveur");
  });
  assert.deepEqual(APPLIS.map(a => a.cle), ordre.filter(c => APPLIS.some(a => a.cle === c)));
  // Le HTML suit la même liste : les boutons du choix, les cases des activités.
  const boutons = [...page.matchAll(/<button type="button" data-appli="([\w-]+)" aria-pressed="(\w+)">([^<]+)<\/button>/g)];
  assert.deepEqual(boutons.map(m => [m[1], m[3]]), APPLIS.map(a => [a.cle, a.nom]));
  const cases = [...page.matchAll(/<label class="activite-tete"><input type="checkbox" data-appli="([\w-]+)"> <strong>([^<]+)<\/strong><\/label>/g)];
  assert.deepEqual(cases.map(m => [m[1], m[2]]), APPLIS.map(a => [a.cle, a.nom]));
  // Lot « Ma classe : réglages » : les onglets sont TOUJOURS là (avant, le
  // choix n'apparaissait qu'avec deux activités, et rien ne disait de quelle
  // appli était le tableau).
  assert.match(page, /<div class="choix-appli" id="choix-appli" role="group" aria-label="Activité affichée">/,
    "toujours là, même avec une seule activité");
  assert.match(page, /<button type="button" class="onglet-reglages" id="onglet-reglages" aria-pressed="false" aria-label="Réglages" title="[^"]+" hidden>/,
    "« Réglages » : caché tant que le droit n'est pas connu");
  assert.match(page, /<button type="button" class="onglet-eleves" id="onglet-eleves" aria-pressed="false" aria-label="Élèves" title="[^"]+" hidden>/,
    "« Élèves » : caché tant que le droit n'est pas connu");
  const entete = page.slice(page.indexOf('<tr id="entete-splat" hidden>'), page.indexOf("</tr>", page.indexOf('<tr id="entete-splat"')));
  assert.deepEqual([...entete.matchAll(/<th>(?:<button type="button" data-tri="(\w+)">)?([^<]*)/g)].map(m => `${m[2]}${m[1] ? `:${m[1]}` : ""}`),
    ["Élève:prenom", "Mondes", "Étapes réussies:etapes", "Dernière activité:date", ""]);
});

function choixAppli() {
  return new Function(`${fonction("appliAMontrer")}\nreturn appliAMontrer;`)();
}

test("l'activité montrée : le dernier choix si la classe l'a, sinon la première de la classe", () => {
  const appliAMontrer = choixAppli();
  assert.equal(appliAMontrer(["defi-tables", "splat"], "splat"), "splat");
  assert.equal(appliAMontrer(["defi-tables"], "splat"), "defi-tables", "une classe sans SPLAT! montre Défi tables");
  assert.equal(appliAMontrer(["splat"], ""), "splat");
  assert.equal(appliAMontrer(["defi-tables", "splat"], ""), "defi-tables", "sans choix : la première, dans l'ordre du catalogue");
  assert.match(fonction("ouvrirClasse"), /api\("tableau", \{classe_id: id, appli: voulue\}\)/, "le tableau lu est celui de l'activité montrée");
  assert.match(fonction("ouvrirClasse"), /memeClasse \? appliAffichee : lireChoixAppli\(\)/, "rouvrir la même classe garde l'onglet");
  assert.match(fonction("afficherAppli"), /retenirChoixAppli\(cle\);/);
  assert.match(script, /const CLE_APPLI = "mathsgo-suivi-prof-appli";/);
  assert.match(fonction("lireChoixAppli"), /sessionStorage\.getItem\(CLE_APPLI\)/, "retenu le temps de l'onglet, pas plus");
  assert.match(fonction("deconnecter"), /sessionStorage\.removeItem\(CLE_APPLI\)/);
});

function casesMondes() {
  return [1, 2, 3, 4, 5, 6].map(n => {
    const puce = Object.assign(new Noeud("label"), {dataset: {monde: String(n)}});
    puce.classList = {toggle: (c, oui) => {
      const liste = (puce.className || "").split(" ").filter(x => x && x !== c);
      if (oui) liste.push(c);
      puce.className = liste.join(" ");
    }};
    const caseMonde = Object.assign(new Noeud("input"), {dataset: {monde: String(n)}});
    caseMonde.closest = () => puce;
    caseMonde.puce = puce;
    return caseMonde;
  });
}

function poserAppliRejoue(applis, appliAffichee, droit = "proprietaire", triAvant = {colonne: "acquises", sens: -1}, reglages = {}, vueAvant = "appli", eleves = []) {
  const {$} = creerZones();
  const boutons = ["defi-tables", "coffres", "flash-anzan", "splat"].map(cle => Object.assign(new Noeud("button"), {dataset: {appli: cle}}));
  const cases = ["defi-tables", "coffres", "flash-anzan", "splat"].map(cle => Object.assign(new Noeud("input"), {dataset: {appli: cle}}));
  const mondes = casesMondes();
  // Les cases de Coffres magiques (niveaux, opérations) : à part, elles ne comptent pas ici.
  const casesCoffres = s => (s.includes("data-niveau") ? [1, 2, 3] : [1, 2, 3, 4]).map(n => Object.assign(new Noeud("input"), {dataset: {niveau: String(n), operation: String(n)}}));
  const doc = Object.assign({}, document, {querySelectorAll: s => (s.startsWith("#choix-appli") ? boutons
    : s.startsWith("#mondes-ouverts") ? mondes : s.startsWith("#coffres-reglages") ? casesCoffres(s) : cases)});
  const TRIS = {"defi-tables": [["prenom", "Prénom"], ["acquises", "Tables passées"], ["date", "Dernière activité"]],
    "splat": [["prenom", "Prénom"], ["etapes", "Étapes réussies"], ["date", "Dernière activité"]]};
  const lus = {records: 0, evaluations: 0};
  const etat = new Function("document", "$", "classe", "appliAffichee", "droitClasse", "TRIS", "APPLIS", "triInitial", "vueInitiale", "lus", "eleves",
    `let tri = triInitial;\nlet vue = vueInitiale;\n${constante("NOMBRE_MONDES")}\n${constante("NOMBRES_COFFRES")}\n${["lesApplisConnues", "applisDeLaClasse", "applisAMontrer", "poserOnglets", "poserAppli", "poserVue", "poserTris", "poserActivites",
      "mondesOuverts", "coffresOuverts", "poserPuce", "recordsOuvertsPourLaClasse"].map(fonction).join("\n")}\nfunction poserEnPlusPour() {}\nfunction chargerRecords() { lus.records += 1; }\nfunction poserEvaluations() { lus.evaluations += 1; }\nposerAppli();\nreturn {tri, vue};`)(
    doc, $, {applis, reglages}, appliAffichee, droit, TRIS, [{cle: "defi-tables"}, {cle: "coffres"}, {cle: "flash-anzan"}, {cle: "splat"}], triAvant, vueAvant === true ? "reglages" : vueAvant, lus, eleves);
  return {$, boutons, cases, mondes, tri: etat.tri, vue: etat.vue, vueReglages: etat.vue === "reglages", lus};
}

test("un onglet par activité de la classe, même seule ; l'onglet SPLAT! change l'en-tête, les tris, et cache ce qui est à Défi tables", () => {
  const seule = poserAppliRejoue(["defi-tables"], "defi-tables");
  assert.notEqual(seule.$("choix-appli").hidden, true, "une seule activité : son onglet est là quand même");
  assert.deepEqual(seule.boutons.map(b => [b.hidden, b.attributs["aria-pressed"]]), [[false, "true"], [true, "false"], [true, "false"], [true, "false"]],
    "l'onglet Défi tables, souligné ; ni onglet Coffres, ni Anzan, ni SPLAT!");
  assert.equal(seule.$("entete-splat").hidden, true);
  assert.equal(seule.$("bloc-imprimer").hidden, false);
  const deux = poserAppliRejoue(["defi-tables", "splat"], "splat");
  assert.equal(deux.$("choix-appli").hidden, false);
  assert.deepEqual(deux.boutons.map(b => [b.hidden, b.attributs["aria-pressed"]]), [[false, "false"], [true, "false"], [true, "false"], [false, "true"]]);
  assert.equal(deux.$("entete-defi-tables").hidden, true);
  assert.equal(deux.$("entete-splat").hidden, false);
  assert.equal(deux.$("bloc-imprimer").hidden, true, "« À imprimer » (papiers de Défi tables) caché");
  assert.equal(deux.$("fragiles").hidden, true, "« Les calculs qui coincent » caché");
  assert.deepEqual(deux.$("tri").children.map(o => o.textContent), ["Prénom", "Étapes réussies", "Dernière activité"]);
  assert.deepEqual(deux.tri, {colonne: "prenom", sens: 1}, "un tri qui n'existe pas dans l'onglet revient au prénom");
  assert.equal(poserAppliRejoue(["defi-tables", "splat"], "splat", "proprietaire", {colonne: "date", sens: -1}).tri.colonne, "date",
    "« Dernière activité » existe des deux côtés : il reste");
  // Les activités de la classe : cases à l'état du serveur.
  assert.deepEqual(deux.cases.map(c => c.checked), [true, false, false, true]);
  assert.deepEqual(seule.cases.map(c => c.checked), [true, false, false, false]);
  // Hors Réglages : la vue de l'activité, ses cartes lues.
  assert.equal(deux.$("vue-appli").hidden, false);
  assert.equal(deux.$("vue-reglages").hidden, true);
  assert.equal(deux.$("vue-eleves").hidden, true);
  assert.equal(deux.$("onglet-reglages").attributs["aria-pressed"], "false");
  assert.equal(deux.$("onglet-eleves").attributs["aria-pressed"], "false");
  assert.deepEqual(deux.lus, {records: 1, evaluations: 1});
});

test("lot 4b : une appli qu'un élève a EN PLUS a son onglet, même quand la classe ne l'a pas (Anzan donné à Rania seule) ; l'onglet Anzan a son en-tête", () => {
  const rania = {id: 1, prenom: "Rania", acces: {applis: ["defi-tables", "flash-anzan", "splat"], reglages: {}}};
  const lucas = {id: 2, prenom: "Lucas", acces: {applis: ["defi-tables", "splat"], reglages: {}}};
  const sans = poserAppliRejoue(["defi-tables", "splat"], "defi-tables", "proprietaire", undefined, {}, "appli", [lucas]);
  assert.deepEqual(sans.boutons.map(b => b.hidden), [false, true, true, false], "personne n'a Anzan : pas d'onglet");
  const avec = poserAppliRejoue(["defi-tables", "splat"], "flash-anzan", "proprietaire", undefined, {}, "appli", [lucas, rania]);
  assert.deepEqual(avec.boutons.map(b => [b.hidden, b.attributs["aria-pressed"]]), [[false, "false"], [true, "false"], [false, "true"], [false, "false"]],
    "l'onglet Anzan, entre Coffres et SPLAT!, souligné");
  assert.deepEqual(avec.cases.map(c => c.checked), [true, false, false, true], "la case de la classe, elle, reste décochée : c'est Rania qui l'a");
  assert.equal(avec.$("entete-anzan").hidden, false);
  assert.equal(avec.$("entete-defi-tables").hidden, true);
  assert.equal(avec.$("entete-coffres").hidden, true);
  assert.equal(avec.$("bloc-imprimer").hidden, true, "« À imprimer » est à Défi tables");
  assert.equal(avec.$("objectif").hidden, true, "pas de carte de classe pour Anzan");
  assert.equal(avec.$("fragiles").hidden, true);
  assert.deepEqual(avec.lus, {records: 1, evaluations: 1});
  // Sans « acces » (un serveur d'avant le lot 2 de Qui voit quoi) : les onglets de la classe, rien de plus.
  assert.deepEqual(poserAppliRejoue(["defi-tables"], "defi-tables", "proprietaire", undefined, {}, "appli", [{id: 3}]).boutons.map(b => b.hidden), [false, true, true, true]);
  // Une appli inconnue de la page (« defi-calcul ») ne fait pas d'onglet.
  assert.deepEqual(poserAppliRejoue(["defi-tables"], "defi-tables", "proprietaire", undefined, {}, "appli",
    [{id: 4, acces: {applis: ["defi-tables", "defi-calcul"], reglages: {}}}]).boutons.map(b => b.hidden), [false, true, true, true]);
});

test("lot « Ma classe : réglages » : la vue Réglages remplace celle de l'activité, propriétaire seulement", () => {
  const reglages = poserAppliRejoue(["defi-tables", "splat"], "splat", "proprietaire", undefined, {}, true);
  assert.equal(reglages.vueReglages, true);
  assert.equal(reglages.$("vue-appli").hidden, true, "le tableau n'est plus à l'écran");
  assert.equal(reglages.$("vue-reglages").hidden, false);
  assert.equal(reglages.$("onglet-reglages").attributs["aria-pressed"], "true");
  assert.deepEqual(reglages.boutons.map(b => b.attributs["aria-pressed"]), ["false", "false", "false", "false"], "aucun onglet d'activité souligné");
  assert.deepEqual(reglages.cases.map(c => c.checked), [true, false, false, true], "les cases sont posées");
  // Un collègue n'a jamais la vue Réglages, même si l'état le demandait.
  for (const droit of ["ecriture", "lecture"]) {
    const collegue = poserAppliRejoue(["defi-tables", "splat"], "splat", droit, undefined, {}, true);
    assert.equal(collegue.vueReglages, false, droit);
    assert.equal(collegue.$("vue-appli").hidden, false, droit);
    assert.equal(collegue.$("vue-reglages").hidden, true, droit);
  }
  // Le droit, l'onglet, la sortie des Réglages et ce qu'on ne lit pas dedans.
  assert.match(fonction("appliquerDroits"), /\$\("onglet-reglages"\)\.hidden = !proprietaire;/);
  assert.match(fonction("ouvrirReglages"), /if \(!classe \|\| droitClasse !== "proprietaire"\) return;\s*vue = "reglages";/);
  assert.match(script, /bouton\.addEventListener\("click", \(\) => \{ vue = "appli"; afficherAppli\(bouton\.dataset\.appli\); \}\);/,
    "un onglet d'activité sort des Réglages (et des Élèves)");
  assert.doesNotMatch(fonction("afficherAppli"), /\bvue\b/, "après un changement d'activités, on reste dans les Réglages");
  assert.match(fonction("ouvrirClasse"), /if \(!memeClasse\) \{\s*detailsOuverts\.clear\(\);\s*vue = /, "une autre classe s'ouvre sur son tableau");
  assert.match(fonction("evalVisible"), /vue === "appli" && eleves\.length > 0 &&/, "ni veille d'évaluation hors de la vue de l'activité, ni carte sans élève");
  assert.match(fonction("chargerRecords"), /\|\| vue !== "appli"\) \{ dessinerRecords\(\); return; \}/);
});

test("le tri « Étapes réussies » : les étapes, puis les Bonus, puis une série en cours", () => {
  const eleves = [
    {prenom: "Rien", code: "A", lu: {faits: 0, bonus: 0, cours: 0}},
    {prenom: "Cours", code: "B", lu: {faits: 0, bonus: 0, cours: 1}},
    {prenom: "Treize", code: "C", lu: {faits: 13, bonus: 0, cours: 0}},
    {prenom: "TreizeBonus", code: "D", lu: {faits: 13, bonus: 2, cours: 0}},
    {prenom: "Tout", code: "E", lu: {faits: 40, bonus: 14, cours: 0}},
  ];
  const trier = new Function("eleves", "tri", `${fonction("trierEleves")}\ntrierEleves();\nreturn eleves.map(e => e.prenom);`);
  assert.deepEqual(trier(eleves.slice(), {colonne: "etapes", sens: -1}), ["Tout", "TreizeBonus", "Treize", "Cours", "Rien"]);
});

test("passer d'un onglet à l'autre : une liste déjà lue est reprise, sinon un appel ; deux clics rapprochés, le dernier gagne", async () => {
  const appels = [];
  const attentes = [];
  const api = (action, corps) => { appels.push(corps.appli); return new Promise(r => attentes.push(() => r({eleves: [{id: 1, prenom: corps.appli}]}))); };
  const retenus = [];
  let dessins = 0;
  // Depuis le lot « Coffres magiques sur le suivi » (21/10/2026), afficherAppli
  // passe par chargerMoteurDe(cle), qui choisit le moteur à charger.
  const monde = new Function("api", "retenirChoixAppli", "redessin", "classe", "chargerMoteurSplat", "chargerMoteurCoffres", "chargerMoteurAnzan", "elevesLus",
    "messager", "poserAppli", "surErreur", "APPLIS", "jeton", "lireSplat", "poserOnglets",
    `let appliAffichee = "defi-tables", eleves = [], tableaux = {"defi-tables": [{id: 1, prenom: "cache"}]}, demandeAppli = 0;\n`
    + `${["lesApplisConnues", "applisDeLaClasse", "applisAMontrer", "chargerMoteurDe", "reporterAccesDeLaListe", "afficherAppli"].map(fonction).join("\n")}\n`
    + "return {afficherAppli, etat: () => ({appliAffichee, eleves, tableaux})};")(
    api, cle => retenus.push(cle), {demander: () => { dessins += 1; }}, {id: 7, applis: ["defi-tables", "splat"]},
    async () => SPLAT, async () => null, async () => null, (cle, liste) => liste, () => {}, () => {}, e => { throw e; }, [{cle: "defi-tables"}, {cle: "splat"}],
    "jeton-de-test", () => ({}), () => []);
  const p1 = monde.afficherAppli("splat");
  await new Promise(r => setTimeout(r, 0));
  const p2 = monde.afficherAppli("defi-tables");
  await p2;
  assert.equal(monde.etat().appliAffichee, "defi-tables", "Défi tables, déjà lu, s'affiche sans appel");
  attentes[0]();
  await p1;
  assert.equal(monde.etat().appliAffichee, "defi-tables", "la réponse SPLAT! arrivée APRÈS le second clic ne repasse pas devant");
  assert.deepEqual(appels, ["splat"], "un seul appel : Défi tables était déjà lu");
  assert.deepEqual(retenus, ["defi-tables"], "seul le choix affiché est retenu");
  assert.equal(monde.etat().tableaux.splat, undefined, "une réponse dépassée n'est pas rangée (elle pourrait être d'une autre classe)");
  assert.equal(dessins, 1);
  await monde.afficherAppli("automatismes");
  assert.equal(monde.etat().appliAffichee, "defi-tables", "une activité que la classe n'a pas ne s'affiche pas");
});

test("un prénom, un code changés — ou un élève supprimé — valent pour toutes les listes déjà lues", () => {
  const rejoue = new Function("tableaux", "eleves", "appliAffichee",
    `${fonction("reporterEleve")}\nreturn {reporterEleve, tableaux: () => tableaux};`);
  const tables = [{id: 1, prenom: "", code: "AAA"}, {id: 2, prenom: "Noé", code: "BBB"}];
  const splat = [{id: 1, prenom: "", code: "AAA"}, {id: 2, prenom: "Noé", code: "BBB"}];
  const monde = rejoue({"defi-tables": tables, splat}, splat, "splat");
  splat[0].prenom = "Léa"; splat[0].initiale = "B"; splat[0].code = "CCC";
  monde.reporterEleve(splat[0]);
  assert.deepEqual([tables[0].prenom, tables[0].initiale, tables[0].code], ["Léa", "B", "CCC"]);
  assert.match(fonction("nommer"), /await api\("eleves\.nommer"[^;]*;\s*reporterEleve\(eleve\);/);
  assert.match(fonction("regenerer"), /eleve\.code = donnees\.code;\s*reporterEleve\(eleve\);/);
  const reste = splat.filter(e => e.id !== 2);
  const monde2 = rejoue({"defi-tables": tables, splat}, reste, "splat");
  monde2.reporterEleve({id: 2}, true);
  assert.deepEqual(monde2.tableaux()["defi-tables"].map(e => e.id), [1]);
  assert.equal(monde2.tableaux().splat, reste, "la liste affichée reste celle de la page");
  assert.match(fonction("supprimerEleve"), /eleves = eleves\.filter\(autre => autre\.id !== eleve\.id\);\s*reporterEleve\(eleve, true\);/);
});

test("« Revenir à… » revient dans l'activité affichée, et compte ses étapes", () => {
  const proposees = appli => new Function("APPLIS", "appliAffichee", "dateLisible", "jourLisible",
    `${fonction("versionsProposees")}\nreturn versionsProposees;`)(
    [{cle: "defi-tables", unite: ["calcul", "calculs"]}, {cle: "splat", unite: ["étape", "étapes"]}], appli, () => "", j => j);
  const eleve = {restaurable: false, journees: [{jour: "2026-10-07", calculs: 13}, {jour: "2026-10-06", calculs: 1}]};
  assert.deepEqual(proposees("splat")(eleve).map(o => o.libelle),
    ["fin de journée du 2026-10-07 — 13 étapes", "fin de journée du 2026-10-06 — 1 étape"]);
  assert.deepEqual(proposees("defi-tables")(eleve).map(o => o.libelle),
    ["fin de journée du 2026-10-07 — 13 calculs", "fin de journée du 2026-10-06 — 1 calcul"]);
  assert.match(fonction("revenirA"), /const corps = \{eleve_id: eleve\.id, appli: appliAffichee\};/);
  assert.doesNotMatch(fonction("revenirA"), /"defi-tables"/);
});

// ------------------------------------------------------------ « Activités de la classe »

async function changerRejoue(applis, cle, coche, options = {}) {
  const appels = [];
  const questions = [];
  const messages = [];
  const caseActivite = Object.assign(new Noeud("input"), {dataset: {appli: cle}, checked: coche});
  const cases = [caseActivite];
  let rouvert = 0;
  const api = async (action, corps) => {
    appels.push({action, corps, desactivees: cases.every(c => c.disabled)});
    if (options.panne) { const e = new Error("Le serveur ne répond pas."); throw e; }
    return {ok: true};
  };
  const demander = async texte => { questions.push(texte); return options.reponse === undefined ? {} : options.reponse; };
  await new Function("document", "classe", "api", "demander", "messager", "surErreur", "ouvrirClasse", "APPLIS",
    `${fonction("lesApplisConnues")}\n${fonction("changerActivite")}\nreturn changerActivite;`)(
    {querySelectorAll: () => cases}, {id: 4, libelle: "405", applis}, api, demander,
    (id, t, type) => messages.push({id, t, type}), (e, zone) => messages.push({id: zone, t: e.message, type: "erreur"}),
    async () => { rouvert += 1; },
    [{cle: "defi-tables", nom: "Défi tables"}, {cle: "splat", nom: "SPLAT!"}])(caseActivite);
  return {appels, questions, messages, caseActivite, rouvert};
}

test("cocher SPLAT! : la liste de la classe part au serveur, la classe est relue, un mot court", async () => {
  const r = await changerRejoue(["defi-tables"], "splat", true);
  assert.deepEqual(r.questions, [], "ajouter ne demande rien");
  assert.deepEqual(r.appels.map(a => [a.action, a.corps]), [["classes.modifier", {classe_id: 4, applis: ["defi-tables", "splat"]}]]);
  assert.equal(r.appels[0].desactivees, true, "les cases sont désactivées pendant l'envoi");
  assert.equal(r.rouvert, 1, "la classe est relue : le choix « Défi tables | SPLAT! » apparaît");
  assert.deepEqual(r.messages.at(-1), {id: "message-activites", t: "SPLAT! ajouté : la tuile apparaît dans l’espace des élèves.", type: "ok"});
  assert.equal(r.caseActivite.disabled, false);
});

test("décocher SPLAT! : on demande d'abord, on dit que rien n'est effacé ; « Annuler » ne change rien", async () => {
  const non = await changerRejoue(["defi-tables", "splat"], "splat", false, {reponse: null});
  assert.deepEqual(non.questions, ["Retirer SPLAT! de la classe 405 ? La tuile disparaît de l’espace des élèves. Leur travail reste enregistré : rien n’est effacé."]);
  assert.deepEqual(non.appels, [], "rien ne part sans un oui");
  assert.equal(non.caseActivite.checked, true, "la case revient cochée");
  const oui = await changerRejoue(["defi-tables", "splat"], "splat", false);
  assert.deepEqual(oui.appels.map(a => a.corps.applis), [["defi-tables"]]);
  assert.deepEqual(oui.messages.at(-1), {id: "message-activites", t: "SPLAT! retiré de l’espace des élèves. Rien n’est effacé.", type: "ok"});
  // Ce que la phrase promet est vrai : classes.modifier ne touche qu'à la liste.
  const api = lire("_serveur/public/api/prof.php");
  const modifier = api.slice(api.indexOf("case 'classes.modifier':"), api.indexOf("case 'classes.supprimer':"));
  assert.doesNotMatch(modifier, /DELETE|progressions/, "décocher n'efface aucune progression");
});

test("une classe garde au moins une activité ; une activité que la page ne montre pas n'est pas perdue", async () => {
  const seule = await changerRejoue(["defi-tables"], "defi-tables", false);
  assert.deepEqual(seule.appels, [], "rien ne part");
  assert.deepEqual(seule.questions, []);
  assert.equal(seule.caseActivite.checked, true);
  assert.deepEqual(seule.messages.at(-1), {id: "message-activites", t: "Une classe garde au moins une activité.", type: "erreur"});
  const autre = await changerRejoue(["defi-tables", "automatismes"], "splat", true);
  assert.deepEqual(autre.appels[0].corps.applis, ["defi-tables", "automatismes", "splat"], "« automatismes » (pas encore montrée ici) reste dans la liste");
  const panne = await changerRejoue(["defi-tables"], "splat", true, {panne: true});
  assert.equal(panne.caseActivite.checked, false, "le serveur ne répond pas : la case revient à son état");
  assert.equal(panne.messages.at(-1).id, "message-activites");
});

test("le bilan de « Supprimer la classe » parle des tables, même depuis l'onglet SPLAT!", async () => {
  const PARCOURS = {TABLES: [2, 3, 4, 5, 6, 7, 8, 9, 10]};
  const bilan = (eleves, tables) => new Function("PARCOURS", "eleves",
    `${fonction("combienAuBoutDesTables")}\n${fonction("texteBilanDeLaClasse")}\nreturn texteBilanDeLaClasse;`)(PARCOURS, eleves)(tables);
  const splat = [{maj_le: "x", lu: {faits: 3}}, {maj_le: null, lu: {faits: 0}}, {maj_le: "x", lu: {faits: 1}}];
  const tables = [{maj_le: "x", lu: {lisible: true, acquises: [2, 3, 4, 5, 6, 7, 8, 9, 10]}}, {maj_le: null, lu: {lisible: true, acquises: []}}, {maj_le: null, lu: {lisible: true, acquises: []}}];
  assert.equal(bilan(splat, tables), "3 élèves, 1 entraîné, 1 au bout des tables");
  assert.equal(bilan(splat, null), "3 élèves, 2 entraînés", "classe sans Défi tables : pas de « au bout des tables »");
  const appels = [];
  const lireListe = (classeApplis, cache) => new Function("classe", "tableaux", "api", "elevesLus", "APPLIS",
    `${fonction("lesApplisConnues")}\n${fonction("applisDeLaClasse")}\n${fonction("listeDefiTables")}\nreturn listeDefiTables;`)(
    {id: 4, applis: classeApplis}, cache, async (action, corps) => { appels.push(corps.appli); return {eleves: tables}; },
    (cle, liste) => liste, [{cle: "defi-tables"}, {cle: "splat"}])();
  assert.equal(await lireListe(["splat"], {}), null, "classe sans Défi tables : rien à lire");
  assert.equal(await lireListe(["defi-tables", "splat"], {"defi-tables": tables}), tables, "déjà lue : reprise");
  assert.deepEqual(appels, []);
  assert.equal(await lireListe(["defi-tables", "splat"], {}), tables);
  assert.deepEqual(appels, ["defi-tables"]);
  const gestionnaire = blocDepuis(script, script.indexOf('$("supprimer-classe").addEventListener'));
  assert.ok(gestionnaire.indexOf("await listeDefiTables()") < gestionnaire.indexOf("await demander("));
  assert.match(gestionnaire, /texteBilanDeLaClasse\(tables\)/);
});

// ------------------------------------------------------------ le moteur, chargé paresseusement

test("le moteur SPLAT! est servi d'ici, chargé à la première ouverture de l'onglet, une seule fois", async () => {
  assert.match(page, /\$moteurSplat = __DIR__ \. '\/splat-parcours\.js';\n\$versionSplat = is_file\(\$moteurSplat\) \? substr\(md5_file\(\$moteurSplat\), 0, 10\) : '0';/,
    "sa version dans l'adresse suit son contenu");
  assert.match(script, /const MOTEUR_SPLAT = "splat-parcours\.js\?v=<\?= htmlspecialchars\(\$versionSplat, ENT_QUOTES\) \?>";/);
  assert.doesNotMatch(page, /<script src="splat-parcours\.js/, "pas chargé d'office : une classe sans SPLAT! ne le télécharge pas");
  const scripts = [];
  const fenetre = {};
  const charger = new Function("document", "window", "MOTEUR_SPLAT",
    `let SPLAT = null, chargementSplat = null;\n${fonction("chargerMoteurSplat")}\nreturn chargerMoteurSplat;`)(
    {createElement: () => { const s = new Noeud("script"); scripts.push(s); return s; }, head: {appendChild: () => {}}},
    fenetre, "splat-parcours.js?v=abc");
  const p1 = charger();
  const p2 = charger();
  assert.equal(scripts.length, 1, "deux demandes, un seul script");
  assert.equal(scripts[0].src, "splat-parcours.js?v=abc");
  fenetre.MathsGoSplatParcours = SPLAT;
  scripts[0].ecouteurs.load[0]();
  assert.equal(await p1, SPLAT);
  assert.equal(await p2, SPLAT);
  assert.equal(await charger(), SPLAT, "ensuite, plus aucun script");
  assert.equal(scripts.length, 1);
  // En panne : null, et on pourra réessayer.
  const scripts2 = [];
  const charger2 = new Function("document", "window", "MOTEUR_SPLAT",
    `let SPLAT = null, chargementSplat = null;\n${fonction("chargerMoteurSplat")}\nreturn chargerMoteurSplat;`)(
    {createElement: () => { const s = new Noeud("script"); scripts2.push(s); return s; }, head: {appendChild: () => {}}}, {}, "x");
  const p3 = charger2();
  scripts2[0].ecouteurs.error[0]();
  assert.equal(await p3, null);
  charger2();
  assert.equal(scripts2.length, 2, "une nouvelle tentative à la prochaine ouverture de l'onglet");
});

test("à la déconnexion, l'onglet, les Réglages et les activités partent avec le reste", () => {
  const zones = new Function(`${constante("ZONES_MESSAGE")}\n${constante("BLOCS_A_CACHER")}\nreturn {ZONES_MESSAGE, BLOCS_A_CACHER};`)();
  for (const id of ["message-activites", "message-partage", "message-nom", "message-supprimer"]) assert.ok(zones.ZONES_MESSAGE.includes(id), id);
  // Lot « Ma classe : réglages » : les blocs du propriétaire sont DANS la vue
  // Réglages ; c'est elle (et son onglet) qu'on cache.
  assert.ok(zones.BLOCS_A_CACHER.includes("vue-reglages"));
  assert.ok(zones.BLOCS_A_CACHER.includes("onglet-reglages"));
  // DANS la vue, pas seulement plus bas dans le fichier : entre l'ouverture
  // de la vue et l'élément, les <div> ne se referment jamais toutes.
  const debut = page.indexOf('<div class="reglages" id="vue-reglages" hidden>');
  assert.ok(debut > 0);
  for (const id of ["bloc-activites", "rec-reglage", "mondes-ouverts", "bloc-partage", "form-nom-classe", "supprimer-classe"]) {
    const position = page.indexOf(`id="${id}"`, debut);
    assert.ok(position > debut, `${id} après l'ouverture de la vue`);
    let profondeur = 0;
    for (const balise of page.slice(debut, position).matchAll(/<div\b|<\/div>/g)) {
      profondeur += balise[0] === "</div>" ? -1 : 1;
      assert.ok(profondeur > 0, `${id} est DANS la vue Réglages`);
    }
  }
  const oublier = fonction("oublierEtat");
  assert.match(oublier, /appliAffichee = "defi-tables";\s*vue = "appli";\s*tableaux = \{\};\s*detailsOuverts\.clear\(\);/);
});

// ------------------------------------------------------------ lot « splat-suivi-5 »
//
// Les mondes de SPLAT! ouverts, classe par classe (08/10/2026, choix de
// Gwenaël sur maquettes) : sous SPLAT! dans « Activités de la classe », un
// bouton par monde ; dans l'onglet SPLAT!, les mondes fermés en gris
// (pointillés) et les comptes sur les mondes ouverts seulement ; le Détail
// garde tout le travail, les mondes fermés plus pâles avec un cadenas.

const MONDES_1_2 = {splat: {mondes: [1, 2]}};

test("mondes 1 et 2 ouverts : pastilles grises pour les autres, étapes comptées sur 9, Bonus des mondes fermés hors compte", () => {
  const {lignes} = ongletSplat(classe8(), {reglages: MONDES_1_2});
  const [lea, maelys, tom, yanis] = lignes;
  assert.deepEqual(pastilles(lea).map(etatPastille), ["fini", "fini", "ferme", "ferme", "ferme", "ferme"]);
  assert.deepEqual(pastilles(tom).map(etatPastille), ["cours", "vide", "ferme", "ferme", "ferme", "ferme"]);
  assert.deepEqual(pastilles(maelys).map(etatPastille), ["fini", "fini", "ferme", "ferme", "ferme", "ferme"]);
  const compte = tr => cellules(tr)[C_ETAPES].premier(n => aClasse(n, "pastille")).textContent;
  const bonus = tr => (cellules(tr)[C_ETAPES].premier(n => aClasse(n, "bonus-compte")) || {textContent: ""}).textContent;
  assert.equal(compte(lea), "9 / 9");
  assert.equal(compte(maelys), "9 / 9");
  assert.equal(compte(tom), "0 / 9");
  assert.equal(compte(yanis), "0 / 9");
  assert.equal(bonus(lea), "", "le Bonus de Léa est dans le monde 3, fermé");
  assert.equal(bonus(maelys), "", "les Bonus sont tous dans les mondes 3 et 4");
  const titres = pastilles(lea).map(svg => svg.premier(n => n.tag === "title").textContent);
  assert.equal(titres[2], "Monde 3 · SPLAT! Enquête : fermé pour la classe");
  assert.equal(titres[0], "Monde 1 · Petit SPLAT! : 6 / 6");
  // Le dessin d'un monde fermé : anneau gris en pointillés, chiffre gris centré, pas de moitié.
  const ferme = pastilles(lea)[2];
  const cercle = ferme.premier(n => n.tag === "circle");
  const chiffre = ferme.premier(n => n.tag === "text");
  assert.equal(cercle.attributs["stroke-dasharray"], "3.2 2.4");
  assert.equal(cercle.attributs.fill, "#fff");
  assert.equal(cercle.attributs.stroke, chiffre.attributs.fill);
  assert.equal(chiffre.attributs.y, "16.375");
  assert.equal(ferme.premier(n => n.tag === "path"), null);
  // Les mondes 5 et 6 seulement : 3 + 9 = 12 étapes (l'échauffement compris).
  const {lignes: l2} = ongletSplat(classe8(), {reglages: {splat: {mondes: [5, 6]}}});
  assert.equal(cellules(l2[1])[C_ETAPES].premier(n => aClasse(n, "pastille")).textContent, "12 / 12", "Maëlys a tout fini");
  assert.deepEqual(pastilles(l2[1]).map(etatPastille), ["ferme", "ferme", "ferme", "ferme", "fini", "fini"]);
});

test("mondes fermés : le Détail garde tout le travail, les rangées des mondes fermés plus pâles avec un cadenas", () => {
  const {corps, lignes} = ongletSplat(classe8(), {reglages: MONDES_1_2});
  cellules(lignes[0])[C_GESTES].children[0].cliquer();
  const detail = corps.children[1];
  const rangees = detail.tous(n => (n.className || "").startsWith("detail-monde"));
  const noms = rangees.map(r => r.premier(n => n.tag === "b").textContent);
  assert.deepEqual(noms, ["Monde 1 · Petit SPLAT!", "Monde 2 · SPLAT! Classique", "🔒 Monde 3 · SPLAT! Enquête",
    "🔒 Monde 4 · SPLAT! Système", "🔒 Monde 5 · SPLAT! Équations", "🔒 Monde 6 · SPLAT! Relatifs",
    "🔒 ✨ Bonus du monde 3", "🔒 ✨ Bonus du monde 4"]);
  assert.deepEqual(rangees.map(r => aClasse(r, "ferme")), [false, false, true, true, true, true, true, true]);
  const cases = rangees[2].tous(n => aClasse(n, "et"));
  assert.ok(aClasse(cases[1], "aide"), "l'étape 11 de Léa, réussie avec des réponses vues, reste visible");
  assert.ok(aClasse(cases[0], "ok"));
});

test("mondes fermés : la carte de classe compte sur les mondes ouverts, et ne cite qu'eux", () => {
  const {f} = ongletSplat(classe8(), {reglages: MONDES_1_2});
  const objectif = f.objectifSplat();
  assert.equal(objectif.total, 4 * 9, "quatre élèves, neuf étapes ouvertes");
  assert.equal(objectif.fait, 9 + 9 + 0 + 0);
  assert.deepEqual(objectif.mondes.map(m => m.numero), [1, 2]);
  assert.deepEqual(objectif.mondes.map(m => m.finis), [2, 2]);
  const tous = ongletSplat(classe8()).f.objectifSplat();
  assert.equal(tous.total, 4 * 40, "sans réglage : les 40 étapes");
  assert.equal(tous.mondes.length, 6);
});

test("mondesOuverts : la liste de la classe, ou null (tous ouverts) — rien de lisible, tout ouvert", () => {
  const lire = reglages => new Function("classe", `${constante("NOMBRE_MONDES")}\n${fonction("mondesOuverts")}\nreturn mondesOuverts();`)(
    reglages === undefined ? null : {reglages});
  assert.deepEqual(lire(MONDES_1_2), [1, 2]);
  assert.deepEqual(lire({splat: {mondes: [2, 9, "3", 0]}}), [2]);
  for (const r of [undefined, {}, {splat: {}}, {splat: {mondes: []}}, {splat: {mondes: [1, 2, 3, 4, 5, 6]}}, {splat: {mondes: "1,2"}}]) {
    assert.equal(lire(r), null, JSON.stringify(r));
  }
});

test("« Activités de la classe » : les six mondes sous SPLAT!, cochés d'après la classe ; cachés sans SPLAT!", () => {
  const sans = poserAppliRejoue(["defi-tables"], "defi-tables");
  assert.equal(sans.$("mondes-ouverts").hidden, true, "pas de SPLAT! : pas de mondes");
  const tous = poserAppliRejoue(["defi-tables", "splat"], "splat");
  assert.equal(tous.$("mondes-ouverts").hidden, false);
  assert.deepEqual(tous.mondes.map(c => c.checked), Array(6).fill(true), "par défaut : tous ouverts");
  assert.deepEqual(tous.mondes.map(c => aClasse(c.puce, "ferme")), Array(6).fill(false));
  const deux = poserAppliRejoue(["defi-tables", "splat"], "splat", "proprietaire", undefined, MONDES_1_2);
  assert.deepEqual(deux.mondes.map(c => c.checked), [true, true, false, false, false, false]);
  assert.deepEqual(deux.mondes.map(c => aClasse(c.puce, "ferme")), [false, false, true, true, true, true]);
  assert.equal(poserAppliRejoue(["defi-tables", "splat"], "splat", "ecriture", undefined, MONDES_1_2, true).$("vue-reglages").hidden, true,
    "un collègue ne choisit pas les mondes (pas de vue Réglages)");
});

function changerMondeRejoue({ouverts = [1, 2, 3, 4, 5, 6], clic, echec = null}) {
  const {$} = creerZones();
  const mondes = casesMondes();
  mondes.forEach((c, i) => { c.checked = ouverts.includes(i + 1); });
  const appels = [], messages = [], erreurs = [];
  let rouvertes = 0;
  const doc = {querySelectorAll: () => mondes};
  const changer = new Function("document", "$", "classe", "api", "ouvrirClasse", "messager", "surErreur",
    `${["poserPuce", "changerMonde"].map(fonction).join("\n")}\nreturn changerMonde;`)(
    doc, $, {id: 7, libelle: "405"},
    async (action, corps) => { appels.push([action, corps]); if (echec) throw echec; return {ok: true}; },
    async () => { rouvertes += 1; },
    (id, t, type) => messages.push([id, t, type]), (e, zone) => erreurs.push([e.message, zone]));
  const cible = mondes[clic - 1];
  cible.checked = !cible.checked;
  return {fin: changer(cible), mondes, appels, messages, erreurs, rouvertes: () => rouvertes};
}

test("fermer un monde : la liste des mondes cochés part au serveur, la classe est relue, un message court", async () => {
  const r = changerMondeRejoue({clic: 3});
  await r.fin;
  assert.deepEqual(r.appels, [["classes.modifier", {classe_id: 7, reglages: {splat: {mondes: [1, 2, 4, 5, 6]}}}]]);
  assert.equal(r.rouvertes(), 1, "la classe est relue : comptes et pastilles suivent");
  assert.deepEqual(r.messages.at(-1), ["message-activites", "Monde 3 fermé pour la 405.", "ok"]);
  assert.ok(r.mondes.every(c => !c.disabled), "les cases redeviennent cliquables");
  const ouvrir = changerMondeRejoue({ouverts: [1, 2], clic: 3});
  await ouvrir.fin;
  assert.deepEqual(ouvrir.appels[0][1].reglages.splat.mondes, [1, 2, 3]);
  assert.deepEqual(ouvrir.messages.at(-1), ["message-activites", "Monde 3 ouvert pour la 405.", "ok"]);
});

test("fermer le dernier monde ouvert : refusé sans appel ; une erreur du serveur remet la case", async () => {
  const dernier = changerMondeRejoue({ouverts: [2], clic: 2});
  await dernier.fin;
  assert.deepEqual(dernier.appels, [], "rien ne part");
  assert.equal(dernier.mondes[1].checked, true, "la case se recoche");
  assert.deepEqual(dernier.messages.at(-1), ["message-activites", "Une classe garde au moins un monde ouvert.", "erreur"]);
  const panne = changerMondeRejoue({clic: 4, echec: new Error("Le serveur doit être mis à niveau.")});
  await panne.fin;
  assert.equal(panne.mondes[3].checked, true, "le monde 4 reste ouvert : rien n'a changé");
  assert.equal(aClasse(panne.mondes[3].puce, "ferme"), false);
  assert.deepEqual(panne.erreurs, [["Le serveur doit être mis à niveau.", "message-activites"]]);
});

test("les six boutons de mondes : ceux de la carte du moteur, dans l'ordre, aux couleurs des mondes", () => {
  const puces = [...page.matchAll(/<label class="puce-monde" data-monde="(\d)"><input type="checkbox" data-monde="(\d)"><i aria-hidden="true">(\d)<\/i>([^<]+)<\/label>/g)];
  assert.equal(puces.length, SPLAT.CARTE.MONDES.length);
  puces.forEach((m, i) => {
    const [numero, nom] = SPLAT.CARTE.MONDES[i];
    assert.deepEqual([m[1], m[2], m[3]].map(Number), [numero, numero, numero]);
    assert.equal(nom.replace(/\s*SPLAT!\s*/, "").trim() || nom, m[4], `le nom court du monde ${numero}`);
  });
  assert.equal(new Function(`${constante("NOMBRE_MONDES")}\nreturn NOMBRE_MONDES;`)(), SPLAT.CARTE.MONDES.length);
  const couleurs = new Function(`${constante("COULEURS_MONDES")}\nreturn COULEURS_MONDES;`)();
  for (let n = 1; n <= 6; n += 1) {
    assert.match(page, new RegExp(`\\.puce-monde\\[data-monde="${n}"\\] \\{ --c: ${couleurs[n]}; \\}`), `couleur du monde ${n}`);
  }
  assert.match(fonction("changerMonde"), /api\("classes\.modifier", \{classe_id: classe\.id, reglages: \{splat: \{mondes: voulus\}\}\}\)/);
});

// ------------------------------------------------------------ lot « Qui voit quoi » (22/10/2026)
//
// Un élève peut avoir des mondes EN PLUS de sa classe (eleve.acces, calculé
// par le serveur, lot 2). Dans l'onglet SPLAT!, sa ligne les montre en
// couleur et les compte dans son « N / M » ; la carte de classe, elle, reste
// comptée sur les mondes de la classe.

const ACCES_1_2_3 = {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2, 3]}}};
const ACCES_1_2 = {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2]}}};

test("qui voit quoi — un monde en plus : en couleur sur SA ligne, compté dans SON « N / M », dit au survol", () => {
  const liste = classe8().map((e, i) => ({...e, acces: i === 0 ? ACCES_1_2_3 : ACCES_1_2}));
  const {lignes} = ongletSplat(liste, {reglages: MONDES_1_2});
  const [lea, maelys] = lignes;
  assert.deepEqual(pastilles(lea).map(etatPastille), ["fini", "fini", "cours", "ferme", "ferme", "ferme"], "le monde 3 de Léa n'est plus gris");
  assert.deepEqual(pastilles(maelys).map(etatPastille), ["fini", "fini", "ferme", "ferme", "ferme", "ferme"], "les autres : comme leur classe");
  const compte = tr => cellules(tr)[C_ETAPES].premier(n => aClasse(n, "pastille")).textContent;
  const bonus = tr => (cellules(tr)[C_ETAPES].premier(n => aClasse(n, "bonus-compte")) || {textContent: ""}).textContent;
  assert.equal(compte(lea), "13 / 24", "9 étapes des mondes 1-2 + 4 du monde 3, sur 9 + 15");
  assert.equal(bonus(lea), "✨ 1", "le Bonus du monde 3 compte aussi, pour elle");
  assert.equal(compte(maelys), "9 / 9");
  const titres = pastilles(lea).map(svg => svg.premier(n => n.tag === "title").textContent);
  assert.equal(titres[2], "Monde 3 · SPLAT! Enquête : 4 / 15 · ouvert en plus de la classe");
  assert.equal(titres[0], "Monde 1 · Petit SPLAT! : 6 / 6", "un monde de la classe : rien de plus au survol");
  assert.equal(titres[3], "Monde 4 · SPLAT! Système : fermé pour la classe");
});

test("qui voit quoi — le Détail d'un élève suit SES mondes : pas de cadenas sur son monde en plus", () => {
  const liste = classe8().map((e, i) => ({...e, acces: i === 0 ? ACCES_1_2_3 : ACCES_1_2}));
  const {corps, lignes} = ongletSplat(liste, {reglages: MONDES_1_2});
  cellules(lignes[0])[C_GESTES].children[0].cliquer();
  const rangees = corps.children[1].tous(n => (n.className || "").startsWith("detail-monde"));
  assert.deepEqual(rangees.map(r => r.premier(n => n.tag === "b").textContent).slice(0, 4),
    ["Monde 1 · Petit SPLAT!", "Monde 2 · SPLAT! Classique", "Monde 3 · SPLAT! Enquête", "🔒 Monde 4 · SPLAT! Système"]);
  assert.deepEqual(rangees.map(r => aClasse(r, "ferme")), [false, false, false, true, true, true, false, true],
    "le Bonus du monde 3 non plus");
});

test("qui voit quoi — la carte de classe reste comptée sur les mondes de la CLASSE", () => {
  const avec = classe8().map((e, i) => ({...e, acces: i === 0 ? ACCES_1_2_3 : ACCES_1_2}));
  const sans = classe8();
  const a = ongletSplat(avec, {reglages: MONDES_1_2}).f.objectifSplat();
  const b = ongletSplat(sans, {reglages: MONDES_1_2}).f.objectifSplat();
  assert.deepEqual(a, b, "le monde 3 de Léa ne change rien à « Notre classe, ensemble »");
  assert.equal(a.total, 4 * 9);
  assert.equal(a.fait, 9 + 9);
  assert.deepEqual(a.mondes.map(m => m.numero), [1, 2]);
  assert.match(fonction("objectifSplat"), /typeof lu\.faitsClasse === "number" \? lu\.faitsClasse : lu\.faits/);
});

test("mondesDeLEleve : ceux du serveur (classe + ajouts), jamais moins que la classe ; sans acces, ceux de la classe", () => {
  const lire = (reglagesClasse, eleve) => new Function("classe", `${constante("NOMBRE_MONDES")}\n${fonction("mondesOuverts")}\n${fonction("mondesDeLEleve")}\nreturn mondesDeLEleve;`)(
    {reglages: reglagesClasse})(eleve);
  assert.deepEqual(lire(MONDES_1_2, {acces: ACCES_1_2_3}), [1, 2, 3]);
  assert.deepEqual(lire(MONDES_1_2, {acces: ACCES_1_2}), [1, 2]);
  assert.deepEqual(lire(MONDES_1_2, {}), [1, 2], "sans acces (serveur d'avant le lot 2) : la classe");
  assert.deepEqual(lire(MONDES_1_2, undefined), [1, 2]);
  assert.equal(lire(MONDES_1_2, {acces: {applis: ["splat"], reglages: {}}}), null, "rien d'écrit pour lui : SPLAT! entière, tous les mondes");
  assert.equal(lire({}, {acces: ACCES_1_2_3}), null, "la classe a tout : lui aussi");
  assert.deepEqual(lire(MONDES_1_2, {acces: {applis: ["splat"], reglages: {splat: {mondes: [4]}}}}), [1, 2, 4],
    "un acces qui dirait moins que la classe est complété par elle : on ne retire jamais");
  assert.equal(lire(MONDES_1_2, {acces: {applis: ["splat"], reglages: {splat: {mondes: [3, 4, 5, 6]}}}}), null, "les six : null");
  assert.deepEqual(lire(MONDES_1_2, {acces: {applis: ["splat"], reglages: {splat: {mondes: [3, "4", 9, 0]}}}}), [1, 2, 3]);
  assert.match(fonction("elevesLus"), /lu: lire\(eleve\.parcours, eleve\)/, "le tableau passe l'élève au lecteur");
});
