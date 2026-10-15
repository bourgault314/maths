/* SPLAT! monde 6, l'échauffement des relatifs — lot 1 « le générateur » (14/10/2026).
   Les fiches É1-É3 jouent avec des billes 1 / −1. L'outil (outils/splat_equations.html, entiers
   relatifs) apprend :
     - « Solution max » (xMax) : la solution ne dépasse pas ce nombre ; avec des jetons de 1, elle
       ne valait jamais que ±1. Vide : comme avant (la borne reste « Jetons max ») ;
     - « Un seul signe par plateau » (unites=1) : des billes, toutes 1 ou toutes −1 sur un plateau ;
     - « suite » lit jusqu'à 11 parties (une fiche de 12 cartes, une graine chacune) ;
     - à l'impression 6/page (plateaux gauche/droite), à partir de 5 jetons sur un plateau, deux
       rangées : les billes grossissent comme les autres jetons.
   On EXÉCUTE le générateur de l'outil (sans navigateur) : les graines des fiches 38-43 et des
   défis redonnent exactement les séries publiées, et les 36 cartes de l'échauffement sont
   celles de la liste annotée. Puis la table de dessin des deux rangées, et les réglages
   partagés (une partie de « suite » sans « unites » repart décochée). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const lire = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");
const html = await lire("outils/splat_equations.html");
const univers = await lire("outils/splat_univers.html");
const courte = await lire("splat/relatifs/livret/index.html");
const render = await lire("_sources/livret-splat-relatifs/render.py");

/* le texte d'une fonction de l'outil, accolades comptées */
function fn(nom){
  const debut = html.indexOf(`\nfunction ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = html.indexOf("{", html.indexOf(")", debut)), prof = 0;
  for(; i < html.length; i++){
    if(html[i] === "{") prof++;
    else if(html[i] === "}" && --prof === 0) break;
  }
  return html.slice(debut + 1, i + 1);
}
const ligne = (debut) => {
  const l = html.split("\n").find((x) => x.startsWith(debut));
  assert.ok(l, `${debut} introuvable`);
  return l;
};

// ------------------------------------------------------------------ le générateur, exécuté
const GEN = new Function(`
  ${ligne("const xChar = ")}
  ${ligne("const variableChars = ")}
  ${fn("pickVariableChar")}
  ${fn("mulberry32")}
  ${fn("makeRng")}
  ${fn("rInt")}
  ${fn("shuffleInPlace")}
  ${fn("clamp")}
  ${fn("numberOr")}
  ${fn("normalizeEquationFormMode")}
  ${fn("pickEquationGeneratorForm")}
  ${fn("pickVisibleCountAtLeastOne")}
  ${fn("pickVisibleCountOptional")}
  ${fn("randomSignedCompositionNonZero")}
  ${fn("genEquationSigned")}
  ${fn("genEquationSignedStep")}
  ${fn("assignPositionsEquation")}
  function genEquation(){ throw new Error("6000 essais sans carte"); }
  let solutionNulle = false;
  const champ = (v) => ({ value: v });
  const numTasksEl = champ("3"), numVisibleMinEl = champ("0"), numVisibleMaxEl = champ("3"),
        numTotalMinEl = champ("-20"), numTotalMaxEl = champ("20"), numBeadAbsMaxEl = champ("30"),
        numSolutionMaxEl = champ(""), numUnitesSeulesEl = { checked: false }, numOpposeModeEl = champ("off"),
        eqUnknownModeEl = champ("X_PLUS_B_EQ_C");
  /* une partie d'adresse (mode=EQPMSTEP&…) → ses cartes, comme generate() de l'outil */
  return function serie(q){
    const p = new URLSearchParams(q);
    if(p.get("mode") !== "EQPMSTEP") throw new Error("mode " + p.get("mode"));
    const v = (nom, defaut) => p.has(nom) ? p.get(nom) : defaut;
    eqUnknownModeEl.value = v("form", "X_PLUS_B_EQ_C");
    numTasksEl.value = v("tasksMax", "3");
    numVisibleMinEl.value = v("visibleMin", "0");
    numVisibleMaxEl.value = v("visibleMax", "3");
    numTotalMinEl.value = v("totalMin", "-20");
    numTotalMaxEl.value = v("totalMax", "20");
    numBeadAbsMaxEl.value = v("beadMax", "30");
    numSolutionMaxEl.value = v("xMax", "");
    numUnitesSeulesEl.checked = p.get("unites") === "1";
    numOpposeModeEl.value = v("opposites", "off");
    solutionNulle = p.get("zero") === "1";
    const rng = makeRng(p.get("seed"));
    const out = [];
    for(let i = 0; i < Number(v("cards", "1")); i++){
      const c = genEquationSignedStep(rng);
      assignPositionsEquation(c, rng);
      out.push(c);
    }
    return out;
  };
`)();

/* la carte telle que le jeu de l'élève la reçoit (carteDuJeuEquaSplat, entiers relatifs) */
function versJeu(c){
  const cote = (s) => {
    const r = s.opposeFlags.map((o) => (o ? "-x" : "x"));
    r.sort((a, b) => (a === b ? 0 : a === "x" ? -1 : 1));
    s.visible.forEach((n) => { if(n !== 0) r.push(n); });
    if(!r.length) r.push(0);
    return r;
  };
  return { variable: c.varChar, x: c._eq.x, left: cote(c._eq.left), right: cote(c._eq.right) };
}
/* l'équation comme l'outil l'écrit (formes sans tache opposée) */
function ecrite(c){
  const cote = (s) => {
    const t = [];
    if(s.tasks) t.push((s.tasks > 1 ? s.tasks : "") + c.varChar);
    s.visible.forEach((n) => t.push(t.length ? (n < 0 ? "− " + -n : "+ " + n) : (n < 0 ? "−" + -n : String(n))));
    return t.join(" ");
  };
  return cote(c._eq.left) + " = " + cote(c._eq.right);
}

// ------------------------------------------------------------------ les fiches publiées
const bloc = (t, a, b) => t.slice(t.indexOf(a), t.indexOf(b, t.indexOf(a)));
const ctx = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
vm.runInContext(bloc(univers, "const PS=", "const PROF =") + ";globalThis.X={MONDES};", ctx);
const { MONDES } = JSON.parse(JSON.stringify(ctx.X));
const RELATIFS_TOUT = MONDES.find((m) => m.idp === "e3");
/* les fiches 38 à 43 (le lot 3 a mis l'échauffement É1-É3 devant elles, des étapes à code) */
const RELATIFS = { ...RELATIFS_TOUT, etapes: RELATIFS_TOUT.etapes.filter((e) => !e.code) };
const decode = (u) => JSON.parse(Buffer.from(u.slice(u.indexOf("#data=") + 6).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
const defi = (form, opp, tmax, g) => `mode=EQPMSTEP&form=${form}&opposites=${opp}&tasksMax=${tmax}&visibleMin=2&visibleMax=3`
  + `&beadMax=60&totalMin=-99&totalMax=99&cards=2&seed=${g}&unknown=letter`;
const DEFIS = [...bloc(render, "FICHES_DEFI = [", "\n]\n").matchAll(/qr="(\d+d)", parcours="(m4e\d)",[^\n]*\n\s+parties=\[([\s\S]*?)\]\),/g)]
  .map((m) => ({ qr: m[1], parties: [...m[3].matchAll(/defi\("(\w+)", "(\w+)", (\d+), (\d+)\)/g)].map((x) => defi(x[1], x[2], x[3], x[4])),
                 jeu: decode(courte.match(new RegExp(`"${m[1]}": "([^"]+)"`))[1]).serie }));

