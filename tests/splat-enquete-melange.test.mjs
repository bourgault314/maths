/* SPLAT! Enquête — lot E-melange (24/09/2026), pour la fiche 24 « Le défi qui rebondit » :
   « Sans total » et « Taches répétées » cochées ENSEMBLE, les deux sortes de cartes se
   mélangent (choix de Gwenaël du 24/09 : comme les cases ×, ÷, +, −, chaque carte tire au
   hasard parmi ce qui est coché). Chaque carte tire d'abord sa sorte, une carte « sans total »
   (2 taches, un rapport et un écart, aucun jeton visible) ou une carte à taches répétées.
   Une carte n'est jamais les deux (sans total, le nombre de taches ne compte plus).
   Ces tests exécutent les fonctions de outils/splat.html telles quelles (extraites du
   fichier) :
   - une seule des deux cases cochée, ou aucune : genInvestigate donne EXACTEMENT les mêmes
     cartes et consomme exactement le même hasard qu'avant le lot (empreintes relevées sur
     main = 8cbc516) ;
   - les deux cochées : 5 000 cartes, les deux sortes présentes, aucune carte à la fois
     répétée et sans total, pas de jeton visible sur une carte sans total, bornes respectées ;
   - l'adresse se lit et se réécrit ; le panneau ; la consigne imprimée. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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

/* genInvestigate lit ses réglages dans la page : on lui donne de faux contrôles. Une case
   absente de la page (null) = une page d'avant les lots E-sans-total / E-repet. */
const tirer = new Function("invTaskCountEl", "invClueTypeEl", "invStructure3El", "invOpMulEl", "invOpDivEl", "invOpAddEl", "invOpSubEl",
  "invMaxAddEl", "invVisibleMinEl", "invVisibleMaxEl", "invTotalMinEl", "invTotalMaxEl", "invNoTotalEl", "invRepeatOnEl", "invRepeatEl",
  "activityEl", "investigatePaletteKeys", `
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${ligne("const INVESTIGATE_REPEAT_MAX = ")}
  ${ligne("const INVESTIGATE_REPEAT_TACHES_MAX = ")}
  ${ligne("const SYS_NOMBRES_SOUS_ENTENDUS = ")}
  ${ligne("function mulberry32(")}
  ${ligne("function rInt(")}
  ${ligne("function shuffleInPlace(")}
  ${ligne("function clamp(")}
  ${ligne("function numberOr(")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${fn("buildInvestigateColorMap")}
  ${fn("sysNombreSousEntendu")}
  ${fn("genInvestigate")}
  return (reglages, graine, n) => {
    const r = Object.assign({ splats:"2", clues:"SENTENCE", structure:"MIX", mul:true, div:true, add:true, sub:true,
      deltaMax:20, visibleMin:0, visibleMax:3, totalMin:20, totalMax:100 }, reglages);
    invTaskCountEl = { value:String(r.splats) }; invClueTypeEl = { value:r.clues }; invStructure3El = { value:r.structure };
    invOpMulEl = { checked:r.mul }; invOpDivEl = { checked:r.div }; invOpAddEl = { checked:r.add }; invOpSubEl = { checked:r.sub };
    invMaxAddEl = { value:String(r.deltaMax) }; invVisibleMinEl = { value:String(r.visibleMin) }; invVisibleMaxEl = { value:String(r.visibleMax) };
    invTotalMinEl = { value:String(r.totalMin) }; invTotalMaxEl = { value:String(r.totalMax) };
    invNoTotalEl = ("noTotal" in r) ? { checked:r.noTotal } : null;
    invRepeatOnEl = ("repeat" in r) ? { checked:r.repeat > 1 } : null;
    invRepeatEl = ("repeat" in r) ? { value:String(r.repeat) } : null;
    const rng = mulberry32(graine | 0);
    let appels = 0;
    const compte = () => { appels++; return rng(); };
    const cartes = [];
    for(let i = 0; i < n; i++) cartes.push(genInvestigate(compte));
    return { cartes, appels };
  };`)(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, { value:"C" }, null);

const empreinte = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex").slice(0, 16);
const INTERDITS = ["69", "88", "420", "666", "1488"];
const sousEntendu = (n) => INTERDITS.some(x => String(n).includes(x));

/* Réglages de la fiche 24 (plan de production du 24/09, § 4), sans « Sans total ». */
const F24 = { splats:"3", structure:"MIX", repeat:3, mul:true, div:true, add:true, sub:true, deltaMax:30, visibleMin:1, visibleMax:3, totalMin:20, totalMax:60 };
const MELANGE = { ...F24, noTotal:true };
/* Les jeux de réglages rejoués, empreintes relevées sur main = 8cbc516, avant le lot :
   Enquête ordinaire (défaut, fiches 10, 14, 19), fiches 20 à 23, fiche 24 sans
   « Sans total », « Taches répétées » seule, « Sans total » seule. */
