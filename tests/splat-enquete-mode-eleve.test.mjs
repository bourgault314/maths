/* SPLAT! Enquête — lot E2 « le mode élève » (22/09/2026).
   Ces tests exécutent les fonctions de outils/splat.html telles quelles (extraites du
   fichier) : elles vérifient des comportements, pas la présence d'un bout de code.
   - une carte d'Enquête donne une case PAR tache, de largeur égale, dans l'ordre du
     plateau, avec la mini-tache à sa couleur et le nom de la couleur ;
   - le total et les jetons visibles sont donnés (pas de champ), la validation les ignore ;
   - la consigne et le message de réussite de l'Enquête ;
   - « Voir le schéma » : cinq étapes, une par appui, puis le bouton s'efface ;
   - le nom de la couleur sur la tache dévoilée se pose juste au-dessus du jeton (écran
     et impression passent par la même fonction) ;
   - le dévoilement de l'Enquête redessine la carte (les taches ont leur propre couleur). */
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
  assert.match(rendu, /const enquete = infos \? null : eleveInfosEnquete\(card\);/);
  assert.match(rendu, /if\(!infos && !enquete\)\{\n    tete\.style\.display = "none";\n    panneau\.innerHTML = `<p class="eleveConsigne">Le parcours élève n'existe pas encore pour ce mode\.<\/p>`;/);
  assert.match(rendu, /panneau\.classList\.toggle\("enquete", !!enquete\);/);
  assert.match(rendu, /bas = eleveCasesEnqueteHtml\(card, enquete\);\n    haut = eleveCaseDonneeHtml\("haut blanche", "Total", card\.total\);/);
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
  assert.equal(consigne(["enquete"], true, 390), "Combien de jetons sous chaque tache ?");
  assert.equal(consigne(["enquete"], false, 1280), "Combien de jetons sous chaque tache ?");
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
    function eleveDessinerSchema(card){ dessins.push(eleveSchemaEtape); }
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

test("cinq étapes, une par appui ; à la dernière le bouton s'efface et « Carte suivante » reprend le focus", () => {
  const h = harnaisSchema();
  h.ctx.proposer(h.valider);
  const bouton = h.boutons[0];
  bouton.onclick();
  assert.deepEqual(h.ctx.dessins, [1]);
  assert.equal(bouton.textContent, "Étape suivante ▶");
  bouton.onclick(); bouton.onclick(); bouton.onclick();
  assert.deepEqual(h.ctx.dessins, [1, 2, 3, 4]);
  assert.equal(h.boutons.length, 1, "toujours là avant la dernière étape");
  bouton.onclick();
  assert.deepEqual(h.ctx.dessins, [1, 2, 3, 4, 5]);
  assert.equal(h.boutons.length, 0, "effacé à la résolution");
  assert.equal(h.suivant.focalise, 1, "Entrée enchaîne sur la carte suivante");
  h.ctx.voir();
  assert.equal(h.ctx.etape(), 5, "un appui de plus ne dépasse pas la résolution");
  assert.deepEqual(h.ctx.dessins, [1, 2, 3, 4, 5]);
});

test("les étapes sont celles de la projection, et la nouvelle carte repart du plateau couvert", () => {
  assert.match(fn("eleveDessinerSchema"), /renderCard\(card, eleveSchemaEtape\);\n  eleveCadrerScene\(\);/);
  assert.match(fn("renderEleveSplat"), /eleveEnqueteDevoile = false; eleveSchemaEtape = 0;[^\n]*\n  renderCard\(card, 0\);/);
  assert.match(fn("renderEleveSplat"), /elevePaveRendrePlateau\(\);[^\n]*\n  eleveSchemaReinitialiser\(\);/);
  assert.match(fn("renderEleveFinSplat"), /eleveEnqueteDevoile = false; eleveSchemaEtape = 0;[^\n]*\n  renderCard\(eleveSerie\[total - 1\], 0\);/);
  // téléphone : seul le cadre du schéma, 1,5 fois plus large que l'écran, à faire glisser
  assert.match(constLine("const ELEVE_SCHEMA_ZOOM_TEL = "), /= 1\.5;/);
  assert.match(fn("eleveDessinerSchema"), /window\.matchMedia\("\(max-width: 599px\)"\)\.matches/);
  assert.match(fn("eleveDessinerSchema"), /plateau\.classList\.toggle\("eleveSchemaZoom", telephone\);/);
  const r = regles(feuille);
  const decl = (sel) => (r.find((x) => x.sel === sel) || {}).decl || "";
  assert.match(decl("body.eleve-mode #svgWrap.eleveSchemaZoom"), /display:block;place-items:start;overflow-x:auto/);
  assert.match(decl("body.eleve-mode #svgWrap.eleveSchemaZoom #mainSvg"), /max-width:none/);
  // ordinateur : le plateau ne grandit que de la place libre (fenêtre − reste de la carte − 16),
  // pour que « Étape suivante » puis « Carte suivante » restent entiers à l'écran
  const plateauPC = (fenetre, plateauH, carteH) => {
    const plateau = { getBoundingClientRect: () => ({ width: 1498, height: plateauH }), classList: { toggle(){} }, style: {} };
    new Function("document", "window", `
      function renderCard(){}
      function eleveCadrerScene(){}
      const svg = { viewBox: { baseVal: { width: 1600, height: 1100 } }, style: {}, setAttribute(){} };
      let eleveSchemaEtape = 1;
      ${constLine("const ELEVE_PLATEAU_MIN = ")}
      ${constLine("const ELEVE_SCHEMA_ZOOM_TEL = ")}
      ${constLine("const ELEVE_SCHEMA_CADRES = ")}
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

// --- le dévoilement et le nom sur la tache ---------------------------------------------------
test("Enquête : le dévoilement redessine la carte (chaque tache a sa couleur), le monde 2 garde son geste", () => {
  const src = fn("eleveDevoilerTache");
  assert.match(src, /if\(\(p\.getAttribute\("fill"\) \|\| ""\) === "var\(--splat-cover\)"\) p\.classList\.add\("eleveDevoile"\);/, "le geste du monde 2 est intact");
  assert.match(src, /if\(card && eleveInfosEnquete\(card\)\)\{\n    eleveEnqueteDevoile = true;\n    renderCard\(card, eleveSchemaEtape\);\n    eleveCadrerScene\(\);/);
  const rendu = fn("renderCard");
  assert.match(rendu, /const eleveDevoileC = \(card\.family === "C"\) && typeof eleveEnqueteDevoile !== "undefined" && !!eleveEnqueteDevoile;/);
  assert.match(rendu, /const visualRevealState = \(card\.family === "C"\) \? \(\(revealState >= 5 \|\| eleveDevoileC\) \? 2 : 0\)/);
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
  assert.match(decl(".eleveTacheNom"), /^position:absolute;left:3px;top:2px;/, "le nom dans le coin, les chiffres restent centrés");
  assert.match(decl(".eleveCase.haut.donnee"), /^color:#111;flex-direction:column;justify-content:center;/, "le total en noir, le mot TOTAL au-dessus du nombre, les deux centrés");
  assert.match(decl(".eleveCase.haut.donnee .eleveTacheNom"), /^position:static;margin:0;/, "rien ne pousse le nombre de côté");
  assert.match(decl(".eleveCase.blanche.donnee .eleveTacheNom"), /#1d4ed8/, "« visibles » en bleu");
  assert.deepEqual(r.filter((x) => /eleveTacheNom|eleveTacheCouleur|donnee/.test(x.sel) && /padding-(top|left)|text-indent/.test(x.decl)), [], "rien ne décale les chiffres");
});
