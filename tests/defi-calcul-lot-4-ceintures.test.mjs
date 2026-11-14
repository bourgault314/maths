// Défi calcul, lot 4 « les ceintures » (14/11/2026, choix de Gwenaël) : une
// ceinture par palier fini (toutes ses compétences CONSTRUITES solides ★, en
// même temps) — jaune, orange, verte, bleue ; tout le monde part en blanche.
// Elles se gagnent dans l'ordre et ne se reprennent jamais. Des barrettes en
// chemin : une par quart du palier suivant rendu solide un jour (3 au plus).
// La ceinture se remet à la fin de l'étape qui la fait gagner (écran à part,
// puis le bilan) ; elle se voit sur la porte de Mon parcours, dans les
// onglets des paliers, dans la tuile de Mon espace et sur la page prof.

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const P = require("../outils/calcul_mental/defi_calcul_mon_parcours.js");
const CORE = require("../outils/calcul_mental/defi_calcul_core.js");
const CARTE = CORE.carte();
const lire = chemin => readFileSync(new URL(chemin, import.meta.url), "utf8");
const PAGE = lire("../outils/calcul_mental/defi_calcul_modules.html");
const CSS = lire("../outils/calcul_mental/defi_calcul.css");
const APPLIS = lire("../_serveur/public/lib/applis.php");
const PROF = lire("../_serveur/public/prof/index.php");
const ESPACE = lire("../_serveur/public/index.php");
const J = "2026-11-13";

// Les compétences construites, avec leur palier, dans l'ordre de la carte.
const COMPETENCES = P.parcoursConstruit(CARTE).map(c => Object.assign(c, {palier: P.palierDe(CARTE, c.module, c.niveau)}));
const duPalier = n => COMPETENCES.filter(c => c.palier === n);

// Un parcours où `regle(c, rang dans le palier)` donne {b, s} (ou rien) pour
// chaque compétence construite.
function parcoursOu(regle, ceintures = [null, null, null, null]) {
  const brut = {version: P.VERSION, modules: {}, ceintures};
  const rangs = {};
  COMPETENCES.forEach(c => {
    rangs[c.palier] = (rangs[c.palier] || 0) + 1;
    const k = P.NIVEAUX[c.module];
    const m = brut.modules[c.module] || (brut.modules[c.module] = {vu: "2026-11-12", b: Array(k).fill(0), e: Array(k).fill(null), d: Array(k).fill(null), s: Array(k).fill(null), a: Array(k).fill(0)});
    const r = regle(c, rangs[c.palier]);
    if (!r || !r.b) return;
    m.b[c.niveau - 1] = r.b;
    m.e[c.niveau - 1] = r.e || "2026-11-20";
    m.d[c.niveau - 1] = "2026-10-20";
    m.s[c.niveau - 1] = r.s === undefined ? (r.b >= 4 ? "2026-10-28" : null) : r.s;
    m.a[c.niveau - 1] = 1;
  });
  return P.normaliserParcours(brut);
}

test("les quatre paliers ont des compétences construites ; les ceintures et leurs couleurs viennent du noyau", () => {
  [1, 2, 3, 4].forEach(n => assert.ok(duPalier(n).length > 0, `palier ${n}`));
  assert.deepEqual(CORE.CEINTURES.map(c => c.nom), ["Ceinture blanche", "Ceinture jaune", "Ceinture orange", "Ceinture verte", "Ceinture bleue"]);
  assert.deepEqual(CORE.CEINTURES.map(c => c.court), ["blanche", "jaune", "orange", "verte", "bleue"]);
  // Les couleurs de maths&go (le dégradé du site, le vert de l'appli).
  assert.deepEqual(CORE.CEINTURES.map(c => c.couleur), ["#ffffff", "#f9bf3b", "#f58220", "#147447", "#0b67b2"]);
  assert.deepEqual(P.SEUILS.ceintures, {nombre: 4, barrettes: 3});
});

