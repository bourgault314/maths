/* SPLAT! — « A fraction — Jetons et parts » (lot F1, 15/10/2026 : la projection).
   Conception F0 validée par Gwenaël le 15/10 : des jetons entiers et des disques partagés en parts
   égales (Fraction Splats de Steve Wyborney), un dénominateur par carte, une tache, un TOTAL toujours
   entier, la tache cache parfois un entier ; l'écriture « 3 + 3/4 » (écriture A) avec le dénominateur
   de la carte (« 3 + 2/4 », pas simplifié) ; les parts dans la couleur de leur famille (bandes et
   disques de fractions du site, un ton plus soutenu). Quatre niveaux :
     1 demis, parts d'un demi, les parts visibles ne dépassent pas l'unité ;
     2 tiers et quarts, parts unitaires, les parts peuvent dépasser l'unité (5 quarts) ;
     3 demis, tiers, quarts, plusieurs parts sur un disque ;
     4 cinquièmes, sixièmes, huitièmes.
   Ces tests exécutent les fonctions de la page telles quelles (extraites du fichier). Le mode A ne
   bouge pas : sa preuve au pixel se joue dans un navigateur (splat-fractions-lot-F1-preuve.mjs, dans
   le dossier du lot) ; ici, ce qui se vérifie sans navigateur. */
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

const FONCTIONS = ["frPgcd", "fr", "frNorm", "frAdd", "frSub", "frEq", "frSomme", "frDecompose", "frTexte",
  "ufNiveau", "ufCouleurs", "ufTotalPlafond", "ufDecouper", "ufComposer", "ufCarte", "genUnitsFractionsAvec",
  "ufPieces", "ufPiecesCalcul", "ufSecteur"];
const moteur = new Function(`
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function clamp(")}
  ${FONCTIONS.map(fn).join("\n")}
  return { ${FONCTIONS.join(", ")}, mulberry32 };
`)();
const { fr, frAdd, frSub, frEq, frSomme, frNorm, frTexte, frDecompose, genUnitsFractionsAvec, ufPiecesCalcul, ufSecteur, ufCouleurs, mulberry32 } = moteur;

const REGLAGES = { niveau:1, visibleMax:8, hiddenMax:6, totalMin:3, totalMax:10 };
function serie(R, graine, n){
  const rng = mulberry32(graine);
  return Array.from({ length:n }, () => genUnitsFractionsAvec(rng, R));
}
const DENOMINATEURS = { 1:[2], 2:[3, 4], 3:[2, 3, 4], 4:[5, 6, 8] };

// --- les fractions --------------------------------------------------------------------------
test("fractions exactes : 1/3 + 1/3 + 1/3 = 1, sans nombre à virgule", () => {
  assert.deepEqual(frSomme([fr(1, 3), fr(1, 3), fr(1, 3)]), fr(1, 1));
  assert.deepEqual(frAdd(fr(5, 8), fr(3, 8)), fr(1, 1));
  assert.deepEqual(frSub(fr(7, 1), fr(13, 4)), fr(15, 4));
  assert.deepEqual(frNorm(fr(6, 8)), fr(3, 4));
  assert.ok(frEq(fr(2, 4), fr(1, 2)));
  assert.ok(!frEq(fr(2, 4), fr(3, 4)));
});

test("l'écriture A, avec le dénominateur de la carte : « 3 + 3/4 », « 3 + 2/4 » (pas simplifié), « 3/4 », « 4 »", () => {
  assert.equal(frTexte(fr(15, 4), 4), "3 + 3/4");
  assert.equal(frTexte(fr(7, 2), 4), "3 + 2/4", "deux quarts restent deux quarts");
  assert.equal(frTexte(fr(3, 4), 4), "3/4");
  assert.equal(frTexte(fr(4, 1), 4), "4");
  assert.equal(frTexte(fr(17, 8), 8), "2 + 1/8");
  assert.deepEqual(frDecompose(fr(13, 4), 4), { entier:3, reste:1, d:4 });
});

