import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Lot Q2 (24/09/2026) — la progression du monde 5 « SPLAT! Équations » sur la carte
   des mondes : trois étapes = trois fiches de 12 cartes (35, 36, 37), « Écris
   l'équation » (m3e3) retirée, liens Projeter / Fiche tableau / Fiche équation en
   6 par page, et les cartes de la vue professeur qui ouvrent chaque équation seule
   dans ÉquaSplat (demande de Claire, mondes 5 et 6 ; en grille repliée depuis le lot
   « vue prof » du 27/09/2026). On EXÉCUTE les données de
   outils/splat_univers.html, comme tests/splat-enquete-carte-mondes.test.mjs. */

const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const univers = lire("outils/splat_univers.html");
const outil = lire("outils/splat_equations.html");

function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
vm.runInContext(
  bloc("const PS=", "const PROF =") +
  bloc("const NOTES_MONDE", "const main=document") +
  ";globalThis.X={MONDES,NOTES_PROF,EQ5_PREMIERE_FICHE};" +
  "globalThis.eqSeuleLiens=eqSeuleLiens;globalThis.cartesHtml=cartesHtml;globalThis.actionsHtml=actionsHtml;",
  ctx, { filename: "splat_univers.html" }
);
const { MONDES, NOTES_PROF, EQ5_PREMIERE_FICHE } = JSON.parse(JSON.stringify(ctx.X));
const EQUATIONS = MONDES[4], RELATIFS = MONDES[5];
/* les objets du bac à sable gardent leurs fonctions : on appelle eqSeuleLiens sur eux */
const brut = (mi, ei) => ctx.X.MONDES[mi].etapes[ei];

const decode = (b64) => JSON.parse(Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
const donnees = (url) => decode(url.slice(url.indexOf("#data=") + 6));
const params = (url) => new URLSearchParams(url.split("?")[1].split("#")[0]);

/* L'écriture de la liste 📋 (monde 5, nombres positifs, série compactée) : les taches
   d'abord (« 2𝑥 »), puis le nombre de jetons, comme l'outil l'affiche. */
function cote(c, v) {
  const n = c.filter((t) => t === "x").length, nb = c.filter((t) => t !== "x");
  const morceaux = [];
  if (n) morceaux.push((n === 1 ? "" : String(n)) + v);
  nb.forEach((k) => morceaux.push(String(k)));
  return morceaux.join(" + ");
}
const ecrire = (q) => cote(q.left, q.variable) + " = " + cote(q.right, q.variable);

/* Les 36 équations validées par Gwenaël sur la liste annotée du lot Q2 (24/09/2026),
   rendues par l'outil. Une graine ou un réglage qui bouge, ce sont la fiche, les deux
   livrets et la série du jeu à refaire. */
const LISTE_Q2 = {
  /* Relecture du monde 5 (27/09/2026) : la progression en huit marches validée par Gwenaël —
     35 : on enlève (4), on partage (4), les deux (4) ; 36 : paquets, 2-3 taches (6), puis 4-6
     taches (6) ; 37 : jetons d'un seul côté (4), jetons des deux côtés (4), le grand mélange (4).
     Une graine qui bouge, ce sont la fiche, les livrets et la série du jeu à refaire. */
  m3e1: ["𝑏 + 4 = 9", "5 = 𝑐 + 1", "6 = 𝑡 + 4", "𝑛 + 1 = 7", "2𝑥 = 6", "10 = 2𝑎", "8 = 2𝑡", "3𝑚 = 6", "5 = 2𝑏 + 1", "3𝑚 + 3 = 9", "2𝑐 + 1 = 9", "8 = 2𝑛 + 2"],
  m3e2: ["44 = 2𝑚 + 14", "3𝑎 + 38 = 47", "24 = 3𝑐 + 9", "3𝑛 + 37 = 43", "2𝑡 + 20 = 42", "42 = 2𝑐 + 16", "32 = 4𝑏 + 4", "5𝑎 + 6 = 46", "42 = 6𝑥 + 24", "32 = 4𝑡 + 12", "6𝑛 + 11 = 23", "5𝑏 + 3 = 48"],
  m3e4: ["2𝑡 + 24 = 5𝑡", "𝑥 + 17 = 2𝑥", "4𝑛 = 𝑛 + 30", "3𝑐 = 2𝑐 + 15", "5𝑛 + 28 = 4𝑛 + 32", "5𝑥 + 11 = 𝑥 + 39", "𝑡 + 28 = 4𝑡 + 13", "3𝑎 + 40 = 5𝑎 + 34", "36 = 6𝑚", "5𝑏 + 10 = 4𝑏 + 17", "𝑐 + 6 = 40", "35 = 2𝑏 + 15"]
};
/* Les huit marches : dans chacune, la tache finit à gauche sur la moitié des cartes et à droite
   sur l'autre (« 3𝑥 = 12 et 12 = 3𝑥 : c'est le but de l'égalité »). [étape, début, longueur] */
const MARCHES = [["m3e1", 0, 4], ["m3e1", 4, 4], ["m3e1", 8, 4], ["m3e2", 0, 6], ["m3e2", 6, 6],
                 ["m3e4", 0, 4], ["m3e4", 4, 4], ["m3e4", 8, 4]];

test("Q2 : le monde 5 a trois étapes, 12 équations chacune, et garde ses étoiles m3e1, m3e2, m3e4", () => {
  assert.equal(EQUATIONS.nom, "SPLAT! Équations");
  assert.deepEqual(EQUATIONS.etapes.map((e) => e.t), ["Premières équations", "Des paquets de jetons", "Des taches des deux côtés"]);
  assert.deepEqual(EQUATIONS.etapes.map((e) => e.p), ["m3e1", "m3e2", "m3e4"]);
  /* l'identifiant de ligne (étoile cochée à la main) reste celui de la place d'avant */
  assert.deepEqual(EQUATIONS.etapes.map((e) => e.id), ["e2-0", "e2-1", "e2-3"]);
  /* « Écris l'équation » (m3e3) est retirée : ni étape, ni jeu, ni fiche */
  const tout = MONDES.flatMap((m) => m.etapes);
  assert.ok(!tout.some((e) => e.p === "m3e3" || e.t === "Écris l'équation" || (e.j || "").includes("parcours=m3e3")));
  assert.ok(!/j:"[^"]*parcours=m3e3/.test(univers));
  EQUATIONS.etapes.forEach((e) => {
    assert.equal(e.eqs.length, 12, e.t);
    assert.equal(new Set(e.eqs).size, 12, `${e.t} : deux cartes de la même équation`);
    assert.deepEqual(e.eqs, LISTE_Q2[e.p], `${e.t} : la liste validée`);
  });
  assert.deepEqual(EQUATIONS.etapes.map((e) => e.o), [
    "Les jetons sont là un par un : enlève, partage, et trouve ce que cache la tache.",
    "Les jetons portent un nombre : fusionne, enlève, partage.",
    "L'inconnue est partout ! Enlève les taches en trop, puis résous. À la fin, tout se mélange."]);
  assert.equal(NOTES_PROF[4].length, 3);
});