const JEUX = {
  "défaut 2 taches": [{}, 5, 300],
  "défaut 3 taches": [{ splats:"3" }, 8, 300],
  "fiche 10": [{ mul:false, div:false, sub:false, deltaMax:10, visibleMax:0, totalMin:10, totalMax:30 }, 339, 200],
  "fiche 14": [{ splats:"3", structure:"MIX", mul:false, div:false, deltaMax:15, visibleMin:1, visibleMax:3, totalMin:20, totalMax:60 }, 950, 200],
  "fiche 19": [{ splats:"3", structure:"MIX", deltaMax:15, visibleMin:1, visibleMax:3, totalMin:20, totalMax:60 }, 537, 200],
  "fiche 20": [{ repeat:3, mul:false, div:false, deltaMax:10, visibleMin:0, visibleMax:0, totalMin:20, totalMax:60 }, 20, 300],
  "fiche 21": [{ repeat:3, add:false, sub:false, deltaMax:10, visibleMin:0, visibleMax:0, totalMin:20, totalMax:60 }, 21, 300],
  "fiche 22": [{ noTotal:true, div:false, sub:false, deltaMax:30, visibleMin:0, visibleMax:0, totalMin:15, totalMax:60 }, 22, 300],
  "fiche 23": [{ noTotal:true, mul:false, add:false, deltaMax:30, visibleMin:0, visibleMax:0, totalMin:15, totalMax:60 }, 23, 300],
  "fiche 24 sans mélange": [F24, 24, 300],
  "taches répétées seule": [{ repeat:2 }, 77, 300],
  "sans total seule": [{ noTotal:true }, 78, 300]
};
const EMPREINTES_MAIN = {
  "défaut 2 taches": "9ac27e69714d24e0", "défaut 3 taches": "f9c0073552b92ede",
  "fiche 10": "bb4f9e56dd09abe2", "fiche 14": "a330ad43b4a704c4", "fiche 19": "afff5dc4115a8a30",
  "fiche 20": "389784ae361711fa", "fiche 21": "2949970c906471fe", "fiche 22": "f8537de79275d36f",
  "fiche 23": "f26b24f3a61c1210", "fiche 24 sans mélange": "022f5bea4862beb8",
  "taches répétées seule": "68043baac4092dd5", "sans total seule": "f39c61efb48dd2bd"
};
const APPELS_MAIN = {
  "défaut 2 taches": 6220, "défaut 3 taches": 14370, "fiche 10": 3345, "fiche 14": 8373,
  "fiche 19": 13675, "fiche 20": 5157, "fiche 21": 8107, "fiche 22": 3931, "fiche 23": 3836,
  "fiche 24 sans mélange": 62048, "taches répétées seule": 6751, "sans total seule": 4104
};

test("une seule des deux cases cochée, ou aucune : exactement les mêmes cartes et le même hasard qu'avant le lot", () => {
  for(const [nom, [r, g, n]] of Object.entries(JEUX)){
    const x = tirer(r, g, n);
    assert.equal(empreinte(x), EMPREINTES_MAIN[nom], `${nom} : cartes de main`);
    assert.equal(x.appels, APPELS_MAIN[nom], `${nom} : même nombre de tirages au hasard`);
  }
  // l'autre case présente mais décochée : pareil
  const [rST, gST, nST] = JEUX["sans total seule"];
  assert.equal(empreinte(tirer({ ...rST, repeat:1 }, gST, nST)), EMPREINTES_MAIN["sans total seule"]);
  const [r24, g24, n24] = JEUX["fiche 24 sans mélange"];
  assert.equal(empreinte(tirer({ ...r24, noTotal:false }, g24, n24)), EMPREINTES_MAIN["fiche 24 sans mélange"]);
});

