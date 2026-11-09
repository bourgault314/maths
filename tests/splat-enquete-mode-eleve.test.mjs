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
  ${fn("eleveCaseCopieHtml")}
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
const casesDe = (h) => [...h.matchAll(/<div class="eleveCase ([^"]+)" style="([^"]+)"( data-attendu="(\d+)")?( data-copie="(\d+)")?>([\s\S]*?)<\/div>/g)]
  .map((m) => ({ classes: m[1], style: m[2], attendu: m[4], copie: m[6], contenu: m[7] }));

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

test("taches répétées (03/10/2026) : une case par tache sous le TOTAL ; l'élève tape dans la première de chaque couleur, les autres recopient", () => {
  // la carte vue par Gwenaël : 3 vertes + 1 rouge = 21 (la rouge 4 fois plus) — avant, « verte + rouge = 21 »
  const carte = carteC({ hidden: [3, 3, 3, 12], colors: ["green", "green", "green", "red"], cx: [300, 700, 300, 700] });
  carte._rel.repetees = { couleurDe: [0, 0, 0, 1], nombre: [3, 1] };
  const infos = cases.infos(carte);
  assert.deepEqual(infos.ordre, [0, 1, 2, 3]);
  const c = casesDe(cases.bas(carte, infos));
  assert.equal(c.length, 4, "quatre cases sous le TOTAL : 3 + 3 + 3 + 12 = 21");
  assert.deepEqual(c.map((x) => x.attendu), ["3", "3", "3", "12"]);
  assert.match(c[0].contenu, /<input class="eleveChamp"/, "la première verte : à remplir");
  assert.match(c[3].contenu, /<input class="eleveChamp"/, "la rouge : à remplir");
  for(const k of [1, 2]){
    assert.equal(c[k].classes, "grise copie");
    assert.doesNotMatch(c[k].contenu, /<input/, "une copie n'a pas de champ : ni le pavé ni la validation ne la voient");
    assert.match(c[k].contenu, /<span>verte<\/span>/);
  }
  assert.match(cases.bas(carte, infos), /data-copie="0"[^>]*>[\s\S]*?data-copie="0"/, "les deux copies pointent la case 0");
  // jetons visibles en tête : le rang de la source se décale d'une case
  const v = carteC({ hidden: [5, 5], colors: ["red", "red"], visible: [4], cx: [300, 700] });
  v._rel.repetees = { couleurDe: [0, 0], nombre: [2] };
  assert.match(cases.bas(v, cases.infos(v)), /data-copie="1"/);
});

test("eleveCopiesSynchroniser : le nombre tapé, « ? » si vide, et le vert / rouge / réponse montrée de la case source", () => {
  const classe = (init) => { const set = new Set(init); return { contains: (k) => set.has(k), toggle: (k, v) => (v ? set.add(k) : set.delete(k)), set }; };
  const champ = { value: "" };
  const src = { classList: classe([]), querySelector: (sel) => (sel === ".eleveChamp" ? champ : null) };
  const val = { textContent: "?", classList: classe(["vide"]) };
  const ligne = { children: [src] };
  const copie = { parentNode: ligne, classList: classe(["eleveCase", "copie"]), getAttribute: (k) => (k === "data-copie" ? "0" : null), querySelector: (sel) => (sel === ".eleveCopieVal" ? val : null) };
  ligne.children.push(copie);
  const synchro = new Function("document", `${fn("eleveCopiesSynchroniser")} return eleveCopiesSynchroniser;`)({
    querySelectorAll: (sel) => (sel === "#elevePanel .eleveCase[data-copie]" ? [copie] : []) });
  synchro();
  assert.equal(val.textContent, "?"); assert.ok(val.classList.contains("vide"));
  champ.value = "3"; synchro();
  assert.equal(val.textContent, "3"); assert.ok(!val.classList.contains("vide"));
  src.classList.toggle("ko", true); synchro();
  assert.ok(copie.classList.contains("ko"), "case fausse : ses copies rougissent aussi");
  src.classList.toggle("ko", false); src.classList.toggle("ok", true); synchro();
  assert.ok(copie.classList.contains("ok") && !copie.classList.contains("ko"));
  // appelée à chaque saisie, à la validation, à « Voir la réponse » et au pas à pas
  assert.match(fn("renderEleveSplat"), /if\(c\) c\.classList\.remove\("ko"\);\n      eleveCopiesSynchroniser\(\);/);
  assert.match(fn("eleveValiderSplat"), /if\(!juste\) toutJuste = false;\n  \}\);\n  eleveCopiesSynchroniser\(\);/);
  assert.match(fn("eleveMontrerReponse"), /c\.classList\.add\("montre"\);\n  \}\);\n  eleveCopiesSynchroniser\(\);/);
  assert.match(fn("eleveReponseCacher"), /\n  \}\);\n  eleveCopiesSynchroniser\(\);\n\}/);
});

