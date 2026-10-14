/* SPLAT! — le Système (mode D), lot S1 « le générateur » (23/09/2026).
   Les fonctions de outils/splat.html sont extraites du fichier et exécutées telles quelles :
   ces tests tirent plusieurs milliers de cartes par geste, sur des graines fixes, et vérifient
   les maths de chaque carte — solution unique et positive, plan de correction juste (chaque
   calcul est refait), valeurs distinctes, plages, aucun nombre à sous-entendu, 6 taches au
   plus, plateaux cohérents — puis les réglages et l'aller-retour des adresses.
   Conception : splat-systemes-S0-conception.md (§2.1 règles, §2.2 modèle, §4 plan, §5 réglages). */
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

const PALETTE = html.slice(html.indexOf("const INVESTIGATE_COLOR_PALETTE = ["), html.indexOf("];", html.indexOf("const INVESTIGATE_COLOR_PALETTE = [")) + 2);
const CONSTANTES_SYS = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_SOUS_GESTES", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS", "SYS_COULEURS_PLURIEL", "SYS_PLAGES"]
  .map((nom) => ligne(`const ${nom} = `)).join("\n");
const FONCTIONS_SYS = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure",
  "sysAssemblerCarte", "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan", "sysLireGestes"].map(fn).join("\n");

const sys = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  ${fn("parseInvestigatePalette")}
  ${fn("buildInvestigateColorMap")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${CONSTANTES_SYS}
  ${FONCTIONS_SYS}
  return {
    SYS_GESTES, SYS_GESTES_MIX_DEFAUT, SYS_PLAGES, SYS_MAX_TACHES, INVESTIGATE_COLOR_INITIALS,
    mot: (k) => investigateColorWord(investigateColorByKey(k)),
    initiale: (k) => investigateColorInitial(investigateColorByKey(k)),
    pluriel: (k) => SYS_COULEURS_PLURIEL[k],
    sousEntendu: sysNombreSousEntendu,
    normaliser: sysNormaliserReglages,
    formes: sysFormes,
    /* le plan de S3 (calculs en mots et en lettres) : il ne se dessine plus depuis le lot
       M4-2, mais le générateur filtre toujours ses nombres — on le vérifie donc toujours */
    plan: sysPlanS3,
    planM42: sysPlan,
    phrase: sysPhraseIndice,
    lireGestes: sysLireGestes,
    serie(graine, n, reglages, palette = null){
      investigatePaletteKeys = palette ? parseInvestigatePalette(palette) : null;
      const rng = mulberry32(graine);
      const out = [];
      for(let i = 0; i < n; i++) out.push(genSystemCarte(rng, reglages));
      investigatePaletteKeys = null;
      return out;
    }
  };
`)();

/* Les gestes de ce test : ceux qui ont un plan d'avant (sysPlanS3, en mots et en lettres) et 6
   taches au plus. Ceux du lot M4-5 (Je recopie, Deux gestes à la suite : 7 taches, jamais de jeton
   visible, seulement le plan dessiné) ont le leur : splat-systeme-m4-5-generateur.test.mjs. */
const GESTES = sys.SYS_GESTES.filter((g) => !["RECOPIE", "ETAGES"].includes(g));
const sousEntendu = (n) => ["69", "88", "420", "666", "1488"].some((x) => String(n).includes(x));
/* graines fixes, sans nombre à sous-entendu elles non plus */
function graines(n, depart = 1){
  const out = [];
  for(let s = depart; out.length < n; s++) if(!sousEntendu(s)) out.push(s);
  return out;
}
/* tirage : 300 graines × 10 cartes = 3 000 cartes par geste, gardées pour tous les tests */
const PAR_GESTE = {};
for(const geste of GESTES){
  PAR_GESTE[geste] = graines(300).flatMap((g) => sys.serie(g, 10, { geste }));
}

// --- évaluation des lignes de calcul du plan -------------------------------------------
/* Les mots (noire, noires, violette…), les initiales (N, Vi…), « TOTAL du plateau » et
   « plateaux » deviennent des nombres ; « 2 noires » et « 2 plateaux » se lisent 2 × … */
function lexique(carte){
  const lex = new Map();
  for(const k of carte._sys.colors){
    const v = carte._sys.values[k];
    lex.set(sys.mot(k), v);
    lex.set(sys.pluriel(k), v);
    lex.set(sys.initiale(k), v);
  }
  lex.set("T", carte.total);
  return lex;
}
function evaluer(expr, lex){
  const src = expr.replace(/TOTAL du plateau/g, "T").replace(/plateaux/g, "T");
  const jetons = src.match(/\d+|[A-Za-zÀ-ÖØ-öø-ÿ’]+|[×÷+−()]/g) || [];
  assert.equal(jetons.join(""), src.replace(/\s+/g, ""), `caractère inattendu dans « ${expr} »`);
  let i = 0;
  const facteur = () => {
    const t = jetons[i++];
    if(t === "("){ const x = somme(); assert.equal(jetons[i++], ")"); return x; }
    if(/^\d+$/.test(t)) return Number(t);
    assert.ok(lex.has(t), `mot inconnu « ${t} » dans « ${expr} »`);
    return lex.get(t);
  };
  const produit = () => {
    let x = facteur();
    for(;;){
      const t = jetons[i];
      if(t === "×"){ i++; x *= facteur(); }
      else if(t === "÷"){ i++; const d = facteur(); assert.equal(x % d, 0, `division non exacte dans « ${expr} »`); x /= d; }
      else if(t !== undefined && t !== "+" && t !== "−" && t !== ")"){ x *= facteur(); } // « 2 noires »
      else return x;
    }
  };
  const somme = () => {
    let x = produit();
    while(jetons[i] === "+" || jetons[i] === "−"){ const op = jetons[i++]; const y = produit(); x = op === "+" ? x + y : x - y; }
    return x;
  };
  const r = somme();
  assert.equal(i, jetons.length, `fin inattendue dans « ${expr} »`);
  return r;
}
/* Une ligne « a = b = c » : toutes les parties valent la même chose. « … : » est un titre. */
function verifierLigne(texte, lex){
  const l = texte.replace(/\s*✓$/, "");
  if(/:$/.test(l)) return;
  const parts = l.split(" = ");
  assert.ok(parts.length >= 2, `pas d'égalité dans « ${texte} »`);
  const valeurs = parts.map((p) => evaluer(p, lex));
  assert.ok(valeurs.every((x) => x === valeurs[0]), `ligne fausse : « ${texte} » (${valeurs.join(" / ")})`);
}
/* La valeur d'une case (ou de ce qu'elle couvre) */
function valeurCase(c, carte){
  if(c.kind === "unknown" || c.kind === "known") return carte._sys.values[c.color];
  if(c.kind === "visible") return c.value;
  if(c.kind === "rest") return c.covers.reduce((s, x) => s + valeurCase(x, carte), 0);
  throw new Error(`case inconnue ${c.kind}`);
}

