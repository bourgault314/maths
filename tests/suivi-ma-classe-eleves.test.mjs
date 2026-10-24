import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Lot « Ma classe : élèves » (18/10/2026, choix de Gwenaël du 17 et du 18/10).
//
// Avant, les codes des élèves étaient écrits dans chaque tableau d'appli :
// « Ma classe » ouverte avec le vidéoprojecteur allumé montrait les 26 codes à
// toute la classe — de quoi entrer chez un camarade, changer sa progression ou
// passer une évaluation à sa place. Les prénoms, les codes et les papiers sont
// maintenant dans l'onglet « Élèves » (propriétaire et collègues en écriture) ;
// Défi tables et SPLAT! ne montrent plus que la progression, sans aucun code,
// et le prénom y est du texte. Dans le même lot : « + Nouvelle classe » devient
// une carte au bout de Mes classes, une classe vide s'ouvre sur Élèves, une
// bandelette s'imprime à l'unité, « Les calculs qui coincent » demandent au
// moins 3 élèves par calcul, et sur téléphone Élèves et Réglages n'affichent
// que leur dessin.
//
// Ces tests EXÉCUTENT les fonctions de la page, telles qu'elles y sont
// écrites, dans un document de poche. Le vrai navigateur et le vrai serveur
// sont joués par le banc du lot (voir la notice). Sabotages : voir
// ma-classe-eleves-sabotages.py dans le dossier du lot.

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(racine, "_serveur/public/prof/index.php"), "utf8");
const BALISE = '<script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES) ?>">';
const script = (() => {
  const debut = page.indexOf(BALISE);
  const fin = page.indexOf("</script>", debut);
  assert.ok(debut > 0 && fin > debut, "le script en ligne de la page prof doit être trouvé");
  return page.slice(debut, fin);
})();

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
  const m = new RegExp(`(?:async )?function ${nom}\\(`).exec(script);
  assert.ok(m, `la page doit définir ${nom}()`);
  return blocDepuis(script, m.index);
}

function constante(nom) {
  const position = script.indexOf(`const ${nom} = `);
  assert.ok(position > 0, `la page doit définir ${nom}`);
  let i = position + `const ${nom} = `.length, profondeur = 0, dansTexte = "";
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

// ------------------------------------------------------------ un document de poche

class Noeud {
  constructor(tag) {
    this.tag = tag; this.enfants = []; this.attributs = {}; this.dataset = {}; this.style = {};
    this.className = ""; this.hidden = false; this._texte = ""; this.ecouteurs = {}; this.parent = null;
    this.value = ""; this.disabled = false; this.checked = false; this.focalise = false;
  }
  get children() { return this.enfants.filter(e => e.tag !== "#texte"); }
  set textContent(v) { this.enfants = []; this._texte = v === null || v === undefined ? "" : String(v); }
  get textContent() { return this.enfants.length ? this.enfants.map(e => e.textContent).join("") : this._texte; }
  set innerHTML(v) { this.enfants = []; this._texte = String(v).replace(/<[^>]*>/g, ""); }
  append(...noeuds) { noeuds.forEach(n => { const x = typeof n === "string" ? texte(n) : n; x.parent = this; this.enfants.push(x); }); }
  appendChild(n) { this.append(n); return n; }
  setAttribute(k, v) { this.attributs[k] = String(v); }
  getAttribute(k) { return this.attributs[k]; }
  addEventListener(type, f) { (this.ecouteurs[type] = this.ecouteurs[type] || []).push(f); }
  cliquer() { (this.ecouteurs.click || []).forEach(f => f()); }
  tous(predicat, sortie = []) { this.enfants.forEach(e => { if (predicat(e)) sortie.push(e); e.tous(predicat, sortie); }); return sortie; }
  premier(predicat) { return this.tous(predicat)[0] || null; }
  // Lot « Qui voit quoi » : assez pour la fenêtre « Ce que voit… ».
  querySelectorAll(selecteur) { return selecteur === "input" ? this.tous(n => n.tag === "input") : []; }
  focus() { this.focalise = true; }
  changer() { (this.ecouteurs.change || []).forEach(f => f()); }
}
function texte(t) { const n = new Noeud("#texte"); n._texte = String(t); return n; }
const document = {createElement: tag => new Noeud(tag), createTextNode: t => texte(t)};
function creerZones() {
  const zones = new Map();
  return {zones, $: id => { if (!zones.has(id)) zones.set(id, new Noeud("div")); return zones.get(id); }};
}
const aClasse = (noeud, classe) => (noeud.className || "").split(" ").includes(classe);

// Une classe de quatre : deux prénoms, deux codes encore sans prénom.
const classe4 = () => [
  {id: 11, code: "ZZZZ22", prenom: "Zoé", initiale: "B"},
  {id: 12, code: "QQQQ11", prenom: "", initiale: ""},
  {id: 13, code: "AAAA33", prenom: "Anaïs", initiale: "A"},
  {id: 14, code: "BBBB44", prenom: "", initiale: ""},
];

// ------------------------------------------------------------ l'onglet Élèves, exécuté

// Lu à la demande (pas au chargement du fichier) : une fonction absente fait
// rougir les tests qui s'en servent, pas le fichier entier.
const sourcesEleves = () => ["nomAffiche", "ordreDeLaFeuille", "celluleNom", "celluleCode", "boutonGeste", "menuGestes",
  "poserGestesEleve", "dessinerOngletEleves",
  // Lot « Qui voit quoi » : la colonne « En plus » et ses pastilles.
  "prenomCourt", "seElide", "deNom", "motDe", "motDeMonde", "numerosOuverts", "enPlusDe", "pastillesEnPlus", "celluleEnPlus"].map(fonction).join("\n");
const constantesEleves = () => ["APPLIS", "COULEURS_MONDES", "LISTES_PAR_ELEVE"].map(constante).join("\n");

// La 405 du banc : Défi tables et SPLAT! (mondes 1 et 2), pas Coffres.
const classe405 = () => ({id: 7, libelle: "405", applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2]}}});

function ongletEleves(liste, droit = "proprietaire", classe = classe405()) {
  const {zones, $} = creerZones();
  const appels = [];
  const f = new Function("document", "$", "droitClasse", "eleves", "nommer", "imprimer", "regenerer", "supprimerEleve", "placerMenu",
    "classe", "ouvrirCeQueVoit",
    `${constantesEleves()}\n${sourcesEleves()}\nreturn {dessinerOngletEleves};`)(
    document, $, droit, liste,
    (eleve) => appels.push(["nommer", eleve.id]), (quoi, eleve) => appels.push(["imprimer", quoi, eleve.id]),
    (eleve) => appels.push(["regenerer", eleve.id]), (eleve) => appels.push(["supprimer", eleve.id]), () => {},
    classe, (eleve) => appels.push(["voit", eleve.id]));
  f.dessinerOngletEleves(droit !== "lecture");
  return {zones, $, lignes: $("corps-eleves").children, appels};
}

test("l'onglet Élèves : la feuille prénom ↔ code à l'écran — même ordre, mêmes numéros, le code, le prénom à saisir", () => {
  const {lignes} = ongletEleves(classe4());
  assert.deepEqual(lignes.map(tr => tr.children[0].textContent), ["1", "2", "3", "4"]);
  // Les prénoms d'abord, par prénom ; puis les sans-nom, par code (ordreDeLaFeuille).
  assert.deepEqual(lignes.map(tr => tr.children[2].textContent), ["AAAA33", "ZZZZ22", "BBBB44", "QQQQ11"]);
  assert.deepEqual(lignes.map(tr => tr.children[1].children[0].value), ["Anaïs A.", "Zoé B.", "", ""]);
  lignes.forEach(tr => {
    assert.equal(tr.children.length, 5, "N° · Élève · Code · En plus · ⋯");
    assert.ok(aClasse(tr.children[3], "en-plus"));
    assert.equal(tr.children[3].textContent, "—", "rien en plus : un tiret");
    assert.ok(aClasse(tr.children[2], "code"));
    const champ = tr.children[1].children[0];
    assert.equal(champ.tag, "input");
    assert.notEqual(champ.readOnly, true, "le prénom se saisit ici");
    assert.equal(champ.placeholder, "Prénom", "le prénom seul suffit ; l'initiale reste possible, pas imposée");
  });
});

test("le « ⋯ » de l'onglet Élèves : Ce que voit…, Imprimer sa bandelette, Nouveau code, Supprimer (propriétaire seulement)", () => {
  const menu = tr => tr.children[4].premier(n => n.tag === "details");
  const boutons = tr => menu(tr).tous(n => n.tag === "button").map(b => b.textContent);
  const proprio = ongletEleves(classe4());
  // Lot « Qui voit quoi » (D5) : « Ce que voit Léa… » EN PREMIER, avec le prénom seul.
  assert.deepEqual(proprio.lignes.map(tr => boutons(tr)[0]),
    ["Ce que voit Anaïs…", "Ce que voit Zoé…", "Ce que voit cet élève…", "Ce que voit cet élève…"]);
  proprio.lignes.forEach(tr => assert.deepEqual(boutons(tr).slice(1), ["Imprimer sa bandelette", "Nouveau code", "Supprimer"]));
  const ecriture = ongletEleves(classe4(), "ecriture");
  ecriture.lignes.forEach(tr => assert.deepEqual(boutons(tr), ["Imprimer sa bandelette", "Nouveau code"],
    "un collègue en écriture n'efface pas d'élève (lot 11) et n'ouvre rien à un élève (Q2)"));
  // Les boutons font ce qu'ils disent, pour l'élève de LEUR ligne (Anaïs, ligne 1).
  menu(proprio.lignes[0]).tous(n => n.tag === "button").forEach(b => b.cliquer());
  assert.deepEqual(proprio.appels, [["voit", 13], ["imprimer", "bandelettes", 13], ["regenerer", 13], ["supprimer", 13]]);
});

test("en lecture seule, l'onglet Élèves n'a rien : ni ligne, ni code", () => {
  const {$, lignes} = ongletEleves(classe4().map(e => ({...e, code: null})), "lecture");
  assert.equal(lignes.length, 0);
  assert.equal($("liste-eleves").hidden, true);
  ["coller-prenoms", "imprimer-bandelettes", "imprimer-recap"].forEach(id => assert.equal($(id).hidden, true, id));
});

test("une classe vide : « Ajouter des élèves » seul — rien à coller ni à imprimer tant qu'il n'y a pas de code", () => {
  const vide = ongletEleves([]);
  assert.equal(vide.$("liste-eleves").hidden, true, "pas de liste vide avec son en-tête");
  ["coller-prenoms", "imprimer-bandelettes", "imprimer-recap"].forEach(id => assert.equal(vide.$(id).hidden, true, id));
  assert.notEqual(vide.$("ajouter").hidden, true);
  const pleine = ongletEleves(classe4());
  assert.equal(pleine.$("liste-eleves").hidden, false);
  ["coller-prenoms", "imprimer-bandelettes", "imprimer-recap"].forEach(id => assert.equal(pleine.$(id).hidden, false, id));
});

// ------------------------------------------------------------ plus aucun code dans les applis

