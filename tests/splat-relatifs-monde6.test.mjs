/* Le monde 6 de l'univers SPLAT!, « SPLAT! Relatifs » (lots R1 et R2, 26/09/2026).

   R1 — l'outil (outils/splat_equations.html) apprend ce qui manquait aux relatifs : la
   correction courte « l'équation » 6/page, le vrai signe moins et le mot « opposé » lisibles à
   l'impression, la solution nulle (« zero=1 »), le signe des taches opposées gardé vers le jeu
   de l'élève, un bandeau sans logo IREMI ; et ÉquaSplat sait conclure 4𝑥 = 0.
   R2 — la progression : six fiches de 12 cartes (38 à 43) en deux parties, un livret chacune.

   Comme pour le monde 5, on EXÉCUTE la carte des mondes, la page courte des QR et les
   fonctions de l'outil, puis on relit les PDF publiés. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;
const univers = lire("outils/splat_univers.html");
const outil = lire("outils/splat_equations.html");
const equasplat = lire("outils/equasplat.html");
const courte = lire("splat/relatifs/livret/index.html");
const etapes = lire("assets/js/splat-etapes.js");
const SRC = "_sources/livret-splat-relatifs/";
const render = lire(SRC + "render.py");
const cartes = JSON.parse(lire(SRC + "cartes.json"));
const pageLivrets = lire("outils/livrets_splat.html");

// ------------------------------------------------ la carte des mondes, exécutée
function bloc(texte, debut, fin) {
  const a = texte.indexOf(debut), b = texte.indexOf(fin, a);
  assert.ok(a >= 0 && b > a, `bloc « ${debut} » introuvable`);
  return texte.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
vm.runInContext(bloc(univers, "const PS=", "const PROF =") + ";globalThis.X={MONDES};", ctx, { filename: "splat_univers.html" });
const { MONDES } = JSON.parse(JSON.stringify(ctx.X));
const RELATIFS = MONDES.find((m) => m.idp === "e3");
const decode = (b64) => JSON.parse(Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
const donnees = (url) => decode(url.slice(url.indexOf("#data=") + 6));

// ------------------------------------------------ render.py, lu : les parties de chaque fiche
const FICHES_PY = [...render.matchAll(/dict\(n=(\d+), t="([^"]+)", parcours="(m4e\d)", resume="[^"]*",\s+parties=\[([\s\S]*?)\]\),/g)]
  .map((m) => ({ n: Number(m[1]), t: m[2], parcours: m[3],
                 parties: [...m[4].matchAll(/E \+ "([^"]+)"/g)].map((x) => "mode=EQPMSTEP&form=" + x[1]) }));

test("R2 : le monde 6 a six étapes, deux parties, fiches 38 à 43, parcours m4e1 … m4e6", () => {
  assert.equal(RELATIFS.nom, "SPLAT! Relatifs");
  assert.deepEqual(RELATIFS.etapes.map((e) => e.p), ["m4e1", "m4e2", "m4e3", "m4e4", "m4e5", "m4e6"]);
  assert.deepEqual(RELATIFS.etapes.map((e) => e.t), ["Les jetons rouges arrivent", "Des négatifs partout", "La tache opposée",
    "Des taches des deux côtés", "Une tache opposée d’un côté", "Le grand mélange"]);
  assert.deepEqual(RELATIFS.volets.map((v) => [v.de, v.a]), [[0, 3], [3, 6]]);
  assert.deepEqual(RELATIFS.volets.map((v) => v.nom), ["L’inconnue d’un seul côté", "L’inconnue des deux côtés"]);
  // aucun identifiant en toutes lettres : e3-0 … e3-5
  RELATIFS.etapes.forEach((e) => assert.equal(e.id, undefined));
  // la liste de assets/js/splat-etapes.js suit la carte (le test de l'étape suivante le vérifie aussi)
  for (const [k, e] of RELATIFS.etapes.entries()) {
    assert.ok(etapes.includes(`["${e.p}", ${38 + k}, "${e.t}", "SPLAT! Relatifs", 6]`), e.p);
  }
});

test("R2 : les réglages des fiches sont ceux de render.py, et chaque série du jeu en est la conversion", () => {
  assert.equal(FICHES_PY.length, 6);
  RELATIFS.etapes.forEach((e, k) => {
    const f = FICHES_PY[k];
    assert.equal(f.parcours, e.p);
    assert.equal(f.n, 38 + k);
    assert.equal(f.t, e.t);
    assert.deepEqual([e.q, ...(e.suite || [])], f.parties, `fiche ${f.n} : mêmes parties, même ordre`);
    f.parties.forEach((q) => {
      const p = new URLSearchParams(q);
      assert.equal(p.get("mode"), "EQPMSTEP");
      assert.equal(p.get("unknown"), "letter");
      assert.ok(p.get("seed") && p.get("totalMin") && p.get("totalMax"), `${q} : graine et bornes écrites`);
    });
    assert.equal(f.parties.reduce((n, q) => n + Number(new URLSearchParams(q).get("cards")), 0), 12, `fiche ${f.n} : 12 cartes`);
    // le jeu : ÉquaSplat, la même étoile, 12 équations
    assert.ok(e.j.startsWith(`/outils/equasplat.html?eleve=1&parcours=${e.p}#data=`));
    const d = donnees(e.j);
    assert.equal(d.parcours, e.p);
    assert.equal(d.serie.length, 12);
    assert.equal(e.eqs.length, 12);
    d.serie.forEach((c) => {
      assert.equal(c.universe, "relative");
      assert.equal(c.numberMode, "grouped");
      assert.equal(c.unknownDisplay, "letter");
    });
    // les cartes du livret (relues dans l'outil par render.py) sont exactement celles du jeu
    const livret = k < 3 ? "livret1" : "livret2";
    assert.deepEqual(cartes[livret].fiches[String(38 + k)], d.serie, `fiche ${38 + k} : livret = jeu`);
  });
  // trois solutions nulles au monde 6 : fiches 39 (deux) et 41, 43
  const zeros = RELATIFS.etapes.map((e) => donnees(e.j).serie.filter((c) => c.x === 0).length);
  assert.deepEqual(zeros, [0, 2, 0, 1, 0, 1]);
  // 72 équations toutes différentes
  const toutes = RELATIFS.etapes.flatMap((e) => e.eqs);
  assert.equal(new Set(toutes).size, 72);
  // des solutions des deux signes dans chaque fiche
  RELATIFS.etapes.forEach((e) => {
    const x = donnees(e.j).serie.map((c) => c.x);
    assert.ok(x.some((v) => v < 0) && x.some((v) => v > 0), `${e.t} : solutions des deux signes`);
  });
  // aucun nombre à sous-entendu
  const nombres = RELATIFS.etapes.flatMap((e) => donnees(e.j).serie.flatMap((c) => [c.x, ...c.left, ...c.right].filter((v) => typeof v === "number")));
  assert.ok(!nombres.some((v) => [69, 88].includes(Math.abs(v))));
});

test("R2 : les liens de la vue prof — Projeter, Fiche (6/page) et Correction (courte, l'équation)", () => {
  RELATIFS.etapes.forEach((e, k) => {
    const n = 38 + k;
    assert.equal(e.n, n);
    assert.ok(e.f.startsWith("/splat/equations/?" + e.q + "&view=equation"));
    assert.match(e.f, /&print=statement&layout=6&imprimer=1&title=/);
    assert.ok(decodeURIComponent(e.f).endsWith(`Fiche ${n} — ${e.t}`));
    assert.match(e.c, /&print=correction-equation&layout=6&imprimer=1&title=/);
    if (e.suite) assert.ok(e.f.includes("&suite=" + e.suite.map((x) => encodeURIComponent(x + "&view=equation")).join(";")));
  });
  // un seul lien vers la page des livrets, comme au monde 5
  assert.match(univers, /m===MONDE_RELATIFS&&PROF\?'<p class="intro">'\s*\+'<a class="introLien livret" href="\/outils\/livrets_splat\.html#monde-6">/);
});

// ------------------------------------------------ la page courte des QR, exécutée
function cibles(q) {
  let cible = null;
  const c = vm.createContext({ URLSearchParams, URL, window: { location: { search: q, origin: "https://mathsgo.re",
    replace: (u) => { cible = u; } } } });
  vm.runInContext(courte.slice(courte.indexOf("<script>") + 8, courte.indexOf("</script>")), c);
  return cible.replace("https://mathsgo.re", "");
}
test("R2 : page courte — ?f=38 … 43 ouvrent le jeu de la carte des mondes, ?s=1 … 6 six équations au hasard", () => {
  RELATIFS.etapes.forEach((e, k) => assert.equal(cibles(`?f=${38 + k}`), e.j, `?f=${38 + k}`));
  const parties = RELATIFS.etapes.flatMap((e) => [e.q, ...(e.suite || [])]);
  const sansGraine = (q) => q.replace(/&seed=\d+/, "").replace(/cards=\d+/, "cards=N");
  for (let s = 1; s <= 6; s++) {
    const u = new URL("https://x" + cibles(`?s=${s}`));
    assert.equal(u.pathname, "/outils/splat_equations.html");
    assert.equal(u.searchParams.get("jouer"), "1");
    assert.equal(u.searchParams.get("parcours"), null, "aucune étoile");
    const morceaux = [u.search.slice(1).replace(/&jouer=1.*$/, ""), ...(u.searchParams.get("suite") || "").split(";").filter(Boolean)];
    const cartesSerie = morceaux.reduce((n, q) => n + Number(new URLSearchParams(q).get("cards")), 0);
    assert.equal(cartesSerie, 6, `?s=${s} : six équations`);
    morceaux.forEach((q) => {
      assert.ok(!/seed=|zero=/.test(q), `?s=${s} : sans graine ni solution nulle`);
      assert.ok(parties.map(sansGraine).includes(q.replace(/cards=\d+/, "cards=N")), `?s=${s} : ${q} vient d'une fiche`);
    });
  }
  assert.equal(cibles("?f=99"), "/outils/splat_univers.html");
});

// ------------------------------------------------ les PDF
function flux(p) {
  const b = readFileSync(new URL(`../${p}`, import.meta.url));
  const out = [];
  let i = 0;
  while ((i = b.indexOf("stream", i)) >= 0) {
    let s = i + 6;
    if (b[s] === 13) s++;
    if (b[s] === 10) s++;
    const e = b.indexOf("endstream", s);
    if (e < 0) break;
    try { out.push(inflateSync(b.subarray(s, e)).toString("latin1")); } catch { /* flux non compressé */ }
    i = e + 9;
  }
  return out;
}
const nombreDePages = (p) => (flux(p).join("").match(/\/Type\s*\/Page\b/g) || []).length;
test("R2 : les huit PDF — 8 pages A4, 4 feuilles A3 imposées, légers ; la page des livrets les propose (monde public)", () => {
  for (const n of [1, 2]) for (const c of ["", "_correction"]) {
    const s = `livret_splat_relatifs_${n}${c}`;
    assert.equal(nombreDePages(`outils/${s}.pdf`), 8, `${s}.pdf`);
    assert.equal(nombreDePages(`outils/${s}_a_plier.pdf`), 4, `${s}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}.pdf`) < 3_000_000, `${s}.pdf reste léger`);
    assert.ok(pageLivrets.includes(`href="/outils/${s}.pdf"`), `page des livrets : ${s}.pdf`);
  }
  // le monde 6 est public depuis le 27/09/2026 (Gwenaël : « on peut le mettre en ligne directement »)
  assert.match(pageLivrets, /<section class="panneau" data-m="6" id="monde-6" role="tabpanel"/);
  assert.match(pageLivrets, /<a href="#monde-6" data-m="6" id="onglet-6" role="tab" aria-controls="monde-6" aria-selected="false">/);
  assert.match(etapes, /const MONDES_EN_PREPARATION = \[3, 4\];/, "le monde 6 n'est plus en préparation");
  // au dos, le seul logo maths&go, sans IREMI, sans Unité apprenante, sans crédit à Claire
  const dos = lire(SRC + "dos.html");
  assert.match(dos, /<img class="mg" src="\/assets\/img\/logos\/mathsgo\/logo-print\.png"/);
  assert.doesNotMatch(dos, /irem|IREMI|ua-debre|Unité apprenante|Claire/i);
  assert.doesNotMatch(lire(SRC + "couverture.html"), /irem|IREMI|Claire/i);
  // les pages-fiches : les logos retirés au rendu ; plus de « page N » (retiré de tous les livrets
  // le 26/09/2026 au soir, le numéro de fiche du bandeau suffit)
  assert.match(render, /JS_SANS_LOGO = """\(\) => \{\n  const l = document\.querySelectorAll\('\.printArea \.print-page-logos'\);/);
  assert.doesNotMatch(render, /num-page|JS_NUMERO|CSS_NUMERO/);
});

// ------------------------------------------------ R1 : l'outil
function fonction(nom, texte = outil) {
  const debut = texte.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `la fonction ${nom} doit exister`);
  let i = texte.indexOf("{", texte.indexOf(")", debut)), prof = 0;
  for (; i < texte.length; i++) {
    if (texte[i] === "{") prof++;
    else if (texte[i] === "}" && --prof === 0) break;
  }
  return texte.slice(debut, i + 1);
}

test("R1 : « zero=1 » — une solution nulle en relatifs, sans changer le hasard des autres séries", () => {
  assert.match(outil, /const sharedNames = \[[^\]]*"jouer", "zero", "taches"\]/);
  assert.match(outil, /solutionNulle = isSignedEquationModeValue\(activityEl\.value\) && params\.get\("zero"\) === "1";/);
  assert.match(outil, /const x = solutionNulle \? \(rng\(\), 0\) : \(\(rng\(\) < 0\.5\) \? -1 : 1\) \* absX;/);
  assert.match(outil, /\}else if\(vCountL === 0 && vCountR === 0 && !solutionNulle\)\{/);
  assert.match(outil, /if\(solutionNulle && isSignedEquationModeValue\(act\)\) params\.set\("zero", "1"\);/);
});

test("R1 : le jeu de l'élève garde le signe des taches opposées et chaque jeton relatif", () => {
  const src = fonction("carteDuJeuEquaSplat");
  const essai = (payload) => {
    const c = vm.createContext({ buildEquationEquaSplatPayload: () => payload });
    vm.runInContext(src + ";globalThis.r=carteDuJeuEquaSplat({});", c);
    return JSON.parse(JSON.stringify(c.r));
  };
  const base = { source: "splat_equations", variable: "𝑛", unknownDisplay: "letter", numberMode: "grouped", signedWritingMode: "simplified", x: -4 };
  const r = essai({ ...base, universe: "relative",
    left: [{ type: "x", sign: -1 }, { type: "number", value: 15 }, { type: "x", sign: -1 }, { type: "number", value: 6 }],
    right: [{ type: "x", sign: -1 }, { type: "x", sign: 1 }, { type: "x", sign: -1 }, { type: "number", value: 25 }] });
  assert.deepEqual([r.left, r.right], [["-x", "-x", 15, 6], ["x", "-x", "-x", 25]]);
  // 2𝑥 = −3𝑥 : aucun jeton, aucun « 0 » ajouté
  const z = essai({ ...base, x: 0, universe: "relative", left: [{ type: "x", sign: 1 }, { type: "x", sign: 1 }],
    right: [{ type: "x", sign: -1 }, { type: "x", sign: -1 }, { type: "x", sign: -1 }] });
  assert.deepEqual([z.left, z.right], [["x", "x"], ["-x", "-x", "-x"]]);
  // entiers naturels : inchangé (la somme des paquets)
  const p = essai({ ...base, x: 10, universe: "positive", left: [{ type: "x" }, { type: "number", value: 7 }, { type: "x" }, { type: "number", value: 5 }],
    right: [{ type: "number", value: 27 }, { type: "number", value: 5 }] });
  assert.deepEqual([p.left, p.right], [["x", "x", 12], [32]]);
});

test("R1 : la correction courte « l'équation » existe en relatifs — lignes du pas à pas, flèches lues dans les lignes", () => {
  const sync = fonction("syncEqSixCorrectionUI");
  assert.match(sync, /option\[value="correction-schema"\]'\)\.forEach\(opt => \{ opt\.disabled = signe; \}\);/);
  assert.match(fonction("renderEqSixCorrectionIntoSvg"), /if\(isSignedEquationFamily\(card\)\)\{[\s\S]*drawEqSixCorrectionSignedEquation\(gc, card, varCharPm, tEl, tText\);/);
  // les flèches, calculées sur des lignes de l'outil
  const c = vm.createContext({ getEquationSignedStepStates: null, formatVarCoeffAbs: (c, v) => (Math.abs(c) === 1 ? v : Math.abs(c) + v) });
  vm.runInContext(fonction("eqSignedLineCoeffs") + fonction("eqSignedSixCorrectionLinesOps") + ";globalThis.f=eqSignedSixCorrectionLinesOps;", c);
  const lignes = (l) => { c.getEquationSignedStepStates = () => l.map(([kind, equation]) => ({ kind, equation })); return c.f({}, "𝑏"); };
  let r = lignes([["initial", "−𝑏 + 6 = 2𝑏 − 9"], ["hatchOppositeX", "…"], ["afterLetters", "6 = 3𝑏 − 9"], ["hatchV", "…"],
    ["afterConstants", "15 = 3𝑏"], ["final", "5 = 𝑏"], ["verify", "5 = 𝑏"]]);
  assert.deepEqual(JSON.parse(JSON.stringify(r)), { lines: ["−𝑏 + 6 = 2𝑏 − 9", "6 = 3𝑏 − 9", "15 = 3𝑏", "5 = 𝑏"], ops: ["+ 𝑏", "+ 9", "÷ 3"] });
  r = lignes([["initial", "2𝑏 + 3 − 9 = −12"], ["combined", "2𝑏 − 6 = −12"], ["afterConstants", "2𝑏 = −6"], ["final", "𝑏 = −3"]]);
  assert.deepEqual(JSON.parse(JSON.stringify(r.ops)), [null, "+ 6", "÷ 2"]);
  r = lignes([["initial", "−3𝑏 = 12"], ["final", "𝑏 = −4"]]);
  assert.deepEqual(JSON.parse(JSON.stringify(r.ops)), ["÷ (−3)"]);
  r = lignes([["initial", "−2𝑏 = 3𝑏"], ["afterLetters", "0 = 5𝑏"], ["final", "0 = 𝑏"]]);
  assert.deepEqual(JSON.parse(JSON.stringify(r.ops)), ["+ 2𝑏", "÷ 5"]);
});

test("R1 : à l'impression, le vrai signe moins, le mot « opposé » lisible, pas de logo IREMI, la consigne de la tache opposée", () => {
  const c = vm.createContext({});
  vm.runInContext(fonction("eqPrintBeadLabel") + ";globalThis.f=eqPrintBeadLabel;", c);
  assert.equal(c.f(-12), "−12");
  assert.equal(c.f(7), "7");
  assert.match(outil, /return clamp\(Math\.round\(\(Number\(r\) \|\| 74\) \* \(revealed \? 0\.34 : 0\.38\)\), 16, 44\);/);
  // (lot R3) les trois scènes imprimées passent par une seule fonction, qui pose « opposé »
  assert.equal((outil.match(/drawEqPrintTacheMark\((?:targetGroup, text|targetSvg, tText), s, card, /g) || []).length, 3, "les trois scènes imprimées");
  assert.match(fonction("drawEqPrintTacheMark"), /: eqPrintOpposeFontSize\(r, revealed\);/);
  // (relecture du monde 5, 27/09/2026) plus aucun logo IREMI dans l'outil, relatifs comme entiers naturels
  assert.doesNotMatch(fonction("createEquationPrintHeader"), /iremLogo|IREM_PRINT_LOGO_URL/);
  assert.match(fonction("getEquationPrintInstruction"), /sauf les taches «\\u00a0opposé\\u00a0»\\u00a0: elles cachent l’opposé de cette valeur\./);
});

test("R1 : ÉquaSplat conclut une solution nulle (4𝑥 = 0), jamais −𝑥 = 0 sans « Prendre l'opposé »", () => {
  const g = fonction("getConclusionInfo", equasplat);
  assert.match(g, /if\(right\.length === 0 && allSameXSign\(left\) && xSign\(left\[0\]\) > 0\)\{\s*return \{value:0, count:left\.length, xSide:"left", tokenSide:"right"\};/);
  assert.match(g, /if\(left\.length === 0 && allSameXSign\(right\) && xSign\(right\[0\]\) > 0\)\{\s*return \{value:0, count:right\.length, xSide:"right", tokenSide:"left"\};/);
  assert.ok(g.indexOf("value:0") < g.indexOf("if(left.length === 0 || right.length === 0) return null;"));
});

/* R3 (27/09/2026, décision de Gwenaël) : au livret 2, la lettre sur chaque tache imprimée —
   « 𝑡 », « −𝑡 » — et, dans le corrigé, la valeur de −𝑡 sous une tache « −𝑡 ». Le livret 1 garde
   « opposé ». Et à l'écran, la tache est opaque (on devinait le nombre en projection). */
function marques(lettre, carte = { family: "EQPM" }) {
  const poses = [];
  const c = vm.createContext({ tachesLettre: lettre, clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    isSignedEquationFamily: (k) => k.family === "EQPM", getCardVarChar: () => "𝑡",
    eqPrintOpposeFontSize: () => 20 });
  vm.runInContext(fonction("drawEqPrintTacheMark") + fonction("eqPrintHiddenValue")
    + ";globalThis.m=drawEqPrintTacheMark;globalThis.v=eqPrintHiddenValue;", c);
  const g = { appendChild: (t) => poses.push(t) };
  const texte = (x, y, label, attrs) => ({ label, attrs });
  const s = { cx: 0, cy: 0, r: 74 };
  return {
    poser: (opposee, devoilee) => { poses.length = 0; const r = c.m(g, texte, s, carte, opposee, devoilee); return { r, poses: poses.map((p) => p.label) }; },
    valeur: (val, opposee) => c.v(carte, val, opposee)
  };
}

test("R3 : « taches=lettre » — 𝑡 et −𝑡 sur les taches imprimées, la valeur de −𝑡 dessous ; sans lui, rien ne change", () => {
  const sans = marques(false);
  assert.deepEqual(sans.poser(false, false), { r: false, poses: [] });
  assert.deepEqual(sans.poser(true, false), { r: false, poses: ["opposé"] });
  assert.deepEqual(sans.poser(true, true), { r: true, poses: ["opposé"] });
  assert.equal(sans.valeur(3, true), 3, "livret 1 : sous « opposé », la valeur de 𝑡");
  const avec = marques(true);
  assert.deepEqual(avec.poser(false, false), { r: false, poses: ["𝑡"] });
  assert.deepEqual(avec.poser(true, false), { r: false, poses: ["−𝑡"] });
  assert.deepEqual(avec.poser(false, true), { r: true, poses: ["𝑡"] });
  assert.deepEqual(avec.poser(true, true), { r: true, poses: ["−𝑡"] });
  assert.equal(avec.valeur(3, true), -3, "sous « −𝑡 », la valeur de −𝑡");
  assert.equal(avec.valeur(-4, true), 4);
  assert.equal(avec.valeur(0, true), 0);
  assert.equal(avec.valeur(3, false), 3);
  // hors relatifs (monde 5), le réglage ne fait rien
  const m5 = marques(true, { family: "EQ" });
  assert.deepEqual(m5.poser(false, false), { r: false, poses: [] });
  assert.equal(m5.valeur(3, true), 3);
  // l'adresse : lue une fois pour la page, redonnée par le lien partagé
  assert.match(outil, /tachesLettre = params\.get\("taches"\) === "lettre";/);
  assert.match(outil, /if\(tachesLettre && isSignedEquationModeValue\(act\)\) params\.set\("taches", "lettre"\);/);
  // les jetons cachés dévoilés passent par eqPrintHiddenValue dans les trois scènes
  assert.equal((outil.match(/(?<!function )eqPrintHiddenValue\(card, /g) || []).length, 3);
  // la consigne le dit
  assert.match(fonction("getEquationPrintInstruction"), /if\(hasOpposed && tachesLettre\) note = "Les taches cachent toutes la même valeur, sauf celles qui ont un «\\u00a0−\\u00a0» devant la lettre\\u00a0: elles cachent l’opposé de cette valeur\.";/);
});

test("R3 : le livret 2 imprime la lettre (fiches, corrigé, exemple, couverture, dos) ; le livret 1 garde « opposé »", () => {
  const v1 = render.slice(render.indexOf('"livret1": dict('), render.indexOf('"livret2": dict('));
  const v2 = render.slice(render.indexOf('"livret2": dict('), render.indexOf("# ------------------------------------------------------------------ les livrets corrigés"));
  assert.doesNotMatch(v1, /lettre=True/);
  assert.match(v2, /lettre=True,/);
  assert.match(render, /\+ \("&taches=lettre" if lettre else ""\)\)/, "les fiches et les corrigés");
  assert.match(render, /\+ \("&taches=lettre" if v\.get\("lettre"\) else ""\)\)/, "l'exemple de couverture");
  assert.match(render, /adresse_fiche\(f, corr\["imprime"\] if corr else "statement", v\.get\("lettre", False\)\)/);
  assert.match(render, /if donnees\.get\("lettre"\):\s+r = await pg\.evaluate\(JS_LETTRE, page\)/);
});

test("R3 : à l'écran, la tache est opaque (le papier ne change pas)", () => {
  assert.match(fonction("renderCardEquation"), /const cover = "#000";/);
  assert.match(fonction("renderCardEquationPrint"), /const cover = "rgba\(0,0,0,0\.95\)";/);
});

test("R3 : la tache de la couverture des livrets du monde 6 porte « −𝑥 »", () => {
  const couv = lire(SRC + "couverture.html");
  assert.match(couv, /<text class="lettre"[^>]*>−𝑥<\/text>/);
  assert.doesNotMatch(couv, /<text class="lettre"[^>]*>𝑥<\/text>/);
});
