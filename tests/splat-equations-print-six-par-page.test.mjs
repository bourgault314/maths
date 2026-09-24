import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* Lot Q1 « impression de Splat Équations » (monde 5) : bandeau à la couleur du monde,
   sous-titre sur deux lignes, jetons imprimés lisibles en noir et blanc (table de
   dessin : les cartes ne changent pas), réglage 6/page (énoncé seul ; gauche/droite à
   80 %, haut/bas pleine largeur plateau à gauche), paramètre « suite », pied lisible.
   Même recette que le lot B du monde 2 (tests/splat-print-six-par-page.test.mjs). */

const html = await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8");

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `la fonction ${name} doit exister`);
  const end = nextName ? html.indexOf(`function ${nextName}(`, start + 1) : -1;
  assert.notEqual(end, -1, `la fonction ${nextName} doit suivre ${name}`);
  return html.slice(start, end);
}

function constSource(name){
  const m = html.match(new RegExp(`const ${name} = [^;]+;`));
  assert.ok(m, `la constante ${name} doit exister`);
  return m[0];
}

/* getPrintCardsPerPage dépend du sélecteur « Pages » et du plan d'impression. */
function cardsPerPage(layoutValue, printValue){
  const source = functionSource("getPrintCardsPerPage", "isEquationSchemaPrintCard");
  const planSource = functionSource("getPrintPlan", "syncPrintSummary")
    .replace("function getPrintPlan(", "function getPrintPlanSrc(");
  const fn = Function("document", "printCardsPerPageEl", "printModeSelectEl", `
    ${planSource}
    const getPrintPlan = getPrintPlanSrc;
    ${source}
    return getPrintCardsPerPage();
  `);
  const fakeDoc = { getElementById(){ return null; } };
  return fn(fakeDoc, { value: layoutValue }, { value: printValue });
}

/* Les fonctions pures de la table de dessin des jetons, exécutées pour de vrai. */
function tableDeDessin(){
  // (les constantes EQ_PRINT_BEAD_* sont écrites entre eqPrintBeadFontSize et eqPrintBeadBox)
  const src = functionSource("eqPrintOpaqueRing", "eqPrintBeadFontSize")
    + functionSource("eqPrintBeadFontSize", "eqPrintBeadBox")
    + functionSource("eqPrintBeadBox", "eqPrintBeadPlace")
    + functionSource("eqPrintBeadPlace", "eqPrintBeadsFit")
    + functionSource("eqPrintBeadsFit", "eqPrintBeadLayout")
    + functionSource("eqPrintBeadLayout", "eqPrintHiddenBeadRadius")
    + functionSource("eqPrintHiddenBeadRadius", "createEqPrintBeadTable");
  return Function(`${src}
    return { eqPrintOpaqueRing, eqPrintBeadFontSize, eqPrintBeadPlace, eqPrintBeadsFit, eqPrintBeadSlide, eqPrintBeadLayout,
             eqPrintHiddenBeadRadius, EQ_PRINT_BEAD_SCALE, EQ_PRINT_BEAD_SCALE_HAUT_BAS, EQ_PRINT_BEAD_EDGE,
             EQ_PRINT_BEAD_GAP, EQ_PRINT_BEAD_SPLAT_GAP };`)();
}

test("le sélecteur « Pages » propose 6/page, 2/page reste le réglage par défaut, layout=6 et suite passent dans l'adresse", () => {
  assert.match(html, /<option value="6">6\/page<\/option>\s*<option value="4">4\/page<\/option>\s*<option value="2" selected>2\/page<\/option>/);
  assert.match(html, /setSelectFromShare\(params, "layout", printCardsPerPageEl\)/);
  assert.match(html, /addShareControl\(params, "layout", printCardsPerPageEl\)/);
  assert.match(html, /const sharedNames = \[[^\]]*"layout"[^\]]*"suite"\]/);
});

test("6/page vaut pour l'énoncé seul ; schéma ou correction, recto ou verso, retombent sur 4", () => {
  assert.equal(cardsPerPage("6", "statement"), 6);
  assert.equal(cardsPerPage("6", "worksheet"), 4);
  assert.equal(cardsPerPage("6", "correction"), 4);
  assert.equal(cardsPerPage("6", "duplex-worksheet"), 4);
  assert.equal(cardsPerPage("6", "duplex-correction"), 4);
  // les autres réglages ne bougent pas (2/page reste le défaut de Splat Équations)
  assert.equal(cardsPerPage("4", "statement"), 4);
  assert.equal(cardsPerPage("4", "correction"), 4);
  assert.equal(cardsPerPage("2", "statement"), 2);
  assert.equal(cardsPerPage("1", "correction"), 1);
  assert.equal(cardsPerPage("", "statement"), 2);
});

test("la phrase de contrôle annonce le nombre réellement imprimé", () => {
  const summary = functionSource("syncPrintSummary", "getSignedWritingMode");
  assert.match(summary, /const perPage = String\(getPrintCardsPerPage\(\)\)/);
  assert.match(summary, /6\/page vaut pour l’énoncé seul/);
});

