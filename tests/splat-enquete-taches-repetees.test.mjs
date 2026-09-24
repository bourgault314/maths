/* SPLAT! Enquête — lot E-repet (23/09/2026), case « Taches répétées » (adresse repeat=2 ou 3).
   Une même couleur peut être plusieurs fois sur le plateau (au moins une l'est, 6 taches au
   plus) ; les indices comparent des couleurs (« Sous une tache rouge, il y a 4 jetons de plus
   que sous une tache violette. ») ; la correction a une ligne par tache dans le schéma rempli,
   une accolade « 3 violettes » par couleur dans le schéma regroupé, et « 5 × ? + 8 = 43 ».
   Ces tests exécutent les fonctions de outils/splat.html telles quelles (extraites du
   fichier) :
   - case décochée (le défaut), genInvestigate donne EXACTEMENT les mêmes cartes et consomme
     exactement le même hasard qu'avant le lot (empreinte relevée sur main = 17cae13, la même
     que celle du lot E-sans-total) ;
   - case cochée : des milliers de cartes justes (couleurs répétées, même nombre sous une même
     couleur, solution unique et positive, bornes, 6 taches au plus, aucun nombre à
     sous-entendu, schéma en cases positives) ;
   - l'adresse, l'ordre des lignes du schéma, les accolades par couleur, la ligne réponse, le
     mode élève (une case par couleur), la règle écrite, la correction imprimée. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
const PALETTE = html.slice(html.indexOf("const INVESTIGATE_COLOR_PALETTE = ["), html.indexOf("];", html.indexOf("const INVESTIGATE_COLOR_PALETTE = [")) + 2);

/* genInvestigate lit ses réglages dans la page : on lui donne de faux contrôles. */
const tirer = new Function("invTaskCountEl", "invClueTypeEl", "invStructure3El", "invOpMulEl", "invOpDivEl", "invOpAddEl", "invOpSubEl",
  "invMaxAddEl", "invVisibleMinEl", "invVisibleMaxEl", "invTotalMinEl", "invTotalMaxEl", "invNoTotalEl", "invRepeatOnEl", "invRepeatEl",
  "activityEl", "investigatePaletteKeys", `
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const INVESTIGATE_REPEAT_MAX = ")}
  ${ligne("const INVESTIGATE_REPEAT_TACHES_MAX = ")}
  ${ligne("const SYS_NOMBRES_SOUS_ENTENDUS = ")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("buildInvestigateColorMap")}
  ${fn("sysNombreSousEntendu")}
  ${fn("genInvestigate")}
  return (reglages, graine, n) => {
    const r = Object.assign({ splats:"2", clues:"SENTENCE", structure:"MIX", mul:true, div:true, add:true, sub:true,
      deltaMax:20, visibleMin:0, visibleMax:3, totalMin:20, totalMax:100 }, reglages);
    invTaskCountEl = { value:String(r.splats) }; invClueTypeEl = { value:r.clues }; invStructure3El = { value:r.structure };
    invOpMulEl = { checked:r.mul }; invOpDivEl = { checked:r.div }; invOpAddEl = { checked:r.add }; invOpSubEl = { checked:r.sub };
    invMaxAddEl = { value:String(r.deltaMax) }; invVisibleMinEl = { value:String(r.visibleMin) }; invVisibleMaxEl = { value:String(r.visibleMax) };
    invTotalMinEl = { value:String(r.totalMin) }; invTotalMaxEl = { value:String(r.totalMax) };
    invNoTotalEl = ("noTotal" in r) ? { checked:r.noTotal } : null;
    invRepeatOnEl = ("repeat" in r) ? { checked:r.repeat > 1 } : null;
    invRepeatEl = ("repeat" in r) ? { value:String(r.repeat) } : null;
    const rng = mulberry32(graine | 0);
    let appels = 0;
    const compte = () => { appels++; return rng(); };
    const cartes = [];
    for(let i = 0; i < n; i++) cartes.push(genInvestigate(compte));
    return { cartes, appels };
  };`)(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, { value:"C" }, null);

