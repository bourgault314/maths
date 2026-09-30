// Défi tables — audit 2 (30/09/2026) : la légende de Mes calculs, l'écran de
// jeu sur téléphone (version A choisie par Gwenaël) et le bouton Retour du
// navigateur (bug D de l'audit). Le bloc « retour navigateur » est EXÉCUTÉ tel
// qu'il est écrit dans la page, dans un faux historique ; le CSS est lu dans
// la source (il a été mesuré au navigateur à 8 tailles, voir la notice).
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {createRequire} from "node:module";

const PARCOURS = createRequire(import.meta.url)("../outils/calcul_mental/defi_tables_mon_parcours.js");

const html = await readFile(new URL("../outils/calcul_mental/defi_tables.html", import.meta.url), "utf8");

function entre(debut, fin) {
  const a = html.indexOf(debut);
  const b = html.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `les repères « ${debut} » et « ${fin} » existent`);
  return html.slice(a + debut.length, b);
}

test("1. légende de Mes calculs : le carré suit ses petites cases (43 px dès 480 px)", () => {
  assert.match(html, /\.calculs-legende \.mc-cell \{ width: auto; min-width: 44px; min-height: 22px; padding: 2px 5px; pointer-events: none; \}/);
  assert.doesNotMatch(html, /\.calculs-legende \.mc-cell \{ width: 44px;/, "plus de carré figé à 44 px (36 px dedans)");
  // Les petites cases d'origine, que le carré doit contenir : 5 × 7 px + 4 × 2 px.
  assert.match(html, /\.mc-cases \{ display: flex; gap: 2px; \}\s*\.mc-case \{ width: 7px; height: 7px;/);
});

test("2. écran de jeu sur téléphone (A) : le calcul au-dessus du pavé, sans bouger pendant la série", () => {
  const telephone = entre("@media (max-width: 620px) {", "@media (min-width: 621px) and (max-height: 900px) {");
  assert.match(telephone, /\.challenge-playing \.question:not\(\.show-learn-sequence\) \.expression \{ margin-top: auto; \}/);
  assert.match(telephone, /\.challenge-playing \.question:not\(\.show-learn-sequence\) \.keypad \{ margin: 6px auto 0; \}/);
  // La correction sur deux lignes ne pousse pas le calcul : sa place est réservée.
  assert.match(telephone, /\.challenge-playing \.question:not\(\.show-learn-sequence\) \.answer-feedback \{ min-height: 56px; \}/);
  // Les activités à bande ou à perles (J'apprends) gardent leur écran.
  assert.match(html, /\$\("question-card"\)\.classList\.toggle\("show-learn-sequence", visible\);/);
  // La tablette et l'ordinateur ne changent pas.
  const grand = entre("@media (min-width: 621px) and (max-height: 900px) {", "/* Tablette et ordinateur");
  assert.doesNotMatch(grand, /margin-top: auto/);
});

// --------------------------------------------------- retour du navigateur

function monde({ecranDeDepart = "intro", mode = null, garde = false, etatInitial = null} = {}) {
  const pile = [{etat: etatInitial}];
  let position = 0;
  const ecouteurs = {};
  const appels = [];
  let enAttente = false;
  const history = {
    get state() { return pile[position].etat; },
    pushState(etat) { pile.splice(position + 1); pile.push({etat}); position += 1; appels.push("push"); },
    replaceState(etat) { pile[position].etat = etat; appels.push("replace"); },
    back() { appels.push("back"); enAttente = true; }
  };
  const window = {history, addEventListener: (nom, f) => { ecouteurs[nom] = f; }};
  const configuration = {mode};
  const vue = {ecran: ecranDeDepart};
  const api = new Function("window", "configuration", "gardeVisible", "quitterSerie", "backToModes",
    `${entre("// [retour-navigateur:debut]", "// [retour-navigateur:fin]")}
     return {suivreHistorique, retourNavigateur};`)(
    window, configuration, garde,
    () => { appels.push("quitterSerie"); },
    () => { appels.push("backToModes"); configuration.mode = null; api.suivreHistorique("intro"); });
  const monde = {
    api, appels, configuration, pile: () => pile.map(e => Boolean(e.etat && e.etat.defiTablesEcran)),
    get position() { return position; },
    ouvrir(nom) { vue.ecran = nom; api.suivreHistorique(nom); },
    // Le geste « retour » : le navigateur recule, PUIS prévient la page.
    retour() { assert.ok(position > 0, "il reste une entrée à reculer"); position -= 1; ecouteurs.popstate(); },
    // Le history.back() demandé par la page arrive plus tard.
    livrerBack() { if (enAttente) { enAttente = false; position -= 1; ecouteurs.popstate(); } },
    ecouteurs
  };
  return monde;
}

test("D. un écran interne pose UNE entrée, Retour y fait le bouton de l’écran", () => {
  const m = monde();
  m.ouvrir("calculs");
  assert.deepEqual(m.pile(), [false, true]);
  m.ouvrir("result");
  m.ouvrir("parcours");
  assert.deepEqual(m.pile(), [false, true], "jamais plus d’un étage");
  m.retour();
  assert.deepEqual(m.appels.slice(-1), ["backToModes"], "Mon parcours → Ma table");
  assert.equal(m.position, 0);
});

test("D. une série (lancement, jeu, bilan) s’arrête comme avec « Ma table » : quitterSerie", () => {
  for (const ecran of ["launch", "play", "result"]) {
    const m = monde();
    m.ouvrir(ecran);
    m.retour();
    assert.equal(m.appels.at(-1), "quitterSerie", ecran);
  }
});

test("D. les réglages (portes professeur) comptent comme un écran interne", () => {
  const m = monde({mode: "train"});
  m.ouvrir("intro");
  assert.deepEqual(m.pile(), [false, true]);
  m.retour();
  assert.equal(m.appels.at(-1), "backToModes");
});

test("D. revenir à l’accueil par un bouton de l’appli retire l’entrée : le Retour suivant quitte l’appli", () => {
  const m = monde();
  m.ouvrir("calculs");
  m.ouvrir("intro");
  assert.equal(m.appels.at(-1), "back");
  m.livrerBack();
  assert.equal(m.position, 0);
  assert.deepEqual(m.appels, ["push", "back"], "le retour attendu ne déclenche rien d’autre");
});

test("D. un écran rouvert pendant que l’entrée se retire garde son entrée", () => {
  const m = monde();
  m.ouvrir("calculs");
  m.ouvrir("intro");
  m.ouvrir("parcours"); // avant que le navigateur ait reculé
  m.livrerBack();
  assert.deepEqual(m.pile().slice(0, m.position + 1), [false, true], "Mon parcours a de nouveau son entrée");
});

test("D. « C’est toujours toi ? » ouvert : Retour ne quitte rien et remet l’entrée", () => {
  const m = monde({garde: true});
  m.ouvrir("play");
  m.retour();
  assert.ok(!m.appels.includes("quitterSerie"));
  assert.deepEqual(m.pile(), [false, true]);
});

test("D. depuis l’accueil, Retour n’est pas intercepté ; une page rechargée sur l’entrée la retire", () => {
  const m = monde();
  m.ecouteurs.popstate();
  assert.deepEqual(m.appels, []);
  const r = monde({etatInitial: {defiTablesEcran: true}});
  assert.deepEqual(r.appels, ["back"]);
  assert.match(html, /suivreHistorique\(name\);\n      \}\n/, "show() suit l’historique");
  assert.match(html, /syncControls\(\);\s*suivreHistorique\("intro"\);/, "applyMode aussi (les réglages)");
  assert.doesNotMatch(entre("// [retour-navigateur:debut]", "// [retour-navigateur:fin]"), /location\.hash|pushState\([^)]*,\s*"",\s*[^)]/,
    "l’adresse ne change jamais");
});