/* Toutes les vérifications d'une carte (quel que soit le geste). */
function verifierCarte(carte, reglages = {}){
  const o = sys.normaliser(reglages);
  const s = carte._sys;
  assert.equal(carte.family, "D");
  assert.equal(s.version, 1);
  assert.ok(GESTES.includes(s.geste));
  const couleurs = s.colors;
  const vals = couleurs.map((k) => s.values[k]);
  // valeurs : entières, ≥ 2, toutes différentes
  assert.ok(vals.every((x) => Number.isInteger(x) && x >= 2), `valeurs ${vals}`);
  assert.equal(new Set(vals).size, vals.length, `deux couleurs de même valeur : ${vals}`);
  assert.equal(new Set(couleurs).size, couleurs.length);
  // plateaux : 6 taches au plus, totaux justes, visibles seulement sur le plateau principal
  s.boards.forEach((b, i) => {
    const taches = Object.values(b.counts).reduce((a, x) => a + x, 0);
    assert.ok(taches >= 1 && taches <= 6, `plateau ${i} : ${taches} taches`);
    assert.ok(Object.keys(b.counts).every((k) => couleurs.includes(k) && b.counts[k] >= 1));
    if(i > 0) assert.ok(!b.visible || b.visible.length === 0, "visibles hors du plateau principal");
    if(b.total !== null){
      const somme = couleurs.reduce((a, k) => a + (b.counts[k] || 0) * s.values[k], 0) + (b.visible || []).reduce((a, x) => a + x, 0);
      assert.equal(somme, b.total, `plateau ${i} : total faux`);
    }
  });
  // solution unique : les plateaux qui ont un total forment un système de rang plein
  const lignes = s.boards.filter((b) => b.total !== null).map((b) => couleurs.map((k) => b.counts[k] || 0));
  assert.equal(rang(lignes), couleurs.length, "la carte n'a pas une solution unique");
  // la carte telle que la page la lit
  const principal = s.boards[0];
  const attendu = couleurs.flatMap((k) => Array(principal.counts[k] || 0).fill(k));
  assert.deepEqual(carte._colorMap, attendu);
  assert.deepEqual(carte.hidden, attendu.map((k) => s.values[k]));
  assert.equal(carte._num.tasks, carte.hidden.length);
  assert.deepEqual(carte._num.hiddenByTask, carte.hidden.map((x) => [x]));
  assert.deepEqual(carte.visible, principal.visible || []);
  assert.equal(carte.total, carte.hidden.reduce((a, x) => a + x, 0) + carte.visible.reduce((a, x) => a + x, 0));
  if(principal.total !== null) assert.equal(carte.total, principal.total);
  // les indices écrits : un par plateau secondaire
  assert.equal(carte._inv.indices.length, s.boards.length - 1);
  // aucun nombre à sous-entendu, nulle part dans la carte ni dans le plan de S3, que le
  // générateur filtre (lot M4-2 : le plan dessiné a son propre test, aux totaux des fiches)
  const filtree = Object.assign({}, carte, { _sys: Object.assign({}, carte._sys, { plan: sys.plan(carte._sys) }) });
  const nombres = JSON.stringify(filtree).match(/\d+/g) || [];
  assert.ok(!nombres.some(sousEntendu), `nombre à sous-entendu dans la carte : ${nombres.filter(sousEntendu)}`);
  assert.doesNotMatch(JSON.stringify(filtree), /Erreur/);
  // le plan : chaque calcul est juste, en mots comme en lettres
  const lex = lexique(carte);
  const etablies = new Set();
  const planS3 = sys.plan(s);
  planS3.forEach((etape, n) => {
    assert.ok(etape.titre && etape.role, `étape ${n} sans titre`);
    assert.equal(etape.calculs.length, etape.lettres.length, `étape ${n} : mots et lettres ne se correspondent pas`);
    for(const l of etape.calculs.concat(etape.lettres)) verifierLigne(l, lex);
    // les barres : l'étiquette du dessus vaut la somme des cases qu'elle couvre
    for(const barre of etape.barres){
      assert.ok(barre.span >= 1 && barre.span <= barre.cells.length);
      assert.ok(Number.isInteger(barre.offset) && barre.offset >= 0);
      const haut = Number(barre.top.match(/(\d+)$/)[1]);
      const couverte = barre.cells.slice(0, barre.span).reduce((a, c) => a + valeurCase(c, carte), 0);
      assert.equal(couverte, haut, `étape ${n} : barre « ${barre.top} »`);
      // une case « connue » ne montre qu'une couleur déjà trouvée à une étape précédente
      for(const c of barre.cells) if(c.kind === "known"){
        assert.ok(etablies.has(c.color), `étape ${n} : ${c.color} montrée avant d'être trouvée`);
        assert.equal(c.value, s.values[c.color]);
      }
    }
    // « couleur = … = valeur » : la couleur est trouvée
    if(etape.role !== "verification") for(const l of etape.calculs){
      for(const k of couleurs){
        const m = l.match(new RegExp(`^${sys.mot(k)} = (?:.* = )?(\\d+)$`));
        if(m){ assert.equal(Number(m[1]), s.values[k]); etablies.add(k); }
      }
    }
  });
  assert.equal(etablies.size, couleurs.length, "le plan ne trouve pas toutes les couleurs");
  const verif = planS3[planS3.length - 1];
  assert.equal(verif.role, "verification");
  assert.equal(verif.titre, "Vérification");
  assert.equal(verif.calculs.length, s.boards.filter((b) => b.total !== null).length, "la vérification relit chaque plateau");
  assert.deepEqual(verif.reponses, couleurs.map((k) => ({ color: k, value: s.values[k] })));
  // lettres : « 2 × Vi », jamais « 2Vi »
  for(const l of planS3.flatMap((e) => e.lettres)) assert.doesNotMatch(l, /\d(N|Vi|O|B|Ve|R)\b/, `« ${l} »`);
  // réglages : total principal et visibles
  if(!s.secours){
    assert.ok(carte.total >= o.totalMin && carte.total <= o.totalMax, `total ${carte.total}`);
    if(s.geste !== "TROIS") assert.ok(carte.visible.length >= o.visMin && carte.visible.length <= o.visMax);
  }
  return s;
}
/* rang d'une matrice (élimination de Gauss, nombres exacts : petites valeurs entières) */
function rang(m){
  const a = m.map((r) => r.slice());
  let r = 0;
  for(let c = 0; c < (a[0] || []).length && r < a.length; c++){
    const p = a.findIndex((row, i) => i >= r && Math.abs(row[c]) > 1e-12);
    if(p < 0) continue;
    [a[r], a[p]] = [a[p], a[r]];
    for(let i = 0; i < a.length; i++) if(i !== r){
      const f = a[i][c] / a[r][c];
      for(let j = c; j < a[i].length; j++) a[i][j] -= f * a[r][j];
    }
    r++;
  }
  return r;
}