test("format : version 8, `ceintures` à quatre places (une date ou null), et rien d'autre", () => {
  assert.equal(P.VERSION, 8);
  assert.deepEqual(P.creerParcours().ceintures, [null, null, null, null]);
  const lu = P.normaliserParcours({version: 8, ceintures: ["2026-11-02", "x", 4, "2026-13-40", "2026-11-09"]});
  assert.deepEqual(lu.ceintures, ["2026-11-02", null, null, null], "une date par place, le reste null, quatre places");
  assert.deepEqual(P.normaliserParcours({version: 7}).ceintures, [null, null, null, null], "une progression de version 7 se relit sans ceinture");
  assert.deepEqual(P.normaliserParcours({version: 8, ceintures: "jaune"}).ceintures, [null, null, null, null]);
  assert.deepEqual(P.normaliserParcours(lu), lu, "idempotente");
});

test("palier fini = toutes ses compétences construites solides ★ EN MÊME TEMPS ; la ceinture se gagne à la fin de Mes calculs du jour", () => {
  const dernier = duPalier(1).length;
  // Tout le palier 1 solide sauf la dernière compétence, en boîte 3, due aujourd'hui.
  let p = parcoursOu((c, r) => (c.palier === 1 ? (r === dernier ? {b: 3, e: J, s: null} : {b: 4}) : null));
  assert.deepEqual(P.etatCeintures(p, CARTE).porte, 0);
  assert.equal(P.etatCeintures(p, CARTE).prochaine, 1);
  assert.equal(P.etatCeintures(p, CARTE).total - P.etatCeintures(p, CARTE).solides, 1, "encore 1 ★");
  const c = duPalier(1)[dernier - 1];
  p = P.ouvrirSeance(p, CARTE, {aujourdhui: J});
  p = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: true, ms: 2000, type: P.typeDe(CARTE, c.module, c.niveau)}, {aujourdhui: J}).parcours;
  assert.deepEqual(p.ceintures, [null, null, null, null], "pas encore : la remise est à la fin de l'étape");
  const fin = P.terminerCalculsDuJour(p, {aujourdhui: J, carte: CARTE});
  assert.deepEqual(fin.ceintures, [1], "la ceinture jaune");
  assert.deepEqual(fin.parcours.ceintures, [J, null, null, null]);
  assert.equal(P.etatCeintures(fin.parcours, CARTE).porte, 1);
  // Une seconde étape ne la redonne pas.
  assert.deepEqual(P.terminerCalculsDuJour(fin.parcours, {aujourdhui: J, carte: CARTE}).ceintures, []);
});

test("une seule compétence pas solide (en route ou à revoir) : pas de ceinture", () => {
  for (const b of [0, 1, 2, 3]) {
    const p = parcoursOu((c, r) => (c.palier === 1 ? (r === 5 ? (b ? {b} : null) : {b: 5}) : null));
    const copie = JSON.parse(JSON.stringify(p));
    assert.deepEqual(P.terminerCalculsDuJour(copie, {aujourdhui: J, carte: CARTE}).ceintures, [], `boîte ${b}`);
  }
  // Sans carte (un appel d'un test ancien), rien ne se donne.
  const tout = parcoursOu(c => (c.palier === 1 ? {b: 4} : null));
  assert.deepEqual(P.terminerCalculsDuJour(tout, {aujourdhui: J}).ceintures, []);
  assert.deepEqual(P.terminerCalculsDuJour(tout, {aujourdhui: J, carte: CARTE}).ceintures, [1]);
});

test("le test d'entrée peut finir un palier (les marches en dessous entrent solides)", () => {
  // Tout le palier 1 solide sauf les niveaux d'un module, pas entrés ; le
  // test prouve ses marches jusqu'à la dernière du palier 1, plus une au-dessus.
  const module = COMPETENCES.find(c => c.palier === 1 && COMPETENCES.some(d => d.module === c.module && d.palier === 2)).module;
  const niveaux1 = COMPETENCES.filter(c => c.module === module && c.palier === 1).map(c => c.niveau);
  const marche = Math.max(...niveaux1) + 1;
  const p = parcoursOu(c => (c.palier === 1 && c.module !== module ? {b: 4} : null));
  const niveaux = Array.from({length: marche}, (_, i) => ({niveau: i + 1, justes: 3, total: 3}));
  const r = P.appliquerTest(p, {module, marche, niveaux}, {aujourdhui: J, carte: CARTE});
  assert.deepEqual(r.ceintures, [1], `${module} : marches 1 à ${marche - 1} solides, la ${marche} en boîte 3`);
});

