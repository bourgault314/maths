/* SPLAT! — les cartes jumelles (mondes 1 à 4).
   Décision de Gwenaël du 05/10/2026 : à la fin d'une série, une carte rouge (réponse montrée à la
   3e erreur) ne revient plus identique, elle revient en JUMELLE — même type, même dessin, d'autres
   nombres ; pas de jumelle dans ÉquaSplat (mondes 5 et 6). Planches validées le 14/10/2026
   (splat-relecture\lot-cartes-jumelles\), puis par question à choix : « Rejoue-la, avec d'autres
   nombres, … » sur l'écran de fin (choix A, tests/splat-etape-suivante.test.mjs) ; un autre « fois »
   accepté quand aucune jumelle ne garde le même (défis tirés au hasard, 3 cartes sur 784).
   Ces tests exécutent les fonctions des deux pages telles quelles (extraites des fichiers) :
   1. chaque carte de chaque fiche en ligne des mondes 2 à 4 (Enquête et Système, Bonus compris ; le
      monde 2 par ses sept parties) a sa jumelle : même clé (type, couleurs, taches, plateaux à la
      même place, nombre de jetons visibles), TOUS les nombres changent (à trouver, totaux, jetons
      visibles, écarts), la même graine redonne la même jumelle, les réglages de la page et le
      hasard des cartes suivantes ne bougent pas ;
   2. Petit SPLAT! (monde 1) : des milliers de cartes, toutes cibles, de 1 à 6 taches ;
   3. le branchement : la carte rouge rejouée devient sa jumelle (la carte d'origine s'il n'y en a
      pas), tirée une seule fois, une autre si la carte revient encore ; rien de nouveau n'est
      enregistré (la reprise des élèves et l'empreinte de la série ne changent pas). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const petit = await readFile(new URL("../outils/splat_tache_barre.html", import.meta.url), "utf8");
const univers = await readFile(new URL("../outils/splat_univers.html", import.meta.url), "utf8");
const equa = await readFile(new URL("../outils/equasplat.html", import.meta.url), "utf8");

function fn(name, page = html){
  const start = page.indexOf(`\nfunction ${name}(`);
  assert.notEqual(start, -1, `${name} introuvable`);
  return page.slice(start + 1, page.indexOf("\n}\n", start) + 3);
}
function ligne(prefix, page = html){
  const l = page.split("\n").find((x) => x.startsWith(prefix));
  assert.ok(l, `${prefix} introuvable`);
  return l;
}
function bloc(debut, fin){
  const a = html.indexOf(debut);
  assert.notEqual(a, -1, debut);
  return html.slice(a, html.indexOf(fin, a) + fin.length);
}

/* Les fiches en ligne : les 33 adresses de l'Enquête et du Système (ENQ_FICHES, ENQ_TOUR2, SYS_FICHES,
   SYS_TOUR2) et les sept parties du monde 2 (M2A1 … M2E5B), lues sur la carte des mondes. */
const FICHES_CD = [...univers.matchAll(/q:"(mode=[CD][^"]*)"/g)].map((m) => m[1]);
const PARTIES_M2 = [...univers.matchAll(/const (M2[A-Z0-9]+)="(mode=[UN][^"]*)"/g)].map((m) => [m[1], m[2]]);

const CONSTANTES_SYS = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_SOUS_GESTES", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS",
  "SYS_COULEURS_PLURIEL", "SYS_PLAGES"].map((nom) => ligne(`const ${nom} = `)).join("\n");
const FONCTIONS_SYS = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysTexteASousEntendu", "sysSituationSure", "sysAssemblerCarte", "sysTypeCarte",
  "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan", "sysLireGestes"].map((n) => fn(n)).join("\n");
const FONCTIONS_JUMELLES = ["jumelleGraine", "jumelleCle", "jumelleReponses", "jumelleNombresChanges", "jumelleResserrer", "jumelleTirer",
  "jumellePermutations", "carteJumelle"].map((n) => fn(n)).join("\n");

/* Les générateurs de la page (Enquête, Système, monde 2) et les cartes jumelles, sur de faux
   contrôles réglés comme l'adresse de la fiche. */