test("le calcul : « 7 − (3 + 1/4) = 3 + 3/4 », parenthèses seulement autour d'un « entier + fraction »", () => {
  const carte = (T, d, vis, cach) => ({ total:T, den:d, _unit:{ visibleValue:vis, hiddenValue:cach } });
  assert.deepEqual(ufPiecesCalcul(carte(7, 4, fr(13, 4), fr(15, 4))), {
    gauche:[{ t:"7" }, { op:"−" }, { t:"(" }, { t:"3" }, { op:"+" }, { f:[1, 4] }, { t:")" }],
    droite:[{ t:"3" }, { op:"+" }, { f:[3, 4] }] });
  assert.deepEqual(ufPiecesCalcul(carte(4, 4, fr(3, 4), fr(13, 4))).gauche, [{ t:"4" }, { op:"−" }, { f:[3, 4] }], "3/4 seul : pas de parenthèses");
  assert.deepEqual(ufPiecesCalcul(carte(7, 3, fr(3, 1), fr(4, 1))), { gauche:[{ t:"7" }, { op:"−" }, { t:"3" }], droite:[{ t:"4" }] }, "caché entier : « 7 − 3 = 4 »");
});

// --- le générateur ---------------------------------------------------------------------------
test("même graine, mêmes cartes ; autre graine, autres cartes", () => {
  for(const niveau of [1, 2, 3, 4]){
    const R = { ...REGLAGES, niveau };
    assert.deepEqual(serie(R, 974, 30), serie(R, 974, 30), `niveau ${niveau}`);
    assert.notDeepEqual(serie(R, 974, 30), serie(R, 975, 30), `niveau ${niveau}`);
  }
});

test("chaque carte : total entier dans les bornes, visible + caché = total exactement, un seul dénominateur, celui du niveau", () => {
  for(const niveau of [1, 2, 3, 4]){
    for(const [graine, R] of [[1, { ...REGLAGES, niveau }], [2, { niveau, visibleMax:12, hiddenMax:10, totalMin:1, totalMax:20 }], [3, { niveau, visibleMax:5, hiddenMax:4, totalMin:2, totalMax:6 }]]){
      for(const c of serie(R, graine, 400)){
        assert.equal(c.family, "UF");
        assert.ok(Number.isInteger(c.total) && c.total >= R.totalMin && c.total <= Math.min(R.totalMax, R.visibleMax + R.hiddenMax - 1), `total ${c.total}`);
        assert.ok(DENOMINATEURS[niveau].includes(c.den), `dénominateur ${c.den} au niveau ${niveau}`);
        const disques = c.visible.concat(c.hidden);
        assert.ok(disques.every((v) => v.d === 1 ? v.n === 1 : (v.d === c.den && v.n >= 1 && v.n <= c.den - 1)), "jetons entiers, ou disques de 1 à d − 1 parts du dénominateur de la carte");
        assert.ok(frEq(frAdd(frSomme(c.visible), frSomme(c.hidden)), fr(c.total, 1)), "visible + caché = total");
        assert.ok(frEq(c._unit.visibleValue, frSomme(c.visible)) && frEq(c._unit.hiddenValue, frSomme(c.hidden)));
        assert.ok(c.visible.length >= 1 && c.visible.length <= R.visibleMax, `visibles ${c.visible.length}`);
        assert.ok(c.hidden.length >= 1 && c.hidden.length <= R.hiddenMax, `cachés ${c.hidden.length}`);
        assert.ok(c.visible.some((v) => v.d > 1), "toujours au moins un disque partagé visible : la carte travaille les fractions");
        assert.equal(c._unit.tasks, 1);
        assert.deepEqual(c._unit.hiddenByTask, [c.hidden]);
        assert.equal(c._unit.visibleCount, c.visible.length);
      }
    }
  }
});