test("dans l'ordre : le CM1 fini avant les bases attend ; les deux viennent ensemble", () => {
  const dernier = duPalier(1).length;
  const p = parcoursOu((c, r) => (c.palier === 2 ? {b: 4} : c.palier === 1 ? (r === dernier ? {b: 3} : {b: 4}) : null));
  assert.deepEqual(P.terminerCalculsDuJour(JSON.parse(JSON.stringify(p)), {aujourdhui: J, carte: CARTE}).ceintures, [], "l'orange attend la jaune");
  const tout = parcoursOu(c => (c.palier <= 2 ? {b: 4} : null));
  const r = P.terminerCalculsDuJour(tout, {aujourdhui: J, carte: CARTE});
  assert.deepEqual(r.ceintures, [1, 2]);
  assert.deepEqual(r.parcours.ceintures, [J, J, null, null]);
});

// Correctif de la relecture Codex (14/11/2026) : une classe ramenée aux bases
// ne reçoit pas l'orange, même avec le CM1 déjà solide.
test("jamais au-delà du palier réglé par le professeur, aux trois endroits où une ceinture se gagne", () => {
  const tout = () => parcoursOu(c => (c.palier <= 2 ? {b: 4} : null));
  const r1 = P.terminerCalculsDuJour(tout(), {aujourdhui: J, carte: CARTE, palier: 1});
  assert.deepEqual(r1.ceintures, [1], "jusqu'aux bases : la jaune seulement");
  assert.deepEqual(r1.parcours.ceintures, [J, null, null, null]);
  // Le professeur relève le palier : l'orange vient à la première étape finie.
  const r2 = P.terminerCalculsDuJour(r1.parcours, {aujourdhui: "2026-11-14", carte: CARTE, palier: 2});
  assert.deepEqual(r2.ceintures, [2]);
  assert.deepEqual(r2.parcours.ceintures, [J, "2026-11-14", null, null]);
  // Sans palier donné : tous les paliers (comme avant).
  assert.deepEqual(P.terminerCalculsDuJour(tout(), {aujourdhui: J, carte: CARTE}).ceintures, [1, 2]);
  // Une valeur abîmée vaut « tous les paliers », comme pour la séance.
  assert.deepEqual(P.terminerCalculsDuJour(tout(), {aujourdhui: J, carte: CARTE, palier: "2"}).ceintures, [1, 2]);
  // Le test d'entrée et la fin d'un apprentissage suivent la même borne.
  const module = COMPETENCES.find(c => c.palier === 1).module;
  const test1 = P.appliquerTest(tout(), {module, marche: 1, niveaux: [{niveau: 1, justes: 3, total: 3}]}, {aujourdhui: J, carte: CARTE, palier: 1});
  assert.deepEqual(test1.ceintures, [1]);
  const c = duPalier(2)[0];
  const serie = P.appliquerSerie(tout(), {module: c.module, niveau: c.niveau, genre: "apprends", reponses: Array(5).fill({juste: true, outil: "aucun"})}, {aujourdhui: J, carte: CARTE, palier: 1});
  assert.deepEqual(serie.ceintures, [1]);
  assert.equal(serie.parcours.ceintures[1], null, "pas d'orange");
});