test("Q2 : chaque série du jeu, décodée, est exactement la liste 📋 (mêmes cartes, même ordre)", () => {
  EQUATIONS.etapes.forEach((e) => {
    assert.ok(e.j.startsWith("/outils/equasplat.html?eleve=1&parcours=" + e.p + "#data="), e.t);
    const d = donnees(e.j);
    assert.equal(d.source, "univers_splat");
    assert.equal(d.parcours, e.p, "le parcours du jeu porte l'étoile de l'étape");
    assert.deepEqual(d.serie.map(ecrire), e.eqs, e.t);
    d.serie.forEach((q) => {
      assert.equal(q.unknownDisplay, "letter", "inconnue en lettre (décision du 23/09)");
      assert.equal(q.universe, "positive");
      assert.equal(q.numberMode, e.p === "m3e1" ? "unit" : "grouped");
      /* la solution écrite dans la série résout bien l'équation */
      const val = (c) => c.reduce((s, t) => s + (t === "x" ? q.x : t), 0);
      assert.equal(val(q.left), val(q.right), ecrire(q));
    });
  });
});

test("relecture du 27/09 : huit marches, la tache finit à gauche sur la moitié des cartes, à droite sur l'autre", () => {
  const taches = (r) => r.filter((x) => x === "x").length, jetons = (r) => r.some((x) => x !== "x");
  const forme = (q) => {
    const [g, d] = [taches(q.left), taches(q.right)];
    if (g && d) return "deux côtés";
    const k = g || d, autre = g ? q.left : q.right;
    return k === 1 ? "x + b = c" : jetons(autre) ? "ax + b = c" : "ax = c";
  };
  const finit = (q) => {
    const [g, d] = [taches(q.left), taches(q.right)];
    return (g && d) ? (g > d ? "gauche" : "droite") : (g ? "gauche" : "droite");
  };
  MARCHES.forEach(([p, i, n]) => {
    const cartes = donnees(EQUATIONS.etapes.find((e) => e.p === p).j).serie.slice(i, i + n);
    assert.equal(cartes.filter((q) => finit(q) === "gauche").length, n / 2, `${p}, cartes ${i + 1} à ${i + n}`);
  });
  const s = Object.fromEntries(EQUATIONS.etapes.map((e) => [e.p, donnees(e.j).serie]));
  // fiche 35 : x + b = c, puis ax = c, puis ax + b = c
  assert.deepEqual(s.m3e1.map(forme), [...Array(4).fill("x + b = c"), ...Array(4).fill("ax = c"), ...Array(4).fill("ax + b = c")]);
  // fiche 36 : toujours ax + b = c ; 2 ou 3 taches, puis 4 à 6
  assert.ok(s.m3e2.every((q) => forme(q) === "ax + b = c"));
  assert.deepEqual(s.m3e2.map((q) => Math.max(taches(q.left), taches(q.right)) >= 4), [...Array(6).fill(false), ...Array(6).fill(true)]);
  // fiche 37 : des jetons d'un seul côté (4), des deux côtés (4), puis le grand mélange (4 formes, dans le désordre)
  s.m3e4.slice(0, 4).forEach((q) => { assert.equal(forme(q), "deux côtés"); assert.notEqual(jetons(q.left), jetons(q.right), "jetons d'un seul côté"); });
  s.m3e4.slice(4, 8).forEach((q) => { assert.equal(forme(q), "deux côtés"); assert.ok(jetons(q.left) && jetons(q.right), "jetons des deux côtés"); });
  const melange = s.m3e4.slice(8).map(forme);
  assert.deepEqual([...melange].sort(), ["ax + b = c", "ax = c", "deux côtés", "x + b = c"]);
  assert.notDeepEqual(melange, ["x + b = c", "ax = c", "ax + b = c", "deux côtés"], "pas dans l'ordre des marches");
});