test("les deux cochées : les deux sortes de cartes, jamais les deux à la fois, pas de jeton visible sans total (5 000 cartes)", () => {
  const JEUX_MELANGE = [
    [MELANGE, 2024, 3000],
    [{ repeat:3, noTotal:true }, 7, 1000],
    [{ ...MELANGE, clues:"SYMBOL", mul:false, sub:false }, 11, 1000]
  ];
  let total = 0;
  for(const [r, g, n] of JEUX_MELANGE){
    const reg = { splats:"2", deltaMax:20, visibleMin:0, visibleMax:3, totalMin:20, totalMax:100, mul:true, div:true, add:true, sub:true, ...r };
    const { cartes } = tirer(r, g, n);
    let nSans = 0, nRep = 0;
    for(const c of cartes){
      total++;
      const R = c._rel;
      assert.ok(R && R.schemaKind !== "error", "jamais une carte « Erreur »");
      assert.ok(!(R.sansTotal && R.repetees), "une carte n'est jamais à la fois sans total et à taches répétées");
      assert.ok(R.sansTotal || R.repetees, "chaque carte est de l'une des deux sortes");
      if(R.sansTotal){
        nSans++;
        assert.equal(c.hidden.length, 2, "sans total : 2 taches");
        assert.equal(c._num.tasks, 2);
        assert.deepEqual(c.visible, [], "sans total : aucun jeton visible");
        assert.equal(R.visibleSum, 0);
        assert.equal(R.relations.length, 2, "un rapport et un écart");
        const ops = R.relations.map(x => x.op);
        assert.ok(["MUL", "DIV"].includes(ops[0]) && ["ADD", "SUB"].includes(ops[1]));
        if(!reg.mul) assert.notEqual(ops[0], "MUL", "rapport parmi les opérations cochées");
        if(!reg.div) assert.notEqual(ops[0], "DIV", "rapport parmi les opérations cochées");
        if(!reg.add) assert.notEqual(ops[1], "ADD", "écart parmi les opérations cochées");
        if(!reg.sub) assert.notEqual(ops[1], "SUB", "écart parmi les opérations cochées");
        assert.ok(R.relations[1].k <= reg.deltaMax, "écart max respecté");
        assert.ok(c.total >= reg.totalMin && c.total <= reg.totalMax, "total (caché) dans les bornes");
        assert.ok(![...c.hidden, c.total, R.relations[1].k].some(sousEntendu), "aucun nombre à sous-entendu");
      }else{
        nRep++;
        assert.ok(Math.max(...R.repetees.nombre) >= 2, "au moins une couleur répétée");
        assert.equal(R.repetees.nombre.length, Number(reg.splats), "le réglage Taches s'applique aux cartes répétées");
        assert.ok(c.visible.length >= reg.visibleMin && c.visible.length <= reg.visibleMax, "jetons visibles dans les bornes");
        assert.ok(c.total >= reg.totalMin && c.total <= reg.totalMax, "total dans les bornes");
        assert.ok(!("sansTotal" in R), "une carte répétée ne porte pas la marque sans total");
      }
    }
    assert.ok(nSans > n * 0.4 && nSans < n * 0.6, `à peu près une carte sur deux sans total (${nSans}/${n})`);
    assert.ok(nRep > n * 0.4, `les cartes à taches répétées sont là (${nRep}/${n})`);
  }
  assert.equal(total, 5000);
});

test("les deux cochées : un seul tirage de plus par carte, fait en premier (une même graine rejoue la même série)", () => {
  assert.equal(empreinte(tirer(MELANGE, 24, 40)), empreinte(tirer(MELANGE, 24, 40)), "même graine, mêmes cartes");
  const g = fn("genInvestigate");
  const ligneSorte = "const sansTotal = (sansTotalCoche && repeteesCoche) ? (rng() < 0.5) : sansTotalCoche;";
  const iSorte = g.indexOf(ligneSorte);
  assert.ok(iSorte > 0, "le tirage de la sorte");
  assert.ok(iSorte < g.indexOf("buildInvestigateColorMap("), "avant tout autre tirage de la carte");
  assert.equal((g.match(/\? \(rng\(\) < 0\.5\) :/g) || []).length, 1, "un seul tirage de plus");
});