const empreinte = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex").slice(0, 16);
/* Les places des taches du plateau bas, telles que la page les dessine (table de dessin). */
const PLACES = new Function(`
  ${fn("getTrayConfig")}
  ${fn("getNumberedSplatsLegacy")}
  ${fn("getNumberedSplats")}
  const out = {};
  for(const n of [3, 4, 5, 6]) out[n] = getNumberedSplats(n, "C").map(s => [s.cx, s.cy]);
  return out;
`)();
const INTERDITS = ["69", "88", "420", "666", "1488"];
const sousEntendu = (n) => INTERDITS.some(x => String(n).includes(x));

// --- case décochée : rien ne bouge ---------------------------------------------------------
/* Les cinq jeux de réglages du lot E-sans-total (défaut 2 et 3 taches, réglages des fiches 10,
   14 et 19), 1 200 cartes d'affilée : l'empreinte de main (valeurs, indices, modèle _rel,
   couleurs et nombre de tirages au hasard) ne bouge pas. */
const JEUX = [
  [{}, 5, 300], [{ splats:"3" }, 8, 300],
  [{ splats:"3", structure:"CHAIN", mul:false, div:false, deltaMax:15, visibleMin:1, visibleMax:3, totalMin:20, totalMax:60 }, 950, 200],
  [{ mul:false, div:false, sub:false, deltaMax:10, visibleMax:0, totalMin:10, totalMax:30 }, 339, 200],
  [{ splats:"3", mul:true, div:true, deltaMax:15, visibleMin:1, visibleMax:3, totalMin:20, totalMax:60 }, 537, 200]
];
const EMPREINTE_MAIN = "de67ae272824270f";

test("case « Taches répétées » décochée : exactement les mêmes cartes et le même hasard qu'avant le lot", () => {
  const sansCase = JEUX.map(([r, g, n]) => tirer(r, g, n));
  const decochee = JEUX.map(([r, g, n]) => tirer({ ...r, repeat:1 }, g, n));
  // « Sans total » cochée, « Taches répétées » décochée : les cartes sans total d'avant
  // (les deux cochées = le mélange du lot E-melange, tests/splat-enquete-melange.test.mjs)
  const avecSansTotal = tirer({ noTotal:true, repeat:1 }, 77, 50);
  assert.equal(empreinte(sansCase), EMPREINTE_MAIN, "page sans la case (ancienne adresse) : cartes de main");
  assert.equal(empreinte(decochee), EMPREINTE_MAIN, "case décochée : cartes de main");
  assert.deepEqual(sansCase.map(x => x.appels), [6220, 14370, 7896, 3345, 13675], "même nombre de tirages au hasard");
  assert.equal(empreinte(avecSansTotal), empreinte(tirer({ noTotal:true }, 77, 50)), "sans total : rien ne change");
  // aucune carte ordinaire ne porte le modèle des taches répétées (le JSON des cartes reste celui d'avant)
  sansCase.forEach(x => x.cartes.forEach(c => assert.ok(!("repetees" in c._rel))));
});

// --- case cochée : des cartes justes -------------------------------------------------------
const REGLAGES = [
  { repeat:3 }, { repeat:2 }, { repeat:3, splats:"3" }, { repeat:2, splats:"3" },
  { repeat:3, mul:false, div:false }, { repeat:3, add:false, sub:false }, { repeat:3, splats:"3", structure:"CHAIN", mul:false, div:false },
  { repeat:3, splats:"3", visibleMin:1, visibleMax:3, totalMin:20, totalMax:60 }, { repeat:3, clues:"SYMBOL" },
  { repeat:2, deltaMax:10, totalMin:10, totalMax:40 }
];

