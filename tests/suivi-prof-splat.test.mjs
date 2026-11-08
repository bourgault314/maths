import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { reglerRejoue, Noeud as NoeudBanc, caseDe, cocher, caseNumero, lignesPlus, titres, laisser } from "./suivi-regler-banc.mjs";

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

const SOURCES_TABLEAU = ["nomAffiche", "dateLisible", "celluleNomTexte", "celluleDate", "large", "finirLigne", "ficheChiffres", "paragrapheVide",
  "peutRevenir", "boutonGeste", "menuGestes", "placerMenu", "elementSvg", "pastilleMonde", "contenuSplat", "dessinerTableauSplat", "objectifSplat",
  "dessinerObjectifSplat", "resumeDeLaClasse", "lireSplat", "mondesOuverts", "mondesDeLEleve",
  // Lot S4c : la bulle d'une étape (la carte « Par monde » a son test : suivi-s4c-onglets-d-appli).
  "texteEtapeSplat", "jourCourtSemaine", "pluriel", "el", "montrerBulleCase", "cacherBulleCase"].map(fonction).join("\n")
  + "\nfunction dessinerMondesSplat() {}";
const CONSTANTES = ["COULEURS_MONDES", "ETATS_MONDE", "GRIS_FERME", "CASES_ETAPE", "SVG", "NOMBRE_MONDES"].map(constante).join("\n");

function ongletSplat(liste, options = {}) {
  const {zones, $} = creerZones();
  const corps = new Noeud("tbody");
  const messages = [];
  const etat = {ouverts: [], revenir: []};
  const moteur = options.sansMoteur ? null : SPLAT;
  // Lot « splat-suivi-5 » : la classe ouverte porte ses réglages (les mondes ouverts).
  // Lot 5c : la ligne ouvre la fenêtre de l'élève (ouvrirFenetreEleve), dont
  // contenuSplat dessine le contenu.
  const fabrique = new Function("document", "$", "SPLAT", "droitClasse", "messager",
    "dessinerPapier", "classe", "ouvrirFenetreEleve", "appliAffichee", "revenirA", "voirFiche",
    `${CONSTANTES}\nlet eleves = [];\n${SOURCES_TABLEAU}\nreturn {poser: liste => { eleves = liste; }, lireSplat, dessinerTableauSplat, objectifSplat, contenuSplat};`);
  const f = fabrique(document, $, moteur, options.droit || "proprietaire",
    (id, t, type) => messages.push({id, t, type}), () => {},
    {id: 7, libelle: "405", reglages: options.reglages || {}}, eleve => etat.ouverts.push(eleve.prenom),
    "splat", eleve => etat.revenir.push(eleve.prenom), () => { throw new Error("pas de parcours Défi tables depuis SPLAT!"); });
  const eleves = liste.map((e, i) => Object.assign({id: i + 1, code: `CODE0${i}`, initiale: "", restaurable: false, journees: []},
    e, {lu: f.lireSplat(e.parcours, e)}));
  f.poser(eleves);
  f.dessinerTableauSplat(corps, (options.droit || "proprietaire") !== "lecture");
  const lignes = corps.children;
  return {zones, corps, lignes, messages, eleves, f, etat, detail: i => f.contenuSplat(eleves[i])};
}

const classe8 = () => [
  {prenom: "Léa", parcours: LEA, maj_le: "2026-10-07T07:40:00Z"},
  {prenom: "Maëlys", parcours: MAELYS, maj_le: "2026-10-07T12:00:00Z"},
  {prenom: "Tom", parcours: TOM, maj_le: "2026-10-05T08:00:00Z"},
  {prenom: "Yanis", parcours: null, maj_le: null},
];

const cellules = tr => tr.children;
// Les colonnes de l'onglet SPLAT! (sans la colonne Code depuis le lot « Ma classe : élèves »).
// Lot 8 : le « ⋯ » a sa case avant la flèche.
const C_ETAPES = 2, C_DATE = 3, C_GESTE = 4, C_VA = 5;
const COULEUR = n => ({1: "#d9690c", 2: "#0b67b2", 3: "#be185d", 4: "#92400e", 5: "#08857f", 6: "#7b42b4"})[n];
const pastilles = tr => tr.tous(n => n.tag === "svg");
const etatPastille = svg => svg.className.replace("monde-p ", "");

