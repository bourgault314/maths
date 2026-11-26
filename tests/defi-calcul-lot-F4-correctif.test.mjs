// Défi calcul, correctif du lot F4 « Personne ne reste bloqué » (21/11/2026),
// après la relecture de Codex (13 points, PR #1258). Chaque cas reproduit un
// point du rapport : il rougissait sur main `c68b58f`. Ce que voit l'élève
// reste celui des planches validées ; seuls les textes faux sont recalés sur
// la règle déjà choisie.

import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CARTE = CORE.carte();
const lire = chemin => readFile(new URL(chemin, import.meta.url), "utf8");

const J = "2026-11-23";
const plus = (n, jour = J) => P.ajouterJours(jour, n);
const opts = (jour = J, seance = true, palier = 4) => ({aujourdhui: jour, carte: CARTE, seance, palier});
const types = (p, jour = J, palier = 4) => P.fileSeance(p, CARTE, {aujourdhui: jour, palier}).etapes.map(e => e.type);
const ouvrir = (p, jour = J) => P.ouvrirSeance(p, CARTE, {aujourdhui: jour});
const duPalier = palier => P.parcoursConstruit(CARTE).filter(c => P.palierDe(CARTE, c.module, c.niveau) === palier);
const arretee = () => Array.from({length: 25}, (_, i) => ({juste: i % 3 !== 0, outil: "aucun"}));
const vide = k => ({b: Array(k).fill(0), e: Array(k).fill(null), a: Array(k).fill(0), f: Array(k).fill(0), x: Array(k).fill(0),
  t: Array(k).fill(0), l: Array(k).fill(0), d: Array(k).fill(null), s: Array(k).fill(null), ar: Array(k).fill(0), c: {}});
// Toutes les bases entrées (boîte 4, retour lointain), sauf ce que `sauf` dit.
function basesAcquises(sauf = () => false) {
  const brut = {version: P.VERSION, modules: {}, paliers: [plus(-30), null, null, null], jours: [plus(-1)], seances: [plus(-1)]};
  duPalier(1).forEach(({module: id, niveau}) => {
    const m = brut.modules[id] || (brut.modules[id] = Object.assign({vu: plus(-1), ok: null}, vide(P.NIVEAUX[id])));
    if (sauf(id, niveau)) return;
    m.b[niveau - 1] = 4; m.e[niveau - 1] = plus(6); m.a[niveau - 1] = 1; m.f[niveau - 1] = 1;
    m.d[niveau - 1] = plus(-20); m.s[niveau - 1] = plus(-10);
  });
  return P.normaliserParcours(brut, {aujourdhui: J});
}

// ------------------------------------------------------------- 1. et 2.

// ------------------------------------------------------------------- 3.

// ------------------------------------------------------------------- 5.

function stockage(depart = {}) {
  const cases = Object.assign({}, depart);
  return {cases, getItem: k => (k in cases ? cases[k] : null), setItem: (k, v) => { cases[k] = String(v); }, removeItem: k => { delete cases[k]; },
    get length() { return Object.keys(cases).length; }, key: i => Object.keys(cases)[i] || null};
}

// ------------------------------------------------------------------- 6.

// ------------------------------------------------------------------- 7.

// ------------------------------------------------------------------- 8.

// ------------------------------------------------------------------- 9.

test("9. au-delà du 9e arrêt, la semaine d'attente revient tous les 3 arrêts (12e, 15e…), pas à chaque arrêt", () => {
  let p = P.normaliserParcours({version: P.VERSION, paliers: [plus(-30), plus(-30), plus(-30), plus(-30)],
    modules: {A1: Object.assign({vu: plus(-1)}, vide(3), {ar: [9 * 3 + 1, 0, 0], e: [plus(-1), null, null], f: [1, 0, 0]})}}, {aujourdhui: J});
  const attentes = [];
  for (let d = 0; d < 6; d += 1) {
    const r = P.appliquerSerie(p, {module: "A1", niveau: 1, genre: "apprends", reponses: arretee()}, {aujourdhui: plus(d * 8), carte: CARTE, seance: false});
    const ev = r.evenements.find(e => e.type === "arrete");
    attentes.push(ev.aVoir);
    p = r.parcours;
    assert.ok(p.modules.A1.ar[0] <= 29, "la borne de stockage tient");
    assert.ok(P.aVoirEnClasse(p.modules.A1, 0), "toujours « à voir en classe »");
  }
  assert.deepEqual(attentes, [false, false, true, false, false, true], "arrêts 10 à 15 : une semaine d'attente au 12e et au 15e");
});