test("graines inchangées : les fiches 38-43 et les six défis redonnent les séries publiées, carte pour carte", () => {
  assert.equal(RELATIFS.etapes.length, 6);
  assert.equal(DEFIS.length, 6);
  const fiches = [...RELATIFS.etapes.map((e) => ({ nom: e.p, parties: [e.q, ...(e.suite || [])], jeu: decode(e.j).serie })),
                  ...DEFIS.map((d) => ({ nom: d.qr, parties: d.parties, jeu: d.jeu }))];
  let n = 0;
  for(const f of fiches){
    const cartes = f.parties.flatMap((q) => GEN(q));
    assert.equal(cartes.length, 12, f.nom);
    cartes.forEach((c, i) => {
      const attendu = f.jeu[i];
      assert.deepEqual(versJeu(c), { variable: attendu.variable, x: attendu.x, left: attendu.left, right: attendu.right }, `${f.nom}, carte ${i + 1}`);
      n++;
    });
    // aucune de ces adresses n'écrit les nouveaux réglages
    f.parties.forEach((q) => assert.doesNotMatch(q, /xMax|unites/));
  }
  assert.equal(n, 144);
});

/* Les 36 cartes de l'échauffement (LISTE-annotee-36-equations.md, 14/10/2026) : réglage, graine,
   l'équation écrite par l'outil, la solution. Avec des billes (« Jetons max » = 1), la solution
   va jusqu'à 6 : xMax=6. */
