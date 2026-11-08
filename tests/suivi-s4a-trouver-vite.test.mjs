// « Suivre ses élèves », lot S4a « trouver vite » (08/11/2026, après l'audit
// d'usage de la page prof).
//
//  1-2-3. « Chercher un élève » et « Actualiser » : PAS ajoutés (choix de
//     Gwenaël, 08/11 à 15 h 42 et 15 h 49 : « je vais jamais taper le prénom
//     d'un élève » ; F5 fait la même chose qu'« Actualiser », qui prend de la
//     place). Le retour de la fiche garde déjà la même place et le même tri
//     (mesuré).
//  4. Au téléphone, sous le prénom : « table de 7 » (Défi tables), « 1 à voir
//     en classe » (Défi calcul).
//  5. Des libellés vides courts et justes ; des mots sans genre (remarque de
//     Gwenaël du 08/11 : « ensemble », « Activité », « Progression »).
//  6. Coffres a une règle « À féliciter » : 2 trésors ou plus dans la semaine.
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
const telephone = style.slice(style.indexOf("@media (max-width: 700px) {\n    #tableau th.large"));

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
function constante(nom) {
  const debut = script.indexOf(`const ${nom} = `);
  assert.ok(debut > 0, `la page doit définir ${nom}`);
  return script.slice(debut, script.indexOf(";\n", debut) + 1);
}

// ------------------------------------------------------------ un petit document

class Noeud {
  constructor(balise) {
    this.tagName = balise.toUpperCase();
    this.enfants = [];
    this.attributs = {};
    this.hidden = false;
    this.disabled = false;
    this.className = "";
    this.dataset = {};
    this.texte = "";
    this.ecoutes = {};
    this.value = "";
  }
  get textContent() { return this.texte + this.enfants.map(e => e.textContent).join(""); }
  set textContent(v) { this.texte = String(v); this.enfants = []; }
  set innerHTML(_) { throw new Error("innerHTML interdit : les prénoms passent par textContent"); }
  append(...noeuds) { noeuds.forEach(n => this.enfants.push(typeof n === "string" ? Object.assign(new Noeud("#text"), {texte: n}) : n)); }
  setAttribute(k, v) { this.attributs[k] = String(v); }
  getAttribute(k) { return k in this.attributs ? this.attributs[k] : null; }
  removeAttribute(k) { delete this.attributs[k]; }
  addEventListener(type, f) { (this.ecoutes[type] = this.ecoutes[type] || []).push(f); }
  click() { (this.ecoutes.click || []).forEach(f => f({target: this})); }
  tous(balise) { return this.enfants.flatMap(e => (e.tagName === balise.toUpperCase() ? [e] : []).concat(e.tous(balise))); }
}
function documentFactice(ids) {
  const noeuds = {};
  ids.forEach(id => { noeuds[id] = new Noeud("span"); noeuds[id].id = id; });
  const document = {activeElement: null, createElement: b => new Noeud(b)};
  return {noeuds, document, $: id => noeuds[id] || null};
}

// ------------------------------------------------------------ 1-2-3. rien d'ajouté en haut

test("1-2-3 — ni « Chercher un élève » dans La classe, ni « Actualiser » ; la recherche des onglets d'appli est inchangée ; fermer la fiche ne remonte pas la page", () => {
  const classe = page.slice(page.indexOf('<div id="vue-classe" hidden>'), page.indexOf("<!-- La vue de l'activité"));
  assert.doesNotMatch(classe, /<input/, "La classe : pas de champ");
  assert.doesNotMatch(page, /id="actualiser"|id="lc-actualiser"/);
  assert.match(page, /<\/div>\s*<button type="button" id="seance-direct">Séance en direct<\/button>\s*<\/div>\s*<p class="sous" id="resume-classe"><\/p>/, "la ligne du nom inchangée");
  assert.match(page, /<input type="search" id="chercher-eleve" placeholder="Chercher un élève" aria-label="Chercher un élève" autocomplete="off" spellcheck="false" maxlength="40">/);
  assert.ok(page.indexOf('id="bloc-evaluations"') < page.indexOf('id="chercher-eleve"') && page.indexOf('id="chercher-eleve"') < page.indexOf('<table id="tableau">'), "toujours au-dessus du tableau");
  assert.match(fonction("voisinDeLaFenetre"), /const rang = idsAffiches\.indexOf\(fenetreEleveId\);/, "‹ › : le tableau à l'écran");
  assert.doesNotMatch(fonction("surFermetureFenetre"), /scroll|redessin|oublierRecherche|tri/);
});

// ------------------------------------------------------------ 4. au téléphone, sous le prénom

