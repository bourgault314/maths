// « Suivre ses élèves », lot S4b « des chiffres aux élèves » (08/11/2026).
//
//  1. « 5 élèves » se touche — calculs qui coincent (Défi tables), « À
//     reprendre en classe » (Défi calcul), barres de « Où en est la classe »
//     — et montre les prénoms PAR-DESSUS la page ; un prénom ouvre la fiche ;
//     la fiche fermée, la liste est toujours là (rien ne bouge).
//  2. Défi calcul, dans la fiche : le nom d'une compétence au toucher (une
//     bulle), plus seulement au survol.
//  3. « Et 12 autres » (À aider, À féliciter) se touche : la liste complète
//     des autres, AVEC leurs raisons.
//  4. Dans la fiche, toucher un jour du calendrier le met en avant dans
//     « Activité » (planches Q4, choix de Gwenaël du 08/11).
//  5. Défi tables : la colonne dit qu'elle compte des séances (« Séances ·
//     4 semaines », « … séances » ; choix A de Gwenaël, planche Q5).
//
// Ces tests EXÉCUTENT les fonctions de la page, telles qu'elles y sont
// écrites, sur un petit document de remplacement.

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(racine, "_serveur/public/prof/index.php"), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = page.slice(page.indexOf(BALISE), page.indexOf("</script>", page.indexOf(BALISE)));
const style = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));

function blocDepuis(source, position) {
  const ouvre = source.indexOf("{", position);
  let profondeur = 0;
  for (let i = ouvre; i < source.length; i += 1) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") { profondeur -= 1; if (profondeur === 0) return source.slice(position, i + 1); }
  }
  throw new Error("bloc non fermé");
}
function fonction(nom) {
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(script);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(script, m.index);
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
    this.offsetWidth = 300;
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
  set innerHTML(_) { throw new Error("innerHTML interdit : les prénoms passent par textContent"); }
  get isConnected() { let n = this; while (n.parent) n = n.parent; return Boolean(n.racine); }
  getClientRects() { return this.isConnected && !this.hidden ? [1] : []; }
  getBoundingClientRect() { return {left: 40, top: 100, bottom: 120, right: 120, width: 80, height: 20}; }
  append(...noeuds) {
    noeuds.forEach(n => {
      const enfant = typeof n === "string" ? Object.assign(new Noeud("#text"), {texte: n}) : n;
      enfant.parent = this;
      this.enfants.push(enfant);
    });
  }
  appendChild(n) { this.append(n); return n; }
  prepend(n) { n.parent = this; this.enfants.unshift(n); }
  remove() { if (this.parent) this.parent.enfants = this.parent.enfants.filter(e => e !== this); this.parent = null; }
  setAttribute(k, v) { this.attributs[k] = String(v); }
  getAttribute(k) { return k in this.attributs ? this.attributs[k] : null; }
  addEventListener(type, f) { (this.ecoutes[type] = this.ecoutes[type] || []).push(f); }
  click() { (this.ecoutes.click || []).forEach(f => f({target: this, stopPropagation() {}})); }
  tous(balise) { return this.enfants.flatMap(e => (e.tagName === balise.toUpperCase() ? [e] : []).concat(e.tous(balise))); }
  parClasse(c) { return this.enfants.flatMap(e => (e.classList && e.classList.contains(c) ? [e] : []).concat(e.parClasse ? e.parClasse(c) : [])); }
}
function documentFactice(ids) {
  const noeuds = {};
  const racineDoc = new Noeud("body");
  racineDoc.racine = true;
  ids.forEach(id => { noeuds[id] = new Noeud("div"); noeuds[id].id = id; racineDoc.append(noeuds[id]); });
  const document = {createElement: b => new Noeud(b), createTextNode: t => Object.assign(new Noeud("#text"), {texte: t}),
    documentElement: {clientWidth: 1366}, querySelectorAll: () => []};
  return {noeuds, document, racine: racineDoc, $: id => noeuds[id] || null};
}
const nomAffiche = e => (e.prenom ? (e.initiale ? `${e.prenom} ${e.initiale}.` : e.prenom) : "");

