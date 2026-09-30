/* SPLAT! — le Système (mode D), lot « mode élève » (24/09/2026 ; conception S0, § 8).
   Les cartes du mode D se jouent en ?eleve=1 comme l'Enquête : une case par COULEUR (les
   taches d'une couleur cachent le même nombre), le TOTAL du plateau principal donné (« ? »
   pour « Trois paires »), cases de largeur égale avant ET après la validation (décision du
   24/09), taches dévoilées sur tous les plateaux, « Voir le schéma » qui déroule les cadres
   de la correction S3 (un par appui, cadrage fixe sur ordinateur, dessin portrait au
   téléphone). Les fonctions de outils/splat.html sont extraites du fichier et exécutées
   telles quelles ; le générateur fournit les cartes. Le mode élève de l'Enquête et du
   monde 2 est couvert par ses propres tests, qui passent sans changement de comportement. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function ligne(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}
function constante(nom){
  const start = html.indexOf(`\nconst ${nom} = `);
  assert.notEqual(start, -1, `${nom} introuvable`);
  return html.slice(start + 1, html.indexOf(";\n", start) + 2);
}

const PALETTE = html.slice(html.indexOf("const INVESTIGATE_COLOR_PALETTE = ["), html.indexOf("];", html.indexOf("const INVESTIGATE_COLOR_PALETTE = [")) + 2);
const CONSTANTES = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_MAX_TACHES", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS", "SYS_COULEURS_PLURIEL", "SYS_PLAGES",
  "SYS_ZONE_ECRAN", "SYS_ZONE_IMPRIME", "SYS_ZONE_IMPRIME_6", "SYS_TACHE", "SYS_CORR", "SYS_CORR_LOUPE_MAX", "SYS_ZONE_ECRAN_CORRECTION", "SYS_ZONE_IMPRIME_CORRECTION",
  "SYS_FIL", "SYS_UNIQUE_ECRAN", "SYS_UNIQUE_IMPRIME", "SYS_TEL", "SYS_ZONE_TEL_CORRECTION", "ENQUETE_DEPASSE_TRAIT", "ENQUETE_DEPASSE_FOND", "ENQUETE_ECRITURE_FOND", "ENQUETE_ECRITURE_ENCRE",
  "ENQUETE_NOM_ECART"].map(constante).join("\n");
const GENERATEUR = ["sysNormaliserReglages", "genSystemCarte", "sysFormes", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure",
  "sysAssemblerCarte", "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlan"].map(fn).join("\n");
const DESSIN = ["sysEnPlateaux", "sysTotalCache", "sysRayonJeton", "sysGrille", "sysColonnesVisibles", "sysRayonMax", "sysDispositionPlateaux", "drawSysPlateaux",
  "sysAPlan", "sysDevoileEleve", "sysCorrPoids", "sysCorrLongueur", "sysCorrUnite", "sysCorrMetriques", "sysCorrHauteurCadre", "sysCorrMesures", "sysCorrEtiquette",
  "sysCorrLargeurCalcul", "sysCorrAjuster", "drawSysCase", "drawSysBarre", "drawSysCadre", "blobPath", "wrapTextToWidth", "beadColorForValue",
  "drawInvestigateSplatName", "investigateColorInfo", "sysTelMesures", "drawSysCadrePortrait", "drawSysCorrectionTelephone"].map(fn).join("\n");
const ELEVE = ["eleveInfosEnquete", "eleveInfosSysteme", "eleveInfosTableau", "eleveSchemaEtapes", "eleveTacheCouleurHtml", "eleveCaseDonneeHtml",
  "eleveCasesEnqueteHtml", "eleveCaseHtml"].map(fn).join("\n");

/* faux SVG : des objets, les textes gardés dans l'ordre */
const FAUX_SVG = `
  const mkEl = (name, attrs = {}) => ({ name, attrs, children: [], appendChild(c){ this.children.push(c); return c; } });
  const mkText = (x, y, t, attrs = {}) => ({ name: "text", attrs: { x, y, ...attrs }, text: String(t), children: [], appendChild(){} });
  const el = mkEl, text = mkText;
  let svg = mkEl("svg");
  function clearSvg(){ svg = mkEl("svg"); }
  let numberedQuestionMarkMode = true;
`;

