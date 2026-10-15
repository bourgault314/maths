import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* ÉquaSplat, 29/09/2026 (choix de Gwenaël) :
   - les taches se déplacent comme les jetons ; rien ne se pose sur rien ;
   - 𝑥 posé sur −𝑥 ouvre « 𝑥 + (−𝑥) = ? », l'élève écrit 0 et la paire disparaît ;
   - Décomposer ne propose plus de sommes ; Partager dit « 3 parts » et l'élève tape la part ;
   - Regrouper 13 et −13 : le 0 disparaît, comme en glissant ;
   - une ligne trop longue rapetisse, sinon elle passe à la ligne avant un signe.
   Les tests de placement EXÉCUTENT les vraies fonctions de la page. */

const html = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

function source(nom){
  const debut = html.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}

/* Le moteur de placement des taches, sur le plateau d'ordinateur (getTrayForSide). */
const TRAY = {x:40, y:24, w:720, h:772};
function moteur({garderEnleves = true} = {}){
  return Function(`
    const TOKEN_R = 54;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const shouldKeepRemovedPieces = () => ${garderEnleves};
    const tokenRadius = () => TOKEN_R;
    ${html.match(/^  const SPLAT_ESPACE = [^\n]*;/m)[0]}
    ${html.match(/^  const SPLAT_AISE = [^\n]*;/m)[0]}
    ${["tokenAreaForTray", "splatHasOwnPlace", "clampSplatCenter", "splatSpotIsFree",
       "freeSplatSpot", "tokenObstaclesFor", "placeSplats"].map(source).join("\n")}
    return { placeSplats, freeSplatSpot, splatSpotIsFree, SPLAT_ESPACE, TOKEN_R };
  `)();
}

const R = 84;
function grille(ids){
  // Une grille comme celle de splatPositionsForItems : rangée de taches bien espacées.
  return new Map(ids.map((id, i) => [id, {cx:200 + i * 2.4 * R, cy:200, r:R, rRef:R}]));
}
const distance = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy);

test("tant qu'aucune tache du membre n'a été déplacée, la grille range comme avant", () => {
  const m = moteur();
  const pieces = [{id:"a", type:"x"}, {id:"b", type:"x"}, {id:"t", type:"token", value:5, x:500, y:500}];
  const g = grille(["a", "b"]);
  assert.equal(m.placeSplats(TRAY, pieces, g), g, "la grille est rendue telle quelle");
  assert.ok(!("x" in pieces[0]), "aucune place n'est donnée aux taches");
});

test("une tache déplacée garde sa place, et ses voisines gardent la leur", () => {
  const m = moteur();
  const pieces = [
    {id:"a", type:"x", x:400, y:500},
    {id:"b", type:"x", x:200, y:200},
    {id:"c", type:"x", x:600, y:200},
  ];
  const pos = m.placeSplats(TRAY, pieces, grille(["a", "b", "c"]));
  assert.deepEqual([pos.get("a").cx, pos.get("a").cy], [400, 500]);
  assert.deepEqual([pos.get("b").cx, pos.get("b").cy], [200, 200]);
  assert.deepEqual([pos.get("c").cx, pos.get("c").cy], [600, 200]);
});

test("une tache lâchée près d'une autre se pose avec un peu d'air, sans bousculer les places justes", () => {
  const m = moteur();
  const voisine = {cx:300, cy:300, r:R};
  const spot = m.freeSplatSpot(TRAY, 320, 300, R, [voisine], []);
  assert.ok(Math.hypot(spot.cx - 300, spot.cy - 300) >= 2.5 * R - 1e-9);
  // Deux taches déjà posées à l'écart juste de la grille ne bougent pas.
  const pieces = [{id:"a", type:"x", x:300, y:300}, {id:"b", type:"x", x:300 + m.SPLAT_ESPACE * R, y:300}];
  const pos = m.placeSplats(TRAY, pieces, grille(["a", "b"]));
  assert.deepEqual([pos.get("b").cx, pos.get("b").cy], [300 + m.SPLAT_ESPACE * R, 300]);
});

test("deux taches ne se retrouvent jamais l'une sur l'autre", () => {
  const m = moteur();
  // Plateau redimensionné, ou taches regrossies : deux places qui se touchent.
  const pieces = [{id:"a", type:"x", x:300, y:300}, {id:"b", type:"x", x:320, y:310}];
  const pos = m.placeSplats(TRAY, pieces, grille(["a", "b"]));
  assert.deepEqual([pos.get("a").cx, pos.get("a").cy], [300, 300], "la première ne bouge pas");
  assert.ok(distance(pos.get("a"), pos.get("b")) >= m.SPLAT_ESPACE * R - 1e-9, "la seconde glisse à côté");
});

