import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* Lot Q4 (24/09/2026) : les deux « corrections courtes » 6/page de Splat Équations —
   « Correction : l’équation (6/page) » et « Correction : le schéma en barres (6/page) ».
   Seule la partie Imprimer de l'outil change : l'écran, la projection, ÉquaSplat et les
   impressions existantes (énoncé 6/page du lot Q1, correction 4/2/1 par page) ne bougent
   pas. Les mesures réelles (place des plateaux, marges dans la case, largeur des flèches)
   se vérifient au navigateur avec splat-equations-lot-Q4-preuve.py ; ici, la structure du
   code et les fonctions pures, exécutées. */

const html = await readFile(new URL("../outils/splat_equations.html", import.meta.url), "utf8");

/* Le texte d'une fonction de la page, de « function nom( » à son accolade fermante. */
function extraire(nom){
  const debut = html.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut, i + 1);
}
function constante(nom){
  const m = html.match(new RegExp(`^const ${nom} = [^\\n]*;`, "m"));
  assert.ok(m, `la constante ${nom} doit exister`);
  return m[0];
}
function bloc(nom){
  const m = html.match(new RegExp(`^const ${nom} = \\{[\\s\\S]*?\\n\\};`, "m"));
  assert.ok(m, `le bloc ${nom} doit exister`);
  return m[0];
}

/* getPrintPlan, eqSixCorrectionPart et getPrintCardsPerPage, exécutés sur de faux sélecteurs. */
function plan(printValue, layoutValue = "2"){
  const fn = Function("printModeSelectEl", "printCardsPerPageEl", "document", `
    ${extraire("getPrintPlan")}
    ${extraire("eqSixCorrectionPart")}
    ${extraire("getPrintCardsPerPage")}
    return { plan: getPrintPlan(), parPage: getPrintCardsPerPage(), part: eqSixCorrectionPart(getPrintPlan().recto) };
  `);
  return fn({ value: printValue }, { value: layoutValue }, { getElementById(){ return null; } });
}

test("le menu « Ce que j'imprime » : les deux corrections courtes juste après « Correction », avant le recto-verso", () => {
  assert.match(html, /<option value="correction">Correction<\/option>\s*<option value="correction-equation">Correction : l’équation \(6\/page\)<\/option>\s*<option value="correction-schema">Correction : le schéma en barres \(6\/page\)<\/option>\s*<option disabled>─+ recto-verso ─+<\/option>/);
});

test("le plan d'impression : recto seul, toujours 6 par page, quel que soit le réglage « Pages »", () => {
  for(const v of ["correction-equation", "correction-schema"]){
    for(const layout of ["6", "4", "2", "1", ""]){
      const r = plan(v, layout);
      assert.deepEqual(r.plan, { recto: v, verso: null }, `${v}, Pages = ${layout || "(vide)"}`);
      assert.equal(r.parPage, 6, `${v}, Pages = ${layout || "(vide)"} : 6 par page`);
    }
  }
  assert.equal(plan("correction-equation").part, "equation");
  assert.equal(plan("correction-schema").part, "schema");
  // les autres choix ne bougent pas (lot Q1) : 6/page vaut pour l'énoncé seul, 2/page reste le défaut
  assert.equal(plan("statement", "6").parPage, 6);
  assert.equal(plan("correction", "6").parPage, 4);
  assert.equal(plan("duplex-correction", "6").parPage, 4);
  assert.equal(plan("statement", "").parPage, 2);
  assert.equal(plan("correction", "2").part, null);
  assert.deepEqual(plan("duplex-correction").plan, { recto: "statement", verso: "correction" });
});