const sys = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  let _textMeasureContext = null;
  ${fn("measureTextWidth")}
  ${fn("buildInvestigateColorMap")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${CONSTANTES}
  ${ligne("const ELEVE_TACHE_MINI = ")}
  ${ligne("const ELEVE_SCHEMA_ETAPES = ")}
  /* l'Enquête (lot G1) : quatre étapes pour une carte avec total — le vrai calcul lit le modèle en barres */
  function enqueteDerniereEtape(card){ return 4; }
  ${GENERATEUR}
  ${DESSIN}
  ${ELEVE}
  ${FAUX_SVG}
  let eleveEnqueteDevoile = false;
  return {
    GESTES: SYS_GESTES, TEL: SYS_TEL, ZT: SYS_ZONE_TEL_CORRECTION, C: SYS_CORR,
    mot: (k) => investigateColorWord(investigateColorByKey(k)),
    infos: eleveInfosSysteme, tableau: eleveInfosTableau, etapes: eleveSchemaEtapes, bas: eleveCasesEnqueteHtml, totalCache: sysTotalCache,
    aPlan: sysAPlan, devoile: (card, d) => { eleveEnqueteDevoile = d; return sysDevoileEleve(card); },
    telMesures: sysTelMesures,
    portrait(card, k){ svg = mkEl("svg"); drawSysCorrectionTelephone(card, k); return svg; },
    cadrePortrait(card, etape, numero){ const r = mkEl("g"); const m = sysTelMesures(card); const h = drawSysCadrePortrait(r, card, etape, 100, m, { mkEl, mkText, isPrint:false, lettres:false, C:m.C }, numero); return { g: r.children[0], h, m }; },
    serie(graine, n, reglages){
      const rng = mulberry32(graine);
      const out = [];
      for(let i = 0; i < n; i++) out.push(genSystemCarte(rng, reglages));
      return out;
    }
  };
`)();

const sousEntendu = (n) => ["69", "88", "420", "666", "1488"].some((x) => String(n).includes(x));
function graines(n){ const out = []; for(let s = 1; out.length < n; s++) if(!sousEntendu(s)) out.push(s); return out; }
/* 6 gestes × 3 réglages × 40 graines × 4 cartes */
const REGLAGES = [{}, { visMax: 6, coefMax: 4, totalMax: 150 }, { visMin: 0, visMax: 0, coefMax: 4 }];
const CARTES = [];
for(const geste of sys.GESTES) for(const r of REGLAGES) for(const g of graines(40)) for(const c of sys.serie(g, 4, { geste, ...r })) CARTES.push(c);

const textes = (n, out = []) => { if(!n) return out; if(n.name === "text") out.push(n); (n.children || []).forEach((c) => textes(c, out)); return out; };
const elements = (n, name, out = []) => { if(!n) return out; if(n.name === name) out.push(n); (n.children || []).forEach((c) => elements(c, name, out)); return out; };
const casesDe = (h) => [...h.matchAll(/<div class="eleveCase ([^"]+)" style="([^"]+)"( data-attendu="(\d+)")?>([\s\S]*?)<\/div>/g)]
  .map((m) => ({ classes: m[1], style: m[2], attendu: m[4], contenu: m[5] }));

// --- le tableau : une case par couleur ----------------------------------------------------
test("chaque carte du Système donne une case par COULEUR, dans l'ordre des couleurs de la carte, avec la valeur de la couleur", () => {
  assert.ok(CARTES.length > 2000);
  for(const c of CARTES){
    const i = sys.infos(c);
    assert.ok(i && i.systeme, "une carte du Système a son tableau");
    assert.equal(i.ordre.length, c._sys.colors.length, "une case par couleur");
    assert.deepEqual(i.ordre.map((k) => c._colorMap[k]), c._sys.colors, "dans l'ordre des couleurs (celui des rangées de la grille)");
    assert.deepEqual(i.ordre.map((k) => i.valeurs[k]), c._sys.colors.map((k) => c._sys.values[k]), "la valeur cachée par la couleur");
    assert.equal(i.visibleSum, (c.visible || []).reduce((s, v) => s + v, 0));
    assert.equal(i.tasks, c.hidden.length);
    // eleveInfosTableau : le Système passe par le même chemin que l'Enquête
    assert.deepEqual(sys.tableau(c), i);
  }
  // les cartes à plusieurs taches d'une couleur existent bien dans le jeu d'essai (COEF, PARTIELLE, DOUBLE)
  assert.ok(CARTES.some((c) => c.hidden.length > c._sys.colors.length));
});

test("hors Système : rien (Enquête, monde 2, carte D sans plan, valeur nulle)", () => {
  assert.equal(sys.infos({ family: "C", hidden: [3, 4], _rel: {}, _sys: { plan: [{}], colors: ["black"] } }), null);
  assert.equal(sys.infos({ family: "N", hidden: [6, 6] }), null);
  assert.equal(sys.infos({ family: "D", hidden: [6, 6], _colorMap: ["black", "green"], _sys: { colors: ["black", "green"] } }), null, "ancienne carte D sans plan");
  assert.equal(sys.infos({ family: "D", hidden: [0, 6], _colorMap: ["black", "green"], _sys: { plan: [{}], colors: ["black", "green"] } }), null, "une tache vide n'est pas jouable");
  assert.equal(sys.infos(null), null);
  // l'Enquête garde son propre chemin
  const enq = { family: "C", total: 15, hidden: [10, 5], visible: [], _num: { tasks: 2 }, _splats: [{ cx: 100 }, { cx: 900 }], _rel: {} };
  assert.deepEqual(sys.tableau(enq), { tasks: 2, valeurs: [10, 5], visibleSum: 0, ordre: [0, 1] });
});

test("les cases : largeur égale, mini-tache à la couleur + nom, « ? » ; les jetons visibles donnés ; TOTAL « ? » pour Trois paires", () => {
  const coef = CARTES.find((c) => c._sys.geste === "COEF" && c.hidden.length === 4 && c.visible.length === 0);
  const i = sys.infos(coef);
  const cases = casesDe(sys.bas(coef, i));
  assert.equal(cases.length, 2, "quatre taches, deux couleurs : deux cases");
  assert.deepEqual(cases.map((x) => x.style), ["flex:1 1 0", "flex:1 1 0"]);
  cases.forEach((x, k) => {
    assert.equal(x.classes, "grise");
    assert.equal(x.attendu, String(coef._sys.values[coef._sys.colors[k]]));
    assert.match(x.contenu, /class="eleveTacheCouleur"/);
    assert.match(x.contenu, /placeholder="\?"/);
  });
  const vis = CARTES.find((c) => c.visible.length >= 2);
  const cv = casesDe(sys.bas(vis, sys.infos(vis)));
  assert.equal(cv[0].classes, "blanche donnee", "les jetons visibles : case donnée, avant les couleurs");
  assert.match(cv[0].contenu, new RegExp(`>${vis.visible.reduce((s, v) => s + v, 0)}<`));
  assert.equal(cv.length, 1 + vis._sys.colors.length);
  // Trois paires : total du plateau principal caché
  const trois = CARTES.find((c) => c._sys.geste === "TROIS");
  assert.ok(sys.totalCache(trois));
  assert.ok(!sys.totalCache(coef));
});

test("renderEleveSplat : le Système passe (classe « systeme »), le TOTAL donné ou « ? », le message « n'existe pas » reste pour C9/C8", () => {
  const rendu = fn("renderEleveSplat");
  assert.match(rendu, /const enquete = infos \? null : eleveInfosTableau\(card\);/);
  assert.match(rendu, /if\(!infos && !enquete\)\{\n    tete\.style\.display = "none";\n    panneau\.innerHTML = `<p class="eleveConsigne">Le parcours élève n'existe pas encore pour ce mode\.<\/p>`;/);
  assert.match(rendu, /panneau\.classList\.toggle\("systeme", !!\(enquete && enquete\.systeme\)\);/);
  assert.match(rendu, /panneau\.classList\.toggle\("sansTotal", !!\(enquete && \(\(card\._rel && card\._rel\.sansTotal\) \|\| sysTotalCache\(card\)\)\)\);/);
  assert.match(rendu, /haut = eleveCaseDonneeHtml\("haut blanche", "Total", \(\(card\._rel && card\._rel\.sansTotal\) \|\| sysTotalCache\(card\)\) \? "\?" : card\.total\);/);
});

