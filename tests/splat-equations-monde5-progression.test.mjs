import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

/* Lot Q2 (24/09/2026) — la progression du monde 5 « SPLAT! Équations » sur la carte
   des mondes : trois étapes = trois fiches de 12 cartes (35, 36, 37), « Écris
   l'équation » (m3e3) retirée, liens Projeter / Fiche tableau / Fiche équation en
   6 par page, et la liste 📋 de la vue professeur qui ouvre chaque équation seule
   dans ÉquaSplat (demande de Claire, mondes 5 et 6). On EXÉCUTE les données de
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
  "globalThis.eqSeuleLiens=eqSeuleLiens;globalThis.eqListeHtml=eqListeHtml;",
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
  m3e1: ["𝑏 + 4 = 9", "5 = 𝑐 + 1", "6 = 𝑡 + 4", "𝑛 + 1 = 7",
         "2𝑥 = 6", "10 = 2𝑎", "8 = 2𝑡", "3𝑚 = 6",
         "2𝑛 + 2 = 8", "7 = 2𝑏 + 3", "2𝑥 + 1 = 9", "3𝑎 + 3 = 6"],
  m3e2: ["23 = 6𝑎 + 11", "4𝑥 + 2 = 38", "6𝑏 + 10 = 40", "33 = 5𝑎 + 13", "2𝑎 + 19 = 49", "6𝑛 + 38 = 44",
         "49 = 6𝑛 + 37", "6𝑏 + 13 = 31", "27 = 3𝑡 + 6", "45 = 3𝑥 + 18", "3𝑡 + 20 = 50", "50 = 3𝑚 + 8"],
  m3e4: ["4𝑡 + 11 = 5𝑡 + 8", "3𝑛 + 36 = 4𝑛 + 32", "3𝑐 + 16 = 𝑐 + 32", "𝑡 + 38 = 4𝑡 + 17", "6𝑥 + 15 = 2𝑥 + 27",
         "𝑎 + 21 = 2𝑎 + 10", "4𝑛 + 2 = 𝑛 + 38", "𝑛 + 33 = 5𝑛 + 17", "4𝑥 + 16 = 6𝑥 + 6", "5𝑎 + 30 = 𝑎 + 38",
         "5𝑎 + 19 = 𝑎 + 31", "𝑡 + 26 = 5𝑡 + 2"]
};
/* AVANT le lot (main 36f2432) : les 10 cartes des étapes « Résous pas à pas » (m3e2) et
   « Des taches des deux côtés » (m3e4). Une reprise en cours ne retient que la place de
   l'élève dans la série : ces 10 cartes doivent rester les mêmes, dans le même ordre. */
const AVANT_Q2 = {
  m3e2: ["23 = 6𝑎 + 11", "4𝑥 + 2 = 38", "6𝑏 + 10 = 40", "33 = 5𝑎 + 13", "2𝑎 + 19 = 49", "6𝑛 + 38 = 44", "49 = 6𝑛 + 37", "6𝑏 + 13 = 31", "27 = 3𝑡 + 6", "45 = 3𝑥 + 18"],
  m3e4: ["4𝑡 + 11 = 5𝑡 + 8", "3𝑛 + 36 = 4𝑛 + 32", "3𝑐 + 16 = 𝑐 + 32", "𝑡 + 38 = 4𝑡 + 17", "6𝑥 + 15 = 2𝑥 + 27", "𝑎 + 21 = 2𝑎 + 10", "4𝑛 + 2 = 𝑛 + 38", "𝑛 + 33 = 5𝑛 + 17", "4𝑥 + 16 = 6𝑥 + 6", "5𝑎 + 30 = 𝑎 + 38"]
};
/* Le début des séries d'avant, octet pour octet (JSON des 10 cartes décodées, main 36f2432). */
const EMPREINTE_10_AVANT = {
  m3e2: "0457f53cddb4eeb18d30a8e11b3ea2efbb85c2239024bd18ace44bece6b7cd31",
  m3e4: "10170bc9db4f91684a18a681821dc93b36ed149a95984b879bc5d5cc6b8d2df1"
};

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
    "L'inconnue est partout ! Enlève les taches en trop, puis résous."]);
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

