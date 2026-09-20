import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/* Lot K2 (20/09/2026) : les deux « corrections courtes » 6/page du Splat classique —
   « Correction : l’équation (6/page) » et « Correction : le schéma (6/page) ». Seule la
   partie Imprimer de l'outil change : l'écran, la projection et le mode élève ne bougent
   pas, les impressions existantes non plus (voir tests/splat-print-six-par-page.test.mjs). */

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

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

/* Les vraies fonctions de dessin de la page, exécutées avec un faux SVG. */
const AIDES = ["isVariableLabel", "formatCoeffUnknownTerm", "getTrayConfig", "getPrintTrayConfig", "sumArray",
  "approxTextWidthForNumber", "minCellWidthForNumber", "drawBarModelPartsInGroup", "printMathCharWeight",
  "estimatePrintMathTextWidth", "estimateArrowLabelWidth", "measureTextWidth", "measureEquationTextWidth",
  "measureArrowLabelWidth", "fitPrintEquationFontForArrows", "drawOperationArrow", "drawOperationArrowsForLines",
  "numberedResolutionOps", "sixCorrectionPart", "sixCorrectionData", "drawSixCorrectionEquation",
  "sixCorrectionCells", "drawSixCorrectionSchema"];
const moteur = Function(`
  const xChar = "𝑥";
  const variableChars = [xChar, "𝑎", "𝑏", "𝑐", "𝑚", "𝑛", "𝑡"];
  const variableCharSet = new Set([...variableChars, "x", "a", "b", "c", "m", "n", "t"]);
  const document = { createElement(){ return { getContext(){ return null; } }; } };
  let _textMeasureContext = null;
  ${constante("EQUATION_MATH_FONT")}
  ${constante("EQ_OP_ARROW_COLOR")}
  ${constante("SIX_CORRECTION_VIEWBOX")}
  ${html.match(/^const SIX_CORRECTION_LEFT = [^\n]*;/m)[0]}
  ${constante("SIX_CORRECTION_PLAIN_LETTER")}
  ${AIDES.map(extraire).join("\n")}
  return { sixCorrectionPart, sixCorrectionData, drawSixCorrectionEquation, drawSixCorrectionSchema,
           SIX_CORRECTION_VIEWBOX, SIX_CORRECTION_LEFT, SIX_CORRECTION_RIGHT };
`)();

function faux(){
  const el = (nom, a = {}) => ({ nom, a: { ...a }, enfants: [], t: "", appendChild(e){ this.enfants.push(e); return e; } });
  const mk = { el };
  mk.rect = (a) => el("rect", a); mk.line = (a) => el("line", a);
  mk.text = (x, y, t, a = {}) => { const e = el("text", { x, y, ...a }); e.t = t; return e; };
  return { g: el("g"), mk };
}
/* cartes du livret : fiche 7 bis carte 11 (mode A), fiche 9 carte 1 (mode B), fiche 7 carte 1,
   fiche 7 carte 5 (sans jeton visible) */
const cartes = {
  a5taches: { family:"U", total:20, visible:Array(15).fill(1), hidden:Array(5).fill(1), _splats:Array(5).fill({}), _unit:{ tasks:5, hiddenByTask:[1,1,1,1,1] } },
  b3taches: { family:"N", total:36, visible:[21, 6], hidden:[3, 3, 3], _splats:Array(3).fill({}), _num:{ tasks:3, hiddenByTask:[[3],[3],[3]] } },
  a1tache:  { family:"U", total:13, visible:Array(7).fill(1), hidden:Array(6).fill(1), _splats:[{}], _unit:{ tasks:1, hiddenByTask:[6] } },
  a0visible:{ family:"U", total:20, visible:[], hidden:Array(20).fill(1), _splats:Array(4).fill({}), _unit:{ tasks:4, hiddenByTask:[5,5,5,5] } },
};
const [VX, , VW, VH] = moteur.SIX_CORRECTION_VIEWBOX.split(" ").map(Number);
// le SVG fait 80 % de la case, centré : la case va donc de −200 à 1800 en unités de la carte
const CASE_G = VX - VW * 0.125, CASE_D = VX + VW * 1.125;

