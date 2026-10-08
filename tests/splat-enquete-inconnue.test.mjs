/* SPLAT! Enquête — l'inconnue « ? » (proposition de Claire, décidée avec Gwenaël le 07/10/2026 ;
   monde 3 seulement : le Système ne change pas). Ces tests exécutent les fonctions de
   outils/splat.html telles quelles (extraites du fichier), sur les 25 fiches des cinq livrets.
   1. « PAS DE TOTAL » à la place de « TOTAL ? » : les cartes sans total de l'Enquête seulement ;
      le Système garde son « TOTAL ? » ; la case garde sa taille.
   2. Le modèle de la correction : la référence s'écrit « ? » (𝑥 en lettre, sur toutes les cartes),
      « 2 × ? », jamais « 2? » ni « 2𝑥 » ; la ligne « La tache noire cache donc 9 jetons » avant les
      autres taches (sauf l'unité commune) ; ① « Schéma de comparaison » ; « Je vérifie » : le total
      seulement, sans total l'indice de l'écart.
   3. Le dessin (faux DOM, mesure du texte de repli de l'outil) : les lignes du pas à pas tiennent
      dans leur cadre en projection et sur le papier ; au téléphone, une phrase trop longue se coupe
      après « donc » ; la flèche « → 17 » au bout des barres reste dans le cadre.
   Le contrôle au navigateur (vraies polices, vraies tailles d'écran) se fait hors CI (playwright). */
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

/* Les 25 fiches des cinq livrets (render.py) : E10 … E24 et les dix du deuxième tour. */
const FICHES = [...Array.from({ length: 15 }, (_, i) => `E${10 + i}`), ...[11, 12, 13, 16, 17, 18, 20, 22, 19, 24].map((n) => `E${n}D`)];
const CARTES = FICHES.flatMap((nom) => moteur(`${py(nom)}&cards=4&unknown=question`, 4).map((c, k) => ({ ou: `${nom}, carte ${k + 1}`, c })));

