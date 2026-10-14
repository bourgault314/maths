/* SPLAT! — le Système (mode D), lot M4-8 « le corrigé en équations » (14/10/2026).
   L'idée de Gwenaël : « un corrigé que en mode équation, sans les tableaux, très propre, pour que
   ce soit explicite ». Décidé sur planches, par questions à choix :
     - les équations seules, étape par étape, dans un 3e corrigé du livret 2 (cycle 4) ;
     - sans le dessin de la carte : la carte commence par le système (« Les deux plateaux ») ;
     - « En équations » en 3e ligne sur la page des livrets ; dans la vue prof, « Corrigé ·
       taches | lettres | équations » pour les fiches 25d à 28d ; pas pour le livret 1.
     - « vers la seconde » (planches 5 et 6) : les systèmes avec leur accolade ; « Je recopie »
       écrit la distributivité, puis le nouveau système ; un plateau retrouvé s'écrit d'abord par
       son contenu entre parenthèses ; « J'additionne » écrit la somme puis la range.
   L'outil : réglage corrige=equations de l'impression (2 et 4 par page). Chaque étape du plan
   garde son titre et donne ses équations, écrites à partir de ses cases (sysEquationsMorceaux) :
   rien n'est recalculé. Ici, chaque équation de milliers de cartes de tous les types est refaite
   par le calcul, et chaque réécriture (parenthèses, distributivité, somme) est vérifiée comme
   une égalité de polynômes.
   Et la correction du lien « ◀ Carte des mondes » des fiches bonus du monde 4 (#sys-bonus).
   Les fonctions de outils/splat.html sont extraites du fichier et exécutées telles quelles. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { inflateSync } from "node:zlib";
import test from "node:test";

const html = await readFile(new URL("../outils/splat.html", import.meta.url), "utf8");
const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));

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
  "SYS_COULEURS_PLURIEL", "SYS_PLAGES", "SYS_2P", "SYS_CORR_IMPRIME", "SYS_CORR_IMPRIME_2P", "SYS_EQ"].map(constante).join("\n");
const FONCTIONS = ["sysNormaliserReglages", "genSystemCarte", "sysMelangerPlateaux", "sysFormes", "sysFormesDouble", "sysSomme", "sysNombreTaches", "sysPlateau",
  "sysTirerSituation", "sysSituationValide", "sysNombreSousEntendu", "sysTexteASousEntendu", "sysSituationSure", "sysAssemblerCarte", "sysTypeCarte",
  "sysUneTacheParCouleur", "sysIndice", "sysPhraseIndice", "sysPlanS3", "sysPlan", "sysBlocs", "sysLargeurTexte", "wrapTextToWidth",
  "sysEquationGauche", "sysEquationBarre", "sysEqPoly", "sysEqMemes", "sysEqContenu", "sysEqReste", "sysEqRange", "sysEquationsMorceaux", "sysEquationsMesure", "sysEquationsReponses", "sysEquationsFlux", "drawSysCorrectionEquations"].map(fn).join("\n");

/* la largeur des textes : 0,66 corps par signe — plus large que le DejaVu Sans gras des livrets
   (≈ 0,6) : une carte qui tient ici tient à l'impression */
const sys = new Function(`
  ${PALETTE}
  ${ligne("const INVESTIGATE_CLASSIC_COLOR_KEYS = ")}
  ${fn("investigateColorByKey")}
  ${fn("investigateColorWord")}
  ${ligne("const INVESTIGATE_COLOR_INITIALS = ")}
  ${fn("investigateColorInitial")}
  let investigatePaletteKeys = null;
  ${ligne("let sysEqCorpsPlafond = ")}
  function measureTextWidth(str, font){
    const fs = Number((String(font).match(/(\\d+(?:\\.\\d+)?)px/) || [])[1]) || 16;
    return String(str == null ? "" : str).length * fs * 0.66;
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
  return {
    E: SYS_EQ, Z2: SYS_CORR_IMPRIME_2P, Z4: SYS_CORR_IMPRIME, W2: SYS_2P.wCorrection,
    eq: sysEquationBarre, morceaux: sysEquationsMorceaux, plan: sysPlan, initiale: (k) => investigateColorInitial(investigateColorByKey(k)),
    serie(graine, n, reglages){
      const rng = mulberry32(graine);
      const out = [];
      for(let i = 0; i < n; i++) out.push(genSystemCarte(rng, reglages));
      return out;
    },
    // la carte en équations, telle que l'outil la dessine (2 ou 4 par page) ; plafond : le corps
    // le plus grand permis (le même corps sur une page, sysEquationsPage), deux : deux colonnes
    dessin(card, deux, plafond, colonnes){
      const Z = deux ? SYS_CORR_IMPRIME_2P : SYS_CORR_IMPRIME, bas = deux ? SYS_CORR_IMPRIME_2P.bas : SYS_CORR_IMPRIME.basImprime;
      sysEqCorpsPlafond = plafond || null; sysEqDeuxColonnes = !!colonnes;
      try{
        const racine = mkEl("svg");
        const fin = drawSysCorrectionEquations(racine, card, SYS_EQ.haut, bas, { mkEl, mkText, isPrint:true, lettres:true }, Z);
        return { racine, fin, g: racine.children.find((c) => c.attrs.id === "sysCorrectionPrint") };
      }finally{ sysEqCorpsPlafond = null; sysEqDeuxColonnes = false; }
    }
  };
`)();

