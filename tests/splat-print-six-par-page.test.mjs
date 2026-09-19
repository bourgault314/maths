import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* Lot B « impression du Splat classique » (monde 2) : réglage 6/page réservé à
   l'énoncé seul, bandeau bleu du monde 2, jetons et cadres imprimés lisibles en
   noir et blanc, liens 📄 Fiche du monde 2 en 6/page. */

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const univers = await readFile(new URL("../outils/splat_univers.html", import.meta.url), "utf8");

function functionSource(name, nextName){
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `la fonction ${name} doit exister`);
  const end = nextName ? html.indexOf(`function ${nextName}(`, start + 1) : -1;
  assert.notEqual(end, -1, `la fonction ${nextName} doit suivre ${name}`);
  return html.slice(start, end);
}

/* getPrintCardsPerPage dépend du sélecteur « Pages » et du plan d'impression :
   on l'exécute avec un faux document et un faux getPrintPlan. */
function cardsPerPage(layoutValue, printValue){
  const source = functionSource("getPrintCardsPerPage", "syncDynamicPrintPageStyle");
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

test("le sélecteur « Pages » propose 6/page et le partage d'adresse l'accepte (layout=6)", () => {
  assert.match(html, /<option value="6">6\/page<\/option>/);
  assert.match(html, /<option value="4" selected>4\/page<\/option>/);
  // setSelectFromShare accepte toute option présente dans le sélecteur : layout=6 passe.
  assert.match(html, /setSelectFromShare\(params, "layout", printCardsPerPageEl\)/);
  assert.match(html, /addShareControl\(params, "layout", printCardsPerPageEl\)/);
  assert.match(html, /const sharedNames = \[[^\]]*"layout"[^\]]*\]/);
});

test("6/page vaut pour l'énoncé seul ; tableau ou correction, recto ou verso, retombent sur 4", () => {
  assert.equal(cardsPerPage("6", "statement"), 6);
  assert.equal(cardsPerPage("6", "worksheet"), 4);
  assert.equal(cardsPerPage("6", "correction"), 4);
  assert.equal(cardsPerPage("6", "duplex-worksheet"), 4);
  assert.equal(cardsPerPage("6", "duplex-correction"), 4);
  // les autres réglages ne bougent pas
  assert.equal(cardsPerPage("4", "statement"), 4);
  assert.equal(cardsPerPage("4", "worksheet"), 4);
  assert.equal(cardsPerPage("2", "statement"), 2);
  assert.equal(cardsPerPage("1", "correction"), 1);
  assert.equal(cardsPerPage("", "statement"), 4);
});