test("4 — au téléphone, sous le prénom : « table de 7 » (et les séances qui durent) dans Défi tables, « N à voir en classe » dans Défi calcul ; rien à l'ordinateur", () => {
  const r = documentFactice([]);
  const f = new Function("document", `${fonction("el")} ${fonction("indiceTelephone")} return indiceTelephone;`)(r.document);
  const td = new Noeud("td");
  f(td, "table de 7", "");
  f(td, "", "fort");
  f(td, "12 séances dessus", "fort");
  assert.deepEqual(td.enfants.map(e => [e.className, e.textContent]), [["indice-tel", "table de 7"], ["indice-tel fort", "12 séances dessus"]], "un texte vide n'ajoute rien");
  assert.match(fonction("dessinerTableau"), /finirLigne\(ligne, eleve, cNom\);\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*indiceTelephone\(cNom, enCours\.type === "table" \? `table de \$\{enCours\.tables\[0\]\}` : enCours\.type === "rien" \? "" : enCours\.texte, ""\);\s*if \(eleve\.lu\.longue\) indiceTelephone\(cNom, `\$\{eleve\.lu\.longue\.seances\} séances dessus`, "fort"\);/,
    "APRÈS finirLigne (qui reprend le texte du prénom pour son bouton)");
  assert.match(fonction("dessinerTableauCalcul"), /finirLigne\(ligne, eleve, cNom\);[\s\S]{0,400}if \(lu\.commence && lu\.aVoir\) indiceTelephone\(cNom, `\$\{lu\.aVoir\} à voir en classe`, "fort"\);/);
  assert.doesNotMatch(fonction("dessinerTableauCalcul"), /indiceTelephone\(cNom, `\$\{lu\.rouges\}/, "les rouges, que l'appli redonne, restent dans la fiche");
  assert.match(style, /#tableau \.indice-tel \{ display: none; \}/, "à l'ordinateur, la colonne est là");
  assert.match(telephone, /#tableau \.indice-tel \{ display: block;/);
});

// ------------------------------------------------------------ 5. les mots

test("5 — libellés vides courts et justes ; des mots sans genre dans La classe et la fiche", () => {
  const cartes = fonction("dessinerCartesClasse");
  assert.match(cartes, /remplir\("lc-aider", aider, "Rien à signaler cette semaine\.",/);
  assert.match(cartes, /remplir\("lc-feliciter", feliciter, lundi \? "Pas de bravo la semaine dernière\." : "Pas encore de bravo cette semaine\.",/);
  assert.doesNotMatch(script, /Personne à aider|Rien de gagné/);
  const aider = fonction("aiderDe").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(aider, /avec lui|qu’il|Jamais venu/);
  assert.match(aider, /"Rien reçu, dans aucune appli", "Vérifier ensemble le code et la connexion\."/);
  assert.equal((script.match(/const etiquettes = \{absent: \["absence", "rouge"\], bloque: \["blocage", "orange"\], revoir: \["à revoir", "orange"\], aide: \["aide", ""\]\};/g) || []).length, 2, "les pastilles : La classe et la fiche");
  assert.match(script, /el\("h3", "", "Progression"\)/);
  assert.match(script, /el\("h3", "", "Activité"\)/);
  assert.doesNotMatch(script, /"Où il en est"|"Ce qu’il a fait"|Pas venus/);
});

// ------------------------------------------------------------ 6. Coffres félicité

function feliciter(jours, aujourdhui) {
  const lundiDe = j => { const d = new Date(`${j}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); };
  const f = new Function("AUJ", "LUNDI", "JOURS", `
    ${constante("APPLIS")}
    const ANZAN = null;
    ${fonction("jourPlus")}
    function suiviApp() { return null; }
    ${fonction("feliciterDe")}
    return feliciterDe({aujourdhui: AUJ, lundi: LUNDI, parApp: {coffres: {eleve: {id: 1}, suivi: {aujourdhui: AUJ, jours: JOURS, feliciter: []}}}});`);
  return f(aujourdhui, lundiDe(aujourdhui), jours);
}
const jour = (j, tresors) => ({jour: j, lignes: [{tresors, parfaits: 0, aides: 0, solutions: 0}]});

test("6 — Coffres : « À féliciter » dès 2 trésors ouverts dans la semaine (lu dans resumeSuivi) ; 1, la semaine d'avant, un jour sans trésor connu : rien ; le lundi, avec la semaine d'avant", () => {
  const JEUDI = "2026-11-12", LUNDI = "2026-11-16";
  assert.deepEqual(feliciter([jour("2026-11-09", 1), jour("2026-11-11", 1)], JEUDI), [{appli: "coffres", texte: "2 trésors ouverts cette semaine", rang: 4, nombre: 2}]);
  assert.deepEqual(feliciter([jour("2026-11-10", 3)], JEUDI)[0].texte, "3 trésors ouverts cette semaine");
  assert.deepEqual(feliciter([jour("2026-11-10", 1)], JEUDI), [], "1 trésor : le rythme ordinaire");
  assert.deepEqual(feliciter([jour("2026-11-05", 2), jour("2026-11-11", 1)], JEUDI), [], "la semaine d'avant ne compte pas le jeudi");
  assert.deepEqual(feliciter([jour("2026-11-10", null), jour("2026-11-11", -1), jour("2026-11-12", 1)], JEUDI), [], "un jour sans trésor connu (la partie en cours, -1) ne compte pas");
  assert.deepEqual(feliciter([jour("2026-11-13", 5)], JEUDI), [], "un jour à venir (horloge d'un autre appareil) ne compte pas");
  assert.equal(feliciter([jour("2026-11-11", 1), jour("2026-11-13", 1)], LUNDI)[0].texte, "2 trésors ouverts cette semaine", "le lundi : la semaine d'avant aussi");
  assert.deepEqual(feliciter([jour("2026-11-04", 2)], LUNDI), [], "le lundi : pas deux semaines");
  // Rien ne change côté élève : ni le moteur ni Mon espace.
  assert.match(readFileSync(join(racine, "_serveur/public/prof/coffres-parcours.js"), "utf8"), /feliciter: \[\]/);
});