// --- les tests ---------------------------------------------------------------------------

for(const geste of GESTES){
  test(`${geste} : 3 000 cartes, chacune juste (solution unique, plan refait, valeurs, plages, sous-entendus, 6 taches)`, () => {
    const cartes = PAR_GESTE[geste];
    assert.equal(cartes.length, 3000);
    const plage = sys.SYS_PLAGES[geste];
    for(const carte of cartes){
      const s = verifierCarte(carte);
      assert.equal(s.geste, geste);
      assert.ok(!s.secours, "aux réglages par défaut, jamais de carte de secours");
      assert.equal(s.clues, "BOARD");
      for(const k of s.colors) assert.ok(s.values[k] >= plage.vMin && s.values[k] <= plage.vMax, `${geste} : valeur ${s.values[k]} hors plage`);
      for(const b of s.boards.slice(1)) assert.ok(b.total >= plage.sousMin && b.total <= plage.sousMax, `${geste} : sous-total ${b.total} hors plage`);
    }
    // des cartes variées : plus de la moitié sont toutes différentes (couleurs et valeurs)
    assert.ok(new Set(cartes.map((c) => JSON.stringify([c._sys.colors, c._sys.boards]))).size > cartes.length / 2);
  });
}

test("chaque geste a la forme décidée (S0 §2.1 et décision du 23/09 sur « doubler »)", () => {
  const vues = {};
  for(const geste of GESTES) for(const carte of PAR_GESTE[geste]){
    const s = carte._sys;
    const [P, I, J, K] = s.boards;
    const c = s.colors;
    const cle = `${geste} ${s.boards.map((b) => c.map((k) => b.counts[k] || 0).join("+")).join(" | ")}`;
    vues[cle] = (vues[cle] || 0) + 1;
    if(geste === "EMBOITE1"){
      assert.equal(c.length, 3);
      assert.deepEqual(P.counts, { [c[0]]: 1, [c[1]]: 1, [c[2]]: 1 });
      assert.deepEqual(I.counts, { [c[0]]: 1, [c[1]]: 1 }, "l'indice « à gauche » : les deux premières");
      assert.deepEqual(J.counts, { [c[1]]: 1, [c[2]]: 1 }, "la tache commune est au milieu");
      assert.equal(s.boards.length, 3);
    }
    if(geste === "PARTIELLE"){
      assert.equal(c.length, 2);
      assert.deepEqual(I.counts, { [c[0]]: P.counts[c[0]] }, "l'indice : les mêmes taches, même nombre, une seule couleur");
      assert.ok(P.counts[c[0]] <= 3 && P.counts[c[1]] <= 3);
      assert.ok(P.counts[c[0]] >= 2, "au moins 2 taches dans l'indice (24/09) : il faut partager");
    }
    if(geste === "COEF"){
      assert.equal(I.counts[c[0]], P.counts[c[0]], "la première couleur ne change pas");
      assert.ok(I.counts[c[1]] >= 1 && I.counts[c[1]] < P.counts[c[1]], "une seule couleur diffère, en moins dans l'indice");
      assert.ok(Math.max(...Object.values(P.counts)) <= 3, "coefMax = 3 par défaut");
    }
    if(geste === "DOUBLE"){
      assert.deepEqual(I.counts, { [c[0]]: 1, [c[1]]: 1 }, "à 6 taches, seul l'indice 1 + 1 peut être doublé");
      assert.equal(P.counts[c[0]], 2);
      assert.ok([3, 4].includes(P.counts[c[1]]), "plateau 2 + 3 ou 2 + 4");
      assert.ok(P.total > I.total, "le plateau est le plus grand des deux");
    }
    if(geste === "MIROIR"){
      const [a, b] = [P.counts[c[0]], P.counts[c[1]]];
      assert.equal(Math.abs(a - b), 1, "|a − b| = 1");
      assert.deepEqual(I.counts, { [c[0]]: b, [c[1]]: a }, "l'autre plateau est le miroir");
      assert.ok(P.total > I.total, "le plateau principal est celui du plus grand total");
    }
    if(geste === "TROIS"){
      assert.equal(P.total, null, "le plateau principal n'a pas de TOTAL");
      assert.deepEqual(carte.visible, [], "pas de jetons visibles");
      assert.deepEqual([I, J, K].map((b) => Object.keys(b.counts)), [[c[0], c[1]], [c[1], c[2]], [c[0], c[2]]]);
      assert.equal((I.total + J.total + K.total) % 2, 0, "la somme des trois indices est paire");
    }
  }
  // toutes les formes permises sortent
  const formes = (g) => Object.keys(vues).filter((k) => k.startsWith(g + " ")).length;
  assert.equal(formes("PARTIELLE"), 6);
  assert.equal(formes("COEF"), 9);
  assert.equal(formes("DOUBLE"), 2);
  assert.equal(formes("MIROIR"), 4);
});

