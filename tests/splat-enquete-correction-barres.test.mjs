/* SPLAT! Enquête — lots G1 « la correction en barres » et G2 « le générateur sait tout faire »
   (29/09/2026, remarques 23 à 28 du monde 3).
   Ces tests exécutent les fonctions de outils/splat.html telles quelles (extraites du fichier).
   1. RÈGLE ABSOLUE : aucune carte existante ne change. Les 30 adresses des livrets (fiches 10 à
      24 et 10d à 24d depuis le lot 2 du 30/09/2026, dans _sources/livret-splat-enquete/render.py) sont rejouées
      comme la page le fait (genInvestigate puis assignPositions, quatre cartes d'affilée) et
      comparées aux cartes IMPRIMÉES dans les livrets en ligne (cartes.json, relu par le test des
      livrets) ; le nombre de tirages au hasard est épinglé lui aussi — avec les nouveaux réglages
      éteints, explicitement.
   2. Le modèle de la correction (enqueteBarresModele) : le dessin se choisit d'après la tache
      commune aux deux indices — une référence, une chaîne, « je complète », l'unité commune, deux
      taches réunies — ; les mots dans les cases, les calculs en phrases, la version lettre,
      « Je retourne », les jetons visibles, sans total, taches répétées, les indices composés.
   3. Le générateur (lot G2) : chaque type de schéma demandé est obtenu, les nouvelles phrases,
      l'ordre des phrases, les contraintes (plus petite tache ≥ 2, jamais deux égales, aucun
      nombre à sous-entendu) ; les anciennes valeurs structure=CHAIN/PIVOT/MIX gardent l'ancien
      tirage.
   4. Le dessin : longueurs justes (jamais de case élargie, le mot rapetisse puis l'initiale), le
      plateau de la correction imprimée à 22 mm, même échelle en ① et ②, colonne des noms
      mesurée, trois étapes à l'écran (deux sans total), blanc réparti entre les blocs. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const render = await readFile(new URL("../_sources/livret-splat-enquete/render.py", import.meta.url), "utf8");
const cartesJson = JSON.parse(await readFile(new URL("../_sources/livret-splat-enquete/cartes.json", import.meta.url), "utf8"));
const exempleHtml = await readFile(new URL("../_sources/livret-splat-enquete/exemple.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function ligne(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}
function bloc(debut, fin){
  const a = html.indexOf(debut);
  assert.notEqual(a, -1, debut);
  const b = html.indexOf(fin, a);
  return html.slice(a, b + fin.length);
}
const PALETTE = bloc("const INVESTIGATE_COLOR_PALETTE = [", "];");
const py = (nom) => (render.match(new RegExp(`^${nom} = "([^"]+)"`, "m")) || [])[1];

/* Le générateur et le placement des jetons, comme la page : genInvestigate(rng) puis
   assignPositions(card, rng) pour chaque carte de la série. */
