/* SPLAT! Enquête — lot « plateau en ligne + réponse encadrée » (03/10/2026, décidé par Gwenaël sur
   image : splat-relecture\plateau-en-ligne\planche-plateau-en-ligne.png).
   1. Trois taches côte à côte sur le plateau bas (Enquête, Système) — table de DESSIN seulement :
      la table de tirage ne bouge pas, aucune carte ne change (l'empreinte sans les places est
      épinglée dans splat-enquete-correction-barres.test.mjs).
   2. Les jetons visibles d'une rangée (1, 2 ou 3 taches) vont aux places fixes : dans la bande des
      taches, dans les passages libres, jamais sur une tache ni l'un sur l'autre — sans tirage.
   3. Le plateau imprimé se referme sur la rangée : 14 mm à trois taches, 17 mm à deux (la réduction
      de 22 mm reste pour les cartes à plus de trois taches).
   4. Les cartes du corrigé : « Je réponds » (la phrase dans un cadre) puis « Je vérifie », comme la
      page 2 des livrets et l'écran ; l'écran et la page 2 ne changent pas. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  const b = html.indexOf(fin, a);
  return html.slice(a, b + fin.length);
}
const PALETTE = bloc("const INVESTIGATE_COLOR_PALETTE = [", "];");
const py = (nom) => (render.match(new RegExp(`^${nom} = "([^"]+)"`, "m")) || [])[1];

/* Les tables de places, comme la page. */
const geo = new Function(`
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  ${fn("getTrayConfig")}
  ${fn("getNumberedSplatsLegacy")}
  ${fn("getNumberedSplats")}
  ${fn("sameSplats")}
  ${fn("numberedBeadRadius")}
  ${fn("numberedSplatsBande")}
  ${fn("numberedSplatsPlacesVisibles")}
  return { getTrayConfig, getNumberedSplatsLegacy, getNumberedSplats, sameSplats, numberedBeadRadius, numberedSplatsBande, numberedSplatsPlacesVisibles };
`)();

