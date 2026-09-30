/* SPLAT! Enquête — lot G3 « le pas à pas en projection » (maquette validée par Gwenaël le
   30/09/2026). Ces tests exécutent les fonctions de outils/splat.html telles quelles.
   1. Le nombre d'appuis et leur suite, sur les 11 exemples de la maquette (livrets 1, 2, 3,
      Deuxième tour 1, 2, 3, fiches 11d, 14, 22, 18d) ; les calculs de chaque appui.
   2. Seulement en projection : en mode élève, « Voir le schéma » garde ses 3 étapes (2 sans
      total) ; le corrigé imprimé ne passe jamais par le pas à pas.
   3. Les 30 fiches des six livrets (120 cartes) : chaque carte a son pas à pas, il finit par
      les taches dévoilées, il ne touche pas à la carte (mêmes cartes, aucun tirage).
   4. Le bandeau du haut (une ligne par phrase) et la réserve du schéma en mode élève sur
      ordinateur (les boutons ne descendent plus au premier appui).
   Le contrôle au navigateur (rien de coupé, une échelle par carte) :
   tests/splat-enquete-projection-cadre-regression.cjs (hors CI, il lui faut playwright). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const render = await readFile(new URL("../_sources/livret-splat-enquete/render.py", import.meta.url), "utf8");

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
function bloc(debut, fin){
  const a = html.indexOf(debut);
  assert.notEqual(a, -1, debut);
  return html.slice(a, html.indexOf(fin, a) + fin.length);
}
const PALETTE = bloc("const INVESTIGATE_COLOR_PALETTE = [", "];");
const py = (nom) => { const m = render.match(new RegExp(`^${nom} = "([^"]+)"`, "m")); assert.ok(m, `${nom} dans render.py`); return m[1]; };

/* Le générateur, comme la page : genInvestigate(rng) puis assignPositions (même harnais que
   tests/splat-enquete-correction-barres.test.mjs). */