// --- après la validation --------------------------------------------------------------------
test("après validation, les cases du Système restent ÉGALES (une case vaut une couleur, pas une tache) ; l'Enquête garde ses vraies largeurs", () => {
  const casesBas = [{ attendu: "9" }, { attendu: "4" }].map((c) => ({ ...c, style: {}, classList: { contains: () => false }, getAttribute: () => c.attendu }));
  const diag = { classes: [], classList: { add(k){ diag.classes.push(k); } } };
  const panneau = { classList: { contains: (k) => k === "enquete" }, querySelector: (sel) => (sel === ".eleveDiag" ? diag : null), querySelectorAll: () => casesBas };
  const lancer = (systeme) => new Function("document", `
    let eleveIdx = 0;
    const eleveSerie = [{ family: "${systeme ? "D" : "C"}" }];
    function eleveInfosEnquete(card){ return card.family === "C" ? { visibleSum: 0 } : null; }
    function eleveInfosSysteme(card){ return card.family === "D" ? { visibleSum: 0, systeme: true } : null; }
    function sysAPlan(card){ return card.family === "D"; }
    ${fn("eleveInfosTableau")}
    ${fn("eleveEnqueteLargeursVraies")}
    eleveEnqueteLargeursVraies();
  `)({ getElementById: () => panneau });
  lancer(true);
  assert.deepEqual(casesBas.map((c) => c.style.flexGrow), [undefined, undefined], "Système : rien ne bouge");
  assert.deepEqual(diag.classes, [], "pas de classe « vraies » non plus");
  lancer(false);
  assert.deepEqual(casesBas.map((c) => c.style.flexGrow), ["9", "4"], "Enquête : inchangée");
});

