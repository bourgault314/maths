/* SPLAT! — le Système (mode D), la correction en BARRES DE TACHES (lot M4-2, 04/10/2026 ; dessin
   choisi par Gwenaël sur planches : colonne « A » de hauteur-1c / hauteur-3a, puis les plans des
   douze types validés le même jour). Remplace les tests des cadres du lot S3.
   Chaque étape de card._sys.plan : un titre, des barres ; une barre = la case du TOTAL au-dessus
   (le nombre seul), le calcul gris à sa droite, une case par tache (largeur 118 sur 1 600, la
   même partout) ; un plateau retrouvé devient un bloc gris portant son total. On vérifie :
     - le plan refait nombre par nombre, pour quelques milliers de cartes par type (les douze
       types, avec et sans jetons visibles, plateaux rangés ou mélangés) ;
     - les cartes ne changent pas : le générateur filtre toujours les nombres du plan d'avant
       (sysPlanS3), et une empreinte de 8 400 cartes est celle d'avant le lot ;
     - le dessin imprimé (faux SVG) : jamais réduit aux réglages des fiches, rien ne déborde, rien
       ne se chevauche ; l'écran, le téléphone et la correction directe tiennent dans leur scène.
   Les fonctions de outils/splat.html sont extraites du fichier et exécutées telles quelles. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
  "SYS_ZONE_ECRAN", "SYS_ZONE_IMPRIME", "SYS_ZONE_IMPRIME_6", "SYS_TACHE", "SYS_BARRES", "SYS_BARRES_SERRE", "SYS_BARRES_TAILLES", "SYS_CORR_IMPRIME", "SYS_CORR_ECRAN", "SYS_EQ_ECRIT",
  "SYS_ZONE_ECRAN_CORRECTION", "SYS_ZONE_IMPRIME_CORRECTION", "SYS_FIL", "SYS_TEL", "SYS_ZONE_TEL_CORRECTION", "ENQUETE_NOM_ECART", "NOM_PAPIER"].map(constante).join("\n");
const GENERATEUR = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure",
  "sysAssemblerCarte", "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan"].map(fn).join("\n");
const DESSIN = ["sysEnPlateaux", "sysTotalCache", "sysPlateauxMontres", "sysRayonJeton", "sysGrille", "sysColonnesVisibles", "sysRayonMax", "sysDispositionPlateaux", "drawSysPlateaux",
  "sysAPlan", "sysDevoileEleve", "sysBarresMetriques", "sysLargeurTexte", "sysCorrAjuster", "sysBarreCases", "sysBarreLargeur", "sysEtapeTaille", "sysVerifHauteur",
  "sysVerifLargeur", "sysEtapesFlux", "sysJetonCouleurs", "drawSysCaseBarre", "drawSysBarre", "drawSysEtape", "drawSysVerification", "sysSystemeEcrit", "drawSysSystemeEcrit", "drawSysCorrectionImprimee",
  "sysCorrEcranEchelle", "sysCorrectionPasAPas", "drawSysCorrectionDirecte", "sysTelEchelle", "blobPath", "wrapTextToWidth", "beadColorForValue",
  "drawInvestigateSplatName", "nomPapierCorps", "nomPapierAttrs", "investigateColorInfo"].map(fn).join("\n");

const sys = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  /* les largeurs de texte : 0,53 corps par signe en gras (Inter, la police du navigateur de
     contrôle, en fait 0,48 : un dixième de marge pour Segoe UI et les autres) */
  function measureTextWidth(str, font){
    const fs = Number((String(font).match(/(\\d+(?:\\.\\d+)?)px/) || [])[1]) || 16;
    const poids = Number((String(font).match(/^(?:italic )?(\\d{3}) /) || [])[1]) || 400;
    return String(str == null ? "" : str).length * fs * (poids >= 800 ? 0.53 : 0.5);
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
  /* faux SVG : des objets, les textes gardés dans l'ordre ; une page minimale */
  const mkEl = (name, attrs = {}) => ({ name, attrs, children: [], appendChild(c){ this.children.push(c); return c; } });
  const mkText = (x, y, t, attrs = {}) => ({ name: "text", attrs: { x, y, ...attrs }, text: String(t), children: [], appendChild(){} });
  const el = mkEl, text = mkText;
  let svg = mkEl("svg");
  let numberedQuestionMarkMode = true;
  let eleveActif = false;
  const document = { body: { classList: { contains: () => false } }, getElementById: () => null, createElement(){ throw new Error("pas de canevas"); } };
  return {
    B: SYS_BARRES, SERRE: SYS_BARRES_SERRE, IMP: SYS_CORR_IMPRIME, ECR: SYS_CORR_ECRAN, TEL: SYS_TEL, ZI: SYS_ZONE_IMPRIME_CORRECTION,
    mot: (k) => investigateColorWord(investigateColorByKey(k)),
    initiale: (k) => investigateColorInitial(investigateColorByKey(k)),
    systemeEcrit: sysSystemeEcrit, plan: sysPlan, planS3: sysPlanS3, cases: sysBarreCases, metriques: sysBarresMetriques, taille: sysEtapeTaille,
    flux: sysEtapesFlux, verifHauteur: sysVerifHauteur, ecranEchelle: sysCorrEcranEchelle, telEchelle: sysTelEchelle, largeurBarre: sysBarreLargeur,
    imprimee(card, lettres){
      numberedQuestionMarkMode = !lettres;
      const racine = mkEl("svg");
      const entete = drawSysPlateaux(racine, card, SYS_ZONE_IMPRIME_CORRECTION, { mkEl, mkText, isPrint:true, devoile:true, nomMin:16 });
      const haut = Math.max(...entete.plateaux.map((P) => P.y + P.h)) + SYS_CORR_IMPRIME.ecartEnonce;
      const bas = drawSysCorrectionImprimee(racine, card, haut, SYS_CORR_IMPRIME.basImprime, { mkEl, mkText, isPrint:true, lettres: !!lettres });
      numberedQuestionMarkMode = true;
      return { racine, haut, bas, g: racine.children.find((c) => c.attrs.id === "sysCorrectionPrint") };
    },
    directe(card){ svg = mkEl("svg"); drawSysCorrectionDirecte(card); return svg; },
    pasAPas(eleve, coche){ eleveActif = eleve; const d = document.getElementById; document.getElementById = () => ({ checked: coche }); const r = sysCorrectionPasAPas(); document.getElementById = d; eleveActif = false; return r; },
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

/* les douze types du plan du monde 4 (monde-4-audit-et-plan.md, § 2) */
const TYPES = {
  "1a": { geste: "PARTIELLE" }, "1b": { geste: "COEF", ecart: "1" }, "1c": { geste: "COEF", ecart: "2" }, "1d": { geste: "EMBOITE1" },
  "1e": { geste: "ESCALIER" }, "2a": { geste: "DOUBLE" }, "2b": { geste: "DOUBLE", fois: 3 }, "2c": { geste: "DOUBLE", indice: "12" },
  "2d": { geste: "DOUBLE", sens: "INDICE" }, "2d·3": { geste: "DOUBLE", sens: "INDICE", fois: 3 }, "3a": { geste: "MIROIR" }, "3b": { geste: "TROIS" },
  // lot M4-5 : le miroir 1-3, Je recopie (2, 3, 4 fois), Deux gestes à la suite
  "3a+": { geste: "MIROIR", forme: "13" }, "3c·2": { geste: "RECOPIE" }, "3c·3": { geste: "RECOPIE", fois: 3 }, "3c·4": { geste: "RECOPIE", fois: 4 },
  "4e": { geste: "ETAGES" }
};
/* les titres vus par les élèves : ceux des planches validées le 04/10/2026 */
const TITRES = [
  "Les deux plateaux", "Les trois plateaux", "Les trois petits plateaux",
  "Je remplace le petit plateau par son total", "Je remplace un petit plateau par son total", "Je remplace l’autre petit plateau par son total",
  "Je remplace le plateau moyen par son total", "Je remplace chaque petit plateau par son total",
  "Je retrouve 2 fois le petit plateau", "Je retrouve 3 fois le petit plateau", "Je retrouve ce reste dans le petit plateau",
  "J’additionne : je range par paires", "J’additionne : je range en 2 grands plateaux",
  "Je retrouve 1 paire dans le plateau", "Je retrouve 2 paires dans le plateau",
  "Je retire", "Je partage", "Je remplace", "Je vérifie",
  // lot M4-5 (planches A et E de la conception du 14/10/2026)
  "Les deux petits plateaux",
  // lot M4-7 (planche avant/après du 14/10/2026) : deux gestes à la suite, le grand plateau seul
  "Le grand plateau"
];
/* les titres qui portent un nombre (lot M4-5) : les plateaux se nomment par leur total */
const TITRES_NOMBRES = [/^Je recopie [234] fois le plateau \d+$/, /^Je retrouve le plateau \d+ dedans$/, /^Je remplace dans le plateau \d+$/];

function evaluer(calcul){
  let m;
  if((m = calcul.match(/^(\d+) ÷ (\d+)$/))){ assert.equal(Number(m[1]) % Number(m[2]), 0, `division non exacte « ${calcul} »`); return Number(m[1]) / Number(m[2]); }
  if(/^\d+( − \d+)+$/.test(calcul)){ const n = calcul.split(" − ").map(Number); return n.slice(1).reduce((s, x) => s - x, n[0]); }
  if(/^\d+( \+ \d+)+$/.test(calcul)) return calcul.split(" + ").map(Number).reduce((s, x) => s + x, 0);
  if((m = calcul.match(/^(\d+) × (\d+)$/))) return Number(m[1]) * Number(m[2]); // lot M4-5 : « 2 × 37 », je recopie
  assert.fail(`calcul illisible « ${calcul} »`);
}
function verifierLigne(l){
  const m = l.match(/^(.+) = (\d+) ✓$/);
  assert.ok(m, `ligne de vérification « ${l} »`);
  const somme = m[1].split(" + ").reduce((s, t) => { const p = t.match(/^(\d+) × (\d+)$/); return s + (p ? Number(p[1]) * Number(p[2]) : Number(t)); }, 0);
  assert.equal(somme, Number(m[2]), `ligne fausse « ${l} »`);
}

/* Une carte : le plan refait nombre par nombre. */
function verifierPlan(carte){
  const s = carte._sys;
  const v = s.values;
  const plan = s.plan;
  const totaux = s.boards.map((b) => b.total).filter((t) => t !== null);
  const tops = [];
  const trouvees = new Set();
  // lot M4-5 : 12 étapes au plus pour Deux gestes à la suite, 10 pour le miroir 1-3 avec des jetons visibles
  const miroir13 = s.geste === "MIROIR" && Math.abs((s.boards[0].counts[s.colors[0]] || 0) - (s.boards[0].counts[s.colors[1]] || 0)) === 2;
  assert.ok(plan.length >= 5 && plan.length <= (s.geste === "ETAGES" ? 12 : (miroir13 ? 10 : 9)), `${s.geste} : ${plan.length} étapes`);
  plan.forEach((e, n) => {
    assert.ok(TITRES.includes(e.titre) || TITRES_NOMBRES.some((r) => r.test(e.titre)), `titre inconnu « ${e.titre} »`);
    assert.equal(e.titre === "Je vérifie", n === plan.length - 1, "« Je vérifie » en dernier, et seulement là");
    if(e.role === "verification") return;
    assert.ok(e.barres.length >= 1 && e.barres.length <= 3);
    for(const b of e.barres){
      const valeur = (c) => (c.kind === "unknown" ? v[c.color] : c.value);
      const somme = b.cells.reduce((a, c) => a + valeur(c), 0);
      if(b.top === "?") assert.equal(s.geste, "TROIS");
      else assert.equal(somme, Number(b.top), `${s.geste} « ${e.titre} » : la barre ${b.top} ≠ ${somme}`);
      if(b.calcul) assert.equal(evaluer(b.calcul), Number(b.top), `${s.geste} : « ${b.calcul} » ≠ ${b.top}`);
      for(const c of b.cells){
        if(c.kind === "known"){
          assert.equal(c.value, v[c.color]);
          assert.ok(trouvees.has(c.color), `${s.geste} : ${c.color} montrée avant d'être trouvée`);
        }
        if(c.kind === "block"){
          assert.ok(Number.isInteger(c.covers) && c.covers >= 1);
          assert.ok(totaux.includes(c.value) || tops.includes(c.value), `${s.geste} : bloc ${c.value} (ni un plateau, ni un total déjà écrit)`);
        }
        if(c.kind === "visible") assert.ok((s.boards[0].visible || []).includes(c.value));
      }
      // les paquets : coupes croissantes, à l'intérieur de la barre
      const n = sys.cases(b);
      assert.ok(b.coupes.every((k, i) => k > 0 && k < n && (i === 0 || k > b.coupes[i - 1])));
      // une tache seule sous son total : la couleur est trouvée
      if(b.cells.length === 1 && b.cells[0].kind === "unknown" && b.top !== "?"){
        assert.equal(Number(b.top), v[b.cells[0].color]);
        trouvees.add(b.cells[0].color);
      }
      if(b.top !== "?") tops.push(Number(b.top));
    }
  });
  assert.equal(trouvees.size, s.colors.length, `${s.geste} : le plan ne trouve pas toutes les couleurs`);
  const verif = plan[plan.length - 1];
  assert.equal(verif.role, "verification");
  assert.equal(verif.lignes.length, totaux.length, "un calcul par plateau qui a un total");
  verif.lignes.forEach(verifierLigne);
  assert.deepEqual(verif.reponses, s.colors.map((k) => ({ color: k, value: v[k] })));
}

const REGLAGES_FICHES = { totalMin: 20, totalMax: 60 };

test("le plan de chaque type, refait nombre par nombre : 12 types × (sans, avec jetons visibles) × (rangés, mélangés)", () => {
  let n = 0;
  for(const [type, r] of Object.entries(TYPES)) for(const vis of [{ visMin: 0, visMax: 0 }, { visMin: 1, visMax: 3 }]) for(const ordre of ["", "MELANGE"]){
    for(const g of graines(60)) for(const c of sys.serie(g, 10, { ...REGLAGES_FICHES, ...vis, ...r, ordre })){
      verifierPlan(c); n++;
      // aux totaux des fiches, aucun nombre à sous-entendu dans le plan dessiné
      assert.ok(!(JSON.stringify(c._sys.plan).match(/\d+/g) || []).some(sousEntendu), `${type} : nombre à sous-entendu dans la correction`);
    }
  }
  assert.ok(n >= 23000, `${n} cartes`);
});

test("le plan, aux autres réglages : totaux 50 à 100, jetons jusqu'à 6, le Mélange de tous les gestes", () => {
  let n = 0;
  const tous = { geste: "MIX", gestes: ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS", "ESCALIER"] };
  for(const r of [...Object.values(TYPES), tous]) for(const reg of [{ totalMin: 50, totalMax: 100, visMin: 0, visMax: 3 }, { visMin: 2, visMax: 6, coefMax: 4 }]){
    for(const g of graines(25)) for(const c of sys.serie(g, 8, { ...reg, ...r })){ verifierPlan(c); n++; }
  }
  assert.ok(n >= 2500);
});

test("les plans des cartes des planches du 04/10 : étapes et nombres", () => {
  const P = (geste, colors, values, boards) => sys.plan({ geste, colors, values, boards: boards.map(([counts, total, visible]) => (visible ? { counts, total, visible } : { counts, total })) });
  const resume = (plan) => plan.map((e) => [e.titre, e.barres.map((b) => `${b.top}${b.calcul ? ` (${b.calcul})` : ""} : ${b.cells.map((c) => (c.kind === "block" ? `[${c.value}]` : c.kind === "known" ? `${c.color}=${c.value}` : c.kind === "visible" ? `j${c.value}` : c.color)).join(" ")}`)]);
  // 1c (hauteur-1c, colonne A) : 2 R + 3 B = 50 ; 2 R + B = 26
  assert.deepEqual(resume(P("COEF", ["red", "blue"], { red: 7, blue: 12 }, [[{ red: 2, blue: 3 }, 50, []], [{ red: 2, blue: 1 }, 26]])), [
    ["Les deux plateaux", ["50 : red red blue blue blue", "26 : red red blue"]],
    ["Je remplace le petit plateau par son total", ["50 : [26] blue blue"]],
    ["Je retire", ["24 (50 − 26) : blue blue"]],
    ["Je partage", ["12 (24 ÷ 2) : blue"]],
    ["Je remplace", ["26 : red red blue=12"]],
    ["Je retire", ["14 (26 − 12) : red red"]],
    ["Je partage", ["7 (14 ÷ 2) : red"]],
    ["Je vérifie", []]
  ]);
  // 3a (hauteur-3a) : 3 O + 2 R = 36 ; 2 O + 3 R = 29 — rangés par paires dès la première étape
  const m = P("MIROIR", ["orange", "red"], { orange: 10, red: 3 }, [[{ orange: 3, red: 2 }, 36, []], [{ orange: 2, red: 3 }, 29]]);
  assert.deepEqual(resume(m).map((e) => e[0]), ["Les deux plateaux", "J’additionne : je range par paires", "Je partage", "Je retrouve 2 paires dans le plateau", "Je retire", "Je remplace", "Je retire", "Je vérifie"]);
  assert.deepEqual(m[0].barres.map((b) => b.coupes), [[2, 4], [2, 4]], "« orange rouge | orange rouge | orange »");
  assert.deepEqual(resume(m).slice(1, 5), [
    ["J’additionne : je range par paires", ["65 (36 + 29) : orange red orange red orange red orange red orange red"]],
    ["Je partage", ["13 (65 ÷ 5) : orange red"]],
    ["Je retrouve 2 paires dans le plateau", ["36 : [13] [13] orange"]],
    ["Je retire", ["10 (36 − 13 − 13) : orange"]]
  ]);
  // 2a (remplace-2a) : 2 R + 3 Vi = 34 ; R + Vi = 15 — rangé par paquets « rouge violette | rouge violette | violette »
  const d = P("DOUBLE", ["red", "purple"], { red: 11, purple: 4 }, [[{ red: 2, purple: 3 }, 34, []], [{ red: 1, purple: 1 }, 15]]);
  assert.deepEqual(resume(d), [
    ["Les deux plateaux", ["34 : red purple red purple purple", "15 : red purple"]],
    ["Je retrouve 2 fois le petit plateau", ["34 : [15] [15] purple"]],
    ["Je retire", ["4 (34 − 15 − 15) : purple"]],
    ["Je remplace", ["15 : red purple=4"]],
    ["Je retire", ["11 (15 − 4) : red"]],
    ["Je vérifie", []]
  ]);
  assert.deepEqual(d[0].barres[0].coupes, [2, 4]);
  // 2d : N + 2 V = 14 ; 2 N + 3 V = 23 — le petit plateau une fois, puis ce reste dans le petit plateau
  assert.deepEqual(resume(P("DOUBLE", ["black", "green"], { black: 4, green: 5 }, [[{ black: 2, green: 3 }, 23, []], [{ black: 1, green: 2 }, 14]])), [
    ["Les deux plateaux", ["23 : black green green black green", "14 : black green green"]],
    ["Je remplace le petit plateau par son total", ["23 : [14] black green"]],
    ["Je retire", ["9 (23 − 14) : black green"]],
    ["Je retrouve ce reste dans le petit plateau", ["14 : [9] green"]],
    ["Je retire", ["5 (14 − 9) : green"]],
    ["Je remplace", ["9 : black green=5"]],
    ["Je retire", ["4 (9 − 5) : black"]],
    ["Je vérifie", []]
  ]);
  // 1e : on monte l'escalier — le petit plateau, le petit dans le moyen, le moyen dans le grand
  assert.deepEqual(resume(P("ESCALIER", ["black", "purple", "orange"], { black: 6, purple: 7, orange: 8 }, [[{ black: 2, purple: 1, orange: 2 }, 35, []], [{ black: 2, purple: 1 }, 19], [{ black: 2 }, 12]])), [
    ["Les trois plateaux", ["35 : black black purple orange orange", "19 : black black purple", "12 : black black"]],
    ["Je partage", ["6 (12 ÷ 2) : black"]],
    ["Je remplace le petit plateau par son total", ["19 : [12] purple"]],
    ["Je retire", ["7 (19 − 12) : purple"]],
    ["Je remplace le plateau moyen par son total", ["35 : [19] orange orange"]],
    ["Je retire", ["16 (35 − 19) : orange orange"]],
    ["Je partage", ["8 (16 ÷ 2) : orange"]],
    ["Je vérifie", []]
  ]);
  // 1d : N + V + O = 79 ; N + V = 44 ; V + O = 54 — je remplace N + V par 44, puis V + O par 54
  assert.deepEqual(resume(P("EMBOITE1", ["black", "green", "orange"], { black: 25, green: 19, orange: 35 }, [[{ black: 1, green: 1, orange: 1 }, 79, []], [{ black: 1, green: 1 }, 44], [{ green: 1, orange: 1 }, 54]])).slice(1, 7), [
    ["Je remplace un petit plateau par son total", ["79 : [44] orange"]],
    ["Je retire", ["35 (79 − 44) : orange"]],
    ["Je remplace l’autre petit plateau par son total", ["79 : black [54]"]],
    ["Je retire", ["25 (79 − 54) : black"]],
    ["Je remplace", ["44 : black=25 green"]],
    ["Je retire", ["19 (44 − 25) : green"]]
  ]);
  // 3b : deux fois le grand plateau, je partage par 2, puis chaque petit plateau remplacé
  const t = P("TROIS", ["black", "red", "purple"], { black: 10, red: 8, purple: 9 }, [[{ black: 1, red: 1, purple: 1 }, null, []], [{ black: 1, red: 1 }, 18], [{ red: 1, purple: 1 }, 17], [{ black: 1, purple: 1 }, 19]]);
  assert.deepEqual(resume(t).slice(0, 5), [
    ["Les trois petits plateaux", ["18 : black red", "17 : red purple", "19 : black purple"]],
    ["J’additionne : je range en 2 grands plateaux", ["54 (18 + 17 + 19) : black red purple black red purple"]],
    ["Je partage", ["27 (54 ÷ 2) : black red purple"]],
    ["Je remplace chaque petit plateau par son total", ["27 : [18] purple", "27 : [17] black", "27 : [19] red"]],
    ["Je retire", ["9 (27 − 18) : purple", "10 (27 − 17) : black", "8 (27 − 19) : red"]]
  ]);
  assert.deepEqual(t[t.length - 1].lignes, ["10 + 8 = 18 ✓", "8 + 9 = 17 ✓", "10 + 9 = 19 ✓"]);
  // 1f : les jetons visibles sont des cases de la barre, retirés avec le petit plateau
  const j = P("COEF", ["black", "red"], { black: 3, red: 8 }, [[{ black: 2, red: 3 }, 40, [5, 5]], [{ black: 2, red: 1 }, 14]]);
  assert.deepEqual(resume(j).slice(0, 3), [
    ["Les deux plateaux", ["40 : black black red red red j5 j5", "14 : black black red"]],
    ["Je remplace le petit plateau par son total", ["40 : [14] red red j5 j5"]],
    ["Je retire", ["16 (40 − 14 − 5 − 5) : red red"]]
  ]);
  assert.equal(j[j.length - 1].lignes[0], "2 × 3 + 3 × 8 + 5 + 5 = 40 ✓");
  // 3a avec jetons : les jetons se retirent d'abord (la barre des paires reste à 10 cases au plus)
  const mj = P("MIROIR", ["black", "red"], { black: 3, red: 8 }, [[{ black: 2, red: 3 }, 40, [5, 5]], [{ black: 3, red: 2 }, 25]]);
  assert.deepEqual(resume(mj).slice(1, 3), [
    ["Je retire", ["30 (40 − 5 − 5) : black red black red red"]],
    ["J’additionne : je range par paires", ["55 (30 + 25) : black red black red black red black red black red"]]
  ]);
});

test("ordre=MELANGE : le plan ne dépend pas de l'ordre de dessin des plateaux", () => {
  let n = 0, melangees = 0;
  for(const r of Object.values(TYPES)) for(const g of graines(200)){
    // la première carte d'une série : mêmes plateaux, rangés ou mélangés (le mélange est tiré
    // après tout le reste de la carte)
    const [a] = sys.serie(g, 1, { ...REGLAGES_FICHES, ...r });
    const [b] = sys.serie(g, 1, { ...REGLAGES_FICHES, ...r, ordre: "MELANGE" });
    assert.deepEqual(b._sys.boards, a._sys.boards);
    assert.deepEqual(b._sys.plan, a._sys.plan);
    if(b._sys.ordre && b._sys.ordre.some((k, i) => k !== i)) melangees++;
    n++;
  }
  assert.ok(n >= 2400 && melangees > n / 3, `${melangees} / ${n} dessinées dans le désordre`);
  assert.doesNotMatch(fn("sysPlan"), /ordre/, "le plan ne lit pas l'ordre de dessin");
});

// --- les cartes ne changent pas -------------------------------------------------------------
test("le générateur filtre toujours les nombres du plan d'avant (sysPlanS3) : mêmes cartes qu'avant le lot", () => {
  const gen = fn("genSystemCarte");
  assert.match(gen, /if\(sysTexteASousEntendu\(JSON\.stringify\(sit\) \+ JSON\.stringify\(sysPlanS3\(sit\)\)\)\) continue;\n      return sysMelangerPlateaux\(sysAssemblerCarte\(sit, sysPlan\(sit\), o\.clues, false\), rng, o\);/);
  assert.match(fn("sysSituationSure"), /JSON\.stringify\(sysPlanS3\(sit\)\)/);
  assert.match(fn("sysPlanS3"), /calculs: lignes\(MOTS\), lettres: lignes\(LETTRES\)/, "le plan d'avant, tel quel");
  /* l'empreinte de 7 800 cartes (13 réglages × 3 jetons × 2 totaux × 2 ordres × 5 graines × 10),
     calculée sur main avant le lot M4-2 (7bbdc07) : valeurs, plateaux, ordre, total, taches.
     Lot M4-5 : « 2d·3 » (3 fois, le petit recopié dépasse) sort de l'empreinte — ce sens n'existe
     qu'avec 2 fois, ses cartes sont désormais celles de « 2b » (vérifié plus bas) ; l'empreinte des
     13 autres réglages, recalculée sur main d86a02f, n'a pas bougé. */
  const ORDRE = ["1a", "coef", "1b", "1c", "1d", "1e", "2a", "2b", "2c", "2d", "3a", "3b", "mix"];
  const parNom = { ...TYPES, coef: { geste: "COEF" }, mix: { geste: "MIX", gestes: ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS", "ESCALIER"] } };
  const h = createHash("sha256");
  let n = 0;
  for(const nom of ORDRE) for(const vis of [[0, 0], [0, 3], [1, 3]]) for(const tot of [[20, 60], [50, 100]]) for(const ordre of ["", "MELANGE"]) for(const g of [1, 7, 11, 25, 57]){
    for(const c of sys.serie(g, 10, { visMin: vis[0], visMax: vis[1], totalMin: tot[0], totalMax: tot[1], ordre, ...parNom[nom] })){
      const s = c._sys;
      h.update(JSON.stringify([s.geste, s.colors, s.values, s.boards, s.ordre || null, !!s.secours, c.total, c.hidden, c.visible]));
      n++;
    }
  }
  assert.equal(n, 7800);
  assert.equal(h.digest("hex"), "7359304265c3e5d857d1751a60c8f75e97d8000eb97baede16d59fa0896db23a");
  for(const g of [1, 7, 11]) assert.equal(JSON.stringify(sys.serie(g, 10, TYPES["2d·3"])), JSON.stringify(sys.serie(g, 10, TYPES["2b"])), "3 fois : le grand plateau dépasse");
});

// --- le dessin imprimé ----------------------------------------------------------------------
test("impression : jamais réduite aux réglages des fiches, les cases à 118 partout, rien ne déborde ni ne se chevauche", () => {
  // décidé le 04/10 : une case = 118 sur 1 600 de large, sur toutes les cartes ; la case du total
  // a la même hauteur que les cases du dessous
  assert.equal(sys.B.pas, 118);
  assert.equal(sys.B.hCase, 101);
  let n = 0;
  for(const [type, r] of Object.entries(TYPES)) for(const vis of [{ visMin: 0, visMax: 0 }, { visMin: 1, visMax: 3 }]){
    for(const g of graines(12)) for(const c of sys.serie(g, 5, { ...REGLAGES_FICHES, ...vis, ...r })){
      for(const lettres of [false, true]){
        const { g: dessin, haut, bas } = sys.imprimee(c, lettres);
        n++;
        /* lot M4-5 : en 4 par page, « Je recopie » (barres de 9 à 12 cases) et « Deux gestes à la
           suite » (jusqu'à 12 étapes) se réduisent souvent (0,79 au plus petit, mesuré dans
           Chromium) ; les livrets du monde 4 sont en 2 par page. Ici : pas trop, dans la carte. */
        if(["3c·2", "3c·3", "3c·4", "4e"].includes(type) && dessin.attrs["data-echelle"] !== "1"){
          assert.ok(Number(dessin.attrs["data-echelle"]) >= 0.75, `${type} : réduite à ${dessin.attrs["data-echelle"]}`);
          assert.ok(bas <= sys.IMP.basImprime + 0.5, `${type} : le bas à ${bas}`);
          continue;
        }
        assert.equal(dessin.attrs["data-echelle"], "1", `${type} : carte réduite`);
        assert.equal(dessin.attrs.transform, "");
        assert.ok(bas <= sys.IMP.basImprime + 0.5, `${type} : le bas à ${bas}`);
        const etapes = dessin.children;
        assert.equal(etapes.length, c._sys.plan.length, "une étape dessinée par étape du plan");
        // les boîtes des étapes : dans la carte, deux à deux disjointes
        const boites = etapes.map((e) => {
          const rs = elements(e, "rect"), ts = textes(e);
          const xs = rs.flatMap((x) => [x.attrs.x, x.attrs.x + x.attrs.width]).concat(ts.map((t) => t.attrs.x));
          const ys = rs.flatMap((x) => [x.attrs.y, x.attrs.y + x.attrs.height]).concat(ts.map((t) => t.attrs.y));
          return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys) - 30, y1: Math.max(...ys) };
        });
        for(const b of boites){ assert.ok(b.x0 >= sys.IMP.x - 12 && b.x1 <= sys.IMP.xMax + 0.5, `${type} : déborde (${b.x0}, ${b.x1})`); assert.ok(b.y0 >= haut - 30); }
        for(let i = 0; i < boites.length; i++) for(let k = i + 1; k < boites.length; k++){
          const a = boites[i], b = boites[k];
          assert.ok(a.x1 <= b.x0 + 1 || b.x1 <= a.x0 + 1 || a.y1 <= b.y0 + 1 || b.y1 <= a.y0 + 1, `${type} : deux étapes se chevauchent`);
        }
        // les cases : 118 de large (un bloc : 118 × les cases qu'il couvre), 101 de haut
        for(const rect of elements(dessin, "rect").filter((x) => x.attrs.height === sys.B.hCase)){
          const k = rect.attrs.width / sys.B.pas;
          assert.ok(Math.abs(k - Math.round(k)) < 1e-6 && k >= 1, `case de ${rect.attrs.width}`);
        }
      }
    }
  }
  assert.ok(n >= 2800, `${n} cartes`);
});

test("impression : chaque nombre écrit vient du plan ; les noms dans les taches (lettres : la lettre) ; la tache trouvée garde sa valeur dans un rond blanc", () => {
  for(const r of Object.values(TYPES)) for(const c of sys.serie(5, 4, { ...REGLAGES_FICHES, visMin: 0, visMax: 2, ...r })){
    const plan = c._sys.plan;
    const attendus = new Set(plan.flatMap((e) => e.barres.flatMap((b) => [b.top, b.calcul, ...b.cells.filter((x) => x.kind !== "unknown").map((x) => String(x.value))])).filter(Boolean));
    const verif = plan[plan.length - 1];
    verif.lignes.forEach((l) => attendus.add(l));
    verif.reponses.forEach((x) => attendus.add(`${sys.mot(x.color)} = ${x.value}`));
    for(const lettres of [false, true]){
      const { g } = sys.imprimee(c, lettres);
      const mots = new Set(c._sys.colors.map(sys.mot)), initiales = new Set(c._sys.colors.map(sys.initiale));
      // lot M4-4 : le système écrit à côté des barres de « Les deux plateaux » (quand il y a la place),
      // lui aussi fait du plan
      const ecrits0 = new Set(plan.filter((e) => e.role === "plateaux").flatMap((e) => e.barres.map((b) => sys.systemeEcrit(b, lettres))).filter(Boolean));
      ecrits0.forEach((x) => attendus.add(x));
      for(const t of textes(g)){
        if(/^\d/.test(t.text) || / = /.test(t.text) || t.text === "?") assert.ok(attendus.has(t.text), `« ${t.text} » n'est pas dans le plan`);
        else if(!plan.some((e) => e.titre === t.text || e.titre.includes(t.text))) assert.ok(lettres ? initiales.has(t.text) : mots.has(t.text), `« ${t.text} » dans une case`);
      }
      const inconnues = plan.flatMap((e) => e.barres.flatMap((b) => b.cells.filter((x) => x.kind === "unknown"))).length;
      const ecrits = textes(g).filter((t) => (lettres ? initiales : mots).has(t.text)).length;
      assert.equal(ecrits, inconnues, "une tache inconnue = son nom (ou sa lettre) écrit dedans");
    }
  }
});

test("impression : les cartes courtes gardent la mise en page des planches (« Je vérifie » en bas sur toute la largeur), l'étape seule à côté des deux plateaux est centrée sur leurs barres", () => {
  const M = sys.metriques(1);
  const P = (geste, colors, values, boards) => sys.plan({ geste, colors, values, boards: boards.map(([counts, total, visible]) => (visible ? { counts, total, visible } : { counts, total })) });
  const p = P("COEF", ["red", "blue"], { red: 7, blue: 12 }, [[{ red: 2, blue: 3 }, 50, []], [{ red: 2, blue: 1 }, 26]]);
  const f = sys.flux(p.slice(0, -1), M, sys.IMP.x, sys.IMP.xMax, p[p.length - 1], 0);
  const [p1, p2] = f.places;
  assert.equal(p2.col, 1, "« Je remplace le petit plateau par son total » à côté des deux plateaux");
  const centre1 = p1.y + p1.taille.haut + (p1.h - p1.taille.haut) / 2, centre2 = p2.y + p2.taille.haut + (p2.h - p2.taille.haut) / 2;
  assert.ok(Math.abs(centre1 - centre2) <= 1, "centrée sur les deux barres");
  const v = f.places[f.places.length - 1];
  assert.ok(v.verif && v.x === sys.IMP.x && v.w === sys.IMP.xMax - sys.IMP.x - 10, "« Je vérifie » à la ligne, la réponse sur toute la largeur");
  assert.ok(f.places.every((q) => q.taille.lignes === undefined || q.taille.lignes.length === 1), "titres sur une ligne");
  // serré (« Je vérifie » à côté), puis très serré (écarts, titres et calculs un peu plus
  // petits, jamais les cases) : seulement quand la carte ne tient pas autrement
  assert.match(fn("drawSysCorrectionImprimee"), /let flux = sysEtapesFlux\(etapes, M, Z\.x, Z\.xMax, verif, 0\);\n  for\(let serre = 1; serre <= 2 && flux\.h > bas - haut; serre\+\+\)\{/);
  for(const k of Object.keys(sys.SERRE)) assert.ok(!["pas", "hCase", "rTache", "fsTotal", "fsBloc", "trait", "coupe"].includes(k), `très serré ne touche pas aux cases (${k})`);
});

// --- l'écran, le téléphone, la correction directe -------------------------------------------
test("écran : une étape par clic, à une échelle unique pour la carte ; chaque étape tient sous les plateaux", () => {
  for(const r of Object.values(TYPES)) for(const vis of [{ visMin: 0, visMax: 0 }, { visMin: 1, visMax: 3 }]) for(const c of sys.serie(3, 8, { ...REGLAGES_FICHES, ...vis, ...r })){
    for(const y of [380, 430, 480]){
      const f = sys.ecranEchelle(c, y);
      assert.ok(f >= 0.3 && f <= sys.ECR.max);
      const M = sys.metriques(f);
      c._sys.plan.forEach((e, i) => {
        if(e.role === "verification") assert.ok(y + sys.verifHauteur(e, M) <= sys.ECR.bas + 1);
        else{
          const t = sys.taille({ ...e, titre: `${i + 1}. ${e.titre}` }, M);
          assert.ok(y + t.h <= sys.ECR.bas + 1, "l'étape tient en hauteur");
          assert.ok(sys.ECR.x + t.w <= sys.ECR.xMax + 1, "l'étape tient en largeur");
        }
      });
    }
  }
  const ecran = fn("drawSysCorrectionEcran");
  assert.match(ecran, /const M = sysBarresMetriques\(sysCorrEcranEchelle\(card, yEtape\)\);/);
  assert.match(ecran, /const t = drawSysEtape\(g, etape, SYS_CORR_ECRAN\.x, yEtape, M, ctx, k\);/);
  // lot M4-4 : le système écrit à côté des barres de « Les deux plateaux », dans le cadre de l'écran
  assert.match(ecran, /drawSysSystemeEcrit\(g\.children\[g\.children\.length - 1\], p, \[p\], 0, 0, SYS_CORR_ECRAN\.xMax, M, ctx\);/);
});

test("téléphone : la plus longue barre (calcul compris) tient dans la largeur, à une échelle unique pour la carte", () => {
  for(const r of Object.values(TYPES)) for(const c of sys.serie(9, 8, { ...REGLAGES_FICHES, visMin: 0, visMax: 3, ...r })){
    const f = sys.telEchelle(c);
    const M = sys.metriques(f);
    for(const e of c._sys.plan) for(const b of e.barres) assert.ok(sys.largeurBarre(b, M) <= sys.TEL.w - 2 * sys.TEL.marge + 0.5);
  }
});

test("au tableau, « Pas à pas » décoché : toute la correction d'un coup, dans la scène ; le mode élève reste en pas à pas", () => {
  for(const r of Object.values(TYPES)) for(const c of sys.serie(4, 4, { ...REGLAGES_FICHES, visMin: 0, visMax: 3, ...r })){
    const s = sys.directe(c);
    const g = s.children[0];
    assert.equal(g.attrs.id, "sysCorrectionDirecte");
    const k = Number(g.attrs["data-echelle"]);
    assert.ok(k >= 0.5, `échelle ${k}`);
    const [tx, ty] = g.attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
    for(const rect of elements(g, "rect")){
      assert.ok(tx + rect.attrs.x * k >= -0.5 && tx + (rect.attrs.x + rect.attrs.width) * k <= 1600.5, "dans la largeur");
      assert.ok(ty + rect.attrs.y * k >= -0.5 && ty + (rect.attrs.y + rect.attrs.height) * k <= 1000.5, "dans la hauteur");
    }
    assert.equal(elements(g, "g").filter((x) => /\bsysEtape\b/.test(x.attrs.class || "")).length, c._sys.plan.length);
  }
  assert.equal(sys.pasAPas(false, true), true);
  assert.equal(sys.pasAPas(false, false), false);
  assert.equal(sys.pasAPas(true, false), true, "mode élève : toujours pas à pas");
  assert.match(fn("getMaxRevealState"), /if\(sysAPlan\(card\)\) return sysCorrectionPasAPas\(\) \? card\._sys\.plan\.length : 1;/);
  // la case du panneau, et l'adresse : « pasapas=0 » comme l'Enquête, écrit seulement quand c'est décoché
  assert.match(html, /<input type="checkbox" id="sysPasAPas" checked> <span>Pas à pas<\/span>/);
  assert.match(fn("sysLireReglagesM4"), /if\(sysPasAPasEl\) sysPasAPasEl\.checked = params\.get\("pasapas"\) !== "0";/);
  assert.match(fn("sysEcrireReglagesM4"), /if\(sysPasAPasEl && !sysPasAPasEl\.checked\) params\.set\("pasapas", "0"\);/);
});

/* Lot M4-4 (04/10/2026, décisions de Gwenaël) : à côté des barres de « Les deux plateaux », le
   système écrit, chaque corrigé dans sa langue — « 3 noires + 4 rouges = 53 » (avec les taches),
   « 3 × N + 4 × R = 53 » (en lettres ; « 3 × N », jamais « 3N ») — seulement s'il y a la place,
   et alors TOUT le système (une ligne par plateau), en un seul corps ; pareil en projection. */
test("lot M4-4 : le système écrit — en mots, en lettres « 3 × N », tout ou rien, un seul corps, juste", () => {
  const B = (top, cells) => ({ top, cells });
  const u = (color) => ({ kind: "unknown", color }), v = (value) => ({ kind: "visible", value });
  const b53 = B(53, [u("black"), u("black"), u("black"), u("red"), u("red"), u("red"), u("red")]);
  assert.equal(sys.systemeEcrit(b53, false), "3 noires + 4 rouges = 53");
  assert.equal(sys.systemeEcrit(b53, true), "3 × N + 4 × R = 53");
  assert.equal(sys.systemeEcrit(B(16, [u("black"), u("orange"), u("orange")]), false), "1 noire + 2 orange = 16");
  assert.equal(sys.systemeEcrit(B(16, [u("black"), u("orange"), u("orange")]), true), "N + 2 × O = 16");
  assert.equal(sys.systemeEcrit(B(30, [u("green"), u("purple"), v(5), v(2)]), true), "Ve + Vi + 5 + 2 = 30");
  assert.equal(sys.systemeEcrit(B("?", [u("black")]), false), null, "pas de total : rien à écrire");
  assert.equal(sys.systemeEcrit(B(20, [u("black"), { kind: "bloc", value: 12 }]), false), null, "un plateau déjà remplacé n'est pas le système");
  const mots = /^(?:\d+ (?:noires?|bleues?|vertes?|orange|rouges?|violettes?|\d*)|\d+)(?: \+ (?:\d+ (?:noires?|bleues?|vertes?|orange|rouges?|violettes?)|\d+))* = \d+$/;
  const lettres = /^(?:\d+ × )?(?:N|B|Ve|O|R|Vi|\d+)(?: \+ (?:(?:\d+ × )?(?:N|B|Ve|O|R|Vi)|\d+))* = \d+$/;
  let avec = 0, cartes = 0;
  for(const r of Object.values(TYPES)) for(const vis of [{ visMin: 0, visMax: 0 }, { visMin: 1, visMax: 3 }]) for(const c of sys.serie(11, 12, { ...REGLAGES_FICHES, ...vis, ...r })){
    cartes++;
    const deux = c._sys.plan.find((e) => e.role === "plateaux");
    const attendues = deux.barres.filter((b) => String(b.top) !== "?").length;
    const val = (t) => {
      const k = c._sys.colors.find((x) => sys.mot(x) === t || sys.initiale(x) === t || ["noires", "violettes", "orange", "bleues", "vertes", "rouges"].includes(t) && sys.mot(x).startsWith(t.slice(0, 4)));
      assert.ok(k, `« ${t} »`);
      return c._sys.values[k];
    };
    for(const l of [false, true]){
      const { g } = sys.imprimee(c, l);
      const ecrits = textes(g).filter((t) => t.attrs.class === "sysSystemeEcrit");
      // lot M4-5 : Deux gestes à la suite a deux étapes de plateaux (les trois, puis les deux
      // petits) : chacune tout ou rien (3, 2, les deux, ou aucune)
      const permis = c._sys.geste === "ETAGES" ? [0, 2, 3, 5] : [0, attendues];
      assert.ok(permis.includes(ecrits.length), `tout ou rien (${ecrits.length} sur ${attendues})`);
      if(!ecrits.length) continue;
      if(!l) avec++;
      assert.equal(new Set(ecrits.map((t) => t.attrs["font-size"])).size, 1, "un seul corps");
      for(const t of ecrits){
        assert.match(t.text, l ? lettres : mots, t.text);
        assert.doesNotMatch(t.text, /\d(?:N|B|Ve|O|R|Vi)\b/, "jamais « 3N »");
        assert.ok(t.attrs.x + t.text.length * t.attrs["font-size"] * 0.53 <= sys.IMP.xMax + 1, `« ${t.text} » déborde`);
        // juste : la somme des taches et des jetons fait le total
        const [gauche, total] = t.text.split(" = ");
        const somme = gauche.split(" + ").reduce((s, x) => {
          const m = x.match(/^(\d+)(?: ×)? (.+)$/);
          if(m) return s + Number(m[1]) * val(m[2]);
          return s + (/^\d+$/.test(x) ? Number(x) : val(x));
        }, 0);
        assert.equal(somme, Number(total), t.text);
      }
    }
  }
  assert.ok(avec > 0 && avec < cartes, `le système écrit tient sur une partie des cartes (${avec} / ${cartes})`);
  // au tableau (projection) et en correction directe, la même fonction
  assert.match(fn("drawSysCorrectionDirecte"), /drawSysSystemeEcrit\(/);
  assert.match(fn("drawSysCorrectionImprimee"), /drawSysSystemeEcrit\(/);
});

test("les fonctions des cadres du lot S3 sont retirées ; le dessin ne tire rien au sort", () => {
  for(const nom of ["drawSysCadre", "drawSysCadrePortrait", "drawSysCase", "sysCorrMesures", "sysCorrUnite", "sysTelMesures"]) assert.ok(!html.includes(`\nfunction ${nom}(`), `${nom} est encore là`);
  assert.ok(!html.includes("const SYS_CORR = "));
  const bloc = html.slice(html.indexOf("const SYS_BARRES = "), html.indexOf("/* Render écran */"));
  assert.doesNotMatch(bloc, /rng|Math\.random|rInt\(|rFloat\(|shuffleInPlace/);
});