// ------------------------------------------------------------------ 10.

test("10. « Demain, tu passes à la suite » vient de l'état du moteur : en attente demain, ou non", () => {
  const ligne = ar => Object.assign({vu: J}, vide(3), {ar, e: [null, null, null]});
  let p = P.normaliserParcours({version: P.VERSION, paliers: [plus(-30), plus(-30), plus(-30), plus(-30)], modules: {A1: ligne([3 * 3 + 2, 0, 0])}}, {aujourdhui: J});
  // Le 4e arrêt : toujours « à voir en classe », mais il revient demain.
  const r = P.appliquerSerie(p, {module: "A1", niveau: 1, genre: "apprends", reponses: arretee()}, {aujourdhui: J, carte: CARTE, seance: false});
  assert.equal(P.aVoirEnClasse(r.parcours.modules.A1, 0), true);
  assert.equal(P.enAttente(r.parcours.modules.A1, 0, plus(1)), false, "il revient demain : pas « tu passes à la suite »");
  // Au 3e arrêt : en attente demain.
  p = P.normaliserParcours({version: P.VERSION, modules: {A1: ligne([2 * 3 + 1, 0, 0])}}, {aujourdhui: J});
  const t = P.appliquerSerie(p, {module: "A1", niveau: 1, genre: "apprends", reponses: arretee()}, {aujourdhui: J, carte: CARTE, seance: false});
  assert.equal(P.enAttente(t.parcours.modules.A1, 0, plus(1)), true);
});

test("10. la page relit une ligne AVEC la version (F9-2 garde son 3e arrêt) et tire sa phrase de l'arrêt que le moteur a noté", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const corps = nom => page.slice(page.indexOf(`function ${nom}(`), page.indexOf("\n      }\n", page.indexOf(`function ${nom}(`)));
  assert.match(corps("ligneDe"), /version: PARCOURS\.VERSION/);
  // (Lot K1 : au 3e arrêt, l'événement « arrete » du moteur porte `aVoir` ;
  // la phrase est celle de la planche K1-2 : « Ce calcul, ton professeur le
  // reverra avec toi. En attendant, continue sur les autres lignes. »)
  assert.match(corps("cheminApprends"), /const aVoir = arret && \(arret\.aVoir \|\| PARCOURS\.aVoirEnClasse\(ligneDe\(serie\.module\), serie\.niveau - 1\)\);/);
  assert.match(corps("cheminApprends"), /if \(aVoir\) morceaux\.push\(cadre\(phrase\(gras\(TEXTE_A_VOIR\), soude\(" En attendant, continue sur les autres lignes\."\)\)\)\);/);
  assert.match(page, /const TEXTE_A_VOIR = "Ce calcul, ton professeur le reverra avec toi\.";/);
  // Et la reprise annoncée est celle que le moteur a enregistrée (point 3).
  assert.match(corps("cheminApprends"), /const reprise = arret \? arret\.reprise : /);
  assert.doesNotMatch(corps("cheminApprends"), /suivreEntrainement/);
  // Ce que la relecture sans version faisait : F9 décalé, le 3e arrêt de F9-2 disparu.
  const f9 = Object.assign({vu: J}, vide(3), {b: [4, 0, 0], e: [plus(5), plus(7), null], ar: [0, 3 * 3 + 2, 0]});
  const avec = P.normaliserParcours({version: P.VERSION, modules: {F9: f9}}, {aujourdhui: J}).modules.F9;
  assert.equal(P.aVoirEnClasse(avec, 1), true);
});

// ------------------------------------------------------------------ 11.

test("11. Je m'entraîne encore : deux erreurs de suite rendent l'outil à manipuler (comme avant F4), un juste le rend au dessin", () => {
  const deux = [{juste: false, outil: "image"}, {juste: false, outil: "image"}];
  assert.equal(P.suivreEntrainement(deux, {genre: "rattrape", manip: true}).outil, "manip");
  assert.equal(P.suivreEntrainement(deux, {genre: "rattrape", manip: false}).outil, "image", "sans outil à manipuler : le dessin");
  assert.equal(P.suivreEntrainement([...deux, {juste: true, outil: "manip"}], {genre: "rattrape", manip: true}).outil, "image");
  assert.equal(P.suivreEntrainement([{juste: false, outil: "image"}], {genre: "rattrape", manip: true}).outil, "image", "une erreur : le dessin");
});