const PREFIXE = "mode=EQPMSTEP&opposites=off";
const REGLAGES = {
  e1: "&beadMax=1&xMax=6&form=X_PLUS_B_EQ_C&visibleMin=1&visibleMax=6&totalMin=-6&totalMax=6",
  e1z: "&beadMax=1&xMax=6&form=X_PLUS_B_EQ_C&visibleMin=1&visibleMax=6&totalMin=-6&totalMax=6&zero=1",
  e2a: "&beadMax=1&xMax=6&form=AX_EQ_C&tasksMax=3&visibleMin=2&visibleMax=6&totalMin=-6&totalMax=6",
  e2az: "&beadMax=1&xMax=6&form=AX_EQ_C&tasksMax=3&visibleMin=2&visibleMax=6&totalMin=-6&totalMax=6&zero=1",
  e2b: "&beadMax=1&xMax=6&form=ONE_SIDE&tasksMax=3&visibleMin=1&visibleMax=6&totalMin=-6&totalMax=6",
  e3a: "&beadMax=5&visibleMin=1&visibleMax=1&totalMin=-9&totalMax=9&form=X_PLUS_B_EQ_C",
  e3b: "&beadMax=5&visibleMin=1&visibleMax=1&totalMin=-9&totalMax=9&form=AX_EQ_C&tasksMax=3",
  e3c: "&beadMax=5&visibleMin=1&visibleMax=1&totalMin=-9&totalMax=9&form=ONE_SIDE&tasksMax=3",
  e3cz: "&beadMax=5&visibleMin=1&visibleMax=1&totalMin=-9&totalMax=9&form=ONE_SIDE&tasksMax=3&zero=1"
};
const ECHAUFFEMENT = {
  E1: [["e1", 5529, "𝑡 + 1 + 1 = 1 + 1 + 1 + 1 + 1", 3], ["e1", 2832, "𝑎 + 1 + 1 + 1 + 1 + 1 = 1 + 1 + 1", -2],
       ["e1", 2479, "1 + 1 + 1 = 𝑡 + 1 + 1 + 1 + 1 + 1 + 1", -3], ["e1", 62, "𝑎 − 1 − 1 − 1 = −1", 2],
       ["e1", 4969, "−1 − 1 − 1 − 1 − 1 = 𝑛 − 1", -4], ["e1", 426, "−1 = 𝑥 − 1 − 1 − 1 − 1 − 1 − 1", 5],
       ["e1", 2843, "𝑏 + 1 + 1 = −1 − 1", -4], ["e1", 4560, "−1 − 1 = 𝑛 + 1 + 1 + 1", -5],
       ["e1", 2788, "𝑐 − 1 − 1 = 1 + 1 + 1", 5], ["e1", 810, "1 + 1 + 1 + 1 = 𝑚 − 1 − 1", 6],
       ["e1", 1229, "𝑐 − 1 − 1 + 1 = 1 + 1", 3], ["e1z", 411, "−1 + 1 + 1 = 𝑚 + 1", 0]],
  E2: [["e2a", 2460, "2𝑚 = 1 + 1 + 1 + 1", 2], ["e2a", 2476, "1 + 1 + 1 + 1 + 1 + 1 = 2𝑐", 3],
       ["e2a", 690, "2𝑛 = −1 − 1 − 1 − 1 − 1 − 1", -3], ["e2a", 427, "−1 − 1 − 1 = 3𝑏", -1],
       ["e2az", 1831, "2𝑚 = −1 + 1", 0], ["e2a", 1573, "2𝑐 = −1 − 1 − 1 + 1 − 1 − 1", -2],
       ["e2b", 5585, "2𝑏 + 1 + 1 = 1 + 1 + 1 + 1 + 1 + 1", 2], ["e2b", 6823, "−1 − 1 − 1 = 2𝑥 + 1", -2],
       ["e2b", 6460, "2𝑡 − 1 − 1 = 1 + 1 + 1 + 1", 3], ["e2b", 7305, "1 + 1 = 3𝑎 + 1 + 1 + 1 + 1 + 1", -1],
       ["e2b", 5799, "2𝑥 + 1 + 1 = −1 − 1 − 1 − 1", -3], ["e2b", 844, "3𝑎 − 1 + 1 = −1 + 1 + 1 + 1 + 1", 1]],
  E3: [["e3a", 2281, "𝑡 + 3 = −2", -5], ["e3a", 2819, "−1 = 𝑎 + 2", -3], ["e3a", 2147, "𝑏 − 4 = 1", 5],
       ["e3a", 1325, "2 = 𝑎 − 2", 4], ["e3b", 2906, "2𝑥 = −4", -2], ["e3b", 1103, "4 = 2𝑏", 2],
       ["e3c", 2457, "2𝑚 + 3 = −5", -4], ["e3c", 1513, "−1 = 3𝑛 + 5", -2], ["e3c", 313, "2𝑚 − 3 = 5", 4],
       ["e3c", 47, "4 = 3𝑐 − 5", 3], ["e3cz", 1042, "2 = 2𝑛 + 2", 0], ["e3c", 1869, "2𝑐 + 4 = −2", -3]]
};
const partie = ([r, g]) => `${PREFIXE}${REGLAGES[r]}&cards=1&seed=${g}&unknown=letter`;