test("les couleurs : tirées parmi les six, palette= respectée, et la carte les lit dans l'ordre des barres", () => {
  const vues = new Set();
  for(const geste of GESTES) for(const carte of PAR_GESTE[geste]) carte._sys.colors.forEach((k) => vues.add(k));
  assert.deepEqual([...vues].sort(), ["black", "blue", "green", "orange", "purple", "red"]);
  for(const carte of sys.serie(7, 200, { geste: "EMBOITE1" }, "noire,orange,bleue")){
    assert.deepEqual([...carte._sys.colors].sort(), ["black", "blue", "orange"]);
  }
  for(const carte of sys.serie(8, 200, { geste: "COEF" }, "verte,rouge")){
    assert.deepEqual([...carte._sys.colors].sort(), ["green", "red"]);
  }
});

test("MIX : seulement les gestes cochés ; par défaut les quatre du cycle 3", () => {
  const compte = (cartes) => cartes.reduce((m, c) => (m[c._sys.geste] = (m[c._sys.geste] || 0) + 1, m), {});
  const defaut = compte(sys.serie(11, 1200, { geste: "MIX" }));
  assert.deepEqual(Object.keys(defaut).sort(), ["COEF", "EMBOITE1", "PARTIELLE", "TROIS"]);
  const choisis = compte(sys.serie(12, 900, { geste: "MIX", gestes: ["DOUBLE", "MIROIR"] }));
  assert.deepEqual(Object.keys(choisis).sort(), ["DOUBLE", "MIROIR"]);
  for(const c of sys.serie(13, 300, { geste: "MIX", gestes: ["COEF", "TROIS", "DOUBLE"] })) verifierCarte(c);
  assert.deepEqual(sys.normaliser({ geste: "MIX", gestes: [] }).gestes, ["EMBOITE1", "PARTIELLE", "COEF", "TROIS"]);
  assert.deepEqual(sys.lireGestes("coef, DOUBLE;miroir+inconnu"), ["COEF", "DOUBLE", "MIROIR"]);
});

test("réglages : coefficient max, visibles, totaux, indices, valeurs par défaut", () => {
  assert.deepEqual(sys.normaliser({}), { geste: "EMBOITE1", gestes: ["EMBOITE1", "PARTIELLE", "COEF", "TROIS"], clues: "BOARD", coefMax: 3, visMin: 0, visMax: 3, totalMin: 20, totalMax: 60,
    ecart: "", fois: 2, indice: "11", sens: "PLATEAU", ordre: "", // lot M4-1 : les réglages nouveaux, éteints
    foisRecopie: 2, forme: "", grand: "", sous: "MIX" }); // lot M4-5, éteints eux aussi
  assert.equal(sys.normaliser({ clues: "SENTENCE" }).clues, "SENTENCE");
  assert.equal(sys.normaliser({ clues: "n'importe quoi" }).clues, "BOARD");
  assert.equal(sys.normaliser({ coefMax: 9 }).coefMax, 4);
  // coefMax 4 : des plateaux à 4 taches d'une même couleur ; coefMax 2 : jamais plus de 2
  const max = (cartes) => Math.max(...cartes.flatMap((c) => c._sys.boards.flatMap((b) => Object.values(b.counts))));
  const c4 = sys.serie(21, 800, { geste: "COEF", coefMax: 4, totalMax: 90 });
  c4.forEach((c) => verifierCarte(c, { geste: "COEF", coefMax: 4, totalMax: 90 }));
  assert.equal(max(c4), 4);
  assert.equal(max(sys.serie(22, 400, { geste: "COEF", coefMax: 2 })), 2);
  assert.equal(max(sys.serie(23, 200, { geste: "COEF", coefMax: 1 })), 2, "coefMax 1 : une couleur doit pouvoir différer, on garde 2");
  // visibles imposés (sauf TROIS : jamais)
  for(const geste of GESTES){
    for(const c of sys.serie(31, 60, { geste, visMin: 2, visMax: 2, totalMax: 80 })){
      verifierCarte(c, { geste, visMin: 2, visMax: 2, totalMax: 80 });
      assert.equal(c.visible.length, geste === "TROIS" ? 0 : 2);
    }
  }
  // autres bornes de total
  for(const geste of GESTES){
    const r = { geste, totalMin: 30, totalMax: 45 };
    for(const c of sys.serie(41, 60, r)){ verifierCarte(c, r); assert.ok(!c._sys.secours); }
  }
});

test("jamais de carte « Erreur » : bornes impossibles → carte sûre du geste 1, juste ; grands totaux → plages élargies", () => {
  for(const geste of GESTES){
    // un total de 3 est impossible (trois valeurs différentes ≥ 2 font au moins 9)
    for(const c of sys.serie(51, 3, { geste, totalMin: 1, totalMax: 3 })){
      verifierCarte(c, { geste, totalMin: 1, totalMax: 3 });
      assert.equal(c._sys.secours, true);
      assert.equal(c._sys.geste, "EMBOITE1");
      assert.deepEqual(c.visible, []);
    }
    // de grands totaux : hors des plages du geste, le deuxième passage les atteint
    const r = { geste, totalMin: 200, totalMax: 300 };
    for(const c of sys.serie(52, 20, r)){
      verifierCarte(c, r);
      assert.ok(!c._sys.secours, `${geste} : 200-300 doit rester possible`);
      assert.equal(c._sys.geste, geste);
    }
  }
});

/* Lot S-defi (24/09/2026) : au-dessus de 60, les plages du geste s'agrandissent dans la
   proportion totalMax ÷ 60 (« Trois paires » deux fois plus pour la borne haute) ; à 60 ou
   moins elles ne bougent pas (le test des 3 000 cartes par geste, plus haut, les vérifie aux
   réglages par défaut). But : les livrets « Le défi » (50 à 100) ont des séries pleines et
   variées pour les six gestes — avant le lot, « En miroir » plafonnait à 58. */
