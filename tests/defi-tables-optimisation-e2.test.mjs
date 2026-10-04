// Lot E2 de l'optimisation de Défi tables (03/10/2026) : des écrans seulement.
// Décision 3 : « À retenir pour demain » (toutes les erreurs de la séance,
// écrites justes) à la place de la liste de la dernière étape. Décision 5 :
// l'échelle en barre (version A, huit segments) et « Prochaine séance : … »,
// écran et fiche — C1 abandonné. Décision 12 : le bilan après une table acquise.
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
  assert.equal(cadre.tous("p")[0].textContent, "Mes 3 calculs à revoir. Ils reviennent demain dans Mes calculs du jour.");
  assert.equal(cadreARetenir([[2, 9]]).tous("p")[0].textContent, "Mon calcul à revoir. Il revient demain dans Mes calculs du jour.");
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
  // Correction de Claude Code : la place des perles à l'écran est lue AVANT d'arrêter la démonstration (voir le test plus bas).
  assert.match(corps("perlesPointerDown"), /if \(!boulier\.dom \|\| boulier\.finie \|\| !state\.running\) return;[\s\S]*const vues = demo \?[^\n]*\n\s*arreterDemo\(\);/, "toucher le boulier arrête la démonstration");
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
  for (const selecteur of [".carte-seance .duree", ".carte-seance .programme > span", ".seance-liens button:not(.rond)", ".semaine", ".acc-lien small", ".boite small", ".calculs-legende"]) {
    assert.ok(regle.includes(selecteur), selecteur);
  }
  for (const nombre of [".expression", ".keypad", ".rangee", ".mc-detail-liste.pastilles span", ".correction-chips", ".given-answer", ".carte-seance .programme i", ".go", ".primary", "h1", ".boite b", ".titre-menu"]) {
    assert.ok(!regle.includes(nombre), `${nombre} ne change pas`);
  }
});

test("E2 · 5 : la fin des perles dit « Les 10 cases construites sur le boulier », comme le compteur", () => {
  assert.match(html, /\? "Les 10 cases construites sur le boulier"/);
  assert.doesNotMatch(html, /Les 11 produits construits/);
});

// Correction de Claude Code (03/10/2026), trouvée en jouant les perles au
// navigateur : l'élève qui imite la démonstration attrape la perle EN TRAIN DE
// GLISSER. Le toucher arrêtait la démonstration (perles remises au repos), puis
// la perle prise était la plus proche de leur place de repos : la voisine.
// Le bon geste répondait « Pas assez de perles ! ». On exécute les vraies
// fonctions des perles sur un boulier simulé (table de 2, rien de poussé).
function boulierSimule({demoEnCours, vues}) {
  const TAILLE = 20;
  const appels = {dessiner: [], montrer: 0, refus: []};
  const perles = Array.from({length: 10}, (rien, i) => ({style: {}, getBoundingClientRect: () => ({left: vues[i]})}));
  const boulier = {
    table: 2, taille: TAILLE, ecart: 5, etape: 0, finie: false, drag: null,
    etats: Array.from({length: 10}, () => 0),
    dom: {
      interieur: {offsetWidth: 300, getBoundingClientRect: () => ({left: 0, top: 0, width: 300, height: 300})},
      rangees: [{perles}, ...Array.from({length: 9}, () => ({perles: []}))]
    }
  };
  const demo = demoEnCours ? {minuteurs: [], fleche: {remove() {}}} : null;
  const f = new Function("boulier", "state", "PERLES", "demoInitiale", "appels",
    `let demo = demoInitiale;
     const dessinerBoulier = animer => appels.dessiner.push(animer);
     const montrerGeste = () => { appels.montrer += 1; };
     const refuserGeste = refus => appels.refus.push(refus.motif);
     const leverRefus = () => {}; const enregistrerGeste = () => {}; const majBoulier = () => {};
     ${corps("positionPerle")}\n${corps("gesteAttendu")}\n${corps("verifierGeste")}\n${corps("arreterDemo")}
     ${corps("perlesPointerDown")}\n${corps("perlesPointerMove")}\n${corps("perlesPointerUp")}
     return {down: perlesPointerDown, move: perlesPointerMove, up: perlesPointerUp, demo: () => demo};`)(
    boulier, {running: true}, {rangees: 10, parRangee: 10}, demo, appels);
  const evenement = clientX => ({clientX, clientY: 5, pointerId: 1, preventDefault() {}});
  return {boulier, appels, ...f, evenement};
}
// Au repos, la perle i est à (5 + i) × 20 px ; en pleine démonstration, les
// perles 0 et 1 (le groupe de la table de 2) ont glissé de 50 px vers la gauche.
const REPOS = Array.from({length: 10}, (rien, i) => (5 + i) * 20);
const EN_GLISSEMENT = REPOS.map((x, i) => (i < 2 ? x - 50 : x));

