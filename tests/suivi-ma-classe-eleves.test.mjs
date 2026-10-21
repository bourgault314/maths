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

// ------------------------------------------------------------ un document de poche

class Noeud {
  constructor(tag) {
    this.tag = tag; this.enfants = []; this.attributs = {}; this.dataset = {}; this.style = {};
    this.className = ""; this.hidden = false; this._texte = ""; this.ecouteurs = {}; this.parent = null;
    this.value = ""; this.disabled = false;
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
  "poserGestesEleve", "dessinerOngletEleves"].map(fonction).join("\n");

function ongletEleves(liste, droit = "proprietaire") {
  const {zones, $} = creerZones();
  const appels = [];
  const f = new Function("document", "$", "droitClasse", "eleves", "nommer", "imprimer", "regenerer", "supprimerEleve", "placerMenu",
    `${sourcesEleves()}\nreturn {dessinerOngletEleves};`)(
    document, $, droit, liste,
    (eleve) => appels.push(["nommer", eleve.id]), (quoi, eleve) => appels.push(["imprimer", quoi, eleve.id]),
    (eleve) => appels.push(["regenerer", eleve.id]), (eleve) => appels.push(["supprimer", eleve.id]), () => {});
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
    assert.equal(tr.children.length, 4, "N° · Élève · Code · ⋯");
    assert.ok(aClasse(tr.children[2], "code"));
    const champ = tr.children[1].children[0];
    assert.equal(champ.tag, "input");
    assert.notEqual(champ.readOnly, true, "le prénom se saisit ici");
    assert.equal(champ.placeholder, "Prénom", "le prénom seul suffit ; l'initiale reste possible, pas imposée");
  });
});

test("le « ⋯ » de l'onglet Élèves : Imprimer sa bandelette, Nouveau code, Supprimer (propriétaire seulement)", () => {
  const menu = tr => tr.children[3].premier(n => n.tag === "details");
  const boutons = tr => menu(tr).tous(n => n.tag === "button").map(b => b.textContent);
  const proprio = ongletEleves(classe4());
  proprio.lignes.forEach(tr => assert.deepEqual(boutons(tr), ["Imprimer sa bandelette", "Nouveau code", "Supprimer"]));
  const ecriture = ongletEleves(classe4(), "ecriture");
  ecriture.lignes.forEach(tr => assert.deepEqual(boutons(tr), ["Imprimer sa bandelette", "Nouveau code"],
    "un collègue en écriture n'efface pas d'élève (lot 11)"));
  // Les boutons font ce qu'ils disent, pour l'élève de LEUR ligne (Anaïs, ligne 1).
  menu(proprio.lignes[0]).tous(n => n.tag === "button").forEach(b => b.cliquer());
  assert.deepEqual(proprio.appels, [["imprimer", "bandelettes", 13], ["regenerer", 13], ["supprimer", 13]]);
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
  assert.deepEqual([...entete.matchAll(/<th\b[^>]*>([^<]*)<\/th>/g)].map(m => m[1]), ["N°", "Élève", "Code", ""]);
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