test("échauffement : les 36 cartes de la liste annotée, 12 par fiche, aucune dans les fiches 38-43", () => {
  const publiees = new Set(RELATIFS.etapes.flatMap((e) => e.eqs));
  for(const [code, liste] of Object.entries(ECHAUFFEMENT)){
    assert.equal(liste.length, 12, code);
    liste.forEach((c) => {
      const [carte] = GEN(partie(c));
      assert.equal(ecrite(carte), c[2], `${code}, graine ${c[1]}`);
      assert.equal(carte._eq.x, c[3], `${code}, graine ${c[1]} : la solution`);
      assert.ok(!publiees.has(c[2]), `${c[2]} est déjà dans une fiche`);
    });
  }
  // sans xMax, les billes ne donnent que ±1 : la même graine change de carte
  const sans = GEN(partie(ECHAUFFEMENT.E1[1]).replace("&xMax=6", ""))[0];
  assert.equal(Math.abs(sans._eq.x), 1);
});

test("xMax : vide = la borne « Jetons max » (comme avant) ; rempli, la solution ne le dépasse pas", () => {
  const solutions = (q) => Array.from({ length: 60 }, (_, k) => GEN(`${q}&cards=5&seed=${k + 1}`).map((c) => Math.abs(c._eq.x))).flat();
  const billes = "mode=EQPMSTEP&opposites=off&beadMax=1&form=X_PLUS_B_EQ_C&visibleMin=1&visibleMax=6&totalMin=-6&totalMax=6";
  assert.deepEqual([...new Set(solutions(billes))], [1], "jetons de 1, sans xMax : la solution vaut ±1");
  const avec = solutions(billes + "&xMax=6");
  assert.ok(Math.max(...avec) === 6 && avec.includes(2) && avec.every((x) => x >= 1 && x <= 6), "xMax=6 : de 1 à 6");
  // xMax abaisse aussi la borne : jetons jusqu'à 30, solution au plus 3
  const bas = solutions("mode=EQPMSTEP&opposites=off&beadMax=30&form=ONE_SIDE&tasksMax=3&visibleMin=1&visibleMax=2&totalMin=-30&totalMax=30&xMax=3");
  assert.ok(bas.every((x) => x >= 1 && x <= 3) && bas.includes(3));
  // xMax=0 et xMax vide : les mêmes cartes qu'avant, à la graine près
  const q = "mode=EQPMSTEP&opposites=mix&tasksMax=5&visibleMin=1&visibleMax=3&beadMax=25&totalMin=-40&totalMax=40&form=BOTH&cards=12&seed=4242";
  const reference = JSON.stringify(GEN(q));
  assert.equal(JSON.stringify(GEN(q + "&xMax=0")), reference);
  assert.equal(JSON.stringify(GEN(q + "&xMax=")), reference);
  // le code : la borne seule change, rien n'est tiré en plus
  const g = fn("genEquationSigned");
  assert.match(g, /const xMaxUser = clamp\(Math\.round\(numberOr\(numSolutionMaxEl\?\.value, 0\)\), 0, 99\);/);
  assert.match(g, /xAbsMax = clamp\(xAbsMax, 1, xMaxUser > 0 \? xMaxUser : maxAbs\);\n    const absX = rInt\(rng, 1, xAbsMax\);/);
});