test("6/page : grille 2 × 3 ; gauche/droite à 80 %, haut/bas pleine largeur, haut de carte resserré", () => {
  const printSheet = functionSource("printSheet", "waitForPrintAssets");
  assert.match(printSheet, /perSheet === 6 \? "print-6up" : "print-4up"/);
  assert.match(printSheet, /classList\.remove\("print-1up", "print-2up", "print-4up", "print-6up"\)/);
  assert.match(printSheet, /const hautBas = isEquationSchemaPrintCard\(card\);/);
  assert.match(printSheet, /sv\.setAttribute\("viewBox", hautBas \? EQ_PRINT_6UP_VIEWBOX_HB : EQ_PRINT_6UP_VIEWBOX_GD\);/);
  assert.match(printSheet, /if\(hautBas\) sv\.classList\.add\("carte-haut-bas"\);/);
  // 4/2/1 : la carte haute d'avant, inchangée
  assert.match(printSheet, /sv\.setAttribute\("viewBox","0 0 1600 2200"\);\s*sv\.style\.width = "100%";/);
  assert.match(printSheet, /renderCardIntoSvg\(sv, card, mode, \{sixParPage: perSheet === 6\}\)/);
  assert.match(html, /\.printArea\.print-6up \.grid\{grid-template-columns:repeat\(2, 1fr\);grid-template-rows:repeat\(3,minmax\(0,1fr\)\);gap:4mm\}/);
  assert.match(html, /\.printArea\.print-6up \.pCard svg\{width:80%;height:auto;margin:0 auto\}/);
  assert.match(html, /\.printArea\.print-6up \.pCard svg\.carte-haut-bas\{width:100%\}/);
  assert.match(html, /\.printArea\.print-4up \.grid\{grid-template-columns:repeat\(2, 1fr\);grid-template-rows:repeat\(2,minmax\(0,1fr\)\);gap:5mm\}/);
  const orientation = functionSource("syncDynamicPrintPageStyle", "mirrorSlotsForDuplex");
  assert.match(orientation, /perSheet === 2 \? "landscape" : "portrait"/);
});

test("seuls les modes pas à pas en vue Schéma s'impriment en haut/bas", () => {
  const src = functionSource("isEquationSchemaPrintCard", "syncDynamicPrintPageStyle");
  const run = (family, view) => Function("card", "view", `
    function isEquationStepFamily(c){ return !!c && (c.family === "EQSTEP" || c.family === "EQUNITSTEP"); }
    function getEquationStepView(){ return view; }
    ${src}
    return isEquationSchemaPrintCard(card);`)({ family }, view);
  assert.equal(run("EQSTEP", "schema"), true);
  assert.equal(run("EQUNITSTEP", "schema"), true);
  assert.equal(run("EQSTEP", "equation"), false);
  assert.equal(run("EQ", "schema"), false);
  assert.equal(run("EQPMSTEP", "schema"), false);
});

