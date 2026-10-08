/* SPLAT! — le Système (mode D), lot « mode élève » (24/09/2026 ; conception S0, § 8).
   Les cartes du mode D se jouent en ?eleve=1 comme l'Enquête : une case par COULEUR (les
   taches d'une couleur cachent le même nombre), le TOTAL du plateau principal donné (pas de
   ligne du TOTAL pour « Trois paires » depuis le lot M4-4b), cases de largeur égale avant ET après la validation (décision du
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
const CONSTANTES = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS", "SYS_COULEURS_PLURIEL", "SYS_PLAGES",
  "SYS_ZONE_ECRAN", "SYS_ZONE_IMPRIME", "SYS_ZONE_IMPRIME_6", "SYS_TACHE", "SYS_BARRES", "SYS_BARRES_SERRE", "SYS_BARRES_TAILLES", "SYS_CORR_IMPRIME", "SYS_CORR_ECRAN", "SYS_EQ_ECRIT",
  "SYS_ZONE_ECRAN_CORRECTION", "SYS_ZONE_IMPRIME_CORRECTION", "SYS_ZONE_TEL_ENONCE",
  "SYS_FIL", "SYS_UNIQUE_ECRAN", "SYS_UNIQUE_IMPRIME", "SYS_TEL", "SYS_ZONE_TEL_CORRECTION", "ENQUETE_NOM_ECART"].map(constante).join("\n");
const GENERATEUR = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure",
  "sysAssemblerCarte", "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan"].map(fn).join("\n");
const DESSIN = ["sysEnPlateaux", "sysTotalCache", "sysPlateauxMontres", "sysRayonJeton", "sysGrille", "sysColonnesVisibles", "sysRayonMax", "sysDispositionPlateaux", "sysZoneTelephone", "drawSysPlateaux",
  "sysAPlan", "sysDevoileEleve", "sysBarresMetriques", "sysLargeurTexte", "sysCorrAjuster", "sysBarreCases", "sysBarreLargeur", "sysEtapeTaille", "sysVerifHauteur",
  "sysVerifLargeur", "sysEtapesFlux", "sysJetonCouleurs", "drawSysCaseBarre", "drawSysBarre", "drawSysEtape", "drawSysVerification", "sysSystemeEcrit", "drawSysSystemeEcrit", "blobPath", "wrapTextToWidth",
  "beadColorForValue", "drawInvestigateSplatName", "investigateColorInfo", "sysTelEchelle", "drawSysCorrectionTelephone"].map(fn).join("\n");
const ELEVE = ["eleveInfosEnquete", "eleveInfosSysteme", "eleveInfosTableau", "eleveSchemaEtapes", "eleveTacheCouleurHtml", "eleveCaseDonneeHtml",
  "eleveCasesEnqueteHtml", "eleveCaseHtml", "eleveCaseCopieHtml"].map(fn).join("\n");

/* faux SVG : des objets, les textes gardés dans l'ordre */
const FAUX_SVG = `
  const mkEl = (name, attrs = {}) => ({ name, attrs, children: [], appendChild(c){ this.children.push(c); return c; } });
  const mkText = (x, y, t, attrs = {}) => ({ name: "text", attrs: { x, y, ...attrs }, text: String(t), children: [], appendChild(){} });
  const el = mkEl, text = mkText;
  let svg = mkEl("svg");
  function clearSvg(){ svg = mkEl("svg"); }
  let numberedQuestionMarkMode = true;
  /* les jetons visibles prennent leur couleur à la page (beadColorForValue) : une page minimale */
  const document = { body: { classList: { contains: () => false } }, getElementById: () => null, createElement(){ throw new Error("pas de canevas"); } };
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
    GESTES: SYS_GESTES, TEL: SYS_TEL, ZT: SYS_ZONE_TEL_CORRECTION, B: SYS_BARRES,
    mot: (k) => investigateColorWord(investigateColorByKey(k)),
    infos: eleveInfosSysteme, tableau: eleveInfosTableau, etapes: eleveSchemaEtapes, bas: eleveCasesEnqueteHtml, totalCache: sysTotalCache,
    aPlan: sysAPlan, devoile: (card, d) => { eleveEnqueteDevoile = d; return sysDevoileEleve(card); },
    telEchelle: sysTelEchelle, metriques: sysBarresMetriques, largeurBarre: sysBarreLargeur, cases: sysBarreCases, taille: sysEtapeTaille, verifHauteur: sysVerifHauteur,
    zoneTel: sysZoneTelephone, disposition: sysDispositionPlateaux,
    portrait(card, k){ svg = mkEl("svg"); drawSysCorrectionTelephone(card, k); return svg; },
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
const casesDe = (h) => [...h.matchAll(/<div class="eleveCase ([^"]+)" style="([^"]+)"( data-attendu="(\d+)")?( data-copie="(\d+)")?>([\s\S]*?)<\/div>/g)]
  .map((m) => ({ classes: m[1], style: m[2], attendu: m[4], copie: m[6], contenu: m[7] }));

// --- le tableau : une case par tache (03/10/2026 ; une par couleur avant, tableau faux) -----
test("chaque carte du Système donne une case par TACHE du plateau principal, couleur après couleur dans l'ordre de la carte", () => {
  assert.ok(CARTES.length > 2000);
  for(const c of CARTES){
    const i = sys.infos(c);
    assert.ok(i && i.systeme, "une carte du Système a son tableau");
    assert.equal(i.ordre.length, c.hidden.length, "une case par tache : sous le TOTAL, le tableau doit faire le compte");
    assert.deepEqual([...i.ordre].sort((a, b) => a - b), c.hidden.map((_, k) => k), "chaque tache une fois");
    const suite = i.ordre.map((k) => c._colorMap[k]);
    assert.deepEqual([...new Set(suite)], c._sys.colors, "dans l'ordre des couleurs (celui des rangées de la grille)");
    suite.forEach((k, j) => { if(j > 0 && k !== suite[j - 1]) assert.ok(!suite.slice(0, j).includes(k), "les taches d'une couleur se suivent"); });
    assert.deepEqual(i.ordre.map((k) => i.valeurs[k]), suite.map((k) => c._sys.values[k]), "la valeur cachée par la couleur");
    assert.equal(i.ordre.reduce((s, k) => s + i.valeurs[k], 0) + i.visibleSum, c.total, "le tableau est juste : cases + visibles = TOTAL");
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

test("les cases : largeur égale, mini-tache à la couleur + nom, « ? » ; les jetons visibles à remplir ; Trois paires : trois cases, une par couleur", () => {
  const coef = CARTES.find((c) => c._sys.geste === "COEF" && c.hidden.length === 4 && c.visible.length === 0);
  const i = sys.infos(coef);
  const cases = casesDe(sys.bas(coef, i));
  assert.equal(cases.length, 4, "quatre taches : quatre cases");
  assert.deepEqual(cases.map((x) => x.style), ["flex:1 1 0", "flex:1 1 0", "flex:1 1 0", "flex:1 1 0"]);
  const vues = new Map();
  cases.forEach((x, k) => {
    const coul = coef._colorMap[i.ordre[k]];
    assert.equal(x.attendu, String(coef._sys.values[coul]));
    assert.match(x.contenu, /class="eleveTacheCouleur"/);
    if(!vues.has(coul)){
      // la première case de la couleur : celle où l'élève tape
      vues.set(coul, k);
      assert.equal(x.classes, "grise");
      assert.equal(x.copie, undefined);
      assert.match(x.contenu, /placeholder="\?"/);
    }else{
      // les suivantes recopient (03/10/2026, « retaper, c'est chiant ») : pas de champ, « ? » en attendant
      assert.equal(x.classes, "grise copie");
      assert.equal(x.copie, String(vues.get(coul)), "le rang de la case où l'élève tape");
      assert.doesNotMatch(x.contenu, /<input/);
      assert.match(x.contenu, /<span class="eleveCopieVal vide">\?<\/span>$/);
    }
  });
  assert.equal(vues.size, coef._sys.colors.length, "un champ par couleur");
  const vis = CARTES.find((c) => c.visible.length >= 2);
  const cv = casesDe(sys.bas(vis, sys.infos(vis)));
  assert.equal(cv[0].classes, "blanche", "les jetons visibles : case à remplir (02/10/2026), avant les couleurs");
  assert.equal(cv[0].attendu, String(vis.visible.reduce((s, v) => s + v, 0)));
  assert.match(cv[0].contenu, /<span>visibles<\/span><\/span><input class="eleveChamp"/);
  assert.equal(cv.length, 1 + vis.hidden.length);
  cv.filter((x) => x.copie !== undefined).forEach((x) => assert.ok(Number(x.copie) >= 1, "les visibles en tête : le rang compte leur case"));
  // Trois paires : le plateau des trois couleurs n'a pas de total (le tableau n'a pas de ligne du
  // TOTAL, lot M4-4b) ; ses trois cases, une par couleur, à remplir
  const trois = CARTES.find((c) => c._sys.geste === "TROIS");
  assert.ok(sys.totalCache(trois));
  assert.ok(!sys.totalCache(coef));
  const ct = casesDe(sys.bas(trois, sys.infos(trois)));
  assert.equal(ct.length, 3);
  assert.deepEqual(ct.map((x) => x.classes), ["grise", "grise", "grise"]);
});

test("renderEleveSplat : le Système passe (classe « systeme »), le TOTAL donné ; Trois paires sans ligne du TOTAL (lot M4-4b) ; le message « n'existe pas » reste pour C9/C8", () => {
  const rendu = fn("renderEleveSplat");
  assert.match(rendu, /const enquete = infos \? null : eleveInfosTableau\(card\);/);
  assert.match(rendu, /if\(!infos && !enquete\)\{\n    tete\.style\.display = "none";\n    panneau\.innerHTML = `<p class="eleveConsigne">Le parcours élève n'existe pas encore pour ce mode\.<\/p>`;/);
  assert.match(rendu, /panneau\.classList\.toggle\("systeme", !!\(enquete && enquete\.systeme\)\);/);
  // Trois paires : pas de ligne du TOTAL (son plateau des trois couleurs n'est plus montré) ; l'Enquête
  // sans total non plus (08/10/2026)
  assert.match(rendu, /haut = \(\(enquete\.systeme && sysTotalCache\(card\)\) \|\| enqueteSansCase\(card\)\) \? ""\n      : eleveCaseDonneeHtml\("haut blanche", "Total", card\.total\);/);
  assert.match(rendu, /`<div class="eleveDiag">\$\{haut \? `<div class="ligneHaut">\$\{haut\}<\/div>` : ""\}` \+\n    `<div class="ligneBas">\$\{bas\}<\/div><\/div>` \+/);
  assert.doesNotMatch(rendu, /sysTotalCache\(card\)\) \? "\?"/, "plus jamais « TOTAL ? » pour le Système");
});

