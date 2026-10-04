/* SPLAT! Enquête — lot E-sans-total (23/09/2026), case « Sans total » (noTotal=1).
   Deux indices sur les deux mêmes taches : un rapport (« fois plus » / « fois moins ») et un
   écart (« de plus » / « de moins »), boîte « TOTAL ? ». La correction écrit la grande tache
   deux fois et encadre ce qui dépasse : (k − 1) × ? = d (conception S0 §7).
   Ces tests exécutent les fonctions de outils/splat.html telles quelles (extraites du
   fichier) :
   - case décochée (le défaut), genInvestigate donne EXACTEMENT les mêmes cartes et consomme
     exactement le même hasard qu'avant le lot (empreinte relevée sur main = 17cae13) ;
   - case cochée : des milliers de cartes justes (deux taches, solution unique et positive,
     bornes respectées, aucun nombre à sous-entendu) ;
   - l'adresse noTotal=1, la correction (cadres, calculs, vérification), le mode élève. */
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
  "invMaxAddEl", "invVisibleMinEl", "invVisibleMaxEl", "invTotalMinEl", "invTotalMaxEl", "invNoTotalEl", "activityEl", "investigatePaletteKeys", `
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
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
    const rng = mulberry32(graine | 0);
    let appels = 0;
    const compte = () => { appels++; return rng(); };
    const cartes = [];
    for(let i = 0; i < n; i++) cartes.push(genInvestigate(compte));
    return { cartes, appels };
  };`)(null, null, null, null, null, null, null, null, null, null, null, null, null, { value:"C" }, null);

const empreinte = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex").slice(0, 16);

// --- case décochée : rien ne bouge ---------------------------------------------------------
/* Cinq jeux de réglages de l'Enquête (défaut 2 et 3 taches, et les réglages des fiches 10, 14
   et 19), 1 200 cartes tirées d'affilée. L'empreinte a été relevée avec le genInvestigate de
   main (17cae13, avant le lot) : elle couvre les valeurs, les indices, le modèle _rel, les
   couleurs — et le nombre de tirages au hasard consommés. */
const JEUX = [
  [{}, 5, 300], [{ splats:"3" }, 8, 300],
  [{ splats:"3", structure:"CHAIN", mul:false, div:false, deltaMax:15, visibleMin:1, visibleMax:3, totalMin:20, totalMax:60 }, 950, 200],
  [{ mul:false, div:false, sub:false, deltaMax:10, visibleMax:0, totalMin:10, totalMax:30 }, 339, 200],
  [{ splats:"3", mul:true, div:true, deltaMax:15, visibleMin:1, visibleMax:3, totalMin:20, totalMax:60 }, 537, 200]
];
const EMPREINTE_MAIN = "de67ae272824270f";

test("case « Sans total » décochée : exactement les mêmes cartes et le même hasard qu'avant le lot", () => {
  const sansCase = JEUX.map(([r, g, n]) => tirer(r, g, n));
  const decochee = JEUX.map(([r, g, n]) => tirer({ ...r, noTotal:false }, g, n));
  assert.equal(empreinte(sansCase), EMPREINTE_MAIN, "page sans la case (ancienne adresse) : cartes de main");
  assert.equal(empreinte(decochee), EMPREINTE_MAIN, "case décochée : cartes de main");
  assert.deepEqual(sansCase.map(x => x.appels), [6220, 14370, 7896, 3345, 13675], "même nombre de tirages au hasard");
  // et aucune carte ordinaire ne porte le drapeau (le JSON des cartes reste celui d'avant)
  sansCase.forEach(x => x.cartes.forEach(c => assert.ok(!("sansTotal" in c._rel))));
});

// --- case cochée : des cartes justes -------------------------------------------------------
const REGLAGES = [
  {}, { deltaMax:30 }, { deltaMax:40, totalMin:30, totalMax:120 }, { mul:false, sub:false }, { div:false, add:false },
  { mul:false, div:false }, { add:false, sub:false }, { splats:"3", visibleMin:2, visibleMax:5, structure:"CHAIN" },
  { deltaMax:3, totalMin:5, totalMax:15 }, { clues:"SYMBOL" }
];
const INTERDITS = ["69", "88", "420", "666", "1488"];