test("S-defi : totaux 50 à 100 — chaque geste couvre toute la plage, cartes justes et variées, plages agrandies", () => {
  const f = 100 / 60;
  for(const geste of GESTES){
    for(const vis of [0, 3]){
      const r = { geste, totalMin: 50, totalMax: 100, visMin: vis ? 1 : 0, visMax: vis };
      const cartes = graines(150).flatMap((g) => sys.serie(g, 10, r));
      const base = sys.SYS_PLAGES[geste];
      const fHaut = geste === "TROIS" ? 2 * f : f;
      const plage = { vMin: Math.round(base.vMin * f), vMax: Math.round(base.vMax * fHaut), sousMin: Math.round(base.sousMin * f), sousMax: Math.round(base.sousMax * fHaut) };
      const totaux = [];
      for(const carte of cartes){
        const s = verifierCarte(carte, r);
        assert.equal(s.geste, geste);
        assert.ok(!s.secours, `${geste} : jamais de carte de secours à 50-100`);
        for(const k of s.colors) assert.ok(s.values[k] >= plage.vMin && s.values[k] <= plage.vMax, `${geste} : valeur ${s.values[k]} hors de ${plage.vMin}-${plage.vMax}`);
        for(const b of s.boards.slice(1)) assert.ok(b.total >= plage.sousMin && b.total <= plage.sousMax, `${geste} : sous-total ${b.total} hors plage`);
        const t = s.boards[0].total == null ? s.colors.reduce((x, k) => x + s.values[k], 0) : s.boards[0].total;
        assert.ok(t >= 50 && t <= 100, `${geste} : total ${t}`);
        totaux.push(t);
      }
      // toute la plage : au moins 10 % des cartes au-dessus de 80, et autant au-dessous de 65
      assert.ok(totaux.filter((t) => t > 80).length >= cartes.length / 10, `${geste} (visibles ${vis}) : trop peu de grands totaux`);
      assert.ok(totaux.filter((t) => t < 65).length >= cartes.length / 10, `${geste} (visibles ${vis}) : trop peu de petits totaux`);
      assert.ok(Math.max(...totaux) >= 95, `${geste} : le total max approche 100`);
      // des séries variées : 80 % de cartes toutes différentes au moins
      assert.ok(new Set(cartes.map((c) => JSON.stringify([c._sys.colors, c._sys.boards]))).size > cartes.length * 0.8, `${geste} : cartes trop répétées`);
    }
  }
  // juste au-dessus de 60, l'agrandissement est petit ; à 60 pile, les plages de SYS_PLAGES
  for(const c of sys.serie(7, 20, { geste: "MIROIR", totalMin: 20, totalMax: 60 })){
    for(const k of c._sys.colors) assert.ok(c._sys.values[k] <= sys.SYS_PLAGES.MIROIR.vMax);
  }
  for(const c of sys.serie(7, 20, { geste: "MIROIR", totalMin: 20, totalMax: 66 })){
    for(const k of c._sys.colors) assert.ok(c._sys.values[k] <= Math.round(sys.SYS_PLAGES.MIROIR.vMax * 1.1));
  }
});

test("les indices écrits (réglages Phrases et Symboles) : la tournure décidée, les bonnes taches", () => {
  const coef = sys.serie(61, 1, { geste: "COEF", clues: "SENTENCE" })[0];
  const [P, I] = coef._sys.boards;
  const [X, Y] = coef._sys.colors;
  const n = I.counts[Y];
  assert.equal(coef._inv.indices[0],
    `Sous ${I.counts[X] === 1 ? `1 tache ${sys.mot(X)}` : `${I.counts[X]} taches ${sys.pluriel(X)}`} et ${n === 1 ? `1 tache ${sys.mot(Y)}` : `${n} taches ${sys.pluriel(Y)}`}, il y a ${I.total} jetons en tout.`);
  const emb = sys.serie(62, 1, { geste: "EMBOITE1" })[0];
  const [A, B, C] = emb._sys.colors;
  assert.deepEqual(emb._inv.indices, [
    `Sous la tache ${sys.mot(A)} et la tache ${sys.mot(B)}, il y a ${emb._sys.boards[1].total} jetons en tout.`,
    `Sous la tache ${sys.mot(B)} et la tache ${sys.mot(C)}, il y a ${emb._sys.boards[2].total} jetons en tout.`
  ]);
  // Symboles : « 2 × [tache] + [tache] = 25 », chaque tache pointe une tache de sa couleur
  for(const geste of GESTES) for(const c of sys.serie(63, 50, { geste, clues: "SYMBOL" })){
    c._inv.indices.forEach((parts, i) => {
      const b = c._sys.boards[i + 1];
      const taches = parts.filter((p) => p.type === "splat");
      assert.deepEqual(taches.map((p) => c._colorMap[p.id]), c._sys.colors.filter((k) => b.counts[k]));
      assert.equal(parts[parts.length - 1].val, ` = ${b.total}`);
      for(const k of c._sys.colors) if(b.counts[k] > 1) assert.ok(parts.some((p) => p.val === `${b.counts[k]} × `));
    });
  }
  // Plateaux (par défaut) : la phrase reste dans _inv, que l'écran actuel affiche jusqu'au lot S2
  assert.match(sys.serie(64, 1, {})[0]._inv.indices[0], /^Sous la tache .* jetons en tout\.$/);
});

/* Les cartes-types de la conception (S0 §2) : le plan donne exactement les calculs des
   maquettes (corrections imprimées, splat-systemes-S0-corrections-6-gestes.png). */
