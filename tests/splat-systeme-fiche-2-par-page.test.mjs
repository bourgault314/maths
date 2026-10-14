/* SPLAT! — le Système (mode D), la fiche 2 par page (lot M4-3, 04/10/2026).
   Décisions de Gwenaël, sur pages témoins et par questions à choix :
     - le 2 par page reste en PAYSAGE (deux cartes côte à côte) : c'est la page du livret « tablette »
       du monde 4 (une fiche = 4 cartes sur la double page) ; à place égale pour chercher, la carte
       en hauteur dessine tout plus grand que la carte en largeur essayée d'abord ;
     - la carte du Système remplit sa case : 1 830 × 2 200 pour l'énoncé, 1 740 × 2 200 pour le
       corrigé (même échelle qu'avant, plus de largeur) ;
     - l'énoncé : les plateaux TOUJOURS en une rangée en haut, chacun de la hauteur de ses taches
       (« lorsqu'il y a 4 plateaux… il n'y a quasiment plus de place pour dessiner »), la place pour
       chercher dessous, la ligne réponse en bas (« noire = …… rouge = …… ») ;
     - le corrigé : l'énoncé dévoilé en haut, puis les étapes en BLOCS ENCADRÉS, une idée par cadre
       (planches 10a, 10b et 11 du lot M4-2) ; une carte dont les cadres ne tiennent pas, même
       serrés, se dessine sans cadres, comme en 4 par page : jamais de carte réduite ;
     - le pied des fiches de l'Enquête et du Système : « mathsgo.re/splat », comme les livrets.
   Le 4 par page et les autres modes ne changent pas. Les fonctions de outils/splat.html sont
   extraites du fichier et exécutées telles quelles, sur un faux SVG (des objets), comme
   tests/splat-systeme-correction.test.mjs. */
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
function constante(nom){
  const start = html.indexOf(`\nconst ${nom} = `);
  assert.notEqual(start, -1, `${nom} introuvable`);
  return html.slice(start + 1, html.indexOf(";\n", start) + 2);
}

const PALETTE = html.slice(html.indexOf("const INVESTIGATE_COLOR_PALETTE = ["), html.indexOf("];", html.indexOf("const INVESTIGATE_COLOR_PALETTE = [")) + 2);
const CONSTANTES = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_SOUS_GESTES", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS", "SYS_COULEURS_PLURIEL", "SYS_PLAGES",
  "SYS_ZONE_IMPRIME", "SYS_TACHE", "SYS_BARRES", "SYS_BARRES_SERRE", "SYS_BARRES_TAILLES", "SYS_CORR_IMPRIME", "SYS_ZONE_IMPRIME_CORRECTION",
  "SYS_2P", "SYS_2P_VIEWBOX", "SYS_2P_VIEWBOX_CORRECTION", "SYS_ZONE_IMPRIME_2P", "SYS_ZONE_IMPRIME_CORRECTION_2P", "SYS_CORR_IMPRIME_2P", "SYS_REPONSE_2P",
  "SYS_BLOC", "SYS_BLOC_SERRE", "SYS_BLOC_FLECHE", "SYS_EQ_ECRIT", "ENQUETE_NOM_ECART", "NOM_PAPIER"].map(constante).join("\n");
const GENERATEUR = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure",
  "sysAssemblerCarte", "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan"].map(fn).join("\n");
const DESSIN = ["sysEnPlateaux", "sysTotalCache", "sysPlateauxMontres", "sysRayonJeton", "sysGrille", "sysColonnesVisibles", "sysRayonMax", "sysDispositionPlateaux", "drawSysPlateaux",
  "sysAPlan", "sysBarresMetriques", "sysLargeurTexte", "sysCorrAjuster", "sysBarreCases", "sysBarreLargeur", "sysEtapeTaille", "sysVerifHauteur",
  "sysVerifLargeur", "sysEtapesFlux", "sysJetonCouleurs", "drawSysCaseBarre", "drawSysBarre", "drawSysEtape", "drawSysVerification", "sysSystemeEcrit", "drawSysSystemeEcrit", "drawSysCorrectionImprimee",
  "sysBlocs", "sysBlocMesure", "sysBlocPartageAligne", "sysBlocsFlux", "drawSysCorrectionBlocs", "drawSysLigneReponse",
  "blobPath", "wrapTextToWidth", "beadColorForValue", "drawInvestigateSplatName", "nomPapierCorps", "nomPapierAttrs", "investigateColorInfo"].map(fn).join("\n");

