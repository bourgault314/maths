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

test("1. le test de palier revérifie tout à la remise : déjà joué, commencé, ou au-delà du réglage → rien n'entre", () => {
  // Déjà joué (raté) : un second résultat ne fait rien entrer.
  const rate = P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 1, justes: 1, total: 3}, opts()).parcours;
  const second = P.appliquerTestPalier(rate, {palier: 1, justes: 12, total: 12}, opts());
  assert.equal(second.reussi, false, "le palier était déjà joué");
  assert.equal(second.entrees, 0, "aucun des 44 niveaux des bases n'entre (lot C2 : 41 avant)");
  assert.equal(P.compter(second.parcours, CARTE).entrees, 0);
  assert.equal(second.parcours.paliers[0], J, "le jour du premier test ne bouge pas");
  // Au-delà du réglage du professeur (les bases seulement) : un résultat de CM1 ne fait rien entrer.
  const cm1 = P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 2, justes: 12, total: 12}, opts(J, true, 1));
  assert.equal(cm1.entrees, 0, "aucun des 33 niveaux du CM1");
  assert.deepEqual(cm1.parcours.paliers, [null, null, null, null], "pas noté joué non plus");
  // Commencé (une compétence du palier jouée au test) : rien n'entre.
  const c = duPalier(1)[0];
  const commence = P.appliquerTest(ouvrir(P.creerParcours()), {module: c.module, marche: 0, niveaux: [{niveau: c.niveau, justes: 0, total: 2}]}, opts()).parcours;
  assert.equal(P.appliquerTestPalier(commence, {palier: 1, justes: 12, total: 12}, opts()).entrees, 0);
  // Une étape de séance refusée fait quand même avancer la séance (le test compte).
  assert.equal(second.parcours.seance.p[P.PLAN.tests], rate.seance.p[P.PLAN.tests] + 1);
  // Le cas normal ne change pas.
  assert.equal(P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 1, justes: 11, total: 12}, opts()).entrees, 44);
});

test("2. le test de palier ne passe pas par-dessus « à voir en classe » : le niveau qui attend et la suite de son module ne bougent pas", () => {
  // F9-1 (les bases) « à voir en classe » (3 arrêts), il attend jusqu'à J+5 ;
  // toutes les autres bases sont acquises. La séance propose le test du CM1.
  let p = basesAcquises((id, n) => id === "F9" && n === 1);
  p.modules.F9.ar[0] = 9;
  p.modules.F9.e[0] = plus(5);
  p = P.normaliserParcours(p, {aujourdhui: J});
  assert.equal(P.palierATester(p, CARTE, P.competenceCourante(p, CARTE, 4, J)), 2, "le test du CM1 est proposé");
  const r = P.appliquerTestPalier(ouvrir(p), {palier: 2, justes: 12, total: 12}, opts());
  assert.equal(r.reussi, true);
  assert.equal(r.parcours.modules.F9.b[1], 0, "F9-2 n'entre pas tant que F9-1 attend");
  assert.equal(r.parcours.modules.F9.b[0], 0);
  assert.equal(r.parcours.modules.F9.e[0], plus(5), "F9-1 attend toujours");
  assert.equal(r.entrees, duPalier(2).length - 1, "tout le reste du CM1 entre");
});

// ------------------------------------------------------------------- 3.

test("3. J'apprends : le moteur enregistre avec les règles de l'écran (pas d'outil à manipuler, formes à voir, temps passé)", () => {
  // M6-1 n'a pas d'outil à manipuler : la page commence au dessin.
  const reponses = [{juste: true, outil: "image"}, {juste: true, outil: "image"}, {juste: true, outil: "aucun"}, {juste: true, outil: "aucun"}];
  const ecran = P.suivreEntrainement(reponses, {genre: "apprends", manip: false, tempsFini: true});
  assert.equal(ecran.reprise, P.REPRISE.seul, "l'écran : « Sans aide → demain »");
  let p = P.normaliserParcours({version: P.VERSION, paliers: [plus(-30), plus(-30), plus(-30), plus(-30)], modules: {M6: Object.assign({vu: J}, vide(2), {f: [1, 0]})}});
  const r = P.appliquerSerie(ouvrir(p), {module: "M6", niveau: 1, genre: "apprends", reponses, manip: false, tempsFini: true}, opts());
  const arret = r.evenements.find(e => e.type === "arrete");
  assert.equal(arret.reprise, ecran.reprise, "le moteur enregistre ce que l'écran annonce");
  assert.equal(P.repriseDe(r.parcours.modules.M6, 0), P.REPRISE.seul);
  // Une forme obligatoire pas encore vue : pas appris à la fin du temps.
  const sept = [{juste: true, outil: "image"}, {juste: true, outil: "image"}, ...Array.from({length: 5}, () => ({juste: true, outil: "aucun"}))];
  const formes = P.appliquerSerie(ouvrir(p), {module: "M6", niveau: 1, genre: "apprends", reponses: sept, manip: false, toutesFormesVues: false, tempsFini: true}, opts());
  assert.equal(formes.verdict.reussi, false, "une forme reste à voir");
  assert.equal(formes.parcours.modules.M6.b[0], 0, "pas appris");
  assert.equal(P.arretsDe(formes.parcours.modules.M6, 0), 1, "arrêté : On continue demain");
  // Sans ces règles (le simulateur, les autres appels), rien ne change.
  assert.equal(P.appliquerSerie(ouvrir(p), {module: "M6", niveau: 1, genre: "apprends", reponses: sept}, opts()).verdict.reussi, true);
});