const moteur = new Function(`
  ${bloc("const INVESTIGATE_COLOR_PALETTE = [", "];")}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const INVESTIGATE_REPEAT_MAX = ")}
  ${ligne("const INVESTIGATE_REPEAT_TACHES_MAX = ")}
  ${ligne("const SYS_NOMBRES_SOUS_ENTENDUS = ")}
  ${ligne("const ENQ_VOCABULAIRE = ")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${ligne("const xChar = ")}
  ${ligne("const variableChars = ")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function rFloat(")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("investigateColorInitial")}
  ${ligne("let jumelleCouleurs = ")}
  ${fn("buildInvestigateColorMap")}
  ${fn("sysNombreSousEntendu")}
  ${fn("getTrayConfig")}
  ${fn("getNumberedSplatsLegacy")}
  ${fn("getNumberedSplats")}
  ${fn("sameSplats")}
  ${fn("numberedBeadRadius")}
  ${fn("numberedBeadRadiusDrawn")}
  ${fn("nudgeTokenFree")}
  ${fn("numberedSplatsBande")}
  ${fn("numberedSplatsPlacesVisibles")}
  ${fn("relocateNumberedTokensToFinalSplats")}
  ${fn("assignPositionsNumbered")}
  ${fn("genInvestigate")}
  ${CONSTANTES_SYS}
  ${FONCTIONS_SYS}
  ${fn("pickVariableChar")}
  ${fn("randomComposition")}
  ${fn("shouldGenerateEmptyTaskCase")}
  ${fn("genUnitEmptyTaskCase")}
  ${fn("genUnitsEquationPreset")}
  ${fn("genNumberedEquationPreset")}
  ${fn("getUnitEquationType")}
  ${fn("isUnitEquationPresetActive")}
  ${fn("getNumberedEquationType")}
  ${fn("isNumberedEquationPresetActive")}
  ${ligne("const JUMELLE_ESSAIS = ")}
  ${FONCTIONS_JUMELLES}
  const genUnits = () => { throw new Error("genUnits : pas dans les fiches"); };
  const genNumbered = () => { throw new Error("genNumbered : pas dans les fiches"); };
  /* les jetons un par un (monde 2, activités 1 à 3) se placent avec un canevas : hors sujet ici */
  function assignPositions(card, rng){ if(card.family !== "U") assignPositionsNumbered(card, rng); }
  let eleveSuite = [], jumelleDernierePartie = null;
  const jumelleParties = new WeakMap();
  const appliquerConfiguration = () => { throw new Error("étape composée : non testée ici"); };
  let investigatePaletteKeys = null, reglagesD = null;
  const lireReglagesSysteme = () => sysNormaliserReglages(reglagesD);
  let invTaskCountEl, invClueTypeEl, invStructure3El, invOpMulEl, invOpDivEl, invOpAddEl, invOpSubEl, invMaxAddEl,
      invVisibleMinEl, invVisibleMaxEl, invTotalMinEl, invTotalMaxEl, invNoTotalEl, invRepeatOnEl, invRepeatEl,
      invOrdreEl, invVocabEl, invComposeEl, invReuniesEl,
      unitEquationTypeEl, unitTasksMinEl, unitTasksEl, unitVisibleMaxEl, unitHiddenMaxEl, unitTotalMinEl, unitTotalMaxEl,
      numberedEquationTypeEl, numTasksMinEl, numTasksEl, numVisibleMinEl, numVisibleMaxEl, numTotalMinEl, numTotalMaxEl;
  const activityEl = { value: "C" };
  const case_ = (oui) => ({ type: "checkbox", checked: oui }), valeur = (v) => ({ type: "number", value: String(v) });
  function controles(){
    return [invOpAddEl, invOpSubEl, invOpMulEl, invOpDivEl, invVisibleMinEl, invVisibleMaxEl, invNoTotalEl, invRepeatOnEl]
      .map((e) => e ? (e.type === "checkbox" ? e.checked : e.value) : null);
  }
  return {
    regler(adresse){
      const q = new URLSearchParams(adresse);
      const g = (k, d) => q.has(k) ? q.get(k) : d;
      activityEl.value = g("mode", "C");
      invTaskCountEl = valeur(g("splats", "2")); invClueTypeEl = valeur(g("clues", "SENTENCE")); invStructure3El = valeur(g("structure", "MIX"));
      invOpMulEl = case_(g("mul", "1") === "1"); invOpDivEl = case_(g("div", "1") === "1");
      invOpAddEl = case_(g("add", "1") === "1"); invOpSubEl = case_(g("sub", "1") === "1");
      invMaxAddEl = valeur(g("deltaMax", "20")); invVisibleMinEl = valeur(g("visibleMin", "0")); invVisibleMaxEl = valeur(g("visibleMax", "3"));
      invTotalMinEl = valeur(g("totalMin", "20")); invTotalMaxEl = valeur(g("totalMax", "100"));
      invNoTotalEl = case_(g("noTotal", "0") === "1");
      invRepeatOnEl = case_(q.has("repeat") && Number(q.get("repeat")) > 1); invRepeatEl = valeur(g("repeat", "1"));
      invOrdreEl = valeur(g("ordre", "HASARD")); invVocabEl = case_(g("vocab", "0") === "1");
      invComposeEl = case_(g("compose", "0") === "1"); invReuniesEl = case_(g("reunies", "0") === "1");
      reglagesD = { geste: g("geste", "EMBOITE1"), gestes: sysLireGestes(g("gestes", "")), clues: "BOARD", coefMax: g("coefMax", 3),
        visMin: g("visibleMin", 0), visMax: g("visibleMax", 3), totalMin: g("totalMin", 20), totalMax: g("totalMax", 60),
        ecart: g("ecart", ""), fois: g("fois", 2), indice: g("indice", "11"), sens: g("sens", "PLATEAU"), ordre: g("ordre", ""),
        forme: g("forme", ""), grand: g("grand", ""), sous: g("sous", "MIX") };
      /* monde 2 : les réglages tels que la page les garde (syncUnitEquationUI : une tache pour x + a = b, 2 au moins sinon) */
      const eq = g("equation", "ADVANCED");
      unitEquationTypeEl = valeur(eq); numberedEquationTypeEl = valeur(eq);
      const tMin = eq === "X_PLUS_A_EQ_B" ? 1 : Math.max(2, Number(g("tasksMin", 2)));
      unitTasksMinEl = valeur(tMin); unitTasksEl = valeur(eq === "X_PLUS_A_EQ_B" ? 1 : Math.max(tMin, Number(g("tasksMax", 1))));
      unitVisibleMaxEl = valeur(g("visibleMax", 15)); unitHiddenMaxEl = valeur(g("hiddenMax", 10));
      unitTotalMinEl = valeur(g("totalMin", 1)); unitTotalMaxEl = valeur(g("totalMax", 50));
      numTasksMinEl = valeur(g("tasksMin", 1)); numTasksEl = valeur(g("tasksMax", 1));
      numVisibleMinEl = valeur(g("visibleMin", 2)); numVisibleMaxEl = valeur(g("visibleMax", 3));
      numTotalMinEl = valeur(g("totalMin", 20)); numTotalMaxEl = valeur(g("totalMax", 50));
    },
    /* la série de l'adresse, comme generate() : une carte, puis ses places, avec le hasard de la graine */
    serie(adresse){
      this.regler(adresse);
      const q = new URLSearchParams(adresse), rng = mulberry32(Number(q.get("seed")) | 0), mode = q.get("mode");
      const out = [];
      for(let i = 0; i < (Number(q.get("cards")) || 4); i++){
        const c = mode === "C" ? genInvestigate(rng) : mode === "D" ? genSystemCarte(rng, lireReglagesSysteme())
          : mode === "U" ? genUnitsEquationPreset(rng) : genNumberedEquationPreset(rng);
        assignPositions(c, rng);
        out.push(c);
      }
      return out;
    },
    jumelle: (carte, graine) => carteJumelle(carte, graine),
    cle: jumelleCle, reponses: jumelleReponses, changes: jumelleNombresChanges, graine: jumelleGraine, type: sysTypeCarte,
    controles, couleursImposees: () => jumelleCouleurs,
    couleurs: (rng, n) => buildInvestigateColorMap(rng, n, true), mulberry32
  };
`)();