/* Le générateur de l'Enquête et le placement des jetons, comme la page (genInvestigate puis
   assignPositionsNumbered, quatre cartes d'affilée). */
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
  ${fn("numberedSplatsBande")}
  ${fn("numberedSplatsPlacesVisibles")}
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
    const cartes = [];
    for(let i = 0; i < n; i++){ const c = genInvestigate(rng); assignPositionsNumbered(c, rng); cartes.push(c); }
    return cartes;
  };`)();

// --- 1. la table de dessin ----------------------------------------------------------------------
test("trois, quatre et cinq taches côte à côte au milieu du plateau bas (Enquête et Système) ; le tirage et les autres tables ne bougent pas", () => {
  for(const mode of ["C", "D"]){
    const t = geo.getNumberedSplats(3, mode);
    assert.deepEqual(t, [{ cx:330, cy:545, r:145 }, { cx:820, cy:545, r:145 }, { cx:1310, cy:545, r:145 }], mode);
    // le tirage reste le triangle d'avant (sinon les nombres des cartes suivantes d'une série bougeraient)
    assert.deepEqual(geo.getNumberedSplatsLegacy(3, mode), [{ cx:820, cy:455, r:145 }, { cx:580, cy:655, r:145 }, { cx:1060, cy:655, r:145 }], mode);
    // dans le plateau, avec le débord dessiné d'une tache (10 % en bas, 6 % sur les côtés)
    const p = geo.getTrayConfig(mode);
    for(const s of t) assert.ok(s.cy - 0.74 * s.r >= p.y && s.cy + 1.10 * s.r <= p.y + p.h && s.cx - 1.06 * s.r >= p.x && s.cx + 1.06 * s.r <= p.x + p.w);
    // quatre et cinq taches aussi (décidé sur image le 03/10 au soir) : rayon 120 et 100, une seule rangée, dans le plateau
    const t4 = geo.getNumberedSplats(4, mode), t5 = geo.getNumberedSplats(5, mode);
    assert.deepEqual(t4, [{ cx:370, cy:545, r:120 }, { cx:657, cy:545, r:120 }, { cx:943, cy:545, r:120 }, { cx:1230, cy:545, r:120 }], mode);
    assert.deepEqual(t5, [{ cx:330, cy:545, r:100 }, { cx:565, cy:545, r:100 }, { cx:800, cy:545, r:100 }, { cx:1035, cy:545, r:100 }, { cx:1270, cy:545, r:100 }], mode);
    for(const s of [...t4, ...t5]) assert.ok(s.cy - 0.74 * s.r >= p.y && s.cy + 1.10 * s.r <= p.y + p.h && s.cx - 1.06 * s.r >= p.x && s.cx + 1.06 * s.r <= p.x + p.w);
    for(const t of [t4, t5]) for(let i = 1; i < t.length; i++) assert.ok(t[i].cx - t[i].r - (t[i - 1].cx + t[i - 1].r) >= 35, `${mode} : au moins 35 unités entre deux taches`);
    assert.ok(new Set(geo.getNumberedSplatsLegacy(4, mode).map(s => s.cy)).size === 2 && new Set(geo.getNumberedSplatsLegacy(5, mode).map(s => s.cy)).size === 2, `${mode} : le tirage à 4 et 5 taches reste en deux rangées`);
    for(const n of [1, 2, 6, 7]) assert.ok(geo.sameSplats(geo.getNumberedSplats(n, mode), geo.getNumberedSplatsLegacy(n, mode)), `${mode} à ${n}`);
  }
  // le grand plateau (B, B±) ne change pas : trois taches en triangle
  assert.ok(geo.sameSplats(geo.getNumberedSplats(3, "N"), geo.getNumberedSplatsLegacy(3, "N")));
  assert.match(fn("assignPositionsNumbered"), /const splats = getNumberedSplatsLegacy\(meta\.tasks, card\.family\);\s*const splatsFinal = getNumberedSplats\(meta\.tasks, card\.family\);/);
});

test("la bande d'une rangée : 25 au-dessus et au-dessous des taches ; rien au-delà de cinq taches ni en triangle", () => {
  assert.deepEqual(geo.numberedSplatsBande(geo.getNumberedSplats(3, "C")), { y:375, h:340, cy:545, r:145 });
  assert.deepEqual(geo.numberedSplatsBande(geo.getNumberedSplats(2, "C")), { y:340, h:410, cy:545, r:180 });
  assert.deepEqual(geo.numberedSplatsBande(geo.getNumberedSplats(4, "C")), { y:400, h:290, cy:545, r:120 });
  assert.deepEqual(geo.numberedSplatsBande(geo.getNumberedSplats(5, "C")), { y:420, h:250, cy:545, r:100 });
  assert.equal(geo.numberedSplatsBande(geo.getNumberedSplats(6, "C")), null);
  assert.equal(geo.numberedSplatsBande(geo.getNumberedSplatsLegacy(3, "C")), null, "le triangle du tirage n'est pas une rangée");
  assert.equal(geo.numberedSplatsBande([]), null);
});

test("les places fixes des jetons visibles : dans les passages libres, deux par passage, dans la bande, jamais sur une tache", () => {
  const tray = geo.getTrayConfig("C"), margin = 14;
  for(const n of [1, 2, 3, 4, 5]){
    const sp = geo.getNumberedSplats(n, "C"), beadR = geo.numberedBeadRadius(sp, "C");
    const places = geo.numberedSplatsPlacesVisibles(tray, sp, beadR, margin);
    assert.ok(places.length >= 4, `${n} taches : ${places.length} places (il en faut 3 au plus)`);
    if(n >= 4) assert.equal(places.length, 4, `${n} taches : les jetons visibles se logent au bord du plateau, pas entre les taches`);
    const bande = geo.numberedSplatsBande(sp);
    for(const q of places){
      assert.ok(q.cy - beadR >= bande.y && q.cy + beadR <= bande.y + bande.h, `${n} taches : jeton dans la bande`);
      assert.ok(q.cx - beadR >= tray.x + margin - 1 && q.cx + beadR <= tray.x + tray.w - margin + 1, `${n} taches : jeton dans le plateau`);
      for(const s of sp) assert.ok(Math.hypot(q.cx - s.cx, q.cy - s.cy) >= s.r + beadR + 14 - 1, `${n} taches : jeton hors des taches`);
    }
    for(let i = 0; i < places.length; i++) for(let j = i + 1; j < places.length; j++)
      assert.ok(Math.hypot(places[i].cx - places[j].cx, places[i].cy - places[j].cy) >= 2 * beadR + 12 - 1, `${n} taches : deux jetons ne se touchent pas`);
  }
  assert.equal(geo.numberedSplatsPlacesVisibles(tray, geo.getNumberedSplats(6, "C"), 50, margin), null);
  assert.doesNotMatch(fn("numberedSplatsPlacesVisibles") + fn("relocateNumberedTokensToFinalSplats"), /rng\(|Math\.random|rFloat/);
});

// --- 2. sur les vraies cartes ---------------------------------------------------------------------
const AVEC_JETONS = [
  ["E14", py("E14")], ["E19", py("E19")], ["E24", py("E24")], ["E19D", py("E19D")], ["E21", py("E21")],
  // réglages d'essai, beaucoup de jetons visibles, deux et trois taches
  ["essai2", "mode=C&clues=SENTENCE&splats=2&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=2&visibleMax=3&totalMin=20&totalMax=60&seed=77"],
  ["essai3", "mode=C&clues=SENTENCE&splats=3&structure=HASARD&mul=1&div=1&add=1&sub=1&deltaMax=12&visibleMin=3&visibleMax=3&totalMin=30&totalMax=90&seed=12"],
].filter(([, q]) => q);

test("sur les cartes des livrets et des réglages d'essai : chaque jeton visible d'une rangée est dans la bande, hors des taches ; les jetons cachés sous leur tache", () => {
  let vus = 0;
  for(const [nom, q] of AVEC_JETONS){
    const cartes = moteur(q + "&cards=12&unknown=question", 12);
    for(const c of cartes){
      const sp = c._splats, bande = geo.numberedSplatsBande(sp);
      if(!bande) continue;
      assert.equal(c.visible.length, c._posV.length, `${nom} : une place par jeton visible`);
      for(const p of c._posV){
        vus++;
        assert.ok(p.cy - c._beadR >= bande.y && p.cy + c._beadR <= bande.y + bande.h, `${nom} : jeton visible dans la bande (${p.cx}, ${p.cy})`);
        for(const s of sp) assert.ok(Math.hypot(p.cx - s.cx, p.cy - s.cy) >= s.r + c._beadR + 13, `${nom} : jeton visible hors des taches`);
      }
      for(let i = 0; i < c._posV.length; i++) for(let j = i + 1; j < c._posV.length; j++)
        assert.ok(Math.hypot(c._posV[i].cx - c._posV[j].cx, c._posV[i].cy - c._posV[j].cy) >= 2 * c._beadR + 11, `${nom} : jetons visibles séparés`);
      for(const p of c._posH){
        assert.ok(sp.some(s => Math.hypot(p.cx - s.cx, p.cy - s.cy) <= s.r), `${nom} : jeton caché sous une tache`);
      }
    }
  }
  assert.ok(vus >= 20, `${vus} jetons visibles vus sur des rangées`);
});

test("taches répétées à trois taches : les deux taches de même couleur restent côte à côte dans la rangée", () => {
  const cartes = moteur(py("E20") + "&cards=40&unknown=question", 40).concat(moteur(py("E21") + "&cards=40&unknown=question", 40));
  let vues = 0;
  for(const c of cartes){
    const rep = c._rel && c._rel.repetees;
    if(!rep || rep.couleurDe.length !== 3) continue;
    vues++;
    const cd = rep.couleurDe;
    const paire = [0, 1, 2].filter(i => cd.filter(x => x === cd[i]).length === 2);
    assert.equal(paire.length, 2, "une couleur double");
    assert.equal(Math.abs(paire[0] - paire[1]), 1, `les deux taches ${JSON.stringify(cd)} sont voisines dans la rangée`);
  }
  assert.ok(vues >= 10, `${vues} cartes répétées à trois taches`);
});

test("taches répétées à quatre et cinq taches : les taches d'une même couleur se suivent dans la rangée (le rangement se décide sur les deux rangées d'avant)", () => {
  const cartes = moteur(py("E20") + "&cards=60&unknown=question", 60).concat(moteur(py("E21") + "&cards=60&unknown=question", 60));
  const vues = { 4: 0, 5: 0 };
  for(const c of cartes){
    const rep = c._rel && c._rel.repetees;
    if(!rep || rep.couleurDe.length < 4 || rep.couleurDe.length > 5) continue;
    const cd = rep.couleurDe;
    assert.ok(c._splats.every(s => s.cy === c._splats[0].cy), `${cd.length} taches : une rangée`);
    const ordre = c._splats.map((s, i) => [s.cx, cd[i]]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    let changements = 0; for(let i = 1; i < ordre.length; i++) if(ordre[i] !== ordre[i - 1]) changements++;
    assert.equal(changements, new Set(cd).size - 1, `${JSON.stringify(ordre)} : chaque couleur d'un seul tenant`);
    vues[cd.length]++;
  }
  assert.ok(vues[4] >= 5 && vues[5] >= 3, `${vues[4]} cartes à quatre taches, ${vues[5]} à cinq`);
});