// ------------------------------------------------------------------- 5.

function stockage(depart = {}) {
  const cases = Object.assign({}, depart);
  return {cases, getItem: k => (k in cases ? cases[k] : null), setItem: (k, v) => { cases[k] = String(v); }, removeItem: k => { delete cases[k]; },
    get length() { return Object.keys(cases).length; }, key: i => Object.keys(cases)[i] || null};
}

// (Lot C2 : la page est en version 11 ; la copie « plus récente » est une 12.)
test("5. une page de version 10 n'écrit jamais par-dessus une copie de l'appareil plus récente (version 11) : lecture seule", () => {
  const v11 = JSON.stringify({version: P.VERSION + 1, epoque: 0, modules: {A1: {b: [4, 0, 0], ar: [0, 0, 0], neuf: [1, 2, 3]}}, paliers: [J, null, null, null], champNeuf: {x: 1}});
  const s = stockage({[P.CLE_STOCKAGE]: v11});
  assert.equal(P.versionEnAvance(s, ""), true, "la copie de l'appareil est plus récente que la page");
  assert.equal(P.sauver(s, P.creerParcours(), ""), false, "refusé");
  assert.equal(s.cases[P.CLE_STOCKAGE], v11, "la copie version 11 est intacte");
  // Une copie de la même version, ou plus ancienne : écrite comme avant.
  const s10 = stockage({[P.CLE_STOCKAGE]: JSON.stringify(P.creerParcours())});
  assert.equal(P.versionEnAvance(s10, ""), false);
  assert.equal(P.sauver(s10, P.creerParcours(), ""), true);
  const s9 = stockage({[P.CLE_STOCKAGE]: JSON.stringify({version: 9})});
  assert.equal(P.sauver(s9, P.creerParcours(), ""), true);
  assert.equal(JSON.parse(s9.cases[P.CLE_STOCKAGE]).version, 11);
  assert.equal(P.versionEnAvance(stockage(), ""), false, "rien sur l'appareil");
  assert.equal(P.versionEnAvance(stockage({[P.CLE_STOCKAGE]: "{abîmé"}), ""), false, "illisible : pas « plus récent »");
});

// ------------------------------------------------------------------- 6.

test("6. un jour de retour n'est gardé qu'entre aujourd'hui et aujourd'hui + 7 jours ; au-delà, ramené à aujourd'hui + 7 (relecture et fusion)", () => {
  const brut = e => ({version: P.VERSION, modules: {A1: Object.assign({vu: J}, vide(3), {ar: [9, 9, 0], e: e, f: [1, 0, 0]})}});
  const lu = P.normaliserParcours(brut(["2031-01-01", plus(4), null]), {aujourdhui: J});
  assert.equal(lu.modules.A1.e[0], plus(7), "une échéance dans des années : aujourd'hui + 7");
  assert.equal(lu.modules.A1.e[1], plus(4), "dans la semaine : gardée");
  assert.equal(P.normaliserParcours(brut([plus(7), null, null]), {aujourdhui: J}).modules.A1.e[0], plus(7));
  assert.equal(P.normaliserParcours(brut([plus(8), null, null]), {aujourdhui: J}).modules.A1.e[0], plus(7));
  // Passée : l'attente est finie, elle reste finie (jamais repoussée).
  assert.equal(P.normaliserParcours(brut([plus(-3), null, null]), {aujourdhui: J}).modules.A1.e[0], plus(-3));
  // La fusion : la mauvaise horloge d'un appareil ne repousse pas le niveau.
  const a = brut(["2031-01-01", null, null]);
  const b = brut([plus(2), null, null]);
  for (const f of [P.fusionner(a, b, {aujourdhui: J}), P.fusionner(b, a, {aujourdhui: J})]) {
    assert.ok(f.modules.A1.e[0] <= plus(7), `fusion : ${f.modules.A1.e[0]}`);
  }
  // Le niveau revient au plus tard dans 7 jours.
  const p = Object.assign(lu, {paliers: [plus(-30), plus(-30), plus(-30), plus(-30)]});
  assert.notEqual(P.competenceCourante(p, CARTE, 4, plus(6)).module, "A1");
  assert.deepEqual(P.competenceCourante(p, CARTE, 4, plus(7)), {module: "A1", niveau: 1});
});

// ------------------------------------------------------------------- 7.