const sys = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  /* les largeurs de texte : 0,53 corps par signe en gras (Inter, la police du navigateur de
     contrôle, en fait 0,48 : un dixième de marge pour Segoe UI), « police » pour en essayer une
     plus large */
  let police = 1;
  function measureTextWidth(str, font){
    const fs = Number((String(font).match(/(\\d+(?:\\.\\d+)?)px/) || [])[1]) || 16;
    const poids = Number((String(font).match(/^(?:italic )?(\\d{3}) /) || [])[1]) || 400;
    return police * String(str == null ? "" : str).length * fs * (poids >= 800 ? 0.53 : 0.5);
  }
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
  const el = mkEl, text = mkText;
  let numberedQuestionMarkMode = true;
  let eleveActif = false;
  const document = { body: { classList: { contains: () => false } }, getElementById: () => null, createElement(){ throw new Error("pas de canevas"); } };
  return {
    P2: SYS_2P, VB: SYS_2P_VIEWBOX, VBC: SYS_2P_VIEWBOX_CORRECTION, ZE: SYS_ZONE_IMPRIME_2P, ZC: SYS_ZONE_IMPRIME_CORRECTION_2P, ZI: SYS_ZONE_IMPRIME,
    ZIC: SYS_ZONE_IMPRIME_CORRECTION, IMP: SYS_CORR_IMPRIME_2P, IMP4: SYS_CORR_IMPRIME, REP: SYS_REPONSE_2P, B: SYS_BARRES, BLOC: SYS_BLOC,
    mot: (k) => investigateColorWord(investigateColorByKey(k)),
    blocs: sysBlocs, police(k){ police = k; },
    enonce(card){
      const racine = mkEl("svg");
      const d = drawSysPlateaux(racine, card, SYS_ZONE_IMPRIME_2P, { mkEl, mkText, isPrint:true, devoile:false });
      drawSysLigneReponse(racine, card, { mkEl, mkText, isPrint:true });
      return { racine, d, ligne: racine.children.find((c) => c.attrs.id === "sysLigneReponsePrint") };
    },
    corrige(card, lettres){
      numberedQuestionMarkMode = !lettres;
      const racine = mkEl("svg");
      const Z = SYS_ZONE_IMPRIME_CORRECTION_2P;
      const entete = drawSysPlateaux(racine, card, Z, { mkEl, mkText, isPrint:true, devoile:true, nomMin:Z.nomMin });
      const haut = Math.max(...entete.plateaux.map((P) => P.y + P.h)) + SYS_CORR_IMPRIME_2P.ecartEnonce;
      const bas = drawSysCorrectionBlocs(racine, card, haut, SYS_CORR_IMPRIME_2P.bas, { mkEl, mkText, isPrint:true, lettres: !!lettres });
      numberedQuestionMarkMode = true;
      return { racine, haut, bas, entete, g: racine.children.find((c) => c.attrs.id === "sysCorrectionPrint") };
    },
    quatre(card){
      const racine = mkEl("svg");
      drawSysCorrectionImprimee(racine, card, 600, SYS_CORR_IMPRIME.basImprime, { mkEl, mkText, isPrint:true, lettres:false });
      return racine;
    },
    serie(graine, n, reglages){
      const rng = mulberry32(graine);
      const out = [];
      for(let i = 0; i < n; i++) out.push(genSystemCarte(rng, reglages));
      return out;
    }
  };