test("adresse : noTotal=1&repeat=3 se lit et se réécrit ; une seule case : les adresses d'avant", () => {
  // on relit l'adresse puis on la réécrit, avec les vraies fonctions de la page
  const faux = (checked = false) => ({ type:"checkbox", checked, value:"" });
  const page = new Function("etat", `
    const activityEl = { value:"C" };
    const invNoTotalEl = etat.noTotal, invRepeatOnEl = etat.repeatOn, invRepeatEl = etat.repeat;
    /* lot G2 : les réglages du générateur (absents ici : une page d'avant, rien n'est écrit) */
    const invOrdreEl = null, invVocabEl = null, invComposeEl = null, invReuniesEl = null, invTaskCountEl = { value:"2" };
    ${fn("setSelectFromShare")}
    const INVESTIGATE_REPEAT_MAX = 3;
    ${ligne("function clamp(")}
    ${fn("readBooleanFromShare")}
    ${fn("lireRepetitionAdresse")}
    return {
      lire(q){
        const params = new URLSearchParams(q), act = "C";
        ${(() => { const a = fn("appliquerConfiguration"); const i = a.indexOf('  /* « noTotal=1 »'); return a.slice(i, a.indexOf("\n  const seedRaw", i)); })()}
      },
      ecrire(){
        const params = new URLSearchParams(), act = "C";
        ${(() => { const b = fn("buildShareUrl"); const i = b.indexOf('  /* écrite seulement quand elle est cochée'); return b.slice(i, b.indexOf("\n  url.search", i)); })()}
        return params.toString();
      }
    };`);
  const etat = { noTotal:faux(), repeatOn:faux(), repeat:{ value:"3" } };
  const p = page(etat);
  p.lire("noTotal=1&repeat=3");
  assert.equal(etat.noTotal.checked, true);
  assert.equal(etat.repeatOn.checked, true);
  assert.equal(p.ecrire(), "noTotal=1&repeat=3", "les deux cochées : l'adresse se relit et se réécrit à l'identique");
  p.lire("repeat=3");
  assert.equal(p.ecrire(), "repeat=3", "fiches 20 et 21 : adresse inchangée");
  p.lire("noTotal=1");
  assert.equal(p.ecrire(), "noTotal=1", "fiches 22 et 23 : adresse inchangée");
  p.lire("");
  assert.equal(p.ecrire(), "", "fiches 10 à 19 : rien d'écrit");
  const noms = JSON.parse(ligne("const sharedNames = ").replace(/^.*= /, "").replace(/;$/, ""));
  assert.ok(noms.includes("noTotal") && noms.includes("repeat") && !noms.includes("melange"), "aucun paramètre nouveau");
});

test("panneau : aucune case en plus ; les deux cases ne se grisent plus l'une l'autre ; les réglages des cartes répétées restent actifs", () => {
  assert.doesNotMatch(html, /id="invMelange/, "pas de case en plus");
  assert.doesNotMatch(html, /id="invNoTotal" checked|id="invRepeatOn" checked/, "éteintes par défaut");
  assert.match(html, /Cochée avec «&nbsp;Taches répétées&nbsp;» : les deux sortes de cartes se mélangent\."><input type="checkbox" id="invNoTotal">/);
  assert.match(html, /Cochée avec «&nbsp;Sans total&nbsp;» : les deux sortes de cartes se mélangent\."><input type="checkbox" id="invRepeatOn">/);
  const sync = fn("syncSettingsUI");
  assert.doesNotMatch(sync, /invRepeatOnEl\.disabled|invNoTotalEl\.disabled/);
  assert.match(sync, /\[invTaskCountEl, invStructure3El, invVisibleMinEl, invVisibleMaxEl\]\.forEach\(c => \{ if\(c\) c\.disabled = sansTotal && !repetees; \}\);/);
  // on exécute la vraie règle de grisage
  const griser = (sansTotal, repetees) => new Function("sansTotal", "repetees", "const c = { disabled:null }; " +
    sync.match(/\[invTaskCountEl[^\n]*/)[0].replace(/\[invTaskCountEl, invStructure3El, invVisibleMinEl, invVisibleMaxEl\]/, "[c]") + " return c.disabled;")(sansTotal, repetees);
  assert.equal(griser(true, false), true, "sans total seule : Taches, Structure, Visibles grisés (comme avant)");
  assert.equal(griser(true, true), false, "les deux : ils servent aux cartes répétées");
  assert.equal(griser(false, true), false);
  assert.equal(griser(false, false), false);
});

test("consigne imprimée : la règle des taches répétées s'écrit dès qu'UNE carte de la page en a", () => {
  const consigne = new Function("activityEl", `${ligne("const ENQUETE_REGLE_REPETEES = ")}\nfunction classicPrintTaskCount(){ return 2; }\n${fn("getClassicPrintInstruction")}\nreturn getClassicPrintInstruction;`)({ value:"C" });
  const { cartes } = tirer(MELANGE, 2024, 60);
  const sans = cartes.filter(c => c._rel.sansTotal), rep = cartes.filter(c => c._rel.repetees);
  const regle = "Les taches de même couleur cachent le même nombre de jetons.";
  assert.equal(consigne([sans[0], sans[1], rep[0], sans[2]]).note, regle, "une carte répétée sur quatre : la règle");
  assert.equal(consigne([rep[0], rep[1], sans[0], sans[1]]).note, regle);
  assert.equal(consigne([sans[0], sans[1], sans[2], sans[3]]).note, "", "que des cartes sans total : pas de règle");
});