test("une tache ajoutée dans un membre rangé à la main évite les taches et les jetons", () => {
  const m = moteur();
  const pieces = [
    {id:"a", type:"x", x:200, y:200},
    {id:"t", type:"token", value:24, x:402, y:200},   // posé sur la case de grille de la nouvelle
    {id:"n", type:"x"},                                 // « Ajouter 𝑥 » : pas encore de place
  ];
  const pos = m.placeSplats(TRAY, pieces, grille(["a", "n"]));
  const n = pos.get("n");
  assert.ok(n, "la nouvelle tache est placée");
  assert.ok(distance(n, pos.get("a")) >= m.SPLAT_ESPACE * R - 1e-9);
  assert.ok(Math.hypot(n.cx - 402, n.cy - 200) >= R + m.TOKEN_R + 18 - 1e-9, "pas sur le jeton");
  assert.deepEqual([pieces[1].x, pieces[1].y], [402, 200], "le jeton n'a pas bougé");
  assert.deepEqual([pieces[2].x, pieces[2].y], [n.cx, n.cy], "elle garde désormais cette place");
});

test("lâchée sur un jeton, la tache glisse à la place libre la plus proche", () => {
  const m = moteur();
  const jeton = {cx:400, cy:400, r:54};
  const spot = m.freeSplatSpot(TRAY, 400, 400, R, [], [jeton]);
  assert.ok(spot);
  const d = Math.hypot(spot.cx - jeton.cx, spot.cy - jeton.cy);
  assert.ok(d >= R * 1.08 + 54 + 24 - 1e-9, "elle ne touche pas le jeton, avec un peu d'air");
  assert.ok(d <= R * 1.08 + 54 + 24 + R * 0.2 * 1.5, "et elle reste juste à côté");
  // Sur une place libre, elle reste où on l'a lâchée.
  assert.deepEqual(m.freeSplatSpot(TRAY, 400, 400, R, [], []), {cx:400, cy:400});
});

test("une tache enlevée et masquée ne gêne pas celles qu'on déplace", () => {
  const m = moteur({garderEnleves:false});
  const pieces = [{id:"a", type:"x", x:300, y:300, removed:true}, {id:"b", type:"x", x:310, y:300}];
  const pos = m.placeSplats(TRAY, pieces, grille(["a", "b"]));
  assert.equal(pos.has("a"), false, "la tache masquée n'est pas dessinée");
  assert.deepEqual([pos.get("b").cx, pos.get("b").cy], [310, 300], "l'autre reste là où on l'a posée");
});