test("la tache cache parfois un entier (une carte sur quatre environ), sinon « entier + fraction »", () => {
  for(const niveau of [1, 2, 3, 4]){
    const cartes = serie({ ...REGLAGES, niveau }, 2026, 1000);
    const entiers = cartes.filter((c) => c._unit.hiddenValue.d === 1).length / cartes.length;
    assert.ok(entiers > 0.12 && entiers < 0.38, `niveau ${niveau} : ${entiers}`);
    assert.ok(cartes.every((c) => c._unit.hiddenInteger === (c._unit.hiddenValue.d === 1)));
  }
});

test("niveaux 1 et 2 : des parts d'un d-ième seulement ; niveau 1 : les parts visibles ne dépassent pas l'unité", () => {
  for(const niveau of [1, 2]){
    for(const c of serie({ ...REGLAGES, niveau, visibleMax:12, hiddenMax:10 }, 7, 500)){
      assert.ok(c.visible.concat(c.hidden).every((v) => v.d === 1 || v.n === 1), "parts unitaires");
      const parts = frSomme(c.visible.filter((v) => v.d > 1));
      if(niveau === 1) assert.ok(parts.n <= parts.d, `parts visibles ${parts.n}/${parts.d}`);
    }
  }
  // niveau 2 : « 5 quarts », il faut regrouper — ça arrive
  const regroupe = serie({ ...REGLAGES, niveau:2, visibleMax:12, hiddenMax:10 }, 8, 300)
    .some((c) => { const p = frSomme(c.visible.filter((v) => v.d > 1)); return p.n > p.d; });
  assert.ok(regroupe);
});

test("niveaux 3 et 4 : des disques à plusieurs parts ; le caché tient en un seul disque partagé", () => {
  for(const niveau of [3, 4]){
    const cartes = serie({ ...REGLAGES, niveau }, 11, 500);
    for(const c of cartes) assert.ok(c.hidden.filter((v) => v.d > 1).length <= 1);
    assert.ok(cartes.some((c) => c.visible.some((v) => v.d > 1 && v.n > 1)), "des disques à 2, 3… parts");
    assert.ok(cartes.some((c) => c.visible.some((v) => v.d > 1 && v.n === 1)), "mêlés aux disques d'une part");
  }
});

test("réglages impossibles : une carte de secours, jamais de boucle sans fin", () => {
  const c = genUnitsFractionsAvec(mulberry32(1), { niveau:2, visibleMax:1, hiddenMax:1, totalMin:20, totalMax:20 });
  assert.equal(c.total, 1);
  assert.ok(frEq(frAdd(frSomme(c.visible), frSomme(c.hidden)), fr(1, 1)));
  assert.equal(c.visible.length, 1);
  assert.equal(c.hidden.length, 1);
});

// --- le dessin -------------------------------------------------------------------------------
test("les parts partent de midi, dans le sens des aiguilles d'une montre", () => {
  assert.equal(ufSecteur(100, 100, 40, 1, 4), "M 100 100 L 100 60 A 40 40 0 0 1 140 100 Z");
  assert.equal(ufSecteur(100, 100, 40, 3, 4), "M 100 100 L 100 60 A 40 40 0 1 1 60 100 Z");
});

test("les couleurs des parts : les familles des bandes de fractions, un ton plus soutenu (choix C du 15/10)", () => {
  assert.deepEqual([2, 3, 4, 5, 6, 8].map((d) => ufCouleurs(d)[0]), ["#eab308", "#a855f7", "#65a30d", "#0ea5e9", "#f97316", "#ec4899"]);
  const dessin = fn("ufDessinerJeton");
  assert.doesNotMatch(dessin, /splat-cover/, "jamais la couleur de la tache : le mode élève rend ces chemins transparents");
});