// --- 3. le plateau imprimé -------------------------------------------------------------------------
test("l'impression : la réduction de 22 mm reste, et le plateau se referme sur une rangée (14 mm à trois taches, 17 à deux, 12 à quatre, 10 à cinq)", () => {
  const mm = Number(ligne("const ENQ_MM = ").match(/[\d.]+/)[0]);
  const H = Number(ligne("const ENQ_PLATEAU_CORRECTION_H = ").match(/\d+/)[0]);
  const trayH = geo.getTrayConfig("C").h;
  const echelle = Math.round(1000 * H / trayH) / 1000;
  const haut = (n) => Math.round((geo.numberedSplatsBande(geo.getNumberedSplats(n, "C")) || { h:trayH }).h * echelle);
  assert.ok(Math.abs(haut(3) / mm - 14) < 0.6, `trois taches : ${(haut(3) / mm).toFixed(1)} mm`);
  assert.ok(Math.abs(haut(2) / mm - 17) < 0.6, `deux taches : ${(haut(2) / mm).toFixed(1)} mm`);
  assert.ok(Math.abs(haut(4) / mm - 12) < 0.6, `quatre taches : ${(haut(4) / mm).toFixed(1)} mm`);
  assert.ok(Math.abs(haut(5) / mm - 10.4) < 0.6, `cinq taches : ${(haut(5) / mm).toFixed(1)} mm`);
  assert.ok(Math.abs(haut(6) / mm - 22) < 0.5, `six taches : ${(haut(6) / mm).toFixed(1)} mm (comme avant)`);
  const impression = html.slice(html.indexOf("\nfunction renderCardIntoSvg("), html.indexOf("\nfunction printSheet("));
  assert.match(impression, /const enqBande = \(enqueteCompacte \|\| enqueteEnoncePetit\) \? numberedSplatsBande\(card\._splats\) : null;/);
  assert.match(impression, /const enqDy = enqBande \? Math\.round\(enqBande\.y - trayY\) : 0;/);
  assert.match(impression, /scale\(\$\{enqEchelle\}\) translate\(-800 \$\{-trayY - enqDy\}\)/, "le groupe remonte la bande en haut du plateau, à la même échelle qu'avant");
  assert.match(impression, /height:trayHDessine,/);
  // l'écran garde son plateau entier : getTrayConfig ne change pas
  assert.match(fn("getTrayConfig"), /return \{ x:120, y:270, w:1360, h:550, isHigh: false \};/);
});

