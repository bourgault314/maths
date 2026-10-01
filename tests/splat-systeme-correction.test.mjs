/* SPLAT! — le Système (mode D), lot S3 « la correction » (24/09/2026 ; conception S0, §4).
   Un cadre par étape de card._sys.plan (le plan du générateur, lot S1) : titre, barres (barre
   du total vert pâle, cases « ? » gris ardoise, cases connues orange pâle, jetons visibles
   cerclés de vert, « ce qui reste » pointillé cannelle ; une mini-tache et le mot de la couleur
   dans chaque case), calculs en italique, vérification avec les réponses. Écran : un cadre par
   clic, en bas de la scène, les plateaux en haut (même taille, décidé le 24/09), le fil des
   étapes passées à droite ; le dernier clic dévoile les taches. Impression 4 par page :
   l'énoncé dévoilé en haut (décidé le 24/09), les cadres empilés dessous, le dernier ≤ 2 130.
   Aucune arithmétique dans le dessin : tout nombre écrit vient du plan.
   Les fonctions de outils/splat.html sont extraites du fichier et exécutées telles quelles,
   le dessin sur un faux SVG (objets), sur plusieurs milliers de cartes du générateur. */
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
/* une constante sur plusieurs lignes (« const X = { … };») */
function constante(nom){
  const start = html.indexOf(`\nconst ${nom} = `);
  assert.notEqual(start, -1, `${nom} introuvable`);
  return html.slice(start + 1, html.indexOf(";\n", start) + 2);
}

const PALETTE = html.slice(html.indexOf("const INVESTIGATE_COLOR_PALETTE = ["), html.indexOf("];", html.indexOf("const INVESTIGATE_COLOR_PALETTE = [")) + 2);
const CONSTANTES = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS", "SYS_COULEURS_PLURIEL", "SYS_PLAGES",
  "SYS_ZONE_ECRAN", "SYS_ZONE_IMPRIME", "SYS_ZONE_IMPRIME_6", "SYS_TACHE", "SYS_CORR", "SYS_CORR_LOUPE_MAX", "SYS_ZONE_ECRAN_CORRECTION", "SYS_ZONE_IMPRIME_CORRECTION",
  "SYS_FIL", "SYS_UNIQUE_ECRAN", "SYS_UNIQUE_IMPRIME", "ENQUETE_DEPASSE_TRAIT", "ENQUETE_DEPASSE_FOND", "ENQUETE_ECRITURE_FOND", "ENQUETE_ECRITURE_ENCRE"].map(constante).join("\n");
const GENERATEUR = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure",
  "sysAssemblerCarte", "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlan"].map(fn).join("\n");
const DESSIN = ["sysEnPlateaux", "sysTotalCache", "sysRayonJeton", "sysGrille", "sysColonnesVisibles", "sysRayonMax", "sysDispositionPlateaux",
  "sysAPlan", "sysCorrPoids", "sysCorrLongueur", "sysCorrUnite", "sysCorrMetriques", "sysCorrHauteurCadre", "sysCorrMesures", "sysCorrEtiquette",
  "sysCorrLargeurCalcul", "sysCorrAjuster", "drawSysCase", "drawSysBarre", "drawSysCadre", "drawSysCorrectionImprimee", "blobPath"].map(fn).join("\n");

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
  ${GENERATEUR}
  ${DESSIN}
  /* faux SVG : des objets, les textes gardés dans l'ordre */
  const mkEl = (name, attrs = {}) => ({ name, attrs, children: [], appendChild(c){ this.children.push(c); return c; } });
  const mkText = (x, y, t, attrs = {}) => ({ name: "text", attrs: { x, y, ...attrs }, text: String(t), children: [], appendChild(){} });
  return {
    C: SYS_CORR, LOUPE: SYS_CORR_LOUPE_MAX, metriques: sysCorrMetriques, ZE: SYS_ZONE_ECRAN_CORRECTION, ZI: SYS_ZONE_IMPRIME_CORRECTION, UE: SYS_UNIQUE_ECRAN, UI: SYS_UNIQUE_IMPRIME, FIL: SYS_FIL,
    GESTES: SYS_GESTES, mesures: sysCorrMesures, hauteur: sysCorrHauteurCadre, disposition: sysDispositionPlateaux, enPlateaux: sysEnPlateaux,
    aPlan: sysAPlan, poids: sysCorrPoids, longueur: sysCorrLongueur,
    cadre(card, etape, lettres, isPrint){
      const racine = mkEl("g");
      const m = sysCorrMesures(card);
      const h = drawSysCadre(racine, card, etape, 500, m, { mkEl, mkText, isPrint: !!isPrint, lettres: !!lettres }, 3);
      return { g: racine.children[0], h, m };
    },
    imprimee(card, haut, lettres){
      const racine = mkEl("svg");
      const bas = drawSysCorrectionImprimee(racine, card, haut, SYS_CORR.basImprime, { mkEl, mkText, isPrint: true, lettres: !!lettres });
      return { g: racine.children[0], bas };
    },
    serie(graine, n, reglages){
      const rng = mulberry32(graine);
      const out = [];
      for(let i = 0; i < n; i++) out.push(genSystemCarte(rng, reglages));
      return out;
    }
  };