test("les codes ne s'écrivent à l'écran que dans l'onglet Élèves ; les tableaux d'appli n'ont plus ni code ni champ", () => {
  const appelsCode = [...script.matchAll(/celluleCode\(/g)].length;
  assert.equal(appelsCode, 2, "celluleCode : sa définition et UN appel");
  assert.match(fonction("dessinerOngletEleves"), /celluleCode\(eleve\)/);
  assert.match(fonction("dessinerOngletEleves"), /celluleNom\(eleve, true\)/);
  assert.equal([...script.matchAll(/celluleNom\(/g)].length, 2, "celluleNom (le champ) : sa définition et UN appel");
  // Défi tables : du début de dessinerTableau à resumeDeLaClasse ; SPLAT! : son tableau.
  const defiTables = script.slice(script.indexOf("  function dessinerTableau() {"), script.indexOf("  function resumeDeLaClasse("));
  for (const [nom, source] of [["Défi tables", defiTables], ["SPLAT!", fonction("dessinerTableauSplat")]]) {
    assert.match(source, /celluleNomTexte\(eleve\)/, `${nom} : le prénom en texte`);
    assert.doesNotMatch(source, /\.code\b|celluleCode|cCode/, `${nom} : aucun code`);
  }
  // Les en-têtes : plus de colonne « Code ».
  for (const id of ["entete-defi-tables", "entete-splat"]) {
    const debut = page.indexOf(`<tr id="${id}"`);
    assert.doesNotMatch(page.slice(debut, page.indexOf("</tr>", debut)), /<th>Code<\/th>/, id);
  }
  assert.doesNotMatch(page, /sans-codes/, "la colonne qu'on cachait en lecture seule n'existe plus");
  // Le prénom en texte : « sans prénom » en gris quand il manque.
  const {$} = creerZones();
  const cellule = new Function("document", "$", `${fonction("nomAffiche")}\n${fonction("celluleNomTexte")}\nreturn celluleNomTexte;`)(document, $);
  const avec = cellule({prenom: "Léa", initiale: "B"});
  assert.equal(avec.textContent, "Léa B.");
  assert.equal(avec.children.length, 0, "du texte, pas un champ");
  const sans = cellule({prenom: "", initiale: ""});
  assert.equal(sans.textContent, "sans prénom");
  assert.ok(aClasse(sans, "sans"));
});

test("dans le tableau d'une appli, le « ⋯ » ne garde que « Revenir à… » — et rien en lecture seule", () => {
  const poser = (eleve, ecriture) => {
    const cActions = new Noeud("td");
    new Function("document", "revenirA", "placerMenu", `${fonction("boutonGeste")}\n${fonction("menuGestes")}\n${fonction("poserGestes")}\nreturn poserGestes;`)(
      document, () => {}, () => {})(eleve, ecriture, cActions);
    const menu = cActions.premier(n => n.tag === "details");
    return menu ? menu.tous(n => n.tag === "button").map(b => b.textContent) : null;
  };
  assert.deepEqual(poser({restaurable: true, journees: []}, true), ["Revenir à…"]);
  assert.deepEqual(poser({restaurable: false, journees: [{jour: "2026-10-16", calculs: 3}]}, true), ["Revenir à…"]);
  assert.equal(poser({restaurable: false, journees: []}, true), null, "rien à restaurer : pas de « ⋯ »");
  assert.equal(poser({restaurable: true, journees: []}, false), null, "lecture seule : pas de « ⋯ »");
});

// ------------------------------------------------------------ la vue et les droits

function poserVueRejoue(vueAvant, droit) {
  const {$} = creerZones();
  return new Function("$", "droitClasse", "vueInitiale", `let vue = vueInitiale;\n${fonction("poserVue")}\nposerVue();\nreturn {vue, $};`)($, droit, vueAvant);
}

test("la vue Élèves : propriétaire et collègue en écriture ; un collègue « voir seulement » retombe sur l'activité", () => {
  for (const [droit, eleves, reglages] of [["proprietaire", "eleves", "reglages"], ["ecriture", "eleves", "appli"], ["lecture", "appli", "appli"]]) {
    assert.equal(poserVueRejoue("eleves", droit).vue, eleves, `${droit} : Élèves`);
    assert.equal(poserVueRejoue("reglages", droit).vue, reglages, `${droit} : Réglages`);
  }
  const vue = poserVueRejoue("eleves", "proprietaire");
  assert.deepEqual(["vue-appli", "vue-eleves", "vue-reglages"].map(id => vue.$(id).hidden), [true, false, true]);
  assert.equal(vue.$("onglet-eleves").attributs["aria-pressed"], "true");
  assert.equal(vue.$("onglet-reglages").attributs["aria-pressed"], "false");
  const lecture = poserVueRejoue("eleves", "lecture");
  assert.deepEqual(["vue-appli", "vue-eleves", "vue-reglages"].map(id => lecture.$(id).hidden), [false, true, true]);
  assert.equal(poserVueRejoue("n'importe quoi", "proprietaire").vue, "appli");
  // L'onglet et son droit ; on y entre, on en sort par un onglet d'activité.
  assert.match(fonction("appliquerDroits"), /\$\("onglet-eleves"\)\.hidden = !ecriture;/);
  assert.match(fonction("ouvrirEleves"), /if \(!classe \|\| droitClasse === "lecture"\) return;\s*vue = "eleves";/);
  assert.match(script, /\$\("onglet-eleves"\)\.addEventListener\("click", ouvrirEleves\);/);
  assert.match(script, /bouton\.addEventListener\("click", \(\) => \{ vue = "appli"; afficherAppli\(bouton\.dataset\.appli\); \}\);/);
});

test("une classe s'ouvre sur son tableau, jamais sur ses codes — sauf une classe vide, qui s'ouvre sur Élèves", () => {
  const ouvrir = fonction("ouvrirClasse");
  assert.match(ouvrir, /if \(!memeClasse\) \{\s*detailsOuverts\.clear\(\);\s*vue = \(donnees\.eleves \|\| \[\]\)\.length === 0 && droitClasse !== "lecture" \? "eleves" : "appli";\s*\}/);
  // La règle, rejouée : 0 élève en écriture → Élèves ; sinon (ou en lecture) → l'activité.
  const regle = (n, droitClasse) => (new Array(n).length === 0 && droitClasse !== "lecture" ? "eleves" : "appli");
  assert.equal(regle(0, "proprietaire"), "eleves");
  assert.equal(regle(0, "ecriture"), "eleves");
  assert.equal(regle(0, "lecture"), "appli");
  assert.equal(regle(26, "proprietaire"), "appli");
  assert.doesNotMatch(script, /sessionStorage\.setItem\([^)]*vue/i, "la vue ne se retient pas d'une ouverture à l'autre");
  // « Toutes mes classes » puis la MÊME classe : ouvrirClasse la croit « même
  // classe » (elle garde son onglet d'activité) — le retour remet donc la vue.
  assert.match(script, /\$\("retour"\)\.addEventListener\("click", \(\) => \{ vue = "appli"; chargerClasses\(\); \}\);/,
    "quittée sur Élèves, la classe se rouvre sur son tableau");
  assert.match(fonction("oublierEtat"), /vue = "appli";/);
});

test("les messages : ceux des élèves sous les boutons d'Élèves, ceux de l'activité au-dessus de son tableau", () => {
  for (const nom of ["nommer", "regenerer", "supprimerEleve"]) {
    assert.match(fonction(nom), /"message-classe"/, nom);
    assert.doesNotMatch(fonction(nom), /"message-appli"/, nom);
  }
  for (const debut of ['$("ajouter").addEventListener("click"', '$("coller-prenoms").addEventListener("click"']) {
    const bloc = blocDepuis(script, script.indexOf(debut));
    assert.match(bloc, /"message-classe"/, debut);
  }
  for (const nom of ["revenirA", "voirFiche", "afficherAppli"]) {
    assert.match(fonction(nom), /"message-appli"/, nom);
    assert.doesNotMatch(fonction(nom), /"message-classe"/, nom);
  }
  assert.match(script, /const ZONES_MESSAGE = \[[^\]]*"message-appli"/, "vidé à la déconnexion");
  assert.match(script, /const ZONES_TEXTE = \[[^\]]*"corps-eleves"/, "la liste des codes est vidée à la déconnexion");
  assert.match(script, /const BLOCS_A_CACHER = \[[^\]]*"vue-eleves", "onglet-eleves"\]/);
});

// ------------------------------------------------------------ le HTML

// Un élément est DANS un bloc si, entre l'ouverture du bloc et lui, les <div>
// ne se referment jamais toutes.
function dans(idBloc, id) {
  const debut = page.indexOf(`id="${idBloc}"`);
  const position = page.indexOf(`id="${id}"`);
  if (debut < 0 || position < debut) return false;
  let profondeur = 1;
  for (const balise of page.slice(page.indexOf(">", debut) + 1, position).matchAll(/<div\b|<\/div>/g)) {
    profondeur += balise[0] === "</div>" ? -1 : 1;
    if (profondeur <= 0) return false;
  }
  return true;
}

test("le HTML : les quatre boutons, le message et la liste sont dans la vue Élèves ; la vue de l'activité n'a plus de bouton d'élève", () => {
  assert.match(page, /<div id="vue-eleves" hidden>/, "cachée tant qu'aucune classe n'est ouverte");
  for (const id of ["ajouter", "coller-prenoms", "imprimer-bandelettes", "imprimer-recap", "message-classe", "liste-eleves", "tableau-eleves", "corps-eleves"]) {
    assert.ok(dans("vue-eleves", id), `${id} est dans la vue Élèves`);
    assert.ok(!dans("vue-appli", id), `${id} n'est plus dans la vue de l'activité`);
  }
  for (const id of ["message-appli", "tableau", "tri", "bloc-evaluations", "bloc-records", "bloc-imprimer"]) {
    assert.ok(dans("vue-appli", id), `${id} est dans la vue de l'activité`);
  }
  assert.ok(page.indexOf('id="message-classe"') > page.indexOf('id="imprimer-recap"') && page.indexOf('id="message-classe"') < page.indexOf('id="tableau-eleves"'),
    "le message des boutons est juste sous eux, au-dessus de la liste");
  const entete = page.slice(page.indexOf('<table id="tableau-eleves">'), page.indexOf("</thead>", page.indexOf('<table id="tableau-eleves">')));
  assert.deepEqual([...entete.matchAll(/<th\b[^>]*>([^<]*)<\/th>/g)].map(m => m[1]), ["N°", "Élève", "Code", "En plus", ""]);
  // L'onglet : dessin + mot, le mot caché sur téléphone (choix du 18/10), le nom gardé pour les lecteurs d'écran.
  assert.match(page, /<button type="button" class="onglet-eleves" id="onglet-eleves" aria-pressed="false" aria-label="Élèves" title="[^"]+" hidden><svg [^>]+>[\s\S]*?<\/svg><span class="mot">Élèves<\/span><\/button>/);
  assert.match(page, /<span class="mot">Réglages<\/span><\/button>/);
  assert.ok(page.indexOf('id="onglet-eleves"') < page.indexOf('id="onglet-reglages"'), "Élèves avant Réglages");
  assert.match(page, /@media \(max-width: 520px\) \{[^}]*\{[^}]*\}\s*\.onglet-eleves \.mot, \.onglet-reglages \.mot \{ display: none; \}/);
});

test("les textes suivent : la légende du partage, le bandeau du collègue, la note du Ctrl+P", () => {
  assert.match(page, /<li><b>Voir et modifier<\/b> : aussi l’onglet Élèves, avec les codes — avec un code, on entre dans l’appli comme l’élève et on peut changer sa progression\./);
  assert.match(fonction("appliquerDroits"), /partagée avec toi \(voir et modifier\) : dans l’onglet Élèves, tu ajoutes des élèves, saisis les prénoms et donnes un nouveau code ; tu reviens aussi à une version précédente\. Supprimer un élève ou la classe reste à \$\{qui\}\./);
  assert.match(fonction("appliquerDroits"), /\(voir seulement\) : tu vois la progression, sans les codes des élèves, et tu ne modifies rien\./, "inchangé");
  assert.match(page, /Reviens à la page et choisis un bouton de l’onglet Élèves : <strong>« Imprimer les bandelettes »<\/strong>/);
  assert.match(script, /Nouveau code : \$\{donnees\.code\}\. Imprime sa bandelette \(menu ⋯\)/);
});

// ------------------------------------------------------------ une bandelette à l'unité

function impressionRejouee(liste) {
  const {$} = creerZones();
  const corps = {classes: new Set()};
  const ecouteurs = {};
  const minuteurs = [];
  const fenetre = {
    impressions: [],
    print() { fenetre.impressions.push({classes: [...corps.classes], bandelettes: $("bandelettes-liste").children.length,
      titre: $("bandelettes-titre").textContent, numeros: $("bandelettes-liste").tous(n => aClasse(n, "numero")).map(n => n.textContent),
      noms: $("bandelettes-liste").tous(n => aClasse(n, "nom")).map(n => n.textContent),
      consigne: $("bandelettes-consigne").textContent}); },
    addEventListener(type, f) { (ecouteurs[type] = ecouteurs[type] || []).push(f); },
    removeEventListener(type, f) { ecouteurs[type] = (ecouteurs[type] || []).filter(g => g !== f); },
  };
  let papiers = 0;
  const doc = Object.assign({}, document, {body: {classList: {add: c => corps.classes.add(c), remove: c => corps.classes.delete(c)}}});
  const f = new Function("document", "$", "window", "setTimeout", "droitClasse", "classe", "eleves", "dessinerPapierCompte",
    `${["nomAffiche", "ordreDeLaFeuille", "dessinerBandelettes", "imprimer"].map(fonction).join("\n")}\n`
    + "const CONSIGNE_BANDELETTE = 'Ton code est personnel : ne le prête à personne.'; const ADRESSE_ELEVE = 'suivi.mathsgo.re';\n"
    + "function dessinerPapier() { dessinerPapierCompte(); dessinerBandelettes(); }\n"
    + "return {imprimer, dessinerBandelettes};")(
    doc, $, fenetre, (g, ms) => { minuteurs.push([g, ms]); return 1; }, "proprietaire", {libelle: "306"}, liste, () => { papiers += 1; });
  f.dessinerBandelettes();
  return {f, $, fenetre, ecouteurs, minuteurs, corps, papiers: () => papiers};
}

