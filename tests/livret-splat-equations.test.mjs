/* Les deux livrets « SPLAT! Équations » du monde 5 (lot Q3, 24/09/2026) : « schéma en barres »
   et « équation », les MÊMES 36 cartes (fiches 35, 36, 37), 8 pages chacun, à plier.

   Rendus par _sources/livret-splat-equations/render.py à partir de l'outil du site : leurs
   fiches doivent être EXACTEMENT celles de la carte des mondes (mêmes réglages, mêmes graines,
   mêmes titres), et le QR de chaque fiche doit rejouer les mêmes équations sous la même étoile.
   On EXÉCUTE les données de la carte des mondes, le script de la page courte des QR et la
   conversion de l'outil (leçon du lot L : chercher du texte ne dit rien des adresses réellement
   construites), puis on relit les PDF publiés. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;

const univers = lire("outils/splat_univers.html");
const outil = lire("outils/splat_equations.html");
const courte = lire("splat/equations/livret/index.html");
const SRC = "_sources/livret-splat-equations/";
const render = lire(SRC + "render.py");
const couv = lire(SRC + "couverture.html"), dos = lire(SRC + "dos.html");
const cartes = JSON.parse(lire(SRC + "cartes.json"));

// ------------------------------------------------ la carte des mondes, exécutée
function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent, decodeURIComponent, escape, unescape, atob, btoa });
vm.runInContext(bloc("const PS=", "const PROF =") + ";globalThis.X={MONDES};", ctx, { filename: "splat_univers.html" });
const { MONDES } = JSON.parse(JSON.stringify(ctx.X));
const EQUATIONS = MONDES.find((m) => m.idp === "e2");
const decode = (b64) => JSON.parse(Buffer.from(b64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
const donnees = (url) => decode(url.slice(url.indexOf("#data=") + 6));

// ------------------------------------------------ render.py, lu
const py = (nom) => {
  const m = render.match(new RegExp(`^${nom}\\s*=\\s*"([^"]+)"`, "m"));
  assert.ok(m, `${nom} introuvable dans render.py`);
  return m[1];
};
const js = (nom) => {
  const m = univers.match(new RegExp(`const ${nom}="([^"]+)";`));
  assert.ok(m, `${nom} introuvable dans splat_univers.html`);
  return m[1];
};
const REGLAGES = ["EQ5_S1", "EQ5_S2", "EQ5_S3", "EQ5_PAQUETS", "EQ5_DEUX_COTES"];
/* (relecture du monde 5, 27/09/2026) les fiches 36 et 37 sont des séries enchaînées : la suite est
   une liste, dans render.py comme dans la carte des mondes */