test("case cochée : couleurs répétées, même nombre sous une même couleur, solution unique et positive (20 000 cartes)", () => {
  const vusNombreMax = new Set(), vusTaches = new Set();
  for(const reglages of REGLAGES){
    const r = { deltaMax:20, totalMin:20, totalMax:100, visibleMin:0, visibleMax:3, splats:"2", ...reglages };
    const { cartes } = tirer(reglages, 2026, 2000);
    const vues = new Set();
    for(const c of cartes){
      const R = c._rel;
      assert.ok(R.repetees, "toutes les cartes ont des taches répétées");
      const { couleurDe, nombre } = R.repetees;
      const nC = Number(r.splats);
      assert.equal(nombre.length, nC, "2 ou 3 couleurs, comme le réglage Taches");
      assert.ok(nombre.every(m => m >= 1 && m <= reglages.repeat), "chaque couleur de 1 à « fois max »");
      assert.ok(Math.max(...nombre) >= 2, "au moins une couleur répétée");
      const n = c.hidden.length;
      assert.equal(n, nombre.reduce((a, b) => a + b, 0));
      assert.ok(n >= 3 && n <= 6, "3 à 6 taches");
      vusTaches.add(n); vusNombreMax.add(Math.max(...nombre));
      assert.equal(c._num.tasks, n);
      assert.equal(R.taskCount, n, "le modèle est écrit tache par tache");
      // côte à côte (choix du 23/09), une couleur sur une seule rangée quand elle y tient (24/09) :
      // seul 2 + 2 + 2 sur 6 places (deux rangées de 3) oblige à couper une couleur — alors
      // en colonne, l'une au-dessus de l'autre
      const places = PLACES[n];
      const taille = n === 3 ? 2 : (n === 4 ? 2 : 3);
      const coupees = nombre.map((m, k) => {
        const ys = new Set(couleurDe.map((x, i) => x === k ? places[i][1] : null).filter(y => y !== null));
        return m <= taille && ys.size > 1 ? k : null;
      }).filter(k => k !== null);
      if(nombre.join("+") === "2+2+2"){
        assert.equal(coupees.length, 1, "2 + 2 + 2 : une seule couleur coupée");
        const xs = couleurDe.map((x, i) => x === coupees[0] ? places[i][0] : null).filter(v => v !== null);
        assert.equal(new Set(xs).size, 1, "la couleur coupée est en colonne");
      }else{
        assert.deepEqual(coupees, [], `aucune couleur coupée entre deux rangées (${nombre.join("+")} : ${couleurDe.join("")})`);
      }
      // même couleur = même nombre et même clé de couleur ; deux couleurs = deux nombres
      const valeurCouleur = [], cle = [];
      couleurDe.forEach((k, i) => {
        if(valeurCouleur[k] === undefined){ valeurCouleur[k] = c.hidden[i]; cle[k] = R.colorMap[i]; }
        assert.equal(c.hidden[i], valeurCouleur[k]);
        assert.equal(R.colorMap[i], cle[k]);
        assert.equal(R.hiddenValues[i], c.hidden[i]);
      });
      assert.equal(new Set(cle).size, nC, "des couleurs différentes");
      assert.equal(new Set(valeurCouleur).size, nC, "deux couleurs ne cachent pas le même nombre");
      assert.ok(valeurCouleur.every(v => Number.isInteger(v) && v >= 2), "au moins 2 jetons sous chaque tache");
      // les indices relient la première tache de chaque couleur, et disent vrai
      const premier = nombre.map((_, k) => couleurDe.indexOf(k));
      assert.equal(R.relations.length, nC - 1);
      for(const x of R.relations){
        assert.ok(premier.includes(x.source) && premier.includes(x.target));
        const t = c.hidden[x.target], s = c.hidden[x.source];
        if(x.op === "MUL") assert.equal(t, x.k * s);
        if(x.op === "DIV") assert.equal(t * x.k, s);
        if(x.op === "ADD") assert.equal(t, s + x.k);
        if(x.op === "SUB") assert.equal(t, s - x.k);
      }
      // les opérations cochées sont respectées
      R.relations.forEach(x => assert.ok(r[{ MUL:"mul", DIV:"div", ADD:"add", SUB:"sub" }[x.op]] !== false, x.op));
      // total et bornes
      const visibles = c.visible.reduce((a, b) => a + b, 0);
      assert.equal(c.total, c.hidden.reduce((a, b) => a + b, 0) + visibles);
      assert.ok(c.total >= r.totalMin && c.total <= r.totalMax, `total ${c.total}`);
      assert.ok(c.visible.length >= r.visibleMin && c.visible.length <= r.visibleMax);
      // une seule solution : ramenée à la plus petite tache, chaque tache vaut k × ? + d
      // (k entier ≥ 1, d ≥ 0), et « somme des k × ? + somme des d + visibles = total » donne ? = la plus petite
      const mini = Math.min(...c.hidden);
      const iMin = c.hidden.indexOf(mini);
      const cm = R.affineItems[iMin].coef, dm = R.affineItems[iMin].diff;
      const ramenes = R.affineItems.map(it => ({ k: it.coef / cm, d: it.diff - it.coef * dm / cm }));
      ramenes.forEach((it, i) => {
        assert.ok(Math.abs(it.k - Math.round(it.k)) < 1e-9 && Math.round(it.k) >= 1, "k entier");
        assert.ok(it.d > -1e-9, "écart positif");
        assert.ok(Math.abs(Math.round(it.k) * mini + it.d - c.hidden[i]) < 1e-9, "k × ? + d redonne la tache");
      });
      const K = ramenes.reduce((s, it) => s + Math.round(it.k), 0);
      const D = ramenes.reduce((s, it) => s + it.d, 0);
      assert.ok(Math.abs((c.total - visibles - D) / K - mini) < 1e-9, "5 × ? + 8 = 43 donne ? = la plus petite");
      assert.ok(Math.abs(R.equation.sumCoef * R.equation.unitValue + R.equation.sumDiff - R.hiddenTotal) < 1e-9);
      // aucun nombre à sous-entendu, ni sur la carte ni dans sa correction
      for(const x of [...c.hidden, ...c.visible, c.total, visibles, ...R.relations.map(x => x.k), ...ramenes.map(it => it.d), D, D + visibles, c.total - D - visibles, c.total - visibles]){
        assert.ok(!sousEntendu(Math.round(x)), `nombre à sous-entendu : ${x}`);
      }
      // les phrases : « une tache rouge », et ce que dit le modèle
      if(r.clues !== "SYMBOL"){
        c._inv.indices.forEach((p, i) => {
          assert.equal(p, R.relations[i].clue);
          assert.match(p, /^Sous une tache \S+, il y a \d+ (fois (plus|moins) de jetons|jetons? de (plus|moins)) que sous une tache \S+\.$/);
        });
        R.names.forEach(nm => assert.match(nm, /^une tache \S+$/));
      }else{
        c._inv.indices.forEach((seq, i) => {
          const ids = seq.filter(x => x.type === "splat").map(x => x.id);
          assert.deepEqual(ids, [R.relations[i].target, R.relations[i].source]);
        });
      }
      vues.add(c.hidden.join("/") + "|" + c.total);
    }
    assert.ok(vues.size >= 200, `des cartes variées (${vues.size})`);
  }
  assert.ok(vusNombreMax.has(2) && vusNombreMax.has(3), "2 et 3 fois la même couleur");
  assert.deepEqual([...vusTaches].sort(), [3, 4, 5, 6], "de 3 à 6 taches");
});