test("« Imprimer sa bandelette » : une seule bandelette sort, avec SON numéro de la feuille ; la liste entière revient après", () => {
  const r = impressionRejouee(classe4());
  assert.equal(r.$("bandelettes-liste").children.length, 4, "avant : toute la classe");
  // Le code BBBB44 est le n° 3 de la feuille (Anaïs, Zoé, puis les sans-nom par code).
  r.f.imprimer("bandelettes", {id: 14});
  const impression = r.fenetre.impressions[0];
  assert.deepEqual(impression.classes, ["imprime-bandelettes"]);
  assert.equal(impression.bandelettes, 1, "une seule bandelette à l'impression");
  assert.deepEqual(impression.numeros, ["n° 3"]);
  assert.equal(impression.titre, "Bandelette à découper — 306", "au singulier");
  assert.equal(impression.consigne, "Découpe sur les pointillés et donne-la à l’élève. Même numéro que sur la feuille prénom\u00a0↔\u00a0code.",
    "la consigne au singulier, sans souche");
  // Le retour d'impression : la classe d'impression part, la liste entière revient — une seule fois.
  r.ecouteurs.afterprint.forEach(g => g());
  assert.equal(r.corps.classes.size, 0);
  assert.equal(r.papiers(), 1);
  assert.equal(r.$("bandelettes-liste").children.length, 4, "après : toute la classe, pour le bouton de la barre");
  r.minuteurs.forEach(([g]) => g());
  assert.equal(r.papiers(), 1, "le filet des 60 s ne redessine pas une seconde fois");
  // Le bouton de la barre : toujours toute la classe.
  r.f.imprimer("bandelettes");
  assert.equal(r.fenetre.impressions[1].bandelettes, 4);
  assert.equal(r.fenetre.impressions[1].titre, "Bandelettes à découper — 306");
  assert.equal(r.fenetre.impressions[1].consigne, "Découpe sur les pointillés et donne à chaque élève sa bandelette. Mêmes numéros que sur la feuille prénom\u00a0↔\u00a0code.");
  r.ecouteurs.afterprint.forEach(g => g());
  assert.equal(r.papiers(), 1, "l'impression de toute la classe n'a rien à remettre");
});

test("la bandelette d'un élève : le numéro est celui de la feuille, pas sa place dans le tableau", () => {
  const r = impressionRejouee(classe4());
  r.f.imprimer("bandelettes", {id: 13});
  assert.deepEqual(r.fenetre.impressions[0].numeros, ["n° 1"]);
  assert.deepEqual(r.fenetre.impressions[0].noms, ["Anaïs A."]);
  // En lecture seule, rien ne s'imprime (le serveur ne donne pas les codes).
  assert.match(fonction("imprimer"), /if \(droitClasse === "lecture"\) return false;/);
});

// ------------------------------------------------------------ « Les calculs qui coincent » : 3 élèves au moins

function fragilesRejoues(comptes, commences = 12) {
  const {$} = creerZones();
  const PARCOURS = {fragilesDeLaClasse: (liste, {max}) => comptes.map((n, i) => ({cle: `c${i}`, libelle: `calcul ${i}`, eleves: n})).slice(0, max)};
  const eleves = Array.from({length: commences}, () => ({lu: {parcours: {}}}));
  const seuil = script.match(/const SEUIL_FRAGILES = (\d+);/);
  assert.ok(seuil, "le seuil est écrit à un seul endroit");
  new Function("document", "$", "PARCOURS", "eleves", `const SEUIL_FRAGILES = ${seuil[1]};\n${fonction("dessinerFragiles")}\ndessinerFragiles();`)(document, $, PARCOURS, eleves);
  return {$, liste: $("fragiles-liste").children.map(li => li.textContent)};
}

test("« Les calculs qui coincent » : un calcul n'y est qu'à partir de 3 élèves (choix de Gwenaël, 18/10)", () => {
  assert.match(script, /const SEUIL_FRAGILES = 3;/);
  const r = fragilesRejoues([7, 5, 3, 3, 2, 1, 1]);
  assert.deepEqual(r.liste, ["calcul 07 élèves", "calcul 15 élèves", "calcul 23 élèves", "calcul 33 élèves"]);
  assert.equal(r.$("fragiles").hidden, false);
  assert.equal(r.$("fragiles-sous").textContent, "Sur 12 élèves qui ont commencé · 3 élèves au moins par calcul.");
  const aucun = fragilesRejoues([2, 2, 1]);
  assert.equal(aucun.$("fragiles").hidden, true, "rien à 3 élèves : la carte se tait");
  const beaucoup = fragilesRejoues([9, 8, 7, 6, 5, 4, 3, 3]);
  assert.equal(beaucoup.liste.length, 6, "toujours six au plus");
  // Le moteur rend TOUT, la page filtre puis garde les six premiers : un calcul à 3
  // élèves n'est pas écarté parce qu'il était 7e avant le filtre.
  assert.match(fonction("dessinerFragiles"), /fragilesDeLaClasse\(parcoursDeLaClasse, \{max: Infinity\}\)\s*\.filter\(fragile => fragile\.eleves >= SEUIL_FRAGILES\)\.slice\(0, 6\)/);
});

// ------------------------------------------------------------ « + Nouvelle classe »

test("Mes classes : plus de formulaire toujours affiché, une carte « + Nouvelle classe » au bout de la liste", () => {
  assert.doesNotMatch(page, /<h2>Nouvelle classe<\/h2>|id="form-classe"|id="creer-classe"|id="libelle"/);
  const charger = fonction("chargerClasses");
  assert.match(charger, /nouvelle\.className = "nouvelle-classe";[\s\S]*nouvelle\.addEventListener\("click", creerClasse\);\s*li\.appendChild\(nouvelle\);\s*liste\.appendChild\(li\);\s*annoncerFinAnnee/,
    "la dernière carte de la liste, après les classes");
  assert.ok(page.indexOf('id="bloc-profs"') > page.indexOf('id="liste-classes"'), "la partie Professeurs ne bouge pas");
  assert.match(page, /\.classes button\.nouvelle-classe \{[^}]*border: 2px dashed/);
});

test("« + Nouvelle classe » : la petite fenêtre, un nom, une seule création, puis la classe s'ouvre", async () => {
  const rejoue = async (reponse) => {
    const appels = [], messages = [];
    // Le faux serveur répond à TOUTES les demandes en attente : si un second
    // clic en envoyait une deuxième, elle se termine aussi, et le test rougit
    // sur le compte des créations au lieu de rester bloqué (vu par Code le
    // 18/10 sur Windows : le sabotage faisait pendre le test 600 s).
    const enAttente = [];
    const f = new Function("demander", "api", "chargerClasses", "ouvrirClasse", "messager", "surErreur",
      `let creationEnCours = false;\n${fonction("creerClasse")}\nreturn creerClasse;`)(
      async (texte, champs) => { appels.push(["demander", texte, champs]); return reponse; },
      (action, corps) => { appels.push([action, corps]); return new Promise(r => { enAttente.push(() => r({id: 42})); }); },
      async () => { appels.push(["chargerClasses"]); }, async id => { appels.push(["ouvrir", id]); },
      (id, t, type) => messages.push([id, t, type]), e => { throw e; });
    const p1 = f();
    await new Promise(r => setTimeout(r, 0));
    const p2 = f();   // un second clic pendant l'envoi
    await new Promise(r => setTimeout(r, 0));
    enAttente.forEach(repondre => repondre());
    await Promise.all([p1, p2]);
    return {appels, messages};
  };
  const ok = await rejoue({libelle: "  307  "});
  assert.deepEqual(ok.appels[0][2], [{nom: "libelle", libelle: "Nom de la classe", maxlength: 40, placeholder: "405"}]);
  assert.deepEqual(ok.appels.filter(a => a[0] === "classes.creer"), [["classes.creer", {libelle: "307", applis: ["defi-tables"]}]],
    "une seule classe, même avec un second clic pendant l'envoi");
  assert.deepEqual(ok.appels.slice(-2), [["chargerClasses"], ["ouvrir", 42]], "puis la nouvelle classe s'ouvre (sur Élèves : elle est vide)");
  const vide = await rejoue({libelle: "   "});
  assert.deepEqual(vide.appels.filter(a => a[0] === "classes.creer"), []);
  assert.deepEqual(vide.messages[0], ["message-classes", "Donne un nom à la classe.", "erreur"]);
  const annule = await rejoue(null);
  assert.deepEqual(annule.appels.filter(a => a[0] === "classes.creer"), [], "Annuler ne crée rien");
});

// ------------------------------------------------------------ garde-fous

test("aucun nom de fonction en double dans la page (le second masquerait le premier, en silence)", () => {
  const noms = [...script.matchAll(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]);
  const doubles = noms.filter((nom, i) => noms.indexOf(nom) !== i);
  assert.deepEqual(doubles, [], `fonctions définies deux fois : ${doubles.join(", ")}`);
});

test("les menus « ⋯ » des deux listes se ferment ensemble (un seul ouvert à la fois, dans toute la page)", () => {
  assert.match(fonction("placerMenu"), /document\.querySelectorAll\("details\.plus\[open\]"\)/);
  assert.match(fonction("fermerMenus"), /document\.querySelectorAll\("details\.plus\[open\]"\)/);
});

// ============================================================ « Qui voit quoi », lot 3 (22/10/2026)
//
// La page prof du chantier « Qui voit quoi » (conception validée par Gwenaël,
// planches 1 à 4) : la colonne « En plus » de l'onglet Élèves, « Ce que voit
// Léa… » en premier dans le menu ⋯ (propriétaire), la fenêtre qui enregistre
// à chaque clic (eleves.acces, l'état COMPLET, jamais « [] »), et dans
// ⚙ Réglages la ligne de lecture « En plus pour … ». Le serveur (lot 2) rend
// pour chaque élève `ajouts` (le rangé) et `acces` (le calculé) : la page
// MONTRE d'après `acces` et n'ÉCRIT que `ajouts`. Sabotages : voir
// qui-voit-quoi-lot-3-sabotages.py dans le dossier du lot.

const RANIA = () => ({id: 22, prenom: "Rania", initiale: "", code: "DT2XEA", ajouts: {coffres: {}},
  acces: {applis: ["defi-tables", "coffres", "splat"], reglages: {splat: {mondes: [1, 2]}}}});
const LUCAS = () => ({id: 16, prenom: "Lucas", initiale: "D", code: "VRASCL", ajouts: {splat: {mondes: [3]}},
  acces: {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2, 3]}}}});
const ALICE = () => ({id: 1, prenom: "Alice", initiale: "G", code: "UCF6AR", ajouts: {coffres: {}, splat: {mondes: [3]}},
  acces: {applis: ["defi-tables", "coffres", "splat"], reglages: {splat: {mondes: [1, 2, 3]}}}});
const LEA = () => ({id: 13, prenom: "Léa", initiale: "B", code: "BUPRPV", ajouts: {},
  acces: {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2]}}}});

function enPlusRejoue(eleve, classe = classe405()) {
  return new Function("classe", `${constantesEleves()}\n${["numerosOuverts", "enPlusDe"].map(fonction).join("\n")}\nreturn enPlusDe;`)(classe)(eleve)
    .map(plus => ({cle: plus.appli.cle, entiere: plus.entiere, listes: plus.listes.map(({liste, numeros}) => [liste.nom, numeros])}));
}

test("qui voit quoi — « en plus » = ce que voit l'élève (acces, calculé par le serveur) moins ce que donne sa classe", () => {
  assert.deepEqual(enPlusRejoue(RANIA()), [{cle: "coffres", entiere: true, listes: []}], "une appli que la classe n'a pas : entière");
  assert.deepEqual(enPlusRejoue(LUCAS()), [{cle: "splat", entiere: false, listes: [["mondes", [3]]]}], "le monde 3, pas les mondes 1-2 de la classe");
  assert.deepEqual(enPlusRejoue(ALICE()), [{cle: "coffres", entiere: true, listes: []}, {cle: "splat", entiere: false, listes: [["mondes", [3]]]}],
    "dans l'ordre de APPLIS (celui du catalogue)");
  assert.deepEqual(enPlusRejoue(LEA()), [], "rien en plus");
  // SPLAT! entière donnée à un élève d'une classe qui a les mondes 1-2 : les mondes 3 à 6.
  assert.deepEqual(enPlusRejoue({acces: {applis: ["defi-tables", "splat"], reglages: {}}}),
    [{cle: "splat", entiere: false, listes: [["mondes", [3, 4, 5, 6]]]}]);
  // Rattrapé par la classe (D4) : gardé en base, plus montré.
  const tousOuverts = {...classe405(), reglages: {}};
  assert.deepEqual(enPlusRejoue(LUCAS(), tousOuverts), [], "la classe a ouvert tous les mondes : plus rien « en plus »");
  assert.deepEqual(enPlusRejoue(RANIA(), {...classe405(), applis: ["defi-tables", "coffres", "splat"]}), [],
    "la classe a pris Coffres : Rania n'a plus rien en plus (son ajout reste rangé)");
  // Coffres que la classe a au niveau 1 seulement : niveaux 2 et 3 en plus, les opérations suivent la classe.
  const coffresN1 = {...classe405(), applis: ["defi-tables", "coffres", "splat"], reglages: {splat: {mondes: [1, 2]}, coffres: {niveaux: [1]}}};
  assert.deepEqual(enPlusRejoue({acces: {applis: ["defi-tables", "coffres", "splat"], reglages: {splat: {mondes: [1, 2]}, coffres: {niveaux: [1, 2]}}}}, coffresN1),
    [{cle: "coffres", entiere: false, listes: [["niveaux", [2]]]}]);
  // Un ajout gardé alors que la classe a perdu l'appli (D4) peut ne nommer que des numéros.
  assert.deepEqual(enPlusRejoue({acces: {applis: ["defi-tables", "coffres"], reglages: {coffres: {niveaux: [2]}}}}),
    [{cle: "coffres", entiere: false, listes: [["niveaux", [2]]]}]);
  // Sans `acces` (serveur d'avant le lot 2), ou illisible : rien, jamais d'erreur.
  for (const eleve of [{}, {acces: null}, {acces: {applis: "splat"}}, null]) assert.deepEqual(enPlusRejoue(eleve), [], JSON.stringify(eleve));
});