`)();

/* graines fixes, sans nombre à sous-entendu */
const sousEntendu = (n) => ["69", "88", "420", "666", "1488"].some((x) => String(n).includes(x));
function graines(n){ const out = []; for(let s = 1; out.length < n; s++) if(!sousEntendu(s)) out.push(s); return out; }

/* 6 gestes × 4 réglages (défaut ; 6 visibles et coefficients 4 ; sans visible ; 10 visibles et grands totaux) × 50 graines × 4 cartes */
const REGLAGES = [{}, { visMax: 6, coefMax: 4, totalMax: 150 }, { visMin: 0, visMax: 0, coefMax: 4 }, { visMax: 10, totalMax: 300, coefMax: 4 }];
const CARTES = [];
for(const geste of sys.GESTES) for(const r of REGLAGES) for(const g of graines(50)) for(const c of sys.serie(g, 4, { geste, ...r })) CARTES.push(c);

const textes = (n, out = []) => { if(!n) return out; if(n.name === "text") out.push(n); (n.children || []).forEach((c) => textes(c, out)); return out; };
const elements = (n, name, out = []) => { if(!n) return out; if(n.name === name) out.push(n); (n.children || []).forEach((c) => elements(c, name, out)); return out; };

test("toutes les cartes du Système ont un plan : D devient une carte à étapes, un clic par cadre", () => {
  for(const c of CARTES) assert.ok(sys.aPlan(c));
  assert.ok(!sys.aPlan({ family: "D" }), "une carte D sans modèle (ancienne) garde les deux états");
  assert.ok(!sys.aPlan({ family: "C", _sys: { plan: [{}] } }));
  assert.match(fn("isRevealSequenceCard"), /card\.family === "C" \|\| sysAPlan\(card\)\);/);
  assert.match(fn("getMaxRevealState"), /if\(sysAPlan\(card\)\) return card\._sys\.plan\.length;\n  return 2;\n\}\n?$/);
  // en arrière : une étape à la fois (le retour direct à l'énoncé du lot S2 n'a plus lieu d'être)
  const prec = fn("goPreviousCardOrStep");
  assert.match(prec, /if\(revealState > 0\)\{\n    revealState = revealState - 1;/);
  assert.doesNotMatch(prec, /family === "D"/);
  // l'écran : à partir du 1er clic, la correction ; l'énoncé (état 0) ne change pas
  // (lot « mode élève du Système » : au téléphone, en mode élève, le dessin portrait)
  assert.match(fn("renderCard"), /^function renderCard\(card, revealState, opts = \{\}\)\{\n  clearSvg\(\);\n\n  \/\* [^\n]+\n[^\n]+\*\/\n  if\(sysAPlan\(card\) && revealState >= 1 && !opts\.sansCorrection\)\{\n    if\(typeof eleveSchemaTel !== "undefined" && eleveSchemaTel\) drawSysCorrectionTelephone\(card, revealState\);\n    else drawSysCorrectionEcran\(card, revealState\);\n    return;\n  \}/);
});

test("chaque ligne de calcul dessinée est la ligne du plan (mots, et lettres en unknown=letter), titres et étiquettes compris", () => {
  let n = 0;
  for(const c of CARTES.filter((_, i) => i % 3 === 0)){
    c._sys.plan.forEach((etape) => {
      for(const lettres of [false, true]){
        const { g } = sys.cadre(c, etape, lettres, true);
        const t = textes(g).map((x) => x.text);
        assert.equal(t[0], `3. ${etape.titre}`, "le titre, numéroté");
        const attendues = lettres ? etape.lettres : etape.calculs;
        const italiques = textes(g).filter((x) => x.attrs["font-style"] === "italic").map((x) => x.text);
        assert.deepEqual(italiques, attendues, `${c._sys.geste} · ${etape.role} : les calculs dessinés ≠ le plan`);
        etape.barres.forEach((b) => assert.ok(t.includes(String(b.top)), `étiquette ${b.top} absente`));
        if(etape.role === "verification"){
          etape.reponses.forEach((r) => assert.ok(t.some((x) => x.endsWith(` = ${r.value}`)), "réponse absente"));
        }
        n++;
      }
    });
  }
  assert.ok(n > 10000, `${n} cadres`);
});

test("aucun nombre inventé : tout nombre écrit dans un cadre est déjà dans le plan", () => {
  for(const c of CARTES.filter((_, i) => i % 2 === 0)){
    for(const etape of c._sys.plan){
      const source = [etape.titre, ...etape.calculs, ...etape.lettres, ...etape.barres.map((b) => String(b.top)),
        ...etape.barres.flatMap((b) => b.cells.flatMap((x) => [x.value, x.label, ...(x.covers || []).map((y) => y.value)])),
        ...(etape.reponses || []).map((r) => r.value), "3."].filter((x) => x != null).join(" ");
      const permis = new Set(source.match(/\d+/g) || []);
      for(const lettres of [false, true]){
        for(const t of textes(sys.cadre(c, etape, lettres, false).g)){
          for(const nb of t.text.match(/\d+/g) || []) assert.ok(permis.has(nb), `${nb} n'est pas dans le plan (${t.text})`);
        }
      }
    }
  }
  // et le bloc du dessin ne lit jamais les valeurs de la carte
  const bloc = html.slice(html.indexOf("const SYS_CORR = "), html.indexOf("/* Render écran */"));
  assert.doesNotMatch(bloc, /_sys\.values|card\.hidden|\.total\s*[-+*/]|rng|Math\.random|rInt\(|shuffleInPlace/);
});