test("case cochée : deux taches, un rapport et un écart sur la même paire, solution unique et positive (20 000 cartes)", () => {
  for(const reglages of REGLAGES){
    const r = { deltaMax:20, totalMin:20, totalMax:100, ...reglages };
    const { cartes } = tirer({ ...reglages, noTotal:true }, 2026, 2000);
    const vues = new Set();
    for(const c of cartes){
      const R = c._rel;
      assert.equal(c.family, "C");
      assert.equal(c.hidden.length, 2, "toujours deux taches");
      assert.deepEqual(c.visible, [], "aucun jeton visible");
      assert.equal(R.sansTotal, true);
      assert.equal(R.structure, "SANS_TOTAL");
      assert.equal(R.relations.length, 2);
      const rapport = R.relations.find(x => x.op === "MUL" || x.op === "DIV");
      const ecart = R.relations.find(x => x.op === "ADD" || x.op === "SUB");
      assert.ok(rapport && ecart, "un rapport ET un écart");
      assert.equal(R.relations[0], rapport, "le rapport d'abord");
      const [a, b] = c.hidden;
      const petite = Math.min(a, b), grande = Math.max(a, b);
      assert.ok(Number.isInteger(petite) && petite >= 2, "valeurs entières, au moins 2");
      assert.ok(rapport.k >= 2 && rapport.k <= 4);
      assert.equal(grande, rapport.k * petite, "grande = k × petite");
      assert.equal(grande - petite, ecart.k, "grande = petite + d");
      // la même paire, lue dans le sens de l'indice
      const val = i => c.hidden[i];
      for(const x of R.relations){
        const t = val(x.target), s = val(x.source);
        if(x.op === "MUL") assert.equal(t, x.k * s);
        if(x.op === "DIV") assert.equal(t * x.k, s);
        if(x.op === "ADD") assert.equal(t, s + x.k);
        if(x.op === "SUB") assert.equal(t, s - x.k);
      }
      // (k − 1) × 𝑥 = d : une seule solution positive
      assert.equal(ecart.k % (rapport.k - 1), 0);
      assert.equal(ecart.k / (rapport.k - 1), petite);
      // le total existe (c'est la somme), mais il n'est jamais donné
      assert.equal(c.total, a + b);
      // les opérations cochées sont respectées
      if(r.mul === false && r.div !== false) assert.equal(rapport.op, "DIV");
      if(r.div === false && r.mul !== false) assert.equal(rapport.op, "MUL");
      if(r.add === false && r.sub !== false) assert.equal(ecart.op, "SUB");
      if(r.sub === false && r.add !== false) assert.equal(ecart.op, "ADD");
      // bornes : écart max et total, sauf si les réglages sont impossibles
      if(!(reglages.deltaMax === 3)){
        assert.ok(ecart.k <= r.deltaMax, `écart ${ecart.k} ≤ ${r.deltaMax}`);
        assert.ok(c.total >= r.totalMin && c.total <= r.totalMax, `total ${c.total} dans [${r.totalMin}, ${r.totalMax}]`);
      }
      // aucun nombre à sous-entendu, nulle part sur la carte ni dans sa correction
      for(const n of [a, b, rapport.k, ecart.k, c.total, rapport.k - 1]){
        assert.ok(!INTERDITS.some(x => String(n).includes(x)), `nombre à sous-entendu : ${n}`);
      }
      // les phrases disent la même chose que le modèle
      if(r.clues !== "SYMBOL"){
        assert.equal(c._inv.indices.length, 2);
        c._inv.indices.forEach((p, i) => assert.equal(p, R.relations[i].clue));
        assert.match(c._inv.indices[0], /fois (plus|moins) de jetons que sous/);
        assert.match(c._inv.indices[1], /jetons? de (plus|moins) que sous/);
      }
      vues.add(c.hidden.join("/"));
    }
    assert.ok(vues.size >= (reglages.deltaMax === 3 ? 3 : 20), `des cartes variées (${vues.size})`);
  }
});