test("unites=1 : des billes d'un seul signe sur chaque plateau ; décochée, rien ne change", () => {
  const q = "mode=EQPMSTEP&opposites=off&beadMax=1&xMax=6&form=ONE_SIDE&tasksMax=3&visibleMin=1&visibleMax=6&totalMin=-6&totalMax=6&cards=10";
  let melanges = 0, plateaux = 0;
  for(let s = 1; s <= 40; s++){
    for(const c of GEN(`${q}&seed=${s}&unites=1`)){
      for(const cote of [c._eq.left, c._eq.right]){
        if(!cote.visible.length) continue;
        plateaux++;
        const somme = cote.visible.reduce((a, b) => a + b, 0);
        assert.ok(cote.visible.every((v) => v === Math.sign(somme)), `un seul signe : ${cote.visible}`);
        assert.equal(cote.visible.length, Math.abs(somme));
      }
    }
    for(const c of GEN(`${q}&seed=${s}`)){
      for(const cote of [c._eq.left, c._eq.right]) if(new Set(cote.visible.map(Math.sign)).size > 1) melanges++;
    }
  }
  assert.ok(plateaux > 400, "assez de plateaux regardés");
  assert.ok(melanges > 0, "décochée, les signes se mélangent encore sur un plateau");
  // l'exemple de couverture prévu pour le livret (lot 3) : 𝑛 + 1 + 1 + 1 = −1 − 1, 𝑛 = −5
  const [ex] = GEN("mode=EQPMSTEP&opposites=off&unknown=letter&beadMax=1&unites=1&form=X_PLUS_B_EQ_C&visibleMin=2&visibleMax=3&xMax=9&totalMin=-6&totalMax=6&cards=1&seed=9");
  assert.equal(ecrite(ex), "𝑛 + 1 + 1 + 1 = −1 − 1");
  assert.equal(ex._eq.x, -5);
  // le code : la composition d'un plateau, et rien d'autre
  const g = fn("genEquationSigned");
  assert.match(g, /const composerPlateau = \(somme, n\) => unitesSeules\n    \? \(Math\.abs\(somme\) === n \? new Array\(n\)\.fill\(somme < 0 \? -1 : 1\) : null\)\n    : randomSignedCompositionNonZero\(rng, somme, n, maxAbs\);/);
  assert.match(g, /const leftVisible  = \(vCountL === 0\) \? \[\] : composerPlateau\(VL, vCountL\);/);
  assert.match(g, /const rightVisible = \(vCountR === 0\) \? \[\] : composerPlateau\(VR, vCountR\);/);
});

// ------------------------------------------------------------------ réglages, adresse, « suite »
test("les deux réglages : à côté de « Jetons max », en relatifs seulement, dans l'adresse et « Copier le lien »", () => {
  assert.match(html, /<input id="numSolutionMax" type="number" min="0" max="99" value="" placeholder="= jetons" \/>/);
  assert.match(html, /<input type="checkbox" id="numUnitesSeules" style="flex:0 0 auto; margin:0;">/);
  assert.ok(html.indexOf('id="numBeadAbsMaxWrap"') < html.indexOf('id="numSolutionMaxWrap"')
    && html.indexOf('id="numSolutionMaxWrap"') < html.indexOf('id="numOpposeModeWrap"'), "Jetons max | Solution max | Opposées");
  assert.match(html, /id="numSolutionMaxWrap" style="flex:1; min-width:0; display:none"/);
  assert.match(html, /id="numUnitesSeulesRow" style="margin-top:0; display:none"/);
  const sync = fn("syncSettingsUI");
  assert.match(sync, /if\(numSolutionMaxWrapEl\) numSolutionMaxWrapEl\.style\.display = isSignedEquationModeValue\(act\) \? "block" : "none";/);
  assert.match(sync, /if\(numUnitesSeulesRowEl\) numUnitesSeulesRowEl\.style\.display = isSignedEquationModeValue\(act\) \? "flex" : "none";/);
  assert.match(html, /numBeadAbsMaxEl, numSolutionMaxEl, numUnitesSeulesEl, numOpposeModeEl, numColorModeEl, eqUnknownModeEl, seedNEl\n\]\.forEach/);
  assert.match(html, /const sharedNames = \[[^\]]*"beadMax", "xMax", "unites", "opposites"[^\]]*\]/);
  assert.match(fn("buildShareUrl"), /if\(name === "xMax" && !\(Number\(el\.value\) > 0\)\) return;\n    if\(name === "unites" && !el\.checked\) return;/);
  // l'aide « ? » : une ligne pour chacun
  assert.match(html, /<li><strong>Solution max<\/strong> \(\|𝑥\|\) : la solution ne dépasse pas ce nombre\./);
  assert.match(html, /<li><strong>Un seul signe par plateau<\/strong> : des jetons 1 ou −1, tous du même signe sur un plateau\.<\/li>/);
});