test("tableau serré (jusqu'à 7 cases au téléphone) : pastille au-dessus du mot, mesuré à chaque carte et quand la largeur change", () => {
  const r = regles(feuille);
  const decl = (sel) => (r.find((x) => x.sel === sel) || {}).decl || "";
  assert.equal(decl("#elevePanel.enquete .eleveDiag.serre .eleveCase.grise .eleveTacheNom"), "flex-direction:column;gap:2px;margin:0 auto;padding:0");
  assert.equal(decl("#elevePanel.enquete .eleveDiag.serre .eleveCase.grise .eleveTacheCouleur"), "position:static;transform:none");
  assert.match(fn("renderEleveSplat"), /const pave = elevePaveActiver\(panneau\);\n  eleveTableauSerrer\(panneau\);/);
  assert.match(fn("eleveCalerLargeur"), /eleveCalerLargeur\(pn\); eleveTableauSerrer\(pn\);/);
  const src = fn("eleveTableauSerrer");
  assert.match(src, /bas\.style\.setProperty\("--n", String\(bas\.children\.length\)\);/, "--n : le minimum de largeur ne fait jamais déborder le tableau");
  assert.match(src, /diag\.classList\.remove\("serre"\);/, "mesuré sans la classe");
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

test("le total est donné (pas de champ) ; les jetons visibles se remplissent, case vide sans « ? » (02/10/2026)", () => {
  const carte = carteC({ hidden: [9, 5, 17], colors: ["purple", "blue", "black"], visible: [3, 4], cx: [400, 800, 1200] });
  const infos = cases.infos(carte);
  assert.equal(infos.visibleSum, 7);
  const c = casesDe(cases.bas(carte, infos));
  assert.equal(c.length, 4);
  assert.equal(c[0].classes, "blanche", "plus une case donnée");
  assert.equal(c[0].attendu, "7", "la somme des jetons visibles est vérifiée");
  assert.equal(c[0].style, "flex:1 1 0");
  assert.match(c[0].contenu, /<span class="eleveTacheNom"><span>visibles<\/span><\/span><input class="eleveChamp"/);
  assert.doesNotMatch(c[0].contenu, /placeholder|eleveDonneeVal|>7</, "case vide : ni « ? » ni la réponse");
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
  // (lot M4-4b : « Trois paires » du Système n'a plus de ligne du TOTAL ; 08/10/2026 : une carte de
  // l'Enquête sans total non plus — pas de case, seulement une case par tache)
  assert.match(rendu, /bas = eleveCasesEnqueteHtml\(card, enquete\);\n    \/\*[\s\S]*?\*\/\n    haut = \(\(enquete\.systeme && sysTotalCache\(card\)\) \|\| enqueteSansCase\(card\)\) \? ""\n      : eleveCaseDonneeHtml\("haut blanche", "Total", card\.total\);/);
  assert.match(rendu, /`<div class="eleveDiag">\$\{haut \? `<div class="ligneHaut">\$\{haut\}<\/div>` : ""\}`/, "sans case du haut, pas de ligne du haut");
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

test("« Regarde sous les taches… » pour l'Enquête et dès deux taches, « sous la tache… » avec une seule (09/11/2026)", () => {
  const message = (classes, apresErreur, nb) => new Function("document", `${fn("eleveMessageJuste")} return eleveMessageJuste(${apresErreur}, ${nb});`)(docAvecPanneau(classes));
  assert.equal(message(["enquete"], false, 1), "Bravo, du premier coup ! Regarde sous les taches…");
  assert.equal(message(["enquete"], true, 3), "Juste ! Regarde sous les taches…");
  assert.equal(message([], false, 1), "Bravo, du premier coup ! Regarde sous la tache…");
  assert.equal(message([], true, 1), "Juste ! Regarde sous la tache…");
  // monde 2 : 2 à 5 taches sur une carte
  for (const nb of [2, 3, 4, 5]) {
    assert.equal(message([], false, nb), "Bravo, du premier coup ! Regarde sous les taches…");
    assert.equal(message([], true, nb), "Juste ! Regarde sous les taches…");
  }
  // le nombre de taches vient de la carte jouée
  assert.match(fn("eleveValiderSplat"), /const carteJuste = eleveSerie\[eleveIdx\];\s*msg\.textContent = eleveMessageJuste\(eleveCarteFautee, carteJuste && Array\.isArray\(carteJuste\._splats\) \? carteJuste\._splats\.length : 1\);/);
});

// --- « Voir le schéma » ----------------------------------------------------------------------
function harnaisSchema(){
  const boutons = [];
  /* les boutons du pas à pas (03/10/2026) : « ◀ » et « Étape suivante » s'insèrent avant « Carte suivante » */
  const suivant = { className: "suivant", focus(){ suivant.focalise = (suivant.focalise || 0) + 1; document.activeElement = suivant; }, focalise: 0 };
  const actions = {
    appendChild: (b) => { boutons.push(b); b.parentNode = actions; },
    insertBefore: (b, ref) => { const i = ref ? boutons.indexOf(ref) : -1; if(i >= 0) boutons.splice(i, 0, b); else boutons.push(b); b.parentNode = actions; },
    querySelector: (sel) => (sel === ".suivant" ? suivant : null)
  };
  const valider = { parentNode: actions };
  const document = {
    activeElement: null,
    createElement: () => {
      const b = { classes: new Set(), remove(){ this.retire = true; boutons.splice(boutons.indexOf(this), 1); },
        focus(){ document.activeElement = this; }, setAttribute(k, v){ this[k] = v; } };
      b.classList = { toggle: (k, v) => (v ? b.classes.add(k) : b.classes.delete(k)), contains: (k) => b.classes.has(k) };
      return b;
    },
    getElementById: (id) => boutons.find((b) => b.id === id) || null,
    querySelector: (sel) => (sel === "#elevePanel .eleveActions .suivant" ? suivant : sel === "#elevePanel .eleveActions" ? actions : null)
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
    /* le pas à pas G3 (01/10/2026) : sans plan, le tableau n'est jamais vidé */
    let planG3 = null; const caches = [];
    function enqueteProjectionPasAPas(){ return planG3; }
    function eleveReponseCacher(c){ caches.push(c); }
    /* ordinateur : la question, le tableau et le message s'effacent pendant les étapes */
    const tableaux = [];
    function eleveSchemaTelephone(){ return false; }
    function eleveTableauCacher(c){ tableaux.push(c); }
    /* la place du schéma sur ordinateur (lot G3) se mesure au navigateur : pas ici */
    const reserves = [];
    function eleveSchemaReserverOrdinateur(card){ reserves.push(card); }
    ${fn("eleveProposerSchema")}
    ${fn("eleveVoirSchema")}
    ${fn("eleveSchemaPrecedente")}
    ${fn("eleveSchemaMontrerEtape")}
    ${fn("eleveSchemaBoutons")}
    return { proposer: eleveProposerSchema, voir: eleveVoirSchema, precedente: eleveSchemaPrecedente, dessins, caches, tableaux, avecPlan: () => { planG3 = { etapes: [] }; }, etape: () => eleveSchemaEtape, monde2: () => { eleveSerie[0] = { family: "N" }; } };
  `)(document);
  const par = (id) => boutons.find((b) => b.id === id) || null;
  return { ctx, boutons, valider, suivant, par, document };
}

test("après validation : un bouton jaune « Voir la correction » (ex-« Voir le schéma »), une seule fois, pour l'Enquête seulement", () => {
  const h = harnaisSchema();
  h.ctx.proposer(h.valider);
  h.ctx.proposer(h.valider);
  assert.equal(h.boutons.length, 1, "un seul bouton même si on le propose deux fois (réussite puis réponse montrée)");
  assert.equal(h.boutons[0].id, "eleveSchema");
  assert.equal(h.boutons[0].className, "secondaire", "le jaune de « Voir la réponse »");
  assert.equal(h.boutons[0].textContent, "Voir la correction");
  assert.equal(h.boutons[0].type, "button");
  assert.equal(h.valider.hidden, true, "le Valider éteint s'efface");
  const m = harnaisSchema(); m.ctx.monde2(); m.ctx.proposer(m.valider);
  assert.equal(m.boutons.length, 0, "rien pour une carte du monde 2");
  assert.notEqual(m.valider.hidden, true, "et son Valider reste");
  // proposé après la réussite ET après « Voir la réponse »
  assert.match(fn("eleveValiderSplat"), /eleveDevoilerTache\(\);\n    eleveProposerSchema\(bouton\);/);
  assert.match(fn("eleveMontrerReponse"), /bouton\.hidden = true;[^\n]*\n  eleveProposerSchema\(bouton\);/);
});

test("3 essais, puis la réponse (05/10/2026, mondes 1 à 4) : à la 3e erreur la réponse s'écrit, plus de Valider ; l'Enquête et le Système proposent ensuite « Voir la correction »", () => {
  const v = fn("eleveValiderSplat");
  const faux = v.slice(v.indexOf("}else{"));
  assert.match(faux, /eleveEchecs\+\+;\n[\s\S]*?if\(eleveEchecs >= ELEVE_ECHECS_MAX\)\{ eleveMontrerReponse\(\); return; \}\n    msg\.textContent = "Pas encore\\u2026 corrige ce qui est en rouge et revalide !";/);
  assert.doesNotMatch(html, /eleveVoir\b|eleveMontrerCorrection|ou regarde la correction/, "plus de bouton « Voir la réponse » ni de 3e message");
  assert.match(html, /const ELEVE_ECHECS_MAX = 3,/);
  /* la réponse : rangée dans les cases, carte rouge, plus de Valider (caché, pas retiré : le pavé le lit) */
  const r = fn("eleveMontrerReponse");
  assert.match(r, /^function eleveMontrerReponse\(\)\{/);
  assert.match(r, /msg\.textContent = "Voil\\u00e0 la r\\u00e9ponse\. Tu rejoueras cette carte \\u00e0 la fin\.";/);
  assert.match(r, /eleveResultats\[eleveIdx\] = "ko";/);
  assert.match(r, /bouton\.disabled = true;\n  bouton\.hidden = true;/);
  assert.doesNotMatch(r, /eleveVoirSchema\(\)/, "la correction ne démarre plus seule : l'élève l'ouvre s'il veut");
  /* une carte juste : le Valider s'efface aussi (il restait éteint aux mondes 1-2 sur ordinateur) */
  const juste = v.slice(v.indexOf("if(toutJuste){"), v.indexOf("}else{"));
  assert.match(juste, /bouton\.disabled = true;\n[\s\S]*?bouton\.hidden = true;/);
  /* qui a une correction : la carte a un tableau (Enquête, Système) et des étapes */
  const a = new Function(`
    function eleveInfosTableau(c){ return c.tableau ? {} : null; }
    function eleveSchemaEtapes(c){ return c.etapes; }
    ${fn("eleveCorrectionPasAPas")} return eleveCorrectionPasAPas;`)();
  assert.equal(a({ tableau: true, etapes: 5 }), true);
  assert.equal(a({ tableau: false, etapes: 5 }), false, "mondes 1, 2 : pas de correction");
  assert.equal(a(null), false);
  /* la case des jetons visibles devient rouge comme les taches (02/10/2026), et plus de case « active » sur une carte finie */
  assert.match(feuille, /\.eleveCase\.blanche input\.eleveChamp\{color:#1d4ed8\}\n[\s\S]*?\.eleveCase\.blanche\.montre input\.eleveChamp\{color:#b91c1c\}/, "la règle rouge APRÈS la règle bleue");
  assert.match(html, /body\.eleve-pave #elevePanel\.avecSchema \.eleveCase\.mg-pave-case-active\{box-shadow:none\}/);
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
  assert.equal(h.par("eleveSchema"), bouton, "toujours là avant la dernière étape");
  bouton.onclick();
  assert.deepEqual(h.ctx.dessins, [1, 2, 3]);
  assert.equal(h.par("eleveSchema"), null, "effacé aux calculs");
  assert.equal(h.suivant.focalise, 1, "Entrée enchaîne sur la carte suivante");
  assert.deepEqual(h.ctx.caches, [], "sans pas à pas, le tableau garde la réponse");
  h.ctx.voir();
  assert.equal(h.ctx.etape(), 3, "un appui de plus ne dépasse pas les calculs");
  assert.deepEqual(h.ctx.dessins, [1, 2, 3]);
  // le nombre d'étapes vient de la correction en barres : 3 avec un total, 2 sans (enqueteNbEtapes)
  assert.match(fn("eleveSchemaEtapes"), /card\.family === "C"\) \? enqueteDerniereEtape\(card\)/);
  assert.match(fn("enqueteNbEtapes"), /return card\._rel\.sansTotal \? 2 : 3;/);
});

test("« ◀ » (03/10/2026) : sa place est prise dès la 1re étape, il se montre à la 2e, reste à la dernière, et ramène une étape en arrière jusqu'à la 1re", () => {
  const h = harnaisSchema();
  h.ctx.avecPlan();
  h.ctx.proposer(h.valider);
  const bouton = h.boutons[0];
  assert.equal(h.par("eleveSchemaPrec"), null, "pas de ◀ avant le pas à pas (« Voir la correction »)");
  bouton.onclick();
  const prec = h.par("eleveSchemaPrec");
  assert.ok(prec, "◀ créé à la 1re étape");
  assert.equal(prec.textContent, "◀");
  assert.equal(prec.className, "secondaire precedent");
  assert.equal(prec["aria-label"], "Étape précédente");
  assert.ok(prec.classes.has("cache") && prec.disabled, "1re étape : invisible (sa place reste) et inactif");
  assert.deepEqual(h.boutons.map((b) => b.id), ["eleveSchemaPrec", "eleveSchema"], "à gauche de « Étape suivante »");
  bouton.onclick();
  assert.ok(!prec.classes.has("cache") && !prec.disabled, "2e étape : visible");
  bouton.onclick();
  assert.equal(h.par("eleveSchema"), null);
  assert.equal(h.par("eleveSchemaPrec"), prec, "dernière étape : ◀ reste");
  assert.deepEqual(h.ctx.caches, [true, true, false], "la réponse revient au dernier appui");
  prec.onclick();
  assert.equal(h.ctx.etape(), 2);
  assert.deepEqual(h.ctx.dessins, [1, 2, 3, 2], "l'étape d'avant est redessinée");
  assert.deepEqual(h.ctx.caches, [true, true, false, true], "en revenant, la réponse est recachée");
  const revenu = h.par("eleveSchema");
  assert.ok(revenu, "« Étape suivante » revient");
  assert.equal(revenu.textContent, "Étape suivante ▶");
  assert.deepEqual(h.boutons.map((b) => b.id), ["eleveSchemaPrec", "eleveSchema"]);
  prec.onclick();
  assert.equal(h.ctx.etape(), 1);
  assert.ok(prec.classes.has("cache") && prec.disabled, "retour à la 1re étape : ◀ s'efface");
  h.ctx.precedente();
  assert.equal(h.ctx.etape(), 1, "jamais avant la 1re étape");
  assert.deepEqual(h.ctx.dessins, [1, 2, 3, 2, 1]);
  revenu.onclick(); revenu.onclick();
  assert.equal(h.ctx.etape(), 3, "et on repart en avant jusqu'au bout");
  assert.equal(h.par("eleveSchema"), null);
  assert.match(feuille, /#elevePanel\.avecSchema \.eleveActions button\.precedent\{flex:0 0 auto;min-width:52px;max-width:none;/, "au téléphone, ◀ n'est pas étiré comme les deux autres");
  assert.match(feuille, /#elevePanel \.eleveActions button\.precedent\.cache\{visibility:hidden\}/);
});

test("pas à pas G3 (01/10/2026) : le tableau est vidé jusqu'à l'avant-dernier appui, la réponse revient au dernier", () => {
  const h = harnaisSchema();
  h.ctx.avecPlan();
  h.ctx.proposer(h.valider);
  const bouton = h.boutons[0];
  bouton.onclick(); bouton.onclick(); bouton.onclick();
  assert.deepEqual(h.ctx.caches, [true, true, false]);
  assert.deepEqual(h.ctx.tableaux, [true, true, true], "ordinateur : le tableau reste effacé jusqu'au bout, « Je réponds » garde la place (02/10)");
  assert.match(feuille, /#elevePanel\.tableauCacheTel \.eleveDiag\{visibility:hidden\}/, "téléphone : plus de « ? » pendant les étapes");
  /* la valeur tapée est mise de côté, puis remise ; les cases redeviennent grises */
  const cases = [{ value: "12", attrs: {} }, { value: "7", attrs: {} }].map((inp) => Object.assign(inp, {
    hasAttribute: (k) => k in inp.attrs, getAttribute: (k) => inp.attrs[k], setAttribute: (k, v) => { inp.attrs[k] = String(v); }, removeAttribute: (k) => { delete inp.attrs[k]; } }));
  const classes = new Set();
  const panneau = { classList: { toggle: (k, v) => (v ? classes.add(k) : classes.delete(k)) }, querySelectorAll: (sel) => (sel === ".eleveCase[data-attendu] .eleveChamp" ? cases : []) };
  const cacher = new Function("document", `function eleveCopiesSynchroniser(){}\n${fn("eleveReponseCacher")} return eleveReponseCacher;`)({ getElementById: (id) => (id === "elevePanel" ? panneau : null) });
  cacher(true); cacher(true);
  assert.deepEqual(cases.map((c) => c.value), ["", ""], "le « ? » revient");
  assert.ok(classes.has("reponseCachee"));
  cacher(false);
  assert.deepEqual(cases.map((c) => c.value), ["12", "7"], "deux appuis cachés de suite ne perdent pas la réponse");
  assert.ok(!classes.has("reponseCachee"));
  assert.match(feuille, /#elevePanel\.reponseCachee \.eleveCase\.grise\{background:#d4deea !important\}/);
  assert.match(feuille, /#elevePanel\.tableauCache \.eleveConsigne, #elevePanel\.tableauCache \.eleveDiag, #elevePanel\.tableauCache \.eleveMsg\{display:none\}/);
  /* la hauteur rendue par le tableau passe au dessin, et lui est reprise au dernier appui : les boutons ne bougent pas */
  const plateau = { attrs: {}, h: 410, style: {}, getBoundingClientRect(){ return { height: this.h }; },
    setAttribute(k, v){ this.attrs[k] = String(v); }, getAttribute(k){ return this.attrs[k] ?? null; }, removeAttribute(k){ delete this.attrs[k]; } };
  const cls = new Set(); let haut = 685;
  const pan = { classList: { contains: (k) => cls.has(k), add: (k) => { cls.add(k); haut = 485; }, remove: (k) => { cls.delete(k); haut = 685; } } };
  const actions = { getBoundingClientRect: () => ({ top: haut }) };
  const tab = new Function("document", `${fn("eleveTableauCacher")} return eleveTableauCacher;`)({
    getElementById: (id) => ({ elevePanel: pan, svgWrap: plateau })[id] || null, querySelector: (sel) => (sel === "#elevePanel .eleveActions" ? actions : null) });
  tab(true);
  assert.equal(plateau.style.height, "610px", "410 + les 200 px rendus par le tableau");
  plateau.h = 610; tab(true);
  assert.equal(plateau.style.height, "610px", "deux fois de suite : pas deux fois le gain");
  tab(false);
  assert.equal(plateau.style.height, "410px");
  assert.ok(!cls.has("tableauCache"));
  /* « Je vérifie » : la réponse et la vérification, sans le rappel en gris (01/10/2026), partout à l'écran */
  assert.match(html, /const ENQ_G3_RAPPEL = false;/);
  assert.match(html, /const lignes = ENQ_G3_RAPPEL \? modele\.calculs : \[\];/);
  /* ordinateur : une zone fixe sous le bandeau, chaque cadre y prend la plus grande taille qui tient */
  /* … à l'échelle de la carte (03/10/2026) ; repli : la plus grande taille qui tient pour ce cadre */
  assert.match(fn("eleveG3Zone"), /const fCarte = card && eleveG3Echelle && eleveG3Echelle\.card === card \? eleveG3Echelle\.f : null;\n    const f = fCarte \|\| Math\.min\(ELEVE_G3_ZONE_H \/ bd\.height, ELEVE_G3_ZONE_L \/ bd\.width\);/);
  /* les taches : couvertes pendant le pas à pas, dévoilées au dernier appui (renderCard) */
  assert.match(html, /const eleveCacheG3 = eleveDevoileC && revealState > 0 && revealState < enqueteDerniereEtape\(card\) && !!enqueteProjectionPasAPas\(card\);/);
  assert.match(html, /\(\(revealState >= enqueteDerniereEtape\(card\) \|\| \(eleveDevoileC && !eleveCacheG3\)\) \? 2 : 0\)/);
});

test("une seule échelle par carte (03/10/2026) : celle du cadre le plus grand, mesurée une fois, remesurée pour une autre carte", () => {
  /* trois cadres : 1000 × 280, 1000 × 400 (le plus haut), 1000 × 350 ; zone 560 × 2400 → 560 / 400 = 1,4 */
  const tailles = { 1: { width: 1000, height: 280 }, 2: { width: 1000, height: 400 }, 3: { width: 1000, height: 350 } };
  const svg = {};
  let courant = 0;
  const dessin = { parentNode: svg, removeAttribute(){}, getBBox: () => ({ x: 0, y: 0, ...tailles[courant] }) };
  const document = { getElementById: (id) => (id === "enqueteBarres" ? dessin : null) };
  const o = new Function("document", "svg", `
    ${constLine("const ELEVE_G3_BANDEAU = ")}
    const ENQ_PROJ_IDS = ["enqueteBarres"];
    const rendus = [];
    function eleveSchemaEtapes(){ return 3; }
    function renderCard(card, e){ rendus.push(e); }
    function enqueteProjectionCadrer(card, e){ document.courant(e); }
    ${constLine("let eleveG3Echelle = ")}
    ${fn("eleveG3EchelleCarte")}
    return { echelle: eleveG3EchelleCarte, rendus };
  `)(Object.assign(document, { courant: (e) => { courant = e; } }), svg);
  const carte = {}, autre = {};
  assert.equal(o.echelle(carte), 1.4);
  assert.deepEqual(o.rendus, [1, 2, 3], "chaque étape mesurée une fois");
  assert.equal(o.echelle(carte), 1.4);
  assert.deepEqual(o.rendus, [1, 2, 3], "en mémoire pour la même carte");
  tailles[2] = { width: 1000, height: 200 };
  assert.equal(o.echelle(autre), 1.6, "une autre carte : remesurée (le plus haut est maintenant 350 : 560 / 350)");
  assert.deepEqual(o.rendus, [1, 2, 3, 1, 2, 3]);
});

test("les étapes sont celles de la projection, et la nouvelle carte repart du plateau couvert", () => {
  assert.match(fn("eleveDessinerSchema"), /eleveRendreEtape\(card, eleveSchemaEtape\);\n  if\(eleveSchemaCadreUnique\(card\)\) eleveCadrerSchemaSys\(card\); else eleveCadrerScene\(\);/);
  /* ordinateur, pas à pas G3 : la mise en page de la projection (bandeau), un seul cadrage pour la carte */
  assert.match(fn("eleveRendreEtape"), /const g3 = e > 0 && card && card\.family === "C" && !!enqueteProjectionPasAPas\(card\);\n  if\(g3\) eleveG3EchelleCarte\(card\);[^\n]*\n  renderCard\(card, e\);\n  if\(g3\)\{\n    enqueteProjectionCadrer\(card, e\);\n    eleveG3Zone\(card\);/);
  assert.match(fn("eleveSchemaCadreUnique"), /return sysAPlan\(card\) \|\| \(!!card && card\.family === "C" && !!enqueteProjectionPasAPas\(card\)\);/);
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
      function eleveRendreEtape(){}
      function eleveSchemaCadreUnique(){ return false; }
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
    function eleveSchemaCadreUnique(){ return false; }
    function eleveRendreEtape(card, e){ renderCard(card, e); }
    function enqueteDerniereEtape(card){ return 3; }
    ${constLine("const ELEVE_SCHEMA_ETAPES = ").replace("const ELEVE_SCHEMA_ETAPES", "const _dup")}
    ${fn("eleveSchemaEtapes")}
    ${fn("eleveSchemaTelephone")}
    ${fn("eleveSchemaTelRendre")}
    ${fn("eleveDessinerSchema")}
    ${fn("enqueteSansCase")}
    ${fn("eleveRappelHtml")}
    ${fn("eleveRappelAfficher")}
    ${constLine("const ELEVE_RAPPEL_PLATEAU_MARGE = ")}
    ${fn("eleveRappelPlateau")}
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
  assert.match(fn("renderEleveSplat"), /  eleveSchemaReinitialiser\(\);[^\n]*\n  panneau\.classList\.remove\("avecSchema", "tableauCache", "tableauCacheTel"\);/);
  assert.match(fn("renderEleveFinSplat"), /renderCard\(eleveSerie\[total - 1\], 0\);\n  eleveCadrerScene\(\);/);
  // l'appareil tourné (plus de 600 px) : l'étape suivante quitte le portrait
  assert.match(fn("eleveDessinerSchema"), /if\(plateau && plateau\.classList\.contains\("eleveSchemaTel"\)\) eleveSchemaReinitialiser\(\);\n  eleveRendreEtape\(card, eleveSchemaEtape\);/);
});

test("le bandeau : la case TOTAL puis la ou les phrases d'indice, texte échappé", () => {
  const rappel = new Function(`${fn("enqueteSansCase")} ${fn("eleveRappelHtml")} return eleveRappelHtml;`)();
  const h = rappel({ total: 38, _inv: { indices: ["Sous la tache noire, il y a 12 jetons de plus que sous la tache bleue.", [{ type: "splat" }], "A < B & C"] } });
  assert.equal(h, '<div class="eleveRappelTotal"><span>TOTAL</span><b>38</b></div>' +
    '<div class="eleveRappelIndices"><p>Sous la tache noire, il y a 12 jetons de plus que sous la tache bleue.</p><p>A &lt; B &amp; C</p></div>',
    "seules les phrases (pas les indices en symboles), dans l'ordre");
  assert.equal(rappel({ total: 5 }), '<div class="eleveRappelTotal"><span>TOTAL</span><b>5</b></div><div class="eleveRappelIndices"></div>');
  // (08/10/2026) une carte de l'Enquête sans total n'a PAS DE CASE : ni « TOTAL ? » ni « PAS DE
  // TOTAL », seulement ses phrases (le petit plateau, ajouté ensuite, se centre seul)
  assert.equal(rappel({ family: "C", total: 48, _rel: { sansTotal: true }, _inv: { indices: ["A"] } }),
    '<div class="eleveRappelIndices"><p>A</p></div>');
  // le « ? » gris ardoise du TOTAL caché n'a plus lieu d'être en mode élève (ni bandeau, ni tableau)
  const r = regles(feuille);
  assert.ok(!r.some((x) => /b\.inconnu|#elevePanel\.sansTotal|\.pasDe/.test(x.sel)), "plus de règle pour « TOTAL ? » ni « PAS DE TOTAL »");
  assert.doesNotMatch(fn("renderEleveSplat"), /classList\.toggle\("sansTotal"/);
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
  assert.match(fn("renderEleveSplat"), /panneau\.classList\.remove\("avecSchema", "tableauCache", "tableauCacheTel"\);/);
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
  assert.match(r, /const phrasesEleve = \(typeof eleveActif !== "undefined" && eleveActif && !telEleve && !g3Eleve && isCRelationLayout/,
    "la projection ne change pas ; le téléphone a son bandeau ; le pas à pas G3 a celui de la projection");
  assert.match(r, /const g3Eleve = revealState > 0 && card\.family === "C" && !!enqueteProjectionPasAPas\(card\);/);
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
  assert.equal(decl("#elevePanel.enquete .eleveDiag.vraies .ligneBas .eleveCase"), "min-width:min(72px, calc(100% / var(--n, 1)))",
    "un minimum pour lire le nom et le nombre, sans déborder du tableau (jusqu'à 7 cases, 03/10/2026)");
});

// --- le dévoilement et le nom sur la tache ---------------------------------------------------
test("Enquête : le dévoilement redessine la carte (chaque tache a sa couleur), le monde 2 garde son geste", () => {
  const src = fn("eleveDevoilerTache");
  assert.match(src, /if\(\(p\.getAttribute\("fill"\) \|\| ""\) === "var\(--splat-cover\)"\) p\.classList\.add\("eleveDevoile"\);/, "le geste du monde 2 est intact");
  assert.match(src, /if\(card && eleveInfosTableau\(card\)\)\{[^\n]*\n    eleveEnqueteDevoile = true;\n    renderCard\(card, eleveSchemaEtape\);\n    eleveCadrerScene\(\);/);
  const rendu = fn("renderCard");
  assert.match(rendu, /const eleveDevoileC = \(card\.family === "C"\) && typeof eleveEnqueteDevoile !== "undefined" && !!eleveEnqueteDevoile;/);
  // taches dévoilées au 5e clic ; au 4e pour une carte « sans total » (lot E-sans-total : le 5e y est la vérification)
  /* pas à pas G3 (01/10/2026) : couvertes du premier à l'avant-dernier appui, dévoilées (avec le fondu) au dernier */
  assert.match(rendu, /const visualRevealState = \(card\.family === "C"\) \? \(\(revealState >= enqueteDerniereEtape\(card\) \|\| \(eleveDevoileC && !eleveCacheG3\)\) \? 2 : 0\)/);
  assert.match(rendu, /const fonduCouverture = !\(eleveDevoileC && revealState > 0\) \|\| \(eleveDevoileC && revealState >= enqueteDerniereEtape\(card\) && !!enqueteProjectionPasAPas\(card\)\);/, "le fondu de la couverture ne rejoue pas à chaque étape du schéma, sauf au dévoilement du pas à pas");
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
  assert.match(decl(".eleveCase.blanche.donnee .eleveTacheNom, .ligneBas .eleveCase.blanche .eleveTacheNom"), /#1d4ed8/, "« visibles » en bleu");
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

test("téléphone, pendant les étapes : le petit plateau du bandeau (02/10/2026)", () => {
  const dessiner = fn("eleveDessinerSchema");
  assert.match(dessiner, /const h = eleveSchemaTelRendre\(card, eleveSchemaEtape, largeur\);\s*eleveRappelPlateau\(\);/, "le petit plateau est recopié après le rendu de l'étape, avant la mesure des boutons");
  const f = fn("eleveRappelPlateau");
  assert.match(f, /getElementById\("relationTrayScale"\)/);
  assert.match(f, /cloneNode\(true\)/);
  assert.match(f, /querySelectorAll\("\[id\]"\)\.forEach\(n => n\.removeAttribute\("id"\)\)/, "pas d'identifiant en double");
  assert.match(html, /#eleveRappel\.avecPlateau \.eleveRappelIndices\{order:-1;flex:1 1 100%\}/, "les phrases en haut, comme sur la question");
  assert.match(html, /#eleveRappel\.avecPlateau\{flex-wrap:wrap;justify-content:center;row-gap:6px\}/);
  assert.match(html, /#eleveRappel\{display:flex;align-items:center;gap:12px/, "12 px entre le plateau et le TOTAL");
});

test("téléphone : la case vide du total reste dans le cadre (02/10/2026)", () => {
  const acc = fn("enqueteAccolade");
  assert.match(acc, /function enqueteAccolade\(g, x, y1, y2, P, label, vide, droiteMax\)/);
  assert.match(acc, /const place = Number\.isFinite\(droiteMax\) \? Math\.max\(0, droiteMax - \(x \+ w \+ P\.braceGap\)\) : 1e9;/);
  assert.match(acc, /enqueteLargeurCaseVide\(label, P\.totalFont, P, place\)/);
  assert.match(fn("drawEnqueteBarres"), /enqueteAccolade\(g, xMax \+ P\.braceGap, rowsTop, rowsBottom, P, M\.totalTxt, !!modele\.vide, P\.portrait \? x0 \+ largeur : undefined\)/, "au téléphone seulement : papier, projection et ordinateur ne bougent pas");
});