test("l'onglet SPLAT! : six pastilles, les étapes sur 40, ✨ pour les Bonus ; la ligne ouvre la fenêtre de l'élève (lot 5c) — plus de « Détail », pas de « ⋯ » sans version à restaurer (lot 5f)", () => {
  const {lignes} = ongletSplat(classe8());
  assert.equal(lignes.length, 4);
  // Lot « Ma classe : élèves » (18/10/2026) : plus de colonne Code, le prénom en texte.
  lignes.forEach(tr => assert.equal(cellules(tr).length, 6, "Élève · Mondes · Étapes réussies · Dernière activité · « ⋯ » (lot 8) · flèche"));
  lignes.forEach(tr => {
    assert.deepEqual(cellules(tr)[0].children.map(n => `${n.tag}.${n.className}`), ["button.lien-eleve"], "le prénom est un bouton, pas un champ");
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
  assert.equal(cellules(yanis)[C_DATE].textContent, "rien reçu");
  lignes.forEach(tr => {
    assert.equal(cellules(tr)[C_VA].textContent, "›");
    assert.equal(tr.premier(n => n.tag === "details"), null, "rien à restaurer : pas de « ⋯ » (lot 5f : « Revenir à… » y est quand il y a une version)");
    assert.equal(aClasse(cellules(tr)[1], "large"), true, "au téléphone, les mondes se cachent");
  });
  const r = ongletSplat(classe8());
  r.lignes[1].cliquer();
  assert.deepEqual(r.etat.ouverts, ["Maëlys"], "la ligne entière ouvre la fenêtre de l'élève");
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

test("la fenêtre de l'élève (lot 5c, l'ancien Détail) : ses chiffres, une rangée par monde, les Bonus à part, la légende", () => {
  const r = ongletSplat(classe8());
  const detail = r.detail(0);
  const chiffres = detail.premier(n => n.tag === "dl").children.map(div => div.children.map(x => x.textContent));
  assert.deepEqual(chiffres, [["Étapes réussies", "13 / 40"], ["Bonus", "✨ 1"], ["Dernière activité", chiffres[2][1]]]);
  assert.match(chiffres[2][1], /^\S+\. \d\d\/\d\d$|^\d/, "le jour de la dernière activité");
  assert.equal(r.detail(3).textContent, "Rien reçu pour l’instant.", "Yanis : rien reçu");
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
    ["réussie", "réussie avec des réponses vues", "en cours", "pas encore faite", "bonus", "· toucher une étape : son détail"],
    "lot S4c : la légende dit qu'une étape se touche");
});

// Échauffement du monde 6 (14/10/2026, décision de Gwenaël : « dans le total »).
test("échauffement : É1-É3 comptent au monde 6 ; un élève qui l'avait fini passe à 6 / 9, à moitié", () => {
  const ancien = parcours(faits(M6));
  const echauffe = parcours({...faits(M6), ...faits(["ech1"])});
  const {lignes, detail} = ongletSplat([{prenom: "Inès", parcours: ancien, maj_le: "2026-10-14T08:00:00Z"}, {prenom: "Noé", parcours: echauffe, maj_le: "2026-10-14T08:00:00Z"}]);
  const compte = tr => cellules(tr)[C_ETAPES].premier(n => aClasse(n, "pastille")).textContent;
  assert.deepEqual(lignes.map(compte), ["6 / 40", "7 / 40"]);
  assert.deepEqual(lignes.map(tr => etatPastille(pastilles(tr)[5])), ["cours", "cours"]);
  assert.deepEqual(lignes.map(tr => pastilles(tr)[5].premier(n => n.tag === "title").textContent),
    ["Monde 6 · SPLAT! Relatifs : 6 / 9", "Monde 6 · SPLAT! Relatifs : 7 / 9"]);
  const m6 = detail(1).tous(n => aClasse(n, "detail-monde"))[5];
  assert.deepEqual(m6.children.slice(1).map(c => [c.textContent, c.className]).slice(0, 4),
    [["É1", "et ok"], ["É2", "et"], ["É3", "et"], ["38", "et ok"]]);
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

test("sans moteur : l'onglet le dit, chaque ligne reste lisible, pas de carte", () => {
  const {lignes, messages, zones} = ongletSplat(classe8(), {sansMoteur: true});
  assert.equal(lignes.length, 4);
  lignes.forEach(tr => {
    assert.equal(cellules(tr)[C_ETAPES].textContent, "—");
  });
  assert.equal(zones.get("objectif").hidden, true);
  assert.ok(messages.some(m => m.id === "message-appli" && /prof\/splat-parcours\.js/.test(m.t) && m.type === "erreur"),
    "le message de l'activité, au-dessus de son tableau");
});

test("en lecture seule : pas de code, pas de saisie, pas de « ⋯ » vide", () => {
  const {lignes} = ongletSplat(classe8().map(e => ({...e, code: null, restaurable: true})), {droit: "lecture"});
  lignes.forEach(tr => {
    assert.equal(cellules(tr).length, 6, "pas de colonne Code (la case du « ⋯ » reste, vide)");
    assert.equal(cellules(tr)[0].tous(n => n.tag === "input").length, 0, "pas de champ de saisie");
    assert.equal(tr.premier(n => n.tag === "details"), null, "lecture seule : pas de « ⋯ » (« Revenir à… » est en écriture)");
  });
});

test("c'est le moteur qui lit le parcours : la page ne touche jamais aux étapes elle-même", () => {
  const lecteur = fonction("lireSplat");
  assert.match(lecteur, /SPLAT\.resumeProf\(brut \|\| null\)/);
  const splat = lecteur + sectionSplat;
  // Lot S4c : une seule lecture d'étape, dans le parcours RELU par le moteur
  // (SPLAT.normaliser), pour la bulle d'une case.
  assert.match(splat, /const normalise = SPLAT\.normaliser\(eleve\.parcours \|\| null\);/);
  assert.doesNotMatch(splat.replace("normalise.etapes[etape[0]]", ""), /(?:brut|parcours)\.etapes|\.etapes\[/, "pas de lecture de parcours.etapes dans la page");
  // Lot S4c : les champs d'une étape ne se lisent que dans texteEtapeSplat
  // (la bulle), sur l'étape relue par le moteur ; « Par monde » lit les
  // réponses vues du journal rendu par le moteur (resumeSuivi).
  assert.doesNotMatch(splat.replace(fonction("texteEtapeSplat"), "").replace(fonction("dessinerMondesSplat"), ""), /\.(?:vues|idx|etoiles|essais|cartes)\b/, "les champs d'une étape ne sont lus que par le moteur");
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
  // Défi calcul (lot 2b, 31/10/2026) après Anzan, comme au catalogue.
  assert.deepEqual(APPLIS.map(a => a.cle), ["defi-tables", "coffres", "flash-anzan", "defi-calcul", "splat"]);
  APPLIS.forEach(appli => {
    const entree = catalogue.slice(catalogue.indexOf(`'${appli.cle}' => [`));
    const bloc = entree.slice(0, entree.indexOf("\n    ],"));
    assert.match(bloc, /'disponible' => true,/, `${appli.cle} disponible au catalogue`);
    assert.ok(proposables.includes(appli.cle), `${appli.cle} proposée par l'API`);
    const compteur = bloc.match(/'compteur' => '(\w+)'/)[1];
    assert.equal({calculs: "calculs", etapes: "étapes", niveaux: "niveaux commencés", seances: "séances"}[compteur], appli.unite[1], "« Revenir à… » compte ce que compte le serveur");
  });
  assert.deepEqual(APPLIS.map(a => a.cle), ordre.filter(c => APPLIS.some(a => a.cle === c)));
  // Le HTML suit la même liste : les onglets. Serveur pro, lot 5b : plus de
  // cases d'activité dans Réglages — chaque appli se règle dans son onglet.
  const boutons = [...page.matchAll(/<button type="button" data-appli="([\w-]+)" aria-pressed="(\w+)">([^<]+)<\/button>/g)];
  assert.deepEqual(boutons.map(m => [m[1], m[3]]), APPLIS.map(a => [a.cle, a.nom]));
  assert.doesNotMatch(page, /class="activite-tete"|id="bloc-activites"/);
  // Lot « Ma classe : réglages » : les onglets sont TOUJOURS là (avant, le
  // choix n'apparaissait qu'avec deux activités, et rien ne disait de quelle
  // appli était le tableau).
  // Serveur pro, lot 5a : la rangée des applis est un .onglets de la charte (une ligne qui défile).
  assert.match(page, /<div class="onglets" id="choix-appli" role="group" aria-label="Activité affichée">/,
    "toujours là, même avec une seule activité");
  assert.match(page, /<button type="button" class="onglet-reglages" id="onglet-reglages" aria-pressed="false" aria-label="Réglages" title="[^"]+" hidden>/,
    "« Réglages » : caché tant que le droit n'est pas connu");
  assert.match(page, /<button type="button" class="onglet-eleves" id="onglet-eleves" aria-pressed="false" aria-label="Élèves" title="[^"]+" hidden>/,
    "« Élèves » : caché tant que le droit n'est pas connu");
  const entete = page.slice(page.indexOf('<tr id="entete-splat" hidden>'), page.indexOf("</tr>", page.indexOf('<tr id="entete-splat"')));
  assert.deepEqual([...entete.matchAll(/<th(?: class="(\w+)")?>(?:<button type="button" data-tri="(\w+)">)?([^<]*)/g)].map(m => `${m[3]}${m[2] ? `:${m[2]}` : ""}${m[1] ? ` (${m[1]})` : ""}`),
    ["Élève:prenom", "Mondes (large)", "Étapes réussies:etapes", "Dernière activité:date", "", " (fin)"], "lot 5c : les mondes se cachent au téléphone ; lot 8 : le « ⋯ » puis la flèche");
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
  assert.match(fonction("ouvrirClasse"), /api\("tableau", \{classe_id: id, appli: voulue\}, \{signal\}\)/, "le tableau lu est celui de l'activité montrée (borné par le signal de l'appelant, correctif 5b)");
  assert.match(fonction("ouvrirClasse"), /const voulue = memeClasse && APPLIS\.some\(appli => appli\.cle === appliAffichee\)\s*\? appliAffichee\s*: appliAMontrer\(lesApplisConnues\(connue \? connue\.applis : \["defi-tables"\]\), lireChoixAppli\(\)\);/,
    "rouvrir la même classe garde l'onglet, même s'il vient d'être grisé (lot 5b) ; une autre classe : le dernier choix si elle l'a");
  assert.match(fonction("ouvrirClasse"), /if \(!memeClasse && presentes\.length && !presentes\.includes\(voulue\)\) \{ poserAppli\(\); await afficherAppli\(presentes\[0\]\); return true; \}/,
    "une AUTRE classe s'ouvre sur une appli qu'elle a vraiment");
  assert.match(fonction("afficherAppli"), /retenirChoixAppli\(cle\);/);
  assert.match(script, /const CLE_APPLI = "mathsgo-suivi-prof-appli";/);
  assert.match(fonction("lireChoixAppli"), /sessionStorage\.getItem\(CLE_APPLI\)/, "retenu le temps de l'onglet, pas plus");
  assert.match(fonction("deconnecter"), /sessionStorage\.removeItem\(CLE_APPLI\)/);
});

// Serveur pro, lot 5b : chaque appli a TOUJOURS son onglet — en clair si la
// classe ou un élève l'a, grisé sinon ; « Anzan 1 » quand un seul élève l'a.
// (Lot S4b : poserVue ferme aussi la liste des prénoms — garderPopEleves, ici sans effet.)
function poserAppliRejoue(applis, appliAffichee, droit = "proprietaire", triAvant = {colonne: "acquises", sens: -1}, reglages = {}, vueAvant = "appli", eleves = []) {
  const {$} = creerZones();
  const boutons = ["defi-tables", "coffres", "flash-anzan", "splat"].map(cle => Object.assign(new NoeudBanc("button"), {dataset: {appli: cle}}));
  const doc = Object.assign({}, document, {createElement: t => new NoeudBanc(t), querySelectorAll: s => (s.startsWith("#tableau") ? [] : s.startsWith("#choix-appli") ? boutons : [])});
  const TRIS = {"defi-tables": ["prenom", "acquises", "date"], "splat": ["prenom", "etapes", "date"]};
  const lus = {records: 0, evaluations: 0, quiVoit: 0};
  const etat = new Function("document", "$", "classe", "appliAffichee", "droitClasse", "TRIS", "APPLIS", "triInitial", "vueInitiale", "lus", "eleves",
    `let tri = triInitial;\nlet vue = vueInitiale;\nlet periodeCoffres = "debut";\n${["el", "nomDeLAppli", "parLaClasse", "accesDe", "lesApplisConnues", "applisDeLaClasse", "applisAMontrer", "poserOnglets", "poserAppli", "poserVue", "poserTris"].map(fonction).join("\n")}\nfunction montrerOngletChoisi() {}\nfunction garderPopEleves() {}\nfunction chargerRecords() { lus.records += 1; }\nfunction poserEvaluations() { lus.evaluations += 1; }\nfunction poserQuiVoit() { lus.quiVoit += 1; }\nposerAppli();\nreturn {tri, vue};`)(
    doc, $, {applis, reglages}, appliAffichee, droit, TRIS, [{cle: "defi-tables", nom: "Défi tables"}, {cle: "coffres", nom: "Coffres magiques"}, {cle: "flash-anzan", nom: "Anzan"}, {cle: "splat", nom: "SPLAT!"}], triAvant, vueAvant === true ? "reglages" : vueAvant, lus, eleves);
  const vus = boutons.map(b => [b.hidden, b.attributs["aria-pressed"], b.classList.contains("eteint") ? "gris" : "clair", (b.premier(n => n.classList.contains("compte-plus")) || {textContent: ""}).textContent]);
  return {$, boutons, vus, tri: etat.tri, vue: etat.vue, vueReglages: etat.vue === "reglages", lus};
}

test("chaque appli a toujours son onglet (lot 5b) : en clair si la classe l'a, grisé sinon ; l'onglet SPLAT! change l'en-tête, les tris, et cache ce qui est à Défi tables", () => {
  const seule = poserAppliRejoue(["defi-tables"], "defi-tables");
  assert.notEqual(seule.$("choix-appli").hidden, true, "une seule activité : les onglets sont là quand même");
  assert.deepEqual(seule.vus, [[false, "true", "clair", ""], [false, "false", "gris", ""], [false, "false", "gris", ""], [false, "false", "gris", ""]],
    "l'onglet Défi tables, souligné ; Coffres, Anzan et SPLAT! grisés (fermés à la classe)");
  assert.deepEqual(seule.boutons.map(b => b.attributs["aria-label"] || ""), ["", "Coffres magiques, fermé à la classe", "Anzan, fermé à la classe", "SPLAT!, fermé à la classe"]);
  assert.equal(seule.$("entete-splat").hidden, true);
  assert.equal(seule.$("bloc-imprimer").hidden, false);
  const deux = poserAppliRejoue(["defi-tables", "splat"], "splat");
  assert.equal(deux.$("choix-appli").hidden, false);
  assert.deepEqual(deux.vus, [[false, "false", "clair", ""], [false, "false", "gris", ""], [false, "false", "gris", ""], [false, "true", "clair", ""]]);
  assert.equal(deux.$("entete-defi-tables").hidden, true);
  assert.equal(deux.$("entete-splat").hidden, false);
  assert.equal(deux.$("bloc-imprimer").hidden, true, "« À imprimer » (papiers de Défi tables) caché");
  assert.equal(deux.$("fragiles").hidden, true, "« Les calculs qui coincent » caché");
  assert.deepEqual(deux.tri, {colonne: "prenom", sens: 1}, "un tri qui n'existe pas dans l'onglet revient au prénom");
  assert.equal(poserAppliRejoue(["defi-tables", "splat"], "splat", "proprietaire", {colonne: "date", sens: -1}).tri.colonne, "date",
    "« Dernière activité » existe des deux côtés : il reste");
  // Hors Réglages : la vue de l'activité, ses cartes lues, la ligne « qui voit ».
  assert.equal(deux.$("vue-appli").hidden, false);
  assert.equal(deux.$("vue-reglages").hidden, true);
  assert.equal(deux.$("vue-eleves").hidden, true);
  assert.equal(deux.$("onglet-reglages").attributs["aria-pressed"], "false");
  assert.equal(deux.$("onglet-eleves").attributs["aria-pressed"], "false");
  assert.deepEqual(deux.lus, {records: 1, evaluations: 1, quiVoit: 1});
  // Une appli grisée s'affiche quand même (sa carte « … est fermé à la 405 ») : l'onglet regardé est souligné.
  assert.deepEqual(poserAppliRejoue(["defi-tables"], "coffres").vus[1], [false, "true", "gris", ""]);
});

test("lot 4b, revu aux lots 5b et 8 : une appli qu'un élève a EN PLUS est en clair, SANS pastille (lot 8) ; le lecteur d'écran entend leur nombre ; l'onglet Anzan a son en-tête", () => {
  const rania = {id: 1, prenom: "Rania", acces: {applis: ["defi-tables", "flash-anzan", "splat"], reglages: {}}};
  const lucas = {id: 2, prenom: "Lucas", acces: {applis: ["defi-tables", "splat"], reglages: {}}};
  const sans = poserAppliRejoue(["defi-tables", "splat"], "defi-tables", "proprietaire", undefined, {}, "appli", [lucas]);
  assert.deepEqual(sans.vus.map(v => v[2]), ["clair", "gris", "gris", "clair"], "personne n'a Anzan : grisé");
  const avec = poserAppliRejoue(["defi-tables", "splat"], "flash-anzan", "proprietaire", undefined, {}, "appli", [lucas, rania]);
  // Lot 8 (retours du 31/10/2026) : plus de pastille « 1 » — la ligne de
  // l'onglet dit qui voit l'appli (« ● Ouvert à quelques élèves · Rania »).
  assert.deepEqual(avec.vus, [[false, "false", "clair", ""], [false, "false", "gris", ""], [false, "true", "clair", ""], [false, "false", "clair", ""]],
    "l'onglet Anzan, entre Coffres et SPLAT!, souligné, en clair, sans pastille");
  assert.equal(avec.boutons[2].attributs["aria-label"], "Anzan, ouvert à 1 élève");
  assert.equal(avec.boutons[2].premier(n => n.classList.contains("compte-plus")), null, "pas de pastille (lot 8)");
  assert.doesNotMatch(page, /compte-plus/, "ni dans la page, ni dans son style");
  assert.equal(avec.$("entete-anzan").hidden, false);
  assert.equal(avec.$("entete-defi-tables").hidden, true);
  assert.equal(avec.$("entete-coffres").hidden, true);
  assert.equal(avec.$("bloc-imprimer").hidden, true, "« À imprimer » est à Défi tables");
  assert.equal(avec.$("objectif").hidden, true, "pas de carte de classe pour Anzan");
  assert.equal(avec.$("fragiles").hidden, true);
  // Deux élèves : « 2 », au pluriel.
  const deux = poserAppliRejoue(["defi-tables"], "defi-tables", "proprietaire", undefined, {}, "appli", [rania, {...lucas, acces: rania.acces}]);
  assert.equal(deux.vus[2][3], "");
  assert.equal(deux.boutons[2].attributs["aria-label"], "Anzan, ouvert à 2 élèves");
  assert.equal(deux.vus[3][2], "clair", "SPLAT!, que la classe n'a pas, est ouvert à ces deux élèves : en clair");
  assert.equal(deux.boutons[3].attributs["aria-label"], "SPLAT!, ouvert à 2 élèves");
  // La classe l'a : pas de pastille, même si des élèves l'ont aussi.
  assert.equal(poserAppliRejoue(["defi-tables", "flash-anzan"], "defi-tables", "proprietaire", undefined, {}, "appli", [rania]).vus[2][3], "");
  // Sans « acces » (un serveur d'avant le lot 2 de Qui voit quoi) : la classe seule.
  assert.deepEqual(poserAppliRejoue(["defi-tables"], "defi-tables", "proprietaire", undefined, {}, "appli", [{id: 3}]).vus.map(v => v[2]), ["clair", "gris", "gris", "gris"]);
  // Une appli inconnue de la page (« defi-calcul ») ne fait pas d'onglet : il n'y a pas de bouton pour elle.
  assert.deepEqual(poserAppliRejoue(["defi-tables"], "defi-tables", "proprietaire", undefined, {}, "appli",
    [{id: 4, acces: {applis: ["defi-tables", "defi-calcul"], reglages: {}}}]).vus.map(v => v[2]), ["clair", "gris", "gris", "gris"]);
});

test("lot « Ma classe : réglages » : la vue Réglages remplace celle de l'activité, propriétaire seulement", () => {
  const reglages = poserAppliRejoue(["defi-tables", "splat"], "splat", "proprietaire", undefined, {}, true);
  assert.equal(reglages.vueReglages, true);
  assert.equal(reglages.$("vue-appli").hidden, true, "le tableau n'est plus à l'écran");
  assert.equal(reglages.$("vue-reglages").hidden, false);
  assert.equal(reglages.$("onglet-reglages").attributs["aria-pressed"], "true");
  assert.deepEqual(reglages.boutons.map(b => b.attributs["aria-pressed"]), ["false", "false", "false", "false"], "aucun onglet d'activité souligné");
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
  assert.match(fonction("ouvrirClasse"), /if \(!memeClasse\) \{\s*\/\/[^\n]*\n\s*oublierRecherche\(\);\s*fermerFenetreEleve\(\);\s*vue = /, "une autre classe s'ouvre sur son tableau");
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

// ------------------------------------------------------------ ouvrir ou fermer une appli à la classe (lot 5b : « Régler … »)
//
// Avant le lot 5b, une case par appli dans ⚙ Réglages › Activités, qui
// s'enregistrait au clic. Maintenant la case « Ouvert à toute la 405 » de la
// fenêtre « Régler SPLAT! » (banc suivi-regler-banc.mjs : les vraies
// fonctions, un faux serveur) — rien ne part avant « Enregistrer ».

const classe405 = (applis, reglages = {}) => ({id: 4, libelle: "405", applis, reglages});
const deuxEleves = () => [{id: 1, prenom: "Léa"}, {id: 2, prenom: "Noé"}];

test("ouvrir SPLAT! à la classe : la liste de la classe part à « Enregistrer », la classe est relue, un mot court", async () => {
  const r = reglerRejoue({classe: classe405(["defi-tables"]), eleves: deuxEleves(), appli: "splat"});
  r.f.ouvrirRegler("splat");
  cocher(caseDe(r.corps(), "Ouvert à toute la 405"), true);
  assert.deepEqual(r.serveur.appels, [], "rien ne part au clic");
  assert.deepEqual(r.questions, [], "ajouter ne demande rien");
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [["classes.modifier", {classe_id: 4, applis: ["defi-tables", "splat"], avant: {applis: ["defi-tables"], reglages: {splat: {}}}}]],
    "avec « avant » (correctif 5b) : la liste et les réglages de SPLAT! tels que la page les connaît");
  assert.deepEqual(r.journal, ["ouvrirClasse 4"], "la classe est relue : l'onglet SPLAT! passe en clair");
  assert.deepEqual([r.$("message-appli").textContent, r.$("message-appli").className], ["SPLAT! : réglages enregistrés (la 405).", "message ok"]);
  assert.equal(r.boite().open, false);
});

test("fermer SPLAT! à la classe : on demande d'abord, on dit que rien n'est effacé ; « Annuler » ne change rien", async () => {
  const non = reglerRejoue({classe: classe405(["defi-tables", "splat"]), eleves: deuxEleves(), appli: "splat", reponses: [null]});
  non.f.ouvrirRegler("splat");
  cocher(caseDe(non.corps(), "Ouvert à toute la 405"), false);
  await non.f.enregistrerRegler();
  assert.deepEqual(non.questions.map(q => [q.texte, q.oui]), [["Retirer SPLAT! de la classe 405 ? La tuile disparaît de l’espace des élèves. Leur travail reste enregistré : rien n’est effacé.", "Retirer de la classe"]]);
  assert.deepEqual(non.serveur.appels, [], "rien ne part sans un oui");
  assert.equal(non.boite().open, true, "la fenêtre reste ouverte, telle qu'on l'a laissée");
  const oui = reglerRejoue({classe: classe405(["defi-tables", "splat"]), eleves: deuxEleves(), appli: "splat"});
  oui.f.ouvrirRegler("splat");
  cocher(caseDe(oui.corps(), "Ouvert à toute la 405"), false);
  await oui.f.enregistrerRegler();
  assert.deepEqual(oui.serveur.appels.map(a => a.corps), [{classe_id: 4, applis: ["defi-tables"], avant: {applis: ["defi-tables", "splat"], reglages: {splat: {}}}}], "seulement la liste (et « avant ») : les mondes de la classe restent rangés");
  assert.equal(oui.f.etat().appliAffichee, "splat", "on reste dans l'onglet, désormais grisé");
  // Ce que la phrase promet est vrai : classes.modifier ne touche qu'à la liste.
  const api = lire("_serveur/public/api/prof.php");
  const modifier = api.slice(api.indexOf("case 'classes.modifier':"), api.indexOf("case 'classes.supprimer':"));
  assert.doesNotMatch(modifier, /DELETE|progressions/, "décocher n'efface aucune progression");
});

test("une classe garde au moins une activité ; une activité que la page ne montre pas n'est pas perdue ; une panne remet la fenêtre sur l'état relu", async () => {
  const seule = reglerRejoue({classe: classe405(["splat"]), eleves: deuxEleves(), appli: "splat"});
  seule.f.ouvrirRegler("splat");
  cocher(caseDe(seule.corps(), "Ouvert à toute la 405"), false);
  await seule.f.enregistrerRegler();
  assert.deepEqual(seule.serveur.appels, [], "rien ne part");
  assert.deepEqual(seule.questions, []);
  assert.deepEqual([seule.$("regler-message").textContent, seule.$("regler-message").className], ["Une classe garde au moins une activité.", "message erreur"]);
  assert.equal(seule.boite().open, true);
  const autre = reglerRejoue({classe: classe405(["defi-tables", "automatismes"]), eleves: deuxEleves(), appli: "splat"});
  autre.f.ouvrirRegler("splat");
  cocher(caseDe(autre.corps(), "Ouvert à toute la 405"), true);
  await autre.f.enregistrerRegler();
  assert.deepEqual(autre.serveur.appels[0].corps.applis, ["defi-tables", "automatismes", "splat"], "« automatismes » (pas encore montrée ici) reste dans la liste");
  const panne = reglerRejoue({classe: classe405(["defi-tables"]), eleves: deuxEleves(), appli: "splat"});
  panne.serveur.panne("classes.modifier", panne.serveur.erreur("Le serveur a eu un souci.", 500));
  panne.f.ouvrirRegler("splat");
  cocher(caseDe(panne.corps(), "Ouvert à toute la 405"), true);
  await panne.f.enregistrerRegler();
  assert.equal(panne.boite().open, true, "la fenêtre reste");
  assert.equal(caseDe(panne.corps(), "Ouvert à toute la 405").checked, false, "redessinée sur l'état relu : la classe n'a toujours pas SPLAT!");
  assert.equal(panne.$("regler-message").textContent,
    "Rien d’enregistré pour la 405 : Le serveur a eu un souci. La fenêtre montre ce qui est enregistré maintenant : refais ce qui manque.");
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

test("à la déconnexion, l'onglet, les Réglages et la fenêtre « Régler … » partent avec le reste", () => {
  const zones = new Function(`${constante("ZONES_MESSAGE")}\n${constante("BLOCS_A_CACHER")}\nreturn {ZONES_MESSAGE, BLOCS_A_CACHER};`)();
  for (const id of ["regler-message", "message-partage", "message-nom", "message-supprimer"]) assert.ok(zones.ZONES_MESSAGE.includes(id), id);
  for (const id of ["qui-voit", "appli-fermee"]) assert.ok(zones.BLOCS_A_CACHER.includes(id), id);
  // Lot « Ma classe : réglages » : les blocs du propriétaire sont DANS la vue
  // Réglages ; c'est elle (et son onglet) qu'on cache.
  assert.ok(zones.BLOCS_A_CACHER.includes("vue-reglages"));
  assert.ok(zones.BLOCS_A_CACHER.includes("onglet-reglages"));
  // DANS la vue, pas seulement plus bas dans le fichier : entre l'ouverture
  // de la vue et l'élément, les <div> ne se referment jamais toutes.
  const debut = page.indexOf('<div class="reglages" id="vue-reglages" hidden>');
  assert.ok(debut > 0);
  for (const id of ["bloc-partage", "form-nom-classe", "supprimer-classe"]) {
    const position = page.indexOf(`id="${id}"`, debut);
    assert.ok(position > debut, `${id} après l'ouverture de la vue`);
    let profondeur = 0;
    for (const balise of page.slice(debut, position).matchAll(/<div\b|<\/div>/g)) {
      profondeur += balise[0] === "</div>" ? -1 : 1;
      assert.ok(profondeur > 0, `${id} est DANS la vue Réglages`);
    }
  }
  const oublier = fonction("oublierEtat");
  assert.match(oublier, /appliAffichee = "defi-tables";\s*vue = "appli";\s*tableaux = \{\};\s*recherche = "";\s*fenetreEleveId = null;/);
  assert.match(oublier, /reglage = null;\s*reglageEnCours = false;/);
  assert.doesNotMatch(page, /id="bloc-activites"|id="rec-reglage"|id="mondes-ouverts"|id="message-activites"/, "lot 5b : plus de carte « Activités »");
});

// ------------------------------------------------------------ lot « splat-suivi-5 »
//
// Les mondes de SPLAT! ouverts, classe par classe (08/10/2026, choix de
// Gwenaël sur maquettes) : un bouton par monde (depuis le lot 5b, dans la
// fenêtre « Régler SPLAT! ») ; dans l'onglet SPLAT!, les mondes fermés en gris
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
  const detail = ongletSplat(classe8(), {reglages: MONDES_1_2}).detail(0);
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

test("« Régler SPLAT! » : les six mondes en puces, cochés d'après la classe ; sans SPLAT! pour la classe, pas de mondes ; un collègue ne règle rien", () => {
  const eleves = deuxEleves();
  const sans = reglerRejoue({classe: classe405(["defi-tables"], MONDES_1_2), eleves, appli: "splat"});
  sans.f.ouvrirRegler("splat");
  assert.equal(sans.corps().tous(n => n.classList.contains("puce-monde")).length, 0, "la classe n'a pas SPLAT! : pas de mondes, des élèves à choisir");
  assert.deepEqual(titres(sans.corps()), ["Ou seulement pour quelques élèves"]);
  const tous = reglerRejoue({classe: classe405(["defi-tables", "splat"]), eleves, appli: "splat"});
  tous.f.ouvrirRegler("splat");
  const puces = r => r.corps().tous(n => n.classList.contains("puce-monde"));
  assert.deepEqual(puces(tous).map(p => p.premier(n => n.tag === "input").checked), Array(6).fill(true), "par défaut : tous ouverts");
  assert.deepEqual(puces(tous).map(p => p.classList.contains("ferme")), Array(6).fill(false));
  assert.equal(tous.corps().premier(n => n.tag === "p" && n.className === "aide").textContent, "Tous les mondes sont ouverts à la 405 : rien à ajouter.");
  const deux = reglerRejoue({classe: classe405(["defi-tables", "splat"], MONDES_1_2), eleves, appli: "splat"});
  deux.f.ouvrirRegler("splat");
  assert.deepEqual(puces(deux).map(p => p.premier(n => n.tag === "input").checked), [true, true, false, false, false, false]);
  assert.deepEqual(puces(deux).map(p => p.classList.contains("ferme")), [false, false, true, true, true, true]);
  assert.deepEqual(titres(deux.corps()), ["Pour la classe", "Un monde en plus pour quelques élèves"]);
  assert.deepEqual(lignesPlus(deux.corps()).map(l => l.premier(n => n.className === "quoi").textContent), ["3Enquête", "4Système", "5Équations", "6Relatifs"],
    "une ligne par monde FERMÉ à la classe");
  for (const droit of ["ecriture", "lecture"]) {
    const collegue = reglerRejoue({classe: classe405(["defi-tables", "splat"], MONDES_1_2), eleves, appli: "splat", droit});
    collegue.f.ouvrirRegler("splat");
    assert.equal(collegue.boite().open, false, `${droit} : la fenêtre ne s'ouvre pas`);
  }
});

test("fermer un monde : la liste des mondes cochés part à « Enregistrer », la classe est relue, un message court", async () => {
  const r = reglerRejoue({classe: classe405(["defi-tables", "splat"]), eleves: deuxEleves(), appli: "splat"});
  r.f.ouvrirRegler("splat");
  cocher(caseNumero(r.corps(), "mondes", 3), false);
  assert.equal(caseNumero(r.corps(), "mondes", 3).parent.classList.contains("ferme"), true, "la puce passe en pointillés tout de suite");
  assert.equal(caseNumero(r.corps(), "mondes", 3).focalise, true, "la fenêtre redessinée rend la main à la même puce");
  assert.deepEqual(lignesPlus(r.corps()).length, 1, "le monde 3 fermé : sa ligne « en plus » apparaît");
  assert.deepEqual(r.serveur.appels, []);
  await r.f.enregistrerRegler();
  assert.deepEqual(r.serveur.appels.map(a => [a.action, a.corps]), [["classes.modifier", {classe_id: 4, reglages: {splat: {mondes: [1, 2, 4, 5, 6]}}, avant: {applis: ["defi-tables", "splat"], reglages: {splat: {}}}}]]);
  assert.deepEqual(r.journal, ["ouvrirClasse 4"], "la classe est relue : comptes et pastilles suivent");
  assert.equal(r.$("message-appli").textContent, "SPLAT! : réglages enregistrés (la 405).");
  const ouvrir = reglerRejoue({classe: classe405(["defi-tables", "splat"], MONDES_1_2), eleves: deuxEleves(), appli: "splat"});
  ouvrir.f.ouvrirRegler("splat");
  cocher(caseNumero(ouvrir.corps(), "mondes", 3), true);
  await ouvrir.f.enregistrerRegler();
  assert.deepEqual(ouvrir.serveur.appels[0].corps.reglages.splat.mondes, [1, 2, 3]);
});

test("fermer le dernier monde ouvert : refusé sans appel, la puce reste cochée ; décocher puis recocher ne change rien et n'envoie rien", async () => {
  const dernier = reglerRejoue({classe: classe405(["defi-tables", "splat"], {splat: {mondes: [2]}}), eleves: deuxEleves(), appli: "splat"});
  dernier.f.ouvrirRegler("splat");
  const deux = caseNumero(dernier.corps(), "mondes", 2);
  cocher(deux, false);
  assert.equal(deux.checked, true, "la case se recoche");
  assert.deepEqual([dernier.$("regler-message").textContent, dernier.$("regler-message").className], ["Une classe garde au moins un monde ouvert.", "message erreur"]);
  await dernier.f.enregistrerRegler();
  assert.deepEqual(dernier.serveur.appels, [], "rien ne part : rien n'a changé");
  assert.equal(dernier.boite().open, false, "rien à enregistrer : la fenêtre se ferme");
  const allerRetour = reglerRejoue({classe: classe405(["defi-tables", "splat"]), eleves: deuxEleves(), appli: "splat"});
  allerRetour.f.ouvrirRegler("splat");
  cocher(caseNumero(allerRetour.corps(), "mondes", 4), false);
  cocher(caseNumero(allerRetour.corps(), "mondes", 4), true);
  await allerRetour.f.enregistrerRegler();
  assert.deepEqual(allerRetour.serveur.appels, []);
});

test("les six puces de mondes : ceux de la carte du moteur, dans l'ordre, aux couleurs des mondes", () => {
  const r = reglerRejoue({classe: classe405(["defi-tables", "splat"]), eleves: deuxEleves(), appli: "splat"});
  r.f.ouvrirRegler("splat");
  const puces = r.corps().tous(n => n.classList.contains("puce-monde"));
  assert.equal(puces.length, SPLAT.CARTE.MONDES.length);
  puces.forEach((puce, i) => {
    const [numero, nom] = SPLAT.CARTE.MONDES[i];
    assert.equal(puce.dataset.monde, String(numero));
    assert.equal(puce.premier(n => n.tag === "input").dataset.numero, String(numero));
    assert.equal(puce.premier(n => n.tag === "i").textContent, String(numero));
    assert.equal(puce.textContent, `${numero}${nom.replace(/\s*SPLAT!\s*/, "").trim() || nom}`, `le nom court du monde ${numero}`);
  });
  assert.equal(new Function(`${constante("NOMBRE_MONDES")}\nreturn NOMBRE_MONDES;`)(), SPLAT.CARTE.MONDES.length);
  const couleurs = new Function(`${constante("COULEURS_MONDES")}\nreturn COULEURS_MONDES;`)();
  for (let n = 1; n <= 6; n += 1) {
    assert.match(page, new RegExp(`\\.puce-monde\\[data-monde="${n}"\\] \\{ --c: ${couleurs[n]}; \\}`), `couleur du monde ${n}`);
  }
  // Les lignes « en plus » : le rond du monde dans sa couleur.
  const ferme = reglerRejoue({classe: classe405(["defi-tables", "splat"], MONDES_1_2), eleves: deuxEleves(), appli: "splat"});
  ferme.f.ouvrirRegler("splat");
  assert.deepEqual(lignesPlus(ferme.corps()).map(l => l.premier(n => n.className === "rond-monde").style.background), [3, 4, 5, 6].map(n => couleurs[n]));
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
  const rangees = ongletSplat(liste, {reglages: MONDES_1_2}).detail(0).tous(n => (n.className || "").startsWith("detail-monde"));
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