function situation(geste, colors, values, boards){
  return { geste, colors, values, boards };
}
test("le plan des cartes-types de la conception : titres et calculs des maquettes", () => {
  const n = "black", vi = "purple", o = "orange";
  const g1 = sys.plan(situation("EMBOITE1", [n, vi, o], { black: 25, purple: 19, orange: 35 }, [
    { counts: { black: 1, purple: 1, orange: 1 }, total: 83, visible: [2, 2] }, { counts: { black: 1, purple: 1 }, total: 44 }, { counts: { purple: 1, orange: 1 }, total: 54 }]));
  assert.deepEqual(g1.map((e) => e.titre), ["Le plateau entier", "L’indice : une partie du plateau", "Ce qui reste : l’orange et les jetons visibles", "L’autre indice, puis la dernière tache", "Vérification"]);
  assert.deepEqual(g1.map((e) => e.calculs), [
    ["noire + violette + orange + 4 = 83"], ["ce qui reste :", "83 − 44 = 39"], ["orange = 39 − 2 − 2", "orange = 35"],
    ["violette = 54 − 35 = 19", "noire = 44 − 19 = 25"], ["25 + 19 + 35 + 2 + 2 = 83 ✓", "25 + 19 = 44 ✓", "19 + 35 = 54 ✓"]]);
  assert.deepEqual(g1[0].lettres, ["N + Vi + O + 4 = 83"]);
  assert.deepEqual(g1[1].barres[0], { top: "44", span: 2, offset: 0, cells: [{ kind: "unknown", color: n }, { kind: "unknown", color: vi },
    { kind: "rest", label: "ce qui reste", covers: [{ kind: "unknown", color: o }, { kind: "visible", value: 2 }, { kind: "visible", value: 2 }] }] });
  assert.equal(g1[2].barres[0].offset, 2);
  assert.deepEqual(g1[3].barres[0].cells, [{ kind: "unknown", color: vi }, { kind: "known", color: o, value: 35 }]);

  const g2a = sys.plan(situation("PARTIELLE", [n, vi], { black: 10, purple: 7 }, [
    { counts: { black: 3, purple: 2 }, total: 44, visible: [] }, { counts: { black: 3 }, total: 30 }]));
  assert.deepEqual(g2a.map((e) => e.titre), ["Le plateau entier", "L’indice : une partie du plateau", "Ce qui reste : les violettes, on partage", "L’indice seul : les noires, on partage", "Vérification"]);
  assert.deepEqual(g2a.map((e) => e.calculs), [
    ["3 noires + 2 violettes = 44"], ["ce qui reste :", "44 − 30 = 14"], ["2 violettes = 14", "violette = 14 ÷ 2 = 7"],
    ["3 noires = 30", "noire = 30 ÷ 3 = 10"], ["3 × 10 + 2 × 7 = 30 + 14 = 44 ✓", "3 × 10 = 30 ✓"]]);
  assert.deepEqual(g2a[0].lettres, ["3 × N + 2 × Vi = 44"]);
  assert.deepEqual(g2a[2].lettres, ["2 × Vi = 14", "Vi = 14 ÷ 2 = 7"]);

  const g2b = sys.plan(situation("COEF", [n, vi], { black: 10, purple: 5 }, [
    { counts: { black: 2, purple: 4 }, total: 40, visible: [] }, { counts: { black: 2, purple: 1 }, total: 25 }]));
  assert.deepEqual(g2b.map((e) => e.titre), ["Le plateau entier", "L’indice : une partie du plateau", "Ce qui reste : 3 violettes, on partage", "Dans l’indice : on retire la violette, on partage", "Vérification"]);
  assert.deepEqual(g2b.map((e) => e.calculs), [
    ["2 noires + 4 violettes = 40"], ["ce qui reste :", "40 − 25 = 15"], ["3 violettes = 15", "violette = 15 ÷ 3 = 5"],
    ["2 noires = 25 − 5 = 20", "noire = 20 ÷ 2 = 10"], ["2 × 10 + 4 × 5 = 20 + 20 = 40 ✓", "2 × 10 + 5 = 25 ✓"]]);

  // doubler : l'indice 1 + 1 (le seul qui tient en 6 taches, décidé le 23/09)
  const g3 = sys.plan(situation("DOUBLE", [n, vi], { black: 8, purple: 6 }, [
    { counts: { black: 2, purple: 3 }, total: 34, visible: [] }, { counts: { black: 1, purple: 1 }, total: 14 }]));
  assert.deepEqual(g3.map((e) => e.titre), ["Le plateau entier", "L’indice, puis l’indice doublé", "On compare au plateau : ce qui reste", "Dans l’indice : on retire la violette", "Vérification"]);
  assert.deepEqual(g3.map((e) => e.calculs), [
    ["2 noires + 3 violettes = 34"], ["1 noire + 1 violette = 14", "on double :", "2 noires + 2 violettes = 28"],
    ["ce qui reste :", "34 − 28 = 6", "violette = 6"], ["noire = 14 − 6 = 8"], ["2 × 8 + 3 × 6 = 16 + 18 = 34 ✓", "8 + 6 = 14 ✓"]]);
  assert.equal(g3[1].barres[1].top, "14 + 14 = 28");

  const g4a = sys.plan(situation("MIROIR", [n, vi], { black: 5, purple: 7 }, [
    { counts: { black: 2, purple: 3 }, total: 31, visible: [] }, { counts: { black: 3, purple: 2 }, total: 29 }]));
  assert.deepEqual(g4a.map((e) => e.titre), ["Les deux situations «\u00a0en miroir\u00a0»", "On les additionne, puis on partage", "Dans le plateau : deux paires et une tache violette de plus", "Vérification"]);
  assert.deepEqual(g4a.map((e) => e.calculs), [
    ["2 noires + 3 violettes = 31", "3 noires + 2 violettes = 29"], ["5 noires + 5 violettes = 60", "on partage en 5 :", "1 noire + 1 violette = 12"],
    ["12 + 12 + violette = 31", "violette = 31 − 24 = 7", "noire = 12 − 7 = 5"], ["2 × 5 + 3 × 7 = 10 + 21 = 31 ✓", "3 × 5 + 2 × 7 = 15 + 14 = 29 ✓"]]);
  assert.deepEqual(g4a[1].lettres, ["5 × N + 5 × Vi = 60", "on partage en 5 :", "N + Vi = 12"]);

  const g4b = sys.plan(situation("TROIS", [n, vi, o], { black: 5, purple: 7, orange: 8 }, [
    { counts: { black: 1, purple: 1, orange: 1 }, total: null, visible: [] }, { counts: { black: 1, purple: 1 }, total: 12 },
    { counts: { purple: 1, orange: 1 }, total: 15 }, { counts: { black: 1, orange: 1 }, total: 13 }]));
  assert.deepEqual(g4b.map((e) => e.titre), ["Les trois indices : trois paires", "On les additionne : deux fois le plateau", "Le total trouvé, chaque indice donne une tache", "Vérification"]);
  assert.deepEqual(g4b.map((e) => e.calculs), [
    ["noire + violette = 12", "violette + orange = 15", "noire + orange = 13"],
    ["chaque tache compte deux fois :", "2 plateaux = 40", "TOTAL du plateau = 40 ÷ 2 = 20"],
    ["orange = 20 − 12 = 8", "noire = 20 − 15 = 5", "violette = 20 − 13 = 7"], ["5 + 7 = 12 ✓", "7 + 8 = 15 ✓", "5 + 8 = 13 ✓"]]);
  assert.deepEqual(g4b[1].lettres, ["chaque tache compte deux fois :", "2 × (N + Vi + O) = 40", "N + Vi + O = 40 ÷ 2 = 20"]);
  assert.deepEqual(g4b[0].barres.map((b) => b.offset), [0, 1, 2]);
});