// --- après la validation --------------------------------------------------------------------
test("après validation, les cases prennent leur vraie largeur, au Système comme à l'Enquête (une case vaut une tache depuis le 03/10/2026)", () => {
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
  assert.deepEqual(casesBas.map((c) => c.style.flexGrow), ["9", "4"], "Système : chaque tache à sa valeur");
  assert.deepEqual(diag.classes, ["vraies"]);
  casesBas.forEach((c) => { delete c.style.flexGrow; });
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
  assert.match(rc, /drawSysPlateaux\(svg, card, zone, \{ devoile: revealState >= 2 \|\| sysDevoileEleve\(card\) \}\);/);
  assert.match(rc, /\(isABProjectionLayout \? abRevealPhase : \(sysDevoileEleve\(card\) \? 2 : revealState\)\)/, "plateau unique (Phrases / Symboles) dévoilé aussi");
});

// --- « Voir le schéma » ------------------------------------------------------------------
test("le nombre d'étapes du schéma : un cadre par étape du plan ; l'Enquête a les siennes (quatre, lot G1)", () => {
  for(const c of CARTES) assert.equal(sys.etapes(c), c._sys.plan.length);
  assert.equal(sys.etapes({ family: "C", _rel: {} }), 4);
  // lot M4-2 : de 5 (une partie connue, une tache par couleur) à 9 étapes (l'escalier, le miroir)
  const longueurs = new Set(CARTES.map((c) => c._sys.plan.length));
  assert.ok([...longueurs].every((n) => n >= 5 && n <= 9) && longueurs.size >= 4, [...longueurs].join(", "));
});