test("gagnée = gardée : un niveau redevenu « à revoir », une carte qui grandit, une fusion ne la reprennent pas", () => {
  const tout = parcoursOu(c => (c.palier === 1 ? {b: 4} : null));
  let p = P.terminerCalculsDuJour(tout, {aujourdhui: J, carte: CARTE}).parcours;
  const c = duPalier(1)[0];
  // Raté dans Mes calculs du jour : la compétence redescend.
  p.modules[c.module].e[c.niveau - 1] = "2026-11-14";
  p = P.appliquerRetour(p, {module: c.module, niveau: c.niveau, juste: false, ms: 2000, type: "P"}, {aujourdhui: "2026-11-14"}).parcours;
  assert.ok(p.modules[c.module].b[c.niveau - 1] < 4, "elle n'est plus solide");
  assert.deepEqual(p.ceintures, [J, null, null, null], "la ceinture reste");
  assert.equal(P.etatCeintures(p, CARTE).porte, 1);
  // Un module de plus devient construit dans le palier 1 (lot 7) : rien ne se reprend.
  const plusGrande = {modules: CARTE.modules.map(f => (f.paliers && f.paliers.includes(1) && !f.construit ? Object.assign({}, f, {construit: true}) : f)), ordre: CARTE.ordre};
  assert.equal(P.etatCeintures(p, plusGrande).porte, 1);
  // Fusion : gagnée d'un côté, gagnée des deux ; le jour le plus ancien.
  const autre = P.creerParcours();
  autre.ceintures = ["2026-11-10", null, null, null];
  assert.deepEqual(P.fusionner(p, autre).ceintures, ["2026-11-10", null, null, null]);
  assert.deepEqual(P.fusionner(autre, p).ceintures, ["2026-11-10", null, null, null], "dans les deux sens");
  assert.deepEqual(P.fusionner(P.creerParcours(), p).ceintures, [J, null, null, null], "une copie sans ceinture n'efface rien");
  // « Recommencer à zéro » repart en blanche.
  assert.deepEqual(P.remettreAZero(p).ceintures, [null, null, null, null]);
});

test("les barrettes : une par quart du palier suivant rendu solide UN JOUR (3 au plus), et elles ne se perdent pas", () => {
  const total = duPalier(1).length;
  const avec = n => parcoursOu((c, r) => (c.palier === 1 && r <= n ? {b: 4} : null));
  const quart = Math.ceil(total / 4);
  assert.equal(P.etatCeintures(avec(quart - 1), CARTE).barrettes, 0);
  assert.equal(P.etatCeintures(avec(quart), CARTE).barrettes, 1);
  assert.equal(P.etatCeintures(avec(Math.ceil(total / 2)), CARTE).barrettes, 2);
  assert.equal(P.etatCeintures(avec(total - 1), CARTE).barrettes, 3, "jamais 4 : la quatrième, c'est la ceinture");
  // Une compétence solide un jour puis redescendue garde sa barrette.
  const redescendue = parcoursOu((c, r) => (c.palier === 1 && r <= quart ? (r === 1 ? {b: 3, s: "2026-11-01"} : {b: 4}) : null));
  assert.equal(P.etatCeintures(redescendue, CARTE).barrettes, 1);
  assert.equal(P.etatCeintures(redescendue, CARTE).solides, quart - 1, "« encore N ★ » compte ce qui est solide maintenant");
  // Après la jaune, les barrettes comptent le palier 2.
  const jaune = parcoursOu(c => (c.palier === 1 ? {b: 4} : null), ["2026-11-01", null, null, null]);
  const e = P.etatCeintures(jaune, CARTE);
  assert.deepEqual([e.porte, e.prochaine, e.barrettes, e.total], [1, 2, 0, duPalier(2).length]);
});

test("le palier réglé par le professeur : au-delà, rien à gagner ; « fini » quand sa dernière ceinture est gagnée", () => {
  const jaune = parcoursOu(c => (c.palier === 1 ? {b: 4} : c.palier === 2 ? {b: 4} : null), ["2026-11-01", null, null, null]);
  const e1 = P.etatCeintures(jaune, CARTE, 1);
  assert.deepEqual([e1.porte, e1.prochaine, e1.barrettes, e1.fini], [1, null, 0, true], "jusqu'aux bases : tout est fini");
  const e2 = P.etatCeintures(jaune, CARTE, 2);
  assert.deepEqual([e2.porte, e2.prochaine, e2.fini], [1, 2, false]);
  const bleue = P.etatCeintures(parcoursOu(c => ({b: 4}), ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]), CARTE);
  assert.deepEqual([bleue.porte, bleue.prochaine, bleue.fini], [4, null, true]);
});

