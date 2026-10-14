/* SPLAT! — le Système (mode D), lot M4-7 « le livret 2 du monde 4 » (cycle 4, 14/10/2026).
   Décisions de Gwenaël sur planches, avant le code :
     - « Le système » sous chaque carte de l'énoncé 2 par page (réglage systeme=1, version C) :
       une ligne par plateau montré, l'une sous l'autre, avec l'accolade ; remplie (en lettres)
       sur la carte de l'exemple des livrets ;
     - le corrigé en lettres : plus de bande de couleur en haut des cases, la lettre au centre ;
     - deux gestes à la suite : chaque plateau dessiné une fois (« Le grand plateau », puis
       « Les deux petits plateaux ») — testé avec le générateur (splat-systeme-m4-5-generateur).
   Les fonctions de outils/splat.html sont extraites du fichier et exécutées telles quelles. */
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
const CONSTANTES = ["SYS_GESTES", "SYS_GESTES_MIX_DEFAUT", "SYS_SOUS_GESTES", "SYS_MAX_TACHES", "SYS_MAX_TACHES_AVANT", "SYS_ESSAIS", "SYS_NOMBRES_SOUS_ENTENDUS",
  "SYS_COULEURS_PLURIEL", "SYS_PLAGES", "SYS_ZONE_ECRAN", "SYS_ZONE_IMPRIME", "SYS_TACHE", "SYS_BARRES", "SYS_2P", "SYS_ZONE_IMPRIME_2P", "SYS_LIGNE_SYSTEME", "NOM_PAPIER"].map(constante).join("\n");
const FONCTIONS = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure", "sysAssemblerCarte", "sysTypeCarte",
  "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan",
  "sysEnPlateaux", "sysTotalCache", "sysPlateauxMontres", "sysRayonJeton", "sysGrille", "sysColonnesVisibles", "sysRayonMax", "sysDispositionPlateaux", "drawSysPlateaux",
  "sysBarresMetriques", "sysLargeurTexte", "sysCorrAjuster", "sysJetonCouleurs", "drawSysCaseBarre", "sysEquationPlateau", "drawSysLigneSysteme",
  "blobPath", "beadColorForValue", "drawInvestigateSplatName", "nomPapierCorps", "nomPapierAttrs", "investigateColorInfo"].map(fn).join("\n");