// --- 4. la réponse encadrée sur les cartes du corrigé ------------------------------------------------
const modele = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const SYS_COULEURS_PLURIEL = ")}
  ${ligne("const ENQ_VOCABULAIRE = ")}
  ${ligne("const ENQ_NOMBRES_LETTRES = ")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("investigateColorInitial")}
  ${fn("investigateColorInfo")}
  ${fn("formatRelationNumber")}
  function getCardVarChar(){ return "𝑥"; }
  ${fn("getNumberedDisplayVarChar")}
  ${fn("enqueteNbEtapes")}
  function enqueteProjectionPasAPas(){ return null; }
  ${fn("enqueteDerniereEtape")}
  ${fn("enqueteMotCouleur")}
  ${fn("enqueteInitiale")}
  ${fn("enqueteArticle")}
  ${fn("enqueteNomUnites")}
  ${ligne("function enqueteSymbole(")}
  ${ligne("function enqueteFoisSymbole(")}
  ${ligne("function enqueteLigneCalcul(")}
  ${fn("enqueteBarresModele")}
  ${fn("enqueteReponsePhrase")}
  const numberedQuestionMarkMode = true;
  return (card) => { const m = enqueteBarresModele(card); return { m, phrase: enqueteReponsePhrase(card, m).map(s => s.gras ? "**" + s.t + "**" : s.t).join("") }; };