`)();

const sousEntendu = (n) => ["69", "88", "420", "666", "1488"].some((x) => String(n).includes(x));
function graines(n, depart = 1){ const out = []; for(let s = depart; out.length < n; s++) if(!sousEntendu(s)) out.push(s); return out; }
const textes = (n, out = []) => { if(!n) return out; if(n.name === "text") out.push(n); (n.children || []).forEach((c) => textes(c, out)); return out; };
const elements = (n, name, out = []) => { if(!n) return out; if(n.name === name) out.push(n); (n.children || []).forEach((c) => elements(c, name, out)); return out; };
const disjoints = (a, b) => a.x1 <= b.x0 + 1 || b.x1 <= a.x0 + 1 || a.y1 <= b.y0 + 1 || b.y1 <= a.y0 + 1;

/* les douze types du plan du monde 4 (monde-4-audit-et-plan.md, § 2) */
const TYPES = {
  "1a": { geste: "PARTIELLE" }, "1b": { geste: "COEF", ecart: "1" }, "1c": { geste: "COEF", ecart: "2" }, "1d": { geste: "EMBOITE1" },
  "1e": { geste: "ESCALIER" }, "2a": { geste: "DOUBLE" }, "2b": { geste: "DOUBLE", fois: 3 }, "2c": { geste: "DOUBLE", indice: "12" },
  "2d": { geste: "DOUBLE", sens: "INDICE" }, "2d·3": { geste: "DOUBLE", sens: "INDICE", fois: 3 }, "3a": { geste: "MIROIR" }, "3b": { geste: "TROIS" },
  // lot M4-5 : le miroir 1-3, Je recopie (2, 3, 4 fois), Deux gestes à la suite
  "3a+": { geste: "MIROIR", forme: "13" }, "3c·2": { geste: "RECOPIE" }, "3c·3": { geste: "RECOPIE", fois: 3 }, "3c·4": { geste: "RECOPIE", fois: 4 },
  "4e": { geste: "ETAGES" }
};
const REGLAGES_FICHES = { totalMin: 20, totalMax: 60 };
/* lot M4-5 : les types nouveaux, dont le corrigé 2 par page est souvent sans cadres (leur part n'entre
   pas dans la « minorité » des types d'avant) */
const NOUVEAUX_M4_5 = ["3a+", "3c·2", "3c·3", "3c·4", "4e"];
const PLATEAUX_4P = 1480; // largeur des plateaux du 4 par page

test("la carte remplit sa case de la page paysage : 1 830 × 2 200 (énoncé), 1 740 × 2 200 (corrigé), à la même échelle qu'avant", () => {
  assert.deepEqual(sys.P2, { w: 1830, wCorrection: 1740 });
  assert.equal(sys.VB, "0 0 1830 2200");
  assert.equal(sys.VBC, "0 0 1740 2200");
  // cases mesurées dans Chromium, page A4 paysage, marges de 8 mm : 130,3 × 156,7 mm (énoncé, sous
  // le cadre de consigne) et 130,3 × 164,8 mm (corrigé) ; la carte du 4 par page (1 600 × 2 200)
  // y était calée sur la hauteur : la même hauteur garde l'échelle, la largeur remplit la case
  assert.ok(Math.abs(sys.P2.w / 2200 - 130.3 / 156.7) < 0.01, "énoncé : la carte remplit sa case");
  assert.ok(Math.abs(sys.P2.wCorrection / 2200 - 130.3 / 164.8) < 0.01, "corrigé : la carte remplit sa case");
  assert.ok(sys.P2.w / 2200 <= 130.3 / 156.7 + 0.002 && sys.P2.wCorrection / 2200 <= 130.3 / 164.8 + 0.002, "jamais calée sur la largeur (l'échelle ne baisse pas)");
  // l'énoncé : les mesures du 4 par page, une rangée, la hauteur des taches
  assert.equal(sys.ZE.w, sys.P2.w - 120);
  assert.deepEqual(sys.ZE.hMax, [440]);
  assert.equal(sys.ZE.uneRangee, true);
  assert.equal(sys.ZE.ajusterHauteur, true);
  assert.equal(sys.ZE.rMax, sys.ZI.rMax);
  assert.equal(sys.ZE.echelleTotal, sys.ZI.echelleTotal);
  // le corrigé : les plateaux de la correction 4 par page, sur la largeur de la carte
  assert.equal(sys.ZC.w, sys.P2.wCorrection - 120);
  assert.deepEqual(sys.ZC.hMax, sys.ZIC.hMax);
  assert.deepEqual({ x: sys.IMP.x, xMax: sys.IMP.xMax, bas: sys.IMP.bas }, { x: 70, xMax: 1680, bas: 2150 });
  assert.equal(sys.ZI.w, PLATEAUX_4P, "le 4 par page ne change pas");
});

test("l'impression : la carte du Système en 2 par page seulement (plateaux), le paysage et le recto verso ne changent pas", () => {
  const sandbox = new Function("cartes", "act", `
    const activityEl = { value: act };
    const cards = cartes;
    ${fn("sysEnPlateaux")}
    ${fn("sysDeuxParPage")}
    return sysDeuxParPage;
  `);
  const plateaux = sys.serie(3, 4, { ...REGLAGES_FICHES, geste: "COEF" });
  const phrases = sys.serie(3, 4, { ...REGLAGES_FICHES, geste: "COEF", clues: "SENTENCE" });
  assert.ok(plateaux.every((c) => c._sys.boards.length > 1));
  assert.equal(sandbox(plateaux, "D")(2), true);
  assert.equal(sandbox(plateaux, "D")(4), false, "4 par page : rien ne change");
  assert.equal(sandbox(plateaux, "D")(1), false);
  assert.equal(sandbox(plateaux, "C")(2), false, "l'Enquête ne change pas");
  assert.equal(sandbox(phrases, "D")(2), false, "le Système en phrases ne change pas");
  assert.equal(sandbox([], "D")(2), false);

  const imprimer = fn("printSheet");
  assert.match(imprimer, /const deuxSys = sysDeuxParPage\(perSheet\);/);
  assert.match(imprimer, /sv\.setAttribute\("viewBox", cardViewBox\);\n[^\n]*\n[^\n]*\n          if\(deuxSys\) sv\.setAttribute\("viewBox", mode === "correction" \? SYS_2P_VIEWBOX_CORRECTION : SYS_2P_VIEWBOX\);/);
  assert.match(imprimer, /sixParPage:perSheet === 6, deuxParPage:deuxSys \}\);/);
  // la page reste en paysage, les cartes côte à côte s'échangent toujours au verso
  assert.match(imprimer, /const layoutClass = perSheet === 1 \? "print-1up" : \(perSheet === 2 \? "print-2up" :/);
  assert.match(imprimer, /const backSlots = mirrorSlotsForDuplex\(frontSlots\);/);
  assert.match(fn("syncDynamicPrintPageStyle"), /const orientation = perSheet === 2 \? "landscape" : "portrait";/);
  // renderCardIntoSvg : la carte élargie, l'énoncé et le corrigé du 2 par page
  const rendu = fn("renderCardIntoSvg");
  assert.match(rendu, /const deuxParPage = !!opts\.deuxParPage && sysEnPlateaux\(card\);/);
  assert.match(rendu, /const W = deuxParPage \? \(revealAnswers \? SYS_2P\.wCorrection : SYS_2P\.w\) : 1600;/);
  assert.match(rendu, /drawSysCorrectionBlocs\(targetSvg, card, haut, SYS_CORR_IMPRIME_2P\.bas, ctx\)/);
  assert.match(rendu, /drawSysPlateaux\(targetSvg, card, SYS_ZONE_IMPRIME_2P, \{ mkEl:tEl, mkText:tText, isPrint:true, devoile:false \}\);\n    drawSysLigneReponse\(targetSvg, card, ctx\);/);
  // le 4 par page garde sa correction sans cadres, à ses bords
  assert.match(rendu, /drawSysCorrectionImprimee\(targetSvg, card, haut, SYS_CORR_IMPRIME\.basImprime, ctx\);/);
});

test("le 4 par page ne bouge pas : mêmes bords, même trait pointillé (60 à 1 540)", () => {
  for(const c of sys.serie(7, 6, { ...REGLAGES_FICHES, geste: "MIROIR" })){
    const r = sys.quatre(c);
    const ligne = r.children.find((x) => x.name === "line");
    assert.deepEqual([ligne.attrs.x1, ligne.attrs.x2], [60, 1540]);
    const g = r.children.find((x) => x.attrs.id === "sysCorrectionPrint");
    assert.equal(g.attrs["data-echelle"], "1");
    assert.equal(g.attrs["data-blocs"], undefined, "pas de cadres en 4 par page");
    const xs = elements(g, "rect").flatMap((x) => [x.attrs.x, x.attrs.x + x.attrs.width]);
    assert.ok(Math.min(...xs) >= sys.IMP4.x - 12 && Math.max(...xs) <= sys.IMP4.xMax + 0.5);
  }
});

test("l'énoncé : les plateaux en une rangée en haut, la ligne réponse en bas (les couleurs dans l'ordre de la correction), la place pour chercher entre les deux", () => {
  let n = 0;
  for(const [type, r] of Object.entries(TYPES)) for(const vis of [{ visMin: 0, visMax: 0 }, { visMin: 1, visMax: 3 }]){
    for(const g of graines(8)) for(const c of sys.serie(g, 5, { ...REGLAGES_FICHES, ...vis, ...r })){
      const { d, ligne: l } = sys.enonce(c);
      n++;
      const P = d.plateaux;
      assert.equal(new Set(P.map((p) => p.y)).size, 1, `${type} : une seule rangée`);
      for(const p of P){
        assert.ok(p.x >= sys.ZE.x - 0.5 && p.x + p.w <= sys.ZE.x + sys.ZE.w + 0.5, `${type} : plateau hors de la carte`);
        for(const t of p.taches){
          assert.ok(t.cx - 1.01 * t.r >= p.x && t.cx + 1.05 * t.r <= p.x + p.w + 0.5, `${type} : tache hors du plateau`);
          assert.ok(t.cy - 0.94 * t.r >= p.y - 0.5 && t.cy + 1.08 * t.r <= p.y + p.h + 0.5, `${type} : tache hors du plateau`);
        }
        for(const j of p.jetons) assert.ok(j.cy - j.r >= p.y - 0.5 && j.cy + j.r <= p.y + p.h + 0.5, `${type} : jeton hors du plateau`);
        assert.ok(p.h <= 440, `${type} : plateau de ${p.h}`);
      }
      // chaque tache garde au moins la taille de lecture du nom (nom 26 au moins)
      assert.ok(d.r >= 40, `${type} : taches de ${d.r}`);
      const basPlateaux = Math.max(...P.map((p) => p.y + p.h));
      // la ligne réponse : « noire = » puis les pointillés, pour chaque couleur, dans l'ordre de la correction
      assert.ok(l, "la ligne réponse");
      assert.deepEqual(textes(l).map((t) => t.text), c._sys.colors.map((k) => `${sys.mot(k)} =`));
      assert.equal(elements(l, "line").length, c._sys.colors.length, "des pointillés par couleur");
      const xs = textes(l).map((t) => t.attrs.x).concat(elements(l, "line").map((x) => x.attrs.x2));
      assert.ok(Math.min(...xs) >= 60 && Math.max(...xs) <= sys.P2.w - 60, `${type} : la ligne réponse dépasse`);
      assert.ok(textes(l).every((t) => t.attrs.y === sys.REP.y));
      // la place pour chercher : au moins 1 300 de haut (≈ 93 mm), sur toute la largeur
      assert.ok(sys.REP.y - sys.REP.fs - basPlateaux >= 1300, `${type} : ${sys.REP.y - sys.REP.fs - basPlateaux} pour chercher`);
    }
  }
  assert.ok(n >= 900, `${n} cartes`);
});

test("l'énoncé : Trois paires montre ses trois paires (lot M4-4b : plus de « TOTAL ? ») sur une seule rangée, chacun de la hauteur de ses taches", () => {
  for(const c of sys.serie(11, 6, { ...REGLAGES_FICHES, geste: "TROIS" })){
    const P = sys.enonce(c).d.plateaux;
    assert.equal(P.length, 3);
    assert.ok(P.every((p) => p.total != null), "aucun plateau sans total");
    assert.equal(new Set(P.map((p) => p.y)).size, 1);
    assert.ok(Math.max(...P.map((p) => p.h)) < 300, "des plateaux à la hauteur des taches, pas de 440");
  }
});

test("la ligne réponse tient dans la carte même avec une police 25 % plus large", () => {
  sys.police(1.25 / 1.1);
  try{
    for(const c of sys.serie(5, 12, { ...REGLAGES_FICHES, geste: "EMBOITE1" })){
      const l = sys.enonce(c).ligne;
      const xs = textes(l).map((t) => t.attrs.x).concat(elements(l, "line").map((x) => x.attrs.x2));
      assert.ok(Math.min(...xs) >= 60 && Math.max(...xs) <= sys.P2.w - 60);
    }
  }finally{ sys.police(1); }
});

test("le corrigé : jamais réduit, une idée par cadre (sans cadres seulement si ça ne tient pas), cadres dans la carte et disjoints, chaque étape dans son cadre", () => {
  let n = 0, sansCadres = 0;
  const typesSansCadres = new Set();
  for(const [type, r] of Object.entries(TYPES)) for(const vis of [{ visMin: 0, visMax: 0 }, { visMin: 1, visMax: 3 }]){
    for(const g of graines(12)) for(const c of sys.serie(g, 5, { ...REGLAGES_FICHES, ...vis, ...r })){
      for(const lettres of [false, true]){
        const { g: dessin, haut, bas } = sys.corrige(c, lettres);
        n++;
        /* lot M4-5 : « Je recopie » 2 fois (barres de 10 cases) et « Deux gestes à la suite »
           (jusqu'à 12 étapes) se réduisent parfois ; les livrets (render.py) ne gardent que les
           cartes jamais réduites. Ici : pas trop (0,75 au moins), le bas dans la carte. */
        if(["3c·2", "4e"].includes(type) && dessin.attrs["data-echelle"] !== "1"){
          assert.ok(Number(dessin.attrs["data-echelle"]) >= 0.75, `${type} : réduite à ${dessin.attrs["data-echelle"]}`);
          assert.ok(bas <= sys.IMP.bas + 0.5, `${type} : le bas à ${bas}`);
          continue;
        }
        assert.equal(dessin.attrs["data-echelle"], "1", `${type} : carte réduite`);
        assert.equal(dessin.attrs.transform, "");
        assert.ok(bas <= sys.IMP.bas + 0.5, `${type} : le bas à ${bas}`);
        const dessinees = elements(dessin, "g").filter((x) => /\bsysEtape\b/.test(x.attrs.class || ""));
        assert.equal(dessinees.length, c._sys.plan.length, "une étape dessinée par étape du plan");
        const boiteEtape = (e) => {
          const rs = elements(e, "rect"), ts = textes(e);
          const xs = rs.flatMap((x) => [x.attrs.x, x.attrs.x + x.attrs.width]).concat(ts.map((t) => t.attrs.x));
          const ys = rs.flatMap((x) => [x.attrs.y, x.attrs.y + x.attrs.height]).concat(ts.map((t) => t.attrs.y));
          return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
        };
        const cadres = elements(dessin, "rect").filter((x) => x.attrs.class === "sysBloc");
        if(dessin.attrs["data-blocs"] === undefined){
          // sans cadres : le dessin du 4 par page, aux bords de cette carte
          if(!NOUVEAUX_M4_5.includes(type)) sansCadres++;
          typesSansCadres.add(`${type}${vis.visMax ? " jetons" : ""}`);
          assert.equal(cadres.length, 0);
          for(const e of dessinees){ const b = boiteEtape(e); assert.ok(b.x0 >= sys.IMP.x - 12 && b.x1 <= sys.IMP.xMax + 0.5, `${type} : déborde`); }
          continue;
        }
        const etapes = c._sys.plan.filter((e) => e.role !== "verification");
        assert.equal(Number(dessin.attrs["data-blocs"]), cadres.length);
        assert.equal(cadres.length, sys.blocs(etapes).length + 1, `${type} : un cadre par idée, plus « Je vérifie »`);
        const boites = cadres.map((x) => ({ x0: x.attrs.x, x1: x.attrs.x + x.attrs.width, y0: x.attrs.y, y1: x.attrs.y + x.attrs.height }));
        for(const b of boites){
          assert.ok(b.x0 >= sys.IMP.x - 0.5 && b.x1 <= sys.IMP.xMax + 0.5, `${type} : cadre hors de la carte (${b.x0}, ${b.x1})`);
          assert.ok(b.y0 >= haut - 0.5 && b.y1 <= sys.IMP.bas + 0.5, `${type} : cadre hors de la carte (${b.y0}, ${b.y1})`);
        }
        for(let i = 0; i < boites.length; i++) for(let k = i + 1; k < boites.length; k++) assert.ok(disjoints(boites[i], boites[k]), `${type} : deux cadres se chevauchent`);
        for(const e of dessinees){
          const b = boiteEtape(e);
          // dans son cadre, avec sa marge intérieure à gauche (12 au moins, serré)
          assert.ok(boites.some((q) => b.x0 >= q.x0 + 11.5 && b.x1 <= q.x1 + 0.5 && b.y0 >= q.y0 - 0.5 && b.y1 <= q.y1 + 0.5), `${type} : « ${e.attrs["data-role"]} » hors de son cadre`);
        }
        // les cases : 118 de large (un bloc gris : 118 × les cases qu'il couvre), 101 de haut
        for(const rect of elements(dessin, "rect").filter((x) => x.attrs.height === sys.B.hCase)){
          const k = rect.attrs.width / sys.B.pas;
          assert.ok(Math.abs(k - Math.round(k)) < 1e-6 && k >= 1, `case de ${rect.attrs.width}`);
        }
      }
    }
  }
  assert.ok(n >= 2800, `${n} cartes`);
  // sans cadres : seulement des cartes longues à jetons visibles (escalier, miroir), et une minorité
  // lot M4-5 : aussi le miroir 1-3 à jetons, et les gestes nouveaux (longues barres, jusqu'à 12 étapes)
  for(const t of typesSansCadres) assert.ok(["1e jetons", "3a jetons", "3a+ jetons"].includes(t) || /^(3c·\d|4e)( jetons)?$/.test(t), `sans cadres : ${t}`);
  const nAnciens = n * Object.keys(TYPES).filter((t) => !NOUVEAUX_M4_5.includes(t)).length / Object.keys(TYPES).length;
  assert.ok(sansCadres <= nAnciens * 0.06, `${sansCadres} cartes sans cadres sur ${nAnciens}`);
});

test("le corrigé n'est jamais réduit même avec une police 25 % plus large (Windows), sur les cartes les plus longues", () => {
  sys.police(1.25 / 1.1);
  try{
    for(const r of [TYPES["1e"], TYPES["3a"], TYPES["2b"], TYPES["2c"], TYPES["1d"]]) for(const g of graines(10)) for(const c of sys.serie(g, 6, { ...REGLAGES_FICHES, visMin: 1, visMax: 3, ...r })){
      assert.equal(sys.corrige(c, false).g.attrs["data-echelle"], "1", `${r.geste} : réduite`);
    }
  }finally{ sys.police(1); }
});

test("une idée par cadre : un cadre commence après « Les deux plateaux » (sauf « Je partage » qui les suit : l'escalier), après une étape qui trouve, et à chaque « Je remplace » / « Je retrouve »", () => {
  const inc = (k, n = 1) => Array.from({ length: n }, () => ({ kind: "unknown", color: k }));
  const bloc = (n) => ({ kind: "block", value: 9, covers: n });
  const barre = (cells) => ({ top: "1", calcul: "", cells, coupes: [] });
  const e = (role, cells, titre = role) => ({ role, titre, barres: [barre(cells)] });
  const noms = (bs) => bs.map((b) => b.map((x) => x.titre));
  // 1b de la planche 10a : Les deux plateaux | Je remplace le petit plateau, Je retire (une tache) | Je remplace, Je retire, Je partage
  const plan1b = [e("plateaux", inc("N", 4), "P"), e("remplace", [bloc(3), ...inc("R")], "R1"), e("retire", inc("R"), "T1"),
    e("remplace", inc("N", 3), "R2"), e("retire", inc("N", 2), "T2"), e("partage", inc("N"), "D")];
  assert.deepEqual(noms(sys.blocs(plan1b)), [["P"], ["R1", "T1"], ["R2", "T2", "D"]]);
  // « Je partage » juste après les plateaux reste dans leur cadre (l'escalier : 2 noires = 6, donc
  // noire = 3, remarque de Gwenaël du 04/10) ; après lui, toujours un nouveau cadre
  assert.deepEqual(noms(sys.blocs([e("plateaux", inc("N", 3), "P"), e("partage", inc("N"), "D"), e("retire", inc("R", 2), "T")])), [["P", "D"], ["T"]]);
  // « Je retire » qui laisse plusieurs taches : la suite reste dans le même cadre
  assert.deepEqual(noms(sys.blocs([e("plateaux", inc("N", 3), "P"), e("additionne", inc("N", 4), "A"), e("partage", inc("N"), "D"), e("retrouve", inc("R", 2), "Q"), e("retire", inc("R", 2), "T"), e("partage", inc("R"), "D2")])),
    [["P"], ["A", "D"], ["Q", "T", "D2"]]);
  // sur les vraies cartes : le premier cadre est « Les deux / trois plateaux » seul, et pour
  // l'escalier « Les trois plateaux » puis « Je partage »
  for(const r of Object.values(TYPES)) for(const c of sys.serie(11, 6, { ...REGLAGES_FICHES, visMin: 0, visMax: 2, ...r })){
    const bs = sys.blocs(c._sys.plan.filter((x) => x.role !== "verification"));
    assert.deepEqual(bs[0].map((x) => x.role), r.geste === "ESCALIER" ? ["plateaux", "partage"] : ["plateaux"]);
    assert.equal(bs.flat().length, c._sys.plan.length - 1, "aucune étape perdue");
  }
});

test("l'escalier : « Je partage » dans le cadre des trois plateaux, sa barre à la hauteur de la barre qu'il partage, une flèche détachée entre les deux", () => {
  let n = 0;
  for(const vis of [{ visMin: 0, visMax: 0 }, { visMin: 1, visMax: 3 }]) for(const g of graines(10)) for(const c of sys.serie(g, 4, { ...REGLAGES_FICHES, ...vis, geste: "ESCALIER" })){
    const { g: dessin } = sys.corrige(c, false);
    if(dessin.attrs["data-blocs"] === undefined) continue;
    n++;
    const etapes = elements(dessin, "g").filter((x) => /\bsysEtape\b/.test(x.attrs.class || ""));
    const plateaux = etapes.find((x) => x.attrs["data-role"] === "plateaux");
    const partage = etapes.find((x) => x.attrs["data-role"] === "partage");
    // les barres : le rectangle du total (trait épais, sans remplissage gris), le premier de chaque barre
    const tops = (e) => elements(e, "rect").filter((x) => x.attrs.height === sys.B.hCase && x.attrs.fill === "#fff" && x.attrs["stroke-width"] === sys.B.trait);
    const div = Number(c._sys.plan[1].barres[0].calcul.split(" ÷ ")[0]);
    const k = c._sys.plan[0].barres.findIndex((b) => Number(b.top) === div);
    assert.ok(k >= 0);
    const yP = tops(plateaux).map((x) => x.attrs.y)[k], yD = tops(partage)[0].attrs.y;
    assert.ok(Math.abs(yP - yD) < 1, `barre partagée à ${yP}, « Je partage » à ${yD}`);
    // dans le même cadre
    const cadres = elements(dessin, "rect").filter((x) => x.attrs.class === "sysBloc");
    const dans = (r, x, y) => x >= r.attrs.x && x <= r.attrs.x + r.attrs.width && y >= r.attrs.y && y <= r.attrs.y + r.attrs.height;
    const cP = cadres.find((r) => dans(r, tops(plateaux)[0].attrs.x, tops(plateaux)[0].attrs.y));
    assert.ok(cP && dans(cP, tops(partage)[0].attrs.x, yD), "« Je partage » hors du cadre des plateaux");
    // la flèche : horizontale, au milieu de la barre partagée, à 45 de chaque bout (elle ne touche rien)
    const fleches = elements(dessin, "path").filter((x) => x.attrs.class === "sysFleche");
    assert.equal(fleches.length, 1, "une flèche");
    const [x1, y1, x2, y2] = fleches[0].attrs.d.match(/^M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+) /).slice(1).map(Number);
    const barreP = tops(plateaux)[k];
    const finBarre = barreP.attrs.x + barreP.attrs.width, debutPartage = tops(partage)[0].attrs.x;
    assert.ok(Math.abs(y1 - y2) < 0.01 && Math.abs(y1 - (yP + sys.B.hCase)) < 0.5, "horizontale, au milieu de la barre");
    assert.ok(Math.abs(x1 - finBarre - 45) < 0.5 && Math.abs(debutPartage - x2 - 45) < 0.5, `détachée : ${x1 - finBarre} et ${debutPartage - x2}`);
  }
  assert.ok(n >= 60, `${n} escaliers`);
});

test("le pied des fiches : « mathsgo.re/splat » pour l'Enquête et le Système (comme les livrets), « mathsgo.re/splat/classique » pour les modes A et B", () => {
  const pied = (act) => new Function("act", `
    const activityEl = { value: act };
    const document = { createElement: () => ({ className: "", textContent: "" }) };
    ${fn("createClassicPrintFooter")}
    return createClassicPrintFooter().textContent;
  `)(act);
  for(const act of ["C", "CD", "D"]) assert.equal(pied(act), "mathsgo.re/splat · CC BY-NC-SA 4.0");
  for(const act of ["U", "UPM", "N", "NPM"]) assert.equal(pied(act), "mathsgo.re/splat/classique · CC BY-NC-SA 4.0");
});

test("le dessin du 2 par page ne tire rien au sort", () => {
  const bloc = html.slice(html.indexOf("const SYS_2P = "), html.indexOf("\nfunction sysCorrEcranEchelle("));
  assert.ok(bloc.length > 2000);
  assert.doesNotMatch(bloc, /rng|Math\.random|rInt\(|rFloat\(|shuffleInPlace/);
});