test("en 6/page, la feuille est en 2 × 3 et chaque carte ne dessine que le plateau (1600 × 1000)", () => {
  const printSheet = functionSource("printSheet", "waitForPrintAssets");
  assert.match(printSheet, /perSheet === 6 \? "print-6up" : "print-4up"/);
  assert.match(printSheet, /const cardViewBox = perSheet === 6 \? "0 0 1600 1000" : "0 0 1600 2200"/);
  assert.match(printSheet, /sv\.setAttribute\("viewBox", cardViewBox\)/);
  assert.match(printSheet, /sv\.style\.width = perSheet === 6 \? "80%" : "100%"/);
  assert.match(printSheet, /classList\.remove\("print-1up", "print-2up", "print-4up", "print-6up"\)/);
  // grille 2 colonnes × 3 lignes, plateau à 80 % de la case, centré, hauteur libre
  assert.match(html, /\.printArea\.print-6up \.grid\{grid-template-columns:repeat\(2, 1fr\);grid-template-rows:repeat\(3,minmax\(0,1fr\)\);gap:4mm\}/);
  assert.match(html, /\.printArea\.print-6up \.pCard svg\{width:80%;height:auto;margin:0 auto\}/);
  // 4/2/1 : mêmes règles qu'avant
  assert.match(html, /\.printArea\.print-4up \.grid\{grid-template-columns:repeat\(2, 1fr\);grid-template-rows:repeat\(2,minmax\(0,1fr\)\);gap:5mm\}/);
  assert.match(html, /\.printArea\.print-1up \.grid\{grid-template-columns:1fr;/);
  assert.match(html, /\.printArea\.print-2up \.sheet\{height:calc\(210mm - 16mm\)/);
  // seul 2/page passe en paysage
  const orientation = functionSource("syncDynamicPrintPageStyle", "mirrorSlotsForDuplex");
  assert.match(orientation, /perSheet === 2 \? "landscape" : "portrait"/);
});

test("la phrase de contrôle annonce le nombre réellement imprimé", () => {
  const summary = functionSource("syncPrintSummary", "getSeedForCurrentMode");
  assert.match(summary, /const perPage = String\(getPrintCardsPerPage\(\)\)/);
  assert.match(summary, /6\/page vaut pour l’énoncé seul/);
});

test("le bandeau imprimé est au bleu du monde 2, titre et sous-titre en blanc", () => {
  assert.match(html, /\.print-page-header\{[\s\S]*?background:linear-gradient\(90deg,#0b67b2 0%,#3d8fd1 45%,#e6f1fb 100%\);/);
  assert.match(html, /\.print-page-title\{font-size:17pt;font-weight:950;color:#fff;/);
  assert.match(html, /\.print-page-subtitle\{font-size:11pt;font-weight:850;color:#fff;/);
  assert.doesNotMatch(html, /#ff9815/);
  assert.doesNotMatch(html, /color:#063b7a/);
});

test("à l'impression, les jetons visibles sont bleu franc, les jetons cachés restent gris, l'écran ne change pas", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");
  assert.match(printRenderer, /fill:hidden \? "rgba\(0,0,0,0\.05\)" : "#2563eb", stroke:hidden \? "rgba\(0,0,0,0\.18\)" : "#1e40af"/);
  assert.doesNotMatch(printRenderer, /rgba\(106,167,255,0\.20\)/);
  // dans les tableaux imprimés (tableau à remplir, correction), le nombre de jetons
  // visibles est du même bleu franc, plus le bleu pâle illisible en noir et blanc
  assert.equal((printRenderer.match(/visibleTextColor:"#2563eb"/g) || []).length, 6);
  assert.doesNotMatch(printRenderer, /visibleTextColor:"rgb\(106,167,255\)"/);
  // les variables d'écran gardent leurs jetons translucides
  assert.match(html, /--unit-fill: rgba\(106,167,255,0\.20\);/);
  assert.match(html, /--unit-stroke: rgba\(106,167,255,0\.55\);/);
  const screenRenderer = functionSource("renderCard", "approxTextWidthForLabel");
  assert.match(screenRenderer, /fill:hidden \? "var\(--beadH-fill\)" : "var\(--unit-fill\)"/);
});

test("à l'impression, la case TOTAL ne touche plus le plateau (plateau haut descendu de 25)", () => {
  const trayConfig = functionSource("getPrintTrayConfig", "getUnitSplats");
  assert.match(trayConfig, /const offsetY = tray\.isHigh \? 60 : 0/);
  // case TOTAL : de 22 à 232 (+ trait 4) ; plateau haut : y = 210 + 60 = 270 (− trait 8/2)
  const boxBottom = (92 - 70) + 210 + 2;
  const trayTop = 210 + 60 - 4;
  assert.ok(trayTop - boxBottom >= 30, `blanc entre TOTAL et plateau : ${trayTop - boxBottom}`);
  // le plateau descendu tient encore dans la carte 6/page (viewBox 1000 de haut)
  assert.ok(210 + 60 + 660 + 4 <= 1000);
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");
  assert.match(printRenderer, /let tx = 800, ty = 92/);
  assert.match(printRenderer, /const boxY = ty - 70;/);
});

test("à l'impression, les cadres sont gris foncé sur fond blanc (cases et plateau)", () => {
  assert.match(html, /\.pCard\{border:1\.5px solid #334155;/);
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");
  assert.match(printRenderer, /x:printTray\.x, y:trayY, width:printTray\.w, height:trayH,\s*rx:30, fill:"#fff", stroke:"#334155", "stroke-width":"8"/);
  assert.doesNotMatch(printRenderer, /stroke:"rgba\(0,0,0,0\.15\)"/);
});

test("à l'impression, les jetons numérotés (B, B±) sont blancs à anneau de couleur, chiffre à 100 % (taille d'avant au-delà de 2 chiffres)", () => {
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");
  assert.match(printRenderer, /const ringV = String\(colV\.stroke\)\.replace\(\/,\\s\*\[\\d\.\]\+\\\)\$\/, ", 1\)"\);/);
  assert.match(printRenderer, /r:beadR, fill:"#fff", stroke:ringV,"stroke-width":"7"/);
  // chiffre à 1,02 × le rayon ; au-delà de 2 chiffres, la taille d'avant (0,9 × le rayon),
  // sinon « 446 » touche l'anneau. On exécute les vraies expressions de la page.
  const exprV = printRenderer.match(/const fontV = ([^;]+);/);
  const exprH = printRenderer.match(/const fontH = ([^;]+);/);
  assert.ok(exprV && exprH, "la taille du nombre imprimé dépend de son nombre de chiffres");
  assert.match(printRenderer, /String\(card\.visible\[i\]\), \{[^}]*"font-size":String\(fontV\)/);
  assert.match(printRenderer, /String\(card\.hidden\[i\]\), \{[^}]*"font-size":String\(fontH\)/);
  const beadR = 68, font = Math.round(68 * 0.9);
  const tailleV = (v) => Function("card", "i", "beadR", "font", `return ${exprV[1]};`)({ visible: [v] }, 0, beadR, font);
  const tailleH = (v, useTokens) => Function("card", "i", "beadR", "font", "useTokens", `return ${exprH[1]};`)({ hidden: [v] }, 0, beadR, font, useTokens);
  for(const v of [6, 28, -27]) assert.equal(tailleV(v), 69, `jeton visible ${v}`);
  for(const v of [100, 205, 446]) assert.equal(tailleV(v), font, `jeton visible ${v}`);
  assert.equal(tailleH(-27, true), 69);   // B± : jeton caché dévoilé de la correction
  assert.equal(tailleH(205, true), font);
  assert.equal(tailleH(12, false), font); // B : les jetons cachés gardent leur taille
  // le rayon imprimé ne change pas : les jetons les plus proches des étapes 8-9 sont à 20 unités
  assert.doesNotMatch(printRenderer, /r:Math\.round\(beadR \* 1\.1\)/);
  // l'anneau opaque garde bien la teinte : hsla(h, s, l, a) → hsla(h, s, l, 1)
  const opaque = (str) => String(str).replace(/,\s*[\d.]+\)$/, ", 1)");
  assert.equal(opaque("hsla(210, 80%, 48%, 0.55)"), "hsla(210, 80%, 48%, 1)");
  assert.equal(opaque("hsla(140, 70%, 40%, 0.8)"), "hsla(140, 70%, 40%, 1)");
  // B± : le jeton caché dévoilé de la correction suit la même règle ; en B il reste gris
  assert.match(printRenderer, /f = "#fff"; s = String\(c\.stroke\)\.replace\(/);
  assert.match(printRenderer, /let f = "rgba\(0,0,0,0\.06\)";/);
  // l'écran garde ses jetons colorés pleins
  const screenRenderer = functionSource("renderCard", "approxTextWidthForLabel");
  assert.match(screenRenderer, /beadColorForValue\(card\.visible\[i\]\)/);
  assert.doesNotMatch(screenRenderer, /ringV/);
});

test("le pied de page imprimé est lisible en photocopie et décollé des cartes", () => {
  assert.match(html, /\.print-page-footer\{flex:0 0 3\.5mm;margin-top:3mm;text-align:center;color:#64748b;font-size:7pt;/);
  assert.doesNotMatch(html, /\.print-page-footer\{[^}]*#98a2b3/);
  assert.match(html, /\.sheet\{[\s\S]*?padding:4mm 5mm 0\.5mm;/);
  assert.match(html, /\.printArea\.print-2up \.sheet\{height:calc\(210mm - 16mm\);padding:3mm 4mm 0\.5mm\}/);
});

test("les 5 liens 📄 Fiche du monde 2 impriment l'énoncé seul à 6 par page", () => {
  assert.match(univers, /const FICHE="&print=statement&layout=6&imprimer=1&title=";/);
  assert.match(univers, /seed=347&unknown=question&print=statement&layout=6&imprimer=1"/);
  assert.match(univers, /seed=18&unknown=question&print=statement&layout=6&imprimer=1"/);
  // plus aucun tableau fourni sur les fiches du monde 2 ; le monde 3 garde les siens
  const m2 = univers.slice(univers.indexOf('cls:"m2"'), univers.indexOf('cls:"m3"'));
  assert.doesNotMatch(m2, /print=worksheet/);
  assert.equal((m2.match(/layout=6/g) || []).length, 2 + 0); // étapes 8 et 9 ; l'étape 7 passe par FICHE
  assert.equal((m2.match(/\+FICHE\+/g) || []).length, 3);
  // les liens élève (j) et de projection (jp) ne portent aucun réglage d'impression
  for(const m of m2.matchAll(/\b(j|jp):SC\+"([^"]*)"/g)){
    assert.doesNotMatch(m[2], /print=|layout=|imprimer=/);
  }
});
