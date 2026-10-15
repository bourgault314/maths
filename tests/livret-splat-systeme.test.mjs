/* Les deux livrets « tablette » du monde 4, SPLAT! Système (lot M4-4, 04/10/2026 ; refaits aux
   lots M4-6 et M4-7, 14/10/2026) : « SPLAT! Système » (le livret pour tous, fiches 25 à 28) et
   « SPLAT! Système · cycle 4 » (fiches 25d à 28d, le Bonus du monde 4 sur la carte des mondes ; ses
   fichiers gardent le nom « tour2 »), chacun avec deux corrigés (« avec les taches » et « en
   lettres »).

   Le format, décidé par Gwenaël (lots M4-3 et M4-4) : toutes les pages sont des A4 en LARGEUR ;
   12 pages (1 couverture · 2-3 l'exemple résolu puis « À toi ! » · 4-11 quatre fiches, une fiche
   = 4 cartes sur la double page · 12 le dos) ; le livret à plier = 3 feuilles A3 en HAUTEUR,
   recto verso bord court, pliées à l'horizontale. Les logos : aucun sur la couverture ni la page 2 ;
   au PDF page par page, l'IREMI seul dans le bandeau des fiches ; au livret à plier, aucun logo sur
   les fiches ; au dos, IREMI + maths&go + Unité apprenante Michel Debré.

   Rendus par _sources/livret-splat-systeme/render.py à partir de l'outil du site. On vérifie ici
   les réglages (les mêmes que la carte des mondes), les cartes rendues (cartes.json), les QR, les
   PDF publiés (lus sans outil externe) et la page des livrets. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { inflateSync } from "node:zlib";
import vm from "node:vm";

const lire = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const existe = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const taille = (p) => statSync(new URL(`../${p}`, import.meta.url)).size;

const SRC = "_sources/livret-splat-systeme/";
const render = lire(SRC + "render.py");
const couv = lire(SRC + "couverture.html"), exemple = lire(SRC + "exemple.html"), dos = lire(SRC + "dos.html");
const css = lire(SRC + "commun.css");
const sansCommentaires = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
const py = (nom) => {
  const m = render.match(new RegExp(`^${nom}\\s*=\\s*"([^"]+)"`, "m"));
  assert.ok(m, `${nom} introuvable dans render.py`);
  return m[1];
};
/* une constante de render.py écrite comme une somme de morceaux ("..." + V0 + T + "...") */
const T = py("T"), T2 = py("T2"), V0 = py("V0");
const morceau = (x) => (x === "T" ? T : x === "T2" ? T2 : x === "V0" ? V0 : JSON.parse(x));
const pyQ = (nom) => {
  const m = render.match(new RegExp(`^${nom} = (.+)$`, "m"));
  assert.ok(m, `${nom} introuvable dans render.py`);
  return m[1].split(" + ").map(morceau).join("");
};
// un titre de render.py tel qu'il s'affiche (« \u00a0 » : l'espace insécable avant « ? »)
const titrePy = (t) => t.replace(/\\u00a0/g, "\u00a0");
const sansInsecable = (t) => t.replace(/\u00a0/g, " ");

// la carte des mondes, exécutée : les adresses des fiches (SYS_FICHES, SYS_TOUR2)
const univers = lire("outils/splat_univers.html");
const ctx = vm.createContext({ encodeURIComponent });
vm.runInContext(univers.slice(univers.indexOf("const PS="), univers.indexOf("const PROF =")) +
  ";globalThis.X={SYS_FICHES,SYS_TOUR2};", ctx);
const { SYS_FICHES, SYS_TOUR2 } = JSON.parse(JSON.stringify(ctx.X));

const LIVRETS = [
  // livret 1 refait au lot M4-6 (14/10/2026) : vignette ?v=5 ; livret 2 (cycle 4) refait au lot
  // M4-7 : vignette ?v=5
  { nom: "systeme", sortie: "livret_splat_systeme", codes: ["25", "26", "27", "28"],
    titres: ["Je retire", "Je remplace", "J'additionne", "À toi de choisir"], sur: "MON LIVRET · MONDE 4", v: 5 },
  { nom: "tour2", sortie: "livret_splat_systeme_tour2", codes: ["25d", "26d", "27d", "28d"],
    titres: ["Je recopie, puis je retire", "Deux fois ou trois fois\u00a0?", "Deux gestes à la suite", "À toi de choisir"],
    sur: "MON LIVRET · MONDE 4 · BONUS", v: 5 },
];
const VERSIONS = ["", "_correction", "_correction_lettre"];