// Les fonctions de la liste des prénoms (lot S4b), réunies.
function popEleves(r, ouvertures) {
  return new Function("document", "$", "window", "nomAffiche", "ouvrirFenetreEleve", "fermerPopOuEnEst", `
    ${fonction("el")}
    let ancrePopEleves = null;
    ${fonction("ouvrirPopEleves")} ${fonction("fermerPopEleves")} ${fonction("garderPopEleves")}
    ${fonction("boutonNombre")} ${fonction("lienFiche")} ${fonction("prenomsEnLiens")}
    return {el, ouvrirPopEleves, fermerPopEleves, garderPopEleves, boutonNombre, lienFiche, prenomsEnLiens};`)(
    r.document, r.$, {scrollX: 0, scrollY: 500}, nomAffiche, (eleve, onglet) => ouvertures.push([eleve.prenom, onglet]), () => {});
}

// ------------------------------------------------------------ 1. des chiffres aux prénoms

test("1 — « 5 élèves » se touche : les prénoms par-dessus la page, sous le nombre ; un prénom ouvre la fiche ; la liste reste ; retoucher le nombre la ferme", () => {
  const r = documentFactice(["pop-eleves", "carte"]);
  const ouvertures = [];
  const f = popEleves(r, ouvertures);
  const lea = {prenom: "Léa", initiale: "B"}, noah = {prenom: "Noah", initiale: "A"};
  const bouton = f.boutonNombre("2 élèves", pop => { pop.append(f.el("strong", "", "7 × 8 · à travailler")); pop.append(f.prenomsEnLiens([lea, noah])); });
  r.$("carte").append(bouton);
  assert.equal(bouton.tagName, "BUTTON");
  assert.equal(bouton.type, "button");
  assert.equal(bouton.getAttribute("aria-expanded"), "false");
  const pop = r.$("pop-eleves");
  pop.hidden = true;
  bouton.click();
  assert.equal(pop.hidden, false);
  assert.equal(pop.textContent, "7 × 8 · à travaillerLéa B., Noah A.");
  assert.equal(bouton.getAttribute("aria-expanded"), "true");
  assert.equal(pop.style.top, "626px", "sous le nombre (120 + défilement 500 + 6), par-dessus la page");
  assert.equal(pop.style.left, "40px");
  const liens = pop.parClasse("lc-lien");
  assert.deepEqual(liens.map(l => [l.tagName, l.textContent]), [["BUTTON", "Léa B."], ["BUTTON", "Noah A."]]);
  liens[1].click();
  assert.deepEqual(ouvertures, [["Noah", undefined]], "la fiche, sur l'onglet d'où l'on vient");
  assert.equal(pop.hidden, false, "la fiche ouverte (puis fermée), la liste est toujours là");
  bouton.click();
  assert.equal(pop.hidden, true, "retoucher le nombre ferme la liste");
  assert.equal(pop.textContent, "", "fermée, plus aucun prénom dans la page");
  assert.equal(bouton.getAttribute("aria-expanded"), "false");
  // Redessinée (le nombre n'est plus dans la page) : la liste part avec.
  bouton.click();
  bouton.remove();
  f.garderPopEleves();
  assert.equal(pop.hidden, true);
});

