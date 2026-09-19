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

test("le report sur la table de dessin ne fait aucun tirage et ne touche pas les cartes aux tables et rayons identiques", () => {
  const relocate = functionSource("relocateNumberedTokensToFinalSplats", "assignPositions");
  assert.match(relocate, /if\(sameSplats\(card\._splats, splatsFinal\) && beadRDrawn === card\._beadR\) return;/);
  assert.doesNotMatch(relocate, /rng|Math\.random|rFloat/);
  const units = functionSource("assignPositionsUnits", "shouldGenerateEmptyTaskCase");
  const tail = units.slice(units.indexOf("if(!sameSplats(splats, splatsFinal))"));
  assert.doesNotMatch(tail, /rng\(|Math\.random|rFloat/);
  assert.match(tail, /nudgeTokenFree\(p\.cx, p\.cy, okFinal\)/);
  // l'écran et l'impression dessinent card._splats : la table de dessin est bien celle posée à la fin
  assert.match(relocate, /card\._splats = splatsFinal;/);
  assert.match(tail, /card\._splats = splatsFinal;/);
});

/* Lot B3 : rayon DESSINÉ des jetons numérotés à 60 % de la tache quand aucune tache ne
   cache deux paquets ; le tirage (numberedBeadRadius) ne change pas. */
test("B3 : le rayon dessiné des jetons numérotés grossit à 3, 4, 5 et 6 taches, sans toucher au tirage", () => {
  const geo3 = Function(`
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    ${functionSource("getTrayConfig", "getPrintTrayConfig")}
    ${functionSource("getNumberedSplatsLegacy", "getNumberedSplats")}
    ${functionSource("getNumberedSplats", "sameSplats")}
    ${functionSource("numberedBeadRadius", "nudgeTokenFree")}
    ${functionSource("numberedBeadRadiusDrawn", "relocateNumberedTokensToFinalSplats")}
    return { getNumberedSplats, numberedBeadRadius, numberedBeadRadiusDrawn };
  `)();
  const un = (n) => Array.from({length:n}, () => [5]);      // un paquet sous chaque tache
  const deux = (n) => [[5, 5]].concat(Array.from({length:n-1}, () => [5]));
  for(const [n, base, drawn] of [[1, 68, 68], [2, 68, 68], [3, 58, 68], [4, 56, 67], [5, 51, 61], [6, 41, 49]]){
    const sp = geo3.getNumberedSplats(n, "N");
    assert.equal(geo3.numberedBeadRadius(sp, "N"), base, `tirage à ${n} taches`);
    assert.equal(geo3.numberedBeadRadiusDrawn(sp, "N", un(n)), drawn, `dessin à ${n} taches`);
    assert.equal(geo3.numberedBeadRadiusDrawn(sp, "N", deux(n)), base, `deux paquets sous une tache à ${n}`);
    // le jeton dessiné tient sous la tache, à son endroit le plus étroit (0,70 r), avec son décalage de 10 au plus
    assert.ok(drawn + 10 <= 0.70 * sp[0].r, `sous la tache à ${n} taches`);
  }
  // l'Enquête et le mode D gardent leur rayon
  const spC = geo3.getNumberedSplats(3, "C");
  assert.equal(geo3.numberedBeadRadiusDrawn(spC, "C", un(3)), geo3.numberedBeadRadius(spC, "C"));
  // le report tente le rayon dessiné puis retombe sur le rayon de base si un jeton visible ne trouve pas de place
  const relocate = functionSource("relocateNumberedTokensToFinalSplats", "assignPositions");
  assert.match(relocate, /let done = attempt\(beadRDrawn\);/);
  assert.match(relocate, /if\(!done && beadRDrawn !== beadRBase\) done = attempt\(beadRBase\);/);
  assert.match(relocate, /if\(sameSplats\(card\._splats, splatsFinal\) && beadRDrawn === card\._beadR\) return;/);
  assert.doesNotMatch(relocate, /rng|Math\.random|rFloat/);
  // le tirage passe toujours par le rayon de base
  assert.match(functionSource("assignPositionsNumbered", "numberedBeadRadiusDrawn"), /const beadR = numberedBeadRadius\(splats, card\.family\)/);
});

/* Lot B3 : en B±, le mot « opposé » d'une tache dévoilée est posé au-dessus du jeton. À
   0,65 r du centre, ses lettres passaient sur le trait du haut de la tache : il descend de
   7, ce que permet le jeton posé au centre (test suivant). Un jeton plus gros que le rayon
   de base le ferait alors mordre : une carte qui a une tache « opposé » garde ce rayon. */
test("B3 : une carte B± qui a une tache « opposé » garde le rayon de base, et le mot baissé reste dans la tache", () => {
  const geo4 = Function(`
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    ${functionSource("getTrayConfig", "getPrintTrayConfig")}
    ${functionSource("getNumberedSplatsLegacy", "getNumberedSplats")}
    ${functionSource("getNumberedSplats", "sameSplats")}
    ${functionSource("numberedBeadRadius", "nudgeTokenFree")}
    ${functionSource("numberedBeadRadiusDrawn", "relocateNumberedTokensToFinalSplats")}
    return { getNumberedSplats, numberedBeadRadiusDrawn };
  `)();
  for(const [n, base, drawn] of [[1, 68, 68], [2, 68, 68], [3, 58, 68], [4, 56, 67], [5, 51, 61], [6, 41, 49]]){
    const sp = geo4.getNumberedSplats(n, "NPM");
    const un = Array.from({length: n}, () => [5]);
    const uneOpposee = Array.from({length: n}, (_, i) => i === n - 1);
    const aucune = Array.from({length: n}, () => false);
    assert.equal(geo4.numberedBeadRadiusDrawn(sp, "NPM", un, uneOpposee), base, `une tache « opposé » à ${n} taches`);
    assert.equal(geo4.numberedBeadRadiusDrawn(sp, "NPM", un, aucune), drawn, `aucune tache « opposé » à ${n} taches`);
  }
  // le report transmet bien les taches « opposé » de la carte
  const relocate = functionSource("relocateNumberedTokensToFinalSplats", "assignPositions");
  assert.match(relocate, /numberedBeadRadiusDrawn\(splatsFinal, card\.family, card\._num && card\._num\.hiddenByTask, card\._num && card\._num\.opposedTasks\)/);
  // le mot dévoilé descend de 7 sous sa place d'avant (0,65 du rayon au-dessus du centre), à l'écran (2) et à l'impression (2)
  assert.match(html, /const OPPOSE_MOT_BAISSE = 7;/);
  assert.equal((html.match(/s\.r\*0\.65 \+ OPPOSE_MOT_BAISSE\) : \(s\.cy/g) || []).length, 4);
  assert.doesNotMatch(html, /s\.r\*0\.65\) : \(s\.cy/);
});

/* Lot B3 : en B et B±, le jeton caché sous une tache est dessiné exactement au centre. Le
   petit décalage (10 au plus) est toujours tiré, pour que la suite du hasard et donc les
   nombres des séries ne bougent pas, mais il n'est plus appliqué. L'Enquête le garde. */
test("B3 : en B et B±, le jeton caché est au centre de sa tache, et le hasard est consommé comme avant", () => {
  const geo5 = Function(`
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const rFloat = (rng, a, b) => a + rng() * (b - a);
    ${functionSource("getTrayConfig", "getPrintTrayConfig")}
    ${functionSource("getNumberedSplatsLegacy", "getNumberedSplats")}
    ${functionSource("getNumberedSplats", "sameSplats")}
    ${functionSource("sameSplats", "numberedBeadRadius")}
    ${functionSource("numberedBeadRadius", "nudgeTokenFree")}
    ${functionSource("nudgeTokenFree", "randomComposition")}
    ${functionSource("assignPositionsNumbered", "numberedBeadRadiusDrawn")}
    ${functionSource("numberedBeadRadiusDrawn", "relocateNumberedTokensToFinalSplats")}
    ${functionSource("relocateNumberedTokensToFinalSplats", "assignPositions")}
    return { assignPositionsNumbered, getNumberedSplats };
  `)();
  const hasardCompte = () => { let n = 0; const f = () => { n++; return 0.5; }; f.tirages = () => n; return f; };
  for(const family of ["N", "NPM"]){
    for(const n of [1, 2, 3, 4, 5, 6]){
      const card = { family, visible: [], hidden: Array(n).fill(4), _num: { tasks: n, hiddenByTask: Array.from({length: n}, () => [4]) } };
      const rng = hasardCompte();
      geo5.assignPositionsNumbered(card, rng);
      assert.equal(rng.tirages(), 2 * n, `${family}, ${n} taches : direction et décalage toujours tirés`);
      assert.deepEqual(card._posH.map(p => [p.cx, p.cy]), geo5.getNumberedSplats(n, family).map(s => [s.cx, s.cy]), `${family}, ${n} taches : jetons au centre`);
    }
  }
  const enquete = { family: "C", visible: [], hidden: [4, 4, 4], _num: { tasks: 3, hiddenByTask: [[4], [4], [4]] } };
  geo5.assignPositionsNumbered(enquete, hasardCompte());
  const centres = geo5.getNumberedSplats(3, "C");
  assert.ok(enquete._posH.every((p, i) => Math.hypot(p.cx - centres[i].cx, p.cy - centres[i].cy) > 1), "l'Enquête garde son décalage");
});