test("3. Mon parcours : « N calculs à revoir » sous la ligne, plus à côté de « Acquise ✓ »", () => {
  const rendu = html.slice(html.indexOf("      function renderParcours() {"), html.indexOf("const melange = $(\"parcours-melange\");"));
  // Seulement les calculs rouges DUS : raté aujourd'hui, il revient demain,
  // et le bouton affiché le jour même ne lançait rien.
  assert.match(rendu, /const rouges = ligne\.aRevoir \? new Set\(PARCOURS\.calculsATravailler\(parcours, ligne\.table\)\) : new Set\(\);\s*const nombre = PARCOURS\.calculsDus\(parcours, \{table: ligne\.table\}\)\.filter\(cle => rouges\.has\(cle\)\)\.length;\s*if \(nombre\) \{/);
  assert.match(rendu, /revoir\.textContent = `Réviser \$\{pluriel\(nombre, "calcul"\)\}\\u00a0→`;/);
  assert.match(rendu, /revoir\.addEventListener\("click", \(\) => startRevision\(ligne\.table, "parcours"\)\);/, "il lance toujours la révision de la table");
  assert.match(rendu, /etatGroupe\.append\(badge\);/);
  assert.match(rendu, /badge\.textContent = ligne\.acquise \? "" : ligne\.dernierEntrainement \?/, "plus de pastille « Acquise ✓ » : la case verte le dit");
  assert.doesNotMatch(rendu, /etatGroupe\.append\(revoir\)/, "plus dans l’en-tête, à côté de « Acquise ✓ »");
  assert.match(rendu, /item\.append\(head, cells\);\s*if \(revoir\) item\.append\(revoir\);/, "sous les ronds");
  assert.match(html, /\.parcours-revoir \{\s*display: block;\s*width: 100%;\s*min-height: 44px;/);
});

test("3. la barre n’apparaît que quand la révision peut partir : jamais le jour de l’erreur, dès le lendemain", () => {
  const parcours = PARCOURS.creerParcours();
  parcours.tables[2].acquise = "2026-09-30";
  const rouge = {boite: 1, cases: 0, vu: "2026-09-30", erreur: "2026-09-30", gagne: null, echeance: "2026-09-30"};
  parcours.calculs["2-5"] = {...rouge};
  parcours.calculs["2-6"] = {...rouge};
  const compter = jour => {
    const rouges = new Set(PARCOURS.calculsATravailler(parcours, 2));
    return PARCOURS.calculsDus(parcours, {table: 2, aujourdhui: jour}).filter(cle => rouges.has(cle)).length;
  };
  assert.ok(PARCOURS.etatAffichage(parcours, "2026-09-30").lignes.find(l => l.table === 2).aRevoir, "le moteur marque la table");
  assert.equal(compter("2026-09-30"), 0, "le jour même : pas de barre…");
  assert.equal(PARCOURS.planRevision(parcours, {table: 2, aujourdhui: "2026-09-30"}).length, 0, "…car la révision n’aurait rien lancé");
  assert.equal(compter("2026-10-01"), 2, "le lendemain : « 2 calculs à revoir »");
  assert.equal(PARCOURS.planRevision(parcours, {table: 2, aujourdhui: "2026-10-01"}).length, 2, "et la révision part");
});

test("3. Mon parcours : « ma table » (pastille et cadre bleus) sur la table de l’accueil", () => {
  const rendu = html.slice(html.indexOf("      function renderParcours() {"), html.indexOf("const melange = $(\"parcours-melange\");"));
  assert.match(rendu, /const maTable = tableEnCours\(etat\);/, "la même table que l’accueil (ordre 2, 10, 5… ou table choisie)");
  assert.match(rendu, /item\.className = `parcours-row\$\{ligne\.acquise \? " is-acquise" : ""\}\$\{ligne\.table === maTable \? " is-ma-table" : ""\}`;/);
  assert.match(rendu, /repere\.className = "parcours-ma-table";\s*repere\.textContent = "ma table";\s*etatGroupe\.append\(repere\);\s*\}\s*etatGroupe\.append\(badge\);/);
  assert.match(html, /\.parcours-row\.is-acquise \{[^}]*\}\s*\.parcours-row\.is-ma-table \{ border-color: var\(--blue\); box-shadow: 0 0 0 1px var\(--blue\); \}/, "le bleu l’emporte sur le vert d’une table acquise choisie");
  assert.match(html, /\.parcours-ma-table \{ padding: 3px 9px; border-radius: 999px; color: #fff; background: var\(--blue\);/);
});

// ------------------------------------------------------------- 5. au tableau

test("5. au tableau : l’appli s’agrandit d’un bloc selon l’écran, jamais sur un portable ni un téléphone", () => {
  const bloc = html.slice(html.indexOf("      const ECRAN_DE_BASE = "), html.indexOf("      function ajusterEchelle() {"));
  const echelleEcran = new Function(`${bloc}; return echelleEcran;`)();
  const base = {accueil: 680, jeu: 960};
  const z = (l, h, quoi) => Math.round(echelleEcran(l, h, base[quoi]) * 100) / 100;
  assert.equal(z(390, 844, "accueil"), 1, "téléphone");
  assert.equal(z(1024, 768, "accueil"), 1, "tablette");
  assert.equal(z(1366, 768, "accueil"), 1, "portable : sous ×1,1, rien ne bouge");
  assert.equal(z(1920, 1080, "accueil"), 1.5, "tableau en plein écran");
  assert.equal(z(1920, 1080, "jeu"), 1.13, "le jeu, plus haut, s’agrandit moins");
  assert.equal(z(2560, 1440, "accueil"), 1.6, "jamais plus de ×1,6");
  assert.match(html, /const ECRAN_DE_BASE = Object\.freeze\(\{largeur: 1280, hauteur: 680, hauteurJeu: 960, max: 1\.6\}\);/);
  assert.match(html, /ajusterEchelle\(\);\s*window\.addEventListener\("resize", ajusterEchelle\);/);
  assert.match(html, /@media screen \{\s*\.shell \{ zoom: var\(--echelle, 1\); \}\s*body\.challenge-playing \.shell \{ zoom: var\(--echelle-jeu, 1\); \}/, "jamais à l’impression");
  assert.match(html, /body\.challenge-playing:has\(\.question\.perles-main\) \.shell \{ zoom: 1; \}/, "les perles gardent leur taille");
});

test("5. la police : Nunito servie par le site, sur un écran d’ordinateur seulement ; le bouton plein écran décollé du coin", () => {
  assert.match(html, /<link rel="stylesheet" href="\.\.\/\.\.\/assets\/vendor\/polices\/polices\.css">/);
  assert.match(html, /@media \(min-width: 1024px\) \{\s*:root \{ font-family: Inter, ui-rounded, Nunito, "Arial Rounded MT Bold", "Segoe UI", sans-serif; \}/,
    "après la police d’Apple, avant Arial Rounded (un seul gras, regraissé par Chrome)");
  assert.match(html, /\n      font-family: Inter, ui-rounded, "Arial Rounded MT Bold", "Segoe UI", sans-serif;/, "les téléphones gardent leur police");
  assert.match(html, /body\.fullscreen-active \.fullscreen-toggle \{[^}]*top: max\(24px, env\(safe-area-inset-top\)\);\s*right: max\(28px, env\(safe-area-inset-right\)\);/);
});

test("6. dans la bande, « complétées » s’efface sous 430 px (« 11 / 11 cases » sur une ligne)", () => {
  assert.match(html, /suite\.className = "compteur-suite";\s*suite\.textContent = " complétées";\s*\$\("question-count"\)\.replaceChildren\(`\$\{completed\} \/ \$\{total\} cases`, suite\);/);
  assert.match(html, /@media \(max-width: 429px\) \{ #question-count \.compteur-suite \{ display: none; \} \}/);
  assert.match(html, /\} else \{\s*\$\("question-count"\)\.textContent = `\$\{completed\} \/ \$\{total\} \$\{label\}`;/, "« calculs sus » ne change pas");
});