test("eleveVoirSchema : un appui par cadre, le bouton s'efface au dernier cadre du plan (4 pour Trois paires)", () => {
  const boutons = [];
  const suivant = { className: "suivant", focus(){ this.focalise = true; } };
  /* les boutons du pas à pas (03/10/2026) : « ◀ » et « Étape suivante » s'insèrent avant « Carte suivante » */
  const actions = {
    appendChild: (b) => boutons.push(b),
    insertBefore: (b, ref) => { const i = ref ? boutons.indexOf(ref) : -1; if(i >= 0) boutons.splice(i, 0, b); else boutons.push(b); },
    querySelector: (sel) => (sel === ".suivant" ? suivant : null)
  };
  const valider = { hidden: false, parentNode: actions };
  const document = {
    activeElement: null,
    createElement: () => {
      const b = { classes: new Set(), remove(){ this.retire = true; boutons.splice(boutons.indexOf(this), 1); }, focus(){}, setAttribute(k, v){ this[k] = v; } };
      b.classList = { toggle: (k, v) => (v ? b.classes.add(k) : b.classes.delete(k)) };
      return b;
    },
    getElementById: (id) => boutons.find((b) => b.id === id) || null,
    querySelector: (sel) => (sel === "#elevePanel .eleveActions .suivant" ? suivant : sel === "#elevePanel .eleveActions" ? actions : null)
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
    /* la place du schéma sur ordinateur (lot G3) se mesure au navigateur : pas ici */
    const reserves = [];
    function eleveSchemaReserverOrdinateur(card){ reserves.push(card); }
    ${fn("eleveProposerSchema")}
    ${fn("eleveVoirSchema")}
    ${fn("eleveSchemaMontrerEtape")}
    ${fn("eleveSchemaBoutons")}
    ${fn("eleveSchemaPrecedente")}
    function enqueteProjectionPasAPas(){ return null; }
    /* lot M4-2 : comme l'Enquête, la solution du tableau s'efface pendant les étapes */
    const caches = [];
    function eleveReponseCacher(c){ caches.push(c); }
    function eleveSchemaTelephone(){ return false; }
    function eleveTableauCacher(c){ caches.push("tableau:" + c); }
    return { proposer: eleveProposerSchema, voir: eleveVoirSchema, dessins, caches, etape: () => eleveSchemaEtape };
  `)(document);
  ctx.proposer(valider);
  assert.equal(boutons.length, 1, "le bouton jaune est proposé pour le Système");
  assert.equal(valider.hidden, true);
  for(let k = 0; k < 6; k++) ctx.voir();
  assert.deepEqual(ctx.dessins, [1, 2, 3, 4], "quatre cadres, puis plus rien");
  assert.deepEqual(ctx.caches, [true, "tableau:true", true, "tableau:true", true, "tableau:true", false, "tableau:true"],
    "ordinateur : réponse effacée aux étapes 1 à 3, rendue à la dernière ; tableau caché tout du long (comme l'Enquête)");
  assert.equal(boutons.find((b) => b.id === "eleveSchema"), undefined, "le bouton s'est effacé au 4e");
  assert.deepEqual(boutons.map((b) => b.id), ["eleveSchemaPrec"], "il reste « ◀ » (03/10/2026)");
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
    ${fn("eleveRendreEtape")}
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
  assert.match(fn("eleveDessinerSchema"), /eleveRendreEtape\(card, eleveSchemaEtape\);\n  if\(eleveSchemaCadreUnique\(card\)\) eleveCadrerSchemaSys\(card\); else eleveCadrerScene\(\);/);
  assert.match(fn("eleveSchemaCadreUnique"), /return sysAPlan\(card\) \|\|/);
  assert.match(fn("eleveSchemaReinitialiser"), /eleveSchemaTelReserve = null; eleveSchemaSysCadre = null;/);
});

// --- téléphone : le dessin portrait ---------------------------------------------------------
test("téléphone : renderCard passe au dessin portrait quand eleveSchemaTel est levé ; le cadre est dans la liste des cadres du téléphone ; pas de bandeau", () => {
  assert.match(fn("renderCard"), /if\(sysAPlan\(card\) && revealState >= 1 && !opts\.sansCorrection\)\{\n    if\(typeof eleveSchemaTel !== "undefined" && eleveSchemaTel\) drawSysCorrectionTelephone\(card, revealState\);\n    else if\(!sysCorrectionPasAPas\(\)\) drawSysCorrectionDirecte\(card\);\n    else drawSysCorrectionEcran\(card, revealState\);/);
  // le mode élève reste toujours en pas à pas (lot M4-2, comme l'Enquête)
  assert.match(fn("sysCorrectionPasAPas"), /if\(typeof eleveActif !== "undefined" && eleveActif\) return true;/);
  // la solution du tableau s'efface pendant les étapes, comme l'Enquête (lot M4-2)
  assert.match(fn("eleveSchemaMontrerEtape"), /if\(\(card\.family === "C" && enqueteProjectionPasAPas\(card\)\) \|\| sysAPlan\(card\)\)\{/);
  assert.match(ligne("const ELEVE_SCHEMA_CADRES = "), /"sysSchemaTel"\]/);
  assert.match(fn("eleveDessinerSchema"), /if\(!sysAPlan\(card\)\) eleveRappelAfficher\(card\);/);
  assert.match(fn("eleveDessinerSchema"), /for\(let e = 1; e <= eleveSchemaEtapes\(card\); e\+\+\) hMax = Math\.max\(hMax, eleveSchemaTelRendre\(card, e, largeur\)\);/);
  assert.match(fn("eleveVoirSchema"), /if\(!card \|\| eleveSchemaEtape >= eleveSchemaEtapes\(card\)\) return;/);
});

test("téléphone : chaque étape du plan se dessine dans la largeur — titre sur deux lignes au plus, barres et calcul gris à droite ; « Je vérifie » : calculs puis réponse encadrée", () => {
  let etapes = 0;
  for(const c of CARTES.filter((_, i) => i % 7 === 0)){
    const f = sys.telEchelle(c);
    assert.ok(f > 0.3 && f <= sys.TEL.max);
    const M = sys.metriques(f);
    const larg = sys.TEL.w - 2 * sys.TEL.marge;
    for(const e of c._sys.plan) for(const b of e.barres) assert.ok(sys.largeurBarre(b, M) <= larg + 0.5, "la barre la plus longue (calcul compris) tient dans la largeur");
    for(let k = 1; k <= c._sys.plan.length; k++){
      const s = sys.portrait(c, k);
      const g = s.children[0];
      const etape = c._sys.plan[k - 1];
      const dessin = elements(g, "g").find((x) => /\bsysEtape\b/.test(x.attrs.class || ""));
      assert.ok(dessin, "l'étape est dessinée");
      assert.equal(dessin.attrs["data-role"], etape.role);
      etapes++;
      const t = textes(dessin);
      assert.ok(t[0].text.startsWith(`${k}. `), "le titre porte le numéro de l'étape");
      // tout reste dans la largeur : rects, lignes
      for(const r of elements(dessin, "rect")) assert.ok(r.attrs.x >= sys.TEL.marge - 0.5 && r.attrs.x + r.attrs.width <= sys.TEL.w - sys.TEL.marge + 0.5, `un rect déborde : ${JSON.stringify(r.attrs)} ${etape.role} ${JSON.stringify(etape.barres.map(b => [b.top, b.calcul, sys.cases(b)]))} f=${f}`);
      if(etape.role === "verification"){
        const rep = t.filter((x) => / = \d+$/.test(x.text));
        assert.deepEqual(rep.map((x) => x.text), etape.reponses.map((r) => `${sys.mot(r.color)} = ${r.value}`), "les réponses, avec le mot de la couleur");
        const lignes = t.filter((x) => x.text.endsWith("✓"));
        assert.deepEqual(lignes.map((x) => x.text), etape.lignes);
        assert.ok(rep.every((r) => r.attrs.y > Math.max(...lignes.map((l) => l.attrs.y))), "les réponses sous les calculs");
      }else{
        const titre = t.filter((x) => x.attrs["font-size"] === M.fsTitre);
        assert.ok(titre.length >= 1 && titre.length <= 2, "titre sur deux lignes au plus");
        // une barre : la case du total, ses cases ; le calcul gris à droite
        for(const b of etape.barres){
          if(b.calcul) assert.ok(t.some((x) => x.text === b.calcul && x.attrs.fill === "#475569"), `calcul « ${b.calcul} »`);
          assert.ok(t.some((x) => x.text === b.top), `total « ${b.top} »`);
        }
      }
    }
  }
  assert.ok(etapes > 400);
});

test("téléphone : la scène = la rangée des plateaux dévoilés puis l'étape k, dans #sysSchemaTel, sans fil ; le rect de cadrage donne la largeur", () => {
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
    // lot M4-4b : les trois paires seulement (le plateau sans total n'est pas dessiné)
    assert.equal(elements(plateaux, "g").filter((x) => x.attrs.class === "sysPlateau").length, c._sys.boards.length - 1);
    // dévoilés : un cercle (jeton caché) sous chaque tache, sans le fondu
    const taches = elements(plateaux, "path").filter((p) => p.attrs.class !== "anim-fade-out");
    assert.equal(elements(plateaux, "path").filter((p) => p.attrs.class === "anim-fade-out").length, 0, "pas de fondu à chaque étape");
    assert.ok(elements(plateaux, "circle").length >= taches.length);
    const etape = elements(g, "g").find((x) => /\bsysEtape\b/.test(x.attrs.class || ""));
    assert.ok(etape);
    assert.equal(etape.attrs["data-role"], c._sys.plan[k - 1].role);
    const basPlateaux = Math.max(...elements(plateaux, "rect").map((r) => r.attrs.y + r.attrs.height));
    const hautEtape = Math.min(...textes(etape).map((t) => t.attrs.y)) - 40;
    assert.ok(hautEtape >= basPlateaux + sys.TEL.ecartPlateaux - 40, "l'étape sous les plateaux, avec l'écart");
    assert.ok(!elements(g, "g").some((x) => x.attrs.id === "sysFil"), "pas de fil au téléphone");
    // plus de « TOTAL ? » (lot M4-4b)
    assert.ok(!textes(plateaux).some((t) => t.text === "?"));
  }
});

test("téléphone, l'énoncé : la disposition (une rangée, deux colonnes, une colonne) qui donne les plus grandes taches dans le plateau du mode élève", () => {
  const vus = { rangee: 0, colonnes: 0 };
  for(const c of CARTES.filter((_, i) => i % 5 === 0)){
    const Z = sys.zoneTel(c, 352, 371);
    const n = c._sys.boards.length;
    assert.ok([n, 2, 1].includes(Z.colonnes));
    if(Z.colonnes === n) vus.rangee++; else vus.colonnes++;
    const d = sys.disposition(c, Z);
    // la même grille sur tous les plateaux, rien ne déborde de la zone
    for(const P of d.plateaux){
      assert.ok(P.x >= Z.x - 0.5 && P.x + P.w <= Z.x + Z.w + 0.5);
      for(const t of P.taches) assert.equal(t.r, d.r, "une tache a la même taille sur tous les plateaux");
    }
    // la disposition choisie fait au moins aussi bien qu'une rangée de 1 600 (l'écran)
    const vu = (D, Zw) => { const h = Math.max(...D.plateaux.map((P) => P.y + P.h)) - Math.min(...D.plateaux.map((P) => P.totalY)); return D.r * Math.min(352 / (Zw + 48), 371 / (h + 48)); };
    assert.ok(vu(d, Z.w) >= 0.95 * vu(sys.disposition(c, { ...Z, colonnes: n, w: 1480 }), 1480));
  }
  assert.ok(vus.rangee > 0 && vus.colonnes > 0, JSON.stringify(vus));
  assert.match(fn("renderCard"), /zone = sysZoneTelephone\(card, /);
});