const moteur = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const INVESTIGATE_REPEAT_MAX = ")}
  ${ligne("const INVESTIGATE_REPEAT_TACHES_MAX = ")}
  ${ligne("const SYS_NOMBRES_SOUS_ENTENDUS = ")}
  ${ligne("const ENQ_VOCABULAIRE = ")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function rFloat(")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("buildInvestigateColorMap")}
  ${fn("sysNombreSousEntendu")}
  ${fn("getTrayConfig")}
  ${fn("getNumberedSplatsLegacy")}
  ${fn("getNumberedSplats")}
  ${fn("sameSplats")}
  ${fn("numberedBeadRadius")}
  ${fn("numberedBeadRadiusDrawn")}
  ${fn("nudgeTokenFree")}
  ${fn("relocateNumberedTokensToFinalSplats")}
  ${fn("assignPositionsNumbered")}
  ${fn("genInvestigate")}
  let invTaskCountEl, invClueTypeEl, invStructure3El, invOpMulEl, invOpDivEl, invOpAddEl, invOpSubEl, invMaxAddEl,
      invVisibleMinEl, invVisibleMaxEl, invTotalMinEl, invTotalMaxEl, invNoTotalEl, invRepeatOnEl, invRepeatEl,
      invOrdreEl, invVocabEl, invComposeEl, invReuniesEl;
  const activityEl = { value: "C" };
  let investigatePaletteKeys = null;
  return (adresse, n) => {
    const q = new URLSearchParams(adresse);
    const g = (k, d) => q.has(k) ? q.get(k) : d;
    invTaskCountEl = { value: g("splats", "2") }; invClueTypeEl = { value: g("clues", "SENTENCE") }; invStructure3El = { value: g("structure", "MIX") };
    invOpMulEl = { checked: g("mul", "1") === "1" }; invOpDivEl = { checked: g("div", "1") === "1" };
    invOpAddEl = { checked: g("add", "1") === "1" }; invOpSubEl = { checked: g("sub", "1") === "1" };
    invMaxAddEl = { value: g("deltaMax", "20") }; invVisibleMinEl = { value: g("visibleMin", "0") }; invVisibleMaxEl = { value: g("visibleMax", "3") };
    invTotalMinEl = { value: g("totalMin", "20") }; invTotalMaxEl = { value: g("totalMax", "100") };
    invNoTotalEl = { checked: g("noTotal", "0") === "1" };
    invRepeatOnEl = { checked: q.has("repeat") && Number(q.get("repeat")) > 1 }; invRepeatEl = { value: g("repeat", "1") };
    /* lot G2 : les nouveaux réglages, lus comme la page les lit (absents = éteints) */
    invOrdreEl = { value: g("ordre", "HASARD") }; invVocabEl = { checked: g("vocab", "0") === "1" };
    invComposeEl = { checked: g("compose", "0") === "1" }; invReuniesEl = { checked: g("reunies", "0") === "1" };
    const rng = mulberry32(Number(q.get("seed")) | 0);
    let appels = 0;
    const compte = () => { appels++; return rng(); };
    const cartes = [];
    for(let i = 0; i < n; i++){ const c = genInvestigate(compte); assignPositionsNumbered(c, compte); cartes.push(c); }
    return { cartes, appels };
  };`)();

const empreinte = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex").slice(0, 16);

// --- 1. aucune carte existante ne change ------------------------------------------------------
/* Les 30 adresses de render.py (lot 2 du 30/09/2026, les six livrets) : E10-E24 (les trois livrets
   de base) et E10D-E24D (les trois livrets « Deuxième tour ») — chacune, ses quatre cartes
   imprimées dans les livrets (cartes.json). Avant le lot 2 : F10-F19, R20-R24, D10-D19, dont les
   graines ont été retriées (la progression en six livrets). */
const LIVRET_DE = (n, d) => (n <= 14 ? "additif" : n <= 19 ? "multiplicatif" : "rebondit") + (d ? "_tour2" : "");
const ADRESSES = [
  ...Array.from({ length: 15 }, (_, i) => [`E${10 + i}`, LIVRET_DE(10 + i, false)]),
  ...Array.from({ length: 15 }, (_, i) => [`E${10 + i}D`, LIVRET_DE(10 + i, true)])
];
function fichesDe(livret){ return cartesJson[livret].fiches; }
function carteImprimee(nom){
  const d = nom.endsWith("D"), n = Number(nom.slice(1, d ? -1 : undefined));
  const livret = LIVRET_DE(n, d), code = n + (d ? "d" : "");
  const cle = Object.keys(fichesDe(livret)).find((t) => t.startsWith(`Fiche ${code} —`));
  assert.ok(cle, `${nom} : fiche ${code} dans cartes.json (${livret})`);
  return fichesDe(livret)[cle];
}
/* Le nombre de tirages au hasard de chaque adresse (quatre cartes), relevé au lot 2 : la
   correction ne tire rien. */
const TIRAGES = { E10: 106, E11: 96, E12: 71, E13: 104, E14: 169, E15: 96, E16: 68, E17: 157, E18: 203, E19: 165, E20: 97, E21: 163,
  E22: 66, E23: 66, E24: 136, E10D: 194, E11D: 80, E12D: 116, E13D: 106, E14D: 188, E15D: 154, E16D: 104, E17D: 136,
  E18D: 60, E19D: 336, E20D: 172, E21D: 268, E22D: 222, E23D: 218, E24D: 172 };
/* (lot « petite part », 01/10/2026) la fiche 24d change de graine (1168 → 3572 : trois cartes
   « 2 et 3 » ou « 2 et 5 », puis « 3 et 4 », 19 parts, en dernier) ; les 29 autres fiches tirent
   les mêmes cartes, au même hasard (empreinte sans la 24d identique à main : 1b81db09362575df). */
const EMPREINTE = "696ba2c94ddcfc68";

test("règle absolue : les 30 adresses des livrets tirent exactement les cartes imprimées (cartes.json), même hasard consommé", () => {
  const tout = {};
  for(const [nom] of ADRESSES){
    const adresse = py(nom);
    assert.ok(adresse, `${nom} dans render.py`);
    const { cartes, appels } = moteur(adresse + "&cards=4&unknown=question", 4);
    const vues = cartes.map((c) => [c.total, c._rel.hiddenValues.slice().sort((a, b) => a - b)]);
    assert.deepEqual(vues, carteImprimee(nom).map((c) => [c[0], c[1]]), `${nom} : les quatre cartes du livret`);
    assert.equal(appels, TIRAGES[nom], `${nom} : même nombre de tirages au hasard`);
    tout[nom] = cartes.map((c) => ({ total: c.total, hidden: c.hidden, visible: c.visible, indices: c._inv.indices, rel: c._rel, couleurs: c._colorMap, posH: c._posH, posV: c._posV }));
  }
  assert.equal(empreinte(tout), EMPREINTE, "valeurs, indices, modèle, couleurs, places des jetons : rien ne bouge");
});

// --- 2. le modèle de la correction ------------------------------------------------------------
/* enqueteBarresModele lit card._rel et card.visible, et le mode « ? » / lettre de la page. */
const modele = new Function("numberedQuestionMarkMode", `
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const SYS_COULEURS_PLURIEL = ")}
  ${ligne("const ENQ_VOCABULAIRE = ")}
  ${ligne("const ENQ_NOMBRES_LETTRES = ")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("investigateColorInitial")}
  ${fn("investigateColorInfo")}
  ${fn("formatRelationNumber")}
  function getCardVarChar(){ return "𝑥"; }
  ${fn("getNumberedDisplayVarChar")}
  ${fn("enqueteNbEtapes")}
  /* le pas à pas G3 n'existe qu'en projection (tests/splat-enquete-g3-projection.test.mjs) :
     ici, les étapes du mode élève et de la page 2 */
  function enqueteProjectionPasAPas(){ return null; }
  ${fn("enqueteDerniereEtape")}
  ${fn("enqueteMotCouleur")}
  ${fn("enqueteInitiale")}
  ${fn("enqueteArticle")}
  ${fn("enqueteNomUnites")}
  ${fn("enqueteBarresModele")}
  return { modele: enqueteBarresModele, etapes: enqueteDerniereEtape };
`);
const enQuestion = modele(true), enLettre = modele(false);
/* Une carte d'Enquête à partir des indices, comme genInvestigate la fabrique. */
function carte({ couleurs, valeurs, relations, visibles = [], sansTotal = false, repetees = null }){
  /* [target, op, source, k] ; indice composé : [target, "COMPOSE", source, k, { d }] ; réunies : [target, "SUM", a, 1, { source2: b }] */
  const rels = relations.map(([target, op, source, k, extra]) => ({ target, op, source, k, clue: "", ...(extra || {}) }));
  const total = valeurs.reduce((a, b) => a + b, 0) + visibles.reduce((a, b) => a + b, 0);
  return { family: "C", total, visible: visibles, hidden: valeurs,
    _rel: { taskCount: valeurs.length, hiddenValues: valeurs, relations: rels, colorMap: couleurs, visibleSum: visibles.reduce((a, b) => a + b, 0),
            ...(sansTotal ? { sansTotal: true } : {}), ...(repetees ? { repetees } : {}) } };
}
const texte = (m) => ({ mode: m.mode, unite: m.unit, titre1: m.titre1, refo: m.reformulation, pre: m.preLignes, accolade: m.accolade,
  rows: m.rows.map((r) => [r.label, r.cells.map((c) => c.kind === "tache" ? m.texteCellule(c) : (c.kind === "ajout" ? `[${c.v}]` : String(c.v))).join(" | "), r.sous.map((s) => s.label)]),
  ligne: m.ligne ? [m.ligne.total, m.ligne.groupes.map((g) => g.label)] : null,
  calculs: m.calculs.map((l) => l ? `${l.g} = ${l.d}` : "—"), verif: m.verification });

test("deux taches, « de moins » : je retourne, les mots dans les cases, les calculs en phrases (page témoin)", () => {
  // TOTAL 25 — la noire a 7 de moins que la bleue (noire 9, bleue 16)
  const c = carte({ couleurs: ["black", "blue"], valeurs: [9, 16], relations: [[0, "SUB", 1, 7]] });
  const m = texte(enQuestion.modele(c));
  assert.equal(m.mode, "reference");
  assert.equal(m.refo, "Je retourne : la bleue a 7 de plus que la noire.");
  assert.deepEqual(m.rows, [["noire", "noire", []], ["bleue", "noire | 7", []]]);
  assert.deepEqual(m.ligne, [25, ["noire", "bleue"]]);
  assert.deepEqual(m.calculs, ["2 noires + 7 = 25", "2 noires = 25 − 7 = 18", "1 noire = 18 ÷ 2 = 9", "—", "bleue = 9 + 7 = 16"]);
  assert.equal(m.accolade, 25);
  // en lettre : les initiales dans les cases et dans les calculs
  const l = texte(enLettre.modele(c));
  assert.deepEqual(l.rows.map((r) => r[1]), ["N", "N | 7"]);
  assert.deepEqual(l.calculs, ["2N + 7 = 25", "2N = 25 − 7 = 18", "N = 18 ÷ 2 = 9", "—", "B = 9 + 7 = 16"]);
});

test("trois taches : une référence (la commune est la plus petite), une chaîne (au milieu), je complète (la plus grande)", () => {
  // une référence, deux rapports (n° 8) : rouge = 2 × noire, bleue = 3 × noire — 6, 12, 18
  const ref = texte(enQuestion.modele(carte({ couleurs: ["black", "red", "blue"], valeurs: [6, 12, 18], relations: [[1, "MUL", 0, 2], [2, "MUL", 0, 3]] })));
  assert.equal(ref.mode, "reference");
  assert.deepEqual(ref.rows, [["noire", "noire", []], ["rouge", "noire | noire", []], ["bleue", "noire | noire | noire", []]]);
  assert.deepEqual(ref.calculs, ["6 noires = 36", "1 noire = 36 ÷ 6 = 6", "—", "rouge = 2 × 6 = 12", "bleue = 3 × 6 = 18"]);
  // une chaîne, deux écarts (n° 6) : violette = noire + 10, orange = violette + 6 — 5, 15, 21
  const ch = texte(enQuestion.modele(carte({ couleurs: ["black", "purple", "orange"], valeurs: [5, 15, 21], relations: [[1, "ADD", 0, 10], [2, "ADD", 1, 6]] })));
  assert.equal(ch.mode, "chaine");
  assert.equal(ch.titre1, "Les barres — je remplace la violette");
  assert.deepEqual(ch.rows, [["noire", "noire", []], ["violette", "noire | 10", []], ["orange", "noire | 10 | 6", ["violette"]]]);
  assert.deepEqual(ch.ligne, [41, ["noire", "violette", "orange"]]);
  assert.deepEqual(ch.calculs, ["3 noires + 10 + 10 + 6 = 41", "3 noires = 41 − 26 = 15", "1 noire = 15 ÷ 3 = 5", "—", "violette = 5 + 10 = 15", "orange = 15 + 6 = 21"]);
  // une chaîne, un écart puis un rapport (n° 11) : bleue = noire + 2, orange = 3 × bleue — 5, 7, 21
  const ch2 = texte(enQuestion.modele(carte({ couleurs: ["black", "blue", "orange"], valeurs: [5, 7, 21], relations: [[1, "ADD", 0, 2], [2, "MUL", 1, 3]] })));
  assert.equal(ch2.titre1, "Les barres — je remplace chaque bleue");
  assert.deepEqual(ch2.rows[2], ["orange", "noire | 2 | noire | 2 | noire | 2", ["bleue", "bleue", "bleue"]]);
  assert.deepEqual(ch2.calculs, ["5 noires + 2 + 2 + 2 + 2 = 33", "5 noires = 33 − 8 = 25", "1 noire = 25 ÷ 5 = 5", "—", "bleue = 5 + 2 = 7", "orange = 3 × 7 = 21"]);
  // je complète (n° 7) : violette = noire + 10, violette = orange + 6 — 7, 17, 11 (fiche 13, carte 4 de la page témoin)
  const cp = texte(enQuestion.modele(carte({ couleurs: ["black", "purple", "orange"], valeurs: [7, 17, 11], relations: [[1, "ADD", 0, 10], [1, "ADD", 2, 6]] })));
  assert.equal(cp.mode, "complete");
  assert.equal(cp.titre1, "Les barres — je complète la noire et l'orange");
  assert.deepEqual(cp.pre, ["35 + 10 + 6 = 51"]);
  assert.equal(cp.accolade, 51);
  assert.deepEqual(cp.rows, [["noire + 10", "noire | [10]", []], ["orange + 6", "orange | [6]", []], ["violette", "violette", []]]);
  assert.deepEqual(cp.ligne, [51, ["une violette", "une violette", "violette"]]);
  assert.deepEqual(cp.calculs, ["3 violettes = 51", "1 violette = 51 ÷ 3 = 17", "—", "noire = 17 − 10 = 7", "orange = 17 − 6 = 11"]);
  // deux « de moins » vers la plus grande (7 bis) : une seule phrase « Je retourne »
  const cp2 = texte(enQuestion.modele(carte({ couleurs: ["green", "orange", "red"], valeurs: [6, 9, 17], relations: [[0, "SUB", 2, 11], [1, "SUB", 2, 8]] })));
  assert.equal(cp2.mode, "complete");
  assert.equal(cp2.refo, "Je retourne : la rouge a 11 de plus que la verte et 8 de plus que l'orange.");
  assert.deepEqual(cp2.pre, ["32 + 11 + 8 = 51"]);
});

test("jetons visibles, sans total, taches répétées", () => {
  // jetons visibles (n° 17) : verte = rouge + 5, + 2 et 4 visibles — 9, 14
  const v = texte(enQuestion.modele(carte({ couleurs: ["red", "green"], valeurs: [9, 14], relations: [[1, "ADD", 0, 5]], visibles: [2, 4] })));
  assert.deepEqual(v.pre, ["29 − 2 − 4 = 23 jetons sous les taches"]);
  assert.equal(v.accolade, 23);
  assert.deepEqual(v.calculs, ["2 rouges + 5 = 23", "2 rouges = 23 − 5 = 18", "1 rouge = 18 ÷ 2 = 9", "—", "verte = 9 + 5 = 14"]);
  // sans total (n° 19) : bleue = 3 × orange ET bleue = orange + 18 — 9, 27
  const st = texte(enQuestion.modele(carte({ couleurs: ["orange", "blue"], valeurs: [9, 27], relations: [[1, "MUL", 0, 3], [1, "ADD", 0, 18]], sansTotal: true })));
  assert.equal(st.mode, "sansTotal");
  assert.equal(st.ligne, null, "pas de ligne ② sans total");
  assert.deepEqual(st.rows, [["orange", "orange", []], ["bleue", "orange | orange | orange", ["18 de plus que l'orange"]]]);
  assert.deepEqual(st.calculs, ["2 orange = 18", "1 orange = 18 ÷ 2 = 9", "—", "bleue = 3 × 9 = 27"]);
  assert.equal(enQuestion.etapes(carte({ couleurs: ["orange", "blue"], valeurs: [9, 27], relations: [[1, "MUL", 0, 3], [1, "ADD", 0, 18]], sansTotal: true })), 2);
  assert.equal(enQuestion.etapes(v && carte({ couleurs: ["red", "green"], valeurs: [9, 14], relations: [[1, "ADD", 0, 5]] })), 3);
  // taches répétées (n° 18) : une noire, deux bleues, une bleue = une noire + 7 — 8, 15, 15, total 38
  const rp = texte(enQuestion.modele(carte({ couleurs: ["black", "blue", "blue"], valeurs: [8, 15, 15], relations: [[1, "ADD", 0, 7]],
    repetees: { couleurDe: [0, 1, 1], nombre: [1, 2] } })));
  assert.equal(rp.titre1, "Les barres — une barre par tache");
  assert.deepEqual(rp.rows, [["noire", "noire", []], ["bleue", "noire | 7", []], ["bleue", "noire | 7", []]]);
  assert.deepEqual(rp.ligne, [38, ["noire", "bleue", "bleue"]]);
  assert.deepEqual(rp.calculs, ["3 noires + 7 + 7 = 38", "3 noires = 38 − 7 − 7 = 24", "1 noire = 24 ÷ 3 = 8", "—", "bleue = 8 + 7 = 15"]);
  // répétées, « de moins » : « Je retourne : une bleue a 7 de plus qu'une noire. »
  const rp2 = texte(enQuestion.modele(carte({ couleurs: ["black", "blue", "blue"], valeurs: [8, 15, 15], relations: [[0, "SUB", 1, 7]],
    repetees: { couleurDe: [0, 1, 1], nombre: [1, 2] } })));
  assert.equal(rp2.refo, "Je retourne : une bleue a 7 de plus qu'une noire.");
});

// --- 3. le dessin -----------------------------------------------------------------------------
test("le dessin : longueurs justes (le mot rapetisse jusqu'à 6 pt, puis l'initiale, jamais de case élargie), cases de 5,4 mm", () => {
  const P = new Function(`${bloc("const ENQ_PROFIL_IMPRIME = {", "};")}\nreturn ENQ_PROFIL_IMPRIME;`)();
  const mm = Number(ligne("const ENQ_MM = ").match(/[\d.]+/)[0]);
  assert.ok(Math.abs(P.rowH / mm - 5.4) < 0.05, "cases de 5,4 mm");
  assert.ok(Math.abs(P.wordFont / mm - 7 * 0.3528) < 0.05, "mots à 7 pt");
  assert.ok(Math.abs(P.wordMin / mm - 6 * 0.3528) < 0.05, "6 pt au plus petit");
  assert.ok(Math.abs(P.calcFont / mm - 8.5 * 0.3528) < 0.05, "calculs à 8,5 pt");
  // une case « tache » n'est jamais élargie ; une case « nombre » garde un minimum lisible
  const largeurs = new Function(`${fn("enqueteLargeursCases")}\nreturn enqueteLargeursCases;`)();
  assert.deepEqual(largeurs([{ kind: "tache", v: 4 }, { kind: "ajout", v: 11 }, { kind: "nombre", v: 1 }], 30, P), [120, 330, P.cellMin]);
  // le texte d'une case : mot → mot plus petit → initiale → rien
  const texteCase = new Function("measureTextWidth", `
    ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
    ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
    ${PALETTE}
    ${fn("investigateColorByKey")} ${fn("investigateColorWord")} ${fn("investigateColorInitial")} ${fn("investigateColorInfo")}
    ${fn("formatRelationNumber")} ${fn("enqueteInitiale")} ${fn("enqueteTexteLargeur")} ${fn("enqueteTexteCase")}
    return enqueteTexteCase;`)((t, font) => String(t).length * parseInt(font.match(/(\d+)px/)[1], 10) * 0.6);
  const card = { family: "C", _rel: { colorMap: ["orange"] } }, m = { texteCellule: () => "orange" };
  const cell = { kind: "tache", de: 0, v: 4 };
  assert.deepEqual(texteCase(card, cell, 400, P, m), { t: "orange", fs: 46, poids: 700 }, "large : le mot à 7 pt");
  assert.equal(texteCase(card, cell, 170, P, m).t, "orange", "un peu étroit : le mot rapetisse");
  assert.ok(texteCase(card, cell, 170, P, m).fs < 46 && texteCase(card, cell, 170, P, m).fs >= 40);
  assert.deepEqual(texteCase(card, cell, 100, P, m), { t: "O", fs: 46, poids: 700 }, "trop étroit pour le mot à 6 pt : l'initiale");
  assert.equal(texteCase(card, cell, 20, P, m).t, "", "trop étroit même pour l'initiale : rien, la case garde sa longueur");
});

test("l'impression : le plateau de la correction à 22 mm, la correction sous lui jusqu'au bas de la carte, réduite d'un bloc si elle dépasse", () => {
  const mm = Number(ligne("const ENQ_MM = ").match(/[\d.]+/)[0]);
  const h = Number(ligne("const ENQ_PLATEAU_CORRECTION_H = ").match(/\d+/)[0]);
  assert.ok(Math.abs(h / mm - 22) < 0.5, `plateau de ${(h / mm).toFixed(1)} mm`);
  const impression = html.slice(html.indexOf("\nfunction renderCardIntoSvg("), html.indexOf("\nfunction printSheet("));
  assert.match(impression, /const enqueteAvecModele = \(card\.family === "C" && !!card\._rel && !card\._directSubstitution && !!enqueteBarresModele\(card\)\);/);
  assert.match(impression, /const enqueteCompacte = enqueteAvecModele && revealAnswers;/);
  assert.match(impression, /height:trayHDessine,/, "le plateau dessiné à la hauteur réduite");
  assert.match(impression, /const targetSvg = enqPlateauGroupe \|\| svgCarte;/, "les taches et les jetons dans le groupe réduit");
  assert.match(impression, /drawEnqueteCorrectionImprimee\(targetSvg, card, trayY \+ trayHDessine \+ 50, 2160\)/);
  const corr = fn("drawEnqueteCorrectionImprimee");
  assert.match(corr, /if\(hauteur > bas - haut\)\{\s*facteur = Math\.round\(1000 \* \(bas - haut\) \/ hauteur\) \/ 1000;/);
  assert.match(corr, /couche\.setAttribute\("data-facteur", String\(facteur\)\);/);
  // (lot « petite part », 01/10/2026) l'énoncé aussi à 22 mm, pour laisser la place d'écrire —
  // sauf en 6/page et pour la carte d'exemple seule des livrets (plateauEntier)
  assert.match(impression, /const enqueteEnoncePetit = enqueteAvecModele && !revealAnswers && !opts\.sixColonne && !opts\.sixParPage && !opts\.plateauEntier;/);
  // l'Enquête en 6/page ne passe pas par sixColonne (modes A et B) : printSheet lui donne sixParPage
  assert.match(fn("printSheet"), /\}else\{\s*sv\.setAttribute\("viewBox", cardViewBox\);[\s\S]{0,600}renderCardIntoSvg\(sv, card, mode, \{[^}]*sixParPage:perSheet === 6 \}\);/);
  assert.match(impression, /const trayHDessine = \(enqueteCompacte \|\| enqueteEnoncePetit\) \? ENQ_PLATEAU_CORRECTION_H : trayH;/);
  assert.match(impression, /const startY = trayY \+ trayHDessine \+ 80;/, "les indices en symboles remontent avec le plateau");
  // (01/10/2026, fiche 22d) l'Enquête en symboles : les indices à droite du TOTAL, avec le nom
  // des couleurs (lisibles en noir et blanc), comme le Système et le corrigé — sauf en 6/page
  assert.match(impression, /const sysSymbolBand = \(\(\(card\.family === "D" && !!card\._sys\) \|\| \(card\.family === "C" && !!card\._rel && !opts\.sixColonne && !opts\.sixParPage\)\) && !revealAnswers/);
  assert.match(impression, /renderMixedClue\(targetSvg, band\.x, [^\n]*\n\s*\{ labels:true, maxW:band\.right - band\.x, left:band\.x \}\);/);
  assert.match(impression, /translate\(0 \$\{Math\.round\(trayY \+ trayHDessine \+ ENQ_SCHEMA_VIDE_ECART - 620\)\}\)/, "le schéma vide remonte avec le plateau");
});

test("l'écran : trois étapes (les barres, schéma regroupé, je calcule), les taches dévoilées à la dernière ; la page 2 suit", () => {
  assert.equal(ligne("const ELEVE_SCHEMA_ETAPES = ").match(/\d+/)[0], "3");
  const ecran = html.slice(html.indexOf("\nfunction renderCard("), html.indexOf("\nfunction renderCardIntoSvg("));
  assert.match(ecran, /if\(revealState === 1\) drawEnqueteBarres\(relCible, card, oE\);\s*if\(revealState === 2\) \(sansLigne \? drawEnqueteCalculs : drawEnqueteLigne\)\(relCible, card, oE\);\s*if\(revealState === 3 && !sansLigne\) drawEnqueteCalculs\(relCible, card, oE\);/);
  assert.match(fn("getMaxRevealState"), /if\(card\.family === "C"\) return enqueteDerniereEtape\(card\);/);
  assert.doesNotMatch(ecran, /vide:true/, "plus d'étape « barres vides » (29/09/2026)");
  // le téléphone (portrait) cadre sur les nouveaux cadres ; le profil portrait est plus étroit
  const cadres = JSON.parse(ligne("const ELEVE_SCHEMA_CADRES = ").replace(/^.*= /, "").replace(/;$/, ""));
  assert.deepEqual(cadres.slice(0, 3), ["enqueteBarres", "enqueteLigne", "enqueteCalculs"]);
  assert.match(ligne("const ENQ_PROFIL_TEL = "), /boxW:960, cadre:true/);
  // la page 2 des livrets (lot « pages 2 », 30/09/2026) : les schémas du pas à pas G3, posés par
  // render.py, puis « Je réponds » et « Je vérifie » en texte, deux endroits comme à l'écran (03/10/2026)
  assert.match(render, /enqueteG3Dessiner\(g, card, et, plan\.modele, prof\);/);
  assert.doesNotMatch(render, /vide:true|drawRelationGroupedSchema|drawRelationOrderedSchema/);
  assert.match(render, /if \(n < 4 \|\| n > 7\) return/);
  const exemple = exempleHtml;
  assert.match(exemple, /<ol class="etapes"><\/ol>/);
  assert.doesNotMatch(render, /J'écris la réponse et je vérifie/, "l'ancien titre unique");
  assert.match(render, /<h3>Je réponds<\/h3><p class="rep">' \+ d\.fin\.reponse/);
  assert.match(render, /<h3>Je vérifie<\/h3><p class="leg">' \+ d\.fin\.verif/);
  // la réponse encadrée sur fond blanc ; en deux colonnes, « Je vérifie » passe dessous (les schémas gardent leur taille)
  assert.match(exemple, /\.et\.texte \.rep\{[^}]*background:#fff;border:1\.2px solid #0f172a/);
  assert.match(exemple, /\.etapes\.deux \.et\.texte \.duo\{flex-direction:column/);
  assert.match(render, /Je fais le schéma de la situation/);
  assert.doesNotMatch(exemple, /class="fin"|Je les remplis avec les mots/);
});

// --- lot G2 : le modèle sur les nouveaux types --------------------------------------------------
test("G2 — je complète avec un rapport (n° 12, 12 bis) : l'unité est la petite tache du rapport, la complétée vaut « une rouge »", () => {
  // n° 12 : rouge = 2 × noire ; rouge = orange + 5 — noire 8, orange 11, rouge 16 (le générateur l'écartait)
  const m = texte(enQuestion.modele(carte({ couleurs: ["black", "orange", "red"], valeurs: [8, 11, 16], relations: [[2, "MUL", 0, 2], [2, "ADD", 1, 5]] })));
  assert.equal(m.mode, "complete");
  assert.equal(m.titre1, "Les barres — je complète l'orange");
  assert.deepEqual(m.pre, ["35 + 5 = 40"]);
  assert.deepEqual(m.rows, [["noire", "noire", []], ["rouge", "noire | noire", []], ["orange + 5", "orange | [5]", []]]);
  assert.deepEqual(m.ligne, [40, ["noire", "rouge", "une rouge"]]);
  assert.deepEqual(m.calculs, ["orange + 5 = rouge = 2 noires", "5 noires = 40", "1 noire = 40 ÷ 5 = 8", "—", "rouge = 2 × 8 = 16", "orange = 16 − 5 = 11"]);
  assert.equal(m.verif, "8 + 16 + 11 = 35");
  // n° 12 bis (planche 4-tous-les-cas) : rouge = noire + 12 ; rouge = 2 × orange — orange 9, rouge 18, noire 6
  const b = texte(enQuestion.modele(carte({ couleurs: ["orange", "red", "black"], valeurs: [9, 18, 6], relations: [[1, "ADD", 2, 12], [1, "MUL", 0, 2]] })));
  assert.deepEqual(b.rows, [["orange", "orange", []], ["rouge", "orange | orange", []], ["noire + 12", "noire | [12]", []]]);
  assert.deepEqual(b.calculs, ["noire + 12 = rouge = 2 orange", "5 orange = 45", "1 orange = 45 ÷ 5 = 9", "—", "rouge = 2 × 9 = 18", "noire = 18 − 12 = 6"]);
});

test("l'unité commune (n° 13, problème B) : les petites parts (01/10/2026, à la place de « je double tout »)", () => {
  // rouge = 2 × noire ; rouge = 5 × orange — orange 4, noire 10, rouge 20 (planche 4-tous-les-cas, ta façon)
  const c = carte({ couleurs: ["orange", "black", "red"], valeurs: [4, 10, 20], relations: [[2, "MUL", 1, 2], [2, "MUL", 0, 5]] });
  const m = texte(enQuestion.modele(c));
  assert.equal(m.mode, "unite");
  assert.equal(m.accolade, 34);
  assert.deepEqual(m.rows, [["orange", "orange", []], ["rouge", "orange | orange | orange | orange | orange", ["cinq orange"]], ["noire", "noire", ["la moitié de la rouge"]]]);
  // la grande tache (rouge) se coupe en 2 × 5 = 10 petites parts ; la noire en vaut 5, l'orange 2
  const M = enQuestion.modele(c), P = M.parts;
  assert.equal(P.titre, "Les barres — je coupe en petites parts");
  assert.equal(P.phrase, "Je coupe la rouge en 10 petites parts (2\u00a0×\u00a05).");
  assert.deepEqual([P.part, P.nTot], [2, 17]);
  assert.deepEqual(P.rows.map((r) => [r.label, r.nParts, r.cells.every((x) => x.kind === "part" && x.v === 2 && x.de === r.i)]),
    [["orange", 2, true], ["rouge", 10, true], ["noire", 5, true]]);
  // sous la rouge : « orange | orange | … » (une accolade par orange), repli sur « cinq orange »
  assert.deepEqual(P.rows[1].sous.map((x) => [x.de, x.a, x.label]), [[0, 1, "orange"], [2, 3, "orange"], [4, 5, "orange"], [6, 7, "orange"], [8, 9, "orange"]]);
  assert.deepEqual(P.rows[1].sousRepli.map((x) => x.label), ["cinq orange"]);
  // ② le schéma regroupé : les parts bout à bout, sous le total (34, plus le double), même échelle
  const L = M.ligne;
  assert.deepEqual(L.avant, []);
  assert.deepEqual([L.total, L.groupes.map((g) => [g.label, g.cells.length])], [34, [["orange", 2], ["rouge", 10], ["noire", 5]]]);
  assert.deepEqual(m.calculs, ["17 parts = 34", "1 part = 34 ÷ 17 = 2", "—", "orange = 2 × 2 = 4", "rouge = 10 × 2 = 20", "noire = 5 × 2 = 10"]);
  assert.deepEqual(texte(enLettre.modele(c)).calculs, ["17 parts = 34", "1 part = 34 ÷ 17 = 2", "—", "O = 2 × 2 = 4", "R = 10 × 2 = 20", "N = 5 × 2 = 10"]);
  // plus rien de « je double tout »
  assert.doesNotMatch(html, /Je double tout|je double tout\)|enqueteUniteAvecLigne/);
  // deux rapports dont l'un divise l'autre (rouge = 2 noires = 4 orange) : une chaîne, comme au lot G1
  assert.equal(texte(enQuestion.modele(carte({ couleurs: ["orange", "black", "red"], valeurs: [4, 8, 16], relations: [[2, "MUL", 1, 2], [2, "MUL", 0, 4]] }))).mode, "chaine");
});

test("G2 — les indices composés (n° 15, 15 bis) : un rapport suivi d'un écart ; « de moins que le triple » se complète", () => {
  // rouge = 2 × noire + 3 — noire 10, rouge 23
  const m = texte(enQuestion.modele(carte({ couleurs: ["black", "red"], valeurs: [10, 23], relations: [[1, "COMPOSE", 0, 2, { d: 3 }]] })));
  assert.deepEqual(m.rows, [["noire", "noire", []], ["rouge", "noire | noire | 3", []]]);
  assert.deepEqual(m.calculs, ["3 noires + 3 = 33", "3 noires = 33 − 3 = 30", "1 noire = 30 ÷ 3 = 10", "—", "rouge = 2 × 10 + 3 = 23"]);
  // rouge = 3 × noire − 5 — noire 9, rouge 22 : rouge + 5 = 3 noires
  const b = texte(enQuestion.modele(carte({ couleurs: ["black", "red"], valeurs: [9, 22], relations: [[1, "COMPOSE", 0, 3, { d: -5 }]] })));
  assert.equal(b.titre1, "Les barres — je complète la rouge");
  assert.deepEqual(b.pre, ["31 + 5 = 36"]);
  assert.deepEqual(b.rows, [["noire", "noire", []], ["rouge + 5", "rouge | [5]", []]]);
  assert.deepEqual(b.ligne, [36, ["noire", "3 noires"]]);
  assert.deepEqual(b.calculs, ["rouge + 5 = 3 noires", "4 noires = 36", "1 noire = 36 ÷ 4 = 9", "—", "rouge = 3 × 9 − 5 = 22"]);
  // à trois taches (référence) : rouge = 2 × noire + 3 ; bleue = noire + 4 — 9, 21, 13
  const t = texte(enQuestion.modele(carte({ couleurs: ["black", "red", "blue"], valeurs: [9, 21, 13], relations: [[1, "COMPOSE", 0, 2, { d: 3 }], [2, "ADD", 0, 4]] })));
  assert.deepEqual(t.calculs, ["4 noires + 3 + 4 = 43", "4 noires = 43 − 3 − 4 = 36", "1 noire = 36 ÷ 4 = 9", "—", "rouge = 2 × 9 + 3 = 21", "bleue = 9 + 4 = 13"]);
  // en chaîne, sur le dernier maillon : violette = noire + 10 ; orange = 2 × violette − 5 — 5, 15, 25
  const ch = texte(enQuestion.modele(carte({ couleurs: ["black", "purple", "orange"], valeurs: [5, 15, 25], relations: [[1, "ADD", 0, 10], [2, "COMPOSE", 1, 2, { d: -5 }]] })));
  assert.equal(ch.titre1, "Les barres — je remplace chaque violette et je complète l'orange");
  assert.deepEqual(ch.ligne, [50, ["noire", "violette", "2 violettes"]]);
  assert.deepEqual(ch.calculs, ["orange + 5 = 2 violettes", "4 noires + 10 + 10 + 10 = 50", "4 noires = 50 − 30 = 20", "1 noire = 20 ÷ 4 = 5", "—", "violette = 5 + 10 = 15", "orange = 2 × 15 − 5 = 25"]);
});

test("G2 — deux taches réunies (n° 16) : la grande barre = les deux autres bout à bout", () => {
  // rouge = noire + bleue ; bleue = noire + 4 — 7, 11, 18 (planche 4-tous-les-cas)
  const m = texte(enQuestion.modele(carte({ couleurs: ["black", "blue", "red"], valeurs: [7, 11, 18], relations: [[2, "SUM", 0, 1, { source2: 1 }], [1, "ADD", 0, 4]] })));
  assert.equal(m.mode, "reunies");
  assert.equal(m.titre1, "Les barres — je remplace la bleue");
  assert.deepEqual(m.rows, [["noire", "noire", []], ["bleue", "noire | 4", []], ["rouge", "noire | noire | 4", ["noire", "bleue"]]]);
  assert.deepEqual(m.ligne, [36, ["noire", "bleue", "rouge"]]);
  assert.deepEqual(m.calculs, ["4 noires + 4 + 4 = 36", "4 noires = 36 − 4 − 4 = 28", "1 noire = 28 ÷ 4 = 7", "—", "bleue = 7 + 4 = 11", "rouge = 7 + 11 = 18"]);
  // « de moins » dans la paire : Je retourne
  const r = texte(enQuestion.modele(carte({ couleurs: ["black", "blue", "red"], valeurs: [7, 11, 18], relations: [[2, "SUM", 0, 1, { source2: 1 }], [0, "SUB", 1, 4]] })));
  assert.equal(r.refo, "Je retourne : la bleue a 4 de plus que la noire.");
});

// --- lot G2 : le générateur ----------------------------------------------------------------------
const BASE3 = "mode=C&splats=3&clues=SENTENCE&mul=1&div=1&add=1&sub=1&deltaMax=15&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60";
const INTERDITS = JSON.parse(ligne("const SYS_NOMBRES_SOUS_ENTENDUS = ").replace(/^.*= /, "").replace(/;$/, ""));
function tirerTout(q, graines = 20){
  const cartes = [];
  for(let seed = 1; seed <= graines; seed++) cartes.push(...moteur(`${q}&seed=${seed}`, 4).cartes);
  return cartes;
}
function verifieContraintes(cartes){
  for(const c of cartes){
    const v = c._rel.hiddenValues;
    assert.ok(Math.min(...v) >= 2, `plus petite tache ≥ 2 : ${v}`);
    assert.equal(new Set(v).size, v.length, `jamais deux taches égales : ${v}`);
    const nombres = [c.total, ...v, ...c._rel.relations.map((r) => r.k), ...c._rel.relations.map((r) => Math.abs(r.d || 0))];
    assert.ok(!nombres.some((n) => INTERDITS.some((x) => String(n).includes(x))), `aucun nombre à sous-entendu : ${nombres}`);
    assert.ok(enQuestion.modele(c), `chaque carte a une correction en barres : ${JSON.stringify(c._rel.relations)}`);
  }
}

test("G2 — les nouveaux réglages, éteints, ne consomment aucun tirage : mêmes cartes, même empreinte", () => {
  const tout = {};
  for(const [nom] of ADRESSES){
    const { cartes, appels } = moteur(py(nom) + "&cards=4&unknown=question&ordre=HASARD&vocab=0&compose=0&reunies=0", 4);
    assert.equal(appels, TIRAGES[nom], `${nom} : même nombre de tirages, réglages écrits mais éteints`);
    tout[nom] = cartes.map((c) => ({ total: c.total, hidden: c.hidden, visible: c.visible, indices: c._inv.indices, rel: c._rel, couleurs: c._colorMap, posH: c._posH, posV: c._posV }));
  }
  assert.equal(empreinte(tout), EMPREINTE);
  // les anciennes valeurs de « structure » gardent l'ancien tirage (le filtre d'avant s'applique)
  const src = fn("genInvestigate");
  assert.match(src, /const TYPES_ANCIENS = \["CHAIN", "PIVOT", "MIX"\];/);
  assert.match(src, /if\(!nouveau && !relationValuesFitPositiveSchema\(taskCount, hiddenVals, relations\)\) continue;/);
});

test("G2 — le type de schéma demandé est obtenu, après retournement des indices ; au hasard : les trois premiers", () => {
  const modes = (q) => { const cartes = tirerTout(q); verifieContraintes(cartes); return new Set(cartes.map((c) => enQuestion.modele(c).mode)); };
  assert.deepEqual([...modes(`${BASE3}&structure=REF`)], ["reference"]);
  assert.deepEqual([...modes(`${BASE3}&structure=CHAINE`)], ["chaine"]);
  assert.deepEqual([...modes(`${BASE3}&structure=COMPLETE`)], ["complete"]);
  assert.deepEqual([...modes(`${BASE3}&structure=UNITE`)], ["unite"]);
  assert.deepEqual([...modes(`${BASE3}&structure=HASARD`)].sort(), ["chaine", "complete", "reference"]);
  // « je complète » avec un rapport (n° 12) : le générateur ne l'écarte plus
  const complete = tirerTout(`${BASE3}&structure=COMPLETE`);
  assert.ok(complete.some((c) => c._rel.relations.some((r) => r.op === "MUL" || r.op === "DIV")), "des cartes « je complète » avec un rapport");
  assert.ok(complete.some((c) => c._rel.relations.every((r) => r.op === "ADD" || r.op === "SUB")), "et avec deux écarts (n° 7)");
  // sans « de plus / de moins », rien à compléter : une chaîne à la place
  assert.deepEqual([...modes(`${BASE3.replace("add=1&sub=1", "add=0&sub=0")}&structure=COMPLETE`)], ["chaine"]);
  // l'unité commune : deux rapports vers la plus grande, k1 et k2 premiers entre eux ; « fois moins » aussi
  const unite = tirerTout(`${BASE3}&structure=UNITE`);
  assert.ok(unite.some((c) => c._rel.relations.some((r) => r.op === "DIV")), "« fois moins » possible");
  unite.forEach((c) => { const ks = c._rel.relations.map((r) => r.k); assert.ok(ks[0] !== ks[1] && ks[0] % ks[1] && ks[1] % ks[0], `k premiers entre eux : ${ks}`); });
});

test("unité commune : jamais une petite part à 1 jeton (« 37 parts = 37 »), taches répétées comprises ; jamais de carte « Erreur »", () => {
  const unJeton = (c) => enQuestion.modele(c).parts.part === 1;
  for(const q of [`${BASE3}&structure=UNITE`, `${BASE3.replace("totalMax=60", "totalMax=100")}&structure=UNITE&repeat=3`,
                  `${BASE3.replace("totalMax=60", "totalMax=30")}&structure=UNITE&repeat=3`]){
    const cartes = tirerTout(q, 60);
    cartes.forEach((c) => assert.equal(enQuestion.modele(c).mode, "unite", q));
    assert.equal(cartes.filter(unJeton).length, 0, q);
  }
  // total maximum sous 22 : seule la part à 1 jeton est possible — elle est gardée, pas de carte « Erreur »
  const serrees = tirerTout(`${BASE3.replace("totalMin=20&totalMax=60", "totalMin=5&totalMax=20")}&structure=UNITE`, 5);
  serrees.forEach((c) => { assert.notEqual(c._inv.indices[0], "Erreur"); assert.ok(unJeton(c)); });
  // le filtre est dans le générateur, au moment de rendre la carte (après tous les autres)
  const g = fn("genInvestigate");
  assert.match(g, /if\(tries < 4000 && unePartUnJeton\(vals, relations\)\) continue;\n      return \{/);
  assert.match(g, /if\(tries < 4000 && unePartUnJeton\(hiddenVals, relations\)\) continue;\n      return \{/);
});

test("G2 — indices composés, deux taches réunies, « le double / la moitié », à deux et trois taches", () => {
  const compose3 = tirerTout(`${BASE3}&structure=HASARD&compose=1`); verifieContraintes(compose3);
  compose3.forEach((c) => {
    assert.equal(c._rel.relations.filter((r) => r.op === "COMPOSE").length, 1, "exactement un indice composé par carte");
    assert.ok(["reference", "chaine"].includes(enQuestion.modele(c).mode), "une référence ou une chaîne");
  });
  const phrasesC = compose3.flatMap((c) => c._inv.indices);
  assert.ok(phrasesC.some((t) => /de plus que le double des jetons de la tache/.test(t)));
  assert.ok(phrasesC.some((t) => /de moins que le (double|triple) des jetons de la tache/.test(t)));
  const compose2 = tirerTout(`${BASE3.replace("splats=3", "splats=2")}&compose=1`); verifieContraintes(compose2);
  compose2.forEach((c) => assert.equal(c._rel.relations[0].op, "COMPOSE"));
  // deux taches réunies : la phrase, la relation SUM, le dessin « reunies »
  const reunies = tirerTout(`${BASE3}&structure=HASARD&reunies=1`); verifieContraintes(reunies);
  reunies.forEach((c) => {
    const s = c._rel.relations.find((r) => r.op === "SUM");
    assert.ok(s, "une relation SUM");
    assert.equal(c._rel.hiddenValues[s.target], c._rel.hiddenValues[s.source] + c._rel.hiddenValues[s.source2]);
    assert.equal(enQuestion.modele(c).mode, "reunies");
    assert.ok(c._inv.indices.some((t) => /autant de jetons que sous la tache \w+ et la tache \w+ réunies\./.test(t)));
  });
  // le vocabulaire du primaire, une fois sur deux, sur les rapports seulement ; les valeurs des cartes ne bougent pas
  const vocab = tirerTout(`${BASE3}&structure=REF&vocab=1`);
  const phrasesV = vocab.flatMap((c) => c._inv.indices);
  assert.ok(phrasesV.some((t) => /il y a (le double|le triple|le quadruple) des jetons de la tache/.test(t)), "« le double des jetons de la tache noire »");
  assert.ok(phrasesV.some((t) => /il y a (la moitié|le tiers|le quart) des jetons de la tache/.test(t)), "« la moitié »");
  assert.ok(phrasesV.some((t) => /fois plus de jetons que sous/.test(t)), "alterné avec « 2 fois plus »");
  // sur une adresse d'avant (2 taches, tirage ancien) : la carte garde ses valeurs, seule la phrase
  // change (le pile ou face du mot vient APRÈS le tirage de la carte ; la carte suivante, elle,
  // est tirée après ce pile ou face — une adresse avec vocab=1 est une adresse nouvelle)
  const avant = moteur(py("F15") + "&cards=1&unknown=question", 1).cartes[0], apres = moteur(py("F15") + "&cards=1&unknown=question&vocab=1", 1).cartes[0];
  assert.deepEqual([apres.total, apres._rel.hiddenValues], [avant.total, avant._rel.hiddenValues]);
  // taches répétées : « d'une tache noire »
  const rep = tirerTout(`${BASE3}&structure=REF&vocab=1&repeat=3`, 10).flatMap((c) => c._inv.indices);
  assert.ok(rep.some((t) => /des jetons d'une tache/.test(t)));
});

test("G2 — l'ordre des phrases : dans l'ordre du dessin, la première phrase part de l'unité ; dans le désordre, l'inverse", () => {
  const dessin = tirerTout(`${BASE3}&structure=CHAINE&ordre=DESSIN`);
  dessin.forEach((c) => { const m = enQuestion.modele(c); const r = c._rel.relations[0]; assert.ok(r.source === m.unit || r.target === m.unit, "la 1re phrase parle de l'unité"); });
  const desordre = tirerTout(`${BASE3}&structure=CHAINE&ordre=DESORDRE`);
  desordre.forEach((c) => { const m = enQuestion.modele(c); const r = c._rel.relations[1]; assert.ok(r.source === m.unit || r.target === m.unit, "la 2e phrase parle de l'unité"); });
  const hasard = tirerTout(`${BASE3}&structure=CHAINE&ordre=HASARD`);
  const premiers = new Set(hasard.map((c) => { const m = enQuestion.modele(c); const r = c._rel.relations[0]; return r.source === m.unit || r.target === m.unit; }));
  assert.equal(premiers.size, 2, "au hasard : les deux ordres");
});

test("G2 — le dessin : plus de pastille, colonne des noms mesurée, même échelle en ① et ②, contour fin, blanc réparti", () => {
  const barres = fn("drawEnqueteBarres"), ligne2 = fn("drawEnqueteLigne"), calcs = fn("drawEnqueteCalculs"), page = fn("enqueteMiseEnPage");
  assert.doesNotMatch(barres + calcs, /blobPath|dotR/, "plus de tache devant les noms ni sur la ligne réponse");
  /* lot 1 (schéma vide) : mesurée sur les noms du corrigé (labelMesure ; absent ailleurs) */
  assert.match(page, /const labelW = Math\.min\(P\.labelMax, Math\.max\(\.\.\.modele\.rows\.map\(r => enqueteTexteLargeur\(r\.labelMesure \|\| r\.label, P\.labelFont, 800\)\)\) \+ P\.labelGap\);/);
  assert.match(page, /s:commune \? Math\.min\(sBarres, sLigne\) : sBarres/, "l'échelle commune (sauf l'unité commune : la ligne ② vaut le double)");
  assert.match(barres, /const M = enqueteMiseEnPage\(modele, P\);/);
  assert.match(ligne2, /const M = enqueteMiseEnPage\(modele, P\);/);
  assert.doesNotMatch(ligne2, /"stroke-width":bord/, "plus de cadre épais");
  assert.match(ligne2, /stroke:"#111827", "stroke-width":3\.5 \}\)\);\n  g\.appendChild\(text\(lineX \+ wTot \/ 2/, "la case du total en trait fin");
  assert.equal(Number(ligne("const ENQ_PROFIL_IMPRIME = {").length ? new Function(`${bloc("const ENQ_PROFIL_IMPRIME = {", "};")} return ENQ_PROFIL_IMPRIME.ligneBord;`)() : 0), 4);
  assert.match(calcs, /if\(largeurRep\(rv, avec\) <= largeur\)\{ rf = rv; entries\.push\(avec\[avec\.length - 1\]\); \}/, "la vérification du total à côté de la réponse quand elle tient");
  // le blanc restant est réparti entre les blocs, plafonné ; une carte qui dépasse est réduite, jamais écartée
  const corr = fn("drawEnqueteCorrectionImprimee");
  assert.match(corr, /ecart = Math\.round\(Math\.min\(ENQ_ECART_MAX, \(bas - haut - hauteur\) \/ \(blocs\.length - 1\)\)\);/);
  assert.match(corr, /y \+= b\.h \+ pas \+ ecart;/);
  assert.equal(Number(ligne("const ENQ_ECART_MAX = ").match(/\d+/)[0]), 100);
});