test("le jeton entier : bleu plein, le même à l'écran et sur le papier, visible comme caché (15/10)", () => {
  const traces = [];
  const mk = { el:(nom, a) => { const n = { nom, a, enfants:[], appendChild(x){ this.enfants.push(x); } }; traces.push(n); return n; } };
  const dessiner = new Function(`${fn("ufCouleurs")}\n${fn("ufSecteur")}\n${fn("ufDessinerJeton")}\nreturn ufDessinerJeton;`)();
  const cible = { enfants:[], appendChild(x){ this.enfants.push(x); } };
  dessiner(cible, mk, 100, 100, 56, fr(1, 1));
  assert.equal(cible.enfants.length, 1);
  assert.deepEqual([cible.enfants[0].nom, cible.enfants[0].a.fill, cible.enfants[0].a.stroke], ["circle", "#2563eb", "#1e40af"]);
  assert.doesNotMatch(fn("ufDessinerJeton"), /unit-fill|beadH|o\.papier|o\.cache/, "pas de version pâle, pas de version propre au papier");
  // un disque de 3 quarts : fond blanc, une part de 3/4 en vert soutenu, 4 rayons, le contour
  dessiner(cible, mk, 100, 100, 56, fr(3, 4));
  const g = cible.enfants[1];
  assert.deepEqual(g.enfants.map((x) => x.nom), ["circle", "path", "line", "line", "line", "line", "circle"]);
  assert.equal(g.enfants[1].a.fill, "#65a30d");
  assert.equal(g.a["data-parts"], "3/4");
});

test("pas de « Résoudre » (ÉquaBarre) ni de tache vide en A fraction", () => {
  assert.doesNotMatch(fn("ufRendreCarte"), /drawABEquabarSolveButton|Equabar/);
  assert.doesNotMatch(fn("genUnitsFractionsAvec") + fn("ufComposer"), /shouldGenerateEmptyTaskCase|EmptyTask/);
});

// --- la page ----------------------------------------------------------------------------------
test("le menu, le bloc de réglages, l'adresse : mode=UF, niveau= écrit seulement en A fraction", () => {
  assert.match(html, /<option value="U">A — Jetons<\/option>\n\s*<option value="UF">A fraction — Jetons et parts<\/option>/);
  assert.match(html, /<div id="fractionSettings" style="display:none">/);
  for(const id of ["fracNiveau", "fracVisibleMax", "fracHiddenMax", "fracTotalMin", "fracTotalMax"]) assert.match(html, new RegExp(`id="${id}"`));
  const noms = JSON.parse(ligne("const sharedNames = ").replace(/^.*= /, "").replace(/;$/, ""));
  assert.ok(noms.includes("niveau"), "niveau dans l'adresse et dans l'empreinte élève");
  const controles = fn("getClassicShareControls");
  assert.match(controles, /if\(act === "UF"\) return ufReglagesAdresse\(\);/);
  assert.doesNotMatch(controles.slice(0, controles.indexOf("/* A fraction")), /niveau/, "le mode A n'écrit pas niveau=");
  assert.match(fn("ufReglagesAdresse"), /\["niveau", g\("fracNiveau"\)\]/);
  assert.match(fn("appliquerConfiguration"), /if\(act === "UF"\) ufNiveauParDefaut\(\);\n\s*getClassicShareControls\(act\)/, "un niveau illisible retombe sur 1");
  assert.match(fn("generate"), /\}else if\(act==="UF"\)\{\n\s*c = genUnitsFractions\(rng\);/);
  assert.match(fn("getMaxRevealState"), /if\(card\.family === "U" \|\| card\.family === "N" \|\| card\.family === "UF"\) return 3;/);
});