test("7. le moteur suit la borne du serveur : une version au-delà de 999 n'est jamais relue comme une version ancienne", () => {
  const f6 = Object.assign({vu: J, ok: J}, vide(4), {b: [4, 3, 0, 5], e: [plus(3), plus(2), null, plus(4)], a: [1, 1, 0, 1]});
  const lu = P.normaliserParcours({version: 1500, modules: {F6: f6}, seance: {jour: J, etape: 1, n: 0, p: [1, 0, 0, 2, 0, 10, 1, 0, 0, 0, 0], j: [0, 0, 0, 0, 60, 0]}}, {aujourdhui: J});
  assert.deepEqual(lu.modules.F6.b, [4, 3, 0, 5], "F6 et F9 ne sont pas décalés");
  assert.equal(lu.modules.F6.ok, J);
  assert.equal(lu.seance.p[P.PLAN.ouverte], 1, "le plan ouvert n'est pas refermé");
  const s = {getItem: () => JSON.stringify({version: 1500}), setItem: () => { throw new Error("écrit"); }};
  assert.equal(P.versionEnAvance(s, ""), true, "au-delà de 999 : plus récente que la page, lecture seule");
});

// ------------------------------------------------------------------- 8.

test("8. après un test de palier raté aujourd'hui, l'étape qui suit est garantie : la séance ne finit pas sur lui", () => {
  // Les bases réussies au test de palier, puis un premier apprentissage :
  // plus rien n'est garanti. À la 5e minute, le test du CM1 tient (6 min).
  let p = P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 1, justes: 12, total: 12}, opts()).parcours;
  p.seance.p[P.PLAN.commences] = 1;
  p = P.noterTemps(p, 5 * 60);
  assert.deepEqual(types(p)[0], "palier");
  // Il dure quatre minutes, et il est raté.
  p = P.noterTemps(p, 4 * 60);
  const r = P.appliquerTestPalier(p, {palier: 2, justes: 1, total: 3}, opts());
  assert.equal(r.finie, false, "la séance ne finit pas sur le test de palier raté");
  assert.equal(types(r.parcours)[0], "test", "le test du premier module du CM1, garanti");
  // Raté lui aussi : le J'apprends qui suit est garanti (règle du lot F4), et s'arrête au temps.
  const premier = P.competenceCourante(r.parcours, CARTE, 4, J);
  const t = P.appliquerTest(r.parcours, {module: premier.module, marche: 0, niveaux: [{niveau: premier.niveau, justes: 0, total: 2}]}, opts());
  assert.equal(t.finie, false);
  assert.equal(types(t.parcours)[0], "apprends");
  // Joué un autre jour : rien de garanti (la règle du temps, comme avant).
  let q = P.appliquerTestPalier(ouvrir(P.creerParcours()), {palier: 1, justes: 12, total: 12}, opts()).parcours;
  q.paliers[1] = plus(-1);
  q.seance.p[P.PLAN.commences] = 1;
  q = P.noterTemps(q, 9 * 60);
  assert.deepEqual(types(q), [], "un test de module ne commence pas à 9 minutes");
});

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

test("10. la page relit une ligne AVEC la version (F9-2 garde son 3e arrêt) et tire sa phrase de l'attente de demain", async () => {
  const page = await lire("../outils/calcul_mental/defi_calcul_modules.html");
  const corps = nom => page.slice(page.indexOf(`function ${nom}(`), page.indexOf("\n      }\n", page.indexOf(`function ${nom}(`)));
  assert.match(corps("ligneDe"), /version: PARCOURS\.VERSION/);
  assert.match(corps("cheminApprends"), /const attend = PARCOURS\.enAttente\(l, serie\.niveau - 1, PARCOURS\.ajouterJours\(jourCourant\(\), 1\)\);/);
  assert.match(corps("cheminApprends"), /attend \? TEXTE_A_VOIR : TEXTE_A_VOIR_REVIENT/);
  assert.match(page, /const TEXTE_A_VOIR_REVIENT = "Ce niveau, ton professeur va le revoir avec toi\.";/);
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

test("13. les jours de la semaine : coché, tout jour où l'élève a fait au moins un calcul, séance finie ou non", () => {
  const lundi = P.lundiDe(J);
  let p = P.normaliserParcours({version: P.VERSION, paliers: [plus(-30), plus(-30), plus(-30), plus(-30)]}, {aujourdhui: J});
  p = ouvrir(p, lundi);
  p = P.appliquerTest(p, {module: "A1", marche: 0, niveaux: [{niveau: 1, justes: 0, total: 2}]}, opts(lundi)).parcours;
  assert.deepEqual(p.seances, [], "aucune séance finie");
  const s = P.semaineEleve(p, CARTE, plus(2, lundi));
  assert.equal(s.jours[0].fait, true, "lundi : travaillé, coché");
  assert.equal(s.soirs, 1, "1 jour cette semaine");
  assert.equal(s.montrer, true);
  assert.equal(s.jours[1].fait, false);
});

// --------------------------------------------------- la copie pour la page prof

test("la copie du moteur pour la page prof est identique", async () => {
  assert.equal(await lire("../_serveur/public/prof/defi_calcul_mon_parcours.js"), await lire("../outils/calcul_mental/defi_calcul_mon_parcours.js"));
});
