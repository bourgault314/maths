// Lot E2 de l'optimisation de Défi tables (03/10/2026) : des écrans seulement.
// Décision 3 : « À retenir pour demain » (toutes les erreurs de la séance,
// écrites justes) à la place de la liste de la dernière étape. Décision 5 :
// l'échelle C1 (les noms des marches en pastilles), écran et fiche, sans la
// phrase « Prochaine séance ». Décision 12 : le bilan après une table acquise.
// Et les réponses de Gwenaël aux questions E2 (audit GPT) : le format sur
// l'écran de lancement avec un exemple (F), « à revoir » pour un calcul passé
// (I), la démonstration du geste des perles (E), les textes secondaires en
// 700 (la police), « Les 10 cases construites sur le boulier ».
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const PARCOURS = require("../outils/calcul_mental/defi_tables_mon_parcours.js");
const html = readFileSync(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function corps(nom) {
  const debut = html.indexOf(`function ${nom}(`);
  assert.ok(debut > 0, `fonction introuvable : ${nom}`);
  const fin = html.indexOf("\n      }\n", debut);
  return html.slice(debut, fin + 8);
}

// Un tout petit DOM : de quoi exécuter les vraies fonctions de la page.
class Noeud {
  constructor(tag) { this.tag = tag; this.enfants = []; this.className = ""; this.hidden = false; this.attributs = {}; this._texte = null; }
  append(...noeuds) { noeuds.forEach(n => this.enfants.push(typeof n === "string" ? texteNoeud(n) : n)); }
  replaceChildren(...noeuds) { this.enfants = []; this.append(...noeuds); }
  setAttribute(cle, valeur) { this.attributs[cle] = valeur; }
  set textContent(valeur) { this._texte = String(valeur); this.enfants = []; }
  get textContent() { return this._texte !== null && !this.enfants.length ? this._texte : (this._texte || "") + this.enfants.map(e => e.textContent).join(""); }
  tous(tag) { return [...(this.tag === tag ? [this] : []), ...this.enfants.flatMap(e => (e.tous ? e.tous(tag) : []))]; }
}
const texteNoeud = texte => ({textContent: texte});
const document = {createElement: tag => new Noeud(tag), createTextNode: texteNoeud};
const soude = new Function(`${corps("soude")}; return soude;`)();
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

test("décision 3 : « À retenir pour demain » — chaque calcul une fois, écrit juste ; il remplace la liste de la dernière étape", () => {
  const cadreARetenir = new Function("document", `${corps("cadreARetenir")}; return cadreARetenir;`)(document);
  assert.equal(cadreARetenir([]), null, "sans erreur, pas de cadre");
  const cadre = cadreARetenir([[4, 7], [6, 4], [7, 4], [3, 3]]);
  assert.equal(cadre.className, "retenir");
  assert.equal(cadre.tous("h2")[0].textContent, "À retenir pour demain");
  assert.deepEqual(cadre.tous("li").map(li => li.textContent), ["4 × 7 =28", "6 × 4 =24", "3 × 3 =9"], "4 × 7 et 7 × 4 : un seul calcul");
  assert.equal(cadre.tous("p")[0].textContent, "Mes 3 erreurs de la séance. Elles reviennent demain dans Mes calculs du jour.");
  assert.equal(cadreARetenir([[2, 9]]).tous("p")[0].textContent, "Mon erreur de la séance. Elle revient demain dans Mes calculs du jour.");
  const bilan = corps("renderBilanSeance");
  assert.match(bilan, /const retenir = cadreARetenir\(seance\.erreurs \|\| \[\]\);\s*if \(retenir\) zone\.append\(retenir\);\s*\$\("corrections"\)\.replaceChildren\(\);/);
  assert.ok(bilan.indexOf("cadreARetenir") < bilan.indexOf("boutons.className"), "au-dessus des boutons");
  assert.match(html, /\.seance-suite \.retenir \{ width: 100%;/);
});

test("décision 12 (réponse B) : « Table de 3 acquise ✓ » à la place de la rangée, et une seule phrase pour demain", () => {
  const fabrique = (demain, melange, toutes, suivante) => new Function("document", "soude", "pluriel", "PARCOURS", "parcours", `${corps("cadreTableAcquise")}; return cadreTableAcquise;`)(
    document, soude, pluriel,
    {agendaCalculs: () => ({demain}), melangeDu: () => melange, toutesAcquises: () => toutes, tableDeSeance: () => suivante}, {});
  let cadre = fabrique(3, true, false, 4)(3);
  assert.equal(cadre.tous("p")[0].textContent, "Table de 3 acquise ✓");
  assert.equal(cadre.tous("p")[1].textContent, "Demain : 3 calculs, ton\u00a0mélange, puis la\u00a0table\u00a0de\u00a04.");
  assert.equal(fabrique(1, true, false, 4)(3).tous("p")[1].textContent, "Demain : 1 calcul, ton\u00a0mélange, puis la\u00a0table\u00a0de\u00a04.");
  assert.equal(fabrique(0, true, false, 4)(3).tous("p")[1].textContent, "Demain : ton\u00a0mélange, puis la\u00a0table\u00a0de\u00a04.");
  assert.equal(fabrique(0, false, false, 10)(2).tous("p")[1].textContent, "Demain : la\u00a0table\u00a0de\u00a010.", "la première table acquise : pas encore de mélange");
  assert.equal(fabrique(2, true, true, null)(9).tous("p")[1].textContent, "Demain : 2 calculs, puis ton\u00a0mélange\u00a0des\u00a09\u00a0tables.");
  const bilan = corps("renderBilanSeance");
  assert.match(bilan, /const acquiseIci = table !== null && seance\.faites\.some\(faite => faite\.type === "validation" && faite\.reussi\) && Boolean\(parcours\.tables\[table\]\.acquise\);/);
  assert.match(bilan, /if \(acquiseIci\) \{\s*zone\.append\(cadreTableAcquise\(table\)\);\s*\} else if \(table !== null\) \{/, "la rangée de la table finie n'est plus montrée");
});

test("décision 5 (version A, « la barre », choisie le 03/10) : huit segments et « Prochaine séance : … », écran et fiche", () => {
  const nomDeMarche = new Function(`${corps("nomDeMarche")}; return nomDeMarche;`)();
  assert.deepEqual(PARCOURS.MARCHES.map(marche => nomDeMarche(marche.nom)).slice(0, 4), ["les perles", "je construis la bande", "la bande à trous", "dans l’ordre"]);
  const phrase = new Function("document", `${corps("nomDeMarche")}\n${corps("phraseProchaineSeance")}; return phraseProchaineSeance;`)(document);
  assert.equal(phrase([]), null);
  assert.equal(phrase(["Dans l’ordre", "Dans le désordre", "Nombres manquants"]).textContent, "Prochaine séance\u00a0: dans l’ordre, dans le désordre, nombres manquants.");
  const echelle = corps("echelleDeTable");
  assert.match(echelle, /if \(item\.marche < depart\) \{ segment\.className = "faite"; faites\.push\(item\.nom\); \}\s*if \(prochaines\.includes\(item\.marche\)\) segment\.className = "ici";/);
  assert.match(echelle, /const phrase = phraseProchaineSeance\(noms\);\s*if \(phrase\) zone\.append\(phrase\);/);
  assert.match(html, /const barre = document\.createElement\("span"\);\s*barre\.className = "barre";[\s\S]{0,400}const phrase = phraseProchaineSeance\(marches\.noms\);/, "la fiche : la même barre et la même phrase");
  assert.match(html, /\.echelle li \{ flex: 1 1 0; height: 10px; border-radius: 5px; background: #dbe5ec; \}/);
  assert.match(html, /\.echelle li\.ici \{ background: var\(--blue\); \}/);
  assert.match(html, /\.fiche-echelle \.barre i \{ flex: 1 1 0; height: 2\.2mm; border: \.25mm solid #9fb6c6;/, "un contour : lisible en noir et blanc");
});

test("E2 · 1 (audit GPT, F) : l'écran de lancement dit le format, les bonnes réponses pour réussir, et un exemple pris dans sa table", () => {
  const zone = new Noeud("div");
  const lancer = (config, origine = "seance") => new Function("$", "state", "PARCOURS", "document", "soude", `${corps("renderFormatLancement")}; return renderFormatLancement;`)(
    () => zone, {origin: origine}, PARCOURS, document, soude)(config);
  lancer(PARCOURS.configValidation(7));
  assert.equal(zone.hidden, false);
  assert.deepEqual(zone.tous("p").map(p => p.textContent), [
    "Des résultats et des nombres manquants : 18 bonnes réponses pour réussir.",
    "Par exemple : 7 × 4 = ? ou 7 × ? = 28"]);
  const parcours = PARCOURS.creerParcours();
  parcours.tables[2].acquise = "2026-10-01"; parcours.tables[5].acquise = "2026-10-01";
  lancer(PARCOURS.configMelange(PARCOURS.normaliserParcours(parcours)));
  assert.equal(zone.tous("p")[1].textContent, "Par exemple : 2 × 4 = ? ou 2 × ? = 8", "le mélange : un exemple dans une de ses tables");
  lancer(PARCOURS.configEtoile(1));
  assert.deepEqual(zone.tous("p").map(p => p.textContent), ["Des résultats, des nombres manquants et des divisions : 23 bonnes réponses pour réussir."]);
  lancer(PARCOURS.configValidation(7), "reglages");
  assert.equal(zone.hidden, true, "rien pour les réglages libres");
  lancer(PARCOURS.configEntraine(7, "desordre"));
  assert.equal(zone.hidden, true, "rien pour un entraînement");
  assert.match(html, /<div id="launch-format" class="launch-format" hidden><\/div>\s*<p id="launch-hint"/);
  assert.match(html, /renderFormatLancement\(config\);/);
});

test("E2 · 2 (audit GPT, I) : un calcul passé n'est pas une erreur — « à revoir », « ce calcul revient »", () => {
  const titre = corps("renderCorrections");
  assert.match(titre, /const avecPasse = wrongEntries\.some\(entry => entry\.passe\);/);
  assert.match(titre, /\? \(wrongEntries\.length > 1 \? `Mes \$\{wrongEntries\.length\} calculs à revoir` : "Mon calcul à revoir"\)\s*: \(wrongEntries\.length > 1 \? `Mes \$\{wrongEntries\.length\} erreurs` : "Mon erreur"\);/);
  const phrase = (answered, correct, passees) => new Function("state", "TOTAL", `${corps("calculsPasses")}\n${corps("phraseErreursDemain")}; return phraseErreursDemain();`)(
    {answered, correct, index: 20, configuration: {duration: 90}, responses: Array.from({length: passees}, () => ({skipped: true}))}, 20);
  assert.equal(phrase(9, 9, 1), "Ce calcul revient demain dans Mes calculs. D’ici là, entraîne‑toi.");
  assert.equal(phrase(10, 8, 1), "Ces 3 calculs reviennent demain dans Mes calculs. D’ici là, entraîne‑toi.");
  assert.equal(phrase(20, 17, 0), "Tes 3 erreurs reviennent demain dans Mes calculs. D’ici là, entraîne‑toi.", "sans calcul passé, rien ne change");
});

test("E2 · 3 (audit GPT, E) : la démonstration du geste des perles — toute seule la première fois, puis après un clic sans glisser", () => {
  assert.match(corps("premieresPerles"), /PARCOURS_TABLES\.every\(table => !\(parcours\.tables\[table\] && parcours\.tables\[table\]\.fois\.beads > 0\)\)/);
  assert.match(html, /if \(premieresPerles\(\)\) setTimeout\(\(\) => \{ if \(boulier\.dom && boulier\.etape === 0 && totalPerles\(\) === 0\) montrerGeste\(\); \}, 700\);/);
  const geste = corps("montrerGeste");
  assert.match(geste, /const attendu = gesteAttendu\(boulier\.etats, boulier\.etape, boulier\.table\);/, "le bon groupe, celui que l'élève doit pousser");
  assert.match(geste, /fleche\.textContent = "←";/);
  assert.match(geste, /if \(!dom \|\| boulier\.finie \|\| !state\.running \|\| boulier\.drag \|\| !\(boulier\.taille > 0\)\) return;/, "jamais pendant que l'élève tient une perle");
  assert.match(geste, /\[\[300, true\], \[1500, false\], \[2700, true\], \[3900, false\]\]/, "deux allers-retours : les perles reviennent toujours");
  assert.match(geste, /prefers-reduced-motion: reduce/);
  assert.match(corps("arreterDemo"), /if \(boulier\.dom\) dessinerBoulier\(false\);/, "arrêtée, chaque perle reprend sa vraie place");
  assert.match(corps("perlesPointerDown"), /if \(!boulier\.dom \|\| boulier\.finie \|\| !state\.running\) return;\s*arreterDemo\(\);/, "toucher le boulier arrête la démonstration");
  assert.match(corps("perlesPointerUp"), /if \(!drag\.bouge && !ecart\) \{\s*montrerGeste\(\);\s*return;\s*\}/);
  assert.match(corps("perlesPointerMove"), /if \(Math\.abs\(ecart\) > 4\) drag\.bouge = true;/);
  assert.match(html, /Pousse \$\{perles\}\./, "la consigne ne change pas");
});

test("E2 · 4 : la police — les textes secondaires en 700, après leurs règles ; nombres, titres et boutons intacts", () => {
  const debut = html.indexOf("/* Lot E2 (question E2 · 4");
  const fin = html.indexOf("</style>", debut);
  assert.ok(debut > 0 && fin > debut);
  assert.equal(html.indexOf("</style>"), fin, "le dernier bloc du premier <style> de la page");
  const regle = html.slice(debut, fin);
  assert.match(regle, /\{ font-weight: 700; \}/);
  for (const selecteur of [".carte-seance .duree", ".carte-seance .programme > span", ".seance-liens button:not(.rond)", ".semaine", ".acc-lien small", ".titre-menu", ".boite small", ".calculs-legende"]) {
    assert.ok(regle.includes(selecteur), selecteur);
  }
  for (const nombre of [".expression", ".keypad", ".rangee", ".mc-detail-liste.pastilles span", ".correction-chips", ".given-answer", ".carte-seance .programme i", ".go", ".primary", "h1", ".boite b"]) {
    assert.ok(!regle.includes(nombre), `${nombre} ne change pas`);
  }
});

test("E2 · 5 : la fin des perles dit « Les 10 cases construites sur le boulier », comme le compteur", () => {
  assert.match(html, /\? "Les 10 cases construites sur le boulier"/);
  assert.doesNotMatch(html, /Les 11 produits construits/);
});