const moteur = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const INVESTIGATE_REPEAT_MAX = ")}
  ${ligne("const INVESTIGATE_REPEAT_TACHES_MAX = ")}
  ${ligne("const SYS_NOMBRES_SOUS_ENTENDUS = ")}
  ${ligne("const ENQ_VOCABULAIRE = ")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function rFloat(")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("buildInvestigateColorMap")}
  ${fn("sysNombreSousEntendu")}
  ${fn("getTrayConfig")}
  ${fn("getNumberedSplatsLegacy")}
  ${fn("getNumberedSplats")}
  ${fn("sameSplats")}
  ${fn("numberedBeadRadius")}
  ${fn("numberedBeadRadiusDrawn")}
  ${fn("nudgeTokenFree")}
  ${fn("relocateNumberedTokensToFinalSplats")}
  ${fn("assignPositionsNumbered")}
  ${fn("genInvestigate")}
  let invTaskCountEl, invClueTypeEl, invStructure3El, invOpMulEl, invOpDivEl, invOpAddEl, invOpSubEl, invMaxAddEl,
      invVisibleMinEl, invVisibleMaxEl, invTotalMinEl, invTotalMaxEl, invNoTotalEl, invRepeatOnEl, invRepeatEl,
      invOrdreEl, invVocabEl, invComposeEl, invReuniesEl;
  const activityEl = { value: "C" };
  let investigatePaletteKeys = null;
  return (adresse, n) => {
    const q = new URLSearchParams(adresse);
    const g = (k, d) => q.has(k) ? q.get(k) : d;
    invTaskCountEl = { value: g("splats", "2") }; invClueTypeEl = { value: g("clues", "SENTENCE") }; invStructure3El = { value: g("structure", "MIX") };
    invOpMulEl = { checked: g("mul", "1") === "1" }; invOpDivEl = { checked: g("div", "1") === "1" };
    invOpAddEl = { checked: g("add", "1") === "1" }; invOpSubEl = { checked: g("sub", "1") === "1" };
    invMaxAddEl = { value: g("deltaMax", "20") }; invVisibleMinEl = { value: g("visibleMin", "0") }; invVisibleMaxEl = { value: g("visibleMax", "3") };
    invTotalMinEl = { value: g("totalMin", "20") }; invTotalMaxEl = { value: g("totalMax", "100") };
    invNoTotalEl = { checked: g("noTotal", "0") === "1" };
    invRepeatOnEl = { checked: q.has("repeat") && Number(q.get("repeat")) > 1 }; invRepeatEl = { value: g("repeat", "1") };
    invOrdreEl = { value: g("ordre", "HASARD") }; invVocabEl = { checked: g("vocab", "0") === "1" };
    invComposeEl = { checked: g("compose", "0") === "1" }; invReuniesEl = { checked: g("reunies", "0") === "1" };
    const rng = mulberry32(Number(q.get("seed")) | 0);
    let appels = 0;
    const compte = () => { appels++; return rng(); };
    const cartes = [];
    for(let i = 0; i < n; i++){ const c = genInvestigate(compte); assignPositionsNumbered(c, compte); cartes.push(c); }
    return { cartes, appels };
  };`)();

/* Le modèle et le pas à pas ; eleveActif comme la page (vrai avec ?eleve=1). */
const g3 = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const SYS_COULEURS_PLURIEL = ")}
  ${ligne("const ENQ_VOCABULAIRE = ")}
  ${ligne("const ENQ_NOMBRES_LETTRES = ")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${ligne("const ENQ_G3_PLANS = ")}
  const numberedQuestionMarkMode = true;
  let eleveActif = false;
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("investigateColorInitial")}
  ${fn("investigateColorInfo")}
  ${fn("formatRelationNumber")}
  function getCardVarChar(){ return "𝑥"; }
  ${fn("getNumberedDisplayVarChar")}
  ${fn("enqueteNbEtapes")}
  ${fn("enqueteDerniereEtape")}
  ${fn("enqueteMotCouleur")}
  ${fn("enqueteInitiale")}
  ${fn("enqueteArticle")}
  ${fn("enqueteNomUnites")}
  ${fn("enqueteBarresModele")}
  ${fn("enqueteProjectionPasAPas")}
  ${fn("enqueteG3Etapes")}
  return { modele: enqueteBarresModele, plan: enqueteProjectionPasAPas, derniere: enqueteDerniereEtape, nb: enqueteNbEtapes,
    eleve: (v) => { eleveActif = v; } };
`)();

/* Une étape en une ligne lisible : son type, son titre, la ligne de calcul en noir. */
function resume(e){
  if(e.type === "vide" || e.type === "barres" || e.type === "fin") return e.type;
  if(e.type === "ligne") return `${e.titre} : ${e.lignes[e.courante]}`;
  return `barres : ${e.lignes[e.idx]}`;
}
const EXEMPLES = [
  ["EX_ADD2", 0], ["EX_MUL2", 0], ["EX_REB", 0], ["EX_UNITE", 0], ["EX_ADD", 0], ["EX_MUL", 0],
  ["E11D", 0], ["E14", 0], ["E22", 1], ["EX_REU", 0], ["E18D", 2]
];
function carteDe(nom, k){
  const a = py(nom);
  return moteur(a.includes("cards=") ? a : `${a}&cards=4&unknown=question`, k + 1).cartes[k];
}

// --- 1. les 11 exemples de la maquette ---------------------------------------------------------
/* La suite des appuis, relevée sur la maquette validée (G3-maquette-1 à 11) */
const SUITES = {
  EX_ADD2: ["vide", "barres", "Schéma regroupé : 2 noires + 8 = 26", "Je calcule : 2 noires = 26 − 8 = 18", "Je calcule : 1 noire = 18 ÷ 2 = 9", "barres : verte = 9 + 8 = 17", "fin"],
  EX_REB: ["vide", "barres", "Schéma regroupé : 3 noires + 7 + 7 = 38", "Je range : 3 noires + 7 + 7 = 38", "Je regroupe : 3 noires + 14 = 38",
    "Je calcule : 3 noires = 38 − 14 = 24", "Je calcule : 1 noire = 24 ÷ 3 = 8", "barres : bleue = 8 + 7 = 15", "fin"],
  EX_UNITE: ["vide", "barres", "Schéma regroupé : 2 vertes + 2 rouges + 2 noires = 110", "Je calcule : 3 vertes + 2 noires = 110",
    "Je calcule : 11 noires = 110", "Je calcule : 1 noire = 110 ÷ 11 = 10", "barres : verte = 3 × 10 = 30", "barres : rouge = 30 ÷ 2 = 15", "fin"],
};
const APPUIS = { EX_ADD2: 7, EX_MUL2: 6, EX_REB: 9, EX_UNITE: 9, EX_ADD: 10, EX_MUL: 10, E11D: 7, E14: 10, E22: 6, EX_REU: 10, E18D: 6 };

test("les 11 exemples de la maquette : le nombre d'appuis, du schéma vide aux taches dévoilées", () => {
  g3.eleve(false);
  for(const [nom, k] of EXEMPLES){
    const c = carteDe(nom, k);
    const p = g3.plan(c);
    assert.ok(p, `${nom} : pas de pas à pas`);
    assert.equal(p.etapes.length, APPUIS[nom], `${nom} : ${p.etapes.map(resume).join(" / ")}`);
    assert.equal(g3.derniere(c), APPUIS[nom], `${nom} : getMaxRevealState suit le pas à pas`);
    assert.deepEqual(p.etapes.slice(0, 2).map((e) => e.type), ["vide", "barres"], nom);
    assert.equal(p.etapes[p.etapes.length - 1].type, "fin", nom);
    if(SUITES[nom]) assert.deepEqual(p.etapes.map(resume), SUITES[nom], nom);
  }
});

test("un calcul par appui : la ligne d'avant en gris, la nouvelle en noir ; « Je regroupe » dès deux écarts", () => {
  g3.eleve(false);
  const reb = g3.plan(carteDe("EX_REB", 0));
  const regroupe = reb.etapes.find((e) => e.titre === "Je regroupe");
  /* 7 + 7 devient une seule case 14 */
  assert.deepEqual(regroupe.cells.filter((x) => x.kind === "nombre").map((x) => x.v), [14]);
  /* le retrait : la case 14 hachurée en haut et en bas, le haut devient [24 | 14] */
  const retrait = reb.etapes[5];
  assert.deepEqual(retrait.top.map((t) => [t.t, !!t.retire]), [["24", false], ["14", true]]);
  assert.ok(retrait.cells.filter((x) => x.kind === "nombre").every((x) => x.retire));
  /* le partage : les noms en bas, la valeur de chaque part en haut (8 | 8 | 8 au-dessus des trois noires) */
  const partage = reb.etapes[6];
  assert.deepEqual(partage.top.slice(0, 3).map((t) => [t.de, t.a, t.parts, t.t]), [[0, 0, 1, "8"], [1, 1, 1, "8"], [2, 2, 1, "8"]]);
  assert.deepEqual(partage.top.slice(3).map((t) => [t.t, t.retire]), [["14", true]]);
  /* le récapitulatif ③ reprend les calculs de la projection (avec « Je regroupe ») */
  assert.deepEqual(reb.etapes[8].calculs.map((l) => l ? `${l.g} = ${l.d}` : "—"),
    ["3 noires + 7 + 7 = 38", "3 noires + 14 = 38", "3 noires = 38 − 14 = 24", "1 noire = 24 ÷ 3 = 8", "—", "bleue = 8 + 7 = 15"]);
  /* un seul écart : ni « Je range » ni « Je regroupe », les calculs du corrigé */
  const add2c = carteDe("EX_ADD2", 0), add2 = g3.plan(add2c);
  assert.ok(!add2.etapes.some((e) => e.titre === "Je range" || e.titre === "Je regroupe"));
  assert.deepEqual(add2.etapes[add2.etapes.length - 1].calculs, g3.modele(add2c).calculs);
  /* sans total : tout se fait sur les barres ①, pas de « = v » au bout des barres */
  const st = g3.plan(carteDe("E22", 1));
  assert.ok(st.etapes.slice(2, -1).every((e) => e.type === "barresValeurs" && e.egal === false), st.etapes.map(resume).join(" / "));
  /* les autres taches : « = v » au bout des barres (en gris celles d'avant) */
  assert.ok(add2.etapes.filter((e) => e.type === "barresValeurs").every((e) => e.egal === true));
});

// --- 2. seulement en projection ------------------------------------------------------------------
test("seulement en projection : le mode élève garde ses 3 étapes (2 sans total), le corrigé imprimé ne change pas", () => {
  for(const [nom, k] of EXEMPLES){
    const c = carteDe(nom, k);
    g3.eleve(true);
    assert.equal(g3.plan(c), null, `${nom} : pas de pas à pas en mode élève`);
    assert.equal(g3.derniere(c), g3.nb(c), `${nom} : « Voir le schéma » garde ses étapes`);
    g3.eleve(false);
  }
  assert.equal(g3.nb(carteDe("E22", 1)), 2);
  assert.equal(g3.nb(carteDe("EX_REB", 0)), 3);
  /* l'élève : l'étape de « Voir le schéma » compte avec enqueteDerniereEtape, qui lit eleveActif */
  assert.match(fn("enqueteProjectionPasAPas"), /if\(typeof eleveActif !== "undefined" && eleveActif\) return null;/);
  /* l'impression (renderCardIntoSvg, la correction imprimée) ne connaît pas le pas à pas */
  for(const f of ["renderCardIntoSvg", "drawEnqueteCorrectionImprimee", "drawEnqueteBarres", "drawEnqueteLigne", "drawEnqueteCalculs"]){
    assert.ok(!/enqueteG3|PasAPas/.test(fn(f)), `${f} passe par le pas à pas`);
  }
  /* la projection : renderCard dessine l'étape revealState, updateUI la cadre avec son numéro */
  assert.match(html, /const g3 = enqueteProjectionPasAPas\(card\);\n\s+if\(g3\)\{\n\s+const et = g3\.etapes\[revealState - 1\];\n\s+if\(et\) enqueteG3Dessiner\(relCible, card, et, g3\.modele\);/);
  assert.match(fn("updateUI"), /renderCard\(cards\[idx\], revealState\); enqueteProjectionCadrer\(cards\[idx\], revealState\);/);
  /* plus de 5 appuis : la disposition compacte et les indices en symboles suivent */
  assert.match(html, /const enqEtapesMax = \(card\.family === "C" && card\._rel\) \? Math\.max\(5, enqueteDerniereEtape\(card\)\) : 5;/);
  assert.match(html, /revealState > 0 && revealState <= enqEtapesMax\)\{\n\s+drawRelationGraphicClues\(svg, card\);/);
});

// --- 3. les 30 fiches -----------------------------------------------------------------------------
const FICHES = [...Array.from({ length: 15 }, (_, i) => `E${10 + i}`), ...Array.from({ length: 15 }, (_, i) => `E${10 + i}D`)];
const TYPES = new Set(["vide", "barres", "ligne", "barresValeurs", "fin"]);

test("les 30 fiches des six livrets : chaque carte a son pas à pas, et il ne touche pas à la carte", () => {
  g3.eleve(false);
  let cartes = 0;
  const appuis = new Map();
  for(const nom of FICHES){
    const { cartes: cs, appels } = moteur(`${py(nom)}&cards=4&unknown=question`, 4);
    const avant = createHash("sha256").update(JSON.stringify(cs)).digest("hex");
    cs.forEach((c, k) => {
      const p = g3.plan(c);
      const ou = `${nom}, carte ${k + 1}`;
      assert.ok(p, `${ou} : pas de pas à pas`);
      const n = p.etapes.length;
      appuis.set(n, (appuis.get(n) || 0) + 1);
      assert.ok(n >= 5 && n <= 11, `${ou} : ${n} appuis`);
      assert.ok(p.etapes.every((e) => TYPES.has(e.type)), ou);
      assert.deepEqual(p.etapes.slice(0, 2).map((e) => e.type), ["vide", "barres"], ou);
      assert.equal(p.etapes[n - 1].type, "fin", ou);
      assert.equal(p.etapes.filter((e) => e.type === "fin").length, 1, ou);
      /* chaque ligne en noir existe, et les autres taches sont celles de la réponse */
      p.etapes.filter((e) => e.type === "ligne").forEach((e) => assert.ok(e.lignes[e.courante], `${ou} : ${e.titre}`));
      const m = g3.modele(c);
      const apres = m.calculs.slice(m.calculs.indexOf(null) + 1).map((l) => `${l.g} = ${l.d}`);
      const vues = p.etapes.filter((e) => e.type === "barresValeurs" && e.egal).map((e) => e.lignes[e.idx]);
      if(m.ligne && m.mode !== "unite") assert.deepEqual(vues, apres, `${ou} : les autres taches`);
      /* le récapitulatif : les calculs du corrigé, « Je regroupe » ajouté quand il y a deux écarts */
      const fin = p.etapes[n - 1].calculs || m.calculs;
      assert.deepEqual(fin.slice(fin.indexOf(null) + 1), m.calculs.slice(m.calculs.indexOf(null) + 1), `${ou} : la fin du récapitulatif`);
      cartes++;
    });
    /* mêmes cartes : le pas à pas ne modifie rien et ne tire rien */
    assert.equal(createHash("sha256").update(JSON.stringify(cs)).digest("hex"), avant, `${nom} : une carte a changé`);
    assert.equal(moteur(`${py(nom)}&cards=4&unknown=question`, 4).appels, appels, `${nom} : tirages`);
  }
  assert.equal(cartes, 120);
  /* de 5 à 11 appuis ; relevé au lot G3 */
  assert.deepEqual([...appuis.entries()].sort((a, b) => a[0] - b[0]), [[5, 3], [6, 27], [7, 45], [8, 7], [9, 11], [10, 27]]);
});

// --- 4. le haut de l'écran, et la réserve du schéma en mode élève ---------------------------------
test("le bandeau : une ligne par phrase, coupée à la virgule seulement sous le seuil", () => {
  assert.match(html, /const ENQ_G3_PHRASE_MAX = 48, ENQ_G3_PHRASE_COUPE = 32, ENQ_G3_PHRASE_LARGEUR = 1560, ENQ_G3_PHRASE_PAS = 58;/);
  /* mesure factice : 20 unités par caractère à la police 48 (proportionnelle à la police) */
  const phrase = new Function("largeurCar", `
    ${ligne("const ENQ_G3_PHRASE_MAX = ")}
    const measureTextWidth = (t, police) => t.length * largeurCar * Number(/(\\d+)px/.exec(police)[1]) / 48;
    ${fn("layoutClueSentence")}
    ${fn("enqueteG3Phrase")}
    return enqueteG3Phrase;`);
  const t = "Sous la tache verte, il y a 3 fois moins de jetons que sous la tache violette."; // 79 caractères
  /* tient à 48 : une ligne à 48 */
  assert.deepEqual(phrase(19)(t), { lines: [t], fontSize: 48 });
  /* tient en rétrécissant (≥ 32) : une ligne, plus petite */
  const r = phrase(26)(t);
  assert.equal(r.lines.length, 1); assert.ok(r.fontSize >= 32 && r.fontSize < 48, JSON.stringify(r));
  /* ne tiendrait que sous 32 : coupée à la virgule, en deux lignes plus grandes */
  const c = phrase(40)(t);
  assert.deepEqual(c.lines, ["Sous la tache verte,", "il y a 3 fois moins de jetons que sous la tache violette."]);
  /* le plateau revient au dernier appui : le bandeau n'est posé que de l'étape 1 à l'avant-dernière */
  assert.match(fn("enqueteProjectionCadrer"), /const bandeau = !!g3Etape && g3Etape\.type !== "fin" && enqueteG3Bandeau\(card\);/);
  /* une seule échelle pour tous ces appuis : mesurée sur toutes les étapes sauf la dernière */
  assert.match(fn("enqueteProjectionCadrer"), /\(bandeau \? g3\.etapes\.filter\(e => e\.type !== "fin"\) : \[g3Etape\]\)/);
  assert.match(fn("enqueteProjectionCadrer"), /enqueteProjectionFacteurs\(bp\.y \+ bp\.height, haut, bas, bandeau \? bas : bd\.y \+ bd\.height\)/);
  /* le TOTAL (et sa boîte, le rect juste avant #totalGroup) à gauche, le plateau en petit, un espace entre */
  assert.match(fn("enqueteG3Bandeau"), /tg\.previousElementSibling && tg\.previousElementSibling\.tagName === "rect"/);
  assert.match(html, /const ENQ_G3_BANDEAU_H = 190, ENQ_G3_BANDEAU_HAUT = 18, ENQ_G3_BANDEAU_ECART = 60;/);
});

test("mode élève, ordinateur : la place du schéma est prise dès « Voir le schéma » (les boutons ne descendent plus)", () => {
  assert.match(fn("eleveProposerSchema"), /bouton\.parentNode\.appendChild\(voir\);\n  eleveSchemaReserverOrdinateur\(card\);\n\}/);
  const r = fn("eleveSchemaReserverOrdinateur");
  /* le téléphone a sa propre réserve */
  assert.match(r, /if\(!plateau \|\| !card \|\| eleveSchemaTelephone\(\)\) return;/);
  /* la plus haute des étapes, cadrée comme eleveDessinerSchema la cadre */
  assert.match(r, /for\(let e = 1; e <= eleveSchemaEtapes\(card\); e\+\+\)\{\n\s+renderCard\(card, e\);\n\s+if\(sysAPlan\(card\)\) eleveCadrerSchemaSys\(card\); else eleveCadrerScene\(\);/);
  /* la carte validée est redessinée telle quelle */
  assert.match(r, /renderCard\(card, eleveSchemaEtape\);\n\s+eleveCadrerScene\(\);/);
  /* même plafond que eleveDessinerSchema : rien ne sort de la fenêtre */
  const plafond = "const plafond = hauteurFenetre > 0 ? Math.round(hauteurFenetre - autres - 16) : voulu;";
  assert.ok(r.includes(plafond) && fn("eleveDessinerSchema").includes(plafond));
  assert.ok(r.includes("const cible = Math.max(ELEVE_PLATEAU_MIN, Math.min(voulu, plafond));"));
});