test("le dévoilement : sysDevoileEleve lit le drapeau, les plateaux se dessinent dévoilés à l'énoncé et à chaque cadre, sans rejouer le fondu", () => {
  const c = CARTES[0];
  assert.equal(sys.devoile(c, false), false);
  assert.equal(sys.devoile(c, true), true);
  assert.equal(sys.devoile({ family: "C", _sys: { plan: [{}] } }, true), false, "l'Enquête a son propre drapeau");
  assert.match(fn("eleveDevoilerTache"), /if\(card && eleveInfosTableau\(card\)\)\{[^\n]*\n    eleveEnqueteDevoile = true;\n    renderCard\(card, eleveSchemaEtape\);/);
  const ecran = fn("drawSysCorrectionEcran");
  assert.match(ecran, /const devoileEleve = sysDevoileEleve\(card\);/);
  assert.match(ecran, /drawSysPlateaux\(svg, card, SYS_ZONE_ECRAN_CORRECTION, \{ devoile: dernier \|\| devoileEleve, fondu: !devoileEleve, nomMin: SYS_ZONE_ECRAN_CORRECTION\.nomMin \}\);/);
  assert.match(ecran, /renderCard\(sysCarteSansIndices\(card\), \(dernier \|\| devoileEleve\) \? 2 : 0, \{ sansCorrection:true \}\);/);
  const rc = fn("renderCard");
  assert.match(rc, /drawSysPlateaux\(svg, card, SYS_ZONE_ECRAN, \{ devoile: revealState >= 2 \|\| sysDevoileEleve\(card\) \}\);/);
  assert.match(rc, /\(isABProjectionLayout \? abRevealPhase : \(sysDevoileEleve\(card\) \? 2 : revealState\)\)/, "plateau unique (Phrases / Symboles) dévoilé aussi");
});

// --- « Voir le schéma » ------------------------------------------------------------------
test("le nombre d'étapes du schéma : un cadre par étape du plan ; l'Enquête a les siennes (quatre, lot G1)", () => {
  for(const c of CARTES) assert.equal(sys.etapes(c), c._sys.plan.length);
  assert.equal(sys.etapes({ family: "C", _rel: {} }), 4);
  assert.ok(CARTES.some((c) => c._sys.plan.length === 4) && CARTES.some((c) => c._sys.plan.length === 5), "des plans de 4 (Trois paires) et de 5");
});

test("eleveVoirSchema : un appui par cadre, le bouton s'efface au dernier cadre du plan (4 pour Trois paires)", () => {
  const boutons = [];
  const suivant = { focus(){ this.focalise = true; } };
  const valider = { hidden: false, parentNode: { appendChild: (b) => boutons.push(b) } };
  const document = {
    createElement: () => ({ remove(){ this.retire = true; boutons.splice(boutons.indexOf(this), 1); } }),
    getElementById: (id) => (id === "eleveSchema" ? boutons.find((b) => b.id === "eleveSchema") || null : null),
    querySelector: (sel) => (sel === "#elevePanel .eleveActions .suivant" ? suivant : null)
  };
  const ctx = new Function("document", `
    let eleveSchemaEtape = 0, eleveIdx = 0;
    ${ligne("const ELEVE_SCHEMA_ETAPES = ")}
    const eleveSerie = [{ family: "D", hidden: [10, 5, 3], _colorMap: ["black", "green", "red"], _sys: { colors: ["black", "green", "red"], plan: [{}, {}, {}, {}] } }];
    const dessins = [];
    function eleveInfosEnquete(){ return null; }
    ${fn("sysAPlan")}
    ${fn("eleveInfosSysteme")}
    ${fn("eleveInfosTableau")}
    ${fn("eleveSchemaEtapes")}
    function eleveDessinerSchema(card){ dessins.push(eleveSchemaEtape); }
    ${fn("eleveProposerSchema")}
    ${fn("eleveVoirSchema")}
    return { proposer: eleveProposerSchema, voir: eleveVoirSchema, dessins, etape: () => eleveSchemaEtape };
  `)(document);
  ctx.proposer(valider);
  assert.equal(boutons.length, 1, "le bouton jaune est proposé pour le Système");
  assert.equal(valider.hidden, true);
  for(let k = 0; k < 6; k++) ctx.voir();
  assert.deepEqual(ctx.dessins, [1, 2, 3, 4], "quatre cadres, puis plus rien");
  assert.equal(boutons.length, 0, "le bouton s'est effacé au 4e");
  assert.equal(suivant.focalise, true);
});

test("ordinateur : le cadrage est FIXE d'un cadre à l'autre (l'union des cadrages de la carte), et retombe avec la carte", () => {
  const rendus = [];
  const boites = { 1: { x: 40, y: 0, width: 1100, height: 700 }, 2: { x: 60, y: 10, width: 1480, height: 500 }, 3: { x: 60, y: 10, width: 1480, height: 900 } };
  const svg = { vb: [], bb: null, getBBox(){ return this.bb; }, setAttribute(k, v){ if(k === "viewBox") this.vb.push(v); }, style: {} };
  const ctx = new Function("svg", `
    let eleveIdx = 0, eleveSchemaEtape = 0, eleveSchemaTelReserve = null;
    const rendus = [];
    function renderCard(card, e){ rendus.push(e); svg.bb = ${JSON.stringify(boites)}[e]; }
    function eleveCadrerScene(){ svg.setAttribute("viewBox", "scene"); }
    ${fn("sysAPlan")}
    ${fn("eleveSchemaEtapes")}
    ${ligne("const ELEVE_SCHEMA_ETAPES = ")}
    ${ligne("let eleveSchemaSysCadre = ")}
    ${fn("eleveCadrerSchemaSys")}
    const carte = { family: "D", _sys: { plan: [{}, {}, {}] } };
    return { cadrer(e){ eleveSchemaEtape = e; eleveCadrerSchemaSys(carte); }, rendus, cadre: () => eleveSchemaSysCadre, suivante(){ eleveIdx++; } };
  `)(svg);
  ctx.cadrer(1);
  assert.deepEqual(ctx.rendus, [1, 2, 3, 1], "les trois cadres mesurés une fois, puis l'étape courante redessinée");
  assert.equal(svg.vb.at(-1), "16 -24 1548 958", "x 40−24, y 0−24, largeur (1540−40)+48, hauteur (910−0)+48");
  ctx.cadrer(2); ctx.cadrer(3);
  assert.deepEqual(ctx.rendus, [1, 2, 3, 1], "plus aucune mesure : le cadrage est en mémoire");
  assert.ok(svg.vb.slice(-3).every((v) => v === "16 -24 1548 958"), "le même cadrage aux trois étapes");
  ctx.suivante(); ctx.cadrer(1);
  assert.deepEqual(ctx.rendus, [1, 2, 3, 1, 1, 2, 3, 1], "carte suivante : remesuré");
  assert.match(fn("eleveDessinerSchema"), /renderCard\(card, eleveSchemaEtape\);\n  if\(sysAPlan\(card\)\) eleveCadrerSchemaSys\(card\); else eleveCadrerScene\(\);/);
  assert.match(fn("eleveSchemaReinitialiser"), /eleveSchemaTelReserve = null; eleveSchemaSysCadre = null;/);
});

// --- téléphone : le dessin portrait ---------------------------------------------------------
test("téléphone : renderCard passe au dessin portrait quand eleveSchemaTel est levé ; le cadre est dans la liste des cadres du téléphone ; pas de bandeau", () => {
  assert.match(fn("renderCard"), /if\(sysAPlan\(card\) && revealState >= 1 && !opts\.sansCorrection\)\{\n    if\(typeof eleveSchemaTel !== "undefined" && eleveSchemaTel\) drawSysCorrectionTelephone\(card, revealState\);\n    else drawSysCorrectionEcran\(card, revealState\);/);
  assert.match(ligne("const ELEVE_SCHEMA_CADRES = "), /"sysSchemaTel"\]/);
  assert.match(fn("eleveDessinerSchema"), /if\(!sysAPlan\(card\)\) eleveRappelAfficher\(card\);/);
  assert.match(fn("eleveDessinerSchema"), /for\(let e = 1; e <= eleveSchemaEtapes\(card\); e\+\+\) hMax = Math\.max\(hMax, eleveSchemaTelRendre\(card, e, largeur\)\);/);
  assert.match(fn("eleveVoirSchema"), /if\(!card \|\| eleveSchemaEtape >= eleveSchemaEtapes\(card\)\) return;/);
});

test("téléphone : chaque cadre du plan se dessine en portrait — titre, barres, calculs SOUS les barres, réponses de la vérification, tout dans la largeur", () => {
  let cadres = 0;
  for(const c of CARTES.filter((_, i) => i % 7 === 0)){
    const m = sys.telMesures(c);
    assert.ok(m.u > 0 && m.u <= sys.TEL.caseMax);
    const L = Math.max(...c._sys.plan.flatMap((e) => e.barres.map((b) => (Number(b.offset) || 0) + b.cells.reduce((s, x) => s + (x.kind === "visible" ? sys.C.visible : (x.kind === "rest" ? x.covers.reduce((t, y) => t + (y.kind === "visible" ? sys.C.visible : 1), 0) : 1)), 0))));
    assert.ok(sys.TEL.barX + L * m.u <= sys.TEL.w - sys.TEL.barX + 0.001, "la barre la plus longue tient dans la largeur");
    c._sys.plan.forEach((etape, k) => {
      const { g, h } = sys.cadrePortrait(c, etape, k + 1);
      cadres++;
      const bord = g.children[0];
      assert.equal(bord.attrs.width, sys.TEL.w - 2 * sys.TEL.marge);
      assert.equal(bord.attrs.height, h);
      const t = textes(g);
      assert.ok(t[0].text.startsWith(`${k + 1}. `), "le titre porte le numéro de l'étape");
      // tout élément dessiné reste dans le cadre (droite) : rects et textes ancrés à gauche
      for(const r of elements(g, "rect")) assert.ok(r.attrs.x + r.attrs.width <= sys.TEL.w - sys.TEL.marge + 0.001, "une case déborde à droite");
      const calculs = etape.calculs;
      if(calculs.length){
        const lignes = t.filter((x) => x.attrs["font-style"] === "italic");
        assert.deepEqual(lignes.map((x) => x.text), calculs, "les calculs du plan, dans l'ordre");
        const basBarres = Math.max(100, ...elements(g, "rect").slice(1).map((r) => r.attrs.y + r.attrs.height));
        for(const l of lignes) assert.ok(l.attrs.y > basBarres, "les calculs sont SOUS les barres");
      }
      if(etape.role === "verification"){
        const rep = t.filter((x) => / = \d+$/.test(x.text) && x.attrs["font-weight"] === 900 && x.attrs["font-style"] !== "italic");
        assert.deepEqual(rep.map((x) => x.text), etape.reponses.map((r) => `${sys.mot(r.color)} = ${r.value}`), "les réponses, avec le mot de la couleur");
        const lignesCalc = t.filter((x) => x.attrs["font-style"] === "italic");
        assert.ok(rep.every((r) => r.attrs.y > Math.max(...lignesCalc.map((l) => l.attrs.y))), "les réponses sous les calculs");
      }
      // titre lisible : deux lignes au plus, dans la largeur
      const titre = t.filter((x) => x.attrs["font-size"] === m.C.fsTitre && x.attrs["text-anchor"] === "middle");
      assert.ok(titre.length >= 1 && titre.length <= sys.TEL.titreLignes);
    });
  }
  assert.ok(cadres > 400);
});

test("téléphone : la scène = la rangée des plateaux dévoilés puis le cadre k, dans #sysSchemaTel, sans fil ; le rect de cadrage donne la largeur", () => {
  const c = CARTES.find((x) => x._sys.geste === "TROIS");
  for(let k = 1; k <= c._sys.plan.length; k++){
    const s = sys.portrait(c, k);
    assert.equal(s.children.length, 1);
    const g = s.children[0];
    assert.equal(g.attrs.id, "sysSchemaTel");
    assert.equal(g.children[0].name, "rect");
    assert.equal(g.children[0].attrs.width, sys.TEL.w, "le premier rect : la largeur du cadrage");
    const plateaux = elements(g, "g").find((x) => x.attrs.id === "sysPlateaux");
    assert.ok(plateaux, "les plateaux sont dans la scène");
    assert.equal(elements(plateaux, "g").filter((x) => x.attrs.class === "sysPlateau").length, c._sys.boards.length);
    // dévoilés : un cercle (jeton caché) sous chaque tache, sans le fondu
    const taches = elements(plateaux, "path").filter((p) => p.attrs.class !== "anim-fade-out");
    assert.equal(elements(plateaux, "path").filter((p) => p.attrs.class === "anim-fade-out").length, 0, "pas de fondu à chaque cadre");
    assert.ok(elements(plateaux, "circle").length >= taches.length);
    const cadre = elements(g, "g").find((x) => x.attrs.class === "sysCadre sysCadrePortrait");
    assert.ok(cadre);
    assert.equal(cadre.attrs["data-role"], c._sys.plan[k - 1].role);
    const basPlateaux = Math.max(...elements(plateaux, "rect").map((r) => r.attrs.y + r.attrs.height));
    assert.ok(cadre.children[0].attrs.y >= basPlateaux + sys.TEL.ecartPlateaux, "le cadre sous les plateaux, avec l'écart");
    assert.ok(!elements(g, "g").some((x) => x.attrs.id === "sysFil"), "pas de fil au téléphone");
    // le TOTAL « ? » de Trois paires reste « ? »
    assert.ok(textes(plateaux).some((t) => t.text === "?"));
  }
});