`)();

test("la phrase de la réponse : « La tache rouge cache 7 jetons, la tache noire 21, la tache orange 14. », les nombres en gras ; « Chaque tache » quand la couleur est répétée", () => {
  // la fiche 13 des livrets (trois taches, une référence)
  const c13 = moteur(py("E13") + "&cards=1&unknown=question", 1)[0];
  const { m, phrase } = modele(c13);
  assert.match(phrase, /^La tache \w+ cache \*\*\d+\*\* jetons, la tache \w+ \*\*\d+\*\*, la tache \w+ \*\*\d+\*\*\.$/);
  // l'ordre de la correction (l'unité d'abord) et ses nombres
  const nombres = [...phrase.matchAll(/\*\*(\d+)\*\*/g)].map(x => Number(x[1]));
  assert.deepEqual(nombres, m.reponse.map(e => c13._rel.hiddenValues[e.i]), "les nombres sont ceux de la réponse, dans son ordre");
  assert.equal(nombres[0], c13._rel.hiddenValues[m.unit], "l'unité d'abord");
  const c20 = moteur(py("E20") + "&cards=4&unknown=question", 4).find(c => c._rel.repetees);
  const p20 = modele(c20).phrase;
  assert.match(p20, /(^|, )[Cc]haque tache \w+ /, "une couleur répétée : « chaque tache »");
  assert.match(p20, /\.$/);
  const c22 = moteur(py("E22") + "&cards=1&unknown=question", 1)[0];
  assert.match(modele(c22).phrase, /^La tache \w+ cache \*\*\d+\*\* jetons, la tache \w+ \*\*\d+\*\*\.$/, "sans total : la même phrase");
});

test("les cartes du corrigé : « Je réponds » (cadre) puis « Je vérifie » à l'impression ; l'écran et la page 2 des livrets ne changent pas", () => {
  const calc = fn("drawEnqueteCalculs");
  assert.match(calc, /if\(opts\.reponse !== false && opts\.isPrint && modele\.reponse && modele\.reponse\.length\)\{/, "la branche imprimée");
  assert.match(calc, /enqueteTitreEtapeSimple\(g, x0, y, "Je réponds", P\)/, "le sous-titre « Je réponds » après « Je calcule »");
  assert.match(calc, /const segments = enqueteReponsePhrase\(card, modele\);/);
  assert.match(calc, /"data-cadre":"reponse"/, "le cadre de la réponse");
  assert.match(calc, /stroke:"#111827", "stroke-width":4, "data-cadre":"reponse"/, "un trait noir de 4, comme à l'écran");
  assert.match(calc, /\{ t:"Je vérifie :", poids:800, fill:"#374151" \}/, "« Je vérifie : » puis les vérifications à la suite");
  assert.match(calc, /const verifs = \(modele\.verification \? \[`\$\{modele\.verification\} ✓`\] : \[\]\)\.concat\(modele\.sansIndices \? \[\] : enqueteG3VerifIndices\(card, modele\.filtreIndices\)\);/, "le total seulement (07/10/2026) ; sans total, l'indice de l'écart");
  assert.match(calc, /if\(k && xv \+ w > x0 \+ largeur\)\{ xv = x0; y \+= Math\.round\(vf \* 1\.25\); \}/, "à la ligne quand ça ne tient plus");
  // une ligne jusqu'à repFont − 6, sinon deux lignes à repFont (jamais une ligne minuscule)
  assert.match(calc, /while\(une > P\.repFont - 6 && largeurSeg\(segments, une\) > largeurR\) une -= 2;/);
  assert.match(calc, /lignesR = couper\(segments, rf\);/);
  // l'ancienne ligne en gras reste pour l'écran (la branche else), et rien d'autre ne l'appelle en impression
  assert.match(calc, /\}else if\(opts\.reponse !== false && modele\.reponse && modele\.reponse\.length\)\{/);
  assert.match(fn("drawEnqueteCorrectionImprimee"), /const o = \{ isPrint:true, modele, \.\.\.opts \};/);
  // l'écran : « Je réponds » de la projection et du mode élève n'a pas bougé (enqueteG3DessinerFin), ni le numéro
  assert.match(fn("enqueteG3DessinerFin"), /enqueteTitreEtape\(g, x0, y, modele\.ligne \? 3 : 2, "Je réponds", P, largeur\)/);
  assert.doesNotMatch(fn("enqueteG3DessinerFin"), /enqueteReponsePhrase/);
  // la page 2 des livrets : les étapes du pas à pas G3, et sa dernière étape en texte (render.py)
  assert.match(render, /enqueteG3Dessiner\(g, card, et, plan\.modele, prof\);/);
  assert.match(render, /<h3>Je réponds<\/h3><p class="rep">' \+ d\.fin\.reponse/);
});
