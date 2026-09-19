import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* Lot B2 « les taches ne se touchent plus à 4 et 5 » (Splat classique) : la table de
   tirage (ancienne) reste celle qui consomme le hasard, la table de dessin (nouvelle)
   n'est appliquée qu'après, sans tirage. Les séries existantes gardent leurs nombres. */

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `la fonction ${name} doit exister`);
  const end = nextName ? html.indexOf(`function ${nextName}(`, start + 1) : -1;
  assert.notEqual(end, -1, `la fonction ${nextName} doit suivre ${name}`);
  return html.slice(start, end);
}

/* Les tables et l'aide au décalage, exécutées telles quelles. */
const geo = Function(`
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  ${functionSource("getTrayConfig", "getPrintTrayConfig")}
  ${functionSource("getUnitSplatsLegacy", "getUnitSplats")}
  ${functionSource("getUnitSplats", "getNumberedSplatsLegacy")}
  ${functionSource("getNumberedSplatsLegacy", "getNumberedSplats")}
  ${functionSource("getNumberedSplats", "sameSplats")}
  ${functionSource("sameSplats", "numberedBeadRadius")}
  ${functionSource("numberedBeadRadius", "nudgeTokenFree")}
  ${functionSource("nudgeTokenFree", "randomComposition")}
  return { getUnitSplatsLegacy, getUnitSplats, getNumberedSplatsLegacy, getNumberedSplats, sameSplats, numberedBeadRadius, nudgeTokenFree };
`)();

/* Contour réel d'une tache (blobPath) : rayon × (0,90 + 0,16 sin 5a + 0,04 sin 10a). */
function blobPoints(s){
  return Array.from({length: 180}, (_, i) => {
    const a = Math.PI * 2 * i / 180;
    const k = 0.90 + 0.16 * Math.sin(5 * a) + 0.04 * Math.sin(10 * a);
    return [s.cx + Math.cos(a) * s.r * k, s.cy + Math.sin(a) * s.r * k];
  });
}
function minGap(splats){
  let m = Infinity;
  for(let i = 0; i < splats.length; i++) for(let j = i + 1; j < splats.length; j++){
    for(const p of blobPoints(splats[i])) for(const q of blobPoints(splats[j])) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1]));
  }
  return m;
}
function insideHighTray(splats){
  return splats.every(s => s.cy - 0.74 * s.r >= 210 && s.cy + 1.10 * s.r <= 870 && s.cx - 1.06 * s.r >= 120 && s.cx + 1.06 * s.r <= 1480);
}

test("les tables de tirage sont exactement les anciennes places (le hasard des séries ne bouge pas)", () => {
  assert.deepEqual(geo.getUnitSplatsLegacy(4), [{cx:610, cy:440, r:125},{cx:1030, cy:440, r:125},{cx:610, cy:670, r:125},{cx:1030, cy:670, r:125}]);
  assert.deepEqual(geo.getUnitSplatsLegacy(5), [{cx:820, cy:370, r:95},{cx:560, cy:545, r:95},{cx:1080, cy:545, r:95},{cx:560, cy:720, r:95},{cx:1080, cy:720, r:95}]);
  assert.deepEqual(geo.getNumberedSplatsLegacy(4, "N"), [{cx:610, cy:440, r:130},{cx:1030, cy:440, r:130},{cx:610, cy:670, r:130},{cx:1030, cy:670, r:130}]);
  assert.deepEqual(geo.getNumberedSplatsLegacy(5, "N"), [{cx:540, cy:420, r:120},{cx:820, cy:420, r:120},{cx:1100, cy:420, r:120},{cx:680, cy:680, r:120},{cx:960, cy:680, r:120}]);
  // et le tirage passe bien par elles
  assert.match(functionSource("assignPositionsNumbered", "relocateNumberedTokensToFinalSplats"), /const splats = getNumberedSplatsLegacy\(meta\.tasks, card\.family\)/);
  assert.match(functionSource("assignPositionsUnits", "shouldGenerateEmptyTaskCase"), /const splats = getUnitSplatsLegacy\(tasks\)/);
});