test("qui voit quoi — la colonne « En plus » : ⚡ l'appli entière, ③ SPLAT! Enquête dans la couleur du monde, « — » sinon", () => {
  const {lignes, appels} = ongletEleves([RANIA(), LUCAS(), ALICE(), LEA()]);
  const parPrenom = Object.fromEntries(lignes.map(tr => [tr.children[1].children[0].value.split(" ")[0], tr]));
  const pastilles = tr => tr.children[3].tous(n => aClasse(n, "ajout"));
  assert.deepEqual(pastilles(parPrenom.Rania).map(p => p.textContent), ["⚡ Coffres magiques"]);
  assert.deepEqual(pastilles(parPrenom.Alice).map(p => p.textContent), ["⚡ Coffres magiques", "3SPLAT! Enquête"]);
  const monde = pastilles(parPrenom.Lucas)[0];
  const rond = monde.premier(n => n.tag === "i");
  assert.equal(rond.textContent, "3");
  assert.equal(rond.style.background, "#be185d", "le numéro dans la couleur du monde 3 (celle des puces des Réglages)");
  assert.equal(monde.attributs["aria-label"], "SPLAT! : monde 3 en plus");
  assert.equal(parPrenom["Léa"].children[3].textContent, "—");
  // Propriétaire : des boutons qui ouvrent la fenêtre de CET élève.
  pastilles(parPrenom.Alice).forEach(p => { assert.equal(p.tag, "button"); assert.equal(p.type, "button"); p.cliquer(); });
  assert.deepEqual(appels, [["voit", 1], ["voit", 1]]);
  // Plusieurs mondes : une seule pastille, les numéros côte à côte.
  const deux = ongletEleves([{...LUCAS(), acces: {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2, 3, 4]}}}}]);
  assert.equal(deux.lignes[0].children[3].tous(n => aClasse(n, "ajout"))[0].textContent, "34SPLAT!");
  // Coffres partiel : en mots.
  const coffres = ongletEleves([{id: 5, prenom: "Tom", acces: {applis: ["defi-tables", "coffres", "splat"], reglages: {splat: {mondes: [1, 2]}, coffres: {niveaux: [2], operations: [4]}}}}]);
  assert.equal(coffres.lignes[0].children[3].textContent, "Coffres magiques : niveau 2, opération Division");
});

test("qui voit quoi — téléphone : les mêmes pastilles sous le prénom ; un collègue en écriture les lit sans pouvoir cliquer (Q2)", () => {
  const {lignes} = ongletEleves([RANIA(), LEA()]);
  // Ordre de la feuille : Léa, puis Rania.
  const sous = lignes.map(tr => tr.children[1].premier(n => aClasse(n, "ajouts-sous")));
  assert.equal(sous[0], null, "rien en plus : rien sous le prénom");
  assert.deepEqual(sous[1].tous(n => aClasse(n, "ajout")).map(p => p.textContent), ["⚡ Coffres magiques"]);
  assert.match(page, /@media \(max-width: 480px\) \{\s*#tableau-eleves th\.th-plus, #tableau-eleves td\.en-plus \{ display: none; \}\s*\.ajouts-sous \{ display: flex;/);
  assert.match(page, /\n  \.ajouts-sous \{ display: none; \}/, "sur tablette et ordinateur, la colonne seule");
  // Trouvé au navigateur (Windows, 22/10) : « Coffres magiques : niveau 2, niveau 3,
  // opération … » sur une seule ligne poussait le « ⋯ » hors de l'écran (396 px de
  // trop à 390, hors du cadre de 720 px à l'ordinateur). La pastille coupe son texte.
  const regleAjout = page.match(/\n  \.ajout \{([^}]*)\}/)[1];
  assert.match(regleAjout, /white-space: normal;/, "une pastille trop longue passe à la ligne");
  assert.doesNotMatch(regleAjout, /nowrap/);
  assert.match(page, /\n  \.ajout i \{ flex: none; \}/, "la pastille ronde du monde ne s'écrase pas");
  const collegue = ongletEleves([RANIA()], "ecriture");
  const lues = collegue.lignes[0].tous(n => aClasse(n, "ajout"));
  assert.ok(lues.length === 2 && lues.every(p => p.tag === "span" && !(p.ecouteurs.click || []).length), "du texte, pas des boutons");
  assert.equal(lues[0].textContent, "⚡ Coffres magiques");
});

// ------------------------------------------------------------ ajoutsApres : l'état complet, jamais « [] »

const ajoutsApresRejoue = () => new Function(`${constantesEleves()}\n${fonction("ajoutsApres")}\nreturn ajoutsApres;`)();

test("qui voit quoi — ce que la fenêtre envoie : tout l'état, une appli entière = {} ; un retrait SUPPRIME la clé, jamais [] ni {} à la place", () => {
  const apres = ajoutsApresRejoue();
  const cas = [
    [{}, {cle: "coffres", ouvre: true}, {coffres: {}}],
    [{coffres: {}}, {cle: "coffres", ouvre: false}, {}],
    [{splat: {mondes: [3]}}, {cle: "coffres", ouvre: true}, {splat: {mondes: [3]}, coffres: {}}],
    [{splat: {mondes: [3]}}, {cle: "splat", liste: "mondes", numero: 4, ouvre: true}, {splat: {mondes: [3, 4]}}],
    [{}, {cle: "splat", liste: "mondes", numero: 5, ouvre: true}, {splat: {mondes: [5]}}],
    // LE piège du lot 2 : vider la liste ne doit pas laisser {"splat": {}} (= SPLAT! entière) ni {"splat": {"mondes": []}}.
    [{splat: {mondes: [3]}}, {cle: "splat", liste: "mondes", numero: 3, ouvre: false}, {}],
    [{coffres: {niveaux: [2]}, splat: {mondes: [3]}}, {cle: "coffres", liste: "niveaux", numero: 2, ouvre: false}, {splat: {mondes: [3]}}],
    [{coffres: {niveaux: [2], operations: [3]}}, {cle: "coffres", liste: "niveaux", numero: 2, ouvre: false}, {coffres: {operations: [3]}}],
    // Une appli donnée entière, puis un numéro décoché : « tout, sauf lui ».
    [{splat: {}}, {cle: "splat", liste: "mondes", numero: 6, ouvre: false}, {splat: {mondes: [1, 2, 3, 4, 5]}}],
    [{coffres: {}}, {cle: "coffres", liste: "niveaux", numero: 3, ouvre: false}, {coffres: {niveaux: [1, 2], operations: [1, 2, 3, 4]}}],
    // Une valeur illisible n'est ni recopiée ni changée en « appli entière ».
    [{splat: {mondes: "3"}, coffres: []}, {cle: "defi-tables", ouvre: true}, {"defi-tables": {}}],
    [null, {cle: "splat", liste: "mondes", numero: 3, ouvre: true}, {splat: {mondes: [3]}}],
  ];
  for (const [avant, geste, attendu] of cas) {
    const copie = JSON.stringify(avant);
    assert.deepEqual(apres(avant, geste), attendu, `${copie} + ${JSON.stringify(geste)}`);
    assert.equal(JSON.stringify(avant), copie, "l'état d'avant n'est pas touché (il sert si le serveur refuse)");
  }
});

test("qui voit quoi — 2 000 suites de clics au hasard : jamais « [] », jamais une liste vide, jamais {} sauf une appli ouverte entière", () => {
  const apres = ajoutsApresRejoue();
  let graine = 7;
  // Lot 3b (relecture Codex) : les bits BAS de ce générateur tournent en rond
  // (graine % n donnait 15 921 ouvertures pour 79 retraits) — on prend les bits hauts.
  const hasard = n => { graine = (graine * 1103515245 + 12345) % 2147483648; return Math.floor(graine / 65536) % n; };
  const compte = {ouvertures: 0, retraits: 0, retraitsEffectifs: 0, dernierRetire: 0};
  const LISTES = {coffres: {niveaux: 3, operations: 4}, splat: {mondes: 6}};
  for (let essai = 0; essai < 2000; essai += 1) {
    let etat = {};
    const entieres = new Set();
    for (let clic = 0; clic < 8; clic += 1) {
      const cle = ["defi-tables", "coffres", "splat"][hasard(3)];
      const listes = Object.keys(LISTES[cle] || {});
      let geste;
      if (!listes.length || hasard(3) === 0) {
        geste = {cle, ouvre: hasard(2) === 0};
        if (geste.ouvre) entieres.add(cle); else entieres.delete(cle);
      } else {
        const liste = listes[hasard(listes.length)];
        const presents = (etat[cle] && etat[cle][liste]) || [];
        // Un retrait sur deux vise un numéro PRÉSENT (souvent le dernier de sa liste).
        const ouvre = hasard(2) === 0;
        const numero = !ouvre && presents.length && hasard(2) === 0 ? presents[hasard(presents.length)] : 1 + hasard(LISTES[cle][liste]);
        geste = {cle, liste, numero, ouvre};
        entieres.delete(cle);
      }
      const avant = JSON.stringify(etat);
      etat = apres(etat, geste);
      if (geste.ouvre) compte.ouvertures += 1;
      else {
        compte.retraits += 1;
        if (JSON.stringify(etat) !== avant) compte.retraitsEffectifs += 1;
        if (geste.liste && avant.includes(`"${geste.liste}":[${geste.numero}]`)) compte.dernierRetire += 1;
      }
      const texte = JSON.stringify(etat);
      assert.doesNotMatch(texte, /\[\]/, texte);
      for (const [une, ajout] of Object.entries(etat)) {
        assert.ok(ajout && typeof ajout === "object" && !Array.isArray(ajout), texte);
        if (!Object.keys(ajout).length) assert.ok(entieres.has(une), `{} seulement pour une appli ouverte entière : ${texte} après ${JSON.stringify(geste)}`);
        Object.values(ajout).forEach(numeros => assert.ok(Array.isArray(numeros) && numeros.length, texte));
      }
    }
  }
  // La couverture, mesurée : autant de retraits que d'ouvertures, des milliers qui changent
  // vraiment l'état, et des centaines qui retirent le DERNIER numéro d'une liste (le piège).
  assert.ok(compte.retraits > 0.4 * (compte.ouvertures + compte.retraits), JSON.stringify(compte));
  assert.ok(compte.retraitsEffectifs > 2000, JSON.stringify(compte));
  assert.ok(compte.dernierRetire > 300, JSON.stringify(compte));
});

// ------------------------------------------------------------ la fenêtre « Ce que voit Léa »

// Lot 3c : le faux serveur reçoit (action, corps, options) comme le vrai api()
// ; « base » (options.base) joue la colonne eleves.ajouts d'un vrai serveur :
// il compare « avant » à ce qu'il a, écrit ou répond 409 avec l'état vrai —
// la règle du serveur (lancer.php, « qui-voit-quoi 3c »), rejouée ici pour
// que deux fenêtres ou une réponse perdue se voient depuis la page.
function fenetreRejouee(eleve, options = {}) {
  const {$} = creerZones();
  const appels = [], messages = [], erreurs = [], reportes = [], enAttente = [];
  const boite = $("voit");
  boite.open = false;
  boite.showModal = () => { boite.open = true; };
  let fermer = () => {};
  boite.close = () => { boite.open = false; fermer(); };
  const canonique = a => JSON.stringify(Object.keys(a || {}).sort().map(cle => [cle, Object.keys(a[cle]).sort().map(nom => [nom, a[cle][nom]])]));
  const f = new Function("document", "$", "classe", "droitClasse", "api", "messager", "surErreur", "reporterAcces",
    `${constantesEleves()}\nlet voitEleve = null;\nconst voitFiles = new Map();\nconst voitAttentes = new Map();\nlet voitOuverture = 0;\nconst DELAI_ACCES_MS = ${options.delai || 15000};\n${["prenomCourt", "seElide", "deNom", "motDe", "numerosOuverts", "accesDe", "ajoutsApres", "texteEnregistre",
      "ouvrirCeQueVoit", "fermerCeQueVoit", "dessinerCeQueVoit", "voitEnAttenteDe", "changerCeQueVoit", "envoyerCeQueVoit"].map(fonction).join("\n")}
// La vraie oublierEtat (« Se déconnecter »), avec ce qu'elle touche d'autre, en figurants.
let modeles, evaluation, evalContenu, jeton, classes, eleves, estAdmin, mdpTemporaire, identifiant, annuaire, echues, tri, appliAffichee, vue, tableaux;
const detailsOuverts = new Set(); const veille = {arreter() {}}; function arreterVeilleEvaluation() {}
${fonction("oublierEtat")}
return {ouvrirCeQueVoit, fermerCeQueVoit, changerCeQueVoit, voit: () => voitEleve, deconnecter: () => { oublierEtat(); voitEleve = null; },
  enAttente: id => id === undefined ? [...voitAttentes.values()].reduce((a, b) => a + b, 0) : (voitAttentes.get(id) || 0),
  poserClasse: c => { classe = c; }, classe: () => classe, delai: () => DELAI_ACCES_MS};`)(
    document, $, options.classe || classe405(), options.droit || "proprietaire",
    async (action, corps, opts) => {
      appels.push([action, JSON.parse(JSON.stringify(corps))]);
      // « retenir » : la réponse n'arrive que quand le test la libère (reponses[i]()).
      if (options.retenir) await new Promise(libere => enAttente.push(libere));
      // « muet » : le serveur ne répond jamais ; seul le signal d'abandon en sort.
      if (options.muet) {
        await new Promise((_, refuse) => {
          const signal = opts && opts.signal;
          if (!signal) return;
          const abandon = () => { const e = new Error("The operation was aborted."); e.name = "AbortError"; refuse(e); };
          if (signal.aborted) abandon(); else signal.addEventListener("abort", abandon);
        });
      }
      if (options.echec) throw options.echec;
      if (options.base) {
        // Le serveur du lot 3c : « avant » doit être ce qu'il a rangé.
        if (canonique(corps.avant) !== canonique(options.base.ajouts)) {
          const e = new Error(`Ce que voit ${eleve.prenom || "cet élève"} a changé ailleurs : la fenêtre est à jour, refais ton clic.`);
          e.statut = 409;
          e.donnees = {ok: false, erreur: e.message, ajouts: options.base.ajouts, acces: options.accesDe(options.base.ajouts)};
          throw e;
        }
        options.base.ajouts = JSON.parse(JSON.stringify(corps.ajouts));
        if (options.perdre && options.perdre()) { const e = new Error("Failed to fetch"); e.name = "TypeError"; throw e; }
      }
      return {ok: true, ajouts: corps.ajouts, acces: options.accesDe ? options.accesDe(corps.ajouts) : (options.accesApres || eleve.acces)};
    },
    (id, t, type) => messages.push([id, t, type]), (e, zone) => erreurs.push([e.message, zone]),
    options.reporterAcces || ((el, ajouts, acces) => { reportes.push([el.id, ajouts]); el.ajouts = ajouts; el.acces = acces; }));
  fermer = f.fermerCeQueVoit;
  f.ouvrirCeQueVoit(eleve);
  const liste = $("voit-liste");
  const ligne = cle => liste.children.find(bloc => bloc.premier(n => n.tag === "input" && n.dataset.appli === cle));
  const caseAppli = cle => liste.premier(n => n.tag === "input" && n.dataset.appli === cle);
  const caseNumero = (nom, numero) => liste.premier(n => n.tag === "input" && n.dataset.liste === nom && n.dataset.numero === String(numero));
  return {f, $, boite, appels, messages, erreurs, reportes, enAttente, liste, ligne, caseAppli, caseNumero};
}

test("qui voit quoi — la fenêtre : la classe cochée et grisée « par la classe », l'ajout « en plus », le reste à cocher (planche 2)", () => {
  const r = fenetreRejouee(LUCAS());
  assert.equal(r.boite.open, true);
  assert.equal(r.$("voit-titre").textContent, "Ce que voit Lucas");
  assert.equal(r.$("voit-sous").textContent,
    "Sa classe (405) décide, et tu peux lui ouvrir des choses en plus. Rien ne lui est retiré : ce que la classe a, Lucas l’a.");
  assert.equal(r.$("voit-sous").premier(n => n.tag === "b").textContent, "en plus");
  assert.deepEqual(r.liste.children.map(bloc => bloc.premier(n => n.tag === "strong").textContent), ["Défi tables", "Coffres magiques", "Anzan", "SPLAT!"],
    "toutes les applis que la page sait montrer, dans l'ordre (Anzan depuis le lot 4b)");
  for (const cle of ["defi-tables", "splat"]) {
    assert.deepEqual([r.caseAppli(cle).checked, r.caseAppli(cle).disabled], [true, true], `${cle} : par la classe, non cliquable`);
    assert.ok(aClasse(r.ligne(cle), "par-classe"));
    assert.equal(r.ligne(cle).premier(n => aClasse(n, "tag")).textContent, "par la classe");
  }
  assert.deepEqual([r.caseAppli("coffres").checked, r.caseAppli("coffres").disabled], [false, false]);
  assert.equal(r.ligne("coffres").premier(n => aClasse(n, "tag")), null);
  assert.equal(r.ligne("coffres").premier(n => aClasse(n, "sous-reglage")), null, "pas de puces sous une appli que la classe n'a pas (D3)");
  const puces = r.ligne("splat").tous(n => aClasse(n, "puce-monde"));
  assert.deepEqual(puces.map(p => p.className.replace("puce-monde ", "")), ["classe", "classe", "plus", "ferme", "ferme", "ferme"]);
  assert.deepEqual(puces.map(p => p.textContent), ["1Petit", "2Classique", "3Enquête", "4Système", "5Équations", "6Relatifs"]);
  assert.deepEqual([1, 2, 3, 4].map(n => [r.caseNumero("mondes", n).checked, r.caseNumero("mondes", n).disabled]),
    [[true, true], [true, true], [true, false], [false, false]]);
  // Rania : Coffres « en plus », coché et cliquable.
  const rania = fenetreRejouee(RANIA());
  assert.deepEqual([rania.caseAppli("coffres").checked, rania.caseAppli("coffres").disabled], [true, false]);
  assert.equal(rania.ligne("coffres").premier(n => aClasse(n, "tag")).className, "tag plus");
  assert.equal(rania.ligne("coffres").premier(n => aClasse(n, "tag")).textContent, "en plus");
  // Une classe qui a Coffres au niveau 1 : niveaux 2-3 et opérations à cocher, cases simples comme dans les Réglages.
  const coffresN1 = {...classe405(), applis: ["defi-tables", "coffres", "splat"], reglages: {splat: {mondes: [1, 2]}, coffres: {niveaux: [1]}}};
  const tom = fenetreRejouee({id: 5, prenom: "Tom", ajouts: {}, acces: {applis: ["defi-tables", "coffres", "splat"], reglages: coffresN1.reglages}}, {classe: coffresN1});
  assert.deepEqual([1, 2, 3].map(n => tom.caseNumero("niveaux", n).disabled), [true, false, false]);
  assert.deepEqual([1, 2, 3, 4].map(n => tom.caseNumero("operations", n).disabled), [true, true, true, true], "toutes les opérations ouvertes par la classe");
  assert.equal(tom.ligne("coffres").premier(n => aClasse(n, "cases-coffres")).tag, "div");
});

test("qui voit quoi — chaque clic enregistre l'état complet (eleves.acces) et le dit en bas ; une erreur remet la case", async () => {
  const r = fenetreRejouee(LUCAS());
  const quatre = r.caseNumero("mondes", 4);
  quatre.checked = true;
  await r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: true}, quatre);
  assert.deepEqual(r.appels, [["eleves.acces", {eleve_id: 16, avant: {splat: {mondes: [3]}}, ajouts: {splat: {mondes: [3, 4]}}}]],
    "lot 3c : « avant », l'état rangé tel que la page le connaît, part avec l'état voulu");
  assert.deepEqual(r.reportes, [[16, {splat: {mondes: [3, 4]}}]], "le rangé et le calculé sont reportés sur l'élève");
  assert.deepEqual(r.messages.at(-1), ["voit-message", "Enregistré : le monde 4 est ouvert à Lucas.", "ok"]);
  // Le dernier monde retiré : la clé part, rien d'autre.
  const lucas = {...LUCAS(), ajouts: {splat: {mondes: [3]}}};
  const r2 = fenetreRejouee(lucas);
  const trois = r2.caseNumero("mondes", 3);
  trois.checked = false;
  await r2.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 3, ouvre: false}, trois);
  assert.deepEqual(r2.appels[0][1].ajouts, {}, "pas {splat: {}} (= SPLAT! entière), pas {splat: {mondes: []}}");
  assert.deepEqual(r2.messages.at(-1), ["voit-message", "Enregistré : le monde 3 n’est plus ouvert à Lucas.", "ok"]);
  // Le clic passe par la case elle-même (écouteur « change »).
  const r3 = fenetreRejouee(RANIA());
  r3.caseAppli("coffres").checked = false;
  r3.caseAppli("coffres").changer();
  await new Promise(fin => setTimeout(fin, 5));
  assert.deepEqual(r3.appels, [["eleves.acces", {eleve_id: 22, avant: {coffres: {}}, ajouts: {}}]]);
  assert.deepEqual(r3.messages.at(-1), ["voit-message", "Enregistré : Rania ne voit plus Coffres magiques.", "ok"]);
  // Le serveur refuse : la case revient, les cases redeviennent cliquables, le message est dans la fenêtre.
  const panne = fenetreRejouee(RANIA(), {echec: new Error("Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.")});
  const coffres = panne.caseAppli("coffres");
  coffres.checked = false;
  await panne.f.changerCeQueVoit({cle: "coffres", ouvre: false}, coffres);
  assert.equal(coffres.checked, true, "Coffres revient coché : rien n'a changé");
  // La fenêtre est redessinée d'après l'élève (inchangé) : la case affichée, cochée et cliquable.
  assert.equal(panne.caseAppli("coffres").checked, true);
  assert.equal(panne.caseAppli("coffres").disabled, false);
  assert.ok(panne.liste.tous(n => n.tag === "input" && n.dataset.liste).every(c => c.disabled === (Number(c.dataset.numero) <= 2)),
    "seules les cases de la classe restent grisées");
  assert.deepEqual(panne.erreurs, [["Le serveur doit être mis à niveau : ouvre migrer.php avec ton mot de passe d'installation.", "voit-message"]]);
  assert.deepEqual(panne.reportes, [], "rien n'est reporté sur l'élève");
  assert.equal(panne.liste.attributs["aria-busy"], "false");
});