test("« Pages » se cale sur 6/page et se grise, puis revient à sa valeur ; en relatifs, seule la ligne du schéma se grise (lot R1)", () => {
  const sync = extraire("syncEqSixCorrectionUI");
  assert.match(sync, /option\[value="correction-schema"\]'\)\.forEach\(opt => \{ opt\.disabled = signe; \}\);/);
  assert.match(sync, /option\[value="correction-equation"\]'\)\.forEach\(opt => \{ opt\.disabled = false; \}\);/);
  assert.match(sync, /if\(signe && sel\.value === "correction-schema"\) sel\.value = "correction";/);
  assert.match(sync, /if\(!pp\.disabled\) pagesAvantCorrectionCourte = pp\.value;\s*pp\.value = "6";\s*pp\.disabled = true;/);
  assert.match(sync, /if\(pagesAvantCorrectionCourte != null\) pp\.value = pagesAvantCorrectionCourte;/);
  // appelée au changement de mode, au changement du menu, et à l'ouverture
  assert.match(extraire("syncPrintModeUI"), /syncEqSixCorrectionUI\(\);\s*syncPrintSummary\(\);/);
  assert.match(html, /el\.addEventListener\("change", \(\)=>\{ syncEqSixCorrectionUI\(\); syncPrintSummary\(\); \}\);/);
  assert.match(html, /\n\}\nsyncEqSixCorrectionUI\(\);\nsyncPrintSummary\(\);\nif\(serieSuite\.length\) genererSerieComposee\(\);/);
  // la phrase de contrôle dit ce qu'on va obtenir
  const resume = extraire("syncPrintSummary");
  assert.match(resume, /plan\.recto === "correction-equation"[\s\S]*la carte dévoilée et l’équation résolue dessous/);
  assert.match(resume, /plan\.recto === "correction-schema"[\s\S]*la carte dévoilée et les schémas en barres à droite/);
});

test("la feuille : bandeau « — Correction », cadre de consigne gardé, la carte dessinée par renderEqSixCorrectionIntoSvg ; l'énoncé 6/page inchangé", () => {
  const printSheet = extraire("printSheet");
  assert.match(printSheet, /const sixPart = eqSixCorrectionPart\(mode\);\s*sheet\.appendChild\(createEquationPrintHeader\(sixPart \? "correction" : mode\)\);\s*if\(mode !== "correction"\) sheet\.appendChild\(createEquationPrintInstruction\(slotCards\)\);/);
  assert.match(printSheet, /if\(sixPart\)\{\s*renderEqSixCorrectionIntoSvg\(sv, card, sixPart\);\s*\}else\{/);
  // le chemin de l'énoncé 6/page et des 4/2/1 par page est celui du lot Q1, mot pour mot
  assert.match(printSheet, /const hautBas = isEquationSchemaPrintCard\(card\);\s*sv\.setAttribute\("viewBox", hautBas \? EQ_PRINT_6UP_VIEWBOX_HB : EQ_PRINT_6UP_VIEWBOX_GD\);\s*if\(hautBas\) sv\.classList\.add\("carte-haut-bas"\);/);
  assert.match(printSheet, /renderCardIntoSvg\(sv, card, mode, \{sixParPage: perSheet === 6\}\)/);
});

test("la carte : celle de l'énoncé 6/page (même boîte, même largeur), taches dévoilées — l'état « je vérifie » du pas à pas", () => {
  const rendu = extraire("renderEqSixCorrectionIntoSvg");
  assert.match(rendu, /const hautBas = part === "schema";/);
  assert.match(rendu, /targetSvg\.setAttribute\("viewBox", hautBas \? EQ_PRINT_6UP_VIEWBOX_HB : EQ_PRINT_6UP_VIEWBOX_GD\);\s*if\(hautBas\) targetSvg\.classList\.add\("carte-haut-bas"\);\s*targetSvg\.style\.overflow = "visible";/);
  // la phrase de l'énoncé, à sa place du 6/page (la scène ne l'écrit qu'à l'état 0)
  assert.match(rendu, /tText\(hautBas \? 420 : 800, hautBas \? 82 : EQ_PRINT_6UP_PHRASE_Y,\s*hautBas \? "Même quantité en haut et en bas" : "Même quantité à gauche qu'à droite"/);
  assert.match(rendu, /translate\(0 " \+ \(hautBas \? EQ_PRINT_6UP_SCHEMA_DY : 0\) \+ "\)/);
  assert.match(rendu, /const etats = getEquationStepStates\(eq, varChar, \{includeVerify:true\}\);/);
  // grandes taches (27/09/2026) : la vue gauche/droite seulement, comme l'énoncé 6/page
  assert.match(rendu, /renderCardEquationStepPrintScene\(gScene, card, etats\.length, \{\s*layoutMode: hautBas \? "schema" : "equation",\s*showIntroText:false,\s*showAid:false,\s*grandesTaches: !hautBas,\s*useTokens:false\s*\}\);/);
  // la lettre : celle de la vue (comme l'énoncé 6/page)
  assert.match(rendu, /const varChar = hautBas \? getTableVarChar\(card\) : getCardVarChar\(card\);/);
  assert.match(rendu, /if\(part === "equation"\) drawEqSixCorrectionEquation\(gc, card, varChar, tEl, tText\);\s*else drawEquationPrintCorrectionColumn\(gc, eq, card, tEl, tText, EQ_SIX_CORR_GEOM_SCHEMA\);/);
  // même garde des hachures que renderCardIntoSvg
  assert.match(rendu, /__activePrintHatchSvgRoot = targetSvg;[\s\S]*__activePrintHatchSvgRoot = prevPrintHatchRoot;/);
});

test("l'équation : les lignes et les flèches de la correction de l'outil, taille 136 (27/09), 4 mm sous le plateau, flèches posées d'après la largeur MESURÉE", () => {
  const eq = extraire("drawEqSixCorrectionEquation") + extraire("drawEqSixCorrectionLines");
  // 136 (5,8 mm) depuis le 27/09/2026 : « il y a beaucoup de place, on peut écrire plus gros »
  assert.match(constante("EQ_SIX_CORR_EQ_FONT"), /= 136;/);
  assert.match(html, /^const EQ_SIX_CORR_EQ_LEFT = -140, EQ_SIX_CORR_EQ_RIGHT = 1740;/m);
  assert.match(eq, /const lines = buildEquationSolveLines\(eq, varChar\);\s*const ops = getEquationSolveLineOperations\(eq, lines, varChar\);/);
  assert.match(eq, /const trayBottom = trays\.left\.y \+ trays\.left\.h \+ 4;/);
  assert.match(eq, /const startY = trayBottom \+ 94 \+ Math\.round\(font \* 0\.7\);/);
  assert.match(eq, /for\(; font >= 56; font -= 4\)\{/);
  // largeur mesurée dans la police réellement dessinée (canvas), écart reporté dans la marge
  assert.match(eq, /eqSixTextWidth\(l, `italic \$\{font\}px \$\{EQ_SIX_CORR_DRAWN_FONT\}`, font\)/);
  assert.match(eq, /margin = Math\.max\(20, Math\.round\(reel - estime \+ font \* 0\.55\)\);/);
  assert.match(eq, /if\(800 - place >= EQ_SIX_CORR_EQ_LEFT && 800 \+ place <= EQ_SIX_CORR_EQ_RIGHT && bas <= EQ_SIX_CORR_EQ_BOTTOM\) break;/);
  assert.match(eq, /drawEqSixCorrectionLines\(g, card, lines, ops, tEl, tText\);/);
  assert.match(eq, /drawEquationLines\(g, lines, 800, startY, \{[\s\S]*alignEquals: true, eqGap, fontFamily: "SplatLettres, 'Times New Roman', Times, serif", fontStyle: "italic"/);
  // les lettres sont dessinées (règle « * ») et mesurées dans SplatLettres, le reste dans la police de l'interface
  assert.match(html, /^const EQ_SIX_CORR_DRAWN_FONT = 'SplatLettres, system-ui, -apple-system, "Segoe UI", Roboto, Arial';/m);
  assert.match(eq, /drawOperationArrowsForLines\(g, api, lines, ops, \{centerX: 800, startY, gap, fontSize: font, eqGap, margin\}\);/);
  // la mesure : un canvas, et l'estimation de l'outil (× 1,2) en repli
  const mesure = extraire("eqSixTextWidth");
  assert.match(mesure, /document\.createElement\("canvas"\)\.getContext\("2d"\)/);
  assert.match(mesure, /return Math\.round\(estimatePrintMathTextWidth\(str, fallbackFontSize\) \* 1\.2\);/);
});

test("le schéma : la colonne de la correction du mode Équation, à droite du plateau haut/bas, sans l'équation", () => {
  const geom = bloc("EQ_SIX_CORR_GEOM_SCHEMA");
  assert.match(geom, /top: 132, centerX: 1180, fullW: 720, maxTableW: 720,/);
  // lignes plus hautes (27/09/2026) : 108, chiffres 90, lettres 76, 60 de blanc entre deux schémas
  assert.match(geom, /minHiddenW: 70, minVisibleW: 84, minHiddenWValue1: 92, minVisibleWValue1: 104,/);
  assert.match(geom, /rowH: 108, fontSize: 90, pad: 36, variableFontSize: 76, stride: 276,/);
  assert.match(geom, /arrows: false, sansEquation: true/);
  // la colonne : la même fonction que la correction 4/page, dans un repère
  const col = extraire("drawEquationPrintCorrectionColumn");
  assert.match(col, /if\(G\.sansEquation\) return;/);
  assert.match(col, /const startX = G\.centerX - fullW \/ 2;/);
  assert.match(col, /if\(G\.arrows\) drawOperationArrowsForLines\(/);
  // quatre schémas (3 × 276 + 216 = 1044) descendent sous le plateau (132 → 1176) : la case,
  // elle, va jusque vers 1360 (mesuré au PDF, 27/09) ; 60 de blanc entre deux schémas
  assert.ok(132 + 3 * 276 + 2 * 108 <= 1300);
  assert.equal(276 - 2 * 108, 60);
});

test("la correction 4/2/1 par page ne change pas : EQ_PRINT_CORR_GEOM reprend ses constantes d'avant, mot pour mot", () => {
  const geom = bloc("EQ_PRINT_CORR_GEOM");
  assert.match(geom, /top: EQ_PRINT_TABLE_TOP_Y, centerX: 800, fullW: 1240, maxTableW: 1240,/);
  assert.match(geom, /minHiddenW: 92, minVisibleW: 112, minHiddenWValue1: 122, minVisibleWValue1: 138,/);
  assert.match(geom, /rowH: EQ_PRINT_CORR_ROW_H, fontSize: EQ_PRINT_CORR_FONT_SIZE, pad: EQ_PRINT_CORR_PAD,/);
  assert.match(geom, /variableFontSize: EQ_PRINT_CORR_VAR_FONT_SIZE, stride: EQ_PRINT_CORR_STRIDE,/);
  assert.match(geom, /eqTopGap: 40, eqFontSize: 68, eqFontSize4: 58, eqGap: 88, eqGap4: 74, eqEqGap: 36, arrows: true/);
  assert.match(constante("EQ_PRINT_TABLE_TOP_Y"), /= 900;/);
  assert.match(constante("EQ_PRINT_CORR_ROW_H"), /= 100;/);
  assert.match(constante("EQ_PRINT_CORR_FONT_SIZE"), /= 88;/);
  assert.match(constante("EQ_PRINT_CORR_PAD"), /= 36;/);
  assert.match(constante("EQ_PRINT_CORR_VAR_FONT_SIZE"), /= 64;/);
  assert.match(constante("EQ_PRINT_CORR_STRIDE"), /= 232;/);
  assert.match(extraire("renderCardEquationPrint"), /\} else \{\s*drawEquationPrintCorrectionColumn\(gEq, eq, card, tEl, tText, EQ_PRINT_CORR_GEOM\);\s*\}/);
  // les schémas de la colonne se dessinent tous d'après G, jamais d'après une constante
  const col = extraire("drawEquationPrintCorrectionColumn");
  assert.doesNotMatch(col, /EQ_PRINT_CORR_ROW_H|EQ_PRINT_CORR_FONT_SIZE|EQ_PRINT_CORR_PAD|EQ_PRINT_CORR_VAR_FONT_SIZE|EQ_PRINT_CORR_STRIDE|EQ_PRINT_TABLE_TOP_Y/);
  assert.equal((col.match(/rowH: G\.rowH,/g) || []).length, 4, "quatre schémas, tous à la hauteur de G");
  assert.equal((col.match(/currentY \+= G\.stride;/g) || []).length, 4);
});
