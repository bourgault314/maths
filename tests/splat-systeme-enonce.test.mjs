/* SPLAT! — le Système (mode D), lot S2 « l'énoncé » (23/09/2026).
   Un plateau par situation, chacun sous sa boîte TOTAL, à l'écran comme à l'impression (4 et
   6 par page) ; la même taille de tache et la même grille sur tous les plateaux d'une carte
   (décidé le 23/09 : « A · même grille ») ; le nom de la couleur sur chaque tache ; les
   jetons visibles en colonne à droite du plateau principal ; « TOTAL ? » pour TROIS ;
   bandeau brun cannelle et consigne du Système ; phrases ET symboles imprimés en haut, à
   droite du TOTAL ; plus de clic mort à l'écran. Dessin seulement : aucun tirage.
   Les fonctions de outils/splat.html sont extraites du fichier et exécutées telles quelles
   sur plusieurs milliers de cartes du générateur (lot S1). */
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
const CONSTANTES = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS", "SYS_COULEURS_PLURIEL", "SYS_PLAGES",
  "SYS_ZONE_ECRAN", "SYS_ZONE_IMPRIME", "SYS_ZONE_IMPRIME_6", "SYS_TACHE"].map((nom) => ligne(`const ${nom} = `)).join("\n");
const GENERATEUR = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure",
  "sysAssemblerCarte", "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan"].map(fn).join("\n");
const DISPOSITION = ["sysEnPlateaux", "sysTotalCache", "sysRayonJeton", "sysGrille", "sysColonnesVisibles",
  "sysRayonMax", "sysDispositionPlateaux"].map(fn).join("\n");

const sys = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  ${fn("buildInvestigateColorMap")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${CONSTANTES}
  ${GENERATEUR}
  ${DISPOSITION}
  return {
    ZONES: { ecran: SYS_ZONE_ECRAN, imprime: SYS_ZONE_IMPRIME, six: SYS_ZONE_IMPRIME_6 }, T: SYS_TACHE, GESTES: SYS_GESTES,
    enPlateaux: sysEnPlateaux, totalCache: sysTotalCache, grille: sysGrille, disposition: sysDispositionPlateaux, rayonJeton: sysRayonJeton,
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

/* 6 gestes × 3 réglages (défaut ; 6 visibles et coefficients 4 ; sans visible) × 60 graines × 4 cartes */
const REGLAGES = [{}, { visMax: 6, coefMax: 4, totalMax: 150 }, { visMin: 0, visMax: 0, coefMax: 4 }];
const CARTES = [];
for(const geste of sys.GESTES) for(const r of REGLAGES) for(const g of graines(60)) for(const c of sys.serie(g, 4, { geste, ...r })) CARTES.push({ c, geste, defaut: r === REGLAGES[0] });

/* Contour réel d'une tache (blobPath) : rayon × (0,90 + 0,16 sin 5a + 0,04 sin 10a). */
function contour(s){
  return Array.from({ length: 180 }, (_, i) => {
    const a = Math.PI * 2 * i / 180;
    const k = 0.90 + 0.16 * Math.sin(5 * a) + 0.04 * Math.sin(10 * a);
    return [s.cx + Math.cos(a) * s.r * k, s.cy + Math.sin(a) * s.r * k];
  });
}
function ecartTaches(a, b){
  let m = Infinity;
  for(const p of contour(a)) for(const q of contour(b)) m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1]));
  return m;
}

test("chaque carte du Système (clues=BOARD, le défaut) se dessine en plateaux ; Phrases et Symboles gardent le plateau unique", () => {
  const [a] = sys.serie(5, 1, {});
  assert.equal(a._sys.clues, "BOARD");
  assert.ok(sys.enPlateaux(a));
  assert.ok(!sys.enPlateaux(sys.serie(5, 1, { clues: "SENTENCE" })[0]));
  assert.ok(!sys.enPlateaux(sys.serie(5, 1, { clues: "SYMBOL" })[0]));
  assert.ok(!sys.enPlateaux({ family: "C", _rel: {} }));
  assert.ok(!sys.enPlateaux({ family: "D" }), "une carte D sans modèle (ancienne) n'est pas concernée");
});

