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
  /* Nouvelle progression (nuit du 27 au 28/09/2026, à valider par Gwenaël) : six marches de 6
     cartes, une par page du livret, chaque fiche en six séries de 2 cartes. Une graine qui bouge,
     ce sont la fiche, les livrets et la série du jeu à refaire. Depuis le 28/09/2026, les paquets
     arrivent séparés dans le jeu, comme sur la fiche (« 26 + 16 = 𝑥 + 34 ») : l'élève les regroupe. */
  m3e1: ["𝑚 + 2 = 8", "7 = 𝑥 + 4", "28 = 𝑛 + 12", "𝑏 + 6 = 25", "26 + 16 = 𝑥 + 34", "𝑎 + 16 = 31 + 6", "8 = 2𝑏", "3𝑥 = 6", "24 = 2𝑛", "4𝑚 = 28", "14 + 11 = 5𝑥", "3𝑐 = 7 + 17"],
  m3e2: ["7 = 3𝑏 + 1", "2𝑚 + 2 = 8", "39 = 3𝑥 + 15", "2𝑐 + 4 = 34", "2𝑛 + 5 = 24 + 9", "41 = 2𝑎 + 3 + 14", "4𝑛 + 14 = 38", "37 + 4 = 4𝑚 + 5", "5𝑐 + 11 + 19 = 45", "29 + 14 = 5𝑡 + 18", "19 + 6 = 6𝑥 + 9 + 4", "5𝑡 + 3 + 6 = 9 + 35"],
  m3e4: ["2𝑛 + 5 = 3𝑛", "3𝑏 = 𝑏 + 4", "𝑚 + 18 = 4𝑚", "4𝑐 = 3𝑐 + 9", "4𝑥 + 5 = 2𝑥 + 19", "𝑏 + 21 = 2𝑏 + 7", "3𝑥 + 3 + 4 = 2𝑥 + 19", "4𝑐 + 7 + 12 = 5𝑐 + 14", "5𝑎 = 𝑎 + 28", "2𝑏 + 4 + 35 = 4𝑏 + 33", "6𝑚 + 12 + 6 = 4𝑚 + 26", "3𝑥 + 13 = 4𝑥 + 5"],
};
/* Les huit marches : dans chacune, la tache finit à gauche sur la moitié des cartes et à droite
   sur l'autre (« 3𝑥 = 12 et 12 = 3𝑥 : c'est le but de l'égalité »). [étape, début, longueur] */
const MARCHES = ["m3e1", "m3e2", "m3e4"].flatMap((p) => [0, 2, 4, 6, 8, 10].map((i) => [p, i, 2]));

test("Q2 : le monde 5 a trois étapes, 12 équations chacune, et garde ses étoiles m3e1, m3e2, m3e4", () => {
  assert.equal(EQUATIONS.nom, "SPLAT! Équations");
  assert.deepEqual(EQUATIONS.etapes.map((e) => e.t), ["Premières équations", "Enlever, puis partager", "Des taches sur les deux plateaux"]);
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
    "Une tache : enlève les jetons en trop, ou partage. D'abord un par un, puis en paquets.",
    "Enlève d'abord les jetons en trop, puis partage entre les taches.",
    "Enlève d'abord les taches en trop, puis résous."]);
  assert.equal(NOTES_PROF[4].length, 3);
});

test("Q2 : chaque série du jeu, décodée, est exactement la liste 📋 (mêmes cartes, même ordre)", () => {
  EQUATIONS.etapes.forEach((e) => {
    assert.ok(e.j.startsWith("/outils/equasplat.html?eleve=1&parcours=" + e.p + "#data="), e.t);
    const d = donnees(e.j);
    assert.equal(d.source, "univers_splat");
    assert.equal(d.parcours, e.p, "le parcours du jeu porte l'étoile de l'étape");
    assert.deepEqual(d.serie.map(ecrire), e.eqs, e.t);
    d.serie.forEach((q, i) => {
      assert.equal(q.unknownDisplay, "letter", "inconnue en lettre (décision du 23/09)");
      assert.equal(q.universe, "positive");
      /* jetons un par un au début de chaque geste : 35 (cartes 1-2 et 7-8), 36 et 37 (cartes 1-2) */
      const unite = { m3e1: [0, 1, 6, 7], m3e2: [0, 1], m3e4: [0, 1] }[e.p];
      assert.equal(q.numberMode, unite.includes(i) ? "unit" : "grouped", ecrire(q));
      /* la solution écrite dans la série résout bien l'équation */
      const val = (c) => c.reduce((s, t) => s + (t === "x" ? q.x : t), 0);
      assert.equal(val(q.left), val(q.right), ecrire(q));
    });
  });
});