/* une expression des équations, lue comme un polynôme en lettres : « 2 × (N + 3 × B) »,
   « (2 × N + B) + 5 × B », « 116 − 46 », « 70 ÷ 5 ». { "": constante, N: coefficient… } */
function polynome(expr){
  const t = expr.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
  let i = 0;
  const somme = (a, b, k = 1) => { const r = { ...a }; for(const x in b) r[x] = (r[x] || 0) + k * b[x]; return r; };
  const fois = (a, b) => {
    const ka = Object.keys(a).filter((x) => x && a[x]), kb = Object.keys(b).filter((x) => x && b[x]);
    assert.ok(!(ka.length && kb.length), `${expr} : deux lettres multipliées`);
    const [p, c] = ka.length ? [a, b[""] || 0] : [b, a[""] || 0];
    const r = {}; for(const x in p) r[x] = p[x] * c; return r;
  };
  const facteur = () => {
    const x = t[i++];
    if(x === "("){ const v = expr2(); assert.equal(t[i++], ")", expr); return v; }
    if(/^\d+$/.test(x)) return { "": Number(x) };
    assert.match(x, /^[A-Z][a-z]?$/, `${expr} : « ${x} »`);
    return { [x]: 1 };
  };
  const terme = () => {
    let v = facteur();
    while(t[i] === "×" || t[i] === "÷"){
      const op = t[i++], w = facteur();
      if(op === "×") v = fois(v, w);
      else{
        assert.ok(Object.keys(w).every((x) => !x), `${expr} : division par une lettre`);
        const r = {}; for(const x in v){ r[x] = v[x] / w[""]; assert.ok(Number.isInteger(r[x]), `${expr} : une division qui ne tombe pas juste`); }
        v = r;
      }
    }
    return v;
  };
  const expr2 = () => {
    let v = terme();
    while(t[i] === "+" || t[i] === "−"){ const op = t[i++]; v = somme(v, terme(), op === "+" ? 1 : -1); }
    return v;
  };
  const v = expr2();
  assert.equal(i, t.length, `${expr} : lu jusqu'au bout`);
  return v;
}
const memes = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].every((x) => (a[x] || 0) === (b[x] || 0));
const valeur = (p, valeurs) => Object.keys(p).reduce((s, x) => s + p[x] * (x ? valeurs[x] : 1), 0);
function calcule(expr, valeurs){
  const p = polynome(expr);
  for(const x in p) if(x) assert.ok(Number.isFinite(valeurs[x]), `« ${x} » inconnu dans « ${expr} »`);
  return valeur(p, valeurs);
}
/* une équation juste : tous ses membres valent la même chose, le dernier est un nombre */
function verifie(eqn, valeurs, ou){
  const membres = eqn.replace(/ ✓$/, "").split(" = ");
  assert.ok(membres.length >= 2, `${ou} : « ${eqn} »`);
  // le dernier membre : un nombre, ou un calcul sans lettre (« 81 + 79 », puis la ligne suivante le range)
  assert.match(membres[membres.length - 1], /^\d+(?: [+−×÷] \d+)*$/, `${ou} : « ${eqn} » finit par un nombre`);
  const v = membres.map((m) => calcule(m, valeurs));
  assert.ok(v.every((x) => x === v[0]), `${ou} : « ${eqn} » est fausse (${v.join(", ")})`);
}