test("Système : les huit fiches de render.py sont exactement celles de la carte des mondes, avec leurs types", () => {
  assert.equal(py("SYS_COMMUN"), "&cards=4&unknown=question");
  const S = ["S25", "S26", "S27", "S28"].map(pyQ), SD = ["S25D", "S26D", "S27D", "S28D"].map(pyQ);
  assert.deepEqual(S, SYS_FICHES.map((f) => f.q));
  assert.deepEqual(SD, SYS_TOUR2.map((f) => f.q));
  assert.deepEqual(SYS_FICHES.map((f) => f.t), LIVRETS[0].titres);
  assert.deepEqual(SYS_TOUR2.map((f) => [f.code, f.t]), LIVRETS[1].codes.map((c, i) => [c, LIVRETS[1].titres[i]]));
  // l'ordre des fiches dans chaque livret, et leurs titres (les mêmes que la carte)
  const fiches = [...render.matchAll(/fiche\("(\d+d?)", "([^"]+)", (S\d\dD?), "[^"]+"\)/g)].map((m) => [m[1], titrePy(m[2]), m[3]]);
  assert.deepEqual(fiches, [...LIVRETS[0].codes, ...LIVRETS[1].codes].map((c, i) => [c, [...LIVRETS[0].titres, ...LIVRETS[1].titres][i], "S" + c.toUpperCase()]));
  // le type de chaque carte, vérifié au rendu (render.py s'arrête si une graine a bougé)
  assert.match(render, /"25": \["1b", "1a", "1c", "2a"\], "26": \["1d", "1e", "1d", "2d"\], "27": \["3a", "3b", "3a", "3a\+"\], "28": \["1c", "3a\+", "2d", "3a"\],/);
  assert.match(render, /"25d": \["3c·2"\] \* 4, "26d": \["3c·3", "3c·2", "3c·3", "3c·2"\], "27d": \["4e·1c", "4e·3a", "4e·3c·2", "4e·2d"\],\n    "28d": \["1d", "3b", "3c·3", "4e·3a"\],/);
  // livret 2 (lot M4-7) : le plateau à recopier à droite sur les cartes 2 et 4 de 25d et 26d, un
  // jeton visible sur la carte 1 de 28d seulement, une seule carte réduite permise (27d carte 3)
  assert.match(render, /^A_DROITE = \{"25d": \[False, True, False, True\], "26d": \[False, True, False, True\]\}$/m);
  assert.match(render, /^JETONS = \{"28d": \[True, False, False, False\]\}$/m);
  assert.match(render, /^REDUITE_PERMISE = \{"27d": \{2: 0\.88\}\}$/m);
  assert.match(render, /if e != "1" and not \(i in permis and float\(e\) >= permis\[i\]\):/);
  // ses réglages : totaux 50 à 100, je recopie (2 fois ; 2 ou 3), deux gestes, tout mélangé
  assert.equal(T2, "&totalMin=50&totalMax=100");
  for (const q of SD) assert.match(q, /&totalMin=50&totalMax=100&seed=\d+$/);
  assert.match(SD[0], /^mode=D&geste=RECOPIE&fois=2&ordre=MELANGE&/);
  assert.match(SD[1], /^mode=D&geste=RECOPIE&fois=MIX&ordre=MELANGE&/);
  assert.match(SD[2], /^mode=D&geste=ETAGES&/);
  assert.match(SD[3], /^mode=D&geste=MIX&gestes=EMBOITE1,TROIS,RECOPIE,ETAGES&fois=3&sous=MIROIR&ordre=MELANGE&visibleMin=1&visibleMax=3&/);
  // les réglages du livret 1 (lot M4-6) : 25 trois gestes ; 26 « le double dépasse » (sens=INDICE) ;
  // 27 les trois miroirs (forme=MIX) ; 28 sans désordre ni jeton, deux cartes jumelles par page
  assert.match(S[0], /&geste=MIX&gestes=PARTIELLE,COEF,DOUBLE&/);
  assert.match(S[1], /&gestes=EMBOITE1,ESCALIER,DOUBLE&sens=INDICE&/);
  assert.match(S[2], /&gestes=MIROIR,TROIS&forme=MIX&/);
  assert.match(S[3], /&gestes=COEF,MIROIR,DOUBLE&forme=MIX&sens=INDICE&visibleMin=0&visibleMax=0&/);
  for (const q of S) assert.doesNotMatch(q, /ordre=MELANGE/);
  assert.match(render, /^JUMELLES = \{"28": \[\(0, 1\), \(2, 3\)\]\}$/m);
  assert.match(render, /^DESORDRE = \{"28d"\}$/m);
  assert.match(render, /if etat\["premiers"\]\[a\] != etat\["premiers"\]\[b\]:/);
  // les deux livrets et leurs couvertures
  assert.match(render, /"systeme": dict\(\s*sortie="livret_splat_systeme",\s*fiches=FICHES_1,/);
  assert.match(render, /"tour2": dict\(\s*sortie="livret_splat_systeme_tour2",\s*fiches=FICHES_2,/);
  assert.match(render, /couv=dict\(sur="Mon livret · Monde 4", titre="Système",/);
  assert.match(render, /couv=dict\(sur="Mon livret · Monde 4 · Bonus", titre="Système · cycle&nbsp;4",/);
  // « Le système » sous chaque carte du livret 2 (lot M4-7) : fiches, défi, pages 2 et 3
  assert.match(render, /fiches=FICHES_2,\n        systeme=True,/);
  assert.match(render, /\("&systeme=1" if sys_ else ""\)/);
});

test("Système : les cartes rendues (cartes.json) — 16 par livret, aucune en double, l'exemple et « À toi ! » hors des fiches", () => {
  const cartes = JSON.parse(lire(SRC + "cartes.json"));
  assert.deepEqual(Object.keys(cartes), ["systeme", "tour2"]);
  const cle = (k) => JSON.stringify([k[0], [...k[1]].sort((a, b) => a - b), k[2]]);
  const toutes = [];
  for (const L of LIVRETS) {
    const c = cartes[L.nom];
    assert.deepEqual(Object.keys(c), ["exemple", "atoi", "defi", "fiches"]);
    assert.deepEqual(Object.keys(c.fiches), L.codes);
    for (const cs of Object.values(c.fiches)) assert.equal(cs.length, 4);
    toutes.push(...Object.values(c.fiches).flat(), c.exemple, c.atoi, ...c.defi);
  }
  assert.equal(new Set(toutes.map(cle)).size, toutes.length, "deux cartes identiques dans les livrets");
  // l'exemple du livret 1 : 2 noires + 3 bleues = 42 ; 2 noires + 1 bleue = 30 (noire 12, bleue 6)
  assert.deepEqual(cartes.systeme.exemple, [42, [6, 6, 6, 12, 12], [[[2, 3], 42, []], [[2, 1], 30, []]]]);
  // l'exemple du livret 2 (lot M4-7) : je recopie 2 fois — 1 noire + 3 bleues = 58 ;
  // 2 noires + 1 bleue = 46 (noire 16, bleue 14)
  assert.deepEqual(cartes.tour2.exemple, [58, [14, 14, 14, 16], [[[1, 3], 58, []], [[2, 1], 46, []]]]);
  // « À toi ! » : la même forme que l'exemple, d'autres nombres
  for (const L of LIVRETS) {
    const forme = (k) => JSON.stringify(k[2].map((p) => p[0]));
    assert.equal(forme(cartes[L.nom].atoi), forme(cartes[L.nom].exemple), `${L.nom} : « À toi ! » a le schéma de l'exemple`);
  }
  // les défis du dos : deux cartes chacun
  assert.equal(cartes.systeme.defi.length, 2);
  assert.equal(cartes.tour2.defi.length, 2);
  // aucun total 69 sur une carte
  for (const k of toutes) for (const p of k[2]) assert.notEqual(p[1], 69);
});

test("Système : QR des fiches ?f=25…28, 25d…28d et des séries ?s=7…14 par la page courte /splat/systeme/livret/", () => {
  assert.equal(py("COURTE"), "/splat/systeme/livret/");
  assert.match(render, /return f"\{SITE\}\{COURTE\}\?f=\{code\}"/);
  assert.match(render, /return f"\{SITE\}\{COURTE\}\?s=\{s\}"/);
  for (const L of LIVRETS) for (const c of L.codes) assert.ok(existe(`${SRC}qr/fiche${c}.png`), `qr/fiche${c}.png`);
  // les QR des livrets du 25/09 (jamais distribués : monde en préparation) sont partis
  for (const n of [29, 30, 31, 32, 33, 34]) assert.ok(!existe(`${SRC}qr/fiche${n}.png`), `qr/fiche${n}.png`);
  for (const s of [1, 2, 3, 4, 5, 6]) assert.ok(!existe(`${SRC}qr/serie-${s}.png`), `qr/serie-${s}.png`);
  const SERIES = Object.fromEntries([...render.matchAll(/^    (\d+): (.+),$/gm)]
    .map((m) => [m[1], m[2].split(" + ").map(morceau).join("")]));
  assert.deepEqual(Object.keys(SERIES), ["7", "8", "9", "10", "11", "12", "13", "14"]);
  // la série 13 : le défi du livret 1 (lot M4-6), les deux cartes du défi sont ses deux premières
  assert.equal(SERIES["13"], "mode=D&geste=RECOPIE&fois=MIX" + V0 + T);
  assert.match(render, /^DEFI_1 = \[dict\(q=SERIES\[13\] \+ "&seed=3", n=2, types=\["3c·2", "3c·3"\]\)\]$/m);
  assert.match(render, /defi_qr=13\),/);
  // la série 14 : le défi du livret 2 (lot M4-7) — je recopie 4 fois ; deux gestes, le double
  // dépasse — en désordre ; les deux cartes du défi sont ses deux premières
  assert.equal(SERIES["14"], "mode=D&geste=MIX&gestes=RECOPIE,ETAGES&fois=4&sous=DOUBLE&indice=12&sens=INDICE&ordre=MELANGE" + V0 + T2);
  assert.match(render, /^DEFI_2 = \[dict\(q=SERIES\[14\] \+ "&seed=21", n=2, types=\["3c·4", "4e·2d"\]\)\]$/m);
  assert.match(render, /defi_qr=14\),/);
  // les séries du livret 2 (10 à 12, 14) : totaux 50 à 100
  assert.equal(SERIES["10"], "mode=D&geste=RECOPIE&fois=MIX" + V0 + T2);
  assert.equal(SERIES["11"], "mode=D&geste=ETAGES" + V0 + T2);
  for (const [s, q] of Object.entries(SERIES)) {
    assert.ok(existe(`${SRC}qr/serie-${s}.png`), `qr/serie-${s}.png`);
    const r = new URLSearchParams(q);
    assert.equal(r.get("seed"), null, `série ${s} : pas de graine`);
    assert.equal(r.get("totalMax"), ["10", "11", "12", "14"].includes(s) ? "100" : "60", `série ${s} : les totaux des fiches`);
  }
  assert.ok(existe(`${SRC}qr/univers.png`));
  assert.match(render, /^SERIE_CARTES = 4$/m);
  // la page courte, exécutée : fiches, fiches bonus, séries ; hors bornes, la carte des mondes
  const courte = lire("splat/systeme/livret/index.html");
  const cible = (search) => {
    const script = courte.match(/<script>([\s\S]*?)<\/script>/)[1];
    let c = null;
    const window = { location: { search, origin: "https://mathsgo.re", replace: (u) => { c = u; } } };
    new Function("window", "URLSearchParams", "URL", script)(window, URLSearchParams, URL);
    return c.replace("https://mathsgo.re", "");
  };
  for (const [s, q] of Object.entries(SERIES)) {
    const c = cible(`?s=${s}`);
    assert.equal(c, `/splat/classique/?${q}&cards=4&unknown=question&eleve=1`, `?s=${s}`);
    assert.ok(courte.includes(`href="${c.replace(/&/g, "&amp;")}"`), `lien de repli de la série ${s}`);
  }
  SYS_FICHES.forEach((f, i) => assert.equal(cible(`?f=${25 + i}`), `/splat/classique/?${f.q}&cards=4&unknown=question&eleve=1&parcours=sys${25 + i}`));
  SYS_TOUR2.forEach((f) => assert.equal(cible(`?f=${f.code}`), `/splat/classique/?${f.q}&cards=4&unknown=question&eleve=1&parcours=sys${f.code}`));
  for (const x of ["?s=0", "?s=15", "?s=x", "?f=29", "?f=24d", "?f=", ""]) assert.equal(cible(x), "/outils/splat_univers.html#monde-4", x);
});

// ------------------------------------------------------------------- les PDF publiés
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
    try { out.push(inflateSync(b.subarray(s, e)).toString("latin1")); } catch { /* non compressé */ }
    i = e + 9;
  }
  return { brut: b.toString("latin1"), flux: out };
}
function pages(p) {
  const { brut, flux: f } = flux(p);
  const tout = brut + f.join("");
  const n = (tout.match(/\/Type\s*\/Page\b/g) || []).length;
  const boites = [...tout.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
  return { n, boites };
}
function texteDesPages(p) {
  const { flux: f } = flux(p);
  const tables = [];
  for (const s of f) {
    if (!s.includes("begincmap")) continue;
    const t = new Map();
    for (const bloc of s.match(/beginbfchar([\s\S]*?)endbfchar/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
        t.set(m[1].toLowerCase(), String.fromCodePoint(...(m[2].match(/.{4}/g) || []).map((h) => parseInt(h, 16))));
    for (const bloc of s.match(/beginbfrange([\s\S]*?)endbfrange/g) || [])
      for (const m of bloc.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
        const a = parseInt(m[1], 16), z = parseInt(m[2], 16), c = parseInt(m[3], 16);
        for (let k = a; k <= z && k - a < 1024; k++) t.set(k.toString(16).padStart(4, "0"), String.fromCodePoint(c + (k - a)));
      }
    if (t.size) tables.push(t);
  }
  const out = [];
  for (const s of f) {
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
    out.push(texte.replace(/\s+/g, " ").replace(/\uFB01/g, "fi").replace(/\uFB02/g, "fl").replace(/\u00a0/g, " "));
  }
  return out;
}
// l'extracteur colle les mots d'une fin de ligne (une espace peut manquer) et perd parfois des
// glyphes isolés : on cherche des morceaux sûrs
const souple = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, " ?"));

test("Système : 12 pages A4 en largeur (page par page), 6 pages A3 en hauteur (à plier), légers ; les anciens PDF sont partis", () => {
  for (const L of LIVRETS) for (const v of VERSIONS) {
    const f = `outils/${L.sortie}${v}`;
    const p = pages(`${f}.pdf`), a = pages(`${f}_a_plier.pdf`);
    assert.equal(p.n, 12, `${f}.pdf`);
    assert.ok(p.boites.length >= 12 && p.boites.every(([w, h]) => Math.abs(w - 841.89) < 0.5 && Math.abs(h - 595.276) < 0.5), `${f}.pdf : A4 en largeur`);
    assert.equal(a.n, 6, `${f}_a_plier.pdf`);
    assert.ok(a.boites.some(([w, h]) => Math.abs(w - 841.89) < 0.5 && Math.abs(h - 1190.55) < 0.5), `${f}_a_plier.pdf : A3 en hauteur`);
    assert.ok(taille(`${f}.pdf`) < 3_000_000, `${f}.pdf reste léger (qpdf)`);
  }
  // l'imposition « tablette » : (haut, bas) de chaque face, recto puis verso, de la feuille du dehors
  // à celle du milieu — vérifiée par une simulation du pliage (notice du lot)
  assert.match(render, /^IMPOSITION = \[\(12, 1\), \(2, 11\), \(10, 3\), \(4, 9\), \(8, 5\), \(6, 7\)\]$/m);
  // les livrets « suite » et les corrigés 2 par page du 25/09 (jamais distribués) ont quitté le site
  for (const s of ["livret_splat_systeme_suite", "livret_splat_systeme_suite_a_plier", "livret_splat_systeme_suite_correction",
    "livret_splat_systeme_suite_correction_lettre", "livret_splat_systeme_correction_2_par_page", "livret_splat_systeme_correction_lettre_2_par_page"])
    assert.ok(!existe(`outils/${s}.pdf`), `${s}.pdf`);
  assert.ok(!existe("assets/img/thumbnails/splat/livret-splat-systeme-suite.png"));
});

test("Système : dans les PDF — la couverture, l'exemple puis « À toi ! », les fiches sur la double page, le dos", () => {
  for (const L of LIVRETS) for (const v of VERSIONS) {
    const f = `outils/${L.sortie}${v}.pdf`;
    const t = texteDesPages(f);
    assert.equal(t.length, 12, f);
    assert.ok(t[0].includes(L.sur), `${f} : sur-titre (lu : ${t[0].slice(-200)})`);
    assert.match(t[0], /SPLAT! Système/);
    assert.match(t[0], /COMMENT ÇA MARCHE/);
    assert.match(t[0], /DANS CE LIVRET/);
    L.titres.forEach((x) => assert.ok(t[0].includes(sansInsecable(x)), `${f} : sommaire, ${x}`));
    assert.match(t[1], souple("Le système pas à pas"));
    assert.match(t[1], /Je vérifie/);
    assert.match(t[2], /À TOI !/);
    assert.match(t[2], v ? /La même sorte de carte — corrigée/ : /La même sorte de carte/);
    // une fiche = la double page : son titre en haut des deux pages, ses deux cartes par page
    L.codes.forEach((c, k) => {
      for (const j of [3 + 2 * k, 4 + 2 * k]) {
        assert.ok(t[j].startsWith(`Fiche ${c} — ${sansInsecable(L.titres[k])}`), `${f}, page ${j + 1} : fiche ${c} (lu : ${t[j].slice(0, 40)})`);
        // livret 2 (lot M4-7) : « Le système » sous les deux cartes de l'élève, pas dans les corrigés
        if (L.nom === "tour2") assert.equal((t[j].match(/Le système :/g) || []).length, v ? 0 : 2, `${f}, page ${j + 1} : « Le système »`);
        else assert.doesNotMatch(t[j], /Le système :/);
        assert.equal((t[j].match(/TOTAL/g) || []).length >= 4, true, `${f}, page ${j + 1} : deux cartes`);
        if (v) assert.match(t[j], / — Correction/, `${f}, page ${j + 1}`);
      }
    });
    assert.match(t[11], /Et après/);
    assert.match(t[11], v ? /LE DÉFI ! — CORRIGÉ/ : /ENCORE DES CARTES/);
    if (!v) assert.match(t[11], /LE DÉFI !/);
    // le QR du défi (lots M4-6 et M4-7) : au dos des livrets de l'élève seulement
    if (!v) assert.match(t[11], souple("autres défis en ligne"), `${f} : QR du défi`);
    else assert.doesNotMatch(t[11], /autres défis/, `${f} : pas de QR du défi`);
    if (v) {
      assert.match(t[0], /Livret corrigé/);
      assert.match(t[0], v.endsWith("lettre") ? /en lettres/ : /avec les taches/);
      assert.match(t[0], /CORRECTION/);
    } else {
      assert.match(t[0], /Nom, prénom/);
    }
    t.forEach((x, k) => assert.doesNotMatch(x, /professeur/i, `${f}, page ${k + 1} : un corrigé pour tous`));
  }
});

test("Système : le système écrit à côté des barres des corrigés — en mots, en lettres « 3 × N », jamais « 3N »", () => {
  const mots = /\b\d+ (?:noires?|bleues?|vertes?|orange|rouges?|violettes?)(?: \+ (?:\d+ )?(?:noires?|bleues?|vertes?|orange|rouges?|violettes?|\d+))+ = \d+/;
  const lettres = /\b\d+ × (?:N|B|Ve|O|R|Vi)(?: \+ (?:\d+ × )?(?:N|B|Ve|O|R|Vi|\d+))+ = \d+/;
  for (const L of LIVRETS) {
    const ta = texteDesPages(`outils/${L.sortie}_correction.pdf`).join(" ");
    const le = texteDesPages(`outils/${L.sortie}_correction_lettre.pdf`).join(" ");
    // le livret de l'élève : rien d'écrit sur les fiches et au dos (pages 4 à 12) ; la page 2,
    // l'exemple résolu, a le droit (livret 2 : son système, écrit aussi en lettres sur la carte)
    const el = texteDesPages(`outils/${L.sortie}.pdf`).slice(3).join(" ");
    assert.match(ta, mots, `${L.sortie} : « 3 noires + 4 rouges = 53 » dans le corrigé avec les taches`);
    // (livret 2 : « Le système » des pages 2 et 3 s'écrit en lettres dans tous les livrets — c'est
    // ce que l'élève écrit sous ses cartes ; on regarde les fiches et le dos)
    const taFiches = texteDesPages(`outils/${L.sortie}_correction.pdf`).slice(3).join(" ");
    assert.doesNotMatch(taFiches, lettres, `${L.sortie} : pas de lettres dans le corrigé avec les taches`);
    assert.match(le, lettres, `${L.sortie} : « 3 × N + 4 × R = 53 » dans le corrigé en lettres`);
    assert.doesNotMatch(le, mots, `${L.sortie} : pas de mots dans le corrigé en lettres`);
    for (const x of [ta, le]) assert.doesNotMatch(x, /\b\d(?:N|B|Ve|O|R|Vi)\b/, `${L.sortie} : jamais « 3N »`);
    assert.doesNotMatch(el, mots, `${L.sortie} : rien d'écrit dans le livret de l'élève`);
    assert.doesNotMatch(el, lettres);
  }
  // livret 2 (lot M4-7) : page 2, « Le système » rempli sur la carte de l'exemple ; page 3, à
  // remplir (rempli dans les corrigés), et le schéma vide n'écrit pas le système à côté des barres
  const e2 = texteDesPages("outils/livret_splat_systeme_tour2.pdf"), c2 = texteDesPages("outils/livret_splat_systeme_tour2_correction.pdf");
  assert.match(e2[1], souple("Le système :N + 3 × B = 582 × N + B = 46"));
  assert.match(e2[2], /Le système :/);
  assert.doesNotMatch(e2[2], /= 53|= 46/, "page 3 de l'élève : ni le système ni les totaux écrits");
  assert.match(c2[2], souple("Le système :O + 3 × N = 532 × O + N = 46"));
  // le corrigé en lettres : l'inconnue en lettre, mêmes cartes (render.py s'arrête sinon)
  assert.match(render, /dict\(suffixe="_correction_lettre", lettre=True, dit="en lettres"\)/);
  assert.match(render, /return q\.replace\("unknown=question", "unknown=letter"\) if lettre else q/);
});

test("Système : le QR du défi au dos (lot M4-6) — une série du même type, retiré s'il n'y en a pas et dans les corrigés", () => {
  assert.match(dos, /<div class="d-qr"><div class="lib">D'autres défis<em>en ligne<\/em><\/div><img src="" alt=""><\/div>/);
  assert.match(render, /if \(d\.defiQr && !d\.corr\) dq\.querySelector\('img'\)\.setAttribute\('src', d\.defiQr\); else dq\.remove\(\);/);
  assert.match(render, /defiQr=f"\{qrweb\}\/serie-\{d\['defi_qr'\]\}\.png" if d\.get\("defi_qr"\) else None/);
  assert.ok(existe(`${SRC}qr/serie-13.png`));
  assert.ok(existe(`${SRC}qr/serie-14.png`));
});

// ------------------------------------------------------------ les règles des documents du collège
test("Système : les logos page par page — rien sur la couverture ni les pages 2-3, l'IREMI seul sur les fiches, tout au dos", () => {
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple]])
    assert.doesNotMatch(t, /logo-print\.png|logo-iremi|logos\/iremi|alt="IREMI/, `${nom} : aucun logo`);
  // au dos, une fois chacun : IREMI, maths&go, Unité apprenante Michel Debré
  for (const re of [/alt="IREMI La Réunion"/g, /logos\/mathsgo\/logo-print\.png/g, /Unité apprenante/g])
    assert.equal((sansCommentaires(dos).match(re) || []).length, 1, `dos : ${re}`);
  // les fiches : sans logo au livret à plier, l'IREMI seul page par page (on retire au rendu,
  // jamais dans l'outil : une fiche imprimée depuis le générateur garde ses deux logos)
  assert.match(render, /r = await pg\.evaluate\(JS_IREMI_SEUL if iremi else JS_SANS_LOGO\)/);
  assert.match(lire("outils/splat.html"), /print-page-logo-maths/);
  // le QR : une fois par fiche, en haut de sa première page
  assert.match(render, /if \(heads\.length !== 2\) return heads\.length \+ ' bandeaux au lieu de 2';\n\s*\[heads\[0\]\]\.forEach/);
  // le pied, lisible en photocopie
  for (const [nom, t] of [["couverture", couv], ["exemple", exemple], ["dos", dos]])
    assert.match(t, /<footer class="pied">mathsgo\.re\/splat · CC BY-NC-SA 4\.0<\/footer>/, nom);
  assert.match(css, /\.pied\{[^}]*font-size:10px;[^}]*color:#64748b;/);
  assert.match(css, /@page\{size:297mm 210mm;margin:0\}/);
  // le cannelle et l'orange clair ne servent qu'aux fonds : aucun texte clair sur du blanc
  for (const [nom, t] of [["commun.css", css], ["couverture", couv], ["exemple", exemple], ["dos", dos]])
    assert.doesNotMatch(t.replace(/\/\*[\s\S]*?\*\//g, ""), /(?:^|[;{])color:#(?:92400e|b45309|fbe9dc|f59e0b|fb923c)/i, `${nom} : pas de texte cannelle ou orange clair`);
});

test("Système : les crédits du dos — Steve Wyborney, maths&go avec l'IREMI, plus de crédit de progression (07/10/2026)", () => {
  const credits = dos.slice(dos.indexOf('<div class="credits">'));
  assert.match(credits, /Jeu <b>SPLAT!<\/b> créé par <span class="steve">Steve Wyborney<\/span>/);
  assert.match(credits, /Livret et outil <b>SPLAT! Système<\/b> de maths&amp;go, avec l'IREMI de La Réunion\./);
  // le Système est le travail de Gwenaël ; plus de ligne de crédit pour la progression (Gwenaël, 07/10/2026)
  assert.equal((sansCommentaires(couv + exemple + dos).match(/Claire|progression «/g) || []).length, 0);
  assert.match(credits, /avec l'IREMI de La Réunion\.<br>\s*Libre d'être imprimé/);
  for (const L of LIVRETS) {
    const t = texteDesPages(`outils/${L.sortie}.pdf`);
    assert.equal((t.join(" ").match(/Claire/g) || []).length, 0, `${L.sortie} : plus de crédit de progression`);
    assert.match(t[11], /Steve Wyborney/);
  }
});

// ------------------------------------------------------------ la page des livrets
const page = lire("outils/livrets_splat.html");
function panneau(n) {
  const debut = page.indexOf(`<section class="panneau" data-m="${n}" id="monde-${n}"`);
  assert.ok(debut > 0, `panneau du monde ${n}`);
  return page.slice(debut, page.indexOf("</section>", debut));
}
test("page des livrets : l'onglet du monde 4 — le livret et le livret cycle 4, leurs deux corrigés, la vignette en largeur", () => {
  const nav = page.slice(page.indexOf('<nav class="onglets"'), page.indexOf("</nav>"));
  assert.ok(nav.includes('<span class="sr">Monde 4 · </span><span class="etiq">SPLAT! Système</span><span class="fiches">fiches 25 à 28</span>'));
  const p = panneau(4);
  assert.ok(p.includes('<h2 class="monde-nom">Monde 4 · SPLAT! Système</h2>'));
  const art = p.split('<article class="liv">').slice(1);
  assert.equal(art.length, 2);
  LIVRETS.forEach((L, i) => {
    const d = art[i];
    const eleve = d.indexOf(`href="/outils/${L.sortie}.pdf"`), plier = d.indexOf(`href="/outils/${L.sortie}_a_plier.pdf"`);
    assert.ok(eleve > 0 && plier > eleve, `${L.sortie} : PDF puis « à plier »`);
    for (const v of ["_correction", "_correction_a_plier", "_correction_lettre", "_correction_lettre_a_plier"]) {
      assert.ok(d.includes(`href="/outils/${L.sortie}${v}.pdf"`), `${L.sortie}${v} : lien`);
      assert.ok(existe(`outils/${L.sortie}${v}.pdf`), `${L.sortie}${v}.pdf existe`);
    }
    assert.doesNotMatch(d, /2_par_page|_suite/);
    const nom = L.sortie.replace(/_/g, "-");
    const png = `assets/img/thumbnails/splat/${nom}.png`, webp = `assets/img/thumbnails/splat/${nom}.webp`;
    assert.ok(existe(png) && existe(webp), nom);
    assert.ok(taille(webp) < taille(png), `${nom} : la WebP est plus légère`);
    const b = readFileSync(new URL(`../${png}`, import.meta.url));
    assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [1404, 993], `${nom} : page 1 en largeur, rendue à 120 dpi`);
    assert.ok(d.includes(`/assets/img/thumbnails/splat/${nom}.png?v=${L.v}"`), `${nom} : sur la page (?v=5 : les livrets des lots M4-6 et M4-7)`);
  });
  // le livret 2 (lot M4-7) : « Cycle 4 », son corrigé en lettres d'abord
  assert.ok(art[1].includes('<h3>Cycle&nbsp;4</h3>'));
  assert.ok(art[1].indexOf("_tour2_correction_lettre.pdf") < art[1].indexOf("_tour2_correction.pdf"), "livret 2 : en lettres d'abord");
  assert.doesNotMatch(p, /[Dd]euxième tour/);
  assert.match(page, /\[data-m="4"\]\{--c:#92400e;/);
  assert.match(page, /\.liv \.couv\.paysage\{max-width:280px\}/);
});