test("les barres : largeur d'une case la même pour toute la carte, barres dans leur place, cases dans l'ordre du plan", () => {
  for(const c of CARTES){
    const m = sys.mesures(c);
    // compté ici, sans les fonctions du dessin : 1 par tache, 0,6 par jeton visible, « ce qui reste » = ce qu'il couvre
    const poids = (x) => x.kind === "visible" ? 0.6 : (x.kind === "rest" ? x.covers.reduce((s, y) => s + poids(y), 0) : 1);
    const L = Math.max(...c._sys.plan.flatMap((e) => e.barres.map((b) => b.offset + b.cells.reduce((s, x) => s + poids(x), 0))));
    assert.ok(L * m.u <= sys.C.barres + 0.5, "une barre dépasse sa place");
    assert.ok(m.u <= sys.C.caseMax && m.u >= 40, `case de ${m.u}`);
    assert.ok(sys.C.x + sys.C.w - 30 - m.calculX >= 480, "la colonne des calculs est trop étroite");
  }
  // une carte à visibles : « ce qui reste » couvre exactement ce qu'il remplace
  const c = CARTES.find((x) => x._sys.geste === "PARTIELLE" && x.visible.length === 3);
  const indice = c._sys.plan.find((e) => e.role === "indice");
  const reste = indice.barres[0].cells.find((x) => x.kind === "rest");
  assert.ok(Math.abs(sys.poids(reste) - (reste.covers.length - 3 + 3 * sys.C.visible)) < 1e-9);
  const { g } = sys.cadre(c, indice, false, true);
  const pointilles = elements(g, "rect").filter((r) => r.attrs["stroke-dasharray"]);
  assert.equal(pointilles.length, 1);
  assert.equal(pointilles[0].attrs.stroke, "#92400e");
  const m = sys.mesures(c);
  assert.ok(Math.abs(pointilles[0].attrs.width - sys.poids(reste) * m.u) < 0.01);
  // chaque barre commence à offset largeurs de case du bord : une tache garde sa place d'un cadre à l'autre
  for(const carte of CARTES.filter((_, i) => i % 7 === 0)){
    const mm = sys.mesures(carte);
    for(const etape of carte._sys.plan) etape.barres.forEach((b, i) => {
      const g = sys.cadre(carte, etape, false, true).g;
      const vertes = elements(g, "rect").filter((r) => r.attrs.fill === "rgba(22,163,74,0.14)");
      assert.ok(Math.abs(vertes[i].attrs.x - (sys.C.barX + b.offset * mm.u)) < 0.01, `${carte._sys.geste} · ${etape.role} : barre mal placée`);
    });
  }
});

