import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Petit SPLAT! — menu et modes « Enquête / Système » (26/09/2026).
   Les générateurs des Enquêtes et du Système sont rejoués hors navigateur :
   on découpe dans la page les morceaux de script qui les portent. */
const petit = readFileSync(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");

function morceau(debut, fin) {
  const a = petit.indexOf(debut);
  const b = petit.indexOf(fin, a);
  assert.ok(a > 0 && b > a, `morceau introuvable : ${debut}`);
  return petit.slice(a, b);
}

function generateur(reglages = {}) {
  const valeurs = { relKmax: "2", relVocab: "fois", relStructure: "pivot", ...reglages.selects };
  const coches = { relOpAdd: true, relOpMult: true, giveOnePart: false, ...reglages.coches };
  const document = {
    getElementById(id) {
      if (id in coches) return { checked: coches[id] };
      if (id in valeurs) return { value: valeurs[id] };
      return null;
    }
  };
  const ctx = vm.createContext({ document, Math });
  vm.runInContext(
    morceau("const SPLAT_SHAPES = [", "const PRINT_MATHS_GO_LOGO_SRC") +
    "let currentRand = Math.random;\n" +
    morceau("function hashSeed(seed) {", "function makeAutoSeed() {") +
    morceau("const RELATION_LEVELS = {", "function onContenuChange() {") +
    morceau("const RELATION_DELTA_BY_TARGET", "function createItem(") +
    "function generateDotPositions() { return { arr: [], r: 8 }; }\n" +
    "function generateHiddenDotsBySplat() { return []; }\n" +
    "globalThis.__graine = (g) => { currentRand = mulberry32(hashSeed(g)); };\n" +
    "globalThis.__ancien = (n) => { relationLegacyLevel = n; };\n" +
    "globalThis.__gen = { createRelation2Item, createRelation3Item, createSums3Item };",
    ctx
  );
  return ctx;
}

/* Relit une phrase d'indice et vérifie qu'elle dit vrai sur la carte. */
const MULTIPLES = { "le double": 2, "le triple": 3, "le quadruple": 4 };
const FRACTIONS = { "la moitié": 2, "le tiers": 3, "le quart": 4 };
function phraseJuste(carte, phrase) {
  const v = (nom) => carte.parts.find((p) => p.label === nom).value;
  const t = phrase.replace(/ /g, " ");
  let m;
  if ((m = t.match(/^Sous la tache (\w+), il y a (\d+) fois plus de jetons que sous la tache (\w+)\.$/))) return v(m[1]) === +m[2] * v(m[3]);
  if ((m = t.match(/^Sous la tache (\w+), il y a (\d+) fois moins de jetons que sous la tache (\w+)\.$/))) return v(m[1]) * +m[2] === v(m[3]);
  if ((m = t.match(/^Sous la tache (\w+), il y a (le double|le triple|le quadruple) des jetons de la tache (\w+)\.$/))) return v(m[1]) === MULTIPLES[m[2]] * v(m[3]);
  if ((m = t.match(/^Sous la tache (\w+), il y a (la moitié|le tiers|le quart) des jetons de la tache (\w+)\.$/))) return v(m[1]) * FRACTIONS[m[2]] === v(m[3]);
  if ((m = t.match(/^Sous la tache (\w+), il y a (\d+) (jetons?) de plus que sous la tache (\w+)\.$/))) return v(m[1]) === v(m[4]) + +m[2] && (+m[2] > 1) === (m[3] === "jetons");
  if ((m = t.match(/^Sous la tache (\w+), il y a (\d+) (jetons?) de moins que sous la tache (\w+)\.$/))) return v(m[1]) + +m[2] === v(m[4]) && (+m[2] > 1) === (m[3] === "jetons");
  return false;
}

test("le menu : quatre types renommés, valeurs internes inchangées", () => {
  assert.match(petit, /<option value="classic" selected data-i18n="module_classic">Petit Splat classique<\/option>/);
  assert.match(petit, /<option value="relation2" data-i18n="module_relation2">Enquête à 2 taches<\/option>/);
  assert.match(petit, /<option value="relation3" data-i18n="module_relation3">Enquête à 3 taches<\/option>/);
  assert.match(petit, /<option value="sums3" data-i18n="module_sums3">Système : sommes de taches<\/option>/);
  assert.match(petit, /module_relation2: "Investigation with 2 splats"/);
  assert.doesNotMatch(petit, /id="relationLevel"/, "le menu « Niveau » a disparu");
  assert.doesNotMatch(petit, /Relation entre 2 taches|Défi : sommes de taches/);
});

test("le menu : la mise en page ne montre que les choix possibles, 4 cases pour les Enquêtes et le Système", () => {
  assert.match(petit, /classic: {3}\['3x4', '3x3', '2x4'\]/);
  assert.match(petit, /relation2: \['3x3', '2x2'\]/);
  assert.match(petit, /relation3: \['2x3', '2x2'\]/);
  assert.match(petit, /sums3: {5}\['2x3', '2x2'\]/);
  assert.match(petit, /section\.style\.display = choices\.length > 1 \? '' : 'none'/);
  assert.doesNotMatch(petit, /opt2x3\.disabled|opt3x4\.disabled/, "plus d'options grisées");
  assert.match(petit, /\.grid-2x2 \.cell:nth-child\(n\+3\)/);
});

test("le menu : 🔗 à côté du dé, « Lien copié » à la place de « graine automatique »", () => {
  const ligne = morceau('<div class="seed-row">', "</div>");
  assert.match(ligne, /onclick="newAutoSeed\(\)"[^>]*>🎲<\/button>/);
  assert.match(ligne, /class="seed-btn" id="shareBtn" onclick="copyShareLink\(\)"[^>]*>🔗<\/button>/);
  assert.match(petit, /\.seed-row \{ display: grid; grid-template-columns: 1fr 38px 38px;/);
  assert.doesNotMatch(petit, /Copier le lien<\/button>|class="share-actions"/);
  assert.match(petit, /link_copied: "Lien copié\\u00a0!"/);
  assert.match(morceau("function showShareFeedback(", "async function copyShareLink"), /getElementById\('seedStatus'\)[\s\S]*\}, 2000\);/);
});