test("correction E2 · 3 : la perle attrapée en pleine démonstration est celle que l'élève voit, et le bon geste est accepté", () => {
  const b = boulierSimule({demoEnCours: true, vues: EN_GLISSEMENT});
  b.down(b.evenement(EN_GLISSEMENT[1] + 10));
  assert.equal(b.demo(), null, "toucher le boulier arrête la démonstration");
  assert.equal(b.boulier.drag.index, 1, "la perle sous le doigt (1), pas sa voisine au repos (0)");
  assert.ok(b.appels.dessiner.includes(false), "le groupe repart de sa vraie place : c'est l'élève qui fait tout le geste");
  assert.equal(b.boulier.dom.rangees[0].perles[1].style.left, undefined);
  b.move(b.evenement(-60));
  b.up(b.evenement(-60));
  assert.deepEqual(b.appels.refus, [], "pas de « Pas assez de perles ! »");
  assert.equal(b.boulier.etats[0], 2, "les 2 perles sont poussées");
});

test("correction E2 · 3 : un doigt posé sur une perle que la démonstration a amenée à gauche ne pousse rien — rien n'est fait à sa place", () => {
  const AU_BOUT = REPOS.map((x, i) => (i < 2 ? i * 20 : x));
  const b = boulierSimule({demoEnCours: true, vues: AU_BOUT});
  b.down(b.evenement(AU_BOUT[1] + 10));
  b.move(b.evenement(AU_BOUT[1] + 12));
  b.up(b.evenement(AU_BOUT[1] + 12));
  assert.equal(b.boulier.etats[0], 0, "rien n'est fait à la place de l'élève");
  assert.equal(b.appels.montrer, 1, "c'est un clic : la démonstration se rejoue");
  assert.ok(b.appels.dessiner.includes(false), "chaque perle reprend sa vraie place");
});

test("correction E2 · 3 : sans démonstration, le geste des perles ne change pas", () => {
  const b = boulierSimule({demoEnCours: false, vues: REPOS});
  b.down(b.evenement(REPOS[1] + 10));
  assert.equal(b.boulier.drag.index, 1);
  assert.equal(b.boulier.drag.depart, REPOS[1] + 10, "le geste part du doigt");
  b.move(b.evenement(10));
  b.up(b.evenement(10));
  assert.equal(b.boulier.etats[0], 2);
  const autre = boulierSimule({demoEnCours: false, vues: REPOS});
  autre.down(autre.evenement(REPOS[1] + 10));
  autre.up(autre.evenement(REPOS[1] + 10));
  assert.equal(autre.appels.montrer, 1, "un clic sans glisser rejoue la démonstration");
});

test("correction E2 · 3 : quitter la série (menu, retour) arrête la démonstration et ses minuteurs", () => {
  assert.match(corps("quitterSerie"), /stopTimer\(\);[\s\S]{0,200}arreterDemo\(\);/);
});
