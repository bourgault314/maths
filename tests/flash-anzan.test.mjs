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
  assert.equal(nbsp(CORE.resume("flash", CORE.normaliser("flash", {}))), "⚡ Flash · 2 à 3 chiffres · 10 nombres · 0,8 s par nombre · 8 s en tout");
  assert.equal(nbsp(CORE.resume("colonne", CORE.normaliser("colonne", {}))), "📝 Colonne · + et − · 3 chiffres · 8 nombres");
  assert.equal(nbsp(CORE.resume("colonne", CORE.normaliser("colonne", {limite: 20, chiffresMin: 1, chiffresMax: 1}))), "📝 Colonne · + et − · 1 chiffre · 8 nombres · 20 s");
  assert.equal(nbsp(CORE.resume("flash", CORE.normaliser("flash", {temps: 25}), {avecMode: false})), "2 à 3 chiffres · 10 nombres · 2,5 s par nombre · 25 s en tout");
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
  assert.match(PAGE, /<script src="\.\/flash_anzan_parcours\.js\?v=\d{8}-\d+"><\/script>\s*<script src="\.\.\/\.\.\/assets\/js\/code-en-cases\.js\?v=\d{8}-\d+"><\/script>\s*<script src="\.\/flash_anzan_suivi\.js\?v=\d{8}-\d+"><\/script>/,
    "le moteur du parcours et l'habillage du suivi, avec une version, après le moteur des calculs");
  assert.doesNotMatch(PAGE, /<script[^>]+src="https?:\/\//, "aucun script d'un autre domaine");
  assert.match(script, /function suiviActif\(\) \{\s*return Boolean\(SUIVI && SUIVI\.actif\(\)\);/);
  assert.match(script, /function noterSeanceSuivi\(\) \{\s*if \(!suiviActif\(\)\) \{ noterSeanceVisiteur\(\); return; \}\s*if \(!seance\.resultats\.length\) return;\s*if \(!seance\.idSuivi\) seance\.idSuivi = PARCOURS\.idLibre\(SUIVI\.lire\(\), 0\);/,
    "sans code, la case de l'appareil ; rien sans calcul fait ; une séance partie avant le billet reçoit son identifiant à sa première note");
  // Mon historique sans code (06/11/2026) : la case « sans code » de l'appareil,
  // jamais pour l'élève venu de son espace (billet en route ou refusé compris),
  // jamais par le client du suivi (qui seul parle au serveur).
  assert.match(script, /function caseVisiteur\(\) \{\s*return Boolean\(PARCOURS\) && !modeEleve\(\);\s*\}/);
  assert.match(script, /function noterSeanceVisiteur\(\) \{\s*if \(!caseVisiteur\(\) \|\| !seance\.resultats\.length\) return;/);
  assert.match(script, /PARCOURS\.sauver\(stockageAppareil\(\), apres, ""\);/, "la case sans code, rien d'autre");
  assert.match(script, /try \{ return PARCOURS\.charger\(stockageAppareil\(\), ""\); \}/);
  const visiteur = script.slice(script.indexOf("function noterSeanceVisiteur"), script.indexOf("// « ● Envoyé à ton professeur »"));
  assert.doesNotMatch(visiteur, /SUIVI\.|noterUneSeance/, "la séance du visiteur ne passe jamais par le client du suivi");
  assert.match(script, /if \(e\.etat === "ok" && SUIVI\.client\.sync\.dirty\) \{ envoi\.hidden = true; return; \}/, "« Envoyé » attend la confirmation du serveur");
  assert.match(script, /\} else if \(!modeEleve\(\)\) \{\s*try \{ brut = JSON\.parse\(window\.localStorage\.getItem\(CLE\)/, "l'élève venu de son espace ne lit jamais les réglages de l'appareil, billet en route compris");
  assert.match(script, /if \(modeEleve\(\)\) return; \/\/ billet en route ou refusé : rien à l'appareil/);
  // Ce qui part : le mode, les réglages, les calculs faits, le score — jamais les calculs ni les réponses.
  assert.match(script, /SUIVI\.client\.noterUneSeance\(\{\s*id: seance\.idSuivi,\s*ordre: seance\.ordreSuivi \|\| 0,\s*jour: seance\.jourSuivi \|\| "",\s*mode: seance\.mode,\s*reglages: seance\.reglages,\s*faits: seance\.resultats\.length,\s*score: justes\s*\}\);/);
  assert.match(script, /seance\.idSuivi = suiviActif\(\) \? PARCOURS\.idLibre\(SUIVI\.lire\(\), 0\) : 0;/, "l'identifiant est tiré au début de chaque séance, libre dans la case");
  assert.doesNotMatch(script, /noterUneSeance\([^)]*(calculs|resultats\[|ecrit|termes)/, "jamais les nombres ni les réponses");
});

test("la mémoire des réglages passe par un try/catch (navigation privée)", () => {
  assert.match(PAGE, /try \{ brut = JSON\.parse\(window\.localStorage\.getItem\(CLE\)/);
  assert.match(PAGE, /try \{ window\.localStorage\.setItem\(CLE/);
});

test("pas de barre au-dessus du cadre : la flèche et le plein écran sont dans le cadre ; rien en bas", () => {
  assert.doesNotMatch(PAGE, /class="topbar"/);
  const cadre = PAGE.slice(PAGE.indexOf('<section class="panel"'), PAGE.indexOf("</section>"));
  assert.match(cadre, /<a class="rond" id="lien-retour" href="\.\.\/index\.html\?domain=nombres-calculs&amp;notion=calcul-mental"/);
  assert.equal((cadre.match(/data-fullscreen-toggle/g) || []).length, 4, "un plein écran sur les réglages, un pendant la séance, un sur Mon historique, un sur les grades");
  // Plus de pied du tout, logo compris (24/10/2026, choix de Gwenaël) ; ni
  // « Sans cookie ni traceur » (retirée des applis le 23/10/2026).
  assert.doesNotMatch(PAGE, /<footer\b|site-footer|pied-logo|confidentialite\.html|dessinerPied/);
  assert.doesNotMatch(PAGE, /Sans cookie ni traceur|<script[^>]*mention-confidentialite\.js/);
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
  assert.match(hubSoroban, /url=\/outils\/\?domain=nombres-calculs&amp;collection=soroban"/, "l’ancienne page Soroban renvoie vers la collection, qui contient la fiche");
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

test("4e relecture Codex (24/10) : « Envoyé à ton professeur » seulement si la séance est DANS le parcours envoyé, et la page redonne l'ordre de sa séance à chaque note", () => {
  const html = readFileSync(new URL("../outils/calcul_mental/flash_anzan.html", import.meta.url), "utf8");
  assert.match(html, /if \(PARCOURS\.ordreDeId\(SUIVI\.client\.parcours, seance\.idSuivi\) === null\) \{ envoi\.hidden = true; return; \}/);
  assert.match(html, /seance\.ordreSuivi = 0;/, "remis à zéro à chaque séance");
  assert.match(html, /ordre: seance\.ordreSuivi \|\| 0,\s*jour: seance\.jourSuivi \|\| "",/, "l'ordre et le jour gardés repartent avec chaque note");
  assert.match(html, /garderOrdre\(SUIVI\.client\.parcours\);/, "après chaque note sous un code");
  assert.match(html, /function garderOrdre\(parcours\) \{\s*const ordre = PARCOURS\.ordreDeId\(parcours, seance\.idSuivi\);\s*if \(ordre\) \{\s*seance\.ordreSuivi = ordre;/);
  assert.match(html, /if \(vue\) seance\.jourSuivi = vue\.jour;/, "et son jour de départ");
});

// ---------------------------------------------------------------------------
// L'habillage du 30/10/2026 (planches validées : maquette « élève connecté »,
// version bleue)
// ---------------------------------------------------------------------------
test("habillage : un bandeau en haut du cadre, sur les réglages, la séance et Mon historique — blanc, un trait fin gris dessous (Anzan adouci, 31/10/2026)", () => {
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  assert.match(style, /\.bandeau \{[^}]*\n?[^}]*background: #fff; border-bottom: 1px solid #e3ebf0; \}/, "le haut du cadre blanc (planche 16 du 31/10/2026)");
  // Anzan adouci (planche 4 du 31/10/2026, validée telle quelle) : plus de turquoise pâle
  // nulle part dans les réglages ; cases et boutons blancs à bordure fine, signes en bleu,
  // choix actif bleu très pâle bordé de bleu, interrupteur du son bleu, résumé sans fond.
  for (const turquoise of ["#dff4f2", "#e2f5f4", "#93d9d5", "#c3e8e5", "#eefaf9", "#b9dcdc", "#c4e7e5", "#a9cfcd"]) {
    assert.equal(style.includes(turquoise), false, `plus de ${turquoise}`);
  }
  assert.match(style, /\.onglet \{[^}]*border: 1px solid #dde7ec;[^}]*background: #f5f8fa;/, "l'onglet inactif gris très pâle");
  assert.match(style, /\.pas \{[^}]*background: #fff; border: 1\.5px solid #d4e3ed; \}/);
  assert.match(style, /\.pas button \{[^}]*border: 1\.5px solid #d4e3ed;[^}]*color: var\(--blue\);/, "− et + en bleu");
  assert.match(style, /\.option \.sig \{ font-size: 1\.25rem; color: var\(--blue\); \}/, "les signes ± en bleu");
  assert.match(style, /\.option\[aria-pressed="true"\] \{ background: #eef4fc; border-color: var\(--blue\); color: var\(--ink\); \}/);
  assert.match(style, /\.bascule\[aria-checked="true"\] \.inter \{ background: var\(--blue\); \}/, "l'interrupteur du son bleu");
  assert.match(style, /\.resume \{[^}]*\n?[^}]*background: none;/, "le résumé sans fond");
  assert.match(style, /\.pas output \{[^}]*font-weight: 900;/, "les nombres restent gras");
  const cadre = PAGE.slice(PAGE.indexOf('<section class="panel"'), PAGE.indexOf("</section>"));
  for (const ecran of ["ecran-reglages", "ecran-historique", "ecran-seance"]) {
    const debut = cadre.indexOf(`id="${ecran}"`);
    assert.ok(debut > 0, ecran);
    assert.match(cadre.slice(debut, debut + 400), /<div class="bandeau">/, `${ecran} commence par le bandeau`);
  }
  // Les ronds ne sautent pas : la rangée du titre et celle de la séance ont
  // la même hauteur et les mêmes marges (mesuré au navigateur : même place
  // au pixel près, téléphone et ordinateur).
  assert.match(style, /\.cadre-haut, \.jeu-haut \{ display: flex; align-items: center; gap: 12px; min-height: var\(--rangee-h\); \}/);
  assert.doesNotMatch(style, /\.cadre-haut > \.rond \{ position: absolute/, "plus de ronds posés à part sur ordinateur");
});

test("habillage : onglets Flash / Colonne en intercalaires, le trait orange sous l'actif ; l'orange ne sert qu'à lui, les boutons restent bleus", () => {
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  assert.match(style, /\.onglet\[aria-pressed="true"\]::after \{[^}]*\n?[^}]*background: #f58220;/);
  assert.equal((style.match(/#f58220/gi) || []).length, 1, "l'orange maths&go : le trait de l'onglet, rien d'autre");
  assert.match(style, /\.primary \{ color: #fff; border: 0; background: var\(--blue\);/, "C'est parti, Valider, Calcul suivant : bleu (choix de Gwenaël)");
  assert.match(PAGE, /<button type="button" class="primary partir" id="partir">C’est parti<svg/);
});

test("habillage : la page ne redéfinit pas .puce (le point du bloc de suivi, dessiné par flash_anzan_suivi.js)", () => {
  // Trouvé à la capture : une case de réglage nommée .puce faisait du petit
  // point vert du bloc « Suivi par ton professeur » une pastille de 56 px.
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  assert.doesNotMatch(style, /(^|[\s,}])\.puce\b/);
  assert.doesNotMatch(PAGE, /class="puce/);
});

test("habillage : réglages façon FastMath, le titre au-dessus de chaque réglage ; deux colonnes au téléphone, quatre sur ordinateur", () => {
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  assert.match(style, /\.grille \{ display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;/);
  const telephone = [...style.matchAll(/@media ([^{]+)\{([\s\S]*?)\n    \}/g)]
    .filter(m => m[1].trim() === "(max-width: 620px)" && /\.grille \{/.test(m[2]));
  assert.equal(telephone.length, 1, "un bloc téléphone pour la grille");
  assert.match(telephone[0][2], /\.grille \{ grid-template-columns: 1fr 1fr;/, "deux colonnes au téléphone (validé)");
  for (const lab of ["Opérations", "Chiffres <small>au moins</small>", "Chiffres <small>au plus</small>", "Nombres", "Temps <small>par nombre</small>",
    "Temps limite <small>par calcul</small>", "Calculs"]) {
    assert.ok(PAGE.includes(`>${lab}</span>`), lab);
  }
  // Pas de petit titre « Son » (06/11/2026) : la ligne du bip a la hauteur du
  // résumé qui la remplace en Colonne — le cadre ne bouge plus d'un mode à l'autre.
  assert.ok(!PAGE.includes(">Son</span>"), "plus de titre « Son »");
  assert.doesNotMatch(PAGE, /lab-son/);
  assert.match(PAGE, /<button type="button" class="bascule" id="bascule-son" role="switch" aria-checked="true"/);
});

// Lot « menu immobile » (07/11/2026) : au téléphone, le menu raccourcissait
// en passant de Flash à Colonne (« C'est parti » remontait de 25 à 70 px).
test("menu immobile : les blocs cachés de Flash/Colonne gardent leur place", () => {
  // Les deux « Temps » dans la même case, le caché garde sa place.
  const temps = PAGE.match(/<div class="bloc-temps">([\s\S]*?)<\/div>\s*<div class="bloc large">/);
  assert.ok(temps, "une case .bloc-temps, suivie du bloc Calculs");
  assert.match(temps[1], /<div class="bloc" data-pour="flash">[\s\S]*val-temps/);
  assert.match(temps[1], /<div class="bloc" data-pour="colonne">[\s\S]*val-limite/);
  assert.match(PAGE, /\.bloc-temps > \.bloc \{ grid-area: 1 \/ 1; \}/);
  assert.match(PAGE, /\.bloc-temps > \.bloc\[hidden\] \{ display: flex !important; visibility: hidden; \}/);
  // Les champs d'une rangée alignés par le bas.
  assert.match(PAGE, /\.bloc \{ display: flex; flex-direction: column; justify-content: flex-end;/);
  // Le bip garde sa place au téléphone et à la tablette (pas sur ordinateur,
  // où le résumé prend sa place), et le résumé garde deux lignes.
  assert.match(PAGE, /<div class="bloc large garde-place-tel" data-pour="flash">\s*(<!--[\s\S]*?-->\s*)?<button type="button" class="bascule" id="bascule-son"/);
  const tel = [...PAGE.matchAll(/@media \(max-width: 899px\) \{([\s\S]*?)\n    \}/g)].map(m => m[1]).join("\n");
  assert.match(tel, /\.garde-place-tel\[hidden\] \{ display: flex !important; visibility: hidden; \}/);
  assert.match(tel, /\.resume \{ line-height: 1\.3; min-height: max\(56px, calc\(2\.6em \+ 16px\)\); \}/);
  assert.doesNotMatch(PAGE.replace(/@media \(max-width: 899px\) \{[\s\S]*?\n    \}/g, ""), /\.garde-place-tel\[hidden\]/, "seulement sous 900 px");
  // Les onglets : au repos 8 + 9 + 13 = choisi 15 + 15.
  assert.match(PAGE, /\.onglet \{ position: relative; min-height: 50px; margin-top: 8px; padding: 9px 8px 13px;/);
  assert.match(PAGE, /\.onglet\[aria-pressed="true"\] \{ z-index: 1; margin-top: 0; padding-top: 15px; padding-bottom: 15px;/);
});

test("iPhone (10/11/2026) : au téléphone, hors séance, le menu est resserré et « Les grades » / « Historique » sont côte à côte", () => {
  const style = PAGE.slice(PAGE.indexOf("<style>"), PAGE.indexOf("</style>"));
  const i = style.indexOf("Retour iPhone du 10/11/2026");
  assert.ok(i > 0, "le bloc du 10/11 est là");
  const bloc = style.slice(i, style.indexOf("@media (max-width: 380px)", i));
  assert.match(bloc, /@media \(max-width: 620px\)/);
  assert.match(bloc, /body:not\(\.en-seance\) \.panel \{ --bandeau-haut: 8px; --rangee-h: 44px; \}/, "la séance garde ses tailles");
  assert.match(bloc, /\.reglages-corps \.bas-pile \{ flex-direction: row; flex-wrap: wrap;/);
  assert.match(bloc, /\.bas-pile \.bandeau-grades \{ flex: 1 1 0;/);
  assert.match(bloc, /\.bas-pile \.historique-bouton \{ flex: 1 1 0;/);
  assert.match(bloc, /\.bg-point \{ display: none; \}/, "le détail des grades sur deux lignes, sans le point du milieu");
  assert.match(style, /@media \(max-width: 380px\) \{\s*\.resume \{ min-height: calc\(2\.6em \+ 4px\); \}/, "petit téléphone : le menu ne bouge pas entre Flash et Colonne");
  // 11/11/2026 : les tailles suivent la hauteur de l'écran (trois paliers dans --t-*) ;
  // les boutons du menu ne descendent jamais sous 44 px (les − / + gardent 38 px dans leur case).
  const paliers = [...bloc.matchAll(/@media \(max-width: 620px\)(?: and \(min-height: (\d+)px\))? \{\s*:root \{([^}]*)\}/g)];
  assert.deepEqual(paliers.map(m => m[1] || "0"), ["0", "770", "860"], "trois paliers : serré, un peu d'air, les tailles d'avant");
  for (const [, , vars] of paliers) {
    for (const nom of ["--t-case", "--t-partir", "--t-bas"]) {
      const v = vars.match(new RegExp(nom + ": (\\d+)px"));
      if (v) assert.ok(Number(v[1]) >= 44, `${nom} ${v[1]} px`);
    }
  }
  assert.match(bloc, /\.pas, \.option, \.bascule \{ height: var\(--t-case\); \}/);
  // Côte à côte, « Historique » prend le cadre des grades (bord encre, papier crème, ombre beige).
  assert.match(bloc, /\.historique-bouton \{ padding: 5px 10px; border: 2px solid var\(--ink\); border-radius: 14px; background: #fdfbf6;\s*box-shadow: 0 4px 0 #d8c89c;/);
});

test("iPhone (11/11/2026) : au téléphone, le menu s'étire jusqu'au bas de la zone visible, 48 px au plus (garde-fou)", () => {
  assert.match(PAGE, /<div id="sonde-hauteur" aria-hidden="true"><\/div>\s*<section class="panel" id="panel">/);
  assert.match(PAGE, /#sonde-hauteur \{ position: fixed;[^}]*height: 100vh; height: 100svh; visibility: hidden; pointer-events: none; \}/);
  assert.match(PAGE, /const ETIRER_MAX = 48;/);
  assert.match(PAGE, /const ETIRER_MARGE = 8;/);
  // L'espace en plus est réparti en huit : cinq entre les rangées, le haut du corps, deux autour de « C'est parti ».
  assert.match(PAGE, /#grille \{ gap: calc\(var\(--t-gap\) \+ var\(--t-extra, 0px\) \/ 8\) 14px; \}/);
  assert.match(PAGE, /\.reglages-corps \{ padding-top: calc\(var\(--t-corps\) \+ var\(--t-extra, 0px\) \/ 8\);/);
  assert.match(PAGE, /\.bas-pile \{ margin-top: calc\(var\(--t-pile\) \+ var\(--t-extra, 0px\) \/ 8\); gap: calc\(var\(--t-pile\) \+ var\(--t-extra, 0px\) \/ 8\); \}/);
  // Hors téléphone, en séance ou ailleurs que dans les réglages : rien.
  assert.match(PAGE, /const telephone = typeof window\.matchMedia === "function" && window\.matchMedia\("\(max-width: 620px\)"\)\.matches;/);
  assert.match(PAGE, /if \(!telephone \|\| corps\.classList\.contains\("en-seance"\) \|\| \$\("ecran-reglages"\)\.hidden\) return;/);
});