test("qui voit quoi — les mots du pied de la fenêtre", () => {
  const dire = new Function(`${constantesEleves()}\n${["prenomCourt", "seElide", "deNom", "motDe", "texteEnregistre"].map(fonction).join("\n")}\nreturn texteEnregistre;`)();
  assert.equal(dire({prenom: "Rania"}, {cle: "coffres", ouvre: true}), "Enregistré : Rania voit Coffres magiques.");
  assert.equal(dire({prenom: "Rania"}, {cle: "coffres", ouvre: false}), "Enregistré : Rania ne voit plus Coffres magiques.");
  assert.equal(dire({prenom: "Lucas"}, {cle: "splat", liste: "mondes", numero: 3, ouvre: true}), "Enregistré : le monde 3 est ouvert à Lucas.");
  assert.equal(dire({prenom: "Léa"}, {cle: "coffres", liste: "niveaux", numero: 2, ouvre: true}), "Enregistré : le niveau 2 de Coffres magiques est ouvert à Léa.");
  assert.equal(dire({prenom: "Léa"}, {cle: "coffres", liste: "operations", numero: 4, ouvre: false}),
    "Enregistré : l’opération Division de Coffres magiques n’est plus ouverte à Léa.");
  assert.equal(dire({prenom: ""}, {cle: "coffres", ouvre: true}), "Enregistré : cet élève voit Coffres magiques.");
});

test("qui voit quoi — propriétaire seulement (Q2) : un collègue n'ouvre pas la fenêtre, et le serveur le refuse aussi", () => {
  const collegue = fenetreRejouee(RANIA(), {droit: "ecriture"});
  assert.equal(collegue.boite.open, false);
  assert.equal(collegue.f.voit(), null);
  assert.equal(collegue.liste.children.length, 0);
  assert.match(fonction("ouvrirCeQueVoit"), /if \(!classe \|\| droitClasse !== "proprietaire" \|\| !eleve\) return;/);
  assert.match(readFileSync(join(racine, "_serveur/public/api/prof.php"), "utf8"), /'eleves\.acces' => 'proprietaire',/);
});

// ------------------------------------------------------------ ⚙ Réglages : « En plus pour … »

function enPlusPourRejoue(liste, options = {}) {
  const {$} = creerZones();
  const allees = [];
  new Function("document", "$", "classe", "droitClasse", "eleves", "allerALEleve",
    `${constantesEleves()}\n${["nomAffiche", "ordreDeLaFeuille", "motDe", "numerosOuverts", "enPlusDe", "ligneEnPlusPour", "poserEnPlusPour"].map(fonction).join("\n")}\nposerEnPlusPour();`)(
    document, $, options.classe || classe405(), options.droit || "proprietaire", liste, id => allees.push(id));
  return {$, allees};
}

