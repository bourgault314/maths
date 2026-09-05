import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `la fonction ${name} doit exister`);
  const end = nextName ? html.indexOf(`function ${nextName}(`, start + 1) : -1;
  assert.notEqual(end, -1, `la fonction ${nextName} doit suivre ${name}`);
  return html.slice(start, end);
}

test("les quatre modes A/A±/B/B± partagent le plateau haut", () => {
  const trayConfig = functionSource("getTrayConfig", "getUnitSplats");
  for(const family of ["U", "UPM", "N", "NPM"]){
    assert.match(trayConfig, new RegExp(`mode === "${family}"`));
  }
  assert.match(trayConfig, /y:210, w:1360, h:660, isHigh: true/);
  assert.match(trayConfig, /y:270, w:1360, h:550, isHigh: false/);
});

test("l'impression descend seulement le grand plateau sans toucher au plateau interactif", () => {
  const printTrayConfig = functionSource("getPrintTrayConfig", "getUnitSplats");

  assert.match(printTrayConfig, /const tray = getTrayConfig\(mode\)/);
  assert.match(printTrayConfig, /const offsetY = tray\.isHigh \? 35 : 0/);
  assert.match(printTrayConfig, /return \{\.\.\.tray, y:tray\.y \+ offsetY, offsetY\}/);
});

test("l'impression dessine le meme plateau que celui utilise pour placer les jetons", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.match(printRenderer, /const printTray = getPrintTrayConfig\(card\.family\)/);
  assert.match(printRenderer, /x:printTray\.x, y:trayY, width:printTray\.w, height:trayH/);
  assert.doesNotMatch(printRenderer, /const trayY = 270/);
  assert.doesNotMatch(printRenderer, /const trayH = 550/);
});

test("l'impression ramene chaque jeton entierement dans son plateau", () => {
  const fitToken = functionSource("fitPrintTokenToTray", "getRelationCorrectionPrintProfile");
  const fitPrintTokenToTray = Function(`return (${fitToken})`)();
  const tray = {x:120, y:210, w:1360, h:660};

  assert.deepEqual(
    fitPrintTokenToTray(120, 210, 32, tray, 5),
    {cx:156.5, cy:246.5}
  );
  assert.deepEqual(
    fitPrintTokenToTray(1480, 870, 32, tray, 5),
    {cx:1443.5, cy:833.5}
  );

  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");
  assert.match(printRenderer, /fitPrintTokenToTray\(cx, cy, beadR, printTray, strokeWidth\)/);
  assert.equal((printRenderer.match(/fitPrintTokenToTray\(/g) || []).length, 5);
});

test("le total et les aides restent separes du plateau haut a l'impression", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.match(printRenderer, /let tx = 800, ty = 92/);
  assert.match(printRenderer, /const totalNumberSize = 96/);
  assert.match(printRenderer, /const boxH = 210/);
  assert.match(printRenderer, /let boxW = 280/);
  assert.doesNotMatch(printRenderer, /compactPrintTotal/);
  assert.match(printRenderer, /let currentY = trayY \+ trayH \+ 100/g);
  assert.match(printRenderer, /const centerY = \(isHelpOnly \? 1240 : 1285\) \+ printOffsetY/);
});

test("les jetons et les taches suivent le decalage d'impression sans badge zero", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");

  assert.match(printRenderer, /const printOffsetY = printTray\.offsetY/);
  assert.match(printRenderer, /cy \+= printOffsetY/);
  assert.equal((printRenderer.match(/blobPath\(s\.cx,\s*s\.cy \+ printOffsetY,\s*s\.r\)/g) || []).length, 2);
  assert.doesNotMatch(printRenderer, /0 jeton/);
  assert.doesNotMatch(html, /"0 jeton"/);
});

