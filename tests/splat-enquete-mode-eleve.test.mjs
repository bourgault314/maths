/* SPLAT! Enquête — lot E2 « le mode élève » (22/09/2026).
   Ces tests exécutent les fonctions de outils/splat.html telles quelles (extraites du
   fichier) : elles vérifient des comportements, pas la présence d'un bout de code.
   - une carte d'Enquête donne une case PAR tache, de largeur égale, dans l'ordre du
     plateau, avec la mini-tache à sa couleur et le nom de la couleur ;
   - le total et les jetons visibles sont donnés (pas de champ), la validation les ignore ;
   - la consigne et le message de réussite de l'Enquête ;
   - « Voir le schéma » : trois étapes (la correction en barres des lots G1-G2, 29/09/2026 : les
     barres, schéma regroupé, je calcule ; deux sans total), une par appui, puis le
     bouton s'efface ;
   - le nom de la couleur sur la tache dévoilée se pose juste au-dessus du jeton (écran
     et impression passent par la même fonction) ;
   - le dévoilement de l'Enquête redessine la carte (les taches ont leur propre couleur) ;
   - téléphone (23/09/2026) : le schéma en portrait, entier ; le bandeau TOTAL + indice à la
     place du plateau ; la ligne des réponses ; des boutons qui ne bougent plus. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");

function fn(name){
  const start = html.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return html.slice(start + 1, html.indexOf("\n}\n", start) + 3);
}
function constLine(prefix){
  const l = html.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}
const feuille = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
function regles(css){
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), decl: m[2].trim() }));
}

// --- les cases du tableau ----------------------------------------------------------------
const PALETTE = html.slice(html.indexOf("const INVESTIGATE_COLOR_PALETTE = ["), html.indexOf("];", html.indexOf("const INVESTIGATE_COLOR_PALETTE = [")) + 2);
const cases = new Function(`
  ${PALETTE}
  ${constLine("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("investigateColorInfo")}
  ${constLine("const ELEVE_TACHE_MINI = ")}
  ${fn("eleveCaseHtml")}
  ${fn("eleveInfosEnquete")}
  ${fn("eleveTacheCouleurHtml")}
  ${fn("eleveCaseDonneeHtml")}
  ${fn("eleveCasesEnqueteHtml")}
  return { infos: eleveInfosEnquete, bas: eleveCasesEnqueteHtml, donnee: eleveCaseDonneeHtml, mini: ELEVE_TACHE_MINI };
`)();

// une carte d'Enquête telle que genInvestigate + assignPositions la fabriquent (l'essentiel)
function carteC({ hidden, colors, visible = [], cx }){
  return {
    family: "C", total: hidden.reduce((a, b) => a + b, 0) + visible.reduce((a, b) => a + b, 0),
    hidden, visible, _num: { tasks: hidden.length },
    _splats: cx.map((x) => ({ cx: x, cy: 600, r: 200 })),
    _rel: { taskCount: hidden.length, colorMap: colors, hiddenValues: hidden }
  };
}
const casesDe = (h) => [...h.matchAll(/<div class="eleveCase ([^"]+)" style="([^"]+)"( data-attendu="(\d+)")?>([\s\S]*?)<\/div>/g)]
  .map((m) => ({ classes: m[1], style: m[2], attendu: m[4], contenu: m[5] }));

test("une case par tache, de largeur égale, dans l'ordre du plateau (de gauche à droite)", () => {
  // noire (x = 1100) à droite, verte (x = 500) à gauche : la verte vient en premier
  const carte = carteC({ hidden: [10, 5], colors: ["black", "green"], cx: [1100, 500] });
  const infos = cases.infos(carte);
  assert.deepEqual(infos, { tasks: 2, valeurs: [10, 5], visibleSum: 0, ordre: [1, 0] });
  const c = casesDe(cases.bas(carte, infos));
  assert.deepEqual(c.map((x) => x.attendu), ["5", "10"], "la verte (5) d'abord, la noire (10) ensuite");
  assert.deepEqual(c.map((x) => x.style), ["flex:1 1 0", "flex:1 1 0"], "largeurs égales : une largeur proportionnelle donnerait la réponse");
  for(const x of c){
    assert.equal(x.classes, "grise");
    assert.match(x.contenu, /placeholder="\?"/, "le « ? » de l'inconnue, comme au monde 2");
    assert.match(x.contenu, /<input class="eleveChamp" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="\?">$/);
  }
});

test("dans chaque case : la mini-tache À SA COULEUR et le nom de la couleur", () => {
  const carte = carteC({ hidden: [9, 5, 17], colors: ["purple", "blue", "black"], cx: [400, 800, 1200] });
  const c = casesDe(cases.bas(carte, cases.infos(carte)));
  assert.equal(c.length, 3);
  const attendu = [["var(--splat-purple)", "violette"], ["#2563eb", "bleue"], ["var(--splat-black)", "noire"]];
  c.forEach((x, i) => {
    assert.match(x.contenu, /^<span class="eleveTacheNom"><svg class="eleveTacheCouleur"/, "la mini-tache colorée remplace la noire du monde 2");
    assert.ok(x.contenu.includes(`fill="${attendu[i][0]}"`), `couleur de la tache ${i}`);
    assert.ok(x.contenu.includes(`<span>${attendu[i][1]}</span></span>`), `nom de la couleur ${i}`);
    assert.doesNotMatch(x.contenu, /eleveMiniTache/, "pas la mini-tache noire en dur");
  });
  assert.match(cases.mini, /fill="#111827"/, "la mini-tache du monde 2 reste noire");
});

test("le total et les jetons visibles sont donnés : pas de champ, la validation les ignore", () => {
  const carte = carteC({ hidden: [9, 5, 17], colors: ["purple", "blue", "black"], visible: [3, 4], cx: [400, 800, 1200] });
  const infos = cases.infos(carte);
  assert.equal(infos.visibleSum, 7);
  const c = casesDe(cases.bas(carte, infos));
  assert.equal(c.length, 4);
  assert.equal(c[0].classes, "blanche donnee");
  assert.equal(c[0].attendu, undefined, "rien à vérifier");
  assert.doesNotMatch(c[0].contenu, /eleveChamp/);
  assert.match(c[0].contenu, /<span class="eleveTacheNom"><span>visibles<\/span><\/span><span class="eleveDonneeVal">7<\/span>/);
  const total = casesDe(cases.donnee("haut blanche", "Total", 38))[0];
  assert.equal(total.classes, "haut blanche donnee");
  assert.doesNotMatch(total.contenu, /eleveChamp/);
  assert.match(total.contenu, /Total<\/span><\/span><span class="eleveDonneeVal">38<\/span>/);
  // la validation et « Voir la réponse » sautent une case sans champ
  assert.match(fn("eleveValiderSplat"), /const inp = c\.querySelector\("\.eleveChamp"\);\n    if\(!inp\) return;/);
  assert.match(fn("eleveMontrerReponse"), /const inp = c\.querySelector\("\.eleveChamp"\);\n    if\(!inp\) return;/);
});

test("seules les cartes d'Enquête ont ce tableau ; une carte du monde 2 ou une valeur nulle : non", () => {
  assert.equal(cases.infos({ family: "N", hidden: [6, 6], _num: { tasks: 2, H: 6 } }), null);
  assert.equal(cases.infos(carteC({ hidden: [0, 5], colors: ["black", "green"], cx: [1, 2] })), null, "une tache vide n'est pas jouable");
  const directe = carteC({ hidden: [4, 5], colors: ["black", "green"], cx: [1, 2] }); directe._directSubstitution = true;
  assert.equal(cases.infos(directe), null);
  assert.equal(cases.infos(null), null);
  // renderEleveSplat : la carte sans parcours garde son message, l'Enquête passe
  const rendu = fn("renderEleveSplat");
  // (lot « mode élève du Système » : eleveInfosTableau = Enquête OU Système ; le message reste pour C9, C8)
  assert.match(rendu, /const enquete = infos \? null : eleveInfosTableau\(card\);/);
  assert.match(rendu, /if\(!infos && !enquete\)\{\n    tete\.style\.display = "none";\n    panneau\.innerHTML = `<p class="eleveConsigne">Le parcours élève n'existe pas encore pour ce mode\.<\/p>`;/);
  assert.match(rendu, /panneau\.classList\.toggle\("enquete", !!enquete\);/);
  // (lot E-sans-total : une carte « sans total » montre « ? » dans la même case donnée)
  assert.match(rendu, /bas = eleveCasesEnqueteHtml\(card, enquete\);\n    \/\*[^\n]*\n[^\n]*\*\/\n    haut = eleveCaseDonneeHtml\("haut blanche", "Total", \(\(card\._rel && card\._rel\.sansTotal\) \|\| sysTotalCache\(card\)\) \? "\?" : card\.total\);/);
});

// --- consigne et message ------------------------------------------------------------------
function docAvecPanneau(classes){
  const panneau = { classList: { contains: (c) => classes.includes(c) } };
  return {
    getElementById: (id) => (id === "elevePanel" ? panneau : null),
    querySelector: (sel) => (sel === "#elevePanel.enquete" && classes.includes("enquete") ? panneau : null)
  };
}
test("la consigne de l'Enquête est la question de la fiche ; celle du monde 2 ne change pas", () => {
  const consigne = (classes, tactile, largeur) => new Function("document", "window", `${fn("eleveConsigneSchema")} return eleveConsigneSchema();`)(
    docAvecPanneau(classes),
    { MathsGoPaveChiffres: { estTactile: () => tactile }, matchMedia: (q) => ({ matches: q === "(max-width: 599px)" && largeur <= 599 }) });
  // espace insécable avant le « ? » (lot E7) : il ne part jamais seul à la ligne
  assert.equal(consigne(["enquete"], true, 390), "Combien de jetons sous chaque tache\u00a0?");
  assert.equal(consigne(["enquete"], false, 1280), "Combien de jetons sous chaque tache\u00a0?");
  assert.equal(consigne([], true, 390), "Complète le schéma, puis Valider.");
  assert.equal(consigne([], false, 1280), "Complète le schéma en barres : le total, les jetons visibles, et ce que cache chaque tache. Puis Valider.");
});

test("« Regarde sous les taches… » pour l'Enquête, « sous la tache… » ailleurs", () => {
  const message = (classes, apresErreur) => new Function("document", `${fn("eleveMessageJuste")} return eleveMessageJuste(${apresErreur});`)(docAvecPanneau(classes));
  assert.equal(message(["enquete"], false), "Bravo, du premier coup ! Regarde sous les taches…");
  assert.equal(message(["enquete"], true), "Juste ! Regarde sous les taches…");
  assert.equal(message([], false), "Bravo, du premier coup ! Regarde sous la tache…");
  assert.equal(message([], true), "Juste ! Regarde sous la tache…");
  assert.match(fn("eleveValiderSplat"), /msg\.textContent = eleveMessageJuste\(eleveCarteFautee\);/);
});

// --- « Voir le schéma » ----------------------------------------------------------------------
function harnaisSchema(){
  const boutons = [];
  const actions = { appendChild: (b) => { boutons.push(b); b.parentNode = actions; } };
  const valider = { parentNode: actions };
  const suivant = { focus(){ suivant.focalise = (suivant.focalise || 0) + 1; }, focalise: 0 };
  const document = {
    createElement: () => ({ remove(){ this.retire = true; boutons.splice(boutons.indexOf(this), 1); } }),
    getElementById: (id) => (id === "eleveSchema" ? boutons.find((b) => b.id === "eleveSchema") || null : null),
    querySelector: (sel) => (sel === "#elevePanel .eleveActions .suivant" ? suivant : null)
  };
  const ctx = new Function("document", `
    let eleveSchemaEtape = 0, eleveIdx = 0;
    ${constLine("const ELEVE_SCHEMA_ETAPES = ")}
    const eleveSerie = [{ family: "C", hidden: [10, 5], _rel: {}, _splats: [{cx:1},{cx:2}] }];
    const dessins = [];
    function eleveInfosEnquete(card){ return card && card.family === "C" ? {} : null; }
    function sysAPlan(){ return false; }
    function eleveInfosSysteme(){ return null; }
    /* la carte du banc d'essai a une correction en barres avec total : trois étapes */
    function enqueteDerniereEtape(card){ return 3; }
    ${fn("eleveInfosTableau")}
    ${fn("eleveSchemaEtapes")}
    function eleveDessinerSchema(card){ dessins.push(eleveSchemaEtape); }
    /* la place du schéma sur ordinateur (lot G3) se mesure au navigateur : pas ici */
    const reserves = [];
    function eleveSchemaReserverOrdinateur(card){ reserves.push(card); }
    ${fn("eleveProposerSchema")}
    ${fn("eleveVoirSchema")}
    return { proposer: eleveProposerSchema, voir: eleveVoirSchema, dessins, etape: () => eleveSchemaEtape, monde2: () => { eleveSerie[0] = { family: "N" }; } };
  `)(document);
  return { ctx, boutons, valider, suivant };
}

test("après validation : un bouton jaune « Voir le schéma », une seule fois, pour l'Enquête seulement", () => {
  const h = harnaisSchema();
  h.ctx.proposer(h.valider);
  h.ctx.proposer(h.valider);
  assert.equal(h.boutons.length, 1, "un seul bouton même si on le propose deux fois (réussite puis réponse montrée)");
  assert.equal(h.boutons[0].id, "eleveSchema");
  assert.equal(h.boutons[0].className, "secondaire", "le jaune de « Voir la réponse »");
  assert.equal(h.boutons[0].textContent, "Voir le schéma");
  assert.equal(h.boutons[0].type, "button");
  assert.equal(h.valider.hidden, true, "le Valider éteint s'efface");
  const m = harnaisSchema(); m.ctx.monde2(); m.ctx.proposer(m.valider);
  assert.equal(m.boutons.length, 0, "rien pour une carte du monde 2");
  assert.notEqual(m.valider.hidden, true, "et son Valider reste");
  // proposé après la réussite ET après « Voir la réponse »
  assert.match(fn("eleveValiderSplat"), /eleveDevoilerTache\(\);\n    eleveProposerSchema\(bouton\);/);
  assert.match(fn("eleveMontrerReponse"), /if\(voir\) voir\.remove\(\);\n  eleveProposerSchema\(bouton\);/);
});

test("trois étapes, une par appui ; à la dernière le bouton s'efface et « Carte suivante » reprend le focus", () => {
  const h = harnaisSchema();
  h.ctx.proposer(h.valider);
  const bouton = h.boutons[0];
  bouton.onclick();
  assert.deepEqual(h.ctx.dessins, [1]);
  assert.equal(bouton.textContent, "Étape suivante ▶");
  bouton.onclick();
  assert.deepEqual(h.ctx.dessins, [1, 2]);
  assert.equal(h.boutons.length, 1, "toujours là avant la dernière étape");
  bouton.onclick();
  assert.deepEqual(h.ctx.dessins, [1, 2, 3]);
  assert.equal(h.boutons.length, 0, "effacé aux calculs");
  assert.equal(h.suivant.focalise, 1, "Entrée enchaîne sur la carte suivante");
  h.ctx.voir();
  assert.equal(h.ctx.etape(), 3, "un appui de plus ne dépasse pas les calculs");
  assert.deepEqual(h.ctx.dessins, [1, 2, 3]);
  // le nombre d'étapes vient de la correction en barres : 3 avec un total, 2 sans (enqueteNbEtapes)
  assert.match(fn("eleveSchemaEtapes"), /card\.family === "C"\) \? enqueteDerniereEtape\(card\)/);
  assert.match(fn("enqueteNbEtapes"), /return card\._rel\.sansTotal \? 2 : 3;/);
});

test("les étapes sont celles de la projection, et la nouvelle carte repart du plateau couvert", () => {
  assert.match(fn("eleveDessinerSchema"), /renderCard\(card, eleveSchemaEtape\);\n  if\(sysAPlan\(card\)\) eleveCadrerSchemaSys\(card\); else eleveCadrerScene\(\);/);
  assert.match(fn("renderEleveSplat"), /eleveEnqueteDevoile = false; eleveSchemaEtape = 0;[^\n]*\n  eleveIndicesTel = [^\n]*\n  renderCard\(card, 0\);/);
  assert.match(fn("renderEleveSplat"), /elevePaveRendrePlateau\(\);[^\n]*\n  eleveSchemaReinitialiser\(\);/);
  assert.match(fn("renderEleveFinSplat"), /eleveEnqueteDevoile = false; eleveSchemaEtape = 0;[^\n]*\n  eleveIndicesTel = false;[^\n]*\n  renderCard\(eleveSerie\[total - 1\], 0\);/);
  // le cadre 1,5 fois plus large que l'écran, à faire glisser (coupé à droite), a disparu
  assert.doesNotMatch(html, /ELEVE_SCHEMA_ZOOM_TEL|eleveSchemaZoom/);
  assert.match(fn("eleveSchemaTelephone"), /window\.matchMedia\("\(max-width: 599px\)"\)\.matches/);
  // ordinateur : le plateau ne grandit que de la place libre (fenêtre − reste de la carte − 16),
  // pour que « Étape suivante » puis « Carte suivante » restent entiers à l'écran
  const plateauPC = (fenetre, plateauH, carteH) => {
    const plateau = { getBoundingClientRect: () => ({ width: 1498, height: plateauH }), classList: { contains: () => false }, style: {} };
    new Function("document", "window", `
      function renderCard(){}
      function eleveCadrerScene(){}
      function sysAPlan(){ return false; }
      function eleveSchemaReinitialiser(){ throw new Error("pas de nettoyage hors téléphone"); }
      const svg = { viewBox: { baseVal: { width: 1600, height: 1100 } }, style: {}, setAttribute(){} };
      let eleveSchemaEtape = 1;
      ${constLine("const ELEVE_PLATEAU_MIN = ")}
      ${fn("eleveSchemaTelephone")}
      ${fn("eleveDessinerSchema")}
      eleveDessinerSchema({});
    `)(
      { getElementById: (id) => (id === "svgWrap" ? plateau : null),
        querySelector: (sel) => (sel === "#fsHost .cardbox" ? { getBoundingClientRect: () => ({ height: carteH }) } : null) },
      { innerHeight: fenetre, matchMedia: () => ({ matches: false }) });
    return plateau.style.height;
  };
  assert.equal(plateauPC(730, 336, 688), "362px", "PC 1536 × 730 : 730 − (688 − 336) − 16");
  assert.equal(plateauPC(950, 437, 789), "582px", "PC 1920 × 950 : 950 − (789 − 437) − 16");
  assert.equal(plateauPC(590, 280, 587), undefined, "pas de place libre : le plateau ne rétrécit pas");
  assert.equal(plateauPC(2000, 437, 789), "1030px", "grande fenêtre : le dessin à pleine largeur (1498 × 1100 / 1600)");
  assert.doesNotMatch(fn("eleveDessinerSchema"), /0\.62/, "plus de plafond à 62 % de la fenêtre");
});

// --- téléphone : le schéma en portrait (23/09/2026) ------------------------------------------
/* Un faux téléphone de 359 px de plateau : la carte a trois cadres de hauteurs différentes ;
   « haut des boutons » = ce qu'il y a au-dessus du plateau + le plateau + la ligne des
   réponses + la marge des boutons (avant le schéma : 448 px, comme sur l'iPhone). */
function harnaisTelephone({ hauteurs = { 1: 300, 2: 470, 3: 660 }, avant = 448, sansCadre = false } = {}){
  const classes = () => { const s = new Set(); return { add: (k) => s.add(k), remove: (k) => s.delete(k), contains: (k) => s.has(k), liste: s }; };
  const plateau = { classList: classes(), style: {}, getBoundingClientRect: () => ({ width: 359, height: 208 }) };
  const panneau = { classList: classes() };
  let bandeau = null;
  plateau.parentNode = { insertBefore: (n, ref) => { assert.equal(ref, plateau, "le bandeau se pose juste avant le plateau"); bandeau = n; } };
  const actions = { style: {}, getBoundingClientRect: () => ({
    top: plateau.classList.contains("eleveSchemaTel")
      ? 100 + parseFloat(plateau.style.height) + 40 + parseFloat(actions.style.marginTop || "14")
      : avant }) };
  const cadre = {
    querySelector: (sel) => (sel === "rect" ? { getAttribute: (a) => ({ x: "60", width: "960" })[a] } : null),
    getBBox: () => ({ x: 60, y: 620, width: 960, height: hauteurs[ctx.etapeDessinee()] })
  };
  const document = {
    getElementById: (id) => ({ svgWrap: plateau, elevePanel: panneau, eleveRappel: bandeau, enqueteBarres: sansCadre ? null : cadre })[id] || null,
    querySelector: (sel) => (sel === "#elevePanel .eleveActions" ? actions : null),
    createElement: () => ({ remove(){ bandeau = null; } })
  };
  const window = { scrollY: 0, matchMedia: () => ({ matches: true }) };
  const ctx = new Function("document", "window", `
    let eleveSchemaEtape = 0, eleveIdx = 0, eleveSchemaTel = false;
    ${constLine("const ELEVE_SCHEMA_ETAPES = ")}
    ${constLine("const ELEVE_PLATEAU_MIN = ")}
    ${constLine("const ELEVE_SCHEMA_CADRES = ")}
    ${constLine("let eleveSchemaTelReserve = ")}
    const svg = { style: {}, vb: null, setAttribute(k, v){ if(k === "viewBox") this.vb = v; } };
    const rendus = []; let derniere = 0;
    function renderCard(card, etape){ rendus.push([etape, eleveSchemaTel]); derniere = etape; }
    let cadrages = 0;
    function eleveCadrerScene(){ if(!${sansCadre}) throw new Error("le téléphone ne recadre pas la scène entière"); cadrages++; }
    function sysAPlan(){ return false; }
    function enqueteDerniereEtape(card){ return 3; }
    ${constLine("const ELEVE_SCHEMA_ETAPES = ").replace("const ELEVE_SCHEMA_ETAPES", "const _dup")}
    ${fn("eleveSchemaEtapes")}
    ${fn("eleveSchemaTelephone")}
    ${fn("eleveSchemaTelRendre")}
    ${fn("eleveDessinerSchema")}
    ${fn("eleveRappelHtml")}
    ${fn("eleveRappelAfficher")}
    ${fn("eleveSchemaReinitialiser")}
    const carte = { total: 27, _inv: { indices: ["Sous la tache rouge, il y a 9 jetons de moins que sous la tache bleue."] } };
    return {
      etape(e){ eleveSchemaEtape = e; eleveDessinerSchema(carte); },
      carteSuivante(){ eleveIdx++; },
      reinitialiser: eleveSchemaReinitialiser,
      etapeDessinee: () => derniere, rendus, svg,
      reserve: () => eleveSchemaTelReserve, tel: () => eleveSchemaTel, cadrages: () => cadrages
    };
  `)(document, window);
  const px = (h) => Math.round(359 * (h + 12) / (960 + 12));
  const hautBoutons = () => actions.getBoundingClientRect().top;
  return { ctx, plateau, panneau, actions, bandeau: () => bandeau, px, hautBoutons, hauteurs };
}

test("téléphone : chaque étape se dessine en portrait, entière, à la largeur du plateau", () => {
  const t = harnaisTelephone();
  t.ctx.etape(1);
  // la première étape mesure les trois cadres, puis redessine la sienne — toujours en portrait
  assert.deepEqual(t.ctx.rendus, [[1, true], [2, true], [3, true], [1, true]]);
  assert.equal(t.ctx.tel(), false, "le drapeau portrait ne vaut que pendant le dessin");
  assert.equal(t.ctx.svg.vb, "54 614 972 312", "cadré sur le cadre, 6 unités de marge : rien de coupé");
  assert.equal(t.ctx.svg.style.width, "359px", "la largeur du plateau, pas 1,5 fois");
  assert.equal(t.plateau.style.height, t.px(300) + "px");
  assert.equal(t.ctx.reserve().h, t.px(660), "la place réservée : la plus haute des trois étapes");
  assert.ok(t.plateau.classList.contains("eleveSchemaTel"));
  assert.ok(t.panneau.classList.contains("schemaTel"), "le panneau passe en « ligne des réponses »");
  assert.match(t.bandeau().innerHTML, /<span>TOTAL<\/span><b>27<\/b>/);
  assert.match(t.bandeau().innerHTML, /<p>Sous la tache rouge, il y a 9 jetons de moins que sous la tache bleue\.<\/p>/);
  // les étapes suivantes : un seul dessin chacune
  t.ctx.etape(2); t.ctx.etape(3);
  assert.deepEqual(t.ctx.rendus.slice(4), [[2, true], [3, true]]);
  assert.equal(t.plateau.style.height, t.px(660) + "px", "le plateau prend la hauteur du cadre de l'étape");
});

test("téléphone : les boutons ne bougent pas d'une étape à l'autre, et restent là où était « Voir le schéma » quand la carte le permet", () => {
  const t = harnaisTelephone();
  const hauts = [1, 2, 3].map((e) => { t.ctx.etape(e); return t.hautBoutons(); });
  assert.deepEqual(hauts, [448, 448, 448], "carte courte : exactement la place d'avant le schéma");
  assert.equal(t.actions.style.marginTop, (14 + t.px(660) - t.px(660) + t.ctx.reserve().plus) + "px");
  // carte haute (trois taches) : ils descendent une fois, puis ne bougent plus
  const g = harnaisTelephone({ hauteurs: { 1: 420, 2: 560, 3: 900 } });
  const hautsG = [1, 2, 3].map((e) => { g.ctx.etape(e); return g.hautBoutons(); });
  assert.equal(new Set(hautsG).size, 1, "même place aux trois étapes");
  assert.ok(hautsG[0] > 448, "plus bas qu'avant le schéma, jamais plus haut");
  assert.equal(g.ctx.reserve().plus, 0);
});

test("téléphone : nouvelle carte ou appareil tourné, tout revient comme avant le schéma", () => {
  const t = harnaisTelephone();
  t.ctx.etape(1); t.ctx.etape(2);
  t.ctx.reinitialiser();
  assert.equal(t.plateau.classList.contains("eleveSchemaTel"), false);
  assert.equal(t.panneau.classList.contains("schemaTel"), false);
  assert.equal(t.bandeau(), null, "le bandeau est retiré");
  assert.equal(t.actions.style.marginTop, "");
  assert.equal(t.ctx.reserve(), null);
  assert.equal(t.ctx.svg.style.width, "");
  // la carte suivante remesure ses trois cadres
  t.ctx.carteSuivante(); const n = t.ctx.rendus.length; t.ctx.etape(1);
  assert.equal(t.ctx.rendus.length - n, 4);
  // nouvelle carte : les boutons du schéma quittent la ligne commune, l'écran de fin reprend
  // le cadrage de la carte (le schéma resté affiché lui laissait son cadre, TOTAL coupé)
  assert.match(fn("renderEleveSplat"), /  eleveSchemaReinitialiser\(\);[^\n]*\n  panneau\.classList\.remove\("avecSchema"\);/);
  assert.match(fn("renderEleveFinSplat"), /renderCard\(eleveSerie\[total - 1\], 0\);\n  eleveCadrerScene\(\);/);
  // l'appareil tourné (plus de 600 px) : l'étape suivante quitte le portrait
  assert.match(fn("eleveDessinerSchema"), /if\(plateau && plateau\.classList\.contains\("eleveSchemaTel"\)\) eleveSchemaReinitialiser\(\);\n  renderCard\(card, eleveSchemaEtape\);/);
});

test("le bandeau : la case TOTAL puis la ou les phrases d'indice, texte échappé", () => {
  const rappel = new Function(`${fn("eleveRappelHtml")} return eleveRappelHtml;`)();
  const h = rappel({ total: 38, _inv: { indices: ["Sous la tache noire, il y a 12 jetons de plus que sous la tache bleue.", [{ type: "splat" }], "A < B & C"] } });
  assert.equal(h, '<div class="eleveRappelTotal"><span>TOTAL</span><b>38</b></div>' +
    '<div class="eleveRappelIndices"><p>Sous la tache noire, il y a 12 jetons de plus que sous la tache bleue.</p><p>A &lt; B &amp; C</p></div>',
    "seules les phrases (pas les indices en symboles), dans l'ordre");
  assert.equal(rappel({ total: 5 }), '<div class="eleveRappelTotal"><span>TOTAL</span><b>5</b></div><div class="eleveRappelIndices"></div>');
  assert.match(rappel({ total: 48, _rel: { sansTotal: true } }), /<b class="inconnu">\?<\/b>/, "une carte sans total ne donne pas son total");
  // son « ? » en gris ardoise, dans le bandeau comme dans la case TOTAL du tableau
  const r = regles(feuille);
  assert.equal((r.find((x) => x.sel === "#eleveRappel .eleveRappelTotal b.inconnu, #elevePanel.sansTotal .eleveCase.haut.donnee .eleveDonneeVal") || {}).decl, "color:#64748b");
  assert.match(fn("renderEleveSplat"), /panneau\.classList\.toggle\("sansTotal", !!\(enquete && \(\(card\._rel && card\._rel\.sansTotal\) \|\| sysTotalCache\(card\)\)\)\);/);
});

test("téléphone : un schéma sans cadre portrait repasse au dessin d'ordinateur, rien ne reste à moitié", () => {
  const t = harnaisTelephone({ sansCadre: true });
  t.ctx.etape(1);
  assert.equal(t.ctx.tel(), false);
  assert.equal(t.ctx.cadrages(), 1, "la scène entière est recadrée, comme sur ordinateur");
  assert.equal(t.plateau.classList.contains("eleveSchemaTel"), false);
  assert.equal(t.panneau.classList.contains("schemaTel"), false, "le tableau complet revient");
  assert.equal(t.bandeau(), null);
  assert.equal(t.ctx.reserve(), null);
  const src = fn("eleveSchemaTelRendre");
  assert.match(src, /if\(!cadre\) throw new Error\("schéma sans cadre portrait"\);/);
  assert.match(src, /eleveSchemaTel = true;\n  try\{ renderCard\(card, etape\); \} finally \{ eleveSchemaTel = false; \}/, "le drapeau retombe même si le dessin échoue");
});

test("téléphone : pendant le schéma, la ligne des réponses reste, les boutons tiennent sur une ligne", () => {
  const r = regles(feuille);
  const decl = (sel) => (r.find((x) => x.sel === sel) || {}).decl || "";
  assert.equal(decl("#elevePanel.schemaTel .eleveConsigne, #elevePanel.schemaTel .eleveDiag .ligneHaut, #elevePanel.schemaTel .eleveMsg"), "display:none",
    "la question, la ligne TOTAL (déjà dans le bandeau) et le message s'effacent le temps du schéma");
  assert.equal(decl("#elevePanel.enquete.avecSchema .eleveActions"), "flex-wrap:nowrap");
  assert.match(feuille, /@media \(max-width:599px\)\{\n    #elevePanel\.enquete\.avecSchema \.eleveActions button\{flex:1 1 0;max-width:240px;padding:12px 4px;white-space:nowrap\}/);
  assert.match(decl("body.eleve-mode #svgWrap.eleveSchemaTel"), /overflow:hidden/, "plus de défilement de côté");
  assert.match(fn("eleveProposerSchema"), /panneauS\.classList\.add\("avecSchema"\)/);
  assert.match(fn("renderEleveSplat"), /panneau\.classList\.remove\("avecSchema"\);/);
});

// --- le dessin portrait des schémas ------------------------------------------------------------
test("cadre portrait : étroit, l'équation sous le tableau ; le cadre paysage (ordinateur, impression) ne change pas", () => {
  const lay = new Function(`${constLine("const RELATION_PORTRAIT = ")} ${fn("getRelationSchemaLayout")} return getRelationSchemaLayout;`)();
  assert.deepEqual(lay({}), { boxX: 60, boxW: 1480, labelW: 150, equationW: 660, barX: 210, barW: 636, barShiftX: 0, equationCenterX: 1210 });
  assert.deepEqual(lay({ barShiftX: 30 }).barW, 636, "impression : même tableau");
  const p = lay({ portrait: true });
  assert.deepEqual(p, { boxX: 60, boxW: 960, labelW: 230, equationW: 944, barX: 290, barW: 560, barShiftX: 0, equationCenterX: 540, portrait: true });
  assert.match(constLine("const ELEVE_SCHEMA_TEL_OPTS = "), /\{ portrait:true, fontScale:1\.6, verticalScale:1\.3 \};/);
  // l'équation se centre dans la largeur du cadre ; en paysage, rien ne bouge
  const fit = new Function(`
    function getRelationDrawingMetrics(o){ const k = (o && o.fontScale) || 1; return { font: (x) => Math.round(x * k) }; }
    function measureRelationEquationTextWidth(t, fs){ return String(t).length * fs * 0.5; }
    function measureArrowLabelWidth(t, fs){ return String(t).length * fs * 0.5; }
    ${fn("relationEquationFit")}
    return relationEquationFit;`)();
  const lignes = [{ left: "? + ? + 4 + ? + 12 + 7", right: "38" }];
  const fp = fit(lignes, [], p, { fontScale: 1.6 });
  const g = 22 + 18, lhs = lignes[0].left.length * fp.fontSize * 0.5, rhs = 2 * fp.fontSize * 0.5, eq = Math.round(fp.fontSize * 0.65);
  const gauche = fp.eqCenter - eq - lhs, droite = fp.eqCenter + eq + rhs;
  assert.ok(gauche >= 60 + 26 && droite <= 60 + 960 - 26, "la ligne tient entre les bords du cadre");
  assert.ok(Math.abs((gauche - 86) - (1020 - 26 - droite)) <= 26, "et elle est centrée (à la réserve des flèches près)");
  void g;
  const fl = fit(lignes, [], lay({}), {});
  assert.ok(fl.eqCenter > 210 + 636, "paysage : toujours à droite du tableau");
  // les trois cadres savent se dessiner en portrait, et « Résoudre » reste au professeur
  for (const nom of ["drawRelationSituationSchema", "drawRelationGroupedSchema", "drawRelationOrderedSchema"]) {
    assert.match(fn(nom), /relationPortraitTete\(boxY, f, v\)/, `${nom} : titre et « Total » ont leur air en portrait`);
  }
  // les trois cadres de l'Enquête « sans total » aussi : titre sur deux lignes, calculs sous
  // les barres, réponse sous la vérification (à droite, elle sortait du cadre étroit)
  for (const nom of ["drawEnqueteSansTotalSituation", "drawEnqueteDeuxEcritures", "drawEnqueteVerification"]) {
    assert.match(fn(nom), /relationPortraitTete\(boxY, f, v\)/, `${nom} : portrait`);
  }
  assert.match(fn("drawEnqueteDeuxEcritures"), /const titres = portrait \? \[`La \$\{word\}, écrite deux fois :`, "ce qui dépasse"\]/);
  assert.match(fn("drawEnqueteDeuxEcritures"), /y = y2 \+ rowH \+ v\(30\) \+ Math\.round\(fs \* 0\.5\);/);
  assert.match(fn("drawEnqueteVerification"), /if\(portrait\) drawRelationAnswerLine\(g, card, boxX \+ 16, boxW - 32,/);
  assert.match(fn("drawRelationGroupedSchema"), /cadreReg\.setAttribute\("height", boxH\);/);
  assert.match(fn("drawRelationOrderedSchema"), /cadreOrd\.setAttribute\("height", boxH\);/);
  assert.match(fn("drawRelationOrderedSchema"), /if\(!solved && !\(typeof eleveActif !== "undefined" && eleveActif\)\)\{\n    drawEquabarSolveButton/);
});

test("renderCard : portrait au téléphone, et sur ordinateur la phrase d'indice reste sous le plateau (mode élève seulement)", () => {
  const r = fn("renderCard");
  assert.match(r, /const relTel = telEleve \? ELEVE_SCHEMA_TEL_OPTS : \{\};/);
  for (const appel of [
    "drawRelationSituationSchema(relCible, card, { filled: revealState === 2, ...relTel });",
    "drawRelationGroupedSchema(relCible, card, { ...relTel });",
    "drawRelationOrderedSchema(relCible, card, { ...relTel });",
    "drawRelationOrderedSchema(relCible, card, { solved:true, ...relTel });"
  ]) assert.ok(r.includes(appel), appel);
  assert.match(r, /const phrasesEleve = \(typeof eleveActif !== "undefined" && eleveActif && !telEleve && isCRelationLayout/,
    "la projection ne change pas ; le téléphone a son bandeau");
  assert.match(r, /const basPlateau = relTrayY \+ relTrayK \* \(trayCfg\.y \+ trayCfg\.h\);/);
  assert.match(r, /const dy = Math\.max\(0, Math\.round\(derniere \+ 36 - 620\)\);/, "le cadre descend d'autant que les phrases le demandent");
});

// --- les vraies largeurs après validation ------------------------------------------------------
test("après validation, les cases prennent leur vraie largeur ; pendant la recherche elles restent égales", () => {
  const casesBas = [
    { classes: ["eleveCase", "blanche", "donnee"], attendu: null, style: {} },
    { classes: ["eleveCase", "grise"], attendu: "9", style: {} },
    { classes: ["eleveCase", "grise"], attendu: "5", style: {} },
    { classes: ["eleveCase", "grise"], attendu: "17", style: {} }
  ].map((c) => ({ ...c, classList: { contains: (k) => c.classes.includes(k) }, getAttribute: () => c.attendu }));
  const diag = { classes: [], classList: { add(k){ diag.classes.push(k); } } };
  const panneau = (enquete) => ({
    classList: { contains: (k) => k === "enquete" && enquete },
    querySelector: (sel) => (sel === ".eleveDiag" ? diag : null),
    querySelectorAll: (sel) => (sel === ".ligneBas .eleveCase" ? casesBas : [])
  });
  const lancer = (enquete) => new Function("document", `
    let eleveIdx = 0;
    const eleveSerie = [{ family: "C" }];
    function eleveInfosEnquete(card){ return card && card.family === "C" ? { visibleSum: 7 } : null; }
    function sysAPlan(){ return false; }
    function eleveInfosSysteme(){ return null; }
    ${fn("eleveInfosTableau")}
    ${fn("eleveEnqueteLargeursVraies")}
    eleveEnqueteLargeursVraies();
  `)({ getElementById: (id) => (id === "elevePanel" ? panneau(enquete) : null) });
  lancer(false);
  assert.deepEqual(casesBas.map((c) => c.style.flexGrow), [undefined, undefined, undefined, undefined], "hors Enquête, rien");
  lancer(true);
  assert.deepEqual(casesBas.map((c) => c.style.flexGrow), ["7", "9", "5", "17"], "visibles puis chaque tache, à sa valeur");
  assert.deepEqual(diag.classes, ["vraies"], "le tableau porte la classe qui pose le minimum de largeur");
  // appelée après la réussite ET après « Voir la réponse », jamais avant
  assert.match(fn("eleveValiderSplat"), /eleveProposerSchema\(bouton\);[^\n]*\n    eleveEnqueteLargeursVraies\(\);/);
  assert.match(fn("eleveMontrerReponse"), /eleveProposerSchema\(bouton\);[^\n]*\n  eleveEnqueteLargeursVraies\(\);/);
  assert.doesNotMatch(fn("renderEleveSplat"), /eleveEnqueteLargeursVraies/, "à l'ouverture de la carte, largeurs égales");
  const r = regles(feuille);
  const decl = (sel) => (r.find((x) => x.sel === sel) || {}).decl || "";
  assert.equal(decl("#elevePanel.enquete .ligneBas .eleveCase"), "transition:flex-grow .6s ease");
  assert.equal(decl("#elevePanel.enquete .eleveDiag.vraies .ligneBas .eleveCase"), "min-width:72px", "un minimum pour lire le nom et le nombre");
});

// --- le dévoilement et le nom sur la tache ---------------------------------------------------
test("Enquête : le dévoilement redessine la carte (chaque tache a sa couleur), le monde 2 garde son geste", () => {
  const src = fn("eleveDevoilerTache");
  assert.match(src, /if\(\(p\.getAttribute\("fill"\) \|\| ""\) === "var\(--splat-cover\)"\) p\.classList\.add\("eleveDevoile"\);/, "le geste du monde 2 est intact");
  assert.match(src, /if\(card && eleveInfosTableau\(card\)\)\{[^\n]*\n    eleveEnqueteDevoile = true;\n    renderCard\(card, eleveSchemaEtape\);\n    eleveCadrerScene\(\);/);
  const rendu = fn("renderCard");
  assert.match(rendu, /const eleveDevoileC = \(card\.family === "C"\) && typeof eleveEnqueteDevoile !== "undefined" && !!eleveEnqueteDevoile;/);
  // taches dévoilées au 5e clic ; au 4e pour une carte « sans total » (lot E-sans-total : le 5e y est la vérification)
  assert.match(rendu, /const visualRevealState = \(card\.family === "C"\) \? \(\(revealState >= enqueteDerniereEtape\(card\) \|\| eleveDevoileC\) \? 2 : 0\)/);
  assert.match(rendu, /const fonduCouverture = !\(eleveDevoileC && revealState > 0\);/, "le fondu de la couverture ne rejoue pas à chaque étape du schéma");
  assert.match(rendu, /if\(visualRevealState === 2 && fonduCouverture\)\{/);
});

test("le nom de la couleur se pose juste au-dessus du jeton, à 14 unités, écran comme impression", () => {
  const dessine = new Function(`
    ${PALETTE}
    ${constLine("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
    ${fn("investigateColorByKey")}
    ${fn("investigateColorWord")}
    ${fn("investigateColorInfo")}
    ${constLine("const ENQUETE_NOM_ECART = ")}
    function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
    ${fn("drawInvestigateSplatName")}
    return (s, card, revealed) => { const out = []; drawInvestigateSplatName({ appendChild: (n) => out.push(n) }, s, 0, card, revealed, { mkEl: () => ({}), mkText: (x, y, t, a) => ({ x, y, t, a }) }); return out[0]; };
  `)();
  const carte = { family: "C", _beadR: 58, _rel: { colorMap: ["green"] } };
  const grande = dessine({ cx: 800, cy: 600, r: 220 }, carte, true);   // 2 taches : police 60
  assert.equal(grande.t, "verte");
  assert.equal(grande.y, 600 - 58 - 14 - 60 * 0.34, "bas des lettres à 14 unités du haut du jeton");
  assert.ok(grande.y > 600 - 220 * 0.65 + 7 + 40, "nettement plus bas qu'à la hauteur du mot « opposé » de B± (le réglage d'avant)");
  const petite = dessine({ cx: 800, cy: 600, r: 170 }, carte, true);   // 3 taches : police 51
  assert.equal(petite.y, 600 - 58 - 14 - 51 * 0.34);
  assert.ok(petite.y - 51 * 0.34 > 600 - 170, "le mot reste dans la tache");
  assert.equal(dessine({ cx: 800, cy: 600, r: 220 }, carte, false).y, 600, "tache couverte : le mot au centre, comme avant");
  // l'impression appelle la même fonction (correction 4 par page)
  assert.match(html, /if\(card\.family === "C"\) drawInvestigateSplatName\(targetSvg, \{\.\.\.s, cy:s\.cy \+ printOffsetY\}, idx, card, revealAnswers, \{ mkEl:tEl, mkText:tText, isPrint:true \}\);/);
  assert.match(constLine("const OPPOSE_MOT_BAISSE = "), /= 7;/, "le mot « opposé » de B± ne bouge pas");
});

// --- la feuille de style -----------------------------------------------------------------------
test("le Valider éteint s'efface pour laisser « Voir le schéma » et « Carte suivante » sur une ligne", () => {
  const r = regles(feuille);
  const decl = (sel) => (r.find((x) => x.sel === sel) || {}).decl || "";
  assert.equal(decl("#elevePanel.enquete .eleveActions"), "flex-wrap:wrap");
  assert.match(fn("eleveProposerSchema"), /bouton\.hidden = true;/, "par le script, pas par une règle CSS : sur ordinateur, rien ne cache le Valider d'une carte à remplir");
  assert.match(decl("#elevePanel.enquete .eleveCase"), /^flex-direction:column;justify-content:center;/, "l'étiquette au-dessus du nombre, les deux centrés");
  assert.equal(decl("#elevePanel.enquete .eleveTacheNom"), "position:relative;margin:0;left:0;top:0", "rien ne pousse le nombre de côté, et le décalage de la règle de base (left:3px;top:2px) est annulé : le mot reste centré");
  assert.match(decl("#elevePanel.enquete .eleveTacheCouleur"), /^position:absolute;right:calc\(100% - var\(--reserve-tache\) \+ 3px\);/, "la mini-tache s'accroche à 3 px du mot, dans la réserve : c'est le mot qui est centré sur le nombre");
  assert.match(decl("#elevePanel.enquete input.eleveChamp"), /^height:auto;flex:0 0 auto;/, "le champ ne prend plus toute la hauteur de la case");
  assert.equal(decl("#elevePanel.enquete .eleveCase.ko"), "background:#fee2e2", "case fausse : toute la case rougit, pas seulement le champ");
  assert.equal(decl(".eleveCase.haut.donnee"), "color:#111", "le total en noir, comme sur les fiches");
  assert.match(decl(".eleveCase.blanche.donnee .eleveTacheNom"), /#1d4ed8/, "« visibles » en bleu");
  assert.deepEqual(r.filter((x) => /eleveTacheNom|eleveTacheCouleur|donnee/.test(x.sel) && /padding-(top|left)|text-indent/.test(x.decl)), [], "rien ne décale les chiffres");
});

test("centrage sûr : l'étiquette d'une case de tache réserve la place de la pastille des deux côtés (19 px au téléphone, 23 px sur ordinateur)", () => {
  const r = regles(feuille);
  const rang = (sel) => r.findIndex((x) => x.sel === sel);
  const decl = (sel) => (r[rang(sel)] || {}).decl || "";
  // la paire de règles, dans l'ordre : l'étiquette réserve sa place et se centre par marges
  // automatiques (dans une case trop étroite, elle se cale à gauche au lieu de déborder des
  // deux côtés) ; puis la pastille s'accroche à 3 px du mot, dans la réserve de gauche
  const iNom = rang("#elevePanel.enquete .eleveCase.grise .eleveTacheNom");
  assert.ok(iNom > 0, "la règle de l'étiquette des cases de taches");
  assert.equal(rang("#elevePanel.enquete .eleveTacheCouleur"), iNom + 1, "la règle de la pastille vient juste après");
  assert.equal(decl("#elevePanel.enquete .eleveCase.grise .eleveTacheNom"), "margin:0 auto;padding:0 var(--reserve-tache)");
  assert.equal(decl("#elevePanel.enquete .eleveTacheCouleur"), "position:absolute;right:calc(100% - var(--reserve-tache) + 3px);top:50%;transform:translateY(-50%)");
  // les deux réserves = bord + pastille + écart de 3 px
  assert.equal(decl("#elevePanel.enquete .eleveCase.grise"), "--reserve-tache:19px", "téléphone et tablette : 2 px de bord (le cadre bleu de la case active reste entier) + pastille de 14 px + 3");
  const ordi = feuille.slice(feuille.indexOf("@media (min-width:1000px) and (min-height:700px){"));
  const blocOrdi = ordi.slice(0, ordi.indexOf("\n  }"));
  assert.match(blocOrdi, /body\.eleve-mode \.eleveTacheCouleur\{width:20px;/, "sur ordinateur la pastille passe à 20 px…");
  assert.match(blocOrdi, /body\.eleve-mode #elevePanel\.enquete \.eleveCase\.grise\{--reserve-tache:23px\}/, "… et la réserve à 20 + 3, dans le même bloc");
  // TOTAL et « visibles » n'ont pas de pastille : ni réserve ni marges automatiques
  assert.equal(decl("#elevePanel.enquete .eleveTacheNom"), "position:relative;margin:0;left:0;top:0");
  assert.doesNotMatch(fn("eleveCaseDonneeHtml"), /grise/, "les cases données ne sont jamais .grise");
});