const vus = (c) => c.family === "D" ? c._sys.boards.map((B) => (B.visible || []).reduce((s, x) => s + x, 0)).join("|")
  : (c.family === "U" ? (c.visible || []).length : (c.visible || []).reduce((s, x) => s + x, 0));

/* strict = false : l'Enquête peut changer de « fois » quand aucune jumelle ne garde le même (choix du
   14/10/2026) — rare, et seulement pour un rapport (le reste de la carte est le même) */
function verifierJumelle(o, t, quoi, strict = true){
  assert.ok(t, `${quoi} : une jumelle`);
  assert.equal(moteur.cle(t, !strict), moteur.cle(o, !strict), `${quoi} : même type, même dessin`);
  assert.ok(moteur.changes(o, t), `${quoi} : tous les nombres changent`);
  const a = moteur.reponses(o), b = moteur.reponses(t);
  a.forEach((x, i) => {
    assert.notEqual(b[i], x, `${quoi} : la réponse ${i} change`);
    assert.ok(b[i] > 0, `${quoi} : jamais de tache vide`);
    if(x >= 2) assert.ok(b[i] >= 2, `${quoi} : pas d'un coup une tache à un jeton`);
  });
  if(o.family === "D"){
    o._sys.boards.forEach((B, i) => { if(B.total != null) assert.notEqual(t._sys.boards[i].total, B.total, `${quoi} : le total du plateau ${i} change`); });
    assert.deepEqual(t._sys.ordre, o._sys.ordre, `${quoi} : les plateaux à la même place`);
    assert.deepEqual(t._sys.colors, o._sys.colors, `${quoi} : les mêmes couleurs`);
    assert.ok(!t._sys.secours, `${quoi} : jamais la carte de secours`);
  }else if(!(o._rel && o._rel.sansTotal)){
    assert.notEqual(t.total, o.total, `${quoi} : le total change`);
  }
  const avecVisibles = o.family === "D" ? o._sys.boards.some((B) => (B.visible || []).length) : (o.visible || []).length > 0;
  if(avecVisibles) assert.notEqual(vus(t), vus(o), `${quoi} : les jetons visibles changent`);
  if(o.family === "C"){
    assert.deepEqual(t._colorMap, o._colorMap, `${quoi} : les mêmes taches, aux mêmes places`);
    o._rel.relations.forEach((r, i) => { if(r.op === "ADD" || r.op === "SUB") assert.notEqual(t._rel.relations[i].k, r.k, `${quoi} : l'écart change`); });
  }
}