const V0 = { visMin: 0, visMax: 0 }, T1 = { totalMin: 20, totalMax: 60 }, T2 = { totalMin: 50, totalMax: 100 };
/* tous les types de cartes : chaque geste, ses variantes, avec et sans jetons visibles */
const TOUS = [
  ["PARTIELLE", { geste: "PARTIELLE" }], ["COEF", { geste: "COEF" }], ["COEF écart 2", { geste: "COEF", ecart: "2" }],
  ["DOUBLE 2", { geste: "DOUBLE", fois: 2 }], ["DOUBLE 3", { geste: "DOUBLE", fois: 3 }], ["DOUBLE indice", { geste: "DOUBLE", sens: "INDICE", indice: "12" }],
  ["DOUBLE MIX", { geste: "DOUBLE", sens: "MIX" }], ["MIROIR", { geste: "MIROIR", forme: "MIX" }], ["TROIS", { geste: "TROIS" }],
  ["ESCALIER", { geste: "ESCALIER" }], ["EMBOITE1", { geste: "EMBOITE1" }],
  ["RECOPIE 2", { geste: "RECOPIE", fois: 2 }], ["RECOPIE 3", { geste: "RECOPIE", fois: 3 }], ["RECOPIE 4", { geste: "RECOPIE", fois: 4 }],
  ["ETAGES", { geste: "ETAGES" }], ["ETAGES miroir", { geste: "ETAGES", sous: "MIROIR" }], ["ETAGES recopie", { geste: "ETAGES", sous: "RECOPIE" }],
  ["ETAGES double", { geste: "ETAGES", sous: "DOUBLE", indice: "12", sens: "INDICE" }], ["ETAGES coef", { geste: "ETAGES", sous: "COEF" }]
];
/* les réglages du livret 2 (fiches 25d à 28d, sans leur graine) et ses séries 10, 11, 12, 14 */
const LIVRET_2 = [
  ["25d", { geste: "RECOPIE", fois: 2, ordre: "MELANGE", ...V0, ...T2 }],
  ["26d", { geste: "RECOPIE", fois: "MIX", ordre: "MELANGE", ...V0, ...T2 }],
  ["27d", { geste: "ETAGES", fois: 2, indice: "12", sens: "INDICE", ...V0, ...T2 }],
  ["28d", { geste: "MIX", gestes: ["EMBOITE1", "TROIS", "RECOPIE", "ETAGES"], fois: 3, sous: "MIROIR", ordre: "MELANGE", visMin: 1, visMax: 3, ...T2 }],
  ["série 12", { geste: "MIX", gestes: ["EMBOITE1", "PARTIELLE", "COEF", "DOUBLE", "MIROIR", "TROIS", "ESCALIER", "RECOPIE", "ETAGES"], sens: "MIX", forme: "MIX", fois: "MIX", ordre: "MELANGE", visMin: 1, visMax: 3, ...T2 }],
  ["série 14", { geste: "MIX", gestes: ["RECOPIE", "ETAGES"], fois: 4, sous: "DOUBLE", indice: "12", sens: "INDICE", ordre: "MELANGE", ...V0, ...T2 }]
];

test("l'exemple du livret 2, étape par étape : les équations de la maquette validée", () => {
  const sit = { geste: "RECOPIE", colors: ["black", "blue"], values: { black: 16, blue: 14 },
    boards: [{ counts: { black: 1, blue: 3 }, total: 58 }, { counts: { black: 2, blue: 1 }, total: 46 }] };
  const m = sys.morceaux(sys.plan(sit));
  assert.deepEqual(m.map((x) => [x.titre, x.lignes, x.accolades]), [
    ["Les deux plateaux", ["N + 3 × B = 58", "2 × N + B = 46"], [[0, 1]]],
    ["Je recopie 2 fois le plateau 58", ["2 × (N + 3 × B) = 2 × 58", "2 × N + 6 × B = 116", "2 × N + B = 46"], [[1, 2]]],
    ["Je retrouve le plateau 46 dedans", ["(2 × N + B) + 5 × B = 116", "46 + 5 × B = 116"], []],
    ["Je retire", ["5 × B = 116 − 46 = 70"], []],
    ["Je partage", ["B = 70 ÷ 5 = 14"], []],
    ["Je remplace", ["N + 3 × 14 = 58"], []],
    ["Je retire", ["N = 58 − 14 − 14 − 14 = 16"], []],
    ["Je vérifie", ["16 + 3 × 14 = 58 ✓", "2 × 16 + 14 = 46 ✓"], []]
  ]);
  // j'additionne : la somme des deux équations, puis rangée par paires (miroir 3-2)
  const mir = sys.morceaux(sys.plan({ geste: "MIROIR", colors: ["green", "orange"], values: { green: 17, orange: 15 },
    boards: [{ counts: { green: 3, orange: 2 }, total: 81 }, { counts: { green: 2, orange: 3 }, total: 79 }] }));
  assert.deepEqual(mir.find((x) => x.titre.startsWith("J’additionne")).lignes, ["(3 × Ve + 2 × O) + (2 × Ve + 3 × O) = 81 + 79", "5 × (Ve + O) = 160"]);
  assert.deepEqual(mir.find((x) => x.titre.startsWith("Je retrouve")).lignes, ["(Ve + O) + (Ve + O) + Ve = 81", "32 + 32 + Ve = 81"]);
  // la réponse encadrée, en mots, comme la ligne réponse de l'énoncé
  assert.deepEqual(m[m.length - 1].reponses, ["noire = 16", "bleue = 14"]);
  // un jeton visible et un plateau retrouvé s'écrivent par leur nombre, l'un après l'autre
  assert.equal(sys.eq({ top: "44", calcul: "", cells: [{ kind: "block", value: 30, covers: 3 }, { kind: "unknown", color: "green" }, { kind: "unknown", color: "green" }, { kind: "visible", value: 2 }, { kind: "visible", value: 2 }] }),
    "30 + 2 × Ve + 2 + 2 = 44");
  assert.equal(sys.eq({ top: "?", calcul: "", cells: [{ kind: "unknown", color: "black" }] }), null, "un plateau sans total n'a pas d'équation");
});