test("11. la reprise sans aide : le premier calcul a toujours son dessin (M4-1 « 0 × 8 » est remplacé par un calcul qui en a un)", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const corps = page.slice(page.indexOf("function commencerPratique("), page.indexOf("\n      }\n", page.indexOf("function commencerPratique(")));
  assert.match(corps, /if \(depart === PARCOURS\.REPRISE\.seul && !CORE\.aideDe\(calculs\[0\]\)\) \{/);
  assert.match(corps, /const i = calculs\.findIndex\(calcul => CORE\.aideDe\(calcul\)\);\s*if \(i > 0\) calculs\.unshift\(\.\.\.calculs\.splice\(i, 1\)\);/,
    "le premier calcul d'une reprise sans aide est choisi parmi ceux qui ont un dessin");
});

// ------------------------------------------------------------------ 12.

test("12. une série d'entraînement qui manque de calculs se reconstitue jusqu'au temps ou au 25e calcul (D8-1 en a 24)", async () => {
  assert.ok(CORE.genererSerie("D8-1", {graine: 7, genre: "entraine", total: 25}).length < 25);
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page, /function allongerSerie\(serie\)/);
  const avancer = page.slice(page.indexOf("function avancerSerie("), page.indexOf("function toutesFormesVues("));
  assert.match(avancer, /if \(!suivi\.fini\) allongerSerie\(serie\);/);
  const allonger = page.slice(page.indexOf("function allongerSerie("), page.indexOf("function toutesFormesVues("));
  assert.match(allonger, /: serie\.genre === "apprends" \? PARCOURS\.SEUILS\.apprends\.maximum : PARCOURS\.SEUILS\.entraine\.maximum;/);
  assert.match(allonger, /serie\.questions\.push\(/);
  // Et la page passe ses règles au moteur (point 3).
  assert.match(page, /manip: regles\.manip, toutesFormesVues: regles\.toutesFormesVues !== false, tempsFini: regles\.tempsFini === true/);
  // Et elle passe en lecture seule devant une copie plus récente (point 5).
  assert.match(page, /if \(pageAncienne \|\| verifierPageAncienne\(\)\) \{ renderRepere\(\); return; \}/);
  assert.match(page, /if \(pageAncienne\) return false;\s*return suiviActif\(\)/);
  assert.match(page, /repere\.textContent = "Page ancienne : recharge la page\.";/);
});

// ------------------------------------------------------------------ 13.

test("13. le compteur dit « N justes sur M » des M derniers calculs sans aide (6 au plus) : jamais « 6 justes sur 5 »", async () => {
  const six = [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 6}, () => ({juste: true, outil: "aucun"}))];
  const s = P.suivreEntrainement(six, {genre: "apprends", toutesFormesVues: false});
  assert.equal(s.reussi, false);
  assert.equal(s.justesDeSuite, 6);
  assert.equal(s.sur, 6, "sur les 6 derniers");
  const un = P.suivreEntrainement([{juste: true, outil: "aucun"}, {juste: false, outil: "aucun"}, {juste: true, outil: "image"}, {juste: true, outil: "aucun"}], {genre: "apprends", depart: 2});
  assert.deepEqual([un.justesDeSuite, un.sur], [2, 3], "2 justes sur 3 (le calcul au dessin ne compte pas)");
  for (let n = 0; n <= 12; n += 1) {
    const r = P.suivreEntrainement(Array.from({length: n}, (_, i) => ({juste: i % 4 !== 3, outil: "aucun"})), {genre: "apprends", depart: 2, toutesFormesVues: false});
    assert.ok(r.justesDeSuite <= r.sur && r.sur <= 6, `${r.justesDeSuite} sur ${r.sur}`);
  }
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  assert.match(page.slice(page.indexOf("function texteJustes("), page.indexOf("function majMomentApprends(")), /sur \$\{suivi\.sur\}/);
});

test("13. « Comment ça marche ? » dit 5 justes sur les 6 derniers, comme le texte de l'étape", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const notice = page.slice(page.indexOf("<b>J’apprends.</b>"), page.indexOf("</p>", page.indexOf("<b>J’apprends.</b>")));
  assert.match(notice, /5&nbsp;justes sur les 6&nbsp;derniers, sans aide/);
  assert.doesNotMatch(notice, /de suite/);
});

// --------------------------------------------------- la copie pour la page prof

test("la copie du moteur pour la page prof est identique", async () => {
  assert.equal(await lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
});