const sys = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  function measureTextWidth(str, font){
    const fs = Number((String(font).match(/(\\d+(?:\\.\\d+)?)px/) || [])[1]) || 16;
    return String(str == null ? "" : str).length * fs * 0.53;
  }
  ${fn("buildInvestigateColorMap")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${CONSTANTES}
  ${FONCTIONS}
  const mkEl = (name, attrs = {}) => ({ name, attrs, children: [], appendChild(c){ this.children.push(c); return c; } });
  const mkText = (x, y, t, attrs = {}) => ({ name: "text", attrs: { x, y, ...attrs }, text: String(t), children: [], appendChild(){} });
  const el = mkEl, text = mkText;
  const document = { body: { classList: { contains: () => false } }, getElementById: () => null, createElement(){ throw new Error("pas de canevas"); } };
  return {
    L: SYS_LIGNE_SYSTEME, Z: SYS_ZONE_IMPRIME_2P, W: SYS_2P.w, B: SYS_BARRES,
    mkEl, mkText, metriques: sysBarresMetriques, equation: sysEquationPlateau,
    serie(graine, n, reglages){
      const rng = mulberry32(graine);
      const out = [];
      for(let i = 0; i < n; i++) out.push(genSystemCarte(rng, reglages));
      return out;
    },
    // l'énoncé 2 par page d'une carte : ses plateaux, puis « Le système »
    ligne(card, rempli){
      const racine = mkEl("svg");
      const dispo = drawSysPlateaux(racine, card, SYS_ZONE_IMPRIME_2P, { mkEl, mkText, isPrint:true, devoile:false });
      const bas = drawSysLigneSysteme(racine, card, dispo, { mkEl, mkText }, rempli);
      return { racine, dispo, bas, g: racine.children.find((c) => c.attrs && c.attrs.id === "sysLigneSystemePrint") };
    },
    caseBarre(c, lettres, isPrint){
      const g = mkEl("g");
      drawSysCaseBarre(g, 100, 200, c, sysBarresMetriques(1), { mkEl, mkText, isPrint, lettres });
      return g;
    }
  };
`)();

const V0 = { visMin: 0, visMax: 0 }, T2 = { totalMin: 50, totalMax: 100 };
const CAS = [
  ["je recopie", { geste: "RECOPIE", fois: "MIX", ordre: "MELANGE", ...V0, ...T2 }, 2],
  ["deux gestes", { geste: "ETAGES", ...V0, ...T2 }, 3],
  ["trois paires (3 plateaux montrés)", { geste: "TROIS", ordre: "MELANGE", ...V0, ...T2 }, 3],
  ["trois couleurs et des jetons", { geste: "EMBOITE1", visMin: 1, visMax: 3, ...T2 }, 3]
];

test("« Le système » (systeme=1) : une ligne par plateau montré, l'une sous l'autre, l'accolade, sous les plateaux", () => {
  const { L, Z, W } = sys;
  for(const [nom, r, n] of CAS) for(const card of [1, 2, 3, 4, 5].flatMap((g) => sys.serie(g, 6, r))){
    const { dispo, g, bas } = sys.ligne(card, false);
    assert.ok(g, nom);
    assert.equal(g.attrs["data-rempli"], "0");
    const lignes = g.children.filter((c) => c.name === "line"), textes = g.children.filter((c) => c.name === "text");
    assert.equal(dispo.plateaux.length, n, `${nom} : plateaux montrés`);
    assert.equal(lignes.length, 2 * n, `${nom} : pointillés de l'équation et du total, une ligne par plateau`);
    assert.deepEqual(textes.map((t) => t.text), ["Le système :", ...Array(n).fill("=")], nom);
    assert.equal(g.children.filter((c) => c.name === "path").length, 1, `${nom} : l'accolade`);
    // l'équation : 760 de pointillés (≈ 56 mm imprimés), le total 170
    lignes.forEach((l, i) => assert.ok(Math.abs(l.attrs.x2 - l.attrs.x1 - (i % 2 ? L.total : L.equation)) < 1e-6));
    // sous les plateaux, dans la carte, au-dessus de la ligne réponse (y = 2140)
    const ys = [...new Set(lignes.map((l) => l.attrs.y1))];
    assert.equal(ys.length, n);
    ys.forEach((y, i) => i && assert.equal(y - ys[i - 1], L.pas));
    assert.ok(Math.min(...ys) > Math.max(...dispo.plateaux.map((p) => p.y + p.h)) + 80, `${nom} : sous les plateaux`);
    assert.ok(Math.max(...lignes.map((l) => l.attrs.x2)) <= W - Z.x, `${nom} : dans la carte`);
    assert.ok(bas < 1400, `${nom} : la place pour chercher reste (${bas})`);
  }
});