// --- 1. les fiches en ligne -----------------------------------------------------------------------
test("les fiches en ligne : 33 de l'Enquête et du Système, 7 parties du monde 2", () => {
  assert.equal(FICHES_CD.length, 33);
  assert.equal(FICHES_CD.filter((q) => q.startsWith("mode=D")).length, 8);
  assert.deepEqual(PARTIES_M2.map(([n]) => n), ["M2A1", "M2A2", "M2A3", "M2E4A", "M2E4B", "M2E5A", "M2E5B"]);
});

const facteurChange = [];
for(const adresse of FICHES_CD){
  const nom = adresse.startsWith("mode=D") ? `Système (${adresse.match(/seed=(\d+)/)[1]})` : `Enquête (${adresse.match(/seed=(\d+)/)[1]})`;
  test(`${nom} : chaque carte a sa jumelle — même dessin, d'autres nombres, toujours la même pour la même graine`, () => {
    const cartes = moteur.serie(adresse);
    const avant = moteur.controles();
    let autres = 0;
    cartes.forEach((o, i) => {
      const g = moteur.graine(`SIG|${i}|1`);
      const t = moteur.jumelle(o, g);
      verifierJumelle(o, t, `${nom}, carte ${i + 1}`, o.family === "D");
      if(moteur.cle(t) !== moteur.cle(o)) facteurChange.push(`${nom}, carte ${i + 1}`);
      assert.equal(JSON.stringify(moteur.jumelle(o, g)), JSON.stringify(t), `${nom}, carte ${i + 1} : la même graine, la même jumelle`);
      const t2 = moteur.jumelle(o, moteur.graine(`SIG|${i}|2`));
      verifierJumelle(o, t2, `${nom}, carte ${i + 1}, 2e venue`, o.family === "D");
      if(JSON.stringify(moteur.reponses(t2)) !== JSON.stringify(moteur.reponses(t))) autres++;
      assert.deepEqual(moteur.controles(), avant, `${nom} : les réglages de la page sont remis`);
      assert.equal(moteur.couleursImposees(), null, `${nom} : les couleurs imposées sont levées`);
    });
    assert.ok(autres >= cartes.length - 1, `${nom} : une carte qui revient encore revient avec d'autres nombres`);
  });
}