test("Q2 : fiche 35 — jetons un par un, coefficient 2 ou 3, aucun nombre au-delà de 10, 7 lettres jamais deux fois de suite", () => {
  const serie = donnees(EQUATIONS.etapes[0].j).serie;
  serie.forEach((q) => {
    const coef = Math.max(q.left.filter((t) => t === "x").length, q.right.filter((t) => t === "x").length);
    assert.ok(coef >= 1 && coef <= 3, ecrire(q));
    [...q.left, ...q.right].filter((t) => t !== "x").forEach((k) => assert.ok(k >= 1 && k <= 10, ecrire(q)));
  });
  assert.deepEqual(serie.slice(0, 4).map((q) => Math.max(q.left.filter((t) => t === "x").length, q.right.filter((t) => t === "x").length)), [1, 1, 1, 1]);
  const lettres = serie.map((q) => q.variable);
  assert.equal(new Set(lettres).size, 7);
  lettres.forEach((l, i) => i && assert.notEqual(l, lettres[i - 1], `cartes ${i} et ${i + 1}`));
});

test("Q2 : aucun nombre à sous-entendu dans les 36 équations", () => {
  const INTERDITS = [69, 88, 666];
  EQUATIONS.etapes.forEach((e) => donnees(e.j).serie.forEach((q) =>
    [...q.left, ...q.right].filter((t) => t !== "x").forEach((k) => assert.ok(!INTERDITS.includes(k), ecrire(q)))));
});