test("la page classique reserve un bandeau, une consigne et un pied de page compact", () => {
  assert.match(html, /\.print-page-header\{[\s\S]*?flex:0 0 16mm;/);
  assert.match(html, /\.print-page-instruction\{/);
  assert.match(html, /\.print-page-footer\{flex:0 0 3\.5mm/);
  assert.match(html, /title\.textContent = "Splat!"/);
  assert.match(html, /mathsgo\.re\/splat\/classique/);
});

test("la correction C agrandit seulement ses blocs imprimes", () => {
  const profileSource = functionSource("getRelationCorrectionPrintProfile", "renderCardIntoSvg");
  const getProfile = Function(`return (${profileSource})`)();

  assert.deepEqual(getProfile({_directSubstitution:false}), {verticalScale:1.20, fontScale:1.25, barShiftX:30});
  assert.deepEqual(getProfile({_directSubstitution:true}), {verticalScale:1.40, fontScale:1.30});

  const screenRenderer = functionSource("renderCard", "approxTextWidthForLabel");
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");
  assert.doesNotMatch(screenRenderer, /getRelationCorrectionPrintProfile/);
  assert.match(printRenderer, /if\(card\.family === "C" && card\._rel && printRevealState > 0\)/);
  assert.match(printRenderer, /const printProfile = getRelationCorrectionPrintProfile\(card\)/);
});

test("la correction C enquete decale ensemble ses trois tableaux sans les retrecir", () => {
  const layoutSource = functionSource("getRelationSchemaLayout", "getRelationDrawingMetrics");
  const getLayout = Function(`return (${layoutSource})`)();
  const screenLayout = getLayout();
  const inquiryPrintLayout = getLayout({barShiftX:30});

  assert.equal(screenLayout.labelW, 150);
  assert.equal(screenLayout.equationW, 660);
  assert.equal(screenLayout.barX, 210);
  assert.equal(screenLayout.barW, 636);
  assert.equal(screenLayout.equationCenterX, 1210);

  assert.equal(inquiryPrintLayout.labelW, 180);
  assert.equal(inquiryPrintLayout.equationW, 630);
  assert.equal(inquiryPrintLayout.barX, 240);
  assert.equal(inquiryPrintLayout.barW, screenLayout.barW);
  assert.equal(inquiryPrintLayout.equationCenterX, 1225);
  assert.equal(
    inquiryPrintLayout.barX + inquiryPrintLayout.barW + 34 + inquiryPrintLayout.equationW,
    screenLayout.barX + screenLayout.barW + 34 + screenLayout.equationW
  );

  for(const [name, nextName] of [
    ["drawRelationSituationSchema", "drawRelationSubstitutionStep"],
    ["drawRelationSubstitutionStep", "relationResolutionPlan"],
    ["drawRelationOrderedSchema", "drawRelationGroupedSchema"],
    ["drawRelationGroupedSchema", "drawBarModelPartsInGroup"]
  ]){
    assert.match(functionSource(name, nextName), /getRelationSchemaLayout\(opts\)/);
  }
});

test("les blocs C agrandis gardent une marge basse dans le SVG imprime", () => {
  const canvasHeight = 2200;
  const stepTop = 270 + 550 + 70;
  const stepGap = 40;

  // Enquête la plus haute : trois relations et une ligne de jetons visibles.
  const inquiryFirstHeight = 67 + 4 * 62 + 3 * 12 + 29;
  const inquiryOtherHeight = 329;
  const inquiryBottom = stepTop + inquiryFirstHeight + stepGap + inquiryOtherHeight + stepGap + inquiryOtherHeight;

  // C direct le plus haut : trois lignes de substitution puis la résolution.
  const directFirstHeight = 84 + 3 * 81 + 2 * 17 + 56;
  const directResolutionHeight = 384;
  const directBottom = stepTop + directFirstHeight + stepGap + directResolutionHeight;

  assert.ok(inquiryBottom <= 2010);
  assert.ok(directBottom <= 1740);
  assert.ok(canvasHeight - inquiryBottom >= 190);
  assert.ok(canvasHeight - directBottom >= 460);
});
