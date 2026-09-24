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
const FICHES_PY = [...render.matchAll(/dict\(n=(\d+), t="([^"]+)",\s+parties=\[([^\]]+)\],\s+parcours="(m3e\d)"/g)]
  .map((m) => ({ n: Number(m[1]), t: m[2], parties: m[3].split(",").map((s) => s.trim()), parcours: m[4] }));

test("Q3 : les réglages et les graines des fiches sont ceux de la carte des mondes", () => {
  for (const nom of REGLAGES) assert.equal(py(nom), js(nom), nom);
  assert.deepEqual(FICHES_PY.map((f) => f.parties), [["EQ5_S1", "EQ5_S2", "EQ5_S3"], ["EQ5_PAQUETS"], ["EQ5_DEUX_COTES"]]);
});

test("Q3 : une fiche = une étape = une étoile — fiches 35, 36, 37, titres de la carte", () => {
  assert.deepEqual(FICHES_PY.map((f) => f.n), EQUATIONS.etapes.map((e) => e.n));
  assert.deepEqual(FICHES_PY.map((f) => f.n), [35, 36, 37]);
  assert.deepEqual(FICHES_PY.map((f) => f.t), EQUATIONS.etapes.map((e) => e.t));
  assert.deepEqual(FICHES_PY.map((f) => f.parcours), EQUATIONS.etapes.map((e) => e.p));
  // la fiche est imprimée à l'adresse du lien « Fiche » de la carte : 6/page, énoncé seul, titre
  assert.match(render, /&print=statement&layout=6"\n\s+f"&title=\{quote\('Fiche ' \+ str\(f\['n'\]\) \+ ' — ' \+ f\['t'\], safe=''\)\}"/);
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
  assert.ok(render.includes("les deux livrets n'ont pas les mêmes cartes"));
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
  // hors bornes, et le défi (lot Q5) pas encore fait : la carte des mondes
  for (const q of ["?f=35d", "?f=34", "?f=", "?s=0", "?s=4", "", "?x=1"])
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
  2: OUTIL + sansGraine(js("EQ5_PAQUETS"), 6) + "&jouer=1",
  3: OUTIL + sansGraine(js("EQ5_DEUX_COTES"), 6) + "&jouer=1",
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
  assert.match(outil, /const sharedNames = \[[^\]]*"suite", "jouer"\]/);
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
        const a = parseInt(m[1], 16), z = parseInt(m[2], 16), c = parseInt(m[3], 16);
        for (let k = a; k <= z && k - a < 1024; k++) t.set(k.toString(16).padStart(4, "0"), String.fromCodePoint(c + (k - a)));
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
test("Q3 : un seul logo maths&go par page, signature et licence au pied, lisible en noir et blanc", () => {
  for (const [nom, t] of [["couverture", couv], ["dos", dos]]) {
    assert.equal((t.match(/logos\/mathsgo\/logo-print\.png/g) || []).length, 1, `${nom} : un seul logo maths&go`);
    assert.match(t, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/, nom);
    assert.match(t, /alt="IREMI La Réunion"/, nom);
  }
  const css = lire(SRC + "commun.css");
  assert.match(css, /\.pied\{[^}]*font-size:10px;[^}]*color:#64748b;/);
  // le teal ne sert qu'aux fonds : aucun texte teal clair sur du blanc (#115e59 pour le texte)
  for (const [nom, t] of [["commun.css", css], ["couverture", couv], ["dos", dos]])
    assert.doesNotMatch(t.replace(/\/\*[\s\S]*?\*\//g, ""), /(?:^|[;{])color:#(?:08aaa5|4cc7c3|9fdcd9)/i, `${nom} : pas de texte teal clair`);
  assert.match(render, /PIED_LIVRET = "mathsgo\.re\/splat · CC BY-NC-SA 4\.0"/);
  // les crédits : Claire pour la progression, une fois ; le clin d'œil à Steve Wyborney
  assert.equal((dos.match(/Claire/g) || []).length, 1);
  assert.match(dos, /Steve Wyborney/);
  assert.equal((couv.match(/Claire/g) || []).length, 0);
});

test("Q3 : le bandeau des fiches sur deux étages, la lettre arrondie, pas de flèche au livret schéma", () => {
  assert.match(render, /^TITRE_BANDEAU = "Splat!<small>Équations<\/small>"$/m);
  assert.match(render, /await pg\.add_style_tag\(content=CSS_QR \+ CSS_TITRE_OUTIL\)/);
  // plus la vieille règle fausse (« quand il ne reste que des taches, on partage »)
  assert.doesNotMatch(render + dos, /Quand il ne reste que des taches/);
  // le livret schéma n'a pas de flèche : ses icônes sont des schémas en barres
  const schema = render.slice(render.indexOf('"schema": dict('), render.indexOf('"equation": dict('));
  assert.ok(!schema.includes("FLECHES") && schema.includes("MINI_SCH_ENLEVE"));
  // la lettre : le caractère de l'appli (𝑥), police nommée
  assert.match(lire(SRC + "commun.css"), /@font-face\{font-family:"x-arrondi";src:local\("FreeSerif"\)/);
  assert.ok(couv.includes(">𝑥</text>") && dos.includes(">𝑥</text>"));
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
  assert.match(p, /<div class="grille n2">/);
  assert.equal((p.match(/<article class="liv">/g) || []).length, 2);
  let avant = -1;
  for (const s of SORTIES) {
    const a = p.indexOf(`href="/outils/${s}.pdf"`), b = p.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(a > avant && b > a, `${s} : PDF puis « à plier », dans l'ordre`);
    avant = b;
  }
  assert.match(p, /<h3>Le schéma en barres<\/h3>[\s\S]*<h3>L’équation<\/h3>/);
  assert.match(pageLivrets, /\[data-m="5"\]\{--c:#08aaa5;--c-plein:#0f766e;/);
  assert.match(pageLivrets, /<nav class="onglets" id="onglets" data-n="5" role="tablist"/);
  for (const nom of ["livret-splat-equations-schema", "livret-splat-equations-equation"]) {
    const png = `assets/img/thumbnails/splat/${nom}.png`, webp = `assets/img/thumbnails/splat/${nom}.webp`;
    assert.ok(existe(png) && existe(webp), nom);
    assert.ok(taille(webp) < taille(png), `${nom} : la WebP est plus légère`);
    const b = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [993, 1404], `${nom} : page 1 rendue à 120 dpi`);
    assert.ok(p.includes(`src="/assets/img/thumbnails/splat/${nom}.png?v=1"`), `${nom} : sur la page`);
  }
});

test("carte des mondes, vue prof : les deux livrets sous le monde 5, et le lien vers leur onglet", () => {
  const b = univers.match(/\(m===MONDE_EQUATIONS&&PROF\?'<p class="intro">'[\s\S]*?<\/p>':''\)\+/);
  assert.ok(b, "bloc des pastilles du monde 5 introuvable");
  for (const s of SORTIES) {
    assert.ok(b[0].includes(`href="/outils/${s}.pdf"`), s);
    assert.ok(b[0].includes(`href="/outils/${s}_a_plier.pdf"`), s + "_a_plier");
  }
  assert.ok(b[0].includes('<a href="/outils/livrets_splat.html#monde-5">Voir la page des livrets</a>'));
  assert.match(univers, /\.monde\.m3 \.introLien\.livret\{color:#115e59;background:#e6f7f6;border-color:#9fdcd9\}/);
});
