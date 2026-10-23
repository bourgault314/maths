// Flash Anzan, lot 1 (22/10/2026) : le moteur (réglages, tirage, calendrier)
// et ce que la page doit tenir — sans navigateur.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/flash_anzan_core.js");
const PAGE = readFileSync(new URL("../outils/calcul_mental/flash_anzan.html", import.meta.url), "utf8");
const CATALOGUE = readFileSync(new URL("../assets/js/catalogue-refonte-data.js", import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// Les réglages
// ---------------------------------------------------------------------------
test("les temps par nombre : de 0,1 s à 2 s par 0,1 s, puis de 2,5 s à 5 s par 0,5 s", () => {
  assert.deepEqual(CORE.TEMPS.map(t => t / 10), [
    0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2,
    2.5, 3, 3.5, 4, 4.5, 5
  ]);
  assert.deepEqual(CORE.LIMITES, [0, 10, 15, 20, 30, 45, 60]);
  assert.deepEqual(CORE.CALCULS, [5, 10, 20]);
});

test("les réglages par défaut sont ceux des maquettes ; le temps limite est « sans » par défaut", () => {
  assert.deepEqual(CORE.normaliser("flash", null),
    {operations: "plus", chiffresMin: 2, chiffresMax: 3, nombres: 10, calculs: 10, temps: 8, son: "bip"});
  assert.deepEqual(CORE.normaliser("colonne", undefined),
    {operations: "plusmoins", chiffresMin: 3, chiffresMax: 3, nombres: 8, calculs: 10, limite: 0});
});

test("des réglages abîmés redeviennent valides (localStorage, plus tard le compte de l'élève)", () => {
  const r = CORE.normaliser("flash", {operations: "fois", chiffresMin: 9, chiffresMax: 0, nombres: 99, temps: 7.5, calculs: 7, son: "trompette", limite: 20});
  assert.deepEqual(r, {operations: "plus", chiffresMin: 5, chiffresMax: 5, nombres: 30, calculs: 10, temps: 8, son: "bip"});
  assert.equal(CORE.normaliser("colonne", {nombres: 1}).nombres, 2);
  assert.equal(CORE.normaliser("colonne", {limite: 25}).limite, 0);
  assert.equal("temps" in CORE.normaliser("colonne", {temps: 3}), false, "chaque mode garde ses propres réglages");
});

test("« de » et « à » restent dans l'ordre", () => {
  const r = CORE.normaliser("flash", {chiffresMin: 2, chiffresMax: 3});
  assert.deepEqual([CORE.changerChiffres(r, "min", 1)].map(x => [x.chiffresMin, x.chiffresMax]), [[3, 3]]);
  assert.deepEqual([CORE.changerChiffres({...r, chiffresMin: 3}, "min", 1)].map(x => [x.chiffresMin, x.chiffresMax]), [[4, 4]]);
  assert.deepEqual([CORE.changerChiffres(r, "max", -1)].map(x => [x.chiffresMin, x.chiffresMax]), [[2, 2]]);
  assert.deepEqual([CORE.changerChiffres({...r, chiffresMax: 2}, "max", -1)].map(x => [x.chiffresMin, x.chiffresMax]), [[1, 1]]);
  assert.equal(CORE.changerChiffres({...r, chiffresMin: 1, chiffresMax: 1}, "min", -1).chiffresMin, 1);
  assert.equal(CORE.changerChiffres({...r, chiffresMin: 5, chiffresMax: 5}, "max", 1).chiffresMax, 5);
});

test("un pas dans une liste s'arrête aux bornes", () => {
  assert.equal(CORE.pas(CORE.TEMPS, 20, 1), 25);
  assert.equal(CORE.pas(CORE.TEMPS, 25, -1), 20);
  assert.equal(CORE.pas(CORE.TEMPS, 1, -1), 1);
  assert.equal(CORE.pas(CORE.TEMPS, 50, 1), 50);
  assert.equal(CORE.pas(CORE.LIMITES, 0, 1), 10);
});

// ---------------------------------------------------------------------------
// Le tirage
// ---------------------------------------------------------------------------
test("10 000 calculs « + et − » : jamais de total en cours négatif, premier nombre toujours ajouté", () => {
  const rng = CORE.mulberry32(20261022);
  let soustractions = 0;
  for (let k = 0; k < 10000; k += 1) {
    const chiffresMin = 1 + (k % 5);
    const chiffresMax = chiffresMin + ((k >> 3) % (6 - chiffresMin));
    const r = CORE.normaliser("flash", {operations: "plusmoins", chiffresMin, chiffresMax, nombres: 2 + (k % 29)});
    const calcul = CORE.tirerCalcul(r, rng);
    assert.equal(calcul.termes.length, r.nombres);
    assert.equal(calcul.termes[0].signe, 1);
    let total = 0;
    for (const t of calcul.termes) {
      total += t.signe * t.valeur;
      assert.ok(total >= 0, `total négatif : ${JSON.stringify(calcul.termes)}`);
      const texte = String(t.valeur);
      assert.ok(texte.length >= r.chiffresMin && texte.length <= r.chiffresMax, `${texte} hors de ${r.chiffresMin}-${r.chiffresMax}`);
      assert.notEqual(texte[0], "0");
      assert.ok(Number.isInteger(t.valeur) && t.valeur > 0);
      if (t.signe < 0) soustractions += 1;
    }
    assert.equal(total, calcul.total);
  }
  assert.ok(soustractions > 50000, `des soustractions, il en faut : ${soustractions}`);
});

test("en « + », que des additions ; les zéros à l'intérieur sont permis (305)", () => {
  const rng = CORE.mulberry32(7);
  const r = CORE.normaliser("colonne", {operations: "plus", chiffresMin: 3, chiffresMax: 3, nombres: 30});
  let zeroDedans = false;
  for (let k = 0; k < 500; k += 1) {
    const calcul = CORE.tirerCalcul(r, rng);
    assert.ok(calcul.termes.every(t => t.signe === 1));
    if (calcul.termes.some(t => String(t.valeur).slice(1).includes("0"))) zeroDedans = true;
  }
  assert.ok(zeroDedans);
});

test("chaque nombre de chiffres entre le min et le max sort", () => {
  const rng = CORE.mulberry32(3);
  const vus = new Set();
  const r = CORE.normaliser("flash", {chiffresMin: 1, chiffresMax: 5, nombres: 30});
  for (let k = 0; k < 50; k += 1) CORE.tirerCalcul(r, rng).termes.forEach(t => vus.add(String(t.valeur).length));
  assert.deepEqual([...vus].sort(), [1, 2, 3, 4, 5]);
});

test("une séance tire le nombre de calculs fixé ; même graine, même séance", () => {
  const r = CORE.normaliser("flash", {calculs: 20});
  const a = CORE.tirerSeance(r, CORE.mulberry32(42));
  const b = CORE.tirerSeance(r, CORE.mulberry32(42));
  assert.equal(a.length, 20);
  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------------------
// Le calendrier du Flash
// ---------------------------------------------------------------------------
test("la coupure blanche : environ 12 % du temps, au moins 50 ms", () => {
  assert.equal(CORE.coupure(100), 50);
  assert.equal(CORE.coupure(400), 50);
  assert.equal(CORE.coupure(800), 96);
  assert.equal(CORE.coupure(5000), 600);
});

test("les instants se calculent depuis le top départ, sans dérive", () => {
  for (const T of [100, 800, 1000, 5000]) {
    const n = 30;
    // Chaque nombre apparaît exactement à i × T, même loin dans la suite.
    for (let i = 0; i < n; i += 1) {
      assert.deepEqual(CORE.etatAuTemps(i * T, n, T), {index: i, visible: true, fini: false});
      assert.equal(CORE.etatAuTemps(i * T - 0.01, n, T).index, i - 1);
      assert.equal(CORE.etatAuTemps(i * T + T - CORE.coupure(T) - 0.01, n, T).visible, true);
      assert.equal(CORE.etatAuTemps(i * T + T - CORE.coupure(T), n, T).visible, false);
    }
    assert.deepEqual(CORE.etatAuTemps(n * T, n, T), {index: n, visible: false, fini: true});
    assert.deepEqual(CORE.etatAuTemps(-1, n, T), {index: -1, visible: false, fini: false});
  }
});

// ---------------------------------------------------------------------------
// Les textes
// ---------------------------------------------------------------------------
test("le résumé d'une séance s'écrit à la française", () => {
  const nbsp = s => s.replace(/ /g, " ");
  assert.equal(nbsp(CORE.resume("flash", CORE.normaliser("flash", {}))), "⚡ Flash · 2 à 3 chiffres · 10 nombres · 0,8 s");
  assert.equal(nbsp(CORE.resume("colonne", CORE.normaliser("colonne", {}))), "📝 Colonne · + et − · 3 chiffres · 8 nombres");
  assert.equal(nbsp(CORE.resume("colonne", CORE.normaliser("colonne", {limite: 20, chiffresMin: 1, chiffresMax: 1}))), "📝 Colonne · + et − · 1 chiffre · 8 nombres · 20 s");
  assert.equal(nbsp(CORE.resume("flash", CORE.normaliser("flash", {temps: 25}), {avecMode: false})), "2 à 3 chiffres · 10 nombres · 2,5 s");
  assert.equal(nbsp(CORE.secondes(10 * 0.3)), "3 s");
  assert.equal(nbsp(CORE.secondes(7 * 0.3)), "2,1 s");
});

// ---------------------------------------------------------------------------
// La page
// ---------------------------------------------------------------------------
test("la page charge le moteur avec son numéro de version", () => {
  assert.match(PAGE, /<script src="\.\/flash_anzan_core\.js\?v=\d{8}-\d+"><\/script>/);
});

test("jamais le clavier du téléphone : aucune case de saisie dans la page", () => {
  assert.doesNotMatch(PAGE, /<input\b|<textarea\b|contenteditable/i);
  for (const cle of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "clear", "backspace"]) {
    assert.match(PAGE, new RegExp(`data-key="${cle}"`));
  }
  assert.doesNotMatch(PAGE, /data-key="(?:minus|-|\.|,)"/, "pas de touche moins ni virgule");
});

test("lot 4a : la page elle-même ne parle jamais au serveur ; seul le moteur du suivi le fait, et seulement sous un code", () => {
  const script = PAGE.slice(PAGE.lastIndexOf("<script>"), PAGE.lastIndexOf("</script>"));
  assert.doesNotMatch(script, /fetch\(|XMLHttpRequest|sendBeacon/, "aucun appel réseau dans le script de la page");
  assert.match(PAGE, /<script src="\.\/flash_anzan_parcours\.js\?v=\d{8}-\d+"><\/script>\s*<script src="\.\/flash_anzan_suivi\.js\?v=\d{8}-\d+"><\/script>/,
    "le moteur du parcours et l'habillage du suivi, avec une version, après le moteur des calculs");
  assert.doesNotMatch(PAGE, /<script[^>]+src="https?:\/\//, "aucun script d'un autre domaine");
  assert.match(script, /function suiviActif\(\) \{\s*return Boolean\(SUIVI && SUIVI\.actif\(\)\);/);
  assert.match(script, /function noterSeanceSuivi\(\) \{\s*if \(!suiviActif\(\) \|\| !seance\.resultats\.length\) return;/, "rien sans code, rien sans calcul fait");
  // Ce qui part : le mode, les réglages, les calculs faits, le score — jamais les calculs ni les réponses.
  assert.match(script, /SUIVI\.client\.noterUneSeance\(\{\s*mode: seance\.mode,\s*reglages: seance\.reglages,\s*faits: seance\.resultats\.length,\s*score: justes\s*\}, seance\.numeroSuivi\);/);
  assert.doesNotMatch(script, /noterUneSeance\([^)]*(calculs|resultats\[|ecrit|termes)/, "jamais les nombres ni les réponses");
});

test("la mémoire des réglages passe par un try/catch (navigation privée)", () => {
  assert.match(PAGE, /try \{ brut = JSON\.parse\(window\.localStorage\.getItem\(CLE\)/);
  assert.match(PAGE, /try \{ window\.localStorage\.setItem\(CLE/);
});

test("pas de barre au-dessus du cadre : la flèche et le plein écran sont dans le cadre, le logo dans le pied", () => {
  assert.doesNotMatch(PAGE, /class="topbar"/);
  const cadre = PAGE.slice(PAGE.indexOf('<section class="panel"'), PAGE.indexOf("</section>"));
  assert.match(cadre, /<a class="rond" id="lien-retour" href="\.\.\/index\.html\?domain=nombres-calculs&amp;notion=calcul-mental"/);
  assert.equal((cadre.match(/data-fullscreen-toggle/g) || []).length, 3, "un plein écran sur les réglages, un pendant la séance, un sur Mon historique");
  const pied = PAGE.slice(PAGE.indexOf('<footer class="site-footer">'), PAGE.indexOf("</footer>"));
  assert.match(pied, /<a class="pied-logo" href="\/"/);
  assert.match(pied, /<span data-mathsgo-confidentialite>Sans cookie ni traceur<\/span>/);
});

test("pas de plein écran sur téléphone, tenu en hauteur comme en largeur (relecture Codex A4)", () => {
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  const regles = [...style.matchAll(/@media ([^{]+)\{([\s\S]*?)\n    \}/g)]
    .filter(m => /\.plein-ecran \{ display: none; \}/.test(m[2])).map(m => m[1].trim());
  assert.deepEqual(regles.sort(), ["(max-height: 500px) and (pointer: coarse)", "(max-width: 620px)"]);
});

test("à la fin du Flash, un grand « ? » et rien d'autre (demande de Gwenaël, 22/10)", () => {
  assert.match(PAGE, /<div class="question" id="question" hidden><p class="combien" aria-label="Combien \?">\?<\/p><\/div>/);
  assert.doesNotMatch(PAGE, /nombres ajoutés/);
});

test("ce qui est barré l'est en biais, d'un coin à l'autre (demande de Gwenaël, 22/10)", () => {
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  const regle = /\n    s \{([^}]*)\}/.exec(style);
  assert.ok(regle, "une règle pour <s>");
  assert.match(regle[1], /text-decoration: none/);
  assert.match(regle[1], /linear-gradient\(to bottom right/, "un trait « / », du bas à gauche au haut à droite");
});

test("au catalogue (22/10) : dans Calcul mental « S'entraîner » et dans la collection Soroban, une seule fiche, et indexée", () => {
  assert.equal(CATALOGUE.split('"path": "outils/calcul_mental/flash_anzan.html"').length - 1, 1, "une seule fiche");
  const classement = /"outils\/calcul_mental\/flash_anzan\.html": \{([^}]*)\}/.exec(CATALOGUE);
  assert.ok(classement, "le classement de la fiche");
  assert.match(classement[1], /"primaryNotion": "calcul-mental"/);
  assert.match(classement[1], /"primaryGroup": "entrainer"/);
  assert.match(classement[1], /"collections": \["soroban"\]/);
  assert.match(classement[1], /"thumbnail": "assets\/img\/thumbnails\/calcul-mental\/flash-anzan\.svg\?v=1"/);
  assert.doesNotMatch(PAGE, /noindex/);
  const hubSoroban = readFileSync(new URL("../outils/bouliers/soroban/index.html", import.meta.url), "utf8");
  assert.match(hubSoroban, /href="\.\.\/\.\.\/calcul_mental\/flash_anzan\.html"/, "la page Soroban (annuaire, Google) y mène aussi");
});

test("AGENTS.md garde l'exception du haut de page de Flash Anzan, pour qu'on ne la « corrige » pas", () => {
  const agents = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
  assert.match(agents, /### Exception voulue : le haut de page de Flash Anzan/);
});

test("le titre « Soroban / Flash Anzan » est centré, et la place du plein écran absent l'équilibre (choix de Gwenaël, 22/10)", () => {
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  assert.match(style, /\.cadre-haut \.titre-bloc \{[^}]*text-align: center;/);
  const regle = /@media \(max-width: 620px\), \(max-width: 899px\) and \(max-height: 500px\) and \(pointer: coarse\) \{\s*\.cadre-haut::after \{ content: ""; flex: 0 0 44px; \}/.exec(style);
  assert.ok(regle, "une place de 44 px à droite, là où le plein écran est caché et la flèche dans la ligne");
});