/* Un faux DOM : assez pour que les fonctions de dessin de l'outil tournent telles quelles. */
function fauxDocument(){
  const creer = (name) => {
    const n = { name, attrs: {}, children: [], parent: null, textContent: "",
      setAttribute(k, v){ this.attrs[k] = String(v); }, getAttribute(k){ return k in this.attrs ? this.attrs[k] : null; },
      appendChild(c){ if(c.parent) c.remove(); c.parent = this; this.children.push(c); return c; },
      insertBefore(c, ref){ if(c.parent) c.remove(); c.parent = this; const i = ref ? this.children.indexOf(ref) : -1; if(i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; },
      remove(){ if(this.parent){ this.parent.children = this.parent.children.filter((x) => x !== this); this.parent = null; } },
      get firstChild(){ return this.children[0] || null; },
      querySelector(sel){ const id = sel.startsWith("#") ? sel.slice(1) : null; return tous(this).find((x) => x !== this && (id ? x.attrs.id === id : x.name === sel)) || null; } };
    return n;
  };
  const tous = (n) => [n, ...n.children.flatMap(tous)];
  return { createElementNS: (_ns, name) => creer(name), tous };
}

/* Le modèle, le pas à pas et le dessin de l'Enquête ; « ? » ou lettre comme la page (unknown=). */
const outils = new Function("document", "numberedQuestionMarkMode", `
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const SYS_COULEURS_PLURIEL = ")}
  ${ligne("const ENQ_VOCABULAIRE = ")}
  ${ligne("const ENQ_NOMBRES_LETTRES = ")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${ligne("const ENQ_G3_PLANS = ")}
  ${bloc("const ENQ_PROFIL_IMPRIME = {", "};")}
  ${ligne("const ENQ_PROFIL_ECRAN = ")}
  ${ligne("const ENQ_PROFIL_TEL = ")}
  ${ligne("const ENQ_AJOUT_POINTILLES = ")}
  ${ligne("const ENQ_G3_RAPPEL = ")}
  ${ligne("const ENQ_G3_REPONSE_FONT = ")}
  ${ligne("const ENQ_G3_RETIRE_PAPIER = ")}
  ${ligne("const ENQ_G3_VERIF_ECART = ")}
  ${ligne("const ENQ_LIGNE_ALIGNEE = ")}
  let eleveActif = false;
  const xChar = "𝑥";
  function measureTextWidth(){ return NaN; } /* la mesure de repli de l'outil : 0,58 × police par caractère */
  ${fn("el")}
  ${fn("text")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("investigateColorInitial")}
  ${fn("investigateColorInfo")}
  ${fn("formatRelationNumber")}
  ${fn("getCardVarChar")}
  ${fn("getNumberedDisplayVarChar")}
  ${fn("pastilleTextDy")}
  ${fn("wrapTextToWidth")}
  ${fn("taskSplatColor")}
  ${fn("taskSplatRevealColor")}
  ${fn("enqueteNbEtapes")}
  ${fn("enqueteDerniereEtape")}
  ${fn("enqueteMotCouleur")}
  ${fn("enqueteInitiale")}
  ${fn("enqueteArticle")}
  ${fn("enqueteNomUnites")}
  ${fn("enquetePasDeTotal")}
  ${fn("enquetePasDeTotalSvg")}
  ${ligne("function enqueteSymbole(")}
  ${ligne("function enqueteFoisSymbole(")}
  ${ligne("function enqueteLigneCalcul(")}
  ${fn("enqueteTexteLargeur")}
  ${fn("enqueteBarresModele")}
  ${fn("enqueteModeleVide")}
  ${fn("enqueteLargeurCaseVide")}
  ${fn("enqueteTexteCase")}
  ${fn("enqueteLargeursCases")}
  ${fn("enqueteEchelle")}
  ${fn("enqueteHachures")}
  ${fn("enqueteCaseAjoutee")}
  ${fn("enqueteDessinerCase")}
  ${fn("enqueteAccolade")}
  ${fn("enqueteSousAccolade")}
  ${fn("enqueteCadre")}
  ${fn("enqueteProfil")}
  ${fn("enqueteMotsTiennent")}
  ${fn("enqueteMiseEnPage")}
  ${fn("enqueteTitreEtape")}
  ${fn("enqueteTitreEtapeSimple")}
  ${fn("enqueteLigneTexte")}
  ${fn("drawEnqueteBarres")}
  ${fn("enqueteCorrectionPasAPas")}
  ${fn("enqueteG3Regrouper")}
  ${fn("enqueteProjectionPasAPas")}
  ${fn("enqueteG3Etapes")}
  ${fn("enqueteG3VerifIndices")}
  ${fn("enqueteG3Case")}
  ${fn("enqueteG3Lignes")}
  ${fn("enqueteG3DessinerLigne")}
  ${fn("enqueteG3DessinerBarresValeurs")}
  ${fn("enqueteG3DessinerFin")}
  ${fn("enqueteG3Dessiner")}
  return { modele: enqueteBarresModele, plan: enqueteProjectionPasAPas, dessiner: enqueteG3Dessiner, lignes: enqueteG3Lignes,
    profil: enqueteProfil, largeur: enqueteTexteLargeur, pasDeTotal: enquetePasDeTotal, pasDeTotalSvg: enquetePasDeTotalSvg,
    verifIndices: enqueteG3VerifIndices, symbole: enqueteSymbole, fois: enqueteFoisSymbole, ligneCalcul: enqueteLigneCalcul, mot: enqueteMotCouleur };
`);
const DOC = fauxDocument();
const Q = outils(DOC, true), L = outils(DOC, false);

// --- 1. « PAS DE TOTAL » -----------------------------------------------------------------------
test("« PAS DE TOTAL » : les cartes sans total de l'Enquête seulement ; le Système garde « TOTAL ? »", () => {
  assert.equal(Q.pasDeTotal({ family: "C", _rel: { sansTotal: true } }), true);
  assert.equal(Q.pasDeTotal({ family: "C", _rel: {} }), false, "une carte avec total garde son total");
  assert.equal(Q.pasDeTotal({ family: "D", _rel: { sansTotal: true } }), false, "le Système ne change pas");
  assert.equal(Q.pasDeTotal(null), false);
  /* sur les 25 fiches : exactement les cartes sans total (fiches 22, 23, et celles de la 24) */
  const sans = CARTES.filter(({ c }) => Q.pasDeTotal(c)).map(({ ou }) => ou.split(",")[0]);
  assert.deepEqual([...new Set(sans)], ["E22", "E23", "E24"]);
  assert.ok(CARTES.filter(({ c }) => c._rel.sansTotal).every(({ c }) => Q.pasDeTotal(c)));
  /* l'écran et l'impression ne remplacent le TOTAL que derrière enquetePasDeTotal ; le Système
     (sysTotalCache) garde son « ? » */
  const ecran = fn("renderCard");
  assert.match(ecran, /const sansTotalAffiche = \(card\.family === "C" && card\._rel && card\._rel\.sansTotal\) \|\| sysTotalCache\(card\);/);
  assert.match(ecran, /if\(enquetePasDeTotal\(card\)\)\{\n      svg\.appendChild\(gTotal\);\n      enquetePasDeTotalSvg\(gTotal, tLabel, tNum, tx, Number\(totalLabelFs\), 800, totalLabelColor, \(n, a\) => el\(n, a\)\);/);
  /* l'impression donne la case (la feuille est encore cachée quand on la dessine : getBBox y rend une
     boîte vide, « PAS DE » partait hors de la carte — vu au rendu des livrets le 07/10/2026) */
  assert.match(fn("renderCardIntoSvg"), /const boxH = 210;\n  const boxY = ty - 70;\n  let boxW = opts\.sixColonne \? SIX_COLONNE\.colonneW : 280;\n  let boxX = tx - boxW\/2;\n[\s\S]*?if\(enquetePasDeTotal\(card\)\) enquetePasDeTotalSvg\(g, lbl, num, tx, totalLabelSize, 900, totalLabelColor, \(n, a\) => tEl\(n, a\), \{ x:boxX, y:boxY, width:boxW, height:boxH \}\);/);
  assert.match(fn("eleveRappelHtml"), /if\(enquetePasDeTotal\(card\)\) return `<div class="eleveRappelTotal"><span>PAS DE<\/span><b class="pasDe">TOTAL<\/b><\/div>`/);
  assert.match(fn("eleveIndicesAfficher"), /tot\.innerHTML = enquetePasDeTotal\(card\) \? `<span>PAS DE<\/span><b class="pasDe">TOTAL<\/b>`/);
  assert.match(fn("renderEleveSplat"), /\(enquetePasDeTotal\(card\) \? eleveCaseDonneeHtml\("haut blanche pasDe", "Pas de", "Total"\)/);
});

test("« PAS DE TOTAL » dans le SVG : « PAS DE » puis « TOTAL » en gras, centrés, à la place des deux lignes — la case garde sa taille", () => {
  const g = DOC.createElementNS("", "g");
  g.getBBox = () => ({ x: 100, y: 200, width: 180, height: 120 });
  const tLabel = g.appendChild(DOC.createElementNS("", "text")); tLabel.textContent = "TOTAL";
  const tNum = g.appendChild(DOC.createElementNS("", "text")); tNum.textContent = "?";
  Q.pasDeTotalSvg(g, tLabel, tNum, 190, 30, 800, "#111", (n, a) => { const e = DOC.createElementNS("", n); for(const k in a) e.setAttribute(k, a[k]); return e; });
  const textes = g.children.filter((x) => x.name === "text");
  assert.deepEqual(textes.map((t) => t.textContent), ["PAS DE", "TOTAL"], "« TOTAL ? » n'est plus là");
  assert.ok(textes.every((t) => t.attrs["text-anchor"] === "middle" && t.attrs.x === "190" && t.attrs["font-size"] === "30"), "centrés, même taille");
  assert.equal(textes[0].attrs["font-weight"], "800");
  assert.equal(textes[1].attrs["font-weight"], "900", "« TOTAL » en gras");
  const place = g.children.find((x) => x.attrs.class === "pasDeTotalPlace");
  assert.deepEqual(["x", "y", "width", "height"].map((k) => Number(place.attrs[k])), [100, 200, 180, 120], "la place des deux lignes d'avant");
  assert.equal(place.attrs.fill, "none");
  /* les deux lignes autour du milieu de la case */
  const y = textes.map((t) => Number(t.attrs.y)), milieu = 260;
  assert.ok(y[0] < milieu && y[1] > milieu, y.join(" / "));
  /* la case donnée (impression) : centré sur elle, même si getBBox rend une boîte vide */
  const mk = (n, a) => { const e = DOC.createElementNS("", n); for(const k in a) e.setAttribute(k, a[k]); return e; };
  const deux = () => { const h = DOC.createElementNS("", "g"); h.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 });
    const a = h.appendChild(DOC.createElementNS("", "text")); a.setAttribute("y", "92"); a.setAttribute("font-size", "42"); a.textContent = "TOTAL";
    const b = h.appendChild(DOC.createElementNS("", "text")); b.setAttribute("y", "175"); b.setAttribute("font-size", "96"); b.textContent = "?";
    return [h, a, b]; };
  const [h1, a1, b1] = deux();
  Q.pasDeTotalSvg(h1, a1, b1, 260, 42, 900, "#111", mk, { x: 120, y: 22, width: 280, height: 210 });
  const y1 = h1.children.filter((x) => x.name === "text").map((t) => Number(t.attrs.y));
  assert.deepEqual(y1.map((v) => Math.round(v * 10) / 10), [Math.round((127 - 0.24 * 42) * 10) / 10, 127 + 42], "centré sur la case (milieu 127)");
  /* boîte vide et pas de case : estimée d'après les deux lignes, jamais au-dessus de la carte */
  const [h2, a2, b2] = deux();
  Q.pasDeTotalSvg(h2, a2, b2, 260, 42, 900, "#111", mk);
  const y2 = h2.children.filter((x) => x.name === "text").map((t) => Number(t.attrs.y));
  assert.ok(y2[0] > 92 - 42 && y2[1] < 175 + 30, `entre les deux lignes d'avant : ${y2.join(" / ")}`);
  assert.ok(Math.abs((y2[0] + y2[1]) / 2 - (y1[0] + y1[1]) / 2) < 6, "à quelques unités près de la case");
});

// --- 2. le modèle ------------------------------------------------------------------------------
test("le symbole : « ? », 𝑥 en lettre (sur toutes les cartes) ; « 2 × ? », jamais « 2? » ni « 2𝑥 »", () => {
  assert.equal(Q.symbole(false), "?");
  assert.equal(Q.symbole(true), "𝑥");
  assert.equal(Q.fois(1, "?"), "?");
  assert.equal(Q.fois(3, "𝑥"), "3 × 𝑥");
  assert.equal(Q.ligneCalcul({ g: "? ", d: "1" }), "?  = 1");
  assert.equal(Q.ligneCalcul({ g: "verte", d: "9 + 8 = 17", phrase: "La tache verte cache donc 9 + 8 = 17 jetons" }), "La tache verte cache donc 9 + 8 = 17 jetons");
  assert.doesNotMatch(html, /ENQ_LETTRES_VARIEES|ENQ_LETTRES_ESSAI|ENQ_INCONNUE_ESSAI|enqueteInconnueEssai|enqueteLettreCarte/, "plus aucun drapeau d'essai");
  assert.doesNotMatch(render, /ENQ_ESSAI_INCONNUE|ENQ_INCONNUE_ESSAI|add_init_script|\bESSAI\b/, "render.py : plus aucun drapeau d'essai");
});

test("les 25 fiches, en « ? » et en lettre : la référence s'écrit « ? », puis « La tache … cache donc … jetons » avant les autres taches", () => {
  let refs = 0, unites = 0;
  for(const { ou, c } of CARTES){
    for(const [O, sym] of [[Q, "?"], [L, "𝑥"]]){
      const carte = sym === "𝑥" ? { ...c, varChar: "𝑥" } : c;
      const m = O.modele(carte);
      assert.ok(m, `${ou} : un modèle`);
      assert.equal(m.symbole, sym, ou);
      assert.match(m.titre1, /^Schéma de comparaison/, `${ou} : ① « Schéma de comparaison »`);
      const lignes = m.calculs.map((l) => l ? O.ligneCalcul(l) : null);
      const coupe = lignes.indexOf(null);
      lignes.filter(Boolean).forEach((l) => {
        assert.doesNotMatch(l, /\d ?[?𝑥]/, `${ou} : « ${l} » (toujours « 2 × ? »)`);
        assert.doesNotMatch(l, /[?𝑥] ?\d/, `${ou} : « ${l} »`);
      });
      /* après le partage : les autres taches, nommées, jamais « ? » */
      lignes.slice(coupe + 1).forEach((l) => {
        assert.ok(!l.includes(sym), `${ou} : « ${l} »`);
        assert.match(l, /^(La|Chaque) tache [a-z]+ cache donc .+ = \d+ jetons$/, `${ou} : « ${l} »`);
      });
      const vals = c._rel.hiddenValues.map(Number);
      const repet = c._rel.repetees && c._rel.repetees.couleurDe;
      const nb = (i) => repet ? repet.filter((k) => k === repet[i]).length : 1;
      m.calculs.filter((l) => l && l.phrase).forEach((l) => {
        const i = c._rel.hiddenValues.findIndex((_, t) => O.mot(c, t) === l.g);
        assert.ok(i >= 0, `${ou} : ${l.phrase}`);
        assert.equal(l.phrase.startsWith("Chaque tache"), nb(i) > 1, `${ou} : « Chaque tache » quand la couleur est répétée`);
      });
      /* les cases : « ? » pour la référence, le nom pour les autres */
      m.rows.forEach((r) => r.cells.filter((x) => x.kind === "tache").forEach((x) => {
        const t = m.texteCellule(x);
        assert.ok(t === sym ? x.de === m.unit : t === O.mot(c, x.de), `${ou} : case « ${t} »`);
      }));
      if(m.mode === "unite"){
        unites++;
        assert.equal(m.parts.symbole, sym, `${ou} : « ? » dans chaque petite part`);
        assert.ok(!m.calculs.some((l) => l && l.ref), `${ou} : pas de ligne de la référence (aucune tache n'y vaut « ? »)`);
        assert.ok(m.rows.every((r) => r.cells.every((x) => x.kind !== "tache" || m.texteCellule(x) !== sym)), `${ou} : les taches gardent leur nom dans ①`);
      }else{
        refs++;
        const ref = m.calculs[coupe - 1];
        assert.ok(ref && ref.ref, `${ou} : la ligne de la référence juste avant les autres taches`);
        assert.equal(ref.g, O.mot(c, m.unit));
        assert.equal(lignes[coupe - 1], `${nb(m.unit) > 1 ? "Chaque" : "La"} tache ${O.mot(c, m.unit)} cache donc ${vals[m.unit]} jetons`);
        assert.ok(lignes.slice(0, coupe - 1).some((l) => new RegExp(`^\\${sym} = .* = ${vals[m.unit]}$`).test(l) || (l.startsWith(`${sym} = `) || l.includes(`× ${sym} = `) || l.includes(`${sym} = ${vals[m.unit]}`))), `${ou} : « ? » se trouve avant d'être nommé`);
      }
      /* « Je vérifie » : le total seulement ; sans total, l'indice de l'écart */
      if(c._rel.sansTotal){
        assert.equal(m.verification, undefined);
        const v = O.verifIndices(c, m.filtreIndices);
        assert.equal(v.length, 1, `${ou} : ${v.join(" / ")}`);
        assert.ok(c._rel.relations.filter(m.filtreIndices).every((r) => r.op === "ADD" || r.op === "SUB"), ou);
      }else{
        assert.equal(m.sansIndices, true, `${ou} : le total seulement`);
        assert.match(m.verification, /^\d+( \+ \d+)+ = \d+$/, ou);
      }
    }
  }
  assert.equal(refs + unites, 2 * CARTES.length);
  assert.ok(unites >= 8 && refs >= 180, `${refs} références, ${unites} unités communes`);
});

// --- 3. le dessin -------------------------------------------------------------------------------
const P_ECRAN = Q.profil({}), P_PAPIER = Q.profil({ isPrint: true }), P_TEL = Q.profil({ portrait: true });
const textesDe = (g) => DOC.tous(g).filter((n) => n.name === "text");
const largeurTexte = (t) => Q.largeur(t.textContent, Number(t.attrs["font-size"]), Number(t.attrs["font-weight"]) || 700);

test("enqueteG3Lignes : la plus longue ligne tient dans la largeur, en projection et sur le papier ; une liste qui tient ne bouge pas", () => {
  const longue = ["2 × ? + 4 + 4 = 36", "Chaque tache noire cache donc 7 + 4 = 11 jetons"];
  for(const P of [P_ECRAN, P_PAPIER]){
    const largeur = Math.round(Q.largeur(longue[1], P.calcFont, 800) * 0.8);
    const g = DOC.createElementNS("", "g");
    Q.lignes(g, 0, 0, longue, 1, P, 0, largeur);
    const t = textesDe(g);
    assert.equal(t.length, P.isPrint ? 2 : 2, "une ligne de texte par calcul (pas de coupe hors téléphone)");
    t.forEach((x) => assert.ok(largeurTexte(x) <= largeur + 0.5, `« ${x.textContent} » : ${largeurTexte(x)} > ${largeur}`));
    assert.ok(Number(t[0].attrs["font-size"]) < P.calcFont, "la police a baissé");
    /* une liste qui tient : la police ne change pas */
    const g2 = DOC.createElementNS("", "g");
    Q.lignes(g2, 0, 0, ["? = 18 ÷ 2 = 9"], 0, P, 0, 2000);
    assert.equal(Number(textesDe(g2)[0].attrs["font-size"]), P.calcFont);
  }
});

test("enqueteG3Lignes au téléphone : une phrase trop longue se coupe en deux après « donc » ; les autres lignes restent entières", () => {
  const P = P_TEL;
  const phrase = "La tache orange cache donc 2 × 13 = 26 jetons";
  const largeur = Math.round(Q.largeur(phrase, P.calcFont * 0.85, 800) - 10);
  const g = DOC.createElementNS("", "g");
  const h = Q.lignes(g, 0, 0, ["2 × ? = 26", phrase], 1, P, 0, largeur);
  const t = textesDe(g).map((x) => x.textContent);
  assert.deepEqual(t, ["2 × ? = 26", "La tache orange cache donc", "2 × 13 = 26 jetons"]);
  textesDe(g).forEach((x) => assert.ok(largeurTexte(x) <= largeur + 0.5, x.textContent));
  const pas = Number(textesDe(g)[2].attrs.y) - Number(textesDe(g)[1].attrs.y);
  assert.ok(Math.abs(h - 3 * pas) < 1, "trois lignes de hauteur");
  /* qui tient à 85 % de la police : pas de coupe */
  const g2 = DOC.createElementNS("", "g");
  Q.lignes(g2, 0, 0, [phrase], 0, P, 0, Math.ceil(Q.largeur(phrase, P.calcFont * 0.85, 800)) + 2);
  assert.deepEqual(textesDe(g2).map((x) => x.textContent), [phrase]);
  /* hors téléphone : jamais de coupe */
  const g3 = DOC.createElementNS("", "g");
  Q.lignes(g3, 0, 0, [phrase], 0, P_ECRAN, 0, largeur);
  assert.deepEqual(textesDe(g3).map((x) => x.textContent), [phrase]);
});

test("les 25 fiches, projection et téléphone : chaque ligne du pas à pas tient, la flèche « → 17 » et son nombre restent dans le cadre", () => {
  let fleches = 0, etapes = 0, gris = 0, noirs = 0;
  for(const { ou, c } of CARTES){
    const plan = Q.plan(c);
    assert.ok(plan, `${ou} : un pas à pas`);
    for(const [nomP, opts] of [["projection", {}], ["téléphone", { portrait: true }], ["papier", { isPrint: true }]]){
      const P = Q.profil(opts), bord = P.boxX + P.boxW;
      plan.etapes.forEach((et, k) => {
        if(et.type === "vide" || et.type === "fin") return;
        const g = DOC.createElementNS("", "g");
        Q.dessiner(g, c, et, plan.modele, opts);
        etapes++;
        const tous = DOC.tous(g);
        /* plus de « = 17 » au bout d'une barre : une flèche */
        assert.ok(!textesDe(g).some((t) => /^= \d+$/.test(t.textContent)), `${ou}, ${nomP}, étape ${k} : un « = » au bout d'une barre`);
        const pointes = tous.filter((n) => n.name === "polygon" && n.attrs.class === "enqFleche");
        /* la barre de l'étape en noir, celles déjà trouvées en gris */
        const aSaFleche = et.type === "barresValeurs" && et.egal !== false && et.noirDes == null
          && (et.parts ? plan.modele.parts.rows : plan.modele.rows).some((r) => (r.rp ?? r.i) === et.courante && !r.complete);
        if(aSaFleche) assert.ok(pointes.some((pg) => pg.attrs.fill === "#111827"), `${ou}, ${nomP}, étape ${k} : la flèche de l'étape en noir`);
        pointes.forEach((pg) => {
          fleches++; if(pg.attrs.fill === "#6b7280") gris++; else noirs++;
          const pts = pg.attrs.points.split(" ").map((p) => p.split(",").map(Number));
          const pointe = pts[0][0], ym = pts[0][1];
          const trait = tous.find((n) => n.name === "line" && n.attrs.class === "enqFleche" && Number(n.attrs.y1) === ym);
          assert.ok(trait, `${ou} : le trait de la flèche`);
          const longueur = pointe - Number(trait.attrs.x1);
          assert.ok(longueur >= 36 - 0.5 && longueur <= 72 + 0.5, `${ou}, ${nomP} : flèche de ${longueur}`);
          assert.ok(pointe <= bord - 8 + 0.5, `${ou}, ${nomP}, étape ${k} : la pointe sort du cadre`);
          const nb = textesDe(g).find((t) => Math.abs(Number(t.attrs.x) - (pointe + 12)) < 0.5 && Math.abs(Number(t.attrs.y) - ym - 1) < 0.5);
          assert.ok(nb && /^\d+$/.test(nb.textContent), `${ou} : le nombre au bout de la flèche`);
          assert.equal(nb.attrs.fill, pg.attrs.fill, "le nombre de la couleur de sa flèche");
          assert.ok(["#111827", "#6b7280"].includes(pg.attrs.fill), "noir (l'étape) ou gris (déjà trouvée)");
          /* la flèche ne raccourcit que si le nombre sortirait du cadre */
          if(longueur > 36 + 0.5) assert.ok(pointe + 12 + largeurTexte(nb) <= bord - 8 + 0.5, `${ou}, ${nomP}, étape ${k} : « ${nb.textContent} » sort du cadre`);
        });
        /* les lignes de calcul de l'étape (à gauche, sous les barres) tiennent dans la largeur */
        if(P.cadre || P.isPrint){
          const largeur = P.boxW - 2 * P.marge;
          textesDe(g).filter((t) => t.attrs["text-anchor"] === "start" && /=|cache donc/.test(t.textContent) && Number(t.attrs.x) === P.boxX + P.marge)
            .forEach((t) => assert.ok(largeurTexte(t) <= largeur + 0.5, `${ou}, ${nomP}, étape ${k} : « ${t.textContent} » (${Math.round(largeurTexte(t))} > ${largeur})`));
        }
      });
    }
  }
  assert.ok(fleches > 300, `${fleches} flèches`);
  assert.ok(gris > 100 && noirs > 100, `${gris} flèches grises (déjà trouvées), ${noirs} noires`);
  assert.ok(etapes > 1000, `${etapes} dessins`);
});

// --- 4. les livrets (render.py et ses pages) ------------------------------------------------------
test("les livrets : la couverture explique les deux schémas et la référence « ? », la page 2 ne vérifie que le total", async () => {
  const lire = async (f) => readFile(new URL(`../_sources/livret-splat-enquete/${f}`, import.meta.url), "utf8");
  const couv = await lire("couverture.html"), exemple = await lire("exemple.html");
  /* textes choisis par Gwenaël le 07/10/2026 (planche « textes des quatre livrets ») */
  assert.ok(render.includes(`REF_PETITE = "La plus petite tache sert de référence&nbsp;: on note «&nbsp;?&nbsp;» le nombre de jetons qu'elle cache."`));
  assert.ok(render.includes(`"\\n      <span>On dessine <b>deux schémas en barres</b>&nbsp;: le premier compare les taches, "`));
  assert.ok(render.includes(`f"le second les met bout à bout pour résoudre. {ref} La page&nbsp;2 montre l'enquête pas à pas.</span>")`));
  assert.ok(render.includes(`BARRES = "Je représente chaque tache par une barre, les unes sous les autres."`));
  assert.ok(render.includes(`LIGNE = "Je mets les barres bout à bout, sous le total."`));
  assert.ok(render.includes(`"Ici, les deux indices parlent de la tache {g}, la plus grande&nbsp;: elle sert de référence, "`), "deuxième tour 1 : la plus grande sert de référence");
  for(const t of [couv, exemple]){
    assert.ok(t.includes("<b>dessine les schémas en barres</b>"), "« dessine les schémas en barres »");
    assert.ok(!t.includes("dessine le schéma en barres"));
  }
  /* « Je vérifie » : le total seulement, dans les quatre exemples des pages 2 et l'unité commune du dos */
  for(const f of ["textes_exemple_deux", "textes_exemple_complete", "textes_exemple_compose", "textes_exemple_repet"]){
    const a = render.indexOf(`def ${f}(ex):`), corps = render.slice(a, render.indexOf("\n\n\ndef ", a));
    assert.match(corps, /\{ex\['verification'\]\}&nbsp;✓/, `${f} : le total`);
    assert.doesNotMatch(corps, /_verifs\(ex\)|_intro\(/, `${f} : plus les indices ni l'ancienne couverture`);
    assert.match(corps, /intro = _couv\(/, f);
    assert.match(corps, /par_titre = \{/, `${f} : les légendes courtes des étapes`);
  }
  assert.match(render, /\+ "\.<br>" \+ ux\["verification"\] \+ "&nbsp;✓"\)/, "l'unité commune du dos : le total seulement");
  assert.match(render, /titre = e\.type === 'barres' \? 'Schéma de comparaison' : e\.titre;/);
});