test("la grille : une tache a la même place sur tous les plateaux où elle apparaît", () => {
  for(const { c } of CARTES){
    const g = sys.grille(c);
    const repete = c._sys.boards.some((b) => Object.values(b.counts).some((n) => n > 1));
    if(!repete){
      // une rangée, une colonne par couleur, dans l'ordre de _sys.colors
      assert.equal(g.lignes, 1);
      g.cases.forEach((cases) => cases.forEach((x) => assert.equal(x.colonne, c._sys.colors.indexOf(x.couleur))));
    }else{
      // une rangée par couleur, alignée à gauche
      assert.equal(g.lignes, c._sys.colors.filter((k) => c._sys.boards.some((b) => b.counts[k])).length);
      g.cases.forEach((cases, i) => {
        const b = c._sys.boards[i];
        for(const k of Object.keys(b.counts)){
          const lg = cases.filter((x) => x.couleur === k);
          assert.equal(lg.length, b.counts[k]);
          assert.deepEqual(lg.map((x) => x.colonne), lg.map((_, j) => j));
          assert.equal(new Set(lg.map((x) => x.ligne)).size, 1);
        }
      });
    }
    for(const zone of Object.values(sys.ZONES)){
      const d = sys.disposition(c, zone);
      const place = (P, k, j) => { const t = P.taches.filter((s) => s.couleur === k)[j]; return t && [t.cx - P.x, t.cy - P.y]; };
      for(const k of c._sys.colors) for(let j = 0; j < 6; j++){
        const vues = d.plateaux.map((P) => place(P, k, j)).filter(Boolean);
        for(const v of vues) assert.deepEqual(v, vues[0], `la ${j + 1}e tache ${k} n'est pas à la même place sur tous les plateaux`);
      }
    }
  }
});