test("dans chaque case : une mini-tache et le mot de la couleur (ou son initiale si la case est étroite) ; en lettres, la lettre", () => {
  const c = CARTES.find((x) => x._sys.geste === "COEF" && x.visible.length === 0);
  const etape = c._sys.plan[0];
  const mots = c._sys.colors.map((k) => ({ black: "noire", purple: "violette", orange: "orange", blue: "bleue", green: "verte", red: "rouge" })[k]);
  const t = textes(sys.cadre(c, etape, false, true).g).map((x) => x.text);
  const nbCases = etape.barres[0].cells.length;
  assert.equal(t.filter((x) => x === "?").length, nbCases);
  assert.equal(t.filter((x) => mots.includes(x)).length, nbCases, "le mot de la couleur dans chaque case");
  const tl = textes(sys.cadre(c, etape, true, true).g).map((x) => x.text);
  assert.equal(tl.filter((x) => ["N", "Vi", "O", "B", "Ve", "R"].includes(x)).length, nbCases, "la lettre dans chaque case");
  // lisible en gris : aucun texte clair coloré, dans aucun cadre (cases connues, « ce qui reste », barres du total)
  for(const carte of CARTES.filter((_, i) => i % 40 === 0)) for(const etape of carte._sys.plan) for(const lettres of [false, true]){
    for(const x of textes(sys.cadre(carte, etape, lettres, true).g)) assert.ok(["#0f172a", "#334155", "#9a3412", "#92400e", "#14532d"].includes(x.attrs.fill), `texte en ${x.attrs.fill}`);
  }
  // une mini-tache par case
  assert.equal(elements(sys.cadre(c, etape, false, true).g, "path").length, nbCases);
});

test("écran : chaque cadre tient sous les plateaux (posé juste dessous, 24/09), les plateaux sur une rangée, à la même taille, TOTAL jamais collé", () => {
  let marge = Infinity;
  for(const c of CARTES){
    const m = sys.mesures(c);
    const d = sys.disposition(c, sys.ZE);
    const bande = Math.max(...d.plateaux.map((P) => P.y + P.h));
    assert.ok(bande <= sys.ZE.bas);
    assert.equal(new Set(d.plateaux.map((P) => P.y)).size, 1, "une seule rangée");
    d.plateaux.forEach((P) => {
      assert.ok(P.x + P.w <= sys.FIL.x - 10, "un plateau passe sous le fil");
      assert.ok(P.y - (P.totalY + 210 * sys.ZE.echelleTotal) >= 14, "TOTAL collé au plateau");
      P.taches.forEach((s) => assert.equal(s.r, d.r));
    });
    // le cadre se pose à bande + 40 : même le plus haut de la carte finit dans la scène
    // (le filet « jamais sous la scène » ne sert donc jamais en Plateaux : le cadre ne bouge pas)
    m.hauteurs.forEach((h) => { marge = Math.min(marge, 1000 - 20 - (bande + 40) - h); });
  }
  assert.ok(marge >= 0, `un cadre sort de la scène (marge ${marge})`);
  // Phrases / Symboles : le plateau unique réduit tient au-dessus du plus haut cadre
  const hMax = Math.max(...CARTES.flatMap((c) => sys.mesures(c).hauteurs));
  assert.ok(sys.UE.y + sys.UE.hauteur * sys.UE.k <= 1000 - hMax - 20 - 10);
});

test("impression : l'énoncé dévoilé en haut, puis les cadres empilés ; le dernier finit avant 2 130, sans réduction", () => {
  let pire = 0;
  for(const c of CARTES){
    const d = sys.disposition(c, sys.ZI);
    assert.equal(new Set(d.plateaux.map((P) => P.y)).size, 1, "une seule rangée");
    d.plateaux.forEach((P) => assert.ok(P.y - (P.totalY + 210 * sys.ZI.echelleTotal) >= 14, "TOTAL collé au plateau"));
    const haut = Math.max(...d.plateaux.map((P) => P.y + P.h)) + sys.C.ecartEnonce;
    const { g, bas } = sys.imprimee(c, haut, false);
    assert.equal(g.attrs.transform, "", "la pile a dû être réduite");
    assert.ok(bas <= 2130, `dernier cadre à ${bas}`);
    // Phrases / Symboles : sous le plateau unique réduit
    const hautU = sys.UI.y + sys.UI.hauteur * sys.UI.k + sys.C.ecartEnonce;
    const u = sys.imprimee(c, hautU, true);
    assert.equal(u.g.attrs.transform, "");
    pire = Math.max(pire, bas, u.bas);
    // les cadres ne se chevauchent pas : écart de 26 entre deux
    const cadres = g.children.map((x) => x.children[0]);
    for(let i = 1; i < cadres.length; i++) assert.equal(cadres[i].attrs.y - (cadres[i - 1].attrs.y + cadres[i - 1].attrs.height), sys.C.ecartCadres);
  }
  assert.ok(pire <= 2130, `pire ${pire}`);
  // la sûreté : une pile trop haute est réduite d'un même facteur (jamais coupée)
  const c = CARTES.find((x) => x._sys.geste === "DOUBLE");
  const { g, bas } = sys.imprimee(c, 1200, false);
  assert.match(g.attrs.transform, /^translate\(\d+ \d+\) scale\(0\.\d+\)$/);
  assert.ok(bas <= 2130.5);
});