test("Q2 : liens Projeter, Fiche tableau et Fiche équation — mêmes réglages que le jeu, 6 par page, titre « Fiche N — … »", () => {
  assert.equal(EQ5_PREMIERE_FICHE, 35);
  assert.equal((univers.match(/const EQ5_PREMIERE_FICHE=35;/g) || []).length, 1, "le numéro est écrit à un seul endroit");
  EQUATIONS.etapes.forEach((e, k) => {
    const n = 35 + k;
    assert.equal(e.n, n);
    for (const [lien, vue] of [[e.f, "schema"], [e.fe, "equation"], [e.jp, k === 2 ? "equation" : "schema"]]) {
      assert.ok(lien.startsWith("/splat/equations/?"), lien);
      const p = params(lien);
      assert.equal(p.get("view"), vue);
      assert.equal(p.get("unknown"), "letter");
      if (lien !== e.jp) {
        assert.equal(p.get("print"), "statement");
        assert.equal(p.get("layout"), "6");
        assert.equal(p.get("imprimer"), "1");
        assert.equal(p.get("title"), `Fiche ${n} \u2014 ${e.t}`);
      } else {
        assert.equal(p.get("print"), null);
      }
      /* chaque partie donne 4 cartes ; les parties de « suite » ont la même vue */
      const parties = [p, ...(p.get("suite") ? p.get("suite").split(";").map((s) => new URLSearchParams(s)) : [])];
      parties.forEach((x) => { assert.equal(x.get("view"), vue); assert.equal(x.get("unknown"), "letter"); });
      assert.equal(parties.reduce((s, x) => s + Number(x.get("cards")), 0), 12, `${e.t} : 12 cartes`);
    }
  });
  const [p35, p36, p37] = EQUATIONS.etapes.map((e) => params(e.f));
  assert.deepEqual(p35.get("suite").split(";").map((s) => new URLSearchParams(s).get("seed")), ["814", "793"]);
  assert.equal(p35.get("seed"), "355");
  assert.equal(p35.get("form"), "X_PLUS_B_EQ_C");
  assert.deepEqual(p35.get("suite").split(";").map((s) => new URLSearchParams(s).get("form")), ["AX_EQ_C", "ONE_SIDE"]);
  assert.deepEqual(p35.get("suite").split(";").map((s) => new URLSearchParams(s).get("tasksMax")), ["3", "3"]);
  assert.equal(p35.get("mode"), "EQUNITSTEP");
  // relecture du 27/09/2026 : 36 = quatre séries de 3 cartes, 37 = trois séries de 4
  const graines = (p) => [p.get("seed"), ...p.get("suite").split(";").map((s) => new URLSearchParams(s).get("seed"))];
  const formes = (p) => [p.get("form"), ...p.get("suite").split(";").map((s) => new URLSearchParams(s).get("form"))];
  assert.deepEqual([p36.get("mode"), graines(p36)], ["EQSTEP", ["304", "4471", "3795", "79133"]]);
  assert.deepEqual(formes(p36), ["ONE_SIDE", "ONE_SIDE", "ONE_SIDE", "ONE_SIDE"]);
  assert.deepEqual([p37.get("mode"), graines(p37)], ["EQSTEP", ["2117", "295", "29197"]]);
  assert.deepEqual(formes(p37), ["BOTH", "BOTH", "MIX"]);
});

test("Q2 : une fiche = 2 feuilles de 6 dans l'outil (6/page pour l'énoncé seul, « suite » lue jusqu'à 5 parties)", () => {
  /* getPrintCardsPerPage exécutée pour de vrai (même recette que le test du lot Q1) */
  const start = outil.indexOf("function getPrintCardsPerPage("), end = outil.indexOf("function isEquationSchemaPrintCard(");
  const planA = outil.indexOf("function getPrintPlan("), planB = outil.indexOf("function syncPrintSummary(");
  assert.ok(start > 0 && end > start && planA > 0 && planB > planA);
  const fn = Function("document", "printCardsPerPageEl", "printModeSelectEl",
    outil.slice(planA, planB) + outil.slice(start, end) + "return getPrintCardsPerPage();");
  EQUATIONS.etapes.forEach((e) => [e.f, e.fe].forEach((lien) => {
    const p = params(lien);
    const parPage = fn({ getElementById() { return null; } }, { value: p.get("layout") }, { value: p.get("print") });
    assert.equal(parPage, 6);
    const parties = 1 + (p.get("suite") ? p.get("suite").split(";").length : 0);
    assert.ok(parties <= 6, "l'outil lit au plus 5 parties dans « suite »");
    assert.equal(Math.ceil(12 / parPage), 2);
  }));
  assert.match(outil, /\.split\(";"\)\.map\(part => part\.trim\(\)\)\.filter\(Boolean\)\.slice\(0, 5\)/);
});

test("Q2 : la carte saute de la fiche 19 à la fiche 35 ; le trou se referme tout seul quand les fiches 20 à 34 arrivent", () => {
  assert.equal(EQUATIONS.premier, 35);
  assert.match(univers, /if\(m\.premier\) compteur=Math\.max\(compteur,m\.premier-1\);/);
  /* le compteur du gabarit, refait ici */
  const numeros = (mondes) => { let c = 0; return mondes.map((m) => { if (m.premier) c = Math.max(c, m.premier - 1); return m.etapes.map(() => ++c); }); };
  const n = numeros(MONDES);
  /* lot « six mondes » (24/09) : les quinze étapes sont arrivées (Enquête 20-24, Système 25-34) —
     le compteur atteint 34 de lui-même et « premier » ne fait plus rien, comme prévu */
  assert.deepEqual(n[3].slice(-1), [34]);
  assert.deepEqual(n[4], [35, 36, 37]);
  assert.deepEqual(n[5], [38, 39, 40, 41, 42, 43]);   // lot R2 : six fiches
  EQUATIONS.etapes.forEach((e, k) => assert.equal(e.n, n[4][k], "le badge et la fiche disent le même numéro"));
  const sans = MONDES.map((m) => (m === EQUATIONS ? { ...m, premier: undefined } : m));
  assert.deepEqual(numeros(sans)[4], [35, 36, 37], "sans « premier », mêmes numéros : le trou est refermé");
});