test("fiches en ligne : un autre « fois » reste l'exception (le même facteur d'abord)", () => {
  assert.ok(facteurChange.length <= 3, `facteur changé : ${facteurChange.join(" ; ")}`);
});

for(const [nom, adresse] of PARTIES_M2){
  test(`monde 2, ${nom} : chaque carte a sa jumelle (autant de taches, de paquets visibles ; d'autres nombres)`, () => {
    for(const graine of [Number(adresse.match(/seed=(\d+)/)[1]), 11, 222]){
      const cartes = moteur.serie(adresse.replace(/seed=\d+/, `seed=${graine}`));
      cartes.forEach((o, i) => {
        const t = moteur.jumelle(o, moteur.graine(`SIG|${i}|1`));
        verifierJumelle(o, t, `${nom} (${graine}), carte ${i + 1}`);
        if(o.family === "N") assert.equal(t.varChar, o.varChar, "la même lettre");
        if(o.family === "U") assert.equal((t.visible || []).length > 0, (o.visible || []).length > 0, "des jetons visibles, ou pas, comme elle");
      });
    }
  });
}

test("le hasard des fiches ne bouge pas : sans jumelle en cours, les couleurs se tirent comme avant", () => {
  assert.equal(moteur.couleursImposees(), null);
  const a = moteur.couleurs(moteur.mulberry32(42), 3);
  const b = moteur.couleurs(moteur.mulberry32(42), 3);
  assert.deepEqual(a, b);
  // et une fiche tirée après des jumelles est celle d'avant
  const adresse = FICHES_CD[0], avant = JSON.stringify(moteur.serie(adresse));
  moteur.serie(adresse).forEach((o, i) => moteur.jumelle(o, moteur.graine(`x${i}`)));
  assert.equal(JSON.stringify(moteur.serie(adresse)), avant);
});

test("défi tiré au hasard : aucune jumelle ne garde « 4 fois plus, puis 4 fois plus » → un autre facteur (choix du 14/10/2026)", () => {
  /* chaîne 2 → 8 → 32 entre 20 et 60 : la seule carte possible avec ces deux « 4 fois » */
  const adresse = "mode=C&clues=SENTENCE&splats=3&structure=CHAINE&ordre=DESSIN&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=0&visibleMax=0&totalMin=20&totalMax=60&cards=4&seed=222";
  const o = moteur.serie(adresse)[3];
  assert.deepEqual([...o.hidden].sort((a, b) => a - b), [2, 8, 32]);
  const t = moteur.jumelle(o, moteur.graine("SIG|3|1"));
  assert.ok(t, "une jumelle");
  assert.notEqual(moteur.cle(t), moteur.cle(o), "un autre facteur");
  assert.equal(moteur.cle(t, true), moteur.cle(o, true), "pour le reste, la même carte");
  assert.ok(moteur.changes(o, t));
});

// --- 2. Petit SPLAT! (monde 1) --------------------------------------------------------------------
const mondeUn = new Function(`
  let currentRand = Math.random;
  ${fn("hashSeed", petit)}
  ${fn("mulberry32", petit)}
  ${fn("rand", petit)}
  const SPLAT_SHAPES = [0, 1, 2, 3, 4, 5, 6, 7];
  /* les jetons se placent avec un canevas : ici, des places factices, autant que de jetons */
  const generateDotPositions = (n) => ({ arr: Array.from({ length: n }, (_, i) => ({ x: i, y: rand() })), r: 8 });
  const generateHiddenDots = (splats, n) => splats.map(() => Array.from({ length: n }, () => ({ x: rand(), y: 0 })));
  ${fn("createItem", petit)}
  ${fn("retirerJetonsSiBesoin", petit)}
  ${fn("eleveJumelle", petit)}
  return {
    cartes(graine, n, mode, cible, taches){ currentRand = mulberry32(graine); const out = []; for(let i = 0; i < n; i++) out.push(createItem(mode, cible, taches)); return out; },
    jumelle: eleveJumelle, hashSeed, sansJetons: (c) => retirerJetonsSiBesoin(c, true), hasard: () => currentRand,
    poser(r){ currentRand = r; }
  };
`)();