test("6/page, haut resserré (demande de Gwenaël) : la phrase et le plateau tiennent dans la boîte, sans se toucher", () => {
  const num = (nom) => Number(constSource(nom).match(/= ([\d.]+);/)[1]);
  const vb = (nom) => constSource(nom).match(/"([^"]+)"/)[1].split(" ").map(Number);
  const phraseY = num("EQ_PRINT_6UP_PHRASE_Y"), dy = num("EQ_PRINT_6UP_SCHEMA_DY");
  const [, gdY, , gdH] = vb("EQ_PRINT_6UP_VIEWBOX_GD");
  const [, hbY, , hbH] = vb("EQ_PRINT_6UP_VIEWBOX_HB");
  // phrase en gras 44 : de 36 au-dessus de sa ligne de base à 10 en dessous (accent, « q »)
  // gauche/droite : plateaux 190 → 840 (trait 8), barre du milieu de 180 à 850 (bout rond 5)
  assert.ok(phraseY - 36 >= gdY + 8, "gauche/droite : la phrase n'est pas coupée en haut");
  assert.ok(180 - 5 - (phraseY + 10) >= 20, "gauche/droite : au moins 20 entre la phrase et la barre du milieu");
  assert.ok(850 + 5 <= gdY + gdH, "gauche/droite : la barre du milieu tient dans la boîte");
  assert.ok(gdY >= 60, "gauche/droite : le blanc du dessus est bien coupé");
  // haut/bas : phrase à 82, plateaux 76 → 924 (trait 8), descendus de dy
  const hbTop = 76 + dy - 4, hbBas = 924 + dy + 4;
  assert.ok(82 - 36 >= hbY + 8, "haut/bas : la phrase n'est pas coupée en haut");
  assert.ok(hbTop - (82 + 10) >= 20, "haut/bas : au moins 20 entre la phrase et le plateau");
  assert.ok(hbBas <= hbY + hbH, "haut/bas : le plateau du bas tient dans la boîte");
  assert.ok(dy < 150, "haut/bas : les plateaux remontent");

  const stepPrint = functionSource("renderCardEquationStepPrint", "renderCardEquationPrint");
  // haut/bas : phrase centrée sur le plateau (x 60 → 780) en 6/page seulement
  assert.match(stepPrint, /tText\(printOpts\.sixParPage \? 420 : 800, 82, "Même quantité en haut et en bas"/);
  assert.match(stepPrint, /translate\(0 " \+ \(printOpts\.sixParPage \? EQ_PRINT_6UP_SCHEMA_DY : 150\) \+ "\)/);
  assert.match(stepPrint, /introY: printOpts\.sixParPage \? EQ_PRINT_6UP_PHRASE_Y : 78,/);
  const geom = functionSource("buildEquationStepSchemaColumnGeometry", "shiftedEquationPrintGeometryForStep");
  const top = geom.match(/const topTray = \{ x:(\d+), y:(\d+), w:(\d+), h:(\d+) \};/);
  assert.ok(top);
  assert.equal(Number(top[1]) + Number(top[3]) / 2, 420, "phrase au milieu du plateau (x 60 → 780)");
  // gauche/droite : la phrase suit introY dans les deux scènes pas à pas, et printOpts dans Équation
  assert.equal((html.match(/text\(800, Number\(opts\.introY\) \|\| 78, "Même quantité à gauche qu'à droite"/g) || []).length, 2);
  assert.match(functionSource("renderCardEquationPrint", "renderCardIntoSvg"), /tText\(800, printOpts\.sixParPage \? EQ_PRINT_6UP_PHRASE_Y : 78, "Même quantité à gauche qu'à droite"/);
  assert.match(functionSource("renderCardEquationSignedStepPrint", "renderCardEquationStepPrint"), /introY: printOpts\.sixParPage \? EQ_PRINT_6UP_PHRASE_Y : 78,/);
});

test("le bandeau imprimé est au teal du monde 5, violet pour les relatifs ; titre blanc, sous-titre foncé sur deux lignes", () => {
  assert.match(html, /\.print-page-header\{[\s\S]*?background:linear-gradient\(90deg,#08aaa5 0%,#4cc7c3 45%,#e6f7f6 100%\);/);
  assert.match(html, /\.print-page-header--relatifs\{background:linear-gradient\(90deg,#7b42b4 0%,#a77bd3 45%,#f3ecfa 100%\)\}/);
  const header = functionSource("createEquationPrintHeader", "createEquationPrintInstruction");
  assert.match(header, /if\(activityEl && isSignedEquationModeValue\(activityEl\.value\)\) header\.classList\.add\("print-page-header--relatifs"\);/);
  assert.match(html, /\.print-page-title\{font-size:17pt;font-weight:950;color:#fff;/);
  // plus de points de suspension : deux lignes au plus, à la taille d'avant
  assert.match(html, /\.print-page-subtitle\{font-size:11pt;font-weight:850;color:#0f172a;[^}]*-webkit-line-clamp:2;white-space:normal\}/);
  assert.doesNotMatch(html, /\.print-page-subtitle\{[^}]*text-overflow:ellipsis/);
  assert.match(html, /\.print-page-title-block\{min-width:0;display:flex;align-items:center;gap:4mm;line-height:1;flex:1 1 auto\}/);
  assert.doesNotMatch(html, /#ff9815/);
  assert.doesNotMatch(html, /color:#063b7a/);
});

test("le pied est lisible en photocopie, 3 mm sous les cartes, sans changer la taille des cartes 4/2/1", () => {
  assert.match(html, /\.print-page-footer\{flex:0 0 3\.2mm;margin-top:3mm;text-align:center;color:#64748b;font-size:7pt;/);
  assert.doesNotMatch(html, /\.print-page-footer\{[^}]*#98a2b3/);
  assert.match(html, /\.sheet\{[\s\S]*?padding:4mm 5mm 0\.5mm;/);
  assert.match(html, /\.printArea\.print-2up \.sheet\{height:calc\(210mm - 16mm\);padding:3mm 4mm 0\.5mm\}/);
  // ce qui est pris sous la grille : 2 + 3,5 + 1,2 avant, 0,5 + 3,2 + 3 maintenant
  assert.equal(Math.round((0.5 + 3.2 + 3) * 10), Math.round((2 + 3.5 + 1.2) * 10));
  assert.match(functionSource("createEquationPrintFooter", "getPrintCardsPerPage"), /"mathsgo\.re\/splat\/equations · CC BY-NC-SA 4\.0"/);
});

test("à l'impression, cases et plateaux sont gris foncé sur fond blanc (les trois dessins imprimés)", () => {
  assert.match(html, /\.pCard\{border:1\.5px solid #334155;border-radius:6mm;padding:2mm;/);
  const scenes = {
    "pas à pas": functionSource("renderCardEquationStepPrintScene", "renderCardEquationSignedStepPrintScene"),
    "relatifs pas à pas": functionSource("renderCardEquationSignedStepPrintScene", "renderCardEquationSignedStepPrint"),
    "équation": functionSource("renderCardEquationPrint", "renderCardIntoSvg"),
  };
  for(const [nom, src] of Object.entries(scenes)){
    assert.equal((src.match(/rx:30, fill:"#fff", stroke:"#334155",\s*"stroke-width":"8"/g) || []).length, 2, `${nom} : deux plateaux`);
    assert.doesNotMatch(src, /rx:30, fill:"rgba\(0,0,0,0\.02/, nom);
  }
});

test("jetons numérotés imprimés : fond blanc, anneau opaque de la couleur du jeton, nombre plein", () => {
  const t = tableDeDessin();
  assert.equal(t.eqPrintOpaqueRing("hsla(210, 78%, 48%, 0.55)"), "hsla(210, 78%, 48%, 1)");
  assert.equal(t.eqPrintOpaqueRing("hsla(142, 80%, 40%, 0.7)"), "hsla(142, 80%, 40%, 1)");
  assert.equal(t.eqPrintBeadFontSize(7, 61), 61);
  assert.equal(t.eqPrintBeadFontSize(38, 61), 61);
  assert.equal(t.eqPrintBeadFontSize(-12, 61), Math.round(61 * 0.8));   // « -12 » : trois signes
  assert.equal(t.eqPrintBeadFontSize(100, 61), Math.round(61 * 0.8));
  const draw = functionSource("drawEqPrintNumberedBead", "eqUnitCounts");
  assert.match(draw, /fill = "#fff"; stroke = eqPrintOpaqueRing\(beadColorForValue\(it\.val\)\.stroke\); sw = "7";/);
  // jeton caché dévoilé sans l'option vert/rouge : gris, comme au monde 2
  assert.match(draw, /if\(it\.hidden && !useTokens\)\{[\s\S]*?fill = "rgba\(0,0,0,0\.055\)"; stroke = "rgba\(0,0,0,0\.24\)";/);
  // nombre centré : ligne de base à 0,35 em sous le centre (chiffres de 0,7 em)
  assert.match(draw, /mkText\(p\.cx, p\.cy \+ Math\.round\(fontSize \* 0\.35\), String\(it\.val\)/);
});

test("rayon dessiné : ×1,8 quand il y a la place, sinon le plus grand qui tient, jamais moins qu'avant", () => {
  const t = tableDeDessin();
  assert.equal(t.EQ_PRINT_BEAD_SCALE, 1.8);
  assert.equal(t.EQ_PRINT_BEAD_SCALE_HAUT_BAS, 1.3);
  const tray = { x:120, y:190, w:680, h:650 };
  const jeton = (cx, cy, o = {}) => ({ p:{cx, cy}, tray, baseR:34, ...o });
  // deux jetons bien séparés, loin des bords : 34 → 61, à leur place
  let r = t.eqPrintBeadLayout([jeton(300, 720), jeton(560, 720)], [], 34, Infinity);
  assert.equal(r.R, 61);
  assert.deepEqual(r.pts, [{cx:300, cy:720}, {cx:560, cy:720}]);
  // deux jetons proches (100) : ils glissent de côté juste assez (55 en tout), gardent leur
  // hauteur et leur ordre, et prennent ×1,8
  r = t.eqPrintBeadLayout([jeton(300, 720), jeton(400, 720)], [], 34, Infinity);
  assert.equal(r.R, 61);
  assert.deepEqual(r.pts, [{cx:245, cy:720}, {cx:400, cy:720}]);
  assert.equal(r.pts[1].cx - r.pts[0].cx, 2 * 61 + t.EQ_PRINT_BEAD_GAP);
  // plateau trop étroit pour les écarter : le rayon et les places d'avant
  const etroit = { x:120, y:190, w:220, h:650 };
  r = t.eqPrintBeadLayout([jeton(200, 720, {tray:etroit}), jeton(270, 720, {tray:etroit})], [], 34, Infinity);
  assert.equal(r.R, 34);
  assert.deepEqual(r.pts, [{cx:200, cy:720}, {cx:270, cy:720}]);
  // un jeton près de la barre du milieu (bord droit du plateau gauche, x = 800) rentre juste assez
  r = t.eqPrintBeadLayout([jeton(760, 720)], [], 34, Infinity);
  assert.equal(r.R, 61);
  assert.equal(800 - r.pts[0].cx, 61 + t.EQ_PRINT_BEAD_EDGE);
  // une tache juste au-dessus (qui déborde jusqu'à 1,1 × r) : le jeton glisse de côté
  r = t.eqPrintBeadLayout([jeton(300, 720)], [{cx:300, cy:560, r:74}], 34, Infinity);
  assert.equal(r.R, 61);
  assert.equal(r.pts[0].cy, 720);
  assert.ok(Math.hypot(r.pts[0].cx - 300, 720 - 560) - 1.1 * 74 - r.R >= t.EQ_PRINT_BEAD_SPLAT_GAP, "l'écart jeton → tache est tenu");
  // une tache « opposé » dévoilée : la carte garde le rayon de base
  r = t.eqPrintBeadLayout([jeton(300, 720), jeton(560, 720)], [], 34, 34);
  assert.equal(r.R, 34);
  // haut/bas : ×1,3 au plus
  r = t.eqPrintBeadLayout([{ p:{cx:200, cy:300}, tray:{x:60, y:76, w:720, h:424}, baseR:30 }], [], 30, Infinity, 1.3);
  assert.equal(r.R, 39);
  // jeton caché : dans le creux de sa tache, jamais sous le rayon de base
  assert.equal(t.eqPrintHiddenBeadRadius(61, 34, {r:74}), 47);
  assert.equal(t.eqPrintHiddenBeadRadius(40, 34, {r:88}), 40);
  assert.equal(t.eqPrintHiddenBeadRadius(61, 34, {r:30}), 34);
});

test("écarts imprimés (vérification de Code, 24/09) : 26 de blanc entre deux jetons, 20 entre un jeton et une tache", () => {
  const t = tableDeDessin();
  assert.equal(t.EQ_PRINT_BEAD_GAP, 33);
  assert.equal(t.EQ_PRINT_BEAD_SPLAT_GAP, 24);
  assert.equal(t.EQ_PRINT_BEAD_GAP - 7, 26, "anneau de 7 compris : le blanc le plus serré de l'écran avant le lot");
  // Fiche 36 (seed 89), cartes 1 et 6 en haut/bas : avant, 0,4 mm entre « 13 » et « 31 »,
  // 0,3 mm entre un jeton et une tache. Places et taches relevées sur la page.
  const haut = { x:60, y:76, w:720, h:424 }, bas = { x:60, y:500, w:720, h:424 };
  const cartes = [
    { taches:[[223,605],[416,605],[614,605],[248,746],[404,746],[607,746]],
      jetons:[[192,444,haut],[374,444,haut],[648,444,haut],[283,868,bas],[374,868,bas]] },
    { taches:[[233,167],[411,167],[606,167],[248,308],[416,308],[595,308]],
      jetons:[[283,444,haut],[466,444,haut],[557,444,haut],[283,868,bas],[374,868,bas]] }
  ];
  for(const c of cartes){
    const taches = c.taches.map(([cx, cy]) => ({cx, cy, r:68}));
    const vis = c.jetons.map(([cx, cy, tray]) => ({ p:{cx, cy}, tray, baseR:30 }));
    const r = t.eqPrintBeadLayout(vis, taches, 30, Math.floor(68 * 0.64), t.EQ_PRINT_BEAD_SCALE_HAUT_BAS);
    assert.equal(r.R, 39, "tous les jetons haut/bas à 39");
    assert.equal(t.eqPrintBeadsFit(vis, r.pts, taches, r.R), true);
    r.pts.forEach((p, i) => {
      assert.equal(p.cy, Math.min(vis[i].p.cy, vis[i].tray.y + vis[i].tray.h - 39 - t.EQ_PRINT_BEAD_EDGE), "même hauteur");
      for(let j=i+1;j<r.pts.length;j++){
        assert.ok(Math.hypot(p.cx - r.pts[j].cx, p.cy - r.pts[j].cy) - 2 * 39 - 7 >= 26, "26 de blanc entre deux jetons");
      }
      for(const s of taches) assert.ok(Math.hypot(p.cx - s.cx, p.cy - s.cy) - 1.1 * s.r - 39 - 3.5 >= 20, "20 de blanc jeton → tache");
    });
    // l'ordre de gauche à droite est gardé dans chaque plateau
    for(const tray of [haut, bas]){
      const xs = vis.map((v, i) => [v, r.pts[i]]).filter(([v]) => v.tray === tray);
      for(let k=1;k<xs.length;k++) assert.ok(xs[k][1].cx >= xs[k - 1][1].cx);
    }
  }
  // sans conflit, le glissement ne bouge rien
  const seul = [{ p:{cx:200, cy:300}, tray:haut, baseR:30 }, { p:{cx:500, cy:300}, tray:haut, baseR:30 }];
  assert.deepEqual(t.eqPrintBeadSlide(seul, [{cx:200, cy:300}, {cx:500, cy:300}], [], 39), [{cx:200, cy:300}, {cx:500, cy:300}]);
  // le glissement ne sert que si les places, au rayon essayé, ne tiennent pas
  assert.match(functionSource("eqPrintBeadLayout", "eqPrintHiddenBeadRadius"),
    /let pts = visibles\.map\(it => eqPrintBeadPlace\(it, R\)\);\s*if\(!eqPrintBeadsFit\(visibles, pts, splats, R\)\) pts = eqPrintBeadSlide\(visibles, pts, splats, R\);/);
});

test("un jeton n'est jamais plus gros que ce qu'une tache de la carte peut cacher (remarque de Gwenaël)", () => {
  // toute la table de dessin, exécutée avec de faux éléments SVG
  const src = functionSource("eqPrintOpaqueRing", "createEqPrintBeadTable")
    + functionSource("createEqPrintBeadTable", "drawEqPrintNumberedBead")
    + functionSource("drawEqPrintNumberedBead", "eqUnitCounts");
  const rayons = (taches) => Function("taches", `
    function beadColorForValue(){ return { fill:"hsla(10, 78%, 54%, 0.18)", stroke:"hsla(10, 78%, 48%, 0.55)" }; }
    ${src}
    const faux = (nom, a = {}) => ({ nom, a, enfants:[], appendChild(e){ this.enfants.push(e); } });
    const scene = faux("g");
    const table = createEqPrintBeadTable(scene, (n, a) => faux(n, a), (x, y, t, a) => faux("text", {x, y, t, ...a}), {});
    const plateau = { x:120, y:190, w:680, h:650 };
    table.bead({cx:300, cy:720}, 7, {baseR:34, tray:plateau});
    table.bead({cx:560, cy:720}, 14, {baseR:34, tray:plateau});
    for(const t of taches) table.splat(t);
    const R = table.finish();
    return { R, dessins: scene.enfants.map(g => g.enfants[0].a.r) };`)(taches);
  // sans tache sur la carte : ×1,8 (34 → 61)
  assert.equal(rayons([]).R, 61);
  // taches de 74, loin des jetons : 0,64 × 74 → 47, le rayon d'un jeton caché sous la tache
  const r = rayons([{cx:300, cy:350, r:74}, {cx:560, cy:350, r:74}]);
  assert.equal(r.R, 47);
  assert.deepEqual(r.dessins, [47, 47]);
  // une petite tache (correction « groupes ») : jamais moins que le rayon d'avant
  assert.equal(rayons([{cx:300, cy:350, r:30}]).R, 34);
  assert.match(functionSource("createEqPrintBeadTable", "drawEqPrintNumberedBead"),
    /const creux = splats\.length \? Math\.floor\(Math\.min\(\.\.\.splats\.map\(s => s\.r\)\) \* EQ_PRINT_BEAD_UNDER_SPLAT\) : Infinity;/);
});

test("les trois dessins imprimés passent leurs jetons numérotés par la table de dessin", () => {
  const step = functionSource("renderCardEquationStepPrintScene", "renderCardEquationSignedStepPrintScene");
  const signed = functionSource("renderCardEquationSignedStepPrintScene", "renderCardEquationSignedStepPrint");
  const eq = functionSource("renderCardEquationPrint", "renderCardIntoSvg");
  for(const [nom, src] of [["pas à pas", step], ["relatifs", signed], ["équation", eq]]){
    assert.match(src, /createEqPrintBeadTable\(/, nom);
    assert.match(src, /drawSide\(pos\.right, eq\.right, "right"\);\s*beadTable\.finish\(\);/, nom);
    assert.doesNotMatch(src, /r:beadR, fill:col\.fill, stroke:col\.stroke/, `${nom} : plus de jeton pâle imprimé`);
  }
  assert.match(step, /scale: trays\.vertical \? EQ_PRINT_BEAD_SCALE_HAUT_BAS : EQ_PRINT_BEAD_SCALE/);
  // une tache « opposé » dévoilée garde le rayon de base (le mot est posé sur le jeton)
  assert.match(signed, /if\(isRevealed\) beadTable\.cap\(beadR\);/);
  assert.match(eq, /if\(revealAnswers\) beadTable\.cap\(beadR\);/);
});

test("jetons unité imprimés : bleu franc, ×2 si ça tient, loin des bords ; l'écran garde sa disposition", () => {
  assert.match(html, /const EQ_PRINT_UNIT_SCALES = \[2, 1\.8, 1\.65, 1\.5, 1\.35, 1\.2, 1\];/);
  const step = functionSource("renderCardEquationStepPrintScene", "renderCardEquationSignedStepPrintScene");
  assert.match(step, /const fill = removed \? 'rgba\(228,234,240,0\.98\)' : '#2563eb';/);
  assert.match(step, /const stroke = removed \? 'rgba\(150,160,172,0\.98\)' : '#1e40af';/);
  assert.match(step, /getEqUnitBeadLayoutPrint\(card, sideName, side, metaSide, sideName === "left" \? trays\.left : trays\.right, unitPrintScale\)/);
  // l'écran : même bleu pâle, même disposition (clé du cache et marge inchangées sans options)
  assert.match(functionSource("drawEqUnitBead", "drawEqUnitBeadList"), /"rgba\(110,176,255,0\.95\)"/);
  const layout = functionSource("getEqUnitBeadLayout", "drawEqUnitBead");
  assert.match(layout, /const pourImpression = !!\(opts\.radiusScale \|\| opts\.edge \|\| gapImp \|\| hiddenGapImp \|\| splatGapImp\);\s*if\(pourImpression\) key \+= "\|impression\|"/);
  assert.match(layout, /const edge = Number\(opts\.edge\) > 0 \? Number\(opts\.edge\) : 20;/);
  assert.match(layout, /const margin = beadR \+ edge;/);
  // sans options (écran), les écarts d'avant : 4, 0, 3, 1, pas de grille et distance aux taches
  assert.match(layout, /const step = gapImp \? beadR \* 2 \+ gapImp : Math\.max\(beadR \* 2 \+ 9, 28\);/);
  assert.match(layout, /noOverlapPoint\(p\.cx,p\.cy,placed,gapImp \|\| 4\)/);
  assert.match(layout, /noOverlapPoint\(p\.cx,p\.cy,placed,gapImp \|\| 0\)/);
  assert.match(layout, /noOverlapPoint\(p\.cx,p\.cy,placed,hiddenGapImp \|\| 3\)/);
  assert.match(layout, /noOverlapPoint\(p\.cx,p\.cy,placed,hiddenGapImp \|\| 1\)/);
  assert.match(layout, /: \(Number\(s\.r\)\|\|74\) \+ beadR \+ 18;/);
  assert.match(layout, /const step = Math\.max\(beadR\*2 \+ Math\.max\(5, hiddenGapImp\), 22\);/);
  // le secours en paquet serré ne sert qu'à l'impression
  assert.match(layout, /if\(pourImpression && hiddenByTaskPositions\[t\]\.length < k\)\{/);
  // l'écran n'appelle jamais les fonctions d'impression
  const screen = functionSource("renderCardEquation", "eqPrintOpaqueRing");
  assert.doesNotMatch(screen, /EqPrint|eqPrint|getEqUnitBeadLayoutPrint|eqUnitPrintScale/);
});

/* getEqUnitBeadLayout et ce dont il a besoin, exécutés pour de vrai */
function dispositionUnites(){
  const ligne = re => { const m = html.match(re); assert.ok(m); return m[0]; };
  const src = ligne(/function mulberry32\(a\)\{[^\n]*/) + "\n" + ligne(/function rFloat\(rng,a,b\)\{[^\n]*/) + "\n"
    + ligne(/function clamp\(n, a, b\)\{[^\n]*/) + "\n"
    + functionSource("hashStringToInt", "getEqUnitBeadLayout") + functionSource("getEqUnitBeadLayout", "drawEqUnitBead");
  return Function(`${src}; return getEqUnitBeadLayout;`)();
}

test("jetons unité imprimés : au moins 24 d'écart entre deux jetons visibles, 20 avec une tache ; l'écran ne bouge pas", () => {
  assert.equal(constSource("EQ_PRINT_UNIT_GAP"), "const EQ_PRINT_UNIT_GAP = 24;");
  assert.equal(constSource("EQ_PRINT_UNIT_HIDDEN_GAP"), "const EQ_PRINT_UNIT_HIDDEN_GAP = 10;");
  assert.equal(constSource("EQ_PRINT_UNIT_SPLAT_GAP"), "const EQ_PRINT_UNIT_SPLAT_GAP = 20;");
  assert.match(functionSource("eqUnitPrintOpts", "eqUnitCounts"),
    /return \{radiusScale:scale, edge:EQ_PRINT_UNIT_MARGIN, gap:EQ_PRINT_UNIT_GAP, hiddenGap:EQ_PRINT_UNIT_HIDDEN_GAP, splatGap:EQ_PRINT_UNIT_SPLAT_GAP\};/);
  const f = dispositionUnites();
  const cas = () => ({ card:{ _unitLayoutSeed: 987654 }, side:{ splats:[{cx:300, cy:250, r:74}, {cx:520, cy:250, r:74}] },
    meta:{ visible:[5, 2], hiddenByTask:[[3],[3]] }, tray:{x:60, y:76, w:720, h:424} });
  // écran : les places relevées sur main #819, au millionième près
  let c = cas();
  const ecran = f(c.card, "left", c.side, c.meta, c.tray);
  const arrondi = q => [+q.cx.toFixed(6), +q.cy.toFixed(6)];
  assert.equal(ecran.beadR, 13);
  assert.deepEqual(ecran.visiblePositions.map(arrondi), [[164.200238,431.959495],[235.316351,429.199336],[274.794306,111.504408],
    [492.170934,392.875343],[565.435881,141.215533],[93.584637,181.080563],[712.754485,182.411155]]);
  assert.deepEqual(ecran.hiddenByTaskPositions.map(a => a.map(arrondi)), [[[290.890716,271.321077],[324.717716,243.28254],[279.944243,235.558508]],
    [[543.99545,272.489397],[514.644241,271.29524],[545.809773,241.077881]]]);
  // impression ×2 : les écarts sont tenus
  c = cas();
  const imp = f(c.card, "left", c.side, c.meta, c.tray, {radiusScale:2, edge:48, gap:24, hiddenGap:10, splatGap:20});
  const R = imp.beadR, v = imp.visiblePositions;
  assert.equal(R, 26);
  assert.equal(v.length, 7);
  for(let i=0;i<v.length;i++){
    for(let j=i+1;j<v.length;j++) assert.ok(Math.hypot(v[i].cx - v[j].cx, v[i].cy - v[j].cy) >= 2 * R + 24, "24 entre deux visibles");
    for(const s of c.side.splats) assert.ok(Math.hypot(v[i].cx - s.cx, v[i].cy - s.cy) >= 1.1 * s.r + R + 20, "20 avec une tache");
  }
  // la disposition de l'écran, en cache, n'a pas bougé
  assert.deepEqual(f(c.card, "left", c.side, c.meta, c.tray).visiblePositions.map(arrondi), ecran.visiblePositions.map(arrondi));
});

test("paquets de jetons unité : l'écart imprimé tient dans la case ; l'écran garde 6", () => {
  const src = functionSource("getEqStepGroupCells", "drawEqStepGroupZones")
    + functionSource("getEqUnitPacketCenter", "getEqUnitPacketPositions")
    + functionSource("getEqUnitPacketPositions", "getEquationSimpleMappedRevealState");
  const paquet = Function(`function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); } ${src} return getEqUnitPacketPositions;`)();
  const tray = {x:60, y:76, w:720, h:424};
  const ecart = pts => Math.round((pts[1].cx - pts[0].cx) * 1000) / 1000;
  assert.equal(ecart(paquet(tray, 0, 2, 3, 13)), 2 * 13 + 6, "écran : 6");
  assert.equal(ecart(paquet(tray, 0, 2, 3, 26, 24)), 2 * 26 + 24, "impression : 24 quand la case est large");
  // 5 cases de 141,6 de large, 3 jetons de 26 par rangée : (141,6 - 16 - 156) / 2 < 6 → 6
  assert.equal(ecart(paquet(tray, 2, 5, 3, 26, 24)), 2 * 26 + 6, "jamais sous 6");
  // 3 cases de 236 : (236 - 16 - 156) / 2 = 32 → 24
  assert.equal(ecart(paquet(tray, 0, 3, 3, 26, 24)), 2 * 26 + 24);
  const step = functionSource("renderCardEquationStepPrintScene", "renderCardEquationSignedStepPrintScene");
  assert.match(step, /getEqUnitPacketPositions\(tray, packetIndex, packetCount, n, unitBeadR, unitPrintScale \? EQ_PRINT_UNIT_GAP : 6\)/);
});

test("contrôle des dispositions de jetons unité imprimées : nombre, chevauchement, bords, taches", () => {
  const src = [constSource("EQ_PRINT_UNIT_EDGE"), constSource("EQ_PRINT_UNIT_GAP"), constSource("EQ_PRINT_UNIT_SPLAT_GAP")].join("\n")
    + functionSource("eqUnitCounts", "eqUnitPrintLayoutOk")
    + functionSource("eqUnitPrintLayoutOk", "eqUnitPrintScale");
  const ok = Function(`${src} return eqUnitPrintLayoutOk;`)();
  const tray = { x:60, y:76, w:720, h:424 };
  const meta = { visible:[3], hiddenByTask:[[2]] };
  const splats = [{cx:400, cy:250, r:80}];
  const bon = { beadR:28, visiblePositions:[{cx:150,cy:150},{cx:250,cy:150},{cx:650,cy:400}], hiddenByTaskPositions:[[{cx:370,cy:250},{cx:430,cy:250}]] };
  assert.equal(ok(bon, tray, splats, meta), true);
  assert.equal(ok({ ...bon, visiblePositions: bon.visiblePositions.slice(0, 2) }, tray, splats, meta), false, "un jeton manque");
  assert.equal(ok({ ...bon, visiblePositions:[{cx:150,cy:150},{cx:190,cy:150},{cx:650,cy:400}] }, tray, splats, meta), false, "deux jetons se chevauchent");
  assert.equal(ok({ ...bon, visiblePositions:[{cx:150,cy:150},{cx:225,cy:150},{cx:650,cy:400}] }, tray, splats, meta), false, "moins de 24 entre deux visibles");
  assert.equal(ok({ ...bon, visiblePositions:[{cx:150,cy:150},{cx:250,cy:150},{cx:500,cy:320}] }, tray, splats, meta), false, "moins de 20 avec une tache");
  assert.equal(ok({ ...bon, hiddenByTaskPositions:[[{cx:370,cy:250},{cx:423,cy:250}]] }, tray, splats, meta), false, "deux cachés se chevauchent");
  assert.equal(ok({ ...bon, visiblePositions:[{cx:150,cy:150},{cx:250,cy:150},{cx:650,cy:470}] }, tray, splats, meta), false, "trop près de la barre du milieu");
  assert.equal(ok({ ...bon, hiddenByTaskPositions:[[{cx:370,cy:250},{cx:460,cy:250}]] }, tray, splats, meta), false, "un jeton caché sort de sa tache");
});

test("« suite » : une fiche = plusieurs séries bout à bout, chacune comme ouverte seule ; les réglages affichés restent ceux de la première", () => {
  const load = functionSource("loadSharedConfiguration", "appliquerConfiguration");
  assert.match(load, /serieSuite = String\(params\.get\("suite"\) \|\| ""\)\s*\.split\(";"\)\.map\(part => part\.trim\(\)\)\.filter\(Boolean\)\.slice\(0, 5\);\s*reglagesOuverture = photographierReglages\(\);/);
  // la photo des réglages d'ouverture couvre l'état que les réglages gardent d'un mode à l'autre
  const photo = functionSource("photographierReglages", "restaurerReglages");
  for(const v of ["equationStepView", "lastActivityForSigned", "lastActivityForBounds", "_tasksUIKeyPrev",
                  "_numTasksSavedNumberedMax", "_numTasksSavedNumberedMin", "_numTasksSavedEquationMax",
                  "lastSignedModeSettings", "lastNumberedTotalBounds"]) assert.ok(photo.includes(v), `photo : ${v}`);
  assert.match(photo, /document\.querySelectorAll\("input, select"\)/);
  assert.match(load, /appliquerConfiguration\(params\);\s*return true;/);
  assert.match(html, /if\(serieSuite\.length\) genererSerieComposee\(\);\s*else generate\(\);\s*if\(impressionAuto\) printSheet\(\);/);
  assert.match(functionSource("generate", "genererSerieComposee"), /^function generate\(\)\{\s*serieComposee = false;/);
  assert.match(functionSource("buildShareUrl", "fallbackCopyText"), /if\(serieComposee && serieSuite\.length\) params\.set\("suite", serieSuite\.join\(";"\)\);/);

  // on l'exécute avec de faux générateurs : trois parties de 4 cartes
  const src = functionSource("genererSerieComposee", "shuffleCards");
  const journal = [];
  const etat = Function("journal", `
    let cards = [], idx = 5, revealState = 2, serieComposee = false, activeGenerationSeed = "";
    let seed = "56";
    const serieSuite = ["mode=EQUNITSTEP&cards=4&seed=77", "mode=EQUNITSTEP&cards=4&seed=88"];
    const window = { location: { search: "?mode=EQUNITSTEP&cards=4&seed=56&suite=x" } };
    const reglagesOuverture = {};
    function restaurerReglages(photo){ if(photo === reglagesOuverture) journal.push("ouverture"); }
    function appliquerConfiguration(p){ seed = p.get("seed"); journal.push("réglages " + seed); }
    function generate(){ serieComposee = false; activeGenerationSeed = seed; cards = [1,2,3,4].map(i => seed + "-" + i); journal.push("série " + seed); }
    function updateUI(){ journal.push("affiche"); }
    ${src}
    genererSerieComposee();
    return { cards, idx, revealState, serieComposee, activeGenerationSeed, seed };`)(journal);
  assert.equal(etat.cards.length, 12);
  assert.deepEqual(etat.cards.slice(0, 5), ["56-1", "56-2", "56-3", "56-4", "77-1"]);
  assert.equal(etat.cards[11], "88-4");
  assert.equal(etat.serieComposee, true);
  assert.equal(etat.activeGenerationSeed, "56", "le lien partagé redonne la graine de la première série");
  assert.equal(etat.seed, "56", "les réglages affichés redeviennent ceux de la première série");
  assert.equal(etat.idx, 0);
  assert.equal(etat.revealState, 0);
  // chaque partie repart des réglages d'ouverture, puis on remet ceux de la première série
  assert.deepEqual(journal, ["série 56", "ouverture", "réglages 77", "série 77", "ouverture", "réglages 88", "série 88",
                             "ouverture", "réglages 56", "affiche"]);
});