test("« Le système » rempli (la page 2 des livrets) : l'équation de chaque plateau, en lettres, dans l'ordre du dessin", () => {
  for(const [nom, r, n] of CAS) for(const card of [1, 2, 3].flatMap((g) => sys.serie(g, 6, r))){
    const { dispo, g } = sys.ligne(card, true);
    assert.equal(g.attrs["data-rempli"], "1");
    assert.equal(g.children.filter((c) => c.name === "line").length, 0, `${nom} : plus de pointillés`);
    const eqs = g.children.filter((c) => c.name === "text").slice(1).map((t) => t.text);
    const ordre = dispo.plateaux.slice().sort((p, q) => p.x - q.x).map((p) => card._sys.boards[p.indice]);
    assert.deepEqual(eqs, ordre.map((b) => sys.equation(card, b)), nom);
    assert.equal(eqs.length, n);
    for(const e of eqs){
      assert.match(e, /^(?:\d+ × )?(?:N|B|Ve|O|R|Vi)(?: \+ (?:(?:\d+ × )?(?:N|B|Ve|O|R|Vi)|\d+))* = \d+$/, `${nom} : « ${e} »`);
      assert.doesNotMatch(e, /\b1 × |\d(?:N|B|Ve|O|R|Vi)\b/, `${nom} : jamais « 1 × N » ni « 3N »`);
    }
  }
  // la carte de l'exemple du livret 2 : 1 noire + 3 bleues = 58 ; 2 noires + 1 bleue = 46
  const ex = { _sys: { colors: ["black", "blue"], boards: [{ counts: { black: 1, blue: 3 }, total: 58 }, { counts: { black: 2, blue: 1 }, total: 46 }] } };
  assert.deepEqual(ex._sys.boards.map((b) => sys.equation(ex, b)), ["N + 3 × B = 58", "2 × N + B = 46"]);
  // les jetons visibles s'écrivent en nombres
  const j = { _sys: { colors: ["green", "black", "blue"], boards: [{ counts: { green: 1, black: 1, blue: 1 }, total: 82, visible: [2] }] } };
  assert.equal(sys.equation(j, j._sys.boards[0]), "Ve + N + B + 2 = 82");
});

test("systeme=1 : lu et réécrit dans l'adresse, hors de l'empreinte des séries ; seulement l'énoncé 2 par page", () => {
  assert.match(html, /let printSystemeLigne = false;/);
  assert.match(html, /printSystemeLigne = readBooleanFromShare\(params, "systeme"\) === true;/);
  assert.match(html, /if\(printSystemeLigne\) params\.set\("systeme", "1"\);/);
  assert.match(html, /const sharedNames = \[[^\]]*"note", "systeme", "eleve"/);
  assert.match(html, /const ELEVE_HORS_EMPREINTE = \[[^\]]*"note", "systeme"\];/);
  // dessiné dans l'énoncé 2 par page, entre les plateaux et la ligne réponse ; jamais au corrigé
  assert.match(html, /const dispo = drawSysPlateaux\(targetSvg, card, SYS_ZONE_IMPRIME_2P, \{ mkEl:tEl, mkText:tText, isPrint:true, devoile:false \}\);\n\s*if\(printSystemeLigne\) drawSysLigneSysteme\(targetSvg, card, dispo, ctx, false\);\n\s*drawSysLigneReponse\(targetSvg, card, ctx\);/);
  assert.equal((html.match(/drawSysLigneSysteme\(/g) || []).length, 2, "la fonction et son seul appel dans l'outil");
});

test("corrigé en lettres : plus de bande de couleur en haut des cases, la lettre au centre (écran et papier)", () => {
  const M = sys.metriques(1);
  for(const isPrint of [true, false]){
    const g = sys.caseBarre({ kind: "unknown", color: "black" }, true, isPrint);
    const rects = g.children.filter((c) => c.name === "rect");
    assert.equal(rects.length, 1, "une seule case, sans bande");
    assert.equal(rects[0].attrs.height, M.hCase);
    const t = g.children.find((c) => c.name === "text");
    assert.equal(t.text, "N");
    assert.equal(t.attrs.y, 200 + M.hCase / 2, "la lettre au centre de la case");
    const k = sys.caseBarre({ kind: "known", color: "black", value: 16 }, true, isPrint);
    assert.equal(k.children.filter((c) => c.name === "rect").length, 1);
    assert.equal(k.children.find((c) => c.name === "text").attrs.y, 200 + M.hCase / 2);
  }
  assert.doesNotMatch(html, /height:10 \* M\.f, fill:isPrint \? info\.print : info\.screen/);
  assert.doesNotMatch(html, /un liseré en haut/);
});