test("qui voit quoi — ⚙ Réglages : sous chaque appli, en lecture, « En plus pour … » — chaque prénom mène à sa ligne", () => {
  const r = enPlusPourRejoue([LEA(), RANIA(), LUCAS(), ALICE()]);
  assert.equal(r.$("en-plus-coffres").textContent, "En plus pour Alice G., Rania", "l'appli entière : les prénoms, dans l'ordre de la feuille");
  assert.equal(r.$("en-plus-coffres").hidden, false);
  assert.equal(r.$("en-plus-splat-listes").textContent, "En plus pour monde 3 : Alice G., Lucas D.");
  assert.equal(r.$("en-plus-splat").hidden, true, "la classe a SPLAT! : rien à côté de son nom");
  assert.equal(r.$("en-plus-defi-tables").hidden, true);
  assert.equal(r.$("en-plus-coffres-listes").hidden, true);
  const noms = r.$("en-plus-coffres").tous(n => n.tag === "button");
  assert.deepEqual(noms.map(b => [b.textContent, b.children.length]), [["Alice G.", 0], ["Rania", 0]], "des prénoms en texte, jamais du HTML");
  noms[1].cliquer();
  assert.deepEqual(r.allees, [22]);
  // Lecture seule : aucune case, aucun appel au serveur dans ces lignes.
  assert.doesNotMatch(fonction("poserEnPlusPour") + fonction("ligneEnPlusPour"), /api\(|input|checkbox/);
  // Plusieurs numéros : une ligne chacun, dans l'ordre.
  const deux = enPlusPourRejoue([{...LUCAS(), acces: {applis: ["defi-tables", "splat"], reglages: {splat: {mondes: [1, 2, 3, 5]}}}}]);
  assert.deepEqual(deux.$("en-plus-splat-listes").children.map(l => l.textContent), ["En plus pour monde 3 : Lucas D.", "En plus pour monde 5 : Lucas D."]);
  // Un élève sans prénom : son numéro de la feuille.
  const sans = enPlusPourRejoue([{...RANIA(), prenom: ""}, LEA()]);
  assert.equal(sans.$("en-plus-coffres").textContent, "En plus pour n° 2 (sans prénom)");
  // Rien à dire : tout reste caché ; un collègue n'a pas les Réglages.
  const rien = enPlusPourRejoue([LEA()]);
  ["en-plus-defi-tables", "en-plus-coffres", "en-plus-coffres-listes", "en-plus-splat", "en-plus-splat-listes"].forEach(id => assert.equal(rien.$(id).hidden, true, id));
  const collegue = enPlusPourRejoue([RANIA()], {droit: "ecriture"});
  assert.equal(collegue.$("en-plus-coffres").textContent, "");
  assert.match(fonction("poserActivites"), /poserEnPlusPour\(\);\s*\}$/, "redessinées avec les cases des Réglages");
});

// ------------------------------------------------------------ ce que la page reporte, et la règle du 18/10

test("qui voit quoi — après un enregistrement : l'élève est mis à jour dans toutes les listes lues, SPLAT! recompte ses mondes", () => {
  const tables = [{id: 16, prenom: "Lucas"}, {id: 2, prenom: "Zoé"}];
  const splat = [{id: 16, prenom: "Lucas", parcours: {p: 1}}, {id: 2, prenom: "Zoé"}];
  const lus = [], suites = [];
  new Function("tableaux", "lireSplat", "redessin", "poserEnPlusPour", "poserOnglets", "appliAffichee", "afficherAppli",
    `${fonction("reporterAcces")}\nreporterAcces(tableaux.splat[0], {splat: {mondes: [3, 4]}}, {applis: ["splat"], reglages: {}});`)(
    {"defi-tables": tables, splat}, (brut, eleve) => { lus.push([brut, eleve.acces.applis]); return {relu: true}; },
    {demander: () => suites.push("redessin")}, () => suites.push("en plus pour"),
    () => { suites.push("onglets"); return ["defi-tables", "splat"]; }, "splat", cle => suites.push(`afficher ${cle}`));
  assert.deepEqual(tables[0].ajouts, {splat: {mondes: [3, 4]}});
  assert.deepEqual(splat[0].acces, {applis: ["splat"], reglages: {}});
  assert.deepEqual(splat[0].lu, {relu: true});
  assert.deepEqual(lus, [[{p: 1}, ["splat"]]]);
  assert.equal(tables[1].ajouts, undefined, "les autres élèves ne bougent pas");
  assert.deepEqual(suites, ["redessin", "en plus pour", "onglets"], "lot 4b : les onglets suivent ; l'onglet affiché est toujours là, on y reste");
});

test("lot 4b — une appli donnée ou retirée en plus fait apparaître ou disparaître son onglet ; si c'était l'onglet affiché, on passe au premier qui reste", () => {
  const rejouer = (affichee, restants) => {
    const suites = [];
    new Function("tableaux", "lireSplat", "redessin", "poserEnPlusPour", "poserOnglets", "appliAffichee", "afficherAppli",
      `${fonction("reporterAcces")}\nreporterAcces(tableaux["flash-anzan"][0], {}, {applis: ["defi-tables"], reglages: {}});`)(
      {"flash-anzan": [{id: 7, prenom: "Rania"}]}, () => ({}), {demander: () => {}}, () => {},
      () => restants, affichee, cle => suites.push(cle));
    return suites;
  };
  assert.deepEqual(rejouer("flash-anzan", ["defi-tables", "splat"]), ["defi-tables"], "Anzan retiré à Rania pendant qu'on regardait son onglet");
  assert.deepEqual(rejouer("splat", ["defi-tables", "splat"]), [], "un autre onglet : on ne bouge pas");
});

test("qui voit quoi — aucun code d'élève hors de l'onglet Élèves (règle du 18/10), les prénoms en textContent", () => {
  const section = script.slice(script.indexOf("// ------------------------------------------------ qui voit quoi (lot 3"),
    script.indexOf("  function dessinerTableau() {"));
  assert.ok(section.length > 2000, "la section du lot");
  assert.doesNotMatch(section, /\.code\b|celluleCode|innerHTML|insertAdjacentHTML/);
  assert.equal([...script.matchAll(/celluleCode\(/g)].length, 2, "celluleCode : toujours sa définition et UN appel");
});

test("qui voit quoi — le HTML : la colonne, la fenêtre, les lignes des Réglages, et tout part à la déconnexion", () => {
  assert.match(page, /<th class="th-plus" title="[^"]+">En plus<\/th><th><\/th><\/tr><\/thead>/);
  assert.match(page, /<dialog id="voit" class="voit" aria-labelledby="voit-titre">\s*<div class="voit-tete">\s*<h2 id="voit-titre"><\/h2>\s*<p id="voit-sous"><\/p>\s*<\/div>\s*<div class="voit-liste" id="voit-liste"><\/div>\s*<div class="voit-pied">\s*<p class="message" id="voit-message" role="status" hidden><\/p>\s*<button type="button" class="secondaire" id="voit-fermer">Fermer<\/button>/);
  assert.match(page, /dialog\.voit \{ max-width: 560px;/);
  // Les lignes « En plus pour » : sous chaque appli, et sous ses mondes / niveaux.
  for (const [bloc, id] of [["liste-activites", "en-plus-defi-tables"], ["liste-activites", "en-plus-coffres"], ["coffres-reglages", "en-plus-coffres-listes"],
    ["liste-activites", "en-plus-splat"], ["mondes-ouverts", "en-plus-splat-listes"]]) {
    assert.ok(dans(bloc, id), `${id} est dans ${bloc}`);
    assert.match(page, new RegExp(`<div class="en-plus-pour" id="${id}" hidden></div>`));
  }
  const vider = new Function(`${constante("ZONES_TEXTE")}\n${constante("ZONES_MESSAGE")}\nreturn {ZONES_TEXTE, ZONES_MESSAGE};`)();
  for (const id of ["voit-titre", "voit-sous", "voit-liste", "en-plus-defi-tables", "en-plus-coffres", "en-plus-coffres-listes", "en-plus-splat", "en-plus-splat-listes"]) {
    assert.ok(vider.ZONES_TEXTE.includes(id), `${id} vidé à la déconnexion`);
  }
  assert.ok(vider.ZONES_MESSAGE.includes("voit-message"));
  assert.match(fonction("viderZones"), /\["boite", "secret", "eval-modele", "eval-ouvrir", "voit", "parcours-anzan"\]\.forEach/, "les fenêtres se ferment à la déconnexion (lot 4b : le parcours Anzan aussi)");
  assert.match(fonction("oublierEtat"), /voitEleve = null;/);
  assert.match(script, /\$\("voit-fermer"\)\.addEventListener\("click", \(\) => \{ \$\("voit"\)\.close\(\); \}\);/, "« Fermer » ne fait que fermer");
  assert.match(script, /\$\("voit"\)\.addEventListener\("close", fermerCeQueVoit\);/, "fermée (bouton ou Échap)…");
  assert.match(fonction("fermerCeQueVoit"), /voitEleve = null;\s*voitOuverture \+= 1;\s*\["voit-titre", "voit-sous", "voit-liste"\]\.forEach\(id => \{ \$\(id\)\.textContent = ""; \}\);\s*messager\("voit-message", "", ""\);/,
    "…la fenêtre oublie l'élève et ses prénoms");
});

test("qui voit quoi — les mondes, niveaux et opérations de la fenêtre sont ceux des Réglages, mot pour mot", () => {
  const LISTES = new Function(`${constante("LISTES_PAR_ELEVE")}\nreturn LISTES_PAR_ELEVE;`)();
  const mondes = [...page.matchAll(/<label class="puce-monde" data-monde="(\d)"><input type="checkbox" data-monde="\d"><i aria-hidden="true">\d<\/i>([^<]+)<\/label>/g)].map(m => [Number(m[1]), m[2]]);
  assert.deepEqual(LISTES.splat[0].numeros, mondes);
  const niveaux = [...page.matchAll(/<label><input type="checkbox" data-niveau="(\d)"> ([^<]+)<\/label>/g)].map(m => [Number(m[1]), m[2]]);
  const operations = [...page.matchAll(/<label><input type="checkbox" data-operation="(\d)"> ([^<]+)<\/label>/g)].map(m => [Number(m[1]), m[2]]);
  assert.deepEqual(LISTES.coffres.find(l => l.nom === "niveaux").numeros, niveaux);
  assert.deepEqual(LISTES.coffres.find(l => l.nom === "operations").numeros, operations);
  // Les noms des listes et leurs bornes : celles que le serveur déclare (lib/applis.php).
  const applis = readFileSync(join(racine, "_serveur/public/lib/applis.php"), "utf8");
  assert.match(applis, /'reglages' => \['niveaux' => 3, 'operations' => 4\]/);
  assert.match(applis, /'reglages' => \['mondes' => 6\]/);
  assert.deepEqual([niveaux.length, operations.length, mondes.length], [3, 4, 6]);
});

// ------------------------------------------------------------ lot 3b : les réponses qui arrivent en retard (relecture Codex, 22/10)

const libererTout = async r => { while (r.enAttente.length) { r.enAttente.shift()(); await new Promise(fin => setTimeout(fin, 5)); } };
const tic = () => new Promise(fin => setTimeout(fin, 5));
// Le faux serveur : ce que voit Lucas = mondes 1-2 de la classe + ses ajouts.
const accesLucas = ajouts => ({applis: ["defi-tables", "splat"],
  reglages: {splat: {mondes: [...new Set([1, 2, ...((ajouts.splat && ajouts.splat.mondes) || [])])].sort((a, b) => a - b)}}});

test("qui voit quoi 3b — décocher 4, fermer, rouvrir AVANT la réponse, cocher 5 : le serveur reçoit [3], puis [3, 5] — le 4 reste fermé", async () => {
  const lucas = {...LUCAS(), ajouts: {splat: {mondes: [3, 4]}}, acces: accesLucas({splat: {mondes: [3, 4]}})};
  const r = fenetreRejouee(lucas, {retenir: true, accesDe: accesLucas});
  const quatre = r.caseNumero("mondes", 4);
  quatre.checked = false;
  const premier = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: false}, quatre);
  await tic();
  r.boite.close();
  r.f.ouvrirCeQueVoit(lucas);
  // La fenêtre rouverte : grisée tant que la réponse n'est pas là.
  assert.ok(r.liste.tous(n => n.tag === "input").every(c => c.disabled), "tout est grisé pendant l'envoi");
  assert.equal(r.liste.attributs["aria-busy"], "true");
  // Un clic qui passerait quand même (clavier, page lente) fait la queue.
  const cinq = r.caseNumero("mondes", 5);
  cinq.checked = true;
  const second = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinq);
  await libererTout(r);
  await Promise.all([premier, second]);
  assert.deepEqual(r.appels.map(([, corps]) => corps.ajouts), [{splat: {mondes: [3]}}, {splat: {mondes: [3, 5]}}],
    "le second envoi part de ce que le serveur a répondu au premier");
  assert.deepEqual(lucas.ajouts, {splat: {mondes: [3, 5]}});
  // La fenêtre, l'élève et le serveur disent la même chose.
  assert.deepEqual([3, 4, 5].map(n => r.caseNumero("mondes", n).checked), [true, false, true]);
  assert.ok([3, 4, 5, 6].every(n => !r.caseNumero("mondes", n).disabled), "les cases redeviennent cliquables");
  assert.equal(r.f.enAttente(), 0);
  assert.deepEqual(r.messages.at(-1), ["voit-message", "Enregistré : le monde 5 est ouvert à Lucas.", "ok"],
    "le message est celui du clic fait DANS cette fenêtre");
  assert.ok(!r.messages.some(([, t]) => t === "Enregistré : le monde 4 n’est plus ouvert à Lucas."),
    "le message de la première fenêtre ne s'écrit pas dans la seconde");
});