test("le filtre des nombres à sous-entendu", () => {
  for(const x of [69, 169, 690, 88, 188, 420, 1420, 666, 1488]) assert.ok(sys.sousEntendu(x), String(x));
  for(const x of [6, 9, 68, 70, 86, 89, 42, 66, 148]) assert.ok(!sys.sousEntendu(x), String(x));
});

test("la page : le générateur n'est appelé qu'en mode D, et le panneau porte les réglages de la conception", () => {
  const generate = html.slice(html.indexOf("function generate("), html.indexOf("function genererSerieComposee("));
  assert.equal((generate.match(/genSystem\(/g) || []).length, 1);
  assert.match(generate, /\}else if\(act==="D"\)\{\s*c = genSystem\(rng\);/);
  assert.match(fn("genSystem"), /return genSystemCarte\(rng, lireReglagesSysteme\(\)\);/);
  const panneau = html.slice(html.indexOf('<div id="systemSettings"'), html.indexOf("<!-- Réglages d'affichage"));
  assert.match(panneau, /<select id="sysGeste"[^>]*>\s*<option value="EMBOITE1" selected>[\s\S]*value="MIX"/);
  for(const g of GESTES) assert.match(panneau, new RegExp(`<option value="${g}"`));
  for(const g of GESTES) assert.match(panneau, new RegExp(`id="sysMix${g}"${sys.SYS_GESTES_MIX_DEFAUT.includes(g) ? " checked" : ">"}`));
  assert.match(panneau, /<option value="BOARD" selected>Plateaux<\/option>\s*<option value="SENTENCE">Phrases<\/option>\s*<option value="SYMBOL">/);
  assert.match(panneau, /<input id="sysCoefMax" type="number" min="1" max="4" value="3" \/>/);
  assert.match(panneau, /<input id="sysTotalMin" type="number" min="1" max="1000" value="20" \/>/);
  assert.match(panneau, /<input id="sysTotalMax" type="number" min="1" max="1000" value="60" \/>/);
  // 6 taches au plus : la table de tirage ET la table de dessin du mode D les placent (2 rangées de 3)
  const tables = new Function(`
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    ${fn("getTrayConfig")}
    ${fn("getNumberedSplatsLegacy")}
    ${fn("getNumberedSplats")}
    return { getTrayConfig, getNumberedSplatsLegacy, getNumberedSplats };`)();
  const plateau = tables.getTrayConfig("D");
  for(let n = 1; n <= 6; n++){
    const t = tables.getNumberedSplats(n, "D");
    assert.equal(t.length, n, `${n} taches : ${t.length} places`);
    // lot S2 : à 4 taches, la table de dessin du plateau bas écarte les deux rangées (elles se touchaient) ;
    // lot « plateau en ligne » (03/10/2026) : 3, 4 et 5 taches côte à côte au milieu du plateau
    if(n === 3) assert.deepEqual(t, [{cx:330, cy:545, r:145},{cx:820, cy:545, r:145},{cx:1310, cy:545, r:145}]);
    else if(n === 4 || n === 5){ assert.ok(t.every(s => s.cy === 545), `${n} taches : une rangée`); assert.notDeepEqual(t, tables.getNumberedSplatsLegacy(n, "D")); }
    else assert.deepEqual(t, tables.getNumberedSplatsLegacy(n, "D"));
    for(const s of t) assert.ok(s.cy - 0.74 * s.r >= plateau.y && s.cy + 1.10 * s.r <= plateau.y + plateau.h && s.cx - 1.06 * s.r >= plateau.x && s.cx + 1.06 * s.r <= plateau.x + plateau.w, `${n} taches : une tache sort du plateau`);
  }
});

/* L'adresse partagée : buildShareUrl écrit les réglages de D, appliquerConfiguration les relit. */
test("adresses : aller-retour buildShareUrl → appliquerConfiguration pour le mode D", () => {
  const champ = (value, extra = {}) => Object.assign({ value: String(value), type: "number", tagName: "INPUT", min: "", max: "" }, extra);
  const liste = (value, options) => ({ value, tagName: "SELECT", options: options.map((v) => ({ value: v, disabled: false })) });
  const coche = (checked) => ({ type: "checkbox", tagName: "INPUT", checked });
  const page = () => {
    const els = {
      activityEl: liste("D", ["U", "UPM", "N", "NPM", "C", "D", "C9", "C8"]),
      sysGesteEl: liste("EMBOITE1", ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS", "ESCALIER", "RECOPIE", "ETAGES", "MIX"]),
      // lot M4-1
      sysEcartEl: liste("", ["", "1", "2"]), sysFoisEl: liste("2", ["2", "3", "4", "MIX"]), sysIndiceEl: liste("11", ["11", "12"]),
      sysSensEl: liste("PLATEAU", ["PLATEAU", "INDICE"]), sysOrdreEl: liste("", ["", "MELANGE"]),
      // lot M4-5
      sysFormeEl: liste("", ["", "12", "23", "13", "MIX"]), sysGrandEl: liste("", ["", "211", "112"]),
      sysSousEl: liste("MIX", ["MIX", "COEF", "MIROIR", "RECOPIE", "DOUBLE"]),
      // lot M4-2 : « Pas à pas » (correction au tableau)
      sysPasAPasEl: coche(true),
      sysCoefMaxEl: champ(3, { min: "1", max: "4" }),
      sysClueTypeEl: liste("BOARD", ["BOARD", "SENTENCE", "SYMBOL"]),
      sysVisibleMinEl: champ(0, { min: "0", max: "10" }), sysVisibleMaxEl: champ(3, { min: "0", max: "10" }),
      sysTotalMinEl: champ(20, { min: "1", max: "1000" }), sysTotalMaxEl: champ(60, { min: "1", max: "1000" }),
      seedSysEl: champ(""), countEl: champ(8, { min: "1", max: "300" }),
      printModeSelectEl: liste("statement", ["statement", "worksheet", "correction", "duplex-worksheet", "duplex-correction"]),
      printCardsPerPageEl: liste("4", ["1", "2", "4", "6"]),
      printActivityTitleEl: { value: "" }
    };
    const cases = {};
    for(const g of sys.SYS_GESTES) cases["sysMix" + g] = coche(sys.SYS_GESTES_MIX_DEFAUT.includes(g));
    return { els, cases };
  };
  const monter = ({ els, cases }) => new Function(...Object.keys(els), "document", "window", `
    ${PALETTE}
    ${fn("investigateColorByKey")}
    ${fn("investigateColorWord")}
    ${CONSTANTES_SYS}
    let investigatePaletteKeys = null, printInstructionNote = "", numberedQuestionMarkMode = true, activeGenerationSeed = "4242";
    const unitEquationTypeEl = null, numberedEquationTypeEl = null;
    function syncSettingsUI(){}
    function syncNumberedQuestionMarkButton(){}
    function applyDefaultUnknownDisplayForActivity(){ if(activityEl.value === "D") numberedQuestionMarkMode = true; }
    function getSeedElementForCurrentMode(){ return seedSysEl; }
    ${fn("parseInvestigatePalette")}
    ${fn("setSelectFromShare")}
    ${fn("setNumberFromShare")}
    ${fn("readBooleanFromShare")}
    ${fn("setCheckboxFromShare")}
    ${fn("getClassicShareControls")}
    ${fn("applyShareControl")}
    ${fn("normalizeLegacyInvestigateMode")}
    ${fn("appliquerConfiguration")}
    ${fn("addShareControl")}
    ${fn("buildShareUrl")}
    ${fn("sysLireGestes")}
    ${fn("sysLireGestesMix")}
    ${fn("sysAppliquerGestesMix")}
    ${fn("sysGestesLus")}
    ${fn("sysLireReglagesM4")}
    ${fn("sysEcrireReglagesM4")}
    return { buildShareUrl, appliquerConfiguration,
      etat: () => ({ palette: investigatePaletteKeys, question: numberedQuestionMarkMode }),
      poserPalette: (p) => { investigatePaletteKeys = parseInvestigatePalette(p); },
      poserInconnue: (q) => { numberedQuestionMarkMode = q; } };
  `)(...Object.values(els), { getElementById: (id) => cases[id] || null }, { location: { origin: "https://mathsgo.re" } });

  // une configuration de D, loin des valeurs par défaut
  const a = page();
  const A = monter(a);
  Object.assign(a.els.sysGesteEl, { value: "MIX" });
  a.els.sysCoefMaxEl.value = "4";
  a.els.sysClueTypeEl.value = "SENTENCE";
  a.els.sysVisibleMinEl.value = "1"; a.els.sysVisibleMaxEl.value = "2";
  a.els.sysTotalMinEl.value = "30"; a.els.sysTotalMaxEl.value = "90";
  for(const g of sys.SYS_GESTES) a.cases["sysMix" + g].checked = ["COEF", "DOUBLE", "MIROIR"].includes(g);
  A.poserPalette("noire,bleue,rouge");
  A.poserInconnue(false);
  const url = new URL(A.buildShareUrl());
  const p = url.searchParams;
  assert.equal(url.pathname, "/splat/classique/");
  assert.equal(p.get("mode"), "D");
  assert.equal(p.get("seed"), "4242");
  assert.equal(p.get("geste"), "MIX");
  assert.equal(p.get("gestes"), "COEF,DOUBLE,MIROIR");
  assert.equal(p.get("coefMax"), "4");
  assert.equal(p.get("clues"), "SENTENCE");
  assert.equal(p.get("palette"), "black,blue,red");
  assert.equal(p.get("unknown"), "letter");
  assert.deepEqual([p.get("visibleMin"), p.get("visibleMax"), p.get("totalMin"), p.get("totalMax")], ["1", "2", "30", "90"]);

  // une page neuve relit l'adresse et retrouve exactement la configuration
  const b = page();
  const B = monter(b);
  B.appliquerConfiguration(p);
  for(const nom of ["sysGesteEl", "sysCoefMaxEl", "sysClueTypeEl", "sysVisibleMinEl", "sysVisibleMaxEl", "sysTotalMinEl", "sysTotalMaxEl", "countEl"]){
    assert.equal(b.els[nom].value, a.els[nom].value, nom);
  }
  assert.equal(b.els.seedSysEl.value, "4242");
  for(const g of sys.SYS_GESTES) assert.equal(b.cases["sysMix" + g].checked, a.cases["sysMix" + g].checked, g);
  assert.deepEqual(B.etat(), { palette: ["black", "blue", "red"], question: false });
  // et l'adresse qu'elle refabrique est la même
  assert.equal(B.buildShareUrl(), A.buildShareUrl());

  // sans « Mélange », pas de gestes= ; un geste simple et l'inconnue « ? »
  const c = page();
  const Cc = monter(c);
  c.els.sysGesteEl.value = "TROIS";
  const q = new URL(Cc.buildShareUrl()).searchParams;
  assert.equal(q.get("geste"), "TROIS");
  assert.equal(q.has("gestes"), false);
  assert.equal(q.get("unknown"), "question");
  assert.equal(q.has("palette"), false);
  // une valeur inconnue dans l'adresse ne change rien
  const d = page();
  const D = monter(d);
  D.appliquerConfiguration(new URLSearchParams("mode=D&geste=QUATRE&gestes=inconnu&coefMax=9&clues=AUTRE"));
  assert.equal(d.els.sysGesteEl.value, "EMBOITE1");
  assert.equal(d.els.sysCoefMaxEl.value, "3");
  assert.equal(d.els.sysClueTypeEl.value, "BOARD");
  for(const g of sys.SYS_GESTES) assert.equal(d.cases["sysMix" + g].checked, sys.SYS_GESTES_MIX_DEFAUT.includes(g));
});