test("tout tient : taches dans leur plateau sans se toucher, visibles à part, TOTAL au-dessus avec un espace, même rayon partout", () => {
  let rMin = Infinity, rEscalier = Infinity;
  for(const { c, geste, defaut } of CARTES){
    for(const [nom, Z] of Object.entries(sys.ZONES)){
      const d = sys.disposition(c, Z);
      const bas = nom === "ecran" ? 1000 : (nom === "six" ? 1000 : 2200);
      assert.equal(d.plateaux.length, c._sys.boards.length);
      // lot M4-1 : l'escalier (trois rangées de taches, plateaux sur une rangée) à part
      if(defaut && geste !== "ESCALIER") rMin = Math.min(rMin, d.r);
      if(geste === "ESCALIER") rEscalier = Math.min(rEscalier, d.r);
      d.plateaux.forEach((P, i) => {
        // plateau dans la scène, sous sa boîte TOTAL (au moins 14 unités de blanc entre les deux)
        assert.ok(P.x >= Z.x - 0.5 && P.x + P.w <= Z.x + Z.w + 0.5 && P.y + P.h <= bas, `${nom} : plateau hors de la carte`);
        assert.ok(P.y - (P.totalY + 210 * Z.echelleTotal) >= 14, `${nom} : TOTAL collé au plateau`);
        assert.equal(P.total, c._sys.boards[i].total);
        // la bonne composition
        const compte = {};
        P.taches.forEach((s) => { compte[s.couleur] = (compte[s.couleur] || 0) + 1; assert.equal(s.r, d.r, "même rayon sur tous les plateaux"); });
        assert.deepEqual(compte, Object.fromEntries(Object.entries(c._sys.boards[i].counts).filter(([, n]) => n > 0)));
        // chaque tache dans son plateau (dessin réel : 1,01 r / 1,05 r / 0,94 r / 1,08 r)
        for(const s of P.taches){
          assert.ok(s.cx - 1.01 * s.r >= P.x + 4 && s.cx + 1.05 * s.r <= P.x + P.w - 4 && s.cy - 0.94 * s.r >= P.y + 4 && s.cy + 1.08 * s.r <= P.y + P.h - 4, `${nom} : une tache sort de son plateau`);
        }
        // jetons visibles : plateau principal seulement, tous là, dans le plateau, hors des taches
        if(i === 0) assert.deepEqual(P.jetons.map((j) => j.valeur), c.visible);
        else assert.equal(P.jetons.length, 0);
        for(const j of P.jetons){
          assert.ok(j.cx - j.r >= P.x && j.cx + j.r <= P.x + P.w && j.cy - j.r >= P.y && j.cy + j.r <= P.y + P.h, `${nom} : jeton visible hors du plateau`);
          for(const s of P.taches) assert.ok(Math.hypot(j.cx - s.cx, j.cy - s.cy) >= s.r * 1.06 + j.r, `${nom} : jeton visible sur une tache`);
        }
        for(let a = 0; a < P.jetons.length; a++) for(let b = a + 1; b < P.jetons.length; b++){
          assert.ok(Math.hypot(P.jetons[a].cx - P.jetons[b].cx, P.jetons[a].cy - P.jetons[b].cy) >= 2 * P.jetons[a].r + 8);
        }
      });
      // deux plateaux ne se chevauchent pas
      for(let a = 0; a < d.plateaux.length; a++) for(let b = a + 1; b < d.plateaux.length; b++){
        const A = d.plateaux[a], B = d.plateaux[b];
        assert.ok(A.x + A.w <= B.x || B.x + B.w <= A.x || A.y + A.h <= B.totalY || B.y + B.h <= A.totalY);
      }
    }
  }
  // aux réglages par défaut, les taches restent assez grandes pour que « violette » tienne dessus
  assert.ok(rMin >= 66, `rayon minimal ${rMin}`);
  // l'escalier : 61 en 4 et 6 par page, 67 à l'écran (sur deux rangées de plateaux : 31 et 34)
  assert.ok(rEscalier >= 55, `escalier : rayon minimal ${rEscalier}`);
});

test("deux taches voisines ne se touchent pas (0,25 r de blanc sur une rangée, 0,36 r d'une rangée à l'autre)", () => {
  const r = 68; // le plus petit rayon aux réglages par défaut
  assert.ok(ecartTaches({ cx:0, cy:0, r }, { cx:sys.T.pasX * r, cy:0, r }) >= 16);
  assert.ok(ecartTaches({ cx:0, cy:0, r }, { cx:0, cy:sys.T.pasY * r, r }) >= 22);
  // et sur une vraie carte : la plus serrée (DOUBLE 2 + 4 avec visibles)
  const serree = CARTES.filter(({ c }) => c._sys.geste === "DOUBLE").map(({ c }) => sys.disposition(c, sys.ZONES.imprime)).sort((a, b) => a.r - b.r)[0];
  for(const P of serree.plateaux) for(let a = 0; a < P.taches.length; a++) for(let b = a + 1; b < P.taches.length; b++){
    assert.ok(ecartTaches(P.taches[a], P.taches[b]) >= 15, "deux taches se touchent");
  }
});

test("le nom de la couleur tient sur la tache : 0,36 r, « violette » (le plus long) fait 4,34 fois la police", () => {
  assert.equal(sys.T.nom, 0.36);
  for(const r of [68, 80, 101, 118]){
    const fs = Math.min(60, Math.max(26, Math.round(r * sys.T.nom)));
    assert.ok(4.34 * fs <= 1.8 * r, `r = ${r} : « violette » déborde`);
  }
  // le jeton dévoilé et le nom au-dessus restent dans la tache (comme l'Enquête : écart 14 au jeton)
  for(const r of [68, 118]){
    const rj = sys.rayonJeton(r), fs = Math.min(60, Math.max(26, Math.round(r * sys.T.nom)));
    const hautMot = rj + 14 + fs * 0.34 + fs * 0.5;
    assert.ok(hautMot <= 0.94 * r + 6, `r = ${r} : le mot sort par le haut de la tache (${hautMot} > ${0.94 * r})`);
  }
});