test("le mode A garde son dessin et son tirage : A fraction a ses propres fonctions, rangées à la fin du script", () => {
  // les seules lignes A fraction de renderCard et renderCardIntoSvg : un aiguillage vers ses fonctions
  assert.match(fn("renderCard"), /if\(card && card\.family === "UF"\)\{ ufRendreCarte\(card, revealState\); return; \}/);
  assert.match(fn("renderCardIntoSvg"), /if\(card && card\.family === "UF"\)\{ ufRendreCarteImprimee\(targetSvg, card, tEl, tText\); return; \}/);
  // assignPositionsUnits : les rayons du mode A sont les mêmes qu'avant
  const places = fn("assignPositionsUnits");
  assert.match(places, /beadR = isSignedUnitMode \? clamp\(calc, 18, 42\) : \(isFractionMode \? clamp\(Math\.floor\(124 \/ Math\.sqrt\(maxHidden\)\), 24, 56\) : clamp\(calc, 14, 32\)\);/);
  assert.match(places, /beadR = isSignedUnitMode \? 40 : \(isFractionMode \? 56 : 32\);/);
  assert.match(places, /const maxAttempts = isSignedUnitMode \? 30 : \(isFractionMode \? 10 : 8\);/);
  assert.match(places, /const R = Math\.max\(isFractionMode \? 24 : 12, beadR - attempt\);/, "jamais sous 24 en A fraction, 12 comme avant en A");
  // un grand disque caché tient entier dans la tache : 24 points de son bord (8 en mode A, comme avant)
  assert.match(places, /if\(isFractionMode && canPath2D && o\.path\)\{\n\s*for\(let i = 0; i < 24; i\+\+\)\{\n\s*const a = Math\.PI \* i \/ 12;\n\s*if\(!ctx\.isPointInPath\(o\.path, x \+ \(beadR \+ 4\) \* Math\.cos\(a\), y \+ \(beadR \+ 4\) \* Math\.sin\(a\)\)\) return false;/);
  // les fonctions nouvelles sont après la dernière fonction d'avant, jamais entre deux fonctions qui se suivent
  const fin = html.indexOf("\nfunction eleveNouvellesCartes(");
  for(const nom of ["genUnitsFractions", "genUnitsFractionsAvec", "ufRendreCarte", "ufRendreCarteImprimee", "ufDessinerJeton", "ufDessinerBarre", "frAdd"]){
    assert.ok(html.indexOf(`\nfunction ${nom}(`) > fin, `${nom} en fin de script`);
  }
  assert.ok(html.indexOf("\nfunction frPgcd(") < html.indexOf("\nif(!loadSharedConfiguration()){"), "avant le lancement de la page");
});

test("impression du lot F1 : l'énoncé seul, en 4, 2 ou 1 par page ; le reste revient dans les autres modes", () => {
  assert.match(fn("syncPrintModeUI"), /ufSyncImpression\(sel, act === "UF"\);/);
  const sync = new Function("document", `${fn("ufSyncImpression")} return ufSyncImpression;`);
  const option = (v) => ({ value:v, disabled:false });
  const opts = ["statement", "worksheet", "correction", "correction-equation", "correction-schema", "duplex-worksheet", "duplex-correction"].map(option);
  const sel = { value:"correction", querySelectorAll:(q) => opts.filter((o) => q.includes(`"${o.value}"`)) };
  const six = option("6"), pages = { value:"6", querySelector:() => six };
  const f = sync({ getElementById:() => pages });
  f(sel, true);
  assert.equal(sel.value, "statement");
  assert.deepEqual(opts.filter((o) => o.disabled).map((o) => o.value), ["worksheet", "correction", "correction-equation", "correction-schema", "duplex-worksheet", "duplex-correction"]);
  assert.equal(pages.value, "4");
  assert.equal(six.disabled, true);
  f(sel, false);
  assert.equal(six.disabled, false, "6/page revient");
  assert.deepEqual(opts.filter((o) => ["correction", "duplex-correction"].includes(o.value)).map((o) => o.disabled), [false, false], "les corrections reviennent (les autres suivent syncPrintModeUI, comme avant)");
  assert.match(fn("getClassicPrintInstruction"), /if\(act === "UF"\) return \{ main:UF_CONSIGNE_IMPRIMEE, note:"" \};/);
});