test("impression : la correction 4 par page passe par drawSysCorrectionImprimee ; 6 par page garde les taches dévoilées (lot S2)", () => {
  const imp = fn("renderCardIntoSvg");
  assert.match(imp, /^function renderCardIntoSvg\(targetSvg, card, printMode, opts = \{\}\)\{/);
  assert.match(imp, /if\(revealAnswers && sysAPlan\(card\) && !opts\.sansCorrectionSys && String\(targetSvg\.getAttribute\("viewBox"\) \|\| ""\)\.trim\(\) !== "0 0 1600 1000"\)\{/);
  assert.match(imp, /drawSysPlateaux\(targetSvg, card, SYS_ZONE_IMPRIME_CORRECTION, \{ mkEl:tEl, mkText:tText, isPrint:true, devoile:true, nomMin:SYS_ZONE_IMPRIME_CORRECTION\.nomMin \}\);/);
  assert.match(imp, /drawSysCorrectionImprimee\(targetSvg, card, haut, SYS_CORR\.basImprime, ctx\);\n    return;/);
  // le bloc S3 passe avant celui du lot S2 (énoncé, 6 par page)
  assert.ok(imp.indexOf("drawSysCorrectionImprimee(") < imp.indexOf("drawSysPlateaux(targetSvg, card, sixParPage ? SYS_ZONE_IMPRIME_6 : SYS_ZONE_IMPRIME"));
  // Phrases / Symboles : la correction d'avant (TOTAL et plateau), sans ses indices, réduite ; les indices en colonne
  assert.match(imp, /renderCardIntoSvg\(avant, sysCarteSansIndices\(card\), "correction", \{ sansCorrectionSys:true \}\);/);
  assert.match(fn("sysCarteSansIndices"), /indices: \[\]/);
});

test("titres retouchés le 24/09 : « une tache orange », jamais « une orange » ; « deux paires et une tache rouge de plus »", () => {
  const titres = new Set(CARTES.flatMap((c) => c._sys.plan.map((e) => e.titre)));
  for(const t of titres){
    assert.doesNotMatch(t, /\bune (noire|violette|orange|bleue|verte|rouge)\b/, t);
    assert.doesNotMatch(t, /, et une/, t);
  }
  assert.ok([...titres].some((t) => /^Ce qui reste : une tache \w+/.test(t)));
  assert.ok([...titres].some((t) => /^Dans le plateau : (une|deux) paires? et une tache \w+ de plus$/.test(t)));
  assert.ok([...titres].some((t) => /^Dans le plateau : (une|deux) paires?, une tache \w+ de plus et (le jeton visible|les jetons visibles)$/.test(t)));
});

test("écran : le fil des étapes passées à droite, le cadre courant en bas ; Phrases / Symboles : le plateau unique réduit, indices et fil à droite", () => {
  const src = fn("drawSysCorrectionEcran");
  assert.match(src, /drawSysPlateaux\(svg, card, SYS_ZONE_ECRAN_CORRECTION, \{ devoile: dernier \|\| devoileEleve, fondu: !devoileEleve, nomMin: SYS_ZONE_ECRAN_CORRECTION\.nomMin \}\);/);
  assert.match(src, /const dernier = k >= plan\.length;/);
  assert.match(src, /for\(let i = 0; i < k - 1; i\+\+\)\{\n    wrapTextToWidth\(`\$\{i \+ 1\}\. \$\{plan\[i\]\.titre\}`/);
  // 24/09 : le cadre juste sous les plateaux (et sous le fil au dernier clic), haut fixe pour
  // toute la carte, agrandi par la loupe autant que le plus haut cadre le permet
  assert.match(src, /const yCadre = Math\.round\(Math\.min\(Math\.max\(basHaut, filBas - SYS_FIL\.pas\) \+ SYS_CORR_ECRAN_ECART, 1000 - 20 - Math\.max\(\.\.\.mesures\.hauteurs\)\)\);/);
  assert.match(src, /for\(let i = 0; i < plan\.length - 1; i\+\+\) filBas \+=/, "le fil compté jusqu'au dernier clic, pas jusqu'au clic courant");
  assert.match(src, /if\(yCadre \+ Math\.max\(\.\.\.m\.hauteurs\) <= 1000 - 20\)\{ mesures = m; break; \}/);
  assert.match(src, /drawSysCadre\(svg, card, plan\[k - 1\], yCadre, mesures, Object\.assign\(\{\}, ctx, \{ C: mesures\.C \}\), k\);/);
  assert.doesNotMatch(src, /1000 - h - 20/, "le cadre n'est plus posé en bas de la scène");
  assert.match(html, /\nconst SYS_CORR_ECRAN_ECART = 40;\n/, "40 sous les plateaux : c'est ce que mesure le test de la marge");
  assert.match(src, /renderCard\(sysCarteSansIndices\(card\), \(dernier \|\| devoileEleve\) \? 2 : 0, \{ sansCorrection:true \}\);/);
  // la lettre (𝑥) ou « ? » : le bouton de la page, comme les autres modes
  assert.match(src, /lettres:!numberedQuestionMarkMode/);
});

test("la loupe (24/09) : à l'impression, les cadres grandissent autant que la place le permet (au plus ×1,35) ; les largeurs ne bougent pas ; sans loupe, rien ne change", () => {
  assert.equal(sys.LOUPE, 1.35);
  assert.equal(sys.metriques(1), sys.C, "facteur 1 : les mesures de S3, telles quelles (l'écran sans loupe)");
  const M = sys.metriques(1.3);
  for(const k of ["hHaut", "hCase", "ecartBarres", "titre", "bas", "fsTitre", "fsCalcul", "pasCalcul"]) assert.equal(M[k], Math.round(sys.C[k] * 1.3), k);
  for(const k of ["x", "w", "barX", "barres", "caseMax", "visible", "ecartCalcul", "ecartCadres", "basImprime", "reponsesX"]) assert.equal(M[k], sys.C[k], `${k} ne change pas`);
  const loupes = [];
  for(const c of CARTES){
    const d = sys.disposition(c, sys.ZI);
    const haut = Math.max(...d.plateaux.map((P) => P.y + P.h)) + sys.C.ecartEnonce;
    const { g, bas } = sys.imprimee(c, haut, false);
    const e = Number(g.attrs["data-loupe"]);
    assert.ok(e >= 1 && e <= 1.35, `loupe ${e}`);
    loupes.push(e);
    assert.ok(bas <= 2130, `dernier cadre à ${bas}`);
    // le plus grand facteur : un centième de plus, la pile ne tiendrait plus
    if(e < 1.35){
      const m = sys.mesures(c, sys.metriques(Math.round(e * 100 + 1) / 100));
      const pile = m.hauteurs.reduce((s, h) => s + h, 0) + (c._sys.plan.length - 1) * sys.C.ecartCadres;
      assert.ok(haut + pile > 2130, `la loupe aurait pu aller au-delà de ${e}`);
    }
    // les calculs à la loupe (jamais plus grands que 30 × e), la largeur d'une case inchangée
    const fsCalculs = textes(g).filter((x) => x.attrs["font-style"] === "italic").map((x) => Number(x.attrs["font-size"]));
    assert.ok(fsCalculs.every((f) => f <= Math.round(30 * e)));
    assert.equal(sys.mesures(c, sys.metriques(e)).u, sys.mesures(c).u);
  }
  loupes.sort((a, b) => a - b);
  const mediane = loupes[loupes.length >> 1];
  assert.ok(mediane >= 1.25, `loupe médiane ${mediane}`);
  // sans loupe (l'écran avant le 24/09, et les tests du lot S3) : polices et hauteurs de S3
  const c = CARTES[0];
  const { g, h } = sys.cadre(c, c._sys.plan[0], false, false);
  assert.equal(h, sys.hauteur(c._sys.plan[0]));
  textes(g).filter((x) => x.attrs["font-style"] === "italic").forEach((x) => assert.ok(Number(x.attrs["font-size"]) <= 30));
});