test("Petit SPLAT! : chaque carte a sa jumelle — mêmes taches, même exercice ; la tache, les jetons autour et le total changent", () => {
  let n = 0;
  for(const cible of [20, 30, 50, 100]) for(const taches of ["1", "2", "3", "4", "5", "6"]) for(const mode of ["find_hidden", "construct"]){
    const cartes = mondeUn.cartes(cible * 7 + Number(taches) * 13 + mode.length, 40, mode, cible, taches);
    cartes.slice(0, 8).forEach((c) => mondeUn.sansJetons(c)); /* « sansjetons » et « jetons=0 » : des cartes sans jetons autour */
    cartes.forEach((o, i) => {
      o.dessinBande = { L: 400, dots: [] }; /* le dessin « espace=1 » gardé en cache sur la carte */
      const hasard = () => 0.5; mondeUn.poser(hasard);
      const g = mondeUn.hashSeed(`SIG|jumelle|${i}|1`);
      const t = mondeUn.jumelle(o, g);
      const quoi = `cible ${cible}, ${taches} tache(s), ${mode}, carte ${i + 1}`;
      assert.ok(t, `${quoi} : une jumelle`);
      assert.equal(mondeUn.hasard(), hasard, `${quoi} : le hasard de la série est remis`);
      for(const k of ["mode", "numSplats", "clueGiven", "splatShape", "splats", "maxTargetContext"]) assert.equal(t[k], o[k], `${quoi} : ${k}`);
      assert.notEqual(t.hiddenPerSplat, o.hiddenPerSplat, `${quoi} : ce que cache une tache change`);
      if(o.hiddenPerSplat >= 2) assert.ok(t.hiddenPerSplat >= 2, `${quoi} : pas d'un coup un seul jeton par tache`);
      assert.equal(t.hidden, t.hiddenPerSplat * t.numSplats);
      assert.equal(t.total, t.hidden + t.visible);
      assert.ok(t.total <= cible, `${quoi} : dans la cible`);
      assert.notEqual(t.total, o.total, `${quoi} : le total change`);
      assert.equal(t.visible === 0, o.visible === 0, `${quoi} : des jetons autour, ou pas, comme elle`);
      if(o.visible > 0) assert.notEqual(t.visible, o.visible, `${quoi} : pas les mêmes jetons autour`);
      assert.equal(t.dots.arr.length, t.visible);
      assert.ok(!("dessinBande" in t), `${quoi} : pas le dessin de la carte d'origine`);
      assert.equal(JSON.stringify(mondeUn.jumelle(o, g)), JSON.stringify(t), `${quoi} : la même graine, la même jumelle`);
      n++;
    });
  }
  assert.ok(n >= 1900);
});