test("nuit du 27/09 : six marches de 6 cartes, la tache finit à gauche sur une carte de chaque paire, à droite sur l'autre", () => {
  const taches = (r) => r.filter((x) => x === "x").length, jetons = (r) => r.some((x) => x !== "x");
  const forme = (q) => {
    const [g, d] = [taches(q.left), taches(q.right)];
    if (g && d) return "deux plateaux";
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
  // fiche 35 : x + b = c (page 35), puis a × x = c (35 bis)
  assert.deepEqual(s.m3e1.map(forme), [...Array(6).fill("x + b = c"), ...Array(6).fill("ax = c")]);
  // fiche 36 : a × x + b = c ; 2 ou 3 taches (36), puis 4 à 6 (36 bis)
  assert.ok(s.m3e2.every((q) => forme(q) === "ax + b = c"));
  assert.deepEqual(s.m3e2.map((q) => Math.max(taches(q.left), taches(q.right)) >= 4), [...Array(6).fill(false), ...Array(6).fill(true)]);
  // fiche 37 : des taches sur les deux plateaux, sur TOUTES les cartes
  assert.ok(s.m3e4.every((q) => forme(q) === "deux plateaux"));
  // 37 : jetons d'un seul côté (4), puis des deux côtés (2)
  assert.deepEqual(s.m3e4.slice(0, 6).map((q) => jetons(q.left) && jetons(q.right)), [false, false, false, false, true, true]);
  // 37 bis, le grand mélange : une fois les taches en trop enlevées, on retrouve les trois équations
  const reste = (q) => {
    const [g, d] = [taches(q.left), taches(q.right)];
    const [fort, faible] = g > d ? [q.left, q.right] : [q.right, q.left];
    const k = Math.abs(g - d);
    return k === 1 && jetons(fort) ? "x + b = c" : jetons(fort) ? "ax + b = c" : k === 1 ? "x = c" : "ax = c";
  };
  assert.deepEqual([...new Set(s.m3e4.slice(6).map(reste))].sort(), ["ax + b = c", "ax = c", "x + b = c"]);
  // jamais la même solution deux fois sur une page
  Object.values(s).forEach((serie) => [0, 6].forEach((i) => {
    const xs = serie.slice(i, i + 6).map((q) => q.x);
    assert.equal(new Set(xs).size, 6, xs.join(", "));
  }));
});

test("nuit du 27/09 : jetons un par un jusqu'à 10 (coefficient 1 à 3), paquets de 3 au moins, totaux jusqu'à 50, lettres jamais deux fois de suite", () => {
  const unite = { m3e1: [0, 1, 6, 7], m3e2: [0, 1], m3e4: [0, 1] };
  const toutes = [];
  EQUATIONS.etapes.forEach((e) => donnees(e.j).serie.forEach((q, i) => {
    toutes.push(q);
    const nb = [...q.left, ...q.right].filter((t) => t !== "x");
    const taches = (r) => r.filter((t) => t === "x").length;
    const val = (r) => r.reduce((s, t) => s + (t === "x" ? q.x : t), 0);
    assert.ok(q.x >= 2, `${ecrire(q)} : pas de solution 0 ou 1`);
    assert.ok(val(q.left) <= 50, ecrire(q));
    if (unite[e.p].includes(i)) {
      assert.ok(Math.max(taches(q.left), taches(q.right)) <= 3, ecrire(q));
      nb.forEach((k) => assert.ok(k >= 1 && k <= 10, ecrire(q)));
    }
  }));
  // (les paquets eux-mêmes, avant leur somme, sont relus dans cartes.json : tests/livret-splat-equations.test.mjs)
  const lettres = toutes.map((q) => q.variable);
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
  // nuit du 27/09/2026 : chaque fiche = six séries de 2 cartes
  const graines = (p) => [p.get("seed"), ...p.get("suite").split(";").map((s) => new URLSearchParams(s).get("seed"))];
  const champ = (p, c) => [p.get(c), ...p.get("suite").split(";").map((s) => new URLSearchParams(s).get(c))];
  const [p35, p36, p37] = EQUATIONS.etapes.map((e) => params(e.f));
  assert.deepEqual(graines(p35), ["169", "265", "824", "629", "670", "1097"]);
  assert.deepEqual(graines(p36), ["4942", "1247", "5242", "5869", "3933", "2440"]);
  assert.deepEqual(graines(p37), ["6348", "2809", "178", "3943", "3599", "6408"]);
  assert.deepEqual(champ(p35, "form"), ["X_PLUS_B_EQ_C", "X_PLUS_B_EQ_C", "X_PLUS_B_EQ_C", "AX_EQ_C", "AX_EQ_C", "AX_EQ_C"]);
  assert.deepEqual(champ(p36, "form"), Array(6).fill("ONE_SIDE"));
  assert.deepEqual(champ(p37, "form"), Array(6).fill("BOTH"));
  assert.deepEqual(champ(p35, "mode"), ["EQUNITSTEP", "EQSTEP", "EQSTEP", "EQUNITSTEP", "EQSTEP", "EQSTEP"]);
  [p36, p37].forEach((p) => assert.deepEqual(champ(p, "mode"), ["EQUNITSTEP", ...Array(5).fill("EQSTEP")]));
  [p35, p36, p37].forEach((p) => assert.deepEqual(champ(p, "cards"), Array(6).fill("2")));
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
    assert.match(html, /Un clic sur une carte l(’|\\u2019)ouvre seule dans ÉquaSplat\./);
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
