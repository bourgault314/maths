/* Les six livrets de l'Enquête (monde 3 de l'univers SPLAT!) — la progression en six livrets du
   30/09/2026 (lot 2) : trois livrets de base, pour tous, dans l'ordre (fiches 10 à 24), puis trois
   livrets « Deuxième tour », plus durs, qui allument les MÊMES étoiles (fiches 10d à 24d).

   Rendus par _sources/livret-splat-enquete/render.py à partir de l'outil du site : les fiches de
   base doivent être EXACTEMENT celles de la carte des mondes (ENQ_FICHES : mêmes réglages, mêmes
   graines, mêmes titres ; une fiche = une étape = une étoile), celles du deuxième tour celles de la
   page courte (ENQ_TOUR2), et le QR de chaque fiche doit ouvrir la série qui allume la bonne étoile.
   On EXÉCUTE les données de la carte des mondes et le script de la page courte des QR (leçon du
   lot L : chercher du texte ne dit rien des adresses réellement construites), puis on relit les
   PDF publiés et les cartes rendues (cartes.json). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;

const univers = lire("outils/splat_univers.html");
const courte = lire("splat/enquete/livret/index.html");
const render = lire("_sources/livret-splat-enquete/render.py");
const SRC = "_sources/livret-splat-enquete/";
const couv = lire(SRC + "couverture.html"), exemple = lire(SRC + "exemple.html"), dos = lire(SRC + "dos.html");
const cartes = JSON.parse(lire(SRC + "cartes.json"));

// ------------------------------------------------ la carte des mondes, exécutée
function bloc(debut, fin) {
  const a = univers.indexOf(debut), b = univers.indexOf(fin);
  assert.ok(a > 0 && b > a, `bloc « ${debut} » introuvable dans splat_univers.html`);
  return univers.slice(a, b);
}
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(bloc("const PS=", "const PROF =") + ";globalThis.X={MONDES,ENQ_FICHES,MONDE_ENQUETE};",
  ctx, { filename: "splat_univers.html" });
const { ENQ_FICHES, MONDE_ENQUETE } = JSON.parse(JSON.stringify(ctx.X));
const ETAPES = MONDE_ENQUETE.etapes;

// ------------------------------------------------ render.py, lu
const py = (nom) => {
  const m = render.match(new RegExp(`^${nom}\\s*=\\s*"([^"]+)"`, "m"));
  assert.ok(m, `${nom} introuvable dans render.py`);
  return m[1];
};
const BASE = Array.from({ length: 15 }, (_, i) => py("E" + (10 + i)));
const TOUR2 = Array.from({ length: 15 }, (_, i) => py("E" + (10 + i) + "D"));
const FICHES = [...render.matchAll(/fiche\((\d+), "([^"]+)", (E\d\dD?), "[^"]+"(, note=True)?(?:, code="(\d+d)")?\)/g)]
  .map((m) => ({ n: Number(m[1]), t: m[2], e: m[3], note: !!m[4], code: m[5] || m[1] }));
const FB = FICHES.filter((f) => !f.e.endsWith("D")), FT = FICHES.filter((f) => f.e.endsWith("D"));
const LIVRETS = ["additif", "multiplicatif", "rebondit", "additif_tour2", "multiplicatif_tour2", "rebondit_tour2"];
const SORTIES = LIVRETS.map((n) => "livret_splat_enquete_" + n);
const VERSIONS = ["", "_correction", "_correction_lettre"];
const REGLAGES = (q) => Object.fromEntries([...new URLSearchParams(q)].sort());

test("lot 2 : les quinze fiches de base sont celles de la carte des mondes — réglages, graines, titres, consignes", () => {
  assert.deepEqual(BASE, ENQ_FICHES.map((f) => f.q));
  assert.equal(py("ENQ_COMMUN"), "&cards=4&unknown=question");
  assert.deepEqual(FB.map((f) => f.n), Array.from({ length: 15 }, (_, i) => 10 + i));
  assert.deepEqual(FB.map((f) => f.e), BASE.map((_, i) => "E" + (10 + i)));
  assert.deepEqual(FB.map((f) => f.t), ENQ_FICHES.map((f) => f.t));
  assert.deepEqual(FB.map((f) => f.note), ENQ_FICHES.map((f) => !!f.note));
  assert.deepEqual(FB.filter((f) => f.note).map((f) => f.n), [11, 16, 23], "« Reformule » aux fiches 11, 16 et 23");
  assert.deepEqual(ETAPES.map((e) => e.n), FB.map((f) => f.n), "le numéro de fiche est le numéro d'étape");
  assert.match(render, /titre = f"Fiche \{f\['code'\]\} — \{f\['t'\]\}"/);
});

test("lot 2 : les quinze fiches du deuxième tour — codes 10d à 24d, aucune consigne « Reformule »", () => {
  assert.deepEqual(FT.map((f) => f.code), Array.from({ length: 15 }, (_, i) => (10 + i) + "d"));
  assert.deepEqual(FT.map((f) => f.e), TOUR2.map((_, i) => "E" + (10 + i) + "D"));
  assert.ok(FT.every((f) => !f.note));
  assert.deepEqual(FT.map((f) => f.t), ["Trois taches en chaîne", "Je complète", "Référence, chaîne ou je complète ?",
    "Tout dans le désordre", "Le grand défi additif", "Chaîne, deux rapports", "Chaîne, un écart et un rapport",
    "Je complète, avec un rapport", "Indices composés", "Le grand défi", "Deux taches réunies", "Répétées à trois couleurs",
    "Les indices en symboles", "Très grands nombres", "Unité commune : je double tout"]);
  // chaque livret : ses cinq fiches, dans l'ordre
  const bloc = (nom) => render.slice(render.indexOf(`"${nom}": dict(`), render.indexOf("),\n", render.indexOf(`"${nom}": dict(`)));
  const ref = { additif: "FICHES_ADD", multiplicatif: "FICHES_MUL", rebondit: "FICHES_REB",
    additif_tour2: "FICHES_ADD_T2", multiplicatif_tour2: "FICHES_MUL_T2", rebondit_tour2: "FICHES_REB_T2" };
  for (const [nom, liste] of Object.entries(ref)) assert.match(bloc(nom), new RegExp(`fiches=${liste},`), nom);
});

test("lot 2 : le schéma vide sous la carte 1 (modele=1) — fiches 13, 18, 22, 11d, 17d et 18d, les seules", () => {
  const avec = [...BASE.map((q, i) => [String(10 + i), q]), ...TOUR2.map((q, i) => [(10 + i) + "d", q])]
    .filter(([, q]) => new URLSearchParams(q).get("modele") === "1").map(([c]) => c);
  assert.deepEqual(avec, ["13", "18", "22", "11d", "17d", "18d"]);
});

// ------------------------------------------------ la page courte : étapes, deuxième tour et séries
function cibleCourte(search) {
  const script = courte.match(/<script>([\s\S]*?)<\/script>/)[1];
  let cible = null;
  const window = { location: { search, origin: "https://mathsgo.re", replace: (u) => { cible = u; } } };
  new Function("window", "URLSearchParams", "URL", "encodeURIComponent", script)(window, URLSearchParams, URL, encodeURIComponent);
  return cible.replace("https://mathsgo.re", "");
}

test("le QR d'une fiche ouvre sa série et son étoile, par la page courte (?f=10 … ?f=24)", () => {
  assert.match(render, /return f"\{SITE\}\{COURTE\}\?f=\{n\}"/);
  assert.equal(py("COURTE"), "/splat/enquete/livret/");
  ETAPES.forEach((e) => {
    assert.equal(cibleCourte(`?f=${e.n}`), e.j, `?f=${e.n}`);
    assert.ok(existe(`${SRC}qr/fiche${e.n}.png`), `qr/fiche${e.n}.png`);
    assert.ok(courte.includes(`href="${e.j.replace(/&/g, "&amp;")}"`), `lien de repli de la fiche ${e.n}`);
  });
});

test("deuxième tour : ?f=10d … ?f=24d ouvre la fiche Nd, avec la MÊME étoile que la fiche N", () => {
  assert.match(render, /ecrire\(lien_fiche\(f\["code"\]\), f"fiche\{f\['code'\]\}\.png"\)/);
  TOUR2.forEach((q, i) => {
    const n = 10 + i, cible = cibleCourte(`?f=${n}d`);
    assert.equal(cible, `/splat/classique/?${q}&cards=4&unknown=question&eleve=1&parcours=enq${n}`, `?f=${n}d`);
    const j = new URLSearchParams(ETAPES[i].j.split("?")[1]);
    assert.equal(new URLSearchParams(cible.split("?")[1]).get("parcours"), j.get("parcours"), `fiche ${n}d : même étoile que la fiche ${n}`);
    assert.ok(existe(`${SRC}qr/fiche${n}d.png`), `qr/fiche${n}d.png`);
    assert.ok(courte.includes(`href="${cible.replace(/&/g, "&amp;")}"`), `lien de repli de la fiche ${n}d`);
  });
  for (const f of ["9d", "25d", "10x", "d", "12dd", "25", "9"]) assert.equal(cibleCourte(`?f=${f}`), "/outils/splat_univers.html", `?f=${f}`);
  assert.doesNotMatch(courte, /ENQ_DEFI/);
});

test("les séries du dos : ?s=16 … 34, huit cartes sans graine, en mode élève sans étape ; 1 à 15 restent servies", () => {
  const SERIES = Object.fromEntries([...render.matchAll(/^    (\d+): "(mode=C[^"]+)",$/gm)].map((m) => [m[1], m[2]]));
  assert.deepEqual(Object.keys(SERIES), Array.from({ length: 19 }, (_, i) => String(16 + i)));
  assert.match(render, /^SERIE_CARTES = 8$/m);
  for (const [s, q] of Object.entries(SERIES)) {
    const cible = cibleCourte(`?s=${s}`);
    assert.equal(cible, `/splat/classique/?${q}&cards=8&unknown=question&eleve=1`, `?s=${s}`);
    const r = new URLSearchParams(cible.split("?")[1]);
    for (const k of ["seed", "parcours", "modele"]) assert.equal(r.get(k), null, `série ${s} : pas de « ${k} »`);
    assert.ok(existe(`${SRC}qr/serie-${s}.png`), `qr/serie-${s}.png`);
    assert.ok(courte.includes(`href="${cible.replace(/&/g, "&amp;")}"`), `lien de repli de la série ${s}`);
  }
  // chaque série du dos est citée par un seul livret, trois par livret (quatre au Deuxième tour 2 : les composés)
  const parLivret = LIVRETS.map((nom) => {
    const d = render.indexOf(`"${nom}": dict(`), f = render.indexOf("suite=", d);
    return [...render.slice(d, f).matchAll(/", (\d+)\)/g)].map((m) => Number(m[1]));
  });
  assert.deepEqual(parLivret, [[16, 17, 18], [19, 20, 21], [22, 23, 24], [25, 26, 27], [28, 29, 30, 31], [32, 33, 34]]);
  assert.equal(new URLSearchParams(SERIES["30"]).get("compose"), "1", "la série « Indices composés »");
  // les séries des anciens livrets (déjà imprimés) répondent encore ; hors bornes, la carte des mondes
  for (const s of ["1", "15"]) assert.match(cibleCourte(`?s=${s}`), /^\/splat\/classique\/\?mode=C/, `?s=${s}`);
  for (const s of ["0", "35", "x", "", "07"]) assert.equal(cibleCourte(`?s=${s}`), "/outils/splat_univers.html", `?s=${s}`);
  assert.ok(existe(`${SRC}qr/univers.png`));
});

// ------------------------------------------------ les exemples
test("les exemples : la page 2 montre le dessin de la première fiche du livret, sur une carte hors des livrets", () => {
  const ex = { EX_ADD2: "32", EX_MUL2: "83", EX_REB: "82", EX_ADD: "4642", EX_MUL: "128029", EX_REU: "43", EX_UNITE: "59" };
  for (const [nom, graine] of Object.entries(ex)) {
    const q = new URLSearchParams(py(nom));
    assert.equal(q.get("seed"), graine, nom);
    assert.equal(q.get("cards"), "1", nom);
  }
  assert.match(render, /"additif": dict\([\s\S]*?exemple=dict\(query=EX_ADD2, op="DEUX"\)/);
  assert.match(render, /"multiplicatif": dict\([\s\S]*?exemple=dict\(query=EX_MUL2, op="DEUX"\)/);
  assert.match(render, /"rebondit": dict\([\s\S]*?exemple=dict\(query=EX_REB, op="REPET"\)/);
  assert.match(render, /"additif_tour2": dict\([\s\S]*?exemple=dict\(query=EX_ADD, op="ADD"\)/);
  assert.match(render, /"multiplicatif_tour2": dict\([\s\S]*?exemple=dict\(query=EX_MUL, op="MUL"\)/);
  assert.match(render, /"rebondit_tour2": dict\([\s\S]*?exemple=dict\(query=EX_REU, op="REUNIES"\)/);
  assert.match(render, /dos=dict\(DOS_BASE2, unite=EX_UNITE,/, "l'unité commune résolue au dos du Deuxième tour 3");
  const cle = ([t, v]) => t + ":" + [...v].sort((a, b) => a - b).join(",");
  assert.deepEqual(Object.fromEntries(LIVRETS.map((n) => [n, cartes[n].exemple])), {
    additif: [26, [9, 17]], multiplicatif: [28, [7, 21]], rebondit: [38, [8, 15, 15]],
    additif_tour2: [26, [5, 9, 12]], multiplicatif_tour2: [33, [5, 7, 21]], rebondit_tour2: [54, [8, 19, 27]] });
  const toutes = new Set(Object.values(cartes).flatMap((c) => Object.values(c.fiches).flat()).map(cle));
  for (const [nom, c] of Object.entries(cartes)) assert.ok(!toutes.has(cle(c.exemple)), `l'exemple du livret « ${nom} » est une carte`);
  assert.ok(!toutes.has(cle([55, [10, 15, 30]])), "l'unité commune du dos est une carte");
  // les textes sont écrits à partir de la carte rendue ; les dessins sont ceux de l'outil
  for (const f of ["def textes_exemple_deux(ex):", "def textes_exemple_reunies(ex):", "def textes_exemple_repet(ex):"]) assert.ok(render.includes(f), f);
  for (const f of ["drawEnqueteBarres(g, card, prof)", "drawEnqueteLigne(g, card, prof)", "drawEnqueteCalculs(g, card, {...prof, reponse:false})"])
    assert.ok(render.includes(f), f);
  assert.match(render, /if \(d\.etapes\.length !== 3\) return/);
  assert.ok(render.includes("variables de couleur inconnues"), "résolution des var(--…) de l'outil");
  assert.match(render, /raise SystemExit\(f"un exemple est une carte : /);
});

test("page 2 : l'étape ② s'appelle « Schéma regroupé » (30/09/2026)", () => {
  assert.match(exemple, /<h3>Schéma regroupé<\/h3>/);
  assert.match(exemple, /aria-label="Schéma regroupé"/);
  for (const t of [exemple, render]) assert.doesNotMatch(t, /[Tt]out sur une ligne/);
  assert.equal((exemple.match(/<li class="et/g) || []).length, 4, "quatre étapes sur la page 2");
});

test("au dos, le mini-schéma est un vrai schéma en barres — chaque « ? » a la largeur de la case de référence", () => {
  const regle = (sel) => (dos.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{([^}]*)\\}")) || [])[1] || "";
  assert.match(regle(".mini-sch .r span"), /flex:0 0 auto/, "une case ne rétrécit jamais");
  assert.match(regle(".mini-sch .r span + span"), /margin-left:-1\.3px/, "les cases d'une barre se touchent");
  assert.match(dos, /<svg class="boite-total"[^>]*><rect x="0" y="0" width="280" height="210" rx="22"[^>]*\/><text[^>]*font-size="42"[^>]*>TOTAL<\/text><text[^>]*font-size="96"[^>]*>\d+<\/text><\/svg>/);
  for (const m of ["les cases « ? » n’ont pas toutes la même largeur", "des cases de la barre ne se touchent pas",
                   "les deux barres ne partent pas du même bord", "l’unité commune déborde sur les crédits"])
    assert.ok(render.includes(m), m);
});

// ------------------------------------------------ les 36 PDF publiés
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
function texteDesPages(p) {
  const fl = flux(p);
  const tables = [];
  for (const f of fl) {
    if (!f.includes("begincmap")) continue;
    const t = new Map();
    for (const bloc of f.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
        t.set(m[1].toLowerCase(), String.fromCodePoint(...(m[2].match(/.{4}/g) || []).map((h) => parseInt(h, 16))));
    for (const bloc of f.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
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
// Chromium écrit « fi » en ligature (U+FB01) ; l'extracteur colle les mots d'une fin de ligne
const norm = (t) => t.replace(/\s+/g, " ").replace(/\uFB01/g, "fi").replace(/\uFB02/g, "fl").replace(/\u00a0/g, " ");
const souple = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, " ?"));

test("les 36 PDF — 8 pages A4 dans l'ordre, 4 feuilles A3 imposées, légers ; les anciens « Le défi » ont disparu", () => {
  for (const s of SORTIES) for (const v of VERSIONS) {
    assert.equal(nombreDePages(`outils/${s}${v}.pdf`), 8, `${s}${v}.pdf`);
    assert.equal(nombreDePages(`outils/${s}${v}_a_plier.pdf`), 4, `${s}${v}_a_plier.pdf`);
    assert.ok(taille(`outils/${s}${v}.pdf`) < 3_000_000, `${s}${v}.pdf reste léger (qpdf)`);
  }
  assert.match(render, /for g, d in \[\(8, 1\), \(2, 7\), \(6, 3\), \(4, 5\)\]:/);
  for (const n of ["additif_defi", "multiplicatif_defi"]) assert.ok(!existe(`outils/livret_splat_enquete_${n}.pdf`), `${n} : supprimé`);
});

const TITRES = Object.fromEntries(LIVRETS.map((nom, l) => [nom, (l < 3 ? FB : FT).slice(5 * (l % 3), 5 * (l % 3) + 5)]));
const EXEMPLES_P2 = { additif: "9 + 17 = 26", multiplicatif: "7 + 21 = 28", rebondit: "8 + 15 + 15 = 38",
  additif_tour2: "5 + 9 + 12 = 26", multiplicatif_tour2: "5 + 7 + 21 = 33", rebondit_tour2: "8 + 19 + 27 = 54" };

test("dans les PDF — couverture, exemple en page 2, les cinq fiches dans l'ordre, le dos ; élève et corrigés", () => {
  LIVRETS.forEach((nom, l) => {
    for (const v of VERSIONS) {
      const s = SORTIES[l] + v, pages = texteDesPages(`outils/${s}.pdf`).map(norm);
      assert.equal(pages.length, 8, `${s} : huit pages de texte`);
      assert.match(pages[0], new RegExp(`MONDE 3 · PARTIE ${l % 3 + 1}`, "i"), `${s} : sur-titre`);
      if (l >= 3) assert.match(pages[0], /Deuxième tour/i, `${s} : « Deuxième tour » en couverture`);
      else assert.doesNotMatch(pages[0], /Deuxième tour/i);
      assert.match(pages[0], /Sur cette carte, il y a \d+ jetons au ?total/);
      assert.match(pages[1], /L'enquête pas à pas/);
      for (const t of ["Je fais le schéma de la situation", "Schéma regroupé", "Je calcule", "J'écris la réponse et je vérifie"])
        assert.match(pages[1], souple(t), `${s}, page 2 : ${t}`);
      assert.match(pages[1], souple(`Je vérifie : ${EXEMPLES_P2[nom]} ✓`), `${s} : l'exemple de la page 2`);
      TITRES[nom].forEach((f, k) => {
        const p = pages[2 + k];
        assert.ok(p.startsWith(`Fiche ${f.code} —`), `${s}, page ${3 + k} : fiche ${f.code} (lu : ${p.slice(0, 40)})`);
        assert.ok(p.replace(/\s/g, "").includes(f.t.replace(/\s/g, "")), `${s}, page ${3 + k} : « ${f.t} »`);
        if (v) assert.match(p, /Correction/, `${s}, page ${3 + k}`);
      });
      assert.match(pages[7], /Et après/);
      assert.match(pages[7], /huit nouvelles/);
      if (nom === "rebondit_tour2") assert.match(pages[7], new RegExp(souple("Un exemple résolu : je double tout").source, "i"));
      else assert.match(pages[7], /Pour se souvenir/i);
      if (v) {
        assert.match(pages[0], /Livret corrigé/);
        assert.doesNotMatch(pages[0], /Nom, prénom/);
        pages.forEach((p, k) => assert.doesNotMatch(p, /professeur/i, `${s}, page ${k + 1} : le corrigé peut être donné aux élèves`));
        assert.match(pages[0], v.endsWith("lettre") ? /inconnue en lettre/ : /inconnue « \? »/);
      } else assert.match(pages[0], /Nom, prénom/);
    }
  });
});

test("la suite du voyage : partie 1 → 2 → 3 → monde 4, et le deuxième tour de même", () => {
  const suite = (l) => norm(texteDesPages(`outils/${SORTIES[l]}.pdf`)[7]);
  assert.match(suite(0), souple("Continue avec la partie 2, Grande enquête"));
  assert.match(suite(1), souple("Continue avec la partie 3, L'enquête rebondit"));
  assert.match(suite(2), souple("monde 4, SPLAT! Système"));
  assert.match(suite(3), souple("partie 2 du deuxième tour"));
  assert.match(suite(4), souple("partie 3 du deuxième tour"));
  assert.match(suite(5), souple("monde 4, SPLAT! Système"));
});

function policesDuPdf(p) {
  const texte = readFileSync(new URL(`../${p}`, import.meta.url)).toString("latin1") + flux(p).join("");
  return new Set([...texte.matchAll(/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([A-Za-z0-9-]+)/g)].map((m) => m[1]));
}

test("en lettre, les initiales des couleurs dans les calculs, jamais un x droit", () => {
  assert.match(render, /unicode-range:U\+1D465/);
  for (const s of SORTIES) {
    assert.ok(!policesDuPdf(`outils/${s}_correction_lettre.pdf`).has("FreeSans"), `${s} : le x droit (FreeSans)`);
    const pages = texteDesPages(`outils/${s}_correction_lettre.pdf`).map(norm);
    for (let k = 2; k < 7; k++) assert.match(pages[k], /(?<![A-Za-z])(N|Vi|O|B|Ve|R) ?= ?\d+/, `${s} en lettre, page ${k + 1}`);
  }
});

// ------------------------------------------------ les cartes rendues (cartes.json)
test("cartes.json : les six livrets, 120 cartes, aucune qui revienne, jamais deux totaux égaux dans une fiche", () => {
  assert.deepEqual(Object.keys(cartes).sort(), [...LIVRETS].sort());
  const cle = ([t, v]) => t + ":" + [...v].sort((a, b) => a - b).join(",");
  const vues = new Map();
  LIVRETS.forEach((nom) => {
    const fiches = cartes[nom].fiches;
    assert.deepEqual(Object.keys(fiches), TITRES[nom].map((f) => `Fiche ${f.code} — ${f.t}`), nom);
    for (const [titre, cs] of Object.entries(fiches)) {
      assert.equal(cs.length, 4, titre);
      assert.equal(new Set(cs.map(([t]) => t)).size, 4, `${titre} : deux totaux égaux`);
      cs.forEach((k) => { assert.ok(!vues.has(cle(k)), `${titre} : carte déjà vue (${vues.get(cle(k))})`); vues.set(cle(k), titre); });
    }
  });
  assert.equal(vues.size, 120);
  // les règles du tri relues sur les cartes : plus petite tache ≥ 5 sur les fiches à deux taches de
  // la base (10-12, 15-17), ≥ 8 sur les grands nombres (14d, 19d, 23d) ; totaux dans leurs bornes
  const toutes = Object.fromEntries(LIVRETS.flatMap((nom) => Object.entries(cartes[nom].fiches).map(([t, cs]) => [t.match(/^Fiche (\S+) —/)[1], cs])));
  for (const c of ["10", "11", "12", "15", "16", "17"]) toutes[c].forEach(([, v]) => assert.ok(Math.min(...v) >= 5, `fiche ${c} : ${v}`));
  for (const c of ["14d", "19d", "23d"]) toutes[c].forEach(([, v]) => assert.ok(Math.min(...v) >= 8, `fiche ${c} : ${v}`));
  [...BASE.map((q, i) => [String(10 + i), q]), ...TOUR2.map((q, i) => [(10 + i) + "d", q])].forEach(([c, q]) => {
    const r = new URLSearchParams(q);
    if (r.get("noTotal") === "1" && r.get("repeat") === null) return;   // sans total : pas de total affiché
    toutes[c].forEach(([t]) => assert.ok(t >= Number(r.get("totalMin")) && t <= Number(r.get("totalMax")), `fiche ${c} : total ${t}`));
  });
  assert.match(render, /def controle_global\(\):/);
  assert.match(render, /raise SystemExit\(f"une carte revient : /);
});

// ------------------------------------------------ les règles des documents du collège
test("logos (décision du 25/09/2026) : aucun sur la couverture, les fiches et la page 2 ; IREMI + maths&go une fois, au dos", () => {
  for (const [nom, t, n] of [["couverture", couv, 0], ["exemple", exemple, 0], ["dos", dos, 1]]) {
    assert.equal((t.match(/logos\/mathsgo\/logo-print\.png/g) || []).length, n, `${nom} : ${n} logo maths&go`);
    assert.equal((t.match(/logos\/irem\/logo-print\.png/g) || []).length, n, `${nom} : ${n} logo IREMI`);
    assert.match(t, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/, nom);
  }
  assert.match(dos, /<div class="logos-bas">/);
  assert.match(dos, /avec l'IREMI de La Réunion/);
  assert.equal((dos.match(/Claire/g) || []).length, 1, "le crédit de Claire, une seule fois, au dos");
  // les fiches sont celles de l'outil, dont on retire les logos au rendu (jamais dans l'outil)
  assert.match(render, /JS_SANS_LOGO = """\(\) => \{\n  const l = document\.querySelectorAll\('\.printArea \.print-page-logos'\);/);
  assert.match(render, /r = await pg\.evaluate\(JS_SANS_LOGO\)/);
  assert.match(render, /PIED_LIVRET = "mathsgo\.re\/splat · CC BY-NC-SA 4\.0"/);
  // noir et blanc : aucun texte framboise sur le blanc
  const css = lire(SRC + "commun.css");
  for (const [nom, t] of [["commun.css", css], ["couverture", couv], ["exemple", exemple], ["dos", dos]])
    assert.doesNotMatch(t.replace(/\/\*[\s\S]*?\*\//g, ""), /(?:^|[;{])color:#(?:be185d|d23f7c|f0abc9)/i, `${nom} : pas de texte framboise sur fond blanc`);
});

test("le vocabulaire des livrets — jeton, tache, schéma en barres ; jamais « tableau » ni un nom de forme", () => {
  const readme = lire(SRC + "README.md");
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple], ["dos", dos], ["README", readme], ["render.py", render]]) {
    assert.doesNotMatch(t, /tableau/i, `${nom} : pas de « tableau »`);
    assert.doesNotMatch(t, /\brond|\bdisque|\bcercle/i, `${nom} : pas de nom de forme`);
  }
  assert.ok(dos.includes("les taches <b>ne cachent pas le même nombre de jetons</b>"));
});

// ------------------------------------------------ la page des livrets
const pageLivrets = lire("outils/livrets_splat.html");
function panneau(n) {
  const debut = pageLivrets.indexOf(`<section class="panneau" data-m="${n}" id="monde-${n}"`);
  assert.ok(debut > 0, `panneau du monde ${n} introuvable`);
  return pageLivrets.slice(debut, pageLivrets.indexOf("</section>", debut));
}
const articles = (p) => p.split('<article class="liv">').slice(1).map((a) => a.slice(0, a.indexOf("</article>")));

test("page des livrets : l'onglet du monde 3 — l'ordre écrit en clair, les trois livrets pour tous, puis le deuxième tour", () => {
  const p = panneau(3);
  assert.ok(p.includes(`role="tabpanel" aria-labelledby="onglet-3" hidden>`));
  assert.ok(p.includes("<h2 class=\"monde-nom\">Monde 3 · SPLAT! Enquête</h2>"));
  assert.match(p, /<p class="ordre">L'ordre&nbsp;: parties 1, 2, 3 pour tous, puis le deuxième tour 1, 2, 3/);
  assert.deepEqual([...p.matchAll(/<h3 class="partie">([^<]+)</g)].map((m) => m[1].trim()), ["Pour tous", "Deuxième tour"]);
  const art = articles(p);
  assert.equal(art.length, 6, "six livrets");
  SORTIES.forEach((s, i) => {
    const d = art[i];
    const eleve = d.indexOf(`href="/outils/${s}.pdf"`), plier = d.indexOf(`href="/outils/${s}_a_plier.pdf"`);
    assert.ok(eleve > 0 && plier > eleve, `${s} : PDF puis « à plier »`);
    const corr = d.slice(d.indexOf('<details class="prof">'), d.indexOf("</details>"));
    assert.match(corr, /<summary>✅ Les corrigés · 2 livrets<\/summary>/);
    for (const v of ["_correction", "_correction_a_plier", "_correction_lettre", "_correction_lettre_a_plier"])
      assert.ok(corr.includes(`href="/outils/${s}${v}.pdf"`) && existe(`outils/${s}${v}.pdf`), `${s}${v}`);
    const nom = s.replace(/_/g, "-").replace("livret-splat-enquete", "livret-splat-enquete");
    const png = `assets/img/thumbnails/splat/${nom}.png`, webp = `assets/img/thumbnails/splat/${nom}.webp`;
    assert.ok(existe(png) && existe(webp), nom);
    assert.ok(taille(webp) < taille(png), `${nom} : la WebP est plus légère`);
    const b = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [993, 1404], `${nom} : page 1 rendue à 120 dpi`);
    assert.ok(d.includes(`src="/assets/img/thumbnails/splat/${nom}.png?v=3"`), `${nom} : sur la page`);
  });
  ["fiches 10 à 14", "fiches 15 à 19", "fiches 20 à 24", "fiches 10d à 14d", "fiches 15d à 19d", "fiches 20d à 24d"]
    .forEach((plage, i) => assert.ok(art[i].includes(`<span class="plage">${plage}</span>`), plage));
  assert.doesNotMatch(pageLivrets, /enquete_(additif|multiplicatif)_defi|enquete-(additif|multiplicatif)-defi/);
  assert.ok(!panneau(4).includes("livret_splat_enquete"), "aucun livret de l'Enquête au monde 4");
});