test("les tables de dessin ne diffèrent qu'à 4 et 5 taches, sur le grand plateau", () => {
  for(const n of [1, 2, 3]){
    assert.ok(geo.sameSplats(geo.getUnitSplats(n), geo.getUnitSplatsLegacy(n)), `A à ${n} tache(s)`);
    assert.ok(geo.sameSplats(geo.getNumberedSplats(n, "N"), geo.getNumberedSplatsLegacy(n, "N")), `B à ${n} tache(s)`);
  }
  assert.ok(geo.sameSplats(geo.getNumberedSplats(6, "N"), geo.getNumberedSplatsLegacy(6, "N")));
  for(const n of [4, 5]){
    assert.ok(!geo.sameSplats(geo.getUnitSplats(n), geo.getUnitSplatsLegacy(n)));
    assert.ok(!geo.sameSplats(geo.getNumberedSplats(n, "N"), geo.getNumberedSplatsLegacy(n, "N")));
    // l'Enquête et le mode D (plateau bas) gardent leurs places
    assert.ok(geo.sameSplats(geo.getNumberedSplats(n, "C"), geo.getNumberedSplatsLegacy(n, "C")));
    assert.ok(geo.sameSplats(geo.getNumberedSplats(n, "D"), geo.getNumberedSplatsLegacy(n, "D")));
  }
});

test("avant : à 4 taches (A, B) et 5 taches (A), les taches dessinées se touchaient", () => {
  assert.ok(minGap(geo.getUnitSplatsLegacy(4)) < 5);
  assert.ok(minGap(geo.getUnitSplatsLegacy(5)) < 5);
  assert.ok(minGap(geo.getNumberedSplatsLegacy(4, "N")) < 5);
});

test("après : au moins 20 unités entre deux taches dessinées, toutes dans le plateau", () => {
  for(const n of [4, 5]){
    assert.ok(minGap(geo.getUnitSplats(n)) >= 20, `A à ${n} taches : ${minGap(geo.getUnitSplats(n))}`);
    assert.ok(minGap(geo.getNumberedSplats(n, "N")) >= 20, `B à ${n} taches : ${minGap(geo.getNumberedSplats(n, "N"))}`);
    assert.ok(insideHighTray(geo.getUnitSplats(n)));
    assert.ok(insideHighTray(geo.getNumberedSplats(n, "N")));
  }
  // rayons : A inchangés, B un cran plus grand à 4 et 5 (jetons numérotés plus gros)
  assert.equal(geo.getUnitSplats(4)[0].r, 125);
  assert.equal(geo.getUnitSplats(5)[0].r, 95);
  assert.equal(geo.getNumberedSplats(4, "N")[0].r, 140);
  assert.equal(geo.getNumberedSplats(5, "N")[0].r, 130);
  assert.equal(geo.numberedBeadRadius(geo.getNumberedSplatsLegacy(4, "N"), "N"), 51);
  assert.equal(geo.numberedBeadRadius(geo.getNumberedSplats(4, "N"), "N"), 56);
  assert.equal(geo.numberedBeadRadius(geo.getNumberedSplatsLegacy(5, "N"), "N"), 46);
  assert.equal(geo.numberedBeadRadius(geo.getNumberedSplats(5, "N"), "N"), 51);
  // les jetons B les plus proches des séries du monde 2 sont à 20 unités : +5 de rayon ne les fait pas se toucher (cf. spirale)
});

test("le décalage d'un jeton est sans hasard et va à la place libre la plus proche", () => {
  const ok = (x, y) => x >= 300;
  assert.deepEqual(geo.nudgeTokenFree(350, 100, ok), {cx:350, cy:100});
  const moved = geo.nudgeTokenFree(285, 100, ok);
  assert.equal(Math.round(moved.cx), 305);
  assert.equal(Math.round(moved.cy), 100);
  // même entrée → même sortie ; rien ne convient → il reste
  assert.deepEqual(geo.nudgeTokenFree(285, 100, ok), moved);
  assert.deepEqual(geo.nudgeTokenFree(10, 10, () => false), {cx:10, cy:10});
});

test("le report sur la table de dessin ne fait aucun tirage et ne touche pas les cartes aux tables identiques", () => {
  const relocate = functionSource("relocateNumberedTokensToFinalSplats", "assignPositions");
  assert.match(relocate, /if\(sameSplats\(card\._splats, splatsFinal\)\) return;/);
  assert.doesNotMatch(relocate, /rng|Math\.random|rFloat/);
  const units = functionSource("assignPositionsUnits", "shouldGenerateEmptyTaskCase");
  const tail = units.slice(units.indexOf("if(!sameSplats(splats, splatsFinal))"));
  assert.doesNotMatch(tail, /rng\(|Math\.random|rFloat/);
  assert.match(tail, /nudgeTokenFree\(p\.cx, p\.cy, okFinal\)/);
  // l'écran et l'impression dessinent card._splats : la table de dessin est bien celle posée à la fin
  assert.match(relocate, /card\._splats = splatsFinal;/);
  assert.match(tail, /card\._splats = splatsFinal;/);
});