test("resumeProf rend la ceinture (pour la page prof et la tuile), sans rien inventer d'un parcours abîmé", () => {
  const jaune = parcoursOu(c => (c.palier === 1 ? {b: 4} : null), ["2026-11-01", null, null, null]);
  const r = P.resumeProf(jaune, CARTE, J);
  assert.deepEqual(r.ceintures, {porte: 1, dates: ["2026-11-01", null, null, null], barrettes: 0, prochaine: 2, solides: 0, total: duPalier(2).length});
  assert.deepEqual(P.resumeProf(null, CARTE, J).ceintures.porte, 0);
  assert.deepEqual(P.resumeProf({ceintures: ["<b>", 3]}, CARTE, J).ceintures.dates, [null, null, null, null]);
});

test("le dessin : des nombres bornés, le titre échappé ; la version en éléments est la même, sans HTML", () => {
  const svg = CORE.dessinCeinture(2, {barrettes: 2, taille: 40, titre: "Ceinture orange"});
  assert.match(svg, /^<svg class="ceinture" viewBox="0 0 64 40" width="40" height="25" focusable="false" role="img" aria-label="Ceinture orange">/);
  assert.match(svg, /fill="#f58220"/);
  assert.equal((svg.match(/stroke="#ffffff"/g) || []).length, 2, "deux barrettes");
  assert.equal((CORE.dessinCeinture(1, {barrettes: 99}).match(/stroke="#ffffff"/g) || []).length, 3, "3 au plus");
  assert.match(CORE.dessinCeinture(99), /fill="#0b67b2"/, "au-delà : la bleue");
  assert.match(CORE.dessinCeinture(-3), /fill="#ffffff"/, "en dessous : la blanche");
  assert.match(CORE.dessinCeinture(2, {vide: true, barrettes: 3}), /stroke-dasharray="3 2.4"/);
  assert.doesNotMatch(CORE.dessinCeinture(2, {vide: true, barrettes: 3}), /#ffffff" stroke-width="1.6"/, "une ceinture pas gagnée n'a pas de barrette");
  assert.match(CORE.dessinCeinture(0, {titre: '"><script>'}), /aria-label="&quot;&gt;&lt;script&gt;"/);
  assert.match(CORE.dessinCeinture(0), /aria-hidden="true"/);
  // Un faux document : la même arborescence que le texte.
  const faux = {createElementNS: (ns, nom) => ({ns, nom, attributs: {}, enfants: [], setAttribute(cle, valeur) { this.attributs[cle] = valeur; }, appendChild(e) { this.enfants.push(e); }})};
  const serialiser = e => `<${e.nom}${Object.keys(e.attributs).map(k => ` ${k}="${String(e.attributs[k]).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`).join("")}${e.enfants.length ? `>${e.enfants.map(serialiser).join("")}</${e.nom}>` : "/>"}`;
  for (const [n, o] of [[2, {barrettes: 2, taille: 40, titre: "Ceinture orange"}], [0, {vide: true}], [4, {barrettes: 3, taille: 220}]]) {
    const element = CORE.elementCeinture(faux, n, o);
    assert.equal(element.ns, "http://www.w3.org/2000/svg");
    assert.equal(serialiser(element), CORE.dessinCeinture(n, o));
  }
});

test("la page : l'écran de la ceinture à la fin de l'étape, puis le bilan ; la barrette dans le bilan ; rien en mode professeur", () => {
  assert.match(PAGE, /<div id="result-ceinture" class="dc-ceinture-gagnee" hidden>/);
  assert.match(PAGE, /<p class="eyebrow">Nouvelle ceinture<\/p>/);
  assert.match(PAGE, /<button id="ceinture-suite" class="primary" type="button">Continuer&nbsp;→<\/button>/);
  const fin = PAGE.slice(PAGE.indexOf("      function finish() {"), PAGE.indexOf("      function suiteDuBilan("));
  assert.match(fin, /const gagnees = MODE_PROF \? \[\] : \(suivi\.ceintures \|\| \[\]\);/);
  assert.match(fin, /if \(gagnees\.length\) \{ montrerCeintures\(gagnees, \(\) => suiteDuBilan\(serie, suivi, sur\)\); return; \}/);
  assert.match(fin, /state\.barretteGagnee = avant && apres && !gagnees\.length && apres\.porte === avant\.porte && apres\.barrettes > avant\.barrettes \? apres : null;/);
  assert.match(PAGE, /state\.ceinturesAvant = MODE_PROF \? null : etatCeintures\(\);/);
  assert.match(PAGE, /`Tous les calculs \$\{DU_PALIER\[n\]\} sont solides\\u00a0★`/);
  assert.match(PAGE, /"Tu as fini Défi calcul !" : "Tu as fini tout ce que ton professeur a ouvert\."/);
  // La barrette : dans les trois bilans où une compétence devient solide.
  assert.equal((PAGE.match(/\.\.\.feteBarrette\(\)/g) || []).length, 3);
  // L'écran se cache dès qu'un autre bilan se pose.
  assert.equal((PAGE.match(/\$\("result-ceinture"\)\.hidden = true;/g) || []).length, 3);
  // Le dessin passe par des éléments, jamais par innerHTML.
  assert.doesNotMatch(PAGE, /innerHTML = CORE\.dessinCeinture/);
  assert.ok((PAGE.match(/CORE\.elementCeinture\(document, /g) || []).length >= 6);
  // « Comment ça marche ? » : une phrase.
  assert.match(PAGE, /<p><b>Mes ceintures\.<\/b> Quand tous les calculs d’un palier sont solides&nbsp;★, je gagne sa ceinture&nbsp;: jaune, orange, verte, puis bleue\. En chemin, une barrette à chaque quart du palier\.<\/p>/);
});

test("Mon parcours compte sur ce qui est construit ; chaque onglet a sa ceinture ; une ligne de ceinture sous le titre du palier", () => {
  assert.match(PAGE, /const CARTE_CONSTRUITE = Object\.freeze\(\{modules: CARTE\.modules\.filter\(fiche => fiche\.construit\), ordre: CARTE\.ordre\}\);/);
  const paliers = PAGE.slice(PAGE.indexOf("      function renderParcoursPaliers("), PAGE.indexOf("      function montrerModuleEnCours("));
  assert.match(paliers, /const compte = PARCOURS\.compter\(parcours, CARTE_CONSTRUITE\);/);
  assert.match(paliers, /CORE\.elementCeinture\(document, palier\.palier, \{vide: !gagnee, taille: 30\}\)/);
  assert.match(paliers, /\$\("parcours-ceinture"\)\.replaceChildren\(\.\.\.ligneCeinture\(palier\.n, ceintures\)\);/);
  assert.match(PAGE, /<p id="parcours-ceinture" class="dc-pceinture"><\/p>/);
  // La ligne garde sa hauteur d'un palier à l'autre (rien ne bouge).
  assert.match(CSS, /\.dc-pceinture \{ display: flex; align-items: center; gap: 8px; min-height: 30px;/);
  // Les comptes : palier 3 sur ses 22 compétences construites, pas sur 42.
  const compte = P.compter(P.creerParcours(), {modules: CARTE.modules.filter(f => f.construit), ordre: CARTE.ordre});
  assert.deepEqual(compte.paliers.map(p => p.total), [1, 2, 3, 4].map(n => duPalier(n).length));
});

test("le serveur : `ceintures` déclarée, version_min 8 ; la tuile et la page prof dessinent sans HTML", () => {
  const bloc = APPLIS.slice(APPLIS.indexOf("'defi-calcul' => ["), APPLIS.indexOf("'automatismes' => ["));
  assert.match(bloc, /'rouges', 'minutes', 'jours', 'numero', 'ceintures'\],/);
  assert.match(bloc, /'version_min' => 8,/);
  assert.match(ESPACE, /dessin\.replaceChildren\(window\.MATHSGO_DEFI_CALCUL_CORE\.elementCeinture\(document, n, \{barrettes, taille: 34\}\)\);/);
  assert.match(PROF, /dessin\.replaceChildren\(CALCUL_CORE\.elementCeinture\(document, porte, \{barrettes, taille: 34\}\)\);/);
  assert.doesNotMatch(ESPACE + PROF, /innerHTML[^\n]*Ceinture/);
  assert.match(PROF, /<th class="large"><button type="button" data-tri="ceinture">Ceinture<\/button><\/th>/);
});