test("Q2 : fiches 36 et 37 — les 10 premières cartes sont celles d'avant, à l'identique (les reprises continuent)", async () => {
  const { createHash } = await import("node:crypto");
  ["m3e2", "m3e4"].forEach((p) => {
    const e = EQUATIONS.etapes.find((x) => x.p === p);
    const serie = donnees(e.j).serie;
    assert.deepEqual(serie.slice(0, 10).map(ecrire), AVANT_Q2[p]);
    const empreinte = createHash("sha256").update(JSON.stringify(serie.slice(0, 10))).digest("hex");
    assert.equal(empreinte, EMPREINTE_10_AVANT[p], `${p} : les 10 premières cartes décodées ont bougé`);
  });
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
  assert.deepEqual(p35.get("suite").split(";").map((s) => new URLSearchParams(s).get("seed")), ["814", "19"]);
  assert.equal(p35.get("seed"), "355");
  assert.equal(p35.get("form"), "X_PLUS_B_EQ_C");
  assert.deepEqual(p35.get("suite").split(";").map((s) => new URLSearchParams(s).get("form")), ["AX_EQ_C", "ONE_SIDE"]);
  assert.deepEqual(p35.get("suite").split(";").map((s) => new URLSearchParams(s).get("tasksMax")), ["3", "3"]);
  assert.equal(p35.get("mode"), "EQUNITSTEP");
  assert.deepEqual([p36.get("mode"), p36.get("form"), p36.get("seed")], ["EQSTEP", "ONE_SIDE", "89"]);
  assert.deepEqual([p37.get("mode"), p37.get("form"), p37.get("seed")], ["EQSTEP", "BOTH", "25"]);
  assert.equal(p36.get("suite"), null);
  assert.equal(p37.get("suite"), null);
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
  assert.deepEqual(n[3].slice(-1), [19]);
  assert.deepEqual(n[4], [35, 36, 37]);
  assert.deepEqual(n[5], [38, 39, 40, 41, 42, 43, 44]);
  EQUATIONS.etapes.forEach((e, k) => assert.equal(e.n, n[4][k], "le badge et la fiche disent le même numéro"));
  /* quinze étapes de plus avant le monde 5 (Enquête 3 + Système) : plus de saut, rien à renuméroter */
  const avec = [...MONDES.slice(0, 4), { etapes: Array(15).fill({}) }, ...MONDES.slice(4)];
  assert.deepEqual(numeros(avec)[5], [35, 36, 37]);
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
    const html = ctx.eqListeHtml(brut(mi, ei));
    assert.equal((html.match(/<a class="eqSeule" href="\/outils\/equasplat\.html#data=/g) || []).length, e.eqs.length);
    assert.match(html, /Clique sur une \\u00e9quation|Clique sur une équation/);
  }));
  /* les mondes des autres outils gardent leur liste en texte */
  MONDES.slice(0, 4).forEach((m, mi) => m.etapes.forEach((e, ei) => {
    if (!e.eqs) return;
    assert.equal(ctx.eqSeuleLiens(brut(mi, ei)), null, `${m.nom} : pas de lien ÉquaSplat`);
    assert.ok(!ctx.eqListeHtml(brut(mi, ei)).includes("<a "), `${m.nom}, ${e.t}`);
  }));
  /* une série qui ne compte pas ses équations ne donne aucun lien (plutôt que des liens décalés) */
  const faux = { ...EQUATIONS.etapes[1], eqs: EQUATIONS.etapes[1].eqs.slice(1) };
  assert.equal(ctx.eqSeuleLiens(faux), null);
  assert.equal(ctx.eqSeuleLiens({ ...EQUATIONS.etapes[1], j: "/outils/equasplat.html?eleve=1#data=%%%" }), null);
});

test("Q2 : la vue prof a deux liens Fiche pour le monde 5, et la vue élève n'en a aucun", () => {
  const gabarit = univers.slice(univers.indexOf("'<ol class=\"etapes\">'"), univers.indexOf("main.appendChild(sec);"));
  assert.match(gabarit, /\(e\.fe\?'<a class="fiche" href="'\+e\.fe\+'"[^>]*>\\ud83d\\udcc4 Fiche \\u00e9quation<\/a>':''\)/);
  assert.match(gabarit, /\\ud83d\\udcc4 Fiche'\+\(e\.fe\?' tableau':''\)\+'<\/a>'/);
  const eleve = gabarit.slice(gabarit.indexOf(": m.actif"));
  assert.ok(!eleve.includes("e.fe") && !eleve.includes("e.f+"), "aucune fiche en vue élève");
  /* les mondes 1 à 4 n'ont pas de « fe » : leur bouton garde son nom « 📄 Fiche » */
  MONDES.slice(0, 4).forEach((m) => m.etapes.forEach((e) => assert.equal(e.fe, undefined, m.nom)));
});
