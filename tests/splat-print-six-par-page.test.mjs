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

test("lot K2 : les deux corrections courtes s'impriment toujours en 6/page, quel que soit « Pages »", () => {
  for(const v of ["correction-equation", "correction-schema"]){
    for(const l of ["6", "4", "2", "1", ""]) assert.equal(cardsPerPage(l, v), 6, `${v}, Pages ${l || "(vide)"}`);
  }
  // et la correction complète garde sa règle : 6/page retombe sur 4
  assert.equal(cardsPerPage("6", "correction"), 4);
});

test("en 6/page, la feuille est en 2 × 3 et chaque carte ne dessine que le plateau (1600 × 1000)", () => {
  const printSheet = functionSource("printSheet", "waitForPrintAssets");
  assert.match(printSheet, /perSheet === 6 \? "print-6up" : "print-4up"/);
  assert.match(printSheet, /const cardViewBox = perSheet === 6 \? "0 0 1600 1000" : "0 0 1600 2200"/);
  // lot P : les modes A, A±, B et B± passent d'abord par la colonne (voir le test du lot P) ;
  // l'Enquête et le Système gardent le plateau seul à 80 %
  assert.match(printSheet, /\}else if\(perSheet === 6 && sixColonneFamille\(card\)\)\{/);
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

/* Lot P (24/09/2026) : en 6/page, modes A, A±, B et B±, la case TOTAL passe à droite du
   plateau et le plateau remonte en haut de la case — 39 mm de blanc dessous au lieu de 29,5. */
test("lot P : en 6/page (A, A±, B, B±), TOTAL et case réponse dans une colonne à droite, plateau en haut, même taille", () => {
  const C = Function(`${html.match(/^const SIX_COLONNE = [^\n]*;/m)[0]} return SIX_COLONNE;`)();
  const vb = Function(`const SIX_COLONNE = ${JSON.stringify(C)}; ${html.match(/^const SIX_COLONNE_VIEWBOX = [^\n]*;/m)[0]} return SIX_COLONNE_VIEWBOX;`)();
  assert.equal(vb, "0 0 2000 730");
  // le plateau garde sa taille physique : 1360 sur 2000 à 100 % = 1360 sur 1600 à 80 %
  assert.ok(Math.abs(1360 / C.largeur - 1360 / 1600 * 0.8) < 1e-12);
  // colonne de 400 à 60 du plateau, marges gauche et droite égales, plateau en haut (y 40)
  assert.equal(C.colonneX - (C.plateauX + 1360), 60);
  assert.equal(C.colonneW, 400);
  assert.equal(C.plateauX, C.largeur - (C.colonneX + C.colonneW));
  assert.equal(C.plateauY, 40);
  assert.equal(C.hauteur, C.plateauY + C.plateauH + 30);
  assert.equal(C.plateauH, 660);
  // TOTAL (210) en haut et case réponse en bas de la colonne ne se touchent pas
  assert.ok(C.plateauH - 210 - C.reponseH >= 200);

  // seules les familles A, A±, B, B± ; l'Enquête (C) et le Système (D) gardent leur 6/page
  const fam = Function(`${functionSource("sixColonneFamille", "drawSixReponseCase")} return sixColonneFamille;`)();
  assert.deepEqual(["U", "UPM", "N", "NPM", "C", "D"].map(f => fam({ family:f })), [true, true, true, true, false, false]);
  const printSheet = functionSource("printSheet", "waitForPrintAssets");
  assert.match(printSheet, /\}else if\(perSheet === 6 && sixColonneFamille\(card\)\)\{\s*\n[^\n]*\n\s*sv\.setAttribute\("viewBox", SIX_COLONNE_VIEWBOX\);\s*\n\s*sv\.style\.width = "100%";\s*\n\s*renderCardIntoSvg\(sv, card, mode, \{ sixColonne:true \}\);/);

  // le dessin : le plateau et tout ce qu'il porte dans un groupe seulement translaté (taches et
  // jetons gardent leurs places), le TOTAL dans la colonne, 400 de large, aligné sur le haut du plateau
  const rend = functionSource("renderCardIntoSvg", "sixColonneFamille");
  assert.match(rend, /targetSvg = tEl\("g",\{id:"plateauSixPrint", transform:`translate\(\$\{SIX_COLONNE\.plateauX - printTray\.x\} \$\{SIX_COLONNE\.plateauY - trayY\}\)`\}\);/);
  assert.match(rend, /if\(opts\.sixColonne\)\{ tx = SIX_COLONNE\.colonneX \+ SIX_COLONNE\.colonneW\/2; ty = SIX_COLONNE\.plateauY \+ 70; \}/);
  assert.match(rend, /let boxW = opts\.sixColonne \? SIX_COLONNE\.colonneW : 280;/);
  assert.match(rend, /if\(opts\.sixColonne\) drawSixReponseCase\(racine, revealAnswers \? sixCorrectionData\(card\)\.h : null, tEl, tText, sixReponseInconnue\(card\)\);/);

  /* la case réponse, exécutée : « ? = ……… » ou « 𝑛 = ……… » sur une ligne, en bas de la colonne.
     Relecture du monde 2 (26/09/2026) : l'inconnue elle-même remplace la petite tache du lot P —
     « ? » avec le réglage « ? », la lettre de la carte avec le réglage 𝑥, en SplatLettres. */
  const dessiner = Function("valeur", "inconnue", `
    const SIX_COLONNE = ${JSON.stringify(C)};
    ${functionSource("drawSixReponseCase", "printSheet")}
    const el = (nom, a = {}) => ({ nom, a, enfants: [], t: "", appendChild(e){ this.enfants.push(e); return e; } });
    const text = (x, y, t, a = {}) => { const e = el("text", { x, y, ...a }); e.t = t; return e; };
    const hote = el("svg");
    drawSixReponseCase(hote, valeur, el, text, inconnue);
    return { g: hote.enfants[0] };`);
  const vide = dessiner(null, "?");
  assert.equal(vide.g.a.id, "reponseGroupPrint");
  const [cadre, inc, egal, pointilles] = vide.g.enfants;
  assert.deepEqual([cadre.a.x, cadre.a.y + cadre.a.height, cadre.a.width], [C.colonneX, C.plateauY + C.plateauH, 400], "calée sur le bas du plateau");
  assert.deepEqual([inc.nom, inc.t], ["text", "?"], "l'inconnue « ? » en tête de la case");
  assert.equal(inc.a["font-weight"], "900");
  assert.equal(inc.a.fill, "#000");
  assert.deepEqual([egal.nom, egal.t], ["text", "="]);
  assert.ok(inc.a.x < egal.a.x, "l'inconnue avant le signe égal");
  assert.equal(pointilles.nom, "line");
  assert.equal(pointilles.a["stroke-dasharray"], "0.1 18");
  // 8 mm de pointillés environ (case de 88 mm pour 2000 unités), sur la ligne du « = »
  const mm = (pointilles.a.x2 - pointilles.a.x1) * 88 / 2000;
  assert.ok(mm >= 7 && mm <= 9, `${mm.toFixed(1)} mm de pointillés`);
  assert.ok(pointilles.a.x2 <= C.colonneX + 400 - 30);
  assert.equal(vide.g.enfants.filter(e => e.nom === "text").length, 2, "l'inconnue et le signe égal, pas de mot");
  // en lettre : la lettre de la carte, en SplatLettres donnée en style en ligne
  const lettre = dessiner(null, "𝑛").g.enfants[1];
  assert.equal(lettre.t, "𝑛");
  assert.match(lettre.a.style, /font-family:SplatLettres, 'Times New Roman', Times, serif/);
  assert.equal(lettre.a["font-style"], "italic");
  // en correction courte (lot K2) : la valeur à la place des pointillés
  const corr = dessiner(3, "?");
  assert.deepEqual(corr.g.enfants.map(e => e.nom), ["rect", "text", "text", "text"]);
  assert.equal(corr.g.enfants[3].t, "3");
  assert.ok(corr.g.enfants[3].a.x > egal.a.x, "le nombre à côté du signe égal");

  // l'inconnue de la case : celle de la correction de la carte (getNumberedDisplayVarChar)
  const inconnueDe = Function("mode", `
    const xChar = "𝑥"; const numberedQuestionMarkMode = mode;
    ${functionSource("getCardVarChar", "isVariableLabel")}
    ${functionSource("getNumberedDisplayVarChar", "formatCoeffUnknownTerm")}
    ${functionSource("sixReponseInconnue", "drawSixReponseCase")}
    return sixReponseInconnue;`);
  assert.equal(inconnueDe(true)({ family:"N", varChar:"𝑛" }), "?");
  assert.equal(inconnueDe(false)({ family:"N", varChar:"𝑛" }), "𝑛");
  assert.equal(inconnueDe(false)({ family:"U" }), "𝑥", "une carte sans lettre prend 𝑥");
});

test("à l'impression, les cadres sont gris foncé sur fond blanc (cases et plateau)", () => {
  assert.match(html, /\.pCard\{border:1\.5px solid #334155;/);
  const printRenderer = functionSource("renderCardIntoSvg", "printSheet");
  // (lot G1 : la correction de l'Enquête dessine ce plateau moins haut — trayHDessine —, même
  // contour, même fond)
  assert.match(printRenderer, /x:printTray\.x, y:trayY, width:printTray\.w, height:trayHDessine,\s*rx:30, fill:"#fff", stroke:"#334155", "stroke-width":"8"/);
  // (01/10/2026) l'énoncé de l'Enquête aussi, sauf en 6/page (sixColonne garde son plateau)
  assert.match(printRenderer, /const trayHDessine = \(enqueteCompacte \|\| enqueteEnoncePetit\) \? ENQ_PLATEAU_CORRECTION_H : trayH;/);
  assert.match(printRenderer, /const enqueteEnoncePetit = [^;]*!opts\.sixColonne/);
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

test("les 7 liens 📄 Fiche du monde 2 impriment l'énoncé seul à 6 par page", () => {
  assert.match(univers, /const FICHE="&print=statement&layout=6&imprimer=1&title=";/);
  // plus aucun tableau fourni sur les fiches du monde 2 ; le monde 5 (Équations) garde les siens
  const m2 = univers.slice(univers.indexOf('cls:"m2"'), univers.indexOf('cls:"m3"'));
  assert.doesNotMatch(m2, /print=worksheet/);
  // tous les liens passent par FICHE : les trois activités de l'étape 7, puis, depuis la relecture du
  // monde 2 (26/09/2026), les deux séries de 6 cartes des étapes 8 et 9
  assert.equal((m2.match(/layout=6/g) || []).length, 0);
  assert.equal((m2.match(/\+FICHE\+/g) || []).length, 7);
  for (const c of ["M2E4A", "M2E4B", "M2E5A", "M2E5B"]) assert.match(m2, new RegExp(`f:SC\\+"\\?"\\+${c}\\+FICHE\\+`), c);
  // les liens élève (j) et de projection (jp) ne portent aucun réglage d'impression
  for(const m of m2.matchAll(/\b(j|jp):SC\+"([^"]*)"/g)){
    assert.doesNotMatch(m[2], /print=|layout=|imprimer=/);
  }
});