test("les places connues du générateur sont celles que la page dessine (plateau bas, 3 à 6 taches)", () => {
  const src = fn("genInvestigate");
  const bloc = src.slice(src.indexOf("const PLACES_PLATEAU = {"), src.indexOf("};", src.indexOf("const PLACES_PLATEAU = {")) + 2);
  const lues = new Function(`${bloc}\nreturn PLACES_PLATEAU;`)();
  assert.deepEqual(lues, PLACES);
});

test("case cochée, réglages impossibles (total max 8) : des cartes, jamais d'erreur", () => {
  const { cartes } = tirer({ repeat:3, totalMin:1, totalMax:8 }, 11, 50);
  assert.equal(cartes.length, 50);
  cartes.forEach(c => assert.equal(c.family, "C"));
});

// --- l'adresse ------------------------------------------------------------------------------
test("adresse : repeat=2 ou 3 lu pour l'Enquête, écrit seulement case cochée, dans l'empreinte élève", () => {
  const noms = JSON.parse(ligne("const sharedNames = ").replace(/^.*= /, "").replace(/;$/, ""));
  const hors = JSON.parse(ligne("const ELEVE_HORS_EMPREINTE = ").replace(/^.*= /, "").replace(/;$/, ""));
  assert.ok(noms.includes("repeat"));
  assert.ok(!hors.includes("repeat"), "la case change les cartes : elle entre dans l'empreinte");
  const lire = new Function(`${ligne("const INVESTIGATE_REPEAT_MAX = ")}\n${ligne("function clamp(")}\n${fn("lireRepetitionAdresse")}\nreturn lireRepetitionAdresse;`)();
  assert.equal(lire(null), 1);
  assert.equal(lire(""), 1);
  assert.equal(lire("x"), 1);
  assert.equal(lire("2"), 2);
  assert.equal(lire("3"), 3);
  assert.equal(lire("9"), 3);
  // absente = case décochée, même pour une partie d'étape composée
  const applique = fn("appliquerConfiguration");
  assert.match(applique, /const repetition = lireRepetitionAdresse\(params\.get\("repeat"\)\);\s*invRepeatOnEl\.checked = repetition > 1;/);
  // les adresses de l'Enquête publiées (fiches 10 à 19) ne changent pas : rien n'est écrit case décochée
  assert.match(fn("buildShareUrl"), /if\(\(act === "C" \|\| act === "CD"\) && invRepeatOnEl && invRepeatOnEl\.checked\) params\.set\("repeat"/);
  assert.doesNotMatch(fn("getClassicShareControls"), /repeat|invRepeat/);
  assert.match(html, /<input type="checkbox" id="invRepeatOn"> <span>Taches répétées<\/span>/);
  assert.doesNotMatch(html, /id="invRepeatOn" checked/, "éteinte par défaut");
  assert.match(html, /<input id="invRepeat" type="number" min="2" max="3" value="3" \/>/, "jusqu'à 3 fois d'office (choix du 23/09)");
  // « Sans total » et « Taches répétées » cochées ensemble : les cartes se mélangent (lot
  // E-melange, 24/09/2026) — aucune des deux ne grise plus l'autre
  const sync = fn("syncSettingsUI");
  assert.doesNotMatch(sync, /invRepeatOnEl\.disabled|invNoTotalEl\.disabled/);
  assert.match(sync, /if\(invRepeatRowEl\) invRepeatRowEl\.style\.display = repetees \? "flex" : "none";/);
});

// --- la correction ----------------------------------------------------------------------------
/* Des cartes réelles, tirées ci-dessus : 2 couleurs (3 bleues + 2 orange…), 3 couleurs à « k × ? ». */
const cartesDessin = tirer({ repeat:3 }, 43, 40).cartes;
const cartes3 = tirer({ repeat:3, splats:"3", visibleMin:1, visibleMax:3 }, 7, 40).cartes;

function fauxDom(){
  const creer = (name, attrs = {}) => ({ name, attrs:{ ...attrs }, children:[], textContent:"",
    appendChild(c){ this.children.push(c); return c; }, setAttribute(k, v){ this.attrs[k] = v; } });
  const tous = (n) => [n, ...n.children.flatMap(tous)];
  return { creer, tous };
}
const dom = fauxDom();
const dessin = new Function("dom", `
  const el = (name, attrs = {}) => dom.creer(name, attrs);
  const text = (x, y, txt, attrs = {}) => { const t = dom.creer("text", { x, y, ...attrs }); t.textContent = txt; return t; };
  const blobPath = () => "M0 0";
  const measureTextWidth = (t, font) => String(t).length * Number(String(font).match(/(\\d+)px/)[1]) * 0.6;
  const taskSplatColor = () => "#000";
  const PLURIEL = { black:"noires", purple:"violettes", orange:"orange", blue:"bleues", green:"vertes", red:"rouges" };
  const MOTS = { black:"noire", purple:"violette", orange:"orange", blue:"bleue", green:"verte", red:"rouge" };
  const investigateColorInfo = (card, i) => ({ key: card._rel.colorMap[i] });
  const investigateColorWord = info => MOTS[info.key];
  const taskShortName = (i, card) => { const m = MOTS[card._rel.colorMap[i]]; return m[0].toUpperCase() + m.slice(1); };
  const SYS_COULEURS_PLURIEL = PLURIEL;
  const getNumberedDisplayVarChar = () => "?";
  ${fn("sumArray")}
  ${fn("formatRelationNumber")}
  ${fn("formatCoeffUnknownTerm")}
  ${fn("pastilleTextDy")}
  ${ligne("const RELATION_MAX_UNIT_CELLS = ")}
  ${ligne("const RELATION_PORTRAIT = ")}
  ${fn("enqueteNomCouleurCompte")}
  ${fn("relationModelKind")}
  ${fn("relationUnitValue")}
  ${fn("positiveBarItemsForRelation")}
  ${fn("relationReferenceIndex")}
  ${fn("relationDisplayOrder")}
  ${fn("relationTotalsForBarModel")}
  ${fn("drawRightTotalBrace")}
  ${fn("relationPortraitTete")}
  ${fn("getRelationSchemaLayout")}
  ${fn("getRelationDrawingMetrics")}
  ${fn("getRelationGroupedParts")}
  ${fn("drawBarCell")}
  ${fn("drawRelationSituationSchema")}
  ${fn("getRelationGroupedDisplayGroups")}
  ${fn("relationPartNumberValue")}
  ${fn("relationGroupedEquationLine")}
  ${fn("drawRelationAnswerLine")}
  ${fn("eleveInfosEnquete")}
  return { ordre: relationDisplayOrder, groupes: getRelationGroupedDisplayGroups, equation: relationGroupedEquationLine,
           situation: drawRelationSituationSchema, reponse: drawRelationAnswerLine, eleve: eleveInfosEnquete, barre: drawBarCell };
`)(dom);
const cadre = (draw, card, opts) => { const g = dom.creer("g"); const h = draw(g, card, opts); return { g, h, tous: dom.tous(g) }; };
const textes = (tous) => tous.filter(n => n.name === "text").map(n => n.textContent);

test("schéma rempli : une ligne par tache, la couleur de référence d'abord puis couleur après couleur, un écart entre les lignes", () => {
  for(const c of [...cartesDessin, ...cartes3]){
    const { couleurDe } = c._rel.repetees;
    const ordre = dessin.ordre(c);
    assert.equal(ordre.length, c.hidden.length, "une ligne par tache");
    assert.equal(c.hidden[ordre[0]], Math.min(...c.hidden), "la référence (la plus petite) en premier");
    // les taches d'une même couleur se suivent
    const suite = ordre.map(i => couleurDe[i]);
    suite.forEach((k, j) => { if(j > 0 && k !== suite[j - 1]) assert.ok(!suite.slice(0, j).includes(k), "une couleur n'est pas coupée en deux"); });
    const { tous, h } = cadre(dessin.situation, c, { filled:true });
    const noms = textes(tous).filter(t => /^[A-Z][a-z]+$/.test(t));
    assert.equal(noms.length, c.hidden.length);
    // la scène de projection (1000) et la place sous le plateau : 7 lignes au plus (6 taches + visibles)
    assert.ok(620 + h <= 988, `cadre de ${h} : il tient sous le plateau`);
    const lignes = [...new Set(tous.filter(n => n.name === "rect" && n.attrs.rx === 0).map(n => n.attrs.y))].sort((a, b) => a - b);
    const hauteur = tous.find(n => n.name === "rect" && n.attrs.rx === 0).attrs.height;
    lignes.forEach((y, j) => { if(j > 0) assert.ok(y - lignes[j - 1] - hauteur >= 9, "des lignes qui ne se touchent pas"); });
    // en portrait (téléphone), les lignes gardent leur hauteur
    const portrait = cadre(dessin.situation, c, { filled:true, portrait:true });
    const hp = portrait.tous.find(n => n.name === "rect" && n.attrs.rx === 0).attrs.height;
    assert.ok(hp >= 52, "portrait : lignes de 52 au moins");
  }
});

test("schéma regroupé : une accolade par couleur (« 3 bleues »), « k × ? » d'une même couleur réunis, l'équation suit le tableau", () => {
  const c = cartesDessin.find(x => x._rel.repetees.nombre.join("+") === "2+3" && x._rel.relations[0].op === "ADD");
  assert.ok(c, "une carte à 2 + 3 taches, « de plus »");
  const g = dessin.groupes(c);
  const taches = g.groups.filter(gr => gr.splatIndex != null);
  assert.equal(taches.length, 2, "deux accolades, une par couleur");
  taches.forEach(gr => assert.match(gr.label, /^[23] \S+s$|^[23] orange$/));
  assert.equal(g.parts.filter(p => p.kind === "x").length, 5, "cinq cases ?");
  const eq = dessin.equation(c, g);
  assert.equal(eq.right, String(c.total));
  // une couleur seule garde son nom
  const seule = cartesDessin.find(x => x._rel.repetees.nombre.includes(1));
  assert.ok(dessin.groupes(seule).groups.some(gr => gr.count === 1 && /^[A-Z]/.test(gr.label)));
  // plus de 8 cases : « 3 × ? » + « 3 × ? » + « 3 × ? » d'une couleur → une case « 9 × ? »
  const regroupee = cartes3.find(x => { const it = dessin.groupes(x).totals.items; return it.reduce((s, i) => s + Math.round(i.coef), 0) > 8; });
  assert.ok(regroupee, "une carte à plus de 8 cases ?");
  const gg = dessin.groupes(regroupee);
  gg.groups.filter(gr => gr.splatIndex != null).forEach(gr => {
    const xs = gr.parts.filter(p => p.kind === "x");
    xs.forEach((p, j) => { if(j > 0) assert.notEqual(gr.parts[gr.parts.indexOf(p) - 1].kind, "x", "deux cases ? voisines d'une couleur sont réunies"); });
  });
  const somme = gg.parts.filter(p => p.kind === "x").reduce((s, p) => s + (Number(p.coef) || 1), 0);
  assert.equal(somme, Math.round(gg.totals.sumCoef), "toujours le même nombre de ? au total");
});

test("case « k × ? » étroite : la police se réduit pour que le texte tienne (taches répétées seulement)", () => {
  const g = dom.creer("g");
  dessin.barre(g, 0, 0, 60, 72, { kind:"x", label:"3 × ?" }, true, { fontSize:37, ajuster:true });
  const fs = g.children.find(n => n.name === "text").attrs["font-size"];
  assert.ok("3 × ?".length * fs * 0.6 <= 50, `police ${fs}`);
  const g2 = dom.creer("g");
  dessin.barre(g2, 0, 0, 60, 72, { kind:"x", label:"3 × ?" }, true, { fontSize:37 });
  assert.equal(g2.children.find(n => n.name === "text").attrs["font-size"], 37, "sans l'option, rien ne change");
});

test("ligne réponse : une fois par couleur (« bleue = 6   noire = 11 »)", () => {
  for(const c of [...cartesDessin.slice(0, 10), ...cartes3.slice(0, 10)]){
    const g = dom.creer("g");
    dessin.reponse(g, c, 0, 1200, 0, { f:x => x, v:x => x });
    const lignes = textes(dom.tous(g));
    assert.equal(lignes.length, c._rel.repetees.nombre.length);
    lignes.forEach(t => assert.match(t, /^\S+ = \d+$/));
    assert.equal(new Set(lignes).size, lignes.length);
  }
});

test("mode élève : une case par couleur (choix du 23/09), dans l'ordre du plateau ; une tache par couleur : comme avant", () => {
  for(const c of [...cartesDessin, ...cartes3]){
    const e = dessin.eleve(c);
    assert.equal(e.ordre.length, c._rel.repetees.nombre.length);
    const couleurs = e.ordre.map(i => c._rel.repetees.couleurDe[i]);
    assert.deepEqual(couleurs, [...new Set(c._rel.repetees.couleurDe)]);
  }
  const ordinaire = { family:"C", hidden:[5, 9, 3], visible:[], _rel:{}, _splats:[{ cx:800 }, { cx:300 }, { cx:1200 }] };
  assert.deepEqual(dessin.eleve(ordinaire).ordre, [1, 0, 2], "de gauche à droite");
});

test("la règle « Les taches de même couleur cachent le même nombre de jetons. » : à l'écran sous les indices, sur la fiche dans la consigne", () => {
  assert.match(ligne("const ENQUETE_REGLE_REPETEES = "), /"Les taches de même couleur cachent le même nombre de jetons\."/);
  const ecran = html.slice(html.indexOf("\nfunction renderCard("), html.indexOf("\nfunction renderCardIntoSvg("));
  assert.match(ecran, /const regleRepetees = card\.family === "C" && !!\(card\._rel && card\._rel\.repetees\);/);
  assert.match(ecran, /layoutClueSentence\(ENQUETE_REGLE_REPETEES, 38, 1600 - 2\*24, false\)/);
  const consigne = new Function("activityEl", `${ligne("const ENQUETE_REGLE_REPETEES = ")}\nfunction classicPrintTaskCount(){ return 2; }\n${fn("getClassicPrintInstruction")}\nreturn getClassicPrintInstruction;`)({ value:"C" });
  assert.equal(consigne([cartesDessin[0], null]).note, "Les taches de même couleur cachent le même nombre de jetons.");
  assert.equal(consigne([{ family:"C", _rel:{} }]).note, "", "les fiches 10 à 19 ne changent pas");
});

test("correction imprimée : les cadres grandissent un peu moins en hauteur pour tenir dans la carte ; les autres cartes ne changent pas", () => {
  const profil = new Function(`${fn("getRelationCorrectionPrintProfile")}\nreturn getRelationCorrectionPrintProfile;`)();
  assert.deepEqual(profil({ _rel:{ repetees:{} } }), { verticalScale:1.12, fontScale:1.25, barShiftX:30, ownerLabels:true });
  assert.deepEqual(profil({ _rel:{} }), { verticalScale:1.20, fontScale:1.25, barShiftX:30, ownerLabels:true });
  const impression = html.slice(html.indexOf("\nfunction renderCardIntoSvg("), html.indexOf("\nfunction printSheet("));
  assert.match(impression, /const serre = reformulation && \(Number\(card\._rel\.visibleSum\) > 0 \|\| \(!!card\._rel\.repetees && Number\(card\._rel\.taskCount\) >= 5\)\);/);
});