test("toutes les équations sont justes, refaites par le calcul — des milliers de cartes de tous les types", () => {
  let n = 0, cartes = 0, reecrites = 0;
  for(const [nom, r] of TOUS) for(const T of [T1, T2]) for(const vis of [V0, { visMin: 1, visMax: 3 }])
    for(const card of [1, 2, 3, 4, 5].flatMap((g) => sys.serie(g, 12, { ...r, ...T, ...vis }))){
      cartes++;
      const S = card._sys, valeurs = {};
      S.colors.forEach((k) => { valeurs[sys.initiale(k)] = S.values[k]; });
      const lettres = new Set(Object.keys(valeurs));
      assert.equal(lettres.size, S.colors.length, `${nom} : une initiale par couleur`);
      const m = sys.morceaux(S.plan);
      assert.equal(m.length, S.plan.length, nom);
      const ecrites = [];   // les équations déjà écrites : [polynôme de gauche, dernier membre]
      m.forEach((x, i) => {
        const e = S.plan[i], ou = `${nom}, ${e.titre}`;
        assert.equal(x.titre, e.titre, nom);
        // chaque barre a son équation : son total est le dernier membre d'une ligne de l'étape
        const derniers = x.lignes.map((l) => l.replace(/ ✓$/, "").split(" = ").at(-1));
        if(e.role !== "verification") e.barres.filter((b) => String(b.top) !== "?").forEach((b) => assert.ok(derniers.includes(String(b.top)), `${ou} : le total ${b.top}`));
        // les plateaux s'écrivent en système (accolade dès deux équations)
        if(e.role === "plateaux") assert.deepEqual(x.accolades, e.barres.length > 1 ? [[0, e.barres.length - 1]] : [], ou);
        x.lignes.forEach((l, k) => {
          verifie(l, valeurs, ou);
          n++;
          const membres = l.replace(/ ✓$/, "").split(" = ");
          const gauche = polynome(membres[0]);
          // une réécriture (parenthèses, distributivité, somme) est une vraie égalité de polynômes :
          // avec la ligne qui suit, ou avec une équation déjà écrite qui a le même total
          if(l.includes("(")){
            reecrites++;
            const suivante = x.lignes[k + 1] && polynome(x.lignes[k + 1].split(" = ")[0]);
            const precedente = k > 0 && polynome(x.lignes[k - 1].split(" = ")[0]);
            // rangée (« 5 × (Ve + O) ») : la ligne d'avant, mise en facteur
            if(!(precedente && memes(gauche, precedente))){
              assert.ok((suivante && memes(gauche, suivante)) || ecrites.some(([p, d]) => d === membres.at(-1) && memes(p, gauche)), `${ou} : « ${l} » ne réécrit rien de connu`);
              // ce qui est entre parenthèses est un plateau (ou une paire) déjà écrit
              for(const g of membres[0].match(/\(([^()]+)\)/g) || [])
                assert.ok(ecrites.some(([p]) => memes(p, polynome(g))), `${ou} : « ${g} » n'est pas une équation déjà écrite`);
            }
          }
          ecrites.push([gauche, membres.at(-1)]);
          // en lettres, « 3 × N », jamais « 3N » ni « 1 × N » ; seulement les lettres de la carte
          assert.doesNotMatch(l, /\b\d+(?:N|B|Ve|O|R|Vi)\b|(?:^|[^\d])1 × /, `${ou} : « ${l} »`);
          for(const mot of l.match(/[A-Za-z]+/g) || []) assert.ok(lettres.has(mot), `${ou} : « ${mot} » n'est pas une lettre de la carte`);
        });
      });
      assert.deepEqual(m[m.length - 1].reponses, S.colors.map((k) => `${{ black: "noire", blue: "bleue", green: "verte", orange: "orange", red: "rouge", purple: "violette" }[k] || "?"} = ${S.values[k]}`));
    }
  console.log(`# ${cartes} cartes, ${n} équations, ${reecrites} réécritures`);
  assert.ok(cartes >= 4000 && n > 30000 && reecrites > 3000, `${cartes} cartes, ${n} équations, ${reecrites} réécritures`);
});