test("zones : écran 1600 × 1000, impression 4/page (plateaux de 60 à 1540, 440 ou 400 de haut, le bas blanc), 6/page dans 1000", () => {
  const deux = CARTES.find(({ c }) => c._sys.boards.length === 2).c;
  const trois = CARTES.find(({ c }) => c._sys.boards.length === 3).c;
  const quatre = CARTES.find(({ c }) => c._sys.boards.length === 4).c;
  const imp2 = sys.disposition(deux, sys.ZONES.imprime), imp3 = sys.disposition(trois, sys.ZONES.imprime);
  assert.deepEqual(imp2.plateaux.map((P) => P.h), [440, 440]);
  assert.deepEqual(imp3.plateaux.map((P) => P.h), [400, 400, 400]);
  assert.equal(imp2.plateaux[0].x, 60);
  assert.equal(Math.round(imp2.plateaux[1].x + imp2.plateaux[1].w), 1540);
  assert.ok(Math.max(...imp3.plateaux.map((P) => P.y + P.h)) <= 1330, "le bas de la carte reste libre pour chercher");
  for(const c of [deux, trois, quatre]){
    assert.ok(Math.max(...sys.disposition(c, sys.ZONES.six).plateaux.map((P) => P.y + P.h)) <= 995, "6/page : tout tient dans 1000");
    assert.ok(Math.max(...sys.disposition(c, sys.ZONES.ecran).plateaux.map((P) => P.y + P.h)) <= 985, "écran : tout tient dans 1000");
  }
  // 3 plateaux : le 3e sous le premier ; 4 : deux rangées de deux
  assert.equal(imp3.plateaux[2].x, imp3.plateaux[0].x);
  const imp4 = sys.disposition(quatre, sys.ZONES.imprime);
  assert.equal(imp4.plateaux[3].x, imp4.plateaux[1].x);
  assert.equal(imp4.plateaux[3].y, imp4.plateaux[2].y);
});

test("TROIS : le plateau principal n'a pas de total (« TOTAL ? » en gris ardoise), partout", () => {
  for(const { c } of CARTES) assert.equal(sys.totalCache(c), c._sys.geste === "TROIS");
  const src = fn("drawSysPlateaux");
  assert.match(src, /const cache = P\.total == null;/);
  assert.match(src, /cache \? "\?" : String\(P\.total\)/);
  assert.match(src, /fill: cache \? "#64748b"/);
  // Phrases et Symboles (plateau unique) : la boîte du haut aussi
  const ecran = html.slice(html.indexOf("\nfunction renderCard("), html.indexOf("\nfunction renderCardIntoSvg("));
  assert.match(ecran, /const sansTotalAffiche = \(card\.family === "C" && card\._rel && card\._rel\.sansTotal\) \|\| sysTotalCache\(card\);/);
  assert.match(fn("renderCardIntoSvg"), /const sansTotalImprime = \(card\.family === "C" && card\._rel && card\._rel\.sansTotal\) \|\| sysTotalCache\(card\);/);
});