test("glisser : les taches se prennent comme les jetons, et passent au-dessus du reste", () => {
  assert.match(source("beginTokenDrag"), /item\.type !== "token" && item\.type !== "x"/);
  assert.match(source("drawItem"), /if\(item\.type === "token" \|\| item\.type === "x"\)\{\s*g\.addEventListener\("pointerdown"/);
  assert.match(source("moveTokenDrag"), /dragState\.type === "x"\s*\? clampSplatCenter/);
  assert.match(source("moveTokenDrag"), /g\.parentNode\.appendChild\(g\);\s*try\{ g\.setPointerCapture\(e\.pointerId\); \}/);
  assert.match(source("endTokenDrag"), /if\(piece && piece\.type === "x"\)\{\s*endSplatDrag\(ds, piece\);/);
  // Au premier déplacement, tout le membre garde sa place (la page ne range plus derrière l'élève).
  assert.match(source("endSplatDrag"), /pinSplatsOfSide\(ds\.side\);/);
  // Les jetons évitent les taches là où elles sont vraiment.
  assert.match(source("avoidSplatsOnDrop"), /currentSplatPositions\(tray, items\)/);
  assert.match(source("layoutItems"), /placeSplats\(tray, splatLayoutItems, splatPositionsForItems\(tray, splatLayoutItems\)\)/);
});

test("le clic qui suit un glisser ne bloque plus le toucher suivant", () => {
  assert.match(source("suppressClickAfterDrag"), /setTimeout\(\(\) => \{ if\(suppressNextClickFor === id\) suppressNextClickFor = null; \}, 0\);/);
  assert.doesNotMatch(source("endTokenDrag"), /suppressNextClickFor = ds\.id/);
});

test("𝑥 posé sur −𝑥 : la petite fenêtre, puis la paire disparaît", () => {
  const candidat = source("findSplatFusionCandidate");
  assert.match(candidat, /!oppositeXEnabled\(\)/);
  assert.match(candidat, /xSign\(other\) === xSign\(dragged\)\) continue;/, "𝑥 sur 𝑥 : rien");
  const fenetre = source("openFusionDialog");
  // 15/10/2026 : un seul mot, « Regrouper » (la fenêtre s'appelait « Fusionner deux taches »).
  assert.match(fenetre, /title\.textContent = "Regrouper";\s*if\(fusionLabel\) fusionLabel\.textContent = "Somme des deux taches";/);
  assert.match(fenetre, /\$\{escapeHtml\(xPieceLabel\(positive\)\)\} \+ \(\$\{escapeHtml\(xPieceLabel\(negative\)\)\}\) = \?/);
  assert.match(fenetre, /kind:"x", expected:0/);
  assert.match(source("applyFusion"), /if\(pendingFusion\.kind === "x"\)\{\s*applySplatFusion\(\);/);
  const fusion = source("applySplatFusion");
  assert.match(fusion, /pushHistory\(\);/);
  assert.match(fusion, /replaceWithTransientZero\(side, new Set\(\[sourceId, targetId\]\), at\)/);
  assert.match(fusion, /recordSimplifyStep\(\);/);
  assert.match(fusion, /setTimeout\(\(\) => removeTransientZero\(side, zero\.id\), 950\);/);
  // Regrouper et « Annuler la paire » restent.
  assert.match(source("applyGroup"), /applyZeroXGroup\(info\);/);
  assert.match(html, /function cancelZeroXPair\(\)/);
});

test("Regrouper 13 et −13 : le 0 apparaît puis disparaît, comme en glissant", () => {
  const groupe = source("applyGroup");
  assert.match(groupe, /if\(info\.sum === 0\) merged\.transientZero = true;/);
  assert.match(groupe, /setTimeout\(\(\) => removeTransientZero\(info\.side, merged\.id\), 950\);/);
});

test("une case vide ne passe plus pour 0", () => {
  // Number("") vaut 0 : devant 13 et −13, une case vide était acceptée.
  for(const nom of ["applyGroup", "applyFusion", "applyShareInput"]){
    assert.match(source(nom), /if\(!raw(Answer)? \|\| !Number\.isFinite\(answer\)/, nom);
  }
});

test("Partager : le bouton dit combien de parts, l'élève tape la part", () => {
  const ouvrir = source("openShareDialog");
  assert.match(ouvrir, /\$\{n\} parts<\/button>/);
  assert.doesNotMatch(html, /parts de \$\{/);
  const valider = source("applyShareInput");
  assert.match(valider, /answer !== pendingShare\.value \/ pendingShare\.count/);
  assert.match(valider, /Ce n’est pas encore la bonne part\./);
  assert.match(valider, /applySharedTokenSplit\(side, id, count, answer\);/);
  assert.match(html, /<input id="sharePartInput" type="number" inputmode="numeric" autocomplete="off" \/>/);
  assert.match(html, /bindTouchKeypadInput\(sharePartInput, shareDialog, \(\) => sharePartKeypadOptions\(\)\);/);
});

/* Une ligne trop longue ne se coupe qu'avant un signe : chaque terme est d'un seul tenant. */
const memberHtml = Function(`
  ${source("escapeHtml")}
  ${source("memberHtml")}
  return memberHtml;
`)();
const termes = (texte) => [...memberHtml(texte).matchAll(/<span class="terme">(.*?)<\/span>/g)].map(m => m[1]);

test("un membre s'écrit terme par terme, le signe avec son nombre", () => {
  assert.deepEqual(termes("2𝑐 − 𝑐 + 14 + 22"), ["2𝑐", "− 𝑐", "+ 14", "+ 22"]);
  assert.deepEqual(termes("−4 − 2 + 13"), ["−4", "− 2", "+ 13"]);
  assert.deepEqual(termes("3 × 4 + 2"), ["3 × 4", "+ 2"]);
  assert.deepEqual(termes("−3 × 4"), ["−3 × 4"]);
  assert.deepEqual(termes("𝑥 + (−4)"), ["𝑥", "+ (−4)"]);
  assert.deepEqual(termes("7"), ["7"]);
  // Le texte lu ne change pas.
  const lu = memberHtml("2𝑐 − 𝑐 + 14 + 22").replace(/<[^>]+>/g, "");
  assert.equal(lu, "2𝑐 − 𝑐 + 14 + 22");
});

test("rapetisser d'abord ; si ça ne tient toujours pas, taille normale et coupure avant un signe", () => {
  assert.match(html, /\.equationRow \.terme\{\s*white-space:nowrap;\s*\}/);
  assert.match(html, /\.equationList\.mesureSurUneLigne \.lhs,\s*\.equationList\.mesureSurUneLigne \.rhs\{\s*white-space:nowrap !important;/);
  // fitEquationText est partagé avec ÉquaBarre (equabarre-operations-verticales) : la fin du
  // réglage est propre à ÉquaSplat.
  const rendu = source("renderEquationHistory");
  assert.match(rendu, /equationList\.classList\.add\("mesureSurUneLigne"\);\s*if\(fitEquationText\(/);
  assert.match(rendu, /if\(finishEquationFit\(equationList\)\) drawOperationArrowsOverlay\(\);/);
  const fin = source("finishEquationFit");
  assert.match(fin, /taille = Math\.max\(plancher, taille \* ratio \* 0\.98\);/);
  assert.match(fin, /if\(ratio < 1\) list\.style\.removeProperty\("font-size"\);/);
  assert.match(fin, /finally\{\s*list\.classList\.remove\("mesureSurUneLigne"\);/);
  // Plus de coupure au milieu d'un nombre en vue « À côté ».
  assert.doesNotMatch(html, /overflow-wrap:anywhere/);
  assert.match(source("renderEquationHistory"), /<span class="lhs">\$\{memberHtml\(lhs\)\}<\/span>/);
});