test("le menu propose les deux corrections courtes, juste après « Correction »", () => {
  const menu = html.slice(html.indexOf('<select id="printMode"'), html.indexOf("</select>", html.indexOf('<select id="printMode"')));
  const ordre = ['value="statement"', 'value="worksheet"', 'value="correction">', "correction courte, 6/page",
                 'value="correction-equation"', 'value="correction-schema"', "recto-verso", 'value="duplex-worksheet"', 'value="duplex-correction"'];
  let k = -1;
  for(const x of ordre){ const j = menu.indexOf(x); assert.ok(j > k, `${x} à sa place dans le menu`); k = j; }
  assert.match(menu, /<option value="correction-equation">Correction : l’équation \(6\/page\)<\/option>/);
  assert.match(menu, /<option value="correction-schema">Correction : le schéma \(6\/page\)<\/option>/);
  assert.match(menu, /<option disabled>── correction courte, 6\/page ──<\/option>/);
  assert.equal(moteur.sixCorrectionPart("correction-equation"), "equation");
  assert.equal(moteur.sixCorrectionPart("correction-schema"), "schema");
  for(const v of ["statement", "worksheet", "correction", "duplex-correction", ""]) assert.equal(moteur.sixCorrectionPart(v), null, v);
});

test("modes A et B seulement ; « Pages » passe à 6/page et se grise, puis revient à sa valeur", () => {
  const ui = extraire("syncPrintModeUI");
  assert.match(ui, /option\[value="correction-equation"\], option\[value="correction-schema"\]'\)\.forEach\(opt => \{ opt\.disabled = kind !== "table"; \}\)/);
  assert.match(ui, /if\(kind !== "table" && sixCorrectionPart\(sel\.value\)\) sel\.value = "correction";/);
  const plan = extraire("getPrintPlan");
  assert.match(plan, /\["statement","worksheet","correction","correction-equation","correction-schema"\]\.includes\(v\)/);
  // on exécute la vraie synchronisation avec un faux sélecteur « Pages »
  const sync = Function("printCardsPerPageEl", "plan", `
    const document = { getElementById(){ return null; } };
    const getPrintPlan = () => ({ recto: plan.v, verso: null });
    ${extraire("sixCorrectionPart")}
    var pagesAvantCorrectionCourte = null;
    ${extraire("syncSixCorrectionPagesUI")}
    return syncSixCorrectionPagesUI;`);
  const pages = { value: "2", disabled: false }, plan2 = { v: "correction-schema" };
  const go = sync(pages, plan2);
  go(); assert.deepEqual([pages.value, pages.disabled], ["6", true]);
  plan2.v = "correction-equation"; go(); assert.deepEqual([pages.value, pages.disabled], ["6", true]);
  plan2.v = "statement"; go(); assert.deepEqual([pages.value, pages.disabled], ["2", false]);
  // la phrase de contrôle dit ce qui part à l'imprimante
  const resume = extraire("syncPrintSummary");
  assert.match(resume, /syncSixCorrectionPagesUI\(\);/);
  assert.ok(resume.includes("Sous chaque carte, l’équation résolue et ses flèches, rien au dos."));
  assert.ok(resume.includes("Sous chaque carte, le schéma en barres et ses calculs, rien au dos."));
  // 6/page + « Correction » (modes A et B) : la phrase dit que la correction complète part en
  // 4/page et montre les deux corrections qui tiennent en 6/page
  assert.match(resume, /if\(sixRefuse && kind === "table" && plan\.recto === "correction" && !plan\.verso\)\{/);
  assert.ok(resume.includes("La correction complète ne tient qu’en 4 par page : elle partira en 4/page. "));
  assert.ok(resume.includes("En 6/page, choisissez « Correction : l’équation » ou « Correction : le schéma »."));
});

test("la feuille : bandeau « — Correction », cadre de consigne de l'énoncé gardé, plateau à la même place", () => {
  const ps = extraire("printSheet");
  assert.match(ps, /const sixPart = sixCorrectionPart\(mode\);\s*\n\s*sheet\.appendChild\(createClassicPrintHeader\(sixPart \? "correction" : mode\)\);/);
  assert.match(ps, /if\(mode !== "correction"\) sheet\.appendChild\(createClassicPrintInstruction\(slotCards\)\);/);
  assert.match(ps, /if\(sixPart\)\{\s*\n\s*renderSixCorrectionIntoSvg\(sv, card, sixPart\);/);
  const rend = extraire("renderSixCorrectionIntoSvg");
  assert.match(rend, /renderCardIntoSvg\(targetSvg, card, "correction"\);/);
  assert.match(rend, /querySelectorAll\("#barModelPrintSteps, #barModelPrintStepsN"\)\.forEach\(el => el\.remove\(\)\)/);
  // même SVG que l'énoncé 6/page (80 % de la case, centré, 1600 de large) : le plateau tombe
  // exactement au même endroit ; la correction déborde à gauche et à droite (overflow visible)
  assert.match(rend, /targetSvg\.style\.width = "80%";\s*\n\s*targetSvg\.style\.overflow = "visible";/);
  assert.equal(VX, 0); assert.equal(VW, 1600);
  assert.equal(VH, 1600);
  assert.deepEqual([CASE_G, CASE_D], [-200, 1800]);
});

test("l'équation : les lignes et les flèches de la correction du mode B, 25 % plus grandes, 4 mm sous le plateau, aussi en mode A", () => {
  const lire = (carte, lettre) => {
    const { g, mk } = faux();
    moteur.drawSixCorrectionEquation(g, carte, lettre, mk);
    const textes = g.enfants.filter(e => e.nom === "text");
    const lignes = [];
    for(let i = 0; i + 2 < textes.length && textes[i + 1].t === "="; i += 3) lignes.push(`${textes[i].t} = ${textes[i + 2].t}`);
    const etiquettes = textes.slice(lignes.length * 3).map(e => e.t);
    return { lignes, etiquettes, textes, fleches: g.enfants.filter(e => e.nom === "path").length };
  };
  const b = lire(cartes.b3taches, "?");
  assert.deepEqual(b.lignes, ["27 + 3 × ? = 36", "3 × ? = 9", "? = 3"]);
  assert.deepEqual(b.etiquettes, ["− 27", "− 27", "÷ 3", "÷ 3"]);
  assert.equal(b.fleches, 8);   // 4 flèches, chacune un trait et une pointe
  const a = lire(cartes.a5taches, "?");
  assert.deepEqual(a.lignes, ["15 + 5 × ? = 20", "5 × ? = 5", "? = 1"]);
  assert.deepEqual(lire(cartes.a1tache, "?").lignes, ["7 + ? = 13", "? = 6"]);
  assert.deepEqual(lire(cartes.a0visible, "?").lignes, ["4 × ? = 20", "? = 5"]);
  // en lettre : la lettre de la carte, écrite simplement (la police est déjà en italique)
  assert.deepEqual(lire(cartes.b3taches, "𝑛").lignes, ["27 + 3n = 36", "3n = 9", "n = 3"]);
  // 25 % plus grande que la correction de l'outil (100 au lieu de 80), l'écart du « = » suit
  assert.equal(Number(b.textes[0].a["font-size"]), 100, "taille de l'équation");
  assert.deepEqual([b.textes[0].a.x, b.textes[2].a.x], [800 - 63, 800 + 63], "écart du signe égal");
  // les membres en Times italique POUR DE VRAI (style en ligne : la règle « * » de la page ne l'emporte pas)
  const membre = b.textes[0].a;
  assert.equal(membre["font-style"], "italic");
  assert.match(membre.style, /font-family:'Times New Roman', Times, serif/);
  // 4 mm sous le plateau (1 unité = 0,0427 mm) : haut des chiffres ≈ ligne de base − 0,72 × police
  const bas = 210 + 60 + 660 + 4;
  const haut = b.textes[0].a.y - 0.72 * Number(b.textes[0].a["font-size"]);
  assert.ok((haut - bas) * 0.0427 >= 3.8 && (haut - bas) * 0.0427 <= 4.6, `écart ${((haut - bas) * 0.0427).toFixed(1)} mm`);
  const derniere = b.textes[8].a.y;
  assert.ok(derniere < VH - 150, "trois lignes tiennent largement");
});

test("le schéma : les trois étapes de l'outil jusqu'au « ? » seul, compactes à gauche, calculs à droite, dans la carte", () => {
  const dessiner = (carte, lettre) => {
    const { g, mk } = faux();
    moteur.drawSixCorrectionSchema(g, carte, lettre, mk);
    const cadres = g.enfants.filter(e => e.nom === "rect" && e.a.fill === "none");
    const calculs = g.enfants.filter(e => e.nom === "text" && e.a["text-anchor"] === "start");
    const cases = g.enfants.filter(e => e.nom === "text" && e.a["text-anchor"] === "middle").map(e => e.t);
    return { cadres, calculs, cases };
  };
  const cas = [
    ["a5taches", 3, ["20 − 15 = 5", "5 ÷ 5 = 1"], 1],
    ["b3taches", 3, ["36 − 27 = 9", "9 ÷ 3 = 3"], 3],
    ["a1tache", 2, ["13 − 7 = 6"], 6],
    ["a0visible", 2, ["20 ÷ 4 = 5"], 5],
  ];
  for(const [nom, n, attendus, h] of cas){
    const { cadres, calculs, cases } = dessiner(cartes[nom], "?");
    assert.equal(cadres.length, n, `${nom} : ${n} schémas`);
    assert.deepEqual(calculs.map(c => c.t), attendus, `${nom} : les calculs`);
    // le dernier schéma est la tache seule : sa valeur au-dessus, « ? » dessous
    assert.deepEqual(cases.slice(-2), [String(h), "?"], `${nom} : « ? » sous sa valeur`);
    // compacts à gauche : tous à partir du même bord gauche de carte, ou sous la partie cachée
    const gauche = Math.min(...cadres.map(c => c.a.x));
    assert.ok(Math.abs(gauche - moteur.SIX_CORRECTION_LEFT) < 1e-6, `${nom} : collés à gauche`);
    const droite = Math.max(...cadres.map(c => c.a.x + c.a.width));
    // chaque calcul : à droite de tous les schémas, à la hauteur du schéma qui sert au calcul
    calculs.forEach((c, i) => {
      assert.ok(c.a.x > droite, `${nom} : calcul ${i + 1} à droite des schémas`);
      const s = cadres[i];
      assert.ok(c.a.y > s.a.y && c.a.y < s.a.y + s.a.height, `${nom} : calcul ${i + 1} en face du schéma ${i + 1}`);
      const largeur = c.t.length * Number(c.a["font-size"]) * 0.6;
      assert.ok(c.a.x + largeur <= CASE_D, `${nom} : calcul ${i + 1} dans la case`);
    });
    // tout tient dans la carte : 1600 de haut, 2 mm de blanc au moins sous le dernier schéma
    const bas = Math.max(...cadres.map(c => c.a.y + c.a.height));
    assert.ok((VH - bas) * 0.0427 >= 1.4, `${nom} : ${((VH - bas) * 0.0427).toFixed(1)} mm sous le dernier schéma`);
    assert.ok(gauche >= CASE_G + 60, `${nom} : pas collé au bord gauche de la case`);
  }
  // le second schéma tombe exactement sous la partie cachée du premier
  const { cadres } = dessiner(cartes.b3taches, "?");
  const lignes = (k) => cadres[k];
  assert.ok(Math.abs((lignes(0).a.x + lignes(0).a.width) - (lignes(1).a.x + lignes(1).a.width)) < 1e-6, "bords droits alignés");
  assert.ok(Math.abs(lignes(1).a.x - lignes(2).a.x) < 1e-6, "la tache seule sous la première case cachée");
  // en lettre : les cases cachées portent la lettre de la carte
  assert.ok(dessiner(cartes.b3taches, "𝑛").cases.filter(t => t === "𝑛").length >= 7);
});