test("aux réglages du livret 2 : jamais de carte réduite, au corps 42 au moins, en 2 et 4 par page", () => {
  for(const [nom, r] of LIVRET_2) for(const card of [1, 2, 3, 4, 5, 6, 7, 8].flatMap((g) => sys.serie(g, 12, r))){
    for(const deux of [true, false]){
      const { g, fin } = sys.dessin(card, deux);
      assert.equal(g.attrs["data-equations"], "1");
      assert.equal(g.attrs["data-echelle"], "1", `${nom} (${deux ? 2 : 4} par page) : carte réduite`);
      assert.ok(Number(g.attrs["data-corps"]) >= 42, `${nom} : corps ${g.attrs["data-corps"]}`);
      assert.ok(fin <= (deux ? sys.Z2.bas : sys.Z4.basImprime) + 0.5, `${nom} : dans la carte`);
      // tout dans la largeur de la carte
      const xMax = deux ? sys.Z2.xMax : sys.Z4.xMax;
      for(const gm of g.children) for(const c of gm.children.filter((c) => c.name === "text" || c.name === "rect")){
        const droite = c.name === "text" ? Number(c.attrs.x) + c.text.length * Number(c.attrs["font-size"]) * 0.66 : Number(c.attrs.x) + Number(c.attrs.width);
        assert.ok(droite <= xMax + 1, `${nom} : « ${c.text || c.name} » sort de la carte`);
      }
    }
  }
});