test("écran et impression passent par drawSysPlateaux ; aucun tirage au sort dans le dessin", () => {
  const ecran = fn("renderCard");
  // lot S3 : la signature prend « opts » et la correction passe avant (à partir du 1er clic) ; l'énoncé ne change pas
  // lot M4-2 : au téléphone, en mode élève, la zone qui donne les plus grandes taches (sysZoneTelephone)
  assert.match(ecran, /^function renderCard\(card, revealState, opts = \{\}\)\{\n  clearSvg\(\);\n[\s\S]{0,900}if\(sysEnPlateaux\(card\)\)\{\n[\s\S]{0,120}let zone = SYS_ZONE_ECRAN;\n    if\(typeof eleveActif !== "undefined" && eleveActif && eleveSchemaTelephone\(\)\)\{[\s\S]{0,300}zone = sysZoneTelephone\(card, [^\n]*\);\n    \}\n    drawSysPlateaux\(svg, card, zone, \{ devoile: revealState >= 2 \|\| sysDevoileEleve\(card\) \}\);\n    return;\n  \}/);
  const imp = fn("renderCardIntoSvg");
  assert.match(imp, /if\(sysEnPlateaux\(card\)\)\{\n    const sixParPage = String\(targetSvg\.getAttribute\("viewBox"\) \|\| ""\)\.trim\(\) === "0 0 1600 1000";\n    drawSysPlateaux\(targetSvg, card, sixParPage \? SYS_ZONE_IMPRIME_6 : SYS_ZONE_IMPRIME, \{ mkEl:tEl, mkText:tText, isPrint:true, devoile:revealAnswers \}\);\n    return;\n  \}/);
  // le bloc avant le tray : la carte en plateaux ne dessine ni le grand plateau ni la boîte TOTAL centrée
  assert.ok(imp.indexOf("if(sysEnPlateaux(card))") < imp.indexOf("const printTray = getPrintTrayConfig(card.family);"));
  const bloc = html.slice(html.indexOf("const SYS_ZONE_ECRAN = "), html.indexOf("/* Render écran */"));
  assert.doesNotMatch(bloc, /rng|Math\.random|rInt\(|rFloat\(|shuffleInPlace/);
  // le nom de la couleur sur chaque tache, par la fonction de l'Enquête, à 0,36 r
  const dessin = fn("drawSysPlateaux");
  // lot S3 : les petits plateaux de la correction abaissent le plancher (opts.nomMin) ; l'énoncé garde 26
  assert.match(dessin, /drawInvestigateSplatName\(gp, s, 0, nomCarte, devoile, \{ mkEl, mkText, fs: clamp\(Math\.round\(s\.r \* SYS_TACHE\.nom\), opts\.nomMin \|\| 26, 60\) \}\);/);
  assert.match(fn("drawInvestigateSplatName"), /const fs = Number\(api\.fs\) > 0 \? Number\(api\.fs\) : clamp\(Math\.round\(s\.r \* 0\.30\), 26, 60\);/);
  // dévoilé : les couleurs pâles de l'Enquête et le jeton gris (contraste mesuré ≥ 10 : 1 à l'écran)
  assert.match(dessin, /fill: devoile \? \(isPrint \? info\.printReveal : info\.reveal\) : \(isPrint \? info\.print : info\.screen\)/);
  assert.match(dessin, /fill: isPrint \? "rgba\(0,0,0,0\.06\)" : "var\(--beadH-fill\)"/);
});

test("Phrases et Symboles (plateau unique) : le nom sur chaque tache, et en haut à droite du TOTAL à l'impression", () => {
  const ecran = fn("renderCard");
  assert.match(ecran, /if\(card\.family === "D" && card\._sys\) drawInvestigateSplatName\(layer, s, idx, card, visualRevealState === 2, \{ mkEl:el, mkText:text \}\);/);
  const imp = fn("renderCardIntoSvg");
  assert.match(imp, /if\(card\.family === "D" && card\._sys\) drawInvestigateSplatName\(targetSvg, \{\.\.\.s, cy:s\.cy \+ printOffsetY\}, idx, card, revealAnswers, \{ mkEl:tEl, mkText:tText, isPrint:true \}\);/);
  // phrases : le bandeau de l'Enquête, quel que soit l'état de l'écran au moment d'imprimer
  assert.match(imp, /const enqueteClueBand = \(\(card\.family === "C" \|\| \(card\.family === "D" && !!card\._sys\)\) && !revealAnswers/);
  assert.match(imp, /if\(enqueteClueBand && \(printRevealState === 0 \|\| card\.family === "D"\)\)\{/);
  // symboles : même bandeau, une ligne par indice, le nom de la couleur à côté de chaque pastille
  // (01/10/2026) l'Enquête en symboles prend la même place (fiche 22d), sauf en 6/page
  assert.match(imp, /const sysSymbolBand = \(\(\(card\.family === "D" && !!card\._sys\) \|\| \(card\.family === "C" && !!card\._rel && !opts\.sixColonne && !opts\.sixParPage\)\) && !revealAnswers/);
  assert.match(imp, /if\(enqueteClueBand \|\| sysSymbolBand\) tx = 260;/);
  assert.match(imp, /\}else if\(sysSymbolBand\)\{[\s\S]{0,400}renderMixedClue\(targetSvg, band\.x, [\s\S]{0,120}\{ labels:true, maxW:band\.right - band\.x, left:band\.x \}\);/);
  assert.match(fn("renderMixedClue"), /const labels = !!opts\.labels && !!card && \(card\.family === "C" \|\| \(card\.family === "D" && !!card\._sys\)\);/);
  // « = 13 » ne colle plus à la tache : les espaces au bord d'un texte restent (insécables), pour le Système seulement
  assert.match(fn("renderMixedClue"), /const garderEspaces = !!card && card\.family === "D" && !!card\._sys;/);
  assert.match(fn("renderMixedClue"), /if\(garderEspaces\)\{\n\s+\/\/ [^\n]+\n\s+const mesure = measureTextWidth\(item\.val\.replace\(\/ \/g, "\\u00a0"\)/);
  assert.match(fn("renderMixedClue"), /garderEspaces \? item\.val\.replace\(\/\^ \+\| \+\$\/g, m => "\\u00a0"\.repeat\(m\.length\)\) : item\.val/);
});

test("impression : bandeau brun cannelle et consigne du Système", () => {
  assert.match(html, /\.print-page-header--systeme\{background:linear-gradient\(90deg,#92400e 0%,#b45309 45%,#fbe9dc 100%\)\}/);
  const entete = fn("createClassicPrintHeader");
  assert.match(entete, /if\(actNow === "C" \|\| actNow === "CD"\) header\.classList\.add\("print-page-header--enquete"\);/);
  assert.match(entete, /if\(actNow === "D"\) header\.classList\.add\("print-page-header--systeme"\);/);
  assert.match(fn("getClassicPrintInstruction"), /if\(act === "D"\)\{[\s\S]{0,160}main:"Utilise les totaux de chaque situation pour déterminer le nombre de jetons cachés sous chaque tache\."/);
  assert.doesNotMatch(html, /Utilise les sommes indiquées/);
});

test("écran : plus de clic mort — depuis le lot S3, D avance et recule d'un cadre de correction à la fois", () => {
  const prec = fn("goPreviousCardOrStep");
  // lot S3 : un clic par cadre (voir splat-systeme-correction.test.mjs) ; le retour direct à l'énoncé est retiré
  assert.match(prec, /if\(revealState > 0\)\{\n    revealState = revealState - 1;/);
  // les cartes sans étapes sautent toujours de l'énoncé (0) aux taches dévoilées (2)
  assert.match(fn("goNextCardOrStep"), /\} else if \(revealState === 0\) \{\n      revealState = 2;/);
  // lot M4-2 : un clic par étape, ou un seul (« Pas à pas » décoché, toute la correction d'un coup)
  assert.match(fn("getMaxRevealState"), /if\(sysAPlan\(card\)\) return sysCorrectionPasAPas\(\) \? card\._sys\.plan\.length : 1;\n  return 2;\n\}\n?$/);
});