test("le menu : plus de mention « Sans cookie ni traceur » (retirée des applis le 23/10/2026), le titre imprimé finit la partie qui défile", () => {
  const titre = petit.indexOf('id="activityLabel"');
  const boutons = petit.indexOf('<div class="actions">');
  assert.ok(titre > 0 && boutons > titre);
  assert.doesNotMatch(petit, /menuConsent|data-mathsgo-confidentialite|Sans cookie ni traceur|<script[^>]*mention-confidentialite\.js/);
});

test("phrases de SPLAT! : « Sous la tache …, il y a … » et le vocabulaire double / moitié", () => {
  const ctx = generateur();
  const p = (code) => vm.runInContext(code, ctx);
  assert.equal(p("multPhrase('grand-fois', 'orange', 'noire', 3)"), "Sous la tache orange, il y a 3 fois plus de jetons que sous la tache noire.");
  assert.equal(p("multPhrase('petit-fois', 'orange', 'noire', 3)"), "Sous la tache noire, il y a 3 fois moins de jetons que sous la tache orange.");
  assert.equal(p("multPhrase('grand-mot', 'orange', 'noire', 4)"), "Sous la tache orange, il y a le quadruple des jetons de la tache noire.");
  assert.equal(p("multPhrase('petit-mot', 'orange', 'noire', 4)"), "Sous la tache noire, il y a le quart des jetons de la tache orange.");
  assert.equal(p("addPhrase('plus', 'orange', 'noire', 4)"), "Sous la tache orange, il y a 4 jetons de plus que sous la tache noire.");
  assert.equal(p("addPhrase('moins', 'orange', 'noire', 1)"), "Sous la tache noire, il y a 1 jeton de moins que sous la tache orange.");
});