test("la carte en équations : titres en brun, équations à l'encre, la réponse encadrée ; une ou deux colonnes ; un même corps sur la page", () => {
  const [card] = sys.serie(394968, 1, LIVRET_2[2][1]);
  const { g } = sys.dessin(card, true);
  const textes = g.children.flatMap((gm) => gm.children.filter((c) => c.name === "text"));
  const titres = textes.filter((t) => t.attrs.fill === sys.E.couleurTitre), eqs = textes.filter((t) => t.attrs.class === "sysEquation");
  assert.deepEqual(titres.map((t) => t.text), card._sys.plan.map((e) => e.titre));
  assert.ok(eqs.length > card._sys.plan.length && eqs.every((t) => t.attrs.fill === sys.E.encre));
  // la couleur des titres reste lisible en noir et blanc (un brun foncé, pas un orange clair)
  assert.equal(sys.E.couleurTitre, "#7c2d12");
  // l'accolade du petit système (« Les deux petits plateaux ») : un tracé, ses lignes décalées à sa droite
  const petits = g.children[card._sys.plan.findIndex((e) => e.titre === "Les deux petits plateaux")];
  const acc = petits.children.filter((c) => c.name === "path" && c.attrs.class === "sysAccolade");
  assert.equal(acc.length, 1);
  const xs2 = petits.children.filter((c) => c.attrs.class === "sysEquation").map((t) => Number(t.attrs.x));
  const fs = Number(g.attrs["data-corps"]);
  assert.ok(xs2.length === 2 && xs2.every((x) => Math.abs(x - (sys.Z2.x + sys.E.retrait + sys.E.accolade * fs)) < 0.01), "les lignes du système à droite de l'accolade");
  assert.equal(g.children[0].children.filter((c) => c.name === "path").length, 0, "« Le grand plateau » : une seule équation, pas d'accolade");
  const verif = g.children[g.children.length - 1];
  assert.equal(verif.attrs.class, "sysEquations sysVerification");
  assert.equal(verif.children.filter((c) => c.name === "rect" && c.attrs.class === "sysReponses").length, 1, "la réponse encadrée");
  // un plafond (le corps de la carte voisine) et deux colonnes (sysEquationsPage) sont suivis
  const p = sys.dessin(card, true, 40, true).g;
  assert.equal(p.attrs["data-corps"], "40");
  assert.equal(p.attrs["data-colonnes"], "2");
  // deux colonnes : la coupure tombe au début d'une idée (après une tache trouvée…)
  const xs = [...new Set(p.children.map((gm) => gm.children[0].attrs.x))];
  assert.equal(xs.length, 2);
  // au corps le plus petit, une carte trop longue est réduite plutôt que de sortir (filet)
  const long = { _sys: { plan: Array.from({ length: 40 }, (_, i) => ({ role: "retire", titre: "Je retire", barres: [{ top: "5", calcul: "8 − 3", cells: [{ kind: "unknown", color: "black" }] }] })).concat([card._sys.plan.at(-1)]) } };
  const r = sys.dessin(long, true).g;
  assert.ok(Number(r.attrs["data-echelle"]) < 1);
  assert.match(r.attrs.transform, /scale\(/);
});

test("l'outil : corrige=equations lu et réécrit, hors de l'empreinte ; les équations seules en 2 et 4 par page ; un corps par page", () => {
  assert.match(html, /let printCorrigeEquations = false;/);
  assert.match(html, /printCorrigeEquations = String\(params\.get\("corrige"\) \|\| ""\)\.toLowerCase\(\) === "equations";/);
  assert.match(html, /if\(printCorrigeEquations\) params\.set\("corrige", "equations"\);/);
  assert.match(html, /const sharedNames = \[[^\]]*"suite", "corrige"\];/);
  assert.match(html, /const ELEVE_HORS_EMPREINTE = \[[^\]]*"corrige"[^\]]*\];/);
  // 2 par page : les équations à la place de l'énoncé et des blocs
  assert.match(html, /if\(printCorrigeEquations && sysAPlan\(card\)\)\{\n\s*drawSysCorrectionEquations\(targetSvg, card, SYS_EQ\.haut, SYS_CORR_IMPRIME_2P\.bas, ctx, SYS_CORR_IMPRIME_2P\);\n\s*return;\n\s*\}\n\s*const entete = drawSysPlateaux/);
  // 4 par page
  assert.match(html, /if\(printCorrigeEquations\)\{\n\s*drawSysCorrectionEquations\(targetSvg, card, SYS_EQ\.haut, SYS_CORR_IMPRIME\.basImprime, ctx, SYS_CORR_IMPRIME\);\n\s*return;\n\s*\}/);
  // sans le réglage, rien ne change : les blocs (2 par page) et les barres (4 par page)
  assert.match(html, /if\(sysAPlan\(card\)\) drawSysCorrectionBlocs\(targetSvg, card, haut, SYS_CORR_IMPRIME_2P\.bas, ctx\);/);
  assert.match(html, /\n    drawSysCorrectionImprimee\(targetSvg, card, haut, SYS_CORR_IMPRIME\.basImprime, ctx\);\n    return;/);
  // printSheet : les cartes d'une page au même corps
  assert.match(html, /if\(printCorrigeEquations && mode === "correction"\) sysEquationsPage\(rendus\);/);
  assert.match(fn("sysEquationsPage"), /sysEqCorpsPlafond = Math\.min\(\.\.\.corps\);/);
  assert.match(fn("sysEquationsPage"), /finally\{ sysEqCorpsPlafond = null; sysEqDeuxColonnes = false; \}/);
  assert.equal((html.match(/drawSysCorrectionEquations\(/g) || []).length, 3, "la fonction et ses deux appels");
});

// ------------------------------------------------------------ les livrets, la page, la vue prof
const render = lire("_sources/livret-splat-systeme/render.py");
test("render.py : un 3e corrigé « en équations », pour le livret 2 seulement", () => {
  assert.match(render, /dict\(suffixe="_correction_equations", lettre=True, equations=True, dit="en équations", livrets=\("tour2",\)\),/);
  assert.match(render, /for corr in \[c for c in versions if c is None or nom in c\.get\("livrets", LIVRETS\)\]:/);
  assert.equal((render.match(/\+ \("&corrige=equations" if equations else ""\)/g) || []).length, 2, "les fiches et le défi");
  assert.match(render, /if equations and not all\(etat\["equations"\]\):/);
  assert.match(render, /permis = \{\} if equations else REDUITE_PERMISE\.get\(f\["code"\], \{\}\)/);
  assert.match(render, /dx, da = \(ex\["eq"\], ax\["eq"\]\) if equations else \(ex\["tout"\], ax\["tout"\]\)/);
  for (const s of ["livret_splat_systeme_tour2_correction_equations", "livret_splat_systeme_tour2_correction_equations_a_plier"])
    assert.ok(existe(`outils/${s}.pdf`), s);
  for (const s of ["livret_splat_systeme_correction_equations", "livret_splat_systeme_correction_equations_a_plier"])
    assert.ok(!existe(`outils/${s}.pdf`), `${s} : pas pour le livret 1`);
});