test("réglages impossibles (écart max 1, total min trop haut) : des cartes justes et variées, jamais « Erreur »", () => {
  for(const reglages of [{ deltaMax:1 }, { totalMin:500, totalMax:900 }]){
    const { cartes } = tirer({ ...reglages, noTotal:true }, 7, 200);
    assert.ok(cartes.every(c => c._rel.sansTotal && c._inv.indices.every(t => t !== "Erreur")));
    assert.ok(cartes.every(c => Math.max(...c.hidden) === c._rel.relations[0].k * Math.min(...c.hidden)));
    assert.ok(new Set(cartes.map(c => c.hidden.join("/"))).size >= 50, "pas la même carte de secours répétée");
  }
});

// --- l'adresse ------------------------------------------------------------------------------
test("adresse : noTotal=1 lu pour l'Enquête, écrit seulement quand la case est cochée, dans l'empreinte élève", () => {
  const noms = JSON.parse(ligne("const sharedNames = ").replace(/^.*= /, "").replace(/;$/, ""));
  const hors = JSON.parse(ligne("const ELEVE_HORS_EMPREINTE = ").replace(/^.*= /, "").replace(/;$/, ""));
  assert.ok(noms.includes("noTotal"));
  assert.ok(!hors.includes("noTotal"), "la case change les cartes : elle entre dans l'empreinte");
  // absente = décochée, même pour une partie d'étape composée qui suit une partie « sans total »
  assert.match(fn("appliquerConfiguration"), /if\(\(act === "C" \|\| act === "CD"\) && invNoTotalEl\) invNoTotalEl\.checked = readBooleanFromShare\(params, "noTotal"\) === true;/);
  // les adresses de l'Enquête publiées (fiches 10 à 19) ne changent pas : rien n'est écrit case décochée
  assert.match(fn("buildShareUrl"), /if\(\(act === "C" \|\| act === "CD"\) && invNoTotalEl && invNoTotalEl\.checked\) params\.set\("noTotal", "1"\);/);
  assert.doesNotMatch(fn("getClassicShareControls"), /noTotal/);
  assert.match(html, /<input type="checkbox" id="invNoTotal"> <span>Sans total<\/span>/);
  assert.doesNotMatch(html, /id="invNoTotal" checked/, "éteinte par défaut");
});

// --- la correction ----------------------------------------------------------------------------
/* Un faux DOM minimal : chaque élément garde son nom, ses attributs, son texte, ses enfants. */
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
  const measureTextWidth = () => NaN;
  const measureRelationEquationTextWidth = (t, fs) => String(t).length * fs * 0.55;
  const taskSplatColor = () => "#000";
  const taskShortName = (i, card) => card.words[i][0].toUpperCase() + card.words[i].slice(1);
  const investigateColorInfo = (card, i) => ({ word: card.words[i] });
  const investigateColorWord = info => info.word;
  let varChar = "?";
  const getNumberedDisplayVarChar = () => varChar;
  const drawRelationAnswerLine = (g, card, x, w, y) => { g.appendChild(text(x, y, "réponses", { id:"relationAnswerLine" })); };
  ${fn("formatRelationNumber")}
  ${fn("formatCoeffUnknownTerm")}
  ${fn("pastilleTextDy")}
  ${fn("getRelationSchemaLayout")}
  ${fn("getRelationDrawingMetrics")}
  ${fn("drawBarCell")}
  ${ligne("const ENQUETE_DEPASSE_TRAIT = ")}
  ${ligne("const ENQUETE_DEPASSE_FOND = ")}
  ${ligne("const ENQUETE_ECRITURE_FOND = ")}
  ${ligne("const ENQUETE_ECRITURE_ENCRE = ")}
  ${fn("enqueteSansTotal")}
  ${fn("enqueteSansTotalModele")}
  ${fn("enqueteSansTotalCase")}
  ${fn("enqueteSansTotalLigne")}
  ${fn("drawEnqueteSansTotalSituation")}
  ${fn("drawEnqueteDeuxEcritures")}
  ${fn("drawEnqueteVerification")}
  return { modele: enqueteSansTotalModele, estSansTotal: enqueteSansTotal, situation: drawEnqueteSansTotalSituation,
           ecritures: drawEnqueteDeuxEcritures, verification: drawEnqueteVerification, lettre: (v) => { varChar = v; } };