// --- 3. le branchement --------------------------------------------------------------------------
for(const [nom, page] of [["splat.html", html], ["splat_tache_barre.html", petit]]){
  test(`${nom} : une carte rouge rejouée devient sa jumelle — tirée une fois, une autre si elle revient, l'originale s'il n'y en a pas`, () => {
    const graines = [];
    let reponse = (o, g) => ({ jumelleDe: o.n, g });
    const tirer = (o, g) => { graines.push(g); return reponse(o, g); };
    const run = new Function("tirer", `
      let eleveOriginaux = [{ n: 0 }, { n: 1 }, { n: 2 }], eleveSerie = eleveOriginaux.slice(), eleveJumelleRang = [], eleveJumellesPretes = [];
      const eleveSignatureSerie = () => "SIG", activeGenerationSeed = "7";
      const carteJumelle = tirer, eleveJumelle = tirer;
      ${page === html ? fn("jumelleGraine") : fn("hashSeed", petit)}
      ${fn("eleveJumellePreparer", page)}
      ${fn("eleveJumellePoser", page)}
      return { eleveSerie, eleveOriginaux, preparer: eleveJumellePreparer, poser: eleveJumellePoser };`)(tirer);
    // l'écran « Encore N cartes ! » la prépare (pour sa phrase), le clic la pose : un seul tirage
    const j = run.preparer(1);
    assert.equal(run.preparer(1), j);
    run.poser(1);
    assert.equal(run.eleveSerie[1], j);
    assert.equal(graines.length, 1);
    assert.deepEqual(run.eleveSerie[0], { n: 0 }, "les autres cartes ne bougent pas");
    // elle revient encore : une autre graine, une autre jumelle, toujours tirée de la carte d'origine
    run.poser(1);
    assert.equal(graines.length, 2);
    assert.notEqual(graines[1], graines[0]);
    assert.equal(run.eleveSerie[1].jumelleDe, 1);
    // pas de jumelle, ou une erreur : la carte d'origine revient, comme avant
    reponse = () => null; run.poser(2);
    assert.equal(run.eleveSerie[2], run.eleveOriginaux[2]);
    reponse = () => { throw new Error("cassé"); }; run.poser(0);
    assert.equal(run.eleveSerie[0], run.eleveOriginaux[0]);
  });

  test(`${nom} : « Je rejoue » passe par la jumelle ; la série dans l'ordre, non`, () => {
    const poses = [];
    const run = new Function("poses", `
      let eleveIdx = 0, eleveRejeu = null, eleveSerie = [{}, {}, {}, {}];
      const eleveJumellePoser = (i) => poses.push(i), renderEleveSplat = () => {}, renderEleve = () => {};
      ${fn("eleveCarteSuivante", page)}
      return { suivante: eleveCarteSuivante, rejeu: (r) => { eleveRejeu = r; }, idx: () => eleveIdx };`)(poses);
    run.suivante(); run.suivante();
    assert.equal(run.idx(), 2); assert.deepEqual(poses, []);
    run.rejeu([3, 1]); run.suivante();
    assert.equal(run.idx(), 3); assert.deepEqual(poses, [3]);
    run.suivante();
    assert.equal(run.idx(), 1); assert.deepEqual(poses, [3, 1]);
  });

  test(`${nom} : les cartes d'origine sont gardées dès que la série est construite ; rien de nouveau n'est enregistré`, () => {
    assert.match(page, /eleveSerie = [^;\n]+\.slice\(\);\n\s+eleveOriginaux = eleveSerie\.slice\(\); eleveJumelleRang = \[\]; eleveJumellesPretes = \[\];/);
    const code = ["eleveJumellePreparer", "eleveJumellePoser", page === html ? "carteJumelle" : "eleveJumelle"].map((n) => fn(n, page)).join("\n");
    assert.doesNotMatch(code, /ecrire\(|localStorage|enCours|eleveSauver/);
  });
}

test("splat.html : une étape composée (monde 2) tire chaque jumelle avec les réglages de SA partie, puis remet ceux d'avant", () => {
  const f = fn("genererSerieComposee");
  assert.match(f, /for\(const c of cards\) jumelleParties\.set\(c, principale\);/);
  assert.match(f, /appliquerConfiguration\(new URLSearchParams\(partie\)\);\n      jumelleDernierePartie = partie;/);
  assert.match(f, /for\(const c of cards\)\{ toutes\.push\(c\); jumelleParties\.set\(c, partie\); \}/);
  const j = fn("carteJumelle");
  assert.match(j, /const partie = eleveSuite\.length \? jumelleParties\.get\(o\) : undefined;\n  if\(partie !== undefined\) appliquerConfiguration\(new URLSearchParams\(partie\)\);/);
  assert.match(j, /\}finally\{\n    remettre\(\);\n    if\(partie !== undefined && jumelleDernierePartie !== null\) appliquerConfiguration\(new URLSearchParams\(jumelleDernierePartie\)\);/);
});

test("ÉquaSplat (mondes 5 et 6) : pas de jumelle (décidé le 05/10/2026)", () => {
  assert.doesNotMatch(equa, /jumelle/i);
});