function flux(p){
  const b = readFileSync(new URL(`../${p}`, import.meta.url));
  const out = [];
  let i = 0;
  while((i = b.indexOf("stream", i)) >= 0){
    let s = i + 6;
    if(b[s] === 13) s++;
    if(b[s] === 10) s++;
    const e = b.indexOf("endstream", s);
    if(e < 0) break;
    try{ out.push(inflateSync(b.subarray(s, e)).toString("latin1")); }catch{ /* non compressé */ }
    i = e + 9;
  }
  return { brut: b.toString("latin1"), flux: out };
}
function texteDesPages(p){
  const { flux: f } = flux(p);
  const tables = [];
  for(const s of f){
    if(!s.includes("begincmap")) continue;
    const t = new Map();
    for(const bloc of s.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for(const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
        t.set(m[1].toLowerCase(), String.fromCodePoint(...(m[2].match(/.{4}/g) || []).map((h) => parseInt(h, 16))));
    for(const bloc of s.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for(const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)){
        const a = parseInt(m[1], 16), z = parseInt(m[2], 16), c = parseInt(m[3], 16);
        for(let k = a; k <= z && k - a < 1024; k++) t.set(k.toString(16).padStart(4, "0"), String.fromCodePoint(c + (k - a)));
      }
    if(t.size) tables.push(t);
  }
  const out = [];
  for(const s of f){
    if(!s.includes(" Tj")) continue;
    const bornes = [...s.matchAll(/\/F\d+\s+[\d.]+\s+Tf/g)].map((m) => m.index);
    bornes.push(s.length);
    let texte = "";
    for(let k = 0; k < bornes.length - 1; k++){
      const codes = [...s.slice(bornes[k], bornes[k + 1]).matchAll(/<([0-9a-fA-F]{4})>\s*Tj/g)].map((m) => m[1].toLowerCase());
      if(!codes.length) continue;
      let meilleure = null, score = 0;
      for(const t of tables){
        const n = codes.filter((c) => t.has(c)).length;
        if(n > score){ score = n; meilleure = t; }
      }
      if(meilleure) texte += codes.map((c) => meilleure.get(c) ?? "").join("");
    }
    out.push(texte.replace(/\s+/g, " ").replace(/\uFB01/g, "fi").replace(/\uFB02/g, "fl").replace(/\u00a0/g, " "));
  }
  return out;
}
const souple = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, " ?"));

test("le PDF du corrigé en équations : 12 pages, l'exemple et les fiches en systèmes, sans barres ni TOTAL", () => {
  const t = texteDesPages("outils/livret_splat_systeme_tour2_correction_equations.pdf");
  assert.equal(t.length, 12);
  assert.match(t[0], /Livret corrigé/);
  assert.match(t[0], /en équations/);
  // page 2 : l'exemple, toutes ses équations ; page 3 : « À toi ! » corrigée
  for(const e of ["N + 3 × B = 58", "2 × (N + 3 × B) = 2 × 58", "2 × N + 6 × B = 116", "(2 × N + B) + 5 × B = 116", "46 + 5 × B = 116",
    "5 × B = 116 − 46 = 70", "B = 70 ÷ 5 = 14", "N = 58 − 14 − 14 − 14 = 16"])
    assert.match(t[1], souple(e), `page 2 : ${e}`);
  assert.match(t[2], /La même sorte de carte — corrigée/);
  assert.match(t[2], souple("les équations, étape par étape"));
  // les fiches : deux cartes par page, sans le dessin (pas de TOTAL), « Je vérifie » deux fois
  for(let j = 3; j <= 10; j++){
    assert.match(t[j], / — Correction/, `page ${j + 1}`);
    assert.doesNotMatch(t[j], /TOTAL/, `page ${j + 1} : pas de dessin`);
    assert.equal((t[j].match(/Je vérifie/g) || []).length, 2, `page ${j + 1} : deux cartes`);
    assert.match(t[j], /\d+ × \(?(?:N|B|Ve|O|R|Vi) \+ /, `page ${j + 1} : des équations en lettres`);
    // les fiches 25d, 26d (je recopie) : la distributivité et le plateau retrouvé entre parenthèses
    if(j <= 6) assert.match(t[j], /\d × \([^)]+\) = \d × \d+/, `page ${j + 1} : « 2 × (…) = 2 × … »`);
    if(j <= 6) assert.match(t[j], /\([^)]+\) \+ \d+ × (?:N|B|Ve|O|R|Vi) = \d+/, `page ${j + 1} : « (…) + 5 × B = … »`);
  }
  assert.match(t[11], /LE DÉFI ! — CORRIGÉ/);
  assert.equal((t[11].match(/Je vérifie/g) || []).length, 2, "le défi : ses deux cartes en équations");
});