test("qui voit quoi 3b — fermée (bouton ou Échap) avant la réponse : rien ne se réécrit dans la fenêtre, l'élève est quand même à jour", async () => {
  const lucas = {...LUCAS(), acces: accesLucas({splat: {mondes: [3]}})};
  const r = fenetreRejouee(lucas, {retenir: true, accesDe: accesLucas});
  const six = r.caseNumero("mondes", 6);
  six.checked = true;
  const envoi = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 6, ouvre: true}, six);
  await tic();
  r.boite.close();
  r.messages.length = 0;
  await libererTout(r);
  await envoi;
  assert.deepEqual(["voit-titre", "voit-sous", "voit-liste", "voit-message"].map(id => r.$(id).textContent), ["", "", "", ""]);
  assert.deepEqual(r.messages, [], "aucun message vers la fenêtre fermée");
  assert.deepEqual(lucas.ajouts, {splat: {mondes: [3, 6]}}, "l'enregistrement, lui, est fait et reporté");
  assert.equal(r.f.voit(), null);
});

test("qui voit quoi 3b — une erreur qui arrive fenêtre fermée : le message va sous les boutons d'Élèves, pas dans le vide", async () => {
  const r = fenetreRejouee(RANIA(), {retenir: true, echec: new Error("Le serveur ne répond pas.")});
  const coffres = r.caseAppli("coffres");
  coffres.checked = false;
  const envoi = r.f.changerCeQueVoit({cle: "coffres", ouvre: false}, coffres);
  await tic();
  r.boite.close();
  await libererTout(r);
  await envoi;
  assert.deepEqual(r.erreurs, [["Le serveur ne répond pas.", "message-classe"]]);
  assert.equal(r.$("voit-message").textContent, "");
  // Rouverte ensuite : la vérité du serveur (Coffres toujours là), cliquable.
  r.f.ouvrirCeQueVoit(r.f.voit() || RANIA());
  assert.equal(r.caseAppli("coffres").checked, true);
  assert.equal(r.caseAppli("coffres").disabled, false);
});

test("qui voit quoi 3b — les envois font la queue (par élève depuis 3c) : chacun calcule son état AU MOMENT DE PARTIR", () => {
  const changer = fonction("changerCeQueVoit"), envoyer = fonction("envoyerCeQueVoit");
  assert.doesNotMatch(changer, /ajoutsApres/, "pas d'état calculé au moment du clic");
  assert.match(changer, /const file = voitFiles\.get\(eleve\.id\) \|\| Promise\.resolve\(\);\s*const tour = file\.then\(\(\) => envoyerCeQueVoit\(eleve, geste, caseCochee, ouverture, classeDepart\)\);\s*voitFiles\.set\(eleve\.id, tour\.catch\(\(\) => \{\}\)\);/);
  assert.match(envoyer, /const avant = eleve\.ajouts \|\| \{\};\s*const ajouts = ajoutsApres\(eleve\.ajouts, geste\);\s*const reponse = await api\("eleves\.acces", \{eleve_id: eleve\.id, avant, ajouts\}, \{signal: garde\.signal\}\);/);
  assert.match(fonction("ouvrirCeQueVoit"), /voitOuverture \+= 1;/);
});

// ------------------------------------------------------------ lot 3c : le serveur refuse un état périmé (seconde relecture Codex, 22/10 au soir)
//
// La queue du 3b ne protège que ce qu'UNE fenêtre sait. Deux onglets sur le
// même élève, ou une réponse perdue en route, font envoyer un état complet
// FAUX — et le serveur, qui remplace tout, rouvrait un monde retiré ailleurs.
// Désormais chaque envoi porte « avant » ; le faux serveur ci-dessous (options
// .base) applique la règle du vrai : il n'écrit que si « avant » est encore sa
// colonne, sinon 409 avec l'état vrai. Les sabotages : voir
// qui-voit-quoi-lot-3c-sabotages.py dans le dossier du lot.

const baseLucas = mondes => ({ajouts: {splat: {mondes}}});
const lucasQuiCroit = mondes => ({...LUCAS(), ajouts: {splat: {mondes}}, acces: accesLucas({splat: {mondes}})});
const mondesCoches = r => [3, 4, 5, 6].map(n => r.caseNumero("mondes", n).checked);

test("qui voit quoi 3c — deux onglets sur Lucas : A retire le 4, B (en retard) ajoute le 5 → B est refusé, la base garde le 4 fermé, B se met à jour", async () => {
  const base = baseLucas([3, 4]);
  const a = fenetreRejouee(lucasQuiCroit([3, 4]), {base, accesDe: accesLucas});
  const b = fenetreRejouee(lucasQuiCroit([3, 4]), {base, accesDe: accesLucas});
  const quatreA = a.caseNumero("mondes", 4);
  quatreA.checked = false;
  await a.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: false}, quatreA);
  assert.deepEqual(base.ajouts, {splat: {mondes: [3]}}, "A a retiré le 4");
  // B croit encore à [3, 4] et coche le 5.
  const cinqB = b.caseNumero("mondes", 5);
  cinqB.checked = true;
  await b.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinqB);
  assert.deepEqual(b.appels.at(-1)[1], {eleve_id: 16, avant: {splat: {mondes: [3, 4]}}, ajouts: {splat: {mondes: [3, 4, 5]}}}, "B envoie ce qu'il croit");
  assert.deepEqual(base.ajouts, {splat: {mondes: [3]}}, "LE point : la base n'a pas pris [3, 4, 5], le 4 reste fermé");
  assert.deepEqual(b.reportes.at(-1), [16, {splat: {mondes: [3]}}], "B reporte l'état vrai reçu avec le 409");
  assert.deepEqual(mondesCoches(b), [true, false, false, false], "la fenêtre de B se redessine : 4 et 5 décochés");
  assert.ok([3, 4, 5, 6].every(n => !b.caseNumero("mondes", n).disabled), "et redevient cliquable");
  assert.deepEqual(b.erreurs, [["Ce que voit Lucas a changé ailleurs : la fenêtre est à jour, refais ton clic.", "voit-message"]], "le message, dans la fenêtre");
  assert.ok(!b.messages.some(([, t]) => t.startsWith("Enregistré")), "rien d'« Enregistré » pour un clic refusé");
  assert.equal(b.f.enAttente(), 0);
  // B refait son clic : il part de l'état vrai et passe.
  const cinqB2 = b.caseNumero("mondes", 5);
  cinqB2.checked = true;
  await b.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinqB2);
  assert.deepEqual(b.appels.at(-1)[1], {eleve_id: 16, avant: {splat: {mondes: [3]}}, ajouts: {splat: {mondes: [3, 5]}}});
  assert.deepEqual(base.ajouts, {splat: {mondes: [3, 5]}});
  assert.deepEqual(b.messages.at(-1), ["voit-message", "Enregistré : le monde 5 est ouvert à Lucas.", "ok"]);
  // A, lui, est en retard maintenant : son prochain clic sera refusé de la même façon.
  const sixA = a.caseNumero("mondes", 6);
  sixA.checked = true;
  await a.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 6, ouvre: true}, sixA);
  assert.deepEqual(base.ajouts, {splat: {mondes: [3, 5]}}, "A n'a pas écrasé le 5 de B");
  assert.deepEqual(mondesCoches(a), [true, false, true, false], "A voit maintenant le 5 ouvert par B");
});

test("qui voit quoi 3c — une réponse perdue : le serveur a écrit [3], la page le croit à [3, 4] ; cocher 5 est refusé, jamais [3, 4, 5] en base", async () => {
  const base = baseLucas([3, 4]);
  let perdre = true;
  const r = fenetreRejouee(lucasQuiCroit([3, 4]), {base, accesDe: accesLucas, perdre: () => perdre});
  const quatre = r.caseNumero("mondes", 4);
  quatre.checked = false;
  await r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: false}, quatre);
  assert.deepEqual(base.ajouts, {splat: {mondes: [3]}}, "le serveur a bien écrit…");
  assert.deepEqual(r.erreurs, [["Le serveur n’a pas répondu : recharge la page pour vérifier les accès de Lucas avant de recommencer.", "voit-message"]],
    "…mais la page a reçu une erreur réseau (« Failed to fetch » du navigateur, dit en français)");
  assert.deepEqual(r.reportes, [], "elle n'a rien reporté : elle croit toujours à [3, 4]");
  assert.deepEqual(mondesCoches(r), [true, true, false, false], "la case 4 est revenue cochée (c'est ce que la page croit)");
  // Le clic suivant : « avant » dit [3, 4], la base dit [3] → 409, l'état vrai arrive.
  perdre = false;
  const cinq = r.caseNumero("mondes", 5);
  cinq.checked = true;
  await r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinq);
  assert.deepEqual(base.ajouts, {splat: {mondes: [3]}}, "LE point : la base ne vaut pas [3, 4, 5]");
  assert.deepEqual(r.reportes, [[16, {splat: {mondes: [3]}}]]);
  assert.deepEqual(mondesCoches(r), [true, false, false, false], "la fenêtre dit enfin la vérité : le 4 est fermé");
  assert.equal(r.erreurs.at(-1)[0], "Ce que voit Lucas a changé ailleurs : la fenêtre est à jour, refais ton clic.");
  assert.equal(r.erreurs.at(-1)[1], "voit-message");
  // Refait : ça passe, sans le 4.
  const cinq2 = r.caseNumero("mondes", 5);
  cinq2.checked = true;
  await r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinq2);
  assert.deepEqual(base.ajouts, {splat: {mondes: [3, 5]}});
  assert.deepEqual(mondesCoches(r), [true, false, true, false]);
});

test("qui voit quoi 3c — un envoi qui traîne ne grise que la fenêtre de SON élève ; celle d'un autre élève reste cliquable", async () => {
  const lucas = lucasQuiCroit([3]);
  const r = fenetreRejouee(lucas, {retenir: true, accesDe: accesLucas});
  const quatre = r.caseNumero("mondes", 4);
  quatre.checked = true;
  const envoi = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: true}, quatre);
  await tic();
  assert.equal(r.f.enAttente(16), 1);
  r.boite.close();
  // Alice, pendant que Lucas attend : rien n'est grisé chez elle.
  const alice = ALICE();
  r.f.ouvrirCeQueVoit(alice);
  assert.equal(r.$("voit-titre").textContent, "Ce que voit Alice");
  assert.equal(r.liste.attributs["aria-busy"], "false", "la fenêtre d'Alice n'attend rien");
  assert.ok(r.liste.tous(n => n.tag === "input" && n.dataset.liste).some(c => !c.disabled), "ses mondes à cocher sont cliquables");
  assert.equal(r.caseAppli("coffres").disabled, false);
  assert.equal(r.f.enAttente(1), 0);
  // Et son clic part tout de suite : il ne fait pas la queue derrière Lucas.
  const coffresAlice = r.caseAppli("coffres");
  coffresAlice.checked = false;
  const envoiAlice = r.f.changerCeQueVoit({cle: "coffres", ouvre: false}, coffresAlice);
  await tic();
  assert.deepEqual(r.appels.map(([, corps]) => corps.eleve_id), [16, 1], "l'envoi d'Alice est parti pendant que celui de Lucas attend");
  assert.equal(r.f.enAttente(1), 1);
  // Lucas, rouvert : grisé, lui, jusqu'à sa réponse.
  r.boite.close();
  r.f.ouvrirCeQueVoit(lucas);
  assert.equal(r.liste.attributs["aria-busy"], "true");
  assert.ok(r.liste.tous(n => n.tag === "input").every(c => c.disabled), "tout est grisé chez Lucas");
  await libererTout(r);
  await Promise.all([envoi, envoiAlice]);
  assert.equal(r.f.enAttente(), 0, "plus rien n'attend");
  assert.ok([4, 5, 6].every(n => !r.caseNumero("mondes", n).disabled), "Lucas redevient cliquable après la réponse");
  assert.deepEqual(lucas.ajouts, {splat: {mondes: [3, 4]}});
  assert.deepEqual(alice.ajouts, {splat: {mondes: [3]}}, "Alice a perdu Coffres, chacun son enregistrement");
  // Une erreur chez Lucas ne grise pas Alice non plus, et se libère.
  const panne = fenetreRejouee(lucasQuiCroit([3]), {retenir: true, echec: new Error("Le serveur ne répond pas.")});
  const cinq = panne.caseNumero("mondes", 5);
  cinq.checked = true;
  const envoiRate = panne.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinq);
  await tic();
  panne.boite.close();
  panne.f.ouvrirCeQueVoit(ALICE());
  assert.equal(panne.liste.attributs["aria-busy"], "false");
  await libererTout(panne);
  await envoiRate;
  assert.equal(panne.f.enAttente(), 0);
});