test("Q2 (demande de Claire) : en vue prof, chaque équation des mondes 5 et 6 ouvre CETTE équation seule, sans parcours ni étoile", () => {
  [[4, EQUATIONS], [5, RELATIFS]].forEach(([mi, m]) => m.etapes.forEach((e, ei) => {
    const liens = ctx.eqSeuleLiens(brut(mi, ei));
    assert.ok(Array.isArray(liens), `${m.nom}, ${e.t} : pas de liens`);
    assert.equal(liens.length, e.eqs.length);
    const serie = donnees(e.j).serie;
    liens.forEach((l, i) => {
      assert.ok(l.startsWith("/outils/equasplat.html#data="), l);
      assert.ok(!l.includes("parcours") && !l.includes("eleve="), "ni parcours ni mode élève");
      const d = donnees(l);
      assert.deepEqual(d, serie[i], `${e.t}, équation ${i + 1} : exactement la carte du jeu`);
      assert.equal(d.serie, undefined, "une équation seule, pas une série (écran sans bandeau)");
      assert.equal(d.parcours, undefined);
    });
    const html = ctx.cartesHtml(brut(mi, ei), ctx.X.MONDES[mi], "c");
    assert.deepEqual([...html.matchAll(/<li><a href="([^"]*)"/g)].map((x) => x[1]), JSON.parse(JSON.stringify(liens)), "chaque carte de la grille, son lien");
    assert.match(html, /Un clic sur une carte l(’|\\u2019)ouvre seule dans ÉquaSplat, sans étoile/);
  }));
  /* les mondes des autres outils n'ouvrent pas ÉquaSplat (depuis le 26/09, les mondes 1
     et 2 ouvrent ÉquaBarre : tests/splat-univers-equabarre-liste.test.mjs) */
  MONDES.slice(0, 4).forEach((m, mi) => m.etapes.forEach((e, ei) => {
    if (!e.eqs) return;
    assert.equal(ctx.eqSeuleLiens(brut(mi, ei)), null, `${m.nom} : pas de lien ÉquaSplat`);
    assert.ok(!ctx.cartesHtml(brut(mi, ei), ctx.X.MONDES[mi], "c").includes("equasplat"), `${m.nom}, ${e.t}`);
  }));
  /* une série qui ne compte pas ses équations ne donne aucun lien (plutôt que des liens décalés) */
  const faux = { ...EQUATIONS.etapes[1], eqs: EQUATIONS.etapes[1].eqs.slice(1) };
  assert.equal(ctx.eqSeuleLiens(faux), null);
  assert.equal(ctx.eqSeuleLiens({ ...EQUATIONS.etapes[1], j: "/outils/equasplat.html?eleve=1#data=%%%" }), null);
});

test("Q2 : la vue prof a deux liens Fiche pour le monde 5, et la vue élève n'en a aucun", () => {
  /* lot « vue prof » (27/09/2026) : un seul bouton « Fiche | tableau | équation » */
  EQUATIONS.etapes.forEach((e, ei) => {
    const a = ctx.actionsHtml(brut(4, ei), ctx.X.MONDES[4], "c");
    const seg = a.match(/<span class="seg"><span>[\s\S]*?<\/svg>Fiche<\/span><a href="([^"]*)">tableau<\/a><a href="([^"]*)">équation<\/a><\/span>/);
    assert.ok(seg, `fiche ${e.n} : le bouton Fiche à deux variantes`);
    assert.deepEqual([seg[1], seg[2]], [e.f, e.fe]);
  });
  const eleve = univers.slice(univers.indexOf("else MONDES.forEach((m,mi)=>{"), univers.indexOf("  main.appendChild(sec);\n});"));
  assert.ok(eleve.length > 500 && !eleve.includes("e.fe") && !eleve.includes("e.f+"), "aucune fiche en vue élève");
  /* les mondes 1 à 4 n'ont pas de « fe » : leur bouton reste « Fiche », sans variantes */
  MONDES.slice(0, 4).forEach((m) => m.etapes.forEach((e) => assert.equal(e.fe, undefined, m.nom)));
});