test("page des livrets : « En équations » en 3e ligne du livret 2 ; vue prof : taches | lettres | équations (cycle 4 seulement)", () => {
  const page = lire("outils/livrets_splat.html");
  const p = page.slice(page.indexOf('<section class="panneau" data-m="4"'), page.indexOf("</section>", page.indexOf('<section class="panneau" data-m="4"')));
  const art = p.split('<article class="liv">').slice(1);
  assert.equal(art.length, 2);
  assert.doesNotMatch(art[0], /quations/, "livret 1 : pas de corrigé en équations");
  assert.ok(art[1].includes("<summary>✅ Les corrigés · lettres, taches ou équations</summary>"));
  const noms = [...art[1].matchAll(/<span class="nom">([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(noms, ["En lettres", "Avec les taches", "En équations"]);
  for(const v of ["_correction_equations", "_correction_equations_a_plier"])
    assert.ok(art[1].includes(`href="/outils/livret_splat_systeme_tour2${v}.pdf"`), v);
  const univers = lire("outils/splat_univers.html");
  assert.match(univers, /f\.cl=enLettres\(f\.c\);\n[^\n]*\n\s*f\.ce=f\.cl\+"&corrige=equations";/);
  assert.match(univers, /if\(e\.c&&e\.cl&&e\.ce\) a\.push\(btnSeg\('corrige','Corrigé',\[\['taches',e\.c\],\['lettres',e\.cl\],\['équations',e\.ce\]\]\)\);/);
  assert.equal((univers.match(/\.ce=/g) || []).length, 1, "seulement les fiches du Bonus cycle 4 (SYS_TOUR2)");
  // au téléphone, un segment à trois choix met « Corrigé » au-dessus (sinon « équations » sort du bouton)
  assert.match(univers, /@media\(max-width:520px\)\{[^}]*\}[\s\S]*?\.seg:has\(>a:nth-of-type\(3\)\)\{flex-wrap:wrap\}/);
  assert.match(univers, /\.seg:has\(>a:nth-of-type\(3\)\)>span\{flex:1 1 100%;justify-content:center;min-height:34px;border-bottom:1px solid #cdd7e3\}/);
});

test("« ◀ Carte des mondes » d'une fiche bonus : le Bonus de SON monde (25d-28d → #sys-bonus, 11d… → #enq-bonus)", () => {
  /* bug vu par Gwenaël le 14/10 : depuis 25d, le lien ramenait au Bonus de l'Enquête (monde 3) */
  const etapes = lire("assets/js/splat-etapes.js");
  const vide = { getItem: () => null, setItem(){}, removeItem(){} };
  const fenetre = { location: { search: "" }, localStorage: vide, sessionStorage: vide };
  new Function("window", etapes)(fenetre);
  const lien = (parcours, module = true) => new Function("window", "parcoursId", "ELEVE_URL_MONDES",
    `${fn("eleveLienMondesHtml")}\nreturn eleveLienMondesHtml("x");`)(module ? fenetre : {}, parcours, "/outils/splat_univers.html");
  const href = (h) => (h.match(/href="([^"]*)"/) || [])[1];
  for(const p of ["sys25d", "sys26d", "sys27d", "sys28d"]) assert.equal(href(lien(p)), "/outils/splat_univers.html#sys-bonus", p);
  for(const p of ["enq11d", "enq19d", "enq24d"]) assert.equal(href(lien(p)), "/outils/splat_univers.html#enq-bonus", p);
  for(const p of ["sys25", "sys28", "enq10"]) assert.equal(href(lien(p)), "/outils/splat_univers.html", `${p} : la carte, sans ancre`);
  assert.equal(href(lien("sys25d", false)), "/outils/splat_univers.html", "sans le module des étapes : la carte");
  assert.equal(lien(""), "", "hors du parcours : pas de lien");
  // l'ancre vient du numéro du monde de la fiche bonus (BONUS de splat-etapes.js), comme « Étape suivante »
  assert.match(fn("eleveLienMondesHtml"), /bonus\[4\] === 4 \? "#sys-bonus" : "#enq-bonus"/);
});