// Borné à 3 s : sans le délai de la page, ce test ne finirait jamais (c'est le
// sabotage « plus de délai » qui le fait rougir).
test("qui voit quoi 3c — le serveur ne répond jamais : au bout du délai, la case revient, le message le dit, la fenêtre se libère, rien n'est reporté", {timeout: 3000}, async () => {
  const lucas = lucasQuiCroit([3]);
  const r = fenetreRejouee(lucas, {muet: true, delai: 40});
  assert.equal(r.f.delai(), 40);
  const quatre = r.caseNumero("mondes", 4);
  quatre.checked = true;
  const debut = Date.now();
  const envoi = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: true}, quatre);
  await tic();
  assert.equal(r.liste.attributs["aria-busy"], "true", "pendant : grisé");
  await envoi;
  assert.ok(Date.now() - debut >= 35, "l'attente a bien duré le délai");
  assert.deepEqual(r.erreurs, [["Le serveur n’a pas répondu : recharge la page pour vérifier les accès de Lucas avant de recommencer.", "voit-message"]]);
  assert.equal(quatre.checked, false, "la case revient");
  assert.deepEqual(mondesCoches(r), [true, false, false, false]);
  assert.ok([4, 5, 6].every(n => !r.caseNumero("mondes", n).disabled), "la fenêtre redevient cliquable");
  assert.equal(r.liste.attributs["aria-busy"], "false");
  assert.deepEqual(r.reportes, [], "rien n'est reporté sur l'élève");
  assert.deepEqual(lucas.ajouts, {splat: {mondes: [3]}}, "la page garde ce qu'elle savait : le clic suivant partira avec cet « avant »");
  assert.equal(r.f.enAttente(), 0);
  // Le vrai api() transmet le signal au fetch : c'est lui qui coupe la demande.
  const debutApi = script.indexOf("async function api(action, corps = {}, options = {})");
  assert.ok(debutApi > 0, "api() prend des options");
  assert.match(script.slice(debutApi, script.indexOf("function messager", debutApi)), /cache: "no-store",\s*signal: options\.signal/);
  assert.match(fonction("envoyerCeQueVoit"), /const garde = new AbortController\(\);\s*const minuteur = setTimeout\(\(\) => garde\.abort\(\), DELAI_ACCES_MS\);/);
  assert.match(constante("DELAI_ACCES_MS"), /= 15000;/);
});

test("qui voit quoi 3c — une réponse arrivée après « Se déconnecter » (ou après une autre classe) n'est pas traitée : la VRAIE reporterAcces n'est pas appelée, aucune erreur", async () => {
  // La vraie reporterAcces, avec ce qu'elle touche : les tableaux lus et le
  // redessin du tableau — qui, lui, lit classe.libelle (c'est là que l'écran
  // de connexion affichait « Cannot read properties of null (reading
  // 'libelle') », relevé par Codex).
  for (const apres of ["deconnexion", "autre classe"]) {
    const lucas = lucasQuiCroit([3]);
    const tableaux = {splat: [{...lucas, parcours: null}]};
    const dessins = [];
    let classeCourante = () => null;
    const vraie = new Function("tableaux", "redessin", "poserEnPlusPour", "lireSplat", "poserOnglets", "appliAffichee", "afficherAppli",
      `${fonction("reporterAcces")}\nreturn reporterAcces;`)(
      tableaux, {demander: () => { dessins.push(classeCourante().libelle); return true; }}, () => {}, () => ({}), () => ["splat"], "splat", () => {});
    const r = fenetreRejouee(lucas, {retenir: true, accesDe: accesLucas, reporterAcces: vraie});
    classeCourante = r.f.classe;
    const quatre = r.caseNumero("mondes", 4);
    quatre.checked = true;
    const envoi = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: true}, quatre);
    await tic();
    // Entre-temps : « Se déconnecter » (oublierEtat + viderZones), ou une autre classe ouverte.
    r.boite.close();
    r.f.poserClasse(apres === "deconnexion" ? null : {...classe405(), id: 8, libelle: "406"});
    r.messages.length = 0;
    await libererTout(r);
    await envoi; // ne doit pas rejeter
    assert.deepEqual(dessins, [], `${apres} : le tableau n'est pas redessiné (et classe.libelle n'est pas lu)`);
    assert.deepEqual(lucas.ajouts, {splat: {mondes: [3]}}, `${apres} : rien n'est reporté sur l'élève`);
    assert.deepEqual(tableaux.splat[0].ajouts, {splat: {mondes: [3]}}, `${apres} : ni dans les tableaux lus`);
    assert.deepEqual([r.messages, r.erreurs], [[], []], `${apres} : aucun message, aucune erreur`);
    assert.equal(r.f.enAttente(), 0, `${apres} : les compteurs sont quand même libérés`);
    assert.equal(r.$("voit-message").textContent, "");
  }
  // Et la même réponse, classe inchangée : la vraie reporterAcces passe bien par là.
  const lucas = lucasQuiCroit([3]);
  const tableaux = {splat: [{...lucas, parcours: null}]};
  const dessins = [];
  const vraie = new Function("tableaux", "redessin", "poserEnPlusPour", "lireSplat", "poserOnglets", "appliAffichee", "afficherAppli",
    `${fonction("reporterAcces")}\nreturn reporterAcces;`)(tableaux, {demander: () => { dessins.push(1); return true; }}, () => {}, () => ({}), () => ["splat"], "splat", () => {});
  const r = fenetreRejouee(lucas, {accesDe: accesLucas, reporterAcces: vraie});
  const quatre = r.caseNumero("mondes", 4);
  quatre.checked = true;
  await r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: true}, quatre);
  assert.deepEqual([dessins, lucas.ajouts, tableaux.splat[0].ajouts], [[1], {splat: {mondes: [3, 4]}}, {splat: {mondes: [3, 4]}}]);
  // Et à la déconnexion, la page ne vide PAS ses compteurs (3d) : chaque envoi
  // décompte le sien à l'arrivée, vider ferait décompter sur la session suivante.
  assert.doesNotMatch(fonction("oublierEtat"), /voitAttentes\.clear|voitFiles\.clear/);
});

test("qui voit quoi 3c — un 409 arrivé fenêtre fermée : l'élève est mis à jour, le message va sous les boutons d'Élèves ; rouverte, la fenêtre dit l'état vrai", async () => {
  const base = baseLucas([3]);
  const lucas = lucasQuiCroit([3, 4]);
  const r = fenetreRejouee(lucas, {retenir: true, base, accesDe: accesLucas});
  const cinq = r.caseNumero("mondes", 5);
  cinq.checked = true;
  const envoi = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinq);
  await tic();
  r.boite.close();
  await libererTout(r);
  await envoi;
  assert.deepEqual(base.ajouts, {splat: {mondes: [3]}});
  assert.deepEqual(lucas.ajouts, {splat: {mondes: [3]}}, "l'état vrai est reporté même fenêtre fermée");
  assert.deepEqual(r.erreurs, [["Ce que voit Lucas a changé ailleurs : la fenêtre est à jour, refais ton clic.", "message-classe"]]);
  assert.equal(r.$("voit-liste").textContent, "", "rien n'est redessiné dans une fenêtre fermée");
  r.f.ouvrirCeQueVoit(lucas);
  assert.deepEqual(mondesCoches(r), [true, false, false, false]);
});

test("qui voit quoi 3c — un 409 arrivé dans une fenêtre ROUVERTE sur le même élève : elle se redessine à l'état vrai et le message s'y écrit (pas derrière elle)", async () => {
  const base = baseLucas([3]);
  const lucas = lucasQuiCroit([3, 4]);
  const r = fenetreRejouee(lucas, {retenir: true, base, accesDe: accesLucas});
  const cinq = r.caseNumero("mondes", 5);
  cinq.checked = true;
  const envoi = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinq);
  await tic();
  r.boite.close();
  r.f.ouvrirCeQueVoit(lucas);
  assert.equal(r.liste.attributs["aria-busy"], "true", "rouverte pendant l'envoi : grisée");
  await libererTout(r);
  await envoi;
  assert.deepEqual(lucas.ajouts, {splat: {mondes: [3]}});
  assert.deepEqual(mondesCoches(r), [true, false, false, false], "la fenêtre rouverte dit l'état vrai");
  assert.equal(r.liste.attributs["aria-busy"], "false");
  assert.deepEqual(r.erreurs, [["Ce que voit Lucas a changé ailleurs : la fenêtre est à jour, refais ton clic.", "voit-message"]],
    "le message va dans la fenêtre ouverte sur Lucas — sous les boutons, derrière la fenêtre, personne ne le verrait");
  assert.ok(!r.messages.some(([, t]) => t.startsWith("Enregistré")));
});

// ------------------------------------------------------------ lot 3d : les attentes quand le contexte change (relecture Codex de la PR #1041)

test("qui voit quoi 3d — la même classe rouverte pendant un envoi : la fenêtre de Lucas (relu) se libère à l'arrivée de la vieille réponse, sans rien reporter", async () => {
  for (const [variante, options] of [["réponse", {}], ["409", {base: baseLucas([3]), accesDe: accesLucas}], ["panne", {echec: new Error("Le serveur ne répond pas.")}]]) {
    const ancien = lucasQuiCroit([3, 4]);
    const r = fenetreRejouee(ancien, {retenir: true, accesDe: accesLucas, ...options});
    const quatre = r.caseNumero("mondes", 4);
    quatre.checked = false;
    const envoi = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: false}, quatre);
    await tic();
    r.boite.close();
    // « Toutes mes classes » → la même classe : objets relus, Lucas est un AUTRE objet (même id).
    r.f.poserClasse({...classe405()});
    const relu = lucasQuiCroit([3]);
    r.f.ouvrirCeQueVoit(relu);
    assert.equal(r.liste.attributs["aria-busy"], "true", `${variante} : rouverte pendant l'envoi, grisée`);
    r.messages.length = 0;
    await libererTout(r);
    await envoi;
    assert.equal(r.liste.attributs["aria-busy"], "false", `${variante} : plus rien n'est en route, la fenêtre se libère`);
    assert.ok([4, 5, 6].every(n => !r.caseNumero("mondes", n).disabled), `${variante} : les cases redeviennent cliquables`);
    assert.deepEqual(mondesCoches(r), [true, false, false, false], `${variante} : dessinée d'après l'élève RELU, pas d'après la vieille réponse`);
    assert.deepEqual([ancien.ajouts, relu.ajouts], [{splat: {mondes: [3, 4]}}, {splat: {mondes: [3]}}], `${variante} : rien n'est reporté`);
    assert.deepEqual([r.messages, r.erreurs], [[], []], `${variante} : aucun message`);
    assert.equal(r.f.enAttente(16), 0);
  }
});

test("qui voit quoi 3d — 401 puis reconnexion : la vieille réponse ne décompte pas l'attente du nouvel envoi, la fenêtre reste grisée jusqu'à SA réponse", async () => {
  const ancien = lucasQuiCroit([3, 4]);
  const r = fenetreRejouee(ancien, {retenir: true, accesDe: accesLucas});
  const quatre = r.caseNumero("mondes", 4);
  quatre.checked = false;
  const envoiA = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 4, ouvre: false}, quatre);
  await tic();
  r.boite.close();
  // Un 401 ailleurs : « Se déconnecter » (la vraie oublierEtat), puis reconnexion sur la même classe.
  r.f.deconnecter();
  assert.equal(r.f.classe(), null);
  r.f.poserClasse({...classe405()});
  const nouveau = lucasQuiCroit([3]);
  r.f.ouvrirCeQueVoit(nouveau);
  assert.equal(r.liste.attributs["aria-busy"], "true", "l'ancien envoi est toujours en route : grisée");
  const cinq = r.caseNumero("mondes", 5);
  cinq.checked = true;
  const envoiB = r.f.changerCeQueVoit({cle: "splat", liste: "mondes", numero: 5, ouvre: true}, cinq);
  await tic();
  assert.equal(r.f.enAttente(16), 2, "deux envois en route pour Lucas");
  // La vieille réponse arrive seule.
  r.enAttente.shift()();
  await envoiA;
  await tic();
  assert.equal(r.f.enAttente(16), 1, "LE point : il reste l'attente du nouvel envoi");
  assert.equal(r.liste.attributs["aria-busy"], "true", "la fenêtre reste grisée jusqu'à SA réponse");
  assert.deepEqual(nouveau.ajouts, {splat: {mondes: [3]}}, "rien de l'ancienne session n'est reporté");
  // Puis la nouvelle.
  await libererTout(r);
  await envoiB;
  assert.equal(r.f.enAttente(16), 0);
  assert.equal(r.liste.attributs["aria-busy"], "false");
  assert.deepEqual(nouveau.ajouts, {splat: {mondes: [3, 5]}});
  assert.deepEqual(mondesCoches(r), [true, false, true, false]);
  assert.deepEqual(r.messages.at(-1), ["voit-message", "Enregistré : le monde 5 est ouvert à Lucas.", "ok"]);
});