const pyListe = (nom) => {
  const m = render.match(new RegExp(`^${nom}\\s*=\\s*\\[([^\\]]+)\\]`, "m"));
  assert.ok(m, `${nom} introuvable dans render.py`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};
const jsListe = (nom) => {
  const m = univers.match(new RegExp(`const ${nom}=\\[([^\\]]+)\\];`));
  assert.ok(m, `${nom} introuvable dans splat_univers.html`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};
const SUITES = ["EQ5_PAQUETS_SUITE", "EQ5_DEUX_COTES_SUITE"];
const FICHES_PY = [...render.matchAll(/dict\(n=(\d+), t="([^"]+)",\s+parties=\[([^\]]+)\],\s+parcours="(m3e\d)"/g)]
  .map((m) => ({ n: Number(m[1]), t: m[2], parties: m[3].split(",").map((s) => s.trim()), parcours: m[4] }));

test("Q3 : les réglages et les graines des fiches sont ceux de la carte des mondes", () => {
  for (const nom of REGLAGES) assert.equal(py(nom), js(nom), nom);
  for (const nom of SUITES) assert.deepEqual(pyListe(nom), jsListe(nom), nom);
  assert.equal(jsListe("EQ5_PAQUETS_SUITE").length, 3);
  assert.equal(jsListe("EQ5_DEUX_COTES_SUITE").length, 2);
  assert.deepEqual(FICHES_PY.map((f) => f.parties), [["EQ5_S1", "EQ5_S2", "EQ5_S3"], ["EQ5_PAQUETS", "*EQ5_PAQUETS_SUITE"], ["EQ5_DEUX_COTES", "*EQ5_DEUX_COTES_SUITE"]]);
});

test("Q3 : une fiche = une étape = une étoile — fiches 35, 36, 37, titres de la carte", () => {
  assert.deepEqual(FICHES_PY.map((f) => f.n), EQUATIONS.etapes.map((e) => e.n));
  assert.deepEqual(FICHES_PY.map((f) => f.n), [35, 36, 37]);
  assert.deepEqual(FICHES_PY.map((f) => f.t), EQUATIONS.etapes.map((e) => e.t));
  assert.deepEqual(FICHES_PY.map((f) => f.parcours), EQUATIONS.etapes.map((e) => e.p));
  // la fiche est imprimée à l'adresse du lien « Fiche » de la carte : 6/page, énoncé seul, titre
  assert.match(render, /&print=\{imprime\}&layout=6"\n\s+f"&title=\{quote\('Fiche ' \+ str\(f\['n'\]\) \+ ' — ' \+ f\['t'\], safe=''\)\}"/);
  assert.match(render, /def adresse_fiche\(f, vue, imprime="statement"\):/, "l'énoncé seul par défaut (lot Q4 : la correction courte pour les corrigés)");
  EQUATIONS.etapes.forEach((e) => {
    assert.match(e.f, /&view=schema[&;]/, `fiche ${e.n} : le lien « Fiche tableau » est en vue schéma`);
    assert.match(e.fe, /&view=equation[&;]/, `fiche ${e.n} : le lien « Fiche équation » est en vue équation`);
  });
  // les deux livrets et leurs vues
  assert.match(render, /"schema": dict\(\n\s+sortie="livret_splat_equations_schema",\n\s+vue="schema",/);
  assert.match(render, /"equation": dict\(\n\s+sortie="livret_splat_equations_equation",\n\s+vue="equation",/);
});

test("Q3 : les 36 cartes des livrets sont celles du jeu en ligne, carte par carte (cartes.json)", () => {
  assert.deepEqual(Object.keys(cartes.fiches), ["35", "36", "37"]);
  EQUATIONS.etapes.forEach((e) => {
    const serie = donnees(e.j).serie;
    assert.equal(serie.length, 12, `fiche ${e.n} : 12 équations en ligne`);
    assert.deepEqual(cartes.fiches[String(e.n)], serie, `fiche ${e.n} : mêmes équations que « Le jeu de l'élève »`);
  });
  // render.py le vérifie à chaque rendu, et les deux livrets ont les mêmes cartes
  assert.ok(render.includes("les cartes ne sont pas celles du jeu en ligne"));
  assert.ok(render.includes("les livrets n'ont pas tous les mêmes cartes"));
});

// ------------------------------------------------ la page courte des QR, exécutée
function cibleCourte(search) {
  const script = courte.match(/<script>([\s\S]*?)<\/script>/)[1];
  let cible = null;
  const window = { location: { search, origin: "https://mathsgo.re", replace: (u) => { cible = u; } } };
  new Function("window", "URLSearchParams", "URL", "encodeURIComponent", script)(window, URLSearchParams, URL, encodeURIComponent);
  return cible.replace("https://mathsgo.re", "");
}

test("Q3 : le QR d'une fiche ouvre sa série et son étoile (?f=35, 36, 37) — le lien exact « Le jeu de l'élève »", () => {
  assert.equal(py("COURTE"), "/splat/equations/livret/");
  assert.match(render, /return f"\{SITE\}\{COURTE\}\?f=\{n\}"/);
  EQUATIONS.etapes.forEach((e) => {
    assert.equal(cibleCourte(`?f=${e.n}`), e.j, `?f=${e.n}`);
    assert.ok(e.j.startsWith(`/outils/equasplat.html?eleve=1&parcours=${e.p}#data=`), `?f=${e.n} : ÉquaSplat, étoile ${e.p}`);
    assert.ok(existe(`${SRC}qr/fiche${e.n}.png`), `qr/fiche${e.n}.png`);
    assert.ok(courte.includes(`href="${e.j.replace(/&/g, "&amp;")}"`), `lien de repli de la fiche ${e.n}`);
  });
  // hors bornes : la carte des mondes (?f=35d… : le défi, lot Q5, testé plus bas)
  for (const q of ["?f=38d", "?f=34", "?f=", "?s=0", "?s=4", "?s=d3", "", "?x=1"])
    assert.equal(cibleCourte(q), "/outils/splat_univers.html", q);
  assert.ok(existe(`${SRC}qr/univers.png`));
});

/* Les séries du dos (décision du 24/09/2026) : six équations au hasard, aux réglages d'une
   fiche, jouées dans ÉquaSplat sans étoile. On recalcule ici l'adresse attendue à partir des
   réglages de la carte des mondes. */
const sansGraine = (q, n) => q.replace(/&seed=\d+/, "").replace(/cards=\d+/, `cards=${n}`);
const OUTIL = "/outils/splat_equations.html?";
const SERIES_ATTENDUES = {
  1: OUTIL + sansGraine(js("EQ5_S1"), 2) + "&jouer=1&suite=" +
     [sansGraine(js("EQ5_S2"), 2), sansGraine(js("EQ5_S3"), 2)].map(encodeURIComponent).join(";"),
  // (27/09/2026) comme les fiches : 3 cartes à 2-3 taches + 3 à 4-6 taches ; 2 + 2 + 2 des deux côtés
  2: OUTIL + sansGraine(js("EQ5_PAQUETS"), 3) + "&jouer=1&suite=" + encodeURIComponent(sansGraine(jsListe("EQ5_PAQUETS_SUITE")[1], 3)),
  3: OUTIL + sansGraine(js("EQ5_DEUX_COTES"), 2) + "&jouer=1&suite=" +
     jsListe("EQ5_DEUX_COTES_SUITE").map((q) => encodeURIComponent(sansGraine(q, 2))).join(";"),
};

test("Q3 : les séries du dos (?s=1, 2, 3) — six équations sans graine, jouées sans étoile", () => {
  assert.match(render, /^SERIE_CARTES = 6$/m);
  for (const [s, attendue] of Object.entries(SERIES_ATTENDUES)) {
    const cible = cibleCourte(`?s=${s}`);
    assert.equal(cible, attendue, `?s=${s}`);
    const q = new URLSearchParams(cible.split("?")[1]);
    assert.equal(q.get("seed"), null, "pas de graine : de nouvelles équations à chaque scan");
    assert.equal(q.get("parcours"), null, "aucune étoile");
    assert.equal(q.get("jouer"), "1");
    const parties = [q, ...(q.get("suite") ? q.get("suite").split(";").map((p) => new URLSearchParams(p)) : [])];
    assert.equal(parties.reduce((n, p) => n + Number(p.get("cards")), 0), 6, `?s=${s} : six équations`);
    parties.forEach((p) => { assert.equal(p.get("seed"), null); assert.equal(p.get("unknown"), "letter"); });
    assert.ok(existe(`${SRC}qr/serie-${s}.png`), `qr/serie-${s}.png`);
    assert.ok(courte.includes(`href="${cible.replace(/&/g, "&amp;")}"`), `lien de repli de la série ${s}`);
  }
  // « Un par un » : les trois formes de la fiche 35, 2 + 2 + 2
  assert.deepEqual(new URLSearchParams(cibleCourte("?s=1").split("?")[1]).get("suite").split(";")
    .map((p) => new URLSearchParams(p).get("form")), ["AX_EQ_C", "ONE_SIDE"]);
  assert.ok(render.includes('"1": [sans_graine(EQ5_S1, 2), sans_graine(EQ5_S2, 2), sans_graine(EQ5_S3, 2)]'));
});

// ------------------------------------------------ l'outil : « jouer=1 »
test("Q3 : l'outil — « jouer=1 » tire la série et l'ouvre dans le jeu d'ÉquaSplat, sans parcours", () => {
  assert.match(outil, /const sharedNames = \[[^\]]*"suite", "jouer", "zero", "taches"\]/);
  assert.match(outil, /jeuAuto = params\.get\("jouer"\) === "1";/);
  assert.match(outil, /if\(impressionAuto\) printSheet\(\);\nif\(jeuAuto\) ouvrirSerieDansEquaSplat\(\);\n/);
  assert.match(outil, /const EQUASPLAT_JEU_URL = "\/outils\/equasplat\.html\?eleve=1";/);
  assert.doesNotMatch(outil, /EQUASPLAT_JEU_URL = "[^"]*parcours/, "aucune étoile");
  assert.match(outil, /const payload = \{ source:"univers_splat", serie \};\n\s+window\.location\.replace\(`\$\{EQUASPLAT_JEU_URL\}#data=\$\{encodeEquabarPayload\(payload\)\}`\);/);
  // la conversion d'une carte : les taches en « x », puis la somme des jetons, par côté —
  // exécutée ici sur une carte d'essai (2 taches et deux paquets 7 et 5 contre un paquet de 27)
  const src = outil.slice(outil.indexOf("function carteDuJeuEquaSplat(card){"), outil.indexOf("/* « jouer=1 » : la série tirée"));
  const bac = vm.createContext({
    buildEquationEquaSplatPayload: () => ({ source: "splat_equations", variable: "𝑛", unknownDisplay: "letter",
      universe: "positive", numberMode: "grouped", signedWritingMode: "simplified", x: 10,
      left: [{ type: "x" }, { type: "number", value: 7 }, { type: "x" }, { type: "number", value: 5 }],
      right: [{ type: "number", value: 27 }, { type: "number", value: 5 }] }),
  });
  vm.runInContext(src + ";globalThis.c=carteDuJeuEquaSplat({});", bac);
  assert.deepEqual(JSON.parse(JSON.stringify(bac.c)), { source: "splat_equations", variable: "𝑛", unknownDisplay: "letter",
    universe: "positive", numberMode: "grouped", signedWritingMode: "simplified", x: 10, left: ["x", "x", 12], right: [32] });
});

// ------------------------------------------------ l'exemple de couverture
test("Q3 : l'exemple de la couverture — 3𝑛 + 12 = 27, dessiné par l'outil, aucune carte du livret", () => {
  const q = new URLSearchParams(py("EXEMPLE"));
  assert.equal(q.get("seed"), "79");
  assert.equal(q.get("cards"), "1");
  assert.equal(q.get("unknown"), "letter");
  assert.deepEqual([cartes.exemple.left, cartes.exemple.right, cartes.exemple.x], [["x", "x", "x", 12], [27], 5]);
  const cle = (c) => [c.left, c.right].map((r) => `${r.filter((t) => t === "x").length}x+${r.filter((t) => t !== "x").reduce((a, b) => a + b, 0)}`).sort().join("=");
  const toutes = new Set(Object.values(cartes.fiches).flat().map(cle));
  assert.equal(toutes.size, 36, "36 équations différentes");
  assert.ok(!toutes.has(cle(cartes.exemple)), "l'exemple n'est aucune carte du livret");
  assert.ok(render.includes("l'exemple de couverture est une carte du livret"));
  // les deux dessins sont ceux de l'outil : la résolution pas à pas (taches transparentes) et la
  // correction imprimée du mode Équation, dont on ne garde que les schémas ou l'équation
  assert.match(render, /renderCardEquationStepPrintScene\(g, c, etats\.length, \{layoutMode: vue, showIntroText: false, showAid: false/);
  assert.match(render, /renderCardIntoSvg\(s2, Object\.assign\(\{\}, c, \{family: 'EQ'\}\), 'correction'\);/);
  // les textes sur l'exemple sont écrits à partir de la carte rendue
  assert.match(render, /intro=textes_exemple\(ex, v\)/);
});

// ------------------------------------------------ les quatre PDF publiés
const SORTIES = ["livret_splat_equations_schema", "livret_splat_equations_equation"];
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

test("Q3 : les quatre PDF — 8 pages A4 dans l'ordre, 4 feuilles A3 imposées, légers", () => {
  for (const s of SORTIES) {
    assert.equal(nombreDePages(`outils/${s}.pdf`), 8, `${s}.pdf`);
    assert.equal(nombreDePages(`outils/${s}_a_plier.pdf`), 4, `${s}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}.pdf`) < 3_000_000, `${s}.pdf reste léger (qpdf)`);
  }
  assert.match(render, /for g, d in \[\(8, 1\), \(2, 7\), \(6, 3\), \(4, 5\)\]:/);
});

function texteDesPages(p) {
  const fl = flux(p);
  const tables = [];
  for (const f of fl) {
    if (!f.includes("begincmap")) continue;
    const t = new Map();
    for (const b of f.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for (const m of b.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
        t.set(m[1].toLowerCase(), String.fromCodePoint(...(m[2].match(/.{4}/g) || []).map((h) => parseInt(h, 16))));
    for (const b of f.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for (const m of b.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
        // la destination peut être une paire de substituts (lettres mathématiques 𝑥, 𝑏… : <d835><dc65>)
        const a = parseInt(m[1], 16), z = parseInt(m[2], 16), c = (m[3].match(/.{4}/g) || []).map((h) => parseInt(h, 16));
        for (let k = a; k <= z && k - a < 1024; k++) {
          const u = c.slice(); u[u.length - 1] += k - a;
          t.set(k.toString(16).padStart(4, "0"), String.fromCodePoint(...u));
        }
      }
    if (t.size) tables.push(t);
  }
  const pages = [];
  for (const s of fl) {
    if (!s.includes(" Tj")) continue;
    const bornes = [...s.matchAll(/\/F\d+\s+[\d.]+\s+Tf/g)].map((m) => m.index);
    bornes.push(s.length);
    let texte = "";
    for (let k = 0; k < bornes.length - 1; k++) {
      const codes = [...s.slice(bornes[k], bornes[k + 1]).matchAll(/<([0-9a-fA-F]{4})>\s*Tj/g)].map((m) => m[1].toLowerCase());
      if (!codes.length) continue;
      let meilleure = null, score = 0;
      for (const t of tables) {
        const n = codes.filter((c) => t.has(c)).length;
        if (n > score) { score = n; meilleure = t; }
      }
      if (meilleure) texte += codes.map((c) => meilleure.get(c) ?? "").join("");
    }
    pages.push(texte);
  }
  return pages;
}
// Chromium écrit « fi » en ligature (U+FB01)
const norm = (t) => t.replace(/\s+/g, " ").replace(/ /g, " ").replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl");

test("Q3 : dans les PDF — la couverture de chaque livret, les fiches 35 à 37 et leur « bis » dans l'ordre, le dos", () => {
  SORTIES.forEach((s, l) => {
    const pages = texteDesPages(`outils/${s}.pdf`).map(norm);
    assert.equal(pages.length, 8, `${s} : huit pages de texte`);
    assert.match(pages[0], /Nom, prénom/);
    assert.match(pages[0], /MONDE 5/i);
    assert.match(pages[0], l === 0 ? /SCHÉMA EN BARRES/i : /L'ÉQUATION/i, `${s} : la couverture dit quel livret`);
    assert.match(pages[0], /Sur cette carte, il y a la même quantité de jetons/);
    assert.match(pages[0], l === 0 ? /en haut et en bas/ : /à gauche et à droite/);
    assert.match(pages[0], /deux paquets de 7 et 5 jetons/);
    assert.match(pages[0], /on voit les 5 jetons que chacune cache/);
    const titres = ["Fiche 35 —", "Fiche 35 bis —", "Fiche 36 —", "Fiche 36 bis —", "Fiche 37 —", "Fiche 37 bis —"];
    titres.forEach((t, k) => assert.ok(pages[1 + k].includes(t), `${s}, page ${2 + k} : « ${t} »`));
    // (la boîte du QR, « J'ai terminé ma fiche », est posée par render.py, qui s'arrête sinon ;
    // l'extracteur de ce test ne lit pas sa police — pdftotext, lui, la lit)
    for (let k = 1; k < 7; k++) {
      assert.match(pages[k], l === 0 ? /Même quantité en haut et en bas/ : /Même quantité à gauche qu'à droite/);
    }
    assert.match(pages[0], l === 0 ? /on enlève 12 des deux plateaux/ : /on enlève 12 des deux côtés/, `${s} : le geste dit dans les mots du livret`);
    // (l'extracteur de ce test perd certaines lettres des mots en gras : on cherche des morceaux sûrs)
    const sansBlanc = (t) => t.replace(/ /g, "");
    assert.ok(sansBlanc(pages[7]).includes(sansBlanc(l === 0
      ? "ajouter, enlever ou partager : il reste toujours la même quantité en haut et en bas"
      : "ajouter, enlever ou partager : il reste toujours la même quantité à gauche et à droite")), `${s} : la règle juste (24/09)`);
    assert.match(pages[7], /Le but/);
    assert.match(pages[7], /Et après/);
    assert.match(pages[7], /Six nouvelles équations/);
    assert.match(pages[7], /monde 6, SPLAT! relatifs/);
  });
});

// ------------------------------------------------ les règles des documents du collège
test("Q3 : couverture et dos sans logo, signature et licence au pied, lisible en noir et blanc", () => {
  // relecture du monde 1, lot 2 (25/09/2026) : plus aucun logo sur la couverture ; relecture du
  // monde 5 (27/09/2026) : au dos, le seul logo maths&go à côté du crédit, comme les relatifs —
  // ni IREMI, ni Unité apprenante (« c'est que moi tout seul »)
  for (const [nom, t] of [["couverture", couv], ["dos", dos]])
    assert.match(t, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/, nom);
  assert.doesNotMatch(couv, /logos\/(?:mathsgo|irem)\/logo-print\.png/, "couverture : aucun logo");
  assert.equal((dos.match(/logos\/mathsgo\/logo-print\.png/g) || []).length, 1, "dos : le logo maths&go, une fois");
  assert.doesNotMatch(dos.replace(/\/\*[\s\S]*?\*\//g, ""), /irem|IREMI|ua-debre|Unité apprenante/i, "dos : ni IREMI ni Unité apprenante");
  assert.match(dos, /Livret et outils <b>SPLAT! Équations<\/b> et <b>ÉquaSplat<\/b> de maths&amp;go\./);
  assert.match(render, /JS_SANS_LOGO = """\(\) => \{/, "les logos des pages-fiches retirés au rendu");
  const css = lire(SRC + "commun.css");
  assert.match(css, /\.pied\{[^}]*font-size:10px;[^}]*color:#64748b;/);
  // le teal ne sert qu'aux fonds : aucun texte teal clair sur du blanc (#115e59 pour le texte)
  for (const [nom, t] of [["commun.css", css], ["couverture", couv], ["dos", dos]])
    assert.doesNotMatch(t.replace(/\/\*[\s\S]*?\*\//g, ""), /(?:^|[;{])color:#(?:08aaa5|4cc7c3|9fdcd9)/i, `${nom} : pas de texte teal clair`);
  assert.match(render, /PIED_LIVRET = "mathsgo\.re\/splat · CC BY-NC-SA 4\.0"/);
  // les crédits : le clin d'œil à Steve Wyborney ; plus de crédit de progression (27/09/2026)
  assert.equal((dos.match(/Claire/g) || []).length, 0);
  assert.match(dos, /Steve Wyborney/);
  assert.equal((couv.match(/Claire/g) || []).length, 0);
});

test("Q3 : le bandeau des fiches sur deux étages, la lettre arrondie, pas de flèche au livret schéma", () => {
  assert.match(render, /^TITRE_BANDEAU = "Splat!<small>Équations<\/small>"$/m);
  assert.match(render, /await pg\.add_style_tag\(content=CSS_QR \+ CSS_TITRE_OUTIL \+ \(CSS_TITRE_CORR if corr else ""\)\)/);
  // plus la vieille règle fausse (« quand il ne reste que des taches, on partage »)
  assert.doesNotMatch(render + dos, /Quand il ne reste que des taches/);
  // le livret schéma n'a pas de flèche : ses icônes sont des schémas en barres
  const schema = render.slice(render.indexOf('"schema": dict('), render.indexOf('"equation": dict('));
  assert.ok(!schema.includes("FLECHES") && schema.includes("MINI_SCH_ENLEVE"));
  // la lettre : le caractère de l'appli (𝑥), police nommée
  assert.match(lire(SRC + "commun.css"), /@font-face\{font-family:"x-arrondi";src:local\("FreeSerif"\)/);
  assert.ok(couv.includes(">𝑥</text>") && dos.includes(">𝑥</text>"));
});

test("Q3 (correctif) : le dos écrit la lettre de l'exemple, l'équation comme l'outil, le moins lisible", () => {
  // relevé par Code sur la PR #828 : le dos disait 3𝑥 + 12 = 27 « comme l'exemple », qui est en 𝑛
  assert.ok(render.includes('souvenir = [(ic.replace("𝑥", ex["variable"]), txt) for ic, txt in v["souvenir"]]'));
  assert.ok(render.includes("refaire les petits dessins du dos"), "render.py s'arrête si l'exemple change");
  // l'équation du dos en Times italique, comme la correction de l'outil sur la couverture
  assert.match(dos, /\.mini-eq\{font-family:"x-arrondi",'Times New Roman',Times,serif;font-style:italic;/);
  // le moins : le tiret demi-cadratin de Poppins (son « − » est plus court qu'un tiret)
  assert.ok(render.includes("({sd}{nb}–{nb}{sg}"), "le moins de l'exemple");
  assert.doesNotMatch(render, /− 12<\/text>/, "le moins des flèches du dos");
  // et celui des flèches de l'outil, dans la fenêtre « L'équation » de la couverture
  assert.ok(render.includes('svg2 = ex["svg2"].replace(">− ", ">– ")'), "le moins des flèches de la couverture");
  const p0 = norm(texteDesPages("outils/livret_splat_equations_equation.pdf")[0]);
  assert.ok(p0.includes("27 – 12 = 15"), "couverture : 27 – 12 = 15");
});

test("Q3 : le vocabulaire — schéma en barres, jamais « tableau » ; l'inconnue en lettre", () => {
  const readme = lire(SRC + "README.md");
  for (const [nom, t] of [["couverture", couv], ["dos", dos], ["README", readme], ["render.py", render]]) {
    // « tableau » n'apparaît que pour dire qu'on ne l'emploie pas
    const sans = t.replace(/Le mot « tableau » n'est pas employé|\(Le mot « tableau » n'est pas employé/g, "");
    assert.doesNotMatch(sans, /tableau/i, `${nom} : pas de « tableau »`);
  }
  assert.doesNotMatch(couv + dos, /«&nbsp;\?&nbsp;»|« \? »/, "pas de « ? » : la lettre seulement");
  assert.match(couv, /<div class="champ"><span>Nom, prénom<\/span><\/div>/);
});

// ------------------------------------------------ la page des livrets et la carte des mondes
const pageLivrets = lire("outils/livrets_splat.html");
test("page des livrets : l'onglet du monde 5, ses deux livrets, leurs couvertures", () => {
  const debut = pageLivrets.indexOf('<section class="panneau" data-m="5" id="monde-5"');
  assert.ok(debut > 0, "panneau du monde 5");
  const p = pageLivrets.slice(debut, pageLivrets.indexOf("</section>", debut));
  assert.ok(p.includes('role="tabpanel" aria-labelledby="onglet-5" hidden>'));
  assert.ok(p.includes('<h2 class="monde-nom">Monde 5 · SPLAT! Équations</h2>'));
  // (relecture du 27/09/2026) deux familles derrière deux boutons, chacune son livret et SON défi
  assert.match(p, /<button type="button" data-serie="schema" aria-pressed="true">Le schéma en barres<\/button>\s*<button type="button" data-serie="equation" aria-pressed="false">L’équation<\/button>/);
  assert.equal((p.match(/<div class="grille n2">/g) || []).length, 2);
  assert.equal((p.match(/<article class="liv">/g) || []).length, 4);
  const iS = p.indexOf('<div class="serie" data-serie="schema">'), iE = p.indexOf('<div class="serie" data-serie="equation">');
  assert.ok(iS > 0 && iE > iS);
  for (const s of ["livret_splat_equations_schema", "livret_splat_equations_schema_defi"]) { const k = p.indexOf(`href="/outils/${s}.pdf"`); assert.ok(k > iS && k < iE, s); }
  for (const s of ["livret_splat_equations_equation", "livret_splat_equations_equation_defi"]) assert.ok(p.indexOf(`href="/outils/${s}.pdf"`) > iE, s);
  let avant = -1;
  for (const s of SORTIES) {
    const a = p.indexOf(`href="/outils/${s}.pdf"`), b = p.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(a > avant && b > a, `${s} : PDF puis « à plier », dans l'ordre`);
    avant = b;
  }
  assert.match(p, /<h3>Le schéma en barres<\/h3>[\s\S]*<h3>L’équation<\/h3>/);
  assert.match(pageLivrets, /\[data-m="5"\]\{--c:#08aaa5;--c-plein:#0f766e;/);
  assert.match(pageLivrets, /<nav class="onglets" id="onglets" data-n="6" role="tablist"/);
  for (const nom of ["livret-splat-equations-schema", "livret-splat-equations-equation", "livret-splat-equations-schema-defi", "livret-splat-equations-equation-defi"]) {
    const png = `assets/img/thumbnails/splat/${nom}.png`, webp = `assets/img/thumbnails/splat/${nom}.webp`;
    assert.ok(existe(png) && existe(webp), nom);
    assert.ok(taille(webp) < taille(png), `${nom} : la WebP est plus légère`);
    const b = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [993, 1404], `${nom} : page 1 rendue à 120 dpi`);
    assert.ok(p.includes(`src="/assets/img/thumbnails/splat/${nom}.png?v=3"`), `${nom} : sur la page`);
  }
});

test("carte des mondes, vue prof : un seul lien sous le monde 5, vers l'onglet de ses livrets", () => {
  const b = univers.match(/\(m===MONDE_EQUATIONS&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/);
  assert.ok(b, "bloc du lien du monde 5 introuvable");
  // relecture du monde 1, lot 2 (25/09/2026) : comme au monde 1, un seul lien ; les PDF sont sur la
  // page des livrets
  assert.ok(b[0].includes('<a class="introLien livret" href="/outils/livrets_splat.html#monde-5">\\ud83d\\udcda Les livrets du monde 5</a>'));
  assert.equal((b[0].match(/class="introLien/g) || []).length, 1, "un seul lien");
  for (const s of SORTIES) assert.ok(!b[0].includes(`href="/outils/${s}.pdf"`), `${s} : plus de bouton de PDF`);
  assert.doesNotMatch(b[0], /bord court|recto-verso/, "la note ne parle plus d'impression");
  for (const s of SORTIES) assert.ok(pageLivrets.includes(`href="/outils/${s}.pdf"`), `${s} : sur la page des livrets`);
  assert.match(univers, /\.monde\.m3 \.introLien\.livret\{color:#115e59;background:#e6f7f6;border-color:#9fdcd9\}/);
});

/* ------------------------------------------------------------------ lot Q4 (24/09/2026)
   Les deux livrets CORRIGÉS du monde 5 — une correction par livret : « par le schéma en
   barres » pour le livret schéma, « par l'équation » pour le livret équation. L'outil
   imprime lui-même ses fiches corrigées (corrections courtes 6/page, voir
   tests/splat-equations-correction-courte.test.mjs) : mêmes 8 pages, mêmes cartes aux
   mêmes places, taches dévoilées. Couverture « Correction » / « Livret corrigé — … »,
   boîte du QR « Je rejoue ces cartes en ligne », pied « · correction ». */
const CORRIGES = SORTIES.map((s) => s + "_correction");

test("Q4 : render.py — une correction par livret, la correction courte de l'outil, la lettre seulement", () => {
  assert.match(render, /"schema":\s+dict\(suffixe="_correction", imprime="correction-schema",\s+dit="par le schéma en barres"\)/);
  assert.match(render, /"equation": dict\(suffixe="_correction", imprime="correction-equation", dit="par l'équation"\)/);
  // la fiche corrigée est imprimée à l'adresse du lien « Fiche », avec print=correction-… à la place de statement
  assert.match(render, /def adresse_fiche\(f, vue, imprime="statement"\):/);
  assert.match(render, /&print=\{imprime\}&layout=6"/);
  assert.match(render, /adresse_fiche\(f, v\["vue"\], corr\["imprime"\] if corr else "statement"\)/);
  // pas de version « ? » (décision du 24/09) : aucune adresse en unknown=question
  assert.doesNotMatch(render, /unknown=question/);
  // pied, boîte du QR, couverture
  assert.match(render, /PIED_CORRECTION = PIED_LIVRET \+ " · correction"/);
  assert.match(render, /JS_PIED, PIED_CORRECTION if corr else PIED_LIVRET/);
  assert.match(render, /QR_PROF = "Je rejoue<br>ces cartes<em>en ligne<\/em>"/);
  assert.match(render, /\[QR_PROF, QR_ELEVE\] if corr else \[QR_ELEVE, None\]/, "la boîte du corrigé prend la largeur du texte de l'élève");
  assert.match(render, /PROF = dict\(bandeau="Correction", ligne="Livret corrigé"\)/);
  assert.match(render, /\.bandeau-prof\{flex:0 0 14mm;[^}]*background:#b91c1c;color:#fff;/);
  assert.match(render, /prof=dict\(PROF, dit=corr\["dit"\]\) if corr else None/);
  // le titre du corrigé a trois lignes au plus, chacune entière ; le livret de l'élève garde sa règle
  assert.match(render, /CSS_TITRE_CORR = "\.printArea \.print-page-subtitle\{-webkit-line-clamp:3\}"/);
  assert.match(render, /CSS_QR \+ CSS_TITRE_OUTIL \+ \(CSS_TITRE_CORR if corr else ""\)/);
  assert.match(render, /if \(parts\.length === 2\) \{/);
  // l'outil n'écrit « Correction » que sur la première page : render.py le répète sur la « bis »
  assert.match(render, /f"Fiche \{f\['n'\]\} bis — \{f\['t'\]\}" \+ \(" — Correction" if corr else ""\)/);
  // tous les livrets rendus (élève et corrigés) doivent porter les mêmes cartes
  // (depuis le lot Q5 : groupe par groupe — les livrets de base entre eux, le défi et son corrigé)
  assert.match(render, /for groupe, r in rendus\.items\(\):\n\s+if len\(\{json\.dumps\(x, sort_keys=True\) for x in r\.values\(\)\}\) > 1:/);
});

test("Q4 : les quatre PDF corrigés — 8 pages A4, 4 feuilles A3, légers", () => {
  for (const s of CORRIGES) {
    assert.ok(existe(`outils/${s}.pdf`) && existe(`outils/${s}_a_plier.pdf`), s);
    assert.equal(nombreDePages(`outils/${s}.pdf`), 8, `${s}.pdf`);
    assert.equal(nombreDePages(`outils/${s}_a_plier.pdf`), 4, `${s}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}.pdf`) < 3_000_000, `${s}.pdf reste léger (qpdf)`);
  }
});

test("Q4 : dans les PDF corrigés — la couverture dit « Correction » et quel corrigé, les fiches disent Correction, le pied aussi", () => {
  CORRIGES.forEach((s, l) => {
    const pages = texteDesPages(`outils/${s}.pdf`).map(norm);
    assert.equal(pages.length, 8, `${s} : huit pages de texte`);
    assert.match(pages[0], /CORRECTION/);
    assert.match(pages[0], /Livret corrigé/);
    assert.match(pages[0], l === 0 ? /par le schéma en barres/ : /par l'équation/, `${s} : la couverture dit quel corrigé`);
    assert.doesNotMatch(pages[0], /Nom, prénom/, `${s} : plus de cadre Nom / Classe`);
    assert.doesNotMatch(pages[0], /professeur/i);
    const titres = ["Fiche 35 —", "Fiche 35 bis —", "Fiche 36 —", "Fiche 36 bis —", "Fiche 37 —", "Fiche 37 bis —"];
    titres.forEach((t, k) => {
      assert.ok(pages[1 + k].includes(t), `${s}, page ${2 + k} : « ${t} »`);
      assert.match(pages[1 + k], /Correction/, `${s}, page ${2 + k} : le titre dit Correction`);
      assert.match(pages[1 + k], /· correction/, `${s}, page ${2 + k} : le pied finit par « · correction »`);
      assert.match(pages[1 + k], l === 0 ? /Même quantité en haut et en bas/ : /Même quantité à gauche qu'à droite/);
    });
    // le corrigé par l'équation écrit les lignes résolues : on relit une équation de chaque fiche
    // (fiche 35 : 𝑏 + 4 = 9 ; fiche 36 : 44 = 2𝑚 + 14 ; fiche 37 : 2𝑡 + 24 = 5𝑡) — les lettres
    // mathématiques sortent de l'extracteur telles quelles
    const sans = (t) => t.replace(/ /g, "");
    if (l === 1) {
      assert.ok(sans(pages[1]).includes("𝑏+4=9") && sans(pages[1]).includes("𝑏=5"), "fiche 35 : 𝑏 + 4 = 9, 𝑏 = 5");
      assert.ok(sans(pages[3]).includes("44=2𝑚+14") && sans(pages[3]).includes("15=𝑚"), "fiche 36 : 44 = 2𝑚 + 14, 15 = 𝑚");
      assert.ok(sans(pages[5]).includes("2𝑡+24=5𝑡") && sans(pages[5]).includes("8=𝑡"), "fiche 37 : 2𝑡 + 24 = 5𝑡, 8 = 𝑡");
    } else {
      // le corrigé par le schéma : les nombres des schémas, pas de ligne d'équation
      assert.ok(sans(pages[3]).includes("44") && sans(pages[3]).includes("30"), "fiche 36 : les schémas 44 puis 30");
      assert.ok(!sans(pages[3]).includes("44=2𝑚+14"), "fiche 36 : pas d'équation dans le corrigé par le schéma");
    }
    assert.match(pages[7], /Et après/);
  });
});

test("Q4 : page des livrets — les corrigés du monde 5 repliés sous chaque livret, comme les autres mondes ; le catalogue ne dit plus « mondes 1 à 4 »", () => {
  const debut = pageLivrets.indexOf('<section class="panneau" data-m="5" id="monde-5"');
  const p = pageLivrets.slice(debut, pageLivrets.indexOf("</section>", debut));
  assert.equal((p.match(/<details class="prof">/g) || []).length, 4, "un bouton replié par livret (les deux défis compris)");
  assert.equal((p.match(/<summary>✅ Le corrigé<\/summary>/g) || []).length, 4);
  for (const s of CORRIGES) {
    const a = p.indexOf(`href="/outils/${s}.pdf"`), b = p.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(a > 0 && b > a, `${s} : PDF puis « à plier »`);
    // le corrigé est replié sous SON livret (le lien du corrigé vient après celui du livret élève)
    assert.ok(a > p.indexOf(`href="/outils/${s.replace("_correction", "")}_a_plier.pdf"`), `${s} : sous son livret`);
  }
  assert.match(p, /Le livret corrigé <small>par le schéma en barres<\/small>/);
  assert.match(p, /Le livret corrigé <small>par l’équation<\/small>/);
  assert.match(p, /Chaque livret a son corrigé, aux mêmes pages/);
  const catalogue = lire("assets/js/catalogue-refonte-data.js");
  assert.doesNotMatch(catalogue, /pour les mondes 1 à 4, les livrets corrigés/);
  assert.match(catalogue, /le livret à plier, et le livret corrigé, à donner aux élèves/);
  assert.doesNotMatch(pageLivrets, /pour les mondes 1 à 4/);
  assert.doesNotMatch(lire("outils/toutes-les-ressources.html"), /pour les mondes 1 à 4, les livrets corrigés/);
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=splat-relatifs-public-20260927-1/, "le cache-buster du catalogue suit");
});

/* ------------------------------------------------------------------ lot Q5 (25/09/2026)
   Le livret « Le défi » du monde 5 — famille équation seulement, et son corrigé par l'équation.
   Les mêmes fiches 35, 36, 37, des cartes plus dures : paquets numérotés partout (2 ou 3 par
   côté), totaux de 50 à 100, jusqu'à six taches ; trois séries de 4 cartes par fiche (le tri est
   décrit dans render.py et le README). Le QR d'une fiche du défi ouvre ÉquaSplat sur ses 12
   équations exactes, sous la MÊME étoile que la fiche de base (décision du 25/09) ; ÉquaSplat ne
   reprend une série interrompue que si c'est la même (empreinte). On exécute la page courte et on
   relit les PDF publiés. */
const DEFI_SORTIE = "livret_splat_equations_equation_defi";
const DEFI = {
  "35d": { n: 35, parcours: "m3e1", series: [["ONE_SIDE", 2, 893381], ["ONE_SIDE", 3, 653158], ["ONE_SIDE", 4, 18888627]] },
  "36d": { n: 36, parcours: "m3e2", series: [["ONE_SIDE", 6, 52841384], ["ONE_SIDE", 6, 7120342], ["ONE_SIDE", 6, 13521466]] },
  "37d": { n: 37, parcours: "m3e4", series: [["BOTH", 4, 13183993], ["BOTH", 6, 907210], ["BOTH", 6, 32560684]] },
};
const FICHES_DEFI_PY = [...render.matchAll(/dict\(n=(\d+), t="([^"]+)", qr="(\d+d)", parcours="(m3e\d)",\n\s+resume="[^"]+",\n\s+parties=\[([^\]]+)\]\)/g)]
  .map((m) => ({ n: Number(m[1]), t: m[2], qr: m[3], parcours: m[4],
    series: [...m[5].matchAll(/defi\("(\w+)", (\d), (\d+)\)/g)].map((x) => [x[1], Number(x[2]), Number(x[3])]) }));

test("Q5 : render.py — les trois fiches du défi, leurs graines, la même étoile que la fiche de base", () => {
  assert.deepEqual(FICHES_DEFI_PY.map((f) => f.qr), Object.keys(DEFI));
  FICHES_DEFI_PY.forEach((f) => {
    const d = DEFI[f.qr];
    assert.equal(f.n, d.n, f.qr);
    assert.deepEqual(f.series, d.series, `${f.qr} : graines et réglages (ne pas en changer une sans refaire le tri)`);
    assert.equal(f.parcours, d.parcours, `${f.qr} : la même étoile que la fiche ${d.n}`);
    assert.equal(f.parcours, EQUATIONS.etapes.find((e) => e.n === d.n).p);
  });
  assert.deepEqual(FICHES_DEFI_PY.map((f) => f.t), ["De deux à quatre taches", "Jusqu'à six taches", "Le grand défi : des deux côtés"]);
  // les réglages communs du défi : paquets numérotés, 2 ou 3 par côté, totaux de 50 à 100, la lettre
  assert.ok(render.includes('return (f"mode=EQSTEP&form={form}&tasksMax={taches_max}&visibleMin=2&visibleMax=3"\n            f"&totalMin=50&totalMax=100&cards=4&seed={graine}&unknown=letter")'));
  // le livret : famille équation seulement, son corrigé par l'équation
  assert.match(render, /VUES\["defi"\] = dict\(VUES\["equation"\],\n\s+sortie="livret_splat_equations_equation_defi",\n\s+sur="Mon livret · Monde 5 · Le défi · L'équation",/);
  // (relecture du 27/09/2026) le même défi en schéma en barres, avec son corrigé par le schéma
  assert.match(render, /VUES\["defi_schema"\] = dict\(VUES\["schema"\],\n\s+sortie="livret_splat_equations_schema_defi",\n\s+sur="Mon livret · Monde 5 · Le défi · Le schéma",/);
  assert.match(render, /"defi_schema": dict\(suffixe="_correction", imprime="correction-schema", dit="par le schéma en barres"\)/);
  assert.match(render, /"defi":\s+dict\(suffixe="_correction", imprime="correction-equation", dit="par l'équation"\)/);
  assert.ok(existe(`${SRC}qr/fiche35d.png`) && existe(`${SRC}qr/fiche36d.png`) && existe(`${SRC}qr/fiche37d.png`));
});

// une équation écrite comme sur la liste annotée (paquets d'un côté additionnés)
const ecrireEq = (q) => [q.left, q.right].map((r) => {
  const t = r.filter((x) => x === "x").length, n = r.filter((x) => x !== "x");
  return [t ? (t > 1 ? t : "") + q.variable : null, ...n].filter((x) => x !== null).join(" + ");
}).join(" = ");

test("Q5 : les 36 cartes du défi — celles du jeu en ligne, 36 équations différentes, au calibre du défi", () => {
  const defi = cartes.defi;
  assert.ok(defi, "cartes.json : le groupe « defi »");
  assert.deepEqual(Object.keys(defi.fiches), ["35d", "36d", "37d"]);
  const cleEq = (c) => [c.left, c.right].map((r) => `${r.filter((t) => t === "x").length}x+${r.filter((t) => t !== "x").reduce((a, b) => a + b, 0)}`).sort().join("=");
  const toutes = Object.values(defi.fiches).flat();
  assert.equal(toutes.length, 36);
  assert.equal(new Set(toutes.map(cleEq)).size, 36, "36 équations différentes");
  const base = new Set(Object.values(cartes.fiches).flat().map(cleEq));
  toutes.forEach((c) => assert.ok(!base.has(cleEq(c)), `${ecrireEq(c)} : pas une carte du livret de base`));
  for (const [qr, serie] of Object.entries(defi.fiches)) {
    assert.equal(cibleCourte(`?f=${qr}`).startsWith(`/outils/equasplat.html?eleve=1&parcours=${DEFI[qr].parcours}#data=`), true, qr);
    const enLigne = donnees(cibleCourte(`?f=${qr}`));
    assert.equal(enLigne.parcours, DEFI[qr].parcours, `${qr} : l'étoile de la série`);
    assert.deepEqual(serie, enLigne.serie, `${qr} : les 12 équations du livret sont celles du QR`);
    const lettres = serie.map((q) => q.variable);
    lettres.forEach((l, k) => {
      assert.ok(lettres.filter((m) => m === l).length <= 2, `${qr} : la lettre ${l} au plus deux fois`);
      if (k) assert.notEqual(l, lettres[k - 1], `${qr} : jamais la même lettre deux cartes de suite`);
    });
    assert.ok(serie[0].left.includes("x"), `${qr} : la première carte commence par la lettre`);
    serie.forEach((q) => {
      const t = (r) => r.filter((x) => x === "x").length, v = (r) => r.filter((x) => x !== "x").reduce((a, b) => a + b, 0);
      const [tg, td, vg, vd] = [t(q.left), t(q.right), v(q.left), v(q.right)];
      const total = tg * q.x + vg;
      assert.equal(total, td * q.x + vd, ecrireEq(q));
      assert.ok(total >= 50 && total <= 100, `${ecrireEq(q)} : total de 50 à 100`);
      assert.ok(q.x >= 6 && q.x <= 30 && q.x % 5 !== 0, `${ecrireEq(q)} : solution de 6 à 30, pas un multiple de 5`);
      assert.equal(q.numberMode, "grouped");
      assert.ok(Math.max(tg, td) <= 6, "six taches au plus");
      const a = Math.abs(tg - td), nombres = [total, vg, vd, Math.abs(vd - vg), a * q.x, q.x];
      nombres.forEach((n) => assert.ok(n !== 69 && n !== 88, `${ecrireEq(q)} : aucun nombre à sous-entendu`));
      if (qr === "37d") assert.ok(tg > 0 && td > 0 && a >= 2, `${ecrireEq(q)} : des taches des deux côtés, un partage à faire`);
      else {
        assert.ok(tg === 0 || td === 0, `${ecrireEq(q)} : les taches d'un seul côté`);
        assert.ok(qr === "35d" ? Math.max(tg, td) <= 4 : Math.max(tg, td) >= 4, `${ecrireEq(q)} : ${qr === "35d" ? "de 2 à 4" : "de 4 à 6"} taches`);
        assert.ok((tg ? vg : vd) >= 20, `${ecrireEq(q)} : au moins 20 dans les paquets du côté des taches`);
      }
    });
  }
  // render.py relit ces séries dans la page courte et s'arrête si les fiches imprimées diffèrent
  assert.ok(render.includes("def series_du_defi():"));
  assert.ok(render.includes('en_ligne = f.get("qr", f["parcours"])'));
});

test("Q5 : l'exemple de couverture du défi — 4𝑎 + 38 = 86, dessiné par l'outil, aucune carte des livrets", () => {
  const q = new URLSearchParams(py("EXEMPLE_DEFI"));
  assert.deepEqual([q.get("mode"), q.get("form"), q.get("seed"), q.get("cards"), q.get("unknown")], ["EQSTEP", "ONE_SIDE", "250", "1", "letter"]);
  assert.deepEqual([cartes.defi.exemple.left, cartes.defi.exemple.right, cartes.defi.exemple.x], [["x", "x", "x", "x", 38], [86], 12]);
  assert.match(render, /fiches=FICHES_DEFI, exemple=EXEMPLE_DEFI, dessins=\(4, 38, 86, 12\), dos=DOS_DEFI,/);
  const cleEq = (c) => [c.left, c.right].map((r) => `${r.filter((t) => t === "x").length}x+${r.filter((t) => t !== "x").reduce((a, b) => a + b, 0)}`).sort().join("=");
  const toutes = new Set([...Object.values(cartes.fiches).flat(), ...Object.values(cartes.defi.fiches).flat()].map(cleEq));
  assert.ok(!toutes.has(cleEq(cartes.defi.exemple)) && !toutes.has(cleEq(cartes.exemple)), "les exemples ne sont aucune carte des livrets");
  assert.ok(render.includes("toutes = {cle(c) for l in cartes_livret.values() for c in l} | cles_connues()"));
});

const SERIES_DEFI = {
  d1: OUTIL + "mode=EQSTEP&form=ONE_SIDE&tasksMax=6&visibleMin=2&visibleMax=3&totalMin=50&totalMax=100&cards=6&unknown=letter&jouer=1",
  d2: OUTIL + "mode=EQSTEP&form=BOTH&tasksMax=6&visibleMin=2&visibleMax=3&totalMin=50&totalMax=100&cards=6&unknown=letter&jouer=1",
};
test("Q5 : le dos du défi — deux QR de 36 mm (?s=d1, d2), six équations au hasard aux réglages du défi, sans étoile", () => {
  for (const [s, attendue] of Object.entries(SERIES_DEFI)) {
    assert.equal(cibleCourte(`?s=${s}`), attendue, `?s=${s}`);
    assert.ok(existe(`${SRC}qr/serie-${s}.png`), `qr/serie-${s}.png`);
    assert.ok(courte.includes(`href="${attendue.replace(/&/g, "&amp;")}"`), `lien de repli de la série ${s}`);
  }
  assert.ok(render.includes('"d1": [sans_graine(defi("ONE_SIDE", 6, 0), SERIE_CARTES)],'));
  assert.ok(render.includes('"d2": [sans_graine(defi("BOTH", 6, 0), SERIE_CARTES)],'));
  assert.match(render, /DOS_DEFI = \[\("D'un seul côté", [^\n]+"d1"\),\n\s+\("Des deux côtés", [^\n]+"d2"\)\]/);
  assert.match(render, /CSS_DOS_DEFI = """\n\.niveaux\{gap:6mm\}\n\.niv\{padding:3\.5mm 4mm 3mm;gap:2mm\}\n\.niv img\{width:36mm;height:36mm\}\n"""/);
  assert.ok(render.includes('await pdf_html("dos.html", tmp / "p8.pdf", JS_DOS, dos, v.get("css_dos"))'));
  // les liens de repli des fiches du défi
  for (const qr of Object.keys(DEFI)) assert.ok(courte.includes(`href="${cibleCourte(`?f=${qr}`).replace(/&/g, "&amp;")}"`), `lien de repli ${qr}`);
});

test("Q5 : les quatre PDF du défi — 8 pages A4, 4 feuilles A3, légers", () => {
  for (const s of [DEFI_SORTIE, DEFI_SORTIE + "_correction"]) {
    assert.equal(nombreDePages(`outils/${s}.pdf`), 8, `${s}.pdf`);
    assert.equal(nombreDePages(`outils/${s}_a_plier.pdf`), 4, `${s}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}.pdf`) < 3_000_000, `${s}.pdf reste léger (qpdf)`);
  }
});

test("Q5 : dans les PDF du défi — couverture, fiches 35 à 37 et leur « bis », dos ; le corrigé écrit les équations", () => {
  const sans = (t) => t.replace(/ /g, "");
  const titres = ["Fiche 35 —", "Fiche 35 bis —", "Fiche 36 —", "Fiche 36 bis —", "Fiche 37 —", "Fiche 37 bis —"];
  const eleve = texteDesPages(`outils/${DEFI_SORTIE}.pdf`).map(norm);
  assert.equal(eleve.length, 8);
  assert.match(eleve[0], /LE DÉFI/i);
  assert.match(eleve[0], /Nom, prénom/);
  // (les fins de ligne du PDF ne laissent pas de blanc : on compare sans les blancs)
  assert.ok(sans(eleve[0]).includes(sans("quatre taches et deux paquets de 11 et 27 jetons")));
  assert.ok(sans(eleve[0]).includes(sans("deux paquets de 71 et 15 jetons")));
  assert.match(eleve[0], /on voit les 12 jetons/, "(l'extracteur perd des lettres en fin de phrase)");
  assert.ok(eleve[0].includes("86 – 38 = 48") && eleve[0].includes("48 ÷ 4 = 12"), "les gestes de l'exemple");
  titres.forEach((t, k) => {
    assert.ok(eleve[1 + k].includes(t), `page ${2 + k} : « ${t} »`);
    assert.match(eleve[1 + k], /Même quantité à gauche qu'à droite/);
  });
  assert.ok(eleve[5].includes("Le grand défi"), "fiche 37 : son titre");
  assert.match(eleve[7], /Et après/);
  // (l'extracteur perd des lettres des titres en gras : on relit les descriptions des deux séries)
  assert.ok(sans(eleve[7]).includes(sans("Des paquets et jusqu'à six taches, des totaux de 50 à 100")) &&
            sans(eleve[7]).includes(sans("Des taches des deux côtés, des totaux de 50 à 100")), "les deux séries du dos");
  assert.ok(sans(eleve[7]).includes("–38"), "les flèches du dos écrivent le geste de l'exemple (– 38)");
  const corr = texteDesPages(`outils/${DEFI_SORTIE}_correction.pdf`).map(norm);
  assert.equal(corr.length, 8);
  assert.match(corr[0], /CORRECTION/);
  assert.match(corr[0], /par l'équation/);
  assert.doesNotMatch(corr[0], /Nom, prénom/);
  titres.forEach((t, k) => {
    assert.ok(corr[1 + k].includes(t), `corrigé, page ${2 + k} : « ${t} »`);
    assert.match(corr[1 + k], /Correction/);
    assert.match(corr[1 + k], /· correction/);
  });
  // une équation de chaque fiche, relue dans le corrigé : la première de chaque fiche
  const premiere = (qr) => sans(ecrireEq(cartes.defi.fiches[qr][0]));
  assert.ok(sans(corr[1]).includes(premiere("35d")), "fiche 35 : " + premiere("35d"));
  assert.ok(sans(corr[3]).includes(premiere("36d")), "fiche 36 : " + premiere("36d"));
  assert.ok(sans(corr[5]).includes(premiere("37d")), "fiche 37 : " + premiere("37d"));
});

test("Q5 : la page des livrets et la carte des mondes — « Le défi » au monde 5, son corrigé replié, sa couverture", () => {
  const debut = pageLivrets.indexOf('<section class="panneau" data-m="5" id="monde-5"');
  const p = pageLivrets.slice(debut, pageLivrets.indexOf("</section>", debut));
  // (27/09/2026) « Le défi » en équation : la quatrième carte, dans la famille « L'équation »
  const carte = p.split('<article class="liv">')[4];
  assert.ok(carte, "la quatrième carte du monde 5");
  assert.match(carte, /<h3>Le défi<\/h3><span class="plage">totaux de 50 à 100<\/span>/);
  const a = carte.indexOf(`href="/outils/${DEFI_SORTIE}.pdf"`), b = carte.indexOf(`href="/outils/${DEFI_SORTIE}_a_plier.pdf"`);
  const c = carte.indexOf(`href="/outils/${DEFI_SORTIE}_correction.pdf"`), d = carte.indexOf(`href="/outils/${DEFI_SORTIE}_correction_a_plier.pdf"`);
  assert.ok(a > 0 && b > a && c > b && d > c, "PDF, à plier, puis le corrigé replié dessous");
  assert.ok(carte.indexOf('<details class="prof">') > b && carte.indexOf('<details class="prof">') < c);
  assert.match(carte, /Le livret corrigé <small>par l’équation<\/small>/);
  const png = "assets/img/thumbnails/splat/livret-splat-equations-equation-defi.png", webp = png.replace(".png", ".webp");
  assert.ok(existe(png) && existe(webp) && taille(webp) < taille(png));
  const im = readFileSync(new URL(`../${png}`, import.meta.url));
  assert.deepEqual([im.readUInt32BE(16), im.readUInt32BE(20)], [993, 1404], "page 1 rendue à 120 dpi");
  assert.ok(carte.includes(`src="/${png}?v=3"`)); // refaite à la relecture du monde 5 (27/09/2026)
  assert.match(p, /chaque famille a son livret «&nbsp;Le défi&nbsp;»/);
  // carte des mondes, vue prof : la note du monde 5 présente « Le défi » (le lien mène à la page
  // des livrets, relecture du monde 1, lot 2)
  const bloc5 = univers.match(/\(m===MONDE_EQUATIONS&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/)[0];
  assert.ok(bloc5.includes("Chaque version a son livret <b>Le d\\u00e9fi</b>"));
  // le catalogue le dit, et son cache-buster suit
  const catalogue = lire("assets/js/catalogue-refonte-data.js");
  assert.match(catalogue, /SPLAT! Équations \(monde 5\) en quatre livrets : le schéma en barres et l’équation, chacun avec son «\u00a0Le défi\u00a0»\. SPLAT! Relatifs \(monde 6\) en deux livrets\."/);
  assert.match(catalogue, /chacun avec son livret «\u00a0Le défi\u00a0», des totaux de 50 à 100\./);
  assert.match(lire("outils/index.html"), /catalogue-refonte-data\.js\?v=splat-relatifs-public-20260927-1/);
});

test("Q5 : ÉquaSplat ne reprend une série interrompue que si c'est la même (empreinte)", () => {
  const eq = lire("outils/equasplat.html");
  assert.match(eq, /eleveEcrireEntree\(\{ enCours:\{ sig:eleveSignatureSerie\(\), idx:suivante, resolues:eleveResolues, res:eleveRes\.slice\(0, suivante\) \} \}\);/);
  assert.match(eq, /if\(entree && entree\.enCours && entree\.enCours\.sig === eleveSignatureSerie\(\) &&\n\s+Number\.isInteger\(entree\.enCours\.idx\)/);
  // l'empreinte, exécutée : deux séries différentes sous la même étoile, deux empreintes
  const src = eq.slice(eq.indexOf("  function eleveSignatureSerie(){"), eq.indexOf("  function eleveSauverEnCours(){"));
  const sig = (serie) => { const c = vm.createContext({ eleveEqs: serie }); vm.runInContext(src + ";globalThis.s=eleveSignatureSerie();", c); return c.s; };
  const base = donnees(EQUATIONS.etapes[0].j).serie, defi = donnees(cibleCourte("?f=35d")).serie;
  assert.equal(sig(base), sig(JSON.parse(JSON.stringify(base))), "la même série : la même empreinte");
  assert.notEqual(sig(base), sig(defi), "fiche 35 et fiche 35 du défi : deux empreintes");
  assert.match(sig(defi), /^12:[0-9a-f]{8}$/);
});

test("Q5 : « jouer=1 » — une série tirée au hasard sans aucun nombre à sous-entendu (les séries du défi vont jusqu'à 100)", () => {
  assert.match(outil, /const NOMBRES_ECARTES = \[69, 88\];/);
  assert.match(outil, /function ouvrirSerieDansEquaSplat\(\)\{\n\s+for\(let essai = 0; essai < 60 && !cards\.every\(carteSansNombreEcarte\); essai\+\+\)\{\n\s+if\(serieSuite\.length\) genererSerieComposee\(\); else generate\(\);/);
  // exécutée sur des cartes d'essai : le plateau, la somme des paquets, le total, les calculs
  const src = outil.slice(outil.indexOf("const NOMBRES_ECARTES"), outil.indexOf("function ouvrirSerieDansEquaSplat(){"));
  const essai = (q, visibles) => {
    const c = vm.createContext({ carteDuJeuEquaSplat: () => q, visibles });
    vm.runInContext(src + ";globalThis.r=carteSansNombreEcarte({_eq:{left:{visible:visibles[0]},right:{visible:visibles[1]}}});", c);
    return c.r;
  };
  assert.equal(essai({ x: 12, left: ["x", "x", "x", "x", 38], right: [86] }, [[11, 27], [71, 15]]), true, "4𝑎 + 38 = 86 : rien à écarter");
  assert.equal(essai({ x: 7, left: ["x", "x", 55], right: [69] }, [[20, 35], [40, 29]]), false, "69 de l'autre côté");
  assert.equal(essai({ x: 9, left: ["x", 60], right: [69] }, [[30, 30], [69]]), false, "69 sur un paquet");
  assert.equal(essai({ x: 11, left: ["x", "x", "x", "x", "x", "x", "x", "x", 12], right: [100] }, [[5, 7], [50, 50]]), false, "8𝑥 = 88 dans les calculs");
  assert.equal(essai({ x: 14, left: ["x", 55], right: [69] }, [[25, 30], [34, 35]]), false, "total 69");
});

/* ------------------------------------------------------------------ relecture du monde 5 (27/09/2026)
   « Chacun possède un défi » : le livret « Le défi » existe aussi en schéma en barres, avec son
   corrigé par le schéma ; ses fiches sont les mêmes 36 cartes que le défi équation (render.py
   s'arrête sinon : même groupe « defi »). */
test("relecture du monde 5 : « Le défi » en schéma en barres — 8 pages, à plier, corrigé par le schéma", () => {
  const s = "livret_splat_equations_schema_defi";
  for (const f of [s, s + "_correction"]) {
    assert.equal(nombreDePages(`outils/${f}.pdf`), 8, `${f}.pdf`);
    assert.equal(nombreDePages(`outils/${f}_a_plier.pdf`), 4, `${f}_a_plier.pdf`);
    assert.ok(taille(`outils/${f}.pdf`) < 3_000_000, `${f}.pdf reste léger (qpdf)`);
  }
  assert.match(render, /groupe = "defi" if nom\.startswith\("defi"\) else "base"/, "les deux défis ont les mêmes cartes");
  const pages = texteDesPages(`outils/${s}.pdf`).map(norm);
  assert.match(pages[0], /LE DÉFI · LE SCHÉMA/);
  ["Fiche 35 —", "Fiche 35 bis —", "Fiche 36 —", "Fiche 36 bis —", "Fiche 37 —", "Fiche 37 bis —"].forEach((t, k) => {
    assert.ok(pages[1 + k].includes(t), `page ${2 + k} : « ${t} »`);
    assert.match(pages[1 + k], /Même quantité en haut et en bas/);
  });
  // les petits schémas du dos, à l'échelle : une seule fonction, les nombres de l'exemple du défi
  assert.match(render, /_ENL_D, _FIN_D, _DEP_D = mini_schemas\(4, 38, 86, 12\)/);
  assert.match(render, /^MINI_SCH_ENLEVE, MINI_SCH_FIN, MINI_SCH = mini_schemas\(3, 12, 27, 5\)$/m);
});