test("1 — elle ne déborde pas de l'écran (au téléphone, collée à 8 px du bord)", () => {
  const r = documentFactice(["pop-eleves"]);
  r.document.documentElement.clientWidth = 390;
  const f = popEleves(r, []);
  const bouton = f.boutonNombre("3 élèves", pop => pop.append("x"));
  bouton.getBoundingClientRect = () => ({left: 300, top: 0, bottom: 20, right: 360});
  r.racine.append(bouton);
  bouton.click();
  assert.equal(r.$("pop-eleves").style.left, "82px", "390 − 300 (sa largeur) − 8");
  assert.match(style, /\.pop-eleves \{ position: absolute; z-index: 30; width: min\(420px, calc\(100vw - 16px\)\);/);
});

test("1 — Défi tables, « Les calculs qui coincent » : « 5 élèves » donne les élèves qui ont CE calcul à travailler, dans l'ordre des prénoms", () => {
  const r = documentFactice(["fragiles", "fragiles-liste", "fragiles-sous", "pop-eleves"]);
  const ouvertures = [];
  const f = popEleves(r, ouvertures);
  // Le moteur, pour la classe ET élève par élève : « 7-8 » chez Tom, Ana, Léo ; « 6-7 » chez Ana, Léo, Zoé.
  const aTravailler = {Tom: ["7-8"], Ana: ["7-8", "6-7"], Léo: ["7-8", "6-7"], Zoé: ["6-7"], Max: []};
  const eleves = Object.keys(aTravailler).map(prenom => ({prenom, lu: {parcours: {prenom}}}));
  const PARCOURS = {fragilesDeLaClasse: liste => {
    const compte = new Map();
    liste.forEach(p => aTravailler[p.prenom].forEach(cle => compte.set(cle, (compte.get(cle) || 0) + 1)));
    return [...compte].map(([cle, n]) => ({cle, libelle: cle.replace("-", " × "), eleves: n}));
  }};
  const ordre = liste => [...liste].sort((a, b) => a.prenom.localeCompare(b.prenom, "fr"));
  new Function("document", "$", "PARCOURS", "eleves", "garderPopEleves", "ordreDeLaFeuille", "boutonNombre", "prenomsEnLiens", "el",
    `const SEUIL_FRAGILES = 3;\n${fonction("dessinerFragiles")}\ndessinerFragiles();`)(r.document, r.$, PARCOURS, eleves, f.garderPopEleves, ordre, f.boutonNombre, f.prenomsEnLiens, f.el);
  const lignes = r.$("fragiles-liste").enfants;
  assert.deepEqual(lignes.map(li => li.textContent), ["7 × 83 élèves", "6 × 73 élèves"]);
  lignes[1].parClasse("bouton-nombre")[0].click();
  assert.equal(r.$("pop-eleves").textContent, "6 × 7 · à travaillerAna, Léo, Zoé");
  r.$("pop-eleves").parClasse("lc-lien")[2].click();
  assert.deepEqual(ouvertures, [["Zoé", undefined]]);
});

test("1 — Défi calcul : « 2 élèves » de « À reprendre en classe » donne les prénoms par état ; les barres de « Où en est la classe » ont des prénoms qui ouvrent la fiche", () => {
  const reprendre = fonction("reprendreEnClasse");
  assert.match(reprendre, /entree\.qui\.push\(\{eleve, c\}\);/);
  const dessin = fonction("dessinerReprendre");
  assert.match(dessin, /nombre\.append\(boutonNombre\(`\$\{c\.eleves\} élève\$\{c\.eleves > 1 \? "s" : ""\}`, pop => \{/);
  assert.match(dessin, /\[\["À voir en classe", q => q\.c\.etat === "classe"\], \["Mise de côté", q => q\.c\.etat !== "classe" && q\.c\.deCote\],\s*\["À revoir", q => q\.c\.etat !== "classe" && !q\.c\.deCote\]\]/,
    "chaque élève dans un seul groupe");
  assert.match(dessin, /const qui = ordreDeLaFeuille\(c\.qui\.filter\(garde\)\.map\(q => q\.eleve\)\);\s*if \(!qui\.length\) return;/);
  assert.match(fonction("ouvrirPopOuEnEst"), /groupes\[etat\]\.forEach\(\(e, i\) => \{ if \(i\) p\.append\(document\.createTextNode\(", "\)\); p\.append\(lienFiche\(e\)\); \}\);/);
  assert.match(fonction("ouvrirPopOuEnEst"), /fermerPopEleves\(\);/, "une seule liste à la fois");
  assert.match(fonction("ouvrirPopEleves"), /fermerPopOuEnEst\(\);/);
});

test("1 — fermer la fiche revient au même endroit : un clic DANS la fiche ne ferme pas la liste (le chemin du clic, même redessiné) ; Échap ferme d'abord la fiche", () => {
  const debut = script.indexOf("  document.addEventListener(\"click\", evenement => {\n    const chemin");
  assert.ok(debut > 0);
  const ecoute = script.slice(debut, script.indexOf("$(\"onglet-reglages\").addEventListener", debut));
  assert.match(ecoute, /const chemin = typeof evenement\.composedPath === "function" \? evenement\.composedPath\(\) : \[evenement\.target\];/);
  assert.match(ecoute, /if \(!dans\("#dc-ouest-pop, \.dc-ouest-barre, dialog"\)\) fermerPopOuEnEst\(\);/);
  assert.match(ecoute, /if \(!dans\("#pop-eleves, dialog"\)\) fermerPopEleves\(\);/);
  assert.match(ecoute, /if \(!dans\("\.dc-case"\)\) cacherBulleCase\(\);/);
  assert.match(ecoute, /cacherBulleCase\(\);\s*if \(document\.querySelector\("dialog\[open\]"\)\) return;\s*fermerPopOuEnEst\(\);\s*fermerPopEleves\(\);/);
  assert.doesNotMatch(fonction("surFermetureFenetre"), /scroll|redessin|fermerPop/, "fermer la fiche ne touche ni à la page ni à la liste");
  // Une autre largeur (le téléphone tourné) ferme la liste ; la barre d'adresse qui se cache, non.
  assert.match(script, /if \(window\.innerWidth === largeurPop\) return;\s*largeurPop = window\.innerWidth;\s*fermerPopEleves\(\);/);
  assert.match(fonction("poserVue"), /garderPopEleves\(\);/, "une autre vue : la liste part");
});

test("1 et 3 — la liste des prénoms est vidée et cachée à la déconnexion ; tout passe par textContent", () => {
  assert.match(script, /"dc-qui-texte",\s*\/\/[^\n]*\n\s*"pop-eleves"\];/);
  assert.match(script, /"vue-classe", "dc-ouest", "dc-qui", "dc-ouest-pop", "pop-eleves",/);
  assert.match(page, /<div class="pop-eleves" id="pop-eleves" hidden><\/div>\s*<dialog id="fenetre-eleve"/);
  for (const nom of ["ouvrirPopEleves", "fermerPopEleves", "boutonNombre", "lienFiche", "prenomsEnLiens", "dessinerFragiles", "dessinerReprendre", "dessinerCartesClasse", "montrerBulleCase", "choisirJourFiche"]) {
    assert.doesNotMatch(fonction(nom), /innerHTML|insertAdjacentHTML/, `${nom} : textContent seulement`);
  }
});

// ------------------------------------------------------------ 3. « Et 12 autres »

test("3 — « Et 12 autres » : un nombre à toucher ; la liste complète des autres, chacun avec sa raison (et sa pastille dans « À aider ») ; un prénom ouvre la fiche", () => {
  const ids = ["lc-aider-liste", "lc-aider-plus", "lc-feliciter-liste", "lc-feliciter-plus", "lc-feliciter-sous", "pop-eleves"];
  const r = documentFactice(ids);
  const ouvertures = [];
  const f = popEleves(r, ouvertures);
  const eleves = Array.from({length: 9}, (_, i) => ({id: i + 1, prenom: `É${i + 1}`}));
  const bilans = new Map(eleves.map((e, i) => [e.id, {
    aider: i < 8 ? [{genre: i % 2 ? "bloque" : "absent", rang: i, texte: `raison ${i + 1}`, appli: i % 2 ? "defi-tables" : null, faire: "faire"}] : [],
    feliciter: i < 2 ? [{appli: "coffres", texte: "2 trésors ouverts cette semaine", rang: 4}] : [],
  }]));
  new Function("document", "$", "el", "nomAffiche", "ordreDeLaFeuille", "ouvrirFenetreEleve", "boutonNombre", "lienFiche", "garderPopEleves",
    "puceAppli", "nomDeLAppli", "aujourdhuiSuivi", "lundiDuJour", "pluriel", "LIGNES_CARTE",
    `${fonction("dessinerCartesClasse")}\ndessinerCartesClasse(LISTE, BILANS, false);`.replace("LISTE", "arguments[15]").replace("BILANS", "arguments[16]"))(
    r.document, r.$, f.el, nomAffiche, l => l, (e, o) => ouvertures.push([e.prenom, o]), f.boutonNombre, f.lienFiche, f.garderPopEleves,
    cle => f.el("i", "lc-puce"), cle => ({"defi-tables": "Défi tables", coffres: "Coffres magiques"})[cle], () => "2026-11-12", () => "2026-11-09",
    (n, un, plusieurs) => `${n} ${n > 1 ? (plusieurs || `${un}s`) : un}`, 6, eleves, bilans);
  const plus = r.$("lc-aider-plus");
  assert.equal(plus.hidden, false);
  assert.equal(plus.textContent, "Et 2 autres", "un nombre, plus la liste des prénoms sans raison");
  plus.parClasse("bouton-nombre")[0].click();
  const pop = r.$("pop-eleves");
  assert.equal(pop.enfants[0].textContent, "À aider · 2 autres");
  const lignes = pop.tous("li");
  assert.deepEqual(lignes.map(li => li.textContent), ["É7absenceraison 7", "É8blocageDéfi tables · raison 8"]);
  lignes[1].parClasse("lc-lien")[0].click();
  assert.deepEqual(ouvertures, [["É8", "ensemble"]], "la fiche, sur la vue d'ensemble");
  assert.equal(r.$("lc-feliciter-plus").hidden, true, "2 à féliciter : pas de « Et … autres »");
  assert.match(style, /\.pop-eleves ul \{ list-style: none; max-height: min\(60vh, 460px\); margin: 0; padding: 0; overflow: auto; \}/, "une longue liste défile dans la sienne, la page ne bouge pas");
});

// ------------------------------------------------------------ 2. la case d'une compétence

test("2 — Défi calcul, la fiche : chaque case est un bouton ; la toucher (ou la survoler) montre le nom de la compétence dans une bulle au-dessus de la ligne", () => {
  const cases = fonction("competencesEnCases");
  assert.match(cases, /const c = el\("button", `dc-case \$\{etat\}`\);\s*c\.type = "button";/);
  assert.match(cases, /c\.setAttribute\("aria-label", nom\);/);
  assert.doesNotMatch(cases, /c\.title = nom|"role", "img"/, "plus de bulle du navigateur en double");
  assert.match(cases, /c\.addEventListener\("click", evenement => \{ evenement\.stopPropagation\(\); montrerBulleCase\(c, nom, true\); \}\);/);
  assert.match(cases, /c\.addEventListener\("mouseenter", \(\) => montrerBulleCase\(c, nom, false\)\);/);
  assert.match(cases, /legende\.append\(el\("span", "", "· toucher une case : le nom de la compétence"\)\);/);
  assert.doesNotMatch(cases, /Survoler une case/);
  // La bulle elle-même.
  const r = documentFactice([]);
  const bulles = [];
  r.document.querySelectorAll = choix => (choix === ".dc-bulle" ? bulles.filter(b => b.parent) : choix === ".dc-case.choisie" ? [c1, c2].filter(c => c.classList.contains("choisie")) : []);
  const f = new Function("document", `${fonction("el")} ${fonction("montrerBulleCase")} ${fonction("cacherBulleCase")} return {montrerBulleCase, cacherBulleCase};`)(r.document);
  const ligne = new Noeud("div");
  const c1 = new Noeud("button"), c2 = new Noeud("button");
  [c1, c2].forEach(c => { c.closest = () => ligne; ligne.append(c); });
  const appendOrigine = ligne.append.bind(ligne);
  ligne.append = n => { if (n.className === "dc-bulle") bulles.push(n); appendOrigine(n); };
  f.montrerBulleCase(c1, "Ajouter un chiffre sans passage : sue", true);
  assert.deepEqual(bulles.filter(b => b.parent).map(b => b.textContent), ["Ajouter un chiffre sans passage : sue"]);
  assert.ok(c1.classList.contains("choisie"));
  f.montrerBulleCase(c2, "Doubles : en route", true);
  assert.deepEqual(bulles.filter(b => b.parent).map(b => b.textContent), ["Doubles : en route"], "une bulle à la fois");
  assert.ok(!c1.classList.contains("choisie") && c2.classList.contains("choisie"));
  f.montrerBulleCase(c2, "Doubles : en route", true);
  assert.equal(bulles.filter(b => b.parent).length, 0, "retoucher la case l'oublie");
  assert.match(style, /\.dc-bulle \{ position: absolute; right: 0; bottom: calc\(100% - 2px\); z-index: 3;/, "par-dessus : rien ne bouge");
  assert.match(style, /button\.dc-case \{ min-height: 0; padding: 0;/, "la case garde sa taille (pas un bouton de 44 px)");
  assert.match(style, /button\.dc-case\.gris:hover \{ background: var\(--paper\); \}/, "une case vide ne devient pas bleue au survol");
});

// ------------------------------------------------------------ 4. le jour touché

test("4 — la fiche : un jour de travail du calendrier est un bouton ; touché, il est mis en avant dans « Activité » (la liste reste) ; oublié avec l'élève, l'onglet ; la fiche défile seulement si le jour est hors de la vue", () => {
  const ensemble = fonction("contenuEnsemble");
  assert.match(ensemble, /grille\.setAttribute\("role", "group"\);/);
  assert.match(ensemble, /const c = el\(applis\.length \? "button" : "span", `fe-case/);
  assert.match(ensemble, /c\.dataset\.jour = jour;\s*c\.setAttribute\("aria-pressed", String\(jour === jourChoisiFiche\)\);\s*c\.setAttribute\("aria-label", `\$\{jourEnClair\(jour\)\} : \$\{applis\.map\(nomDeLAppli\)\.join\(", "\)\}`\);\s*c\.addEventListener\("click", \(\) => choisirJourFiche\(id, jour\)\);/);
  assert.match(ensemble, /const bloc = el\("div", `fe-jour-bloc\$\{jour === jourChoisiFiche \? " choisi" : ""\}`\);\s*bloc\.dataset\.jour = jour;/);
  const choisir = fonction("choisirJourFiche");
  assert.match(choisir, /jourChoisiFiche = jourChoisiFiche === jour \? null : jour;/, "retoucher le jour l'oublie");
  assert.match(choisir, /joursDeLaFiche\(id, aujourdhuiSuivi\(\), 28\)/, "un jour ancien : « Activité » en montre assez pour l'atteindre");
  assert.match(choisir, /if \(rang >= 0\) joursFiche = Math\.max\(joursFiche, rang \+ 1\);/, "jamais moins de jours qu'avant");
  assert.match(choisir, /if \(r\.top < rc\.top \|\| r\.bottom > rc\.bottom\) bloc\.scrollIntoView\(\{block: "center", behavior: "smooth"\}\);/);
  assert.match(choisir, /hauteur\(gauche\) <= corps\.clientHeight\) gauche\.classList\.add\("colle"\);/, "le calendrier reste en place s'il tient dans la fenêtre");
  assert.match(style, /\.fe-col\.colle \{ position: sticky; top: 0; align-self: start; \}/);
  assert.match(style, /\.fe-jour-bloc\.choisi \{ background: #e8f1fa; box-shadow: 0 0 0 6px #e8f1fa;/, "mis en avant sans rien décaler (l'ombre, pas une marge)");
  assert.match(fonction("ouvrirFenetreEleve"), /jourChoisiFiche = null;/);
  assert.match(fonction("changerEleveDeLaFenetre"), /jourChoisiFiche = null;/);
  assert.match(fonction("changerOngletFiche"), /jourChoisiFiche = null;/);
});

// ------------------------------------------------------------ 5. séances

test("5 — Défi tables : « Séances · 4 semaines » et « … séances » (La classe garde « jours ») ; rien de nouveau demandé au serveur", () => {
  assert.match(page, /<th class="large"><button type="button" data-tri="semaine">Séances · 4 semaines<\/button><\/th>/);
  assert.match(fonction("celluleSemaines"), /unite\.className = "lc-unite";\s*unite\.textContent = " séances";\s*zone\.append\(unite\);/);
  assert.match(fonction("celluleQuatreSemaines"), /zone\.append\(el\("span", "lc-unite", "\sjours"\)\);/);
  assert.doesNotMatch(fonction("celluleSemaines"), /suiviApp|api\(/);
});

test("rien de genré dans les nouveaux textes", () => {
  const nouveaux = ["dessinerFragiles", "dessinerReprendre", "dessinerCartesClasse", "competencesEnCases", "choisirJourFiche"].map(fonction).join("\n").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(nouveaux, /\bil a\b|\bavec lui\b|\bvenus?\b|\bqu’il\b|\bqu'il\b/);
});