`)(dom);

// violette = 4 × noire ; noire = violette − 18 (la carte de la graine 42 des captures)
const carte = (relations, hidden, words = ["noire", "violette"]) => ({ family:"C", hidden, words, _rel:{ sansTotal:true, hiddenValues:hidden, relations } });
const C42 = carte([{ op:"MUL", k:4, source:0, target:1 }, { op:"SUB", k:18, source:1, target:0 }], [6, 24]);
const cadre = (draw, card, opts) => { const g = dom.creer("g"); const h = draw(g, card, opts); return { g, h, tous: dom.tous(g) }; };
const textes = (tous) => tous.filter(n => n.name === "text").map(n => n.textContent);

test("correction : le modèle ramène les deux indices à la petite tache, quel que soit leur sens", () => {
  assert.deepEqual(dessin.modele(C42), { petite:0, grande:1, k:4, d:18, small:6, large:24, relations:C42._rel.relations });
  const div = carte([{ op:"DIV", k:3, source:1, target:0 }, { op:"ADD", k:24, source:0, target:1 }], [12, 36], ["bleue", "rouge"]);
  assert.equal(dessin.modele(div).petite, 0);
  assert.equal(dessin.modele(div).grande, 1);
  assert.equal(dessin.estSansTotal(C42), true);
  assert.equal(dessin.estSansTotal({ family:"C", _rel:{} }), false, "une carte ordinaire n'est pas « sans total »");
});

test("schéma de la situation : une ligne par écriture (petite, k × ?, ? + d), les deux écritures de même longueur, sans accolade", () => {
  const { tous, h } = cadre(dessin.situation, C42, { filled:true });
  assert.ok(h > 0);
  assert.equal(tous[1].attrs.id, "relationSituationSchema", "même identifiant que le schéma de l'Enquête (cadrage téléphone)");
  assert.ok(textes(tous).includes("Schéma rempli de la situation"));
  assert.deepEqual(textes(tous).filter(t => /^(Noire|Violette)$/.test(t)), ["Noire", "Violette", "Violette"]);
  const cases = tous.filter(n => n.name === "rect" && n.attrs.stroke === "#000" && n.attrs["stroke-width"] === 3 && n.attrs.rx === 0);
  const lignes = new Map();
  cases.forEach(r => { const y = r.attrs.y; lignes.set(y, (lignes.get(y) || []).concat(r)); });
  const longueurs = [...lignes.values()].map(rs => rs.reduce((s, r) => s + r.attrs.width, 0));
  assert.equal(longueurs.length, 3);
  assert.equal(longueurs[1], 4 * longueurs[0], "k × ? : quatre fois la case de la petite");
  assert.equal(longueurs[2], longueurs[1], "? + 18 : même longueur que 4 × ?");
  assert.ok(!tous.some(n => n.name === "path" && /H .* V .* H/.test(String(n.attrs.d))), "pas d'accolade de total");
  // vide : les cases sont là, sans valeur
  const vide = cadre(dessin.situation, C42, { filled:false });
  assert.ok(textes(vide.tous).includes("Schéma vide de la situation"));
  assert.ok(!textes(vide.tous).includes("18"));
});

test("« La violette, écrite deux fois : ce qui dépasse » : la partie qui dépasse en pointillé cannelle, puis les calculs", () => {
  const avant = cadre(dessin.ecritures, C42, { solved:false });
  assert.equal(avant.tous[1].attrs.id, "enqueteDeuxEcritures");
  assert.ok(textes(avant.tous).includes("La violette, écrite deux fois : ce qui dépasse"));
  const pointilles = avant.tous.filter(n => n.name === "rect" && n.attrs["stroke-dasharray"]);
  assert.equal(pointilles.length, 2, "ce qui dépasse, dans chacune des deux écritures");
  pointilles.forEach(r => { assert.equal(r.attrs.stroke, "#92400e"); assert.equal(r.attrs.fill, "rgba(146,64,14,0.10)"); });
  assert.equal(pointilles[0].attrs.x, pointilles[1].attrs.x, "alignées");
  assert.equal(pointilles[0].attrs.width, pointilles[1].attrs.width, "le même morceau");
  // … et c'est bien ce qui DÉPASSE la première case ?, commune aux deux écritures
  const cases = avant.tous.filter(n => n.name === "rect" && n.attrs.rx === 0 && n.attrs.stroke === "#000");
  const gauche = Math.min(...cases.map(r => r.attrs.x));
  const premiere = cases.find(r => r.attrs.x === gauche);
  const droite = Math.max(...cases.map(r => r.attrs.x + r.attrs.width));
  assert.ok(pointilles[0].attrs.x >= gauche + premiere.attrs.width, "la case commune n'est pas encadrée");
  assert.ok(pointilles[0].attrs.x - (gauche + premiere.attrs.width) <= 8, "le cadre commence juste après elle");
  assert.ok(Math.abs(pointilles[0].attrs.x + pointilles[0].attrs.width - droite) <= 8, "et va jusqu'au bout des deux barres");
  assert.ok(!textes(avant.tous).some(t => /=/.test(t)), "pas encore de calcul");

  const apres = cadre(dessin.ecritures, C42, { solved:true });
  assert.equal(apres.tous[1].attrs.id, "enqueteDeuxEcrituresSolved");
  const calculs = textes(apres.tous).filter(t => /=/.test(t));
  // la division écrite (choix du 23/09)
  assert.deepEqual(calculs, ["3 × ? = 18", "? = 18 ÷ 3 = 6", "violette = 4 × 6 = 24"]);
  // k = 2 : ce qui dépasse est UNE case, « ? = d » directement
  const k2 = carte([{ op:"MUL", k:2, source:0, target:1 }, { op:"ADD", k:15, source:0, target:1 }], [15, 30], ["bleue", "rouge"]);
  assert.deepEqual(textes(cadre(dessin.ecritures, k2, { solved:true }).tous).filter(t => /=/.test(t)), ["? = 15", "rouge = 2 × 15 = 30"]);
  // en lettre
  dessin.lettre("𝑥");
  assert.deepEqual(textes(cadre(dessin.ecritures, C42, { solved:true }).tous).filter(t => /=/.test(t)), ["3𝑥 = 18", "𝑥 = 18 ÷ 3 = 6", "violette = 4 × 6 = 24"]);
  dessin.lettre("?");
});

test("vérification : chaque indice relu tel qu'il est écrit sur la carte, puis la réponse", () => {
  const { tous } = cadre(dessin.verification, C42, {});
  assert.equal(tous[1].attrs.id, "enqueteVerification");
  const t = textes(tous);
  assert.ok(t.includes("Vérification"));
  assert.ok(t.includes("24 = 4 × 6 ✓"));
  assert.ok(t.includes("6 = 24 − 18 ✓"));
  assert.ok(t.includes("réponses"));
  const div = carte([{ op:"DIV", k:3, source:1, target:0 }, { op:"ADD", k:24, source:0, target:1 }], [12, 36], ["bleue", "rouge"]);
  const t2 = textes(cadre(dessin.verification, div, {}).tous);
  assert.ok(t2.includes("12 = 36 ÷ 3 ✓") && t2.includes("36 = 12 + 24 ✓"));
});

test("le cadre de la tache de référence dit qu'il n'y a pas de total ; les autres cartes n'y gagnent aucune ligne", () => {
  const reformulation = new Function(`
    function formatRelationNumber(n){ return String(n); }
    function relationReferenceIndex(card){ return card.ref; }
    function investigateColorInfo(card, i){ return { word: card.words[i] }; }
    function investigateColorWord(info){ return info.word; }
    ${fn("relationReformulationLines")}
    return relationReformulationLines;
  `)();
  const names = ["la tache noire", "la tache violette"];
  const sans = { _rel:{ sansTotal:true, names, relations:C42._rel.relations }, ref:0, words:["noire", "violette"] };
  assert.deepEqual(reformulation(sans), [
    "Sous la tache violette, il y a 18 jetons de plus que sous la tache noire.",
    "Tache de référence : la noire, la plus petite.",
    "Pas de total : on compare les deux écritures de la violette."
  ]);
  const ordinaire = { _rel:{ names, relations:[{ op:"ADD", k:5, source:0, target:1 }] }, ref:0, words:["noire", "violette"] };
  assert.deepEqual(reformulation(ordinaire), ["Tache de référence : la noire, la plus petite."]);
});

test("écran : deux clics sans total (les barres, calculs), taches dévoilées au 2e ; impression : la correction en barres (lots G1-G2)", () => {
  const ecran = html.slice(html.indexOf("\nfunction renderCard("), html.indexOf("\nfunction renderCardIntoSvg("));
  // la correction en barres passe avant l'ancien dessin « sans total », qui reste pour une carte
  // sans modèle ; sans ligne ②, le 2e clic est « je calcule »
  assert.match(ecran, /\}else if\(card\.family === "C" && card\._rel && enqueteBarresModele\(card\)\)\{/);
  assert.match(ecran, /if\(revealState === 2\) \(sansLigne \? drawEnqueteCalculs : drawEnqueteLigne\)\(relCible, card, oE\);/);
  assert.match(ecran, /\}else if\(card\.family === "C" && card\._rel && card\._rel\.sansTotal\)\{\s*\/\/[^\n]*\n[^\n]*\n\s*if\(revealState === 1 \|\| revealState === 2\) drawEnqueteSansTotalSituation\(relCible, card, \{ filled: revealState === 2, \.\.\.relTel \}\);/);
  assert.match(ecran, /revealState >= enqueteDerniereEtape\(card\)/);
  assert.match(fn("enqueteNbEtapes"), /return card\._rel\.sansTotal \? 2 : 3;/);
  // « TOTAL ? » en gris ardoise, à l'écran comme à l'impression
  assert.match(ecran, /sansTotalAffiche \? "\?" : String\(card\.total\)/);
  const impression = html.slice(html.indexOf("\nfunction renderCardIntoSvg("), html.indexOf("\nfunction printSheet("));
  assert.match(impression, /sansTotalImprime \? "\?" : String\(card\.total\)/);
  assert.match(impression, /if\(enqueteCompacte && printRevealState > 0\)\{[^}]*drawEnqueteCorrectionImprimee\(targetSvg, card, trayY \+ trayHDessine \+ 50, 2160\);/);
  // l'ancien dessin (référence, situation, deux écritures, vérification) reste derrière, pour une carte sans modèle
  const bloc = impression.slice(impression.indexOf("}else if(card._rel.sansTotal){"), impression.indexOf("}else{", impression.indexOf("}else if(card._rel.sansTotal){")));
  const ordre = ["drawRelationReformulationBox", "drawEnqueteSansTotalSituation", "drawEnqueteDeuxEcritures", "drawEnqueteVerification"].map(f => bloc.indexOf(f));
  assert.ok(ordre.every(i => i > 0) && ordre.every((i, j) => j === 0 || i > ordre[j - 1]), "référence, situation, deux écritures, vérification");
  // le cadrage téléphone du mode élève retrouve les nouveaux cadres
  const cadres = JSON.parse(ligne("const ELEVE_SCHEMA_CADRES = ").replace(/^.*= /, "").replace(/;$/, ""));
  ["enqueteBarres", "enqueteLigne", "enqueteCalculs", "enqueteDeuxEcritures", "enqueteDeuxEcrituresSolved", "enqueteVerification"].forEach(id => assert.ok(cadres.includes(id), id));
  assert.ok(!cadres.includes("enqueteBarresVide"), "plus d'étape « barres vides » (29/09/2026)");
});

test("mode élève : la case du haut reste, « TOTAL ? » donné, rien à saisir ; les autres cartes gardent leur total", () => {
  const src = fn("renderEleveSplat");
  // (lot M4-4b : « Trois paires » du Système n'a plus de ligne du TOTAL ; l'Enquête sans total garde son « ? »)
  assert.match(src, /haut = \(enquete\.systeme && sysTotalCache\(card\)\) \? ""\n      : eleveCaseDonneeHtml\("haut blanche", "Total", \(card\._rel && card\._rel\.sansTotal\) \? "\?" : card\.total\);/);
  const donnee = new Function(`${fn("eleveCaseDonneeHtml")}\nreturn eleveCaseDonneeHtml;`)();
  const h = donnee("haut blanche", "Total", "?");
  assert.doesNotMatch(h, /<input/, "une case donnée n'a pas de champ : la validation l'ignore");
  assert.match(h, /<span class="eleveDonneeVal">\?<\/span>/);
});
