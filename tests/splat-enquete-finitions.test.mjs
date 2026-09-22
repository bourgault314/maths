/* SPLAT! Enquête — lot E1 « les finitions du dessin » (21/09/2026).
   Ces tests exécutent les fonctions de outils/splat.html telles quelles (extraites du
   fichier) : elles vérifient des comportements, pas la présence d'un bout de code.
   - la tache de référence (𝑥, la plus petite) passe en première ligne des schémas ;
   - la palette : à sa valeur par défaut, exactement les mêmes couleurs et la même
     consommation du hasard qu'avant ; restreinte, seules les couleurs changent ;
   - la phrase d'indice : coupée à la virgule quand elle ne tient pas, jamais tronquée ;
   - le pluriel « 1 jeton » ; le paramètre note= hors empreinte ; le bandeau framboise. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function constLine(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}

// --- la palette et le tirage des couleurs -----------------------------------------
const PALETTE = html.slice(html.indexOf("const INVESTIGATE_COLOR_PALETTE = ["), html.indexOf("];", html.indexOf("const INVESTIGATE_COLOR_PALETTE = [")) + 2);
const shuffle = fn("shuffleInPlace");
const mulberry = html.split("\n").find((x) => x.startsWith("function mulberry32("));
const couleurs = new Function(`
  ${PALETTE}
  ${constLine("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${constLine("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  ${fn("parseInvestigatePalette")}
  ${fn("buildInvestigateColorMap")}
  ${shuffle}
  ${mulberry}
  return { parse: parseInvestigatePalette, build: (seed, n, palette) => {
    investigatePaletteKeys = palette; let tirages = 0;
    const base = mulberry32(seed); const rng = () => { tirages++; return base(); };
    const map = buildInvestigateColorMap(rng, n, true); return { map, tirages, suivant: rng() };
  }, word: (k) => investigateColorWord(investigateColorByKey(k)), initial: (k) => investigateColorInitial(investigateColorByKey(k)) };
`)();

test("palette absente : mêmes couleurs, même nombre de tirages qu'avant (les cartes ne bougent pas)", () => {
  for(const seed of [1, 100, 974, 4242]){
    const a = couleurs.build(seed, 3, null);
    const b = couleurs.build(seed, 3, couleurs.parse("noire,violette,orange,bleue,verte,rouge"));
    assert.deepEqual(a.map, b.map, "les six couleurs autorisées = aucune palette");
    assert.equal(a.tirages, b.tirages);
    assert.equal(a.suivant, b.suivant, "le tirage suivant est le même");
  }
});

test("palette restreinte : seules les couleurs changent, le hasard est consommé pareil", () => {
  const sans = couleurs.build(100, 3, null);
  const avec = couleurs.build(100, 3, couleurs.parse("noire, orange, bleue"));
  assert.equal(avec.tirages, sans.tirages, "même consommation du hasard");
  assert.equal(avec.suivant, sans.suivant, "les valeurs tirées ensuite sont identiques");
  assert.deepEqual([...avec.map].sort(), ["black", "blue", "orange"]);
  // deux couleurs pour trois taches : la troisième vient des autres, sans doublon
  const deux = couleurs.build(100, 3, couleurs.parse("black+orange"));
  assert.equal(new Set(deux.map).size, 3);
  assert.ok(deux.map.slice(0, 2).every((k) => ["black", "orange"].includes(k)));
  assert.equal(couleurs.parse("turquoise"), null, "une couleur inconnue = pas de palette");
});

test("le mot écrit sur la tache et l'initiale des petites pastilles", () => {
  assert.deepEqual(["black", "purple", "orange", "blue", "green", "red"].map(couleurs.word), ["noire", "violette", "orange", "bleue", "verte", "rouge"]);
  assert.deepEqual(["black", "purple", "green"].map(couleurs.initial), ["N", "Vi", "Ve"], "violette et verte ne partagent pas la même lettre");
});

// --- la brique de référence en première ligne ---------------------------------------
const ordre = new Function(`
  ${fn("relationReferenceIndex")}
  ${fn("relationDisplayOrder")}
  // le modèle minimal de positiveBarItemsForRelation : coef/diff par tache
  function positiveBarItemsForRelation(card){ return card.items; }
  return relationDisplayOrder;
`)();

test("la tache qui vaut 𝑥 est toujours la première ligne, quelle que soit sa couleur", () => {
  const carte = (items, hidden) => ({ family:"C", hidden, _rel:{ taskCount:items.length, hiddenValues:hidden } , items });
  // noire = x + 3, verte = x + 15, bleue = x (capture 02 de l'étude : la référence était en bas)
  assert.deepEqual(ordre(carte([{coef:1,diff:3},{coef:1,diff:15},{coef:1,diff:0}], [17, 29, 14])), [2, 0, 1]);
  // « 2 fois plus » : noire = 2x, verte = x
  assert.deepEqual(ordre(carte([{coef:2,diff:0},{coef:1,diff:0}], [24, 12])), [1, 0]);
  // la référence déjà en tête : rien ne bouge
  assert.deepEqual(ordre(carte([{coef:1,diff:0},{coef:3,diff:0},{coef:1,diff:5}], [4, 12, 9])), [0, 1, 2]);
  // deux taches à la même valeur (17, 8, 17) : la plus petite en tête, les autres dans l'ordre
  assert.deepEqual(ordre(carte([{coef:1,diff:9},{coef:1,diff:0},{coef:1,diff:9}], [17, 8, 17])), [1, 0, 2]);
});

test("le schéma rempli et le schéma regroupé lisent le même ordre", () => {
  assert.match(fn("drawRelationSituationSchema"), /const rowOrder = relationDisplayOrder\(card\)/);
  assert.match(fn("getRelationGroupedDisplayGroups"), /const order = relationDisplayOrder\(card\)/);
  assert.match(fn("drawRelationAnswerLine"), /relationDisplayOrder\(card\)/);
});

// --- la phrase d'indice ne sort plus de la carte ---------------------------------------
const layout = new Function(`
  // mesure de secours (pas de canvas ici) : 0,56 × la police par caractère, comme la page
  function measureTextWidth(){ return NaN; }
  ${fn("layoutClueSentence")}
  return layoutClueSentence;
`)();

test("impression : la phrase trop large se coupe en deux à la virgule, sans changer de police", () => {
  const longue = "Sous la tache violette, il y a 14 jetons de moins que sous la tache orange."; // 76 caractères
  const r = layout(longue, 42, 1520, true);
  assert.deepEqual(r.lines, ["Sous la tache violette,", "il y a 14 jetons de moins que sous la tache orange."]);
  assert.equal(r.fontSize, 42);
  for(const line of r.lines) assert.ok(line.length * 42 * 0.56 <= 1520, "chaque ligne tient dans la carte");
  const courte = "Sous la tache verte, il y a 1 jeton de moins que sous la tache noire.";
  const c = layout(courte, 42, 1700, true);
  assert.deepEqual(c.lines, [courte], "une phrase qui tient reste sur une ligne");
});

test("écran : la phrase trop large est réduite, jamais coupée ni tronquée", () => {
  const longue = "Sous la tache violette, il y a 14 jetons de moins que sous la tache orange.";
  const r = layout(longue, 45, 1552, false);
  assert.equal(r.lines.length, 1);
  assert.equal(r.lines[0], longue);
  assert.ok(r.fontSize < 45 && r.fontSize >= 30);
  assert.ok(longue.length * r.fontSize * 0.56 <= 1552);
});

// --- pluriel, note=, palette=, bandeau ---------------------------------------------------
test("« 1 jeton de plus », « 1 jeton de moins », mais « 2 jetons »", () => {
  const src = fn("genInvestigate");
  assert.match(src, /\$\{k > 1 \? "jetons" : "jeton"\} de plus que/);
  assert.match(src, /\$\{k > 1 \? "jetons" : "jeton"\} de moins que/);
  assert.doesNotMatch(src, /\$\{k\} jetons de/);
});

test("note= : consigne en gras sous la phrase, hors empreinte élève ; palette= dans l'empreinte", () => {
  const noms = JSON.parse(constLine("const sharedNames = ").replace(/^.*= /, "").replace(/;$/, ""));
  const hors = JSON.parse(constLine("const ELEVE_HORS_EMPREINTE = ").replace(/^.*= /, "").replace(/;$/, ""));
  assert.ok(noms.includes("note") && noms.includes("palette"));
  assert.ok(hors.includes("note"), "la note n'entre pas dans l'empreinte : elle ne change pas les cartes");
  assert.ok(!hors.includes("palette"), "la palette change les couleurs : elle entre dans l'empreinte");
  assert.match(fn("createClassicPrintInstruction"), /print-page-instruction-extra/);
  assert.match(html, /\.print-page-instruction-extra\{margin-top:0\.9mm;font-weight:900;color:#111827\}/);
  assert.match(fn("appliquerConfiguration"), /params\.has\("note"\)/);
  assert.match(fn("appliquerConfiguration"), /params\.has\("palette"\)/);
});

test("le bandeau des fiches d'Enquête est framboise, celui des autres modes reste bleu", () => {
  assert.match(html, /\.print-page-header--enquete\{background:linear-gradient\(90deg,#be185d 0%/);
  assert.match(html, /\.print-page-header\{[\s\S]*?background:linear-gradient\(90deg,#0b67b2 0%/);
  assert.match(fn("createClassicPrintHeader"), /if\(actNow === "C" \|\| actNow === "CD"\) header\.classList\.add\("print-page-header--enquete"\)/);
  assert.match(html, /<option value="C">C — Enquête \(relations, 6 couleurs\)<\/option>/);
});

// --- retouches de Claire (22/09/2026) ---------------------------------------------------
const reformulation = new Function(`
  function formatRelationNumber(n){ return String(n); }
  function relationReferenceIndex(card){ return card.ref; }
  function investigateColorInfo(card, i){ return { word: card.words[i] }; }
  function investigateColorWord(info){ return info.word; }
  ${fn("relationReformulationLines")}
  return relationReformulationLines;
`)();

test("la correction reformule « de moins » et « fois moins » dans le sens de la référence, et nomme toujours la référence", () => {
  const names = ["la tache noire", "la tache verte", "la tache bleue"];
  const words = ["noire", "verte", "bleue"];
  // verte = noire − 12 (SUB : cible verte, source noire) → « Sous la tache noire, il y a 12 jetons de plus que sous la tache verte. »
  const sub = { _rel:{ names, relations:[{op:"SUB", k:12, source:0, target:1}] }, ref:1, words };
  assert.deepEqual(reformulation(sub), [
    "Sous la tache noire, il y a 12 jetons de plus que sous la tache verte.",
    "Tache de référence : la verte, la plus petite."
  ]);
  // bleue = noire ÷ 2 (DIV) → « Sous la tache noire, il y a 2 fois plus de jetons que sous la tache bleue. »
  const div = { _rel:{ names, relations:[{op:"DIV", k:2, source:0, target:2}] }, ref:2, words };
  assert.equal(reformulation(div)[0], "Sous la tache noire, il y a 2 fois plus de jetons que sous la tache bleue.");
  // « 1 jeton » au singulier
  const un = { _rel:{ names, relations:[{op:"SUB", k:1, source:0, target:1}] }, ref:1, words };
  assert.match(reformulation(un)[0], /1 jeton de plus/);
  // rien à retourner : le cadre ne porte que la référence (décision du 22/09 : toujours présent)
  const add = { _rel:{ names, relations:[{op:"ADD", k:5, source:0, target:1}, {op:"MUL", k:3, source:1, target:2}] }, ref:0, words };
  assert.deepEqual(reformulation(add), ["Tache de référence : la noire, la plus petite."]);
});

const bande = new Function(`
  function measureTextWidth(){ return NaN; }
  ${fn("wrapTextToWidth")}
  ${constLine("const ENQUETE_PRINT_CLUES_BAND = ")}
  ${fn("layoutEnqueteClueBand")}
  return { wrap: wrapTextToWidth, band: (s) => layoutEnqueteClueBand(s, ENQUETE_PRINT_CLUES_BAND), B: ENQUETE_PRINT_CLUES_BAND };
`)();

test("énoncé imprimé : les phrases tiennent à droite du TOTAL, coupées par mots, police 42 → 30 au plus", () => {
  const maxW = bande.B.right - bande.B.x;
  const une = ["Sous la tache violette, il y a 14 jetons de moins que sous la tache orange."];
  const deux = ["Sous la tache orange, il y a 3 fois moins de jetons que sous la tache violette.", "Sous la tache noire, il y a 6 jetons de plus que sous la tache violette."];
  for(const phrases of [une, deux]){
    const plan = bande.band(phrases);
    assert.ok(plan.fontSize >= 30 && plan.fontSize <= 42);
    assert.ok(plan.total <= bande.B.height, `le bloc (${plan.total}) tient dans le bandeau (${bande.B.height})`);
    plan.blocks.forEach((lines, i) => {
      assert.equal(lines.join(" "), phrases[i], "aucun mot perdu");
      for(const l of lines) assert.ok(l.length * plan.fontSize * 0.56 <= maxW, "chaque ligne tient dans la largeur");
    });
  }
  assert.deepEqual(bande.wrap("un deux trois", 10, 1000), ["un deux trois"]);
  assert.deepEqual(bande.wrap("un deux trois", 10, 30), ["un", "deux", "trois"]);
});

test("correction imprimée : le cadre de reformulation en premier ; l'équation du schéma regroupé masquée en « ? », gardée en lettre", () => {
  const print = html.slice(html.indexOf("function renderCardIntoSvg("), html.indexOf("function classicPrintTaskCount("));
  assert.match(print, /drawRelationReformulationBox\(layer, card/);
  assert.match(print, /const questionMark = getNumberedDisplayVarChar\(card\) === "\?"/);
  assert.match(print, /drawRelationGroupedSchema\(layer, card, \{ \.\.\.printProfile, hideGroupedEquation: questionMark \}\)/);
  assert.match(fn("drawRelationGroupedSchema"), /opts\.hideGroupedEquation \? \[\] : \[groupedEquation\]/);
  assert.match(fn("drawRelationReformulationBox"), /relationHasInvertedClue\(card\) \? "Reformulation" : "Tache de référence"/);
  // l'écran ne passe pas l'option : l'étape « Schéma regroupé » garde son équation
  const screen = html.slice(html.indexOf("function renderCard("), html.indexOf("function renderCardIntoSvg("));
  assert.doesNotMatch(screen, /hideGroupedEquation/);
});