test("générateurs : chaque indice dit vrai, pour tous les réglages", () => {
  const opsListe = [{ relOpAdd: true, relOpMult: false }, { relOpAdd: false, relOpMult: true }, { relOpAdd: true, relOpMult: true }];
  for (const coches of opsListe) for (const kmax of ["2", "3", "4"]) for (const vocab of ["fois", "mots", "mix"]) for (const structure of ["pivot", "chain", "mix"]) {
    const ctx = generateur({ coches, selects: { relKmax: kmax, relVocab: vocab, relStructure: structure } });
    for (const cible of [20, 50, 100]) {
      vm.runInContext(`__graine("t${kmax}${vocab}${structure}${cible}")`, ctx);
      for (let i = 0; i < 25; i++) {
        for (const carte of [ctx.__gen.createRelation2Item(cible), ctx.__gen.createRelation3Item(cible)]) {
          assert.equal(carte.total, carte.visible + carte.parts.reduce((s, x) => s + x.value, 0));
          assert.ok(carte.parts.every((x) => x.value >= 1));
          for (const phrase of carte.clues) {
            assert.ok(phraseJuste(carte, phrase), `${phrase} ${JSON.stringify(carte.parts.map((x) => x.value))}`);
            if (!coches.relOpMult) assert.doesNotMatch(phrase, /fois|double|moitié|triple|tiers|quart/);
            if (!coches.relOpAdd) assert.doesNotMatch(phrase, /de plus|de moins/);
            if (vocab === "fois") assert.doesNotMatch(phrase, /double|moitié|triple|tiers|quadruple|quart/);
            if (vocab === "mots") assert.doesNotMatch(phrase, /fois/);
            const k = phrase.match(/(\d) fois/);
            if (k) assert.ok(+k[1] <= +kmax);
          }
          if (carte.kind === "relation3" && structure === "chain") assert.equal(carte.structure, "chain");
          if (carte.kind === "relation3" && structure === "pivot") assert.equal(carte.structure, "pivot-variable");
        }
      }
    }
  }
});

test("Système : la cible max règle la plage des nombres cachés", () => {
  const ctx = generateur();
  vm.runInContext('__graine("systeme")', ctx);
  const plus = { 20: 0, 50: 0, 100: 0 };
  for (const cible of [20, 50, 100]) for (let i = 0; i < 60; i++) {
    const c = ctx.__gen.createSums3Item(cible);
    assert.ok(c.total <= Math.max(20, cible));
    assert.equal(new Set(c.parts.map((x) => x.value)).size, 3);
    plus[cible] = Math.max(plus[cible], ...c.parts.map((x) => x.value));
  }
  assert.ok(plus[20] <= 9 && plus[50] <= 20 && plus[100] <= 28 && plus[100] > plus[20]);
});

test("anciennes adresses « level= » : traduites, et l'ancien niveau rejoué à l'identique", () => {
  assert.match(petit, /simple: {3}\{ kmax: '2', structure: 'pivot', pivotNoire: true, {2}deltaLimit: 6, {2}baseDivisor: 5, sums: 'simple' \}/);
  assert.match(petit, /advanced: \{ kmax: '3', structure: 'pivot', pivotNoire: false, deltaLimit: 10, baseDivisor: 6, sums: 'advanced' \}/);
  assert.match(petit, /expert: {3}\{ kmax: '4', structure: 'mix', {3}pivotNoire: false, deltaLimit: 12, baseDivisor: 7, sums: 'expert' \}/);
  assert.match(petit, /setSelectValue\('relVocab', 'mix'\)/);
  const ctx = generateur({ selects: { relKmax: "4", relStructure: "chain" } });
  ctx.__ancien("simple");
  vm.runInContext('__graine("ancien")', ctx);
  for (let i = 0; i < 40; i++) {
    const c = ctx.__gen.createRelation3Item(20);
    assert.equal(c.pivotId, "A", "level=simple : le pivot est toujours la tache noire");
    assert.equal(c.structure, "pivot-fixed");
    for (const phrase of c.clues) assert.doesNotMatch(phrase.replace(/ /g, " "), /[34] fois|triple|tiers|quadruple|quart/);
  }
});

test("le parcours élève des Enquêtes et du Système n'existe toujours pas", () => {
  assert.match(petit, /Le parcours élève n\\u2019existe pas encore pour les enquêtes et relations/);
});

test("interactif : dans les Enquêtes et le Système, le schéma ne se remplit qu'au clic", () => {
  const cellule = morceau("function renderRelationCell(", "function createPageElement(");
  assert.match(cellule, /const revealParts = isTBI && !isCorrectionPage;/);
  assert.match(cellule, /getRelationValueDisplay\(display, revealParts && !isGivenPart\)/);
  assert.match(cellule, /const displayTotal = isCorrectionPage \? item\.total : \(revealParts \? getRelationValueDisplay\(item\.total, true\) : ''\);/);
  assert.match(petit, /\.hidden-val \{ opacity: 0;/);
  assert.match(petit, /\.tbi-mode\.revealed \.hidden-val \{ opacity: 1; \}/);
});
