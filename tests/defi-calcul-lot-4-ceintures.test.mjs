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
// Lot F4 : ces tests suivent le parcours module par module — les tests de
// palier y sont déjà joués (tests/defi-calcul-lot-F4.test.mjs les joue).
const sansTestDePalier = p => Object.assign(p, {paliers: ["2026-01-01", "2026-01-01", "2026-01-01", "2026-01-01"]});
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

test("le palier réglé par le professeur : au-delà, rien à gagner ; « fini » quand sa dernière ceinture est gagnée", () => {
  // Lot K1b : six étages (le CP, le CE1, le CE2, le CM1, le CM2, vers la 6e), six ceintures à gagner.
  const jaune = parcoursOu(c => (c.palier === 1 ? {b: 4} : c.palier === 2 ? {b: 4} : null), ["2026-11-01", null, null, null, null, null]);
  const e1 = P.etatCeintures(jaune, CARTE, 1);
  assert.deepEqual([e1.porte, e1.prochaine, e1.barrettes, e1.fini], [1, null, 0, true], "jusqu'au CP : tout est fini");
  const e2 = P.etatCeintures(jaune, CARTE, 2);
  assert.deepEqual([e2.porte, e2.prochaine, e2.fini], [1, 2, false]);
  const bleue = P.etatCeintures(parcoursOu(c => ({b: 4}), ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"]), CARTE);
  assert.deepEqual([bleue.porte, bleue.prochaine, bleue.fini], [6, null, true]);
  // Quatre ceintures sur six, réglé « tout » : la cinquième est à gagner ; réglé jusqu'au CM1, tout est fini.
  const orange = parcoursOu(c => ({b: 4}), ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", null, null]);
  const e6 = P.etatCeintures(orange, CARTE);
  assert.deepEqual([e6.porte, e6.prochaine, e6.fini], [4, 5, false]);
  const e4 = P.etatCeintures(orange, CARTE, 4);
  assert.deepEqual([e4.porte, e4.prochaine, e4.fini], [4, null, true]);
});

test("le dessin : des nombres bornés, le titre échappé ; la version en éléments est la même, sans HTML", () => {
  // Lot K1b : sept ceintures — 0 blanche, 1 blanche-jaune (le CP), 2 jaune (le CE1), 3 jaune-orange
  // (le CE2), 4 orange (le CM1), 5 verte (le CM2), 6 bleue (vers la 6e). L'orange a le numéro 4 (2 avant).
  assert.deepEqual(CORE.CEINTURES.map(c => c.court), ["blanche", "blanche-jaune", "jaune", "jaune-orange", "orange", "verte", "bleue"]);
  const svg = CORE.dessinCeinture(4, {barrettes: 2, taille: 40, titre: "Ceinture orange"});
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
  for (const [n, o] of [[4, {barrettes: 2, taille: 40, titre: "Ceinture orange"}], [0, {vide: true}], [6, {barrettes: 3, taille: 220}],
    [1, {taille: 64, titre: "Ceinture blanche-jaune"}], [3, {vide: true}], [3, {rempli: 2}], [1, {vide: true, taille: 30}]]) {
    const element = CORE.elementCeinture(faux, n, o);
    assert.equal(element.ns, "http://www.w3.org/2000/svg");
    assert.equal(serialiser(element), CORE.dessinCeinture(n, o));
  }
});

test("la page : l'écran de la ceinture à la fin de l'étape, puis le bilan ; rien en mode professeur (lot K1 : sans barrette)", () => {
  assert.match(PAGE, /<div id="result-ceinture" class="dc-ceinture-gagnee" hidden>\s*<p class="eyebrow">Toutes les étoiles sont gagnées<\/p>/);
  const fin = PAGE.slice(PAGE.indexOf("      function finish() {"), PAGE.indexOf("      function suiteDuBilan("));
  assert.match(fin, /const gagnees = MODE_PROF \? \[\] : \(suivi\.ceintures \|\| \[\]\);/);
  // (Lot P1 : « Tente toute la ceinture » n'existe plus — la ceinture est
  // toujours suivie du bilan de l'étape.)
  assert.match(fin, /if \(gagnees\.length\) \{ montrerCeintures\(gagnees, bilan\); return; \}/);
  const montrer = PAGE.slice(PAGE.indexOf("      function montrerCeintures("), PAGE.indexOf("\n      }\n", PAGE.indexOf("      function montrerCeintures(")));
  assert.match(montrer, /\$\("ceinture-titre"\)\.textContent = soude\(`\$\{nomCeinture\(n\)\} !`\);/);
  // (Lot P1, planche P1-6 : tout est ouvert — plus de « … s'ouvre ».)
  assert.match(montrer, /soude\(`Tu as gagné les \$\{total\} étoiles\.`\)/);
  assert.match(montrer, /"Tu as fini Défi calcul !" : "Tu as fini tout ce que ton professeur a ouvert\."/);
  assert.match(montrer, /boutons\.push\(\["Ceinture suivante", "primary"/);
  assert.match(montrer, /boutons\.push\(\["La carte", suivante \? "secondary" : "primary"/);
  // Plus de barrette (lot K1 : la ceinture se remplit quart par quart).
  ["feteBarrette", "barretteGagnee", "ceinturesAvant", "Nouvelle ceinture"].forEach(mot => assert.ok(!PAGE.includes(mot), mot));
  // L'écran se cache dès qu'un autre bilan se pose.
  assert.ok((PAGE.match(/\$\("result-ceinture"\)\.hidden = true;/g) || []).length >= 2);
  // Le dessin passe par des éléments, jamais par innerHTML.
  assert.doesNotMatch(PAGE, /innerHTML = CORE\.dessinCeinture/);
  assert.ok((PAGE.match(/CORE\.elementCeinture\(document, /g) || []).length >= 5);
  // « Comment ça marche ? » : la phrase validée le 25/11 ; lot P1 (planche
  // P1-9 A, choix du 27/11) : tout est ouvert.
  assert.match(PAGE, /<p><b>Mes ceintures\.<\/b> Tout est ouvert\. Une ceinture est à moi quand j’ai toutes ses étoiles\. Six ceintures, de la blanche-jaune à la bleue, à gagner dans l’ordre que je veux\.<\/p>/);
});

test("compter : un palier se compte sur ce qui est construit", () => {
  // Les comptes : palier 3 sur ses compétences construites, pas sur toutes.
  const compte = P.compter(sansTestDePalier(P.creerParcours()), {modules: CARTE.modules.filter(f => f.construit), ordre: CARTE.ordre});
  assert.deepEqual(compte.paliers.map(p => p.total), [1, 2, 3, 4, 5, 6].map(n => duPalier(n).length));
  assert.deepEqual(compte.paliers.map(p => p.total), [14, 20, 19, 33, 43, 22], "lot K1b : six étages");
});