test("« suite » : 11 parties après la première ; une partie sans « unites » ni « xMax » repart des réglages d'ouverture", () => {
  assert.match(fn("loadSharedConfiguration"), /\.split\(";"\)\.map\(part => part\.trim\(\)\)\.filter\(Boolean\)\.slice\(0, 11\);/);
  // genererSerieComposee : chaque partie repart de la photo d'ouverture, puis applique son adresse
  assert.match(fn("genererSerieComposee"), /for\(const partie of serieSuite\)\{\s*try\{\s*restaurerReglages\(reglagesOuverture\);\s*appliquerConfiguration\(new URLSearchParams\(partie\)\);/);
  // la photo et les réglages partagés, exécutés avec de faux champs
  const champs = {
    numSolutionMax: { tagName: "INPUT", type: "number", value: "", checked: false, min: "0", max: "99" },
    numUnitesSeules: { tagName: "INPUT", type: "checkbox", value: "on", checked: false, min: null, max: null },
    numBeadAbsMax: { tagName: "INPUT", type: "number", value: "30", checked: false, min: "1", max: "99" }
  };
  Object.values(champs).forEach((c) => {
    c.getAttribute = (n) => c[n];
    c.setAttribute = (n, v) => { c[n] = String(v); };
    c.removeAttribute = (n) => { c[n] = null; };
  });
  const f = new Function("champs", `
    const document = { querySelectorAll: () => Object.values(champs) };
    let equationStepView = "equation", lastActivityForSigned = "EQPMSTEP", lastActivityForBounds = "EQPMSTEP",
        _tasksUIKeyPrev = "", _numTasksSavedNumberedMax = 1, _numTasksSavedNumberedMin = 1, _numTasksSavedEquationMax = 1;
    const lastSignedModeSettings = { NPM: null, EQPM: null }, lastNumberedTotalBounds = {};
    const numBeadAbsMaxEl = champs.numBeadAbsMax, numSolutionMaxEl = champs.numSolutionMax, numUnitesSeulesEl = champs.numUnitesSeules;
    const eqUnknownModeEl = null, numTasksEl = null, numVisibleMinEl = null, numVisibleMaxEl = null, numTotalMinEl = null,
          numTotalMaxEl = null, numUnitVisibleMaxEl = null, numOpposeModeEl = null, numColorModeEl = null, signedWritingModeEl = null;
    ${fn("isSignedEquationModeValue")}
    ${fn("photographierReglages")}
    ${fn("restaurerReglages")}
    ${fn("setSelectFromShare")}
    ${fn("setNumberFromShare")}
    ${fn("readBooleanFromShare")}
    ${fn("setCheckboxFromShare")}
    ${fn("getEquationShareControls")}
    ${fn("applyShareControl")}
    const appliquer = (q) => getEquationShareControls("EQPMSTEP").forEach(([n, el]) => applyShareControl(new URLSearchParams(q), n, el));
    return { photo: photographierReglages, restaurer: restaurerReglages, appliquer,
             noms: (act) => getEquationShareControls(act).map(([n]) => n) };`);
  const t = f(champs);
  assert.ok(t.noms("EQPMSTEP").includes("xMax") && t.noms("EQPMSTEP").includes("unites"));
  assert.ok(!t.noms("EQSTEP").includes("xMax") && !t.noms("EQSTEP").includes("unites"), "hors relatifs, ni l'un ni l'autre");
  const ouverture = t.photo();
  // la première partie (l'adresse) coche « unites » et écrit xMax=6
  t.appliquer("mode=EQPMSTEP&beadMax=1&xMax=6&unites=1");
  assert.deepEqual([champs.numSolutionMax.value, champs.numUnitesSeules.checked, champs.numBeadAbsMax.value], ["6", true, "1"]);
  // une partie suivante sans eux : comme ouverte seule — décochée, vide
  t.restaurer(ouverture);
  t.appliquer("mode=EQPMSTEP&beadMax=5");
  assert.deepEqual([champs.numSolutionMax.value, champs.numUnitesSeules.checked, champs.numBeadAbsMax.value], ["", false, "5"]);
  // bornes : 0-99, entier ; une valeur hors bornes est ignorée
  t.restaurer(ouverture);
  t.appliquer("xMax=150&unites=oui");
  assert.deepEqual([champs.numSolutionMax.value, champs.numUnitesSeules.checked], ["", false]);
  t.appliquer("xMax=2.5");
  assert.equal(champs.numSolutionMax.value, "");
  t.appliquer("xMax=12&unites=0");
  assert.deepEqual([champs.numSolutionMax.value, champs.numUnitesSeules.checked], ["12", false]);
});

// ------------------------------------------------------------------ deux rangées à l'impression
const TABLE = new Function(`
  ${ligne("const EQ_PRINT_BEAD_SCALE = ")}
  ${ligne("const EQ_PRINT_BEAD_EDGE = ")}
  ${ligne("const EQ_PRINT_BEAD_GAP = ")}
  ${ligne("const EQ_PRINT_BEAD_SPLAT_GAP = ")}
  ${ligne("const EQ_PRINT_GRAND_BEAD_SCALE = ")}
  ${ligne("const EQ_PRINT_GRAND_SPLAT_MAX = ")}
  ${ligne("const EQ_PRINT_GRAND_EDGE = ")}
  ${ligne("const EQ_PRINT_GRAND_BOTTOM = ")}
  ${ligne("const EQ_PRINT_GRAND_GAP = ")}
  ${ligne("const EQ_PRINT_RANGEES_MIN = ")}
  ${fn("eqPrintBeadBox")}
  ${fn("eqPrintBeadPlace")}
  ${fn("eqPrintBeadsFit")}
  ${fn("eqPrintBeadSlide")}
  ${fn("eqPrintBeadRangeesPlateau")}
  ${fn("eqPrintBeadDeuxRangees")}
  ${fn("eqPrintBeadLayout")}
  ${fn("eqPrintGrandesTaches")}
  return { eqPrintBeadLayout, eqPrintBeadsFit, eqPrintGrandesTaches, EQ_PRINT_RANGEES_MIN, EQ_PRINT_BEAD_GAP, EQ_PRINT_BEAD_EDGE, EQ_PRINT_BEAD_SPLAT_GAP };`)();
const GAUCHE = { x: 120, y: 190, w: 680, h: 650 }, DROITE = { x: 800, y: 190, w: 680, h: 650 };
/* n jetons à leurs places d'écran (assignPositionsEquation : une rangée à y ≈ 720) */
const rangee = (n, tray) => Array.from({ length: n }, (_, i) => ({ p: { cx: Math.round(tray.x + 70 + (540 / n) * (i + 0.5)), cy: 720 }, tray, baseR: 34 }));

test("6/page : à partir de 5 jetons sur un plateau, deux rangées (3 + 2, 3 + 3) ; les billes grossissent comme les autres", () => {
  const t = TABLE;
  assert.equal(t.EQ_PRINT_RANGEES_MIN, 5);
  for(const n of [5, 6]){
    const vis = rangee(n, GAUCHE);
    const une = t.eqPrintBeadLayout(vis, [], 34, 64, 2);              // comme avant (une rangée)
    const deux = t.eqPrintBeadLayout(vis, [], 34, 64, 2, true);       // 6/page gauche/droite
    assert.ok(une.R < 50, `${n} jetons en une rangée : ${une.R}`);
    assert.equal(deux.R, 64, `${n} jetons en deux rangées : le plus gros rayon permis (0,64 × la tache de 100)`);
    assert.equal(t.eqPrintBeadsFit(vis, deux.pts, [], deux.R), true);
    const ys = [...new Set(deux.pts.map((p) => p.cy))].sort((a, b) => a - b);
    assert.equal(ys.length, 2, "deux rangées");
    const haut = deux.pts.filter((p) => p.cy === ys[0]), bas = deux.pts.filter((p) => p.cy === ys[1]);
    assert.deepEqual([haut.length, bas.length], [n - 3, 3], "la plus longue en bas");
    // ordre de lecture : la rangée du haut, puis celle du bas, de gauche à droite
    assert.deepEqual(deux.pts.slice(0, n - 3), haut);
    for(const r of [haut, bas]) for(let k = 1; k < r.length; k++) assert.ok(r[k].cx > r[k - 1].cx);
    // au milieu du plateau, en bas, dans les règles d'une rangée
    assert.equal(Math.round((bas[0].cx + bas[2].cx) / 2), GAUCHE.x + GAUCHE.w / 2);
    assert.equal(bas[0].cy, GAUCHE.y + GAUCHE.h - 64 - t.EQ_PRINT_BEAD_EDGE);
    // en quinconce sous 3 + 2 : les deux du haut au milieu des trois du bas
    if(n === 5) assert.deepEqual(haut.map((p) => p.cx), [(bas[0].cx + bas[1].cx) / 2, (bas[1].cx + bas[2].cx) / 2].map(Math.round));
  }
  // 4 jetons et moins : la même disposition qu'avant, au pixel
  for(const n of [1, 2, 3, 4]){
    const vis = rangee(n, GAUCHE);
    assert.deepEqual(t.eqPrintBeadLayout(vis, [], 34, 64, 2, true), t.eqPrintBeadLayout(vis, [], 34, 64, 2), `${n} jeton(s)`);
  }
  // une tache sur le plateau : le bloc l'évite (écart jeton → tache tenu)
  const tache = [{ cx: 460, cy: 324, r: 100 }];
  const r = t.eqPrintBeadLayout(rangee(6, GAUCHE), tache, 34, 64, 2, true);
  assert.equal(r.R, 64);
  assert.equal(t.eqPrintBeadsFit(rangee(6, GAUCHE), r.pts, tache, r.R), true);
  // un plateau à 6, l'autre à 2 : un seul rayon pour la carte, l'autre plateau en une rangée
  const carte = [...rangee(2, GAUCHE), ...rangee(6, DROITE)];
  const rc = t.eqPrintBeadLayout(carte, [], 34, 64, 2, true);
  assert.equal(rc.R, 64);
  assert.deepEqual(rc.pts.slice(0, 2).map((p) => p.cy), [720, 720]);
  assert.equal(new Set(rc.pts.slice(2).map((p) => p.cy)).size, 2);
  // jamais plus petit qu'en une rangée : si les deux rangées ne tiennent pas, on garde l'ancienne
  const etroit = { x: 120, y: 690, w: 680, h: 150 };
  const bas2 = rangee(5, etroit).map((v) => ({ ...v, p: { cx: v.p.cx, cy: 765 } }));
  const avant = t.eqPrintBeadLayout(bas2, [], 34, 64, 2);
  assert.deepEqual(t.eqPrintBeadLayout(bas2, [], 34, 64, 2, true), avant);
});

test("6/page : une seule rangée de taches au-dessus de 5 jetons ou plus monte en haut du plateau, sans changer de taille", () => {
  const cote = (n, xs) => {
    const splats = xs.map((cx) => ({ cx, cy: 430, r: 74 }));
    return { beadR: 34, posV: Array.from({ length: n }, (_, i) => ({ cx: 200 + 80 * i, cy: 720 })), splats, posH: splats.map((s) => ({ cx: s.cx, cy: s.cy })) };
  };
  const trays = { left: GAUCHE, right: DROITE, midX: 800 };
  // 2 jetons : rien ne change (430)
  let p = TABLE.eqPrintGrandesTaches(trays, { left: cote(2, [460]), right: cote(1, []) });
  assert.deepEqual(p.left.splats[0], { cx: 460, cy: 430, r: 100 });
  // 4 jetons : rien ne change
  p = TABLE.eqPrintGrandesTaches(trays, { left: cote(4, [460]), right: cote(1, []) });
  assert.equal(p.left.splats[0].cy, 430);
  // 5 jetons : la tache monte en haut du plateau (24 + 1,1 × r), même taille
  p = TABLE.eqPrintGrandesTaches(trays, { left: cote(5, [460]), right: cote(1, []) });
  assert.deepEqual(p.left.splats[0], { cx: 460, cy: 190 + 24 + 110, r: 100 });
  assert.deepEqual(p.left.posH[0], { cx: 460, cy: 324 });
  // deux taches sur une rangée, 6 jetons : elles montent ensemble
  p = TABLE.eqPrintGrandesTaches(trays, { left: cote(6, [325, 595]), right: cote(1, []) });
  assert.deepEqual(p.left.splats.map((s) => s.cy), [324, 324]);
  // la table de dessin : deux rangées en 6/page seulement (« grand »)
  assert.match(fn("createEqPrintBeadTable"), /eqPrintBeadLayout\(visibles, splats, baseR, Math\.min\(cap, creux\), scale, grand\);/);
});
